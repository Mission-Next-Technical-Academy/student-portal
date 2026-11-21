---
paths:
  - "tests/**"
  - "supabase/tests/**"
  - "bin/ci-check.sh"
  - "bin/db-security-check.sh"
---

# Testing rules

Updated 2026-11-14.

## Running

- `bash bin/ci-check.sh` is the read-only shared gate, locally and in CI.
- Add every new test file to `bin/ci-check.sh` so CI runs it.
- `bin/qa-sweep.sh` writes to `local-tasks/QA_LOG.md`; use it only to update QA history.
- Run `bin/db-security-check.sh` for `supabase/tests/*.sql` RLS and grant tests.

## Writing

- Test what a role can and cannot do by impersonating real API roles.
- Roll every SQL test back; never leave fixture rows behind.
- When changing shared submission code, test both SOC and Help Desk callers.
- Cover below-pass, passing and failed-write paths for `recordLabAttempt()`.
- Use scores other than 100 in grading tests so a default cannot hide.
- Compare failures with the known baseline before blaming your change.

## Prove It test matrix

Every new or materially changed Prove It covers:

- a perfect investigation (near or full credit);
- a partial investigation with real secondary evidence (partial credit);
- different valid paths (equal credit for equal evidence);
- extra exploration with correct determinations (no penalty);
- an explicit unsupported conclusion (that competency reduced);
- strong analysis with weak writing, and weak analysis with polished writing;
- the instructor view showing findings, actions, breakdown and full response.
