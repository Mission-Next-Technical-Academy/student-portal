// SC-200_lab — router, suppression engine, panel wiring.

// ---------- suppression engine (AND semantics) ----------
let alerts = SEED_ALERTS.map(a => ({ ...a, event: { ...a.event } }));
let rules = loadRules();
let lastAttackStorySelection = null;

function loadRules() {
  const raw = localStorage.getItem('defender-lab.rules');
  if (raw) { try { return JSON.parse(raw); } catch {} }
  return [DEFAULT_SUPPRESSION_RULE];
}
function saveRules() {
  localStorage.setItem('defender-lab.rules', JSON.stringify(rules));
}
function matchedRule(alert) {
  return rules.find(r =>
    r.enabled !== false &&
    r.conditions.length > 0 &&
    r.conditions.every(c => c.op === 'equals' && alert.event[c.field] === c.value)
  );
}

// ---------- router ----------
const DEFAULT_ROUTE = '#/defender/home';

function currentRoute() {
  return (location.hash || DEFAULT_ROUTE).replace(/^#\//, '');   // e.g. "defender/home"
}
function workloadOf(route) {
  const id = route.split('/')[0];
  return PORTALS.find(p => p.id === id) ? id : 'defender';
}
function navigate(hash) {
  if (!hash.startsWith('#')) hash = '#' + hash;
  if (location.hash === hash) render();
  else location.hash = hash;
}

function render() {
  const route = currentRoute();
  const wl    = workloadOf(route);
  const portal = PORTALS.find(p => p.id === wl);

  document.body.className = 'wl-' + wl + ' route-' + route.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  document.getElementById('portal-name').textContent = portal.name;

  const shell = document.getElementById('shell');
  const azurePane = document.getElementById('pane-azure');
  const bladePane = document.getElementById('pane-blade');
  const cleanPortal = wl === 'purview';
  shell.classList.remove('no-azure', 'clean-portal');
  shell.classList.toggle('clean-portal', cleanPortal);
  azurePane.hidden = cleanPortal;
  bladePane.hidden = cleanPortal;

  if (!cleanPortal) {
    azurePane.hidden = false;
    bladePane.hidden = false;
    renderAzurePane(wl);
    document.getElementById('blade-title').textContent = portal.name;
    renderSidenav(wl, '#/' + route);
    applyPaneCollapseState();
  }
  renderPortalTabs(wl);
  mountView(route);
  scheduleGuideRefresh();
}

// Top-of-page tab strip: "Defender portal | Azure portal".
// Defender XDR + Purview live on security.microsoft.com / purview.microsoft.com — treated as "Defender portal" context.
// Sentinel + Defender for Cloud live in portal.azure.com — "Azure portal" context.
const PORTAL_CONTEXT = {
  'defender':       'defender',
  'purview':        'defender',
  'sentinel':       'azure',
  'defender-cloud': 'azure',
};
const PORTAL_CONTEXT_HOME = {
  'defender': '#/defender/home',
  'azure':    '#/defender-cloud/overview',
};
function renderPortalTabs(wl) {
  const active = PORTAL_CONTEXT[wl];
  document.querySelectorAll('.portal-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.portal === active);
  });
}
function switchPortalContext(ctx) {
  const wl = workloadOf(currentRoute());
  if (PORTAL_CONTEXT[wl] === ctx) return;
  navigate(PORTAL_CONTEXT_HOME[ctx]);
}
window.switchPortalContext = switchPortalContext;

// Which Microsoft Cloud app to highlight for the active workload.
const CLOUD_HIGHLIGHT = {
  'defender':       'Defender',
  'sentinel':       'Microsoft Sentinel',
  'defender-cloud': 'Defender',
  'purview':        'Purview',
};
function renderAzurePane(wl) {
  const target = CLOUD_HIGHLIGHT[wl];
  const ul = MICROSOFT_CLOUD_NAV.map(item => {
    const route = CLOUD_APP_ROUTE[item.label];
    const cls = (item.label === target) ? ' class="current-app"' : '';
    const onclick = route ? ` onclick="navigate('${route}')"` : '';
    return `<li${cls}${onclick}>
              <span class="navicon">${item.icon || ''}</span><span class="navlabel">${item.label}</span>
            </li>`;
  }).join('');
  document.getElementById('sidenav-azure').innerHTML = ul;
}

function renderSidenav(wl, activeHash) {
  const items = NAV[wl] || [];
  const ul = items.map(item => {
    if (item.section) return `<li class="navsection">${item.section}</li>`;
    const active = (item.route === activeHash) ? ' class="active"' : '';
    return `<li${active} onclick="navigate('${item.route}')">
              <span class="navicon">${item.icon || ''}</span><span class="navlabel">${item.label}</span>
            </li>`;
  }).join('');
  document.getElementById('sidenav').innerHTML = ul;
}

function applyPaneCollapseState() {
  const azCollapsed = localStorage.getItem('defender-lab.pane.azure') === 'collapsed';
  const blCollapsed = localStorage.getItem('defender-lab.pane.blade') === 'collapsed';
  document.getElementById('pane-azure').classList.toggle('collapsed', azCollapsed);
  document.getElementById('pane-blade').classList.toggle('collapsed', blCollapsed);
  document.getElementById('toggle-azure').textContent = azCollapsed ? '»' : '«';
  document.getElementById('toggle-blade').textContent = blCollapsed ? '»' : '«';
}
function togglePane(which) {
  const key = 'defender-lab.pane.' + which;
  const cur = localStorage.getItem(key);
  localStorage.setItem(key, cur === 'collapsed' ? 'expanded' : 'collapsed');
  applyPaneCollapseState();
}

function mountView(route) {
  const main = document.getElementById('content');
  const fn = VIEWS[route];
  if (!fn) {
    main.innerHTML = `
      <div class="page-header"><div><h1>Page not found</h1>
        <div class="page-subtitle">No view registered for <code>#/${esc(route)}</code>.</div>
      </div></div>`;
    return;
  }
  const out = fn();
  if (typeof out === 'string') {
    main.innerHTML = out;
  } else {
    main.innerHTML = out.html;
    if (typeof out.onMount === 'function') out.onMount();
  }
}

// ---------- panel helpers ----------
function showPanel(id) {
  document.getElementById(id).classList.remove('hidden');
  document.getElementById('scrim').classList.remove('hidden');
}
function hidePanels() {
  document.querySelectorAll('.sidepanel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.wizard-window').forEach(p => p.classList.add('hidden'));
  document.getElementById('scrim').classList.add('hidden');
}

function openAlert(id) {
  const a = alerts.find(x => x.id === id);
  if (!a) return;
  document.getElementById('alert-title').textContent = a.title;
  document.getElementById('alert-body').innerHTML = renderAlertDetail(a);
  showPanel('panel-alert');
}

function openIncident(id) {
  const inc = INCIDENTS.find(i => i.id === id);
  if (!inc) return;
  document.getElementById('incident-title').textContent = inc.title;
  document.getElementById('incident-body').innerHTML = renderIncidentDetail(inc);
  showPanel('panel-incident');
  setAttackStoryStep(id, 0);
}

function openIncidentPage(id) {
  sessionStorage.setItem('defender-lab.incident.id', id);
  sessionStorage.setItem('defender-lab.incident.tab', 'attack-story');
  hidePanels();
  navigate('#/defender/incident');
}
function setIncidentTab(tab) {
  sessionStorage.setItem('defender-lab.incident.tab', tab);
  render();
}
window.setIncidentTab = setIncidentTab;

let attackStoryTimer = null;

function attackStoryPanel(incidentId) {
  return document.querySelector(`.attack-story[data-incident-id="${CSS.escape(incidentId)}"]`);
}

function readAttackStory(panel) {
  if (!panel) return null;
  const holder = panel.querySelector('[data-story-json]');
  if (!holder) return null;
  try { return JSON.parse(holder.dataset.storyJson); }
  catch { return null; }
}

function setAttackStoryStep(incidentId, stepIndex = 0) {
  const panel = attackStoryPanel(incidentId);
  const story = readAttackStory(panel);
  if (!panel || !story || !story.steps.length) return;

  const index = Math.max(0, Math.min(story.steps.length - 1, stepIndex));
  const step = story.steps[index];
  const currentNodeIndex = story.nodes.findIndex(n => n.id === step.node);
  const activeNodes = new Set(
    story.nodes
      .slice(0, currentNodeIndex >= 0 ? currentNodeIndex + 1 : 0)
      .map(n => n.id)
  );
  story.steps.slice(0, index + 1).forEach(s => {
    if (s.node) activeNodes.add(s.node);
  });
  const activeEdges = new Set(
    story.edges
      .filter(edge => activeNodes.has(edge.from) && activeNodes.has(edge.to))
      .map(edge => edge.from + '>' + edge.to)
  );

  panel.querySelectorAll('.attack-web-node').forEach(node => {
    const id = node.dataset.nodeId;
    node.classList.toggle('seen', activeNodes.has(id));
    node.classList.toggle('active', id === step.node);
  });
  panel.querySelectorAll('.attack-web-line').forEach(edge => {
    const key = edge.dataset.edgeFrom + '>' + edge.dataset.edgeTo;
    edge.classList.toggle('active', activeEdges.has(key));
  });
  panel.querySelectorAll('[data-story-step]').forEach(item => {
    item.classList.toggle('active', Number(item.dataset.storyStep) === index);
    item.classList.toggle('seen', Number(item.dataset.storyStep) <= index);
  });
  panel.querySelectorAll('[data-story-alert]').forEach(item => {
    item.classList.toggle('active', item.dataset.storyAlert === step.alertId);
  });

  const now = panel.querySelector('[data-story-now]');
  if (now) {
    const node = story.nodes.find(n => n.id === step.node) || {};
    const remediation = step.remediation || node.remediation || 'Review the entity details and choose the least disruptive containment action.';
    now.innerHTML = `
      <div class="t-time">${fmtTime(step.time)}</div>
      <div class="t-title">${esc(step.title)}</div>
      <p>${esc(step.detail)}</p>
      <div class="attack-story-actions-inline">
        <button class="btn btn-secondary btn-sm" onclick="openAlert('${esc(step.alertId)}')">Open alert</button>
        <button class="btn btn-secondary btn-sm" onclick="navigate('#/defender/hunting')">Go hunt</button>
      </div>
      <div class="attack-story-remediation"><strong>Response action:</strong> ${esc(remediation)}</div>
    `;
  }

  updateAttackStoryEntity(panel, story, step.node, step.alertId);
}

