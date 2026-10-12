# The Life Loop — v0.5.4

**Playable original browser game**, inspired by the rule loop of *Jones in the Fast Lane*. `Classic Rules` is an evidence-based reimplementation **in progress**, not yet a 1:1 binary match. `Modern Story` keeps its independent progression and city stories. Era choices (Historical, Contemporary, Sci-Fi) affect graphics, not mechanics.

## This pass

- Classic: 37 documented floppy DOS positions with original base wages, stat requirements, degrees and uniforms; two CD-only jobs are excluded. Nine employers are represented using existing 12 city tiles (Z-Mart and Black’s Market share a venue).
- Classic: 4h job applications, failure costs, seeded qualification-sensitive openings, repeat refusal lockout and guaranteed cook job. Existing job is kept on failed applications.
- Classic: 4h raises based on posted offered wages instead of automatic 10% boosts.
- Classic: $325 starter rent, manually paid in cash every four weeks at the Rent Office; extensions, arrears and half-wage garnishment + interest.
- New employer filter at the Career Center and roadmap references; the rest of the original mechanical backlog remains documented.
- Save migration from v0.4.6 Classic jobs, plus Classic-only state fields; Modern untouched.
- 120 gameplay tests, including Classic banking and refrigerated food, plus offline UI checks.

## How to play

1. Open `PLAY.html` in Chrome/Edge (offline) or run `PLAY.bat` on Windows.
2. Start **New Game**, choose Classic or Modern, set era and goals.
3. Classic: visit Career Center, use employer filter, apply for a role, work at its actual workplace tile.
4. Classic: in **week 4**, go to Open Door Realty (the modern board stand-in for the Rent Office) and pay the $325 rent in **cash**. The office reopens on future due weeks.
5. Export JSON save backups; browsers isolate local saves by origin, so file:// saves will not automatically appear on GitHub Pages.

## Verification and architecture

```sh
node tools/verify.mjs
```

Read `ARCHITECTURE.md`, `docs/parity-matrix.md`, `docs/classic-job-table.md` and `docs/decisions/ADR-0004-original-jobs-and-manual-rent.md` before gameplay changes. ZipRunner should apply `.ziprunner-workboard-update.json` only after verify succeeds. `node tools/build-pages.mjs` produces the static Pages site in `dist/`.

## Limitations

Original DOS gameplay has **not** been run side by side here. Era visuals are new, not extracted assets. Exact historical price swings and loan approvals, pawn, spoilage medical bills, market crashes, special apartment behavior, four-player hotseat and the map's original nine storefront distinctions are still incomplete. Do not redistribute the original DOS archive in this package.

## GitHub Pages

Push the flat-root source to a public repository on `main` and set Settings → Pages → GitHub Actions. `.github/workflows/pages.yml` verifies and publishes the game automatically. No Git push or live Pages deployment is performed by the ZIP.

## ZipRunner

Project: `the-life-loop` · Artifact: `the-life-loop-0.5.4-ziprunner.zip` · Full source, flat-root ZIP. Drop into `C:\Users\dorbi\source\_ziprunner_inbox`; run `node tools/verify.mjs`. Preserve `.git` and machine-local settings.


## Classic economy improvements — v0.5.1

- At the **bank**, transfer $100 at a time at no action-hour cost. Apply for loans (2 hours); make recurring $45 principal + $5 interest payments. Enter the **broker** (2 hours) to trade one unit at a time across six separate instruments including 3%-fee T-Bills.
- At **Black’s Market** (the Fresh & Frugal board tile in Contemporary), purchase one, two or four portions of fresh food ($55/$100/$190 base), newspaper or lottery tickets. A fridge stores six; adding a freezer expands storage to twelve. Fresh food is consumed automatically at weekly transitions. Spoilage creates a provisional doctor charge.
- All six quoted base instrument prices are based on published gameplay references. Stock volatility, bank loan approval, doctor charge and original economic event probabilities remain **approximations**; consult ADR-0005 for scope.
- Prior Classic savings and generic investment saves continue to work; old investments can be redeemed through the broker. Existing Modern saves and rules are unaffected.

**Tests:** `node tools/verify.mjs` (includes `tests/classic-banking-food.test.cjs`).


## Online co-op with Looprd (v0.5.2)

You can host a game in the browser with **New Game → Online co-op**, choose a Looprd endpoint, and share a ten-character friend code. A second player uses **Online co-op → Join** or the generated link. Both browsers connect to Looprd WebSocket events; game commands use authenticated HTTP because dapi/Looprd v1 does not offer bidirectional WebSocket RPC. A persistent Looprd host (not GitHub Pages alone) is required. See [docs/looprd-multiplayer.md](docs/looprd-multiplayer.md) for source registration, CORS, HTTPS/WSS, security and tests. Legacy hotseat/single-player still work without a server.


## Mobile and Looprd FQDN improvements — v0.5.3

Phones and tablets use the City, Activities and My life bottom tabs. Tap a building in City to navigate and automatically see its actions. The top summary shows the active player, week, remaining hours and cash. On phones the city map becomes a two-column illustrated storefront grid; larger buttons, scrollable setup dialogs and safe-area padding make touch use practical. Nothing about these views changes Classic or Modern rules.

For **Online co-op**, enter only the Looprd API server FQDN, such as `api.server.country` (or `https://api.server.country`); the game appends `/looprd/the-life-loop/v1` and automatically uses `wss://` for event notifications. Invitations carry the FQDN and friend code, not participant credentials. GitHub Pages serves the frontend; multiplayer requires a separately running Looprd server with CORS/origin configuration.

Read [ADR-0007](docs/decisions/ADR-0007-responsive-mobile-layout.md). Desktop keeps the three-panel view. Full two-device, real iOS and real Android verification remains a deployment/operator check.


## GitHub Pages metadata repair (v0.5.3)

If GitHub Actions reports `Project/version mismatch` and missing workboard tasks despite the app being at v0.5.3, inspect `.ziprunner-workboard-update.json` in the **GitHub repository**. An old 0.4.1 copy remained on GitHub after later game changes were committed. ZipRunner processing a workboard update does not guarantee the JSON file was committed.

Commit `.ziprunner-workboard-update.json`, `ZIPRUNNER_HANDOFF.txt`, `WORKBOARD.md`, and `tools/verify.mjs` from this release to the repo `main` branch. Then run `node tools/verify.mjs` and check the Pages workflow. No gameplay changes were made in this repair.

## v0.5.4 — ZipRunner release metadata revision

This release corrects the previously unversioned v0.5.3 CI/workboard repair. All deployment-relevant version markers now agree (`package.json`, `.ziprunner-workboard-update.json`, `docs/parity-contract.json`, `looprd.yaml`, `ZIPRUNNER_HANDOFF.txt`, and the browser footer). The packaging script derives its artifact name from `package.json`. **No gameplay or save-format changes.** Commit the whole release to `main` to avoid the stale-manifest Pages error.
