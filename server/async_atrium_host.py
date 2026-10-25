"""Life-owned, durable, fail-closed Atrium lobby integration.

Only a Life-audience verified *server* credential can call these methods. A
separate operator-provisioned Social challenge lookup is mandatory for seat 1.
No browser identity or unsigned Social response is an enrollment proof.
"""
import hashlib
import hmac
import json
import re
import uuid
from datetime import datetime, timedelta, timezone

import sqlalchemy as sa
from sqlalchemy.exc import IntegrityError

from async_match_repository import (Match, Checkpoint, Outbox, MatchConflict,
                                    MatchNotFound, digest, timestamp)
from async_participants import Participant
from async_identity import IdentityRejected

HOST_SCHEMA = 'life.atrium-host/v1'
Binding = sa.table('GameAtriumBinding', *[sa.column(k) for k in (
    'id', 'matchId', 'lobbyId', 'deploymentId', 'creatorIssuer',
    'creatorSubject', 'requestId', 'settingsDigest', 'createdAtUtc')])
Challenge = sa.table('GameSocialChallengeBinding', *[sa.column(k) for k in (
    'id', 'matchId', 'challengeKey', 'challengeId', 'socialIssuer',
    'senderSubject', 'recipientSubject', 'createdAtUtc')])

class HostRejected(ValueError):
    pass

class HostDependencyUnavailable(RuntimeError):
    pass


def _id(value, field, max_length=128, min_length=8):
    if not isinstance(value, str) or len(value) < min_length or len(value) > max_length or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_:.\/-]*', value):
        raise HostRejected('Invalid '+field)
    return value


