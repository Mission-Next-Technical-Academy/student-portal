# SOC Analyst — Miniature Lab & Interface Roadmap

**Status:** Owner vision doc, captured 2026-09-21. Not started, not scoped,
not authorized to build from directly. This is reference material for
`ROADMAP.md` items 4-6 (module completion integrity, Arc A/B curriculum
work, tool-depth expansion) — read those items' current state first.
**Owner's own framing when sharing this:** "good for adding breadth...once
module 1 is locked in...we have a way forward." Module 1 (roadmap items 1-3)
remains the active priority; nothing here is unblocked yet.

**Relationship to other docs in this repo:** extends
[VISION.md](VISION.md)'s CySA+ gap analysis (§4 there already flagged the
two real missing tool surfaces this doc also lands on: interactive CLI and
PCAP/packet analysis) with a concrete per-module interface design and a
shared-component build order. Does not supersede `ROADMAP.md`'s priority
order or `MODULE_STANDARD.md`'s compliance-controlled structure — those
still govern if this doc's build order ever conflicts with them.

---

## 1. Core Philosophy

The SOC Analyst program should not feel like:

> Read lesson → answer questions → repeat.

It should increasingly feel like:

> **See the work → perform the work with assistance → perform the work independently.**

Every module therefore follows:

### Learn It

The environment demonstrates the concept. The learner can explore without
meaningful penalty. The interface may highlight relevant controls, explain
fields, demonstrate analyst reasoning, animate relationships, show example
searches, identify important evidence, explain why an analyst would pivot
somewhere. This is essentially an interactive demonstration.

### Practice It

The learner performs the task. The environment still helps: highlighted
controls, suggested next steps, contextual hints, incomplete queries, field
explanations, feedback after mistakes, progressively smaller hints. The
learner is operating the interface rather than reading about it.

### Prove It

The training wheels disappear. The learner receives a scenario, an
objective, the available tools, the evidence. The learner decides what to
inspect, query, correlate, document, and escalate. No glowing buttons, no
step-by-step instructions, no answer embedded in the interface. The
student's actions and final work product become the evidence of
competency.

*(This already matches the three-stage cycle `ROADMAP.md` and
`INSTRUCTIONAL_ARCHITECTURE.md` use today — this doc's contribution is the
per-module interface concept below, not a new pedagogy.)*

## 2. Design Rule: Simulate the Work, Not the Vendor

Do not clone Microsoft Sentinel, Defender XDR, Splunk, Wireshark, Tenable,
CrowdStrike, Proofpoint, Suricata, or ServiceNow. Build vendor-neutral
interfaces inspired by the workflows analysts encounter in those products.
A graduate should understand SIEM, EDR, IDS/IPS, packet analysis,
vulnerability management, email security, threat intelligence, and case
management — not memorize where one vendor placed a button. Realistic
enough that a commercial SOC product feels familiar later.

## 3. Common Lab Shell

Every miniature environment should share a recognizable Mission Next shell
(tool navigation rail + workspace + mission/evidence/notes/hint bar), but
individual modules expose only the tools required for that module. A
Module 3 learner should not suddenly see the complete SOC platform — the
environment expands as the learner progresses.

## 4. Per-module interface concepts

### Module 01 — SOC Operations Foundations
**Mini SOC Console** — already the active build direction (incident queue →
incident detail: severity/user/device/status/related alerts/entities/
timeline/evidence/notes). Product concept: generic SIEM/SOC case
management console.

### Module 02 — Network, Identity & Security Foundations
**Security Architecture Explorer** — a clickable network topology diagram
(Internet → Firewall → DMZ/Internal → Users/Servers → Identity), selecting a
connection shows source/destination/protocol/identity/auth/authz/network
control. Plus an **Identity Inspector** (account type, department, MFA,
device trust, roles, recent authentication). Product concepts: network map
+ IAM console + firewall event viewer.

### Module 03 — SIEM & Log Analysis
**Log Explorer / SIEM Search** — first serious exposure to tables
(Splunk/Sentinel/Elastic-style search bar + results table + expandable
event). A visual **Query Builder** (field/operator/value rows) shows the
equivalent query text underneath before students type queries directly.
Product concept: SIEM Log Explorer + Query Workbench — becomes a core
reusable interface for later modules.

### Module 04 — Detection, Threat Intel & Automation
**Detection Engineering Workbench** — a rule builder (data source,
conditions, threshold, group-by, severity) with a "test against sample
data" panel showing alerts generated / expected true positives / noise
level, so students see the consequence of a rule change immediately. Plus
a **Threat Intelligence Panel** (indicator lookup: type, first/last seen,
confidence, source reliability, observed internally, related events) —
reinforcing threat intel enriches evidence, it does not replace it. Plus an
**Automation Panel** (checkbox list of actions a rule can trigger) to
discuss automation boundaries. Product concepts: SIEM analytics rules +
threat intelligence platform + SOAR.

