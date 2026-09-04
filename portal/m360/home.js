(() => {
  'use strict';

  const WEEK1_KEYS = [
    'mnt.m360.preview.portfolio.v3',
    'mnt.m360.preview.portfolio.v2',
    'mnt.m360.preview.week1.v1'
  ];
  const WEEK2_KEY = 'mnt.m360.course.mock.v1';

  function safeParse(raw) {
    try { return raw ? JSON.parse(raw) : null; } catch (_) { return null; }
  }

  function firstStored(keys) {
    for (const key of keys) {
      const value = safeParse(localStorage.getItem(key));
      if (value) return value;
    }
    return null;
  }

  function getWeek1() {
    const source = firstStored(WEEK1_KEYS);
    if (!source) return null;
    if (source.weeks && source.weeks.week1) return source.weeks.week1;
    return source.week1 || source;
  }

  function getWeek2() {
    const source = safeParse(localStorage.getItem(WEEK2_KEY));
    return source && source.weeks ? source.weeks.week2 || null : null;
  }

  function hasDraftContent(week) {
    if (!week || !week.draft || typeof week.draft !== 'object') return false;
    return Object.entries(week.draft).some(([key, value]) => {
      if (key === 'reviewChecks') {
        return value && typeof value === 'object' && Object.values(value).some(Boolean);
      }
      return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
    });
  }

  function statusFor(week) {
    if (!week) return { label: 'Not Started', className: '' };
    if (week.accepted) return { label: 'Portfolio Ready', className: 'ready' };
    if (week.status === 'submitted') return { label: 'Submitted', className: 'submitted' };
    if (week.status === 'needs_revision') return { label: 'Needs Revision', className: 'revision' };
    if (hasDraftContent(week)) return { label: 'In Progress', className: 'progress' };
    return { label: 'Not Started', className: '' };
  }

  function applyStatus(elementId, status) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = status.label;
    el.className = 'status-pill' + (status.className ? ' ' + status.className : '');
  }

  const week1 = getWeek1();
  const week2 = getWeek2();
  const week1Status = statusFor(week1);
  const week2Status = statusFor(week2);

  applyStatus('week1Status', week1Status);
  applyStatus('week2Status', week2Status);

  const readyCount = Number(Boolean(week1 && week1.accepted)) + Number(Boolean(week2 && week2.accepted));
  const readyCountEl = document.getElementById('readyCount');
  const portfolioCountLarge = document.getElementById('portfolioCountLarge');
  const progressBar = document.getElementById('homeProgressBar');
  if (readyCountEl) readyCountEl.textContent = `${readyCount} / 6`;
  if (portfolioCountLarge) portfolioCountLarge.textContent = String(readyCount);
  if (progressBar) progressBar.style.width = `${Math.round((readyCount / 6) * 100)}%`;

  const continueButton = document.getElementById('continueButton');
  const currentStatusText = document.getElementById('currentStatusText');

  if (!week1 || !week1.accepted) {
    continueButton.href = '../m360-preview.html';
    continueButton.textContent = hasDraftContent(week1) ? 'Continue Week 1' : 'Start Week 1';
    currentStatusText.textContent = hasDraftContent(week1)
      ? 'Continue building your Week 1 Direction artifact.'
      : 'Start with Week 1 to establish your professional direction.';
  } else if (!week2 || !week2.accepted) {
    continueButton.href = 'course.html';
    continueButton.textContent = hasDraftContent(week2) || week2Status.label !== 'Not Started' ? 'Continue Week 2' : 'Start Week 2';
    currentStatusText.textContent = 'Week 1 is Portfolio Ready. Week 2 now turns that direction into a professional signal.';
  } else {
    continueButton.href = 'course.html';
    continueButton.textContent = 'Review Week 2';
    currentStatusText.textContent = 'Weeks 1 and 2 are Portfolio Ready. Week 3 will become the next step when it is released.';
  }
})();
