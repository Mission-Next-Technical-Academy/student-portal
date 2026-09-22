# Mission Next Technical Academy — Lab & Assessment Architecture Standard

**Status:** Required repository standard  
**Applies to:** All current and future interactive learning modules  
**Reference implementation:** SOC Analyst Module 1  
**Audience:** Developers, coding agents, curriculum designers, and instructors

## Required reading and implementation order

Before modifying a student lab, Learn It, Practice It, Prove It, simulator,
assessment/scoring behavior, instructor workflow, or admin assessment UI,
read this document first. Then inspect, in order:

1. This standard.
2. `ROADMAP.md` and the active module specification.
3. Module 1's current implementation and assessment flow.
4. The target module's curriculum/content and current implementation.
5. Relevant shared components, persistence code, schema/migrations, and
   instructor/admin review views.

Module 1 is the behavioral and Academy-shell reference. Reuse, compose, and
parameterize its established patterns where practical; do not copy/paste it or
perform a broad refactor merely for theoretical reuse.

Before a material implementation, report:

```text
REFERENCE COMPONENTS FROM MODULE 1
REUSABLE COMPONENTS
TARGET MODULE DIFFERENCES
ASSESSMENT COMPETENCIES
PARTIAL-CREDIT MODEL
INSTRUCTOR-REVIEW REQUIREMENTS
FILES TO MODIFY
FILES TO CREATE
```

## Academy experience: one shell, different tools

Every module follows the same learning progression:

```text
LEARN IT → PRACTICE IT → PROVE IT → INSTRUCTOR REVIEW
```

These are different learning modes, not interchangeable quiz containers.

The Academy layer remains consistent across modules: module navigation,
progression, instructions, Learn/Practice/Prove structure, submission,
feedback, progress/status, and assessment workflow. The simulator layer is
module-specific: a SOC console, network and identity tool, SIEM, EDR, packet
analyzer, or case-management tool may legitimately have different internal
views and controls.

Conceptually, every interactive module has a consistent Academy shell:

```text
MODULE / LESSON CONTEXT
────────────────────────────────────────
LAB WORKSPACE
  module-specific simulator
────────────────────────────────────────
Mission / Evidence / Notes / Guidance / Submission
```

Use Module 1's current layout components, spacing, containers, navigation,
embedding pattern, progress persistence, and review flow where practical.
Do not introduce a visually unrelated module shell, a duplicate Learn/Practice/
Prove navigator, or a second phase rail inside a simulator. Simulator-local
controls are appropriate only for working with that simulator's data.

## Learning-mode requirements

### Learn It

Learn It teaches the interface and concept: what the learner is looking at and
how an analyst uses it. Prefer concise, interactive explanations over text
walls. Appropriate support includes highlighted controls, guided walkthroughs,
demonstrations, contextual callouts, suggested actions, and examples.

### Practice It

Practice It requires the learner to perform the task with decreasing support.
Appropriate support includes contextual/progressive hints, highlighted areas,
retries, incomplete workflows, partial query assistance, and
evidence-selection assistance. It should answer: *Can I do this with some
help?*

### Prove It

Prove It is an independent assessment. The learner receives a scenario,
objective, available tools, and available evidence, then makes their own
investigation, evidence, action, conclusion, and documentation decisions.

Do not provide procedural guidance, glowing correct controls,
answer-revealing hints, forced click paths, pre-submission answer feedback, or
completion cues that reveal the correct conclusion. Prove It should answer:
*Can I independently perform this competency?*

## Instructor review is mandatory

Every Prove It submission **must** create a durable, reviewable record. An
automated score is a recommendation; it never replaces instructor review.
Prove It must not disappear into a local pass/fail result.

The instructor/admin must be able to inspect, at minimum:

- student, module, assessment, attempt, and timestamps;
- meaningful simulator actions (not over-instrumented navigation);
- selected evidence, explicit determinations, and selected actions;
- all student-written responses;
- automated competency scores, score explanation, and calculated score;
- review status, instructor feedback, and permitted score adjustment.

Use existing project terminology/status fields where equivalent. Otherwise a
review lifecycle should express the equivalent of:

```text
NOT SUBMITTED → SUBMITTED / NEEDS REVIEW → REVIEWED or RETURNED
```

## Student writing is first-class assessment data

Any words entered during an assessment—analyst notes, incident summaries,
reasoning, evidence justification, escalation/handoff notes, remediation
recommendations, or management summaries—must be persisted and immediately
readable to the instructor.

The default review view must display a prominent **Student Analyst Response**
section at a readable width and font size, preserving paragraphs and useful
line breaks. It must not hide the response in raw JSON, an event log, tiny
table cells, a tooltip, or a collapsed debugging object. Do not truncate it by
default; an instructor may intentionally collapse a long response, but should
not have to expand it merely to read the student's work.

## Assessment philosophy: assess competencies and evidence

Security work has multiple valid investigative paths and often several
partially correct but meaningful findings. Do not model Prove It as one answer
key or award competency for a specific click sequence.

Score what the learner discovered, determined, did, and documented—not whether
they exactly reproduced the scenario author's route.

