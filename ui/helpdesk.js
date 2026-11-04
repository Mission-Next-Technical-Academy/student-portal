/* Mission Next IT Help Desk workload.
 * Loaded after app.js so it can register against the simulator's existing
 * router and chrome without changing the student-portal architecture. */

PORTALS.push({ id:'helpdesk', name:'IT Service Desk', tag:'Enterprise support · tickets, endpoints, directory, servers', color:'#1f6f78', initial:'IT' });
CLOUD_NAV.push({ label:'IT Service Desk', icon:'🎧' });
NAV.helpdesk = [
  { route:'#/helpdesk/dashboard', label:'Help Desk Dashboard', icon:'▦' },
  { route:'#/helpdesk/tickets', label:'Ticket Queue', icon:'🎫' },
  { section:'People & access' },
  { route:'#/helpdesk/directory', label:'User Directory', icon:'👥' },
  { route:'#/helpdesk/active-directory', label:'Active Directory', icon:'🗂' },
  { section:'Endpoints & remote support' },
  { route:'#/helpdesk/windows', label:'Windows Desktop', icon:'🪟' },
  { route:'#/helpdesk/event-viewer', label:'Event Viewer', icon:'📋' },
  { route:'#/helpdesk/powershell', label:'PowerShell', icon:'>_' },
  { route:'#/helpdesk/remote-support', label:'Remote Support', icon:'🖥' },
  { route:'#/helpdesk/endpoint-security', label:'Endpoint Security', icon:'🛡' },
  { section:'Enterprise infrastructure' },
  { route:'#/helpdesk/server-manager', label:'Server Manager', icon:'🗄' },
  { route:'#/helpdesk/dns', label:'DNS', icon:'🌐' },
  { route:'#/helpdesk/dhcp', label:'DHCP', icon:'📡' },
  { route:'#/helpdesk/group-policy', label:'Group Policy', icon:'📜' },
  { route:'#/helpdesk/file-server', label:'File Server', icon:'📁' },
  { route:'#/helpdesk/printers', label:'Printer Management', icon:'🖨' },
  { section:'Knowledge & shift tools' },
  { route:'#/helpdesk/knowledge-base', label:'Knowledge Base', icon:'📚' },
  { route:'#/helpdesk/environment', label:'Enterprise Map', icon:'🧭' },
];
PORTAL_CONTEXT.helpdesk = 'admin';
CLOUD_HIGHLIGHT.helpdesk = 'IT Service Desk';
CLOUD_APP_ROUTE['IT Service Desk'] = '#/helpdesk/dashboard';

const HD_STATE_KEY = 'defender-lab.helpdesk.state.v1';
const HD_SHIFT_NOW = new Date('2026-08-17T13:00:00Z');
const HD_STATUSES = ['New', 'Assigned', 'In Progress', 'Pending User', 'Pending Vendor', 'Escalated', 'Resolved', 'Closed'];
const HD_STATUS_NEXT = {
  'New':['Assigned'],
  'Assigned':['In Progress','Escalated'],
  'In Progress':['Pending User','Pending Vendor','Escalated','Resolved'],
  'Pending User':['In Progress','Resolved'],
  'Pending Vendor':['In Progress','Escalated','Resolved'],
  'Escalated':['In Progress','Resolved'],
  'Resolved':['Closed','In Progress'],
  'Closed':[],
};
const HD_DIAGNOSIS_OVERRIDES = {
  'HD-2108':'GPO scope',
  'HD-2109':'Corrupt profile mapping',
  'HD-2118':'NTFS permission',
  'SEC-2115':'Malicious extension',
};

