# Compliance Decisions Needed for CIE Approval

This document flags two CIE reporting/recordkeeping requirements that cannot be addressed through engineering alone — they require explicit compliance and product decisions from the institution's leadership.

**Date:** 2026-08-29  
**Reference:** `ASSESSMENT_REPORTING_SPEC.md` § 4, items 3–4

---

## Decision 1: Evaluator/Supervision Requirement for Labs

### The Requirement

**CIE Rule:** Rule 6E-2.0041(9), F.A.C.

Hands-on or equivalent experiences in nontraditional programs must be:
- Available to each enrolled student
- Documented in the student's file
- **Appropriately supervised**
- **Meaningfully evaluated**

The rule specifically requires **"supervision or evaluator information where applicable"** to be recorded in the student's academic file.

### Current State

All 12 SOC Analyst modules (01–11 labs + 12 capstone) are **self-graded** by client-side scoring logic. There is no human-in-the-loop review step anywhere in the platform. When a student submits a lab artifact or decision worksheet, a fixed rubric is applied automatically, a score is recorded, and the student immediately sees their result. No instructor ever sees the submission or adds evaluator notes.

From the schema (`lab_attempts` table in Supabase): There is no `reviewed_by`, `evaluator_id`, or `supervisor_name` column. The table captures `score`, `result` (JSON rubric breakdown), `started_at`, and `completed_at` — but nothing that indicates human oversight.

### Interpretation Challenge

"Supervision or evaluator information where applicable" is ambiguous in the self-paced, fully remote context:
- **Strict reading:** Any lab experience must have a recorded human evaluator. This would require mandatory faculty review of every submission.
- **Pragmatic reading:** For synthetic, self-graded labs in a remote program, an automated rubric and recorded score may satisfy "meaningful evaluation." "Where applicable" could be read as exempting low-stakes labs or synthetic exercises that don't involve direct client work.

CIE has not published guidance on this for online SOC training programs specifically.

### Options

#### Option 1: Explicit Compliance Approval (No Code Changes)

**Description:** Reach out to the Florida Commission for Independent Education directly (or through institutional counsel/compliance) and request a **written confirmation letter** stating that self-graded, rubric-scored synthetic labs in a remote SOC training program satisfy the "supervision or evaluator information where applicable" requirement.

**Tradeoffs:**
- **Effort:** Minimal (bureaucratic/legal engagement only, no engineering).
- **Credibility:** High if CIE commits in writing. Removes ambiguity for future inspections.
- **Risk:** CIE could decline, defer, or change position after approval. Puts compliance in CIE's hands.
- **Student impact:** None.

**When to use:** If the institution has existing relationships with CIE (e.g., through accreditation or prior submissions) and is willing to invest in a formal approval process.

---

#### Option 2: Optional Instructor Review Workflow (Moderate Implementation)

**Description:** Add a **faculty review feature** that allows instructors to review student submissions and add evaluator notes. Make it optional per module or per student request (not mandatory for every submission).

Example flow:
- Student submits lab. Self-grading happens immediately; student sees their score.
- Instructor can optionally view the submission in an admin/review dashboard and add notes like "Good evidence use" or "Scope could be tighter."
- Instructor marks the submission as "reviewed" and records their name. This metadata is stored and exported.
- Students pursuing higher achievement or seeking feedback can request review; instructors prioritize.

**Tradeoffs:**
- **Effort:** Moderate. Requires UI for instructor dashboard (read-only submission view), review state in database (add `reviewed_by` and `reviewer_notes` columns to `lab_attempts`), and export logic to include reviewer info.
- **Credibility:** Medium-to-high. Provides a paper trail of instructor oversight for random submissions; shows intent to supervise.
- **Latency:** Minimal. Students don't wait for review to move forward.
- **Staffing:** Low to moderate. Depends on how many instructors want to do spot-checks. Can start with just capstone or high-stakes modules.
- **Student impact:** Positive. Optional feedback improves learning; no friction for students who don't request it.

