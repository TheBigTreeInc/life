# ADR-0066 — Shared UI locale contract and ZipRunner overlay compatibility

**Status:** Accepted
**Release:** 0.5.66

## Context

The Windows ZipRunner merged working tree contains `tests/language-campaign.test.cjs`, which is not present in the v0.5.65 source artifact. It requires `#languageSelect` and an `I18n.set(...)` integration. v0.5.65 added a toolbar dropdown but only called `UX57.saveLocale`, so the test failed. This is a new failure, distinct from the earlier absent dropdown.

## Decision

- Add `src/i18n.js` after `src/life-pass-057.js` in all builds. Expose `window.LifeI18n` and the backwards-compatible `window.I18n` for retained local integrations. A shared `set(locale)` controls EN/NL persistence, root document locale, the toolbar and any open New Game language control. Keep the `UX57` dictionary and storage key.
- Both the existing `#gameLanguage` and toolbar `#languageSelect` changes call `I18n.set(...)`, then update New Game captions using existing logic. Source-marked static labels are translated without resetting game state. There are no new save or network fields.
- Preserve the historical v0.5.65 release ledger entry. This is a *new* version 0.5.66; never overwrite/rename a previous ZIP.
- Ship new regression tests and a new unique release identity; ensure full-source ZIP and offline HTML include `src/i18n.js`.

## Boundaries and verification

This resolves the specific reported `I18n.set(...)` compatibility contract and restores functional translation for explicitly marked static labels. It **does not** complete the planned Dutch translation of every dynamic dialogue, venue, generated event and tool-tip (LL-301). The original locally retained test is unavailable here, so operator acceptance on the merged Windows working tree remains required. Tests include an in-memory browser simulation for language switching and storage and verify the offline distribution. Run `node tools/verify.mjs` and `TEST-LANGUAGE-066.bat`. No Git push/deployment and no DOS gameplay changes.
