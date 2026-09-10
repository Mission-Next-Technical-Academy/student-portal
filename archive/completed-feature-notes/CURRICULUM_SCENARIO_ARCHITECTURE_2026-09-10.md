# SOC Analyst Curriculum Scenario Architecture — Deep Sweep & Sprint Plan

Status: developer-authored planning document, pending curriculum/compliance/faculty
review like every other item in `CURRICULUM_MAP.md`. This document does not itself
authorize a Security+ affiliation claim — see Guardrails (§6).

## 0. What this document is, and how it relates to what already exists

This repo already has three documents that this one extends rather than replaces:

| Doc | Owns |
|---|---|
| `MODULE_STANDARD.md` | The abstract module data contract (fields every module needs). Its `src/content/programs/*.ts` file-path references are stale — this repo authors modules as `portal/soc-analyst-module-NN.js`, not that schema — but the field list and Module 11/12 rules are still the intent. |
| `CURRICULUM_ALIGNMENT_ARCHITECTURE.md` + `CURRICULUM_MAP.md` | The compliance-authoritative title wording, the official lesson/lab minute ledger (82 total hours: 70 technical + 12 M360, 42 theory/40 lab), and the explicit note that **"Security+ tags remain empty until a curriculum reviewer supplies a secondary crosswalk."** |
| `course_SOC_standardized.md` | The *structural/UX* standard: Lecture → Quiz → Lab → Review rhythm, sticky nav, Review-Module-button placement, randomized quiz banks, Security+-style question wording. |

None of those three actually says **what the scenarios are** or **which SY0-701
objective each module maps to** — they say the shape content should take, not
its substance. That gap is what CURRICULUM_MAP.md's own footer calls out. This
document is that missing layer: a real-world-modeled scenario for every module,
a draft SY0-701 crosswalk, and a sprint-by-sprint plan to build modules 02–12
up to Module 1's actual bar. It does not change the locked program facts (12
modules, 6 weeks, 82 hours) and does not touch code — it is the brief the next
sessions execute against, one module per sprint, the same way
`MODULE_01_ENHANCEMENT_BRIEF.md` → `MODULE_01_ENHANCEMENT_PROGRESS.md` already
worked for Module 1.

## 1. Current-state findings (2026-09-10 sweep)

Confirmed by reading `portal/soc-analyst-module-01.js` through `-12.js` and
`portal/data.js` directly, not by trusting prior handoff docs:

- **All 12 modules already exist as substantial files** (566–1,626 lines each).
  Nothing is an empty stub. The gap is depth and pattern consistency, not
  missing files.
- **Module 1's actual winning formula**, which nothing else in the course has:
  each of its 8 lessons runs *scenario → theory → 4-question knowledge check
  (with per-answer feedback) → applied task (free-text reflection)*, grounded
  in a recurring fictional org, **Mission Next Labs**, and a recurring identity,
  `j.santos@missionnextlabs.example`. On top of that, Module 1 has **two**
  distinct interactive labs (a guided SIEM triage, then an independent
  escalation/handoff case), plus a separate randomized module-level quiz bank
  (`MODULE_ONE_QUIZ_BANKS`, 70%-pass gate, shuffled retries), plus a curated
  sources list (NIST SP 800-61 Rev.3, NIST CSF 2.0, FIRST, Security+ objectives).
- **Modules 2–11 each have exactly one module-level quiz bank and one lab** —
  no per-lesson knowledge-check/applied-task loop, no second lab. Each already
  contains an ad hoc "Security+ (SY0-701) Certification Overview & Objectives
  Summary" lecture block, but these were authored independently per module,
  not against a reviewed crosswalk — they're a first pass, not the finished
  layer this document formalizes. Some ransomware/phishing content already
  exists in modules 04, 06, 07, 10, 11; it has not yet been audited against
  Module 1's depth bar, and should be reused/upgraded, not thrown out.
- **Module 12 ("Operation Amber Finch," incident `INC-4821`)** is the shortest
  file (566 lines) despite being the capstone. Its 7 prep lectures (Scenario
  orientation → Environment architecture → Rules of engagement → Available
  tools → Investigation methodology → Documentation expectations → Incident-
  handling workflow) match `course_SOC_standardized.md` §7 exactly and are
  in good shape. The scored assessment itself is a single integrated rubric
  across 10 domains (Triage, Query, Timeline, Scope, Enrichment, ATT&CK,
  Detection, Response, Reporting, Closure) with real critical-error checks
  (e.g., closing a confirmed incident as benign, targeting an unrelated
  identity, deleting evidence). That's solid design. What's thin is the
  *narrative scaffolding* around it — the case needs to feel like the
  culmination of a 12-module arc, not a standalone exercise.