**When to use:** If the institution wants to demonstrate active oversight without creating a bottleneck, or to gather evidence for a CIE inspection.

---

#### Option 3: Mandatory Instructor Review (High Implementation + Operational Cost)

**Description:** Every lab submission enters a review queue. An instructor must review, score/validate the self-grading, and sign off before the student can see the final result or move to the next module.

Example flow:
- Student submits lab. Status shows "Pending Instructor Review."
- Instructor reviews within 24–48 hours, confirms or adjusts the score, and approves.
- Student is notified; sees the instructor's evaluation and can now proceed.

**Tradeoffs:**
- **Effort:** High. Requires review state machine in database (`reviewed`, `pending_review`, `review_requested`), instructor queue UI, email notifications, and SLA tracking.
- **Credibility:** Highest. Clear evidence of human supervision. Easiest to defend to a CIE inspector.
- **Latency:** High. Students must wait for instructor availability. Creates friction in a self-paced program.
- **Staffing:** High. Requires stable instructor team and defined review SLAs. Scales poorly with enrollment.
- **Student impact:** Negative. Breaks self-paced promise; students may feel gated by instructor availability.

**When to use:** Only if CIE explicitly requires mandatory human review for each submission, or if the institution is willing to operate as a coached/hybrid-paced program rather than fully self-paced.

---

#### Option 4: Hybrid — Spot-Check with Automated Validation (Moderate Implementation)

**Description:** Student submissions are self-graded and students move forward immediately. The system **randomly flags 10–20% of submissions** for instructor review to validate the rubric was applied correctly and spot-check student understanding.

Example flow:
- Student submits lab. Self-grading happens; they see their score and move on.
- Every submission is flagged for potential review (e.g., fails rubric threshold, or is randomly selected).
- Instructor reviews flagged submissions on a weekly or ad-hoc basis, adds notes like "Rubric correctly applied" or "Score appears generous."
- Over time, the flagged submissions form a statistically defensible sample of instructor oversight.

**Tradeoffs:**
- **Effort:** Moderate. Requires a `review_flagged` state in database, a flag-selection algorithm (random + risk-based), and instructor review dashboard.
- **Credibility:** Medium. Provides evidence of oversight without 100% coverage. Defensible as quality assurance / audit sampling.
- **Latency:** None. Students are never blocked.
- **Staffing:** Low to moderate. Instructors review a sample, not every submission. Scales better than Option 3.
- **Student impact:** Neutral. Students don't know they might be reviewed; no friction.

**When to use:** If the institution wants to balance oversight, credibility, and scalability. Appeals to quality-assurance thinking and audit practices.

---

### Recommendation

**Option 2 (Optional Instructor Review) as the starting point, with Option 4 (Spot-Check) as a future enhancement.**

**Reasoning:**
- Option 1 (approval letter) is risky if CIE doesn't respond or later audits interpretation.
- Option 3 (mandatory review) breaks the self-paced model and is unsustainable with current staffing.
- Option 2 is feasible, shows institutional intent to supervise, and produces reviewable evidence without latency.
- Option 4 could layer on top of Option 2 over time to formalize audit practices.

**Suggested first step:** Implement optional review for the capstone module (Module 12) only, since the spec notes it includes a critical-error gate that is "a real safety/judgment check, not just a knowledge check." Capstone review is naturally defensible as high-stakes. Once the workflow is built, expand to other modules if compliance asks for it.

---

## Decision 2: Attendance / Clock-Hour Tracking

### The Requirement

**CIE Rule:** Rule 6E-1.003(63), F.A.C.

The LMS must record for each student:
- **Attempted clock hours by course** — how many instructional hours were attempted/started by the student in each course
- **Total hours attended/instructional time** — sum of all hours the student was engaged
- Course start and completion dates
- Total hours that reconcile to the institution's approved program structure

### Current State

**Required hours are defined and in code:**
- SOC Analyst program: **82 total hours** (70 technical + 12 other)
- Lab hours: **40 hours** (half of technical)
- These are documented in `CURRICULUM_MAP.md` and `portal/data.js`

