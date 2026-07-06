# SC-200_lab — sprint handoff

Local-only static-files lab. No build step, no auth, no real network calls.
Serve from `~/defender-lab/ui/` with:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/`.

## Scope

`ExamObjectives.md` is the source of truth for exam coverage. Keep all new
features mapped to SC-200 objectives and scenario archetypes. Do not copy or
adapt proprietary Microsoft portal code; this repo uses original HTML/CSS/JS
to create a faithful local look-alike.

## Current architecture

Single-page app with hash routing.

- `ui/index.html` — shell, side panels, guide panel, script tags.
- `ui/styles.css` — workload themes, chrome, tables, panels, guided scenario
  and Copilot styles.
- `ui/data.js` — fictional incidents, alerts, hunting fixtures, policies,
  guided scenarios, and Copilot prompts.
- `ui/views.js` — view renderers for Defender, Sentinel, Defender for Cloud,
  and Purview.
- `ui/app.js` — router, sidenav, suppression engine, side-panel wiring,
  app switcher, guided scenario controller, Copilot panel controller.

State persists only to `localStorage` under `defender-lab.rules`.

## Done

- Multi-portal static SPA is functional across Defender XDR, Sentinel,
  Defender for Cloud, and Purview routes.
- Suppression rule scenario remains wired through Defender alerts, alert
  detail, and suppression rules.
- Guided scenario picker added to Defender home:
  - Tune a noisy detection
  - Triage a multi-alert incident
  - Hunt endpoint staging
  - Search the audit log
- Coach-mark overlay walks users across existing routes and can open alert or
  incident side panels without rewriting views.
- Security Copilot side panel added to the topbar sparkle button with four
  static prompt/answer pairs:
  - incident summary
  - KQL drafting
  - entity expansion
  - MITRE mapping
- README refreshed for the browser lab.
- `AGENTS.md` Agent B checklist marked complete.
- Agent A tasks complete:
  - `ui/data.js` now includes ransomware, AiTM phishing, container breakout,
    AAD risky sign-in, and S3-style cloud misconfiguration incidents.
  - Added 4 saved KQL queries with matching fixture rows.
  - Added Sentinel Graph node/edge fixture data for `INC-1042`.
  - Expanded `sentinel/workbooks`, `sentinel/automation`,
    `defender-cloud/alerts`, and `purview/information-protection`.
  - Wired `purview/audit` search controls to filter `AUDIT_LOG`.
  - Upgraded mock KQL execution to parse the leading table and simple
    `| where Field == "value"` filters.
  - `AGENTS.md` Agent A checklist marked complete.
- Added a Sentinel analytics rule wizard workspace opened from
  `#/sentinel/analytics` via "+ Create scheduled rule". It uses an original
  centered modal window with step tabs, a KQL query editor, query-result
  preview against mock fixtures, entity mapping, custom details, and alert
  details accordions.
- Added the Microsoft Defender portal incident-investigation workflow to the
  incident side panel: initial investigation, attack story, Go hunt, blast
  radius analysis, incident details, graph filtering, alerts, activities,
  assets, investigations, Evidence and Response, Summary, and Similar
  incidents. The content is stored as structured fictional lab guidance in
  `ui/data.js` and rendered from `ui/views.js`.
- Added an animated attack-story path to the incident side panel. Curated
  incidents render circular entity nodes, edge labels, chronological event
  cards, and Reset/Play controls so the learner can watch the attack unfold
  as alerts occurred.

## QA this pass

Ran:

```bash
node --check ui/data.js
node --check ui/views.js
node --check ui/app.js
curl -sS http://127.0.0.1:8765/ -o /dev/null -w "%{http_code}\n"
google-chrome --headless=new --no-sandbox --disable-gpu --dump-dom ...
firefox --headless --screenshot ...
```

Firefox/Selenium visual pass:

- 1366x768 and 1920x1080 Defender home screenshots.
- All registered routes loaded without "Page not found".
- Topbar contrast checked visually on dark theme.
- Copilot side panel opened and rendered prompt/answer content.
- Guided scenario overlay opened, navigated to Defender alerts, and opened
  alert A003.
