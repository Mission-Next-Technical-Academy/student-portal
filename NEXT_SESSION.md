# Next session — start here

## URGENT handoff (2026-08-28, later session — read before anything else)

The curriculum-alignment wave is now fully closed out. Commit `57ac7cc` (Sprints
A-F + H's admin dashboard rebuild + backend schema-simplification migrations)
was already pushed to `origin/master` as of the start of this session. Three
more commits landed **this session, all local only, none pushed**:

1. `e4903e1` — **Admin-only redirect.** Router now sends any `user.isAdmin`
   session to `#/admin` on every navigation path, not just post-login.
2. `227bb5c` — **Sprint H.1, student detail drill-down.** Dropdown + detail
   panel on the admin dashboard. Building it surfaced a real gap: `module_progress`
   / `lab_attempts` / `capstone_submissions` only had "own row" RLS policies, so
   admin queries against them (including Sprint H's own dashboard rollups) were
   silently seeing only the admin's own data. Fix is in
   `supabase/migrations/20260828170000_admin_student_detail.sql` — **written,
   not applied to the live database.** Applying it (`supabase db push`) is the
   next concrete unblock, same as Sprints 1-4 in the "Auth, backend
   simplification" section below — needs the site owner to run it or grant a
   permission rule.
3. `0ef74c8` — **Sprint G, final QA sweep.** Full syntax/render/browser pass,
   prohibited-language scan, stable-key diff audit, exact-hours reconciliation
   — all clean. Found and fixed two real bugs along the way: `render()`'s
   admin-redirect block reassigned a `const hash`, which threw and left every
   admin session on a blank page since `e4903e1` landed (fixed to `let`, so if
   you're reading this before `e4903e1`+`0ef74c8` are both applied, the admin
   redirect alone is not safe to rely on) — and several prohibited-language
   leftovers from before the Sprint C rename ("Detection Engineering",
   "Vulnerability Management", "Digital Forensics" in skill-tag chips and
   summary copy). Full list in `HANDOFF.md`'s dated entry.

**Nothing from this session is pushed.** `git log --oneline -4` from `master`
should show `0ef74c8`, `227bb5c`, `e4903e1`, `57ac7cc` in that order — confirm
before assuming any of this is live. Pushing `e4903e1`/`227bb5c`/`0ef74c8`
(and separately, applying the new migration) both remain site-owner-gated
actions per the standing rule in `architecture.md`.

`CURRICULUM_ALIGNMENT_ARCHITECTURE.md` section 0 now shows every sprint
(A-H, the redirect, H.1, G) as done, each with its commit hash. Release
readiness is still gated on external sign-offs — see that doc's section 9
"Release boundary" (Form 301 comparison, curriculum-lead/compliance-
reviewer/faculty approval) — none of that changes just because the repo is
now internally consistent.

Also still true from the prior session, unchanged: Sprint H.1's live
select-a-student flow could not be exercised end-to-end because the test
DB currently has zero students with real progress — that needs a real
authenticated session with actual student activity to verify.

---

Repo: `~/Mission_Next_Technical_Academy_SOC_Analyst_course` (branch `master`).

```bash
cd ~/Mission_Next_Technical_Academy_SOC_Analyst_course
bin/launch.sh                 # portal on :8768, simulator/capstone on :8767
node bin/portal-check.js      # every module lab renders
node bin/lab-state-check.js   # lab state stays isolated across resets
node bin/render_all.js        # every simulator view renders; current baseline is 129/129
```

Student account for the SOC Analyst track: `user2` / `user2`.
Module 1 lives at `http://127.0.0.1:8768/#/program/soc-analyst/module/1`.

## What just changed (2026-08-18, this session)

Update 2026-08-19: Wave 3 is complete. Modules 07–09 now provide isolated
semi-independent network/email, vulnerability/exposure, and incident-response labs.
All three passed integration and browser QA. The old `purview/audit` render baseline
was also fixed; `node bin/render_all.js` is now 129/129 with zero dead routes.

Three foundation commits plus the final feedback commit, all verified in headless Chrome:

- `034d271` — Wave 2 module labs (Modules 04, 05, 06) integrated, plus a shared-runtime
  fix: `LabRuntime.freshState()` shallow-spread its defaults, so learner selections
  mutated each module's `MODULE_*_DEFAULT_STATE` constant and a lab reset handed the
  polluted arrays back. Defaults are deep-cloned now; `bin/lab-state-check.js` guards it.
- `95bb88e` — Module 1 rework: walkthrough starts in the alert queue, the student performs
  every action, and the investigation timeline is filled in rather than revealed.
- `873df15` — the coach became a bottom instruction bar that advances on the student's
  action instead of a floating card with a Next button.
- Final Module 1 feedback pass — removed the floating M launcher and intermediate coach buttons;
  all four actions use amber waiting states and auto-advance; restart clears stale sign-in
  filters; timeline facts are strict correct-answer gates with green success feedback and
  clearly boxed character masks whose fixed punctuation is skipped during typing or paste.

Full detail is in `HANDOFF.md` (bottom four sections) and
`MODULAR_LAB_PROGRAM_PROGRESS.md` (Wave 2 gate review).

## Module 1 flow as it now stands

1. Foundations lessons and the alert card (portal).
2. **Required console walkthrough** — 5 coach steps starting at `#/defender/alerts`:
   open alert A1701 → read the alert pane and take its highlighted "Investigate sign-ins
   for this account" pivot → filter the log to j.santos → read the eight failures and
   open the highlighted 09:09:41 success → return.
   Steps marked `require` accept a click only on the highlighted control; all four action
   steps show a non-clickable amber waiting chip, briefly turn green when complete, and
   auto-advance when their `check()` passes. There is no floating launcher or Next press.
3. **Investigation timeline, filled in** — facts 1-3 are fill-in-the-blank sentences
   (count, account, IP, time, result, location, device status, risk) typed from what the
   log showed. Each typed character has its own box; fixed punctuation is skipped when a
   full value is typed or pasted. Normalized matching, marked wrong fields, hints after
   the first miss, and all hints after the second. There is no answer bypass: each fact
   must be correct to unlock the next one, and a correct answer pops green. Fact 4
   (service-desk callback) is handed over. Unscored — practice, not assessment.
4. **Triage worksheet** — the graded artifact, unchanged (pass mark 70).

## Where the pieces live

| Concern | File |
|---|---|
| Module 1 view, wiring, scoring | `portal/module-01.js` |
| Module 1 scenario, evidence, blanks (`template` / `blanks` / `accept`) | `portal/data.js` (`MODULE_ONE_ALERT_ORIENTATION`) |
| Module 1 styles including `.m01-blank` | `portal/module-labs.css` |
| Coach engine: bar, spotlight, scope lock, required-action lock, auto-advance | `ui/coach.js` |
| Coach scripts (steps, `instruction`, `require`, `check`, `waitLabel`, `nudge`) | `ui/coach-data.js` |
| Coach bar + scrim + required-control styles | `ui/styles.css` (search `coach-bar`) |
| Simulator views (alert pane pivot `data-pivot="signin-logs"`) | `ui/views.js` |

## Open items, roughly in priority order

1. **Roll the Module 1 pattern outward.** Modules 02-06 still use the reveal-then-decide
   shape. The pieces that generalize: `require` steps, auto-advance, fill-in-the-blank
   recall, console-before-worksheet ordering.
2. **A second, unguided Module 1 alert.** Same difficulty, no coach, different story
   (impossible travel or MFA fatigue rather than password spray), scored the same way.
   This is the "did you actually learn it" half of the module and does not exist yet.
3. **Difficulty note from Wave 1** — Modules 02 and 03 were built before the difficulty
   gradient reached the briefs and read heavier than the ramp calls for at week 1-2.
   Left as built; revisit if they feel steep in use.

## Auth, backend simplification, and provisioning (as of 2026-08-28, later session)

**`architecture.md` at the repo root is the authoritative, current doc for all of this —
read that first, it supersedes everything below and the old `SPRINT_PLAN.md` numbering for
this workstream.** Summary of where things actually stand:

**Sprints 1-4 (the backend-simplification + persistence-wiring wave) are all built and
code-reviewed, but NOT yet applied anywhere live and NOT yet committed to git:**
- Sprint 1 — `supabase/migrations/20260828160000_simplify_schema.sql`: drops
  `profiles`/`enrollments`/`module_entitlements`/`programs`/`modules`/`labs`, rewrites
  `module_progress`/`lab_attempts`/`capstone_submissions`/`portfolio_artifacts` to key by
  `module_key`/`lab_key`/`track_code` text instead of uuid FKs, redefines `course_progress`
  as a live rollup view. Written, reviewed, syntax/dependency-order checked — **never run
  against local or remote Postgres.**
- Sprint 2 — `module_progress` writes wired into `portal/app.js` (additive, localStorage
  behavior unchanged).
- Sprint 3 — `lab_attempts` writes wired into `portal/app.js` + all 12 `module-*.js` files
  (the "already-scored" half only — the simulator→portal result contract for modules 2-12
  was deliberately left unbuilt, still a future sprint).
- Sprint 4 — `capstone_submissions` writes wired into `portal/module-12.js` (simple version:
  one upserted row per student at `stage=12`, not a 12-stage UI — this matches a separate
  concurrent curriculum-planning doc's framing, see below).
- All four: `node --check` clean on every touched file. **Not tested against a real Supabase
  session** — no local dev stack was running this session.

**BLOCKED: `supabase db push` was denied by Claude Code's auto-mode classifier** (a live,
destructive action — this migration drops tables). The CLI is already logged in and linked
to the live project (`eokvngifirjgfozzbieu`) and `supabase migration list` confirms exactly
one migration is pending (`20260828160000`) — it's ready to push, it just needs the site
owner to either run `supabase db push` themselves in their own terminal, or grant a Bash
permission rule for it. **This is the actual next step, first thing next session** — nothing
else (frontend smoke test against a real session, git commit, Sprint 5 deploy) can happen
until this lands.

**Provisioning (Sprint 6) — done, all 81 accounts exist**, run directly by the site owner in
their own terminal this session (not delegated, per the standing rule on the service-role
key): `ADMIN 1`, `SOCAN 20`, `HDESK 20`, `AIENG 20`, `ELECT 20`. Roster CSVs sit in
`bin/.roster-output/` (gitignored, confirmed not at commit risk). Site owner's call: fine to
leave them there for now rather than urgently vault them — these are rotatable, no-real-PII
training accounts (random login IDs, no names/emails), low enough stakes that the usual
"move to vault immediately" urgency doesn't apply here. Still worth moving to a real password
manager before handing any out to actual students, mainly so the only copy of each password
isn't a single un-backed-up CSV.

**Important side effect of that provisioning run, fixed this session:**
`bin/provision-students.js` (pre-fix) wrote every non-ADMIN account into `public.enrollments`
too (resolving `program_id` via a live `programs` table lookup) — a leftover from the old
enrollment-based access model. That means `enrollments` now has ~80 real rows, which
contradicts Sprint 1 migration's own code comment claiming that table is confirmed empty.
**This is fine to drop anyway** — site owner confirmed: those rows are fully redundant with
`students.track_code` (every one is `status=active, access_mode=full`, program mechanically
implied by track_code), and accounts are rotatable across cohorts, so no real data is lost.
But the script itself would have started hard-failing on every future provisioning run once
Sprint 1's migration landed (since it queries `programs`, a table being dropped) — **already
fixed**: `getProgramId()`/`insertEnrollment()` and their call site were removed from
`bin/provision-students.js` this session. Confirmed `node --check` clean, no other behavior
changed.

**Concurrent workstream, different session/agent, same repo — not a conflict but worth
knowing about:** `CURRICULUM_ALIGNMENT_ARCHITECTURE.md` (new this session) governs a
separate curriculum-content-alignment wave (Codex-driven, its own sprint lettering A-G).
Sprint A already landed additive `compliance`/`curriculumItems` metadata into
`portal/data.js`. That plan explicitly locks `soc-01`..`soc-12` module keys, lab keys,
routes, and runtime IDs as immutable, and explicitly names `architecture.md`'s backend
simplification as something it does not supersede — so no actual conflict with Sprints 1-4
above. Its future sprints (C/D) will edit `module-01/04/05/06/08/10/12.js` for label/copy
changes — those files now also carry this session's `recordLabAttempt`/
`recordCapstoneSubmission` additions, so whoever runs that workstream's next agent should
make sure it reads current file state, not a stale pre-session copy.

**Sprint 5 (git commit + push to `master` + live deploy) has not happened.** Nothing from
this session is committed. This remains a deliberate, site-owner-confirmed action per
`architecture.md` — do not do this without an explicit go-ahead in the moment it happens,
separate from any earlier general permission.

**Still-open design questions from `architecture.md`, unchanged:** none blocking right now —
the `enrollments`/`module_progress` vs `lesson_progress` simplification questions raised
earlier this session were resolved by the Sprint 1 migration (enrollments dropped,
`course_progress` redefined as a rollup view). Nothing else currently blocking.

Separately, a stray local `supabase start` Docker stack (14h uptime, crash-looping) was found
running for this same project earlier this session and was stopped (`supabase stop`) — not
the cause of any of the above, noted here so it isn't mistaken for still being up.

## Conventions that matter

- Each module agent owns exactly `portal/module-NN.js` + `portal/module-NN.css`. Shared
  files (`portal/app.js`, `portal/lab-runtime.js`, `portal/module-registry.js`) are the
  orchestrator's.
- Every CSS selector in a module file is `.mNN-` prefixed.
- No module before 12 may reference `8767`, `SIM_ORIGIN`, `simEntry`, or the capstone
  route — except Module 1's coach launch, which is scoped to two pages by the coach's
  `allow` list.
- Lab state goes through `LabRuntime` under a lab-specific id; reset touches only that lab.
- Run `node bin/portal-check.js` and `node bin/lab-state-check.js` before closing a wave.
