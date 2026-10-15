# ADR-0026 — Board routes and authoritative pawn movement

**Status:** Accepted (v0.5.25)

## Context

Classic places are positioned around a 14-space perimeter; previously travel happened instantly and only position-based time costs were visible. We want moving player/rival pawns and replaceable board artwork without letting pixels decide game logic.

## Decision

1. Keep `Game.travelCost` and `Game.travel` the only clock/state authorities. `src/route-graph.js` independently compiles a versioned validated 14-node graph from `assets/boards/classic/routes.v1.json`; a generated `src/classic-routes.js` contains that same JSON for offline mode.
2. Draw projected roads and pawns on a persistent SVG sibling to the board's render-replaced tiles. Re-project against actual card bounding boxes after rerenders and viewport changes; later board art can replace only this projection.
3. Call travel exactly once, animate if accepted, and then open venue if actor/current location/turn still match. Guest animation only occurs after host-confirmed room state; snapshots remain the source of truth. No per-frame networking.
4. In reduced-motion mode, snap directly to the location. Support debug node/stop overlays via `?debugRoutes=1`.
5. Keep the full offline `PLAY.html`, fast Windows `PLAY.bat` and `TEST-LOCAL.bat` release smoke launcher. No build needed to play the generated standalone file.

## Limitations and follow-up

The temporary painted SVG roads run over the existing Classic card-grid locations, not a custom illustrated continuous board; final art requires projection tuning. Real deployed Looprd reconnect and two-browser animation remain unverified. Exactly matching DOS movement time remains separate from visual routing. No game-save or server schema migration.