- **A discrepancy worth flagging, not silently resolving:** `CURRICULUM_MAP.md`
  describes the capstone lab as saving "twelve-stage investigation state," but
  the shipped implementation is one integrated multi-domain assessment, not
  12 discrete stages. Decide in Sprint 12 whether to (a) reword the map to
  match the implementation, or (b) restructure the capstone UI into a visible
  12-stage tracker over the same underlying rubric. Either is defensible;
  leaving the two documents disagreeing is not.
- **The simulator (`ui/`, served at `SIM_ORIGIN`) is far more built-out than
  any single module currently uses.** It already implements realistic routes
  across Defender XDR (alerts, incidents, hunting, threat analytics, exposure
  management, custom detections), Defender for Cloud Apps, Defender for Cloud
  (attack paths, recommendations, regulatory), Entra ID (conditional access,
  identity protection), Sentinel (analytics, hunting — including
  authentication/DNS/network-session hunting queries, MITRE workbook, threat
  intel, automation, watchlists), Purview (DLP, insider risk, eDiscovery,
  information protection), M365 Admin, and Copilot for Security. Module 1
  only touches three of these surfaces (`entra/sign-in-logs`,
  `defender/alerts`, `sentinel/incidents`). This is authored capacity sitting
  unused — the scenario library in §3 spends it deliberately.

## 2. SY0-701 domain crosswalk (draft — pending curriculum reviewer sign-off)

CompTIA Security+ (SY0-701) has five domains. This is the crosswalk
`CURRICULUM_MAP.md` says is missing. Each SOC module gets a primary domain
(where its lab and majority of lessons live) and secondary domains (where
individual lessons touch).

| Domain | Exam weight | Modules where it's primary |
|---|---:|---|
| 1.0 General Security Concepts | 12% | 01, 09 |
| 2.0 Threats, Vulnerabilities & Mitigations | 22% | 05, 06, 07, 08 |
| 3.0 Security Architecture | 18% | 02, 03 |
| 4.0 Security Operations | 28% | 04, 09, 10 |
| 5.0 Security Program Management | 20% | 08, 11 |

| # | Module | Primary domain(s) | Secondary domain(s) |
|---|---|---|---|
| 01 | SOC Operations Foundations | 1.0 General Security Concepts | 4.0 |
| 02 | Network, Identity & Security Foundations | 3.0 Security Architecture | 1.0, 4.0 |
| 03 | SIEM & Log Analysis | 3.0 Security Architecture, 4.0 Security Operations | 2.0 |
| 04 | Detection Rules, Threat Intelligence & Automated Monitoring | 4.0 Security Operations | 2.0 |
| 05 | Endpoint & Malware Investigation | 2.0 Threats, Vulnerabilities & Mitigations | 4.0 |
| 06 | Threat Hunting & Investigation | 2.0 Threats, Vulnerabilities & Mitigations | 4.0 |
| 07 | Network & Email Analysis | 2.0 Threats, Vulnerabilities & Mitigations | 4.0, 3.0 |
| 08 | Vulnerability Findings & SOC Prioritization | 2.0 Threats, Vulnerabilities & Mitigations | 5.0 |
| 09 | Incident Response | 4.0 Security Operations | 1.0 |
| 10 | Incident Evidence Handling, Chain of Custody & Case Documentation | 4.0 Security Operations | 5.0 |
| 11 | SOC Operations, Metrics, Reporting & Communication | 5.0 Security Program Management | 4.0 |
| 12 | SOC Analyst Capstone ("Operation Amber Finch") | All five domains | — |

This table is the reviewed source of truth each module's "Security+
Objectives Summary" block should cite going forward, replacing the ad hoc
independent versions currently in modules 02–11 with consistent domain
numbers and language. Do not cite specific numbered sub-objectives (e.g.
"2.4.3") in student-facing copy without checking them against CompTIA's
current published objectives document at author time — objective numbering
has changed between SY0-601 and SY0-701 and will change again at the next
revision.

## 3. Scenario library — one continuous fictional org, real-world-modeled threats