// Prove It: ?prove=<module key> opens that module's Prove shift
// (HD_PROVE_SHIFTS) in its own saved state, one per student (the portal's
// anonymous id in student=). No coach (ui/coach.js stays off), no hints and no
// answer feedback before Submit. A launch with no student id is `blocked`: it
// opens no ticket and saves nothing, so two students on one browser can never
// share an attempt.
const HD_PROVE = (() => {
  if (typeof HD_PROVE_SHIFTS === 'undefined') return null;
  const params = new URLSearchParams(location.search);
  const moduleKey = params.get('prove');
  if (!moduleKey || !Object.prototype.hasOwnProperty.call(HD_PROVE_SHIFTS, moduleKey)) return null;
  const student = (params.get('student') || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
  return { moduleKey, student, shift: HD_PROVE_SHIFTS[moduleKey], blocked: !student };
})();
function hdStateKey() {
  return HD_PROVE ? `defender-lab.helpdesk.prove.v1.${HD_PROVE.moduleKey}.${HD_PROVE.student}` : HD_STATE_KEY;
}
function hdProveBlockedNotice() {
  return HD_PROVE && HD_PROVE.blocked
    ? '<div class="callout warning" role="alert"><strong>This Prove It wasn\'t opened from your course page, so it can\'t be saved.</strong> Open it from your course page.</div>'
    : '';
}

function hdClone(value) { return JSON.parse(JSON.stringify(value)); }
function hdSeededOrder(items, seed) {
  let n = seed || 8172026;
  return items.map(item => {
    n = (n * 1664525 + 1013904223) >>> 0;
    return { item, sort:n / 4294967296 };
  }).sort((a, b) => a.sort - b.sort).map(row => row.item);
}
/* ---------- Practice scenario: HD-2101, Jordan Bell's repeating lockout ----------
 * Module 1 Practice It. The ticket shows only what Jordan reported; the
 * evidence is on the tool screens and in the shell, and this state is what
 * they read and change: jbell's lockout, the 4740 events on NS-DC01 and
 * NS-LT-0117's scheduled task (hdState.machines, the same pattern a Prove
 * shift uses). FinanceReportSync runs every 2 minutes on the shift clock
 * (real minutes since the scenario started). While it holds Jordan's old
 * password, a run against an unlocked account locks it again and logs a new
 * 4740. Practice only: a Prove shift has no scenarios, so none of this reaches
 * it. Every typed command and key action is recorded in hdState.practiceLog,
 * in the event shape Prove It uses ({ type:'command_run', at, command,
 * computer }), plus a short `result`. */
const HD_M01 = 'HD-2101';
const HD_M01_RESULTS = {
  '0x0': 'The operation completed successfully',
  '0x8007052E': 'The user name or password is incorrect',
  '0x80070775': 'The referenced account is currently locked out',
};
const HD_M01_TIP = 'Practice tip: a task like this should really run under a service account, not a person\'s account, so a password change can\'t break it. Moving it to one is a Tier 2 change: note it in the ticket as a follow-up.';
const HD_M01_IDENTITY = [
  { id:'password', text:'Ask Jordan to tell you their current password so you can check it matches' },
  { id:'name', text:'Accept it: the caller gives Jordan\'s name, department and the number they\'re calling from' },
  { id:'callback', text:'Call Jordan back on the number in the User Directory, then confirm a detail from the directory record, such as Jordan\'s manager' },
];
// Outcome order: also the order hints and the resolve check name them.
const HD_M01_OUTCOMES = [
  ['identityVerified', 'Verified the caller (KB-0024)', 'Verify the caller first (KB-0024).',
    ['KB-0024 says how to verify a caller before any account action.', 'Answer “Verify the caller” on this ticket with the callback method KB-0024 describes.']],
  ['sourceFound', 'Found which computer is locking the account', 'You haven\'t found which computer is locking the account yet.',
    ['Something keeps locking the account. Domain controllers log which computer caused each lockout.', 'Event Viewer: filter Event ID 4740 for jbell and read the caller computer. Or open jbell in Active Directory and check Lockout details.']],
  ['taskInspected', 'Found the cause on that computer', 'You haven\'t found what on the caller computer is using the old password.',
    ['What on that computer could still be using Jordan\'s old password on a schedule?', 'PowerShell: Enter-PSSession <caller computer>, then Get-ScheduledTask. Check which account each task runs as.']],
  ['credentialFixed', 'Fixed the cause the approved way (KB-0024)', 'The stored credential still has the old password, so the account will lock again.',
    ['KB-0024 describes the approved way to update a stored credential.', 'Set-ScheduledTask -TaskName <task> -User NORTHSTAR\\jbell opens a secure prompt where Jordan types the password.']],
  ['unlockedAfterFix', 'Unlocked the account once, after the fix', 'Jordan\'s account is still locked.',
    ['With the stored credential current, unlock the account once.', 'Unlock jbell in Active Directory, or run Unlock-ADAccount jbell.']],
  ['verified', 'Confirmed the account stays unlocked (no new 4740)', 'Confirm the account stays unlocked after the task\'s next run (no new 4740) before you close the ticket.',
    ['Make sure it stays unlocked after the task runs again.', 'Wait for the next run or use Start-ScheduledTask, then check Event Viewer (4740 for jbell), Lockout details or Get-ADUser jbell -Properties LockedOut.']],
  ['noteComplete', 'Work note: Reported / Tried / Result', 'Add a work note with three parts: Reported, Tried and Result.',
    ['Write a work note in three parts: Reported, Tried, Result.', 'Start lines with “Reported:”, “Tried:” and “Result:” and write what each was.']],
];
function hdNowMs() { return Date.now(); }
function hdClockSeconds(text) { const [h, m, s] = String(text).split(':').map(Number); return h * 3600 + m * 60 + (s || 0); }
function hdClockText(seconds) {
  const total = ((Math.floor(seconds) % 86400) + 86400) % 86400;
  const pad = n => String(n).padStart(2, '0');
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}`;
}
function hdNewPracticeScenario(now) {
  const spec = HD_PRACTICE_SCENARIOS[HD_M01];
  return {
    ticketId:HD_M01, startedAt:now, nextRunAt:now + spec.runEveryMinutes * 60000,
    events:hdClone(spec.events), locked:true, lockedAt:'08:11:18', lockoutsToday:2, badPasswordCount:spec.badPasswordCount,
    identity:'', identityTries:[], sourceFoundVia:[], taskInspected:false,
    fixedAt:'', fixedAtMs:0, fixedBy:'', unlocks:[], relocks:0, cleanRunAtMs:0, verifiedAt:'', verifiedBy:'',
    passwordTyped:false, hints:{}, hintsUsed:0, lockoutDetailsOpen:false,
  };
}
// A Practice shift's machines, scenario and log. Also fills them into a
// Practice save from before they existed.
function hdEnsurePractice(state, now = hdNowMs()) {
  if (!state || state.mode === 'prove' || typeof HD_PRACTICE_SCENARIOS === 'undefined') return state;
  if (!state.machines) state.machines = hdClone(HD_PRACTICE_MACHINES);
  if (!state.scenarios) state.scenarios = { [HD_M01]:hdNewPracticeScenario(now) };
  if (!Array.isArray(state.practiceLog)) state.practiceLog = [];
  if (!state.eventFilter) state.eventFilter = { id:'', text:'' };
  state.computerOverrides = state.computerOverrides || {};
  // The device list mustn't name the lockout source.
  state.computerOverrides[HD_PRACTICE_SCENARIOS[HD_M01].computer] = { ...(state.computerOverrides[HD_PRACTICE_SCENARIOS[HD_M01].computer] || {}), health:'Healthy' };
  state.userOverrides = state.userOverrides || {};
  const scenario = state.scenarios[HD_M01];
  if (scenario) state.userOverrides[HD_PRACTICE_SCENARIOS[HD_M01].userId] = { ...(state.userOverrides[HD_PRACTICE_SCENARIOS[HD_M01].userId] || {}), locked:scenario.locked };
  return state;
}

// Practice shifts are built from HD_TICKET_TEMPLATES only; a Prove shift
// passes its own tickets (hdFreshProveState).
function hdFreshState(templates = HD_TICKET_TEMPLATES) {
  const seed = Math.floor(Math.random() * 0x7fffffff) || 8172026;
  const independent = templates.filter(t => !t.correlationKey);
  const correlated = templates.filter(t => t.correlationKey);
  const tickets = hdSeededOrder([...independent, ...correlated], seed).map((ticket, index) => ({
    ...hdClone(ticket),
    createdTimestamp: new Date(HD_SHIFT_NOW.getTime() - (ticket.createdMinutesAgo + (index % 4)) * 60000).toISOString(),
    troubleshootingHistory: [{ time:'Created', action:'Ticket received from monitoring, portal, phone, or email intake.' }],
    diagnosis:'', diagnosisCorrect:false, linkedProblem:'', checkedSteps:[],
  }));
  const state = {
    version:1, seed, tickets, selectedTicketId:tickets[0].id,
    queueFilter:'Open', priorityFilter:'All', adTab:'users', selectedUserId:'u-1005',
    selectedComputer:'NS-LT-0131', selectedServer:'NS-PRINT01',
    userOverrides:{}, computerOverrides:{}, printerOverrides:{},
    powershell:[{ type:'system', text:'Northstar Enterprise Support Shell · training subset\nType Get-Help to list supported commands.' }],
  };
  // Only a Practice shift (the shared templates) gets the Practice scenarios.
  return templates === HD_TICKET_TEMPLATES ? hdEnsurePractice(state) : state;
}
// A fresh Prove shift: the Practice shift builder with the module's own
// tickets, fixtures and machine state. Ticket fields start empty (the student
// sets them) and the option lists are shuffled per attempt.
function hdFreshProveState() {
  const shift = HD_PROVE.shift;
  const state = hdFreshState(shift.tickets);
  const requester = HD_USERS.find(user => user.name === shift.tickets[0].requester);
  state.tickets.forEach(ticket => { ticket.priority = ''; ticket.category = ''; ticket.subcategory = ''; ticket.notes = []; });
  const ticket = state.tickets[0];
  return {
    ...state, mode:'prove', moduleKey:HD_PROVE.moduleKey, student:HD_PROVE.student,
    selectedComputer:shift.selectedComputer, selectedUserId:requester ? requester.id : state.selectedUserId,
    machines:hdClone(shift.machines || {}),
    prove:{
      startedAt:new Date().toISOString(),
      order:{
        diagnosis:hdSeededOrder(ticket.diagnosisOptions, state.seed),
        path:hdSeededOrder(ticket.pathPool.map(step => step.id), state.seed ^ 0x5bd1e995),
      },
      fields:{ category:'', type:'', priority:'' },
      diagnosis:'', steps:[], decision:'', resolutionNote:'', userReply:'',
      events:[], opened:[], passwordTyped:false,
    },
  };
}
function hdLoadState() {
  if (HD_PROVE && HD_PROVE.blocked) return { ...hdFreshProveState(), tickets:[], selectedTicketId:null };
  try {
    const saved = JSON.parse(localStorage.getItem(hdStateKey()) || 'null');
    const fits = HD_PROVE ? saved && saved.mode === 'prove' && saved.moduleKey === HD_PROVE.moduleKey && saved.prove : saved && saved.mode !== 'prove';
    if (fits && saved.version === 1 && Array.isArray(saved.tickets)) return HD_PROVE ? saved : hdEnsurePractice(saved);
  } catch (_) {}
  const fresh = HD_PROVE ? hdFreshProveState() : hdFreshState();
  localStorage.setItem(hdStateKey(), JSON.stringify(fresh));
  return fresh;
}
let hdState = hdLoadState();
function hdSave() { if (HD_PROVE && HD_PROVE.blocked) return; localStorage.setItem(hdStateKey(), JSON.stringify(hdState)); }

// The fixture lists a page shows: Practice sees the shared fixtures only; a
// Prove shift adds its own computers and KB articles, and its server and
// event overrides.
function hdComputers() { return HD_PROVE ? [...HD_COMPUTERS, ...(HD_PROVE.shift.computers || [])] : HD_COMPUTERS; }
function hdKbArticles() { return HD_PROVE ? [...HD_KB_ARTICLES, ...(HD_PROVE.shift.kbArticles || [])] : HD_KB_ARTICLES; }
function hdServers() {
  const overrides = HD_PROVE ? HD_PROVE.shift.serverOverrides || {} : {};
  return HD_SERVERS.map(server => ({ ...server, ...(overrides[server.name] || {}) }));
}
function hdEvents() {
  const hidden = HD_PROVE ? HD_PROVE.shift.hideEventsFrom || [] : [];
  const events = HD_EVENTS.filter(event => !hidden.includes(event.computer));
  // Practice with HD-2101: jbell's lockout events come from the scenario.
  const scenario = typeof hdM01 === 'function' ? hdM01() : null;
  if (!scenario) return events;
  return events.filter(event => !(event.id === '4740' && /\bjbell\b/.test(event.message)))
    .concat(scenario.events).sort((a, b) => b.time.localeCompare(a.time));
}

// Prove It record: only meaningful events (evidence opened, commands run,
// diagnosis, steps, decision), never every click. Nothing is recorded once
// the attempt is submitted. Whether it is submitted comes only from the
// server's answer, by way of the portal (hdProveServer), never from this
// browser. status: checking (no answer yet), unknown (no answer came),
// not_submitted, returned, waiting or passed.
const hdProveServer = { status:'checking', notice:'', sending:false };
function hdProveLocked() { return !!(HD_PROVE && (HD_PROVE.blocked || ['waiting','passed'].includes(hdProveServer.status))); }
// When the student last changed their work in this browser. A returned attempt
// prefills only over a draft older than that attempt (hdProvePrefill).
function hdProveEdited() { if (HD_PROVE && hdState.prove) hdState.prove.editedAt = new Date().toISOString(); }
function hdProveEvent(type, detail) {
  if (!HD_PROVE || !hdState.prove || hdProveLocked()) return;
  const events = hdState.prove.events;
  events.push({ type, at:new Date().toISOString(), ...(detail || {}) });
  if (events.length > 400) events.splice(0, events.length - 400);
}
function hdProveOpened(source, label) {
  if (!HD_PROVE || !hdState.prove || hdProveLocked() || hdState.prove.opened.includes(source)) return;
  hdState.prove.opened.push(source);
  hdProveEvent('evidence_opened', { source, label });
  hdSave();
}
function hdRerender() { hdSave(); render(); }
function hdEsc(value) { return escHtml(String(value == null ? '' : value)); }
function hdTicketById(id) { return hdState.tickets.find(ticket => ticket.id === id); }
function hdCurrentTicket() { return hdTicketById(hdState.selectedTicketId) || hdState.tickets[0]; }
function hdUserById(id) {
  const base = HD_USERS.find(user => user.id === id);
  return base ? { ...base, ...(hdState.userOverrides[id] || {}) } : null;
}
function hdComputerByName(name) {
  const base = hdComputers().find(computer => computer.name === name);
  return base ? { ...base, ...(hdState.computerOverrides[name] || {}) } : null;
}
function hdOpenTickets() { return hdState.tickets.filter(t => !['Resolved','Closed'].includes(t.status)); }
function hdSlaMinutes(ticket) { return { P1:15, P2:120, P3:480, P4:1440 }[ticket.priority] || 480; }
function hdAgeMinutes(ticket) { return Math.max(0, Math.round((HD_SHIFT_NOW - new Date(ticket.createdTimestamp)) / 60000)); }
function hdSlaState(ticket) {
  if (['Resolved','Closed'].includes(ticket.status)) return { label:'Met / stopped', cls:'ok' };
  const ratio = hdAgeMinutes(ticket) / hdSlaMinutes(ticket);
  if (ratio >= 1) return { label:'Breached', cls:'bad' };
  if (ratio >= .7) return { label:'At risk', cls:'warn' };
  return { label:`${Math.max(1, hdSlaMinutes(ticket) - hdAgeMinutes(ticket))}m left`, cls:'ok' };
}
function hdBadge(value, kind) { return `<span class="hd-badge ${kind || String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-')}">${hdEsc(value)}</span>`; }
function hdPageHeader(title, subtitle, actions) {
  return `<div class="page-header"><div><div class="breadcrumb">IT Service Desk › ${hdEsc(title)}</div><h1>${hdEsc(title)}</h1><div class="page-subtitle">${hdEsc(subtitle)}</div></div>${actions ? `<div class="page-actions">${actions}</div>` : ''}</div>`;
}
function hdList(items, ordered) {
  const tag = ordered ? 'ol' : 'ul';
  return `<${tag} class="hd-list">${(items || []).map(item => `<li>${hdEsc(item)}</li>`).join('')}</${tag}>`;
}
function hdMetric(label, value, detail, tone) {
  return `<div class="card hd-metric ${tone || ''}"><div class="card-body"><span class="muted">${hdEsc(label)}</span><strong>${hdEsc(value)}</strong><small>${hdEsc(detail)}</small></div></div>`;
}
function hdHistory(ticket, action) {
  ticket.troubleshootingHistory.push({ time:new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }), action });
}

function hdSelectTicket(id) {
  hdState.selectedTicketId = id;
  hdSave();
  navigate('#/helpdesk/ticket');
}
function hdSetQueueFilter(value) { hdState.queueFilter = value; hdRerender(); }
function hdSetPriorityFilter(value) { hdState.priorityFilter = value; hdRerender(); }
function hdAssignTicket(id) {
  const ticket = hdTicketById(id); if (!ticket) return;
  ticket.assignedTechnician = 'Riley Morgan';
  if (ticket.status === 'New') ticket.status = 'Assigned';
  hdHistory(ticket, 'Assigned to Riley Morgan.'); hdRerender();
}
function hdTransitionTicket(id, status) {
  const ticket = hdTicketById(id); if (!ticket || !HD_STATUS_NEXT[ticket.status].includes(status)) {
    toast('That state transition is not valid from the current ticket state.'); return;
  }
  ticket.status = status; hdHistory(ticket, `Status changed to ${status}.`); hdRerender();
}
function hdSetTicketPriority(id, priority) {
  const ticket = hdTicketById(id); if (!ticket) return;
  ticket.priority = priority; hdHistory(ticket, `Priority set to ${priority} after impact and urgency review.`); hdRerender();
}
function hdAddNote(id) {
  if (hdProveLocked()) return;
  const ticket = hdTicketById(id); const input = document.getElementById('hd-note-input');
  const text = input && input.value.trim(); if (!ticket || !text) { toast('Enter a useful troubleshooting note first.'); return; }
  ticket.notes.push({ time:new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }), author:'Riley Morgan', text });
  hdProveEdited();
  hdHistory(ticket, 'Technician work note added.');
  // HD-2101 Practice feedback: the note's three parts.
  if (ticket.id === HD_M01 && hdM01()) {
    const missing = hdNoteMissingParts(text);
    toast(missing.length ? `Note added. A complete note for this ticket has three parts: Reported, Tried and Result. Still missing: ${missing.join(', ')}.` : 'Note added: Reported, Tried and Result are all there.');
  }
  hdRerender();
}
function hdContactRequester(id) {
  const ticket = hdTicketById(id); if (!ticket) return;
  const message = `Contacted ${ticket.requester}: acknowledged the ticket, confirmed impact, and set the next update expectation.`;
  ticket.notes.push({ time:new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }), author:'Customer update', text:message });
  hdHistory(ticket, 'Requester contacted; impact and next-update time confirmed.');
  toast('Simulated requester contact recorded.'); hdRerender();
}
function hdSubmitDiagnosis(id) {
  const ticket = hdTicketById(id); const select = document.getElementById('hd-diagnosis');
  if (!ticket || !select || !select.value) { toast('Select the most likely cause first.'); return; }
  ticket.diagnosis = select.value;
  const expectedDiagnosis = HD_DIAGNOSIS_OVERRIDES[ticket.id] || ticket.plausibleCauses[ticket.plausibleCauses.length - 1];
  ticket.diagnosisCorrect = select.value === expectedDiagnosis;
  hdHistory(ticket, `Diagnosis submitted: ${select.value}.`);
  hdSave(); render();
}
function hdTogglePathStep(id, index, checked) {
  const ticket = hdTicketById(id);
  if (!ticket || !Number.isInteger(index) || index < 0 || index >= ticket.correctPath.length) return;
  const selected = new Set(Array.isArray(ticket.checkedSteps) ? ticket.checkedSteps : []);
  if (checked) selected.add(ticket.correctPath[index]);
  else selected.delete(ticket.correctPath[index]);
  ticket.checkedSteps = ticket.correctPath.filter(step => selected.has(step));
  hdSave();
}
function hdResolveTicket(id) {
  const ticket = hdTicketById(id); if (!ticket) return;
  // HD-2101 Practice: resolving needs the investigation's outcomes, and the
  // resolution is the student's own Reported / Tried / Result note.
  const scenario = ticket.id === HD_M01 && hdM01();
  if (scenario) {
    hdM01Tick();
    const missing = hdM01Missing();
    if (missing) { toast(missing); return; }
  } else if (!ticket.diagnosisCorrect && !['Service Request'].includes(ticket.category)) { toast('Validate the root cause before resolving this ticket.'); return; }
  ticket.resolution = scenario ? hdM01CompleteNote(ticket).text : ticket.expectedResolution;
  ticket.closureCode = ticket.category === 'Service Request' ? 'Request fulfilled' : ticket.category === 'Security Incident' ? 'Escalated to Security' : 'Resolved by support';
  if (ticket.category === 'Security Incident' || ticket.escalationCriteria.some(x => x.startsWith('Always'))) {
    ticket.status = 'Escalated'; ticket.assignedTechnician = ticket.category === 'Security Incident' ? 'Cybersecurity Operations' : 'Enterprise Infrastructure';
    hdHistory(ticket, `Warm escalation accepted by ${ticket.assignedTechnician}.`);
  } else {
    ticket.status = 'Resolved'; hdHistory(ticket, 'Resolution applied and awaiting requester confirmation.');
  }
  hdRerender();
}
function hdLinkProblem(id) {
  const ticket = hdTicketById(id); if (!ticket || !ticket.correlationKey) return;
  hdState.tickets.filter(t => t.correlationKey === ticket.correlationKey).forEach(t => {
    t.linkedProblem = 'PRB-0081'; hdHistory(t, 'Linked to PRB-0081 · Purchasing TLS certificate expiry.');
  });
  hdRerender();
}
function hdResetShift() {
  // A Prove attempt has one shift; it never resets.
  if (HD_PROVE) return;
  if (!confirm('Reset the Help Desk shift and discard only Help Desk simulator progress?')) return;
  hdState = hdFreshState();
  if (typeof window.forgetModuleCoachProgress === 'function') window.forgetModuleCoachProgress();
  hdRerender();
}

function hdQueueRows(tickets) {
  return tickets.map(ticket => {
    const sla = hdSlaState(ticket);
    // A Prove ticket shows the student's own fields and no SLA (it follows priority).
    const fields = HD_PROVE && hdState.prove ? hdState.prove.fields : null;
    const priority = fields ? fields.priority : ticket.priority;
    return `<tr class="hd-ticket-row" tabindex="0" onclick="hdSelectTicket('${ticket.id}')" onkeydown="if(event.key==='Enter')hdSelectTicket('${ticket.id}')">
      <td><strong>${hdEsc(ticket.id)}</strong>${ticket.linkedProblem ? `<small>${hdEsc(ticket.linkedProblem)}</small>` : ''}</td>
      <td>${priority ? hdBadge(priority, priority.toLowerCase()) : '<span class="muted">Not set</span>'}</td>
      <td><strong>${hdEsc(ticket.requester)}</strong><small>${hdEsc(ticket.department)}</small></td>
      <td><strong>${hdEsc(fields ? ticket.title : ticket.subcategory)}</strong><small>${hdEsc(ticket.description)}</small></td>
      <td>${hdBadge(ticket.status)}</td><td>${fields ? '<span class="muted">—</span>' : hdBadge(sla.label, sla.cls)}</td><td>${hdEsc(ticket.assignedTechnician)}</td>
    </tr>`;
  }).join('');
}

VIEWS['helpdesk/dashboard'] = () => {
  const open = hdOpenTickets();
  const p1 = open.filter(t => t.priority === 'P1');
  const risk = open.filter(t => ['At risk','Breached'].includes(hdSlaState(t).label));
  const cluster = open.filter(t => t.correlationKey === 'APP-CERT-EXPIRY-01');
  const urgent = [...open].sort((a,b) =>
    ({P1:1,P2:2,P3:3,P4:4}[a.priority] - {P1:1,P2:2,P3:3,P4:4}[b.priority]) ||
    hdAgeMinutes(b) - hdAgeMinutes(a)
  ).slice(0,7);
  return `${hdPageHeader('Help Desk Dashboard', `${HD_ORG.name} · ${HD_ORG.domain} · simulated shift`, `${HD_PROVE ? '' : '<button class="btn btn-secondary" onclick="hdResetShift()">Reset shift</button>'}<button class="btn btn-primary" onclick="navigate('#/helpdesk/tickets')">Open queue</button>`)}${hdProveBlockedNotice()}
    <div class="hd-metric-grid">${hdMetric('Open tickets', open.length, `${hdState.tickets.length} received this shift`)}${hdMetric('Priority 1', p1.length, 'Immediate response required','danger')}${hdMetric('SLA risk', risk.length, 'At risk or breached','warning')}${hdMetric('Correlated reports', cluster.length, 'Possible shared incident','info')}</div>
    <div class="two-col hd-dashboard-grid">
      <div class="card"><div class="card-header"><strong>Priority work</strong><button class="btn btn-ghost btn-sm" onclick="navigate('#/helpdesk/tickets')">View all</button></div><div class="table-wrap"><table><thead><tr><th>ID</th><th>Priority</th><th>Requester</th><th>Issue</th><th>Status</th><th>SLA</th><th>Owner</th></tr></thead><tbody>${hdQueueRows(urgent)}</tbody></table></div></div>
      <div class="hd-side-stack">
        ${HD_PROVE ? '' : `<div class="card hd-correlation"><div class="card-header"><strong>Correlation opportunity</strong>${hdBadge(`${cluster.length} reports`,'warn')}</div><div class="card-body"><h3>Purchasing sign-in failures</h3><p>Users in five departments report the same secure-connection error. Treat the shared timing and evidence as a possible broader incident.</p><button class="btn btn-primary btn-sm" onclick="hdSelectTicket('${cluster[0] ? cluster[0].id : ''}')">Investigate cluster</button></div></div>`}
        <div class="card"><div class="card-header"><strong>Shift discipline</strong></div><div class="card-body">${hdList(['Prioritize business impact and urgency','Own every handoff until accepted','Preserve security evidence','Verify fixes from the user perspective','Close with complete resolution notes'])}</div></div>
      </div>
    </div>`;
};

VIEWS['helpdesk/tickets'] = () => {
  let tickets = hdState.tickets;
  if (hdState.queueFilter === 'Open') tickets = tickets.filter(t => !['Resolved','Closed'].includes(t.status));
  else if (hdState.queueFilter !== 'All') tickets = tickets.filter(t => t.status === hdState.queueFilter);
  if (hdState.priorityFilter !== 'All') tickets = tickets.filter(t => t.priority === hdState.priorityFilter);
  return `${hdPageHeader('Ticket Queue', 'Classify, prioritize, own, investigate, communicate, resolve, and close.', HD_PROVE ? '' : `<button class="btn btn-secondary" onclick="hdResetShift()">Generate new shift</button>`)}${hdProveBlockedNotice()}
    <div class="filterbar"><label>Status <select class="select" onchange="hdSetQueueFilter(this.value)">${['All','Open',...HD_STATUSES].map(v => `<option ${v===hdState.queueFilter?'selected':''}>${v}</option>`).join('')}</select></label><label>Priority <select class="select" onchange="hdSetPriorityFilter(this.value)">${['All','P1','P2','P3','P4'].map(v => `<option ${v===hdState.priorityFilter?'selected':''}>${v}</option>`).join('')}</select></label><span class="muted">${tickets.length} shown${HD_PROVE ? '' : ' · roots remain hidden until diagnosed'}</span></div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>Ticket</th><th>Priority</th><th>Requester</th><th>Category / summary</th><th>Status</th><th>SLA</th><th>Assigned</th></tr></thead><tbody>${hdQueueRows(tickets)}</tbody></table></div></div>`;
};

VIEWS['helpdesk/ticket'] = () => {
  const ticket = hdCurrentTicket();
  if (!ticket) return `${hdPageHeader('Ticket', 'No ticket selected.')}${hdProveBlockedNotice()}`;
  if (HD_PROVE && hdState.prove && ticket.pathPool) return hdProveTicketView(ticket);
  const sla = hdSlaState(ticket);
  const related = ticket.correlationKey ? hdState.tickets.filter(t => t.correlationKey === ticket.correlationKey) : [];
  const nextStates = HD_STATUS_NEXT[ticket.status] || [];
  const diagnosisOptions = ticket.plausibleCauses;
  const scenario = ticket.id === HD_M01 && hdM01();
  if (scenario) hdM01Tick();
  const evidence = ticket.logs.length
    ? `<pre class="hd-evidence">${ticket.logs.map(hdEsc).join('\n')}</pre>`
    : '<p class="muted hd-evidence-empty">No logs are attached to this ticket. Gather the evidence yourself with the tools: Event Viewer, Active Directory and PowerShell.</p>';
  const pathAndDiagnosis = scenario ? hdM01IdentityCard(scenario) + hdM01InvestigationCard(scenario) : `<div class="card"><div class="card-header"><strong>Troubleshooting path</strong><span class="muted">Record what you actually checked.</span></div><div class="card-body"><div class="hd-path">${ticket.correctPath.map((step,index) => `<label><input type="checkbox" onchange="hdTogglePathStep('${ticket.id}',${index},this.checked)" ${(ticket.checkedSteps || []).includes(step)?'checked':''}> <span>${index+1}</span>${hdEsc(step)}</label>`).join('')}</div></div></div>
        <div class="card"><div class="card-header"><strong>Diagnosis checkpoint</strong></div><div class="card-body"><div class="hd-diagnosis-row"><select id="hd-diagnosis" class="select"><option value="">Choose the most likely cause…</option>${diagnosisOptions.map(value => `<option ${ticket.diagnosis===value?'selected':''}>${hdEsc(value)}</option>`).join('')}</select><button class="btn btn-primary" onclick="hdSubmitDiagnosis('${ticket.id}')">Check diagnosis</button></div>${ticket.diagnosis ? `<div class="callout ${ticket.diagnosisCorrect?'success':'warning'}">${ticket.diagnosisCorrect ? `<strong>Supported by the evidence.</strong> ${hdEsc(ticket.hiddenRootCause)}` : '<strong>Not sufficiently supported.</strong> Recheck the evidence and test a different hypothesis.'}</div>` : ''}${ticket.diagnosisCorrect ? `<div class="hd-resolution"><strong>Expected resolution</strong><p>${hdEsc(ticket.expectedResolution)}</p></div>` : ''}</div></div>`;
  return `${hdPageHeader(ticket.id, `${ticket.category} · ${ticket.subcategory}`, `<button class="btn btn-secondary" onclick="navigate('#/helpdesk/tickets')">← Queue</button>${ticket.assignedTechnician==='Unassigned'?`<button class="btn btn-primary" onclick="hdAssignTicket('${ticket.id}')">Assign to me</button>`:''}`)}
    ${related.length > 1 ? `<div class="callout warning hd-related"><strong>${related.length} related reports detected.</strong> Same application, symptom, and time window. ${ticket.linkedProblem ? `Linked to ${hdEsc(ticket.linkedProblem)}.` : `<button class="btn btn-sm btn-secondary" onclick="hdLinkProblem('${ticket.id}')">Link to problem record</button>`}</div>` : ''}
    <div class="hd-ticket-layout">
      <div class="hd-ticket-main">
        <div class="card"><div class="card-header"><strong>Requester statement</strong>${hdBadge(ticket.priority,ticket.priority.toLowerCase())}${hdBadge(ticket.status)}${hdBadge(sla.label,sla.cls)}</div><div class="card-body"><blockquote class="hd-request">${hdEsc(ticket.description)}</blockquote><div class="hd-field-grid"><div><span>Requester</span><strong>${hdEsc(ticket.requester)}</strong></div><div><span>Department</span><strong>${hdEsc(ticket.department)}</strong></div><div><span>Business impact</span><strong>${hdEsc(ticket.businessImpact)}</strong></div><div><span>SLA target</span><strong>${hdEsc(ticket.sla)}</strong></div><div><span>Created</span><strong>${new Date(ticket.createdTimestamp).toLocaleString()}</strong></div><div><span>Assigned technician</span><strong>${hdEsc(ticket.assignedTechnician)}</strong></div></div></div></div>
        <div class="two-col"><div class="card"><div class="card-header"><strong>Observable symptoms</strong></div><div class="card-body">${hdList(ticket.symptoms)}</div></div><div class="card"><div class="card-header"><strong>Relevant system state</strong></div><div class="card-body">${hdList(ticket.systemState)}</div></div></div>
        <div class="card"><div class="card-header"><strong>Available logs and evidence</strong><span class="muted">Investigate; do not infer beyond the evidence.</span></div><div class="card-body">${evidence}</div></div>
        ${pathAndDiagnosis}
        <div class="card"><div class="card-header"><strong>Work notes</strong><span class="muted">Facts, commands, results, interpretation, next action.</span></div><div class="card-body"><div class="hd-note-list">${ticket.notes.length ? ticket.notes.map(note => `<div><strong>${hdEsc(note.author)} · ${hdEsc(note.time)}</strong><p>${hdEsc(note.text)}</p></div>`).join('') : '<p class="muted">No technician notes yet.</p>'}</div><textarea id="hd-note-input" class="ipt hd-note-input" rows="7" placeholder="${scenario ? 'Reported: what Jordan reported&#10;Tried: what you checked and changed, and what each step showed&#10;Result: the outcome and how you confirmed it' : 'Document the action you took and what the result proved…'}"></textarea><button class="btn btn-secondary" onclick="hdAddNote('${ticket.id}')">Add work note</button></div></div>
      </div>
      <aside class="hd-ticket-side">
        <div class="card"><div class="card-header"><strong>Ticket controls</strong></div><div class="card-body hd-control-stack"><label>Priority<select class="select" onchange="hdSetTicketPriority('${ticket.id}',this.value)">${['P1','P2','P3','P4'].map(v=>`<option ${ticket.priority===v?'selected':''}>${v}</option>`).join('')}</select></label>${nextStates.length?`<label>Next state<select class="select" onchange="if(this.value)hdTransitionTicket('${ticket.id}',this.value)"><option value="">Choose…</option>${nextStates.map(v=>`<option>${v}</option>`).join('')}</select></label>`:''}<button class="btn btn-secondary" onclick="hdContactRequester('${ticket.id}')">Contact requester</button><button class="btn btn-primary" onclick="hdResolveTicket('${ticket.id}')">${ticket.category==='Security Incident'?'Warm escalate':'Resolve / escalate'}</button></div></div>
        <div class="card"><div class="card-header"><strong>Escalation criteria</strong></div><div class="card-body">${hdList(ticket.escalationCriteria)}</div></div>
        <div class="card"><div class="card-header"><strong>History</strong></div><div class="card-body hd-history">${ticket.troubleshootingHistory.slice().reverse().map(row=>`<div><time>${hdEsc(row.time)}</time><p>${hdEsc(row.action)}</p></div>`).join('')}</div></div>
        ${ticket.resolution ? `<div class="card"><div class="card-header"><strong>Resolution</strong>${hdBadge(ticket.closureCode,'ok')}</div><div class="card-body"><p>${hdEsc(ticket.resolution)}</p></div></div>` : ''}
      </aside>
    </div>`;
};

// HD-2101 Practice cards, in place of the step checklist and the diagnosis
// dropdown: the caller check (KB-0024) and the investigation's progress with
// hints on request. Practice It gives feedback; Prove It never shows these.
function hdM01IdentityCard(scenario) {
  const feedback = {
    password:'<div class="callout bad" role="alert"><strong>Serious mistake.</strong> The help desk never asks for a password: not to check it, not to type it, not for any reason. A caller who hears that question learns that giving a password away is normal, and an attacker can use exactly that. KB-0024: call back on the number in the User Directory.</div>',
    name:'<div class="callout warn" role="status"><strong>Not enough.</strong> Anyone can learn a name and a department, and a number the caller gives you proves nothing. KB-0024: call back on the number in the User Directory.</div>',
    callback:'<div class="callout success" role="status"><strong>Verified.</strong> You called Jordan back on ext. 4417 from the User Directory, and Jordan confirmed their manager, Ava Robinson. Recorded in the ticket history.</div>',
  };
  const done = scenario.identity === 'callback';
  const choices = done ? '' : `<div class="hd-identity-options" style="display:grid;gap:8px">${HD_M01_IDENTITY.map(option => `<button type="button" class="btn btn-secondary" style="text-align:left;white-space:normal;height:auto;padding:10px 12px" onclick="hdM01Identity('${option.id}')">${hdEsc(option.text)}</button>`).join('')}</div>`;
  const shown = done ? 'callback' : scenario.lastIdentity;
  return `<div class="card hd-identity"><div class="card-header" style="display:flex;flex-wrap:wrap;align-items:baseline;gap:8px"><strong>Verify the caller</strong><span class="muted">KB-0024 · before any account action</span></div><div class="card-body"><p>Jordan Bell is on the phone asking you to unlock the account. How do you verify it's really Jordan?</p>${choices}${shown ? feedback[shown] : ''}</div></div>`;
}
function hdM01InvestigationCard(scenario) {
  const outcomes = hdM01Outcomes(scenario);
  const next = HD_M01_OUTCOMES.find(([key]) => !outcomes[key]);
  const level = next ? scenario.hints[next[0]] || 0 : 0;
  const hint = next && level ? `<div class="callout info" role="status"><strong>Hint${level > 1 ? ' 2' : ''}:</strong> ${hdEsc(next[3][level - 1])}</div>` : '';
  const task = hdM01Task();
  const schedule = scenario.taskInspected && task ? `<p class="muted">${hdEsc(task.name)} on ${hdEsc(hdM01Spec().computer)} · next run ${hdEsc(hdM01NextRunText(scenario))}</p>` : '';
  const relocks = scenario.relocks ? `<p class="muted">The account has locked again ${scenario.relocks} time${scenario.relocks === 1 ? '' : 's'} since you unlocked it.</p>` : '';
  return `<div class="card hd-investigation"><div class="card-header" style="display:flex;flex-wrap:wrap;align-items:baseline;gap:8px"><strong>Your investigation</strong><span class="muted">Practice: any order works. Find the evidence on the tool screens.</span></div><div class="card-body"><ul class="hd-list hd-outcomes">${HD_M01_OUTCOMES.map(([key, label]) => `<li data-outcome="${key}" data-done="${outcomes[key] ? 'yes' : 'no'}">${outcomes[key] ? '✓' : '○'} ${hdEsc(label)}</li>`).join('')}</ul>${schedule}${relocks}${hint}${next ? `<button type="button" class="btn btn-ghost btn-sm" onclick="hdM01Hint()">${level ? (level < 2 ? 'Another hint' : 'Hint shown') : 'Need a hint?'}</button>` : '<p><strong>Every part is done.</strong> Resolve the ticket.</p>'}</div></div>`;
}
function hdDirectoryTable(users) {
  // Practice shows the phone number on file (KB-0024's callback check).
  const phone = !HD_PROVE;
  return `<div class="table-wrap"><table><thead><tr><th>User</th><th>Department</th>${phone ? '<th>Phone</th>' : ''}<th>Account</th><th>MFA</th><th>OU</th><th></th></tr></thead><tbody>${users.map(user=>`<tr><td><strong>${hdEsc(user.name)}</strong><small>${hdEsc(user.email)}</small></td><td>${hdEsc(user.department)}</td>${phone ? `<td>${hdEsc(user.phone || '')}</td>` : ''}<td>${user.enabled?hdBadge(user.locked?'Locked':'Enabled',user.locked?'bad':'ok'):hdBadge('Disabled','bad')}</td><td>${hdBadge(user.mfa,user.mfa==='Registered'?'ok':'warn')}</td><td><code>${hdEsc(user.ou)}</code></td><td><button class="btn btn-sm btn-secondary" onclick="hdOpenUser('${user.id}')">Open</button></td></tr>`).join('')}</tbody></table></div>`;
}
function hdOpenUser(id) { hdState.selectedUserId=id; hdState.adTab='users'; const user=hdUserById(id); hdProveOpened(`ad-user:${id}`, `Active Directory · ${user ? user.name : id}`); hdSave(); navigate('#/helpdesk/active-directory'); }
function hdSetAdTab(tab) { hdState.adTab=tab; hdRerender(); }
function hdAdAction(action) {
  const user = hdUserById(hdState.selectedUserId); if (!user) return;
  // HD-2101 Practice: jbell's lock state is the scenario's.
  if (action === 'unlock' && hdM01() && user.id === hdM01Spec().userId) {
    const result = hdM01Unlock('Active Directory');
    toast(result.message); hdRerender(); return;
  }
  const patch = hdState.userOverrides[user.id] || {};
  if (action === 'unlock') patch.locked=false;
  if (action === 'disable') patch.enabled=false;
  if (action === 'enable') patch.enabled=true;
  if (action === 'reset') patch.passwordAge=0;
  if (action === 'add-hr') patch.groups=[...new Set([...(user.groups||[]),'GG-HR-Contributors'])];
  hdState.userOverrides[user.id]=patch; hdSave(); toast(`Active Directory action completed in the simulation: ${action}.`); render();
}
VIEWS['helpdesk/directory'] = () => `${hdPageHeader('User Directory', 'Search fictional employees, departments, managers, account state, and MFA registration.')}<div class="card">${hdDirectoryTable(HD_USERS.map(user=>hdUserById(user.id)))}</div>`;
function hdLockoutDetailsHtml(user) {
  const scenario = hdM01();
  if (!scenario || user.id !== hdM01Spec().userId) return '';
  const spec = hdM01Spec();
  const last = scenario.events.filter(event => event.id === '4740').pop();
  const details = scenario.lockoutDetailsOpen ? `<dl class="hd-dl hd-lockout-details"><dt>Locked out</dt><dd>${scenario.locked ? 'Yes' : 'No'}</dd><dt>Lockout time</dt><dd>${hdEsc(scenario.locked ? scenario.lockedAt : '—')}</dd><dt>Bad password count</dt><dd>${scenario.badPasswordCount} of ${spec.lockoutThreshold}</dd><dt>Lockouts today</dt><dd>${scenario.lockoutsToday}</dd><dt>Last lockout source</dt><dd>${last ? `${hdEsc(last.caller)} <small class="muted">(caller computer in event 4740 on ${hdEsc(last.computer)} at ${hdEsc(last.time)})</small>` : '—'}</dd></dl>` : '';
  return `<div class="hd-lockout"><button class="btn btn-secondary btn-sm" onclick="hdM01AdLockoutDetails()">${scenario.lockoutDetailsOpen ? 'Refresh lockout details' : 'Lockout details'}</button>${details}</div>`;
}
VIEWS['helpdesk/active-directory'] = () => {
  hdM01Tick();
  const selected = hdUserById(hdState.selectedUserId) || hdUserById('u-1005');
  return `${hdPageHeader('Active Directory', `${HD_ORG.domain} · Users, groups, computers, and delegated help desk tasks`)}<div class="tabs"><button class="tab ${hdState.adTab==='users'?'active':''}" onclick="hdSetAdTab('users')">Users</button><button class="tab ${hdState.adTab==='groups'?'active':''}" onclick="hdSetAdTab('groups')">Groups</button><button class="tab ${hdState.adTab==='computers'?'active':''}" onclick="hdSetAdTab('computers')">Computers</button></div>
    ${hdState.adTab==='users'?`<div class="hd-admin-layout"><div class="card">${hdDirectoryTable(HD_USERS.map(user=>hdUserById(user.id)))}</div><aside class="card hd-object-pane"><div class="card-header"><strong>${hdEsc(selected.name)}</strong>${selected.locked?hdBadge('Locked','bad'):hdBadge(selected.enabled?'Enabled':'Disabled',selected.enabled?'ok':'bad')}</div><div class="card-body"><dl class="hd-dl"><dt>Username</dt><dd>${hdEsc(HD_ORG.netbios+'\\'+selected.username)}</dd><dt>OU</dt><dd>${hdEsc(selected.ou)}</dd><dt>Manager</dt><dd>${hdEsc(selected.manager)}</dd><dt>Password age</dt><dd>${selected.passwordAge} days</dd><dt>Groups</dt><dd>${selected.groups.map(group=>hdBadge(group)).join(' ')}</dd></dl>${hdLockoutDetailsHtml(selected)}<div class="hd-action-grid"><button class="btn btn-secondary" onclick="hdAdAction('unlock')">Unlock</button><button class="btn btn-secondary" onclick="hdAdAction('reset')">Reset password</button><button class="btn btn-secondary" onclick="hdAdAction('${selected.enabled?'disable':'enable'}')">${selected.enabled?'Disable':'Enable'}</button><button class="btn btn-secondary" onclick="hdAdAction('add-hr')">Add approved group</button></div><div class="callout info">Verify identity and approval before any account or access action. Never place passwords in ticket notes.</div></div></aside></div>`:''}
    ${hdState.adTab==='groups'?`<div class="card"><div class="table-wrap"><table><thead><tr><th>Group</th><th>Scope</th><th>Type</th><th>Members</th><th>Resource / purpose</th></tr></thead><tbody>${HD_GROUPS.map(g=>`<tr><td><strong>${hdEsc(g.name)}</strong></td><td>${hdEsc(g.scope)}</td><td>${hdEsc(g.type)}</td><td>${g.members}</td><td>${hdEsc(g.resource)}</td></tr>`).join('')}</tbody></table></div></div>`:''}
    ${hdState.adTab==='computers'?`<div class="card"><div class="table-wrap"><table><thead><tr><th>Computer</th><th>User</th><th>OU</th><th>Trust</th><th>BitLocker</th><th>Health</th></tr></thead><tbody>${hdComputers().map(c=>{const x=hdComputerByName(c.name);return `<tr><td><strong>${hdEsc(x.name)}</strong><small>${hdEsc(x.ip)}</small></td><td>${hdEsc(x.user)}</td><td><code>${hdEsc(x.ou)}</code></td><td>${hdBadge(x.trust,x.trust==='Healthy'?'ok':'bad')}</td><td>${hdBadge(x.bitlocker,x.bitlocker==='Protected'?'ok':'warn')}</td><td>${hdEsc(x.health)}</td></tr>`}).join('')}</tbody></table></div></div>`:''}`;
};

