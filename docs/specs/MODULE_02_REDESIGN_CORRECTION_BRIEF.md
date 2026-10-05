# Module 02 — Network & Identity Security Correction Brief

Status: planning only. No Module 1 changes are authorized or required.

## Finding

The current additive Module 2 environment does not yet meet the portal's
instructional or visual standard. Its separate right-hand `m02e-stage` panel
contains decision buttons, evidence checkboxes, hints, and feedback. This
makes Practice It appear as a quiz beside the simulated environment instead of
an analyst using the environment to reach a decision.

The existing left navigation is the single canonical Learn It → Practice It →
Prove It navigator. Module 2 must not render those phase labels, phase tabs, or
a second stage selector inside its content. Module 1 is the reference for the
shared shell, numbered scroll-based sections, and the rail's role; it must not
be modified.

## Required Module 2 experience

### 1. Use the standard module flow

Module 2 content must be organized as standard, numbered, scroll-targeted
sections inside the shared Module 1-style shell:

1. Learn It — short visual foundations and guided environment walkthrough.
2. Practice It — a full-width, same-environment case with progressive gates
   and context-sensitive hints.
3. Prove It — a full-width, same-environment security review with no guidance,
   no pre-submission feedback, and no visible completion/answer cue.
4. Sources & Further Reading — supplemental material in the standard detached
   reference location used by Module 1, not inside the lab interface.

The left rail scrolls to these sections. It does not toggle a hidden stateful
panel in place.

### 2. Learn It must teach through the console

Keep reading concise and visual. Use short numbered cards/sections to explain
why each view exists and what it tells an analyst:

- Network Map: source, destination, zones, and the security boundary.
- Access Activity: how an activity row connects a person, device, IP,
  resource, service, protocol, port, and result.
- Identity: authentication versus authorization; roles and MFA are identity
  context, not a decision by themselves.
- Device: managed/compliant state as access context.
- Resource and policy: what is protected, who is authorized, and required
  conditions.

The guided Alice example stays within the console. A small in-context callout
can direct the learner to click the highlighted object or table row, explain
what they have just opened, then advance to the next observation. It must not
be a separate question card.

A very short knowledge check may follow the visual Learn It sequence only for
facts that the console cannot demonstrate well (for example, protocol versus
transport/port, PKI certificate context, or Zero Trust terminology). It uses
the existing module knowledge-check styling, not a new interface.

### 3. Practice It must be operational, not quiz-shaped

The Practice section presents the same Network & Identity Security console as
the learner will use in Prove It. It starts on the relevant access event and
uses the console's existing identity, device, resource, policy, and activity
views.

Required behavior:

- A case brief appears above the console, not in a side quiz card.
- The learner investigates John Smith's attempted HR-FILE-01 access through
  the real console views.
- Completion gates are based on meaningful investigation actions, such as
  opening the identity and HR policy, before the decision artifact is enabled.
- The decision artifact is compact and job-shaped: decision, selected
  supporting evidence, and a short analyst rationale.
- Hints are progressive and contextual; they point to relevant views rather
  than reveal the answer.
- Incorrect feedback identifies the overlooked relationship: successful
  authentication does not establish authorization.

Do not show generic multiple-choice controls or a large checkbox quiz outside
the console.

### 4. Prove It must remove assistance, not change tools

Prove It is a new case in the same console. It must not display procedural
hints, glowing targets, gate counters, answer feedback before submission, or
completion indicators that reveal the correct determination.

The learner selects an activity from Access Activity, investigates connected
identity/device/resource/policy records, then submits a concise analyst
determination:

- selected event;
- Policy Violation decision;
- identity, device, resource, and policy evidence references;
- short professional analyst note.

The actual violation can be an incorrectly allowed event. A denied event is not
automatically malicious or incorrect. The learner must compare identity groups
to resource policy and access context.

## Layout and component changes

Module 2 should replace the current one-screen `m02e-lab` plus right-side
`m02e-stage` construction with standard scroll sections. The environment may
still use a contextual entity drawer within its own console, but it should be
full width within each activity section rather than compete with a separate
exercise pane.

Planned Module 2-only work:

- Update `portal/soc-analyst-module-02-environment.js` to render numbered
  Learn, Practice, Prove, and Sources sections with unique scroll IDs.
- Update `portal/soc-analyst-module-02-environment.css` to remove the
  side-by-side stage panel and retain only the enterprise console layout.
- Reuse `moduleSourcesBlock()` and the standard supplemental rail placement
  for further reading.
- Retain the existing Module 2 LabRuntime key, catalog lab key,
  `recordLabAttempt()`, `markModuleLabComplete()`, and verified-progress
  behavior.

Do not modify Module 1, portal routing, authentication, Supabase schema,
global navigation, or unrelated modules.

## Acceptance checks

- No visible duplicate Learn It, Practice It, or Prove It controls exist in
  Module 2 content.
- The shared left rail scrolls to numbered Module 2 sections as it does in
  Module 1.
- Further reading appears in the portal's standard reference location.
- Learn It is a concise visual walkthrough in the Network & Identity Security
  console, with optional small factual knowledge checks only.
- Practice It and Prove It use the same enterprise-style console and the same
  shared dataset.
- Practice has gates and progressive hints; Prove has neither assistance nor
  answer-revealing completion cues.
- Module 1 remains unchanged.
