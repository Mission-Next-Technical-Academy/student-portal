# SC-200 Learn-Link Coverage Sweep

Agent 11 report, 2026-07-06. Source corpus:
`/home/alex/sc-200_app/sc-200_microsoft_learn_links.txt`, generated
2026-07-03. This is a report-only sweep; no `ui/` files were changed.

Coverage meanings:

- **Full**: an interactive route exists with fictional data or controls that
  let the learner practice the topic locally.
- **Partial**: the lab has a fixture, study card, secondary surface, or
  adjacent workflow, but not the full hands-on topic.
- **Missing**: no clear lab surface exists.

## 1. Official SC-200 Hub / Exam / Certification Links

| Topic | Coverage | Lab route(s) | Notes |
| --- | --- | --- | --- |
| Study guide and skills outline | Full | `ExamObjectives.md`, `OBJECTIVES_DELTA.md` | Scope docs track the 2026-06-26 guide and 2026-07-28 outline. |
| Certification, exam, course, renewal, practice assessment, exam sandbox | Missing | None | These are exam logistics, not simulated in the lab. A lightweight study-planner/support page could cover them if desired. |

## 2. Exam Readiness Zone Videos

| Topic | Coverage | Lab route(s) | Notes |
| --- | --- | --- | --- |
| Manage security operations environment | Full | `#/defender/settings`, `#/sentinel/data-connectors`, `#/sentinel/workspace-manager`, `#/purview/settings` | Core environment and configuration surfaces exist. |
| Configure protections and detections | Full | `#/defender/asr-policy`, `#/defender/custom-detections`, `#/sentinel/analytics`, `#/sentinel/anomalies` | Detection-building and ASR workflows are interactive/static-lab complete. |
| Manage incident response | Full | `#/defender/incidents`, `#/defender/action-center`, `#/defender/cases`, `#/sentinel/incidents` | Incident queues, panels, cases, and action review are represented. |
| Manage security threats / hunting | Full | `#/defender/hunting`, `#/defender/hunting-graph`, `#/sentinel/hunting`, `#/sentinel/graph` | Hunting and graph investigation routes exist. |

## 3. SC-200 Microsoft Learn Training Paths

| Topic | Coverage | Lab route(s) | Notes |
| --- | --- | --- | --- |
| Defender XDR path | Full | `#/defender/home`, `#/defender/incidents`, `#/defender/alerts`, `#/defender/hunting`, `#/defender/threat-analytics`, `#/defender/settings`, `#/defender/air` | Incidents, alerts, AIR, hunting, threat analytics, secure score, and portal configuration are covered. |
| Defender for Endpoint path | Full | `#/defender/devices`, `#/defender/device`, `#/defender/endpoints`, `#/defender/settings`, `#/defender/asr-policy` | Device inventory, timeline, response actions, live response, packages, RBAC/groups, ASR, automation, and vulnerability context are present. |
| Defender for Cloud path | Full | `#/defender-cloud/overview`, `#/defender-cloud/setup`, `#/defender-cloud/alerts`, `#/defender-cloud/inventory`, `#/defender-cloud/attack-paths`, `#/defender-cloud/recommendations`, `#/defender-cloud/regulatory` | Workload alerts and response are strongest; posture remains supporting content per current exam emphasis. |
| Purview path | Full | `#/purview/dlp`, `#/purview/insider-risk`, `#/purview/audit`, `#/purview/ediscovery`, `#/purview/graph-activity` | DLP, insider risk, Audit, Content search, and Graph activity investigation are covered. |
| Security Copilot path | Partial | Topbar Copilot panel, guided scenario overlay, `#/purview/ai-hub` | Embedded prompts and a static agentic investigation flow exist; standalone Copilot owner settings, workspaces, plugins, knowledge bases, and custom promptbooks are not full routes. |
| Sentinel environment path | Full | `#/sentinel/home`, `#/sentinel/settings`, `#/sentinel/workspace-manager`, `#/sentinel/logs`, `#/sentinel/watchlist`, `#/sentinel/threat-intel`, `#/sentinel/data-connectors` | Workspace, logs, watchlists, TI, integration, and connector topics are represented. |
| Sentinel KQL path | Partial | `#/sentinel/hunting`, `#/sentinel/hunting/dns`, `#/sentinel/logs`, `#/defender/hunting` | The lab supports selected KQL subsets and fixtures, but not broad KQL syntax such as full joins, unions, parsing functions, or visual render operators. |
| Sentinel data connector path | Full | `#/sentinel/data-connectors`, `#/sentinel/content-hub`, `#/sentinel/logs` | Microsoft services, Defender XDR, Windows Security Events, WEF planning, Syslog, CEF, TI, Azure Activity, and custom log ingestion are covered as local workflows. |
| Sentinel detection/investigation path | Full | `#/sentinel/analytics`, `#/sentinel/anomalies`, `#/sentinel/automation`, `#/sentinel/incidents`, `#/sentinel/entity-behavior`, `#/sentinel/workbooks`, `#/sentinel/content-hub` | Analytics, automation, playbooks, incidents, UEBA, ASIM DNS, workbooks, and content hub are present. |
| Sentinel threat hunting path | Full | `#/sentinel/hunting`, `#/sentinel/search`, `#/sentinel/data-lake-jobs`, `#/sentinel/notebooks`, `#/sentinel/graph`, `#/sentinel/mitre` | Hunting, search jobs, Data lake jobs, notebooks/MCP notes, graph, and MITRE coverage exist. |

