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

- 2026-08-05 product architecture audit (planning only):
  - Audited the live shell and 106 unique navigation routes against current
    Microsoft Learn guidance through the Learn MCP server.
  - Added `PRODUCT_ARCHITECTURE_PLAN.md` with the target product map, prioritized
    gaps, and a six-agent/fourteen-package implementation sequence.
  - No `ui/` files were changed in this planning pass.

- 2026-08-02 Sentinel incident graph learning upgrade:
  - Rebuilt `#/sentinel/graph` from the downloaded Microsoft Sentinel graph
    public-preview article and its six screenshots as visual/product references;
    all lab markup, styling, and interaction code remains original.
  - Replaced the five-node toast-only mock with the existing 14-node `INC-1042`
    phishing-to-OAuth attack story, progressive connected-asset expansion, and
    a full blast-radius view distinguishing observed activity from reachable
    exposure and marking critical assets.
  - Added selectable node and relationship details, evidence sources, incident
    timeline, response guidance, entity hunting/playbook pivots, an action log,
    a four-step guided exercise, filters, relationship/risk layouts, similar-
    entity grouping, zoom, fit, and drag-to-pan behavior.
  - Matched the article's incident-graph information architecture with an alert
    story rail, incident tabs, graph provisioning status, graph toolbar, dotted
    canvas, blast-radius list, and contextual details drawer without copying
    Microsoft portal code.
  - Verified syntax and diff whitespace, HTTP 200, `103/105` full-view render
    baseline with the same pre-existing Audit and Threat Explorer failures, and
    17 browser interaction assertions covering the full guided workflow.

- 2026-07-07 Agent 11 coverage-sweep rerun:
  - Rebuilt `COVERAGE_SWEEP.md` from scratch against the post-GAP_BRIDGE
    route map and the authoritative Learn-link index.
  - Marked the report as superseding the 2026-07-06 sweep and ranked the
    remaining gaps with `concepts.jsonl` chunk counts as the emphasis proxy.
  - No `ui/` files were changed.

- 2026-07-07 Agent 19 QA / verify sweep:
  - Ran a static route-vs-view compare across all registered views and
    confirmed there are no `Page not found` matches for the current route
    set.
  - Verified `node --check ui/data.js`, `node --check ui/views.js`, and
    `node --check ui/app.js` clean.
  - Swept 100 registered views in headless Chrome over the local server,
    with no console or page exceptions recorded.
  - Exercised the suppression-rule save flow in the browser and confirmed
    `localStorage.getItem('defender-lab.rules')` survives a reload with the
    saved rule intact.
  - Marked Agent 19 complete in `AGENTS.md`.

- 2026-07-07 Agent 18 pass:
  - Added `#/sentinel/workspace-manager` cross-tenant study content with
    Azure Lighthouse vs B2B notes, a customer-tenant switcher, and a
    workspace-qualified `workspace()` query handoff into `#/sentinel/logs`.
  - Added `#/defender/mto` for consolidated multi-tenant incident review
    across fictional customer tenants, with tenant switching and MTO vs
    single-tenant scoping notes.
  - Expanded `#/sentinel/logs` with Azure Data Explorer guidance, Basic
    vs Auxiliary tier notes, and a runnable auxiliary-table example that
    also accepts the workspace-qualified query from Workspace manager.
  - Added `ArchiveDns_CL` auxiliary rows and the MTO tenant/incident
    fixtures to `ui/data.js`.
  - Wired `#/defender/settings` to the new multi-tenant management route
    and verified `node --check` on `ui/data.js`, `ui/views.js`, and
    `ui/app.js` plus headless Chrome smoke renders for the new routes.

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

- 2026-07-06 Sprint 2 Agent 8 M365 investigation and threat analytics depth:
  - Added `MicrosoftGraphActivityLogs` to the Advanced hunting table list,
    saved queries, and mock fixture rows for DocViewer Pro OAuth follow-on
    Graph calls and a blocked Graph PowerShell risky sign-in path.
  - Added `#/purview/graph-activity` with diagnostic-settings location
    guidance, fixture rows, and pivots to Advanced hunting, Audit, and
    Threat analytics context.
  - Expanded `#/defender/threat-analytics` from a thin report table into
    report detail panels covering overview, analyst report notes, related
    incidents, exposure, and interpretation guidance for three active
    reports.
  - Expanded `#/purview/ediscovery` with a Content search workflow:
    build query and locations, preview matching evidence, and export for
    investigation.
  - Verified `node --check ui/data.js`, `node --check ui/views.js`, and
    `node --check ui/app.js` clean.
  - Marked AGENTS.md Sprint 2 Agent 8 checklist complete.

- 2026-07-06 Sprint 2 Agent 9 QA / verify sweep:
  - `python3 -m http.server` was already listening on `127.0.0.1:8765`;
    `curl` returned HTTP 200.
  - Fixed the remaining NAV smoke failures by registering lightweight local
    study surfaces for secondary nav links that did not yet have dedicated
    `VIEWS[...]` implementations.
  - Made `copyToClipboard()` handle denied/unavailable clipboard permission
    without unhandled promise errors, and added an inline empty favicon to
    avoid browser 404 noise during smoke tests.
  - Headless Chrome CDP pass confirmed the Defender home default render,
    waffle app switcher, workload navigation, alert detail panel,
    suppression rule save/re-render, `defender-lab.rules` persistence across
    hard refresh, and "Replay scenario events".
  - All 83 NAV routes rendered without "Page not found", including Sprint 2
    routes and `#/sentinel/notebooks`; `#/sentinel/hunting/dns` also rendered.
  - Targeted 1366x768 browser checks passed for
    `#/defender/custom-detections`, `#/defender/hunting-graph`, the Sentinel
    analytics wizard entity picker, Sentinel Threat intel/Logs copy buttons,
    and the Purview DLP -> Insider Risk -> eDiscovery walk.
  - Clean rerun reported no runtime/log events and no document-level
    horizontal overflow on targeted pages.
  - Verified `node --check ui/data.js`, `node --check ui/views.js`, and
    `node --check ui/app.js` clean.
  - Marked AGENTS.md Sprint 2 Agent 9 checklist complete.

