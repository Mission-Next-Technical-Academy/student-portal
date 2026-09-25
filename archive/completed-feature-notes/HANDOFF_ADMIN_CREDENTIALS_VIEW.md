# Handoff: admin panel "view credentials" feature

Picked up mid-session, interrupted before finished. This file is the entry
point for whoever continues it — read this before touching the related
files. Follow this project's doc lifecycle rule (`archive/README.md`, also
summarized in `CLAUDE.md`): once every item below is done and verified,
`git mv` this file into `archive/` rather than leaving it at the root.

## What was asked

On `http://127.0.0.1:8768/#/admin`, in the Student Progress table, clicking
a student's row should reveal their login credentials (student ID +
password) — "perhaps it slides down... Make it clean, like the same
typography as the current site."

## Decisions made this session (already settled — do not re-litigate)

- **Passwords will be stored in plaintext in a new Supabase table**,
  admin-gated by the same `is_admin()` RLS function every other admin-only
  table in this repo already uses. This was discussed at length with the
  user:
  - Supabase Auth only ever stores a one-way bcrypt hash
    (`auth.users.encrypted_password`) — it cannot give a password back
    after creation, which is why `admin-provision`'s response has always
    shown a generated password exactly once.
  - The user proposed storing credentials in git instead (private repo).
    Rejected: this repo is **public on GitHub right now**
    (`Mission-Next-Technical-Academy/student-portal`, confirmed via
    `gh repo view --json isPrivate` → `false`) with 4 collaborators beyond
    the owner (`kkr1pt3k`, `cyberdude88`, `pabs-ai`, `randy608`). Git also
    can't be written to live from the Edge Function without a repo-write
    GitHub token (a bigger secret than the passwords it'd protect), and
    git history is effectively permanent (can't rotate/delete a compromised
    password without a force-push rewrite).
  - The user separately raised making the repo private as a follow-up
    step. **That was never acted on** — still open, see "Not started"
    below.
  - The user's final justification for plaintext storage: these are
    isolated training accounts, not real identities, and the site isn't
    live with real students until November — so the usual "never store
    plaintext secrets" risk doesn't apply here at the level it would for
    real users. Accepted on that basis. **Do not reuse this same
    plaintext-storage pattern for any future real-identity user store**
    without re-raising the tradeoff — the migration file's own header
    comment says this too.

- **Separately, the user asked to delete all "Disenrolled" students** to
  declutter the admin table. This was NOT a blanket delete — the codebase
  has a locked, deliberate rule (see
  `supabase/migrations/20260901121000_cohort_archival_engine.sql`, "Case
  B") that a student with any real activity or a completed enrollment
  episode is *archived*, never deleted, because compliance-reporting rows
  (`enrollment_periods`, `credential_awards`, `completion_reporting_snapshots`)
  must never be pruned for a student who ever had real activity. Before
  deleting anything, this was verified directly against the live linked
  project (`supabase db query --linked`): **all 73 disenrolled students
  had zero rows anywhere** (no `enrollment_periods`, `module_progress`,
  `lab_attempts`, `capstone_submissions`, `credential_awards`,
  `student_geography_classifications`, `student_course_hour_awards`,
  `completion_reporting_snapshots`) — i.e. every one was a true unused
  placeholder, the exact same safe condition Case B already uses. **This
  delete has already been run and completed** — see "Done" below. Do not
  repeat it blindly for future disenrolled students without re-checking
  activity first; the "no compliance risk pre-November" justification the
  user gave applies to *this* dataset, not as a standing policy.

## Done (verified against the live linked Supabase project, `eokvngifirjgfozzbieu` / "MNT Academy")

**Deployment update, 2026-09-01:** all six pending migrations, including
`20260901130100_student_credentials.sql`, are recorded on the remote. The
`admin-provision` Edge Function is active (deployed with server-side
bundling after the local bundler stalled). An unauthenticated POST correctly
returns HTTP 401 before the function handler. The only feature-specific work
still outstanding is the logged-in browser smoke test in item 2 below.

1. **Deleted 73 disenrolled, zero-activity student accounts** via
   `supabase db query --linked` running:
   ```sql
   delete from auth.users
   where id in (
     select user_id from public.students
     where track_code <> 'ADMIN' and is_enrolled = false
   );
   ```
   Cascaded cleanly through `students`, `login_events`, `site_sessions`
   (all `on delete cascade`). Verified after: 7 enrolled students remain,
   0 disenrolled, on the live project. **Nothing further needed here.**

2. **New migration deployed**:
   `supabase/migrations/20260901130100_student_credentials.sql`
   - New `public.student_credentials` table: `student_id` (PK, FK to
     `students.student_id` on delete cascade), `password`, `created_at`.
   - RLS: `select` gated by `is_admin()`, same as `public.students`. No
     write policies — service-role only, matching `students`' own posture.
   - Also updates the stale comment on `public.students` that claimed
     "Password is never stored" — no longer true once this table exists.

3. **Edge Function deployed**:
   `supabase/functions/admin-provision/provisioning.ts`, inside
   `provisionOneAccount()` — right after the existing `students` row
   insert, added a non-fatal insert into `student_credentials`:
   ```ts
   const { error: credentialsError } = await serviceClient
     .from('student_credentials')
     .insert({ student_id: studentId, password });
   if (credentialsError) {
     console.error(`student_credentials insert failed for ${studentId}: ${credentialsError.message}`);
   }
   ```
   Deliberately non-fatal (logged, not thrown) — the `students` row and
   the one-time password in the function's return value are still valid
   even if this insert fails.

4. **Frontend markup added** in `portal/app.js`'s `viewAdmin()` (the admin
   Student Progress table, `#admin-table-body`):
   - Line ~4367: the Student ID cell's text is now wrapped in a
     `<button data-view-credentials="${esc(row.student_id)}" aria-expanded="false">`,
     with a chevron icon (`<i class="ri-arrow-right-s-line" data-cred-chevron="...">`)
     that should rotate on open.
   - Line ~4409–4415: a new sibling `<tr data-cred-row="...">` immediately
     after each student's main `<tr>`, with a `<td colspan="10">` (the
     row has 10 `<td>`s today, not 9 — count them again if the table
     structure changes) containing:
     ```html
     <div class="overflow-hidden transition-[max-height] duration-300 ease-out" style="max-height: 0" data-cred-panel="${esc(row.student_id)}">
       <div class="px-6 py-4 bg-[#f9fbfd]" data-cred-panel-inner="${esc(row.student_id)}"></div>
     </div>
     ```
     This is the slide-down panel shell — collapsed by default
     (`max-height: 0`), to be expanded via JS by setting `max-height` to
     the panel's `scrollHeight`.

