// Standard Incident / Case Record — the one ticket every SOC module's graded
// Prove It submission is written on. Module 01's NST-2407 case console is the
// reference (docs/specs/MODULE_STANDARD.md §7.2); this file is that renderer lifted out
// so every module produces the same ticket: CASE id + Status, Severity,
// Affected User, Affected Device, Disposition, Escalation required (+ Route to
// Department when required), module findings, Analyst Work Notes, Save /
// Submit Case, and the requirements panel under it.
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

function caseRecordSeverity(state) { return state.severity || state.priority || ''; }
function caseRecordDisposition(state) { return state.disposition || state.verdict || ''; }

function caseRecordSelect(name, label, value, options, disabled, isCorrect = false) {
  return `<label class="m01-ticket-field"><span>${esc(label)}</span><select class="${isCorrect ? 'is-correct' : ''}" name="${esc(name)}" ${disabled ? 'disabled' : ''}>
    <option value="">Select…</option>${options.map((option) => `<option value="${esc(option.id)}" ${value === option.id ? 'selected' : ''}>${esc(option.text)}</option>`).join('')}
  </select></label>`;
}

// spec:
//   caseId            — e.g. 'NST-2407'
//   userOptions       — [{ id, text }] roster for Affected User
//   deviceOptions     — [{ id, text }] roster for Affected Device
//   dispositionOptions, departmentOptions — optional overrides
//   findings          — module-specific selects rendered in the ticket grid:
//                       [{ name, label, options: [{ id, text }] }]
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

  return `<div class="m01-ticket-case"><strong>CASE ${esc(spec.caseId || '')}</strong>${caseRecordSelect('status', 'Status', state.status, CASE_RECORD_STATUS_OPTIONS, disabled, isCorrect('status', state.status))}</div>
    <div class="m01-ticket-grid">
      ${caseRecordSelect('severity', 'Severity', severity, CASE_RECORD_SEVERITY_OPTIONS, disabled, isCorrect('severity', severity))}
      ${entities}
      ${caseRecordSelect('disposition', 'Disposition', disposition, dispositionOptions, disabled, isCorrect('disposition', disposition))}
      ${caseRecordSelect('escalation', 'Escalation required', state.escalation, CASE_RECORD_ESCALATION_OPTIONS, disabled, isCorrect('escalation', state.escalation))}
      ${state.escalation === 'required' ? caseRecordSelect('escalateTo', 'Route to Department', state.escalateTo, departmentOptions, disabled, isCorrect('escalateTo', state.escalateTo)) : ''}
      ${(spec.findings || []).map((field) => caseRecordSelect(`finding:${field.name}`, field.label, findings[field.name], field.options, disabled)).join('')}
    </div>
    ${spec.findingsHtml || ''}
    <label class="m01-ticket-field m01-ticket-notes"><span>Analyst Work Notes</span><textarea name="notes" rows="6" placeholder="${esc(spec.notesPlaceholder || 'Record the evidence, your assessment, confirmed scope, and handoff needed by the next analyst.')}" ${disabled ? 'disabled' : ''}>${esc(state.notes || '')}</textarea></label>
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
  (spec.findings || []).forEach((field) => { if (!(state.findings || {})[field.name]) missing.push(field.missing || `Set ${field.label.toLowerCase()}`); });
  (spec.extraMissing || []).forEach((item) => missing.push(item));
  if ((state.notes || '').trim().length < (spec.notesMin || CASE_RECORD_NOTES_MIN)) missing.push('Write an analyst work note');
  return missing;
}

// Writes one ticket control's value into state. Returns true when the name
// belonged to the case record. `finding:<name>` selects land in
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
    return `<div class="m01-ticket-actions"><button type="button" class="m01-submit" disabled><i class="${graded ? 'ri-checkbox-circle-line' : 'ri-time-line'}" aria-hidden="true"></i> ${graded ? 'Lab Graded' : 'Lab Under Review'}</button></div>`;
  }
  return `<div class="m01-ticket-actions"><button type="button" class="m01-reset" ${spec.saveAttr}>Save</button><button type="button" class="m01-submit" ${spec.submitAttr} ${spec.hasMissing ? `aria-describedby="${esc(spec.panelId)}"` : ''}>Submit Case</button></div>`;
}

// spec: { panelId, missing, submitted, reviewStatus, redoRequested,
//         redoHtml, showMissing, lockedMessage }
function caseRecordPanel(spec) {
  const missing = spec.missing || [];
  const submitted = spec.submitted === true;
  const graded = spec.reviewStatus === 'graded';
  const flagMissing = !submitted && spec.showMissing && missing.length;
  const title = graded ? 'Lab graded' : submitted ? 'Submitted for faculty review' : flagMissing ? 'Not ready to submit yet' : spec.redoRequested ? 'Returned for remediation' : 'Case record';
  const body = graded ? 'Your instructor has reviewed this case.'
    : submitted ? (spec.lockedMessage || 'The next module stays locked until your instructor approves the submission.')
      : spec.redoRequested ? 'Review your instructor feedback, then work the case again and resubmit.'
        : 'Work the case above — review the evidence, complete every ticket field, and write your analyst notes — then submit for faculty review.';
  return `<div class="m01-score-empty${flagMissing ? ' is-missing' : ''}" id="${esc(spec.panelId)}" role="status" aria-live="polite" tabindex="-1">
    <strong>${title}</strong>
    <p>${body}</p>
    ${!submitted ? (spec.redoHtml || '') : ''}
    ${!submitted && missing.length ? `<ul class="m01-requirements-list">${missing.map((item) => `<li><i class="ri-checkbox-blank-circle-line" aria-hidden="true"></i><span>${esc(item)}</span></li>`).join('')}</ul>` : ''}
    ${!submitted ? `<p class="m01-help">${missing.length ? `Complete the items above, then press Submit Case. Analyst work notes need at least ${CASE_RECORD_NOTES_MIN} characters.` : 'Your case record is ready. Use Submit Case in the ticket to send it for faculty review.'}</p>` : ''}
  </div>`;
}

// The whole "Incident / Case Record" pane: title, form, actions, panel.
// spec = caseRecordFields spec + caseRecordActions spec + caseRecordPanel
// spec + formId.
function caseRecordPane(state, spec) {
  const missing = spec.missing || caseRecordMissing(state, spec);
  return `<section class="m01-console-pane m01-console-ticket" aria-label="Incident / case record">
    <p class="m01-console-pane-title">Incident / Case Record</p>
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
    `CASE ${spec.caseId || ''}`,
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
