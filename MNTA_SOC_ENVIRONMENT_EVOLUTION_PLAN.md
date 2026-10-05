# Mission Next SOC Environment Evolution Plan
## Modules 1–12 → One Familiar Analyst Workspace

**Status:** Architecture / implementation roadmap  
**Goal:** Stop treating each assessment lab as a disposable standalone simulator. Starting with the useful interfaces already built in Modules 1–2, evolve one recognizable Mission Next SOC environment across the course. Each later module adds only the controls, data sources, and workflows needed for that module. By Module 12, the learner is operating the complete environment they have already learned piece by piece.

---

## 1. Core decision

The current repository describes the SOC Analyst track as isolated miniature labs for Modules 1–11, with the complete integrated range reserved for Module 12. Preserve the **evidence boundary and progressive disclosure**, but change the implementation philosophy:

> **One environment, progressively revealed — not eleven unrelated interfaces followed by a twelfth interface.**

Earlier modules must not expose future answers or capstone evidence. They should, however, share the same visual language, navigation model, entity model, case model, and reusable components.

The learner should feel:

- Module 1: "I am learning the case console."
- Module 2: "The same environment now lets me inspect network and identity context."
- Module 3: "Now I can search the telemetry behind what I was looking at."
- Module 4: "Now I can turn what I find into detections."
- Module 5+: "The same console keeps getting more capable."
- Module 12: "I already know this SOC. Now nobody is telling me what to do."

---

# 2. What happens to the current Module 2 environment?

Current visible concepts include:

- Mission Next Environment
- Network & Identity Security
- Network Map
- Access Activity
- Identities
- Devices
- Resources
- Policies
- device inventory
- access details
- user/source/destination context
- service / transport / port
- authentication and MFA
- device trust/compliance
- authorization
- network decision

## KEEP AND EXTRACT

Do **not** scrap the useful model underneath this interface.

Extract/reuse:

### Global shell
- Mission Next branding
- console header
- consistent navigation treatment
- guide/help affordance
- common panel/card/table styling
- status/severity badges
- details drawer/pane behavior

### Entity model
- users / identities
- devices
- IP addresses
- resources
- services
- network destinations
- authentication state
- MFA state
- trust/compliance state
- authorization state

These become shared entities throughout the course.

### Network and identity context
The current access-detail model is valuable. An event such as:

`Cora Green → WKSTN-09 → FINANCE-DB → TCP/1433 → denied`

should eventually be searchable in the SIEM, visible from an incident, pivotable to the user/device/resource, and usable by detection rules.

### Network Map
Keep it, but make it a **view**, not the main architecture of the simulator.

By the capstone, the map becomes one investigation pivot among Alerts, Incidents, Hunt, Entities, Threat Intelligence, Automations, etc.

### Devices / Identities / Resources
Keep and turn these into reusable entity pages.

A learner should eventually be able to open `WKSTN-09` from:
- a log result,
- an alert,
- an incident,
- a hunt,
- the network map,
- an automation result,

and arrive at the same device entity.

---

## RETIRE / REMOVE AS THE PRIMARY MODEL

The Module 2 interface should **not** remain the full definition of the Mission Next SOC.

Retire as primary architecture:

- a module-specific "Network & Identity Security" application identity
- navigation that only makes sense for Module 2
- hard-coded one-case details that cannot be reused
- static data that visually resembles telemetry but cannot participate in searches/detections/incidents
- duplicate device/user/resource definitions living separately in different labs
- controls that exist only to answer one assessment question
- module-specific UI implementations where a shared SOC component can do the same job

**Important:** retiring something as the primary interface does not mean deleting its code immediately. Extract useful components first, migrate the module, regression-test it, and only then remove dead/duplicate code.

---

# 3. Module 1 should feed the same environment

The current Module 1 case-console work should not be discarded.

Extract the useful concepts:

- case / incident summary
- analyst notes
- evidence
- status
- disposition
- assignment
- investigation timeline
- analyst decisions
- ticket/case updates

This becomes the **case-management side** of the shared environment.

Module 1 therefore contributes the analyst workflow.

Module 2 contributes the entity/network/identity context.

Module 3 connects them with actual searchable telemetry.

That is the foundation.

---

# 4. Shared SOC architecture

