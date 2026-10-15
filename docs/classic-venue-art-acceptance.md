# Classic production artwork acceptance — 0.5.43

Source: supplied `convert_webp.zip` (13 venue pairs). All 26 WebP files have been installed at the **existing** `classic-modern` slots and compiled by `tools/generate-classic-art-assets.mjs`. The game’s modern art pack is not modified.

## Stable location geography

Clockwise from the northwest corner, the original place identities remain:

`Le Security Apartments → Rent Office → Low-Cost Housing → Pawn Shop → Z-Mart → Monolith Burger → QT Clothing → Socket City → Hi-Tech University → Employment Office → Factory → (southwest road crossing) → Bank → Black's Market → Le Security Apartments`.

This is a **5-column by 4-row geographic ring** with the southwestern road crossing vacant, as represented by `assets/boards/classic/routes.v1.json`. The active player and a weekly 60-unit clock appear in its open center. On mobile, Explore pans the same ring; Overview shows the complete ring without rearranging businesses.

## Artwork and entrance metadata

The `doorAnchor` field on each art manifest entry preserves the designer's normalized entrance coordinate (`x,y`, top-left origin). The **road graph is independent** of artwork and uses the original DOS stop indices. Door anchors are retained for visual tuning; they do not modify movement, cost or collision. For precise door-to-road connections, check the final render in Chrome on phone and desktop before adjusting visual-only connectors.

Card exports: 448×256 WebP. Detail exports: 768×432 WebP. Both under 500 KiB. Missing high-resolution editable masters should be archived by the artist separately.

Original timing formula and multiplayer live acceptance remain outstanding and are not implied by this artwork integration.
