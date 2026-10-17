# Claude handoff — SOC Admin Submission Sheet

Updated 2026-10-17 after PR #65 merged. Continue from the shared working
tree; do not restart the implementation.

## Current state

- Merged to `master` in PR [#65](https://github.com/Mission-Next-Technical-Academy/student-portal/pull/65)
  at `74fce5a`.
- S1 framework + M01, module sheets and parity tables for M02–M12, and S6
  spelling are implemented. The S3 agent ended with an API rate limit, but
  its module files and test cases were present, reviewed, and passed.
- The verdict now follows the owner's later instruction: score at/above the
  pass mark recommends PASS unless the scorer flags a critical failure. Red
  sections remain visible and prefill teacher feedback; they do not override
  a passing score. Scores themselves are unchanged.
- The parity tables and sprint status in
  `docs/workstreams/ADMIN_SUBMISSION_SHEET.md` have been updated. Read that
  spec for module details and constraints.
- A separate Help Desk H0 recon is in
  `docs/workstreams/HDESK_SUBMISSION_SHEET_HANDOFF.md`; it is not part of this
  SOC change.

## Verification already completed

- `node tests/admin-submission-sheet.test.js` — 82 checks, 72 cases across
  12 modules.
- `node tests/admin-sheet-spelling.test.js` — 18 tests passed.
- `node bin/portal-check.js` — exit 0.
- `bash bin/ci-check.sh` — exit 0.
- Full `tests/*.test.js` sweep has four failures, all reproduced unchanged at
  clean checkpoint `c0e195a`: `guided-lab-console-guide`,
  `soc-m04-assessment-rubric`, `soc-m04-assessment-scorer`, and
  `soc-m05-assessment-console`.
- Headless Chromium rendered pass and return sheets for every module (24
  synthetic renders), with no horizontal overflow. Screenshots were written
  under `/tmp/admin-sheet-browser/`; the M12 return sheet was visually
  inspected.
- The full `tests/*.test.js` sweep has four failures, all reproduced at clean
  checkpoint `c0e195a`: `guided-lab-console-guide`,
  `soc-m04-assessment-rubric`, `soc-m04-assessment-scorer`, and
  `soc-m05-assessment-console`.

## Remaining work

1. A staging click-through of an instructor submission still needs an
   owner-provided synthetic account. Before opening the app, confirm
   `bin/dev.sh status` reports `target=STAGING`. Do not use production.
2. Do not change module scoring as part of this work. The question about
   making currently unscored ticket fields affect scores remains unanswered
   and out of scope until the owner decides.

## Important rules

Read `AGENTS.md`, `CLAUDE.md`, `ROADMAP.md`,
`docs/LAB_ASSESSMENT_STANDARD.md`, and `docs/operations/AI_AGENT_RULES.md`
before continuing. Never push to `master` directly. No database, staging
deployment, or production action is authorized by this handoff.
