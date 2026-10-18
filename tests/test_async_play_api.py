import sys, unittest
from pathlib import Path
from types import SimpleNamespace
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'server'))
from async_play_api import InternalPlayAPI, PlayAPIRejected
from async_identity import SocialIdentityBoundary, IdentityRejected

class FakeRepository:
    def read(self, match_id):
        return {'match':{'revision':4,'status':'active','turnIndex':2,'activeSeat':1,
            'dueAtUtc':None,'engineRevision':'engine-v1'},
            'checkpoint':{'state':{'safe':True}}}
class FakeCommand:
    def process(self,**kwargs):
        return kwargs

class InternalPlayAPITests(unittest.TestCase):
    def setUp(self):
        def verify(token):
            if token != 'valid': raise ValueError('bad token')
            return {'iss':'https://social.example','aud':'life-play','sub':'account-1'}
        self.api=InternalPlayAPI(FakeRepository(),
            SocialIdentityBoundary(verify,'https://social.example'),
            lambda match,issuer,subject: 1 if subject=='account-1' else None,
            FakeCommand(),lambda state,seat:[{'type':'end_turn'}])
    def test_authenticated_inspection_no_checkpoint_leak(self):
        result=self.api.inspect(token='valid',match_id='m1')
        self.assertEqual((result['revision'],result['yourSeat']),(4,1))
        self.assertNotIn('checkpoint',result)
    def test_invalid_token_denied(self):
        with self.assertRaises(IdentityRejected): self.api.inspect(token='no',match_id='m1')
    def test_nonparticipant_denied(self):
        self.api.participant_seat=lambda *args: None
        with self.assertRaises(PlayAPIRejected):self.api.inspect(token='valid',match_id='m1')
    def test_legal_actions_require_provider(self):
        self.api.legal_action_provider=None
        with self.assertRaises(PlayAPIRejected):self.api.legal_actions(token='valid',match_id='m1')
    def test_legal_actions_from_authoritative_state(self):
        self.assertEqual(self.api.legal_actions(token='valid',match_id='m1')['actions'],[{'type':'end_turn'}])
    def test_end_turn_delegates_verified_actor(self):
        result=self.api.end_turn(token='valid',match_id='m1',expected_revision=4,idempotency_key='cmd1')
        self.assertEqual(result['subject'],'account-1')
        self.assertEqual(result['command'],{'type':'end_turn'})
    def test_wrong_seat_has_no_legal_actions(self):
        self.api.participant_seat=lambda *args: 0
        self.assertEqual(self.api.legal_actions(token='valid',match_id='m1')['actions'],[])
if __name__=='__main__': unittest.main()
