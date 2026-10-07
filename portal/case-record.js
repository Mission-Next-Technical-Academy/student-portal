// Standard ITSM Incident Ticket — the one ticket every SOC module's graded
// Prove It submission is written on. Module 01's Prove It case console is the
// reference (docs/specs/MODULE_STANDARD.md §7.2); this file is that renderer lifted out
// so every module produces the same ticket: Incident id + Status, Severity,
// Affected User, Affected Device, Disposition, Escalation required (+ Route to
// Department when required), module findings, Analyst Work Notes, Save /
// Submit Lab, and the requirements panel under it.
//
// Markup keeps the canonical `.m01-ticket-*` / `.m01-score-empty` classes in
// portal/module-labs.css. Modules must not restyle them.
//
// State shape (one object per case, saved by the module):
//   { status, severity, affectedUser, affectedDevice, disposition,
//     escalation, escalateTo, notes, findings: { [name]: value },
//     submitted, actionHistory: [] }
// Module 01 predates the standard and stores severity/disposition as
// priority/verdict too; the helpers read and write both spellings.

const CASE_RECORD_NOTES_MIN = 80;

const CASE_RECORD_STATUS_OPTIONS = [
  { id: 'in-progress', text: 'In Progress' },
  { id: 'pending', text: 'Pending' },
  { id: 'resolved', text: 'Resolved' },
];

const CASE_RECORD_SEVERITY_OPTIONS = [
  { id: 'critical', text: 'Critical' },
  { id: 'high', text: 'High' },
  { id: 'medium', text: 'Medium' },
  { id: 'low', text: 'Low' },
];

const CASE_RECORD_ESCALATION_OPTIONS = [
  { id: 'required', text: 'Required' },
  { id: 'not-required', text: 'Not required' },
];

// Standard disposition set. Modules pass their own list only to add a
// domain-specific outcome; ids below always render with these labels.
const CASE_RECORD_DISPOSITION_OPTIONS = [
  { id: 'true-positive', text: 'Confirmed malicious activity' },
  { id: 'false-positive', text: 'False positive' },
  { id: 'false-negative', text: 'False Negative — real malicious activity occurred that this alert did not fully capture.' },
  { id: 'true-negative', text: 'True Negative — reviewed activity is normal; there is no supported security concern here.' },
];

const CASE_RECORD_DISPOSITION_LABELS = {
  'true-positive': 'Confirmed malicious activity',
  'benign-positive': 'Benign activity',
  'false-positive': 'False positive',
  'enterprise-breach': 'Enterprise-wide incident',
};

const CASE_RECORD_DEFAULT_DEPARTMENTS = [
  { id: 'tier2-soc', text: 'Tier 2 SOC' },
  { id: 'identity-response', text: 'Identity Response' },
];

// Linked incident ids for a case spec, always an array.
function caseRecordIncidentIds(spec = {}) {
  return (Array.isArray(spec.incidentIds) ? spec.incidentIds : [spec.incidentIds]).filter(Boolean);
}

// Scenario brief label (MODULE_STANDARD.md §7.2.1):
// 'CASE-044424 · INC-044733 · NORMAL SHIFT · ASSIGNED TO YOU'. Returns
// escaped text for the `.m03e-label` line.
function caseRecordBriefLabel(spec, tag) {
  return esc([spec.caseId, ...caseRecordIncidentIds(spec), tag, 'ASSIGNED TO YOU'].filter(Boolean).join(' · '));
}

function caseRecordSeverity(state) { return state.severity || state.priority || ''; }
function caseRecordDisposition(state) { return state.disposition || state.verdict || ''; }

function caseRecordSelect(name, label, value, options, disabled, isCorrect = false) {
  return `<label class="m01-ticket-field"><span>${esc(label)}</span><select class="${isCorrect ? 'is-correct' : ''}" name="${esc(name)}" ${disabled ? 'disabled' : ''}>
    <option value="">Select…</option>${options.map((option) => `<option value="${esc(option.id)}" ${value === option.id ? 'selected' : ''}>${esc(option.text)}</option>`).join('')}
  </select></label>`;
}

