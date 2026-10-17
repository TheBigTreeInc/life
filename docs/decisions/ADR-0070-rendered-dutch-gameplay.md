# ADR-0070 — Dutch translation of the rendered gameplay interface

**Status:** Accepted

## Problem

v0.5.69 could remember a Dutch language selection while nearly every dynamically regenerated gameplay panel remained English. `data-i18n` markers only existed on a small portion of the permanent HTML; action cards and the board are created by `render()` with `innerHTML`.

## Decision

- Use `LifeI18n.uiText` for a versioned Dutch presentation vocabulary. Source engine, English game message identifiers, saves, Looprd payloads and deterministic RNG stay unchanged.
- On each game `render()`, after `showModal()`, and on a live language switch, run `LifeI18n.apply` over both static and generated DOM text. The original English text is retained per text node to permit immediate Dutch -> English restoration without a page reload.
- Preserve user-authored Social and co-op messages verbatim and keep original DOS business/employer names stable. Localize attributes for accessible labels and tooltips.
- Keep `I18n.set`, `I18n.get`, `I18n.t`, `I18n.locales`, `I18n.KEY`, and all v0.5.69 public interfaces stable. Preserve `gameLanguage` and `languageSelect` controls.
- Test repeated renders and live switching, and verify save/snapshot isolation.

## Scope and limits

This is an operator-facing Dutch UI correction, **not a claim of complete localization**. Screens, common action copy and most Classic venue descriptions are translated; long, procedurally combined event text, story dialogue, less-common action reason strings and third-party Social server replies may remain in English. Their comprehensive translation is still tracked by `LL-301`.

A language selection does not alter the saved game's ruleset, economy, goals, location, players or network identity. No Looprd schema changes.

## Acceptance

1. Start Classic Original; inspect Dutch week clock, finances, goals, venue titles/descriptions and buying/working action labels.
2. Change EN -> NL -> EN while game and venue remain open. No reset, duplicated label or lost time.
3. Open New Game, Career, Finances, Social chat and mobile navigation. Verify Dutch controls and original user chat content.
4. Run `node tools/verify.mjs`; rebuild `PLAY.html` and Pages; verify from a fresh source ZIP extraction.
