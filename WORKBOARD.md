## v0.5.86 — Social verification boundary

`LL-345`: fail-closed verified Social identity adapter for internal Life match commands. Still requires live token verifier, seat roster, DAPI and isolated execution; `/play` remains disabled.

## v0.5.86 — LIFE-ASYNC-03 command processing

Release `the-life-loop-0.5.86-ziprunner.zip`: internal service validates seat, state digest and expected revision before invoking the headless evaluator, then commits the computed checkpoint and action. No public API, Social grant verification or production DAPI validation yet.

## v0.5.86 — Trusted headless evaluator foundation

Release `the-life-loop-0.5.86-ziprunner.zip`: typed internal command evaluation, digest integrity check, deterministic snapshots and subprocess CLI. Next: wire repository with Social identity and match-seat authority; isolate evaluation resources before production use.

## v0.5.86 — LIFE-ASYNC-02 repository transactions

`the-life-loop-0.5.86-ziprunner.zip`: checkpoint creation, guarded revision update, idempotent command history, turn-notification outbox writes. Requires real DAPI database verification, issuer verification, trusted evaluator and database uniqueness constraints before production use.

## v0.5.86 — LIFE-ASYNC-02 SQL model foundation

Game-owned additive SQL models defined for matches, participants, actions, checkpoints, and notification outbox. This is a schema-only foundation pending DAPI migration/index verification and Social identity contract. No new public `/play` route.

## v0.5.86 — Geometry editor foundation

Release `the-life-loop-0.5.86-ziprunner.zip`: standalone editable board geometry manifest, validated during build, plus developer-only coordinate overlay (`?debugGeometry`). Visual only, no game cost changes.

## v0.5.78 — Curved board-geometry manifest (LL-333)

Release `the-life-loop-0.5.86-ziprunner.zip`: add metadata-driven visual road curves for the Classic ring road, plus per-venue entrance paths and normalized road start/stop coordinates. Operator: verify curved road rendering, doorway approach alignment, pawn motion on the visible road and no travel-cost or save regressions.

## v0.5.72 — Mobile player-experience pass (LL-331)

**Artifact:** `the-life-loop-0.5.72-ziprunner.zip` · Overview-first camera, tap-to-focus, reachable Work, polished career/finance copy. Test on a real phone and verify save/multiplayer behavior.

## v0.5.69 — ZipRunner merged-tree locale compatibility

**Artifact:** `the-life-loop-0.5.72-ziprunner.zip` · LL-330 DOS source motion-quantum, 156-route comparison, offline build and unique workboard release.

**Operator:** Reapply with ZipRunner. Check local `language-campaign.test.cjs`, `TEST-LANGUAGE-066.bat`, toolbar EN/NL toggle and New Game settings, restart and verify persisted language. Preserve local config, .git, and runtime state.

## v0.5.65 — ZipRunner source overlay compatibility + versioning (LL-324)

**Artifact:** `the-life-loop-0.5.65-ziprunner.zip` (complete source, not an in-place reuse of v0.5.64).

- **LL-324:** Ship the original language integration fix with a new version, consistent release/Looprd/art/parity metadata, bundled language tests and a new-version release contract. The old 0.5.64 ZIP and repair ZIP are superseded.
- **No DOS gameplay or save schema changes.** Next separate gameplay parity pass: v0.5.69, travel-clock calibration and DOS benchmark.

---

## v0.5.64 — DOS opening state and consumable identity (LL-321…LL-323)

**Artifact:** `the-life-loop-0.5.64-ziprunner.zip` · **Status:** source-verified implementation candidate, pending operator DOSBox/browser acceptance.

- **LL-321:** Source `room1.sc` confirms fresh Classic defaults: 0 happiness, 25 relaxation, $200 cash, 0 stored food. Modern and older save values are not reset.
- **LL-322:** Source `fastFood.sc` / `startTrn.sc` food IDs, first-purchase happiness benefits, storage-before-consumption, expiration and 60-unit clock. Black's Market still offers 1/2/4-week fresh food. DOS exact illness sequence and other item details remain open.
- **LL-323:** Dedicated source adapter, deterministic food/clock/save tests, DOS evidence ADR, workboard, offline/Pages build and ZipRunner full source release.
- **Original DOS acceptance:** Observe start stats, no-fridge spoiled fresh food, Astro Chicken vs fries across two weekly boundaries, fridge-cap at 6 and freezer-cap at 12, Classic AI food survival, and Modern isolation in a live browser; DOSBox side-by-side remains necessary for parity certification.

## v0.5.61 — Food storage, scheduled debt and source paycheck comparison

**Artifact:** `the-life-loop-0.5.61-ziprunner.zip` · **Status:** implementation candidate, pending operator acceptance.

- **LL-312:** DOS state-10 food-loss happiness amounts (−2 no refrigerator, −1 for excess storage) with source-labeled events; source-before-meal ordering remains blocked by merged consumable IDs/AI and is not claimed fixed.
- **LL-313:** Original state-20 loan notice check tied to week 4/8/12 close, with first notice vs subsequent negative-schedule cases; underlying DOS paySched transition mapping remains provisional.
- **LL-314:** Source n108 paycheck comparator with 1/3/6 unit test cases. Live garnishment intentionally unchanged; exact DOSBox accounting comparison remains for later pass.

**Operator checks:** Fresh Classic solo week 4 loan notice, pay before next due cycle, test fridge/no-fridge spoilage, run `TEST-OBLIGATIONS.bat` and `node tools/verify.mjs`, confirm Modern and existing save import. Do not push/deploy automatically.

## v0.5.60 — Happiness, relaxation and weekend source branches

**Artifact:** `the-life-loop-0.5.60-ziprunner.zip` · **LL-311 implementation candidate**, remaining source/event gaps preserved in LL-306 and LL-307; operator review pending.

