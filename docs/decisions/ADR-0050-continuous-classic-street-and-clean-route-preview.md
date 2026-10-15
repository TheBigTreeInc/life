# ADR-0050 — Continuous Classic street and clean doorway previews

**Status:** Accepted

## Problem

Version 0.5.49 drew the DOS ring using generic store-center road anchors, then used
long orthogonal door spurs. This produced a visual backtrack near Le Security and
highlighted routes through the decorative scenery and over shops when hovering.

## Decision

Keep all 13 original venue and 170 waypoint identities, costs and actions
unchanged. Compute road centerlines from measured gaps between the 5×5 board
tiles, including the two intentional tree-lined scenic spaces. Corner anchors
for the north-west, north-east, south-east and south-west are projected onto
this gutter network; artwork-specific doors remain independent destinations.

Render the loop as one rounded path and preview the public road only, with
a separate marked doorway and a short threshold marker. Animate the pawn
along the street rather than drawing a long glowing approach through each
shopfront. When animation completes, the pawn resolves at the door. Avoid
claiming the illustrated image pixel space is a traversable sidewalk.

This implementation does not change travel hours, original path indices,
arrival identity, saves, browser profile or either Looprd service.

## Tests

`node --test tests/classic-smooth-route.test.cjs`;
`python tests/qa_smooth_streets.py`; `python tests/qa_entrances_clock.py`.

Full cross-platform manual acceptance and production multiplayer remain pending.
