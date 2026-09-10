# Module 03 enhancement brief — SIEM & Log Analysis

Sprint target: Sprint 4 only  
Source: `CURRICULUM_SCENARIO_ARCHITECTURE.md` §§2–4 and the Sprint 3 handoff  
Status: implemented locally; the draft crosswalk remains pending curriculum,
compliance, and faculty review.

## Scope

1. Convert all four existing Module 03 lessons into scenario → theory →
   three-question knowledge check with feedback → applied task loops.
2. Keep the existing assisted service-account correlation lab and add a
   genuinely independent low-and-slow cloud-mailbox takeover lab with a
   different decision path.
3. Keep the locked 465-minute / 7-hour-45-minute module total and the existing
   240-minute lab allocation. The second lab is an alternate practice path
   inside that allocation, not additional advertised time.
4. Review the randomized quiz and sources without turning the developer draft
   crosswalk into a student-facing approval or certification claim.

## Scenario boundary

All new content uses the fictional Mission Next Labs organization and
`acct-428`. The flagship guided lab remains the `svc_reports` service-account
case; the independent lab uses a sparse three-day cloud mailbox/session case so
learners must reason about weak signals and uncertainty rather than repeat the
guided evidence-selection workflow.

## Verification expected

- `node --check portal/soc-analyst-module-03.js`
- `node --check portal/data.js`
- `node bin/portal-check.js 3`
- `node bin/render_all.js` reports `dead NAV routes: 0`
- `git diff --check`
