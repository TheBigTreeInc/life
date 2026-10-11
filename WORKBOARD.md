# The Life Loop — workboard v0.4.1

Full-source release: `the-life-loop-0.4.1-ziprunner.zip`. Workboard update schema: `ziprunner.workboard-update.v1`.

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

## GitHub Pages deployment (v0.4.1)

- [x] LL-024 GitHub Pages static publishing: publish single-file HTML from `dist/`
- [x] LL-025 CI gate: verify gameplay and ZipRunner workboard before Pages deployment
- [x] LL-026 Deployment instructions, local save caveats, and Git publishing via ZipRunner
- [ ] Operator check: create/choose public GitHub repository and enable Pages workflow
- [ ] Operator check: confirm public URL, HTTPS, browser storage, and Save/Load on live site

No GitHub repository was created and no Git push/deployment was performed as part of this ZIP.
