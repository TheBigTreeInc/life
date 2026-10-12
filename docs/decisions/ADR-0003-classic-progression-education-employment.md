# ADR-0003: Distinct Classic career / university engine

**Status:** Accepted · 2026-10-12 · v0.4.6

## Decision

Keep Modern Story's four linear degrees and qualifications unchanged. Classic is a separate progression subsystem with original eleven diploma prerequisite graph, $50 enrollment per course, up to four concurrent enrollments, ten 6h lessons and optional study aids. Graduation grants +5 happiness and +5 dependability. The original Experience and Dependability caps, job-change bonus, raise thresholds and work-triggered firing are implemented only for Classic. Classic victory education and career progress use the documented degree count/reliability formulas, not job tier.

## Scope and caveats

The 19 existing Life Loop occupations still have fictional names/wages/venues and are bound to documented-style requirements using a **provisional mapping**, not copied/exact original job data. 20% vacancy refusals and 6h/8h full shifts are retained pending DOS evidence. Original rent, loans, pawn transactions, partial shift pay, and event odds remain unfinished. The three visual eras remain cosmetic.

## Compatibility and testing

Classic saves use `classicDegrees`, `classicEnrolled`, `classicEnrollmentCredits`, `classicProgress`, `classicRaises` and `classicDismissals`. Older Classic saves map their linear academic stages to `junior-college`, `trade-school`, `business-admin`, `electronics` (an intentional gameplay migration). Modern saves stay intact. The automated parity tests (`tests/classic-parity.test.cjs`) and browser smoke tests exercise the distinction.

Reference: [Hi-Tech U](https://jonesinthefastlane.fandom.com/wiki/Hi-Tech_U), [Degrees](https://jonesinthefastlane.fandom.com/wiki/Degrees), [Experience](https://jonesinthefastlane.fandom.com/wiki/Experience), [Dependibility](https://jonesinthefastlane.fandom.com/wiki/Dependibility).
