#!/usr/bin/env python3
"""Script-that-writes-briefs: emits fully self-contained goose view tasks.

Each brief inlines the whole view contract (no file reads — qwen2.5:7b
stalls on indirection), so a task = contract + fixture schema + numbered
page structure. Regenerate any time: python3 local-tasks/gen_view_task.py
"""
import pathlib

LT = pathlib.Path(__file__).resolve().parent

CONTRACT = """RULES (violating any = task failure):
- Create exactly ONE file at this ABSOLUTE path (use it verbatim):
  /home/alex/defender-lab/local-tasks/out/views/{draft}.js
- Do NOT read or edit ANY other file. Do NOT run git or shell commands.
- The characters "http" must not appear anywhere. All content fictional.
- Do NOT use onMount, document, window, fetch, localStorage, addEventListener.

THE VIEW CONTRACT (everything you need — do not look elsewhere):
- Line 1 of the file must be exactly:
// nav: {nav}
- Then ONE statement: VIEWS['{route}'] = () => ` ...html... `;
- It is a JS template literal returning HTML. Fixture consts are global.
- Helper functions that exist (NO others do): esc(x) HTML-escapes a value —
  wrap EVERY fixture value in it; cap(s); fmtTime(iso) formats a datetime;
  toast('msg') for buttons; labList(key) returns a saved array;
  labPush(key,obj,'msg'), labToggleFlag(key,id,'msg'), labGet(key,default),
  labSet(key,val,'msg') save state and re-render.
- Allowed CSS classes ONLY: page-header, breadcrumb, page-subtitle,
  page-actions, btn btn-primary, btn btn-secondary, btn btn-secondary btn-sm,
  grid, two-col, three-col, card, card card-body, card-toolbar, tile,
  tile-title, tile-sub, tile-icon, kpi, kpi-value, kpi-label, muted,
  alert-section-title, kv, chip-link, tag, tag orange, tag green,
  sev high, sev medium, sev low.
- Page header pattern (copy this shape):
  <div class="page-header">
    <div>
      <div class="breadcrumb">{crumb}</div>
      <h1>{h1}</h1>
      <div class="page-subtitle">ONE sentence: what the learner does here.</div>
    </div>
    <div class="page-actions">{actions}</div>
  </div>
- Table pattern: <table class="grid"><thead><tr><th>...</th></tr></thead>
  <tbody>${{CONST.map(r => `<tr><td>${{esc(r.key)}}</td>...</tr>`).join('')}}</tbody></table>
- KPI pattern: <div class="kpi"><div class="kpi-value">${{EXPR}}</div><div class="kpi-label">Label</div></div>
- Internal links only: <a class="chip-link" href="#/workload/page">label</a>
- The file must pass node --check. Write the file, then STOP. No summary.
"""

B = {}  # id -> dict(nav, route, crumb, h1, actions, body)

B["v12"] = dict(
 title="Security Copilot plugins view",
 nav="Manage | Plugins | 🧩", route="copilot/plugins",
 crumb="Security Copilot › <strong>Plugins</strong>", h1="Plugins",
 actions="""<button class="btn btn-primary" onclick="toast('Plugin catalog is a fictional lab surface.')">Add plugin</button>""",
 body="""FIXTURE (global const, already exists): COPILOT_PLUGINS — array of 12
objects, keys: id, name, category ('First-party'|'Non-Microsoft'|'Custom'),
status ('On'|'Off'), description, setupNote.

PAGE STRUCTURE (in order):
1. The page-header block shown above.
2. <div class="grid"> with three kpi blocks: total (12), count with
   status 'On', count with category 'Custom' — compute with
   ${COPILOT_PLUGINS.filter(p => ...).length}.
3. A full table of all 12 plugins. Columns: Name, Category (in
   <span class="tag">), Status (<span class="tag green"> when On,
   <span class="tag orange"> when Off), Description, Setup note.
4. A card card-body closing note (3-4 own-words sentences): plugins ground
   Copilot answers in security data; first-party plugins connect tenant
   products; custom KQL/API plugins extend reach; the most relevant enabled
   plugin is chosen to answer a prompt.""")

