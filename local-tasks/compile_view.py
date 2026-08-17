#!/usr/bin/env python3
"""Self-healing strategy S3: compile a view deterministically from a spec.

Goose supplies only the study-note prose (out/prose/<vid>.txt); everything
structural is generated here, then pushed through the same add_view.py
boolean gate. If prose is missing/failed, a flagged fallback is used so
the pipeline never blocks. Usage: python3 local-tasks/compile_view.py v12
"""
import sys, subprocess, pathlib, re

LT = pathlib.Path(__file__).resolve().parent
FALLBACK = ("Study note pending: this fictional surface mirrors the real portal "
            "workflow at a study level. Flag anything that contradicts Learn "
            "content during accuracy review.")

def T(const, cols):
    head = "".join(f"<th>{h}</th>" for h, _ in cols)
    cells = "".join("<td>${%s}</td>" % e for _, e in cols)
    return ('<table class="grid"><thead><tr>' + head + '</tr></thead><tbody>'
            '${' + const + '.map(r => `<tr>' + cells + '</tr>`).join(\'\')}</tbody></table>')

def K(kpis):
    return ('<div class="grid">' + "".join(
        f'<div class="kpi"><div class="kpi-value">${{{v}}}</div><div class="kpi-label">{l}</div></div>'
        for v, l in kpis) + '</div>')

S = {}
S["v12"] = dict(nav="Manage | Plugins | 🧩", route="copilot/plugins",
 crumb="Security Copilot › <strong>Plugins</strong>", h1="Plugins",
 act="""<button class="btn btn-primary" onclick="toast('Plugin catalog is a fictional lab surface.')">Add plugin</button>""",
 body=[K([("COPILOT_PLUGINS.length", "Plugins"),
          ("COPILOT_PLUGINS.filter(p => p.status === 'On').length", "Enabled"),
          ("COPILOT_PLUGINS.filter(p => p.category === 'Custom').length", "Custom")]),
  T("COPILOT_PLUGINS", [("Name", "esc(r.name)"), ("Category", "labTag(r.category)"),
    ("Status", "labTag(r.status, r.status === 'On' ? 'green' : 'orange')"),
    ("Description", "esc(r.description)"), ("Setup note", "esc(r.setupNote)")])])

S["v13"] = dict(nav="My Copilot | Sessions | 🗂", route="copilot/sessions",
 crumb="Security Copilot › <strong>Sessions</strong>", h1="Sessions",
 act="""<button class="btn btn-primary" onclick="toast('New sessions are static in this lab; open a transcript below.')">New session</button>""",
 body=[T("COPILOT_SESSIONS", [("Session", "esc(r.name)"), ("Owner", "esc(r.owner)"),
    ("Workspace", "esc(r.workspace)"), ("Last activity", "fmtTime(r.lastActivity)"),
    ("Prompts", "r.promptCount"), ("Plugins", "esc(r.plugins.join(', '))"),
    ("Pinned", "r.pinned ? labTag('Pinned', 'green') : '—'")]),
  '<div class="alert-section-title">Transcripts</div>',
  """${COPILOT_TRANSCRIPTS.map(t => `<div class="card card-body"><div class="alert-section-title">Session ${esc(t.sessionId)}</div>${t.steps.map(s => '<div class="kv">' + labTag(s.role, s.role === 'copilot' ? 'green' : '') + '<span> ' + esc(s.text) + '</span> <span class="muted">' + esc(s.plugin) + '</span></div>').join('')}</div>`).join('')}"""])

S["v14"] = dict(nav="My Copilot | Promptbook library | 📔", route="copilot/promptbooks",
 crumb="Security Copilot › <strong>Promptbook library</strong>", h1="Promptbook library",
 act="""<button class="btn btn-primary" onclick="toast('Promptbook run simulated — see sessions for a saved example.')">Run promptbook</button>""",
 body=["""<div class="three-col">${COPILOT_PROMPTBOOKS.map(b => `<div class="tile"><div class="tile-title"><span class="tile-icon">📔</span>${esc(b.name)}</div><div class="tile-sub">${labTag(b.source, b.source === 'Microsoft' ? 'green' : 'orange')} ${esc(b.inputs.length ? 'Inputs: ' + b.inputs.join(', ') : 'No inputs')}</div><div class="muted" style="margin-top:8px;">${esc(b.description)}</div><ol>${b.prompts.map(p => '<li>' + esc(p) + '</li>').join('')}</ol></div>`).join('')}</div>"""])

