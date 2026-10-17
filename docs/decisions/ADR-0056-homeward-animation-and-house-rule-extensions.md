# ADR-0056 — Homeward animation and house-rule extensions

**Status:** Accepted

## Decisions

- Classic's end-of-week forced return continues to charge its existing travel quote and carry shortfalls forward. Engine remains authoritative; the browser illustrates that same route **before** submitting `endTurn`, avoiding the next hotseat player's world becoming visible during an ongoing journey.
- Reuse the existing `RouteOverlay.animate` renderer and its Skip button. Reduced-motion preference bypasses path interpolation. Rendering never edits clocks, game state or the next player's finances; the server/host still processes one end-turn action.
- Rules are stored in `game.settings.rules` and normalized against immutable Classic/Modern presets on new games, resumed games and network snapshots. New keys: `foodSpoilage`, `overdueRentPenalty`, `marketFluctuations`; **all default true for both game families** (zero changes to normal economy).
- Food spoilage off preserves remaining portions without affecting ordinary meal consumption. Overdue-rent penalty off removes only the existing 7-happiness loss, not rent assessments/debt. Market fluctuations off freezes Classic index and stock drift, and Modern economy ratio; Modern city event rotation remains active.
- Never use House Rules to overwrite Classic/Modern venue, career, or authored event catalogs. Do not claim full SCI/DOS food or income parity from these custom choices.

## Acceptance and limitations

Run `tests/house-rules-weekly.test.cjs`, legacy home-return tests, and full verifier. Manual UI acceptance includes a small-screen overview, hotseat privacy, Skip and reduced-motion behavior. Browser click-through and production Looprd host/guest synchronization require separate operator testing.
