# ADR-0009 — Browser-local reusable character profiles

**Status:** Accepted  
**Release:** 0.5.6

## Decision

Characters are reusable, cosmetic profiles stored under a separate versioned `localStorage` key in the player’s browser. They are not the player’s game save and are not a Looprd identity or remote account. Support up to 16 local characters, each with name, validated palette options (skin, hair style/color, outfit, accent, expression) and a descriptive personality.

A new game copies only a normalized **appearance** value into the `LifeGame` player state. `settings.ruleset`, all stat values, goals, AI, action time and price logic are unchanged. Existing saves without an appearance remain supported. Saved-game snapshots include cosmetic appearance so local hotseat partners and remote host snapshots can display it, without sending the browser's private character library, its local IDs, or selected-character history.

Online guest can select a locally stored **name** for joining; propagation of a guest's full portrait to the host will require a separately reviewed Looprd schema/protocol change, deferred to LL-086.

## Data and privacy

- Storage key: `the-life-loop-characters-v1`; schema `{version:1, profiles:[...], selected}`.
- Browser storage is best-effort: permissions, private browsing, or clearing site data may remove profiles. Recreating the profile from a save is not automatic.
- Validate all option enums and escape free-text names before rendering HTML/SVG. Do not save secrets, photos, health data, passwords, or auth credentials.
- Local profiles stay local; the optional character **display name** is shared when joining multiplayer as before.
- No new Looprd DB model or migration is necessary for this release.

## Validation

Node profile-store unit tests and engine save migration tests; desktop/mobile browser studio QA; `node tools/verify.mjs`; clean ZipRunner ZIP extraction and CI Pages build.
