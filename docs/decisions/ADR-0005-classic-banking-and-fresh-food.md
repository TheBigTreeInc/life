# ADR-0005 — Classic banking, stock trading and fresh-food storage

**Status:** Accepted  
**Release:** v0.5.1  
**Scope:** Classic Rules only

## Context

The v0.5.0 bank had a single generic investment holding, 1-hour savings transactions, fictional interest and no bank loans. Fresh groceries were either sold individually or in fictional three-unit bundles; the original game distinguishes refrigerated fresh food from restaurant meals.

## Decision

1. **Bank deposits:** transfer exactly $100 in either direction without consuming extra action time while inside the bank; deposits earn no interest in Classic. Cash remains distinct from savings.
2. **Loans:** apply during bank hours, using 2 hours. Approval depends on having a paying job and estimated credit; a loan increases both wallet cash and outstanding loan liability. Repayment costs $45 principal plus $5 bank interest each time (final payment may retire a smaller outstanding principal). At least one payment each four-week month avoids default; missed cycles decrease happiness and future lending capacity. Additional payments carry forward monthly coverage.
3. **Broker:** a 2-hour admission opens the stock desk until you leave the bank. Unit buys/sells then consume no further hours. T-Bills, Gold, Silver, Pork Bellies, Blue Chip and Penny Stock are separately held and valued. A T-Bill costs $100 and sells for $97. Other base prices are 413/14/20/49/7 respectively.
4. **Fresh food:** market offers 1, 2, or 4 weekly portions priced at $55/$100/$190 base. A refrigerator keeps up to six portions and a freezer extends capacity to twelve. One portion is consumed automatically each week unless already fed by a restaurant meal. Unrefrigerated leftovers spoil after a week. A newspaper ($1 and one hour) and ten-ticket lottery pack ($10) are available.
5. **Modern separation:** keep Modern Story's savings interest, bundled groceries, generic investments and existing prices/time accounting untouched.
6. **Save migration:** previous Classic single-portfolio `invested` assets become a separate redeemable legacy holding. No conversion may silently destroy wealth. Store portfolio, price table, loan cycles, defaults, broker state and food-purchase state in snapshots.

## Fidelity qualification

The **six stock base prices, $100 bank increments, T-Bill selling loss, 2-hour broker and loan applications, $45/$5 loan payments, food bundle sizes/prices, and refrigerator/freezer capacity** are sourced from published gameplay references. We have **not** reconstructed Sierra's exact stock volatility, credit-limit formula, spoilage-related doctor bill calculation, or bank robbery event probabilities. This implementation uses explicitly provisional seeded pricing, credit and $25 spoilage bill rules; mark ECON-002 and ECON-003 **partial**, not implemented/parity-complete.

## Tests / operator scenarios

Run `node tools/verify.mjs`. In Classic, buy 4 weeks of food without a fridge and end the week to confirm spoilage; purchase a fridge and verify storage lasts; buy a freezer to raise the 6-unit cap to 12. At the bank, move $100, apply for a loan after being hired, repay during a month, enter the broker and buy/sell T-Bills. Compare the action set in Modern and confirm no Classic actions are offered. Export/import an existing v0.5 Classic save and verify its financial balance is not lost.

## References

- https://jonesinthefastlane.fandom.com/wiki/Bank
- https://jonesinthefastlane.fandom.com/wiki/Stock_Market
- https://jonesinthefastlane.fandom.com/wiki/Black%27s_Market
