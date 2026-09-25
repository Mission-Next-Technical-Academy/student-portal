# Case Record migration — Modules 02–12 (2026-09-25)

Goal: every SOC module's graded Prove It submission becomes the standard
Incident / Case Record (docs/specs/MODULE_STANDARD.md §7.2), rendered by
`portal/case-record.js`, looking exactly like Module 01's NST-2407 ticket.
"Everything we do is an incident ticket dashboard."

Also required: docs/LAB_ASSESSMENT_STANDARD.md (partial credit, instructor
review, student writing readable, required assessment tests).

## Per-module recipe

1. Find the module's graded Prove It form (the one that calls
   `recordLabAttempt()` for the module's catalog lab key). Quizzes / knowledge
   checks are **not** in scope. Practice It / guided notes are not in scope.
2. Author the case from the module's existing Prove It scenario (or, for
   imported-lab modules, the imported lab's scenario under
   `portal/imported-labs/mission-next-labs/src/data/labs/`):
   - case id (`<3 letters>-<4 digits>`, unique per module, e.g. `EDR-5102`)
   - `userOptions` / `deviceOptions`: 6–8 entries each — the confirmed
     entity, 1–2 plausible pivots, the rest noise, shuffled (see Module 01
     `entityRoster` in `portal/soc-analyst-module-01.js` / `data.js`)
   - `departmentOptions` with a `fit` 0–100 each (Module 01 pattern)
   - answer key: status, severity, affectedUser, affectedDevice,
     disposition, escalation, escalateTo — kept in module data, never shown
     live in Prove It
   - keep any existing domain-graded decisions as `findings`
     (`[{ name, label, options }]`) or `findingsHtml` inside the ticket.
     Do not drop graded content; move it into the ticket.
3. Render the ticket with `caseRecordPane(state.caseRecord, spec)` (or the
   lower-level `caseRecordFields/Actions/Panel`) inside the module's existing
   Prove It panel, replacing the old form. Keep the module's
   evidence / imported-lab launch area above or beside it.
4. Wire `change`/`input` events through `caseRecordApply(state, name, value)`;
   Save persists; Submit Case: if `caseRecordMissing()` non-empty → set a
   show-missing flag and re-render (panel turns orange); else mark submitted,
   compute the module's score, and call `recordLabAttempt()` with the same
   catalog key as before. Payload shape (Module 01):
   `{ state: 'complete', score, result: { breakdown, feedback,
   critical_errors, case_record: state.caseRecord, case_display:
   caseRecordDisplay(state.caseRecord, spec), case_summary:
   caseRecordSummary(state.caseRecord, spec) } }` — `case_record.notes` is
   what the instructor view shows as the student response and `case_display`
   gives it every ticket row with labels (findings included) — keep any keys the module
   already sends so the instructor Grading tab still reads them.
5. Scoring: Module 01 weights are the model (entity tiers 20, severity 15,
   disposition 20, escalation/routing up to 35, notes 10); fold existing
   domain findings into the total proportionally. Keep the module's pass
   threshold and catalog keys unchanged.
6. Backward compatibility: a student whose old-form attempt is already
   submitted / under review / graded must still see "Lab Under Review" /
   "Lab Graded" — do not reset or re-open their work. Old saved state must
   not crash the render (default `caseRecord` to `{}`).
7. Redo: show instructor redo feedback in the panel via `redoHtml`, as
   Module 01 does (`moduleOneProveItRedoFeedback`).
8. Do not edit shared files (`case-record.js`, `console-guide.js`,
   `module-labs.css`, `index.html`, `data.js`, `app.js`, `lab-runtime.js`).
   Put scenario data in the module's own file. Do not restyle `.m01-ticket-*`.
9. Verify: `node --check` the file, `node bin/portal-check.js <n>`, and a
   render of the Prove It panel in empty / partial / show-missing /
   submitted states (see Module 01 approach). Do not commit.
