# ADR-0022 — Classic employer identities and actual board workplaces

- **Status:** Accepted
- **Release:** 0.5.21
- **Scope:** Canonical presentation mapping and validation; game rules/Looprd unchanged

## Problem

The engine maintained the original *Jones in the Fast Lane* job catalog, including Monolith Burgers, Socket City and Z-Mart. Contemporary board venues had different names (The Good Fork, Circuit City, Fresh & Frugal). Work actions already depended on `job.place`, but the interface announced legacy employer names, preventing players from recognizing their workplace on the city board.

## Decision

Define `classicEmployerVenues` and pure `jobWorkplace(job)` in `src/data.js`. Validate each of the 37 job entries against an existing venue and exact place ID. Keep original employer and job ID for reference and persistence. Use actual venue name or distinct sub-department in engine/UI action titles, employment feedback, current job, Career Center, job-switch confirmation and work tile marker. In Classic Center filters display both the board brand and DOS reference employer. Do not add fictional extra businesses or change location/travel/rent logic.

Z-Mart and Black's Market both still occupy the sole Fresh & Frugal tile (Discount/Groceries departments). This limitation is explicit; a fully faithful original employer/venue count requires a subsequent map redesign and cannot be solved by names alone.

## Verification

Regression must prove that all DOS roles resolve to a board business, actual shift actions appear only at the job's `place`, messages use visible names, and both departments remain independent. The map highlights the employed character's workplace while allowing visits elsewhere. Do not change Modern Story, save format, Looprd schema or Classic economy.
