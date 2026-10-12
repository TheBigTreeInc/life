# ADR-0016: Compact city heading, co-op menu and single status ticker

**Status:** Accepted  
**Release:** 0.5.15

## Context

Previously the game had a dark page header, an additional light-green multiplayer turn band, a repeated city heading, mobile summary and a time strip. This wasted vertical room and scattered controls across unrelated regions. Real-time co-op messages needed a visible unread indicator while websocket status and room information belonged in one location.

## Decision

- Replace the former header and secondary city title with one neutral paper-colored city toolbar. The Life Loop logo and the current cosmetic city name are displayed together. Careers and Finances are next to the logo.
- Arrange right-side navigation as Destination, Chat, Co-op and Menu. Use a dot/number when unread WSS-only chat exists; retain disabled chat before a live connection and never persist chat history.
- Make the Co-op control a dropdown summarizing room code, host/guest role, join state, current turn and WSS/HTTP health. The dropdown opens the existing detailed room dialog; it does not duplicate or bypass server controls.
- Move New Game into Menu with Save Game, Load Game and How to Play. All menus work with Escape and outside-click dismissal.
- Put turn ownership, the week number, market status and hours remaining into the existing time strip below the city buildings. Remove the former light-green turn banner and separate top market/week badge. Mobile City/Activities/My Life navigation remains unchanged.
- Preserve Classic/Modern simulation, Looprd schema, local saves and disabled character customization.

## Operational and compatibility consequences

No database migrations or server changes are needed. The frontend is a presentation refactor. GitHub Pages and the fully-inlined PLAY.html are built from the same modular sources. Regression tests exercise the presence and order of toolbar controls and the status ticker; Chromium viewport tests verify the page does not overflow at 320, 390, 768, 1280, 1600 and 1920 pixels.
