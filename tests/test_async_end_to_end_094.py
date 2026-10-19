"""Local production-engine contract rehearsal: *not* a live Social or DAPI test."""
import asyncio
import json
import sys
import tempfile
import unittest
from pathlib import Path

import httpx
import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker
import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'server'))
from async_identity import SocialIdentityBoundary
from async_match_repository import MatchRepository
from async_participants import ParticipantRoster
from async_lifecycle import MatchLifecycle
from async_play_api import InternalPlayAPI
from async_command_service import AsyncCommandService
from async_state_bridge import TrustedLifeStateBridge
from async_http_api import create_app, SCHEMA


def schema(engine):
    spec = yaml.safe_load((ROOT / 'looprd.yaml').read_text())
    types = {'integer': sa.Integer, 'string': sa.String, 'json': sa.JSON,
             'boolean': sa.Boolean, 'float': sa.Float, 'datetime': sa.String}
    meta = sa.MetaData()
    for name, definition in spec['models'].items():
        if not name.startswith('Game'):
            continue
        columns = []
        for field, options in definition['fields'].items():
            column_type = types[options['type']]
            if options['type'] == 'string':
                column_type = sa.String(options['maxLength'])
            columns.append(sa.Column(field, column_type, primary_key=options.get('primaryKey', False),
                                     autoincrement=options.get('generated', False),
                                     nullable=not options.get('required', False), unique=options.get('unique', False)))
        sa.Table(name, meta, *columns)
    meta.create_all(engine)


