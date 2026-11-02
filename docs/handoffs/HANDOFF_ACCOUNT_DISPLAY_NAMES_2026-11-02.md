# Handoff: account display names (2026-11-02)

## Next AI — start here

**Goal (owner request):**
- Show **first + last name** with every account number (e.g. `1625151945-HDESK`)
  across the whole web app and every track: SOC Analyst, Help Desk, AI/ML,
  Electrical, M360.
- Put it small, just below the ID, without changing layout.
- **Generate New User** gets required First/Last inputs.
- **All existing accounts** become `Test` / `Account`.
- **Generate Diploma** auto-fills from the stored name (no manual inputs).

Full spec, contract, render inventory and per-sprint logs:
`docs/workstreams/ACCOUNT_DISPLAY_NAMES.md` (on branch
`feat/account-display-names`).

## Status at handoff

| Item | State |
|---|---|
| PR #94 `feat/account-display-names` (migration, `portal/app.js`, CSS, sheets, Help Desk card) | Open, CI **6/6 green**, **not merged** |
| PR #95 `feat/account-display-names-m360` (M360 pages only) | Open, CI **12/12 green**, **not merged** |
| Staging DB (`xbblgtrfwgeiyttdlbue`) | Migration `20261102120000_account_display_names.sql` **applied** by owner. Verified 15/15 accounts = Test/Account |
| Production DB (`eokvngifirjgfozzbieu`) | **Not pushed.** Owner approved the backfill (all prod accounts are synthetic, first class not launched) |
| Localhost :8768 | Now serves the **feature worktree** `~/mnt-account-names` (staging). Admin panel shows names, 0 console errors |
| Main checkout `~/Mission_Next_Technical_Academy_SOC_Analyst_course` | Untouched. Still at `edc1e53` (behind master), with the owner's uncommitted WIP in `portal/index.html` + `portal/theme.css`. Its dev server was **stopped** to free :8768 |

## Why two PRs

`bin/m360-gate-boundary.py` and the M360 wave workflows reject any PR that
mixes `portal/m360/*` with `portal/app.js` or a migration. So the M360 files
were split into #95.

wave7 and wave9 also grep for pinned cache-bust prefixes
(e.g. `admin-workspace.js?v=20260913`). M360 cache-busts therefore use
`?v=<old>-names`, which passes the prefix grep.

## Design (short)

- **Where the names live:** `public.students.first_name` / `last_name`.
  `profiles` was dropped in `20260828160000_simplify_schema.sql`, and
  `student_id` is the account number.
- **Read access:** no RLS change. The existing students policies (self /
  admin / assigned instructor) already expose the new columns.
- **Writes:** only through `admin_set_account_name(uuid, text, text)`. It is
  `security definer` and gated by `is_admin()`. No edge-function deploy is
  needed.
- **New-user flow:** Generate Account provisions through `admin-provision`,
  looks up the new user's uuid in `students`, then calls `setAccountName()`.
- **Portal helpers (`portal/app.js`):**
  - `loadAccountNames()` and `ACCOUNT_NAMES` (a directory keyed by
    `student_id` / `user_id`).
  - `accountNameText` / `accountNameHtml` / `accountLabelText` for rendering.
  - `isMissingAccountNameSchema()` (42703/42883/PGRST204/PGRST202): when it
    matches, the page renders without names.
- **M360:** `M360Data.loadNames/nameText/nameHtml` in `portal/m360/m360-data.js`.
- **CSS:** `.acct-name` / `.acct-name--inline` in `portal/module-labs.css`.
  The header and topbar name is hidden below 1024px.
- **Generate New Cohort:** batch-generated accounts get **no name** until an
  admin uses **Edit name** (student detail panel).

## Verified vs NOT verified

Verified:
- Local `node --check`, `bin/portal-check.js`, `bin/ci-check.sh`.
- Browser fallback with no names: 0 console errors.
- Stubbed names render under the ID.
- A hostile name is escaped.
- Staging migration applied and backfill confirmed.
- The real admin panel on localhost shows names.
- Gitleaks is clean.

**NOT verified signed-in (do before merging):**
- Generate New User with names. This creates one synthetic staging account,
  so ask the owner first.
- Edit name.
- Diploma auto-fill and the block when a student has no name.
- Instructor dashboards (SOCANINST/HDINST).
- Student module pages on each track (topbar chip).
- M360 review/portfolio pages and PDF/CSV exports.

Screenshots: `/tmp/claude-1000/-home-alex/bdcd3bcb-7fe2-4dfe-a500-59f2b1e8693c/scratchpad/`
(admin-names.png, admin-row-named.png, m360_*.png). These are temporary.

## Open owner decisions

1. **Megan** reportedly asked to hold off before assuring the fix. Get her
   exact concern before merging. The change touches ~400 lines of the shared
   `portal/app.js`.
2. **Compliance field:** S2 made "Student name" a dynamic field, labelled
   admin-entered, not verified identity. OK?
3. **Header chip:** the name is hidden on screens <1024px. OK?
4. **PDFs:** non-Latin-1 characters in names become `?`.
5. **M360 lookup:** M360 does a second `students` query per page load (could
   be folded into existing selects later).
