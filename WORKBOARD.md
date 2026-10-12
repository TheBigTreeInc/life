# The Life Loop — workboard v0.5.19

Full-source release: `the-life-loop-0.5.19-ziprunner.zip`. Workboard update schema: `ziprunner.workboard-update.v1`.

## Completed

- [x] LL-001 — Life simulation, city navigation, time budget and four goal tracks.
- [x] LL-002 — Career/economy/education/housing/food/bank/rival mechanics.
- [x] LL-003 — Original illustrated city scenes and storefronts.
- [x] LL-004 — Twelve original NPC portraits and contextual dialogue.
- [x] LL-005 — Twelve unique two-choice character stories.
- [x] LL-006 — Conversation cooldown, social history, story save/resume.
- [x] LL-007 — Offline, reproducibly built single-file playable HTML.
- [x] LL-008 — Baseline gameplay and artwork regressions.
- [x] LL-009 — Flat-root complete ZipRunner source, workboard manifest, validation.
- [x] LL-015 — Independent persistent player-to-NPC relationships and choice memory.
- [x] LL-016 — Twelve relationship-gated favors with a four-week cooldown.
- [x] LL-017 — Ten rotating civic events with actual sector prices and wage effects.
- [x] LL-018 — One-per-event city activity and visible City Pulse dashboard/map marker.
- [x] LL-019 — Save migration, social/economic testing, 250-week simulation; 35 green tests.

- [x] LL-010 — Financial history ledger, wealth graph, bank-transfer treatment and milestones.
- [x] LL-020 — Nine chapters across three intersecting seasonal NPC stories.
- [x] LL-021 — Cross-resident trust and permanent civic legacies.
- [x] LL-022 — Finance accounting, bounded history and v0.1–0.3 save migration.
- [x] LL-023 — Expanded regression and 1440px/390px browser smoke.

## In progress / future

- [ ] LL-011 — Original optional sound effects/music with offline audio controls.
- [ ] LL-012 — AI difficulty choices and more robust economic balance over diverse seeds.
- [ ] LL-013 — Privacy/ready screen during local hotseat handoff.
- [ ] LL-014 — Actual local Windows/macOS/Linux/mobile manual QA; browser blocked file:// here.

## Operator checks

1. Place release ZIP in ZipRunner inbox. Confirm flat root and correct `the-life-loop` project assignment.
2. Run `node tools/verify.mjs` (Node 20.11+). **Apply workboard update only after build success**.
3. Open `PLAY.html` in Windows Chrome/Edge offline. Check the City Pulse and start a game. Open Finances; verify chart, ledger and transaction tracking. After four weeks the city event changes.
4. Talk to Mira and help with the shelf. Build 18 trust with Mira (talk again next week), start The Block That Built Itself, then return after two weeks for the second chapter. Complete its final chapter and inspect the 5% city food discount. Her friendship favor must retain its four-week cooldown.
5. Visit the current civic event location and accept its event activity. Confirm it can only happen once during the four-week window.
6. Export/import JSON and confirm trust, memories, city legacies, story stages, finance records and prices are unchanged. Try importing an older v0.2/v0.3 save.
7. Check text readability and layout and Finance modal at 1440px and 390px, with reduced motion enabled. Confirm user configuration and `.git` are untouched; inspect Git diff before committing.

No automatic Git push requested. Actual ZipRunner ingestion and OS browser checks remain pending operator validation.

## GitHub Pages deployment (v0.4.3)

- [x] LL-024 GitHub Pages static publishing: publish single-file HTML from `dist/`
- [x] LL-025 CI gate: verify gameplay and ZipRunner workboard before Pages deployment
- [x] LL-026 Deployment instructions, local save caveats, and Git publishing via ZipRunner
- [ ] Operator check: create/choose public GitHub repository and enable Pages workflow
- [ ] Operator check: confirm public URL, HTTPS, browser storage, and Save/Load on live site

No GitHub repository was created and no Git push/deployment was performed as part of this ZIP.

## Employment parity and original gameplay audit (v0.4.3)

