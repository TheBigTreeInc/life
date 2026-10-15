# ADR-0039 — Classic phone intent, camera follow and weekly source-state evidence

**Status:** Accepted

**Date:** 2026-10-13

## Context

Small tap targets in Classic Overview could unintentionally consume travel time. Pannable Explore retains readable storefront labels but the pawn was not followed until arrival. Weekly food/storage and clothing checks were in gameplay, but only the computer event exposed the recovered source-state identifier.

## Decision

On narrow Classic screens, first tap in Overview selects a storefront, switches to Explore, and centers it without `game.travel` or `net.execute`. Further tap in Explore requests travel through the existing authoritative channel. The local pawn animation can scroll the Classic board to remain visible; user dragging during travel cancels automatic following for that trip. The road SVG stays inside the board stage. The UI does not persist or transmit camera coordinates.

Emit source-tagged, validated pure state-10 food-loss and state-18 work-clothing warning results in the existing 96-record Classic event history. State 10 has recovered capacity limits but uncertain spoilage likelihood. Keep the compatibility spoilage behavior explicitly provisional; remove unsupported $25 medical deduction. Neither rule changes Modern gameplay.

## Consequences

Mobile navigation is safer and less disorienting. Saves, employment, route clock, multiplayer protocol and all identifiers remain compatible. DOS source code branches, recovery formulas and exact original chance distributions are still not all known; logging an event does not establish parity. Run focused tests and 320/390/1440px browser checks.
