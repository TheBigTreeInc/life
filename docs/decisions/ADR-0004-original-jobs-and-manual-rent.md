# ADR-0004 — Original DOS jobs and player-driven rent in Classic

**Status:** Accepted · **Release:** v0.5.0 · **Rules:** JOB-001, JOB-002, JOB-003, JOB-005, ECON-001, MOD-001

## Decision

Classic follows the documented DOS/floppy **37-position employment table**, keeping the original base wages, employer groupings, Experience and Dependability minima, required diplomas, and uniforms. The two CD-ROM-specific positions (QT Clothing Janitor, Socket City Clerk) are excluded from the floppy baseline; they may become optional edition content after binary verification. Modern Story retains the 19 original Life Loop careers.

One physical location in our 12-tile city may host multiple Classic employers, because the modern city is not a literal copy of the Sierra board; individual employers remain separately labeled and selectable at the Career Center. **This shared-map workaround is not a claim of 1:1 location parity.** It must eventually be addressed under TIME-002 / building parity.

A Classic application costs four hours even when refused for qualification, and +3 Happiness on a successful hire / -1 on rejection. A qualifying application uses a seeded openings roll: `30 + (10 + Dependability + Experience + 8 × completed degrees) / 3` percent, capped to 0–100, with the Monolith Cook job guaranteed. A role that fails due to openings is blocked for the remainder of the same week. A successful switch replaces the single active job; a failed one never ends employment. Classic listed wages fluctuate with the existing simplified economy; a raise updates the **current wage to the posted wage** if the listed value exceeds the held wage and Dependability requirements are met.

Classic rent starts at **$325**, first due **week four**, and must be paid **in cash at the Rent Office** before the due week's end. The first one-week extension is guaranteed; subsequent probabilities are 75%, 50%, then at least 25%; one attempt per week. If rent goes unpaid it becomes arrears, and each work shift garnishes up to half gross wages toward that debt, plus $2 interest if debt remains. An arrears history disables future extensions. Modern Story retains automatic rent payment and original lower-stakes economy.

## State and migration

- A Classic save with an old v0.4.6 fictional job maps that job to the nearest classic role while retaining the saved wage. Do not silently change a player's money or wipe progress.
- Classic fields: `classicRejectedOpenings`, `classicRent`, `classicRentDueWeek`, `classicExtensions`, `classicExtensionAttemptWeek`, `classicEverDebt`.
- Newer saves remain round-trip stable. Legacy Modern jobs are unchanged. Era selection remains visual-only.

## Verified source and limitations

These tables and formulas are **secondary-guide verified**, not DOS-emulator observed. Sources: [List of Jobs](https://jonesinthefastlane.fandom.com/wiki/List_of_Jobs), [Employment Office](https://jonesinthefastlane.fandom.com/wiki/Employment_Office), [Rent](https://jonesinthefastlane.fandom.com/wiki/Rent), [Week](https://jonesinthefastlane.fandom.com/wiki/Week). Some CD vs floppy text can differ. Rental contract switching, advance rent payments, housing-type pricing, original economics, events, partial-hour shifts, shops, full bank/loan mechanics and DOS exact timing remain future acceptance work.

## Acceptance

Automated tests assert original-table structure, high-end prerequisites, refusal and lockout timing, salary and raise behavior, rent cash-only, first extension, arrears, garnishment, AI survivability, legacy migration and Modern isolation. Browser checks cover filtered applications, shifts and Rent Office at desktop and mobile sizes. No copyrighted art, music, dialogue, or program files from the uploaded DOS archive enter the published browser package.
