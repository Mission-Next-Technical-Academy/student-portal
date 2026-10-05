# Module 08 enhancement progress — Sprint 9

Date: 2026-09-10

## Shipped

- Added four persisted lesson loops for all Module 08 catalogue lessons:
  scenario, theory, three-question feedback check, and applied task.
- Kept the exact locked ledger: 30 + 30 + 20 + 25 theory minutes and
  150 + 150 lab minutes = 405 minutes total.
- Refocused Lab 2 as an independent fictional edge-appliance
  mass-exploitation queue. Its four records use synthetic EDGE identifiers and
  require CVSS, EPSS-style likelihood, known-exploited context, reachability,
  business impact, controls, ownership, timing, and retest reasoning.
- Preserved the existing Lab 1 scored prioritization workbench and Lab 2 scored
  queue artifact; no new instructional minutes or network behavior were added.
- Updated the catalogue label/description for the second lab and clarified the
  student-facing crosswalk source as a supplementary developer draft.

## Continuity and safety notes

The edge-appliance case is fictional and contains no real IOCs, organizations,
operators, or live remediation action. The crosswalk remains pending
curriculum/compliance/faculty review and is not represented as approved or
affiliated. The architecture document remains at the repository root until all
planned sprints are complete.

## Verification

- `node --check portal/soc-analyst-module-08.js`
- `node --check portal/data.js`
- `node --check portal/app.js`
- `git diff --check`

Full portal/render verification remains to be run by the parent sprint
coordinator; no later module work was performed in this sprint.