class AtriumHostContract:
    def __init__(self, sessions, snapshot_factory, *, verify_atrium, atrium_issuer,
                 verify_challenge, social_issuer, approved_deployments,
                 seed_key, engine_revision):
        if not all((callable(snapshot_factory), callable(verify_atrium),
                    callable(verify_challenge), atrium_issuer, social_issuer,
                    approved_deployments, isinstance(seed_key, str) and len(seed_key) >= 32,
                    engine_revision)):
            raise ValueError('Trusted Atrium, Social, deployment and engine configuration required')
        self.sessions, self.snapshot_factory = sessions, snapshot_factory
        self.verify_atrium, self.atrium_issuer = verify_atrium, atrium_issuer
        self.verify_challenge, self.social_issuer = verify_challenge, social_issuer
        self.deployments = frozenset(approved_deployments)
        self.seed_key, self.engine_revision = seed_key, engine_revision

    def authorize(self, credential):
        if not isinstance(credential, str) or not credential:
            raise IdentityRejected('Atrium service credential required')
        try:
            claims = self.verify_atrium(credential)
        except Exception as exc:
            raise IdentityRejected('Atrium service verification failed') from exc
        if not isinstance(claims, dict) or claims.get('iss') != self.atrium_issuer or \
           claims.get('aud') != 'life-atrium-host' or \
           claims.get('scope') != 'life.match.manage' or \
           not isinstance(claims.get('sub'), str) or not claims['sub']:
            raise IdentityRejected('Atrium service audience/scope rejected')
        return claims

    def _binding(self, db, *, match_id=None, lobby_id=None):
        key = Binding.c.matchId == match_id if match_id is not None else Binding.c.lobbyId == lobby_id
        result = db.execute(sa.select(Binding).where(key)).mappings().first()
        if result is None:
            raise MatchNotFound('Unknown Atrium-managed Life match')
        return result

    def _match_response(self, db, match_id):
        row = db.execute(sa.select(Match).where(Match.c.id == match_id)).mappings().first()
        if row is None: raise MatchNotFound('Life match missing')
        return {'matchId':match_id, 'revision':row['revision'], 'status':row['status'],
                'activeSeat':int(row['activeSeat']) if row['activeSeat'] is not None else None,
                'turnIndex':row['turnIndex'], 'dueAtUtc':row['dueAtUtc']}

    def create(self, *, lobby_id, deployment_id, creator_issuer, creator_subject,
               request_id, settings=None):
        lobby_id = _id(lobby_id, 'lobbyId')
        deployment_id = _id(deployment_id, 'deploymentId')
        request_id = _id(request_id, 'requestId')
        creator_issuer = _id(creator_issuer, 'creatorIssuer', 256, 1)
        creator_subject = _id(creator_subject, 'creatorSubject', 256, 1)
        if deployment_id not in self.deployments or creator_issuer != self.social_issuer:
            raise HostRejected('Unapproved Life deployment or Social issuer')
        if settings is None: settings = {}
        if not isinstance(settings, dict) or set(settings)-{'mode','deadlineHours','ruleset','era','goals','jonesDifficulty','rules'}:
            raise HostRejected('Unsupported Life settings')
        if settings.get('mode','private-async') != 'private-async' or settings.get('deadlineHours',60) != 60:
            raise HostRejected('Only private-async 60-hour matches supported')
        game_settings = {k:v for k,v in settings.items() if k not in ('mode','deadlineHours')}
        settings_digest = digest(game_settings)
        match_id = str(uuid.uuid5(uuid.NAMESPACE_URL, 'life-atrium:'+creator_issuer+':'+creator_subject+':'+request_id))
        def checked(db):
            row = db.execute(sa.select(Binding).where((Binding.c.matchId==match_id) |
                (Binding.c.lobbyId==lobby_id))).mappings().first()
            if row is None: return None
            if any(row[field]!=value for field,value in {
                'matchId':match_id,'lobbyId':lobby_id,'deploymentId':deployment_id,
                'creatorIssuer':creator_issuer,'creatorSubject':creator_subject,
                'requestId':request_id,'settingsDigest':settings_digest}.items()):
                raise MatchConflict('Lobby or idempotency key already bound differently')
            return {**self._match_response(db,match_id), 'alreadyCreated':True}
        with self.sessions() as db:
            previous=checked(db)
            if previous: return previous
        material = '\0'.join((lobby_id,creator_issuer,creator_subject,request_id)).encode()
        seed = int.from_bytes(hmac.new(self.seed_key.encode(),material,hashlib.sha256).digest()[:4],'big')
        initial=self.snapshot_factory(seed,game_settings)
        if not isinstance(initial,dict) or not isinstance(initial.get('snapshot'),dict) or type(initial.get('rngState')) is not int:
            raise HostRejected('Life engine failed to create trusted checkpoint')
        now=timestamp()
        try:
            with self.sessions.begin() as db:
                old=checked(db)
                if old: return old
                state=initial['snapshot']
                db.execute(sa.insert(Match).values(id=match_id,status='pending',engineRevision=self.engine_revision,
                    rulesDigest=settings_digest,initialSeed=seed,rngState=initial['rngState'],revision=0,
                    turnIndex=0,activeSeat='0',dueAtUtc=None,createdAtUtc=now,updatedAtUtc=now))
                db.execute(sa.insert(Checkpoint).values(id=str(uuid.uuid4()),matchId=match_id,
                    revision=0,turnIndex=0,state=state,stateDigest=digest(state),rngState=initial['rngState'],createdAtUtc=now))
                db.execute(sa.insert(Participant).values(id=str(uuid.uuid4()),matchId=match_id,seatId='0',
                    issuer=creator_issuer,subject=creator_subject,role='player',joinedAtUtc=now))
                db.execute(sa.insert(Binding).values(id=str(uuid.uuid4()),matchId=match_id,lobbyId=lobby_id,
                    deploymentId=deployment_id,creatorIssuer=creator_issuer,creatorSubject=creator_subject,
                    requestId=request_id,settingsDigest=settings_digest,createdAtUtc=now))
        except IntegrityError as exc:
            # Retry can race on separate workers. The caller retries after a
            # unique-constraint collision rather than receiving a second match.
            with self.sessions() as db:
                old=checked(db)
                if old: return old
            raise MatchConflict('Concurrent Life lobby creation') from exc
        return {'matchId':match_id,'revision':0,'status':'pending','activeSeat':0,
                'turnIndex':0,'dueAtUtc':None,'alreadyCreated':False}

    def admit(self, *, match_id, lobby_id, challenge_id, recipient_subject):
        match_id=_id(match_id,'matchId')
        lobby_id=_id(lobby_id,'lobbyId')
        recipient_subject=_id(recipient_subject,'recipientSubject',256,1)
        if type(challenge_id) is not int or challenge_id <= 0:
            raise HostRejected('Original numeric Social challenge ID required')
        # The trusted lookup fetches this directly from Social, not from an
        # Atrium/client-supplied challenge response or a browser inbox.
        try: proof=self.verify_challenge(challenge_id)
        except Exception as exc: raise HostDependencyUnavailable('Trusted Social challenge lookup unavailable') from exc
        if not isinstance(proof,dict) or proof.get('id') != challenge_id or \
           proof.get('issuer') != self.social_issuer or proof.get('gameId') != 'life' or \
           proof.get('status') != 'accepted' or proof.get('friendsConfirmed') is not True or \
           proof.get('recipient') != recipient_subject:
            raise HostRejected('Social challenge not independently approved')
        challenge_key=hashlib.sha256(f'{self.social_issuer}\0{challenge_id}'.encode()).hexdigest()
        now=timestamp()
        try:
            with self.sessions.begin() as db:
                binding=self._binding(db,match_id=match_id)
                if binding['lobbyId']!=lobby_id or proof.get('sender')!=binding['creatorSubject'] or \
                   recipient_subject==binding['creatorSubject']:
                    raise HostRejected('Challenge sender/recipient or lobby mismatch')
                previous=db.execute(sa.select(Challenge).where((Challenge.c.matchId==match_id) |
                    (Challenge.c.challengeKey==challenge_key))).mappings().first()
                if previous is not None and (previous['matchId']!=match_id or
                    previous['challengeKey']!=challenge_key or previous['recipientSubject']!=recipient_subject):
                    raise MatchConflict('Challenge already bound to another seat/match')
                participants=db.execute(sa.select(Participant).where(Participant.c.matchId==match_id)).mappings().all()
                existing=next((p for p in participants if p['seatId']=='1'),None)
                if existing is not None:
                    if existing['issuer']!=self.social_issuer or existing['subject']!=recipient_subject or previous is None:
                        raise MatchConflict('Seat one already assigned')
                    return {**self._match_response(db,match_id),'seat':1,'alreadyJoined':True}
                if previous is not None:
                    raise MatchConflict('Challenge binding exists without its seat')
                match=db.execute(sa.select(Match).where(Match.c.id==match_id)).mappings().first()
                if match is None or match['status']!='pending' or match['revision']!=0:
                    raise MatchConflict('Match not waiting for accepted friend')
                point=db.execute(sa.select(Checkpoint).where((Checkpoint.c.matchId==match_id)&
                    (Checkpoint.c.revision==0))).mappings().first()
                if point is None: raise MatchConflict('Initial checkpoint missing')
                db.execute(sa.insert(Participant).values(id=str(uuid.uuid4()),matchId=match_id,seatId='1',
                    issuer=self.social_issuer,subject=recipient_subject,role='player',joinedAtUtc=now))
                db.execute(sa.insert(Challenge).values(id=str(uuid.uuid4()),matchId=match_id,
                    challengeKey=challenge_key,challengeId=str(challenge_id),socialIssuer=self.social_issuer,
                    senderSubject=binding['creatorSubject'],recipientSubject=recipient_subject,createdAtUtc=now))
                due=(datetime.now(timezone.utc)+timedelta(hours=60)).isoformat(timespec='seconds').replace('+00:00','Z')
                updated=db.execute(sa.update(Match).where((Match.c.id==match_id)&
                    (Match.c.revision==0)&(Match.c.status=='pending')).values(
                    status='active',revision=1,dueAtUtc=due,updatedAtUtc=now))
                if updated.rowcount != 1: raise MatchConflict('Concurrent seat admission')
                db.execute(sa.insert(Checkpoint).values(id=str(uuid.uuid4()),matchId=match_id,
                    revision=1,turnIndex=0,state=point['state'],stateDigest=point['stateDigest'],
                    rngState=point['rngState'],createdAtUtc=now))
                db.execute(sa.insert(Outbox).values(id=str(uuid.uuid4()),matchId=match_id,turnIndex=0,
                    recipientIssuer=binding['creatorIssuer'],recipientSubject=binding['creatorSubject'],
                    eventId=f'{match_id}:turn:0:revision:1',eventType='turn_ready',status='pending',attempts=0,
                    lastErrorClass=None,nextDispatchUtc=now,createdAtUtc=now))
        except IntegrityError as exc:
            raise MatchConflict('Concurrent enrollment or reused challenge') from exc
        return {'matchId':match_id,'revision':1,'status':'active','activeSeat':0,
                'turnIndex':0,'dueAtUtc':due,'seat':1,'alreadyJoined':False}

    def verify_match(self, *, match_id, lobby_id):
        match_id=_id(match_id,'matchId'); lobby_id=_id(lobby_id,'lobbyId')
        with self.sessions() as db:
            binding=self._binding(db,match_id=match_id)
            if binding['lobbyId']!=lobby_id: raise MatchNotFound('Lobby does not own Life match')
            return {**self._match_response(db,match_id), 'verified':True}

    def verify_seat(self, *, match_id, lobby_id, subject, seat):
        match=self.verify_match(match_id=match_id,lobby_id=lobby_id)
        subject=_id(subject,'subject',256,1)
        if type(seat) is not int or seat not in (0,1): raise HostRejected('Invalid seat')
        with self.sessions() as db:
            member=db.execute(sa.select(Participant.c.id).where((Participant.c.matchId==match_id)&
                (Participant.c.seatId==str(seat))&(Participant.c.issuer==self.social_issuer)&
                (Participant.c.subject==subject)&(Participant.c.role=='player'))).first()
        if member is None: raise HostRejected('Life seat not assigned to principal')
        return {**match,'seat':seat,'verified':True}

    def can_resume(self, *, match_id, lobby_id, subject):
        match=self.verify_match(match_id=match_id,lobby_id=lobby_id)
        for seat in (0,1):
            try:
                verified=self.verify_seat(match_id=match_id,lobby_id=lobby_id,subject=subject,seat=seat)
            except HostRejected:
                continue
            if verified['status']=='active':
                return {'matchId':match_id,'seat':seat,'canResume':True,'revision':verified['revision']}
        raise HostRejected('Match not resumable for Social participant')