### Module 05 — Endpoint & Malware Investigation
**EDR Device Investigation Console** — an interactive process tree
(parent/child execution chain) where selecting a process shows path,
command line, hash, signer, prevalence, network connections, files
created, registry changes. Plus a **File Investigation Panel** (hash,
signed, prevalence, first seen, observed devices). Product concept:
EDR/endpoint investigation console.

### Module 06 — Threat Hunting & Investigation
**Threat Hunting Workspace** — reuses the Module 3 query engine with most
guidance removed. A hypothesis field + data-source toggles + query
workspace + results, plus an **Investigation Board** for bookmarking
evidence (events, devices, IPs, processes) as the student builds an
investigation rather than answering questions. Product concept: Advanced
Hunting / threat hunting workspace.

### Module 07 — Network & Email Analysis
Two interfaces:
- **Packet Analyzer** — a simulated (not real Wireshark) packet capture
  table with expandable protocol-stack layers (Frame/Ethernet/IP/TCP/TLS/
  Application Data) and a filter bar that starts simple and later accepts
  real filter syntax (`ip.addr == ...`, `tcp.port == 443`).
- **Email Security Console** — message investigation (From/Return-Path/
  SPF/DKIM/DMARC, attachments, URLs) with Message/Headers/URLs/
  Attachments/Delivery/Recipients tabs. *(Per `VISION.md` §4, the header-
  analysis half of this is already real and hands-on in
  `portal/soc-analyst-module-07.js` — the packet-analysis half is the
  actual gap.)*
Prove It correlates Email → user → URL → DNS → network session → endpoint
event. Product concepts: packet analyzer + secure email gateway + network
session viewer.

### Module 08 — Vulnerability Findings & SOC Prioritization
**Vulnerability Management Console** — severity-bucketed dashboard, a
findings table (CVE/CVSS/asset/exposure/status), an asset view (business
criticality, internet-facing, environment, vulnerability count) — teaching
that CVSS alone doesn't determine operational priority. A second lab, **Scan
Comparison/Remediation Validation**, compares two scans (resolved/new/
persistent findings) so students verify remediation actually worked.
Product concept: vulnerability management/scanner console.

### Module 09 — Incident Response
**Incident Command Workspace** — brings previously isolated tools together
around one incident (Timeline/Evidence/Entities/Actions/Notes), with
response actions (isolate device, disable account, block indicator,
escalate, collect evidence, contact owner) that have real consequences
(e.g. isolating the wrong system disrupts an unrelated business system,
forcing reassessment — not a game-over screen). Product concept: incident
response/case management platform.

### Module 10 — Evidence Handling, Chain of Custody & Documentation
**Digital Evidence Locker** — an evidence list per case, each record with
ID/source/collected-by/collection-time/hashes/description/handling history,
plus a **chain-of-custody timeline** (collected → added to case → reviewed →
exported) that students actively perform actions against, and a **Case
Documentation Workspace** (observations/analysis/affected scope/actions
taken/recommended next action). Product concepts: evidence management +
SOC case management.

### Module 11 — SOC Operations, Metrics, Reporting & Communication
**SOC Operations Dashboard** — alert/incident/escalation/false-positive
counts, MTTT/MTTR, drillable charts (click a spike day to see which
detection rule caused it, teaching "183 alerts ≠ 183 incidents"). Plus a
**Shift Handoff Console** and an **Executive Report Builder** (What
happened / What was affected / What we did / Current risk / What happens
next) that converts technical findings into a management summary. Product
concepts: SOC dashboard + reporting + shift management.