// spec:
//   caseId            — e.g. 'CASE-012407' (MODULE_STANDARD.md §7.2.1)
//   incidentIds       — linked incidents, e.g. ['INC-012716']; omit for a
//                       hunt that has not raised one
//   ticketType        — queue / domain line under the id
//   userOptions       — [{ id, text }] roster for Affected User
//   deviceOptions     — [{ id, text }] roster for Affected Device
//   dispositionOptions, departmentOptions — optional overrides
//   findings          — module-specific selects rendered in the ticket grid:
//                       [{ name, label, options: [{ id, text }] }]
//                       or { name, label, type: 'textarea', minLength, rows }
//   findingsHtml      — optional extra markup (checkbox groups etc.) rendered
//                       under the grid, above the work notes
//   notesPlaceholder  — optional
//   disabled          — true once submitted
//   entityButtons     — Module 01 Practice It only: pick entities from the
//                       log instead of a roster select
//   correct           — Practice It only: { field: id } highlights a correct
//                       choice green. Prove It never passes this.
function caseRecordFields(state, spec) {
  const disabled = spec.disabled === true;
  const correct = spec.correct || null;
  const isCorrect = (name, value) => Boolean(correct && correct[name] && value === correct[name]);
  const severity = caseRecordSeverity(state);
  const disposition = caseRecordDisposition(state);
  const findings = state.findings || {};
  const dispositionOptions = (spec.dispositionOptions || CASE_RECORD_DISPOSITION_OPTIONS).map((option) => ({
    id: option.id,
    text: CASE_RECORD_DISPOSITION_LABELS[option.id] || option.text,
  }));
  const userOptions = spec.userOptions || [];
  const deviceOptions = spec.deviceOptions || [];
  const departmentOptions = spec.departmentOptions || CASE_RECORD_DEFAULT_DEPARTMENTS;
  const entities = spec.entityButtons
    ? `<label class="m01-ticket-field"><span>Affected User</span><button type="button" class="m01-entity-control ${isCorrect('affectedUser', state.affectedUser) ? 'is-correct' : ''}" data-m01-entity="user" ${disabled ? 'disabled' : ''}>${esc(state.affectedUser || 'Add user')} <i class="ri-add-line" aria-hidden="true"></i></button></label><label class="m01-ticket-field"><span>Affected Device</span><button type="button" class="m01-entity-control ${isCorrect('affectedDevice', state.affectedDevice) ? 'is-correct' : ''}" data-m01-entity="device" ${disabled ? 'disabled' : ''}>${esc(state.affectedDevice || 'Add device')} <i class="ri-add-line" aria-hidden="true"></i></button></label>`
    : `${caseRecordSelect('affectedUser', 'Affected User', state.affectedUser, userOptions, disabled)}${caseRecordSelect('affectedDevice', 'Affected Device', state.affectedDevice, deviceOptions, disabled)}`;

  const ticketType = spec.ticketType || 'Security incident';
  const incidents = caseRecordIncidentIds(spec);
  return `<div class="m01-ticket-case"><div class="m01-ticket-id"><span>ITSM Incident Ticket</span><strong>${esc(spec.caseId || '')}</strong><small>${esc(ticketType)}</small>${incidents.length ? `<small>Linked ${incidents.length === 1 ? 'incident' : 'incidents'}: ${esc(incidents.join(', '))}</small>` : ''}</div>${caseRecordSelect('status', 'Status', state.status, CASE_RECORD_STATUS_OPTIONS, disabled, isCorrect('status', state.status))}</div>
    <div class="m01-ticket-grid">
      ${caseRecordSelect('severity', 'Severity', severity, CASE_RECORD_SEVERITY_OPTIONS, disabled, isCorrect('severity', severity))}
      ${entities}
      ${caseRecordSelect('disposition', 'Disposition', disposition, dispositionOptions, disabled, isCorrect('disposition', disposition))}
      ${caseRecordSelect('escalation', 'Escalation required', state.escalation, CASE_RECORD_ESCALATION_OPTIONS, disabled, isCorrect('escalation', state.escalation))}
      ${state.escalation === 'required' ? caseRecordSelect('escalateTo', 'Route to Department', state.escalateTo, departmentOptions, disabled, isCorrect('escalateTo', state.escalateTo)) : ''}
      ${(spec.findings || []).filter((field) => field.type !== 'textarea').map((field) => caseRecordSelect(`finding:${field.name}`, field.label, findings[field.name], field.options, disabled)).join('')}
    </div>
    ${(spec.findings || []).filter((field) => field.type === 'textarea').map((field) => `<label class="m01-ticket-field m01-ticket-notes"><span>${esc(field.label)}${field.minLength ? ` · at least ${field.minLength} characters` : ''}</span><textarea name="finding:${esc(field.name)}" rows="${field.rows || 4}" minlength="${field.minLength || 1}" maxlength="${field.maxLength || 5000}" ${disabled ? 'disabled' : ''}>${esc(findings[field.name] || '')}</textarea></label>`).join('')}
    ${spec.findingsHtml || ''}
    <label class="m01-ticket-field m01-ticket-notes"><span>Analyst Work Notes</span><textarea name="notes" rows="6" ${spec.notesMax ? `maxlength="${spec.notesMax}"` : ''} placeholder="${esc(spec.notesPlaceholder || 'Record the evidence, your assessment, confirmed scope, and handoff needed by the next analyst.')}" ${disabled ? 'disabled' : ''}>${esc(state.notes || '')}</textarea></label>
    ${state.actionHistory?.length ? `<details class="m01-action-history"><summary>Action history (${state.actionHistory.length})</summary><ul>${state.actionHistory.slice(-8).reverse().map((entry) => `<li>${esc(entry.action)}</li>`).join('')}</ul></details>` : ''}`;
}