function hdSelectComputer(name, route) { hdState.selectedComputer=name; hdProveOpened(`computer:${name}`, `Endpoint · ${name}`); hdSave(); if(route) navigate(route); else render(); }
function hdEndpointCards() { return hdComputers().map(base=>{const c=hdComputerByName(base.name);return `<button class="hd-device-card ${hdState.selectedComputer===c.name?'active':''}" onclick="hdSelectComputer('${c.name}')"><strong>${hdEsc(c.name)}</strong><span>${hdEsc(c.user)}</span><small>${hdEsc(c.health)} · ${hdEsc(c.lastSeen)}</small></button>`}).join(''); }
VIEWS['helpdesk/windows'] = () => { const c=hdComputerByName(hdState.selectedComputer)||hdComputerByName('NS-LT-0042'); return `${hdPageHeader('Windows Desktop', 'Inspect a managed Windows 11 endpoint before choosing a repair.')}<div class="hd-endpoint-layout"><aside class="card"><div class="card-header"><strong>Endpoints</strong></div><div class="hd-device-list">${hdEndpointCards()}</div></aside><div class="hd-windows-screen"><div class="hd-window-bar"><span>${hdEsc(c.name)} · Remote session</span><span>— □ ×</span></div><div class="hd-window-body"><div class="hd-desktop-hero"><strong>Windows 11 Enterprise</strong><span>${hdEsc(c.os)}</span></div><div class="hd-field-grid"><div><span>Signed-in user</span><strong>${hdEsc(c.user)}</strong></div><div><span>IPv4</span><strong>${hdEsc(c.ip)}</strong></div><div><span>Domain trust</span><strong>${hdEsc(c.trust)}</strong></div><div><span>BitLocker</span><strong>${hdEsc(c.bitlocker)}</strong></div><div><span>OU</span><strong>${hdEsc(c.ou)}</strong></div><div><span>Health</span><strong>${hdEsc(c.health)}</strong></div>${c.uptimeDays ? `<div><span>Uptime</span><strong>${hdEsc(c.uptimeDays)} days</strong></div>` : ''}</div><div class="hd-tool-grid"><button onclick="navigate('#/helpdesk/event-viewer')">📋 Event Viewer</button><button onclick="navigate('#/helpdesk/powershell')">&gt;_ PowerShell</button><button onclick="navigate('#/helpdesk/active-directory')">🗂 Directory</button><button onclick="navigate('#/helpdesk/remote-support')">🖥 Remote Support</button></div></div></div></div>`; };

