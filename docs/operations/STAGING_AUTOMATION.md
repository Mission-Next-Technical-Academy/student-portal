# Staging automation: what keeps staging in step with master

After every merge to `master`, staging catches up on its own, in this order:
the staging database's migrations, then the `staging` branch, then the staging
website. Staging never moves ahead of its database. Edge Functions stay
manual: when a merge changes them, staging waits until someone deploys them
and confirms.

Why this exists: on 2026-10-05 the `secure-login` function and six migrations
reached `master` but not staging, so every staging sign-in failed until staging
was synced by hand.

Projects (named only in `bin/ci/supabase-refs.sh` among the automation
scripts; the pull request reminder workflow has an inline copy that
`tests/staging-sync-scripts.test.js` checks against it):

- Staging Supabase project: `xbblgtrfwgeiyttdlbue`. The only one automation changes.
- Production Supabase project: `eokvngifirjgfozzbieu`. Automation never touches it.

## What runs when

**Every push to `master`** (and a manual run started from `master`) runs
`.github/workflows/staging-sync.yml` in student-portal. Its three jobs run in
order; if one fails, the later ones do not run, and the run's error says why.

1. **Apply migrations to the staging database** (`migrate-staging`). Uses the
   exact `master` commit this run is for. Checks that `STAGING_DB_URL` is set
   and is exactly the staging project's Session pooler string, with no trace of
   production (`bin/ci/check-staging-db-url.sh`, see Secret 1), then runs `supabase db push --dry-run`
   and the real `supabase db push --yes` against staging
   (`bin/ci/migrate-staging.sh`). The run summary lists the migrations applied.
   No pending migrations is a normal, successful run. If the secret is missing
   or a migration fails, the run stops here: `staging` does not move and the
   website is not deployed.
2. **Fast-forward staging to master** (`sync-branch`). Only after step 1
   succeeded. Moves the `staging` branch forward to that same commit with
   `bin/ci/sync-staging.sh`. Fast-forward only: never `--force`, never writes to
   `master`. If `staging` has commits that are not on `master`, it changes
   nothing and fails. Uses no secrets.
   **Already past this commit:** if `staging` already points at a later
   `master` commit, it never moves `staging` back, does not deploy, and fails
   with "staging (…) is ahead of this run's commit (…), so this run can't
   prove staging's migrations were applied." See "When a job fails" for the
   fix.
   **Functions gate:** if the commits `staging` would gain change anything
   under `supabase/functions/`, it does not move `staging`, lists the exact
   deploy commands in the run summary, and fails with an error saying so.
   Deploy those functions to staging, then start a manual run from `master`
   with **functions_deployed** ticked (see "Starting a run by hand").
3. **Start the staging website deploy** (`deploy-staging-site`). Only when
   step 2 succeeded, which means `staging` is at exactly this run's commit. Confirms `staging` still
   points at it, then starts **Deploy staging site** (`deploy-staging.yml`) in
   student-portal-staging: `--ref main` picks the branch whose
   `deploy-staging.yml` runs, and `-f ref=<that commit's full 40-character
   SHA>` is the commit it builds (never the branch name `staging`), so a later
   change to `staging` cannot slip into this deploy. If the token is not set, the job passes with a notice and deploys
   nothing.

Migrations run before `staging` moves, so for a short time (or until a
failure is fixed) the staging database can be ahead of the staging code. That
is the safer direction: a migration should keep working with the code before
it, while new code against an old database fails outright, as it did on
2026-10-05. A migration that breaks the current staging code shows up on
staging immediately, which is what staging is for.

**Every pull request that changes `supabase/`** runs
`.github/workflows/supabase-change-reminder.yml`. It posts one comment (and
updates the same comment on later pushes) with the staging-first checklist:
apply the migrations to staging and test **before** merging, deploy changed
functions to staging, and add a rollback note. It never fails the pull
request. It never checks out or runs code from the pull request: it reads the
list of changed files from the GitHub API, and its checklist text is inline in
the workflow. Its `checklist` job can only read; only its `comment` job can
write, and that job only posts the text. Pull requests from forks get a
read-only token and cannot be commented on, so for them the checklist is in
the job summary only.

**The staging website deploys only two ways:** the `deploy-staging-site` job of
**Staging sync** above, or a manual run of **Deploy staging site** in
student-portal-staging (Actions → **Deploy staging site** → **Run workflow**,
ref `staging`). There is no scheduled deploy. If a deploy fails, fix the cause
and rerun **Staging sync** from `master`.

## Never move `staging` by hand

Never move the staging branch by hand; run Staging sync from master.

Only **Staging sync** moves the `staging` branch, and only after the staging
database has that commit's migrations. Do not push, reset, or merge into
`staging` yourself, and do not deploy a branch other than `staging` to the
staging site. If `staging` is ever in the wrong place, stop and ask Randy or
Alex.

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
other branch, GitHub refuses that branch the environment's secrets and the
first job stops with an error; nothing changes.

The **functions_deployed** box (unticked by default) is for the functions
gate. Tick it only after you have deployed every function listed in the
blocked run's summary to staging, from an up-to-date `master`. Ticking it
records, under your GitHub name in the run summary, that you did.

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

Do not paste it into chat, a terminal, a file, or an issue.

**Only the staging Session pooler string is accepted**
(`bin/ci/check-staging-db-url.sh`). The workflow parses the value and refuses
it unless all of these hold:

- it starts with `postgresql://` (or `postgres://`);
- it contains exactly one `@`, has a password, a port, and nothing after
  `/postgres` (no `?…` parameters, no `#`, no spaces);
