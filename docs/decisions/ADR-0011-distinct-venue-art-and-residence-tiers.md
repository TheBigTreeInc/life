# ADR-0011 — Distinct venue artwork, residence-specific assets and portable default art

**Status:** Accepted

## Context

Generic vector façades look too similar; user supplied unique scene artwork for all 12 locations, but the Home picture represents a detached house while the engine has three rental tiers (studio/apartment/loft). Visuals must not alter original Jones-style mechanics or compromise the completely offline one-file edition.

## Decision

Use the eleven non-home paintings from the user as the Contemporary/New Day City default, resize into WebP 448px tile and 768px detail variants and ship a versioned manifest in `assets/art/styles/contemporary-default/manifest.json`. The root `src/art-assets.js` is the synchronized browser mapping. Both board and destination call `LifeArt.scene(location, compact, era, activePlayer.home)`. For Home, use distinct tier-sensitive vector fallbacks until appropriate user-provided files are supplied. The detached-house drawing is retained as an **unassigned reference only**, not displayed for a rented studio or loft. Historical and Sci-Fi retain distinct procedural SVG themes.

Offline `PLAY.html` inlines the WebPs as data URIs; GitHub Pages emits external cacheable WebPs and has no requirement to load the separate asset JSON at runtime. A future pack manager can select other art manifests from local downloads; pack installation/controls are out of scope. Keep each player independent and preserve save compatibility: game state persists the `home` key, not image URLs or the art pack.

## Acceptance

- Every supplied venue picture is correctly mapped by semantic location ID, not board ordering.
- Different housing tiers render distinct fallback SVGs, and changes are visible on board and destination as soon as game state changes.
- Missing optional housing art cannot break the game; existing SVGs remain available.
- Historical/Sci-Fi remain procedural and mechanics are unaffected.
- Pages and standalone run without runtime network requests for essential art.
