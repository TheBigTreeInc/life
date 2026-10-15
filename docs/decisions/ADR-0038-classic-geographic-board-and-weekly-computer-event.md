# ADR-0038 — Permanent Classic board geography and source-backed weekly computer bonus

**Status:** Accepted

**Date:** 2026-10-13

## Decision

Preserve the 13 source-matched Classic place IDs and 5×4 geographic cells at every viewport width. A horizontally pannable presentation (Explore) is the mobile default; Overview fits the city into the viewport and deliberately renders smaller tiles. A no-cost location finder and pawn locator scroll the viewport. Use the existing road/venue routing graph, not a second mobile route. Move the SVG inside the board stage to keep travel/pawn geometry aligned under panning. Keep centered venue UI outside the scroll container.

Use the decompiled source record `startTrn.sc` state 4 for the owned-computer weekly bonus: one chance in seven, $20–$100 **cash**, source-tagged in the existing Classic event log. Do not apply this to Modern. The payout range and source condition are recovered; the game's other weekly state transitions, RNG equivalence, event ordering and exact historical dialogue are not fully recovered.

## Consequences

Classic phone Explore requires horizontal panning but maintains legible storefront hit targets; Overview is available for spatial orientation. The city remains the same across phone and desktop, improving navigation training and route verification. This adds no persistent gameplay save fields and does not change Looprd routes, core travel time, wages, or Modern gameplay. Tests cover geometry, controls, computer event RNG and source classification.