- 2026-07-06 Sprint 2 Agent 10 dead-route triage:
  - Re-ran the NAV-vs-VIEWS sweep: all 83 `NAV` routes now have explicit
    `VIEWS['...']` registrations; missing route count is 0.
  - Added a full `#/sentinel/workspace-manager` view with member workspaces,
    content selection for analytics rules, hunting queries, workbooks,
    automation, and DCR-backed connectors, publish status, last-publish
    timestamps, and links to `#/sentinel/analytics` and
    `#/sentinel/data-connectors`.
  - Added real exam-relevant views for `#/defender/action-center`,
    `#/defender/email-collab`, `#/defender/endpoints`,
    `#/defender/exposure`, `#/defender/intel-explorer`,
    `#/sentinel/search`, `#/sentinel/entity-behavior`,
    `#/sentinel/watchlist`, `#/sentinel/settings`,
    `#/defender-cloud/inventory`, `#/defender-cloud/attack-paths`,
    `#/defender-cloud/setup`, `#/defender-cloud/explorer`,
    `#/defender-cloud/cloud-security`, `#/defender-cloud/environment`, and
    `#/defender-cloud/workflow`.
  - Added small original secondary surfaces for chrome/support routes:
    Defender content hub, repositories, community, reports, learning hub,
    trials; Sentinel news, repositories, community; Defender for Cloud
    community, workbooks, and diagnose.
  - Verified `node --check ui/data.js`, `node --check ui/views.js`, and
    `node --check ui/app.js` clean.
  - Existing server on `127.0.0.1:8765` returned 200; headless Chrome
    `--dump-dom` smoke loaded all 29 formerly missing routes without
    "Page not found" or obvious render exceptions.
  - Marked AGENTS.md Sprint 2 Agent 10 checklist complete.

- 2026-07-06 Sprint 2 Agent 11 Learn-link coverage sweep:
  - Read the curated official-only SC-200 Learn link index at
    `/home/alex/sc-200_app/sc-200_microsoft_learn_links.txt`.
  - Added `COVERAGE_SWEEP.md` with full/partial/missing coverage tables for
    every section/topic in the link index and route mappings back to the lab.
  - Ranked the remaining gaps: standalone Security Copilot administration,
    exam logistics support, advanced KQL breadth, Sentinel bookmarks/
    livestream/restore depth, Defender Vulnerability Management depth,
    Defender for Cloud multi-cloud onboarding depth, and Purview Audit
    Premium depth.
  - Kept the pass report-only; no `ui/` files were edited.
  - Verified `node --check ui/data.js`, `node --check ui/views.js`, and
    `node --check ui/app.js` clean.
  - Marked AGENTS.md Sprint 2 Agent 11 checklist complete.

## Next useful work

- Sprint 2 Agents 1-11 are complete against the July 2026 objectives delta,
  dead-route audit, and Learn-link coverage sweep.
- Next pass should be a human visual review in Firefox only if Alex wants
  pixel-level polish beyond the automated route and interaction sweep.

