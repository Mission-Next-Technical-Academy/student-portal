# Proposed M360 Gate 6 fix

This branch intentionally leaves the M360 runtime untouched.

The failed Gate 6 run was caused by a stale regression assertion: the workflow
required `coachReturn === 'm01'` to remain in `portal/m360-entry.js`, while the
current design documents that post-login return handling as owned by
`portal/app.js`. The runtime already contains that check in `app.js`; the
M360 entry overlay no longer owns it.

The proposed change removes only that obsolete token from
`.github/workflows/m360-gate6-regression-check.yml`.

If accepted, migrate it with either:

```sh
git fetch origin
git cherry-pick <this-branch-commit>
```

or merge the pull request. No M360 product files or Supabase migrations are
required.