- Long incident side panel scrolls correctly at 1366x768.
- Saved screenshots under `/tmp/defender-*.png`.
- 2026-06-28 Agent A pass: all 22 NAV routes rendered cleanly in headless
  Chrome and headless Firefox. No "Page not found" or obvious runtime
  errors were observed during initial route mount.
- 2026-06-28 analytics wizard pass: `node --check` clean, server returned
  200, and headless Chrome confirmed the Sentinel analytics route includes
  the wizard launcher and wizard dialog DOM.
- 2026-06-28 analytics wizard expansion: added a Sentinel entity picker,
  dynamic entity/identifier mappings, and query scheduling controls to the
  scheduled analytics rule wizard.
- 2026-06-28 analytics wizard navigation fix: tabs and Previous/Next/Create
  footer buttons now drive wizard steps; verified with headless Chrome CDP.
- 2026-06-28 Agent C pass: `OBJECTIVES_DELTA.md` exists and `AGENTS.md`
  marks the syllabus drift check and scenario validation complete.
- 2026-06-28 Defender incident workflow pass: added the incident side-panel
  workflow guide and blast-radius notes, then checked `ui/data.js`,
  `ui/views.js`, and `ui/app.js` with Node syntax checks.
- 2026-06-28 attack-story player pass: added curated attack paths for
  DCSync, phishing-to-OAuth, and ransomware incidents; wired side-panel
  playback controls for step-by-step node/path highlighting.
- 2026-06-28 attack-story browser check: headless Chrome CDP opened
  `INC-1042`, ran `playAttackStory('INC-1042')`, and confirmed 5 circular
  nodes, the active `DocViewer Pro` step, 4 seen nodes, 3 active edges, and
  the incident panel visible.
- 2026-06-28 Sentinel TI/MITRE lab pass:
  - Added a clean IOC-to-incident lab path across Sentinel Overview,
    Threat intelligence, Logs, Data connectors, Analytics, and MITRE ATT&CK.
  - Added harmless manual-import IOC fixtures for `203.0.113.10` and
    `bad-demo.example` in `ThreatIntelIndicators`.
  - Added `SyntheticTransactions_CL` fixture rows and IP/domain TI-map KQL
    queries.
  - Added a visible analytics rule, `TI map synthetic IOC to custom
    transaction events`, with entity mappings and MITRE techniques `T1071`
    and `T1566`.
  - Added explicit UI language that MITRE ATT&CK is a coverage view, not a
    connector.
  - Added connector rows for Defender Threat Intelligence, TAXII, and the
    non-connector MITRE coverage view.
  - Headless Chrome DOM checks confirmed `#/sentinel/threat-intel`,
    `#/sentinel/mitre`, `#/sentinel/data-connectors`, and `#/sentinel/logs`
    render expected content without "Page not found".
- 2026-06-28 Purview completion pass:
  - Expanded the Purview left navigation to match the current unified portal
    model with Home, Solutions, data security, risk/compliance, data
    governance, Audit, and Settings entries.
  - Added `#/purview/solutions` with Core, Data Security, Risk & Compliance,
    and Data Governance solution cards.
  - Expanded `#/purview/dlp` with a DLP incident queue, blocked external
    sharing scenario, sensitive-info evidence, policy-tip timeline, and
    override/escalation actions.
  - Expanded `#/purview/insider-risk` with case-level evidence, risk scores,
    and an explicit escalation path to eDiscovery.
  - Added `#/purview/communication-compliance`, `#/purview/ediscovery`,
    `#/purview/records`, `#/purview/lifecycle`, and `#/purview/settings`.
  - Added mock datasets for DLP incidents, insider risk cases, communication
    compliance reviews, eDiscovery cases, records labels, lifecycle policies,
    and Purview solution cards.
  - Headless Chrome DOM checks confirmed the new Purview routes render
    expected content without "Page not found".
- 2026-06-28 Purview home refresh:
  - Reworked `#/purview/home` into a new-portal-style landing surface with
    a hero, Microsoft 365 protection onboarding card, feature-location
    notice, six solution shortcuts, and related portal cards.
  - Verified `ui/app.js`, `ui/data.js`, and `ui/views.js` with Node syntax
    checks; headless Chrome confirmed the updated Purview route renders the
    new hero, E5 onboarding button, solution cards, and related portals.
