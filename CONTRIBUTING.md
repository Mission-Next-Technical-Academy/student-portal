# Working on the student portal

Updated 2026-11-14. Agent rules: `CLAUDE.md`. Merge and staging steps: `.claude/rules/staging-deploy.md`.

| Area | Owner | Branch prefix |
| --- | --- | --- |
| SOC modules, imported labs, range tools | @cyberdude88 | `soc/` |
| M360 | @randy608 | `m360/` |
| Help Desk (`portal/it-support-*`, `ui/helpdesk*`) | @mcorreira | `hdesk/` |
| Shared portal shell, data, module lab helpers, CI | All three maintainers | `shared/` |

`.github/CODEOWNERS` requests review from these owners. It does not enforce
approval; only GitHub branch protection can.

## Start a task

- Start each task on its own branch from current `master`.
- A separate `git worktree` per task is optional; it keeps unfinished work apart.
- Keep each PR to one track or one shared task.

## Shared files

- Explain every change to a shared file in the PR.
- Request review from the owners it affects.
- Put track-only behavior in that track's files.
- Avoid unrelated refactors while fixing a course.

## Before merging

- Run `bash bin/ci-check.sh` and wait for the GitHub checks.
- M360 changes also run the M360 gate and browser regression workflows.
- If a course PR depends on a shared PR, base it on that branch until the shared PR merges.
- Squash and merge.
