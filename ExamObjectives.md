# SC-200 — Exam Objectives (scope for SC-200_lab)

**Certification:** Microsoft Certified: Security Operations Analyst Associate
**Exam:** SC-200
**Level:** Intermediate · **Role:** Security Operations Analyst · **Renewal:** 12 months
**Reference checked:** Microsoft Learn cert page, last-updated 2026-04-16
(English-language objectives refresh scheduled 2026-07-28 — re-verify after that.)

This document is the **source of truth for what the SC-200_lab must simulate.**
Every lab view, mock dataset, and scenario should map back to one of the
skill areas or product surfaces below.

## Candidate profile (what the exam assumes you can do)
- Reduce organizational risk through **triage, incident response,
  threat hunting, and detection engineering**.
- Monitor, identify, investigate, and respond to threats across
  **multi-cloud + on-prem** using the products listed below.
- Hunt with **KQL** and **Sentinel Graph**.
- Automate response to threats (playbooks, automation rules).
- Collaborate with security leadership on standards and posture.

Assumed familiarity: Microsoft security/compliance/identity solutions,
M365, Azure, AI agents/Copilots, Windows / Linux / mobile OS.

## Exam domains (three skill areas)
1. **Manage a security operations environment** — onboarding workloads
   and data sources, configuring connectors and policies, tuning alerts
   (suppression rules, exclusions), managing roles/RBAC, content/solutions
   in Sentinel, posture configuration in Defender for Cloud, Purview
   policy setup.
2. **Respond to security incidents** — triage queues across Defender XDR
   and Sentinel, multi-alert incident correlation, MITRE ATT&CK mapping,
   evidence/entity review, manual + automated response actions, case
   classification and closure.
3. **Perform threat hunting** — KQL across DeviceProcessEvents /
   EmailEvents / SigninLogs / CloudAppEvents / etc., saved/scheduled
   queries, hunting bookmarks, Sentinel Graph for entity-centric pivoting,
   custom analytics rules from hunting queries.

## Product surfaces the lab must mirror
- **Microsoft Defender XDR** (`security.microsoft.com`)
  Incidents · Alerts · Advanced hunting · Threat analytics · Secure score ·
  Action center · Submissions · Suppression rules · Email & collab ·
  Endpoints · Identities · Cloud apps · Attack surface management.
- **Microsoft Defender for Endpoint** (folded into XDR view)
  Device inventory · Investigations · Live response · Indicators ·
  Web content filtering · Custom detection rules.
- **Microsoft Sentinel** (in Azure portal, but with its own chrome)
  Overview · Incidents · Workbooks · Hunting · Notebooks · Entity behavior ·
  Threat intelligence · MITRE ATT&CK · Content hub · Repositories ·
  Workspace manager · Data connectors · Analytics rules · Watchlists ·
  Automation (playbooks + rules) · Sentinel Graph.
- **Microsoft Defender for Cloud** (Azure portal)
  Overview · Security posture / Secure score · Recommendations ·
  Regulatory compliance · Workload protections · Security alerts ·
  Inventory · DevOps security.
- **Microsoft Purview** (`purview.microsoft.com`)
  Data loss prevention (policies/incidents) · Insider risk management ·
  Information protection (sensitivity labels) · Communication compliance ·
  eDiscovery · Records management · Audit · Data lifecycle management.
- **Microsoft Entra ID** (identity surface used in many scenarios)
  Sign-in logs · Audit logs · Risky users / sign-ins (Identity Protection) ·
  Conditional Access overview · Role assignments.
- **Microsoft Security Copilot** (AI-assisted investigation)
  Prompt-based incident summarization, KQL drafting, hunting expansion,
  cross-product Q&A. Optional in the lab — represent with a side panel.

## Scenario archetypes the lab should support
These are the recurring patterns SC-200 questions test, and they should
be playable in the lab as walk-throughs:

1. **Tune a noisy detection** — alert suppression rules with multi-
   condition logic (AND), exclusions, and the gotcha of pinning rules
   on volatile indicators (hashes that rotate on vendor update).
   _Already implemented as the scanner.exe scenario._
2. **Triage a multi-alert incident** — open an incident that bundles
   2–4 alerts, walk through evidence, classify, assign, resolve.
3. **DCSync / identity attack** — Defender for Identity alert for
   directory replication from a non-admin account; pivot to user, device,
   IP entities; recommend response.
4. **Phishing → OAuth consent abuse** — MDO alert on URL click + MDA
   alert on risky consent grant, correlated into one incident; revoke
   tokens, remove consent.
5. **Hunt across endpoints with KQL** — find suspicious processes in
   `C:\Users\Public`, join with sign-in data, save as a custom detection.
6. **Promote hunt to analytics rule (Sentinel)** — take a KQL query,
   schedule it, set entity mappings, MITRE tactics.
7. **Posture remediation (Defender for Cloud)** — review a high-severity
   recommendation (e.g. "Storage accounts should disable public network
   access"), see affected resources, mark exemption.
8. **DLP policy match (Purview)** — file with credit-card content
   blocked from external share; review DLP incident, override workflow.
9. **Insider risk** — departing user downloads large volume from
   SharePoint; review the case, escalate to eDiscovery.
10. **Audit search** — search M365 audit log for a specific operation
    and user across a time window.

## Front-portal experience (lab landing)
The lab opens on **Defender XDR Home** — the same view an analyst would
see when starting a shift. That landing must show, at minimum:
- Active incident count by severity, with click-through to queue
- New alert count + a small preview list
- Secure score donut (Defender for Cloud + identity)
- Threat analytics teaser tiles for active campaigns
- A "Copilot" prompt entry (decorative)
- App switcher (waffle) to jump to Sentinel / Defender for Cloud / Purview

## What this drives in the build
Each scenario archetype above needs at least one mock dataset entry
and a view that lets the user click through it. Routes already planned
in HANDOFF.md cover these surfaces. When a route doesn't yet exist for
a scenario, add it.

## Out of scope for the lab
- Real authentication, real Graph/ARM calls, real KQL execution
- Anything beyond the SC-200 syllabus (no Intune device config, no
  Power Platform admin, no Defender for IoT deep dives)
- Reproducing Microsoft's proprietary portal code — the lab is built
  from scratch as a faithful look-alike
