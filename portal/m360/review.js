(() => {
  'use strict';

  const queue = document.getElementById('reviewQueue');
  const queueCount = document.getElementById('queueCount');
  const notice = document.getElementById('reviewNotice');
  const refreshButton = document.getElementById('refreshQueueBtn');

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function labelize(key) {
    return String(key || '')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replaceAll('_', ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  function renderValue(value) {
    if (value === null || value === undefined || value === '') return '<span class="empty">Not provided</span>';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.length ? escapeHtml(value.join(' · ')) : '<span class="empty">None</span>';
    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (!entries.length) return '<span class="empty">None</span>';
      return entries.map(([key, child]) => `${escapeHtml(labelize(key))}: ${renderValue(child)}`).join('<br>');
    }
    return escapeHtml(value);
  }

  function payloadRows(payload) {
    if (!payload || typeof payload !== 'object') return '<div class="empty-state">No submitted payload was returned.</div>';
    return `<div class="payload-grid">${Object.entries(payload).map(([key, value]) => `
      <div class="payload-row">
        <div class="payload-key">${escapeHtml(labelize(key))}</div>
        <div class="payload-value">${renderValue(value)}</div>
      </div>`).join('')}</div>`;
  }

  function scoreFields(row) {
    const dimensions = [
      ['clarity', 'Clarity'],
      ['relevance', 'Relevance'],
      ['evidence', 'Evidence'],
      ['application', 'Application']
    ];
    if (Number(row.week_number) === 6) dimensions.push(['professional_communication', 'Professional Communication']);
    const max = Number(row.week_number) === 6 ? 20 : 25;
    return dimensions.map(([key, label]) => `
      <div class="score-field">
        <label for="score-${row.user_id}-${row.week_number}-${key}">${label} / ${max}</label>
        <input id="score-${row.user_id}-${row.week_number}-${key}" data-score="${key}" type="number" min="0" max="${max}" step="1" inputmode="decimal" />
      </div>`).join('');
  }

  function weekTitle(week) {
    return {
      1: 'Career Direction & Professional Brand',
      2: 'LinkedIn & Professional Presence',
      3: 'Networking & Professional Follow-Up',
      4: 'Targeted Resume Development',
      5: 'Interview Preparation & Practice',
      6: 'Career Spotlight'
    }[Number(week)] || `Week ${week}`;
  }

  function showNotice(message, type = '') {
    notice.hidden = false;
    notice.textContent = message;
    notice.className = `review-notice${type ? ' ' + type : ''}`;
  }

  function clearNotice() {
    notice.hidden = true;
    notice.textContent = '';
    notice.className = 'review-notice';
  }

  function renderQueue(rows) {
    queueCount.textContent = String(rows.length);
    if (!rows.length) {
      queue.innerHTML = '<div class="empty-state">No M360 submissions are awaiting review.</div>';
      return;
    }

    queue.innerHTML = rows.map(row => {
      const studentId = row.student && row.student.student_id ? row.student.student_id : row.user_id;
      const track = row.student && row.student.track_code ? row.student.track_code : row.track_code;
      const priorAccepted = Boolean(row.accepted_artifact_payload);
      return `
        <article class="review-card" data-review-card data-user-id="${escapeHtml(row.user_id)}" data-week="${Number(row.week_number)}">
          <div class="review-card-header">
            <div>
              <div class="mini-kicker">Week ${Number(row.week_number)} · Revision ${Number(row.revision_number || 1)}</div>
              <h3>${escapeHtml(weekTitle(row.week_number))}</h3>
              <div class="review-meta">Student ${escapeHtml(studentId)} · ${escapeHtml(track || 'Track unavailable')} · Submitted ${row.submitted_at ? escapeHtml(new Date(row.submitted_at).toLocaleString()) : 'time unavailable'}</div>
            </div>
            <span class="review-status">Submitted</span>
          </div>
          <div class="review-card-body">
            <section class="submission-panel">
              <h4>Submitted evidence</h4>
              ${payloadRows(row.submitted_payload)}
              ${priorAccepted ? '<div class="review-prior"><strong>Prior Portfolio Ready artifact preserved.</strong> This review is evaluating a newer submitted revision; the previous accepted artifact remains intact unless this revision is accepted.</div>' : ''}
            </section>
            <section class="scoring-panel">
              <h4>Reviewer decision</h4>
              <div class="score-grid">${scoreFields(row)}</div>
              <div class="review-total">Total: <span data-total>0</span> / 100</div>
              <div class="review-feedback">
                <label for="feedback-${escapeHtml(row.user_id)}-${Number(row.week_number)}">Feedback</label>
                <textarea id="feedback-${escapeHtml(row.user_id)}-${Number(row.week_number)}" data-feedback placeholder="Give specific, actionable feedback. This is stored with the reviewed revision."></textarea>
              </div>
              <div class="review-actions">
                <button class="btn btn-secondary" type="button" data-decision="needs_revision">Needs Revision</button>
                <button class="btn btn-primary" type="button" data-decision="accepted">Meets Standard</button>
              </div>
              <details class="attendance-bridge">
                <summary>Attendance requirement bridge</summary>
                <div class="attendance-fields">
                  <label class="attendance-check"><input type="checkbox" data-attendance-met /> <span>Staff-confirmed M360 attendance requirement satisfied</span></label>
                  <div class="field">
                    <label>External record reference <span class="help">Optional internal reference; do not enter session minutes or clock hours.</span></label>
                    <input type="text" data-attendance-reference placeholder="Example: external attendance roster reference" />
                  </div>
                  <button class="btn btn-quiet" type="button" data-save-attendance>Save attendance status</button>
                </div>
              </details>
            </section>
          </div>
        </article>`;
    }).join('');

    wireCards();
  }

  function rubricFor(card) {
    const scores = {};
    let total = 0;
    let complete = true;
    card.querySelectorAll('[data-score]').forEach(input => {
      const raw = input.value.trim();
      if (raw === '') complete = false;
      const value = raw === '' ? 0 : Number(raw);
      if (!Number.isFinite(value)) complete = false;
      scores[input.dataset.score] = value;
      total += Number.isFinite(value) ? value : 0;
    });
    return { scores, total, complete };
  }

  function wireCards() {
    queue.querySelectorAll('[data-review-card]').forEach(card => {
      const totalEl = card.querySelector('[data-total]');
      card.querySelectorAll('[data-score]').forEach(input => {
        input.addEventListener('input', () => {
          totalEl.textContent = String(rubricFor(card).total);
        });
      });

      card.querySelectorAll('[data-decision]').forEach(button => {
        button.addEventListener('click', async () => {
          clearNotice();
          const { scores, total, complete } = rubricFor(card);
          const decision = button.dataset.decision;
          if (!complete) {
            showNotice('Score every required rubric dimension before recording a reviewer decision.', 'error');
            return;
          }
          if (decision === 'accepted' && total < 70) {
            showNotice('Meets Standard requires a total score of at least 70.', 'error');
            return;
          }

          card.querySelectorAll('button').forEach(el => { el.disabled = true; });
          try {
            await M360Data.reviewWeek(
              card.dataset.userId,
              Number(card.dataset.week),
              decision,
              scores,
              card.querySelector('[data-feedback]').value.trim()
            );
            showNotice(
              decision === 'accepted'
                ? `Week ${card.dataset.week} marked Meets Standard and the submitted snapshot is now Portfolio Ready.`
                : `Week ${card.dataset.week} returned for revision. The submitted revision remains preserved.`,
              'success'
            );
            await loadQueue();
          } catch (error) {
            console.error('M360 review decision failed', error);
            showNotice(error.message || 'Unable to save the M360 reviewer decision.', 'error');
            card.querySelectorAll('button').forEach(el => { el.disabled = false; });
          }
        });
      });

      const attendanceButton = card.querySelector('[data-save-attendance]');
      attendanceButton.addEventListener('click', async () => {
        attendanceButton.disabled = true;
        try {
          const met = card.querySelector('[data-attendance-met]').checked;
          const reference = card.querySelector('[data-attendance-reference]').value.trim();
          await M360Data.setAttendance(card.dataset.userId, met, reference);
          showNotice(met ? 'Attendance requirement marked satisfied using the external-record bridge.' : 'Attendance requirement status cleared.', 'success');
        } catch (error) {
          console.error('M360 attendance bridge save failed', error);
          showNotice(error.message || 'Unable to save the attendance requirement status.', 'error');
        } finally {
          attendanceButton.disabled = false;
        }
      });
    });
  }

  async function loadQueue() {
    clearNotice();
    queue.innerHTML = '<div class="empty-state">Loading M360 review queue…</div>';
    try {
      const context = await M360Data.getContext({ refresh: true });
      if (!context.authenticated) {
        location.replace('../index.html#/login');
        return;
      }
      if (!context.isAdmin) {
        location.replace('../index.html');
        return;
      }
      if (!(await M360Data.schemaAvailable({ refresh: true }))) {
        queueCount.textContent = '0';
        queue.innerHTML = '<div class="empty-state">The M360 durable-data migration has not been applied yet. No technical-course data was changed.</div>';
        showNotice('Apply the reviewed M360 migration through the normal Supabase change process before using the reviewer queue.', 'error');
        return;
      }
      const rows = await M360Data.loadSubmittedForReview();
      renderQueue(rows);
    } catch (error) {
      console.error('M360 review queue failed', error);
      queueCount.textContent = '—';
      queue.innerHTML = '<div class="empty-state">Unable to load the M360 review queue.</div>';
      showNotice(error.message || 'Unable to load M360 review data.', 'error');
    }
  }

  refreshButton.addEventListener('click', loadQueue);
  loadQueue();
})();
