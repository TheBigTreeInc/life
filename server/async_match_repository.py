"""Life async-match repository foundation (internal; no public /play endpoint).

Call with an SQLAlchemy Session factory or a Session inside a trusted Life service.
No identity verification, JS evaluation, or untrusted network invocation occurs here.
"""
import hashlib
import json
import uuid
from datetime import datetime, timezone
import sqlalchemy as sa


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False)


def digest(value):
    return hashlib.sha256(canonical(value).encode('utf-8')).hexdigest()


def timestamp():
    return datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')


Match = sa.table('GameMatch', *[sa.column(n) for n in (
    'id', 'status', 'engineRevision', 'rulesDigest', 'initialSeed', 'rngState',
    'revision', 'turnIndex', 'activeSeat', 'dueAtUtc', 'createdAtUtc', 'updatedAtUtc')])
Action = sa.table('GameAction', *[sa.column(n) for n in (
    'id', 'matchId', 'revisionBefore', 'revisionAfter', 'turnIndex', 'actorIssuer',
    'actorSubject', 'idempotencyKey', 'commandDigest', 'command', 'resultDigest', 'createdAtUtc')])
Checkpoint = sa.table('GameCheckpoint', *[sa.column(n) for n in (
    'id', 'matchId', 'revision', 'turnIndex', 'state', 'stateDigest', 'rngState', 'createdAtUtc')])
# SQLAlchemy lightweight tables require typed JSON columns for SQLite binding.
Checkpoint.c.state.type = sa.JSON()
Action.c.command.type = sa.JSON()
Outbox = sa.table('GameNotificationOutbox', *[sa.column(n) for n in (
    'id', 'matchId', 'turnIndex', 'recipientIssuer', 'recipientSubject', 'eventId',
    'eventType', 'status', 'attempts', 'lastErrorClass', 'nextDispatchUtc', 'createdAtUtc')])


class MatchConflict(Exception):
    """Stale revision, contradictory replay or conflicting idempotency key."""


class MatchNotFound(Exception):
    pass


class MatchRepository:
    def __init__(self, session_factory):
        self.session_factory = session_factory

    def create(self, *, match_id, engine_revision, rules_digest, initial_seed,
               snapshot, rng_state, active_seat, due_at=None, status='active'):
        """Atomically creates a match and its first checkpoint."""
        if not match_id or not engine_revision or not rules_digest or not isinstance(snapshot, dict):
            raise ValueError('Invalid match metadata')
        now = timestamp()
        with self.session_factory.begin() as db:
            db.execute(sa.insert(Match).values(id=match_id, status=status,
                engineRevision=engine_revision, rulesDigest=rules_digest,
                initialSeed=initial_seed, rngState=rng_state, revision=0,
                turnIndex=0, activeSeat=active_seat, dueAtUtc=due_at,
                createdAtUtc=now, updatedAtUtc=now))
            db.execute(sa.insert(Checkpoint).values(id=str(uuid.uuid4()), matchId=match_id,
                revision=0, turnIndex=0, state=snapshot, stateDigest=digest(snapshot),
                rngState=rng_state, createdAtUtc=now))
        return {'matchId': match_id, 'revision': 0, 'stateDigest': digest(snapshot)}

    def read(self, match_id):
        with self.session_factory() as db:
            match=db.execute(sa.select(Match).where(Match.c.id==match_id)).mappings().first()
            if match is None: raise MatchNotFound(match_id)
            point=db.execute(sa.select(Checkpoint).where(Checkpoint.c.matchId==match_id)
                .order_by(Checkpoint.c.revision.desc()).limit(1)).mappings().first()
            if point is None or point['revision']!=match['revision']:
                raise MatchConflict('Match checkpoint revision does not agree with match revision')
            return {'match':dict(match), 'checkpoint':dict(point)}

    def replay_if_exists(self, *, match_id, issuer, subject, idempotency_key, command):
        """Read original response without requiring the active turn or old revision."""
        with self.session_factory() as db:
            previous=db.execute(sa.select(Action).where(
                (Action.c.matchId==match_id)&(Action.c.actorIssuer==issuer)&
                (Action.c.actorSubject==subject)&(Action.c.idempotencyKey==idempotency_key))).mappings().first()
            if previous is None:return None
            if previous['commandDigest']!=digest(command):
                raise MatchConflict('Idempotency key reused with different command')
            return {'matchId':match_id,'revision':previous['revisionAfter'],
                'resultDigest':previous['resultDigest'],'replayed':True}

    def commit(self, *, match_id, expected_revision, issuer, subject, idempotency_key,
               command, resulting_snapshot, rng_state, turn_index, active_seat,
               due_at=None, outbox=None, status='active'):
        """Persist a *trusted evaluator's* result under a guarded revision CAS.

        A request replay with the same actor/key/command returns the first result;
        the same key with different command fails. The transaction protects
        the match, checkpoint, action and notification intent together.
        """
        if not issuer or not subject or not idempotency_key or not isinstance(command, dict) or not isinstance(resulting_snapshot, dict):
            raise ValueError('Invalid trusted command or identity')
        if not isinstance(expected_revision,int) or expected_revision<0:
            raise ValueError('Invalid expected revision')
        command_hash=digest(command)
        with self.session_factory.begin() as db:
            match=db.execute(sa.select(Match).where(Match.c.id==match_id)).mappings().first()
            if match is None: raise MatchNotFound(match_id)
            previous=db.execute(sa.select(Action).where(
                (Action.c.matchId==match_id)&(Action.c.actorIssuer==issuer)&
                (Action.c.actorSubject==subject)&(Action.c.idempotencyKey==idempotency_key))).mappings().first()
            if previous is not None:
                if previous['commandDigest']!=command_hash:
                    raise MatchConflict('Idempotency key reused with different command')
                return {'matchId':match_id,'revision':previous['revisionAfter'],
                    'resultDigest':previous['resultDigest'],'replayed':True}
            if match['revision']!=expected_revision:
                raise MatchConflict('Stale match revision')
            now=timestamp(); new_revision=expected_revision+1
            changed=db.execute(sa.update(Match).where(
                (Match.c.id==match_id)&(Match.c.revision==expected_revision)).values(
                revision=new_revision,rngState=rng_state,turnIndex=turn_index,
                activeSeat=active_seat,dueAtUtc=due_at,status=status,
                updatedAtUtc=now))
            if changed.rowcount!=1:raise MatchConflict('Concurrent match update')
            result_hash=digest(resulting_snapshot)
            db.execute(sa.insert(Action).values(id=str(uuid.uuid4()),matchId=match_id,
                revisionBefore=expected_revision,revisionAfter=new_revision,turnIndex=turn_index,
                actorIssuer=issuer,actorSubject=subject,idempotencyKey=idempotency_key,
                commandDigest=command_hash,command=command,resultDigest=result_hash,createdAtUtc=now))
            db.execute(sa.insert(Checkpoint).values(id=str(uuid.uuid4()),matchId=match_id,
                revision=new_revision,turnIndex=turn_index,state=resulting_snapshot,
                stateDigest=result_hash,rngState=rng_state,createdAtUtc=now))
            for notice in outbox or ():
                db.execute(sa.insert(Outbox).values(id=str(uuid.uuid4()),matchId=match_id,
                    turnIndex=turn_index,recipientIssuer=notice['issuer'],
                    recipientSubject=notice['subject'],eventId=notice['eventId'],
                    eventType=notice['eventType'],status='pending',attempts=0,
                    lastErrorClass=None,nextDispatchUtc=now,createdAtUtc=now))
            return {'matchId':match_id,'revision':new_revision,'resultDigest':result_hash,'replayed':False}
