# Learn It decks — copy and alignment review

**For approval before wiring.** This document lists every slide and its objective, lab alignment, and graded decision. Metadata in `portal/learn-it-decks.js` is for lint/review; only `title` and `body` render.

## Mapping notes

- Curriculum objective wording comes from SOC `curriculumItems` in `portal/data.js`; guided and assessment decision detail was checked against the module rubrics.
- M02 slides 1–6 are retained word for word as legacy introduction. They have `legacyIntro: true` and `objective: null`; they do not claim objective coverage. Added M02 cards map the eight lesson objectives.
- M12 has no lesson objectives by design. Every M12 slide uses `objective: null`, an explicit `carryForward` key to a prior real curriculum objective, and one or more `capstoneCriterion` IDs from the eight-criterion M12 assessment rubric. Carry-forward indicates prerequisite knowledge, not an M12 objective claim.
- Each deck ends with a bridge that previews graded decisions in the Guided Lab; M12 bridges to its integrated Assessment Lab.
- Visual treatment: the M01 CIA triad is included as a compact, accessible diagram on the matching idea. No OSI diagram was added because it did not materially improve M03’s log-analysis objectives; add another visual only where it makes a specific idea clearer.

## Graded lab decisions by module

### SOC-01

**Lab records:** lab-soc-environment (guided triage); lab-soc-escalation (independent case ticket)  
**Graded decisions:** Validate identity evidence, classify the alert, state the triage decision, and make an evidence-backed handoff.

### SOC-02

**Lab records:** lab-identity-investigation (authentication, network, and access-change correlation); M02 independent scored trust-path scenario (module implementation; no separate LABS catalog record)  
**Graded decisions:** Correlate authentication, network, and access-change records; identify and escalate a risky identity pattern. The separate independent scenario scores trust-path choices.

### SOC-03

**Lab records:** lab-siem-triage (normalized timeline, disposition, and handoff)  
**Graded decisions:** Correlate log sources into a supported timeline, select alert disposition, and produce an analyst handoff.

### SOC-04

**Lab records:** lab-detection-rule (IOC lifecycle, rule quality/scheduling, malicious coverage, benign retry suppression, approval-gated automation, case disposition)  
**Graded decisions:** Corroborate intelligence and maintain IOC lifecycle; test, tune, schedule and execute a rule that covers malicious activity while excluding the benign retry; keep disruptive automation approval-gated; document disposition and rationale.

### SOC-05

**Lab records:** lab-endpoint-investigation (process ancestry, malicious/benign interpretation, persistence, scope, evidence, response handoff); lab-endpoint-independent (fresh case; same allocation)  
**Graded decisions:** Correlate process ancestry; distinguish malicious payload from benign signed updater; identify persistence; distinguish detection from cleanup; bound scope; preserve event/hash evidence; recommend safe response and EDR handoff.

### SOC-06

**Lab records:** lab-threat-hunt (hypothesis, benign comparison, query/pivots, evidence, supported mapping, uncertainty, handoff); lab-threat-hunt-independent (fresh case; same allocation)  
**Graded decisions:** Test a scoped hypothesis against a benign comparison; use saved query and pivots; preserve deduplicated evidence; map only supported behavior; document a bounded conclusion, handoff, and uncertainty.

### SOC-07

**Lab records:** lab-email-triage (message, sender, delivery, interaction verdict); lab-network-investigation (DNS/TLS evidence and scope); lab-network-email-independent (fresh case; same allocation)  
**Graded decisions:** Correlate message interaction with DNS/TLS; separate delivered and blocked recipients; exclude benign activity; preserve unknown endpoint and credential outcomes; retain supporting evidence in the incident record.

### SOC-08

**Lab records:** lab-vuln-prioritization (finding review and priority); lab-vuln-queue (incident link, approved risk acceptance, owner, due date, remediation outcome)  
**Graded decisions:** Audit and validate current/applicable findings; weigh business impact, exposure, reachability and controls; link supported findings to incidents; retain only explicitly approved finding-specific risk acceptance; route with owner/due date; document evidence-backed remediation and outcome.

### SOC-09

**Lab records:** lab-active-incident (incident ownership, evidence, approved containment, action outcomes, recovery and monitoring); lab-independent-response (fresh response drill)  
**Graded decisions:** Prioritize and route the incident; preserve evidence; use incident-scoped approved containment; record success/failure/partial outcomes; address identity and persistence proportionately; validate ordered known-good recovery; monitor and escalate residual risk.

### SOC-10

**Lab records:** lab-evidence-collection (selection, acquisition, hashes, failed acquisition, custody, legal hold/package); lab-attack-mapping (timeline, facts/analysis, evidenced behavior, unknowns/escalation)  
**Graded decisions:** Select evidence; record source/acquisition context; verify hashes and failed acquisitions; maintain custody; preserve originals under legal hold and package them; reconstruct timeline and root cause; separate fact/analysis; map evidenced behavior; document unknowns and specialist escalation.

### SOC-11

**Lab records:** lab-soc-metrics (queue priority, SLA action, assignment/escalation, metric interpretation, noisy rule); lab-exec-report (handoff, technical/executive reporting, residual risk, ownership, lessons, closure)  
**Graded decisions:** Prioritize queue against SLA and impact; act on at-risk/breached items; assign/escalate correctly; interpret metrics without causal overclaim; improve noisy rule; hand off shift; separate technical and executive reports; state residual risk, owners/due dates, lessons, and defensible closure.

### SOC-12

**Lab records:** lab-capstone (integrated 12-stage Assessment Lab scored against eight rubric criteria)  
**Graded decisions:** Integrated rubric: intelligence; query/detection/scheduling; alert/incident; cross-domain investigation; timeline/scope/evidence/ATT&CK; tuning/automation/containment; eradication/recovery; reporting/operations/lessons.

## Slide-by-slide copy

### SOC-01 — 10 slides

#### 01. Protect what matters

> Confidentiality limits who can see data, integrity protects it from improper change, and availability keeps it usable. Security decisions balance all three.

- **Mapping:** soc-01-lesson-01 — Explain how confidentiality, integrity, and availability support the systems and data monitored by a SOC.
- **Lab tag:** Guided + Assessment; lab-soc-environment (guided triage); lab-soc-escalation (independent case ticket)

#### 02. Coordinate the work

> A security operations center brings people, processes, and telemetry together to monitor activity, investigate signals, and coordinate response.

