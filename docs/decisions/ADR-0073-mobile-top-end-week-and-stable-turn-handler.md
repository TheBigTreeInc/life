# ADR-0073 — Phone-first End Week access

**Status:** Accepted — 2026-10-17 · v0.5.73

## Problem

The End Week command is beneath the game board, off-screen on many phones. A building-search dropdown consumes the top-board space despite the existing tap-to-focus map and Overview/Explore controls.

## Decision

- Remove the building-search dropdown and its event listener. Keep the Classic board's direct building tap-to-focus, first-tap preview, second-tap travel and Overview/Explore/My Pawn controls.
- Put `mobileEndTurnBtn` in the existing city toolbar, visible on <=1024px screens in Classic and Modern; keep desktop `endTurnBtn` in its original status ticker. The mobile control has a >=44px height and adapts to 320px screens.
- A phone tap calls `endTurnBtn.click()` only when both controls are enabled. No second `game.endTurn` or Looprd command implementation is introduced. Disabled state is derived from the canonical ticker button during each render (travel busy, venue modal open, completed game, non-owner, network busy, pending action). Preserve forced return-home, overtime debt, hotseat and remote authority paths.
- Keep the v0.5.72 Work button next to Done at valid workplace venues.
- Localize the mobile label dynamically with the current EN/NL UI locale. Do not touch game snapshots or save schema.

## Validation

Run tests/mobile-end-week-073.test.cjs and the full verifier. On a physical phone check Classic and Modern, new and saved games, window resize, EN/NL, narrow viewport, remote guest, open venue and return-home debt. Headless source tests are not physical-device acceptance.
