# Proposed ZipRunner/RoboScope workboard lifecycle contract (not accepted by v1)

The Life Loop release packages **continue to ship `ziprunner.workboard-update.v1`**. This document proposes a compatible follow-up change for the ZipRunner operator. Do not send a v2 manifest to the existing importer until its support is confirmed by tests.

## Required behavior

1. Resolve each work item by **project + stable `id`**. Changing its title never creates a new card. Reject duplicate IDs and unknown transitions.
2. For each completed item, transition the existing ID to **Done** with release number, test evidence, and operator checks. Preserve original identity and history.
3. For each unresolved item, explicitly support **Blocked**, **In Progress**, and **To Do**; Blocked requires `reason` and `unblock_when`.
4. A partial implementation must retain **In Progress** plus remaining acceptance criteria; never close a broad parity parent merely because one child shipped.
5. Updates must be **idempotent** across repeated ZIP imports. Never re-open Done on a replay of an older package. Report `created`, `updated`, `done`, `blocked`, `unchanged`, and `rejected` counts.
6. The import transaction must validate every transition **before** modifying a live workboard. Reject unknown statuses, duplicate IDs and missing evidence. Roll back on failure.
7. A release requires an operator-visible import acknowledgment. `docs/workboard-lifecycle.json` alone is *not* that acknowledgment.

## Candidate v2 payload (illustrative only)

```json
{
  "schema": "ziprunner.workboard-update.v2",
  "project": "the-life-loop",
  "version": "0.5.42",
  "transitions": [
    {"id": "LL-246", "status": "done", "evidence": ["tests/classic-household-entrance.test.cjs"]},
    {"id": "LL-175", "status": "blocked", "reason": "Exact DOS time conversion not verified", "unblock_when": "Five traced original-game routes"}
  ]
}
```

Implement this on ZipRunner's side first, with importer/rollback tests, then switch the active source handoff. Until then the source release gate verifies stable ID classification and the v1 payload limits but **cannot guarantee ZipRunner UI status changes**.