## 4. Microsoft Defender XDR Modules

| Topic | Coverage | Lab route(s) | Notes |
| --- | --- | --- | --- |
| Defender XDR introduction and SOC portal | Full | `#/defender/home`, app switcher, workload shell | The landing page mirrors an analyst shift-start surface. |
| Incident and alert mitigation | Full | `#/defender/incidents`, `#/defender/incident`, `#/defender/alerts` | Queue, side panel, attack story, evidence, entities, and alert detail are covered. |
| Automated investigations and action center | Full | `#/defender/air`, `#/defender/action-center` | AIR and action approval/review surfaces exist. |
| Advanced hunting | Full | `#/defender/hunting`, `#/defender/custom-detections`, `#/defender/hunting-graph` | Includes table selection, saved queries, mock execution, custom detections, and graph concepts. |
| Entra sign-in and identity risk investigation | Full | `#/defender/identity-protection`, `#/defender/identities`, `#/defender/identity` | Risky sign-ins, detections, and response classification are represented. |
| Secure score | Full | `#/defender/secure-score` | Score summary and improvement actions exist. |
| Threat analytics and reports | Full | `#/defender/threat-analytics`, `#/defender/reports` | Threat analytics has detailed report cards; reports is a secondary route. |
| Portal configuration | Full | `#/defender/settings`, `#/defender/notifications`, `#/defender/alert-tuning` | Settings, notifications, and tuning are explicitly covered. |
| Defender for Office 365 investigation | Full | `#/defender/email-collab`, `#/defender/incidents` | Delivered-email investigation and phishing-to-OAuth incident coverage exist. |
| Defender for Identity | Full | `#/defender/identities`, incident side panel | DCSync and identity-attack investigation paths exist. |
| Defender for Cloud Apps | Full | `#/defender/cloud-apps` | Risky OAuth app investigation is tied to the phishing incident. |

## 5. Microsoft Defender for Endpoint Modules

| Topic | Coverage | Lab route(s) | Notes |
| --- | --- | --- | --- |
| MDE deployment, access, roles, device groups, advanced features | Full | `#/defender/settings`, `#/defender/endpoints` | Settings route includes roles, groups, and advanced features. |
| ASR / Windows security enhancements | Full | `#/defender/asr-policy` | Audit/block states, exclusions, and per-rule behavior are represented. |
| Device inventory and investigations | Full | `#/defender/devices`, `#/defender/device` | Inventory, device detail, timeline, process tree, tags, and settings tabs exist. |
| Device response actions | Full | `#/defender/device`, `#/defender/action-center` | Live response, package collection, scan/isolation-style response, and action review are present. |
| Evidence and entity investigations | Full | Incident side panel, `#/defender/identity`, `#/defender/hunting-graph` | File, user, IP/domain, and relationship pivots are covered through fictional evidence. |
| Automation management | Full | `#/defender/settings`, `#/defender/air` | Automation levels, upload/settings context, AIR, and attack disruption are covered. |
| Alert/detection settings and indicators | Full | `#/defender/alert-tuning`, `#/defender/suppression`, `#/defender/notifications`, `#/defender/intel-explorer` | Suppression, notifications, tuning, and IOC-style intelligence are represented. |
| Vulnerability management | Partial | `#/defender/exposure`, `#/defender/devices`, `#/defender-cloud/recommendations` | Exposure and remediation context exists, but there is no deep vulnerability-management workflow. |

## 6. Microsoft Defender for Cloud Modules