B["v13"] = dict(
 title="Security Copilot sessions view",
 nav="My Copilot | Sessions | 🗂", route="copilot/sessions",
 crumb="Security Copilot › <strong>Sessions</strong>", h1="Sessions",
 actions="""<button class="btn btn-primary" onclick="toast('New sessions are static in this lab; open a transcript below.')">New session</button>""",
 body="""FIXTURES (global consts, already exist):
- COPILOT_SESSIONS — 8 objects: id, name, owner, workspace, lastActivity
  (ISO), promptCount, plugins (array), pinned (bool).
- COPILOT_TRANSCRIPTS — 2 objects: sessionId, steps (array of 5 objects:
  role ('analyst'|'copilot'), text, plugin, pinned).

PAGE STRUCTURE (in order):
1. page-header block.
2. Table of all 8 sessions. Columns: Session (name), Owner, Workspace,
   Last activity (fmtTime), Prompts (promptCount), Plugins (join ', '),
   Pinned (<span class="tag green">Pinned</span> if pinned, else
   <span class="muted">—</span>).
3. <div class="alert-section-title">Transcripts</div> then for each of the
   2 transcripts a card card-body: title 'Session ' + sessionId, then each
   step as a kv row: <div class="kv"><span class="tag">${esc(s.role)}</span>
   <span>${esc(s.text)}</span> <span class="muted">${esc(s.plugin)}</span></div>
4. Closing card card-body (3 own-words sentences): sessions persist an
   investigation's prompts and answers; pinboard items feed reports; sessions
   can be shared with the team in the real product.""")

B["v14"] = dict(
 title="Security Copilot promptbook library view",
 nav="My Copilot | Promptbook library | 📔", route="copilot/promptbooks",
 crumb="Security Copilot › <strong>Promptbook library</strong>", h1="Promptbook library",
 actions="""<button class="btn btn-primary" onclick="toast('Promptbook run simulated — see the sessions page for a saved example.')">Run promptbook</button>""",
 body="""FIXTURE (global const, already exists): COPILOT_PROMPTBOOKS — 8 objects:
id, name, source ('Microsoft'|'Custom'), description, inputs (array),
prompts (array of 3-5 ordered prompt strings).

PAGE STRUCTURE (in order):
1. page-header block.
2. <div class="three-col"> of ALL 8 promptbooks as tiles:
   tile-title = name; tile-sub = <span class="tag green"> for Microsoft or
   <span class="tag orange"> for Custom, plus inputs joined ', ' (or 'No
   inputs'); then the description in muted; then an <ol> with one <li> per
   prompt (esc each).
3. Closing card card-body (3-4 own-words sentences): promptbooks are saved
   prompt sequences for repeatable investigations; inputs parameterize them;
   custom promptbooks capture a team's playbook knowledge.""")

B["v15"] = dict(
 title="Security Copilot capacity & owner settings view",
 nav="Owner settings | Capacity & settings | ⚙", route="copilot/settings",
 crumb="Security Copilot › <strong>Owner settings</strong>", h1="Capacity & owner settings",
 actions="""<button class="btn btn-primary" onclick="toast('Capacity changes are simulated in this lab.')">Change capacity</button>""",
 body="""FIXTURES (global consts, already exist):
- COPILOT_USAGE — 14 objects: date ('YYYY-MM-DD'), unitsUsed (number),
  sessions (int).
- COPILOT_CAPACITY — object: provisionedSCU (6), overageAllowed (bool),
  region, owners (array of 2 names).

PAGE STRUCTURE (in order):
1. page-header block.
2. <div class="grid"> with three kpis: 'Provisioned SCU' =
   ${COPILOT_CAPACITY.provisionedSCU}; 'Avg daily units' = compute
   ${(COPILOT_USAGE.reduce((a,u) => a + u.unitsUsed, 0) / COPILOT_USAGE.length).toFixed(1)};
   'Peak day' = ${Math.max(...COPILOT_USAGE.map(u => u.unitsUsed))}.
3. Table of all 14 usage rows. Columns: Date, Security compute units,
   Sessions, plus a Status column: <span class="sev high">Over</span> when
   unitsUsed > COPILOT_CAPACITY.provisionedSCU else
   <span class="tag green">Within</span>.
4. card card-body with kv rows for region, owners (join ', '), and overage:
   'Allowed' or 'Blocked' from overageAllowed.
5. Closing card card-body (3 own-words sentences): SCUs are the provisioned
   compute for Copilot; owners watch usage vs provisioned units and adjust;
   overage lets bursts through at extra cost.""")

