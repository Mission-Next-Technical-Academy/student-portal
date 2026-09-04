(() => {
  'use strict';

  const STORAGE_KEY = 'mnt.m360.course.mock.v1';
  const SCHEMA_VERSION = 1;
  const MIN_TARGETS = 7;

  const roadmap = [
    { key: 'week1', week: '01', stage: 'Direction', title: 'Career Direction & Professional Brand', artifact: 'Professional direction + brand + evidence' },
    { key: 'week2', week: '02', stage: 'Signal', title: 'LinkedIn & Professional Presence', artifact: 'Professional profile + public positioning' },
    { key: 'week3', week: '03', stage: 'Connection', title: 'Networking & Professional Follow-Up', artifact: 'Sanitized networking action + learning evidence' },
    { key: 'week4', week: '04', stage: 'Evidence', title: 'Targeted Resume Development', artifact: 'Targeted resume + evidence bullets' },
    { key: 'week5', week: '05', stage: 'Voice', title: 'Interview Preparation & Practice', artifact: 'STAR story bank + practice evidence' },
    { key: 'week6', week: '06', stage: 'Proof', title: 'Career Spotlight', artifact: 'Career Spotlight + 30-day action plan' }
  ];

  const lanes = ['Practitioner','Employer','Recruiter','Instructor','Peer','Alumni','Association','Event/community','Other'];
  const statuses = ['Identified','Ready to Contact','Contacted','Responded','Follow-Up Needed','Closed/Complete'];

  function blankTarget() {
    return { target: '', lane: '', why: '', learn: '', method: '', status: '', next: '' };
  }

  function blankWeek3Draft() {
    return {
      targetDirection: '', learningQuestion1: '', learningQuestion2: '', learningQuestion3: '',
      networkTargets: Array.from({ length: MIN_TARGETS }, blankTarget),
      connectionRequest: '', adviceRequest: '', informationalRequest: '', reviewChecks: {},
      actionCompleted: '', actionDate: '', actionEvidence: '', actionResult: '',
      nextAction: '', followUpTiming: '', trackerNote: '',
      reflectionLearned: '', reflectionEasy: '', reflectionUnclear: '', reflectionNext: '',
      showcaseInsight: '', showcaseFollowUp: ''
    };
  }

  function defaultState() {
    return {
      schemaVersion: SCHEMA_VERSION,
      updatedAt: null,
      weeks: {
        week1: { accepted: null, acceptedAt: null },
        week2: { accepted: null, acceptedAt: null },
        week3: { status: 'draft', draft: blankWeek3Draft(), submitted: null, submittedAt: null, accepted: null, acceptedAt: null },
        week4: { status: 'future' }, week5: { status: 'future' }, week6: { status: 'future' }
      }
    };
  }

  function safeParse(raw) { try { return raw ? JSON.parse(raw) : null; } catch (_) { return null; } }
  function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
  function escapeHtml(value) {
    return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }

  function normalizeTarget(target) { return { ...blankTarget(), ...(target && typeof target === 'object' ? target : {}) }; }
  function normalizeState(candidate) {
    const base = defaultState();
    if (!candidate || typeof candidate !== 'object') return base;
    const weeks = candidate.weeks || {};
    const week3 = weeks.week3 || {};
    const draft = { ...base.weeks.week3.draft, ...(week3.draft || {}) };
    draft.reviewChecks = { ...(draft.reviewChecks || {}) };
    draft.networkTargets = Array.isArray(draft.networkTargets) ? draft.networkTargets.map(normalizeTarget) : [];
    while (draft.networkTargets.length < MIN_TARGETS) draft.networkTargets.push(blankTarget());
    return {
      ...base, ...candidate, schemaVersion: SCHEMA_VERSION,
      weeks: {
        ...base.weeks, ...weeks,
        week1: { ...base.weeks.week1, ...(weeks.week1 || {}) },
        week2: { ...base.weeks.week2, ...(weeks.week2 || {}) },
        week3: {
          ...base.weeks.week3, ...week3, draft,
          submitted: week3.submitted && typeof week3.submitted === 'object' ? week3.submitted : null,
          accepted: week3.accepted && typeof week3.accepted === 'object' ? week3.accepted : null
        }
      }
    };
  }

  let state = normalizeState(safeParse(localStorage.getItem(STORAGE_KEY)));
  const week3 = () => state.weeks.week3;

  function injectSanitizedFields() {
    const reflection = document.querySelector('#practice .workspace-section:last-of-type');
    if (!reflection || document.getElementById('showcaseInsight')) return;
    const block = document.createElement('div');
    block.className = 'sanitized-fields';
    block.innerHTML = `
      <div class="workspace-kicker">Optional · sanitized showcase language</div>
      <p class="subtle">These two fields are not grading requirements. Use them only if you want polished networking evidence in your showcase portfolio without names, contact details, private messages, or raw evidence.</p>
      <div class="field"><label for="showcaseInsight">Sanitized networking insight <span class="optional-label">Optional</span></label><textarea id="showcaseInsight" data-m360 placeholder="Example: Learned that entry-level support teams value concise ticket documentation and clear escalation notes."></textarea></div>
      <div class="field"><label for="showcaseFollowUp">Generalized follow-up plan <span class="optional-label">Optional</span></label><textarea id="showcaseFollowUp" data-m360 placeholder="Example: Apply the advice in my next project and reconnect after I can show the improvement."></textarea></div>`;
    reflection.appendChild(block);
  }

  function options(values, selected) {
    return '<option value="">Select</option>' + values.map(v => `<option${v === selected ? ' selected' : ''}>${escapeHtml(v)}</option>`).join('');
  }

  function renderNetworkMap() {
    const container = document.getElementById('networkMap');
    if (!container) return;
    container.innerHTML = week3().draft.networkTargets.map((target, i) => `
      <article class="network-target" data-target-index="${i}">
        <div class="network-target-head"><strong>Target ${i + 1}</strong><span>${i < MIN_TARGETS ? 'Required' : 'Optional'}</span></div>
        <div class="network-target-grid">
          <div class="field"><label>Target name / organization / community</label><input data-m360 data-network-field="target" data-target-index="${i}" value="${escapeHtml(target.target)}" /></div>
          <div class="field"><label>Network lane</label><select data-m360 data-network-field="lane" data-target-index="${i}">${options(lanes, target.lane)}</select></div>
          <div class="field"><label>Why this target matters</label><textarea data-m360 data-network-field="why" data-target-index="${i}">${escapeHtml(target.why)}</textarea></div>
          <div class="field"><label>What you want to learn</label><textarea data-m360 data-network-field="learn" data-target-index="${i}">${escapeHtml(target.learn)}</textarea></div>
          <div class="field"><label>Best connection method</label><input data-m360 data-network-field="method" data-target-index="${i}" value="${escapeHtml(target.method)}" /></div>
          <div class="field"><label>Status</label><select data-m360 data-network-field="status" data-target-index="${i}">${options(statuses, target.status)}</select></div>
          <div class="field network-next"><label>Next action</label><textarea data-m360 data-network-field="next" data-target-index="${i}">${escapeHtml(target.next)}</textarea></div>
        </div>
      </article>`).join('');
    bindNetworkInputs();
  }

  injectSanitizedFields();
  renderNetworkMap();

  function staticFields() { return Array.from(document.querySelectorAll('[data-m360]:not([data-network-field])')); }
  function reviewChecks() { return Array.from(document.querySelectorAll('[data-review-check]')); }

  function syncNetworkInput(input) {
    const index = Number(input.dataset.targetIndex);
    const key = input.dataset.networkField;
    if (!Number.isInteger(index) || !key || !week3().draft.networkTargets[index]) return;
    week3().draft.networkTargets[index][key] = input.value.trim();
  }

  function bindNetworkInputs() {
    document.querySelectorAll('[data-network-field]').forEach(input => {
      input.addEventListener('input', () => { syncNetworkInput(input); markDraft(); saveState(false); renderAll(); });
      input.addEventListener('change', () => { syncNetworkInput(input); markDraft(); saveState(false); renderAll(); });
    });
  }

  function syncFormToDraft() {
    staticFields().forEach(field => { week3().draft[field.id] = field.value.trim(); });
    reviewChecks().forEach(box => { week3().draft.reviewChecks[box.dataset.reviewCheck] = box.checked; });
    document.querySelectorAll('[data-network-field]').forEach(syncNetworkInput);
  }

  function loadDraftIntoForm() {
    staticFields().forEach(field => { field.value = typeof week3().draft[field.id] === 'string' ? week3().draft[field.id] : ''; });
    reviewChecks().forEach(box => { box.checked = Boolean(week3().draft.reviewChecks[box.dataset.reviewCheck]); });
  }

  function markDraft() { if (week3().status !== 'draft') week3().status = 'draft'; }
  function saveState(showMessage) {
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (showMessage) {
      const el = document.getElementById('saveState');
      if (el) { el.textContent = 'Saved locally at ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); el.classList.add('saved'); }
    }
  }

  function targetComplete(t) { return ['target','lane','why','learn','method','status','next'].every(k => t[k] && String(t[k]).trim()); }
  function missingRequiredFields() {
    const d = week3().draft;
    const checks = [
      ['Current target direction', d.targetDirection], ['Learning question 1', d.learningQuestion1], ['Learning question 2', d.learningQuestion2],
      ['Connection request', d.connectionRequest], ['Advice request', d.adviceRequest], ['Informational interview request', d.informationalRequest],
      ['Action completed', d.actionCompleted], ['Action date', d.actionDate], ['Action evidence', d.actionEvidence], ['Action result', d.actionResult],
      ['Next action', d.nextAction], ['Follow-up timing', d.followUpTiming], ['Tracker note', d.trackerNote],
      ['Reflection: what you learned', d.reflectionLearned], ['Reflection: what feels easiest', d.reflectionEasy],
      ['Reflection: what remains unclear', d.reflectionUnclear], ['Reflection: what you will do differently', d.reflectionNext]
    ];
    const missing = checks.filter(([,v]) => !v || !String(v).trim()).map(([label]) => label);
    d.networkTargets.slice(0, MIN_TARGETS).forEach((target, i) => { if (!targetComplete(target)) missing.push(`Network target ${i + 1}`); });
    reviewChecks().forEach(box => { if (!d.reviewChecks[box.dataset.reviewCheck]) missing.push('Message quality confirmation: ' + box.dataset.reviewCheck); });
    return missing;
  }

  function priorAccepted(number) { const w = state.weeks[`week${number}`]; return w && w.accepted ? w.accepted : null; }
  function readyCount() { return [1,2,3,4,5,6].filter(n => priorAccepted(n)).length; }
  function statusLabel() {
    const w = week3();
    if (w.status === 'submitted') return 'Submitted';
    if (w.status === 'needs_revision') return 'Needs Revision';
    if (w.status === 'accepted') return 'Meets Standard';
    if (w.accepted) return 'Draft in progress';
    return 'Draft';
  }

  function renderCarryForward() {
    const w1 = priorAccepted(1), w2 = priorAccepted(2);
    const title = document.getElementById('carryForwardTitle'), text = document.getElementById('carryForwardText'), details = document.getElementById('carryForwardDetails');
    document.getElementById('journeyWeek1').classList.toggle('ready', Boolean(w1));
    document.getElementById('journeyWeek2').classList.toggle('ready', Boolean(w2));
    if (!w1 && !w2) { title.textContent = 'No reviewer-approved prior artifacts are available yet.'; text.textContent = 'Week 3 only carries forward accepted Week 1–2 evidence; mutable drafts are never treated as proof.'; details.hidden = true; return; }
    title.textContent = 'Reviewer-approved prior work is available for reuse.';
    text.textContent = 'Week 3 reads accepted snapshots only. Editing Week 3 never mutates Week 1 or Week 2.';
    const rows = [];
    if (w1) rows.push(['Week 1 direction', w1.direction || '—'], ['Week 1 brand', w1.brandStatement || '—']);
    if (w2) rows.push(['Week 2 direction', w2.targetDirection || '—'], ['Week 2 profile', w2.profileUrl || '—'], ['Week 2 headline', w2.headline || '—']);
    details.innerHTML = rows.map(([label,value]) => `<div class="carry-row"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>`).join('');
    details.hidden = false;
    if (!week3().draft.targetDirection) {
      week3().draft.targetDirection = (w2 && w2.targetDirection) || (w1 && w1.direction) || '';
      const field = document.getElementById('targetDirection'); if (field) field.value = week3().draft.targetDirection;
    }
  }

  function showcaseSource() {
    const w = week3();
    return w.accepted || (w.status === 'submitted' && w.submitted) || w.draft;
  }

  function renderProof() {
    const w = week3(), s = showcaseSource();
    const rows = [
      ['Target direction', s.targetDirection || 'Add your current direction in Practice It.'],
      ['Networking action', s.actionResult || 'Document one real networking action.'],
      ['Sanitized insight', s.showcaseInsight || s.reflectionLearned || 'Add a generalized learning insight with no third-party personal information.'],
      ['Generalized follow-up', s.showcaseFollowUp || s.reflectionNext || 'Add a generalized next step with no private contact details.']
    ];
    document.getElementById('week3ProofPreview').innerHTML = rows.map(([label,value]) => `<div class="portfolio-row"><div class="portfolio-key">${escapeHtml(label)}</div><div class="portfolio-value">${escapeHtml(value)}</div></div>`).join('');
    const badge = document.getElementById('week3ArtifactStatus');
    badge.textContent = w.accepted ? 'Portfolio Ready' : w.status === 'submitted' ? 'Submitted · not yet accepted' : w.status === 'needs_revision' ? 'Needs Revision' : 'DRAFT — NOT YET ACCEPTED';
    badge.className = 'status-badge ' + (w.accepted ? 'accepted' : w.status === 'submitted' ? 'submitted' : w.status === 'needs_revision' ? 'needs-revision' : 'draft');
  }

  function renderReviewStatus() {
    const label = document.getElementById('reviewStatusLabel'), text = document.getElementById('reviewStatusText'), w = week3();
    if (w.status === 'submitted') { label.textContent='Submitted'; text.textContent='The complete private Week 3 academic submission is awaiting reviewer evaluation. The showcase preview remains sanitized.'; }
    else if (w.status === 'needs_revision') { label.textContent='Needs Revision'; text.textContent='Revise the required process or evidence in Practice It, then submit a new revision. Any prior accepted artifact remains preserved.'; }
    else if (w.status === 'accepted') { label.textContent='Meets Standard'; text.textContent='Reviewer approval is complete. The accepted academic snapshot is preserved; only sanitized professional evidence is Portfolio Ready for showcase use.'; }
    else if (w.accepted) { label.textContent='Draft in progress'; text.textContent='You are editing a new draft. The earlier accepted Week 3 artifact remains preserved and Portfolio Ready.'; }
    else { label.textContent='Draft'; text.textContent='Draft work has not been submitted for review.'; }
  }

  function renderProgress() {
    const count = readyCount(), pct = Math.round(count / 6 * 100);
    document.getElementById('journeyProgress').textContent = `${count} of 6 artifacts portfolio ready`;
    document.getElementById('sidebarPortfolioCount').textContent = `${count} / 6`;
    document.getElementById('sidebarProgressBar').style.width = `${pct}%`;
    document.getElementById('sidebarWeek1Status').textContent = priorAccepted(1) ? 'Portfolio Ready' : 'Not imported';
    document.getElementById('sidebarWeek2Status').textContent = priorAccepted(2) ? 'Portfolio Ready' : 'Not imported';
    document.getElementById('sidebarWeek3Status').textContent = statusLabel();
  }

  function renderRoadmap() {
    document.getElementById('portfolioRoadmap').innerHTML = roadmap.map((item, i) => {
      const ready = Boolean(priorAccepted(i + 1));
      const label = i === 2 ? (ready ? 'Portfolio Ready' : statusLabel()) : ready ? 'Portfolio Ready' : i < 2 ? 'Not imported' : 'Future';
      return `<article class="roadmap-card ${ready ? 'ready' : ''}"><span class="roadmap-state">${escapeHtml(label)}</span><div class="roadmap-week">WEEK ${item.week} · ${item.stage.toUpperCase()}</div><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.artifact)}</p></article>`;
    }).join('');
  }

  function renderAll() { renderCarryForward(); renderReviewStatus(); renderProof(); renderProgress(); renderRoadmap(); }
  function showValidation(type, message) { const el=document.getElementById('validationMessage'); el.textContent=message; el.className=`validation-message show ${type}`; }
  function clearValidation() { const el=document.getElementById('validationMessage'); el.textContent=''; el.className='validation-message'; }

  staticFields().forEach(field => {
    const event = field.tagName === 'SELECT' ? 'change' : 'input';
    field.addEventListener(event, () => { syncFormToDraft(); markDraft(); saveState(false); clearValidation(); renderAll(); });
  });
  reviewChecks().forEach(box => box.addEventListener('change', () => { syncFormToDraft(); markDraft(); saveState(false); clearValidation(); renderAll(); }));

  document.getElementById('addTargetBtn').addEventListener('click', () => { syncFormToDraft(); week3().draft.networkTargets.push(blankTarget()); renderNetworkMap(); saveState(false); });
  document.getElementById('saveBtn').addEventListener('click', () => { syncFormToDraft(); markDraft(); saveState(true); renderAll(); showValidation('success','Draft saved. Nothing has been submitted for review.'); });
  document.getElementById('submitReviewBtn').addEventListener('click', () => {
    syncFormToDraft(); const missing=missingRequiredFields();
    if (missing.length) { showValidation('error','Complete the required Week 3 proof before submitting: ' + missing.join(', ') + '.'); document.getElementById('practice').scrollIntoView({behavior:'smooth'}); return; }
    week3().submitted=clone(week3().draft); week3().submittedAt=new Date().toISOString(); week3().status='submitted'; saveState(false); renderAll(); showValidation('success','Week 3 submitted for review. The full academic snapshot is preserved privately; showcase output remains sanitized.');
  });
  document.getElementById('meetsStandardBtn').addEventListener('click', () => {
    const w=week3(); if (w.status!=='submitted'||!w.submitted) { showValidation('error','Submit Week 3 before simulating reviewer approval.'); return; }
    w.accepted=clone(w.submitted); w.acceptedAt=new Date().toISOString(); w.status='accepted'; saveState(false); renderAll(); showValidation('success','Demo review: Meets Standard. Week 3 is Portfolio Ready with sanitized showcase behavior.');
  });
  document.getElementById('needsRevisionBtn').addEventListener('click', () => {
    const w=week3(); if (w.status!=='submitted'||!w.submitted) { showValidation('error','Submit Week 3 before simulating Needs Revision.'); return; }
    w.status='needs_revision'; saveState(false); renderAll(); showValidation('error','Demo reviewer result: Needs Revision. Revise in Practice It and resubmit.');
  });
  document.getElementById('resetReviewBtn').addEventListener('click', () => { if (!confirm('Clear the Week 3 demo review state? The current draft will remain.')) return; const w=week3(); w.status='draft'; w.submitted=null; w.submittedAt=null; w.accepted=null; w.acceptedAt=null; saveState(false); renderAll(); });

  loadDraftIntoForm();
  renderAll();
  saveState(false);
})();
