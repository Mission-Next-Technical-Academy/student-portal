# MNT Academy — architecture & sprint log (live doc)

This is the working architecture reference and sprint tracker for the Supabase
migration work (auth, provisioning, progress persistence). `PLATFORM_ARCHITECTURE.md`
is the older, fuller design doc from the original build; this file exists because
that one no longer matches reality in several places and is too large to safely
hand to a fresh session cold. **This file is the source of truth going forward.**
Paste it into a new session to resume this work with no reconstruction needed.

Last updated: 2026-08-29. Sprints 1-6 are all done: migration
`20260828160000_simplify_schema.sql` is pushed and applied to the live
project (confirmed via `supabase migration list` — shows on both Local and
Remote), the Sprint 2-4 frontend wiring is committed and live as part of
`57ac7cc`, and all 81 accounts are provisioned. Nothing left blocking in this
workstream — see the sprint sections below for what's still unverified vs.
confirmed live.

---

## 1. Data model — what each table means and who writes to it

### Identity & access — REVISED this session, supersedes the original design

**No `profiles`, no `enrollments`, no `module_entitlements`.** The original
schema (`supabase/migrations/20260817090100_enrollment.sql`) was designed for
a self-service product: real names/avatars (`profiles`), a purchase flow
feeding flexible enrollment state (`status`, `access_mode` full/partial/drip,
`expires_at`, `order_ref`). None of that applies here. The site owner's
framing this session: students get **generic, anonymized credentials for the
course they're signed up for** — no name collected, no avatar, no purchase
event, nothing external ever changes access after provisioning. The whole
system is air-gapped from any purchase/enrollment pipeline — access is a
static fact set once at provisioning time, not a stateful thing that gets
enrolled/paused/expired. Carrying `profiles` + `enrollments` +
`module_entitlements` forward would mean maintaining three tables and a
trigger for flexibility this platform will never use.

**Revised model:**

- **`auth.users`** (Supabase-managed) — one row per account. Email is synthetic,
  never shown to the student: `<lowercased-login-id>@missionnext.example`. The
  `.example` TLD is IANA-reserved (RFC 2606) and never resolves — chosen so a
  leaked roster or auth dump reads as inert placeholder data, not a live domain
  worth targeting.
- **`public.students`** — the ONLY identity table. `student_id` (the login ID
  itself, e.g. `4957361987-SOCAN`) is the primary key, `user_id` → `auth.users`,
  `track_code` (`SOCAN`/`HDESK`/`AIENG`/`ELECT`/`ADMIN`), `is_admin` boolean.
  Written only by `bin/provision-students.js` (service-role, local, never
  deployed). RLS: a student reads their own row; `is_admin()` reads all.
  **`track_code` IS the enrollment** — it deterministically names the one
  program a student has full access to (`SOCAN`→soc-analyst, `HDESK`→
  it-support, `AIENG`→ai-ml, `ELECT`→electrical). No separate table needed to
  express that.
- **`has_program_access()` / `has_module_access()`** — rewritten to check
  `students.track_code` against the module's/program's slug directly (via the
  fixed track-code map), instead of querying `enrollments`. Always full
  access for a student's one track, nothing partial, nothing time-limited.
  This is folded into Sprint 1 below — it touches the same migration that
  redefines `course_progress`, since `course_progress` also needs to join
  through this access path instead of through `enrollments`.
- **`public.profiles`, `public.enrollments`, `public.module_entitlements`,
  `public.handle_new_user()` trigger** — all dropped in Sprint 1. Confirmed
  safe: `enrollments` is empty (only the ADMIN account exists, which never
  gets an enrollment row anyway), so there's no data to lose.

### Catalogue — DROPPED this session, folded into Sprint 1

**`public.programs` / `public.modules` / `public.labs` are being removed.**
Site owner's direction: "the less backend the better... if there is a table
that can provide the necessary data in a minimized and clean way, the
better." These three tables were originally needed so RLS could reason about
entitlement (walk labs→modules→programs to check access). Now that access is
just "does your `track_code` match this track" (see above), that join chain
serves no purpose — and the actual display content (titles, descriptions,
difficulty, lesson counts, etc.) already lives in `portal/data.js` on the
frontend, fully duplicated in the DB for no reason.

