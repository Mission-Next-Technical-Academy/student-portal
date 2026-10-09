# Capstone risks fix log (M12)

Scope: "Open capstone risks" and capstone risks 2, 4 and 6 from
`docs/workstreams/CAPSTONE_SKILL_BACKFILL.md`. Front end and UI untouched.
Cosmetic items (M09 checklist styling, M11 label) skipped.

## Risk 1: `alert-disposition` was dead code

Choice: retire the type and keep `review-alert` as the one alert determination
record. The M12 alerts tab (`recordContextual`) already writes `review-alert`
with `{ alertId, disposition, reason }`, and `review-alert` already sets
`dispositions[alertId]`, so every scored value came from one record. The
alternative (have the alerts handler also write `alert-disposition`) would have
double-written each call and changed the action history for no scoring gain.

Changes:
- `portal/soc-m12-assessment-state.js`: `alert-disposition` removed from
  `TYPES`, `reduce`, and `validate`. Replay still drops unknown types, so a
  persisted `alert-disposition` entry is skipped (none can exist: nothing wrote it).
- `portal/soc-m12-assessment-rubric.js`: removed `alert-disposition` from the
  evidence-id lists of the alert criterion (V1 and V2). Scoring logic is unchanged.
- `portal/soc-capstone-traceability.js`: `actionTypes` of the alert entry is now
  `['review-alert']` (the traceability test rejects unknown action types).

Existing `review-alert` records score exactly as before.

Not changed (outside the four-file scope): `portal/soc-analyst-module-12.js`
line 274 still checks `has('review-alert') || has('alert-disposition')`. The
second clause is now always false. Harmless; remove it in a later pass.

## Risk 2: load() re-saved on jsonb key reorder

`SocM12AssessmentState.load` now compares with a key-order-insensitive
`sameValue` (the same structural approach M11 uses in `soc-m11-assessment-state.js`).
M11's helper is not exported, so the function is copied into the M12 state file.
Keys whose value is `undefined` are ignored, because JSON round-trips drop them.

Test: `tests/soc-m12-capstone-risks.test.js` loads a key-reversed copy of a
saved state and asserts no `saveCaseState` call. A state that normalization
really changes still re-saves once.

## Risk 3 (item 6): partial or failed M09 result tripped the cap

Fixture check: the M12 console builds its embedded M09 pack without
`actionOutcomeExamples`, so `m09Outcome` (`soc-console-tools.js`) returns
`success` for every M12 response attempt. An execute in the M12 fixture
cannot come out partial or failed through the UI. A partial IS reachable
through the Recovery monitor step: ticking a residual-risk box reopens the
incident and records `monitor_recovery` with outcome `partial`, which the
bridge projects as a `recovery` action with `sourceOutcome: 'partial'`.
The execute path would be reached only by future fixture data or a direct
state write.

Change in `deriveEffect` (`portal/soc-m12-assessment-state.js`):
- A new `sourceResult(d)` maps the source outcome: absent or `success` to
  `success`; `partial` and `failure` are kept as they are; anything else to
  `blocked`.
- `execute`: approval and scope decide whether the attempt is permitted.
  Unpermitted attempts stay `blocked` with the same reason as before. Permitted
  attempts record `sourceResult`.
- `recovery`: prerequisites decide as before. When they are met, the source
  result is recorded. Previously any non-success source result became `blocked`.
- The generic override at the end of `deriveEffect` (which blocked every
  non-success source) is removed.

Effect: only unapproved or out-of-scope executions are unsafe. A partial or
failed result on an approved in-scope action is recorded as such. It earns no
credit (containment and recovery count only `success`), but it does not set
`unsafeExecution` and does not trigger the 69 cap. Replay re-derives stored
attempts, so an earlier partial that was stored as `blocked` now reads as
`partial`.

Tests (same file): partial and failure on approved in-scope actions are not
unsafe and get no cap; partial earns less containment credit than success;
unapproved and out-of-scope attempts stay blocked and unsafe with a partial
source; an unrecognised source result still blocks; replay re-derives a partial;
a reopened recovery monitor records `partial`.

## Verification

- `node --check` on the five M12 portal files: clean.
- `node --test tests/capstone-traceability.test.js`: 10/10.
- `node --test tests/soc-m12-capstone-risks.test.js`: pass.
- `node --test tests/`: 104 files, 100 pass, 4 fail. The failures are the
  pre-existing ones: guided-lab-console-guide, soc-m04-assessment-rubric,
  soc-m04-assessment-scorer, soc-m05-assessment-console.
- `bash bin/ci-check.sh`: exit 0.
- No servers or browsers started. `portal/index.html` cache-busters not edited.
