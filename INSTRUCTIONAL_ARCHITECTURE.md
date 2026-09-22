# Mission Next Technical Academy — SOC Analyst Instructional Architecture

**Status:** Program-wide pedagogy reference. Subordinate to `ROADMAP.md`,
which is the single starting document and wins on any conflict (see its
Source-of-truth order).

This document does **not** replace and does not re-litigate:

- `MODULE_STANDARD.md` — the module contract, field rules, and the
  12-module / 6-week / non-negotiables list. Canonical for all four tracks.
- `CURRICULUM_ALIGNMENT_ARCHITECTURE.md` — compliance-controlled hours,
  parent-code allocations, and the Learn/Practice/Prove lesson-record shape
  it already establishes (§1).
- `CURRICULUM_MAP.md` — the canonical module sequence and titles.
- Existing module keys, the existing simulator/grading architecture, or any
  shipped `MODULE_NN_ENHANCEMENT_BRIEF.md` / `MODULE_NN_ENHANCEMENT_PROGRESS.md`.

The existing 12-module SOC Analyst program remains authoritative. Do not
reorder modules, rename stable module keys, or change compliance-controlled
instructional minutes to make a module fit this document.

This architecture describes **how each module should teach**, not what
sequence or hours it uses. It exists to give consistency across modules that
were authored at different times, not to force a rebuild.

---

## 1. Instructional philosophy

`ROADMAP.md` locks the cycle every module moves through:

**Learn it → Practice it → Prove it.**

Implementation of any of these stages is governed by
`docs/LAB_ASSESSMENT_STANDARD.md`. In particular, Prove It must create a
durable instructor-reviewable record and assess explainable competencies with
partial credit for meaningful, valid findings—not a single click path or
answer key.

- **Learn it** — minimum instruction needed to understand the concept,
  workflow, or tool.
- **Practice it** — perform the skill with guidance, feedback, retries, and
  hints. Mistakes are expected and cheap here.
- **Prove it** — apply the skill with reduced guidance in a scenario that
  requires evidence, reasoning, and a documented decision, and that
  produces the durable, job-shaped artifact an instructor actually
  reviews: real simulator action logs and case records, not a parallel
  worksheet or a displayed score. This is what distinguishes Mission Next
  from a quiz-based course, and it is why Module 1's assessment is
  simulator-first (see `ROADMAP.md`'s Locked Module 1 sequence).

A module can present a reduced-guidance scenario without yet persisting
durable, instructor-reviewable evidence from it — that gap is exactly what
Roadmap item 3 (Module 1 SIEM performance assessment) and item 4 (module
completion integrity, modules 2–12) are closing. That's a maturity gap
within Prove It, not a missing fourth stage.

The objective everywhere is demonstrated capability, not content
consumption.

---

## 2. Build on what already exists

Do not rebuild functionality already present. Recent module work has
already introduced scenario-driven lesson loops, contextual knowledge
checks, retry feedback, applied free-text tasks, persisted learner work,
guided and independent lab surfaces, scenario-based quizzes, and — per
`soc-analyst-track-reimagining/REBUILD_PLAN.md` — a surfaced score
breakdown and a cross-module incident arc pattern (Arc C shipped; Arc A and
Arc B are designed, not built).

**Phase 1b of that rebuild is the standing counter-example to trust here:**
an audit claimed the score breakdown was "never shown to anyone," and a
first implementation attempt wired a new shared render helper into all 11
modules before discovering every module's student-facing panel already
rendered its own labeled score grid. The change was reverted before commit.
**Before adding a Learn/Practice/Prove component to any module, inspect the
actual rendered template in `portal/soc-analyst-module-NN.js`, not just a
score function's return shape or a prior audit's claim.**

Sequence for any enhancement:

1. Read `MODULE_STANDARD.md` and this document.
2. Read that module's `MODULE_NN_ENHANCEMENT_BRIEF.md` /
   `MODULE_NN_ENHANCEMENT_PROGRESS.md` if present.
3. Inspect the current implementation directly.
4. Inventory existing lesson loops, checks, applied tasks, guided labs,
   independent labs, assessments, persistence, and grading.
5. Map what exists to Learn / Practice / Prove.
6. Identify the genuine gap.
7. Reuse existing components; implement only what's missing.
8. Preserve stable module keys, learner state, and compliance-controlled
   minutes.
9. Run `bash bin/ci-check.sh` and the live/browser check appropriate to the
   change, per `ROADMAP.md`'s agent protocol.

Do not assume a feature is missing because this document describes it.
Inspect first.

---

## 3. Canonical module flow

The desired shape is alternating instruction and application, not a block
of lectures followed by one quiz and one lab:

```
LEARN  → concept / scenario intro / worked example
PRACTICE → micro-practice or knowledge check
LEARN  → next concept
PRACTICE → applied task or guided investigation
LEARN  → additional concept
PRACTICE → guided lab
PROVE  → independent lab / module assessment, producing a durable,
         instructor-reviewable action log or case record
```

Not every module needs the same activity count. The pattern should be
consistent even where content differs. A module is not required to add
activities merely to hit a round number — see the Definition of a Finished
Module in §7 below for what actually matters.

### Learn It

Concept, short theory, diagram, worked example, demonstration, or a
scenario introduction — the minimum instruction needed to attempt the
skill. Prefer *concept → immediate interaction* over long passive blocks
followed by interaction later.

### Practice It

Where the student develops the skill and is allowed to be wrong: micro-
practice (5–15 minutes — identify a port, a failed auth, an IOC, a DNS
request), applied free-text tasks, and guided labs with objectives, hints,
feedback, and retries. Practice is not assessment.

### Prove It

Demonstrates competency with reduced guidance. Not a repeat of the guided
lab with different values — the student determines more of the
investigative path: what evidence matters, which tools apply, what should
be correlated, and what the disposition, scope, and escalation should be.
Existing independent labs already meeting this bar are Prove It surfaces;
do not build a redundant second lab merely to satisfy the label.

Prove It should also produce the persisted, instructor-reviewable
evidence: simulator action logs, case records, evidence selections, and
documentation — never a live score display or a parallel worksheet that
substitutes for the actual work. This is the standard `ROADMAP.md` sets
for the Module 1 SIEM performance assessment and the module-completion-
integrity work queued behind it.

---

## 4. Evidence-based assessment

Where practical, Prove It should require more than selecting a
correct answer. The expected chain is:

**OBSERVE → INVESTIGATE → CORRELATE → DECIDE → DOCUMENT**

Possible artifacts: disposition, investigation notes, evidence selections,
a timeline, an IOC list, a scope statement, an escalation decision, case
notes, or an analyst handoff. Evaluate:

- **Technical accuracy** — did the student determine what happened?
- **Investigative reasoning** — did the evidence support the conclusion?
- **Analyst decision** — was the disposition/escalation appropriate?
- **Documentation** — could another analyst pick up the case from this?

---

## 5. Progressive reduction of guidance

Guidance decreases across the program. This is a design curve for module
authors, not a per-module checklist item.

| Modules | Mode | Students receive |
|---|---|---|
| 01–03 | Guided | Demonstrations, explicit instructions, hints, immediate feedback, retries, guided labs. Learning the environment and the discipline together. |
| 04–06 | Supported investigation | Objectives, not exact click paths or exact queries. The method is increasingly the student's to determine. |
| 07–09 | Analyst scenarios | The student determines relevant evidence, tools, pivots, correlation, disposition, and escalation. Earlier skills recur without being announced. |
| 10–11 | Mostly independent | Realistic cases with relevant and irrelevant evidence, multiple sources, incomplete information, and competing leads. The student constructs the investigation. |
| 12 | Independent synthesis | The learner receives the incident and determines the investigative path end to end. |

Scenario wording should evolve to match:

- Early: *"Review the authentication events and identify whether the login
  succeeded."*
- Mid: *"Investigate the suspicious authentication activity."*
- Later: *"An alert has been generated for this account. Determine what
  occurred."*
- Advanced: *"Investigate the incident, determine scope, and document your
  findings."*
- Capstone: *"You are the analyst assigned to this incident."*

Students move from following procedures to selecting procedures.

---

## 6. Repetition and skill carryover

Core skills should recur after introduction rather than staying isolated in
one module. This is a real-content check when reviewing an existing module,
not new infrastructure:

| Skill | Introduced | Recurs |
|---|---|---|
| Triage | M01 | M03, M04, M05, M07, M09, M12 |
| Networking | M02 | M03, M04, M05, M06, M07, M09, M12 |
| SIEM / log analysis | M03 | Every later investigation module |
| Documentation | Early | Progressively more weighted; assessed professional competency by M10–M12 |
| Evidence correlation | Early (simple relationships) | Multi-source, timeline-based by later modules |

`soc-analyst-track-reimagining/REBUILD_PLAN.md`'s cross-module arcs (Arc C
shipped, Arc A and Arc B designed) are the concrete mechanism for this at
the content level — a handful of connected incidents across modules, not a
requirement that every module invent its own standalone case.

