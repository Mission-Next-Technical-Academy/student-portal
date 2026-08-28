# Mission Next SOC LMS — Curriculum Alignment Architecture

Status: implementation authority for the 2026-08-28 curriculum-alignment wave  
Scope: learner portal curriculum labels, hours, mappings, labs, capstone, M360 boundary, and compliance exports  
Supersedes for curriculum decisions: `MODULE_STANDARD.md` SOC title/hour assumptions and the curriculum portions of `PLATFORM_ARCHITECTURE.md`  
Does not supersede: `architecture.md` for the in-progress Supabase/auth migration or `PROJECT_GUIDE_FOR_AI.md` for repository safety

## 0. Sprint status (as of 2026-08-28, this wave)

**Nothing below is committed or deployed.** Everything is sitting uncommitted in the working tree on `master`. Sprints A-G were never a finished, closed set before this status line was added — they were built and gate-checked one after another in the same session and are being tracked here as they land, not as a pre-verified plan. Do not treat "Sprint X exists in this doc" as "Sprint X shipped" — check this table.

| Sprint | Status |
|---|---|
| A — Canonical map and validator | Done, gate-checked |
| B — Landing page and shared syllabus rendering | Done, gate-checked |
| C — Module label and scope synchronization | Done, gate-checked |
| D — Lab and capstone compliance surface | Done, gate-checked |
| E — M360 separation | Done, gate-checked |
| F — Records/export and checker repair | Done, gate-checked |
| H — Admin progress dashboard | Done, gate-checked (commit `57ac7cc`) |
| Admin-only redirect (spec'd at the end of the Sprint H section) | Done, gate-checked (commit `e4903e1`) |
| H.1 — Student detail drill-down | Done, gate-checked (commit `227bb5c`). Migration `supabase/migrations/20260828170000_admin_student_detail.sql` is **applied to the live database** (confirmed via `supabase db diff --linked`). |
| G — Final QA and handoff | Done. Full syntax/render/browser sweep, prohibited-language scan, stable-key diff audit, and exact-hours reconciliation all pass; found and fixed a real `TypeError: Assignment to constant variable` in `portal/app.js`'s `render()` (broke every admin login) plus several prohibited-language leftovers in skill-tag chips and summary copy (see HANDOFF.md for the full list). Release readiness still gated on section 9's external approvals — this sprint cannot itself certify launch. |

Also live and relevant but tracked in `architecture.md`, not here: the backend-simplification migration (`supabase/migrations/20260828160000_simplify_schema.sql`) has been applied to the live database (confirmed via `supabase migration list`), and a live-breaking bug it caused — `portal/app.js`'s `buildUserFromSession()` querying the now-dropped `enrollments`/`programs` tables — has been found and fixed directly (not part of any lettered sprint).

## 1. Decision hierarchy

Use these sources in this order:

1. The current user direction.
2. `Mission Next SOC Analyst LMS Build Review, CIE Alignment & Developer Execution Checklist.docx`.
3. The approved Form 301 and current catalog referenced by that checklist. They are not present in this repository, so any item needing their exact wording beyond the checklist remains a compliance-review gate.
4. The reusable lesson and QA structure in the four IT Help Desk curriculum documents.
5. Existing portal content when it fits the approved SOC scope.
6. Historical SC-200/product documents only as implementation history.

The four files in the IT Help Desk curriculum folder govern `ITHD-101`, not this SOC program. Their Help Desk codes, titles, 60/72-hour totals, VirtualBox requirement, and L1 support scope must not be copied into the SOC syllabus. Their reusable contribution is the lesson record shape: parent, duration, Learn/Practice/Prove activity, evidence, assessment, faculty evaluation, standards crosswalk, and revision.

## 2. Locked SOC baseline

| Property | Required value |
|---|---|
| Program | Mission Next: Security Operation Center (SOC) Analyst |
| Credential | Diploma |
| Delivery | Online / approved distance education |
| Duration | 6 weeks |
| Technical SOC hours | 70 |
| M360 Career Readiness hours | 12, separately accounted |
| Total program clock hours | 82 |
| Theory hours | 42 |
| Lab hours | 40 |
| Minimum passing standard | 70% |
| Attendance requirement | 80% |
| Tuition | $3,000 |

The checklist states that the technical labs must reconcile to all 40 approved lab hours. The working calculation is therefore 30 technical theory hours + 40 technical lab hours + 12 M360 theory hours = 82 hours. This interpretation must remain visibly marked for compliance sign-off because the repository does not contain the controlling Form 301's parent-by-parent theory/lab split.

## 3. Approved technical parents

These codes, titles, order, and totals are fixed.

| Code | Approved parent title | Hours |
|---|---|---:|
| SOC-101.1 | Program Orientation, LMS Navigation, SOC Role Overview, and Security Operations Workflow | 3 |
| SOC-101.2 | Network Operations Fundamentals, Protocols, Traffic Flow, and Security Architecture | 10 |
| SOC-101.3 | Network Attack Methods, Common Threat Vectors, and Adversary Techniques | 10 |
| SOC-101.4 | Detection Mechanisms, Alert Triage, Indicators of Compromise, and Event Review | 12 |
| SOC-101.5 | Packet Capture, Log Review, IDS/IPS Concepts, and SIEM Scenario Analysis | 14 |
| SOC-101.6 | Incident Response Fundamentals, Escalation, Documentation, and Case Handling | 9 |
| SOC-101.7 | Automated Detection Tools, Security Monitoring Methodologies, and Analyst Workflow | 8 |
| SOC-101.8 | Capstone: SOC Case Study, Threat Detection Scenario, and Analyst Report | 4 |
|  | Technical total | **70** |

`M360-101 — Personal Branding, Career Positioning, LinkedIn Optimization, Resume Development, Interview Preparation, and Career Spotlight — 12 hours` remains a separate companion course. Technical case notes, incident reports, handoffs, and executive summaries do not replace M360.

## 4. Student-facing module labels

The 12-module, six-week experience stays. Stable keys `soc-01` through `soc-12`, routes, lab keys, runtime IDs, flags, and saved-state namespaces do not change.

| # | Required learner-facing label | Parent summary | Disposition |
|---:|---|---|---|
| 01 | SOC Operations Foundations | SOC-101.1, SOC-101.2 | Adopt the checklist's recommended narrower label; keep “What is a SOC analyst?” as a lesson, not the module H1. |
| 02 | Network, Identity & Security Foundations | SOC-101.2 | Keep; identity stays in analyst/access-control context. |
| 03 | SIEM & Log Analysis | SOC-101.4, SOC-101.5 | Keep; core module. |
| 04 | Detection Rules, Threat Intelligence & Automated Monitoring | SOC-101.4, SOC-101.7 | Mandatory rename; retain tuning, enrichment, false-positive review, and bounded automation. |
| 05 | Endpoint & Malware Investigation | SOC-101.3, SOC-101.4, SOC-101.6 | Keep; no reverse engineering, malware development, or specialist framing. |
| 06 | Threat Hunting & Investigation | SOC-101.7, SOC-101.6 | Keep; guided monitoring workflow, not a separate Threat Hunter program. |
| 07 | Network & Email Analysis | SOC-101.3, SOC-101.5 | Keep. |
| 08 | Vulnerability Findings & SOC Prioritization | SOC-101.3, SOC-101.7 | Mandatory rename; analyst intake/prioritization, not enterprise vulnerability-program administration. |
| 09 | Incident Response | SOC-101.6 | Keep; core module. |
| 10 | Incident Evidence Handling, Chain of Custody & Case Documentation | SOC-101.6 | Mandatory rename; acquisition/preservation concepts and escalation to specialists, not a forensics course. |
| 11 | SOC Operations, Metrics, Reporting & Communication | SOC-101.7, SOC-101.6 | Keep. |
| 12 | SOC Analyst Capstone | SOC-101.8 | Keep; exactly 4 hours and no new instruction. |

Week labels must use the same scope. In particular, “Detection Engineering,” “Vulnerability Management,” and “Forensics” must not remain as week/module specializations. Technical occurrences may remain only where they accurately name a role outside this entry-level program or a bounded concept, never as the program's promise.

The SOC checklist does not supply a formal lesson-title catalogue. Therefore:

- preserve current lesson/concept labels when they represent in-scope content;
- normalize those real labels into one canonical item list instead of retaining unsupported numeric claims;
- add a label only for an instructional block already present in a module;
- never describe a developer-authored label as Form 301 wording;
- keep Security+ tags empty until a curriculum reviewer supplies the secondary crosswalk.

## 5. Current-state findings

| Area | Current state | Required correction |
|---|---|---|
| Landing page | 80–100 estimated hours; 10–15 labs + capstone | 82 approved clock hours; 70 technical + 12 M360; 40 lab hours; 12-module learning experience; Diploma and approved delivery language. |
| Module hours | Ranges total 81–108 technical hours | Exact item durations rolling to 70 technical hours. |
| Lesson model | Only Modules 01 and 05 have real numbered lessons; other counts are largely unsupported | Canonical addressable items with stable IDs, exact minutes, type, parent allocation, objective, evidence, assessment, faculty evaluation, and revision. |
| Labels | Module H1s are duplicated in 12 files; Modules 01 and 12 diverge from catalogue | Catalogue title is canonical; module views read it or are covered by a label-audit gate. |
| High-risk scope | Old Module 04/08/10 titles and related skill labels imply specializations | Apply the approved-scope labels and descriptions everywhere learner-visible. |
| Lab catalogue | 16 non-capstone labs exist plus one capstone; several module `labs` counts are wrong | Reconcile declared count to catalogue/completion keys. Treat `lab-soc-escalation` as the locally identified 16th lab pending curriculum sign-off. |
| Lab duration | Catalogue minutes total far below 40 hours; Module 07 and Module 01 page totals also drift | Assign exact instructional duration and embedded assessment time; validate 36 non-capstone + 4 capstone lab hours. |
| Capstone | Displayed as 8–12 hours / 600 minutes | Exactly 240 minutes; 12 stages remain one Prove assessment; add prior-instruction trace and rubric metadata. |
| M360 | Generic career section is described as integrated and has no separate 12-hour map | Separate M360 section, 12-hour total, independent progress boundary, named source areas, and explicit curriculum-review status. |
| Passing standard | Most labs require 75–80 | Use the catalog baseline of 70 unless a separately approved assessment standard is documented. Safety/critical-error gates may remain additive. |
| Records | Local lab state and partial Supabase writes exist; attendance, faculty review, artifacts, and complete exports are unproven | Add a local curriculum/learner record export and document backend gaps; do not claim launch compliance without a real-session test and reviewer sign-off. |
| QA | Current checker misses label drift, unsupported lesson counts, asset gaps, and async-auth rendering | Add deterministic curriculum validation and fix the checker before the final gate. |

The IT Help Desk skeleton's 12 module labels already match that program's recommended mapping, but it is not publishable: it has no lessons/labs and its approved eight-hour virtualization parent is not represented in a resolved student-facing allocation. This SOC wave must not invent that missing Help Desk decision.

## 6. Canonical curriculum data contract

Keep display catalogue data in `portal/data.js`; the pending backend simplification intentionally removes duplicate catalogue tables. Extend the program with a curriculum record shaped as follows (plain JavaScript, no build step):

```js
program.compliance = {
  revision, programName, credential, delivery, weeks, tuition,
  technicalHours, careerHours, totalHours, theoryHours, labHours,
  passingPercent, attendancePercent, status, sourceNotes
};

program.parents = [
  { code, title, hours, theoryMinutes, labMinutes, reviewStatus }
];

module.curriculumItems = [
  {
    key, kind, title, durationMinutes, classification,
    parentAllocations: [{ code, minutes }],
    objective, learn, practice, prove,
    evidence, assessmentMethod, facultyEvaluation,
    securityPlusTags: [], revision
  }
];

lab = {
  ...existingStableFields,
  instructionalMinutes,
  parentAllocations: [{ code, minutes }],
  objective, startingState, task, successCondition,
  escalationCondition, evidence, assessmentMethod,
  facultyEvaluation, revision
};
```

Rules:

1. `key`, module key, lab key, route, runtime ID, and earned flags are immutable compatibility identifiers.
2. `durationMinutes` is exact. A range is not accepted for required curriculum.
3. Parent allocations for an item must sum to its duration.
4. Every required technical minute appears once and only once in the roll-up.
5. Embedded assessment minutes are included in their lesson/lab duration, not added again.
6. Every lab is performance-based and names its starting state, task, success, escalation, evidence, and faculty review method.
7. The capstone has `kind: 'capstone'`, 240 minutes, and no Learn-only item.
8. Security+ metadata is secondary and may be empty; it never authorizes an item.
9. M360 records are separate from `soc-*` technical records and totals.
10. Curriculum status distinguishes `developer-mapped`, `curriculum-reviewed`, and `compliance-approved`; the UI must not imply approval beyond the evidence present.

## 7. Validation invariants

`node bin/curriculum-check.js` is the release gate and must fail unless:

- program totals are 70 technical + 12 M360 = 82;
- overall classification totals are 42 theory + 40 lab;
- the eight SOC parent totals are exactly 3/10/10/12/14/9/8/4;
- capstone is exactly 240 minutes;
- every required item has all mapping/evidence/evaluation fields;
- every parent allocation resolves to a known parent and sums correctly;
- every module key and lab key remains unique;
- the 16 non-capstone lab keys plus `lab-capstone` reconcile with module declarations and completion writes;
- canonical titles match catalogue cards, module H1s, capstone headings, week labels, and applicable lab labels;
- no prohibited certification-prep/pass-guarantee phrase is learner-visible;
- no missing referenced asset exists;
- all 12 module registrations remain present.

The report generator must produce an exportable Markdown/CSV map with item, module, parent allocation, minutes, classification, evidence, assessment, faculty evaluation, and revision.

## 8. Sequential agent sprint protocol

Only one implementation agent works at a time. The orchestrator reviews and closes it before spawning the next.

For every sprint:

1. Spawn a fresh bounded coding agent with named files and acceptance commands.
2. Agent reads this document plus the relevant source section and checks the dirty worktree before editing.
3. Agent preserves unrelated changes and stable IDs; no commit, push, migration apply, account provisioning, or live deployment.
4. Agent implements only its sprint, runs checks, updates a short report, and returns a file list plus risks.
5. Orchestrator reviews the diff, runs the gate, corrects integration issues, then closes the agent.
6. Spawn the next sprint only after the prior gate passes.

### Sprint A — Canonical map and validator

Files: `portal/data.js`, new `bin/curriculum-check.js`, new generated `CURRICULUM_MAP.md` (and optional CSV).  
Deliver: locked compliance metadata; exact parents; canonical real lesson blocks; 16-lab reconciliation; exact minute allocations; M360 boundary/status; deterministic roll-up validation.  
Gate: syntax + curriculum checker. No visual changes yet.

### Sprint B — Landing page and shared syllabus rendering

Files: `portal/app.js`, minimal portal styles only if needed.  
Deliver: corrected program cards, Mission Next-first hero, 82/70/12/42/40 facts, Diploma/delivery language, secondary Security+ disclaimer, canonical module item/parent rendering, separate M360 section, and track-safe lab rendering (remove hard-coded global SOC assumptions).  
Gate: curriculum checker, portal checker, browser screenshot at desktop/mobile.

### Sprint C — Module label and scope synchronization

Files: `portal/module-01.js`, `module-04.js`, `module-05.js`, `module-06.js`, `module-08.js`, `module-10.js`, `module-12.js`, and other module files only for a verified canonical-title hook.  
Deliver: Module 01/04/08/10 H1s and copy match the approved-scope labels; Module 05/06 guardrails are explicit; ATT&CK is a framework; capstone wording uses the canonical title while keeping the case name subordinate; all pass thresholds use 70 with existing safety gates preserved.  
Gate: canonical-label audit + syntax + module render/state checks.

### Sprint D — Lab and capstone compliance surface

Files: lab metadata/rendering and `portal/module-12.js`; no simulator rewrite.  
Deliver: exact lab instructional durations; 16-lab explanation; evidence/evaluation display; four-hour capstone stage timing, rubric, and prior-instruction trace; no new capstone instruction.  
Gate: 40-hour lab roll-up, 240-minute capstone, capstone prerequisites/state regression.

### Sprint E — M360 separation

Files: portal catalogue/rendering and isolated M360 data/view.  
Deliver: a visibly separate `M360-101` 12-hour companion surface using only the source-named curriculum areas; independent status/progress namespace; no assertion that developer-created lesson titles are approved.  
Gate: separate 70/12 roll-up and no technical completion coupling.

### Sprint F — Records/export and checker repair

Files: portal record/export helpers, `bin/portal-check.js`, migrations only if a non-destructive local change is clearly required.  
Deliver: exportable curriculum map and test-student record shape covering grades, attendance/time evidence, progress, artifacts, faculty evaluation, capstone, and outcome; correct async auth test harness; asset fix. Backend features not proven against a real session remain explicitly `not verified`, never simulated as compliant.  
Gate: clean record export fixture, async portal check, syntax, state isolation.

### Sprint H — Admin progress dashboard

Added after Sprint F shipped a working `#/admin` route (`viewAdmin()` in `portal/app.js`, reading the `admin_student_progress` Supabase view). Run this before Sprint G so the final QA sweep covers it too.

Context: ~81 accounts are provisioned across five tracks (1 ADMIN + 20 each of SOCAN/HDESK/AIENG/ELECT — see `bin/provision-students.js`), and the great majority have zero progress at any given time (freshly provisioned or between cohorts). The current `admin_student_progress` view (`supabase/migrations/20260828160000_simplify_schema.sql`, already live) already `left join`s from `students` with `coalesce(..., 0)` defaults, so a zero-progress student should already appear as a row with `modules_complete = 0` rather than being dropped — audit this is genuinely true end-to-end (view *and* the client rendering in `viewAdmin()`) rather than assuming either the old bug or the fix is still accurate; the view was rewritten once already (compare against the superseded version in `supabase/migrations/20260828120000_students_admin.sql`, which used inner `join`s against tables that no longer exist) and no one has re-verified the rewrite against the live DB with a real admin session yet.  
Deliver: (1) confirm/fix that zero-progress students render as a real row (0%, "Not started") rather than being silently excluded anywhere in the view or `viewAdmin()`; (2) replace the current flat table with a genuinely simple progress-tracker dashboard for one admin skimming ~80 rows: summary tiles at the top (total students, not-started / in-progress / complete counts, average completion), the table sorted with active progress surfaced first (e.g. by `modules_complete` descending, or `last_active` recency) rather than provisioning order, a per-track filter, and a "hide not-started" toggle so 60-70 all-zero rows don't bury the handful of students who've actually done something — default the toggle to showing everyone (don't hide data by default, just make hiding the noise a one-click option); (3) keep it lightweight — no new backend tables, no pagination framework, this is one admin and ~80 rows.  
Also: admin accounts currently land on the normal `#/portal` view after login — the student catalogue/course-selection page (`ADMIN` has no `programSlug`, so this renders as "You do not have any active programs yet. Browse the catalogue below..."). **The site owner does not want an admin account able to reach the course-selection/catalogue page at all.** Add a router-level redirect: in the router (search for `hash === '#/login'` and the fall-through to `#/portal`, plus wherever `viewPortal(user)` gets called directly), if `user.isAdmin`, always send them to `#/admin` instead of ever rendering `viewPortal()` — not just as the post-login default, but any time navigation would otherwise land an admin on the catalogue page (e.g. typing `#/portal` directly, or a stale link). Keep `#/admin` itself reachable from the header nav.  
Files: `portal/app.js` (`viewAdmin`, the router's post-login landing logic, and the `admin_student_progress` query call site), the `admin_student_progress` view definition only if the audit in (1) finds it's genuinely still wrong (new migration file, non-destructive, additive `create or replace view` only — never drop/alter a live table).  
Gate: `node --check`, `node bin/portal-check.js`, `node bin/curriculum-check.js`, `node bin/lab-state-check.js` all still pass; manual trace-through (read, don't just run) confirming a student with zero rows in `module_progress`/`lab_attempts` still appears in the rendered table.

**Confirmed by the site owner directly (not just a suspected regression): zero-progress students genuinely do not appear on the admin dashboard today.** Treat the audit above as "find the exact cause," not "check whether this is real."

### Sprint H.1 — Student detail drill-down

Run after Sprint H lands (it builds on `viewAdmin()`'s rebuilt table). Not yet started — spec only, do not implement until explicitly told to proceed.

Deliver: a dropdown/select on the admin dashboard populated only with students who have real progress (`modules_complete > 0` or at least one `lab_attempts`/`capstone_submissions` row) — the zero-progress majority stays out of this picker, it's for drilling into someone who's actually done something. Selecting a student loads a detail panel/view showing:
- Per-module status and percent from `module_progress` (`state`, `percent` per `module_key`).
- Per-lab score from `lab_attempts` (`score`, `state`, `completed_at` per `lab_key`) — this table *is* the quiz/test/assessment record in this codebase; there is no separate quiz engine, so don't invent one. Label these clearly by lab name (join against `portal/data.js`'s lab catalogue for the human-readable title, the same way `CURRICULUM_MAP.md` does).
- Capstone detail from `capstone_submissions` (per-`stage` score, 1-12) and the `capstone_scorecard` view (the six/ten rubric-dimension breakdown already scored there) if it exists and is queryable — confirm its actual current shape by reading the migration before assuming column names.

This needs a new Supabase query (student detail by `user_id`/`student_id`, gated the same way `admin_student_progress` is — `is_admin()` check, `security_invoker`) — likely a new view or a couple of scoped `select`s in `portal/app.js`, admin-only. No new tables. Keep the UI to what one admin needs to spot-check a student, not a full gradebook — this is a drill-down, not a new subsystem.  
Gate: same four commands as Sprint H, plus a manual trace confirming a student with only e.g. one completed lab and nothing else renders sensibly (no crashes on missing capstone/module rows).

### Sprint G — Final QA and handoff

Files: documentation and fixes found by QA.  
Deliver: full syntax/render/browser sweep, prohibited-language scan, stable-key diff audit, exact-hours report, screenshot evidence, and updates to `HANDOFF.md`, `LATEST_PROGRESS.md`, and `MODULAR_LAB_PROGRAM_PROGRESS.md`. Include Sprint H's admin dashboard in this sweep.  
Gate: all automated invariants pass; remaining external approvals listed by owner and evidence needed.

## 9. Release boundary

This implementation can make the repository internally consistent and exportable. It cannot truthfully certify CIE launch readiness by itself. Release remains blocked until:

- the controlling Form 301/current catalog are compared directly to the generated map;
- a curriculum lead approves developer-authored lesson labels and minute allocations;
- a compliance reviewer approves parent and theory/lab allocations plus M360 separation;
- qualified faculty approve assessment validity and evaluation methods;
- real authenticated persistence, attendance/time evidence, artifacts, feedback, history, and export are tested;
- the curriculum lead, compliance reviewer, faculty reviewer, and developer sign off.

No agent may push to `master`, apply the destructive pending schema migration, provision accounts, or change the public site as part of this curriculum wave without explicit user authorization.
