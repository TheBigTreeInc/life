# The Life Loop — Classic Board Art Production Handoff
**Design contract v1 | Game build 0.5.41 | 14 October 2026**

## Goal and current implementation
Create **original** modernized artwork for the 13 place identities of the Classic board. The board is already playable with default art. The reference game is *Jones in the Fast Lane*, but do not copy Sierra backgrounds, trademarks, fonts, character art or screenshots. Buildings should be immediately distinguishable from one another; gameplay names and click controls are separate HTML. Classic mode and Modern mode remain distinct.

**Source of truth:** `assets/boards/classic/routes.v1.json` for route and entrance geometry; `assets/art/styles/classic-modern/manifest.json` for the 13 exact filenames; `src/art.js` for rendering and fallback. Do not redraw the route over the shop paintings.

## Design deliverables and production specifications
- **Required:** 13 distinct building illustrations, each supplied as a layered/editable 1024×1024 px source (PSD, Aseprite or layered SVG) plus flattened PNG. RGB/sRGB; no flattened UI text or player markers.
- **Required runtime exports:** **26 WebP images** (one `card` and one `detail` for each venue), stored at the exact paths in the manifest. Recommended `card` export **448×256 px**, `detail` export **768×432 px**, both landscape (16:9). Preserve visual identity and door placement across the pair.
- **Hard runtime limit:** each exported `*.webp` file **≤500 KiB**, enforced by the asset generator. Keep transparent corners only if needed; opaque illustrations are fine. Compression should preserve crisp doors, signs, edges.
- **Crop safety:** show the full recognizable facade in the central **70% of the width and central 60% of height** of the master image. In landscape exports keep a clear entrance within the lower-central third; extra sky/streets can crop. The engine uses `object-fit: cover` on both sizes, so test each image at small mobile board scale.
- **No duplicate labels:** HTML overlays each location name, position number, price and player badge. Avoid baked-in business name or tiny embedded text. Prefer pictograms and architecture to convey function.
- **Style:** stylized and playful painterly 2D storefront artwork, clear mid-value contrast, inviting colors, simple readable silhouettes; keep the 13 buildings consistent in lighting, line weight, camera angle and proportions.
- **Accessibility:** distinguish important buildings by shape and props as well as hue; avoid flickering, tiny lettering or high-frequency textures. A building should still read around **140–180 CSS px wide** in phone Explore view.

## Immutable board layout
- The **same 5×4 geography** is used on desktop and mobile. Mobile offers a pannable Explore view and whole-board Overview; **do not** redesign the map for portrait orientation.
- Board route authoring canvas: **1000×750** logical units. Road overlay, pawn, preview paths, arrival and entrance graphics are rendered by the game on top. The imported original route has **170 waypoints**; game node positions and travel cost must not be baked into the art.
- Columns/rows are 1-based. Central city information/hub uses columns **2–4, row 2**; one south-west cell is intentionally unused at **(1,4)**.
- The entrance road side changes by building: north-row buildings face the **bottom gutter**, east-edge buildings face the **left gutter**, south-row buildings face the **top gutter**, west-edge buildings face the **right gutter**. Each shop should suggest a doorway on the side facing the road; the overlay itself determines the exact stop coordinate.

## Place-by-place artwork register
| Place | Stable ID | Grid cell | DOS place # | Waypoint index | Export names | Visual direction |
|---|---|---:|---:|---:|---|---|
| Le Security Apartments | `clinic` | (1,1) | 2 | 151 | `security-apartments-card.webp` + `security-apartments-detail.webp` | Secure apartment entrance, cameras/guard booth and greenery; higher-end residence; not a medical clinic. |
| Rent Office | `housing` | (2,1) | 1 | 164 | `rent-office-card.webp` + `rent-office-detail.webp` | Small administrative rent agency, receipt window, paper notices and welcoming desk. |
| Low-Cost Housing | `home` | (3,1) | 0 | 1 | `low-cost-housing-card.webp` + `low-cost-housing-detail.webp` | Modest low-cost apartment block, stairwell, mailboxes; not a detached house. |
| Pawn Shop | `pawn` | (4,1) | 12 | 14 | `pawn-shop-card.webp` + `pawn-shop-detail.webp` | Second-hand counter/storefront, lamps and electronics, tasteful pawn emblem. |
| Z-Mart Discount | `market` | (5,1) | 11 | 24 | `z-mart-card.webp` + `z-mart-detail.webp` | Large discount retail storefront, bargain bins and value-shopping cues; not a grocery market. |
| Monolith Burger | `diner` | (5,2) | 10 | 35 | `monolith-burger-card.webp` + `monolith-burger-detail.webp` | Approachable fast-food hamburger storefront with counter/serving window. |
| QT Clothing | `boutique` | (5,3) | 9 | 47 | `qt-clothing-card.webp` + `qt-clothing-detail.webp` | Fashion boutique with mannequins, outfit displays and tasteful awning. |
| Socket City | `tech` | (5,4) | 8 | 66 | `socket-city-card.webp` + `socket-city-detail.webp` | Appliance/electronics shop with computers, fridges and monitors in window. |
| Hi-Tech University | `university` | (4,4) | 7 | 75 | `hi-tech-university-card.webp` + `hi-tech-university-detail.webp` | Campus learning building, large entrance, steps, books/academic cues. |
| Employment Office | `agency` | (3,4) | 6 | 99 | `employment-office-card.webp` + `employment-office-detail.webp` | Job placement agency, job postings board and service counter. |
| Factory | `office` | (2,4) | 5 | 107 | `factory-card.webp` + `factory-detail.webp` | Manufacturing factory, brickwork, loading doors and smokestack silhouette. |
| Bank | `bank` | (1,3) | 4 | 120 | `bank-card.webp` + `bank-detail.webp` | Conventional bank with secure vault/columns; professional, inviting architecture. |
| Black's Market | `cinema` | (1,2) | 3 | 134 | `blacks-market-card.webp` + `blacks-market-detail.webp` | Fresh-food neighborhood grocery with produce, pantry goods and newspaper stand; **not a movie theater**. |