6. **Orphaned files:** `portal/m360/review*.js` were edited but look
   orphaned (no HTML loads them).

## Remaining steps (in order)

1. With owner OK, run the unverified flows above in the owner's signed-in
   staging admin tab. Playwright is attached over CDP to the owner's Chrome:
   `chromium.connectOverCDP('http://127.0.0.1:9222')`,
   `NODE_PATH=/home/alex/node_modules`. Chrome profile `~/.pw-chrome-profile`.
   The portal's client global is `mntSupabase`.
2. Merge **#94 then #95**. The auto-mode classifier **blocks `gh pr merge`**
   ("Merge Without Review"), so the owner merges in GitHub or explicitly
   directs a direct push to master. The owner suggested: a worktree on
   master, merge, push, delete the feature branches. Get explicit go-ahead
   first.
3. After the merge, staging-sync re-applies the migration on staging (a
   no-op, already applied) and Pages deploys the prod frontend.
4. The owner runs the prod DB push. `~/mnt-account-names` is currently
   **linked to staging**, so re-link it first:
   ```
   cd ~/mnt-account-names
   supabase link --project-ref eokvngifirjgfozzbieu
   supabase db push --dry-run
   supabase db push
   ```
   Push only if the dry run lists just `20261102120000_account_display_names.sql`.
   Do **not** run `migration repair` / `db pull`. The earlier "remote
   migration versions not found" error came from the main checkout being
   behind master, not from drift.
5. Cleanup:
   - Delete the branches `feat/account-display-names` and
     `feat/account-display-names-m360`.
   - `git worktree remove ~/mnt-account-names ~/mnt-account-names-m360`.
   - `cd ~/mnt-account-names && bin/dev.sh stop`, then restart dev from the
     main checkout.
   - The main checkout's `git pull` fails on its dirty `portal/index.html`.
     Ask the owner whether to keep or drop that 10-17 WIP.

## Owner's binding requirements (apply to ALL work in this handoff)

- **Zero side effects.** Changes must not disturb the existing user
  experience on any track.
- **Unobtrusive code fixes.** Solve the problem with the smallest change
  that fully works. No redesigns or UX churn.
- Focus on finding the solution. The owner does not see the
  session-persistence problem on their own SOC track; it is solved there.

## Next workstream: Help Desk saved-state / persistence (port PR #79's approach)

**Goal:** give Help Desk (and then every other track) the same "nothing a
student types is ever lost" guarantee SOC got from **PR #79**. The owner says
#79 "fool-proofed everything".

**PR #79:**
- Branch `fix/prove-it-submit-latch`, title "SOC: keep every edit and never
  fake a submit (lost edits B9 + Prove It submit latch, M01–M12)".
- **Still OPEN, not merged.** It needs the owner's merge (classifier blocks
  `gh pr merge`).
- The owner may need `bin/dev.sh start --production` to finish verifying
  it. That is the owner's call; only start production when they ask in the
  session.

Read first, on that branch:
- `docs/handoffs/SAVE_AND_SUBMIT_FIXES_2026-10-21.md`
- `docs/handoffs/BUG_2026-10-17_PROVE_IT_BELOW_PASS_SILENTLY_DROPPED.md`
- `docs/handoffs/SOC_UAT_PROGRESS_CHECKPOINT_2026-10-21.md`
- the shared helpers `recordProveItAttempt` / `proveItLatchIsStale` in
  `portal/app.js`
- `portal/lab-runtime.js`
- `portal/module-registry.js`

**The owner's proven test method (use it as the acceptance test for EVERY
module):**
1. Fill **every** input field in the module (Learn It, Practice It, Prove It,
   notes, tickets, free text).
2. Save.
3. **Clear local cache/storage, then hard refresh** (and ideally sign in from
   a fresh browser profile).
4. Check what stuck. Anything that only lived in localStorage and vanished
   is a bug.
5. Repeat for ALL modules on the track.

**Likely work:**
- Any Help Desk field that only persists in browser storage needs a durable
  Supabase home. Expect **new columns or tables, or new keys in an existing
  jsonb payload**.
- Prefer extending existing progress/attempt payloads over new tables (least
  obtrusive).
- Ship any migration as a local file; the owner runs `supabase db push`
  (staging first).
- Help Desk modules: `portal/it-support-module-*.js` and
  `portal/it-support-shared.js`.
- Note the earlier finding: HDESK M03–M11 save only
  `{source:'mnt-coach-complete'}`, and M12 writing goes to
  `portfolio_artifacts` (`docs/workstreams/HDESK_SUBMISSION_SHEET_HANDOFF.md`).
- Localhost now runs latest master, including #90 (Help Desk M1 Prove It
  rework).
- Help Desk is not Alex's track (other devs, incl. Megan, own parts of it).
  Keep changes minimal and flag them for those owners.

**Merge-order warning:** #79 and #94 both touch `portal/app.js`,
`portal/index.html`, `portal/module-labs.css`,
and `portal/admin-submission-sheet.js`. Whichever
merges second needs a rebase. Re-run `bin/ci-check.sh` and the
fill → save → clear cache → hard refresh test after that rebase.
