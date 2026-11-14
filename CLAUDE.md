# Student portal: core agent rules

Updated 2026-11-14. Always loaded, for every agent. Domain rules live in
`.claude/rules/` and load by file path in Claude Code. Other agents: open the
matching file from the index at the bottom before editing those paths.

## Architecture & Tenancy

- This portal is a live production LMS. Assume real students are affected.
- Keep the portal plain HTML, CSS and JavaScript with no build step.
- Supabase is the backend: Auth, Postgres with RLS, Storage, Edge Functions.
- Programs are scoped by `track_code`: `SOCAN`, `HDESK`, `AIENG`, `ELECT`.
- Staff codes are `ADMIN`, `SOCANINST` and `HDINST`. M360 runs inside the programs.
- Scope every query, policy and storage path by `user_id` and `track_code`.
- Put track-only behavior in that track's files (`it-support-*`, `soc-*`, `m360*`, `ai-ml-*`).
- Treat these as shared: `portal/app.js`, `index.html`, `data.js`, `module-labs.*`.
- Also shared: `ui/coach.js`, `portal/theme.js`, shared CSS, `supabase/`, `bin/`, `tests/`.
- Call out every shared-file change in the PR for the affected owners.
- Never rename a module key, lab key or runtime ID; it orphans student progress.
- Never reorder modules or change compliance-controlled instructional minutes.

## Auth & Compliance

### Roles

- Use three roles: Student, Instructor, Admin. Never invent a new role model.
- Check Admin with `is_admin()` and Instructor with `is_course_instructor()`.
- Instructors are one-course identities scoped by `faculty_course_assignments`.
- Never widen an instructor's reach beyond their assigned course.
- Enforce permissions in RLS or SQL functions, never only in browser code.
- Show roster, reset and override controls to admins only.
- Never show staff email addresses to students.

### Student data and secrets

- The GitHub repo is public. Treat every committed line as published.
- Never commit secrets, service-role keys, rosters, passwords or `.env` files.
- Never commit real student data, answer keys or answer-key drafts.
- Keep drafts, audits and keys out of git (for example, an untracked folder).
- Never send student work or records to an external API or AI service.
- Never print secrets, and never ask a person to paste one into chat.
- Keep student phone, email and street address out of the LMS.

### Environments

- Run the portal locally only with `bin/dev.sh` (staging by default).
- Confirm `bin/dev.sh status` shows `target=STAGING` before signing in.
- Never serve `portal/` another way; that connects to production.
- Never use `--production` unless a person asks in this session.
- Staging project: `xbblgtrfwgeiyttdlbue`. Production: `eokvngifirjgfozzbieu`.
- Sign in only with synthetic staging accounts the person provides.
- Never take credentials from files in this repo.
- Touch production data only with explicit, task-scoped approval this session.
- Never run `supabase db push`, `db reset --linked` or `functions deploy` yourself.
- Give the person the exact command instead; see `.claude/rules/database.md`.
- An agent may start the Staging test branch workflow; report what it put on staging.
- A person applies production migrations in the SQL Editor; see `.claude/rules/database.md`.
- Before any production data task or admin script, read `.claude/rules/database.md`.

### Git and review

- Branch from current `master`. One track or one shared task per PR.
- Never push to `master` or `staging`, and never force-push.
- Never merge. A person merges on GitHub, using squash and merge.
- Never use the `pull_request_target` workflow trigger.
- Preserve unrelated working-tree changes. Never reset or discard them.

## State & Grading Logic

- The instructor's approval is the grade of record.
- Automated scores are staff-only recommendations; never show them to students.
- Never trust a score or completion computed in the browser.
- Students may only read and insert their own `lab_attempts` rows.
- Never update or delete a `lab_attempts` row from student code.
- Staff update only review columns and sign reviews as themselves.
- A learner can never approve their own attempt.
- Keep `lab_attempt_feedback` append-only.
- Never update `portfolio_artifacts`; updates break `content_sha256`.
- Write module overrides only through `admin_set_module_override()`.
- Keep the pass-mark constraint and the verified module-unlock gate intact.
- Show "submitted" or "complete" only after the durable write succeeds.
- On a failed write, keep the learner's draft and roll back optimistic state.
- Before changing Learn/Practice/Prove It, scoring, review or completion code, read `docs/LAB_ASSESSMENT_STANDARD.md`.
- Keep reviewed work as the academic record. Archive cohorts; never delete work.
- Reset or erase coursework only on accounts an admin flagged as test accounts.

## Testing & Style

- State acceptance criteria and the files you will change before editing.
- Make the smallest change that meets the task. Note unrelated issues instead.
- Run `bash bin/ci-check.sh` before calling work done. Paste the summary.
- Never weaken, skip or delete a failing check. Fix the root cause.
- Run `bin/db-security-check.sh` after changing RLS, grants or definer functions.
- Verify in the right environment. A status note or green CI is not proof.
- Date every update to a doc or tracker.

## Sources of truth

1. `ROADMAP.md`: team priority, release gates and CI/CD path.
2. The work item's specification.
3. Current code, tests, migrations and deployed state.
4. Handoffs in `docs/handoffs/`: context only. Read one only when the task touches it.

## Domain rules index

| When you touch | Read |
| --- | --- |
| Learn/Practice/Prove It, scoring, review, completion, admin sheets, `portal/app.js`, `portal/module-labs.*`, `ui/coach*`, `ui/helpdesk*` | `.claude/rules/grading-assessment.md` |
| `supabase/**`, `bin/*.js` admin scripts, production data | `.claude/rules/database.md` |
| `.github/**`, `bin/ci/**`, `bin/dev.sh`, `bin/serve.py`, `bin/stamp-version.sh`, `VERSION`, `portal/release.js`, `portal/supabase-config.js` | `.claude/rules/staging-deploy.md` |
| `portal/**` or `ui/**` HTML, CSS or JS | `.claude/rules/ui-frontend.md` |
| `portal/data.js`, module files, `ui/*-data.js`, curriculum checks | `.claude/rules/curriculum.md` |
| Evidence uploads, Storage buckets (`portal/it-support-shared.js`, `portal/app.js`, `supabase/migrations/*evidence*`, `*storage*`) | `.claude/rules/evidence-uploads.md` |
| `ui/**` simulator, `portal/imported-labs/**`, `portal/range-tools/**` | `.claude/rules/simulator.md` |
| `tests/**`, `supabase/tests/**`, `bin/ci-check.sh` | `.claude/rules/testing.md` |
| `docs/**`, `archive/**`, `ROADMAP.md`, handoffs | `.claude/rules/docs-handoffs.md` |
