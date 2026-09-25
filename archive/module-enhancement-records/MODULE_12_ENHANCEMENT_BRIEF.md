# Module 12 enhancement brief — Sprint 13

## Scope

Add the narrative-continuity layer for **Operation Amber Finch** without
changing the existing independent capstone behavior, locked minutes, or
certification language. Read the M09 evidence contract and the M02–M11
progress records as continuity inputs.

## Decision: integrated rubric plus visible tracker

The implementation has one authoritative integrated assessment: ten scored
domains, one submission, and the existing safety gate. The architecture/map
wording also describes a twelve-stage investigation state. The least-risk
resolution is to expose the existing twelve mission requirements as a visible
12-stage progress tracker while retaining the integrated rubric underneath.
Stages are learner-facing progress cues and callbacks, not new scored domains,
new persistence contracts, labs, or instructional minutes.

## Narrative contract

Amber Finch is a composite capstone. Module 09's Operation Cedar Lock remains
the rehearsal case for response discipline; Modules 10 and 11 consume its
bounded evidence slices for custody and reporting. Module 12 explicitly calls
back to those handoffs and to the earlier M02 identity, M03 SIEM, M04
detection, M05 endpoint, M06 hunting, M07 network/email, and M08
prioritization decisions. It does not claim that Amber Finch is the same
incident as Cedar Lock or import undeclared evidence.

## Acceptance criteria

- [x] Preserve the ten-domain rubric, scoring, critical-error checks, and
  existing `lab-capstone` completion behavior.
- [x] Render all twelve mission requirements as a visible progress tracker
  with reviewed/open state and a concise prior-module callback.
- [x] Explain the integrated-rubric versus tracker decision in the student
  surface and sprint records.
- [x] Preserve Module 12's existing instructional allocation and all
  non-endorsement/non-pass-guarantee guardrails.

