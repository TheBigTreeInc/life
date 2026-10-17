# DOS 1.000.060 Jones decision branches — recovery worksheet

**Primary:** `WhereShouldIGo.sc` script #300, [decompiled source](https://github.com/sluicebox/sci-scripts/blob/main/jones-dos-1.000.060/src/WhereShouldIGo.sc). `global403` marks a selected decision, not necessarily the input `global500` debug probe. These numbers must never be confused.

| Source decision IDs | Recovered subject | Current coverage | Outstanding evidence |
|---|---|---|---|
| 1 | Unemployed, Employment Office | In-game career search and two-week fallback | Original vacancy/retry conditions; `global402` |
| 2–11 | Rent assessment, earnings, cash and extensions | Cash rent, withdrawal, wages, extension and pawn heuristics | Complete branch-order/route choices and original cash asset utility |
| 12–20, 220–222 | Clothing, replacement, liquidity | Uniform wear/renewal and purchasing | Exact supplier price/stock, source item IDs and alternatives |
| 21–27 | Food provision through work, savings, pawn and shop | Source #27 corrected, others as source-tagged heuristic branches | Full consumable 1–5 semantics, conditional pantry storage, original itinerary |
| 28 | Raise | **Original numeric threshold and maximum two** applied to both Classic player action and AI | Unmapped `global402` and original wage-table transformation |
| 29 | Promotion | **Original numeric eligibility gates** connected to playable job candidate | Original promotion command/action outcomes not yet reconstructed |
| 30 | Work to improve skill | **Original deficit comparator**; still uses playable work cadence | Original time/tick estimate and interleaving with other tasks |
| 31 | Work and purchase planning | No faithful implementation | Original eligibility and source items |
| 32 | Rest at minimum relaxation | **Exact relaxation == 10** | Rest action magnitude and home item effects |
| 33–36 | Work/rest, optional acquisitions and vocational choices | Partially analogous game actions | Random gates and cash thresholds not validated |
| 37 | Rest for low relaxation | **Exact relaxation < 17** | Original path and rest action duration |
| 38–43 | Pawn, optional consumption and investments | Existing compatibility financial behavior | Exact source effects and probability distribution |
| 44 | Attend university | Enrollment/cash/degree-count source predicate; career recommendation remains heuristic | SCI RNG `Random(0 3)` and original course priority |
| 45 | Optional venture/other skills | Source-not-ported | Exact branch inputs and choices |
| 46 | Work | Source-employed/dressed branch; no invented budget-gap prerequisite | Original route feasibility |
| 47–49 | Late-week education/work/home fallback | Existing turn close and homeward travel | Exact rule ordering and late-clock behavior |

**Status:** A *source-identified* branch is not a *DOS-equivalent implementation*. No claimed full 38-/49-branch completion or bit-perfect replay. Keep LL-308 and LL-190 open for exhaustive parity. The source gives 49 selected decision codes plus extra alternative codes (for example 220–222); not all are in our playable game.

**Comparison workflow:** Choose a DOS seed/recorded start state, record the chosen `global403`, destination, current clock, cash, item quantities, dependibility, experience, and relaxation; replay the same inputs in Classic, then categorize numeric gate, choice order, RNG order, and action-time deviations separately.