- **Mapping:** soc-01-lesson-02 — Describe the SOC as an operating function that coordinates monitoring, investigation, and response.
- **Lab tag:** Guided + Assessment; lab-soc-environment (guided triage); lab-soc-escalation (independent case ticket)

#### 03. Know your boundary

> You verify evidence, document impact, and recommend a proportionate next step. Escalate actions that exceed your authority or the evidence.

- **Mapping:** soc-01-lesson-03 — Distinguish entry-level analyst responsibilities, decision boundaries, and escalation responsibilities.
- **Lab tag:** Guided + Assessment; lab-soc-environment (guided triage); lab-soc-escalation (independent case ticket)

#### 04. Separate event types

> An event records something that happened. An alert flags a pattern for review; an incident is a supported security problem requiring coordinated action.

- **Mapping:** soc-01-lesson-04 — Differentiate recorded events, detection alerts, and declared incidents in an analyst workflow.
- **Lab tag:** Guided + Assessment; lab-soc-environment (guided triage); lab-soc-escalation (independent case ticket)

#### 05. Follow the telemetry

> Identity, endpoint, network, application, and cloud records show different parts of an activity. Source and timestamp help you judge what each record can prove.

- **Mapping:** soc-01-lesson-05 — Relate identity, endpoint, network, application, and cloud telemetry to the systems that generate it.
- **Lab tag:** Guided + Assessment; lab-soc-environment (guided triage); lab-soc-escalation (independent case ticket)

#### 06. Work the triage loop

> Read the alert, verify its evidence, scope related activity, decide its disposition, then document the reasoning. Each step should leave a trace another analyst can review.

- **Mapping:** soc-01-lesson-06 — Apply a repeatable read, verify, scope, decide, and document triage loop.
- **Lab tag:** Guided + Assessment; lab-soc-environment (guided triage); lab-soc-escalation (independent case ticket)

#### 07. Set a defensible priority

> Weigh potential impact, evidence confidence, affected scope, and your authority. Explain why the case needs attention now and who should own the next action.

- **Mapping:** soc-01-lesson-07 — Use impact, confidence, scope, and authority to justify priority and escalation.
- **Lab tag:** Guided + Assessment; lab-soc-environment (guided triage); lab-soc-escalation (independent case ticket)

#### 08. Place your handoff

> Validation and scoping inform response; your handoff gives the incident owner evidence and a clear decision point. Do not claim containment or recovery you did not verify.

- **Mapping:** soc-01-lesson-08 — Place alert validation and analyst handoff within the incident response lifecycle.
- **Lab tag:** Guided + Assessment; lab-soc-environment (guided triage); lab-soc-escalation (independent case ticket)

#### 09. Write for the next analyst

> Separate observed facts from your interpretation, state current scope, and name the requested action. A useful handoff lets another analyst continue without repeating your work.

- **Mapping:** soc-01-lesson-09 — Write a concise handoff that separates observations, analysis, scope, and the requested next action.
- **Lab tag:** Guided + Assessment; lab-soc-environment (guided triage); lab-soc-escalation (independent case ticket)

#### 10. Triage the alert · Lab bridge

> Open the guided alert, verify the identity evidence, and record a supported disposition and handoff in the Guided Lab.

- **Mapping:** soc-01-lesson-06 — Apply a repeatable read, verify, scope, decide, and document triage loop.
- **Lab tag:** Guided; lab-soc-environment (guided triage); lab-soc-escalation (independent case ticket)

### SOC-02 — 15 slides

#### 01. The analyst toolkit

> Throughout your career as a SOC Analyst, you will encounter a variety of technologies, constantly changing to keep up with the fast-paced world of Cybersecurity.

- **Mapping:** Legacy introduction; no objective claim.
- **Lab tag:** Guided; lab-identity-investigation (authentication, network, and access-change correlation); M02 independent scored trust-path scenario (module implementation; no separate LABS catalog record)

#### 02. Keep learning

> New threats emerge every day.

- **Mapping:** Legacy introduction; no objective claim.
- **Lab tag:** Guided; lab-identity-investigation (authentication, network, and access-change correlation); M02 independent scored trust-path scenario (module implementation; no separate LABS catalog record)

#### 03. Adapt to the evidence

> That requires practitioners to constantly learn how to use different terminals, monitoring dashboards, or possibly reading coding or scripting languages to understand what a specific malicious software is doing, and get familiarized with different interfaces you may encounter in your career.

- **Mapping:** Legacy introduction; no objective claim.
- **Lab tag:** Guided; lab-identity-investigation (authentication, network, and access-change correlation); M02 independent scored trust-path scenario (module implementation; no separate LABS catalog record)

#### 04. The core idea

> Regardless, the concept is the same.

- **Mapping:** Legacy introduction; no objective claim.
- **Lab tag:** Guided; lab-identity-investigation (authentication, network, and access-change correlation); M02 independent scored trust-path scenario (module implementation; no separate LABS catalog record)

#### 05. Create the signal

> A level 1 Security Operations Center Analyst is creating scheduled queries to generate alerts out of logs that are recorded in all of these different technologies and gathered together into a Security Information Event Management System.

- **Mapping:** Legacy introduction; no objective claim.
- **Lab tag:** Guided; lab-identity-investigation (authentication, network, and access-change correlation); M02 independent scored trust-path scenario (module implementation; no separate LABS catalog record)

#### 06. Connect the clues

> These alerts are correlated using more targeted queries, machine learning, and artificial intelligence now more than ever, to piece together what attacks are happening within the environment.

- **Mapping:** Legacy introduction; no objective claim.
- **Lab tag:** Guided; lab-identity-investigation (authentication, network, and access-change correlation); M02 independent scored trust-path scenario (module implementation; no separate LABS catalog record)

#### 07. Trace the connection

> Read source, destination, route, protocol, trust zone, and outcome together. A familiar address alone does not show that a connection was expected.

- **Mapping:** soc-02-lesson-01 — Interpret a connection using its source, destination, route, protocol, trust zone, and outcome.
- **Lab tag:** Guided + Assessment; lab-identity-investigation (authentication, network, and access-change correlation); M02 independent scored trust-path scenario (module implementation; no separate LABS catalog record)

#### 08. Name the identity

> A person, service, device, or workload can initiate activity. Identify which kind of identity acted before interpreting the access record.

- **Mapping:** soc-02-lesson-02 — Distinguish human, service, device, and workload identities when reviewing network and access activity.
- **Lab tag:** Guided + Assessment; lab-identity-investigation (authentication, network, and access-change correlation); M02 independent scored trust-path scenario (module implementation; no separate LABS catalog record)

