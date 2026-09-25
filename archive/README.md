# Archive

Historical and completed-work documents, moved out of the repo root
2026-08-31 so the root only shows currently-relevant docs. Nothing here was
deleted — full history is in git (`git log --follow -- archive/...`). None
of this governs current decisions; see `NEXT_SESSION.md` and
`CURRICULUM_ALIGNMENT_ARCHITECTURE.md` §0 at the repo root for that.

## When to archive a doc

Standing rule, not a one-time cleanup: whenever every task/checkbox tracked
in a root-level markdown doc is complete (or the doc explicitly self-marks
itself done/superseded), move that file into `archive/` — don't leave
finished planning docs sitting at the root next to the ones still tracking
open work. This applies to sprint entries added to `NEXT_SESSION.md` too:
once a sprint entry's work is done and verified, it should move out of the
active top of `NEXT_SESSION.md` into `archive/` (or be folded into a dated
`archive/completed-feature-notes/` write-up) rather than accumulate
indefinitely at the top of that file.

- Use `git mv`, never delete — full history stays intact
  (`git log --follow -- archive/<path>`).
- File into the existing category it fits (`legacy-sc200-simulator/` for
  pre-Mission-Next SC-200 material, `completed-feature-notes/` for shipped
  feature/fix write-ups) or start a new category if neither fits.
- Add an entry describing the file and why it's done to the matching section
  below (or a new section) — don't just move the file silently.
- If a doc is only *partially* done (some items still open), it stays at the
  root; don't archive a doc with open items just to tidy up.

## `legacy-sc200-simulator/`

Docs from the pre-Mission-Next SC-200 study/lab project and its early
product-architecture planning, explicitly classified as historical-only by
`CURRICULUM_ALIGNMENT_ARCHITECTURE.md`'s own decision hierarchy (§1, tier 6):

- `ExamObjectives.md`, `SC200_LAB.md` — legacy SC-200 certification scope,
  self-marked "no longer scope authority."
- `COVERAGE_SWEEP.md`, `GAP_BRIDGE.md`, `GAP_BRIDGE_FINDINGS.md`,
  `OBJECTIVES_DELTA.md` — completed content-gap audit sessions from
  2026-06-28 through 2026-07-07.
- `LAB_MANAGEMENT.md` — a 2026-07-06 dev-process handoff for the old `ui/`
  simulator, superseded by `PROJECT_GUIDE_FOR_AI.md` and `HANDOFF.md`.
- `AGENTS.md` — inherited per-agent task checklist; all current planning uses
  the root handoff and workstream state documents instead.
- `PRODUCT_ARCHITECTURE_PLAN.md` (2026-08-05) and `PLATFORM_ARCHITECTURE.md`
  (2026-08-17, still headed "draft v1, no implementation started" even
  though the portal/simulator unification and backend simplification it
  planned have since shipped — see `architecture.md` at the repo root for
  current, accurate status) — early architecture plans, executed.

## `completed-feature-notes/`

Feature/fix write-ups and progress snapshots for work that finished and is
live, each already self-marked done or all-checkboxes-complete at the time
of archiving:

- `ATTACK_STORY_GRAPH_FIX.md`, `LEFT_NAV_DROPDOWNS.md` — shipped UI fixes.
- `DEVICE_PAGE_PARITY.md` — checklist, all core items `[x]`; the few
  remaining lines are labeled "gravy," not required.
- `STOPPING_POINT_2026-08-18.md` — explicitly "complete and verified."
- `MODULAR_LAB_PROGRAM_PROGRESS.md` — Waves 1-4 complete; reconciled against
  the later curriculum-alignment wave in its own closing note.
- `ACTIVITY_MONITOR_CHEATING_FLAGS_CLOBBER_2026-09-10.md` — the admin
  Activity Monitor's "0 sign-ins total" bug (data fetched fine, RLS fine,
  but the DOM never updated) traced to a stray `cheatingFlagsByUserId` key
  in `loadAdminLazyTab('activity')`'s return value clobbering the real `Map`
  via `Object.assign`, throwing inside `viewAdmin()` before `app.innerHTML`
  was ever reassigned — silently broke every admin tab switch afterward, not
  just Activity Monitor. Fixed, verified live in Chrome (166 sign-ins
  rendering, Cohorts tab still working afterward). Left as an uncommitted
  working-tree change for the site owner to review before committing —
  the write-up itself is done and verified, hence archived now.
