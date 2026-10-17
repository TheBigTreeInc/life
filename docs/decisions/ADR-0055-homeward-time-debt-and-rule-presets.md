# ADR-0055 — Default gameplay families with per-game house rules and homeward overtime

**Status:** Accepted · 2026-10-16 · v0.5.55

## Decision

A new game chooses an **immutable family**: Classic follows original DOS mechanics as they are verified; Modern remains the separately maintained game with contemporary shops, stories, events and progression. Selecting optional house rules never swaps the shop or event catalog. The family and normalized house rules are saved into each game's snapshot, including online co-op; no rule can be changed mid-game.

Two supported deviations are currently available in **New Game → Game Settings → House Rules**:

- **Return home when ending a week** — Classic default ON, Modern default OFF. If enabled, every human or AI turn ends with a forced route to the home tile even if the clock shows fewer units than the route costs.
- **Deduct travel overtime next week** — Classic default ON, Modern default OFF. Enabled only alongside automatic return. Charge available units this week and deduct route shortfall from that player's next weekly budget, after existing hunger penalties. Overtime can be forgiven in a custom game.

The player retains a nonnegative visible clock and the deferred time is stored as validated `returnTravelDebt`. Each hotseat or online player retains their own debt until the next shared new-week boundary. Normal voluntary travel remains blocked when the player cannot afford it; only mandatory homeward return can borrow next week's time. The visible pawn currently snaps to home at turn close; animated return is a separate presentation improvement.

## Safety and compatibility

Older saves without a rules object inherit their family's defaults and receive zero pending debt. Existing rule-family selection is preserved, and Modern's default behavior is unchanged. Snapshots reject negative or impossible return debts. Neither Looprd Social nor Looprd game server requires schema changes: the game's existing JSON snapshot contains the new fields. All players in a room must use the same validated ruleset snapshot.

The original SCI tick-clock-to-graph conversion remains provisional, and the game represents DOS days as weekly turn boundaries. Do not mark exact DOS clock fidelity complete until matched to source traces. Future additions (rent behavior, economic events, shop expansions, difficulty) must be explicit schema-versioned house-rule fields, not arbitrary switches sprinkled throughout the engine.
