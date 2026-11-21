# Staging automation: what keeps staging in step with master

Updated 2026-11-14.

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
`.github/workflows/staging-sync.yml` in student-portal. Its four jobs run in
order; if one fails, the later ones do not run, and the run's error says why.

0. **Check staging can move to this commit** (`preflight`). Read-only: no
   environment, no secrets, changes nothing. Runs the same ahead/diverged
   checks as step 2 (`bin/ci/sync-staging.sh --check-only`) before anything
   touches the database. If `staging` is already ahead of this run's commit,
   or has commits that are not on `master`, the run stops here and no
   migration is applied. It also refuses a manual run not started from
   `master`.
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
   prove staging's migrations were applied." Step 0 normally catches this
   before any migration; step 2 checks again in case `staging` changed in
   between. See "When a job fails" for the fix.
   **Functions gate:** if the commits `staging` would gain change anything
   under `supabase/functions/`, it does not move `staging`, lists the exact
   deploy commands in the run summary, and fails with an error saying so.
   Deploy those functions to staging, then start a manual run from `master`
   with **functions_deployed** ticked (see "Starting a run by hand"). If the
   `staging` branch does not exist yet, every function in `master` counts, and
   the branch is not created until that confirmation.
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

**The staging website deploys only three ways:** the `deploy-staging-site` job of
**Staging sync** above, the `deploy-site` job of **Staging test branch** (a
person starts it from `master` to test a feature branch; see "Testing a
feature on the hosted staging site"), or a manual run of **Deploy staging
site** in student-portal-staging (Actions → **Deploy staging site** → **Run
workflow**, ref `staging`). There is no scheduled deploy. If a deploy fails,
fix the cause and rerun the workflow that started it: **Staging sync** from
`master`, or **Staging test branch** for a branch test.

## Never move `staging` by hand

Never move the staging branch by hand; run Staging sync from master.

Only **Staging sync** moves the `staging` branch, and only after the staging
database has that commit's migrations. Do not push, reset, or merge into
`staging` yourself, and do not deploy a branch other than `staging` to the
staging site, except to test a feature branch as described in the next
section. If `staging` is ever in the wrong place, stop and ask Randy or Alex.

## Testing a feature on the hosted staging site

Added 2026-11-13. Use the **Staging test branch** workflow
(`.github/workflows/staging-test-branch.yml`). One run applies the branch's
new migrations to the staging database and deploys the branch's exact commit
to the staging site. It never moves the `staging` branch and never deploys
Edge Functions.

**Before you start**

- Push the feature branch to student-portal. Its name must be
  `hdesk/<words>` or `shared/<words>` (lowercase letters, digits, `.`, `_`,
  `-`).
- Update it from the latest `master` and push again. The run refuses a
  branch that doesn't contain the current `master`.
- Its migrations must be **new files only**, each named
  `<14-digit timestamp>_<lowercase_words>.sql` and dated after `master`'s
  newest migration. Create them with `supabase migration new`. A branch that
  edits, deletes or renames a migration already on `master` is refused.
- If the branch changes Edge Functions, the run still deploys the site, but
  the run summary lists the functions to deploy to staging by hand (see
  "Edge Functions are deployed by hand").

**Start the run** (always from `master`; the **ref** box is the feature
branch):

```
gh workflow run staging-test-branch.yml --ref master -f ref=<branch>
```

Or: Actions → **Staging test branch** → **Run workflow** → **Use workflow
from: Branch: master** → **ref**: the branch name → **Run workflow**.

**What it does.** Its three jobs run in order; if one fails, the later ones
don't run.

0. **Check the branch is safe to put on staging** (`preflight`). Read-only:
   no environment, no secrets, and no code from the branch runs
   (`bin/ci/check-branch-for-staging.sh`). It checks the name, that the
   branch exists and contains `master`, and the migration rules above. The
   run summary lists the commit and the new migrations.
1. **Apply the branch's new migrations** (`migrate`). Only when the branch
   adds migrations. It checks out `master`'s scripts, takes only
   `supabase/migrations/` from the branch's checked commit, checks
   `STAGING_DB_URL` (Secret 1), and runs the dry run. **It stops before
   applying anything if the dry run names any file that isn't one of the
   branch's new migrations** (usually a `master` migration that staging
   hasn't applied yet: run **Staging sync** from `master` first). Fewer is
   fine: on a second run of the same branch, files applied by the first run
   are no longer pending. When the dry run names none of them, the real push
   is not run at all. A branch with no migrations skips this job, so nothing
   checks the database: if the last **Staging sync** run failed, fix that
   first, or the branch's code runs against an older schema.
2. **Start the staging website deploy** (`deploy-site`). Starts **Deploy
   staging site** in student-portal-staging with `-f ref=<the branch's full
   40-character SHA>`, never the branch name. Follow it from the link in the
   run summary; the site's footer version ends in that commit's short SHA
   when it is live.

**Afterwards**

- The staging site shows the feature branch until the next merge to
  `master` redeploys it. To put it back sooner, run **Staging sync** from
  `master` (see "Starting a run by hand").
- **Once a branch migration is on staging, Staging sync fails at
  `migrate-staging` on every merge to `master` until that branch merges**
  ("Remote migration versions not found in local migrations directory"),
  because staging's database then has a version `master` doesn't. A test of
  another branch with migrations fails the same way. So test migrations
  close to merging, keep the file's exact name until it merges, and tell
  the team when a branch migration is on staging.
- **Changing a migration after it reached staging has no effect.** Staging
  records only the migration's version (the timestamp), not its content, so
  a rerun sees the file as already applied and the summary says the real
  push was not run. Put the change in a new migration file instead, or undo
  the old one on staging by hand (fallback step 1) before testing again. If the branch is
  abandoned or the migration must be renamed, undo that migration's changes
  on staging and mark it reverted (fallback step 1 below).
- **Queueing:** this workflow shares the `staging-sync` queue with Staging
  sync. GitHub keeps one run waiting per queue: a newer run cancels the one
  already waiting. If a **Staging sync** run shows as cancelled, run it
  again from `master`.
- The branch's SQL runs on staging with full database rights, and anyone
  with write access to student-portal can start this workflow. Review a
  branch's migrations before you test it.

### Fallback: by hand

Use these steps only when the workflow can't run (for example, GitHub
Actions is down or the `staging-sync` environment is broken). A person, never
an agent, runs them.