- [x] LL-027 One primary employer; label active employer and pay; confirmation when changing roles; no old-workplace shifts.
- [x] LL-028 Repeatable home employment loophole constrained to an unemployed-only, one-per-week fallback; AI and legacy saves tested.
- [x] LL-030 Written original-vs-remake gameplay audit (`GAMEPLAY_AUDIT.md`) with 9 new tests, desktop/mobile Chromium smoke, 100-seed AI stress, and manual acceptance steps.
- [ ] LL-029 Fuller parity: clothes durability, more original-style jobs/course prerequisites, extended economy/weekend event variety.

Operator must verify cancelling the switch preserves time and job, and accepting it replaces the old contract. GitHub Pages configuration is unchanged.

## Clothing and career fidelity (v0.4.3)

- [x] LL-029, LL-031–LL-035 — Week-based casual/dress/business wear, cheap/premium clothing shops, uniform hierarchy, new employment tracks and four qualification courses.
- [x] Save migration from older unlimited clothing; AI outfit restocking; all 70 automated checks green.
- [ ] LL-036 — Original named degrees/job catalog completeness, additional living costs, pawnshop/layoffs, more exact pacing.

Operator acceptance: Career Center → hire entry position → work until clothes expire → buy replacement clothing at market or boutique → verify work resumes. Complete Service & Supervision at university to unlock a supervisory application. Check GitHub Pages workflow and ZipRunner workboard update. No automatic push.

## Architecture and original-mechanics mandate (v0.4.4 — documentation release)

- [x] **LL-037** Accepted `ARCHITECTURE.md` and ADR-0001: **same core game mechanics as original 1991 Jones, modern UX/art/accessibility**, never silent balancing changes.
- [x] **LL-038** Evidence-backed 21-rule parity contract (`docs/parity-contract.json`), human-readable matrix and original gameplay reference; ZipRunner verification enforces files and rule registry.
- [ ] **LL-039 (P0)** Original 60-hour turns, movement/building entry and action time costs; full/partial-session engine parity tests.
- [ ] **LL-040 (P0)** Original application outcomes, experience/dependability per session, progression caps, decay and firing; modern civic/stat bonuses isolated from Classic Rules.
- [ ] **LL-041 (P1)** Eleven original degree prerequisites, course sessions, dual-degree job requirements, original goal scoring and manual rent/loan decisions.
- [ ] **LL-042 (P2)** Food storage/spoilage, pawn market, investment options, event timing and four human players.

**Governance:** Every mechanic-changing release must update its rule ID(s), reference evidence, acceptance tests, migration decision and workboard. `Implemented` is not an assertion of DOS binary equivalence. `v0.4.4` **does not change gameplay**; all existing v0.4.3 engine discrepancies remain open. Operator handoff: verify the ruleset source and architecture files in the ZIP; run `node tools/verify.mjs`; do not auto-push to GitHub without project authorization.

## v0.4.5 — Rulesets and world eras

- [x] **LL-043:** New Game Classic Rules / Modern Story selection; Classic default in UI, Modern fallback for legacy saves. Documented P0 original time/stat elements partially implemented.
- [x] **LL-044:** Historical Willowford, Contemporary New Day City and Sci-Fi Neon Meridian with different SVG structures, resident costumes and palette; same engine/economy.
- [x] **LL-045:** ADR-0002, parity matrix/registry, six-combination regression tests and ZipRunner manifest verification.
- [ ] **LL-039, LL-040:** Remaining DOS fidelity: original map step timing, partial shift work, vacancy probabilities, job-stat formulas, dismissal, hiring consequences. Classic is **not yet full parity**.
- [ ] **LL-041, LL-042:** Eleven-degree graph, scoring, manual rent/debt/economy and four-human play.

**Operator smoke checks:** New Game options at desktop/mobile; Modern 40h vs Classic 60h; three era city visuals; save/import; `node tools/verify.mjs`; Pages build. Git push remains operator controlled.


## v0.4.6 — Classic Career & University

**Implemented:** Original reference 11-diploma tree, $50 enrollment, ten-lesson 6h study and up-to-four active classes, supported computer/books extra credit, +5 graduation boosts and persistence; Classic 10 initial XP, job-change +2 XP, work-stat cap formulas, unreliable employment warning/dismissal and raise thresholds, degree/reliability scoring; Classic roadmap and new tests. See `docs/decisions/ADR-0003-classic-progression-education-employment.md`. Modern mode was deliberately not rebalanced.

