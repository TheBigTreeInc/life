# ADR-0071 — Original active clock quantum and route-gap audit

**Release:** 0.5.71  
**Status:** Source-backed comparator deployed; runtime travel charge calibration pending.

## Source evidence (DOS SCI 1.000.060)

- `room1.sc:1059–1067` sets `marble.moveSpeed = 1`.
- `room1.sc:1315` sets `global475 = (marble moveSpeed) * 14` for the active turn. This overrides `Main.sc` initial `global475 = 20`.
- `room1.sc:1473–1491` charges one clock unit when `++global324 > global475`; at speed one, 15 frames per tick with no carry.
- `WhereShouldIGo.sc:23–38` calculates ring shortest-path waypoint distance plus two `global475` quanta **per journey leg** for the rival's AI budget.
- `marblePath.sc:17–105` advances indices using motion callbacks; the actual animation-to-TIMEKEEP frame relation remains unobserved.

## Change and boundary

`src/classic-time.js` now uses the active **14** quantum, adds a carry-bounded and speed-aware source-tick comparator, and keeps separate presentation of in-game provisional travel hours. `tools/dos-time-audit.mjs` emits a deterministic JSON report for **156 directed paths between 13 places** (and all carry endpoints), including any divergence from currently charged hours. These differences are **not** proven bugs until a DOSBox recording provides actual movement frame counts. Never retrofit source-AI frame estimates as human travel costs by assertion.

No modification to game saves, actual travel spend, return-home overdraft, or Modern Story. Original DOS observed session duration remains unknown, so do not imply this pass equalizes the ~5-minute browser sessions.

## Operator acceptance

1. Run `node tools/dos-time-audit.mjs --write` and compare its report with `docs/reference/dos-route-clock-071.json`.
2. Run `node --test tests/classic-dos-motion-071.test.cjs` and full `node tools/verify.mjs`.
3. In DOSBox record departure place, target, current TIMEKEEP, frame/tick carry if accessible, arrival clock and per-route segment duration for home → agency, market, bank, and homeward return.
4. Only after real trace, decide whether live `travelCost` differs and should be migrated under a new version.
