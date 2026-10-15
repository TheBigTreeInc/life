# ADR-0028 — Source-derived DOS place, route, career and AI integration

**Status:** Accepted (v0.5.27)  
**Evidence:** user-supplied `jones-dos-original-mechanics-pass1.zip`, see `docs/reference/original-dos-pass1/MECHANICS.md`, version 1.000.060 (matching public SCI script reconstruction). These mechanics are extracted *reference evidence*, not emulator-verified game behavior. No original DOS binaries or complete decompiled scripts are redistributed.

## Decision

1. Preserve 13 `placeNum` values 0–12 and their route indices (1..170) separately from stable Life Loop `businessId` strings and interactive board tiles. `original-mechanics.v1.json` is the immutable structural source; `src/classic-original.js` and route bundle are generated in `node tools/build-offline.mjs`. Frontends may reskin entrances without changing these identities.
2. Path choice is indexed on the original, closed 170-waypoint route; select fewer transitions with deterministic forward tie. The 14 existing route nodes (one public crossing) remain projection anchors only, and their weighted edges reflect original waypoint intervals. Pawn/preview runs through original waypoint IDs on the depicted street; changing art does not modify movement logic.
3. Time budget stays **explicitly provisional**, presently 3+floor(shortest waypoint steps/25), or zero for self-visits. The reference proves the original 170-step marble route but does not prove exact DOS in-game clock time per indexed transition. Rendering speed is purely presentation.
4. Every Classic job carries original `jobNum`, source `placeNum`, `baseHourlyPay`, required degree IDs, experience, dependability, occupation index and uniform tier. Existing stable job IDs and playable wages remain unchanged to preserve ongoing economies and saves until original price multipliers / payroll derivation can be validated. The distinct Black’s Market and Z-Mart are directly referenced; `D.jobWorkplace` now validates against the Classic venue catalog, not the Modern tiles.
5. The Classic competitor retains the existing deterministic turn execution but uses a separately testable needs-and-route planner to evaluate savings/rent, food, clothing, hiring odds, work pay and possible trip sequences. The exact SCI 300 priority weights have not been reproduced. A Classic-specific utility is not applied to Modern Story.

## Compatibility and testing

No new player save fields, action wire schemas or Looprd API changes. Older Classic saves identify locations by the same stable business IDs and jobs by the same stable role IDs; importing source `placeNum` metadata requires no migration. Added route/time/job correspondence and 2–3 stop AI tests; old equal-weight tests updated to explicit 170-step reference assertions. Existing Modern paths remain distinct. `TEST-ROUTES.bat` includes reference tests and `TEST-LOCAL.bat` runs full checks.

## Follow-up

Measure exact DOS clock movement, dynamic job wages, numeric degrees and full SCI AI heuristics with reproducible recordings before changing balance. Historic metadata is ready for those future calibrated passes.