Build one reusable Mission Next SOC shell with capability flags.

Suggested eventual navigation:

```text
MISSION NEXT SOC

Overview
Alerts
Incidents
Hunt / Search
Threat Intelligence
Entities
  ├─ Identities
  ├─ Devices
  └─ Resources
Network
Detections
Automations
Vulnerabilities
Evidence
Reports
```

Not every module sees every item.

Example:

```text
Module 2
Entities
Network

Module 3
Alerts
Incidents
Hunt / Search
Entities
Network

Module 4
Alerts
Incidents
Hunt / Search
Threat Intelligence
Entities
Network
Detections

...

Module 12
ALL CAPABILITIES
```

Use configuration/capability flags rather than cloning the entire UI for every module.

Example concept:

```js
capabilities = {
  alerts: true,
  incidents: true,
  hunt: true,
  threatIntel: false,
  detections: false,
  automation: false,
  vulnerabilities: false,
  reporting: false
}
```

The **scenario data changes by module**. The core interface does not.

---

# 5. Progressive build by module

## Modules 1–2 — Foundation

### Reuse
Module 1:
- case handling
- evidence
- notes
- disposition
- analyst workflow

Module 2:
- network map
- access activity
- identities
- devices
- resources
- policy/security context

### Build
Create the shared:
- SOC shell
- entity schema
- event schema
- case/incident schema
- common navigation
- reusable tables
- details panel
- timeline component

The Module 1 and Module 2 assessment scenarios remain isolated, but run through shared components.

---

## Module 3 — SIEM & Log Analysis

This is where the environment becomes recognizably a SIEM.

The repository already calls Module 3 **SIEM & Log Analysis** and retains the service-account correlation case plus a separate low-and-slow cloud mailbox case.

### Reuse
- Module 1 case console
- Module 2 identities/devices/resources
- Module 2 access events
- Module 2 detail panes
- existing Module 3 scenario/evidence

### Build
- log/search workspace
- time selector
- query editor
- event table
- fields sidebar/filtering
- entity pivots
- saved queries
- alert list
- incident list
- alert → incident relationship
- event → alert → incident provenance

The learner should now be able to search events that resemble the access data they saw in Module 2.

### Key UX principle
Do not replace Module 2 with an unrelated "SIEM simulator."

**Extend it.**

---

## Module 4 — Detection Rules, Threat Intelligence & Automated Monitoring

The current repository already defines this module around detection rules, threat intelligence, threshold testing, intelligence relevance/freshness, and approval-aware automation.

### Reuse
Everything from Module 3.

### Build
- Threat Intelligence page
- IOC objects
- IOC enrichment/details
- MITRE ATT&CK mapping
- detection-rule builder
- query → detection conversion
- threshold controls
- lookback window
- run frequency
- Run Now
- Enable / Disable
- rule preview/test
- alert-generation engine

This is where learner actions begin changing the environment.

A bad rule should be allowed to run.

If it is too broad:
- extra alerts appear,
- false positives appear,
- incorrect correlations may form,
- an unnecessary incident may be generated.

If it is too narrow:
- relevant activity is missed.

The simulator should grade the consequences, not merely display "wrong answer."

---

## Module 5 — Endpoint Investigation

### Reuse
- device entities from Module 2
- query/search from Module 3
- alerts/incidents
- detection provenance

### Build
Extend the **same Device page** rather than creating a separate endpoint application.

Add:
- process activity
- parent/child process relationships
- sign-ins
- network connections
- endpoint events
- device timeline
- evidence collection
- response state

A device that began as:

`WKSTN-09 · Unmanaged / Non-compliant`

can now have a complete investigative history.

---

## Module 6 — Threat Hunting & Investigation

The repository already defines Module 6 as hypothesis-led hunting and includes a scenario where a dormant scheduled-task backdoor generated no initial alert.

### Reuse
The Module 3 search engine becomes the hunting engine.

### Build
- hunt workspace/mode
- hunt hypothesis
- multiple query tabs or saved steps
- entity pivots
- bookmarks
- findings
- convert finding → alert/incident
- hunt history
- scope tracking

This is important architecturally:

**Do not build a second query engine for hunting.**

Hunting is a workflow around the same telemetry/query capability introduced in Module 3.

---

## Module 7 — Expand telemetry and correlation

