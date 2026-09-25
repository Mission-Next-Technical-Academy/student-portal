# STATE — Lab Grading & Notification System (read this first, in this directory)

**Last updated:** 2026-09-23.
**Status: code written, NOT yet pushed.** A new migration
(`20260923100000_module_progress_admin_override.sql`) plus `portal/app.js`
and `portal/soc-analyst-module-01.js` changes fix the root cause of the
"admin shows ~92-94% complete, student sees the course reset to the
beginning" report on `4437023872-SOCAN` — see "2026-09-23" below. Needs the
owner to `supabase db push` before it does anything live. Everything from
2026-09-13/16 below this is still DONE and unaffected.

**2026-09-23 — admin completion override (root-cause fix, not yet pushed):**
Diagnosed and fixed why `4437023872-SOCAN` (and the same shape of bug for
any account) can show ~92% done in the admin roster while the student
experience looks like it never started. Full root cause, the fix, and the
handoff steps the owner needs to run are in this directory's normal place —
see the bottom of the Sprint log for the entry, and the migration file's own
header comment for the exact mechanism. Short version: `hasModuleAccess()`'s
2026-09-16 sequential gate means ONE unverified module locks all 12 for that
student, and Module 1's verification formula has been tightened three times
since (20260916/20260917 x2/20260918) — a training account whose Module 1
completion was backfilled before those tightenings silently fell out of
compliance and, because of the sequential gate, took the whole course down
with it. Fixed with a durable, formula-independent `module_progress.admin_override`
column + `admin_set_module_override()` RPC, wired into a new "Mark complete
(override)" button per module row in the admin student-detail panel — this
is the "foolproof, once and for all" mechanism the owner asked for: an
admin override now reads complete everywhere (nav rail, module cards,
sequential gating, admin roster) and can never be invalidated by a future
change to the assessment formula, unlike the old approach of backfilling
detail flags or a synthetic lab_attempts row to imitate real completion.
Also fixed a second, related desync: Module 1's knowledge-check quiz body
rendered as a blank, freshly-shuffled "0/5 answered" form even when the nav
rail already said the module was complete (evidence flags true, but no real
local answers) — now shows a "Already verified complete" summary with a
"Retake this knowledge check" option instead of silently contradicting the
nav rail.

**Old status below (2026-09-16), still accurate for everything it covers:**
now extended with real sequential module-access gating on
top of the same completion model. Migrations
`20260913120000_lab_grading_review.sql` and
`20260916050000_module_one_detail_beacon.sql` are both pushed and live.

