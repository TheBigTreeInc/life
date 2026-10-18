import sys, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'server'))
import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker
from async_match_repository import MatchRepository, MatchConflict, MatchNotFound
from async_participants import ParticipantRoster, MembershipRejected
from async_play_api import InternalPlayAPI, PlayAPIRejected
from async_identity import SocialIdentityBoundary

class RosterTests(unittest.TestCase):
    def setUp(self):
        engine=sa.create_engine('sqlite:///:memory:')
        metadata=sa.MetaData()
        sa.Table('GameMatch',metadata,*[sa.Column(n,t,primary_key=(n=='id')) for n,t in {
            'id':sa.String,'status':sa.String,'engineRevision':sa.String,'rulesDigest':sa.String,
            'initialSeed':sa.Integer,'rngState':sa.Integer,'revision':sa.Integer,'turnIndex':sa.Integer,
            'activeSeat':sa.Integer,'dueAtUtc':sa.String,'createdAtUtc':sa.String,'updatedAtUtc':sa.String}.items()])
        sa.Table('GameCheckpoint',metadata,*[sa.Column(n,t,primary_key=(n=='id')) for n,t in {
            'id':sa.String,'matchId':sa.String,'revision':sa.Integer,'turnIndex':sa.Integer,
            'state':sa.JSON,'stateDigest':sa.String,'rngState':sa.Integer,'createdAtUtc':sa.String}.items()])
        sa.Table('GameParticipant',metadata,*[sa.Column(n,t,primary_key=(n=='id')) for n,t in {
            'id':sa.String,'matchId':sa.String,'seatId':sa.String,'issuer':sa.String,'subject':sa.String,
            'role':sa.String,'joinedAtUtc':sa.String}.items()])
        metadata.create_all(engine)
        sf=sessionmaker(engine)
        self.repo=MatchRepository(sf)
        self.repo.create(match_id='m1',engine_revision='e',rules_digest='d',initial_seed=1,
            snapshot={'week':1},rng_state=1,active_seat=0)
        self.roster=ParticipantRoster(sf)
        self.allowed=lambda *args:True

    def join(self,seat=0,issuer='https://social.example',subject='alice',authorize=None,match_id='m1'):
        return self.roster.enroll(match_id=match_id,seat=seat,issuer=issuer,subject=subject,
            authorize=self.allowed if authorize is None else authorize)

    def test_authorization_is_required(self):
        with self.assertRaises(MembershipRejected):self.roster.enroll(match_id='m1',seat=0,issuer='social',subject='alice')
        with self.assertRaises(MembershipRejected):self.join(authorize=lambda *a:False)
        self.assertIsNone(self.roster.participant_seat('m1','social','alice'))

    def test_enroll_and_resume_idempotently(self):
        self.assertFalse(self.join()['alreadyJoined'])
        self.assertTrue(self.join()['alreadyJoined'])
        self.assertEqual(self.roster.participant_seat('m1','https://social.example','alice'),0)
        self.assertEqual(len(self.roster.players('m1')),1)

    def test_duplicate_seat_or_identity_rejected(self):
        self.join()
        with self.assertRaises(MatchConflict):self.join(subject='bob')
        with self.assertRaises(MatchConflict):self.join(seat=1)
        self.assertIsNone(self.roster.participant_seat('m1','https://social.example','bob'))

    def test_match_isolation(self):
        self.join()
        with self.assertRaises(MatchNotFound):self.join(match_id='not-found',seat=1)
        self.assertIsNone(self.roster.participant_seat('another','https://social.example','alice'))

    def test_reject_invalid_seats(self):
        for seat in (-1,True,16,'0'):
            with self.assertRaises(MembershipRejected):self.join(seat=seat)

    def test_internal_api_uses_durable_roster(self):
        self.join()
        boundary=SocialIdentityBoundary(lambda token:{'iss':'https://social.example','aud':'life-play','sub':token},'https://social.example')
        class Commands:
            def process(self,**kwargs):return kwargs
        api=InternalPlayAPI(self.repo,boundary,self.roster.participant_seat,Commands(),lambda state,seat:[{'type':'end_turn'}])
        self.assertEqual(api.inspect(token='alice',match_id='m1')['yourSeat'],0)
        with self.assertRaises(PlayAPIRejected):api.inspect(token='bob',match_id='m1')
        self.assertEqual(api.legal_actions(token='alice',match_id='m1')['actions'],[{'type':'end_turn'}])

if __name__=='__main__':unittest.main()
