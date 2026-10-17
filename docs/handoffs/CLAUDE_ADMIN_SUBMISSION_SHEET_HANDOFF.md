# Claude handoff — SOC Admin Submission Sheet

Updated 2026-10-17. Continue from the shared working tree; do not restart
the implementation.

## Current state

- Branch: `feat/admin-submission-sheet`, based on current `origin/master`
  (`7e000d0`, PR #64) after rebasing to clear PR #65 conflicts.
- S1 framework + M01, module sheets and parity tables for M02–M12, and S6
  spelling are implemented. The S3 agent ended with an
  API rate limit, but its module files and test cases are present and passed.
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
- `git diff --check` passed before the latest documentation edits; rerun it.

## Remaining work

1. Rerun the targeted checks after the last edits and inspect `git diff` for
   accidental changes or unresolved mismatches.
2. Complete any needed browser review. Do not sign in to staging unless
   `bin/dev.sh status` says `target=STAGING` and the owner has supplied a
   synthetic account. Do not use production.
3. Finish the portal VM path fix and current handoff edits, push the rebased
   branch with lease, then confirm PR #65 is no longer conflicting and its
   checks pass. The owner authorized auto-approval
   of this PR in the session transcript; follow repository merge rules and CI
   gates before squash-merging.
4. Do not change any module scoring as part of this work. The earlier
   question about making currently unscored ticket fields affect scores is
   still unanswered and remains out of scope.

## Important rules

Read `AGENTS.md`, `CLAUDE.md`, `ROADMAP.md`,
`docs/LAB_ASSESSMENT_STANDARD.md`, and `docs/operations/AI_AGENT_RULES.md`
before continuing. Never push to `master` directly. No database, staging
deployment, or production action is authorized by this handoff.