B["v16"] = dict(
 title="Security Copilot knowledge bases view",
 nav="Manage | Knowledge | 📚", route="copilot/knowledge",
 crumb="Security Copilot › <strong>Knowledge</strong>", h1="Knowledge",
 actions="""<button class="btn btn-primary" onclick="toast('Uploads are simulated; sources below are fictional.')">Add source</button>""",
 body="""FIXTURE (global const, already exists): COPILOT_KNOWLEDGE — 5 objects:
id, name, type ('File upload'|'Search index'), items (int), status
('Ready'|'Indexing'), scope, addedBy.

PAGE STRUCTURE (in order):
1. page-header block.
2. Table of all 5 sources. Columns: Name, Type (<span class="tag">),
   Items, Status (tag green when Ready, tag orange when Indexing), Scope,
   Added by.
3. card card-body 'Grounded answer example': a kv row with
   <span class="tag">analyst</span> asking which severance policies apply
   to a departing employee under investigation, and a second kv row with
   <span class="tag green">copilot</span> answering in one fictional
   sentence that cites the 'HR policies' source by name.
4. Closing card card-body (3 own-words sentences): knowledge bases ground
   answers in your own documents; scoping controls who can use a source;
   grounded answers cite their source.""")

B["v17"] = dict(
 title="Defender Vulnerability Management view",
 nav="Endpoints | Vulnerability management | 🩹", route="defender/vulnerabilities",
 crumb="Endpoints › <strong>Vulnerability management</strong>", h1="Vulnerability management",
 actions="""<a class="btn btn-secondary" href="#/defender/exposure">Exposure management</a>
      <button class="btn btn-primary" onclick="toast('Remediation request created in the fictional queue.')">Request remediation</button>""",
 body="""FIXTURES (global consts, already exist):
- TVM_SOFTWARE — 10 objects: id, name, vendor, version, weaknesses (int),
  exposedDevices (int), threatInsight.
- TVM_CVES — 12 objects: id, cve, severity ('Critical'|'High'|'Medium'|'Low'),
  cvss (number), software, exploitAvailable (bool), exposedDevices.
- TVM_RECOMMENDATIONS — 8 objects: id, title, software, exposedDevices,
  impact (number), status ('Active'|'Exception'|'Completed').

PAGE STRUCTURE (in order):
1. page-header block.
2. <div class="grid"> with three kpis: total CVEs (12), Critical+High count
   (filter severity), exploit-available count (filter exploitAvailable).
3. <div class="alert-section-title">Security recommendations</div> + table
   of all 8. Columns: Recommendation (title), Software, Exposed devices,
   Impact, Status (tag green Completed / tag orange Exception / tag Active),
   Action: a button per row EXACTLY like this:
   <button class="btn btn-secondary btn-sm" onclick="labToggleFlag('tvm-exceptions','${r.id}','Exception toggled for ${r.id}.')">Toggle exception</button>
4. <div class="alert-section-title">Weaknesses</div> + table of all 12 CVEs.
   Columns: CVE, Severity (sev high for Critical/High, sev medium for
   Medium, sev low for Low), CVSS, Software, Exploit
   (<span class="sev high">Exploit available</span> or muted '—'),
   Exposed devices.
5. <div class="alert-section-title">Software inventory</div> + table of all
   10. Columns: Software, Vendor, Version, Weaknesses, Exposed devices,
   Threat insight.
6. Closing card card-body (3 own-words sentences): prioritize by exposure
   and exploit availability; remediation requests hand off to IT tooling;
   exceptions accept risk for a scoped time.""")

