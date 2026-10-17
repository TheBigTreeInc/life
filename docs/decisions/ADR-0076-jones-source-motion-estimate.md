# ADR-0076 — Jones source motion budget (DOS)

**Status:** Accepted as source-derived comparison only

## Evidence

- `room1.sc` assigns `global475 = (marble moveSpeed) * 14` and sets the initial moveSpeed to 1.
- `WhereShouldIGo.sc` `localproc_1` sums minimum circular route steps and adds `(* (- argc 1) global475 2)` — a **28-tick allowance per leg** with the default movement speed.

## Implementation

`classicSourceDecision` now reports `predictedTimeTicks = travelSteps + (moving ? 28 : 0)` rather than the stale 40. The value is for the rival's source comparison and does **not** alter live player travel charges or advance the RNG.

## Still unverified

The full ordered 1–49 source priority tree, action RNG, DOS actual animation latency, and representative DOSBox AI run acceptance remain incomplete. Do not treat an estimated rival path as a measured player travel clock.