### 3.1 Design decision: extend Module 1's org, don't invent a new one per module

Module 1 already built **Mission Next Labs** and `j.santos@missionnextlabs.example`.
Module 12 already built incident `INC-4821` ("Operation Amber Finch"). Reusing
the same fictional company, the same asset-naming convention (`ws-###`,
`acct-###`), and an ascending `INC-####` numbering scheme across every module
does two things a fresh scenario per module can't: it teaches students to
recognize *the same organization's* network and identity patterns the way a
real analyst builds tenant familiarity, and it lets modules 09–11 and the
capstone reuse each other's evidence sets instead of each authoring an
unrelated incident from scratch.

**Sprint 2 kickoff task, before writing anything new:** audit the existing
ransomware/phishing content already in modules 04, 06, 07, 10, and 11 for
names, asset IDs, and incident numbers that might already partially match or
conflict with this continuity plan. Reuse what fits; only replace what doesn't.

### 3.2 Threat-pattern sourcing rule

Every scenario below is *modeled on* a publicly documented, widely-reported
attack pattern from 2023–2026 — the tactic, not a specific victim. Never name
a real breached company, real threat-actor group by their exact operator
identity, or reproduce a real IOC (hash, domain, IP) in student-facing
content. The pattern is what's pedagogically valuable and Security+-testable;
the attribution is not, and attributing it invites both legal exposure and
staleness as the specific incident ages out of relevance.

### 3.3 Per-module flagship scenario

| # | Module | Flagship scenario | Modeled on (pattern, not victim) | Primary simulator surfaces | Key ATT&CK techniques |
|---|---|---|---|---|---|
| 02 | Network, Identity & Security Foundations | MFA push-bombing against a Mission Next Labs admin account, followed by a conditional-access policy review | 2022–2024 wave of MFA-fatigue/push-bombing intrusions against enterprise SSO | `entra/conditional-access`, `entra/identity-protection`, `defender/identity` | T1621 (MFA Request Generation), T1078 (Valid Accounts) |
| 03 | SIEM & Log Analysis | Cross-source correlation of a slow, low-and-slow account takeover that only becomes visible when identity, sign-in, and cloud-resource logs are read together | Modern cloud identity attacks where no single log source shows the full picture | `sentinel/logs`, `sentinel/hunting/authentication`, `sentinel/analytics` | T1078.004 (Cloud Accounts), T1114 (Email Collection) |
| 04 | Detection Rules, Threat Intelligence & Automated Monitoring | Tuning an over-firing detection rule around a commodity infostealer campaign, then deciding what a SOAR playbook may safely automate | 2024–2025 commodity infostealer/loader campaigns (fake-CAPTCHA "ClickFix"-style delivery, credential-stealer payloads) | `sentinel/analytics`, `defender/threat-analytics`, `sentinel/automation`, `defender/custom-detections` | T1204.001 (User Execution: Malicious Link), T1555 (Credentials from Password Stores) |
| 05 | Endpoint & Malware Investigation | Living-off-the-land investigation of a workstation compromised via a fake CAPTCHA/"paste this into Run" delivery chain, PowerShell → LOLBin → persistence | The "ClickFix" fake-verification malware-delivery trend (2024–2025), and LOLBin-based commodity loaders generally | `defender/devices`, `defender/hunting`, `defender/incidents` | T1204.001, T1059.001 (PowerShell), T1547.001 (Registry Run Keys) |
| 06 | Threat Hunting & Investigation | Proactive hypothesis-driven hunt for a dormant scheduled-task backdoor planted weeks earlier, discovered only by hunting, not by an alert | Supply-chain and dwell-time backdoor patterns (e.g. trojanized open-source packages, delayed-activation implants) | `sentinel/hunting`, `defender/hunting-graph`, `sentinel/watchlist` | T1053.005 (Scheduled Task), T1195 (Supply Chain Compromise) |
| 07 | Network & Email Analysis | QR-code phishing ("quishing") plus a vendor-impersonation invoice-fraud (BEC) attempt, traced through DNS beaconing to a newly registered domain | 2024–2025 rise of QR-code phishing bypassing link scanners, and ongoing business-email-compromise/invoice-fraud patterns | `defender/email-collab`, `defender/email-collab/threat-explorer/campaigns`, `sentinel/hunting/dns` | T1566.002 (Phishing: Spearphishing Link), T1071.001 (Web Protocols) |
| 08 | Vulnerability Findings & SOC Prioritization | Mass-exploitation window on an internet-facing edge appliance; the SOC must prioritize using CVSS, EPSS-style exploitability, and KEV-style known-exploited status rather than CVSS alone | The recurring 2023–2025 pattern of mass exploitation of edge devices (VPN/file-transfer/network appliances) within days of CVE disclosure | `defender-cloud/recommendations`, `defender/exposure`, `defender-cloud/attack-paths` | T1190 (Exploit Public-Facing Application) |
| 09 | Incident Response | Active ransomware encryption in progress — containment decisions under time pressure, mapped explicitly to the NIST SP 800-61 lifecycle | Modern ransomware-as-a-service double-extortion affiliate operations | `defender/incidents`, `defender/action-center`, `sentinel/incidents` | T1486 (Data Encrypted for Impact), T1489 (Service Stop) |
| 10 | Incident Evidence Handling, Chain of Custody & Case Documentation | Post-containment evidence collection and full ATT&CK mapping of the **same** ransomware case from Module 09 | Standard post-incident forensic reconstruction practice | `defender/hunting-graph`, `sentinel/mitre` | Full kill-chain mapping of the Module 09 case |
| 11 | SOC Operations, Metrics, Reporting & Communication | Executive briefing and SOC health metrics review in the week after the **same** ransomware case closes | Standard post-incident executive reporting and SOC KPI review practice | `sentinel/workbooks`, `sentinel/soc-optimization` | — (reporting/communication objective, not technical) |
| 12 | Capstone — Operation Amber Finch (`INC-4821`) | Full kill chain integrating the patterns above: quishing/MFA-fatigue initial access → LOLBin execution → scheduled-task persistence → discovery/lateral movement → ransomware impact → containment → forensics/ATT&CK mapping → executive report and closure | Composite of the same 2024–2025 pattern set used across Modules 02–11, at enterprise scale | All of the above | Full chain — see `moduleTwelveScore()`'s existing 10-domain rubric |

