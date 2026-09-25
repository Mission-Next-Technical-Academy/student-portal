# Migration squash policy

## Why

`supabase/migrations/` accumulates one file per change forever — today's
session control work alone added 4 files on top of ~30 already there since
2026-08-17. Every one of those replays, in order, any time a fresh
environment bootstraps (a new preview branch, a new developer's local
`supabase start`, disaster recovery). That replay only gets slower and
riskier as the folder grows — an old migration written against
assumptions a later migration invalidated can fail to reapply cleanly even
though the *live* project has been fine for months. Site owner: flush this
periodically, roughly once per cohort, rather than letting it grow
unbounded.

## The key fact that makes this safe

Squashing **local migration files** does not require touching the **live**
project's applied-migration history at all. `supabase_migrations.schema_migrations`
on the linked project already has every one of those old version numbers
recorded as applied — `supabase db push` only ever applies versions it
doesn't already see recorded there. Deleting or archiving the old local
`.sql` files changes nothing about what's already live; it only changes
what a *fresh* environment would have to replay from empty. That's the
entire value of doing this: faster, simpler, less fragile bootstraps —
never a live-schema change, and this procedure must never touch
`schema_migrations` on the linked project.

## When to run it

Tie it to the existing cohort lifecycle rather than an arbitrary calendar
date — `archive_expired_cohorts()` (`20260901121000_cohort_archival_engine.sql`)
already runs daily via `pg_cron` and is the schema's own "a cohort just
ended" signal. Reasonable trigger: the first session after a cohort
archives, or at minimum before onboarding a new cohort's worth of
migrations. Site owner should confirm which cadence they actually want;
either is fine, just pick one and stick to it rather than doing this
ad hoc.

## Procedure

1. **Confirm zero drift first.** `supabase migration list --linked` — every
   local version must also show a matching remote version, with no
   desynced or pending rows (exactly the kind of gap this repo just hit on
   2026-09-06 with `20260906120000` — a stale `schema_migrations` row with
   no matching applied schema; see `NEXT_SESSION.md`). Fix any drift with
   `supabase migration repair` before squashing anything — squashing on top
   of an already-desynced history just buries the problem in a bigger file.
2. **Dump the live project's current full schema** to a single new baseline
   migration file (`supabase db dump --linked --schema public -f
   supabase/migrations/<new-timestamp>_baseline.sql` — confirm the exact
   dump flags against whatever CLI version is installed at the time; they
   have changed across CLI releases, don't copy this verbatim without
   checking `supabase db dump --help` first).
3. **Move every migration file the baseline now supersedes into
   `supabase/migrations/archive/`** (a subfolder — the Supabase CLI does not
   scan subfolders for migrations to replay, so this removes them from the
   bootstrap path while keeping them in git history/blame, mirroring this
   repo's existing top-level `archive/` convention for markdown docs,
   `archive/README.md`). Do not delete them outright.
4. **Leave `schema_migrations` on the linked project untouched.** No
   `migration repair` call is needed or wanted here — the live project's
   history is already correct and this procedure does not change live
   schema at all.
5. **Verify with a fresh bootstrap**, not just a diff: spin up
   `supabase start` locally (or a throwaway preview branch) from the
   squashed migration set alone and confirm it reaches the same shape as
   `supabase db diff --linked` reports for the live project. A diff alone
   only proves the SQL text matches; a real bootstrap proves the squashed
   file set actually replays cleanly end to end.
6. Only squash migrations that have been **confirmed live and stable** for
   a while. Never fold a just-written, just-pushed migration into a
   baseline before it's had a chance to prove itself — if something in it
   needs a follow-up fix, that follow-up is far easier to write and reason
   about against the original small file than against a baseline that's
   already absorbed it.

## Not done as part of this session

This is a policy/runbook, not something executed today — squashing while
the 2026-09-06 migration-history desync (`20260906120000`) is still being
untangled would add risk on top of risk. Run this the next time a cohort
boundary comes up, once the current session-control migrations are
confirmed pushed and stable.
