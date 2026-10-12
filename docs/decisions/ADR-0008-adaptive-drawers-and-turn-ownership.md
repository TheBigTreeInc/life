# ADR-0008 — Adaptive story/destination drawers and explicit turn ownership

**Status:** Accepted  
**Release:** 0.5.5

## Decision

At widths >=1600px, keep story, city and destination side-by-side. From 1025 to 1599px, make story and destination off-canvas drawers with edge buttons and view-triggered update indicators; under 1025px keep the established three-tab touch navigation. All breakpoint and unread state is purely presentational and never changes turns, game rules or saved state.

Put Save, Load and How to Play into an accessible header menu with Escape/outside-click dismissal. Keep Finances, Careers, Online and New Game accessible in the header.

Show a persistent banner using `game.player.id` as turn authority and `LifeOnline.role`/`ownTurn()` to distinguish the host's own turn from the guest's. Show the actual server-provided room join state and websocket connection, not merely a generic "Connected" label. If WebSocket is unavailable, the existing authenticated HTTP polling is retained; the UI shows a fallback label, not a guarantee of realtime delivery.

Offer a public component registration probe against `/looprd/the-life-loop/v1/info` expecting `protocol: the-life-loop/1`. Treat this as a diagnostic of API registration only. It does not prove websocket push, authorization, game correctness, or two-device functionality. A real Looprd server deployment and two-browser acceptance remain mandatory (LL-082).

## Verification

`node tools/verify.mjs`, `python -m unittest discover -s tests -p test_looprd.py -q`, headless Chromium layout checks at phone, tablet, laptop and wide desktop sizes. No change to Classic or Modern engine.