Modules 09, 10, and 11 sharing one incident file across three modules is a
deliberate authoring-efficiency choice: build the case once, in Module 09,
with a complete evidence set, and have Modules 10 and 11 consume different
slices of the same evidence for different objectives (forensics/custody vs.
metrics/communication). This also directly rehearses the capstone's shape
before the student reaches it.

## 4. Per-module upgrade contract (what "Module 1 parity" means, concretely)

For each of Modules 02–11, "done" means all of the following, mirroring
`MODULE_01_ENHANCEMENT_BRIEF.md`'s acceptance-criteria style:

1. Every existing lecture/topic block is converted into the same four-part
   loop Module 1 uses: **scenario → theory → knowledge check (3–5 questions,
   with per-answer feedback, not just correct/incorrect) → applied task**
   (a short free-text task requiring the student to apply the idea to that
   module's flagship scenario, not a generic prompt).
2. A **second, independent lab** is added alongside the existing one, using a
   fresh incident in the same flagship-scenario family (mirroring Module 1's
   Lab 1 guided-triage → Lab 2 independent-escalation split). The second lab
   must not reuse Lab 1's exact decision path.
3. The module's "Security+ Objectives Summary" block is rewritten against the
   crosswalk in §2 — same domain numbers and language across every module,
   not independently worded per module as today.
4. A curated sources list is added or reviewed against Module 1's pattern
   (NIST, CISA, MITRE ATT&CK, vendor docs, OWASP as applicable) — supplementary
   references, not proprietary exam content.
5. The existing module-level randomized quiz bank is audited against
   `course_SOC_standardized.md` §5's Security+ reasoning style (BEST/MOST/
   FIRST-action phrasing, plausible distractors, scenario-based framing) and
   rewritten where it currently tests recall instead of reasoning.
