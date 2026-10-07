# Capstone skill backfill — teach every M12 mechanic before M12

## Next AI — start here (2026-10-07, plan written, Sprints 1–3 launched)

Owner rule (2026-10-07): every task the M12 capstone grades must first be
practised (Practice It / Guided Lab) and then assessed (Prove It /
Assessment Lab) in an earlier module. A live audit of M12's grading code
(`portal/soc-m12-assessment-rubric.js` `extractV2`, `soc-m12-assessment-console.js`)
against Modules 01–11 found four mechanics with no earlier home. This
workstream adds "a few more tasks per module here or there" to close them.

Read first, in order: `docs/LAB_ASSESSMENT_STANDARD.md`, `ROADMAP.md`,
this file, then the target module's code.

## Principle: the capstone is the reference (owner, 2026-10-07)

"If the capstone is debugged and perfect for the learner, I should be able
to reverse engineer those bugs down all other 11 modules." So every graded
M12 mechanic must trace to (1) the module(s) whose Practice It teaches it,
(2) the module whose Prove It assesses it, and (3) the shared code both use
(`SocConsoleTools.PACKS.mXX`, `caseRecord*`, a state/rubric file). A bug
found in the capstone is then looked up in that map and fixed — or
checked — at its source module. M12 embeds the M04–M10 packs directly, so
a pack bug seen in M12 is the same bug in its home module.

Deliverable (Sprint 4): `portal/soc-capstone-traceability.js` — one entry per
M12 rubric item / required action (`SocM12AssessmentRubric.CRITERIA` plus
`moduleTwelveActionMissing()` checks) with `{ capstone, practice: [module,
tab/step], prove: [module, rubric item], code: [files] }` — and
`tests/capstone-traceability.test.js`, which fails if any M12 graded
mechanic has no Practice and Prove home, or if a referenced file/rubric id
no longer exists. Docs table generated from the same data in this file.

## The four gaps

| # | Capstone mechanic (M12 code) | Points in M12 | Practice It home | Prove It home |
| --- | --- | --- | --- | --- |
| A | Intelligence verdict per indicator: `malicious` / `benign` / `unknown` + rationale that cites corroborating evidence (`intel-decision`; wrong explicit verdict −5; `unknown` is correct when evidence is insufficient, e.g. TI-604) | 10 | M04 Guided Lab, Threat Intelligence tab | M04 Assessment Lab |
| B | Response workflow design: choose action nodes and connect them `from>to`, preserving evidence before approval and approval before isolation (`workflow-design`, nodes in `SocM12AssessmentData.scenario.workflowNodes`) | 5 | M09 Guided Lab, Response tab | M09 Assessment Lab |
| C | Unsafe response attempts are recorded and penalised: an isolate / revoke-session / restore attempted without a recorded approval, or on an out-of-scope target, is logged even though it is blocked (M12 caps the whole score at 69 = fail) | cap | M09 Guided Lab (attempt is recorded and the guide explains why it matters) | M09 Assessment Lab (competency deduction, not a whole-score cap unless the owner later asks) |
| D | Alert disposition vocabulary `true-positive` / `benign-positive` / `false-positive` / **`needs-investigation`** per alert; `needs-investigation` is correct when telemetry cannot yet support a conclusion (M12 AL-1208) | part of 12 | M03 Guided Lab: an alert that falls inside the AppAudit collector delay the `health` guide step already teaches | M11 Assessment Lab: queue triage already scores per-item dispositions (`soc-m11-assessment-data.js` `dispositions`) — add the option and one queue item whose supported answer is needs-investigation |

## Rules for every sprint

- Follow `docs/LAB_ASSESSMENT_STANDARD.md`: Practice It gives progressive
  hints and instant feedback; Prove It gives **no** procedural guidance, no
  pre-submission answer feedback, no glowing controls. Report the standard's
  pre-implementation block (REFERENCE COMPONENTS FROM MODULE 1 … FILES TO
  CREATE) in the sprint log below.
- Add, don't replace: keep each module's existing scenario, tasks and
  passing bar. "A few more tasks", consistent with the module's story and
  entity names. No vendor names. Never say "Boots2Bytes".
- Prove It scoring changes must be versioned or additive so attempts that
  are already submitted/approved keep their score and still load. Check how
  the module stores score (at submit time vs recomputed) before changing a
  rubric.
- Saved state round-trips through Postgres jsonb, which **reorders object
  keys**. Never validate saved state with `JSON.stringify(a) === JSON.stringify(b)`
  (that bug broke M09–M12 tabs on reload; fixed in 38949f5). Every new
  state field must survive normalize() after a jsonb-style key reorder —
  add a test for it.
- Reuse shared UI where M12 already has it (e.g. the workflow designer in
  `soc-m12-assessment-console.js` `contextualMarkup('response')`) — prefer
  moving it into the shared `SocConsoleTools.PACKS.m09` so M09 and M12
  render the same control, without changing M12's recorded action shapes.
