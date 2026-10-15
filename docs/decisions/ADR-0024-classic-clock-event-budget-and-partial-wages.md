# ADR-0024 — Classic clock, weekly event allowance and partial-wage carry

**Status:** Accepted (provisional parity; DOS comparison pending)

## Context

The player-provided original-game walkthrough describes sixty hours per week, six-hour work actions with eight hours paid, partial actions, an upper limit of ten events per round and the inability to eat at zero time despite eating costing no hours. The published references do not define precisely whether bank transfers, store purchases, or walking count against the ten-event cap. This implementation deliberately distinguishes supported facts from a testable interpretation.

## Decision

1. In Classic only, once `hours` reaches zero, all venue actions become unavailable, including zero-hour bank and food actions. The external End Week control remains available. Modern Story is unaffected.
2. Count a maximum of ten *selected venue decisions* per Classic week. Validated actions, including dismissal on attempted work, consume a slot; travel and rejected taps do not. Show the count in the status ticker and reset for each player when a new week starts. This is an **interpretation**, not verified original executable parity.
3. Prorated gross wages are computed using sixth-dollar integer remainders: `floor((8*wage*hours + remainder)/6)`. Store the remainder in the snapshot. Job changes and dismissals reset it. Partial work continues to earn experience/dependability after accumulating six work hours (pre-existing behavior).
4. Validate new fields in imported/shared snapshots (`0 ≤ classicChoicesThisWeek ≤ 10`, `0 ≤ classicWageRemainder ≤ 5`) with safe defaults for old saves. Do not change game action protocol or Looprd database schema.

## Acceptance

At the bank, complete ten zero-hour transfers with positive clock time, block the eleventh, end the week and permit new actions. At zero hours, refuse bank, food and tuition actions. Confirm a Cook working six separate one-hour shifts earns exactly the same $40 as one full 6-hour shift, with save/load preserving intermediate carry. Check Modern separately.

## Pending DOS work

Observe the real event counting rules, whether dismissals use time/actions, original rounding and precise weekly rollover. Track as LL-152, TIME-003 and JOB-005 partial.