**Filenames are relative to:** `assets/art/styles/classic-modern/`. Do not rename location IDs or swap the two market identities. `cinema` is a historical internal key for Black’s Market; it is **a grocery store**, not a cinema. `clinic` is a historical internal key for Le Security Apartments; it is **housing**, not a clinic.

## Entrance, road and pawn ownership
- The artwork needs a **visually obvious entrance** at the street-facing edge, but do not paint a pawn, glowing path, arrow, circular highlight or route marker on the image. Those are interactive, SVG-based overlays owned by `src/route-overlay.js`.
- Keep the doorway unobstructed by tall decor, tree canopies or signs in the lower street-facing area. The overlay will add a green entrance door icon and arrival ring.
- The 170-waypoint road and buildings are separate layers. Never embed roads or hitboxes in the storefront WebPs; alignment must survive responsive layout, zoom and image replacement.
- The game currently draws small player markers and a road-following pawn using SVG; **new sprite sheets are optional**, not required for this handoff. If commissioned separately, plan transparent 32×40 px character frames in north/east/south/west directions, with at least idle and walk poses. Agree the frame atlas and anchor convention with the developer before production.

## Mobile and interaction acceptance
1. At **320px and 390px** viewport widths, Explore mode can pan across all 13 locations and each card remains legible; Overview may use reduced detail but retains position and target identity.
2. Tapping a building in mobile Overview first navigates to Explore **without spending travel time**; tapping again travels. No fake path or conflicting entrance should be visible.
3. The pawn follows the original 170-point route. After arrival the independently drawn door/arrival marker appears at the same stop, and the building action menu opens **centered** on screen.
4. The game remains usable without the art pack: missing pairs must fall back, not produce broken icons. All 26 files should be delivered together for final deployment.
5. The same art works across touch, keyboard and mouse interactions. Keep selectable buttons visually clear; do not embed interaction prompts in scene imagery.

## Import / build / test
1. Copy the 26 WebP exports into `assets/art/styles/classic-modern/` with the exact slugs in the register.
2. Run `node tools/generate-classic-art-assets.mjs` to compile detected complete `card`/`detail` pairs; an incomplete pair is a hard error.
3. Run `node tools/verify.mjs`. This regenerates the standalone `PLAY.html`, which embeds available assets for offline use. `node tools/build-pages.mjs` regenerates web deployment assets.
4. Run `TEST-CLASSIC-BOARD.bat` and manually inspect desktop **1440px**, phone **390px** and narrow phone **320px**. Visual QA must check crop, entrances, routes, tap targets and centered venue menu.

## Delivery checklist
- [ ] 13 layered editable masters + 13 1024×1024 source PNGs
- [ ] 13 card WebP files, recommended 448×256 px
- [ ] 13 detail WebP files, recommended 768×432 px
- [ ] Every WebP ≤500 KiB and matches manifest filename
- [ ] Clear entrance and a consistent 2D art direction for all buildings
- [ ] No embedded location titles, logos copied from original game, roads or UI
- [ ] Sample board-preview mock at 1440px and phone Explore at 390px (non-runtime reference only)

## Scope boundary
This handoff is for **Classic building art**. A full painted map background, pavement texture, interior scenes, character animation pack, alternate eras and new UI artwork can be commissioned later; they are **not required** for the next playable build. No runtime art has been generated or approved in this engineering pass.