6. **Instructional-minute budget is preserved.** `CURRICULUM_MAP.md`'s locked
   totals (82 hours program-wide; each module's theory/lab split) do not
   change without compliance sign-off — see Guardrails (§6). Converting an
   existing lecture block into the four-part loop, or splitting existing
   lecture time into a second lab, must net to the same or a documented,
   separately-approved new total for that module. Do not silently inflate a
   module's advertised hours.

Module 12 gets a narrower, capstone-specific version of this (§5, Sprint 12):
narrative continuity with Modules 09–11's shared incident, and a decision on
the "single rubric" vs. "12-stage tracker" discrepancy from §1.

## 5. Sprint-by-sprint plan

Each sprint follows the brief → build → progress-log pattern already proven
on Module 1: write a short `MODULE_0N_ENHANCEMENT_BRIEF.md` (or extend this
document's per-module row if the team prefers one file), build against it,
then log what actually shipped the way `MODULE_01_ENHANCEMENT_PROGRESS.md`
does, and verify against the acceptance criteria before moving on. Do not
start a module's sprint until the previous one is verified — Modules 09–11
and 12 specifically depend on prior modules' evidence-set decisions.

| Sprint | Scope | Depends on | Key deliverable |
|---|---|---|---|
| 2 | Reusable scaffolding: audit existing ransomware/phishing content in modules 04/06/07/10/11 for reuse; confirm/extend the Mission Next Labs asset-naming and `INC-####` numbering convention; get curriculum-reviewer eyes on §2's crosswalk before it's cited in student-facing copy | — | A short addendum note in this doc (or a reviewer sign-off entry) confirming the crosswalk and continuity plan are cleared to build against |
| 3 | Module 02 — Network, Identity & Security Foundations | 2 | Four-part lesson loop, second lab (MFA push-bombing + conditional-access review), crosswalk block rewritten |
| 4 | Module 03 — SIEM & Log Analysis | 3 | Same, cross-source correlation scenario |
| 5 | Module 04 — Detection Rules, Threat Intelligence & Automated Monitoring | 2 | Same, reusing/upgrading existing content per Sprint 2's audit |
| 6 | Module 05 — Endpoint & Malware Investigation | 2 | Same, ClickFix/LOLBin scenario |
| 7 | Module 06 — Threat Hunting & Investigation | 2 | Same, reusing/upgrading existing content per Sprint 2's audit |
| 8 | Module 07 — Network & Email Analysis | 2 | Same, reusing/upgrading existing content per Sprint 2's audit |
| 9 | Module 08 — Vulnerability Findings & SOC Prioritization | 2 | Same, edge-device mass-exploitation scenario |
| 10 | Module 09 — Incident Response | 2, 9 | Builds the shared ransomware incident evidence set that Modules 10, 11, and 12 will consume |
| 11 | Module 10 — Incident Evidence Handling, Chain of Custody & Case Documentation | 10 | Reuses Sprint 10's incident; reusing/upgrading existing content per Sprint 2's audit |
| 12 | Module 11 — SOC Operations, Metrics, Reporting & Communication | 10 | Reuses Sprint 10's incident; reusing/upgrading existing content per Sprint 2's audit |
| 13 | Module 12 — Capstone narrative pass | 3–12 | Resolve the single-rubric-vs-12-stage-tracker discrepancy (§1); weave in explicit callbacks to the specific scenarios built in Sprints 3–12 so the capstone reads as a culmination, not a standalone case |
| 14 | Final QA sweep | 13 | Re-verify total program hours still reconcile to the locked 82-hour baseline; confirm every module's Security+ block cites the same §2 crosswalk language; run through each module as a student once end-to-end |

Sprints 5, 7, 8, 11, and 12 are lighter than 3, 4, 6, 9, and 10 because they
build on content that already partially exists (per the fork's finding that
modules 04, 06, 07, 10, 11 already contain ransomware/phishing material) —
confirm actual scope during Sprint 2's audit rather than assuming a full
rewrite is needed.

### Sprint 2 checkpoint — 2026-09-10

The continuity audit is complete and recorded in
`SPRINT_02_SCENARIO_CONTINUITY_AUDIT_2026-09-10.md`. Existing phishing and
related investigation patterns in Modules 04, 06, 07, 10, and 11 were mapped
for reuse; Modules 07, 10, and 11 have module-local organization, asset, and
case identifiers that must be normalized or explicitly aliased during their
future sprints. No existing content was discarded, no application code or
instructional minutes changed, and no new incident number was assigned.

`MODULE_02_ENHANCEMENT_BRIEF.md` is ready for Sprint 3. The §2 crosswalk and
continuity plan remain pending curriculum/compliance/faculty reviewer sign-off;
that approval has not been inferred or recorded here.

### Sprint 3 checkpoint — 2026-09-10

Module 02 enhancement is implemented and logged in
`MODULE_02_ENHANCEMENT_PROGRESS.md`. The eight foundation concepts now use the
scenario → theory → three-question check with feedback → applied-task loop. The
existing 180-minute guided trust-path lab remains available, and an independent
fictional MFA push-bombing / conditional-access lab was added inside that same
locked allocation; the module remains 660 minutes / 11 hours. The randomized
module quiz and source list were reviewed, with the external Security+ page
clearly marked as supplementary draft reference only. The §2 crosswalk was not
promoted because reviewer sign-off is still pending.

Verification passed: Module 02 syntax, `portal-check.js 2`, diff whitespace,
and local portal HTTP health. Sprint 4 and all later sprints remain out of scope.

### Sprint 4 checkpoint — 2026-09-10

Module 03 enhancement is implemented and logged in
`MODULE_03_ENHANCEMENT_PROGRESS.md`. The four existing SIEM lessons now use
scenario → theory → feedback knowledge check → applied task loops. The
existing assisted service-account correlation lab remains available, and an
independent fictional low-and-slow cloud-mailbox/session takeover lab was
added with a separate signal/scope/preservation decision path. Module 03 now
advertises two lab surfaces while retaining the locked 465-minute module
allocation and existing 240-minute lab allocation; no instructional minutes
were added. The randomized quiz was retained after review because it already
uses scenario reasoning, plausible distractors, feedback, and retries. The
crosswalk remains a developer draft pending curriculum/compliance/faculty
review and is not asserted as approved or affiliated.

Verification passed: Module 03 syntax, `portal-check.js 3`, full route render
(`dead NAV routes: 0`), and diff whitespace. Sprint 5 and all later sprints
remain out of scope.

### Sprint 5 checkpoint — 2026-09-10

Module 04 enhancement is implemented and logged in
`MODULE_04_ENHANCEMENT_PROGRESS.md`. The existing assisted authentication
detection studio remains intact; its four theory allocations now expose
scenario → theory → feedback knowledge check → applied task loops. A distinct
independent fake-verification loader lab (`INC-4404`) was added alongside the
guided rule/enrichment path. Both lab surfaces remain inside the locked
120-minute lab allocation; Module 04 remains 300 minutes total (180 theory /
120 lab) and no program minutes were added. The randomized quiz and
supplementary sources were reviewed; the §2 crosswalk remains a developer
draft pending curriculum/compliance/faculty review.

Verification passed: Module 04 syntax, `portal-check.js 4`, and the Module 04
catalog/static checks. Sprint 6 and all later sprints remain out of scope.

### Sprint 6 checkpoint — 2026-09-10

Module 05 enhancement is implemented and logged in
`MODULE_05_ENHANCEMENT_PROGRESS.md`. All ten endpoint-investigation topics now
use embedded scenario → theory → feedback knowledge check → applied-task
loops, anchored to a fictional Mission Next Labs fake-CAPTCHA → PowerShell →
LOLBin → persistence chain. The existing guided endpoint workbench remains,
and a distinct independent CAPTCHA-to-persistence decision lab was added. Both
surfaces remain within the locked 270-minute / 4-hour-30-minute module and its
existing 120-minute lab allocation; no instructional minutes were added.

The randomized quiz and source list were reviewed, and the Security+ mapping
is explicitly a supplementary developer draft pending curriculum/compliance/
faculty review. No endorsement, affiliation, pass guarantee, real victim,
operator identity, live IOC, or real endpoint action is asserted.

Verification passed: Module 05 syntax, `portal-check.js 5`, full route render
(`views: 129/129 render clean; dead NAV routes: 0`), and diff whitespace.
Sprint 7 and all later sprints remain out of scope.

### Sprint 7 checkpoint — 2026-09-10

Module 06 enhancement is implemented and logged in
`MODULE_06_ENHANCEMENT_PROGRESS.md`. Its four existing threat-hunting lessons
now expose scenario → theory → feedback knowledge check → applied-task loops,
anchored to a fictional Mission Next Labs hunt for a dormant scheduled-task
backdoor with no alert. The existing guided cross-device hunt remains intact,
and a separate independent scheduled-task review lab uses different evidence,
scope, and disposition decisions. Both surfaces remain within the locked
165-minute / 2-hour-45-minute module and the existing 90-minute lab allocation;
the independent catalog entry is `minutes: 0`.

The randomized reasoning quiz and supplementary source list were retained and
reviewed. The crosswalk remains a developer draft pending curriculum,
compliance, and faculty review; no certification, affiliation, pass guarantee,
real victim, operator, or live-indicator claim was added. Verification is
recorded in `MODULE_06_ENHANCEMENT_PROGRESS.md`; Sprint 8 and later remain out
of scope.

### Sprint 8 checkpoint — 2026-09-10

Module 07 enhancement is implemented and logged in
`MODULE_07_ENHANCEMENT_PROGRESS.md`. The existing four-part lesson loop and
email/network workbench now use a fictional QR-phishing/vendor-invoice fraud
case: vendor identity misalignment, a QR/HTML artifact, message trace, and a
first-seen domain traced through DNS beaconing and matching TLS activity. A
distinct independent transfer case is visible and catalogued at `minutes: 0`
inside the existing allocation. No instructional minutes or program totals
changed, and the crosswalk remains a supplementary developer draft pending
curriculum/compliance/faculty review. No real victims, live indicators,
operators, or certification claims were introduced.

Verification passed: Module 07 syntax, `portal/data.js` syntax,
`portal-check.js 7`, full route render (`views: 129/129 render clean; dead NAV
routes: 0`), and diff whitespace. Sprint 9 and later remain out of scope.

## Curriculum scenario Sprint 9 — Module 08 enhancement (2026-09-10)

Module 08 now has four scenario → theory → feedback knowledge-check →
applied-task loops for its existing vulnerability lessons, retaining the exact
30/30/20/25 theory-minute ledger. Lab 1 remains the six-finding contextual
prioritization workbench. Lab 2 is an independent fictional internet-facing
edge-appliance mass-exploitation queue using CVSS, EPSS-style likelihood,
known-exploited context, reachability, impact, controls, ownership, and retest
reasoning. Both labs remain 150 minutes and the module remains 405 minutes;
no instructional minutes were added. The crosswalk remains a supplementary
developer draft pending curriculum/compliance/faculty review and is not
presented as approval or affiliation. No real victim, operator, IOC, or live
remediation action was added. See `MODULE_08_ENHANCEMENT_PROGRESS.md` for
verification. Sprint 10 and later remain out of scope.

### Sprint 10 checkpoint — 2026-09-10

Module 09 enhancement is implemented and logged in
`MODULE_09_ENHANCEMENT_PROGRESS.md`. The guided response lab now uses the
active fictional Mission Next Labs ransomware case `INC-4937` (Operation Cedar
Lock), with bounded endpoint, identity, and service-disruption evidence and
explicit NIST lifecycle decisions. A separate independent response drill uses
`INC-4942` and its own state, scoring, and handoff; the module remains exactly
150 minutes by allocating 75 minutes to the guided lab and 45 minutes to the
independent lab.

The browser-local contract `MISSION_NEXT_M09_EVIDENCE_CONTRACT` is the formal
handoff for Sprints 11–13: stable incident/entities/evidence IDs are recorded,
consumer slices are named for Modules 10, 11, and 12, and the contract states
what is not established. No downstream module was edited in Sprint 10. All
scenario content remains synthetic: no real victim, operator, attribution,
live IOC, or certification/crosswalk approval claim is made. Sprint 11 may
consume the contract; Sprint 12 and later remain out of scope here.

### Sprint 11 checkpoint — 2026-09-10

Module 10 now consumes the M09 `INC-4937` contract rather than maintaining its
former independent phishing/persistence case. Its custody lab uses only the
declared `M09-E01`–`M09-E05` consumer slice, and its second lab reconstructs the
bounded encryption → service-stop → containment sequence with evidence-backed
ATT&CK behavior mapping. Both lessons expose Scenario → Theory → Knowledge check
→ Applied task loops; locked minutes remain unchanged. Verification passed via
`node --check portal/soc-analyst-module-10.js`, `node bin/portal-check.js 10`,
and `node bin/render_all.js` (129/129, zero dead routes). No Module 11/12 work,
approval claim, real victim/operator, attribution, or live IOC was added.

### Sprint 12 checkpoint — 2026-09-10

Module 11 now consumes the declared `INC-4937` / Operation Cedar Lock Module
11 slice from `MISSION_NEXT_M09_EVIDENCE_CONTRACT`: `M09-E01`, `M09-E03`,
`M09-E06`, `M09-E07`, and `M09-E08`. The SOC Metrics Dashboard is framed as a
post-closure health review, while the independent Executive Incident Report
uses the same bounded records to brief `ws-173`, `acct-173`, and `fs-02`.
The former standalone `CASE-11-27` report data is no longer the scored case
source. All three existing lessons now expose Scenario → Theory → Knowledge
check → Applied task cards, including source-review reasoning and per-answer
feedback. The existing two lab keys, separate persisted states, 195-minute
module total, and 60/60 lab allocations are unchanged. The Domain 5 primary /
Domain 4 secondary language is explicitly supplementary developer draft
material pending curriculum/compliance/faculty review; it does not claim
approval, certification affiliation, endorsement, or a pass guarantee. No
real incident, live IOC, operator identity, attribution, or Module 12 work was
added. Verification passed via module syntax, `portal-check.js 11`, lab-state
isolation checks, full route rendering (129/129, zero dead routes), and diff
whitespace checks. See `MODULE_11_ENHANCEMENT_BRIEF.md` and
`MODULE_11_ENHANCEMENT_PROGRESS.md`. Sprint 13 / Module 12 remains next.

### Sprint 13 checkpoint — 2026-09-10

Module 12's narrative pass is implemented and logged in
`MODULE_12_ENHANCEMENT_PROGRESS.md`. The architecture discrepancy between a
single integrated rubric and a twelve-stage investigation tracker is resolved
with the least-risk option: the existing ten-domain rubric remains the sole
scoring/submission contract, while the existing twelve mission requirements
now render as a visible reviewed/open progress tracker. No new scored stages,
minutes, persistence contract, or completion behavior were introduced.

The capstone now explicitly closes the arc: M02–M08 callbacks identify the
identity, SIEM, detection, endpoint, hunting, network/email, and
prioritization practices being synthesized; M09 Operation Cedar Lock is named
as the response rehearsal consumed by M10 custody and M11 reporting, while
Amber Finch remains a composite independent case. Verification is recorded in
`MODULE_12_ENHANCEMENT_PROGRESS.md`. Final QA and archival remain pending.

### Sprint 14 checkpoint — 2026-09-10

Final QA is recorded in `FINAL_CURRICULUM_SCENARIO_QA_2026-09-10.md`. The
locked SOC ledger reconciles directly from `portal/data.js`: 1,800 theory
minutes + 2,400 lab minutes = 4,200 technical minutes (70 hours), plus 720
M360 minutes (12 hours), for 4,920 minutes / 82 hours. The declared 42-hour
theory / 40-hour lab split remains unchanged when the separately accounted
M360 companion is included.

The Security+ reference notes in Modules 01–11 were normalized to state that
the §2 mapping is a supplementary developer draft pending
curriculum/compliance/faculty review and is not an approval, affiliation,
endorsement, or pass guarantee. Module 12 has no Security+ reference block and
contains no certification claim. Automated/local end-to-end QA passed:
`portal-check.js`, `render_all.js` (129/129, zero dead routes),
`lab-state-check.js`, syntax checks, whitespace checks, and HTTP 200 checks.
The repository-wide `curriculum-check.js` still reports 69 known baseline
catalogue/schema mismatches (legacy IT Support records and the newer
zero-minute independent-lab rows); this was documented, not silently changed.
Sprint 14 is complete; archival remains a coordinator action.

## 6. Guardrails

- **No certification endorsement, partnership, or pass-guarantee language**,
  per `MODULE_STANDARD.md` §6. "Aligned to CompTIA Security+ (SY0-701)
  objectives" is fine; "prepares you to pass Security+" or any CompTIA
  affiliation/partnership claim is not, regardless of how the crosswalk in
  §2 is worded internally.
- **The crosswalk in §2 is a developer draft**, exactly like every other
  mapping in `CURRICULUM_MAP.md` — it needs the same curriculum/compliance/
  faculty review before it's treated as final, and before any current-catalog
  or marketing claim cites it.
- **Instructional-hour totals are locked** (82 hours program-wide) and are
  already used elsewhere (enrollment materials, Form 301 mapping). Do not
  let per-module enhancement work silently drift the total — flag any
  proposed net-new minutes for compliance sign-off before building it.
- **Never name a real breached organization or real threat-actor operator
  identity** in student-facing scenario content — model the pattern, not
  the victim (§3.2).
- Per `archive/README.md`, this document stays at the repo root, uncompleted,
  until every sprint in §5 is done and verified — do not archive it early.