function playAttackStory(incidentId) {
  const panel = attackStoryPanel(incidentId);
  const story = readAttackStory(panel);
  if (!panel || !story || !story.steps.length) return;

  clearInterval(attackStoryTimer);
  let index = 0;
  setAttackStoryStep(incidentId, index);
  attackStoryTimer = setInterval(() => {
    index += 1;
    if (index >= story.steps.length) {
      clearInterval(attackStoryTimer);
      attackStoryTimer = null;
      return;
    }
    setAttackStoryStep(incidentId, index);
  }, 1200);
}

function selectAttackStoryNode(incidentId, nodeId) {
  const panel = attackStoryPanel(incidentId);
  const story = readAttackStory(panel);
  if (!panel || !story) return;
  lastAttackStorySelection = { incidentId, nodeId };
  const firstRelatedStep = story.steps.findIndex(step => step.node === nodeId);
  if (firstRelatedStep >= 0) {
    setAttackStoryStep(incidentId, firstRelatedStep);
    return;
  }

  panel.querySelectorAll('.attack-web-node').forEach(node => {
    node.classList.toggle('active', node.dataset.nodeId === nodeId);
  });
  panel.querySelectorAll('.attack-web-line').forEach(edge => {
    edge.classList.toggle('active', edge.dataset.edgeFrom === nodeId || edge.dataset.edgeTo === nodeId);
  });
  panel.querySelectorAll('[data-story-alert]').forEach(item => item.classList.remove('active'));
  updateAttackStoryEntity(panel, story, nodeId, '');
}

function updateAttackStoryEntity(panel, story, nodeId, activeAlertId) {
  const holder = panel.querySelector('[data-story-entity]');
  if (!holder) return;
  const node = story.nodes.find(n => n.id === nodeId) || story.nodes[0] || {};
  lastAttackStorySelection = { incidentId: panel.dataset.incidentId, nodeId: node.id };
  const relatedSteps = story.steps.filter(step => step.node === node.id);
  const evidence = node.evidence || relatedSteps.map(step => step.title);
  const remediation = node.remediation || relatedSteps.find(step => step.remediation)?.remediation || 'Review evidence, validate verdict, then contain or dismiss.';
  const hasDevice = node.type === 'Device' && DEVICES.some(d => d.id === node.label || d.name === node.label);
  holder.innerHTML = `
    <div class="attack-entity-kicker">${esc(node.type || 'Entity')}</div>
    <div class="attack-entity-title">${esc(node.label || 'No entity selected')}</div>
    <dl class="attack-entity-meta">
      <dt>Related alerts</dt><dd>${relatedSteps.length || 'None highlighted'}</dd>
      <dt>Verdict</dt><dd>${esc(node.verdict || (relatedSteps.length ? 'Suspicious' : 'Unknown'))}</dd>
      <dt>Remediation</dt><dd>${esc(remediation)}</dd>
    </dl>
    <div class="attack-entity-subtitle">Evidence and response</div>
    <div class="attack-entity-actions">
      ${hasDevice
        ? `<button class="btn btn-primary btn-sm" onclick="openDevice('${esc(node.label)}')">Open device page</button>`
        : `<button class="btn btn-secondary btn-sm" onclick="openEntityPivot('${esc(node.type || 'Entity')}', '${esc(node.label || '')}')">Open entity page</button>`}
      <button class="btn btn-primary btn-sm" onclick="viewBlastRadius('${esc(panel.dataset.incidentId)}', '${esc(node.id || '')}')">View blast radius</button>
      <button class="btn btn-secondary btn-sm" onclick="navigate('#/defender/hunting')">Go hunt</button>
    </div>
    <ul class="attack-evidence-list">
      ${(evidence.length ? evidence : ['No evidence attached to this entity.']).map(item => `<li>${esc(item)}</li>`).join('')}
    </ul>
    <div class="attack-related-alerts">
      ${story.steps.map(step => `
        <button class="${step.alertId === activeAlertId || step.node === node.id ? 'active' : ''}" data-story-alert="${esc(step.alertId)}"
          onclick="setAttackStoryStep('${esc(panel.dataset.incidentId)}', ${story.steps.indexOf(step)})">
          ${esc(step.alertId)} · ${esc(step.title)}
        </button>
      `).join('')}
    </div>
  `;
}

function viewBlastRadius(incidentId, nodeId) {
  const panel = attackStoryPanel(incidentId);
  const story = readAttackStory(panel);
  if (!panel || !story) return;
  lastAttackStorySelection = { incidentId, nodeId };
  panel.querySelectorAll('.attack-web-node').forEach(node => {
    node.classList.toggle('active', node.dataset.nodeId === nodeId);
  });
  panel.querySelectorAll('.attack-web-line').forEach(edge => {
    edge.classList.toggle('active', edge.dataset.edgeFrom === nodeId || edge.dataset.edgeTo === nodeId || edge.classList.contains('blast'));
  });
  const holder = panel.querySelector('[data-story-entity]');
  if (holder) holder.innerHTML = renderBlastRadiusGraph(story, nodeId);
}

function restoreAttackStoryEntity() {
  const selected = lastAttackStorySelection;
  if (!selected) return;
  const panel = attackStoryPanel(selected.incidentId);
  const story = readAttackStory(panel);
  if (!panel || !story) return;
  updateAttackStoryEntity(panel, story, selected.nodeId, '');
}

function openEntityPivot(type, name) {
  if (type === 'Device' && DEVICES.some(d => d.id === name || d.name === name)) {
    openDevice(name);
    return;
  }
  toast(`${type} entity page opened for ${name} (lab stub).`);
}

function openRulePanel(fromAlertId) {
  const a = fromAlertId ? alerts.find(x => x.id === fromAlertId) : null;
  const initial = a
    ? [{ field:'file_name', value:a.event.file_name },
       { field:'sha256',    value:a.event.sha256 }]
    : DEFAULT_SUPPRESSION_RULE.conditions.map(c => ({ field:c.field, value:c.value }));
  document.getElementById('rule-name').value =
    a ? `Suppress: ${a.title}` : 'Suppress legitimate vulnerability scanner';
  renderConditions(initial);
  showPanel('panel-rule');
}

function renderConditions(initial) {
  const wrap = document.getElementById('conditions');
  wrap.innerHTML = '';
  (initial || []).forEach(c => addConditionRow(c.field, c.value));
}
function addConditionRow(field = 'file_name', value = '') {
  const wrap = document.getElementById('conditions');
  const row = document.createElement('div');
  row.className = 'cond-row';
  row.innerHTML = `
    <select class="ipt cond-field">
      ${FIELDS.map(f => `<option value="${f.key}" ${f.key===field?'selected':''}>${f.label}</option>`).join('')}
    </select>
    <select class="ipt cond-op"><option>equals</option></select>
    <input class="ipt cond-value" type="text" value="${esc(value)}" />
    <button class="cond-del" title="Remove condition">✕</button>`;
  row.querySelector('.cond-del').addEventListener('click', () => row.remove());
  wrap.appendChild(row);
}

function readConditions() {
  return [...document.querySelectorAll('#conditions .cond-row')].map(row => ({
    field: row.querySelector('.cond-field').value,
    op:    row.querySelector('.cond-op').value,
    value: row.querySelector('.cond-value').value,
  })).filter(c => c.value.length > 0);
}

function deleteRule(id) {
  rules = rules.filter(r => r.id !== id);
  saveRules();
  render();
}

function replayScenario() {
  alerts = SEED_ALERTS.map(a => ({ ...a, event: { ...a.event } }));
  render();
  toast('Replayed 5 detection events through current suppression rules.');
}

function toggleSettingState(input) {
  const row = input.closest('.setting-row');
  const state = row?.querySelector('em');
  if (state) state.textContent = input.checked ? 'On' : 'Off';
}
window.toggleSettingState = toggleSettingState;

function showNotificationComposer() {
  const composer = document.getElementById('notification-composer');
  if (!composer) return;
  composer.classList.add('active');
  composer.scrollIntoView({ behavior:'smooth', block:'center' });
  setTimeout(() => document.getElementById('notif-name')?.focus(), 150);
}
window.showNotificationComposer = showNotificationComposer;

function createNotificationRule() {
  const result = document.getElementById('notification-result');
  const name = document.getElementById('notif-name')?.value || 'Untitled notification';
  const trigger = document.getElementById('notif-trigger')?.value || 'Incident created or updated';
  if (!result) return;
  result.classList.remove('hidden');
  result.innerHTML = `<strong>Created:</strong> ${esc(name)} listens for "${esc(trigger)}" in this lab session.`;
  toast('Created email notification rule in the lab.');
}
window.createNotificationRule = createNotificationRule;

