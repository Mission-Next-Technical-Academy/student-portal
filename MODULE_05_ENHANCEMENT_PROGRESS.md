# Module 05 enhancement progress — Sprint 6

Date: 2026-09-10  
Scope: `CURRICULUM_SCENARIO_ARCHITECTURE.md` Sprint 6 only  
Status: implemented locally; curriculum/compliance/faculty review remains pending

## Delivered

- Converted all ten existing Module 05 lesson topics into embedded
  scenario → theory → three-question feedback check → applied-task loops.
  The loops use the fictional Mission Next Labs fake-CAPTCHA → PowerShell →
  LOLBin → persistence investigation and add no minutes.
- Kept the guided `lab-endpoint-investigation` workbench intact and added a
  distinct independent `INC-5505`-style fictional CAPTCHA-to-persistence
  decision lab with a separate chain/scope/handoff path. Its catalog record is
  explicitly embedded in the existing 120-minute lab allocation with
  `minutes: 0`; Module 05 remains 270 minutes / 4 hours 30 minutes.
- Added a supplementary, developer-draft Security+ crosswalk note with
  non-endorsement/non-affiliation/non-pass-guarantee wording. Existing module
  quiz questions were reviewed; their randomized BEST/MOST/FIRST-style
  scenario reasoning and per-answer feedback were retained.
- Retained and reviewed the NIST, CISA/MITRE/vendor-style source pattern;
  no real victims, operators, live IOCs, or external actions were added.

## Verification

- `node --check portal/soc-analyst-module-05.js` — passed
- `node --check portal/data.js` — passed
- `node bin/portal-check.js 5` — passed (SOC and IT entries)
- `node bin/render_all.js` — passed (`views: 129/129 render clean; dead NAV routes: 0`)
- `git diff --check` — passed

Sprint 7 and later remain out of scope.