#### 09. Authentication proves identity

> Authentication checks a claimed identity. A successful result does not establish that the identity may use a particular resource.

- **Mapping:** soc-02-lesson-03 — Interpret authentication methods and outcomes without treating a successful control decision as proof of authorization.
- **Lab tag:** Guided + Assessment; lab-identity-investigation (authentication, network, and access-change correlation); M02 independent scored trust-path scenario (module implementation; no separate LABS catalog record)

#### 10. Check the permission

> Authorization decides which resources an authenticated identity may use. Compare the requested action with the role and permission actually granted.

- **Mapping:** soc-02-lesson-04 — Explain how roles and permissions govern resource access after authentication.
- **Lab tag:** Guided + Assessment; lab-identity-investigation (authentication, network, and access-change correlation); M02 independent scored trust-path scenario (module implementation; no separate LABS catalog record)

#### 11. Read every factor

> Multi-factor authentication combines different proof types. Review its result with device, route, and session context before judging the request.

- **Mapping:** soc-02-lesson-05 — Use multi-factor results with device, route, and session context during analyst review.
- **Lab tag:** Guided + Assessment; lab-identity-investigation (authentication, network, and access-change correlation); M02 independent scored trust-path scenario (module implementation; no separate LABS catalog record)

#### 12. Review role scope

> Role-based access control groups permissions by job function. Confirm a role has approval, a current purpose, and only the access its work needs.

- **Mapping:** soc-02-lesson-06 — Assess whether a role assignment has appropriate approval, purpose, and scope.
- **Lab tag:** Guided + Assessment; lab-identity-investigation (authentication, network, and access-change correlation); M02 independent scored trust-path scenario (module implementation; no separate LABS catalog record)

#### 13. Interpret the certificate

> A certificate binds a key to an identified subject. Check issuer, intended use, expiry, and workload context before trusting the connection.

- **Mapping:** soc-02-lesson-07 — Interpret certificate subject, issuer, use, expiry, and workload context during security review.
- **Lab tag:** Guided + Assessment; lab-identity-investigation (authentication, network, and access-change correlation); M02 independent scored trust-path scenario (module implementation; no separate LABS catalog record)

#### 14. Combine trust signals

> Zero Trust evaluates each request using identity, device, network, resource, and risk signals. Recommend a control that matches the evidence and affected scope.

- **Mapping:** soc-02-lesson-08 — Combine identity, device, network, resource, and risk signals to recommend a proportionate control.
- **Lab tag:** Guided + Assessment; lab-identity-investigation (authentication, network, and access-change correlation); M02 independent scored trust-path scenario (module implementation; no separate LABS catalog record)

#### 15. Investigate the sign-in · Lab bridge

> Correlate authentication, network, and access-change records; identify the risky identity pattern and explain the evidence behind your escalation in the Guided Lab.

- **Mapping:** soc-02-lesson-03 — Interpret authentication methods and outcomes without treating a successful control decision as proof of authorization.
- **Lab tag:** Guided; lab-identity-investigation (authentication, network, and access-change correlation); M02 independent scored trust-path scenario (module implementation; no separate LABS catalog record)

### SOC-03 — 6 slides

#### 01. Keep source and time

> A log entry is an observation from a particular system at a particular time. Preserve its source and timestamp before using it to support an alert claim.

- **Mapping:** soc-03-lesson-01 — Relate individual log observations to a detection claim while preserving source and time context.
- **Lab tag:** Guided + Assessment; lab-siem-triage (normalized timeline, disposition, and handoff)

#### 02. Compare normalized fields

> Normalization gives different records shared field names. Compare identity, host, event type, and outcome while retaining the original source meaning.

- **Mapping:** soc-03-lesson-02 — Compare normalized authentication, directory, application, and system log fields in one timeline.
- **Lab tag:** Guided + Assessment; lab-siem-triage (normalized timeline, disposition, and handoff)

#### 03. Build a bounded query

> Filter on a known identity, host, address, and time window. Narrow results in steps so each pivot has a clear reason and can be repeated.

- **Mapping:** soc-03-lesson-03 — Use a bounded query to correlate related events by identity, host, address, and time.
- **Lab tag:** Guided + Assessment; lab-siem-triage (normalized timeline, disposition, and handoff)

#### 04. Join related observations

> Matching entities and nearby times can connect records, but correlation alone does not prove causation. Check whether the sequence supports the claim.

- **Mapping:** soc-03-lesson-03 — Use a bounded query to correlate related events by identity, host, address, and time.
- **Lab tag:** Guided + Assessment; lab-siem-triage (normalized timeline, disposition, and handoff)

#### 05. Write the disposition

> State what the evidence supports, what remains uncertain, and how far the activity extends. Include the records that another analyst needs to verify your reasoning.

- **Mapping:** soc-03-lesson-04 — Document a supported alert disposition, scope, evidence chain, and escalation request.
- **Lab tag:** Guided + Assessment; lab-siem-triage (normalized timeline, disposition, and handoff)

#### 06. Triage the alert · Lab bridge

> Correlate normalized log sources into a supported timeline, choose a disposition, and submit an evidence-based analyst handoff in the Guided Lab.

- **Mapping:** soc-03-lesson-04 — Document a supported alert disposition, scope, evidence chain, and escalation request.
- **Lab tag:** Guided; lab-siem-triage (normalized timeline, disposition, and handoff)

### SOC-04 — 7 slides

#### 01. Balance detection goals

> Coverage finds more relevant behavior; fidelity limits noisy matches. Weigh both against the disruption a false alarm or missed threat could cause.

- **Mapping:** soc-04-lesson-01 — Explain how detection coverage, false-positive cost, and response risk shape a rule decision.
- **Lab tag:** Guided + Assessment; lab-detection-rule (IOC lifecycle, rule quality/scheduling, malicious coverage, benign retry suppression, approval-gated automation, case disposition)

#### 02. Read the rule conditions

> Check which events a rule matches, how thresholds group them, and which exclusions remove records. Test each choice against the supplied event patterns.

- **Mapping:** soc-04-lesson-02 — Review detection conditions, thresholds, grouping, and exclusions against supplied event patterns.
- **Lab tag:** Guided + Assessment; lab-detection-rule (IOC lifecycle, rule quality/scheduling, malicious coverage, benign retry suppression, approval-gated automation, case disposition)

#### 03. Tune with a reason

> Change a condition only when evidence shows what it fixes. Recheck expected matches and missed cases so a quieter rule does not hide the behavior.

