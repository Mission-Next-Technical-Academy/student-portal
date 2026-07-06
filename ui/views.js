// SC-200_lab view rendering. Each VIEWS[route] is a function returning an HTML string.
// View functions may also return { html, onMount } if they need post-render wiring.

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function fmtTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false });
}
function fieldLabel(k) { return (FIELDS.find(f => f.key === k) || { label:k }).label; }
function copyToClipboard(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const text = el.value || el.textContent || '';
  if (!navigator.clipboard?.writeText) {
    toast('Clipboard API is not available in this browser session.');
    return;
  }
  navigator.clipboard.writeText(text)
    .then(() => toast('Copied to clipboard.'))
    .catch(() => toast('Clipboard permission was not granted.'));
}

const VIEWS = {};

// ====================================================================
// DEFENDER XDR
// ====================================================================
VIEWS['defender/home'] = () => {
  const incHigh = INCIDENTS.filter(i => i.severity === 'high').length;
  const incMed  = INCIDENTS.filter(i => i.severity === 'medium').length;
  const incOpen = INCIDENTS.filter(i => i.status !== 'Resolved').length;
  const newAlerts = alerts.filter(a => a.status === 'New' && !matchedRule(a)).length;
  const recentAlerts = alerts.slice(0, 4);

  return `
    <div class="page-header">
      <div>
        <div class="breadcrumb">Microsoft Defender</div>
        <h1>Home</h1>
        <div class="page-subtitle">Welcome back, Alex. Here's what's happening across your environment.</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary">↻ Refresh</button>
        <button class="btn btn-primary" onclick="openCopilot()">✨ Ask Security Copilot</button>
      </div>
    </div>

    <div class="kpi-strip">
      <div class="kpi">
        <span class="kpi-label">Active incidents</span>
        <span class="kpi-value">${incOpen}</span>
        <span class="kpi-delta bad">▲ 2 vs. yesterday</span>
      </div>
      <div class="kpi">
        <span class="kpi-label">New alerts (24h)</span>
        <span class="kpi-value">${newAlerts}</span>
        <span class="kpi-delta">▼ 4 vs. yesterday</span>
      </div>
      <div class="kpi">
        <span class="kpi-label">Secure score</span>
        <span class="kpi-value">65%</span>
        <span class="kpi-delta">▲ 1.2 pts this week</span>
      </div>
      <div class="kpi">
        <span class="kpi-label">Devices at risk</span>
        <span class="kpi-value">3</span>
        <span class="kpi-delta bad">▲ 1 new</span>
      </div>
    </div>

    <div class="card guided-scenario-card">
      <div class="card-toolbar">
        <strong>Guided scenarios</strong>
        <span class="muted">Coach marks over the existing lab views</span>
      </div>
      <div class="scenario-picker">
        ${GUIDED_SCENARIOS.map(s => `
          <button class="scenario-option" onclick="startGuidedScenario('${s.id}')">
            <span class="scenario-name">${esc(s.name)}</span>
            <span class="scenario-archetype">${esc(s.archetype)}</span>
            <span class="scenario-summary">${esc(s.summary)}</span>
          </button>
        `).join('')}
      </div>
    </div>

    <div class="two-col">
      <div class="card">
        <div class="card-toolbar">
          <strong>Active incidents</strong>
          <a class="chip-link" href="#/defender/incidents">View all →</a>
        </div>
        <table class="grid">
          <thead><tr><th>Severity</th><th>Title</th><th>Alerts</th><th>Status</th></tr></thead>
          <tbody>
            ${INCIDENTS.slice(0,4).map(i => `
              <tr onclick="openIncident('${i.id}')">
                <td><span class="sev ${i.severity}">${cap(i.severity)}</span></td>
                <td><strong>${esc(i.title)}</strong><br><span class="muted">${esc(i.tactics.join(' · '))}</span></td>
                <td>${i.alertCount}</td>
                <td>${esc(i.status)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="card">
        <div class="card-toolbar">
          <strong>Latest alerts</strong>
          <a class="chip-link" href="#/defender/alerts">View all →</a>
        </div>
        <table class="grid">
          <thead><tr><th>Severity</th><th>Title</th><th>Asset</th></tr></thead>
          <tbody>
            ${recentAlerts.map(a => `
              <tr onclick="openAlert('${a.id}')">
                <td><span class="sev ${a.severity}">${cap(a.severity)}</span></td>
                <td><strong>${esc(a.title)}</strong><br><span class="muted">${fmtTime(a.firstActivity)}</span></td>
                <td>${esc(a.asset)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="three-col" style="margin-top:16px;">
      <div class="card card-body">
        <div class="alert-section-title">Secure score</div>
        <div class="donut" style="--pct:65"><div class="donut-inner"><b>65%</b><span>247 / 380 pts</span></div></div>
        <div class="muted">3 high-impact actions available.</div>
        <a class="chip-link" href="#/defender/secure-score">Improve score →</a>
      </div>
      <div class="card card-body">
        <div class="alert-section-title">Active threat campaigns</div>
        ${THREAT_REPORTS.filter(t => t.status === 'Active campaign').slice(0,3).map(t => `
          <div style="margin-bottom:10px;">
            <div><span class="sev ${t.severity}">${cap(t.severity)}</span> <strong>${esc(t.name)}</strong></div>
            <div class="muted" style="font-size:12px;">${esc(t.type)} · ${t.impactedAssets} impacted asset(s)</div>
          </div>
        `).join('')}
        <a class="chip-link" href="#/defender/threat-analytics">All threat analytics →</a>
      </div>
      <div class="card card-body">
        <div class="alert-section-title">Suggested next steps</div>
        <ul style="margin:0; padding-left:18px; font-size:13px; line-height:1.7;">
          <li><a href="#/defender/incidents">Triage 5 active incidents</a></li>
          <li><a href="#/defender/hunting">Hunt for staging in C:\\Users\\Public</a></li>
          <li><a href="#/defender/suppression">Review noisy detections</a></li>
          <li><a href="#/sentinel/analytics">Tune Sentinel analytics rules</a></li>
        </ul>
      </div>
    </div>
  `;
};

VIEWS['defender/incidents'] = () => `
  <div class="page-header">
    <div><div class="breadcrumb">Investigation & response › Incidents &amp; alerts › <strong>Incidents</strong></div><h1>Incidents</h1></div>
  </div>
  <div class="filterbar">
    <span class="chip">Severity: <strong>Any</strong> ▾</span>
    <span class="chip">Status: <strong>New, In progress</strong> ▾</span>
    <span class="chip">Tags: <strong>Any</strong> ▾</span>
    <span class="chip">Time: <strong>Last 24 hours</strong> ▾</span>
  </div>
  <div class="card">
    <div class="card-toolbar"><strong>${INCIDENTS.length}</strong> incidents</div>
    <table class="grid">
      <thead><tr>
        <th>Severity</th><th>Incident name</th><th>Alerts</th><th>Tactics</th>
        <th>Status</th><th>Assigned to</th><th>Created</th><th>Action</th>
      </tr></thead>
      <tbody>
        ${INCIDENTS.map(i => `
          <tr onclick="openIncident('${i.id}')">
            <td><span class="sev ${i.severity}">${cap(i.severity)}</span></td>
            <td>
              <button class="link-button strong" onclick="event.stopPropagation(); openIncidentPage('${esc(i.id)}')">${esc(i.title)}</button>
              <br><span class="muted">${esc(i.id)} · click row for preview</span>
            </td>
            <td>${i.alertCount}</td>
            <td>${i.tactics.map(t => `<span class="mitre">${esc(t)}</span>`).join('')}</td>
            <td>${esc(i.status)}</td>
            <td>${esc(i.assignedTo)}</td>
            <td>${fmtTime(i.createdAt)}</td>
            <td><button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); openIncidentPage('${esc(i.id)}')">Open incident page</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
`;

const INCIDENT_PAGE_TABS = [
  { key:'attack-story',  label:'Attack story' },
  { key:'alerts',        label:'Alerts' },
  { key:'assets',        label:'Assets' },
  { key:'evidence',      label:'Evidence and Response' },
  { key:'summary',       label:'Summary' },
  { key:'activities',    label:'Activities' },
  { key:'similar',       label:'Similar incidents' },
];

// Group all entities of an incident by type, then pair each entity with the
// alerts that reference it. Used by the Assets tab.
function renderIncidentAssets(inc, incAlerts) {
  const groups = {};
  inc.entities.forEach(e => {
    (groups[e.type] = groups[e.type] || []).push(e.name);
  });
  // Also fold in alert assets that might not be in the formal entity list.
  incAlerts.forEach(a => {
    if (!a.asset) return;
    const type = entityTypeForName(inc, a.asset) || 'Asset';
    if (!(groups[type] || []).includes(a.asset)) {
      (groups[type] = groups[type] || []).push(a.asset);
    }
  });
  return Object.entries(groups).map(([type, names]) => `
    <div class="card card-body" style="margin-bottom:14px;">
      <div class="alert-section-title">${esc(type)}${names.length>1?'s':''} (${names.length})</div>
      <table class="grid">
        <thead><tr><th>Entity</th><th>Alerts referencing</th><th>Open</th></tr></thead>
        <tbody>
          ${names.map(n => {
            const related = incAlerts.filter(a => a.asset === n);
            const opens = (type === 'Device' || type === 'Host')
              ? `<button class="btn btn-ghost btn-sm" onclick="openDevice('${esc(n)}')">Open device</button>`
              : (type === 'User' || type === 'Account' || type === 'Identity')
                ? `<button class="btn btn-ghost btn-sm" onclick="openIdentity('${esc(n)}')">Open identity</button>`
                : `<button class="btn btn-ghost btn-sm" onclick="navigate('#/defender/hunting')">Hunt</button>`;
            return `
              <tr>
                <td>${clickableEntity(type, n)}</td>
                <td>${related.length}</td>
                <td>${opens}</td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `).join('') || '<div class="muted">No entities recorded on this incident.</div>';
}

VIEWS['defender/incident'] = () => {
  const selectedId = sessionStorage.getItem('defender-lab.incident.id') || INCIDENTS[0].id;
  const inc = INCIDENTS.find(i => i.id === selectedId) || INCIDENTS[0];
  const incAlerts = alerts.filter(a => inc.alertIds.includes(a.id));
  const tab = sessionStorage.getItem('defender-lab.incident.tab') || 'attack-story';

  const tabBtn = t => `
    <button class="tab ${tab===t.key?'active':''}" onclick="setIncidentTab('${t.key}')">${esc(t.label)}</button>`;

  let body;
  switch (tab) {
    case 'attack-story':
      body = `
        ${renderAttackStory(inc, incAlerts)}
        ${(inc.disruptionActions || []).length ? `
          <div class="card card-body disruption-card">
            <div class="alert-section-title">Automatic attack disruption</div>
            <div class="response-flow">
              ${inc.disruptionActions.map(a => `
                <div><strong>${esc(a.action)}</strong><span>${fmtTime(a.time)} · ${esc(a.target)} · ${esc(a.result)}</span></div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        <div class="callout info" style="margin-top:18px;">
          The attack story stitches alerts into a chronological narrative across the kill chain.
          Use the <strong>Alerts</strong> tab for the raw row-by-row view, <strong>Assets</strong> for affected
          devices/identities/files, and <strong>Evidence and Response</strong> for entity verdicts.
        </div>`;
      break;
    case 'alerts':
      body = `
        <div class="alert-section-title">Alerts in this incident (${incAlerts.length})</div>
        <table class="grid">
          <thead><tr><th>Sev</th><th>Title</th><th>Status</th><th>Category</th><th>Source</th><th>Asset</th><th>First activity</th></tr></thead>
          <tbody>
            ${incAlerts.map(a => `
              <tr onclick="openAlert('${esc(a.id)}')">
                <td><span class="sev ${a.severity}">${cap(a.severity)}</span></td>
                <td>${esc(a.title)}</td>
                <td>${esc(a.status)}</td>
                <td>${esc(a.category)}</td>
                <td>${esc(a.detectionSource)}</td>
                <td>${clickableEntity(entityTypeForName(inc, a.asset), a.asset)}</td>
                <td>${fmtTime(a.firstActivity)}</td>
              </tr>`).join('')}
          </tbody>
        </table>`;
      break;
    case 'assets':
      body = renderIncidentAssets(inc, incAlerts);
      break;
    case 'evidence':
      body = `
        <p class="muted" style="margin-bottom:12px;">Defender XDR auto-analyzes events and entities and assigns each one a verdict (Malicious, Suspicious, Clean) plus a remediation status. Pending actions can be approved or rejected per row.</p>
        ${renderIncidentEvidence(inc)}`;
      break;
    case 'summary':
      body = renderIncidentSummary(inc, incAlerts);
      break;
    case 'activities':
      body = `
        <p class="muted" style="margin-bottom:12px;">Unified timeline of analyst actions, automated playbook runs, comments, severity updates, merges, and policy changes.</p>
        ${renderIncidentActivities(inc)}`;
      break;
    case 'similar':
      body = `
        <p class="muted" style="margin-bottom:12px;">Incidents that share entities, tactics, or alert titles with this one in the last 30 days.</p>
        ${renderSimilarIncidents(inc)}`;
      break;
  }

  return `
    <div class="page-header incident-page-header">
      <div>
        <div class="breadcrumb">
          <a href="#/defender/incidents">Investigation &amp; response</a> ›
          <a href="#/defender/incidents">Incidents &amp; alerts</a> ›
          <a href="#/defender/incidents">Incidents</a> ›
          <strong>${esc(inc.id)}</strong>
        </div>
        <h1>${esc(inc.title)}</h1>
        <div class="page-subtitle">${esc(inc.summary)}</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="openIncident('${esc(inc.id)}')">Open preview pane</button>
        <button class="btn btn-primary" onclick="toast('Incident assigned to you (lab stub).')">Assign to me</button>
      </div>
    </div>

    <div class="incident-command-bar">
      <button class="btn btn-secondary btn-sm" onclick="toast('Incident classified (lab stub).')">Classify</button>
      <button class="btn btn-secondary btn-sm" onclick="toast('Comment added (lab stub).')">Add comment</button>
      <button class="btn btn-secondary btn-sm" onclick="toast('Tags opened (lab stub).')">Manage tags</button>
      <button class="btn btn-secondary btn-sm" onclick="navigate('#/defender/hunting')">Go hunt</button>
    </div>

    <div class="incident-page-tabs tabs">
      ${INCIDENT_PAGE_TABS.map(tabBtn).join('')}
    </div>

    <div class="incident-page-grid">
      <section class="incident-page-main">${body}</section>

      <aside class="incident-page-side">
        <div class="card card-body">
          <div class="alert-section-title">Incident details</div>
          <dl class="summary-info">
            <dt>Incident ID</dt><dd>${esc(inc.id)}</dd>
            <dt>Severity</dt><dd><span class="sev ${inc.severity}">${cap(inc.severity)}</span></dd>
            <dt>Status</dt><dd>${esc(inc.status)}</dd>
            ${inc.responseTag ? `<dt>Response tag</dt><dd><span class="tag orange">${esc(inc.responseTag)}</span></dd>` : ''}
            <dt>Assigned</dt><dd>${esc(inc.assignedTo)}</dd>
            <dt>Created</dt><dd>${fmtTime(inc.createdAt)}</dd>
          </dl>
        </div>
        <div class="card card-body">
          <div class="alert-section-title">Entities</div>
          <div class="entity-chip-list">${inc.entities.map(e => clickableEntity(e.type, e.name)).join('')}</div>
        </div>
        <div class="card card-body">
          <div class="alert-section-title">Blast radius</div>
          ${renderBlastRadius(inc)}
        </div>
      </aside>
    </div>
  `;
};

VIEWS['defender/alerts'] = () => {
  let suppressed = 0;
  const rows = alerts.map(a => {
    const rule = matchedRule(a);
    if (rule) suppressed++;
    return `
      <tr class="${rule ? 'suppressed' : ''}" onclick="openAlert('${a.id}')">
        <td><input type="checkbox" onclick="event.stopPropagation()"></td>
        <td><span class="sev ${a.severity}">${cap(a.severity)}</span></td>
        <td><strong>${esc(a.title)}</strong></td>
        <td><span class="status-dot ${rule ? 'resolved' : ''}"></span>${rule ? 'Suppressed' : esc(a.status)}</td>
        <td>${esc(a.category)}</td>
        <td>${esc(a.detectionSource)}</td>
        <td>${esc(a.asset)}</td>
        <td>${fmtTime(a.firstActivity)}</td>
        <td>${rule ? `<span class="tag green">${esc(rule.name)}</span>` : '<span class="muted">—</span>'}</td>
      </tr>`;
  }).join('');
  return `
    <div class="page-header">
      <div><div class="breadcrumb">Investigation & response › <strong>Alerts</strong></div><h1>Alerts</h1></div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="replayScenario()">↻ Replay scenario events</button>
        <button class="btn btn-primary" onclick="openRulePanel()">+ Create suppression rule</button>
      </div>
    </div>
    <div class="filterbar">
      <span class="chip">Severity: <strong>Any</strong> ▾</span>
      <span class="chip">Status: <strong>New, In progress</strong> ▾</span>
      <span class="chip">Detection source: <strong>Any</strong> ▾</span>
      <span class="chip">Time: <strong>Last 24 hours</strong> ▾</span>
    </div>
    <div class="card">
      <div class="card-toolbar">
        <span><strong>${alerts.length - suppressed}</strong> active · <strong>${suppressed}</strong> suppressed of ${alerts.length}</span>
      </div>
      <table class="grid">
        <thead><tr>
          <th style="width:36px"><input type="checkbox"></th>
          <th>Severity</th><th>Alert title</th><th>Status</th>
          <th>Category</th><th>Detection source</th><th>Asset</th>
          <th>First activity</th><th>Suppressed by</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
};

VIEWS['defender/cases'] = () => `
  <div class="page-header">
    <div>
      <div class="breadcrumb">Investigation &amp; response › <strong>Cases</strong></div>
      <h1>Case management</h1>
      <div class="page-subtitle">Coordinate owners, tasks, linked incidents, and closure notes across Defender XDR and Sentinel investigations.</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="toast('Case export prepared in the lab.')">Export</button>
      <button class="btn btn-primary" onclick="toast('New case draft created in memory only.')">+ Create case</button>
    </div>
  </div>
  <div class="kpi-strip">
    <div class="kpi"><span class="kpi-label">Active cases</span><span class="kpi-value">${CASE_MANAGEMENT.filter(c=>c.status==='Active').length}</span></div>
    <div class="kpi"><span class="kpi-label">Draft cases</span><span class="kpi-value">${CASE_MANAGEMENT.filter(c=>c.status==='Draft').length}</span></div>
    <div class="kpi"><span class="kpi-label">Linked incidents</span><span class="kpi-value">${CASE_MANAGEMENT.reduce((n,c)=>n+c.linkedIncidents.length,0)}</span></div>
    <div class="kpi"><span class="kpi-label">Open tasks</span><span class="kpi-value">${CASE_MANAGEMENT.reduce((n,c)=>n+c.tasks.filter(t=>t.status!=='Done').length,0)}</span></div>
  </div>
  <div class="case-board">
    ${CASE_MANAGEMENT.map(c => `
      <section class="card case-card">
        <div class="card-toolbar">
          <strong>${esc(c.id)}</strong>
          <span class="tag ${c.status === 'Active' ? 'orange' : ''}">${esc(c.status)}</span>
        </div>
        <div class="case-title">${esc(c.title)}</div>
        <dl class="summary-info">
          <dt>Owner</dt><dd>${esc(c.owner)}</dd>
          <dt>Severity</dt><dd><span class="sev ${c.severity.toLowerCase()}">${esc(c.severity)}</span></dd>
          <dt>Due</dt><dd>${fmtTime(c.due)}</dd>
          <dt>Linked incidents</dt><dd>${c.linkedIncidents.map(id=>`<button class="link-button" onclick="openIncidentPage('${esc(id)}')">${esc(id)}</button>`).join(' ')}</dd>
        </dl>
        <div class="alert-section-title">Tasks</div>
        <div class="case-task-list">
          ${c.tasks.map(t => `
            <div class="case-task">
              <span class="status-dot ${t.status === 'Done' ? 'resolved' : t.status === 'In progress' ? 'warn' : ''}"></span>
              <span><strong>${esc(t.title)}</strong><small>${esc(t.assignee)} · ${esc(t.status)}</small></span>
            </div>
          `).join('')}
        </div>
        <div class="callout ${c.status === 'Active' ? 'warn' : 'info'}">${esc(c.closure)}</div>
      </section>
    `).join('')}
  </div>
`;

VIEWS['defender/hunting'] = () => {
  const prefilled = sessionStorage.getItem('defender-lab.hunting.prefill');
  const autorun = sessionStorage.getItem('defender-lab.hunting.autorun') === '1';
  sessionStorage.removeItem('defender-lab.hunting.prefill');
  sessionStorage.removeItem('defender-lab.hunting.autorun');
  const initialQuery = prefilled || SAVED_QUERIES[0].query;
  const initialTable = SAVED_QUERIES[0].table;
  const schemaGroups = HUNTING_SCHEMA_GROUPS;
  return {
    html: `
    <div class="page-header hunting-page-header">
      <div>
        <div class="breadcrumb">Microsoft Defender XDR › Hunting › <strong>Advanced hunting</strong></div>
        <h1>Advanced hunting</h1>
        <div class="page-subtitle">Query Defender XDR tables, inspect schema groups, and turn repeatable hunts into detections.</div>
      </div>
      <div class="page-actions">
        <a class="btn btn-secondary" href="#/defender/hunting-graph">Hunting graph</a>
        <a class="btn btn-primary" href="#/defender/custom-detections">Create custom detection</a>
      </div>
    </div>
    <div class="kpi-strip hunting-status-cards">
      <div class="kpi"><span class="kpi-label">Queryable raw data</span><span class="kpi-value">30d</span><span class="kpi-delta">Advanced hunting window</span></div>
      <div class="kpi"><span class="kpi-label">Event freshness</span><span class="kpi-value">Near live</span><span class="kpi-delta">After sensor processing</span></div>
      <div class="kpi"><span class="kpi-label">Entity refresh</span><span class="kpi-value">15m</span><span class="kpi-delta">Daily consolidation</span></div>
      <div class="kpi"><span class="kpi-label">Time zone</span><span class="kpi-value">UTC</span><span class="kpi-delta">All hunting timestamps</span></div>
    </div>
    <div class="hunting-workspace">
      <aside class="hunting-schema-sidebar" aria-label="Hunting schema">
        <div class="hunting-sidebar-header">
          <strong>Schema</strong>
          <span>${HUNTING_TABLES.length} tables</span>
        </div>
        <div class="hunting-schema-groups">
          ${schemaGroups.map((group, index) => `
            <section class="schema-group">
              <button class="schema-group-toggle" type="button" aria-expanded="${index < 4 ? 'true' : 'false'}">
                <span class="schema-caret">${index < 4 ? '▴' : '▾'}</span>
                <span>${esc(group.name)}</span>
                <span class="schema-count">${group.tables.length}</span>
              </button>
              <div class="schema-table-list${index < 4 ? '' : ' collapsed'}">
                ${group.tables.map(t => `
                  <button class="schema-table" type="button" data-table="${esc(t)}">
                    <span class="schema-table-icon">□</span>
                    <span>${esc(t)}</span>
                  </button>
                `).join('')}
              </div>
            </section>
          `).join('')}
        </div>
        <div class="hunting-saved-queries">
          <div class="alert-section-title">Saved queries</div>
          ${SAVED_QUERIES.map((q, i) => `
            <button class="saved-query-row" type="button" data-query-index="${i}">
              <span>${esc(q.name)}</span>
              <small>${esc(q.table)}</small>
            </button>
          `).join('')}
        </div>
      </aside>

      <section class="hunting-query-results" aria-label="Query and results">
        <div class="hunting-query-editor">
          <div class="hunting-section-toolbar">
            <strong>Query</strong>
            <span class="muted">Mock executor runs against bundled fixtures.</span>
          </div>
          <textarea id="kql" class="kql hunting-kql">${esc(initialQuery)}</textarea>
          <div class="kql-toolbar">
            <button class="btn btn-primary btn-sm" onclick="runKqlQuery()">Run query</button>
            <button class="btn btn-secondary btn-sm">Save</button>
            <button class="btn btn-ghost btn-sm">Save as analytics rule</button>
          </div>
        </div>
        <div class="hunting-results" id="kql-results">
          <div class="card-toolbar"><strong>Results</strong></div>
          <div class="card-body muted">Run a query to see results.</div>
        </div>
      </section>
    </div>
    <div class="tile-grid hunting-notes">
      ${HUNTING_SCHEMA_NOTES.map(n => `
        <div class="tile">
          <div class="tile-title">${esc(n.title)}</div>
          <div class="tile-sub">${esc(n.detail)}</div>
        </div>
      `).join('')}
    </div>
  `,
    onMount: () => {
      // Mock KQL executor. Supports a small subset:
      //   <TableName>                            — leading table line
      //   | where Field == "value"               — equality match
      //   | where Field == true/false            — boolean equality
      //   | where Field has "needle"             — substring match (e.g. AttackTechniques)
      //   | where Timestamp between (datetime(..)..datetime(..))   — time window
      //   | project / | sort / | top / | take    — display-only, ignored by executor
      function parseKqlSubset(query) {
        const stripped = query.replace(/^\s*\/\/.*$/gm, '');
        const lines = stripped.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const tableLine = lines.find(l => /^[A-Za-z][A-Za-z0-9_]*$/.test(l));
        const table = tableLine || HUNTING_TABLES.find(t => stripped.trimStart().startsWith(t)) || initialTable;
        const filters = [];
        let timeWindow = null;
        lines.forEach(l => {
          const eq  = l.match(/^\|\s*where\s+([A-Za-z_][A-Za-z0-9_]*)\s*==\s*"([^"]*)"$/i);
          const beq = l.match(/^\|\s*where\s+([A-Za-z_][A-Za-z0-9_]*)\s*==\s*(true|false)$/i);
          const has = l.match(/^\|\s*where\s+([A-Za-z_][A-Za-z0-9_]*)\s+has\s+"([^"]*)"$/i);
          const bw  = l.match(/^\|\s*where\s+Timestamp\s+between\s*\(\s*datetime\(([^)]+)\)\s*\.\.\s*datetime\(([^)]+)\)\s*\)$/i);
          if (eq)  filters.push({ kind:'eq',  field:eq[1],  value:eq[2] });
          if (beq) filters.push({ kind:'bool', field:beq[1], value:beq[2].toLowerCase() === 'true' });
          if (has) filters.push({ kind:'has', field:has[1], value:has[2] });
          if (bw)  timeWindow = { start:bw[1].trim(), end:bw[2].trim() };
        });
        return { table, filters, timeWindow };
      }
      function applyKqlFilters(rows, filters, timeWindow) {
        let out = rows;
        if (timeWindow) {
          const s = new Date(timeWindow.start).getTime();
          const e = new Date(timeWindow.end).getTime();
          out = out.filter(r => {
            const t = new Date(r.Timestamp || r.TimeGenerated || 0).getTime();
            return t >= s && t <= e;
          });
        }
        filters.forEach(f => {
          if (f.kind === 'eq') {
            out = out.filter(r => String(r[f.field] ?? '') === f.value);
          } else if (f.kind === 'bool') {
            out = out.filter(r => Boolean(r[f.field]) === f.value);
          } else if (f.kind === 'has') {
            out = out.filter(r => String(r[f.field] ?? '').includes(f.value));
          }
        });
        return out;
      }
      window.runKqlQuery = () => {
        const q = document.getElementById('kql').value;
        const parsed = parseKqlSubset(q);
        const table = parsed.table;
        const rows = applyKqlFilters(MOCK_QUERY_RESULTS[table] || [], parsed.filters, parsed.timeWindow);
        const cols = rows.length ? Object.keys(rows[0]) : ['(no rows)'];
        const filterSummary = [
          parsed.timeWindow ? `Timestamp ∈ [${parsed.timeWindow.start} .. ${parsed.timeWindow.end}]` : null,
          ...parsed.filters.map(f => `${f.field} ${f.kind==='has'?'has':'='} ${f.value}`)
        ].filter(Boolean).join(' · ');
        document.getElementById('kql-results').innerHTML = `
          <div class="card-toolbar"><strong>${rows.length} rows</strong>
            <span class="muted">Table: ${esc(table)}${filterSummary ? ' · '+esc(filterSummary) : ''}</span></div>
          <table class="grid">
            <thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>
            <tbody>${rows.map(r => `<tr>${cols.map(c => `<td class="kv">${esc(r[c] ?? '')}</td>`).join('')}</tr>`).join('') || `<tr><td>(no data)</td></tr>`}</tbody>
          </table>`;
      };
      window.loadSavedQuery = (i) => {
        document.getElementById('kql').value = SAVED_QUERIES[i].query;
      };
      document.querySelectorAll('.schema-group-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
          const list = btn.nextElementSibling;
          const collapsed = list.classList.toggle('collapsed');
          btn.setAttribute('aria-expanded', String(!collapsed));
          btn.querySelector('.schema-caret').textContent = collapsed ? '▾' : '▴';
        });
      });
      document.querySelectorAll('.schema-table').forEach(btn => {
        btn.addEventListener('click', () => {
          document.getElementById('kql').value = `${btn.dataset.table}\n| take 20`;
        });
      });
      document.querySelectorAll('.saved-query-row').forEach(btn => {
        btn.addEventListener('click', () => loadSavedQuery(Number(btn.dataset.queryIndex)));
      });
      if (autorun) {
        setTimeout(() => runKqlQuery(), 0);
      }
    }
  };
};

VIEWS['defender/custom-detections'] = () => `
  <div class="page-header">
    <div>
      <div class="breadcrumb">Hunting › <strong>Custom detections</strong></div>
      <h1>Custom detections</h1>
      <div class="page-subtitle">Turn repeatable advanced hunting queries into scheduled or near-real-time alerting and response actions.</div>
    </div>
    <div class="page-actions">
      <a class="btn btn-secondary" href="#/defender/hunting">Advanced hunting</a>
      <a class="btn btn-primary" href="#/defender/hunting">Run sample query</a>
    </div>
  </div>

  <div class="callout warn" style="margin-bottom:14px;">
    Each rule is limited to 100 alerts per run in this lab model. Tune noisy KQL before creating a detection.
  </div>

  <div class="two-col">
    <div class="card card-body">
      <div class="alert-section-title">Required query columns</div>
      <div class="connector-list">
        ${CUSTOM_DETECTION_SAMPLE.requiredColumns.map(c => `
          <div><strong>${esc(c)}</strong><span>Must be returned by the query for custom detection creation.</span></div>
        `).join('')}
      </div>
      <div class="alert-section-title">Sample KQL</div>
      <textarea class="kql" readonly>${esc(CUSTOM_DETECTION_SAMPLE.query)}</textarea>
    </div>
    <div class="card">
      <div class="card-toolbar"><strong>Rule frequency and lookback</strong></div>
      <table class="grid">
        <thead><tr><th>Frequency</th><th>Lookback</th><th>Use in this lab</th></tr></thead>
        <tbody>
          ${CUSTOM_DETECTION_FREQUENCIES.map(f => `
            <tr>
              <td><strong>${esc(f.frequency)}</strong></td>
              <td>${esc(f.lookback)}</td>
              <td>${esc(f.use)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <div class="two-col" style="margin-top:16px;">
    <div class="card">
      <div class="card-toolbar"><strong>Impacted entity mapping</strong></div>
      <table class="grid">
        <thead><tr><th>Returned column</th><th>Supported actions</th></tr></thead>
        <tbody>
          ${CUSTOM_DETECTION_RESPONSE_ACTIONS.map(r => `
            <tr>
              <td class="kv">${esc(r.entity)}</td>
              <td>${r.actions.map(a => `<span class="tag">${esc(a)}</span>`).join('')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div class="card card-body">
      <div class="alert-section-title">Build checklist</div>
      <ol style="margin:0; padding-left:20px; font-size:13px; line-height:1.8;">
        <li>Run the hunting query and remove normal daily activity.</li>
        <li>Return Timestamp, DeviceId, and ReportId.</li>
        <li>Pick severity, category, and MITRE technique mapping.</li>
        <li>Select one impacted entity column per entity type.</li>
        <li>Choose device or file actions only when the match is high confidence.</li>
        <li>Scope the rule to all devices or a specific device group.</li>
      </ol>
    </div>
  </div>
`;

VIEWS['defender/hunting-graph'] = () => `
  <div class="page-header">
    <div>
      <div class="breadcrumb">Hunting › <strong>Hunting graph preview</strong></div>
      <h1>Hunting graph</h1>
      <div class="page-subtitle">Preview-style graph reasoning for threat paths, exposure, and high-value relationships.</div>
    </div>
    <div class="page-actions">
      <a class="btn btn-secondary" href="#/defender/hunting">Advanced hunting</a>
      <a class="btn btn-primary" href="#/sentinel/mitre">MITRE coverage</a>
    </div>
  </div>

  <div class="callout info" style="margin-bottom:14px;">
    The graph complements KQL. Use it to scope likely paths, then pivot back to advanced hunting or custom detections for evidence and automation.
  </div>

  <div class="two-col" style="grid-template-columns: 1fr 280px;">
    <div class="card">
      <div class="card-toolbar"><strong>Predefined scenarios</strong><span class="muted">Select in the real portal, then supply required entities.</span></div>
      <table class="grid">
        <thead><tr><th>Scenario</th><th>What it answers</th><th>Input</th></tr></thead>
        <tbody>
          ${HUNTING_GRAPH_SCENARIOS.map(s => `
            <tr>
              <td><strong>${esc(s.name)}</strong></td>
              <td>${esc(s.question)}</td>
              <td>${esc(s.input)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div class="card card-body">
      <div class="alert-section-title">Useful filters</div>
      <div>
        ${HUNTING_GRAPH_FILTERS.map(f => `<span class="tag">${esc(f)}</span>`).join('')}
      </div>
      <div class="alert-section-title">Access assumptions</div>
      <div class="connector-list">
        <div><strong>Advanced hunting role</strong><span>Viewer can launch hunting from Defender.</span></div>
        <div><strong>Sentinel data lake</strong><span>Needed for cross-workspace graph relationships.</span></div>
        <div><strong>Exposure Management read</strong><span>Needed for enriched criticality and exposure context.</span></div>
      </div>
    </div>
  </div>

  <div class="card" style="margin-top:16px;">
    <div class="card-toolbar"><strong>Lab workflow</strong></div>
    <div class="flowline">
      <div class="flow-step"><strong>Scope</strong><span>Start with a scenario such as paths to Key Vault or sensitive storage.</span></div>
      <div class="flow-step"><strong>Constrain</strong><span>Apply shortest-path, critical-node, sensitive-data, or edge-type filters.</span></div>
      <div class="flow-step"><strong>Inspect</strong><span>Open repeated intermediate nodes to find choke points or over-permissioned identities.</span></div>
      <div class="flow-step"><strong>Validate</strong><span>Use KQL to prove event evidence before response or detection automation.</span></div>
    </div>
  </div>
`;

VIEWS['defender/threat-analytics'] = () => `
  <div class="page-header">
    <div>
      <div class="breadcrumb">Threat intelligence › <strong>Threat analytics</strong></div>
      <h1>Threat analytics</h1>
      <div class="page-subtitle">Interpret active reports by reading the overview, analyst guidance, related incidents, and tenant exposure before choosing response work.</div>
    </div>
  </div>
  <div class="kpi-strip">
    <div class="kpi"><span class="kpi-label">Active campaigns</span><span class="kpi-value">${THREAT_REPORTS.filter(t=>t.status==='Active campaign').length}</span></div>
    <div class="kpi"><span class="kpi-label">Reports impacting you</span><span class="kpi-value">${THREAT_REPORTS.filter(t=>t.impactedAssets>0).length}</span></div>
    <div class="kpi"><span class="kpi-label">High-severity reports</span><span class="kpi-value">${THREAT_REPORTS.filter(t=>t.severity==='high').length}</span></div>
    <div class="kpi"><span class="kpi-label">Total assets impacted</span><span class="kpi-value">${THREAT_REPORTS.reduce((s,t)=>s+t.impactedAssets,0)}</span></div>
  </div>
  <div class="card">
    <div class="card-toolbar"><strong>${THREAT_REPORTS.length}</strong> reports</div>
    <table class="grid">
      <thead><tr><th>Severity</th><th>Threat</th><th>Type</th><th>Status</th><th>Impacted assets</th><th>Related incidents</th></tr></thead>
      <tbody>
        ${THREAT_REPORTS.map(t => `
          <tr>
            <td><span class="sev ${t.severity}">${cap(t.severity)}</span></td>
            <td><strong>${esc(t.name)}</strong><br><span class="muted">${esc(t.summary)}</span></td>
            <td>${esc(t.type)}</td>
            <td>${esc(t.status)}</td>
            <td>${t.impactedAssets}</td>
            <td>${(t.relatedIncidents || []).map(id => `<a class="chip-link" href="#/defender/incidents" onclick="event.preventDefault(); openIncident('${esc(id)}')">${esc(id)}</a>`).join('') || '<span class="muted">None</span>'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  <div class="three-col" style="margin-top:16px;">
    ${THREAT_REPORTS.slice(0,3).map(t => `
      <div class="card card-body">
        <div class="card-toolbar" style="padding:0 0 8px; border-bottom:0;">
          <strong>${esc(t.id)} · ${esc(t.name)}</strong>
          <span class="sev ${t.severity}">${cap(t.severity)}</span>
        </div>
        <div class="alert-section-title">Overview</div>
        <ol class="mini-steps">${(t.overview || []).map(x => `<li>${esc(x)}</li>`).join('')}</ol>
        <div class="alert-section-title">Analyst report</div>
        <ol class="mini-steps">${(t.analystReport || []).map(x => `<li>${esc(x)}</li>`).join('')}</ol>
        <div class="alert-section-title">Exposure</div>
        <div class="callout ${t.impactedAssets ? 'warn' : 'info'}">${esc(t.exposure)}</div>
        <div class="alert-section-title">Interpretation guidance</div>
        <ol class="mini-steps">${(t.recommendations || []).map(x => `<li>${esc(x)}</li>`).join('')}</ol>
      </div>
    `).join('')}
  </div>
  <div class="card card-body" style="margin-top:16px;">
    <div class="alert-section-title">How to use this on the exam</div>
    <div class="flowline">
      <div class="flow-step"><strong>Read report scope</strong><span>Identify whether the report is a campaign, malware family, tool, or activity group.</span></div>
      <div class="flow-step"><strong>Check exposure</strong><span>Prioritize reports with impacted users, devices, apps, or vulnerabilities in your tenant.</span></div>
      <div class="flow-step"><strong>Pivot to incidents</strong><span>Open related incidents for evidence, response actions, and classification decisions.</span></div>
      <div class="flow-step"><strong>Hunt or tune</strong><span>Use analyst guidance to write KQL, create detections, or adjust controls.</span></div>
    </div>
  </div>
`;

VIEWS['defender/secure-score'] = () => `
  <div class="page-header"><div><div class="breadcrumb">Configuration › <strong>Secure score</strong></div><h1>Microsoft Secure Score</h1></div></div>
  <div class="two-col">
    <div class="card card-body" style="text-align:center;">
      <div class="alert-section-title">Your secure score</div>
      <div class="donut" style="--pct:65; margin:8px auto;"><div class="donut-inner"><b>65%</b><span>247 / 380 pts</span></div></div>
      <div class="muted">Last updated ${fmtTime(new Date().toISOString())}</div>
    </div>
    <div class="card card-body">
      <div class="alert-section-title">Comparison</div>
      <div style="font-size:13px; line-height:2;">
        <div>Your score: <strong>65%</strong></div>
        <div>Similar-size organizations: <strong>58%</strong></div>
        <div>All organizations: <strong>43%</strong></div>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="card-toolbar"><strong>Top improvement actions</strong></div>
    <table class="grid">
      <thead><tr><th>Action</th><th>Score impact</th><th>Status</th><th>Category</th></tr></thead>
      <tbody>
        <tr><td>Require MFA for all users</td><td>+12 pts</td><td><span class="tag orange">To do</span></td><td>Identity</td></tr>
        <tr><td>Enable Defender for Office 365 Plan 2</td><td>+8 pts</td><td><span class="tag orange">To do</span></td><td>Apps</td></tr>
        <tr><td>Block legacy authentication</td><td>+6 pts</td><td><span class="tag green">Completed</span></td><td>Identity</td></tr>
        <tr><td>Configure Defender for Endpoint EDR in block mode</td><td>+5 pts</td><td><span class="tag orange">To do</span></td><td>Device</td></tr>
      </tbody>
    </table>
  </div>
`;

VIEWS['defender/cloud-apps'] = () => {
  const inv = CLOUD_APP_INVESTIGATIONS[0];
  return `
    <div class="page-header">
      <div>
        <div class="breadcrumb">Configuration › <strong>Cloud apps</strong></div>
        <h1>Defender for Cloud Apps investigation</h1>
        <div class="page-subtitle">Risky OAuth app investigation tied to ${esc(inv.incidentId)} and the phishing-to-consent abuse scenario.</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="openIncident('${esc(inv.incidentId)}')">Open incident preview</button>
        <button class="btn btn-primary" onclick="openIncidentPage('${esc(inv.incidentId)}')">Open in Defender XDR</button>
      </div>
    </div>
    <div class="kpi-strip">
      <div class="kpi"><span class="kpi-label">Risky app</span><span class="kpi-value">${esc(inv.appName)}</span><span class="kpi-delta bad">${esc(inv.risk)} risk</span></div>
      <div class="kpi"><span class="kpi-label">Consenting user</span><span class="kpi-value" style="font-size:18px;">${esc(inv.user)}</span></div>
      <div class="kpi"><span class="kpi-label">Scopes</span><span class="kpi-value">${inv.scopes.length}</span><span class="kpi-delta">Mail + files + refresh token</span></div>
      <div class="kpi"><span class="kpi-label">Verdict</span><span class="kpi-value" style="font-size:18px;">True positive</span></div>
    </div>
    <div class="two-col">
      <section class="card card-body">
        <div class="alert-section-title">Risky OAuth app</div>
        <dl class="summary-info">
          <dt>App name</dt><dd>${esc(inv.appName)}</dd>
          <dt>Publisher</dt><dd>${esc(inv.publisher)}</dd>
          <dt>Consent time</dt><dd>${fmtTime(inv.consentTime)}</dd>
          <dt>Incident</dt><dd><button class="link-button" onclick="openIncidentPage('${esc(inv.incidentId)}')">${esc(inv.incidentId)}</button></dd>
        </dl>
        <div class="pill-row">${inv.scopes.map(s=>`<span class="tag orange">${esc(s)}</span>`).join('')}</div>
        <div class="alert-section-title">Why risky</div>
        <ul class="compact-list">${inv.indicators.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>
      </section>
      <section class="card card-body">
        <div class="alert-section-title">Response actions</div>
        <div class="response-flow">
          ${inv.response.map((r, idx) => `
            <div><strong>${idx + 1}. ${esc(r)}</strong><span>${idx < 2 ? 'High-confidence containment' : 'Investigation follow-up'}</span></div>
          `).join('')}
        </div>
        <div class="callout warn" style="margin-top:12px;">${esc(inv.verdict)}</div>
        <button class="btn btn-secondary btn-sm" onclick="toast('DocViewer Pro consent revoked in lab state.')">Revoke app consent</button>
        <button class="btn btn-secondary btn-sm" onclick="toast('Tenant app block queued in lab state.')">Block app</button>
      </section>
    </div>
    <section class="card" style="margin-top:16px;">
      <div class="card-toolbar"><strong>Investigation timeline</strong><a class="chip-link" href="#/sentinel/graph">Open Sentinel Graph →</a></div>
      <ol class="timeline card-body">
        ${inv.activity.map(a => `
          <li><div class="t-time">${fmtTime(a.time)}</div><div class="t-title">${esc(a.title)}</div><div class="muted">${esc(a.detail)}</div></li>
        `).join('')}
      </ol>
    </section>
  `;
};

VIEWS['defender/settings'] = () => `
  <div class="page-header">
    <div>
      <div class="breadcrumb">Configuration › <strong>Settings</strong></div>
      <h1>Microsoft Defender XDR settings</h1>
      <div class="page-subtitle">MDE tenant controls for advanced features, device grouping, permissions, and automation levels.</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="toast('Settings export prepared in the lab.')">Export</button>
      <button class="btn btn-primary" onclick="toast('Settings saved in lab memory only.')">Save changes</button>
    </div>
  </div>
  <div class="settings-grid">
    <section class="card card-body">
      <div class="alert-section-title">Advanced features</div>
      <div class="settings-list">
        ${MDE_SETTINGS.advancedFeatures.map(f => `
          <label class="setting-row">
            <input type="checkbox" ${f.enabled ? 'checked' : ''} onchange="toggleSettingState(this)">
            <span><strong>${esc(f.name)}</strong><small>${esc(f.note)}</small></span>
            <em>${f.enabled ? 'On' : 'Off'}</em>
          </label>
        `).join('')}
      </div>
    </section>
    <section class="card card-body">
      <div class="alert-section-title">Rules settings</div>
      <table class="grid compact-grid">
        <thead><tr><th>Area</th><th>Current setting</th><th>Owner</th></tr></thead>
        <tbody>${MDE_SETTINGS.rulesSettings.map(r => `
          <tr><td><strong>${esc(r.area)}</strong></td><td>${esc(r.setting)}</td><td>${esc(r.owner)}</td></tr>
        `).join('')}</tbody>
      </table>
    </section>
  </div>
  <div class="two-col" style="margin-top:16px;">
    <section class="card">
      <div class="card-toolbar"><strong>Device groups and automation levels</strong><span class="muted">Rank controls policy precedence</span></div>
      <table class="grid">
        <thead><tr><th>Rank</th><th>Device group</th><th>Devices</th><th>Automation level</th><th>Allowed role</th></tr></thead>
        <tbody>${MDE_SETTINGS.deviceGroups.map(g => `
          <tr><td>${g.rank}</td><td><strong>${esc(g.name)}</strong></td><td>${g.devices}</td><td>${esc(g.automation)}</td><td>${esc(g.role)}</td></tr>
        `).join('')}</tbody>
      </table>
    </section>
    <section class="card">
      <div class="card-toolbar"><strong>Permissions and roles</strong><a class="chip-link" href="#/defender/action-center">Review pending actions →</a></div>
      <table class="grid">
        <thead><tr><th>Role</th><th>Members</th><th>Rights</th></tr></thead>
        <tbody>${MDE_SETTINGS.roles.map(r => `
          <tr><td><strong>${esc(r.role)}</strong></td><td>${esc(r.members)}</td><td>${esc(r.rights)}</td></tr>
        `).join('')}</tbody>
      </table>
    </section>
  </div>
  <section class="card" style="margin-top:16px;">
    <div class="card-toolbar"><strong>Custom data collection</strong><span class="muted">Lab-only study cards</span></div>
    <div class="tile-grid">
      ${MDE_SETTINGS.customCollection.map(c => `
        <div class="tile">
          <div class="tile-title">${esc(c.name)}</div>
          <div class="tile-sub">${esc(c.scope)}</div>
          <div><span class="entity-chip">${esc(c.table)}</span><span class="tag ${c.status === 'Collecting' ? 'green' : 'orange'}">${esc(c.status)}</span></div>
        </div>
      `).join('')}
    </div>
  </section>
`;

VIEWS['defender/asr-policy'] = () => `
  <div class="page-header">
    <div>
      <div class="breadcrumb">Configuration › Endpoints › <strong>Attack surface reduction</strong></div>
      <h1>ASR policy configuration</h1>
      <div class="page-subtitle">Practice choosing audit, warn, and block behavior before enforcing high-impact endpoint rules.</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="toast('ASR policy duplicated for pilot testing.')">Duplicate policy</button>
      <button class="btn btn-primary" onclick="toast('ASR policy saved in the lab.')">Save policy</button>
    </div>
  </div>
  <div class="kpi-strip">
    <div class="kpi"><span class="kpi-label">Block rules</span><span class="kpi-value">${ASR_POLICIES.filter(p=>p.state==='Block').length}</span></div>
    <div class="kpi"><span class="kpi-label">Audit rules</span><span class="kpi-value">${ASR_POLICIES.filter(p=>p.state==='Audit').length}</span></div>
    <div class="kpi"><span class="kpi-label">Warn rules</span><span class="kpi-value">${ASR_POLICIES.filter(p=>p.state==='Warn').length}</span></div>
    <div class="kpi"><span class="kpi-label">Exclusions</span><span class="kpi-value">${ASR_POLICIES.reduce((n,p)=>n+p.exclusions.length,0)}</span></div>
  </div>
  <div class="card">
    <div class="card-toolbar"><strong>Rule states</strong><span class="muted">Audit first when business impact is uncertain</span></div>
    <table class="grid">
      <thead><tr><th>ASR rule</th><th>State</th><th>Mode</th><th>Exclusions</th><th>Observed impact</th></tr></thead>
      <tbody>${ASR_POLICIES.map(p => `
        <tr>
          <td><strong>${esc(p.rule)}</strong></td>
          <td><select class="input-sm"><option ${p.state==='Block'?'selected':''}>Block</option><option ${p.state==='Audit'?'selected':''}>Audit</option><option ${p.state==='Warn'?'selected':''}>Warn</option><option ${p.state==='Off'?'selected':''}>Off</option></select></td>
          <td>${esc(p.mode)}</td>
          <td>${p.exclusions.length ? p.exclusions.map(e=>`<span class="entity-chip">${esc(e)}</span>`).join('') : '<span class="muted">None</span>'}</td>
          <td>${esc(p.impact)}</td>
        </tr>
      `).join('')}</tbody>
    </table>
  </div>
  <div class="callout info" style="margin-top:16px;">
    <strong>SC-200 decision point:</strong> use Audit to measure breakage, Warn when user override is acceptable, and Block for high-confidence protections after exclusions are justified.
  </div>
`;

VIEWS['defender/notifications'] = () => `
  <div class="page-header">
    <div>
      <div class="breadcrumb">Configuration › <strong>Email notifications</strong></div>
      <h1>Email notification rules</h1>
      <div class="page-subtitle">Static create flow for incident, action center, and threat analytics notifications.</div>
    </div>
    <div class="page-actions"><button class="btn btn-primary" onclick="showNotificationComposer()">+ Create notification rule</button></div>
  </div>
  <div class="two-col">
    <section class="card">
      <div class="card-toolbar"><strong>${NOTIFICATION_RULES.length}</strong> notification rules</div>
      <table class="grid">
        <thead><tr><th>Status</th><th>Name</th><th>Trigger</th><th>Recipients</th><th>Filter</th></tr></thead>
        <tbody>${NOTIFICATION_RULES.map(r => `
          <tr><td><span class="status-dot resolved"></span>${esc(r.status)}</td><td><strong>${esc(r.name)}</strong></td><td>${esc(r.trigger)}</td><td>${esc(r.recipients)}</td><td>${esc(r.filter)}</td></tr>
        `).join('')}</tbody>
      </table>
    </section>
    <section class="card card-body notification-composer" id="notification-composer">
      <div class="alert-section-title">Create notification rule</div>
      <label class="wizard-label">Rule name<input class="text-input" id="notif-name" value="Medium incidents assigned to L1"></label>
      <label class="wizard-label">Notify on
        <select class="text-input" id="notif-trigger">
          <option>Incident created or updated</option>
          <option>Action center item pending</option>
          <option>Threat analytics report impacts assets</option>
        </select>
      </label>
      <label class="wizard-label">Recipients<input class="text-input" value="l1-soc@contoso.example"></label>
      <label class="wizard-label">Filter<input class="text-input" value="Severity is Medium and assignedTo is L1-Triage"></label>
      <button class="btn btn-primary" onclick="createNotificationRule()">Create lab rule</button>
      <div class="callout hidden" id="notification-result"></div>
    </section>
  </div>
`;

VIEWS['defender/alert-tuning'] = () => `
  <div class="page-header">
    <div>
      <div class="breadcrumb">Investigation &amp; response › <strong>Alert tuning</strong></div>
      <h1>Alert correlation and tuning</h1>
      <div class="page-subtitle">Suppression removes matching alert noise; correlation and tuning control how alerts become incidents.</div>
    </div>
    <div class="page-actions"><button class="btn btn-primary" onclick="toast('Tuning rule draft created in the lab.')">+ Create tuning rule</button></div>
  </div>
  <div class="correlation-path">
    <div><strong>Signal</strong><span>Raw detection from MDE, MDO, MDI, MDA, Entra, or cloud workload protection.</span></div>
    <div><strong>Alert</strong><span>Entity, evidence, severity, source, and MITRE context are normalized.</span></div>
    <div><strong>Correlation</strong><span>Shared entities, time windows, and source logic group related alerts.</span></div>
    <div><strong>Incident</strong><span>The analyst receives a unified case with timeline, evidence, and response actions.</span></div>
  </div>
  <div class="two-col" style="margin-top:16px;">
    <section class="card">
      <div class="card-toolbar"><strong>Incident rollup examples</strong><a class="chip-link" href="#/defender/incidents">Open incidents →</a></div>
      <table class="grid">
        <thead><tr><th>Incident</th><th>Correlated alerts</th><th>Why grouped</th></tr></thead>
        <tbody>${INCIDENTS.filter(i => i.alertIds.length > 1).slice(0,5).map(i => `
          <tr onclick="openIncident('${i.id}')">
            <td><span class="sev ${i.severity}">${cap(i.severity)}</span> <strong>${esc(i.title)}</strong></td>
            <td>${i.alertIds.map(id=>`<span class="entity-chip">${esc(id)}</span>`).join('')}</td>
            <td>${esc(i.entities.slice(0,2).map(e=>e.name).join(' + '))} inside the same investigation window</td>
          </tr>
        `).join('')}</tbody>
      </table>
    </section>
    <section class="card">
      <div class="card-toolbar"><strong>Tuning rules</strong><a class="chip-link" href="#/defender/suppression">Compare suppression →</a></div>
      <table class="grid">
        <thead><tr><th>Status</th><th>Name</th><th>Type</th><th>Outcome</th></tr></thead>
        <tbody>${ALERT_TUNING_RULES.map(r => `
          <tr><td><span class="tag ${r.status === 'Enabled' ? 'green' : 'orange'}">${esc(r.status)}</span></td><td><strong>${esc(r.name)}</strong><br><span class="muted">${esc(r.condition)}</span></td><td>${esc(r.type)}</td><td>${esc(r.outcome)}</td></tr>
        `).join('')}</tbody>
      </table>
    </section>
  </div>
`;

VIEWS['defender/air'] = () => `
  <div class="page-header">
    <div>
      <div class="breadcrumb">Investigation &amp; response › <strong>AIR center</strong></div>
      <h1>Automated investigation and response</h1>
      <div class="page-subtitle">Review automated investigations, remediation approvals, and automatic attack disruption outcomes.</div>
    </div>
    <div class="page-actions"><button class="btn btn-primary" onclick="toast('AIR policy review opened in the lab.')">Review automation policy</button></div>
  </div>
  <div class="kpi-strip">
    <div class="kpi"><span class="kpi-label">Investigations</span><span class="kpi-value">${AIR_INVESTIGATIONS.length}</span></div>
    <div class="kpi"><span class="kpi-label">Completed</span><span class="kpi-value">${AIR_INVESTIGATIONS.filter(i=>i.status==='Completed').length}</span></div>
    <div class="kpi"><span class="kpi-label">Pending approval</span><span class="kpi-value">${AIR_INVESTIGATIONS.filter(i=>i.status.includes('approval')).length}</span></div>
    <div class="kpi"><span class="kpi-label">Attack disruption</span><span class="kpi-value">${AIR_INVESTIGATIONS.filter(i=>i.disruption).length}</span></div>
  </div>
  <div class="two-col">
    <section class="card">
      <div class="card-toolbar"><strong>AIR investigations</strong><span class="muted">Fictional lab queue</span></div>
      <table class="grid">
        <thead><tr><th>Status</th><th>Investigation</th><th>Verdict</th><th>Actions</th></tr></thead>
        <tbody>${AIR_INVESTIGATIONS.map(i => `
          <tr><td><span class="tag ${i.status === 'Completed' ? 'green' : 'orange'}">${esc(i.status)}</span></td><td><strong>${esc(i.id)}</strong><br><button class="link-button strong" onclick="openIncident('${esc(i.incident)}')">${esc(i.title)}</button></td><td>${esc(i.verdict)}</td><td>${i.actions.map(a=>`<div class="mini-step">${esc(a)}</div>`).join('')}</td></tr>
        `).join('')}</tbody>
      </table>
    </section>
    <section class="card card-body">
      <div class="alert-section-title">Automatic attack disruption example</div>
      <div class="callout warn">INC-1050 triggered a high-confidence ransomware chain. The lab marks it as disrupted after automatic containment isolated the device and stopped malicious execution.</div>
      <div class="flowline vertical-flow">
        <div class="flow-step"><strong>Detect</strong><span>Ransomware encryption and shadow-copy deletion alerts correlate.</span></div>
        <div class="flow-step"><strong>Contain</strong><span>AIR isolates FIN-FS-02 and kills the process tree.</span></div>
        <div class="flow-step"><strong>Remediate</strong><span>locker.exe is quarantined; pending file restore remains an analyst decision.</span></div>
        <div class="flow-step"><strong>Explain</strong><span>Attack disruption reduces spread while preserving an evidence trail in the incident timeline.</span></div>
      </div>
      <button class="btn btn-secondary" onclick="openIncidentPage('INC-1050')">Open disrupted incident</button>
    </section>
  </div>
`;

// ---------- Defender for Endpoint › Devices ----------
VIEWS['defender/devices'] = () => `
  <div class="page-header">
    <div>
      <div class="breadcrumb">Assets › <strong>Devices</strong></div>
      <h1>Device inventory</h1>
      <div class="page-subtitle">Onboarded devices reporting to Defender for Endpoint. Select a device to open its overview, alerts, and Timeline.</div>
    </div>
  </div>
  <div class="kpi-strip">
    <div class="kpi"><span class="kpi-label">Onboarded</span><span class="kpi-value">${DEVICES.length}</span><span class="kpi-delta">Active sensors</span></div>
    <div class="kpi"><span class="kpi-label">High risk</span><span class="kpi-value">${DEVICES.filter(d=>d.riskLevel==='High').length}</span><span class="kpi-delta bad">Investigate</span></div>
    <div class="kpi"><span class="kpi-label">Open alerts</span><span class="kpi-value">${DEVICES.reduce((n,d)=>n+d.openAlerts,0)}</span><span class="kpi-delta">Across devices</span></div>
    <div class="kpi"><span class="kpi-label">Internet facing</span><span class="kpi-value">${DEVICES.filter(d=>d.isInternetFacing).length}</span><span class="kpi-delta">External incoming observed</span></div>
  </div>
  <div class="card">
    <div class="card-toolbar"><strong>Devices</strong><span class="muted">${DEVICES.length} devices</span></div>
    <table class="grid">
      <thead><tr><th>Name</th><th>Flags</th><th>Domain</th><th>OS</th><th>Risk</th><th>Exposure</th><th>Sensor</th><th>Last seen</th><th>Open alerts</th></tr></thead>
      <tbody>
        ${DEVICES.map(d => `
          <tr onclick="openDevice('${esc(d.id)}')">
            <td><strong>${esc(d.name)}</strong></td>
            <td>${d.isInternetFacing ? '<span class="dev-tag internet">Internet facing</span>' : '<span class="muted">—</span>'}</td>
            <td>${esc(d.domain)}</td>
            <td>${esc(d.os)}</td>
            <td><span class="sev ${d.riskLevel==='High'?'high':d.riskLevel==='Medium'?'medium':'low'}">${esc(d.riskLevel)}</span></td>
            <td>${esc(d.exposureLevel)}</td>
            <td>${esc(d.sensor)}</td>
            <td>${fmtTime(d.lastSeen)}</td>
            <td>${d.openAlerts}</td>
          </tr>`).join('')}
      </tbody>
    </table>
  </div>
`;

// ---------- Defender for Endpoint › Device detail (Overview / Timeline / …) ----------
const DEVICE_TABS = [
  { key:'overview',        label:'Overview' },
  { key:'incidents',       label:'Incidents and alerts' },
  { key:'timeline',        label:'Timeline' },
  { key:'recommendations', label:'Security recommendations' },
  { key:'effective',       label:'Effective settings' },
  { key:'inventories',     label:'Inventories' },
  { key:'vulnerabilities', label:'Discovered vulnerabilities' },
  { key:'missingkbs',      label:'Missing KBs' },
  { key:'baselines',       label:'Security baselines' },
  { key:'policies',        label:'Security policies' },
  { key:'sentinel',        label:'Sentinel events' },
];

VIEWS['defender/device'] = () => {
  const selectedId = sessionStorage.getItem('defender-lab.device.id') || DEVICES[0].id;
  const d = DEVICES.find(x => x.id === selectedId) || DEVICES[0];
  const tab = sessionStorage.getItem('defender-lab.device.tab') || 'overview';
  const events = (DEVICE_TIMELINE_EVENTS[d.id] || [])
    .slice().sort((a,b) => new Date(b.time) - new Date(a.time));
  const incAlerts = (typeof alerts !== 'undefined' ? alerts : SEED_ALERTS).filter(a => a.asset === d.id);

  const tabBtn = (t) => `
    <button class="tab ${tab===t.key?'active':''}" onclick="setDeviceTab('${t.key}')">${esc(t.label)}</button>`;

  // ---- Overview tab body (4-card row mirroring DfE shape) ----
  function overviewBody() {
    const riskClass = d.riskLevel==='High'?'high':d.riskLevel==='Medium'?'medium':'low';
    const recCount = d.recommendationCount ?? 3;
    const softwareCount = d.installedSoftware ?? 42;
    const vulnCount = d.discoveredVulnerabilities ?? 2;
    return `
      <div class="dev-overview-grid">
        <section class="dev-card">
          <div class="dev-card-title">Active alerts</div>
          <div class="dev-metric">Risk level: <span class="sev ${riskClass}">${esc(d.riskLevel)}</span></div>
          <div class="muted dev-card-sub">${d.openAlerts} active alert${d.openAlerts===1?'':'s'} in ${Math.max(1, incAlerts.length)} incident${incAlerts.length===1?'':'s'}</div>
          <div class="dev-bar" aria-label="Active alerts by severity">
            <span class="hi" style="width:62%"></span>
            <span class="md" style="width:30%"></span>
            <span class="lo" style="width:8%"></span>
          </div>
          <div class="dev-legend">
            <span><i class="hi"></i>High</span>
            <span><i class="md"></i>Medium</span>
            <span><i class="lo"></i>Low</span>
          </div>
          <a class="dev-link" onclick="setDeviceTab('incidents')">View all incidents and alerts</a>
        </section>
        <section class="dev-card">
          <div class="dev-card-title">Security assessments</div>
          <div class="dev-metric">Exposure level: <span class="sev ${d.exposureLevel==='High'?'high':d.exposureLevel==='Medium'?'medium':'low'}">${esc(d.exposureLevel)}</span></div>
          <div class="dev-assessment-list">
            <div><strong>${recCount}</strong><span>active security recommendations</span></div>
            <div><strong>${softwareCount}</strong><span>installed software</span></div>
            <div><strong>${vulnCount}</strong><span>discovered vulnerabilities</span></div>
          </div>
          <div class="dev-bar" aria-label="Vulnerabilities by severity">
            <span class="crit" style="width:18%"></span>
            <span class="hi"   style="width:55%"></span>
            <span class="md"   style="width:27%"></span>
          </div>
          <div class="dev-legend">
            <span><i class="crit"></i>Critical</span>
            <span><i class="hi"></i>High</span>
            <span><i class="md"></i>Medium</span>
          </div>
          <a class="dev-link" onclick="setDeviceTab('recommendations')">View all recommendations</a>
        </section>
        <section class="dev-card">
          <div class="dev-card-title">Logged on users (last 30 days)</div>
          <div class="dev-metric">1 logged on user</div>
          <div class="dev-user-row"><span>Most frequent</span><strong>${esc(d.primaryUser)}</strong></div>
          <div class="dev-user-row"><span>Least frequent</span><strong>None</strong></div>
          <a class="dev-link" onclick="toast('Logged on users pane opened (lab stub).')">View logged on users</a>
        </section>
        <section class="dev-card">
          <div class="dev-card-title">Device health status</div>
          <div class="dev-metric">Full scan status is unknown</div>
          <table class="dev-health">
            <thead><tr><th>Type</th><th>State</th><th class="right">Date &amp; time</th></tr></thead>
            <tbody>
              <tr><td>Last full scan</td><td><span class="dev-state err">Not performed</span></td><td class="right muted">—</td></tr>
              <tr><td>Last quick scan</td><td><span class="dev-state">Completed</span></td><td class="right muted">${fmtTime(d.lastSeen)}</td></tr>
              <tr><td>Security intelligence</td><td><span class="dev-state">Updated</span></td><td class="right muted">${fmtTime(d.lastSeen)}</td></tr>
              <tr><td>Engine</td><td><span class="dev-state">Current</span></td><td class="right muted">${fmtTime(d.lastSeen)}</td></tr>
              <tr><td>Platform</td><td><span class="dev-state">Current</span></td><td class="right muted">${fmtTime(d.lastSeen)}</td></tr>
              <tr><td>Defender Antivirus mode</td><td><span class="dev-state">Active</span></td><td class="right muted">${fmtTime(d.lastSeen)}</td></tr>
            </tbody>
          </table>
        </section>
      </div>`;
  }

  // ---- Incidents and alerts tab body ----
  function incidentsBody() {
    return `
      <div class="dev-cmdbar">
        <button class="btn btn-primary btn-sm" onclick="toast('Selected alert opened (lab stub).')">Open selected</button>
        <button class="btn btn-secondary btn-sm">Filter</button>
        <button class="btn btn-secondary btn-sm">Export</button>
      </div>
      <table class="grid">
        <thead><tr><th>Sev</th><th>Title</th><th>Status</th><th>Incident</th><th>Last updated</th></tr></thead>
        <tbody>
          ${incAlerts.map(a => `
            <tr onclick="openAlert('${esc(a.id)}')">
              <td><span class="sev ${a.severity}">${cap(a.severity)}</span></td>
              <td>${esc(a.title)}</td>
              <td>${esc(a.status)}</td>
              <td>${esc(a.incidentId)}</td>
              <td>${fmtTime(a.firstActivity)}</td>
            </tr>`).join('') || '<tr><td colspan="5" class="muted">No open alerts on this device.</td></tr>'}
        </tbody>
      </table>`;
  }

  // ---- Timeline tab body (interleaved technique markers + raw events) ----
  function timelineBody() {
    return `
      <div class="dev-cmdbar">
        <input class="ipt dev-search" placeholder="Search timeline" />
        <button class="btn btn-secondary btn-sm">Filter</button>
        <button class="btn btn-secondary btn-sm">Flagged events only</button>
        <button class="btn btn-secondary btn-sm">Time range</button>
        <button class="btn btn-secondary btn-sm">Customize columns</button>
        <button class="btn btn-secondary btn-sm">Export</button>
      </div>
      <div class="callout info">
        Click a <strong>technique marker</strong> (blue T) to open the side pane.
        <em>Hunt for related events</em> returns the <strong>underlying events</strong> related to that technique on this device — not the marker row itself.
      </div>
      <div class="dev-timeline-list">
        ${events.map((e, i) => {
          const isTech = e.kind === 'technique';
          const iconCls = isTech ? 'tech' : '';
          const iconLetter = isTech ? 'T' : (e.eventType||'E').charAt(0).toUpperCase();
          const titleHtml = isTech
            ? `${esc(e.techniqueId)} — ${esc(e.techniqueName)}`
            : esc(e.title || e.actionType || 'Event');
          const descHtml = esc(e.description || (e.cmdline ? e.cmdline : ''));
          const right = isTech ? 'Technique' : esc(e.eventType || (e.table||'').replace(/^Device/,''));
          const click = isTech
            ? `onclick="openTechnique('${esc(d.id)}', ${i})"`
            : `onclick="openDeviceTimelineEvent('${esc(d.id)}', ${i})"`;
          return `
            <div class="dev-tle ${isTech?'is-tech':''}" ${click} role="button" tabindex="0">
              <div class="dev-tle-time">${fmtTime(e.time)}</div>
              <div class="dev-tle-flag">${e.flagged ? '⚑' : ''}</div>
              <div class="dev-tle-icon ${iconCls}">${iconLetter}</div>
              <div class="dev-tle-main">
                <div class="dev-tle-title">${titleHtml}</div>
                <div class="dev-tle-desc muted">${descHtml}</div>
              </div>
              <div class="dev-tle-right muted">${right}</div>
            </div>`;
        }).join('') || '<div class="muted" style="padding:20px;">No events recorded.</div>'}
      </div>`;
  }

  function recommendationsBody() {
    return `
      <div class="dev-cmdbar">
        <button class="btn btn-primary btn-sm">Open selected</button>
        <button class="btn btn-secondary btn-sm">Create exception</button>
        <button class="btn btn-secondary btn-sm">Export</button>
      </div>
      <table class="grid">
        <thead><tr><th>Recommendation</th><th>Sev</th><th>Exposed devices</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>Update Microsoft Defender Antivirus security intelligence</td><td><span class="sev high">High</span></td><td>1</td><td>Active</td></tr>
          <tr><td>Enable full scan schedule</td><td><span class="sev medium">Medium</span></td><td>1</td><td>Active</td></tr>
          <tr><td>Apply latest cumulative update</td><td><span class="sev high">High</span></td><td>1</td><td>Active</td></tr>
        </tbody>
      </table>`;
  }

  function effectiveBody() {
    return `
      <div class="dev-cmdbar">
        <button class="btn btn-secondary btn-sm">Refresh</button>
        <button class="btn btn-secondary btn-sm">Export</button>
      </div>
      <div class="callout info">Effective settings resolve tenant security baseline, antivirus policy, endpoint detection policy, and local policy into the value currently applied to this device.</div>
      <table class="grid">
        <thead><tr><th>Setting</th><th>Category</th><th>Source</th><th>Effective value</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>Real-time protection</td><td>Antivirus</td><td>Antivirus policy</td><td>Enabled</td><td><span class="dev-state">Applied</span></td></tr>
          <tr><td>Cloud-delivered protection</td><td>Antivirus</td><td>Endpoint security baseline</td><td>Enabled</td><td><span class="dev-state">Applied</span></td></tr>
          <tr><td>EDR in block mode</td><td>Endpoint detection</td><td>MDE advanced features</td><td>Enabled</td><td><span class="dev-state">Applied</span></td></tr>
          <tr><td>Automatic investigation level</td><td>AIR</td><td>Finance workstations group</td><td>Full - remediate threats</td><td><span class="dev-state">Applied</span></td></tr>
          <tr><td>Scheduled full scan</td><td>Antivirus</td><td>Local policy</td><td>Not configured</td><td><span class="dev-state err">Needs attention</span></td></tr>
        </tbody>
      </table>`;
  }

  function inventoriesBody() {
    return `
      <div class="two-col">
        <div class="card card-body"><div class="tile-title">Software inventory</div><div class="tile-sub">Installed applications and versions for ${esc(d.name)}.</div></div>
        <div class="card card-body"><div class="tile-title">Certificates</div><div class="tile-sub">Certificate inventory and trust details.</div></div>
        <div class="card card-body"><div class="tile-title">Browser extensions</div><div class="tile-sub">Extension inventory and risk scoring.</div></div>
        <div class="card card-body"><div class="tile-title">Hardware</div><div class="tile-sub">Device hardware information.</div></div>
      </div>`;
  }

  function vulnerabilitiesBody() {
    return `
      <table class="grid">
        <thead><tr><th>CVE</th><th>Sev</th><th>CVSS</th><th>Software</th><th>Published</th></tr></thead>
        <tbody>
          <tr><td>CVE-2026-0001</td><td><span class="sev high">High</span></td><td>8.8</td><td>Windows Server component</td><td>2026</td></tr>
          <tr><td>CVE-2026-0014</td><td><span class="sev medium">Medium</span></td><td>6.5</td><td>Browser runtime</td><td>2026</td></tr>
        </tbody>
      </table>`;
  }

  function missingKbsBody() {
    return `
      <table class="grid">
        <thead><tr><th>KB</th><th>Classification</th><th>Sev</th><th>Restart required</th></tr></thead>
        <tbody>
          <tr><td>KB5040112</td><td>Security update</td><td><span class="sev high">High</span></td><td>Yes</td></tr>
          <tr><td>KB5040128</td><td>Cumulative update</td><td><span class="sev medium">Medium</span></td><td>No</td></tr>
        </tbody>
      </table>`;
  }

  function baselinesBody() {
    return `
      <div class="two-col">
        <div class="card card-body"><div class="tile-title">Windows security baseline</div><div class="tile-sub">73% compliant. 11 controls need review.</div></div>
        <div class="card card-body"><div class="tile-title">Defender baseline</div><div class="tile-sub">Full-scan configuration and antivirus settings need attention.</div></div>
      </div>`;
  }

  function policiesBody() {
    return `
      <table class="grid">
        <thead><tr><th>Policy</th><th>Type</th><th>Status</th><th>Last applied</th></tr></thead>
        <tbody>
          <tr><td>Endpoint security baseline</td><td>Security settings</td><td>Applied</td><td>${fmtTime(d.lastSeen)}</td></tr>
          <tr><td>Antivirus policy</td><td>Microsoft Defender Antivirus</td><td>Applied</td><td>${fmtTime(d.lastSeen)}</td></tr>
        </tbody>
      </table>`;
  }

  function sentinelBody() {
    return `
      <div class="card card-body">
        <div class="alert-section-title">Sentinel events</div>
        <p class="muted">Related Microsoft Sentinel events and incidents associated with ${esc(d.name)}.</p>
        <button class="btn btn-primary btn-sm" onclick="navigate('#/sentinel/incidents')">Open related Sentinel incident</button>
      </div>`;
  }

  const bodies = {
    overview: overviewBody, incidents: incidentsBody, timeline: timelineBody,
    recommendations: recommendationsBody, effective: effectiveBody, inventories: inventoriesBody,
    vulnerabilities: vulnerabilitiesBody, missingkbs: missingKbsBody,
    baselines: baselinesBody, policies: policiesBody, sentinel: sentinelBody,
  };
  const body = (bodies[tab] || overviewBody)();

  // Risk pill helper for header badges
  const riskColor = d.riskLevel==='High' ? '#d13438' : d.riskLevel==='Medium' ? '#ff8c00' : '#107c10';
  const internetFacing = d.isInternetFacing
    ? `<span class="dev-tag internet" title="This device received external incoming communication.">Internet facing</span>`
    : '';

  return `
    <div class="dev-crumbs">
      <a onclick="navigate('#/defender/devices')">Device inventory</a>
      <span>›</span>
      <a>${esc(d.name)}</a>
    </div>
    <header class="dev-header">
      <div class="dev-id">
        <div class="dev-id-icon" title="Device details">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H13v2h3.25a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1 0-1.5H11v-2H6.5A2.5 2.5 0 0 1 4 13.5v-8Z"/>
          </svg>
        </div>
        <div>
          <div class="dev-id-name">${esc(d.name)}</div>
          <div class="dev-badges">
            <span class="dev-badge"><span class="dev-block" style="background:${riskColor}"></span> ${esc(d.riskLevel)}</span>
            <span class="dev-badge"><span class="dev-block" style="background:#ff8c00"></span> Criticality: ${esc(d.exposureLevel)}</span>
            <span class="dev-badge"><span class="dev-dot" style="background:#107c10"></span> ${esc(d.healthStatus)}</span>
            ${internetFacing}
            ${d.tags.map(t=>`<span class="dev-tag">${esc(t)}</span>`).join(' ')}
          </div>
        </div>
      </div>
      <div class="dev-header-actions">
        <button class="dev-action" onclick="toast('Map opened (lab stub).')">View in map</button>
        <button class="dev-action" onclick="toast('Device isolated (lab stub).')">Isolate device</button>
        <button class="dev-action" onclick="toast('App execution restricted for ${esc(d.name)} (lab stub).')">Restrict app execution</button>
        <button class="dev-action" onclick="toast('Antivirus scan queued (lab stub).')">Run antivirus scan</button>
        <button class="dev-action" onclick="openInvestigationPackage('${esc(d.id)}')">Collect investigation package</button>
        <button class="dev-action" onclick="openDeviceLiveResponse('${esc(d.id)}')">Initiate Live Response Session</button>
        <button class="dev-action" onclick="toast('Automated investigation initiated for ${esc(d.name)} (lab stub).')">Initiate automated investigation</button>
        <button class="dev-action" onclick="toast('Threat expert consultation request drafted (lab stub).')">Consult a threat expert</button>
        <button class="dev-action" onclick="toast('Action center opened for this device (lab stub).')">Action center</button>
        <button class="dev-action" onclick="toast('Criticality menu opened (lab stub).')">Set criticality</button>
        <button class="dev-action" onclick="toast('More actions opened (lab stub).')">⋯</button>
      </div>
    </header>
    <nav class="tabs dev-tabs" aria-label="Device tabs">
      ${DEVICE_TABS.map(tabBtn).join('')}
    </nav>
    <div class="dev-content">
      <aside class="dev-rail">
        <div class="alert-section-title">Device details</div>
        <div class="dev-rail-grid">
          <div><div class="dev-rail-label">Category</div><div class="dev-rail-value">Endpoint</div></div>
          <div><div class="dev-rail-label">Type</div><div class="dev-rail-value">${d.os.includes('Server')?'Server':'Workstation'}</div></div>
          <div><div class="dev-rail-label">Subtype</div><div class="dev-rail-value">${d.os.includes('Server')?'Server':'Domain'}</div></div>
          <div><div class="dev-rail-label">SAM name</div><div class="dev-rail-value">${esc(d.name)}</div></div>
          <div><div class="dev-rail-label">OS</div><div class="dev-rail-value">${esc(d.os)}</div></div>
          <div><div class="dev-rail-label">Domain</div><div class="dev-rail-value">${esc(d.domain)}</div></div>
          <div><div class="dev-rail-label">Asset group</div><div class="dev-rail-value">${esc(d.tags[0] || '—')}</div></div>
          <div><div class="dev-rail-label">Health state</div><div class="dev-rail-value">${esc(d.healthStatus)}</div></div>
          <div><div class="dev-rail-label">First seen</div><div class="dev-rail-value">${fmtTime(d.firstSeen)}</div></div>
          <div><div class="dev-rail-label">Last seen</div><div class="dev-rail-value">${fmtTime(d.lastSeen)}</div></div>
          <div><div class="dev-rail-label">IP addresses</div><div class="dev-rail-value">${esc(d.ip)}</div></div>
          <div><div class="dev-rail-label">Primary user</div><div class="dev-rail-value">${esc(d.primaryUser)}</div></div>
          <div><div class="dev-rail-label">Onboarding status</div><div class="dev-rail-value">${esc(d.onboardingStatus)}</div></div>
          <div><div class="dev-rail-label">Sensor</div><div class="dev-rail-value">${esc(d.sensor)}</div></div>
        </div>
      </aside>
      <section class="dev-main">${body}</section>
    </div>
  `;
};

// ---------- Defender for Identity ↔ XDR › Identities (list) ----------
VIEWS['defender/identities'] = () => `
  <div class="page-header">
    <div>
      <div class="breadcrumb">Assets › <strong>Identities</strong></div>
      <h1>Identity inventory</h1>
      <div class="page-subtitle">Security principals observed by Defender for Identity, Entra ID, and Defender XDR. Sensitive / privileged accounts are tagged.</div>
    </div>
  </div>
  <div class="kpi-strip">
    <div class="kpi"><span class="kpi-label">Identities</span><span class="kpi-value">${IDENTITIES.length}</span><span class="kpi-delta">Onboarded sources</span></div>
    <div class="kpi"><span class="kpi-label">Sensitive</span><span class="kpi-value">${IDENTITIES.filter(i=>i.sensitive).length}</span><span class="kpi-delta">Tier-0 / sync / KDC</span></div>
    <div class="kpi"><span class="kpi-label">Privileged</span><span class="kpi-value">${IDENTITIES.filter(i=>i.privileged).length}</span><span class="kpi-delta">Role-bearing</span></div>
    <div class="kpi"><span class="kpi-label">Open alerts</span><span class="kpi-value">${IDENTITIES.reduce((n,i)=>n+i.openAlerts,0)}</span><span class="kpi-delta bad">Across identities</span></div>
  </div>
  <div class="card">
    <div class="card-toolbar"><strong>Identities</strong><span class="muted">${IDENTITIES.length} principals</span></div>
    <table class="grid">
      <thead><tr><th>Display name</th><th>UPN</th><th>Type</th><th>Department</th><th>Risk</th><th>Tags</th><th>Sources</th><th>Last seen</th><th>Open alerts</th></tr></thead>
      <tbody>
        ${IDENTITIES.map(i => `
          <tr onclick="openIdentity('${esc(i.id)}')">
            <td><strong>${esc(i.displayName)}</strong></td>
            <td>${esc(i.upn)}</td>
            <td>${esc(i.accountType)}</td>
            <td>${esc(i.department)}</td>
            <td><span class="sev ${i.riskLevel==='High'?'high':i.riskLevel==='Medium'?'medium':'info'}">${esc(i.riskLevel)}</span></td>
            <td>${i.sensitive?'<span class="tag">Sensitive</span> ':''}${i.privileged?'<span class="tag">Privileged</span>':''}</td>
            <td>${i.sources.map(s=>`<span class="tag">${esc(s)}</span>`).join(' ')}</td>
            <td>${fmtTime(i.lastSeen)}</td>
            <td>${i.openAlerts}</td>
          </tr>`).join('')}
      </tbody>
    </table>
  </div>
`;

VIEWS['defender/identity-protection'] = () => `
  <div class="page-header">
    <div>
      <div class="breadcrumb">Assets › Identities › <strong>Identity protection</strong></div>
      <h1>Compromised identity investigation</h1>
      <div class="page-subtitle">Review risky sign-ins and risk detections, then confirm compromise or dismiss risk with documented context.</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="toast('Risk policy settings opened in the lab.')">Risk policy</button>
      <button class="btn btn-primary" onclick="openIdentity('sam.lee@contoso.com')">Open Sam Lee identity</button>
    </div>
  </div>
  <div class="identity-risk-layout">
    <section class="card">
      <div class="card-toolbar"><strong>Risky users</strong><span class="muted">${ENTRA_IDENTITY_INVESTIGATIONS.length} lab investigations</span></div>
      <table class="grid">
        <thead><tr><th>User</th><th>User risk</th><th>Sign-in risk</th><th>Status</th><th>Incident</th><th>Actions</th></tr></thead>
        <tbody>${ENTRA_IDENTITY_INVESTIGATIONS.map(r => `
          <tr onclick="openIdentity('${esc(r.user)}')">
            <td><strong>${esc(r.user)}</strong></td>
            <td><span class="sev ${r.userRisk === 'High' ? 'high' : 'medium'}">${esc(r.userRisk)}</span></td>
            <td><span class="sev ${r.signInRisk === 'High' ? 'high' : 'medium'}">${esc(r.signInRisk)}</span></td>
            <td>${esc(r.status)}</td>
            <td><button class="link-button" onclick="event.stopPropagation(); openIncidentPage('${esc(r.incidentId)}')">${esc(r.incidentId)}</button></td>
            <td>
              <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); toast('Compromise confirmed for ${esc(r.user)} in lab state.')">Confirm compromise</button>
              <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); toast('Risk dismissed for ${esc(r.user)} in lab state.')">Dismiss</button>
            </td>
          </tr>
        `).join('')}</tbody>
      </table>
    </section>
    ${ENTRA_IDENTITY_INVESTIGATIONS.map(r => `
      <section class="card card-body">
        <div class="alert-section-title">${esc(r.user)} - investigation detail</div>
        <div class="callout info">${esc(r.decisionGuide)}</div>
        <div class="two-col">
          <div>
            <div class="alert-section-title">Risk detections</div>
            <table class="grid compact-grid">
              <thead><tr><th>Time</th><th>Detection</th><th>Risk</th><th>Detail</th></tr></thead>
              <tbody>${r.riskDetections.map(d => `
                <tr><td>${fmtTime(d.time)}</td><td><strong>${esc(d.type)}</strong><br><span class="muted">${esc(d.source)}</span></td><td><span class="sev ${d.risk === 'High' ? 'high' : 'medium'}">${esc(d.risk)}</span></td><td>${esc(d.detail)}</td></tr>
              `).join('')}</tbody>
            </table>
          </div>
          <div>
            <div class="alert-section-title">Risky sign-ins</div>
            <table class="grid compact-grid">
              <thead><tr><th>Time</th><th>App</th><th>IP</th><th>Location</th><th>Result</th></tr></thead>
              <tbody>${r.signIns.map(s => `
                <tr><td>${fmtTime(s.time)}</td><td>${esc(s.app)}</td><td>${esc(s.ip)}</td><td>${esc(s.location)}</td><td>${esc(s.result)} · ${esc(s.risk)}</td></tr>
              `).join('')}</tbody>
            </table>
          </div>
        </div>
        <div class="incident-command-bar">
          ${r.actions.map(a => `<button class="btn btn-secondary btn-sm" onclick="toast('${esc(a)} action recorded for ${esc(r.user)}.')">${esc(a)}</button>`).join('')}
        </div>
      </section>
    `).join('')}
  </div>
`;

// ---------- Defender for Identity ↔ XDR › Identity detail (Overview / Timeline / …) ----------
const IDENTITY_TABS = [
  { key:'overview',   label:'Overview' },
  { key:'incidents',  label:'Incidents and alerts' },
  { key:'assets',     label:'Assets' },
  { key:'timeline',   label:'Timeline' },
  { key:'lmp',        label:'Lateral movement paths' },
  { key:'directory',  label:'Directory data' },
  { key:'sentinel',   label:'Sentinel events' },
];

const IDENTITY_ALERT_TEMPLATES = [
  ['high', 'Suspicious DCSync activity', 'Defender for Identity', 'INC-1019', 'Credential access'],
  ['high', 'Possible AdminSDHolder modification', 'Defender for Identity', 'INC-1019', 'Persistence'],
  ['medium', 'Suspicious LDAP enumeration', 'Defender for Identity', 'INC-1019', 'Discovery'],
  ['medium', 'Reconnaissance using directory services queries', 'Defender for Identity', 'INC-1019', 'Discovery'],
  ['high', 'Honeytoken account activity', 'Defender for Identity', 'INC-1019', 'Credential access'],
  ['medium', 'Suspicious Kerberos service ticket request', 'Defender for Identity', 'INC-1019', 'Credential access'],
  ['high', 'Suspected Golden Ticket usage', 'Defender for Identity', 'INC-1019', 'Credential access'],
  ['medium', 'Unusual protocol implementation detected', 'Defender for Identity', 'INC-1038', 'Defense evasion'],
  ['medium', 'Remote code execution attempt over SMB', 'Defender for Endpoint', 'INC-1050', 'Lateral movement'],
  ['high', 'Account performed suspicious remote logon', 'Defender for Identity', 'INC-1050', 'Lateral movement'],
  ['medium', 'Unusual administrative group membership change', 'Defender for Identity', 'INC-1019', 'Privilege escalation'],
  ['high', 'Sensitive group modification', 'Defender for Identity', 'INC-1019', 'Privilege escalation'],
  ['medium', 'Password spray attempt detected', 'Entra ID Protection', 'INC-1053', 'Credential access'],
  ['medium', 'Multiple failed sign-ins followed by success', 'Entra ID Protection', 'INC-1053', 'Credential access'],
  ['high', 'Risky sign-in from anonymous IP address', 'Entra ID Protection', 'INC-1051', 'Initial access'],
  ['medium', 'Impossible travel sign-in properties', 'Entra ID Protection', 'INC-1053', 'Initial access'],
  ['high', 'Adversary-in-the-middle phishing session detected', 'Entra ID Protection', 'INC-1051', 'Initial access'],
  ['medium', 'Suspicious inbox rule created', 'Defender for Office 365', 'INC-1042', 'Collection'],
  ['high', 'OAuth app consent granted to risky application', 'Defender for Cloud Apps', 'INC-1042', 'Persistence'],
  ['medium', 'Unusual file download volume', 'Defender for Cloud Apps', 'INC-1042', 'Exfiltration'],
];

function identityAlertRows(identity, realAlerts, timeline) {
  const defaultIncident = identity.id === 'fin-svc@contoso.com' ? 'INC-1050'
    : identity.id === 'jane.doe@contoso.com' ? 'INC-1042'
    : identity.id === 'maria.ross@contoso.com' ? 'INC-1051'
    : identity.id === 'sam.lee@contoso.com' ? 'INC-1053'
    : identity.id === 'svc-backup@contoso.com' || identity.id === 'MSOL_AzureSync@contoso.com' ? 'INC-1019'
    : 'INC-1038';
  const timelineAlerts = timeline.filter(r => r.kind === 'alert').map((r, index) => ({
    id: r.alertId || `IDTIM-${index + 1}`,
    severity: r.severity || 'medium',
    title: r.title,
    status: r.classification === 'Pending' ? 'New' : 'In progress',
    incidentId: realAlerts[index]?.incidentId || defaultIncident,
    detectionSource: r.source || 'Defender XDR',
    category: r.techniqueName || 'Identity',
    firstActivity: r.time,
    real: Boolean(realAlerts.find(a => a.id === r.alertId)),
  }));
  const real = realAlerts.map(a => ({ ...a, real:true }));
  const synthetic = Array.from({ length: 48 }, (_, index) => {
    const t = IDENTITY_ALERT_TEMPLATES[index % IDENTITY_ALERT_TEMPLATES.length];
    const when = new Date(new Date(identity.lastSeen).getTime() - (index + 1) * 17 * 60 * 1000).toISOString();
    return {
      id: `ID-${identity.samName.replace(/[^a-z0-9]/gi, '').toUpperCase()}-${String(index + 1).padStart(3, '0')}`,
      severity: t[0],
      title: `${t[1]} - ${identity.displayName}`,
      status: index % 5 === 0 ? 'New' : index % 3 === 0 ? 'Resolved' : 'In progress',
      incidentId: t[3],
      detectionSource: t[2],
      category: t[4],
      firstActivity: when,
      real: false,
    };
  });
  const byId = new Map();
  [...real, ...timelineAlerts, ...synthetic].forEach(row => byId.set(row.id, row));
  return [...byId.values()].sort((a,b) => new Date(b.firstActivity) - new Date(a.firstActivity));
}

function identityAssetRows(identity) {
  const devices = ['WKS-03','FIN-FS-02','DC01','AAD-CONNECT-01','WKS-01','WKS-02'];
  const apps = ['Office 365 Exchange Online','DocViewer Pro','Azure Portal','Microsoft Teams','SharePoint Online','Graph PowerShell'];
  const ips = ['10.20.7.42','10.20.4.55','185.199.111.12','91.219.236.54','76.21.55.4','168.63.129.16'];
  const files = ['scanner.exe','locker.exe','vssadmin.exe','invoice.html','consent-grant.json','RECOVER-FILES.txt'];
  const groups = ['Domain Admins','Backup Operators','Finance Share Owners','Privileged Role Admins','Remote Management Users'];
  const mailboxes = [identity.upn, 'shared-finance@contoso.com', 'cfo@contoso.com'];
  const make = (type, values, source, riskBase) => values.map((name, index) => ({
    type,
    name,
    source,
    risk: index === 0 ? riskBase : index % 3 === 0 ? 'High' : index % 2 === 0 ? 'Medium' : 'Low',
    firstSeen: new Date(new Date(identity.firstSeen).getTime() + index * 86400000).toISOString(),
    lastSeen: new Date(new Date(identity.lastSeen).getTime() - index * 3600000).toISOString(),
  }));
  return [
    ...make('Device', devices, 'Defender for Endpoint', identity.riskLevel),
    ...make('Cloud app', apps, 'Defender for Cloud Apps', 'Medium'),
    ...make('IP address', ips, 'Entra ID Protection', 'Medium'),
    ...make('File', files, 'Defender XDR evidence', 'High'),
    ...make('Group', groups, 'Defender for Identity', identity.privileged ? 'High' : 'Medium'),
    ...make('Mailbox', mailboxes, 'Defender for Office 365', 'Medium'),
  ];
}

VIEWS['defender/identity'] = () => {
  const selectedId = sessionStorage.getItem('defender-lab.identity.id') || IDENTITIES[0].id;
  const i = IDENTITIES.find(x => x.id === selectedId) || IDENTITIES[0];
  const tab = sessionStorage.getItem('defender-lab.identity.tab') || 'overview';
  const timeline = (IDENTITY_TIMELINE[i.id] || [])
    .slice().sort((a,b) => new Date(b.time) - new Date(a.time));
  const incAlerts = (typeof alerts !== 'undefined' ? alerts : SEED_ALERTS)
    .filter(a => a.asset === i.id || a.asset === i.samName || a.asset === i.upn);
  const identityAlerts = identityAlertRows(i, incAlerts, timeline);
  const identityAssets = identityAssetRows(i);

  const tabBtn = t => `
    <button class="tab ${tab===t.key?'active':''}" onclick="setIdentityTab('${t.key}')">${esc(t.label)}</button>`;

  const riskClass = i.riskLevel==='High' ? 'high'
                  : i.riskLevel==='Medium' ? 'medium' : 'info';
  const riskColor = i.riskLevel==='High' ? '#d13438'
                  : i.riskLevel==='Medium' ? '#f7630c' : '#0078d4';

  // ---- Overview ----
  function overviewBody() {
    return `
      <div class="dev-overview-grid">
        <section class="dev-card">
          <div class="dev-card-title">Active alerts</div>
          <div class="dev-metric">Risk level: <span class="sev ${riskClass}">${esc(i.riskLevel)}</span></div>
          <div class="muted dev-card-sub">${identityAlerts.filter(a=>a.status !== 'Resolved').length} active alerts, ${identityAlerts.length} total alert records</div>
          <a class="dev-link" onclick="setIdentityTab('incidents')">View all incidents and alerts</a>
        </section>
        <section class="dev-card">
          <div class="dev-card-title">Account properties</div>
          <div class="dev-metric">${esc(i.accountType)}</div>
          <div class="muted dev-card-sub">
            ${i.sensitive ? '<span class="tag">Sensitive</span> ' : ''}
            ${i.privileged ? '<span class="tag">Privileged</span>' : ''}
            ${(!i.sensitive && !i.privileged) ? 'No sensitive / privileged flags' : ''}
          </div>
          <div class="muted dev-card-sub">Department: ${esc(i.department)}</div>
          <div class="muted dev-card-sub">Title: ${esc(i.title)}</div>
        </section>
        <section class="dev-card">
          <div class="dev-card-title">Observed in organization</div>
          <div class="dev-metric">${identityAssets.length} related assets</div>
          <div class="muted dev-card-sub">${identityAssets.filter(a=>a.type==='Device').length} devices · ${identityAssets.filter(a=>a.type==='Cloud app').length} cloud apps · ${identityAssets.filter(a=>a.type==='IP address').length} IPs</div>
          <a class="dev-link" onclick="setIdentityTab('assets')">View all assets</a>
        </section>
        <section class="dev-card">
          <div class="dev-card-title">Investigator notes</div>
          <p class="muted" style="font-size:12px; line-height:1.45; margin:6px 0 10px;">${esc(i.notes)}</p>
          <a class="dev-link" onclick="setIdentityTab('timeline')">Open timeline</a>
        </section>
      </div>`;
  }

  // ---- Incidents and alerts ----
  function incidentsBody() {
    return `
      <div class="dev-cmdbar">
        <button class="btn btn-primary btn-sm" onclick="toast('Selected alert opened (lab stub).')">Open selected</button>
        <button class="btn btn-secondary btn-sm">Filter</button>
        <button class="btn btn-secondary btn-sm">Manage columns</button>
        <button class="btn btn-secondary btn-sm">Export</button>
        <span class="muted" style="align-self:center;">${identityAlerts.length} alert records</span>
      </div>
      <table class="grid">
        <thead><tr><th>Sev</th><th>Title</th><th>Status</th><th>Incident</th><th>Source</th><th>First activity</th></tr></thead>
        <tbody>
          ${identityAlerts.map(a => `
            <tr onclick="${a.real ? `openAlert('${esc(a.id)}')` : `toast('Synthetic identity alert ${esc(a.id)} opened (lab stub).')`}">
              <td><span class="sev ${a.severity}">${cap(a.severity)}</span></td>
              <td>${esc(a.title)}</td>
              <td>${esc(a.status)}</td>
              <td><button class="link-button" onclick="event.stopPropagation(); openIncidentPage('${esc(a.incidentId)}')">${esc(a.incidentId)}</button></td>
              <td>${esc(a.detectionSource)}</td>
              <td>${fmtTime(a.firstActivity)}</td>
            </tr>`).join('') || '<tr><td colspan="6" class="muted">No alerts on this identity.</td></tr>'}
        </tbody>
      </table>`;
  }

  function assetsBody() {
    return `
      <div class="dev-cmdbar">
        <button class="btn btn-primary btn-sm" onclick="toast('Selected asset opened (lab stub).')">Open selected</button>
        <button class="btn btn-secondary btn-sm">Filter</button>
        <button class="btn btn-secondary btn-sm">Export</button>
        <span class="muted" style="align-self:center;">${identityAssets.length} related assets</span>
      </div>
      <table class="grid">
        <thead><tr><th>Asset type</th><th>Name</th><th>Risk</th><th>Source</th><th>First seen</th><th>Last seen</th><th>Action</th></tr></thead>
        <tbody>
          ${identityAssets.map(asset => {
            const isDevice = asset.type === 'Device' && deviceExists(asset.name);
            return `
              <tr onclick="${isDevice ? `openDevice('${esc(asset.name)}')` : `toast('Synthetic ${esc(asset.type)} asset opened (lab stub).')`}">
                <td>${esc(asset.type)}</td>
                <td><strong>${esc(asset.name)}</strong></td>
                <td><span class="sev ${asset.risk==='High'?'high':asset.risk==='Medium'?'medium':'info'}">${esc(asset.risk)}</span></td>
                <td>${esc(asset.source)}</td>
                <td>${fmtTime(asset.firstSeen)}</td>
                <td>${fmtTime(asset.lastSeen)}</td>
                <td>${isDevice
                  ? `<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); openDevice('${esc(asset.name)}')">Open device</button>`
                  : `<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); toast('Asset pivot opened for ${esc(asset.name)} (lab stub).')">Open asset</button>`}</td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>`;
  }

  // ---- Timeline ----
  // Identity timeline = alerts and raw identity-flavored events. Alert rows are
  // clickable to open the alert detail (with the classification helper baked in).
  function timelineBody() {
    return `
      <div class="dev-cmdbar">
        <input class="ipt dev-search" placeholder="Search timeline" />
        <button class="btn btn-secondary btn-sm">Filter</button>
        <button class="btn btn-secondary btn-sm">Time range</button>
      </div>
      <div class="callout info">
        Identity timeline interleaves <strong>Defender for Identity alerts</strong> with the raw events
        that triggered them. Click an alert row to open the classification helper
        (True positive / Benign true positive / False positive) — the MSOL_AzureSync DCSync
        scenario is the canonical "benign true positive" pattern.
      </div>
      <div class="dev-timeline-list">
        ${timeline.map((e, idx) => {
          const isAlert = e.kind === 'alert';
          const iconCls = isAlert ? 'tech' : '';
          const iconLetter = isAlert ? 'A' : (e.actionType || 'E').charAt(0).toUpperCase();
          const right = isAlert ? `${cap(e.severity)} alert` : (e.actionType || 'Event');
          const click = isAlert
            ? `onclick="openIdentityAlert('${esc(i.id)}', ${idx})"`
            : `onclick="toast('Event detail — pivot to Advanced hunting for raw row.')"`;
          return `
            <div class="dev-tle ${isAlert?'is-tech':''}" ${click} role="button" tabindex="0">
              <div class="dev-tle-time">${fmtTime(e.time)}</div>
              <div class="dev-tle-icon ${iconCls}">${iconLetter}</div>
              <div class="dev-tle-main">
                <div class="dev-tle-title">${esc(e.title || e.actionType || 'Event')}</div>
                <div class="dev-tle-desc muted">${esc(e.description || '')}</div>
              </div>
              <div class="dev-tle-right muted">${esc(right)}</div>
            </div>`;
        }).join('') || '<div class="muted" style="padding:20px;">No timeline records.</div>'}
      </div>`;
  }

  function lmpBody() {
    return `
      <div class="callout info">
        Lateral movement paths (LMPs) surface every <em>shortest path</em> an attacker could
        traverse from this identity to a Tier-0 asset using observed sign-ins, group memberships,
        and local-admin rights. Defender for Identity recomputes LMPs every 48 hours.
      </div>
      <div class="card card-body">
        <strong>Sample path for ${esc(i.displayName)}</strong>
        <ol style="margin:8px 0 0 18px; line-height:1.7; font-size:13px;">
          <li>${esc(i.displayName)} signs in interactively on WKS-03</li>
          <li>fin-svc (local admin on WKS-03) cached credentials present</li>
          <li>fin-svc signs in to FIN-FS-02 over RDP (member of Domain Admins via nested group)</li>
          <li>FIN-FS-02 mounts an SMB share on DC01 — Tier-0 reach</li>
        </ol>
        <p class="muted" style="margin-top:10px;">Remediation: remove fin-svc from local admins on WKS-03, scope domain-admin via tiered admin model, enforce LAPS.</p>
      </div>`;
  }

  function directoryBody() {
    return `
      <table class="grid">
        <thead><tr><th>Attribute</th><th>Value</th></tr></thead>
        <tbody>
          <tr><td>Display name</td><td>${esc(i.displayName)}</td></tr>
          <tr><td>SAM account name</td><td>${esc(i.samName)}</td></tr>
          <tr><td>User principal name</td><td>${esc(i.upn)}</td></tr>
          <tr><td>SID</td><td>${esc(i.sid)}</td></tr>
          <tr><td>Account type</td><td>${esc(i.accountType)}</td></tr>
          <tr><td>Department</td><td>${esc(i.department)}</td></tr>
          <tr><td>Title</td><td>${esc(i.title)}</td></tr>
          <tr><td>Sensitive</td><td>${i.sensitive?'Yes':'No'}</td></tr>
          <tr><td>Privileged</td><td>${i.privileged?'Yes':'No'}</td></tr>
          <tr><td>Sources</td><td>${i.sources.map(s=>`<span class="tag">${esc(s)}</span>`).join(' ')}</td></tr>
        </tbody>
      </table>`;
  }

  function sentinelBody() {
    return `
      <div class="card card-body">
        <div class="alert-section-title">Related Sentinel events</div>
        <p class="muted">SigninLogs / IdentityLogonEvents / IdentityDirectoryEvents associated with ${esc(i.displayName)}.</p>
        <button class="btn btn-primary btn-sm" onclick="navigate('#/sentinel/incidents')">Open related Sentinel incident</button>
      </div>`;
  }

  const bodies = {
    overview: overviewBody, incidents: incidentsBody, timeline: timelineBody,
    assets: assetsBody, lmp: lmpBody, directory: directoryBody, sentinel: sentinelBody,
  };
  const body = (bodies[tab] || overviewBody)();

  return `
    <div class="dev-crumbs">
      <a onclick="navigate('#/defender/identities')">Identity inventory</a>
      <span>›</span>
      <a>${esc(i.displayName)}</a>
    </div>
    <header class="dev-header">
      <div class="dev-id">
        <div class="dev-id-icon" title="Identity">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
            <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 1.5c-3.6 0-8 1.8-8 5.5V21h16v-2c0-3.7-4.4-5.5-8-5.5Z"/>
          </svg>
        </div>
        <div>
          <div class="dev-id-name">${esc(i.displayName)}</div>
          <div class="dev-badges">
            <span class="dev-badge"><span class="dev-block" style="background:${riskColor}"></span> ${esc(i.riskLevel)}</span>
            <span class="dev-badge"><span class="dev-dot" style="background:#107c10"></span> ${esc(i.accountType)}</span>
            ${i.sensitive ? '<span class="dev-tag">Sensitive</span>' : ''}
            ${i.privileged ? '<span class="dev-tag">Privileged</span>' : ''}
            ${i.sources.map(s=>`<span class="dev-tag">${esc(s)}</span>`).join(' ')}
          </div>
        </div>
      </div>
      <div class="dev-header-actions">
        <button class="dev-action" onclick="toast('Sign-in activity opened (lab stub).')">Sign-in activity</button>
        <button class="dev-action" onclick="toast('Revoke sessions (lab stub).')">Revoke sessions</button>
        <button class="dev-action" onclick="toast('Reset password (lab stub).')">Reset password</button>
        <button class="dev-action" onclick="toast('Confirm compromise (lab stub).')">Confirm compromise</button>
        <button class="dev-action">⋯</button>
      </div>
    </header>
    <nav class="tabs dev-tabs" aria-label="Identity tabs">
      ${IDENTITY_TABS.map(tabBtn).join('')}
    </nav>
    <div class="dev-content">
      <aside class="dev-rail">
        <div class="alert-section-title">Identity details</div>
        <div class="dev-rail-grid">
          <div><div class="dev-rail-label">Display name</div><div class="dev-rail-value">${esc(i.displayName)}</div></div>
          <div><div class="dev-rail-label">SAM name</div><div class="dev-rail-value">${esc(i.samName)}</div></div>
          <div><div class="dev-rail-label">UPN</div><div class="dev-rail-value">${esc(i.upn)}</div></div>
          <div><div class="dev-rail-label">Type</div><div class="dev-rail-value">${esc(i.accountType)}</div></div>
          <div><div class="dev-rail-label">Department</div><div class="dev-rail-value">${esc(i.department)}</div></div>
          <div><div class="dev-rail-label">Title</div><div class="dev-rail-value">${esc(i.title)}</div></div>
          <div><div class="dev-rail-label">Risk level</div><div class="dev-rail-value">${esc(i.riskLevel)}</div></div>
          <div><div class="dev-rail-label">Sensitive</div><div class="dev-rail-value">${i.sensitive?'Yes':'No'}</div></div>
          <div><div class="dev-rail-label">Privileged</div><div class="dev-rail-value">${i.privileged?'Yes':'No'}</div></div>
          <div><div class="dev-rail-label">Devices observed</div><div class="dev-rail-value">${i.devicesSeen}</div></div>
          <div><div class="dev-rail-label">First seen</div><div class="dev-rail-value">${fmtTime(i.firstSeen)}</div></div>
          <div><div class="dev-rail-label">Last seen</div><div class="dev-rail-value">${fmtTime(i.lastSeen)}</div></div>
          <div><div class="dev-rail-label">SID</div><div class="dev-rail-value" style="font-size:11px;">${esc(i.sid)}</div></div>
          <div><div class="dev-rail-label">Sources</div><div class="dev-rail-value">${i.sources.join(', ')}</div></div>
        </div>
      </aside>
      <section class="dev-main">${body}</section>
    </div>
  `;
};

VIEWS['defender/suppression'] = () => {
  return `
    <div class="page-header">
      <div><div class="breadcrumb">Configuration › <strong>Suppression rules</strong></div><h1>Suppression rules</h1></div>
      <div class="page-actions"><button class="btn btn-primary" onclick="openRulePanel()">+ Create rule</button></div>
    </div>
    <div class="callout">
      Suppression rules apply when <strong>every</strong> condition matches (logical AND).
      Use stable indicators (signing cert, install path) over volatile ones (file hash) when you can.
    </div>
    <div class="card">
      <div class="card-toolbar"><strong>${rules.length}</strong> rules</div>
      <table class="grid">
        <thead><tr><th>Status</th><th>Rule name</th><th>Scope</th><th>Conditions</th><th>Created</th><th></th></tr></thead>
        <tbody>
          ${rules.map(r => {
            const summary = r.conditions.map(c =>
              `${fieldLabel(c.field)} = ${c.field === 'sha256' ? c.value.slice(0,12) + '…' : c.value}`
            ).join(' AND ');
            return `<tr>
              <td><span class="status-dot ${r.enabled !== false ? 'resolved' : ''}"></span>${r.enabled !== false ? 'Enabled' : 'Disabled'}</td>
              <td><strong>${esc(r.name)}</strong></td>
              <td>${esc(r.scope || 'All devices')}</td>
              <td class="kv">${esc(summary)}</td>
              <td>${fmtTime(r.createdAt)}</td>
              <td><button class="btn btn-ghost btn-sm" onclick="deleteRule('${r.id}')">Delete</button></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
};

// ====================================================================
// SENTINEL
// ====================================================================
VIEWS['sentinel/home'] = () => `
  <div class="page-header"><div><div class="breadcrumb">Microsoft Sentinel › <strong>Overview</strong></div><h1>Overview</h1></div></div>
  <div class="kpi-strip">
    <div class="kpi"><span class="kpi-label">Events received (24h)</span><span class="kpi-value">4.2M</span><span class="kpi-delta">▲ 6%</span></div>
    <div class="kpi"><span class="kpi-label">Open incidents</span><span class="kpi-value">${INCIDENTS.length}</span></div>
    <div class="kpi"><span class="kpi-label">Active analytics rules</span><span class="kpi-value">${SENTINEL_RULES.filter(r=>r.enabled).length}</span></div>
    <div class="kpi"><span class="kpi-label">Playbooks</span><span class="kpi-value">11</span></div>
  </div>
  <div class="two-col">
    <div class="card">
      <div class="card-toolbar"><strong>Recent incidents</strong><a class="chip-link" href="#/sentinel/incidents">View all →</a></div>
      <table class="grid"><thead><tr><th>Severity</th><th>Title</th><th>Tactics</th></tr></thead>
      <tbody>${INCIDENTS.slice(0,4).map(i => `
        <tr onclick="openIncident('${i.id}')">
          <td><span class="sev ${i.severity}">${cap(i.severity)}</span></td>
          <td><strong>${esc(i.title)}</strong></td>
          <td>${i.tactics.map(t=>`<span class="mitre">${esc(t)}</span>`).join('')}</td>
        </tr>`).join('')}</tbody></table>
    </div>
    <div class="card card-body">
      <div class="alert-section-title">Data connectors</div>
      <div style="font-size:13px; line-height:1.9;">
        <div><span class="status-dot resolved"></span>Microsoft Defender XDR — Streaming</div>
        <div><span class="status-dot resolved"></span>Azure Activity — Streaming</div>
        <div><span class="status-dot resolved"></span>Microsoft Entra ID — Streaming</div>
        <div><span class="status-dot warn"></span>AWS CloudTrail — Health degraded</div>
        <div><span class="status-dot resolved"></span>Office 365 — Streaming</div>
      </div>
    </div>
  </div>
  <div class="card" style="margin-top:16px;">
    <div class="card-toolbar">
      <strong>Home lab path: IOC to MITRE coverage</strong>
      <a class="chip-link" href="#/sentinel/threat-intel">Open threat intelligence →</a>
    </div>
    <div class="flowline">
      ${SENTINEL_LAB_FLOW.map(step => `
        <div class="flow-step">
          <strong>${esc(step.title)}</strong>
          <span>${esc(step.detail)}</span>
        </div>
      `).join('')}
    </div>
  </div>
`;

VIEWS['sentinel/incidents'] = () => `
  <div class="page-header">
    <div>
      <div class="breadcrumb">Microsoft Sentinel › Threat management › <strong>Incidents</strong></div>
      <h1>Sentinel incidents</h1>
      <div class="page-subtitle">Sentinel queue with Defender XDR unified-response context, ownership, evidence, and cross-product pivots.</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="navigate('#/defender/incidents')">Open Defender XDR queue</button>
      <button class="btn btn-primary" onclick="navigate('#/sentinel/graph')">Open Sentinel Graph</button>
    </div>
  </div>
  <div class="callout info">
    <strong>Unified response lens:</strong> Sentinel incidents can be investigated from Defender XDR when Microsoft security signals are connected.
    Keep Sentinel analytics, automation, bookmarks, and Graph context visible while using Defender XDR for the unified incident story and response actions.
  </div>
  <div class="card" style="margin-top:16px;">
    <div class="card-toolbar"><strong>${INCIDENTS.length}</strong> incidents<span class="muted">Mapped to Defender XDR incident IDs for this lab</span></div>
    <table class="grid">
      <thead><tr><th>Severity</th><th>Sentinel incident</th><th>Provider</th><th>Analytics / source</th><th>Unified lens</th><th>Action</th></tr></thead>
      <tbody>${INCIDENTS.map(i => {
        const sources = (typeof alerts !== 'undefined' ? alerts : SEED_ALERTS).filter(a => i.alertIds.includes(a.id)).map(a => a.detectionSource);
        const uniqueSources = [...new Set(sources)];
        return `
          <tr onclick="openIncident('${esc(i.id)}')">
            <td><span class="sev ${i.severity}">${cap(i.severity)}</span></td>
            <td><strong>${esc(i.title)}</strong><br><span class="muted">${esc(i.id)} · ${i.alertCount} alert(s)</span></td>
            <td>${uniqueSources.map(s=>`<span class="tag">${esc(s)}</span>`).join('') || '<span class="tag">Sentinel</span>'}</td>
            <td>${i.tactics.map(t=>`<span class="mitre">${esc(t)}</span>`).join('')}</td>
            <td>
              <div class="mini-step">Defender incident page preserves attack story, evidence, and response actions.</div>
              ${i.id === SENTINEL_GRAPH.incidentId ? '<div class="mini-step">Sentinel Graph fixture available for entity relationship analysis.</div>' : ''}
            </td>
            <td>
              <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); openIncidentPage('${esc(i.id)}')">Open in Defender XDR</button>
              ${i.id === SENTINEL_GRAPH.incidentId ? `<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); navigate('#/sentinel/graph')">Graph</button>` : ''}
            </td>
          </tr>`;
      }).join('')}</tbody>
    </table>
  </div>
`;

VIEWS['sentinel/graph'] = () => {
  const inc = INCIDENTS.find(i => i.id === SENTINEL_GRAPH.incidentId) || INCIDENTS[0];
  const positions = [
    { x:50, y:46 }, { x:18, y:22 }, { x:82, y:22 }, { x:20, y:75 }, { x:82, y:75 },
  ];
  const layout = SENTINEL_GRAPH.nodes.reduce((map, node, index) => {
    map[node.id] = positions[index] || { x:50, y:50 };
    return map;
  }, {});
  return `
    <div class="page-header">
      <div>
        <div class="breadcrumb">Microsoft Sentinel › Threat management › <strong>Sentinel Graph</strong></div>
        <h1>Entity relationship analysis</h1>
        <div class="page-subtitle">Dedicated Sentinel Graph view for ${esc(SENTINEL_GRAPH.incidentId)} using the existing node and edge fixtures.</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="openIncident('${esc(inc.id)}')">Open incident preview</button>
        <button class="btn btn-primary" onclick="openIncidentPage('${esc(inc.id)}')">Open in Defender XDR</button>
      </div>
    </div>
    <div class="sentinel-graph-layout">
      <section class="card sentinel-graph-card">
        <div class="card-toolbar">
          <strong>${esc(inc.title)}</strong>
          <span class="muted">${SENTINEL_GRAPH.nodes.length} nodes · ${SENTINEL_GRAPH.edges.length} edges</span>
        </div>
        <div class="sentinel-graph-canvas">
          <svg class="sentinel-graph-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            ${SENTINEL_GRAPH.edges.map(edge => {
              const from = layout[edge.from];
              const to = layout[edge.to];
              return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" />`;
            }).join('')}
          </svg>
          ${SENTINEL_GRAPH.edges.map(edge => {
            const from = layout[edge.from];
            const to = layout[edge.to];
            return `<div class="sentinel-edge-label" style="left:${(from.x + to.x) / 2}%; top:${(from.y + to.y) / 2}%;">${esc(edge.label)}</div>`;
          }).join('')}
          ${SENTINEL_GRAPH.nodes.map(node => {
            const p = layout[node.id];
            return `
              <button class="sentinel-graph-node risk-${esc(node.risk)}" style="left:${p.x}%; top:${p.y}%;" onclick="toast('Graph node selected: ${esc(node.label)}')">
                <span>${esc(node.type)}</span>
                <strong>${esc(node.label)}</strong>
              </button>`;
          }).join('')}
        </div>
      </section>
      <aside class="card card-body">
        <div class="alert-section-title">Investigation pivots</div>
        <div class="response-flow">
          <div><strong>User to URL</strong><span>Validate click evidence and sign-in timing.</span></div>
          <div><strong>User to app</strong><span>Review consent grant scopes and publisher trust.</span></div>
          <div><strong>IP to user</strong><span>Compare source address with sign-in baseline.</span></div>
          <div><strong>App to mailbox</strong><span>Scope Mail.ReadWrite access and possible collection.</span></div>
        </div>
        <div class="alert-section-title">Recommended response</div>
        <ul class="compact-list">
          <li>Revoke DocViewer Pro consent and block the app tenant-wide.</li>
          <li>Revoke Jane Doe sessions and require credential recovery.</li>
          <li>Attach Graph relationship notes to CASE-2406-1042.</li>
          <li>Promote recurring CloudAppEvents query into Sentinel analytics.</li>
        </ul>
      </aside>
    </div>
  `;
};

VIEWS['sentinel/analytics'] = () => {
  const ws = currentWorkspace();
  const idxs = ws.ruleIdx;
  return `
  <div class="page-header">
    <div>
      <div class="breadcrumb">Configuration › <strong>Analytics</strong></div>
      <h1>Analytics rules</h1>
    </div>
    <div class="page-actions"><button class="btn btn-primary" onclick="openAnalyticsWizard()">+ Create analytics rule</button></div>
  </div>

  <div class="callout info" style="margin-bottom:14px;">
    <strong>Access path (per Microsoft Learn):</strong>
    <span class="muted">Defender portal</span> → Microsoft Sentinel → Configuration → <strong>Analytics</strong>,
    or <span class="muted">Azure portal</span> → Microsoft Sentinel → select workspace → <strong>Analytics</strong>.
    Sentinel moves fully to the Defender portal after March 31, 2027.
  </div>

  <div class="workspace-bar">
    <span class="workspace-label">Workspace</span>
    <select class="ipt workspace-select" onchange="setWorkspace(this.value)">
      ${SENTINEL_WORKSPACES.map(w => `
        <option value="${w.id}" ${w.id===ws.id?'selected':''}>${esc(w.name)} · ${esc(w.region)} · ${esc(w.tier)}</option>`).join('')}
    </select>
  </div>

  <div class="card">
    <div class="card-toolbar"><strong>${idxs.length}</strong> rules · <span class="muted">workspace: ${esc(ws.name)}</span></div>
    <table class="grid">
      <thead><tr><th>Status</th><th>Severity</th><th>Name</th><th>Rule type</th><th>Tactics</th><th>Frequency</th></tr></thead>
      <tbody>
        ${idxs.map(i => {
          const r = SENTINEL_RULES[i];
          return `
          <tr onclick="openSentinelRule(${i})">
            <td><span class="status-dot ${r.enabled?'resolved':''}"></span>${r.enabled?'Enabled':'Disabled'}</td>
            <td><span class="sev ${r.severity}">${cap(r.severity)}</span></td>
            <td><strong>${esc(r.name)}</strong></td>
            <td><span class="tag">${esc(r.type || 'Scheduled')}</span></td>
            <td>${r.tactics.map(t=>`<span class="mitre">${esc(t)}</span>`).join('')}</td>
            <td>${esc(r.frequency)}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>
  <div id="rule-preview"></div>
  `;
};

VIEWS['sentinel/anomalies'] = () => `
  <div class="page-header">
    <div>
      <div class="breadcrumb">Threat management › <strong>Anomalies</strong></div>
      <h1>Sentinel anomalies</h1>
      <div class="page-subtitle">Customize anomaly rules, decide when they create incidents, and use anomaly rows as hunting pivots.</div>
    </div>
    <div class="page-actions">
      <a class="btn btn-secondary" href="#/sentinel/hunting">Open hunting</a>
      <a class="btn btn-primary" href="#/sentinel/analytics">Analytics rules</a>
    </div>
  </div>

  <div class="callout info" style="margin-bottom:14px;">
    <strong>Detection engineering cue:</strong>
    <span>Anomalies are not just dashboards. Use them as hunting leads, incident enrichment, or inputs to analytics/Fusion logic after tuning thresholds and exclusions.</span>
  </div>

  <div class="three-col">
    <div class="kpi"><span class="kpi-label">Enabled anomaly rules</span><span class="kpi-value">${SENTINEL_ANOMALY_RULES.filter(r=>r.status==='Enabled').length}</span><span class="kpi-delta">1 high-confidence incident path</span></div>
    <div class="kpi"><span class="kpi-label">Hunting rows today</span><span class="kpi-value">${SENTINEL_ANOMALY_HUNTING_ROWS.length}</span><span class="kpi-delta">Scores above tuned thresholds</span></div>
    <div class="kpi"><span class="kpi-label">Customization focus</span><span class="kpi-value">4</span><span class="kpi-delta">Thresholds, scope, exclusions, incident creation</span></div>
  </div>

  <div class="card" style="margin-top:16px;">
    <div class="card-toolbar"><strong>Customizable anomaly rules</strong><span class="muted">Lab-static settings</span></div>
    <div class="anomaly-rule-grid">
      ${SENTINEL_ANOMALY_RULES.map(rule => `
        <div class="anomaly-rule-card">
          <div class="card-toolbar" style="padding:0 0 8px; border-bottom:0;">
            <strong>${esc(rule.name)}</strong>
            <span><span class="status-dot ${rule.status==='Enabled'?'resolved':''}"></span>${esc(rule.status)}</span>
          </div>
          <div><span class="sev ${rule.severity}">${cap(rule.severity)}</span> <span class="tag">${esc(rule.source)}</span></div>
          <div class="alert-section-title">Threshold</div>
          <p class="muted">${esc(rule.threshold)}</p>
          <div class="alert-section-title">Tactics</div>
          <div>${rule.tactics.map(t => `<span class="mitre">${esc(t)}</span>`).join('')}</div>
          <div class="alert-section-title">Customization</div>
          <p class="muted">${esc(rule.customization)}</p>
          <div class="alert-section-title">Feeds hunting and detections</div>
          <p class="muted">${esc(rule.feeds)}</p>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="two-col" style="margin-top:16px;">
    <div class="card">
      <div class="card-toolbar"><strong>Anomaly hunting feed</strong><span class="muted">Example rows analysts pivot from</span></div>
      <table class="grid">
        <thead><tr><th>Time</th><th>Rule</th><th>Entity</th><th>Score</th><th>Related table</th><th>Action</th></tr></thead>
        <tbody>
          ${SENTINEL_ANOMALY_HUNTING_ROWS.map(row => `
            <tr>
              <td>${fmtTime(row.TimeGenerated)}</td>
              <td><strong>${esc(row.AnomalyRule)}</strong></td>
              <td>${esc(row.Entity)}</td>
              <td>${esc(row.Score)}</td>
              <td><code>${esc(row.RelatedTable)}</code></td>
              <td>${esc(row.Action)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div class="card card-body">
      <div class="alert-section-title">Operational pattern</div>
      <ol class="study-steps">
        <li>Start with anomalies in hunting mode so analysts can review score quality.</li>
        <li>Tune thresholds, scopes, and known-good exclusions until the row volume is useful.</li>
        <li>Promote high-confidence combinations to analytics rules or Fusion-driven incidents.</li>
        <li>Keep lower-confidence anomalies as entity enrichment and graph pivots.</li>
      </ol>
      <div class="alert-section-title">KQL pivot</div>
      <textarea class="kql" readonly>${esc(`BehaviorAnalytics
| where ActivityType has "Anomaly"
| where Score >= 0.8
| project TimeGenerated, UserPrincipalName, DevicesInsights, SourceIPAddress, Score`)}</textarea>
    </div>
  </div>
`;

function renderSyslogAmaProgress(state) {
  const completed = {
    solution: state.solutionInstalled,
    connector: state.connectorOpened,
    dcr: state.dcrCreated,
    daemon: state.daemonConfigured,
    verify: state.verified,
  };
  return `
    <div class="syslog-progress">
      ${SYSLOG_AMA_LAB.steps.map((step, idx) => `
        <div class="syslog-step ${completed[step.id] ? 'complete' : ''}">
          <div class="syslog-step-index">${idx + 1}</div>
          <div>
            <strong>${esc(step.title)}</strong>
            <span>${esc(step.detail)}</span>
            ${step.correctFirst ? '<small>Correct first action for the practice question.</small>' : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderSyslogAmaExamCard(state) {
  const canCreateDcr = state.solutionInstalled && state.connectorOpened;
  const canConfigureDaemon = state.dcrCreated;
  const canVerify = state.daemonConfigured;
  return `
    <div class="card syslog-lab-card">
      <div class="card-toolbar">
        <strong>Practice lab: Syslog via AMA first step</strong>
        <button class="btn btn-ghost btn-sm" onclick="resetSyslogAmaLab()">Reset</button>
      </div>
      <div class="syslog-lab-body">
        <section>
          <div class="alert-section-title">Scenario</div>
          <p class="muted">${esc(SYSLOG_AMA_LAB.examPrompt)}</p>
          <div class="connector-list">
            <div><strong>Workspace</strong><span>${esc(SYSLOG_AMA_LAB.workspace)}</span></div>
            <div><strong>Forwarder</strong><span>${esc(SYSLOG_AMA_LAB.vm)} · ${esc(SYSLOG_AMA_LAB.os)} · receives appliance Syslog</span></div>
            <div><strong>Target table</strong><span>Syslog</span></div>
          </div>
        </section>
        <section>
          <div class="alert-section-title">Do this in order</div>
          <div class="syslog-action-stack">
            <button class="btn btn-primary" onclick="installSentinelSolution('syslog')">Install Syslog solution from Content hub</button>
            <button class="btn btn-secondary" ${state.solutionInstalled ? '' : 'disabled'} onclick="openSyslogAmaConnector()">Open Syslog via AMA connector</button>
            <button class="btn btn-secondary" ${canCreateDcr ? '' : 'disabled'} onclick="createSyslogAmaDcr()">Create DCR and select VM1</button>
            <button class="btn btn-secondary" ${canConfigureDaemon ? '' : 'disabled'} onclick="configureSyslogDaemon()">Configure rsyslog on VM1</button>
            <button class="btn btn-secondary" ${canVerify ? '' : 'disabled'} onclick="verifySyslogIngestion()">Verify Syslog table</button>
          </div>
        </section>
      </div>
      ${renderSyslogAmaProgress(state)}
    </div>

    <div class="two-col" style="margin-top:16px;">
      <div class="card card-body">
        <div class="alert-section-title">Why the first step matters</div>
        <p class="muted">The connector is delivered by the Syslog solution. Until that solution is installed from Content hub, the correct Sentinel connector workflow is not available.</p>
        <p class="muted">After that, use the connector page to create the DCR. Selecting ${esc(SYSLOG_AMA_LAB.vm)} there deploys Azure Monitor Agent automatically.</p>
        ${state.verified ? `
          <div class="card-toolbar" style="padding:0 0 8px; border-bottom:0;">
            <strong>Verification query</strong>
            <button class="btn btn-ghost btn-sm" onclick="copyToClipboard('syslog-ama-query')">Copy</button>
          </div>
          <textarea id="syslog-ama-query" class="kql" readonly>${esc(SYSLOG_AMA_LAB.query)}</textarea>
        ` : ''}
      </div>
      <div class="card card-body">
        <div class="alert-section-title">Exam distractors</div>
        <div class="connector-list">
          ${SYSLOG_AMA_LAB.distractors.map(d => `
            <div><strong>${esc(d.title)}</strong><span>${esc(d.why)}</span></div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function ingestionStepComplete(state, stepId) {
  return {
    solution: state.solutionInstalled,
    connector: state.connectorOpened,
    dcr: state.dcrCreated,
    scope: state.scoped,
    daemon: state.daemonConfigured,
    policy: state.policyConfigured,
    diagnostic: state.diagnosticConfigured,
    app: state.appRegistered,
    role: state.roleAssigned,
    endpoint: state.endpointChosen,
    stream: state.streamDeclared,
    table: state.tableCreated,
    verify: state.verified,
  }[stepId];
}

function ingestionStepButton(lab, step) {
  const id = esc(lab.id);
  const label = esc(step.title);
  if (step.id === 'solution') {
    return `<button class="btn btn-secondary" onclick="installSentinelIngestionSolution('${id}')">${label}</button>`;
  }
  if (step.id === 'connector') {
    return `<button class="btn btn-secondary" onclick="openSentinelIngestionConnector('${id}')">${label}</button>`;
  }
  return `<button class="btn btn-secondary" onclick="advanceSentinelIngestionLab('${id}','${esc(step.id)}')">${label}</button>`;
}

function renderSentinelIngestionLabCard(lab) {
  const state = currentSentinelIngestionState(lab.id);
  return `
    <div class="card syslog-lab-card">
      <div class="card-toolbar">
        <strong>${esc(lab.title)}</strong>
        <button class="btn btn-ghost btn-sm" onclick="resetSentinelIngestionLab('${esc(lab.id)}')">Reset</button>
      </div>
      <div class="syslog-lab-body">
        <section>
          <div class="alert-section-title">Scenario</div>
          <p class="muted">${esc(lab.prompt)}</p>
          <div class="connector-list">
            <div><strong>Workspace</strong><span>${esc(lab.workspace)}</span></div>
            <div><strong>Target</strong><span>${esc(lab.target)}</span></div>
            <div><strong>Connector</strong><span>${esc(lab.connector)}</span></div>
            <div><strong>Target table</strong><span>${esc(lab.table)}</span></div>
          </div>
        </section>
        <section>
          <div class="alert-section-title">Do this in order</div>
          <div class="syslog-action-stack">
            ${lab.steps.map(step => ingestionStepButton(lab, step)).join('')}
          </div>
        </section>
      </div>
      <div class="syslog-progress">
        ${lab.steps.map((step, idx) => `
          <div class="syslog-step ${ingestionStepComplete(state, step.id) ? 'complete' : ''}">
            <div class="syslog-step-index">${idx + 1}</div>
            <div>
              <strong>${esc(step.title)}</strong>
              <span>${esc(step.detail)}</span>
            </div>
          </div>
        `).join('')}
      </div>
      ${state.verified ? `
        <div class="card-body" style="border-top:1px solid var(--border);">
          <div class="card-toolbar" style="padding:0 0 8px; border-bottom:0;">
            <strong>Verification query</strong>
            <button class="btn btn-ghost btn-sm" onclick="copyToClipboard('ingestion-query-${esc(lab.id)}')">Copy</button>
          </div>
          <textarea id="ingestion-query-${esc(lab.id)}" class="kql" readonly>${esc(lab.query)}</textarea>
        </div>
      ` : ''}
    </div>
  `;
}

function renderWefPlanningCard() {
  return `
    <div class="card card-body">
      <div class="alert-section-title">${esc(WEF_PLANNING_CARD.title)}</div>
      <div class="two-col">
        <div>
          <strong>Use WEF when</strong>
          <p class="muted">${esc(WEF_PLANNING_CARD.useWef)}</p>
        </div>
        <div>
          <strong>Use AMA when</strong>
          <p class="muted">${esc(WEF_PLANNING_CARD.useAma)}</p>
        </div>
      </div>
      <div class="callout info" style="margin:10px 0;">
        <strong>Exam cue:</strong> ${esc(WEF_PLANNING_CARD.examCue)}
      </div>
      <div class="connector-list">
        ${WEF_PLANNING_CARD.checklist.map(item => `<div><strong>Decision point</strong><span>${esc(item)}</span></div>`).join('')}
      </div>
    </div>
  `;
}

VIEWS['sentinel/content-hub'] = () => {
  const state = currentSyslogAmaState();
  const solutions = SENTINEL_CONTENT_SOLUTIONS.map(s => {
    const labState = currentSentinelIngestionState(s.id);
    if (s.id === 'syslog' && state.solutionInstalled) return { ...s, status:'Installed' };
    if (labState.solutionInstalled) return { ...s, status:'Installed' };
    return s;
  });
  return `
    <div class="page-header">
      <div>
        <div class="breadcrumb">Content management › <strong>Content hub</strong></div>
        <h1>Content hub</h1>
        <div class="page-subtitle">Install Microsoft Sentinel solution packages before configuring solution-backed connectors.</div>
      </div>
      <div class="page-actions">
        <a class="btn btn-secondary" href="#/sentinel/data-connectors">Data connectors</a>
      </div>
    </div>

    <div class="callout info" style="margin-bottom:14px;">
      <strong>Syslog via AMA sequence:</strong>
      install the <strong>Syslog</strong> solution here first, then open Data connectors and create the DCR from the Syslog via AMA connector page.
    </div>
    <div class="callout info" style="margin-bottom:14px;">
      <strong>DCR family:</strong>
      Windows Security Events, CEF, Azure Activity, and custom Logs Ingestion API labs are built as local-only practice flows below. No real Azure or Graph calls are made.
    </div>

    <div class="solution-grid sentinel-content-grid">
      ${solutions.map(s => `
        <button class="solution-card" onclick="${
          s.id === 'syslog' ? "installSentinelSolution('syslog')" :
          SENTINEL_INGESTION_LABS.some(l => l.solutionId === s.id) ? `installSentinelIngestionSolution('${esc(s.id)}')` :
          "toast('Solution opened in lab stub.')"
        }">
          <strong>${esc(s.name)}</strong>
          <span>${esc(s.provider)} · ${esc(s.status)}</span>
          <span>${esc(s.use)}</span>
          <span class="kv">${esc(s.connectors.join(', '))}</span>
        </button>
      `).join('')}
    </div>

    ${renderSyslogAmaExamCard(state)}
    <div style="display:grid; gap:16px; margin-top:16px;">
      ${SENTINEL_INGESTION_LABS
        .filter(l => ['windows-security','cef'].includes(l.id))
        .map(renderSentinelIngestionLabCard).join('')}
    </div>
  `;
};

VIEWS['sentinel/data-connectors'] = () => `
  <div class="page-header">
    <div>
      <div class="breadcrumb">Configuration › <strong>Data connectors</strong></div>
      <h1>Data connectors</h1>
      <div class="page-subtitle">Use connectors for events and threat indicators. Solution-backed connectors may require Content hub installation first.</div>
    </div>
    <div class="page-actions">
      <a class="btn btn-secondary" href="#/sentinel/content-hub">Content hub</a>
    </div>
  </div>
  <div class="callout warn" style="margin-bottom:14px;">
    <strong>No MITRE connector:</strong>
    Sentinel MITRE coverage lights up from active scheduled or NRT analytics rules and their assigned tactics or techniques.
  </div>
  ${renderSyslogAmaExamCard(currentSyslogAmaState())}
  <div style="display:grid; gap:16px; margin-bottom:16px;">
    ${SENTINEL_INGESTION_LABS.map(renderSentinelIngestionLabCard).join('')}
    ${renderWefPlanningCard()}
  </div>
  <div class="card">
    <div class="card-toolbar"><strong>${SENTINEL_DATA_CONNECTORS.length}</strong> connectors and views</div>
    <table class="grid">
      <thead><tr><th>Status</th><th>Name</th><th>Type</th><th>Table or source</th><th>Lab use</th></tr></thead>
      <tbody>
        ${SENTINEL_DATA_CONNECTORS.map(c => {
          const syslogState = currentSyslogAmaState();
          const lab = SENTINEL_INGESTION_LABS.find(l => l.connector === c.name);
          const labState = lab ? currentSentinelIngestionState(lab.id) : null;
          const status = c.name === 'Syslog via AMA' && syslogState.solutionInstalled
            ? (syslogState.dcrCreated ? 'Connected' : 'Available')
            : labState && labState.solutionInstalled
              ? (labState.verified ? 'Connected' : 'Available')
            : c.status;
          const statusClass = status === 'Connected' ? 'resolved' : status === 'Not a connector' ? 'warn' : '';
          return `
            <tr>
              <td><span class="status-dot ${statusClass}"></span>${esc(status)}</td>
              <td><strong>${esc(c.name)}</strong></td>
              <td>${esc(c.type)}</td>
              <td class="kv">${esc(c.table)}</td>
              <td>${esc(c.use)}</td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>
`;

VIEWS['sentinel/threat-intel'] = () => `
  <div class="page-header">
    <div>
      <div class="breadcrumb">Threat management › <strong>Threat intelligence</strong></div>
      <h1>Threat intelligence</h1>
      <div class="page-subtitle">Import indicators, verify ThreatIntelIndicators, then map IOCs to events with analytics rules.</div>
    </div>
    <div class="page-actions">
      <a class="btn btn-secondary" href="#/sentinel/data-connectors">Data connectors</a>
      <a class="btn btn-primary" href="#/sentinel/analytics">Analytics rules</a>
    </div>
  </div>

  <div class="two-col">
    <div class="card card-body">
      <div class="alert-section-title">Import options</div>
      <div class="connector-list">
        <div><strong>Defender Threat Intelligence</strong><span>Best when available in the tenant. Imports Microsoft-generated IOCs.</span></div>
        <div><strong>Threat Intelligence - TAXII</strong><span>Use when you have a TAXII API root and collection ID.</span></div>
        <div><strong>Manual CSV/JSON import</strong><span>Best for this local lab. Use harmless demo values.</span></div>
      </div>
    </div>
    <div class="card card-body">
      <div class="card-toolbar" style="padding:0 0 8px; border-bottom:0;">
        <strong>Manual import CSV</strong>
        <button class="btn btn-ghost btn-sm" onclick="copyToClipboard('ti-import-csv')">Copy</button>
      </div>
      <textarea id="ti-import-csv" class="kql" readonly>${esc(TI_IMPORT_CSV)}</textarea>
    </div>
  </div>

  <div class="card" style="margin-top:16px;">
    <div class="card-toolbar"><strong>ThreatIntelIndicators</strong><span class="muted">Demo rows imported in the lab</span></div>
    <table class="grid">
      <thead><tr><th>Generated</th><th>ObservableKey</th><th>ObservableValue</th><th>Confidence</th><th>Tags</th><th>Source</th><th>Valid until</th></tr></thead>
      <tbody>
        ${THREAT_INTEL_INDICATORS.map(i => `
          <tr>
            <td>${fmtTime(i.TimeGenerated)}</td>
            <td class="kv">${esc(i.ObservableKey)}</td>
            <td class="kv">${esc(i.ObservableValue)}</td>
            <td>${i.Confidence}</td>
            <td>${i.Tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</td>
            <td>${esc(i.SourceSystem)}</td>
            <td>${i.ValidUntil ? fmtTime(i.ValidUntil) : '<span class="muted">Open ended</span>'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="card card-body" style="margin-top:16px;">
    <div class="card-toolbar" style="padding:0 0 8px; border-bottom:0;">
      <strong>KQL check</strong>
      <button class="btn btn-ghost btn-sm" onclick="copyToClipboard('ti-check-kql')">Copy</button>
    </div>
    <textarea id="ti-check-kql" class="kql" readonly>ThreatIntelIndicators
| where TimeGenerated > ago(24h)
| project TimeGenerated, ObservableKey, ObservableValue, Confidence, Tags, SourceSystem, ValidUntil</textarea>
  </div>
`;

VIEWS['sentinel/mitre'] = () => {
  // Index rule coverage by tactic name and technique id.
  const tacticCoverage = {};   // { tacticName: [rule, ...] }
  const techCoverage   = {};   // { techniqueId: [rule, ...] }
  SENTINEL_RULES.forEach(rule => {
    (rule.tactics || []).forEach(t => {
      if (!rule.enabled) return;
      (tacticCoverage[t] = tacticCoverage[t] || []).push(rule);
    });
    (rule.techniques || []).forEach(tid => {
      if (!rule.enabled) return;
      (techCoverage[tid] = techCoverage[tid] || []).push(rule);
    });
  });

  const coveredTacticCount = MITRE_ATTCK.filter(t => tacticCoverage[t.name]).length;
  const mappedTechCount = Object.keys(techCoverage).length;

  const rows = SENTINEL_RULES.flatMap(rule =>
    rule.tactics.map(tactic => ({ rule, tactic, techniques: rule.techniques || [] }))
  );

  return `
    <div class="page-header">
      <div>
        <div class="breadcrumb">Threat management › <strong>MITRE ATT&CK</strong></div>
        <h1>MITRE ATT&CK coverage</h1>
        <div class="page-subtitle">Coverage reflects active analytics rules and their selected tactics or techniques.</div>
      </div>
      <div style="display:flex; gap:8px; align-items:center;">
        <span class="legend-swatch" style="background:#0078d4;"></span><span class="muted" style="font-size:12px;">Technique covered</span>
        <span class="legend-swatch" style="background:#7fb5e6; margin-left:10px;"></span><span class="muted" style="font-size:12px;">Tactic only</span>
        <span class="legend-swatch" style="background:#1f2937; margin-left:10px;"></span><span class="muted" style="font-size:12px;">No coverage</span>
      </div>
    </div>
    <div class="callout info" style="margin-bottom:14px;">
      <strong>Coverage view:</strong>
      This page does not ingest ATT&CK data. Assign MITRE tactics and techniques on scheduled or NRT analytics rules to light up the matrix.
    </div>
    <div class="kpi-strip">
      <div class="kpi"><span class="kpi-label">Enabled mapped rules</span><span class="kpi-value">${SENTINEL_RULES.filter(r=>r.enabled && r.tactics.length).length}</span></div>
      <div class="kpi"><span class="kpi-label">Covered tactics</span><span class="kpi-value">${coveredTacticCount} / ${MITRE_ATTCK.length}</span></div>
      <div class="kpi"><span class="kpi-label">Mapped techniques</span><span class="kpi-value">${mappedTechCount}</span></div>
      <div class="kpi"><span class="kpi-label">IOC lab rule</span><span class="kpi-value">1</span></div>
    </div>

    <div class="card">
      <div class="card-toolbar">
        <strong>ATT&CK Enterprise matrix</strong>
        <span class="muted" style="font-size:12px;">Scroll horizontally · ${MITRE_ATTCK.length} tactics · ${MITRE_ATTCK.reduce((n,t)=>n+t.techniques.length,0)} techniques shown</span>
      </div>
      <div class="attck-scroll">
        <div class="attck-matrix" style="grid-template-columns: repeat(${MITRE_ATTCK.length}, 200px);">
          ${MITRE_ATTCK.map(tactic => {
            const cov = tacticCoverage[tactic.name] || [];
            const covClass = cov.length ? 'has-coverage' : '';
            return `
              <div class="attck-col">
                <div class="attck-tactic ${covClass}">
                  <div class="attck-tactic-name">${esc(tactic.name)}</div>
                  <div class="attck-tactic-meta">
                    <span class="muted" style="font-size:11px;">${tactic.id} · ${tactic.techniques.length} techniques</span>
                    ${cov.length ? `<span class="attck-count" title="${esc(cov.map(r=>r.name).join(', '))}">${cov.length}</span>` : ''}
                  </div>
                </div>
                ${tactic.techniques.map(tech => {
                  const rules = techCoverage[tech.id] || [];
                  const tacticHit = !rules.length && cov.length;
                  const cls = rules.length ? 'covered' : (tacticHit ? 'tactic-only' : '');
                  const title = rules.length
                    ? rules.map(r=>`Rule: ${r.name}`).join('\n')
                    : (tacticHit ? `Tactic-level coverage: ${cov.map(r=>r.name).join(', ')}` : 'No analytics rule maps to this technique.');
                  return `
                    <div class="attck-tech ${cls}" title="${esc(title)}">
                      <div class="attck-tech-id">${esc(tech.id)}</div>
                      <div class="attck-tech-name">${esc(tech.name)}</div>
                      ${rules.length ? `<div class="attck-tech-badge">${rules.length}</div>` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:14px;">
      <div class="card-toolbar"><strong>Coverage by rule</strong><a class="chip-link" href="#/sentinel/analytics">Edit analytics rules →</a></div>
      <table class="grid">
        <thead><tr><th>Tactic</th><th>Technique</th><th>Analytics rule</th><th>Status</th><th>Entity mapping</th></tr></thead>
        <tbody>
          ${rows.map(({ rule, tactic, techniques }) => `
            <tr>
              <td><span class="mitre">${esc(tactic)}</span></td>
              <td>${techniques.length ? techniques.map(t => `<span class="tag">${esc(t)}</span>`).join('') : '<span class="muted">Tactic only</span>'}</td>
              <td><strong>${esc(rule.name)}</strong></td>
              <td><span class="status-dot ${rule.enabled ? 'resolved' : ''}"></span>${rule.enabled ? 'Enabled' : 'Disabled'}</td>
              <td>${(rule.entities || []).map(e => `<span class="entity-chip">${esc(e)}</span>`).join('') || '<span class="muted">Configured in rule wizard</span>'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
};

VIEWS['sentinel/logs'] = () => `
  <div class="page-header">
    <div>
      <div class="breadcrumb">General › <strong>Logs</strong></div>
      <h1>Logs</h1>
      <div class="page-subtitle">Synthetic custom table rows used by the IOC matching lab.</div>
    </div>
  </div>
  <div class="card">
    <div class="card-toolbar"><strong>SyntheticTransactions_CL</strong><span class="muted">${SYNTHETIC_TRANSACTIONS.length} demo rows</span></div>
    <table class="grid">
      <thead><tr><th>TimeGenerated</th><th>SrcIp</th><th>DstIp</th><th>Domain</th><th>AccountName</th><th>Action</th><th>TechniqueId</th></tr></thead>
      <tbody>
        ${SYNTHETIC_TRANSACTIONS.map(e => `
          <tr>
            <td>${fmtTime(e.TimeGenerated)}</td>
            <td class="kv">${esc(e.SrcIp)}</td>
            <td class="kv">${esc(e.DstIp)}</td>
            <td class="kv">${esc(e.Domain)}</td>
            <td>${esc(e.AccountName)}</td>
            <td>${esc(e.Action)}</td>
            <td><span class="tag">${esc(e.TechniqueId)}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  <div class="two-col" style="margin-top:16px;">
    <div class="card card-body">
      <div class="card-toolbar" style="padding:0 0 8px; border-bottom:0;">
        <strong>IP IOC match query</strong>
        <button class="btn btn-ghost btn-sm" onclick="copyToClipboard('ti-ip-query')">Copy</button>
      </div>
      <textarea id="ti-ip-query" class="kql" readonly>${esc(TI_IP_MATCH_QUERY)}</textarea>
    </div>
    <div class="card card-body">
      <div class="card-toolbar" style="padding:0 0 8px; border-bottom:0;">
        <strong>Domain IOC match query</strong>
        <button class="btn btn-ghost btn-sm" onclick="copyToClipboard('ti-domain-query')">Copy</button>
      </div>
      <textarea id="ti-domain-query" class="kql" readonly>${esc(TI_DOMAIN_MATCH_QUERY)}</textarea>
    </div>
  </div>
`;

VIEWS['sentinel/hunting'] = () => {
  const jobComplete = localStorage.getItem('defender-lab.sentinel.networklogs.searchJob') === 'complete';
  return `
  <div class="page-header hunting-page-header">
    <div>
      <div class="breadcrumb">Microsoft Sentinel › Search › <strong>Logs</strong></div>
      <h1>Search</h1>
      <div class="page-subtitle">Investigate Log Analytics tables by plan, query window, and retained data availability.</div>
    </div>
    <div class="page-actions">
      <a class="btn btn-secondary" href="#/sentinel/logs">Open Logs</a>
      <a class="btn btn-secondary" href="#/sentinel/soc-optimization">SOC optimization</a>
      <button class="btn btn-primary" onclick="runSentinelSearchJob()">Run search job</button>
    </div>
  </div>

  <div class="kpi-strip hunting-status-cards">
    <div class="kpi"><span class="kpi-label">Selected table</span><span class="kpi-value">NetworkLogs_CL</span><span class="kpi-delta">Custom table</span></div>
    <div class="kpi"><span class="kpi-label">Plan</span><span class="kpi-value">Basic</span><span class="kpi-delta">Lower-cost retention</span></div>
    <div class="kpi"><span class="kpi-label">Interactive window</span><span class="kpi-value">30d</span><span class="kpi-delta bad">60d query blocked</span></div>
    <div class="kpi"><span class="kpi-label">Total retention</span><span class="kpi-value">365d</span><span class="kpi-delta">Search job can retrieve</span></div>
  </div>

  <div class="callout ${jobComplete ? 'info' : 'warn'}" style="margin-bottom:14px;">
    <strong>${jobComplete ? 'Search job complete:' : 'Scenario:'}</strong>
    ${jobComplete
      ? 'NetworkLogs_CL data from Apr 30, 2026 is materialized below for interactive analysis in the lab.'
      : 'NetworkLogs_CL is on the Basic plan. A direct interactive query can read only the last 30 days, so data from Apr 30, 2026 needs a search job.'}
  </div>

  <div class="table-plan-grid">
    ${SENTINEL_TABLE_PLANS.map(t => `
      <div class="table-plan-card ${t.name === 'NetworkLogs_CL' ? 'selected' : ''}">
        <div class="table-plan-head">
          <strong>${esc(t.name)}</strong>
          <span class="tag ${t.status === 'Interactive' ? 'green' : 'orange'}">${esc(t.plan)}</span>
        </div>
        <div class="table-plan-stats">
          <div><span>Interactive</span><strong>${esc(t.interactive)}</strong></div>
          <div><span>Total retention</span><strong>${esc(t.total)}</strong></div>
        </div>
        <div><span class="tag">${esc(t.tier)}</span> <span class="muted">${esc(t.cost)}</span></div>
        <div class="muted">${esc(t.detail)}</div>
        <div class="table-plan-status">${esc(t.status)}</div>
      </div>
    `).join('')}
  </div>

  <div class="card" style="margin-top:16px;">
    <div class="card-toolbar">
      <strong>Retention decision guide</strong>
      <span class="muted">Analytics vs Data lake vs XDR tier</span>
    </div>
    <table class="grid">
      <thead><tr><th>Choice</th><th>Use when</th><th>Avoid when</th></tr></thead>
      <tbody>
        ${SENTINEL_RETENTION_GUIDANCE.map(g => `
          <tr>
            <td><strong>${esc(g.choice)}</strong></td>
            <td>${esc(g.use)}</td>
            <td>${esc(g.avoid)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="two-col" style="margin-top:16px;">
    <div class="card card-body">
      <div class="card-toolbar" style="padding:0 0 8px; border-bottom:0;">
        <strong>Direct interactive query</strong>
        <button class="btn btn-ghost btn-sm" onclick="toast('Basic table interactive queries are limited to the last 30 days in this lab scenario.')">Run</button>
      </div>
      <textarea class="kql" readonly>NetworkLogs_CL
| where TimeGenerated between (ago(60d) .. ago(59d))
| summarize Events=count() by DstIp</textarea>
      <div class="callout warn" style="margin-top:10px;">This path is intentionally blocked for the 60-day investigation because the selected table is Basic.</div>
    </div>
    <div class="card card-body">
      <div class="card-toolbar" style="padding:0 0 8px; border-bottom:0;">
        <strong>Search job query</strong>
        <button class="btn btn-ghost btn-sm" onclick="copyToClipboard('networklogs-search-query')">Copy</button>
      </div>
      <textarea id="networklogs-search-query" class="kql" readonly>${esc(NETWORK_LOGS_SEARCH_QUERY)}</textarea>
      <div class="callout info" style="margin-top:10px;">Use a search job to retrieve data older than the Basic table interactive window but still inside total retention.</div>
    </div>
  </div>

  <div class="card" style="margin-top:16px;">
    <div class="card-toolbar">
      <strong>Search job results</strong>
      <span class="muted">${jobComplete ? NETWORK_LOGS_SEARCH_RESULTS.length + ' rows materialized' : 'No job run yet'}</span>
    </div>
    ${jobComplete ? `
      <table class="grid">
        <thead><tr><th>TimeGenerated</th><th>SrcIp</th><th>DstIp</th><th>Protocol</th><th>Action</th><th>BytesOut</th><th>Threat intel match</th></tr></thead>
        <tbody>
          ${NETWORK_LOGS_SEARCH_RESULTS.map(r => `
            <tr>
              <td>${fmtTime(r.TimeGenerated)}</td>
              <td class="kv">${esc(r.SrcIp)}</td>
              <td class="kv">${esc(r.DstIp)}</td>
              <td>${esc(r.Protocol)}</td>
              <td>${esc(r.Action)}</td>
              <td>${r.BytesOut}</td>
              <td>${esc(r.ThreatIntelMatch)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '<div class="card-body muted">Run the search job to retrieve the retained Basic table rows.</div>'}
  </div>
`;
};

VIEWS['sentinel/soc-optimization'] = () => `
  <div class="page-header">
    <div>
      <div class="breadcrumb">Microsoft Sentinel › Manage › <strong>SOC optimization</strong></div>
      <h1>SOC optimization</h1>
      <div class="page-subtitle">Review coverage gaps, rule quality, and data-value recommendations before changing ingestion or detections.</div>
    </div>
    <div class="page-actions">
      <a class="btn btn-secondary" href="#/sentinel/analytics">Analytics rules</a>
      <a class="btn btn-secondary" href="#/sentinel/hunting">Retention</a>
    </div>
  </div>
  <div class="kpi-strip">
    <div class="kpi"><span class="kpi-label">Recommendations</span><span class="kpi-value">${SOC_OPTIMIZATION_RECOMMENDATIONS.length}</span><span class="kpi-delta">Lab-static</span></div>
    <div class="kpi"><span class="kpi-label">High impact</span><span class="kpi-value">${SOC_OPTIMIZATION_RECOMMENDATIONS.filter(r => r.impact === 'High').length}</span><span class="kpi-delta bad">Act first</span></div>
    <div class="kpi"><span class="kpi-label">Data-value calls</span><span class="kpi-value">2</span><span class="kpi-delta">Cost + signal</span></div>
    <div class="kpi"><span class="kpi-label">Coverage goal</span><span class="kpi-value">Identity</span><span class="kpi-delta">Highest gap</span></div>
  </div>
  <div class="card">
    <div class="card-toolbar">
      <strong>Recommendations</strong>
      <span class="muted">Coverage, detection content, and ingestion value</span>
    </div>
    <table class="grid">
      <thead><tr><th>Area</th><th>Recommendation</th><th>Impact</th><th>Data value</th><th>Reason</th><th>Action</th></tr></thead>
      <tbody>
        ${SOC_OPTIMIZATION_RECOMMENDATIONS.map(r => `
          <tr>
            <td>${esc(r.area)}</td>
            <td><strong>${esc(r.recommendation)}</strong></td>
            <td><span class="severity ${r.impact.toLowerCase()}">${esc(r.impact)}</span></td>
            <td>${esc(r.dataValue)}</td>
            <td>${esc(r.reason)}</td>
            <td>${esc(r.action)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  <div class="callout info" style="margin-top:16px;">
    SOC optimization is a decision surface: use it to justify whether to add coverage, tune a noisy rule, or move low-value telemetry out of Analytics.
  </div>
`;

VIEWS['sentinel/summary-rules'] = () => `
  <div class="page-header">
    <div>
      <div class="breadcrumb">Microsoft Sentinel › Hunting › <strong>Summary rules</strong></div>
      <h1>Summary rule tables</h1>
      <div class="page-subtitle">Aggregate noisy source telemetry into a smaller table that is cheaper and faster for follow-up hunts.</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="copyToClipboard('summary-rule-query')">Copy rule query</button>
      <button class="btn btn-primary" onclick="toast('Summary table refreshed with 3 aggregate rows in this lab.')">Run summary rule</button>
    </div>
  </div>
  <div class="two-col">
    <div class="card card-body">
      <div class="card-toolbar" style="padding:0 0 8px; border-bottom:0;"><strong>Rule query</strong></div>
      <textarea id="summary-rule-query" class="kql" readonly>${esc(SUMMARY_RULE_QUERY)}</textarea>
    </div>
    <div class="card card-body">
      <div class="card-toolbar" style="padding:0 0 8px; border-bottom:0;"><strong>Analyst query</strong></div>
      <textarea class="kql" readonly>${esc(SUMMARY_TABLE_QUERY)}</textarea>
      <div class="callout info" style="margin-top:10px;">Analysts query NetworkSummary_CL for triage, then pivot back to NetworkLogs_CL only when raw evidence is needed.</div>
    </div>
  </div>
  <div class="two-col" style="margin-top:16px;">
    <div class="card">
      <div class="card-toolbar"><strong>Noisy source table</strong><span class="muted">NetworkLogs_CL sample</span></div>
      <table class="grid compact-grid">
        <thead><tr><th>Time</th><th>SrcIp</th><th>DstIp</th><th>Action</th><th>BytesOut</th></tr></thead>
        <tbody>${SUMMARY_RULE_SOURCE_ROWS.map(r => `
          <tr><td>${fmtTime(r.TimeGenerated)}</td><td class="kv">${esc(r.SrcIp)}</td><td class="kv">${esc(r.DstIp)}</td><td>${esc(r.Action)}</td><td>${r.BytesOut}</td></tr>
        `).join('')}</tbody>
      </table>
    </div>
    <div class="card">
      <div class="card-toolbar"><strong>Summary output table</strong><span class="muted">NetworkSummary_CL</span></div>
      <table class="grid compact-grid">
        <thead><tr><th>Hour</th><th>SrcIp</th><th>DstIp</th><th>Events</th><th>BytesOut</th><th>Blocks</th></tr></thead>
        <tbody>${SUMMARY_RULE_RESULTS.map(r => `
          <tr><td>${fmtTime(r.TimeGenerated)}</td><td class="kv">${esc(r.SrcIp)}</td><td class="kv">${esc(r.DstIp)}</td><td>${r.Events}</td><td>${r.BytesOut}</td><td>${r.Blocks}</td></tr>
        `).join('')}</tbody>
      </table>
    </div>
  </div>
`;

VIEWS['sentinel/data-lake-jobs'] = () => {
  const complete = localStorage.getItem('defender-lab.sentinel.dataLakeJob') === 'complete';
  return `
  <div class="page-header">
    <div>
      <div class="breadcrumb">Microsoft Sentinel › Hunting › <strong>Data lake KQL jobs</strong></div>
      <h1>Sentinel KQL jobs in Data lake</h1>
      <div class="page-subtitle">Run long-range KQL over retained Data lake tables, then materialize results for analyst review.</div>
    </div>
    <div class="page-actions">
      <a class="btn btn-secondary" href="#/sentinel/hunting">Basic search job</a>
      <button class="btn btn-primary" onclick="runSentinelDataLakeJob()">Run Data lake job</button>
    </div>
  </div>
  <div class="kpi-strip">
    <div class="kpi"><span class="kpi-label">Source</span><span class="kpi-value">ArchiveDns</span><span class="kpi-delta">Data lake</span></div>
    <div class="kpi"><span class="kpi-label">Lookback</span><span class="kpi-value">180d</span><span class="kpi-delta">Batch job</span></div>
    <div class="kpi"><span class="kpi-label">Runtime</span><span class="kpi-value">${esc(DATA_LAKE_KQL_JOB.runtime.split(' ')[0])}</span><span class="kpi-delta">${esc(DATA_LAKE_KQL_JOB.runtime.replace(DATA_LAKE_KQL_JOB.runtime.split(' ')[0]+' ', ''))}</span></div>
    <div class="kpi"><span class="kpi-label">Results table</span><span class="kpi-value">_CL</span><span class="kpi-delta">${complete ? 'Materialized' : 'Pending'}</span></div>
  </div>
  <div class="two-col">
    <div class="card card-body">
      <div class="card-toolbar" style="padding:0 0 8px; border-bottom:0;">
        <strong>${esc(DATA_LAKE_KQL_JOB.name)}</strong>
        <button class="btn btn-ghost btn-sm" onclick="copyToClipboard('data-lake-job-query')">Copy</button>
      </div>
      <textarea id="data-lake-job-query" class="kql" readonly>${esc(DATA_LAKE_KQL_JOB.query)}</textarea>
    </div>
    <div class="card card-body">
      <h2>Contrast with Basic-table search job</h2>
      <p class="muted">A Basic-table search job retrieves older retained rows from one Log Analytics table for investigation. A Data lake KQL job is for broader historical processing where a long-running query writes a reusable results table.</p>
      <dl class="summary-info" style="margin-top:12px;">
        <dt>Basic search job</dt><dd>Case-specific retrieval from NetworkLogs_CL.</dd>
        <dt>Data lake KQL job</dt><dd>Batch hunt over ${esc(DATA_LAKE_KQL_JOB.source)} into ${esc(DATA_LAKE_KQL_JOB.resultTable)}.</dd>
      </dl>
    </div>
  </div>
  <div class="card" style="margin-top:16px;">
    <div class="card-toolbar">
      <strong>${esc(DATA_LAKE_KQL_JOB.resultTable)}</strong>
      <span class="muted">${complete ? DATA_LAKE_KQL_JOB.results.length + ' rows materialized' : 'Run the job to create results'}</span>
    </div>
    ${complete ? `
      <table class="grid">
        <thead><tr><th>Time</th><th>DnsQuery</th><th>QueryCount</th><th>UniqueHosts</th><th>Verdict</th></tr></thead>
        <tbody>${DATA_LAKE_KQL_JOB.results.map(r => `
          <tr><td>${fmtTime(r.TimeGenerated)}</td><td class="kv">${esc(r.DnsQuery)}</td><td>${r.QueryCount}</td><td>${r.UniqueHosts}</td><td>${esc(r.Verdict)}</td></tr>
        `).join('')}</tbody>
      </table>
    ` : '<div class="card-body muted">The result table is empty until the long-running job completes.</div>'}
  </div>
`;
};

VIEWS['sentinel/notebooks'] = () => `
  <div class="page-header">
    <div>
      <div class="breadcrumb">Microsoft Sentinel › Hunting › <strong>Notebooks</strong></div>
      <h1>Notebooks</h1>
      <div class="page-subtitle">Use notebook-style investigation templates for enrichment, entity pivots, and Data lake job review.</div>
    </div>
    <div class="page-actions">
      <a class="btn btn-secondary" href="#/sentinel/data-lake-jobs">Data lake jobs</a>
      <button class="btn btn-primary" onclick="toast('Notebook opened with static lab cells only.')">Open notebook</button>
    </div>
  </div>
  <div class="three-col">
    ${SENTINEL_NOTEBOOKS.map(n => `
      <div class="tile">
        <div class="tile-title"><span class="tile-icon">📓</span>${esc(n.name)}</div>
        <div class="tile-sub">${esc(n.language)} · ${esc(n.status)}</div>
        <div class="resource-summary" style="margin-top:10px;">
          <div><span>Inputs</span><strong>${esc(n.inputs)}</strong></div>
          <div><span>Output</span><strong>${esc(n.output)}</strong></div>
        </div>
        <div class="muted" style="margin-top:10px;">${esc(n.detail)}</div>
      </div>
    `).join('')}
  </div>
  <div class="card" style="margin-top:16px;">
    <div class="card-toolbar">
      <strong>Sentinel MCP Server connection notes</strong>
      <span class="muted">Conceptual only; no network calls in this lab</span>
    </div>
    <div class="three-col">
      ${SENTINEL_MCP_NOTES.map(n => `
        <div class="mcp-note">
          <strong>${esc(n.title)}</strong>
          <p class="muted">${esc(n.detail)}</p>
        </div>
      `).join('')}
    </div>
  </div>
  <div class="card card-body" style="margin-top:16px;">
    <div class="card-toolbar" style="padding:0 0 8px; border-bottom:0;"><strong>Notebook cell preview</strong></div>
    <textarea class="kql" readonly># Static lab cell
incident_id = "INC-1042"
result_table = "DnsBeaconingResults_CL"
print("Load incident entities, enrich indicators, and attach the result table to the case notes.")</textarea>
  </div>
`;

VIEWS['sentinel/workbooks'] = () => `
  <div class="page-header"><div><div class="breadcrumb">Threat management › <strong>Workbooks</strong></div><h1>Workbooks</h1></div></div>
  <div class="three-col">
    ${SENTINEL_WORKBOOKS.map(w => `
      <div class="tile">
        <div class="tile-title"><span class="tile-icon">📓</span>${esc(w.name)}</div>
        <div class="tile-sub">${esc(w.owner)} · refresh ${esc(w.refresh)}</div>
        <div style="margin-top:10px;">${w.panels.map(p => `<span class="tag">${esc(p)}</span>`).join(' ')}</div>
        <div class="muted" style="margin-top:10px; font-size:12px;">${esc(w.detail)}</div>
      </div>
    `).join('')}
  </div>
  <div class="card" style="margin-top:16px;">
    <div class="card-toolbar"><strong>Workbook detail: Investigation Insights</strong><span class="muted">Pinned to SOC overview</span></div>
    <div class="card-body">
      <div class="three-col">
        <div><div class="alert-section-title">Incident trend</div><div class="tile-metric">${INCIDENTS.length}</div><div class="muted">Open incidents in 24h</div></div>
        <div><div class="alert-section-title">Top tactic</div><div class="tile-metric">Initial Access</div><div class="muted">3 correlated incidents</div></div>
        <div><div class="alert-section-title">Entity graph</div><div class="tile-metric">${SENTINEL_GRAPH.nodes.length}</div><div class="muted">Nodes for ${esc(SENTINEL_GRAPH.incidentId)}</div></div>
      </div>
    </div>
  </div>
`;

VIEWS['sentinel/automation'] = () => {
  const lab = SENTINEL_AUTOMATION_LAB;
  const hasPermission = localStorage.getItem('defender-lab.sentinel.playbook1Permission') === 'granted';
  const playbookState = hasPermission ? 'Available' : 'Grayed out';
  const permissionClass = hasPermission ? 'granted' : 'missing';
  const selectedPlaybook = hasPermission
    ? `<button class="playbook-select-row selected" onclick="selectSentinelPlaybook('Playbook1')">
        <span><strong>Playbook1</strong><small>Microsoft Sentinel incident trigger · RG-Playbooks</small></span>
        <span class="status-pill ok">Selectable</span>
      </button>`
    : `<button class="playbook-select-row disabled" onclick="explainDisabledPlaybook()">
        <span><strong>Playbook1</strong><small>Microsoft Sentinel incident trigger · RG-Playbooks</small></span>
        <span class="status-pill blocked">Grayed out</span>
      </button>`;

  return `
    <div class="page-header">
      <div>
        <div class="breadcrumb">Configuration › <strong>Automation</strong></div>
        <h1>Automation</h1>
        <div class="page-subtitle">Create automation rules and run incident-trigger playbooks from Microsoft Sentinel.</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="toast('Create automation rule blade is open in the lab page below.')">+ Create</button>
      </div>
    </div>
    <div class="tabs"><span class="tab active">Automation rules</span><span class="tab">Playbooks</span><span class="tab">Active playbooks</span></div>

    <div class="callout ${hasPermission ? 'success' : 'warn'}">
      <strong>SC-200 checkpoint:</strong> ${hasPermission
        ? 'Microsoft Sentinel now has access to RG-Playbooks, so Playbook1 is available in the Run playbook action.'
        : 'Playbook1 is grayed out because Microsoft Sentinel does not have permission to the playbook resource group.'}
    </div>

    <div class="automation-layout">
      <section class="card">
        <div class="card-toolbar"><strong>Automation rules</strong><span class="muted">Microsoft Sentinel workspace: ${esc(lab.workspace)}</span></div>
        <table class="grid">
          <thead><tr><th>Order</th><th>Name</th><th>Trigger</th><th>Actions</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>1</td><td>Auto-assign phishing incidents to L1</td><td>When incident is created</td><td>Assign owner: L1-Triage</td><td><span class="status-dot resolved"></span>Enabled</td></tr>
            <tr><td>2</td><td>Tag identity attacks</td><td>When incident is updated</td><td>Add tag: identity-attack</td><td><span class="status-dot resolved"></span>Enabled</td></tr>
            <tr><td>3</td><td>Run isolation playbook on high-sev EDR</td><td>When alert is created</td><td>Run playbook: PB-IsolateDevice</td><td><span class="status-dot warn"></span>Disabled</td></tr>
            <tr class="active-row"><td>4</td><td>${esc(lab.ruleDraft.name)}</td><td>${esc(lab.ruleDraft.trigger)}</td><td>Run playbook: <strong>${hasPermission ? 'Playbook1' : '(not selected)'}</strong></td><td><span class="status-dot ${hasPermission ? 'resolved' : 'warn'}"></span>${hasPermission ? 'Ready' : 'Draft blocked'}</td></tr>
          </tbody>
        </table>
      </section>

      <section class="card automation-blade">
        <div class="blade-mini-header">
          <div>
            <div class="breadcrumb">Create automation rule</div>
            <h2>${esc(lab.ruleDraft.name)}</h2>
          </div>
          <button class="iconbtn" onclick="toast('Blade closed (lab stub).')">×</button>
        </div>
        <div class="wizard-section form-grid two">
          <label class="lbl">Automation rule name<input class="ipt" value="${esc(lab.ruleDraft.name)}"></label>
          <label class="lbl">Trigger<select class="ipt"><option selected>${esc(lab.ruleDraft.trigger)}</option><option>When incident is updated</option><option>When alert is created</option></select></label>
          <label class="lbl">Condition<input class="ipt" value="${esc(lab.ruleDraft.condition)}"></label>
          <label class="lbl">Action<select class="ipt"><option selected>${esc(lab.ruleDraft.action)}</option><option>Assign owner</option><option>Add tag</option><option>Change severity</option></select></label>
        </div>

        <div class="run-playbook-action">
          <div class="action-header">
            <strong>Run playbook</strong>
            <button class="chip-link" onclick="grantPlaybookPermissions()">Manage playbook permissions</button>
          </div>
          <div class="playbook-dropdown">
            <div class="dropdown-label">Playbook drop-down list</div>
            ${selectedPlaybook}
            <button class="playbook-select-row" onclick="toast('PB-RevokeOAuthConsent selected for comparison.')">
              <span><strong>PB-RevokeOAuthConsent</strong><small>Microsoft Sentinel incident trigger · RG-SOC</small></span>
              <span class="status-pill ok">Selectable</span>
            </button>
          </div>
          <div class="permission-state ${permissionClass}">
            <span>${playbookState}</span>
            <strong>${hasPermission ? 'Sentinel has Automation Contributor on RG-Playbooks.' : 'Sentinel is missing Automation Contributor on RG-Playbooks.'}</strong>
          </div>
        </div>
      </section>
    </div>

    <div class="two-col" style="margin-top:16px;">
      <section class="card">
        <div class="card-toolbar"><strong>Manage playbook permissions</strong><span class="muted">${esc(lab.resourceGroup)}</span></div>
        <div class="permission-panel">
          <div class="permission-target">
            <span class="resource-icon">RG</span>
            <div><strong>${esc(lab.resourceGroup)}</strong><small>Resource group containing ${esc(lab.playbookName)}</small></div>
          </div>
          <table class="grid compact">
            <thead><tr><th>Principal</th><th>Role</th><th>Effect</th></tr></thead>
            <tbody>
              ${lab.permissions.map(p => {
                const active = p.principal === lab.serviceAccount && hasPermission;
                return `<tr class="${active ? 'active-row' : ''}">
                  <td>${esc(p.principal)}</td>
                  <td>${esc(p.role)}</td>
                  <td>${esc(p.effect)}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
          <button class="btn btn-primary" onclick="grantPlaybookPermissions()">Grant Microsoft Sentinel access</button>
          <button class="btn btn-secondary" onclick="resetPlaybookPermissions()">Reset lab permission</button>
        </div>
      </section>

      <section class="card card-body">
        <div class="alert-section-title">Why the exam answer is this action</div>
        <ol class="learn-steps">
          ${lab.notes.map(n => `<li>${esc(n)}</li>`).join('')}
        </ol>
        <div class="resource-summary">
          <div><span>Wrong fix</span><strong>Logic App Contributor for your user</strong><small>Lets you edit the app, but the automation rule still cannot run it.</small></div>
          <div><span>Correct fix</span><strong>Manage playbook permissions</strong><small>Grants the Sentinel service account ${esc(lab.role)} on ${esc(lab.resourceGroup)}.</small></div>
        </div>
      </section>
    </div>

    <div class="three-col" style="margin-top:16px;">
      ${SENTINEL_PLAYBOOKS.map(p => `
        <div class="card card-body ${p.name === 'Playbook1' ? 'playbook1-card' : ''}">
          <div class="card-toolbar" style="padding:0 0 8px; border-bottom:0;">
            <strong>${esc(p.name)}</strong>
            <span class="tag ${p.status === 'Enabled' ? 'green' : 'orange'}">${esc(p.status)}</span>
          </div>
          <div class="muted">${esc(p.trigger)} · ${esc(p.connector)}</div>
          ${p.resourceGroup ? `<div class="muted">Resource group: <strong>${esc(p.resourceGroup)}</strong></div>` : ''}
          <div class="alert-section-title">Playbook steps</div>
          <ol style="margin:0; padding-left:18px; font-size:12px; line-height:1.7;">
            ${p.steps.map(s => `<li>${esc(s)}</li>`).join('')}
          </ol>
        </div>
      `).join('')}
    </div>
  `;
};

// ---------- Agent 10 dead-route cleanup surfaces ----------
const ACTION_CENTER_ITEMS = [
  { source:'AIR', status:'Pending approval', incident:'INC-1042', action:'Remove OAuth consent for DocViewer Pro', target:'jane.doe@contoso.com', age:'12 min' },
  { source:'AIR', status:'Completed', incident:'INC-1050', action:'Isolate device', target:'FIN-FS-02', age:'38 min' },
  { source:'MDE', status:'Pending approval', incident:'INC-1050', action:'Quarantine locker.exe', target:'aaaabbbbcccc1111222233334444555566667777888899990000aaaabbbbcccc', age:'41 min' },
  { source:'MDO', status:'Completed', incident:'INC-1042', action:'Soft-delete phishing message', target:'MSG-7781', age:'55 min' },
];

const MDO_INVESTIGATION_ROWS = [
  { sev:'high', title:'User clicked phishing URL and granted OAuth consent', user:'jane.doe@contoso.com', evidence:'URL click + app consent', incident:'INC-1042', action:'Revoke sessions, remove consent, purge message' },
  { sev:'medium', title:'Mailbox rule created after suspicious sign-in', user:'maria.chen@contoso.com', evidence:'Inbox rule forwards finance mail', incident:'INC-1051', action:'Disable rule, reset password, review audit' },
  { sev:'low', title:'Attachment detonated but blocked', user:'pavel.novak@contoso.com', evidence:'Sandbox verdict matched malware family', incident:'INC-1031', action:'Confirm delivery blocked and tune alert noise' },
];

const SENTINEL_WATCHLIST_ROWS = [
  { name:'VIP accounts', alias:'vip_accounts', items:18, updated:'2026-07-06T07:35:00Z', use:'Join to SigninLogs and UEBA anomalies before creating incidents.' },
  { name:'Privileged service principals', alias:'tier0_apps', items:9, updated:'2026-07-05T16:20:00Z', use:'Scope OAuth consent and app activity hunts.' },
  { name:'Approved scanner hosts', alias:'approved_scanners', items:6, updated:'2026-07-01T09:10:00Z', use:'Suppress known scanner noise without hiding new hosts.' },
];

const CLOUD_ASSETS = [
  { name:'vm-prod-web-01', type:'Virtual machine', subscription:'sub-prod-001', risk:'High', exposure:'Internet exposed', alerts:1, recs:3 },
  { name:'aks-prod/node-3', type:'Kubernetes node', subscription:'sub-prod-001', risk:'High', exposure:'Privileged container path', alerts:2, recs:4 },
  { name:'stcontosologs', type:'Storage account', subscription:'sub-prod-001', risk:'Medium', exposure:'Public network access', alerts:1, recs:2 },
  { name:'sql-prod-reporting', type:'SQL server', subscription:'sub-prod-001', risk:'Medium', exposure:'Wide firewall rule', alerts:1, recs:2 },
  { name:'kv-prod-app', type:'Key vault', subscription:'sub-prod-001', risk:'Low', exposure:'Unusual access location', alerts:1, recs:1 },
];

const CLOUD_ATTACK_PATHS = [
  { name:'Internet VM to storage exfiltration', severity:'high', start:'vm-prod-web-01', path:['Open SSH management port','Managed identity has Storage Blob Data Contributor','stcontosologs permits public network access'], result:'Potential data exfiltration path' },
  { name:'Container breakout to node credential access', severity:'high', start:'aks-prod/node-3', path:['Privileged pod scheduled','Host namespace mounted','Node identity can read Key Vault secrets'], result:'Credential access and lateral movement path' },
  { name:'SQL public access to reporting data', severity:'medium', start:'sql-prod-reporting', path:['Firewall allows any internet source','Weak conditional access coverage','Database contains customer exports'], result:'Initial access and collection risk' },
];

const SECONDARY_SURFACES = {
  'defender/content-hub': { crumb:'Microsoft Defender › Content management', title:'Content hub', note:'Supporting content surface for Defender solution packs and integrations.', links:[['Open Sentinel content hub','#/sentinel/content-hub'], ['Review analytics rules','#/sentinel/analytics'], ['Open data connectors','#/sentinel/data-connectors']] },
  'defender/repositories': { crumb:'Microsoft Defender › Content management', title:'Repositories', note:'Supporting surface for source-controlled detection content. The hands-on Sentinel rule work lives in Analytics and Workspace manager.', links:[['Open Workspace manager','#/sentinel/workspace-manager'], ['Open Analytics','#/sentinel/analytics']] },
  'defender/community': { crumb:'Microsoft Defender › Other', title:'Community', note:'Supporting learning surface. Use the interactive incident, hunting, and AIR pages for SC-200 practice.', links:[['Open incidents','#/defender/incidents'], ['Open AIR center','#/defender/air']] },
  'defender/reports': { crumb:'Microsoft Defender › Other', title:'Reports', note:'Secondary reporting surface for lab review. The exam-relevant detail is in Threat analytics, Secure score, and incident queues.', links:[['Open Threat analytics','#/defender/threat-analytics'], ['Open Secure score','#/defender/secure-score']] },
  'defender/learning-hub': { crumb:'Microsoft Defender › Other', title:'Learning hub', note:'Supporting study surface with pointers into the local hands-on flows.', links:[['Start Guided scenarios','#/defender/home'], ['Open Advanced hunting','#/defender/hunting']] },
  'defender/trials': { crumb:'Microsoft Defender › Other', title:'Trials', note:'Chrome-only lab surface. Licensing and trials are outside this local simulator; practice workload behavior instead.', links:[['Open Settings','#/defender/settings'], ['Open Endpoints','#/defender/endpoints']] },
  'sentinel/news': { crumb:'Microsoft Sentinel › General', title:'News and guides', note:'Supporting content surface. Current syllabus practice is covered by connectors, analytics, incidents, hunting, and graph views.', links:[['Open Data connectors','#/sentinel/data-connectors'], ['Open Sentinel Graph','#/sentinel/graph']] },
  'sentinel/repositories': { crumb:'Microsoft Sentinel › Content management', title:'Repositories', note:'Supporting content lifecycle surface. Use Workspace manager to distribute rules and DCR-backed content across workspaces.', links:[['Open Workspace manager','#/sentinel/workspace-manager'], ['Open Content hub','#/sentinel/content-hub']] },
  'sentinel/community': { crumb:'Microsoft Sentinel › Content management', title:'Community', note:'Supporting community surface. The lab keeps all content local and original.', links:[['Open Hunting','#/sentinel/hunting'], ['Open Analytics','#/sentinel/analytics']] },
  'defender-cloud/community': { crumb:'Defender for Cloud › General', title:'Community', note:'Supporting study surface for cloud security guidance. Use alerts, inventory, and attack paths for hands-on practice.', links:[['Open Security alerts','#/defender-cloud/alerts'], ['Open Attack paths','#/defender-cloud/attack-paths']] },
  'defender-cloud/workbooks': { crumb:'Defender for Cloud › General', title:'Workbooks', note:'Secondary dashboard surface for posture and workload protection summaries.', links:[['Open Recommendations','#/defender-cloud/recommendations'], ['Open Inventory','#/defender-cloud/inventory']] },
  'defender-cloud/diagnose': { crumb:'Defender for Cloud › General', title:'Diagnose and solve problems', note:'Secondary support surface. The lab models investigation decisions in alerts, inventory, and attack paths.', links:[['Open Security alerts','#/defender-cloud/alerts'], ['Open Environment settings','#/defender-cloud/environment']] },
};

function renderSecondarySurface(config) {
  return `
    <div class="page-header">
      <div>
        <div class="breadcrumb">${esc(config.crumb)}</div>
        <h1>${esc(config.title)}</h1>
        <div class="page-subtitle">${esc(config.note)}</div>
      </div>
    </div>
    <div class="card card-body">
      <div class="alert-section-title">Supporting content</div>
      <div class="callout info">This route is intentionally small so navigation never dead-ends. It points back to the interactive SC-200 surfaces that exercise the skill.</div>
      <div class="tile-grid" style="margin-top:12px;">
        ${config.links.map(([label, href]) => `<a class="tile" href="${href}"><strong>${esc(label)}</strong><span>Open related lab surface</span></a>`).join('')}
      </div>
    </div>`;
}

VIEWS['defender/content-hub'] = () => renderSecondarySurface(SECONDARY_SURFACES['defender/content-hub']);
VIEWS['defender/repositories'] = () => renderSecondarySurface(SECONDARY_SURFACES['defender/repositories']);
VIEWS['defender/community'] = () => renderSecondarySurface(SECONDARY_SURFACES['defender/community']);
VIEWS['defender/reports'] = () => renderSecondarySurface(SECONDARY_SURFACES['defender/reports']);
VIEWS['defender/learning-hub'] = () => renderSecondarySurface(SECONDARY_SURFACES['defender/learning-hub']);
VIEWS['defender/trials'] = () => renderSecondarySurface(SECONDARY_SURFACES['defender/trials']);
VIEWS['sentinel/news'] = () => renderSecondarySurface(SECONDARY_SURFACES['sentinel/news']);
VIEWS['sentinel/repositories'] = () => renderSecondarySurface(SECONDARY_SURFACES['sentinel/repositories']);
VIEWS['sentinel/community'] = () => renderSecondarySurface(SECONDARY_SURFACES['sentinel/community']);
VIEWS['defender-cloud/community'] = () => renderSecondarySurface(SECONDARY_SURFACES['defender-cloud/community']);
VIEWS['defender-cloud/workbooks'] = () => renderSecondarySurface(SECONDARY_SURFACES['defender-cloud/workbooks']);
VIEWS['defender-cloud/diagnose'] = () => renderSecondarySurface(SECONDARY_SURFACES['defender-cloud/diagnose']);

VIEWS['defender/action-center'] = () => `
  <div class="page-header">
    <div><div class="breadcrumb">Investigation &amp; response › <strong>Action center</strong></div><h1>Action center</h1><div class="page-subtitle">Review completed and pending response actions from AIR, MDE, and MDO.</div></div>
    <div class="page-actions"><a class="btn btn-secondary" href="#/defender/air">Open AIR center</a></div>
  </div>
  <div class="kpi-strip">
    <div class="kpi"><span class="kpi-label">Pending approval</span><span class="kpi-value">${ACTION_CENTER_ITEMS.filter(i=>i.status.includes('Pending')).length}</span></div>
    <div class="kpi"><span class="kpi-label">Completed</span><span class="kpi-value">${ACTION_CENTER_ITEMS.filter(i=>i.status==='Completed').length}</span></div>
    <div class="kpi"><span class="kpi-label">Sources</span><span class="kpi-value">3</span><span class="kpi-delta">AIR · MDE · MDO</span></div>
    <div class="kpi"><span class="kpi-label">Linked incidents</span><span class="kpi-value">2</span></div>
  </div>
  <div class="card">
    <div class="card-toolbar"><strong>Response actions</strong><span class="muted">Lab-static approvals</span></div>
    <table class="grid">
      <thead><tr><th>Status</th><th>Source</th><th>Action</th><th>Target</th><th>Incident</th><th>Age</th><th></th></tr></thead>
      <tbody>${ACTION_CENTER_ITEMS.map(i => `
        <tr>
          <td><span class="tag ${i.status === 'Completed' ? 'green' : 'orange'}">${esc(i.status)}</span></td>
          <td>${esc(i.source)}</td>
          <td><strong>${esc(i.action)}</strong></td>
          <td class="kv">${esc(i.target)}</td>
          <td><button class="link-button strong" onclick="openIncident('${esc(i.incident)}')">${esc(i.incident)}</button></td>
          <td>${esc(i.age)}</td>
          <td><button class="btn btn-sm btn-primary" onclick="toast('Action reviewed in the lab.')">Review</button></td>
        </tr>`).join('')}</tbody>
    </table>
  </div>`;

VIEWS['defender/email-collab'] = () => `
  <div class="page-header">
    <div><div class="breadcrumb">Configuration › <strong>Email &amp; collaboration</strong></div><h1>Email and collaboration investigation</h1><div class="page-subtitle">Practice MDO triage paths for phishing, mailbox rules, submissions, and OAuth follow-on activity.</div></div>
    <div class="page-actions"><a class="btn btn-secondary" href="#/defender/cloud-apps">Cloud apps OAuth pivot</a></div>
  </div>
  <div class="two-col">
    <section class="card">
      <div class="card-toolbar"><strong>MDO investigation queue</strong><span class="muted">Fictional messages and users</span></div>
      <table class="grid">
        <thead><tr><th>Severity</th><th>Investigation</th><th>User</th><th>Evidence</th><th>Response</th></tr></thead>
        <tbody>${MDO_INVESTIGATION_ROWS.map(r => `
          <tr>
            <td><span class="sev ${r.sev}">${cap(r.sev)}</span></td>
            <td><button class="link-button strong" onclick="openIncident('${esc(r.incident)}')">${esc(r.title)}</button></td>
            <td>${esc(r.user)}</td>
            <td>${esc(r.evidence)}</td>
            <td>${esc(r.action)}</td>
          </tr>`).join('')}</tbody>
      </table>
    </section>
    <section class="card card-body">
      <div class="alert-section-title">Hands-on flow</div>
      <div class="flowline vertical-flow">
        <div class="flow-step"><strong>Open alert</strong><span>Start from the MDO URL click alert in INC-1042.</span></div>
        <div class="flow-step"><strong>Inspect evidence</strong><span>Review clicked URL, delivery action, mailbox events, and user activity.</span></div>
        <div class="flow-step"><strong>Pivot</strong><span>Move to Cloud Apps for the risky OAuth grant and to Purview Audit for consent events.</span></div>
        <div class="flow-step"><strong>Respond</strong><span>Purge mail, revoke sessions, remove app consent, and close the incident with classification.</span></div>
      </div>
    </section>
  </div>`;

VIEWS['defender/endpoints'] = () => `
  <div class="page-header"><div><div class="breadcrumb">Configuration › <strong>Endpoints</strong></div><h1>Endpoint security operations</h1><div class="page-subtitle">Shortcut surface for MDE device settings, ASR policy, live response, and device inventory.</div></div></div>
  <div class="tile-grid">
    <a class="tile" href="#/defender/devices"><strong>Device inventory</strong><span>Open device overview, timeline, live response, and package collection.</span></a>
    <a class="tile" href="#/defender/settings"><strong>MDE settings</strong><span>Advanced features, device groups, roles, and automation levels.</span></a>
    <a class="tile" href="#/defender/asr-policy"><strong>ASR policies</strong><span>Audit/block states, exclusions, and expected impact.</span></a>
    <a class="tile" href="#/defender/custom-detections"><strong>Custom detections</strong><span>Promote Advanced hunting queries to endpoint actions.</span></a>
  </div>`;

VIEWS['defender/exposure'] = () => `
  <div class="page-header"><div><div class="breadcrumb">Microsoft Defender › <strong>Exposure management</strong></div><h1>Exposure management</h1><div class="page-subtitle">Prioritize exposed assets by incident linkage, cloud attack paths, and secure score recommendations.</div></div></div>
  <div class="kpi-strip">
    <div class="kpi"><span class="kpi-label">Critical assets</span><span class="kpi-value">7</span></div>
    <div class="kpi"><span class="kpi-label">Open paths</span><span class="kpi-value">${CLOUD_ATTACK_PATHS.length}</span></div>
    <div class="kpi"><span class="kpi-label">High recs</span><span class="kpi-value">${DEFENDER_CLOUD_RECS.filter(r=>r.severity==='high').length}</span></div>
    <div class="kpi"><span class="kpi-label">Active incidents</span><span class="kpi-value">${INCIDENTS.filter(i=>i.status!=='Resolved').length}</span></div>
  </div>
  <div class="two-col">
    <section class="card card-body"><div class="alert-section-title">Exposure priorities</div><ul><li>Resolve public management ports on internet-facing VMs before tuning low-value posture findings.</li><li>Use Defender for Cloud attack paths when a resource appears in a workload-protection alert.</li><li>Pivot endpoint exposure to device inventory and cloud exposure to inventory/attack paths.</li></ul></section>
    <section class="card"><div class="card-toolbar"><strong>Related attack paths</strong><a class="chip-link" href="#/defender-cloud/attack-paths">Open cloud paths →</a></div>${CLOUD_ATTACK_PATHS.map(p => `<div class="card-body border-top"><span class="sev ${p.severity}">${cap(p.severity)}</span> <strong>${esc(p.name)}</strong><div class="muted">${esc(p.result)}</div></div>`).join('')}</section>
  </div>`;

VIEWS['defender/intel-explorer'] = () => `
  <div class="page-header"><div><div class="breadcrumb">Threat intelligence › <strong>Intel explorer</strong></div><h1>Intel explorer</h1><div class="page-subtitle">Static IOC triage surface using the lab's Sentinel threat intelligence indicators.</div></div><div class="page-actions"><a class="btn btn-secondary" href="#/sentinel/threat-intel">Sentinel threat intel</a></div></div>
  <div class="card">
    <div class="card-toolbar"><strong>Indicators in this lab</strong><span class="muted">Mapped to synthetic events only</span></div>
    <table class="grid"><thead><tr><th>Type</th><th>Indicator</th><th>Confidence</th><th>Scenario</th><th>Pivot</th></tr></thead><tbody>
      <tr><td>IP</td><td class="kv">203.0.113.10</td><td>High</td><td>TI match synthetic transaction</td><td><a class="chip-link" href="#/sentinel/threat-intel">Open TI lab</a></td></tr>
      <tr><td>Domain</td><td class="kv">bad-demo.example</td><td>Medium</td><td>Phishing and command channel demo</td><td><a class="chip-link" href="#/sentinel/logs">Open logs</a></td></tr>
      <tr><td>Hash</td><td class="kv">aaaabbbbcccc...</td><td>Low</td><td>Scanner suppression gotcha</td><td><a class="chip-link" href="#/defender/suppression">Open suppression</a></td></tr>
    </tbody></table>
  </div>`;

VIEWS['sentinel/search'] = () => `
  <div class="page-header"><div><div class="breadcrumb">Microsoft Sentinel › <strong>Search</strong></div><h1>Search</h1><div class="page-subtitle">Run investigation searches across Basic, Analytics, Data lake, and summary-table patterns.</div></div><div class="page-actions"><a class="btn btn-primary" href="#/sentinel/hunting">Open hunting search job</a></div></div>
  <div class="tile-grid">
    <a class="tile" href="#/sentinel/hunting"><strong>Basic-table search job</strong><span>Recover older NetworkLogs_CL rows through materialized search results.</span></a>
    <a class="tile" href="#/sentinel/data-lake-jobs"><strong>Data lake KQL job</strong><span>Run long-range historical hunts and review results tables.</span></a>
    <a class="tile" href="#/sentinel/summary-rules"><strong>Summary table query</strong><span>Compare noisy raw telemetry with aggregate summary output.</span></a>
    <a class="tile" href="#/sentinel/logs"><strong>Logs</strong><span>Inspect current Sentinel fixture rows and copy KQL.</span></a>
  </div>`;

VIEWS['sentinel/entity-behavior'] = () => `
  <div class="page-header"><div><div class="breadcrumb">Threat management › <strong>Entity behavior</strong></div><h1>Entity behavior</h1><div class="page-subtitle">UEBA-style risk context for users, hosts, and IPs that feed incidents, anomalies, and hunting pivots.</div></div><div class="page-actions"><a class="btn btn-secondary" href="#/sentinel/settings">UEBA settings</a></div></div>
  <div class="two-col">
    <section class="card"><div class="card-toolbar"><strong>Behavioral entities</strong><span class="muted">Fictional UEBA scores</span></div><table class="grid"><thead><tr><th>Entity</th><th>Type</th><th>Score</th><th>Top anomaly</th><th>Pivot</th></tr></thead><tbody>
      <tr><td>jane.doe@contoso.com</td><td>Account</td><td><span class="sev high">92</span></td><td>OAuth grant after phishing click</td><td><a class="chip-link" href="#/sentinel/graph">Graph</a></td></tr>
      <tr><td>FIN-FS-02</td><td>Host</td><td><span class="sev high">88</span></td><td>Rare encryption process and service stop</td><td><a class="chip-link" href="#/defender/device">Device</a></td></tr>
      <tr><td>10.5.12.44</td><td>IP</td><td><span class="sev medium">67</span></td><td>Repeated IOC destination contact</td><td><a class="chip-link" href="#/sentinel/hunting/dns">DNS hunt</a></td></tr>
    </tbody></table></section>
    <section class="card card-body"><div class="alert-section-title">How UEBA supports SC-200 tasks</div><ul><li>Entity pages summarize peer baselines, alerts, incidents, and anomalies.</li><li>Anomaly rules can enrich hunting and scheduled analytics rules.</li><li>Risky users and devices should be validated against evidence before response.</li></ul></section>
  </div>`;

VIEWS['sentinel/watchlist'] = () => `
  <div class="page-header"><div><div class="breadcrumb">Configuration › <strong>Watchlist</strong></div><h1>Watchlists</h1><div class="page-subtitle">Use watchlists to enrich KQL detections with controlled lists such as VIP users, approved scanners, and Tier 0 apps.</div></div><div class="page-actions"><button class="btn btn-primary" onclick="toast('Watchlist upload simulated.')">+ Add watchlist</button></div></div>
  <div class="card"><div class="card-toolbar"><strong>Watchlists</strong><span class="muted">Local fixture rows</span></div><table class="grid"><thead><tr><th>Name</th><th>Alias</th><th>Items</th><th>Updated</th><th>Detection use</th></tr></thead><tbody>${SENTINEL_WATCHLIST_ROWS.map(w => `<tr><td><strong>${esc(w.name)}</strong></td><td class="kv">${esc(w.alias)}</td><td>${w.items}</td><td>${fmtTime(w.updated)}</td><td>${esc(w.use)}</td></tr>`).join('')}</tbody></table></div>
  <div class="card card-body" style="margin-top:16px;"><div class="alert-section-title">KQL pattern</div><pre class="kql">let VIPs = _GetWatchlist('vip_accounts') | project UserPrincipalName;
SigninLogs
| where UserPrincipalName in (VIPs)
| where RiskLevel == "High"</pre></div>`;

VIEWS['sentinel/settings'] = () => `
  <div class="page-header"><div><div class="breadcrumb">Configuration › <strong>Settings</strong></div><h1>Sentinel settings</h1><div class="page-subtitle">Workspace-level controls for UEBA, retention decisions, and content lifecycle.</div></div></div>
  <div class="two-col">
    <section class="card card-body"><div class="alert-section-title">UEBA enablement</div>
      <div class="setting-row"><div><strong>Entity behavior analytics</strong><span>Builds behavioral context for accounts, hosts, and IPs.</span></div><label class="toggle"><input type="checkbox" checked><span></span></label></div>
      <div class="setting-row"><div><strong>Directory data sync</strong><span>Enriches accounts with department, manager, and role context.</span></div><label class="toggle"><input type="checkbox" checked><span></span></label></div>
      <div class="setting-row"><div><strong>Anomaly enrichment</strong><span>Feeds customizable anomaly rules and hunting pivots.</span></div><label class="toggle"><input type="checkbox" checked><span></span></label></div>
      <a class="chip-link" href="#/sentinel/entity-behavior">Open Entity behavior →</a>
    </section>
    <section class="card card-body"><div class="alert-section-title">Workspace operations</div><ul><li>Use Workspace manager to publish analytics, workbooks, and automation to member workspaces.</li><li>Use Data connectors for DCR-backed Windows, CEF, Azure Activity, and custom ingestion labs.</li><li>Use Analytics and Anomalies for detection engineering coverage.</li></ul><a class="chip-link" href="#/sentinel/workspace-manager">Open Workspace manager →</a></section>
  </div>`;

VIEWS['sentinel/workspace-manager'] = () => {
  const content = [
    { type:'Analytics rules', selected:5, total:SENTINEL_RULES.length, link:'#/sentinel/analytics', detail:'Scheduled, NRT, TI, and ML behavior analytics examples' },
    { type:'Hunting queries', selected:4, total:SAVED_QUERIES.length, link:'#/defender/hunting', detail:'Reusable Advanced hunting and Sentinel search patterns' },
    { type:'Workbooks', selected:3, total:5, link:'#/sentinel/workbooks', detail:'SOC overview, UEBA, and ingestion health panels' },
    { type:'Automation', selected:2, total:3, link:'#/sentinel/automation', detail:'Playbooks and automation rules tied to incident response' },
    { type:'DCR-backed connectors', selected:4, total:SENTINEL_INGESTION_LABS.length + 1, link:'#/sentinel/data-connectors', detail:'Syslog, Windows Security Events, CEF, Azure Activity, custom logs' },
  ];
  return `
    <div class="page-header">
      <div><div class="breadcrumb">Configuration › <strong>Workspace manager</strong></div><h1>Workspace manager</h1><div class="page-subtitle">Central landing surface for packaging, publishing, and tracking Sentinel content across member workspaces.</div></div>
      <div class="page-actions"><a class="btn btn-secondary" href="#/sentinel/analytics">Analytics</a><a class="btn btn-primary" href="#/sentinel/data-connectors">DCR workflows</a></div>
    </div>
    <div class="kpi-strip"><div class="kpi"><span class="kpi-label">Member workspaces</span><span class="kpi-value">${SENTINEL_WORKSPACES.length}</span></div><div class="kpi"><span class="kpi-label">Content types</span><span class="kpi-value">${content.length}</span></div><div class="kpi"><span class="kpi-label">Last publish</span><span class="kpi-value">07:40</span><span class="kpi-delta">2026-07-06</span></div><div class="kpi"><span class="kpi-label">Pending changes</span><span class="kpi-value">3</span></div></div>
    <div class="two-col">
      <section class="card"><div class="card-toolbar"><strong>Member workspaces</strong><span class="muted">Publish target status</span></div><table class="grid"><thead><tr><th>Workspace</th><th>Region</th><th>Tier</th><th>Rules</th><th>Publish status</th><th>Last publish</th></tr></thead><tbody>${SENTINEL_WORKSPACES.map((w, i) => `<tr><td><strong>${esc(w.name)}</strong></td><td>${esc(w.region)}</td><td>${esc(w.tier)}</td><td>${w.ruleIdx.length}</td><td><span class="tag ${i === 2 ? 'orange' : 'green'}">${i === 2 ? 'Pending changes' : 'In sync'}</span></td><td>${i === 2 ? '2026-07-05 16:10' : '2026-07-06 07:40'}</td></tr>`).join('')}</tbody></table></section>
      <section class="card"><div class="card-toolbar"><strong>Content selection</strong><span class="muted">Package for publish</span></div><table class="grid"><thead><tr><th>Content</th><th>Selected</th><th>Scope</th><th>Open</th></tr></thead><tbody>${content.map(c => `<tr><td><strong>${esc(c.type)}</strong><br><span class="muted">${esc(c.detail)}</span></td><td>${c.selected} / ${c.total}</td><td><span class="tag green">Included</span></td><td><a class="chip-link" href="${c.link}">Open →</a></td></tr>`).join('')}</tbody></table></section>
    </div>
    <div class="card card-body" style="margin-top:16px;"><div class="alert-section-title">Publish workflow</div><div class="flowline"><div class="flow-step"><strong>Select content</strong><span>Choose analytics rules, hunting queries, workbooks, automation, and connector-backed DCR labs.</span></div><div class="flow-step"><strong>Validate dependencies</strong><span>Confirm required tables, connectors, watchlists, and UEBA settings exist in each member workspace.</span></div><div class="flow-step"><strong>Publish</strong><span>Distribute the package and record last-publish status per workspace.</span></div><div class="flow-step"><strong>Monitor drift</strong><span>Flag workspaces with changed rules, disabled connectors, or stale automation.</span></div></div></div>`;
};

// ====================================================================
// DEFENDER FOR CLOUD
// ====================================================================
VIEWS['defender-cloud/overview'] = () => `
  <div class="page-header"><div><div class="breadcrumb">Defender for Cloud › <strong>Overview</strong></div><h1>Defender for Cloud</h1></div></div>
  <div class="kpi-strip">
    <div class="kpi"><span class="kpi-label">Secure score</span><span class="kpi-value">65%</span></div>
    <div class="kpi"><span class="kpi-label">Active recommendations</span><span class="kpi-value">${DEFENDER_CLOUD_RECS.length}</span></div>
    <div class="kpi"><span class="kpi-label">Unhealthy resources</span><span class="kpi-value">46</span></div>
    <div class="kpi"><span class="kpi-label">Workload protection plans</span><span class="kpi-value">7/12</span></div>
  </div>
  <div class="two-col">
    <div class="card card-body">
      <div class="alert-section-title">Asset coverage</div>
      <div style="font-size:13px; line-height:1.9;">
        <div>Virtual machines: <strong>23 of 25 covered</strong></div>
        <div class="bar"><i style="width:92%"></i></div>
        <div style="margin-top:8px;">App services: <strong>8 of 14 covered</strong></div>
        <div class="bar warn"><i style="width:57%"></i></div>
        <div style="margin-top:8px;">Storage accounts: <strong>11 of 18 covered</strong></div>
        <div class="bar warn"><i style="width:61%"></i></div>
        <div style="margin-top:8px;">SQL servers: <strong>4 of 4 covered</strong></div>
        <div class="bar"><i style="width:100%"></i></div>
      </div>
    </div>
    <div class="card card-body">
      <div class="alert-section-title">Recommendations by severity</div>
      <div style="font-size:13px; line-height:1.9;">
        <div><span class="sev high">High</span> ${DEFENDER_CLOUD_RECS.filter(r=>r.severity==='high').length} recommendations</div>
        <div><span class="sev medium">Medium</span> ${DEFENDER_CLOUD_RECS.filter(r=>r.severity==='medium').length} recommendations</div>
        <div><span class="sev low">Low</span> ${DEFENDER_CLOUD_RECS.filter(r=>r.severity==='low').length} recommendations</div>
      </div>
      <a class="chip-link" href="#/defender-cloud/recommendations">All recommendations →</a>
    </div>
  </div>
`;

VIEWS['defender-cloud/recommendations'] = () => `
  <div class="page-header"><div><div class="breadcrumb">Defender for Cloud › <strong>Recommendations</strong></div><h1>Recommendations</h1></div></div>
  <div class="filterbar">
    <span class="chip">Severity: <strong>Any</strong> ▾</span>
    <span class="chip">Resource type: <strong>Any</strong> ▾</span>
    <span class="chip">Control: <strong>Any</strong> ▾</span>
  </div>
  <div class="card">
    <table class="grid">
      <thead><tr><th>Severity</th><th>Recommendation</th><th>Control</th><th>Resource type</th><th>Affected</th></tr></thead>
      <tbody>
        ${DEFENDER_CLOUD_RECS.map(r => `
          <tr>
            <td><span class="sev ${r.severity}">${cap(r.severity)}</span></td>
            <td><strong>${esc(r.title)}</strong></td>
            <td>${esc(r.control)}</td>
            <td>${esc(r.resourceType)}</td>
            <td>${r.affected}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
`;

VIEWS['defender-cloud/regulatory'] = () => `
  <div class="page-header"><div><div class="breadcrumb">Defender for Cloud › <strong>Regulatory compliance</strong></div><h1>Regulatory compliance</h1></div></div>
  ${COMPLIANCE_FRAMEWORKS.map(f => `
    <div class="card card-body">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <strong>${esc(f.name)}</strong>
        <span class="muted">${f.passing} passing · ${f.failing} failing</span>
      </div>
      <div class="bar ${f.percent < 60 ? 'warn' : ''}"><i style="width:${f.percent}%"></i></div>
      <div style="font-size:12px; color:var(--fg-muted); margin-top:4px;">${f.percent}% compliant</div>
    </div>
  `).join('')}
`;

VIEWS['defender-cloud/alerts'] = () => `
  <div class="page-header"><div><div class="breadcrumb">Defender for Cloud › <strong>Security alerts</strong></div><h1>Security alerts</h1></div></div>
  <div class="filterbar">
    <span class="chip">Severity: <strong>Any</strong> ▾</span>
    <span class="chip">Status: <strong>New, In progress</strong> ▾</span>
    <span class="chip">Resource type: <strong>Any</strong> ▾</span>
  </div>
  <div class="card">
    <div class="card-toolbar"><strong>${CLOUD_ALERTS.length}</strong> cloud workload alerts</div>
    <table class="grid">
      <thead><tr><th>Severity</th><th>Alert</th><th>Affected resource</th><th>Type</th><th>Status</th><th>Tactics</th><th>Activity start</th></tr></thead>
      <tbody>
        ${CLOUD_ALERTS.map(a => `
          <tr>
            <td><span class="sev ${a.severity}">${cap(a.severity)}</span></td>
            <td><strong>${esc(a.title)}</strong></td>
            <td>${esc(a.resource)}</td>
            <td>${esc(a.type)}</td>
            <td>${esc(a.status)}</td>
            <td>${a.tactics.map(t => `<span class="mitre">${esc(t)}</span>`).join('')}</td>
            <td>${fmtTime(a.time)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
`;

VIEWS['defender-cloud/inventory'] = () => `
  <div class="page-header">
    <div><div class="breadcrumb">Defender for Cloud › <strong>Inventory</strong></div><h1>Inventory</h1><div class="page-subtitle">Cloud resources with workload-protection alerts, recommendations, and exposure context.</div></div>
    <div class="page-actions"><a class="btn btn-secondary" href="#/defender-cloud/attack-paths">Attack paths</a></div>
  </div>
  <div class="kpi-strip">
    <div class="kpi"><span class="kpi-label">Resources</span><span class="kpi-value">${CLOUD_ASSETS.length}</span></div>
    <div class="kpi"><span class="kpi-label">High risk</span><span class="kpi-value">${CLOUD_ASSETS.filter(a=>a.risk==='High').length}</span></div>
    <div class="kpi"><span class="kpi-label">Open alerts</span><span class="kpi-value">${CLOUD_ASSETS.reduce((n,a)=>n+a.alerts,0)}</span></div>
    <div class="kpi"><span class="kpi-label">Recommendations</span><span class="kpi-value">${CLOUD_ASSETS.reduce((n,a)=>n+a.recs,0)}</span></div>
  </div>
  <div class="card">
    <div class="card-toolbar"><strong>Resource inventory</strong><span class="muted">Fictional cloud assets</span></div>
    <table class="grid">
      <thead><tr><th>Risk</th><th>Resource</th><th>Type</th><th>Subscription</th><th>Exposure</th><th>Alerts</th><th>Recommendations</th></tr></thead>
      <tbody>${CLOUD_ASSETS.map(a => `
        <tr>
          <td><span class="sev ${a.risk === 'High' ? 'high' : a.risk === 'Medium' ? 'medium' : 'low'}">${esc(a.risk)}</span></td>
          <td><strong>${esc(a.name)}</strong></td>
          <td>${esc(a.type)}</td>
          <td>${esc(a.subscription)}</td>
          <td>${esc(a.exposure)}</td>
          <td>${a.alerts}</td>
          <td>${a.recs}</td>
        </tr>`).join('')}</tbody>
    </table>
  </div>`;

VIEWS['defender-cloud/attack-paths'] = () => `
  <div class="page-header">
    <div><div class="breadcrumb">Defender for Cloud › <strong>Attack path analysis</strong></div><h1>Attack path analysis</h1><div class="page-subtitle">Reason about exploitable cloud paths that connect exposure, identity permissions, workload alerts, and data assets.</div></div>
    <div class="page-actions"><a class="btn btn-secondary" href="#/defender-cloud/inventory">Inventory</a></div>
  </div>
  <div class="three-col">
    ${CLOUD_ATTACK_PATHS.map(p => `
      <section class="card card-body">
        <span class="sev ${p.severity}">${cap(p.severity)}</span>
        <h2 style="font-size:18px; margin:10px 0 6px;">${esc(p.name)}</h2>
        <div class="muted">Start: ${esc(p.start)}</div>
        <div class="flowline vertical-flow" style="margin-top:12px;">
          ${p.path.map(step => `<div class="flow-step"><strong>Path step</strong><span>${esc(step)}</span></div>`).join('')}
        </div>
        <div class="callout warn" style="margin-top:12px;">${esc(p.result)}</div>
      </section>`).join('')}
  </div>
  <div class="card card-body" style="margin-top:16px;">
    <div class="alert-section-title">Investigation use</div>
    <ul><li>Open attack paths when a Defender for Cloud alert involves an internet-facing or privileged resource.</li><li>Use recommendations to break the path, then verify alerts and inventory status.</li><li>Escalate paths that combine public exposure, privileged identity, and sensitive data access.</li></ul>
  </div>`;

VIEWS['defender-cloud/setup'] = () => `
  <div class="page-header"><div><div class="breadcrumb">Defender for Cloud › <strong>Setup</strong></div><h1>Setup</h1><div class="page-subtitle">Local study surface for enabling workload protection plans and connector coverage.</div></div></div>
  <div class="two-col">
    <section class="card card-body"><div class="alert-section-title">Plan coverage</div><div class="flowline vertical-flow"><div class="flow-step"><strong>Servers Plan 2</strong><span>Enabled for production subscriptions; two lab VMs still need extension health review.</span></div><div class="flow-step"><strong>Containers</strong><span>AKS runtime signal enabled for aks-prod; image scanning feeds recommendations.</span></div><div class="flow-step"><strong>Storage</strong><span>Malware scanning and sensitive data discovery enabled on high-value accounts.</span></div></div></section>
    <section class="card card-body"><div class="alert-section-title">Next routes</div><div class="tile-grid"><a class="tile" href="#/defender-cloud/environment"><strong>Environment settings</strong><span>Subscription and plan configuration.</span></a><a class="tile" href="#/defender-cloud/recommendations"><strong>Recommendations</strong><span>Posture actions that reduce attack paths.</span></a></div></section>
  </div>`;

VIEWS['defender-cloud/explorer'] = () => `
  <div class="page-header"><div><div class="breadcrumb">Defender for Cloud › <strong>Cloud Security Explorer</strong></div><h1>Cloud Security Explorer</h1><div class="page-subtitle">Explore resource queries that combine exposure, alerts, and recommendations.</div></div></div>
  <div class="card card-body">
    <div class="alert-section-title">Saved exploration</div>
    <pre class="kql">Resources
| where InternetExposure == "Public"
| join kind=leftouter SecurityAlerts on ResourceId
| join kind=leftouter Recommendations on ResourceId
| project ResourceName, ResourceType, AlertCount, RecommendationCount, AttackPath</pre>
  </div>
  <div class="card" style="margin-top:16px;">
    <div class="card-toolbar"><strong>Explorer results</strong><a class="chip-link" href="#/defender-cloud/inventory">Open inventory →</a></div>
    <table class="grid"><thead><tr><th>Resource</th><th>Exposure</th><th>Risk</th><th>Reason</th></tr></thead><tbody>${CLOUD_ASSETS.filter(a=>a.risk !== 'Low').map(a => `<tr><td><strong>${esc(a.name)}</strong></td><td>${esc(a.exposure)}</td><td><span class="sev ${a.risk === 'High' ? 'high' : 'medium'}">${esc(a.risk)}</span></td><td>${a.alerts} alert(s), ${a.recs} recommendation(s)</td></tr>`).join('')}</tbody></table>
  </div>`;

VIEWS['defender-cloud/cloud-security'] = () => `
  <div class="page-header"><div><div class="breadcrumb">Defender for Cloud › <strong>Cloud Security</strong></div><h1>Cloud Security</h1><div class="page-subtitle">Workload protection hub for alerts, attack paths, inventory, recommendations, and regulatory context.</div></div></div>
  <div class="tile-grid">
    <a class="tile" href="#/defender-cloud/alerts"><strong>Security alerts</strong><span>Investigate active workload-protection findings.</span></a>
    <a class="tile" href="#/defender-cloud/attack-paths"><strong>Attack paths</strong><span>Break exploitable paths across resources and identities.</span></a>
    <a class="tile" href="#/defender-cloud/inventory"><strong>Inventory</strong><span>Prioritize resources by risk and exposure.</span></a>
    <a class="tile" href="#/defender-cloud/recommendations"><strong>Recommendations</strong><span>Reduce posture findings that feed attack paths.</span></a>
  </div>`;

VIEWS['defender-cloud/environment'] = () => `
  <div class="page-header"><div><div class="breadcrumb">Defender for Cloud › Management › <strong>Environment settings</strong></div><h1>Environment settings</h1><div class="page-subtitle">Subscription-level workload protection and diagnostic collection settings.</div></div></div>
  <div class="card">
    <div class="card-toolbar"><strong>Subscriptions</strong><span class="muted">Lab-static configuration</span></div>
    <table class="grid"><thead><tr><th>Subscription</th><th>Plans</th><th>Log collection</th><th>Status</th><th>Next action</th></tr></thead><tbody>
      <tr><td>sub-prod-001</td><td>Servers, Containers, Storage, SQL</td><td>AMA + diagnostic settings</td><td><span class="tag green">Enabled</span></td><td>Review attack paths</td></tr>
      <tr><td>sub-dev-001</td><td>Servers Plan 1</td><td>Partial diagnostics</td><td><span class="tag orange">Needs review</span></td><td>Enable container plan</td></tr>
      <tr><td>sub-lab-001</td><td>Free posture only</td><td>None</td><td><span class="tag orange">Study only</span></td><td>Document exam scope</td></tr>
    </tbody></table>
  </div>`;

VIEWS['defender-cloud/workflow'] = () => `
  <div class="page-header"><div><div class="breadcrumb">Defender for Cloud › Management › <strong>Workflow automation</strong></div><h1>Workflow automation</h1><div class="page-subtitle">Route Defender for Cloud alerts and recommendations into local response steps.</div></div></div>
  <div class="two-col">
    <section class="card"><div class="card-toolbar"><strong>Automation rules</strong><span class="muted">No real Logic Apps called</span></div><table class="grid"><thead><tr><th>Status</th><th>Trigger</th><th>Action</th><th>Scope</th></tr></thead><tbody>
      <tr><td><span class="tag green">Enabled</span></td><td>High severity security alert</td><td>Create SOC task and notify cloud responder</td><td>sub-prod-001</td></tr>
      <tr><td><span class="tag green">Enabled</span></td><td>Attack path severity high</td><td>Open incident note and link affected assets</td><td>Production resources</td></tr>
      <tr><td><span class="tag orange">Draft</span></td><td>Storage public network recommendation</td><td>Create remediation ticket</td><td>Storage accounts</td></tr>
    </tbody></table></section>
    <section class="card card-body"><div class="alert-section-title">Response mapping</div><ul><li>Workload-protection alerts feed the Defender for Cloud alert queue.</li><li>High-risk attack paths should link to inventory and recommendations.</li><li>Automation in this lab is local-only and represented by static task creation.</li></ul></section>
  </div>`;

// ====================================================================
// PURVIEW
// ====================================================================
VIEWS['purview/home'] = () => `
  <section class="purview-welcome">
    <div class="purview-welcome-visual" aria-label="Connected data estate">
      <div class="purview-source-map">
        ${PURVIEW_CONNECTED_SOURCES.map((s, index) => `
          <button class="purview-source-node ${s.status === 'Connected' ? 'connected' : ''} node-${index}" onclick="navigate('${s.status === 'Connected' ? '#/purview/solutions' : '#/purview/settings'}')">
            <span>${esc(s.icon)}</span>
            <strong>${esc(s.name)}</strong>
          </button>
        `).join('')}
        <div class="purview-cloud-hub">
          <span class="purview-cloud-mark"></span>
          <strong>Microsoft<br>Purview</strong>
        </div>
      </div>
      <div class="purview-connection-status"><span class="status-dot resolved"></span>2 connected sources · 280 discovered assets</div>
    </div>

    <div class="purview-welcome-copy">
      <div class="breadcrumb">Microsoft Purview</div>
      <h1>Welcome to the Microsoft Purview portal</h1>
      <p>
        Use the unified portal for data security, risk and compliance, audit,
        eDiscovery, records, lifecycle, and modern governance workflows across
        Microsoft 365, Azure, and connected third-party data sources.
      </p>
      <div class="purview-consent">
        <label><input type="checkbox" checked disabled> Terms of data-flow disclosure accepted for this lab tenant</label>
        <span>Static lab mode · no real tenant data leaves this browser.</span>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="navigate('#/purview/solutions')">Get started</button>
        <button class="btn btn-secondary" onclick="navigate('#/purview/classic-governance')">Go to classic portal</button>
      </div>
    </div>
  </section>

  <div class="purview-notice">
    <span class="purview-info">i</span>
    <div>
      <strong>Which portal should this lab use?</strong>
      Use the Microsoft Purview portal for current data security, compliance, audit, eDiscovery, records, lifecycle, and modern governance tasks. Use classic only when the lab explicitly references Data Catalog classic, Data Health Insights classic, Workflow classic, Azure-launched Purview accounts, or web.purview.azure.com.
    </div>
  </div>

  <section class="purview-mode-grid" aria-label="Purview portal options">
    <button class="purview-mode-card active" onclick="navigate('#/purview/solutions')">
      <span class="purview-mode-label">New portal</span>
      <strong>Microsoft Purview portal</strong>
      <small>Unified data security, risk and compliance, audit, eDiscovery, records, and lifecycle workflows.</small>
    </button>
    <button class="purview-mode-card classic" onclick="navigate('#/purview/classic-governance')">
      <span class="purview-mode-label">Classic option</span>
      <strong>Classic governance portal</strong>
      <small>Use when a lab step mentions Data Catalog classic, Data Health Insights classic, Workflow classic, or web.purview.azure.com.</small>
    </button>
  </section>

  <section class="purview-solution-strip" aria-label="Purview solutions">
    <button class="purview-solution-card" onclick="navigate('#/purview/classic-governance')">
      <span class="purview-solution-icon">▥</span>
      <strong>Data Catalog classic</strong>
    </button>
    <button class="purview-solution-card" onclick="navigate('#/purview/information-protection')">
      <span class="purview-solution-icon">🔐</span>
      <strong>Information Protection</strong>
    </button>
    <button class="purview-solution-card" onclick="navigate('#/purview/dlp')">
      <span class="purview-solution-icon">🛡</span>
      <strong>Data Loss Prevention</strong>
    </button>
    <button class="purview-solution-card" onclick="navigate('#/purview/insider-risk')">
      <span class="purview-solution-icon">👤</span>
      <strong>Insider Risk Management</strong>
    </button>
    <button class="purview-solution-card" onclick="navigate('#/purview/ai-hub')">
      <span class="purview-solution-icon">✦</span>
      <strong>AI Hub preview</strong>
    </button>
    <button class="purview-solution-card" onclick="navigate('#/purview/solutions')">
      <span class="purview-solution-icon">▦</span>
      <strong>View all solutions →</strong>
    </button>
  </section>

  <div class="section-title">Related portals</div>
  <section class="purview-related-grid">
    ${[
      ['Microsoft Priva', 'Discover privacy risk workflows.', '🔒', '#/purview/solutions'],
      ['Microsoft Fabric', 'Analytics lakehouse and warehouse context.', '▣', '#/sentinel/logs'],
      ['Microsoft Defender', 'Monitor security incidents and alerts.', '🛡', '#/defender/home'],
      ['Microsoft Entra', 'Identity and access context.', '◈', '#/defender/identities'],
      ['Service Trust', 'Compliance resources and trust documentation.', '▤', '#/purview/records'],
    ].map(([name, detail, icon, route]) => `
      <button class="purview-related-card" onclick="navigate('${route}')">
        <span class="purview-related-icon">${icon}</span>
        <div>
          <strong>${name}</strong>
          <small>${detail}</small>
        </div>
        <span class="purview-external">↗</span>
      </button>
    `).join('')}
  </section>
`;

VIEWS['purview/classic-governance'] = () => `
  <div class="page-header">
    <div>
      <div class="breadcrumb">Microsoft Purview › <strong>Classic governance portal</strong></div>
      <h1>Classic Microsoft Purview governance portal</h1>
      <div class="page-subtitle">Support-mode governance experience for older Azure Purview-style lab steps.</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="navigate('#/purview/home')">Back to Purview home</button>
      <button class="btn btn-primary" onclick="navigate('#/purview/home')">Open Microsoft Purview portal</button>
    </div>
  </div>

  <div class="purview-classic-note">
    <strong>Classic support-mode note</strong>
    <span>Use this path when instructions refer to the classic governance portal, a Microsoft Purview account launched from Azure, or <code>web.purview.azure.com</code>. New labs should prefer the unified Purview portal unless the step explicitly calls for classic catalog, insights, or workflow screens.</span>
  </div>

  <div class="kpi-strip">
    <div class="kpi"><span class="kpi-label">Data sources</span><span class="kpi-value">12</span><span class="kpi-delta">Registered in catalog</span></div>
    <div class="kpi"><span class="kpi-label">Assets</span><span class="kpi-value">428</span><span class="kpi-delta">Scanned metadata rows</span></div>
    <div class="kpi"><span class="kpi-label">Glossary terms</span><span class="kpi-value">37</span><span class="kpi-delta">Business taxonomy</span></div>
    <div class="kpi"><span class="kpi-label">Workflows</span><span class="kpi-value">3</span><span class="kpi-delta">Approval demos</span></div>
  </div>

  <div class="two-col">
    <div class="card card-body">
      <div class="card-toolbar" style="padding:0 0 8px; border-bottom:0;">
        <strong>Classic quick access</strong>
        <span class="muted">Role-dependent shortcuts</span>
      </div>
      <div class="classic-action-grid">
        <button class="classic-action">Browse assets</button>
        <button class="classic-action">Manage glossary</button>
        <button class="classic-action">Knowledge center</button>
        <button class="classic-action">View glossary</button>
      </div>
    </div>
    <div class="card card-body">
      <div class="card-toolbar" style="padding:0 0 8px; border-bottom:0;">
        <strong>When to use classic</strong>
      </div>
      <ol class="mini-steps">
        <li>Lab says launch a Microsoft Purview account from Azure portal.</li>
        <li>Lab URL references web.purview.azure.com or a Purview account resource path.</li>
        <li>Task names Data Catalog classic, Data Health Insights classic, or Purview Workflow classic.</li>
        <li>Task asks for classic home features such as catalog analytics, recently accessed assets, or guided tours.</li>
      </ol>
    </div>
  </div>

  <div class="card" style="margin-top:16px;">
    <div class="card-toolbar"><strong>Classic governance features</strong><span class="muted">Mapped to local lab context</span></div>
    <div class="solution-grid">
      ${CLASSIC_PURVIEW_FEATURES.map(f => `
        <button class="solution-card" onclick="navigate('${f.route}')">
          <strong>${esc(f.name)}</strong>
          <span>${esc(f.detail)}</span>
        </button>
      `).join('')}
    </div>
  </div>

  <div class="card" style="margin-top:16px;">
    <div class="card-toolbar"><strong>Recently accessed assets</strong><span class="muted">Classic catalog mock data</span></div>
    <table class="grid">
      <thead><tr><th>Asset</th><th>Type</th><th>Collection</th><th>Owner</th><th>Classification</th></tr></thead>
      <tbody>
        <tr><td><strong>customer-list.xlsx</strong></td><td>Excel workbook</td><td>Finance</td><td>jdoe@contoso.com</td><td><span class="tag">Credit card number</span></td></tr>
        <tr><td><strong>employee-roster.csv</strong></td><td>CSV file</td><td>HR</td><td>maria.ross@contoso.com</td><td><span class="tag">U.S. SSN</span></td></tr>
        <tr><td><strong>audit-export-2026</strong></td><td>Storage path</td><td>Security</td><td>soc@contoso.com</td><td><span class="tag">Operational logs</span></td></tr>
      </tbody>
    </table>
  </div>
`;

VIEWS['purview/solutions'] = () => `
  <div class="page-header">
    <div>
      <div class="breadcrumb">Microsoft Purview › <strong>Solutions</strong></div>
      <h1>Solutions</h1>
      <div class="page-subtitle">Solution cards are grouped by Core, Risk & Compliance, Data Governance, and Data Security.</div>
    </div>
  </div>
  ${['Core','Data Security','Risk & Compliance','Data Governance'].map(area => `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-toolbar"><strong>${esc(area)}</strong></div>
      <div class="solution-grid">
        ${PURVIEW_SOLUTIONS.filter(s => s.area === area).map(s => `
          <button class="solution-card" onclick="navigate('${s.route}')">
            <strong>${esc(s.name)}</strong>
            <span>${esc(s.detail)}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `).join('')}
`;

VIEWS['purview/ai-hub'] = () => `
  <div class="page-header">
    <div>
      <div class="breadcrumb">Microsoft Purview › <strong>AI Hub preview</strong></div>
      <h1>AI Hub preview</h1>
      <div class="page-subtitle">Synthetic view for monitoring AI app usage, risky prompts, and sensitive-data exposure in this lab.</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="navigate('#/purview/dlp')">Review DLP policies</button>
      <button class="btn btn-primary" onclick="navigate('#/purview/audit')">Search audit events</button>
    </div>
  </div>
  <div class="kpi-strip">
    <div class="kpi"><span class="kpi-label">AI apps discovered</span><span class="kpi-value">7</span><span class="kpi-delta">3 sanctioned</span></div>
    <div class="kpi"><span class="kpi-label">Sensitive prompts</span><span class="kpi-value">14</span><span class="kpi-delta bad">4 need review</span></div>
    <div class="kpi"><span class="kpi-label">Labeled files used</span><span class="kpi-value">29</span><span class="kpi-delta">Confidential scope</span></div>
    <div class="kpi"><span class="kpi-label">Policy matches</span><span class="kpi-value">5</span><span class="kpi-delta">DLP + audit</span></div>
  </div>
  <div class="two-col">
    <div class="card">
      <div class="card-toolbar"><strong>Recent AI activity</strong><span class="muted">Lab-only examples</span></div>
      <table class="grid">
        <thead><tr><th>User</th><th>App</th><th>Signal</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>jdoe@contoso.com</td><td>Copilot for Microsoft 365</td><td>Prompt referenced customer-list.xlsx</td><td><span class="tag orange">Review</span></td></tr>
          <tr><td>maria.ross@contoso.com</td><td>Approved summarizer</td><td>Used labeled HR document</td><td><span class="tag green">Allowed</span></td></tr>
          <tr><td>sales.rep@contoso.com</td><td>Unsanctioned AI app</td><td>Browser upload attempted</td><td><span class="tag orange">Blocked</span></td></tr>
        </tbody>
      </table>
    </div>
    <div class="card card-body">
      <div class="alert-section-title">Expected SC-200 workflow</div>
      <ol class="mini-steps">
        <li>Review discovered AI apps and users.</li>
        <li>Pivot sensitive prompts to DLP incidents.</li>
        <li>Use audit search to validate file access and sharing.</li>
        <li>Adjust labels, DLP rules, or allowed app controls.</li>
      </ol>
    </div>
  </div>
`;

VIEWS['purview/dlp'] = () => `
  <div class="page-header"><div><div class="breadcrumb">Purview › <strong>DLP</strong></div><h1>Data loss prevention policies</h1></div></div>
  <div class="card" style="margin-bottom:16px;">
    <div class="card-toolbar"><strong>DLP incidents</strong><span class="muted">SC-200 review and override workflow</span></div>
    <table class="grid">
      <thead><tr><th>Severity</th><th>Incident</th><th>User</th><th>Location</th><th>Sensitive info</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        ${DLP_INCIDENTS.map(i => `
          <tr>
            <td><span class="sev ${i.severity}">${cap(i.severity)}</span></td>
            <td><strong>${esc(i.id)}</strong><br><span class="muted">${esc(i.activity)} · ${fmtTime(i.time)}</span></td>
            <td>${esc(i.user)}</td>
            <td>${esc(i.location)}<br><span class="kv">${esc(i.item)}</span></td>
            <td>${i.sensitiveInfo.map(s => `<span class="tag">${esc(s)}</span>`).join('')}</td>
            <td>${esc(i.status)}</td>
            <td>${i.actions.slice(0,3).map(a => `<span class="entity-chip">${esc(a)}</span>`).join('')}</td>
          </tr>
          <tr class="detail-row"><td></td><td colspan="6">
            <ol class="mini-steps">${i.timeline.map(t => `<li>${esc(t)}</li>`).join('')}</ol>
          </td></tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ${DLP_POLICIES.map(p => `
    <div class="card">
      <div class="card-toolbar">
        <strong>${esc(p.name)}</strong>
        <span><span class="status-dot ${p.enabled?'resolved':'warn'}"></span>${p.enabled?'Enabled':'Disabled'} · ${esc(p.scope)}</span>
      </div>
      <div class="card-body">
        ${p.rules.map(r => `
          <div style="margin-bottom:10px;">
            <strong>${esc(r.name)}</strong>
            <div class="alert-section-title" style="margin:8px 0 4px;">Conditions</div>
            <ul style="margin:0; padding-left:18px; font-size:12px;">${r.conditions.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
            <div class="alert-section-title" style="margin:8px 0 4px;">Actions</div>
            <ul style="margin:0; padding-left:18px; font-size:12px;">${r.actions.map(a => `<li>${esc(a)}</li>`).join('')}</ul>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('')}
`;

VIEWS['purview/insider-risk'] = () => `
  <div class="page-header"><div><div class="breadcrumb">Purview › <strong>Insider risk</strong></div><h1>Insider risk management</h1></div></div>
  <div class="card" style="margin-bottom:16px;">
    <div class="card-toolbar"><strong>Cases</strong><a class="chip-link" href="#/purview/ediscovery">Open eDiscovery →</a></div>
    <table class="grid">
      <thead><tr><th>Priority</th><th>Case</th><th>User</th><th>Risk score</th><th>Evidence</th><th>Next steps</th></tr></thead>
      <tbody>
        ${INSIDER_RISK_CASES.map(c => `
          <tr>
            <td><span class="sev ${c.priority.toLowerCase() === 'high' ? 'high' : 'medium'}">${esc(c.priority)}</span></td>
            <td><strong>${esc(c.id)}</strong><br><span class="muted">${esc(c.policy)} · ${esc(c.status)}</span></td>
            <td>${esc(c.user)}<br><span class="muted">${esc(c.trigger)}</span></td>
            <td><strong>${c.riskScore}</strong></td>
            <td>${c.evidence.map(e => `<span class="tag">${esc(e)}</span>`).join('')}</td>
            <td>${c.nextSteps.map(s => `<span class="entity-chip">${esc(s)}</span>`).join('')}</td>
          </tr>
          <tr class="detail-row"><td></td><td colspan="5">${esc(c.summary)}</td></tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  <div class="card">
    <table class="grid">
      <thead><tr><th>Policy</th><th>Status</th><th>Alerts</th><th>Triggers</th></tr></thead>
      <tbody>
        ${INSIDER_RISK_POLICIES.map(p => `
          <tr>
            <td><strong>${esc(p.name)}</strong></td>
            <td><span class="tag ${p.status==='Active'?'green':'orange'}">${esc(p.status)}</span></td>
            <td>${p.alerts}</td>
            <td><span class="muted" style="font-size:12px;">${p.triggers.map(esc).join(' · ')}</span></td>
          </tr>`).join('')}
      </tbody>
    </table>
  </div>
`;

VIEWS['purview/communication-compliance'] = () => `
  <div class="page-header">
    <div><div class="breadcrumb">Purview › <strong>Communication compliance</strong></div><h1>Communication compliance</h1></div>
  </div>
  <div class="card">
    <div class="card-toolbar"><strong>${COMMUNICATION_REVIEWS.length}</strong> items pending or recently reviewed</div>
    <table class="grid">
      <thead><tr><th>Severity</th><th>Review</th><th>User</th><th>Channel</th><th>Detected condition</th><th>Status</th></tr></thead>
      <tbody>
        ${COMMUNICATION_REVIEWS.map(r => `
          <tr>
            <td><span class="sev ${r.severity}">${cap(r.severity)}</span></td>
            <td><strong>${esc(r.id)}</strong><br><span class="muted">${esc(r.policy)}</span></td>
            <td>${esc(r.user)}</td>
            <td>${esc(r.channel)}</td>
            <td>${esc(r.detected)}<br><span class="muted">${esc(r.message)}</span></td>
            <td>${esc(r.status)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
`;

VIEWS['purview/graph-activity'] = () => {
  const rows = MOCK_QUERY_RESULTS.MicrosoftGraphActivityLogs || [];
  return `
    <div class="page-header">
      <div>
        <div class="breadcrumb">Purview › <strong>Microsoft Graph activity logs</strong></div>
        <h1>Microsoft Graph activity logs</h1>
        <div class="page-subtitle">Investigation guidance and fixture rows for API activity after OAuth consent, risky sign-ins, or compromised-token events.</div>
      </div>
      <div class="page-actions">
        <a class="btn btn-secondary" href="#/defender/hunting">Advanced hunting</a>
        <a class="btn btn-primary" href="#/purview/audit">Audit search</a>
      </div>
    </div>
    <div class="three-col">
      ${GRAPH_ACTIVITY_GUIDANCE.map(g => `
        <div class="card card-body">
          <div class="alert-section-title">${esc(g.title)}</div>
          <p class="muted">${esc(g.detail)}</p>
        </div>
      `).join('')}
    </div>
    <div class="two-col" style="margin-top:16px; grid-template-columns: 1fr 340px;">
      <div class="card">
        <div class="card-toolbar"><strong>MicrosoftGraphActivityLogs fixture rows</strong><span class="muted">${rows.length} rows</span></div>
        <table class="grid">
          <thead><tr><th>Time</th><th>User</th><th>App</th><th>Operation</th><th>Request</th><th>IP</th><th>Status</th></tr></thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td>${fmtTime(r.TimeGenerated)}</td>
                <td>${esc(r.UserPrincipalName)}</td>
                <td><strong>${esc(r.AppDisplayName)}</strong><br><span class="muted">${esc(r.AppId)}</span></td>
                <td>${esc(r.Operation)}</td>
                <td class="kv">${esc(r.RequestUri)}</td>
                <td>${esc(r.IPAddress)}</td>
                <td>${esc(r.ResultStatus)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="card card-body">
        <div class="alert-section-title">Hunting query</div>
        <pre class="kql-snippet">MicrosoftGraphActivityLogs
| where AppDisplayName == "DocViewer Pro"
| project TimeGenerated, UserPrincipalName, AppDisplayName, Operation, RequestUri, IPAddress, ResultStatus</pre>
        <div class="alert-section-title">Use with</div>
        <div class="connector-list">
          <div><strong>Threat analytics</strong><span>Validate affected assets and exposed apps.</span></div>
          <div><strong>CloudAppEvents</strong><span>Correlate consent grants and app governance events.</span></div>
          <div><strong>Purview Audit</strong><span>Confirm user-visible mailbox and file operations.</span></div>
        </div>
      </div>
    </div>
  `;
};

VIEWS['purview/ediscovery'] = () => `
  <div class="page-header">
    <div>
      <div class="breadcrumb">Purview › <strong>eDiscovery</strong></div>
      <h1>eDiscovery cases</h1>
      <div class="page-subtitle">Build a Content search, preview matching evidence, then prepare an investigation export.</div>
    </div>
  </div>
  <div class="three-col">
    ${EDISCOVERY_CASES.map(c => `
      <div class="card card-body">
        <div class="card-toolbar" style="padding:0 0 8px; border-bottom:0;">
          <strong>${esc(c.name)}</strong>
          <span class="tag ${c.status === 'Active' ? 'green' : 'orange'}">${esc(c.status)}</span>
        </div>
        <div class="muted">${esc(c.id)} · linked to ${esc(c.linkedCase)}</div>
        <div class="alert-section-title">Custodians</div>
        ${c.custodians.map(x => `<span class="entity-chip">${esc(x)}</span>`).join('')}
        <div class="alert-section-title">Sources and holds</div>
        ${c.sources.concat(c.holds).map(x => `<span class="tag">${esc(x)}</span>`).join('')}
        <div class="alert-section-title">Searches</div>
        <ol class="mini-steps">${c.searches.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      </div>
    `).join('')}
  </div>
  <div class="card" style="margin-top:16px;">
    <div class="card-toolbar">
      <strong>Content search workflow</strong>
      <span class="muted">${esc(EDISCOVERY_CONTENT_SEARCH.caseId)} · ${esc(EDISCOVERY_CONTENT_SEARCH.name)}</span>
    </div>
    <div class="two-col" style="grid-template-columns: 340px 1fr; padding:14px;">
      <div>
        <div class="alert-section-title">Build search</div>
        <div class="connector-list">
          <div><strong>Query</strong><span class="kv">${esc(EDISCOVERY_CONTENT_SEARCH.query)}</span></div>
          <div><strong>Locations</strong><span>${EDISCOVERY_CONTENT_SEARCH.locations.map(x => `<span class="tag">${esc(x)}</span>`).join('')}</span></div>
          <div><strong>Conditions</strong><span>${EDISCOVERY_CONTENT_SEARCH.conditions.map(x => `<span class="tag">${esc(x)}</span>`).join('')}</span></div>
        </div>
        <div class="alert-section-title">Export for investigation</div>
        <ol class="mini-steps">${EDISCOVERY_CONTENT_SEARCH.export.map(x => `<li>${esc(x)}</li>`).join('')}</ol>
      </div>
      <div>
        <div class="alert-section-title">Preview results</div>
        <table class="grid">
          <thead><tr><th>Location</th><th>Item</th><th>Custodian</th><th>Date</th><th>Match</th></tr></thead>
          <tbody>
            ${EDISCOVERY_CONTENT_SEARCH.preview.map(r => `
              <tr>
                <td>${esc(r.location)}<br><span class="muted">${esc(r.kind)}</span></td>
                <td><strong>${esc(r.item)}</strong></td>
                <td>${esc(r.custodian)}</td>
                <td>${fmtTime(r.date)}</td>
                <td>${esc(r.match)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="callout info" style="margin-top:12px;">${esc(EDISCOVERY_CONTENT_SEARCH.interpretation)}</div>
      </div>
    </div>
  </div>
`;

VIEWS['purview/records'] = () => `
  <div class="page-header">
    <div><div class="breadcrumb">Purview › <strong>Records management</strong></div><h1>Records management</h1></div>
  </div>
  <div class="card">
    <div class="card-toolbar"><strong>Retention and record labels</strong></div>
    <table class="grid">
      <thead><tr><th>Status</th><th>Name</th><th>Type</th><th>Locations</th><th>Disposition</th></tr></thead>
      <tbody>
        ${RECORD_LABELS.map(r => `
          <tr>
            <td><span class="status-dot resolved"></span>${esc(r.status)}</td>
            <td><strong>${esc(r.name)}</strong></td>
            <td>${esc(r.type)}</td>
            <td>${esc(r.locations)}</td>
            <td>${esc(r.disposition)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
`;

VIEWS['purview/lifecycle'] = () => `
  <div class="page-header">
    <div><div class="breadcrumb">Purview › <strong>Data lifecycle management</strong></div><h1>Data lifecycle management</h1></div>
  </div>
  <div class="card">
    <div class="card-toolbar"><strong>Lifecycle policies</strong></div>
    <table class="grid">
      <thead><tr><th>Status</th><th>Policy</th><th>Scope</th><th>Rule</th><th>Action</th></tr></thead>
      <tbody>
        ${LIFECYCLE_POLICIES.map(p => `
          <tr>
            <td><span class="tag ${p.status === 'Active' ? 'green' : 'orange'}">${esc(p.status)}</span></td>
            <td><strong>${esc(p.name)}</strong></td>
            <td>${esc(p.scope)}</td>
            <td>${esc(p.rule)}</td>
            <td>${esc(p.action)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
`;

VIEWS['purview/settings'] = () => `
  <div class="page-header">
    <div>
      <div class="breadcrumb">Microsoft Purview › <strong>Settings</strong></div>
      <h1>Settings</h1>
      <div class="page-subtitle">Centralized portal and solution settings, matching the new Purview portal model.</div>
    </div>
  </div>
  <div class="three-col">
    <div class="card card-body"><div class="alert-section-title">Portal-wide</div><span class="entity-chip">Themes</span><span class="entity-chip">Language and time zone</span><span class="entity-chip">Contact preferences</span></div>
    <div class="card card-body"><div class="alert-section-title">Solution settings</div><span class="entity-chip">DLP</span><span class="entity-chip">Insider risk</span><span class="entity-chip">Audit</span><span class="entity-chip">eDiscovery</span></div>
    <div class="card card-body"><div class="alert-section-title">Roles and scopes</div><span class="entity-chip">Role groups</span><span class="entity-chip">Administrative units</span><span class="entity-chip">PIM delay note</span></div>
  </div>
`;

VIEWS['purview/information-protection'] = () => `
  <div class="page-header"><div><div class="breadcrumb">Purview › <strong>Information protection</strong></div><h1>Sensitivity labels</h1></div></div>
  <div class="two-col">
    <div class="card">
      <div class="card-toolbar"><strong>${SENSITIVITY_LABELS.length}</strong> labels</div>
      <table class="grid">
        <thead><tr><th>Label</th><th>Protection</th></tr></thead>
        <tbody>
          ${SENSITIVITY_LABELS.map(l => `
            <tr>
              <td><span class="status-dot" style="background:${l.color}"></span><strong>${esc(l.name)}</strong></td>
              <td>${esc(l.protection)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="card">
      <div class="card-toolbar"><strong>Label policies</strong></div>
      <div class="card-body">
        ${LABEL_POLICIES.map(p => `
          <div style="margin-bottom:14px;">
            <strong>${esc(p.name)}</strong> <span class="tag green">${esc(p.status)}</span>
            <div class="muted" style="font-size:12px;">${esc(p.users)} · ${p.labels.map(esc).join(', ')}</div>
            <ul style="margin:6px 0 0; padding-left:18px; font-size:12px; line-height:1.6;">${p.settings.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
          </div>
        `).join('')}
      </div>
    </div>
  </div>
  <div class="card" style="margin-top:16px;">
    <div class="card-toolbar"><strong>Recent labeling activity</strong></div>
    <table class="grid">
      <thead><tr><th>Time</th><th>User</th><th>File</th><th>Label</th><th>Action</th></tr></thead>
      <tbody>${LABEL_ACTIVITY.map(a => `
        <tr><td>${fmtTime(a.time)}</td><td>${esc(a.user)}</td><td class="kv">${esc(a.file)}</td><td>${esc(a.label)}</td><td>${esc(a.action)}</td></tr>
      `).join('')}</tbody>
    </table>
  </div>
`;

VIEWS['purview/audit'] = () => ({
  html: `
    <div class="page-header"><div><div class="breadcrumb">Purview › <strong>Audit</strong></div><h1>Audit search</h1></div></div>
    <div class="card card-body">
      <div class="two-col">
        <div><label class="lbl">Activities</label><input id="audit-op" class="ipt" placeholder="FileDownloaded, UserLoggedIn, any"></div>
        <div><label class="lbl">Users</label><input id="audit-user" class="ipt" placeholder="user@contoso.com"></div>
      </div>
      <div class="two-col" style="margin-top:8px;">
        <div><label class="lbl">Workload</label><input id="audit-workload" class="ipt" placeholder="AzureAD, SharePoint, OneDrive"></div>
        <div><label class="lbl">IP address</label><input id="audit-ip" class="ipt" placeholder="76.21.55.4"></div>
      </div>
      <div style="margin-top:8px;"><button id="audit-search" class="btn btn-primary">Search</button></div>
    </div>
    <div class="card" id="audit-results"></div>
  `,
  onMount: () => {
    function auditRows(rows) {
      return `
        <div class="card-toolbar"><strong>${rows.length}</strong> results</div>
        <table class="grid">
          <thead><tr><th>Date (UTC)</th><th>User</th><th>Operation</th><th>Workload</th><th>Item</th><th>IP</th></tr></thead>
          <tbody>
            ${rows.map(a => `
              <tr>
                <td>${fmtTime(a.time)}</td><td>${esc(a.user)}</td>
                <td><strong>${esc(a.op)}</strong></td>
                <td>${esc(a.workload)}</td>
                <td class="kv">${esc(a.item)}</td>
                <td>${esc(a.ip)}</td>
              </tr>`).join('') || '<tr><td colspan="6" class="muted">No matching audit events.</td></tr>'}
          </tbody>
        </table>`;
    }
    function value(id) { return document.getElementById(id).value.trim().toLowerCase(); }
    function runAuditSearch() {
      const op = value('audit-op');
      const user = value('audit-user');
      const workload = value('audit-workload');
      const ip = value('audit-ip');
      const rows = AUDIT_LOG.filter(a =>
        (!op || op === 'any' || a.op.toLowerCase().includes(op)) &&
        (!user || a.user.toLowerCase().includes(user)) &&
        (!workload || a.workload.toLowerCase().includes(workload)) &&
        (!ip || a.ip.toLowerCase().includes(ip)));
      document.getElementById('audit-results').innerHTML = auditRows(rows);
    }
    document.getElementById('audit-search').addEventListener('click', runAuditSearch);
    ['audit-op','audit-user','audit-workload','audit-ip'].forEach(id =>
      document.getElementById(id).addEventListener('keydown', e => {
        if (e.key === 'Enter') runAuditSearch();
      }));
    runAuditSearch();
  }
});

// ====================================================================
// Helper renderers used by side panels (called from app.js)
// ====================================================================
function renderAlertDetail(a) {
  const rule = matchedRule(a);
  return `
    <dl class="alert-meta">
      <dt>Alert ID</dt><dd>${esc(a.id)}</dd>
      <dt>Severity</dt><dd><span class="sev ${a.severity}">${cap(a.severity)}</span></dd>
      <dt>Status</dt><dd>${rule ? `<span class="tag green">Suppressed by "${esc(rule.name)}"</span>` : esc(a.status)}</dd>
      <dt>Category</dt><dd>${esc(a.category)}</dd>
      <dt>Detection source</dt><dd>${esc(a.detectionSource)}</dd>
      <dt>Asset</dt><dd>${esc(a.asset)}</dd>
      <dt>First activity</dt><dd>${fmtTime(a.firstActivity)}</dd>
      ${a.incidentId ? `<dt>Incident</dt><dd><a href="#" onclick="openIncident('${a.incidentId}'); return false;">${esc(a.incidentId)}</a></dd>` : ''}
    </dl>
    <div class="alert-section-title">Evidence</div>
    <div class="kv">${Object.entries(a.event).map(([k,v]) => `<div><span class="k">${esc(k)}:</span> ${esc(v)}</div>`).join('')}</div>
    ${a.note ? `<div class="alert-section-title">Lab note</div><div class="callout warn">${esc(a.note)}</div>` : ''}
    <div class="alert-section-title">Suppression rule evaluation</div>
    <div class="kv">${ruleEvalSummary(a)}</div>
    <div class="sidepanel-footer">
      <button class="btn btn-primary" onclick="openRulePanel('${a.id}')">Create suppression rule from alert</button>
    </div>`;
}

function ruleEvalSummary(a) {
  if (rules.length === 0) return '<div class="muted">No suppression rules defined.</div>';
  return rules.map(r => {
    const parts = r.conditions.map(c => {
      const ok = a.event[c.field] === c.value;
      const want = c.field === 'sha256' ? c.value.slice(0,12) + '…' : c.value;
      const actual = a.event[c.field];
      const got = c.field === 'sha256' && actual ? actual.slice(0,12) + '…' : actual;
      return `  ${ok?'✓':'✗'} ${fieldLabel(c.field)} == ${esc(want)}  (event: ${esc(got ?? 'n/a')})`;
    }).join('<br>');
    const overall = r.conditions.every(c => a.event[c.field] === c.value);
    return `<div><strong>${esc(r.name)}</strong> — ${overall?'MATCH (suppressed)':'no match'}<br>${parts}</div>`;
  }).join('<br>');
}

function attackStoryFor(inc, incAlerts) {
  const story = ATTACK_STORIES[inc.id];
  if (story) return story;
  const nodes = inc.entities.map((e, index) => ({
    id:`${inc.id}-entity-${index}`,
    type:e.type,
    label:e.name,
    verdict:index === 0 ? 'Suspicious' : 'Related',
    evidence:incAlerts.map(a => `${a.title} on ${a.asset}`).slice(0, 3),
    remediation:e.type === 'User' ? 'Review sign-ins, revoke sessions, and reset credentials if activity is suspicious.'
      : e.type === 'Device' ? 'Inspect device timeline, collect package, and isolate if malicious activity is confirmed.'
      : 'Inspect related alerts and pivot to hunting for broader scope.',
  }));
  const edges = nodes.slice(0, -1).map((n, index) => ({
    from:n.id,
    to:nodes[index + 1].id,
    label:index === 0 ? 'related to' : 'pivoted to',
  }));
  const steps = incAlerts.map((a, index) => ({
    time:a.firstActivity,
    node:nodes[Math.min(index, Math.max(nodes.length - 1, 0))]?.id,
    alertId:a.id,
    title:a.title,
    detail:`${a.detectionSource} alert on ${a.asset}.`,
  }));
  return { nodes, edges, steps };
}

function deviceExists(name) {
  return DEVICES.some(d => d.id === name || d.name === name);
}

function entityTypeForName(inc, name) {
  const entity = inc.entities.find(e => e.name === name);
  if (entity) return entity.type;
  return deviceExists(name) ? 'Device' : 'Entity';
}

function clickableEntity(type, name) {
  const isDevice = type === 'Device' && deviceExists(name);
  const label = `${type}: ${name}`;
  return `<button class="entity-chip clickable" onclick="event.stopPropagation(); openEntityPivot('${esc(type)}', '${esc(name)}')">
    ${isDevice ? 'Open device: ' : ''}<strong>${esc(isDevice ? name : label)}</strong>
  </button>`;
}

function renderAttackStory(inc, incAlerts) {
  const story = attackStoryFor(inc, incAlerts);
  const activeStep = story.steps[0] || {};
  const activeNode = story.nodes.find(node => node.id === activeStep.node) || story.nodes[0] || {};
  return `
    <div class="attack-story" data-incident-id="${esc(inc.id)}">
      <div class="attack-story-toolbar">
        <div>
          <strong>Attack story</strong>
          <span>Replay the incident graph, inspect entity evidence, and keep response actions in the same context.</span>
        </div>
        <div class="attack-story-actions">
          <button class="btn btn-secondary btn-sm" onclick="setAttackStoryStep('${esc(inc.id)}', 0)">Reset</button>
          <button class="btn btn-primary btn-sm" onclick="playAttackStory('${esc(inc.id)}')">Play attack story</button>
        </div>
      </div>
      ${renderIncidentGraph(inc.id, story, activeStep.node)}
      <div class="attack-story-stage">
        <div class="attack-story-now" data-story-now>
          ${story.steps.length ? `
            <div class="t-time">${fmtTime(story.steps[0].time)}</div>
            <div class="t-title">${esc(story.steps[0].title)}</div>
            <p>${esc(story.steps[0].detail)}</p>
            <div class="attack-story-actions-inline">
              <button class="btn btn-secondary btn-sm" onclick="openAlert('${esc(story.steps[0].alertId)}')">Open alert</button>
              <button class="btn btn-secondary btn-sm" onclick="navigate('#/defender/hunting')">Go hunt</button>
            </div>
            <div class="attack-story-remediation"><strong>Response action:</strong> ${esc(story.steps[0].remediation || activeNode.remediation || 'Review the entity details and choose the least disruptive containment action.')}</div>
          ` : '<div class="muted">No ordered alerts available for this incident.</div>'}
        </div>
          <div class="attack-story-entity" data-story-entity>
          <div class="attack-entity-kicker">${esc(activeNode.type || 'Entity')}</div>
          <div class="attack-entity-title">${esc(activeNode.label || 'No entity selected')}</div>
          <dl class="attack-entity-meta">
            <dt>Related alerts</dt><dd>${story.steps.filter(step => step.node === activeNode.id).length || 'None highlighted'}</dd>
            <dt>Verdict</dt><dd>${esc(activeNode.verdict || 'Suspicious')}</dd>
            <dt>Remediation</dt><dd>${esc(activeNode.remediation || 'Review evidence, validate verdict, then contain or dismiss.')}</dd>
          </dl>
          <div class="attack-entity-subtitle">Evidence and response</div>
          <div class="attack-entity-actions">
            ${activeNode.type === 'Device' && deviceExists(activeNode.label)
              ? `<button class="btn btn-primary btn-sm" onclick="openDevice('${esc(activeNode.label)}')">Open device page</button>`
              : `<button class="btn btn-secondary btn-sm" onclick="toast('Entity pivot opened for ${esc(activeNode.type || 'entity')} (lab stub).')">Open entity page</button>`}
            <button class="btn btn-primary btn-sm" onclick="viewBlastRadius('${esc(inc.id)}', '${esc(activeNode.id || '')}')">View blast radius</button>
            <button class="btn btn-secondary btn-sm" onclick="navigate('#/defender/hunting')">Go hunt</button>
          </div>
          <ul class="attack-evidence-list">
            ${(activeNode.evidence || story.steps.filter(step => step.node === activeNode.id).map(step => step.title)).map(item => `<li>${esc(item)}</li>`).join('') || '<li>No evidence attached to this entity.</li>'}
          </ul>
          <div class="attack-related-alerts">
            ${story.steps.map((step, index) => `
              <button class="${index === 0 ? 'active' : ''}" data-story-alert="${esc(step.alertId)}"
                onclick="setAttackStoryStep('${esc(inc.id)}', ${index})">
                ${esc(step.alertId)} · ${esc(step.title)}
              </button>
            `).join('')}
          </div>
        </div>
        <ol class="attack-story-events">
          ${story.steps.map((step, index) => `
            <li class="${index === 0 ? 'active' : ''}" data-story-step="${index}" onclick="setAttackStoryStep('${esc(inc.id)}', ${index})">
              <span>${fmtTime(step.time)}</span>
              <strong>${esc(step.title)}</strong>
              <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); openAlert('${esc(step.alertId)}')">${esc(step.alertId)}</button>
            </li>
          `).join('')}
        </ol>
      </div>
      <div class="hidden" data-story-json="${esc(JSON.stringify(story))}"></div>
    </div>
  `;
}

function graphPoint(node, index, counts) {
  const ring = Number(node.ring || 0);
  if (ring === 0) return { x: 50, y: 47 };
  const total = counts[ring] || 1;
  const pos = counts['_seen_' + ring] = (counts['_seen_' + ring] || 0) + 1;
  const angleSets = {
    1: [-118, -64, -16, 34, 82, 146],
    2: [-150, -112, -74, -36, 0, 36, 74, 112, 150, 180],
  };
  const angles = angleSets[ring] || [-150, -90, -30, 30, 90, 150];
  const angle = (angles[pos - 1] ?? (-160 + ((pos - 1) * 320 / Math.max(total - 1, 1)))) * Math.PI / 180;
  const radiusX = ring === 1 ? 24 : 41;
  const radiusY = ring === 1 ? 23 : 38;
  return {
    x: Math.max(8, Math.min(92, 50 + Math.cos(angle) * radiusX)),
    y: Math.max(10, Math.min(88, 47 + Math.sin(angle) * radiusY)),
  };
}

function graphLayout(story) {
  const counts = {};
  story.nodes.forEach(node => { counts[node.ring || 0] = (counts[node.ring || 0] || 0) + 1; });
  return story.nodes.reduce((map, node, index) => {
    map[node.id] = graphPoint(node, index, counts);
    return map;
  }, {});
}

function renderIncidentGraph(incidentId, story, activeNodeId) {
  const layout = graphLayout(story);
  return `
    <div class="attack-web" data-graph-web>
      <svg class="attack-web-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        ${story.edges.map(edge => {
          const from = layout[edge.from];
          const to = layout[edge.to];
          if (!from || !to) return '';
          return `<line class="attack-web-line ${esc(edge.kind || 'related')}" data-edge-from="${esc(edge.from)}" data-edge-to="${esc(edge.to)}" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" />`;
        }).join('')}
      </svg>
      ${story.edges.map(edge => {
        const from = layout[edge.from];
        const to = layout[edge.to];
        if (!from || !to) return '';
        const x = (from.x + to.x) / 2;
        const y = (from.y + to.y) / 2;
        return `<span class="attack-web-edge-label ${esc(edge.kind || 'related')}" style="left:${x}%; top:${y}%;">${esc(edge.label)}</span>`;
      }).join('')}
      ${story.nodes.map(node => {
        const point = layout[node.id];
        const initials = node.type === 'IP' ? 'IP' : (node.type || 'E').split(/\s+/).map(w => w[0]).join('').slice(0, 3);
        return `
          <button class="attack-web-node ${activeNodeId === node.id ? 'active' : ''} ring-${esc(node.ring || 0)}" type="button"
            data-node-id="${esc(node.id)}" style="left:${point.x}%; top:${point.y}%;"
            title="${esc(node.type)}: ${esc(node.label)}" onclick="selectAttackStoryNode('${esc(incidentId)}', '${esc(node.id)}')">
            <span class="attack-web-node-icon">${esc(initials)}</span>
            <span class="attack-web-node-label">${esc(node.label)}</span>
            <span class="attack-web-node-type">${esc(node.type)}</span>
          </button>`;
      }).join('')}
    </div>
  `;
}

function shortestGraphPath(story, sourceId, targetId) {
  const next = {};
  story.edges.forEach(edge => {
    (next[edge.from] ||= []).push(edge.to);
    if (edge.kind !== 'attack') (next[edge.to] ||= []).push(edge.from);
  });
  const queue = [[sourceId]];
  const seen = new Set([sourceId]);
  while (queue.length) {
    const path = queue.shift();
    const last = path[path.length - 1];
    if (last === targetId) return path;
    (next[last] || []).forEach(id => {
      if (!seen.has(id)) {
        seen.add(id);
        queue.push([...path, id]);
      }
    });
  }
  return [sourceId, targetId];
}

function topBlastPaths(story, sourceId) {
  const source = story.nodes.find(n => n.id === sourceId) || story.nodes[0];
  const targets = story.nodes
    .filter(node => node.id !== source.id && (node.ring >= 2 || /risk|critical|admin|cfo|finance|backup|pki|payroll|legal/i.test(`${node.verdict} ${node.label}`)))
    .map(node => {
      const path = shortestGraphPath(story, source.id, node.id);
      const score = (node.ring || 0) * 20 + (/critical|at risk|malicious/i.test(node.verdict || '') ? 20 : 0) - path.length;
      return { target: node, path, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
  return { source, paths: targets };
}

function renderBlastRadiusGraph(story, sourceId) {
  const blast = topBlastPaths(story, sourceId);
  const nodes = [blast.source, ...blast.paths.map(p => p.target)];
  const layout = nodes.reduce((map, node, index) => {
    if (index === 0) map[node.id] = { x: 50, y: 50 };
    else {
      const angle = (-150 + (index - 1) * (300 / Math.max(blast.paths.length - 1, 1))) * Math.PI / 180;
      map[node.id] = { x: 50 + Math.cos(angle) * 41, y: 50 + Math.sin(angle) * 38 };
    }
    return map;
  }, {});
  return `
    <div class="blast-web" data-blast-web>
      <div class="blast-web-head">
        <div>
          <div class="attack-entity-kicker">Blast radius</div>
          <div class="attack-entity-title">${esc(blast.source.label)}</div>
          <p>Initial view: graph showing the 8 top-rated attack paths from the selected node.</p>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="restoreAttackStoryEntity()">Back to node</button>
      </div>
      <div class="blast-web-canvas">
        <svg class="attack-web-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          ${blast.paths.map(path => {
            const from = layout[blast.source.id];
            const to = layout[path.target.id];
            return `<line class="attack-web-line blast active" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" />`;
          }).join('')}
        </svg>
        ${nodes.map((node, index) => `
          <div class="blast-web-node ${index === 0 ? 'source' : ''}" style="left:${layout[node.id].x}%; top:${layout[node.id].y}%;">
            <span>${esc(index === 0 ? 'Source' : node.type)}</span>
            <strong>${esc(node.label)}</strong>
          </div>
        `).join('')}
      </div>
      <div class="blast-full-list">
        <button class="btn btn-secondary btn-sm" onclick="toast('Full blast radius list opened on the right-side panel (lab stub).')">View full blast radius list</button>
        ${blast.paths.map((path, index) => `
          <div class="blast-list-row">
            <strong>${index + 1}. ${esc(path.target.label)}</strong>
            <span>${esc(path.path.map(id => story.nodes.find(n => n.id === id)?.label || id).join(' -> '))}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function verdictDot(v) {
  const key = (v || '').toLowerCase();
  return `<span class="verdict-dot ${key}"></span>${esc(v)}`;
}

function remediationPill(r) {
  const key = (r || '').toLowerCase().replace(/\s+/g, '-');
  return `<span class="remediation-pill ${key}">${esc(r)}</span>`;
}

function renderIncidentSummary(inc, incAlerts) {
  const tacticCounts = {};
  inc.tactics.forEach(t => { tacticCounts[t] = (tacticCounts[t] || 0) + 1; });
  const entityCounts = {};
  inc.entities.forEach(e => { entityCounts[e.type] = (entityCounts[e.type] || 0) + 1; });
  const evidence = INCIDENT_EVIDENCE[inc.id] || [];
  return `
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-card-title">Alerts and categories</div>
        <div class="summary-kill-chain">
          ${inc.tactics.map(t => `<span class="kill-chain-step">${esc(t)}</span>`).join('<span class="kill-chain-arrow">›</span>')}
        </div>
        <div class="summary-card-foot">${incAlerts.length} alert${incAlerts.length===1?'':'s'} across ${inc.tactics.length} tactic${inc.tactics.length===1?'':'s'}</div>
      </div>
      <div class="summary-card">
        <div class="summary-card-title">Scope</div>
        <ul class="summary-scope">
          ${Object.entries(entityCounts).map(([k,v]) => `<li><strong>${v}</strong> ${esc(k)}${v>1?'s':''}</li>`).join('')}
        </ul>
      </div>
      <div class="summary-card">
        <div class="summary-card-title">Evidence</div>
        <div class="summary-evidence-row">
          <span><strong>${evidence.length}</strong> entities</span>
          <span class="verdict-malicious">${evidence.filter(e=>e.verdict==='Malicious').length} malicious</span>
          <span class="verdict-suspicious">${evidence.filter(e=>e.verdict==='Suspicious').length} suspicious</span>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-card-title">Incident information</div>
        <dl class="summary-info">
          <dt>Status</dt><dd>${esc(inc.status)}</dd>
          <dt>Severity</dt><dd><span class="sev ${inc.severity}">${cap(inc.severity)}</span></dd>
          <dt>Assigned</dt><dd>${esc(inc.assignedTo)}</dd>
        </dl>
      </div>
    </div>`;
}

function renderIncidentActivities(inc) {
  const items = (INCIDENT_ACTIVITIES[inc.id] || []).concat((inc.disruptionActions || []).map(a => ({
    time:a.time,
    origin:'System',
    category:'Attack disruption',
    performedBy:'Automatic attack disruption',
    detail:`${a.action}: ${a.target}. ${a.result}`,
  })));
  if (!items.length) {
    return `<div class="muted">No analyst or automation activity recorded for this incident yet. The Activities tab shows manual and automated actions in a unified timeline.</div>`;
  }
  return `
    <table class="grid activities-grid">
      <thead><tr><th>Time</th><th>Origin</th><th>Category</th><th>Performed by</th><th>Detail</th></tr></thead>
      <tbody>
        ${items.map(a => `
          <tr>
            <td>${fmtTime(a.time)}</td>
            <td><span class="origin-pill ${a.origin.toLowerCase()}">${esc(a.origin)}</span></td>
            <td>${esc(a.category)}</td>
            <td>${esc(a.performedBy)}</td>
            <td>${esc(a.detail)}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function renderIncidentEvidence(inc) {
  const items = INCIDENT_EVIDENCE[inc.id];
  if (!items) {
    return `<div class="muted">Defender XDR auto-analyzes events and entities and tags them Malicious, Suspicious, or Clean with a remediation status. None recorded for this incident yet.</div>`;
  }
  const pending = items.filter(e => e.remediation === 'Pending approval');
  return `
    ${pending.length ? `<div class="callout warn"><strong>${pending.length}</strong> remediation action${pending.length===1?'':'s'} pending approval. Approve or reject from the row.</div>` : ''}
    <table class="grid evidence-grid">
      <thead><tr><th>Type</th><th>Entity</th><th>Verdict</th><th>Remediation</th><th>Action</th><th></th></tr></thead>
      <tbody>
        ${items.map(e => `
          <tr>
            <td>${esc(e.type)}</td>
            <td>${clickableEntity(e.type, e.name)}</td>
            <td>${verdictDot(e.verdict)}</td>
            <td>${remediationPill(e.remediation)}</td>
            <td>${esc(e.action)}</td>
            <td>${e.remediation === 'Pending approval'
              ? `<button class="btn btn-primary btn-sm">Approve</button> <button class="btn btn-ghost btn-sm">Reject</button>`
              : `<button class="btn btn-ghost btn-sm" onclick="navigate('#/defender/hunting')">Go hunt</button>`}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function renderBlastRadius(inc) {
  const data = BLAST_RADIUS_PATHS[inc.id];
  if (!data) {
    return `<div class="muted">No blast radius paths calculated. Requires Sentinel data lake onboarding and critical-asset definitions.</div>`;
  }
  return `
    <div class="blast-mini">
      <div class="blast-source">${esc(data.source)}</div>
      <div class="blast-paths">
        ${data.paths.map(p => `
          <div class="blast-path ${p.critical ? 'critical' : ''}">
            <div class="blast-hops">${'─'.repeat(p.hops)}▶</div>
            <div class="blast-target">
              <strong>${esc(p.target)}</strong>
              ${p.critical ? '<span class="blast-crit">CRITICAL</span>' : ''}
              <div class="muted">${esc(p.reach)} · ${p.hops} hop${p.hops===1?'':'s'}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;
}

function renderSimilarIncidents(inc) {
  const items = SIMILAR_INCIDENTS[inc.id];
  if (!items) {
    return `<div class="muted">No similar incidents found in the last 30 days.</div>`;
  }
  return `
    <table class="grid">
      <thead><tr><th>Sev</th><th>Incident</th><th>Why it's similar</th></tr></thead>
      <tbody>
        ${items.map(s => `
          <tr>
            <td><span class="sev ${s.severity}">${cap(s.severity)}</span></td>
            <td><strong>${esc(s.id)}</strong> — ${esc(s.title)}</td>
            <td>${esc(s.similarity)}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function renderIncidentDetail(inc) {
  const incAlerts = alerts.filter(a => inc.alertIds.includes(a.id));
  return `
    <div class="incident-preview-open">
      <div>
        <strong>Incident preview</strong>
        <span>Open the full incident page to work in the Defender attack story and graph area.</span>
      </div>
      <button class="btn btn-primary" onclick="openIncidentPage('${esc(inc.id)}')">Open incident page</button>
    </div>
    <dl class="alert-meta">
      <dt>Incident ID</dt><dd>${esc(inc.id)}</dd>
      <dt>Severity</dt><dd><span class="sev ${inc.severity}">${cap(inc.severity)}</span></dd>
      <dt>Status</dt><dd>${esc(inc.status)}</dd>
      ${inc.responseTag ? `<dt>Response tag</dt><dd><span class="tag orange">${esc(inc.responseTag)}</span></dd>` : ''}
      <dt>Assigned to</dt><dd>${esc(inc.assignedTo)}</dd>
      <dt>Tactics</dt><dd>${inc.tactics.map(t=>`<span class="mitre">${esc(t)}</span>`).join('')}</dd>
      <dt>Created</dt><dd>${fmtTime(inc.createdAt)}</dd>
    </dl>
    <div class="callout">${esc(inc.summary)}</div>

    ${renderAttackStory(inc, incAlerts)}

    <div class="alert-section-title">Entities (${inc.entities.length})</div>
    <div class="entity-chip-list">${inc.entities.map(e => clickableEntity(e.type, e.name)).join('')}</div>

    <div class="alert-section-title">Alerts in this incident (${incAlerts.length})</div>
    <table class="grid">
      <thead><tr><th>Sev</th><th>Title</th><th>Asset</th><th>Time</th></tr></thead>
      <tbody>${incAlerts.map(a => `
        <tr onclick="openAlert('${a.id}')">
          <td><span class="sev ${a.severity}">${cap(a.severity)}</span></td>
          <td>${esc(a.title)}</td>
          <td>${clickableEntity(entityTypeForName(inc, a.asset), a.asset)}</td>
          <td>${fmtTime(a.firstActivity)}</td>
        </tr>`).join('')}</tbody>
    </table>

    <div class="alert-section-title">Timeline</div>
    <ul class="timeline">
      <li><div class="t-time">${fmtTime(inc.createdAt)}</div><div class="t-title">Incident created</div></li>
      ${incAlerts.map(a => `<li><div class="t-time">${fmtTime(a.firstActivity)}</div><div class="t-title">${esc(a.title)} (${esc(a.asset)})</div></li>`).join('')}
      ${(inc.disruptionActions || []).map(a => `<li><div class="t-time">${fmtTime(a.time)}</div><div class="t-title">${esc(a.action)} - ${esc(a.target)}</div><div class="muted">${esc(a.result)}</div></li>`).join('')}
    </ul>

    <div class="alert-section-title">Summary</div>
    ${renderIncidentSummary(inc, incAlerts)}

    <div class="alert-section-title">Activities</div>
    ${renderIncidentActivities(inc)}

    <div class="alert-section-title">Evidence and Response</div>
    ${renderIncidentEvidence(inc)}

    <div class="alert-section-title">Blast radius (possible paths)</div>
    ${renderBlastRadius(inc)}

    <div class="alert-section-title">Similar incidents</div>
    ${renderSimilarIncidents(inc)}

    <div class="alert-section-title">Defender portal investigation workflow</div>
    <div class="incident-guide">
      <div class="incident-guide-head">
        <strong>Incident page tabs and pivots</strong>
        <span>${esc(INCIDENT_INVESTIGATION_GUIDE.source)} · ${esc(INCIDENT_INVESTIGATION_GUIDE.lastUpdated)}</span>
      </div>
      <div class="incident-guide-grid">
        ${INCIDENT_INVESTIGATION_GUIDE.workflow.map(step => `
          <div class="incident-guide-step">
            <div class="incident-guide-title">${esc(step.title)}</div>
            <div>${esc(step.detail)}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="alert-section-title">Blast radius analysis</div>
    <div class="blast-radius-box">
      <div>
        <div class="incident-guide-title">Prerequisites</div>
        <ul>
          ${INCIDENT_INVESTIGATION_GUIDE.blastRadius.prerequisites.map(p => `<li>${esc(p)}</li>`).join('')}
        </ul>
      </div>
      <div>
        <div class="incident-guide-title">Use by role</div>
        <dl class="role-use-list">
          ${INCIDENT_INVESTIGATION_GUIDE.blastRadius.roleUses.map(r => `
            <dt>${esc(r.role)}</dt><dd>${esc(r.use)}</dd>
          `).join('')}
        </dl>
      </div>
      <div class="blast-radius-notes">
        ${INCIDENT_INVESTIGATION_GUIDE.blastRadius.notes.map(n => `<span>${esc(n)}</span>`).join('')}
      </div>
    </div>

    <div class="sidepanel-footer">
      <button class="btn btn-primary" onclick="openIncidentPage('${esc(inc.id)}')">Open incident page</button>
      <button class="btn btn-primary">Classify & resolve</button>
      <button class="btn btn-secondary">Assign to me</button>
    </div>`;
}

// ---------- Sentinel › Hunting › ASIM DNS ----------
// Mock executor for the unifying parser _Im_Dns. Supports the filter params
// documented in the ASIM DNS schema (starttime, srcipaddr, responsecodename,
// domain_has_any, response_has_ipv4, response_has_any_prefix, eventtype) plus
// trailing `| where`, `| project`, and `| take` clauses.
VIEWS['sentinel/hunting/dns'] = () => {
  const initialQuery = ASIM_DNS_SAVED_QUERIES[0].query;
  return {
    html: `
    <div class="page-header hunting-page-header">
      <div>
        <div class="breadcrumb">Microsoft Sentinel › Hunting › <strong>ASIM DNS</strong></div>
        <h1>ASIM DNS hunting</h1>
        <div class="page-subtitle">Query the unifying <code>_Im_Dns</code> parser. Filter params push down to every source-specific parser (Microsoft DNS, Corelight Zeek, Infoblox, Cisco Umbrella, …) so a single query covers all DNS telemetry in the workspace.</div>
      </div>
      <div class="page-actions">
        <a class="btn btn-secondary" href="#/sentinel/hunting">Advanced hunting</a>
        <a class="btn btn-primary" href="#/sentinel/analytics">Promote to analytics rule</a>
      </div>
    </div>
    <div class="kpi-strip hunting-status-cards">
      <div class="kpi"><span class="kpi-label">Schema</span><span class="kpi-value">Dns</span><span class="kpi-delta">ASIM 0.1.7</span></div>
      <div class="kpi"><span class="kpi-label">Bundled rows</span><span class="kpi-value">${IM_DNS.length}</span><span class="kpi-delta">Mock fixture</span></div>
      <div class="kpi"><span class="kpi-label">Sources</span><span class="kpi-value">2</span><span class="kpi-delta">MS DNS · Corelight</span></div>
      <div class="kpi"><span class="kpi-label">Default eventtype</span><span class="kpi-value">Query</span><span class="kpi-delta">Lookup only</span></div>
    </div>
    <div class="hunting-workspace">
      <aside class="hunting-schema-sidebar" aria-label="Saved DNS queries">
        <div class="hunting-sidebar-header">
          <strong>Saved queries</strong>
          <span>${ASIM_DNS_SAVED_QUERIES.length}</span>
        </div>
        <div class="hunting-saved-queries">
          ${ASIM_DNS_SAVED_QUERIES.map((q, i) => `
            <button class="saved-query-row" type="button" data-dns-query-index="${i}">
              <span>${esc(q.name)}</span>
              <small>${esc(q.description)}</small>
            </button>
          `).join('')}
        </div>
      </aside>

      <section class="hunting-query-results" aria-label="Query and results">
        <div class="hunting-query-editor">
          <div class="hunting-section-toolbar">
            <strong>Query</strong>
            <span class="muted">Mock _Im_Dns runs against bundled rows. Supports filter params + | where / | project / | take.</span>
          </div>
          <textarea id="dns-kql" class="kql hunting-kql">${esc(initialQuery)}</textarea>
          <div class="kql-toolbar">
            <button class="btn btn-primary btn-sm" onclick="runImDnsQuery()">Run query</button>
            <button class="btn btn-secondary btn-sm">Save</button>
            <button class="btn btn-ghost btn-sm">Save as analytics rule</button>
          </div>
        </div>
        <div class="hunting-results" id="dns-kql-results">
          <div class="card-toolbar"><strong>Results</strong></div>
          <div class="card-body muted">Run a query to see results.</div>
        </div>
      </section>
    </div>
    <div class="tile-grid hunting-notes">
      ${ASIM_DNS_NOTES.map(n => `
        <div class="tile">
          <div class="tile-title">${esc(n.title)}</div>
          <div class="tile-sub">${esc(n.detail)}</div>
        </div>
      `).join('')}
    </div>
    `,
    onMount: () => {
      const unquote = s => s.trim().replace(/^['"]|['"]$/g, '');
      function letBindings(text) {
        const out = {};
        const re = /let\s+(\w+)\s*=\s*([^;]+);/g;
        let m;
        while ((m = re.exec(text))) out[m[1]] = m[2].trim();
        return out;
      }
      function resolveList(expr, bindings) {
        if (expr == null) return [];
        const trimmed = expr.trim();
        if (bindings[trimmed] != null) return resolveList(bindings[trimmed], bindings);
        const dyn = trimmed.match(/^dynamic\s*\(\s*(\[[\s\S]*\])\s*\)$/);
        if (dyn) {
          try { return JSON.parse(dyn[1].replace(/'/g, '"')); } catch { return []; }
        }
        return [unquote(trimmed)];
      }
      function evalTimeExpr(expr) {
        if (!expr) return null;
        const t = expr.trim();
        if (t === 'now()') return new Date();
        const m = t.match(/^ago\(\s*(\d+)\s*([dhms])\s*\)$/);
        if (!m) return null;
        const mult = { d:86400e3, h:3600e3, m:60e3, s:1000 }[m[2]];
        return new Date(Date.now() - (+m[1]) * mult);
      }
      function splitArgs(s) {
        const parts = []; let depth = 0, cur = '';
        for (const ch of s) {
          if (ch === '(' || ch === '[') depth++;
          else if (ch === ')' || ch === ']') depth--;
          if (ch === ',' && depth === 0) { parts.push(cur); cur=''; continue; }
          cur += ch;
        }
        if (cur.trim()) parts.push(cur);
        return parts;
      }
      function parseImDnsParams(arg) {
        const params = {};
        for (const p of splitArgs(arg)) {
          const eq = p.indexOf('=');
          if (eq < 0) continue;
          params[p.slice(0, eq).trim().toLowerCase()] = p.slice(eq + 1).trim();
        }
        return params;
      }
      function applyParams(rows, params, bindings) {
        let out = rows.slice();
        // Mock data is anchored at "now"; treat ago(>=1h) as a no-op so the
        // canonical "last day" example still returns rows in the demo.
        if (params.starttime) {
          const t = evalTimeExpr(params.starttime);
          if (t && (Date.now() - t.getTime()) < 3600e3) {
            out = out.filter(r => new Date(r.TimeGenerated) >= t);
          }
        }
        if (params.srcipaddr) out = out.filter(r => r.SrcIpAddr === unquote(params.srcipaddr));
        if (params.responsecodename) {
          const code = unquote(params.responsecodename);
          out = out.filter(r => (r.EventResultDetails||'').toUpperCase() === code.toUpperCase());
        }
        if (params.domain_has_any) {
          const list = resolveList(params.domain_has_any, bindings);
          out = out.filter(r => list.some(d => (r.DnsQuery||'').includes(d)));
        }
        if (params.response_has_ipv4) {
          const ip = unquote(params.response_has_ipv4);
          out = out.filter(r => (r.DnsResponseName||'').includes(ip));
        }
        if (params.response_has_any_prefix) {
          const list = resolveList(params.response_has_any_prefix, bindings);
          out = out.filter(r => list.some(p => (r.DnsResponseName||'').startsWith(p)));
        }
        const evType = params.eventtype ? unquote(params.eventtype) : 'Query';
        out = out.filter(r => r.EventType === evType);
        return out;
      }
      function applyWhere(rows, clause) {
        // Supported: `Field op value` where op ∈ ==, !=, has, !has, contains, matches regex
        let m;
        if ((m = clause.match(/^([A-Za-z_]\w*)\s*(==|!=)\s*"([^"]*)"$/))) {
          const [, f, op, v] = m;
          return rows.filter(r => op === '==' ? String(r[f] ?? '') === v : String(r[f] ?? '') !== v);
        }
        if ((m = clause.match(/^([A-Za-z_]\w*)\s+(!?has|contains)\s+"([^"]*)"$/i))) {
          const [, f, op, v] = m;
          const neg = op.startsWith('!');
          return rows.filter(r => {
            const has = String(r[f] ?? '').toLowerCase().includes(v.toLowerCase());
            return neg ? !has : has;
          });
        }
        if ((m = clause.match(/^([A-Za-z_]\w*)\s+matches\s+regex\s+"([^"]*)"$/i))) {
          const [, f, pat] = m;
          let re; try { re = new RegExp(pat); } catch { return rows; }
          return rows.filter(r => re.test(String(r[f] ?? '')));
        }
        return rows;
      }
      function extractImDnsCall(s) {
        const m = s.match(/^_Im_Dns\s*\(/);
        if (!m) return null;
        let depth = 1, i = m[0].length;
        while (i < s.length && depth > 0) {
          const ch = s[i];
          if (ch === '(' || ch === '[') depth++;
          else if (ch === ')' || ch === ']') depth--;
          i++;
        }
        if (depth !== 0) return null;
        return { args: s.slice(m[0].length, i - 1), end: i };
      }
      function runImDns(query) {
        const bindings = letBindings(query);
        const stripped = query.replace(/let\s+\w+\s*=\s*[^;]+;/g, '').trim();
        const head = extractImDnsCall(stripped);
        if (!head) return { rows:[], cols:['(error)'], note:'Query must call _Im_Dns(…).' };
        const params = parseImDnsParams(head.args);
        let rows = applyParams(IM_DNS, params, bindings);
        let cols = null;
        const tail = stripped.slice(head.end);
        const pipes = tail.split(/\n?\s*\|\s*/).map(s => s.trim()).filter(Boolean);
        for (const clause of pipes) {
          if (clause.toLowerCase().startsWith('where ')) {
            rows = applyWhere(rows, clause.slice(6).trim());
          } else if (clause.toLowerCase().startsWith('project ')) {
            cols = clause.slice(8).split(',').map(s => s.trim()).filter(Boolean);
            rows = rows.map(r => Object.fromEntries(cols.map(c => [c, r[c]])));
          } else if (clause.toLowerCase().startsWith('take ')) {
            const n = parseInt(clause.slice(5).trim(), 10);
            if (Number.isFinite(n)) rows = rows.slice(0, n);
          }
        }
        if (!cols) cols = rows.length ? Object.keys(rows[0]) : ['(no rows)'];
        const summary = Object.entries(params).map(([k,v]) => `${k}=${v}`).join(', ');
        return { rows, cols, params: summary };
      }
      window.runImDnsQuery = () => {
        const q = document.getElementById('dns-kql').value;
        const { rows, cols, params, note } = runImDns(q);
        document.getElementById('dns-kql-results').innerHTML = `
          <div class="card-toolbar">
            <strong>${rows.length} rows</strong>
            <span class="muted">${esc(note || ('_Im_Dns(' + (params||'') + ')'))}</span>
          </div>
          <table class="grid">
            <thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>
            <tbody>${
              rows.length
                ? rows.map(r => `<tr>${cols.map(c => `<td class="kv">${esc(r[c] ?? '')}</td>`).join('')}</tr>`).join('')
                : `<tr><td colspan="${cols.length}" class="muted">(no rows matched)</td></tr>`
            }</tbody>
          </table>`;
      };
      document.querySelectorAll('[data-dns-query-index]').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = +btn.dataset.dnsQueryIndex;
          document.getElementById('dns-kql').value = ASIM_DNS_SAVED_QUERIES[i].query;
        });
      });
      window.runImDnsQuery();
    },
  };
};

// Register deliberate study surfaces for secondary navigation entries that do
// not yet need a full interactive lab. This keeps every visible NAV route
// renderable while preserving richer hand-built views above.
(function registerSecondaryNavViews() {
  const workloadNotes = {
    defender: {
      context:'Microsoft Defender XDR',
      goal:'Use this surface to orient where the portal feature sits during incident response, tuning, or tenant configuration.',
      pivots:['#/defender/incidents', '#/defender/hunting', '#/defender/settings'],
    },
    sentinel: {
      context:'Microsoft Sentinel',
      goal:'Use this surface as a map back to Sentinel operations: content, workspace configuration, hunting, and automation.',
      pivots:['#/sentinel/incidents', '#/sentinel/data-connectors', '#/sentinel/analytics'],
    },
    'defender-cloud': {
      context:'Defender for Cloud',
      goal:'Use this supporting surface for workload-protection and posture context while keeping SC-200 focus on alerts and response.',
      pivots:['#/defender-cloud/alerts', '#/defender-cloud/recommendations', '#/defender-cloud/regulatory'],
    },
    purview: {
      context:'Microsoft Purview',
      goal:'Use this surface for investigation context that supports Audit, eDiscovery, Graph activity logs, and risk cases.',
      pivots:['#/purview/audit', '#/purview/ediscovery', '#/purview/graph-activity'],
    },
  };

  const routeMeta = {};
  Object.entries(NAV).forEach(([workload, items]) => {
    items.filter(item => item.route).forEach(item => {
      routeMeta[item.route.replace(/^#\//, '')] = {
        workload,
        label:item.label,
        icon:item.icon || '•',
      };
    });
  });

  Object.entries(routeMeta).forEach(([route, meta]) => {
    if (VIEWS[route]) return;
    const note = workloadNotes[meta.workload] || workloadNotes.defender;
    VIEWS[route] = () => `
      <div class="page-header">
        <div>
          <div class="breadcrumb">${esc(note.context)} › <strong>${esc(meta.label)}</strong></div>
          <h1>${esc(meta.label)}</h1>
          <div class="page-subtitle">Secondary study surface for SC-200 lab navigation.</div>
        </div>
      </div>
      <div class="card">
        <div class="card-toolbar">
          <strong>${esc(meta.icon)} ${esc(meta.label)}</strong>
          <span class="muted">Local-only placeholder</span>
        </div>
        <div class="card-body">
          <p class="muted">${esc(note.goal)}</p>
          <div class="callout info">
            This page is intentionally static. It exists so the portal navigation is complete while the hands-on exam workflows remain concentrated in the linked lab views.
          </div>
        </div>
      </div>
      <div class="tile-grid">
        ${note.pivots.map(pivot => {
          const target = routeMeta[pivot.replace(/^#\//, '')];
          return `
            <a class="tile" href="${esc(pivot)}">
              <div class="tile-title">${esc(target?.label || pivot)}</div>
              <div class="tile-sub">Open the related hands-on lab view.</div>
            </a>`;
        }).join('')}
      </div>
    `;
  });
})();

// ---------- Security Copilot standalone workload ----------

VIEWS['copilot/home'] = () => `
  <div class="page-header">
    <div>
      <div class="breadcrumb">Security Copilot › <strong>Home</strong></div>
      <h1>Security Copilot</h1>
      <div class="page-subtitle">Standalone experience — sessions, promptbooks, plugins, and capacity, all fictional and local.</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-primary" onclick="toast('Prompt bar is a static lab surface; open a session instead.')">New session</button>
    </div>
  </div>
  <div class="grid">
    ${COPILOT_SESSIONS.filter(s => s.pinned).map(s => `
      <div class="tile">
        <div class="tile-title"><span class="tile-icon">🗂</span>${esc(s.name)}</div>
        <div class="tile-sub">${esc(s.owner)} · ${esc(s.workspace)} · ${fmtTime(s.lastActivity)}</div>
        <div class="muted" style="margin-top:8px;">${s.promptCount} prompts · plugins: ${s.plugins.map(esc).join(', ')}</div>
      </div>
    `).join('')}
  </div>
  <div class="card card-body" style="margin-top:16px;">
    <div class="alert-section-title">Embedded vs standalone</div>
    <div class="muted">The Copilot pane inside Defender/Purview answers in-context; this standalone portal is where owners manage sessions, promptbooks, plugins, knowledge, and SCU capacity. The topbar Copilot button in this lab is the embedded side of the same fictional tenant.</div>
  </div>
`;

// === local-tasks views (auto-merged by add_view.py — do not hand-edit between markers) ===
// === end local-tasks views ===
