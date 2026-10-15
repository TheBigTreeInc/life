# ADR-0037 — Source-informed Classic turn sequencing and rent assessment

**Status:** Accepted

## Motivation and sources

Jones DOS Pass-2 `Player.endTurn` subtracts **3 dependability** (minimum zero), while `Player.startTurn` invokes a multi-state `startTrn` cycle including economics and periodically checked obligations. The reference identifies **four-week** rent cadence, but cautions that full `startTrn` execution order and callbacks are not verified. v0.5.35 implemented a grouped weekly reset which applied dependability decay *after* all players finished. This distorted hotseat ordering.

## Decision

1. New pure module `src/classic-turn-sequence.js` exposes `closeTurn`, `rentAssessment`, and bounded `append`/`validate`. End-turn consumes reliability per player exactly once in their completed week, **before switching player or starting the next week**. AI goes through the same close path. The Modern ruleset retains its previous weekly decay.
2. Classic's start-of-week uses an **observable migration phase order**: economic indices/events → for each player living expenses, rent assessment, loan check, reset → week ready. This is testable and deterministic, **not a claim that the original 37 SCI `startTrn` states run in this exact order**.
3. Missed rent is assessed after the fourth-week deadline (week 5, 9, etc. unless extended/paid). `classicLastRentChargeWeek` prevents an identical week being charged again even if retried; `classicRentDueWeek` advances by four on charge. Paid rent stays under its existing action handler, not charged automatically.
4. `classicTurnJournal` stores the latest 72 `{week,phase,playerId,amount}` records. Load rejects malformed, out-of-order or future events; historical snapshots without the journal or close markers default safely without replaying settlement. Finances renders recent entries to aid DOS trace comparison. This is a **diagnostic timeline**, not an extra fee/action.
5. Client-only additive snapshot fields preserve Looprd routing and modern gameplay. The existing employment/paycheck/road graph and eight-index economy remain unchanged.

## Limitations and next evidence

`startTrn.sc` has 37 source states with nested scripts; the original exact procedural order, wage-garnishment register overwrites, action-event count and movement tick-to-clock scaling remain unverified. Obtain instrumented DOS runtime traces before changing those underlying formulas.

## Acceptance

`TEST-TURNS.bat` covers end-turn once and before hotseat handoff, AI turn closure, phase order, rent crossing, save/replay/tamper checks, bounded journal and Modern-mode isolation. `node tools/verify.mjs` is mandatory for release.