B["v18"] = dict(
 title="MDO Threat Explorer view",
 nav="Email & collaboration | Threat explorer | 📧", route="defender/threat-explorer",
 crumb="Email & collaboration › <strong>Explorer</strong>", h1="Threat explorer",
 actions="""<a class="btn btn-secondary" href="#/defender/email-collab">Email & collaboration</a>
      <button class="btn btn-primary" onclick="toast('Selected messages queued for remediation (soft delete) — fictional.')">Remediate</button>""",
 body="""FIXTURE (global const, already exists): TX_EMAILS — 15 objects: id,
time (ISO), subject, sender, recipient, verdict ('Phish'|'Malware'|'Spam'|
'Clean'), threat, deliveryAction ('Blocked'|'Delivered'|'Junked'|'ZAP removed'),
campaign ('Invoice lure June'|'Payroll update lure'|'None').

PAGE STRUCTURE (in order):
1. page-header block.
2. <div class="grid"> four kpis: Phish count, Malware count, ZAP removed
   count (filter deliveryAction), campaigns = 2.
3. Table of all 15 emails. Columns: Time (fmtTime), Subject, Sender,
   Recipient, Verdict (sev high for Phish/Malware, sev medium Spam,
   tag green Clean), Threat, Delivery action (tag orange when 'Delivered',
   otherwise tag), Campaign (chip: <span class="tag">${esc(m.campaign)}</span>
   unless 'None' then muted '—').
4. Closing card card-body (3-4 own-words sentences): Explorer pivots across
   malicious email by verdict and campaign; delivered phish gets remediated
   (soft delete) or was already zapped; campaign view groups a wave under
   one lure.""")

B["v19"] = dict(
 title="Defender for Cloud multicloud connectors view",
 nav="Environment | Multicloud connectors | ☁", route="defender-cloud/multicloud",
 crumb="Defender for Cloud › <strong>Multicloud connectors</strong>", h1="Multicloud connectors",
 actions="""<a class="btn btn-secondary" href="#/defender-cloud/environment">Environment settings</a>
      <button class="btn btn-primary" onclick="toast('Connector wizard is described in the cards below — fictional lab.')">Add connector</button>""",
 body="""FIXTURES (global consts, already exist):
- MC_CONNECTORS — 2 objects (one AWS, one GCP): id, cloud, accountId,
  plans (array), health ('Healthy'|'Warning'), lastSync (ISO).
- MC_RESOURCES — 12 objects: id, cloud, type, name, region, riskLevel.
- MC_ALERTS — 2 objects: id, cloud, title, severity, resource, description.

PAGE STRUCTURE (in order):
1. page-header block.
2. <div class="two-col"> — one card per connector: card-toolbar with cloud
   name + health (tag green Healthy / tag orange Warning); kv rows for
   account, plans (join ', '), last sync (fmtTime); a muted onboarding
   summary sentence IN OWN WORDS (AWS: connector deploys a template that
   grants Defender for Cloud read access across selected regions; GCP: an
   onboarding script enables the APIs and service account for the project).
3. <div class="alert-section-title">Discovered resources</div> + table of
   all 12. Columns: Resource (name), Cloud (tag), Type, Region, Risk
   (sev high High / sev medium Medium / sev low Low / muted None).
4. <div class="alert-section-title">Multicloud alerts</div> + a two-col of
   the 2 alerts as cards: title, severity (sev high/medium), resource,
   description.
5. Closing card card-body (3 own-words sentences): connectors extend CSPM
   and workload protection over AWS/GCP; plans are chosen per connector;
   findings land in the same recommendations, inventory, and alerts queues.""")

B["v20"] = dict(
 title="Sentinel MSSP & Lighthouse view",
 nav="Configuration | MSSP & Lighthouse | 🌐", route="sentinel/mssp",
 crumb="Microsoft Sentinel › Configuration › <strong>MSSP & Lighthouse</strong>", h1="MSSP & Azure Lighthouse",
 actions="""<a class="btn btn-secondary" href="#/sentinel/workspace-manager">Workspace manager</a>""",
 body="""FIXTURE (global const, already exists): MSSP_TENANTS — 4 objects: id,
name, workspaces (array), delegatedRoles (array), status ('Active'|'Pending').

PAGE STRUCTURE (in order):
1. page-header block.
2. Table of all 4 customer tenants. Columns: Customer, Workspaces
   (join ', '), Delegated roles (join ', '), Status (tag green Active /
   tag orange Pending).
3. card card-body 'Cross-workspace query': one muted sentence that a single
   query can span delegated workspaces, then this literal example in a kv
   row (it is fictional KQL, keep it exactly):
   workspace('nw-ops-prod').SecurityAlert | union workspace('blueharbor-sec').SecurityAlert | summarize count() by TenantId
4. Closing card card-body (4 own-words sentences): Lighthouse delegates
   resource access so one analyst tenant manages many customer workspaces;
   roles are granted per delegation; B2B guest access is still needed for
   portal experiences that read the customer directory; content is
   distributed centrally via workspace manager.""")