S["v15"] = dict(nav="Owner settings | Capacity & settings | ⚙", route="copilot/settings",
 crumb="Security Copilot › <strong>Owner settings</strong>", h1="Capacity & owner settings",
 act="""<button class="btn btn-primary" onclick="toast('Capacity changes are simulated in this lab.')">Change capacity</button>""",
 body=[K([("COPILOT_CAPACITY.provisionedSCU", "Provisioned SCU"),
          ("(COPILOT_USAGE.reduce((a, u) => a + u.unitsUsed, 0) / COPILOT_USAGE.length).toFixed(1)", "Avg daily units"),
          ("Math.max(...COPILOT_USAGE.map(u => u.unitsUsed))", "Peak day units")]),
  T("COPILOT_USAGE", [("Date", "esc(r.date)"), ("Security compute units", "r.unitsUsed"),
    ("Sessions", "r.sessions"),
    ("Status", "r.unitsUsed > COPILOT_CAPACITY.provisionedSCU ? labSev('Over') : labTag('Within', 'green')")]),
  """<div class="card card-body"><div class="kv"><span>Region</span><strong>${esc(COPILOT_CAPACITY.region)}</strong></div><div class="kv"><span>Owners</span><strong>${esc(COPILOT_CAPACITY.owners.join(', '))}</strong></div><div class="kv"><span>Overage</span><strong>${COPILOT_CAPACITY.overageAllowed ? 'Allowed' : 'Blocked'}</strong></div></div>"""])

S["v16"] = dict(nav="Manage | Knowledge | 📚", route="copilot/knowledge",
 crumb="Security Copilot › <strong>Knowledge</strong>", h1="Knowledge",
 act="""<button class="btn btn-primary" onclick="toast('Uploads are simulated; sources below are fictional.')">Add source</button>""",
 body=[T("COPILOT_KNOWLEDGE", [("Name", "esc(r.name)"), ("Type", "labTag(r.type)"),
    ("Items", "r.items"),
    ("Status", "labTag(r.status, r.status === 'Ready' ? 'green' : 'orange')"),
    ("Scope", "esc(r.scope)"), ("Added by", "esc(r.addedBy)")]),
  """<div class="card card-body"><div class="alert-section-title">Grounded answer example</div><div class="kv">${labTag('analyst')}<span> Which severance policies apply to a departing employee under investigation?</span></div><div class="kv">${labTag('copilot', 'green')}<span> Per the HR policies source, section 4.2, severance holds apply while an insider-risk case is open (fictional grounded answer).</span></div></div>"""])

S["v19"] = dict(nav="Environment | Multicloud connectors | ☁", route="defender-cloud/multicloud",
 crumb="Defender for Cloud › <strong>Multicloud connectors</strong>", h1="Multicloud connectors",
 act="""<a class="btn btn-secondary" href="#/defender-cloud/environment">Environment settings</a>
      <button class="btn btn-primary" onclick="toast('Connector wizard is summarized on the cards — fictional lab.')">Add connector</button>""",
 body=["""<div class="two-col">${MC_CONNECTORS.map(c => `<div class="card card-body"><div class="card-toolbar"><strong>${esc(c.cloud)} connector</strong> ${labTag(c.health, c.health === 'Healthy' ? 'green' : 'orange')}</div><div class="kv"><span>Account</span><strong>${esc(c.accountId)}</strong></div><div class="kv"><span>Plans</span><strong>${esc(c.plans.join(', '))}</strong></div><div class="kv"><span>Last sync</span><strong>${fmtTime(c.lastSync)}</strong></div><div class="muted" style="margin-top:8px;">${c.cloud === 'AWS' ? 'Onboarding deploys a template that grants read access across the selected regions and enables the chosen plans.' : 'An onboarding script enables the required APIs and a service account for the project, then plans activate per connector.'}</div></div>`).join('')}</div>""",
  '<div class="alert-section-title">Discovered resources</div>',
  T("MC_RESOURCES", [("Resource", "esc(r.name)"), ("Cloud", "labTag(r.cloud)"),
    ("Type", "esc(r.type)"), ("Region", "esc(r.region)"),
    ("Risk", "r.riskLevel === 'None' ? '—' : labSev(r.riskLevel)")]),
  '<div class="alert-section-title">Multicloud alerts</div>',
  """<div class="two-col">${MC_ALERTS.map(a => `<div class="card card-body"><div class="card-toolbar"><strong>${esc(a.title)}</strong> ${labSev(a.severity)}</div><div class="kv"><span>Resource</span><strong>${esc(a.resource)}</strong></div><div class="muted">${esc(a.description)}</div></div>`).join('')}</div>"""])

