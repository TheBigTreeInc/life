import sys, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'server'))
from async_identity import SocialIdentityBoundary, AuthorizedAsyncCommandService, IdentityRejected

class FakeService:
    def __init__(self): self.calls=[]
    def process(self,**kwargs): self.calls.append(kwargs);return {'ok':True}

class IdentityTests(unittest.TestCase):
    def setUp(self):
        self.service=FakeService()
        self.boundary=SocialIdentityBoundary(lambda token: {'iss':'https://social.example','sub':'alice','aud':'life-play'} if token=='valid' else {},'https://social.example')
        self.entry=AuthorizedAsyncCommandService(self.service,self.boundary)
        self.args={'token':'valid','match_id':'game','expected_revision':0,'idempotency_key':'unique','command':{'type':'end_turn'}}
    def test_verified_identity_forwarded_without_client_claims(self):
        self.entry.process(**self.args)
        assert self.service.calls[0]['issuer']=='https://social.example'
        assert self.service.calls[0]['subject']=='alice'
    def test_invalid_token_never_reaches_command_service(self):
        for token in ('', 'invalid',None):
            with self.assertRaises(IdentityRejected):self.entry.process(**(self.args|{'token':token}))
        self.assertEqual(self.service.calls,[])
    def test_audience_and_issuer_mismatch_rejected(self):
        for claims in ({'iss':'wrong','sub':'alice','aud':'life-play'},{'iss':'https://social.example','sub':'alice','aud':'another'}):
            boundary=SocialIdentityBoundary(lambda _t:claims,'https://social.example')
            with self.assertRaises(IdentityRejected):boundary.authenticate('signed-test-token')
    def test_verifier_exception_fails_closed(self):
        def broken(_):raise RuntimeError('offline')
        with self.assertRaises(IdentityRejected):SocialIdentityBoundary(broken,'social').authenticate('present')
if __name__=='__main__':unittest.main()
