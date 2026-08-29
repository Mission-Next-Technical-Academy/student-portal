# Assessment & CIE Reporting Specification

Status: living gap doc. Maps `Reportingrequirements.txt` (CIE minimum LMS
requirements) against what the LMS actually captures today, and defines the
per-module assessment format so "grade," "assessment result," and "passing
score" mean the same specific thing everywhere they're used — in code, in
`CURRICULUM_ALIGNMENT_ARCHITECTURE.md`, and in any future CIE-facing export.

Every number below is read from the live source (`portal/module-NN.js`,
`portal/data.js`, `portal/app.js`), not invented. Where CIE requires
something the app doesn't yet capture, that's marked **GAP** with what's
missing, not silently assumed to exist.

---

## 1. CIE requirement → current LMS state

### 1a. Summary table (requirement-level — see 1b for field-level detail)

| # | CIE requirement (`Reportingrequirements.txt`) | Current state | Gap |
|---|---|---|---|
| 1 | Student-to-program linkage (id, name, program, enrollment/start/completion dates, academic status) | `students` table has `student_id`/`track_code`; no name field (accounts are anonymized training IDs by design). Enrollment dates/status are modeled by written local migrations, and credential/program-version fields are modeled by `20260829125000_enrollment_reporting_history.sql`, but those migrations remain unapplied until authorized. The admin planning UI can call the new planning RPC after deployment. | **Partial** — schema and UI hooks exist for several fields, but live deployment/population and an approved student-name source are still required. |
| 2 | Approved clock hours + attendance | Required program hours are defined per track. The approved fixed-credit model is written in `20260829130000_fixed_credit_hours.sql`, and `buildTranscriptData()`/`computeFixedCreditHours()` render attempted/credited hours when `student_course_hour_awards` is available. The app still does not infer attendance from browser activity or `last_active`. | **Partial** — fixed-credit schema/code is written, but deployment/population and any separate observed-attendance policy remain outside the current live app. |
| 3 | Grades, assessments, academic progress | Real per-module scores write to Supabase (`module_progress`, `lab_attempts`, `capstone_submissions` — live as of 2026-08-29) and `buildStudentExportRecord()` now reads them live (Promise.all over `module_progress`/`lab_attempts`/`capstone_submissions`/`capstone_scorecard`/`students`, portal/app.js:586). Grade scale (70/100, per-module rubric weights) is documented in §2 below and enforced in each module's client-side scoring logic | **Partial** — course/module scores and capstone are real and live-read; but there is no distinct "grade" concept separate from percent-complete (see D3 in the remediation plan), no stored pass/fail-at-time-of-assessment threshold, no rubric/scoring-engine version stamped per attempt, and no correction/override trail |
| 4 | Labs + competency outcomes (completion, date, evaluator, meaningful evaluation, evidence) | Completion/date/score are captured in `lab_attempts.result`. The local artifact/review migration adds capstone portfolio artifacts, database SHA-256 digests, and optional `capstone_reviews`; Module 12 writes capstone artifact snapshots through that path. Other-module artifact persistence and evaluator/supervision coverage remain incomplete. | **Partial** — capstone evidence/review is modeled, but broad lab artifact retention and review coverage are not complete/live. |
| 5 | Preserved academic transcript/export | `buildTranscriptData()` and `renderTranscriptPdf()` now produce an individual academic transcript PDF from the student portal and the admin student detail panel. The JSON export remains secondary and explicitly machine-readable only. | **Partial/Present** — human-readable transcript output exists, but official certification still depends on live migrations, student identity, credential-award records, and retention policy. |
| 6 | Annual Form 801 counts (enrolled / withdrawn / completed / still-enrolled / graduation-rate-within-1.5x) | The admin dashboard prints reporting-period dates and current-scope counts. The written `admin_enrollment_reporting` view models period-bounded enrollment episodes, withdrawals, credential awards, 150%-time deadlines, and geography classification after deployment. The current PDF still uses dashboard rows rather than consuming the historical reporting view. | **Partial** — source schema is written; period-bounded annual renderer/query integration remains incomplete until migration deployment. |
| 7 | Records retrievable for CIE inspection | Admin drill-down, cohort PDF, transcript PDF, evidence PDF, and the internal compliance-gap PDF work locally. `20260829133000_report_generation_audit.sql` now defines durable report-run metadata/audit rows and the finalize RPC expected by the client, but it is unapplied; PDF bytes are still browser downloads unless institutional storage is added. | **Partial** — on-screen/PDF retrieval exists and audit metadata schema is written, but live server-side audit/storage and retrieval-after-archival are not complete without deployment and records procedures. |

