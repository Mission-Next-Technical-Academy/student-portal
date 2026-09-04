(() => {
  'use strict';

  const STORAGE_KEY = 'mnt.m360.course.mock.v1';
  const SCHEMA_VERSION = 1;
  const MIN_BULLETS = 3;

  const roadmap = [
    { key: 'week1', week: '01', stage: 'Direction', title: 'Career Direction & Professional Brand', artifact: 'Professional direction + brand + evidence' },
    { key: 'week2', week: '02', stage: 'Signal', title: 'LinkedIn & Professional Presence', artifact: 'Professional profile + public positioning' },
    { key: 'week3', week: '03', stage: 'Connection', title: 'Networking & Professional Follow-Up', artifact: 'Sanitized networking action + learning evidence' },
    { key: 'week4', week: '04', stage: 'Evidence', title: 'Targeted Resume Development', artifact: 'Targeted resume + reusable evidence bullets' },
    { key: 'week5', week: '05', stage: 'Voice', title: 'Interview Preparation & Practice', artifact: 'STAR story bank + interview practice' },
    { key: 'week6', week: '06', stage: 'Proof', title: 'Career Spotlight', artifact: 'Career Spotlight + 30-day action plan' }
  ];

  function blankBullet() { return { original: '', revised: '', evidence: '' }; }
  function blankWeek4Draft() {
    const draft = {
      targetRole: '', whyTarget: '', resumeLink: '', resumeText: '', resumeVersionDate: '',
      evidenceBullets: Array.from({ length: MIN_BULLETS }, blankBullet),
      targetingNote: '', reflectionStrongest: '', reflectionNeedsWork: '', evidenceIntegrity: false
    };
    for (let i = 1; i <= 8; i += 1) draft[`keyword${i}`] = '';
    return draft;
  }

  function defaultState() {
    return {
      schemaVersion: SCHEMA_VERSION, updatedAt: null,
      weeks: {
        week1: { accepted: null, acceptedAt: null }, week2: { accepted: null, acceptedAt: null }, week3: { accepted: null, acceptedAt: null },
        week4: { status: 'draft', draft: blankWeek4Draft(), submitted: null, submittedAt: null, accepted: null, acceptedAt: null },
        week5: { status: 'future' }, week6: { status: 'future' }
      }
    };
  }

  function safeParse(raw) { try { return raw ? JSON.parse(raw) : null; } catch (_) { return null; } }
  function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
  function escapeHtml(value) { return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
  function normalizeBullet(item) { return { ...blankBullet(), ...(item && typeof item === 'object' ? item : {}) }; }

  function normalizeState(candidate) {
    const base = defaultState();
    if (!candidate || typeof candidate !== 'object') return base;
    const weeks = candidate.weeks || {};
    const current = weeks.week4 || {};
    const draft = { ...base.weeks.week4.draft, ...(current.draft || {}) };
    draft.evidenceBullets = Array.isArray(draft.evidenceBullets) ? draft.evidenceBullets.map(normalizeBullet) : [];
    while (draft.evidenceBullets.length < MIN_BULLETS) draft.evidenceBullets.push(blankBullet());
    draft.evidenceIntegrity = Boolean(draft.evidenceIntegrity);
    return {
      ...base, ...candidate, schemaVersion: SCHEMA_VERSION,
      weeks: {
        ...base.weeks, ...weeks,
        week1: { ...base.weeks.week1, ...(weeks.week1 || {}) }, week2: { ...base.weeks.week2, ...(weeks.week2 || {}) }, week3: { ...base.weeks.week3, ...(weeks.week3 || {}) },
        week4: {
          ...base.weeks.week4, ...current, draft,
          submitted: current.submitted && typeof current.submitted === 'object' ? current.submitted : null,
          accepted: current.accepted && typeof current.accepted === 'object' ? current.accepted : null
        }
      }
    };
  }

  let state = normalizeState(safeParse(localStorage.getItem(STORAGE_KEY)));
  const week4 = () => state.weeks.week4;
  const priorAccepted = number => state.weeks[`week${number}`] && state.weeks[`week${number}`].accepted ? state.weeks[`week${number}`].accepted : null;

  function injectKeywordFields() {
    const grid = document.getElementById('keywordGrid');
    if (!grid) return;
    grid.innerHTML = Array.from({ length: 8 }, (_, index) => {
      const n = index + 1;
      return `<div class="field"><label for="keyword${n}">Signal ${n}${n <= 5 ? ' <span class="portfolio-field">Required</span>' : ' <span class="optional-label">Optional</span>'}</label><input id="keyword${n}" data-m360 type="text" /></div>`;
    }).join('');
  }

  function renderBullets() {
    const container = document.getElementById('evidenceBullets');
    if (!container) return;
    container.innerHTML = week4().draft.evidenceBullets.map((bullet, i) => `
      <article class="evidence-bullet" data-bullet-index="${i}">
        <div class="evidence-bullet-head"><strong>Evidence bullet ${i + 1}</strong><span>${i < MIN_BULLETS ? 'Required' : 'Optional'}</span></div>
        <div class="field"><label>Original / prior wording</label><textarea data-m360 data-bullet-field="original" data-bullet-index="${i}">${escapeHtml(bullet.original)}</textarea></div>
        <div class="field"><label>Revised wording</label><textarea data-m360 data-bullet-field="revised" data-bullet-index="${i}">${escapeHtml(bullet.revised)}</textarea></div>
        <div class="field"><label>What evidence or capability does it show?</label><textarea data-m360 data-bullet-field="evidence" data-bullet-index="${i}">${escapeHtml(bullet.evidence)}</textarea></div>
      </article>`).join('');
    bindBulletInputs();
  }

  injectKeywordFields();
  renderBullets();

  function staticFields() { return Array.from(document.querySelectorAll('[data-m360]:not([data-bullet-field])')); }
  function integrityBox() { return document.getElementById('evidenceIntegrity'); }

  function syncBulletInput(input) {
    const index = Number(input.dataset.bulletIndex), key = input.dataset.bulletField;
    if (!Number.isInteger(index) || !key || !week4().draft.evidenceBullets[index]) return;
    week4().draft.evidenceBullets[index][key] = input.value.trim();
  }

  function bindBulletInputs() {
    document.querySelectorAll('[data-bullet-field]').forEach(input => {
      input.addEventListener('input', () => { syncBulletInput(input); markDraft(); saveState(false); renderAll(); });
    });
  }

  function syncFormToDraft() {
    staticFields().forEach(field => { week4().draft[field.id] = field.value.trim(); });
    document.querySelectorAll('[data-bullet-field]').forEach(syncBulletInput);
    week4().draft.evidenceIntegrity = Boolean(integrityBox() && integrityBox().checked);
  }

  function loadDraftIntoForm() {
    staticFields().forEach(field => { field.value = typeof week4().draft[field.id] === 'string' ? week4().draft[field.id] : ''; });
    if (integrityBox()) integrityBox().checked = Boolean(week4().draft.evidenceIntegrity);
  }

  function markDraft() { if (week4().status !== 'draft') week4().status = 'draft'; }
  function saveState(showMessage) {
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (showMessage) {
      const el = document.getElementById('saveState');
      if (el) { el.textContent = 'Saved locally at ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); el.classList.add('saved'); }
    }
  }

  function completeBullet(b) { return ['original','revised','evidence'].every(k => b[k] && String(b[k]).trim()); }
  function missingRequiredFields() {
    const d = week4().draft;
    const checks = [
      ['Target role/posting/opportunity type', d.targetRole], ['Why this target', d.whyTarget], ['Resume version/date', d.resumeVersionDate],
      ['Targeting note', d.targetingNote], ['Strongest improvement reflection', d.reflectionStrongest], ['Needs-work reflection', d.reflectionNeedsWork]
    ];
    const missing = checks.filter(([, value]) => !value || !String(value).trim()).map(([label]) => label);
    for (let i = 1; i <= 5; i += 1) if (!d[`keyword${i}`] || !d[`keyword${i}`].trim()) missing.push(`Target signal ${i}`);
    if ((!d.resumeLink || !d.resumeLink.trim()) && (!d.resumeText || !d.resumeText.trim())) missing.push('Resume link or pasted resume text');
    d.evidenceBullets.slice(0, MIN_BULLETS).forEach((bullet, i) => { if (!completeBullet(bullet)) missing.push(`Evidence bullet ${i + 1}`); });
    if (!d.evidenceIntegrity) missing.push('Evidence integrity confirmation');
    return missing;
  }

  function readyCount() { return [1,2,3,4,5,6].filter(n => Boolean(priorAccepted(n))).length; }
  function statusLabel() {
    const w = week4();
    if (w.status === 'submitted') return 'Submitted';
    if (w.status === 'needs_revision') return 'Needs Revision';
    if (w.status === 'accepted') return 'Meets Standard';
    if (w.accepted) return 'Draft in progress';
    return 'Draft';
  }

  function safeWeek3Insight(w3) {
    if (!w3) return '';
    return w3.showcaseInsight || w3.reflectionLearned || '';
  }

  function renderCarryForward() {
    const w1 = priorAccepted(1), w2 = priorAccepted(2), w3 = priorAccepted(3);
    [1,2,3].forEach(number => { const el=document.getElementById(`journeyWeek${number}`); if (el) el.classList.toggle('ready', Boolean(priorAccepted(number))); });
    const title=document.getElementById('carryForwardTitle'), text=document.getElementById('carryForwardText'), details=document.getElementById('carryForwardDetails');
    if (!w1 && !w2 && !w3) {
      title.textContent='No reviewer-approved prior artifacts are available yet.';
      text.textContent='Week 4 only reuses accepted evidence. Mutable drafts and raw Week 3 networking details are not carry-forward sources.';
      details.hidden=true; return;
    }
    title.textContent='Reviewer-approved evidence is available for targeting.';
    text.textContent='Use accepted professional evidence as source material. Week 4 creates a new resume artifact and never changes the earlier accepted snapshots.';
    const rows=[];
    if (w1) {
      rows.push(['Week 1 direction', w1.direction || '—'], ['Week 1 brand', w1.brandStatement || '—']);
      const strengths=[1,2,3].map(i => [w1[`strength${i}`],w1[`evidence${i}`]]).filter(([s,e]) => s || e).map(([s,e]) => `${s || 'Strength'} — ${e || 'Evidence not recorded'}`).join(' | ');
      if (strengths) rows.push(['Week 1 evidence', strengths]);
      if (w1.translation) rows.push(['Week 1 translated experience', w1.translation]);
    }
    if (w2) {
      rows.push(['Week 2 headline', w2.headline || '—']);
      const skills=Array.from({length:8},(_,i)=>w2[`skill${i+1}`]).filter(Boolean).join(', ');
      if (skills) rows.push(['Week 2 skills', skills]);
      if (w2.experienceAfter) rows.push(['Week 2 experience evidence', w2.experienceAfter]);
    }
    const insight=safeWeek3Insight(w3);
    if (insight) rows.push(['Week 3 sanitized insight', insight]);
    details.innerHTML=rows.map(([label,value])=>`<div class="carry-row"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>`).join('');
    details.hidden=false;
    if (!week4().draft.targetRole) {
      week4().draft.targetRole=(w2 && w2.targetDirection) || (w1 && w1.direction) || '';
      const field=document.getElementById('targetRole'); if (field) field.value=week4().draft.targetRole;
    }
  }

  function artifactSource() { const w=week4(); return w.accepted || (w.status==='submitted' && w.submitted) || w.draft; }
  function evidencePreview(source) {
    const bullets=(source.evidenceBullets || []).filter(b => b && b.revised && b.revised.trim()).slice(0,3);
    if (!bullets.length) return 'Revise at least three evidence-backed bullets in Practice It.';
    return bullets.map((b,i)=>`${i+1}. ${b.revised}`).join('\n');
  }

  function renderProof() {
    const w=week4(), s=artifactSource();
    const resumeReference=s.resumeLink && s.resumeLink.trim() ? s.resumeLink.trim() : s.resumeText && s.resumeText.trim() ? 'Pasted resume text included in the accepted academic snapshot.' : 'Add a resume link or pasted resume text.';
    const rows=[
      ['Target opportunity', s.targetRole || 'Choose the specific role, posting, or opportunity type.'],
      ['Resume reference', resumeReference],
      ['Revised evidence bullets', evidencePreview(s)],
      ['Targeting note', s.targetingNote || 'Explain what you emphasized, which target signals you used, and what gaps remain.']
    ];
    document.getElementById('week4ProofPreview').innerHTML=rows.map(([label,value])=>`<div class="portfolio-row"><div class="portfolio-key">${escapeHtml(label)}</div><div class="portfolio-value preserve-lines">${escapeHtml(value)}</div></div>`).join('');
    const badge=document.getElementById('week4ArtifactStatus');
    badge.textContent=w.accepted?'Portfolio Ready':w.status==='submitted'?'Submitted · not yet accepted':w.status==='needs_revision'?'Needs Revision':'DRAFT — NOT YET ACCEPTED';
    badge.className='status-badge '+(w.accepted?'accepted':w.status==='submitted'?'submitted':w.status==='needs_revision'?'needs-revision':'draft');
  }

  function renderReviewStatus() {
    const label=document.getElementById('reviewStatusLabel'), text=document.getElementById('reviewStatusText'), w=week4();
    if (w.status==='submitted') { label.textContent='Submitted'; text.textContent='The targeted resume snapshot is awaiting reviewer evaluation. Future draft edits will not change this submitted revision.'; }
    else if (w.status==='needs_revision') { label.textContent='Needs Revision'; text.textContent='Return to Practice It, revise the targeting or evidence, and submit a new revision. Any prior accepted artifact remains preserved.'; }
    else if (w.status==='accepted') { label.textContent='Meets Standard'; text.textContent='Reviewer approval is complete. The accepted targeted resume evidence is now Portfolio Ready and can support Week 5 interview preparation.'; }
    else if (w.accepted) { label.textContent='Draft in progress'; text.textContent='You are editing a new draft. The previously accepted Week 4 artifact remains preserved and Portfolio Ready.'; }
    else { label.textContent='Draft'; text.textContent='Draft work has not been submitted for review.'; }
  }

  function renderProgress() {
    const count=readyCount(), pct=Math.round(count/6*100);
    document.getElementById('journeyProgress').textContent=`${count} of 6 artifacts portfolio ready`;
    document.getElementById('sidebarPortfolioCount').textContent=`${count} / 6`;
    document.getElementById('sidebarProgressBar').style.width=`${pct}%`;
    [1,2,3].forEach(n=>{const el=document.getElementById(`sidebarWeek${n}Status`); if(el)el.textContent=priorAccepted(n)?'Portfolio Ready':'Not imported';});
    document.getElementById('sidebarWeek4Status').textContent=statusLabel();
  }

  function renderRoadmap() {
    document.getElementById('portfolioRoadmap').innerHTML=roadmap.map((item,i)=>{
      const ready=Boolean(priorAccepted(i+1));
      const label=i===3?(ready?'Portfolio Ready':statusLabel()):ready?'Portfolio Ready':i<3?'Not imported':'Future';
      return `<article class="roadmap-card ${ready?'ready':''}"><span class="roadmap-state">${escapeHtml(label)}</span><div class="roadmap-week">WEEK ${item.week} · ${item.stage.toUpperCase()}</div><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.artifact)}</p></article>`;
    }).join('');
  }

  function renderAll() { renderCarryForward(); renderReviewStatus(); renderProof(); renderProgress(); renderRoadmap(); }
  function showValidation(type,message){const el=document.getElementById('validationMessage');el.textContent=message;el.className=`validation-message show ${type}`;}
  function clearValidation(){const el=document.getElementById('validationMessage');el.textContent='';el.className='validation-message';}

  staticFields().forEach(field=>field.addEventListener(field.tagName==='SELECT'?'change':'input',()=>{syncFormToDraft();markDraft();saveState(false);clearValidation();renderAll();}));
  if (integrityBox()) integrityBox().addEventListener('change',()=>{syncFormToDraft();markDraft();saveState(false);clearValidation();renderAll();});
  document.getElementById('addBulletBtn').addEventListener('click',()=>{syncFormToDraft();week4().draft.evidenceBullets.push(blankBullet());renderBullets();saveState(false);});
  document.getElementById('saveBtn').addEventListener('click',()=>{syncFormToDraft();markDraft();saveState(true);renderAll();showValidation('success','Draft saved. Nothing has been submitted for review.');});
  document.getElementById('submitReviewBtn').addEventListener('click',()=>{
    syncFormToDraft();const missing=missingRequiredFields();
    if(missing.length){showValidation('error','Complete the required Week 4 proof before submitting: '+missing.join(', ')+'.');document.getElementById('practice').scrollIntoView({behavior:'smooth'});return;}
    week4().submitted=clone(week4().draft);week4().submittedAt=new Date().toISOString();week4().status='submitted';saveState(false);renderAll();showValidation('success','Week 4 submitted for review. The targeted resume revision is preserved separately from future draft edits.');
  });
  document.getElementById('meetsStandardBtn').addEventListener('click',()=>{const w=week4();if(w.status!=='submitted'||!w.submitted){showValidation('error','Submit Week 4 before simulating reviewer approval.');return;}w.accepted=clone(w.submitted);w.acceptedAt=new Date().toISOString();w.status='accepted';saveState(false);renderAll();showValidation('success','Demo review: Meets Standard. Week 4 is Portfolio Ready and can feed Week 5.');});
  document.getElementById('needsRevisionBtn').addEventListener('click',()=>{const w=week4();if(w.status!=='submitted'||!w.submitted){showValidation('error','Submit Week 4 before simulating Needs Revision.');return;}w.status='needs_revision';saveState(false);renderAll();showValidation('error','Demo reviewer result: Needs Revision. Revise the target alignment or evidence and resubmit.');});
  document.getElementById('resetReviewBtn').addEventListener('click',()=>{if(!confirm('Clear the Week 4 demo review state? The current draft will remain.'))return;const w=week4();w.status='draft';w.submitted=null;w.submittedAt=null;w.accepted=null;w.acceptedAt=null;saveState(false);renderAll();});

  loadDraftIntoForm();
  renderAll();
  saveState(false);
})();
