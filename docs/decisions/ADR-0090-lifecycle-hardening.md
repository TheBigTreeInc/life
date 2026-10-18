# ADR-0090 — Internal lifecycle hardening

Version 0.5.90 keeps the live LoopRD schema at 3. Authenticated creators may supply a stable, account-scoped `request_id` for deterministic match creation retries. A repeated request returns the existing match; conflicting seed/rules metadata is rejected. Invitation redemption claims the token using a guarded update before inserting a participant in the same transaction.

This is an internal-only foundation, not an exposed `/play` route or production concurrency guarantee. **Remaining P0:** database-enforced `(matchId, seatId)` and `(matchId, issuer, subject)` uniqueness (requires a reviewed additive migration), create-request payload fingerprinting including settings, real production concurrency and restart tests, trusted Social issuance/revocation, and Atrium create/join/resume integration. Do not alter the current live schema-3 database automatically.