**2026-09-16 additions (owner directive: "maintain the integrity of the
syllabus the most"):**
- `hasModuleAccess()` now requires **every** lower-numbered module in the
  same program to be `moduleCompletion(...).complete` — not just the
  immediately preceding one. First shipped as "check only the immediate
  predecessor," but live testing against a real training account found
  that insufficient: a later module's completion can independently read
  true from historical engagement data even while an earlier module is
  redo-locked, so a one-hop check let students skip past a genuinely
  incomplete/redo-open module. Fixed to check the full chain
  (`portal/app.js`, `hasModuleAccess`).
- Module 1 specifically needed a companion fix: its detailed completion
  (quiz passed, console completed, lab 2 completed, lessons complete) had
  only ever lived in browser-local storage, never synced server-side —
  harmless while it only drove a badge color, but a real lockout once
  access is gated on it (a student finishing on one device/browser would
  show incomplete on any other). Added a lightweight `module_progress.detail`
  jsonb beacon, written only at the 4 real completion transitions (deduped,
  never per-keystroke) from `moduleOneSave()`'s single choke point.
  `moduleCompletion()`'s Module 1 branch now trusts local storage OR this
  beacon per field.
- A module with an open redo now gets its own red "Redo Requested" status
  pill (`STATE_STYLES.needs_redo` in `moduleCard()`), not just the existing
  inline banner — the top-level status reads correctly at a glance.
- **Data cleanup, one account fixed live:** training account
  `8987495051-SOCAN` had real historical Module 1 completion (its
  `module_progress.state` was already `'complete'`, written before the
  beacon existed) but an empty `detail` blob, which the new gate read as
  incomplete and would have locked the whole chain behind it. Backfilled
  its `detail` beacon via the app's own `upsertModuleProgress()`, signed in
  as that account — not a raw DB edit, the same trusted write path any
  real completion uses. Verified live: chain now correctly resolves to
  "Module 1 complete, Module 2 redo-locked, Modules 3-12 correctly locked
  behind it" — accurate, not a fabricated all-green state.
- **Not done — permission-blocked, needs the owner or a re-run with
  elevated permission:** the other three SOCAN training accounts
  (`4437023872-SOCAN`, `9334491415-SOCAN`, `5520852787-SOCAN`) were
  confirmed to have the exact same gap (`module_progress` shows `soc-01`
  already `state: 'complete'`, `detail: {}`) via an admin-session read, but
  the batch backfill write (as admin, across other users' rows) was
  blocked by the harness's auto-mode classifier ("Modify Shared
  Resources") given the larger blast radius of a cross-account admin
  write. Needs either explicit permission granted for that action, or the
  owner running the equivalent upsert directly. The exact rows/values
  needed are in this entry's git history / the session transcript.

**2026-09-20 addition:** asked to enroll `7634107909-SOCAN` (via the admin
Enrollment Planning table). Checked live and it was already **Enrolled**
(since 9/20/2026) — no action taken, nothing was toggled. While there,
noticed `5520852787-SOCAN` — one of the three accounts still flagged above
as needing the Module 1 beacon backfill — now shows **Disenrolled since
9/17/2026**. This is the same pattern already seen once with
`8987495051-SOCAN` (see `[[mnt-grading-notification-project]]` memory,
2026-09-16 entry: disenrolled same day it was fixed, cause never
confirmed, ruled out the `cohort_archival_engine` cron that time). Not
investigated further this session — flagged for the owner. Worth checking
whether some admin flow (or a concurrent session) is toggling
`is_enrolled` on these specific training accounts as a side effect of
something else.

Active work has moved to the sibling project,
`../soc-analyst-track-reimagining/` — read that directory's `STATE.md`
next.

## Read in this order
1. `INITIAL_BRIEF.md` — the CEO requirement, as given, verbatim-structured.
2. `00_SCAN_AND_GAP_COMPARISON.md` — what already existed vs. the gap, before
   this sprint's build (still accurate as a before/after reference).
3. This file's "Sprint log" for what actually shipped.

## The 3 blocking decisions — resolved by the owner, 2026-09-13
1. **Redo granularity: whole-lab-attempt resubmission**, not per-parameter.
   Owner's words: "we need a resubmission of the lab attempt." Built this
   way — `redo_requested` is a flag on the attempt row, not a per-field
   structure.
2. **Feedback storage: instructor-authored, per flagged item, free text** —
   not derived from a rigid per-parameter schema. Owner's framing: the
   system's own result is a general *overview* (pass/fail per criterion,
   fine to automate/instant), never a specific task list; the *specific*
   corrective guidance is always handwritten by the instructor, at their
   discretion. `lab_attempt_feedback` (one row per item: `item_label` +
   `comment`) matches this directly.
3. **Notification scope: global to all admins for v1** (no per-instructor/
   cohort assignment system exists in this codebase yet to scope it
   further) — not explicitly re-confirmed by the owner, kept as the
   pragmatic default; revisit if multi-instructor scoping is ever needed.

## What's built (Sprint 1 — admin panel core)
- **Migration** `supabase/migrations/20260913120000_lab_grading_review.sql`:
  adds `reviewed_at`/`reviewed_by`/`redo_requested` to `lab_attempts`, a new
  `lab_attempt_feedback` table (append-only, one row per flagged item, RLS:
  admin write, student read-own), an admin-update RLS policy on
  `lab_attempts`, and the `admin_grading_queue` view (pregraded, unreviewed
  attempts — `state='complete' and reviewed_at is null`).
  **Verified** inside a rolled-back transaction against the linked project
  (`supabase db query --linked --file <wrapped in BEGIN/ROLLBACK>`) —
  applies cleanly, no errors. **Not pushed.**
- **`portal/app.js`**: new "Grading" admin tab (eager-loaded, not lazy —
  the badge must be visible before any tab is opened), listing every
  pregraded, unreviewed lab attempt with its auto-scored result (raw JSON,
  collapsible), a dynamic add-as-many feedback-item UI (label + comment per
  wrong thing), and two actions: **Approve** (marks reviewed, no redo) and
  **Send back for redo** (requires at least one feedback item, writes it,
  sets `redo_requested = true`). Course-card tile (`adminTrackAdministrationStrip`/
  `tile()`) now renders a red "N labs need grading" badge per track when its
  pending count is above zero — the layout grew from single-line to a
  two-row card only when there's something to show, addressing the "cards
  are too small" observation directly.
  **Verified:** `node --check portal/app.js` clean; `node bin/portal-check.js`
  passes with no new failures.
- **Not built this sprint, deliberately:** the student-facing side of a
  redo (seeing the instructor's feedback, actually resubmitting the lab) —
  admin panel core was the explicit scope ("it starts with that"). See
  "Next sprint" below.

## What's built (Sprint 2 — student-facing redo)
- **`buildUserFromSession()`** (`portal/app.js`): after sign-in, fetches the
  student's own `lab_attempts` and reduces to the single most-recent attempt
  per `lab_key` — if that latest attempt has `redo_requested = true`, it's
  still open (a resubmission is a new, later row via `recordLabAttempt()`,
  which never upserts, so it naturally becomes "latest" and clears the
  banner with no separate acknowledgment step). Attaches
  `user.openLabRedosByModuleKey` (keyed by module, via `LABS`'s `module`
  field) with the lab title and every `lab_attempt_feedback` item.
- **`moduleCard()`** (the module tile on the program overview page — one
  shared function, so this required zero edits to any of the 12 per-module
  SOC/IT-support/AI-ML files): renders a red "Redo requested: <lab title>"
  banner with the instructor's per-item feedback as a bullet list, right on
  the specific module's card — same "notification on the specific card"
  pattern as the admin side.
- **Known limitation, not fixed this sprint:** `moduleCompletion()` (drives
  the green "Complete" badge) does not check `redo_requested` or the 70%
  `pass_threshold` at all — a module whose only lab attempt was sent back
  for redo can still show green/"Complete" alongside the new red banner.
  Wiring the 70% gate into actual completion status (and what that does to
  the hour-credit/compliance-snapshot pipeline this repo treats very
  carefully — see `20260901103000_completion_integrity_guards.sql`) is a
  separate, bigger decision, deliberately not made here.
- **Verified:** `node --check portal/app.js` clean. `bin/portal-check.js`
  required a real fix, not just a re-run — its Supabase stub didn't support
  `.not()`/`.in()`/`.order()`/`.limit()` chaining (only `.eq()` existed),
  which this sprint's queries use; added generic pass-through no-ops for
  all four (all standard supabase-js v2 methods already used elsewhere in
  this file, e.g. `.not()` at the cohorts fetch) and confirmed 38/38 module
  and program-overview renders pass clean.

**Live browser verification, 2026-09-13 (same session), full round trip —
real production data, real training account:**
1. Signed in as `7355312413-ADMIN` at `127.0.0.1:8768/#/admin` — the SOC
   Analyst course card showed a real **"38 labs need grading"** badge, and
   the Grading tab badge matched (38).
2. Opened the Grading tab: real pregraded attempts listed, e.g.
   `8987495051-SOCAN` · "Suspicious Authentication Investigation" · 75% /
   70% to pass.
3. Added one feedback item ("Missed IOC: risky sign-in from atypical
   location" + full guidance text) and clicked **Send back for redo**. The
   card vanished from the queue immediately and the badge dropped 38 → 37,
   live, no refresh needed.
4. Confirmed directly against the linked database: `lab_attempts.reviewed_at`/
   `redo_requested` and the new `lab_attempt_feedback` row both wrote
   correctly with the exact text entered.
5. Signed out, signed back in as the student (`8987495051-SOCAN`), opened
   the SOC Analyst program page: **Module 02's card showed the red "Redo
   requested: Suspicious Authentication Investigation" banner with the
   exact feedback item, bullet-listed**, exactly as designed.
6. Also visibly confirmed the known limitation below live: Module 02 still
   showed a green "Complete" badge right next to the redo banner.

This was a real write against a real student record — deliberately using
`8987495051-SOCAN`, one of this project's existing rotatable training/UAT
accounts (same one used for prior live UAT passes per `docs/handoffs/NEXT_SESSION.md`),
not a real enrolled student. **That account's module 02 now genuinely shows
an open redo** until someone (a real instructor, or a follow-up session)
either resubmits that lab as that student or clears it — this was left in
place rather than reverted, since it's a realistic, useful demo state, not
accidental damage. Say the word if it should be cleared instead.

## Card readability fix (2026-09-13, same session, owner feedback)
Owner looked at the live cards and flagged that every Track Administration
tile repeated the literal word "ADMINISTRATION" as an eyebrow label —
redundant (the section header already says "Track Administration" once)
and it was stealing the vertical room the real course name needed, which is
why names were truncating ("ADMINISTR...", "SOC Anal..."). Removed the
eyebrow line entirely from `tile()`/`adminTrackAdministrationStrip()`, made
the course name the only label (wraps to a second line instead of
truncating if needed), and loosened the grid from a flat `grid-cols-3
md:grid-cols-6` to `grid-cols-2 md:grid-cols-3 lg:grid-cols-6` so each card
gets more width at in-between sizes. Verified live: cards now read "All
Students," "SOC Analyst," "IT Help Desk," "AI/ML Engineering" — full words,
no truncation — with the "37 labs need grading" badge (one down from 38,
confirming the earlier redo write persisted) sitting cleanly under the SOC
Analyst name. `node --check` clean, `bin/portal-check.js` still 38/38.

## Grading scoped to each course workspace (2026-09-13, same session, owner feedback)
Owner asked, after opening the SOC Analyst card: "where are the labs for
grading?" and then clarified directly — "grading must only exist inside of
each course... separated for each instructor." The Grading tab had been
showing on **both** the cross-track "All Students" view and every
track-specific workspace, listing every track's pending items mixed
together regardless of which one you were in — wrong per this framing (an
instructor scoped to one course should only ever see that course's queue).

**Fixed:** the Grading tab button and panel now render only inside a
specific track workspace (`#/admin/track/<CODE>`) — gone entirely from "All
Students." Its rows are filtered to `row.track_code === activeTrackCode`
(new `trackGradingQueueRows`, viewAdmin). Also guarded: if the admin
navigates back to "All Students" while the Grading tab was selected, the
active-tab state now falls back to Student Progress instead of pointing at
a tab that no longer exists in that view. The per-card "N labs need
grading" badge stays visible from "All Students" too — that's the
notification the whole feature is built around — but the actual grading
workspace only opens once you're inside that course.

**Verified live:** "All Students" no longer shows a Grading tab at all.
Clicking into the SOC Analyst card shows "Grading 37" in its tab bar, and
opening it lists only SOCAN attempts. `node --check` clean, `bin/portal-check.js`
still 38/38.

**Note for later:** "separated for each instructor" may go further than
this — right now there's still only one admin role, not per-instructor
accounts scoped to a specific course. This fix makes the *workspace*
per-course; whether individual instructor logins should be restricted to
only their assigned course(s) is a bigger access-control question, not
addressed here.

## Sprint 3 — redo-completion gate (2026-09-15, DONE)
Decision made (owner said "go for it" on this thread as a whole rather than
re-litigating the specific mechanism): `moduleCompletion()` now returns
`complete: false` whenever `user.openLabRedosByModuleKey[moduleKey]` is set
— i.e. an unresolved instructor-requested redo on any lab in that module
blocks the green "Complete" badge outright, regardless of what the older
engagement-based checks (`contentOpened`, `allLabsComplete`,
`moduleOneRequirementsComplete`) computed. Deliberately did **not** add a
second, independent score/pass_threshold check inside `moduleCompletion()`
itself — the 70% threshold is already what drives the instructor's
send-back action (which is what sets `redo_requested`), so re-checking the
raw score here would just duplicate that gate, not add one. Once a student
resubmits, `recordLabAttempt()`'s insert-only (never-upsert) design makes
the new attempt the latest row, `openLabRedosByModuleKey` clears itself
automatically (see `buildUserFromSession()`), and completion re-evaluates
normally — no separate "clear the redo" step needed anywhere.

**Built via `codex exec` as a scoped, single-function sub-agent task**
(orchestrated, reviewed, tested, and committed by the main session — codex
never touched git). Diff: `portal/app.js` `moduleCompletion()`, one added
`hasOpenLabRedo` boolean ANDed into the final `complete` expression, plus a
2-line comment; no other line touched. `node --check portal/app.js` clean;
`bin/portal-check.js` still 38/38, no regressions.

**Verified two ways** (Chrome extension wasn't connected this session, so
the usual live-browser round trip wasn't available):
1. `node --check` + `bin/portal-check.js` (38/38) — no regressions anywhere
   in the 38 rendered module/program views.
2. A standalone unit-level check loaded the real `portal/app.js` in the same
   `node:vm` harness `bin/portal-check.js` uses and called the real,
   unmodified `moduleCompletion()` directly for `soc-02` with a
   synthetically-"complete" engagement state (all lessons opened, all labs
   in `completedLabs`) — once with `openLabRedosByModuleKey` empty, once
   with it set for `soc-02`. Result: `complete` flipped `true → false` with
   `contentOpened`, `allLabsComplete`, `fixtureState`, and `module` all
   byte-identical between the two runs — proof the gate is the sole cause
   of the flip, not a side effect of something else. (Script not kept in
   the repo — scratch verification, not a permanent test; the change itself
   is small enough that `bin/portal-check.js` remains the durable
   regression check.)

This closes the only remaining open item from Sprints 1–2. Nothing left to
do in this directory.

## Working conventions for this sub-project
- One directory, this one, for everything related to this specific feature
  — don't scatter grading/notification docs back into the course root.
- Sprint execution style matches the rest of this repo: one small task per
  haiku-subagent sprint, reviewed and committed locally, never pushed
  without being asked (`docs/handoffs/NEXT_SESSION.md`'s Module 01 entry, 2026-09-07, is
  the reference pattern).
- This repo auto-deploys to GitHub Pages on push to `master`, **and** this
  session's Supabase writes hit the same live/linked project local dev
  points at (no staging environment) — nothing from this feature is live
  until a human explicitly says to push the migration.
- Update this file's "Status" line and the sprint log at the end of every
  sprint, so a token-limited session or a fresh one can resume cold — same
  reason `docs/handoffs/NEXT_SESSION.md` exists at the course root.

## Sprint log
- 2026-09-13 — Sprint 0 (brief + scan). Done. See `INITIAL_BRIEF.md` and
  `00_SCAN_AND_GAP_COMPARISON.md`.
- 2026-09-13 (later same day) — Sprint 1 (admin panel core). Done, verified.
  Owner resolved all 3 blocking decisions verbally mid-session (redo = full
  resubmission; feedback = instructor-authored per item; notification scope
  = global for v1).
- 2026-09-13 (same session) — owner pushed `20260913120000_lab_grading_review.sql`
  to the linked project (`supabase db push`, confirmed live).
- 2026-09-13 (same session) — Sprint 2 (student-facing redo). Done.
- 2026-09-13 (same session, Chrome connected) — full live browser
  verification, admin send-back through to student banner, real round trip
  against production. See "What's built" above for the exact steps. Only
  remaining item: the 70%-completion-gate decision.
- 2026-09-23 — diagnosed and fixed the "admin ~92-94%, student resets to the
  beginning" report on `4437023872-SOCAN` (read-only production queries via
  `supabase db query --linked` confirmed 11/12 modules genuinely
  server-verified; only `soc-01` fails verification, and because of the
  2026-09-16 sequential gate that alone locks the other 11 from the
  student). Files changed (none pushed/deployed yet):
  - `supabase/migrations/20260923100000_module_progress_admin_override.sql`
    — adds `module_progress.admin_override` (+ `_by`/`_at`/`_note`),
    ORs it into `student_verified_module_progress` ahead of every other
    condition, broadens the reconcile trigger from soc-01-only to every
    module, and adds `admin_set_module_override(p_user_id, p_track_code,
    p_module_key, p_override, p_note)` — `security definer`, gated on
    `public.is_admin()`, the only way this column is ever written.
  - `portal/app.js` — admin student-detail module table now selects
    `admin_override`/`admin_override_at`, shows an "(admin override)" tag,
    and has a "Mark complete (override)" / "Remove override" button per
    module row that calls the new RPC and refreshes the panel.
  - `portal/soc-analyst-module-01.js` — `moduleOneQuizPanel()` now detects
    "reads complete elsewhere (verified/admin override/evidence flag) but
    this browser has no real local answers" and shows an "Already verified
    complete" summary with a "Retake this knowledge check" button, instead
    of a blank, freshly-shuffled quiz that contradicted the nav rail.
    `moduleOneProgress()`'s `knowledgeCheckComplete` now trusts the same
    `verified` signal first, matching the existing pattern for
    `guidedLabComplete`/`assessmentLabComplete`.
  - `node --check` clean on both files; `bin/portal-check.js` unchanged
    (38/39 — the one pre-existing `module 2  FAIL missing authored
    Assessment Lab surface` predates this session, confirmed via `git
    stash`, unrelated to this fix, not touched).
  - Chrome extension was not connected this session — no live browser
    round trip. `4437023872-SOCAN`'s actual production data was read
    directly (read-only) to confirm the root cause; nothing was written.
  **Not done — needs the owner:**
  1. `supabase db push` (Modify-Shared-Resources/production-deploy class
     action, same as every other migration in this repo — the agent
     doesn't run this).
  2. Sign in as `7355312413-ADMIN`, open `4437023872-SOCAN`'s detail panel,
     click "Mark complete (override)" on Module 1 (`soc-01`). That's the
     actual fix for this specific account — confirmed live afterward the
     same student should see the whole course unlocked.
  3. The other two accounts this repo has flagged before with the same
     backfill-desync shape (`9334491415-SOCAN`, `5520852787-SOCAN`) are
     worth checking the same way — not independently re-confirmed this
     session (one read query against them was blocked by the harness's own
     auto-mode classifier; re-run it, or just open each one in the admin
     panel and look).