## Remaining verification

1. **Click handler / fetch logic is complete.** The helper after
   `wireSelectAllBlocks` (defined at `portal/app.js:4124`)
   renders the panel, loads the admin-only credential row on first open,
   supports click-to-select, and closes it on the next click. It is wired
   before the existing snapshot action in `wireAdmin()`. The code below is
   the implemented behavior, retained as a maintenance reference.

   ```js
   async function toggleCredentialsPanel(studentId, btn) {
     const panel = document.querySelector(`[data-cred-panel="${studentId}"]`);
     const inner = document.querySelector(`[data-cred-panel-inner="${studentId}"]`);
     const chevron = document.querySelector(`[data-cred-chevron="${studentId}"]`);
     if (!panel || !inner) return;
     const isOpen = btn.getAttribute('aria-expanded') === 'true';
     if (isOpen) {
       panel.style.maxHeight = '0px';
       btn.setAttribute('aria-expanded', 'false');
       if (chevron) chevron.style.transform = '';
       return;
     }
     btn.setAttribute('aria-expanded', 'true');
     if (chevron) chevron.style.transform = 'rotate(90deg)';
     if (inner.dataset.loaded !== '1') {
       inner.innerHTML = `<p class="text-sm text-gray-400">Loading credentials…</p>`;
       panel.style.maxHeight = '48px';
       const { data, error } = await mntSupabase
         .from('student_credentials')
         .select('password, created_at')
         .eq('student_id', studentId)
         .maybeSingle();
       if (error) {
         inner.innerHTML = `<p class="text-sm text-red-600">Could not load credentials — ${esc(error.message)}</p>`;
       } else if (!data) {
         inner.innerHTML = `<p class="text-sm text-gray-500">No stored password for this account — it was likely created before this feature existed, or the write failed at creation time.</p>`;
       } else {
         inner.innerHTML = `
           <p class="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Login Credentials</p>
           <pre data-select-all tabindex="0" class="inline-block bg-white border border-gray-200 rounded-lg p-3 text-sm font-mono text-gray-900 cursor-text overflow-x-auto" title="Click to select all">Student ID: ${esc(studentId)}
   Password:   ${esc(data.password)}</pre>
           <p class="text-xs text-gray-400 mt-2">Generated ${new Date(data.created_at).toLocaleDateString()}</p>`;
         wireSelectAllBlocks(inner);
       }
       inner.dataset.loaded = '1';
     }
     panel.style.maxHeight = panel.scrollHeight + 'px';
   }
   ```

   `wireAdmin()` contains the credential branch before the existing
   `data-admin-snapshot` action:
   ```js
   tableBody.addEventListener('click', async (event) => {
     const credBtn = event.target.closest('[data-view-credentials]');
     if (credBtn) {
       await toggleCredentialsPanel(credBtn.getAttribute('data-view-credentials'), credBtn);
       return;
     }
     const snapshotBtn = event.target.closest('[data-admin-snapshot]');
     // ...existing code unchanged from here
   ```

2. **Test end-to-end in the browser** at `http://127.0.0.1:8768/#/admin`:
   - Click an existing (pre-feature) student's ID → panel should slide
     open and show the "No stored password for this account..." message
     (all 7 remaining students predate this table, so this is the
     expected/normal case for all of them right now).
   - Use "Generate New User" to create a fresh account, then click that
     new student's ID in the table → should show the real stored
     password, matching what was shown in the one-time reveal.
   - Verify the panel toggles closed on a second click, and that clicking
     one student's row doesn't affect another's panel.
   - Verify typography/spacing reads as "clean" and consistent with the
     rest of the table (this was the user's explicit ask) — spot-check in
     both a quick glance and against the existing "Generate New
     User"/"Generate New Cohort" result panels' look
     (`portal/app.js` ~line 4874 and ~4931) since those are the closest
     existing precedent for how this codebase displays credentials.

3. **Repo privacy — still an open thread, not acted on.** The user
   floated making `Mission-Next-Technical-Academy/student-portal` private
   and revisiting the 4 existing collaborators
   (`kkr1pt3k`, `cyberdude88`, `pabs-ai`, `randy608`), then moved on to
   other questions without confirming. Do not flip visibility or remove
   any collaborator without asking the user explicitly which (if any) to
   remove — that was called out clearly in-session as their call, not
   something to guess at.

## Files touched this session (uncommitted — nothing has been committed)

- `supabase/migrations/20260901130100_student_credentials.sql` (new, untracked)
- `supabase/functions/admin-provision/provisioning.ts` (modified)
- `portal/app.js` (modified — markup only, JS wiring still missing per above)

Two other untracked migrations already existed in the working tree before
this session started and are unrelated to this work:
`20260901103000_completion_integrity_guards.sql`,
`20260901110000_login_events.sql`. `CLAUDE.md` was also already modified
before this session started, also unrelated.