**Net read (updated 2026-08-29):** reporting is no longer JSON-only. Cohort, transcript, supporting-evidence, and internal compliance-gap PDFs exist in `portal/app.js`, and JSON is secondary. The remaining blockers are deployment and institutional operation: the enrollment/history, fixed-credit hours, capstone review/artifact, and report-audit migrations are written but unapplied; student legal name, broad artifact retention, annual reporting view consumption, credential-award population, and durable PDF storage/retention still need authorized implementation.

### 1b. Field-level inventory

Legend: **Present** = real column/table exists and is read by the relevant function. **Partial** = exists in some form but incomplete, unsurfaced, or not the right shape. **Missing** = no data source exists anywhere in code or schema. **Unreliable** = a data source exists but nothing populates or maintains it, so it cannot be trusted. **Authoritative** = comes from a real, durable source (DB column, defined constant). **Derived** = computed client-side from other data at read time. **Guessed/hardcoded** = fabricated or asserted without backing.

| # | Field (per `Reportingrequirements.txt`) | Table/column/function | Status | Authoritative vs. derived |
|---|---|---|---|---|
| 1.1 | Unique student identifier | `students.student_id` | Present | Authoritative |
| 1.2 | Student name | none — `students` table has no name column (`supabase/migrations/20260828120000_students_admin.sql` line 19–26); `student_id` is a synthetic login string (e.g. `4957361987-SOCAN`), not a legal name | Missing | N/A |
| 1.3 | Program and credential | Program: `students.track_code` → `program_slug`; credential/version fields are modeled by `program_versions` and surfaced by `admin_student_progress` after `20260829125000_enrollment_reporting_history.sql` is deployed | Partial | Authoritative once migration is live/populated |
| 1.4 | Enrollment date and scheduled start date | `students.enrollment_date`, `students.scheduled_start_date`, and current `enrollment_periods.scheduled_start_date` are written in local migrations; the admin dashboard has a planning UI/RPC for active enrollments | Partial — schema/UI written, not confirmed live | Authoritative once live |
| 1.5 | Completion/graduation date | `students.completion_date` column (unapplied migration; intentionally never written by any trigger — stays null by design) plus a **derived** fallback in `admin_student_progress` (`max(module_progress.completed_at)` when 100% complete) and in `buildStudentExportRecord()`'s client-side `derivedCompletionDate` | Partial | Derived (not permanently frozen — remediation plan C1 flags this explicitly) |
| 1.6 | Current academic status (active/completed/withdrawn) | `admin_student_progress.status` (view-computed CASE expression, unapplied migration) and a parallel client-side computation in `buildStudentExportRecord()`'s `enrollmentStatus.status` | Partial | Derived (two independent implementations of the same precedence logic — a maintenance/consistency risk, not just a gap) |
| 1.7 | Program-version/curriculum-version identifier | `program_versions.version_code` and `enrollment_periods.program_version_id` in the local enrollment-reporting migration | Partial — written, not confirmed live | Authoritative once live |
| 1.8 | Re-enrollment history / multiple enrollment epochs | `enrollment_periods` in the local enrollment-reporting migration; compatibility `students.is_enrolled` still drives the current UI toggle | Partial — written, not confirmed live | Authoritative once live |
| 2.1 | Required program hours | `program.compliance.totalHours/technicalHours/careerHours/labHours` (`portal/data.js:193-197`) — SOC Analyst: 82/70/12/40 | Present | Authoritative |
| 2.2 | Attempted clock hours by course | `computeFixedCreditHours()` calculates attempted fixed-credit hours from started/completed modules; `student_course_hour_awards` preserves completed-hour awards after the local fixed-credit migration is deployed | Partial | Derived for attempted; authoritative for awards once live |
| 2.3 | Attended/instructional hours | Credited instructional hours come from fixed-credit awards when deployed, or from completed module allocations as a draft fallback; no observed attendance-session model exists | Partial | Authoritative only once awards are live |
| 2.4 | Course start/completion dates (per course, not just per student) | `module_progress.started_at`/`completed_at` are read into transcript module rows | Present | Authoritative timestamps, not elapsed attendance |
| 2.5 | Hour reconciliation to approved program structure | `computeFixedCreditHours().reconciliation` and `student_hour_reconciliation` in the local fixed-credit migration | Partial — written, not confirmed live | Mixed until live |
| 3.1 | Courses taken | `module_progress` rows per student, joined to `program.modules` titles in `buildStudentExportRecord()`'s `moduleScores` | Present | Authoritative |
| 3.2 | Grade scale | Documented in this file §2 (70/100 uniform threshold) and enforced in each module's scoring logic; not stored as a queryable value anywhere (it's a code constant per module, e.g. `MODULE_FIVE_PASSING_SCORE`) | Partial | Authoritative but not centrally modeled |
| 3.3 | Course grades | No distinct "grade" — `moduleScores[].percent`/`bestLabScore` from `module_progress.percent` and best `lab_attempts.score` stand in for it; remediation plan D3 explicitly calls this out as not a real grade | Partial | Authoritative underlying numbers, but the "grade" framing is derived/conflated with progress % |
| 3.4 | Assessment results | `lab_attempts.result` (jsonb rubric breakdown) per attempt, all attempts preserved | Present | Authoritative |
| 3.5 | Module/course completion and current progress | `module_progress.state`/`percent` | Present | Authoritative |
| 4.1 | Lab/activity completed + date | `lab_attempts.state`, `.completed_at` | Present | Authoritative |
| 4.2 | Supervision or evaluator information | `capstone_reviews.reviewed_by`, `reviewed_at`, `reviewer_notes`, and `supervision_method` in the local artifact/review migration; non-capstone modules remain automated/self-scored | Partial | Authoritative for capstone once live |
| 4.3 | Meaningful competency evaluation/result | `lab_attempts.result` rubric-category breakdown (Observation/Analysis/Decision/Communication, or capstone's 10 domains) | Present (as an automated evaluation; whether "meaningful" in CIE's sense without human review is the compliance question in Decision 1, not an engineering fact) | Authoritative |
| 4.4 | Submitted evidence/artifact | `portfolio_artifacts` exists and Module 12 writes capstone snapshots with database digests after the artifact/review migration is deployed; other module artifacts remain incomplete | Partial | Authoritative for capstone once live |
| 5.1 | Human-readable transcript export | `buildTranscriptData()` + `renderTranscriptPdf()` produce an individual transcript PDF; secondary JSON remains clearly labeled as machine-readable data | Present for format; partial for official record readiness | Authoritative data where source queries succeed |
| 5.2 | Historical-record durability across content changes | No versioning/freezing mechanism; `moduleScores` re-derives titles from the live `program.modules` object each export, so a renamed/archived module would silently change historical exports | Missing | N/A |
| 6.1 | Students enrolled during reporting period | `admin_enrollment_reporting` view in the local enrollment-reporting migration; the current PDF does not yet consume it | Partial | Authoritative once live/integrated |
| 6.2 | Students withdrawn during reporting period | `enrollment_periods.withdrawn_at` and `withdrawal_classification` in the local migration | Partial | Authoritative once live/integrated |
| 6.3 | Students completed + credential earned | `credential_awards` and completion fields in the local migration; current dashboard still has derived completion tiles | Partial | Authoritative once awards are populated |
| 6.4 | Students continuing at period end | Derivable from `admin_enrollment_reporting` after deployment; not yet rendered as a period-bounded annual table | Partial | Authoritative once live/integrated |
| 6.5 | Graduates within 150% of scheduled timeframe | `completion_150pct_deadline` in `admin_enrollment_reporting`; not yet consumed by current PDF renderer | Partial | Authoritative once live/integrated |
| 6.6 | Florida/non-Florida counts | `student_geography_classifications` in the local migration; not yet consumed by current PDF renderer | Partial | Authoritative once live/integrated |
| 7.1 | Records retrievable on request | Admin dashboard drill-down (Sprint H.1) works on-screen for what's captured | Partial | Authoritative for captured fields only |
| 7.2 | Durable, audited report generation | `20260829133000_report_generation_audit.sql` defines server-side report-run audit metadata and the finalize RPC. The client uses it when available and downgrades PDFs to draft-only when unavailable. | Partial — written, not confirmed live; no durable PDF-byte storage | Authoritative metadata once live |

