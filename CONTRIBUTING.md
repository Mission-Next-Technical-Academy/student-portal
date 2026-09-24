# Working on the student portal

Use one branch and one working directory per task. Keep each PR limited to SOC,
M360, Helpdesk, or shared maintenance. This prevents unfinished work from one
track being carried into another track's PR.

| Area | Owner |
| --- | --- |
| SOC modules, imported labs, range tools | @cyberdude88 |
| M360 | @randy608 |
| Helpdesk (`portal/it-support-*`) | @mcorreira |
| Shared portal shell, data, module lab helpers, CI | All three maintainers |

`.github/CODEOWNERS` requests review from the listed owners when a PR is ready
and its base branch contains the ownership file. It does not prevent edits or
require every listed owner to approve. Enforcing approvals requires GitHub
branch protection; this cleanup does not change repository protection settings.

## Start a task

Start new work from current `master`, in a separate worktree. For example:

```bash
git fetch origin
git worktree add -b soc/my-task ../student-portal-soc-my-task origin/master
```

Use `m360/`, `helpdesk/`, or `maintenance/` instead of `soc/` as appropriate.
Work and commit inside the new directory. Leave any existing uncommitted work
in its original directory.

## Shared files

`portal/app.js`, `portal/index.html`, `portal/data.js`, and
`portal/module-labs.*` serve multiple tracks. Explain changes to these files in
the PR and request review from affected owners. Put track-specific behavior in
its existing track files where practical. Keep shared maintenance in its own
PR; avoid unrelated refactors while fixing a course.

## Before merging

Run `bash bin/ci-check.sh` and wait for applicable GitHub checks to pass. M360
changes also run the M360 gates and browser regression workflows. Passing
checks reduce risk but do not replace review of shared-file behavior.

If a course PR depends on a maintenance PR, temporarily base it on that
maintenance branch. Merge maintenance first, change the course PR's base back
to `master`, and wait for checks again. Use a regular merge for the maintenance
PR to preserve ancestry and keep the dependent diff clear.

## Current cleanup

`maintenance/m360-gates-and-ownership` contains only gate repairs, regression
checks, and collaboration files. PR #34 retains the existing SOC/lab changes
and depends on that maintenance branch. The portal comment correction belongs
with the SOC code that introduced the comment. No Helpdesk runtime files are
changed by this cleanup.
