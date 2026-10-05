# Security audit — triaged issues (2026-10-05)

Independent audit of the portal + Supabase backend, run against the
checklist in `docs/LLM_CODEBASE_AUDIT_GUIDE.md` (from a Gemini review). That
guide is a generic list of things LLM-written code tends to get wrong; it
named no file or line in this repo. Every item below was **reproduced**
before being logged, not inferred from reading code.

**Method.** All 72 migrations replayed on the local stack, then exploited
as real API roles (`SET ROLE authenticated|anon` + `request.jwt.claims`,
exactly what PostgREST sets) inside rolled-back transactions. The linked
production project had the identical migration set
(`supabase migration list --linked`). Production was only ever *read*
(single `SELECT` statements via `supabase db query --linked`).

## Status board

```
Triaged issues   6
Fixed + live     3  (#1, #2, #5) and #3 for lab attempts + artifacts
Partly fixed     2  (#3 capstone/evidence, #6 scripts half via PR #43)
Open             1  (#4)  + pre-launch session-cap reset
```

| # | Severity | Issue | Status |
|---|---|---|---|
| 1 | Critical | Students could write their own passing lab scores and approvals | ✅ Fixed, live 2026-10-05 |
| 2 | High | Students could set `module_progress.admin_override` | ✅ Fixed, live 2026-10-05 |
| 3 | High | Submitted work could be edited or deleted afterwards | 🟡 Lab attempts + artifacts fixed; capstone submissions + completion evidence still student-writable |
| 4 | Medium | Geofence, UEBA and the session cap only run if the browser calls them | ⬜ Open — design work |
| 5 | Medium | Scheduled-job admin guard was always true; anon could run both jobs | ✅ Fixed, live 2026-10-05 |
| 6 | Low | Disenrolled students keep write access; scripts defaulted to production | 🟡 Scripts half fixed by PR #43; enrollment half open |

Fix: `supabase/migrations/20261005120000_instructor_approval_gate_and_write_lockdown.sql`
(owner ran `supabase db push`; verified live afterwards).
Regression test: `supabase/tests/student_write_lockdown.sql`, run with
`bin/db-security-check.sh` against the local stack (20 checks; fails on the
pre-fix schema at the first check).

## Issues

### 1 · Critical · Self-scored completion and credit hours — ✅ fixed

**Reproduced:** one script as a fresh SOCAN student inserted a passing
`lab_attempts` row per mapped lab (stamping soc-01's own `reviewed_by`) and
the database answered 12/12 modules verified, 12 credit-hour awards (4,200
minutes = 70 h) and a completion-reporting snapshot. Cause: scores are
computed in the browser (`portal-client-scorer-v1`) and `lab_attempts_own`
was `for all`, so students owned `score`, `pass_threshold` and every review
column; only soc-01 needed an approval at all.

**Owner rule:** a module unlocks the next one immediately after its Prove It
is approved by an instructor — every module, every time.

**Fix:** students may only read and insert their own attempts; an insert
trigger strips review fields and forces `pass_threshold = 70`; staff can
update only `reviewed_at`/`reviewed_by`/`redo_requested` and must sign
their own reviews; `student_verified_module_progress` requires an
instructor approval (by someone other than the learner) for every module.
Portal shows an "Awaiting Approval" module card state.

**Production check (read-only):** no self-reviewed attempts, no
out-of-range scores. Five accounts created 2026-08-28..09-01 hold modules
completed before approvals existed; they now show pending until approved
in the Grading tab (4437023872-SOCAN, 9334491415-SOCAN, 8987495051-SOCAN,
5520852787-SOCAN, 7159302294-HDESK).

**Follow-ups:**
- Modules whose Prove It writes several attempt rows (M07 writes 3, M08
  writes 2) need every row approved. Grading UX may want one "approve
  submission" action — see `LIVE_COURSE_UAT_AND_GRADING_UX.md`.
- `course_module_labs` must list only labs the portal actually submits, or
  the module can never verify (UAT bug 8, separate migration in progress).
- Long term: move scoring server-side; the browser score is only a pregrade.

### 2 · High · Student-writable admin override — ✅ fixed

`admin_override*` columns were covered by the table-wide UPDATE grant and
the own-row policy. Now column-scoped grants; only the security-definer
`admin_set_module_override()` writes them. Production: the one existing
override was set by a real admin.

### 3 · High · Post-submission tampering — 🟡 partly fixed

Fixed: lab attempts can't be updated or deleted by students; portfolio
artifacts are insert-only (an edit previously kept the *original*
`content_sha256`, so the integrity hash in reports no longer matched).
Production: the one artifact's hash matches.

Open: `capstone_submissions` and `module_completion_evidence` stay
student-writable because the portal upserts them. The official capstone
outcome lives in admin-only `capstone_reviews`, and credential awards did
not fire on a forged completion, so impact is lower. Next action: switch
the portal to insert-only writes, then revoke UPDATE/DELETE.

### 4 · Medium · Login security is client-orchestrated — ⬜ open

`signIn()` in `portal/app.js` calls UEBA, the session record insert and
the geofence. A direct `POST /auth/v1/token` with valid credentials skips
all three and still gets a working session — no cap, no geofence, and no
idle sign-out (the sweep only closes sessions it has a record for).

Also: the idle sweep revokes Auth sessions only when **every** session of
the account is idle, account-wide, so one active device keeps an idle
device's refresh token alive.

Proposed fix: the edge function creates the `site_sessions` row after the
geo/UEBA checks, keyed by the JWT `session_id` claim, and write policies
require an open session row for `auth.jwt()->>'session_id'`. Revoke per
session rather than per account.

**Owner decision:** the 10-open-sessions-per-account cap
(`20260907140000_development_session_cap_ten.sql`) is acceptable **only
while staging**; lower it before the Nov 2 launch (students were 2).

### 5 · Medium · Always-true admin guard — ✅ fixed

`is_admin() or current_user = 'postgres'` inside SECURITY DEFINER: there
`current_user` is the function owner, so the check always passed and anon
could run `archive_expired_cohorts()` and `close_idle_site_sessions()`.
Now `session_user = 'postgres'` (pg_cron runs both jobs as postgres;
PostgREST requests are always `authenticator`), and anon EXECUTE is
revoked. Impact had been limited to running the same sweeps early.

### 6 · Low · Enrollment and script targets — 🟡 partly fixed

- `has_module_access()` ignores `is_enrolled`, so a disenrolled student can
  still write attempts. Next action: add the enrollment check to write
  policies only (reads stay open so students keep their records).
- `bin/*` scripts defaulting to the production URL: fixed by PR #43
  (`bin/lib/supabase-target.js`).

## Checked and clean

| Checklist item | Result |
|---|---|
| Privilege escalation via `students` | Students cannot set `is_admin`/`is_instructor`/`is_enrolled` |
| IDOR on student rows / stored passwords | Other students' rows and `student_credentials` not readable |
| Edge function auth (`admin-provision`) | Caller verified from JWT server-side; body never trusted |
| Faculty message tampering | `student_messages_only_mark_read` trigger blocks edits |
| Silent error swallowing | All 16 empty `catch {}` wrap `localStorage`/`sessionStorage` — correct use (false positive) |
| Fallback secrets / committed keys | None; service-role key never committed |
| CORS `*` on edge functions | Acceptable: bearer-token auth, no cookies |
| Stored XSS from student text into staff views | Escaped everywhere sampled (messages, case tickets, capstone) — sample, not exhaustive |
| Session-cap race (count then insert) | Possible but minor while the cap is 10 |