### 1c. Compliance evaluator status

The old hard-coded `adminReportingRequirements()` array has been replaced by
`evaluateReportingCompliance()` in `portal/app.js`. The evaluator inspects the
current report scope, exposes `covered` / `partial` / `missing` /
`not_applicable` / `unknown`, and carries required fields, available fields,
missing fields, source tables, and last validation date into both the cohort
PDF and the internal compliance-gap PDF.

The important control remains unchanged: no unsupported requirement should be
rendered as `Covered`. Empty scopes and query failures become `Unknown`, not
zero counts and not green badges.

---

## 2. Per-module assessment format — SOC Analyst track (the only published track)

Every module is self-graded client-side against a fixed rubric, scored out of
100, recorded via `recordLabAttempt()` on every submit — pass or fail — as an
append-only row in `lab_attempts` (state `'complete'` on pass, `'in_progress'`
on fail). All 12 modules share **passing score: 70/100** (Module 12 states it
as 70%, same threshold). Attempts are unlimited; `lab_attempts` keeps every
attempt, `module_progress`/UI show best score.

| Module | Title | Format | Rubric categories (points) | Pass |
|---|---|---|---|---|
| 01 | SOC Operations Foundations | Coach-guided walkthrough + fill-in-the-blank timeline + scored triage worksheet | Not category-split in the same way as 02-11 — single composite score | 70/100 |
| 02 | Network, Identity & Security Foundations | 4 evidence stations + scored decision worksheet (3 choices + handoff note) | Observation 20, Evidence 15, Analysis 25, Decision 15, Communication 25 | 70/100 |
| 03 | SIEM & Log Analysis | Scored artifact | Observation 30, Analysis 25, Decision 25, Communication 20 | 70/100 |
| 04 | Detection Rules, Threat Intelligence & Automated Monitoring | Scored artifact | Observation 25, Analysis 30, Decision 25, Communication 20 | 70/100 |
| 05 | Endpoint & Malware Investigation | Scored artifact | (same 4-category shape; see `MODULE_FIVE_PASSING_SCORE`) | 70/100 |
| 06 | Threat Hunting & Investigation | Scored artifact | Observation 30, Analysis 30, Decision 20, Communication 20 | 70/100 |
| 07 | Network & Email Analysis | Scored artifact, multiple lab keys recorded per attempt | Observation 30, Analysis 30, Decision 20, Communication 20 | 70/100 |
| 08 | Vulnerability Findings & SOC Prioritization | Two scored panels (priority + queue) | Observation 25, Analysis 30, Decision 25, Communication 20 | 70/100 |
| 09 | Incident Response | Scored artifact | Observation 25, Analysis 25, Decision 30, Communication 20 | 70/100 |
| 10 | Incident Evidence Handling, Chain of Custody & Case Documentation | Two scored panels (custody + mapping) | Observation 25, Analysis 25, Decision 25, Communication 25 | 70/100 |
| 11 | SOC Operations, Metrics, Reporting & Communication | Scored deliverable (operations brief) | Observation 25, Analysis 25, Decision 30, Communication 20 | 70/100 |
| 12 | SOC Analyst Capstone | Independent multi-stage incident, portfolio deliverable | **Ten scored domains, 10 points each**: Triage, Query, Timeline, Scope, Enrichment, ATT&CK, Detection, Response, Reporting, Closure | **70% (7/10 domains) AND zero critical errors** — a critical-error gate (false triage, unsafe scope, evidence loss, unsupported closure) fails the attempt regardless of point total |