**Attempted/attended hours per student: Not tracked at all.**
- No column in the `students`, `module_progress`, or `lab_attempts` tables records time spent.
- The `lab_attempts` table has `started_at` and `completed_at` timestamps, but they are not summed or compared to program hour totals.
- The `buildStudentExportRecord()` function in `portal/app.js` explicitly documents:
  ```
  attendanceEvidence.status: 'not yet collected',
  'Attendance tracking not implemented'
  ```

### Interpretation Challenge

"Attempted clock hours" assumes a traditional instructor-led model where "hours attempted" is straightforward (student was in class, or took an exam, or attended lab). In a **self-paced online program**, the question becomes:
- Does a student "attempt" an hour when they start the module?
- When they submit an assignment?
- Based on time spent on the system?
- Based on a fixed credit assigned to the module?

Different answers produce vastly different data and require different tracking mechanisms.

### Options

#### Option 1: Fixed Credit Hours Per Module (No Time Tracking)

**Description:** Assign a fixed number of clock hours to each module based on content scope and rubric complexity. When a student **passes** the module, award those hours to their record. Do not track actual time spent.

Example allocation:
- Module 01 (SOC Operations Foundations, walkthrough + worksheet): 5 hours
- Module 03 (SIEM & Log Analysis, scored artifact): 6 hours
- Module 12 (Capstone, multi-stage, 10 domains): 15 hours
- (Other modules allocated proportionally)
- Total: 82 hours across all 12 modules

**Tradeoffs:**
- **Effort:** Low. Requires one-time manual calibration of hour values per module, a simple update to `module_progress` or a new `module_credit_hours` table, and export logic.
- **Credibility:** Moderate-to-high. Defensible as "each module is worth X hours based on course design." CIE reviewers are familiar with credit-hour systems. Requires clear documentation of how hours were assigned.
- **Accuracy:** Varies. A student who understands quickly and passes on the first try gets the same hours as one who takes 10 attempts. Not time-based, but robust.
- **Student impact:** None. No tracking burden; students see hours awarded upon pass.
- **Auditability:** Easy. Hours are fixed and documented. No ambiguity from timing data.

**When to use:** If the institution wants a simple, defensible system and is comfortable with fixed-credit models (common in traditional education).

---

#### Option 2: Time-on-Task Estimation (Client-Side Duration)

**Description:** Track elapsed time from when a student clicks "Start" on a module to when they submit. Sum elapsed time across all attempts. Award that as "attempted hours" (converted to decimal hours).

Example:
- Student starts Module 03, spends 45 minutes before giving up: 0.75 hours attempted.
- Student restarts Module 03, spends 90 minutes and passes: 1.5 hours attempted.
- Total for Module 03: 2.25 attempted hours (even though program says 6 hours).

