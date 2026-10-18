# ADR-0087 — Durable participant seats for asynchronous Life matches

**Status:** Candidate / not operator-accepted.

`server/async_participants.py` implements the `GameParticipant` model as a read/write participant roster scoped to match and verified Social issuer+subject. Seats are integer 0–15 encoded as canonical strings in the existing service specification. Enrollment is privileged and **must** receive a trusted invitation authorization callback; there is no public invite/join endpoint and no acceptance of browser-provided identity. Duplicate match+seat, match+account assignments are rejected; identical re-enrollment is idempotent. `participant_seat` is directly pluggable into internal `InternalPlayAPI` and `AsyncCommandService`.

**Production blockers:** DAPI schema uniqueness/transaction constraints must guarantee invariants under concurrent inserts; local transaction-based preflight checks alone do not prevent a race across multiple workers. Real Social key/issuer verification and a trusted invitation grant mechanism must be wired before public routes are enabled. Do not expose roster enumeration to untrusted clients. Runtime migration and restart recovery have not been field-tested.

**Priority:** shared Life–Social–Atrium–DAPI async multiplayer work remains the next development program regardless of unrelated ZipRunner scheduling. Preserve the existing operator workboard and all acceptance statuses.