const HD_EVENTS = [
  { level:'Error', time:'08:42:17', source:'NETLOGON', id:'3210', computer:'NS-LT-0131', message:'Failed to authenticate with domain controller NS-DC01.' },
  { level:'Warning', time:'08:36:04', source:'User Profile Service', id:'1511', computer:'NS-LT-0081', message:'Windows logged the user on with a temporary profile.' },
  { level:'Error', time:'08:29:51', source:'PrintService', id:'372', computer:'NS-PRINT01', message:'Print processor for LabelPro 3.8 failed.' },
  { level:'Information', time:'08:21:30', source:'GroupPolicy', id:'5312', computer:'NS-LT-0145', message:'Applied GPO list does not include Operations Drive Mapping.' },
  { level:'Warning', time:'08:14:02', source:'Disk', id:'2013', computer:'NS-FILE01', message:'The D: volume is below the configured free-space threshold.' },
  { level:'Error', time:'08:11:18', source:'Security', id:'4740', computer:'NS-DC01', message:'Account jbell was locked out; caller computer NS-LT-0117.' },
];
// Practice: filter by event ID and keyword. A filter that shows jbell's
// lockouts counts as finding (and later re-checking) the lockout source.
function hdEventMatches(event, filter) {
  const id = String(filter.id || '').trim();
  const text = String(filter.text || '').trim().toLowerCase();
  return (!id || event.id === id) && (!text || `${event.source} ${event.id} ${event.computer} ${event.message}`.toLowerCase().includes(text));
}
function hdSetEventFilter(event) {
  if (event && event.preventDefault) event.preventDefault();
  const id = document.getElementById('hd-ev-id'); const text = document.getElementById('hd-ev-text');
  hdState.eventFilter = { id:String(id ? id.value : '').trim().slice(0, 8), text:String(text ? text.value : '').trim().slice(0, 60) };
  hdPracticeEvent('event_filter', { label:`Event ID ${hdState.eventFilter.id || 'any'} · ${hdState.eventFilter.text || 'no keyword'}` });
  hdRerender();
}
function hdClearEventFilter() { hdState.eventFilter = { id:'', text:'' }; hdRerender(); }
function hdFilteredEvents() {
  const filter = !HD_PROVE && hdState.eventFilter ? hdState.eventFilter : { id:'', text:'' };
  const rows = hdEvents().filter(event => hdEventMatches(event, filter));
  const scenario = hdM01();
  if (scenario && (filter.id === '4740' || /jbell/i.test(filter.text || '')) && rows.some(event => event.id === '4740' && /\bjbell\b/.test(event.message))) {
    hdM01Observe('event-viewer-4740');
    hdSave();
  }
  return rows;
}
function hdEventFilterBar(count) {
  if (HD_PROVE) return '';
  const filter = hdState.eventFilter || { id:'', text:'' };
  return `<form class="filterbar hd-event-filter" onsubmit="hdSetEventFilter(event)"><label>Event ID <input id="hd-ev-id" class="ipt" inputmode="numeric" maxlength="8" style="width:110px" value="${hdEsc(filter.id)}" placeholder="e.g. 4740"></label><label>Keyword <input id="hd-ev-text" class="ipt" maxlength="60" value="${hdEsc(filter.text)}" placeholder="account, computer or source"></label><button class="btn btn-primary btn-sm" type="submit">Filter</button><button class="btn btn-ghost btn-sm" type="button" onclick="hdClearEventFilter()">Clear</button><span class="muted">${count} shown</span></form>`;
}
VIEWS['helpdesk/event-viewer'] = () => { hdM01Tick(); const rows = hdFilteredEvents(); return `${hdPageHeader('Event Viewer', 'Filter event evidence by endpoint, server, severity, source, and event ID.')}<div class="callout info">An event ID is evidence, not automatically the root cause. Correlate time, scope, recent change, and system state.</div>${hdEventFilterBar(rows.length)}<div class="card"><div class="table-wrap"><table><thead><tr><th>Level</th><th>Time</th><th>Source</th><th>Event ID</th><th>Computer</th><th>Message</th></tr></thead><tbody>${rows.map(e=>`<tr><td>${hdBadge(e.level,e.level==='Error'?'bad':e.level==='Warning'?'warn':'ok')}</td><td>${e.time}</td><td>${hdEsc(e.source)}</td><td>${e.id}</td><td>${hdEsc(e.computer)}</td><td>${hdEsc(e.message)}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">No events match this filter.</td></tr>'}</tbody></table></div></div>`; };

// Simulated machine state (a Prove shift's `machines`): printers, printers
// a policy refresh will add, local administrators and the spooler. The
// commands below read and change it; a computer without state gets the
// shared fixture answers.
function hdMachine(name) { return (hdState.machines || {})[name] || null; }
function hdSessionUser(computer) {
  const base = HD_USERS.find(user => user.name === computer.user);
  return base ? hdUserById(base.id) : null;
}
function hdAccount(name) {
  const value = String(name || '').replace(/^["']|["']$/g, '');
  return value.includes('\\') ? value : `${HD_ORG.netbios}\\${value}`;
}
function hdIsLocalAdmin(machine, user) {
  if (!machine || !user) return false;
  const account = hdAccount(user.username).toLowerCase();
  return machine.localAdministrators.some(member => member.toLowerCase() === account);
}
function hdPublishedPrinter(path) {
  const match = /^\\\\([^\\]+)\\([^\\]+)$/.exec(String(path || '').replace(/^["']|["']$/g, ''));
  if (!match) return null;
  const printer = HD_PRINTERS.find(p => p.server.toLowerCase() === match[1].toLowerCase() && p.name.toLowerCase() === match[2].toLowerCase());
  return printer ? { ...printer, path:`\\\\${printer.server}\\${printer.name}` } : null;
}
function hdParam(command, name) {
  const match = new RegExp(`-${name}\\s+("[^"]*"|'[^']*'|\\S+)`, 'i').exec(command);
  return match ? match[1].replace(/^["']|["']$/g, '') : '';
}
function hdPrinterTable(machine) {
  const rows = (machine ? machine.printers : ['Microsoft Print to PDF']).map(name => {
    const shared = hdPublishedPrinter(name);
    return shared ? `${shared.path.padEnd(30)} ${shared.server.padEnd(12)} Connection ${shared.driver}` : `${name.padEnd(30)} ${''.padEnd(12)} Local      Microsoft Print To PDF`;
  });
  return ['Name                           ComputerName Type       DriverName', ...rows].join('\n');
}
function hdMachineCommand(command, normalized, computer) {
  // A Practice machine may hold only scheduled tasks; these commands need the
  // printer and local-admin state a Prove machine has.
  const stored = hdMachine(computer.name);
  const machine = stored && Array.isArray(stored.printers) ? stored : null;
  const user = hdSessionUser(computer);
  if (normalized === 'whoami') return user ? hdAccount(user.username).toLowerCase() : 'nt authority\\system';
  if (normalized === 'whoami /groups') {
    const groups = ['Everyone                               Well-known group', 'BUILTIN\\Users                          Alias'];
    if (hdIsLocalAdmin(machine, user)) groups.push('BUILTIN\\Administrators                 Alias');
    (user ? user.groups : []).forEach(group => groups.push(`${`${HD_ORG.netbios}\\${group}`.padEnd(38)} Group`));
    return ['GROUP INFORMATION', '-----------------', 'Group Name                             Type', ...groups].join('\n');
  }
  if (normalized === 'get-printer') return hdPrinterTable(machine);
  if (normalized === 'gpupdate /force' || normalized === 'gpupdate') {
    if (machine && user) {
      machine.pendingPolicyPrinters = machine.pendingPolicyPrinters.filter(path => {
        const printer = hdPublishedPrinter(path);
        if (!printer || !user.groups.includes(printer.group)) return true;
        if (!machine.printers.includes(printer.path)) machine.printers.push(printer.path);
        return false;
      });
    }
    return 'Updating policy...\n\nComputer Policy update has completed successfully.\nUser Policy update has completed successfully.';
  }
  if (normalized.startsWith('add-printer')) {
    const printer = hdPublishedPrinter(hdParam(command, 'connectionname'));
    if (!printer || !user || !user.groups.includes(printer.group)) return 'Add-Printer : The specified printer was not found.';
    if (machine && !machine.printers.includes(printer.path)) machine.printers.push(printer.path);
    return '';
  }
  if (/^(get|add|remove)-localgroupmember\b/.test(normalized)) {
    const group = hdParam(command, 'group') || (/^get-localgroupmember\s+("[^"]*"|\S+)/i.exec(command.trim()) || [])[1] || '';
    if (group.replace(/["']/g, '').toLowerCase() !== 'administrators') return `${command.trim().split(/\s+/)[0]} : Group ${group || '(none)'} was not found.`;
    const members = machine ? machine.localAdministrators : [`${computer.name}\\MNT-Support`];
    if (normalized.startsWith('get-')) return ['ObjectClass Name', ...members.map(member => `User        ${member}`)].join('\n');
    const member = hdParam(command, 'member');
    if (!member) return `${command.trim().split(/\s+/)[0]} : Cannot validate argument on parameter 'Member'.`;
    if (machine) {
      const account = hdAccount(member);
      const known = members.findIndex(existing => existing.toLowerCase() === account.toLowerCase());
      if (normalized.startsWith('add-') && known < 0) members.push(account);
      if (normalized.startsWith('remove-') && known >= 0) members.splice(known, 1);
    }
    return '';
  }
  return null;
}

/* ---------- HD-2101 Practice scenario: runtime ---------- */
// The scenario, while this Practice shift has the HD-2101 ticket.
function hdM01() {
  if (HD_PROVE || !hdState.scenarios) return null;
  const scenario = hdState.scenarios[HD_M01];
  return scenario && hdTicketById(HD_M01) ? scenario : null;
}
function hdM01Spec() { return HD_PRACTICE_SCENARIOS[HD_M01]; }
function hdM01Task() {
  const machine = hdMachine(hdM01Spec().computer);
  return machine && Array.isArray(machine.scheduledTasks) ? machine.scheduledTasks.find(task => task.name === hdM01Spec().task) : null;
}
function hdM01Clock(scenario, now = hdNowMs()) {
  return hdClockText(hdClockSeconds(hdM01Spec().clockStart) + Math.max(0, now - scenario.startedAt) / 1000);
}
function hdM01NextRunText(scenario, now = hdNowMs()) {
  const minutes = Math.ceil(Math.max(0, scenario.nextRunAt - now) / 60000);
  const at = hdM01Clock(scenario, scenario.nextRunAt);
  return `${at} (${minutes <= 0 ? 'due now' : minutes === 1 ? 'in under a minute' : `in ${minutes} minutes`}, simulated)`;
}
function hdPracticeEvent(type, detail) {
  if (HD_PROVE) return;
  if (!Array.isArray(hdState.practiceLog)) hdState.practiceLog = [];
  hdState.practiceLog.push({ type, at:new Date().toISOString(), ...(detail || {}) });
  if (hdState.practiceLog.length > 150) hdState.practiceLog.splice(0, hdState.practiceLog.length - 150);
}
function hdM01SyncUser(scenario) {
  const id = hdM01Spec().userId;
  hdState.userOverrides[id] = { ...(hdState.userOverrides[id] || {}), locked:scenario.locked };
}
function hdM01Ticket() { return hdTicketById(HD_M01); }
function hdM01History(action) { const ticket = hdM01Ticket(); if (ticket) hdHistory(ticket, action); }

// One run of FinanceReportSync. With Jordan's old password stored, a run
// against an unlocked account fails the bad-password threshold: locked again,
// new 4740. Against a locked account it just fails.
function hdM01TaskRun(trigger, now = hdNowMs()) {
  const scenario = hdM01(); const task = hdM01Task();
  if (!scenario || !task) return null;
  const spec = hdM01Spec();
  const time = hdM01Clock(scenario, now);
  let result = '0x0'; let relocked = false;
  if (scenario.locked) result = '0x80070775';
  else if (!task.credentialCurrent) {
    result = '0x8007052E'; relocked = true;
    scenario.locked = true; scenario.lockedAt = time; scenario.lockoutsToday += 1; scenario.relocks += 1;
    scenario.badPasswordCount = spec.lockoutThreshold;
    scenario.events.push({ level:'Error', time, source:'Security', id:'4740', computer:spec.domainController, account:spec.username, caller:spec.computer, message:`Account ${spec.username} was locked out; caller computer ${spec.computer}.` });
    hdM01History(`Account ${spec.username} locked again at ${time}.`);
  } else if (scenario.fixedAtMs) {
    scenario.cleanRunAtMs = now; scenario.badPasswordCount = 0;
  }
  task.lastRun = time; task.lastResult = result;
  scenario.nextRunAt = now + spec.runEveryMinutes * 60000;
  hdM01SyncUser(scenario);
  hdPracticeEvent('task_run', { task:task.name, trigger, result, relocked, clock:time });
  if (relocked && typeof toast === 'function') toast(`Jordan Bell's account locked again at ${time}. A new event 4740 on ${spec.domainController} names caller computer ${spec.computer}.`);
  return { time, result, relocked };
}
// The task's schedule. Called on actions and by a timer; an overdue run (the
// tab was closed) happens once, not once per missed interval.
function hdM01Tick(now = hdNowMs()) {
  const scenario = hdM01();
  if (!scenario || now < scenario.nextRunAt) return null;
  return hdM01TaskRun('schedule', now);
}

function hdM01IdentityMessage() { return 'KB-0024: verify Jordan\'s identity before any account action. Answer “Verify the caller” on ticket HD-2101 first.'; }
function hdM01Unlock(via, now = hdNowMs()) {
  const scenario = hdM01(); if (!scenario) return { ok:false, message:'' };
  hdM01Tick(now);
  if (scenario.identity !== 'callback') return { ok:false, message:hdM01IdentityMessage() };
  if (!scenario.locked) return { ok:false, message:'jbell is not locked out.' };
  const spec = hdM01Spec(); const task = hdM01Task();
  const time = hdM01Clock(scenario, now);
  scenario.locked = false; scenario.badPasswordCount = 0;
  scenario.unlocks.push({ at:time, atMs:now, credentialCurrent:!!(task && task.credentialCurrent), via });
  scenario.events.push({ level:'Information', time, source:'Security', id:'4767', computer:spec.domainController, account:spec.username, caller:'', message:`Account ${spec.username} was unlocked by NORTHSTAR\\rmorgan.` });
  hdM01SyncUser(scenario);
  hdM01History(`Account ${spec.username} unlocked (${via}).`);
  hdPracticeEvent('account_unlocked', { via, clock:time, credential:task && task.credentialCurrent ? 'current' : 'old' });
  return { ok:true, message:`Account ${spec.username} unlocked at ${time}.` };
}
function hdM01Fix(via, now = hdNowMs()) {
  const scenario = hdM01(); const task = hdM01Task();
  if (!scenario || !task) return { ok:false, message:'' };
  hdM01Tick(now);
  if (scenario.identity !== 'callback') return { ok:false, message:`Before Jordan types anything at a prompt, verify Jordan's identity (KB-0024). ${hdM01IdentityMessage()}` };
  const time = hdM01Clock(scenario, now);
  if (!task.credentialCurrent) {
    task.credentialCurrent = true; task.credentialChangedDaysAgo = 0;
    scenario.fixedAt = time; scenario.fixedAtMs = now; scenario.fixedBy = via;
    hdM01History(`Stored credential on ${task.name} (${hdM01Spec().computer}) updated through the approved workflow (${via}); Jordan entered the password at the secure prompt.`);
    hdPracticeEvent('task_credential_updated', { task:task.name, via, clock:time });
  }
  return { ok:true, message:'' };
}
// Looking at lockout evidence: finds the source (4740 views, lockout details)
// and, once a clean run has followed the fix and the unlock, verifies it.
const HD_M01_SOURCE_VIA = { 'event-viewer-4740':'Event Viewer, event 4740', 'get-winevent-4740':'PowerShell Get-WinEvent, event 4740', 'ad-lockout-details':'Active Directory lockout details' };
const HD_M01_VERIFY_VIA = { ...HD_M01_SOURCE_VIA, 'get-aduser':'Get-ADUser LockedOut', 'search-adaccount':'Search-ADAccount -LockedOut' };
function hdM01Observe(kind, now = hdNowMs()) {
  const scenario = hdM01(); if (!scenario) return;
  if (HD_M01_SOURCE_VIA[kind] && !scenario.sourceFoundVia.includes(HD_M01_SOURCE_VIA[kind])) {
    scenario.sourceFoundVia.push(HD_M01_SOURCE_VIA[kind]);
    hdPracticeEvent('evidence_opened', { source:kind, label:HD_M01_SOURCE_VIA[kind] });
  }
  const task = hdM01Task();
  const lastUnlock = scenario.unlocks[scenario.unlocks.length - 1];
  const clean = task && task.credentialCurrent && !scenario.locked && lastUnlock
    && scenario.cleanRunAtMs >= Math.max(scenario.fixedAtMs, lastUnlock.atMs);
  if (clean && HD_M01_VERIFY_VIA[kind] && !scenario.verifiedAt) {
    scenario.verifiedAt = hdM01Clock(scenario, now); scenario.verifiedBy = HD_M01_VERIFY_VIA[kind];
    hdM01History(`Verified: account stayed unlocked after the task's next run, no new 4740 (${scenario.verifiedBy}).`);
    hdPracticeEvent('verified', { via:scenario.verifiedBy, clock:scenario.verifiedAt });
  }
}
function hdM01InspectTask() {
  const scenario = hdM01(); if (!scenario || scenario.taskInspected) return;
  scenario.taskInspected = true;
  hdPracticeEvent('evidence_opened', { source:'scheduled-task', label:`${hdM01Spec().task} on ${hdM01Spec().computer}` });
}

// A Reported / Tried / Result note: each part present with some substance.
function hdNoteMissingParts(text) {
  const parts = String(text || '').split(/\b(reported|tried|result)\s*:/i);
  const found = {};
  for (let i = 1; i < parts.length; i += 2) found[parts[i].toLowerCase()] = (found[parts[i].toLowerCase()] || '') + parts[i + 1];
  return ['Reported', 'Tried', 'Result'].filter(label => (found[label.toLowerCase()] || '').replace(/\s+/g, '').length < 8);
}
function hdM01CompleteNote(ticket) {
  return ((ticket && ticket.notes) || []).filter(note => note.author === 'Riley Morgan' && !hdNoteMissingParts(note.text).length).pop() || null;
}
function hdM01Outcomes(scenario = hdM01()) {
  if (!scenario) return null;
  const task = hdM01Task();
  return {
    identityVerified:scenario.identity === 'callback',
    sourceFound:scenario.sourceFoundVia.length > 0,
    taskInspected:scenario.taskInspected === true,
    credentialFixed:!!(task && task.credentialCurrent),
    unlockedAfterFix:!!(task && task.credentialCurrent && !scenario.locked && scenario.unlocks.length),
    verified:!!scenario.verifiedAt,
    noteComplete:!!hdM01CompleteNote(hdM01Ticket()),
  };
}
function hdM01Missing() {
  const outcomes = hdM01Outcomes(); if (!outcomes) return '';
  const row = HD_M01_OUTCOMES.find(([key]) => !outcomes[key]);
  return row ? row[2] : '';
}
// The Practice package's investigation: outcomes, how they were reached and
// the command/action log. Shaped so the Prove It can reuse its command_run
// events.
function hdM01Investigation() {
  const scenario = hdM01(); if (!scenario) return null;
  const task = hdM01Task();
  return {
    version:1, ticketId:HD_M01,
    outcomes:hdM01Outcomes(scenario),
    sourceFoundVia:scenario.sourceFoundVia.slice(),
    identity:{ choice:scenario.identity, tries:scenario.identityTries.slice() },
    credentialFixedBy:scenario.fixedBy, credentialFixedAt:scenario.fixedAt,
    unlocks:scenario.unlocks.map(unlock => ({ at:unlock.at, credentialCurrent:unlock.credentialCurrent, via:unlock.via })),
    relocks:scenario.relocks, verifiedBy:scenario.verifiedBy, verifiedAt:scenario.verifiedAt,
    passwordTyped:scenario.passwordTyped === true, hintsUsed:scenario.hintsUsed,
    end:{ accountLocked:scenario.locked, taskCredential:task && task.credentialCurrent ? 'current' : 'old', taskLastResult:task ? task.lastResult : '' },
    events:(hdState.practiceLog || []).slice(-80),
  };
}

function hdM01Identity(choice) {
  const scenario = hdM01();
  if (!scenario || scenario.identity === 'callback' || !HD_M01_IDENTITY.some(option => option.id === choice)) return;
  scenario.identityTries.push(choice);
  scenario.lastIdentity = choice;
  if (choice === 'callback') {
    scenario.identity = 'callback';
    hdM01History('Identity verified per KB-0024: called Jordan back on the User Directory number (ext. 4417); Jordan confirmed their manager, Ava Robinson.');
  }
  hdPracticeEvent('identity_checked', { choice });
  hdRerender();
}
function hdM01Hint() {
  const scenario = hdM01(); const outcomes = hdM01Outcomes(); if (!scenario || !outcomes) return;
  const row = HD_M01_OUTCOMES.find(([key]) => !outcomes[key]); if (!row) return;
  const level = Math.min(2, (scenario.hints[row[0]] || 0) + 1);
  if (level !== scenario.hints[row[0]]) { scenario.hints[row[0]] = level; scenario.hintsUsed += 1; hdPracticeEvent('hint_shown', { outcome:row[0], level }); }
  hdRerender();
}
function hdM01AdLockoutDetails() {
  const scenario = hdM01(); if (!scenario) return;
  hdM01Tick();
  scenario.lockoutDetailsOpen = true;
  hdM01Observe('ad-lockout-details');
  hdRerender();
}

// The command's key result for the Practice log (set by the scenario commands).
let hdLastCommandResult = '';
function hdFirstLine(text) { return String(text || '').split('\n').map(line => line.trim()).find(Boolean) || ''; }
function hdCommandArg(command, name) {
  const named = hdParam(command, name);
  if (named) return named;
  const parts = command.trim().split(/\s+/);
  return parts[1] && !parts[1].startsWith('-') ? parts[1].replace(/^["']|["']$/g, '') : '';
}
function hdSchtasksArg(command, flag) {
  const match = new RegExp(`/${flag}\\s+("[^"]*"|'[^']*'|\\S+)`, 'i').exec(command);
  return match ? match[1].replace(/^["']|["']$/g, '') : '';
}
// A password argument in any form the shells accept: -Password and the
// shortened names PowerShell allows (-Pa, -Pass, ...), or schtasks /RP, then a
// space, a colon or both (-Password secret, -Password:secret, /RP:secret).
// -Path and /RU don't match.
const HD_PASSWORD_ARG = '(^|\\s)(-pa(?:s(?:s(?:w(?:o(?:r(?:d)?)?)?)?)?)?|\\/rp)(\\s*:\\s*|\\s+)("[^"]*"|\'[^\']*\'|\\S+)';
function hdHasPasswordArg(command) { return new RegExp(HD_PASSWORD_ARG, 'i').test(String(command)); }
// A password typed on the command line is never echoed or recorded. Everything
// from the first password argument to the end is masked, so no quoting or
// escaping (`" or '') can leave part of it behind. Such a command never runs.
function hdRedactCommand(command) {
  const text = String(command);
  const match = new RegExp(HD_PASSWORD_ARG, 'i').exec(text);
  return match ? `${text.slice(0, match.index)}${match[1]}${match[2]}${match[3]}********` : text;
}
function hdTaskLeaf(name) { return String(name || '').split('\\').filter(Boolean).pop() || ''; }
function hdPracticeTasks(computer) {
  const machine = hdMachine(computer.name);
  if (machine && Array.isArray(machine.scheduledTasks)) return machine.scheduledTasks;
  return HD_PRACTICE_MACHINES['NS-LT-0117'].scheduledTasks.filter(task => task.runAs === 'SYSTEM');
}
function hdTaskDetail(task, scenario, style) {
  const result = `${task.lastResult} (${HD_M01_RESULTS[task.lastResult] || 'See task history'})`;
  const credential = task.logonType.startsWith('Password') ? (task.credentialChangedDaysAgo === 0 ? 'today' : `${task.credentialChangedDaysAgo} days ago`) : 'not stored (service account)';
  const next = scenario && task.name === hdM01Spec().task ? hdM01NextRunText(scenario) : 'Per trigger';
  const rows = style === 'schtasks'
    ? [['TaskName', `${task.path}${task.name}`], ['Status', task.state], ['Run As User', task.runAs], ['Logon Mode', task.logonType], ['Stored credential last changed', credential], ['Schedule', task.trigger], ['Last Run Time', task.lastRun], ['Last Result', result], ['Next Run Time', next], ['Task To Run', task.description]]
    : [['TaskName', task.name], ['TaskPath', task.path], ['State', task.state], ['Description', task.description], ['Principal.UserId', task.runAs], ['LogonType', task.logonType], ['Stored credential last changed', credential], ['Triggers', task.trigger], ['LastRunTime', task.lastRun], ['LastTaskResult', result], ['NextRunTime', next]];
  const width = Math.max(...rows.map(([key]) => key.length));
  return rows.map(([key, value]) => `${key.padEnd(width)} : ${value}`).join('\n');
}
// Practice: any command with a password argument is refused before it runs,
// so neither its output nor the practice log ever repeats the password.
function hdRefusePassword() {
  const scenario = hdM01();
  if (scenario) scenario.passwordTyped = true;
  hdLastCommandResult = 'refused: a password was typed into the shell';
  return 'Stopped: never type a user\'s password, not in the shell and not anywhere else.\nKB-0024: run the command without a password. A secure prompt opens on the user\'s own screen and the user types it there. You never see, type or record it.';
}
// Prove: the same refusal without the Practice guidance; the instructor sees
// the flag.
function hdProveRefusePassword() {
  if (hdState.prove) hdState.prove.passwordTyped = true;
  return 'Stopped: this command includes a password, so it was not run or saved.';
}
// Practice-only shell commands: sessions, scheduled tasks and the HD-2101
// lockout evidence. Returns null for anything else.
function hdPracticeCommand(command, normalized, computer) {
  if (HD_PROVE) return null;
  const scenario = hdM01();
  const spec = hdM01Spec();
  const onSource = computer.name === spec.computer;
  const notFound = (verb, name) => `${verb} : No MSFT_ScheduledTask objects found with property 'TaskName' equal to '${name}'. (This shell is connected to ${computer.name}.)`;
  const findTask = name => hdPracticeTasks(computer).find(task => task.name.toLowerCase() === hdTaskLeaf(name).toLowerCase());
  const refusePassword = hdRefusePassword;
  const fixed = (lines) => [...lines, '', HD_M01_TIP].join('\n');

  let match = /^enter-pssession(?:\s+-computername)?\s+("?)([a-z0-9-]+)\1$/i.exec(command.trim());
  if (match) {
    const target = hdComputerByName(match[2].toUpperCase());
    if (!target) { hdLastCommandResult = `no such computer ${match[2]}`; return `Enter-PSSession : Connecting to remote server ${match[2]} failed: the computer was not found.`; }
    hdState.selectedComputer = target.name;
    hdLastCommandResult = `connected to ${target.name}`;
    return `[${target.name}]: Connected. Commands now run on ${target.name} (signed-in user: ${target.user}).`;
  }
  if (normalized === 'exit-pssession') { hdLastCommandResult = 'session ended'; return `Session to ${computer.name} ended. Connect to another computer with Enter-PSSession <name>.`; }

  if (/^get-scheduledtask(\s|$)/.test(normalized)) {
    const name = hdCommandArg(command, 'taskname');
    if (name) {
      const task = findTask(name);
      if (!task) { hdLastCommandResult = `task ${name} not found on ${computer.name}`; return notFound('Get-ScheduledTask', name); }
      if (scenario && onSource && task.name === spec.task) hdM01InspectTask();
      hdLastCommandResult = `${task.name} on ${computer.name} runs as ${task.runAs}; stored credential ${task.credentialChangedDaysAgo === null ? 'none' : task.credentialChangedDaysAgo === 0 ? 'changed today' : `changed ${task.credentialChangedDaysAgo} days ago`}; last result ${task.lastResult}`;
      return hdTaskDetail(task, scenario);
    }
    const tasks = hdPracticeTasks(computer);
    if (scenario && onSource) hdM01InspectTask();
    hdLastCommandResult = `${tasks.length} tasks on ${computer.name}: ${tasks.map(task => `${task.name} (${task.runAs})`).join(', ')}`;
    return ['TaskPath                 TaskName                             State   RunAs', ...tasks.map(task => `${task.path.padEnd(24)} ${task.name.padEnd(36)} ${task.state.padEnd(7)} ${task.runAs}`)].join('\n');
  }
  if (/^get-scheduledtaskinfo(\s|$)/.test(normalized)) {
    const name = hdCommandArg(command, 'taskname');
    const task = name && findTask(name);
    if (!task) { hdLastCommandResult = `task ${name || '(none)'} not found on ${computer.name}`; return notFound('Get-ScheduledTaskInfo', name || '(none)'); }
    hdLastCommandResult = `${task.name}: last run ${task.lastRun}, result ${task.lastResult}`;
    return [`TaskName           : ${task.name}`, `LastRunTime        : ${task.lastRun}`, `LastTaskResult     : ${task.lastResult} (${HD_M01_RESULTS[task.lastResult] || 'See task history'})`, `NextRunTime        : ${scenario && task.name === spec.task ? hdM01NextRunText(scenario) : 'Per trigger'}`, 'NumberOfMissedRuns : 0'].join('\n');
  }
  if (/^schtasks(\.exe)?\s+\/query\b/.test(normalized)) {
    const name = hdSchtasksArg(command, 'tn');
    if (name) {
      const task = findTask(name);
      if (!task) { hdLastCommandResult = `task ${name} not found on ${computer.name}`; return `ERROR: The system cannot find the file specified. (No task "${name}" on ${computer.name}.)`; }
      if (scenario && onSource && task.name === spec.task) hdM01InspectTask();
      hdLastCommandResult = `${task.name} on ${computer.name} runs as ${task.runAs}; last result ${task.lastResult}`;
      return hdTaskDetail(task, scenario, 'schtasks');
    }
    const tasks = hdPracticeTasks(computer);
    hdLastCommandResult = `${tasks.length} tasks on ${computer.name}`;
    return ['TaskName                                   Next Run Time          Status', ...tasks.map(task => `${`${task.path}${task.name}`.padEnd(42)} ${(scenario && task.name === spec.task ? hdM01Clock(scenario, scenario.nextRunAt) : 'Per trigger').padEnd(22)} ${task.state}`)].join('\n');
  }

  const isSet = /^set-scheduledtask(\s|$)/.test(normalized);
  const isChange = /^schtasks(\.exe)?\s+\/change\b/.test(normalized);
  if (isSet || isChange) {
    const verb = isSet ? 'Set-ScheduledTask' : 'ERROR:';
    if (hdHasPasswordArg(command)) return refusePassword();
    const name = isSet ? hdCommandArg(command, 'taskname') : hdSchtasksArg(command, 'tn');
    const user = isSet ? hdParam(command, 'user') : hdSchtasksArg(command, 'ru');
    const task = name && findTask(name);
    if (!task) { hdLastCommandResult = `task ${name || '(none)'} not found on ${computer.name}`; return isSet ? notFound(verb, name || '(none)') : `ERROR: The system cannot find the file specified. (No task "${name || '(none)'}" on ${computer.name}.)`; }
    if (!user) { hdLastCommandResult = 'no account given'; return `${verb} Name the account the task runs as (${isSet ? '-User' : '/RU'} ${task.runAs}), so its stored credential is replaced.`; }
    if (hdAccount(user).toLowerCase() !== task.runAs.toLowerCase()) {
      hdLastCommandResult = `refused: account change to ${hdAccount(user)}`;
      return `${verb} Changing the account this task runs as is a Tier 2 change, not a help desk fix. For this ticket, update the stored credential for ${task.runAs}.`;
    }
    if (!scenario || task.name !== spec.task) { hdLastCommandResult = 'nothing to update'; return `${task.name} doesn't store a user password; nothing to update.`; }
    const result = hdM01Fix(isSet ? 'Set-ScheduledTask' : 'schtasks /Change');
    if (!result.ok) { hdLastCommandResult = 'blocked: identity not verified'; return result.message; }
    hdLastCommandResult = `stored credential for ${task.runAs} on ${task.name} updated; Jordan typed the password at the secure prompt`;
    return isSet
      ? fixed([`Secure credential prompt opened on Jordan Bell's screen (${computer.name}).`, 'Jordan typed the current password at the prompt. You never see, type or record it.', '', 'TaskPath                 TaskName           State', `${task.path.padEnd(24)} ${task.name.padEnd(18)} ${task.state}`])
      : fixed([`Please enter the run as password for ${task.runAs}: (secure prompt on Jordan Bell's screen, ${computer.name}. Jordan typed it there. You never see, type or record it.)`, '', `SUCCESS: The parameters of scheduled task "${task.name}" have been changed.`]);
  }

  const isStart = /^start-scheduledtask(\s|$)/.test(normalized);
  const isRun = /^schtasks(\.exe)?\s+\/run\b/.test(normalized);
  if (isStart || isRun) {
    const name = isStart ? hdCommandArg(command, 'taskname') : hdSchtasksArg(command, 'tn');
    const task = name && findTask(name);
    if (!task) { hdLastCommandResult = `task ${name || '(none)'} not found on ${computer.name}`; return isStart ? notFound('Start-ScheduledTask', name || '(none)') : `ERROR: The system cannot find the file specified. (No task "${name || '(none)'}" on ${computer.name}.)`; }
    if (!scenario || task.name !== spec.task) { hdLastCommandResult = `${task.name} started`; return isRun ? `SUCCESS: Attempted to run the scheduled task "${task.path}${task.name}".` : ''; }
    const run = hdM01TaskRun(isStart ? 'Start-ScheduledTask' : 'schtasks /Run');
    hdLastCommandResult = `${task.name} ran at ${run.time}: ${run.result}${run.relocked ? '; account locked again' : ''}`;
    return `${isRun ? `SUCCESS: Attempted to run the scheduled task "${task.path}${task.name}".\n` : ''}(Task ran at ${run.time}. Check the result with Get-ScheduledTaskInfo ${task.name}.)`;
  }

  if (!scenario) return null;
  if (normalized.startsWith('get-winevent') && normalized.includes('4740')) {
    const rows = hdEvents().filter(event => event.id === '4740');
    hdM01Observe('get-winevent-4740');
    hdLastCommandResult = `${rows.length} event(s) 4740: ${rows.map(event => `${event.time} ${event.message}`).join(' | ')}`;
    return ['TimeCreated  Id    MachineName  Message', ...rows.map(event => `${event.time}     ${event.id}  ${event.computer.padEnd(12)} ${event.message}`)].join('\n');
  }
  if (normalized.startsWith('get-aduser') && /\bjbell\b/.test(normalized)) {
    const user = hdUserById(spec.userId);
    const lockout = /-properties\s+.*(\*|lockedout|badlogoncount|accountlockouttime)/.test(normalized);
    const rows = [['DistinguishedName', `CN=${user.name},${user.ou}`], ['Enabled', user.enabled ? 'True' : 'False'], ['SamAccountName', user.username], ['UserPrincipalName', user.email]];
    if (lockout) {
      rows.push(['LockedOut', scenario.locked ? 'True' : 'False'], ['BadLogonCount', String(scenario.badPasswordCount)], ['AccountLockoutTime', scenario.locked ? scenario.lockedAt : ''], ['PasswordLastSet', `${user.passwordAge} days ago`]);
      hdM01Observe('get-aduser');
    }
    hdLastCommandResult = lockout ? `jbell LockedOut=${scenario.locked ? 'True' : 'False'}` : 'jbell found';
    const width = Math.max(...rows.map(([key]) => key.length));
    return rows.map(([key, value]) => `${key.padEnd(width)} : ${value}`).join('\n');
  }
  if (normalized.startsWith('search-adaccount') && normalized.includes('-lockedout')) {
    hdM01Observe('search-adaccount');
    hdLastCommandResult = scenario.locked ? 'locked out: jbell' : 'no locked-out accounts';
    return scenario.locked ? `Name         SamAccountName LockedOut\n${hdUserById(spec.userId).name.padEnd(12)} jbell          True` : '(No locked-out accounts.)';
  }
  if (/^unlock-adaccount(\s|$)/.test(normalized)) {
    const name = hdCommandArg(command, 'identity');
    if (name.toLowerCase() !== spec.username) { hdLastCommandResult = `no locked account ${name}`; return `Unlock-ADAccount : Cannot find an object with identity: '${name || '(none)'}'.`; }
    const result = hdM01Unlock('Unlock-ADAccount');
    hdLastCommandResult = result.ok ? 'jbell unlocked' : `not unlocked: ${result.message}`;
    return result.ok ? '' : `Unlock-ADAccount : ${result.message}`;
  }
  return null;
}

function hdPowerShellOutput(command) {
  const normalized=command.trim().toLowerCase().replace(/\s+/g, ' '); const computer=hdComputerByName(hdState.selectedComputer)||hdComputers()[0];
  if(normalized==='get-help') return `Supported: Get-ComputerInfo, Get-Service, Get-Process, Get-Volume, Get-Disk, Get-NetIPConfiguration, Get-WinEvent, Get-LocalUser, Get-LocalGroup, Get-LocalGroupMember, Add-LocalGroupMember, Remove-LocalGroupMember, Get-Printer, Add-Printer, Get-ADUser, Get-ADGroup, Get-ADComputer, Resolve-DnsName, Test-NetConnection, whoami /groups, gpupdate /force, gpresult /r, Clear-Host${HD_PROVE ? '' : `
Sessions: Enter-PSSession -ComputerName <name>, Exit-PSSession
Scheduled tasks: Get-ScheduledTask [-TaskName <name>], Get-ScheduledTaskInfo -TaskName <name>, Start-ScheduledTask -TaskName <name>, Set-ScheduledTask -TaskName <name> -User <DOMAIN\\user>, schtasks /Query [/TN <name> /V /FO LIST], schtasks /Change /TN <name> /RU <DOMAIN\\user>, schtasks /Run /TN <name>
Accounts: Get-ADUser <user> -Properties *, Search-ADAccount -LockedOut, Unlock-ADAccount -Identity <user>
Events: Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4740}`}`;
  const practiceOutput = hdPracticeCommand(command, normalized, computer);
  if(practiceOutput !== null) return practiceOutput;
  const machineOutput = hdMachineCommand(command, normalized, computer);
  if(machineOutput !== null) return machineOutput;
  if(normalized==='get-computerinfo') return `CsName: ${computer.name}\nWindowsProductName: Windows 11 Enterprise\nOsVersion: 10.0.26100\nCsDomain: ${HD_ORG.domain}${computer.uptimeDays ? `\nOsUptime: ${computer.uptimeDays} days` : ''}`;
  if(normalized==='get-netipconfiguration') return `InterfaceAlias: Wi-Fi\nIPv4Address: ${computer.ip}\nIPv4DefaultGateway: ${computer.ip.startsWith('169.254')?'(none)':'10.20.10.1'}\nDNSServer: ${computer.ip.startsWith('169.254')?'(none)':'10.20.0.10, 10.20.0.11'}`;
  if(normalized==='get-service') return `Status   Name          DisplayName\nRunning  EventLog      Windows Event Log\nRunning  WinDefend     Endpoint Protection\n${((hdMachine(computer.name) || {}).spooler || 'Stopped').padEnd(8)} Spooler       Print Spooler`;
  if(normalized==='get-process') return 'Handles  CPU(s)  Id    ProcessName\n412      8.4     1148  explorer\n690      11.1    2480  browser\n221      2.7     3312  vpnclient';
  if(normalized==='get-volume') return 'DriveLetter FileSystemLabel HealthStatus SizeRemaining\nC           Windows         Healthy      118 GB\nD           Data            Warning      81 GB';
  if(normalized==='get-disk') return 'Number FriendlyName        HealthStatus OperationalStatus Size\n0      NVMe Enterprise SSD  Healthy      Online            476 GB';
  if(normalized.startsWith('get-winevent')) return hdEvents().slice(0,4).map(e=>`${e.time} ${e.level} ${e.source} ${e.id} ${e.message}`).join('\n');
  if(normalized==='get-localuser') return 'Name             Enabled Description\nAdministrator    False   Built-in account\nMNT-Support      True    Managed local support';
  if(normalized==='get-localgroup') return 'Administrators\nRemote Desktop Users\nUsers';
  if(normalized.startsWith('get-aduser')) return HD_USERS.slice(0,8).map(u=>`${u.username.padEnd(12)} ${u.name.padEnd(20)} Enabled=${hdUserById(u.id).enabled}`).join('\n');
  if(normalized.startsWith('get-adgroup')) return HD_GROUPS.map(g=>`${g.name.padEnd(26)} ${g.scope} ${g.type}`).join('\n');
  if(normalized.startsWith('get-adcomputer')) return hdComputers().map(c=>`${c.name.padEnd(14)} ${c.trust}`).join('\n');
  if(normalized.startsWith('resolve-dnsname')) return 'Name                              Type TTL Section IPAddress\npurchasing.northstar.example      A    300 Answer  10.20.0.50';
  if(normalized.startsWith('test-netconnection')) return 'ComputerName: purchasing.northstar.example\nRemotePort: 443\nInterfaceAlias: Wi-Fi\nTcpTestSucceeded: True';
  if(normalized==='gpresult /r') return `COMPUTER SETTINGS\nCN=${computer.name},${computer.ou}\nApplied Group Policy Objects: Workstation Security Baseline\n${computer.ou==='CN=Computers'?'The following GPOs were not applied: Operations Drive Mapping (link out of scope)':'Operations Drive Mapping: Applied'}`;
  return `The term '${command}' is outside this training shell. Type Get-Help for supported commands.`;
}
function hdRunPowerShell(event) {
  event.preventDefault(); const input=document.getElementById('hd-ps-input'); const command=input.value.trim(); if(!command)return;
  if(hdProveLocked()) return;
  // A password typed by mistake is never run, shown or recorded, in Practice
  // or Prove. Any other command is shown and recorded exactly as typed.
  const passwordTyped = hdHasPasswordArg(command);
  const shown = hdRedactCommand(command);
  hdProveEvent('command_run', { command:shown.slice(0, 200), computer:hdState.selectedComputer });
  hdM01Tick();
  const computer = hdState.selectedComputer;
  if(command.toLowerCase()==='clear-host'){hdState.powershell=[];} else {
    hdLastCommandResult = '';
    const output = passwordTyped ? (HD_PROVE ? hdProveRefusePassword() : hdRefusePassword()) : hdPowerShellOutput(command);
    hdState.powershell.push({type:'command',text:`PS C:\\Support> ${shown}`},{type:'output',text:output});
    hdPracticeEvent('command_run', { command:shown.slice(0, 200), computer, result:(hdLastCommandResult || hdFirstLine(output)).slice(0, 200) });
  }
  hdSave(); render();
}
VIEWS['helpdesk/powershell'] = () => `${hdPageHeader('PowerShell', `Connected to ${hdEsc(hdState.selectedComputer)} · training commands`)}<div class="hd-terminal"><div class="hd-terminal-title">Northstar Enterprise Support Shell</div><div class="hd-terminal-output">${hdState.powershell.map(row=>`<pre class="${row.type}">${hdEsc(row.text)}</pre>`).join('')}</div><form onsubmit="hdRunPowerShell(event)" class="hd-terminal-input"><span>PS C:\\Support&gt;</span><input id="hd-ps-input" autocomplete="off" spellcheck="false" placeholder="Get-Help" autofocus><button>Run</button></form></div><div class="callout info">Command-line output is simulated and limited to the course fixtures. Use it to collect repeatable evidence for ticket notes.</div>`;

VIEWS['helpdesk/server-manager'] = () => `${hdPageHeader('Server Manager', 'Inspect Windows Server roles, services, health, and endpoint dependencies.')}<div class="hd-metric-grid">${hdMetric('Servers',hdServers().length,'2 domain controllers')}${hdMetric('Online',hdServers().filter(s=>s.status==='Online').length,'Responding to management')}${hdMetric('Degraded',hdServers().filter(s=>s.status==='Degraded').length,'Service investigation required','warning')}${hdMetric('Critical roles','AD DS · DNS · DHCP','Authentication and connectivity')}</div><div class="card"><div class="table-wrap"><table><thead><tr><th>Server</th><th>Role</th><th>Address</th><th>Status</th><th>CPU</th><th>Memory</th><th>Role / service health</th></tr></thead><tbody>${hdServers().map(s=>`<tr><td><strong>${s.name}</strong><small>${s.os}</small></td><td>${s.role}</td><td><code>${s.ip}</code></td><td>${hdBadge(s.status,s.status==='Online'?'ok':'warn')}</td><td>${s.cpu}</td><td>${s.memory}</td><td>${s.service}</td></tr>`).join('')}</tbody></table></div></div>`;
VIEWS['helpdesk/dns'] = () => `${hdPageHeader('DNS Manager', 'Validate forward records and connect name-resolution evidence to client symptoms.')}<div class="two-col"><div class="card"><div class="card-header"><strong>Forward lookup zone · ${HD_ORG.domain}</strong></div><div class="table-wrap"><table><thead><tr><th>Name</th><th>Type</th><th>Value</th><th>TTL</th><th>Status</th></tr></thead><tbody>${HD_DNS_RECORDS.map(r=>`<tr><td><strong>${r.name}</strong></td><td>${r.type}</td><td><code>${r.value}</code></td><td>${r.ttl}</td><td>${hdBadge(r.status,r.status==='Healthy'?'ok':'warn')}</td></tr>`).join('')}</tbody></table></div></div><div class="card"><div class="card-header"><strong>Diagnostic decision</strong></div><div class="card-body">${hdList(['Confirm the client resolver, not only network reachability','Compare hostname and IP tests','Query the authoritative/internal resolver directly','Avoid hosts-file workarounds','Escalate when multiple clients or zones are affected'],true)}<pre class="hd-evidence">Resolve-DnsName purchasing.northstar.example\nServer: 10.20.0.10\nAddress: 10.20.0.50</pre></div></div></div>`;
VIEWS['helpdesk/dhcp'] = () => `${hdPageHeader('DHCP Manager', 'Inspect scope utilization, leases, reservations, and APIPA evidence.')}<div class="card"><div class="table-wrap"><table><thead><tr><th>Scope</th><th>Range</th><th>VLAN</th><th>Leased</th><th>Free</th><th>Utilization</th><th>Status</th></tr></thead><tbody>${HD_DHCP_SCOPES.map(s=>`<tr><td><strong>${s.name}</strong></td><td><code>${s.range}</code></td><td>${s.vlan}</td><td>${s.leased}</td><td>${s.free}</td><td><div class="hd-progress"><i style="width:${s.utilization}"></i></div>${s.utilization}</td><td>${hdBadge(s.status,s.status==='Active'?'ok':'warn')}</td></tr>`).join('')}</tbody></table></div></div><div class="callout warning"><strong>APIPA investigation:</strong> 169.254.44.19 on NS-LT-0094 has no lease. One device is affected; test the client interfaces before declaring a DHCP-server outage.</div>`;
VIEWS['helpdesk/group-policy'] = () => `${hdPageHeader('Group Policy Management', 'Inspect policy links, scope, versions, and resultant policy before changing configuration.')}<div class="card"><div class="table-wrap"><table><thead><tr><th>GPO</th><th>Linked to</th><th>Security filtering</th><th>Version</th><th>Status</th><th>Purpose</th></tr></thead><tbody>${HD_GPOS.map(g=>`<tr><td><strong>${g.name}</strong></td><td><code>${hdEsc(g.link)}</code></td><td>${g.scope}</td><td>${g.version}</td><td>${hdBadge(g.status,'ok')}</td><td>${g.purpose}</td></tr>`).join('')}</tbody></table></div></div><div class="two-col"><div class="card"><div class="card-header"><strong>gpresult · NS-LT-0145</strong></div><div class="card-body"><pre class="hd-evidence">Computer DN: CN=NS-LT-0145,CN=Computers\nApplied: Default Domain Policy\nDenied: Operations Drive Mapping\nReason: Link out of scope</pre></div></div><div class="card"><div class="card-header"><strong>Safe policy workflow</strong></div><div class="card-body">${hdList(['Define outcome and rollback','Confirm target OU and filtering','Test one scoped endpoint','Use gpupdate to refresh','Use gpresult to prove application','Record the change and verification'],true)}</div></div></div>`;
VIEWS['helpdesk/file-server'] = () => `${hdPageHeader('File Server', 'Calculate effective access across share permissions, NTFS permissions, groups, and inheritance.')}<div class="two-col"><div class="card"><div class="card-header"><strong>Shares · NS-FILE01</strong></div><div class="table-wrap"><table><thead><tr><th>Share</th><th>UNC path</th><th>Share permission</th><th>NTFS model</th><th>Status</th></tr></thead><tbody><tr><td>Finance</td><td><code>\\NS-FILE01\Finance</code></td><td>Authenticated Users · Change</td><td>GG-Finance-Contributors · Modify</td><td>${hdBadge('Warning','warn')}</td></tr><tr><td>HR</td><td><code>\\NS-FILE01\HR</code></td><td>HR Users · Change</td><td>Readers / Contributors groups</td><td>${hdBadge('Healthy','ok')}</td></tr><tr><td>Operations</td><td><code>\\NS-FILE01\Operations</code></td><td>Operations Users · Change</td><td>GG-Operations-Drive · Modify</td><td>${hdBadge('Healthy','ok')}</td></tr></tbody></table></div></div><div class="card"><div class="card-header"><strong>Effective access · Evan Parker</strong></div><div class="card-body"><dl class="hd-dl"><dt>Share</dt><dd>Change</dd><dt>NTFS</dt><dd>Read &amp; Execute</dd><dt>Effective network access</dt><dd>${hdBadge('Read only','warn')}</dd><dt>Evidence</dt><dd>Not a member of GG-Finance-Contributors</dd></dl><div class="callout info">Use an approved security group. Do not add a direct user ACL to bypass the access model.</div></div></div></div>`;
function hdPrinter(name){const base=HD_PRINTERS.find(p=>p.name===name);return {...base,...(hdState.printerOverrides[name]||{})};}
function hdPrinterAction(name,action){const p=hdPrinter(name);const patch=hdState.printerOverrides[name]||{};if(action==='resume'){patch.status='Ready';}if(action==='clear'){patch.queue=0;}hdState.printerOverrides[name]=patch;hdSave();toast(`${name}: ${action} completed in the simulation.`);render();}
VIEWS['helpdesk/printers'] = () => `${hdPageHeader('Printer Management', 'Inspect print servers, access groups, drivers, ports, and queued jobs.')}<div class="card"><div class="table-wrap"><table><thead><tr><th>Printer</th><th>Location</th><th>Server</th><th>Driver</th><th>Jobs</th><th>Access group</th><th>Status</th><th>Actions</th></tr></thead><tbody>${HD_PRINTERS.map(base=>{const p=hdPrinter(base.name);return `<tr><td><strong>${p.name}</strong></td><td>${p.location}</td><td>${p.server}</td><td>${p.driver}</td><td>${p.queue}</td><td>${p.group}</td><td>${hdBadge(p.status,p.status==='Ready'?'ok':p.status==='Paused'?'warn':'bad')}</td><td><button class="btn btn-sm btn-secondary" onclick="hdPrinterAction('${p.name}','resume')">Resume</button> <button class="btn btn-sm btn-ghost" onclick="hdPrinterAction('${p.name}','clear')">Clear training jobs</button></td></tr>`}).join('')}</tbody></table></div></div><div class="callout warning">Preserve confidential jobs and print-service evidence before clearing a production queue.${HD_PROVE ? '' : ' The warehouse failure points to a driver crash, not a network outage.'}</div>`;
VIEWS['helpdesk/endpoint-security'] = () => `${hdPageHeader('Endpoint Security', 'Help desk technicians gather facts and perform approved first response; cybersecurity owns incident investigation.')}<div class="card"><div class="table-wrap"><table><thead><tr><th>Alert</th><th>Severity</th><th>User / device</th><th>Signal</th><th>Status</th><th>Owner</th></tr></thead><tbody>${HD_SECURITY_ALERTS.map(a=>`<tr><td><strong>${a.title}</strong><small>${a.id}</small></td><td>${hdBadge(a.severity,a.severity==='High'?'bad':'warn')}</td><td>${a.user}<small>${a.device}</small></td><td>${a.signal}</td><td>${hdBadge(a.status,a.status==='Needs escalation'?'bad':'warn')}</td><td>${a.owner}</td></tr>`).join('')}</tbody></table></div></div><div class="three-col">${['Preserve evidence','Protect the account or endpoint only within authority','Warm hand off with facts, timestamps, impact, and actions'].map((x,i)=>`<div class="card"><div class="card-body"><strong>${i+1}. ${x}</strong><p class="muted">${['Do not delete messages, extensions, files, or logs.','Follow the approved response runbook; do not improvise containment.','Never promise that a device or account is safe before security validates it.'][i]}</p></div></div>`).join('')}</div>`;
VIEWS['helpdesk/knowledge-base'] = () => `${hdPageHeader('Knowledge Base', 'Use approved runbooks, then improve them with validated symptoms, evidence, resolution, and escalation boundaries.')}<div class="hd-kb-grid">${hdKbArticles().map(k=>`<article class="card"><div class="card-header"><strong>${k.id}</strong>${hdBadge(k.category)}</div><div class="card-body"><h3>${k.title}</h3><p>${k.summary}</p><small>${k.audience} · Updated ${k.updated}</small></div></article>`).join('')}</div>`;
VIEWS['helpdesk/remote-support'] = () => {const c=hdComputerByName(hdState.selectedComputer)||hdComputers()[0];return `${hdPageHeader('Remote Support', 'Obtain consent, explain actions, protect privacy, and leave the endpoint in a verified state.')}<div class="two-col"><div class="card"><div class="card-header"><strong>Session target</strong>${hdBadge(c.health,c.health==='Healthy'?'ok':'warn')}</div><div class="card-body"><select class="select" onchange="hdSelectComputer(this.value,'#/helpdesk/remote-support')">${hdComputers().map(x=>`<option ${x.name===c.name?'selected':''}>${x.name}</option>`).join('')}</select><dl class="hd-dl"><dt>User</dt><dd>${c.user}</dd><dt>Last seen</dt><dd>${c.lastSeen}</dd><dt>Address</dt><dd>${c.ip}</dd><dt>Domain trust</dt><dd>${c.trust}</dd></dl><button class="btn btn-primary" onclick="toast('Consent request sent to ${hdEsc(c.user)}.')">Request session consent</button></div></div><div class="card"><div class="card-header"><strong>Remote-support checklist</strong></div><div class="card-body">${hdList(['Verify the requester and ticket','Explain what you need to inspect','Ask before viewing personal or sensitive content','Narrate material actions','Stop if security indicators appear','Verify the fix with the user','End the session and document it'],true)}</div></div></div>`;};
VIEWS['helpdesk/environment'] = () => `${hdPageHeader('Enterprise Map', `${HD_ORG.name} · persistent fictional training environment`)}<div class="three-col"><div class="card"><div class="card-header"><strong>Identity</strong></div><div class="card-body"><h2>${HD_USERS.length} users</h2><p>${HD_GROUPS.length} modeled groups · ${HD_ORG.domain}</p><button class="btn btn-secondary" onclick="navigate('#/helpdesk/active-directory')">Open directory</button></div></div><div class="card"><div class="card-header"><strong>Endpoints</strong></div><div class="card-body"><h2>${hdComputers().length} Windows devices</h2><p>Managed Windows 11 laptops and workstations</p><button class="btn btn-secondary" onclick="navigate('#/helpdesk/windows')">Open endpoints</button></div></div><div class="card"><div class="card-header"><strong>Infrastructure</strong></div><div class="card-body"><h2>${hdServers().length} servers</h2><p>AD DS, DNS, DHCP, file, print, and applications</p><button class="btn btn-secondary" onclick="navigate('#/helpdesk/server-manager')">Open servers</button></div></div></div><div class="card"><div class="card-header"><strong>Support model</strong></div><div class="table-wrap"><table><thead><tr><th>Tier</th><th>Owner</th><th>Typical scope</th></tr></thead><tbody>${HD_ORG.supportTiers.map(t=>`<tr><td><strong>${t.tier}</strong></td><td>${t.owner}</td><td>${t.scope}</td></tr>`).join('')}</tbody></table></div></div><div class="card"><div class="card-header"><strong>SLA model</strong></div><div class="table-wrap"><table><thead><tr><th>Priority</th><th>Response</th><th>Resolution target</th><th>Use when</th></tr></thead><tbody>${HD_ORG.slas.map(s=>`<tr><td>${hdBadge(s.priority,s.priority.toLowerCase())}</td><td>${s.response}</td><td>${s.resolve}</td><td>${s.use}</td></tr>`).join('')}</tbody></table></div></div>`;

/* ---------- Prove It ticket ----------
 * One assigned ticket, worked with no coach and no feedback: the student sets
 * the ticket fields, chooses a diagnosis from a shuffled list and the steps
 * they took from a shuffled mixed pool, decides Resolve or Escalate and
 * writes the resolution note and the reply to the user. Nothing here says
 * which choice is right; scoring is not in the simulator. */
function hdProveSetField(field, value) {
  if (hdProveLocked() || !['category','type','priority'].includes(field)) return;
  hdState.prove.fields[field] = String(value || '');
  hdProveEdited();
  hdSave();
  hdProveSyncSubmit();
}
function hdProveChoose(field, value) {
  if (hdProveLocked() || !['diagnosis','decision'].includes(field)) return;
  hdState.prove[field] = String(value || '');
  hdProveEvent(field === 'diagnosis' ? 'diagnosis_chosen' : 'decision_chosen', { value:hdState.prove[field] });
  hdProveEdited();
  hdSave();
  hdProveSyncSubmit();
}
function hdProveToggleStep(id, checked) {
  const ticket = hdState.tickets[0];
  if (hdProveLocked() || !ticket || !ticket.pathPool.some(step => step.id === id)) return;
  const steps = new Set(hdState.prove.steps);
  if (checked) steps.add(id); else steps.delete(id);
  hdState.prove.steps = hdState.prove.order.path.filter(stepId => steps.has(stepId));
  hdProveEvent(checked ? 'step_chosen' : 'step_cleared', { step:id });
  hdProveEdited();
  hdSave();
}
// Typing is saved, not recorded as events.
function hdProveText(field, value) {
  if (hdProveLocked() || !['resolutionNote','userReply'].includes(field)) return;
  hdState.prove[field] = String(value || '').slice(0, 4000);
  hdProveEdited();
  hdSave();
  hdProveSyncSubmit();
}
// The work the portal receives on Submit: the ticket fields, choices, writing,
// commands, events and the machine's end state. stepTexts: the portal doesn't
// load this simulator's data, so the instructor reads the steps from here.
function hdProvePackage() {
  if (!HD_PROVE || !hdState.prove) return null;
  const prove = hdState.prove;
  const ticket = hdState.tickets[0];
  const shift = HD_PROVE.shift;
  return {
    version:1, kind:'hdesk-prove', moduleKey:HD_PROVE.moduleKey, labKey:shift.labKey, rubricVersion:shift.rubricVersion,
    ticketId:ticket.id, startedAt:prove.startedAt,
    fields:{ ...prove.fields }, diagnosis:prove.diagnosis, steps:prove.steps.slice(),
    stepTexts:prove.steps.map(id => (ticket.pathPool.find(step => step.id === id) || {}).text || ''), decision:prove.decision,
    resolutionNote:prove.resolutionNote, userReply:prove.userReply,
    workNotes:ticket.notes.map(note => note.text),
    commands:prove.events.filter(event => event.type === 'command_run').map(event => ({ command:event.command, computer:event.computer, at:event.at })),
    events:prove.events.slice(),
    machine:hdClone(hdMachine(shift.selectedComputer) || {}),
    passwordTyped:prove.passwordTyped === true,
  };
}

// Which required parts are still empty. Completeness only: nothing here looks
// at what was chosen or written, so it can never hint at what is right.
function hdProveMissing() {
  const prove = hdState.prove;
  return [
    ['category', prove.fields.category], ['type', prove.fields.type], ['priority', prove.fields.priority],
    ['diagnosis', prove.diagnosis], ['decision', prove.decision],
    ['resolution note', prove.resolutionNote], ['reply to the user', prove.userReply],
  ].filter(([, value]) => !String(value || '').trim()).map(([name]) => name);
}

// Submit's handoff follows the coach's Finish (ui/coach.js finishWithReceipt):
// a message to the portal tab that opened this one, and only a reply with this
// message's nonce, from that tab and the portal's origin, counts. Every other
// outcome keeps the work and leaves Submit available.
const HD_PROVE_REPLY_MS = 10000;
const HD_PROVE_NOTICES = {
  closed: 'Your course page is closed, so this page can\'t check or send your work. Your work is still here. Reopen the Prove It from your course page.',
  'signed-out': 'You\'re signed out on your course page, so this page can\'t check or send your work. Your work is still here. Sign in on your course page, then press Submit.',
  'other-student': 'Your course page is signed in as a different student, so this page can\'t check or send your work. Your work is still here. Sign in as yourself on your course page, then press Submit.',
  unreadable: 'Your course page couldn\'t reach the server. Your work is still here. Check your connection, then press Submit.',
  invalid: 'Your course page couldn\'t accept this work, so it wasn\'t saved. Your work is still here. Reload your course page, reopen the Prove It from there, then press Submit.',
  'too-large': 'Your work notes are too long to send, so they weren\'t saved. Your work is still here. Shorten them, then press Submit.',
  'save-failed': 'Your work wasn\'t saved. Your work is still here. Check your connection, then press Submit.',
  unconfirmed: 'Your course page didn\'t confirm it has your work. Your work is still here. Make sure you\'re signed in on your course page, then press Submit.',
};
function hdPortalOrigin() {
  return ['127.0.0.1', 'localhost'].includes(location.hostname) ? `${location.protocol}//${location.hostname}:8768` : location.origin;
}
function hdProveAsk(type, extra, done) {
  const opener = window.opener && !window.opener.closed ? window.opener : null;
  if (!opener) { done({ reason:'closed' }); return; }
  const origin = hdPortalOrigin();
  const nonce = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  let timer = 0;
  const finish = reply => { clearTimeout(timer); window.removeEventListener('message', onReply); done(reply); };
  function onReply(event) {
    const data = event.data;
    if (event.source !== opener || event.origin !== origin) return;
    if (!data || data.type !== 'mnt-prove-received' || data.id !== HD_PROVE.moduleKey || data.nonce !== nonce) return;
    finish(data);
  }
  window.addEventListener('message', onReply);
  timer = setTimeout(() => finish({ reason:'unconfirmed' }), HD_PROVE_REPLY_MS);
  opener.postMessage({ type, id:HD_PROVE.moduleKey, nonce, student:HD_PROVE.student, ...extra }, origin);
}
// A returned attempt reopens with what the student last submitted, so signing
// out or changing device doesn't empty the form. Only over a draft older than
// that attempt: newer work in this browser stays. Values the ticket no longer
// offers stay empty, and Submit asks for them.
function hdProvePrefill(work) {
  const prove = hdState.prove;
  const ticket = hdState.tickets[0];
  const submitted = Date.parse(work && work.completedAt);
  if (!prove || !ticket || work.ticketId !== ticket.id || !submitted) return false;
  if (prove.editedAt && Date.parse(prove.editedAt) > submitted) return false;
  const fields = work.fields || {};
  const offered = (value, options) => (options.includes(value) ? value : '');
  const steps = Array.isArray(work.steps) ? work.steps : [];
  prove.fields = {
    category:offered(fields.category, ticket.categoryOptions), type:offered(fields.type, ticket.typeOptions),
    priority:offered(fields.priority, ['P1','P2','P3','P4']),
  };
  prove.diagnosis = offered(work.diagnosis, prove.order.diagnosis);
  prove.decision = offered(work.decision, ['Resolve','Escalate']);
  prove.steps = prove.order.path.filter(id => steps.includes(id));
  prove.resolutionNote = String(work.resolutionNote || '').slice(0, 4000);
  prove.userReply = String(work.userReply || '').slice(0, 4000);
  ticket.notes = (Array.isArray(work.workNotes) ? work.workNotes : []).map(text => ({ time:'Earlier attempt', author:'Riley Morgan', text:String(text) }));
  hdSave();
  return true;
}
function hdProveApply(reply) {
  const wasLocked = hdProveLocked();
  hdProveServer.sending = false;
  if (reply.status) hdProveServer.status = reply.status;
  else if (hdProveServer.status === 'checking') hdProveServer.status = 'unknown';
  hdProveServer.notice = hdProveLocked() || !reply.reason ? '' : HD_PROVE_NOTICES[reply.reason] || HD_PROVE_NOTICES.unconfirmed;
  const prefilled = reply.status === 'returned' && reply.lastWork && hdProvePrefill(reply.lastWork);
  if (prefilled || hdProveLocked() !== wasLocked) render(); else hdProveSyncSubmit();
}
function hdProveSubmit() {
  if (hdProveLocked() || hdProveServer.sending || hdProveServer.status === 'checking' || hdProveMissing().length) return;
  // A note typed but not yet added is part of the work.
  const note = document.getElementById('hd-note-input');
  if (note && note.value.trim()) hdAddNote(hdState.tickets[0].id);
  hdProveServer.sending = true;
  hdProveServer.notice = '';
  hdProveSyncSubmit();
  hdProveAsk('mnt-prove-submit', { work:hdProvePackage() }, hdProveApply);
}
// What Submit shows now. Typing doesn't re-render the page, so this also
// updates the button in place (hdProveSyncSubmit).
function hdProveSubmitState() {
  const label = hdProveServer.status === 'returned' ? 'Resubmit for faculty review' : 'Submit for faculty review';
  if (hdProveServer.status === 'checking') return { enabled:false, label, note:'Checking your attempt…' };
  if (hdProveServer.sending) return { enabled:false, label, note:'Sending your work…' };
  const missing = hdProveMissing();
  const parts = [
    hdProveServer.status === 'returned' ? 'Your instructor returned this Prove It. Their notes are on your course page.' : '',
    hdProveServer.notice,
    missing.length ? `Still needed: ${missing.join(', ')}.` : '',
  ];
  return { enabled:!missing.length, label, note:parts.filter(Boolean).join(' ') };
}
function hdProveSyncSubmit() {
  const button = document.getElementById('hd-prove-submit');
  const note = document.getElementById('hd-prove-submit-note');
  if (!button || !note) return;
  const state = hdProveSubmitState();
  button.disabled = !state.enabled;
  button.setAttribute('aria-disabled', String(!state.enabled));
  button.setAttribute('style', state.enabled ? '' : HD_PROVE_SUBMIT_OFF);
  button.textContent = state.label;
  note.textContent = state.note;
}
function hdProveSubmitCard() {
  if (hdProveServer.status === 'passed') return '<p role="status"><strong>Reviewed by your instructor</strong> Your course page has the result.</p>';
  if (hdProveLocked()) return '<p role="status"><strong>Submitted for faculty review</strong> Your instructor has your work. This page only shows this browser\'s copy.</p>';
  const state = hdProveSubmitState();
  return `<button id="hd-prove-submit" class="btn btn-primary" onclick="hdProveSubmit()" ${state.enabled ? '' : `disabled aria-disabled="true" style="${HD_PROVE_SUBMIT_OFF}"`}>${hdEsc(state.label)}</button><p id="hd-prove-submit-note" class="muted" role="status">${hdEsc(state.note)}</p>`;
}

// Inline styles keep these Prove-only: the card header's note gets its
// space, a choice has no number column and a neutral selected outline (the
// shared step list turns a ticked step green, which reads as "correct"), and
// the unavailable Submit looks it.
const HD_PROVE_HEADER = 'style="display:flex;flex-wrap:wrap;align-items:baseline;gap:8px"';
function hdProveChoiceStyle(selected) {
  return `grid-template-columns:18px 1fr;background:#fff;color:inherit;${selected
    ? 'border-color:var(--workload);box-shadow:inset 0 0 0 1px var(--workload)'
    : 'border-color:var(--border);box-shadow:none'}`;
}
// Restyles a choice (and, for a radio, its group) as soon as it changes.
function hdProveMark(input) {
  const group = input.type === 'radio' ? document.querySelectorAll(`input[name="${input.name}"]`) : [input];
  group.forEach(item => { const label = item.closest('label'); if (label) label.setAttribute('style', hdProveChoiceStyle(item.checked)); });
}
const HD_PROVE_SUBMIT_OFF = 'background:#d0d5dd;border-color:#d0d5dd;color:#475467;cursor:not-allowed';
function hdProveSelect(field, label, options, value, locked) {
  return `<label>${hdEsc(label)}<select class="select" ${locked ? 'disabled' : ''} onchange="hdProveSetField('${field}',this.value)"><option value="">Choose…</option>${options.map(option => `<option ${option === value ? 'selected' : ''}>${hdEsc(option)}</option>`).join('')}</select></label>`;
}
function hdProveTicketView(ticket) {
  const prove = hdState.prove;
  const locked = hdProveLocked();
  const off = locked ? 'disabled' : '';
  const steps = prove.order.path.map(id => ticket.pathPool.find(step => step.id === id)).filter(Boolean);
  return `${hdPageHeader(ticket.id, ticket.title, `<button class="btn btn-secondary" onclick="navigate('#/helpdesk/tickets')">← Queue</button>`)}
    <div class="callout info"><strong>Prove It.</strong> Work this ticket on your own: there is no coach and no feedback before you submit. Your instructor reviews your work.</div>
    <div class="hd-ticket-layout">
      <div class="hd-ticket-main">
        <div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Requester statement</strong>${hdBadge(ticket.status)}</div><div class="card-body"><blockquote class="hd-request">${hdEsc(ticket.description)}</blockquote><div class="hd-field-grid"><div><span>Requester</span><strong>${hdEsc(ticket.requester)}</strong></div><div><span>Title</span><strong>${hdEsc(ticket.requesterTitle)}</strong></div><div><span>Department</span><strong>${hdEsc(ticket.department)}</strong></div><div><span>Device</span><strong>${hdEsc(ticket.device)}</strong></div><div><span>CC</span><strong>${hdEsc(ticket.cc)}</strong></div><div><span>Created</span><strong>${new Date(ticket.createdTimestamp).toLocaleString()}</strong></div><div><span>Assigned technician</span><strong>${hdEsc(ticket.assignedTechnician)}</strong></div></div></div></div>
        <div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Ticket replies</strong></div><div class="card-body hd-note-list">${ticket.conversation.map(reply => `<div><strong>${hdEsc(reply.from)} · ${hdEsc(reply.role)}</strong><p>${hdEsc(reply.text)}</p></div>`).join('')}</div></div>
        <div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Your diagnosis</strong></div><div class="card-body"><select id="hd-prove-diagnosis" class="select" ${off} onchange="hdProveChoose('diagnosis',this.value)"><option value="">Choose what this ticket is…</option>${prove.order.diagnosis.map(value => `<option ${prove.diagnosis === value ? 'selected' : ''}>${hdEsc(value)}</option>`).join('')}</select></div></div>
        <div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Steps you took</strong><span class="muted">Select every step you actually took.</span></div><div class="card-body"><div class="hd-path">${steps.map(step => `<label style="${hdProveChoiceStyle(prove.steps.includes(step.id))}"><input type="checkbox" ${off} onchange="hdProveToggleStep('${step.id}',this.checked);hdProveMark(this)" ${prove.steps.includes(step.id) ? 'checked' : ''}>${hdEsc(step.text)}</label>`).join('')}</div></div></div>
        <div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Your decision</strong></div><div class="card-body"><div class="hd-path">${['Resolve','Escalate'].map(value => `<label style="${hdProveChoiceStyle(prove.decision === value)}"><input type="radio" name="hd-prove-decision" ${off} onchange="hdProveChoose('decision','${value}');hdProveMark(this)" ${prove.decision === value ? 'checked' : ''}>${value}</label>`).join('')}</div></div></div>
        <div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Resolution note</strong><span class="muted">What you did, what it proved, and the outcome.</span></div><div class="card-body"><textarea id="hd-prove-resolution" class="ipt hd-note-input" rows="7" maxlength="4000" ${off} oninput="hdProveText('resolutionNote',this.value)">${hdEsc(prove.resolutionNote)}</textarea></div></div>
        <div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Reply to the user</strong><span class="muted">Written to ${hdEsc(ticket.requester)}, in your own words.</span></div><div class="card-body"><textarea id="hd-prove-reply" class="ipt hd-note-input" rows="7" maxlength="4000" ${off} oninput="hdProveText('userReply',this.value)">${hdEsc(prove.userReply)}</textarea></div></div>
        <div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Work notes</strong><span class="muted">Facts, commands, results, interpretation, next action.</span></div><div class="card-body"><div class="hd-note-list">${ticket.notes.length ? ticket.notes.map(note => `<div><strong>${hdEsc(note.author)} · ${hdEsc(note.time)}</strong><p>${hdEsc(note.text)}</p></div>`).join('') : '<p class="muted">No technician notes yet.</p>'}</div>${locked ? '' : `<textarea id="hd-note-input" class="ipt hd-note-input" rows="7" maxlength="2000" placeholder="Document the action you took and what the result proved…"></textarea><button class="btn btn-secondary" onclick="hdAddNote('${ticket.id}')">Add work note</button>`}</div></div>
      </div>
      <aside class="hd-ticket-side">
        <div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Ticket fields</strong></div><div class="card-body hd-control-stack">${hdProveSelect('category', 'Category', ticket.categoryOptions, prove.fields.category, locked)}${hdProveSelect('type', 'Type', ticket.typeOptions, prove.fields.type, locked)}${hdProveSelect('priority', 'Priority', ['P1','P2','P3','P4'], prove.fields.priority, locked)}</div></div>
        <div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Submit</strong></div><div class="card-body hd-control-stack">${hdProveSubmitCard()}</div></div>
      </aside>
    </div>`;
}
window.hdProveSetField=hdProveSetField; window.hdProveChoose=hdProveChoose; window.hdProveToggleStep=hdProveToggleStep;
window.hdProveText=hdProveText; window.hdProvePackage=hdProvePackage; window.hdProveMark=hdProveMark; window.hdProveSubmit=hdProveSubmit;

// Opening an evidence screen is recorded once per screen. Each load asks the
// portal for this attempt's status on the server.
if (HD_PROVE) {
  if (!HD_PROVE.blocked) hdProveAsk('mnt-prove-status', {}, hdProveApply);
  const HD_PROVE_EVIDENCE_ROUTES = {
    'helpdesk/directory':'User Directory', 'helpdesk/active-directory':'Active Directory', 'helpdesk/windows':'Windows Desktop',
    'helpdesk/event-viewer':'Event Viewer', 'helpdesk/remote-support':'Remote Support', 'helpdesk/server-manager':'Server Manager',
    'helpdesk/group-policy':'Group Policy', 'helpdesk/file-server':'File Server', 'helpdesk/printers':'Printer Management',
    'helpdesk/knowledge-base':'Knowledge Base',
  };
  Object.entries(HD_PROVE_EVIDENCE_ROUTES).forEach(([route, label]) => {
    const view = VIEWS[route];
    if (typeof view === 'function') VIEWS[route] = (...args) => { hdProveOpened(`screen:${route}`, label); return view(...args); };
  });
}

window.hdSelectTicket=hdSelectTicket; window.hdSetQueueFilter=hdSetQueueFilter; window.hdSetPriorityFilter=hdSetPriorityFilter;
window.hdAssignTicket=hdAssignTicket; window.hdTransitionTicket=hdTransitionTicket; window.hdSetTicketPriority=hdSetTicketPriority;
window.hdAddNote=hdAddNote; window.hdContactRequester=hdContactRequester; window.hdSubmitDiagnosis=hdSubmitDiagnosis; window.hdResolveTicket=hdResolveTicket;
window.hdLinkProblem=hdLinkProblem; window.hdResetShift=hdResetShift; window.hdOpenUser=hdOpenUser;
window.hdSetAdTab=hdSetAdTab; window.hdAdAction=hdAdAction; window.hdSelectComputer=hdSelectComputer;
window.hdRunPowerShell=hdRunPowerShell; window.hdPrinterAction=hdPrinterAction;
window.hdSetEventFilter=hdSetEventFilter; window.hdClearEventFilter=hdClearEventFilter; window.hdM01Identity=hdM01Identity;
window.hdM01Hint=hdM01Hint; window.hdM01AdLockoutDetails=hdM01AdLockoutDetails;

// HD-2101 Practice: FinanceReportSync runs on its schedule while the page is
// open. A re-render would wipe text the student is typing, so a run then only
// shows its message; the page catches up on the next action.
if (!HD_PROVE && typeof setInterval === 'function') {
  setInterval(() => {
    const run = hdM01Tick();
    if (!run) return;
    hdSave();
    const active = typeof document !== 'undefined' ? document.activeElement : null;
    if (active && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName || '') && active.value) return;
    // Keep the student's place: a redraw the student didn't ask for mustn't
    // jump the page back to the top.
    const content = typeof document !== 'undefined' && document.getElementById ? document.getElementById('content') : null;
    const top = content ? content.scrollTop : 0;
    render();
    if (content) content.scrollTop = top;
  }, 5000);
}