class MultiplayerEndToEnd(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.path = Path(self.temp.name) / 'persist.sqlite3'
        self.engine = sa.create_engine('sqlite:///' + str(self.path))
        schema(self.engine)
        self.sessions = sessionmaker(self.engine)
        self.bridge = TrustedLifeStateBridge()
        # TEST ONLY: these are explicitly mock identities. Never use this
        # verifier in a public deployment or report it as Social proof redemption.
        self.issued = {'human':'acct_human','agent':'acct_openclaw','intruder':'acct_intruder'}
        self.reopen()

    def reopen(self):
        def verified(token):
            if token not in self.issued:
                raise ValueError('Unrecognized test credential')
            return {'iss':'test-social-issuer','sub':self.issued[token],'aud':'life-play'}
        identity = SocialIdentityBoundary(verified, 'test-social-issuer')
        self.repo = MatchRepository(self.sessions)
        roster = ParticipantRoster(self.sessions)
        self.lifecycle = MatchLifecycle(self.sessions, identity, self.bridge.snapshot_factory)
        self.play = InternalPlayAPI(self.repo, identity, roster.participant_seat,
                                    AsyncCommandService(self.repo, roster.participant_seat, participant_players=roster.players), self.bridge.legal_actions)
        self.app = create_app(self.lifecycle, self.play)

    async def op(self, identity, name, **params):
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=self.app),base_url='https://life.test') as client:
            response = await client.post('/play',headers={'Authorization':f'Bearer {identity}'},
                json={'schema':SCHEMA,'op':name,**params})
        return response.status_code,response.json()

    async def test_real_engine_two_seats_replay_reject_restart(self):
        status,create=await self.op('human','create', engineRevision='life-0.5.94',rulesDigest='classic',
                                    seed=1100,settings={'ruleset':'classic'},requestId='two-seats-test-001')
        self.assertEqual(status,200,create)
        match=create['result']['matchId']
        replay_create=(await self.op('human','create',engineRevision='life-0.5.94',rulesDigest='classic',
                          seed=1100,settings={'ruleset':'classic'},requestId='two-seats-test-001'))[1]
        self.assertTrue(replay_create['result']['alreadyCreated'])
        conflict=(await self.op('human','create',engineRevision='life-0.5.94',rulesDigest='classic',
                        seed=1100,settings={'ruleset':'modern'},requestId='two-seats-test-001'))
        self.assertEqual(conflict[0],409)
        abandoned=(await self.op('human','invite',matchId=match,seat=1))[1]['result']['invitation']
        self.assertEqual((await self.op('agent','decline',matchId=match,invitation=abandoned))[0],200)
        self.assertEqual((await self.op('intruder','join',matchId=match,invitation=abandoned))[0],403)
        self.assertEqual((await self.op('human','invite',matchId=match,seat=2))[0],403)
        invite=(await self.op('human','invite',matchId=match,seat=1))
        self.assertEqual(invite[0],200,invite)
        invitation=invite[1]['result']['invitation']
        join=await self.op('agent','join',matchId=match,invitation=invitation)
        self.assertEqual(join[0],200,join)
        self.assertEqual(join[1]['result']['yourSeat'],1)
        self.assertEqual((await self.op('intruder','get',matchId=match))[0],404)
        self.assertEqual((await self.op('agent','end_turn',matchId=match,expectedRevision=0,idempotencyKey='wrongseat1'))[0],409)
        initial=(await self.op('human','get',matchId=match))[1]['result']
        self.assertEqual(initial['state']['settings']['ruleset'],'classic')
        legal=(await self.op('human','legal_actions',matchId=match))[1]['result']['actions']
        self.assertIn({'type':'end_turn'},legal)
        changed=(await self.op('human','act',matchId=match,expectedRevision=0,idempotencyKey='human-action-001', action=legal[0]))
        self.assertEqual(changed[0],200,changed)
        rev=changed[1]['result']['revision']
        self.assertEqual((await self.op('human','end_turn',matchId=match,expectedRevision=0,idempotencyKey='stale-001'))[0],409)
        dup=(await self.op('human','act',matchId=match,expectedRevision=0,idempotencyKey='human-action-001', action=legal[0]))
        self.assertEqual(dup[0],200,dup)
        self.assertTrue(dup[1]['result']['replayed'])
        turn=(await self.op('human','end_turn',matchId=match,expectedRevision=rev,idempotencyKey='human-end-001'))
        self.assertEqual(turn[0],200,turn)
        agent_state=(await self.op('agent','get',matchId=match))[1]['result']
        self.assertEqual(agent_state['activeSeat'],1)
        self.assertEqual((await self.op('human','end_turn',matchId=match,expectedRevision=turn[1]['result']['revision'],idempotencyKey='wrongseat2'))[0],409)
        agent_moves=(await self.op('agent','legal_actions',matchId=match))[1]['result']['actions']
        self.assertIn({'type':'end_turn'}, agent_moves)
        agent_turn=await self.op('agent','end_turn',matchId=match,expectedRevision=agent_state['revision'],idempotencyKey='agent-end-001')
        self.assertEqual(agent_turn[0],200,agent_turn)
        self.assertEqual((await self.op('intruder','legal_actions',matchId=match))[0],404)
        final_rev=agent_turn[1]['result']['revision']
        # Simulate process termination: dispose services and open new SQLite engine.
        self.engine.dispose()
        self.engine=sa.create_engine('sqlite:///'+str(self.path))
        self.sessions=sessionmaker(self.engine)
        self.reopen()
        resumed=(await self.op('human','resume',matchId=match))
        self.assertEqual(resumed[0],200,resumed)
        self.assertEqual(resumed[1]['result']['revision'],final_rev)
        self.assertEqual(resumed[1]['result']['activeSeat'],0)
        self.assertEqual((await self.op('agent','resume',matchId=match))[0],200)
        self.assertEqual((await self.op('intruder','resume',matchId=match))[0],404)
        self.assertEqual((await self.op('intruder','act',matchId=match,expectedRevision=final_rev,idempotencyKey='intruder-key',action={'type':'end_turn'}))[0],404)
        with self.engine.connect() as connection:
            count=connection.execute(sa.text('SELECT COUNT(*) FROM "GameAction" WHERE "matchId"=:m'),{'m':match}).scalar()
            self.assertEqual(count,3)
            notices=connection.execute(sa.text('SELECT COUNT(*) FROM "GameNotificationOutbox" WHERE "matchId"=:m'), {'m':match}).scalar()
            self.assertEqual(notices,2)

    async def asyncTearDown(self):
        self.engine.dispose()
        self.temp.cleanup()

if __name__ == '__main__':
    unittest.main()
