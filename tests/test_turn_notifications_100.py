import sys
import tempfile
import unittest
from pathlib import Path
import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'server'))
from async_runtime import create_match_tables
from async_match_repository import Outbox
from async_turn_notifications import TurnReadyDispatcher, utc_string


class Notifications(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory()
  self.engine=sa.create_engine('sqlite:///'+str(Path(self.temp.name)/'life.sqlite'))
  create_match_tables(self.engine)
  self.session=sessionmaker(self.engine)
  with self.session.begin() as db:
   db.execute(sa.insert(Outbox).values(id='notice-1',matchId='match-1',turnIndex=4,
    recipientIssuer='social-test',recipientSubject='acct_2',eventId='match-1:turn:4:revision:7',
    eventType='turn_ready',status='pending',attempts=0,lastErrorClass=None,
    nextDispatchUtc=utc_string(),createdAtUtc=utc_string()))
 def tearDown(self):
  self.engine.dispose();self.temp.cleanup()
 def test_retry_dedup_and_restart(self):
  delivered=[]
  def failed(e):
   delivered.append(e);raise RuntimeError('unavailable')
  first=TurnReadyDispatcher(self.session,failed).flush()
  self.assertEqual(first['retried'],1)
  with self.session.begin() as db:
   db.execute(sa.update(Outbox).where(Outbox.c.id=='notice-1').values(nextDispatchUtc=utc_string(-1)))
  def success(e): delivered.append(e);return True
  second=TurnReadyDispatcher(self.session,success).flush()
  self.assertEqual(second['delivered'],1)
  self.assertEqual(len(delivered),2)
  self.assertEqual(delivered[0]['eventId'],delivered[1]['eventId'])
  self.assertEqual(delivered[-1]['recipient']['subject'],'acct_2')
  self.assertEqual(TurnReadyDispatcher(self.session,success).flush()['claimed'],0)
  with self.session() as db:
   self.assertEqual(db.execute(sa.select(Outbox.c.status)).scalar(),'delivered')
 def test_crash_lease_reclaimed_with_same_key(self):
  with self.session.begin() as db:
   db.execute(sa.update(Outbox).values(status='sending',nextDispatchUtc=utc_string(-1)))
  called=[]
  result=TurnReadyDispatcher(self.session,lambda e:called.append(e) or True).flush()
  self.assertEqual(result['delivered'],1)
  self.assertEqual(len(called),1)
 def test_rejected_false_ack(self):
  x=TurnReadyDispatcher(self.session,lambda e:False).flush()
  self.assertEqual(x['retried'],1)

if __name__=='__main__':unittest.main()
