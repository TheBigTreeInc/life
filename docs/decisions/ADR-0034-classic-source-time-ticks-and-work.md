# ADR-0034 — DOS source travel ticks, Employment entry and successful-work accounting

**Status:** Accepted

## Decision

Preserve the original 170-waypoint route as the single physical identity graph. Add a separately named original **AI travel estimate** (`steps + 2×global475`, `global475=20`) for each nonempty leg. The playable 60-unit clock still uses the established provisional step conversion, except entering Employment costs the recovered **+2 clock units** (charged once on the transition). Quotes and travel use the same adapter. Both player and Jones are subject to identical arrival costs; the rival can compare up to three destination orderings by source tick totals, while checking feasibility against actual remaining gameplay units.

The original DOS `n108.sc` supports +1 capped work stat progression per successful work action, including a shift begun with fewer than six units. Partial wages use the recovered integer truncation formula; no fractional wage carry or pooled six-hour progression. Preserve legacy snapshot shape and reset unused pooled work credit on import.

## Explicit limits

The ring tick estimate is *not* an independently verified player-clock-time conversion. Employment entry is source-backed, but charging original buildings beyond Employment requires additional runtime traces. The provisional ten-action cap, complex debt garnishment, and exact emulator RNG/event ordering remain open tasks. Modern stays independent; the source/build and host-authoritative Looprd protocol are unchanged.

## Tests

`node --test tests/classic-original-timing.test.cjs` plus `TEST-TIME.bat`, complete `node tools/verify.mjs`, open generated `PLAY.html` on desktop/mobile. No git commit/push performed automatically.
