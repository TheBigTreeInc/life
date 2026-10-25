"""Offline source acceptance for Life/Atrium trusted host contract.

Mock Social and Atrium verifiers here are TEST FIXTURES ONLY, not runtime defaults.
"""
import asyncio
import json
import sys
import tempfile
import unittest
from pathlib import Path

import httpx
import sqlalchemy as sa

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'server'))
from async_runtime import create_runtime
from async_gateway_guard import sign


class HostlessLifeContract(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.database = 'sqlite:///'+str(Path(self.temp.name)/'life.db')
        self.key = '0123456789abcdef0123456789abcdefEXACTTEST'
        self.accepted = False
        self.friendship = True
        self.credentials = {
            'creator':{'iss':'social-test','sub':'acct_1','aud':'life-play'},
            'friend':{'iss':'social-test','sub':'acct_2','aud':'life-play'},
            'stranger':{'iss':'social-test','sub':'acct_3','aud':'life-play'},
        }
        self.reopen()

    def reopen(self):
        def social(token): return self.credentials[token]
        def atrium(token):
            if token != 'trusted-atrium-service': raise ValueError('Not trusted')
            return {'iss':'atrium-test','sub':'atrium-server','aud':'life-atrium-host',
                    'scope':'life.match.manage'}
        def challenge(challenge_id):
            if challenge_id != 123: raise ValueError('Unknown challenge')
            return {'id':123,'issuer':'social-test','sender':'acct_1','recipient':'acct_2',
                    'gameId':'life','status':'accepted' if self.accepted else 'pending',
                    'friendsConfirmed':self.friendship}
        self.app, self.engine = create_runtime(database_url=self.database,
            verify_social=social, social_issuer='social-test', gateway_key=self.key,
            verify_atrium=atrium, atrium_issuer='atrium-test',
            verify_social_challenge=challenge,
            approved_life_deployments=['reviewed-life-001'])

    async def request(self, op, params=None, *, route='/play/host', token='trusted-atrium-service'):
        schema='life.atrium-host/v1' if route == '/play/host' else 'looprd.game-play/v1'
        raw=json.dumps({'schema':schema,'op':op,**(params or {})},separators=(',',':')).encode()
        import time
        now=str(int(time.time()))
        headers={'content-type':'application/json','authorization':'Bearer '+token,
                 'X-Life-Timestamp':now,'X-Life-Signature':sign(self.key,now,'POST',route,raw)}
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=self.app),base_url='https://life.test') as client:
            response=await client.post(route,content=raw,headers=headers)
        return response.status_code,response.json()

    async def host(self, op, **args): return await self.request(op,args)

    def payload(self, **extra):
        return {'lobbyId':'atrium-lobby-100','deploymentId':'reviewed-life-001',
                'creatorIssuer':'social-test','creatorSubject':'acct_1',
                'requestId':'stable-req-100','settings':{'ruleset':'classic'},**extra}

    async def test_hostless_lobby_challenge_seats_turn_restart(self):
        status, created=await self.host('create_match',**self.payload())
        self.assertEqual(status,200,created)
        match=created['result']['matchId']
        self.assertEqual(created['result']['status'],'pending')
        self.assertEqual((await self.host('create_match',**self.payload()))[1]['result']['alreadyCreated'],True)
        self.assertEqual((await self.host('create_match',**self.payload(settings={'ruleset':'modern'})))[0],409)
        self.assertEqual((await self.host('create_match',**self.payload(requestId='second-req-100')))[0],409)
        self.assertEqual((await self.host('admit_seat',matchId=match,lobbyId='atrium-lobby-100',
                                          challengeId=123,recipientSubject='acct_2'))[0],403)
        self.assertEqual((await self.request('get',{'matchId':match},route='/play',token='friend'))[0],404)
        self.accepted=True
        self.friendship=False
        self.assertEqual((await self.host('admit_seat',matchId=match,lobbyId='atrium-lobby-100',
                                          challengeId=123,recipientSubject='acct_2'))[0],403)
        self.friendship=True
        result=await self.host('admit_seat',matchId=match,lobbyId='atrium-lobby-100',challengeId=123,recipientSubject='acct_2')
        self.assertEqual(result[0],200,result)
        self.assertEqual(result[1]['result']['revision'],1)
        self.assertEqual((await self.host('admit_seat',matchId=match,lobbyId='atrium-lobby-100',challengeId=123,recipientSubject='acct_2'))[1]['result']['alreadyJoined'],True)
        self.assertEqual((await self.host('verify_match',matchId=match,lobbyId='wrong-lobby'))[0],404)
        self.assertEqual((await self.host('verify_seat',matchId=match,lobbyId='atrium-lobby-100',subject='acct_3',seat=1))[0],403)
        self.assertEqual((await self.host('can_resume',matchId=match,lobbyId='atrium-lobby-100',subject='acct_2'))[1]['result']['seat'],1)
        self.assertEqual((await self.request('legal_actions',{'matchId':match},route='/play',token='friend'))[1]['result']['actions'],[])
        self.assertEqual((await self.request('end_turn',{'matchId':match,'expectedRevision':1,'idempotencyKey':'wrong-turn'},route='/play',token='friend'))[0],409)
        self.assertEqual((await self.request('end_turn',{'matchId':match,'expectedRevision':1,'idempotencyKey':'creator-turn'},route='/play',token='creator'))[0],200)
        read=await self.request('get',{'matchId':match},route='/play',token='friend')
        self.assertEqual(read[1]['result']['activeSeat'],1)
        self.assertEqual((await self.request('get',{'matchId':match},route='/play',token='stranger'))[0],404)
        self.assertEqual((await self.request('end_turn',{'matchId':match,'expectedRevision':2,'idempotencyKey':'agent-turn'},route='/play',token='friend'))[0],200)
        with self.engine.connect() as c:
            outbox=c.execute(sa.text('SELECT "eventId", "recipientSubject" FROM "GameNotificationOutbox" WHERE "matchId"=:m ORDER BY "turnIndex"'),{'m':match}).all()
            self.assertEqual(len(outbox),3)
            self.assertEqual(len(set(row[0] for row in outbox)),3)
            self.assertEqual([r[1] for r in outbox],['acct_1','acct_2','acct_1'])
        self.engine.dispose()
        self.reopen()
        self.assertEqual((await self.host('create_match',**self.payload()))[1]['result']['revision'],3)
        self.assertEqual((await self.request('get',{'matchId':match},route='/play',token='creator'))[1]['result']['revision'],3)
        self.assertEqual((await self.host('can_resume',matchId=match,lobbyId='atrium-lobby-100',subject='acct_2'))[0],200)

    async def test_client_trusted_cloud_cannot_write_authoritative_game(self):
        created=(await self.host('create_match',**self.payload()))[1]['result']['matchId']
        from cloud_save_looprd import _record
        from starlette.exceptions import HTTPException
        with self.engine.connect() as db:
            with self.assertRaises(HTTPException) as ctx:
                _record(db,created)
            self.assertEqual(ctx.exception.status_code,409)
        with self.engine.connect() as db:
            self.assertEqual(db.execute(sa.text('SELECT COUNT(*) FROM "GameAction" WHERE "matchId"=:m'),{'m':created}).scalar(),0)

    async def test_host_credentials_fenced_and_unapproved(self):
        self.assertEqual((await self.request('create_match',self.payload(),token='creator'))[0],401)
        self.assertEqual((await self.request('create_match',self.payload(),token='bad-atrium'))[0],401)
        self.assertEqual((await self.host('create_match',**self.payload(deploymentId='unknown-life')))[0],403)
        self.assertEqual((await self.host('create_match',**self.payload(creatorSubject='acct_2')))[0],200) # independent verified Atrium service request
        self.assertEqual((await self.host('admit_seat',matchId='not-a-match',lobbyId='atrium-lobby-100',challengeId=123,recipientSubject='acct_2'))[0],403)
        self.assertEqual((await self.request('get',{'matchId':'abc'},route='/play',token='trusted-atrium-service'))[0],401)

    async def asyncTearDown(self):
        self.engine.dispose()
        self.temp.cleanup()


if __name__ == '__main__': unittest.main()
