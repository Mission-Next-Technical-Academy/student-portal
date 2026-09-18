# Handoff — Module 1 faculty gate (2026-09-18)

## Completed this session

- Applied `20260918100000_module_one_faculty_performance_gate.sql` to the
  linked Supabase project. `supabase migration list --linked` confirms the
  migration is recorded remotely.
- Verified the deployed `student_verified_module_progress` view now requires
  for `soc-01`: a passing attempt, no critical errors, faculty reviewer and
  timestamp, `redo_requested = false`, and simulator action evidence for
  `lab-soc-escalation`.
- Verified the deployed reconciliation trigger also fires when `reviewed_at`
  or `reviewed_by` changes.
- Completed the orientation-tour wording polish and updated
  `SESSION_DEBRIEF_2026-09-18.md` to mark it done.
- Removed the obsolete Module 1 Lab 2 worksheet/form code. Simulator
  performance is now the only Lab 2 submission path.
- Ran `node --check` on touched scripts, `git diff --check`, and
  `node bin/portal-check.js`; all passed.

## Current verification state

- A read-only database check confirmed `9334491415-SOCAN` has
  `soc-01 = false` under the deployed verified-progress view. No simulator
  submission was made during this session.
- Browser testing was intentionally stopped before attempting a faculty
  approval/remediation workflow. Do not infer end-to-end approval validation
  from the schema deployment alone.

## Remaining work

1. Run one concise live workflow: a controlled student simulator submission,
   faculty **Return for remediation**, resubmission, faculty **Approve
   submission**, then confirm Module 2 changes from locked to available.
   This was deliberately paused before it wrote any UAT data on 2026-09-18;
   it remains required before calling the faculty gate end-to-end verified.
2. Review the full uncommitted diff before committing. **Done 2026-09-18:**
   reviewed the complete release unit, confirmed `git diff --check`, targeted
   `node --check`, `node bin/portal-check.js`, and linked migration parity;
   committed as `d0b751e` (`Ship Module 1 SIEM performance assessment`) and
   pushed `master` at the owner's direction. The worktree was clean after
   push. Pages deployment was in progress when recorded.
3. Self-check pane redesign (see design decision below) — new, not started.
4. `module-completion-integrity/BRIEF.md` remains queued and unstarted; do not
   begin it until items 1-3 above are verified.
5. "Message instructor" feature (see design decision below) — new, not
   started. Confirmed via repo-wide search on 2026-09-18: no student-to-
   instructor messaging of any kind exists yet (no `messages` table in
   `supabase/migrations/`, no message/inbox/compose UI in `portal/app.js` or
   any `soc-analyst-module-*.js`), and it was not previously written into
   this or any other handoff doc.

## Design decision — self-check pane replaces live-graded checklist (owner, 2026-09-18)

**Problem.** `moduleOneSimulatorSubmissionPanel()`
(`portal/soc-analyst-module-01.js:481-490`) renders the
`MODULE_ONE_SIMULATOR_REQUIREMENTS` list with a live green
`ri-checkbox-circle-fill` icon and `.is-done` class the instant
`moduleOneSimulatorPerformance()` (same file, lines 466-479) detects the
matching simulator action. That is a real-time "you did this correctly"
signal to the student mid-attempt. Owner's framing: a real SOC job has no
green light confirming you triaged the alert correctly — this UI is
unrealistic and leaks the answer key before submission.

