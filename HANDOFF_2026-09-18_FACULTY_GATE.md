# Handoff — Module 1 faculty gate (2026-09-18)

> **Execution precedence, 2026-09-20:** `ROADMAP.md` is the canonical active
> queue. Module 1's LMS orientation tour is required at the beginning of the
> module and the subsequent assessment is simulator-first. Follow this handoff
> for faculty-gate evidence/UAT only; its older coach-removal language must not
> be treated as authorization to remove the required orientation experience.

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
  `archive/session-logs/SESSION_DEBRIEF_2026-09-18.md` to mark it done.
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
5. **Done 2026-09-20:** "Message Instructor" is available in the student
   portal and faculty Inbox, and its shared persistent student-program and
   module banner action opens the same focused compose pane. Keep one
   shared thread/inbox system; do not create per-module messaging UIs. See
   Sprint E below for implementation evidence.
6. Remove the coach/tour walkthrough system and the redundant "Triage
   worksheet locked" card from Module 1 (see design decision below) — new,
   not started.

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

## Design decision — remove the coach/tour walkthrough system entirely (owner, 2026-09-18)

**Ask (owner, verbatim from chat, three separate messages).**
1. On the `m01-coach` card ("Your coach — First, verify what the alert is
   claiming... Did access succeed? Is the context expected? What does the
   user say?"): "this is not necessary...all those cards referencing coach
   is not necessary...that's what the soon to be messaging system to the
   teachers is for."
2. On the "Optional walkthrough · 10 minutes / Console walkthrough:
   investigate an alert" card: "this is also unnecessary....the student
   must go into the range...and yes it must run like a range...the student
   will be on day one of being on the job."
3. Clarifying question asked back (scope: just the one quoted card / all
   analytical-hint cards but keep mechanical tool orientation / the entire
   coach+tour engine) — **owner picked "the entire coach/tour system."**
4. On the "Triage worksheet locked — Record every fact correctly first. A
   wrong answer keeps the current fact open and the remaining timeline and
   worksheet locked" card: "that card is redundant."

**Decision.** Remove the entire coach/tour walkthrough engine from Module 1,
mechanical-orientation steps included, not just the analytical-hint
content. The student goes straight into the range/simulator cold, the way
a real analyst's first day works — no scripted step-by-step tour, no
spotlighted "click here" guidance, no narrated investigative reasoning.
Automated grading (unchanged), the Sprint C self-check pane, and the
Sprint E message-instructor feature are the support mechanisms now — not a
built-in tutorial.

**What that touches, confirmed by grep on 2026-09-18:**
- `portal/soc-analyst-module-01.js:698-705` — the `m01-coach` card ("Your
  coach...").
- `portal/soc-analyst-module-01.js:707-718` — the `m01-siem` "Optional
  walkthrough" card and its launch link (`?coach=m01`/`?coach=m01-setup`).
- `portal/soc-analyst-module-01.js:764-766` — the separate "Triage
  worksheet locked" banner, flagged redundant on its own (it duplicates the
  per-fact "Not recorded yet / Record the preceding fact to continue" state
  already shown in each locked timeline row just above it, lines 755-758).
  Remove this banner regardless of the coach removal.
- `ui/coach.js` (555 lines) and `ui/coach-data.js` (254 lines) — the whole
  walkthrough engine: step spotlighting, scope-lock, the corner-dock
  "Take the tour" button, `MODULE_COACHES` step data. Confirmed via grep
  this is currently wired to Module 1 only (`m01-setup`, `m01`,
  `m01-orientation` — no other module references `MODULE_COACHES`), so
  removal is contained; it does not need to be deprecated module-by-module
  elsewhere.
- `portal/app.js` / `ui/app.js` / `ui/views.js` / `ui/data.js` — smaller
  hooks into the coach engine (`coachAllowsRoute`, `coachAfterRender`,
  `mnt-coach-complete` postMessage listener at
  `portal/soc-analyst-module-01.js:1487`). All of this was added in the
  large `d0b751e` commit this same session — it is safe to fully remove,
  not just hide, since nothing else in the codebase depends on it existing.

**Load-bearing dependency to resolve carefully, not guess at:**
`moduleOneState.consoleCompleted` is currently set only by the coach's
completion postMessage (`coachComplete=m01` query param /
`mnt-coach-complete`, handled at `soc-analyst-module-01.js:167-176` and
`:1487-1511`), and it gates both the "Triage worksheet locked" section
(`!consoleComplete || !investigationReady`, line 764) and one of the
AND-ed conditions in `moduleOneProgress()`'s completion calculation (line
435), which also writes into the `module_progress.detail` beacon's
`consoleCompleted` field. Per `CLAUDE.md`: "Did not touch Module 1's
actual completion-crediting logic... that's real crediting behavior, not
display" — this sprint is the one that finally has to touch it, since its
only trigger is being deleted. The straightforward reading of "day one,
into the range cold" is that the worksheet should just be gated on
`investigationReady` alone (the real work: timeline facts recorded) with
no walkthrough-completion gate at all — but confirm this reading is
correct and doesn't accidentally make Module 1 completion easier to fake
or skip before shipping it; this is exactly the kind of completion-
crediting change `CLAUDE.md` says needs care.

