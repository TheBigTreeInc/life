# ADR-0013 — In-game illustrated portrait catalog

**Status:** Accepted

## Decision

Provide selectable in-game portrait art with curated illustrated (16) and classic reference (35) packs. Preserve the existing editable SVG avatar for users who prefer direct control over skin, hair, clothing, and expression. Do not pretend selecting hair color will recolor a finished illustration: show the editable controls only for the custom drawn option.

Only validated portrait identifiers are stored in browser-local profiles and game/Looprd snapshots; pixels remain bundled resources. All portrait assets are optimized WebP files, embedded in standalone `PLAY.html` and served as cacheable files on GitHub Pages. The existing Looprd Room schema and Classic mechanics are unchanged; the handler accepts the optional portrait ID.

## Validation

Automated tests cover ID validation, saved game state, client portrait markup, manifest completeness and source integration; manual testing with a live Looprd server is still needed.
