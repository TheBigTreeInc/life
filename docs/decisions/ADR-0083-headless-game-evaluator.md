# ADR-0083 — Internal headless game evaluator

**Status:** Accepted (foundation only)

## Decision
Use the version-pinned Life JavaScript engine inside a separate Node process to restore a checkpoint without automatically performing a rival turn, verify the expected checkpoint digest, validate a typed travel/action/end-turn command, execute only a legal rule-engine action, and return a canonical state digest and RNG position. The command has no client-controlled resulting snapshot. Replaying the same input is deterministic.

## Boundaries and blockers
This CLI is an internal primitive, **not yet a sandbox** or an authenticated public endpoint. Production deployment needs a sandboxed execution environment with process/user isolation, resource limits, explicit allowed modules and a pinned engine digest. The Python/DAPI caller must verify Social issuer and subject, match-seat ownership, expected revision, engine revision, and run the evaluator before committing with `MatchRepository`. A verified live DAPI transaction and outbox delivery are outstanding. Do not enable `/play` or accept client-supplied checkpoint states.

## Acceptance
`node --test tests/async-evaluator-083.test.cjs` verifies reproducible evaluation, digest rejection, disallowed commands, no caller-state mutation and matching CLI output. Legacy `/session` remains untouched.
