"""Direct LoopRD cloud-save contract, real Life JS for CLIENT fixture only.

Tests use disposable Tavi proof responses, NEVER assert production Social login.
Server-side cloud_save_looprd.handle never launches Node or an HTTP backend.
"""
import asyncio
import copy
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker
from starlette.exceptions import HTTPException

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'server'))
from async_identity import SocialIdentityBoundary
from async_match_repository import MatchRepository
from async_lifecycle import MatchLifecycle
from async_state_bridge import TrustedLifeStateBridge
from async_turn_bundle import OneShotTurnEvaluator
from cloud_save_looprd import handle, SCHEMA, _digest
from test_async_end_to_end_094 import schema


class DirectCloudTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.path=Path(self.temp.name)/'game.sqlite3'
        self.reopen(create=True)
        self.accounts={'human':'acct_human','agent':'acct_openclaw','third':'acct_uninvited'}
        identity=SocialIdentityBoundary(lambda token:{'iss':'testing-only-social','sub':self.accounts[token],
            'aud':'life-play'},'testing-only-social')
        bridge=TrustedLifeStateBridge()
        lifecycle=MatchLifecycle(self.sessions,identity,bridge.snapshot_factory)
        created=lifecycle.create(token='human',engine_revision='life-0.5.97', rules_digest='classic',
            seed=411,settings={'ruleset':'classic'},request_id='cloud-test-create-097')
        self.match=created['matchId']
        inv=lifecycle.issue_invitation(token='human',match_id=self.match,seat=1)['invitation']
        lifecycle.join(token='agent',match_id=self.match,invitation=inv)
        self.secrets={'life/cloud-session-key':'cloud-test-private-key-not-production-1234567890'}
        self.redeems=[]

    def reopen(self,create=False):
        self.engine=sa.create_engine('sqlite:///'+str(self.path))
        if create:schema(self.engine)
        self.sessions=sessionmaker(self.engine)
        self.repo=MatchRepository(self.sessions)

    async def call(self,who,op,**fields):
        proof='bearer' if op == 'exchange' else self.sessions_by_account.get(who,'')
        if op == 'commit' and 'expectedDigest' not in fields:
            record = self.repo.read(self.match)
            fields['expectedDigest'] = record['checkpoint']['stateDigest']
            fields['engineRevision'] = record['match']['engineRevision']
        async def tavi_call(component,contract,payload):
            self.assertEqual((component,contract),('looprd-social','tavi-game-grant-redeem'))
            self.assertEqual(payload['gameId'],'life.loop')
            self.redeems.append(payload)
            # Disposable service stub: the actual production LoopRD service
            # enforces single-use grant and service caller permissions.
            if payload['grant'] != f'grant_{who}_test_only_01234567890123456789012345678901234567890':
                return {'accepted':False,'reason':'not_available'}
            return {'accepted':True,'issuer':'testing-only-social',
                'subject':self.accounts[who], 'gameId':'life.loop','matchId':self.match,'scope':'game:identify'}
        ctx=SimpleNamespace(
            body={'schema':SCHEMA,'op':op,'matchId':self.match,**fields},
            request=SimpleNamespace(headers={'authorization':'Bearer '+proof}),
            secret=lambda ref:self.secrets[ref],session_factory=self.sessions,call=tavi_call)
        return await handle(ctx)

    async def exchange(self, who):
        result=await self.call(who,'exchange',grant=f'grant_{who}_test_only_01234567890123456789012345678901234567890')
        self.sessions_by_account[who]=result['session']
        return result

    async def test_two_seats_offline_client_save_revision_retry_and_restart(self):
        self.sessions_by_account={}
        # A Tavi proof is identity only: no member row, no seat.
        with self.assertRaises(HTTPException) as denied:
            await self.exchange('third')
        self.assertEqual(denied.exception.status_code,404)
        await self.exchange('human')
        await self.exchange('agent')
        view=await self.call('human','get')
        self.assertEqual(view['match']['revision'],0)
        self.assertEqual(view['match']['yourSeat'],0)
        self.assertEqual(view['match']['turnOwner'],0)
        state=view['match']['state']
        with self.assertRaises(HTTPException) as wrong:
            await self.call('agent','commit',expectedRevision=0,idempotencyKey='turn-agent-before',state=state)
        self.assertEqual(wrong.exception.status_code,403)
        # A client uses the EXISTING deterministic Life JS engine locally to
        # compute its own completed turn. The LoopRD handler is NOT an evaluator.
        client_result=OneShotTurnEvaluator().replay(state,[{'type':'end_turn'}],view['match']['stateDigest'],0)
        completed=client_result['checkpoint']['state']
        res=await self.call('human','commit',expectedRevision=0,idempotencyKey='turn-human-001',expectedDigest=view['match']['stateDigest'],engineRevision=view['match']['engineRevision'],state=completed)
        self.assertEqual(res['revision'],1)
        self.assertFalse(res['replayed'])
        repeat=await self.call('human','commit',expectedRevision=0,idempotencyKey='turn-human-001',expectedDigest=view['match']['stateDigest'],engineRevision=view['match']['engineRevision'],state=completed)
        self.assertTrue(repeat['replayed'])
        self.assertEqual(repeat['stateDigest'],res['stateDigest'])
        # Same retry key with a contradictory base digest is not an equivalent request.
        with self.assertRaises(HTTPException) as corrupted_base:
            await self.call('human','commit',expectedRevision=0,idempotencyKey='turn-human-001',
                expectedDigest='0'*64,engineRevision=view['match']['engineRevision'],state=completed)
        self.assertEqual(corrupted_base.exception.status_code,409)
        with self.assertRaises(HTTPException) as mismatch:
            await self.call('human','commit',expectedRevision=0,idempotencyKey='turn-human-001',expectedDigest=view['match']['stateDigest'],engineRevision=view['match']['engineRevision'],state={**completed,'seed':completed['seed']+1})
        self.assertEqual(mismatch.exception.status_code,409)
        with self.assertRaises(HTTPException) as stale:
            await self.call('human','commit',expectedRevision=0,idempotencyKey='turn-human-stale',state=completed)
        self.assertEqual(stale.exception.status_code,403)
        # Service/context restart: persist on disk, with no always-online host.
        self.engine.dispose();self.reopen()
        agent_view=await self.call('agent','get')
        self.assertEqual(agent_view['match']['revision'],1)
        self.assertEqual(agent_view['match']['turnOwner'],1)
        following=OneShotTurnEvaluator().replay(agent_view['match']['state'],[{'type':'end_turn'}],agent_view['match']['stateDigest'],1)
        done=await self.call('agent','commit',expectedRevision=1,idempotencyKey='turn-agent-001',state=following['checkpoint']['state'])
        self.assertEqual(done['revision'],2)
        self.assertEqual((await self.call('human','get'))['match']['turnOwner'],0)
        with self.engine.connect() as db:
            self.assertEqual(db.execute(sa.text('SELECT COUNT(*) FROM "GameAction"')).scalar(),2)
            self.assertEqual(db.execute(sa.text('SELECT COUNT(*) FROM "GameCheckpoint"')).scalar(),3)
            self.assertEqual(db.execute(sa.text('SELECT COUNT(*) FROM "GameNotificationOutbox"')).scalar(),2)

    async def test_fail_closed_on_missing_social_or_session_key(self):
        self.sessions_by_account={}
        del self.secrets['life/cloud-session-key']
        with self.assertRaises(HTTPException) as missing:
            await self.exchange('human')
        self.assertEqual(missing.exception.status_code,503)
        self.secrets['life/cloud-session-key']='a'*48
        await self.exchange('human')
        self.sessions_by_account['human']='lcs1.invalid.bad'
        with self.assertRaises(HTTPException) as unsigned:
            await self.call('human','get')
        self.assertEqual(unsigned.exception.status_code,401)

    async def test_client_state_is_not_allowed_to_change_seat_or_identity(self):
        self.sessions_by_account={}
        await self.exchange('human')
        state=(await self.call('human','get'))['match']['state']
        bad=copy.deepcopy(state)
        bad['active']=0
        with self.assertRaises(HTTPException) as invalid:
            await self.call('human','commit',expectedRevision=0,idempotencyKey='turn-invalid-seat',state=bad)
        self.assertEqual(invalid.exception.status_code,422)
        self.assertEqual(self.repo.read(self.match)['match']['revision'],0)

    async def asyncTearDown(self):
        self.engine.dispose();self.temp.cleanup()

if __name__=='__main__':unittest.main()
