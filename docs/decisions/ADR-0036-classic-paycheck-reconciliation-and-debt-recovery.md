# ADR-0036 — Classic paycheck reconciliation and survival after wage deductions

**Status:** Accepted

## Context

DOS Pass-2 `n108.sc` identifies full-shift gross as `hourly * 8`, partial-shift gross as `floor(fullGross * remaining / 6)`, and a special rent arrears branch involving temporary register overwrites. The exact debt formula is **not** recoverable with confidence from the reference bundle; the existing half-gross withholding and fee remain a labelled **Life Loop compatibility approximation**, never a claimed original rule.

The v0.5.34 work preview and work payout already shared `ClassicTime.paycheck`, but the Classic rival's survival budget used gross pay. That understated financial hardship. The game also had no structured record of actual wage/debt reconciliation, making partial-work parity difficult to debug.

## Decision

1. `ClassicTime.paycheck` remains the authoritative immutable quote for Classic time units and current rent debt. It exposes `fullGrossBasis` as a *comparison/sensitivity limit*, **not an alternate DOS payroll result**. `ClassicTime.settlePaycheck` verifies quote arithmetic against current arrears and produces a nonmutating cash and debt reconciliation.
2. Completed Classic work appends a small record of the calculated `gross`, `garnished`, `fee`, `net`, cash before/after, debt before/after, employer, week and action duration to `classicPaycheckHistory`. Retain only the last 16 completed shifts. Warnings and dismissals do not append a paycheck. The Finances view surfaces these records without inventing an additional economic transaction.
3. Classic survival projection quotes the *current contracted wage*, projects two successive paychecks (reducing predicted arrears between them), and uses **net** earnings. Both forecasts are read-only and replay-safe.
4. Jones will not voluntarily settle old rent arrears with a lump-sum payment if that would consume imminent food, current rent, work-clothing, or downturn cash reserves. This is a protective approximation, not a recovered SCI AI branch.
5. Legacy saves without `classicPaycheckHistory` receive `[]`; supplied journals are capped, schema-validated and cash/debt reconciled on import. Modern work mechanics stay unchanged; Looprd endpoint/protocol unchanged.

## Open research

Capture several DOSBox/emulator full/partial paychecks at the **same wage and debt** (especially one, three and six playable units). Reverse-engineer original `temp0` and `temp1` garnish control flow, including fee timing, and replace the provisional rate only when observational tests agree. The original clock-unit conversion, true AI source branch order, and weekly source events remain separate outstanding parity tasks.

## Verification

`TEST-PAYCHECKS.bat` covers settlement conservation, original gross boundaries, full-gross comparison, preview and real work consistency, over-deduction prevention, bounded journals/save imports, two-shift net forecast purity, AI essentials guard, and Modern isolation. `node tools/verify.mjs` regenerates offline/Pages and executes all mandatory tests.
