(() => {
  'use strict';

  const STORAGE_KEY = 'mnt.m360.course.mock.v1';
  const WEEK1_SOURCE_KEYS = ['mnt.m360.preview.portfolio.v3', 'mnt.m360.preview.portfolio.v2'];
  const SCHEMA_VERSION = 1;

  const roadmap = [
    { key: 'week1', week: '01', stage: 'Direction', title: 'Career Direction & Professional Brand', artifact: 'Professional direction + brand + evidence' },
    { key: 'week2', week: '02', stage: 'Signal', title: 'LinkedIn & Professional Presence', artifact: 'Profile URL + headline + About + evidence' },
    { key: 'week3', week: '03', stage: 'Connection', title: 'Networking & Professional Follow-Up', artifact: 'Outreach + sanitized learning evidence' },
    { key: 'week4', week: '04', stage: 'Evidence', title: 'Targeted Resume Development', artifact: 'Targeted resume + evidence bullets' },
    { key: 'week5', week: '05', stage: 'Voice', title: 'Interview Preparation & Practice', artifact: 'STAR story bank + practice evidence' },
    { key: 'week6', week: '06', stage: 'Proof', title: 'Career Spotlight', artifact: 'Career Spotlight + 30-day action plan' }
  ];

  function buildRepeatFields(containerId, prefix, label) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = Array.from({ length: 8 }, (_, index) => {
      const number = index + 1;
      const required = number <= 5 ? ' <span class="portfolio-field">Required</span>' : '';
      return `<div class="field"><label for="${prefix}${number}">${label} ${number}${required}</label><input id="${prefix}${number}" data-m360 type="text" /></div>`;
    }).join('');
  }

  buildRepeatFields('keywordFields', 'keyword', 'Search keyword');
  buildRepeatFields('skillFields', 'skill', 'Skill / keyword');

  const fields = Array.from(document.querySelectorAll('[data-m360]'));
  const reviewChecks = Array.from(document.querySelectorAll('[data-review-check]'));
  const validationMessage = document.getElementById('validationMessage');
  const saveStateLabel = document.getElementById('saveState');

  function blankWeek2Draft() {
    const draft = {
      profileSignalBefore: '',
      changePlan: '',
      profileUrl: '',
      targetDirection: '',
      headline: '',
      about: '',
      experienceRole: '',
      experienceBefore: '',
      experienceAfter: '',
      experienceCapability: '',
      reflectionStrongest: '',
      reflectionNeedsWork: '',
      reflectionSupport: '',
      reviewChecks: {}
    };
    for (let i = 1; i <= 8; i += 1) {
      draft['keyword' + i] = '';
      draft['skill' + i] = '';
    }
    return draft;
  }

  function defaultState() {
    return {
      schemaVersion: SCHEMA_VERSION,
      updatedAt: null,
      weeks: {
        week1: { accepted: null, acceptedAt: null },
        week2: {
          status: 'draft',
          draft: blankWeek2Draft(),
          submitted: null,
          submittedAt: null,
          accepted: null,
          acceptedAt: null
        },
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

  function importAcceptedWeek1() {
    for (const key of WEEK1_SOURCE_KEYS) {
      const candidate = safeParse(localStorage.getItem(key));
      const week1 = candidate && candidate.weeks && candidate.weeks.week1;
      if (week1 && week1.accepted && typeof week1.accepted === 'object') {
        return {
          accepted: JSON.parse(JSON.stringify(week1.accepted)),
          acceptedAt: week1.acceptedAt || null
        };
      }
    }
    return null;
  }

  function normalizeState(candidate) {
    const base = defaultState();
    if (!candidate || typeof candidate !== 'object') return base;
    const week2 = candidate.weeks && candidate.weeks.week2 ? candidate.weeks.week2 : {};
    const draft = { ...base.weeks.week2.draft, ...(week2.draft || {}) };
    draft.reviewChecks = { ...(base.weeks.week2.draft.reviewChecks || {}), ...(draft.reviewChecks || {}) };
    return {
      ...base,
      ...candidate,
      schemaVersion: SCHEMA_VERSION,
      weeks: {
        ...base.weeks,
        ...(candidate.weeks || {}),
        week1: {
          ...base.weeks.week1,
          ...((candidate.weeks && candidate.weeks.week1) || {})
        },
        week2: {
          ...base.weeks.week2,
          ...week2,
          draft,
          submitted: week2.submitted && typeof week2.submitted === 'object' ? week2.submitted : null,
          accepted: week2.accepted && typeof week2.accepted === 'object' ? week2.accepted : null
        }
      }
    };
  }

  let state = normalizeState(safeParse(localStorage.getItem(STORAGE_KEY)));
  const importedWeek1 = importAcceptedWeek1();
  if (importedWeek1 && !state.weeks.week1.accepted) state.weeks.week1 = importedWeek1;
  if (!state.weeks.week2.draft.targetDirection && state.weeks.week1.accepted && state.weeks.week1.accepted.direction) {
    state.weeks.week2.draft.targetDirection = state.weeks.week1.accepted.direction;
  }

  function saveState(showMessage = false) {
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (showMessage && saveStateLabel) {
      saveStateLabel.textContent = 'Saved locally at ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      saveStateLabel.classList.add('saved');
    }
  }

  function syncFormToDraft() {
    const week2 = state.weeks.week2;
    fields.forEach(field => { week2.draft[field.id] = field.value.trim(); });
    reviewChecks.forEach(box => { week2.draft.reviewChecks[box.dataset.reviewCheck] = box.checked; });
    if (week2.status !== 'draft') week2.status = 'draft';
  }

  function loadDraftIntoForm() {
    const draft = state.weeks.week2.draft;
    fields.forEach(field => { field.value = typeof draft[field.id] === 'string' ? draft[field.id] : ''; });
    reviewChecks.forEach(box => { box.checked = Boolean(draft.reviewChecks[box.dataset.reviewCheck]); });
  }

  function missingRequiredFields() {
    const d = state.weeks.week2.draft;
    const checks = [
      ['LinkedIn profile URL', d.profileUrl],
      ['Target direction', d.targetDirection],
      ['Final LinkedIn headline', d.headline],
      ['Final About section', d.about],
      ['Experience selected', d.experienceRole],
      ['Original experience wording', d.experienceBefore],
      ['Updated experience wording', d.experienceAfter],
      ['Experience evidence/capability', d.experienceCapability],
      ['Strongest improvement reflection', d.reflectionStrongest],
      ['What still needs work', d.reflectionNeedsWork],
      ['Feedback/support need', d.reflectionSupport]
    ];
    for (let i = 1; i <= 5; i += 1) {
      checks.push([`Search keyword ${i}`, d['keyword' + i]]);
      checks.push([`Skill / keyword ${i}`, d['skill' + i]]);
    }
    const missing = checks.filter(([, value]) => !value || !String(value).trim()).map(([label]) => label);
    reviewChecks.forEach(box => {
      if (!d.reviewChecks[box.dataset.reviewCheck]) missing.push('Profile review confirmation: ' + box.dataset.reviewCheck);
    });
    return missing;
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
    return value && String(value).trim() ? escapeHtml(String(value).trim()) : `<span class="empty">${escapeHtml(prompt)}</span>`;
  }

  function listValues(source, prefix) {
    return Array.from({ length: 8 }, (_, index) => source[prefix + (index + 1)] || '').filter(Boolean);
  }

  function portfolioReadyCount() {
    let count = 0;
    if (state.weeks.week1.accepted) count += 1;
    if (state.weeks.week2.accepted) count += 1;
    return count;
  }

  function week2StatusLabel() {
    const week2 = state.weeks.week2;
    if (week2.status === 'submitted') return 'Submitted';
    if (week2.status === 'needs_revision') return 'Needs Revision';
    if (week2.status === 'accepted') return 'Meets Standard';
    if (week2.accepted) return 'Draft in progress';
    return 'Draft';
  }

  function renderCarryForward() {
    const accepted = state.weeks.week1.accepted;
    const title = document.getElementById('carryForwardTitle');
    const text = document.getElementById('carryForwardText');
    const details = document.getElementById('carryForwardDetails');
    const journeyWeek1 = document.getElementById('journeyWeek1');
    if (!accepted) {
      title.textContent = 'No accepted Week 1 artifact imported yet.';
      text.textContent = 'Complete or simulate reviewer approval in the Week 1 gold-standard page, then return here. Week 2 never treats a mutable Week 1 draft as accepted proof.';
      details.hidden = true;
      journeyWeek1.classList.remove('ready');
      return;
    }

    title.textContent = 'Week 1 is Portfolio Ready and available for reuse.';
    text.textContent = 'Week 2 is reading the reviewer-approved Week 1 snapshot. Editing Week 2 creates a new Week 2 record and never mutates Week 1.';
    const strengths = [1, 2, 3].map(i => accepted['strength' + i]).filter(Boolean).join(' · ');
    details.innerHTML = [
      ['Target direction', accepted.direction || '—'],
      ['Professional brand', accepted.brandStatement || '—'],
      ['Evidence-backed strengths', strengths || '—']
    ].map(([label, value]) => `<div class="carry-row"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>`).join('');
    details.hidden = false;
    journeyWeek1.classList.add('ready');
  }

  function renderReviewStatus() {
    const week2 = state.weeks.week2;
    const label = document.getElementById('reviewStatusLabel');
    const text = document.getElementById('reviewStatusText');
    if (week2.status === 'submitted') {
      label.textContent = 'Submitted';
      text.textContent = 'The Week 2 submission snapshot is preserved and awaiting reviewer evaluation. Your Practice It draft remains independently editable.';
    } else if (week2.status === 'needs_revision') {
      label.textContent = 'Needs Revision';
      text.textContent = 'Return to Practice It, revise the required evidence, and submit a new revision. Any previously Portfolio Ready Week 2 artifact remains preserved.';
    } else if (week2.status === 'accepted') {
      label.textContent = 'Meets Standard';
      text.textContent = 'Reviewer approval is complete. The accepted Week 2 snapshot is Portfolio Ready and can carry forward to Week 3.';
    } else if (week2.accepted) {
      label.textContent = 'Draft in progress';
      text.textContent = 'You are editing a new Week 2 draft. The previously reviewer-approved Week 2 artifact still Meets Standard and remains Portfolio Ready.';
    } else {
      label.textContent = 'Draft';
      text.textContent = 'Draft work has not been submitted for review.';
    }
  }

  function renderWeek2Proof() {
    const week2 = state.weeks.week2;
    const hasAccepted = Boolean(week2.accepted);
    const source = hasAccepted ? week2.accepted : (week2.status === 'submitted' && week2.submitted ? week2.submitted : week2.draft);
    const keywords = listValues(source, 'keyword');
    const skills = listValues(source, 'skill');
    const rows = [
      ['Profile URL', textOrPrompt(source.profileUrl, 'Add the LinkedIn profile URL in Practice It.')],
      ['Target direction', textOrPrompt(source.targetDirection, 'Carry forward or restate the Week 1 direction.')],
      ['Headline', textOrPrompt(source.headline, 'Draft the final LinkedIn headline.')],
      ['About positioning', textOrPrompt(source.about, 'Draft the final About section.')],
      ['Updated experience', textOrPrompt(source.experienceAfter, 'Rewrite one experience entry around visible capability.')],
      ['Search keywords', keywords.length ? escapeHtml(keywords.join(' · ')) : '<span class="empty">Add at least five accurate search keywords.</span>'],
      ['Skills / discoverability', skills.length ? escapeHtml(skills.join(' · ')) : '<span class="empty">Confirm at least five supportable skills or keywords.</span>']
    ];
    document.getElementById('week2ProofPreview').innerHTML = rows.map(([label, value]) => `
      <div class="portfolio-row">
        <div class="portfolio-key">${escapeHtml(label)}</div>
        <div class="portfolio-value">${value}</div>
      </div>
    `).join('');

    const badge = document.getElementById('week2ArtifactStatus');
    if (hasAccepted) {
      badge.textContent = 'Portfolio Ready';
      badge.className = 'status-badge accepted';
    } else if (week2.status === 'submitted') {
      badge.textContent = 'Submitted · not yet accepted';
      badge.className = 'status-badge submitted';
    } else if (week2.status === 'needs_revision') {
      badge.textContent = 'Needs Revision';
      badge.className = 'status-badge needs-revision';
    } else {
      badge.textContent = 'DRAFT — NOT YET ACCEPTED';
      badge.className = 'status-badge draft';
    }
  }

  function renderRoadmap() {
    const readyByKey = {
      week1: Boolean(state.weeks.week1.accepted),
      week2: Boolean(state.weeks.week2.accepted)
    };
    document.getElementById('portfolioRoadmap').innerHTML = roadmap.map(item => {
      const ready = Boolean(readyByKey[item.key]);
      let stateLabel = 'Future';
      if (item.key === 'week1') stateLabel = ready ? 'Portfolio Ready' : 'Not imported';
      if (item.key === 'week2') stateLabel = ready ? 'Portfolio Ready' : week2StatusLabel();
      return `
        <article class="roadmap-card ${ready ? 'ready' : ''}">
          <span class="roadmap-state">${escapeHtml(stateLabel)}</span>
          <div class="roadmap-week">WEEK ${item.week} · ${escapeHtml(item.stage.toUpperCase())}</div>
          <h4>${escapeHtml(item.title)}</h4>
          <p>${escapeHtml(item.artifact)}</p>
        </article>`;
    }).join('');
  }

  function renderProgress() {
    const count = portfolioReadyCount();
    const pct = Math.round((count / 6) * 100);
    document.getElementById('journeyProgress').textContent = `${count} of 6 artifacts portfolio ready`;
    document.getElementById('portfolioReadyCount').textContent = `${count} / 6`;
    document.getElementById('sidebarPortfolioCount').textContent = `${count} / 6`;
    document.getElementById('sidebarProgressBar').style.width = `${pct}%`;
    document.getElementById('sidebarWeek1Status').textContent = state.weeks.week1.accepted ? 'Portfolio Ready' : 'Not imported';
    document.getElementById('sidebarWeek2Status').textContent = week2StatusLabel();
  }

  function renderAll() {
    renderCarryForward();
    renderReviewStatus();
    renderWeek2Proof();
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
  [...fields, ...reviewChecks].forEach(control => {
    control.addEventListener('input', () => {
      syncFormToDraft();
      if (saveStateLabel) {
        saveStateLabel.textContent = 'Unsaved changes…';
        saveStateLabel.classList.remove('saved');
      }
      clearValidation();
      renderAll();
      clearTimeout(autosaveTimer);
      autosaveTimer = setTimeout(() => saveState(false), 650);
    });
    if (control.type === 'checkbox') {
      control.addEventListener('change', () => {
        syncFormToDraft();
        saveState(false);
        renderAll();
      });
    }
  });

  document.getElementById('saveBtn').addEventListener('click', () => {
    syncFormToDraft();
    saveState(true);
    renderAll();
    showValidation('success', 'Week 2 draft saved to the local mock adapter. Nothing has been submitted for review.');
  });

  document.getElementById('previewProofBtn').addEventListener('click', () => {
    syncFormToDraft();
    saveState(false);
    renderAll();
    document.getElementById('prove').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.getElementById('submitReviewBtn').addEventListener('click', () => {
    syncFormToDraft();
    const missing = missingRequiredFields();
    if (missing.length) {
      const firstItems = missing.slice(0, 7).join(', ');
      const remainder = missing.length > 7 ? ` and ${missing.length - 7} more` : '';
      showValidation('error', 'Complete the required Week 2 proof before submitting: ' + firstItems + remainder + '.');
      document.getElementById('practice').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const week2 = state.weeks.week2;
    week2.submitted = JSON.parse(JSON.stringify(week2.draft));
    week2.submittedAt = new Date().toISOString();
    week2.status = 'submitted';
    saveState(false);
    renderAll();
    showValidation('success', 'Week 2 submission snapshot created. Status: Submitted and awaiting reviewer evaluation.');
  });

  document.getElementById('meetsStandardBtn').addEventListener('click', () => {
    const week2 = state.weeks.week2;
    if (week2.status !== 'submitted' || !week2.submitted) {
      showValidation('error', 'Submit the Week 2 proof before simulating a reviewer Meets Standard decision.');
      return;
    }
    week2.accepted = JSON.parse(JSON.stringify(week2.submitted));
    week2.acceptedAt = new Date().toISOString();
    week2.status = 'accepted';
    saveState(false);
    renderAll();
    showValidation('success', 'Demo reviewer decision: Meets Standard. Week 2 is now Portfolio Ready.');
  });

  document.getElementById('needsRevisionBtn').addEventListener('click', () => {
    const week2 = state.weeks.week2;
    if (week2.status !== 'submitted' || !week2.submitted) {
      showValidation('error', 'Submit the Week 2 proof before simulating Needs Revision.');
      return;
    }
    week2.status = 'needs_revision';
    saveState(false);
    renderAll();
    showValidation('error', 'Demo reviewer decision: Needs Revision. Return to Practice It, revise the work, and submit a new snapshot.');
  });

  document.getElementById('downloadPortfolioBtn').addEventListener('click', () => {
    syncFormToDraft();
    saveState(false);
    renderAll();
    window.print();
  });

  document.getElementById('resetReviewBtn').addEventListener('click', () => {
    if (!window.confirm('Reset the Week 2 demo review lifecycle? Current Practice It draft will remain; submitted and accepted Week 2 snapshots will be cleared.')) return;
    const week2 = state.weeks.week2;
    week2.status = 'draft';
    week2.submitted = null;
    week2.submittedAt = null;
    week2.accepted = null;
    week2.acceptedAt = null;
    saveState(false);
    renderAll();
    showValidation('success', 'Week 2 demo review state reset. Current draft remains.');
  });

  document.getElementById('clearWeek2Btn').addEventListener('click', () => {
    if (!window.confirm('Clear all Week 2 local demo work? Imported Week 1 accepted proof will remain available.')) return;
    state.weeks.week2 = defaultState().weeks.week2;
    if (state.weeks.week1.accepted && state.weeks.week1.accepted.direction) {
      state.weeks.week2.draft.targetDirection = state.weeks.week1.accepted.direction;
    }
    loadDraftIntoForm();
    saveState(false);
    clearValidation();
    renderAll();
    showValidation('success', 'Week 2 local demo cleared. Week 1 accepted carry-forward remains intact.');
  });

  loadDraftIntoForm();
  saveState(false);
  renderAll();
})();