**What replaces them:** every track has a fixed shape — 12 modules, weeks 1-6,
module 12 is always the capstone (confirmed in `seed.sql`, true for all four
tracks). `modules_total` becomes the constant `12`, not a table lookup.
`module_progress`/`lab_attempts` reference modules and labs by their existing
**text keys** (`module_key` e.g. `'soc-05'`, `lab_key` e.g.
`'lab-siem-triage'` — these keys already exist in `portal/data.js` and were
already the stable join key even when the `modules`/`labs` tables existed),
not by a foreign-key'd uuid.

**Trade-off, stated plainly so it's a decision and not an accident:** without
a `modules`/`labs` table, Postgres can no longer *validate* that a given
`module_key`/`lab_key` actually belongs to the track a student is enrolled
in — RLS will check "is this your `track_code`," not "is `'soc-05'` really a
SOC module." A student could in theory write a garbage `module_key` for
their own row. They cannot read or write any other student's rows, and there
is no privilege escalation — worst case is a nonsense row in their own
progress data. Given the audience (an internal training platform, not a
paid product with adversarial users trying to steal content), this is an
acceptable trade for a meaningfully smaller backend. Revisit if that
assumption ever changes.

### Progress — this is the part that changed shape this session

**Resolved terminology, going forward — use these words, not the old ones:**

- **`module_progress`** — the atomic, per-unit completion record, and now the
  **only** granular progress table. Revised shape: `(user_id, module_key text,
  track_code text, state, percent, started_at, completed_at, updated_at)`,
  primary key `(user_id, module_key)`. `module_key` (e.g. `'soc-05'`) replaces
  the old `module_id uuid` FK — see the catalogue-drop trade-off above.
  **This is "lesson progress."** The site owner's call this session: modules
  in this platform ARE the lesson-granularity unit — there is no finer-grained
  "lesson within a module" tracking needed, so there is no `lesson_key`
  anywhere in the revised schema. This table is the single write-path for
  "did the student finish this."
- **`course_progress`** — **redefined this session.** It currently still
  exists as the table the site owner renamed live from `lesson_progress`
  (old shape: `user_id`, `module_id`, `lesson_key`, `state`, timestamps) —
  wrong shape for what the name now means, and depended on the `lesson_key`
  granularity that's being removed. The site owner's definition: **"course
  progress is percentage complete per student."** That's a per-student
  *rollup*, not a granular table. Matches how this schema already treats
  every other derived value (`admin_student_progress`, `capstone_scorecard` —
  both views, not tables, specifically so there's never a second copy of
  truth to drift): **`course_progress` becomes a VIEW**, computed live from
  `module_progress`, grouped by `(user_id, track_code)` — no join to any
  catalogue table needed since `modules_total` is the fixed constant `12`.
  Columns: `user_id`, `track_code`, `modules_total` (`12`), `modules_complete`,
  `percent_complete`, `last_active`. **Migration not written yet — Sprint 1.**

- **`lab_attempts`** — one row per lab attempt: `(user_id, lab_key text,
  state, score, result jsonb, started_at, completed_at)`. `lab_key` (e.g.
  `'lab-siem-triage'`) replaces the old `lab_id uuid` FK, same reasoning as
  `module_progress`. Intended write path: the simulator (`ui/`, port 8767
  locally) reports a result back to the portal, which writes this row. **Not
  wired yet** — see Sprint 2/3.
- **`capstone_submissions`** — one row per `(user_id, track_code, stage)`,
  12 stages, each with `answers` (jsonb) and `score`. `program_id uuid` FK
  becomes `track_code text`, same catalogue-drop reasoning. `capstone_scorecard`
  is a view over this computing the six score dimensions. **No frontend
  capstone flow exists yet at all** — confirm scope before starting Sprint 4.