**Still open:** Exact Sierra job/wage catalog (current 19 jobs retain Life Loop names and mapped prerequisite approximations), employment office vacancy probability, partial-work edge cases, monthly rent/arrears, full lending and bank markets, pawn shop, four-human mode, original events and direct DOS capture. Pass these as future workboard items rather than falsely closing parity.

**QA:** `node tools/verify.mjs` and `node --test tests/classic-parity.test.cjs`; verify Classic and Modern from the New Game screen, the university and Careers modal at desktop/mobile sizes.

## v0.5.0 — Authentic floppy roles and rent

- [x] LL-055 — Add 37 DOS/floppy occupations: nine employers, original base wages, requirements, uniforms and degrees. Intentionally omit two documented CD-only roles.
- [x] LL-056 — Keep Modern's 19 original Life Loop jobs; Classic-only original-applicant roll, 4h refusal costs, no-opening lockouts, guaranteed entry cook, and posted-wage raises.
- [x] LL-057 — Manual Classic cash rent ($325 on week 4), one-week extensions, interest and 50% wage garnishment. Do not auto-transfer bank funds.
- [x] LL-058 — Classic venue filter and Classic/Modern old-save migration, employer disambiguation, AI rent/food strategy, Chromium desktop/mobile smoke.
- [x] LL-059 — ADR-0004, canonical DOS job data table and 110-test regression.
- [ ] LL-060 — Original standalone building map, DOS emulator side-by-side test captures, complete rent advances, loan/default, furniture economy, bank stocks, pawn, food, events and goal parity.

**Operator check:** Install ZIP; `node tools/verify.mjs`; Classic New Game → Career Center filter → Monolith Cook → six-hour shift. Week 4 → Rent Office; pay in cash, or test extension and arrears. Switch jobs, test no-opening rejection, inspect Careers roadmap. Repeat in Modern and verify original 19-job catalog, automatic rent and Modern stories. Test desktop/browser-storage and GitHub Pages publishing locally. No automatic Git push.


## v0.5.1 — Classic financial and food systems

- [x] LL-061 — Classic savings transfers in $100 increments, zero time and zero savings interest; Modern unchanged.
- [x] LL-062 — Classic two-hour lending with $45 principal + $5 interest repayments, monthly default tracking and declining credit after defaults; underwriting formula marked provisional.
- [x] LL-063 — Separate T-Bills, Gold, Silver, Pork Bellies, Blue Chip and Penny Stock portfolios, two-hour broker admission, single-unit trading, deterministic stock variation, $97 T-Bill resale. The price random walk is not identical to Sierra's DOS implementation.
- [x] LL-064 — Black’s Market fresh food in 1/2/4 bundles, fridge 6/freezer 12 capacity, week consumption and unrefrigerated spoilage; approximate doctor bill explicitly labeled.
- [x] LL-065 — v0.5.1 parity contract, ADR-0005, save migration, dedicated test suite and complete ZipRunner/Pages build.
- [ ] LL-066 — Recreate Pawn Shop, exact stock underwriting/volatility/crashes, robbery outcomes, bank/food action oddities and original distinct ring board in DOS-comparison tests.

Operator regression: New Classic, bank deposit/withdraw $100 with no time loss; get a job, obtain loan and pay installment; broker T-Bills lose $3 on liquidation. Market buy 4 portions with and without refrigeration; confirm 6/12 capacity, then import an old Classic save. Repeat Modern to confirm legacy banking and groceries. Do not auto-push to git.

## v0.5.2 — Online friend-code co-op / Looprd

- [x] LL-067 — Self-contained `looprd.yaml` component according to pac-labs/dapi `looprd/v1`, with private room model, hardened capability tokens, change notifications, 48h idle expiry and public info route.
- [x] LL-068 — Browser lobby and friend-code joining; host link and reconnectable browser session; remote hotseat mode keeps the original LifeGame engine.
- [x] LL-069 — WebSocket notifications + authenticated HTTP commands (Looprd native subscription semantics); host runs authoritative JS engine and publishes the snapshot.
- [x] LL-070 — Protocol and permission tests; existing game tests retained.
- [x] LL-071 — ADR, operating notes and sources-file integration.
- [ ] LL-072 — Native server-side simulation authority, host migration, spectators, and production soak/security testing.

