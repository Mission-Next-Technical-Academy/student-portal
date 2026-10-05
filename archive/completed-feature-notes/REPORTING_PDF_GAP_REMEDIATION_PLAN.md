# Reporting and PDF Export Gap Remediation Plan

Status: execution brief for lower-level agents/models  
Date: 2026-08-29  
Scope: `portal/` student/admin reporting, `Reportingrequirements.txt`, `ASSESSMENT_REPORTING_SPEC.md`, and related Supabase records  
Primary route: `http://localhost:8768/#/admin`

## 1. Mandatory outcome

The admin **Generate Report** action must produce a polished, human-readable PDF. Raw JSON is not an acceptable primary reporting format.

The project needs separate outputs for separate purposes:

1. **Cohort / annual reporting report**
2. **Individual academic transcript**
3. **Individual supporting-evidence record**
4. **Internal compliance-gap report**

Do not present a cohort dashboard snapshot as a transcript or as a complete CIE annual report.

JSON may exist only as an optional machine-readable companion export, clearly labeled as such. It must never open as the default “report.”

## 2. Important current-state finding

The working tree already contains an uncommitted PDF implementation using locally vendored jsPDF and jsPDF-AutoTable:

- `portal/app.js` contains `downloadAdminReport()`.
- `portal/index.html` loads the jsPDF libraries.
- The current HTTP-served `app.js` contains the PDF path.
- The committed `HEAD` version still contains the older JSON implementation.
- The student-facing **Export my record (JSON)** action also still exists.

Therefore, the reported JSON behavior may result from one or more of:

- An old page instance loaded before the uncommitted PDF code was added.
- A stale browser tab or cached `app.js`.
- Testing the student JSON export instead of the admin PDF export.
- Running or deploying the committed version rather than the dirty working tree.
- The PDF implementation failing before download while an older handler remains active elsewhere.
- Port/environment confusion.

Do not assume the issue is fixed merely because PDF code exists. Reproduce the actual admin click in a clean browser session and inspect the downloaded file.

## 3. Critical compliance conclusion

The current generated admin report does **not** satisfy `Reportingrequirements.txt`.

Several requirements are incorrectly labeled `covered` by `adminReportingRequirements()`.

| Requirement | Current report claim | Correct assessment |
|---|---|---|
| Student-to-program linkage | Covered | **Partial** — student name, credential, scheduled start, completion date, and reliable academic status are missing from the report |
| Clock hours and attendance | Partial | **Missing** — required hours, attempted course hours, attended hours, course dates, and reconciliation are absent |
| Grades, assessments, progress | Covered | **Partial** — only aggregate progress and capstone score appear; course grades, grade scale, assessment results, and attempt history are absent |
| Labs and competency outcomes | Partial | **Partial/Missing** — lab identity, dates, rubric results, evidence, supervision, and evaluator details are absent |
| Current academic transcript | Partial | **Missing** — the cohort snapshot is not an individual transcript |
| Annual reporting | Covered | **Missing** — no reporting period, withdrawals, graduates, continuing enrollment, geographic counts, or 150%-time completion calculation |
| Inspection availability | Covered | **Partial** — a browser download is not durable retention, controlled retrieval, or an inspection audit trail |

No report should call a requirement “covered” unless all mandatory fields have authoritative data sources and appear in the relevant export.

## 4. Workstream A — reproduce and stabilize PDF generation

### A1. Reproduce the exact behavior

- Sign in as an administrator at `http://localhost:8768/#/admin`.
- Hard-refresh the page.
- Click the exact **Generate Report** button.
- Record:
  - Console errors
  - Network failures
  - Download filename
  - MIME type
  - File signature
  - Whether the result is JSON, PDF, a browser page, or no download
- Confirm a successful PDF starts with `%PDF-`.
- Confirm the filename ends in `.pdf`.
- Confirm `window.jspdf?.jsPDF` exists.
- Confirm `doc.autoTable` exists.

### A2. Eliminate stale-code ambiguity

