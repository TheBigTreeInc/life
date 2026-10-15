# ADR-0049 — Visual storefront doors and in-venue Classic clock

**Status:** Accepted

The original Classic travel rules use a 170-waypoint ring and route index/place identities.
Those must **not** move to accommodate commissioned artwork. Instead `routes.v1.json`
includes normalized `artEntrance` positions independent of `routeIndex` and `stop`.
The artwork manifest mirrors those values for handoff. `route-overlay.js` measures
rendered images with `object-fit: contain` and compensates for image letterboxing;
it also keeps door rings above text captions on narrow layouts. It draws orthogonal
sidewalk stubs from street to doors, displaying stubs only for current, previewed
or arriving locations. All actor pawns and animations terminate at art entrances.

The town's historical 170 waypoints, distance-derived travel quotes, time costs,
economy, replay and save schema remain unchanged. This is a strictly visual projection.

The Public Garden remains the board's primary Classic clock. While a building menu
covers it, `venueClock` in the modal header renders the same `ClassicBoardHud.model`
remaining/maximum value. Its accessible progress state updates after each action.
Modern mode does not show this extra clock. No gameplay time is charged for opening
or closing the building menu.

**Validation:** `node tools/verify.mjs`; `python tests/qa_entrances_clock.py`
with Chromium and Python Playwright available. Check at 320, 390, 768 and 1440 px.
