# ADR-0035 — Classic work warnings, paycheck audit and AI feasibility

**Status:** Accepted

## Decision

The `n108.sc` source orders three gates before Classic work: worn/missing uniform disables work; `dependability < required - 5` dismisses the employee; on the first eligible low-reliability work attempt at `dependability < required - 2`, issue a warning instead of performing the action. In The Life Loop the warning is limited to once per player/week and uses one of the provisional ten venue-action choices, but deducts **no clock time**, pays **nothing**, and does not progress stats. The next attempt in the same week proceeds unless the dismissal boundary is crossed. Persist the week marker as `classicWorkWarningWeek` and validate it on imported/remote snapshots; older saves receive zero. The warning is explicit in the workplace's action preview.

Keep source-derived integer `workGross` distinct from a **provisional** rent garnishment and surcharge calculation. A single nonmutating `ClassicTime.paycheck` quotes `fullGross`, `gross`, `garnished`, `fee`, `net`, and `arrearsAfter`. The work action uses the same quote. Do not assert that the half-gross garnishment and $2 fee match original `n108.sc`: the DOS reference explicitly warns that the original can calculate debt deductions from **full-shift** gross and overwrite partial pay (`temp0` vs `temp1`). Until a DOS runtime trace is available, preserve the existing Life Loop formula and expose its provenance.

Jones's Classic source-branch planner reserves an action clock unit after traveling to work. Suppress source action candidates at the weekly ten-action limit; fallbacks stop at that cap rather than moving endlessly. Modern mode remains unchanged; no Looprd wire/protocol changes.

## Verification

`TEST-WORK.bat` covers boundary thresholds, non-paying warning, dismissal precedence, partial-gross pay and debt quote, save migration/corruption, source AI travel feasibility, and Modern mode. `node tools/verify.mjs` builds both HTML targets and runs the entire regression suite. The 170-waypoint travel spending conversion and DOS garnishment remain open source-trace dependencies.