function openSentinelRule(i) {
  const r = SENTINEL_RULES[i];
  if (!r) return;
  const tgt = document.getElementById('rule-preview');
  if (!tgt) return;
  tgt.innerHTML = `
    <div class="card">
      <div class="card-toolbar">
        <strong>${esc(r.name)}</strong>
        <span><span class="sev ${r.severity}">${cap(r.severity)}</span> · ${esc(r.frequency)}</span>
      </div>
      <div class="card-body">
        <div class="alert-section-title">Tactics</div>
        <div>${r.tactics.map(t=>`<span class="mitre">${esc(t)}</span>`).join('')}</div>
        ${r.techniques?.length ? `
          <div class="alert-section-title">Techniques</div>
          <div>${r.techniques.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>
        ` : ''}
        ${r.entities?.length ? `
          <div class="alert-section-title">Entity mapping</div>
          <div>${r.entities.map(e=>`<span class="entity-chip">${esc(e)}</span>`).join('')}</div>
        ` : ''}
        <div class="alert-section-title">KQL query</div>
        <textarea class="kql" readonly>${esc(r.query)}</textarea>
      </div>
    </div>`;
  tgt.scrollIntoView({ behavior:'smooth' });
}

function openAnalyticsWizard() {
  const query = document.getElementById('analytics-rule-query');
  query.value = `SigninLogs
| where RiskLevel == "High"
| project TimeGenerated, UserPrincipalName, IPAddress, RiskLevel, ResultType`;
  document.getElementById('analytics-wizard-results').classList.add('hidden');
  showPanel('panel-analytics-wizard');
  initAnalyticsWizard();
  setTimeout(() => query.focus(), 0);
}

function toggleWizardAccordion(row) {
  row.classList.toggle('active');
}

let analyticsEntityMappings = [];
let analyticsWizardStep = 1;
const ANALYTICS_WIZARD_STEPS = [
  'General',
  'Set rule logic',
  'Incident settings',
  'Automated response',
  'Review and create',
];

function initAnalyticsWizard() {
  if (!analyticsEntityMappings.length) {
    analyticsEntityMappings = [
      { type:'Account', fields:[{ identifier:'Name', column:'UserPrincipalName' }] },
      { type:'IP', fields:[{ identifier:'Address', column:'IPAddress' }] },
      { type:'Host', fields:[{ identifier:'HostName', column:'DeviceName' }] },
    ];
  }
  renderEntityCatalog();
  renderEntityMappings();
  setAnalyticsWizardStep(analyticsWizardStep);
}

function setAnalyticsWizardStep(step) {
  analyticsWizardStep = Math.max(0, Math.min(ANALYTICS_WIZARD_STEPS.length - 1, step));
  document.querySelectorAll('#panel-analytics-wizard .wizard-step').forEach(el => {
    el.classList.toggle('active', Number(el.dataset.wizardStep) === analyticsWizardStep);
  });
  document.querySelectorAll('#panel-analytics-wizard .wizard-tab').forEach((tab, index) => {
    tab.classList.toggle('active', index === analyticsWizardStep);
    tab.setAttribute('aria-current', index === analyticsWizardStep ? 'step' : 'false');
  });

  const prev = document.getElementById('analytics-wizard-prev');
  const next = document.getElementById('analytics-wizard-next');
  if (prev) prev.disabled = analyticsWizardStep === 0;
  if (next) {
    next.textContent = analyticsWizardStep === ANALYTICS_WIZARD_STEPS.length - 1
      ? 'Create'
      : `Next: ${ANALYTICS_WIZARD_STEPS[analyticsWizardStep + 1]} >`;
  }
  if (analyticsWizardStep === ANALYTICS_WIZARD_STEPS.length - 1) renderAnalyticsReview();
}

function moveAnalyticsWizardStep(delta) {
  if (analyticsWizardStep === ANALYTICS_WIZARD_STEPS.length - 1 && delta > 0) {
    hidePanels();
    toast('Created scheduled analytics rule in the lab.');
    return;
  }
  setAnalyticsWizardStep(analyticsWizardStep + delta);
}

function renderAnalyticsReview() {
  const target = document.getElementById('analytics-review');
  if (!target) return;
  const query = document.getElementById('analytics-rule-query')?.value || '';
  const name = document.getElementById('analytics-rule-name')?.value || 'Untitled analytics rule';
  const severity = document.getElementById('analytics-rule-severity')?.value || 'Medium';
  const frequency = document.getElementById('analytics-run-every')?.value || '5 minutes';
  const lookback = document.getElementById('analytics-lookback')?.value || '5 minutes';
  target.innerHTML = `
    <div class="review-grid">
      <div><span class="muted">Name</span><strong>${esc(name)}</strong></div>
      <div><span class="muted">Severity</span><strong>${esc(severity)}</strong></div>
      <div><span class="muted">Schedule</span><strong>Every ${esc(frequency)}</strong></div>
      <div><span class="muted">Lookback</span><strong>${esc(lookback)}</strong></div>
      <div><span class="muted">Mapped entities</span><strong>${analyticsEntityMappings.length}</strong></div>
    </div>
    <div class="alert-section-title">Query</div>
    <textarea class="kql" readonly>${esc(query)}</textarea>
  `;
}

function toggleEntityCatalog(force) {
  const catalog = document.getElementById('entity-catalog');
  if (!catalog) return;
  const show = typeof force === 'boolean' ? force : catalog.classList.contains('hidden');
  catalog.classList.toggle('hidden', !show);
}

function renderEntityCatalog() {
  const list = document.getElementById('entity-catalog-list');
  if (!list) return;
  list.innerHTML = SENTINEL_ENTITY_TYPES.map(entity => `
    <button class="entity-option" type="button" onclick="addEntityMapping('${esc(entity.type)}')">
      <span class="entity-option-icon">${esc(entity.icon)}</span>
      <span>${esc(entity.type)}</span>
    </button>
  `).join('');
}

function addEntityMapping(type = 'Account') {
  if (analyticsEntityMappings.length >= 10) {
    toast('Sentinel analytics rules can map up to 10 entities.');
    toggleEntityCatalog(false);
    return;
  }
  const entity = SENTINEL_ENTITY_TYPES.find(e => e.type === type) || SENTINEL_ENTITY_TYPES[0];
  analyticsEntityMappings.push({
    type: entity.type,
    fields: [{ identifier: entity.identifiers[0], column: suggestedEntityColumn(entity.type) }],
  });
  toggleEntityCatalog(false);
  renderEntityMappings();
}

function removeEntityMapping(index) {
  analyticsEntityMappings.splice(index, 1);
  renderEntityMappings();
}

function changeEntityType(index, type) {
  const entity = SENTINEL_ENTITY_TYPES.find(e => e.type === type);
  if (!entity) return;
  analyticsEntityMappings[index] = {
    type: entity.type,
    fields: [{ identifier: entity.identifiers[0], column: suggestedEntityColumn(entity.type) }],
  };
  renderEntityMappings();
}

function updateEntityField(index, fieldIndex, key, value) {
  const mapping = analyticsEntityMappings[index];
  if (!mapping || !mapping.fields[fieldIndex]) return;
  mapping.fields[fieldIndex][key] = value;
}

function addEntityIdentifier(index) {
  const mapping = analyticsEntityMappings[index];
  const entity = SENTINEL_ENTITY_TYPES.find(e => e.type === mapping?.type);
  if (!mapping || !entity || mapping.fields.length >= 3) return;
  const used = new Set(mapping.fields.map(f => f.identifier));
  const identifier = entity.identifiers.find(id => !used.has(id)) || entity.identifiers[0];
  mapping.fields.push({ identifier, column:'' });
  renderEntityMappings();
}

function removeEntityIdentifier(index, fieldIndex) {
  const mapping = analyticsEntityMappings[index];
  if (!mapping) return;
  mapping.fields.splice(fieldIndex, 1);
  if (!mapping.fields.length) removeEntityMapping(index);
  else renderEntityMappings();
}

function suggestedEntityColumn(type) {
  return ({
    Account:'UserPrincipalName',
    Host:'DeviceName',
    IP:'IPAddress',
    URL:'Url',
    'Azure Resource':'ResourceId',
    'Cloud Application':'ApplicationId',
    'DNS Resolution':'DomainName',
    File:'FileName',
    FileHash:'SHA256',
    Malware:'ThreatName',
    Process:'ProcessCommandLine',
    'Registry Key':'RegistryKey',
    'Registry Value':'RegistryValue',
    'Security Group':'GroupSid',
    Mailbox:'MailboxPrimaryAddress',
    'Mail Cluster':'NetworkMessageId',
    'Mail Message':'NetworkMessageId',
    'Submission Mail':'SubmissionId',
  })[type] || '';
}

function renderEntityMappings() {
  const wrap = document.getElementById('entity-mapping-list');
  const count = document.getElementById('entity-limit');
  if (!wrap) return;
  wrap.innerHTML = analyticsEntityMappings.map((mapping, index) => {
    const entity = SENTINEL_ENTITY_TYPES.find(e => e.type === mapping.type) || SENTINEL_ENTITY_TYPES[0];
    return `
      <div class="entity-map-card">
        <div class="entity-map-head">
          <label>
            <span>Entity type</span>
            <select class="ipt" onchange="changeEntityType(${index}, this.value)">
              ${SENTINEL_ENTITY_TYPES.map(e => `<option value="${esc(e.type)}" ${e.type===mapping.type?'selected':''}>${esc(e.type)}</option>`).join('')}
            </select>
          </label>
          <button class="iconbtn" type="button" title="Remove entity" onclick="removeEntityMapping(${index})">x</button>
        </div>
        <div class="entity-identifier-list">
          ${mapping.fields.map((field, fieldIndex) => `
            <div class="entity-identifier-row">
              <label>
                <span>Identifier</span>
                <select class="ipt" onchange="updateEntityField(${index}, ${fieldIndex}, 'identifier', this.value)">
                  ${entity.identifiers.map(id => `<option value="${esc(id)}" ${id===field.identifier?'selected':''}>${esc(id)}</option>`).join('')}
                </select>
              </label>
              <label>
                <span>Query column</span>
                <input class="ipt" value="${esc(field.column)}" oninput="updateEntityField(${index}, ${fieldIndex}, 'column', this.value)">
              </label>
              <button class="iconbtn" type="button" title="Remove identifier" onclick="removeEntityIdentifier(${index}, ${fieldIndex})">x</button>
            </div>
          `).join('')}
        </div>
        <button class="wizard-link" type="button" ${mapping.fields.length>=3?'disabled':''} onclick="addEntityIdentifier(${index})">+ Add identifier</button>
      </div>
    `;
  }).join('');
  if (count) count.textContent = `${analyticsEntityMappings.length} of 10 entities mapped`;
}

function previewAnalyticsWizardResults() {
  const query = document.getElementById('analytics-rule-query').value;
  const table = HUNTING_TABLES.find(t => query.trimStart().startsWith(t)) || 'SigninLogs';
  const where = [...query.matchAll(/\|\s*where\s+([A-Za-z_][A-Za-z0-9_]*)\s*==\s*"([^"]*)"/gi)]
    .map(m => ({ field:m[1], value:m[2] }));
  const rows = where.reduce((acc, f) =>
    acc.filter(r => String(r[f.field] ?? '') === f.value), MOCK_QUERY_RESULTS[table] || []);
  const cols = rows.length ? Object.keys(rows[0]) : ['Result'];
  document.getElementById('analytics-wizard-results').innerHTML = `
    <div class="card-toolbar" style="padding:0 0 8px; border-bottom:0;">
      <strong>${rows.length} preview rows</strong>
      <span class="muted">${esc(table)}</span>
    </div>
    <table class="grid">
      <thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr>${cols.map(c => `<td class="kv">${esc(r[c] ?? '')}</td>`).join('')}</tr>`).join('') || '<tr><td>No matching fixture rows.</td></tr>'}</tbody>
    </table>`;
  document.getElementById('analytics-wizard-results').classList.remove('hidden');
}

// ---------- guided scenarios ----------
let guideState = null;

function startGuidedScenario(id) {
  const scenario = GUIDED_SCENARIOS.find(s => s.id === id);
  if (!scenario) return;
  scenario.steps.forEach(step => { step._actionUsed = false; });
  guideState = { scenario, stepIndex: 0 };
  applyGuideStep();
}

function applyGuideStep() {
  if (!guideState) return;
  const step = guideState.scenario.steps[guideState.stepIndex];
  if (!step) { closeGuide(); return; }
  const routeChanged = step.route && location.hash !== step.route;
  if (routeChanged) {
    hidePanels();
    navigate(step.route);
  }
  setTimeout(renderGuide, routeChanged ? 80 : 0);
}

function runGuideAction(step) {
  if (!step.action) return;
  const [kind, id] = step.action.split(':');
  if (kind === 'openAlert') openAlert(id);
  if (kind === 'openIncident') openIncident(id);
  if (kind === 'openRulePanel') openRulePanel(id || undefined);
}

function renderGuide() {
  if (!guideState) return;
  const panel = document.getElementById('panel-guide');
  const step = guideState.scenario.steps[guideState.stepIndex];
  const count = guideState.scenario.steps.length;
  const atEnd = guideState.stepIndex === count - 1;

  document.querySelectorAll('.guide-focus').forEach(el => el.classList.remove('guide-focus'));
  if (step.target) {
    const target = document.querySelector(step.target);
    if (target) target.classList.add('guide-focus');
  }

  document.getElementById('guide-kicker').textContent =
    `${guideState.scenario.name} · Step ${guideState.stepIndex + 1} of ${count}`;
  document.getElementById('guide-title').textContent = step.title;
  document.getElementById('guide-body').textContent = step.body;
  document.getElementById('btn-guide-prev').disabled = guideState.stepIndex === 0;
  document.getElementById('btn-guide-next').textContent =
    (step.actionLabel && !step._actionUsed) ? step.actionLabel : (atEnd ? 'Finish' : 'Next');
  panel.classList.remove('hidden');
}

function guideNext() {
  if (!guideState) return;
  const step = guideState.scenario.steps[guideState.stepIndex];
  if (step.action && !step._actionUsed) {
    step._actionUsed = true;
    runGuideAction(step);
    renderGuide();
    return;
  }
  if (guideState.stepIndex >= guideState.scenario.steps.length - 1) {
    closeGuide();
    return;
  }
  guideState.stepIndex += 1;
  applyGuideStep();
}

function guidePrev() {
  if (!guideState || guideState.stepIndex === 0) return;
  guideState.stepIndex -= 1;
  applyGuideStep();
}

function closeGuide() {
  guideState = null;
  document.querySelectorAll('.guide-focus').forEach(el => el.classList.remove('guide-focus'));
  document.getElementById('panel-guide').classList.add('hidden');
}

function scheduleGuideRefresh() {
  if (!guideState) return;
  setTimeout(renderGuide, 80);
}

// ---------- Security Copilot stub ----------
function openCopilot(promptIndex = 0) {
  const prompts = document.getElementById('copilot-prompts');
  prompts.innerHTML = COPILOT_PROMPTS.map((p, i) => `
    <button class="copilot-prompt ${i === promptIndex ? 'active' : ''}" onclick="selectCopilotPrompt(${i})">
      ${esc(p.title)}
    </button>
  `).join('');
  selectCopilotPrompt(promptIndex);
  showPanel('panel-copilot');
}

function selectCopilotPrompt(i) {
  const p = COPILOT_PROMPTS[i] || COPILOT_PROMPTS[0];
  document.querySelectorAll('.copilot-prompt').forEach((btn, idx) =>
    btn.classList.toggle('active', idx === i));
  document.getElementById('copilot-answer').innerHTML = `
    <div class="alert-section-title">Prompt</div>
    <div class="copilot-user">${esc(p.title)}</div>
    <div class="alert-section-title">Answer</div>
    <div class="copilot-response">${esc(p.answer)}</div>
  `;
}

// ---------- app switcher ----------
// Map Microsoft Cloud app labels to the workloads navigable in this lab.
const CLOUD_APP_ROUTE = {
  'Defender':          '#/defender/home',
  'Azure':             '#/defender-cloud/overview',
  'Purview':           '#/purview/home',
  'Microsoft Sentinel':'#/sentinel/home',
};
function renderSwitcher() {
  const grid = document.getElementById('switcher-grid');
  const wl = workloadOf(currentRoute());
  const currentLabel = CLOUD_HIGHLIGHT[wl];
  grid.innerHTML = MICROSOFT_CLOUD_NAV.map(item => {
    const route = CLOUD_APP_ROUTE[item.label];
    const onclick = route ? ` onclick="navigate('${route}'); hidePanels();"` : '';
    const cur = item.label === currentLabel ? ' current' : '';
    const dim = route ? '' : ' dim';
    return `
      <div class="switcher-tile${cur}${dim}"${onclick}>
        <div class="switcher-icon">${item.icon}</div>
        <span class="switcher-label">${esc(item.label)}</span>
      </div>`;
  }).join('');
}

// ---------- toast ----------
let toastTimer;
function toast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    Object.assign(t.style, {
      position:'fixed', bottom:'20px', left:'50%', transform:'translateX(-50%)',
      background:'#323130', color:'#fff', padding:'10px 16px', fontSize:'13px',
      borderRadius:'2px', zIndex:200, boxShadow:'var(--shadow-2)',
      transition:'opacity 0.4s',
    });
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.style.opacity = '0'; }, 2400);
}

// ---------- Sentinel automation lab ----------
function grantPlaybookPermissions() {
  localStorage.setItem('defender-lab.sentinel.playbook1Permission', 'granted');
  toast('Granted Microsoft Sentinel access to RG-Playbooks.');
  render();
}
function resetPlaybookPermissions() {
  localStorage.removeItem('defender-lab.sentinel.playbook1Permission');
  toast('Reset: Playbook1 is grayed out until Sentinel gets resource group access.');
  render();
}
function explainDisabledPlaybook() {
  toast('Playbook1 is grayed out because Sentinel lacks Automation Contributor on RG-Playbooks.');
}
function selectSentinelPlaybook(name) {
  toast(`${name} selected for the Run playbook action.`);
}
window.grantPlaybookPermissions = grantPlaybookPermissions;
window.resetPlaybookPermissions = resetPlaybookPermissions;
window.explainDisabledPlaybook = explainDisabledPlaybook;
window.selectSentinelPlaybook = selectSentinelPlaybook;

// ---------- wire-up ----------
document.addEventListener('DOMContentLoaded', () => {
  renderSwitcher();
  render();

  window.addEventListener('hashchange', render);

  document.getElementById('btn-waffle').addEventListener('click', () => {
    renderSwitcher();
    showPanel('panel-switcher');
  });
  document.getElementById('toggle-azure').addEventListener('click', () => togglePane('azure'));
  document.getElementById('toggle-blade').addEventListener('click', () => togglePane('blade'));
  document.getElementById('btn-copilot').addEventListener('click', () => openCopilot());
  document.getElementById('btn-guide-next').addEventListener('click', guideNext);
  document.getElementById('btn-guide-prev').addEventListener('click', guidePrev);
  document.getElementById('btn-guide-close').addEventListener('click', closeGuide);

  document.getElementById('btn-add-cond').addEventListener('click', () => addConditionRow());
  document.getElementById('btn-save-rule').addEventListener('click', () => {
    const name = document.getElementById('rule-name').value.trim() || 'Untitled rule';
    const conds = readConditions();
    if (conds.length === 0) { toast('Add at least one condition.'); return; }
    rules.push({
      id: 'R' + Date.now(),
      name, scope: 'All devices in organization',
      createdAt: new Date().toISOString(),
      enabled: true,
      conditions: conds,
    });
    saveRules();
    hidePanels();
    render();
    toast(`Saved rule "${name}". ${conds.length} condition${conds.length !== 1 ? 's' : ''} joined with AND.`);
  });

  document.querySelectorAll('[data-close]').forEach(btn =>
    btn.addEventListener('click', hidePanels));
  document.getElementById('scrim').addEventListener('click', hidePanels);

  wireGlobalSearch();
});

// ---------- Global topbar search (command-palette-style nav jump) ----------
// Indexes every sidenav route across all workloads plus the workload portal
// roots, then renders an autocomplete dropdown matching the Microsoft 365
// portal pattern. Substring match on label/route, grouped by workload.
function buildSearchIndex() {
  const idx = [];
  for (const [wl, items] of Object.entries(NAV)) {
    const portal = PORTALS.find(p => p.id === wl);
    const workloadName = portal ? portal.name : wl;
    let section = '';
    for (const item of items) {
      if (item.section) { section = item.section; continue; }
      if (!item.route) continue;
      idx.push({
        label: item.label,
        route: item.route,
        icon: item.icon || '•',
        workload: wl,
        workloadName,
        section,
        haystack: (item.label + ' ' + item.route + ' ' + workloadName + ' ' + section).toLowerCase(),
      });
    }
  }
  // Also surface workload homes so "purview" / "sentinel" jump straight there.
  for (const p of PORTALS) {
    const first = (NAV[p.id] || []).find(it => it.route);
    if (!first) continue;
    idx.push({
      label: p.name + ' — home',
      route: first.route,
      icon: p.initial,
      workload: p.id,
      workloadName: p.name,
      section: 'Workload',
      haystack: (p.name + ' home ' + p.id).toLowerCase(),
    });
  }
  return idx;
}
let SEARCH_INDEX = null;
let searchActiveIndex = -1;
let searchMatches = [];

function escHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
function highlightMatch(label, terms) {
  let out = escHtml(label);
  for (const t of terms) {
    if (!t) continue;
    const re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
    out = out.replace(re, '<mark>$1</mark>');
  }
  return out;
}
function renderSearchDropdown(query) {
  const dd = document.getElementById('global-search-dropdown');
  const q = query.trim().toLowerCase();
  if (!q) { dd.hidden = true; dd.innerHTML = ''; searchMatches = []; searchActiveIndex = -1; return; }
  if (!SEARCH_INDEX) SEARCH_INDEX = buildSearchIndex();
  const terms = q.split(/\s+/).filter(Boolean);
  const scored = SEARCH_INDEX
    .map(item => {
      let score = 0;
      for (const t of terms) {
        if (!item.haystack.includes(t)) return null;
        if (item.label.toLowerCase().startsWith(t)) score += 5;
        if (item.label.toLowerCase().includes(t)) score += 3;
        score += 1;
      }
      return { item, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label))
    .slice(0, 12);
  searchMatches = scored.map(s => s.item);
  searchActiveIndex = searchMatches.length ? 0 : -1;
  if (!searchMatches.length) {
    dd.innerHTML = `<div class="search-dropdown-empty">No matches for "${escHtml(query)}". Try a workload (Sentinel, Purview) or page name (alerts, hunting, DLP).</div>`;
    dd.hidden = false;
    return;
  }
  // Group by workload, preserving sorted order.
  const groups = [];
  const seenWl = new Set();
  for (const item of searchMatches) {
    if (!seenWl.has(item.workload)) {
      seenWl.add(item.workload);
      groups.push({ workload: item.workload, name: item.workloadName, items: [] });
    }
    groups.find(g => g.workload === item.workload).items.push(item);
  }
  let html = '';
  let i = 0;
  for (const g of groups) {
    html += `<div class="search-group-label">${escHtml(g.name)}</div>`;
    for (const item of g.items) {
      const active = i === searchActiveIndex ? ' active' : '';
      const crumb = item.section ? escHtml(item.section) + ' › ' : '';
      html += `
        <button type="button" class="search-result${active}" role="option" data-search-index="${i}" data-route="${escHtml(item.route)}">
          <span class="search-result-icon">${escHtml(item.icon)}</span>
          <span class="search-result-text">
            <span class="search-result-label">${highlightMatch(item.label, terms)}</span>
            <span class="search-result-crumb">${crumb}<span class="search-result-route">${escHtml(item.route)}</span></span>
          </span>
        </button>`;
      i++;
    }
  }
  dd.innerHTML = html;
  dd.hidden = false;
}
function commitSearchSelection(idx) {
  const item = searchMatches[idx];
  if (!item) return;
  const input = document.getElementById('global-search');
  const dd = document.getElementById('global-search-dropdown');
  input.value = '';
  input.blur();
  dd.hidden = true;
  dd.innerHTML = '';
  searchMatches = [];
  searchActiveIndex = -1;
  navigate(item.route);
}
function setSearchActive(idx) {
  const dd = document.getElementById('global-search-dropdown');
  searchActiveIndex = idx;
  dd.querySelectorAll('.search-result').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
    if (i === idx) el.scrollIntoView({ block: 'nearest' });
  });
}
function wireGlobalSearch() {
  const input = document.getElementById('global-search');
  const dd = document.getElementById('global-search-dropdown');
  if (!input || !dd) return;
  input.addEventListener('input', e => renderSearchDropdown(e.target.value));
  input.addEventListener('focus', e => {
    if (e.target.value.trim()) renderSearchDropdown(e.target.value);
  });
  input.addEventListener('keydown', e => {
    if (dd.hidden || !searchMatches.length) {
      if (e.key === 'Escape') { input.value = ''; dd.hidden = true; }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchActive((searchActiveIndex + 1) % searchMatches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSearchActive((searchActiveIndex - 1 + searchMatches.length) % searchMatches.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      commitSearchSelection(searchActiveIndex >= 0 ? searchActiveIndex : 0);
    } else if (e.key === 'Escape') {
      input.value = ''; dd.hidden = true; searchMatches = []; searchActiveIndex = -1;
    }
  });
  dd.addEventListener('mousedown', e => {
    // Use mousedown so the click registers before the input's blur hides us.
    const btn = e.target.closest('.search-result');
    if (!btn) return;
    e.preventDefault();
    commitSearchSelection(+btn.dataset.searchIndex);
  });
  input.addEventListener('blur', () => {
    // Defer so a click on a result still fires before we hide.
    setTimeout(() => { dd.hidden = true; }, 120);
  });
}

// ---------- Defender for Endpoint device pages ----------
function openDevice(id, tab) {
  sessionStorage.setItem('defender-lab.device.id', id);
  sessionStorage.setItem('defender-lab.device.tab', tab || 'overview');
  hidePanels();
  navigate('#/defender/device');
}
function setDeviceTab(tab) {
  sessionStorage.setItem('defender-lab.device.tab', tab);
  render();
}

// Open the MITRE technique side pane from a Timeline technique marker.
function openTechnique(deviceId, index) {
  const events = (DEVICE_TIMELINE_EVENTS[deviceId] || [])
    .slice().sort((a,b) => new Date(b.time) - new Date(a.time));
  const row = events[index];
  if (!row || row.kind !== 'technique') return;
  const tactic = row.tactic || TECHNIQUE_TACTIC_LOOKUP[row.techniqueId] || 'Unknown tactic';
  const device = DEVICES.find(d => d.id === deviceId) || { name: deviceId };
  // Count underlying event rows on this device that map back to the technique.
  const relatedCount = events.filter(e => e.kind === 'event' && e.techniqueId === row.techniqueId).length;

  document.getElementById('technique-title').textContent =
    `${row.techniqueId} — ${row.techniqueName}`;
  document.getElementById('technique-body').innerHTML = `
    <div class="alert-section-title">Technique information</div>
    <div class="pill-row">
      <span class="tag">${esc(row.techniqueId)}</span>
      <span class="tag">${esc(row.techniqueName)}</span>
      <span class="tag">${esc(tactic)}</span>
      <span class="tag">MITRE ATT&amp;CK</span>
    </div>

    <div class="alert-section-title">Description</div>
    <p class="muted" style="line-height:1.45;">${esc(row.description || 'Technique detected from device telemetry.')}</p>

    <div class="alert-section-title">Observed on</div>
    <dl class="kv-list">
      <dt>Device</dt><dd>${esc(device.name)}</dd>
      <dt>First sighting (this view)</dt><dd>${fmtTime(row.time)}</dd>
      <dt>Underlying events on this device</dt><dd>${relatedCount}</dd>
    </dl>

    <div class="sidepanel-footer">
      <button class="btn btn-primary"
        onclick='huntRelatedEvents(${JSON.stringify({
          deviceId,
          deviceName: device.name,
          techniqueId: row.techniqueId,
          techniqueName: row.techniqueName,
          time: row.time,
        }).replace(/'/g,"&#39;")})'>Hunt for related events</button>
      <button class="btn btn-secondary"
        onclick="navigator.clipboard.writeText('${esc(row.techniqueId)}'); toast('Copied ${esc(row.techniqueId)}.')">Copy technique ID</button>
    </div>

    <div class="callout info" style="margin-top:18px;">
      <strong>What hunting will return:</strong> the underlying endpoint events related to
      <code>${esc(row.techniqueId)}</code> on <code>${esc(device.name)}</code> within a time window
      around the selected event. <em>The Technique marker row itself is not included in the query results.</em>
    </div>
  `;
  showPanel('panel-technique');
}

function responsePanel(title, html) {
  document.getElementById('device-response-title').textContent = title;
  document.getElementById('device-response-body').innerHTML = html;
  showPanel('panel-device-response');
}

function openDeviceLiveResponse(deviceId) {
  const device = DEVICES.find(d => d.id === deviceId) || { name: deviceId };
  const session = DEVICE_LIVE_RESPONSE[deviceId] || {
    operator:'alex.ansbergs',
    started:new Date().toISOString(),
    status:'Ready',
    transcript:[
      { prompt:`connect ${deviceId}`, output:'Session prepared. Select a scoped device with active MDE sensor telemetry.' },
      { prompt:'dir C:\\', output:'Canned lab transcript is not available for this device.' },
    ],
    log:['Session template opened'],
  };
  responsePanel(`Live response - ${device.name}`, `
    <div class="alert-section-title">Session</div>
    <dl class="kv-list">
      <dt>Device</dt><dd>${esc(device.name)}</dd>
      <dt>Status</dt><dd><span class="tag green">${esc(session.status)}</span></dd>
      <dt>Operator</dt><dd>${esc(session.operator)}</dd>
      <dt>Started</dt><dd>${fmtTime(session.started)}</dd>
    </dl>
    <div class="alert-section-title">Lab console transcript</div>
    <div class="response-console">
      ${session.transcript.map(step => `
        <div><span class="console-prompt">LR&gt; ${esc(step.prompt)}</span><pre>${esc(step.output)}</pre></div>
      `).join('')}
    </div>
    <div class="alert-section-title">Session log</div>
    <ul class="response-list">${session.log.map(item => `<li>${esc(item)}</li>`).join('')}</ul>
    <div class="callout info">Live response is for scoped investigation commands such as <code>dir</code>, <code>getfile</code>, and approved scripts. This lab transcript is static and never runs commands on the host.</div>
  `);
}

function openInvestigationPackage(deviceId) {
  const device = DEVICES.find(d => d.id === deviceId) || { name: deviceId };
  const pkg = DEVICE_INVESTIGATION_PACKAGES[deviceId] || {
    status:'Ready',
    collected:new Date().toISOString(),
    reason:'Collect host evidence before remediation.',
    contents:['Autoruns','Process list','Network summary','Defender sensor diagnostics'],
    guidance:['Use the package to preserve host-level evidence before rebuild or wipe.'],
  };
  responsePanel(`Investigation package - ${device.name}`, `
    <div class="alert-section-title">Collection flow</div>
    <div class="response-flow">
      <div><strong>1. Request</strong><span>Analyst starts package collection from the device action strip.</span></div>
      <div><strong>2. Collect</strong><span>MDE sensor gathers triage artifacts from the endpoint.</span></div>
      <div><strong>3. Review</strong><span>Analyst downloads the package and correlates contents with Timeline and hunting rows.</span></div>
    </div>
    <dl class="kv-list">
      <dt>Status</dt><dd>${esc(pkg.status)}</dd>
      <dt>Collected</dt><dd>${fmtTime(pkg.collected)}</dd>
      <dt>Use case</dt><dd>${esc(pkg.reason)}</dd>
    </dl>
    <div class="alert-section-title">Package contents</div>
    <ul class="response-list">${pkg.contents.map(item => `<li>${esc(item)}</li>`).join('')}</ul>
    <div class="alert-section-title">When to use it</div>
    <ul class="response-list">${pkg.guidance.map(item => `<li>${esc(item)}</li>`).join('')}</ul>
  `);
}

function openDeviceTimelineEvent(deviceId, index) {
  const events = (DEVICE_TIMELINE_EVENTS[deviceId] || [])
    .slice().sort((a,b) => new Date(b.time) - new Date(a.time));
  const row = events[index];
  if (!row || row.kind !== 'event') return;
  const device = DEVICES.find(d => d.id === deviceId) || { name: deviceId };
  const tree = DEVICE_PROCESS_TREES[deviceId] || [];
  responsePanel(`Timeline event - ${device.name}`, `
    <div class="alert-section-title">${esc(row.title || row.actionType || 'Timeline event')}</div>
    <dl class="kv-list">
      <dt>Time</dt><dd>${fmtTime(row.time)}</dd>
      <dt>Table</dt><dd>${esc(row.table || 'DeviceEvents')}</dd>
      <dt>Action type</dt><dd>${esc(row.actionType || 'Event')}</dd>
      <dt>Account</dt><dd>${esc(row.account || '—')}</dd>
      <dt>Command line</dt><dd><code>${esc(row.cmdline || '—')}</code></dd>
      <dt>SHA1 / hash</dt><dd><code>${esc(row.sha256 || 'not present in this fixture')}</code></dd>
    </dl>
    <div class="alert-section-title">Process tree</div>
    <div class="process-tree">
      ${tree.map(p => `
        <div class="process-row depth-${Math.min(p.depth, 3)}">
          <strong>${esc(p.name)}</strong><span>${esc(p.detail)}</span>
        </div>
      `).join('') || '<div class="muted">No process tree captured for this fixture row.</div>'}
    </div>
    <div class="sidepanel-footer">
      <button class="btn btn-secondary" onclick="navigator.clipboard.writeText('${esc(row.cmdline || '')}'); toast('Copied command line.')">Copy command line</button>
      <button class="btn btn-secondary" onclick="navigator.clipboard.writeText('${esc(row.sha256 || '')}'); toast('Copied hash value.')">Copy SHA1</button>
    </div>
  `);
}

function huntTime(baseIso, seconds) {
  return new Date(new Date(baseIso).getTime() + seconds * 1000).toISOString();
}

function syntheticHuntRows(payload, sourceEvents) {
  const device = DEVICES.find(d => d.id === payload.deviceId) || {};
  const primary = sourceEvents[0] || {};
  const common = {
    DeviceId: payload.deviceId,
    DeviceName: payload.deviceName,
    AccountName: primary.account || device.primaryUser || '',
    AttackTechniques: payload.techniqueId,
    HuntSource: 'Timeline side pane',
  };
  const row = (seconds, sourceTable, actionType, extra) => ({
    Timestamp: huntTime(payload.time, seconds),
    SourceTable: sourceTable,
    ActionType: actionType,
    ...common,
    ...extra,
  });

  const processName = primary.fileName || (payload.deviceId === 'FIN-FS-02' ? 'locker.exe' : 'scanner.exe');
  const processPath = primary.folder || (payload.deviceId === 'FIN-FS-02'
    ? `C:\\ProgramData\\${processName}`
    : `C:\\Users\\Public\\${processName}`);
  const commandLine = primary.cmdline || processName;

  const scenarios = {
    T1036: [
      row(-19, 'DeviceFileEvents', 'FileCreated', {
        FileName: processName, FolderPath: processPath, SHA256: primary.sha256 || ROGUE_HASH,
        AdditionalFields: 'ZoneId=3; OriginalFileName=svchost.exe; Signer=(unsigned)',
      }),
      row(-17, 'DeviceProcessEvents', 'ProcessCreated', {
        FileName: processName, FolderPath: processPath, ProcessCommandLine: commandLine,
        InitiatingProcessFileName: 'explorer.exe',
      }),
      row(-13, 'DeviceImageLoadEvents', 'ImageLoaded', {
        FileName: 'amsi.dll', FolderPath: 'C:\\Windows\\System32\\amsi.dll',
        InitiatingProcessFileName: processName,
      }),
      row(-8, 'DeviceRegistryEvents', 'RegistryValueSet', {
        RegistryKey: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
        RegistryValueName: 'OneDrive Update', RegistryValueData: processPath,
      }),
      row(7, 'DeviceNetworkEvents', 'ConnectionSuccess', {
        InitiatingProcessFileName: processName, RemoteIP: '185.199.111.12',
        RemotePort: 443, RemoteUrl: 'cdn-checkin.example',
      }),
    ],
    T1071: [
      row(-10, 'DeviceProcessEvents', 'ProcessCreated', {
        FileName: processName, FolderPath: processPath, ProcessCommandLine: commandLine,
        InitiatingProcessFileName: 'explorer.exe',
      }),
      row(-4, 'DeviceNetworkEvents', 'DnsQuery', {
        InitiatingProcessFileName: processName, RemoteUrl: 'cdn-checkin.example',
        AdditionalFields: 'QueryType=A; ResponseCode=NoError',
      }),
      row(0, 'DeviceNetworkEvents', 'ConnectionSuccess', {
        InitiatingProcessFileName: processName, RemoteIP: primary.remoteIP || '185.199.111.12',
        RemotePort: primary.remotePort || 443, RemoteUrl: 'cdn-checkin.example',
      }),
      row(4, 'DeviceNetworkEvents', 'TlsHandshake', {
        InitiatingProcessFileName: processName, RemoteIP: primary.remoteIP || '185.199.111.12',
        RemotePort: 443, AdditionalFields: 'Sni=cdn-checkin.example; JA3=72a589da586844d7f0818ce684948eea',
      }),
    ],
    T1110: [
      row(-7, 'DeviceLogonEvents', 'LogonFailed', {
        LogonType: 'Interactive', FailureReason: 'BadPassword', AccountName: primary.account || 'jdoe',
      }),
      row(-3, 'DeviceLogonEvents', 'LogonFailed', {
        LogonType: 'Interactive', FailureReason: 'BadPassword', AccountName: primary.account || 'jdoe',
      }),
      row(0, 'DeviceLogonEvents', 'LogonSuccess', {
        LogonType: 'Interactive', AccountName: primary.account || 'jdoe',
      }),
      row(9, 'DeviceProcessEvents', 'ProcessCreated', {
        FileName: 'cmd.exe', FolderPath: 'C:\\Windows\\System32\\cmd.exe',
        ProcessCommandLine: 'cmd.exe /c whoami && hostname',
      }),
    ],
    T1490: [
      row(-8, 'DeviceProcessEvents', 'ProcessCreated', {
        FileName: 'vssadmin.exe', FolderPath: 'C:\\Windows\\System32\\vssadmin.exe',
        ProcessCommandLine: 'vssadmin delete shadows /all /quiet',
      }),
      row(-4, 'DeviceProcessEvents', 'ProcessCreated', {
        FileName: 'wmic.exe', FolderPath: 'C:\\Windows\\System32\\wbem\\wmic.exe',
        ProcessCommandLine: 'wmic shadowcopy delete',
      }),
      row(3, 'DeviceEvents', 'RecoveryArtifactDeleted', {
        AdditionalFields: 'DeletedShadowCopies=12; Volume=C:',
      }),
    ],
    T1486: [
      row(-9, 'DeviceProcessEvents', 'ProcessCreated', {
        FileName: 'locker.exe', FolderPath: 'C:\\ProgramData\\locker.exe',
        ProcessCommandLine: 'locker.exe --encrypt --shares',
      }),
      row(-1, 'DeviceFileEvents', 'FileRenamed', {
        FileName: 'Q4_forecast.xlsx.locked', FolderPath: 'D:\\Finance\\Q4_forecast.xlsx.locked',
        PreviousFileName: 'Q4_forecast.xlsx',
      }),
      row(5, 'DeviceFileEvents', 'FileCreated', {
        FileName: 'RECOVER-FILES.txt', FolderPath: 'D:\\Finance\\RECOVER-FILES.txt',
      }),
    ],
    T1021: [
      row(-6, 'DeviceLogonEvents', 'LogonSuccess', {
        LogonType: 'RemoteInteractive', RemoteIP: primary.remoteIP || '10.20.7.14',
        RemoteDeviceName: 'WKS-03', Protocol: 'NTLM',
      }),
      row(0, 'DeviceNetworkEvents', 'InboundConnectionAccepted', {
        LocalPort: 3389, RemoteIP: primary.remoteIP || '10.20.7.14',
      }),
      row(8, 'DeviceProcessEvents', 'ProcessCreated', {
        FileName: 'cmd.exe', FolderPath: 'C:\\Windows\\System32\\cmd.exe',
        ProcessCommandLine: 'cmd.exe /c net use',
      }),
    ],
  };

  const rows = scenarios[payload.techniqueId] || sourceEvents.map((e, index) => row(index * 3, e.table || 'DeviceEvents', e.actionType || 'RelatedEvent', {
    FileName: e.fileName || '',
    FolderPath: e.folder || '',
    ProcessCommandLine: e.cmdline || '',
    RemoteIP: e.remoteIP || '',
    RemotePort: e.remotePort || '',
    AdditionalFields: e.description || '',
  }));

  return rows.map((r, index) => ({
    ReportId: `${payload.techniqueId}-${payload.deviceId}-${index + 1}`,
    ...r,
  }));
}

function seedSyntheticHuntRows(payload, sourceEvents) {
  const huntId = `${payload.deviceId}:${payload.techniqueId}:${payload.time}`;
  const generatedRows = syntheticHuntRows(payload, sourceEvents)
    .map(r => ({ ...r, SyntheticHuntId: huntId }));
  MOCK_QUERY_RESULTS.DeviceEvents = (MOCK_QUERY_RESULTS.DeviceEvents || [])
    .filter(r => r.SyntheticHuntId !== huntId)
    .concat(generatedRows);
  return huntId;
}

// Build the prefilled KQL and hand off to Advanced hunting.
function huntRelatedEvents(payload) {
  const ts = payload.time;
  const start = new Date(new Date(ts).getTime() - 30 * 60 * 1000).toISOString();
  const end   = new Date(new Date(ts).getTime() + 30 * 60 * 1000).toISOString();
  const events = (DEVICE_TIMELINE_EVENTS[payload.deviceId] || [])
    .filter(e => e.kind === 'event' && e.techniqueId === payload.techniqueId);
  const huntId = seedSyntheticHuntRows(payload, events);
  const kql =
`// Generated by: Timeline › ${payload.techniqueId} side pane › Hunt for related events
// Scope: device "${payload.deviceName}", technique ${payload.techniqueId} (${payload.techniqueName})
// Note: synthetic lab rows expand the underlying evidence across process, file, registry, network, image-load, and logon telemetry.
// The Technique marker row is NOT included in the query results.
DeviceEvents
| where Timestamp between (datetime(${start}) .. datetime(${end}))
| where DeviceId == "${payload.deviceId}"
| where AttackTechniques has "${payload.techniqueId}"
| where SyntheticHuntId == "${huntId}"
| project Timestamp, SourceTable, DeviceName, ActionType, FileName, FolderPath, ProcessCommandLine, AccountName, RemoteIP, RemoteUrl, RegistryKey, AdditionalFields, AttackTechniques
| sort by Timestamp desc`;
  sessionStorage.setItem('defender-lab.hunting.prefill', kql);
  sessionStorage.setItem('defender-lab.hunting.autorun', '1');
  hidePanels();
  navigate('#/defender/hunting');
  toast(`Loaded hunt for ${payload.techniqueId} on ${payload.deviceName}.`);
}

// ---------- Defender for Identity ↔ XDR identity pages ----------
function openIdentity(id, tab) {
  sessionStorage.setItem('defender-lab.identity.id', id);
  sessionStorage.setItem('defender-lab.identity.tab', tab || 'overview');
  navigate('#/defender/identity');
}
function setIdentityTab(tab) {
  sessionStorage.setItem('defender-lab.identity.tab', tab);
  render();
}

// Open the classification helper for an identity-timeline alert row.
// Reuses the panel-technique side pane (it's a generic right-side panel).
function openIdentityAlert(identityId, index) {
  const rows = IDENTITY_TIMELINE[identityId] || [];
  const row = rows[index];
  if (!row || row.kind !== 'alert') return;
  const ident = IDENTITIES.find(i => i.id === identityId) || { displayName: identityId };
  const sevCls = row.severity === 'high' ? 'high' : row.severity === 'medium' ? 'medium' : 'info';
  const verdictTone = {
    'True positive': 'bad',
    'Benign true positive': 'warn',
    'False positive': 'info',
    'Pending': 'info',
  }[row.classification] || 'info';

  document.getElementById('technique-title').textContent =
    `${row.alertId} — ${row.title}`;
  document.getElementById('technique-body').innerHTML = `
    <div class="alert-section-title">Alert</div>
    <dl class="kv-list">
      <dt>ID</dt><dd>${esc(row.alertId)}</dd>
      <dt>Severity</dt><dd><span class="sev ${sevCls}">${cap(row.severity)}</span></dd>
      <dt>Source</dt><dd>${esc(row.source)}</dd>
      <dt>Identity</dt><dd>${esc(ident.displayName)} (${esc(ident.upn || '')})</dd>
      <dt>When</dt><dd>${fmtTime(row.time)}</dd>
    </dl>

    <div class="alert-section-title">Description</div>
    <p class="muted" style="line-height:1.45;">${esc(row.description)}</p>

    <div class="alert-section-title">Classification</div>
    <div class="callout ${verdictTone}">
      <strong>${esc(row.classification)}</strong> — ${esc(row.classificationWhy)}
    </div>
    ${row.classifyNote ? `<p class="muted" style="line-height:1.45; margin-top:8px;"><em>${esc(row.classifyNote)}</em></p>` : ''}

    <div class="alert-section-title">Classification choices (Defender XDR)</div>
    <table class="grid" style="font-size:12px;">
      <thead><tr><th>Verdict</th><th>When to pick it</th></tr></thead>
      <tbody>
        <tr><td><span class="sev high">True positive</span></td>
            <td>Real malicious activity confirmed.</td></tr>
        <tr><td><span class="sev medium">Benign true positive</span></td>
            <td>Detection is accurate (the behavior did occur) but the activity is expected — Entra Connect/MSOL_ sync, authorized red-team test, documented break-glass action.</td></tr>
        <tr><td><span class="sev info">False positive</span></td>
            <td>Detection was wrong — the behavior did NOT actually occur.</td></tr>
      </tbody>
    </table>

    <div class="sidepanel-footer">
      <button class="btn btn-primary" onclick="toast('Marked ${esc(row.classification)} (lab stub).'); hidePanels();">Classify as ${esc(row.classification)}</button>
      <button class="btn btn-secondary" onclick="toast('Open in Defender (lab stub).')">Open alert page</button>
    </div>
  `;
  showPanel('panel-technique');
}

window.openIdentity      = openIdentity;
window.setIdentityTab    = setIdentityTab;
window.openIdentityAlert = openIdentityAlert;

// expose for inline handlers in views.js
window.openDevice        = openDevice;
window.setDeviceTab      = setDeviceTab;
window.openTechnique     = openTechnique;
window.openDeviceLiveResponse = openDeviceLiveResponse;
window.openInvestigationPackage = openInvestigationPackage;
window.openDeviceTimelineEvent = openDeviceTimelineEvent;
window.huntRelatedEvents = huntRelatedEvents;
window.navigate          = navigate;
window.openAlert         = openAlert;
window.openIncident      = openIncident;
window.openIncidentPage  = openIncidentPage;
window.openEntityPivot   = openEntityPivot;
window.setAttackStoryStep = setAttackStoryStep;
window.playAttackStory   = playAttackStory;
window.selectAttackStoryNode = selectAttackStoryNode;
window.openRulePanel     = openRulePanel;
window.deleteRule        = deleteRule;
window.replayScenario    = replayScenario;
window.openSentinelRule  = openSentinelRule;
window.openAnalyticsWizard = openAnalyticsWizard;
window.setAnalyticsWizardStep = setAnalyticsWizardStep;
window.moveAnalyticsWizardStep = moveAnalyticsWizardStep;
window.toggleWizardAccordion = toggleWizardAccordion;
window.previewAnalyticsWizardResults = previewAnalyticsWizardResults;
window.toggleEntityCatalog = toggleEntityCatalog;
window.addEntityMapping = addEntityMapping;
window.removeEntityMapping = removeEntityMapping;
window.changeEntityType = changeEntityType;
window.updateEntityField = updateEntityField;
window.addEntityIdentifier = addEntityIdentifier;
window.removeEntityIdentifier = removeEntityIdentifier;
window.hidePanels        = hidePanels;
window.startGuidedScenario = startGuidedScenario;
window.openCopilot       = openCopilot;
window.selectCopilotPrompt = selectCopilotPrompt;

// ---------- Sentinel connector and DCR labs ----------
const SYSLOG_AMA_STATE_KEY = 'defender-lab.sentinel.syslogAma';
const SENTINEL_INGESTION_STATE_PREFIX = 'defender-lab.sentinel.ingestion.';
function currentSyslogAmaState() {
  const empty = {
    solutionInstalled:false,
    connectorOpened:false,
    dcrCreated:false,
    daemonConfigured:false,
    verified:false,
  };
  const raw = localStorage.getItem(SYSLOG_AMA_STATE_KEY);
  if (!raw) return empty;
  try { return { ...empty, ...JSON.parse(raw) }; }
  catch { return empty; }
}
function saveSyslogAmaState(next) {
  localStorage.setItem(SYSLOG_AMA_STATE_KEY, JSON.stringify({ ...currentSyslogAmaState(), ...next }));
}
function installSentinelSolution(id) {
  if (id !== 'syslog') {
    toast('Solution opened in lab stub.');
    return;
  }
  saveSyslogAmaState({ solutionInstalled:true });
  toast('Syslog solution installed. The Syslog via AMA connector is now available.');
  render();
}
function openSyslogAmaConnector() {
  const state = currentSyslogAmaState();
  if (!state.solutionInstalled) {
    toast('Install the Syslog solution from Content hub first.');
    navigate('#/sentinel/content-hub');
    return;
  }
  saveSyslogAmaState({ connectorOpened:true });
  toast('Syslog via AMA connector opened. Create the DCR from this connector page.');
  navigate('#/sentinel/data-connectors');
}
function createSyslogAmaDcr() {
  const state = currentSyslogAmaState();
  if (!state.solutionInstalled || !state.connectorOpened) {
    toast('Open the Syslog via AMA connector after installing the Syslog solution.');
    return;
  }
  saveSyslogAmaState({ dcrCreated:true });
  toast('DCR-Syslog-VM1 created. AMA was deployed to VM1 by the connector workflow.');
  render();
}
function configureSyslogDaemon() {
  if (!currentSyslogAmaState().dcrCreated) {
    toast('Create the DCR and select VM1 before configuring rsyslog.');
    return;
  }
  saveSyslogAmaState({ daemonConfigured:true });
  toast('rsyslog on VM1 configured to receive appliance Syslog on port 514.');
  render();
}
function verifySyslogIngestion() {
  if (!currentSyslogAmaState().daemonConfigured) {
    toast('Configure rsyslog on VM1 before verifying ingestion.');
    return;
  }
  saveSyslogAmaState({ verified:true });
  toast('Syslog rows are arriving from VM1.');
  render();
}
function resetSyslogAmaLab() {
  localStorage.removeItem(SYSLOG_AMA_STATE_KEY);
  toast('Syslog via AMA lab reset.');
  render();
}
function emptyIngestionLabState() {
  return {
    solutionInstalled:false,
    connectorOpened:false,
    dcrCreated:false,
    scoped:false,
    daemonConfigured:false,
    policyConfigured:false,
    diagnosticConfigured:false,
    appRegistered:false,
    roleAssigned:false,
    endpointChosen:false,
    streamDeclared:false,
    tableCreated:false,
    verified:false,
  };
}
function ingestionLabById(id) {
  return SENTINEL_INGESTION_LABS.find(l => l.id === id);
}
function currentSentinelIngestionState(id) {
  const empty = emptyIngestionLabState();
  const raw = localStorage.getItem(SENTINEL_INGESTION_STATE_PREFIX + id);
  if (!raw) return empty;
  try { return { ...empty, ...JSON.parse(raw) }; }
  catch { return empty; }
}
function saveSentinelIngestionState(id, next) {
  localStorage.setItem(
    SENTINEL_INGESTION_STATE_PREFIX + id,
    JSON.stringify({ ...currentSentinelIngestionState(id), ...next })
  );
}
function installSentinelIngestionSolution(id) {
  const lab = ingestionLabById(id);
  if (!lab) return;
  saveSentinelIngestionState(id, { solutionInstalled:true });
  toast(`${lab.solution} solution ready. Open the connector next.`);
  render();
}
function openSentinelIngestionConnector(id) {
  const lab = ingestionLabById(id);
  if (!lab) return;
  const state = currentSentinelIngestionState(id);
  if (!state.solutionInstalled && lab.id !== 'azure-activity' && lab.id !== 'custom-logs') {
    toast(`Confirm the ${lab.solution} solution in Content hub first.`);
    navigate('#/sentinel/content-hub');
    return;
  }
  saveSentinelIngestionState(id, { connectorOpened:true });
  toast(`${lab.connector} connector opened.`);
  navigate('#/sentinel/data-connectors');
}
function advanceSentinelIngestionLab(id, step) {
  const lab = ingestionLabById(id);
  if (!lab) return;
  const state = currentSentinelIngestionState(id);
  const updates = {};
  const needsConnector = ['dcr', 'scope', 'daemon', 'verify'];
  if (needsConnector.includes(step) && !state.connectorOpened) {
    toast(`Open ${lab.connector} before this step.`);
    return;
  }
  if (step === 'dcr' && !state.solutionInstalled && lab.id !== 'azure-activity' && lab.id !== 'custom-logs') {
    toast(`Confirm the ${lab.solution} solution before creating the DCR.`);
    return;
  }
  if (step === 'scope' && !state.dcrCreated) {
    toast('Create the DCR before scoping events.');
    return;
  }
  if (step === 'daemon' && !state.dcrCreated) {
    toast('Create the DCR before configuring the forwarder.');
    return;
  }
  if (step === 'diagnostic' && !state.policyConfigured) {
    toast('Choose the Azure Policy or diagnostic settings path first.');
    return;
  }
  if (step === 'role' && !state.appRegistered) {
    toast('Create the app registration before assigning the role.');
    return;
  }
  if (step === 'endpoint' && !state.roleAssigned) {
    toast('Assign Monitoring Metrics Publisher before choosing the endpoint.');
    return;
  }
  if (step === 'stream' && !state.endpointChosen) {
    toast('Choose DCE or DCR direct endpoint before declaring streams.');
    return;
  }
  if (step === 'table' && !state.streamDeclared) {
    toast('Declare the stream and transform before creating the _CL table.');
    return;
  }
  if (step === 'verify') {
    const ready = lab.id === 'windows-security'
      ? state.scoped
      : lab.id === 'cef'
        ? state.daemonConfigured
        : lab.id === 'azure-activity'
          ? state.diagnosticConfigured || state.policyConfigured
          : state.tableCreated;
    if (!ready) {
      toast('Complete the ingestion configuration before verifying rows.');
      return;
    }
  }
  const keyByStep = {
    solution:'solutionInstalled',
    connector:'connectorOpened',
    dcr:'dcrCreated',
    scope:'scoped',
    daemon:'daemonConfigured',
    policy:'policyConfigured',
    diagnostic:'diagnosticConfigured',
    app:'appRegistered',
    role:'roleAssigned',
    endpoint:'endpointChosen',
    stream:'streamDeclared',
    table:'tableCreated',
    verify:'verified',
  };
  updates[keyByStep[step] || step] = true;
  saveSentinelIngestionState(id, updates);
  toast(`${lab.title}: ${step === 'verify' ? 'verification rows available' : 'step completed'}.`);
  render();
}
function resetSentinelIngestionLab(id) {
  localStorage.removeItem(SENTINEL_INGESTION_STATE_PREFIX + id);
  toast('Sentinel ingestion lab reset.');
  render();
}
window.currentSyslogAmaState = currentSyslogAmaState;
window.installSentinelSolution = installSentinelSolution;
window.openSyslogAmaConnector = openSyslogAmaConnector;
window.createSyslogAmaDcr = createSyslogAmaDcr;
window.configureSyslogDaemon = configureSyslogDaemon;
window.verifySyslogIngestion = verifySyslogIngestion;
window.resetSyslogAmaLab = resetSyslogAmaLab;
window.currentSentinelIngestionState = currentSentinelIngestionState;
window.installSentinelIngestionSolution = installSentinelIngestionSolution;
window.openSentinelIngestionConnector = openSentinelIngestionConnector;
window.advanceSentinelIngestionLab = advanceSentinelIngestionLab;
window.resetSentinelIngestionLab = resetSentinelIngestionLab;

// ---------- Sentinel search jobs ----------
function runSentinelSearchJob() {
  localStorage.setItem('defender-lab.sentinel.networklogs.searchJob', 'complete');
  toast('Search job completed. Retained Basic table rows are available for analysis.');
  render();
}
window.runSentinelSearchJob = runSentinelSearchJob;

function runSentinelDataLakeJob() {
  localStorage.setItem('defender-lab.sentinel.dataLakeJob', 'complete');
  toast('Data lake KQL job completed. Results table is ready.');
  render();
}
window.runSentinelDataLakeJob = runSentinelDataLakeJob;

// ---------- Sentinel workspace selector ----------
function currentWorkspace() {
  const id = localStorage.getItem('defender-lab.sentinel.workspace');
  return SENTINEL_WORKSPACES.find(w => w.id === id) || SENTINEL_WORKSPACES[0];
}
function setWorkspace(id) {
  localStorage.setItem('defender-lab.sentinel.workspace', id);
  render();
}
window.currentWorkspace = currentWorkspace;
window.setWorkspace      = setWorkspace;