- Update the `portal/app.js` cache-busting query in `portal/index.html`; it still uses `?v=20260828` despite later report changes.
- Confirm the server is serving this repository’s `portal/` directory.
- Confirm no second click handler or older report bundle is active.
- Confirm the committed version includes the final implementation before treating the issue as closed.
- Do not discard unrelated working-tree changes.

### A3. Harden the download path

- Check for missing `window.jspdf` and `doc.autoTable` before generation.
- Display a useful inline error instead of only “see console.”
- Validate the logo response before converting it to a data URI.
- Generate the PDF without the logo if the asset fails, but show a warning.
- Record a successful report run only after `doc.save()` completes.
- Do not write a successful audit/history entry before generation succeeds.
- Prevent double-click generation.
- Restore button state after every failure.
- Add a unique report ID to the file and report metadata.
- Include report type and date/time in the filename.

### A4. Remove primary JSON reporting

- Replace or supplement the student-facing **Export my record (JSON)** with:
  - **Download transcript (PDF)**
  - Optional secondary **Download data (JSON)**
- Never label JSON as an academic transcript.
- Never navigate the browser to a raw JSON document.
- Keep machine-readable data separate from human-readable official records.

## 5. Workstream B — separate report types

The current `buildAdminReport()` mixes dashboard metrics, compliance commentary, and a roster. Split it into explicit report builders.

### B1. Cohort / annual report

Required inputs and output:

- Reporting-period start and end
- Program selection
- Cohort or scheduled-start range
- All students enrolled during the period
- Withdrawals during the period
- Completions and approved credentials earned
- Students continuing at period end
- Graduates completing within 150% of the scheduled program duration
- Florida/non-Florida counts from a linked authoritative field
- Clear definitions for every count
- Reconciliation totals
- “As of” timestamp and source version

Do not use “Not enrolled” as a substitute for “Withdrawn.” These are different states.

### B2. Individual academic transcript

Each PDF must contain:

- Institution name and logo
- “Academic Transcript” title
- Unique transcript/report ID
- Generation date and “as of” date
- Student identifier
- Student name or a documented lawful substitute
- Program and credential
- Enrollment date
- Scheduled start date
- Completion/graduation date, when applicable
- Current academic status
- Required program hours
- Course/module title
- Course start and completion dates
- Attempted clock hours
- Attended/instructional hours
- Grade scale
- Course/module grade
- Assessment outcome
- Total hours
- Final program outcome
- Authorized-signature or certification area
- Page numbering and confidentiality footer

### B3. Individual supporting-evidence record

This should accompany, not overload, the transcript:

- Every lab/activity
- Completion status and date
- All attempts or a clearly defined official-attempt policy
- Score and rubric-category breakdown
- Competencies evaluated
- Submitted artifact reference
- Artifact integrity metadata where appropriate
- Evaluator/reviewer
- Review date
- Review notes
- Supervision method
- Capstone critical-error result
- Capstone final outcome
- Corrections or overrides with reason and actor

### B4. Compliance-gap report

This is an internal report, not a student transcript:

- Requirement
- Status: Covered / Partial / Missing / Not applicable
- Data source
- Evidence included
- Missing fields
- Owner
- Remediation target
- Last validation date

Do not put unsupported green “Covered” badges into an external-facing compliance report.

## 6. Workstream C — close source-data gaps

### C1. Student identity and program linkage

Current gaps:

- No real student-name field in the active simplified model.
- Credential is not included in the report.
- Scheduled start is not editable in the admin dashboard.
- Enrollment-date migration status must be confirmed in the live database.
- Completion date is mostly derived, not permanently frozen.
- Re-enrollment history is not modeled adequately.
- A single current `is_enrolled` flag cannot represent multiple enrollment epochs.

Tasks:

- Add an authoritative student display/legal name or document the approved alternative.
- Add credential name/code.
- Add scheduled-start-date administration.
- Add durable completion/graduation date.
- Model enrollment history as append-only enrollment episodes.
- Preserve withdrawal and re-enrollment events.
- Do not overwrite prior withdrawal history.
- Include program-version/curriculum-version identifiers.

### C2. Attendance and clock hours

This is a full missing capability.

Required design decision:

- Define “attempted clock hours.”
- Define “attended/instructional hours.”
- Define inactivity handling.
- Define whether hours are scheduled, awarded, observed, or a combination.
- Obtain compliance approval for the model before implementation.

Recommended model:

- Store approved instructional minutes per module/activity.
- Store attendance/session events separately.
- Store awarded/completed hours separately.
- Retain raw events and calculated totals.
- Reconcile module totals to the approved 82-hour SOC program structure.
- Never infer official attendance solely from `last_active`.
- Never count an unattended open browser tab as instructional time.

Suggested tables:

- `program_versions`
- `program_course_hours`
- `enrollment_periods`
- `attendance_sessions`
- `attendance_adjustments`
- `hour_reconciliation_snapshots`

### C3. Grades and assessments

Current aggregate progress is insufficient.

Tasks:

- Define the official grade scale.
- Store official module grade separately from percent-complete.
- Preserve every assessment attempt.
- Identify which attempt determines the official grade.
- Preserve rubric version and scoring-engine version.
- Store pass threshold at the time of assessment.
- Represent Module 12’s critical-error gate explicitly, not only inside JSON.
- Prevent “100% modules complete” from silently overriding a failed capstone gate.
- Add authorized grade correction/override records.
- Record who made each correction and why.

### C4. Labs, artifacts, evaluation, and supervision

Current artifacts often remain only in browser `localStorage`, which is not an institutional academic archive.

Tasks:

- Persist required artifacts to controlled backend storage.
- Write corresponding `portfolio_artifacts` records.
- Export artifact references and hashes.
- Add evaluator/reviewer fields.
- Add review status and review date.
- Add reviewer notes.
- Define whether review is mandatory, optional, or sampled.
- Implement at least capstone faculty review unless compliance leadership approves automated-only evaluation.
- Preserve original submission and revised versions.
- Never silently replace submitted evidence.

Suggested fields:

- `submitted_by`
- `submitted_at`
- `review_status`
- `reviewed_by`
- `reviewed_at`
- `review_notes`
- `supervision_method`
- `rubric_version`
- `scoring_engine_version`
- `artifact_id`
- `override_reason`

### C5. Annual reporting fields

The LMS or linked system must supply:

- Reporting-period membership
- Withdrawal dates and classification
- Credential-earned flag/date
- Continuing-enrollment status at period end
- Initial scheduled completion date
- Actual completion date
- 150%-time deadline
- Completion-within-150% result
- Florida/non-Florida classification
- Program/licensure reporting code

If geography remains outside the LMS, define the stable join and show whether linked data was successfully included.

## 7. Workstream D — correct business logic

### D1. Status logic

Replace simplistic report logic such as:

- `percent_complete >= 100 → Complete`
- `percent_complete > 0 → In progress`
- otherwise `Not started`

Use authoritative status with explicit precedence:

- Not yet started
- Active
- Leave/paused, if institutionally supported
- Withdrawn
- Completed
- Graduated/credential awarded, if distinct
- Administrative access disabled

“Disenrolled,” “not enrolled,” and “withdrawn” must not be used interchangeably.

### D2. Completion logic

Completion must require all approved conditions:

- Required modules complete
- Required hours satisfied
- Required labs complete
- Required assessments passed
- Capstone passed
- Zero disqualifying critical errors
- Required faculty/evaluator approval, if adopted
- Credential-award action or verified completion event

### D3. Grade logic

The current student export calculates an overall outcome from the percentage of modules marked complete. That is not a grade.

Separate:

- Progress percentage
- Academic average
- Pass/fail outcome
- Capstone outcome
- Program completion status
- Credential-award status

### D4. Filtering and scope

The admin UI track filter and “Hide Not Started” option currently affect table visibility, but the report builder receives the full `dashboardRows`.

Decide and make explicit:

- Generate report for all students
- Generate report for current filters
- Generate report for selected program/cohort
- Generate individual report

The PDF must print the selected scope and filters.

## 8. Workstream E — PDF presentation quality

### E1. Page format

- Use portrait letter for individual transcripts.
- Use landscape letter for wide cohort tables.
- Avoid nine compressed columns in a portrait roster.
- Repeat table headers on every page.
- Reserve footer space explicitly.
- Prevent headings from being stranded at page bottoms.
- Handle empty cohorts cleanly.
- Handle large cohorts of at least 500 students.

