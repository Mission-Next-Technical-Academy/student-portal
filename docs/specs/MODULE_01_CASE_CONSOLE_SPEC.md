# SOC Analyst Module 01 Lab — Realistic Case Handling Specification

**Status:** Owner specification, captured 2026-09-21. Authoritative for
Module 01's Practice It / Prove It lab design — supersedes any conflicting
assumption elsewhere in this repo about Module 01 launching into the full
SOC range. Not yet built. See `docs/handoffs/HANDOFF.md`'s 2026-09-21 entries for what
was attempted before this spec landed and needs reconciling against it.

## Purpose

This specification defines the learner experience for the Module 01
hands-on lab.

Module 01 should not launch the full SOC range.

The full integrated SOC environment is intentionally too dense for a
brand-new learner with little or no cybersecurity experience.

Module 01 instead uses a focused, realistic case-handling workspace that
introduces the learner to the basic SOC workflow:

Queue → Logs/Evidence → Incident Record → Decision → Documentation

The goal is for the learner to finish Module 01 feeling:

"I worked my first SOC case."

The learner should not feel like they completed a quiz disguised as a lab.

## 1. Core Design Principle

The lab should feel like a real working environment, not a training card.

The learner should operate a small SOC case console with realistic
controls and realistic evidence.

Assessment should happen primarily by evaluating what the learner actually
did in the environment.

Avoid detached questions such as:

- "What severity should this be?"
- "Which user was affected?"
- "Should this be escalated?"
- "What happened?"

when those answers naturally belong inside the case record itself.

Instead, the learner should update the actual simulated incident record.

The finished incident record becomes the primary work product.

## 2. Module 01 Interface

Module 01 should launch into its own focused workspace.

It should not remain embedded as a small card inside the LMS.

The LMS may contain the launch control, but once opened, the learner
should feel that they have entered a work application.

Use a three-pane layout:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ SECURITY OPERATIONS — CASE CONSOLE                                          │
├─────────────────┬─────────────────────────────────┬──────────────────────────┤
│ ALERT QUEUE     │ LOGS / ALERT DETAILS            │ INCIDENT / CASE RECORD   │
│                 │                                 │                          │
│ Assigned        │ Alert summary                   │ Status                   │
│ In Progress     │ User / Device                   │ Severity                 │
│ Closed          │ Event timeline                  │ Affected Entities        │
│                 │ Log table                       │ Disposition              │
│                 │ Expandable raw records          │ Escalation               │
│                 │ Supporting evidence             │ Assignment               │
│                 │                                 │ Work Notes               │
│                 │                                 │ Resolution / Handoff     │
└─────────────────┴─────────────────────────────────┴──────────────────────────┘
```

The interface should be original and vendor-neutral, but it may use
interaction patterns common to enterprise ITSM/SOC products.

The visual goal is not to clone ServiceNow, Sentinel, Splunk, or another
product.

The goal is to expose the student to a believable case-management
workflow.

## 3. What the Learner Sees

### Alert Queue

The left pane should contain a small realistic queue.

For Module 01, keep the queue intentionally limited.

Examples:

- Suspicious Login
- Repeated Failed Authentication
- Unusual Remote Access
- Potential Account Misuse

The learner should not need to manage dozens of cases.

The queue exists to teach:

- assigned work;
- status;
- ownership;
- priority;
- moving from alert to case.

### Logs / Evidence Pane

The middle pane should contain the evidence needed to work the case.

This is where Module 01 begins building log literacy.

Do not reduce the evidence to decorative cards containing the answer.

Use realistic event data presented as:

- tables;
- event rows;
- timestamps;
- source/destination fields;
- username;
- hostname/device;
- action/result;
- authentication method;
- IP address;
- event type;
- source system.

The learner is not expected to write queries yet.

Querying belongs later in the program.

For Module 01, the student should learn to read the data that is already
in front of them.

Example:

```text
TIME                 EVENT TYPE        USER       DEVICE    SOURCE IP      RESULT
---------------------------------------------------------------------------------
09:41:13             LoginAttempt      a.chen     LAP-442   10.24.18.77    Failed
09:41:29             LoginAttempt      a.chen     LAP-442   10.24.18.77    Failed
09:42:01             MFAChallenge      a.chen     LAP-442   10.24.18.77    Success
09:42:04             LoginSuccess      a.chen     LAP-442   10.24.18.77    Success
09:44:18             ResourceAccess    a.chen     LAP-442   10.24.18.77    Success
```

Rows should be clickable.

Opening a row may display a more raw/structured record.

Example:

```text
timestamp=2026-09-21T09:42:04Z
event_type=authentication
user=a.chen
device=LAP-442
source_ip=10.24.18.77
auth_method=mfa
result=success
session_id=7fc2a441
```

This begins preparing students for later SIEM and command-line log work
without requiring queries in Module 01.

## 4. Incident / Case Record

The right pane should behave like a normal workplace ticket.

Avoid long multiple-choice-style radio groups.

Use realistic controls.

Example:

```text
CASE NST-2407

