"""SQLite contract tests for Life's internal async repository (no DAPI deployment)."""
import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'server'))
import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker
from async_match_repository import MatchRepository, MatchConflict

class RepositoryTests(unittest.TestCase):
    def setUp(self):
        self.engine=sa.create_engine('sqlite:///:memory:')
        meta=sa.MetaData()
        for name,fields in {
            'GameMatch':dict(id=sa.String,revision=sa.Integer,status=sa.String,engineRevision=sa.String,rulesDigest=sa.String,initialSeed=sa.Integer,rngState=sa.Integer,turnIndex=sa.Integer,activeSeat=sa.String,dueAtUtc=sa.String,createdAtUtc=sa.String,updatedAtUtc=sa.String),
            'GameCheckpoint':dict(id=sa.String,matchId=sa.String,revision=sa.Integer,turnIndex=sa.Integer,state=sa.JSON,stateDigest=sa.String,rngState=sa.Integer,createdAtUtc=sa.String),
            'GameAction':dict(id=sa.String,matchId=sa.String,revisionBefore=sa.Integer,revisionAfter=sa.Integer,turnIndex=sa.Integer,actorIssuer=sa.String,actorSubject=sa.String,idempotencyKey=sa.String,commandDigest=sa.String,command=sa.JSON,resultDigest=sa.String,createdAtUtc=sa.String),
            'GameNotificationOutbox':dict(id=sa.String,matchId=sa.String,turnIndex=sa.Integer,recipientIssuer=sa.String,recipientSubject=sa.String,eventId=sa.String,eventType=sa.String,status=sa.String,attempts=sa.Integer,lastErrorClass=sa.String,nextDispatchUtc=sa.String,createdAtUtc=sa.String),
        }.items():
            sa.Table(name,meta,*[sa.Column(k,t,primary_key=(k=='id')) for k,t in fields.items()])
        meta.create_all(self.engine)
        self.repo=MatchRepository(sessionmaker(self.engine))
        self.repo.create(match_id='m',engine_revision='eng',rules_digest='rules',initial_seed=10,
                         snapshot={'week':1},rng_state=10,active_seat='player')

    def commit(self,**kw):
        data=dict(match_id='m',expected_revision=0,issuer='social',subject='alice',
                  idempotency_key='key-1',command={'type':'end_turn'},
                  resulting_snapshot={'week':2},rng_state=17,turn_index=1,active_seat='friend',
                  outbox=[dict(issuer='social',subject='bob',eventId='m-turn-1',eventType='turn_ready')])
        data.update(kw)
        return self.repo.commit(**data)

    def test_create_and_atomic_action_checkpoint_notification(self):
        result=self.commit();self.assertEqual(result['revision'],1)
        self.assertEqual(self.repo.read('m')['checkpoint']['state'],{'week':2})
        with self.engine.connect() as db:
            for name in ('GameAction','GameNotificationOutbox'):
                self.assertEqual(db.execute(sa.text(f'SELECT count(*) FROM "{name}"')).scalar(),1)

    def test_idempotent_replay_and_conflicting_command(self):
        self.commit();self.assertTrue(self.commit()['replayed'])
        with self.assertRaises(MatchConflict):self.commit(command={'type':'work'})
        with self.engine.connect() as db:
            self.assertEqual(db.execute(sa.text('SELECT count(*) FROM "GameCheckpoint"')).scalar(),2)

    def test_stale_revision_rejected_without_side_effects(self):
        self.commit()
        with self.assertRaises(MatchConflict):self.commit(idempotency_key='key-2')
        self.assertEqual(self.repo.read('m')['match']['revision'],1)

if __name__=='__main__':unittest.main()