- Source-matched `startTrn.sc` state 12: Classic missed food costs 2 happiness instead of 8; Modern starvation is unchanged.
- State 14: implement the *no-food* conditional cash expense and −4 happiness with saved event trace, source-order RNG and 10-relaxation override. All other original consumable branches are still pending item identity work.
- State 24: pure tested happiness table only. Do not apply it to unverified Life economy phase mapping.
- Four-week deterministic happiness / relaxation / cash accounting displayed in Classic Finances, without new save fields or Looprd contracts.
- **QA:** `TEST-HAPPINESS.bat`, `node tools/verify.mjs`, clean ZIP replay, old-save/Modern/Custom Classic and live browser operator checks. No Git push or deployment.

## v0.5.57 — Food audit, match length and language

**Artifact:** `the-life-loop-0.5.57-ziprunner.zip` · **Operator review pending**.

- LL-297: Classic food accounting tagged to the closing week, preserving v0.5.56 house rules and DOS-source phase order.
- LL-298: Quick/Standard/Extended/Custom victory goal presets using the existing four goal sliders.
- LL-299: EN/NL setup translation foundation and English fallback, local language persistence.
- LL-300: Complete source ZIP, tests and synchronized docs/version; manual browser/online acceptance needed.
- Remaining: LL-301 full-game translation; LL-302 original DOS food and match-length baseline.

Operator acceptance: import complete ZIP, verify Classic mandatory homecoming, default and custom game rules, goal preset selector, EN/NL setup toggle, old save load, Modern isolation, and offline browser. Do not manually mark done until reviewed. No automatic Git push or server deploy.

# The Life Loop — workboard v0.5.56

Full-source release: `the-life-loop-0.5.56-ziprunner.zip`. ZipRunner workboard update remains incremental; see `.ziprunner-workboard-update.json` and lifecycle reconciliation.

- [x] LL-294 — Animate mandatory Classic homeward journey on the existing routes, before authoritative end turn, with Skip/reduced-motion.
- [x] LL-295 — New Game house rules: food spoilage, rent happiness penalty and market fluctuations, default-preserving and distinct from Classic/Modern content.
- [x] LL-296 — Regression tests, save migration, parity and source package handoff.

Operator checks pending: visual playback in browser, reduced-motion UI and real two-client Looprd host/guest turn synchronization. No server schema change.

---

# The Life Loop — workboard v0.5.43

Full-source release: `the-life-loop-0.5.46-ziprunner.zip`. Workboard update schema: `ziprunner.workboard-update.v1`.

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


## v0.5.21 — Employer names tied to actual city businesses

**Artifact:** `the-life-loop-0.5.21-ziprunner.zip` · **Status:** implemented and regression-tested.

- [x] **LL-140** — Canonical and tested Classic employer → board venue contract for all 37 roles; original identity preserved for rules and historical reference.
- [x] **LL-141** — Visible employer labels and **WORK HERE** marker consistent across board, profile, work button, hiring result, job switch, Career Center and logs.
- [x] **LL-142** — Job-workplace unit and browser regression; Modern Story and Looprd snapshot semantics unchanged.

**Remaining:** The thirteen shared map locations still combine Z-Mart and Black's Market as separate departments inside Fresh & Frugal; strict original building parity requires expanding/reorganizing the map. References to original DOS names remain visible inside Career Center where relevant.

## v0.5.22 — Classic discount stock and grocery merchant separation

- [x] **LL-143** — Distinct Black’s Market and Z-Mart department sections within the centered Fresh & Frugal actions, preserving the user-approved shared 13-location city for Classic and Modern.
- [x] **LL-144** — Four-week rotating discount clothes/books/home entertainment/weekend tickets, guarded with engine-validated availability and Classic economy prices; Black’s Market grocery and lottery inventory persists.
- [x] **LL-145** — Book availability moved from Circuit City to Z-Mart. Tickets consumed once on weekends; VCR/stereo improve relaxing at home; new possessions are pawnable and count towards Classic wealth.
- [x] **LL-146** — Retail stock and save/snapshot tests; preserved AI clothing fallback, network action shape, Classic employer IDs, and Modern isolation. Full source and CI release metadata synchronized.
- [ ] **LL-147 (high)** — Capture DOS original inventory weeks and probabilities and resolve the original 13 physical store mapping, plus authentic item durability, breakage, original weekend expenditures and robbery effects. Current item prices and stock rotation are provisional.

**Operator acceptance:** New Classic game → Fresh & Frugal: see two merchant headings and rotating stock; week 1 dictionary/baseball and casual clothing, week 2 atlas/concert and dress clothing. Buy a ticket and end week, confirm single weekend message and no replay. Buy dictionary, verify no longer sold at Circuit City, preserve benefit for study. Revisit in Modern to confirm previous shopping action list. Keep separate Classic job/employer IDs and all thirteen visible locations. `node tools/verify.mjs`, Python Looprd tests and fresh ZipRunner extraction must pass. ADR-0023.


## v0.5.23 — Classic clock and work precision

**Artifact:** `the-life-loop-0.5.23-ziprunner.zip` · **Status:** source implemented and automated tests added.

- [x] **LL-148** — Stop all Classic venue actions when 0 hours remain, including nominally free bank/food transactions. End Week remains accessible.
- [x] **LL-149** — Track a provisional maximum of ten in-venue decisions per Classic week, excluding travel. Show used slots in the bottom ticker; reset on week change.
- [x] **LL-150** — Carry fractional gross wage remainders across Classic partial shifts, ensuring identical pay for identical hours regardless of shift splitting; reset when changing jobs.
- [x] **LL-151** — Add nine new tests, update existing clock assertions, protect snapshot fields and include them in mandatory verification/ZIP.
- [ ] **LL-152 (high)** — Directly compare DOS action counting, free transaction policy, dismissal and partial-shift rounding. Current choices are documented approximations.

**Operator acceptance:** Work one Cook shift of 6 hours for $40 gross, then repeat as six 1-hour shifts and compare. Check banking at zero time and after ten transactions, verify next-week reset and persistence, confirm Modern works as previously. Run `node tools/verify.mjs` and Looprd handler tests. See [ADR-0024](docs/decisions/ADR-0024-classic-clock-event-budget-and-partial-wages.md).


## v0.5.24 — Classic original-layout board and economic risks