---

## 7. Definition of a finished module

A module is not instructionally complete merely because text, a video, a
quiz, and a lab all exist. Before calling a module done, answer each of
these; any "no" is the actual gap to close — not a reason to add more
content elsewhere:

- **Learn** — Does the student receive enough instruction to understand the
  skill before being asked to apply it?
- **Practice** — Does the student perform the skill with guidance and
  feedback, with room to be wrong?
- **Prove** — Does the student demonstrate the skill with meaningfully
  reduced guidance, not a restated guided lab, and does that produce
  durable, instructor-reviewable evidence rather than a live score or a
  parallel worksheet?
- **Carry forward** — Will this skill reasonably reappear later, per §6?
- **Assess** — Does the assessment actually measure the module's stated
  objectives (`MODULE_STANDARD.md`'s `objectives[]`, measurable verbs)?
- **Document** — Where appropriate, does the learner explain or document
  their reasoning, not just select an answer?

---

## 8. Platform and compliance guardrails

These are restatements of existing, already-binding rules — not new ones:

- 12 modules, 6 weeks, 2 per week. No SOC-specific exception. No Module 00
  — LMS/simulator orientation belongs at the start of Module 01
  (`MODULE_STANDARD.md` §1, `ROADMAP.md`'s Locked Module 1 sequence).
- Do not rename a module `key` or reorder modules — this orphans student
  progress rows (`MODULE_STANDARD.md` §2).
- Do not change compliance-controlled instructional minutes or parent-code
  hour allocations to fit a new activity
  (`CURRICULUM_ALIGNMENT_ARCHITECTURE.md`). If an activity genuinely
  cannot fit the existing allocation, flag it for curriculum/compliance
  review rather than silently changing totals.
- If the module schema itself cannot express a needed learning experience,
  that is a platform ticket against `MODULE_STANDARD.md` — the schema
  changes for all four tracks or not at all, never a SOC-only exception.
- No certification endorsement, partnership, or pass-guarantee language.

---

## 9. Desired graduate outcome

Not: *"I completed cybersecurity training."*

Instead: *"I have triaged alerts, searched and correlated security logs,
investigated endpoint and network activity, analyzed indicators, performed
threat hunting, evaluated vulnerabilities, supported incident response,
handled evidence, documented investigations, communicated findings, and
completed an end-to-end SOC investigation."*

The difference is demonstrated capability, evidenced by the durable Prove
It artifacts described above — not a completion percentage.