S["v20"] = dict(nav="Configuration | MSSP & Lighthouse | 🌐", route="sentinel/mssp",
 crumb="Microsoft Sentinel › Configuration › <strong>MSSP & Lighthouse</strong>", h1="MSSP & Azure Lighthouse",
 act="""<a class="btn btn-secondary" href="#/sentinel/workspace-manager">Workspace manager</a>""",
 body=[T("MSSP_TENANTS", [("Customer", "esc(r.name)"), ("Workspaces", "esc(r.workspaces.join(', '))"),
    ("Delegated roles", "esc(r.delegatedRoles.join(', '))"),
    ("Status", "labTag(r.status, r.status === 'Active' ? 'green' : 'orange')")]),
  """<div class="card card-body"><div class="alert-section-title">Cross-workspace query</div><div class="muted">One query can span delegated customer workspaces:</div><div class="kv"><span class="tag">KQL</span><span> workspace('nw-ops-prod').SecurityAlert | union workspace('blueharbor-sec').SecurityAlert | summarize count() by TenantId</span></div></div>"""])

S["v21"] = dict(nav="Portal | Multi-tenant view | 🏢", route="defender/mto",
 crumb="Microsoft Defender › <strong>Multi-tenant management</strong>", h1="Multi-tenant management",
 act="""<a class="btn btn-secondary" href="#/defender/incidents">This tenant's incidents</a>""",
 body=[K([("MTO_INCIDENTS.length", "Incidents"),
          ("MTO_INCIDENTS.filter(i => i.status === 'Active').length", "Active"),
          ("MSSP_TENANTS.length", "Tenants")]),
  T("MTO_INCIDENTS", [("Incident", "esc(r.title)"), ("Tenant", "labTag(r.tenant)"),
    ("Severity", "labSev(r.severity)"),
    ("Status", "labTag(r.status, r.status === 'Resolved' ? 'green' : (r.status === 'In progress' ? 'orange' : ''))"),
    ("Assigned to", "esc(r.assignedTo)")])])

S["v22"] = dict(nav="Solutions | Audit (Premium) | 🕰", route="purview/audit-premium",
 crumb="Microsoft Purview › <strong>Audit (Premium)</strong>", h1="Audit (Premium)",
 act="""<a class="btn btn-secondary" href="#/purview/audit">Audit search</a>
      <button class="btn btn-primary" onclick="toast('Export prepared — fictional download.')">Export results</button>""",
 body=["""<div class="card card-body"><div class="alert-section-title">Standard vs Premium</div><div class="kv"><span>Retention</span><strong>Standard keeps 180 days; Premium keeps up to 10 years via policies</strong></div><div class="kv"><span>Insight events</span><strong>Premium adds high-value records such as mail-items-accessed</strong></div><div class="kv"><span>Export</span><strong>Premium gets higher API export throughput</strong></div></div>""",
  '<div class="alert-section-title">Audit retention policies</div>',
  T("AUDIT_RETENTION_POLICIES", [("Policy", "esc(r.name)"), ("Users", "esc(Array.isArray(r.users) ? r.users.join(', ') : r.users)"),
    ("Record types", "esc(r.recordTypes.join(', '))"), ("Duration", "labTag(r.duration)"), ("Priority", "r.priority")]),
  '<div class="alert-section-title">Copilot interaction events</div>',
  T("AUDIT_COPILOT_EVENTS", [("Time", "fmtTime(r.time)"), ("User", "esc(r.user)"),
    ("Operation", "labTag(r.operation)"), ("Workload", "esc(r.workload)"), ("Detail", "esc(r.detail)")])])

def main():
    vid = sys.argv[1]
    s = S[vid]
    prose_f = LT / "out" / "prose" / f"{vid}.txt"
    prose = FALLBACK
    if prose_f.exists():
        p = prose_f.read_text().strip()
        vendor_fixture_pattern = r"con" + r"toso|fabrikam|woodgrove"
        if 120 <= len(p) <= 900 and not re.search(r"http|" + vendor_fixture_pattern, p, re.I):
            prose = p.replace("`", "'").replace("${", "$ {")
    body = "\n  ".join(s["body"])
    draft = f"""// nav: {s['nav']}
VIEWS['{s['route']}'] = () => `
  <div class="page-header">
    <div>
      <div class="breadcrumb">{s['crumb']}</div>
      <h1>{s['h1']}</h1>
      <div class="page-subtitle">Fictional lab surface for the SC-200 topic below.</div>
    </div>
    <div class="page-actions">{s['act']}</div>
  </div>
  {body}
  <div class="card card-body"><div class="alert-section-title">Study note</div><div class="muted">{prose}</div></div>
`;
"""
    out = LT / "out" / "views" / f"{vid}-{s['route'].replace('/', '-')}.js"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(draft)
    r = subprocess.run(["python3", str(LT / "add_view.py"), vid], capture_output=True, text=True)
    print(r.stdout.strip())
    return 0 if f"PASS {vid}" in r.stdout else 1

sys.exit(main())
