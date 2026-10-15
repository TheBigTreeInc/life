# ADR-0041 · Classic relaxation, loan state and presentation-only journey skip

**Status:** Accepted

Version: 0.5.40. Classic exclusively; Modern and shared-host commands remain unchanged.

## Context

Pass-2 DOS decompilation identifies `startTrn.sc` state 6 (relaxation −1 to a floor of 10 without hot tub appliance 28) and state 20 (a four-week loan delinquency check). The current game collapsed rest into happiness/energy and missed those source identities in the bounded weekly journal.

## Decision

- Add `classicRelaxation` as an independent 10–30 per-player quantity. Its **initial value 16, maximum 30 and rest gain +6 are local compatibility defaults**, *not recovered DOS constants*. Classic state 6 applies the source-backed −1/floor-10 rule weekly. The authentic hot-tub appliance does **not exist yet**: never substitute a stereo or VCR; treat it as absent. Unsecured-property theft from the same source state remains on the preexisting provisional risk branch.
- Classic rest raises relaxation separately, and severe relaxation exhaustion may select the existing rest branch in Jones's career/needs planner. Existing food, rental, job, and economic amounts do not change.
- State 20 tags the **existing** periodic loan check with an auditable result. Default penalties, interest and payment amounts are unchanged and still provisional; do not charge twice.
- `RouteOverlay.finishAnimation()` resolves the active display animation exactly once; it neither invokes `game.travel` nor talks to Looprd. Visual travel can be skipped after the already-authorized movement has committed. Manual pan and reduced-motion respect existing behavior, centered venue entry remains the final step.
- Save import defaults absent relaxation to 16, validates present values, and does not store animation status. Source event journal remains bounded; no new protocol endpoints or private files.

## Verification

Run `TEST-JOURNEY.bat`, `TEST-RELAXATION.bat` and `TEST-LOCAL.bat`. Verify mobile Overview first tap doesn't spend time, Explore travel animates with Skip action, location/time change once, no skip effect in Modern, and exported saves reload identically. Exact historical rest restoration and loan consequences await DOS runtime traces.
