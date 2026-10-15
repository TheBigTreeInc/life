# ADR-0029 — Numeric DOS careers and forecast-aware Classic opponent

**Status:** Accepted (v0.5.28)  
**Evidence:** derived `docs/reference/original-dos-pass1/{MECHANICS.md,original_jobs.csv,original_education.csv}`, 1.000.060 version-matched SCI decompilation; not emulator-confirmed outcomes.

## Decision

The original degree/job tables determine static job qualification. Eleven source degree IDs and prerequisites map to durable Life Loop degree keys, and the 37 job records are checked for numeric and employer-place consistency at module initialization. Repaired four experience requirements whose earlier prototype values differed. The legacy save keys and playable job wages are retained.

The job hiring threshold is an integer roll from 1 through 100 inclusive compared against the documented chance computed from experience, reliability and the number of degrees. Qualified occupation 44 (Monolith Cook) passes without RNG consumption. Failed openings are remembered for the ongoing week by the existing save field. Original employment has extra unverified rules; parity is not claimed.

Classic AI uses a pure short-horizon budget distinguishing immediate cash, withdrawable $100 portions, food, upcoming rent, and uniform expiration. It then prefers a seed-deterministic career plan linked to actual source diploma/job dependencies, job salary differences and 170-waypoint routes. Work planning includes multi-payday employment value and existing cap/energy rules; the AI should not sacrifice food or rent for speculative advancement. UI shows planned figures and historical pay metadata separately from playable wages.

## Boundary

- Do not change Modern rules, AI, locations, salary or course tables.
- No automatic wage rebalancing from source `baseHourlyPay`: exact `CostDItem` adjustment is pending.
- No new save keys or network action changes. Pure computations must never mutate seed or state.
- Preserve original Classic travel clock approximation pending measured evidence.

## Acceptance

Execute `tests/classic-migration-career-survival.test.cjs`, 100-seed legacy campaign test, `node tools/verify.mjs` and offline/browser checks. Confirm Career Roadmap shows numeric diploma IDs, source vs current wages, qualified odds, and essentials.
