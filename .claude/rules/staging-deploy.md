---
paths:
  - ".github/**"
  - "bin/ci/**"
  - "bin/dev.sh"
  - "bin/serve.py"
  - "bin/stamp-version.sh"
  - "VERSION"
  - "portal/release.js"
  - "portal/supabase-config.js"
---

# Staging, deploy and versioning

Updated 2026-11-14 (Staging test branch, PR #108). Setup, secrets and failure recovery: `docs/operations/STAGING_AUTOMATION.md`.

## Staging

- Only the Staging sync workflow moves the `staging` branch.
- Never push, merge into, reset or force `staging`.
- To test a branch on hosted staging, push it and update it from `master`.
- Then run Staging test branch from `master`: `gh workflow run staging-test-branch.yml --ref master -f ref=<branch>`.
- An agent may start that run without asking (Megan, 2026-11-14). Report which migrations it put on staging.
- Staging test branch accepts only `hdesk/` and `shared/` branches.
- Before starting Staging test branch for a branch with migrations, read each new migration. Stop and ask Megan if one drops a table or column, deletes or truncates rows, or changes anything outside the branch's task.
- The run applies only the branch's new migrations to staging and deploys its exact commit.
- It refuses a branch whose migration sorts before `master`'s newest.
- For such a branch, a person uses the hand fallback in `STAGING_AUTOMATION.md`.
- A branch migration on staging makes Staging sync fail on every `master` merge until it merges.
- Tell the team when a branch migration is on staging.
- Never rename a migration after it reached staging.
- Changing a migration after it reached staging has no effect there. Put the change in a new migration file.
- If sync stops at the functions gate, a person deploys, then reruns sync from `master`.
- If staging is ahead or diverged, a person reruns Staging sync from `master`.
- Never fix staging by hand.

## Workflows

- Workflow logs are public. Never print a secret or a value built from one.
- Keep `bin/ci/migrate-staging.sh` redaction intact; `tests/staging-sync-scripts.test.js` checks it.
- Never check out or run pull-request code in a privileged workflow.
- Never let automation touch the production project `eokvngifirjgfozzbieu`.

## Local serving

- `portal/supabase-config.js` names production on purpose; never repoint it.
- Never pass `--allow-production` to `bin/serve.py`.

## Versioning

- Deploys version themselves as `1.<59000 + N - 590>`, N = commits on `master`.
- Never hand-edit the counter; run `bin/stamp-version.sh` to sync `VERSION` and `portal/release.js`.