- **Mapping:** soc-04-lesson-02 — Review detection conditions, thresholds, grouping, and exclusions against supplied event patterns.
- **Lab tag:** Guided + Assessment; lab-detection-rule (IOC lifecycle, rule quality/scheduling, malicious coverage, benign retry suppression, approval-gated automation, case disposition)

#### 04. Weigh intelligence sources

> Treat reputation as context, not a verdict. Check source quality and recency, then compare an indicator with activity observed in the environment.

- **Mapping:** soc-04-lesson-03 — Use source quality, recency, and observed context to enrich rather than replace the evidence.
- **Lab tag:** Guided + Assessment; lab-detection-rule (IOC lifecycle, rule quality/scheduling, malicious coverage, benign retry suppression, approval-gated automation, case disposition)

#### 05. Bound automation

> Automate repeatable, low-risk steps with clear limits and review. Keep disruptive actions under an authorized decision maker when evidence or scope is uncertain.

- **Mapping:** soc-04-lesson-04 — Choose a bounded automated action that preserves review and avoids unsupported disruption.
- **Lab tag:** Guided + Assessment; lab-detection-rule (IOC lifecycle, rule quality/scheduling, malicious coverage, benign retry suppression, approval-gated automation, case disposition)

#### 06. Gate disruptive actions

> Keep automated enrichment and monitoring bounded. Require explicit approval before an automated step can disrupt an account, device, or service.

- **Mapping:** soc-04-lesson-04 — Choose a bounded automated action that preserves review and avoids unsupported disruption.
- **Lab tag:** Guided + Assessment; lab-detection-rule (IOC lifecycle, rule quality/scheduling, malicious coverage, benign retry suppression, approval-gated automation, case disposition)

#### 07. Review the detection · Lab bridge

> Tune and schedule a rule for supported malicious activity, suppress the documented benign retry, justify intelligence, and keep disruptive actions approval-gated in the Guided Lab.

- **Mapping:** soc-04-lesson-02 — Review detection conditions, thresholds, grouping, and exclusions against supplied event patterns.
- **Lab tag:** Guided; lab-detection-rule (IOC lifecycle, rule quality/scheduling, malicious coverage, benign retry suppression, approval-gated automation, case disposition)

### SOC-05 — 12 slides

#### 01. Read behavior first

> Endpoint telemetry records process, file, network, and configuration activity. Describe what was observed before accepting a tool label or inferring intent.

- **Mapping:** soc-05-lesson-01 — Distinguish observed endpoint behavior from a product verdict or inferred intent.
- **Lab tag:** Guided + Assessment; lab-endpoint-investigation (process ancestry, malicious/benign interpretation, persistence, scope, evidence, response handoff); lab-endpoint-independent (fresh case; same allocation)

#### 02. Follow process ancestry

> A parent process helps explain how a child started. Trace the chain to the initiating action and check whether each step fits the user and time.

- **Mapping:** soc-05-lesson-02 — Use process ancestry to explain how suspicious execution began.
- **Lab tag:** Guided + Assessment; lab-endpoint-investigation (process ancestry, malicious/benign interpretation, persistence, scope, evidence, response handoff); lab-endpoint-independent (fresh case; same allocation)

#### 03. Read command context

> Combine executable path, arguments, user, and time. A familiar utility can behave unexpectedly when its command or launch context changes.

- **Mapping:** soc-05-lesson-03 — Assess executable path, arguments, user, and time as a combined behavior.
- **Lab tag:** Guided + Assessment; lab-endpoint-investigation (process ancestry, malicious/benign interpretation, persistence, scope, evidence, response handoff); lab-endpoint-independent (fresh case; same allocation)

#### 04. Order endpoint events

> Place process, file, and network observations on one timeline. Use sequence to test a causal explanation and separate nearby unrelated activity.

- **Mapping:** soc-05-lesson-04 — Order endpoint observations to distinguish causal activity from nearby noise.
- **Lab tag:** Guided + Assessment; lab-endpoint-investigation (process ancestry, malicious/benign interpretation, persistence, scope, evidence, response handoff); lab-endpoint-independent (fresh case; same allocation)

#### 05. Assess the file

> Combine signer, prevalence, reputation, and observed execution. No single attribute proves a file is safe or harmful.

- **Mapping:** soc-05-lesson-05 — Combine signer, prevalence, reputation, and execution behavior in a file assessment.
- **Lab tag:** Guided + Assessment; lab-endpoint-investigation (process ancestry, malicious/benign interpretation, persistence, scope, evidence, response handoff); lab-endpoint-independent (fresh case; same allocation)

#### 06. Use hashes as identifiers

> A cryptographic hash identifies matching file bytes. Novelty can guide a search, but it does not establish malicious behavior.

- **Mapping:** soc-05-lesson-06 — Use a hash to identify matching bytes without treating novelty as proof of maliciousness.
- **Lab tag:** Guided + Assessment; lab-endpoint-investigation (process ancestry, malicious/benign interpretation, persistence, scope, evidence, response handoff); lab-endpoint-independent (fresh case; same allocation)

#### 07. Explain persistence

> Connect an autostart change to the process that created it, its path, and surrounding activity. Verify whether it survives a restart or sign-in.

- **Mapping:** soc-05-lesson-07 — Relate an autostart change to its creating process, path, and surrounding activity.
- **Lab tag:** Guided + Assessment; lab-endpoint-investigation (process ancestry, malicious/benign interpretation, persistence, scope, evidence, response handoff); lab-endpoint-independent (fresh case; same allocation)

#### 08. Check what prevention did

> Blocking a file may stop a new launch without removing an existing process or persistence. Verify the endpoint state before claiming cleanup.

- **Mapping:** soc-05-lesson-08 — Explain why a blocked artifact may not remove existing execution or persistence.
- **Lab tag:** Guided + Assessment; lab-endpoint-investigation (process ancestry, malicious/benign interpretation, persistence, scope, evidence, response handoff); lab-endpoint-independent (fresh case; same allocation)

#### 09. Bound endpoint scope

> Name confirmed devices and activity, then state what the available telemetry cannot establish. Keep the search window and matching evidence clear.

- **Mapping:** soc-05-lesson-09 — State the confirmed affected scope and the limits of the available endpoint evidence.
- **Lab tag:** Guided + Assessment; lab-endpoint-investigation (process ancestry, malicious/benign interpretation, persistence, scope, evidence, response handoff); lab-endpoint-independent (fresh case; same allocation)

#### 10. Hand off endpoint findings