Operator checks: run `node tools/verify.mjs`; optionally run `python -m unittest discover -s tests -p test_looprd.py` after installing SQLAlchemy/PyYAML. Configure the Looprd sources file and allow Python; point the browser to the same URL, ensure `LOOPRD_ORIGINS` includes the GitHub Pages origin. Test from two browsers/machines. No GitHub changes or server deployment are performed by the ZIP.


## v0.5.3 — Mobile game UI + simpler Looprd address

- [x] Mobile three-tab City/Activities/My life navigation and persistent turn summary; tapping a building selects Activities.
- [x] Illustrated 2-column storefronts on phones, larger action cards, safe-area tab bar and scrollable mobile dialogs.
- [x] Server setup accepts only API base FQDN; implicit `/looprd/the-life-loop/v1` plus invitation links.
- [x] Mobile structural regression, Chromium responsive smoke and architecture ADR-0007; complete source + ZipRunner handoff.
- [ ] Real Android/iOS device checks (especially keyboard and network recovery) and live external Looprd host test.

### v0.5.3 ZipRunner workboard manifest hotfix

- Fixed LL-072 remaining-task priority (`P1` → `high`) to satisfy `ziprunner.workboard-update.v1`; the parity contract uses a separate P0–P3 vocabulary and is unchanged.
- Added ZipRunner priority enum validation to `node tools/verify.mjs` so invalid workboard entries fail before a ZIP is published. No game mechanics or save data changed.


## v0.5.3 — GitHub Pages manifest synchronization (CI metadata repair)

- [x] LL-076 — Reconcile GitHub's stale `.ziprunner-workboard-update.json` (0.4.1) with the v0.5.3 game, architecture, Looprd, and mobile UI. Update release handoff.
- [ ] Operator: commit the corrected manifest and handoff to the actual GitHub `main` branch. ZipRunner installing or processing a workboard update is not proof the JSON file was committed.
- [ ] Operator: confirm GitHub Actions `Deploy The Life Loop to GitHub Pages` runs `node tools/verify.mjs` successfully and deploys.

This release makes no gameplay or online protocol changes. Private state and local configuration must remain excluded.

## v0.5.4 — Release version synchronization

- [x] **LL-077** — Bump the CI/workboard repair to a new v0.5.4 ZipRunner release. Keep manifest, game footer, package version, Looprd release, parity contract and handoff in sync.
- [x] Generate the ZIP filename from package version and verify version metadata before publication.
- [ ] Operator: commit **all** v0.5.4 source files, especially the hidden workboard JSON, rather than uploading only the built HTML.
- [ ] Operator: validate the GitHub Pages Actions build, website and Looprd discovery after deployment.

No changes to gameplay, saved games, or Looprd database schema.

## v0.5.5 — Sliding panes, game menu, online turn diagnostics

- [x] **LL-078** — Responsive side drawers for Your Story/Your Destination at 1025–1599px; automatic three-column layout at 1600px+ and existing mobile navigation.
- [x] **LL-079** — Notification circles for new story/venue updates, cleared by visiting the panel; larger screen panels remain visible.
- [x] **LL-080** — Top-right Save, Load, How to Play menu with keyboard and outside-click handling.
- [x] **LL-081** — Persistent multiplayer turn ownership, host/guest and transport status; Looprd component info probe and room version diagnostics.
- [ ] **LL-082 (high)** — Production acceptance: deploy `looprd.yaml` on a real Looprd server, verify GET `/looprd/the-life-loop/v1/info`, WebSocket subscription, 2-browser turns/reconnects and unauthorized command rejection.

Operator: run `node tools/verify.mjs`; check widths 390, 1024, 1280, 1600; open slide-out panels and menu; connect as two users, confirm distinct OWN/WAITING labels in both browsers. `the-life-loop-0.5.9-ziprunner.zip` must include the updated hidden manifest. No runtime/config/private files included.

## v0.5.6 — Local reusable character creator

- [x] **LL-083** — Browser-local library of up to sixteen independently selectable profiles. Create, edit, delete, and switch characters; no remote account or shared browser session needed.
- [x] **LL-084** — Character studio with illustrated preview, skin tones, hair style/color, outfit, favorite color, expression, and descriptive personality. Accessible from New Game and the top-right menu.
- [x] **LL-085** — Embed validated cosmetic appearance in saved-game snapshots without changing Classic/Modern mechanics, support old save files, and add automated regression coverage.
- [ ] **LL-086 (medium)** — Optional explicit portable character-library export/import, live guest portrait propagation through separately validated Looprd protocol, and Android/iOS persistence acceptance.