1. **Apply its migrations to staging first** (skip if the branch has none).
   From the feature branch, first check the Supabase CLI is linked to staging:

   ```
   cat supabase/.temp/project-ref
   ```

   It must print `xbblgtrfwgeiyttdlbue`. If it prints anything else, link to
   staging (`supabase link --project-ref xbblgtrfwgeiyttdlbue`) and check
   again.

   Updated 2026-11-14 (checked with `supabase db push --help`, CLI 2.118.0):
   a person, never an agent, runs these two commands. Preview, check the list
   names only this branch's migrations, then apply:

   ```
   supabase db push --linked --project-ref xbblgtrfwgeiyttdlbue --dry-run
   ```

   ```
   supabase db push --linked --project-ref xbblgtrfwgeiyttdlbue
   ```

   Never run these while the CLI is linked to `eokvngifirjgfozzbieu`
   (production).

   **Warning:** once a migration is applied to staging, keep its exact
   filename until it merges to `master`. If the feature is abandoned, undo
   that migration's changes on staging, then mark it reverted:

   ```
   supabase migration repair --status reverted <version> --linked
   ```

   Run it only while the CLI is linked to staging (check as above).
   `<version>` is the number at the start of the migration's filename.
   Otherwise staging's migration history lists a version that `master` does
   not have, and **Staging sync**'s `migrate-staging` step fails ("Remote
   migration versions not found in local migrations directory") on every
   later merge.
