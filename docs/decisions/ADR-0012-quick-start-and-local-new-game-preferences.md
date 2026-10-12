# ADR-0012 — Quick Start and persistent browser-local New Game preferences

**Status:** Accepted

## Context
The previous New Game dialog required reviewing Classic/Modern, eras and four goals on every start. On desktop this crowded the initial screen; the mobile wizard demanded multiple steps just to play.

## Decision
Use a compact Quick Start dialog showing a selected local character, editable name, play mode, and clear Start/Continue actions. Put Classic/Modern, cosmetic era and four goal sliders under an optional, keyboard-accessible Game settings disclosure. Display the selected preset in a summary even while closed. Persist preference changes (not game state) in separate browser `localStorage` under a versioned key; sanitize untrusted stored values and fall back to Classic/Contemporary/default goals when unavailable. The browser-local character library and per-game save remain separate. For an existing autosave, Continue is primary, while starting a new game requires confirmation before replacement.

## Consequences
No Classic/Modern formula, save schema, Looprd protocol, or server implementation changes. Advanced settings may scroll inside the modal when expanded on a short phone; the page and Quick Start action footer remain stationary. Player 2 character selection and Looprd server setup are displayed only for their corresponding game modes. Defaults are per-browser origin, not synced to Looprd.

## QA
Run the setup preference tests and `node tools/verify.mjs`; test short mobile viewport, browser refresh, reset defaults, game restore and online/hotseat mode toggles.