- **`sim_state`** — one row per `(user_id, namespace)`, holds the simulator's
  ~97 localStorage/sessionStorage keys as a single jsonb blob per namespace
  (`namespace` is already a free-text string like `'lab:lab-siem-triage'` —
  unaffected by the catalogue drop, no FK to begin with). This is **not**
  student-visible "progress" in the sense of a completion percentage — it's
  the simulator's own scenario/session state (selected evidence, notes,
  in-progress answers), so a student can resume a lab exactly where they left
  it, on any device. Exists in schema; **not wired yet.**
- **`portfolio_artifacts`** — exported reports from capstone/labs. `program_id`
  FK becomes `track_code text`. Schema exists; **no frontend for this at all
  yet** — lowest priority, not in the current sprint list.

### Admin

- **`public.is_admin()`** — security-definer function, the single source of
  truth for "is this user staff." Checks `students.is_admin`.
- **`public.admin_student_progress`** — view, admin-only (`where is_admin()`
  in the view body), one row per student: `student_id`, `track_code`,
  `modules_complete`/`modules_total` (now just re-selects from the new
  `course_progress` view instead of computing its own join through
  `enrollments`/`modules` — folds into Sprint 1), capstone score, last active.
  Powers the `#/admin` route in the portal.

---

## 2. What's actually true right now (verified this session, not assumed)

**Live Supabase project (`eokvngifirjgfozzbieu`) — schema and catalogue:**
- All migrations through `20260828150000_rename_course_progress.sql` are
  applied and confirmed (`supabase migration list` shows Local == Remote).
- Catalogue is seeded: 4 programs, 48 modules, 16 labs (SOC only).
- `students` has **1 row**: the `ADMIN` account (`7355312413-ADMIN`).
  `enrollments` is empty (admin accounts don't enroll in anything).
- The `course_progress` rename is reconciled in migration history, but the
  table is still shaped like the old `lesson_progress` (see Sprint 1 — this
  is the next schema change, not yet done).

**Local repo — NOT deployed:**
- `git status` shows every auth/provisioning file as modified/untracked —
  **nothing from this session has been committed or pushed.** The live
  GitHub Pages site (`mission-next-technical-academy.github.io/student-portal`)
  is still running the OLD mock `DEMO_USERS` code. Logging in with a real
  student ID **cannot work yet** until this is committed and pushed to
  `master` (push-to-master auto-deploys via `.github/workflows/pages.yml` —
  no manual deploy step, but someone has to actually push).
- Files that belong to this work, to be staged together (do NOT blanket
  `git add -A` — there is unrelated pre-existing uncommitted work in the tree:
  `HANDOFF.md`, `LATEST_PROGRESS.md`, `MODULAR_LAB_PROGRAM_PROGRESS.md`,
  `PROGRESS_M07_EMAIL_KQL.md`, `portal/module-07/10/11/12.*`,
  `ui/coach-data.js` — leave those alone, they're not this session's):
  ```
  .gitignore
  portal/app.js
  portal/data.js
  portal/index.html
  portal/module-01.js
  portal/supabase-config.js       (new)
  portal/vendor/supabase.js       (new)
  bin/provision-students.js       (new)
  supabase/migrations/20260828120000_students_admin.sql   (new)
  supabase/migrations/20260828140000_seed_catalogue.sql   (new)
  supabase/migrations/20260828150000_rename_course_progress.sql  (new)
  architecture.md                 (new — this file)
  ```
  `PLATFORM_ARCHITECTURE.md`, `SPRINT_PLAN.md`, `NEXT_SESSION.md` were also
  edited this session with doc updates — include those too if committing.
- **Pushing to `master` is a real, public, live-site-affecting action** — it
  should be a deliberate step the site owner confirms, not something a coding
  agent does autonomously.

**Persistence — the actual gap, don't undersell this:**
Auth is real. The tables and RLS are ready. **But nothing in the frontend
writes to `module_progress`, `lab_attempts`, `capstone_submissions`, or
`sim_state` yet.** Today's engagement tracking (`markModuleContentOpened`,
`loadModuleEngagement`/`saveModuleEngagement` in `portal/app.js`) is still
100% `localStorage`, unchanged by this session's work. "These tables are the
source of truth for progress/state/score saving" — that's the *target*, not
the current state. Sprints 2-4 below close this gap.

