# The Life Loop — v0.5.12

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

Project: `the-life-loop` · Artifact: `the-life-loop-0.5.12-ziprunner.zip` · Full source, flat-root ZIP. Drop into `C:\Users\dorbi\source\_ziprunner_inbox`; run `node tools/verify.mjs`. Preserve `.git` and machine-local settings.


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

## Sliding panels and turn clarity — v0.5.5

On laptop and mid-size desktop displays (1025–1599px), Your Story and Your Destination are slide-out edge panels. Orange notification circles indicate new story information or newly available destination actions; viewing clears the indicator. On large desktop screens (1600px and above) both panels stay visible. The phone/tablet City/Activities/My life tabs continue to work and display the same notifications.

Save, Load and How to Play are now under the top-right Menu. The persistent turn banner states whose turn it is, whether you may act, host/guest identity, and live WebSocket versus HTTP fallback status. Open Online co-op for room diagnostics and a **Check Looprd component API** button; this requests `/looprd/the-life-loop/v1/info` and expects protocol `the-life-loop/1`. This is an API registration check, **not** proof of a production-ready deployment or correct two-machine synchronization; verify against a real Looprd instance. No simulation or protocol changes.

## Offline reusable characters — v0.5.7

Open **New Game → Your Character → Create / manage characters**, or **Menu → My characters**. Create up to sixteen profiles. Customize name, skin tone, hairstyle, hair color, outfit, favorite color, expression and personality; portrait preview updates immediately. Select any profile to start a new game, or continue using a quick name without saving a character. For local two-player games, a separate Player 2 character can be chosen. Online join lets guests reuse a locally saved display name; full guest portrait propagation is deferred until a compatible Looprd protocol change.

Profiles persist in the **current browser and site origin**, separate from game autosaves, under `the-life-loop-characters-v1`. Clearing site data removes profiles. Offline file:// and published HTTPS Pages do not share browser storage. Appearance chosen for a game is included in saved-game JSON and host snapshots; local profile IDs and the rest of the profile library are not. No gameplay attributes, costs, Classic rules or multiplayer server schemas changed.

## Multiplayer character appearance, chat, and viewport layout (v0.5.7)

On join, the guest's chosen character appearance and display name are validated and copied into the room's shared game state. All other locally saved profiles stay on the guest's device. The host and guest receive the same character through standard room status/snapshot updates.

When two people are in a room and their Looprd WebSocket is connected, **Chat** appears in the top bar. Chat sends authenticated, AES-GCM-encrypted packets using Looprd's existing HTTP handler, then uses its native WebSocket notifications to deliver immediately; Looprd does not support bidirectional RPC over WebSocket. The game stores no chat messages in SQLite, save data, localStorage, sessionStorage, or snapshots. Messages live in an in-memory browser panel while connected and are lost on disconnect, missed notifications, refresh or device reconnection. Because default Looprd event subscriptions are public, messages are encrypted with a random room key returned **only** to authenticated participants. The room key is kept server-side in private Room data and returned on authenticated join/status/create, and is never placed in the invitation link. See `docs/looprd-multiplayer.md` and ADR-0010 for operational guidance.

**Deployment requirement**: `looprd.yaml` database schema revision is **2**; the `Room.chatKey` field is new. Before replacing an existing Looprd component, back up the database and migrate the field (and consider existing active room keys). The live Looprd deployment has not been verified here. Deploying the HTML alone does not update the server.

The game shell now fits the browser viewport without body scroll. Long story/activity detail panels and modal dialogs have their own scrolling where needed. On mobile, the city becomes a compact 3-column grid and New Game is a three-step wizard. Keyboard-open on very small phones may still require internal dialog scrolling.

## Contemporary City artwork — v0.5.8

Eleven location-specific player-supplied paintings replace generic procedural building facades for Contemporary/New Day City. The rendered city cards load 448px WebP images, destination art loads 768px WebP, and the original SVG art remains the fallback and stays authoritative for Historical and Sci-Fi eras.

The **Your Place** image follows `player.home` independently for each player: Starter Studio (`studio`), Sunny Apartment (`apartment`), Skyline Loft (`loft`). All three now use user-supplied residence paintings with separate card/detail images; procedural SVGs remain a fallback if a tier is unrecognized. never assign the unrelated detached-house reference image to one of those tiers. The supplied detached-house illustration is included only as an unused reference. Changes to housing visuals do not modify comfort, rent, or mechanics.

The art pack is a source-owned, data-only manifest and optimized WebPs. `PLAY.html` embeds art as data URIs for offline use, while the Pages build emits separate cacheable assets. `src/art-assets.js` contains the browser mapping mirrored from the JSON pack manifest; the verifier checks that they agree. These are the first steps toward optional downloadable local packs, not an implemented pack-switching/downloader UI.

See ADR-0011 for details.


## v0.5.9 — Player residence paintings

Three player-supplied square illustrations are now the active Contemporary home artwork for the Starter Studio, Sunny Apartment and Skyline Loft. The manifest references `home-{studio,apartment,loft}-{card,detail}.webp` files, updated automatically based on the current player's `home` state. Home artwork and Realty office artwork remain different. Standalone `PLAY.html` embeds images; GitHub Pages publishes cacheable WebPs. Historical/Sci-Fi remain procedural.

**Classic port status:** 22 tracked mechanics; only 2 currently marked fully implemented. Work is still needed to reproduce DOS movement, employment and dependability formulas, scoring, pawn and financial events faithfully; visual releases do not claim or change gameplay parity.


## v0.5.11 — Quick Start and Game Settings

New Game now focuses on picking a character and play mode, with **Start new game** immediately available. An existing autosave exposes **Continue** as the primary button. Classic/Modern, visual era and all four goal values are under collapsed **Game settings**, with their values displayed in a summary. Adjustments are remembered per browser origin for future games; **Reset defaults** restores Classic, Contemporary and 40/55/50/45 goals. Preferences are not copied into the private character library or Looprd. Starting over confirms before replacing an autosave. The mobile dialog no longer demands a three-page setup wizard.

## v0.5.12 — Illustrated character portraits

The in-game Character Studio offers 16 modern illustrated portrait presets and 35 portraits from the supplied reference artwork, grouped under Illustrated and Classic. Gallery images are fixed painted looks; choose Custom drawn for fully editable SVG appearance. Saving a character saves a validated `portrait` ID, not the image or a URL. Images are bundled with the offline game and separately deployed with Pages. The optional `portrait` field is also sanitized by the Looprd Python handler; redeploy the updated handler for multiplayer portrait sharing (no database schema change).
