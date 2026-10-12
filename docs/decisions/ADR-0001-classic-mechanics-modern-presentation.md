# ADR-0001: Preserve original mechanical rules; modernize presentation

- **Status:** Accepted
- **Date:** 2026-10-12
- **Context:** The Life Loop initially shipped a faster and more forgiving economy (40h rather than 60h, simplified careers and education) alongside added stories, relationships and civic events. The game's owner wants the **same gameplay mechanics as the 1991 Sierra game**, implemented with modern presentation and engineering.

## Decision

1. The original *Jones in the Fast Lane* gameplay rules are the **mechanical target** for the baseline **Classic Rules** experience.
2. Source-backed parity takes precedence over current remake balance. Report and prioritize mismatches; do not claim the mechanics already match.
3. Additive visual, informational, accessibility, performance, UI and offline/cloud-delivery features are welcome without changing underlying costs/progression.
4. Features that affect economy or wins but did not exist in the original (NPC favors, civic subsidies, extra freelance income) must be confined to an **explicit opt-in Modern Story** ruleset or converted to cosmetic/informational behavior in Classic Rules. Configuration is **not implemented yet**.
5. Every mechanical change is reviewed against stable rule IDs and parity tests, with reference provenance and workboard updates in each ZipRunner delivery.
6. Existing player saves require version-aware migration; do not silently rewrite active historical games as if previous rules had been the original.
7. Publishing must use original game code and legally distributable assets only. Original Sierra resource archives remain separate research material.

## Consequences

- Near-term implementation order favors time/action accounting, qualifications/degree graph, reliability/caps/scoring, rent/food/debt, and original venue systems over additional features.
- Workboard acceptance includes parity delta + source evidence. UI tests do not replace engine tests.
- Keep a clean contract between rules engine and modern interface; the UI must not mutate simulation state.
- v0.4.4 is a **documentation-only release** and does not yet fulfill this decision mechanically.

## Rejected alternatives

- **Keep modern simplified rules by default:** rejected because it alters strategy and challenge.
- **Recreate exact 1991 appearance and bundled assets:** rejected; presentation should be modern, and original assets introduce distribution concerns.
- **Let each new feature modify core rules without traceability:** rejected; would make parity untestable.
