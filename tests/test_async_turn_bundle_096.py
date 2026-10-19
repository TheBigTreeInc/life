"""Atomic offline bundle tested with the ACTUAL Life JS engine + persisted SQL.
Test-only identities: this does not establish real Social verification or LoopRD hosting.
"""
import sys
import tempfile
import unittest
from pathlib import Path

import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'server'))
from async_identity import SocialIdentityBoundary
from async_match_repository import MatchConflict, MatchRepository
from async_lifecycle import MatchLifecycle
from async_participants import ParticipantRoster
from async_state_bridge import TrustedLifeStateBridge
from async_turn_bundle import AtomicTurnService, TurnBundleRejected
from test_async_end_to_end_094 import schema


class AtomicTurnTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.path = Path(self.temp.name) / 'match.sqlite3'
        self.open_database(create=True)
        self.issuer = 'test-local-social'
        self.identity = SocialIdentityBoundary(lambda token: {
            'iss': self.issuer, 'sub': {'human': 'human', 'agent': 'openclaw', 'intruder': 'outsider'}[token],
            'aud': 'life-play'}, self.issuer)
        self.bridge = TrustedLifeStateBridge()
        self.lifecycle = MatchLifecycle(self.sessions, self.identity, self.bridge.snapshot_factory)
        created = self.lifecycle.create(token='human', engine_revision='life-0.5.96',
            rules_digest='classic', seed=201, settings={'ruleset': 'classic'}, request_id='offline-test-request-001')
        self.match = created['matchId']
        invitation = self.lifecycle.issue_invitation(token='human', match_id=self.match, seat=1)['invitation']
        self.lifecycle.join(token='agent', match_id=self.match, invitation=invitation)
        self.bind_services()

    def open_database(self, create=False):
        self.engine = sa.create_engine('sqlite:///' + str(self.path))
        if create: schema(self.engine)
        self.sessions = sessionmaker(self.engine)

    def bind_services(self):
        self.repo = MatchRepository(self.sessions)
        self.roster = ParticipantRoster(self.sessions)
        self.turns = AtomicTurnService(self.repo, self.roster.participant_seat, self.roster.players,
                                        engine_revision='life-0.5.96')

    def submit(self, seat='human', key='turn-1', commands=None, revision=0, checksum=None, expected_digest=None):
        return self.turns.submit(match_id=self.match, issuer=self.issuer,
            subject={'human':'human','agent':'openclaw','intruder':'outsider'}[seat],
            expected_revision=revision, idempotency_key=key,
            commands=commands or [{'type':'end_turn'}],
            expected_digest=expected_digest or self.repo.read(self.match)['checkpoint']['stateDigest'],
            client_result_digest=checksum)

    def test_two_seats_one_atomic_revision_retry_wrong_seat_restart(self):
        before = self.repo.read(self.match)
        with self.assertRaises(TurnBundleRejected): self.submit(seat='agent',key='wrong-seat')
        with self.assertRaises(TurnBundleRejected): self.submit(seat='intruder',key='unknown-member')
        with self.assertRaises(TurnBundleRejected): self.submit(key='missing-end', commands=[{'type':'travel','arg':'bank'}])
        with self.assertRaises(TurnBundleRejected): self.submit(key='bad-digest', checksum='0'*64)
        self.assertEqual(self.repo.read(self.match)['match']['revision'], 0)
        legal = self.bridge.legal_actions(before['checkpoint']['state'], 0)
        travel = next(c for c in legal if c['type'] == 'travel')
        full_turn = [travel, {'type': 'end_turn'}]
        result=self.submit(commands=full_turn,expected_digest=before['checkpoint']['stateDigest'])
        self.assertEqual(result['revision'],1)
        self.assertFalse(result['replayed'])
        self.assertTrue(self.submit(commands=full_turn,expected_digest=before['checkpoint']['stateDigest'])['replayed'])
        with self.assertRaises(MatchConflict): self.submit(key='turn-1',commands=[{'type':'action','arg':'fake'},{'type':'end_turn'}])
        with self.assertRaises(MatchConflict): self.submit(key='stale',revision=0,expected_digest=before['checkpoint']['stateDigest'])
        self.assertEqual(self.repo.read(self.match)['match']['activeSeat'], '1')
        # Restart SQL process context, no in-memory match or client host connection.
        self.engine.dispose()
        self.open_database()
        self.bind_services()
        agent=self.submit(seat='agent',key='agent-turn-1',revision=1)
        self.assertEqual(agent['revision'],2)
        self.assertEqual(self.repo.read(self.match)['match']['activeSeat'], '0')
        with self.engine.connect() as db:
            self.assertEqual(db.execute(sa.text('SELECT COUNT(*) FROM "GameAction"')).scalar(),2)
            self.assertEqual(db.execute(sa.text('SELECT COUNT(*) FROM "GameNotificationOutbox"')).scalar(),2)
            self.assertEqual(db.execute(sa.text('SELECT COUNT(*) FROM "GameCheckpoint"')).scalar(),3)

    def test_pinned_engine_mismatch_fails_without_writing(self):
        bad = AtomicTurnService(self.repo, self.roster.participant_seat, self.roster.players,
                                engine_revision='life-0.6.0')
        with self.assertRaises(TurnBundleRejected):
            bad.submit(match_id=self.match,issuer=self.issuer,subject='human',expected_revision=0,
                       idempotency_key='different-engine',commands=[{'type':'end_turn'}],
                       expected_digest=self.repo.read(self.match)['checkpoint']['stateDigest'])
        self.assertEqual(self.repo.read(self.match)['match']['revision'],0)

    def tearDown(self):
        self.engine.dispose()
        self.temp.cleanup()

if __name__=='__main__': unittest.main()