// Standard requirement list, in the reference order. `spec.evidenceTotal` /
// `spec.evidenceReviewed` gate "Review every piece of evidence" (omit both
// when the module's evidence lives in an imported lab); `spec.extraMissing`
// appends module-specific items before the work-note line.
function caseRecordMissing(state, spec = {}) {
  const missing = [];
  if (Number.isFinite(spec.evidenceTotal) && (spec.evidenceReviewed || 0) < spec.evidenceTotal) missing.push('Review every piece of evidence');
  if (!state.status) missing.push('Set the status');
  if (!state.affectedUser || !state.affectedDevice) missing.push('Add the affected user and device');
  if (!caseRecordSeverity(state)) missing.push('Set the severity');
  if (!caseRecordDisposition(state)) missing.push('Record a disposition');
  if (!state.escalation) missing.push('Set whether escalation is required');
  if (state.escalation === 'required') {
    const departments = spec.departmentOptions || CASE_RECORD_DEFAULT_DEPARTMENTS;
    if (!departments.some((option) => option.id === state.escalateTo)) missing.push('Route the case to a department');
  }
  (spec.findings || []).forEach((field) => {
    const value = (state.findings || {})[field.name];
    if (!value || (field.type === 'textarea' && String(value).trim().length < (field.minLength || 1))) missing.push(field.missing || `Record ${field.label.toLowerCase()}${field.minLength ? ` (${field.minLength} characters minimum)` : ''}`);
  });
  (spec.extraMissing || []).forEach((item) => missing.push(item));
  if ((state.notes || '').trim().length < (spec.notesMin || CASE_RECORD_NOTES_MIN)) missing.push('Write an analyst work note');
  return missing;
}

