import sys, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'server'))
from atrium_launch_contract import AtriumLifeLaunch, LaunchRejected
from async_identity import SocialIdentityBoundary, IdentityRejected

class FakeLife:
    def __init__(self): self.seats={'alice':0,'bob':1}; self.last=None
    def create(self, **kw): self.last=kw; return {'matchId':'match-abc'}
    def issue_invitation(self, **kw): self.last=kw; return {'matchId':kw['match_id'],'invitation':'secret-not-url'}
    def join(self, **kw): self.last=kw; return {'matchId':kw['match_id']}
    def resume(self, **kw): return [{'matchId':'match-abc'}]

class FakePlay:
    def inspect(self, *,token,match_id):
        if token not in ('alice','bob') or match_id != 'match-abc': raise IdentityRejected('No membership')
        return {'matchId':match_id,'yourSeat':0 if token=='alice' else 1,
            'revision':3,'status':'active','activeSeat':1,'turnIndex':2}

class ContractTests(unittest.TestCase):
    def setUp(self):
        self.lifecycle=FakeLife()
        self.identity=SocialIdentityBoundary(lambda t:{'iss':'https://social.test','aud':'life-play','sub':t} if t in ('alice','bob') else {},'https://social.test')
        self.api=AtriumLifeLaunch(self.lifecycle,FakePlay(),self.identity,trusted_client_origin='https://life.test/game/')
    def test_capabilities_do_not_claim_public_or_agent_ready(self):
        data=self.api.capabilities(); self.assertFalse(data['publicPlayApiAvailable']); self.assertFalse(data['agentPlaySupported'])
    def test_create_is_delegated_and_launch_does_not_leak_token(self):
        r=self.api.create(token='alice',seed=1,rules_digest='sha',engine_revision='eng',request_id='request-123')
        self.assertEqual(r['yourSeat'],0); self.assertIn('match=match-abc',r['launchUrl']); self.assertNotIn('alice',str(r)); self.assertNotIn('request-123',str(r))
    def test_join_does_not_echo_invitation(self):
        r=self.api.join(token='bob',match_id='match-abc',invitation='secret-not-url')
        self.assertEqual(r['yourSeat'],1); self.assertNotIn('secret-not-url',str(r))
    def test_invite_secret_is_only_returned_in_private_invite_operation(self):
        r=self.api.invite(token='alice',match_id='match-abc'); self.assertEqual(r['invitation'],'secret-not-url')
    def test_resume_authorizes_again(self):
        self.assertEqual(self.api.resume(token='bob',match_id='match-abc')['yourSeat'],1)
        with self.assertRaises(IdentityRejected):self.api.resume(token='bob',match_id='other')
    def test_list_matches_reauthorizes_each_item(self):
        self.assertEqual(len(self.api.list_matches(token='alice')),1)
    def test_no_unsigned_social_identity(self):
        with self.assertRaises(IdentityRejected):self.api.list_matches(token='mallory')
    def test_reject_insecure_origin(self):
        with self.assertRaises(ValueError): AtriumLifeLaunch(self.lifecycle,FakePlay(),self.identity,trusted_client_origin='http://life.test')
    def test_reject_unsafe_match_locator(self):
        self.api.play_api.inspect=lambda **kw: {'matchId':kw['match_id'],'yourSeat':0,'revision':0,'status':'active','activeSeat':0,'turnIndex':0}
        with self.assertRaises(LaunchRejected): self.api.resume(token='alice',match_id='../admin')
if __name__=='__main__': unittest.main()
