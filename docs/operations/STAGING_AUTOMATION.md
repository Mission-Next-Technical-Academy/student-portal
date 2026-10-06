# Staging automation: what keeps staging in step with master

After every merge to `master`, staging catches up on its own: the `staging`
branch, the staging database's migrations, and the staging website. Edge
Functions stay manual; every run says which ones need deploying.

Why this exists: on 2026-10-05 the `secure-login` function and six migrations
reached `master` but not staging, so every staging sign-in failed until staging
was synced by hand.

Projects (also in `bin/ci/supabase-refs.sh`, the only place the automation
scripts name them):

- Staging Supabase project: `xbblgtrfwgeiyttdlbue`. The only one automation changes.
- Production Supabase project: `eokvngifirjgfozzbieu`. Automation never touches it.

## What runs when

**Every push to `master`** (and a manual run started from `master`) runs
`.github/workflows/staging-sync.yml` in student-portal. Its three jobs run in
order; if one fails, the later ones do not run.

1. **Fast-forward staging to master** (`sync-branch`). Moves the `staging`
   branch forward to `master`'s commit with `bin/ci/sync-staging.sh`. Fast-forward
   only: never `--force`, never writes to `master`. If `staging` has commits that
   are not on `master`, it changes nothing and fails. The run summary also lists
   any Edge Functions the push changed, with the manual deploy commands
   (`bin/ci/functions-reminder.sh`). Uses no secrets.
2. **Apply migrations to the staging database** (`migrate-staging`). Checks that
   `STAGING_DB_URL` names the staging project and not production
   (`bin/ci/check-staging-db-url.sh`), then runs `supabase db push --dry-run`
   and the real `supabase db push --yes` against staging
   (`bin/ci/migrate-staging.sh`). The run summary lists the migrations applied.
   No pending migrations is a normal, successful run. If the secret is not set,
   the job passes with a notice and applies nothing.
3. **Start the staging website deploy** (`deploy-staging-site`). Only after
   step 2 passed. Confirms `staging` still points at the commit step 2 migrated,
   then starts **Deploy staging site** (`deploy-staging.yml`) in
   student-portal-staging with `ref=staging`. If the token is not set, the job
   passes with a notice and deploys nothing.

**Every pull request that changes `supabase/`** runs
`.github/workflows/supabase-change-reminder.yml`. It posts one comment (and
updates the same comment on later pushes) with the staging-first checklist:
apply the migrations to staging and test **before** merging, deploy changed
functions to staging, and add a rollback note. It never fails the pull
request. Pull requests from forks get a read-only token and cannot be
commented on, so for them the checklist is in the job summary only.

**Twice a day** (10:17 and 17:17 UTC, about 6:17 AM and 1:17 PM in Florida
during daylight time) student-portal-staging's **Deploy staging site** runs
on a schedule as a backup. It reads `deploy-sha.txt` from the published
staging site and skips the build if it already matches the current `staging`
commit. Manual and dispatched runs always deploy.

## The `staging-sync` environment

Both secrets are **environment secrets** in a GitHub Environment named
`staging-sync` in student-portal, not repository secrets. The environment only
lets runs that started from `master` use them. Only `migrate-staging` and
`deploy-staging-site` declare `environment: staging-sync`; `sync-branch` and the
pull request reminder use no secrets.

Settings (an admin of student-portal sets these; if you are not an admin, ask
Randy or Alex):

1. Open https://github.com/Mission-Next-Technical-Academy/student-portal →
   **Settings** → **Environments** → **New environment**.
2. Name: `staging-sync` → **Configure environment**.
3. **Required reviewers**: leave unticked. **Wait timer**: leave unticked. Either
   would stall the automation.
4. **Deployment branches and tags**: choose **Selected branches and tags** →
   **Add deployment branch or tag rule** → type `master` → **Add rule**.
5. Under **Environment secrets**, add the two secrets below.

