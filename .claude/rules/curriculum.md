---
paths:
  - "portal/data.js"
  - "portal/module-registry.js"
  - "portal/*-module-*.js"
  - "portal/learn-it-*"
  - "ui/*-data.js"
  - "bin/*curriculum-check.js"
---

# Curriculum and course data

Updated 2026-11-14. Contract: `docs/specs/MODULE_STANDARD.md`.
SOC mapping: `docs/specs/CURRICULUM_ALIGNMENT_ARCHITECTURE.md`. Pedagogy: `docs/specs/INSTRUCTIONAL_ARCHITECTURE.md`.

## Structure

- Every program has 12 modules over 6 weeks, 2 per week.
- Never add a Module 00. Orientation belongs at the start of Module 1.
- Module 12 is a capstone with a portfolio-grade deliverable.
- Every module has at least one hands-on exercise.
- Write objectives with measurable verbs.
- Change the module schema for all programs or not at all.

## Compliance-controlled values

- Never change instructional minutes or parent-code hours to fit an activity.
- If an activity cannot fit, flag it for curriculum and compliance review.
- Help Desk technical minutes total exactly 3,600; `bin/its-curriculum-check.js` enforces it.
- SOC totals are enforced by `bin/curriculum-check.js`.
- Write "Windows Server" with no year on every Help Desk surface.

## Content rules

- Map every new learning feature to a job competency or a direct owner request.
- Keep every scenario, user, host and indicator obviously fictional.
- Never write certification endorsement, partnership or pass-guarantee language.
- Help Desk: keep `ui/helpdesk-data.js` and the capstone key in `portal/it-support-module-12.js` consistent.
