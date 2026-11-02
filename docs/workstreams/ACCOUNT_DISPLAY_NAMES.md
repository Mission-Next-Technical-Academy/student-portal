# Account display names (first + last name next to every account number)

## Next AI — start here

- **Date opened:** 2026-11-02. **Branch:** `feat/account-display-names`, in the
  worktree `~/mnt-account-names` (off `origin/master` @ fbeb409).
- Work **only in this worktree.** Other sessions share the main checkout
  (`~/Mission_Next_Technical_Academy_SOC_Analyst_course`), and it has the
  owner's uncommitted WIP in `portal/index.html` and `portal/theme.css`. Never
  touch that checkout.
- Read `CLAUDE.md`, `AGENTS.md`, `docs/operations/AI_AGENT_RULES.md` and
  `~/.claude/playbooks/cyber-hygiene.md` first.
- **No agent runs `supabase db push`, `db reset --linked`, `functions deploy`,
  or any write to staging or production.** The owner runs the push. The CLI
  is currently linked to **PRODUCTION** (`eokvngifirjgfozzbieu`), not staging.
- All student data is synthetic. The names in this feature are `Test Account`.

## Owner request (verbatim intent)

1. Show the account's **first and last name** with every account number
   (e.g. `1625151945-HDESK`) in the **entire** web app. That covers the admin
   panel, instructor dashboards, every track (SOC Analyst, Help Desk, AI/ML,
   Electrical, M360), headers, messages, grading and submission sheets,
   reports, rosters and dropdowns. Put the name just below the ID, or next to
   it where below doesn't fit (dropdown options, inline text). It must be
   small and must not change the existing sizing or layout, but stay clean
   and readable.
2. **Generate New User** (admin "Generate Account" form) gets manual,
   required **First name** and **Last name** inputs.
3. **All existing accounts** become First = `Test`, Last = `Account`.
4. **Generate Diploma** no longer has manual name inputs. It auto-fills from
   the account's stored first and last name.
5. Ship it as local changes plus migration(s), so the only DB step is the
   owner's `supabase db push`. Push the branch and open a PR against
   `master` so CI runs.

## Contract (all sprints code to this, do not rename)

### Database: one new migration `supabase/migrations/20261102120000_account_display_names.sql`

- `alter table public.profiles add column if not exists first_name text,
  add column if not exists last_name text;` Add checks: trimmed, 1–80 chars
  when not null.
- Backfill: `update public.profiles set first_name = 'Test', last_name =
  'Account' where first_name is null or last_name is null;`. This covers
  every existing account, including admins and instructors.