Reuse the same investigation surface and add the telemetry required by the existing Module 7 curriculum/scenario.

Potential shared capabilities should include:
- network telemetry
- DNS
- connection records
- email/message evidence where curriculum requires it
- cross-source correlation

The objective is not another simulator. It is **more data available inside the existing one**.

---

## Module 8 — Vulnerability / risk context

Extend entities rather than building a disconnected vulnerability tool.

### Build/reuse
Device/resource pages gain:
- vulnerabilities
- severity
- exposure
- affected software
- remediation state
- risk context
- prioritization context

Alerts/incidents can now pivot into vulnerability context.

This later matters in the capstone when the analyst determines why an asset was exposed and what recovery/remediation is necessary.

---

## Module 9 — Incident Response

This is where the incident console becomes operational.

### Reuse
- Module 1 case handling
- incidents
- entities
- evidence
- hunt results
- alerts
- detections

### Build
- response actions
- containment controls
- automation/playbook designer
- automation execution history
- approval state
- endpoint isolation simulation
- account/session containment simulation
- IOC blocking
- evidence collection actions
- eradication actions
- recovery actions

Suggested workflow representation:

```text
TRIGGER
  High-confidence malicious activity

CONDITIONS
  IOC confidence >= threshold
  AND affected entity meets criteria

ACTIONS
  Isolate device
  Revoke sessions
  Disable/reset identity where appropriate
  Block IOC
  Collect evidence
  Update incident
  Notify/escalate
```

The student should see the logic/code representation behind a visual workflow where practical.

---

## Module 10 — Evidence / case continuity

Do not create another independent evidence simulator if the existing curriculum can operate inside the case.

Extend:
- evidence locker
- evidence provenance
- analyst actions
- timestamps
- case timeline
- bookmarks
- evidence-to-finding relationships
- handoff/context

By this point, every major action should leave a trace in the incident timeline.

---

## Module 11 — SOC Operations / Reporting

### Reuse
Everything already captured during an investigation.

### Build
- analyst handoff
- incident report
- executive summary
- technical findings
- affected entities
- IOC list
- ATT&CK mapping
- containment actions
- recovery actions
- lessons learned
- detection improvements
- SOC metrics / operational view

The system should pre-populate **facts** from the case but require the learner to write the analytical portions.

Report writing is part of the analyst workflow, not an unrelated writing exercise.

---

# 6. Module 12 — Complete SOC Capstone

No new major interface should appear.

That is the test.

The learner opens the same Mission Next SOC they have used repeatedly.

Now everything is enabled.

### Initial environment

The SOC is already operating:

- background telemetry
- existing alerts
- existing incidents
- incidents assigned to other analysts
- benign activity
- false-positive noise
- users
- endpoints
- servers/resources
- existing detection rules
- scheduled rules
- prior intelligence
- vulnerabilities
- automation workflows
- closed historical incidents

Then:

> **New Threat Intelligence Received**

No step-by-step instructions.

---

# 7. Capstone event chain

The intended chain is:

```text
Threat Intelligence
        ↓
Research / enrichment
        ↓
IOC creation
        ↓
MITRE ATT&CK mapping
        ↓
Hunting query
        ↓
Validate results
        ↓
Detection rule
        ↓
Lookback + threshold + schedule
        ↓
Run Now
        ↓
Alerts generated
        ↓
Alert correlation
        ↓
Incident creation / assignment
        ↓
Triage
        ↓
Investigation
        ↓
Scope affected entities
        ↓
Containment / automation
        ↓
Eradication
        ↓
Recovery
        ↓
Credential/session remediation
        ↓
Validation
        ↓
Incident closure
        ↓
Report / lessons learned
        ↓
Detection tuning
```

The student has encountered every major interface before Module 12.

---

# 8. The capstone must allow mistakes to propagate

This is a core requirement.

Do not stop the learner at every wrong configuration.

## Example: bad detection

Threat intelligence requires:

```text
Indicator A
+ Behavior B
+ related identity activity
within the appropriate time window
```

Student creates:

```text
Indicator A OR Behavior B
lookback = 7 days
```

The engine runs it.

Result:
- excessive alerts
- benign entities included
- incorrect alert correlation
- false incident created
- incident assigned to learner

