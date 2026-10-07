# AI agent rules: database, staging, deploy and merge

Short, binding rules for AI agents. Read before any database, staging, deploy
or merge work. Details: `docs/operations/STAGING_AUTOMATION.md`.

## Local testing

- Run the portal only with `bin/dev.sh` (staging by default).
- Check `bin/dev.sh status` shows `target=STAGING` before signing in.
- Never pass `--production` unless a person asks in this session.
- Sign in only with synthetic staging accounts the person provides.

## Staging branch

- Never push, merge into, reset or force the `staging` branch. Only the
  Staging sync workflow moves it.
- To test a feature on the hosted staging site: push the feature branch, then
  a person runs Deploy staging site in `student-portal-staging` with
  `ref` = the feature branch.

## Database

- Staging project: `xbblgtrfwgeiyttdlbue`. Production (`eokvngifirjgfozzbieu`)
  is never targeted by agents.
- Never run `supabase db push`, `supabase db reset` or
  `supabase functions deploy` without `--project-ref xbblgtrfwgeiyttdlbue`.
- Run `supabase db push` with `--dry-run` first.
- Ask the person before running any of them.
- Never rename a migration after it has been applied to staging.
- Every migration PR includes a rollback note.

## Admin scripts

- Admin scripts in `bin/` need `SUPABASE_URL` set to staging explicitly.
- Never add `--production`.

## Merging

- All changes go through a feature branch and a PR to `master`.
- Never push to `master` directly.
- Never merge without the person's approval.
- Squash and merge.
- Never use the `pull_request_target` trigger.
- Never print secrets.

## After a merge

- Staging sync runs automatically.
- If it stops at the functions gate: deploy the listed functions to staging
  (person approves), then a person re-runs Staging sync from `master` with
  `functions_deployed` ticked.
- If it says staging is ahead or diverged: a person re-runs Staging sync from
  `master`. Never fix staging by hand.
- Details: `docs/operations/STAGING_AUTOMATION.md`.
