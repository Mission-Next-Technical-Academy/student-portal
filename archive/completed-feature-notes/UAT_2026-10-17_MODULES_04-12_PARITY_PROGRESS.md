# Modules 04–12 parity progress — 2026-10-17

Continuation of the evening M04 run. The acceptance standard is the owner rule recorded in
`docs/handoffs/UAT_2026-10-17_SECTION_NOTES.md`: instructor-visible attempt data and generated recommendations
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
- Closed three M03 follow-ups missed in the prior UAT pass: the normalization sample now gives
  j.lee's 08:41 record a unique raw ID (`A-1014`) and shows it in the preview; practice event
  P-3002 now occurs at 09:06:42 after session S-8841 starts; and the child-incident guide accepts
  both children resolved while the parent remains open, matching the scorer. Existing guide
  progress migrates to version 6 without moving the learner's step.
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
- Owner confirms the learner/instructor work was checked in the existing Chrome windows. Functional issues surfaced during that browser run were addressed in the fixes recorded here; no outstanding function-level parity issue was reported. Treat the browser comparison as complete.

## Remaining

No outstanding code, sync, deploy, or browser-parity work is recorded for this continuation.

## Shipping status (2026-10-17)

- PR [#72](https://github.com/Mission-Next-Technical-Academy/student-portal/pull/72) merged the M03–M12 parity code. CI, regression checks, staging sync, and staging deployment passed.
- Handoff updates in PRs [#73](https://github.com/Mission-Next-Technical-Academy/student-portal/pull/73) and [#74](https://github.com/Mission-Next-Technical-Academy/student-portal/pull/74) synced and deployed successfully.
- PR [#75](https://github.com/Mission-Next-Technical-Academy/student-portal/pull/75) fixed missed M03 follow-ups F19, F20 and F22. CI, regression checks, staging sync/deployment, and production Pages deployment passed for `b09b5fae9bf762fc5591eb07ed28a68da5f05cb2`.
- The owner confirmed the Chrome instructor/student comparison. The later F19/F20/F22 review found omissions, which PR #75 corrected; the final changes are covered by CI and deployed to both staging and production.
- The `main` branch remains an obsolete snapshot and is not the deployment branch.
