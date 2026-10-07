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

- [ ] **Sprint 1 — M04 intelligence verdicts (gap A).** Guided + Assessment.
- [ ] **Sprint 2 — M09 workflow designer + recorded unsafe attempts (gaps B, C).** Guided + Assessment; shared designer reused by M12 with an inline `preserve>approval` example.
- [ ] **Sprint 3 — needs-investigation disposition (gap D).** M03 Guided + M11 Assessment.
- [ ] **Sprint 4 — traceability map + integration.** Build the traceability module and test above (covering all M12 mechanics, not just A–D). Merge, full test + browser sweeps (M01 and M03–M12), update `MODULE_TWELVE_ARC_CALLBACKS` in `soc-analyst-module-12.js` to cite the new practice, update `docs/workstreams/LIVE_COURSE_UAT_AND_GRADING_UX.md`, owner push.

## Sprint log

(each sprint appends here)
