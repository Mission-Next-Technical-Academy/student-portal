# SC-200_lab — per-agent task plan

Tasks divided by agent strength. Each agent should read `SC200_LAB.md`
(master), `ExamObjectives.md` (scope), and `HANDOFF.md` (sprint state)
before starting. Hard rules from `SC200_LAB.md` apply to all agents —
especially: **no copying Microsoft proprietary HTML/CSS/JS, ever**;
look-alike from scratch only.

When you finish a task, mark it `[x]` here AND update `HANDOFF.md`.

---

## Agent A — Codex CLI (heavy code lifting)
Best for: writing lots of structured JS/HTML quickly, mock data
generation, expanding view functions, refactoring.

- [x] **A1. Smoke-test pass.** Walk every route listed in
  `ExamObjectives.md` at `http://127.0.0.1:8765/`. Open Firefox devtools.
  For each route, record: render OK? console errors? broken inline
  handlers? File one fix-PR-style commit per cluster of related bugs.
- [x] **A2. Build missing views.** These routes are in `NAV` but the
  view function is either thin or absent — flesh them out following the
  existing `VIEWS[...]` pattern in `ui/views.js`:
  - `sentinel/workbooks` (add 2–3 sample workbook detail panels)
  - `sentinel/automation` → playbook detail side panel
  - `defender-cloud/alerts` (expand with 8–10 alerts, severities mixed)
  - `purview/information-protection` → label-policy detail
  - `purview/audit` → wire the search form to filter `AUDIT_LOG`
- [x] **A3. Mock data expansion.** Grow `ui/data.js`:
  - 5 more incidents covering the remaining scenario archetypes in
    `ExamObjectives.md` (ransomware, AiTM phishing, container breakout,
    AAD risky sign-in, S3-style cloud misconfig)
  - 4 more saved KQL queries with matching fixture rows in
    `MOCK_QUERY_RESULTS`
  - Sentinel Graph entity-graph data shape (nodes/edges) for one incident