## 2026-07-06 — GAP_BRIDGE pivot: goose-local pipeline replaces codex wave
Codex hit its usage cap; per Alex, the wave now runs on goose+qwen2.5:7b
via python gates. Shipped: GAP_BRIDGE_FINDINGS.md; Agent 12-19 briefs;
local-tasks/ pipeline (fixture briefs T01-T12 → verify.js gate →
integrate.py auto-merge: 18 consts live in data.js); Copilot 5th workload
(PORTALS+NAV+#/copilot/home); ui/lab-widgets.js interaction primitives;
view pipeline (gen_view_task.py → tasks/V12-V22 → add_view.py render
gate → NAV wiring); bin/qa-sweep.sh + bin/render_all.js (88/88 views
render clean, 0 dead NAV). State/queue: local-tasks/VIEW_QUEUE.md.

## 2026-07-07 — codex wave resumed (usage cap reset)
Goose stalled on 9 of 11 queued views; per Alex, Agents 12–19 now run on
codex via `bin/run-codex-agents.sh`. Already live from the goose batch —
EXTEND these, do not rebuild or duplicate:
- `#/defender/vulnerabilities` (V17) — covers part of Agent 15.1.
- `#/defender/threat-explorer` (V18) — standalone route; Agent 17.3 may
  link it from `#/defender/email-collab` instead of duplicating content.
- 18 fixture consts already merged into `ui/data.js` by `integrate.py`
  (Copilot sessions/transcripts/promptbooks/plugins/capacity, TVM,
  multicloud, audit-premium, threat-explorer, MSSP/MTO — see
  `local-tasks/manifest.json`). Reuse them; adapt names if needed.
- `#/copilot/home` + Copilot PORTALS/NAV entry exist; `ui/lab-widgets.js`
  provides labList/labGet/labSet persistence helpers for new views.
Current QA baseline: 90/90 views render clean, 0 dead NAV routes.

## 2026-07-07 — Agent 12 Security Copilot standalone portal
- Added the standalone `copilot` workload with new NAV entries for
  `#/copilot/home`, `#/copilot/sessions`, `#/copilot/promptbooks`,
  `#/copilot/plugins`, `#/copilot/knowledge`, and `#/copilot/settings`,
  plus a detailed `#/copilot/session` drill-in route.
- Merged the local fixture drafts into `ui/data.js` and cleaned them up for
  product accuracy: sessions, transcripts, promptbooks, plugins, usage,
  capacity, and knowledge sources now all feed the new views.
- Built local-only persistence for custom promptbooks, generated sessions,
  plugin enablement, knowledge sources, and Copilot settings via
  `localStorage` / `sessionStorage`.
- Wired the topbar Copilot panel and the standalone session view together
  so the panel can jump into the matching transcript, and the session view
  can reopen the embedded panel.
- Verified `node --check ui/data.js`, `node --check ui/views.js`, and
  `node --check ui/app.js` clean, plus headless Chrome `--dump-dom` checks
  on the new Copilot routes and an HTTP 200 from `127.0.0.1:8765`.

## 2026-07-07 — Agent 13 KQL practice depth
- Added a shared mock KQL evaluator in `ui/views.js` with support for
  `union`, `join` (`inner` / `leftouter`), `summarize` (`bin()`, `dcount()`,
  `countif()`, `arg_max()`), `parse`, `extend`, `project`, `render`
  (`timechart`, `barchart`, `piechart`), `parse_json()`, `split()`,
  `extract()`, `let` bindings, and local `externaldata` CSV fixtures.
- Reworked `#/sentinel/logs` into a guided KQL practice workspace with 11
  row-count-checked tasks and chart exercises, plus a bundled CSV fixture
  preview and source-row reference cards.
- Added `#/sentinel/hunting/authentication` and
  `#/sentinel/hunting/network-session` as ASIM parser-style labs with saved
  queries, source-row tables, and normalization study cards.
- Updated the auth/network/KQL practice fixture rows in `ui/data.js` so the
  practice queries and checks line up with the current lab date.
- Verified `node --check ui/data.js`, `node --check ui/views.js`, and
  `node --check ui/app.js`, plus headless Chrome `--dump-dom` checks on
  `#/sentinel/logs`, `#/sentinel/hunting/authentication`, and
  `#/sentinel/hunting/network-session`; the Node VM also matched the
  expected row counts for the new queries.

## 2026-07-07 — Agent 14 Sentinel hunting operations
- Confirmed the Sentinel hunting workspace includes bookmark capture from
  query results, with the saved row, entity mapping, tags, MITRE technique,
  and incident linkage all persisted locally.
- Confirmed the hunting workspace tabs cover search results, bookmarks, and
  a simulated livestream with start/pause/stop controls plus an
  elevate-to-alert action that creates a local analytics-rule stub.
- Confirmed `#/sentinel/search` runs the restore-job workflow for retained
  data and `#/sentinel/logs` shows the restored `_RST` table preview once
  the job completes.
- Confirmed the entity-trigger playbook path from incident/entity pivots to
  `PB-ContainEntity` through the Sentinel automation surface.
- Verified `node --check ui/data.js`, `node --check ui/views.js`, and
  `node --check ui/app.js` clean after the closeout pass.

## 2026-07-07 — Agent 15 Defender Vulnerability Management workflow
- Expanded the TVM fixtures in `ui/data.js` with richer software, CVE,
  remediation-tracker, exception, and device-specific vulnerability data,
  including an exposure trend and per-device software/vulnerability maps.
- Replaced the `#/defender/vulnerabilities` stub with a full dashboard:
  exposure trend, top recommendations, software inventory, exploitable CVEs,
  remediation tracker, and exception summary, plus links into `#/defender/exposure`
  and the device TVM tab.
- Added a right-edge TVM side panel for software, CVE, recommendation,
  remediation-request, and exception workflows. Remediation tickets and
  exceptions persist locally and re-render the dashboard.
- Reworked the Defender device `Discovered vulnerabilities` tab so it now
  shows device-specific installed software, vulnerabilities, and linked
  recommendations instead of placeholder rows.
- Verified `node --check ui/data.js`, `node --check ui/views.js`, and
  `node --check ui/app.js` clean; curl to `127.0.0.1:8765` returned HTTP
  200; headless Chrome `--dump-dom` confirmed the new TVM dashboard renders
  the expected headings and panels.

## 2026-07-07 — Agent 16 Defender for Cloud multicloud onboarding
- Added a Defender for Cloud multicloud lab state in `ui/app.js` so the
  AWS and GCP connector flows, plan toggles, health states, FIM toggle, and
  JIT access request all persist locally across refreshes.
- Expanded `ui/data.js` with multicloud fixtures for AWS/GCP connectors,
  onboarded resources, alerts, a cross-cloud attack path, file integrity
  monitoring, and a JIT VM access study card.
- Reworked `#/defender-cloud/environment` into a connector wizard surface
  with AWS and GCP onboarding steps, plan selection, CloudFormation / Cloud
  Shell guidance, FIM monitoring, and JIT request controls.
- Reworked `#/defender-cloud/inventory`, `#/defender-cloud/alerts`, and
  `#/defender-cloud/attack-paths` so the onboarded AWS/GCP content appears
  alongside the existing Azure cloud assets and paths.
- Verified `node --check ui/data.js`, `node --check ui/views.js`, and
  `node --check ui/app.js` clean, confirmed `curl` to `127.0.0.1:8765`
  returns HTTP 200, and used headless Chrome `--dump-dom` to confirm the
  new Defender for Cloud routes render the expected multicloud headings.

## 2026-07-07 — Agent 17 Purview Audit Premium + MDO Threat Explorer
- Expanded `#/purview/audit` into a premium-aware audit workspace with a
  standard-vs-premium comparison card, a retention-policy builder/table,
  CopilotInteraction audit rows, and a local export preview flow that
  uses selected or filtered rows.
- Merged the audit fixture drafts into `ui/data.js`, including Copilot
  activity rows and the premium retention policy set used by the search
  and export surfaces.
- Reworked `#/defender/email-collab` into an entry ramp for message
  investigation and replaced `#/defender/threat-explorer` with a pivotable
  mail triage view that supports phish/malware/campaign filtering, top
  targeted users, message entity detail, and a mock remediation batch.
- Added `#/defender/email-collab/threat-explorer/campaigns` for campaign
  summaries and response guidance so the email-investigation flow can walk
  from landing page to campaign pivot cleanly.
- Verified `node --check ui/data.js`, `node --check ui/views.js`, and
  `node --check ui/app.js` clean, confirmed `curl` to `127.0.0.1:8765`
  returns HTTP 200, and used headless Chrome `--dump-dom` to confirm the
  new Audit and Threat Explorer routes render the expected headings.

## Ad-hoc addition (2026-07-09): script-triggered incident + embedded script analysis
- New incident **INC-1055** "Suspicious PowerShell script execution on FIN-WKS-07"
  and alert **A801** added to `ui/data.js` (SEED_ALERTS + INCIDENTS). A801 carries
  a `scriptAnalysis` object (decoded script, findings, ATT&CK `techniques[]`).
- `renderAlertDetail` (ui/views.js) shows an **Analyze script** button when an alert
  has `scriptAnalysis`. New panel `#panel-script` in `ui/index.html`; new functions
  `openScriptAnalysis()` / `toggleScriptMitre()` in `ui/app.js` implement the embedded
  script-analysis pane with a **Show MITRE techniques** reveal (mirrors real Defender).
- Reuses existing CSS (`.kql`, `.pill-row`, `.card card-body`, `.tag`, `.sev`). No new routes.

## Sprint (2026-07-16): Device discovery — unmanaged asset inventory

Source: Microsoft Learn → *Defender for Endpoint device discovery overview*
(`/defender-endpoint/device-discovery`). Screenshot reference: the real portal's
Home **Discovered devices** card. Look-alike from scratch; no Microsoft markup copied.

### Why
The lab modeled only onboarded devices, so the entire discovery half of the
product — the "what don't we cover?" blind-spot question SC-200 asks — was missing.

### New fixtures (`ui/data.js`)
- `DISCOVERED_DEVICES` — 17 unmanaged assets across three inventory tabs
  (`tab`: `computers` | `network` | `iot`). Carries `onboardingStatus`,
  `discoverySource` (Basic / Standard / Authenticated scan), `protocols[]`,
  `seenBy[]` (which onboarded sensor found it), `highValue`, `note`.
- `DEVICE_INVENTORY_TABS`, `ONBOARDING_STATUSES`, `INVENTORY_FILTER_GROUPS`,
  `INVENTORY_RANGES`.
- `DEVICE_DISCOVERY_SETTINGS` — mode + both mode descriptions, monitored networks
  (incl. two Ignored non-corporate ones), exclusions, authenticated scans, Enterprise IoT.
- `DEVICES` gained `avStatus`, `excluded`, `winVersion`, plus a 13-device Windows 10
  fleet so every filter facet (Inactive / Misconfigured / AV Disabled / Not updated /
  Unknown / Excluded=Yes / each Win10 build) returns real rows. 18 onboarded total.

### New/changed routes
- `#/defender/devices` — rewritten. Union of onboarded + discovered rows
  (`inventoryRows(tab)` normalizes both into one row shape). Tabs
  Endpoints / Network devices / IoT devices; toolbar `📅 range · 🧮 Choose columns ·
  ⬇ Export · 🔽 Filter`; active-filter chips; `.table-scroll` wrapper.
- `#/defender/discovered-device` — **new.** Dedicated page per unmanaged asset
  (Overview / Discovery details / Security recommendations / Onboarding).
  Onboard button is disabled for Unsupported/Insufficient info.
- `#/defender/device-discovery` — **new.** System > Settings > Device discovery:
  mode switch (live, re-renders), monitored networks, exclusions, authenticated
  scans, Enterprise IoT. Added to `NAV.defender` under Configuration.
- `#/defender/home` — added `renderDiscoveredDevicesCard()`: total, IoT/Endpoints/
  Network/High-value split, distribution-by-device-type bars, recent-7-day table.

### Real, not stubbed
`Choose columns` and `Export` genuinely work. `INVENTORY_COLUMNS` (views.js) drives
the table; the picker persists to sessionStorage; `exportInventoryCsv()` (app.js)
downloads a real CSV of exactly the visible columns and filtered rows. Only the
onboarding-package / exclusion-write buttons remain `toast()` stubs.

### Filter model
`INVENTORY_FILTER_GROUPS[].field` names the row property. Options inside a group OR;
groups AND (`applyInventoryFilters`). Empty group = no constraint. Switching tabs
clears facets — a stale facet (e.g. a Win10 build) matches nothing on the Network
tab and reads as an empty inventory rather than a tab change.

### Gotcha for the next agent
`.kv` is a **monospace code cell** (`<td class="kv">`), NOT a label/value row —
`ui/NODE_MAP.md` previously implied otherwise and this cost a render bug. Use the
new `.detail-row` (`<div class="detail-row"><span>Label</span><strong>Value</strong></div>`).

### Verified
`bin/qa-sweep.sh` → 103/105 views clean, 0 dead NAV routes. The two failures
(`purview/audit`, `defender/threat-explorer`) are **pre-existing** — confirmed by
stashing this work and re-running (98/100 baseline, same two). Drove the real UI in
headless Chrome via Playwright: every tab, every filter facet, select-all, the column
picker, the CSV download, the asset page tabs, and the discovery mode switch — all
correct, **zero console/page errors**.

## Ad-hoc addition (2026-08-02): Low and Informational incident mix
- Added eight openable Defender/Sentinel incident fixtures: four Low
  (`INC-1060`–`INC-1063`) and four Informational (`INC-1064`–`INC-1067`),
  each backed by a matching alert and realistic identity, endpoint, email,
  cloud, OAuth, or ASR-audit triage context.
- Added the `informational` severity CSS alias so the full label uses the
  existing informational color token in queue, preview, and detail views.
- Verified all three JavaScript files with `node --check`, confirmed HTTP
  200, and rendered `#/defender/incidents` in headless Chrome with 19 rows
  and the new severity labels. `bin/qa-sweep.sh` remains at 103/105 with
  the same pre-existing Audit and Threat Explorer tiny-render failures.

## Ad-hoc addition (2026-08-02): Interactive Defender hunting graph
- Replaced the static `#/defender/hunting-graph` scenario table with the
  current guided workflow: open predefined scenarios, select a scenario,
  supply required entities, apply shortest-path and advanced filters, and
  run the scenario to render an interactive graph.
- Added all 20 scenario shapes from the current Microsoft Learn hunting-graph
  reference. Graph entities, paths, risk properties, and investigation details
  are fictional local fixtures; the lab makes no real Defender or Sentinel
  calls.
- Added input validation, source/target/edge filtering, no-match feedback,
  session-scoped workflow state, and a node inspector for criticality,
  vulnerability, internet exposure, risk, and sensitive-data context.
- Browser verification covered a two-input path scenario, an input-free SQL
  choke-point scenario, missing-input validation, node inspection, filter
  narrowing/empty results, and all 20 default scenario graphs. The run had zero
  console/page errors and no horizontal overflow at 1366x768.
- `node --check` passed for `data.js`, `views.js`, and `app.js`. The render
  sweep remains at 103/105 with zero dead NAV routes and only the same
  pre-existing `purview/audit` and `defender/threat-explorer` tiny-render
  failures documented above.

## Ad-hoc fix (2026-08-02): Threat Explorer message queue interactions
- Made the full message row on `#/defender/threat-explorer` open a dedicated
  email-entity detail side panel; previously only the subject refreshed an
  inline detail area, so most row clicks appeared inert and nothing popped up.
- Added Enter/Space keyboard activation, visible row focus/hover states, and
  kept checkbox clicks isolated for batch remediation selection.
- Verified 17 queue rows in headless Chrome: non-subject cell click and Enter
  both opened the matching panel, checkbox selection kept it closed, and no
  runtime/log errors occurred. Syntax checks passed; the render sweep improved
  to 104/105 with only the unrelated pre-existing `purview/audit` tiny-render
  failure remaining.

## Ad-hoc fix (2026-08-02): Defender for Cloud attack-path wrapping
- Fixed the `vertical-flow` modifier being overridden by the later generic
  `.flowline` grid declaration. Attack-path steps now stack at full card width
  instead of squeezing their text into six narrow columns.
- Added minimum-width and overflow wrapping safeguards to `.flow-step` and
  verified `#/defender-cloud/attack-paths` at 1366x768 in headless Chrome.
  JavaScript syntax checks passed; the render sweep remains at 104/105 with
  only the unrelated pre-existing `purview/audit` tiny-render failure.

## Ad-hoc fix (2026-08-02): Defender for Cloud security alerts made interactive
- `#/defender-cloud/alerts` rows had `cursor: pointer` from `.grid tbody tr`
  but no handler, so every alert looked clickable and did nothing. Rows now
  call `openCloudAlert(id)` and open a dedicated alert details pane.
- Rebuilt the pane to match the real portal flow, verified against Microsoft
  Learn (`manage-respond-alerts`, `alerts-overview`, `incidents-reference`):
  summary block (severity / status / activity time, description, affected
  resource, kill-chain intent), then an **Alert details** tab (alert ID,
  detecting plan, scope, activity start/end, entities, evidence, related
  alerts) and a **Take action** tab with the five documented sections —
  Inspect resource context, Mitigate the threat, Prevent future attacks,
  Trigger automated response, Suppress similar alerts — plus Change status
  and Useful/Not useful feedback.
- Answered "should alerts connect to other alerts": yes. Added `CLOUD_INCIDENTS`
  (data.js) — a security incident is a correlation of alerts sharing an entity
  or kill-chain pattern. Three incidents: exfiltration chain on shared IP +
  identity, Kubernetes cluster chain, and a cross-cloud AWS→GCP correlation on
  a reused operator account. Member alerts stay visible in the main table
  because the same alert can be both standalone and part of an incident.
  `openCloudIncident(id)` opens an incident pane listing members in attack
  order; every member row opens that alert, and each alert links back.
- Accuracy fixes found while checking Learn:
  - Alert statuses were XDR states (New / In progress). Defender for Cloud
    uses **Active / Dismissed / Resolved** — corrected in `CLOUD_ALERTS` and
    `MC_ALERTS`. Keeping these distinct from XDR is itself exam-relevant.
  - `MC_ALERTS` used capitalized severities, producing an unstyled `sev High`
    pill. `defenderCloudAlertRows()` now lowercases severity.
  - Added an **Informational** alert; the severity scale is High / Medium /
    Low / Informational, and informational alerts matter mainly in the context
    of an incident, which the correlation fixture now demonstrates.
- Filter chips are functional (severity / status / cloud, session-scoped);
  status changes persist to `defender-lab.defender-cloud.alert-status` so the
  Dismissed filter behavior is observable across a refresh.
- New globals: `openCloudAlert`, `setCloudAlertTab`, `setCloudAlertStatus`,
  `openCloudIncident`, `setDefenderCloudAlertFilter`. New panels
  `#panel-cloud-alert` and `#panel-cloud-incident` in `index.html`.
  Defined the previously-undeclared `.border-top` class in `styles.css`.
- Verified in headless Chrome with a throwaway iframe harness: 22/22 assertions
  passed (row clicks, both tabs, all five Take action sections, status
  persistence, related-alert chaining, incident members, filters, no unstyled
  severity pills) with zero page errors. `node --check` passed for `data.js`,
  `views.js`, `app.js`. Harness files were removed afterwards.

## Ad-hoc addition (2026-08-02): Entra admin center tenant directory

`#/entra/overview` was two navigation cards with no data. It now renders the
Contoso tenant directory so the Entra surface carries the same synthetic
population the Defender XDR and Sentinel views investigate.

- New fixtures at the end of `ui/data.js` (`=== Microsoft Entra admin center —
  tenant directory ===` … `=== end Entra tenant directory ===`):
  `ENTRA_TENANT`, `ENTRA_USERS` (28 principals), `ENTRA_ROLE_ASSIGNMENTS`,
  `ENTRA_RISK_DETECTION_SUMMARY`, `ENTRA_RECENT_SIGNINS`,
  `ENTRA_RECOMMENDATIONS`.
- Every principal reuses a UPN that already appears in the alert, incident,
  device, Purview, or Copilot fixtures, so cross-portal pivots line up. Rows
  carry `xdrIdentity` (set when the principal is in `IDENTITIES`) and
  `incidentId` to drive the pivots.
- The page renders: tenant summary, 7-day risk-detection rollup, a filterable
  and searchable user table (All / Flagged for risk / Privileged / MFA not
  registered / Service principals / Guests), recent risky sign-ins, privileged
  role assignments (PIM active vs. eligible), and posture recommendations.
- Teaching points preserved in the data: `MSOL_AzureSync` replication is
  expected (benign true positive); three members are MFA-unregistered so risk
  policies cannot self-remediate them; `legacy.batch` is the account CA002
  blocks; Global Administrator still holds standing assignments.
- New globals: `openEntraUser` (side panel reusing `#panel-technique`),
  `setEntraUserFilter`, `setEntraUserSearch`, `entraUserRows`,
  `currentEntraUserFilter`, `currentEntraUserSearch`, `entraRiskClass`,
  `entraMfaTag`, plus the `ENTRA_USER_FILTERS` table.
- New scoped CSS appended to `ui/styles.css`: `.entra-user-summary`,
  `.entra-kv`, `.entra-user-actions`. Nothing existing was restyled.
- Verified: `node --check` clean on `data.js` / `views.js` / `app.js`; the view
  renders 28 user rows with no `undefined`/`[object Object]` leakage; all six
  filters and the search box return the expected subsets; `openEntraUser`
  renders without error for all 28 principals; headless-Chrome screenshots
  confirmed the page and both side-panel variants (onboarded vs.
  directory-only).

NOTE: a codex agent was editing `ui/*` concurrently during this change. The
data and CSS additions were appended at EOF and the view was replaced in place,
so nothing else was overwritten — but re-check for merge damage if that sprint
also touched `#/entra/overview`.

## Ad-hoc fix (2026-08-02): KQL editor selection hid the query text
- Selecting text in the query editor made it disappear. The editor is a
  transparent `<textarea class="kql-input">` layered over a `.kql-highlight`
  `<pre>` that holds the only visible (syntax-colored) copy of the text. The
  textarea is appended after the highlight layer, so its opaque
  `::selection { background: #264f78 }` band painted straight over the colored
  text below it.
- Fixed by making the selection band translucent — `rgba(38,79,120,.55)`,
  with a `::-moz-selection` twin for Firefox — so the highlight layer reads
  through. Left a comment on the rule warning not to give it a solid color.
- Verified in headless Chrome by programmatically selecting the first four
  lines: the band samples as rgb(34,56,79) (the expected blend over #1e1e1e)
  against the rgb(30,30,30) editor background, and every token class stays
  legible through it. Covers all three editor instances
  (`#/defender/hunting`, the saved-query surface, and the Sentinel practice
  editor) since they share one component.

## Ad-hoc addition (2026-08-02): Microsoft 365 admin center

- Added Microsoft 365 Admin as a navigable workload at `#/m365-admin/home`.
  The existing waffle tile is now live, and the top portal strip includes a
  direct Microsoft 365 admin entry.
- Modeled Microsoft Learn's Dashboard view navigation with Home, Users ›
  Active users, Billing › Licenses, Reports › Usage, Health › Service health,
  Message center, Setup, and Admin centers.
- Reused the Entra tenant directory for active users and added fictional
  product-license, aggregate usage, service-health, message-center, and setup
  fixtures. Security, Compliance, and Entra specialist-center cards pivot into
  the existing Defender, Purview, and Entra lab workloads.
- Kept the portal in a single-navigation-pane shell and explicitly labels all
  actions and telemetry as local lab simulations.
- Verified current product terminology and task paths against Microsoft Learn's
  Microsoft 365 admin center overview, user creation/licensing, usage-report,
  license-assignment, and Health dashboard articles.
- `node --check` passed for `data.js`, `views.js`, and `app.js`; all eight new
  routes rendered; the full render sweep reports zero dead NAV routes and only
  the pre-existing `purview/audit` tiny-render failure. Headless Chrome drove
  Defender home › waffle › Microsoft 365 Admin, Billing › Licenses, and the top
  portal-strip return path with zero page/console errors and no 1366px overflow.

## Ad-hoc fix (2026-08-02): Defender for Cloud inventory resource health

- Finished the interrupted `#/defender-cloud/inventory` work. All 17 Azure,
  AWS, and GCP resource rows now support click, Enter, and Space activation and
  open a dedicated Resource Health panel.
- Added Overview, Recommendations, and Alerts tabs with provider-native asset
  IDs, cloud/scope/region metadata, protection and health state, exposure,
  attack-path involvement, mapped posture recommendations, and linked security
  alerts. Alert Take action panes now pivot directly back to the matching
  inventory resource.
- Corrected the Kubernetes identity mismatch: the Azure inventory asset is the
  `aks-prod` managed cluster identified by its ARM ID; `node-3` is retained as
  secondary alert context instead of being presented as the ARM resource.
- Moved the Azure cloud asset fixtures from `ui/views.js` into `ui/data.js` and
  gave every multicloud row a stable local ID. Inventory alert/recommendation
  counts now match the rows rendered in each Resource Health pane.
- Wrapped the nine-column inventory in an internal horizontal scroller and
  added visible keyboard focus, so the document itself does not overflow at
  1366×768.
- Verified against Microsoft Learn's current Cloud asset inventory and
  Investigate resource health workflows: selecting an asset leads to resource
  metadata plus Recommendations and Alerts.
- `node --check` passed for all three JavaScript files; the full render sweep
  still has zero dead NAV routes and only the pre-existing `purview/audit`
  tiny-render warning. Browser automation opened all 17 resources, exercised
  mouse and keyboard activation, all panel tabs, alert/recommendation pivots,
  and found zero console/page errors or count mismatches.

## Ad-hoc fix (2026-08-02): Defender for Cloud attack-path workflow

- Rechecked `#/defender-cloud/attack-paths` against Microsoft Learn's current
  identify/remediate guidance. Replaced the static path cards with Overview,
  Attack paths, and Choke points views; risk/asset/status/time filters; an
  interactive Attack Path Map; and node-level insights, risk factors, MITRE
  techniques, and associated recommendations.
- Added path-wide remediation with the documented distinction between
  path-breaking and additional recommendations. Lab progress persists in
  `defender-lab.defender-cloud.attack-path-remediation`; resolving every
  path-breaking recommendation changes the path to Resolved and teaches the
  documented graph-refresh delay.
- Expanded the Azure and AWS→GCP fixtures with entry points, vulnerable nodes,
  choke points, target assets, timestamps, and remediation metadata. The page
  now calls out Defender CSPM/agentless/container coverage and eligible-role
  prerequisites.
- `node --check` passed for `data.js`, `views.js`, and `app.js`; `git diff
  --check` passed. Headless Chrome at 1366×768 verified overview/list/choke
  navigation, all four filters, three- and four-node maps, node selection,
  persistent resolution/reset, resolved-status filtering, contained map
  overflow, and zero runtime errors.

## Ad-hoc fix (2026-08-02): ASIM Authentication and DNS query terminals

- `#/sentinel/hunting/authentication` had a working click handler but its
  `starttime=ago(1d)` parser parameter used wall-clock time against frozen July
  fixtures, producing 0 rows instead of 3. ASIM relative time now anchors to
  each parser's newest fixture row; all Authentication saved queries return
  3/1/1 rows and Network Session remains correct at 1/2/4.
- `#/sentinel/hunting/dns` was the remaining bespoke query surface: plain
  textarea, limited private evaluator, dead save actions, and no shared status
  feedback. It now uses `renderMockAsimLab` and the common KQL evaluator/editor,
  with top and toolbar Run actions, expected-row checks, save/delete/reset/copy,
  inspectable result rows, and shared draft persistence.
- Added `_Im_Dns` support to the common evaluator, including snapshot-relative
  start/end time and DNS parser parameters for response code, domain lists,
  response IPv4, and response prefixes. The five saved DNS queries return
  9/4/6/2/3 rows. Scoped ASIM card overflow keeps all three terminal canvases
  contained at 1366×768.
- `node --check` passed for `data.js`, `views.js`, and `app.js`; `git diff
  --check` passed. Headless Chrome completed 13/13 final assertions with zero
  runtime/log errors.

## Ad-hoc correction (2026-08-02): Defender for Cloud setup

- Replaced the thin static `#/defender-cloud/setup` summary with a persistent
  Azure subscription plan lab modeled from the current Defender for Cloud Learn
  documentation. It now separates included foundational CSPM from paid plans,
  makes plan scope and cost implications explicit, and distinguishes plan
  enablement from feature configuration and coverage verification.
- Added interactive plan selection for Defender CSPM, Servers, Containers,
  Storage, Databases, App Service, APIs, and AI. Servers Plan 1/2 dependencies,
  endpoint protection, agentless scanning, FIM, container sensor/registry
  access, and Storage add-ons can be changed and saved to localStorage.
- Added the actual study sequence: choose the Environment settings scope,
  select and save plans, wait for components, validate with Coverage/inventory,
  then investigate the resulting workload alerts in Defender for Cloud or the
  automatically integrated Defender portal. AWS/GCP/Azure Arc remain in the
  dedicated connector lab.
- Labeled setup as supporting knowledge for the July 2026 SC-200 objective,
  which directly assesses investigation and remediation of Defender for Cloud
  workload-protection alerts and incidents.
- Verified with `node --check`, a 1366×768 Chrome screenshot, and a CDP UI
  harness: 8 plan rows, default/dirty/saved state, Plan 1 dependency behavior,
  reload persistence, zero content overflow, and no route fallback all pass.

## Ad-hoc fix (2026-08-02): Defender for Cloud recommendation rows

- Microsoft Learn documents recommendation rows as selectable: opening a row
  reveals overview, remediation, affected assets, related initiatives, and
  applicable attack-path context. `#/defender-cloud/recommendations` previously
  inherited a pointer cursor but had no interaction.
- Recommendation rows now open a dedicated, keyboard-operable side panel with
  those four views. The fictional fixtures include risk context, remediation
  sequences, affected assets, and initiative mappings; action buttons remain
  explicit local lab simulations.
- Verified all eight rows in headless Chrome at 1366×768: mouse and Enter-key
  activation open the correct recommendation, all four tabs render their
  expected content, and the page has no horizontal overflow. JavaScript syntax
  checks passed; the full render sweep remains 112/113 with only the unrelated
  pre-existing `purview/audit` tiny-render failure.

## Ad-hoc publication branding (2026-08-02): Hacksmartersoft

- Rebranded the publication shell and browser title as **Hacksmartersoft
  Security Lab**. After the publication requirement was clarified, removed the
  restricted vendor word from every file under `ui/` and from `README.md`.
- Product labels are now neutral (`Defender for Cloud`, `Defender XDR`,
  `Sentinel`, `Purview`, `Entra`, and `365 Admin`). Fixture identifiers, mock
  domains, provider paths, source comments, and the Graph activity table were
  renamed too, preventing the word from resurfacing in rendered technical data.
- Removed the two outbound vendor-documentation links and replaced the footer
  with a generic independent-simulator notice.
- Verified the Defender for Cloud recommendations route at 1366×768 in headless
  Chrome. Case-insensitive scans of the complete publishable `ui/` tree,
  `README.md`, and rendered DOM return zero matches. JavaScript syntax checks
  passed; the render sweep remains 112/113 with only the unrelated pre-existing
  `purview/audit` tiny-render failure.

## Ad-hoc fix (2026-08-02): Microsoft 365 Message center reading pane

- Corrected `#/m365-admin/message-center` so selecting a post opens a dedicated
  reading pane, matching the current Microsoft 365 admin workflow rather than
  behaving like a static table.
- Expanded the three fictional posts with the April 2026 Message center
  structure: change rationale, rollout schedule, tenant impact, recommended
  actions, and compliance considerations, plus timing, relevance, platform,
  tenant status, and monthly-active-user context.
- Added keyboard-operable rows, read/unread state, favorites, archive/restore,
  share simulation, active/archive tabs, and previous/next post navigation.
  State is local-only and persists through refresh.
- CDP browser harness passed 15/15 checks covering row click, detail sections,
  read state, navigation, favorite, unread, archive, keyboard activation,
  refresh persistence, archive tab, and zero main/pane horizontal overflow.
  `node --check` passed for `data.js`, `views.js`, and `app.js`.

## Sprint (2026-08-05): Defender-portal nav accuracy + guided hunting

Grounded throughout against Microsoft Learn via the `microsoft-learn` MCP
server, not from memory. Source pages are cited inline below.

### 1. Nav accuracy — the Defender workload nav was modeling routes that
### don't exist and hiding ones that do

Per [Microsoft Sentinel in the Defender portal][1], Content hub / Repositories /
Community are **Sentinel** nodes (`Microsoft Sentinel > Content management`),
and `Microsoft Sentinel > Configuration` holds exactly Data connectors,
Analytics, Watchlists, Automation.

- Deleted the fabricated `defender/content-hub`, `defender/repositories`, and
  `defender/community` stub views plus their `SECONDARY_SURFACES` entries; the
  Defender nav now points at the real `#/sentinel/*` surfaces.
- Added the Sentinel `Configuration` group. **`#/sentinel/automation` was fully
  built but unreachable from the Defender nav** — same for Data connectors and
  Watchlists. This was the reported "the automation rule is missing" symptom.
- Promoted Endpoints, Email & collaboration, and Cloud apps to their own
  sections; ASR policies now sits under Endpoints ([endpoint security
  policies][2]), Threat explorer under Email & collaboration.
- `Exposure management` became a section holding Secure score and Vulnerability
  management, which [moved under Exposure management][3].
- `System` holds Settings, Device discovery, Suppression rules, Email
  notifications, Multi-tenant management — all Settings sub-pages in the real
  portal.

### 2. Nav sub-sections (new renderer capability)

The renderer was one level deep, so `Investigation & response > Hunting >
Advanced hunting` ([per the modes doc][4]) could not be expressed.

- `ui/app.js`: `renderSidenav` now understands `{ subsection:'…' }`. Collapse
  state is namespaced by parent via `subKey()` so a label like "Hunting" can
  repeat under different sections. An item hides when *either* its section or
  its subsection is collapsed; a new section resets subsection scope.
- `ui/styles.css`: `.navsubsection`, `.navsubsection-toggle`, `.navitem-nested`.
- `Investigation & response` now nests **Incidents & alerts**, **Hunting**,
  **Actions & submissions**.
- Renamed `Custom detections` → `Custom detection rules` to match the portal.

### 3. Guided hunting mode (new)

[Advanced hunting supports guided and advanced modes][4]; only the KQL editor
existed. New `ui/guided-hunting.js` (loaded in `index.html` before `views.js`).

- Mode tabs on `#/defender/hunting`; last-used mode persists. A query handed
  over from another page (the `hunting.prefill` handoff) forces advanced mode.
- Data domain selector with all six product domains ([domain list][5]).
- Basic filters by default (AND-only); the "Toggle to see more filters and
  conditions" switch unlocks the full set plus OR — matching the product.
- Load sample queries, filtered by selected domain; loading a sample that uses
  non-basic filters auto-reveals all filters, as the product does.
- **Table pinning**: the first condition pins the table and filters from other
  tables grey out until Clear all. Deliberate divergence from the product (which
  unions internally) — it keeps emitted KQL single-table and runnable against
  the bundled fixtures, and makes "the schema decides the table" concrete.
- The compiled KQL is shown in a preview pane *and* mirrored into the advanced
  editor, so the filter → `| where Col == "value"` mapping stays visible. This
  is the pedagogical point of the feature.
- `GUIDED_HUNTING_DOMAINS` / `_OPERATORS` / `_FILTERS` / `_SAMPLES` in `data.js`.
  Filter columns and suggested values are taken from the real fixtures so built
  queries return rows.

### 4. Mock KQL evaluator bug found and fixed

`mockKqlEvalPredicate` captured the string literal raw for
`has|contains|startswith|endswith` while `==` got escape processing for free by
evaluating the literal as JS. So `startswith "C:\\Users"` never matched a path
containing `C:\Users`. Added `mockKqlUnescapeLiteral()` and applied it to that
branch. Verified against all 11 `SAVED_QUERIES`: **0 changed** row counts.

### Verification

- `node --check` clean on `data.js`, `views.js`, `app.js`, `guided-hunting.js`.
- `node bin/render_all.js`: 109/110, dead NAV routes 0. The single failure is
  the pre-existing, unrelated `purview/audit` tiny-render.
- All 114 nav routes across every workload resolve to a defined `VIEWS[]`.
- Nav nesting: scripted test covers default state, subsection collapse, parent
  collapse hiding subsection headers, and independent state on re-expand.
- Guided builder: 51/51 — every sample query, every filter's first suggested
  value, every operator in `GUIDED_HUNTING_OPERATORS`, OR joins, and edge cases
  (empty state, empty value, number/bool unquoted, quote and backslash escaping).

### Known / not done

- `purview/audit` renders tiny. Pre-existing, untouched.
- `SAVED_QUERIES` "Process executions from Public folder" returns 0 rows because
  of `SHA256 has "c"` — correct KQL (`has` is term-based; `c` is not a term in a
  hex hash). Pre-existing and arguably good teaching material; left alone.
- The Email and collaboration guided domain has no bundled fixture tables, so it
  shows an explicit empty-state callout rather than silently returning nothing.
- Breadcrumbs on relocated views still name their old sections (e.g.
  `#/defender/settings` says `Configuration ›` but now lives under System).
  Not yet synced.
- `Alert tuning` is placed under Investigation & response to match its own
  breadcrumb; the portal files it under `Settings > Microsoft Defender XDR`.

[1]: https://learn.microsoft.com/azure/sentinel/microsoft-sentinel-defender-portal#quick-reference
[2]: https://learn.microsoft.com/defender-xdr/microsoft-365-security-center-mde#what-to-expect
[3]: https://learn.microsoft.com/defender-vulnerability-management/tvm-microsoft-secure-score-devices
[4]: https://learn.microsoft.com/defender-xdr/advanced-hunting-modes
[5]: https://learn.microsoft.com/defender-xdr/advanced-hunting-query-builder#specify-the-data-domain-to-hunt-in

## Correction (2026-08-05, same day): Sentinel section shape was wrong

The earlier restructure in this file was built from `microsoft_docs_search`
excerpts. Fetching the full page with `microsoft_docs_fetch` showed the Sentinel
section's *shape* was wrong, and surfaced six more built-but-unreachable routes.

- **Content management and Configuration are subsections _under_ Microsoft
  Sentinel**, not siblings. Every row in the source table reads
  `Microsoft Sentinel > Content management > …`. The excerpts rendered them as
  separate tables, which hid the hierarchy. Fixed using the subsection renderer.
- **Added `Microsoft Sentinel > Threat management`** with Workbooks, Hunting,
  Notebooks, MITRE ATT&CK — all four views existed, none were in the Defender nav.
- **Search pointed at the wrong route** (`#/sentinel/hunting`); the doc maps it
  to `Microsoft Sentinel > Search` and `#/sentinel/search` exists. Fixed.
- **Removed the bogus "Threat management" _route_** (`#/sentinel/incidents`).
  Threat management is a subsection; Sentinel Incidents maps to
  `Investigation & response > Incidents & alerts > Incidents`, already present.
- Added `Intel management` (`#/sentinel/threat-intel`) under Threat intelligence
  and `Microsoft Sentinel` settings (`#/sentinel/settings`) under System.

Net: 6 more views became reachable. Same bug class as the Automation report.

### New: `NAV_SPEC.md`

Verified source of truth for `NAV.defender`, with a per-row citation table. Read
it before touching the left nav. It records explicitly:

- **Docs establish parentage, not ordering.** The source tables are "organized as
  Microsoft Sentinel is in the Azure portal" — Azure-blade order, not Defender
  nav sequence. The authoritative artifact for sequence is a screenshot. Section
  order in `data.js` is a reasoned choice and must not be cited as sourced.
- Unverified placements: `defender/mto`, `sentinel/graph`, `defender/alert-tuning`.
- Nodes that must never enter `NAV.defender`: News & guides, Workspace manager,
  and any Defender-owned Content hub / Repositories / Community.

### New invariant

`NAV_SPEC.md` carries an orphan-view check (every `VIEWS[...]` reachable from
some nav). It currently reports 7, of which 5 are legitimate drill-down detail
routes (`defender/incident`, `defender/device`, `defender/identity`,
`defender/discovered-device`, `copilot/session`). Two look like real gaps:
`purview/ai-hub` and `defender/email-collab/threat-explorer/campaigns`. The
check needs a detail-route exclusion list before it is CI-worthy.

### Queued: Agent 20 in `AGENTS.md`

Breadcrumb sync — 10 views still name their pre-restructure section (e.g.
`#/defender/settings` renders `Configuration ›` but now lives under System).
Checklist is per-view with the exact old → new string, plus an embedded audit
command that must report `stale: 0`. Run with `bin/run-codex-agents.sh 20`.
`defender/home` is deliberately excluded (top-level item, no section).
