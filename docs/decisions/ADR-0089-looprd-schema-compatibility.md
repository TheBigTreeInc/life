# ADR-0089 — LoopRD schema validation repair (v0.5.89)

LoopRD diagnostics on 2026-10-18 confirmed Life remained at v0.5.74 / SQLite schema 2 because v0.5.88 rejected the specification: ordered migrations 2..3 missing and six string primary keys invalid.

The six new Game* records now use generated integer `recordId` physical primary keys; their existing string `id` values remain required unique logical IDs. This maintains the internal Python repository's `id` lookups/inserts. Database migration version 3 explicitly supplies six additive `CREATE TABLE IF NOT EXISTS` statements with matching column types and per-field unique constraints. The script avoids modifying Room or existing player data. **This is not a confirmed live migration**; the running LoopRD validator and model reconciliation must still accept the schema, and SQL must be tested on a disposable copy of the actual deployment before approval.

No destructive SQL is introduced, Room and the version-2 chatKey migration remain unchanged; no live DB was accessed. Test: `python -m unittest tests.test_looprd_schema089` and `node tools/verify.mjs`. Accept only after LoopRD reports v0.5.89, schema 3, no failure, and read-only model inspection shows all six records. Protect existing Room/chat data with a backup before controlled deployment.