**Artifact:** `the-life-loop-0.5.24-ziprunner.zip` · **Status:** implemented, regression-gated. The original DOS business and map names are restored for Classic; exact DOS random formulas remain unverified.

- [x] **LL-153** — A ruleset-specific Classic 13-venue geographic map: Le Security, Rent Office, Low-Cost Housing, Pawn, Z-Mart, Monolith, QT, Socket, Hi-Tech U, Employment Office, Factory, Bank, Black's Market. Positions follow the DOS screen; Modern uses its prior 13 positions and modern identities.
- [x] **LL-154** — Separate Classic retailer location IDs, grocery and discount actions, and all 37 employer-to-workplace mappings. Housing rest available only at the currently rented building; Rent Office permits low-cost/secure moves.
- [x] **LL-155** — Classic store-quality condition for appliances and electronics, with repairs at Socket City; broken items lose active benefits and count for less in owned-asset goal valuation.
- [x] **LL-156** — Classic financial hazard model: Wild Willy steals wallet cash during rare bank and grocery transactions; burglaries may steal durable property from Low-Cost Housing; secure Le Security blocks residential burglary.
- [x] **LL-157** — Source-versioned Classic modern artwork slots with absent-image fallback; optional WebP pairs compiled only if supplied. Full-ZIP, standalone offline, Pages and regression checks.
- [ ] **LL-158 (high)** — Operator-supplied 13 location images and real DOS playthrough measurement for Classic travel/stock/repair/burglary rates and housing rent economics. Current names and geometry are source-based; economic rates and precise travel costs are not confirmed.

**Operator checks:** Start Classic, see five north locations and the separate Black's Market on the west, Z-Mart on the northeast. Confirm each offers its own products and jobs; moving to Le Security moves relaxation to its own building and blocks apartment burglary. Force-test appliance failure and repair through `tests/classic-map-risk.test.cjs`. Start Modern and verify unchanged 13 locations. Install art using `docs/classic-board-art-request.md`. Run `node tools/verify.mjs`, Python Looprd handler tests, and full ZIP extraction check.

See [ADR-0025](docs/decisions/ADR-0025-classic-original-board-and-economic-risks.md).


## v0.5.25 — Real Classic board routes and offline testing

**Artifact:** `the-life-loop-0.5.25-ziprunner.zip` · **Status:** implemented, regression-gated; artwork alignment and live two-browser Looprd tests remain pending.

- [x] **LL-159** — Pure connected 14-node graph with deterministic shortest-path planning, thirteen Classic locations and stable venue IDs.
- [x] **LL-160** — Persistent SVG board route, visual pawn markers for local, friend and Jones, layout projection for desktop/mobile and `?debugRoutes=1` diagnostics.
- [x] **LL-161** — Accepted authoritative Classic travel animates before the centered venue opens. Rejected travel never animates. Guest waits for host-confirmed state; animation changes no hours or action slots.
- [x] **LL-162** — `PLAY.bat` opens the bundled offline game instantly, while `TEST-LOCAL.bat` runs the complete verification and then opens PLAY.html on Windows.
- [x] **LL-163** — Pure route, integration and local launcher tests plus release/Pages builds. New route sources and JSON are shipped in ZipRunner.
- [ ] **LL-164 (high)** — Supply final classic board art, tune road/entrance geometry, measure DOS movement-hour parity, and test real Looprd WSS host/guest travel/reconnect in two browsers.

**Local acceptance:** Extract ZIP → double-click `PLAY.bat` to play immediately without rebuilding. Double-click `TEST-LOCAL.bat` for full verification and browser launch; it exits without launching if verification fails. Start Classic, click a different venue, watch pawn follow visible route, verify exactly one travel deduction then centered venue interaction. Test Modern: no route overlay and unchanged travel behavior. Open `PLAY.html?debugRoutes=1` to inspect nodes. No new artwork required. [ADR-0026](docs/decisions/ADR-0026-versioned-board-routes-and-authoritative-pawn-animation.md).


## v0.5.26 — Shared route-clock and mobile road quality

**Artifact:** `the-life-loop-0.5.26-ziprunner.zip` · **Status:** source implemented; browser and full-source verification gated.

- [x] **LL-165** — Tie Classic hours and deterministic route geometry to the same versioned, validated graph. Preserve the previous movement time formula for all pairs; Modern travel stays independent. No save or Looprd migration.
- [x] **LL-166** — Add keyboard/hover travel inspection (cost, road segments, shortage warning) and small 0h/HERE and travel-hour badges on Classic tiles, all non-mutating.
- [x] **LL-167** — On mobile, reorder the 13 Classic tile positions to a three-column serpentine road, keeping the final-to-first segment along a perimeter gutter. Support resize mid-animation; avoid long diagonal roads through building imagery.
- [x] **LL-168** — Pure cost/route parity tests for every venue pair, limited-hours negative test, Modern isolation, browser viewport QA and `TEST-ROUTES.bat` for rapid local smoke.
- [ ] **LL-169 (high)** — Ground final art projections, exact Sierra DOS travel formula, and deployed Looprd multi-browser reconnect/cancellation verification. Existing LL-164 remains relevant until real artwork/live QA.

**Operator checks:** Unzip and run `TEST-ROUTES.bat` (quick) or `TEST-LOCAL.bat` (full); start Classic and hover Z-Mart from Low-Cost Housing, see 3h / two road segments without time spent; click to walk and open centered Z-Mart, hours now 57; click same store for free. Resize mobile 390px and desktop 1440px; confirm street/pawn continuity. In Modern, no road/cost badges appear and actions stay intact. Run `python tests/qa_routes.py` if local Playwright/Chromium is installed. No manual rebuild is needed to play bundled `PLAY.html`. All original DOS references and current mathematical approximations remain explicitly unverified, not silently classified as parity.

## v0.5.28 — Original DOS route and linked career/AI model