- [x] **A4. KQL runner upgrade.** In `runKqlQuery()` (currently in the
  hunting view's `onMount`), parse the leading table name AND a simple
  `where field == "value"` clause; filter the fixture rows accordingly.
  Document the supported subset in a comment.

Agent A note, 2026-06-28: route smoke passed with headless Chrome
`--dump-dom` and Firefox headless screenshots for every NAV route. This
directory is not a Git repository, so fix-PR-style commits could not be
created here.

## Agent B — Claude (me, or another Claude session)
Best for: design polish, UX coherence, IP-sensitive judgment calls,
prose, memory/handoff hygiene.

- [x] **B1. Scenario walkthrough mode.** Add a "Guided scenario" picker
  on the Defender home that walks the user through one of the
  archetypes in `ExamObjectives.md` step-by-step (open this alert →
  inspect that entity → create suppression rule with these conditions
  → observe result). Implement as a thin overlay/coach-mark layer on
  top of the existing views; no view rewrites.
- [x] **B2. Copilot side panel stub.** Add a right-edge "Security
  Copilot" slide-in panel reachable from the topbar sparkle button.
  Hard-code 4 sample prompts and canned answers (incident summary,
  KQL drafting, entity expansion, MITRE mapping). All static.
- [x] **B3. Visual QA pass.** Walk the lab in Firefox at 1366×768 and
  1920×1080. Catch alignment drift, contrast on dark-themed top bars,
  side-panel scroll behavior on long content.
- [x] **B4. README + HANDOFF refresh** at end of each sprint
  ([[feedback_sprint_handoff]]).

## Agent C — Explore / research subagent
Best for: read-only verification against current SC-200 syllabus and
Microsoft Learn modules.

- [x] **C1. Syllabus drift check.** Compare `ExamObjectives.md`
  against the latest published SC-200 study guide on
  `learn.microsoft.com`. Note any objectives we've missed or any that
  have been removed since 2026-04-16. Report findings in a new
  `OBJECTIVES_DELTA.md` — do NOT edit `ExamObjectives.md` directly.
  *Reminder:* do not copy text wholesale; summarize in our own words.
- [x] **C2. Scenario validation.** For each of the 10 archetypes in
  `ExamObjectives.md`, confirm it maps to real Microsoft Learn
  module content. Flag any that look invented.

## Agent D — Verify / smoke-test (lightweight, optional)
Run after every meaningful change.

- [ ] **D1.** `python3 -m http.server` is up; `curl -sS
  http://127.0.0.1:8765/ -o /dev/null -w "%{http_code}\n"` returns 200.
- [ ] **D2.** Open Firefox to `/`, hard-refresh, confirm:
  default route loads Defender home; waffle opens app switcher; each
  workload reachable; alert detail panel opens; suppression rule save
  re-renders alerts; "Replay scenario events" works.
- [ ] **D3.** `localStorage.getItem('defender-lab.rules')` is populated
  after saving a rule and survives a hard refresh.

---

# Sprint 2 — close the OBJECTIVES_DELTA gaps (added 2026-07-06)

Numbered agents, one per surface, parallelizable. Each bullet in
`OBJECTIVES_DELTA.md` § "Missing or under-specified objectives" carries its
`[Agent N]` label. 9 agents total = 100% delta coverage. Same reading order
and hard rules as above. Mark `[x]` here and update `HANDOFF.md` when done.

## Agent 1 — Objectives doc sync (docs only, small)
- [x] **1.1** Update `ExamObjectives.md` to reference the 2026-06-26 Learn
  page and the July 28, 2026 skill outline; add explicit skill weights
  (40-45 / 35-40 / 20-25).
- [x] **1.2** Add Azure cloud services to the candidate familiarity list.
- [x] **1.3** Add all `OBJECTIVES_DELTA.md` missing objectives as concise
  bullets (own words, no Learn text copied).
- [x] **1.4** Re-label Defender for Cloud posture + Purview DLP/Insider Risk
  scenarios as supporting study content per the delta's de-emphasis notes.

## Agent 2 — Defender XDR/MDE settings & automation
- [ ] **2.1** `#/defender/settings` surface: MDE advanced features toggles,
  rules settings, custom data collection, device groups, permissions/roles,
  automation levels per group.
- [ ] **2.2** ASR policy configuration view (audit vs block modes,
  per-rule states, exclusions).
- [ ] **2.3** Email notification rules for incidents, actions, and threat
  analytics (create-notification flow, lab-static).
- [ ] **2.4** Alert correlation/tuning beyond suppression: show how alerts
  roll into incidents and a tuning-rule surface.
- [ ] **2.5** AIR (automated investigation & response) center + automatic
  attack disruption explanation surface with a disrupted-incident example.

## Agent 3 — MDE device response deepening
- [ ] **3.1** Live response: replace the toast stub with a lab console
  (canned `dir`/`getfile`/`run` transcript, session log).
- [ ] **3.2** Investigation package: replace toast stub with collection
  flow + package-contents explainer (what's in the ZIP, when to use it).
- [ ] **3.3** Tag an incident as "Attack disruption" with the contain-user /
  contain-device automatic actions shown on the timeline.
- [ ] **3.4** Burn down the `DEVICE_PAGE_PARITY.md` gap list (response-action
  strip gaps, internet-facing tag, flag column, process tree, Effective
  settings tab).

## Agent 4 — Sentinel ingestion (connectors + DCR family)
- [ ] **4.1** Windows Security Events via AMA lab: content-hub solution →
  connector → DCR with event-set/xPath scoping, mirroring the Syslog lab
  pattern at `app.js:1495`.
- [ ] **4.2** CEF via AMA lab (connector row already exists in
  `data.js:1096`; build the workflow + `CommonSecurityLog` fixture rows).
- [ ] **4.3** Windows Event Forwarding planning study card (WEF vs AMA,
  when each applies).
- [ ] **4.4** Azure Activity collection via Azure Policy / diagnostic
  settings workflow.
- [ ] **4.5** Logs Ingestion API custom-table lab: app registration +
  Monitoring Metrics Publisher role, DCE vs DCR direct endpoint,
  `streamDeclarations`/`transformKql`, `Custom-` vs `Microsoft-` streams,
  creating a `_CL` table. (The gap Alex spotted 2026-07-06.)

## Agent 5 — Sentinel data platform & hunting infrastructure
- [ ] **5.1** Extend table-plan cards with Data lake tier and XDR-tier
  retention; retention decision guidance (Analytics vs Data lake vs XDR).
- [ ] **5.2** SOC optimization page (coverage + data-value recommendations).
- [ ] **5.3** Summary rule tables lab (aggregate a noisy table into a
  summary table, query both).
- [ ] **5.4** Sentinel KQL jobs in Data lake (long-running job → results
  table, contrast with the existing Basic-table search job).
- [ ] **5.5** Build `#/sentinel/notebooks` — nav link at `data.js:1845` is
  currently a dead route. Include Sentinel MCP Server connection notes.

## Agent 6 — Detection engineering completion
- [ ] **6.1** Add rule-type chooser to the analytics wizard: NRT (with its
  limits), Threat intelligence, ML behavior analytics (Fusion), alongside
  the existing scheduled type.
- [ ] **6.2** Sentinel anomalies page (customizable anomaly rules, how they
  feed hunting/detections).

## Agent 7 — Incident response surfaces
- [ ] **7.1** Defender for Cloud Apps investigation surface: risky OAuth
  app investigation tied to the existing phishing→OAuth incident.
- [ ] **7.2** Entra ID compromised-identity investigation view (risky
  sign-ins, risk detections, confirm-compromise/dismiss actions) tied to
  the existing risky sign-in incident.
- [ ] **7.3** Case management: Sentinel/Defender cases with tasks,
  assignment, linked incidents.
- [ ] **7.4** Sentinel incidents viewed through the Defender XDR lens
  (unified queue callouts on `#/sentinel/incidents`).
- [ ] **7.5** Upgrade Copilot panel: one guided agentic investigation flow
  (multi-step plan → tool calls → verdict), still fully static.
- [ ] **7.6** Dedicated Sentinel Graph view rendering the existing INC-1042
  node/edge fixtures (entity relationship analysis).

## Agent 8 — M365 investigation & threat analytics depth
- [ ] **8.1** Microsoft Graph activity logs: fixture table + hunting rows +
  where-it-lives guidance (enable via diagnostic settings).
- [ ] **8.2** Threat analytics depth: 2–3 report detail pages (overview,
  analyst report, related incidents, exposure) + interpretation guidance —
  route exists at `views.js:722` but is thin.
- [ ] **8.3** eDiscovery Content search workflow inside
  `#/purview/ediscovery` (build search → preview → export for
  investigation).

## Agent 9 — QA / verify sweep (run last)
- [ ] **9.1** Old Agent D checklist (D1–D3): server 200, full click-through,
  `defender-lab.rules` localStorage survives hard refresh.
- [ ] **9.2** All nav routes render — especially the new Sprint 2 routes and
  the previously dead `#/sentinel/notebooks`.
- [ ] **9.3** Browser passes from `HANDOFF.md` § Next useful work
  (custom-detections/hunting-graph overflow at 1366×768, analytics wizard
  entity picker, copy buttons, Purview DLP→IRM→eDiscovery walk).
- [ ] **9.4** Update `HANDOFF.md` and mark Sprint 2 boxes here.

---

## Rules for every agent
1. **No proprietary Microsoft code** in this repo. Visual references
   are fine to look at; copy/paste/near-copy is not. All chrome is
   built from scratch in `styles.css`.
2. **No build step.** Vanilla HTML/CSS/JS. The lab must run from
   `python3 -m http.server` with no install.
3. **No real auth, no real network calls.** Everything is in-memory
   or `localStorage`.
4. **No secrets in any file** ([[feedback_cyber_hygiene]]). The fake
   hashes in `data.js` are `aaa…`, `bbb…`, `ccc…` for a reason.
5. **Terse comms** ([[feedback_style]]). End-of-turn: 1–2 sentences.
6. **Sprint handoff** at end of session — update `HANDOFF.md`
   ([[feedback_sprint_handoff]]).