- 2026-06-28 Purview classic governance option:
  - Added `#/purview/classic-governance` for lab steps that reference the
    classic Microsoft Purview governance portal, Azure-launched Purview
    accounts, `web.purview.azure.com`, Data Catalog classic, Data Health
    Insights classic, or Purview Workflow classic.
  - Added a new-vs-classic choice to `#/purview/home`, changed the Data
    Catalog shortcut to "Data Catalog classic", and added a left-nav
    "Classic governance" item.
  - Verified `ui/data.js`, `ui/views.js`, and `ui/app.js` with Node syntax
    checks; server returned 200; headless Chrome confirmed Purview home and
    classic route render expected text.
- 2026-06-28 Purview realism cleanup:
  - Reworked `#/purview/home` from a decorative hero into a portal entry
    surface with connected data sources, lab disclosure acceptance, "Get
    started", and "Go to classic portal" actions.
  - Changed the classic governance page primary action to
    "Open Microsoft Purview portal", routing back to `#/purview/home`.
  - Added `#/purview/ai-hub` so the AI Hub preview tile no longer opens an
    unrelated Copilot panel or a missing route.
  - Headless Chrome confirmed `#/purview/home`,
    `#/purview/classic-governance`, `#/purview/solutions`, and
    `#/purview/ai-hub` render without "Page not found".
- 2026-06-28 Purview clean-shell pass:
  - Purview routes now render with `shell clean-portal`, hiding both the
    Microsoft Cloud pane and workload blade pane so the new Purview portal
    feels like a cleaner standalone portal surface.
  - Defender, Sentinel, and Defender for Cloud keep the existing dual-pane
    lab navigation.
  - Headless Chrome confirmed Purview has `shell clean-portal` and two
    hidden nav panes, while Defender still has the normal shell.
- 2026-06-28 Defender advanced hunting gap pass:
  - Expanded the Advanced hunting route with the Learn unit concepts Alex
    pasted: 30-day raw data window, event freshness, entity refresh cadence,
    UTC timestamp reminder, and schema-reference study notes.
  - Expanded `HUNTING_TABLES` to include the Defender XDR advanced hunting
    schema tables from the unit, while keeping the mock executor limited to
    bundled fixture rows.
  - Added `#/defender/custom-detections` with required query columns
    (`Timestamp`, `DeviceId`, `ReportId`), the `arg_max()` sample query,
    frequency/lookback options, impacted entity mapping, and device/file
    response actions.
  - Added `#/defender/hunting-graph` for the Hunting graph preview concepts:
    predefined scenarios, inputs, useful filters, access assumptions, and
    the scope/constrain/inspect/validate workflow.
  - Updated `SC200_LAB.md` so `ui/app.js` is no longer listed as the missing
    TODO and the next-work section reflects the current project state.
  - Verified with `node --check ui/data.js`, `node --check ui/views.js`,
    and `node --check ui/app.js`.
  - Started a temporary server on `127.0.0.1:8766` because `8765` was already
    in use; headless Chrome DOM checks confirmed `#/defender/hunting`,
    `#/defender/custom-detections`, and `#/defender/hunting-graph` render
    expected text without "Page not found".

Note: Firefox 152.0.2 emitted a compatibility warning with geckodriver 0.36.0,
but the run completed successfully.

Note: `~/defender-lab` is not a Git repository, so Agent A's requested
fix-PR-style commits could not be created in this workspace.

