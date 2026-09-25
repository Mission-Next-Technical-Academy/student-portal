# Reporting/PDF remediation — continuation handoff

Date: 2026-08-29
Status: final cleanup sprint complete; committed locally. Do not delete
`REPORTING_PDF_GAP_REMEDIATION_PLAN.md` yet because operational retention
decisions remain (see below).

**2026-08-31 correction:** this file's "unapplied migrations" language below
is stale. `supabase migration list --linked` now shows all of
`20260829120000`, `20260829125000`, `20260829130000`, and `20260829133000`
applied on both Local and Remote — the site owner has since run
`supabase db push`. Item 1 under "Remaining operational work" is done;
items 2-5 (annual-report query wiring, legal-name source, PDF-byte retention
policy, full browser QA pass) are still open.

## Direction

Finish every applicable workstream in `REPORTING_PDF_GAP_REMEDIATION_PLAN.md`,
then run the Agent 9 QA matrix and verify the acceptance criteria in section
12. ~~Migrations are **written only**: do not run `supabase db push` or alter
the live Supabase project without explicit user approval.~~ (2026-08-31: the
site owner has since pushed all of them — see correction above. This
sentence is left for historical context; it no longer describes the current
state.)

## Completed in this session

- Final cleanup sprint:
  - Added the written-only report audit migration
    `supabase/migrations/20260829133000_report_generation_audit.sql` with
    `report_generation_audit`, admin-only RLS, metadata/hash fields, and
    `finalize_report_generation_audit()`.
  - Updated `portal/app.js` so the cohort PDF uses durable audit rows when the
    migration is live, but still downloads a draft-only PDF with an explicit
    audit-unavailable warning when the local migration has not been applied.
  - Added a distinct **Download Internal Gap Report (PDF)** action in the admin
    report preview. It renders requirement, status, source, evidence included,
    missing fields, owner, remediation target, and last validation date without
    converting partial/missing/unknown requirements into covered claims.
  - Updated stale comments/spec text around transcript PDFs, fixed-credit
    hours, capstone review/artifacts, credential-award schema, and report audit
    status.
- Agent 4 PDF generation was resumed and verified in a fresh browser runtime:
  cohort, transcript, and evidence documents emitted valid `%PDF-` data; a
  500-record cohort produced a 22-page document with repeated roster headers.
- PDF failure handling now checks the vendored runtime and logo response; local
  report history is recorded only after a successful save.
- Workstream I is implemented in `portal/app.js`: **Save Progress File (All
  Students)** respects the dashboard's selected track / Hide Not Started
  scope, reads snapshots sequentially, and downloads one combined recovery
  JSON file. It never changes enrollment or progress.
- Agent 5 added the unapplied enrollment/reporting migration
  `supabase/migrations/20260829125000_enrollment_reporting_history.sql` plus
  planning/report-period controls and Form-801 source handling.
- Agent 6 added the unapplied fixed-credit migration
  `supabase/migrations/20260829130000_fixed_credit_hours.sql` and transcript
  hour reconciliation. The approved model is fixed credit, not elapsed-time
  attendance.
- Agent 7 added the unapplied
  `supabase/migrations/20260829120000_assessment_review_and_artifacts.sql`,
  capstone evidence snapshots, optional faculty review, and evidence/PDF
  integration.

## Remaining operational work

1. ~~Apply/review the written Supabase migrations through the authorized
   database process.~~ **Done, confirmed 2026-08-31** via
   `supabase migration list --linked`.
2. Integrate `admin_enrollment_reporting` into a true historical annual report
   query once the enrollment-history migration is live.
3. Add the approved student legal-name/lawful-substitute source.
4. Define durable PDF-byte storage, retrieval-after-archival, backup, deletion,
   and retention procedures. The report audit migration records metadata and
   hashes, not file bytes.
5. Re-run authenticated admin/browser PDF inspection and the full edge-case
   QA matrix against a deployed/mocked schema.

## Validation already run

- `node --check portal/app.js`
- `node --check portal/data.js`
- `node --check portal/module-12.js`
- `node bin/portal-check.js`
- `node bin/render_all.js`
- `git diff --check`
- `curl -sS -o /dev/null -w '8768 %{http_code}\n' http://127.0.0.1:8768/`
- `curl -sS -o /dev/null -w '8767 %{http_code}\n' http://127.0.0.1:8767/`

All passed in the final cleanup sprint. The portal and simulator servers were
running on ports 8768 and 8767 during validation.

## Agent choice

Use a lightweight model/agent for orchestration and documentation, and reserve
stronger implementation agents for the remaining Workstream F, B4 report,
and final QA tasks. Read this file, `LATEST_PROGRESS.md`,
`PROJECT_GUIDE_FOR_AI.md`, `HANDOFF.md`, and the remediation plan before
changing code.