B["v21"] = dict(
 title="Defender multi-tenant (MTO) view",
 nav="Portal | Multi-tenant view | 🏢", route="defender/mto",
 crumb="Microsoft Defender › <strong>Multi-tenant management</strong>", h1="Multi-tenant management",
 actions="""<a class="btn btn-secondary" href="#/defender/incidents">This tenant's incidents</a>""",
 body="""FIXTURE (global const, already exists): MTO_INCIDENTS — 8 objects: id,
tenant, title, severity ('High'|'Medium'|'Low'|'Informational'), status
('Active'|'In progress'|'Resolved'), assignedTo.

PAGE STRUCTURE (in order):
1. page-header block.
2. <div class="grid"> three kpis: total incidents (8), Active count,
   tenants = 4.
3. Table of all 8 incidents. Columns: Incident (title), Tenant
   (<span class="tag">), Severity (sev high High / sev medium Medium /
   sev low otherwise), Status (tag green Resolved / tag orange In progress /
   tag Active), Assigned to.
4. Closing card card-body (3 own-words sentences): the multi-tenant portal
   aggregates incidents and hunting across tenants for MSSPs and holdings;
   scoping follows each tenant's own RBAC; deep links open the incident in
   its home tenant.""")

B["v22"] = dict(
 title="Purview Audit (Premium) view",
 nav="Solutions | Audit (Premium) | 🕰", route="purview/audit-premium",
 crumb="Microsoft Purview › <strong>Audit (Premium)</strong>", h1="Audit (Premium)",
 actions="""<a class="btn btn-secondary" href="#/purview/audit">Audit search</a>
      <button class="btn btn-primary" onclick="toast('Export prepared — fictional download.')">Export results</button>""",
 body="""FIXTURES (global consts, already exist):
- AUDIT_RETENTION_POLICIES — 5 objects: id, name, users, recordTypes
  (array), duration, priority (int).
- AUDIT_COPILOT_EVENTS — 10 objects: time (ISO), user, operation,
  workload, detail.

PAGE STRUCTURE (in order):
1. page-header block.
2. card card-body 'Standard vs Premium' with three kv rows IN OWN WORDS:
   retention (Standard 180 days vs Premium up to 10 years by policy),
   intelligent insights (Premium adds high-value events like mail-items
   accessed), bandwidth (Premium gets higher API export throughput).
3. <div class="alert-section-title">Audit retention policies</div> + table
   of all 5. Columns: Policy, Users, Record types (join ', '), Duration
   (<span class="tag">), Priority.
4. <div class="alert-section-title">Copilot interaction events</div> +
   table of all 10. Columns: Time (fmtTime), User, Operation (tag),
   Workload, Detail.
5. Closing card card-body (3 own-words sentences): retention policies
   pin high-value audit data for long investigations; priority resolves
   overlaps; Copilot interactions are auditable like any workload activity.""")

HEAD = """# {tid} - {title}

You are writing ONE page view for a local SC-200 training lab portal.
Everything you need is in this file. Do not explore the repository.

"""

def main():
    for tid, s in B.items():
        contract = CONTRACT.format(draft=f"{tid}-{s['route'].replace('/', '-')}",
                                   nav=s["nav"], route=s["route"], crumb=s["crumb"],
                                   h1=s["h1"], actions=s["actions"])
        md = HEAD.format(tid=tid.upper(), title=s["title"]) + contract + "\n" + s["body"] + "\n\nWrite the file now, then STOP.\n"
        (LT / "tasks" / f"{tid.upper()}.md").write_text(md)
        print(f"wrote tasks/{tid.upper()}.md -> out/views/{tid}-{s['route'].replace('/', '-')}.js")

main()
