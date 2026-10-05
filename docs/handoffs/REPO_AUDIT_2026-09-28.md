# Repo, workflow and other-developer audit — 2026-09-28

Audited by Claude Code at `origin/master` = `16b8455`. Every finding below
was verified against code **and**, where marked *live*, against the linked
Supabase project with read-only `supabase db query --linked` queries. Nothing
belonging to another developer was merged, rebased, closed or deleted.

## Ground rules for whoever picks this up

- **Do not merge, rebase, close or delete another developer's branch or PR.**
  Report on it; the owner acts. Owners: `mcorreira` (IT Help Desk / HDESK),
  `randy608` (M360), Alex (SOC Analyst / SOCAN, platform).
- **One agent = one git worktree + one branch.** See F3. Do not work in
  `/home/alex/Mission_Next_Technical_Academy_SOC_Analyst_course` while other
  agents are active in it.
- SOC work ships straight to `master` after `bash bin/ci-check.sh`
  (owner policy); everything else goes through a PR.
- Database fixes are **new** migrations; applied migrations are never edited.
  Confirm push state with `supabase migration list --linked`.

## Findings (highest severity first)

| ID | Severity | Owner | Area | Status |
|----|----------|-------|------|--------|
| F1 | High | mcorreira | PR #39 (HDESK program version) | Open PR, not merged |
| F2 | High | Alex / platform | Enrollment history on `master` | Live defect |
| F3 | Medium | Alex | Agent workflow | Active risk |
| F4 | Medium | Alex / platform | Career-readiness (M360-101) hours | Live gap, intent unconfirmed |
| F5 | Medium | Alex | CI coverage | 3 failing tests invisible to CI |
| F6 | Low | branch owners | Stale remote branches | Hygiene |
| F7 | Low | Alex | `master` protection / workflow coupling | Mitigated |

---

### F1 — PR #39 would stop awarding hours to every cohort-enrolled Help Desk student

**PR:** #39 `l-002-hdesk-program-version` → `master`, one file:
`supabase/migrations/20260928120000_hdesk_program_version.sql` (not merged,
not applied).

**Defect.** Section C's new `award_fixed_module_credit()` looks up the
student's version from `enrollment_periods`; for `HDESK` with no version it
returns without awarding anything. Cohort-provisioned students have **no**
`enrollment_periods` row at all (root cause is F2), so they would earn zero
Help Desk hours. Today, on `master`, they do earn hours (newest active row).
Section D's insert guard never fires for them either, because no enrollment
period is ever inserted.

**Evidence.**
- `supabase/functions/admin-provision/provisioning.ts:166-192`: `create_cohort`
  inserts `students` with `is_enrolled: true`.
- `supabase/migrations/20260829125000_enrollment_reporting_history.sql:149-182`:
  `record_enrollment_period_transition()` only runs `after update` when
  `is_enrolled` flips false → true. No migration adds an insert trigger.
- *Live:* `HDESK` has 2 enrolled students, **2** without an open enrollment
  period, both with a `cohort_id`.

**Not affected:** SOC. For non-HDESK tracks the new function falls back to the
original newest-active-row behavior, and SOC has one version / one hour map,
so SOC awards are unchanged (verified by reading Section C).

