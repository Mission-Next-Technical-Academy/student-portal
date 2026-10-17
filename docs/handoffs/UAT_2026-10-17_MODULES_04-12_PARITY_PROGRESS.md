# Modules 04–12 parity progress — 2026-10-17

Continuation of the evening M04 run. The acceptance standard is the owner rule recorded in
`UAT_2026-10-17_SECTION_NOTES.md`: instructor-visible attempt data and generated recommendations
must match the values and labels the student saw and saved. Never repair a mismatch by changing
only the sheet fixture or by hand-editing an attempt.

## Work completed in this continuation

- Reviewed the interrupted working-tree changes across shared case display, M03–M11 sheets,
  M04 console/guide and the related tests.
- Fixed an M04 parity omission: saved **Enrich indicator** IOC choices and **Preserve matching
  evidence** alert/event selections now travel in `work_summary` and appear on the instructor
  sheet. Regression fixture asserts the student-visible action labels and chosen values.
- Fixed an M09 display omission: the sheet now renders completed task author, completion note,
  and evidence, plus learner-added task author/title/status. Test fixture covers both task types.
- Fixed the M12 payload gap: `shiftChecklist` is snapshotted on submit; its new sheet section shows
  every checked/unchecked Practice It item, explicitly marked not scored. Older attempts say
  “Not recorded”.
- Revised the M05 generated interpretation note so it distinguishes missing malicious evidence
  from missing benign-updater interpretation, and names benign event IDs when the learner cited
  them; it no longer claims the learner never mentioned the updater based only on missing text.
- Updated stale assertions that expected old labels or generic wording instead of the current
  student UI values. Cache versions for every changed portal script are bumped in `portal/index.html`.
- Three read-only parity reviews found the above M04/M05/M09 gaps. No additional concrete gaps
  were found in M06, M07, M08, M10 or M11 by those reviews.

## Verification

- `node tests/admin-submission-sheet.test.js` — passed, 124 checks across 113 module cases.
- `node tests/m04-guided-console-prefix.test.js` — passed (F25/U21).
- `node tests/soc-m04-assessment-submit.test.js` — passed.
- `node tests/soc-m05-assessment-console.test.js` — passed.
- `node tests/m09-guided-preservation.test.js` — passed.
- `node tests/soc-m12-assessment-v3.test.js` and `node tests/soc-m12-console-integration.test.js` — passed.
- Full `bash bin/ci-check.sh` — passed after the final follow-up edits (module renders, route/navigation render, all CI suites, diff whitespace).
- Chrome is open, but this Codex session has no Chrome control tool or DevTools debugging endpoint (no debugging listener on localhost). Tabs were left untouched. Live learner/instructor comparison is therefore still pending; do not report the parity work as live-verified.

## Remaining

1. Perform M04 student/instructor sheet comparison in the existing Chrome windows when Chrome control is available. Check actual submitted values, rendered labels, and each generated recommendation beside the original student choices.
3. Branch `feat/per-section-teacher-notes` is pushed to origin and PR #72 targets `master`. It is not merged or deployed. Per repository policy, staging sync runs after merge to `master`; the `main` branch is an obsolete Codex snapshot and is not the deployment branch.
