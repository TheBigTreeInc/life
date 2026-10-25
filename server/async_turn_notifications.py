"""Life-owned, retryable Social turn-ready outbox, invoked by operator scheduler.

Delivery is at-least-once. The Social receiver MUST deduplicate by eventId.
No application/browser stays online to run this job. Never send bare tokens.
"""
from datetime import datetime, timezone, timedelta
import sqlalchemy as sa
from async_match_repository import Outbox, Match, timestamp


def utc_string(delta=0):
    return (datetime.now(timezone.utc)+timedelta(seconds=delta)).isoformat(timespec='seconds').replace('+00:00','Z')


class TurnReadyDispatcher:
    def __init__(self, sessions, send_social, *, max_attempts=12, lease_seconds=120):
        if not callable(send_social) or not 1 <= max_attempts <= 100 or not 30 <= lease_seconds <= 3600:
            raise ValueError('Trusted Social notification adapter and bounded retry policy required')
        self.sessions, self.send_social = sessions, send_social
        self.max_attempts, self.lease_seconds = max_attempts, lease_seconds

    def flush(self, limit=30):
        if type(limit) is not int or not 1 <= limit <= 100:
            raise ValueError('Invalid notification batch size')
        counts={'claimed':0,'delivered':0,'retried':0}
        for _ in range(limit):
            now=timestamp()
            with self.sessions.begin() as db:
                # Compare-and-swap lease allows safe recovery when a worker dies.
                row=db.execute(sa.select(Outbox).where((Outbox.c.eventType=='turn_ready')&
                    (Outbox.c.attempts < self.max_attempts)&
                    (Outbox.c.status.in_(['pending','retry','sending']))&
                    (Outbox.c.nextDispatchUtc <= now))
                    .order_by(Outbox.c.createdAtUtc,Outbox.c.id).limit(1)).mappings().first()
                if row is None: break
                attempts=row['attempts']+1
                claimed=db.execute(sa.update(Outbox).where((Outbox.c.id==row['id'])&
                    (Outbox.c.status==row['status'])&(Outbox.c.attempts==row['attempts'])).values(
                    status='sending',attempts=attempts,
                    nextDispatchUtc=utc_string(self.lease_seconds)))
                if claimed.rowcount != 1:
                    continue
            counts['claimed'] += 1
            event={'schema':'life.turn-ready/v1', 'eventId':row['eventId'],
                   'gameId':'life.loop', 'matchId':row['matchId'],
                   'turnIndex':row['turnIndex'], 'recipient':{
                      'issuer':row['recipientIssuer'],'subject':row['recipientSubject']}}
            try:
                sent=self.send_social(event)
                if sent is not True:
                    raise RuntimeError('Social provider did not confirm durable delivery')
            except Exception as exc:
                retry=attempts < self.max_attempts
                # Do not expose provider error text, which may contain secrets.
                error_type=type(exc).__name__[:100]
                with self.sessions.begin() as db:
                    db.execute(sa.update(Outbox).where((Outbox.c.id==row['id'])&
                        (Outbox.c.status=='sending')&(Outbox.c.attempts==attempts)).values(
                        status='retry' if retry else 'failed',lastErrorClass=error_type,
                        nextDispatchUtc=utc_string(min(3600, 30*2**min(attempts,7))) if retry else None))
                counts['retried'] += 1
            else:
                with self.sessions.begin() as db:
                    db.execute(sa.update(Outbox).where((Outbox.c.id==row['id'])&
                        (Outbox.c.status=='sending')&(Outbox.c.attempts==attempts)).values(
                        status='delivered',lastErrorClass=None,nextDispatchUtc=None))
                counts['delivered'] += 1
        return counts
