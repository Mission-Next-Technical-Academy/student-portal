# Module progress integrity — sprint record

Purpose: make a completion badge mean that the learner has completed the
required material it summarizes. This sprint is limited to the reported
Module 01 mismatch; it does not redefine completion requirements for Modules
02–12.

## Definition of done

- [x] Audit the displayed Module 01 status, checklist, local state, and
  durable completion path.
- [x] Define one Module 01 completion rule: all nine lesson activities,
  a passed knowledge check, Lab 1 (including the guided console), and Lab 2.
- [x] Apply that rule to the module page and programme completion calculation.
- [x] Ensure a historical, coarse `module_progress` record cannot paint
  unfinished detailed work as complete.
- [x] Verify syntax, route rendering, and the completion predicates.

## Sprint log

### Sprint 1 — audit (closed 2026-09-10)

Found two independent causes. The shared `soc-01` predicate credited Lab 2
when only Lab 1 had passed, and the page used the Lab 1 flag as its hero
"Lab status". The resulting coarse durable record forced the progress shell
green while the checklist independently showed the unfinished local lessons.

### Sprint 2 — implementation (closed 2026-09-10)

The completion rule above will be used everywhere Module 01 makes a
completion claim. A pre-existing coarse record remains visible only as a
record requiring review; it is not proof of the detailed work on this device.

Verified with `node --check portal/app.js`, `node --check
portal/soc-analyst-module-01.js`, `node bin/portal-check.js` (all registered
module views and the programme overview), and `git diff --check`.

## Scope boundary

The database currently stores module-level completion and lab attempts, not
the nine lesson and knowledge-check results. This sprint therefore fails
closed for Module 01 when granular evidence is unavailable, instead of
claiming an unverifiable completion. Durable item-level evidence is a future
course-wide data-model project, not silently inferred here.
