---
paths:
  - "portal/*-module-*.js"
  - "portal/*-shared.js"
  - "portal/prove-it-gate.*"
  - "portal/lab-runtime.js"
  - "portal/app.js"
  - "portal/module-labs.*"
  - "portal/case-record.js"
  - "portal/*assessment*"
  - "portal/*scorer*"
  - "portal/admin-*"
  - "portal/admin-sheets/**"
  - "ui/coach*.js"
  - "ui/helpdesk*.js"
  - "supabase/migrations/*grad*"
  - "supabase/migrations/*prove*"
  - "supabase/migrations/*lab*"
---

# Grading and assessment rules

Updated 2026-11-14. Full rationale and examples: `docs/LAB_ASSESSMENT_STANDARD.md`.
Read that standard in full before a new or materially changed Prove It.

## Learning modes

- Every module runs Learn It → Practice It → Prove It → Instructor Review.
- Learn It teaches the interface and concept with guided, interactive help.
- Practice It gives decreasing support: hints, highlights, retries.
- Prove It is independent: no hints, glowing controls or forced click paths.
- Prove It never gives answer feedback before submission.
- Never expose a live score to the student during Prove It.

## Review and persistence

- Every Prove It submission creates a durable, instructor-reviewable record.
- Route every attempt through `recordLabAttempt()`; never reimplement its save logic.
- Await the save before showing "sent to faculty" or marking complete.
- On load, reconcile cached submit latches with the server's latest attempt.
- A below-pass Prove It enters review as `submitted`.
- Approving a below-pass attempt must never unlock the next module.
- Never build a module-specific workaround for a shared write bug.
- Inspect every `recordLabAttempt()` caller before changing shared submission logic.

## Student writing

- Persist every word a student writes during an assessment.
- Show it in a readable "Student Analyst Response" section, untruncated.
- Never hide student writing in raw JSON, logs, tooltips or tiny cells.

## Scoring

- Score competencies and evidence, not one click path or answer key.
- Give equal credit to different valid paths with equal evidence.
- Never penalize valid extra exploration.
- Give partial credit for secondary and supporting findings.
- An unsupported explicit conclusion may reduce that competency.
- Keep technical credit when writing is weak; polish alone earns only writing credit.
- Show each competency's earned and available points and why.
- Keep rubrics as data, separate from rendering; avoid long `if` chains.
- A defined critical error scores zero and returns the attempt.

## Answer keys

- Keep answer keys in `assessment_answer_keys`, loaded by hand, never in git.
- No API role may read or write answer keys.
- Keep `ui/helpdesk-data.js` and the Module 12 capstone key consistent.

## Done means

- Module 1 still renders, progresses, submits, persists and is reviewable.
- Existing student progress stays compatible.
- Tests cover the matrix in `.claude/rules/testing.md`.
