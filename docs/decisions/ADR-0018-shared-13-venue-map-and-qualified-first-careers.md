# ADR-0018 — Shared 13-location map and qualified-first Career Center

**Status:** Accepted

## Context

Classic and Modern previously shared twelve locations, including a pawn counter inside Circuit City. The original Sierra game has thirteen location identities and a dedicated Pawn Shop. The user's priority is one board in both modes. Historical sources also indicate that unsuccessful applications at the employment office can reveal missing qualifications; there is no reliable evidence that nonqualified jobs were completely invisible.

## Decision

- Use one `places` registry of thirteen stable IDs in Classic and Modern. Place the new `pawn` location on the 4×5 perimeter, reserving the fourteenth perimeter cell as a non-interactive public garden. The center panel spans the two middle columns across three rows.
- Derive travel costs from fixed perimeter positions, not the insertion order of the `places` registry. Use the same formula per ruleset, with ruleset-specific entry hours.
- Relocate pawn/restore/unclaimed purchase commands from `tech` to `pawn`. Expose the existing shared pawn lifecycle in both modes. Keep its existing snapshot keys for source and network compatibility. The current prices, two-week grace period and transaction hours are **provisional** pending captured DOS reference tests.
- Career Center defaults to jobs whose requirements `game.jobReasons` reports as met; users can explicitly expand the full list (including the qualifications required). The engine preserves historical failed applications and their time cost. The separate Careers roadmap shows all roles.
- Add a distinct original illustration for Contemporary Pawn Shop, plus vector fallback in Historical and Sci-Fi. Art pack manifests and packaged assets remain offline portable.

## Scope limitations

This creates thirteen distinct locations for **both** rulesets; it is **not** a verified exact reconstruction of all thirteen Sierra businesses. Z-Mart and Black's Market are still combined in The Life Loop's Fresh & Frugal, and several other services have been modernized. Exact travel time and original job listing visibility await DOS comparison. No change to source-controlled player identities, character customization, or Looprd schema.

## Verification

Run `node tools/verify.mjs`, Python Looprd handler tests, and browser smoke tests at desktop/phone widths. Verify 13 buildings, a separate Pawn Shop in both modes, qualified-first agency, expanded career list, and save/load preservation of pledged items.
