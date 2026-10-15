# Classic Board — artwork request

The Life Loop v0.5.25 uses the original *Jones in the Fast Lane* **13-location geographic layout** in Classic Rules, but with original Life Loop contemporary fallback graphics until you provide replacement art. Modern Story is unchanged.

**Artwork specification:** 13 distinct storefront/building scenes, one per Classic location. Supply square 1024×1024 PNG/JPEG masters (not screenshots of Sierra artwork), pastel/modern cozy city-game style consistent with our other building images, recognizable storefront features, no embedded text or logos; we overlay the business name in UI. Keep artwork within a safe middle region for cropping to landscape cards.

| Classic venue | Recommended input name | Distinguishing cues |
|---|---|---|
| **Le Security Apartments** | `security-apartments.png` | Upscale guarded apartment building, secure entrance and greenery |
| **Rent Office** | `rent-office.png` | Small rent agency building, paperwork/window notices |
| **Low-Cost Housing** | `low-cost-housing.png` | Modest older apartment block with simpler entrance |
| **Pawn Shop** | `pawn-shop.png` | Secondhand shop, lamps, electronics and gold pawnbroker emblem |
| **Z-Mart Discount** | `z-mart.png` | Discount department store with promotional shelves and bargain cues |
| **Monolith Burger** | `monolith-burger.png` | Fast-food burger venue with counter/drive-through |
| **QT Clothing** | `qt-clothing.png` | Clothing boutique with visible fashion display |
| **Socket City** | `socket-city.png` | Electronics and appliances retailer with TVs and fridges |
| **Hi-Tech University** | `hi-tech-university.png` | University/classical education building with steps and columns |
| **Employment Office** | `employment-office.png` | Employment agency with job notices and reception |
| **Factory** | `factory.png` | Large brick manufacturing factory with loading doors |
| **Bank** | `bank.png` | Financial bank with columns/vault motif |
| **Black's Market** | `blacks-market.png` | Neighborhood grocer with visible fresh food and newspaper rack |

**Implementation slots**: `assets/art/styles/classic-modern/<slug>-card.webp` (448px, cropped landscape) and `<slug>-detail.webp` (768px, larger destination scene). The packaged `tools/generate-classic-art-assets.mjs` autodetects a complete card+detail pair and includes it in offline and Pages builds. While pairs are absent, both variants fall back to our current non-DOS art. The game does not fetch external artwork or download style packs automatically.

**Important:** The three residence tiers already used in Modern are separate from the original DOS low-cost/secure apartment business images. These new Classic locations should remain independently recognizable whether or not the player currently lives in one.

Suggested delivery: send original 1024px master images here; they can be cropped and optimized into the correct WebP slots during the following integration pass. These are *source-style requirements*, not claimed original Sierra sprites.
