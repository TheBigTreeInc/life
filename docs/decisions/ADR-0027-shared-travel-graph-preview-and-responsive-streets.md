# ADR-0027 — Shared travel graph, route preview, and compact streets

**Status:** Accepted (v0.5.26)

## Scope

Classic v0.5.25 drew a shortest-path route independent from an engine ring-count travel formula. Both agreed for the existing fourteen-stop ring, but source changes could silently desynchronize price from pawn motion. The three-column compact board also created large diagonal street segments over storefront art.

## Decision

1. The route graph is loaded before LifeGame; `travelCost` uses Classic shortest-path `weight` with the established entry/segment-clock function. Modern retains its own ring-distance logic. Do not change the coefficients without DOS evidence. `travelQuote` is a pure read-only query consumed by game UI.
2. Versioned nodes now include optional classic `cell` coordinates; compiled routes return stable stop lists and counts. Validate malformed cell data as a broken release. Keep artwork/viewport geometry solely in the SVG projector.
3. Classic hover/focus reveals a shortest-road preview and how many hours it would cost, with a clear shortage indicator; a real click alone invokes the same authoritative travel command as before. Failed moves do not animate.
4. Arrange compact 3-column tiles in a serpentine road order; route vertical gutter turns and the final return lane without crossing several buildings diagonally. Drawing uses actual graph edges, not fixed node-array order. Re-project an in-flight pawn when the board resizes.
5. Keep the center venue modal, reduced-motion snap, local/hotseat/remote turn authority, opponent pawns and Modern board separate. This is additive UI and internal route refactoring, not a save, economy or API change.

## Verification and limitations

`tests/classic-route-clock.test.cjs` checks all venue pairs, cost and quote parity, non-mutation on failed moves and Modern isolation. `tests/qa_routes.py` checks offline HTML at 320/390/768/1440px with actual clicks, preview, and hour accounting. Live Looprd WSS two-client arrival/reconnect behavior is still an operator check, and 3-column artwork projection requires final supplied board art. The route time model still approximates Sierra DOS.