Status
[ In Progress ▼ ]

Severity
[ Medium ▼ ]

Affected User
[ a.chen ]

Affected Device
[ LAP-442 ]

Disposition
[ Suspicious Activity ▼ ]

Escalation
[ Required ▼ ]

Escalate To
[ Tier 2 SOC ▼ ]

Evidence
[ + Attach Evidence ]

Work Notes
┌──────────────────────────────────────────────────────┐
│                                                      │
│                                                      │
└──────────────────────────────────────────────────────┘

Resolution / Handoff
┌──────────────────────────────────────────────────────┐
│                                                      │
└──────────────────────────────────────────────────────┘

[ Save ]                               [ Submit Case ]
```

Fields should exist because the job requires them.

Do not add separate LMS fields asking the learner to repeat information
already entered in the case.

## 5. Learn It

Module 01 Learn It should be concise.

The learner needs enough instruction to understand:

- what a SOC is;
- what an alert is;
- what an incident/case is;
- what evidence is;
- what severity means;
- what disposition means;
- when escalation may be required;
- why analyst notes matter;
- the basic triage loop.

Use:

READ → VERIFY → SCOPE → DECIDE → DOCUMENT

The learner should move into Practice It relatively quickly.

The objective is not to front-load large amounts of text.

## 6. Practice It

Practice It teaches the workflow through the actual environment.

Use the same type of case console that will later be used for Prove It.

Do not make Practice It a detached fill-in-the-blank exercise.

The learner should actually operate the system.

Guidance should be contextual and inline.

Example:

**Step 1 — Read the Alert**

Small coachmark:

> Review the alert summary first. Identify who or what generated the
> activity before changing the case.

The learner opens the alert.

**Step 2 — Review the Evidence**

Coachmark:

> Open the related events and determine whether the alert is supported by
> the available evidence.

The learner clicks the log rows.

**Step 3 — Determine Scope**

Coachmark:

> Identify the user and device involved. Add only the entities supported
> by the evidence.

The learner updates the case.

**Step 4 — Decide**

Coachmark:

> Set the severity and disposition based on what you can support from the
> evidence.

The learner uses normal ticket controls.

**Step 5 — Document**

Coachmark:

> Write a short work note that another analyst could understand without
> repeating your investigation.

The learner writes the note.

**Step 6 — Escalate or Close**

Coachmark:

> Decide whether this case requires escalation or can be resolved at your
> level.

The learner changes the case state.

## 7. Practice Feedback

Practice It is coached and retry-friendly.

The learner should be able to make mistakes.

Feedback should explain the operational reason.

Bad feedback:

> Incorrect. Try again.

Better feedback:

> You marked the case Critical, but the current evidence shows one
> affected account and no confirmed impact. Recheck the scope before
> assigning severity.

Another example:

> Your note identifies the suspicious login, but it does not identify the
> affected device. A Tier 2 analyst receiving this case would need that
> information.

The system should teach through the work product.

## 8. Prove It

Prove It should use a fresh case.

Do not reuse the Practice case.

Guidance should be substantially reduced.

Example opening instruction:

> An alert has been assigned to you. Investigate the available evidence,
> determine the appropriate disposition, and complete the case record.

That should be close to the full instruction.

The learner should determine:

- which evidence matters;
- which logs to inspect;
- the affected identity/device;
- severity;
- disposition;
- whether escalation is required;
- what must be documented for the next analyst.

Do not expose advanced tools that have not yet been taught.

Module 01 is not intended to test:

- SIEM query construction;
- packet analysis;
- EDR process-tree investigation;
- threat hunting;
- IDS/IPS tuning;
- vulnerability prioritization.

Those belong in later modules.

## 9. Prove It Case Example

Example case:

**NST-2407**

User: `a.chen`
Device: `LAP-442`

The evidence set should contain enough information to reach a supportable
decision, but it should not state the answer explicitly.

The learner should have to read the event sequence.

Possible evidence:

- failed authentication events;
- successful MFA;
- successful sign-in;
- device context;
- source IP;
- recent activity;
- one or more contextual records.

The case should require judgment but remain appropriate for Module 01.

## 10. What the System Records

The system should record meaningful analyst actions.

Do not record every mouse movement.

Useful actions include:

- opened assigned alert;
- opened log/evidence record;
- viewed affected user;
- viewed affected device;
- changed case status;
- changed severity;
- changed disposition;
- attached evidence;
- selected escalation;
- assigned/escalated case;
- added work note;
- added handoff/resolution note;
- saved case;
- submitted case.

This action history helps distinguish "guessed the right answer" from
"performed a reasonable investigation."

## 11. What the Instructor Grades

The primary graded artifact is the completed case record, supported by
the student's meaningful activity history.

The instructor should be able to answer:

- **Technical Accuracy** — Did the learner interpret the event sequence
  correctly?
- **Evidence Use** — Did the learner inspect and reference the evidence
  needed to support the conclusion?
- **Scope** — Did the learner correctly identify the affected user/device?
- **Severity** — Was severity reasonable for the demonstrated scope and
  impact?
- **Disposition** — Was the final disposition supported by the evidence?
- **Escalation** — Did the learner escalate when appropriate, and avoid
  unnecessary escalation when it was not?
- **Documentation** — Could another analyst pick up this case and
  understand what happened, what was checked, what was found, and what
  still needs to happen?

## 12. Grading Philosophy

The assessment should not primarily grade detached input fields.

It should grade the work product.

For example: if the learner correctly selects "Medium" but provides no
evidence and writes an unusable note, the case should not receive full
credit. If the learner's final conclusion is reasonable but one
supporting field is incomplete, the instructor should be able to return
the work for correction rather than forcing a complete restart.

This should feel like professional review.

## 13. Instructor Review Experience

The instructor review page should show:

**Submission:** student; module; lab; attempt; submitted time; status.

**Final Case:** render the case as the student submitted it.

**Evidence:** evidence attached; evidence viewed where useful; affected
entities; event references.

**Meaningful Action Timeline**, e.g.:

```text
10:02 Opened NST-2407
10:03 Viewed authentication event EVT-1128
10:04 Viewed MFA event EVT-1131
10:05 Opened LAP-442 device context
10:07 Severity changed Low → Medium
10:08 Disposition changed Undetermined → Suspicious Activity
10:09 Escalation set to Required
10:11 Added work note
10:12 Submitted case
```

**Faculty Controls:** Approve; Return for correction; Comment.

## 14. Returned Work

If returned, the student should reopen the same case.

Example faculty feedback:

> Your disposition is supportable, but your handoff does not identify the
> affected device. Add the device and update your note so the next
> analyst can continue the investigation.

The student corrects the actual case, then resubmits.

Do not create a separate remediation worksheet.

## 15. Environment Boundaries

**Include, for Module 01:**

- alert queue;
- alert detail;
- readable log/event table;
- expandable raw/structured log records;
- affected user/device context;
- incident/case record;
- severity;
- disposition;
- escalation;
- evidence attachment/reference;
- work notes;
- resolution/handoff;
- save/submit.

**Do not include yet:**

- large SIEM query workspace;
- advanced KQL/SPL-style querying;
- packet analyzer;
- EDR process tree;
- email gateway;
- threat-hunting workbench;
- vulnerability scanner;
- IDS/IPS policy editor;
- forensic evidence locker;
- full integrated SOC range.

The environment should grow later as the curriculum grows.

## 16. Why the Full SOC Range Is Not Used

The existing full SOC range remains valuable.

It is simply not the correct Module 01 experience.

A brand-new learner should not have to simultaneously understand:

- cybersecurity concepts;
- SOC workflow;
- multiple security products;
- complex navigation;
- query languages;
- alert correlation;
- advanced evidence types.

Module 01 isolates the first transferable job behavior:

**TAKE AN ASSIGNED ALERT AND TURN IT INTO A DEFENSIBLE CASE RECORD.**

Later modules progressively expand the tools and evidence available.

By the capstone, the integrated SOC environment is appropriate because the
learner has already encountered the individual workflows.

## 17. Student Experience Summary

The intended learner experience is:

```text
LMS Module 01
    ↓
