import sys, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'server'))
import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker
from async_identity import SocialIdentityBoundary, IdentityRejected
from async_lifecycle import MatchLifecycle, LifecycleRejected, Invitation
from async_match_repository import MatchConflict

class LifecycleTests(unittest.TestCase):
    def setUp(self):
        engine=sa.create_engine('sqlite:///:memory:')
        metadata=sa.MetaData()
        def table(name, types):
            sa.Table(name,metadata,*[sa.Column(n,t,primary_key=(n=='id')) for n,t in types.items()])
        table('GameMatch',dict(id=sa.String,status=sa.String,engineRevision=sa.String,rulesDigest=sa.String,
            initialSeed=sa.Integer,rngState=sa.Integer,revision=sa.Integer,turnIndex=sa.Integer,
            activeSeat=sa.String,dueAtUtc=sa.String,createdAtUtc=sa.String,updatedAtUtc=sa.String))
        table('GameCheckpoint',dict(id=sa.String,matchId=sa.String,revision=sa.Integer,turnIndex=sa.Integer,
            state=sa.JSON,stateDigest=sa.String,rngState=sa.Integer,createdAtUtc=sa.String))
        table('GameParticipant',dict(id=sa.String,matchId=sa.String,seatId=sa.String,issuer=sa.String,
            subject=sa.String,role=sa.String,joinedAtUtc=sa.String))
        table('GameInvitation',dict(id=sa.String,matchId=sa.String,seatId=sa.String,tokenDigest=sa.String,
            createdByIssuer=sa.String,createdBySubject=sa.String,expiresAtUtc=sa.String,
            redeemedByIssuer=sa.String,redeemedBySubject=sa.String,redeemedAtUtc=sa.String,createdAtUtc=sa.String))
        metadata.create_all(engine)
        self.sf=sessionmaker(engine)
        boundary=SocialIdentityBoundary(lambda token:{'iss':'https://social.example','aud':'life-play','sub':token},'https://social.example')
        self.service=MatchLifecycle(self.sf,boundary,lambda seed,settings:{'snapshot':{'seed':seed,'rules':settings},'rngState':seed})
        self.match=self.service.create(token='alice',engine_revision='pinned',rules_digest='rules',seed=42)['matchId']

    def test_creator_seat_atomic_and_resume(self):
        matches=self.service.resume(token='alice')
        self.assertEqual([(m['matchId'],m['yourSeat']) for m in matches],[(self.match,0)])
        self.assertEqual(self.service.resume(token='bob'),[])

    def test_invite_join_replay_and_other_actor_rejection(self):
        issued=self.service.issue_invitation(token='alice',match_id=self.match)
        self.assertEqual(self.service.join(token='bob',match_id=self.match,invitation=issued['invitation'])['yourSeat'],1)
        self.assertTrue(self.service.join(token='bob',match_id=self.match,invitation=issued['invitation'])['alreadyJoined'])
        with self.assertRaises(LifecycleRejected):self.service.join(token='charlie',match_id=self.match,invitation=issued['invitation'])
        self.assertEqual(self.service.resume(token='bob')[0]['yourSeat'],1)

    def test_invitation_only_owner(self):
        with self.assertRaises(LifecycleRejected):self.service.issue_invitation(token='bob',match_id=self.match)
        with self.assertRaises(LifecycleRejected):self.service.join(token='bob',match_id=self.match,invitation='x'*43)

    def test_invitation_only_digest_in_db(self):
        secret=self.service.issue_invitation(token='alice',match_id=self.match)['invitation']
        with self.sf() as db:
            rec=db.execute(sa.select(Invitation)).mappings().first()
            self.assertNotEqual(rec['tokenDigest'],secret)
            self.assertEqual(len(rec['tokenDigest']),64)

    def test_reject_second_seat_and_expiry(self):
        invite=self.service.issue_invitation(token='alice',match_id=self.match)
        self.service.join(token='bob',match_id=self.match,invitation=invite['invitation'])
        with self.assertRaises(MatchConflict):self.service.issue_invitation(token='alice',match_id=self.match,seat=1)
        second=self.service.issue_invitation(token='alice',match_id=self.match,seat=2)
        with self.assertRaises(MatchConflict):self.service.join(token='bob',match_id=self.match,invitation=second['invitation'])
        with self.assertRaises(LifecycleRejected):self.service.issue_invitation(token='alice',match_id=self.match,expires_in_seconds=1)

if __name__=='__main__':unittest.main()
