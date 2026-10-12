# ADR-0014 — Compiled, data-driven character components and pixel preview

**Status:** Accepted
**Release:** 0.5.13

## Context

The Life Loop v0.5.12 offered finished preset portraits or one procedural SVG face. The attached character-creator recommendations describe a more extensible `CharacterConfig → compiler → compiled poses → rendering adapter` architecture, with body templates, palette channels, separate render parts, hair/headwear variants and a shared animation clock. They also caution against interpolating continuous geometry into pixel art and against recompiling every frame.

## Decision

1. Keep the existing small, offline-friendly vanilla JavaScript platform rather than add React, TypeScript and PixiJS as hard browser dependencies for a 32×40 initial pixel sprite. The manifest (`assets/characters/pixel-v1/catalog.json`), its generated `src/character-catalog.js` file, and pure `src/character-sprites.js` are separately testable and ready to be adapted to a future atlas renderer.
2. Use the current local profile schema with a versioned **sprite configuration** (`schemaVersion`, `catalogVersion`, discrete `body`, `hair`, `headwear`, `outfit`, `skin`, `hairColor`, `accent`, `mood`). The actual public snapshot stores only these validated choices plus personality and optional `portrait:'pixel'`; **never** store a frame buffer, a generated image URL, or private profile ID in Looprd room snapshots.
3. Compile changes once into frame-resolved, stable band-ordered draw commands with a bounded cache. Each pose is `(action, direction, frame)`; the animation clock selects one frame for the full appearance. Body dimensions are discrete (compact, standard, broad). Headwear explicitly requests `hair/under_hat`. Unsupported options normalize to a declared safe default.
4. Use low-resolution native Canvas 2D (nearest-neighbor) for preview and PNG sheet export; use the same compiled pose data rendered as small SVG rects for reliable zero-dependency gameplay/sidebar avatars. Both are adapters over the exact same compiler output. Frame work is limited to redrawing on pose changes, not recompiling cosmetics.
5. Keep the 51 portrait images and editable vector avatar in their own modes. Pixel Studio is a new third style with component controls, 4-direction preview, idle/walk toggles and sprite sheet export.
6. Extend the existing Looprd guest cosmetics allowlist (`body`, `headwear`, `portrait='pixel'`). The database uses JSON game state, so no Room table change is necessary; re-register the updated server component before testing.

## Deliberate limitations

This is a complete **vertical slice**, not finished animated PNG artwork or a full character-physics system. Current pixel assets are deterministic rectangle-based shapes authored in the renderer, not downloadable atlases. The direction/pose contract and JSON manifest prepare for future authored parts, masks, attachment anchors and exported texture atlases. Player movement on the city board remains turn-based and does not need live walking characters. No GPU/shader dependency is added until it becomes useful.

## Acceptance

`node tools/verify.mjs`, `python -m unittest discover -s tests -p test_looprd.py`, in-browser Pixel Studio controls, sprite sheet export, local save/reload and two-browser avatar sync against a real updated Looprd component. Static Play/Pages builds must embed the same compiler source and require no extra runtime network calls.