- 2026-06-29 Sentinel ASIM DNS hunting view:
  - New route `#/sentinel/hunting/dns` mounted in `views.js`. Reuses the
    existing hunting-page chrome (`hunting-workspace`, `hunting-status-cards`,
    `hunting-saved-queries`).
  - Added `IM_DNS` (28 rows) to `data.js` covering baseline lookups, an
    NXDOMAIN DGA burst from WKS-FIN-03, TOR proxy lookups, suspicious
    response prefixes (185.220./45.95.), ANY-type recon, DNS tunneling with
    long base64-style labels, plain NXDOMAIN typos, and internal MX/TXT.
    Fields conform to the ASIM DNS 0.1.7 schema (TimeGenerated, EventProduct,
    EventVendor, EventSchema, EventType, EventSubType, EventResult,
    EventResultDetails, SrcIpAddr, SrcHostname, DstIpAddr, DnsQuery,
    DnsQueryTypeName, DnsResponseName).
  - Added `ASIM_DNS_SAVED_QUERIES` (5 canned queries from the schema doc):
    NXDOMAIN last day, TOR proxy `domain_has_any`, `response_has_any_prefix`,
    ANY-type recon, and a tunneling regex on `DnsQuery`.
  - Built an inline mock `_Im_Dns` evaluator in the view's `onMount`. Supports
    filter params (starttime, srcipaddr, responsecodename, domain_has_any,
    response_has_ipv4, response_has_any_prefix, eventtype) plus trailing
    `| where ... == / != / has / !has / contains / matches regex "..."`,
    `| project`, and `| take N`. Depth-aware paren matching so
    `dynamic([...])` literals inside the param list parse correctly.
  - `let X=dynamic([...]);` bindings are stripped from the query and
    resolved when referenced as filter-param values.
  - Sidenav entry added in Sentinel section: "ASIM DNS (Preview)" → 🌐.
  - Smoke validated each saved query returns the intended row count
    (9 NXDOMAIN / 4 TOR / 6 prefix / 2 ANY / 3 tunneling) via a Node harness
    that re-implements the evaluator and replays it against the bundled rows.
  - `node --check` clean on both `ui/data.js` and `ui/views.js`.

- 2026-06-29 Defender for Endpoint device page + Timeline → Hunt flow:
  - New routes `#/defender/devices` (inventory list) and `#/defender/device`
    (detail page). Devices nav-link in `data.js:1200` now resolves.
  - Device detail page mirrors the Defender for Endpoint shape: crumbs,
    header (device-id avatar + risk/criticality/health badges + tag pills +
    response-action strip), tab row (Overview, Incidents and alerts,
    Timeline, Security recommendations, Inventories, Discovered
    vulnerabilities, Missing KBs, Security baselines, Security policies,
    Sentinel events), left rail of Device details, and per-tab main pane.
    Tab state persists to `sessionStorage` under
    `defender-lab.device.id` / `defender-lab.device.tab`.
  - Overview tab renders the 4-card row (Active alerts · Security
    assessments · Logged-on users · Device health status) with severity bars
    and a state-dot health table.
  - Timeline tab interleaves **technique markers** (blue T circle) and
    **event rows** (gray P/N/L circles) chronologically. Each row carries an
    `AttackTechniques` field.
  - New side pane `panel-technique` in `index.html` is opened from a
    technique marker. It shows the technique ID/name/tactic, description,
    underlying-event count, and a **Hunt for related events** button — plus
    the canonical SC-200 callout that the resulting query returns the
    underlying events for that technique on this device, NOT the technique
    marker row.
  - `huntRelatedEvents()` in `app.js` generates a DeviceId + AttackTechniques
    + ±30-minute time-window KQL, stashes it under
    `defender-lab.hunting.prefill` / `.autorun`, navigates to
    `#/defender/hunting`, and the hunting view's onMount loads + runs it.
  - Mock KQL executor in the Advanced hunting view extended to support
    `| where Timestamp between (datetime(..)..datetime(..))`,
    `| where DeviceId == "..."`, and `| where AttackTechniques has "..."`.
    Leading `//` comments are stripped before parsing.
  - `data.js` adds `DEVICES` (5 endpoints), `DEVICE_TIMELINE_EVENTS` (with
    `kind: 'technique' | 'event'` rows), and a `TECHNIQUE_TACTIC_LOOKUP`
    built from `MITRE_ATTCK`. A seeder pushes event-kind rows into
    `MOCK_QUERY_RESULTS` so the prefilled KQL returns realistic results
    (and technique-kind rows are deliberately excluded).
  - `styles.css` adds the `.dev-*` rules (crumbs, header, badges, action
    strip, content shell with rail + main, overview grid, severity bars,
    legend, health table, command bar, timeline-list grid rows with
    `.dev-tle-icon.tech` blue marker, responsive collapses at 1200 and
    720 px). All original, project tokens only — no Microsoft CSS ported.
  - `DEVICE_PAGE_PARITY.md` added at the repo root. Tracks per-feature
    parity vs the *Investigate devices in Defender for Endpoint* Learn
    article (response-action strip gaps, internet-facing tag, flag column,
    process tree, EDR Resource Manager row, 3-card vs 4-card Overview
    variant, Effective settings tab, etc.).
  - `node --check` clean on `data.js`, `views.js`, `app.js`.
  - Not yet smoke-tested in a browser this pass — recommend a Firefox or
    headless-Chrome walk: Devices list → row → Timeline tab → click a
    technique marker → side pane visible → click Hunt → Advanced hunting
    autoruns and shows ≥1 row with matching `AttackTechniques`.