> Separate observation, interpretation, and requested action. Include the process chain, file evidence, persistence, scope, and containment question.

- **Mapping:** soc-05-lesson-10 — Prepare an endpoint handoff that separates observation, interpretation, and requested action.
- **Lab tag:** Guided + Assessment; lab-endpoint-investigation (process ancestry, malicious/benign interpretation, persistence, scope, evidence, response handoff); lab-endpoint-independent (fresh case; same allocation)

#### 11. Preserve before response

> Keep the relevant event and hash evidence, distinguish the malicious payload from a benign signed updater, and do not execute an unsupported disruptive action.

- **Mapping:** soc-05-lesson-10 — Prepare an endpoint handoff that separates observation, interpretation, and requested action.
- **Lab tag:** Guided + Assessment; lab-endpoint-investigation (process ancestry, malicious/benign interpretation, persistence, scope, evidence, response handoff); lab-endpoint-independent (fresh case; same allocation)

#### 12. Investigate the workstation · Lab bridge

> Compare malicious and benign activity, preserve event and hash evidence, confirm device scope, and recommend safe containment with an evidence-backed EDR handoff in the Guided Lab.

- **Mapping:** soc-05-lesson-10 — Prepare an endpoint handoff that separates observation, interpretation, and requested action.
- **Lab tag:** Guided; lab-endpoint-investigation (process ancestry, malicious/benign interpretation, persistence, scope, evidence, response handoff); lab-endpoint-independent (fresh case; same allocation)

### SOC-06 — 8 slides

#### 01. State a testable idea

> Write a hypothesis that names observable behavior, data needed, and a result that could disprove it. Keep the time and entity scope manageable.

- **Mapping:** soc-06-lesson-01 — State an observable hunting hypothesis that available data can support or disprove.
- **Lab tag:** Guided + Assessment; lab-threat-hunt (hypothesis, benign comparison, query/pivots, evidence, supported mapping, uncertainty, handoff); lab-threat-hunt-independent (fresh case; same allocation)

#### 02. Pivot from a seed

> Use an indicator to find related devices, identities, times, and behavior. Confirm each match before expanding the search.

- **Mapping:** soc-06-lesson-02 — Pivot from a seed indicator into related device, identity, time, and behavior context.
- **Lab tag:** Guided + Assessment; lab-threat-hunt (hypothesis, benign comparison, query/pivots, evidence, supported mapping, uncertainty, handoff); lab-threat-hunt-independent (fresh case; same allocation)

#### 03. Preserve the reasoning

> Keep the records that establish the behavior and current scope, plus the query or pivot that found them. This lets another analyst reproduce the path.

- **Mapping:** soc-06-lesson-03 — Preserve the minimum evidence set that establishes behavior and current scope.
- **Lab tag:** Guided + Assessment; lab-threat-hunt (hypothesis, benign comparison, query/pivots, evidence, supported mapping, uncertainty, handoff); lab-threat-hunt-independent (fresh case; same allocation)

#### 04. Map only proven behavior

> Use a behavior framework after validating the evidence. Map only demonstrated actions and record where the available data leaves uncertainty.

- **Mapping:** soc-06-lesson-04 — Map only demonstrated adversary behavior and document the investigation limits.
- **Lab tag:** Guided + Assessment; lab-threat-hunt (hypothesis, benign comparison, query/pivots, evidence, supported mapping, uncertainty, handoff); lab-threat-hunt-independent (fresh case; same allocation)

#### 05. Report the supported scope

> Distinguish confirmed entities from candidates still being checked. State the limits of your search and a proportionate next action.

- **Mapping:** soc-06-lesson-03 — Preserve the minimum evidence set that establishes behavior and current scope.
- **Lab tag:** Guided + Assessment; lab-threat-hunt (hypothesis, benign comparison, query/pivots, evidence, supported mapping, uncertainty, handoff); lab-threat-hunt-independent (fresh case; same allocation)

#### 06. Test a benign comparison

> Compare the lead with known benign activity using the same scope and query. Record what differs before treating a match as malicious.

- **Mapping:** soc-06-lesson-01 — State an observable hunting hypothesis that available data can support or disprove.
- **Lab tag:** Guided + Assessment; lab-threat-hunt (hypothesis, benign comparison, query/pivots, evidence, supported mapping, uncertainty, handoff); lab-threat-hunt-independent (fresh case; same allocation)

#### 07. Map with evidence

> Tie each behavior claim to supporting events, leave unsupported techniques unmapped, and state what remains uncertain in the Guided Lab.

- **Mapping:** soc-06-lesson-04 — Map only demonstrated adversary behavior and document the investigation limits.
- **Lab tag:** Guided + Assessment; lab-threat-hunt (hypothesis, benign comparison, query/pivots, evidence, supported mapping, uncertainty, handoff); lab-threat-hunt-independent (fresh case; same allocation)

#### 08. Test the hypothesis · Lab bridge

> Bound the hunt, compare benign activity, preserve deduplicated evidence, map only supported behavior, and hand off a conclusion with explicit uncertainty in the Guided Lab.

- **Mapping:** soc-06-lesson-01 — State an observable hunting hypothesis that available data can support or disprove.
- **Lab tag:** Guided; lab-threat-hunt (hypothesis, benign comparison, query/pivots, evidence, supported mapping, uncertainty, handoff); lab-threat-hunt-independent (fresh case; same allocation)

### SOC-07 — 7 slides

#### 01. Trace message to session

> Relate sender identity, message artifacts, delivery, user activity, and later network records. Sequence can support a link but does not prove one by itself.

- **Mapping:** soc-07-lesson-01 — Relate sender identity, message artifacts, delivery, and subsequent network activity without assuming causation.
- **Lab tag:** Guided + Assessment; lab-email-triage (message, sender, delivery, interaction verdict); lab-network-investigation (DNS/TLS evidence and scope); lab-network-email-independent (fresh case; same allocation)

#### 02. Read a network session

> Use time, device, destination, process, and outcome to interpret DNS and encrypted-session records. Encrypted content may remain unknown.

- **Mapping:** soc-07-lesson-02 — Interpret DNS and TLS session records using time, device, destination, process, and outcome.
- **Lab tag:** Guided + Assessment; lab-email-triage (message, sender, delivery, interaction verdict); lab-network-investigation (DNS/TLS evidence and scope); lab-network-email-independent (fresh case; same allocation)

#### 03. Check sender alignment

> Compare visible sender, authentication results, reply path, and expected context. A passing control is one fact, not a complete verdict.