- Learner-facing copy: plain analyst language, short. Give the `from>to`
  syntax an inline example (`preserve>approval`) wherever a connection box
  appears, including M12.
- Tests: extend the module's `tests/` files; the Prove It changes need the
  standard's required scenarios (perfect, partial, unsupported conclusion,
  etc.) for the new competency items. Pre-existing failures on master that
  are NOT yours: guided-lab-console-guide, soc-m04-assessment-rubric,
  soc-m04-assessment-scorer, soc-m05-assessment-console — don't count them,
  but don't make them worse (if your sprint touches M04 rubric/scorer, note
  whether they change).
- Verify: `bash bin/ci-check.sh` and `node --test tests/`. Sprints 1–3 run in parallel worktrees, so they do NOT start servers (dev.sh ports are fixed); Sprint 4 runs the real-browser
  sweep `NODE_PATH=/home/alex/.npm/_npx/6bcb61ec6d5aea22/node_modules node bin/console-tab-sweep.js <modules>`
  (needs the portal on :8768 — `bin/dev.sh`, target must be STAGING).
- Commit on your branch with a clear message; do not push. Update this file's
  sprint log (what shipped, files, caveats) as your last step.

## Sprint plan

- [x] **Sprint 1 — M04 intelligence verdicts (gap A).** Guided + Assessment.
- [ ] **Sprint 2 — M09 workflow designer + recorded unsafe attempts (gaps B, C).** Guided + Assessment; shared designer reused by M12 with an inline `preserve>approval` example.
- [ ] **Sprint 3 — needs-investigation disposition (gap D).** M03 Guided + M11 Assessment.
- [ ] **Sprint 4 — traceability map + integration.** Build the traceability module and test above (covering all M12 mechanics, not just A–D). Merge, full test + browser sweeps (M01 and M03–M12), update `MODULE_TWELVE_ARC_CALLBACKS` in `soc-analyst-module-12.js` to cite the new practice, update `docs/workstreams/LIVE_COURSE_UAT_AND_GRADING_UX.md`, owner push.

## Sprint log

(each sprint appends here)

### Sprint 1 — M04 intelligence verdicts (gap A) — 2026-10-07

Pre-implementation report (per `docs/LAB_ASSESSMENT_STANDARD.md`):

```text
REFERENCE COMPONENTS FROM MODULE 1
  Case-record / ITSM ticket submit and review model (caseRecord, review_payload), Learn/Practice/Prove
  shell, the guided-lab guide card (guidedLabGuide steps with tab + target), instructor review card
  (adminAttemptReviewCard rubric panel), "submitted = complete pending faculty review".

REUSABLE COMPONENTS
  SocConsoleTools.PACKS.m04 Threat Intelligence tab (one shared view for Practice It and Prove It),
  SocM04IntelligenceUi (IOC/report lifecycle), SocM04AssessmentActions action log,
  SocM04AssessmentRubric.extract -> SocM04AssessmentScorer -> SocAssessmentScorer.scoreCriteria,
  SocM04AssessmentState.normalize, the guided fixture derived from SocM04AssessmentData.
  The M12 mechanic is the reference: same three verdicts, same "rationale cites evidence or entities",
  same "unknown is right when evidence is insufficient", same penalty for an explicit wrong verdict.

TARGET MODULE DIFFERENCES
  M04 scores a fixed 100 points over 8 criteria and stores the score at submit. The M04 IOC list has no
  benign indicator, so a fourth indicator (the managed mail address the reputation sweep flags) is a
  separate verdictIndicators list rather than a new feed IOC (the feed list and its tests are untouched).
  The pack is shared with M05-M12 consoles, so the verdict section renders only when the fixture
  defines verdictIndicators (M04 only).

ASSESSMENT COMPETENCIES
  New criterion intelligence-verdicts (10 pts). Four indicators: 198.51.100.64 malicious (3),
  203.0.113.77 benign (3), 192.0.2.91 unknown (2), legacy-drop.example unknown (2).

PARTIAL-CREDIT MODEL
  Per indicator: points-1 for the right verdict, 1 for reasoning (>=25 chars, and for malicious/benign it
  must cite a case record or entity; for unknown it must say what is missing). Explicit verdict the
  records contradict: no credit for that indicator and a 2-point deduction. Unknown on a decidable
  indicator: no verdict credit, no deduction, reasoning credit kept if it cites the records. Any of
  several records/entities may be cited (events, report, accounts, change ticket). Exploration is not
  scored. Rubric v2 splits the existing 25-point intelligence competency: corroboration 15->10, IOC
  lifecycle 10->5, verdicts +10. Other six criteria, the 100 max, the 70 bar and the safety cap are unchanged.

INSTRUCTOR-REVIEW REQUIREMENTS
  Review card shows each indicator, the learner's verdict, the full reasoning (paragraphs preserved),
  whether it was supported/contradicted/left unknown, points earned/available, plus the criterion's
  awards, deductions and misses in the existing System rubric panel.

FILES TO MODIFY
  portal/soc-m04-assessment-data.js, -state.js, -actions.js, -rubric.js, -scorer.js,
  portal/soc-m04-intelligence-ui.js, portal/soc-console-tools.js (PACKS.m04),
  portal/soc-analyst-module-04.js (+ .css), portal/app.js (review card), portal/index.html (cache busters),
  tests/soc-m04-assessment-{actions,rubric,scorer}.test.js.

FILES TO CREATE
  tests/soc-m04-intel-verdicts.test.js
```