- [x] **LL-170** Imported exact 170 DOS waypoint indices and 13 source place numbers, with immutable board/location identities and 14 visual road anchors.
- [x] **LL-171** Replaced equal-weight Classic shortest roads with deterministic historic ring index routing, including wrap and step-by-step pawn path on desktop/mobile. Time model remains explicitly provisional.
- [x] **LL-172** Linked 37 DOS jobNum identifiers and 9 original employers to their correct Classic board workplaces; Black's Market no longer internally maps to Z-Mart. Preserved existing salary economics, original salary/degree/uniform metadata attached for next pass.
- [x] **LL-173** Added pure Classic rival route/needs/job-choice evaluator and 2–3 stop sequence planner for salary, rent, clothing, food, available cash, work qualifications and route steps. Modern opponent untouched.
- [x] **LL-174** Reference consistency, gameplay regression, source/provenance note and ZipRunner integration; desktop/phone final art and real Looprd two-client trial remain external operator checks.
- [ ] **LL-175 (P0)** Derive and verify exact DOS passage-of-time conversion from waypoint movement, speed and entry/action time traces, replacing present 3+floor(steps/25) approximation.
- [ ] **LL-176 (P1)** Validate historical `CostDItem` dynamic wages, degree 10–20/course progression, uniform tiers and exact hiring/AI priority weights against DOS or reconstructed traces; migrate gameplay economics only after regression baselines.

**Operator acceptance:** open `PLAY.html`, Classic 13 venues; in `?debugRoutes` view index / original place identities, home→Rent Office must show 7 reverse indices, Monolith→Z-Mart 11, source hospital / Black's Market remain separate. At Employment Office view DOS role ID and original base wage distinct from current wage. Allow the rival to run multiple weeks; verify it does not walk to an unrepresented company. Real-player movement with Looprd still requires deployed browser test; never auto push Git.


## v0.5.28 — Source-linked Classic employment, survival and career AI

- [x] **LL-177** Validate original DOS degree numbers 10–20 and prerequisites; crosswalk numeric job degree IDs to save-stable Classic degrees.
- [x] **LL-178** Migrate all 37 Classic jobs to authoritative DOS experience/reliability qualifications (four prior discrepancies corrected), and integer 1–100 seeded hiring odds, including occupation #44 guarantee.
- [x] **LL-179** Implement a read-only two-week survival forecast covering accessible bank savings, rent, food, wardrobe replacement, and job shift income; expose essential cost horizon in the Classic Career Roadmap.
- [x] **LL-180** Career-aware rival now scores available degree options by jobs unlocked and routes, and evaluates job upgrades over multiple paychecks; preserves Modern AI and save format.
- [x] **LL-181** Regression suite for source degree/job identities, seed roll boundaries, career & budget purity, save snapshots, AI progression, 100-seed survival and separate Modern behavior.
- [ ] **LL-182 (high)** Capture DOS video/logic traces for economic index wages, exact travel-clock conversion and original AI/raise decisions; keep modelled choices labelled as provisional until verified.

**Operator check:** Classic Employment Office lists current offered pay, distinct original DOS hourly base, and qualification-adjusted odds. Career Roadmap lists original education IDs and two-week survival figures. Run 20+ weeks and check the rival can progress beyond starter wages without losing food/rent survival. Open existing v0.5.27 save and verify durable job/degree IDs persist. Modern and Looprd protocol remain unchanged.

## v0.5.29 — DOS mechanics recovery, Pass 2

**Completed:** DOS-style goods price formula (LL-183); one-draw Classic lottery and d12 rent-extension odds (LL-184); fractional partial-shift truncation without carry (LL-185); source-tagged emergency AI priorities and saved decision trace (LL-186); optional backward-compatible goods-index and weekly event journal (LL-187); integration/regression and DOS reference pack (LL-188).

**Known incompleteness:** Price *calculation* is source-derived but weekly index *evolution* remains provisional. The AI has only an ordered subset of the 38 recorded tags, not a complete first-match SCI port. Work stat accrual, full wage adjustments, multi-index investments, 16-bit SCI overflow, event source ordering, rent garnishment, education and travel-hour equivalence still need emulator traces. No silent claim of parity.

**Checks:** `node tools/verify.mjs`, `npm run test:classic`, `TEST-DOS-PASS2.bat`, and (separately) `python -m unittest discover -s docs/reference/original-dos-pass2/tests -v`.

## v0.5.30 — EconomicIndex domain migration and Classic salary contract safety

- [x] **LL-191** Implement deterministic eight-domain `ClassicEconomy` with original domain identities and bounded readings; label drift/correlation as **provisional**.
- [x] **LL-192** Bind Classic consumer goods, new wage offers, and all five variable bank markets to one shared seed-driven model; existing employee contracts and market positions persist. T-Bills fixed; Modern unaffected.
- [x] **LL-193** Rival career changes now compare real contracted earnings, defend essentials, and support source-tagged last-resort pawning for food/rent. Add nonmutating short-horizon trend-aware food planning.
- [x] **LL-194** Show all eight readings and last deltas in Finances plus current price/forecast context in Career Roadmap; preserve bounds-checked save/load and legacy index migration.
- [x] **LL-195** Extend mandatory verification with 8+ economic tests covering replay, 1,000 steps of bounded index drift, contracting, market pricing, legacy imports, malformed snapshots, pawn AI, Modern isolation and existing 60-week endurance campaigns. Ship ADR-0031, TEST-ECONOMY and release metadata.

**Unverified:** Exact SCI economic trend dependency/market risk and original wage formula; event sequencing, garnishment and full opponent branch coverage are still in LL-189/190. The reference proves domain identities and bounds but not this implementation's correlation coefficients. Operator check: view Classic indices in Finances; change weeks, confirm consumer prices and new job offers respond, existing signed wages do not; run 60-week Classic AI and Modern mode without regression. No Git push required or attempted.

## v0.5.31 — Event shock/recovery and unemployed AI source branch

