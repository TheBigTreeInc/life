# ADR-0021 — Board-centered venue interactions

- **Status:** Accepted
- **Release:** 0.5.20
- **Scope:** Presentation and interaction only; no engine or Looprd wire-format changes

## Context

The right-hand destination pane split each decision from the central map. The original *Jones in the Fast Lane* kept shopping, bank, work and property decisions in a panel on top of the board. Players requested the same interaction model for The Life Loop, on both desktop and mobile.

## Decision

Keep one shared board containing thirteen interactive venues. After a successful `travel` through the existing Game/Looprd path, open a board-scoped modal with location artwork and the existing `game.actions()` menu. Opening the current location is free and does not call travel. Closing with Done, × or Escape is presentation-only. Clicking an action uses `net.execute('act', ...)` and game rules unchanged. Block duplicate requests, restore focus to the relevant tile, and make actions read-only by closing whenever a player/turn/location change makes the displayed selection stale.

Keep global dialogs (job switch, stories, new game, guide, finances) on the independent overlay above the venue. Preserve WSS chat and co-op tools. On mobile, only City and My Life tabs remain. The former right actions panel and its badge are removed; End week moves to the status ticker. Preserve the feature flag disabling custom avatars.

## Constraints and verification

No changes to `src/engine.js`, location identifiers, balance, save schema, or Looprd protocol. The action menu must be populated solely from authoritative engine actions; visible disabled reasons come from those action objects. Live room testing is still required to confirm two-device guest acknowledgment, although guest requests and stale-snapshot handling are covered in the browser logic and existing network tests.

Automated tests cover location geometry, mobile navigation, action wiring, keyboard interaction, and absence of the right panel. Browser smoke checks cover 320×568 through 1920×1080 without document overflow.