// Writes one ticket control's value into state. Returns true when the name
// belonged to the ITSM ticket. `finding:<name>` selects land in
// state.findings.
function caseRecordApply(state, name, value) {
  if (name.startsWith('finding:')) {
    state.findings = { ...(state.findings || {}), [name.slice(8)]: value };
    return true;
  }
  if (name === 'severity') { state.severity = value; state.priority = value; return true; }
  if (name === 'disposition') { state.disposition = value; state.verdict = value; return true; }
  if (['status', 'affectedUser', 'affectedDevice', 'escalation', 'escalateTo', 'notes'].includes(name)) {
    state[name] = value;
    if (name === 'escalation' && value !== 'required') state.escalateTo = '';
    return true;
  }
  return false;
}

// spec: { submitted, reviewStatus: 'graded'|'under-review'|..., saveAttr,
//         submitAttr, panelId, hasMissing }
function caseRecordActions(spec) {
  if (spec.submitted) {
    const graded = spec.reviewStatus === 'graded';
    return `<div class="m01-ticket-actions"><button type="button" class="m01-submit" disabled><i class="${graded ? 'ri-checkbox-circle-line' : 'ri-time-line'}" aria-hidden="true"></i> ${spec.practiceSubmitted ? 'Practice submitted' : graded ? 'Lab graded' : 'Submitted for faculty review'}</button></div>`;
  }
  return `<div class="m01-ticket-actions"><button type="button" class="m01-reset" ${spec.saveAttr}>Update Ticket</button><button type="button" class="m01-submit" ${spec.submitAttr} ${spec.hasMissing ? `aria-describedby="${esc(spec.panelId)}"` : ''}>Submit Lab</button></div>`;
}

// Practice It (Guided Lab) tickets are autograded the moment the learner
// submits. `items` is [[label, met], …] from the module's own checks. Only a
// passing score marks the practice submitted, so the Prove It gate still
// waits for real practice.
const PRACTICE_PASS_PERCENT = 70;

function practiceResult(items) {
  const met = items.filter(([, ok]) => ok).length;
  const score = items.length ? Math.round((met / items.length) * 100) : 0;
  return { score, passed: score >= PRACTICE_PASS_PERCENT, items: items.map(([label, ok]) => ({ label, met: Boolean(ok) })), at: new Date().toISOString() };
}

function practiceResultHtml(result) {
  if (!result || !Array.isArray(result.items)) return '';
  return `<div class="practice-score ${result.passed ? 'is-pass' : 'is-fail'}"><span class="practice-score-value">${esc(result.score)}%</span><span class="practice-score-label">${result.passed ? 'Pass' : 'Not passed'} · ${PRACTICE_PASS_PERCENT}% needed</span></div>
    <ul class="m01-requirements-list">${result.items.map((item) => `<li class="${item.met ? 'is-done' : ''}"><i class="${item.met ? 'ri-checkbox-circle-fill' : 'ri-close-circle-line'}" aria-hidden="true"></i><span>${esc(item.label)}</span></li>`).join('')}</ul>`;
}

// Notes an instructor left while approving this module's Prove It, deduped
// because one approval writes the same items to every attempt row it covers.
function caseRecordGradedFeedback() {
  const context = typeof activeModuleRenderContext === 'function' ? activeModuleRenderContext() : null;
  const byLab = context?.user?.reviewedLabFeedbackByLabKey || {};
  const moduleKey = context?.def?.moduleKey;
  if (!moduleKey || typeof LABS === 'undefined') return [];
  const seen = new Set();
  return LABS.filter((lab) => lab.module === moduleKey || String(lab.module).startsWith(`${moduleKey}-`))
    .flatMap((lab) => byLab[lab.key] || [])
    .filter((item) => { const key = `${item.item_label}\u0000${item.comment}`; if (seen.has(key)) return false; seen.add(key); return true; });
}

