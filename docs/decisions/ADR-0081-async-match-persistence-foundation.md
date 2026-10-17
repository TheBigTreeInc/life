# ADR-0081 — Additive asynchronous match persistence foundation

**Status:** Accepted for schema foundation only (not deployment authorization)

v0.5.81 adds LoopRD SQL models for game-owned matches, account-scoped participants, immutable action journal, checkpoints, and notification outbox. Legacy `Room`, `Pulse`, `/session`, and standalone saves remain unchanged. New tables must be created by the standard DAPI schema reconciliation during a controlled backup-first upgrade; no `DROP`, TTL deletion, or table rename is authorized. Schema v3 is not proof of operational transactional guarantees.

The API is intentionally **not enabled**: DAPI transaction/index behavior, verified Social issuer/subject grants, revision compare-and-swap, action+outbox atomicity, rules evaluator, and idempotency uniqueness must be implemented and tested first. Application-level uniqueness constraints `(matchId, seatId)`, `(matchId, revisionAfter)`, `(matchId, actorIssuer, actorSubject, idempotencyKey)`, `(matchId, revision)` for checkpoints and `(matchId, turnIndex, recipientIssuer, recipientSubject, eventType)` for notification intents are REQUIRED before any new matches can be created. The current model DSL does not yet express composite unique indexes, so these cannot be claimed.

Deadline `dueAtUtc` is nullable and distinct from archival and room TTL. The initial seed and current RNG state are distinct columns. Do not treat a snapshot checksum as authoritative validation.