- 2026-06-29 Sentinel Basic table search-job pass:
  - Replaced the reused Defender hunting view on `#/sentinel/hunting` with a
    Sentinel Search page focused on `NetworkLogs_CL`, a Basic plan custom
    table with 30-day interactive query access and 365-day total retention.
  - Added table-plan cards for Analytics, Basic, and Auxiliary examples,
    including the SC-200 scenario where 60-day-old `NetworkLogs_CL` data must
    be retrieved with a search job instead of a direct KQL query.
  - Added a lab-only `Run search job` action that persists completion to
    `localStorage` and renders materialized 2026-04-30 network log rows.
  - `node --check` clean on `ui/data.js`, `ui/views.js`, and `ui/app.js`.
  - Headless Chrome DOM smoke confirmed `#/sentinel/hunting` renders
    `NetworkLogs_CL`, the search-job requirement, and the search-job controls.

- 2026-06-29 Sentinel Syslog via AMA lab:
  - Added an interactive Content hub/Data connectors workflow for the SC-200
    scenario where several appliances send Syslog to Linux VM `VM1`.
  - The workflow enforces the Microsoft Learn order: install the `Syslog`
    solution from Content hub first, open `Syslog via AMA`, create the DCR and
    select `VM1` so AMA is deployed, configure rsyslog on port 514, then verify
    the `Syslog` table.
  - Routes touched: `#/sentinel/content-hub` and
    `#/sentinel/data-connectors`.
  - Verification: `node --check` clean on `ui/data.js`, `ui/views.js`, and
    `ui/app.js`; headless Chrome DOM checks; CDP click-through confirmed the
    initial locked state, solution unlock, and final verified state.

- 2026-07-06 Sprint 2 Agent 1 objectives sync:
  - Updated `ExamObjectives.md` to reference the 2026-06-26 Microsoft Learn
    SC-200 study guide page and the July 28, 2026 skills outline.
  - Added explicit skill weights: Manage security operations environment
    40-45%, Respond to security incidents 35-40%, Perform threat hunting
    20-25%.
  - Added Azure cloud services to the candidate familiarity list.
  - Folded every `[Agent N]` objective from `OBJECTIVES_DELTA.md` into a
    concise July 2026 coverage checklist, written in project-owned wording.
  - Re-labeled Defender for Cloud posture and Purview DLP/Insider Risk as
    supporting study content, while keeping them in scope for lab realism.
  - Marked AGENTS.md Sprint 2 Agent 1 checklist complete.

- 2026-07-06 Sprint 2 Agent 2 Defender XDR/MDE settings and automation:
  - Added `#/defender/settings` with MDE advanced-feature toggles, rules
    settings, custom data collection cards, device groups, permissions/roles,
    and per-group automation levels.
  - Added `#/defender/asr-policy` with ASR audit/block/warn state controls,
    observed impact, and exclusion examples.
  - Added `#/defender/notifications` with incident/action/threat analytics
    email notification rules plus a static create-notification flow.
  - Added `#/defender/alert-tuning` showing signal-to-incident correlation,
    incident rollup examples, and tuning rules separate from suppression.
  - Added `#/defender/air` with automated investigation rows and an automatic
    attack disruption explanation tied to ransomware incident `INC-1050`.
  - Added fictional fixture data for all Agent 2 surfaces in `ui/data.js`,
    small local DOM handlers in `ui/app.js`, scoped original CSS in
    `ui/styles.css`, and Defender nav links for each new route.
  - Verified `node --check ui/data.js`, `node --check ui/views.js`, and
    `node --check ui/app.js` clean.
  - Marked AGENTS.md Sprint 2 Agent 2 checklist complete.