### Module 12 — Capstone
No more miniature tool — everything previously learned becomes available in
one **Mission Next Security Operations** shell (dashboard, incidents,
alerts, logs, hunting, endpoints, network, email, threat intel,
vulnerabilities, evidence, cases, reports). The scenario brief is
deliberately vague ("Several unusual security events occurred overnight.
Review the SOC queue and determine whether analyst action is required.") —
the student discovers the story across Email → Identity → Endpoint → DNS →
Network → SIEM → Threat Intelligence → Incident, with some evidence
deliberately normal/unrelated/ambiguous/duplicate/false-positive to force
real analysis rather than clue-following.

## 5. Interface progression across the program

Complexity should deliberately expand module to module (Incident Console →
Network+Identity → SIEM+Logs → Detection+Intel+Automation → EDR → Hunting →
Packet+Email → Vuln Mgmt → IR → Evidence+Case Mgmt → SOC Ops+Reporting →
Complete SOC). Students should realize retroactively that these were never
separate labs — they were learning individual pieces of one security
operations environment.

## 6. Shared components to build once, reuse everywhere

Do not build twelve separate applications. Core reusable components:

- **DataTable** — logs, alerts, vulnerabilities, packets, email, evidence
- **EntityDrawer** — users, devices, IPs, domains, files, hashes,
  vulnerabilities
- **Timeline** — endpoint events, incidents, network events, evidence
  custody
- **QueryWorkbench** — SIEM, threat hunting, log analysis
- **ProcessTree** — endpoint investigation, malware analysis
- **PacketInspector** — network analysis, PCAP exercises
- **DetectionBuilder** — detection engineering, automated monitoring
- **CaseWorkspace** — incidents, evidence, escalation, documentation
- **AnalystNotebook** — bookmarking evidence and observations, used
  throughout the whole course
- **Coach/Guidance Engine** — controls assistance level (Learn: high,
  Practice: moderate, Prove: none) so the same scenario engine produces
  different learning experiences. *(Note: `ui/coach.js`'s existing
  `mnt-corner-dock` / spotlighted-steps mechanism, already shipped for
  Module 1's tour and reused by Module 12 per `HANDOFF.md` history, is a
  real precedent for this component — not a from-scratch build.)*

## 7. Guidance reduction model

Guidance should decrease across both the individual lab and the entire
course: heavy Learn/Practice/light Prove in Module 1, roughly even
Learn/Practice/thin Prove by Module 6, thin Learn/Practice/near-zero Prove
by Module 11, and almost no procedural coaching at all in the Module 12
capstone.

## 8. Scenario data architecture

All simulated products should operate against the same underlying
fictional organization (one org, one set of users/devices/networks) so
that shared event IDs (user_id, device_id, timestamp, src_ip, dst_ip,
process_id, file_hash, incident_id) let a single event appear naturally
across EDR, SIEM, network telemetry, DNS, and the incident timeline — the
prerequisite for Module 12 to feel real. Architecturally: one **Mission
Next fictional enterprise telemetry model** feeding a scenario engine,
which exposes different slices per module via module permissions (Module 3
sees SIEM only, Module 7 sees network, Module 12 sees everything). This is
far more maintainable than twelve unrelated datasets — and is a stronger
version of the same idea `portal/data.js`'s existing `Mission Next Labs`/
`INC-####` continuity already gestures at (see `VISION.md` §2).

## 9. Recommended build order (phases)

1. **Current** — finish existing Module 1 Mini SOC/Incident Console work
   before expanding scope. *(This is `ROADMAP.md` items 1-3 today.)*
2. **Foundations** — network topology viewer, identity inspector,
   connection inspector → powers Module 2.
3. **Core analyst engine** — DataTable, event schema, log explorer,
   QueryWorkbench, EntityDrawer, Timeline → powers Module 3 and becomes
   infrastructure for almost everything after.
4. **Detection** — DetectionBuilder, rule testing, threat intel drawer,
   automation action selector → powers Module 4.
5. **Endpoint** — device page, ProcessTree, file inspector, endpoint
   timeline → powers Module 5.
6. **Hunting** — combine QueryWorkbench + EntityDrawer + Timeline +
   bookmarks + AnalystNotebook → powers Module 6.
7. **Network & email** — PacketInspector, protocol tree, network session
   ledger, email/header inspector, delivery trace → powers Module 7.
8. **Vulnerability management** — dashboard, finding inspector, asset
   context, remediation queue, scan comparison → powers Module 8.
9. **Response** — expand CaseWorkspace with response actions, approvals,
   escalation, consequence engine, incident timeline → powers Module 9.
10. **Evidence** — EvidenceLocker, chain-of-custody timeline, case
    documentation → powers Module 10.
11. **Operations** — SOC metrics dashboard, shift handoff, report
    builder → powers Module 11.
12. **Integration** — remove artificial module boundaries, connect every
    previously built component into one Mission Next SOC Range → Module 12.

## 10. Final product principle

The Academy should not require twelve expensive cyber ranges — one
fictional SOC ecosystem, revealed progressively. Modules 1-11 teach the
student to operate individual portions of that ecosystem; Module 12 removes
the partitions. Test of the platform: by Module 12, can a learner be
placed in front of the SOC interface, given a shift brief, and trusted to
figure out where to start?

## 11. Next step

Not scoped, not started. Once Module 1 (`ROADMAP.md` items 1-3) is
genuinely locked in — real, verified, live — bring this doc to the owner as
the candidate shape for items 4-6, phased per §9 above, starting with
whichever module's real content work is next in queue. Cross-check each
phase against `MODULE_STANDARD.md`'s compliance-controlled structure and
`lab-grading-notification-system/`'s existing scoring model before building
anything, per this repo's usual planning-before-code discipline.