**Explicitly out of scope:** Case 1's actual exercise (the timeline
fill-in-the-blanks + five-part decision worksheet — `moduleOneScorePanel()`
and the timeline list at lines ~730-762) stays. Only the coach/tour
scaffolding around it goes.

## Design decision — consolidated floating "Objectives" panel (owner
refinement, same session, 2026-09-18) — AMENDS Sprint C and Sprint G above

**Ask (owner, verbatim from chat).** "student must not NEED to click a
drop down for EVERY step of 'Take the tour' ... It'll be more like...
'Objectives' button that slides out and shows what the student must
complete... and the student can work on those tasks, and check or
uncheck them... that is why 'take the tour...submit module lab...and
coursework can live in a floating, movable box...and tasks...a new button
lives in there...where the student can record and keep track of
completed work...this is necessary for the student to keep track and to
come back to his or her work." Also, on the setup content specifically:
"all those steps you had before were great...but fundamental first steps
when setting up an initial workspace were not there."

**What this changes.** The problem was never the informational value of
the coach's content — the owner called the walkthrough steps "great." The
problem is the *delivery*: a linear wizard that forces one click-through
per step. Fix: don't just delete the corner-dock buttons per Sprint G's
original G4 — **consolidate** "Take the tour," "Submit Module Lab," and a
persistent completed-work tracker into **one floating, movable panel**,
titled something like "Objectives," that slides out on demand. Inside it:
a checklist of what the student must complete (self-check boxes, browsable
at the student's own pace, no forced step order), the existing submit
action, and a durable record of what's already been done that the student
can leave and come back to. This is the same floating self-check surface
already specified for Sprint C's `lab-soc-escalation` requirements list —
**do not build two separate floating panels.** Build one generalized
"Objectives" panel component and use it for both Case 1's setup/objectives
and Case 2's simulator requirements. It inherits Sprint C's hard
persistence requirement (cross-device/session via the `module_progress
.detail` beacon) automatically, since that's the same underlying state.

**Reconfirmed, not new:** items in this panel must never auto-complete
based on detection (echoed again by the owner quoting the exact
`MODULE_ONE_SIMULATOR_REQUIREMENTS` labels: "they SHOULD NOT auto
complete...in real life...they won't"). Self-check only, per Sprint C's
original design decision — this refinement does not change that.

**New, separate content gap flagged by the owner (not yet specified —
needs owner/faculty input before Sprint C builds off it):** the owner
flagged the `MODULE_ONE_SIMULATOR_REQUIREMENTS` list itself as
incomplete — "definitely missing items here" — for a realistic L1
escalation workflow, but did not enumerate which steps are missing. Do not
guess at additions; get the specific missing steps from the owner (or
whoever owns SOC-01 curriculum content) before finalizing what the
Objectives panel lists for Case 2.

**Open question raised by the owner, NOT yet a decision — flag for
explicit confirmation before building, do not implement on inference
alone:** should Module 1 / Day 1 start on an admin/workspace-setup view
instead of landing directly on the incidents/alerts queue — i.e., the
student first connects the required data source(s)/connector(s), which
then is what generates the alerts, rather than alerts simply existing on
load? Owner's own phrasing was exploratory ("focused realism...every time
should be admin panel? first thing should be setting up the workspace?
no? connecting the requested items? Which then generate the alerts?"),
not a settled instruction. This is a bigger change than the panel UI
question above — it changes where Module 1's Case 1 starts and how/when
alerts get seeded — so confirm it explicitly with the owner before any
sprint touches it.

## Sprint plan for remaining work

Execute in order. Each sprint gets its own coding subagent; the subagent
does the work, verifies it, updates this file's status inline (check off
what's done, note what changed), and stops rather than starting the next
sprint itself. Close each subagent out before opening the next one. This
mirrors the project's established per-sprint handoff convention
(`CLAUDE.md`'s doc-lifecycle rule) — do not batch sprints into one session.

- [ ] **Sprint A** — Faculty gate live-workflow verification (remaining-work
  item 1 above): submit → return for remediation → resubmit → approve →
  confirm Module 2 unlocks. **Remediation repair completed 2026-09-18:** an
  open redo for `lab-soc-escalation` now clears only the saved client-side
  `simulatorPerformance.submitted` latch, preserving action evidence and the
  append-only prior attempt so a new submission can enter the normal faculty
  queue. The current session clears its redo banner only after the new
  attempt saves successfully; approval remains required by the authoritative
  verified-progress view. Local transition and portal checks passed. Live UAT
  on `9334491415-SOCAN` remains unrun: this session has no authorized student
  and faculty credentials or usable linked Supabase container, so no UAT data
  was changed. Run the full controlled workflow before checking this sprint
  off.
- [x] **Sprint B** — Diff review + commit (remaining-work item 2). Completed
  2026-09-18 after owner-directed release sync: full review/check pass,
  commit `d0b751e`, pushed to `origin/master`.
- [ ] **Sprint C** — Consolidated floating "Objectives" panel (remaining-work
  item 3, superseded/amended by the consolidated-panel design decision
  above — read that section before starting, it changes the shape of this
  sprint from the original self-check-pane-only plan):
  - [ ] C0. Get the specific missing steps for `MODULE_ONE_SIMULATOR_
    REQUIREMENTS` from the owner/curriculum owner before building Case 2's
    list — the owner flagged it incomplete but didn't enumerate what's
    missing. Do not invent additions.
  - [ ] C1. Add `simulatorSelfCheck` (Case 2) and an equivalent Case 1
    objectives-checked field to the `detail` beacon shape in
    `moduleOneSyncDetailBeacon()`; load any existing remote value back into
    `moduleOneState` on `moduleOneLoad()`.
  - [ ] C2. Build ONE floating/draggable "Objectives" panel component in
    `soc-analyst-module-01.js` — not two separate panels. It replaces the
    corner-dock's "Take the tour"/"Submit Module Lab" buttons (see Sprint G)
    and shows self-check boxes for whichever case's objectives apply (Case
    1 setup/objectives or Case 2's `MODULE_ONE_SIMULATOR_REQUIREMENTS`),
    plus a durable "completed work" view the student can reopen anytime.
    State read from/written to `moduleOneState`/the beacon. No green/red
    styling tied to correctness anywhere in this panel.
  - [ ] C2a. Owner's added spec (verbatim, 2026-09-18): the panel's task
    state "is also reflecting in the coursework section in that card" —
    i.e. whatever module-progress summary the student sees in the main
    coursework/module list elsewhere in the portal must show the same
    completion state as the Objectives panel, not a separate/out-of-sync
    count. Both "persist on backend saves," same as SIEM actions already
    do (`recordLabAttempt`/the `detail` beacon) — this is the same
    persisted state surfaced in two places, not two states to keep in
    sync by hand. Locate the actual student-facing coursework/module-list
    card during this sprint (not yet pinned down in this handoff) and
    read from the same source of truth as the panel.
  - [ ] C2b. Delete the "Independent simulated-SIEM case · resume across
    sittings" kicker line (`portal/soc-analyst-module-01.js:812`) — owner
    flagged it as unnecessary copy, 2026-09-18. Trivial, do first.
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
- [x] **Sprint E** — "Message instructor" feature (remaining-work item 5, the
  design decision above). Completed 2026-09-18: deployed
  `20260918110000_student_messages.sql` (linked migration parity confirmed),
  added the student portal compose/thread view, and added a per-track faculty
  Inbox tab with replies and unread tile badges. `node --check portal/app.js`,
  `node bin/portal-check.js`, and `git diff --check` passed. The Supabase CLI
  emitted a non-blocking local pg-delta certificate-cache warning after the
  successful push; `supabase migration list --linked` confirms it is remote.
  - [x] E1. Migration: new `student_messages` table (or equivalent name),
    RLS matching the established student-own / faculty-track-scoped
    pattern already used elsewhere in this project — check existing
    policies before writing new ones from scratch.
  - [x] E2. Student UI: compose ("Message instructor") + thread/inbox view
    of own messages and replies.
  - [x] E3. Faculty UI: unread badge next to the existing per-track "N Labs
    need grading" badge (`portal/app.js`, `trackTile()`/
    `adminTrackAdministration()`), plus an inbox/reply view.
  - [x] E4. Regression pass: `node --check`, `node bin/portal-check.js`.
  - [x] E5. Universal banner access: persistent student-program and module
    banners include a **Message Instructor** action. Both open the same focused
    compose pane, so every course and module uses one student/instructor thread.
  This sprint is independent of Sprints A-D (different feature area, no
  shared code) — a future session may pull it forward instead of doing it
  strictly last, at that session's discretion.
- [ ] **Sprint G** — Remove the coach/tour walkthrough system (remaining-
  work item 6, the design decision above):
  - [ ] G1. Delete the `m01-coach` card and the `m01-siem` "Optional
    walkthrough" card + launch link
    (`portal/soc-analyst-module-01.js:698-718`).
  - [ ] G2. Delete the redundant "Triage worksheet locked" banner
    (`portal/soc-analyst-module-01.js:764-766`) — do this even if G1 is
    somehow deferred, it's a separate, independent fix.
  - [ ] G3. Resolve the `consoleCompleted` dependency exactly as described
    in the design decision above (read that section again before touching
    `moduleOneProgress()` or the `detail` beacon — this is completion-
    crediting logic, not display).
  - [ ] G4. Remove `ui/coach.js`'s step-by-step wizard engine (spotlighting,
    scope-lock, the linear per-step "Next" flow) and `ui/coach-data.js`'s
    step scripts, and their hooks in `ui/app.js`/`ui/views.js`/`ui/data.js`
    (`coachAllowsRoute`, `coachAfterRender`, the
    `mnt-coach-complete` postMessage listener at
    `soc-analyst-module-01.js:1487-1511`). **Amended by the consolidated-
    panel design decision above: do NOT just delete the corner-dock's
    "Take the tour" and "Submit Module Lab" buttons — they get replaced by
    Sprint C's single "Objectives" panel, not removed outright.** Confirm
    nothing else references `MODULE_COACHES`/`startModuleCoach`/
    `stopModuleCoach` before deleting the wizard engine itself.
  - [ ] G5. Regression pass: `node --check`, `node bin/portal-check.js`,
    and a manual run through Module 1 confirming Case 1's actual worksheet
    (timeline + five-part decision) still works end to end with no wizard
    entry point (replaced by the Objectives panel), and that `soc-01`
    completion crediting still requires everything it required before
    (minus the deleted walkthrough-completion gate).
  This sprint touches the same file as Sprint C (`soc-analyst-module-01.js`)
  and now shares a single UI component with it (the Objectives panel) —
  build Sprint C's panel first, then have Sprint G wire the setup-step
  removal into that same panel rather than parallel agents fighting over
  one file.

## UNVERIFIED — added by the Sprint A agent without authorization, not from
## any owner decision in chat; flagged 2026-09-18, pending owner call on
## whether to keep or delete

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
