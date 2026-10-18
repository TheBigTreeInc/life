"""Internal durable Life match membership, backed by GameParticipant.

Only trusted match creation/join authorization can call enroll(). This is not an
invitation, bearer-token, or HTTP permission boundary. No browser supplied
issuer/subject may be passed without independent Social verification.
"""
import uuid
import sqlalchemy as sa
from async_match_repository import Match, MatchConflict, MatchNotFound, timestamp

Participant = sa.table('GameParticipant', *[sa.column(n) for n in (
    'id','matchId','seatId','issuer','subject','role','joinedAtUtc')])

class MembershipRejected(ValueError):
    pass

class ParticipantRoster:
    def __init__(self, session_factory):
        self.session_factory = session_factory

    def enroll(self, *, match_id, seat, issuer, subject, role='player', authorize=None):
        """Enroll verified actor by a separately trusted invitation/seat policy.

        The `authorize` callback must be provided by the privileged caller and
        must validate match/seat/principal against a trusted invitation grant.
        """
        if not isinstance(match_id,str) or not match_id.strip():
            raise MembershipRejected('Match ID required')
        if type(seat) is not int or seat < 0 or seat > 15:
            raise MembershipRejected('Invalid seat')
        if not all(isinstance(s,str) and s.strip() for s in (issuer,subject)):
            raise MembershipRejected('Verified identity required')
        if role != 'player':
            raise MembershipRejected('Unsupported membership role')
        if not callable(authorize) or authorize(match_id,seat,issuer,subject) is not True:
            raise MembershipRejected('Trusted enrollment authorization required')
        with self.session_factory.begin() as db:
            if db.execute(sa.select(Match.c.id).where(Match.c.id==match_id)).first() is None:
                raise MatchNotFound(match_id)
            existing=db.execute(sa.select(Participant).where(Participant.c.matchId==match_id)).mappings().all()
            for record in existing:
                if record['issuer']==issuer and record['subject']==subject:
                    if record['seatId']==str(seat) and record['role']==role:
                        return {'matchId':match_id,'seat':seat,'alreadyJoined':True}
                    raise MatchConflict('Account already assigned to another seat')
                if record['seatId']==str(seat):
                    raise MatchConflict('Seat already occupied')
            db.execute(sa.insert(Participant).values(id=str(uuid.uuid4()),matchId=match_id,
                seatId=str(seat),issuer=issuer,subject=subject,role=role,joinedAtUtc=timestamp()))
        return {'matchId':match_id,'seat':seat,'alreadyJoined':False}

    def participant_seat(self,match_id,issuer,subject):
        if not all(isinstance(s,str) and s for s in (match_id,issuer,subject)):
            return None
        with self.session_factory() as db:
            rows=db.execute(sa.select(Participant).where(
                (Participant.c.matchId==match_id)&(Participant.c.issuer==issuer)&
                (Participant.c.subject==subject)&(Participant.c.role=='player'))).mappings().all()
            if len(rows)!=1:
                return None
            try:
                seat=int(rows[0]['seatId'])
                return seat if str(seat)==rows[0]['seatId'] and 0<=seat<=15 else None
            except (ValueError,TypeError):
                return None

    def players(self,match_id):
        """Trusted internal turn ownership lookup, not a public participant listing."""
        with self.session_factory() as db:
            rows=db.execute(sa.select(Participant).where(
                (Participant.c.matchId==match_id)&(Participant.c.role=='player'))).mappings().all()
            return sorted([{'seat':int(x['seatId']),'issuer':x['issuer'],'subject':x['subject']}
                           for x in rows],key=lambda x:x['seat'])
