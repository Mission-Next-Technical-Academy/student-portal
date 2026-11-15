---
paths:
  - "supabase/**"
  - "bin/*.js"
  - "bin/lib/**"
  - "bin/db-*.sh"
---

# Database, migrations and admin scripts

Updated 2026-11-14 (Staging test branch; production SQL Editor method). Background and recovery steps: `docs/operations/STAGING_AUTOMATION.md`,
`docs/operations/OPERATIONS.md`, `docs/SCHEMA_MIGRATION_HYGIENE.md`.

## Who runs what

- A person, never an agent, runs `supabase db push`, `db reset` and `functions deploy`.
- Agents prepare the exact commands and wait for the person's result.
- Staging migrations normally reach staging through Staging test branch and Staging sync (`staging-deploy.md`).
- A hand staging push is a fallback only, run by a person.
- First the person checks `cat supabase/.temp/project-ref` prints `xbblgtrfwgeiyttdlbue`.
- If it prints anything else, stop. Never relink the CLI yourself.
- Hand staging push, dry run first (checked with `supabase db push --help`, CLI 2.118.0, 2026-11-14):
  `supabase db push --linked --project-ref xbblgtrfwgeiyttdlbue --dry-run`
- Check the dry run lists only this branch's migrations, then run it without `--dry-run`.
- Deploy functions only with `--project-ref xbblgtrfwgeiyttdlbue` for staging work.
- A change to `supabase/functions/_shared/` means redeploying every function.
- `supabase db query` needs both `--linked` and `--project-ref`.

## Writing migrations

- Create a new file with `supabase migration new <name>`.
- Never edit or rename a migration already applied to staging.
- Put a header comment: what changes, why, and the rollback steps.
- Every migration PR includes a rollback note.
- Give every `security definer` function `set search_path = public`.
- Guard cron-only functions with `session_user`, never `current_user`.
- Grant `execute` only to the roles that need it.
- Add or update a `supabase/tests/*.sql` test for every RLS or grant change.
- Write `schema_migrations` only in a person-run production apply script or an approved repair.

## Production migrations

Added 2026-11-14. Used for PR #107 (Nov 11) and PR #109 (Nov 14).

- A person applies a PR's migrations to production before merging it; production deploys on merge.
- Never link the CLI to production. Never push migrations to production from an agent.
- The person applies them in the production project's SQL Editor, with two scripts an agent writes.
- Dry-run script: `begin;`, the migrations byte-for-byte, checks, then a raised `DRY RUN OK, NOTHING SAVED`.
- Apply script: `begin;`, the same migrations, the `supabase_migrations.schema_migrations` insert, `commit;`.
- Check the migrations themselves contain no `begin;`, `commit;` or `rollback;`.
- Keep both scripts in an untracked folder (for example `.claude/work/`), never in git.
- A migration dated before production's newest is fine this way.
- After applying, the person confirms every version is in `schema_migrations`.

## Admin scripts and production data

- Set `SUPABASE_URL` explicitly. Use staging for normal work.
- Production runs need the person's task-scoped approval and the script's `--production` flag.
- Schema changes, migration pushes and function deploys never count as data tasks.
- Before deleting test accounts, confirm the track and that every account is synthetic.
- Build and review an explicit list of student IDs; never match by a "test" label.
- Run the purge dry run; separately check reporting, attendance and restricted records.
- Exclude admins and instructors. Preserve shared course content.
- Report the preflight inventory and the outcome.
- Never delete genuine learner work to shorten a dashboard.
- Keep generated rosters in `bin/.roster-output/` (ignored) or a password vault.
