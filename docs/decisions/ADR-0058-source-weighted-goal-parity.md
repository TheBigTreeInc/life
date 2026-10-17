# ADR-0058 — Classic source-weighted goal scoring and victory

**Status:** Accepted  
**Release:** v0.5.58  
**Applies:** Classic Rules (default or customized house rules); Modern Story untouched.

## Evidence and confidence

- `docs/reference/original-dos-pass2/PASS2_MECHANICS.md` and `classic_rules.py`: DOS 1.000.060 `viewGoals.sc localproc_0` uses `floor(100 × sum(min(stat, target)) / sum(target))` and checks all four thresholds separately.
- `n108.sc` / `room1.sc`: career goal = `min(100, floor(dependability / 8) × 10)` while employed, otherwise zero.
- `university.sc`: education award stat = 0 with no completed diploma, or `1+9×completed` with >=1. Printed Quick Reference Card (ADR-0020) describes study units as goal-relevant; our old fractional interpolation was provisional. Use version-matched code as the initial baseline, and retain DOS runtime partial-credit verification as an unresolved evidence conflict. Do not claim DOS execution or binary parity.
- Original cash/asset goal's conversion into goal points is integer-truncated; appraisals of goods, debts, stock prices and original starting Happiness remain provisional and separately tracked.

## Implementation

1. Add `src/classic-goals.js`, a pure validated calculator; Classic human, rival and multiplayer all use the same formulas. Compute weighted Classic leaderboard progress from current *raw* statistics with each component capped at its own goal. Do not average previously floored per-goal percentages.
2. Career now grows in ten-point steps as dependability crosses multiples of eight; loss of employment sets career points to zero. Completed degrees now produce the source award points; unfinished study does not create speculative fractional goal points. Preserve all saved course progress and degree IDs unchanged.
3. Display `actual/target` points and the weighted overall percentage on the Classic goal panel. Modern's goal calculations and progress remain byte-identical; Custom Classic retains its existing house-rule switches and the same source Classic scoring.
4. Leave starting cash ($200), bank ($0), Happiness (62), Experience and dependability as in v0.5.57. Except cash (printed reference), not all opening values have conclusive original-runtime evidence. Do not change them to manufacture longer matches.
5. Add tests for weighted unequal targets, clamping, step thresholds, no-job, degree boundaries, replay/save compatibility, rivals, Modern isolation, and the build/import scripts. No API, endpoint or extra save fields. Keep manual Git publishing.

## Follow-up gates

1. Verify original DOS *opening Happiness* and initial dependability against edition-matched runtime traces (LL-310).
2. Reconcile Quick Reference university **study-unit language** with version-matched `university.sc` at partial-lesson boundaries. Only modify the source formula after concrete, reproducible evidence.
3. Compare goal-based match duration in completed weeks, not rendered browser minutes, using controlled player/Jones strategies and identical goals. Time moves and decisions remain provisional.

## Operator acceptance

- Run `TEST-GOALS.bat`, `node tools/verify.mjs`; open `PLAY.html` from disk and verify visible weighted goal %, point fractions, and Jones ranking.
- Start Classic Standard: Happiness starts at 62 and already meets the 50-point target (still an open design/evidence issue). Use Extended for higher goals without introducing artificial game delays.
- Complete studies, move dependability across 7/8/15/16 boundaries, test unemployment and 99%-but-no-win case. Import an older save; repeat in Modern and custom return-home mode.
