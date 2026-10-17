# ADR-0072 — Mobile overview, work shortcut and player-facing copy

**Status:** Accepted candidate for operator QA (v0.5.72)

## Decision

Classic on phone defaults to full-city overview **every session**, including when the user previously explored the zoomed view. First tap on a building zooms and centers on it, with a highlight and instruction; the second tap requests travel or opens the current building. On leaving a venue the board returns to Overview. Explore/Overview buttons remain available; desktop stays unchanged. This is presentation only and does not spend game clock, alter routes or store a camera setting.

When `game.actions()` exposes a `work` action at the active venue, a mobile footer `Work` control appears directly next to `Done`. It reads the same `enabled`, reason, busy, pending and ownership constraints as the activity card, and forwards its click through the existing `data-act="work"` handler so there is no duplicated transaction, double-pay or shortcut to blocked actions. Non-work venues do not display it.

Career and finances screens show financial transactions, goals, pay, home costs and relevant job requirements instead of DOS branch IDs, formulas awaiting validation, developer notes or diagnostic traces. Underlying logs and parity docs remain intact. EN/NL language continues applying to re-rendered labels.

## Tests / acceptance

`node --test tests/mobile-experience-072.test.cjs` checks wiring and invariants. `node tools/verify.mjs` validates source, offline build, workboard and other tests. On-device touch/viewport and rendering acceptance remains required; backend DOS parity is unchanged.