function caseRecordGradedFeedbackHtml(notes = caseRecordGradedFeedback()) {
  return notes.length ? `<div class="m01-graded-feedback" role="note"><strong><i class="ri-feedback-line" aria-hidden="true"></i> Instructor feedback</strong><ul>${notes.map((item) => `<li>${item.item_label ? `<strong>${esc(item.item_label)}:</strong> ` : ''}${esc(item.comment || '')}</li>`).join('')}</ul></div>` : '';
}

// spec: { panelId, missing, submitted, reviewStatus, redoRequested,
//         redoHtml, showMissing, lockedMessage, practiceSubmitted,
//         practiceScored, practiceResult }
function caseRecordPanel(spec) {
  const missing = spec.missing || [];
  const submitted = spec.submitted === true;
  const graded = spec.reviewStatus === 'graded';
  const practice = spec.practiceSubmitted === true;
  const result = practice ? spec.practiceResult : null;
  const failedPractice = !submitted && result && !result.passed;
  const flagMissing = !submitted && spec.showMissing && missing.length;
  const title = practice && submitted ? (result ? 'Practice passed' : 'Practice submitted') : graded ? 'Lab graded' : submitted ? 'Submitted for faculty review' : flagMissing ? 'Not ready to submit yet' : failedPractice ? 'Practice not passed yet' : spec.redoRequested ? 'Returned for remediation' : 'Incident ticket';
  const body = graded ? 'Your instructor has reviewed this case.'
    : submitted ? (practice ? (result ? 'Your practice score is recorded. Prove It · Assessment Lab is now open.' : 'Your ungraded practice ticket is recorded.') : spec.lockedMessage || 'The next module stays locked until your instructor approves the submission.')
      : failedPractice ? 'Finish the items marked below, update the ticket, and submit again. A passing practice score opens Prove It.'
        : spec.redoRequested ? 'Review your instructor feedback, then work the case again and resubmit.'
          : practice ? `Use the console evidence to complete the incident ticket. ${spec.practiceScored ? `Submit Lab scores your practice instantly; ${PRACTICE_PASS_PERCENT}% opens Prove It.` : 'Submit Lab completes this Guided Lab and opens Prove It.'}`
            : 'Use the console evidence to complete the incident ticket. Submit only after the ticket fields, notes, and handoff are ready for faculty review.';
  return `<div class="m01-score-empty${flagMissing || failedPractice ? ' is-missing' : ''}" id="${esc(spec.panelId)}" role="status" aria-live="polite" tabindex="-1">
    <strong>${title}</strong>
    <p>${body}</p>
    ${result && !flagMissing ? practiceResultHtml(result) : ''}
    ${graded ? caseRecordGradedFeedbackHtml(spec.gradedFeedback || caseRecordGradedFeedback()) : ''}
    ${!submitted ? (spec.redoHtml || '') : ''}
    ${!submitted && missing.length ? `<ul class="m01-requirements-list">${missing.map((item) => `<li><i class="ri-checkbox-blank-circle-line" aria-hidden="true"></i><span>${esc(item)}</span></li>`).join('')}</ul>` : ''}
    ${!submitted ? `<p class="m01-help">${missing.length ? `Complete the items above, then press Submit Lab. Analyst work notes need at least ${spec.notesMin || CASE_RECORD_NOTES_MIN} characters.` : practice ? `Your ITSM ticket is ready. ${spec.practiceScored ? 'Submit Lab scores your practice now.' : 'Submit Lab completes this Guided Lab.'}` : 'Your ITSM ticket is ready. Use Submit Lab to send it for faculty review.'}</p>` : ''}
  </div>`;
}

