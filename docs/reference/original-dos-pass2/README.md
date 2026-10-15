# Jones in the Fast Lane → The Life Loop: Mechanics Recovery Pass 2

This is a **reference/data/test pack**, not a source patch or game executable.

## Start here

1. Read `PASS2_MECHANICS.md` for recovered rules and source citations.
2. Use `classic_rules.json`, `original_shops.json`, `weekly_events.json`, and `ai_branch_map.json` as migration references.
3. Use `reference/pass1/` for the original 170-point route, 13 board places, 37 jobs, 11 education nodes, and Pass 1's README.
4. Run `python -m unittest discover -s tests -v` in this directory. The **47 Pass 2 tests** target the reimplemented Python reference and data, not the actual DOS game.
5. Inspect `evidence_index.csv` to open the particular matching decompiled SCI script and line range behind each claim.

## Top implementation insight

The classic opponent is a sequential rule evaluator, not a scoring-only agent. It selects destinations by needs, monetary obligations, travel time and remaining turn time, with fallback work/rest/education decisions. Use `decisionTag` for source rule traceability and share the same route and economic model across human + AI.

## Provenance and caveats

The uploaded original game was identified in Pass 1 as DOS 1.000.060. The gameplay behavior was reconstructed through the version-matched, publicly available `sluicebox/sci-scripts` decompilation. We did **not** run the DOS executable, compare every script bytecode against this particular original archive, or port full SCI opcode behavior. The Python examples deliberately do not emulate 16-bit signed overflow. See the report for limits and safe migration boundaries.

No original DOS graphics/audio/executable files or full third-party decompiled script copies are included. `reference/pass1` contains derived gameplay data only. Copy this reference pack into your game's `docs/` or `tools/references/`, not directly into your runtime data folder without validation.