Learn basic SOC workflow
    ↓
Launch Practice It
    ↓
Enter focused case console
    ↓
Open assigned alert
    ↓
Read logs/events
    ↓
Identify user/device
    ↓
Update actual incident record
    ↓
Receive coaching/feedback
    ↓
Complete Practice
    ↓
Launch Prove It
    ↓
Fresh assigned case
    ↓
Read evidence independently
    ↓
Update case
    ↓
Document decision
    ↓
Submit
    ↓
Instructor reviews actual work product
```

## 18. Definition of Done

Module 01 lab redesign is complete when:

- Practice and Prove launch a focused case workspace rather than the full
  SOC range.
- The workspace feels like a working security/ITSM application rather
  than an LMS card.
- Evidence is presented as realistic logs/events that must be read and
  interpreted.
- Students are not required to write queries yet.
- Practice guides the learner through the real interface.
- Practice is retry-friendly.
- Prove uses a new case with minimal coaching.
- Severity/disposition/escalation use realistic ticket controls rather
  than quiz-style radio paragraphs.
- The student documents findings inside the actual case.
- The completed case is the primary graded artifact.
- Meaningful actions are persisted.
- Instructor review shows the final artifact plus meaningful
  evidence/action history.
- Returned work can be corrected and resubmitted.
- Existing module progress and completion contracts continue to work.
- Full SOC-range functionality remains available for later
  modules/capstone.
- The experience is verified in Chrome as both learner and instructor.

## 19. Final Standard

The Module 01 learner should not finish thinking:

> "I answered questions about an alert."

They should finish thinking:

> "I received an alert, read the logs, worked the case, made a decision,
> and handed off a usable incident record."

That is the Module 01 practical standard.