- [x] **LL-196** DOS `startTrn.sc` original crisis effects on employment, wages, savings and happiness with separate pure reducer; probability remains a clearly documented compatibility approximation.
- [x] **LL-197** Replay-safe, save-validated `classicEconomicPulse` with weekly phase + 8-week incident cooldown; old Classic saves upgrade without repeated weeks or financial impact on load.
- [x] **LL-198** Corrected the unemployed ACNE ↔ Black's Market travel loop by applying for employment when physically at ACNE; recession planning reserves extra food liquidity.
- [x] **LL-199** Journaled event/career effects and financial losses on per-player account ledgers; add Classic cycle/shock diagnostics to Finances.
- [x] **LL-200** Crisis reducer/replay, save, AI recovery, Modern isolation and long endurance tests included in mandatory verifier and packed with `TEST-CRISES.bat` / ADR-0032.

**Limits:** shock frequency, 8-week cooldown, downturn index thresholds and recovery happiness are designed, not recovered from Sierra logic. Existing 60-week rival simulations now explicitly allow last-week dismissals and transient hardship rather than incorrectly asserting permanent immunity. Verify real Windows `PLAY.html` and two Looprd clients separately.

## v0.5.32 — Source-linked Classic Jones career decision migration

- [x] **LL-201** Source-tagged ordered AI branches 28, 29, 30, 32, 37, 44, 46 after essential food/rent/employment actions, reusing actual 170-waypoint movement and live engine actions.
- [x] **LL-202** Branch 20 and early rank-aware formal/casual/business uniform replacement: protected earnings, food and rent priority. Fixed the clothing-related rent spiral exposed by original endurance seed 96.
- [x] **LL-203** Unemployment counters and failed applications are serialized per Classic player; sustained unemployment uses guaranteed-roll original Cook occupation #44 without bypassing qualifications or application time.
- [x] **LL-204** Contract-aware promotion/raise planning, original diploma dependencies and course enrollment flow, no automatic degree or salary shortcuts.
- [x] **LL-205** Nine dedicated source/recovery tests, 100-seed endurance, offline and Pages builds, release verifier/quick Windows launcher, ADR-0033, full ZipRunner package.

**Source limitations:** No claim that the original DOS AI used our two-week unemployment fallback, two-week uniform replacement window, 4-week negotiation cadence, or our cash/tuition thresholds; these are documented compatibility approximations. Remaining LL-190 calls for complete SCI branch coverage and emulator replay. Verify file:// PLAY.html on Windows and multiplayer separately.

## v0.5.33 — Source tick planner, Employment entry and partial work parity

- [x] **LL-206** Original estimated movement ticks per leg (`min ring steps + 2×20`) integrated into Classic travel quotes and itinerary comparison; separate from the still-provisional playable clock conversion.
- [x] **LL-207** Source `room1.sc` Employment Office entry +2 clock units once on arrival, atomic with movement and indicated in route UI; no duplicate fee for opening the same location.
- [x] **LL-208** DOS `n108.sc` grants one work progression credit for each successful full or partial work action, with original truncated income and stat caps; no fractional-sixth credit pooling.
- [x] **LL-209** Route preview shows waypoint count, original estimated ticks, actionable time charge and Employment surcharge; pawn animation remains bound to 170 indexed path points.
- [x] **LL-210** Added six source-timing tests, extended original route/clock assertions, Modern isolation checks, offline/Pages compilation and `TEST-TIME.bat` launcher. Save and multiplayer payload fields unchanged.

**Open LL-175 and LL-169:** original image/board and exact movement-time-to-clock conversion still require DOS capture; replay a sequence of source waypoint trips in DOSBox at known speed/quantum and compare every transition before changing the provisional player clock formula. Original ten-action weekly gate remains a prototype limit (LL-152). Operator: run `TEST-TIME.bat`, open `PLAY.html` on Windows, hover Home→Employment and check separate +2 unit office entry; finish a late two-unit partial shift and check XP/reliability. Do not push Git without operator approval.

## v0.5.34 — Employer warning and paycheck migration

- [x] **LL-211:** Source-ordered low-reliability warning before first shift of the week and dismissal precedence, without paying/scheduling a false work action.
- [x] **LL-212:** Read-only net-pay estimate including partial gross, arrears and fee; live work uses exactly the same calculation, with unverified DOS surcharge semantics labelled provisional.
- [x] **LL-213:** Jones cannot commute to a workplace without at least one remaining action unit and ceases errands when its venue-action allowance is exhausted.
- [x] **LL-214:** Safe weekly warning state import and normalization; older snapshots remain compatible, Modern unaffected.
- [x] **LL-215:** Regression suite and test launcher, source archive, ADR-0035, updated artifact metadata and workboard for ZipRunner.

**Unresolved P0 parity:** Original DOS full-vs-partial rent garnishment may rewrite take-home pay with full gross (n108.sc temp0/temp1). Capture at least three DOS paychecks with equal wage/debt but 1h, 3h and 6h remaining before replacing the provisional deduction. Source-trace exact waypoint-to-clock conversion remains open.

## v0.5.35 — Classic paycheck audit and financial resilience

- [x] **LL-216:** Immutable quote plus settlement reconciliation; source-derived full/partial gross retained, provisional fee/withholding isolated with explicit full-gross sensitivity diagnostic.
- [x] **LL-217:** Bounded 16-shift Classic financial/payroll journal with strict save validation, old-save migration and Finances transparency.
- [x] **LL-218:** Rival two-week budget uses net contracted shifts with declining debt and exposes net/two-shift funding gaps in Career Roadmap.
- [x] **LL-219:** Rival voluntary arrears clearance preserves upcoming food, rent, clothing and downturn cash; no source parity claim for this cash buffer.
- [x] **LL-220:** Ten new targeted tests, full release verifier, v0.5.35 offline/Pages source, ADR-0036 and TEST-PAYCHECKS.bat packaged for ZipRunner.

**Open DOS blocker:** Exact original rent deduction branch and fee/partial gross override remains unverified. Capture 1/3/6-unit work at equal salary/arrears in the original game before updating withholding. Exact waypoint clock and complete Jones SCI action order are similarly unresolved. No Git commit/push made.

## v0.5.36 — Source-aligned per-player turn lifecycle