### E2. Branding and document structure

Include:

- Mission Next logo
- Institution name
- Report title and type
- Reporting period
- Program/cohort
- Generated timestamp and timezone
- Unique report ID
- Confidentiality classification
- Page X of Y
- Data-source and “as of” note
- Certification/signature block where required

### E3. Readability

- Minimum practical body font size
- Adequate contrast
- Avoid seven tiny stat boxes on a narrow portrait page
- Wrap long program names safely
- Format percentages and scores consistently
- Distinguish missing, zero, not applicable, and not collected
- Avoid unexplained abbreviations such as track codes
- Include a legend for compliance status
- Use plain language for administrators and inspectors

### E4. Character and accessibility support

- Verify punctuation and non-ASCII names render correctly; jsPDF’s built-in Helvetica may not support all characters.
- Embed an appropriate local font if needed.
- Add meaningful PDF title, author, subject, keywords, and creation metadata.
- Investigate tagged/accessible PDF support.
- Ensure text remains selectable.
- Provide an accessible HTML preview before download if fully tagged PDFs are not feasible.

### E5. Preview and confirmation

Add a report dialog with:

- Report type
- Program/cohort
- Date range
- Current filters
- Included record count
- Known missing-data warnings
- Generate PDF
- Optional machine-readable export

## 9. Workstream F — durability, auditability, and privacy

### F1. Durable report records

Current report history is stored in browser `localStorage`. That is not an institutional audit record.

Persist:

- Report ID
- Report type
- Requesting admin ID
- Requested timestamp
- Scope/filter parameters
- Source-data cutoff
- Generation status
- Success/failure reason
- File hash
- Storage reference, if reports are retained
- Application/report-template version

### F2. Record preservation

- Freeze official completion and credential records.
- Preserve academic history if course content or module names change.
- Store curriculum/program version with each enrollment.
- Define retention requirements for transcripts and supporting evidence.
- Add backup and restore procedures.
- Test retrieval after course archival.
- Do not rely on browser storage for permanent records.

### F3. Privacy and authorization

- Confirm only authorized roles can generate cohort reports.
- Add report-generation audit logging.
- Avoid exposing synthetic authentication email addresses unnecessarily.
- Support redacted reports where full identifiers are unnecessary.
- Define secure storage and deletion policies for downloaded reports.
- Warn admins that downloaded PDFs contain confidential student records.
- Do not include internal `stateSnapshot` or browser-local implementation details in official exports.
- Prevent sensitive report data from appearing in URLs or console output.

### F4. Integrity

- Add report hash or verification code.
- Record the source query cutoff timestamp.
- Mark reports as draft or official.
- Prevent an official report from being generated when required data queries fail.
- Show missing-data warnings prominently.
- Never convert query failures into zeros without disclosure.

## 10. Workstream G — application architecture cleanup

### G1. Replace hard-coded compliance claims

`adminReportingRequirements()` currently hard-codes optimistic statuses.

Replace it with a data-backed evaluator that returns:

- `covered`
- `partial`
- `missing`
- `not_applicable`
- `unknown`

Each result must include:

- Required fields
- Available fields
- Missing fields
- Source tables
- Query/error state
- Last checked timestamp

### G2. Separate builders from renderers

Create independently testable functions:

- `buildCohortReportData()`
- `buildTranscriptData()`
- `buildEvidencePacketData()`
- `evaluateReportingCompliance()`
- `renderCohortPdf()`
- `renderTranscriptPdf()`
- `renderEvidencePdf()`

Keep data acquisition, compliance evaluation, and PDF layout separate.

### G3. Handle query failure correctly

- Use `Promise.allSettled()` or equivalent controlled error handling.
- Do not label missing query results as “not started.”
- Do not generate an official report from partial data without an explicit draft/warning state.
- List unavailable sections in the PDF.
- Surface actionable errors in the admin UI.

### G4. Remove contradictory documentation

Update:

- `ASSESSMENT_REPORTING_SPEC.md`
- `HANDOFF.md`
- `LATEST_PROGRESS.md`
- Relevant architecture documents

Known contradictions include:

- Older notes saying the admin report is JSON.
- Newer uncommitted code generating PDF.
- Reporting specification steps that are partly implemented in the working tree.
- Migration documentation saying enrollment-date schema is not live.
- “Covered” report claims contradicted by the requirements assessment.

## 10.5 Workstream H — Admin disenroll safeguard (snapshot-before-disenroll)

Added mid-execution, direct user request (2026-08-29). Scope: the admin
dashboard's per-student enrollment toggle (`portal/app.js`, `wireAdmin()`'s
`data-admin-enrollment` handler and the admin table row markup).

**Problem:**

- Toggling a student from enrolled to disenrolled only gated on a
  `window.confirm("Are you sure? This will disenroll the student while
  preserving their progress history?")` browser popup — no recoverable
  artifact was actually produced before the change.
- There was no way to download a per-student progress snapshot from the
  admin dashboard at all (`ADMIN_RESET_FLOW.md` assumes one exists to hand
  to a connected AI agent for recovery — it didn't).
- The admin table row's grayed-out (`opacity-65`) styling for a disenrolled
  student is driven by `row.enrolled`, but the toggle handler only ever
  updated `row.is_enrolled` — so re-enrolling a student left their row
  visually stuck grayed-out until a full page reload re-fetched the row.

**Fix (implemented directly, not by a spawned agent — small and
well-scoped enough to do inline):**

- Removed the `window.confirm(...)` popup entirely.
- Added a **Save Progress File** button to every admin table row
  (`data-admin-snapshot`), next to the enrollment toggle. Downloads a
  recoverable JSON snapshot (`downloadStudentSnapshot()`) built from the
  same `buildTranscriptData()`/`buildEvidencePacketData()` Supabase reads
  Agent 3 built — labeled for use with `ADMIN_RESET_FLOW.md`'s
  paste-into-a-connected-AI-agent recovery workflow.
- The enrolled -> disenrolled toggle now **always** captures that same
  snapshot first, automatically, before writing `is_enrolled: false`. If
  the snapshot capture fails, the disenroll does not proceed (toggle
  reverts, error shown) — this is what actually replaces the popup's
  reassurance, not just removing a click.
- This does **not** delete or reset any `module_progress`/`lab_attempts`/
  `capstone_submissions` rows — disenrollment still only ever flips
  `students.is_enrolled`, consistent with guardrail §13 ("Do not delete
  student progress, attempts, artifacts, or enrollment history"). "Reset"
  in the user's request refers to the enrollment-state change ritual, not a
  data wipe.
- Fixed the grayed-out-row bug: the toggle handler now updates
  `row.enrolled` and `row.adminStateLabel` alongside `row.is_enrolled`, so
  disenrolled -> enrolled correctly clears `opacity-65` on re-render without
  needing a page reload.

**Not done / left for later agents:** durable server-side audit logging of
snapshot downloads and enrollment changes belongs to Agent 8 (Workstream
F3); a polished in-page modal presentation of the snapshot (vs. a plain
file download) was the original NEXT_SESSION.md ask but is out of scope
for this fix per the user's latest, narrower instruction.

## 10.6 Workstream I — bulk "Save Progress File" for all students

Added mid-execution, direct user request (2026-08-29), follow-up to
Workstream H. The per-row **Save Progress File** button (H) only snapshots
one student. Add a cohort-level equivalent:

- A second big button next to the existing **Generate Report** button,
  above the students table (same visual weight/placement tier).
- Label: **Save Progress File (All Students)** or similar — must be
  clearly distinct from the per-row button and from **Generate Report**
  (which produces the polished PDF, not a raw recovery snapshot).
- On click: loop the *currently filtered/visible* `dashboardRows` (respect
  track filter / hide-not-started, same D4 scoping `buildCohortReportData`
  already uses) and call `downloadStudentSnapshot(studentId, identity)`
  (added by Workstream H, `portal/app.js`) once per student, or bundle all
  of them into a single JSON file (array of per-student snapshot records)
  — a single combined download is almost certainly better UX than
  triggering N separate browser downloads; use judgment but prefer one
  file.
- Show progress/status while running (this will be N sequential Supabase
  reads for a real cohort) and a clear completion count, same status-line
  pattern the existing buttons use (`#admin-report-status`).
- Same guardrail as Workstream H: this never deletes or resets progress
  data, it only reads and downloads. Do not wire it to any bulk
  disenroll/reset action — it's a standalone bulk-export button, not a
  bulk version of the enrolled->disenrolled snapshot-then-disenroll flow.

## 11. Agent execution order

### Agent 1 — runtime reproduction

- Reproduce the JSON/PDF behavior in a clean browser.
- Identify exact root cause.
- Produce screenshots, console output, filename, MIME type, and `%PDF-` evidence.
- Make no schema changes.

### Agent 2 — reporting data inventory

- Map every `Reportingrequirements.txt` field to its current table/column/function.
- Mark Present / Partial / Missing / Unreliable.
- Identify authoritative versus derived values.
- Update the assessment specification only.

### Agent 3 — report architecture

- Split cohort, transcript, evidence, and compliance report models.
- Implement pure report-data builders.
- Correct status and completion logic.
- Add explicit missing-data handling.

### Agent 4 — PDF implementation

- Build polished cohort and transcript PDFs.
- Add report selection/preview.
- Add metadata, scope, reporting period, pagination, branding, and warnings.
- Keep JSON secondary only.

### Agent 5 — enrollment and annual reporting schema

- Implement append-only enrollment periods.
- Add credential, scheduled completion, geography-link, and reporting-period support.
- Preserve history.
- Do not delete academic records.

### Agent 6 — attendance and hours

- Implement the institution-approved attendance/clock-hour model.
- Add reconciliation to approved program hours.
- Do not invent compliance policy; stop if no approved model exists.

### Agent 7 — evaluation and artifacts

- Persist artifacts.
- Add evaluator/reviewer workflow.
- Add rubric/scoring versioning.
- Add capstone critical-error fields and official review outcome.

### Agent 8 — security and audit

- Persist report-generation audit records.
- Add authorization tests, privacy warnings, report IDs, and hashes.
- Define retention and retrieval behavior.

### Agent 9 — QA

- Test all report types with:
  - Zero students
  - One student
  - Withdrawn student
  - Completed student
  - Failed capstone
  - Missing dates
  - Missing attendance
  - Long names
  - Multiple programs
  - 500-student cohort
  - Query failure
- Visually inspect every PDF page.
- Verify no JSON opens as the default report.
- Verify official reports never claim complete compliance when required data is missing.

## 12. Acceptance criteria

The work is complete only when all of the following pass:

- Admin **Generate Report** downloads a valid PDF in a clean browser session.
- The default report never opens or downloads raw JSON.
- Student academic records have a human-readable PDF option.
- Cohort reports and individual transcripts are separate report types.
- The report clearly shows its scope and reporting period.
- Every CIE minimum field is present or explicitly marked missing.
- No unsupported requirement is labeled “Covered.”
- Withdrawn, not enrolled, and completed states are correctly distinguished.
- Annual reporting includes the required period-based categories.
- Attendance and hours reconcile to the approved program structure.
- Labs include meaningful assessment and approved evaluator/supervision evidence.
- Official completion respects the capstone critical-error gate.
- Records survive browser changes, content changes, and course archival.
- Report generation is authorized and audited.
- PDF layout is visually approved at realistic and large cohort sizes.
- Automated tests validate data logic and file generation.
- Documentation and migration status agree with the deployed system.
- `HANDOFF.md` is updated at the end of the implementation session.

## 13. Non-negotiable guardrails

- Do not delete student progress, attempts, artifacts, or enrollment history.
- Do not treat browser `localStorage` as permanent academic storage.
- Do not invent CIE interpretations for attendance or evaluator requirements.
- Do not mark missing data as zero.
- Do not mark partial compliance as covered.
- Do not expose raw internal JSON as the official report.
- Do not apply unapplied migrations without deliberate review and authorization.
- Preserve unrelated working-tree changes.
