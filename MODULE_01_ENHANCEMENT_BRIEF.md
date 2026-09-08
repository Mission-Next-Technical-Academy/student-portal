# Module 01 enhancement brief

## Purpose

Make the learner-facing **SOC Operations Foundations** experience credibly
match its published eight-hour (480-minute) duration. The current catalogue
allocates 300 minutes to theory and 180 minutes to two labs, but the visible
experience is currently much shorter: concise expandable explanations, a
10-minute labelled walkthrough, and a handoff exercise.

## Learning work to add

Turn each of the nine existing curriculum blocks into a complete learning
activity, rather than an overview card. Each should include:

- a clear explanation in beginner-friendly language;
- a worked example drawn from the fictional Mission Next Labs environment;
- a three-to-five-question knowledge check with feedback; and
- a short applied task that requires the learner to use the idea.

Prioritize fuller activities for these topics:

1. CIA and what cybersecurity protects;
2. analyst roles, decision boundaries, and escalation;
3. event, alert, and incident distinctions;
4. identity, endpoint, network, application, and cloud signal sources;
5. the triage loop;
6. severity, priority, and escalation;
7. the incident-response lifecycle; and
8. evidence-based documentation and handoff.

## Lab design

Keep the existing two-lab, 180-minute allocation, but make the learner work
and evidence distinct.

### Lab 1 — Guided alert investigation (120 minutes)

- Use a guided multi-source alert investigation: alert details, authentication
  records, endpoint or network context, and user confirmation.
- Require evidence checkpoints and an investigation timeline.
- Require a learner disposition, priority, and rationale.
- Save a scored result and show coaching for missed reasoning.

### Lab 2 — Independent escalation and handoff (60 minutes)

- Use a fresh incident rather than reusing Lab 1's exact decision path.
- Ask the learner to identify the affected entity, likely scope, priority, and
  appropriate escalation boundary.
- Require a structured handoff note with observations, analysis, scope, and
  requested next action.
- Evaluate against a visible rubric and retain the submitted evidence.

## Completion and assessment

- Show all nine lessons and both labs in a module progress checklist.
- Display the planned duration for every lesson, lab, and assessment so the
  total is understandable to learners.
- Add a 30–45 minute module assessment combining event/alert/incident
  classification, triage choices, and case-note quality. Its time must be
  accounted for inside the existing 480 minutes, not added on top.
- Do not mark the module complete solely because its page was opened or a
  walkthrough link was launched.

## Program overview UX

The primary action must be visible without expanding the module card.

- Place **Start Module**, **Continue Module**, or **Review Module** alongside
  the title and completion status on the collapsed card.
- Keep the chevron as a secondary **View curriculum blocks and labs** control.
- After completion, use **Review Module** as the primary action; while active,
  use **Continue Module**.
- Preserve the expanded panel for detail, but do not make expansion a
  prerequisite for entering a module.

## Acceptance criteria

1. The displayed Module 1 activities account for exactly 480 instructional
   minutes: 300 theory and 180 lab, including embedded assessment time.
2. Learners can see a duration and completion state for every required block.
3. The two labs have separate tasks, evidence, and completion records.
4. The module action is available on a collapsed program-overview card.
5. The arrow expands and collapses details only; it is not needed to start,
   continue, or review the module.