- `PROGRESS_M07_EMAIL_KQL.md` — Module 7 email/KQL UI shipped. Two minor
  items were explicitly flagged as not done in the note itself (an
  "Initial Access" evidence marker and auto-populating the final report from
  evidence) — worth a look if Module 7's evidence/report flow is revisited,
  but they didn't block shipping and aren't tracked elsewhere.
- `COHORT_PDF_LINKAGE_AND_SORTABLE_COLUMNS_2026-08-31.md` — the cohort PDF's
  Student-to-Program Linkage Detail table and the admin dashboard's sortable
  column headers, both implemented and verified live this session.
- `COHORT_USER_LIFECYCLE_SPRINT_PLAN_2026-09-01.md` — "Generate New User"/"Generate
  New Cohort" admin buttons, automatic cohort-expiry archival (`pg_cron` +
  `archive_expired_cohorts()`, never touching the compliance-of-record tables), and
  Activity Monitor site-time/force-sign-out. All six sprints code-complete and locally
  verified; see `NEXT_SESSION.md`'s 2026-09-01 entry for the still-open deployment
  checklist (migrations, Edge Function deploy, secrets, cron) — not yet pushed/live.
- `MULTITRACK_ADMIN_M360_PROGRESS_ARCHITECTURE.md` — completed multi-track admin
  and M360 progress delivery: four-track M360 eligibility, the admin read model,
  track workspaces, accessible coming-soon cards, and reviewer track filtering.
  Static acceptance verification passed; live Supabase migration/RLS checks remain
  a deployment-environment task.
- `QUERY_PERFORMANCE_AUDIT_2026-09-09.md` — query-shape, projection, telemetry,
  and Query Logging audit; local verification passed, while staging plans,
  baseline collection, and migration application remain external deployment gates.
- `COURSE_STANDARDIZATION_SPRINT_PLAN_2026-09-10.md` — all 17 SOC course
  standardization sprints complete and locally QA-verified. The separate
  Module 01 assessment decision remains active in its own progress document.
- `MODULE_PROGRESS_INTEGRITY_SPRINT_2026-09-10.md` — Module 01 completion
  integrity audit and fix: a module can no longer be marked complete from Lab
  1 alone or from a coarse historical summary record while its detailed work
  is unfinished.
- `CURRICULUM_SCENARIO_ARCHITECTURE_2026-09-10.md` — the completed 14-sprint
  scenario-upgrade plan for the general SOC Analyst curriculum. Final QA
  reconciled the locked 82-hour ledger and documented the remaining legacy
  catalogue/schema findings; the associated module briefs and progress logs
  remain at the root as implementation records.
- `AI_ML_APPLIED_BUILD_TRACK_2026-09-10.md` — the repository-URL evidence
  upgrade for six AI/ML labs, built and browser-verified; its remaining
  human-evaluator policy question belongs to the active compliance decision
  record, not this completed implementation.
- `HELPDESK_CURRICULUM_SWEEP_2026-09-10.md` — completed day-one ticket-topic
  coverage audit and the shipped HD-2124 de-escalation ticket. Its resulting
  hour-mapping decision is tracked separately in `PROGRAM_PARITY_SPRINT_PLAN.md`.
- `MODULE_01_ENHANCEMENT_BUGFIXES_2026-09-07.md` — completed bug-review record;
  all fixes landed with their originating sprint commits.
- `AGENT4_PDF_PROGRESS.md` — completed 2026-08-29 PDF-rendering verification
  record. Its separately deferred policy/data-model questions remain in the
  active reporting workstream rather than this completed implementation note.
- `FINAL_CURRICULUM_SCENARIO_QA_2026-09-10.md` and
  `SPRINT_02_SCENARIO_CONTINUITY_AUDIT_2026-09-10.md` — completed local QA and
  audit records for the earlier scenario-architecture sprint. Human curriculum,
  compliance, and faculty approval remain external gates, not unfinished work
  in either record.

## `session-logs/`

- `NEXT_SESSION_THROUGH_2026-09-16.md` — prior chronological next-session
  ledger, retained whole when the active root handoff was condensed.
- `HANDOFF_THROUGH_2026-09-10.md` — prior chronological engineering handoff,
  retained whole for validation details and historical decisions.
- `SESSION_DEBRIEF_2026-09-18.md` — historical live-review and implementation
  notes from the 2026-09-18 Module 1 session. The current direction is in
  `ROADMAP.md`; the faculty-gate handoff links here where its evidence is
  needed.

## `historical-plans/`