**Tradeoffs:**
- **Effort:** Moderate. Requires client-side timer tracking in each module, logging elapsed time on every attempt, and summing across attempts. Need to handle idle/inactive sessions (e.g., if a student leaves the tab open for 2 hours without interacting, don't count that).
- **Credibility:** Low-to-medium. Time-on-task is opaque to inspectors. Hard to explain why one student took 3 hours and another took 20 hours for the same module.
- **Accuracy:** Variable. Punishes students who think deeply or struggle; benefits quick learners. Doesn't reflect learning value.
- **Institutional risk:** CIE may question whether "time logged" is the same as "instructional time." Could trigger audit concerns.
- **Student impact:** Neutral (backend tracking, no UI burden).

**When to use:** Not recommended as a standalone. Could be supplementary data (e.g., "time spent" in addition to "hours credited"), but alone it's hard to defend.

---

#### Option 3: Fixed Credits + Optional Self-Logging (Hybrid)

**Description:** Award fixed credit hours per module (Option 1) as the standard. Optionally allow students to self-report sessions or request a revised hours total based on time-on-task if they feel the standard credit doesn't match their experience.

Example:
- Module 03 has a standard 6-hour credit.
- Student passes and gets 6 hours by default.
- If the student took 15 hours (5 attempts), they can request a "detailed log" showing time spent and ask for revised hours to be manually adjusted.
- An instructor reviews the request and approves or denies.

**Tradeoffs:**
- **Effort:** Moderate-to-high. Implement fixed credits (low) + optional time-logging UI (moderate) + manual review process (ongoing).
- **Credibility:** Medium. Fixed credits are simple and defensible; optional logging shows flexibility and granularity where needed.
- **Flexibility:** High. Accommodates students with legitimate reasons for extended hours (e.g., learning differences, English-as-second-language).
- **Scalability:** Moderate. Requires instructor review capacity for outlier cases. Not fully automated.
- **Student impact:** Slightly positive for students who struggle; neutral for others.

**When to use:** If the institution wants to start simple (fixed credits) and build in flexibility over time.

---

#### Option 4: Self-Directed Session Logging (Manual Entry)

**Description:** Require students to manually log each study session ("I worked on Module 05 for 2 hours today"). Optionally pair with timestamp data from `lab_attempts` to audit reported hours.

Example:
- Student opens a "My Hours" page and enters: "2026-08-29, Module 05, 2 hours, independent study."
- System sums the logged hours and compares to system timestamps as a sanity check.
- Instructor can spot-check or audit entries.

**Tradeoffs:**
- **Effort:** Moderate. Requires a session-logging UI, a `student_hour_logs` table, and validation logic.
- **Credibility:** Medium. Self-reported data is weak (students may inflate or deflate), but provides a paper trail and signals institutional intent to track.
- **Accuracy:** Low. Depends entirely on student honesty and memory. Requires auditing to be useful.
- **Compliance risk:** High. CIE inspectors may question the reliability of self-reported data.
- **Student impact:** Negative. Adds friction and record-keeping burden.

**When to use:** Not recommended as a primary method. Too much burden for uncertain credibility.

---

### Recommendation

**Option 1 (Fixed Credit Hours Per Module) as the baseline, with the door left open for Option 2 (time-on-task) as a future audit layer.**

**Reasoning:**
- Option 1 is simple, defensible, and aligns with how institutions communicate course rigor to regulators.
- The hour allocation should be based on rubric complexity, content scope, and time estimates from subject-matter experts (e.g., "Module 12 capstone takes most students 10–15 hours based on the 10-domain rubric").
- Option 4 (self-logging) adds burden with low credibility; not worth it.
- Option 2 (time-on-task) could be a future enhancement for deeper auditing if CIE requests evidence of student engagement, but alone it's not defensible.
- Option 3 (hybrid) is viable if needed later, but Option 1 alone is sufficient to meet the requirement.

**Suggested first step:**
1. Convene with SOC Analyst subject-matter experts (or curriculum designers) to allocate fixed credit hours to each module. Document the reasoning (e.g., "Module 12 is 15 hours because it spans 10 scored domains and includes a multi-stage incident investigation").
2. Add a `module_credit_hours` or `module_hours` value to the `portal/data.js` module definitions.
3. Update the student record export to sum `credit_hours` for passed modules and report "attempted hours" as the sum of all (passed + in-progress) modules' credit hours.
4. Reconcile the total against the 82-hour program requirement and document any discrepancies.
5. Add a CIE reporting section: "Students attempted X hours out of 82 required; completed Y hours in X months."

---

## Summary

| Decision | Recommendation | Key Next Step |
|---|---|---|
| **Evaluator/Supervision** | Option 2 (Optional Instructor Review), starting with capstone module. | Build optional review UI; reach out to CIE proactively to confirm approach. |
| **Attendance/Clock-Hours** | Option 1 (Fixed Credit Hours Per Module). | Allocate hours per module with SME input; update exports to report total attempted and completed hours. |

Both decisions require **compliance sign-off from Alex** (or the compliance officer). Once approved, the engineering work is straightforward.
