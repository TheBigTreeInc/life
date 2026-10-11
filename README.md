# The Life Loop — v0.4.1

A modern, original, offline-capable life simulation inspired by the *genre* of 1990s life-board games. Includes original characters, locations, dialogue, SVG art, economics, and gameplay. **No original Sierra assets are included.**

## Play

- **Windows:** Extract the ZIP and run `PLAY.bat`, or double-click `PLAY.html` in Chrome/Edge/Firefox.
- **macOS / Linux:** Open `PLAY.html` in a browser.
- No internet, npm installation, or server required to play. The standalone file includes all source JavaScript and CSS.
- The game autosaves to browser storage when permitted. Use **Save** / **Load** to export and import portable JSON files.
- Development: `npm test`, `node tools/verify.mjs`, `npm run build`; `npm start` hosts the modular `index.html` at port 8080.

## Core gameplay

The player has 40 discretionary hours every week. Travel uses hours. Work requires suitable clothing and qualifications and earns money/experience; degrees unlock better careers. Balance food, rent, health, entertainment, housing, banking, investments, and four adjustable victory goals. Play solo versus an automated competitor, two-person hotseat (and rival), or solo sandbox.

The 12 city buildings have individual shopkeepers, illustrated scenes, and original two-choice story encounters.

## What's new in v0.4.0: seasonal narratives and financial history

- **Three connected NPC stories, nine chapters:** Mira/Nia (community pantry), Theo/Pip (paid repair apprenticeships), Sol/Jun (inclusive arts nights). Each arc has 3 branching episodes unlocked by completing its host's original introduction, sufficient trust (18/25/35), and at least two weeks between chapters. Final chapter requires at least 10 trust with the partner resident.
- **Real persistent consequences:** Both involved residents respond to your choices. Some personal-benefit options cost trust with the partner. Completing the community-minded final chapter permanently improves food prices (−5%), wages (+5%) or leisure tickets (−8%) for every player. Choosing the alternative has no city-wide bonus. A matching City Pulse venue adds a small, visible extra story reward.
- **Finance dialog:** Click **Finances** on the top bar to view an offline SVG chart of wallet cash vs. net worth, transactions, current 4-week inflow/outflow and life milestones. The ledger tracks actual before/after account balances. Bank/investment *transfers* do not count as income. Weekly expenses, rent, arrears, savings interest, and investment returns are included. History keeps at most 260 weeks; ledger keeps at most 160 entries.
- **Save migration:** v0.1–v0.3 save files load with blank story and finance records; v0.4 stores story stages, trust outcomes, public projects, ledgers, weekly history, and milestones. In-progress seasonal conversations resume after import.
- **Everything from v0.3 stays:** 12 illustrated buildings and NPCs, relationships/favors, 10 rotating events, career/education/economy, adjustable goals, AI opponent, hotseat and offline saves.

## Publish to GitHub Pages (v0.4.1)

The game is fully static. A GitHub Actions workflow in `.github/workflows/pages.yml` verifies gameplay, builds `dist/index.html` from `PLAY.html`, and publishes only that file. No server, backend, credentials, npm dependencies, or external game assets are needed by visitors.

1. In GitHub, create a **public** repository named `the-life-loop` (or reuse an existing repo). GitHub Free Pages is supported for public repositories. This project package **cannot** create a repository or enable Pages for you.
2. Push the entire **extracted project contents** to the repository default `main` branch, including the hidden `.github/workflows/pages.yml`. Example:

   ```bash
   git init
   git add .
   git commit -m "Publish The Life Loop v0.4.1"
   git branch -M main
   git remote add origin https://github.com/YOUR_USER/the-life-loop.git
   git push -u origin main
   ```

   If ZipRunner already maintains `.git` for the project, **do not** reinitialize it. Instead use its configured Git identity/remote to commit and push the complete v0.4.1 sources to `main`. Git push is operator-controlled.
3. Open **Repository → Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Open **Actions → Deploy The Life Loop to GitHub Pages**. If no run started yet, click **Run workflow** on `main` (or push a commit). After a successful run, the site URL appears in the deployment and in Settings → Pages.
5. Typical public URL: `https://YOUR_USER.github.io/the-life-loop/` (exact URL depends on owner, repository, and any custom domain).

**For future releases:** ZipRunner can verify the package and (when a Git remote and write credentials are set up) push commits to `main`. The workflow redeploys automatically. The GitHub-hosted site is HTTPS and browser saves remain **local to each device/browser**; they are not synced to GitHub. Players can still manually **Save** and **Load** JSON backups. Older saves continue to migrate.

**Local dry run** (Node.js 20.11+):

```bash
node tools/verify.mjs
npm run build:pages
python -m http.server 8080 --directory dist
```

Then open http://localhost:8080/ . Only `dist/index.html` and `.nojekyll` are published; no Sierra game files, tokens, or original DOS resources are included.

## ZipRunner installation

Project: `the-life-loop` · Artifact: `the-life-loop-0.4.1-ziprunner.zip` · Full source flat-root ZIP.

Download to `C:\Users\dorbi\source\_ziprunner_inbox`, then let ZipRunner apply it to project `the-life-loop`. There is **no wrapping folder**. Source is complete; it is not a delta patch. The archive includes `.ziprunner-workboard-update.json` in the root, schema `ziprunner.workboard-update.v1`. The workboard update must only be applied **after successful verification**. Local Git and settings folders are not included in the source ZIP; ZipRunner should preserve them.

**Build/verify:** `node tools/verify.mjs` from the extracted project directory. Run this before any Git actions. This rebuilds `PLAY.html`, validates metadata and runs the test suite (48 tests). Requires Node.js **20.11+** for `import.meta.dirname`; it does not need dependencies or network access. The ZIP already contains a prebuilt `PLAY.html` for systems without Node.

The portable `the-life-loop.zr` declares a build command and preservation hints, but **does not configure secrets or perform Git commits or pushes**. Any Git identity/permission is managed in the operator's local ZipRunner settings.

## Project structure

```text
PLAY.html                          Playable offline single-file game (generated)
PLAY.bat                           Windows launcher
.github/workflows/pages.yml         CI deployment to GitHub Pages
/tools/build-pages.mjs             Copy validated offline game into dist/index.html
index.html / styles.css            Modular UI, city pulse, NPC trust display
src/data.js                        Places, nine arc chapters, city events, favors, jobs
src/engine.js                      Game rules, story progression, finance ledger, migration, AI
src/art.js                         Original SVG characters and buildings
src/app.js                         Browser rendering, finance SVG and input
package.json                       Build/test tasks
tests/game.test.cjs                Engine regressions, balance, migration
/ tools/build-offline.mjs          Generate PLAY.html
/ tools/verify.mjs                 Validate package and run tests
/ tools/package-ziprunner.py       Rebuild and create release ZIP
.ziprunner-workboard-update.json   Mandatory ZipRunner workboard update
WORKBOARD.md                       Delivery tracking and operator QA
ZIPRUNNER_HANDOFF.txt              ZipRunner ingestion handoff
```

## Test evidence and limits

48 Node regression tests pass. GitHub Pages is configured but production deployment has not been completed because a target repository and Pages settings are required. The offline one-file build was loaded into in-memory Chromium, exercised at 1440px and 390px widths, including start, an initial story, seasonal chapter, finance dashboard and weekly advance, with no browser JavaScript errors. The infrastructure blocks normal URL/file navigation, so **direct Windows `PLAY.html` opening and actual ZipRunner import are still operator checks**. Cross-platform layout testing is ongoing. No Git push was performed.
