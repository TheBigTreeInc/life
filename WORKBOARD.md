# The Life Loop — workboard v0.5.0

Full-source release: `the-life-loop-0.4.6-ziprunner.zip`. Workboard update schema: `ziprunner.workboard-update.v1`.

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