---

## 3. Sprints

### Sprint 1 — the big simplification migration (schema only, no frontend) — ✅ DONE, pushed & applied live
Written to `supabase/migrations/20260828160000_simplify_schema.sql`. Reviewed
against every existing migration for column/type/policy convention match and
dependency ordering (views → identity → old progress/capstone/portfolio →
enrollment layer → catalogue, child-before-parent → old uuid-signature access
functions, then recreated new). Confirmed via grep: no frontend code
(`portal/`, `ui/`) calls `my_module_access` or either access function
directly — RLS-only usage — so dropping/retyping them is not a frontend
regression. **Pushed and applied to the live project** (confirmed 2026-08-29
via `supabase migration list` — `20260828160000` shows on both Local and
Remote; the site owner ran `supabase db push` themselves, since Claude Code's
auto-mode classifier blocks it as a destructive action). Two things worth
knowing before Sprint 2 code assumes this schema:
`has_module_access(p_track_code text default null)` takes a track_code
directly (not a program slug) since rows now carry `track_code` natively;
`has_program_access(p_program_slug text)` is the slug-taking variant for any
future non-RLS caller. `admin_student_progress`'s per-student rollup was
already broken pre-migration for viewing *other* students' progress
(`security_invoker` + row-owner RLS means an admin's query only sees the
admin's own rows in the joined views) — not introduced by this migration,
not in scope for Sprint 1, noted for whoever builds the admin dashboard
further.

One new migration, in this repo's existing style, that:
1. Drops `public.profiles` (+ its `handle_new_user()` trigger), `public.
   enrollments`, `public.module_entitlements`, `public.programs`, `public.
   modules`, `public.labs` (all confirmed empty except catalogue rows, which
   are being intentionally removed — the display content is already in
   `portal/data.js`).
2. Rewrites `module_progress` and `lab_attempts` to key by `module_key`/
   `lab_key` text instead of uuid FKs, and add `track_code text` to each
   (needed since there's no `enrollments`/`modules` join left to derive it
   from) — see exact shapes in §1.
3. Rewrites `capstone_submissions`/`portfolio_artifacts`: `program_id uuid`
   → `track_code text`.
4. Rewrites `has_program_access()`/`has_module_access()` to check
   `students.track_code` against a fixed track-code→slug map (see §1),
   dropping the `enrollments` walk entirely.
5. Drops old `course_progress` (the lesson-grain table), creates it as a view
   per §1 (group by `user_id, track_code`, `modules_total` = constant `12`).
6. Updates `admin_student_progress` to select from the new `course_progress`
   view instead of computing its own catalogue join.
All RLS policies on `module_progress`/`lab_attempts`/`capstone_submissions`/
`sim_state` need their `using`/`with check` clauses re-pointed at the
simplified `has_module_access()` (same function name, new body — callers
don't need to change). This is a bigger migration than the earlier ones;
worth a coding agent building it against a written-out column list rather
than improvising, and a careful review before it's pushed live (this drops
tables — irreversible on the live project without a backup/rollback plan).

### Sprint 2 — wire `module_progress` writes into the portal — ✅ DONE, pushed & live-verified
Built in `portal/app.js` only, verified (`node --check` clean, diff reviewed).
`buildUserFromSession()` now surfaces `user.userId`/`user.trackCode` (both
already fetched by the existing `students` query, previously discarded — no
new query added). Three new helpers: `upsertModuleProgress()`,
`markModuleInProgressRemote()` (called from `markModuleContentOpened`, only
on first-ever open — read-before-write guards against downgrading an
already-`complete` row back to `in_progress`), `markModuleCompleteRemote()`
(called from `markModuleLabComplete` when a fresh `moduleCompletion()` check
now returns `complete: true`). Fire-and-forget, every write guarded on
`user.userId && user.trackCode`, errors logged not swallowed. localStorage
engagement tracking untouched — this is purely additive. **Live-verified**
2026-08-28: real UAT (`d341ee6`) logged in as an actual SOCAN student against
the deployed site + live project, opened Module 1, and a genuine
`module_progress` row with `state = 'in_progress'` was written and correctly
surfaced on the admin dashboard — the write path works end to end.

**Recon done, findings below — no further investigation needed, just build:**
- Every module (all 12) funnels through exactly two functions in
  `portal/app.js`: `markModuleContentOpened(user, programSlug, moduleKey)`
  (~line 176) and `markModuleLabComplete(user, programSlug, moduleKey,
  labKey, completed=true)` (~line 186). Wiring real writes only means
  touching these two functions — not any of the 12 module files.
- "Opened" and "complete" are genuinely distinct today: `moduleCompletion()`
  (~line 196) computes `complete = contentOpened && allLabsComplete`. This
  is the right moment to upsert `module_progress` — call it right after this
  computation changes a module's status, not on every open/click.
  `moduleCompletion()` also reads a `user.progress` field left over from the
  old `DEMO_USERS` mock — real accounts never set it, so it silently no-ops
  today. Not a crash, just confirms the real signal is 100%
  `openedModules`/`completedLabs`, which is what to persist.
- Once Sprint 1 lands, write target is `module_progress (user_id, module_key,
  track_code, state, percent, completed_at)` keyed by `module_key` text, not
  `module_id` uuid — update accordingly.

### Sprint 3 — wire `lab_attempts` writes — ✅ DONE (the "already-scored" half only), pushed & live
Scoped deliberately to the half this sprint's own note called out: wired what
every module already computes in-page, did NOT build the simulator→portal
`postMessage` contract for modules 2-12 (`ui/mnt-lab-harness.js` still
doesn't exist — that's a separate, bigger, not-yet-scoped piece of work).
One centralized `recordLabAttempt(user, labKey, {state, score, result})` in
`portal/app.js:290` (append-only `.insert()`, not upsert — `lab_attempts` has
no per-lab uniqueness constraint), called from all 12 module files right
where each module's own `moduleXScore()` already runs — 30 call sites total,
`node --check` clean on all 13 touched files. Every submit is recorded
(`state: 'complete'` on pass, `'in_progress'` on fail), not just passes.
Module 1 also gets a second row from its existing bare `mnt-coach-complete`
signal (no score, `result: {source: 'mnt-coach-complete'}`) — reuses the
existing signal, does not add a new contract. Ran concurrently with the
Sprint 2 agent; correctly discovered and reused `user.userId`/`user.trackCode`
from Sprint 2's `buildUserFromSession()` change instead of duplicating it —
verified no edit conflict in the diff. Code is live and pushed as of
`57ac7cc`; unlike Sprint 2's `module_progress` write, no live UAT has
specifically exercised a `lab_attempts` insert yet — still worth a real
smoke test (submit a module lab as a real student, confirm the row lands).

**Recon done:** only Module 1 has a real simulator→portal signal today
(`moduleOneReceiveCoachCompletion` in `portal/module-01.js` ~line 894,
listens for `postMessage` type `'mnt-coach-complete'`). Every other module
(02–12 checked) drives completion from pure in-page button clicks with no
simulator round-trip — `ui/mnt-lab-harness.js` (the planned simulator-result
contract) was never built. `portal/lab-runtime.js` (`LabRuntime`, 70 lines)
already tracks fine-grained per-lab local state (`attempts`, `score`,
`completed`, etc.) — this is the natural source for what a `lab_attempts` row
should contain once wired, and doubles as what `sim_state` was designed to
receive. Building a real simulator-result contract for all 12 modules (not
just Module 1) is bigger than it first looks — scope this sprint carefully,
possibly split "wire what already reports a result" (Module 1) from "build
the missing contract for the other 11."

### Sprint 4 — capstone flow + `capstone_submissions` writes — ✅ DONE (simple version), pushed & live
Scope resolved with the site owner: build the simple version, not a 12-stage
wizard. A concurrent curriculum-planning workstream
(`CURRICULUM_ALIGNMENT_ARCHITECTURE.md`, a different agent/session working on
learner-facing content — see note below) independently frames the capstone
the same way: "12 stages remain one Prove assessment" — i.e. Module 12 IS the
one graded capstone assessment, not 12 separate submissions. So: exactly one
`capstone_submissions` row per `(user_id, track_code, stage=12)`, written from
Module 12's existing pass/scoring logic, no new UI.

Added `recordCapstoneSubmission(user, {score, answers})` in `portal/app.js`
(~line 341), called from `portal/module-12.js` (~line 468-479) only on an
actual pass. **Upsert, not insert** (the opposite of Sprint 3's
`lab_attempts` convention) — deliberate: `capstone_submissions` has a real
`unique(user_id, track_code, stage)` constraint and no `state`/attempt-number
column, so "latest attempt" and "the record" are the same row; a plain
insert would violate the constraint on a second attempt. `answers` jsonb
reuses everything Module 12's scorer already computes (raw form responses,
report text, ten-domain breakdown, critical errors, hint penalty) — nothing
invented. `node --check` clean on both touched files. Only `portal/app.js`
and `portal/module-12.js` touched — did not touch `portal/data.js` (owned by
the concurrent curriculum workstream) or any other module file. Code is live
and pushed as of `57ac7cc`; like Sprint 3, no live UAT has specifically
exercised a `capstone_submissions` write yet — still worth a real pass
attempt through Module 12 to confirm the upsert lands.