| Topic | Coverage | Lab route(s) | Notes |
| --- | --- | --- | --- |
| Plan workload protections | Full | `#/defender-cloud/setup`, `#/defender-cloud/cloud-security`, `#/defender-cloud/environment` | Plans, workload categories, and environment settings are represented. |
| Connect Azure assets | Full | `#/defender-cloud/setup`, `#/defender-cloud/inventory`, `#/defender-cloud/environment` | Azure inventory and enablement context exist. |
| Connect non-Azure resources | Partial | `#/defender-cloud/setup`, `#/defender-cloud/environment` | AWS/GCP/non-Azure connector concepts are present at a study level, not as a detailed workflow. |
| Cloud security posture management | Full | `#/defender-cloud/overview`, `#/defender-cloud/recommendations`, `#/defender-cloud/regulatory`, `#/defender-cloud/workbooks` | Secure score, recommendations, compliance, and workbook context are present as supporting study content. |
| Cloud workload protection alerts and response | Full | `#/defender-cloud/alerts`, `#/defender-cloud/inventory`, `#/defender-cloud/attack-paths` | Alert triage, impacted resources, and attack path analysis are covered. |

## 7. Microsoft Purview Modules

| Topic | Coverage | Lab route(s) | Notes |
| --- | --- | --- | --- |
| DLP alert investigation and response | Full | `#/purview/dlp`, `#/defender/email-collab` | DLP alert lifecycle, evidence, and response/escalation are represented. |
| Insider risk alerts and cases | Full | `#/purview/insider-risk`, `#/purview/ediscovery` | Case evidence, activity, risk factors, and eDiscovery escalation exist. |
| Audit search and investigation | Full | `#/purview/audit` | Search form filters local audit rows by operation, user, workload, and IP. |
| Audit Premium export/retention/Copilot details | Partial | `#/purview/audit`, Copilot panel | Search is interactive; premium retention/export specifics and Audit Copilot are only adjacent. |
| eDiscovery Content search | Full | `#/purview/ediscovery` | Build, preview, and export workflow is present. |
| Graph activity logs | Full | `#/purview/graph-activity`, `#/defender/hunting` | Diagnostic-settings guidance and hunting rows exist. |

## 8. Microsoft Security Copilot Modules

| Topic | Coverage | Lab route(s) | Notes |
| --- | --- | --- | --- |
| Generative AI / prompt basics | Partial | Copilot side panel | Sample prompts and canned answers exist, but no standalone prompt-writing trainer. |
| Security Copilot concepts and enablement | Partial | Copilot side panel, `#/purview/ai-hub` | Embedded experience is represented; enablement, capacity, and owner settings are not full surfaces. |
| Standalone experience, sessions, workspaces, plugins, promptbooks, knowledge bases | Missing | None | This is the largest Copilot-specific gap. |
| Embedded Defender/Purview/Entra/Defender for Cloud experiences | Partial | Copilot side panel, guided scenario overlay, `#/purview/dlp`, `#/purview/insider-risk`, `#/defender/identity-protection` | Static embedded assistance exists, but product-specific Copilot entry points are not consistently surfaced on each route. |
| Guided simulations and agentic investigation | Full | Copilot side panel, guided scenario overlay | One multi-step agentic investigation and multiple guided scenarios are present. |

## 9. Microsoft Sentinel Environment Modules

| Topic | Coverage | Lab route(s) | Notes |
| --- | --- | --- | --- |
| Sentinel introduction and overview | Full | `#/sentinel/home` | Overview, data flow, and active lab flow are represented. |
| Workspaces, roles, settings, cross-workspace management | Full | `#/sentinel/settings`, `#/sentinel/workspace-manager` | Settings, UEBA enablement, workspace membership, and publish status are covered. |
| Logs and common tables | Full | `#/sentinel/logs`, `#/sentinel/hunting`, `#/sentinel/hunting/dns` | Sentinel logs, table-plan cards, custom tables, and ASIM DNS rows exist. |
| Watchlists | Full | `#/sentinel/watchlist` | Watchlist rows and detection use are represented. |
| Threat intelligence | Full | `#/sentinel/threat-intel`, `#/sentinel/data-connectors`, `#/sentinel/logs` | Indicator management, connectors, and KQL rows are present. |
| Defender XDR integration | Full | `#/sentinel/incidents`, `#/sentinel/workspace-manager`, `#/defender/incidents` | Unified queue and Defender lens are explicitly called out. |

## 10. KQL for Microsoft Sentinel Modules

