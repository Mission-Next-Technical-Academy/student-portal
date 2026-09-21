# Engineering handoff index

For active direction, start with `ROADMAP.md`, then the governing
specification for its selected work item. This file records concise evidence
for that active item only; move finished entries to `archive/session-logs/`
or a focused completed-feature note. `NEXT_SESSION.md` is a compatibility
pointer and must not become a second task queue.

The prior chronological engineering handoff is preserved at
`archive/session-logs/HANDOFF_THROUGH_2026-09-10.md`.

## Pending scoping input — 2026-09-21

`HANDOFF_2026-09-21_EVIDENCE_LOG_SIFT_FINDINGS.md` — investigation only, no
code changed. Found that a masked-input, read-the-real-log evidence recall
mechanic (dense `SIGNIN_LOG_EVENTS` log table, per-fact `template`/`blanks`,
`moduleOneBlankForm`) is already substantially built for Module 1's ALT-1001
Practice It case but never wired into the live evidence-review UI. Owner
separately asked for exactly this kind of log-sifting mechanic, plus a
per-evidence "go to logs" button and the same treatment for the NST-2407
Prove It case. This is scoping input for `ROADMAP.md` item 3, which is not
yet unblocked — read that doc before starting any build from it.

## Current baseline — 2026-09-20

- `ROADMAP.md` is the canonical delivery queue.
- `INSTRUCTIONAL_ARCHITECTURE.md` (added 2026-09-20) is the detailed
  Learn it → Practice it → Prove it pedagogy reference — guidance-reduction
  curve, skill carryover, and the per-module "finished" rubric. Documentation
  only; no code changed. It does not override `MODULE_STANDARD.md` or
  `CURRICULUM_ALIGNMENT_ARCHITECTURE.md`.
- Module 1 begins with the required LMS orientation tour; the subsequent
  assessment is simulator-first and instructor-reviewable.
- The next substantive build is the Module 1 performance assessment after
  orientation verification and controlled faculty-gate UAT.
- Arc A (Modules 02 → 03) remains queued curriculum work; Arc B is undecided
  and the old 07 → 04 proposal must not be built.
- Message Instructor is complete and universal: the persistent student-program
  and module banners open the same focused compose pane. Do not add separate
  module-specific message threads or compose flows.
- **Fixed and applied, 2026-09-20:** `username`/`name` in
  `buildCoreUserFromSession()` (`portal/app.js`) no longer falls back to the
  raw session email (domain and all) when a `students` row lookup fails —
  `emailToDisplayId()` strips the domain instead. The specific triggering
  account, `7634107909-SOCAN` (previously showing as
  `7634107909-socan@missionnext.example`), was repaired live via
  `supabase/migrations/20260920130000_fix_lowercase_socan_login_id.sql`
  (owner ran `supabase db push`, confirmed applied). No other accounts are
  known to be affected — same failure class as the earlier
  Module-1-beacon-gap accounts (see
  `lab-grading-notification-system/STATE.md`), worth a quick check if a
  similar lowercase/`@missionnext.example` display turns up again.
- CI validation is `bash bin/ci-check.sh`; GitHub Pages repeats it before
  deployment.