The learner may spend time investigating it before recognizing the detection problem.

They can:
- identify false positive,
- tune the rule,
- rerun,
- close/document the false incident,
- continue.

That mistake costs points but does **not** automatically fail the capstone.

---

# 9. Scheduling matters

Detection and response logic must support simulated scheduling.

Examples:

- Run now
- every hour
- every several hours
- daily
- every few days
- custom scenario interval

The threat intelligence can imply an activity window.

The learner must choose:
- query lookback,
- detection frequency,
- threshold,
- response schedule/scope.

A technically valid rule with a poor time window can therefore miss activity or create excessive noise.

That should affect scoring.

---

# 10. Automation architecture

Do not make an external SOAR/cloud automation platform a hard dependency yet.

First build a **Mission Next automation abstraction**.

Example:

```json
{
  "trigger": "alert.created",
  "conditions": [],
  "actions": [],
  "approvalRequired": true
}
```

The visual builder manipulates this internal representation.

Later, adapters/integrations can be researched for open-source automation/SOAR platforms without forcing the curriculum to depend on them.

This also makes the simulator deterministic and gradeable.

---

# 11. AI-assisted analysis

Add AI assistance as an analyst aid, not an answer machine.

Possible panel:

```text
MNTA ANALYST ASSIST

Assessment:
Likely malicious

Confidence:
84%

Supporting evidence:
- intelligence match
- suspicious endpoint behavior
- abnormal identity activity

Suggested pivots:
- inspect device
- review identity sessions
- search related IOC activity
```

The AI should occasionally:
- have incomplete evidence,
- express lower confidence,
- suggest a non-optimal pivot,
- require analyst validation.

The learner is responsible for the disposition.

This teaches appropriate AI-assisted SOC behavior rather than button-click acceptance.

---

# 12. Shared data model

A major refactor should move away from module-specific copies of the same conceptual objects.

Core reusable objects should include:

```text
Event
Entity
  User
  Device
  Resource
Alert
Incident
Evidence
IOC
ThreatIntel
ATTACKTechnique
Query
DetectionRule
Hunt
Vulnerability
Automation
AutomationRun
ResponseAction
Report
AnalystNote
```

Relationships matter:

```text
Event
  → Alert
      → Incident

IOC
  → ThreatIntel
  → ATTACKTechnique
  → DetectionRule

Incident
  → Alerts
  → Entities
  → Evidence
  → ResponseActions
  → AutomationRuns
  → Report
```

That relationship graph is what allows Module 12 to feel alive.

---

# 13. Scenario isolation

A common UI does **not** mean a common evidence pool.

Maintain strict scenario boundaries.

Each assessment receives:
- its own scenario ID
- its own events
- its own alerts/incidents
- its own learner state
- its own expected outcomes
- its own grading model

Future-module and capstone evidence must not become visible simply because the interface component exists.

The repository's existing LabRuntime/student isolation should remain the boundary for module state unless deliberately replaced with an equivalent or stronger architecture.

---

# 14. What should actually be scrapped?

## Scrap after extraction/migration

- duplicate module-specific implementations of generic tables
- duplicate entity cards
- duplicate case-detail components
- duplicate timelines
- hard-coded "fake UI" that cannot participate in scenario state
- separate search implementations where one query engine can be reused
- separate device models
- separate identity models
- module-only navigation shells
- dead inherited simulator code that does not support the new curriculum
- controls whose only purpose is revealing the answer
- redundant static fixture logic

## Do NOT scrap

- useful Module 1 case workflow
- Module 2 network/identity model
- Module 2 entity relationships
- Module 3 scenario logic
- Module 4 detection/intelligence concepts
- existing later-module scenario/evidence logic
- assessment grading requirements
- partial-credit philosophy
- student-written responses
- LabRuntime isolation
- Supabase auth/progress boundaries
- existing scenario content that can be translated into the shared object model

The goal is **consolidation, not demolition**.

---

# 15. Build-vs-reuse summary