- [x] **LL-221:** Move sourced −3 dependability to end of each Classic human/AI turn, preventing the shared weekly reset from lowering it twice.
- [x] **LL-222:** Four-week Classic rent obligations use pure one-time assessment and preserve paid/extended leases.
- [x] **LL-223:** Save and display an ordered 72-event Classic phase journal for future DOS runtime comparisons.
- [x] **LL-224:** Additive safe save import and rejected forged future/negative event state; Modern isolation retained.
- [x] **LL-225:** Eight new tests, mandatory verifier, ZipRunner handoff, ADR-0037 and offline/Pages source.

**Open:** original `startTrn.sc` 37-state exact execution order, payroll temp register behavior and waypoint-to-clock scaling need emulator traces. No Git push requested.

## v0.5.37 — Original geography, mobile map and source weekly bonus

- [x] LL-226 — Classic keeps 5×4 original 13-place board and source route identities at all widths.
- [x] LL-227 — Phone Explore pans readable 740px map; Overview fits; building and pawn locator do not consume time.
- [x] LL-228 — Road SVG and animated pawn live inside the same pan stage; corner road elbows and centered menu preserved.
- [x] LL-229 — DOS `startTrn.sc` state 4: one-in-seven owned-computer $20–$100 **cash** award; Modern unchanged.
- [x] LL-230 — Five focused regressions, mandatory verifier, browser checks, workboard, ADR and complete offline/Pages packaging.

Still pending: supplied 13-storefront production art, measured DOS route-hour conversion, the remaining `startTrn` source states, exact Jones priority weights and deployed two-client race testing.


## v0.5.38 — Classic mobile intent, travel camera, and DOS state journaling

- [x] **LL-231** Phone Overview building taps change to readable Explore, without consuming time; subsequent Explore tap follows the authoritative travel command.
- [x] **LL-232** Pawn travel follows the mobile camera; a manual pan overrides camera movement, and My Pawn recenters independently.
- [x] **LL-233** `startTrn.sc` state 10 food-loss journal with original storage limits and explicitly unverified spoilage chance; remove unsupported medical deduction.
- [x] **LL-234** `startTrn.sc` state 18 wardrobe countdown/expiry journal, independently tagged, without modifying Modern rules.
- [x] **LL-235** Four additional source/UX tests, full regression and desktop/phone browser checks, ADR-0039, offline and Pages builds, ZipRunner-safe incremental workboard update.

**Known original parity gaps:** food spoilage probability, weekly event callbacks and exact waypoint-clock transformation await original DOS runtime observation. Do not interpret the compatibility guarantee of unrefrigerated spoilage as an authentic probability. No Git push was performed.

## v0.5.39 — Journey/entry presentation and original weekly source-state continuation

- [x] LL-236: Board-native departure/arrival/await-host status; road-anchored arrival highlight with no additional travel transaction.
- [x] LL-237: Horizontal pan threshold on touch prevents accidental interruption of pawn-follow; Classic mobile Overview remains inspect-first.
- [x] LL-238: Food-shortage state 12 journal entries only when the existing hunger mechanic triggers; no invented food penalty.
- [x] LL-239: State 34 emergency clothing-assistance journal for existing two-check rescue; payout/cooldown still provisional.
- [x] LL-240: New regression launcher, mandatory verifier, standalone/Pages build, workboard-limited ZipRunner release.

**Pending:** fully recovered 37-state weekly SCI event sequencing, exact route-to-clock mapping, state-34 assistance payout/cooldown, broader multiplayer sync traces, replacement Classic building paintings.

## v0.5.41 Classic board and source-event core migration

- [x] LL-241 — Skippable presentation-only pawn movement for faster repeat travel, no second action or clock charge.
- [x] LL-242 — Separate Classic relaxation with DOS state-6 weekly decay, save validation, recovery via existing rest action.
- [x] LL-243 — Source-tagged state-20 quarterly loan checks, without double default charges.
- [x] LL-244 — Focused source/save/skip/Modern isolation regression tests.
- [x] LL-245 — Release gate and ZipRunner workboard schema verification.

**Open DOS fidelity:** original relaxation starting value and recovery, hot-tub item-28 effect, state-6 rare theft probability, precise state-20 penalty.

## v0.5.41 — Entrance presentation, household & designer handoff

- [x] LL-246 — Road-owned door/arrival indicator remains aligned to original travel anchor with no additional movement cost.
- [x] LL-247 — Pure household availability projection; broken computers stop earning Classic project bonuses.
- [x] LL-248 — Rest whenever relaxation is low even when happiness and energy are full; no Modern changes.
- [x] LL-249 — 13-venue artwork contract including original identity, sprite and export slots, street-side entrances and mobile review.
- [x] LL-250 — Regression tests, source verifier, standalone game, ZipRunner-safe workboard, ADR-0042.

**Still open:** exact DOS hot-tub item #28, its actual relaxation/recovery formula and probabilities, route-to-clock scaling, remaining weekly event state coverage and final production paintings. Designer DOCX delivered separately; Markdown contract and board schematic are version controlled.

## v0.5.43 — Explicit source lifecycle reconciliation and Classic maintenance

- [x] **LL-251** Stable-ID lifecycle source ledger reconciles all known items into Done, Blocked, In Progress or To Do; each blocked item carries reason and unblock condition. This is not a claim of ZipRunner UI transition.
- [x] **LL-252** Mandatory verifier regenerates and compares the lifecycle JSON and Markdown; rejects duplicate IDs, stale states, and v1 schema violations.
- [x] **LL-253** Classic repair quote and surplus-only Jones maintenance branch. No new saved state, no Modern change.

**Authoritative source status:** `docs/workboard-lifecycle.json`, human review in `docs/workboard-reconciliation.md`. **Importer limitation:** `ziprunner.workboard-update.v1` cannot express Blocked/In Progress transitions; see the proposed platform spec `docs/ziprunner-workboard-lifecycle-contract.md`. A ZipRunner code change and importer receipt are still required to update those UI statuses.

## v0.5.43 — Classic production board, player turns and week clock

