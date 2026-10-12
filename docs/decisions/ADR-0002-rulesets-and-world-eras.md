# ADR-0002 — Select ruleset and world era separately at New Game

**Status:** Accepted · 2026-10-12 · v0.4.5  
**Supersedes:** None · **Extends:** ADR-0001

## Decision

The existing **New Game** dialog offers two *rulesets* and three *visual eras* in independent controls. The same engine evaluates actions for every era; visual choices must never change economic or strategic outcomes. Both selections persist in every game save. A ruleset/era cannot be changed midgame; a different selection requires a new campaign.

### Game rules

- **Classic Rules (parity in progress)** is the default in the new-game dialog. It is the progressively implemented original gameplay contract, *not* an assertion of DOS-complete fidelity. v0.4.5 makes the clock 60 hours, building entrance cost 2 hours on top of existing board-distance movement, four-hour job application, six-hour relaxation, Dependability start 20 / loss 3 per week, +1 Experience/+1 Dependability for a successful full shift (with provisional job/education caps). Openings may reject a qualified application after its time cost; the temporary 20% rejection rate is **not empirically confirmed**. Work keeps the original v0.4.3 six-hour/8h paid contract. Optional social/favor/seasonal/civic bonuses and fallback home gigs are disabled. Note that original 11-degree paths, exact career scoring, monthly rent procedures, a full job market, dismissal, and original action-edge cases are **still outstanding**.
- **Modern Story** preserves v0.4.3–v0.4.4 mechanics: 40-hour weeks, straightforward hiring, faster career stats, NPC encounters, civic opportunities and economic effects. This ruleset is kept intentionally separate from original parity work.

### World era (visual only)

- **Historical:** Willowford, timber/brick houses, hanging lamps, cobblestones and period-inspired resident outfits.
- **Contemporary:** New Day City, existing colorful contemporary storefronts, modern clothing and streets.
- **Sci-Fi:** Neon Meridian, glowing arcologies, orbital details, hovering transit and futuristic outfits.

The era config maps the **same twelve venue IDs** to era-appropriate names. Jobs, stats, money, prices, economy events, shop stock, victory thresholds and random seeds remain unaffected by era choice. UI palettes, backgrounds, building vector scenes, NPC costume details, and city/venue copy are presentation concerns only. Reuse the same engine and persistent player state across eras; do not fork mechanics for settings.

## Backward compatibility

Older saves without `settings.ruleset` or `settings.era` must load as **Modern Story / Contemporary**, never silently enter Classic. The new-game dialog defaults to Classic/Contemporary, while the constructor defaults to Modern/Contemporary for backwards-compatible developer usages. The saved settings control rule-specific hour validation and time display. The user must explicitly start a new game to change game rules.

## Gates and remaining gaps

Regression tests must cover all six combinations, deterministic economics across eras, classic-vs-modern costs/bonuses, prior-version saves, 60-hour save validation, and complete inline SVG rendering without remote assets. Include browser smoke testing of the setup screen and game at wide and narrow viewport widths.

Follow-up parity items: verify original action costs, hiring probability and stat cap formula by directly observing the supplied DOS copy; implement firing, eleven-degree dependency tree, original career/education scores, manual rent and four-player turns. Keep `docs/parity-contract.json` and `docs/parity-matrix.md` synchronized; until direct DOS observation, status of related rules remains **partial** rather than **implemented**.
