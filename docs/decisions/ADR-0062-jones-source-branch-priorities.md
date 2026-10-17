# ADR-0062 — Original Jones decision gates with preserved live-action safety

**Status:** Accepted for incremental Classic implementation, not for DOS-complete parity  
**Release:** 0.5.62  
**Rules:** JOB-002, JOB-003, JOB-004, EDU-001, TIME-003, MOD-001

## Primary evidence

DOS original v1.000.060, script #300 `WhereShouldIGo.sc`, independently decompiled and published by sluicebox:
[Source, lines 756–865, 929–1069](https://github.com/sluicebox/sci-scripts/blob/main/jones-dos-1.000.060/src/WhereShouldIGo.sc).

- **Branch 28:** raisesGiven < 2, dependibility >= minDepend+10+5×raisesGiven, calculated posted wage greater than contracted wage; `global402` cannot yet be reconstructed.
- **Branch 29:** enough education, experience >= maxExperience, dependibility >= minDepend+10, maxExperience < 80, wage increase; different from the playable application's actual `apply:<jobId>` path.
- **Branch 30:** calculate productive work sessions from the smaller deficit to experience cap or minDepend+10, with a source minimum of 1; actual DOS route/action-time multiplier remains unknown.
- **Branches 32/37:** exactly 10 / below 17 relaxation points, not a direct happiness or energy threshold. In the original they are inside the employed-and-dressed decision path.
- **Branch 44:** not all 11 diplomas completed and an unfinished enrollment OR over $400 cash (plus random and global branch guards). No seeded random is consumed in GUI preview.
- **Branch 46:** if dressed and employed with a reachable workplace, work can proceed without an extra two-week budget deficit check.
- **Branch 27:** food purchase is associated with source `global403=27`, replacing an incorrectly source-tagged #24 label.

## Implementation

New pure browser/CommonJS module `src/classic-jones-source.js`. Apply the verified raise rule to **both UI action eligibility and Jones AI**, preventing save-dependent mismatch. Add qualified promotion and skill checks to the Classic career planner and source-reported rest/education branches. Keep current Classic financial reserve, playable application mechanics, partner/hotseat enforcement, and movement/time quote systems without unverified replacements. There is no multiplayer schema or endpoint change.

`classicHardshipWeeks` counts two consecutive recovery checks but could exceed two while assistance was on cooldown, contradicting save validation. Saturate it at two; this retains entitlement timing and prevents state drift on import. A historical save with `classicRaises > 2` remains loadable but cannot claim further raises in source-style Classic rules.

## Source vs adaptation boundaries

The first-match **1–49** order, original AI's action globals (`global402`, `global329`, `global551`), risk and economics, runtime RNG and original waypoint-to-clock mapping are not ported. Branch `29` still chooses an available better-paying *job* instead of reconstructing the original promotion command; branch `30` keeps the playable two-shift cadence; education choice remains a heuristic and the original random gate is omitted, not faked. See `docs/reference/dos-jones-branch-audit.md` and LL-308/LL-190. Preserve Modern Story unchanged.

## Tests and operator checks

`TEST-JONES-AI.bat`, `npm run test:ai`, `node tools/verify.mjs` and a clean-source ZipRunner extraction. Check raise eligibility at 19/20/24/25 reliability, denied third raise, priority #32/#37 at relaxation 10/16, food purchase #27, repeatability for four seeds, and save/load after long hardship. Live DOSBox and Looprd browser acceptance remain outstanding.