- 2026-07-06 Sprint 2 Agent 3 MDE device response deepening:
  - Replaced the device-page Live response toast with a static right-side lab
    console showing canned `dir`, `getfile`, and `run` transcript output plus
    a session log for FIN-FS-02 and WKS-03.
  - Replaced the investigation-package toast with a static collection flow,
    package contents, and guidance on when to use the ZIP during response.
  - Tagged ransomware incident `INC-1050` as `Attack disruption` and rendered
    automatic contain-user, contain-device, and stop-process-tree actions in
    the incident side-panel timeline, full incident attack-story tab, and
    Activities table.
  - Burned down the Agent 3 `DEVICE_PAGE_PARITY.md` items: response action
    strip, internet-facing device flag/counter/query, timeline flag column,
    raw event process-tree side pane, copy command/hash actions, MsSense.exe
    Resource Manager row, overview-card wording, and Effective settings tab.
  - Added `DeviceInfo` fixture rows and a saved hunting query for internet-
    facing devices; widened the mock hunting parser to support boolean
    equality filters.
  - Verified `node --check ui/data.js`, `node --check ui/views.js`, and
    `node --check ui/app.js` clean.
  - Marked AGENTS.md Sprint 2 Agent 3 checklist complete.

- 2026-07-06 Sprint 2 Agent 4 Sentinel ingestion connectors and DCR family:
  - Expanded `#/sentinel/content-hub` and `#/sentinel/data-connectors` with
    Windows Security Events via AMA, CEF via AMA, Azure Activity, and Logs
    Ingestion API custom-table labs, using local-only button state and the
    existing Syslog AMA practice-card pattern.
  - Added Windows Security Events workflow: Content hub solution, connector,
    DCR creation, event-set/XPath scoping, and `SecurityEvent` verification.
  - Added CEF via AMA workflow with Linux forwarder setup and
    `CommonSecurityLog` fixture rows.
  - Added a Windows Event Forwarding vs AMA planning study card.
  - Added Azure Activity collection workflow covering Azure Policy at scale,
    diagnostic settings for a subscription, connector review, and
    `AzureActivity` verification rows.
  - Added Logs Ingestion API workflow covering app registration, Monitoring
    Metrics Publisher, DCE vs DCR direct endpoint, `streamDeclarations`,
    `transformKql`, `Custom-` vs `Microsoft-` streams, and
    `AppRiskEvents_CL` output.
  - Added fictional fixture rows for `SecurityEvent`, `WindowsEvent`,
    `CommonSecurityLog`, `AzureActivity`, and `AppRiskEvents_CL`.
  - Verified `node --check ui/data.js`, `node --check ui/views.js`, and
    `node --check ui/app.js` clean.
  - Marked AGENTS.md Sprint 2 Agent 4 checklist complete.

- 2026-07-06 Sprint 2 Agent 5 Sentinel data platform and hunting infrastructure:
  - Extended `#/sentinel/hunting` table-plan cards with Data lake and XDR-tier
    retention examples plus a decision guide for Analytics, Basic, Auxiliary,
    Data lake, and XDR-tier data.
  - Added `#/sentinel/soc-optimization` with coverage, rule tuning, and
    data-value recommendations.
  - Added `#/sentinel/summary-rules` showing noisy `NetworkLogs_CL` rows,
    a summary-rule KQL query, and `NetworkSummary_CL` aggregate results.
  - Added `#/sentinel/data-lake-jobs` with a long-running Sentinel Data lake
    KQL job, local completion state, and `DnsBeaconingResults_CL` output.
  - Built the previously dead `#/sentinel/notebooks` route with notebook
    templates and Sentinel MCP Server connection notes, keeping the lab
    local-only and static.
  - Added Sentinel nav links and fictional fixtures for all Agent 5 surfaces.
  - Verified `node --check ui/data.js`, `node --check ui/views.js`, and
    `node --check ui/app.js` clean; existing server on `127.0.0.1:8765`
    returned 200; headless Chrome confirmed all new routes render expected
    text without "Page not found".
  - Marked AGENTS.md Sprint 2 Agent 5 checklist complete.

