# Admin dashboard top-bar compaction sprint

**Request (2026-09-09):** on `#/admin` (Student Progress tab, All Students
view), the 6 stat tiles (Total Student Accounts / Enrolled / Not Enrolled /
Not Started / In Progress / Complete) read as too large, and the action row
(Hide Not Started + Generate New User / Generate New Cohort / Save Progress
File (All Students) / Enrollment Planning / Generate Diploma / Preview &
Generate Report) sits far enough down the page (below the Track
Administration strip) that reaching it takes real scrolling. Ask: shrink the
stat tiles, put both the tiles and the action row directly below the intro
paragraph/tab bar (above Track Administration), and get the whole action row
onto one line.

Scope: `portal/app.js`'s `adminDashboardView` render function only (the
non-track-filtered branch, `!activeTrackCode`). No change to wiring —
everything is addressed by `id`/`data-action` (confirmed: `wireAdmin()` /
`wireCommon()` query by id, not DOM position), so relocating markup is safe.

## Sprint 1 — reorder + shrink (done directly, not delegated)

Moved the "Summary tiles" + "Controls" block (stat tiles, track filter,
Hide Not Started, the 6 action buttons, and the 5 accordion panels they
open — Generate User / Generate Cohort / Generate Diploma / Enrollment
Planning / Report Preview) to render immediately after
`${adminTrackAdministrationStrip(...)}`... no — immediately *before* it, so
it's the first thing in the Student Progress tab body. The average-progress
banner stayed with the table lower down (it wasn't part of the request).

Stat tiles: `px-3 py-2.5` → `px-2.5 py-1.5`, number `text-xl` → `text-base`,
label `text-[10px]` → `text-[9px]`, grid `gap-2.5` → `gap-2`, `grid-cols-2
md:grid-cols-3 xl:grid-cols-6` → `grid-cols-3 md:grid-cols-6` (fits one row
sooner).

Action row: the old two-group `justify-between` layout (filter+checkbox on
the left, buttons on the right, which wrapped to two lines) was flattened
into one `flex flex-wrap items-end gap-2` row containing the filter select,
the Hide Not Started checkbox, and all 6 buttons in sequence. Buttons
shrunk `px-4/5 py-2.5 text-sm` → `px-2.5/3 py-1.5 text-xs`. This was done as
a single precise `Edit` (large single-file template-literal cut/move — kept
in my own hands rather than a fresh subagent retyping ~150 lines verbatim,
to avoid transcription drift) rather than spawned out, per Alex's
"don't delegate content/structure a cheap model would have to reinvent or
retype at high risk" pattern from the promptware-killchain sprint playbook.
- [x] Applied
- [x] `node --check portal/app.js` clean
- [x] `git diff` read in full, matches intent, no stray changes
- [x] Live-verified: the two roster-provisioned credential sets in
      `bin/.roster-output/*.csv` (including `ADMIN-1787915949733.csv`) no
      longer authenticate against the linked Supabase project (`sign-in ...
      not recognized` — a pre-existing staleness, same as `user2`/`user2`
      per [[mnt-academy-portal]], unrelated to this sprint). Verified the
      render itself instead: called `viewAdmin(...)` directly in the page's
      own JS context with synthetic rows (12 students, mixed enrollment/
      completion) and `wireAdmin(...)` to re-wire it, both in the real
      `app.js` this session edited. Confirmed: stat tiles + full action row
      now render immediately below the intro paragraph, above Track
      Administration; every accordion panel (`Generate New User` checked
      directly) still opens via its button, unchanged ids/wiring; no
      console errors. Button row fits one line at ≥~1450px CSS width and
      wraps to two short lines below that (this sandbox's Chrome window
      capped at 1067px CSS width regardless of `resize_window` — a sandbox
      limit, not a bug in the change) — reasonable responsive behavior,
      not chased further to force one line at every width.

## Sprint 2 — cache-bust + close out

- [x] Bumped `portal/index.html`'s `app.js?v=...` to
      `20260909-admin-topbar`
- [x] Archived this doc to `archive/`
- [ ] **Not committed.** `git status` at close-out showed `portal/app.js`,
      `portal/index.html`, `HANDOFF.md`, `LATEST_PROGRESS.md`, and
      `bin/portal-check.js` already carrying substantial *other*
      uncommitted, unrelated changes from a same-day session (M360
      transcript records, activity-monitor search, master-roster scoping —
      none of it reviewed or verified here). `portal/app.js` in particular
      mixes those changes into the same file as this sprint's edit, so a
      plain `git add`/`commit` on it would silently bundle in unreviewed
      work under this sprint's message. Left the whole tree uncommitted
      rather than risk that on a live, public, real-student-facing repo —
      Alex should review and commit (or ask for the two hunks to be
      isolated) once he's looked at the other session's changes too.

**Not pushed to `origin/master`** either way — repo auto-deploys on push to
a public, real-student-facing site; push is left for Alex to trigger
explicitly regardless of commit state.