| Capability | Source |
|---|---|
| SOC visual shell | Evolve from current Mission Next lab styling |
| Case workflow | Extract/evolve Module 1 |
| Network map | Extract/evolve Module 2 |
| Identity/device/resource entities | Extract/evolve Module 2 |
| Access activity | Convert Module 2 activity into shared events |
| Query/search | Evolve/build around Module 3 |
| Alerts | Build/evolve Module 3 |
| Incidents | Merge Module 1 case concepts + Module 3 SIEM concepts |
| Threat intelligence | Evolve/build Module 4 |
| IOC management | Build Module 4 |
| ATT&CK mapping | Build Module 4 |
| Detection rules | Evolve Module 4 detection studio |
| Scheduling | Build shared rule scheduler/simulated clock |
| Endpoint timeline | Build/evolve Module 5 |
| Threat hunting | Extend Module 3 query engine in Module 6 |
| Additional telemetry | Add through later modules |
| Vulnerability context | Build/evolve Module 8 |
| Response actions | Build/evolve Module 9 |
| Automation/playbooks | Build shared Module 9 engine |
| Evidence management | Merge case/evidence concepts into shared system |
| Reporting | Build/evolve Module 11 |
| AI analyst assistance | Build reusable layer after underlying workflows work |
| Capstone | **Compose existing capabilities; do not invent another UI** |

---

# 16. Implementation order

Do **not** attempt Modules 3–12 simultaneously.

### Phase 1 — Inventory
1. Inventory Module 1 UI/components/state.
2. Inventory Module 2 UI/components/state.
3. Inventory Module 3 assessment lab.
4. Identify duplicate concepts.
5. Identify reusable components.
6. Identify scenario-specific code that must remain isolated.

### Phase 2 — Shared foundation
1. Create common SOC shell.
2. Create common entity/event schemas.
3. Extract Module 1 case components.
4. Extract Module 2 entity/network components.
5. Preserve Module 1/2 behavior with regression tests.

### Phase 3 — Module 3 as first true integrated SIEM
1. Put Module 3 assessment inside shared shell.
2. Add search/query.
3. Feed Module 2-style events into searchable telemetry.
4. Add alerts.
5. Add incidents.
6. Connect entity pivots.
7. Preserve independent assessment scenario and scoring.

**Module 3 becomes the architectural proof of concept.**

Do not proceed to the rest until Module 3 feels right.

### Phase 4 — Module 4
Add threat intelligence, IOCs, ATT&CK, detection rules, scheduling, and alert generation to the same environment.

### Phase 5 — Modules 5–8
Extend entities, telemetry, hunt workflows, and vulnerability/risk context.

### Phase 6 — Modules 9–11
Add response automation, evidence/case continuity, recovery, operations, and reporting.

### Phase 7 — Module 12
Create the capstone primarily from:
- scenario data,
- state transitions,
- scoring logic,
- background activity,
- threat-intelligence injection,
- consequence propagation.

Avoid building major new UI here.

---

# 17. Definition of success

By Module 12, a student should already know:

- where alerts live,
- where incidents live,
- how to search logs,
- how to pivot to an identity/device/resource,
- how to read a timeline,
- how to create and tune a detection,
- how to work with threat intelligence and IOCs,
- how ATT&CK context is represented,
- how to hunt,
- how to collect evidence,
- how response actions work,
- how automation works,
- how to recover,
- how to document and report.

The capstone assesses whether they can decide **when and why** to use those capabilities.

It should not assess whether they can discover an unfamiliar interface.

---

# 18. Immediate next development target

**Do not start by rebuilding the capstone.**

Start with:

> **Module 1 + Module 2 extraction → Module 3 shared SOC prototype**

Specifically:

1. Preserve the Module 1 case workflow.
2. Preserve the useful Module 2 Network & Identity environment.
3. Convert Module 2 users/devices/resources/access activity into reusable entities/events.
4. Build the shared Mission Next SOC shell.
5. Place the existing Module 3 SIEM assessment into that shell.
6. Add searchable logs and entity pivots.
7. Add alerts/incidents using the same entities.
8. Verify that the Module 3 guided and assessment scenarios remain isolated and grade correctly.
9. Validate UX.
10. Only then use that implementation as the foundation for Module 4.

---

## Architectural rule going forward

> **Every new module should ask: "What capability are we adding to the Mission Next SOC?" — not "What new simulator are we building?"**

And:

> **Module 12 should mostly be new scenario logic, not new interface code.**

That is how the student reaches the capstone already comfortable with the environment while still encountering a genuinely difficult, open-ended incident-response problem.