2. **Deploy the branch to the staging site.** The branch must be pushed to
   student-portal first. student-portal-staging → **Actions** → **Deploy
   staging site** → **Run workflow** → leave **Use workflow from** on `main`
   → set **ref** to the feature branch's name → **Run workflow**.
3. **Never merge a feature into the `staging` branch.** `staging` would then
   have commits that are not on `master`, and **Staging sync** fails until
   someone cleans it up (see "When a job fails").
4. **Afterwards**, the staging site keeps showing the feature branch until the
   next merge to `master` redeploys it. To put it back sooner, run **Staging
   sync** from `master` (see "Starting a run by hand"): when `staging` already
   points at the latest `master` commit, it moves nothing but still redeploys
   the site. Or run **Deploy staging site** by hand with **ref** `staging`.

## The `staging-sync` environment

Both secrets are **environment secrets** in a GitHub Environment named
`staging-sync` in student-portal, not repository secrets. The environment only
lets runs that started from `master` use them. Only `migrate-staging` and
`deploy-staging-site` (Staging sync) and `migrate` and `deploy-site` (Staging
test branch) declare `environment: staging-sync`; `sync-branch`, both
`preflight` jobs and the pull request reminder use no secrets.

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
4. **Expiration**: **Custom**, no more than **90 days** away (Randy's
   2026-10-27 security directive), on a date that isn't in a freeze, an
   acceptance run or a launch week. GitHub can't change a token's expiry
   later; see "Renewing it" below.
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

### Renewing it (every 90 days)

Added 2026-10-29 (Megan).

**Current token:** owned by Megan, last renewed 2026-10-29, expires
**2027-01-27**. Calendar reminder: 2027-01-11. Update this line on every
renewal.

Renew it in a quiet week, before the reminder date if you can, and never in a
freeze, an acceptance run or a launch week. Choose a custom expiry date that
also avoids those windows.

**Same owner** (the person who owns the current token renews it):

1. GitHub → your profile picture → **Settings** → **Developer settings** →
   **Personal access tokens** → **Fine-grained tokens** → click the token's name.
2. **Regenerate token** → **Expiration**: **Custom**, no more than 90 days away
   → **Regenerate token**. Copy the new value. The old value stops working at
   once, so do steps 3 and 4 straight away: until then, staging can't redeploy.
3. In the `staging-sync` environment, click the pencil next to
   `STAGING_DEPLOY_TOKEN` → paste → **Update secret**.
4. Start a manual run (see "Starting a run by hand"). Check that **Start the
   staging website deploy** passed, and that the **Deploy staging site** run it
   started in student-portal-staging finished green.
5. Move the calendar reminder to three weeks before the new expiry date, and
   update the "Current token" line above.

**New owner** (the current owner is leaving or loses access): follow steps 1–8
under "Create it" above, check it with a manual run (step 4 here), then the
old owner deletes their token under **Fine-grained tokens**.

If an organization owner sets a maximum token lifetime under the
organization's **Settings → Personal access tokens**, any existing token
longer than that limit is blocked from the organization at once. Renew this
token within the new limit before the limit is switched on.

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

## Production migrations