- [x] **LL-254** — Integrate 13 approved exterior/interior WebP pairs in stable manifest slots; preserve per-building door coordinates..
- [x] **LL-255** — Match all 13 original board cells, source place IDs, road stops, and phone Explore/Overview without alternate mobile arrangement..
- [x] **LL-256** — Show current player, turn ownership, and week in the Classic board center; preserve Modern hub and centered venue interactions..
- [x] **LL-257** — Show 60-unit circular clock that updates with authoritative actions and turn changes; no simulation changes..
- [x] **LL-258** — Asset-size/identity, route geometry, turn clock, Modern isolation, and ZipRunner clean-build regression coverage..

The 13 approved pairs replace placeholders in Classic only. Board entrance metadata is stored per venue, with roads still source-controlled and clock costs unchanged. Modern unaffected. The old workboard backlog remains reconciled through stable IDs.

## v0.5.45 — Shared portraits and Social integration

- **Done LL-259:** Integrate Modular Portrait Kit JS, browser editor and compact offline demonstration art packs.
- **Done LL-260:** Standalone, presentation-only profile store and Life Loop display-name/portrait adapter, without changing existing save or room identity.
- **Done LL-261:** Optional authenticated Social HTTP profile and lobby API client; standalone loopback-only development service supplied in separate repository ZIP.
- **Done LL-262:** Tests, online/offline static assets, clean ZipRunner release validation.
- **Blocked LL-263:** Production OIDC SSO and game-room authorization require trusted issuer, game gateway and deployed QA. The local dev token must not be treated as production login.


## v0.5.46 — Native Looprd Social chat in the Life Loop game

- [x] LL-264: Shared cross-game Social lobby accessible through Chat, even without an active co-op room.
- [x] LL-265: Single page-scoped Social session shared with the Profile editor; direct Looprd POST `/social` transport, and local bridge fallback.
- [x] LL-266: Social/Room channel isolation, read/unread counters, bounded messages, no profile/game snapshot coupling, regression and mobile smoke coverage.
- [x] LL-267: Native Life Loop schema v2 `Room.chatKey` additive migration carried forward; avoid reintroducing `load: ValidationError`.

**Not complete:** Production cross-game authentication (LL-263 remains blocked). Live access to your deployed Social host and device-specific multi-client operation are operator acceptance checks. Private room and Social credentials remain distinct.

Release artifact: `the-life-loop-0.5.46-ziprunner.zip`

## v0.5.49 — Classic hotseat and scenic road continuity

- [x] **LL-013** — Local Classic hotseat privacy handover: keep the next player's private board and Social chat hidden until a deliberate reveal; stable backlog ID moved from To Do to Done.
- [x] **LL-268** — Keep the Public Garden clock and both noninteractive scenic road gaps visible in phone Explore and Overview, preserving all historic route IDs.
- [x] **LL-269** — Add hotseat and responsive board regressions and mandatory release verification.

Open: live deployed Social and game-room authorization remain separate. Original DOS movement-time conversion still requires runtime traces (LL-175). No production Looprd service changes in this pass.

**v0.5.49 ZipRunner handoff:** `the-life-loop-0.5.49-ziprunner.zip` — source-only, incremental workboard, no local runtime/private config.


## v0.5.49 — Public Garden clock and phone camera

- [x] **LL-270** — Relocated the single 60-unit Classic action-clock dial to bottom-center Public Garden; center remains active player and week.
- [x] **LL-271** — Explore / Overview camera toggle visible only on phones; tablets and desktops stay fitted.
- [x] **LL-272** — Fixed fifth-row route gutter so paths no longer bisect the Public Garden clock.

**v0.5.49 ZipRunner handoff:** `the-life-loop-0.5.49-ziprunner.zip` — Classic presentation only; Social and game server unchanged.


### v0.5.49 — Classic illustrated doorway stops and live venue clock

- **LL-273 (Done):** Each of the 13 storefronts has an illustrated doorway approach; pawn visual positions now terminate at the door rather than the generic road midpoint. Preserved 170 DOS waypoints and clock charges.
- **LL-274 (Done):** The Classic venue window now shows the 60-unit clock continuously, including after spending time inside.
- **LL-275 (Done):** Regression tests cover sprite entrance metadata, clock consistency and 320/390/768/1440px browser layouts.
- **Deployment:** No remote Git commit or server migration required for these changes.


### v0.5.50 — Original-style continuous Classic streets

- **LL-276 (Done):** Gutter-aligned rounded street loop with no top-corner backtrack across empty garden strips.
- **LL-277 (Done):** Restrained street-only route highlight; destination doorway shown separately without painting across shop fronts.
- **LL-278 (Done):** Geometry/cost and browser collision checks, including pawn travel and the persistent venue clock.
- **Artifact:** `the-life-loop-0.5.50-ziprunner.zip`; no server migration or Social deployment necessary.


### v0.5.51 — Classic pawn doorway animation

- **LL-279 (Done):** Short departure and arrival animation phases, opacity crossover at street edge; fully stops on painted door; skip and reduced-motion support.
- **LL-280 (Done):** Time/route invariance tests and desktop/mobile browser QA.
- **Artifact:** `the-life-loop-0.5.51-ziprunner.zip`; no game-server, Looprd Social or save-format changes.


### v0.5.52 — Route passes the shops, not the center park

- **LL-281 (Done):** Project horizontal board street lines onto the bottom storefront artwork aprons; retain scenic lanes and 170 historical waypoint identities.
- **LL-282 (Done):** Display connected pedestrian approaches to the thirteen actual doors, including left/right frontage shop paths; make the pawn traverse the same visible route as its hover preview, no hidden fade/teleport.
- **LL-283 (Done):** Keep Public Garden clock text clear of the southern path and verify phone/tablet/desktop, 5-unit Bank travel, arrival geometry and venue clock.
- **Artifact:** `the-life-loop-0.5.52-ziprunner.zip` (game source only; no Social server/database changes).
- **Operator review:** Inspect real Windows browser at desktop and narrow phone; compare the illustrated door targets to final author assets, since doorway metadata is hand-calibrated. No automatic Git push.

### v0.5.53 — DOS source clock boundaries and audit

