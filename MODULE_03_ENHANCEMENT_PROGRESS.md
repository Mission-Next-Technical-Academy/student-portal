# Module 03 enhancement progress — Sprint 4

Date: 2026-09-10  
Scope: `CURRICULUM_SCENARIO_ARCHITECTURE.md` Sprint 4 only  
Status: implemented locally; draft crosswalk review remains pending

## Delivered

- Added four persisted scenario → theory → three-question feedback check →
  applied-task loops for the existing Module 03 lessons: linked observations,
  normalized exploration, correlation queries, and analyst handoff.
- Retained the existing assisted `svc_reports` signal-room lab and added an
  independent `CASE-MN-428` low-and-slow cloud-mailbox/session lab. Its
  decisions cover signal combination, bounded scope, and evidence-preserving
  escalation, so it does not repeat the guided lab's row-selection/query/
  timeline path.
- Updated Module 03 catalog metadata to show two lab surfaces while retaining
  `durationMinutes: 465`, `creditMinutes: 465`, and the existing 240-minute
  lab allocation. No new instructional minutes were advertised.
- Added a CISA logging reference and clarified the Security+ page as a
  supplementary public reference. No reviewer approval, certification
  endorsement, affiliation, or pass claim was added.
- The existing randomized module quiz already uses scenario framing,
  BEST/MOST/FIRST reasoning, plausible distractors, per-answer feedback, and
  retry selection; it was retained and the new lesson checks use the same
  reasoning standard.

## Verification

- `node --check portal/soc-analyst-module-03.js` — passed
- `node --check portal/data.js` — passed
- `node bin/portal-check.js 3` — passed (`soc-03`, `its-03`, and overview)
- `node bin/render_all.js` — passed (`views: 129/129 render clean; dead NAV routes: 0`)
- `git diff --check` — passed

No other module, simulator route, database migration, or instructional-minute
ledger was changed for Sprint 4.

---

# 2026-09-24 — Guided/Assessment Labs rebuilt as an in-module SIEM console

Owner request: replace Module 03's imported-lab launch cards with a Module
02-style environment console plus a query engine. Lecture, Knowledge Check,
Module Review and Sources are unchanged.

## What changed

- `portal/soc-analyst-module-03-environment.js` / `.css` (new): SIEM &
  Log Analysis console with Alerts, Log Search (KQL), Timeline, Entities,
  Data Sources (native→normalized field mapping + collector health),
  Watchlists, and Evidence (pinned records) tabs.
  - **Guided Lab** = CASE-MN-428 (acct-428, same case as the Lecture), with a
    10-step guide. Checks are result-based (any equivalent query passes), and
    support decreases from full queries → patterns → goal only. Completing
    the guide sets `practiceComplete`. Existing manual completions are kept.
  - **Assessment Lab** = CASE-MN-517 (overnight password spray, different
    entities/tables). No guide or hints. The determination form covers
    verdict, severity, per-account scope, indicators, response actions,
    escalation, and a 4-field handoff. `moduleThreeScoreAssessment()` scores
    six competencies from a data rubric with PRIMARY/SECONDARY/SUPPORTING/
    CONTRADICTORY levels, unsafe-action deductions, and critical competencies
    (m.ortiz compromised + true positive), which cap the recommendation at 69.
    It submits via `recordLabAttempt('lab-siem-triage', {score, result})`,
    with `result.case_record` / `simulator_performance` / `breakdown` /
    `feedback` shaped for the existing admin grading panels (no app.js change).
- `portal/kql-engine.js`, `portal/kql-editor.js`, `portal/kql-editor.css`
  (new): ported from `~/defender-lab/ui` (mockKql* evaluator + editor), made
  table-agnostic. Added: lab clock for ago()/now(), explicit errors for
  unknown tables/operators, distinct/count/limit/project-rename, min/max/avg/
  make_set, and a hidden `__rid` carried through the pipeline for pinning.
- `portal/soc-analyst-module-03.js`: removed the imported-lab link arrays,
  launch panels, the Required Labs block and its gating/wiring. Panels now
  come from the environment file.
- `portal/index.html`, `bin/portal-check.js`: load the new files before
  `soc-analyst-module-03.js`.
- `tests/m03-siem-console.test.js` (new): engine, guided-step checks, and the
  standard's required rubric scenarios. Run with `node tests/m03-siem-console.test.js`.

## Verification

- `node tests/m03-siem-console.test.js`: 23/23 pass.
- `node bin/portal-check.js`: all modules OK.
- Browser: the harness page loaded the real portal files with a stubbed user.
  Full guided run steps 1–10 → practiceComplete. Assessment empty-submit was
  rejected, and a full submit recorded one attempt, score 100, with the
  expected payload. Not yet checked with a real logged-in student account.
- `node bin/curriculum-check.js` crashes in `allocationsCell` (data.js
  `parentAllocations` undefined). That file was not touched here.

## Open

- `portal/range-tools/m03-log-explorer/` is no longer linked from Module 03
  (it holds another session's uncommitted edits). Delete it or keep it as a
  standalone tool.
- Live check as a student, plus one instructor review of a submitted attempt
  in the admin Grading tab.
