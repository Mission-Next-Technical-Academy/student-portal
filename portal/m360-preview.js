(() => {
  'use strict';

  const STORAGE_KEY = 'mnt.m360.preview.portfolio.v2';
  const LEGACY_KEY = 'mnt.m360.preview.week1.v1';
  const SCHEMA_VERSION = 2;

  const roadmap = [
    { key: 'week1', week: '01', stage: 'Direction', title: 'Career Direction & Professional Brand', artifact: 'Accepted brand statement + evidence' },
    { key: 'week2', week: '02', stage: 'Signal', title: 'LinkedIn & Professional Presence', artifact: 'Credible professional profile + profile URL' },
    { key: 'week3', week: '03', stage: 'Connection', title: 'Networking & Professional Follow-Up', artifact: 'Outreach + learning reflection' },
    { key: 'week4', week: '04', stage: 'Evidence', title: 'Targeted Resume Development', artifact: 'Role-aligned resume + reusable bullet bank' },
    { key: 'week5', week: '05', stage: 'Voice', title: 'Interview Preparation & Practice', artifact: 'STAR story bank + interview practice' },
    { key: 'week6', week: '06', stage: 'Proof', title: 'Career Spotlight', artifact: 'Career Spotlight + 30-day action plan' }
  ];

  const fields = Array.from(document.querySelectorAll('[data-m360]'));
  const qualityChecks = Array.from(document.querySelectorAll('[data-quality]'));
  const saveState = document.getElementById('saveState');
  const validationMessage = document.getElementById('validationMessage');

  function blankWeek1Draft() {
    return {
      direction: '',
      nextStep: '',
      strength1: '', evidence1: '',
      strength2: '', evidence2: '',
      strength3: '', evidence3: '',
      translation: '',
      brandStatement: ''
    };
  }

  function defaultState() {
    return {
      schemaVersion: SCHEMA_VERSION,
      updatedAt: null,
      weeks: {
        week1: { status: 'draft', draft: blankWeek1Draft(), accepted: null, acceptedAt: null },
        week2: { status: 'future' },
        week3: { status: 'future' },
        week4: { status: 'future' },
        week5: { status: 'future' },
        week6: { status: 'future' }
      }
    };
  }

  function safeParse(raw) {
    try { return raw ? JSON.parse(raw) : null; } catch (_) { return null; }
  }

  function migrateLegacy() {
    const legacy = safeParse(localStorage.getItem(LEGACY_KEY));
    if (!legacy) return null;
    const state = defaultState();
    const draft = state.weeks.week1.draft;
    Object.keys(draft).forEach(key => {
      if (typeof legacy[key] === 'string') draft[key] = legacy[key];
    });
    state.updatedAt = legacy.savedAt || new Date().toISOString();
    return state;
  }

  function normalizeState(candidate) {
    const base = defaultState();
    if (!candidate || typeof candidate !== 'object') return base;
    const week1 = candidate.weeks && candidate.weeks.week1 ? candidate.weeks.week1 : {};
    const draft = { ...base.weeks.week1.draft, ...(week1.draft || {}) };
    return {
      ...base,
      ...candidate,
      schemaVersion: SCHEMA_VERSION,
      weeks: {
        ...base.weeks,
        ...(candidate.weeks || {}),
        week1: {
          ...base.weeks.week1,
          ...week1,
          draft,
          accepted: week1.accepted && typeof week1.accepted === 'object' ? week1.accepted : null
        }
      }
    };
  }

  let state = normalizeState(safeParse(localStorage.getItem(STORAGE_KEY)) || migrateLegacy());

  function saveStateToBrowser(showMessage = false) {
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (showMessage) {
      saveState.textContent = 'Saved locally at ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      saveState.classList.add('saved');
    }
  }

  function loadDraftIntoForm() {
    const draft = state.weeks.week1.draft;
    fields.forEach(field => { field.value = typeof draft[field.id] === 'string' ? draft[field.id] : ''; });
  }

  function syncFormToDraft() {
    const draft = state.weeks.week1.draft;
    fields.forEach(field => { draft[field.id] = field.value.trim(); });
    if (state.weeks.week1.status === 'accepted') state.weeks.week1.status = 'draft';
  }

  function missingRequiredFields() {
    const d = state.weeks.week1.draft;
    const checks = [
      ['Target direction summary', d.direction],
      ['Strength 1', d.strength1], ['Evidence for strength 1', d.evidence1],
      ['Strength 2', d.strength2], ['Evidence for strength 2', d.evidence2],
      ['Strength 3', d.strength3], ['Evidence for strength 3', d.evidence3],
      ['Translated experience', d.translation],
      ['Professional brand statement', d.brandStatement]
    ];
    return checks.filter(([, value]) => !value || !value.trim()).map(([label]) => label);
  }

  function acceptedCount() {
    return roadmap.filter(item => state.weeks[item.key] && state.weeks[item.key].status === 'accepted').length;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function textOrPrompt(value, prompt) {
    return value && value.trim() ? escapeHtml(value.trim()) : `<span class="empty">${escapeHtml(prompt)}</span>`;
  }

  function strengthsText(draft) {
    return [1,2,3].map(i => {
      const strength = draft['strength' + i] || '';
      const evidence = draft['evidence' + i] || '';
      if (!strength && !evidence) return '';
      return `${escapeHtml(strength || 'Strength')} — ${escapeHtml(evidence || 'Evidence not yet added')}`;
    }).filter(Boolean).join('<br><br>');
  }

  function renderPortfolioArtifact() {
    const week1 = state.weeks.week1;
    const accepted = week1.status === 'accepted' && week1.accepted;
    const source = accepted ? week1.accepted : week1.draft;
    const rows = [
      ['Target direction', textOrPrompt(source.direction, 'Build your Week 1 direction to preview it here.')],
      ['Strengths + evidence', strengthsText(source) || '<span class="empty">Add three evidence-backed strengths in Build It.</span>'],
      ['Translated experience', textOrPrompt(source.translation, 'Translate one experience in Build It.')],
      ['Professional brand statement', textOrPrompt(source.brandStatement, 'Draft your professional brand statement in Build It.')],
      ['Next test', textOrPrompt(source.nextStep, 'Optional: name the next action that will test your direction.')]
    ];
    document.getElementById('portfolioPreview').innerHTML = rows.map(([label, value]) => `
      <div class="portfolio-row">
        <div class="portfolio-key">${escapeHtml(label)}</div>
        <div class="portfolio-value">${value}</div>
      </div>
    `).join('');

    const badge = document.getElementById('week1ArtifactStatus');
    badge.textContent = accepted ? 'Portfolio Ready' : 'Draft';
    badge.className = 'status-badge ' + (accepted ? 'accepted' : 'draft');
    document.getElementById('portfolioModeTitle').textContent = accepted ? 'Accepted artifact' : 'Working preview';
    document.getElementById('portfolioModeText').textContent = accepted
      ? 'This demo is showing the accepted Week 1 artifact that carries forward into the showcase portfolio.'
      : 'You are viewing the current Week 1 draft. It is not yet part of the accepted showcase portfolio.';
  }

  function renderRoadmap() {
    document.getElementById('portfolioRoadmap').innerHTML = roadmap.map(item => {
      const ready = state.weeks[item.key] && state.weeks[item.key].status === 'accepted';
      return `
        <article class="roadmap-card ${ready ? 'ready' : ''}">
          <span class="roadmap-state">${ready ? 'Ready' : item.key === 'week1' ? 'Draft' : 'Future'}</span>
          <div class="roadmap-week">WEEK ${item.week} · ${escapeHtml(item.stage.toUpperCase())}</div>
          <h4>${escapeHtml(item.title)}</h4>
          <p>${escapeHtml(item.artifact)}</p>
        </article>`;
    }).join('');
  }

  function renderProgress() {
    const count = acceptedCount();
    const pct = Math.round((count / 6) * 100);
    const status = state.weeks.week1.status === 'accepted' ? 'Portfolio Ready' : 'Draft';
    document.getElementById('journeyProgress').textContent = `${count} of 6 artifacts portfolio ready`;
    document.getElementById('portfolioReadyCount').textContent = `${count} / 6`;
    document.getElementById('sidebarPortfolioCount').textContent = `${count} / 6`;
    document.getElementById('sidebarWeek1Status').textContent = status;
    document.getElementById('sidebarProgressBar').style.width = `${pct}%`;
  }

  function renderAll() {
    renderPortfolioArtifact();
    renderRoadmap();
    renderProgress();
  }

  function showValidation(type, message) {
    validationMessage.textContent = message;
    validationMessage.className = `validation-message show ${type}`;
  }

  function clearValidation() {
    validationMessage.textContent = '';
    validationMessage.className = 'validation-message';
  }

  let autosaveTimer = null;
  fields.forEach(field => {
    field.addEventListener('input', () => {
      syncFormToDraft();
      saveState.textContent = 'Unsaved changes…';
      saveState.classList.remove('saved');
      clearValidation();
      renderAll();
      clearTimeout(autosaveTimer);
      autosaveTimer = setTimeout(() => saveStateToBrowser(false), 650);
    });
  });

  document.getElementById('saveBtn').addEventListener('click', () => {
    syncFormToDraft();
    saveStateToBrowser(true);
    renderAll();
    showValidation('success', 'Draft saved locally. Nothing has been submitted or accepted.');
  });

  document.getElementById('previewPortfolioBtn').addEventListener('click', () => {
    syncFormToDraft();
    saveStateToBrowser(false);
    renderAll();
    document.getElementById('prove').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.getElementById('acceptDemoBtn').addEventListener('click', () => {
    syncFormToDraft();
    const missing = missingRequiredFields();
    if (missing.length) {
      showValidation('error', 'Complete the official Week 1 artifact before simulating acceptance: ' + missing.join(', ') + '.');
      return;
    }
    state.weeks.week1.accepted = JSON.parse(JSON.stringify(state.weeks.week1.draft));
    state.weeks.week1.acceptedAt = new Date().toISOString();
    state.weeks.week1.status = 'accepted';
    saveStateToBrowser(false);
    renderAll();
    showValidation('success', 'Demo acceptance complete. Week 1 now appears as Portfolio Ready in Prove It.');
    document.getElementById('prove').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.getElementById('resetAcceptanceBtn').addEventListener('click', () => {
    if (!state.weeks.week1.accepted) return;
    if (!window.confirm('Return the demo Week 1 artifact to draft status? The current draft will remain.')) return;
    state.weeks.week1.status = 'draft';
    state.weeks.week1.accepted = null;
    state.weeks.week1.acceptedAt = null;
    saveStateToBrowser(false);
    renderAll();
    showValidation('success', 'Week 1 returned to draft status for demo testing.');
  });

  document.getElementById('clearBtn').addEventListener('click', () => {
    if (!window.confirm('Clear all M360 standalone demo data stored on this device?')) return;
    localStorage.removeItem(STORAGE_KEY);
    state = defaultState();
    loadDraftIntoForm();
    qualityChecks.forEach(box => { box.checked = false; });
    saveState.textContent = 'Local demo cleared.';
    saveState.classList.remove('saved');
    clearValidation();
    renderAll();
  });

  document.getElementById('printPortfolioBtn').addEventListener('click', () => {
    syncFormToDraft();
    saveStateToBrowser(false);
    renderAll();
    window.print();
  });

  loadDraftIntoForm();
  renderAll();
  if (!localStorage.getItem(STORAGE_KEY)) saveStateToBrowser(false);
})();