**Operator QA:** Create multiple characters in a browser; verify persistence after refresh and independent profile selection. Check quick-name play without profiles, local two-player character selection and online join display-name selection. Confirm save/import retains appearance, existing Classic saves still load, and private profile lists are not packaged or sent to Looprd. `the-life-loop-0.5.9-ziprunner.zip` is a full-source ZipRunner archive.

## v0.5.7 — Shared characters, ephemeral multiplayer chat, no page scroll

- [x] **LL-087** — Guest-selected name and sanitized appearance/colors persisted into the authoritative multiplayer game snapshot at join; both players see the same guest identity. Browser-local profile libraries are not transmitted.
- [x] **LL-088** — Authenticated encrypted chat publish over HTTP, live notification delivery over Looprd WSS, no message persistence or replay. Chat disabled without WebSocket, cleared on disconnect. Room-scoped AES-GCM key is generated at room creation and available only through authenticated room endpoints.
- [x] **LL-089** — Fixed-viewport game, no window vertical scroll; dedicated story/action scrolling for content that cannot fit; condensed three/four-column city and removal of redundant status/time/venue summaries.
- [x] **LL-090** — Three-step compact mobile New Game (Character, World, Goals); viewport-contained setup with persistent action buttons.
- [x] **LL-091** — Looprd schema v2 with private `chatKey`; regression tests for room appearance and ephemeral chat. No gameplay or economy rebalance.
- [ ] **LL-092 (high)** — Back up and migrate the live Looprd Room table from v1 to v2 (chatKey), load updated `looprd.yaml` and test full WSS chat, two browsers and reconnect. Looprd runtime migration behavior is deployment-specific and cannot be assumed automatic.

Acceptance: run `node tools/verify.mjs`, Python Looprd tests, and test phone 320×568 and 390×844 plus 1280/1600 desktop. Confirm no **document** scroll; lengthy panels may scroll internally. On mobile, begin a new game without scrolling through every setup option. Confirm guest appearance in both clients and encrypted chat only on open WSS; no chat messages in Room state or saved games. No runtime or credentials in the artifact.

## v0.5.8 — Distinct Contemporary building art and residence-aware asset slots

- [x] **LL-093** — Import supplied unique 11 venue illustrations as optimized dual-resolution WebP art; no changes to gameplay or non-Contemporary art.
- [x] **LL-094** — Separate `home`/Your Place from Open Door Realty. Artwork selection follows each player's residence (`studio`, `apartment`, `loft`) and updates after a housing upgrade; use tier-specific procedural fallbacks when art is unavailable.
- [x] **LL-095** — Versioned art-pack manifest, browser art mapping, offline embedding, cacheable Pages assets, and source/manifest verification. Detached-house example retained as unassigned reference only.
- [x] **LL-096** — Automated artwork coverage, imagery inspection, release-version checks, clean source ZIP with updated workboard.
- [x] **LL-097** — Three tier-specific residence images installed in v0.5.9; no rental-stat changes.
- [ ] **LL-098** — User-facing local art pack import/switching and offline content validation; future opt-in downloadable styles.

Operator acceptance: verify Contemporary tiles for Career Center, Fresh & Frugal, Good Fork, Clinic, University, Tech, Northstar, Boutique, Realty, Bank and Cinema. Enter each venue and verify matching detailed painting. Check Home in each tier (images included since v0.5.9). Verify Historical and Sci-Fi remain procedural, export/import preserves housing, and repeat against GitHub Pages + portable PLAY.html.


## v0.5.9 — Real residence artwork and Classic parity checkpoint

The three user-provided homes are installed in `homeTiers`; each has a 448px card and 768px destination WebP. Housing changes update the visible residence while the Realty office remains separate. No gameplay changes.
- [x] **LL-099** — Regression for three different home scenes, WebP image limits, offline single-file embedding, cacheable Pages assets, unchanged Historical/Sci-Fi scenes, and updated ZipRunner manifest.
- [ ] **LL-098** — Optional downloadable user-selectable art packs remain future work.