What shipped:

- **Practice It.** Threat Intelligence tab has an "Indicator verdicts" section (one card per indicator:
  verdict select + reasoning). Three new guide steps ("Judge the reported source", "Rule out a benign
  explanation", "Know when the answer is unknown") inserted before "Scope and decide". Per-indicator
  three-level progressive hints (Show a hint / Another hint), instant feedback after recording (good /
  close / wrong with a one-line why or nudge), and a debrief line. Guided restart clears verdicts and hints.
  The guided data is `MODULE_FOUR_GUIDED_FIXTURE` (GL4-I-301 malicious, GL4-C-401 benign, GL4-I-302 and
  GL4-I-303 unknown).
- **Prove It.** Same control, no hints, no feedback, no highlighting; one extra sentence in the brief.
  New `intelligence-verdicts` criterion, `rubricVersion` 2. State fields `assessment.intelVerdicts`
  (keyed by indicator id) and `assessment.intelHints`, both normalized and jsonb-reorder safe. New action
  type `intel_verdict` (deliberately not `ioc_edit`, which would have satisfied the IOC lifecycle criterion).
- **Backward compatibility.** The score is computed once, in the submit handler, and stored in
  `result`/`review_payload`; nothing recomputes it on load, so submitted/approved attempts keep their score
  and render (pre-verdict cards simply have no verdict panel). v1 rubric/criteria are kept
  (`extract(..., {rubricVersion:1})`, `score(..., {rubricVersion:1})`). Not-yet-submitted attempts are
  scored under v2 at submit.
- **Instructor review.** `review_payload.intelligenceVerdicts` + a "Student indicator verdicts and
  reasoning" panel in `adminAttemptReviewCard`.
- **Tests.** `tests/soc-m04-intel-verdicts.test.js` (data contract, recordVerdict, perfect / partial /
  equivalent-paths / exploration / unsupported-conclusion / weak-documentation / polished-but-wrong,
  versioning, jsonb key reorder, Practice vs Prove rendering, guide steps, console wiring, review card
  incl. a legacy v1 attempt). `soc-m04-assessment-actions` type list, and the rubric/scorer fixtures,
  updated for the new type/criterion.

Results: `node --test tests/` 90 tests, 86 pass, 4 fail; the 4 are the same pre-existing failures
(guided-lab-console-guide, soc-m04-assessment-rubric, soc-m04-assessment-scorer,
soc-m05-assessment-console). `bash bin/ci-check.sh` passes.

Caveats / for the owner:

- **Bug 5 (10-minute window) unchanged.** The M04 rubric and scorer tests still fail at the same
  assertions (query-rule-quality / 92 != 100). I added the verdict fixtures and updated the
  criterion-count assertions (8 -> 9, awards 8 -> 16) so they do not fail earlier because of this
  sprint; with the test state's `windowMinutes: 10` patched to 20 in a scratch copy both files pass in full.
- Weight rebalance (corroboration 15->10, lifecycle 10->5) is a judgment call: it keeps the intelligence
  competency at 25 and every other weight and the 70 bar unchanged. Say if you would rather draw the 10
  points from elsewhere.
- Verdict wording/values: 192.0.2.91 and the expired domain are both "unknown"; 203.0.113.77 (stale
  mail-client credential after CR-204) is the benign one. A learner who calls an indicator unknown when
  the case supports a verdict loses the verdict credit but no deduction.
- Inserting three guide steps shifts the saved `guideStep` of any learner already past step 4 by up to three.
- `SocM04AssessmentState.load()` still compares `JSON.stringify` only to decide whether to re-save a
  migration (pre-existing, harmless on reorder: it just saves once); left alone.
- No browser verification (Sprint 4): the Threat Intelligence tab render, hint button, and review card
  are covered by string-level tests only.
- Shared files other sprints may also touch: `portal/soc-console-tools.js` (PACKS.m04 only),
  `portal/index.html` cache-buster lines, `portal/app.js` (one new panel in `adminAttemptReviewCard`).
