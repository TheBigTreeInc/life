# ADR-0043 — Explicit workboard lifecycle and reserve-aware Classic maintenance

**Status:** Accepted

**Release:** 0.5.42

## Context
Previous releases repeatedly added completed task records without an explicit source-to-workboard status reconciliation. ZipRunner v1 `implemented`/`remaining` cannot carry a verified blocked transition. Classic household failures also had no budget-aware opponent maintenance routine.

## Decisions
- Maintain unique, stable work-item IDs and produce `docs/workboard-lifecycle.json` and a readable workboard reconciliation using `tools/reconcile-workboard.mjs`. Classifications and unblock conditions reside in version control.
- Enforce all classifications and evidence in the release gate. Statuses are local-source facts only; actual ZipRunner status transitions need importer support and an acknowledgment. **Do not** silently upgrade the active `.ziprunner-workboard-update.json` to an unsupported v2 schema.
- Keep broad partial parity tasks In Progress, and exact-source / deployed-acceptance tasks Blocked until their stated evidence arrives. No retrospective claim of binary-perfect DOS behavior.
- Make Classic household maintenance planning deterministic, cash-reserve-aware and part of the opponent's existing optional action loop. This is a Life Loop compatibility feature, not a recovered DOS repair priority. Keep the existing repair actions and save data.

## Tests
Run `TEST-LIFECYCLE.bat` and `node tools/verify.mjs`; inspect `docs/workboard-reconciliation.md` and the ZipRunner import outcome separately.
