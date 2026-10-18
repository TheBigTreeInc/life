# ADR-0082 — Internal asynchronous match repository

**Status:** Accepted (foundation only)

## Decision
Implement a Life-owned SQLAlchemy repository with transactional match/checkpoint creation and compare-and-swap revision updates, command-history idempotency, and notification-outbox intent creation within the same database transaction. Store canonical JSON SHA-256 digests for replay comparison. Keep the repository an internal trusted interface and **do not expose `/play`** while actor authentication, headless game evaluation, and DAPI deployment constraints remain incomplete. Legacy `/session` remains unmodified.

## Deployment gates
Verify actual DAPI/LoopRD schema and SQLAlchemy sessions; add database uniqueness for (`matchId`, `actorIssuer`, `actorSubject`, `idempotencyKey`), (`matchId`, `revision`) on actions and checkpoints, and `eventId` on outbox. Confirm zero side effects on database conflict/rollback and retry under true concurrent writers. Only the trusted evaluator may supply resulting snapshots, and only verified Social issuer/subject grants may be passed to the repository.