- **Mapping:** soc-07-lesson-03 — Assess sender alignment, URL and attachment evidence, and delivery scope from the supplied trace.
- **Lab tag:** Guided + Assessment; lab-email-triage (message, sender, delivery, interaction verdict); lab-network-investigation (DNS/TLS evidence and scope); lab-network-email-independent (fresh case; same allocation)

#### 04. Inspect artifacts safely

> Review URLs, redirects, and attachment evidence in the supplied trace. Keep analysis inside the approved environment and record what was actually observed.

- **Mapping:** soc-07-lesson-03 — Assess sender alignment, URL and attachment evidence, and delivery scope from the supplied trace.
- **Lab tag:** Guided + Assessment; lab-email-triage (message, sender, delivery, interaction verdict); lab-network-investigation (DNS/TLS evidence and scope); lab-network-email-independent (fresh case; same allocation)

#### 05. Bound delivery scope

> Correlate recipients and network observations to state who received or interacted with the message. Separate confirmed activity from unanswered questions.

- **Mapping:** soc-07-lesson-04 — Correlate the delivered message with associated network observations and state the bounded scope.
- **Lab tag:** Guided + Assessment; lab-email-triage (message, sender, delivery, interaction verdict); lab-network-investigation (DNS/TLS evidence and scope); lab-network-email-independent (fresh case; same allocation)

#### 06. Separate delivery outcomes

> Identify which recipients received the message and which the gateway blocked. Do not infer endpoint execution or credential use when the records leave those outcomes unknown.

- **Mapping:** soc-07-lesson-04 — Correlate the delivered message with associated network observations and state the bounded scope.
- **Lab tag:** Guided + Assessment; lab-email-triage (message, sender, delivery, interaction verdict); lab-network-investigation (DNS/TLS evidence and scope); lab-network-email-independent (fresh case; same allocation)

#### 07. Correlate the case · Lab bridge

> Link message interaction to DNS and TLS evidence, separate delivered from blocked recipients, reject benign noise, and preserve unknown endpoint or credential outcomes in the Guided Lab.

- **Mapping:** soc-07-lesson-04 — Correlate the delivered message with associated network observations and state the bounded scope.
- **Lab tag:** Guided; lab-email-triage (message, sender, delivery, interaction verdict); lab-network-investigation (DNS/TLS evidence and scope); lab-network-email-independent (fresh case; same allocation)

### SOC-08 — 7 slides

#### 01. Read vulnerability context

> CVE identifies a disclosed weakness; CVSS estimates severity. Add exploitability, asset role, and exposure before deciding what the finding means here.

- **Mapping:** soc-08-lesson-01 — Interpret CVE, CVSS, exploitability, asset role, and exposure as inputs to an analyst decision.
- **Lab tag:** Guided + Assessment; lab-vuln-prioritization (finding review and priority); lab-vuln-queue (incident link, approved risk acceptance, owner, due date, remediation outcome)

#### 02. Prioritize real exposure

> Rank findings using reachability, evidence of activity, business impact, and available controls. A high score alone does not set the remediation order.

- **Mapping:** soc-08-lesson-02 — Prioritize a finding using exposure, evidence of activity, business context, and available controls.
- **Lab tag:** Guided + Assessment; lab-vuln-prioritization (finding review and priority); lab-vuln-queue (incident link, approved risk acceptance, owner, due date, remediation outcome)

#### 03. Validate the finding

> Check data freshness, affected scope, supporting telemetry, and compensating controls. Confirm the weakness applies before assigning urgency.

- **Mapping:** soc-08-lesson-03 — Validate finding freshness, affected scope, compensating controls, and supporting telemetry before ranking.
- **Lab tag:** Guided + Assessment; lab-vuln-prioritization (finding review and priority); lab-vuln-queue (incident link, approved risk acceptance, owner, due date, remediation outcome)

#### 04. Choose an owner and action

> Record the disposition, accountable owner, next action, due point, and escalation condition. Make the route clear enough to track to closure.

- **Mapping:** soc-08-lesson-04 — Document the disposition, owner, next action, due point, and escalation condition for a finding.
- **Lab tag:** Guided + Assessment; lab-vuln-prioritization (finding review and priority); lab-vuln-queue (incident link, approved risk acceptance, owner, due date, remediation outcome)

#### 05. Link supported findings

> Connect a finding to an incident only when evidence supports the relationship. Preserve a risk acceptance only when approval is explicit and specific to that finding.

- **Mapping:** soc-08-lesson-04 — Document the disposition, owner, next action, due point, and escalation condition for a finding.
- **Lab tag:** Guided + Assessment; lab-vuln-prioritization (finding review and priority); lab-vuln-queue (incident link, approved risk acceptance, owner, due date, remediation outcome)

#### 06. Verify remediation

> Record the selected remediation and its observed outcome. Keep stale, unverified, or out-of-scope findings unresolved until evidence supports a disposition.

- **Mapping:** soc-08-lesson-03 — Validate finding freshness, affected scope, compensating controls, and supporting telemetry before ranking.
- **Lab tag:** Guided + Assessment; lab-vuln-prioritization (finding review and priority); lab-vuln-queue (incident link, approved risk acceptance, owner, due date, remediation outcome)

#### 07. Prioritize the queue · Lab bridge

> Audit and validate findings, link supported incident evidence, retain only approved risk acceptance, and record an owner, due date, and verified remediation outcome in the Guided Lab.

- **Mapping:** soc-08-lesson-04 — Document the disposition, owner, next action, due point, and escalation condition for a finding.
- **Lab tag:** Guided; lab-vuln-prioritization (finding review and priority); lab-vuln-queue (incident link, approved risk acceptance, owner, due date, remediation outcome)

### SOC-09 — 6 slides

#### 01. Act on confirmed evidence

> Urgency is not proof. Validate the incident and affected scope, then choose containment, eradication, recovery, and escalation steps that match the evidence.

- **Mapping:** soc-09-lesson-01 — Choose proportionate containment, eradication, recovery, and escalation steps from confirmed incident evidence.
- **Lab tag:** Guided + Assessment; lab-active-incident (incident ownership, evidence, approved containment, action outcomes, recovery and monitoring); lab-independent-response (fresh response drill)

#### 02. Contain with scope

> Choose actions for confirmed identities and devices, consider service impact, and stay within your authority. Record what should be preserved before action.

- **Mapping:** soc-09-lesson-01 — Choose proportionate containment, eradication, recovery, and escalation steps from confirmed incident evidence.
- **Lab tag:** Guided + Assessment; lab-active-incident (incident ownership, evidence, approved containment, action outcomes, recovery and monitoring); lab-independent-response (fresh response drill)