// The whole "ITSM Incident Ticket" pane: title, form, actions, panel.
// spec = caseRecordFields spec + caseRecordActions spec + caseRecordPanel
// spec + formId.
function caseRecordPane(state, spec) {
  const missing = spec.missing || caseRecordMissing(state, spec);
  return `<section class="m01-console-pane m01-console-ticket" aria-label="ITSM incident ticket">
    <p class="m01-console-pane-title">ITSM Incident Ticket</p>
    <form id="${esc(spec.formId)}" class="m01-ticket-form" novalidate>${caseRecordFields(state, { ...spec, disabled: spec.disabled ?? state.submitted === true })}
      ${caseRecordActions({ ...spec, submitted: state.submitted === true, hasMissing: missing.length > 0 })}
    </form>
    ${caseRecordPanel({ ...spec, missing, submitted: state.submitted === true })}
  </section>`;
}

// Label/value rows exactly as the student saw them — stored in the
// lab_attempts payload as `result.case_display` so the instructor Grading
// view (app.js adminCaseTicketSubmissionPanel) can show any module's ticket,
// including its findings and department names, without knowing its option ids.
function caseRecordDisplay(state, spec = {}) {
  const label = (options, id) => (options || []).find((option) => option.id === id)?.text || id || 'Not provided';
  const dispositions = (spec.dispositionOptions || CASE_RECORD_DISPOSITION_OPTIONS).map((option) => ({ id: option.id, text: CASE_RECORD_DISPOSITION_LABELS[option.id] || option.text }));
  return [
    ['Case', spec.caseId || 'Not provided'],
    ...(caseRecordIncidentIds(spec).length ? [['Linked incidents', caseRecordIncidentIds(spec).join(', ')]] : []),
    ['Status', label(CASE_RECORD_STATUS_OPTIONS, state.status)],
    ['Severity', label(CASE_RECORD_SEVERITY_OPTIONS, caseRecordSeverity(state))],
    ['Affected user', state.affectedUser || 'Not provided'],
    ['Affected device', state.affectedDevice || 'Not provided'],
    ['Disposition', label(dispositions, caseRecordDisposition(state))],
    ['Escalation required', label(CASE_RECORD_ESCALATION_OPTIONS, state.escalation)],
    ['Route to department', state.escalation === 'required' ? label(spec.departmentOptions || CASE_RECORD_DEFAULT_DEPARTMENTS, state.escalateTo) : 'Not applicable'],
    ...(spec.findings || []).map((field) => [field.label, label(field.options, (state.findings || {})[field.name])]),
  ];
}

// Plain-text copy of the ticket for the instructor grading view / lab_attempts
// payload, so every module submits the same readable record.
function caseRecordSummary(state, spec = {}) {
  const label = (options, id) => (options || []).find((option) => option.id === id)?.text || id || '—';
  const lines = [
    `${/^CASE-/.test(spec.caseId || '') ? '' : 'CASE '}${spec.caseId || ''}`,
    ...(caseRecordIncidentIds(spec).length ? [`Linked incidents: ${caseRecordIncidentIds(spec).join(', ')}`] : []),
    `Status: ${label(CASE_RECORD_STATUS_OPTIONS, state.status)}`,
    `Severity: ${label(CASE_RECORD_SEVERITY_OPTIONS, caseRecordSeverity(state))}`,
    `Affected User: ${state.affectedUser || '—'}`,
    `Affected Device: ${state.affectedDevice || '—'}`,
    `Disposition: ${label(spec.dispositionOptions || CASE_RECORD_DISPOSITION_OPTIONS, caseRecordDisposition(state))}`,
    `Escalation: ${label(CASE_RECORD_ESCALATION_OPTIONS, state.escalation)}${state.escalation === 'required' ? ` → ${label(spec.departmentOptions || CASE_RECORD_DEFAULT_DEPARTMENTS, state.escalateTo)}` : ''}`,
    ...(spec.findings || []).map((field) => `${field.label}: ${label(field.options, (state.findings || {})[field.name])}`),
    '',
    'Analyst Work Notes:',
    (state.notes || '').trim(),
  ];
  return lines.join('\n');
}