- `public.admin_set_account_name(p_user_id uuid, p_first_name text,
  p_last_name text) returns void`. It is `security definer` with
  `set search_path = public`, and only an admin may call it (reuse the
  repo's existing admin check helper; do not invent a new role model). It
  trims, validates and updates `profiles`. `grant execute ... to
  authenticated`; `revoke ... from public, anon`.
- Read access: the viewer may read first/last name wherever they can already
  see that account's number. That means admin for all accounts, an
  instructor for the students in their course, and a student for
  themselves. Prefer adding the columns to the existing RPCs and views that
  already return account numbers, rather than widening `profiles` RLS. If an
  RLS change is unavoidable, keep it column-minimal and document why here.
- Do **not** change `handle_new_user`'s behaviour for `full_name`. New
  accounts get names through `admin_set_account_name` after provisioning.
  This avoids changing the `admin-provision` edge function, which needs a
  separate deploy.

### Frontend

- One shared helper in `portal/app.js` (or the shared module it already uses
  for formatting): `accountNameText(profileLike)` returns `"First Last"` or
  `""`. `accountNameHtml(profileLike)` returns
  `<span class="acct-name">First Last</span>` (escaped), or `""` when there
  is no name.
- One CSS rule `.acct-name` (display:block; small, about 0.75em; muted
  colour token; line-height tight; no margin that shifts rows). In inline
  contexts use the `.acct-name--inline` modifier (display:inline,
  preceded by " · "). For `<option>` elements use plain text:
  `ID — First Last`.
- **Graceful before the push:** the UI must keep working against a database
  that does NOT yet have the columns or RPC (staging and prod until the owner
  pushes). If a select or RPC fails because of the missing column or
  function, fall back to the old query and render no name. Never break a
  page.
- Generate Account form: First name and Last name inputs above Account type
  (required, maxlength 80). After `admin-provision` succeeds, call
  `admin_set_account_name` with the new user's id. Show the name in the
  success panel. If the RPC is missing, show a non-blocking warning.
- Cohort batch generation keeps no per-student name inputs. Generated
  accounts show no name until an admin sets one. Add a small "Edit name"
  action in the admin student row detail that calls the same RPC.
- Diploma: remove the First/Middle/Last inputs and the "never saved" copy.
  Fill from the selected student's stored name. If the student has no
  stored name, block generation with a clear message pointing to Edit name.

## Sprint plan

- [x] **S1 — DB + data layer + helper/CSS.** Migration, RPC, read paths
      (RPCs/views that return account numbers now also return names),
      portal data-fetch changes with fallback, `accountName*` helpers,
      `.acct-name` CSS. Inventory every place an account number is rendered
      (file:line) and record it under "Render inventory" below. That list is
      what S2/S3 work through.
- [x] **S2 — Admin panel.** Student Progress table, Student Activity Monitor,
      Cohorts/roster, Archived Students, Enrollment Planning dropdown,
      Generate Account names + RPC call, Edit name action, Diploma
      auto-fill, reports and exports (add First/Last columns to CSV and
      progress-file outputs), header account chip.
- [x] **S3 — Everywhere else.** Instructor dashboards (SOCANINST, HDINST),
      messages, lab attempts, submission sheets (`portal/admin-sheets/*`),
      case records, every track page (SOC Analyst, Help Desk, AI/ML,
      Electrical, M360), the student's own header and profile, the
      simulator (`ui/`) if it shows account numbers.
- [x] **S4 — Verify + ship.** `bin/ci-check.sh`, `bin/portal-check.js`, a
      real-browser check of the worktree served locally against staging
      (fallback path: pages render, no names, no console errors). Static
      review of the SQL. Gitleaks/secret sweep. Commit, push the branch, and
      open a PR to `master` with the owner's push instructions.

## Render inventory

Line numbers are `portal/app.js` as of the end of S1 unless a file is named.
**Data source for every `app.js` site below:** the name directory
(`ACCOUNT_NAMES`, filled by `loadAccountNames()`) is keyed by `student_id` and
`user_id`, so any site that has `row.student_id` / `row.user_id` / a bare
account-number string just calls `accountNameHtml(row)` or `accountNameText(row)`.
**No threading needed** for `app.js`. `render()` awaits the directory (2.5 s cap)
before drawing, so the first paint already has names. The M360 pages and
`admin-submission-sheet.js` are the exceptions (noted).

Use block form `accountNameHtml(x)` under the ID inside the same cell. Use
`accountNameHtml(x, true)` for run-in text, `ID — accountNameText(x)` for
`<option>`, plain `accountNameText` for toasts/confirm/status strings and PDFs.

### S2 — Admin panel (`viewAdmin` and helpers; instructor dashboards reuse the same code, so S2 covers them too)

Screen renders
- [x] 7226 `viewAdmin` — Student Progress table row, ID button in the first cell (block form below the ID). 7206 is the sortable "Student ID" header (sort key `studentId`, 9601).
- [x] 7228 `viewAdmin` — amber cheating-flag badge sits beside the ID; keep it on the ID line.
- [x] 6718 `toggleCredentialsPanel` — credentials panel text "Student ID: …" (inline); 6735 delete-instructor `confirm()` text; 6697/6812 rotate-password status line (text).
- [x] 7125 `viewAdmin` — Generate Diploma `<option>` (`ID — program`), becomes `ID — Name — program`. Name inputs 7130–7136 are REMOVED by S2 (diploma auto-fill); submit handler 9176–9199 (`wireAdmin`) builds `fullName` from those inputs today.
- [x] 7152 `viewAdmin` — Enrollment-planning / active-student `<option>`.
- [x] 7295 `viewAdmin` — Student-detail `<option>` (`ID — program (n/m coursework)`).
- [x] 7363 `viewAdmin` — Student Activity Monitor login-events table, ID cell (`ev.student_id`; also 7364 flag badge); 7372 force-sign-out button label/confirm text (`data-force-signout-student`).
- [x] 7468 `viewAdmin` — Archived Students table ID cell; 7467 `data-archive-search` haystack (add the name so search by name works); 7448 search placeholder copy.
- [x] 1524 `adminProgramRoster` — Cohorts/roster article card showing the ID (chip row 1497 `adminProgramRosterChip`).
- [x] 1156 `actionText` (inside `adminAttemptReviewCard`) — Lab Attempts row "labs · ID" (inline form). 1195 `adminOpenRedoRequestsHtml` — open redo list ID. 1294 `studentCard` (`adminLabAttemptsPanel`) — per-student grading card header ID (block form). Data: graded/superseded rows get `student_id` from the dashboard map at 8004–8005, 8038; messages at 8057–8058.
- [x] 1484 `adminMessageInboxPanel` — thread header `thread.studentId`.
- [x] 10467 `renderStudentDetail` — "Student" ID line in the student detail panel (this is where the **Edit name** action goes); 10471/10472 transcript/evidence PDF buttons carry the ID in `data-*` (no display); 10344 / 10445 `data-student-id` attributes are not displayed.
- [x] 10197 `adminGroupGradingRows` — groups by `student_id`; display via 1294.
- [x] 9255 `syncAccountTypeControls` — Generate Account success panel `<pre>` "Student ID: …" (add Name line); 9327 cohort batch roster table ID cell (no name until set; ok to render none).
- [x] 4781 `header` (admin and student) — signed-in chip `user.name` (**proof applied in S1**: `accountNameHtml(user, true)` appended; S2 to review layout). 5075 `moduleTopbar` — module topbar chip `user.username` + `aria-label` 5073 (that one is the student's own, S3).
- [x] Status/confirm strings with a bare ID, use `accountNameText`: 9708, 9722 (planning), 9754–9760 (snapshot), 9785–9814 (enrollment toggle), 9959 (bulk progress files), 10064–10065 (override confirm), 6735.
- [x] 7344 `viewAdmin` — second "Student ID" table header (activity monitor); 7454 archived table header.

Reports and exports (add First/Last columns; student has `row.student_id`, names via directory)
- [x] 1633 `evaluateReportingCompliance` — "Student ID" field list; also `requiredFields` 1631 lists "student name or documented lawful substitute": once names exist this requirement can be satisfied (S2 decide whether to wire `r.first_name/last_name` in).
- [x] 1899 `buildCohortReportData` — builds `studentId: row.student_id`; add `firstName/lastName`.
- [x] 2510–2512 `renderCohortPdf` — Student table head `['Student ID', …]`, rows `st.studentId` (add Name column).
- [x] 2558–2560 `renderCohortPdf` — second table (credential/dates) `st.studentId`.
- [x] 2644–2646 `renderProgressSnapshotPdf` — `['Student ID', …]` rows `row.student_id`.
- [x] 2841–2842, 2885 `renderTranscriptPdf` — PDF title/subject and "Student Identifier" row (`transcriptData.studentId`), plus filename at 3064. Add "Student name" row; the builders `buildTranscriptData` (3688→`studentId` at 3725) get the name via the directory.
- [x] 3080–3081, 3090 `renderEvidencePdf` — title/subject/"Student ID:" line; builder `buildEvidencePacketData` (3826); filename 3278.
- [x] 3919–3949 `buildStudentSnapshotRecord` / `downloadStudentSnapshot` — JSON progress file, key `studentId` (3927) + filename 3949. Add `firstName/lastName`.
- [ ] _(skipped, optional ID-only filename)_ 6743 `toggleCredentialsPanel` — instructor offboarding JSON filename (ID only, optional).
- [x] 8885/8888 `buildDiplomaCertificateHtml` / 8902 `openDiplomaCertificate` — diploma certificate (`fullName` param + `studentId` footer); `fullName` becomes the stored name.
- [ ] _(S3 owns it)_ `portal/m360/admin-workspace.js:210` `exportSelected` — M360 admin CSV (`Student ID` column, add First/Last) and `:134` table cell, `:149` drawer `<h2>`, `:114` search haystack. Data: `studentModel`/`state.students` come from the query at `:53` (`.select('user_id,student_id,track_code,…')`) which needs `first_name,last_name` added **with fallback** (see M360 note in S3).

### S3 — Everywhere else

- [ ] `portal/admin-submission-sheet.js:695` `headerHtml` — `['Student', row.student_id || '—']` in every submission sheet header (all `portal/admin-sheets/*.js` render through this; none of them print the ID themselves). Data: `sheet.ctx.row` is the grading row (has `student_id`, `user_id`); `accountNameText` is a global from `app.js` (same page), so call `window.accountNameText(row)` with a `typeof` guard.
- [ ] `portal/it-support-shared.js:775` — HDESK admin grading card, "labs · ID" line (duplicate of `app.js:1156`, `row.student_id`). Same page as `app.js`, global helpers available.
- [ ] Student's own view: `app.js:4781` `header` and `:5075` `moduleTopbar` chip (own `user.username`; `accountNameHtml(user, true)` works because `user.firstName/lastName` are set) and the `aria-label` at `:5073`. Own JSON export `exportStudentRecord` `:3871` (`studentId`) and filenames `:3879`, `:3897`, `:3906` (optional name field).
- [ ] M360 standalone pages (no `app.js`, so no helpers and no directory there; each loads `m360-data.js`). Recommended: add a tiny `M360Data.studentNames()` (same fallback: try `select(..., first_name, last_name)`, on 42703/PGRST204 retry without) and a local escaped helper; share it from `m360-data.js`:
  - `portal/m360/m360-data.js:54` (`.select('student_id, user_id, track_code, …')`, builds `studentId` `:71`), `:214` (`.select('user_id, student_id, track_code')`).
  - `portal/m360/review.js:104–116` — review card "Student ${studentId}" (data: `row.student` join).
  - `portal/m360/review-portfolios.js:20` (`id=student.student_id||user_id`) query `:52`.
  - `portal/m360/review-attendance.js:30` (`studentLabel`), `:89` query, `:119` label.
  - `portal/m360/review-course-state.js:122`, `:189` (`<strong>` ID), query `:67`.
  - `portal/m360/portfolio.js:130` (PDF model `studentId`), `:150–152` title/kicker, `:184` notice, `:194` query, `:209`, `:214`; `portal/m360/m360-portfolio-pdf.js:164` ("Student ID:" line on the PDF). Student-side portfolio view shows the ID only via the PDF.
  - (`admin-workspace.js` is listed under S2 above because it is the admin panel's CSV.)
- Checked and **no account number is rendered** (no action): `ui/` simulator (the `username`/`student_id` hits are fictional lab data and login-failure fixtures), all `it-support-module-*.js`, `soc-analyst-*`, `ai-ml-*`, `electrical-*` module files (they only use `user.userId` as a storage key), `portal/orientation.js`, `portal/imported-labs/**` (`username` is a lab-local key), `lab-runtime.js:25` (uses the email as an internal identity key, not shown), `soc-analyst-module-03.js:410` (comparison only), `studentMessagesPanel` `app.js:5835` (student never sees an ID; `messageSenderLabel` shows "You"/"Instructor"), `supabase/functions/*` (return IDs to the admin UI only).
- Instructor dashboards (SOCANINST, HDINST): use the same `viewAdmin` code path with the `faculty_*` views (`rosterView`, `gradingView`, `openRedoView` at ~7790–7840). Names come from the same directory, so S2's edits cover them. S3 only verifies, with the caveat that an instructor can read names only for students on their assigned course (RLS `students_assigned_instructor_read`), and not for other instructors/admins.

Counts: S2 = 28 checklist items (about 55 individual sites), S3 = 4 checklist items plus the "checked, no action" list (about 22 sites, 13 of them in the M360 pages).


## Current state / log

_(Each sprint appends: what shipped, files, caveats.)_

### S1 — 2026-11-02

**Contract deviation (important).** `public.profiles` does not exist: it was
dropped by `20260828160000_simplify_schema.sql`. The account number is
`public.students.student_id` (e.g. `1625151945-HDESK`; `user_id` is the
auth uuid; `is_admin` / `is_instructor` flags live on the same table). The
first/last name columns and the RPC therefore target **`public.students`**.
Everything else in the contract is unchanged.

**Files changed**
- `supabase/migrations/20261102120000_account_display_names.sql` (new)
- `portal/app.js` (name directory, helpers, own-row select with fallback, `render()` wait, sign-out clear, header chip proof)
- `portal/module-labs.css` (`.acct-name`, `.acct-name--inline`) + cache-bust bump on its `<link>` in `portal/index.html` (one line: `?v=20261102-acct-name`). `theme.css` was not touched (owner WIP in the main checkout).
- this doc

**Migration.** Adds `students.first_name`, `students.last_name` (+ check
constraints: trimmed, 1–80 chars when not null); backfills every row to
`Test` / `Account`; creates `public.admin_set_account_name(p_user_id uuid,
p_first_name text, p_last_name text) returns void` (security definer,
`search_path = public`, gate = existing `public.is_admin()`, trims and
validates, errcode 42501 for non-admins, 22023 for bad names, P0002 when no
such user; `revoke ... from public, anon`, `grant execute ... to
authenticated`). Includes a rollback note. **Tested locally:** run in a
throwaway database (`scratch_s1`, since dropped) inside the local
`supabase_db_mnt-academy` container with stub `auth.uid()`, `students` and
`is_admin()`: backfill worked, non-admin call raised 42501, admin call
trimmed and saved, empty name raised 22023. Not run against any remote.
The full migration chain was not replayed.

**Read paths: no RPC/view was changed, and no RLS was changed.** Decision and
justification: `students` is already RLS-scoped to exactly the account-number
audience (`students_self_read`, `students_admin_read`,
`students_assigned_instructor_read`) and has a table-level `select` grant for
`authenticated`, so the two new columns are readable by those same viewers
with zero policy change. Writes are closed (the only column update grant is
`is_enrolled`); names change only via `admin_set_account_name`. Extending
the 13 views that carry `student_id` (`admin_student_program_progress`,
`admin_student_activity`, `admin_student_progress`, `admin_archived_students`,
`admin_enrollment_reporting`, `admin_grading_queue`, `admin_open_lab_redos`,
`admin_site_sessions`, `admin_site_hours_by_student`,
`admin_unread_student_messages`, `faculty_course_student_progress`,
`faculty_grading_queue`, `faculty_open_lab_redos`) would mean 13 redefinitions
with dependents and grant risk for no gain. Instead the client reads one
directory from `students` (see below). Not covered: names of other
instructors/admins for an instructor viewer, and the
`login_events` / `student_messages` tables carry a `student_id` text but the
directory still resolves it (admin sees all students).

**Frontend data layer (`portal/app.js`, block "account display names" just
above the `mnt:lab-attempt-save-failed` listener)**
- `ACCOUNT_NAMES` state: `available` (null/true/false), `rpcAvailable`,
  `byStudentId`, `byUserId` Maps, `ready` promise.
- `selectOwnStudentRow(userId)` — replaces the old own-row query in
  `buildCoreUserFromSession`; tries with `first_name, last_name`, on a
  missing-column error sets `available = false` and retries the old query.
  `user.firstName` / `user.lastName` added to the user object.
- `loadAccountNames(force)` — paged (1000) `select student_id, user_id,
  first_name, last_name from students`, once per session (promise cached),
  fires `mnt:account-names-loaded`. Missing-column error sets
  `available = false` (cached, never retried); other errors clear the cache so
  a later call retries. Kicked off in `buildCoreUserFromSession`, and
  `render()` awaits it (2.5 s cap) before drawing.
- `isMissingAccountNameSchema(error)` — 42703, 42883, PGRST204, PGRST202, or a
  first_name/last_name/admin_set_account_name "does not exist / schema cache".
- `accountNameText(p)` / `accountNameHtml(p, inline = false)` — `p` may be a
  row with `first_name/last_name`, a row/user with `student_id`/`studentId`/
  `username`/`user_id`/`userId`, or a bare account-number string. Escaped with
  the existing `esc`. Also on `window`.
- `setAccountName(userId, first, last)` → `{ ok, unavailable, error }`; wraps
  the RPC, sets `rpcAvailable = false` when the function is missing (S2 shows
  the non-blocking warning), refreshes the directory on success.
- Sign-out clears the directory.

**CSS.** `.acct-name { display:block; font-size:.75em; muted via
var(--mn-theme-muted,#64748b); line-height:1.2; no margin/padding }`,
`.acct-name--inline { display:inline }` with a `" · "` `::before`.
Proof applied only at the signed-in header chip (`header()`, inline form).

**S2/S3 must know**
- Helpers need the directory loaded; in `app.js` renders it already is. After
  `setAccountName` succeeds the directory is refreshed, so re-render the
  affected panel.
- Standalone M360 pages do not load `app.js` (see S3 list).
- `bin/portal-check.js` stubs supabase without `.range()`, so it logs one
  harmless `Could not load account names TypeError` line; the helper catches
  it and degrades to no names. Give the stub a `.range` if you want the log
  quiet.
- Add First/Last to the CSV/PDF/JSON outputs listed in S2; PDFs/JSON are built
  with `row.student_id`, so use `accountNameText(row)` there.
- The `admin-provision` edge function is untouched; new accounts get a name
  only via `admin_set_account_name` (new accounts have null names until then,
  and the helpers return `""` for null).

**Open questions for the owner**
1. Confirm the `students`-not-`profiles` deviation (nothing else exists to put names on).
2. Instructors do not see other instructors' or admins' names (RLS limits instructor reads to non-instructor students on their course). Acceptable?
3. New accounts created by the cohort batch flow show no name until an admin edits one, as the contract says; confirm that is wanted rather than defaulting them to `Test Account`.

**Verification.** `node bin/portal-check.js`: exit 0. `bash bin/ci-check.sh`:
exit 0 (all suites passed). `node --check portal/app.js`: ok. SQL tested
as described above. No remote Supabase command was run.


### S2 — 2026-11-02

Files: `portal/app.js`, `portal/module-labs.css`, this doc. No cache-bust done (S4): `app.js` and `module-labs.css` links in `portal/index.html` need a version bump.

**Shipped (app.js)**
- Added `accountLabelText(p)` ("ID (First Last)") for confirm/status strings; exported on `window`.
- Block name under the ID: Student Progress rows, Activity Monitor, Archived Students, roster cards, per-student grading card, open-redo list, message thread header, student detail header. Inline " · Name": lab-attempt row. `<option>`: diploma, planning, student-detail selects. Status/confirm strings (planning, snapshot, enrollment toggle, bulk progress, override, delete-instructor, force sign-out, rotate) use `accountLabelText`. Credentials panel and success panel `<pre>` gain a `Name:` line.
- Archived search haystack includes the name; placeholder updated.
- Generate Account: required First/Last (maxlength 80, above Account type). `admin-provision` does not return the new user uuid, so the handler looks it up from `students` by `student_id`, then calls `setAccountName`. Name shows in the success panel; any failure or missing RPC shows a non-blocking amber warning, the account still shows.
- Edit name (admin only, hidden when names/RPC unavailable): button plus inline form in `renderStudentDetail`; delegated listener outside the `detailSelect` block so inline track-card panels work; after save the directory refreshes and `render({reuseAdminRoster:true})` redraws.
- Diploma: First/Middle/Last inputs and the "never saved" copy removed; uses the stored name; blocks with a message pointing to Edit name (or "names not available yet"). Eligibility untouched.
- Header chip and `moduleTopbar` chip: name wrapped in `.acct-chip-name` (nowrap, 14rem ellipsis, hidden below 1024px so the nav row cannot wrap). Topbar aria-label includes the name.
- Reports: cohort report data gets `firstName/lastName`; cohort PDF table 1 has one combined "Name" column (portrait, already 9 columns), table 2 and the progress-snapshot PDF have First Name / Last Name columns; transcript "Student Name" row and transcript/evidence/snapshot/own-record JSON carry first/last; evidence PDF header adds a Student Name line.
- Compliance: "Student name" is now a dynamic field (covered when every row has a stored name, partial/missing otherwise); the static "anonymized ID only" gap was removed and the note says the name is admin-entered, not a verified identity record. Owner may want to revisit whether that satisfies the requirement.

**Skipped**: instructor offboarding JSON filename (optional, ID only); cohort batch roster table (no names until set, per contract); M360 `admin-workspace.js` CSV (S3). No CSV exists in app.js. Diploma certificate footer keeps ID only (name already printed as `fullName`).

**Verified**: `node --check portal/app.js`, `node bin/portal-check.js`, `bash bin/ci-check.sh` all exit 0. Not browser-tested.

### S3 — 2026-11-02 (logged by S4 from S3's report)

- `portal/m360/m360-data.js`: `M360Data.loadNames / nameParts / nameText / nameHtml` (reads `public.students`; falls back to no names on 42703 / PGRST204; one extra `students` query per M360 page load).
- `portal/m360/admin-workspace.js`: student search, table cell, drawer `<h2>`, review-card kicker, CSV First Name / Last Name columns.
- `portal/m360/portfolio.js`, `m360-portfolio-pdf.js`: title/kicker/notice and a "Student name" PDF line. PDF text is Latin-1 only, so non-Latin-1 characters in a name print as `?`.
- `portal/m360/review.js`, `review-attendance.js`, `review-course-state.js`, `review-portfolios.js`: names added. These four look orphaned (no HTML loads them), so they are not exercised.
- `portal/admin-submission-sheet.js`: `studentLabel(row)` in `headerHtml` ("ID · First Last"; the value goes through `esc`).
- `portal/it-support-shared.js`: `itsProveGradingCard` inline name.
- Cache-busts bumped in `m360/portfolio.html`, `m360/review.html`.

### S4 — 2026-11-02 (verify + ship)

- `portal/index.html` cache-busts set to `20261102-names` for `app.js`, `module-labs.css`, `it-support-shared.js`, `admin-submission-sheet.js`.
- Diff review: every name reaching HTML goes through `esc` / `escapeNameHtml` / `accountNameHtml`; `<option>`/status text is plain text. Diploma certificate escapes `fullName`. No debug code, no unrelated edits found. No bugs needing a fix.
- `node --check` on all changed JS: ok. `node bin/portal-check.js`: exit 0. `bash bin/ci-check.sh`: exit 0.
- Browser (Playwright + system Chrome, portal served from the worktree on :8791 with a generated STAGING config, never production; :8768 untouched):
  - Login page and `viewAdmin` with a fake admin and fake rows, no names: renders, 0 names, 0 console errors.
  - Same with a stubbed directory (Test / Account): "Test Account" sits under the ID in the Student Progress cell (block, 10.5px); `<option>` text is `ID — Test Account — program`.
  - Escaping: a name of `<img onerror=...>` renders as text, no script runs.
  - Real staging has no migration: `setAccountName` gets PGRST202 and returns `{ok:false, unavailable:true}`; `loadAccountNames` against a stubbed 42703 sets `available=false`, helpers return "".
  - M360 `loadNames` against a stubbed PGRST204 returns false without throwing. M360 pages were only partly checked (scripts blocked to stop the auth redirect); signed-in M360 and instructor views were not exercised (no sign-in allowed).
- Secret sweep of the diff (sk-, sb_secret, eyJ, AKIA, ghp_, service_role, private keys): clean. No `.env` or config with keys staged.

## Owner steps

1. Migration `supabase/migrations/20261102120000_account_display_names.sql` needs applying.
   - **Staging:** `docs/operations/STAGING_AUTOMATION.md` says the staging-sync workflow runs `supabase db push` against staging after a merge to `master`, so merging the PR applies it. Manual alternative: `supabase link --project-ref xbblgtrfwgeiyttdlbue && supabase db push`.
   - **Production:** the CLI in the main checkout is linked to PRODUCTION (`eokvngifirjgfozzbieu`). The owner confirmed on 2026-11-02 that all prod accounts are synthetic, so the Test / Account backfill there is approved. Run `supabase db push` from the linked checkout once the PR is merged.
2. No edge function deploy needed.
3. After the push, sign in as admin on staging and check: names under IDs, Generate Account with names, Edit name, Diploma auto-fill, and the M360 admin pages.