**Decision (owner, verbatim from chat).** Remove the live auto-graded green
indicator from the student-facing view. Replace it with a self-check list
the student manually checks off by hand ("the student can check the box if
he or she has determined if he or she completed it"), with no live
correct/incorrect signal — the student does not get told whether they got
it right. Present it as a floating, movable pane in the lab console (not a
fixed block in the page flow).

The automated grading is unchanged and keeps running silently in the
background exactly as today: `moduleOneSimulatorPerformance()`'s action
detection, `MODULE_ONE_SIMULATOR_REQUIREMENTS` matching, `competencies`, and
`score` all stay as the authoritative record sent to faculty. The
"Complete Module — submit to faculty" button must keep gating on
`performance.missed_actions.length` (the real detection), never on the
student's self-check state — self-check is a student attestation only, and
is never authoritative for grading or for unlocking submission.

Faculty already have per-item written feedback input fields in the grading
queue (`adminGradingQueuePanel()`, `portal/app.js:974-979`, "What was wrong"
+ "Why it was wrong, and what to do to make it better") plus **Approve
submission** / **Return for remediation** actions. That mechanism already
does what the owner described ("the teacher fill[s] out feedback in those
input fields for each section... the automated grading system in the
background covers this") — it is correct as-is and is **not** part of this
sprint; do not touch `adminGradingQueuePanel()`.

**Persistence — hard requirement (owner's words).** The self-check state
"must perpetually save across ANY device, in ANY session no matter what."
Do not store it only in `LabRuntime`/browser-local state (that was exactly
the bug `20260916050000_module_one_detail_beacon.sql` was written to fix
for the rest of Module 1). Extend the existing `module_progress.detail`
JSONB beacon with a new key, e.g. `simulatorSelfCheck: { [action]: boolean
}`, synced from `moduleOneSyncDetailBeacon()`
(`portal/soc-analyst-module-01.js:182-210`) using the same ratchet-forward
pattern already used there for `quizPassed` / `consoleCompleted` /
`lab2Completed` / `lessonsComplete` (OR against `moduleOneUser
.remoteModuleDetail`, a field only ever moves false to true, never
overwritten). No new migration should be needed — `detail` is already a
free-form JSONB column; adding a key is a code-only change plus a comment
update on the column.

**Explicitly out of scope for this sprint:** the automated grading
algorithm, the faculty grading queue UI/inputs, and the pass/fail threshold
logic. Do not touch any of those.

## Design decision — "Message instructor" (owner, 2026-09-18)

**Ask (owner, verbatim from chat).** Add a "message instructor" option for
students, and a cue for the instructor when one arrives. The UI can read
like an email/inbox (subject + body + thread), but it is a direct message
*inside this system* — not real email, no external mail delivery. Repo-wide
search confirmed this doesn't exist anywhere yet (no `messages`-style table
in `supabase/migrations/`, no compose/inbox UI in `portal/app.js` or any
module file), so this is new build, not a fix.

**Shape.**
- New table, e.g. `student_messages`: `id`, `student_id`, `track_code`,
  `subject`, `body`, `sender_role` (`student`/`faculty`), `created_at`,
  `read_at` (nullable), and optionally `context` (jsonb — e.g. `{module_key,
  lab_key}` when the student composes from inside a specific module/lab, so
  the instructor sees what the student was looking at, but this is
  optional context, not a required field).
- RLS: a student can insert/select only their own rows (`student_id =
  auth.uid()`-equivalent per however this project's existing student RLS
  pattern authenticates — check `module_progress_own` policy in migrations
  for the established pattern before inventing a new one). Faculty/admin
  read scoped the same way the grading queue already is — **by that
  student's track workspace**, matching the existing "N Labs need grading"
  per-course-workspace scoping described in `CLAUDE.md` /
  `lab-grading-notification-system/STATE.md`. Reuse that scoping decision
  rather than re-deriving it.
- Student-facing UI: a simple "Message instructor" entry point (a compose
  form: subject + body, submit) plus a thread/inbox view of their own past
  messages and any instructor replies. Keep this to plain text — no rich
  formatting, no attachments, matching this portal's existing plain-form
  conventions elsewhere (e.g. the grading feedback inputs).
- Faculty-facing cue: an unread-message badge/count, following the same
  visual and scoping pattern as the existing per-track "N Labs need
  grading" badge (`gradingCountsByTrack` in `portal/app.js` —
  `adminTrackAdministration()`/`trackTile()` around lines 881-896 render
  that badge today; add an analogous unread-messages badge next to it, not
  a separate new notification system). A faculty inbox/reply view alongside
  the existing grading queue.

**Explicitly out of scope:** real email/SMTP delivery, push notifications,
read receipts beyond a simple `read_at` timestamp, and any change to the
grading queue's own feedback-input mechanism — messaging is a separate
channel from graded feedback, not a replacement for it.

## Sprint plan for remaining work

Execute in order. Each sprint gets its own coding subagent; the subagent
does the work, verifies it, updates this file's status inline (check off
what's done, note what changed), and stops rather than starting the next
sprint itself. Close each subagent out before opening the next one. This
mirrors the project's established per-sprint handoff convention
(`CLAUDE.md`'s doc-lifecycle rule) — do not batch sprints into one session.

- [ ] **Sprint A** — Faculty gate live-workflow verification (remaining-work
  item 1 above): submit → return for remediation → resubmit → approve →
  confirm Module 2 unlocks. Manual testing, no code changes expected. Paused
  before submission on 2026-09-18; no UAT workflow state was changed.
- [x] **Sprint B** — Diff review + commit (remaining-work item 2). Completed
  2026-09-18 after owner-directed release sync: full review/check pass,
  commit `d0b751e`, pushed to `origin/master`.
- [ ] **Sprint C** — Self-check pane build (remaining-work item 3, the design
  decision above):
  - [ ] C1. Add `simulatorSelfCheck` to the `detail` beacon shape in
    `moduleOneSyncDetailBeacon()`; load any existing remote value back into
    `moduleOneState` on `moduleOneLoad()`.
  - [ ] C2. Build the floating/draggable pane in
    `soc-analyst-module-01.js` (reuse the existing floating "Submit Module
    Lab" button's follow-anywhere pattern for positioning): one checkbox per
    `MODULE_ONE_SIMULATOR_REQUIREMENTS` label, state read from/written to
    `moduleOneState`/the beacon, no green/red styling tied to correctness.
  - [ ] C3. Remove the `.is-done` / `ri-checkbox-circle-fill` live-graded
    rendering from `moduleOneSimulatorSubmissionPanel()`. Confirm the
    submit button's `disabled` logic still reads `performance.missed_
    actions.length`, unchanged.
  - [ ] C4. Cross-device check: set self-check state as one session/device,
    confirm it reads back correctly from a second session for the same
    student (direct DB read is sufficient if a second browser session isn't
    practical).
  - [ ] C5. Regression pass: `node --check`, `node bin/portal-check.js`,
    and a manual run through Module 1's lab confirming simulator
    scoring/competency panel/faculty queue are all still unchanged.
- [ ] **Sprint D** — `module-completion-integrity/BRIEF.md` (remaining-work
  item 4). Only after Sprints A-C are done and verified.
- [ ] **Sprint E** — "Message instructor" feature (remaining-work item 5, the
  design decision above):
  - [ ] E1. Migration: new `student_messages` table (or equivalent name),
    RLS matching the established student-own / faculty-track-scoped
    pattern already used elsewhere in this project — check existing
    policies before writing new ones from scratch.
  - [ ] E2. Student UI: compose ("Message instructor") + thread/inbox view
    of own messages and replies.
  - [ ] E3. Faculty UI: unread badge next to the existing per-track "N Labs
    need grading" badge (`portal/app.js`, `trackTile()`/
    `adminTrackAdministration()`), plus an inbox/reply view.
  - [ ] E4. Regression pass: `node --check`, `node bin/portal-check.js`.
  This sprint is independent of Sprints A-D (different feature area, no
  shared code) — a future session may pull it forward instead of doing it
  strictly last, at that session's discretion.
- [ ] **Sprint F** — Microsoft wording review and resolution. Start only
  after the critical Sprints A, C, D, and E are complete and verified. Audit
  student-facing simulator and portal wording for unnecessary Microsoft
  product/brand phrasing, distinguish accurate contextual references from
  wording that should be made platform-neutral or Mission Next-specific, and
  update approved copy without introducing copied proprietary text. Preserve
  required attribution/disclaimer language and the existing no-proprietary-
  code rule. Document the final wording decisions and run the normal portal
  regression checks.

When every sprint above is checked off and verified, `git mv` this file into
`archive/` per `CLAUDE.md`'s "When to archive a doc" rule.

## Important worktree note

The worktree contains the combined 2026-09-18 Module 1 reading/nav/SIEM/tour
work plus the faculty-gate implementation. Preserve unrelated existing edits.
