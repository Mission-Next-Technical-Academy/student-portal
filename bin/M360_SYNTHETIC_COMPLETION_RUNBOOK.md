# Controlled synthetic M360 completion

> **Staging-only until November 2 go-live.** All credentials, synthetic
> records, submissions, reviews, attendance entries, and finalizations in
> this runbook must use staging data. Do not use production identities.

`bin/m360-synthetic-complete.js` is a guarded fixture runner for one test
student. It uses the authenticated student submission RPCs and authorized
admin review, attendance-evidence, Spotlight, and finalization RPCs. It never
uses service-role credentials or direct table writes.

Safety controls:

- `--student-id` is mandatory and must resolve to exactly one enrolled,
  non-admin `SOCAN` student with a controlled cohort.
- The default is a no-write plan mode.
- Network writes require both `--execute` and `--confirm-synthetic`.
- Student and admin passwords are read only from environment variables and
  must never be committed.
- The admin account must be marked `is_admin`; the database still enforces
  M360 faculty-review/finalizer authorization.

Plan (no writes):

```sh
node bin/m360-synthetic-complete.js --student-id '<EXPLICIT_TEST_STUDENT_ID>'
```

Authorized execution (operator-only; do not run as part of CI):

```sh
M360_STUDENT_EMAIL='...' M360_STUDENT_PASSWORD='...' \
M360_ADMIN_EMAIL='...' M360_ADMIN_PASSWORD='...' \
node bin/m360-synthetic-complete.js \
  --student-id '<EXPLICIT_TEST_STUDENT_ID>' \
  --execute --confirm-synthetic
```

The runner submits six authored artifacts, completes Start Here, accepts all
six weeks at scores above 70, records 720 controlled attendance minutes,
records a `presented_live` Career Spotlight reference, and calls
`m360_admin_finalize_course`. A missing faculty authorization or any failed
gate stops the run; no bypass is attempted.

This repository change does not execute the flow or approve any student.
