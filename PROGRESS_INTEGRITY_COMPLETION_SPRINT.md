# Verified Progress & Synthetic End-to-End Completion Sprint

## Objective

Make the portal display only durable, backend-verified learner work for every student and every active technical course. Create one explicitly designated synthetic test student that can complete all 12 technical modules and the M360 course through the same backend callbacks, reviewer actions, and finalization gates used in production.

## Non-negotiable rules

- **Staging-only through go-live:** the go-live date is **November 2**. Until then, every credential, synthetic student, submission, review, approval, attendance record, and finalization in this sprint is staging data only. Do not use production learner or staff credentials.
- `module_progress` is working-state only; it is never the completion source.
- Cards, percentages, admin reporting, and Review Module must use the same backend read model.
- A synthetic student is opt-in by explicit student ID/UUID. No roster-wide synthetic writes.
- Roster-wide correction is allowed only to remove unsupported completion claims; attempts and audit records are never deleted.
- M360 approval/finalization uses existing staff RPCs and requires a real authorized admin session. Never bypass it with direct SQL.

## Sprint 1 — Verified technical progress (complete)

- [x] Add canonical backend lab-to-module requirements for SOC, IT Support, and AI/ML.
- [x] Derive `student_verified_module_progress` and `course_progress` from passing durable attempts.
- [x] Reconcile stale `module_progress = complete` rows that have no supporting work.
- [x] Make portal percentages/module cards read verified status, not localStorage or raw module rows.
- [x] Add database reconciliation callback after every lab-attempt write.
- [x] Persist the three previously local-only SOC independent-lab submissions.
- [x] Deploy migrations `20260916100000_verified_assessment_progress.sql` and `20260916110000_module_one_evidence_integrity.sql`.

## Sprint 2 — Detailed-review integrity (in progress)

- [x] Add per-requirement evidence storage for Module 1's nine lessons and knowledge check.
- [x] Reject historical aggregate-only Module 1 completion because it cannot prove individual review items.
- [x] Make Module 1 review show its same durable evidence source.
- [ ] Audit every module's Review Module UI against its backend completion requirements; add requirement-level records wherever a UI presently reads browser-only detail.

## Sprint 3 — Controlled synthetic technical completion (complete)

Delivered: `bin/synthesize-soc-m360-completion.js` and `bin/SYNTHETIC_COMPLETION_RUNBOOK.md`.

The idempotent runner:

1. Requires `--student-id` and an explicit `--confirm-synthetic` switch.
2. Resolves that student and confirms their `SOCAN` enrollment before any write.
3. Creates passing, append-only lab attempts for every required SOC module/lab and Module 1 requirement evidence.
4. Lets the database callback calculate verified module/course progress.
5. Prints a before/after verification report from `student_verified_module_progress` and `course_progress`.
6. Refuses to run against admin accounts, a missing student, or a non-SOCAN account.

Acceptance: exactly 12 verified modules and 100% technical completion for the designated synthetic student; no other student's record changes.

Verified on the controlled staging fixture `4437023872-SOCAN` on 2026-09-16: **12/12 verified technical modules**.

## Sprint 4 — Controlled synthetic M360 completion (complete)

The same controlled runner and runbook:

1. Requires the same explicit synthetic student target.
2. Creates valid Week 1–6 submissions via the supported M360 submission path.
3. Lists the six submissions for an authorized admin to review through `m360_admin_review_week` at >=70.
4. Records required attendance and Career Spotlight verification using staff RPCs.
5. Uses `m360_admin_finalize_course` only after all official gates are satisfied.
6. Verifies `m360_course_progress.course_complete = true` and preserves all audit rows.

Acceptance: the admin screen shows six accepted weeks, required verification records, final grade, and an immutable completed course for the designated synthetic student.

Verified on the controlled staging fixture `4437023872-SOCAN` on 2026-09-16: **six accepted weeks and finalized M360 completion**.

## Sprint 5 — Regression proof and rollout (pending synthetic target)

- Run the portal against a student with unsupported historical completion: percentage must fall to the supported value and Review Module must agree.
- Run the synthetic student through both technical and M360 paths.
- Validate admin dashboard, student dashboard, and review pages all report identical counts.
- Commit code/migrations/scripts with the synthetic student identifier excluded from source control.

## Current operator action

The code and two migrations are deployed. Reload the portal before evaluating the corrected UI. Existing unsupported Module 1 completion is intentionally no longer green; it must be backed by the new individual evidence records. The controlled staging runner was executed successfully for `4437023872-SOCAN`; its work is explicitly labelled `SYNTHETIC-QA` in durable records.
