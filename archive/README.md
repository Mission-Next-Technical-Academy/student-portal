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

## Still active, not archived

`NAV_SPEC.md`, `ANOMALY_RULES.md`, `MNT_DESIGN_TOKENS.md`, and
`MODULE_STANDARD.md` stayed at the repo root — they document current,
in-use behavior (the live `ui/` simulator nav/rules, extracted design
tokens, the canonical module layout all four tracks still follow), not a
finished task. `CURRICULUM_MAP.md` also stayed — it's the same
`2026-08-28-developer-map-v1` revision `portal/data.js`'s compliance data
mirrors right now.
