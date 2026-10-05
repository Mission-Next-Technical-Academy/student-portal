# Module 06 enhancement progress — Sprint 7

Date: 2026-09-10  
Scope: `CURRICULUM_SCENARIO_ARCHITECTURE.md` Sprint 7 only  
Status: implemented locally; curriculum/compliance/faculty review remains pending

## Delivered

- Added four embedded scenario → theory → three-question feedback check →
  applied-task loops to the existing Module 06 lesson allocations.
- Preserved the guided two-source hunt and added a distinct independent lab for
  a fictional Mission Next Labs dormant scheduled-task backdoor (`UpdateHealth`
  on `ws-318`) with a signed-maintenance comparison, bounded scope, evidence
  preservation, and proportionate escalation decisions. The catalog records it
  as `minutes: 0` inside the existing 90-minute lab allocation.
- Kept the existing randomized hypothesis/indicator/query/bookmark/ATT&CK quiz
  and supplementary sources. The crosswalk remains a developer draft; no
  certification, affiliation, pass guarantee, real victim, operator, or live
  indicator claim was added.
- Kept Module 06 at 165 minutes / 2 hours 45 minutes and did not alter other
  modules or the future shared ransomware evidence set.

## Verification

- `node --check portal/soc-analyst-module-06.js` — passed
- `node --check portal/data.js` — passed
- `node bin/portal-check.js 6` — passed (`module 6 OK`; SOC and IT entries)
- `node bin/render_all.js` — passed (`views: 129/129 render clean; dead NAV routes: 0`)
- `git diff --check` — passed

Sprint 8 and later remain out of scope.