**Original Classic mechanics progress (no change in v0.5.9):** parity contract currently tracks 22 rule IDs: 2 implemented, 19 partial and 1 missing. High-priority outstanding areas: exact original action/movement hours (especially partial shifts), job dependability/vacancy/firing rules, original scoring, four-human play, the pawn shop and DOS-aligned price/random-event behavior. The self-reported contract is **not** proof of original binary equivalence; operator acceptance requires side-by-side DOS captures and measurements.

**Operator smoke:** choose Contemporary Starter Studio, inspect Home and Your Destination; upgrade to Sunny Apartment / Skyline Loft and verify pictures change without a balance change. Repeat in Historical and Sci-Fi (procedural art). Save/reload and test both responsive and standalone editions. Run `node tools/verify.mjs`.


## v0.5.10 — Quick Start and reusable new-game settings

- [x] **LL-100** — Store sanitized local preferences for rules, era, solo/hotseat/online/sandbox mode and four goal values independently of character library, game save and Looprd room. Restore them automatically; one-click reset to defaults.
- [x] **LL-101** — Initial game screen is a compact Quick Start: choose character and mode, then Start. Existing autosave gets a prominent Continue; starting over requires confirmation. Optional advanced accordion displays settings summary without demanding setup on every start.
- [x] **LL-102** — Single layout for desktop and mobile without old three-step wizard; sticky Start/Continue footer, optional internal Advanced scrolling. New tests, ADR-0012 and ZipRunner version sync.

**Operator acceptance:** Load fresh page and start without entering an advanced wizard. Change goals, era, rules and game mode in Advanced, refresh and confirm persistence. Start a new game only after acknowledging overwrite of any previous autosave; confirm Cancel leaves that save intact. On mobile check 320×568, 390×844; actions remain visible. No game balance, original DOS parity rules, live multiplayer protocol or character storage changes.

## v0.5.12 — Real portrait gallery inside the game

- [x] **LL-103** — Select 16 new illustrated portraits and 35 user-supplied classic portrait thumbnails directly in Character Studio. Fixed illustrations have a clearly labeled gallery; Custom drawn remains available for fine-grained skin/hair/outfit changes.
- [x] **LL-104** — Carry validated portrait IDs into browser-local character records, game saves and online guest room snapshots. No image data, profile IDs or paths are sent to Looprd.
- [x] **LL-105** — Produce optimized WebP source assets and versioned manifest; embed assets in portable `PLAY.html` and copy to cacheable GitHub Pages directories; add tests and CI gates.
- [ ] **LL-106 (high)** — Operator: deploy updated Looprd handler to retain remote guest portrait IDs. Requires no Room table migration; accept a fresh co-op room and validate both players' portraits.

Operator acceptance: test 320px mobile and large desktop. Open My characters, select a modern or classic portrait, save and start a game, reload and confirm the image persists in sidebar. Switch to Custom drawn and confirm existing color/hair controls still respond. Test both host and guest with a freshly registered Looprd component. No gameplay or Classic rule changes.


## v0.5.13 — Data-driven Pixel Studio character compiler

- [x] **LL-107** — Source-controlled `assets/characters/pixel-v1/catalog.json` contract with three body templates, component slots, semantic material palettes, draw bands, interaction variants and idle/walk frame timing; generated browser catalog included in source ZIP.
- [x] **LL-108** — Pure deterministic compiler and render adapters: 32×40 nearest-neighbor geometry, 4 directions, idle and walking (24 shared-clock poses), stable draw order, bounded appearance cache, SVG sidebar thumbnails and 2D Canvas preview/sprite-sheet PNG export.
- [x] **LL-109** — Pixel Studio in Character Studio: skin, hair, hair color, body silhouette, hat/hairstyle compatibility, clothing, accent, expression, and personality; touch-friendly pose controls and animated preview. Existing 51 portrait choices remain independent.
- [x] **LL-110** — Small validated character configuration saved locally, in game snapshots and guest join; versioned catalog and Looprd guest appearance field allowlist, with no database table migration. Tests cover pose completeness, deterministic draw, hats, Canvas/SVG, persistence and release metadata.
- [ ] **LL-111 (medium)** — Future art-production pass: authored 32×40 PNG/RGBA sprite atlas with trim/anchors; extended garment/hat masks, distinct body-specific artwork, more actions and directional details. Current procedural sprites establish the compiler and renderer contract; they are not a finished production atlas.

