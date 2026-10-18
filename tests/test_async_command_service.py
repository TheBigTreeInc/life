"""Service boundary tests: source checkpoint, seat guard, revision and persistence."""
import sys, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'server'))
from async_command_service import AsyncCommandService, CommandRejected
from async_match_repository import MatchConflict, digest

class RepositoryStub:
    def __init__(self):
        self.match={'status':'active','revision':0,'activeSeat':'player'}
        self.state={'original':True}
        self.checkpoint={'state':self.state,'stateDigest':digest(self.state)}
        self.writes=[]
    def read(self,match_id):return {'match':self.match.copy(),'checkpoint':self.checkpoint.copy()}
    def replay_if_exists(self,**kwargs):return None
    def commit(self,**kwargs):
        self.writes.append(kwargs)
        self.match['revision']+=1
        return {'revision':self.match['revision']}
class EvaluatorStub:
    def __init__(self):self.calls=[]
    def evaluate(self,state,command,expected_digest):
        self.calls.append((state,command,expected_digest))
        return {'checkpoint':{'state':{'next':True},'rngState':12},'activeSeat':'friend','turnIndex':2}

class ServiceTests(unittest.TestCase):
    def setUp(self):
        self.repo=RepositoryStub();self.evaluator=EvaluatorStub()
        self.service=AsyncCommandService(self.repo,lambda m,i,s:'player' if (i,s)==('social','alice') else None,self.evaluator)
        self.args=dict(match_id='match1',expected_revision=0,issuer='social',subject='alice',idempotency_key='key1',command={'type':'end_turn'})
    def test_trusted_state_is_evaluated_and_committed(self):
        self.assertEqual(self.service.process(**self.args)['revision'],1)
        self.assertEqual(self.evaluator.calls[0][0],{'original':True})
        self.assertEqual(self.repo.writes[0]['resulting_snapshot'],{'next':True})
        self.assertEqual(self.repo.writes[0]['active_seat'],'friend')
    def test_wrong_seat_stale_revision_corrupt_state_do_not_evaluate(self):
        for changes in ({'subject':'mallory'},{'expected_revision':1}):
            with self.assertRaises((CommandRejected,MatchConflict)):
                self.service.process(**(self.args|changes))
        self.repo.checkpoint['stateDigest']='invalid'
        with self.assertRaises(CommandRejected):self.service.process(**self.args)
        self.assertEqual(len(self.evaluator.calls),0)
        self.assertEqual(len(self.repo.writes),0)
if __name__=='__main__':unittest.main()
