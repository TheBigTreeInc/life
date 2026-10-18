# ADR-0086 — Internal play interface and multiplayer P0 handoff

Status: candidate for operator review, not accepted or deployed.

Life now exposes an internal `InternalPlayAPI` Python facade for `inspect`, `legal_actions`, `act`, and `end_turn`. These require a separately provisioned Social verifier, a trusted participant-seat resolver, and authoritative command service. Read results contain no raw private checkpoints. No HTTP route, public create/join, signed Social provider, trust federation, scheduler, notification delivery, or production database migration is enabled.

The shared priority handoff (`docs/multiplayer-priority-handoff.json`) requests P0 scheduling for LL-072, LL-263, LL-092, and LL-082 ahead of further DOS parity development without lowering LL-039/LL-040 or modifying operator acceptance/status. The complete latest local operator 339-ticket snapshot is archived as received in `docs/ziprunner-local-workboard-20261018.txt`. The v1 importer cannot prove priority/status reconciliation: operator must approve and verify changes in ZipRunner UI.

CI remains unverified for previous pushed commit 7310f808e9dd65316a996a8c9b763227e1ff802d. This release is a local candidate, not operator acceptance.

## Next blocking pieces
1. Social live issuer and per-game grant verification.
2. Trusted seat bindings and complete legal-action provider; authenticated create/join/resume API.
3. DAPI atomic migrations, transaction proof and evaluator sandbox.
4. Durable event/outbox scheduling and Social notifications.
5. Atrium reviewed launch/resume, human and independent OpenClaw E2E test.
