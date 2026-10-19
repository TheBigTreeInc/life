import sys, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from test_async_lifecycle import LifecycleTests
from async_lifecycle import LifecycleRejected
from async_match_repository import MatchConflict

class HardenedLifecycleTests(LifecycleTests):
    def test_create_retry_same_account(self):
        args=dict(token='alice',engine_revision='pinned',rules_digest='rules',seed=77,request_id='retry-token-abc')
        one=self.service.create(**args)
        two=self.service.create(**args)
        self.assertEqual(one['matchId'],two['matchId'])
        self.assertTrue(two['alreadyCreated'])
        with self.assertRaises(MatchConflict): self.service.create(**(args|{'seed':78}))
        other=self.service.create(**(args|{'token':'bob'}))
        self.assertNotEqual(other['matchId'],one['matchId'])
    def test_invalid_retry_key(self):
        with self.assertRaises(LifecycleRejected):
            self.service.create(token='alice',engine_revision='pinned',rules_digest='rules',seed=1,request_id='x')
    def test_redeem_transaction_rollback_on_membership_failure(self):
        invite=self.service.issue_invitation(token='alice',match_id=self.match)
        self.service.join(token='bob',match_id=self.match,invitation=invite['invitation'])
        with self.assertRaises(LifecycleRejected):self.service.issue_invitation(token='alice',match_id=self.match,seat=2)
        with self.assertRaises(LifecycleRejected):self.service.join(token='charlie',match_id=self.match,invitation=invite['invitation'])

if __name__=='__main__': unittest.main()
