# ADR-0057 — Classic food phases, goal-based pacing, and localized UI

**Status:** Accepted

## Why games have been short

The game has no real-time ticking constraint and turns advance as soon as users finish discrete actions. Jones' AI is resolved immediately. Earlier Classic New Game default target was 50 points for each of four categories; scores are checked after actions and a match ends the instant all are satisfied. The game's time use/travel conversion and Classic score constants also remain partly provisional. We **do not** claim a measured 5-minute-to-DOS length ratio without telemetry or an original emulator sample.

## Decisions

- Keep 60-unit Classic weeks, end-of-turn travel debt, shops, AI and victory condition unchanged. Introduce explicitly player-selected goal presets: Quick = 50/50/50/50, Standard = 65/65/65/65, Extended = 80/80/80/80. Standard becomes the fresh-browser New Game default; previously saved preferences and old games retain original individual goal values. Any slider adjustment becomes Custom. This is a **balance choice**, not purported Sierra default points.
- Introduce `src/classic-food.js` as pure source-linked transitions for `startTrn.sc` state 10 food storage, 12 short-lived consumable cleanup, 16 weekly meal. Distinguish food item 1 (existing `groceries` stock, save compatibility) and food IDs 3–5 (new `classicShortFood` typed ledger, currently not independently purchasable). Max storage 6 with fridge and 12 with freezer; disabling spoilage remains a house rule. Same-week fresh purchases or initial starter food without refrigeration provide one ready-to-eat meal under the old compatibility rules; exact DOS short-lived shop actions, probabilities, and item identities are still unverified. No fabricated item names or prices.
- Localized UI is a browser preference (`the-life-loop.language.v1`, `en` / `nl`), not game data, which prevents language preference from changing synchronized game state. Ship `src/i18n.js` with key lookup, explicit English fallback, compact language selector and localized key UI controls and New Game settings. **This is initial localization, not a full translation of game actions, shop catalog, stories, alerts, ledger or server errors**; those still show English as encountered. Dynamic messages should migrate to message keys + parameters in future passes, without storing translated sentences as authority.
- Social SDK, Looprd handler and SQLite schema need no changes. Tests verify food chronology, old save migration, campaign goal invariants and language/state separation.

## Acceptance

Run `node tools/verify.mjs`; validate source-only settings and save snapshots; run in a real browser on phone and desktop including switching NL/EN while playing, entering New Game, changing goal preset and moving an existing saved game. Record match-length samples in **in-game weeks**, winner, selected goals and wall-time before any further balance shift. Live Social account QA remains separate.