- the username is exactly `postgres.xbblgtrfwgeiyttdlbue`;
- the host is a Supabase session pooler, `aws-<number>-<region>.pooler.supabase.com`;
- the port is `5432` (the Session pooler; `6543` is the Transaction pooler);
- the database is `postgres`;
- `eokvngifirjgfozzbieu` (production) appears nowhere in it.

The direct connection string (`db.xbblgtrfwgeiyttdlbue.supabase.co`) and any
other database are refused. The password is checked only for being present; it
is never decoded or printed.

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

When a merge changes Edge Functions, the functions gate holds `staging` and
the run summary lists the exact commands (the pull request comment lists
them too, before merge). Run them from an up-to-date `master`, after
`supabase login`:

```
supabase functions deploy <function-name> --project-ref xbblgtrfwgeiyttdlbue
```

The current functions are `admin-provision`, `check-login-geofence`,
`check-login-ueba`, `record-login-geo`, and `secure-login`. A change to
`supabase/functions/_shared/` means redeploying every function. Never use
`--project-ref eokvngifirjgfozzbieu` (production) for staging work.

Then release the gate: start **Staging sync** by hand from `master` with
**functions_deployed** ticked. That run applies any new migrations, moves
`staging`, and deploys the website.

## Logs are public

student-portal is a public repository, so anyone can read every workflow log
and job summary. GitHub hides exact secret values, but not parts of them or
values built from them. The scripts never print `STAGING_DB_URL` or the token,
and `bin/ci/migrate-staging.sh` redacts connection strings, hosts, and users
from the Supabase CLI's output before it reaches the log. Any change to these
workflows must keep that true. `tests/staging-sync-scripts.test.js` checks it.

## When a job fails

**migrate-staging** (staging was not moved and the website was not deployed)

- "Start this workflow from master": a manual run was started from another
  branch (or GitHub refused the branch the environment). Start it again from
  `master`.
- "STAGING_DB_URL is not set": add Secret 1, then rerun from `master`.
- "STAGING_DB_URL rejected: …": the secret is not the staging Session pooler
  string. Nothing ran against any database. The error names only the rule that
  failed, never the value. Replace the secret (Secret 1):
  - "it names the PRODUCTION Supabase project": `eokvngifirjgfozzbieu` is
    somewhere in it. Copy the string again from the **staging** project.
  - "scheme is not postgresql:// or postgres://": it does not start with
    `postgresql://` (check for a leading space or a different string).
  - "it must contain exactly one @": the password has an unencoded `@`;
    write it as `%40`.
  - "it is not in the form …": a missing port or password, an unencoded `/`,
    `?` or `#` in the password, extra `?…` parameters, or spaces.
  - "username is not postgres.xbblgtrfwgeiyttdlbue": this is the direct
    connection string or another project's. Use **Session pooler**.
  - "host is not a Supabase session pooler": the host is not
    `aws-…pooler.supabase.com`. Use **Session pooler**.
  - "port is not 5432": this is the Transaction pooler string (`6543`). Use
    **Session pooler**.
  - "database name is not postgres": the part after the port must be
    `/postgres`.
- "dry run failed": usually a wrong or expired password, or a value that is not
  percent-encoded. Nothing was applied. Check the redacted output in the run
  summary, fix the secret, rerun from `master`.
- A complaint about migrations "to be inserted before the last migration on
  remote": a migration file is dated earlier than one already applied to
  staging. A maintainer must decide whether to rename it or apply it
  deliberately; the workflow does not pass `--include-all`.
- "push failed": a migration has an error. Some earlier migrations in the same
  run may already be applied. Fix forward with a new migration on `master`
  (staging first, as always); the next run moves `staging` once migrations
  succeed.

**sync-branch** (migrations already ran; the website was not deployed)

- "These commits change Edge Functions": the functions gate. Deploy the
  functions listed in the run summary to staging, then start a manual run
  from `master` with **functions_deployed** ticked.
- "staging has commits that are not on master": someone committed to `staging`
  directly. Nothing was changed. If those commits are wanted, get them onto
  `master` through a pull request, then run the workflow from `master` again.
  If they are not wanted, stop and ask Randy or Alex; do not move `staging` by
  hand.
- "staging (…) is ahead of this run's commit (…), so this run can't prove
  staging's migrations were applied": `staging` already points at a later
  `master` commit than this run migrated (for example, an older run, or an
  older run rerun, finishing after a newer one). Nothing was moved or
  deployed. Fix: run Staging sync from `master` (Actions → **Staging sync** →
  **Run workflow** → **Branch: master**). That run migrates through the latest
  `master` commit and redeploys.
- "is not on master": the run's commit is not on `master` (a manual run from
  another branch that got this far). Start it from `master`.
- The push was rejected: something else moved `staging` at the same moment, or
  a branch rule now protects `staging`. Rerun; if a rule blocks it, allow
  GitHub Actions to push to `staging`.

**deploy-staging-site**

- Notice "STAGING_DEPLOY_TOKEN is not set": add Secret 2.
- "staging moved … during this run": a later change
  reached `staging` mid-run. The next run handles it; if not, rerun from `master`.
- HTTP 401 or 403 from `gh workflow run`: the token expired, was revoked, is
  pending organization approval, or lacks **Actions: Read and write** on
  student-portal-staging. Replace it (Secret 2).
- The job passed but the site did not change: open student-portal-staging →
  **Actions** → **Deploy staging site** and read that run. Fix the cause, then
  rerun **Staging sync** from `master`.

## If student-portal is made private

- Environments with deployment-branch rules and environment secrets in private
  repositories may require a paid GitHub plan. Check before switching, or the
  secrets stop being available to these jobs.
- student-portal-staging's deploy checks out student-portal anonymously today.
  It would need a read-only token for student-portal (see the `token:` comment in
  `deploy-staging.yml`).
- Logs would no longer be public, but the rule against printing secrets stays.