**Operator acceptance:** Open My Characters → Create, switch to Pixel Studio, select three body types, hairstyles and a cap/beanie; confirm hair compresses under hats. Use direction arrows and Walk, export the PNG sheet; save and start a game, verify pixel thumbnail in sidebar. Reopen and verify saved parts. For online, deploy updated `looprd.yaml` handler and start a fresh room, confirming guest body/headwear choices show for both players. Run `node tools/verify.mjs` and Python Looprd tests. No changes to Classic economy, city art, or server database schema. Git push/deployment are manual.


## v0.5.14 — Character customization temporarily disabled

- [x] **LL-112** — Restore the original fixed character icons (player 🧑‍🎨, local friend 🧑‍🚀, rival 😎). Hide My Characters in the top-right menu; remove character selection from Quick Start and online join. No new custom appearance is transferred to games or Looprd rooms.
- [x] **LL-113** — Keep all the character creator, Pixi-like compiler/renderer, sprite/portrait assets, saved local profiles and references in source under `ENABLE_CHARACTER_CUSTOMIZATION=false`. The original profiles and old save data are **not** deleted, but customized avatars are ignored during play while the feature is off. Regression-test disabled UI and preserve future reactivation.

**Operator acceptance:** Open v0.5.14 at 320px and desktop. Start a game with an ordinary name; verify the default emoji avatar in Your Story and absence of character fields in Quick Start and online join. Verify `Menu` lacks My Characters. If you open a previously customized save, the original icon appears, while the old appearance data is not altered or deleted. `node tools/verify.mjs` and the Looprd handler tests should still pass. No game economy, rules, chat or server schema changes.


### v0.5.15 — Compact city navigation and status

- **LL-114 — Implemented:** Replaced dark brand bar and extra city title with single Life Loop heading; Careers and Finances beside logo, New Game moved under Menu.
- **LL-115 — Implemented:** Destination, WSS-only Chat (unread badge), Co-op dropdown and Menu are right-aligned. Room code, participants, turn owner and WS/HTTP status reside in Co-op.
- **LL-116 — Implemented:** Removed pale-green turn band and redundant week/market location; added ticker directly beneath the board, showing turn, week, market status and time. Keeps original gameplay and mobile tabs.
- **Acceptance:** visual QA at 320/390/768/1280/1600 widths, menu and co-op dropdown dismissal, unchanged WSS chat gate and unread marker, clean ZIP and CI.


## v0.5.16 — Classic partial work and pawn economy

- [x] **LL-117** — Restore partial work sessions when only 1–5 hours remain, with proportional gross pay and action costs; retain the full 6h/8h paid shift.
- [x] **LL-118** — Accumulate partial work toward six-hour experience/dependability credit; reset when jobs change or player is dismissed, avoiding one-hour shift grinding.
- [x] **LL-119** — Add Classic pawn/loan, on-time redemption, and expired-property resale to another player for refrigerator, freezer, computer, and three books. Pawn desk is temporarily at Circuit City; economic coefficients are provisional.
- [x] **LL-120** — Serialize shared pawn lots, validate on load, and test positive/negative cases and Modern isolation.

**Operator acceptance:** Hire a Classic cook; use travel or other actions to reach the workplace with 3h left, work and verify proportional salary/zero remaining time. At Circuit City buy a computer, pawn it, save/reload, and redeem it before deadline. For resale, use two local humans and advance past the redemption deadline. Check no pawn actions in Modern Story. `node tools/verify.mjs` and `python -m unittest discover -s tests -p test_looprd.py -q` must pass. See [ADR-0017](docs/decisions/ADR-0017-classic-partial-work-and-pawn-lifecycle.md). Exact DOS observed time/currency formulas and separate pawn venue are still backlog.


## v0.5.17 — Shared city geometry and qualified-first careers

- [x] **LL-121** — Shared 13-venue board in Classic and Modern, with a 4×5 perimeter, a central hub and an unclickable public garden slot. Every business has unique stable ID and position.
- [x] **LL-122** — New standalone Second Chance Pawn, with distinct player-created Contemporary artwork and procedural Historical/Sci-Fi fallback. The pawn, redeem and buy lifecycle moves from Circuit City to this venue in both rulesets. Fees and timing remain provisional and need DOS verification.
- [x] **LL-123** — Career Center now displays eligible jobs first. A clear opt-in checkbox exposes future roles, missing requirements and the original failed-application mechanic. The full roadmap remains in Careers.
- [x] **LL-124** — Travel cost derives from actual ring positions, not a list index; regression tests, asset checks and source/Pages release verification.

