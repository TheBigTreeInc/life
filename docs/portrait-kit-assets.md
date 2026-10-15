# Modular Portrait Kit derivative assets

The user supplied `modular-portrait-kit-1.0.0-javascript.zip`. The Life Loop includes its dependency-free renderer/editor JavaScript and the two original art-pack contracts. For rapid local and mobile trials, the supplied PNG source layers have been **resized to 512×512 and encoded as transparent WebP**; the copied `pack.json` files declare the new 512×512 component canvas and keep unchanged pack IDs, logical size and layer ordering.

These WebP layers are previews intended for The Life Loop package, not a replacement for artist-editable 1254×1254 original masters. Keep those masters in the separate portrait-kit source repository. The UI downloads them lazily on first edit; the offline PLAY.html includes compact inline copies.

The independent Social profile stores only validated appearance component IDs and color values, never image data or component file paths. For future hosted packs configure `window.LooprdPortraitAssetsBase` at startup with an HTTPS URL; the renderer loads the pack manifest and layers from the same origin. Preserve pack ID + revision immutability or provide explicit migrations before changing published art.

The user-supplied kit described two art families: Everyday illustrated and DOMINION pixel, plus a separately available game bridge. No cross-engine sprite motion rig is being implied by this portrait-only integration.