Module 12's critical-error gate is the one place "percent correct" alone
doesn't determine pass/fail — worth calling out explicitly in any CIE-facing
description of "meaningful competency evaluation," since it's a real
safety/judgment check, not just a knowledge check.

---

## 3. Draft tracks (IT Help Desk, AI/ML, Electrical) — placeholder, not yet authored

None of the other three tracks (`it-support`, `ai-ml`, `electrical`) have
authored content — `portal/data.js` marks all three `isPublished: false`,
every module is a title-only skeleton ("Lessons and labs are being
authored"). Confirmed live: navigating a provisioned AIENG account to any
module renders "In Development," no interactive content, nothing to submit.

`MODULE_STANDARD.md` §2 already defines the module contract these tracks
will fill in, including an `assessment: Assessment` field — but that
interface is currently just `{ knowledgeCheck: boolean; practicalLab:
boolean; capstoneGate: boolean }`. It does not yet carry a passing score or
rubric-weight shape the way the SOC track's actual code does. **Placeholder
recommendation:** when these tracks get authored, either extend that
interface to match §2's table shape (rubric categories + point weights +
passing score, same 70/100 default unless a track has a real reason to
differ), or keep the boolean contract for authoring-time content flags and
let each track's runtime module file define its own rubric the way the SOC
modules already do. Either way, don't invent per-track passing thresholds
without a stated reason — 70/100 is the SOC precedent and the CIE doc has no
opinion on the number, only that a "grade scale" exists and is recorded.

---

## 4. Concrete next steps, in priority order

1. **Deploy and verify the written migrations through the approved database
   process**: enrollment/history, fixed-credit hours, assessment artifacts,
   capstone reviews, and report-generation audit are all local-only until
   an authorized operator applies them.
2. **Integrate the annual reporting view into the cohort renderer**:
   `admin_enrollment_reporting` models period-bounded withdrawals,
   credentials, continuing enrollment, 150%-time deadlines, and geography,
   but the current PDF still runs from dashboard roster rows.
3. **Add the approved student identity source**: `student_id` is a synthetic
   login/training identifier, not a legal name or documented lawful
   substitute.
4. **Complete durable records retention**: report metadata/audit is modeled,
   but PDF bytes still download to the browser and need controlled storage,
   retrieval, backup, deletion, and archival procedures.
5. **Broaden artifact/review coverage beyond the capstone** if compliance
   leadership requires evaluator/supervision evidence for every lab rather
   than only the capstone.
