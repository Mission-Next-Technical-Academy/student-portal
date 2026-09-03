(() => {
  'use strict';

  const STORAGE_KEY = 'mnt.m360.preview.portfolio.v3';
  const LEGACY_KEYS = ['mnt.m360.preview.portfolio.v2', 'mnt.m360.preview.week1.v1'];
  const SCHEMA_VERSION = 3;

  const roadmap = [
    { key: 'week1', week: '01', stage: 'Direction', title: 'Career Direction & Professional Brand', artifact: 'Professional brand statement + evidence' },
    { key: 'week2', week: '02', stage: 'Signal', title: 'LinkedIn & Professional Presence', artifact: 'Credible professional profile + profile URL' },
    { key: 'week3', week: '03', stage: 'Connection', title: 'Networking & Professional Follow-Up', artifact: 'Outreach + learning reflection' },
    { key: 'week4', week: '04', stage: 'Evidence', title: 'Targeted Resume Development', artifact: 'Role-aligned resume + reusable bullet bank' },
    { key: 'week5', week: '05', stage: 'Voice', title: 'Interview Preparation & Practice', artifact: 'STAR story bank + interview practice' },
    { key: 'week6', week: '06', stage: 'Proof', title: 'Career Spotlight', artifact: 'Career Spotlight + 30-day action plan' }
  ];

  function applyGoldStandardAlignment() {
    const heroCopy = document.querySelector('.hero-content > p');
    if (heroCopy) heroCopy.textContent = 'Choose a credible near-term direction, connect it to evidence you can support, build your Week 1 artifact, and submit it for instructor review. Work that Meets Standard becomes Portfolio Ready.';

    const sidebarNote = document.querySelector('.my-m360 p');
    if (sidebarNote) sidebarNote.textContent = 'Practice privately. Prove It submits required evidence for review.';

    const liveNote = document.querySelector('.live-note');
    if (liveNote) liveNote.textContent = 'M360 attendance and clock-hour documentation remain outside the LMS for the November MVP. Production stores only a staff-confirmed attendance-requirement-satisfied status for final completion; this page never awards or infers attendance, clock hours, or technical-course progress from portal activity.';

    const practiceCopy = document.querySelector('#practice .card-header .subtle');
    if (practiceCopy) practiceCopy.textContent = 'Practice It is your working space. Drafts can change. Build is the action inside Practice It: apply the concepts, create the artifact, get coaching, and revise it. Prove It is where you submit the required evidence for review. Work that Meets Standard becomes Portfolio Ready.';

    const architectureSpans = document.querySelectorAll('#practice .architecture-note span');
    if (architectureSpans.length >= 2) {
      architectureSpans[0].textContent = 'Private drafts, evidence, practice, feedback, and revisions.';
      architectureSpans[1].textContent = 'Reviewer-approved work that Meets Standard becomes Portfolio Ready and carries forward through Week 6.';
    }

    const acceptDemoBtn = document.getElementById('acceptDemoBtn');
    const practiceActions = document.querySelector('#practice .actions');
    const portfolioActions = document.querySelector('.portfolio-actions');
    if (acceptDemoBtn) acceptDemoBtn.textContent = 'Demo reviewer: Meets Standard';
    if (acceptDemoBtn && portfolioActions) portfolioActions.prepend(acceptDemoBtn);

    if (practiceActions && !document.getElementById('practiceFlowNote')) {
      const flowNote = document.createElement('span');
      flowNote.id = 'practiceFlowNote';
      flowNote.className = 'save-state';
      flowNote.textContent = 'When ready, continue to Prove It and submit for review.';
      practiceActions.appendChild(flowNote);
    }

    const prototypeBoundary = document.querySelector('.demo-boundary');
    if (prototypeBoundary) prototypeBoundary.innerHTML = '<strong>Prototype boundary:</strong> draft work is stored only on this device. Submission and reviewer buttons below simulate the approved lifecycle; production uses authenticated student and reviewer workflows with durable Supabase records.';

    const proveCover = document.querySelector('#prove .portfolio-cover-copy');
    if (proveCover) {
      const heading = proveCover.querySelector('h2');
      const copy = proveCover.querySelector('p');
      if (heading) heading.innerHTML = 'Submit your Week 1 <span class="portfolio-accent">proof</span> for review.';
      if (copy) copy.textContent = 'Prove It is the submission step. Your required evidence is reviewed after submission; work that Meets Standard becomes Portfolio Ready and feeds the M360 Portfolio.';
    }

    const modeNote = document.querySelector('.portfolio-mode-note');
    if (modeNote && !document.getElementById('week1ReviewStatus')) {
      const review = document.createElement('div');
      review.id = 'week1ReviewStatus';
      review.className = 'portfolio-mode-note';
      review.innerHTML = '<strong id="reviewStatusLabel">Draft</strong><span id="reviewStatusText">Draft work has not been submitted for review.</span>';
      modeNote.before(review);

      const standard = document.createElement('div');
      standard.id = 'week1ReviewStandard';
      standard.className = 'architecture-note';
      standard.innerHTML = '<div><strong>Week 1 review standard</strong><span>Clarity 25 · Relevance 25 · Evidence 25 · Application 25. Meets Standard = 70+ with all required components complete.</span></div><div class="architecture-arrow">→</div><div><strong>Course grade</strong><span>Week 1 is one of six equally weighted 100-point assignments. Start Here is ungraded.</span></div>';
      review.after(standard);
    }

    if (portfolioActions && !document.getElementById('submitReviewBtn')) {
      const submit = document.createElement('button');
      submit.id = 'submitReviewBtn';
      submit.className = 'btn btn-primary';
      submit.type = 'button';
      submit.textContent = 'Submit for review';
      portfolioActions.prepend(submit);

      const revise = document.createElement('button');
      revise.id = 'needsRevisionDemoBtn';
      revise.className = 'btn btn-secondary';
      revise.type = 'button';
      revise.textContent = 'Demo reviewer: Needs Revision';
      if (acceptDemoBtn) acceptDemoBtn.after(revise);
      else portfolioActions.appendChild(revise);
    }

    const roadmapHeading = document.querySelector('.portfolio-roadmap-heading .subtle');
    if (roadmapHeading) roadmapHeading.textContent = 'Only reviewer-approved work that Meets Standard becomes Portfolio Ready here. Private networking details, rough drafts, reviewer feedback, and unsupported claims stay out of the showcase portfolio.';

    const downloadNote = document.querySelector('.portfolio-download-note');
    if (downloadNote) downloadNote.textContent = 'Use this at any point to keep a copy of your current portfolio state. If no reviewer-approved artifact exists yet, the export remains clearly labeled DRAFT — NOT YET ACCEPTED. M360 remains the primary portfolio record.';

    if (portfolioActions && !document.getElementById('courseCompletionNote')) {
      const completion = document.createElement('div');
      completion.id = 'courseCompletionNote';
      completion.className = 'live-note';
      completion.textContent = 'M360 course completion requires all six required weekly assignments complete, an equal-weight final average of at least 70, Career Spotlight complete, and staff-confirmed attendance requirement met. This Week 1 prototype does not calculate final course completion.';
      portfolioActions.before(completion);
    }
  }

  applyGoldStandardAlignment();

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
        week1: {
          status: 'draft',
          draft: blankWeek1Draft(),
          submitted: null,
          submittedAt: null,
          accepted: null,
          acceptedAt: null
        },
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
    for (const key of LEGACY_KEYS) {
      const legacy = safeParse(localStorage.getItem(key));
      if (!legacy) continue;
      const state = defaultState();
      if (legacy.weeks && legacy.weeks.week1) {
        const oldWeek = legacy.weeks.week1;
        state.weeks.week1.draft = { ...state.weeks.week1.draft, ...(oldWeek.draft || {}) };
        state.weeks.week1.accepted = oldWeek.accepted && typeof oldWeek.accepted === 'object' ? oldWeek.accepted : null;
        state.weeks.week1.acceptedAt = oldWeek.acceptedAt || null;
        state.weeks.week1.status = oldWeek.status === 'accepted' ? 'accepted' : 'draft';
        state.updatedAt = legacy.updatedAt || new Date().toISOString();
      } else {
        const draft = state.weeks.week1.draft;
        Object.keys(draft).forEach(fieldKey => {
          if (typeof legacy[fieldKey] === 'string') draft[fieldKey] = legacy[fieldKey];
        });
        state.updatedAt = legacy.savedAt || new Date().toISOString();
      }
      return state;
    }
    return null;
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
          submitted: week1.submitted && typeof week1.submitted === 'object' ? week1.submitted : null,
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
    const week1 = state.weeks.week1;
    fields.forEach(field => { week1.draft[field.id] = field.value.trim(); });
    if (week1.status !== 'draft') week1.status = 'draft';
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

  function isPortfolioReady(item) {
    const week = state.weeks[item.key];
    return Boolean(week && (week.accepted || week.status === 'accepted'));
  }

  function acceptedCount() {
    return roadmap.filter(isPortfolioReady).length;
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

  function workflowStatusLabel() {
    const week1 = state.weeks.week1;
    if (week1.status === 'submitted') return 'Submitted';
    if (week1.status === 'needs_revision') return 'Needs Revision';
    if (week1.status === 'accepted') return 'Meets Standard';
    return 'Draft';
  }

  function renderReviewStatus() {
    const week1 = state.weeks.week1;
    const label = document.getElementById('reviewStatusLabel');
    const text = document.getElementById('reviewStatusText');
    if (!label || !text) return;

    if (week1.status === 'submitted') {
      label.textContent = 'Submitted';
      text.textContent = 'Your Week 1 proof is awaiting reviewer evaluation. The submitted snapshot is preserved separately from your editable draft.';
    } else if (week1.status === 'needs_revision') {
      label.textContent = 'Needs Revision';
      text.textContent = 'Return to Practice It, revise the required evidence, and submit a new revision. Any previously Portfolio Ready artifact remains preserved.';
    } else if (week1.status === 'accepted') {
      label.textContent = 'Meets Standard';
      text.textContent = 'Reviewer approval is complete. The accepted snapshot is now Portfolio Ready and carries forward without being overwritten by later drafts.';
    } else if (week1.accepted) {
      label.textContent = 'Draft in progress';
      text.textContent = 'You are editing a new draft. Your previously reviewer-approved Week 1 artifact still Meets Standard and remains Portfolio Ready.';
    } else {
      label.textContent = 'Draft';
      text.textContent = 'Draft work has not been submitted for review.';
    }
  }

  function renderPortfolioArtifact() {
    const week1 = state.weeks.week1;
    const hasAccepted = Boolean(week1.accepted);
    const source = hasAccepted ? week1.accepted : week1.draft;
    const rows = [
      ['Target direction', textOrPrompt(source.direction, 'Practice your Week 1 direction to preview it here.')],
      ['Strengths + evidence', strengthsText(source) || '<span class="empty">Add three evidence-backed strengths in Practice It.</span>'],
      ['Translated experience', textOrPrompt(source.translation, 'Translate one experience in Practice It.')],
      ['Professional brand statement', textOrPrompt(source.brandStatement, 'Draft your professional brand statement in Practice It.')],
      ['Next test', textOrPrompt(source.nextStep, 'Optional: name the next action that will test your direction.')]
    ];
    document.getElementById('portfolioPreview').innerHTML = rows.map(([label, value]) => `
      <div class="portfolio-row">
        <div class="portfolio-key">${escapeHtml(label)}</div>
        <div class="portfolio-value">${value}</div>
      </div>
    `).join('');

    const badge = document.getElementById('week1ArtifactStatus');
    badge.textContent = hasAccepted ? 'Portfolio Ready' : 'DRAFT — NOT YET ACCEPTED';
    badge.className = 'status-badge ' + (hasAccepted ? 'accepted' : 'draft');
    document.getElementById('portfolioModeTitle').textContent = hasAccepted ? 'Portfolio Ready' : 'Draft preview — not yet accepted';
    document.getElementById('portfolioModeText').textContent = hasAccepted
      ? 'This is the latest reviewer-approved Week 1 artifact. Student-facing academic result: Meets Standard.'
      : 'This is a preview of your current Week 1 draft. It may be downloaded for your records, but it is not yet part of the reviewer-approved showcase portfolio.';
  }

  function renderRoadmap() {
    document.getElementById('portfolioRoadmap').innerHTML = roadmap.map(item => {
      const ready = isPortfolioReady(item);
      return `
        <article class="roadmap-card ${ready ? 'ready' : ''}">
          <span class="roadmap-state">${ready ? 'Portfolio Ready' : item.key === 'week1' ? workflowStatusLabel() : 'Future'}</span>
          <div class="roadmap-week">WEEK ${item.week} · ${escapeHtml(item.stage.toUpperCase())}</div>
          <h4>${escapeHtml(item.title)}</h4>
          <p>${escapeHtml(item.artifact)}</p>
        </article>`;
    }).join('');
  }

  function renderProgress() {
    const count = acceptedCount();
    const pct = Math.round((count / 6) * 100);
    document.getElementById('journeyProgress').textContent = `${count} of 6 artifacts portfolio ready`;
    document.getElementById('portfolioReadyCount').textContent = `${count} / 6`;
    document.getElementById('sidebarPortfolioCount').textContent = `${count} / 6`;
    document.getElementById('sidebarWeek1Status').textContent = workflowStatusLabel();
    document.getElementById('sidebarProgressBar').style.width = `${pct}%`;
  }

  function renderAll() {
    renderReviewStatus();
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
    showValidation('success', 'Draft saved locally. Nothing has been submitted for review.');
  });

  document.getElementById('previewPortfolioBtn').addEventListener('click', () => {
    syncFormToDraft();
    saveStateToBrowser(false);
    renderAll();
    document.getElementById('prove').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.getElementById('submitReviewBtn').addEventListener('click', () => {
    syncFormToDraft();
    const missing = missingRequiredFields();
    if (missing.length) {
      showValidation('error', 'Complete the required Week 1 proof before submitting for review: ' + missing.join(', ') + '.');
      document.getElementById('practice').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    state.weeks.week1.submitted = JSON.parse(JSON.stringify(state.weeks.week1.draft));
    state.weeks.week1.submittedAt = new Date().toISOString();
    state.weeks.week1.status = 'submitted';
    saveStateToBrowser(false);
    renderAll();
    showValidation('success', 'Demo submission complete. Week 1 is now Submitted and awaiting reviewer evaluation.');
  });

  document.getElementById('acceptDemoBtn').addEventListener('click', () => {
    const week1 = state.weeks.week1;
    if (week1.status !== 'submitted' || !week1.submitted) {
      showValidation('error', 'Submit the Week 1 proof for review before simulating a reviewer decision.');
      return;
    }
    week1.accepted = JSON.parse(JSON.stringify(week1.submitted));
    week1.acceptedAt = new Date().toISOString();
    week1.status = 'accepted';
    saveStateToBrowser(false);
    renderAll();
    showValidation('success', 'Demo review complete. Student-facing result: Meets Standard. The Week 1 artifact is now Portfolio Ready.');
    document.getElementById('prove').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.getElementById('needsRevisionDemoBtn').addEventListener('click', () => {
    const week1 = state.weeks.week1;
    if (week1.status !== 'submitted' || !week1.submitted) {
      showValidation('error', 'Submit the Week 1 proof for review before simulating Needs Revision.');
      return;
    }
    week1.status = 'needs_revision';
    saveStateToBrowser(false);
    renderAll();
    showValidation('error', 'Demo reviewer result: Needs Revision. Return to Practice It, revise, and resubmit.');
  });

  document.getElementById('resetAcceptanceBtn').addEventListener('click', () => {
    const week1 = state.weeks.week1;
    if (!week1.accepted && week1.status === 'draft') return;
    if (!window.confirm('Clear the demo reviewer result and return Week 1 to draft status? Your current draft will remain.')) return;
    week1.status = 'draft';
    week1.submitted = null;
    week1.submittedAt = null;
    week1.accepted = null;
    week1.acceptedAt = null;
    saveStateToBrowser(false);
    renderAll();
    showValidation('success', 'Week 1 returned to draft status for demo testing.');
  });

  document.getElementById('clearBtn').addEventListener('click', () => {
    if (!window.confirm('Clear all M360 standalone demo data stored on this device?')) return;
    localStorage.removeItem(STORAGE_KEY);
    LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
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
