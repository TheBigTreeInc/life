# ADR-0053 — DOS Employment time cap and executable tick audit

**Status:** Accepted for the time-boundary rules only. **Release:** 0.5.53.

## Evidence

Version-matched decompiled DOS 1.000.060 scripts:

- [`room1.sc` `timeKeep.doit` lines 1473–1492](https://github.com/sluicebox/sci-scripts/blob/main/jones-dos-1.000.060/src/room1.sc): an explicit charge increments `global323`, clamps to 60; implicit clock increments only when `++global324 > global475`.
- [`employment.sc` `JobDItem.doit` lines 206–211](https://github.com/sluicebox/sci-scripts/blob/main/jones-dos-1.000.060/src/employment.sc): starts a job interaction while time is below 60 and charges `visitTime` before qualification. The Employment entrance already charges +2 in the Classic route adapter.
- [`university.sc` lines 220–234](https://github.com/sluicebox/sci-scripts/blob/main/jones-dos-1.000.060/src/university.sc): begins a lesson when time is not 60 and then calls the timer with its nominal time.
- `WhereShouldIGo.sc` route estimator: waypoint distance plus two quanta for each nonempty leg, already supported by the Classic planner. **This is a planning estimate, not observed player clock consumption.**

## Decisions

1. Keep the existing 60-unit Classic clock and all provisional player travel charges; DO NOT infer a seconds-per-waypoint conversion from browser animation or original opponent ticks.
2. In Classic Employment, job applications and raise requests have a nominal 4-unit cost but may start with 1–3 remaining. Charge only the remainder and cap the clock at zero. Refuse actions at zero. Existing qualification, chance, cash and ten-event gate rules remain unchanged. Modern keeps its existing hard time requirement.
3. Add `LifeClassicTime.cappedActionCharge()` and `dosClockFrames()` to isolate source-backed time arithmetic. The frame simulator is a **reference fixture** and does not update gameplay during browser animations; the default reference quantum is 20 and dynamically derived DOS moveSpeed is not yet calibrated.
4. `node tools/dos-time-audit.mjs` provides 156 directed source-AI journey estimates with explicit provisional player time units, and boundary quotes for late-week Employment. Add `--json` for comparison/replay tooling.
5. Both networked game-room decisions and local/offline play reuse the same authoritative `Game.act()` time deduction. Save structure, route identities, pawn visuals, weekly events, Social and Modern Story are unchanged.

## Verification

- `node --test tests/classic-dos-time-parity.test.cjs`
- `node tools/dos-time-audit.mjs`
- `node tools/verify.mjs`
- Browser smoke: 1-3 units remaining at Employment allows a final job application, clock reaches zero; no actions at zero. Existing garden and in-venue clock continue to agree.

## Still open

The precise elapsed time for real DOS 170-waypoint walking is not identified. `global475` is derived from the original marble speed; a controlled DOS runtime trace is needed to equate original engine ticks and movement elapsed time. Ten-event rule, garnishment, complete startTrn ordering and round-by-round economic values remain provisional.