Distinguish these actions:

```text
EXPLORATION       opened or viewed an entity
SELECTION         marked evidence as relevant
DETERMINATION     explicitly classified or identified something
ACTION            performed or recommended a response
DOCUMENTATION     explained the reasoning
```

Exploration alone is not a correct finding. Valid additional exploration must
not lower a score. An explicit unsupported conclusion may reduce the relevant
competency.

### Partial credit is required

Assessments must recognize meaningful secondary findings, supporting evidence,
appropriate actions, valid reasoning, and defensible documentation. A learner
who identifies an affected secondary endpoint but misses the initial source has
demonstrated partial scope/investigation competency—not zero competency.

Support levels such as `PRIMARY`, `SECONDARY`, `SUPPORTING`, `IRRELEVANT`, and
`CONTRADICTORY` where helpful. Secondary and supporting evidence receive
appropriate credit without being confused with the primary finding.

Different valid investigation sequences that produce equivalent evidence and
determinations must receive equivalent competency credit. A passing score may
come from different competency combinations, except explicitly defined
critical/minimum competencies.

### Competency-based scoring

Use competencies rather than only “questions correct / questions total.” A
scenario may score dimensions such as investigation, scope determination,
evidence correlation, technical analysis, response, escalation, and
documentation. Each result should be explainable:

```text
Competency: Scope Determination
Earned: 15 / 25
Evidence:
- identified a genuine affected endpoint
- identified an affected server
- did not identify the initial source
```

An automated score must show both the total and why it was earned, for example
each competency's earned/available points and evidence contributions. Strong
technical work with weak writing should preserve technical credit while
reducing documentation credit; polished unsupported writing should receive
communication credit only, not technical credit.

### Data-driven rubric requirement

Keep assessment definitions/rubrics separate from rendering where practical.
Avoid large hardcoded `if A && B && !C` chains. Scenario-defined rules should
identify competencies, possible findings/evidence/actions, partial-credit
relationships, critical errors where applicable, maximum points, passing and
critical-competency criteria, and instructor-review requirements.

The conceptual persisted result includes:

```text
AssessmentSubmission
  student / module / assessment / attempt
  startedAt / submittedAt
  studentResponses
  selectedEvidence
  studentDeterminations
  studentActions
  competencyResults
  automatedScore
  instructorReviewStatus / instructorScore / instructorFeedback / finalScore
```

Follow repository and database conventions rather than mechanically adding
these exact names.

Appropriate structured assessment events may include:

```text
VIEWED_ENTITY
SELECTED_EVIDENCE
CLASSIFIED_ENTITY
IDENTIFIED_SOURCE
IDENTIFIED_AFFECTED_ASSET
IDENTIFIED_INDICATOR
SELECTED_RESPONSE
REQUESTED_ESCALATION
SUBMITTED_ANALYST_NOTE
SUBMITTED_ASSESSMENT
```

Record enough to assess competency, not every ordinary navigation action.

## Instructor-review presentation standard

The review screen should make the following clear without requiring raw-data
inspection:

1. Module/assessment, student, attempt, timestamp, automated score, and
   review status.
2. Competency breakdown with earned/available points or percentages.
3. Student findings, selected evidence, determinations, and actions.
4. The full readable Student Analyst Response.
5. Automated scoring explanation: positive evidence and material misses.
6. Instructor feedback and any permitted score adjustment, with a save action.

Raw JSON may remain available for debugging, but it must be secondary to the
human-readable review artifact.

## Required assessment tests

Every new or materially changed Prove It assessment must cover:

- a perfect investigation (near/full credit);
- a partial investigation with legitimate secondary evidence (meaningful
  partial credit);
- different valid investigation paths (equivalent credit for equivalent
  competency evidence);
- excessive exploration with correct determinations (no exploration penalty);
- an explicit unsupported conclusion (relevant competency reduction);
- strong technical analysis with weak documentation;
- weak analysis with polished writing; and
- instructor review showing findings, actions, score explanation,
  competency breakdown, and full student response.

Before completing work, also verify that Module 1 still renders, progresses,
submits, persists, and is reviewable; existing student progress remains
compatible; and unrelated modules continue to function.

## Definition of done

No Prove It implementation is complete until all are true:

- Module 1 conventions were reviewed and the Academy shell is consistent.
- The simulator's internal UI is appropriately module-specific.
- Submission persists and enters instructor review.
- The full student response is cleanly readable by the instructor.
- Competencies and partial-credit relationships are explicit.
- Multiple valid investigation paths and secondary correct findings receive
  appropriate credit.
- Exploration is distinguished from conclusions.
- Automated scoring is explainable and visible with its breakdown.
- Instructors can review findings/actions, provide feedback, and make any
  permitted adjustment.
- Relevant automated tests cover partial-credit and review scenarios.
- Repository guidance points future agents to this standard.

## Core rule

The platform is assessing what a learner can actually do, not whether they
memorized one expected answer. It must be able to say both: “you demonstrated
meaningful skill here” and “you missed an important part of the investigation.”