**Fix direction (owner's call).** Fix F2 first (create the missing periods),
or have Section C fall back to the track's single active version when no
enrollment period exists. Re-test with a cohort-provisioned HDESK account,
not only an admin-toggled one.

### F2 — Students created already enrolled never get an enrollment period

**Defect.** Same root cause as F1, already on `master` and affecting SOC.
`enrollment_periods` rows are only created by the `after update` trigger, so
every student inserted with `is_enrolled = true` (all `create_cohort` batches)
has no enrollment history, program version, or scheduled dates in
`enrollment_periods`.

**Evidence (*live*, enrolled non-admin students without an open period):**

| Track | Enrolled | Without open period | Of which cohort-provisioned |
|-------|---------:|--------------------:|----------------------------:|
| SOCAN | 6 | 2 | 2 |
| HDESK | 2 | 2 | 2 |
| ELECT | 1 | 1 | 1 |
| HDINST | 2 | 2 | 0 |
| SOCANINST | 1 | 1 | 0 |
| AIENG | 2 | 0 | 0 |

**Impact.** Anything reading `enrollment_periods` (enrollment/withdrawal
reporting, completion snapshots, `admin_update_current_enrollment_plan`, which
raises nothing but updates zero rows) silently omits these students.

**Fix direction.** New migration: an `after insert on public.students`
trigger mirroring the enroll branch of `record_enrollment_period_transition()`
(the partial unique index `enrollment_periods_one_open_epoch` already makes it
idempotent), plus a one-time backfill for currently enrolled students with no
open period, using the track's active version. Decide first whether instructor
tracks (`HDINST`, `SOCANINST`) should have enrollment periods; they probably
should be excluded like `ADMIN`.

### F3 — Several agents share one working tree and branch

**Evidence.** Three Codex sessions (`node /home/alex/.local/bin/codex`, up
~2.5 h) and a Claude session run against the same checkout. After the
11:21 push of `16b8455`, uncommitted edits appeared at 11:25–11:29 that the
pushing session did not make:

- `portal/index.html` (adds `soc-assessment-hunting.css`)
- `portal/soc-console-tools.js`, `portal/soc-m06-assessment-related-search.js`,
  `portal/soc-m06-assessment-seed-ui.js` (Module 6 Hunting workspace polish:
  numbered panels, card-style evidence pickers)
- new `portal/soc-assessment-hunting.css`

These were left untouched. Risk: any agent's `git add -A`, `commit -a`,
checkout, stash or `reset` captures or destroys another agent's half-finished
work, and version-string bumps in `portal/index.html` collide.

**Fix.** Each agent works in its own worktree off `origin/master`:

```bash
git fetch origin
git worktree add ../sp-<task> -b <task> origin/master
# work, then from that worktree:
bash bin/ci-check.sh && git push origin HEAD:master   # SOC policy
git worktree remove ../sp-<task> && git branch -d <task>
```

Commit only the files you changed (`git add <paths>`, never `-A`), and rebase
on `origin/master` immediately before pushing.

### F4 — Career-readiness (M360-101) hours are never awarded, on any track

**Evidence (*live*).** `program_course_hours` defines `m360-101` = 720 min
(12 h) for `SOCAN` (`20260829130000_fixed_credit_hours.sql:44`) and `HDESK`
(`20260925200000_hdesk_program_course_hours.sql`). Awards are only created by
the `module_progress` trigger keyed on `module_key`, but `module_progress`
contains **no** `m360%` rows for any track: M360 progress lives in its own
store (`portal/app.js:732`, `mnt.m360-101.progress.v1.*`).
`student_course_hour_awards`: 30 rows, **0** for `m360%`. Programs
advertised as 72 clock hours can therefore reach at most 60 awarded hours.

**Needs an owner decision before fixing:** are M360 hours meant to be awarded
from M360 completion, awarded manually, or only reported separately? Then
either write a `module_progress` `m360-101` row on M360 completion or award
from the M360 completion record.

### F5 — Unit tests are not run in CI; three SOC tests have drifted

`bin/ci-check.sh` (used by `ci.yml` and the Pages deploy) never runs
`tests/*.test.js`. Three fail on `master`. Each was traced; **all three are
test drift, not product bugs**:

| Test | Failure | Cause (verified) |
|------|---------|------------------|
| `tests/soc-m11-console-integration.test.js:41` | `moduleElevenToolFixtures is not defined` | Test slices source by the exact string `function moduleElevenToolFixtures(data) {`; the signature is now `(data, fixture = SocM11AssessmentData)` (`portal/soc-analyst-module-11.js:896`). |
| `tests/soc-m04-assessment-console.test.js:67` | `A state root object is required.` | `moduleFourGetSections()` now reads the guided console state added with the independent guided labs (`31fa5be`); the test never loads `moduleFourGuidedState`. |
| `tests/soc-m06-cumulative-console-integration.test.js:226` | M07 ticket writes "not scoped to `#m07-assessment-form`" | The rule flags the Guided Lab's own notes write (`portal/soc-analyst-module-07.js:1179`, scoped to `#guided-m07-m07-guided-case`). Verified in headless Chrome that every guided notes selector (M04–M07) matches its real rendered form. |

**Fix.** Repair the three tests (extract functions by name, not exact
signature; load guided state; allow each module's guided case form in the
scoping rule), then add a `tests/*.test.js` runner to `bin/ci-check.sh`.
Also run `npx -p playwright node bin/console-tab-sweep.js` (portal running)
before SOC pushes; it clicks all 304 console tabs in Modules 3–12 and caught
a page freeze that CI could not see.

### F6 — Stale remote branches (report only, owners decide)

- **Content already on `master` (safe for the owner to delete):**
  `fix/its-11-hours`, `mcorreira/fix-its-11-hours-recovered`,
  `l-001-hdesk-supabase-course-hours`, `l-001-hdesk-total-hours` (mcorreira);
  `lab-migration-20260923-133658`, `fix/local-seed-current-schema` (Alex;
  the latter is a pre-rebase copy of work now on `master` as `655e7ae`/`a818be8`,
  a `git push --force-with-lease` or delete is the owner's call);
  `m360-gate4-*`, `m360-gate5-week6-portfolio`, `m360-gate6-consistency-pass`,
  `m360-gate6-qa-fixes`, `m360-gate6-ux-fixes`, `m360-revoke-anon-rpc`,
  `m360-start-here-and-week6-verification`, `m360-runtime-stability-review`
  (randy608).
- **Unmerged and conflicting with `master`, last touched Sep 3–14:** 21
  `randy608` M360 branches (`m360-qa-wave1…10`, `m360-admin-*`,
  `m360-cohort-schedule-ux`, `m360-gate3-production`, `m360-gate6-routing-fix`,
  `m360-week2-model-sweeps`, `paydown-m360-debt`, `restore-*`,
  `portal-shell-my-programs-speed-fix`). Likely superseded by later squash
  merges; randy608 should confirm and delete.
- **Alex's own open M360 work:** PR #35 `maintenance/m360-gates-and-ownership`
  and `proposed/m360-gate6-obsolete-assertion-fix` (12 commits) both conflict
  with `master` and need a rebase or closure. Two stashes remain
  (`git stash list`); review before dropping.

### F7 — `master` is unprotected; an M360 check is coupled to SOC pushes

- `master` has no branch protection (GitHub API: "Branch not protected"), so
  any collaborator can push to production. Mitigated: `pages.yml` re-runs
  `bin/ci-check.sh` before deploying, so a broken build does not publish.
  Consider protection requiring `CI validation` for everyone except the SOC
  direct-push owner.
- `m360-gate6-regression-check.yml` triggers on `portal/index.html`, which
  every SOC change edits (script version bumps). It passes today; if it
  fails, it will look like a SOC regression. Narrow its paths or have it
  assert only M360 lines.

## Verified healthy (no action)

- mcorreira's merged L-001 work reconciles: HDESK `creditMinutes` sum to
  3,600 (60 h) + 720 M360 = 72 h, lab 23 h, theory 37 h; migration
  `20260925200000` is applied on the linked project.
- Latest `master` push `16b8455`: CI validation, M360 Gate 6 and Deploy all
  succeeded.
- `ui/index.html`'s favicon `../assets/favicon-32.png` looks missing in the
  repo but resolves in production (`pages.yml` copies `ui/` to `_site/sim/`).
- Local clone synced: `master` = `origin/master` = `16b8455`; merged local
  branch `soc/release-20260924` deleted; stale worktree entries pruned.
  `fix/local-seed-current-schema` is still checked out (same commit as
  `master`) because Codex sessions are working in that tree.