| Topic | Coverage | Lab route(s) | Notes |
| --- | --- | --- | --- |
| Statement structure, search, where, let, project/order/take basics | Full | `#/sentinel/hunting`, `#/sentinel/hunting/dns`, `#/defender/hunting` | The lab includes runnable canned examples and a limited local evaluator. |
| Summarize and result analysis | Partial | `#/sentinel/summary-rules`, `#/sentinel/soc-optimization` | Summary concepts exist, but generic summarize practice is limited. |
| Multi-table KQL: union and join | Partial | `#/defender/hunting`, saved queries | Some saved queries demonstrate joins, but the local executor does not broadly evaluate them. |
| Data extraction, parsing, functions, external data | Partial | `#/sentinel/hunting/dns`, `#/sentinel/data-connectors`, `#/sentinel/logs` | ASIM parser notes and DCR transform concepts exist; broader parse/function labs are shallow. |
| Visualization/render operators | Partial | `#/sentinel/workbooks`, `#/sentinel/logs` | Workbooks and visual panels exist, but render-operator practice is not interactive. |

## 11. Microsoft Sentinel Data Connector Modules

| Topic | Coverage | Lab route(s) | Notes |
| --- | --- | --- | --- |
| Connector provider model and connected hosts | Full | `#/sentinel/data-connectors`, `#/sentinel/content-hub` | Connector rows and solution install/lab states exist. |
| Microsoft services connectors | Full | `#/sentinel/data-connectors`, `#/sentinel/logs` | Microsoft 365, Entra, Identity Protection, Azure Activity, and Defender XDR connector concepts are represented. |
| Windows Security Events via AMA / DCR | Full | `#/sentinel/data-connectors`, `#/sentinel/content-hub` | DCR event-set/xPath workflow is present. |
| Windows Event Forwarding planning | Full | `#/sentinel/data-connectors` | WEF vs AMA planning card exists. |
| Syslog via AMA | Full | `#/sentinel/data-connectors` | Syslog workflow is present. |
| CEF via AMA | Full | `#/sentinel/data-connectors`, `#/sentinel/logs` | CEF workflow and `CommonSecurityLog` fixture coverage exist. |
| Threat indicator connectors/API | Full | `#/sentinel/threat-intel`, `#/sentinel/data-connectors`, `#/sentinel/logs` | Defender TI, TAXII, upload/API style, and indicator rows are covered. |
| Custom logs via Logs Ingestion API | Full | `#/sentinel/data-connectors`, `#/sentinel/logs` | App registration, role, DCE/DCR endpoint choices, streams, transforms, and `_CL` output are represented. |

## 12. Microsoft Sentinel Detection / Investigation Modules

| Topic | Coverage | Lab route(s) | Notes |
| --- | --- | --- | --- |
| Analytics rules and templates | Full | `#/sentinel/analytics`, `#/sentinel/content-hub`, `#/sentinel/mitre` | Scheduled, NRT, TI, and ML-style rule types are represented. |
| Automation rules | Full | `#/sentinel/automation` | Automation rule details and playbook selection exist. |
| Playbooks | Full | `#/sentinel/automation` | Trigger/on-demand playbook examples and side-panel detail are present. |
| Incident management, evidence, entities | Full | `#/sentinel/incidents`, `#/sentinel/graph`, incident side panel | Sentinel incident queue, Defender lens, and entity graph exist. |
| UEBA / entity behavior | Full | `#/sentinel/entity-behavior`, `#/sentinel/settings`, `#/sentinel/anomalies` | UEBA enablement, entity risk, and anomalies are covered. |
| ASIM / normalization | Full | `#/sentinel/hunting/dns`, `#/sentinel/data-connectors` | ASIM DNS parser-style hunting and DCR notes are present. |
| Monitor and visualize data / workbooks | Full | `#/sentinel/workbooks`, `#/sentinel/logs` | Workbook detail panels and data rows exist. |
| Content hub and repositories | Full | `#/sentinel/content-hub`, `#/sentinel/repositories`, `#/sentinel/workspace-manager` | Content hub is hands-on; repositories are a secondary/support surface. |

## 13. Microsoft Sentinel Threat Hunting Modules

