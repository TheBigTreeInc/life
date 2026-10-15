# ADR-0051 — Classic pawn doorstep transitions

**Status:** Accepted

## Context

The Classic road presentation is separated from illustrated storefront artwork. In v0.5.50, the pawn walked along the public street and then instantly snapped to its destination doorway on arrival, even though the preview was road-only. This is jarring, especially on mobile.

## Decision

Implement a three-phase *visual-only* journey: fade from the last 18px of the outgoing doorstep, animate along the source-authoritative public route, and fade into the final 18px of the destination doorstep. The pawn remains on the street during the central travel phase. Both opacity transitions occur where the pawn would otherwise jump between painting and sidewalk; the discontinuity is not visible. Keep active/current route SVG entirely on the street; render only a short threshold marker at the door.

Skipping must complete at the destination and not consume extra clock units. Respect reduced-motion preferences with instant transition to doorway. Existing engine/router/Looprd turn ownership stay authoritative, no new save or protocol fields.

## Acceptance

- Pawn appearance/disappearance is smooth and final coordinates match the artwork door.
- Preview/current route does not cross storefront illustration tiles.
- `finishAnimation` resolves at the actual doorway; reduced motion is instant.
- 170 DOS waypoint indices and travel costs unchanged; mobile/desktop layouts supported.