Added 2026-11-14. Automation never touches production; this is how a PR's
migrations reach it (used for PR #107 and PR #109). The agent rule is
`.claude/rules/database.md` ("Production migrations").

- A person applies a PR's migrations to production **before** merging it,
  because production deploys on merge.
- Never link the Supabase CLI to production, and an agent never pushes
  migrations to production.
- The person runs two scripts, which an agent may write, in the production
  project's **SQL Editor**:
  - **Dry run:** `begin;`, the migrations byte for byte, checks, then a
    raised `DRY RUN OK, NOTHING SAVED` error, so nothing is kept.
  - **Apply:** `begin;`, the same migrations, the
    `supabase_migrations.schema_migrations` insert, then `commit;`.
- First check the migrations themselves contain no `begin;`, `commit;` or
  `rollback;`.
- Keep both scripts in an untracked folder (for example `.claude/work/`),
  never in git.
- A migration dated before production's newest one is fine this way.
- Afterwards, the person confirms every version is in
  `supabase_migrations.schema_migrations`.

## Logs are public

student-portal is a public repository, so anyone can read every workflow log
and job summary. GitHub hides exact secret values, but not parts of them or
values built from them. The scripts never print `STAGING_DB_URL` or the token,
and `bin/ci/migrate-staging.sh` redacts connection strings, hosts, and users
from the Supabase CLI's output before it reaches the log. Any change to these
workflows must keep that true. `tests/staging-sync-scripts.test.js` checks it.

## When a job fails

**preflight** (nothing was changed: no migration, no branch move, no deploy)

- "Start this workflow from master": a manual run was started from another
  branch. Start it again from `master`.
- "staging (…) is ahead of this run's commit (…), so this run can't prove
  staging's migrations were applied": `staging` already points at a later
  `master` commit (for example, an older run, or a rerun of one, starting
  after a newer one finished). Fix: run Staging sync from `master` (Actions →
  **Staging sync** → **Run workflow** → **Branch: master**). That run migrates
  through the latest `master` commit and redeploys.
- "staging has commits that are not on master": see the same message under
  **sync-branch** below.

**migrate-staging** (staging was not moved and the website was not deployed)

- GitHub refuses the job because of the environment's branch rule: a manual
  run was started from another branch. Start it again from `master`.
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
  staging's migrations were applied": `staging` moved to a later `master`
  commit after preflight passed (preflight usually catches this first).
  Nothing was moved or deployed. Fix: run Staging sync from `master` (Actions → **Staging sync** →
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

**Staging test branch** (nothing is ever moved on the `staging` branch)

- "The branch name must look like hdesk/<words> or shared/<words>": put
  only the branch name in the **ref** box, for example
  `hdesk/fix-work-notes-box`.
- "does not exist on GitHub": push the branch first.
- "does not contain the latest master": update the branch from `master`,
  push, and run it again.
- "changes supabase/migrations/… (git status M, D or R)": the branch edits,
  deletes or renames a migration already on `master`. Never do that; add a
  new migration instead.
- "sorts before master's newest migration": a newer migration reached
  `master` after this one was created. Create it again with a new timestamp
  (`supabase migration new`), but only if it was never applied to staging;
  if it was, ask Alex.
- "must sit directly in supabase/migrations/ and be named …" or "other than
  a plain file": rename it to `<14 digits>_<lowercase_words>.sql`, directly
  in `supabase/migrations/`, as a normal file.
- "The dry run names migrations that are not this branch's new files":
  nothing was applied. Usually Staging sync hasn't applied a `master`
  migration yet: run **Staging sync** from `master`, then run this again.
- The dry run fails with "Remote migration versions not found in local
  migrations directory": another branch's migration is on staging (see
  "Afterwards" above). Wait for that branch to merge, or ask its owner.
- `deploy-site`: "STAGING_DEPLOY_TOKEN is not set" or HTTP 401/403: see
  Secret 2. The workflow fails here instead of passing with a notice,
  because a branch test that deploys nothing is useless.

## If student-portal is made private

- Environments with deployment-branch rules and environment secrets in private
  repositories may require a paid GitHub plan. Check before switching, or the
  secrets stop being available to these jobs.
- The `preflight` job reads `staging` and `master` without a token today; it
  would need its checkout to keep the read-only token
  (`persist-credentials: true`).
- student-portal-staging's deploy checks out student-portal anonymously today.
  It would need a read-only token for student-portal (see the `token:` comment in
  `deploy-staging.yml`).
- Logs would no longer be public, but the rule against printing secrets stays.
