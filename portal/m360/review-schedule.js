(() => {
  'use strict';

  const WEEK_TITLES = {1:'Direction',2:'Signal',3:'Connection',4:'Evidence',5:'Voice',6:'Proof'};
  const TIMEZONES = ['ET','CT','MT','PT'];
  let original = new Map();
  let cohortId = '';
  let cohortName = '';
  let refreshToken = 0;

  const el = id => document.getElementById(id);
  const key = (week, session) => `${week}:${session}`;
  const rowKey = row => key(Number(row.week_number), Number(row.session_number));
  const normalizeTime = value => String(value || '').trim().slice(0, 5);
  const escapeHtml = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

  function selectedCohort() {
    const select = el('cohortSelect');
    return {
      id: String(select?.value || '').trim(),
      name: String(select?.selectedOptions?.[0]?.textContent || '').split(' · ')[0].trim()
    };
  }

  function setCohortFromUi() {
    const selected = selectedCohort();
    cohortId = selected.id;
    cohortName = selected.name || 'Selected cohort';
    const note = el('m360ScheduleCohortNote');
    if (note) note.innerHTML = `<strong>${escapeHtml(cohortName)}</strong> schedule only. Changes here do not affect another cohort.`;
  }

  function scheduleSlot(week, session) {
    const slotKey = key(week, session);
    return `<article class="m360-schedule-slot" data-schedule-slot="${slotKey}">
      <h3>Session ${session}</h3>
      <div class="m360-schedule-fields">
        <div class="m360-schedule-field"><label for="schedule-date-${week}-${session}">Date</label><input id="schedule-date-${week}-${session}" type="date" data-schedule-date="${slotKey}" /></div>
        <div class="m360-schedule-field"><label for="schedule-time-${week}-${session}">Time</label><input id="schedule-time-${week}-${session}" type="time" data-schedule-time="${slotKey}" /></div>
        <div class="m360-schedule-field"><label for="schedule-zone-${week}-${session}">Zone</label><select id="schedule-zone-${week}-${session}" data-schedule-zone="${slotKey}">${TIMEZONES.map(zone => `<option value="${zone}"${zone === 'ET' ? ' selected' : ''}>${zone}</option>`).join('')}</select></div>
      </div>
    </article>`;
  }

  function renderShell() {
    const grid = el('m360ScheduleGrid');
    if (!grid) return;
    grid.innerHTML = Array.from({length:6}, (_, index) => {
      const week = index + 1;
      return `<section class="m360-schedule-week">
        <div class="m360-schedule-week-header"><strong>Week ${week} · ${WEEK_TITLES[week]}</strong><span>Student-facing live-session time</span></div>
        <div class="m360-schedule-slots">${scheduleSlot(week,1)}${scheduleSlot(week,2)}</div>
      </section>`;
    }).join('');
  }

  function setStatus(message, tone='') {
    const status = el('m360ScheduleStatus');
    if (!status) return;
    status.textContent = message || '';
    status.className = `m360-schedule-status${tone ? ' ' + tone : ''}`;
  }

  function valuesFor(week, session) {
    const slotKey = key(week, session);
    return {
      week_number: week,
      session_number: session,
      session_date: document.querySelector(`[data-schedule-date="${slotKey}"]`)?.value || '',
      session_time: document.querySelector(`[data-schedule-time="${slotKey}"]`)?.value || '',
      timezone_label: document.querySelector(`[data-schedule-zone="${slotKey}"]`)?.value || 'ET'
    };
  }

  function stampOriginal(rows) {
    original = new Map();
    (rows || []).forEach(row => original.set(rowKey(row), {
      session_date: String(row.session_date || ''),
      session_time: normalizeTime(row.session_time),
      timezone_label: String(row.timezone_label || 'ET')
    }));
  }

  function hydrate(rows) {
    stampOriginal(rows);
    for (let week=1; week<=6; week+=1) {
      for (let session=1; session<=2; session+=1) {
        const slotKey = key(week, session);
        const row = (rows || []).find(item => rowKey(item) === slotKey) || null;
        const date = document.querySelector(`[data-schedule-date="${slotKey}"]`);
        const time = document.querySelector(`[data-schedule-time="${slotKey}"]`);
        const zone = document.querySelector(`[data-schedule-zone="${slotKey}"]`);
        if (date) date.value = row?.session_date || '';
        if (time) time.value = normalizeTime(row?.session_time);
        if (zone) zone.value = TIMEZONES.includes(row?.timezone_label) ? row.timezone_label : 'ET';
      }
    }
  }

  async function refresh() {
    setCohortFromUi();
    const token = ++refreshToken;
    const button = el('refreshScheduleBtn');
    if (button) button.disabled = true;
    if (!cohortId) {
      hydrate([]);
      setStatus('Select a cohort to manage its schedule.');
      if (button) button.disabled = false;
      return;
    }
    setStatus(`Loading ${cohortName} schedule…`);
    try {
      const rows = await M360Data.loadLiveSessions(cohortId);
      if (token !== refreshToken) return;
      hydrate(rows);
      setStatus(`${cohortName} schedule loaded.`, 'success');
    } catch (error) {
      if (token !== refreshToken) return;
      console.error('M360 cohort schedule load failed', error);
      setStatus(error.message || 'Unable to load this cohort schedule.', 'error');
    } finally {
      if (token === refreshToken && button) button.disabled = false;
    }
  }

  function changedSlots() {
    const changes=[];
    for (let week=1; week<=6; week+=1) for (let session=1; session<=2; session+=1) {
      const current=valuesFor(week,session);
      const before=original.get(key(week,session)) || {session_date:'',session_time:'',timezone_label:'ET'};
      if (current.session_date!==before.session_date || current.session_time!==before.session_time || current.timezone_label!==before.timezone_label) changes.push(current);
    }
    return changes;
  }

  async function saveAll() {
    setCohortFromUi();
    if (!cohortId) { setStatus('Select a cohort before saving a schedule.', 'error'); return; }
    const button=el('saveScheduleChangesBtn');
    const changes=changedSlots();
    if (!changes.length) { setStatus('No schedule changes to save.'); return; }

    for (const item of changes) {
      const hasDate=Boolean(item.session_date), hasTime=Boolean(item.session_time);
      if (hasDate !== hasTime) {
        setStatus(`Week ${item.week_number}, Session ${item.session_number}: enter both a date and time, or clear both.`, 'error');
        document.querySelector(!hasDate ? `[data-schedule-date="${key(item.week_number,item.session_number)}"]` : `[data-schedule-time="${key(item.week_number,item.session_number)}"]`)?.focus();
        return;
      }
    }

    if (button) button.disabled=true;
    setStatus(`Saving ${changes.length} change${changes.length===1?'':'s'} to ${cohortName}…`);
    try {
      for (const item of changes) {
        if (!item.session_date && !item.session_time) {
          await M360Data.deleteLiveSession(item.week_number, item.session_number, cohortId);
        } else {
          await M360Data.saveLiveSession(item.week_number, item.session_number, item.session_date, item.session_time, item.timezone_label, cohortId);
        }
      }
      hydrate(await M360Data.loadLiveSessions(cohortId));
      setStatus(`${cohortName} schedule saved. Other cohorts were not changed.`, 'success');
    } catch (error) {
      console.error('M360 cohort schedule save failed', error);
      setStatus(error.message || 'Unable to save this cohort schedule.', 'error');
    } finally { if (button) button.disabled=false; }
  }

  function observeCohortPopulation() {
    const select = el('cohortSelect');
    if (!select) return;
    let lastValue = select.value;
    const observer = new MutationObserver(() => {
      const nextValue = select.value;
      if (nextValue && nextValue !== lastValue) {
        lastValue = nextValue;
        refresh();
      }
    });
    observer.observe(select, {childList:true,subtree:true});
  }

  async function init() {
    if (!window.M360Data) return;
    try {
      const context=await M360Data.getContext();
      if (!context.authenticated || !context.isAdmin) return;
      renderShell();
      el('refreshScheduleBtn')?.addEventListener('click', refresh);
      el('saveScheduleChangesBtn')?.addEventListener('click', saveAll);
      el('cohortSelect')?.addEventListener('change', refresh);
      observeCohortPopulation();
      await refresh();
    } catch (error) {
      console.error('M360 cohort schedule initialization failed', error);
      setStatus(error.message || 'Live-session schedule could not initialize.', 'error');
    }
  }

  init();
})();
