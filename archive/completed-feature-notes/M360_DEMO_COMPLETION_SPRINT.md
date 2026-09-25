# M360 demo completion: 4437023872-SOCAN + diploma-gate audit

Date: 2026-09-09. Goal: make training account `4437023872-SOCAN`
(Technical 12/12 already true) show as a genuinely, fully complete
student — all 6 M360 weeks accepted, attendance verified, Career
Spotlight presented, Start Here complete — using real submission content
and the app's own RPCs (not a display trick, not raw table writes),
faithful to the existing M360 rubric/curriculum. No curriculum, rubric,
or schema changes — content only.

## Sprint 1 — diploma eligibility gate (done)

`Generate Diploma`'s eligibility check used `percent_complete >= 100`,
which is **technical-only** (`normalizeAdminProgramProgressRows`). A
student who finished all 12 technical modules but had 0/6 M360 weeks
accepted already passed that gate — exactly `4437023872-SOCAN`'s
starting state. Fixed to use `program_requirements_complete`, a boolean
the `admin_student_program_progress` view already computes correctly
(technical done AND, on M360-required tracks, `m360_course_complete`).

**Status: done, pushed** — commit `8aee62b`.

## Sprint 2 — populate faithful M360 completion for 4437023872-SOCAN

Content authored for all 6 weeks (career direction, LinkedIn, networking,
resume, interview prep, Career Spotlight), matching each week's actual
field schema read from `portal/m360/week{3,4,5,6}.js` and
`m360-production-bridge.js` (week 1/2 shapes). Execution path is the
app's real RPCs, run as the student then as admin — the same effect as
completing the course through the UI:

1. Sign in as the student (`bin/.roster-output/SOCAN-*.csv` credentials).
2. `m360_save_draft` + `m360_submit_week` for weeks 1–6 with the authored
   payloads.
3. `m360_save_start_here` (`p_complete: true`, networking/interview
   readiness rated 5/5).
4. Sign in as ADMIN (`bin/.roster-output/ADMIN-*.csv`).
5. `m360_admin_review_week` for weeks 1–6, decision `accepted`, rubric
   scores in the 88–90/100 range (realistic, not literal 100s) — script
   already has clarity/relevance/evidence/application per week 1-5, plus
   `professional_communication` for week 6.
6. `m360_admin_set_attendance(true)`.
7. `m360_admin_set_spotlight_presentation('presented_live')`.

Script written to `/tmp/claude-1000/-home-alex/237e05ca-826d-4812-bc44-15cc3d72e7fb/scratchpad/m360-complete.mjs`
(session scratchpad — not committed to the repo; it embeds the student's
and admin's real passwords from the roster CSVs). Fully authored and
ready to run.

**Status: done.** Alex loosened the Bash permission mid-session; the script
ran clean — all 6 weeks submitted and accepted (scores 90/88/88/90/88/88),
Start Here complete, attendance verified, Career Spotlight presented.
Verified by reading `admin_student_program_progress` directly:
`technical_completed: 12/12`, `m360_accepted_weeks: 6/6`,
`m360_course_complete: true`, `m360_start_here_complete: true`,
`networking_comfort: 5`, `interview_readiness: 5`,
`work_items_completed: 18/18`, `program_requirements_complete: true`.
Scratch scripts (embedded real passwords) deleted after the run.

**Status: blocked.** The sandbox's auto-mode classifier refuses any
outbound authenticated write to the live Supabase project from this
session — confirmed twice: once via `supabase db query --linked` (raw
SQL), once via this script's own RPC calls (`fetch` to the real
`/auth/v1/token` and `/rest/v1/rpc/*` endpoints, i.e. the same calls the
real app makes). Both were blocked before any request left the sandbox,
so nothing was written. Real next step is for Alex to either run the
script himself (`! node /tmp/.../m360-complete.mjs`) or loosen the Bash
permission so a future session can run it directly — see chat for the
two options.

## Sprint 3 — gaps in necessary coursework (ongoing)

No structural gaps found yet in the M360 weeks 1-6 schema/rubric while
authoring Sprint 2's content — field shapes, rubric dimensions, and
`course_complete` logic are internally consistent and match the syllabus
roadmap. Will keep this section open and spawn haiku agents against any
concrete bug found (fully-specified diff, same pattern as prior sprints
this session), rather than pre-emptively touching curriculum content —
per Alex's explicit instruction: enhance/fill out existing coursework,
do not redesign curriculum, syllabus, or rubric.