**Original-fidelity note:** A referenced Jones guide confirms underqualified job applications are possible and display missing qualifications. Hiding these by default is a Life Loop convenience rather than verified DOS UI parity. The full 13-venue map is now shared, but we have not yet split all original businesses (such as Z-Mart and Black's Market) into distinct destinations. Pawn values and redemption deadlines are also still unverified.


## v0.5.19 — Original Classic economy, goal points and Jones opponent difficulty

- [x] **LL-125** — Classic start $200 cash / $0 savings; Modern Story $250/$100 retained; opening finance history consistent.
- [x] **LL-126** — Original-derived per-goal Classic statistics (liquid assets/100; happiness stat; 1+9 per degree; career 1.25×Dependability while employed) and four independent victory checks.
- [x] **LL-127** — Jones difficulty presets (Take It Easy +40, Play Fair ±0, Go For Broke −40); default human 200 goal points. Rival goals independently allocated from a seeded approximation that biases wealth within ten points and roundtrip in shared snapshots.
- [x] **LL-128** — Employer-first Classic Employment Office selector, qualified jobs by default, future job opt-in and original rejection behavior preserved. AI purchases replacement uniform before depletion to stay solvent after original starting-cash correction.
- [x] **LL-129** — Regression suite, updated documentation, parity contract, ZipRunner version synchronization and clean package.
- [ ] **LL-130 (high)** — Capture DOS reference checks for Jones goal distribution, exact treatment of liabilities in wealth and original win evaluation timing. Our implementation deliberately marks those as approximations.

**Operator acceptance:** Start Classic, confirm $200 cash/$0 savings; open Game Settings and compare Jones difficulties at default goals (240/200/160). Visit Employment Office and switch employer, then Show future jobs and verify missing qualifications plus rejection. Verify Modern retains its balances. Run full verification and test across two browsers for networked snapshots. See ADR-0019.

## v0.5.19 — Primary-source Classic scoring correction

- [x] LL-131 — Sierra Quick Reference crosswalk, annotated distinction between primary evidence and provisional algorithms.
- [x] LL-132 — Original-style money goal values owned durable goods; incomplete diploma work counts toward education.
- [x] LL-133 — Two-week hopeless-stranding relative rescue; explicit tested $90 provisional gift with eight-week cooldown.
- [ ] LL-134 — Original weekly economy index, robbery/house security, durable item breakage and store inventory parity.

See `docs/decisions/ADR-0020-printed-reference-classic-economy.md`.


## v0.5.20 — Centered decisions like the original board game

**Artifact:** `the-life-loop-0.5.20-ziprunner.zip` · **Status:** implemented and regression-tested.

- [x] **LL-135** — Clicking a tile opens a board-centered location menu showing the location's real engine actions; visual-only open/close, Done, Escape, focus management.
- [x] **LL-136** — Remove right-hand Your Destination action chooser and mobile Activities tab. Shared 13-venue city fills the space; mobile remains City / My Life.
- [x] **LL-137** — Preserve Classic employer-first job filtering and optional future jobs, bank, rent, pawn, work, purchases, stories, and global confirmation overlays.
- [x] **LL-138** — Move End week into the ticker; venue options scroll internally at narrow sizes with a fixed Done button. Check access on a 320×568 phone.
- [x] **LL-139** — Guard network requests and multiplayer turns; discard stale venues on turn/location changes. Keep WSS-only chat and Looprd schema unchanged. Add regression and browser acceptance checks.

**Operator acceptance:** Start Classic or Modern; click an already-current tile (0h), a different tile (normal travel cost), and choose actions from the centered menu. Confirm close via Done/Escape is free, filters remain while buying/applying, and global story/job confirmations appear above the menu. On mobile, the whole page never scrolls, but long venue menus may scroll internally. Run `node tools/verify.mjs` and Looprd tests. Real two-device Looprd deployment still requires operator validation. See [ADR-0021](docs/decisions/ADR-0021-board-centered-venue-interactions.md).