#### 03. Verify recovery conditions

> Eradication removes the cause; recovery restores service with validation. Define the evidence and owner needed before calling the incident resolved.

- **Mapping:** soc-09-lesson-01 — Choose proportionate containment, eradication, recovery, and escalation steps from confirmed incident evidence.
- **Lab tag:** Guided + Assessment; lab-active-incident (incident ownership, evidence, approved containment, action outcomes, recovery and monitoring); lab-independent-response (fresh response drill)

#### 04. Hand off the incident

> State confirmed facts, response decisions, remaining uncertainty, and accountable owner. Escalate when scope or action exceeds your authority.

- **Mapping:** soc-09-lesson-01 — Choose proportionate containment, eradication, recovery, and escalation steps from confirmed incident evidence.
- **Lab tag:** Guided + Assessment; lab-active-incident (incident ownership, evidence, approved containment, action outcomes, recovery and monitoring); lab-independent-response (fresh response drill)

#### 05. Approve and verify

> Preserve evidence before eradication. Execute only incident-scoped, approved containment, record failed or partial outcomes, and verify restore and monitoring before closure.

- **Mapping:** soc-09-lesson-01 — Choose proportionate containment, eradication, recovery, and escalation steps from confirmed incident evidence.
- **Lab tag:** Guided + Assessment; lab-active-incident (incident ownership, evidence, approved containment, action outcomes, recovery and monitoring); lab-independent-response (fresh response drill)

#### 06. Respond to the incident · Lab bridge

> Prioritize and route the case, preserve evidence, approve and verify containment, validate a known-good restore, set monitoring, and escalate residual risk in the Guided Lab.

- **Mapping:** soc-09-lesson-01 — Choose proportionate containment, eradication, recovery, and escalation steps from confirmed incident evidence.
- **Lab tag:** Guided; lab-active-incident (incident ownership, evidence, approved containment, action outcomes, recovery and monitoring); lab-independent-response (fresh response drill)

### SOC-10 — 7 slides

#### 01. Record evidence intake

> Name the source, acquisition context, time, and person handling each item. Preserve the original and document any transformation or transfer.

- **Mapping:** soc-10-lesson-01 — Record evidence source, acquisition context, integrity controls, custody, and specialist escalation boundaries.
- **Lab tag:** Guided + Assessment; lab-evidence-collection (selection, acquisition, hashes, failed acquisition, custody, legal hold/package); lab-attack-mapping (timeline, facts/analysis, evidenced behavior, unknowns/escalation)

#### 02. Protect evidence integrity

> Use an integrity check such as a hash to detect changes. Record custody transitions so reviewers can see who handled the evidence and when.

- **Mapping:** soc-10-lesson-01 — Record evidence source, acquisition context, integrity controls, custody, and specialist escalation boundaries.
- **Lab tag:** Guided + Assessment; lab-evidence-collection (selection, acquisition, hashes, failed acquisition, custody, legal hold/package); lab-attack-mapping (timeline, facts/analysis, evidenced behavior, unknowns/escalation)

#### 03. Separate fact from cause

> Mark direct observations separately from supported causal analysis. State unknowns clearly instead of filling gaps with assumptions.

- **Mapping:** soc-10-lesson-02 — Separate observed facts, supported causal analysis, framework mapping, and explicit unknowns in a case record.
- **Lab tag:** Guided + Assessment; lab-evidence-collection (selection, acquisition, hashes, failed acquisition, custody, legal hold/package); lab-attack-mapping (timeline, facts/analysis, evidenced behavior, unknowns/escalation)

#### 04. Map demonstrated actions

> Use a behavior framework to describe supported actions, linking each mapping to evidence. Leave unsupported stages unmapped.

- **Mapping:** soc-10-lesson-02 — Separate observed facts, supported causal analysis, framework mapping, and explicit unknowns in a case record.
- **Lab tag:** Guided + Assessment; lab-evidence-collection (selection, acquisition, hashes, failed acquisition, custody, legal hold/package); lab-attack-mapping (timeline, facts/analysis, evidenced behavior, unknowns/escalation)

#### 05. Escalate specialist work

> Record what was acquired and what remains, then route analysis beyond your training or authority to the appropriate specialist.

- **Mapping:** soc-10-lesson-01 — Record evidence source, acquisition context, integrity controls, custody, and specialist escalation boundaries.
- **Lab tag:** Guided + Assessment; lab-evidence-collection (selection, acquisition, hashes, failed acquisition, custody, legal hold/package); lab-attack-mapping (timeline, facts/analysis, evidenced behavior, unknowns/escalation)

#### 06. Preserve under hold

> Retain originals under legal hold and package the required items with source and acquisition context. Record a failed acquisition instead of silently omitting it.

- **Mapping:** soc-10-lesson-01 — Record evidence source, acquisition context, integrity controls, custody, and specialist escalation boundaries.
- **Lab tag:** Guided + Assessment; lab-evidence-collection (selection, acquisition, hashes, failed acquisition, custody, legal hold/package); lab-attack-mapping (timeline, facts/analysis, evidenced behavior, unknowns/escalation)

#### 07. Preserve and reconstruct · Lab bridge

> Record hashes, custody transfers, and failed acquisitions; preserve originals under legal hold, then submit an evidence-backed timeline, supported behavior map, and unknowns in the Guided Lab.

- **Mapping:** soc-10-lesson-02 — Separate observed facts, supported causal analysis, framework mapping, and explicit unknowns in a case record.
- **Lab tag:** Guided; lab-evidence-collection (selection, acquisition, hashes, failed acquisition, custody, legal hold/package); lab-attack-mapping (timeline, facts/analysis, evidenced behavior, unknowns/escalation)

### SOC-11 — 8 slides

#### 01. Read queue health

> Track alert volume, false-positive rate, backlog, service levels, and response-time trends together. A change in one measure does not prove its cause.

- **Mapping:** soc-11-lesson-01 — Interpret alert volume, false-positive rate, backlog, service levels, and response-time trends without overstating causation.
- **Lab tag:** Guided + Assessment; lab-soc-metrics (queue priority, SLA action, assignment/escalation, metric interpretation, noisy rule); lab-exec-report (handoff, technical/executive reporting, residual risk, ownership, lessons, closure)

#### 02. Make metrics comparable

> Check the time window, denominator, and case mix before comparing teams or periods. Explain limits when the data cannot support a conclusion.