- **LL-284 (Done):** Classic Employment capped 4-unit applications and raises at end of week.
- **LL-285 (Done):** Pure source timeKeep simulator and all 156 directional source-vs-provisional time audit.
- **LL-286 (Done):** Complete Classic time-parity unit tests, modern separation and ZipRunner verification.
- **Remaining:** Player walking-time conversion requires side-by-side DOS captures.
- **Artifact:** `the-life-loop-0.5.53-ziprunner.zip`.

### v0.5.54 — Source-backed weekly state ordering + canonical Social browser SDK

- **Artifact:** `the-life-loop-0.5.54-ziprunner.zip`.
- **Done:** LL-287, LL-288, LL-289, LL-290 (source/test gates; live Social connection awaits operator browser acceptance).
- **Still provisional:** DOS pantry/spoilage identity and sequencing, monthly debt windows, economic probability, original AI event semantics and travel tick conversion.
- **External need:** Social should publish a versioned same-origin/browser SDK with SHA-256 manifest to replace the GitHub raw hotload in a later pass. Social `game_activity`, friend invitations and secure game tickets are separate future service features, not prerequisites for lobby chat.

## v0.5.55 — Rule presets and forced homeward journeys

- LL-291: homeward route and next-week time debt for human/AI players.
- LL-292: family-preserving New Game house-rule toggles, defaults and persisted preferences.
- LL-293: save/online debt validation, old-save migration and regression tests.
- Artifact: `the-life-loop-0.5.55-ziprunner.zip`.


## v0.5.58 — Source-backed Classic goal parity and ranked worklog

**Artifact:** `the-life-loop-0.5.58-ziprunner.zip`.

- **LL-303 (implementation candidate):** DOS source weighted goal progress, discrete employment-dependent career score, completed-diploma education stat and independent victory checks. The UI now shows actual Classic stats and targets; Modern scoring is unchanged.
- **LL-304 (implementation candidate):** New portable goal module with separate source regression tests and ZipRunner/Pages build integration; existing Classic house rules, locale, saves and forced-home behaviors are retained.
- **LL-305–LL-310:** Clock, happiness, food/rent, rival AI, retail/economy and original starting Happiness remain open, with source requirements and acceptance checks in `docs/classic-parity-worklog.md`.
- **Operator review:** Start Classic Standard/Extended/Custom, test unequal targets and the score readout; save/load, compare Modern, then inspect the completed goal gate. Run `TEST-GOALS.bat` and `node tools/verify.mjs`. No Git push or deployment.


## v0.5.59 — Source Clock Bounds, Seven-Route Evidence and Optional Action Limit

**Artifact:** `the-life-loop-0.5.59-ziprunner.zip` · **LL-305 implementation candidate**; operator review pending.

- Replaces the unsupported 'all Classic actions stop at zero' rule with zero-cost in-venue actions allowed at 0 remaining units. Travel to another venue and all timed actions remain blocked until next week; no automatic end-turn RPC changes.
- Makes the speculative ten-interaction gate an explicit **off-by-default house rule** with save/preference support; toggling on preserves the old ten-action behavior. The optional cap does not affect Modern mode.
- Seven original 170-waypoint trip cases, source-AI tick estimate and a transparent read-only counter approximation; *no claim* of exact DOS walking-hour calibration. Original measurements remain blocked in LL-175.
- New Classic/Modern/save/regression cases, synchronized offline/Pages builds and operator review checklist. ADR-0059 and `docs/reference/dos-time-observation-template.csv`.

**Operator checks:** Run `TEST-TIME.bat` and `node tools/verify.mjs`. At the Bank after 0h remain: deposit/withdraw still work; travel out and timed Broker entry fail. At Black's Market buy food at 0h when cash allows. Enable 10-action house rule and verify the eleventh deposit is refused. Check a 2-player save and a Modern session. DOSBox observations still required for true route calibration. No Git push.


## v0.5.62 — Source-grounded Jones decision thresholds and career balance

**Artifact:** `the-life-loop-0.5.62-ziprunner.zip` · Implementation candidate; pending operator QA.

- **LL-315:** Real source-backed two-raise gate, qualified career ladder checks and relaxation-governed rest. Source predicates are pure; real actions continue to require a legal venue, enough time and affordable costs.
- **LL-316:** Food branch identity correction #27; recovery sequence is replay-tested and the two-week hardship counter now stays serializable.
- **LL-317:** Dedicated AI source helper, source branch worksheet, seeded multiplayer/save and Modern-mode checks, full offline/Pages release gate.
- **Still open:** LL-308/LL-190 exhaustive 1–49 branch order, original RNG gates, economic salary coefficients, source travel-time mapping and exact DOS runtime behavior.

**Operator checks:** run `TEST-JONES-AI.bat` and `node tools/verify.mjs`; verify raise cap at ACNE, weekly rival food/rent purchases and deliberate low-relaxation home visits; save/load after 20 weeks. No Git push.

## v0.5.63 — Pawn/shop source quotes and read-only economic RNG comparators

**Artifact:** `the-life-loop-0.5.63-ziprunner.zip` · Implementation candidate; pending operator QA.

- **Classic pawn:** `pawnShop.sc` percentage arithmetic, −1 happiness per pledge, fridge freshness loss; use reference price proxy, not real historical `pricePaid` (not yet stored). New quote is stored and validated; old lots and Modern mechanics unchanged.
- **Original market:** original 1/2/4-unit food prices and ten-ticket offering were already implemented; this pass locks them under goods-index regression tests.
- **Economic audit:** read-only exact per-index source comparator and `economicIndex.sc` inclusive event draws; live compatibility economy deliberately unchanged.
- **Outstanding:** original purchase-price provenance, pawn counter six-slot / resale lifecycle, exact economic series/seeded source event integration, DOS game length and 4-player UI.
- **Acceptance:** run TEST-RETAIL-PAWN.bat, node tools/verify.mjs, clean ZIP extraction; operator verifies Classic and Modern item transactions in browser. No Git push or Looprd API change.

0.5.77 source AI evidence: 28-tick per-leg rival overhead from DOS WhereShouldIGo.sc; tests/classic-jones-motion-076.test.cjs; no live travel adjustment.
