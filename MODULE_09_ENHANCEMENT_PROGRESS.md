# Module 09 enhancement — Sprint 10 progress

Date: 2026-09-10
Status: complete locally; downstream consumers remain out of scope.

## Shipped

- Reworked `portal/soc-analyst-module-09.js` from the former identity-only
  slice to active ransomware case `INC-4937` (Operation Cedar Lock).
- Added synthetic endpoint, identity, and network/scope evidence with stable
  IDs `M09-E01`–`M09-E10`; selected guided evidence is deliberately bounded.
- Added `MISSION_NEXT_M09_EVIDENCE_CONTRACT` and its consumer slices for
  Modules 10–12. It is browser-local and carries explicit unknowns.
- Added scenario → theory → knowledge check → applied task framing, explicit
  NIST Prepare / Detect & Analyze / Contain / Eradicate / Recover / Learn
  sequencing, and retained per-answer quiz feedback.
- Added independent `INC-4942` response drill with separate state, scoring,
  handoff, reset, and completion record.
- Rebalanced the existing Module 09 lab allocation to 75 minutes plus a new
  45-minute independent lab; module remains 150 minutes total.

## Boundaries

Modules 10–12 were not implemented. No real victim, operator, attribution,
live IOC, destructive endpoint action, or certification approval claim was
added. The Security+ crosswalk remains a developer draft pending review.

## Verification

- `node --check portal/soc-analyst-module-09.js` — pass.
- `node --check portal/data.js` — pass.
- `node bin/portal-check.js 9` — pass (`module 9 OK`, program overview OK).
- `node bin/curriculum-check.js` — known repository-wide baseline failures
  remain (legacy lab/catalogue totals and unrelated IT Support records); no
  Module 09-specific error remains after the 75/45 reallocation.
- `git diff --check` — pending final orchestrator run.