- 2026-07-06 Sprint 2 Agent 6 detection engineering completion:
  - Extended the Sentinel analytics wizard with a rule-type chooser for
    scheduled query, near-real-time, threat intelligence, and ML behavior
    analytics (Fusion-style) rules.
  - Added per-type defaults, constraints, review text, and static query/
    no-query preview behavior while keeping the lab local-only.
  - Added NRT, threat intelligence, and ML behavior analytics examples to the
    Sentinel analytics rule list.
  - Built `#/sentinel/anomalies` with customizable anomaly rules, thresholds,
    exclusions, hunting-feed rows, and guidance on how anomalies feed hunting,
    analytics rules, and Fusion incidents.
  - Added the Sentinel Anomalies nav link and fictional anomaly fixtures.
  - Verified `node --check ui/data.js`, `node --check ui/views.js`, and
    `node --check ui/app.js` clean.
  - Marked AGENTS.md Sprint 2 Agent 6 checklist complete.

- 2026-07-06 Sprint 2 Agent 7 incident response surfaces:
  - Added `#/defender/cloud-apps` as a Defender for Cloud Apps risky OAuth
    investigation tied to `INC-1042`, with DocViewer Pro scopes, timeline,
    response actions, and pivots back to the Defender incident and Sentinel
    Graph.
  - Added `#/defender/identity-protection` for Entra compromised-identity
    investigation, including risky users, risky sign-ins, risk detections,
    and lab-static confirm-compromise / dismiss actions for `INC-1053` and
    `INC-1051`.
  - Added `#/defender/cases` with Sentinel/Defender case management cards:
    tasks, assignees, owners, linked incidents, due dates, and closure
    context.
  - Replaced the old `#/sentinel/incidents` alias with a Sentinel-specific
    incident queue that calls out the Defender XDR unified-response lens and
    links matching rows into the Defender incident page.
  - Added `#/sentinel/graph`, rendering the existing `INC-1042`
    `SENTINEL_GRAPH` node/edge fixtures for entity relationship analysis.
  - Upgraded the Security Copilot side panel with a static guided agentic
    investigation flow: plan, tool calls, and containment verdict for
    `INC-1042`.
  - Added fictional fixtures for Cloud Apps OAuth investigations, Entra risk
    investigations, case management, and the Copilot agentic flow.
  - Verified `node --check ui/data.js`, `node --check ui/views.js`, and
    `node --check ui/app.js` clean.
  - Marked AGENTS.md Sprint 2 Agent 7 checklist complete.

## Next useful work

- **Sprint 2 (2026-07-06):** `AGENTS.md` now defines Agents 1–9 covering
  every remaining gap in `OBJECTIVES_DELTA.md` (each delta bullet is
  labeled `[Agent N]` or `[DONE]`). Completing Agents 1–9 = 100% of the
  July 2026 objectives delta. Agent 9 subsumes the optional passes below.
- Optional verify pass: save a suppression rule in the UI, hard-refresh, and
  confirm `localStorage.getItem('defender-lab.rules')` survives.
- Optional browser interaction pass: click through the new
  `#/defender/custom-detections` and `#/defender/hunting-graph` pages at
  1366x768 and confirm tables do not overflow.
- Optional browser interaction pass: click through the expanded Sentinel
  analytics wizard entity picker in Firefox and confirm layout at 1366x768.
- Optional browser interaction pass: click the copy buttons on the Sentinel
  Threat intelligence and Logs pages and confirm clipboard permission behavior
  in Firefox and Chrome.
- Optional browser interaction pass: walk the Purview DLP incident to Insider
  Risk to eDiscovery story at 1366x768 and confirm no table overflow on
  smaller screens.