| Topic | Coverage | Lab route(s) | Notes |
| --- | --- | --- | --- |
| Threat hunting concepts and hypotheses | Full | `#/sentinel/hunting`, `#/sentinel/mitre`, guided scenario overlay | Hunting hypotheses and MITRE mapping are represented. |
| Query management and hunting | Full | `#/sentinel/hunting`, `#/sentinel/search`, `#/sentinel/hunting/dns` | Saved queries, search, and ASIM DNS hunting exist. |
| Bookmarks and livestream | Partial | `#/sentinel/hunting` | Hunting exists, but bookmark and livestream workflows are not distinct interactive controls. |
| Search jobs and historical restore | Partial | `#/sentinel/search`, `#/sentinel/data-lake-jobs` | Search/Data lake job concepts exist; restore historical data is not a separate workflow. |
| Notebooks | Full | `#/sentinel/notebooks` | Notebook use cases and Sentinel MCP Server notes are present. |

## 14. Primary Official Documentation Hubs

| Topic | Coverage | Lab route(s) | Notes |
| --- | --- | --- | --- |
| Security, Defender XDR, Defender for Cloud, Sentinel, Purview, Security Copilot, KQL documentation hubs | Partial | `README.md`, `ExamObjectives.md`, workload routes | The lab mirrors the major products and points to local objectives, but it does not maintain a full documentation-link hub. |

## 15. Objective-Mapped Documentation Links

| Topic | Coverage | Lab route(s) | Notes |
| --- | --- | --- | --- |
| Defender XDR configuration, automation, incidents, hunting | Full | `#/defender/settings`, `#/defender/notifications`, `#/defender/alert-tuning`, `#/defender/air`, `#/defender/incidents`, `#/defender/hunting`, `#/defender/custom-detections` | Objective-mapped XDR docs are covered by interactive surfaces. |
| Defender for Endpoint | Full | `#/defender/endpoints`, `#/defender/settings`, `#/defender/devices`, `#/defender/device`, `#/defender/asr-policy` | Endpoint configuration, actions, and investigations are covered. |
| Defender for Office 365 | Full | `#/defender/email-collab`, `#/defender/incidents` | Mail investigation and AIR-adjacent response are represented. |
| Defender for Identity | Full | `#/defender/identities`, `#/defender/identity`, incident side panel | Identity alert investigation is covered. |
| Defender for Cloud Apps | Full | `#/defender/cloud-apps` | Cloud app alert/OAuth investigation is covered. |
| Defender for Cloud | Full | `#/defender-cloud/alerts`, `#/defender-cloud/inventory`, `#/defender-cloud/attack-paths`, `#/defender-cloud/recommendations` | Workload alerts, response, and posture context exist. |
| Entra ID / Identity Protection | Full | `#/defender/identity-protection`, `#/defender/identities` | Risk investigation and detections are covered. |
| Purview | Full | `#/purview/audit`, `#/purview/ediscovery`, `#/purview/insider-risk`, `#/purview/dlp`, `#/purview/graph-activity` | Audit, Content search, DLP, insider risk, and Graph activity are covered. |
| Sentinel SIEM and platform | Full | `#/sentinel/home`, `#/sentinel/settings`, `#/sentinel/data-connectors`, `#/sentinel/analytics`, `#/sentinel/incidents`, `#/sentinel/automation`, `#/sentinel/workbooks`, `#/sentinel/watchlist`, `#/sentinel/notebooks`, `#/sentinel/entity-behavior`, `#/sentinel/content-hub`, `#/sentinel/soc-optimization` | Platform, ingestion, detection, investigation, and content topics are covered. |
| KQL and Advanced Hunting docs | Partial | `#/defender/hunting`, `#/sentinel/hunting`, `#/sentinel/hunting/dns`, `#/sentinel/logs` | Schema/table selection is strong; full KQL language coverage is intentionally limited by the local mock executor. |

## Biggest Remaining Gaps

1. **Security Copilot standalone administration**: owner settings, capacity/
   enablement, sessions, workspaces, plugins, custom promptbooks, and
   knowledge-base connections have no dedicated lab route.
2. **Exam logistics support**: certification, renewal, practice assessment,
   exam sandbox, and readiness-video tracking are outside the simulator.
3. **Advanced KQL breadth**: current evaluators cover selected examples, not
   full KQL semantics for joins, unions, summarize variations, parsing,
   functions, external data, or render operators.
4. **Sentinel hunting operations**: bookmarks, livestream, and historical
   restore are present only as adjacent hunting/search-job concepts.
5. **Defender Vulnerability Management depth**: exposure/remediation context
   exists, but there is no deep vulnerability-management workflow.
6. **Defender for Cloud multi-cloud onboarding depth**: non-Azure connector
   concepts are covered as setup context, not as a full onboarding lab.
7. **Purview Audit Premium depth**: standard audit search is interactive, but
   premium export, retention, and Copilot-specific audit investigation remain
   partial.

