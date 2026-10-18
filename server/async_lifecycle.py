"""Internal authoritative match lifecycle; NO public routes or token issuer.

The trusted snapshot_factory must produce a server-created initial state. The
SocialIdentityBoundary must be configured with an actual trusted verifier.
Invite secrets are bearer credentials; transmit only over authenticated TLS.
"""
import hashlib
import hmac
import secrets
import uuid
from datetime import datetime, timedelta, timezone
import sqlalchemy as sa
from async_match_repository import Match, Checkpoint, digest, timestamp, MatchConflict, MatchNotFound
from async_participants import Participant, MembershipRejected

Invitation = sa.table('GameInvitation', *[sa.column(n) for n in (
    'id','matchId','seatId','tokenDigest','createdByIssuer','createdBySubject',
    'expiresAtUtc','redeemedByIssuer','redeemedBySubject','redeemedAtUtc','createdAtUtc')])

class LifecycleRejected(ValueError):
    pass

class MatchLifecycle:
    def __init__(self, session_factory, identity_boundary, snapshot_factory):
        if not callable(snapshot_factory): raise ValueError('Trusted initial state factory required')
        self.session_factory=session_factory
        self.identity=identity_boundary
        self.snapshot_factory=snapshot_factory

    def create(self, *, token, engine_revision, rules_digest, seed, settings=None):
        actor=self.identity.authenticate(token)
        if not isinstance(engine_revision,str) or not engine_revision or not isinstance(rules_digest,str) or not rules_digest:
            raise LifecycleRejected('Pinned rules metadata required')
        if type(seed) is not int or seed<0 or seed>2**32-1: raise LifecycleRejected('Invalid seed')
        if settings is not None and not isinstance(settings,dict): raise LifecycleRejected('Invalid rules settings')
        # Only server-held evaluator/factory can select a state, not the caller.
        initial=self.snapshot_factory(seed, settings or {})
        if not isinstance(initial,dict) or not isinstance(initial.get('snapshot'),dict):
            raise LifecycleRejected('Invalid trusted initial state')
        state=initial['snapshot']; rng=initial.get('rngState')
        if type(rng) is not int: raise LifecycleRejected('Invalid trusted RNG state')
        match_id=str(uuid.uuid4()); now=timestamp()
        with self.session_factory.begin() as db:
            db.execute(sa.insert(Match).values(id=match_id,status='active',engineRevision=engine_revision,
                rulesDigest=rules_digest,initialSeed=seed,rngState=rng,revision=0,
                turnIndex=0,activeSeat='0',dueAtUtc=None,createdAtUtc=now,updatedAtUtc=now))
            db.execute(sa.insert(Checkpoint).values(id=str(uuid.uuid4()),matchId=match_id,
                revision=0,turnIndex=0,state=state,stateDigest=digest(state),rngState=rng,createdAtUtc=now))
            db.execute(sa.insert(Participant).values(id=str(uuid.uuid4()),matchId=match_id,
                seatId='0',issuer=actor.issuer,subject=actor.subject,role='player',joinedAtUtc=now))
        return {'matchId':match_id,'yourSeat':0,'revision':0,'stateDigest':digest(state)}

    def issue_invitation(self, *, token, match_id, seat=1, expires_in_seconds=86400):
        actor=self.identity.authenticate(token)
        if type(seat) is not int or not 1<=seat<=15: raise LifecycleRejected('Invalid invited seat')
        if type(expires_in_seconds) is not int or not 60<=expires_in_seconds<=604800:
            raise LifecycleRejected('Invalid invitation lifetime')
        raw=secrets.token_urlsafe(32)
        token_hash=hashlib.sha256(raw.encode('ascii')).hexdigest()
        expiry=(datetime.now(timezone.utc)+timedelta(seconds=expires_in_seconds)).isoformat()
        with self.session_factory.begin() as db:
            if db.execute(sa.select(Match.c.id).where(Match.c.id==match_id)).first() is None:
                raise MatchNotFound(match_id)
            owner=db.execute(sa.select(Participant.c.id).where((Participant.c.matchId==match_id)&
                (Participant.c.seatId=='0')&(Participant.c.issuer==actor.issuer)&
                (Participant.c.subject==actor.subject)&(Participant.c.role=='player'))).first()
            if owner is None: raise LifecycleRejected('Only match creator can invite')
            occupied=db.execute(sa.select(Participant.c.id).where((Participant.c.matchId==match_id)&
                (Participant.c.seatId==str(seat)))).first()
            if occupied is not None: raise MatchConflict('Seat occupied')
            db.execute(sa.insert(Invitation).values(id=str(uuid.uuid4()),matchId=match_id,
                seatId=str(seat),tokenDigest=token_hash,createdByIssuer=actor.issuer,
                createdBySubject=actor.subject,expiresAtUtc=expiry,redeemedByIssuer=None,
                redeemedBySubject=None,redeemedAtUtc=None,createdAtUtc=timestamp()))
        return {'matchId':match_id,'seat':seat,'invitation':raw,'expiresAtUtc':expiry}

    def join(self, *, token, match_id, invitation):
        actor=self.identity.authenticate(token)
        if not isinstance(invitation,str) or not 32<=len(invitation)<=128:
            raise LifecycleRejected('Invalid invitation')
        token_hash=hashlib.sha256(invitation.encode('utf-8')).hexdigest()
        with self.session_factory.begin() as db:
            # Require exact digest match; never authenticate from an unsigned match ID.
            row=db.execute(sa.select(Invitation).where((Invitation.c.matchId==match_id)&
                (Invitation.c.tokenDigest==token_hash))).mappings().first()
            if row is None or not hmac.compare_digest(row['tokenDigest'],token_hash):
                raise LifecycleRejected('Invitation rejected')
            if row['redeemedAtUtc'] is not None:
                if row['redeemedByIssuer']==actor.issuer and row['redeemedBySubject']==actor.subject:
                    return {'matchId':match_id,'yourSeat':int(row['seatId']),'alreadyJoined':True}
                raise LifecycleRejected('Invitation already redeemed')
            if datetime.fromisoformat(row['expiresAtUtc'].replace('Z','+00:00'))<=datetime.now(timezone.utc):
                raise LifecycleRejected('Invitation expired')
            members=db.execute(sa.select(Participant).where(Participant.c.matchId==match_id)).mappings().all()
            for member in members:
                if member['seatId']==row['seatId']: raise MatchConflict('Seat occupied')
                if member['issuer']==actor.issuer and member['subject']==actor.subject:
                    raise MatchConflict('Account already in match')
            now=timestamp()
            db.execute(sa.insert(Participant).values(id=str(uuid.uuid4()),matchId=match_id,
                seatId=row['seatId'],issuer=actor.issuer,subject=actor.subject,
                role='player',joinedAtUtc=now))
            changed=db.execute(sa.update(Invitation).where((Invitation.c.id==row['id'])&
                (Invitation.c.redeemedAtUtc.is_(None))).values(redeemedByIssuer=actor.issuer,
                redeemedBySubject=actor.subject,redeemedAtUtc=now))
            if changed.rowcount!=1: raise MatchConflict('Concurrent invitation redemption')
        return {'matchId':match_id,'yourSeat':int(row['seatId']),'alreadyJoined':False}

    def resume(self, *, token):
        actor=self.identity.authenticate(token)
        with self.session_factory() as db:
            rows=db.execute(sa.select(Participant.c.matchId,Participant.c.seatId,Match.c.revision,Match.c.status)
                .select_from(Participant.join(Match,Participant.c.matchId==Match.c.id))
                .where((Participant.c.issuer==actor.issuer)&(Participant.c.subject==actor.subject)&
                (Participant.c.role=='player'))).all()
        return sorted([{'matchId':r[0],'yourSeat':int(r[1]),'revision':r[2],'status':r[3]} for r in rows],key=lambda r:r['matchId'])