**Note on the concurrent curriculum workstream:** a separate agent/session is
running `CURRICULUM_ALIGNMENT_ARCHITECTURE.md`'s sprint plan against this
same repo (Sprint A already landed additive `compliance`/`curriculumItems`
metadata in `portal/data.js`; future Sprint C/D will edit
`module-01/04/05/06/08/10/12.js` for label/copy/capstone-timing changes). Its
plan explicitly locks `soc-01`..`soc-12` module keys, lab keys, routes, and
runtime IDs as immutable, and explicitly names this file's backend
simplification as compatible/not superseded — so no conflict expected with
Sprints 1-4 here. But its future edits to the same module files (especially
`module-12.js`, which Sprints 3 and 4 here both just modified) should be
made against the current file state, not a stale copy — flag this if
briefing that workstream's next agent.

### Sprint 5 — commit and deploy — ✅ DONE
Landed as `57ac7cc` ("Curriculum alignment sprints A-H + backend schema
simplification"), pushed to `master`, deployed live via the Pages workflow.

### Sprint 6 — provision the remaining accounts — ✅ DONE
All 81 accounts provisioned (`ADMIN 1`, `SOCAN 20`, `HDESK 20`, `AIENG 20`,
`ELECT 20`), run directly by the site owner in their own terminal with the
service-role key, per the standing rule that this step is not delegable to
an agent. Roster CSVs sit in `bin/.roster-output/` (gitignored) — still
worth moving to a real password manager before handing any out to actual
students, since the only copy of each password is currently a single
un-backed-up CSV.

---

## 4. Order of operations

Sprints 1-6 — **all done**. Migration pushed and applied live, frontend
wiring committed and deployed as `57ac7cc`, all 81 accounts provisioned.
Sprint 2's `module_progress` write path has been live-UAT-verified; Sprints
3/4's `lab_attempts`/`capstone_submissions` writes are live and pushed but
not yet specifically smoke-tested with a real student attempt — worth doing
opportunistically, not blocking. Separately unscoped, not in this sprint
list: the simulator→portal result contract for modules 2-12
(`ui/mnt-lab-harness.js`), deliberately left out of Sprint 3.