- `SPRINT_PLAN_2026-08-17.md` — self-marked historical platform plan; its
  outdated status board no longer governs work.

## 2026-09-25 root sweep

Root cut from 78 md files to 18 so it only holds active SOC Analyst work
(roadmap, handoffs, canonical specs, open decisions). Every move was `git mv`;
path references in live docs and code comments were rewritten (applied
Supabase migrations were deliberately left untouched, so their comments still
cite the old root paths).

- `completed-feature-notes/` gained: `ACADEMY_ORIENTATION_SPRINT.md`,
  `M360_DEMO_COMPLETION_SPRINT.md`, `ADMIN_M360_DEDUP_SPRINT.md`,
  `MODULE_NAV_SIDEBAR_SPRINT.md`, `REPORTING_REMEDIATION_CONTINUATION.md`,
  `REPORTING_PDF_GAP_REMEDIATION_PLAN.md`, both `DEPLOY_PIPELINE_*_2026-09-22.md`,
  `DEBRIEF_2026-09-23_MISSION_NEXT_LAB_WIRING.md`,
  `FACULTY_GRADING_TICKET_VISIBILITY.md`, `HANDOFF_DIPLOMA_GENERATION.md`,
  `ACTIVITY_MONITOR_PERFORMANCE_FINDINGS.md`,
  `MODULE_03_MISSION_NEXT_LAB_RETURN_AND_COMPLETION.md` (was in `docs/`),
  `STAGING_INSTRUCTOR_ACCOUNTS.md` (shipped; still the staging-account
  reference), `HANDOFF_ADMIN_CREDENTIALS_VIEW.md` (shipped; its "remaining
  verification" and repo-privacy notes were never closed — revisit if the
  credentials panel is touched), `PROGRESS_INTEGRITY_COMPLETION_SPRINT.md`
  (one open audit line, now owned by ROADMAP item 4 /
  `module-completion-integrity/BRIEF.md`).
- `module-enhancement-records/` (new): the 22 `MODULE_NN_ENHANCEMENT_BRIEF.md` /
  `_PROGRESS.md` implementation records from the 2026-09-10 scenario
  architecture wave. Their only open items were external curriculum/compliance/
  faculty reviews, tracked in `COMPLIANCE_DECISIONS_NEEDED.md`.
- `historical-plans/` gained superseded plans: `00_current_state_scan.md` and
  `01_plan_of_action_milestones.md` (2026-09-13 baseline, superseded by
  `ROADMAP.md`), `HANDOFF_2026-09-21_EVIDENCE_LOG_SIFT_FINDINGS.md` (superseded
  by `MODULE_01_CASE_CONSOLE_SPEC.md`),
  `HANDOFF_2026-09-23_BOOTS2BYTES_MIGRATION_DISCOVERY.md`,
  `BOOTS2BYTES_MIGRATION_AGILE_HANDOFF.md`, `BOOTS2BYTES_LAB_INVENTORY.md`
  (all superseded by `HANDOFF_2026-09-23_MISSION_NEXT_LAB_WIRING.md`),
  `course_SOC_standardized.md` (executed by the course-standardization sprint),
  `unfinished_work.md` (a behavior note, nothing unfinished),
  `SESSION_LOG_RETENTION_RESEARCH.md` (research; retention policy still awaits
  an owner answer).
- `session-logs/` gained `LATEST_PROGRESS.md` (status date 2026-09-09, stale).

Moved to `docs/` instead (still-valid reference, not work instructions):
`NAV_SPEC.md`, `ANOMALY_RULES.md`, `MNT_DESIGN_TOKENS.md`,
`SESSION_SECURITY_SPEC.md`, `ADMIN_RESET_FLOW.md`,
`STUDENT_LOGIN_COURSEWORK_REDIRECT.md`, `RELEASE_VERSIONING.md`,
`FORM301_CHECKLIST_ALIGNMENT_REVIEW.md`, `SCHEMA_MIGRATION_HYGIENE.md`.
Non-SOC material went to `docs/other-tracks/`:
`AI_ML_ENGINEERING_CURRICULUM.md`, `PROGRAM_PARITY_SPRINT_PLAN.md` (open
IT Support / AI-ML sprints).

## Still active, not archived

`CURRICULUM_MAP.md` stays at the root — `bin/curriculum-check.js` reads it
there and it mirrors `portal/data.js`'s compliance data. `MODULE_STANDARD.md`
stays as the canonical module layout for all four tracks.
