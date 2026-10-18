# ADR-0084 — Internal persistent-match command processor

**Status:** Accepted (foundation only)

## Decision
Connect Life's trusted headless Node evaluator to the revision-guarded SQLAlchemy match repository through an internal Python command processor. Require a verified issuer/subject and an injected participant-seat resolver, match state and checkpoint digest validation, legal typed commands, an expected revision and an idempotency key. The evaluator consumes *only* a stored checkpoint; the result is committed transactionally with a new checkpoint and action record. Stored idempotency results can be replayed after the active seat changes, without re-executing the command.

## Remaining production gates
This is **not** a public `/play` handler. The seat resolver in production must query verified participant membership, not accept client claims. No Social ticket validation, engine-revision pinning, DAPI transaction proof, reliable notification recipient/outbox dispatch, deadline assignment, process user/network isolation or bounded streaming output exists yet. The subprocess has a timeout and bounded captured output, but its stdout capture is not streaming-limited. Do not expose this processor over HTTP or trust browser-supplied snapshots. Legacy `/session` remains unchanged.

## Verification
Run `python -m unittest discover -s tests -p 'test_async*.py'`, `node tools/verify.mjs`, and validate migrations and seat enforcement on a real DAPI deployment before enabling any async public API.