- **Mapping:** soc-11-lesson-01 — Interpret alert volume, false-positive rate, backlog, service levels, and response-time trends without overstating causation.
- **Lab tag:** Guided + Assessment; lab-soc-metrics (queue priority, SLA action, assignment/escalation, metric interpretation, noisy rule); lab-exec-report (handoff, technical/executive reporting, residual risk, ownership, lessons, closure)

#### 03. Separate metrics from work

> Interpret alert volume, false positives, backlog, and response trends as measures. Keep case-report activity distinct, and do not claim one caused the other without evidence.

- **Mapping:** soc-11-lesson-01 — Interpret alert volume, false-positive rate, backlog, service levels, and response-time trends without overstating causation.
- **Lab tag:** Guided + Assessment; lab-soc-metrics (queue priority, SLA action, assignment/escalation, metric interpretation, noisy rule); lab-exec-report (handoff, technical/executive reporting, residual risk, ownership, lessons, closure)

#### 04. Hand off operational risk

> Name the evidence, current risk, owner, and next review point. Make pending actions visible to the incoming shift.

- **Mapping:** soc-11-lesson-02 — Prepare an actionable shift handoff that names evidence, operational risk, owner, and next review point.
- **Lab tag:** Guided + Assessment; lab-soc-metrics (queue priority, SLA action, assignment/escalation, metric interpretation, noisy rule); lab-exec-report (handoff, technical/executive reporting, residual risk, ownership, lessons, closure)

#### 05. Fit the audience

> Keep one factual record, then adapt its detail for technical case notes, escalation, executive decisions, and closure.

- **Mapping:** soc-11-lesson-03 — Adapt one bounded incident record for technical case, executive, escalation, and closure audiences.
- **Lab tag:** Guided + Assessment; lab-soc-metrics (queue priority, SLA action, assignment/escalation, metric interpretation, noisy rule); lab-exec-report (handoff, technical/executive reporting, residual risk, ownership, lessons, closure)

#### 06. Close with ownership

> State impact, supported cause, recommendations, and follow-up owner. Avoid claims that exceed the investigation evidence.

- **Mapping:** soc-11-lesson-03 — Adapt one bounded incident record for technical case, executive, escalation, and closure audiences.
- **Lab tag:** Guided + Assessment; lab-soc-metrics (queue priority, SLA action, assignment/escalation, metric interpretation, noisy rule); lab-exec-report (handoff, technical/executive reporting, residual risk, ownership, lessons, closure)

#### 07. Run the shift

> Prioritize queue items against impact and SLA, act on at-risk work, assign owners, and hand off breached items with next actions.

- **Mapping:** soc-11-lesson-02 — Prepare an actionable shift handoff that names evidence, operational risk, owner, and next review point.
- **Lab tag:** Guided + Assessment; lab-soc-metrics (queue priority, SLA action, assignment/escalation, metric interpretation, noisy rule); lab-exec-report (handoff, technical/executive reporting, residual risk, ownership, lessons, closure)

#### 08. Report and close · Lab bridge

> Keep metrics separate from incident narrative; produce technical and executive reports, name residual risk and follow-up owners, and close only with supporting evidence in the Guided Lab.

- **Mapping:** soc-11-lesson-03 — Adapt one bounded incident record for technical case, executive, escalation, and closure audiences.
- **Lab tag:** Guided; lab-soc-metrics (queue priority, SLA action, assignment/escalation, metric interpretation, noisy rule); lab-exec-report (handoff, technical/executive reporting, residual risk, ownership, lessons, closure)

### SOC-12 — 6 slides

#### 01. Triage the signal

> Choose a supported disposition, severity, affected identity and device, then route the case to an owner with authority for the linked evidence.

- **Mapping:** Capstone criterion: alert-incident-management — Alert validation and incident management; carry-forward: soc-01-lesson-06 — Apply a repeatable read, verify, scope, decide, and document triage loop.
- **Lab tag:** Assessment; lab-capstone (integrated 12-stage Assessment Lab scored against eight rubric criteria)

#### 02. Connect the evidence

> Correlate message, identity, endpoint, network, and enrichment records into a time-ordered account. Cite the evidence behind each link.

- **Mapping:** Capstone criterion: cross-domain-investigation — Cross-domain investigation; carry-forward: soc-03-lesson-03 — Use a bounded query to correlate related events by identity, host, address, and time.
- **Lab tag:** Assessment; lab-capstone (integrated 12-stage Assessment Lab scored against eight rubric criteria)

#### 03. Scope with queries

> Use bounded pivots to identify related activity and unaffected lookalikes. State the search limits and confirmed entities.

- **Mapping:** Capstone criterion: timeline-scope-evidence-attack — Timeline, scope, evidence and ATT&CK; carry-forward: soc-06-lesson-03 — Preserve the minimum evidence set that establishes behavior and current scope.
- **Lab tag:** Assessment; lab-capstone (integrated 12-stage Assessment Lab scored against eight rubric criteria)

#### 04. Map demonstrated behavior

> Connect each behavior mapping to supporting evidence. Do not infer unseen steps from a familiar pattern.

- **Mapping:** Capstone criterion: timeline-scope-evidence-attack — Timeline, scope, evidence and ATT&CK; carry-forward: soc-10-lesson-02 — Separate observed facts, supported causal analysis, framework mapping, and explicit unknowns in a case record.
- **Lab tag:** Assessment; lab-capstone (integrated 12-stage Assessment Lab scored against eight rubric criteria)

#### 05. Choose proportionate action

> Match containment and recovery actions to confirmed scope, preserve evidence, and record required validation before closure.

- **Mapping:** Capstone criterion: tuning-automation-containment — Detection tuning, automation and containment; eradication-recovery — Eradication and recovery; carry-forward: soc-09-lesson-01 — Choose proportionate containment, eradication, recovery, and escalation steps from confirmed incident evidence.
- **Lab tag:** Assessment; lab-capstone (integrated 12-stage Assessment Lab scored against eight rubric criteria)

#### 06. Defend the final record · Lab bridge

> Submit a timeline, scope, evidence, decisions, residual uncertainty, and audience-ready report in the integrated Assessment Lab.

- **Mapping:** Capstone criterion: reporting-operations-lessons — Reporting, operations and lessons learned; carry-forward: soc-11-lesson-03 — Adapt one bounded incident record for technical case, executive, escalation, and closure audiences.
- **Lab tag:** Assessment; lab-capstone (integrated 12-stage Assessment Lab scored against eight rubric criteria)
