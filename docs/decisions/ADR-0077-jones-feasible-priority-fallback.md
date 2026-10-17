# ADR-0077 — Feasible fallback in Jones decision priority

**Status:** Accepted as playable adaptation, not complete DOS AI parity.

The DOS `WhereShouldIGo.sc` ordered priority tree includes action/time feasibility checks. The playable Life Loop source planner previously returned `null` on its first higher-priority candidate if the remaining weekly clock could not accommodate the trip and action. In this pass, the planner continues evaluating later branches instead. Original source rule IDs, budget checks, and seeded RNG semantics are unchanged.

The full 1–49 DOS priority chain and action-specific RNG remain unverified. No changes to player movement charges, save data or Modern Story.
