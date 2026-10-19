"""Full local HTTP-over-Unix LoopRD gateway -> Life Node + SQLite rehearsal.

The test verifier is intentionally not a Social production authenticator.
"""
import asyncio
import json
import sys
import tempfile
import time
import unittest
from pathlib import Path
from types import SimpleNamespace

import httpx
import uvicorn
from starlette.applications import Starlette
from starlette.responses import JSONResponse
from starlette.routing import Route
from starlette.exceptions import HTTPException

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'server'))
from async_runtime import create_runtime
from async_looprd_gateway import handle, _endpoint
from async_gateway_guard import sign

KEY = 'temporary-test-gateway-key-32-bytes-minimum'


class GatewayIntegration(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.folder = Path(self.temp.name)
        self.socket = self.folder / 'life.sock'
        self.db = self.folder / 'game.sqlite'
        self.known = {'human': 'human_subject', 'agent': 'agent_subject', 'stranger': 'stranger_subject'}
        self.open_backend()
        await self.start_server()

        async def proxy(request):
            ctx = SimpleNamespace(request=request,
                secret=lambda name: {'life/play-backend': 'unix:' + str(self.socket),
                    'life/play-gateway-key': KEY}[name])
            try:
                result = await handle(ctx)
                return JSONResponse(result)
            except HTTPException as e:
                return JSONResponse({'detail':e.detail}, status_code=e.status_code)
        self.proxy = Starlette(routes=[Route('/looprd/the-life-loop/v1/play/info', proxy, methods=['GET']),
                                     Route('/looprd/the-life-loop/v1/play', proxy, methods=['POST'])])

    async def start_server(self):
        config = uvicorn.Config(app=self.backend, uds=str(self.socket), log_level='error',
                                access_log=False, lifespan='off', timeout_keep_alive=1)
        self.service = uvicorn.Server(config)
        self.task = asyncio.create_task(self.service.serve())
        for _ in range(300):
            if self.socket.exists() and self.service.started:
                break
            await asyncio.sleep(.01)
        self.assertTrue(self.service.started)

    async def restart_server(self):
        self.service.should_exit = True
        await asyncio.wait_for(self.task, 5)
        self.engine.dispose()
        if self.socket.exists():
            self.socket.unlink()
        self.open_backend()
        await self.start_server()

    def open_backend(self):
        def verify(token):
            if token not in self.known:
                raise ValueError('Unknown test token')
            return {'iss':'local-test-only-social', 'sub':self.known[token], 'aud':'life-play'}
        self.backend, self.engine = create_runtime(database_url='sqlite:///' + str(self.db),
            verify_social=verify, social_issuer='local-test-only-social', gateway_key=KEY)

    async def asyncTearDown(self):
        self.service.should_exit = True
        await asyncio.wait_for(self.task, 5)
        self.engine.dispose()
        self.temp.cleanup()

    async def op(self, principal, name, **fields):
        headers={'Authorization': 'Bearer '+principal, 'Content-Type':'application/json'} if principal else {'Content-Type':'application/json'}
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=self.proxy),base_url='https://dapi.test') as http:
            response=await http.post('/looprd/the-life-loop/v1/play', json={'schema':'looprd.game-play/v1','op':name,**fields},headers=headers)
        return response.status_code, response.json()

    async def test_gateway_auth_persist_and_atrium_contract(self):
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=self.proxy),base_url='https://dapi.test') as http:
            info = await http.get('/looprd/the-life-loop/v1/play/info')
        self.assertEqual(info.status_code, 200, info.text)
        result=info.json()
        self.assertEqual(set(result), {'protocol','gameId','component','engine','operations','capabilities'})
        self.assertEqual(result['protocol'], 'looprd.game-play/v1')
        self.assertFalse(result['capabilities']['agentPlaySupported'])
        self.assertEqual(len(result['engine']['digest']), 64)
        self.assertIn('create',result['operations'])

        # Direct bypass of the LoopRD gateway must be rejected.
        async with httpx.AsyncClient(transport=httpx.AsyncHTTPTransport(uds=str(self.socket)),base_url='http://life.local') as http:
            bypass = await http.get('/play/info')
            self.assertEqual(bypass.status_code, 403)
            stale = str(int(time.time()) - 500)
            signed = await http.get('/play/info',headers={'X-Life-Timestamp':stale,
                'X-Life-Signature':sign(KEY,stale,'GET','/play/info',b'')})
            self.assertEqual(signed.status_code, 403)
        self.assertEqual((await self.op('', 'list_matches'))[0], 401)
        self.assertEqual((await self.op('invented', 'list_matches'))[0], 401)
        self.assertEqual((await self.op('human','create',settings={'mode':'private-async'}))[0], 422)
        self.assertEqual((await self.op('human','create', engineRevision='forged', seed=1,
                                         requestId='secure-create-001'))[0],422)
        status, creation=await self.op('human','create', requestId='secure-create-001',
                                     settings={'mode':'private-async','deadlineHours':60,'ruleset':'classic'})
        self.assertEqual(status, 200, creation)
        match=creation['match']['matchId']
        self.assertTrue(creation['match']['yourTurn'])
        status, reused=await self.op('human','create', requestId='secure-create-001',
                                     settings={'mode':'private-async','deadlineHours':60,'ruleset':'classic'})
        self.assertEqual(status, 200, reused)
        self.assertTrue(reused['result']['alreadyCreated'])
        self.assertEqual(reused['match']['matchId'],match)
        self.assertEqual((await self.op('stranger','get',matchId=match))[0],404)
        status, invited=await self.op('human','invite',matchId=match)
        self.assertEqual(status,200,invited)
        status,joined=await self.op('agent','join',invitation=invited['invitation'])
        self.assertEqual(status,200,joined)
        self.assertEqual(joined['match']['matchId'],match)
        self.assertFalse(joined['match']['yourTurn'])
        self.assertEqual((await self.op('human','list_matches'))[1]['matches'][0]['matchId'],match)
        self.assertEqual((await self.op('agent','end_turn',matchId=match,expectedRevision=0,
                                       idempotencyKey='wrong-seat-12345'))[0],409)
        _,legal=await self.op('human','legal_actions',matchId=match)
        self.assertIn({'type':'end_turn'},legal['result']['actions'])
        _,mutated=await self.op('human','end_turn',matchId=match,expectedRevision=0,
                                idempotencyKey='human-end-12345')
        self.assertEqual(mutated['result']['revision'],1)
        self.assertEqual((await self.op('stranger','resume',matchId=match))[0],404)
        self.assertEqual((await self.op('human','end_turn',matchId=match,expectedRevision=0,
                                       idempotencyKey='new-stale-12345'))[0],409)
        _,turn=await self.op('agent','end_turn',matchId=match,expectedRevision=1,
                             idempotencyKey='agent-end-12345')
        self.assertEqual(turn['result']['revision'],2)
        self.assertEqual((await self.op('agent','end_turn',matchId=match,expectedRevision=1,
                                       idempotencyKey='agent-end-12345'))[1]['result']['replayed'],True)
        # Terminate and restart the actual ASGI listener, and rebuild service
        # composition with a new SQL engine from the same persistent file.
        # This is still local acceptance, not a Pi/LoopRD restart.
        await self.restart_server()
        _, resumed=await self.op('human','resume',matchId=match)
        self.assertEqual(resumed['match']['revision'],2)
        self.assertTrue(resumed['match']['yourTurn'])

    async def test_endpoint_rejects_insecure_http(self):
        for name in ('http://backend:8080', 'https://name:pass@backend.example',
                     'https://backend.example/evil', 'unix:/tmp/../life.sock'):
            with self.assertRaises(ValueError):
                _endpoint(name)

if __name__ == '__main__': unittest.main()