Runs of `migrate-staging` and `deploy-staging-site` show up as deployments to
`staging-sync` (the repository's **Deployments** list, and the run page). That
is expected; nothing is deployed to an external host by the environment
itself.

### Starting a run by hand

Actions → **Staging sync** → **Run workflow** → **Use workflow from: Branch:
master** → **Run workflow**. Always start it from `master`. Started from any
other branch, the first job stops with an error and GitHub refuses that branch
the environment's secrets.

## Secret 1: `STAGING_DB_URL`

The staging database's **Session pooler** connection string. The Session pooler
works from GitHub's runners (the direct connection needs IPv6, which they lack).

1. Open the Supabase dashboard and select the **staging** project. Check that the
   address bar shows `xbblgtrfwgeiyttdlbue`, not `eokvngifirjgfozzbieu`.
2. Click **Connect** (top of the project page) → **Connection String** → Type
   **URI** → **Session pooler**. Copy the string. It looks like
   `postgresql://postgres.xbblgtrfwgeiyttdlbue:[YOUR-PASSWORD]@aws-...pooler.supabase.com:5432/postgres`.
3. Replace `[YOUR-PASSWORD]` with the staging database password (from your
   password manager; reset it under **Project Settings → Database** if no one has
   it). If the password contains characters such as `@ : / ? # %`, they must be
   percent-encoded (for example `@` becomes `%40`).
4. In the `staging-sync` environment → **Add environment secret** → Name
   `STAGING_DB_URL` → paste → **Add secret**.

Do not paste it into chat, a terminal, a file, or an issue. The workflow refuses
a value that does not contain `xbblgtrfwgeiyttdlbue` or that contains
`eokvngifirjgfozzbieu`.

To replace it (for example after a database password reset): open the
environment, click the pencil next to `STAGING_DB_URL`, paste the new value,
save. Then start a manual run (above) to check it.

## Secret 2: `STAGING_DEPLOY_TOKEN`

A fine-grained personal access token that can do one thing: start workflows
in student-portal-staging. GitHub's REST API reference lists **"Create a workflow
dispatch event"** (`POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches`)
under the repository permission **Actions: write**. Read and write on Actions is
the only permission it needs. GitHub adds **Metadata: read-only** to every
fine-grained token automatically.

The token belongs to the person who creates it, and it can never do more than
that person can. The creator needs write access to student-portal-staging. If
they leave the organization or lose that access, the token stops working and
must be replaced.

Create it:

1. GitHub → your profile picture → **Settings** → **Developer settings** →
   **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. **Token name**: `student-portal staging-sync deploy`.
   **Description**: `Lets student-portal's Staging sync workflow start Deploy staging site.`
3. **Resource owner**: `Mission-Next-Technical-Academy` (the organization, not your
   personal account).
4. **Expiration**: **Custom**, a date no more than one year away (the
   organization may set a shorter limit).
5. **Repository access**: **Only select repositories** → `student-portal-staging`
   only.
6. **Permissions** → **Repository permissions** → **Actions**: **Read and write**.
   Leave every other permission at **No access** (Metadata shows as read-only
   automatically). No organization or account permissions.
7. **Generate token**. If the organization requires approval, the token shows
   as pending until an organization owner approves it under the organization's
   **Settings → Personal access tokens → Pending requests**.
8. Copy the token once and paste it straight into the `staging-sync` environment →
   **Add environment secret** → Name `STAGING_DEPLOY_TOKEN`. Do not save it
   anywhere else.
9. Put a calendar reminder **three weeks before the expiry date**: "Replace
   STAGING_DEPLOY_TOKEN (student-portal staging-sync)".

Replace it before it expires: repeat steps 1–7 to make a new token, update the
`STAGING_DEPLOY_TOKEN` environment secret (pencil icon → paste → save), start a
manual run to check it, then delete the old token under **Fine-grained tokens**.
Move the calendar reminder to the new expiry date.

## Edge Functions are deployed by hand

The run summary (and the pull request comment) lists changed functions with
the exact commands. Run them from a checkout that contains the change, after
`supabase login`:

```
supabase functions deploy <function-name> --project-ref xbblgtrfwgeiyttdlbue
```

The current functions are `admin-provision`, `check-login-geofence`,
`check-login-ueba`, `record-login-geo`, and `secure-login`. A change to
`supabase/functions/_shared/` means redeploying every function. Never use
`--project-ref eokvngifirjgfozzbieu` (production) for staging work.

## Logs are public

student-portal is a public repository, so anyone can read every workflow log
and job summary. GitHub hides exact secret values, but not parts of them or
values built from them. The scripts never print `STAGING_DB_URL` or the token,
and `bin/ci/migrate-staging.sh` redacts connection strings, hosts, and users
from the Supabase CLI's output before it reaches the log. Any change to these
workflows must keep that true. `tests/staging-sync-scripts.test.js` checks it.

## The 60-day rule for scheduled workflows

GitHub disables scheduled workflows in a public repository after 60 days with
no repository activity. student-portal-staging gets few commits, so its
backup schedule may be disabled this way. GitHub marks the whole workflow
disabled, not just its schedule, so the dispatch from student-portal can fail
too (see `deploy-staging-site` below).

To re-enable: student-portal-staging → **Actions** → **Deploy staging site** →
**Enable workflow**. Or in Terminal:

```
gh workflow enable deploy-staging.yml --repo Mission-Next-Technical-Academy/student-portal-staging
```

## When a job fails

**sync-branch**

- "Start this workflow from master": a manual run was started from another
  branch. Start it again from `master`.
- "staging has commits that are not on master": someone committed to `staging`
  directly. Nothing was changed. Get those commits onto `master` through a pull
  request (or, if they are not wanted, have a maintainer reset `staging` to
  `master` by hand), then run the workflow from `master` again.
- The push was rejected: something else moved `staging` at the same moment, or
  a branch rule now protects `staging`. Rerun; if a rule blocks it, allow
  GitHub Actions to push to `staging`.

**migrate-staging**

- "STAGING_DB_URL names the PRODUCTION Supabase project" or "does not name the
  staging Supabase project": the secret is wrong. Replace it (Secret 1).
  Nothing ran against any database.
- "dry run failed": usually a wrong or expired password, or a value that is not
  percent-encoded. Nothing was applied. Check the redacted output in the run
  summary, fix the secret, rerun from `master`.
- A complaint about migrations "to be inserted before the last migration on
  remote": a migration file is dated earlier than one already applied to
  staging. A maintainer must decide whether to rename it or apply it
  deliberately; the workflow does not pass `--include-all`.
- "push failed": a migration has an error. Some earlier migrations in the same
  run may already be applied. The website was not deployed. Fix forward with a
  new migration on `master` (staging first, as always).

**deploy-staging-site**

- Notice "STAGING_DEPLOY_TOKEN is not set": add Secret 2.
- Warning "Staging migrations were skipped": `STAGING_DB_URL` is not set, so
  the site deployed without this run migrating the database. Add Secret 1.
- "staging moved … after this run migrated the database": a later change
  reached `staging` mid-run. The next run handles it; if not, rerun from `master`.
- HTTP 401 or 403 from `gh workflow run`: the token expired, was revoked, is
  pending organization approval, or lacks **Actions: Read and write** on
  student-portal-staging. Replace it (Secret 2).
- HTTP 422 or "workflow is disabled": re-enable **Deploy staging site** (60-day
  rule above).
- The job passed but the site did not change: open student-portal-staging →
  **Actions** → **Deploy staging site** and read that run.

## If student-portal is made private

- Environments with deployment-branch rules and environment secrets in private
  repositories may require a paid GitHub plan. Check before switching, or the
  secrets stop being available to these jobs.
- student-portal-staging's deploy checks out student-portal anonymously today.
  It would need a read-only token for student-portal (see the `token:` comment in
  `deploy-staging.yml`), and its backup schedule's `git ls-remote` check would
  need the same token.
- Logs would no longer be public, but the rule against printing secrets stays.
