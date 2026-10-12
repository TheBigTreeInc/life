# ADR-0015 — Temporarily pause character customization

**Status:** Accepted

**Release:** 0.5.14

## Context

The character creator and experimental portrait/Pixel Studio features were adding complexity without improving the desired core gameplay workflow. The operator requested a return to the original in-game player look, without deleting the implementation.

## Decision

- Keep existing portrait, editor, sprite compiler, manifest, tests and profiles in the repository and browser storage.
- Set `ENABLE_CHARACTER_CUSTOMIZATION=false` in `src/app.js` as the single operator feature switch; do not expose the roster/editor in Quick Start, Menu, or multiplayer join while off.
- Show the original icon fallback (`🧑‍🎨` player, `🧑‍🚀` local friend, `😎` rival) regardless of old snapshots' appearance metadata.
- Construct new games without local `character` or `friendCharacter` options; join multiplayer without guest appearance. Players still enter names.
- Preserve old saves and keep game rules and Looprd schemas unchanged. Local profiles are not deleted.

## Revisit

A future pass can re-enable the editor by changing the flag, after design decisions about the avatar direction. Do not remove the source, assets or test coverage until explicitly requested.
