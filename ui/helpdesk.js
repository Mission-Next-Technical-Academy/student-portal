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
/* ServiceNow-style tickets (Module 2 on), switched on per ticket by
 * `console.matrix` (see "Queue and matrix features" below). Older tickets
 * keep HD_STATUSES, HD_STATUS_NEXT and hdSlaMinutes exactly as they were.
 * Defined up here because hdLoadState runs while the file loads. */
const HD_SN_STATUSES = ['New', 'In Progress', 'On Hold', 'Escalated', 'Resolved', 'Closed', 'Canceled'];
const HD_SN_STATUS_NEXT = {
  'New':['In Progress', 'Canceled'],
  'In Progress':['On Hold', 'Resolved', 'Canceled'],
  'On Hold':['In Progress', 'Resolved'],
  'Escalated':['In Progress', 'Resolved'],
  'Resolved':['In Progress', 'Closed'],
  'Closed':[],
  'Canceled':[],
};
const HD_HOLD_REASONS = ['Awaiting Caller', 'Awaiting Change', 'Awaiting Problem', 'Awaiting Vendor'];
// The Impact × Urgency lookup (spec section 5): row impact 1-3, column urgency 1-3.
const HD_PRIORITY_MATRIX = { '1':{ '1':'P1', '2':'P2', '3':'P3' }, '2':{ '1':'P2', '2':'P3', '3':'P4' }, '3':{ '1':'P3', '2':'P4', '3':'P5' } };
const HD_PRIORITY_NAMES = { P1:'Critical', P2:'High', P3:'Moderate', P4:'Low', P5:'Planning' };
const HD_IMPACT_LABELS = { '1':'1 – High', '2':'2 – Medium', '3':'3 – Low' };
// Northstar SLA targets in minutes. P1 and P2 count clock minutes; P3 to P5
// count business minutes (08:00 to 17:00 UTC, Monday to Friday; one
// business day is 540). P5 resolves "by agreement": no resolve target.
const HD_SN_SLA = {
  P1:{ respond:15, resolve:240, business:false },
  P2:{ respond:30, resolve:480, business:false },
  P3:{ respond:240, resolve:1080, business:true },
  P4:{ respond:540, resolve:2700, business:true },
  P5:{ respond:1080, resolve:0, business:true },
};
const HD_BUSINESS_START = 8 * 60;
const HD_BUSINESS_END = 17 * 60;
// Assignment groups at Northstar (spec section 5).
const HD_ASSIGNMENT_GROUPS = ['Service Desk (Tier 1)', 'Desktop Support (Tier 2)', 'Network Operations', 'Server & Identity', 'Messaging & Collaboration', 'Security Operations (SOC)', 'Facilities'];
const HD_SERVICE_DESK = 'Service Desk (Tier 1)';
const HD_CONTACT_METHODS = ['Phone – voicemail left', 'Phone – no answer', 'Phone – reached the caller', 'Customer comment (Additional comments)', 'Email'];
const HD_NO_RESPONSE_CODE = 'No response from caller';
const HD_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HD_DIAGNOSIS_OVERRIDES = {
  'HD-2151':'Forgotten password: nothing is broken',
  'HD-2152':'Physical damage: a Tier 2 repair',
  'SEC-2153':'Social engineering: someone is trying to talk you into handing over an account',
  'HD-2154':'The printer is missing from her laptop: nothing is broken',
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
// A practice set (?practice=<key>&student=<id>, HD_PRACTICE_SETS): a module's
// unguided practice tickets, not graded. Only its tickets, no coach, and its
// own saved state per student, so it never replaces the shift a coached lab
// is using in the same browser. The only thing sent to the portal is that
// every ticket is closed (hdPracticeReport): no answers, no score.
const HD_PRACTICE_SET = (() => {
  if (HD_PROVE || typeof HD_PRACTICE_SETS === 'undefined') return null;
  const params = new URLSearchParams(location.search);
  const key = params.get('practice');
  if (!key || !Object.prototype.hasOwnProperty.call(HD_PRACTICE_SETS, key)) return null;
  // ui/coach.js removes student= from the address once the page loads, so a
  // reload of this tab finds the student id in the tab's sessionStorage.
  const remembered = `defender-lab.helpdesk.practice.student.${key}`;
  let student = (params.get('student') || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
  try {
    if (student) sessionStorage.setItem(remembered, student);
    else student = (sessionStorage.getItem(remembered) || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
  } catch (_) { /* storage blocked: this load only */ }
  return { key, student, set: HD_PRACTICE_SETS[key] };
})();
function hdStateKey() {
  if (HD_PRACTICE_SET) return `defender-lab.helpdesk.practice.v1.${HD_PRACTICE_SET.key}${HD_PRACTICE_SET.student ? `.${HD_PRACTICE_SET.student}` : ''}`;
  return HD_PROVE ? `defender-lab.helpdesk.prove.v1.${HD_PROVE.moduleKey}.${HD_PROVE.student}` : HD_STATE_KEY;
}
// Also carries the practice set's completion notice (hdPracticeNotice).
function hdProveBlockedNotice() {
  return HD_PROVE && HD_PROVE.blocked
    ? '<div class="callout warning" role="alert"><strong>This Prove It wasn\'t opened from your course page, so it can\'t be saved.</strong> Open it from your course page.</div>'
    : hdPracticeNotice();
}

// A practice set reports to the course page that opened it once every one of
// its tickets is closed (Resolved or Escalated): the ticket ids only, no
// answers and no score. The course page saves a completion record and always
// answers (mnt-practice-received). Once it confirms, the shift remembers it
// (practiceSaved) and never sends again; until then the notice offers a retry.
const HD_PRACTICE_REPLY_MS = 10000;
const HD_PRACTICE_RETRY = 'Your completion wasn\'t saved. Make sure your course page is open and you\'re signed in, then press Save my completion.';
const HD_PRACTICE_REASONS = {
  closed: 'Your course page isn\'t open, so your completion wasn\'t saved. Open the practice tickets again from your course page, then press Save my completion.',
  'signed-out': 'You\'re signed out on your course page, so your completion wasn\'t saved. Sign in there, then press Save my completion.',
  'no-student': 'These tickets weren\'t opened from your course page, so your completion can\'t be saved. Open them from your course page.',
  'other-student': 'These tickets were opened for a different student, so your completion wasn\'t saved. Open them from your own course page.',
};
let hdPracticeSending = false;
// The State (and On Hold reason) chosen but not yet applied, per ticket:
// { state, hold }. A redraw (resolution code, Impact, Urgency...) keeps it.
// Kept in memory only, never saved, so a reload, a reset or opening a ticket
// again shows the ticket's real State.
let hdPendingState = {};
function hdPracticeClosed() {
  if (!HD_PRACTICE_SET || !hdState || !Array.isArray(hdState.tickets)) return false;
  // complete: the tickets the set needs closed (Module 2 keeps 2-B's related
  // tickets in the set without requiring them); otherwise every ticket.
  const needed = Array.isArray(HD_PRACTICE_SET.set.complete) ? HD_PRACTICE_SET.set.complete : HD_PRACTICE_SET.set.tickets;
  // done: { id:[rule] } (Module 3 on): a ticket that never closes counts as
  // done when every rule holds (hdConsoleRule), in place of the state test.
  const done = HD_PRACTICE_SET.set.done && typeof HD_PRACTICE_SET.set.done === 'object' ? HD_PRACTICE_SET.set.done : {};
  return needed.every(id => {
    const ticket = hdState.tickets.find(item => item.id === id);
    if (ticket && Array.isArray(done[id]) && done[id].length) return done[id].every(rule => hdConsoleRule(ticket, rule));
    // A converted incident (Canceled – Converted) is closed too.
    return Boolean(ticket && (['Resolved', 'Escalated'].includes(ticket.status) || (ticket.status === 'Canceled' && ticket.cancelReason === 'Converted')));
  });
}
function hdPracticeReport() {
  if (!hdPracticeClosed() || hdState.practiceSaved === true || hdPracticeSending) return;
  const done = reply => {
    hdPracticeSending = false;
    if (reply && reply.saved === true) { hdState.practiceSaved = true; hdState.practiceReason = ''; }
    else hdState.practiceReason = (reply && reply.reason) || 'unconfirmed';
    hdSave(); render();
  };
  const opener = window.opener && !window.opener.closed ? window.opener : null;
  if (!opener) { done({ reason:'closed' }); return; }
  const origin = hdPortalOrigin();
  const nonce = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  let timer = 0;
  function onReply(event) {
    const data = event.data;
    if (event.source !== opener || event.origin !== origin) return;
    if (!data || data.type !== 'mnt-practice-received' || data.id !== HD_PRACTICE_SET.key || data.nonce !== nonce) return;
    clearTimeout(timer); window.removeEventListener('message', onReply); done(data);
  }
  window.addEventListener('message', onReply);
  timer = setTimeout(() => { window.removeEventListener('message', onReply); done({ reason:'unconfirmed' }); }, HD_PRACTICE_REPLY_MS);
  hdPracticeSending = true;
  render();
  opener.postMessage({ type:'mnt-practice-complete', id:HD_PRACTICE_SET.key, nonce, student:HD_PRACTICE_SET.student, tickets:(Array.isArray(HD_PRACTICE_SET.set.complete) ? HD_PRACTICE_SET.set.complete : HD_PRACTICE_SET.set.tickets).slice() }, origin);
}
function hdPracticeNotice() {
  if (!HD_PRACTICE_SET || !hdState) return '';
  if (hdState.practiceSaved === true) return '<div class="callout success" role="status" data-hd-practice-notice="saved"><strong>Practice complete (not graded).</strong> Your course page saved that you finished every ticket in this set. No score and no answers were sent.</div>';
  if (!hdPracticeClosed()) return '';
  if (hdPracticeSending) return '<div class="callout info" role="status" data-hd-practice-notice="sending">You’ve finished every ticket. Saving your completion to your course page…</div>';
  const reason = HD_PRACTICE_REASONS[hdState.practiceReason] || HD_PRACTICE_RETRY;
  return `<div class="callout warning" role="alert" data-hd-practice-notice="unsaved"><strong>You’ve finished every ticket, but your completion isn’t saved yet.</strong> ${hdEsc(reason)} <button type="button" class="btn btn-primary btn-sm" onclick="hdPracticeReport()">Save my completion</button></div>`;
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
  // A machine added to the fixtures later (NS-LT-0188, 2026-11-15) reaches a
  // shift saved before it.
  Object.keys(HD_PRACTICE_MACHINES).forEach(name => { if (!state.machines[name]) state.machines[name] = hdClone(HD_PRACTICE_MACHINES[name]); });
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

// The shared Practice shift's templates: every Practice ticket except those
// a ticket set keeps to itself (ownSet: true, e.g. Module 2's guided queue),
// which open only in the set that lists them (hdFreshSetState).
function hdSharedTemplates() { return HD_TICKET_TEMPLATES.filter(template => template.ownSet !== true); }
// Practice shifts are built from HD_TICKET_TEMPLATES only; a Prove shift
// passes its own tickets (hdFreshProveState). `practice` (default: any list
// of Practice templates) adds the Practice machines, scenarios and locked
// accounts.
function hdFreshState(templates = hdSharedTemplates(), practice = templates.every(t => HD_TICKET_TEMPLATES.includes(t))) {
  const seed = Math.floor(Math.random() * 0x7fffffff) || 8172026;
  const independent = templates.filter(t => !t.correlationKey);
  const correlated = templates.filter(t => t.correlationKey);
  const tickets = hdSeededOrder([...independent, ...correlated], seed).map((ticket, index) => ({
    ...hdClone(ticket),
    // createdAt: an exact shift time (a ticket set's SLA ages are exact);
    // otherwise minutes before HD_SHIFT_NOW, a little apart per ticket.
    createdTimestamp: ticket.createdAt ? new Date(ticket.createdAt).toISOString() : new Date(HD_SHIFT_NOW.getTime() - (ticket.createdMinutesAgo + (index % 4)) * 60000).toISOString(),
    troubleshootingHistory: [{ time:'Created', action:'Ticket received from monitoring, portal, phone, or email intake.' }],
    diagnosis:'', diagnosisCorrect:false, linkedProblem:'', checkedSteps:[],
  }));
  // Matrix fields only on a Practice shift: a Prove ticket never gets them.
  if (practice) tickets.forEach(hdMatrixStart);
  const state = {
    version:1, seed, tickets, selectedTicketId:tickets[0].id,
    queueFilter:'Open', priorityFilter:'All', adTab:'users', selectedUserId:'u-1005',
    selectedComputer:'NS-LT-0131', selectedServer:'NS-PRINT01',
    userOverrides:{}, computerOverrides:{}, printerOverrides:{},
    powershell:[{ type:'system', text:'Northstar Enterprise Support Shell · training subset\nType Get-Help to list supported commands.' }],
  };
  // A console ticket's account starts in the state its ticket describes.
  if (practice) {
    templates.forEach(template => {
      const account = template.console && template.console.account;
      if (account && account.locked) state.userOverrides[account.userId] = { ...(state.userOverrides[account.userId] || {}), locked:true };
    });
  }
  // Only a Practice shift gets the Practice scenarios (and the tickets'
  // own machine state, console.machines).
  return practice ? hdSeedTicketMachines(hdEnsurePractice(state)) : state;
}
// A shift with only a set's tickets, built from every Practice template so
// a set's own (ownSet) tickets are there. A set with `now` runs on its own
// fixed clock (hdShiftNow), which only "Next day" moves.
function hdFreshSetState(set) {
  const state = hdFreshState(HD_TICKET_TEMPLATES, true);
  state.tickets = state.tickets.filter(ticket => set.tickets.includes(ticket.id));
  // Machine state from this set's tickets only (console.machines).
  state.machines = hdClone(HD_PRACTICE_MACHINES); delete state.vdi;
  hdSeedTicketMachines(state);
  state.selectedTicketId = state.tickets[0] ? state.tickets[0].id : null;
  if (set.now) state.clockNow = new Date(set.now).toISOString();
  return state;
}
// A fresh practice-set shift: the Practice shift with only the set's tickets.
function hdFreshPracticeSetState() {
  const state = hdFreshSetState(HD_PRACTICE_SET.set);
  state.practiceSet = HD_PRACTICE_SET.key;
  return state;
}
// A coached ticket set (HD_COACHED_SETS, e.g. Module 2's guided queue): a
// coach's resetState calls hdUseTicketSet(key) to replace the shared shift
// with only the set's tickets, on the set's clock. Saved under the shared
// key, as a narrowed Module 1 shift is; hdActiveSet() drops the set's clock
// and queue tools as soon as another coach's reset swaps the tickets.
function hdCoachedSets() { return typeof HD_COACHED_SETS === 'undefined' ? {} : HD_COACHED_SETS; }
function hdUseTicketSet(key) {
  if (HD_PROVE || HD_PRACTICE_SET || !Object.prototype.hasOwnProperty.call(hdCoachedSets(), key)) return false;
  const fresh = hdFreshSetState(hdCoachedSets()[key]);
  fresh.ticketSet = key;
  fresh.selectedTicketId = null;
  hdState = fresh; hdPendingState = {};
  hdSave();
  if (typeof render === 'function') render();
  return true;
}
// A Prove ticket's pre-set fields (Module 1: set for the student, read-only,
// never scored), or null when the student sets them.
function hdProvePreset() {
  const ticket = HD_PROVE && (HD_PROVE.shift.tickets || [])[0];
  return ticket && ticket.preset ? { category:'', type:'', priority:'', ...ticket.preset } : null;
}
// The one-ticket Prove shift's ticket as the shift data gives it, or null.
function hdProveSpec() { return HD_PROVE && !hdProveQueue() ? (HD_PROVE.shift.tickets || [])[0] || null : null; }
// Module 3's ticket fields: the student sets Class, Category, Impact, Urgency
// (Priority calculates) and the assignment group. Module 1 keeps Category,
// Type and Priority.
function hdProveMatrix() { const spec = hdProveSpec(); return !!(spec && spec.matrix === true); }
const HD_PROVE_MATRIX_FIELDS = ['ticketClass', 'category', 'impact', 'urgency', 'group'];
// The writing boxes a Prove ticket may add, beyond the work note and reply.
const HD_PROVE_EXTRA_TEXT = ['keyFinding', 'kbDraft'];
function hdProveEmptyFields() {
  return hdProveMatrix() ? { ticketClass:'', category:'', impact:'', urgency:'', priority:'', group:'' } : { category:'', type:'', priority:'' };
}
// Module 3's extra writing boxes (writing: { keyFinding, kbDraft }), each
// with its label, hint, rows and limit. Module 1 has none.
function hdProveWriting() { const spec = hdProveSpec(); return spec && spec.writing && typeof spec.writing === 'object' ? spec.writing : {}; }
function hdProveLabels() {
  const spec = hdProveSpec();
  return { resolutionNote:'Work notes', resolutionHint:'Reported / Tried / Result (+ Next action if it stays open or goes to another team)', userReply:'Reply to the user', ...((spec && spec.labels) || {}) };
}
// A fresh Prove shift: the Practice shift builder with the module's own
// tickets, fixtures and machine state. Ticket fields start empty (the student
// sets them) unless the ticket pre-sets them, and the option lists are
// shuffled per attempt.
function hdFreshProveState() {
  // A queue shift (Module 2) has no single ticket, diagnosis or step pool.
  if (HD_PROVE.shift.queue === true) return hdFreshProveQueueState();
  const shift = HD_PROVE.shift;
  const state = hdFreshState(shift.tickets);
  const requester = HD_USERS.find(user => user.name === shift.tickets[0].requester);
  state.tickets.forEach(ticket => { ticket.priority = ''; ticket.category = ''; ticket.subcategory = ''; ticket.notes = []; });
  const ticket = state.tickets[0];
  // Module 3: the ticket's own clock times, and no SLA text or business impact
  // that could show before the student sets the fields.
  if (ticket.matrix === true) { ticket.sla = ''; ticket.businessImpact = ''; }
  // Module 3's extra writing boxes start empty.
  const writing = Object.fromEntries(Object.keys(ticket.writing || {}).filter(field => HD_PROVE_EXTRA_TEXT.includes(field)).map(field => [field, '']));
  return {
    ...state, mode:'prove', moduleKey:HD_PROVE.moduleKey, student:HD_PROVE.student,
    selectedComputer:shift.selectedComputer, selectedUserId:requester ? requester.id : state.selectedUserId,
    machines:hdClone(shift.machines || {}),
    prove:{
      rubricVersion:shift.rubricVersion, startedAt:new Date().toISOString(),
      order:{
        diagnosis:hdSeededOrder(ticket.diagnosisOptions, state.seed),
        path:hdSeededOrder(ticket.pathPool.map(step => step.id), state.seed ^ 0x5bd1e995),
      },
      fields:hdProvePreset() || hdProveEmptyFields(),
      diagnosis:'', steps:[], decision:'', resolutionNote:'', userReply:'', ...writing,
      events:[], opened:[], passwordTyped:false,
    },
  };
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
// A password written into a ticket field (work note, customer comment, Prove
// resolution note or reply): a label (password, passwd, pwd, pw, passcode)
// followed by ":", "=", "is" or a dash (a hyphen only with a space after it,
// so "password-protected" is fine; also "was:", "is:", "now:") and a value, or a shell password argument pasted in. Plain "was" isn't enough
// ("the password was causing lockouts"). The word alone is not a password: "explained we can't view or
// set passwords" and "the self-service password reset" are fine, and so is a
// state word after the label ("password is expired", "password: reset").
// Same line only: a label ending one line never reads the next line as its
// value. A quoted value is the whole quote, spaces included ("Spring 2026!").
// Groups: 1 the label and connector, 2-5 a quoted value, 6 an unquoted one.
const HD_PASSWORD_LABEL = '(\\b(?:password|passwd|pwd|pw|passcode)(?:[ \\t]+(?:was|is|now))?[ \\t]*(?::|=|[—–]|-(?=[ \\t])|\\bis\\b)[ \\t]*)(?:"([^"\\n]*)"|\'([^\'\\n]*)\'|“([^”\\n]*)”|‘([^’\\n]*)’|([^\\s"\'“”‘’]\\S*))';
function hdPasswordMatchValue(match) { return [2, 3, 4, 5, 6].map(index => match[index]).find(value => value !== undefined) || ''; }
const HD_PASSWORD_NOT_A_VALUE = new Set(('not never no none n/a na nil null unknown unchanged changed change reset resets expired expiring locked unlocked '
  + 'correct incorrect wrong right required needed forgotten forgot set updated current old new same different the a an his her their its my your our '
  + 'still now being been ok okay fine valid invalid working accepted rejected blank empty hidden private secret managed self-service via per through '
  + 'by case-sensitive too very also only cleared entered typed verified confirmed stored saved cached stale synced mismatched sent shared emailed '
  + 'texted given provided protected masked redacted withheld it it\'s don\'t can\'t isn\'t won\'t').split(' '));
function hdIsPasswordValue(value) {
  const word = String(value || '').toLowerCase().replace(/[.,;:!?)\]]+$/, '');
  if (!word || HD_PASSWORD_NOT_A_VALUE.has(word)) return false;
  // Already masked, or a placeholder: nothing to hide.
  return !/^(\*+|x{3,}|•+|\[[^\]]*\]|<[^>]*>|\.{3,})$/i.test(word);
}
function hdPasswordInText(text) {
  const value = String(text || '');
  if (hdHasPasswordArg(value)) return true;
  const pattern = new RegExp(HD_PASSWORD_LABEL, 'gi');
  let match;
  while ((match = pattern.exec(value))) { if (hdIsPasswordValue(hdPasswordMatchValue(match))) return true; }
  return false;
}
// Masks each password value, the whole of a quoted one (for drafts saved
// before this check existed). What comes back never holds a password value.
function hdMaskPasswordText(text) {
  const masked = String(text || '').replace(new RegExp(HD_PASSWORD_LABEL, 'gi'), (...match) => {
    if (!hdIsPasswordValue(hdPasswordMatchValue(match))) return match[0];
    const quote = [['"', '"'], ['\'', '\''], ['“', '”'], ['‘', '’']][[2, 3, 4, 5].findIndex(index => match[index] !== undefined)] || ['', ''];
    return `${match[1]}${quote[0]}********${quote[1]}`;
  });
  return hdHasPasswordArg(masked) ? hdRedactCommand(masked) : masked;
}
// The refusal, shared by every free-text ticket field. Practice coaches with
// the shell refusal's message; Prove only says it wasn't saved and flags it
// for the instructor (passwordWritten, separate from the shell's
// passwordTyped). Never a scoring rule: the instructor decides.
const HD_PASSWORD_STOP = 'Stopped: never type a user\'s password, not in the shell and not anywhere else.';
function hdRefusePasswordText(ticket, field) {
  if (HD_PROVE) {
    if (hdState.prove) hdState.prove.passwordWritten = true;
    hdSave();
    return `Stopped: this ${field} includes a password, so it was not saved.`;
  }
  if (ticket) ticket.passwordWritten = true;
  hdPracticeEvent('password_refused', { field });
  hdSave();
  return `${HD_PASSWORD_STOP} Remove it from the ${field}, then add it again. KB-0024: you never see, type or record a user's password.`;
}
// A draft saved before passwords were masked can still hold one: mask every
// saved command, note and comment on load and, if any changed, write the
// masked draft back so the raw copy is gone from storage. A Prove draft that
// had one gets the flag (passwordTyped for a command, passwordWritten for
// writing).
function hdScrubSavedCommands(state) {
  let changed = false;
  const scrub = (holder, field) => {
    if (holder && typeof holder[field] === 'string' && hdHasPasswordArg(holder[field])) { holder[field] = hdRedactCommand(holder[field]); changed = true; return true; }
    return false;
  };
  const scrubText = (holder, field, owner) => {
    if (!holder || typeof holder[field] !== 'string' || !hdPasswordInText(holder[field])) return;
    holder[field] = hdMaskPasswordText(holder[field]); changed = true;
    if (owner) owner.passwordWritten = true;
  };
  (Array.isArray(state.powershell) ? state.powershell : []).forEach(row => { if (row && row.type === 'command') scrub(row, 'text'); });
  (Array.isArray(state.practiceLog) ? state.practiceLog : []).forEach(entry => scrub(entry, 'command'));
  if (state.prove && Array.isArray(state.prove.events)) {
    state.prove.events.forEach(entry => { if (scrub(entry, 'command')) state.prove.passwordTyped = true; });
  }
  (Array.isArray(state.tickets) ? state.tickets : []).forEach(ticket => {
    if (!ticket) return;
    const owner = state.prove || ticket;
    (Array.isArray(ticket.notes) ? ticket.notes : []).forEach(note => scrubText(note, 'text', owner));
    (Array.isArray(ticket.customerComments) ? ticket.customerComments : []).forEach(comment => scrubText(comment, 'text', owner));
  });
  if (state.prove) ['resolutionNote', 'userReply', ...HD_PROVE_EXTRA_TEXT].forEach(field => scrubText(state.prove, field, state.prove));
  // A queue shift's writing: each ticket's reason and the rewrite.
  if (state.prove && state.prove.shape === 'queue') {
    (Array.isArray(state.tickets) ? state.tickets : []).forEach(ticket => scrubText(ticket, 'reason', state.prove));
    if (state.prove.rewrite) ['shortDescription', 'description'].forEach(field => scrubText(state.prove.rewrite, field, state.prove));
  }
  if (changed) { try { localStorage.setItem(hdStateKey(), JSON.stringify(state)); } catch (_) {} }
  return state;
}
// A Prove draft saved under an earlier version of the ticket (its rubric
// version differs, or it has none) starts from the current ticket, keeping the
// student's writing, notes and recorded actions. Its step choices are dropped
// (the step ids are new) and the laptop starts as the current fixture says.
function hdProveUpgrade(saved) {
  if (!HD_PROVE || !saved || !saved.prove || saved.prove.rubricVersion === HD_PROVE.shift.rubricVersion) return saved;
  // A queue shift has only one version so far: a draft that doesn't match
  // it is not a queue draft, so it starts fresh.
  if (HD_PROVE.shift.queue === true) { const fresh = hdFreshProveState(); try { localStorage.setItem(hdStateKey(), JSON.stringify(fresh)); } catch (_) {} return fresh; }
  const fresh = hdFreshProveState();
  const old = saved.prove;
  const text = value => (typeof value === 'string' ? value.slice(0, 4000) : '');
  fresh.prove = {
    ...fresh.prove,
    startedAt:text(old.startedAt) || fresh.prove.startedAt, editedAt:old.editedAt,
    diagnosis:fresh.prove.order.diagnosis.includes(old.diagnosis) ? old.diagnosis : '',
    decision:['Resolve', 'Escalate'].includes(old.decision) ? old.decision : '',
    resolutionNote:text(old.resolutionNote), userReply:text(old.userReply),
    events:Array.isArray(old.events) ? old.events.slice(-400) : [], opened:Array.isArray(old.opened) ? old.opened.slice() : [],
    passwordTyped:old.passwordTyped === true, passwordWritten:old.passwordWritten === true,
  };
  const oldTicket = Array.isArray(saved.tickets) ? saved.tickets[0] : null;
  if (oldTicket && Array.isArray(oldTicket.notes)) fresh.tickets[0].notes = oldTicket.notes.slice();
  if (Array.isArray(saved.powershell)) fresh.powershell = saved.powershell.slice();
  try { localStorage.setItem(hdStateKey(), JSON.stringify(fresh)); } catch (_) {}
  return fresh;
}
// A practice set saved before a ticket joined it (Module 1's set had three
// tickets until HD-2154 joined on 2026-11-15) gets the new ticket fresh; the
// other tickets keep their work. A completion already saved stays saved.
function hdPracticeSetUpgrade(saved) {
  if (!HD_PRACTICE_SET || !saved || !Array.isArray(saved.tickets)) return saved;
  const missing = HD_PRACTICE_SET.set.tickets.filter(id => !saved.tickets.some(ticket => ticket.id === id));
  if (!missing.length) return saved;
  const fresh = hdFreshState(HD_TICKET_TEMPLATES, true);
  missing.forEach(id => {
    const ticket = fresh.tickets.find(item => item.id === id); if (!ticket) return;
    saved.tickets.push(ticket);
    const account = hdConsole(ticket).account;
    if (account && account.locked) saved.userOverrides = { ...(saved.userOverrides || {}), [account.userId]:{ ...((saved.userOverrides || {})[account.userId] || {}), locked:true } };
  });
  // The new tickets' own machine state (console.machines, console.vdi). A
  // computer another saved ticket already seeded keeps the student's work.
  const added = hdSeedTicketMachines({ tickets:saved.tickets.filter(ticket => missing.includes(ticket.id)), machines:{} });
  saved.machines = saved.machines || {};
  Object.keys(added.machines).forEach(name => {
    if (!saved.machines[name] || !saved.machines[name].seededBy) saved.machines[name] = { ...(saved.machines[name] || {}), ...added.machines[name] };
  });
  if (added.vdi) saved.vdi = { ...added.vdi, ...(saved.vdi || {}) };
  if (!saved.selectedTicketId) saved.selectedTicketId = saved.tickets[0].id;
  return saved;
}
function hdLoadState() {
  if (HD_PROVE && HD_PROVE.blocked) return { ...hdFreshProveState(), tickets:[], selectedTicketId:null };
  try {
    const saved = JSON.parse(localStorage.getItem(hdStateKey()) || 'null');
    const fits = HD_PROVE ? saved && saved.mode === 'prove' && saved.moduleKey === HD_PROVE.moduleKey && saved.prove
      : HD_PRACTICE_SET ? saved && saved.mode !== 'prove' && saved.practiceSet === HD_PRACTICE_SET.key
        : saved && saved.mode !== 'prove' && !saved.practiceSet;
    if (fits && saved.version === 1 && Array.isArray(saved.tickets)) return hdScrubSavedCommands(HD_PROVE ? hdProveUpgrade(saved) : hdEnsurePractice(hdPracticeSetUpgrade(saved)));
  } catch (_) {}
  const fresh = HD_PROVE ? hdFreshProveState() : HD_PRACTICE_SET ? hdFreshPracticeSetState() : hdFreshState();
  localStorage.setItem(hdStateKey(), JSON.stringify(fresh));
  return fresh;
}
let hdState = hdLoadState();
// Replies already waiting when the shift opens (arrivals with no condition).
if (hdHasArrivals() && hdCheckArrivals(true)) hdSave();
// Closed earlier but not confirmed (the course page was closed, or the save
// failed): try once more when the practice set opens.
if (HD_PRACTICE_SET) setTimeout(() => { if (!hdState.practiceSaved && hdPracticeClosed()) hdPracticeReport(); }, 0);
function hdSave() { if (HD_PROVE && HD_PROVE.blocked) return; hdDropStaleTicketSet(); localStorage.setItem(hdStateKey(), JSON.stringify(hdState)); }
// Another coach's reset (hd1Reset, hdResetTicketScope) swaps a coached set's
// tickets for its own. The set's clock, work order and queue view then belong
// to no ticket, so they leave the save with the set.
function hdDropStaleTicketSet() {
  if (HD_PROVE || HD_PRACTICE_SET || !hdState || !hdState.ticketSet || hdActiveSet()) return;
  ['ticketSet', 'clockNow', 'daysMoved', 'workOrder', 'queueView'].forEach(key => { delete hdState[key]; });
}

// The fixture lists a page shows: Practice sees the shared fixtures only; a
// Prove shift adds its own computers and KB articles, and its server and
// event overrides.
function hdComputers() { return HD_PROVE ? [...HD_COMPUTERS, ...(HD_PROVE.shift.computers || [])] : HD_COMPUTERS; }
// An article marked practiceOnly (KB-0059, Lab 1.2's printer steps) never
// shows in a Prove It: it would hand over the Prove It's fix.
// A practice or coached set may add its own articles (kbArticles, Module 6):
// they show only in that set, never in the shared shift or a Prove It.
function hdKbArticles() {
  if (HD_PROVE) return [...HD_KB_ARTICLES.filter(article => !article.practiceOnly), ...(HD_PROVE.shift.kbArticles || [])];
  const set = typeof hdActiveSet === 'function' ? hdActiveSet() : null;
  return set && Array.isArray(set.kbArticles) && set.kbArticles.length ? [...HD_KB_ARTICLES, ...set.kbArticles] : HD_KB_ARTICLES;
}
function hdServers() {
  const overrides = HD_PROVE ? HD_PROVE.shift.serverOverrides || {} : {};
  return HD_SERVERS.map(server => ({ ...server, ...(overrides[server.name] || {}) }));
}
function hdEvents() {
  // A Prove shift, a practice set or a coached set may hide the shared
  // events of named computers (hideEventsFrom).
  const set = HD_PROVE ? HD_PROVE.shift : (typeof hdActiveSet === 'function' ? hdActiveSet() : null);
  const hidden = set && Array.isArray(set.hideEventsFrom) ? set.hideEventsFrom : [];
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
  // A recorded action (a command, a search, a screen) is an edit too, so a
  // reload never prefills a returned attempt's actions and laptop over it.
  hdProveEdited();
}
function hdProveOpened(source, label) {
  if (!HD_PROVE || !hdState.prove || hdProveLocked() || hdState.prove.opened.includes(source)) return;
  hdState.prove.opened.push(source);
  hdProveEvent('evidence_opened', { source, label });
  hdSave();
}
function hdRerender() { hdCheckArrivals(); hdSave(); render(); hdPracticeReport(); }
function hdEsc(value) { return escHtml(String(value == null ? '' : value)); }
function hdTicketById(id) { return hdState.tickets.find(ticket => ticket.id === id); }
function hdCurrentTicket() { return hdTicketById(hdState.selectedTicketId) || hdState.tickets[0]; }
function hdUserById(id) {
  const base = HD_USERS.find(user => user.id === id);
  return base ? { ...base, ...(hdState.userOverrides[id] || {}) } : null;
}
function hdComputerByName(name) {
  const base = hdComputers().find(computer => computer.name === name);
  return base ? { ...base, ...(hdState.computerOverrides[name] || {}), ...hdMachineComputerOverride(name) } : null;
}
function hdOpenTickets() { return hdState.tickets.filter(t => !['Resolved','Closed','Canceled'].includes(t.status)); }
// Older tickets' SLA clock, unchanged: a matrix ticket uses hdMatrixSla.
function hdSlaMinutes(ticket) { return { P1:15, P2:120, P3:480, P4:1440 }[ticket.priority] || 480; }
function hdAgeMinutes(ticket) { return Math.max(0, Math.round((hdShiftNow(ticket) -new Date(ticket.createdTimestamp)) / 60000)); }
function hdSlaState(ticket) {
  if (hdIsMatrix(ticket)) return hdMatrixSla(ticket);
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
  ticket.troubleshootingHistory.push({ time:hdConsoleTime(ticket), action });
}

function hdSelectTicket(id) {
  hdState.selectedTicketId = id;
  hdPendingState = {};
  // A message can wait for a ticket to be opened (arrivals: when.opened).
  if (hdHasArrivals()) { const ticket = hdTicketById(id); if (ticket) ticket.opened = true; hdCheckArrivals(); }
  hdSave();
  navigate('#/helpdesk/ticket');
}
function hdSetQueueFilter(value) { hdState.queueFilter = value; hdRerender(); }
function hdSetPriorityFilter(value) { hdState.priorityFilter = value; hdRerender(); }
function hdAssignTicket(id) {
  const ticket = hdTicketById(id); if (!ticket) return;
  if (hdIsMatrix(ticket)) { hdMatrixAssignToMe(ticket); hdRerender(); return; }
  ticket.assignedTechnician = 'Riley Morgan';
  // A ticket with simpleStates (Module 1) goes straight to In Progress.
  const simple = hdConsole(ticket).simpleStates === true;
  if (ticket.status === 'New') ticket.status = simple ? 'In Progress' : 'Assigned';
  hdHistory(ticket, simple ? 'Assigned to Riley Morgan; state In Progress.' : 'Assigned to Riley Morgan.'); hdRerender();
}
function hdTransitionTicket(id, status) {
  // A matrix ticket has the ServiceNow states (HD_SN_STATUS_NEXT).
  if (hdIsMatrix(hdTicketById(id))) { hdMatrixTransition(id, status); return; }
  const ticket = hdTicketById(id); if (!ticket || !(HD_STATUS_NEXT[ticket.status] || []).includes(status)) {
    toast('That state transition is not valid from the current ticket state.'); return;
  }
  // A simpleStates ticket has one close control and no state list.
  if (hdConsole(ticket).simpleStates === true) { toast('This ticket closes through its own control.'); return; }
  // A ticket with an owner choice closes only through it.
  if (['Resolved', 'Escalated'].includes(status) && hdConsole(ticket).owner) { toast('Choose who owns this ticket in "Who owns this ticket?".'); hdRerender(); return; }
  // A console-only ticket's outcomes can't be skipped through the state list:
  // it resolves exactly as the Resolve button does (same checks, same
  // message, and its note becomes the resolution).
  if (status === 'Resolved' && hdConsoleOutcomes(ticket)) { hdResolveTicket(id); return; }
  // Nor can a required resolution code.
  const codeConfig = hdConsole(ticket).resolutionCode;
  if (status === 'Resolved' && codeConfig && codeConfig.required && !hdConsoleState(ticket).resolutionCode) { toast('Choose a resolution code before you resolve this ticket.'); hdRerender(); return; }
  ticket.status = status; hdHistory(ticket, `Status changed to ${status}.`); hdRerender();
}
function hdSetTicketPriority(id, priority) {
  const ticket = hdTicketById(id); if (!ticket) return;
  if (hdConsole(ticket).priorityReason) { toast('This ticket\'s priority is pre-set.'); return; }
  if (hdIsMatrix(ticket)) { toast('Priority is calculated from Impact and Urgency.'); return; }
  ticket.priority = priority; hdHistory(ticket, `Priority set to ${priority} after impact and urgency review.`); hdRerender();
}
function hdAddNote(id) {
  if (hdProveLocked()) return;
  const ticket = hdTicketById(id); const input = document.getElementById('hd-note-input');
  const text = input && input.value.trim(); if (!ticket || !text) { toast('Enter a useful troubleshooting note first.'); return false; }
  // A password is never saved in a note, on any ticket.
  if (hdPasswordInText(text)) { toast(hdRefusePasswordText(ticket, 'work note')); return false; }
  ticket.notes.push({ time:hdConsoleTime(ticket), author:'Riley Morgan', text });
  hdClearDraft(ticket, 'note');
  hdProveEdited();
  hdHistory(ticket, 'Technician work note added.');
  // HD-2101 Practice feedback: the note's three parts.
  if (ticket.id === HD_M01 && hdM01()) {
    const missing = hdNoteMissingParts(text);
    toast(missing.length ? `Note added. A complete note for this ticket has three parts: Reported, Tried and Result. Still missing: ${missing.join(', ')}.` : 'Note added: Reported, Tried and Result are all there.');
  } else if (hdConsole(ticket).notes) toast(hdConsoleNoteFeedback(ticket, text));
  hdRerender();
  return true;
}
function hdContactRequester(id) {
  const ticket = hdTicketById(id); if (!ticket) return;
  const message = `Contacted ${ticket.requester}: acknowledged the ticket, confirmed impact, and set the next update expectation.`;
  ticket.notes.push({ time:hdConsoleTime(ticket), author:'Customer update', text:message });
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
  // A matrix ticket resolves through its State list (code and notes).
  if (hdIsMatrix(ticket)) { hdMatrixTransition(id, 'Resolved'); return; }
  // HD-2101 Practice: resolving needs the investigation's outcomes, and the
  // resolution is the student's own Reported / Tried / Result note.
  const scenario = ticket.id === HD_M01 && hdM01();
  if (hdConsole(ticket).owner) { toast('Choose who owns this ticket in "Who owns this ticket?".'); return; }
  // A console-only ticket (resolveByOutcomes) has no diagnosis: it needs its
  // outcomes, and the resolution is the student's own complete note.
  const byOutcomes = !scenario && !!hdConsoleOutcomes(ticket);
  if (scenario) {
    hdM01Tick();
    const missing = hdM01Missing();
    if (missing) { toast(missing); return; }
  } else if (byOutcomes) {
    const blocked = hdConsoleResolveBlock(ticket);
    if (blocked) { toast(blocked); hdRerender(); return; }
  } else if (!ticket.diagnosisCorrect && !['Service Request'].includes(ticket.category)) { toast('Validate the root cause before resolving this ticket.'); return; }
  // A ticket that turns the resolution code on and requires it: no code, no resolve.
  const codeConfig = hdConsole(ticket).resolutionCode;
  const code = codeConfig ? hdConsoleState(ticket).resolutionCode : '';
  if (codeConfig && codeConfig.required && !code) { toast('Choose a resolution code before you resolve this ticket.'); return; }
  ticket.resolution = scenario ? hdM01CompleteNote(ticket).text : byOutcomes ? hdConsoleCompleteNote(ticket).text : ticket.expectedResolution;
  ticket.closureCode = code || (ticket.category === 'Service Request' ? 'Request fulfilled' : ticket.category === 'Security Incident' ? 'Escalated to Security' : 'Resolved by support');
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
  // A coached ticket set starts its own set again.
  const coached = hdActiveSet() && hdState.ticketSet;
  if (coached) { const key = hdState.ticketSet; hdState = hdFreshSetState(hdCoachedSets()[key]); hdState.ticketSet = key; hdState.selectedTicketId = null; }
  else hdState = HD_PRACTICE_SET ? hdFreshPracticeSetState() : hdFreshState();
  hdPendingState = {};
  // A practice set has no coach, and its shift isn't the coached lab's: the
  // coached lab's saved progress stays.
  if (!HD_PRACTICE_SET && typeof window.forgetModuleCoachProgress === 'function') window.forgetModuleCoachProgress();
  hdRerender();
}

// The number a student sees: a ticket's own INC number when it has one
// (HD-2150 shows as INC0010150), else its ID. Code and saved work use the ID.
function hdTicketLabel(ticket) { return ticket.number || ticket.id; }
function hdQueueRows(tickets) {
  return tickets.map(ticket => {
    const sla = hdSlaState(ticket);
    // A Prove ticket shows the student's own fields and no SLA (it follows priority).
    const fields = HD_PROVE && hdState.prove ? hdState.prove.fields : null;
    const priority = fields ? fields.priority : ticket.priority;
    return `<tr class="hd-ticket-row" tabindex="0" onclick="hdSelectTicket('${ticket.id}')" onkeydown="if(event.key==='Enter')hdSelectTicket('${ticket.id}')">
      <td><strong>${hdEsc(hdTicketLabel(ticket))}</strong>${hdVipBadge(ticket)}${ticket.linkedProblem ?`<small>${hdEsc(ticket.linkedProblem)}</small>` : ''}</td>
      <td>${priority ? hdBadge(priority, priority.toLowerCase()) : '<span class="muted">Not set</span>'}</td>
      <td><strong>${hdEsc(ticket.requester)}</strong><small>${hdEsc(ticket.department)}</small></td>
      <td><strong>${hdEsc(fields ? ticket.title : hdConsole(ticket).classify ? hdTicketCategoryText(ticket) : ticket.subcategory)}</strong><small>${hdEsc(ticket.description)}</small></td>
      <td>${hdIsMatrix(ticket) ? hdStatusBadge(ticket) : hdBadge(ticket.status)}</td><td>${fields ? '<span class="muted">—</span>' : hdIsMatrix(ticket) ? hdSlaBadge(ticket) : hdBadge(sla.label, sla.cls)}</td><td>${hdEsc(ticket.assignedTechnician)}</td>
    </tr>`;
  }).join('');
}

VIEWS['helpdesk/dashboard'] = () => {
  const open = hdOpenTickets();
  const p1 = open.filter(t => t.priority === 'P1');
  const risk = open.filter(t => ['At risk','Breached'].includes(hdSlaState(t).label));
  const cluster = open.filter(t => t.correlationKey === 'APP-CERT-EXPIRY-01');
  // A shift with no correlated tickets (the Module 1 practice set) shows no
  // correlation metric or card.
  const correlated = hdState.tickets.some(t => t.correlationKey);
  const urgent = [...open].sort((a,b) =>
    ((HD_PRIORITY_RANK[a.priority] || 9) - (HD_PRIORITY_RANK[b.priority] || 9)) ||
    hdAgeMinutes(b) - hdAgeMinutes(a)
  ).slice(0,7);
  return `${hdPageHeader('Help Desk Dashboard', `${HD_ORG.name} · ${HD_ORG.domain} · simulated shift`, `${hdNextDayControl()}${HD_PROVE ? '' : '<button class="btn btn-secondary" onclick="hdResetShift()">Reset shift</button>'}<button class="btn btn-primary" onclick="navigate('#/helpdesk/tickets')">Open queue</button>`)}${hdProveBlockedNotice()}
    <div class="hd-metric-grid">${hdMetric('Open tickets', open.length, `${hdState.tickets.length} received this shift`)}${hdMetric('Priority 1', p1.length, 'Immediate response required','danger')}${hdMetric('SLA risk', risk.length, 'At risk or breached','warning')}${correlated ? hdMetric('Correlated reports', cluster.length, 'Possible shared incident','info') : ''}</div>
    <div class="two-col hd-dashboard-grid">
      <div class="card"><div class="card-header"><strong>Priority work</strong><button class="btn btn-ghost btn-sm" onclick="navigate('#/helpdesk/tickets')">View all</button></div><div class="table-wrap"><table><thead><tr><th>ID</th><th>Priority</th><th>Requester</th><th>Issue</th><th>Status</th><th>SLA</th><th>Owner</th></tr></thead><tbody>${hdQueueRows(urgent)}</tbody></table></div></div>
      <div class="hd-side-stack">
        ${hdVmDashboardCard()}
        ${HD_PROVE || !correlated ? '' : `<div class="card hd-correlation"><div class="card-header"><strong>Correlation opportunity</strong>${hdBadge(`${cluster.length} reports`,'warn')}</div><div class="card-body"><h3>Purchasing sign-in failures</h3><p>Users in five departments report the same secure-connection error. Treat the shared timing and evidence as a possible broader incident.</p><button class="btn btn-primary btn-sm" onclick="hdSelectTicket('${cluster[0] ? cluster[0].id : ''}')">Investigate cluster</button></div></div>`}
        <div class="card"><div class="card-header"><strong>Shift discipline</strong></div><div class="card-body">${hdList(['Prioritize business impact and urgency','Own every handoff until accepted','Preserve security evidence','Verify fixes from the user perspective','Close with complete resolution notes'])}</div></div>
      </div>
    </div>`;
};

VIEWS['helpdesk/tickets'] = () => {
  // A queue Prove shift (Module 2) has its own list and work order.
  if (hdProveQueue() && hdState.prove) return hdProveQueueView();
  // A set with queue: true gets the ServiceNow-style list instead.
  const set = hdActiveSet();
  if (set && set.queue) return `${hdPageHeader('Ticket Queue', 'Incidents assigned to your group. Add the columns you need, sort, then set your work order.', `${hdNextDayControl()}<button class="btn btn-secondary" onclick="hdResetShift()">Generate new shift</button>`)}${hdProveBlockedNotice()}${hdSetQueueHtml(set)}`;
  let tickets = hdState.tickets;
  // A Prove ticket stays listed once Resolved: it is still to be submitted.
  if (hdState.queueFilter === 'Open') tickets = HD_PROVE ? tickets : tickets.filter(t => !['Resolved','Closed','Canceled'].includes(t.status));
  else if (hdState.queueFilter !== 'All') tickets = tickets.filter(t => t.status === hdState.queueFilter);
  if (hdState.priorityFilter !== 'All') tickets = tickets.filter(t => t.priority === hdState.priorityFilter);
  return `${hdPageHeader('Ticket Queue', 'Classify, prioritize, own, investigate, communicate, resolve, and close.', HD_PROVE ? '' : `<button class="btn btn-secondary" onclick="hdResetShift()">Generate new shift</button>`)}${hdProveBlockedNotice()}
    <div class="filterbar"><label>Status <select class="select" onchange="hdSetQueueFilter(this.value)">${['All','Open',...(hdState.tickets.some(hdIsMatrix) ? [...new Set([...HD_STATUSES, ...HD_SN_STATUSES])] : HD_STATUSES)].map(v => `<option ${v===hdState.queueFilter?'selected':''}>${v}</option>`).join('')}</select></label><label>Priority <select class="select" onchange="hdSetPriorityFilter(this.value)">${['All','P1','P2','P3','P4',...(hdState.tickets.some(hdIsMatrix) ? ['P5'] : [])].map(v => `<option ${v===hdState.priorityFilter?'selected':''}>${v}</option>`).join('')}</select></label><span class="muted">${tickets.length} shown${HD_PROVE ? '' : ' · roots remain hidden until diagnosed'}</span></div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>Ticket</th><th>Priority</th><th>Requester</th><th>Category / summary</th><th>Status</th><th>SLA</th><th>Assigned</th></tr></thead><tbody>${hdQueueRows(tickets)}</tbody></table></div></div>`;
};

VIEWS['helpdesk/ticket'] = () => {
  const ticket = hdCurrentTicket();
  if (!ticket) return `${hdPageHeader('Ticket', 'No ticket selected.')}${hdProveBlockedNotice()}`;
  if (hdProveQueue() && hdState.prove) return hdProveQueueTicketView(ticket);
  if (HD_PROVE && hdState.prove && ticket.pathPool) return hdProveTicketView(ticket);
  const sla = hdSlaState(ticket);
  const related = ticket.correlationKey ? hdState.tickets.filter(t => t.correlationKey === ticket.correlationKey) : [];
  // A ticket with an owner choice closes through it, not the state list. A
  // simpleStates ticket (Module 1) has no state list at all: Assign to me
  // sets In Progress, and its one close control closes it.
  const simpleStates = hdConsole(ticket).simpleStates === true;
  const nextStates = simpleStates ? [] : (HD_STATUS_NEXT[ticket.status] || []).filter(state => !hdConsole(ticket).owner || !['Resolved', 'Escalated'].includes(state));
  const diagnosisOptions = ticket.plausibleCauses;
  const scenario = ticket.id === HD_M01 && hdM01();
  if (scenario) hdM01Tick();
  const evidence = ticket.logs.length
    ? `<pre class="hd-evidence">${ticket.logs.map(hdEsc).join('\n')}</pre>`
    : '<p class="muted hd-evidence-empty">No logs are attached to this ticket. Gather the evidence yourself with the tools: Event Viewer, Active Directory and PowerShell.</p>';
  // A console-only ticket shows its progress instead of the path checklist,
  // the diagnosis dropdown and the "find the evidence with the tools" card.
  const byOutcomes = !scenario && !!hdConsoleOutcomes(ticket);
  // A console ticket (Module 1) is worked on the ticket itself, so with no
  // logs it gets no "use Event Viewer, Active Directory and PowerShell" card.
  const consoleTicket = !scenario && Object.keys(hdConsole(ticket)).length > 0;
  // A matrix ticket is worked through its fields, states and cards: no path
  // checklist or diagnosis dropdown, and it shows only the facts it has.
  const matrix = hdIsMatrix(ticket);
  const evidenceCard = (byOutcomes || consoleTicket) && !ticket.logs.length ? '' : `<div class="card"><div class="card-header"><strong>Available logs and evidence</strong><span class="muted">Investigate; do not infer beyond the evidence.</span></div><div class="card-body">${evidence}</div></div>`;
  const pathAndDiagnosis = scenario ? hdM01IdentityCard(scenario) + hdM01InvestigationCard(scenario) : byOutcomes ? hdConsoleOutcomesCard(ticket) : matrix ? '' : `<div class="card"><div class="card-header"><strong>Troubleshooting path</strong><span class="muted">Record what you actually checked.</span></div><div class="card-body"><div class="hd-path">${ticket.correctPath.map((step,index) => `<label><input type="checkbox" onchange="hdTogglePathStep('${ticket.id}',${index},this.checked)" ${(ticket.checkedSteps || []).includes(step)?'checked':''}> <span>${index+1}</span>${hdEsc(step)}</label>`).join('')}</div></div></div>
        <div class="card"><div class="card-header"><strong>Diagnosis checkpoint</strong></div><div class="card-body"><div class="hd-diagnosis-row"><select id="hd-diagnosis" class="select"><option value="">Choose the most likely cause…</option>${diagnosisOptions.map(value => `<option ${ticket.diagnosis===value?'selected':''}>${hdEsc(value)}</option>`).join('')}</select><button class="btn btn-primary" onclick="hdSubmitDiagnosis('${ticket.id}')">Check diagnosis</button></div>${ticket.diagnosis ? `<div class="callout ${ticket.diagnosisCorrect?'success':'warning'}">${ticket.diagnosisCorrect ? `<strong>Supported by the evidence.</strong> ${hdEsc(ticket.hiddenRootCause)}` : '<strong>Not sufficiently supported.</strong> Recheck the evidence and test a different hypothesis.'}</div>` : ''}${ticket.diagnosisCorrect ? `<div class="hd-resolution"><strong>Expected resolution</strong><p>${hdEsc(ticket.expectedResolution)}</p></div>` : ''}</div></div>`;
  const fieldGrid = matrix
    ? `<div><span>Caller</span><strong>${hdEsc(hdCallerText(ticket))}</strong></div>${hdCallbackField(ticket)}<div><span>Department</span><strong>${hdEsc(ticket.department)}</strong></div><div><span>Short description</span><strong>${hdEsc(hdShortDescription(ticket) || '—')}</strong></div><div><span>SLA target</span><strong>${hdEsc(hdMatrixTargetText(ticket))}</strong></div><div><span>Created</span><strong>${hdEsc(hdShiftTimeText(ticket.createdTimestamp))}</strong></div><div><span>Assignment group</span><strong>${hdEsc(ticket.assignmentGroup || HD_SERVICE_DESK)}</strong></div><div><span>Assigned to</span><strong>${hdEsc(ticket.assignedTechnician)}</strong></div>${hdConsole(ticket).classify ? '' : `${ticket.contactType ? `<div><span>Contact type</span><strong>${hdEsc(ticket.contactType)}</strong></div>` : ''}${ticket.ci ? `<div><span>Configuration item</span><strong>${hdEsc(ticket.ci)}</strong></div>` : ''}`}`
    : '';
  const factCards = matrix && !(ticket.symptoms || []).length && !(ticket.systemState || []).length ? '' : `<div class="two-col"><div class="card"><div class="card-header"><strong>Observable symptoms</strong></div><div class="card-body">${hdList(ticket.symptoms)}</div></div><div class="card"><div class="card-header"><strong>Relevant system state</strong></div><div class="card-body">${hdList(ticket.systemState)}</div></div></div>`;
  const controls = matrix
    ? `${hdMatrixControls(ticket)}`
    : `${hdConsolePriorityControl(ticket)}${nextStates.length?`<label>Next state<select class="select" onchange="if(this.value)hdTransitionTicket('${ticket.id}',this.value)"><option value="">Choose…</option>${nextStates.map(v=>`<option>${v}</option>`).join('')}</select></label>`:''}<button class="btn btn-secondary" onclick="hdContactRequester('${ticket.id}')">Contact requester</button>${hdConsoleResolutionControl(ticket)}${hdConsole(ticket).owner ? '' : `<button class="btn btn-primary" onclick="hdResolveTicket('${ticket.id}')">${simpleStates ? 'Resolve' : ticket.category==='Security Incident'?'Warm escalate':'Resolve / escalate'}</button>`}`;
  return `${hdPageHeader(hdTicketLabel(ticket), matrix || hdConsole(ticket).classify ? `${hdTicketCategoryText(ticket)} · ${hdStatusText(ticket)}` : `${ticket.category} · ${ticket.subcategory}`, `<button class="btn btn-secondary" onclick="navigate('#/helpdesk/tickets')">← Queue</button>${ticket.assignedTechnician==='Unassigned'?`<button class="btn btn-primary" onclick="hdAssignTicket('${ticket.id}')">Assign to me</button>`:''}`)}
    ${related.length > 1 ? `<div class="callout warning hd-related"><strong>${related.length} related reports detected.</strong> Same application, symptom, and time window. ${ticket.linkedProblem ? `Linked to ${hdEsc(ticket.linkedProblem)}.` : `<button class="btn btn-sm btn-secondary" onclick="hdLinkProblem('${ticket.id}')">Link to problem record</button>`}</div>` : ''}
    <div class="hd-ticket-layout">
      <div class="hd-ticket-main">
        <div class="card"><div class="card-header"><strong>Requester statement</strong>${hdVipBadge(ticket)}${matrix ? `${ticket.priority ? hdBadge(ticket.priority, ticket.priority.toLowerCase()) : '<span class="muted">Priority not set</span>'}${hdStatusBadge(ticket)}${hdSlaBadge(ticket)}` : `${hdBadge(ticket.priority,ticket.priority.toLowerCase())}${hdBadge(ticket.status)}${hdBadge(sla.label,sla.cls)}`}</div><div class="card-body"><blockquote class="hd-request">${hdEsc(ticket.description)}</blockquote><div class="hd-field-grid">${matrix ? fieldGrid : `<div><span>Requester</span><strong>${hdEsc(ticket.requester)}</strong></div><div><span>Department</span><strong>${hdEsc(ticket.department)}</strong></div><div><span>Business impact</span><strong>${hdEsc(ticket.businessImpact)}</strong></div><div><span>SLA target</span><strong>${hdEsc(ticket.sla)}</strong></div><div><span>Created</span><strong>${new Date(ticket.createdTimestamp).toLocaleString()}</strong></div><div><span>Assigned technician</span><strong>${hdEsc(ticket.assignedTechnician)}</strong></div>${ticket.contactType ? `<div><span>Contact type</span><strong>${hdEsc(ticket.contactType)}</strong></div>` : ''}${ticket.ci ? `<div><span>Configuration item</span><strong>${hdEsc(ticket.ci)}</strong></div>` : ''}${ticket.callerStatus ? `<div><span>Caller</span><strong>${hdEsc(ticket.callerStatus)}</strong></div>` : ''}`}</div></div></div>${hdConsoleVerifyCard(ticket)}${hdConsoleChoiceCard(ticket)}${hdConsoleChatCard(ticket)}${hdConsoleKbCard(ticket)}${hdConsoleAccountCard(ticket)}${hdConsoleActionsCard(ticket)}${hdConsoleComputerCard(ticket)}${hdConsoleMachinesCard(ticket)}${hdConsoleOwnerCard(ticket)}${hdMatrixCards(ticket)}${hdCommsCards(ticket)}
        ${factCards}
        ${evidenceCard}
        ${pathAndDiagnosis}
        <div class="card"><div class="card-header"><strong>Work notes</strong><span class="muted">${hdConsole(ticket).notes ? 'Reported / Tried / Result (+ Next action if it stays open or goes to another team)' : 'Facts, commands, results, interpretation, next action.'}</span></div><div class="card-body"><div class="hd-note-list">${ticket.notes.length ? ticket.notes.map(note => `<div><strong>${hdEsc(note.author)} · ${hdEsc(note.time)}</strong><p>${hdEsc(note.text)}</p></div>`).join('') : '<p class="muted">No technician notes yet.</p>'}</div><textarea id="hd-note-input" class="ipt hd-note-input" rows="7" oninput="hdKeepDraft('${ticket.id}','note',this.value)" placeholder="${scenario ? 'Reported: what Jordan reported&#10;Tried: what you checked and changed, and what each step showed&#10;Result: the outcome and how you confirmed it' : hdConsole(ticket).notes ? hdConsoleNotePlaceholder(ticket) : 'Document the action you took and what the result proved…'}">${hdEsc(hdDraft(ticket, 'note'))}</textarea>${hdNoteNeedsCard(ticket)}<button class="btn btn-secondary" onclick="hdAddNote('${ticket.id}')">Add work note</button></div></div>${hdConsoleCommentsCard(ticket)}${hdConsoleFeedbackCard(ticket)}
      </div>
      <aside class="hd-ticket-side">
        <div class="card"><div class="card-header"><strong>Ticket controls</strong></div><div class="card-body hd-control-stack">${controls}</div></div>
        ${matrix && !(ticket.escalationCriteria || []).length ? '' : `<div class="card"><div class="card-header"><strong>Escalation criteria</strong></div><div class="card-body">${hdList(ticket.escalationCriteria)}</div></div>`}
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
/* ---------- Console features, switched on per ticket ----------
 * A Practice ticket template may carry `console: { ... }`; each key turns one
 * feature on for that ticket, and a ticket without it looks and behaves as
 * before. The settings are read from the template (never from the saved
 * shift), so a later fixture change reaches existing shifts. Prove shifts
 * never get these (their tickets aren't templates). Keys:
 *   kb: true                       Knowledge Base search box on the ticket
 *   caller: { name, questions:[{ id, text, reply, replyLocked?, asksPassword?, confirms? }] }
 *                                  question buttons and scripted replies
 *                                  (confirms: the user's answer confirms the fix)
 *   account: { userId, locked? }   account card; Unlock account
 *   verification: { prompt, options:[{ id, text, pass?, critical?, feedback, history? }] }
 *                                  caller check; Unlock works only after a pass
 *   comments: true | { repeatLine:{ label, pattern } }
 *                                  Additional comments (customer-visible);
 *                                  repeatLine: a comment must say what to do
 *                                  if the problem comes back (regex source)
 *   resolutionCode: { options?, required? }  resolving needs a code when required
 *   priorityReason: '...'          ticket.priority is pre-set; shown read-only
 *   notes: { parts?, nextAction?, jargon?, needs? }  work note parts
 *                                  (HD_NOTE_PARTS keys), a Next action part
 *                                  while the ticket stays open, words a
 *                                  customer comment mustn't use, and the
 *                                  ticket's own "Your note needs" items
 *                                  (needs: [{ label, pattern }])
 *   simpleStates: true             Module 1 states: Assign to me sets In
 *                                  Progress, no Next state list, one close
 *                                  control (Resolve or the owner choice)
 *   settingsPrinters: { computer, printers:[path], action }
 *                                  Settings › Printers & scanners › Add
 *                                  device on that laptop in Practice; adding
 *                                  a printer records the named action
 *   verification options may set concludes:'unverified' (the caller can't be
 *                                  verified, e.g. refuses a callback)
 *   caller questions may set afterAction + replyBefore (a reply that waits
 *                                  for one of the ticket's actions)
 *   actions: [{ id, text, pass?, critical?, needsVerification?, earlyCritical?,
 *              earlyFeedback?, feedback, history?, needsAction?, beforeText?,
 *              bitlockerKey? }]
 *                                  things the technician can do; a critical
 *                                  one is recorded as a critical error;
 *                                  needsAction (an action id or a list): not
 *                                  done until those were taken, replying
 *                                  beforeText; bitlockerKey (a Key ID): taken
 *                                  from Read key on the computer's BitLocker
 *                                  Recovery tab in Active Directory, never
 *                                  shown on the actions card
 *   owner: { options:[{ id, text, status, group, code, right?, category?,
 *              subcategory?, caller?, feedback }] }
 *                                  who owns the ticket (resolve at Tier 1,
 *                                  escalate, or route to Security Operations)
 *   feedback: [{ area, checks:[rule], good, fix }]
 *                                  Practice "Check my work": one line per
 *                                  area, never points (hdConsoleFeedback);
 *                                  rule printerInstalled:{ computer, printer }
 *                                  reads the laptop's installed printers
 *   criticalActions: [{ action, text }]   (Module 6) a machine action id
 *                                  (hdMachineAction) that is a critical
 *                                  error on this ticket, by any route
 *   undoUnsafe: true | '<line>'    (Module 6) turning off real-time
 *                                  protection or adding an exclusion is
 *                                  undone at once, with that line
 *   choice: { prompt, heading?, after?, options:[{ id, text, right?,
 *              critical?, feedback, action?:{ id, label } }] }
 *                                  (Module 6) a choice a user's request asks
 *                                  for (hdChoose); after: shown only once
 *                                  that action was taken
 *   resolveByOutcomes: true        worked through these features alone: no
 *                                  diagnosis or path checklist; Resolved needs
 *                                  every outcome (HD_CONSOLE_OUTCOMES)
 * The student's work on these lives in ticket.consoleState and
 * ticket.customerComments, created only for a ticket that has the feature. */
function hdConsole(ticket) {
  if (!ticket) return {};
  // A Prove ticket can turn on the knowledge base search and (Module 4) a
  // user's plain late reply that waits for a machine value, and nothing else:
  // no caller chat, verification, actions, owner, comments, feedback, or an
  // arrival that reopens, resumes or approves anything.
  if (HD_PROVE) {
    const proveTicket = (HD_PROVE.shift.tickets || []).find(item => item.id === ticket.id);
    const config = proveTicket && proveTicket.console;
    if (!config) return {};
    // when: { machine } or { all:[{ machine }, ...] }: machine values only.
    const machineOnly = when => {
      if (!when || typeof when !== 'object') return null;
      if (when.machine) return { machine:when.machine };
      const all = Array.isArray(when.all) ? when.all.filter(item => item && item.machine).map(item => ({ machine:item.machine })) : [];
      return all.length && all.length === when.all.length ? { all } : null;
    };
    const arrivals = (Array.isArray(config.arrivals) ? config.arrivals : [])
      .filter(item => item && item.id && item.text && machineOnly(item.when) && !item.reopen && !item.resume && !item.approve && !item.at)
      .map(item => ({ id:item.id, from:item.from, text:item.text, when:machineOnly(item.when) }));
    return { ...(config.kb === true ? { kb:true } : {}), ...(arrivals.length ? { arrivals } : {}) };
  }
  const template = HD_TICKET_TEMPLATES.find(item => item.id === ticket.id);
  return (template && template.console) || {};
}
function hdConsoleState(ticket) {
  const state = ticket.consoleState = ticket.consoleState || {};
  state.chat = Array.isArray(state.chat) ? state.chat : [];
  state.kbQuery = typeof state.kbQuery === 'string' ? state.kbQuery : '';
  state.kbOpen = typeof state.kbOpen === 'string' ? state.kbOpen : '';
  state.kbSearches = Array.isArray(state.kbSearches) ? state.kbSearches : [];
  state.kbOpened = Array.isArray(state.kbOpened) ? state.kbOpened : [];
  const verification = state.verification = state.verification || {};
  verification.choice = verification.choice || '';
  verification.tries = Array.isArray(verification.tries) ? verification.tries : [];
  verification.passed = verification.passed === true;
  verification.criticalErrors = Array.isArray(verification.criticalErrors) ? verification.criticalErrors : [];
  verification.unverified = verification.unverified === true;
  state.unlocks = Array.isArray(state.unlocks) ? state.unlocks : [];
  state.resolutionCode = typeof state.resolutionCode === 'string' ? state.resolutionCode : '';
  state.actions = Array.isArray(state.actions) ? state.actions : [];
  state.critical = Array.isArray(state.critical) ? state.critical : [];
  const owner = state.owner = state.owner || {};
  owner.choice = owner.choice || '';
  owner.tries = Array.isArray(owner.tries) ? owner.tries : [];
  owner.blocked = typeof owner.blocked === 'string' ? owner.blocked : '';
  state.lastAction = typeof state.lastAction === 'string' ? state.lastAction : '';
  state.feedbackShown = state.feedbackShown === true;
  return state;
}
function hdComments(ticket) {
  if (!Array.isArray(ticket.customerComments)) ticket.customerComments = [];
  return ticket.customerComments;
}
// On a set's own clock (set.now), history, work notes, customer updates and
// comments show shift time (day and time, UTC); every other shift, Prove It
// included, keeps the computer's time, as before.
// A ticket with its own clock (console.now, Module 3 on) shows its own shift
// time.
function hdConsoleTime(ticket) {
  if (hdTicketClock(ticket)) return hdShiftTimeText(hdShiftNow(ticket));
  const set = hdActiveSet();
  return set && set.now ? hdShiftTimeText(hdShiftNow()) : new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
}
// Escalated or waiting tickets stay open: their note needs a Next action.
function hdTicketStaysOpen(ticket) {
  return ['Escalated', 'Pending User', 'Pending Vendor', 'On Hold'].includes(ticket.status) || ticket.category === 'Security Incident'
    || (ticket.escalationCriteria || []).some(item => item.startsWith('Always'));
}

// Work note parts, in one place. hdNoteMissingParts(text) with no list is the
// Reported / Tried / Result check HD-2101 has always used; a ticket can ask
// for other parts (e.g. Reported / Checked / Done / Result). Only the parts
// asked for split the note, so a word like "Done:" inside "Tried:" still
// counts as Tried text there.
//
// Where a label counts, in any case, with at least 8 characters after it:
// - followed by a colon, anywhere ("… then Tried: …");
// - followed by a dash, a full stop or a line break, but only at the start of
//   the note, at the start of a line, or right after a full stop, semicolon
//   or comma ("Reported - … Tried - …"). So "the user tried. She restarted"
//   is ordinary prose, not a Tried part.
// Practice only: Prove It never calls this; its notes are checked on the
// server (prove_note_missing), which uses this same rule. A change here must
// change the server copy too (supabase/tests/prove_it_auto_scoring.sql has
// the same cases).
const HD_NOTE_PARTS = { reported:'Reported', tried:'Tried', checked:'Checked', done:'Done', result:'Result', next:'Next action' };
const HD_NOTE_DEFAULT_PARTS = ['reported', 'tried', 'result'];
function hdNotePartPattern(key) { return HD_NOTE_PARTS[key].replace(/ /g, '\\s+'); }
function hdNoteLabels(text, keys) {
  const labels = keys.map(hdNotePartPattern).join('|');
  // Group 1: what comes before a dash/stop/line-break label (start, a line
  // break or . ; ,); group 2: that label. Group 3: a label before a colon.
  const pattern = new RegExp(`(^|[\\n.;,])[ \\t]*(${labels})[ \\t]*(?:[-\\u2013\\u2014.]|\\r?\\n)|\\b(${labels})\\s*:`, 'gi');
  const marks = [];
  let match;
  while ((match = pattern.exec(text))) {
    const label = match[2] || match[3];
    const key = keys.find(item => new RegExp(`^${hdNotePartPattern(item)}$`, 'i').test(label));
    marks.push({ key, start:match.index + (match[2] ? match[1].length : 0), end:match.index + match[0].length });
    // A label ending in a line break: the next label may start that line.
    if (match[0].endsWith('\n')) pattern.lastIndex -= 1;
  }
  return marks;
}
function hdNoteMissingParts(text, parts = HD_NOTE_DEFAULT_PARTS) {
  const keys = parts.filter(key => HD_NOTE_PARTS[key]);
  if (!keys.length) return [];
  const value = String(text || '');
  const marks = hdNoteLabels(value, keys);
  const found = {};
  marks.forEach((mark, i) => {
    found[mark.key] = (found[mark.key] || '') + value.slice(mark.end, i + 1 < marks.length ? marks[i + 1].start : value.length);
  });
  return keys.filter(key => (found[key] || '').replace(/\s+/g, '').length < 8).map(key => HD_NOTE_PARTS[key]);
}

// A work note or customer comment typed but not yet added: kept per ticket,
// so a redraw (chat, KB search, Verify, Check diagnosis, owner choice,
// resolution code) never clears it. Never kept with a password in it: the
// draft is dropped instead, and adding it is refused as before. Cleared once
// the note or comment is added.
const HD_DRAFT_MAX = 4000;
function hdDraft(ticket, kind) {
  const drafts = ticket && ticket.drafts;
  return drafts && typeof drafts[kind] === 'string' ? drafts[kind] : '';
}
function hdKeepDraft(id, kind, value) {
  const ticket = hdTicketById(id); if (!ticket || !['note', 'comment', 'resolution', 'rewriteShort', 'rewriteDesc', 'kbTitle', 'kbText', 'caller', 'callback', 'explain', 'followUp'].includes(kind)) return;
  const text = String(value || '').slice(0, HD_DRAFT_MAX);
  ticket.drafts = { ...(ticket.drafts || {}) };
  if (!text || hdPasswordInText(text)) delete ticket.drafts[kind]; else ticket.drafts[kind] = text;
  if (!Object.keys(ticket.drafts).length) delete ticket.drafts;
  if (kind === 'note') hdUpdateNoteNeeds(ticket, text);
  hdSave();
}
function hdClearDraft(ticket, kind) {
  if (!ticket || !ticket.drafts) return;
  delete ticket.drafts[kind];
  if (!Object.keys(ticket.drafts).length) delete ticket.drafts;
}

// "Your note needs": beside the Work notes box of a ticket that checks its
// notes (console notes). Each part ticks live as the student types, by the
// rule above. Next action shows when the ticket can go to another team (it
// is required once the ticket stays open), and a ticket's own items
// (notes.needs: [{ label, pattern }], e.g. SEC-2153's number and time) tick
// when the text matches. With nothing typed, it reads the last added note.
function hdNoteNeeds(ticket, text) {
  const config = hdConsole(ticket).notes; if (!config) return null;
  const notes = (ticket.notes || []).filter(note => note.author === 'Riley Morgan');
  const value = String(text || '') || (notes.length ? notes[notes.length - 1].text : '');
  const parts = hdConsoleNoteParts(ticket);
  const base = parts.filter(key => key !== 'next');
  const missing = hdNoteMissingParts(value, config.nextAction ? [...base, 'next'] : base);
  const rows = base.map(key => ({ label:HD_NOTE_PARTS[key], ok:!missing.includes(HD_NOTE_PARTS[key]) }));
  if (config.nextAction) rows.push({ label:parts.includes('next') ? 'Next action' : 'Next action (when it goes to another team)', ok:!missing.includes('Next action') });
  (Array.isArray(config.needs) ? config.needs : []).forEach(item => {
    let ok = false;
    try { ok = new RegExp(item.pattern, 'i').test(value); } catch (_) {}
    rows.push({ label:item.label, ok });
  });
  return rows;
}
function hdNoteNeedsList(rows) {
  return rows.map(row => `<li data-done="${row.ok ? 'yes' : 'no'}">${row.ok ? '✓' : '○'} ${hdEsc(row.label)}</li>`).join('');
}
function hdNoteNeedsCard(ticket) {
  const rows = hdNoteNeeds(ticket, hdDraft(ticket, 'note')); if (!rows) return '';
  return `<div class="hd-note-needs" style="margin:0 0 10px"><strong style="font-size:12px">Your note needs</strong><ul class="hd-list hd-outcomes" id="hd-note-needs" aria-live="polite">${hdNoteNeedsList(rows)}</ul></div>`;
}
function hdUpdateNoteNeeds(ticket, text) {
  const list = typeof document !== 'undefined' && document.getElementById('hd-note-needs');
  const rows = list && hdNoteNeeds(ticket, text);
  if (rows) list.innerHTML = hdNoteNeedsList(rows);
}
function hdConsoleNoteParts(ticket) {
  const config = hdConsole(ticket).notes || {};
  const parts = Array.isArray(config.parts) && config.parts.length ? config.parts.filter(key => HD_NOTE_PARTS[key] && key !== 'next') : HD_NOTE_DEFAULT_PARTS;
  return config.nextAction && hdTicketStaysOpen(ticket) ? [...parts, 'next'] : parts;
}
function hdJoinWords(words) { return words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`; }
function hdConsoleNoteFeedback(ticket, text) {
  const labels = hdConsoleNoteParts(ticket).map(key => HD_NOTE_PARTS[key]);
  const missing = hdNoteMissingParts(text, hdConsoleNoteParts(ticket));
  return missing.length ? `Note added. A complete note for this ticket has ${labels.length} parts: ${hdJoinWords(labels)}. Still missing: ${missing.join(', ')}.` : `Note added: ${hdJoinWords(labels)} are all there.`;
}
// Internal words a customer comment shouldn't use (a ticket's own list:
// e.g. badPwdCount, KB step numbers, server names). Whole words, any case.
function hdJargonFound(text, words) {
  const value = String(text || '');
  return (Array.isArray(words) ? words : []).filter(word => {
    const escaped = String(word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    return word && new RegExp(`(^|[^A-Za-z0-9])${escaped}(?=[^A-Za-z0-9]|$)`, 'i').test(value);
  });
}

// Knowledge Base search: symptom words and error codes against each
// article's ID, title and text. An article with keywords (its curated "found
// by" words, KB-0059) is searched by its ID, title and keywords only, so a
// rule in its text ("Never ask for the user's password") doesn't list it for
// an unrelated search such as "forgot password". A word matches the start of an article word
// once a plural or -ed/-ing ending is dropped ("locked" finds "lockout"); a
// word with a digit (an error code, a KB number) must match a whole article
// word. Most words matched first, then by ID.
const HD_KB_FILLER = new Set('a an the my me i is it to of and or in on for with this that be was am are do does how what why can cant'.split(' '));
function hdKbWords(text) { return String(text || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean); }
function hdKbStem(word) {
  if (/\d/.test(word) || word.length <= 4) return word;
  const stem = word.replace(/(ing|ed|es|s)$/, '');
  return stem.length >= 3 ? stem : word;
}
function hdKbSearchArticles(query, articles) {
  const terms = [...new Set(hdKbWords(query).filter(word => !HD_KB_FILLER.has(word)))];
  if (!terms.length) return [];
  return (articles || []).map(article => {
    // keywords: an article's "found by" words (KB-0059), searched but not shown.
    const words = hdKbWords(`${article.id} ${article.title} ${article.keywords || article.summary}`);
    const matched = terms.filter(term => (/\d/.test(term) ? words.includes(term) : words.some(word => word.startsWith(hdKbStem(term)))));
    return { article, score:matched.length };
  }).filter(row => row.score > 0).sort((a, b) => b.score - a.score || a.article.id.localeCompare(b.article.id)).map(row => row.article);
}
function hdKbSearch(event, id) {
  if (event && event.preventDefault) event.preventDefault();
  const ticket = hdTicketById(id); if (!ticket || !hdConsole(ticket).kb) return;
  const input = document.getElementById('hd-kb-input');
  const query = String(input ? input.value : '').trim().slice(0, 80);
  const state = hdConsoleState(ticket);
  state.kbQuery = query; state.kbOpen = '';
  if (query) {
    const results = hdKbSearchArticles(query, hdKbArticles()).map(article => article.id);
    state.kbSearches.push({ query, results, at:new Date().toISOString() });
    if (state.kbSearches.length > 30) state.kbSearches.splice(0, state.kbSearches.length - 30);
    hdPracticeEvent('kb_search', { ticket:ticket.id, query, results:results.join(', ') });
    // Prove It: the instructor sees the words searched (never the results).
    hdProveEvent('kb_search', { value:query });
  }
  hdRerender();
}
function hdKbOpen(id, articleId) {
  const ticket = hdTicketById(id); if (!ticket || !hdConsole(ticket).kb) return;
  const article = hdKbArticles().find(item => item.id === articleId); if (!article) return;
  const state = hdConsoleState(ticket);
  state.kbOpen = state.kbOpen === articleId ? '' : articleId;
  if (state.kbOpen && !state.kbOpened.includes(articleId)) {
    state.kbOpened.push(articleId);
    hdPracticeEvent('evidence_opened', { ticket:ticket.id, source:`kb:${articleId}`, label:`${articleId} · ${article.title}` });
    hdProveOpened(`kb:${articleId}`, `${articleId} · ${article.title}`);
  }
  hdRerender();
}

// Caller chat: the ticket's question buttons and the caller's scripted
// replies. A reply can differ while the account card's user is still locked
// (replyLocked); that question comes back once the account is unlocked. A
// question that asks for a password is refused, as PR #100's shell does: the
// caller never hears it, and the ticket is flagged.
function hdConsoleAccountLocked(ticket) {
  const account = hdConsole(ticket).account;
  const user = account && hdUserById(account.userId);
  return !!(user && user.locked);
}
// A reply that waits: while the account card's user is locked (replyLocked),
// or until the ticket's action afterAction has been taken (replyBefore).
function hdChatPending(ticket, question) {
  if (question.replyLocked && hdConsoleAccountLocked(ticket)) return true;
  return !!question.afterAction && !hdConsoleState(ticket).actions.some(action => action.id === question.afterAction);
}
function hdChatQuestionOpen(ticket, question) {
  const asked = hdConsoleState(ticket).chat.filter(entry => entry.id === question.id);
  if (!asked.length) return true;
  const last = asked[asked.length - 1];
  return !question.asksPassword && last.whileLocked === true && !hdChatPending(ticket, question);
}
function hdChatAsk(id, questionId) {
  const ticket = hdTicketById(id); const caller = ticket && hdConsole(ticket).caller;
  const question = caller && (caller.questions || []).find(item => item.id === questionId);
  if (!question || !hdChatQuestionOpen(ticket, question)) return;
  const state = hdConsoleState(ticket);
  if (question.asksPassword) {
    ticket.passwordAsked = true;
    state.chat.push({ id:question.id, question:question.text, refused:true, time:hdConsoleTime(ticket) });
    hdPracticeEvent('password_refused', { ticket:ticket.id, field:'chat' });
    toast(`${HD_PASSWORD_STOP} The help desk never asks for a password, for any reason (KB-0024).`);
    hdRerender(); return;
  }
  const whileLocked = hdChatPending(ticket, question);
  const reply = whileLocked ? (question.replyLocked && hdConsoleAccountLocked(ticket) ? question.replyLocked : question.replyBefore || question.replyLocked) : question.reply;
  state.chat.push({ id:question.id, question:question.text, reply, whileLocked, time:hdConsoleTime(ticket) });
  hdPracticeEvent('caller_question', { ticket:ticket.id, question:question.id });
  hdRerender();
}

// Verification: the ticket's choices and feedback. Every try is kept; a
// choice marked critical is recorded as a critical error. Unlock account
// works only after a passing choice.
function hdVerify(id, optionId) {
  const ticket = hdTicketById(id); const config = ticket && hdConsole(ticket).verification;
  const option = config && (config.options || []).find(item => item.id === optionId);
  if (!option) return;
  const verification = hdConsoleState(ticket).verification;
  if (verification.passed || verification.unverified) return;
  verification.tries.push(option.id);
  verification.choice = option.id;
  if (option.critical && !verification.criticalErrors.includes(option.id)) verification.criticalErrors.push(option.id);
  if (option.pass) {
    verification.passed = true;
    hdHistory(ticket, option.history || `Caller verified: ${option.text}`);
  }
  // The right conclusion can be that the caller can't be verified (KB-0024).
  if (option.concludes === 'unverified') {
    verification.unverified = true;
    hdHistory(ticket, option.history || 'Caller could not be verified.');
  }
  hdPracticeEvent('identity_checked', { ticket:ticket.id, choice:option.id, pass:option.pass === true, critical:option.critical === true });
  hdRerender();
}
// Module 6 (console B): a choice a user's request asks for (console.choice).
// Its own card and state, apart from caller verification: no "Caller
// verified" history, no identity_checked event, nothing about Unlock. Every
// try is kept; a critical option is recorded as a critical error; the right
// option records its action and closes the card. Practice only: a Prove
// ticket's console never carries it (hdConsole).
function hdChoiceState(ticket) {
  const state = hdConsoleState(ticket);
  const choice = state.choice = state.choice && typeof state.choice === 'object' ? state.choice : {};
  choice.tries = Array.isArray(choice.tries) ? choice.tries : [];
  choice.last = typeof choice.last === 'string' ? choice.last : '';
  choice.done = choice.done === true;
  return choice;
}
function hdChoiceOpen(ticket) {
  const config = hdConsole(ticket).choice;
  if (!config || !Array.isArray(config.options) || !config.options.length) return false;
  return !config.after || hdConsoleState(ticket).actions.some(entry => entry.id === config.after);
}
function hdChoose(id, optionId) {
  const ticket = hdTicketById(id); if (!ticket || !hdChoiceOpen(ticket)) return;
  const option = hdConsole(ticket).choice.options.find(item => item && item.id === optionId);
  const choice = hdChoiceState(ticket);
  if (!option || choice.done) return;
  choice.tries.push(option.id);
  choice.last = option.id;
  if (option.critical) hdConsoleCritical(ticket, `choice:${option.id}`, `Chose: ${option.text}`);
  if (option.right) {
    choice.done = true;
    const action = option.action && option.action.id ? option.action : null;
    if (action) {
      const state = hdConsoleState(ticket);
      state.actions.push({ id:action.id, time:hdConsoleTime(ticket), choice:option.id });
      hdHistory(ticket, `${action.label || option.text}.`);
    }
  }
  hdPracticeEvent('choice_made', { ticket:ticket.id, choice:option.id, right:option.right === true, critical:option.critical === true, ...(option.right && option.action && option.action.id ? { action:option.action.id } : {}) });
  hdRerender();
}
window.hdChoose = hdChoose;
// Why an unlock of this user must wait, or '' when it can go ahead. Whatever
// state the ticket is in: resolving it first doesn't skip the caller check.
function hdConsoleUnlockBlock(userId) {
  const waiting = hdState.tickets.find(ticket => {
    const config = hdConsole(ticket);
    return config.account && config.account.userId === userId && config.verification && !hdConsoleState(ticket).verification.passed;
  });
  return waiting ? `Verify the caller on ${waiting.id} before you unlock this account.` : '';
}
function hdConsoleUnlock(id, via = 'Account card') {
  const ticket = hdTicketById(id); const account = ticket && hdConsole(ticket).account;
  const user = account && hdUserById(account.userId);
  if (!user) return;
  const blocked = hdConsoleUnlockBlock(user.id);
  if (blocked) { hdPracticeEvent('unlock_blocked', { ticket:ticket.id, via }); toast(blocked); hdRerender(); return; }
  if (!user.locked) { toast(`${user.username} is not locked out.`); return; }
  hdState.userOverrides[user.id] = { ...(hdState.userOverrides[user.id] || {}), locked:false };
  hdConsoleState(ticket).unlocks.push({ via, time:hdConsoleTime(ticket) });
  hdHistory(ticket, `Account ${user.username} unlocked (${via}).`);
  hdPracticeEvent('account_unlocked', { ticket:ticket.id, via });
  toast(`Account ${user.username} unlocked.`);
  hdRerender();
}

// Additional comments (customer-visible): kept apart from Work notes.
function hdAddComment(id) {
  const ticket = hdTicketById(id); if (!ticket || !hdConsole(ticket).comments) return false;
  const input = document.getElementById('hd-comment-input');
  const text = input && input.value.trim();
  if (!text) { toast('Write the comment the customer will read first.'); return false; }
  if (hdPasswordInText(text)) { toast(hdRefusePasswordText(ticket, 'customer comment')); return false; }
  // A follow-up ticket (Module 3 on) also keeps each comment's shift time, so
  // an update can be checked against the follow-up time.
  hdComments(ticket).push({ time:hdConsoleTime(ticket), author:'Riley Morgan', text:text.slice(0, 2000), ...(hdConsole(ticket).followUp ? { at:hdShiftIso(ticket) } : {}) });
  hdClearDraft(ticket, 'comment');
  hdHistory(ticket, 'Additional comment (customer-visible) added.');
  const jargon = hdJargonFound(text, (hdConsole(ticket).notes || {}).jargon);
  const config = hdConsole(ticket).comments;
  // A ticket's internal names (servers, groups, other users) never belong
  // in what the customer reads.
  const internal = config && typeof config === 'object' && Array.isArray(config.internalNames) ? hdJargonFound(text, config.internalNames) : [];
  hdPracticeEvent('customer_comment', { ticket:ticket.id, jargon:jargon.join(', '), ...(internal.length ? { internal:internal.join(', ') } : {}) });
  const repeat = config && typeof config === 'object' ? config.repeatLine : null;
  const repeatTip = repeat && !hdCommentHasRepeatLine(ticket, text) ? ` It doesn't say ${repeat.label} yet.` : '';
  const internalTip = internal.length ? ` Internal names stay in the work notes: ${internal.join(', ')}.` : '';
  const timeTip = hdCommentTimeTip(ticket, text);
  const extraTip = `${repeatTip}${timeTip}`;
  toast(jargon.length ? `Comment added. The customer won't know these words: ${jargon.join(', ')}. Say it in plain words.${internalTip}${extraTip}` : internalTip ? `Comment added.${internalTip}${extraTip}` : extraTip ? `Customer comment added.${extraTip}` : 'Customer comment added.');
  hdRerender();
  return true;
}
const HD_RESOLUTION_CODES = ['Solution provided', 'Workaround provided', 'Escalated', 'Routed to Security Operations', 'User cancelled', 'Duplicate'];
function hdResolutionCodes(ticket) {
  const config = hdConsole(ticket).resolutionCode;
  if (config && Array.isArray(config.options) && config.options.length) return config.options;
  // A ticket that logs contact attempts can close for no response.
  return hdContactConfig(ticket) ? [...HD_RESOLUTION_CODES, HD_NO_RESPONSE_CODE] : HD_RESOLUTION_CODES;
}
// A matrix ticket always has the resolution code (required to resolve).
function hdResolutionConfig(ticket) { return hdConsole(ticket).resolutionCode || (hdIsMatrix(ticket) ? { required:true } : null); }
function hdSetResolutionCode(id, value) {
  const ticket = hdTicketById(id); if (!ticket || !hdResolutionConfig(ticket)) return;
  if (hdIsMatrix(ticket) && ['Resolved', 'Closed', 'Canceled'].includes(ticket.status)) return;
  const code = hdResolutionCodes(ticket).includes(value) ? value : '';
  hdConsoleState(ticket).resolutionCode = code;
  if (code) hdHistory(ticket, `Resolution code set to ${code}.`);
  hdRerender();
}
// Actions: what the technician does (walk the user to self-service reset,
// offer a loaner, decline calmly...). A critical one is recorded as a
// critical error and shown at once. An action that needs a verified caller,
// taken too early, is not done and is recorded as its earlyCritical.
function hdConsoleCritical(ticket, id, text) {
  const state = hdConsoleState(ticket);
  if (!state.critical.some(entry => entry.id === id)) state.critical.push({ id, text, time:hdConsoleTime(ticket) });
}
function hdConsoleAction(id, actionId) {
  const ticket = hdTicketById(id); const actions = ticket && hdConsole(ticket).actions;
  const action = Array.isArray(actions) && actions.find(item => item.id === actionId);
  if (!action) return;
  const state = hdConsoleState(ticket);
  // An action that needs the request's approval (needsApproval), taken
  // before it: not done, and recorded as its earlyCritical.
  if (action.needsApproval && !hdRequestApproved(ticket)) {
    if (action.earlyCritical !== false) hdConsoleCritical(ticket, `early:${action.id}`, action.earlyCritical || 'Acted before the request was approved');
    state.lastAction = `early:${action.id}`;
    hdPracticeEvent('action_refused', { ticket:ticket.id, action:action.id });
    toast(action.earlyFeedback || 'Wait for the request to be approved first.');
    hdRerender(); return;
  }
  if (action.needsVerification && !state.verification.passed) {
    // earlyCritical:false: refused until the caller is verified, but not a
    // critical error (HD-2152's loaner).
    if (action.earlyCritical !== false) hdConsoleCritical(ticket, `early:${action.id}`, action.earlyCritical || 'Acted before verifying the caller');
    state.lastAction = `early:${action.id}`;
    hdPracticeEvent('action_refused', { ticket:ticket.id, action:action.id });
    toast(action.earlyFeedback || 'Verify the caller first (KB-0024).');
    hdRerender(); return;
  }
  // An action whose result depends on an earlier one (needsAction: an action
  // id, or a list): taken before it, the action isn't done and the reply is
  // beforeText. Not a critical error, and it can be taken again later.
  const needed = action.needsAction ? [].concat(action.needsAction).filter(Boolean) : [];
  if (needed.length && !needed.every(need => state.actions.some(entry => entry.id === need))) {
    state.lastAction = `before:${action.id}`;
    hdHistory(ticket, `Action: ${action.text}. Result: ${action.beforeText || 'not yet'}`);
    hdPracticeEvent('action_refused', { ticket:ticket.id, action:action.id, reason:'needs-action' });
    toast(action.beforeText || 'Not yet.');
    hdRerender(); return;
  }
  if (!state.actions.some(entry => entry.id === action.id)) state.actions.push({ id:action.id, time:hdConsoleTime(ticket) });
  if (action.critical) hdConsoleCritical(ticket, action.id, action.text);
  state.lastAction = action.id;
  hdHistory(ticket, action.history || `Action: ${action.text}.`);
  hdPracticeEvent('action_taken', { ticket:ticket.id, action:action.id, critical:action.critical === true });
  toast(action.feedback || 'Done.');
  hdRerender();
}
// Who owns the ticket: keep it at Tier 1 (resolved), escalate it, or route it
// to Security Operations. Practice: the choice and its feedback show at once,
// and another choice can follow. The ticket only closes (state, assignment
// group, closure code and, for the SOC route, the category and caller fields)
// once the work its feedback asks for under Action and Documentation is done,
// judged as if the ticket were already in its new state (an escalated note
// needs a Next action). Each choice starts from the ticket's own fields, so a
// changed choice never leaves another route's classification behind.
// What is missing names only the checks not yet met, when each of them has
// its own `missing` line (HD-2152's Action); otherwise it is the area's fix.
function hdConsoleOwnerBlock(ticket, option) {
  const areas = (hdConsole(ticket).feedback || []).filter(area => ['Action', 'Documentation'].includes(area.area));
  const status = ticket.status;
  ticket.status = option.status;
  let text = '';
  const missing = areas.find(area => !(area.checks || []).every(rule => hdConsoleRule(ticket, rule)));
  if (missing) {
    const unmet = (missing.checks || []).filter(rule => !hdConsoleRule(ticket, rule));
    text = unmet.every(rule => rule.missing) ? unmet.map(rule => rule.missing).join(' ') : missing.fix;
  }
  ticket.status = status;
  return text;
}
function hdConsoleOwner(id, optionId) {
  const ticket = hdTicketById(id); const config = ticket && hdConsole(ticket).owner;
  const option = config && (config.options || []).find(item => item.id === optionId);
  if (!option) return;
  const owner = hdConsoleState(ticket).owner;
  owner.choice = option.id;
  owner.tries.push(option.id);
  hdPracticeEvent('owner_chosen', { ticket:ticket.id, owner:option.id, right:option.right === true });
  const blocked = hdConsoleOwnerBlock(ticket, option);
  owner.blocked = blocked;
  // Every choice starts from the ticket's own fields: no earlier route's
  // classification, caller status or closure is left behind.
  const template = HD_TICKET_TEMPLATES.find(item => item.id === ticket.id) || {};
  ticket.category = option.category && !blocked ? option.category : template.category || ticket.category;
  ticket.subcategory = option.category && !blocked ? option.subcategory || '' : template.subcategory || ticket.subcategory;
  if (option.caller && !blocked) ticket.callerStatus = option.caller; else delete ticket.callerStatus;
  if (blocked) {
    // A ticket an earlier choice closed opens again until this route's work is done.
    if (['Resolved', 'Escalated'].includes(ticket.status)) {
      ticket.status = 'In Progress'; ticket.assignedTechnician = 'Riley Morgan'; ticket.closureCode = ''; ticket.resolution = '';
      hdHistory(ticket, 'Reopened: the new owner choice waits for its work.');
    }
    toast(`Not closed yet. ${blocked}`); hdRerender(); return;
  }
  ticket.status = option.status;
  ticket.assignedTechnician = option.group;
  ticket.closureCode = option.code;
  const note = hdConsoleCompleteNote(ticket);
  ticket.resolution = note ? note.text : '';
  hdHistory(ticket, option.status === 'Resolved' ? `Resolved by the Service Desk (${option.code}).` : `Assigned to ${option.group}; state ${option.status}.`);
  // Closing opens "Check my work", so anything still missing (Investigation,
  // Diagnosis) shows at once. Feedback only: it never blocks and never scores.
  if (hdConsole(ticket).feedback) hdConsoleState(ticket).feedbackShown = true;
  hdRerender();
}

// Practice "Check my work": the ticket's own areas (feedback), each met or
// not by rules that read the ticket's real state. Critical errors first.
// Never points, never a score; category and priority are never judged.
function hdConsoleRule(ticket, rule) {
  const config = hdConsole(ticket); const state = hdConsoleState(ticket);
  const notes = (ticket.notes || []).filter(note => note.author === 'Riley Morgan');
  const comments = hdComments(ticket);
  const test = (pattern, text) => { try { return new RegExp(pattern, 'i').test(String(text || '')); } catch { return false; } };
  if (rule.owner) { const option = ((config.owner || {}).options || []).find(item => item.id === state.owner.choice); return !!(option && option.right); }
  if (rule.kb) return state.kbOpened.includes(rule.kb);
  if (rule.chat) return rule.chat.every(id => state.chat.some(entry => entry.id === id && !entry.refused));
  if (rule.diagnosis) return ticket.diagnosisCorrect === true;
  if (rule.action) return state.actions.some(entry => entry.id === rule.action);
  if (rule.verified) return state.verification.passed;
  if (rule.verifyChoice) return state.verification.tries.includes(rule.verifyChoice);
  if (rule.confirmed) return state.chat.some(entry => entry.id === rule.confirmed && !entry.refused && entry.whileLocked === false);
  if (rule.note) return !!hdConsoleCompleteNote(ticket);
  if (rule.notePattern) return notes.some(note => test(rule.notePattern, note.text));
  if (rule.comment) return comments.length > 0 && !hdJargonFound(comments[comments.length - 1].text, (config.notes || {}).jargon).length;
  if (rule.commentPattern) return comments.some(comment => test(rule.commentPattern, comment.text));
  // printerInstalled: { computer, printer }: that printer (by its \\server\name
  // path) is installed on that laptop in this shift.
  if (rule.printerInstalled) {
    const machine = hdMachine(rule.printerInstalled.computer);
    return !!(machine && Array.isArray(machine.printers) && machine.printers.includes(rule.printerInstalled.printer));
  }
  // Module 2 work (matrix tickets): the request, links, state, owner,
  // contact attempts and the rewrite, each read from the ticket's real state.
  if (rule.converted) return !!ticket.request;
  if (rule.requestField) return !!(ticket.request && ticket.request.fields.some(field => field.id === rule.requestField.id && field.value === rule.requestField.value));
  if (rule.requestFor) return !!(ticket.request && ticket.request.requestedFor === rule.requestFor);
  if (rule.child) { const child = hdTicketById(rule.child); return !!(child && child.parentId === ticket.id); }
  if (rule.status) return [].concat(rule.status).some(value => value === ticket.status || value === hdStatusText(ticket));
  if (rule.group) return ticket.assignmentGroup === rule.group;
  // Module 3: the ticket's calculated priority (3-A stays P3 however angry).
  if (rule.priority) return ticket.priority === rule.priority;
  if (rule.attempts) return hdContactAttempts(ticket).length >= rule.attempts;
  if (rule.code) return (state.resolutionCode || ticket.closureCode) === rule.code;
  if (rule.rewrite) return !!(state.rewrite && !state.rewrite.missing.length);
  // Module 5 work on a computer's tool screens (each off unless a ticket uses it):
  //   seen: '<machine.seen key>', computer, after?: '<action id>'   the screen
  //     was opened on that computer (after that action, when given)
  //   typed: '<regex source>', computer   a command typed on that computer
  //   actionsAfter: { after, action, min, without? }   at least min of action
  //     after the last after, and no without after it (three clean dock cycles)
  //   triage: { category, subcategory, ci }   the student's classification
  if (rule.seen) {
    const machine = hdMachine(rule.computer);
    if (!machine || !Array.isArray(machine.seen) || !machine.seen.includes(rule.seen)) return false;
    if (!rule.after) return true;
    const index = state.actions.map(entry => entry.id).lastIndexOf(rule.after);
    const at = index < 0 ? -1 : (Number(state.actionsDropped) || 0) + index;
    const seenAt = machine.seenAt && typeof machine.seenAt === 'object' ? Number(machine.seenAt[rule.seen]) : NaN;
    return at >= 0 && seenAt > at;
  }
  if (rule.triage) {
    const chosen = hdClassification(ticket);
    return ['category', 'subcategory', 'ci'].every(key => !rule.triage[key] || chosen[key] === rule.triage[key]);
  }
  if (rule.typed) {
    // Only a command the console ran: a refused one (wrong options, a path
    // not found, a misspelling) records that as its result (hdWinTypedCommand).
    // A winget line that found nothing or was mistyped is refused too (Module 6).
    const refused = /^(dism|sfc|chkdsk): (wrong options|volume in use)$|^path not found$|^no folder$|^no log named$|^misspelled|^winget[^:]*: (no |not |more than one|unrecognized|missing value|nothing to)/i;
    return (Array.isArray(hdState.practiceLog) ? hdState.practiceLog : []).some(entry => entry && entry.type === 'command_run' && entry.computer === rule.computer
      && test(rule.typed, String(entry.command || '').trim()) && !refused.test(String(entry.result || '')));
  }
  if (rule.actionsAfter) {
    const spec = rule.actionsAfter; const ids = state.actions.map(entry => entry.id);
    const at = ids.lastIndexOf(spec.after); if (at < 0) return false;
    const later = ids.slice(at + 1);
    return later.filter(id => id === spec.action).length >= Number(spec.min || 1) && !(spec.without && later.includes(spec.without));
  }
  // Module 6 work (each off unless a ticket uses it):
  //   any: [rule]   one of the rules holds (a screen or a typed line)
  //   attached: '<KB id>'   the article was attached to the ticket
  //   requestItem: '<catalog item>'   the request was made with that item
  //   machine: { computer, path, value | values }   a machine value (hdMachineValueIs)
  //   appInstalled: { computer, app }   the app is in that computer's Installed apps
  //   synced: '<computer>'   OneDrive is signed in, nothing fails to sync, and
  //     no file was deleted to clear the error
  if (rule.any) return Array.isArray(rule.any) && rule.any.some(item => item && hdConsoleRule(ticket, item));
  if (rule.attached) return (state.kbAttached || []).includes(rule.attached);
  if (rule.requestItem) return !!(ticket.request && ticket.request.item === rule.requestItem);
  if (rule.machine) return hdMachineValueIs(rule.machine);
  if (rule.appInstalled) return hdWinIsInstalled(hdMachine(rule.appInstalled.computer), rule.appInstalled.app);
  if (rule.synced) {
    const oneDrive = hdWinOneDrive(hdMachine(rule.synced));
    return !!oneDrive && oneDrive.linked !== false && !hdWinOneDriveProblems(oneDrive).length
      && !state.actions.some(entry => entry.id === 'onedrive-file-deleted' && entry.computer === rule.synced);
  }
  // Module 3 work: the call, hold, handoff, follow-up and team messages.
  const comms = hdCommsRule(ticket, rule);
  if (comms !== undefined) return comms;
  return false;
}
function hdConsoleFeedback(ticket) {
  const areas = hdConsole(ticket).feedback;
  if (!Array.isArray(areas)) return null;
  const state = hdConsoleState(ticket);
  const verify = (hdConsole(ticket).verification || {}).options || [];
  const critical = [
    ...state.verification.criticalErrors.map(id => { const option = verify.find(item => item.id === id); return option ? `Chose: ${option.text}` : id; }),
    ...state.critical.map(entry => entry.text),
    // promiseCritical (3-B): the latest comment promises a time it must not. A
    // corrected comment clears it: a text pattern is too weak to be permanent.
    ...(hdCommentPromiseCritical(ticket) ? [hdCommentPromiseCritical(ticket)] : []),
  ];
  const flags = [
    ...(ticket.passwordAsked ? ['Asked for a password in the chat (refused, never sent).'] : []),
    ...(ticket.passwordWritten ? ['Wrote a password in a ticket field (refused, not saved).'] : []),
  ];
  // On a matrix ticket (Module 2 on), an area whose unmet checks each have
  // their own `missing` line names exactly those (2-B names the link it
  // misses); older tickets keep the area's fix, as before.
  const matrix = hdIsMatrix(ticket);
  return { critical, flags, areas:areas.map(area => {
    const unmet = (area.checks || []).filter(rule => !hdConsoleRule(ticket, rule));
    const ok = !unmet.length;
    const missing = matrix && unmet.length && unmet.every(rule => rule.missing) ? unmet.map(rule => rule.missing).join(' ') : '';
    return { area:area.area, ok, text:ok ? area.good : missing || area.fix };
  }) };
}
function hdConsoleCheckWork(id) {
  const ticket = hdTicketById(id); if (!ticket || !hdConsole(ticket).feedback) return;
  hdConsoleState(ticket).feedbackShown = true;
  hdPracticeEvent('feedback_shown', { ticket:ticket.id });
  hdRerender();
}

// A customer comment that tells the user what to do if the problem comes
// back: one sentence with the ticket's condition (pattern, "if it locks
// again") and, when the ticket sets one, an action for the user (action,
// "reply", "call us"). "If it happens again, I'll look into it" names no
// action, so it doesn't count.
function hdCommentHasRepeatLine(ticket, text) {
  const config = hdConsole(ticket).comments;
  const line = config && typeof config === 'object' ? config.repeatLine : null;
  if (!line || !line.pattern) return false;
  try {
    const condition = new RegExp(line.pattern, 'i');
    const action = line.action ? new RegExp(line.action, 'i') : null;
    return String(text || '').split(/[.!?]+\s+|\n+/).some(sentence => condition.test(sentence) && (!action || action.test(sentence)));
  } catch { return false; }
}

// A ticket worked through the console alone (resolveByOutcomes): no
// diagnosis dropdown or path checklist. Resolving needs every outcome its
// features ask for, and the resolution is the student's own complete note.
// Each outcome reads the ticket's real state, never a checkbox.
const HD_CONSOLE_OUTCOMES = [
  ['verified', 'Caller verified (KB-0024)', 'verify the caller the way KB-0024 says'],
  ['unlocked', 'Account unlocked after verifying', 'unlock the account on the account card'],
  ['confirmed', 'User confirmed they can sign in', 'ask the user to sign in again and confirm it works'],
  ['comment', 'Customer comment says what to do if it happens again', 'add a customer comment that tells the user what to do if it happens again'],
  ['note', 'Work note: Reported / Tried / Result', 'add a work note with every part'],
  ['code', 'Resolution code chosen', 'choose a resolution code'],
];
function hdConsoleCompleteNote(ticket) {
  const parts = hdConsoleNoteParts(ticket);
  return (ticket.notes || []).filter(note => note.author === 'Riley Morgan' && !hdNoteMissingParts(note.text, parts).length).pop() || null;
}
function hdConsoleOutcomes(ticket) {
  const config = ticket ? hdConsole(ticket) : {};
  if (!config.resolveByOutcomes) return null;
  const state = hdConsoleState(ticket);
  const confirmIds = ((config.caller || {}).questions || []).filter(question => question.confirms).map(question => question.id);
  const comments = hdComments(ticket);
  const repeat = config.comments && typeof config.comments === 'object' && config.comments.repeatLine;
  return {
    verified:!config.verification || state.verification.passed,
    unlocked:!config.account || (!hdConsoleAccountLocked(ticket) && state.unlocks.length > 0),
    confirmed:!confirmIds.length || state.chat.some(entry => confirmIds.includes(entry.id) && !entry.refused && entry.whileLocked === false),
    comment:!config.comments || (repeat ? comments.some(comment => hdCommentHasRepeatLine(ticket, comment.text)) : comments.length > 0),
    note:!config.notes || !!hdConsoleCompleteNote(ticket),
    code:!(config.resolutionCode && config.resolutionCode.required) || !!state.resolutionCode,
  };
}
// What still stands between this ticket and Resolved, or '' when nothing does.
function hdConsoleResolveBlock(ticket) {
  const outcomes = hdConsoleOutcomes(ticket);
  const missing = outcomes && HD_CONSOLE_OUTCOMES.find(([key]) => !outcomes[key]);
  return missing ? `Before you resolve this ticket, ${missing[2]}.` : '';
}
function hdConsoleOutcomesCard(ticket) {
  const outcomes = hdConsoleOutcomes(ticket); if (!outcomes) return '';
  const done = HD_CONSOLE_OUTCOMES.every(([key]) => outcomes[key]);
  return `<div class="card hd-console-outcomes"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Your progress</strong><span class="muted">Practice: the ticket resolves once every part is done.</span></div><div class="card-body"><ul class="hd-list hd-outcomes">${HD_CONSOLE_OUTCOMES.map(([key, label]) => `<li data-outcome="${key}" data-done="${outcomes[key] ? 'yes' : 'no'}">${outcomes[key] ? '✓' : '○'} ${hdEsc(label)}</li>`).join('')}</ul>${done ? '<p><strong>Every part is done.</strong> Resolve the ticket.</p>' : ''}</div></div>`;
}

// What a coach or a later package reads about one ticket's console work.
function hdConsoleProgress(id) {
  const ticket = hdTicketById(id); if (!ticket) return null;
  const config = hdConsole(ticket);
  if (!Object.keys(config).length) return null;
  const state = hdConsoleState(ticket);
  const comments = hdComments(ticket);
  const lastComment = comments[comments.length - 1];
  const note = (ticket.notes || []).filter(item => item.author === 'Riley Morgan').pop();
  return {
    kbSearches:state.kbSearches.map(row => row.query), kbOpened:state.kbOpened.slice(),
    chatAsked:state.chat.filter(entry => !entry.refused).map(entry => entry.id),
    verification:{ choice:state.verification.choice, tries:state.verification.tries.slice(), passed:state.verification.passed, criticalErrors:state.verification.criticalErrors.slice() },
    accountUnlocked:!!config.account && !hdConsoleAccountLocked(ticket), unlocks:state.unlocks.length,
    comments:comments.length, lastCommentJargon:lastComment ? hdJargonFound(lastComment.text, (config.notes || {}).jargon) : [],
    noteMissing:note ? hdNoteMissingParts(note.text, hdConsoleNoteParts(ticket)) : hdConsoleNoteParts(ticket).map(key => HD_NOTE_PARTS[key]),
    resolutionCode:state.resolutionCode,
    passwordWritten:ticket.passwordWritten === true, passwordAsked:ticket.passwordAsked === true,
    commentRepeatLine:comments.some(comment => hdCommentHasRepeatLine(ticket, comment.text)),
    outcomes:hdConsoleOutcomes(ticket),
    unverified:state.verification.unverified, actions:state.actions.map(entry => entry.id),
    critical:state.critical.map(entry => entry.id), owner:state.owner.choice, ownerTries:state.owner.tries.slice(),
    ...(config.choice ? { choiceTries:hdChoiceState(ticket).tries.slice(), choiceDone:hdChoiceState(ticket).done } : {}),
    ...hdMatrixProgress(ticket),
    ...hdCommsProgress(ticket),
  };
}

// The cards. Each is '' for a ticket without its feature.
const HD_CONSOLE_HEADER = 'style="display:flex;flex-wrap:wrap;align-items:baseline;gap:8px"';
const HD_CONSOLE_CHOICE = 'style="text-align:left;white-space:normal;height:auto;padding:10px 12px"';
function hdConsoleChatCard(ticket) {
  const caller = hdConsole(ticket).caller; if (!caller) return '';
  const state = hdConsoleState(ticket);
  const log = state.chat.length ? state.chat.map(entry => entry.refused
    ? `<div><strong>You (not asked)</strong><p>${hdEsc(entry.question)}</p><p class="muted">The help desk never asks for a password.</p></div>`
    : `<div><strong>You · ${hdEsc(entry.time)}</strong><p>${hdEsc(entry.question)}</p><strong>${hdEsc(caller.name)}</strong><p>${hdEsc(entry.reply)}</p></div>`).join('') : '<p class="muted">No questions asked yet.</p>';
  const open = (caller.questions || []).filter(question => hdChatQuestionOpen(ticket, question));
  const buttons = open.length ? `<div class="hd-chat-questions" style="display:grid;gap:8px">${open.map(question => `<button type="button" class="btn btn-secondary" ${HD_CONSOLE_CHOICE} onclick="hdChatAsk('${ticket.id}','${hdEsc(question.id)}')">${hdEsc(question.text)}</button>`).join('')}</div>` : '';
  return `<div class="card hd-chat"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>${caller.style === 'phone' ? 'Phone call' : caller.style === 'chat' ? 'Chat' : 'Caller chat'}</strong><span class="muted">${hdEsc(caller.name)} · ${caller.style === 'chat' ? 'in the chat' : 'on the line'}</span></div><div class="card-body"><div class="hd-note-list">${log}</div>${buttons}</div></div>`;
}
// An article's text: its numbered steps ("1. … 2. …", in order from 1) as a
// list, any words before step 1 as a paragraph; otherwise one paragraph.
// Always escaped: KB-0024 has placeholders like <task> and <DOMAIN\user>.
function hdKbBody(text) {
  const value = String(text || '');
  const marks = [...value.matchAll(/(^|\s)(\d{1,2})\.\s+/g)];
  const steps = [];
  for (const mark of marks) if (Number(mark[2]) === steps.length + 1) steps.push(mark);
  if (steps.length < 2) return `<p>${hdEsc(value)}</p>`;
  const start = (mark) => mark.index + mark[1].length;
  const intro = value.slice(0, start(steps[0])).trim();
  const items = steps.map((mark, i) => value.slice(mark.index + mark[0].length, i + 1 < steps.length ? start(steps[i + 1]) : value.length).trim());
  return `${intro ? `<p>${hdEsc(intro)}</p>` : ''}<ol class="hd-kb-steps" style="margin:0 0 8px;padding-left:20px;display:grid;gap:6px">${items.map(item => `<li>${hdEsc(item)}</li>`).join('')}</ol>`;
}
function hdConsoleKbCard(ticket) {
  if (!hdConsole(ticket).kb) return '';
  const state = hdConsoleState(ticket);
  const results = state.kbQuery ? hdKbSearchArticles(state.kbQuery, hdKbArticles()) : [];
  const list = !state.kbQuery ? '' : results.length ? `<div class="hd-note-list hd-kb-results">${results.map(article => `<div data-kb="${hdEsc(article.id)}"><strong>${hdEsc(article.id)} · ${hdEsc(article.title)}</strong><small class="muted"> ${hdEsc(article.audience)}</small> <button type="button" class="btn btn-ghost btn-sm" onclick="hdKbOpen('${ticket.id}','${hdEsc(article.id)}')">${state.kbOpen === article.id ? 'Close' : 'Open'}</button>${state.kbOpen === article.id ? `${hdKbBody(article.summary)}${hdKbConfig(ticket).attach ? ((state.kbAttached || []).includes(article.id) ? '<p class="muted" data-hd-kb-attached>✓ Attached to this ticket</p>' : `<button type="button" class="btn btn-secondary btn-sm" onclick="hdKbAttach('${ticket.id}','${hdEsc(article.id)}')">Attach knowledge</button>`) : ''}` : ''}</div>`).join('')}</div>` : `<p class="muted">No articles match “${hdEsc(state.kbQuery)}”. Try the symptom words or the exact error code.</p>`;
  return `<div class="card hd-kb-search"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Knowledge Base</strong><span class="muted">Search by symptom words or the error code.</span></div><div class="card-body"><form class="filterbar" onsubmit="hdKbSearch(event,'${ticket.id}')"><input id="hd-kb-input" class="ipt" maxlength="80" value="${hdEsc(state.kbQuery)}" placeholder="e.g. locked out, 0x80070005"><button class="btn btn-primary btn-sm" type="submit">Search</button></form>${list}</div></div>`;
}
function hdConsoleVerifyCard(ticket) {
  const config = hdConsole(ticket).verification; if (!config) return '';
  const verification = hdConsoleState(ticket).verification;
  const options = config.options || [];
  const shown = options.find(option => option.id === verification.choice);
  const tone = shown ? (shown.pass || shown.concludes ? 'success' : shown.critical ? 'bad' : 'warn') : '';
  const feedback = shown ? `<div class="callout ${tone}" role="${shown.critical ? 'alert' : 'status'}">${hdEsc(shown.feedback || '')}</div>` : '';
  const done = verification.passed || verification.unverified;
  const choices = done ? '' : `<div class="hd-identity-options" style="display:grid;gap:8px">${options.map(option => `<button type="button" class="btn btn-secondary" ${HD_CONSOLE_CHOICE} onclick="hdVerify('${ticket.id}','${hdEsc(option.id)}')">${hdEsc(option.text)}</button>`).join('')}</div>`;
  const badge = verification.passed ? hdBadge('Verified', 'ok') : verification.unverified ? hdBadge('Caller unverified', 'bad') : hdBadge('Not verified', 'warn');
  return `<div class="card hd-verify"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Verify caller</strong>${badge}</div><div class="card-body">${config.prompt ? `<p>${hdEsc(config.prompt)}</p>` : ''}${choices}${feedback}</div></div>`;
}
// Module 6: the choice card (hdChoose). The verification card's look, with
// its own heading; hidden until its after action.
function hdConsoleChoiceCard(ticket) {
  if (!hdChoiceOpen(ticket)) return '';
  const config = hdConsole(ticket).choice; const choice = hdChoiceState(ticket);
  const shown = config.options.find(option => option && option.id === choice.last);
  const tone = shown ? (shown.right ? 'success' : shown.critical ? 'bad' : 'warn') : '';
  const feedback = shown ? `<div class="callout ${tone}" role="${shown.critical ? 'alert' : 'status'}" data-hd-choice-feedback="${hdEsc(shown.id)}">${hdEsc(shown.feedback || '')}</div>` : '';
  const choices = choice.done ? '' : `<div class="hd-choice-options" style="display:grid;gap:8px">${config.options.filter(option => option && option.id).map(option => `<button type="button" class="btn btn-secondary" ${HD_CONSOLE_CHOICE} data-hd-choice="${hdEsc(option.id)}" onclick="hdChoose('${ticket.id}','${hdJsArg(option.id)}')">${hdEsc(option.text)}</button>`).join('')}</div>`;
  const badge = choice.done ? hdBadge('Done', 'ok') : hdBadge('Your call', 'warn');
  return `<div class="card hd-choice" data-hd-choice-card><div class="card-header" ${HD_CONSOLE_HEADER}><strong>${hdEsc(config.heading || 'Choose your response')}</strong>${badge}</div><div class="card-body">${config.prompt ? `<p>${hdEsc(config.prompt)}</p>` : ''}${choices}${feedback}</div></div>`;
}
function hdConsoleActionsCard(ticket) {
  const actions = hdConsole(ticket).actions; if (!Array.isArray(actions) || !actions.length) return '';
  const state = hdConsoleState(ticket);
  const taken = (id) => state.actions.some(entry => entry.id === id);
  // A refusal is stored as early:<id> (verification or approval) or
  // before:<id> (needsAction).
  const before = state.lastAction.startsWith('before:');
  const last = state.lastAction.startsWith('early:') ? actions.find(item => `early:${item.id}` === state.lastAction) : before ? actions.find(item => `before:${item.id}` === state.lastAction) : actions.find(item => item.id === state.lastAction);
  const early = state.lastAction.startsWith('early:');
  const earlyBad = early && last && last.earlyCritical !== false;
  const feedback = !last ? '' : before ? `<div class="callout warn" role="status">${hdEsc(last.beforeText || 'Not yet.')}</div>` : `<div class="callout ${earlyBad || (!early && last.critical) ? 'bad' : early ? 'warn' : 'success'}" role="${earlyBad || (!early && last.critical) ? 'alert' : 'status'}">${hdEsc(early ? last.earlyFeedback || (last.needsApproval ? 'Wait for the request to be approved first.' : 'Verify the caller first (KB-0024).') : last.feedback || '')}</div>`;
  // A BitLocker key is read out from the computer's BitLocker Recovery tab in
  // Active Directory (bitlockerKey), never from this card.
  const shown = actions.filter(action => !(action && action.bitlockerKey));
  if (!shown.length && !feedback) return '';
  return `<div class="card hd-actions"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Take an action</strong><span class="muted">What do you do for the caller?</span></div><div class="card-body"><div style="display:grid;gap:8px">${shown.map(action => `<button type="button" class="btn btn-secondary" ${HD_CONSOLE_CHOICE} ${taken(action.id) ? 'disabled' : ''} onclick="hdConsoleAction('${ticket.id}','${hdEsc(action.id)}')">${taken(action.id) ? '✓ ' : ''}${hdEsc(action.text)}</button>`).join('')}</div>${feedback}</div></div>`;
}
// The user's laptop, for a ticket whose fix is done on it (settingsPrinters):
// one button opens it on the Windows Desktop screen.
function hdConsoleComputerCard(ticket) {
  const config = hdConsole(ticket).settingsPrinters; if (!config || !config.computer) return '';
  const computer = hdComputerByName(config.computer); if (!computer) return '';
  return `<div class="card hd-computer"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>On the user’s laptop</strong><span class="muted">${hdEsc(computer.name)} · signed in: ${hdEsc(computer.user)}</span></div><div class="card-body"><button type="button" class="btn btn-secondary" onclick="hdSelectComputer('${hdEsc(computer.name)}','#/helpdesk/windows')">Open ${hdEsc(computer.name)}</button></div></div>`;
}
function hdConsoleOwnerCard(ticket) {
  const config = hdConsole(ticket).owner; if (!config) return '';
  const owner = hdConsoleState(ticket).owner;
  const chosen = (config.options || []).find(option => option.id === owner.choice);
  // A blocked choice stays on the card, worked out again on every redraw:
  // what is still missing, or that the route's work is now done.
  const blocked = chosen && owner.blocked ? hdConsoleOwnerBlock(ticket, chosen) : '';
  const waiting = chosen && owner.blocked ? (blocked
    ? `<div class="callout warn" role="status" data-hd-owner-blocked>Not closed yet. ${hdEsc(blocked)}</div>`
    : `<div class="callout info" role="status" data-hd-owner-blocked>Ready to close. The work this choice needs is done. Choose it again to close the ticket.</div>`) : '';
  const feedback = chosen ? `<div class="callout ${chosen.right ? 'success' : 'warn'}" role="status">${hdEsc(chosen.feedback || '')}</div>${waiting}` : '';
  return `<div class="card hd-owner"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Who owns this ticket?</strong><span class="muted">Resolve it at Tier 1, escalate it, or route it.</span></div><div class="card-body"><div style="display:grid;gap:8px">${(config.options || []).map(option => `<button type="button" class="btn ${option.id === owner.choice ? 'btn-primary' : 'btn-secondary'}" ${HD_CONSOLE_CHOICE} aria-pressed="${option.id === owner.choice}" onclick="hdConsoleOwner('${ticket.id}','${hdEsc(option.id)}')">${hdEsc(option.text)}</button>`).join('')}</div>${feedback}</div></div>`;
}
function hdConsoleFeedbackCard(ticket) {
  if (!hdConsole(ticket).feedback) return '';
  const state = hdConsoleState(ticket);
  const result = state.feedbackShown ? hdConsoleFeedback(ticket) : null;
  const critical = result && result.critical.length
    ? `<div class="callout bad" role="alert"><strong>Critical error${result.critical.length > 1 ? 's' : ''}</strong><ul class="hd-list">${result.critical.map(text => `<li>${hdEsc(text)}</li>`).join('')}</ul></div>`
    : result ? '<p><strong>No critical errors.</strong></p>' : '';
  const flags = result && result.flags.length ? `<ul class="hd-list">${result.flags.map(text => `<li>${hdEsc(text)}</li>`).join('')}</ul>` : '';
  const areas = result ? `<ul class="hd-list hd-feedback">${result.areas.map(row => `<li data-area="${hdEsc(row.area)}" data-ok="${row.ok ? 'yes' : 'no'}">${row.ok ? '✓' : '○'} <strong>${hdEsc(row.area)}:</strong> ${hdEsc(row.text)}</li>`).join('')}</ul>` : '';
  return `<div class="card hd-practice-feedback"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Check my work</strong><span class="muted">Practice: not graded</span></div><div class="card-body"><p class="muted">Feedback on your work so far, by area.${hdIsMatrix(ticket) ? '' : ' Category and priority are pre-set in Module 1.'}</p>${critical}${flags}${areas}<button type="button" class="btn btn-secondary" onclick="hdConsoleCheckWork('${ticket.id}')">${result ? 'Check again' : 'Check my work'}</button></div></div>`;
}
function hdConsoleAccountCard(ticket) {
  const account = hdConsole(ticket).account; if (!account) return '';
  const user = hdUserById(account.userId); if (!user) return '';
  return `<div class="card hd-account"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Account · ${hdEsc(user.name)}</strong>${user.locked ? hdBadge('Locked', 'bad') : hdBadge('Unlocked', 'ok')}</div><div class="card-body"><dl class="hd-dl"><dt>Username</dt><dd>${hdEsc(`${HD_ORG.netbios}\\${user.username}`)}</dd><dt>Employee ID</dt><dd>${hdEsc(user.employeeId || '')}</dd><dt>Department</dt><dd>${hdEsc(user.department)}</dd><dt>Directory phone</dt><dd>${hdEsc(user.phone || '')}</dd></dl>${hdConsoleUnlockBlock(user.id) ? '<button type="button" class="btn btn-secondary" disabled aria-describedby="hd-unlock-why" style="opacity:.55;cursor:not-allowed">Unlock account</button><p id="hd-unlock-why" class="muted">Verify the caller first (KB-0024).</p>' : `<button type="button" class="btn btn-secondary" onclick="hdConsoleUnlock('${ticket.id}')">Unlock account</button>`}</div></div>`;
}
// The first name the comment box greets: the caller's (SEC-2153's caller is
// "Karen (caller)"), else the requester's.
function hdCommentName(ticket) {
  const caller = hdConsole(ticket).caller;
  return String((caller && caller.name) || ticket.requester || '').split(' ')[0];
}
function hdConsoleCommentsCard(ticket) {
  if (!hdConsole(ticket).comments) return '';
  const comments = hdComments(ticket);
  return `<div class="card hd-comments"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Additional comments (customer-visible)</strong><span class="muted">${hdEsc(ticket.requester)} reads these. Plain words, no internal terms.</span></div><div class="card-body"><div class="hd-note-list">${comments.length ? comments.map(comment => `<div><strong>${hdEsc(comment.author)} · ${hdEsc(comment.time)}</strong><p>${hdEsc(comment.text)}</p></div>`).join('') : '<p class="muted">No customer comments yet.</p>'}</div><textarea id="hd-comment-input" class="ipt hd-note-input" rows="6" maxlength="2000" oninput="hdKeepDraft('${ticket.id}','comment',this.value)" placeholder="Hi ${hdEsc(hdCommentName(ticket))}, …">${hdEsc(hdDraft(ticket, 'comment'))}</textarea><button class="btn btn-secondary" onclick="hdAddComment('${ticket.id}')">Add customer comment</button></div></div>`;
}
function hdConsolePriorityControl(ticket) {
  const reason = hdConsole(ticket).priorityReason;
  if (!reason) return `<label>Priority<select class="select" onchange="hdSetTicketPriority('${ticket.id}',this.value)">${['P1','P2','P3','P4'].map(v=>`<option ${ticket.priority===v?'selected':''}>${v}</option>`).join('')}</select></label>`;
  return `<div class="hd-priority-preset"><span>Priority</span> ${hdBadge(ticket.priority, ticket.priority.toLowerCase())}<p class="muted" style="margin:4px 0 0">Pre-set: ${hdEsc(reason)}</p></div>`;
}
function hdConsoleResolutionControl(ticket) {
  const config = hdResolutionConfig(ticket); if (!config) return '';
  const code = hdConsoleState(ticket).resolutionCode;
  const locked = hdIsMatrix(ticket) && ['Resolved', 'Closed', 'Canceled'].includes(ticket.status);
  return `<label>Resolution code${config.required ? ' (required to resolve)' : ''}<select id="hd-resolution-code" class="select" ${locked ? 'disabled' : ''} onchange="hdSetResolutionCode('${ticket.id}',this.value)"><option value="">Choose…</option>${hdResolutionCodes(ticket).map(value => `<option ${code === value ? 'selected' : ''}>${hdEsc(value)}</option>`).join('')}</select></label>`;
}
function hdConsoleNotePlaceholder(ticket) {
  return hdConsoleNoteParts(ticket).map(key => `${HD_NOTE_PARTS[key]}: …`).join('&#10;');
}

/* ---------- Queue and matrix features (Module 2 on), switched on per ticket ----------
 * More `console` keys, each off unless a ticket's template sets it. Older
 * tickets keep the old states (HD_STATUSES), the old SLA clock
 * (hdSlaMinutes) and the old queue. Keys:
 *   matrix: { impact?, urgency?, respondedAt?, stops?:[{ from, to?, kind }] }
 *                                  Impact and Urgency (1 to 3) calculate
 *                                  Priority (HD_PRIORITY_MATRIX, P1 to P5);
 *                                  the Northstar SLA (HD_SN_SLA): respond
 *                                  target until the desk responds, then the
 *                                  resolve target, both from Created; Paused
 *                                  only for On Hold – Awaiting Caller; time in
 *                                  Resolved doesn't count; ServiceNow states
 *                                  (HD_SN_STATUSES) with an On Hold reason;
 *                                  an assignment group; resolving needs a
 *                                  resolution code and resolution notes.
 *                                  Seeds: preset impact/urgency, respondedAt
 *                                  and earlier stops (kind 'resolved' or
 *                                  'paused'), all in shift time (ISO, UTC).
 *                                  The template's status, holdReason and
 *                                  assignedTechnician seed the rest.
 *   classify: { categories:{ name:[sub] }, cis?:[...], contactTypes?:[...], preset?:{...} }
 *                                  Category / Subcategory, CI and Contact type
 *                                  the student sets; the template's own
 *                                  category is never shown on the ticket
 *   convert: { number, needsTriage?, items:[{ name, approval?, approver?, fields?:[{ id, label, options }] }] }
 *                                  Convert to Request: the incident becomes
 *                                  Canceled – Converted and carries a RITM
 *                                  (catalog item, Requested for, Approval)
 *   link: true                     link this ticket to a parent as related
 *   arrivals: [{ id, from, text, when?, at?, reopen?, resume?, approve? }]
 *                                  a message that arrives once `when` holds
 *                                  (hdArrivalMet; it may read another
 *                                  ticket), and what it does to the ticket
 *   kb: { attach?, draft? }        as kb: true, plus Attach knowledge and
 *                                  Create knowledge draft (state Review)
 *   contactAttempts: true | { seed:[{ at, method }] }
 *                                  contact attempts logged on the ticket; adds
 *                                  "No response from caller" to the codes
 *   comments: { internalNames:[...] }  names a customer comment mustn't use
 *   rewrite: { checks:[{ part, pattern, field? }] }
 *                                  short description and description the
 *                                  student rewrites; the check names each
 *                                  part (who, what, where, when, impact, ...)
 *                                  still missing (field: short, description
 *                                  or either)
 *   priorityCoach: { impact, urgency, line }
 *                                  a coached ticket's Practice explanation,
 *                                  shown once Priority is calculated
 *   feedback rules for this work:  converted, requestField:{ id, value },
 *                                  requestFor, child (a ticket linked to
 *                                  this one), status, group, attempts, code,
 *                                  rewrite; a check's `missing` line names
 *                                  what is still undone on a matrix ticket
 *   actions may set needsApproval: refused until the RITM is approved, and
 *                                  recorded as its earlyCritical
 * A ticket set (HD_PRACTICE_SETS or HD_COACHED_SETS) may set now (its fixed
 * clock), queue: true (the ServiceNow-style list view), workOrder:{ tickets,
 * groups? } and nextDay:{ unlock:[rule], max? }. A practice set may set
 * complete:[ids], the tickets its completion needs closed (default: all),
 * and queueList, the queue list it opens on (default: unassigned). The answer-key parts (the
 * work order's groups) are only ever read by hdWorkOrderCheck. */

// The set the current shift is running, or null. A coached set counts only
// while the shift still holds only its tickets: another coach's reset
// (hd1Reset, hdResetTicketScope) swaps the tickets, and the set's clock and
// queue tools go with them.
function hdActiveSet() {
  if (HD_PROVE) return null;
  if (HD_PRACTICE_SET) return HD_PRACTICE_SET.set;
  const set = hdState && hdState.ticketSet ? hdCoachedSets()[hdState.ticketSet] : null;
  return set && hdState.tickets.length && hdState.tickets.every(ticket => set.tickets.includes(ticket.id)) ? set : null;
}
// The shift clock: a set's own fixed time (moved only by "Next day"), or
// HD_SHIFT_NOW for every other shift, exactly as before.
// A Practice ticket may run on its own fixed clock (console.now, Module 3 on),
// moved only by its "Go to follow-up time". Only a caller that passes the
// ticket gets it: a set-wide caller ("Next day") keeps the set's clock.
function hdTicketClock(ticket) {
  if (HD_PROVE || !ticket) return null;
  const now = hdConsole(ticket).now;
  if (!now || Number.isNaN(Date.parse(now))) return null;
  const moved = ticket.consoleState && ticket.consoleState.clockNow;
  return new Date(moved && !Number.isNaN(Date.parse(moved)) ? moved : now);
}
function hdShiftNow(ticket) {
  // A Prove shift with its own clock (Module 2's queue, Module 3's ticket)
  // runs on it, never moved. Module 1's Prove shift has none.
  if (HD_PROVE && HD_PROVE.shift.now) return new Date(HD_PROVE.shift.now);
  const own = hdTicketClock(ticket); if (own) return own;
  const set = hdActiveSet();
  return set && set.now ? new Date(hdState.clockNow || set.now) : HD_SHIFT_NOW;
}
// Shift times are UTC everywhere, so every browser shows the same time.
function hdShiftTimeText(value) {
  const date = new Date(value); if (Number.isNaN(date.getTime())) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${HD_DAY_NAMES[date.getUTCDay()]} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}
function hdDayStart(ms) { const d = new Date(ms); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); }
function hdIsWeekday(dayMs) { const day = new Date(dayMs).getUTCDay(); return day >= 1 && day <= 5; }
// Business minutes between two times: 08:00 to 17:00 UTC, Monday to Friday.
function hdBusinessMinutes(fromMs, toMs) {
  if (!(toMs > fromMs)) return 0;
  let total = 0;
  for (let day = hdDayStart(fromMs); day < toMs; day += 86400000) {
    if (!hdIsWeekday(day)) continue;
    const open = day + HD_BUSINESS_START * 60000; const close = day + HD_BUSINESS_END * 60000;
    total += Math.max(0, Math.min(close, toMs) - Math.max(open, fromMs));
  }
  return total / 60000;
}
function hdSlaUnits(fromMs, toMs, business) { return business ? hdBusinessMinutes(fromMs, toMs) : Math.max(0, (toMs - fromMs) / 60000); }
// The time `minutes` SLA minutes after fromMs (business or clock).
function hdAddSlaUnits(fromMs, minutes, business) {
  if (!business) return fromMs + minutes * 60000;
  let at = fromMs; let left = minutes;
  for (let day = hdDayStart(fromMs), guard = 0; guard < 400; day += 86400000, guard += 1) {
    if (!hdIsWeekday(day)) continue;
    const open = day + HD_BUSINESS_START * 60000; const close = day + HD_BUSINESS_END * 60000;
    if (at < open) at = open;
    if (at >= close) continue;
    const room = (close - at) / 60000;
    if (left <= room) return at + left * 60000;
    left -= room; at = close;
  }
  return at;
}
// The same time on the next working day (Friday goes to Monday).
function hdNextWorkingDay(ms) {
  let next = ms + 86400000;
  while (!hdIsWeekday(hdDayStart(next))) next += 86400000;
  return next;
}
function hdDurationText(minutes) {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60); const rest = total % 60;
  return hours ? `${hours}h${rest ? ` ${rest}m` : ''}` : `${rest}m`;
}

function hdIsMatrix(ticket) { return !!(ticket && hdConsole(ticket).matrix); }
function hdMatrixPriority(impact, urgency) { return (HD_PRIORITY_MATRIX[String(impact)] || {})[String(urgency)] || ''; }
// A matrix ticket's start (hdFreshState): priority from the seeded impact
// and urgency, or not set; the seeded SLA history; the seeded classification.
// Reads the ticket's own console block, so it works while the file loads.
function hdMatrixStart(ticket) {
  const config = ticket.console || {};
  const matrix = config.matrix; if (!matrix) return;
  const iso = value => (value ? new Date(value).toISOString() : '');
  ticket.impact = matrix.impact ? String(matrix.impact) : '';
  ticket.urgency = matrix.urgency ? String(matrix.urgency) : '';
  ticket.priority = hdMatrixPriority(ticket.impact, ticket.urgency);
  ticket.holdReason = ticket.status === 'On Hold' ? ticket.holdReason || '' : '';
  ticket.assignmentGroup = ticket.assignmentGroup || HD_SERVICE_DESK;
  ticket.slaClock = { respondedAt:iso(matrix.respondedAt), stops:(Array.isArray(matrix.stops) ? matrix.stops : []).map(stop => ({ from:iso(stop.from), to:iso(stop.to), kind:stop.kind === 'paused' ? 'paused' : 'resolved' })) };
  if (config.classify) ticket.classification = { category:'', subcategory:'', ci:'', contactType:'', ...(config.classify.preset || {}) };
}
function hdSlaClock(ticket) {
  const clock = ticket.slaClock = ticket.slaClock || { respondedAt:'', stops:[] };
  if (!Array.isArray(clock.stops)) clock.stops = [];
  return clock;
}
// SLA minutes used between from and to, less every stop (Resolved, or On
// Hold – Awaiting Caller) inside that time.
function hdSlaUsed(ticket, fromMs, toMs, business) {
  const stopped = hdSlaClock(ticket).stops.reduce((sum, stop) => {
    const start = Math.max(fromMs, Date.parse(stop.from)); const end = Math.min(toMs, stop.to ? Date.parse(stop.to) : toMs);
    return end > start ? sum + hdSlaUnits(start, end, business) : sum;
  }, 0);
  return Math.max(0, hdSlaUnits(fromMs, toMs, business) - stopped);
}
function hdMatrixPaused(ticket) { return ticket.status === 'On Hold' && ticket.holdReason === 'Awaiting Caller'; }
// A matrix ticket's SLA bar: which target it measures (respond, then
// resolve), what is used and left, and the badge. "At risk" at 70% and
// "Breached" at 100%, as the old clock does.
function hdMatrixSla(ticket) {
  if (ticket.status === 'Canceled') return { label:ticket.cancelReason === 'Converted' ? 'Converted' : 'Canceled', cls:'ok', stopped:true };
  if (['Resolved', 'Closed'].includes(ticket.status)) return { label:'Met / stopped', cls:'ok', stopped:true };
  const targets = HD_SN_SLA[ticket.priority];
  if (!targets) return { label:'Not set', cls:'', notSet:true };
  const responded = !!hdSlaClock(ticket).respondedAt;
  const phase = responded ? 'Resolve' : 'Respond';
  const target = responded ? targets.resolve : targets.respond;
  if (!target) return { label:'By agreement', cls:'ok', phase };
  const now = hdShiftNow(ticket).getTime();
  const used = hdSlaUsed(ticket, Date.parse(ticket.createdTimestamp), now, targets.business);
  const left = target - used;
  const base = { phase, used, target, left, business:targets.business, dueMs:hdAddSlaUnits(now, Math.max(0, left), targets.business) };
  if (hdMatrixPaused(ticket)) return { ...base, label:'Paused', cls:'', paused:true, dueMs:null };
  if (used >= target) return { ...base, label:'Breached', cls:'bad' };
  if (used >= target * 0.7) return { ...base, label:'At risk', cls:'warn' };
  return { ...base, label:`${hdDurationText(left)} left`, cls:'ok' };
}
function hdSlaBadge(ticket) {
  const sla = hdSlaState(ticket);
  if (!hdIsMatrix(ticket)) return hdBadge(sla.label, sla.cls);
  if (sla.notSet) return '<span class="muted" data-sla="not-set">Not set</span>';
  // Paused: a plain grey badge (the base .hd-badge style).
  return `<span data-sla="${sla.paused ? 'paused' : sla.stopped ? 'stopped' : hdEsc(sla.cls)}">${sla.phase ? `<small class="muted">${sla.phase} </small>` : ''}${sla.paused ? hdBadge('Paused', 'paused') : hdBadge(sla.label, sla.cls)}</span>`;
}
function hdMatrixTargetText(ticket) {
  const targets = HD_SN_SLA[ticket.priority]; if (!targets) return 'Not set (set Impact and Urgency)';
  const text = minutes => (!minutes ? 'by agreement' : targets.business ? (minutes % 540 === 0 ? `${minutes / 540} business day${minutes === 540 ? '' : 's'}` : `${minutes / 60} business hours`) : minutes < 60 ? `${minutes} minutes` : `${minutes / 60} hours`);
  return `Respond ${text(targets.respond)} · resolve ${text(targets.resolve)}`;
}
function hdStatusText(ticket) {
  if (ticket.status === 'On Hold' && ticket.holdReason) return `On Hold – ${ticket.holdReason}`;
  if (ticket.status === 'Canceled' && ticket.cancelReason === 'Converted') return 'Canceled – Converted';
  return ticket.status;
}
function hdStatusBadge(ticket) { return hdBadge(hdStatusText(ticket), String(ticket.status).toLowerCase().replace(/[^a-z0-9]+/g, '-')); }
function hdShiftIso(ticket) { return hdShiftNow(ticket).toISOString(); }
// The respond target is met once, when the desk first takes the next move.
function hdMatrixRespond(ticket) {
  const clock = hdSlaClock(ticket);
  if (!clock.respondedAt) clock.respondedAt = hdShiftIso(ticket);
}
// Every state change on a matrix ticket goes through here, on the shift
// clock: it closes an open stop and opens one for Resolved or for On Hold –
// Awaiting Caller.
function hdMatrixSetStatus(ticket, status, reason, at) {
  delete hdPendingState[ticket.id];
  const clock = hdSlaClock(ticket); const now = at || hdShiftIso(ticket);
  clock.stops.forEach(stop => { if (!stop.to) stop.to = now; });
  ticket.status = status;
  ticket.holdReason = status === 'On Hold' ? reason || '' : '';
  if (status === 'Resolved') clock.stops.push({ from:now, to:'', kind:'resolved' });
  if (status === 'On Hold' && reason === 'Awaiting Caller') clock.stops.push({ from:now, to:'', kind:'paused' });
}
function hdSetImpact(id, field, value) {
  const ticket = hdTicketById(id); if (!ticket || !hdIsMatrix(ticket) || !['impact', 'urgency'].includes(field)) return;
  if (['Resolved', 'Closed', 'Canceled'].includes(ticket.status)) return;
  ticket[field] = ['1', '2', '3'].includes(String(value)) ? String(value) : '';
  const before = ticket.priority;
  ticket.priority = hdMatrixPriority(ticket.impact, ticket.urgency);
  hdHistory(ticket, `${field === 'impact' ? 'Impact' : 'Urgency'} set to ${HD_IMPACT_LABELS[ticket[field]] || 'not set'}${ticket.priority !== before ? `; Priority ${ticket.priority ? `${ticket.priority} ${HD_PRIORITY_NAMES[ticket.priority]}` : 'not set'}` : ''}.`);
  hdPracticeEvent('priority_set', { ticket:ticket.id, impact:ticket.impact, urgency:ticket.urgency, priority:ticket.priority });
  hdRerender();
}
function hdMatrixAssignToMe(ticket) {
  ticket.assignedTechnician = 'Riley Morgan';
  ticket.assignmentGroup = HD_SERVICE_DESK;
  hdMatrixRespond(ticket);
  if (['New', 'Escalated'].includes(ticket.status)) hdMatrixSetStatus(ticket, 'In Progress');
  hdHistory(ticket, `Assigned to Riley Morgan (${HD_SERVICE_DESK}); state In Progress.`);
}
function hdMatrixAssignGroup(id, group) {
  const ticket = hdTicketById(id); if (!ticket || !hdIsMatrix(ticket) || !HD_ASSIGNMENT_GROUPS.includes(group)) return;
  if (['Resolved', 'Closed', 'Canceled'].includes(ticket.status)) { toast('This ticket is closed. Reopen it before you change its assignment group.'); return; }
  if (group === HD_SERVICE_DESK) { hdMatrixAssignToMe(ticket); hdRerender(); return; }
  ticket.assignmentGroup = group;
  ticket.assignedTechnician = group;
  hdMatrixRespond(ticket);
  hdMatrixSetStatus(ticket, 'Escalated');
  hdHistory(ticket, `Assigned to ${group}; state Escalated.`);
  hdPracticeEvent('assignment_group', { ticket:ticket.id, group });
  // handoff (Module 3 on): the reassignment names what the handoff note
  // still needs. Feedback only: the note may come after the assignment.
  if (hdConsole(ticket).handoff) {
    const missing = hdHandoffMissing(ticket) || [];
    toast(missing.length ? `Assigned to ${group}. Your handoff work note needs: ${hdJoinWords(missing)}.` : `Assigned to ${group}. Your handoff work note has every part.`);
  }
  hdRerender();
}
// A state from the State list. On Hold needs a reason; Resolved needs a
// resolution code and resolution notes (spec section 5); leaving New takes
// the ticket (Assign to me).
function hdMatrixTransition(id, status) {
  const ticket = hdTicketById(id); if (!ticket) return;
  if (!(HD_SN_STATUS_NEXT[ticket.status] || []).includes(status)) { toast('That state transition is not valid from the current ticket state.'); hdRerender(); return; }
  if (status === 'On Hold') {
    const input = document.getElementById('hd-hold-reason');
    const reason = input ? input.value : '';
    if (!HD_HOLD_REASONS.includes(reason)) { toast('Choose an On Hold reason first.'); hdRerender(); return; }
    hdMatrixSetStatus(ticket, 'On Hold', reason);
    hdHistory(ticket, `State changed to On Hold – ${reason}.`);
    hdRerender(); return;
  }
  if (status === 'Resolved') {
    const state = hdConsoleState(ticket);
    const input = document.getElementById('hd-resolution-notes');
    const notes = String(input ? input.value : hdDraft(ticket, 'resolution')).trim().slice(0, 4000);
    if (!state.resolutionCode) { toast('Choose a resolution code before you resolve this ticket.'); hdRerender(); return; }
    if (notes.length < 10) { toast('Write the resolution notes before you resolve this ticket: why and how it was closed.'); hdRerender(); return; }
    if (hdPasswordInText(notes)) { toast(hdRefusePasswordText(ticket, 'resolution note')); hdRerender(); return; }
    ticket.resolution = notes; ticket.closureCode = state.resolutionCode;
    hdClearDraft(ticket, 'resolution');
    if (ticket.assignedTechnician === 'Unassigned') { ticket.assignedTechnician = 'Riley Morgan'; ticket.assignmentGroup = HD_SERVICE_DESK; }
    hdMatrixRespond(ticket);
    hdMatrixSetStatus(ticket, 'Resolved');
    hdHistory(ticket, `State changed to Resolved (${state.resolutionCode}).`);
    hdRerender(); return;
  }
  if (status === 'In Progress' && ticket.status === 'New') { hdMatrixAssignToMe(ticket); hdRerender(); return; }
  if (status === 'Canceled') ticket.cancelReason = 'Canceled';
  if (status === 'In Progress' && ticket.status === 'Resolved') { ticket.closureCode = ''; ticket.resolution = ''; }
  hdMatrixSetStatus(ticket, status);
  hdHistory(ticket, status === 'In Progress' ? 'State changed to In Progress.' : `State changed to ${status}.`);
  hdRerender();
}

function hdKeepPendingState(id, field, value) {
  if (!['state', 'hold'].includes(field)) return;
  const pending = { ...(hdPendingState[id] || {}) };
  if (value) pending[field] = String(value); else delete pending[field];
  if (Object.keys(pending).length) hdPendingState[id] = pending; else delete hdPendingState[id];
}
function hdApplyState(id) {
  const input = document.getElementById('hd-next-state');
  if (!input || !input.value) { toast('Choose the next state first.'); return; }
  hdTransitionTicket(id, input.value);
}
function hdApplyGroup(id) {
  const ticket = hdTicketById(id); const input = document.getElementById('hd-assignment-group');
  if (!ticket || !input) return;
  if (input.value === (ticket.assignmentGroup || HD_SERVICE_DESK) && (input.value !== HD_SERVICE_DESK || ticket.assignedTechnician === 'Riley Morgan')) { toast(`It is already assigned to ${input.value}.`); return; }
  hdMatrixAssignGroup(id, input.value);
}
// Category / Subcategory, CI and Contact type the student sets (classify).
const HD_CONTACT_TYPES = ['Phone', 'Email', 'Self-service', 'Walk-in', 'Chat'];
function hdClassification(ticket) {
  if (!ticket.classification) ticket.classification = { category:'', subcategory:'', ci:'', contactType:'' };
  return ticket.classification;
}
function hdClassifyOptions(ticket, field) {
  const config = hdConsole(ticket).classify || {};
  if (field === 'category') return Object.keys(config.categories || {});
  if (field === 'subcategory') return ((config.categories || {})[hdClassification(ticket).category]) || [];
  if (field === 'ci') return Array.isArray(config.cis) && config.cis.length ? config.cis : hdComputers().map(computer => computer.name);
  if (field === 'contactType') return Array.isArray(config.contactTypes) && config.contactTypes.length ? config.contactTypes : HD_CONTACT_TYPES;
  return [];
}
const HD_CLASSIFY_LABELS = { category:'Category', subcategory:'Subcategory', ci:'Configuration item', contactType:'Contact type' };
function hdSetClassification(id, field, value) {
  const ticket = hdTicketById(id); if (!ticket || !hdConsole(ticket).classify || !HD_CLASSIFY_LABELS[field]) return;
  const classification = hdClassification(ticket);
  const next = hdClassifyOptions(ticket, field).includes(value) ? value : '';
  if (classification[field] === next) return;
  classification[field] = next;
  if (field === 'category' && !hdClassifyOptions(ticket, 'subcategory').includes(classification.subcategory)) classification.subcategory = '';
  hdHistory(ticket, `${HD_CLASSIFY_LABELS[field]} set to ${next || 'none'}.`);
  hdPracticeEvent('classified', { ticket:ticket.id, field, value:next });
  hdRerender();
}
// What the ticket shows as its category: the student's own classification
// on a classify ticket (never the template's), else the ticket's fields.
function hdTicketCategoryText(ticket) {
  if (!hdConsole(ticket).classify) return `${ticket.category} · ${ticket.subcategory}`;
  const c = hdClassification(ticket);
  return c.category ? `${c.category}${c.subcategory ? ` › ${c.subcategory}` : ''}` : 'Not classified';
}
function hdShortDescription(ticket) { return ticket.shortDescription || ticket.title || ticket.subcategory || ''; }

// Convert to Request: the incident is Canceled – Converted and carries its
// Requested Item (ticket.request), which has no SLA bar.
function hdConvertDraft(ticket) {
  const state = hdConsoleState(ticket);
  state.convert = state.convert || { item:'', requestedFor:ticket.requester, fields:{} };
  return state.convert;
}
function hdConvertSet(id, field, value) {
  const ticket = hdTicketById(id); const config = ticket && hdConsole(ticket).convert; if (!config) return;
  const draft = hdConvertDraft(ticket);
  if (field === 'item') { draft.item = (config.items || []).some(item => item.name === value) ? value : ''; draft.fields = {}; }
  else if (field === 'requestedFor') draft.requestedFor = HD_USERS.some(user => user.name === value) ? value : '';
  else {
    const item = (config.items || []).find(entry => entry.name === draft.item);
    const spec = item && (item.fields || []).find(entry => entry.id === field);
    if (spec) draft.fields[field] = (spec.options || []).includes(value) ? value : '';
  }
  hdRerender();
}
function hdConvertToRequest(id) {
  const ticket = hdTicketById(id); const config = ticket && hdConsole(ticket).convert; if (!config || ticket.request) return;
  if (['Resolved', 'Closed', 'Canceled'].includes(ticket.status)) { toast('This ticket is closed, so it can\'t be converted.'); return; }
  // needsTriage (Lab 2.1's request): triage it before converting, because
  // converting locks Impact, Urgency and the classification.
  const triage = hdClassification(ticket);
  if (config.needsTriage && (!ticket.priority || !triage.category || !triage.ci)) { toast('Triage it first: set Category, Configuration item, Impact and Urgency, then convert.'); return; }
  const draft = hdConvertDraft(ticket);
  const item = (config.items || []).find(entry => entry.name === draft.item);
  if (!item) { toast('Choose the catalog item first.'); return; }
  if (!draft.requestedFor) { toast('Choose who the request is for.'); return; }
  const missing = (item.fields || []).find(field => !draft.fields[field.id]);
  if (missing) { toast(`Choose the ${missing.label} first.`); return; }
  const approved = item.approval === 'Approved';
  // Module 6: an item whose approval starts "Not required" (a Software
  // Catalog app) keeps that text and needs no approver.
  const notRequired = hdApprovalNotRequired(item.approval);
  ticket.request = {
    number:config.number || 'RITM', item:item.name, requestedFor:draft.requestedFor,
    fields:(item.fields || []).map(field => ({ id:field.id, label:field.label, value:draft.fields[field.id] })),
    approval:approved ? 'Approved' : notRequired ? String(item.approval) : 'Requested', approver:item.approver || '', approvedAt:approved ? hdShiftIso(ticket) : '', state:'Open',
  };
  hdMatrixRespond(ticket);
  // keepIncident (Module 3 on): the request is opened from the incident, and
  // the incident stays open beside it (something broken and something new).
  if (config.keepIncident) {
    hdHistory(ticket, `Request ${ticket.request.number} (${item.name}) opened from this incident; the incident stays open.`);
    hdPracticeEvent('request_opened', { ticket:ticket.id, item:item.name });
    hdRerender(); return;
  }
  ticket.cancelReason = 'Converted';
  ticket.closureCode = 'Canceled – Converted';
  hdMatrixSetStatus(ticket, 'Canceled');
  hdHistory(ticket, `Converted to Request ${ticket.request.number} (${item.name}); incident Canceled – Converted.`);
  hdPracticeEvent('converted', { ticket:ticket.id, item:item.name });
  hdRerender();
}
function hdApprovalNotRequired(value) { return /^not required\b/i.test(String(value || '')); }
// Approved, or no approval needed (Module 6's Software Catalog item).
function hdApprovalCleared(value) { return value === 'Approved' || hdApprovalNotRequired(value); }
function hdRequestApprove(ticket) {
  if (!ticket.request || hdApprovalCleared(ticket.request.approval)) return;
  ticket.request.approval = 'Approved'; ticket.request.approvedAt = hdShiftIso(ticket);
  hdHistory(ticket, `${ticket.request.number} approved${ticket.request.approver ? ` by ${ticket.request.approver}` : ''}.`);
}
function hdRequestClose(id) {
  const ticket = hdTicketById(id); if (!ticket || !ticket.request || ticket.request.state !== 'Open') return;
  if (!hdApprovalCleared(ticket.request.approval)) { toast('The request can\'t be closed before it is approved.'); return; }
  ticket.request.state = 'Closed Complete';
  hdHistory(ticket, `${ticket.request.number} closed complete.`);
  hdRerender();
}
function hdRequestApproved(ticket) { return !!(ticket.request && hdApprovalCleared(ticket.request.approval)); }

// Link tickets as related: a child names its parent. Linking meets the
// child's respond target; each ticket keeps its own resolve clock.
function hdLinkParent(id, parentId) {
  const ticket = hdTicketById(id); if (!ticket || !hdConsole(ticket).link) return;
  const parent = hdTicketById(parentId);
  if (!parent || parent.id === ticket.id || parent.parentId === ticket.id) { toast('Choose another ticket as the parent.'); return; }
  ticket.parentId = parent.id;
  if (hdIsMatrix(ticket)) hdMatrixRespond(ticket);
  hdHistory(ticket, `Linked as related: child of ${hdTicketLabel(parent)}.`);
  hdHistory(parent, `${hdTicketLabel(ticket)} linked as a related child ticket.`);
  hdPracticeEvent('linked', { ticket:ticket.id, parent:parent.id });
  hdRerender();
}
function hdUnlinkParent(id) {
  const ticket = hdTicketById(id); if (!ticket || !ticket.parentId) return;
  const parent = hdTicketById(ticket.parentId);
  ticket.parentId = '';
  hdHistory(ticket, `Link to ${parent ? hdTicketLabel(parent) : 'the parent'} removed.`);
  hdRerender();
}
function hdChildTickets(ticket) { return hdState.tickets.filter(item => item.parentId === ticket.id); }

// Messages that arrive after the student does something (arrivals): checked
// after every change. `when` reads this ticket or another (ticket: id):
// status (state names, "On Hold – Awaiting Caller" form allowed), opened,
// comments / notes (at least that many by the technician), converted,
// linked, resolved, machine (a machine value, hdMachineValueIs); all: [...]
// needs each one. No `when`: at once.
function hdArrivalMet(ticket, when) {
  if (!when) return true;
  if (Array.isArray(when.all)) return when.all.every(item => hdArrivalMet(ticket, item));
  const target = when.ticket ? hdTicketById(when.ticket) : ticket; if (!target) return false;
  const mine = list => (list || []).filter(entry => entry.author === 'Riley Morgan').length;
  if (when.status && ![].concat(when.status).some(value => value === target.status || value === hdStatusText(target))) return false;
  if (when.opened && target.opened !== true) return false;
  if (when.comments && mine(target.customerComments) < when.comments) return false;
  if (when.notes && mine(target.notes) < when.notes) return false;
  if (when.converted && !target.request) return false;
  if (when.linked && !target.parentId) return false;
  if (when.resolved && !['Resolved', 'Closed'].includes(target.status)) return false;
  // machine: { computer, path:[keys], value | values } (a fix on a computer).
  if (when.machine && !hdMachineValueIs(when.machine)) return false;
  return true;
}
function hdCheckArrivals(quiet) {
  if (!hdState || !Array.isArray(hdState.tickets)) return false;
  let arrivedNow = false;
  hdState.tickets.forEach(ticket => {
    const arrivals = hdConsole(ticket).arrivals; if (!Array.isArray(arrivals)) return;
    const state = hdConsoleState(ticket);
    state.arrived = Array.isArray(state.arrived) ? state.arrived : [];
    arrivals.forEach(arrival => {
      if (state.arrived.some(entry => entry.id === arrival.id) || !hdArrivalMet(ticket, arrival.when)) return;
      // at: the message's own shift time (a reply that came in before the
      // shift opened); otherwise now on the shift clock.
      const at = arrival.at && !Number.isNaN(Date.parse(arrival.at)) ? new Date(arrival.at).toISOString() : '';
      state.arrived.push({ id:arrival.id, from:arrival.from || ticket.requester, text:arrival.text, time:at ? hdShiftTimeText(at) : hdConsoleTime(ticket) });
      hdHistory(ticket, `Reply from ${arrival.from || ticket.requester} (customer-visible).`);
      if (arrival.reopen && ticket.status === 'Resolved') {
        hdMatrixSetStatus(ticket, 'In Progress', '', at); ticket.closureCode = ''; ticket.resolution = '';
        hdHistory(ticket, 'Reopened by the caller\'s reply; state In Progress.');
      }
      if (arrival.resume && ticket.status === 'On Hold') { hdMatrixSetStatus(ticket, 'In Progress', '', at); hdHistory(ticket, 'The caller replied; state In Progress.'); }
      if (arrival.approve) hdRequestApprove(ticket);
      hdPracticeEvent('message_arrived', { ticket:ticket.id, message:arrival.id });
      arrivedNow = true;
      if (!quiet && typeof toast === 'function') toast(`New reply from ${arrival.from || ticket.requester} on ${hdTicketLabel(ticket)}.`);
    });
  });
  return arrivedNow;
}
function hdHasArrivals() { return !!(hdState && hdState.tickets.some(ticket => Array.isArray(hdConsole(ticket).arrivals))); }

// Knowledge: Attach knowledge (Related › Knowledge) and Create knowledge
// draft (state Review), for a ticket whose kb is { attach, draft }.
function hdKbConfig(ticket) { const kb = hdConsole(ticket).kb; return kb && typeof kb === 'object' ? kb : {}; }
function hdKbAttach(id, articleId) {
  const ticket = hdTicketById(id); if (!ticket || !hdKbConfig(ticket).attach) return;
  const article = hdKbArticles().find(item => item.id === articleId); if (!article) return;
  const state = hdConsoleState(ticket);
  state.kbAttached = Array.isArray(state.kbAttached) ? state.kbAttached : [];
  if (state.kbAttached.includes(articleId)) return;
  state.kbAttached.push(articleId);
  hdHistory(ticket, `Knowledge attached: ${articleId} · ${article.title}.`);
  hdPracticeEvent('kb_attached', { ticket:ticket.id, article:articleId });
  hdRerender();
}
function hdKbCreateDraft(id) {
  const ticket = hdTicketById(id); if (!ticket || !hdKbConfig(ticket).draft) return;
  const state = hdConsoleState(ticket);
  if (state.kbDraft) return;
  if (!['Resolved', 'Closed'].includes(ticket.status)) { toast('Resolve the ticket first: a knowledge draft records a fix that worked.'); return; }
  const title = String((document.getElementById('hd-kb-draft-title') || {}).value || '').trim().slice(0, 160);
  const text = String((document.getElementById('hd-kb-draft-text') || {}).value || '').trim().slice(0, 4000);
  if (title.length < 5) { toast('Give the knowledge draft a title that names the symptom and the fix or workaround.'); return; }
  if (text.length < 10) { toast('Write the knowledge draft: symptom, cause, fix or workaround, result and owner.'); return; }
  if (hdPasswordInText(title) || hdPasswordInText(text)) { toast(hdRefusePasswordText(ticket, 'knowledge draft')); return; }
  state.kbDraft = { title, text, state:'Review', at:(hdActiveSet() && hdActiveSet().now) || hdTicketClock(ticket) ? hdShiftIso(ticket) : new Date().toISOString() };
  hdClearDraft(ticket, 'kbTitle'); hdClearDraft(ticket, 'kbText');
  hdHistory(ticket, `Knowledge draft created: "${title}" (state Review).`);
  hdPracticeEvent('kb_draft', { ticket:ticket.id });
  hdRerender();
}

// Contact attempts: the seeded ones and the ones the student logs, numbered.
function hdContactConfig(ticket) { const value = hdConsole(ticket).contactAttempts; return value ? (typeof value === 'object' ? value : {}) : null; }
function hdContactAttempts(ticket) {
  const config = hdContactConfig(ticket); if (!config) return [];
  const state = hdConsoleState(ticket);
  state.contactAttempts = Array.isArray(state.contactAttempts) ? state.contactAttempts : [];
  return [...(Array.isArray(config.seed) ? config.seed : []), ...state.contactAttempts];
}
function hdLogContactAttempt(id) {
  const ticket = hdTicketById(id); if (!ticket || !hdContactConfig(ticket)) return;
  const input = document.getElementById('hd-contact-method');
  const method = input ? input.value : '';
  if (!HD_CONTACT_METHODS.includes(method)) { toast('Choose how you tried to reach the caller.'); return; }
  hdContactAttempts(ticket);
  hdConsoleState(ticket).contactAttempts.push({ at:hdShiftIso(ticket), method });
  const count = hdContactAttempts(ticket).length;
  hdHistory(ticket, `Contact attempt ${count}: ${method}.`);
  hdPracticeEvent('contact_attempt', { ticket:ticket.id, method, count });
  hdRerender();
}

// The rewrite check: which parts (who, what, where, when, impact, ...) the
// rewritten short description and description don't have yet.
function hdRewriteMissing(checks, short, description) {
  return (Array.isArray(checks) ? checks : []).filter(check => {
    const text = check.field === 'short' ? short : check.field === 'description' ? description : `${short}\n${description}`;
    try { return !new RegExp(check.pattern, 'i').test(String(text || '')); } catch (_) { return true; }
  }).map(check => check.part);
}
function hdRewriteParts(config) { return (Array.isArray(config.checks) ? config.checks : []).map(check => check.part); }
function hdRewriteSave(id) {
  const ticket = hdTicketById(id); const config = ticket && hdConsole(ticket).rewrite; if (!config) return;
  const short = String((document.getElementById('hd-rewrite-short') || {}).value || '').trim().slice(0, 160);
  const description = String((document.getElementById('hd-rewrite-desc') || {}).value || '').trim().slice(0, 4000);
  if (!short) { toast('Write the short description first.'); return; }
  if (hdPasswordInText(short) || hdPasswordInText(description)) { toast(hdRefusePasswordText(ticket, 'description')); return; }
  const missing = hdRewriteMissing(config.checks, short, description);
  hdConsoleState(ticket).rewrite = { short, description, missing, saves:((hdConsoleState(ticket).rewrite || {}).saves || 0) + 1 };
  ticket.shortDescription = short;
  hdClearDraft(ticket, 'rewriteShort'); hdClearDraft(ticket, 'rewriteDesc');
  hdHistory(ticket, 'Short description and description rewritten.');
  hdPracticeEvent('rewritten', { ticket:ticket.id, missing:missing.join(', ') });
  toast(missing.length ? `Saved. Check that it says ${hdJoinWords(missing)}.` : `Saved. The rewrite has every part: ${hdJoinWords(hdRewriteParts(config))}.`);
  hdRerender();
}

// The work order (a set's workOrder): the student's own order of the set's
// tickets, moved by dragging or by Move up / Move down.
function hdWorkOrder() {
  const set = hdActiveSet(); const config = set && set.workOrder; if (!config) return null;
  const ids = (config.tickets || set.tickets).filter(id => hdTicketById(id));
  const saved = Array.isArray(hdState.workOrder) ? hdState.workOrder.filter(id => ids.includes(id)) : [];
  hdState.workOrder = [...saved, ...hdQueueSorted(ids.filter(id => !saved.includes(id)).map(hdTicketById)).map(ticket => ticket.id)];
  return hdState.workOrder;
}
function hdWorkOrderMove(id, delta) {
  const order = hdWorkOrder(); if (!order) return;
  const from = order.indexOf(id); const to = from + delta;
  if (from < 0 || to < 0 || to >= order.length) return;
  order.splice(to, 0, order.splice(from, 1)[0]);
  hdState.workOrderResult = '';
  hdRerender();
}
function hdWorkOrderFromSort() {
  const order = hdWorkOrder(); if (!order) return;
  hdState.workOrder = hdQueueSorted(order.map(hdTicketById)).map(ticket => ticket.id);
  hdState.workOrderResult = '';
  hdRerender();
}
let hdWorkDragged = '';
function hdWorkDrag(event, id) {
  hdWorkDragged = id;
  try { event.dataTransfer.setData('text/plain', id); event.dataTransfer.effectAllowed = 'move'; } catch (_) {}
}
function hdWorkDrop(event, targetId) {
  if (event && event.preventDefault) event.preventDefault();
  let id = hdWorkDragged;
  try { id = event.dataTransfer.getData('text/plain') || id; } catch (_) {}
  hdWorkDragged = '';
  const order = hdWorkOrder(); if (!order || !order.includes(id) || !order.includes(targetId) || id === targetId) return;
  // Dropped on a row below: it goes after that row; on a row above: before it.
  const down = order.indexOf(id) < order.indexOf(targetId);
  order.splice(order.indexOf(id), 1);
  order.splice(order.indexOf(targetId) + (down ? 1 : 0), 0, id);
  hdState.workOrderResult = '';
  hdRerender();
}
// Check order: the groups are the accepted order (any order inside a
// group). Returns { ok } or the first ticket out of place: the one that
// should move up, and the ticket it should come before. Feedback only.
function hdWorkOrderCheck(order, groups) {
  const list = Array.isArray(groups) ? groups : [];
  const groupOf = id => { const index = list.findIndex(group => group.includes(id)); return index < 0 ? list.length : index; };
  const expected = [];
  list.forEach((group, index) => group.forEach(() => expected.push(index)));
  for (let i = 0; i < order.length; i += 1) {
    const want = i < expected.length ? expected[i] : list.length;
    if (groupOf(order[i]) === want) continue;
    const move = order.slice(i + 1).find(id => groupOf(id) === want);
    return { ok:false, move:move || order[i], before:order[i] };
  }
  return { ok:true };
}
function hdWorkOrderSubmit() {
  const set = hdActiveSet(); const order = hdWorkOrder(); if (!order) return;
  const result = hdWorkOrderCheck(order, set.workOrder.groups);
  const label = id => { const ticket = hdTicketById(id); return ticket ? hdTicketLabel(ticket) : id; };
  hdState.workOrderResult = result.ok ? 'ok' : result.move === result.before ? `${label(result.move)} is in the wrong place.` : `${label(result.move)} is out of place. Move it up, above ${label(result.before)}.`;
  hdPracticeEvent('order_checked', { ok:result.ok, order:order.join(', ') });
  hdRerender();
}

// "Next day": moves a set's clock to the same time on the next working day,
// once every unlock rule holds (rule: { ticket, done:[converted | resolved |
// escalated] } or { ticket, attempts:n }). While locked it names the tickets
// that still need work today.
function hdNextDayRuleMet(rule) {
  const ticket = hdTicketById(rule.ticket); if (!ticket) return true;
  if (rule.attempts) return hdContactAttempts(ticket).length >= rule.attempts;
  const done = Array.isArray(rule.done) ? rule.done : [];
  return done.some(kind => (kind === 'converted' && ticket.status === 'Canceled' && ticket.cancelReason === 'Converted')
    || (kind === 'resolved' && ['Resolved', 'Closed'].includes(ticket.status))
    || (kind === 'escalated' && ticket.status === 'Escalated'));
}
function hdNextDayState() {
  const set = hdActiveSet(); const config = set && set.now && set.nextDay; if (!config) return null;
  const used = hdState.daysMoved || 0;
  const waiting = (config.unlock || []).filter(rule => !hdNextDayRuleMet(rule)).map(rule => hdTicketById(rule.ticket)).filter(Boolean);
  return { used, max:config.max || 1, waiting:[...new Set(waiting)].map(hdTicketLabel) };
}
function hdNextDay() {
  const state = hdNextDayState(); if (!state || state.used >= state.max) return;
  if (state.waiting.length) { toast(`Not yet. Still needs work today: ${hdJoinWords(state.waiting)}.`); return; }
  hdState.clockNow = new Date(hdNextWorkingDay(hdShiftNow().getTime())).toISOString();
  hdState.daysMoved = state.used + 1;
  hdPracticeEvent('next_day', { now:hdState.clockNow });
  toast(`It's ${hdShiftTimeText(hdShiftNow())}.`);
  hdRerender();
}
function hdNextDayControl() {
  const state = hdNextDayState(); if (!state) return '';
  if (state.used >= state.max) return `<span class="muted" data-hd-next-day="used">Shift clock: ${hdEsc(hdShiftTimeText(hdShiftNow()))}</span>`;
  const locked = state.waiting.length > 0;
  return `<span data-hd-next-day="${locked ? 'locked' : 'open'}" style="display:inline-flex;flex-wrap:wrap;align-items:center;gap:8px"><span class="muted">Shift clock: ${hdEsc(hdShiftTimeText(hdShiftNow()))}</span><button type="button" class="btn btn-secondary" ${locked ? 'disabled aria-describedby="hd-next-day-why" style="opacity:.55;cursor:not-allowed"' : ''} onclick="hdNextDay()">Next day</button>${locked ? `<small id="hd-next-day-why" class="muted">Still needs work today: ${hdEsc(hdJoinWords(state.waiting))}</small>` : ''}</span>`;
}

// The ServiceNow-style list (a set's queue: true): Incidents › Assigned to
// my group › Unassigned, the columns the student adds, and a two-level sort.
const HD_QUEUE_COLUMNS = { priority:'Priority', sla:'SLA due', category:'Category', caller:'Caller', created:'Created' };
const HD_QUEUE_SORTS = { number:'Number', ...HD_QUEUE_COLUMNS };
const HD_QUEUE_LISTS = { unassigned:'Assigned to my group › Unassigned', mine:'Assigned to my group › All open', all:'All incidents' };
function hdQueueView() {
  const view = hdState.queueView = hdState.queueView || {};
  // queueList: the list a set opens on (Lab 2.2 starts on All open, so the
  // tickets already assigned to Riley show); otherwise Unassigned.
  if (!HD_QUEUE_LISTS[view.list]) { const set = hdActiveSet(); view.list = set && HD_QUEUE_LISTS[set.queueList] ? set.queueList : 'unassigned'; }
  view.columns = Array.isArray(view.columns) ? view.columns.filter(key => HD_QUEUE_COLUMNS[key]) : [];
  view.sort = Array.isArray(view.sort) ? view.sort.slice(0, 2).map(key => (HD_QUEUE_SORTS[key] ? key : '')) : ['created', ''];
  if (!view.sort[0]) view.sort[0] = 'created';
  return view;
}
function hdQueueSetList(value) { hdQueueView().list = HD_QUEUE_LISTS[value] ? value : 'unassigned'; hdRerender(); }
function hdQueueColumn(key, on) {
  const view = hdQueueView(); if (!HD_QUEUE_COLUMNS[key]) return;
  view.columns = on ? [...new Set([...view.columns, key])] : view.columns.filter(item => item !== key);
  view.columns.sort((a, b) => Object.keys(HD_QUEUE_COLUMNS).indexOf(a) - Object.keys(HD_QUEUE_COLUMNS).indexOf(b));
  hdRerender();
}
function hdQueueSort(level, key) {
  const view = hdQueueView(); if (![0, 1].includes(level)) return;
  view.sort[level] = HD_QUEUE_SORTS[key] ? key : '';
  if (!view.sort[0]) view.sort[0] = 'created';
  hdRerender();
}
const HD_PRIORITY_RANK = { P1:1, P2:2, P3:3, P4:4, P5:5 };
function hdQueueSortValue(ticket, key) {
  if (key === 'priority') return HD_PRIORITY_RANK[ticket.priority] || 9;
  if (key === 'sla') { const sla = hdSlaState(ticket); return sla.dueMs == null ? Infinity : sla.dueMs; }
  if (key === 'category') return hdTicketCategoryText(ticket);
  if (key === 'caller') return ticket.requester || '';
  if (key === 'created') return Date.parse(ticket.createdTimestamp) || 0;
  return hdTicketLabel(ticket);
}
function hdQueueSorted(tickets) {
  const keys = hdState.queueView ? hdQueueView().sort.filter(Boolean) : ['created'];
  const compare = (a, b, key) => { const x = hdQueueSortValue(a, key); const y = hdQueueSortValue(b, key); return typeof x === 'string' ? x.localeCompare(y) : x - y; };
  return tickets.slice().sort((a, b) => keys.reduce((result, key) => result || compare(a, b, key), 0) || hdTicketLabel(a).localeCompare(hdTicketLabel(b)));
}
function hdQueueListTickets(list) {
  const open = ticket => !['Resolved', 'Closed', 'Canceled'].includes(ticket.status);
  const mine = ticket => (ticket.assignmentGroup || HD_SERVICE_DESK) === HD_SERVICE_DESK;
  if (list === 'all') return hdState.tickets.slice();
  if (list === 'mine') return hdState.tickets.filter(ticket => open(ticket) && mine(ticket));
  return hdState.tickets.filter(ticket => open(ticket) && mine(ticket) && ticket.assignedTechnician === 'Unassigned');
}
function hdQueueCell(ticket, key) {
  if (key === 'priority') return ticket.priority ? hdBadge(ticket.priority, ticket.priority.toLowerCase()) : '<span class="muted">Not set</span>';
  if (key === 'sla') {
    const sla = hdSlaState(ticket);
    return `${hdSlaBadge(ticket)}${sla.dueMs ? `<small>${hdEsc(hdShiftTimeText(sla.dueMs))}</small>` : ''}`;
  }
  if (key === 'category') return hdEsc(hdTicketCategoryText(ticket));
  if (key === 'caller') return `<strong>${hdEsc(ticket.requester)}</strong><small>${hdEsc(ticket.department)}</small>`;
  if (key === 'created') return hdEsc(hdShiftTimeText(ticket.createdTimestamp));
  return '';
}
function hdSetQueueHtml(set) {
  const view = hdQueueView();
  const tickets = hdQueueSorted(hdQueueListTickets(view.list));
  const sortSelect = level => `<select class="select" aria-label="${level ? 'Then sort by' : 'Sort by'}" onchange="hdQueueSort(${level},this.value)">${level ? `<option value="" ${!view.sort[1] ? 'selected' : ''}>None</option>` : ''}${Object.keys(HD_QUEUE_SORTS).map(key => `<option value="${key}" ${view.sort[level] === key ? 'selected' : ''}>${HD_QUEUE_SORTS[key]}</option>`).join('')}</select>`;
  const columns = `<fieldset style="border:0;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:10px;align-items:center"><legend class="muted" style="float:left;margin-right:6px">Columns</legend>${Object.keys(HD_QUEUE_COLUMNS).map(key => `<label style="display:inline-flex;gap:4px;align-items:center"><input type="checkbox" data-hd-column="${key}" ${view.columns.includes(key) ? 'checked' : ''} onchange="hdQueueColumn('${key}',this.checked)"> ${HD_QUEUE_COLUMNS[key]}</label>`).join('')}</fieldset>`;
  const head = `<th>Number</th><th>Short description</th>${view.columns.map(key => `<th>${HD_QUEUE_COLUMNS[key]}</th>`).join('')}<th>State</th><th>Assigned to</th>`;
  const rows = tickets.map(ticket => `<tr class="hd-ticket-row" data-hd-row="${hdEsc(ticket.id)}" tabindex="0" onclick="hdSelectTicket('${ticket.id}')" onkeydown="if(event.key==='Enter')hdSelectTicket('${ticket.id}')"><td><strong>${hdEsc(hdTicketLabel(ticket))}</strong>${hdVipBadge(ticket)}${ticket.parentId &&hdTicketById(ticket.parentId) ? `<small>Child of ${hdEsc(hdTicketLabel(hdTicketById(ticket.parentId)))}</small>` : ''}</td><td>${hdEsc(hdShortDescription(ticket) || ticket.description)}</td>${view.columns.map(key => `<td data-hd-cell="${key}">${hdQueueCell(ticket, key)}</td>`).join('')}<td>${hdStatusBadge(ticket)}</td><td>${hdEsc(ticket.assignedTechnician)}</td></tr>`).join('')
    || `<tr><td colspan="${4 + view.columns.length}" class="muted">No tickets in this list.</td></tr>`;
  return `<div class="filterbar" style="flex-wrap:wrap;gap:10px"><label>Incidents › <select class="select" aria-label="List" onchange="hdQueueSetList(this.value)">${Object.keys(HD_QUEUE_LISTS).map(key => `<option value="${key}" ${view.list === key ? 'selected' : ''}>${HD_QUEUE_LISTS[key]}</option>`).join('')}</select></label><label>Sort by ${sortSelect(0)}</label><label>then by ${sortSelect(1)}</label><span class="muted">${tickets.length} shown</span></div>
    <div class="filterbar">${columns}</div>
    <div class="card"><div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div></div>${set.workOrder ? hdWorkOrderCard() : ''}`;
}
function hdWorkOrderCard() {
  const order = hdWorkOrder(); if (!order) return '';
  const result = hdState.workOrderResult;
  const feedback = !result ? '' : result === 'ok'
    ? '<div class="callout success" role="status" data-hd-order="ok"><strong>This order works.</strong></div>'
    : `<div class="callout warn" role="status" data-hd-order="out">${hdEsc(result)}</div>`;
  const items = order.map((id, index) => {
    const ticket = hdTicketById(id);
    return `<li draggable="true" data-hd-order-row="${hdEsc(id)}" ondragstart="hdWorkDrag(event,'${id}')" ondragover="event.preventDefault()" ondrop="hdWorkDrop(event,'${id}')" style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px;border:1px solid #e4e7ec;border-radius:8px;cursor:grab"><span aria-hidden="true">⠿</span><strong>${index + 1}. ${hdEsc(hdTicketLabel(ticket))}</strong>${ticket.priority ? hdBadge(ticket.priority, ticket.priority.toLowerCase()) : '<span class="muted">Not set</span>'}${hdSlaBadge(ticket)}<span style="flex:1 1 160px">${hdEsc(hdShortDescription(ticket) || ticket.description)}</span><button type="button" class="btn btn-ghost btn-sm" aria-label="Move ${hdEsc(hdTicketLabel(ticket))} up" ${index === 0 ? 'disabled' : ''} onclick="hdWorkOrderMove('${id}',-1)">Move up</button><button type="button" class="btn btn-ghost btn-sm" aria-label="Move ${hdEsc(hdTicketLabel(ticket))} down" ${index === order.length - 1 ? 'disabled' : ''} onclick="hdWorkOrderMove('${id}',1)">Move down</button></li>`;
  }).join('');
  return `<div class="card hd-work-order"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Your work order</strong><span class="muted">Drag the rows, or use Move up and Move down.</span></div><div class="card-body"><ol style="list-style:none;margin:0 0 10px;padding:0;display:grid;gap:6px">${items}</ol><div style="display:flex;flex-wrap:wrap;gap:8px"><button type="button" class="btn btn-secondary" onclick="hdWorkOrderFromSort()">Start from the list's sort</button><button type="button" class="btn btn-primary" onclick="hdWorkOrderSubmit()">Check order</button></div>${feedback}</div></div>`;
}

// The cards and controls on a matrix ticket. Each is '' without its feature.
function hdMatrixControls(ticket) {
  const closed = ['Resolved', 'Closed', 'Canceled'].includes(ticket.status);
  const select = (field, label) => `<label>${label}<select class="select" data-hd-field="${field}" ${closed ? 'disabled' : ''} onchange="hdSetImpact('${ticket.id}','${field}',this.value)"><option value="">Choose…</option>${['1', '2', '3'].map(value => `<option value="${value}" ${ticket[field] === value ? 'selected' : ''}>${HD_IMPACT_LABELS[value]}</option>`).join('')}</select></label>`;
  const priority = `<div class="hd-priority-preset" data-hd-priority="${hdEsc(ticket.priority || '')}"><span>Priority</span> ${ticket.priority ? `${hdBadge(ticket.priority, ticket.priority.toLowerCase())} ${hdEsc(HD_PRIORITY_NAMES[ticket.priority])}` : '<span class="muted">Not set</span>'}<p class="muted" style="margin:4px 0 0">Calculated from Impact × Urgency. You don't type it.</p></div>`;
  const next = HD_SN_STATUS_NEXT[ticket.status] || [];
  const pending = hdPendingState[ticket.id] || {};
  // State first; the reason select is read when On Hold is chosen.
  // State and assignment group apply with a button, so moving through a
  // list with the arrow keys never changes the ticket.
  const state = next.length ? `<label>State<select id="hd-next-state" class="select" onchange="hdKeepPendingState('${ticket.id}','state',this.value)" data-hd-field="state"><option value="">${hdEsc(hdStatusText(ticket))}</option>${next.map(value => `<option${pending.state === value ? ' selected' : ''}>${value}</option>`).join('')}</select></label>${next.includes('On Hold') ? `<label>On Hold reason (only for On Hold)<select id="hd-hold-reason" class="select" onchange="hdKeepPendingState('${ticket.id}','hold',this.value)"><option value="">Choose…</option>${HD_HOLD_REASONS.map(reason => `<option ${(pending.hold || ticket.holdReason) === reason ? 'selected' : ''}>${reason}</option>`).join('')}</select></label>` : ''}<button type="button" class="btn btn-secondary" onclick="hdApplyState('${ticket.id}')">Apply state</button>` : `<div><span class="muted">State</span> ${hdStatusBadge(ticket)}</div>`;
  const group = closed ? `<div><span class="muted">Assignment group</span> <strong>${hdEsc(ticket.assignmentGroup || HD_SERVICE_DESK)}</strong></div>` : `<label>Assignment group<select id="hd-assignment-group" class="select" data-hd-field="group">${HD_ASSIGNMENT_GROUPS.map(value => `<option ${(ticket.assignmentGroup || HD_SERVICE_DESK) === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><button type="button" class="btn btn-secondary" onclick="hdApplyGroup('${ticket.id}')">Assign to group</button>`;
  const resolving = !closed ? `<label>Resolution notes (required to resolve)<textarea id="hd-resolution-notes" class="ipt" rows="4" maxlength="4000" oninput="hdKeepDraft('${ticket.id}','resolution',this.value)" placeholder="Why and how it was closed">${hdEsc(hdDraft(ticket, 'resolution'))}</textarea></label>` : '';
  return `${select('impact', 'Impact')}${select('urgency', 'Urgency')}${priority}${hdClassifyControls(ticket)}${group}${hdWarmHandoffControl(ticket)}${state}${hdConsoleResolutionControl(ticket)}${resolving}${hdFollowUpControl(ticket)}${hdDuplicateControl(ticket)}`;
}
function hdClassifyControls(ticket) {
  if (!hdConsole(ticket).classify) return '';
  const c = hdClassification(ticket);
  const closed = ['Resolved', 'Closed', 'Canceled'].includes(ticket.status);
  return Object.keys(HD_CLASSIFY_LABELS).map(field => {
    const options = hdClassifyOptions(ticket, field);
    return `<label>${HD_CLASSIFY_LABELS[field]}<select class="select" data-hd-field="${field}" ${closed || !options.length ? 'disabled' : ''} onchange="hdSetClassification('${ticket.id}','${field}',this.value)"><option value="">Choose…</option>${options.map(value => `<option ${c[field] === value ? 'selected' : ''}>${hdEsc(value)}</option>`).join('')}</select></label>`;
  }).join('');
}
function hdConvertCard(ticket) {
  const config = hdConsole(ticket).convert; if (!config) return '';
  const request = ticket.request;
  if (request) {
    const fields = request.fields.map(field => `<dt>${hdEsc(field.label)}</dt><dd>${hdEsc(field.value)}</dd>`).join('');
    const close = request.state === 'Open' ? `<button type="button" class="btn btn-secondary" ${hdApprovalCleared(request.approval) ? '' : 'disabled style="opacity:.55;cursor:not-allowed"'} onclick="hdRequestClose('${ticket.id}')">Close the request (Closed Complete)</button>` : '';
    return `<div class="card hd-request-item" data-hd-request="${hdEsc(request.number)}"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Requested item ${hdEsc(request.number)}</strong>${hdBadge(`Approval: ${request.approval}`, hdApprovalCleared(request.approval) ? 'ok' : 'warn')}${hdBadge(request.state, request.state === 'Open' ? 'in-progress' : 'closed')}</div><div class="card-body"><dl class="hd-dl"><dt>Catalog item</dt><dd>${hdEsc(request.item)}</dd><dt>Requested for</dt><dd>${hdEsc(request.requestedFor)}</dd>${fields}${request.approver ? `<dt>Approver</dt><dd>${hdEsc(request.approver)}</dd>` : ''}<dt>SLA</dt><dd class="muted">None: requests have no SLA bar here</dd></dl>${close}</div></div>`;
  }
  if (['Resolved', 'Closed', 'Canceled'].includes(ticket.status)) return '';
  const draft = hdConvertDraft(ticket);
  const item = (config.items || []).find(entry => entry.name === draft.item);
  const fields = item ? (item.fields || []).map(field => `<label>${hdEsc(field.label)}<select class="select" data-hd-convert="${hdEsc(field.id)}" onchange="hdConvertSet('${ticket.id}','${hdEsc(field.id)}',this.value)"><option value="">Choose…</option>${(field.options || []).map(value => `<option ${draft.fields[field.id] === value ? 'selected' : ''}>${hdEsc(value)}</option>`).join('')}</select></label>`).join('') : '';
  const keep = config.keepIncident === true;
  return `<div class="card hd-convert"${keep ? ' data-hd-keep-incident' : ''}><div class="card-header" ${HD_CONSOLE_HEADER}><strong>${keep ? 'Open a request from this incident' : 'Convert to Request'}</strong><span class="muted">${keep ? 'The incident stays open for what is broken; the request is for what is new.' : 'For something new, not something broken.'}</span></div><div class="card-body" style="display:grid;gap:8px"><label>Catalog item<select class="select" data-hd-convert="item" onchange="hdConvertSet('${ticket.id}','item',this.value)"><option value="">Choose…</option>${(config.items || []).map(entry => `<option ${draft.item === entry.name ? 'selected' : ''}>${hdEsc(entry.name)}</option>`).join('')}</select></label><label>Requested for<select class="select" data-hd-convert="requestedFor" onchange="hdConvertSet('${ticket.id}','requestedFor',this.value)"><option value="">Choose…</option>${HD_USERS.map(user => `<option ${draft.requestedFor === user.name ? 'selected' : ''}>${hdEsc(user.name)}</option>`).join('')}</select></label>${fields}<div><button type="button" class="btn btn-primary" onclick="hdConvertToRequest('${ticket.id}')">${keep ? 'Open request' : 'Convert to Request'}</button></div></div></div>`;
}
function hdLinkCard(ticket) {
  if (!hdConsole(ticket).link) return '';
  const parent = ticket.parentId ? hdTicketById(ticket.parentId) : null;
  const children = hdChildTickets(ticket);
  const options = hdState.tickets.filter(item => item.id !== ticket.id && item.parentId !== ticket.id);
  const body = parent
    ? `<p data-hd-parent="${hdEsc(parent.id)}">Child of <strong>${hdEsc(hdTicketLabel(parent))}</strong> · ${hdEsc(hdShortDescription(parent) || parent.description)}</p><button type="button" class="btn btn-ghost btn-sm" onclick="hdUnlinkParent('${ticket.id}')">Remove link</button>`
    : `<label>Link as related: child of<select id="hd-link-parent" class="select"><option value="">Choose a ticket…</option>${options.map(item => `<option value="${hdEsc(item.id)}">${hdEsc(hdTicketLabel(item))} · ${hdEsc(item.requester)} · ${hdEsc(String(hdShortDescription(item) || item.description).slice(0, 60))}</option>`).join('')}</select></label> <button type="button" class="btn btn-secondary" onclick="hdLinkParent('${ticket.id}',(document.getElementById('hd-link-parent')||{}).value)">Link</button>`;
  const kids = children.length ? `<p class="muted">Related child tickets: ${children.map(item => hdEsc(hdTicketLabel(item))).join(', ')}</p>` : '';
  return `<div class="card hd-link"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Related tickets</strong><span class="muted">Two tickets, one cause: link the child to the parent.</span></div><div class="card-body">${body}${kids}</div></div>`;
}
function hdRewriteCard(ticket) {
  const config = hdConsole(ticket).rewrite; if (!config) return '';
  const saved = hdConsoleState(ticket).rewrite;
  const short = hdDraft(ticket, 'rewriteShort') || (saved ? saved.short : hdShortDescription(ticket));
  const description = hdDraft(ticket, 'rewriteDesc') || (saved ? saved.description : '');
  const parts = hdJoinWords(hdRewriteParts(config));
  const result = saved ? (saved.missing.length ? `<div class="callout warn" role="status" data-hd-rewrite="missing">Check that it says ${hdEsc(hdJoinWords(saved.missing))}.</div>` : `<div class="callout success" role="status" data-hd-rewrite="ok">The rewrite has every part: ${hdEsc(parts)}.</div>`) : '';
  return `<div class="card hd-rewrite"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Short description and description</strong><span class="muted">Rewrite it so a stranger can follow it${parts ? `: ${hdEsc(parts)}` : ''}.</span></div><div class="card-body" style="display:grid;gap:8px"><label>Short description<input id="hd-rewrite-short" class="ipt" maxlength="160" value="${hdEsc(short)}" oninput="hdKeepDraft('${ticket.id}','rewriteShort',this.value)"></label><label>Description<textarea id="hd-rewrite-desc" class="ipt" rows="4" maxlength="4000" oninput="hdKeepDraft('${ticket.id}','rewriteDesc',this.value)">${hdEsc(description)}</textarea></label><div><button type="button" class="btn btn-secondary" onclick="hdRewriteSave('${ticket.id}')">Save and check</button></div>${result}</div></div>`;
}
function hdContactCard(ticket) {
  if (!hdContactConfig(ticket)) return '';
  const attempts = hdContactAttempts(ticket);
  const list = attempts.length ? `<ol class="hd-list" data-hd-attempts="${attempts.length}">${attempts.map(entry => `<li>${hdEsc(hdShiftTimeText(entry.at))} · ${hdEsc(entry.method)}</li>`).join('')}</ol>` : '<p class="muted">No contact attempts logged yet.</p>';
  const open = !['Resolved', 'Closed', 'Canceled'].includes(ticket.status);
  return `<div class="card hd-contact-attempts"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Contact attempts</strong><span class="muted">${attempts.length} so far</span></div><div class="card-body">${list}${open ? `<div class="filterbar"><select id="hd-contact-method" class="select" aria-label="How you tried to reach the caller"><option value="">How did you try?</option>${HD_CONTACT_METHODS.map(method => `<option>${method}</option>`).join('')}</select><button type="button" class="btn btn-secondary" onclick="hdLogContactAttempt('${ticket.id}')">Log contact attempt</button></div>` : ''}</div></div>`;
}
function hdArrivalsCard(ticket) {
  if (!Array.isArray(hdConsole(ticket).arrivals)) return '';
  const arrived = hdConsoleState(ticket).arrived || [];
  if (!arrived.length) return '';
  return `<div class="card hd-arrivals"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Replies from the caller</strong><span class="muted">Customer-visible</span></div><div class="card-body"><div class="hd-note-list">${arrived.map(entry => `<div data-hd-arrival="${hdEsc(entry.id)}"><strong>${hdEsc(entry.from)} · ${hdEsc(entry.time)}</strong><p>${hdEsc(entry.text)}</p></div>`).join('')}</div></div></div>`;
}
function hdKnowledgeCard(ticket) {
  const config = hdKbConfig(ticket); if (!config.attach && !config.draft) return '';
  const state = hdConsoleState(ticket);
  const attached = (state.kbAttached || []).map(id => hdKbArticles().find(article => article.id === id)).filter(Boolean);
  const list = attached.length ? `<ul class="hd-list" data-hd-attached="${attached.length}">${attached.map(article => `<li>${hdEsc(article.id)} · ${hdEsc(article.title)}</li>`).join('')}</ul>` : '<p class="muted">No knowledge attached yet. Open an article in the Knowledge Base search, then Attach knowledge.</p>';
  let draft = '';
  if (config.draft) {
    draft = state.kbDraft
      ? `<div data-hd-kb-draft="review"><strong>Knowledge draft</strong> ${hdBadge(`State: ${state.kbDraft.state}`, 'in-progress')}<p><strong>${hdEsc(state.kbDraft.title)}</strong></p><p>${hdEsc(state.kbDraft.text)}</p></div>`
      : ['Resolved', 'Closed'].includes(ticket.status)
        ? `<div style="display:grid;gap:8px"><label>Knowledge draft title<input id="hd-kb-draft-title" class="ipt" maxlength="160" value="${hdEsc(hdDraft(ticket, 'kbTitle'))}" oninput="hdKeepDraft('${ticket.id}','kbTitle',this.value)" placeholder="Symptom: the fix or workaround"></label><label>Symptom, cause, fix or workaround, result and owner<textarea id="hd-kb-draft-text" class="ipt" rows="4" maxlength="4000" oninput="hdKeepDraft('${ticket.id}','kbText',this.value)">${hdEsc(hdDraft(ticket, 'kbText') || ticket.resolution || '')}</textarea></label><div><button type="button" class="btn btn-secondary" onclick="hdKbCreateDraft('${ticket.id}')">Create knowledge draft</button></div></div>`
        : '<p class="muted">Create knowledge draft: available once the ticket is resolved.</p>';
  }
  return `<div class="card hd-related-knowledge"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Related › Knowledge</strong></div><div class="card-body">${list}${draft}</div></div>`;
}
// priorityCoach: { impact, urgency, line }: a coached ticket's explanation,
// shown once its Priority is calculated (Practice It feedback, never points).
// It says whether the student's Impact and Urgency match the facts, and why.
function hdPriorityCoachCard(ticket) {
  const coach = hdConsole(ticket).priorityCoach; if (!coach || !ticket.priority) return '';
  const expected = hdMatrixPriority(coach.impact, coach.urgency);
  const match = String(ticket.impact) === String(coach.impact) && String(ticket.urgency) === String(coach.urgency);
  const head = match
    ? `<strong>Matches the facts:</strong> Impact ${hdEsc(HD_IMPACT_LABELS[coach.impact] || coach.impact)} × Urgency ${hdEsc(HD_IMPACT_LABELS[coach.urgency] || coach.urgency)} = ${hdEsc(expected)}.`
    : `<strong>Look again:</strong> the facts give Impact ${hdEsc(HD_IMPACT_LABELS[coach.impact] || coach.impact)} × Urgency ${hdEsc(HD_IMPACT_LABELS[coach.urgency] || coach.urgency)} = ${hdEsc(expected)}. You set ${hdEsc(ticket.priority)}.`;
  return `<div class="callout ${match ? 'success' : 'warn'} hd-priority-coach" role="status" data-hd-priority-coach="${match ? 'match' : 'differs'}"><p style="margin:0 0 4px">${head}</p><p style="margin:0">${hdEsc(coach.line || '')}</p></div>`;
}
function hdMatrixCards(ticket) {
  return `${hdPriorityCoachCard(ticket)}${hdArrivalsCard(ticket)}${hdConvertCard(ticket)}${hdLinkCard(ticket)}${hdRewriteCard(ticket)}${hdContactCard(ticket)}${hdKnowledgeCard(ticket)}`;
}
// What a coach reads about the new features on one ticket (added to
// hdConsoleProgress only for a ticket that turns one on).
function hdMatrixProgress(ticket) {
  const config = hdConsole(ticket); const state = hdConsoleState(ticket); const out = {};
  if (config.matrix) {
    const sla = hdSlaState(ticket);
    out.matrix = { impact:ticket.impact || '', urgency:ticket.urgency || '', priority:ticket.priority || '', status:hdStatusText(ticket), holdReason:ticket.holdReason || '', assignmentGroup:ticket.assignmentGroup || '', responded:!!hdSlaClock(ticket).respondedAt, sla:sla.label, slaPhase:sla.phase || '' };
  }
  if (config.classify) out.classification = { ...hdClassification(ticket) };
  if (config.convert) out.request = ticket.request ? { item:ticket.request.item, requestedFor:ticket.request.requestedFor, approval:ticket.request.approval, state:ticket.request.state, fields:ticket.request.fields.map(field => ({ ...field })) } : null;
  if (config.link) out.parent = ticket.parentId || '';
  if (Array.isArray(config.arrivals)) out.arrived = (state.arrived || []).map(entry => entry.id);
  if (hdKbConfig(ticket).attach) out.kbAttached = (state.kbAttached || []).slice();
  if (hdKbConfig(ticket).draft) out.kbDraft = state.kbDraft ? state.kbDraft.state : '';
  if (hdContactConfig(ticket)) out.contactAttempts = hdContactAttempts(ticket).length;
  if (config.rewrite) out.rewriteMissing = state.rewrite ? state.rewrite.missing.slice() : null;
  if (config.comments && typeof config.comments === 'object' && Array.isArray(config.comments.internalNames)) {
    const comments = hdComments(ticket); const last = comments[comments.length - 1];
    out.lastCommentInternal = last ? hdJargonFound(last.text, config.comments.internalNames) : [];
  }
  return out;
}

/* ---------- Communication features (Module 3 on), switched on per ticket ----------
 * More `console` keys, each off unless a ticket's template sets it. Older
 * tickets look and behave as before, and a Prove shift never gets them
 * (hdConsole). Keys:
 *   now: ISO                       the ticket's own fixed clock (hdTicketClock),
 *                                  moved only by its "Go to follow-up time"
 *   vip: true                      a VIP badge on the ticket and its queue row
 *   conversation: { name, style?:'phone'|'chat', mood?:'Calm'|'Tense'|'Frustrated'|'Angry',
 *                   stages:[{ id, prompt?, messages?:[text], gapSeconds?, interruptLine?,
 *                             choices:[{ id, text, pass?, mood?:-1|0|1, line?, reply? }] }] }
 *                                  a live call or chat: a stage's messages
 *                                  arrive one at a time (real time, from the
 *                                  stage's start, so a reload keeps them);
 *                                  choices show from the first message;
 *                                  answering before the last one is an
 *                                  interruption; a wrong choice shows its
 *                                  line and the student chooses again. With
 *                                  mood, a mood meter (HD_MOODS) moves one
 *                                  step per scripted move, with its line.
 *                                  The meter is feedback only: it is never in
 *                                  hdConsoleProgress, so never in saved work.
 *   intake: { caller?:true, callback?:true }
 *                                  Caller (from the directory) and a typed
 *                                  callback number the student sets
 *   hold: { seconds?, ask, askReply?, back, unaskedLine, overLine }
 *                                  ask to hold, a hold timer in real time
 *                                  (start time saved), a return line; holding
 *                                  without asking or past the time moves the
 *                                  mood meter
 *   explain: { prompt?, words:[...], line, goodLine? }
 *                                  a typed plain-words explanation checked
 *                                  against the ticket's own word list (line:
 *                                  '{term}' is replaced by the first found)
 *   evidence: [{ id, title, rows:[{ label, value }] }]
 *                                  read-only cards; each open is recorded
 *   handoff: { parts? }            once assigned to another group, the latest
 *                                  work note is checked for its labels
 *                                  (default Reported, Tried, Result, Next action)
 *   warmHandoff: true              "Warm handoff" logs "Called <group> at <time>"
 *   followUp: { jump? }            a Follow-up date and time; jump adds "Go to
 *                                  follow-up time", which moves the ticket's
 *                                  own clock (console.now) or else the set's
 *   comments: { timeCheck:{ time, promise?, promiseLine, noTimeLine, moodDown?, goodLine? } }
 *                                  a customer comment must name a time (time:
 *                                  regex source); a fix-time promise (promise)
 *                                  gets promiseLine
 *   convert: { keepIncident:true } a request opened from the incident; the
 *                                  incident stays open
 *   teamMessages: [{ id, to, text, from, reply, assign? }]
 *                                  internal messages to another team, each
 *                                  with a scripted reply (assign: the person
 *                                  the reply assigns the ticket to)
 *   duplicateMove: { text, feedback, critical? }
 *                                  a "Create new incident" move on a ticket
 *                                  that already exists: recorded as a
 *                                  critical error, shown as feedback
 * A followUp ticket needs a clock (console.now or its set's now): on the
 * fixed default clock an update can never reach the follow-up time.
 * A practice set may set done:{ id:[rule] }: that ticket counts as done for
 * the set's completion when every rule holds (hdPracticeClosed), in place of
 * the state test, so each list should include a state rule (status or
 * requestOpen). Rules for
 * this work (hdCommsRule): call, intakeCaller, callback, held, explained,
 * evidence, handoffNote, warmHandoff, followUp, followUpUpdated,
 * commentTime, teamMessage, requestOpen. */
const HD_MOODS = ['Calm', 'Tense', 'Frustrated', 'Angry'];
const HD_CALL_GAP_SECONDS = 4;
const HD_HOLD_SECONDS = 120;
const HD_CALLBACK_MAX = 40;
const HD_HANDOFF_PARTS = ['reported', 'tried', 'result', 'next'];
function hdCommsOpen(ticket) { return !['Resolved', 'Closed', 'Canceled'].includes(ticket.status); }
function hdVipBadge(ticket) { return hdConsole(ticket).vip ? `<span data-hd-vip>${hdBadge('VIP', 'vip')}</span>` : ''; }

// The mood meter (conversation.mood): a level on HD_MOODS and every move.
function hdMood(ticket) {
  const start = (hdConsole(ticket).conversation || {}).mood;
  if (!HD_MOODS.includes(start)) return null;
  const state = hdConsoleState(ticket);
  if (!state.mood || typeof state.mood.level !== 'number') state.mood = { level:HD_MOODS.indexOf(start), moves:[] };
  if (!Array.isArray(state.mood.moves)) state.mood.moves = [];
  return state.mood;
}
function hdMoodMove(ticket, delta, line) {
  const mood = hdMood(ticket); if (!mood || !delta) return;
  mood.level = Math.max(0, Math.min(HD_MOODS.length - 1, mood.level + (delta > 0 ? 1 : -1)));
  // Every move shows a reason: the ticket's line, else a plain default.
  const reason = String(line || '').trim() || (delta > 0 ? 'That didn\'t help the caller.' : 'That helped the caller.');
  mood.moves.push({ delta:delta > 0 ? 1 : -1, line:reason.slice(0, 300) });
  if (mood.moves.length > 60) mood.moves.splice(0, mood.moves.length - 60);
}
// For a coach's hint: the meter's level name, or '' (never saved). Hints
// only: a coach step must never need a mood level to complete.
function hdCallMood(id) { const ticket = hdTicketById(id); const mood = ticket && hdMood(ticket); return mood ? HD_MOODS[mood.level] : ''; }

// The live conversation.
// The call starts (its first stage's clock) when the student first sees it or
// answers: start false only reads it, so the tick, a coach's check and the
// work snapshot never start a call the student hasn't opened.
function hdCall(ticket, now = hdNowMs(), start = true) {
  const config = hdConsole(ticket).conversation; if (!config || !Array.isArray(config.stages)) return null;
  const state = hdConsoleState(ticket);
  const call = state.call = state.call || {};
  call.stage = Number.isInteger(call.stage) ? call.stage : 0;
  call.log = Array.isArray(call.log) ? call.log : [];
  call.tries = Array.isArray(call.tries) ? call.tries : [];
  call.interruptions = call.interruptions || 0;
  if (typeof call.startedAt !== 'number' && start) call.startedAt = now;
  call.done = call.stage >= config.stages.length;
  return call;
}
function hdCallStage(ticket) { const call = hdCall(ticket, hdNowMs(), false); return call && !call.done ? hdConsole(ticket).conversation.stages[call.stage] : null; }
// How many of the stage's messages have arrived, from its start time.
function hdCallArrived(ticket, now = hdNowMs()) {
  const call = hdCall(ticket, now, false); const stage = hdCallStage(ticket);
  const messages = stage && Array.isArray(stage.messages) ? stage.messages : [];
  if (!messages.length || typeof call.startedAt !== 'number') return 0;
  const gap = (Number(stage.gapSeconds) > 0 ? Number(stage.gapSeconds) : HD_CALL_GAP_SECONDS) * 1000;
  return Math.min(messages.length, Math.floor(Math.max(0, now - call.startedAt) / gap) + 1);
}
// The choices' order: shuffled per shift and stage, the same on every redraw.
function hdCallSeed(ticket, stage) {
  let n = (hdState && hdState.seed) || 1;
  for (const ch of `${ticket.id}:${stage.id}`) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  return n || 1;
}
function hdCallChoose(id, choiceId, now = hdNowMs()) {
  const ticket = hdTicketById(id); const call = ticket && hdCall(ticket, now); const stage = call && hdCallStage(ticket);
  const choice = stage && (stage.choices || []).find(item => item.id === choiceId); if (!choice) return;
  const config = hdConsole(ticket).conversation;
  const total = Array.isArray(stage.messages) ? stage.messages.length : 0;
  if (total && hdCallArrived(ticket, now) < total) {
    call.interruptions += 1;
    call.lastLine = stage.interruptLine || `${config.name || 'The caller'} hadn't finished.`; call.lastTone = 'warn';
    hdMoodMove(ticket, 1, call.lastLine);
    hdPracticeEvent('call_interrupted', { ticket:ticket.id, stage:stage.id });
    hdRerender(); return;
  }
  call.tries.push({ stage:stage.id, choice:choice.id, pass:choice.pass === true });
  if (call.tries.length > 80) call.tries.splice(0, call.tries.length - 80);
  hdMoodMove(ticket, typeof choice.mood === 'number' ? choice.mood : (choice.pass ? 0 : 1), choice.line);
  call.lastLine = choice.line || ''; call.lastTone = choice.pass ? 'success' : 'warn';
  hdPracticeEvent('call_reply', { ticket:ticket.id, stage:stage.id, choice:choice.id, pass:choice.pass === true });
  if (!choice.pass) { hdRerender(); return; }
  const time = hdConsoleTime(ticket);
  (stage.messages || []).forEach(text => call.log.push({ who:'caller', text, time }));
  call.log.push({ who:'you', text:choice.text, time });
  if (choice.reply) call.log.push({ who:'caller', text:choice.reply, time });
  call.stage += 1; call.startedAt = now;
  call.done = call.stage >= config.stages.length;
  hdRerender();
}
function hdCallListen(id, now = hdNowMs()) {
  const ticket = hdTicketById(id); const stage = ticket && hdCallStage(ticket); if (!stage) return;
  const total = Array.isArray(stage.messages) ? stage.messages.length : 0;
  const name = hdConsole(ticket).conversation.name || 'The caller';
  toast(total && hdCallArrived(ticket, now) < total ? `${name} is still talking. Keep listening.` : `${name} has finished. Choose your reply.`);
  hdRerender();
}

// The hold: asked, running (start time) and every hold taken.
function hdHold(ticket) {
  if (!hdConsole(ticket).hold) return null;
  const state = hdConsoleState(ticket);
  const hold = state.hold = state.hold || {};
  hold.asked = hold.asked === true;
  hold.startedAt = typeof hold.startedAt === 'number' ? hold.startedAt : 0;
  hold.holds = Array.isArray(hold.holds) ? hold.holds : [];
  return hold;
}
function hdHoldLimit(ticket) { const seconds = Number(hdConsole(ticket).hold.seconds); return (seconds > 0 ? seconds : HD_HOLD_SECONDS) * 1000; }
// A hold past its time moves the meter once, whether the student is on the
// page (the tick) or comes back to it later (the return).
function hdHoldCheckOver(ticket, now = hdNowMs()) {
  const hold = hdHold(ticket); if (!hold || !hold.startedAt || hold.over) return false;
  if (now - hold.startedAt <= hdHoldLimit(ticket)) return false;
  hold.over = true;
  hdMoodMove(ticket, 1, hdConsole(ticket).hold.overLine);
  hdPracticeEvent('hold_over', { ticket:ticket.id });
  return true;
}
function hdHoldAsk(id) {
  const ticket = hdTicketById(id); const hold = ticket && hdHold(ticket); if (!hold || hold.startedAt || hold.asked) return;
  hold.asked = true;
  hdHistory(ticket, 'Asked the caller before placing them on hold.');
  hdRerender();
}
function hdHoldStart(id, now = hdNowMs()) {
  const ticket = hdTicketById(id); const hold = ticket && hdHold(ticket); if (!hold || hold.startedAt) return;
  if (!hold.asked) { hold.unasked = true; hdMoodMove(ticket, 1, hdConsole(ticket).hold.unaskedLine); }
  hold.startedAt = now; hold.over = false;
  hdHistory(ticket, 'Caller placed on hold.');
  hdPracticeEvent('hold_started', { ticket:ticket.id, asked:hold.asked });
  hdRerender();
}
function hdHoldReturn(id, now = hdNowMs()) {
  const ticket = hdTicketById(id); const hold = ticket && hdHold(ticket); if (!hold || !hold.startedAt) return;
  hdHoldCheckOver(ticket, now);
  const seconds = Math.round((now - hold.startedAt) / 1000);
  hold.holds.push({ seconds, asked:hold.asked, over:hold.over === true });
  if (hold.holds.length > 20) hold.holds.splice(0, hold.holds.length - 20);
  hold.startedAt = 0; hold.asked = false; hold.over = false;
  hdHistory(ticket, `Back from hold after ${seconds} seconds${hold.holds[hold.holds.length - 1].over ? ' (too long)' : ''}.`);
  hdPracticeEvent('hold_returned', { ticket:ticket.id, seconds });
  hdRerender();
}
function hdHoldTimerText(ticket, now = hdNowMs()) {
  const hold = hdHold(ticket); if (!hold || !hold.startedAt) return '';
  const used = Math.max(0, Math.floor((now - hold.startedAt) / 1000)); const limit = Math.round(hdHoldLimit(ticket) / 1000);
  const text = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  return `On hold ${text(used)} of ${text(limit)}`;
}

// Caller and callback number (intake).
function hdIntake(ticket) {
  if (!hdConsole(ticket).intake) return null;
  const state = hdConsoleState(ticket);
  state.intake = state.intake || { caller:'', callback:'' };
  return state.intake;
}
function hdCallerText(ticket) {
  const config = hdConsole(ticket).intake;
  return config && config.caller ? (hdIntake(ticket).caller || 'Not set') : ticket.requester;
}
function hdCallbackField(ticket) {
  const config = hdConsole(ticket).intake;
  return config && config.callback ? `<div><span>Callback number</span><strong>${hdEsc(hdIntake(ticket).callback || 'Not set')}</strong></div>` : '';
}
function hdIntakeSave(id) {
  const ticket = hdTicketById(id); const intake = ticket && hdIntake(ticket); if (!intake) return;
  const config = hdConsole(ticket).intake;
  const caller = String((document.getElementById('hd-intake-caller') || {}).value || '');
  const callback = String((document.getElementById('hd-intake-callback') || {}).value || '').trim().slice(0, HD_CALLBACK_MAX);
  if (config.caller && !HD_USERS.some(user => user.name === caller)) { toast('Choose the caller from the directory.'); return; }
  if (config.callback && !/\d/.test(callback)) { toast('Type the number to call back on, for example an extension.'); return; }
  if (hdPasswordInText(callback)) { toast(hdRefusePasswordText(ticket, 'callback number')); return; }
  if (config.caller) intake.caller = caller;
  if (config.callback) intake.callback = callback;
  hdClearDraft(ticket, 'callback'); hdClearDraft(ticket, 'caller');
  hdHistory(ticket, [config.caller ? `Caller set to ${caller}` : '', config.callback ? `callback number ${callback}` : ''].filter(Boolean).join('; ') + '.');
  hdPracticeEvent('intake_saved', { ticket:ticket.id });
  hdRerender();
}

// The plain-words explanation (explain).
function hdExplainCheck(id) {
  const ticket = hdTicketById(id); const config = ticket && hdConsole(ticket).explain; if (!config) return;
  const text = String((document.getElementById('hd-explain-input') || {}).value || '').trim().slice(0, 2000);
  if (text.length < 10) { toast('Type what you would say to the caller first.'); return; }
  if (hdPasswordInText(text)) { toast(hdRefusePasswordText(ticket, 'explanation')); return; }
  const state = hdConsoleState(ticket);
  const explain = state.explain = state.explain || { tries:[], passed:false, text:'' };
  const flagged = hdJargonFound(text, config.words);
  explain.tries.push({ flagged });
  if (explain.tries.length > 40) explain.tries.splice(0, explain.tries.length - 40);
  explain.text = text; explain.flagged = flagged;
  if (!flagged.length) { explain.passed = true; hdClearDraft(ticket, 'explain'); hdHistory(ticket, 'Explained the next step to the caller in plain words.'); }
  hdPracticeEvent('explained', { ticket:ticket.id, flagged:flagged.join(', ') });
  hdRerender();
}

// Read-only evidence cards: each open is recorded.
function hdEvidenceOpen(id, cardId) {
  const ticket = hdTicketById(id); const cards = ticket && hdConsole(ticket).evidence;
  const card = Array.isArray(cards) && cards.find(item => item.id === cardId); if (!card) return;
  const state = hdConsoleState(ticket);
  state.evidenceOpened = Array.isArray(state.evidenceOpened) ? state.evidenceOpened : [];
  if (state.evidenceShown === cardId) { state.evidenceShown = ''; hdRerender(); return; }
  state.evidenceShown = cardId;
  state.evidenceOpened.push({ id:cardId, time:hdConsoleTime(ticket) });
  if (state.evidenceOpened.length > 60) state.evidenceOpened.splice(0, state.evidenceOpened.length - 60);
  hdPracticeEvent('evidence_opened', { ticket:ticket.id, id:cardId });
  hdRerender();
}

// The handoff note: the labels the latest note still needs once the ticket
// is with another group, or null while it is with the Service Desk.
function hdHandoffMissing(ticket) {
  const config = hdConsole(ticket).handoff; if (!config) return null;
  if ((ticket.assignmentGroup || HD_SERVICE_DESK) === HD_SERVICE_DESK) return null;
  const parts = Array.isArray(config.parts) && config.parts.length ? config.parts.filter(key => HD_NOTE_PARTS[key]) : HD_HANDOFF_PARTS;
  const note = (ticket.notes || []).filter(item => item.author === 'Riley Morgan').pop();
  return note ? hdNoteMissingParts(note.text, parts) : parts.map(key => HD_NOTE_PARTS[key]);
}
function hdWarmHandoff(id) {
  const ticket = hdTicketById(id); if (!ticket || !hdConsole(ticket).warmHandoff || !hdCommsOpen(ticket)) return;
  const group = ticket.assignmentGroup || HD_SERVICE_DESK;
  if (group === HD_SERVICE_DESK) { toast('Assign the ticket to the other team first, then call them.'); return; }
  const state = hdConsoleState(ticket);
  state.warmHandoffs = Array.isArray(state.warmHandoffs) ? state.warmHandoffs : [];
  const at = hdShiftIso(ticket);
  state.warmHandoffs.push({ group, at });
  hdHistory(ticket, `Called ${group} at ${hdShiftTimeText(at).split(' ')[1]} (warm handoff).`);
  hdPracticeEvent('warm_handoff', { ticket:ticket.id, group });
  hdRerender();
}

// Follow-up date and time, in shift time (UTC); "Go to follow-up time".
// The input is read as shift time, never the browser's zone: the shift
// clock the student reads is UTC in every browser (hdShiftTimeText).
function hdFollowUpValue(iso) { return iso ? new Date(iso).toISOString().slice(0, 16) : ''; }
function hdFollowUpSet(id) {
  const ticket = hdTicketById(id); if (!ticket || !hdConsole(ticket).followUp || !hdCommsOpen(ticket)) return;
  const value = String((document.getElementById('hd-follow-up-input') || {}).value || '').trim();
  const ms = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? Date.parse(`${value}:00Z`) : NaN;
  if (Number.isNaN(ms)) { toast('Choose the follow-up date and time.'); return; }
  if (ms <= hdShiftNow(ticket).getTime()) { toast('Choose a follow-up time later than now.'); return; }
  const state = hdConsoleState(ticket);
  state.followUp = new Date(ms).toISOString();
  hdClearDraft(ticket, 'followUp');
  hdHistory(ticket, `Follow-up set for ${hdShiftTimeText(state.followUp)}.`);
  hdPracticeEvent('follow_up_set', { ticket:ticket.id, at:state.followUp });
  hdRerender();
}
function hdFollowUpCanJump(ticket) {
  const config = hdConsole(ticket).followUp; const state = hdConsoleState(ticket);
  if (!config || !config.jump || !state.followUp) return false;
  if (!hdTicketClock(ticket) && !(hdActiveSet() && hdActiveSet().now)) return false;
  return Date.parse(state.followUp) > hdShiftNow(ticket).getTime();
}
function hdFollowUpGo(id) {
  const ticket = hdTicketById(id); if (!ticket || !hdFollowUpCanJump(ticket)) return;
  const state = hdConsoleState(ticket);
  // Only the clock the ticket runs on moves: its own, or else its set's.
  if (hdTicketClock(ticket)) state.clockNow = state.followUp; else hdState.clockNow = state.followUp;
  state.followUpVisited = true;
  hdHistory(ticket, 'Follow-up time reached.');
  hdPracticeEvent('follow_up_time', { ticket:ticket.id, now:state.followUp });
  toast(`It's ${hdShiftTimeText(hdShiftNow(ticket))}, the follow-up time.`);
  hdRerender();
}
// A comment posted within 10 minutes of the follow-up time, on the shift clock.
function hdFollowUpUpdated(ticket) {
  const at = Date.parse(hdConsoleState(ticket).followUp || ''); if (Number.isNaN(at)) return false;
  return hdComments(ticket).some(comment => { const ms = Date.parse(comment.at || ''); return ms >= at && ms <= at + 10 * 60000; });
}

// The customer comment's time check (comments.timeCheck): a time, and no
// fix-time promise. Patterns are the ticket's own data.
function hdCommentTimeResult(ticket, text) {
  const config = hdConsole(ticket).comments;
  const check = config && typeof config === 'object' ? config.timeCheck : null; if (!check) return null;
  const test = pattern => { if (!pattern) return false; try { return new RegExp(pattern, 'i').test(String(text || '')); } catch (_) { return false; } };
  return { hasTime:test(check.time), promise:test(check.promise) };
}
function hdCommentPromiseCritical(ticket) {
  const check = (hdConsole(ticket).comments || {}).timeCheck; if (!check || !check.promiseCritical) return '';
  const last = (hdConsoleState(ticket).commentChecks || []).slice(-1)[0];
  return last && last.promise ? check.promiseCritical : '';
}
function hdCommentTimeTip(ticket, text) {
  const result = hdCommentTimeResult(ticket, text); if (!result) return '';
  const check = hdConsole(ticket).comments.timeCheck;
  const state = hdConsoleState(ticket);
  state.commentChecks = Array.isArray(state.commentChecks) ? state.commentChecks : [];
  state.commentChecks.push(result);
  if (state.commentChecks.length > 40) state.commentChecks.splice(0, state.commentChecks.length - 40);
  if (result.promise) return ` ${check.promiseLine || ''}`.trimEnd();
  if (!result.hasTime) return ` ${check.noTimeLine || ''}`.trimEnd();
  if (check.moodDown) hdMoodMove(ticket, -1, check.goodLine);
  return '';
}

// Internal messages to another team, each with its scripted reply.
function hdTeamMessage(id, messageId) {
  const ticket = hdTicketById(id); const list = ticket && hdConsole(ticket).teamMessages;
  const message = Array.isArray(list) && list.find(item => item.id === messageId); if (!message) return;
  const state = hdConsoleState(ticket);
  state.teamMessages = Array.isArray(state.teamMessages) ? state.teamMessages : [];
  if (state.teamMessages.some(entry => entry.id === message.id)) return;
  state.teamMessages.push({ id:message.id, time:hdConsoleTime(ticket) });
  hdHistory(ticket, `Internal message to ${message.to} (not customer-visible).`);
  if (message.assign) { ticket.assignedTechnician = message.assign; hdHistory(ticket, `Assigned to ${message.assign} by ${message.from || message.to}.`); }
  hdPracticeEvent('team_message', { ticket:ticket.id, message:message.id });
  hdRerender();
}
function hdDuplicateMove(id) {
  const ticket = hdTicketById(id); const config = ticket && hdConsole(ticket).duplicateMove; if (!config) return;
  const state = hdConsoleState(ticket);
  state.duplicateTried = true;
  hdConsoleCritical(ticket, 'duplicate-ticket', config.critical || `Chose: ${config.text || 'Create new incident'}`);
  hdPracticeEvent('duplicate_tried', { ticket:ticket.id });
  hdRerender();
}

// Rules for this work ("Check my work" and a set's done rules). undefined
// for a rule that isn't one of these.
function hdCommsRule(ticket, rule) {
  const state = hdConsoleState(ticket);
  if (rule.call) { const call = hdCall(ticket, hdNowMs(), false); return !!(call && call.done); }
  if (rule.intakeCaller) { const intake = hdIntake(ticket); return !!(intake && intake.caller === rule.intakeCaller); }
  if (rule.callback) { const intake = hdIntake(ticket); return !!(intake && intake.callback); }
  if (rule.held) { const hold = hdHold(ticket); return !!(hold && hold.holds.some(entry => entry.asked && !entry.over)); }
  if (rule.explained) return !!(state.explain && state.explain.passed);
  if (rule.evidence) return (state.evidenceOpened || []).some(entry => entry.id === rule.evidence);
  if (rule.handoffNote) { const missing = hdHandoffMissing(ticket); return !!missing && !missing.length; }
  if (rule.warmHandoff) return (state.warmHandoffs || []).length > 0;
  if (rule.followUp) return !!state.followUp;
  if (rule.followUpUpdated) return hdFollowUpUpdated(ticket);
  if (rule.commentTime) return (state.commentChecks || []).some(entry => entry.hasTime && !entry.promise);
  if (rule.teamMessage) return (state.teamMessages || []).some(entry => entry.id === rule.teamMessage);
  if (rule.requestOpen) return !!(ticket.request && ticket.request.state === 'Open' && hdCommsOpen(ticket));
  return undefined;
}
// What a coach reads about this work (in hdConsoleProgress, only for a
// ticket that turns a feature on). Never the mood meter.
function hdCommsProgress(ticket) {
  const config = hdConsole(ticket); const state = hdConsoleState(ticket); const out = {};
  if (config.conversation) { const call = hdCall(ticket, hdNowMs(), false); if (call) out.call = { stage:call.stage, done:call.done, interruptions:call.interruptions, wrong:call.tries.filter(entry => !entry.pass).map(entry => entry.choice) }; }
  if (config.intake) out.intake = { ...hdIntake(ticket) };
  if (config.hold) { const hold = hdHold(ticket); out.hold = { asked:hold.asked, onHold:!!hold.startedAt, unasked:hold.unasked === true, holds:hold.holds.map(entry => ({ ...entry })) }; }
  if (config.explain) out.explain = state.explain ? { passed:state.explain.passed, tries:state.explain.tries.length, flagged:(state.explain.flagged || []).slice(), text:state.explain.text } : { passed:false, tries:0, flagged:[], text:'' };
  if (Array.isArray(config.evidence)) out.evidenceOpened = [...new Set((state.evidenceOpened || []).map(entry => entry.id))];
  if (config.handoff) out.handoffMissing = hdHandoffMissing(ticket);
  if (config.warmHandoff) out.warmHandoffs = (state.warmHandoffs || []).map(entry => ({ ...entry }));
  if (config.followUp) out.followUp = { at:state.followUp || '', visited:state.followUpVisited === true, updated:hdFollowUpUpdated(ticket) };
  if (hdCommentTimeResult(ticket, '')) out.commentChecks = (state.commentChecks || []).map(entry => ({ ...entry }));
  if (Array.isArray(config.teamMessages)) out.teamMessages = (state.teamMessages || []).map(entry => entry.id);
  if (config.duplicateMove) out.duplicateTried = state.duplicateTried === true;
  return out;
}

// The cards and controls. Each is '' for a ticket without its feature.
function hdMoodHtml(ticket) {
  const mood = hdMood(ticket); if (!mood) return '';
  const last = mood.moves[mood.moves.length - 1];
  return `<div class="hd-mood" data-hd-mood="${hdEsc(HD_MOODS[mood.level])}" role="status" style="display:grid;gap:4px;margin:0 0 10px"><div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center"><span class="muted">Mood</span>${HD_MOODS.map((name, index) => `<span style="padding:2px 8px;border-radius:999px;border:1px solid #d0d5dd;${index === mood.level ? 'background:#1d2939;color:#fff;font-weight:600' : ''}"${index === mood.level ? ' aria-current="true"' : ''}>${hdEsc(name)}</span>`).join('')}</div>${last && last.line ? `<small>${last.delta > 0 ? '▲' : '▼'} ${hdEsc(last.line)}</small>` : ''}<small class="muted">Feedback only: the meter is never scored.</small></div>`;
}
function hdCallCard(ticket, now = hdNowMs()) {
  const config = hdConsole(ticket).conversation; const call = config && hdCall(ticket, now); if (!call) return '';
  const name = config.name || ticket.requester;
  const stage = hdCallStage(ticket);
  const arrived = stage ? hdCallArrived(ticket, now) : 0;
  const total = stage && Array.isArray(stage.messages) ? stage.messages.length : 0;
  const line = entry => `<div><strong>${entry.who === 'you' ? 'You' : hdEsc(name)}${entry.time ? ` · ${hdEsc(entry.time)}` : ''}</strong><p>${hdEsc(entry.text)}</p></div>`;
  const live = stage && total ? stage.messages.slice(0, arrived).map(text => line({ who:'caller', text })).join('') : '';
  const log = call.log.map(line).join('') + live;
  const talking = total && arrived < total ? `<p class="muted" data-hd-call-talking>${hdEsc(name)} is still talking…</p>` : '';
  const feedback = call.lastLine ? `<div class="callout ${call.lastTone === 'success' ? 'success' : 'warn'}" role="status">${hdEsc(call.lastLine)}</div>` : '';
  const choices = stage && (!total || arrived > 0) ? `${stage.prompt ? `<p><strong>${hdEsc(stage.prompt)}</strong></p>` : ''}<div style="display:grid;gap:8px">${hdSeededOrder((stage.choices || []).slice(), hdCallSeed(ticket, stage)).map(choice => `<button type="button" class="btn btn-secondary" ${HD_CONSOLE_CHOICE} onclick="hdCallChoose('${ticket.id}','${hdEsc(choice.id)}')">${hdEsc(choice.text)}</button>`).join('')}${total ? `<button type="button" class="btn btn-ghost" onclick="hdCallListen('${ticket.id}')">Keep listening</button>` : ''}</div>` : '';
  const ended = call.done ? '<p class="muted">The scripted part of the conversation is done. Carry on with the ticket.</p>' : '';
  const kind = config.style === 'chat' ? 'Chat' : 'Phone call';
  return `<div class="card hd-call" data-hd-call="${hdEsc(stage ? stage.id : 'done')}"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>${kind}</strong><span class="muted">${hdEsc(name)} · ${config.style === 'chat' ? 'in the chat' : 'on the line'}</span></div><div class="card-body">${hdMoodHtml(ticket)}<div class="hd-note-list">${log || '<p class="muted">The conversation hasn\'t started yet.</p>'}</div>${talking}${feedback}${choices}${ended}</div></div>`;
}
function hdIntakeCard(ticket) {
  const config = hdConsole(ticket).intake; if (!config) return '';
  const intake = hdIntake(ticket);
  const callback = hdDraft(ticket, 'callback') || intake.callback;
  const chosen = hdDraft(ticket, 'caller') || intake.caller;
  const caller = config.caller ? `<label>Caller<select id="hd-intake-caller" class="select" data-hd-field="caller" onchange="hdKeepDraft('${ticket.id}','caller',this.value)"><option value="">Choose…</option>${HD_USERS.map(user => `<option ${chosen === user.name ? 'selected' : ''}>${hdEsc(user.name)}</option>`).join('')}</select></label>` : '';
  const number = config.callback ? `<label>Callback number<input id="hd-intake-callback" class="ipt" maxlength="${HD_CALLBACK_MAX}" value="${hdEsc(callback)}" oninput="hdKeepDraft('${ticket.id}','callback',this.value)" placeholder="e.g. ext. 1234"></label>` : '';
  return `<div class="card hd-intake" data-hd-intake><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Caller details</strong><span class="muted">Get these first, in case the call drops.</span></div><div class="card-body" style="display:grid;gap:8px">${caller}${number}<div><button type="button" class="btn btn-secondary" onclick="hdIntakeSave('${ticket.id}')">Save caller details</button></div></div></div>`;
}
function hdHoldCard(ticket, now = hdNowMs()) {
  const config = hdConsole(ticket).hold; if (!config) return '';
  const hold = hdHold(ticket);
  const last = hold.holds[hold.holds.length - 1];
  const status = hold.startedAt
    ? `<p id="hd-hold-timer" data-hd-hold="on" role="timer" aria-live="off"><strong>${hdEsc(hdHoldTimerText(ticket, now))}</strong></p>`
    : `<p class="muted" data-hd-hold="off">${last ? `Last hold: ${hdEsc(String(last.seconds))} ${last.seconds === 1 ? 'second' : 'seconds'}${last.over ? ', too long. Ask again, start a new hold and come back sooner' : last.asked ? '' : ', started without asking. Ask, then start a new hold'}.` : 'Not on hold.'}</p>`;
  const asked = hold.asked ? `<div><strong>You</strong><p>${hdEsc(config.ask)}</p>${config.askReply ? `<strong>${hdEsc((hdConsole(ticket).conversation || {}).name || ticket.requester)}</strong><p>${hdEsc(config.askReply)}</p>` : ''}</div>` : '';
  const controls = hold.startedAt
    ? `<button type="button" class="btn btn-primary" onclick="hdHoldReturn('${ticket.id}')">${hdEsc(config.back || 'Thanks for holding.')}</button>`
    : `<div style="display:grid;gap:8px">${hold.asked ? '' : `<button type="button" class="btn btn-secondary" ${HD_CONSOLE_CHOICE} onclick="hdHoldAsk('${ticket.id}')">${hdEsc(config.ask || 'May I put you on a short hold?')}</button>`}<button type="button" class="btn btn-secondary" onclick="hdHoldStart('${ticket.id}')">Start hold</button></div>`;
  return `<div class="card hd-hold"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Hold</strong><span class="muted">Ask first, and come back within ${Math.round(hdHoldLimit(ticket) / 60000)} minutes.</span></div><div class="card-body"><div class="hd-note-list">${asked}</div>${status}${controls}</div></div>`;
}
function hdExplainCard(ticket) {
  const config = hdConsole(ticket).explain; if (!config) return '';
  const explain = hdConsoleState(ticket).explain;
  const flagged = explain && explain.flagged && explain.flagged.length ? explain.flagged : [];
  const feedback = !explain ? '' : flagged.length
    ? `<div class="callout warn" role="status" data-hd-explain="flagged">${hdEsc(String(config.line || 'Say it in plain words: {term}').replace('{term}', flagged[0]))}</div>`
    : `<div class="callout success" role="status" data-hd-explain="ok">${hdEsc(config.goodLine || 'Plain words: no flagged terms.')}</div>`;
  const value = hdDraft(ticket, 'explain') || (explain && !explain.passed ? explain.text : '');
  return `<div class="card hd-explain"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Explain it in plain words</strong><span class="muted">What you say to the caller</span></div><div class="card-body" style="display:grid;gap:8px">${config.prompt ? `<p>${hdEsc(config.prompt)}</p>` : ''}${explain && explain.passed ? `<p><strong>You said:</strong> ${hdEsc(explain.text)}</p>` : `<textarea id="hd-explain-input" class="ipt" rows="4" maxlength="2000" oninput="hdKeepDraft('${ticket.id}','explain',this.value)">${hdEsc(value)}</textarea><div><button type="button" class="btn btn-secondary" onclick="hdExplainCheck('${ticket.id}')">Say it</button></div>`}${feedback}</div></div>`;
}
function hdEvidenceCards(ticket) {
  const cards = hdConsole(ticket).evidence; if (!Array.isArray(cards) || !cards.length) return '';
  const state = hdConsoleState(ticket);
  return cards.map(card => {
    const open = state.evidenceShown === card.id;
    const rows = open ? `<dl class="hd-dl">${(card.rows || []).map(row => `<dt>${hdEsc(row.label)}</dt><dd>${hdEsc(row.value)}</dd>`).join('')}</dl>` : '';
    return `<div class="card hd-evidence-card" data-hd-evidence="${hdEsc(card.id)}"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>${hdEsc(card.title)}</strong><span class="muted">Read-only</span><button type="button" class="btn btn-ghost btn-sm" aria-expanded="${open}" onclick="hdEvidenceOpen('${ticket.id}','${hdEsc(card.id)}')">${open ? 'Close' : 'Open'}</button></div>${open ? `<div class="card-body">${rows}</div>` : ''}</div>`;
  }).join('');
}
function hdHandoffCard(ticket) {
  const missing = hdHandoffMissing(ticket); if (!missing) return '';
  const config = hdConsole(ticket).handoff;
  const parts = Array.isArray(config.parts) && config.parts.length ? config.parts.filter(key => HD_NOTE_PARTS[key]) : HD_HANDOFF_PARTS;
  return `<div class="card hd-handoff" data-hd-handoff="${missing.length ? 'missing' : 'ok'}"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Handoff note</strong><span class="muted">${hdEsc(ticket.assignmentGroup)} reads your latest work note.</span></div><div class="card-body"><ul class="hd-list">${parts.map(key => `<li>${missing.includes(HD_NOTE_PARTS[key]) ? '○' : '✓'} ${hdEsc(HD_NOTE_PARTS[key])}</li>`).join('')}</ul></div></div>`;
}
function hdTeamMessagesCard(ticket) {
  const list = hdConsole(ticket).teamMessages; if (!Array.isArray(list) || !list.length) return '';
  const sent = hdConsoleState(ticket).teamMessages || [];
  const log = sent.map(entry => { const message = list.find(item => item.id === entry.id); return message ? `<div data-hd-team="${hdEsc(message.id)}"><strong>You to ${hdEsc(message.to)} · ${hdEsc(entry.time)}</strong><p>${hdEsc(message.text)}</p><strong>${hdEsc(message.from || message.to)}</strong><p>${hdEsc(message.reply)}</p></div>` : ''; }).join('');
  const open = list.filter(message => !sent.some(entry => entry.id === message.id));
  return `<div class="card hd-team-messages"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Message another team</strong><span class="muted">Internal: the caller doesn't see this.</span></div><div class="card-body"><div class="hd-note-list">${log || '<p class="muted">No internal messages yet.</p>'}</div>${open.length ? `<div style="display:grid;gap:8px">${open.map(message => `<button type="button" class="btn btn-secondary" ${HD_CONSOLE_CHOICE} onclick="hdTeamMessage('${ticket.id}','${hdEsc(message.id)}')">To ${hdEsc(message.to)}: ${hdEsc(message.text)}</button>`).join('')}</div>` : ''}</div></div>`;
}
function hdWarmHandoffControl(ticket) {
  if (!hdConsole(ticket).warmHandoff || !hdCommsOpen(ticket)) return '';
  const calls = hdConsoleState(ticket).warmHandoffs || [];
  const away = (ticket.assignmentGroup || HD_SERVICE_DESK) !== HD_SERVICE_DESK;
  return `<div data-hd-warm="${calls.length}"><button type="button" class="btn btn-secondary" ${away ? '' : 'disabled aria-describedby="hd-warm-why" style="opacity:.55;cursor:not-allowed"'} onclick="hdWarmHandoff('${ticket.id}')">Warm handoff: call ${hdEsc(away ? ticket.assignmentGroup : 'the team')}</button>${away ? '' : '<small id="hd-warm-why" class="muted"> Assign it to the other team first.</small>'}${calls.length ? `<small class="muted"> Called ${hdEsc(hdShiftTimeText(calls[calls.length - 1].at))}</small>` : ''}</div>`;
}
function hdFollowUpControl(ticket) {
  const config = hdConsole(ticket).followUp; if (!config) return '';
  const state = hdConsoleState(ticket);
  const open = hdCommsOpen(ticket);
  // With nothing set, the picker opens on the ticket's shift time (never the
  // computer's date), so only the time needs changing.
  const value = hdDraft(ticket, 'followUp') || hdFollowUpValue(state.followUp || hdShiftIso(ticket));
  const set = open ? `<label>Follow-up (date and time on the shift clock)<input id="hd-follow-up-input" class="ipt" type="datetime-local" value="${hdEsc(value)}" oninput="hdKeepDraft('${ticket.id}','followUp',this.value)"></label><button type="button" class="btn btn-secondary" onclick="hdFollowUpSet('${ticket.id}')">Set follow-up</button>` : '';
  const shown = state.followUp ? `<p class="muted" style="margin:0">Follow-up: ${hdEsc(hdShiftTimeText(state.followUp))} · now ${hdEsc(hdShiftTimeText(hdShiftNow(ticket)))}</p>` : '';
  const jump = hdFollowUpCanJump(ticket) ? `<button type="button" class="btn btn-secondary" onclick="hdFollowUpGo('${ticket.id}')">Go to follow-up time</button>` : '';
  return `<div data-hd-follow-up="${state.followUp ? 'set' : 'none'}" style="display:grid;gap:6px">${set}${shown}${jump}</div>`;
}
function hdDuplicateControl(ticket) {
  const config = hdConsole(ticket).duplicateMove; if (!config) return '';
  const tried = hdConsoleState(ticket).duplicateTried === true;
  return `<div data-hd-duplicate="${tried ? 'tried' : 'no'}"><button type="button" class="btn btn-secondary" onclick="hdDuplicateMove('${ticket.id}')">${hdEsc(config.text || 'Create new incident')}</button>${tried && config.feedback ? `<div class="callout bad" role="alert" style="margin-top:6px">${hdEsc(config.feedback)}</div>` : ''}</div>`;
}
function hdCommsCards(ticket) {
  return `${hdCallCard(ticket)}${hdIntakeCard(ticket)}${hdHoldCard(ticket)}${hdEvidenceCards(ticket)}${hdExplainCard(ticket)}${hdHandoffCard(ticket)}${hdTeamMessagesCard(ticket)}`;
}
// The tick (every second): a caller message that arrived, or a hold that ran
// past its time, asks for a redraw. The first look only notes what is shown.
const hdCommsSeen = {};
function hdCommsTick(now = hdNowMs()) {
  if (HD_PROVE || !hdState || !Array.isArray(hdState.tickets)) return false;
  let changed = false;
  hdState.tickets.forEach(ticket => {
    const config = hdConsole(ticket);
    if (config.hold && hdHoldCheckOver(ticket, now)) changed = true;
    // Only the open ticket's call, once it has started, asks for a redraw.
    if (!config.conversation || ticket.id !== hdState.selectedTicketId) return;
    const call = hdCall(ticket, now, false);
    if (!call || typeof call.startedAt !== 'number') return;
    const key = `${call.stage}:${hdCallArrived(ticket, now)}`;
    if (hdCommsSeen[ticket.id] !== undefined && hdCommsSeen[ticket.id] !== key) changed = true;
    hdCommsSeen[ticket.id] = key;
  });
  return changed;
}
function hdHoldTimerRefresh(now = hdNowMs()) {
  const element = typeof document !== 'undefined' && document.getElementById ? document.getElementById('hd-hold-timer') : null;
  const ticket = element && hdState ? hdCurrentTicket() : null;
  if (element && ticket && hdHold(ticket)) element.textContent = hdHoldTimerText(ticket, now);
}

function hdDirectoryTable(users) {
  // The details KB-0024's caller check uses: the phone number on file and the
  // employee ID. Practice and Prove alike.
  return `<div class="table-wrap"><table><thead><tr><th>User</th><th>Employee ID</th><th>Department</th><th>Phone</th><th>Account</th><th>MFA</th><th>OU</th><th></th></tr></thead><tbody>${users.map(user=>`<tr><td><strong>${hdEsc(user.name)}</strong><small>${hdEsc(user.email)}</small></td><td>${hdEsc(user.employeeId || '')}</td><td>${hdEsc(user.department)}</td><td>${hdEsc(user.phone || '')}</td><td>${user.enabled?hdBadge(user.locked?'Locked':'Enabled',user.locked?'bad':'ok'):hdBadge('Disabled','bad')}</td><td>${hdBadge(user.mfa,user.mfa==='Registered'?'ok':'warn')}</td><td><code>${hdEsc(user.ou)}</code></td><td><button class="btn btn-sm btn-secondary" onclick="hdOpenUser('${user.id}')">Open</button></td></tr>`).join('')}</tbody></table></div>`;
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
  // A console ticket's account: Unlock waits for a passing verification.
  if (action === 'unlock') {
    const blocked = hdConsoleUnlockBlock(user.id);
    if (blocked) { toast(blocked); return; }
    const owner = hdState.tickets.find(ticket => (hdConsole(ticket).account || {}).userId === user.id);
    if (owner) { hdConsoleUnlock(owner.id, 'Active Directory'); return; }
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
    ${hdState.adTab==='computers' && hdAdComputerLookup() ? hdAdComputersWithPane() : ''}
    ${hdState.adTab==='computers' && !hdAdComputerLookup()?`<div class="card"><div class="table-wrap"><table><thead><tr><th>Computer</th><th>User</th><th>OU</th><th>Trust</th><th>BitLocker</th><th>Health</th></tr></thead><tbody>${hdComputers().map(c=>{const x=hdComputerByName(c.name);return `<tr><td><strong>${hdEsc(x.name)}</strong><small>${hdEsc(x.ip)}</small></td><td>${hdEsc(x.user)}</td><td><code>${hdEsc(x.ou)}</code></td><td>${hdBadge(x.trust,x.trust==='Healthy'?'ok':'bad')}</td><td>${hdBadge(x.bitlocker,x.bitlocker==='Protected'?'ok':'warn')}</td><td>${hdEsc(x.health)}</td></tr>`}).join('')}</tbody></table></div></div>`:''}`;
};

function hdSelectComputer(name, route) { hdState.selectedComputer=name; hdProveOpened(`computer:${name}`, `Endpoint · ${name}`); hdSave(); if(route) navigate(route); else render(); }
function hdEndpointCards() { return hdComputers().map(base=>{const c=hdComputerByName(base.name);return `<button class="hd-device-card ${hdState.selectedComputer===c.name?'active':''}" onclick="hdSelectComputer('${c.name}')"><strong>${hdEsc(c.name)}</strong><span>${hdEsc(c.user)}</span><small>${hdEsc(c.health)} · ${hdEsc(c.lastSeen)}</small></button>`}).join(''); }
VIEWS['helpdesk/windows'] = () => { const c=hdComputerByName(hdState.selectedComputer)||hdComputerByName('NS-LT-0042'); return `${hdPageHeader('Windows Desktop', 'Inspect a managed Windows 11 endpoint before choosing a repair.')}<div class="hd-endpoint-layout"><aside class="card"><div class="card-header"><strong>Endpoints</strong></div><div class="hd-device-list">${hdEndpointCards()}</div></aside><div class="hd-windows-screen"><div class="hd-window-bar"><span>${hdEsc(c.name)} · Remote session</span><span>— □ ×</span></div><div class="hd-window-body"><div class="hd-desktop-hero"><strong>Windows 11 Enterprise</strong><span>${hdEsc(c.os)}</span></div>${hdWinDesktopNotices(c.name)}<div class="hd-field-grid"><div><span>Signed-in user</span><strong>${hdEsc(c.user)}</strong></div><div><span>IPv4</span><strong>${hdEsc(c.ip)}</strong></div><div><span>Domain trust</span><strong>${hdEsc(c.trust)}</strong></div><div><span>BitLocker</span><strong>${hdEsc(c.bitlocker)}</strong></div><div><span>OU</span><strong>${hdEsc(c.ou)}</strong></div><div><span>Health</span><strong>${hdEsc(c.health)}</strong></div>${c.uptimeDays ? `<div><span>Uptime</span><strong>${hdEsc(c.uptimeDays)} days</strong></div>` : c.uptimeDays === 0 ? '<div><span>Uptime</span><strong>Less than a day</strong></div>' : ''}</div><div class="hd-tool-grid"><button onclick="navigate('#/helpdesk/event-viewer')">📋 Event Viewer</button><button onclick="navigate('#/helpdesk/powershell')">&gt;_ PowerShell</button><button onclick="navigate('#/helpdesk/active-directory')">🗂 Directory</button><button onclick="navigate('#/helpdesk/remote-support')">🖥 Remote Support</button>${hdSettingsPrinterPaths(c.name).length || hdPrintQueues(hdFeatureMachine(c.name)) || (hdProveAllTools() && hdFeatureMachine(c.name)) ? `<button onclick="navigate('#/helpdesk/settings-printers')">⚙ Settings › Printers &amp; scanners</button>` : ''}${hdFeatureToolButtons(c.name)}${hdWinToolButtons(c.name)}</div>${hdWinRestartBar(c.name)}</div></div></div>`; };

/* ---------- Settings › Printers & scanners ----------
 * The approved way for a standard user to add a published printer: Add
 * device lists the printers this laptop's fixture offers that the signed-in
 * user may use, and adds one with no admin rights. Only a laptop with such a
 * list shows the button.
 * - Prove It: the list is the Prove shift's settingsPrinters, and adding one
 *   is recorded for the instructor (action_taken), exactly as before.
 * - Practice: a ticket turns it on for one laptop with
 *   console.settingsPrinters: { computer, printers:[path], action }. Adding a
 *   printer there records the ticket's named action (so a chat reply with
 *   afterAction can wait for it, and feedback can check it). Never a Prove
 *   event. */
function hdSettingsPracticeTicket(name) {
  if (HD_PROVE || !hdState || !Array.isArray(hdState.tickets)) return null;
  return hdState.tickets.find(ticket => { const config = hdConsole(ticket).settingsPrinters; return !!(config && config.computer === name); }) || null;
}
function hdSettingsPrinterPaths(name) {
  if (!HD_PROVE) {
    const ticket = hdSettingsPracticeTicket(name);
    const printers = ticket && hdConsole(ticket).settingsPrinters.printers;
    return Array.isArray(printers) ? printers : [];
  }
  const lists = HD_PROVE.shift.settingsPrinters || {};
  return Array.isArray(lists[name]) ? lists[name] : [];
}
function hdSettingsPracticeAction(computerName, printer) {
  const ticket = hdSettingsPracticeTicket(computerName); if (!ticket) return;
  const config = hdConsole(ticket).settingsPrinters;
  const state = hdConsoleState(ticket);
  if (config.action && !state.actions.some(entry => entry.id === config.action)) state.actions.push({ id:config.action, time:hdConsoleTime(ticket) });
  hdHistory(ticket, `On ${computerName}: added ${printer.name} from Settings › Printers & scanners › Add device.`);
  hdPracticeEvent('action_taken', { ticket:ticket.id, action:config.action || 'settings-add-printer', computer:computerName, printer:printer.name });
}
function hdSettingsPrinterChoices(computer) {
  const user = hdSessionUser(computer);
  return hdSettingsPrinterPaths(computer.name).map(hdPublishedPrinter).filter(printer => printer && user && user.groups.includes(printer.group));
}
function hdSettingsScan() {
  hdState.settingsScan = true;
  hdSave(); render();
}
function hdSettingsAddPrinter(computerName, path) {
  const computer = hdComputerByName(computerName);
  const machine = computer && hdMachine(computer.name);
  if (!computer || !machine || !Array.isArray(machine.printers) || hdProveLocked()) return;
  const printer = hdSettingsPrinterChoices(computer).find(item => item.path === path);
  if (!printer) return;
  if (!machine.printers.includes(printer.path)) {
    machine.printers.push(printer.path);
    hdProveEvent('action_taken', { label:`Added ${printer.name} from Settings › Printers & scanners › Add device`, computer:computer.name });
    hdProveEdited();
    if (!HD_PROVE) hdSettingsPracticeAction(computer.name, printer);
  }
  toast(`${printer.name} added. No administrator rights were needed.`);
  hdRerender();
}
VIEWS['helpdesk/settings-printers'] = () => {
  const c = hdComputerByName(hdState.selectedComputer) || hdComputers()[0];
  const machine = hdMachine(c.name);
  const installed = machine && Array.isArray(machine.printers) ? machine.printers : ['Microsoft Print to PDF'];
  const found = hdSettingsPrinterChoices(c).filter(printer => !installed.includes(printer.path));
  const locked = hdProveLocked();
  const scan = !hdState.settingsScan ? '' : found.length
    ? `<div class="hd-note-list" data-hd-settings-found>${found.map(printer => `<div><strong>${hdEsc(printer.name)}</strong><small class="muted"> ${hdEsc(printer.location)} · ${hdEsc(printer.path)}</small> <div style="margin-top:8px"><button type="button" class="btn btn-secondary btn-sm" ${locked ? 'disabled' : ''} onclick="hdSettingsAddPrinter('${hdEsc(c.name)}','${hdEsc(printer.path.replace(/\\/g, '\\\\'))}')">Add device</button></div></div>`).join('')}</div>`
    : '<p class="muted">No new printers or scanners found.</p>';
  const practiceTicket = hdSettingsPracticeTicket(c.name);
  const back = practiceTicket ? `<button class="btn btn-secondary" onclick="hdSelectTicket('${practiceTicket.id}')">← ${hdEsc(hdTicketLabel(practiceTicket))}</button>` : '';
  return `${hdPageHeader('Settings', `${hdEsc(c.name)} · Bluetooth & devices › Printers & scanners`, `<button class="btn btn-secondary" onclick="navigate('#/helpdesk/windows')">← Windows Desktop</button>${back}`)}
    <div class="hd-settings-view">
    <div class="card"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Add a printer or scanner</strong><button type="button" class="btn btn-primary btn-sm" ${locked ? 'disabled' : ''} onclick="hdSettingsScan()">Add device</button></div><div class="card-body">${scan || '<p class="muted">Press Add device to look for printers you can add.</p>'}</div></div>
    <div class="card"><div class="card-header"><strong>Printers &amp; scanners on ${hdEsc(c.name)}</strong></div><div class="card-body"><ul class="hd-list" data-hd-settings-installed>${installed.map(name => `<li>${hdEsc(name)}</li>`).join('')}</ul></div></div>
    ${hdSettingsQueueCards(c)}</div>`;
};
window.hdSettingsScan=hdSettingsScan; window.hdSettingsAddPrinter=hdSettingsAddPrinter;

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
VIEWS['helpdesk/event-viewer'] = () => { hdM01Tick(); const logs = hdWinEventComputer(); if (logs) return hdWinEventView(logs); const rows = hdFilteredEvents(); return `${hdPageHeader('Event Viewer', 'Filter event evidence by endpoint, server, severity, source, and event ID.')}${hdWinEventPicker('')}<div class="callout info">An event ID is evidence, not automatically the root cause. Correlate time, scope, recent change, and system state.</div>${hdEventFilterBar(rows.length)}<div class="card"><div class="table-wrap"><table><thead><tr><th>Level</th><th>Time</th><th>Source</th><th>Event ID</th><th>Computer</th><th>Message</th></tr></thead><tbody>${rows.map(e=>`<tr><td>${hdBadge(e.level,e.level==='Error'?'bad':e.level==='Warning'?'warn':'ok')}</td><td>${e.time}</td><td>${hdEsc(e.source)}</td><td>${e.id}</td><td>${hdEsc(e.computer)}</td><td>${hdEsc(e.message)}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">No events match this filter.</td></tr>'}</tbody></table></div></div>`; };

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
    // A printer with machine state (printQueues) shows its own driver.
    const local = hdPrintQueues(machine) && hdPrintQueues(machine)[name];
    if (local) return `${name.padEnd(30)} ${''.padEnd(12)} Local      ${local.driver || ''}`;
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

/* ---------- Machine-state console features (added for Module 4, key its-02) ----------
 * Off unless a computer's machine state has these keys. In Practice a ticket
 * gives them with console.machines: { '<computer>': {...} } (seeded when the
 * shift or set is built, hdSeedTicketMachines); a Prove shift gives them in
 * its own `machines`. A machine no ticket in this shift names keeps today's
 * behavior, even if its keys were left over from another set.
 *   computer: { ip, health }          shown for this computer in this shift
 *   spooler: 'Running' | 'Stopped'    Get-Service / Stop-Service / Start-Service Spooler
 *   printQueues: { '<printer>': { port, driver, drivers:[], outsideDriver?,
 *       media, mediaSizes:[], offline, paused,
 *       jobs:[{ id, document, pages, owner, status, stuck? }], printed:[] } }
 *     status 'Error' blocks the jobs behind it; a stuck job stays 'Deleting'
 *     when cancelled and is cleared only while the spooler is stopped;
 *     Start-Service re-sends every job still queued.
 *   ports: [{ name, type:'Standard TCP/IP' | 'WSD', address?, works? }]
 *   driverCatalog: [driver names]     Add a printer by IP, Printer properties
 *   reachable: { '<address>': [open TCP ports] }   ping, Test-NetConnection
 *   devices: [{ id, category, name, status:'OK' | <code>, problem?,
 *       driver:{ provider, date, version }, previous?, update?, camera? }]
 *   dock: { name, power, docked, ethernet?, peripherals:[], monitors:[{ id,
 *       name, cable, input, inputs:[], needsDetect? }] }, projection, detected
 * A ticket's console.vdi: { pools:[{ name, sessions:[{ id, user, state,
 * hours }] }], tier2Line? } turns on the Virtual Desktops screen.
 * Each change is an action_taken event (Practice log and Prove record) and,
 * in Practice, an entry in the ticket's consoleState.actions and history. */
const HD_MACHINE_SCREENS = ['print-queue', 'printer-properties', 'device-manager', 'camera', 'dock', 'settings-network',
  // Windows client screens (Module 5, key its-03; see "Windows client tools" below).
  'pc-task-manager', 'settings-storage', 'settings-update', 'settings-apps', 'software-catalog', 'reliability', 'settings-recovery',
  // Software install screens (Module 6, key its-07).
  'default-apps', 'company-portal',
  // Security, browser and OneDrive screens (Module 6, key its-07, console B).
  'windows-security', 'browser-extensions', 'onedrive'];
function hdOwn(object, key) { return !!object && typeof object === 'object' && Object.prototype.hasOwnProperty.call(object, key); }
function hdTicketMachineSpecs(ticket) {
  if (HD_PROVE || !ticket) return null;
  const template = HD_TICKET_TEMPLATES.find(item => item.id === ticket.id);
  const machines = template && template.console && template.console.machines;
  return machines && typeof machines === 'object' && !Array.isArray(machines) ? machines : null;
}
// The Practice ticket in this shift that names this computer, or null.
function hdMachineTicket(name) {
  if (HD_PROVE || !hdState || !Array.isArray(hdState.tickets)) return null;
  const naming = hdState.tickets.filter(ticket => hdOwn(hdTicketMachineSpecs(ticket), name));
  // Two tickets naming one computer: the one whose state was seeded owns it.
  const seededBy = (hdMachine(name) || {}).seededBy;
  return naming.find(ticket => ticket.id === seededBy) || naming[0] || null;
}
// The machine state the new features read, or null (features off).
function hdFeatureMachine(name) {
  const machine = hdMachine(name);
  if (!machine || typeof machine !== 'object') return null;
  if (HD_PROVE) return hdOwn(HD_PROVE.shift.machines, name) ? machine : null;
  return hdMachineTicket(name) ? machine : null;
}
function hdPrintQueues(machine) { return machine && machine.printQueues && typeof machine.printQueues === 'object' ? machine.printQueues : null; }
function hdQueueName(machine, typed) {
  const queues = hdPrintQueues(machine); if (!queues) return '';
  const wanted = String(typed || '').replace(/^["']|["']$/g, '').toLowerCase();
  return Object.keys(queues).find(name => name.toLowerCase() === wanted) || '';
}
// Seeds each ticket's console.machines (and console.vdi) into a Practice
// shift, merged over the Practice fixture of the same name. Only the tickets
// in state.tickets count; a later ticket naming the same computer wins.
function hdSeedTicketMachines(state) {
  if (HD_PROVE || !state || !Array.isArray(state.tickets)) return state;
  state.machines = state.machines || {};
  state.tickets.forEach(ticket => {
    const specs = hdTicketMachineSpecs(ticket);
    if (specs) Object.keys(specs).forEach(name => {
      const spec = hdClone(specs[name]) || {};
      const base = state.machines[name] || {};
      const queues = spec.printQueues && typeof spec.printQueues === 'object' ? spec.printQueues : null;
      if (queues) Object.values(queues).forEach(queue => {
        queue.jobs = Array.isArray(queue.jobs) ? queue.jobs : [];
        queue.printed = Array.isArray(queue.printed) ? queue.printed : [];
      });
      const printers = [...(Array.isArray(base.printers) ? base.printers : []), ...(Array.isArray(spec.printers) ? spec.printers : [])];
      Object.keys(queues || {}).forEach(printer => printers.push(printer));
      state.machines[name] = {
        localAdministrators:[], pendingPolicyPrinters:[], ...base, ...spec,
        printers:[...new Set(printers)], seededBy:ticket.id,
      };
    });
    const template = HD_TICKET_TEMPLATES.find(item => item.id === ticket.id);
    const vdi = template && template.console && template.console.vdi;
    if (vdi && Array.isArray(vdi.pools)) {
      state.vdi = state.vdi || {};
      vdi.pools.forEach(pool => { if (pool && pool.name) state.vdi[pool.name] = { ticketId:ticket.id, sessions:hdClone(pool.sessions || []) }; });
    }
  });
  return state;
}
// A ticket-shown address and health for this computer (machine.computer).
function hdMachineComputerOverride(name) {
  const machine = hdFeatureMachine(name);
  const shown = machine && machine.computer && typeof machine.computer === 'object' ? machine.computer : {};
  // A machine's own uptime (a Restart sets it to 0) wins over the record's.
  return machine && typeof machine.uptimeDays === 'number' ? { ...shown, uptimeDays:machine.uptimeDays } : shown;
}
function hdJsArg(value) { return hdEsc(String(value == null ? '' : value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")); }

// Records one change on a computer: Practice log, Prove record and, in
// Practice, the ticket's actions (coach checks and feedback read them).
function hdMachineAction(computerName, id, label, extra) {
  const ticket = hdMachineTicket(computerName);
  if (ticket) {
    const state = hdConsoleState(ticket);
    state.actions.push({ id, time:hdConsoleTime(ticket), computer:computerName, ...(extra || {}) });
    // actionsDropped: how many old actions the cap removed, so a screen's
    // seenAt stamp (hdWinSeen) still compares with the right action.
    if (state.actions.length > 200) state.actionsDropped = (Number(state.actionsDropped) || 0) + state.actions.splice(0, state.actions.length - 200).length;
    hdHistory(ticket, `On ${computerName}: ${label}.`);
  }
  // Module 6 (console B): a Practice ticket's criticalActions:[{ action, text }]
  // records that machine action as a critical error, whichever route took it
  // (a screen or a typed line). A Prove ticket has no console, so its key
  // decides instead.
  const rules = ticket ? hdConsole(ticket).criticalActions : null;
  if (Array.isArray(rules)) rules.filter(rule => rule && rule.action === id).forEach(rule => hdConsoleCritical(ticket, `machine:${id}`, rule.text || label));
  hdPracticeEvent('action_taken', { ticket:ticket ? ticket.id : '', action:id, computer:computerName, label, ...(extra || {}) });
  hdProveEvent('action_taken', { label, computer:computerName, value:id });
}
function hdMachinePort(machine, name) { return (Array.isArray(machine.ports) ? machine.ports : []).find(port => port && port.name === name) || null; }
function hdOpenPorts(machine, address) {
  const reachable = machine && machine.reachable && typeof machine.reachable === 'object' ? machine.reachable : {};
  const key = Object.keys(reachable).find(item => item.toLowerCase() === String(address || '').toLowerCase());
  return key ? (Array.isArray(reachable[key]) ? reachable[key] : []) : null;
}
function hdPortWorks(machine, portName) {
  const port = hdMachinePort(machine, portName);
  if (!port) return true;
  if (typeof port.works === 'boolean') return port.works;
  if (port.type === 'Standard TCP/IP' && port.address && machine.reachable) { const open = hdOpenPorts(machine, port.address); return !!(open && open.includes(9100)); }
  return true;
}
function hdQueueStatus(machine, name) {
  const queue = hdPrintQueues(machine)[name];
  if (machine.spooler === 'Stopped') return 'Spooler stopped';
  if (queue.offline || !hdPortWorks(machine, queue.port)) return 'Offline';
  if (queue.paused) return 'Paused';
  if (queue.jobs[0] && ['Error', 'Deleting'].includes(queue.jobs[0].status)) return 'Error';
  return queue.jobs.length ? 'Printing' : 'Ready';
}
// Prints what can print: in order, until a job in Error or Deleting.
function hdQueueFlow(machine, name) {
  const queue = hdPrintQueues(machine)[name];
  if (machine.spooler === 'Stopped' || queue.offline || queue.paused || !hdPortWorks(machine, queue.port)) return 0;
  let printed = 0;
  while (queue.jobs.length) {
    const job = queue.jobs[0];
    if (['Error', 'Deleting'].includes(job.status)) break;
    if (job.stuck) { job.status = 'Error'; break; }
    queue.jobs.shift();
    queue.printed.push({ document:job.document, pages:job.pages || 1, owner:job.owner || '' });
    printed += 1;
  }
  if (queue.printed.length > 60) queue.printed.splice(0, queue.printed.length - 60);
  return printed;
}
function hdMachineSettle(machine) {
  const queues = hdPrintQueues(machine); if (!queues) return 0;
  return Object.keys(queues).reduce((sum, name) => sum + hdQueueFlow(machine, name), 0);
}
function hdQueuedJobs(machine) { const queues = hdPrintQueues(machine) || {}; return Object.values(queues).reduce((sum, queue) => sum + queue.jobs.length, 0); }

// ping and Test-NetConnection answer from machine.reachable.
function hdPingText(target, open) {
  if (open === null && !/^\d{1,3}(\.\d{1,3}){3}$/.test(target)) return `Ping request could not find host ${target}. Please check the name and try again.`;
  const ok = open !== null;
  const lines = [`Pinging ${target} with 32 bytes of data:`];
  for (let i = 0; i < 4; i += 1) lines.push(ok ? `Reply from ${target}: bytes=32 time<1ms TTL=128` : 'Request timed out.');
  lines.push('', `Ping statistics for ${target}:`, `    Packets: Sent = 4, Received = ${ok ? 4 : 0}, Lost = ${ok ? 0 : 4} (${ok ? 0 : 100}% loss),`);
  if (ok) lines.push('Approximate round trip times in milli-seconds:', '    Minimum = 0ms, Maximum = 1ms, Average = 0ms');
  return lines.join('\n');
}
// interfaceAlias: the machine's own (default Ethernet; a laptop off its dock
// is on Wi-Fi).
function hdTestNetText(target, port, open, source, alias) {
  const rows = [['ComputerName', target], ['RemoteAddress', target]];
  if (port) rows.push(['RemotePort', port]);
  rows.push(['InterfaceAlias', alias || 'Ethernet'], ['SourceAddress', source || '']);
  const tcp = !!(open !== null && open.includes(Number(port)));
  if (port) rows.push(['TcpTestSucceeded', tcp ? 'True' : 'False']);
  else rows.push(['PingSucceeded', open !== null ? 'True' : 'False'], ['PingReplyDetails (RTT)', open !== null ? '0 ms' : '0 ms']);
  const width = Math.max(...rows.map(([key]) => key.length), 16);
  const text = rows.map(([key, value]) => `${key.padEnd(width)} : ${value}`).join('\n');
  const warnings = [];
  if (port && !tcp) warnings.push(`WARNING: TCP connect to (${target} : ${port}) failed`);
  if (open === null) warnings.push(`WARNING: Ping to ${target} failed with status: TimedOut`);
  return [...warnings, text].join('\n');
}
function hdFormatList(pairs) {
  const width = Math.max(...pairs.map(([key]) => key.length));
  return pairs.map(([key, value]) => `${key.padEnd(width)} : ${value}`).join('\n');
}
// The six Module 4 commands, on a machine that has the features; null
// otherwise, so the older answers stay as they were.
function hdFeatureCommand(command, normalized, computer) {
  const machine = hdFeatureMachine(computer.name); if (!machine) return null;
  const windows = hdWinCommand(command, normalized, machine, computer.name);
  if (windows !== null) return windows;
  const queues = hdPrintQueues(machine);
  const trimmed = command.trim();
  if (queues && /^get-service (-name )?["']?spooler["']?$/.test(normalized)) {
    return `Status   Name               DisplayName\n------   ----               -----------\n${(machine.spooler || 'Running').padEnd(8)} Spooler            Print Spooler`;
  }
  const service = /^(stop|start)-service (-name )?["']?spooler["']?( -force)?$/.exec(normalized);
  if (queues && service) {
    if (service[1] === 'stop') {
      if (machine.spooler !== 'Stopped') { machine.spooler = 'Stopped'; hdMachineAction(computer.name, 'spooler-stop', 'stopped the Print Spooler'); }
      return '';
    }
    if (machine.spooler === 'Stopped') {
      machine.spooler = 'Running';
      // Every job still queued is sent again; a stuck job is stuck again.
      Object.values(queues).forEach(queue => queue.jobs.forEach(job => { if (job.stuck) job.status = 'Error'; else if (['Error', 'Deleting'].includes(job.status)) job.status = 'Spooling'; }));
      const queued = hdQueuedJobs(machine);
      const printed = hdMachineSettle(machine);
      hdMachineAction(computer.name, 'spooler-start', `started the Print Spooler with ${queued} job${queued === 1 ? '' : 's'} queued`, { queued, printed });
    }
    return '';
  }
  if (queues && /^get-printjob\b/.test(normalized)) {
    const typed = hdParam(command, 'printername') || (/^get-printjob\s+("[^"]*"|'[^']*'|[^\s-]\S*)/i.exec(trimmed) || [])[1] || '';
    if (machine.spooler === 'Stopped') return 'Get-PrintJob : The spooler service is not reachable. Ensure the spooler service is running.';
    const name = hdQueueName(machine, typed);
    if (!name) return `Get-PrintJob : The specified printer was not found.${typed ? '' : ' Add -PrinterName <name>.'}`;
    const jobs = queues[name].jobs;
    if (!jobs.length) return '';
    return ['Id    ComputerName   PrinterName      DocumentName                 TotalPages JobStatus', '--    ------------   -----------      ------------                 ---------- ---------',
      ...jobs.map(job => `${String(job.id).padEnd(5)} ${computer.name.padEnd(14)} ${name.padEnd(16)} ${String(job.document).padEnd(28)} ${String(job.pages || 1).padEnd(10)} ${job.status}`)].join('\n');
  }
  const printer = /^get-printer\s+(?:-name\s+)?("[^"]*"|'[^']*'|[^\s|]+)\s*(?:\|\s*(\S+)\s*(.*))?$/i.exec(trimmed);
  if (queues && printer) {
    if (machine.spooler === 'Stopped') return 'Get-Printer : The spooler service is not reachable. Ensure the spooler service is running.';
    const name = hdQueueName(machine, printer[1]);
    if (!name) return `Get-Printer : No printer found with name '${printer[1].replace(/^["']|["']$/g, '')}'.`;
    const queue = queues[name];
    const all = [['Name', name], ['ComputerName', computer.name], ['Type', 'Local'], ['DriverName', queue.driver || ''], ['PortName', queue.port || ''], ['PrinterStatus', ({ Ready:'Normal' })[hdQueueStatus(machine, name)] || hdQueueStatus(machine, name)]];
    if (printer[2] && /^(format-list|fl)$/i.test(printer[2])) {
      const wanted = printer[3].split(/[\s,]+/).filter(Boolean).map(item => item.toLowerCase());
      const shown = wanted.length && !wanted.includes('*') ? wanted.map(item => all.find(([key]) => key.toLowerCase() === item)).filter(Boolean) : all;
      return hdFormatList(shown.length ? shown : all);
    }
    return `Name                           ComputerName Type       DriverName\n${name.padEnd(30)} ${computer.name.padEnd(12)} Local      ${queue.driver || ''}`;
  }
  if (machine.reachable) {
    const ping = /^ping(?:\s+-[nt](?:\s+\d+)?)?\s+([^\s-]\S*)$/i.exec(trimmed);
    if (ping) return hdPingText(ping[1], hdOpenPorts(machine, ping[1]));
    if (/^test-netconnection\b/.test(normalized)) {
      const target = hdParam(command, 'computername') || (/^test-netconnection\s+("[^"]*"|'[^']*'|[^\s-]\S*)/i.exec(trimmed) || [])[1] || '';
      if (!target) return 'Test-NetConnection : Add the address to test, for example Test-NetConnection <address> -Port <port>.';
      const port = hdParam(command, 'port');
      if (port && !/^\d{1,5}$/.test(port)) return `Test-NetConnection : Cannot validate argument on parameter 'Port'.`;
      return hdTestNetText(target.replace(/^["']|["']$/g, ''), port, hdOpenPorts(machine, target.replace(/^["']|["']$/g, '')), hdComputerByName(computer.name).ip,
        machine.interfaceAlias || (machine.dock && !hdDockLive(machine) ? 'Wi-Fi' : 'Ethernet'));
    }
  }
  return null;
}
// Get-Help's extra lines on a machine with the features.
// Never in a Prove It: on only the computers a case is about, the list would
// point at the case. The commands still run there.
function hdFeatureHelp(computer) {
  const machine = !HD_PROVE && computer && hdFeatureMachine(computer.name); if (!machine) return '';
  const lines = [];
  if (hdPrintQueues(machine)) lines.push('Printing: Get-Service Spooler, Stop-Service Spooler, Start-Service Spooler, Get-PrintJob -PrinterName <name>, Get-Printer -Name <name> | Format-List Name, PortName, DriverName');
  if (machine.reachable) lines.push('Network: ping <address>, Test-NetConnection <address> -Port <port>');
  if (hdWinHelp(machine)) lines.push(hdWinHelp(machine));
  hdWinTypedHelp(machine).forEach(line => lines.push(line));
  return lines.length ? `\n${lines.join('\n')}` : '';
}

/* The screens. Each opens from the Windows Desktop tool grid (or the
 * ticket's computer card) on the selected computer; opened directly on a
 * computer without the feature, it says so. */
function hdMachineView() { return hdState.machineView && typeof hdState.machineView === 'object' ? hdState.machineView : {}; }
function hdOpenMachineScreen(computerName, screen, extra) {
  if (!HD_MACHINE_SCREENS.includes(screen) || !hdFeatureMachine(computerName)) return;
  hdState.selectedComputer = computerName;
  hdState.machineView = { computer:computerName, ...(extra || {}) };
  const item = extra && (extra.printer || extra.device) ? `:${extra.printer || extra.device}` : '';
  if (hdOwn(HD_WIN_SCREENS, screen)) hdWinOpened(computerName, screen, hdState.machineView.tab);
  else hdProveOpened(`${screen}:${computerName}${item}`, `${({ 'print-queue':'Print queue', 'printer-properties':'Printer properties', 'device-manager':'Device Manager', camera:'Camera', dock:'Dock and displays', 'settings-network':'Settings › Network & internet' })[screen]} · ${computerName}${item ? ` · ${item.slice(1)}` : ''}`);
  if (screen === 'camera') {
    const machine = hdFeatureMachine(computerName);
    const camera = (machine.devices || []).find(device => device && device.camera);
    if (camera && !hdProveLocked()) hdMachineAction(computerName, 'camera-checked', `opened the Camera app (${camera.status === 'OK' ? 'video shown' : 'no video'})`, { working:camera.status === 'OK' });
  }
  hdSave();
  navigate(`#/helpdesk/${screen}`);
}
function hdMachineBack(computer) {
  const ticket = hdMachineTicket(computer.name);
  return `<button class="btn btn-secondary" onclick="navigate('#/helpdesk/windows')">← ${hdEsc(computer.name)}</button>${ticket ? `<button class="btn btn-secondary" onclick="hdSelectTicket('${hdJsArg(ticket.id)}')">← ${hdEsc(hdTicketLabel(ticket))}</button>` : ''}`;
}
// A Prove shift with machineTools: true shows every tool on every one of
// its computers, so which buttons appear never points at the case.
function hdProveAllTools() { return !!(HD_PROVE && HD_PROVE.shift.machineTools === true); }
function hdMachineMissing(title) {
  if (hdProveAllTools()) return `${hdPageHeader(title, 'Nothing to show on this computer.', `<button class="btn btn-secondary" onclick="navigate('#/helpdesk/windows')">← Windows Desktop</button>`)}`;
  return `${hdPageHeader(title, 'Not available on this computer in this shift.', `<button class="btn btn-secondary" onclick="navigate('#/helpdesk/windows')">← Windows Desktop</button>`)}<div class="card"><div class="card-body"><p class="muted">Open a computer from a ticket to use this screen.</p></div></div>`;
}
// The view's computer and its machine, or null.
function hdViewMachine() {
  const computer = hdComputerByName(hdMachineView().computer || hdState.selectedComputer);
  const machine = computer && hdFeatureMachine(computer.name);
  return machine ? { computer, machine } : null;
}
// The tool grid's extra buttons for a computer with the features.
function hdFeatureToolButtons(name) {
  const machine = hdFeatureMachine(name); if (!machine) return '';
  const open = (screen, label) => `<button data-hd-tools="${screen}" onclick="hdOpenMachineScreen('${hdJsArg(name)}','${screen}')">${label}</button>`;
  const all = hdProveAllTools();
  const devices = all || (Array.isArray(machine.devices) && machine.devices.length);
  return [
    devices ? open('device-manager', '🧩 Device Manager') : '',
    all || (devices && machine.devices.some(device => device && device.camera)) ? open('camera', '📷 Camera') : '',
    all || machine.dock ? open('dock', '🖥 Dock &amp; displays') : '',
    all || machine.dock ? open('settings-network', '⚙ Settings › Network &amp; internet') : '',
  ].join('');
}
// A shared printer's machine action: guard, change, settle, record, redraw.
function hdMachineChange(computerName, change) {
  if (hdProveLocked()) return;
  const machine = hdFeatureMachine(computerName); if (!machine) return;
  const result = change(machine);
  if (result === false) { hdSave(); render(); return; }
  const printed = hdMachineSettle(machine);
  // Practice only: a Prove It shows the result on the screen, never in a toast.
  if (printed && !HD_PROVE && typeof toast === 'function') toast(`${printed} job${printed === 1 ? '' : 's'} printed.`);
  hdProveEdited();
  hdRerender();
}

// Print queue window.
function hdQueueToggle(computerName, printer, flag) {
  hdMachineChange(computerName, machine => {
    const queue = hdPrintQueues(machine)[printer]; if (!queue || !['offline', 'paused'].includes(flag)) return false;
    queue[flag] = !queue[flag];
    const label = flag === 'offline' ? `${queue.offline ? 'ticked' : 'unticked'} Use Printer Offline on ${printer}` : `${queue.paused ? 'ticked' : 'unticked'} Pause Printing on ${printer}`;
    hdMachineAction(computerName, flag === 'offline' ? (queue.offline ? 'printer-offline-on' : 'printer-offline-off') : (queue.paused ? 'printer-pause' : 'printer-resume'), label, { printer });
  });
}
function hdQueueCancel(computerName, printer, jobId) {
  hdMachineChange(computerName, machine => {
    const queue = hdPrintQueues(machine)[printer]; if (!queue || machine.spooler === 'Stopped') return false;
    const index = queue.jobs.findIndex(job => String(job.id) === String(jobId)); if (index < 0) return false;
    const job = queue.jobs[index];
    if (job.stuck) {
      job.status = 'Deleting';
      hdMachineAction(computerName, 'job-cancel', `cancelled ${job.document} on ${printer}; it stays Deleting`, { printer, document:job.document, stuck:true });
    } else {
      queue.jobs.splice(index, 1);
      hdMachineAction(computerName, 'job-cancel', `cancelled ${job.document} on ${printer}`, { printer, document:job.document });
    }
  });
}
function hdQueueClearStuck(computerName, printer) {
  hdMachineChange(computerName, machine => {
    const queue = hdPrintQueues(machine)[printer]; if (!queue) return false;
    if (machine.spooler !== 'Stopped') { toast('Clear stuck job works only while the Print Spooler is stopped.'); return false; }
    const before = queue.jobs.length;
    queue.jobs = queue.jobs.filter(job => job.status !== 'Deleting');
    if (queue.jobs.length === before) return false;
    hdMachineAction(computerName, 'job-clear-stuck', `cleared the stuck job from ${printer}`, { printer });
  });
}
function hdQueueTestPage(computerName, printer) {
  hdMachineChange(computerName, machine => {
    const queue = hdPrintQueues(machine)[printer]; if (!queue) return false;
    const next = 1 + queue.jobs.concat(queue.printed).reduce((max, job) => Math.max(max, Number(job.id) || 0), 0);
    if (machine.spooler === 'Stopped') return false;
    const computer = hdComputerByName(computerName);
    queue.jobs.push({ id:next, document:'Test Page', pages:1, owner:computer ? computer.user : '', status:'Spooling' });
    hdMachineAction(computerName, 'test-page', `printed a test page to ${printer}`, { printer });
  });
}
VIEWS['helpdesk/print-queue'] = () => {
  const found = hdViewMachine(); const name = found && hdPrintQueues(found.machine) ? hdQueueName(found.machine, hdMachineView().printer) : '';
  if (!name) return hdMachineMissing('Print queue');
  const { computer, machine } = found; const queue = machine.printQueues[name];
  const locked = hdProveLocked() ? 'disabled' : '';
  const status = hdQueueStatus(machine, name);
  const args = `'${hdJsArg(computer.name)}','${hdJsArg(name)}'`;
  const check = (on, text, flag) => `<button type="button" class="btn btn-secondary btn-sm" role="menuitemcheckbox" aria-checked="${on}" ${locked} onclick="hdQueueToggle(${args},'${flag}')">${on ? '☑' : '☐'} ${text}</button>`;
  const stuck = queue.jobs.some(job => job.status === 'Deleting');
  // With the spooler stopped the queue can't be changed, as in Windows.
  const stopped = machine.spooler === 'Stopped' ? 'disabled' : '';
  const rows = queue.jobs.map(job => `<tr data-hd-job="${hdEsc(job.id)}"><td>${hdEsc(job.document)}</td><td>${hdBadge(job.status, job.status === 'Error' || job.status === 'Deleting' ? 'bad' : 'warn')}</td><td>${hdEsc(job.owner || '')}</td><td>${hdEsc(job.pages || 1)}</td><td><button type="button" class="btn btn-ghost btn-sm" ${locked || stopped || (job.status === 'Deleting' ? 'disabled' : '')} onclick="hdQueueCancel(${args},'${hdJsArg(job.id)}')">Cancel</button></td></tr>`).join('');
  const printed = queue.printed.length ? `<ul class="hd-list">${queue.printed.slice(-8).map(job => `<li>${hdEsc(job.document)}</li>`).join('')}</ul>` : '<p class="muted">Nothing printed yet.</p>';
  return `${hdPageHeader(`${name} · Print queue`, `${computer.name} · ${status}`, hdMachineBack(computer))}
    <div data-hd-queue="${hdEsc(name)}" class="hd-settings-view">
    <div class="card"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Printer</strong><span class="muted">Status: ${hdEsc(status)}</span></div><div class="card-body"><div style="display:flex;flex-wrap:wrap;gap:8px" role="menu" aria-label="Printer menu">${check(queue.offline === true, 'Use Printer Offline', 'offline')}${check(queue.paused === true, 'Pause Printing', 'paused')}<button type="button" class="btn btn-secondary btn-sm" ${locked || stopped} onclick="hdQueueTestPage(${args})">Print test page</button><button type="button" class="btn btn-secondary btn-sm" onclick="hdOpenMachineScreen('${hdJsArg(computer.name)}','printer-properties',{printer:'${hdJsArg(name)}',tab:'ports'})">Printer properties</button></div></div></div>
    <div class="card"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Documents</strong><span class="muted">${queue.jobs.length} in the queue · Print Spooler ${hdEsc(machine.spooler || 'Running')}</span></div><div class="table-wrap"><table><thead><tr><th>Document</th><th>Status</th><th>Owner</th><th>Pages</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="5" class="muted">No documents waiting.</td></tr>'}</tbody></table></div><div class="card-body"><button type="button" class="btn btn-secondary btn-sm" ${locked || (stuck ? '' : 'disabled')} data-hd-clear-stuck="${stuck ? 'on' : 'off'}" onclick="hdQueueClearStuck(${args})">Clear stuck job</button> <span class="muted">Works only while the Print Spooler is stopped.</span></div></div>
    <div class="card"><div class="card-header"><strong>Printed from ${hdEsc(computer.name)}</strong></div><div class="card-body">${printed}</div></div>
    </div>`;
};

// Printer properties: Ports, Advanced (driver) and Printing preferences.
function hdPrinterSet(computerName, printer, field, value) {
  hdMachineChange(computerName, machine => {
    const queue = hdPrintQueues(machine)[printer]; if (!queue) return false;
    if (field === 'port') {
      if (!hdMachinePort(machine, value) && value !== queue.port) return false;
      if (queue.port === value) return false;
      queue.port = value;
      hdMachineAction(computerName, 'printer-port', `set ${printer} to port ${value}`, { printer, port:value });
    } else if (field === 'driver') {
      if (!hdPrinterDrivers(machine, queue).includes(value) || queue.driver === value) return false;
      queue.driver = value;
      hdMachineAction(computerName, 'printer-driver', `set ${printer} to driver ${value}`, { printer, driver:value });
    } else if (field === 'outside') {
      const outside = hdOutsideDriver(queue); if (!outside) return false;
      queue.driver = outside;
      hdMachineAction(computerName, 'printer-driver-outside', `installed ${outside} from the manufacturer's website on ${printer}`, { printer, driver:outside });
    } else if (field === 'media') {
      if (!(queue.mediaSizes || []).includes(value) || queue.media === value) return false;
      queue.media = value;
      hdMachineAction(computerName, 'printer-media', `set ${printer}'s paper size to ${value}`, { printer, media:value });
    } else return false;
  });
}
function hdPrinterDrivers(machine, queue) {
  return [...new Set([queue.driver, ...(Array.isArray(queue.drivers) ? queue.drivers : []), ...(Array.isArray(machine.driverCatalog) ? machine.driverCatalog : [])].filter(item => typeof item === 'string' && item))];
}
// The "driver from the manufacturer's website" choice shows only where the
// data offers it; a Prove shift gives every printer one (with machineTools),
// so the choice never points at the case.
function hdOutsideDriver(queue) { return typeof queue.outsideDriver === 'string' && queue.outsideDriver ? queue.outsideDriver : ''; }
function hdPrinterTab(tab) { hdState.machineView = { ...hdMachineView(), tab }; hdSave(); render(); }
VIEWS['helpdesk/printer-properties'] = () => {
  const found = hdViewMachine(); const name = found && hdPrintQueues(found.machine) ? hdQueueName(found.machine, hdMachineView().printer) : '';
  if (!name) return hdMachineMissing('Printer properties');
  const { computer, machine } = found; const queue = machine.printQueues[name];
  const tab = ['ports', 'advanced', 'preferences'].includes(hdMachineView().tab) ? hdMachineView().tab : 'ports';
  const locked = hdProveLocked() ? 'disabled' : '';
  const args = `'${hdJsArg(computer.name)}','${hdJsArg(name)}'`;
  const tabs = [['ports', 'Ports'], ['advanced', 'Advanced'], ['preferences', 'Printing preferences']].map(([id, label]) => `<button type="button" class="btn ${id === tab ? 'btn-primary' : 'btn-secondary'} btn-sm" role="tab" aria-selected="${id === tab}" onclick="hdPrinterTab('${id}')">${label}</button>`).join('');
  const choose = (field, value, current, text) => `<tr><td>${value === current ? '✓ ' : ''}${hdEsc(text || value)}</td><td>${value === current ? '<span class="muted">In use</span>' : `<button type="button" class="btn btn-secondary btn-sm" ${locked} onclick="hdPrinterSet(${args},'${field}','${hdJsArg(value)}')">Use this</button>`}</td></tr>`;
  let body = '';
  if (tab === 'ports') {
    const ports = Array.isArray(machine.ports) ? machine.ports.slice() : [];
    if (queue.port && !ports.some(port => port.name === queue.port)) ports.unshift({ name:queue.port, type:'' });
    body = `<div class="table-wrap"><table><thead><tr><th>Port</th><th>Description</th><th>Address</th><th></th></tr></thead><tbody>${ports.map(port => `<tr data-hd-port="${hdEsc(port.name)}"><td>${port.name === queue.port ? '✓ ' : ''}${hdEsc(port.name)}</td><td>${hdEsc(port.type ? `${port.type} Port` : '')}</td><td>${hdEsc(port.address || '')}</td><td>${port.name === queue.port ? '<span class="muted">In use</span>' : `<button type="button" class="btn btn-secondary btn-sm" ${locked} onclick="hdPrinterSet(${args},'port','${hdJsArg(port.name)}')">Use this port</button>`}</td></tr>`).join('')}</tbody></table></div>`;
  } else if (tab === 'advanced') {
    const outside = hdOutsideDriver(queue);
    body = `<p>Driver in use: <strong data-hd-driver>${hdEsc(queue.driver || '')}</strong></p><div class="table-wrap"><table><thead><tr><th>Driver</th><th></th></tr></thead><tbody>${hdPrinterDrivers(machine, queue).map(driver => choose('driver', driver, queue.driver)).join('')}</tbody></table></div>${outside && outside !== queue.driver ? `<div style="margin-top:8px"><button type="button" class="btn btn-secondary btn-sm" ${locked} data-hd-outside-driver onclick="hdPrinterSet(${args},'outside','')">Install a driver from the manufacturer's website</button></div>` : ''}`;
  } else {
    body = `<p>Paper size: <strong data-hd-media>${hdEsc(queue.media || '')}</strong></p><div class="table-wrap"><table><thead><tr><th>Paper size</th><th></th></tr></thead><tbody>${(queue.mediaSizes || []).map(size => choose('media', size, queue.media)).join('')}</tbody></table></div>`;
  }
  return `${hdPageHeader(`${name} · Printer properties`, computer.name, `${hdMachineBack(computer)}<button class="btn btn-secondary" onclick="hdOpenMachineScreen('${hdJsArg(computer.name)}','print-queue',{printer:'${hdJsArg(name)}'})">Print queue</button>`)}
    <div class="card" data-hd-props="${tab}"><div class="card-header" ${HD_CONSOLE_HEADER}><div style="display:flex;flex-wrap:wrap;gap:6px" role="tablist">${tabs}</div></div><div class="card-body">${body}</div></div>`;
};

// Settings › Printers & scanners: add a printer by its address.
function hdSettingsAddByIp(event, computerName) {
  if (event && event.preventDefault) event.preventDefault();
  const value = id => { const el = document.getElementById(id); return String(el ? el.value : '').trim(); };
  const address = value('hd-add-ip'); const name = value('hd-add-name'); const driver = value('hd-add-driver');
  if (!/^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/.test(address)) { toast('Type the printer\'s IPv4 address, for example 10.0.0.25.'); return; }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$/.test(name)) { toast('Type a printer name: letters, numbers, dots, dashes or underscores.'); return; }
  hdMachineChange(computerName, machine => {
    const queues = hdPrintQueues(machine); if (!queues) return false;
    if (hdQueueName(machine, name)) { toast(`${name} is already installed.`); return false; }
    const catalog = Array.isArray(machine.driverCatalog) && machine.driverCatalog.length ? machine.driverCatalog : ['Generic / Text Only'];
    const chosen = catalog.includes(driver) ? driver : catalog[0];
    const portName = `IP_${address}`;
    machine.ports = Array.isArray(machine.ports) ? machine.ports : [];
    if (!hdMachinePort(machine, portName)) machine.ports.push({ name:portName, type:'Standard TCP/IP', address });
    queues[name] = { port:portName, driver:chosen, drivers:[chosen], media:'Letter', mediaSizes:['Letter', 'A4'], offline:false, paused:false, jobs:[], printed:[] };
    if (!machine.printers.includes(name)) machine.printers.push(name);
    hdMachineAction(computerName, 'printer-added-ip', `added ${name} by address ${address} (Standard TCP/IP)`, { printer:name, address });
    toast(`${name} added on port ${portName}.`);
  });
}
function hdSettingsQueueCards(computer) {
  const machine = hdFeatureMachine(computer.name); const queues = hdPrintQueues(machine); if (!queues) return '';
  const catalog = Array.isArray(machine.driverCatalog) && machine.driverCatalog.length ? machine.driverCatalog : ['Generic / Text Only'];
  const locked = hdProveLocked() ? 'disabled' : '';
  const name = `'${hdJsArg(computer.name)}'`;
  const rows = Object.keys(queues).map(printer => `<li data-hd-settings-queue="${hdEsc(printer)}"><strong>${hdEsc(printer)}</strong> <span class="muted">${hdEsc(hdQueueStatus(machine, printer))}</span> <button type="button" class="btn btn-secondary btn-sm" onclick="hdOpenMachineScreen(${name},'print-queue',{printer:'${hdJsArg(printer)}'})">Open print queue</button> <button type="button" class="btn btn-secondary btn-sm" onclick="hdOpenMachineScreen(${name},'printer-properties',{printer:'${hdJsArg(printer)}',tab:'ports'})">Printer properties</button></li>`).join('');
  return `<div class="card" data-hd-addip><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Add a printer using an IP address</strong><span class="muted">Device type: TCP/IP Device (Standard TCP/IP port)</span></div><div class="card-body"><form onsubmit="hdSettingsAddByIp(event,${name})" style="display:grid;gap:8px;max-width:420px"><label>Hostname or IP address<input id="hd-add-ip" class="ipt" autocomplete="off" maxlength="15"></label><label>Printer name<input id="hd-add-name" class="ipt" autocomplete="off" maxlength="40"></label><label>Driver<select id="hd-add-driver" class="select">${catalog.map(driver => `<option>${hdEsc(driver)}</option>`).join('')}</select></label><button type="submit" class="btn btn-primary btn-sm" ${locked}>Add printer</button></form></div></div>
    <div class="card"><div class="card-header"><strong>Manage printers</strong></div><div class="card-body"><ul class="hd-list">${rows}</ul></div></div>`;
}

// Device Manager and the Camera app, built from machine.devices.
const HD_DEVICE_CODES = {
  10:'This device cannot start. (Code 10)', 22:'This device is disabled. (Code 22)', 28:'The drivers for this device are not installed. (Code 28)',
  43:'Windows has stopped this device because it has reported problems. (Code 43)',
};
function hdDeviceStatusText(device) { return device.status === 'OK' ? 'This device is working properly.' : (device.problem || HD_DEVICE_CODES[device.status] || `Windows reported a problem with this device. (Code ${device.status})`); }
function hdDeviceMark(device) { return device.status === 'OK' ? '' : String(device.status) === '22' ? '↓ ' : '⚠ '; }
function hdDeviceOpen(computerName, deviceId, tab) { hdOpenMachineScreen(computerName, 'device-manager', { device:deviceId, tab:tab || 'general' }); }
function hdDeviceDriver(computerName, deviceId, which) {
  hdMachineChange(computerName, machine => {
    const device = (machine.devices || []).find(item => item && item.id === deviceId); if (!device) return false;
    const next = which === 'rollback' ? device.previous : which === 'update' ? device.update : null;
    // Update Driver with nothing newer: Windows' own answer, shown on the tab.
    if (which === 'update' && (!next || typeof next !== 'object')) {
      device.updateChecked = true;
      hdMachineAction(computerName, 'driver-update-none', `searched for an updated driver for ${device.name}; the best driver is already installed`, { device:deviceId });
      return;
    }
    if (!next || typeof next !== 'object') return false;
    device.updateChecked = false;
    if (machine.lastBlueScreen) machine.lastBlueScreen = null; // console B: the crash line is for the old driver
    const { status, problem, ...driver } = next;
    if (which === 'rollback') { device.update = device.update || null; device.previous = null; } else { device.previous = device.driver; device.update = null; }
    device.driver = driver;
    device.status = status || 'OK';
    device.problem = problem || '';
    hdMachineAction(computerName, which === 'rollback' ? 'driver-rollback' : 'driver-update', `${which === 'rollback' ? 'rolled back' : 'updated'} the driver for ${device.name} to ${driver.version || driver.date || ''}`.trim(), { device:deviceId });
  });
}
VIEWS['helpdesk/device-manager'] = () => {
  const found = hdViewMachine(); const devices = found && Array.isArray(found.machine.devices) ? found.machine.devices.filter(item => item && item.id) : [];
  if (!devices.length) return hdMachineMissing('Device Manager');
  const { computer } = found; const view = hdMachineView();
  const locked = hdProveLocked() ? 'disabled' : '';
  const name = `'${hdJsArg(computer.name)}'`;
  const categories = [...new Set(devices.map(device => device.category || 'Other devices'))].sort();
  const tree = categories.map(category => `<li><strong>${hdEsc(category)}</strong><ul class="hd-list">${devices.filter(device => (device.category || 'Other devices') === category).map(device => `<li data-hd-device="${hdEsc(device.id)}" data-hd-device-status="${device.status === 'OK' ? 'ok' : 'problem'}"><button type="button" class="btn btn-ghost btn-sm" onclick="hdDeviceOpen(${name},'${hdJsArg(device.id)}')">${hdDeviceMark(device)}${hdEsc(device.name)}</button></li>`).join('')}</ul></li>`).join('');
  const device = devices.find(item => item.id === view.device);
  let props = '<p class="muted">Choose a device to see its properties.</p>';
  if (device) {
    const tab = view.tab === 'driver' ? 'driver' : 'general';
    const tabs = [['general', 'General'], ['driver', 'Driver']].map(([id, label]) => `<button type="button" class="btn ${id === tab ? 'btn-primary' : 'btn-secondary'} btn-sm" role="tab" aria-selected="${id === tab}" onclick="hdDeviceOpen(${name},'${hdJsArg(device.id)}','${id}')">${label}</button>`).join('');
    const driver = device.driver || {};
    props = `<div style="display:flex;gap:6px" role="tablist">${tabs}</div>${tab === 'general'
      ? `<dl class="hd-dl"><dt>Device</dt><dd>${hdEsc(device.name)}</dd><dt>Device type</dt><dd>${hdEsc(device.category || 'Other devices')}</dd><dt>Device status</dt><dd data-hd-device-text>${hdEsc(hdDeviceStatusText(device))}</dd></dl>`
      : `<dl class="hd-dl"><dt>Driver Provider</dt><dd>${hdEsc(driver.provider || '')}</dd><dt>Driver Date</dt><dd data-hd-driver-date>${hdEsc(driver.date || '')}</dd><dt>Driver Version</dt><dd>${hdEsc(driver.version || '')}</dd></dl><div style="display:flex;flex-wrap:wrap;gap:8px"><button type="button" class="btn btn-secondary btn-sm" ${locked || (device.previous ? '' : 'disabled')} onclick="hdDeviceDriver(${name},'${hdJsArg(device.id)}','rollback')">Roll Back Driver</button><button type="button" class="btn btn-secondary btn-sm" ${locked} onclick="hdDeviceDriver(${name},'${hdJsArg(device.id)}','update')">Update Driver</button></div>${device.updateChecked ? '<p class="muted" data-hd-driver-best>The best drivers for your device are already installed.</p>' : ''}`}`;
  }
  return `${hdPageHeader('Device Manager', computer.name, hdMachineBack(computer))}<div class="two-col" data-hd-devmgr><div class="card"><div class="card-header"><strong>${hdEsc(computer.name)}</strong></div><div class="card-body"><ul class="hd-list">${tree}</ul></div></div><div class="card"><div class="card-header"><strong>${device ? `${hdEsc(device.name)} Properties` : 'Properties'}</strong></div><div class="card-body">${props}</div></div></div>`;
};
VIEWS['helpdesk/camera'] = () => {
  const found = hdViewMachine(); const camera = found && (found.machine.devices || []).find(device => device && device.camera);
  if (!camera) return hdMachineMissing('Camera');
  const working = camera.status === 'OK';
  return `${hdPageHeader('Camera', found.computer.name, hdMachineBack(found.computer))}<div class="card" data-hd-camera="${working ? 'video' : 'none'}"><div class="card-body">${working
    ? `<div role="img" aria-label="Camera preview showing video" style="min-height:160px;display:grid;place-items:center;border-radius:8px;border:1px solid currentColor"><strong>● Live video</strong></div>`
    : `<div class="callout bad" role="status">We can't find your camera. Check to be sure it's connected and installed properly, that it isn't being blocked by antivirus software, and that your camera drivers are up to date. Error code 0xA00F4244.</div>`}</div></div>`;
};

// Dock and displays.
function hdDockLive(machine) { return !!(machine.dock && machine.dock.docked && machine.dock.power); }
function hdMonitorShows(machine, monitor) {
  return hdDockLive(machine) && monitor.input === monitor.cable && machine.projection !== 'PC screen only' && (!monitor.needsDetect || machine.detected === true);
}
function hdDockMonitors(machine) { return machine.dock && Array.isArray(machine.dock.monitors) ? machine.dock.monitors : []; }
function hdActiveMonitors(machine) {
  const shown = hdDockMonitors(machine).filter(monitor => hdMonitorShows(machine, monitor));
  const order = Array.isArray(machine.arrangement) ? machine.arrangement : [];
  return shown.sort((a, b) => (order.indexOf(a.id) + 1 || 99) - (order.indexOf(b.id) + 1 || 99));
}
function hdDockDo(computerName, what, value, extra) {
  hdMachineChange(computerName, machine => {
    const dock = machine.dock; if (!dock) return false;
    if (what === 'power') {
      if (dock.power) return false;
      dock.power = true; hdMachineAction(computerName, 'dock-power', `connected the power to ${dock.name || 'the dock'}`);
    } else if (what === 'dock') {
      dock.docked = !dock.docked; hdMachineAction(computerName, dock.docked ? 'dock-connect' : 'dock-disconnect', `${dock.docked ? 'connected the laptop to' : 'disconnected the laptop from'} ${dock.name || 'the dock'}`);
      hdWinDockCrash(computerName, machine);
    } else if (what === 'input') {
      const monitor = hdDockMonitors(machine).find(item => item.id === value); if (!monitor || !(monitor.inputs || []).includes(extra) || monitor.input === extra) return false;
      monitor.input = extra; hdMachineAction(computerName, 'monitor-input', `set ${monitor.name}'s input to ${extra}`, { monitor:monitor.id, input:extra });
    } else if (what === 'project') {
      if (!['PC screen only', 'Duplicate', 'Extend', 'Second screen only'].includes(value) || machine.projection === value) return false;
      machine.projection = value; hdMachineAction(computerName, 'projection', `pressed Win + P and chose ${value}`, { mode:value });
    } else if (what === 'detect') {
      const waiting = hdDockLive(machine) && hdDockMonitors(machine).some(monitor => monitor.needsDetect && monitor.input === monitor.cable);
      if (waiting) machine.detected = true;
      hdMachineAction(computerName, 'display-detect', `pressed Detect in Settings › Display (${waiting ? 'display found' : 'no new display'})`, { found:waiting });
      if (!waiting) toast("We didn't detect another display.");
    } else if (what === 'left') {
      const order = hdActiveMonitors(machine).map(monitor => monitor.id); const at = order.indexOf(value);
      if (at <= 0) return false;
      [order[at - 1], order[at]] = [order[at], order[at - 1]];
      machine.arrangement = order; hdMachineAction(computerName, 'display-arrange', `arranged the displays: ${order.join(', ')}`, { order:order.join(',') });
    } else return false;
  });
}
VIEWS['helpdesk/dock'] = () => {
  const found = hdViewMachine(); if (!found || !found.machine.dock) return hdMachineMissing('Dock and displays');
  const { computer, machine } = found; const dock = machine.dock;
  const locked = hdProveLocked() ? 'disabled' : '';
  const name = `'${hdJsArg(computer.name)}'`;
  const live = hdDockLive(machine);
  const monitors = hdDockMonitors(machine).map(monitor => {
    const shows = hdMonitorShows(machine, monitor);
    return `<div class="card" data-hd-monitor="${hdEsc(monitor.id)}" data-hd-monitor-state="${shows ? 'picture' : 'no-signal'}"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>${hdEsc(monitor.name || monitor.id)}</strong><span class="muted">${shows ? 'Showing the desktop' : live ? 'No signal' : 'Dark'}</span></div><div class="card-body"><p class="muted" style="margin-top:0">Input/Source: ${hdEsc(monitor.input || '')}</p><div style="display:flex;flex-wrap:wrap;gap:6px">${(monitor.inputs || []).map(input => `<button type="button" class="btn ${input === monitor.input ? 'btn-primary' : 'btn-secondary'} btn-sm" aria-pressed="${input === monitor.input}" ${locked} onclick="hdDockDo(${name},'input','${hdJsArg(monitor.id)}','${hdJsArg(input)}')">${hdEsc(input)}</button>`).join('')}</div></div></div>`;
  }).join('');
  const modes = ['PC screen only', 'Duplicate', 'Extend', 'Second screen only'].map(mode => `<button type="button" class="btn ${machine.projection === mode ? 'btn-primary' : 'btn-secondary'} btn-sm" aria-pressed="${machine.projection === mode}" ${locked} onclick="hdDockDo(${name},'project','${mode}')">${mode}</button>`).join('');
  const active = hdActiveMonitors(machine);
  const displays = [`<li>1 · Built-in display${machine.projection === 'Second screen only' && active.length ? ' (off)' : ''}</li>`, ...active.map((monitor, index) => `<li data-hd-display="${hdEsc(monitor.id)}">${index + 2} · ${hdEsc(monitor.name || monitor.id)}${index > 0 ? ` <button type="button" class="btn btn-ghost btn-sm" ${locked} onclick="hdDockDo(${name},'left','${hdJsArg(monitor.id)}')">Move left</button>` : ''}</li>`)].join('');
  const peripherals = (Array.isArray(dock.peripherals) ? dock.peripherals : []).map(item => `<li>${hdEsc(item)}: ${live ? 'working' : 'not responding'}</li>`).join('');
  return `${hdPageHeader('Dock and displays', `${computer.name} · ${dock.name || 'Dock'}`, hdMachineBack(computer))}
    <div data-hd-dock="${live ? 'live' : 'dark'}" class="hd-settings-view">${hdWinBlueScreenLine(machine)}
    <div class="card"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>${hdEsc(dock.name || 'Dock')}</strong><span class="muted">Dock light: ${dock.power ? 'on' : 'off'} · ${dock.docked ? 'laptop connected' : 'laptop not connected'}</span></div><div class="card-body"><div style="display:flex;flex-wrap:wrap;gap:8px"><button type="button" class="btn btn-secondary btn-sm" ${locked || (dock.power ? 'disabled' : '')} onclick="hdDockDo(${name},'power')">${dock.power ? 'Dock power connected' : "Plug in the dock's power"}</button><button type="button" class="btn btn-secondary btn-sm" ${locked} onclick="hdDockDo(${name},'dock')">${dock.docked ? 'Disconnect the laptop' : 'Connect the laptop to the dock'}</button></div>${peripherals ? `<ul class="hd-list">${peripherals}</ul>` : ''}</div></div>
    ${monitors}
    <div class="card"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Win + P</strong><span class="muted">Project</span></div><div class="card-body"><div style="display:flex;flex-wrap:wrap;gap:6px" data-hd-projection="${hdEsc(machine.projection || '')}">${modes}</div></div></div>
    <div class="card"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Settings › System › Display</strong><span class="muted">Multiple displays · Detect other display</span><button type="button" class="btn btn-secondary btn-sm" ${locked} onclick="hdDockDo(${name},'detect')">Detect</button></div><div class="card-body"><ul class="hd-list" data-hd-displays>${displays}</ul></div></div>
    </div>`;
};
VIEWS['helpdesk/settings-network'] = () => {
  const found = hdViewMachine(); if (!found || !found.machine.dock) return hdMachineMissing('Settings › Network & internet');
  const { computer, machine } = found; const live = hdDockLive(machine);
  const ethernet = machine.dock.ethernet ? `<li data-hd-ethernet="${live ? 'connected' : 'unplugged'}">Ethernet (${hdEsc(machine.dock.ethernet)}): ${live ? 'Connected' : 'Network cable unplugged'}</li>` : '';
  return `${hdPageHeader('Settings', `${computer.name} · Network & internet`, hdMachineBack(computer))}<div class="card" data-hd-netset><div class="card-body"><ul class="hd-list">${ethernet}<li>Wi-Fi: Connected</li></ul></div></div>`;
};

// Virtual Desktops: pools and sessions from a ticket's console.vdi.
function hdVdiPools() {
  if (HD_PROVE || !hdState.vdi) return [];
  return Object.keys(hdState.vdi).filter(name => { const pool = hdState.vdi[name]; return pool && hdTicketById(pool.ticketId) && hdConsole(hdTicketById(pool.ticketId)).vdi; }).map(name => ({ name, ...hdState.vdi[name] }));
}
function hdVdiLogOff(poolName, sessionId) {
  if (hdProveLocked()) return;
  const pool = hdVdiPools().find(item => item.name === poolName); if (!pool) return;
  const session = hdState.vdi[poolName].sessions.find(item => String(item.id) === String(sessionId)); if (!session) return;
  const ticket = hdTicketById(pool.ticketId);
  const was = session.state;
  session.state = 'Active'; session.hours = 0; session.renewed = true;
  const state = hdConsoleState(ticket);
  state.actions.push({ id:'vdi-logoff', time:hdConsoleTime(ticket), pool:poolName, user:session.user, was });
  hdHistory(ticket, `Virtual Desktops: logged off ${session.user}'s session in ${poolName}; the user reconnected to a new session.`);
  hdPracticeEvent('action_taken', { ticket:ticket.id, action:'vdi-logoff', pool:poolName, user:session.user });
  hdRerender();
}
function hdVdiRestartPool(poolName) {
  const pool = hdVdiPools().find(item => item.name === poolName); if (!pool) return;
  const ticket = hdTicketById(pool.ticketId);
  const state = hdConsoleState(ticket);
  state.actions.push({ id:'vdi-restart-refused', time:hdConsoleTime(ticket), pool:poolName });
  hdHistory(ticket, `Virtual Desktops: Restart pool on ${poolName} refused (Tier 2 action).`);
  hdPracticeEvent('action_taken', { ticket:ticket.id, action:'vdi-restart-refused', pool:poolName });
  hdState.vdiNotice = poolName;
  hdRerender();
}
VIEWS['helpdesk/virtual-desktops'] = () => {
  const pools = hdVdiPools();
  if (!pools.length) return `${hdPageHeader('Virtual Desktops', 'No virtual desktop pools in this shift.')}<div class="card"><div class="card-body"><p class="muted">Open a ticket about a virtual desktop to use this screen.</p></div></div>`;
  const ticket = hdTicketById(pools[0].ticketId);
  return `${hdPageHeader('Virtual Desktops', 'Pools and user sessions', ticket ? `<button class="btn btn-secondary" onclick="hdSelectTicket('${hdJsArg(ticket.id)}')">← ${hdEsc(hdTicketLabel(ticket))}</button>` : '')}${pools.map(pool => {
    const config = hdConsole(hdTicketById(pool.ticketId)).vdi;
    const active = pool.sessions.filter(session => session.state === 'Active').length;
    const notice = hdState.vdiNotice === pool.name ? `<div class="callout bad" role="alert">${hdEsc(config.tier2Line || 'Restart pool is a Tier 2 action: it disconnects every user in the pool. Tier 1 can\'t run it.')}</div>` : '';
    const rows = pool.sessions.map(session => `<tr data-hd-session="${hdEsc(session.id)}" data-hd-session-state="${session.state === 'Active' ? 'active' : 'hung'}"><td>${hdEsc(session.user)}</td><td>${hdBadge(session.state === 'Active' && session.renewed ? 'Active · new session' : session.state, session.state === 'Active' ? 'ok' : 'bad')}</td><td>${session.state === 'Active' ? (session.renewed ? 'just now' : `${hdEsc(session.hours || 0)} h`) : `${hdEsc(session.hours || 0)} h`}</td><td><button type="button" class="btn btn-secondary btn-sm" onclick="hdVdiLogOff('${hdJsArg(pool.name)}','${hdJsArg(session.id)}')">Log off session</button></td></tr>`).join('');
    return `<div class="card" data-hd-vdi="${hdEsc(pool.name)}"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>${hdEsc(pool.name)}</strong><span class="muted">${active} of ${pool.sessions.length} sessions Active</span><button type="button" class="btn btn-ghost btn-sm" onclick="hdVdiRestartPool('${hdJsArg(pool.name)}')">Restart pool (Tier 2)</button></div>${notice}<div class="table-wrap"><table><thead><tr><th>User</th><th>State</th><th>Time</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }).join('')}`;
};
// The ticket's computers (console.machines) and virtual desktops (console.vdi).
function hdConsoleMachinesCard(ticket) {
  const specs = hdTicketMachineSpecs(ticket);
  const names = specs ? Object.keys(specs).filter(name => hdComputerByName(name)) : [];
  const vdi = hdConsole(ticket).vdi && hdVdiPools().length;
  if (!names.length && !vdi) return '';
  const buttons = names.map(name => `<button type="button" class="btn btn-secondary" onclick="hdSelectComputer('${hdJsArg(name)}','#/helpdesk/windows')">Open ${hdEsc(name)}</button>`).join('');
  return `<div class="card hd-computer" data-hd-machines><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Computers and desktops</strong><span class="muted">Tools open on the computer you choose</span></div><div class="card-body"><div style="display:flex;flex-wrap:wrap;gap:8px">${buttons}${vdi ? `<button type="button" class="btn btn-secondary" data-hd-vdi-open onclick="hdVdiOpen()">Virtual Desktops</button>` : ''}</div></div></div>`;
}
// Opening the pools from a ticket is the scope check: recorded once per
// ticket (action vdi-viewed), so feedback and a coach can read it.
function hdVdiOpen() {
  hdVdiPools().forEach(pool => {
    const ticket = hdTicketById(pool.ticketId); if (!ticket) return;
    const state = hdConsoleState(ticket);
    if (state.actions.some(action => action.id === 'vdi-viewed' && action.pool === pool.name)) return;
    state.actions.push({ id:'vdi-viewed', time:hdConsoleTime(ticket), pool:pool.name });
    hdPracticeEvent('action_taken', { ticket:ticket.id, action:'vdi-viewed', pool:pool.name });
  });
  hdSave();
  navigate('#/helpdesk/virtual-desktops');
}
window.hdVdiOpen = hdVdiOpen;
// A late message can wait for a machine value (arrival when.machine).
function hdMachineValueIs(rule) {
  if (!rule || typeof rule !== 'object' || !Array.isArray(rule.path)) return false;
  let value = (hdState.machines || {})[rule.computer];
  for (const key of rule.path) { if (!value || typeof value !== 'object' || !hdOwn(value, key)) return false; value = value[key]; }
  return Array.isArray(rule.values) ? rule.values.includes(value) : value === rule.value;
}
/* ---------- Windows client tools (added for Module 5, key its-03) ----------
 * Off unless the computer's machine state (console.machines, or a Prove
 * shift's machines) has the key a screen reads. A computer without them
 * looks and answers as before. Machine-state fields for Windows client work:
 *   processes: [{ name, cpu, memory, disk }]   Task Manager › Processes
 *     (cpu %, memory MB, disk MB/s)
 *   performance: { cpu, memory, disk, diskRecovered?:{ freePercent, disk } }
 *     percentages; Disk shows diskRecovered.disk once C: is at least
 *     freePercent free (freeing space ends a full-disk 100%)
 *   startupApps: [{ name, publisher, verified, status:'Enabled' | 'Disabled',
 *       impact:'High' | 'Medium' | 'Low' | 'None', command?, location? }]
 *   storage: { drive, sizeGb, freeGb, categories:[{ name, gb }],
 *       temporaryFiles:[{ id, name, gb, recycleBin? }], driveHealth?:
 *       'Good' | { status, note } }
 *   updates: { lastInstalledDaysAgo, restartRequired, pending?:{ kb, name,
 *       downloaded }, history:[{ kb, name, date, status, description? }] }
 *   uptimeDays, bootSeconds, bootSecondsAfterFix   a Restart sets uptime to
 *     0 and, when bootSecondsAfterFix is given, the new boot time
 *   installedApps: [{ name, publisher, version, installed?, sizeMb?,
 *       startup? }]   Uninstall removes the app and its startup entry
 *   catalog: [{ name, publisher, version?, note? }] | true   Software
 *     Catalog; true uses the shift's catalog or HD_SOFTWARE_CATALOG
 * Fields Event Viewer, Reliability Monitor, Safe Mode, the sign-in view,
 * Active Directory and the repair commands read (console B):
 *   events: { system:[], application:[], 'diagnostics-performance':[] }
 *     ({ level, time, source, id, message })
 *   reliability: [{ day, critical:[], warnings:[], installs:[] }]
 *   profile: { temporary, restartClears }   files: { '<folder>':[names] }
 *   repairs: { dism, sfc, chkdsk }   bitlockerKeys: [{ keyId, date, key }]
 *   safeMode: bool
 * Every screen records its Prove source once (task-manager:<computer>:<tab>,
 * storage:, windows-update:, installed-apps:, software-catalog:) and adds
 * the same key to machine.seen, which a coach reads in Practice. Every
 * change is an hdMachineAction.
 * Module 6 (key its-07), console A, adds (each off unless the machine has it;
 * see "Software install tools" below):
 *   installedApps[]: + wingetId?, opens?:['.pdf'] (Default apps can pick it),
 *     upgrade?:{ version, afterRepair? }   a waiting upgrade; afterRepair
 *       lists it only once the app is repaired
 *     repair?:{ available?, broken?, via?:'advanced' | 'modify', fixedText? }
 *       broken: what is wrong until it is repaired (e.g. 'freezes');
 *       advanced: Advanced options › Repair; modify: Modify › Repair or
 *       Online repair; fixedText: the line shown once it is repaired
 *     reset?:{ available? }   Advanced options › Reset
 *   catalog[]: + wingetId?, version?   winget finds only entries with an Id
 *   defaultApps: { '.pdf':'<app name>', ... }   Settings › Apps › Default apps
 *   companyPortal: true   Company Portal (installs from the Software Catalog)
 *   winget: true   the five winget lines answer on this computer
 *   resetPc: true   Reset this PC on Recovery is a recorded choice
 *     (pc-reset-chosen); nothing is ever wiped
 * Console B reads these (documented here, built there): protection,
 * extensions, oneDrive. */
const HD_WIN_SCREENS = {
  'pc-task-manager':{ source:'task-manager', label:'Task Manager', key:'processes' },
  'settings-storage':{ source:'storage', label:'Settings › System › Storage', key:'storage' },
  'settings-update':{ source:'windows-update', label:'Settings › Windows Update', key:'updates' },
  'settings-apps':{ source:'installed-apps', label:'Settings › Apps › Installed apps', key:'installedApps' },
  'software-catalog':{ source:'software-catalog', label:'Software Catalog', key:'catalog' },
  // Console B.
  reliability:{ source:'reliability', label:'Reliability Monitor', key:'reliability' },
  'settings-recovery':{ source:'recovery', label:'Settings › System › Recovery', key:'safeMode' },
  // Module 6, console A.
  'default-apps':{ source:'default-apps', label:'Settings › Apps › Default apps', key:'defaultApps' },
  'company-portal':{ source:'company-portal', label:'Company Portal', key:'companyPortal' },
  // Module 6, console B. tabs: each page records its own source; the first
  // tab of a bare:true screen records the bare source (no :<tab>).
  'windows-security':{ source:'windows-security', label:'Windows Security', key:'protection', bare:true, tabs:[['home', 'Security at a glance'], ['virus-threat', 'Virus & threat protection'], ['protection-history', 'Protection history'], ['allowed-threats', 'Allowed threats']] },
  'browser-extensions':{ source:'browser-extensions', label:'Browser › Extensions', key:'extensions' },
  onedrive:{ source:'onedrive', label:'OneDrive', key:'oneDrive', bare:true, tabs:[['status', 'OneDrive'], ['sync-problems', 'View sync problems'], ['web', 'OneDrive on the web']] },
};
const HD_WIN_TASK_TABS = [['processes', 'Processes'], ['performance', 'Performance'], ['startup', 'Startup apps']];
function hdWinList(machine, key) { return machine && Array.isArray(machine[key]) ? machine[key].filter(item => item && typeof item === 'object') : []; }
function hdWinStorage(machine) { return machine && machine.storage && typeof machine.storage === 'object' && Number(machine.storage.sizeGb) > 0 ? machine.storage : null; }
function hdWinUpdates(machine) { return machine && machine.updates && typeof machine.updates === 'object' ? machine.updates : null; }
function hdWinHasTaskManager(machine) { return !!machine && (hdWinList(machine, 'processes').length > 0 || !!(machine.performance && typeof machine.performance === 'object') || hdWinList(machine, 'startupApps').length > 0); }
function hdWinHasRestart(machine) { return !!machine && (!!hdWinUpdates(machine) || typeof machine.uptimeDays === 'number' || typeof machine.bootSeconds === 'number' || typeof machine.safeMode === 'boolean' || !!hdWinProfile(machine)); }
// Which Windows screens a machine has. In a Prove shift with machineTools,
// every computer shows a screen when any of the shift's computers has it, so
// the buttons never point at the case.
function hdWinHas(machine, screen) {
  const own = (m) => {
    if (screen === 'pc-task-manager') return hdWinHasTaskManager(m);
    if (screen === 'settings-storage') return !!hdWinStorage(m);
    if (screen === 'settings-update') return !!hdWinUpdates(m);
    if (screen === 'settings-apps') return Array.isArray(m && m.installedApps);
    if (screen === 'software-catalog') return !!m && (Array.isArray(m.catalog) || m.catalog === true);
    if (screen === 'restart') return hdWinHasRestart(m);
    // Console B.
    if (screen === 'event-logs') return !!hdWinEvents(m);
    if (screen === 'reliability') return !!m && Array.isArray(m.reliability);
    if (screen === 'settings-recovery') return hdWinHasRecovery(m);
    if (screen === 'ad-computer') return !!m && Array.isArray(m.bitlockerKeys);
    // Module 6, console A.
    if (screen === 'default-apps') return !!hdWinDefaults(m);
    if (screen === 'company-portal') return !!m && m.companyPortal === true;
    if (screen === 'winget') return !!m && m.winget === true;
    // Module 6, console B.
    if (screen === 'windows-security') return !!hdWinProtection(m);
    if (screen === 'browser-extensions') return !!m && Array.isArray(m.extensions);
    if (screen === 'onedrive') return !!hdWinOneDrive(m);
    return false;
  };
  if (own(machine)) return true;
  if (!machine || !hdProveAllTools()) return false;
  const shift = HD_PROVE.shift.machines || {};
  return Object.keys(shift).some(name => own(hdMachine(name)));
}
function hdWinSeen(machine, key) {
  if (!machine) return false;
  if (!Array.isArray(machine.seen)) machine.seen = [];
  let changed = false;
  if (!machine.seen.includes(key)) { machine.seen.push(key); changed = true; }
  // Module 5 (sim): when the key was last seen, as the owning ticket's action
  // count then, so "Check my work" can ask for a screen read again after a
  // fix (rule seen with after; hdConsoleRule).
  const ticket = machine.seededBy && !HD_PROVE ? hdTicketById(machine.seededBy) : null;
  if (ticket) {
    const state = hdConsoleState(ticket);
    const count = (Number(state.actionsDropped) || 0) + state.actions.length;
    if (!machine.seenAt || typeof machine.seenAt !== 'object') machine.seenAt = {};
    if (machine.seenAt[key] !== count) { machine.seenAt[key] = count; changed = true; }
  }
  return changed;
}
function hdWinOpened(computerName, screen, tab) {
  const meta = HD_WIN_SCREENS[screen]; const machine = hdFeatureMachine(computerName); if (!meta || !machine) return;
  // Task Manager always names its tab; a screen with tabs (Module 6) names
  // every tab but a bare screen's first.
  const tabs = screen === 'pc-task-manager' ? HD_WIN_TASK_TABS : meta.tabs || null;
  const picked = tabs ? (tabs.some(([id]) => id === tab) ? tab : tabs[0][0]) : '';
  const part = tabs && !(meta.bare && picked === tabs[0][0]) ? `:${picked}` : '';
  hdWinSeen(machine, `${meta.source}${part}`);
  const tabLabel = part ? ` › ${tabs.find(([id]) => id === part.slice(1))[1]}` : '';
  hdProveOpened(`${meta.source}:${computerName}${part}`, `${meta.label}${tabLabel} · ${computerName}`);
}
function hdWinToolButtons(name) {
  const machine = hdFeatureMachine(name); if (!machine) return '';
  const open = (screen, label) => hdWinHas(machine, screen) ? `<button data-hd-tools="${screen}" onclick="hdOpenMachineScreen('${hdJsArg(name)}','${screen}')">${label}</button>` : '';
  return [
    open('pc-task-manager', '📊 Task Manager'),
    open('settings-storage', '⚙ Settings › System › Storage'),
    open('settings-update', '⚙ Settings › Windows Update'),
    open('settings-apps', '⚙ Settings › Apps › Installed apps'),
    open('default-apps', '⚙ Settings › Apps › Default apps'),
    open('software-catalog', '📚 Software Catalog'),
    open('company-portal', '🏢 Company Portal'),
    open('windows-security', '🛡 Windows Security'),
    open('browser-extensions', '🌐 Browser › Extensions'),
    open('onedrive', '☁ OneDrive'),
    open('reliability', '📈 Reliability Monitor'),
    open('settings-recovery', '⚙ Settings › System › Recovery'),
  ].join('');
}
function hdWinRestartBar(name) {
  const machine = hdFeatureMachine(name); if (!hdWinHas(machine, 'restart')) return '';
  // No hint about a pending update here: the student finds it in Windows Update.
  const note = Number(machine.restarts) > 0 ? '<span class="muted" data-hd-restarted>Restarted. Signed in again.</span>' : '';
  return `<div class="hd-tool-grid" data-hd-restart-bar><button type="button" ${hdProveLocked() ? 'disabled' : ''} onclick="hdWinRestart('${hdJsArg(name)}')">⏻ Restart</button>${note}</div>`;
}
function hdWinScreen(screen) {
  const found = hdViewMachine();
  if (!found || !hdWinHas(found.machine, screen)) return null;
  return found;
}
function hdWinTabs(tabs, current, onclick) {
  return `<div style="display:flex;flex-wrap:wrap;gap:6px" role="tablist">${tabs.map(([id, label]) => `<button type="button" class="btn ${id === current ? 'btn-primary' : 'btn-secondary'} btn-sm" role="tab" aria-selected="${id === current}" data-hd-win-tab="${id}" onclick="${onclick(id)}">${label}</button>`).join('')}</div>`;
}
function hdWinRound(value) { return Math.round(Number(value || 0) * 10) / 10; }
function hdWinFreePercent(storage) { return storage ? Math.round(Number(storage.freeGb || 0) / Number(storage.sizeGb) * 100) : 0; }
function hdWinDiskPercent(machine) {
  const perf = machine.performance && typeof machine.performance === 'object' ? machine.performance : {};
  const recovered = perf.diskRecovered && typeof perf.diskRecovered === 'object' ? perf.diskRecovered : null;
  const storage = hdWinStorage(machine);
  if (recovered && storage && hdWinFreePercent(storage) >= Number(recovered.freePercent)) return Number(recovered.disk);
  return Number(perf.disk || 0);
}

// Task Manager on a computer (the VM host's Task Manager is a separate screen).
function hdWinTaskTab(computerName, tab) {
  if (!HD_WIN_TASK_TABS.some(([id]) => id === tab)) return;
  hdState.machineView = { ...hdMachineView(), computer:computerName, tab };
  hdWinOpened(computerName, 'pc-task-manager', tab);
  hdSave(); render();
}
function hdWinTaskSort(computerName, column) {
  if (!['cpu', 'memory', 'disk'].includes(column)) return;
  hdState.machineView = { ...hdMachineView(), computer:computerName, tab:'processes', sort:column };
  hdWinSeen(hdFeatureMachine(computerName), `task-manager:sort:${column}`);
  hdSave(); render();
}
function hdWinStartupSet(computerName, appName, status) {
  if (!['Enabled', 'Disabled'].includes(status)) return;
  hdMachineChange(computerName, machine => {
    const app = hdWinList(machine, 'startupApps').find(item => item.name === appName);
    if (!app || app.status === status) return false;
    app.status = status;
    hdMachineAction(computerName, status === 'Disabled' ? 'startup-disabled' : 'startup-enabled', `${status === 'Disabled' ? 'disabled' : 'enabled'} ${appName} at startup`, { app:appName });
  });
}
VIEWS['helpdesk/pc-task-manager'] = () => {
  const found = hdWinScreen('pc-task-manager'); if (!found || !hdWinHasTaskManager(found.machine)) return hdMachineMissing('Task Manager');
  const { computer, machine } = found; const view = hdMachineView();
  const tab = HD_WIN_TASK_TABS.some(([id]) => id === view.tab) ? view.tab : 'processes';
  const name = `'${hdJsArg(computer.name)}'`;
  const locked = hdProveLocked() ? 'disabled' : '';
  const perf = machine.performance && typeof machine.performance === 'object' ? machine.performance : {};
  let body;
  if (tab === 'processes') {
    const sort = ['cpu', 'memory', 'disk'].includes(view.sort) ? view.sort : '';
    const rows = hdWinList(machine, 'processes').slice();
    if (sort) rows.sort((a, b) => Number(b[sort] || 0) - Number(a[sort] || 0));
    const head = (column, label, total) => `<th><button type="button" class="btn btn-ghost btn-sm" data-hd-sort="${column}" aria-sort="${sort === column ? 'descending' : 'none'}" onclick="hdWinTaskSort(${name},'${column}')">${label}${total !== undefined ? ` ${hdEsc(total)}%` : ''}${sort === column ? ' ▼' : ''}</button></th>`;
    body = `<div class="table-wrap"><table data-hd-processes><thead><tr><th>Name</th>${head('cpu', 'CPU', perf.cpu)}${head('memory', 'Memory', perf.memory)}${head('disk', 'Disk', machine.performance ? hdWinDiskPercent(machine) : undefined)}</tr></thead><tbody>${rows.map(p => `<tr data-hd-process="${hdEsc(p.name)}"><td>${hdEsc(p.name)}</td><td>${hdEsc(p.cpu || 0)}%</td><td>${hdEsc(p.memory || 0)} MB</td><td>${hdEsc(p.disk || 0)} MB/s</td></tr>`).join('') || '<tr><td colspan="4" class="muted">No processes listed.</td></tr>'}</tbody></table></div>`;
  } else if (tab === 'performance') {
    const disk = hdWinDiskPercent(machine);
    body = `<dl class="hd-dl" data-hd-performance><dt>CPU</dt><dd>${hdEsc(perf.cpu || 0)}%</dd><dt>Memory</dt><dd>${hdEsc(perf.memory || 0)}%</dd><dt>Disk 0 (C:)</dt><dd data-hd-disk="${disk}"><strong>${hdEsc(disk)}%</strong></dd>${typeof machine.uptimeDays === 'number' ? `<dt>Up time</dt><dd>${machine.uptimeDays === 0 ? 'Less than a day' : `${hdEsc(machine.uptimeDays)} day${machine.uptimeDays === 1 ? '' : 's'}`}</dd>` : ''}</dl>`;
  } else {
    const apps = hdWinList(machine, 'startupApps');
    body = `<div class="table-wrap"><table data-hd-startup><thead><tr><th>Name</th><th>Publisher</th><th>Status</th><th>Startup impact</th><th></th></tr></thead><tbody>${apps.map(app => {
      const enabled = app.status !== 'Disabled';
      return `<tr data-hd-startup-app="${hdEsc(app.name)}" data-hd-startup-status="${enabled ? 'enabled' : 'disabled'}"><td>${hdEsc(app.name)}</td><td>${app.verified === false ? '' : hdEsc(app.publisher || '')}</td><td>${enabled ? 'Enabled' : 'Disabled'}</td><td>${hdEsc(enabled ? (app.impact || 'Not measured') : 'None')}</td><td><button type="button" class="btn btn-secondary btn-sm" ${locked} onclick="hdWinStartupSet(${name},'${hdJsArg(app.name)}','${enabled ? 'Disabled' : 'Enabled'}')">${enabled ? 'Disable' : 'Enable'}</button></td></tr>`;
    }).join('') || '<tr><td colspan="5" class="muted">No startup apps.</td></tr>'}</tbody></table></div>`;
  }
  return `${hdPageHeader('Task Manager', computer.name, hdMachineBack(computer))}<div class="card" data-hd-pc-task-manager="${tab}"><div class="card-header" ${HD_CONSOLE_HEADER}>${hdWinTabs(HD_WIN_TASK_TABS, tab, id => `hdWinTaskTab(${name},'${id}')`)}</div><div class="card-body">${body}</div></div>`;
};

// Settings › System › Storage, with Temporary files and the drive health line.
function hdWinTempTick(computerName, id) {
  const view = hdMachineView();
  const ticked = Array.isArray(view.temp) ? view.temp.slice() : [];
  const at = ticked.indexOf(id);
  if (at >= 0) ticked.splice(at, 1); else ticked.push(id);
  hdState.machineView = { ...view, computer:computerName, temp:ticked };
  hdSave(); render();
}
function hdWinTempRemove(computerName) {
  const ticked = Array.isArray(hdMachineView().temp) ? hdMachineView().temp : [];
  hdMachineChange(computerName, machine => {
    const storage = hdWinStorage(machine); if (!storage) return false;
    const items = (Array.isArray(storage.temporaryFiles) ? storage.temporaryFiles : []).filter(item => item && ticked.includes(item.id) && Number(item.gb) > 0);
    if (!items.length) { if (!HD_PROVE) toast('Tick the temporary files to remove first.'); return false; }
    const gb = hdWinRound(items.reduce((sum, item) => sum + Number(item.gb), 0));
    storage.freeGb = hdWinRound(Math.min(Number(storage.sizeGb), Number(storage.freeGb || 0) + gb));
    items.forEach(item => { item.gb = 0; });
    hdState.machineView = { ...hdMachineView(), temp:[] };
    hdMachineAction(computerName, 'temp-files-removed', `removed ${items.map(item => item.name).join(', ')} (${gb} GB) in Storage › Temporary files`, { items:items.map(item => item.id), gb });
    if (items.some(item => item.recycleBin)) hdMachineAction(computerName, 'recycle-bin-emptied', 'emptied the Recycle Bin');
  });
}
VIEWS['helpdesk/settings-storage'] = () => {
  const found = hdWinScreen('settings-storage'); if (!found) return hdMachineMissing('Storage');
  const { computer, machine } = found; const storage = hdWinStorage(machine);
  if (!storage) return hdMachineMissing('Storage');
  const name = `'${hdJsArg(computer.name)}'`;
  const locked = hdProveLocked() ? 'disabled' : '';
  const ticked = Array.isArray(hdMachineView().temp) ? hdMachineView().temp : [];
  const temp = (Array.isArray(storage.temporaryFiles) ? storage.temporaryFiles : []).filter(item => item && item.id);
  const tempGb = hdWinRound(temp.reduce((sum, item) => sum + Number(item.gb || 0), 0));
  const used = hdWinRound(Number(storage.sizeGb) - Number(storage.freeGb || 0));
  const categories = [...(Array.isArray(storage.categories) ? storage.categories : []).filter(item => item && item.name), ...(temp.length ? [{ name:'Temporary files', gb:tempGb }] : [])];
  const health = storage.driveHealth && typeof storage.driveHealth === 'object' ? storage.driveHealth : storage.driveHealth ? { status:storage.driveHealth } : null;
  const rows = temp.map(item => {
    const on = ticked.includes(item.id);
    return `<li data-hd-temp="${hdEsc(item.id)}"><button type="button" class="btn btn-ghost btn-sm" role="checkbox" aria-checked="${on}" ${locked || (Number(item.gb) > 0 ? '' : 'disabled')} onclick="hdWinTempTick(${name},'${hdJsArg(item.id)}')">${on ? '☑' : '☐'} ${hdEsc(item.name)}</button> <span class="muted">${hdEsc(hdWinRound(item.gb))} GB</span>${item.recycleBin ? ' <span class="muted">Files the user deleted. They can still be restored until it is emptied.</span>' : ''}</li>`;
  }).join('');
  return `${hdPageHeader('Storage', `Settings › System › Storage · ${computer.name}`, hdMachineBack(computer))}<div class="hd-settings-view" data-hd-storage>
    <div class="card"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Local Disk (${hdEsc(storage.drive || 'C:')})</strong><span class="muted" data-hd-free="${hdEsc(storage.freeGb)}">${hdEsc(hdWinRound(storage.freeGb))} GB free of ${hdEsc(storage.sizeGb)} GB</span></div><div class="card-body"><div class="hd-progress"><i style="width:${Math.min(100, Math.max(0, Math.round(used / Number(storage.sizeGb) * 100)))}%"></i></div><p>${hdEsc(used)} GB used</p>${health ? `<p data-hd-drive-health>Drive health: <strong>${hdEsc(health.status || '')}</strong>${health.note ? ` <span class="muted">${hdEsc(health.note)}</span>` : ''}</p>` : ''}</div></div>
    <div class="card"><div class="card-header"><strong>What is using space</strong></div><div class="card-body"><ul class="hd-list">${categories.map(item => `<li>${hdEsc(item.name)} <span class="muted">${hdEsc(hdWinRound(item.gb))} GB</span></li>`).join('')}</ul></div></div>
    ${temp.length ? `<div class="card"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Temporary files</strong><span class="muted">${hdEsc(tempGb)} GB</span></div><div class="card-body"><ul class="hd-list">${rows}</ul><button type="button" class="btn btn-primary btn-sm" ${locked} data-hd-temp-remove onclick="hdWinTempRemove(${name})">Remove files</button></div></div>` : ''}
    </div>`;
};

// Settings › Windows Update, and Restart (also on the Windows Desktop).
function hdWinRestart(computerName) {
  hdMachineChange(computerName, machine => {
    // A machineTools Prove shift shows Restart on every computer; it works on each.
    if (!hdWinHas(machine, 'restart')) return false;
    const updates = hdWinUpdates(machine);
    const finished = !!(updates && updates.restartRequired);
    if (finished) {
      updates.restartRequired = false;
      if (updates.pending && typeof updates.pending === 'object') {
        updates.history = [{ ...updates.pending, date:'Today', status:'Successfully installed' }, ...(Array.isArray(updates.history) ? updates.history : [])];
        updates.pending = null;
      }
      updates.lastInstalledDaysAgo = 0;
    }
    machine.uptimeDays = 0;
    // Console B: every earlier boot, newest first, so Event ID 100 still
    // shows the first (slow) boot after two or more restarts.
    if (typeof machine.bootSeconds === 'number') {
      const earlier = Array.isArray(machine.bootHistory) ? machine.bootHistory : [];
      machine.bootHistory = [{ seconds:machine.bootSeconds, restart:Number(machine.restarts) > 0 }, ...earlier].slice(0, 10);
    }
    if (typeof machine.bootSecondsAfterFix === 'number') {
      if (typeof machine.bootSeconds === 'number') machine.lastBootSeconds = machine.bootSeconds;
      // Console B: bootSecondsAfterFixNeeds: { freePercent } keeps the slow
      // boot until C: has that much free, so a restart alone isn't the fix.
      const needs = machine.bootSecondsAfterFixNeeds && typeof machine.bootSecondsAfterFixNeeds === 'object' ? machine.bootSecondsAfterFixNeeds : null;
      const spaceFreed = !needs || !(Number(needs.freePercent) > 0) || hdWinFreePercent(hdWinStorage(machine)) >= Number(needs.freePercent);
      // Module 5 (Prove It): startupOff: [names] keeps the slow boot until each
      // named startup app is Disabled or gone (Uninstall removes its entry).
      const startupOff = !needs || !Array.isArray(needs.startupOff) || needs.startupOff.every(appName => !hdWinList(machine, 'startupApps').some(app => app.name === appName && app.status !== 'Disabled'));
      // A startup app can be turned back on, so with startupOff the boot
      // goes back to the first (slow) time when the condition stops holding.
      if (needs && Array.isArray(needs.startupOff) && typeof machine.bootSecondsSlow !== 'number' && typeof machine.bootSeconds === 'number') machine.bootSecondsSlow = machine.bootSeconds;
      if (spaceFreed && startupOff) machine.bootSeconds = machine.bootSecondsAfterFix;
      else if (typeof machine.bootSecondsSlow === 'number') machine.bootSeconds = machine.bootSecondsSlow;
    }
    machine.restarts = (Number(machine.restarts) || 0) + 1;
    // Console B: a restart leaves Safe Mode, and clears a temporary profile
    // only when the machine says a restart fixes it (restartClears).
    const fromSafeMode = machine.safeMode === true;
    if (fromSafeMode) { machine.safeMode = false; machine.safeModeOption = ''; }
    if (machine.recoveryStep) machine.recoveryStep = 'recovery';
    // A restart adds a boot event, so an open event's row number moves.
    if (hdState.eventLog && typeof hdState.eventLog === 'object') hdState.eventLog = { ...hdState.eventLog, open:null };
    const profile = hdWinProfile(machine);
    if (profile && profile.temporary && profile.restartClears === true) profile.temporary = false;
    hdMachineAction(computerName, 'restart', finished ? 'restarted the computer to finish the update' : fromSafeMode ? 'restarted the computer out of Safe Mode' : 'restarted the computer', { finishedUpdate:finished, ...(fromSafeMode ? { fromSafeMode:true } : {}) });
    if (typeof toast === 'function' && !HD_PROVE) toast(`${computerName} restarted.`);
  });
}
VIEWS['helpdesk/settings-update'] = () => {
  const found = hdWinScreen('settings-update'); if (!found) return hdMachineMissing('Windows Update');
  const { computer, machine } = found; const updates = hdWinUpdates(machine);
  if (!updates) return hdMachineMissing('Windows Update');
  const name = `'${hdJsArg(computer.name)}'`;
  const locked = hdProveLocked() ? 'disabled' : '';
  const days = Number(updates.lastInstalledDaysAgo);
  const last = Number.isFinite(days) ? (days === 0 ? 'Today' : `${days} day${days === 1 ? '' : 's'} ago`) : 'Unknown';
  const pending = updates.pending && typeof updates.pending === 'object' ? updates.pending : null;
  const status = updates.restartRequired
    ? `<div class="callout warning" data-hd-update-status="restart"><strong>Restart required</strong>${pending ? `<p>${hdEsc(pending.name || '')}${pending.kb ? ` (${hdEsc(pending.kb)})` : ''}${pending.downloaded ? ` · downloaded ${hdEsc(pending.downloaded)}` : ''}</p>` : ''}<p>Your device will restart to finish installing.</p><button type="button" class="btn btn-primary btn-sm" ${locked} onclick="hdWinRestart(${name})">Restart now</button></div>`
    : pending
      ? `<div class="callout info" data-hd-update-status="pending"><strong>Updates available</strong><p>${hdEsc(pending.name || '')}${pending.kb ? ` (${hdEsc(pending.kb)})` : ''} · Pending install</p></div>`
      : `<div class="callout info" data-hd-update-status="current"><strong>You're up to date</strong></div>`;
  const history = (Array.isArray(updates.history) ? updates.history : []).filter(item => item && typeof item === 'object');
  const uptime = typeof machine.uptimeDays === 'number' ? (machine.uptimeDays === 0 ? 'Less than a day' : `${machine.uptimeDays} day${machine.uptimeDays === 1 ? '' : 's'}`) : '';
  return `${hdPageHeader('Windows Update', `Settings › Windows Update · ${computer.name}`, hdMachineBack(computer))}<div class="hd-settings-view" data-hd-windows-update>
    <div class="card"><div class="card-body">${status}<dl class="hd-dl"><dt>Last update installed</dt><dd data-hd-last-installed>${hdEsc(last)}</dd>${uptime ? `<dt>Time since last restart</dt><dd data-hd-uptime>${hdEsc(uptime)}</dd>` : ''}</dl></div></div>
    <div class="card"><div class="card-header"><strong>Update history</strong></div><div class="table-wrap"><table><thead><tr><th>Update</th><th>Date</th><th>Status</th></tr></thead><tbody>${history.map(item => `<tr><td>${hdEsc(item.name || '')}${item.kb ? ` (${hdEsc(item.kb)})` : ''}</td><td>${hdEsc(item.date || '')}</td><td>${hdEsc(item.status || '')}</td></tr>`).join('') || '<tr><td colspan="3" class="muted">No updates listed.</td></tr>'}</tbody></table></div></div>
    </div>`;
};

// Settings › Apps › Installed apps, with Uninstall.
function hdWinUninstall(computerName, appName) {
  if (hdProveLocked()) return;
  if (typeof confirm === 'function' && !confirm(`Uninstall ${appName}? This app and its related info will be uninstalled.`)) return;
  hdMachineChange(computerName, machine => {
    const app = hdWinList(machine, 'installedApps').find(item => item.name === appName); if (!app) return false;
    hdWinRemoveApp(machine, computerName, app, `uninstalled ${appName}`);
  });
}
// Removes an installed app and its startup entry, and records it. Shared by
// Uninstall on the screen and winget uninstall (same action, same detail).
function hdWinRemoveApp(machine, computerName, app, label) {
  machine.installedApps = machine.installedApps.filter(item => item !== app);
  const startup = typeof app.startup === 'string' && app.startup ? app.startup : app.name;
  if (Array.isArray(machine.startupApps)) machine.startupApps = machine.startupApps.filter(item => !item || item.name !== startup);
  hdMachineAction(computerName, 'app-uninstalled', label, { app:app.name });
}

/* ---------- Software install tools (added for Module 6, key its-07), console A ----------
 * Installed apps' Repair, Modify and Reset; Settings › Apps › Default apps;
 * Company Portal; and the five winget lines. Each is off unless the machine
 * has the key it reads (see the machine-state list above). Install, upgrade
 * and uninstall from a screen or from winget call the same functions and
 * record the same action (app-installed, app-upgraded, app-uninstalled), so
 * a ticket can't tell the two routes apart. */
function hdWinAppRepair(app) { return app && app.repair && typeof app.repair === 'object' && app.repair.available !== false ? app.repair : null; }
function hdWinAppReset(app) { return app && app.reset && typeof app.reset === 'object' && app.reset.available !== false ? app.reset : null; }
function hdWinAppHasOptions(app) { return !!(hdWinAppRepair(app) || hdWinAppReset(app)); }
function hdWinAppByName(machine, appName) { return hdWinList(machine, 'installedApps').find(item => item.name === appName) || null; }
// The upgrade winget lists for an app, or null (afterRepair waits for Repair).
function hdWinUpgradeShown(app) {
  const upgrade = app && app.upgrade && typeof app.upgrade === 'object' && app.upgrade.version ? app.upgrade : null;
  if (!upgrade) return null;
  if (upgrade.afterRepair && !(app.repair && app.repair.repaired === true)) return null;
  return upgrade;
}
function hdWinAppOptions(computerName, appName) {
  const machine = hdFeatureMachine(computerName); const app = hdWinAppByName(machine, appName);
  if (!app || !hdWinAppHasOptions(app)) return;
  const view = hdMachineView();
  hdState.machineView = { ...view, computer:computerName, app:view.app === appName ? '' : appName };
  hdSave(); render();
}
function hdWinRepairApp(computerName, appName, mode) {
  if (!['repair', 'online'].includes(mode)) return;
  hdMachineChange(computerName, machine => {
    const app = hdWinAppByName(machine, appName); const repair = hdWinAppRepair(app); if (!repair) return false;
    const modify = repair.via === 'modify';
    if (mode === 'online' && !modify) return false;
    const wasBroken = !!repair.broken;
    repair.broken = '';
    repair.repaired = true;
    hdMachineAction(computerName, 'app-repaired', `repaired ${appName} (${modify ? `Modify › ${mode === 'online' ? 'Online repair' : 'Repair'}` : 'Advanced options › Repair'})`, { app:appName, mode, wasBroken });
  });
}
function hdWinResetApp(computerName, appName) {
  if (hdProveLocked()) return;
  if (typeof confirm === 'function' && !confirm(`Reset ${appName}? This permanently deletes the app's data on this device, including its settings and sign-in details.`)) return;
  hdMachineChange(computerName, machine => {
    const app = hdWinAppByName(machine, appName); const reset = hdWinAppReset(app); if (!reset) return false;
    reset.done = true;
    hdMachineAction(computerName, 'app-reset', `reset ${appName} (Advanced options › Reset)`, { app:appName });
  });
}
// The Advanced options or Modify panel for the open app.
function hdWinAppPanel(computer, machine, locked) {
  const app = hdWinAppByName(machine, hdMachineView().app); if (!app || !hdWinAppHasOptions(app)) return '';
  const n = `'${hdJsArg(computer.name)}'`; const a = `'${hdJsArg(app.name)}'`;
  const repair = hdWinAppRepair(app); const reset = hdWinAppReset(app);
  const done = repair && repair.repaired ? ` <span data-hd-repaired>✓${repair.fixedText ? ` ${hdEsc(repair.fixedText)}` : ''}</span>` : '';
  const close = `<button type="button" class="btn btn-ghost btn-sm" onclick="hdWinAppOptions(${n},${a})">Close</button>`;
  if (repair && repair.via === 'modify') {
    return `<div class="card" data-hd-app-modify="${hdEsc(app.name)}"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Modify · ${hdEsc(app.name)}</strong>${close}</div><div class="card-body"><p>How do you want to repair this app?</p><ul class="hd-list"><li><button type="button" class="btn btn-secondary btn-sm" ${locked} data-hd-repair="repair" onclick="hdWinRepairApp(${n},${a},'repair')">Repair</button> <span class="muted">Fixes most problems quickly, offline.</span></li><li><button type="button" class="btn btn-secondary btn-sm" ${locked} data-hd-repair="online" onclick="hdWinRepairApp(${n},${a},'online')">Online repair</button> <span class="muted">A fuller repair that downloads the app again. It takes longer.</span></li></ul>${done}</div></div>`;
  }
  return `<div class="card" data-hd-app-advanced="${hdEsc(app.name)}"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>${hdEsc(app.name)} › Advanced options</strong>${close}</div><div class="card-body">${repair ? `<p><strong>Repair</strong><br><span class="muted">If this app isn't working right, Windows can try to repair it. The app's data stays.</span></p><p><button type="button" class="btn btn-secondary btn-sm" ${locked} data-hd-repair="repair" onclick="hdWinRepairApp(${n},${a},'repair')">Repair</button>${done}</p>` : ''}${reset ? `<p><strong>Reset</strong><br><span class="muted">If it still isn't working right, reset it. The app's data is deleted.</span></p><p><button type="button" class="btn btn-secondary btn-sm" ${locked} data-hd-reset-app onclick="hdWinResetApp(${n},${a})">Reset</button>${reset.done ? ' <span data-hd-reset-done>✓</span>' : ''}</p>` : ''}</div></div>`;
}
VIEWS['helpdesk/settings-apps'] = () => {
  const found = hdWinScreen('settings-apps'); if (!found || !Array.isArray(found.machine.installedApps)) return hdMachineMissing('Installed apps');
  const { computer, machine } = found;
  const name = `'${hdJsArg(computer.name)}'`;
  const locked = hdProveLocked() ? 'disabled' : '';
  const apps = hdWinList(machine, 'installedApps').slice().sort((a, b) => String(a.name).localeCompare(String(b.name)));
  // An app with repair or reset gets an Advanced options (or Modify) button
  // before Uninstall; every other row is exactly Module 5's.
  const options = (app) => hdWinAppHasOptions(app) ? `<button type="button" class="btn btn-secondary btn-sm" ${locked} data-hd-app-options="${hdEsc(app.name)}" aria-label="${hdWinAppRepair(app) && hdWinAppRepair(app).via === 'modify' ? 'Modify' : 'Advanced options'}: ${hdEsc(app.name)}" onclick="hdWinAppOptions(${name},'${hdJsArg(app.name)}')">${hdWinAppRepair(app) && hdWinAppRepair(app).via === 'modify' ? 'Modify' : 'Advanced options'}</button> ` : '';
  return `${hdPageHeader('Installed apps', `Settings › Apps › Installed apps · ${computer.name}`, hdMachineBack(computer))}${hdWinAppPanel(computer, machine, locked)}<div class="card" data-hd-installed-apps><div class="card-header" ${HD_CONSOLE_HEADER}><strong>${apps.length} app${apps.length === 1 ? '' : 's'} found</strong></div><div class="table-wrap"><table><thead><tr><th>App</th><th>Publisher</th><th>Version</th><th>Installed</th><th></th></tr></thead><tbody>${apps.map(app => `<tr data-hd-app="${hdEsc(app.name)}"><td>${hdEsc(app.name)}${app.sizeMb ? ` <span class="muted">${hdEsc(app.sizeMb)} MB</span>` : ''}</td><td>${hdEsc(app.publisher || '')}</td><td>${hdEsc(app.version || '')}</td><td>${hdEsc(app.installed || '')}</td><td>${options(app)}<button type="button" class="btn btn-secondary btn-sm" ${locked} onclick="hdWinUninstall(${name},'${hdJsArg(app.name)}')">Uninstall</button></td></tr>`).join('') || '<tr><td colspan="5" class="muted">No apps listed.</td></tr>'}</tbody></table></div></div>`;
};

// Settings › Apps › Default apps: each file type and the app that opens it.
// Change offers the current app and every installed app whose opens lists
// the type, in name order (so the order never points at one). Set default
// records the choice; moving through the list records nothing.
function hdWinDefaults(machine) { return machine && machine.defaultApps && typeof machine.defaultApps === 'object' && !Array.isArray(machine.defaultApps) ? machine.defaultApps : null; }
function hdWinDefaultChoices(machine, type) {
  const current = String((hdWinDefaults(machine) || {})[type] || '');
  const able = hdWinList(machine, 'installedApps').filter(app => Array.isArray(app.opens) && app.opens.some(item => String(item).toLowerCase() === type.toLowerCase())).map(app => String(app.name));
  return [...new Set([current, ...able].filter(Boolean))].sort((a, b) => a.localeCompare(b));
}
function hdWinSetDefaultFrom(computerName, type, elementId) {
  const el = document.getElementById(String(elementId));
  hdWinSetDefault(computerName, type, String(el ? el.value : ''));
}
function hdWinSetDefault(computerName, type, appName) {
  hdMachineChange(computerName, machine => {
    const defaults = hdWinDefaults(machine); if (!defaults || !hdOwn(defaults, type)) return false;
    if (defaults[type] === appName || !hdWinDefaultChoices(machine, type).includes(appName)) return false;
    defaults[type] = appName;
    hdMachineAction(computerName, 'default-app-set', `set ${type} files to open with ${appName} (Settings › Apps › Default apps)`, { fileType:type, app:appName });
  });
}
VIEWS['helpdesk/default-apps'] = () => {
  const found = hdWinScreen('default-apps'); const defaults = found && hdWinDefaults(found.machine);
  if (!defaults) return hdMachineMissing('Default apps');
  const { computer, machine } = found; const n = `'${hdJsArg(computer.name)}'`;
  const locked = hdProveLocked() ? 'disabled' : '';
  const types = Object.keys(defaults).sort();
  const rows = types.map((type, index) => {
    const current = String(defaults[type] || '');
    const choices = hdWinDefaultChoices(machine, type);
    const id = `hd-default-${index}`;
    return `<tr data-hd-default="${hdEsc(type)}"><td><strong>${hdEsc(type)}</strong></td><td data-hd-default-app>${hdEsc(current || 'Choose a default')}</td><td><label>Change <select id="${id}" class="select" ${locked} data-hd-default-change="${hdEsc(type)}">${current ? '' : '<option value="" selected disabled>Choose…</option>'}${choices.map(app => `<option ${app === current ? 'selected' : ''}>${hdEsc(app)}</option>`).join('')}</select></label> <button type="button" class="btn btn-secondary btn-sm" ${locked} data-hd-default-set="${hdEsc(type)}" onclick="hdWinSetDefaultFrom(${n},'${hdJsArg(type)}','${id}')">Set default</button></td></tr>`;
  }).join('');
  return `${hdPageHeader('Default apps', `Settings › Apps › Default apps · ${computer.name}`, hdMachineBack(computer))}<div class="card" data-hd-default-apps><div class="card-header"><strong>Choose a default by file type</strong></div><div class="table-wrap"><table><thead><tr><th>File type</th><th>Opens with</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="3" class="muted">No file types listed.</td></tr>'}</tbody></table></div></div>`;
};

// Installs a Software Catalog app, from Company Portal or winget.
function hdWinInstallEntry(machine, computerName, entry, label) {
  if (!Array.isArray(machine.installedApps)) machine.installedApps = [];
  machine.installedApps.push({ name:entry.name, publisher:entry.publisher || '', version:entry.version || '', installed:'Today', ...(entry.wingetId ? { wingetId:entry.wingetId } : {}) });
  hdMachineAction(computerName, 'app-installed', label, { app:entry.name });
}
function hdWinIsInstalled(machine, appName) { return hdWinList(machine, 'installedApps').some(app => String(app.name).toLowerCase() === String(appName).toLowerCase()); }
function hdWinPortalInstall(computerName, appName) {
  hdMachineChange(computerName, machine => {
    if (machine.companyPortal !== true) return false;
    const entry = hdSoftwareCatalog(machine).find(item => item && item.name === appName);
    if (!entry || hdWinIsInstalled(machine, entry.name)) return false;
    hdWinInstallEntry(machine, computerName, entry, `installed ${entry.name} from Company Portal`);
  });
}
VIEWS['helpdesk/company-portal'] = () => {
  const found = hdWinScreen('company-portal');
  if (!found || found.machine.companyPortal !== true) return hdMachineMissing('Company Portal');
  const { computer, machine } = found; const n = `'${hdJsArg(computer.name)}'`;
  const locked = hdProveLocked() ? 'disabled' : '';
  const q = String(hdMachineView().q || '').toLowerCase();
  const all = hdSoftwareCatalog(machine).filter(item => item && item.name).slice().sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const rows = all.filter(item => !q || `${item.name} ${item.publisher || ''}`.toLowerCase().includes(q));
  // The admin-password line is Practice help; a Prove It shows the plain title.
  return `${hdPageHeader('Company Portal', HD_PROVE ? 'Apps from the Software Catalog.' : 'Apps from the Software Catalog. Install them yourself, with no admin password.', hdMachineBack(computer))}<form class="filterbar" onsubmit="hdWinCatalogFilter(event,'${hdJsArg(computer.name)}','hd-portal-q')"><label>Search apps <input id="hd-portal-q" class="ipt" maxlength="60" value="${hdEsc(hdMachineView().q || '')}" placeholder="App or publisher"></label><button class="btn btn-primary btn-sm" type="submit">Search</button><span class="muted">${rows.length} of ${all.length} shown</span></form><div class="card" data-hd-company-portal><div class="table-wrap"><table><thead><tr><th>App</th><th>Publisher</th><th>Version</th><th></th></tr></thead><tbody>${rows.map(item => `<tr data-hd-portal-app="${hdEsc(item.name)}"><td>${hdEsc(item.name)}</td><td>${hdEsc(item.publisher || '')}</td><td>${hdEsc(item.version || 'Latest')}</td><td>${hdWinIsInstalled(machine, item.name) ? '<span class="muted" data-hd-portal-installed>Installed</span>' : `<button type="button" class="btn btn-primary btn-sm" ${locked} data-hd-portal-install onclick="hdWinPortalInstall(${n},'${hdJsArg(item.name)}')">Install</button>`}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">No app matches this search.</td></tr>'}</tbody></table></div></div>`;
};

// The Software Catalog: the approved apps, read-only.
function hdSoftwareCatalog(machine) {
  if (machine && Array.isArray(machine.catalog)) return machine.catalog;
  if (HD_PROVE && Array.isArray(HD_PROVE.shift.catalog)) return HD_PROVE.shift.catalog;
  return typeof HD_SOFTWARE_CATALOG !== 'undefined' && Array.isArray(HD_SOFTWARE_CATALOG) ? HD_SOFTWARE_CATALOG : [];
}
function hdWinCatalogFilter(event, computerName, inputId) {
  if (event && event.preventDefault) event.preventDefault();
  const el = document.getElementById(inputId === 'hd-portal-q' ? 'hd-portal-q' : 'hd-catalog-q');
  hdState.machineView = { ...hdMachineView(), computer:computerName, q:String(el ? el.value : '').trim().slice(0, 60) };
  hdSave(); render();
}
VIEWS['helpdesk/software-catalog'] = () => {
  const found = hdWinScreen('software-catalog'); if (!found) return hdMachineMissing('Software Catalog');
  const { computer, machine } = found;
  const q = String(hdMachineView().q || '').toLowerCase();
  const all = hdSoftwareCatalog(machine).filter(item => item && item.name).slice().sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const rows = all.filter(item => !q || `${item.name} ${item.publisher || ''}`.toLowerCase().includes(q));
  return `${hdPageHeader('Software Catalog', 'Apps approved for Northstar computers. Read-only.', hdMachineBack(computer))}<form class="filterbar" onsubmit="hdWinCatalogFilter(event,'${hdJsArg(computer.name)}')"><label>Search <input id="hd-catalog-q" class="ipt" maxlength="60" value="${hdEsc(hdMachineView().q || '')}" placeholder="App or publisher"></label><button class="btn btn-primary btn-sm" type="submit">Search</button><span class="muted">${rows.length} of ${all.length} shown</span></form><div class="card" data-hd-catalog><div class="table-wrap"><table><thead><tr><th>App</th><th>Publisher</th><th>Approved version</th><th>Notes</th></tr></thead><tbody>${rows.map(item => `<tr data-hd-catalog-app="${hdEsc(item.name)}"><td>${hdEsc(item.name)}</td><td>${hdEsc(item.publisher || '')}</td><td>${hdEsc(item.version || 'Any supported')}</td><td>${hdEsc(item.note || '')}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">No approved app matches this search.</td></tr>'}</tbody></table></div></div>`;
};

// The optional PowerShell lines, from the machine state; null otherwise, so
// today's answers stay as they were.
function hdWinFirst(normalized, fallback) { const match = /select-object -first (\d+)/.exec(normalized); return match ? Math.max(1, Math.min(50, Number(match[1]))) : fallback; }
function hdWinCommand(command, normalized, machine, computerName) {
  const winget = hdWinWinget(command, machine, computerName);
  if (winget !== null) return winget;
  const defender = hdWinDefenderCommand(command, normalized, machine, computerName);
  if (defender !== null) return defender;
  const typed = hdWinTypedCommand(command, normalized, machine);
  if (typed !== null) return typed;
  const processes = hdWinList(machine, 'processes');
  if (processes.length && /^get-process(\s*\||$)/.test(normalized)) {
    const rows = processes.slice();
    const sort = /sort-object (-property )?(cpu|ws|workingset|pm)\b/.exec(normalized);
    if (sort) rows.sort((a, b) => sort[2] === 'cpu' ? Number(b.cpu || 0) - Number(a.cpu || 0) : Number(b.memory || 0) - Number(a.memory || 0));
    if (sort && !/-descending/.test(normalized)) rows.reverse();
    const shown = rows.slice(0, hdWinFirst(normalized, rows.length));
    return ['Name                           CPU WorkingSet', '----                           --- ----------', ...shown.map(p => `${String(p.name).padEnd(30)} ${String(p.cpu || 0).padStart(3)} ${String(Math.round(Number(p.memory || 0) * 1048576)).padStart(10)}`)].join('\n');
  }
  const startup = hdWinList(machine, 'startupApps');
  if (startup.length && /^get-ciminstance (-classname )?win32_startupcommand\b/.test(normalized)) {
    return ['Name                                Command                                                   Location', '----                                -------                                                   --------',
      ...startup.map(app => `${String(app.name).padEnd(35)} ${String(app.command || `"C:\\Program Files\\${app.name}\\${String(app.name).replace(/\s+/g, '')}.exe"`).padEnd(57)} ${app.location || 'HKU\\S-1-5-21\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run'}`)].join('\n');
  }
  const storage = hdWinStorage(machine);
  if (storage && /^get-volume( -driveletter c:?)?(\s*\|.*)?$/.test(normalized)) {
    const free = Number(storage.freeGb || 0); const size = Number(storage.sizeGb);
    if (/select-object/.test(normalized)) {
      return ['SizeRemaining         Size', '-------------         ----', `${String(Math.round(free * 1073741824)).padEnd(21)} ${Math.round(size * 1073741824)}`].join('\n');
    }
    const health = storage.driveHealth && typeof storage.driveHealth === 'object' ? storage.driveHealth.status : storage.driveHealth;
    return ['DriveLetter FileSystemLabel HealthStatus SizeRemaining     Size', `C           Windows         ${String(health === 'Good' || !health ? 'Healthy' : 'Warning').padEnd(12)} ${`${hdWinRound(free)} GB`.padEnd(17)} ${size} GB`].join('\n');
  }
  const updates = hdWinUpdates(machine);
  if (updates && /^get-hotfix(\s*\||$)/.test(normalized)) {
    const installed = (Array.isArray(updates.history) ? updates.history : []).filter(item => item && item.kb && /install/i.test(String(item.status || '')));
    const shown = installed.slice(0, hdWinFirst(normalized, installed.length));
    return ['Source        Description      HotFixID      InstalledBy          InstalledOn', '------        -----------      --------      -----------          -----------',
      ...shown.map(item => `${String(computerName || '').padEnd(13)} ${String(item.description || 'Update').padEnd(16)} ${String(item.kb).padEnd(13)} ${'NT AUTHORITY\\SYSTEM'.padEnd(20)} ${item.date || ''}`)].join('\n');
  }
  return null;
}
/* The five winget lines (Module 6, key its-07), on a machine with
 * winget: true (in a machineTools Prove shift, on every computer when any
 * has it). Any letter case; quotes and the extra options below are allowed.
 * Packages are the Software Catalog entries that have a wingetId; an
 * installed app matches by its wingetId (or its catalog entry's) or name.
 * Compared as lowercase strings, never as patterns. */
const HD_WINGET_COMMANDS = { search:'search', find:'search', install:'install', add:'install', upgrade:'upgrade', update:'upgrade', uninstall:'uninstall', remove:'uninstall', rm:'uninstall' };
const HD_WINGET_OTHER = ['list', 'ls', 'show', 'view', 'source', 'settings', 'config', 'features', 'export', 'import', 'pin', 'configure', 'configuration', 'download', 'repair', 'hash', 'validate', 'complete', 'dscv3', 'mcp'];
const HD_WINGET_VALUE = ['--id', '--name', '--query', '-q', '--source', '-s', '--scope', '--version', '-v', '--architecture', '-a', '--locale', '--count', '-n'];
const HD_WINGET_FLAGS = ['-e', '--exact', '--accept-source-agreements', '--accept-package-agreements', '--disable-interactivity', '-h', '--silent', '--force', '--all', '-r', '--recurse', '--include-unknown', '-u', '--unknown'];
const HD_WINGET_LINES = 'winget search <name>, winget install --id <ID> -e, winget upgrade, winget upgrade --id <ID> -e, winget uninstall --id <ID> -e';
const HD_WINGET_NONE = 'No package found matching input criteria.';
const HD_WINGET_NOT_INSTALLED = 'No installed package found matching input criteria.';
function hdWingetTokens(command) { return (String(command).trim().match(/"[^"]*"|'[^']*'|\S+/g) || []).map(token => token.replace(/^["']|["']$/g, '')); }
function hdWingetIdOf(machine, app) {
  if (app && app.wingetId) return String(app.wingetId);
  const entry = hdSoftwareCatalog(machine).find(item => item && item.wingetId && String(item.name).toLowerCase() === String(app && app.name).toLowerCase());
  return entry ? String(entry.wingetId) : '';
}
function hdWingetTable(head, rows) {
  const widths = head.map((title, i) => Math.max(title.length, ...rows.map(row => String(row[i]).length)));
  const line = (cells) => cells.map((cell, i) => (i === cells.length - 1 ? String(cell) : String(cell).padEnd(widths[i]))).join(' ');
  return [line(head), '-'.repeat(widths.reduce((sum, w) => sum + w + 1, -1)), ...rows.map(line)].join('\n');
}
// What the user typed to name the package: { field:'id'|'name'|'query', value }.
function hdWingetMatch(item, target, exact) {
  const value = target.value.toLowerCase();
  const fields = target.field === 'id' ? [item.id] : target.field === 'name' ? [item.name] : [item.id, item.name];
  return fields.some(field => { const text = String(field || '').toLowerCase(); return !!text && (exact ? text === value : text.includes(value)); });
}
function hdWingetPick(items, target, exact) {
  const found = items.filter(item => hdWingetMatch(item, target, exact));
  // Without -e, an exact Id or name still wins over partial matches.
  if (found.length > 1 && !exact) { const strict = found.filter(item => hdWingetMatch(item, target, true)); if (strict.length === 1) return strict; }
  return found;
}
function hdWingetPractice(text, hint) { return HD_PROVE ? text : `${text}\n${hint}`; }
function hdWinWinget(command, machine, computerName) {
  const tokens = hdWingetTokens(command);
  const head = String(tokens[0] || '').toLowerCase().replace(/\.exe$/, '');
  if (head !== 'winget' || !hdWinHas(machine, 'winget')) return null;
  const typedSub = String(tokens[1] || '').toLowerCase();
  // The supported lines are a Practice hint; a Prove It never lists them.
  if (!typedSub) { hdLastCommandResult = 'winget: no command'; return hdWingetPractice('Windows Package Manager\nUsage: winget <command> [<options>]', `Supported here: ${HD_WINGET_LINES}`); }
  const sub = HD_WINGET_COMMANDS[typedSub];
  if (!sub) {
    if (HD_WINGET_OTHER.includes(typedSub)) { hdLastCommandResult = `winget ${typedSub}: not in this training shell`; return hdWingetPractice(`winget ${typedSub} isn't part of this training shell.`, `Supported here: ${HD_WINGET_LINES}`); }
    hdLastCommandResult = `winget: unrecognized command ${typedSub}`;
    return hdWingetPractice(`Unrecognized command: '${tokens[1]}'`, `Did you mean: ${HD_WINGET_LINES}`);
  }
  // Options: values for --id and the rest, flags, and one bare query.
  const opts = {}; const flags = new Set(); let query = '';
  for (let i = 2; i < tokens.length; i += 1) {
    const raw = tokens[i]; const word = raw.toLowerCase();
    const eq = /^(--?[a-z-]+)=(.*)$/.exec(raw);
    const name = eq ? eq[1].toLowerCase() : word;
    if (HD_WINGET_VALUE.includes(name)) {
      const value = eq ? eq[2] : tokens[i + 1];
      if (!eq) i += 1;
      if (value === undefined || value === '') { hdLastCommandResult = `winget ${sub}: missing value for ${name}`; return hdWingetPractice(`Argument value missing: '${name}'`, `Did you mean: winget ${sub === 'upgrade' ? 'upgrade --id <ID> -e' : `${sub} --id <ID> -e`}`); }
      opts[{ '-q':'--query', '-s':'--source', '-v':'--version', '-a':'--architecture', '-n':'--count' }[name] || name] = value;
    } else if (HD_WINGET_FLAGS.includes(name)) {
      flags.add({ '--exact':'-e', '--silent':'-h', '--recurse':'--all', '-r':'--all', '-u':'--include-unknown', '--unknown':'--include-unknown' }[name] || name);
    } else if (!raw.startsWith('-') && !query) {
      query = raw;
    } else {
      hdLastCommandResult = `winget ${sub}: unrecognized option ${raw}`;
      return hdWingetPractice(`Argument name was not recognized for the current command: '${raw}'`, `Did you mean: ${HD_WINGET_LINES}`);
    }
  }
  const exact = flags.has('-e');
  const target = opts['--id'] ? { field:'id', value:opts['--id'] } : opts['--name'] ? { field:'name', value:opts['--name'] } : (opts['--query'] || query) ? { field:'query', value:opts['--query'] || query } : null;
  const packages = hdSoftwareCatalog(machine).filter(item => item && item.name && item.wingetId).map(item => ({ id:String(item.wingetId), name:String(item.name), version:String(item.version || 'Unknown'), entry:item }));
  const installed = hdWinList(machine, 'installedApps').map(app => ({ id:hdWingetIdOf(machine, app), name:String(app.name), version:String(app.version || 'Unknown'), app }));
  const outside = () => hdWingetPractice(HD_WINGET_NONE, 'Apps outside the Software Catalog need a software request.');
  const multiple = (items) => { hdLastCommandResult = `winget ${sub}: more than one match`; return `Multiple packages found matching input criteria. Please refine the input.\n${hdWingetTable(['Name', 'Id', 'Source'], items.map(item => [item.name, item.id || item.name, 'winget']))}`; };
  const changed = () => { hdProveEdited(); };

  if (sub === 'search') {
    if (!target) { hdLastCommandResult = 'winget search: no query'; return hdWingetPractice('No query was given.', 'Name the app, for example: winget search <name>'); }
    const found = hdWingetPick(packages, target, exact);
    if (!found.length) { hdLastCommandResult = `winget search ${target.value}: no package found`; return outside(); }
    hdLastCommandResult = `winget search ${target.value}: ${found.map(item => item.id).join(', ')}`;
    return hdWingetTable(['Name', 'Id', 'Version', 'Source'], found.map(item => [item.name, item.id, item.version, 'winget']));
  }
  if (sub === 'install') {
    if (!target) { hdLastCommandResult = 'winget install: no package named'; return hdWingetPractice('No package was named.', 'Name the app by its Id: winget install --id <ID> -e'); }
    const found = hdWingetPick(packages, target, exact);
    if (!found.length) { hdLastCommandResult = `winget install ${target.value}: no package found`; return outside(); }
    if (found.length > 1) return multiple(found);
    const pkg = found[0];
    if (hdWinIsInstalled(machine, pkg.name)) { hdLastCommandResult = `winget install ${pkg.id}: already installed`; return 'Found an existing package already installed. Trying to upgrade the installed package...\nNo available upgrade found.\nNo newer package versions are available from the configured sources.'; }
    hdWinInstallEntry(machine, computerName, pkg.entry, `installed ${pkg.name} with winget`);
    changed();
    hdLastCommandResult = `winget install ${pkg.id}: installed ${pkg.name} ${pkg.version}`;
    return `Found ${pkg.name} [${pkg.id}] Version ${pkg.version}\nDownloading and verifying the installer...\nStarting package install...\nSuccessfully installed`;
  }
  const upgradeOne = (item) => {
    const upgrade = hdWinUpgradeShown(item.app); const from = item.app.version || '';
    item.app.version = String(upgrade.version);
    item.app.upgrade = null;
    hdMachineAction(computerName, 'app-upgraded', `upgraded ${item.name} from ${from || 'an older version'} to ${item.app.version} with winget`, { app:item.name, from, to:item.app.version });
    return `Found ${item.name} [${item.id}] Version ${item.app.version}\nDownloading and verifying the installer...\nStarting package install...\nSuccessfully installed`;
  };
  if (sub === 'upgrade') {
    const waiting = installed.filter(item => item.id && hdWinUpgradeShown(item.app));
    if (!target && !flags.has('--all')) {
      if (!waiting.length) { hdLastCommandResult = 'winget upgrade: nothing to upgrade'; return HD_WINGET_NOT_INSTALLED; }
      hdLastCommandResult = `winget upgrade: ${waiting.map(item => item.id).join(', ')}`;
      return `${hdWingetTable(['Name', 'Id', 'Version', 'Available', 'Source'], waiting.map(item => [item.name, item.id, item.version, hdWinUpgradeShown(item.app).version, 'winget']))}\n${waiting.length} upgrade${waiting.length === 1 ? '' : 's'} available.`;
    }
    if (!target) {
      if (!waiting.length) { hdLastCommandResult = 'winget upgrade --all: nothing to upgrade'; return HD_WINGET_NOT_INSTALLED; }
      const out = waiting.map(upgradeOne); changed();
      hdLastCommandResult = `winget upgrade --all: upgraded ${waiting.map(item => item.id).join(', ')}`;
      return out.join('\n\n');
    }
    const found = hdWingetPick(installed.filter(item => item.id), target, exact);
    if (!found.length) { hdLastCommandResult = `winget upgrade ${target.value}: not installed`; return HD_WINGET_NOT_INSTALLED; }
    if (found.length > 1) return multiple(found);
    if (!hdWinUpgradeShown(found[0].app)) { hdLastCommandResult = `winget upgrade ${found[0].id}: no upgrade available`; return 'No available upgrade found.\nNo newer package versions are available from the configured sources.'; }
    const out = upgradeOne(found[0]); changed();
    hdLastCommandResult = `winget upgrade ${found[0].id}: upgraded to ${found[0].app.version}`;
    return out;
  }
  // uninstall
  if (!target) { hdLastCommandResult = 'winget uninstall: no package named'; return hdWingetPractice('No package was named.', 'Name the app by its Id: winget uninstall --id <ID> -e'); }
  const found = hdWingetPick(installed, target, exact);
  if (!found.length) { hdLastCommandResult = `winget uninstall ${target.value}: not installed`; return HD_WINGET_NOT_INSTALLED; }
  if (found.length > 1) return multiple(found);
  hdWinRemoveApp(machine, computerName, found[0].app, `uninstalled ${found[0].name} with winget`);
  changed();
  hdLastCommandResult = `winget uninstall ${found[0].id || found[0].name}: uninstalled`;
  return `Found ${found[0].name}${found[0].id ? ` [${found[0].id}]` : ''}\nStarting package uninstall...\nSuccessfully uninstalled`;
}
function hdWinHelp(machine) {
  const lines = [];
  if (hdWinList(machine, 'processes').length) lines.push('Get-Process | Sort-Object CPU -Descending | Select-Object -First 5 Name, CPU, WorkingSet');
  if (hdWinList(machine, 'startupApps').length) lines.push('Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location');
  if (hdWinStorage(machine)) lines.push('Get-Volume -DriveLetter C | Select-Object SizeRemaining, Size');
  if (hdWinUpdates(machine)) lines.push('Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 3');
  return lines.length ? `Windows: ${lines.join(', ')}` : '';
}
window.hdWinTaskTab=hdWinTaskTab; window.hdWinTaskSort=hdWinTaskSort; window.hdWinStartupSet=hdWinStartupSet; window.hdWinTempTick=hdWinTempTick; window.hdWinTempRemove=hdWinTempRemove;
window.hdWinRestart=hdWinRestart; window.hdWinUninstall=hdWinUninstall; window.hdWinCatalogFilter=hdWinCatalogFilter;
window.hdWinAppOptions=hdWinAppOptions; window.hdWinRepairApp=hdWinRepairApp; window.hdWinResetApp=hdWinResetApp; window.hdWinSetDefault=hdWinSetDefault; window.hdWinSetDefaultFrom=hdWinSetDefaultFrom; window.hdWinPortalInstall=hdWinPortalInstall; window.hdWinResetPc=hdWinResetPc;

/* ---------- Security, browser and OneDrive tools (added for Module 6, key its-07), console B ----------
 * Windows Security for one device, the Defender PowerShell lines, the
 * browser's Extensions page, a process a fix removes, and OneDrive. Each is
 * off unless the computer's machine state has the key it reads:
 *   protection: { realtime:bool, definitions:'<when updated>', lastScan,
 *       history:[{ id, name, date, severity, status }],
 *       allowed:[{ id, name, severity? }], exclusions:[paths] }
 *     Windows Security (Security at a glance, Virus & threat protection,
 *     Protection history, Allowed threats). Don't allow on Allowed threats
 *     (threat-unallowed) moves an item to Current threats on Virus & threat
 *     protection, where Remove (threat-removed) acts on it; its history row
 *     becomes Removed. Quick scan (quick-scan) finds the items no
 *     longer allowed and not yet removed; after an extension or a threat was
 *     removed on this computer it also records quick-scan-after-removal.
 *     Turning off real-time protection (realtime-protection-off) and adding
 *     an exclusion (exclusion-added) work as on Windows and are marked
 *     unsafe in the Practice record. A Practice ticket's undoUnsafe undoes
 *     them at once with a line; a Prove It never warns or undoes.
 *   extensions: [{ name, added, publisher? }]; browser?: { name, homePage }
 *     Browser › Extensions. Remove records extension-removed.
 *   processes[].goneWhen: { extensionRemoved?:'<name>', threatRemoved?:'<id>' }
 *     the process leaves Task Manager and Get-Process once every named
 *     removal was made on this computer
 *   oneDrive: { root, storageUsed (percent), linked?, files:[{ name,
 *       folder? ('A\\B', under root) }] }
 *     The full path is root + '\' + folder + '\' + name (no folder: root +
 *     '\' + name), counted in characters. A file can't sync while a name in
 *     it has any of " * : < > ? / \ | or the full path is longer than 400.
 *     Rename (onedrive-renamed) a file or one of its folders (every file
 *     under that folder follows); delete a file (onedrive-file-deleted),
 *     Unlink this PC (onedrive-unlinked), Reset OneDrive (onedrive-reset).
 * Action ids are what the Prove It key matches (action_taken value); keep
 * them stable. Sources: windows-security:<pc> (Security at a glance) and
 * :virus-threat, :protection-history, :allowed-threats;
 * browser-extensions:<pc>; onedrive:<pc>, :sync-problems, :web. */
const HD_DEFENDER_LINES = 'Get-MpComputerStatus, Start-MpScan -ScanType QuickScan, Get-MpThreatDetection';
const HD_UNSAFE_UNDO_LINE = 'Never turn off protection or add an exclusion to make a problem go away. In a graded ticket this is a critical error.';
const HD_ONEDRIVE_BAD = /["*:<>?/\\|]/;
const HD_ONEDRIVE_LIMIT = 400;
function hdWinProtection(machine) { return machine && machine.protection && typeof machine.protection === 'object' && !Array.isArray(machine.protection) ? machine.protection : null; }
function hdWinOneDrive(machine) { return machine && machine.oneDrive && typeof machine.oneDrive === 'object' && !Array.isArray(machine.oneDrive) ? machine.oneDrive : null; }
function hdWinScreenTab(computerName, screen, tab) {
  const meta = HD_WIN_SCREENS[screen]; if (!meta || !meta.tabs || !meta.tabs.some(([id]) => id === tab)) return;
  hdState.machineView = { ...hdMachineView(), computer:computerName, tab, odError:'' };
  hdWinOpened(computerName, screen, tab);
  hdSave(); render();
}
function hdWinTabOf(screen) { const tabs = HD_WIN_SCREENS[screen].tabs; const tab = hdMachineView().tab; return tabs.some(([id]) => id === tab) ? tab : tabs[0][0]; }
// What was removed on this computer (kept on the machine, so a Prove It has it).
function hdWinRemoved(machine) {
  const removed = machine.removed = machine.removed && typeof machine.removed === 'object' ? machine.removed : {};
  removed.extensions = Array.isArray(removed.extensions) ? removed.extensions : [];
  removed.threats = Array.isArray(removed.threats) ? removed.threats : [];
  return removed;
}
// A process whose goneWhen removals were all made leaves the machine.
function hdWinSweepGone(machine) {
  if (!Array.isArray(machine.processes)) return;
  const removed = hdWinRemoved(machine);
  const lower = (list) => list.map(item => String(item).toLowerCase());
  const done = (p) => {
    const when = p && p.goneWhen && typeof p.goneWhen === 'object' ? p.goneWhen : null; if (!when) return false;
    const needs = [];
    if (when.extensionRemoved) needs.push(lower(removed.extensions).includes(String(when.extensionRemoved).toLowerCase()));
    if (when.threatRemoved) needs.push(removed.threats.includes(String(when.threatRemoved)));
    return needs.length > 0 && needs.every(Boolean);
  };
  machine.processes = machine.processes.filter(p => !done(p));
}
// The unsafe changes. undoUnsafe (Practice ticket) puts it back at once.
function hdWinUndoUnsafe(computerName) {
  const ticket = !HD_PROVE && hdMachineTicket(computerName);
  const undo = ticket && hdConsole(ticket).undoUnsafe;
  if (!undo) return '';
  return typeof undo === 'string' && undo.trim() ? undo.trim() : HD_UNSAFE_UNDO_LINE;
}
function hdWinSetRealtime(machine, computerName, on, via) {
  const protection = hdWinProtection(machine); if (!protection || (protection.realtime !== false) === on) return false;
  protection.realtime = on;
  protection.undoneNote = '';
  if (on) { hdMachineAction(computerName, 'realtime-protection-on', `turned real-time protection on (${via})`, { via }); return true; }
  hdMachineAction(computerName, 'realtime-protection-off', `turned off real-time protection (${via})`, { via, unsafe:true });
  const line = hdWinUndoUnsafe(computerName);
  if (line) {
    protection.realtime = true; protection.undoneNote = line;
    const ticket = hdMachineTicket(computerName); if (ticket) hdHistory(ticket, `On ${computerName}: real-time protection turned back on (Practice).`);
    if (typeof toast === 'function') toast(line);
  }
  return true;
}
function hdWinAddExclusion(machine, computerName, path, via) {
  const protection = hdWinProtection(machine); const value = String(path || '').trim().slice(0, 200);
  if (!protection || !value) return false;
  if (!Array.isArray(protection.exclusions)) protection.exclusions = [];
  protection.exclusions.push(value);
  protection.undoneNote = '';
  hdMachineAction(computerName, 'exclusion-added', `added the exclusion ${value} (${via})`, { path:value, via, unsafe:true });
  const line = hdWinUndoUnsafe(computerName);
  if (line) {
    protection.exclusions.pop(); protection.undoneNote = line;
    const ticket = hdMachineTicket(computerName); if (ticket) hdHistory(ticket, `On ${computerName}: the exclusion ${value} removed again (Practice).`);
    if (typeof toast === 'function') toast(line);
  }
  return true;
}
// Items Defender finds now: no longer allowed, not yet removed.
function hdWinThreatsFound(protection) { return hdWinList(protection, 'allowed').filter(item => item.unallowed && !item.removed); }
function hdWinQuickScan(machine, computerName, via) {
  const protection = hdWinProtection(machine); if (!protection) return false;
  const found = hdWinThreatsFound(protection);
  protection.lastScan = 'Just now';
  protection.lastResult = found.length ? `${found.length} threat${found.length === 1 ? '' : 's'} found. Start the recommended actions.` : 'No current threats.';
  protection.undoneNote = '';
  hdMachineAction(computerName, 'quick-scan', `ran a quick scan (${via}): ${protection.lastResult}`, { via, threats:found.length });
  const removed = hdWinRemoved(machine);
  if (removed.extensions.length || removed.threats.length) hdMachineAction(computerName, 'quick-scan-after-removal', `ran a quick scan after the removal (${via})`, { via, threats:found.length });
  return true;
}
function hdWinThreatSet(computerName, id, step) {
  if (!['unallow', 'remove'].includes(step)) return;
  hdMachineChange(computerName, machine => {
    const protection = hdWinProtection(machine);
    const item = hdWinList(protection, 'allowed').find(entry => String(entry.id) === String(id)); if (!item || item.removed) return false;
    protection.undoneNote = '';
    if (step === 'unallow') {
      if (item.unallowed) return false;
      item.unallowed = true;
      hdMachineAction(computerName, 'threat-unallowed', `chose Don't allow for ${item.name} (Windows Security › Allowed threats)`, { threat:String(item.id) });
      return true;
    }
    if (!item.unallowed) return false;
    item.removed = true;
    hdWinList(protection, 'history').filter(entry => String(entry.id) === String(item.id)).forEach(entry => { entry.status = 'Removed'; });
    hdWinRemoved(machine).threats.push(String(item.id));
    hdMachineAction(computerName, 'threat-removed', `removed ${item.name} (Windows Security)`, { threat:String(item.id) });
    hdWinSweepGone(machine);
    return true;
  });
}
function hdWinRealtimeSet(computerName, on) {
  if (hdProveLocked()) return;
  // Practice only: a Prove It asks nothing (the typed line asks nothing either).
  if (!on && !HD_PROVE && typeof confirm === 'function' && !confirm('Turn off real-time protection? Your device will be vulnerable.')) return;
  hdMachineChange(computerName, machine => hdWinSetRealtime(machine, computerName, !!on, 'Windows Security'));
}
function hdWinExclusionFrom(computerName) {
  const el = document.getElementById('hd-exclusion-path');
  const value = String(el ? el.value : '').trim();
  if (!value) { hdState.machineView = { ...hdMachineView(), computer:computerName, exclusionError:'Type the file or folder path to exclude.' }; hdSave(); render(); return; }
  hdState.machineView = { ...hdMachineView(), computer:computerName, exclusionError:'' };
  hdMachineChange(computerName, machine => hdWinAddExclusion(machine, computerName, value, 'Windows Security'));
}
function hdWinScanNow(computerName) { hdMachineChange(computerName, machine => hdWinQuickScan(machine, computerName, 'Windows Security')); }
VIEWS['helpdesk/windows-security'] = () => {
  const found = hdWinScreen('windows-security'); const protection = found && hdWinProtection(found.machine);
  if (!protection) return hdMachineMissing('Windows Security');
  const { computer } = found; const n = `'${hdJsArg(computer.name)}'`;
  const locked = hdProveLocked() ? 'disabled' : '';
  const tab = hdWinTabOf('windows-security');
  const on = protection.realtime !== false;
  // As on Windows: Don't allow takes an item off Allowed threats; Defender
  // then shows it under Current threats, where Remove acts on it.
  const allowed = hdWinList(protection, 'allowed').filter(item => !item.removed && !item.unallowed);
  const current = hdWinThreatsFound(protection);
  const undone = !HD_PROVE && protection.undoneNote ? `<div class="callout warn" role="alert" data-hd-unsafe-undone>${hdEsc(protection.undoneNote)}</div>` : '';
  let body;
  if (tab === 'home') {
    body = `<dl class="hd-dl" data-hd-security-home><dt>Virus &amp; threat protection</dt><dd>${on ? 'No action needed.' : 'Real-time protection is off, leaving your device vulnerable.'}</dd><dt>Protection updates</dt><dd>Security intelligence last updated: ${hdEsc(protection.definitions || 'Unknown')}</dd><dt>Current threats</dt><dd>${current.length ? `${current.length} threat${current.length === 1 ? '' : 's'} found` : 'No current threats.'}</dd></dl>`;
  } else if (tab === 'virus-threat') {
    const exclusions = Array.isArray(protection.exclusions) ? protection.exclusions : [];
    body = `<div data-hd-virus-threat><p><strong>Current threats</strong></p>${current.length ? `<p data-hd-current-threats>Threats found.</p><ul class="hd-list">${current.map(item => `<li data-hd-current-threat="${hdEsc(item.id)}">${hdEsc(item.name || '')}${item.severity ? ` <span class="muted">${hdEsc(item.severity)}</span>` : ''} <button type="button" class="btn btn-secondary btn-sm" ${locked} data-hd-threat-remove onclick="hdWinThreatSet(${n},'${hdJsArg(item.id)}','remove')">Remove</button></li>`).join('')}</ul>` : '<p data-hd-current-threats>No current threats.</p>'}<dl class="hd-dl"><dt>Last scan</dt><dd data-hd-last-scan>${hdEsc(protection.lastScan || 'Never')}${protection.lastResult ? ` · ${hdEsc(protection.lastResult)}` : ''}</dd><dt>Security intelligence</dt><dd data-hd-definitions>Last updated: ${hdEsc(protection.definitions || 'Unknown')}</dd></dl><p><button type="button" class="btn btn-primary btn-sm" ${locked} data-hd-quick-scan onclick="hdWinScanNow(${n})">Quick scan</button></p><p><strong>Virus &amp; threat protection settings</strong></p><p>Real-time protection: <strong data-hd-realtime="${on ? 'on' : 'off'}">${on ? 'On' : 'Off'}</strong> <button type="button" class="btn btn-secondary btn-sm" ${locked} data-hd-realtime-toggle onclick="hdWinRealtimeSet(${n},${on ? 'false' : 'true'})">${on ? 'Turn off' : 'Turn on'}</button></p><p><strong>Exclusions</strong><br><span class="muted">Items you exclude won't be scanned.</span></p><ul class="hd-list" data-hd-exclusions>${exclusions.map(path => `<li><code>${hdEsc(path)}</code></li>`).join('') || '<li class="muted">No exclusions.</li>'}</ul><form class="filterbar" onsubmit="event.preventDefault();hdWinExclusionFrom(${n})"><label>Add an exclusion <input id="hd-exclusion-path" class="ipt" maxlength="200" ${locked} placeholder="File or folder path"></label><button type="submit" class="btn btn-secondary btn-sm" ${locked} data-hd-add-exclusion>Add an exclusion</button></form>${hdMachineView().exclusionError ? `<p class="muted" role="alert">${hdEsc(hdMachineView().exclusionError)}</p>` : ''}</div>`;
  } else if (tab === 'protection-history') {
    const rows = hdWinList(protection, 'history');
    body = `<div class="table-wrap"><table data-hd-protection-history><thead><tr><th>Detected</th><th>Name</th><th>Severity</th><th>Status</th></tr></thead><tbody>${rows.map(item => `<tr data-hd-history-item="${hdEsc(item.id || item.name)}"><td>${hdEsc(item.date || '')}</td><td>${hdEsc(item.name || '')}</td><td>${hdEsc(item.severity || '')}</td><td>${hdEsc(item.status || '')}</td></tr>`).join('') || '<tr><td colspan="4" class="muted" data-hd-history-empty>No recent items. Protection history is empty.</td></tr>'}</tbody></table></div>`;
  } else {
    body = `<p class="muted">Items you've allowed to run on your device.</p><div class="table-wrap"><table data-hd-allowed-threats><thead><tr><th>Name</th><th>Severity</th><th></th></tr></thead><tbody>${allowed.map(item => `<tr data-hd-allowed="${hdEsc(item.id)}"><td>${hdEsc(item.name || '')}</td><td>${hdEsc(item.severity || '')}</td><td><button type="button" class="btn btn-secondary btn-sm" ${locked} data-hd-threat-unallow onclick="hdWinThreatSet(${n},'${hdJsArg(item.id)}','unallow')">Don't allow</button></td></tr>`).join('') || '<tr><td colspan="3" class="muted" data-hd-allowed-empty>There are no allowed threats.</td></tr>'}</tbody></table></div>`;
  }
  return `${hdPageHeader('Windows Security', computer.name, hdMachineBack(computer))}${undone}<div class="card" data-hd-windows-security="${tab}"><div class="card-header" ${HD_CONSOLE_HEADER}>${hdWinTabs(HD_WIN_SCREENS['windows-security'].tabs, tab, id => `hdWinScreenTab(${n},'windows-security','${id}')`)}</div><div class="card-body">${body}</div></div>`;
};

/* The Defender lines, on a computer with protection. The three optional
 * lines show what the screen shows; Start-MpScan, Set-MpPreference and
 * Add-MpPreference make the same change, and record the same action, as the
 * screen's control. Any letter case. In a machineTools Prove shift, a
 * computer without protection answers each line neutrally. */
function hdWinDefenderCommand(command, normalized, machine, computerName) {
  if (!/^(get-mpcomputerstatus|start-mpscan|get-mpthreatdetection|set-mppreference|add-mppreference)\b/.test(normalized)) return null;
  if (!hdWinHas(machine, 'windows-security')) return null;
  const protection = hdWinProtection(machine);
  const verb = normalized.split(/[\s|]/)[0];
  if (!protection) { hdLastCommandResult = `${verb}: nothing to show`; return 'Nothing to show on this computer.'; }
  const changed = () => { hdProveEdited(); };
  if (verb === 'get-mpcomputerstatus') {
    if (!/^get-mpcomputerstatus(\s*\|\s*(select-object|select|format-list|fl)\b.*)?$/.test(normalized)) return null;
    const all = [['AMServiceEnabled', 'True'], ['AntivirusEnabled', 'True'], ['AntivirusSignatureLastUpdated', protection.definitions || 'Unknown'], ['QuickScanEndTime', protection.lastScan || 'Never'], ['RealTimeProtectionEnabled', protection.realtime !== false ? 'True' : 'False']];
    const select = /\|\s*(?:select-object|select)\s+(?:-property\s+)?(.+)$/.exec(normalized);
    const wanted = select ? select[1].split(/[\s,]+/).filter(Boolean) : [];
    const shown = wanted.length && !wanted.includes('*') ? all.filter(([key]) => wanted.includes(key.toLowerCase())) : all;
    hdLastCommandResult = `Get-MpComputerStatus: real-time ${protection.realtime !== false ? 'on' : 'off'}`;
    return hdFormatList(shown.length ? shown : all);
  }
  if (verb === 'start-mpscan') {
    const type = /^start-mpscan(?:\s+-scantype\s+(\S+))?$/.exec(normalized);
    if (!type) return null;
    if (type[1] && !['quickscan', '1'].includes(type[1])) { hdLastCommandResult = 'Start-MpScan: quick scan only'; return 'Start-MpScan : This training shell runs a quick scan only.'; }
    hdWinQuickScan(machine, computerName, 'Start-MpScan'); changed();
    hdLastCommandResult = `Start-MpScan: ${protection.lastResult}`;
    return '';
  }
  if (verb === 'get-mpthreatdetection') {
    if (!/^get-mpthreatdetection(\s*\|.*)?$/.test(normalized)) return null;
    const rows = hdWinList(protection, 'history');
    hdLastCommandResult = `Get-MpThreatDetection: ${rows.length} item${rows.length === 1 ? '' : 's'}`;
    return rows.map(item => hdFormatList([['ActionSuccess', 'True'], ['InitialDetectionTime', item.date || ''], ['ThreatID', item.id || ''], ['ThreatName', item.name || ''], ['SeverityLevel', item.severity || ''], ['ThreatStatus', item.status || '']])).join('\n\n');
  }
  if (verb === 'set-mppreference') {
    const realtime = /^set-mppreference\s+-disablerealtimemonitoring(?::|\s+)\$?(true|false|1|0)$/.exec(normalized);
    if (!realtime) { hdLastCommandResult = 'Set-MpPreference: not in this training shell'; return "Set-MpPreference : That setting isn't part of this training shell."; }
    const off = ['true', '1'].includes(realtime[1]);
    if (hdWinSetRealtime(machine, computerName, !off, 'Set-MpPreference')) changed();
    hdLastCommandResult = `Set-MpPreference: real-time ${off ? 'off' : 'on'}${off && protection.realtime !== false ? ' (undone)' : ''}`;
    return '';
  }
  // add-mppreference: an exclusion path, process or extension.
  const add = /^add-mppreference\s+-exclusion(path|process|extension)\s+(.+)$/i.exec(command.trim());
  if (!add) { hdLastCommandResult = 'Add-MpPreference: not in this training shell'; return "Add-MpPreference : That setting isn't part of this training shell."; }
  const value = add[2].trim().replace(/^["']|["']$/g, '');
  if (hdWinAddExclusion(machine, computerName, value, 'Add-MpPreference')) changed();
  hdLastCommandResult = `Add-MpPreference: exclusion ${value}`;
  return '';
}

// Browser › Extensions: what is installed in the browser, with Remove.
function hdWinRemoveExtension(computerName, name) {
  if (hdProveLocked()) return;
  if (typeof confirm === 'function' && !confirm(`Remove "${name}"?`)) return;
  hdMachineChange(computerName, machine => {
    const item = hdWinList(machine, 'extensions').find(entry => entry.name === name); if (!item) return false;
    machine.extensions = machine.extensions.filter(entry => entry !== item);
    hdWinRemoved(machine).extensions.push(String(item.name));
    hdMachineAction(computerName, 'extension-removed', `removed the browser extension ${item.name}`, { extension:String(item.name) });
    hdWinSweepGone(machine);
  });
}
VIEWS['helpdesk/browser-extensions'] = () => {
  const found = hdWinScreen('browser-extensions');
  if (!found || !Array.isArray(found.machine.extensions)) return hdMachineMissing('Extensions');
  const { computer, machine } = found; const n = `'${hdJsArg(computer.name)}'`;
  const locked = hdProveLocked() ? 'disabled' : '';
  const browser = machine.browser && typeof machine.browser === 'object' ? machine.browser : {};
  const items = hdWinList(machine, 'extensions');
  return `${hdPageHeader('Extensions', `${browser.name || 'Browser'} › Extensions · ${computer.name}`, hdMachineBack(computer))}${browser.homePage ? `<p class="muted" data-hd-home-page>Home page: <code>${hdEsc(browser.homePage)}</code></p>` : ''}<div class="card" data-hd-browser-extensions><div class="table-wrap"><table><thead><tr><th>Extension</th><th>Publisher</th><th>Added</th><th></th></tr></thead><tbody>${items.map(item => `<tr data-hd-extension="${hdEsc(item.name)}"><td>${hdEsc(item.name)}</td><td>${hdEsc(item.publisher || '')}</td><td>${hdEsc(item.added || '')}</td><td><button type="button" class="btn btn-secondary btn-sm" ${locked} data-hd-extension-remove onclick="hdWinRemoveExtension(${n},'${hdJsArg(item.name)}')">Remove</button></td></tr>`).join('') || '<tr><td colspan="4" class="muted">No extensions installed.</td></tr>'}</tbody></table></div></div>`;
};

// OneDrive: the status, View sync problems, OneDrive on the web, and the
// controls. Problems are worked out from the names and the full path.
function hdWinOneDriveFiles(oneDrive) { return hdWinList(oneDrive, 'files').filter(file => file.name); }
function hdWinOneDrivePath(oneDrive, file) { return [oneDrive.root || 'C:\\Users\\user\\OneDrive', file.folder || '', file.name].filter(Boolean).join('\\'); }
function hdWinOneDriveCauses(oneDrive, file) {
  const causes = [];
  if (HD_ONEDRIVE_BAD.test(String(file.name))) causes.push("The name contains characters that aren't allowed");
  if (String(file.folder || '').split('\\').some(part => HD_ONEDRIVE_BAD.test(part))) causes.push("A folder name contains characters that aren't allowed");
  const length = hdWinOneDrivePath(oneDrive, file).length;
  if (length > HD_ONEDRIVE_LIMIT) causes.push(`The path is too long: ${length} characters (the limit is ${HD_ONEDRIVE_LIMIT})`);
  return causes;
}
function hdWinOneDriveProblems(oneDrive) { return hdWinOneDriveFiles(oneDrive).map((file, index) => ({ file, index, causes:hdWinOneDriveCauses(oneDrive, file) })).filter(item => item.causes.length); }
function hdWinOneDriveStatus(oneDrive) {
  if (oneDrive.linked === false) return { id:'signed-out', icon:'⚪', text:'OneDrive isn\'t signed in on this PC.' };
  if (hdWinOneDriveProblems(oneDrive).length) return { id:'error', icon:'❌', text:'Red X: some files can\'t sync.' };
  return { id:'synced', icon:'✅', text:'Green tick: your files are synced.' };
}
function hdWinOneDriveError(computerName, text) { hdState.machineView = { ...hdMachineView(), computer:computerName, odError:text }; hdSave(); render(); }
function hdWinOneDriveRenameFrom(computerName, index) {
  const pick = document.getElementById(`hd-od-target-${index}`); const name = document.getElementById(`hd-od-name-${index}`);
  hdWinOneDriveRename(computerName, Number(index), String(pick ? pick.value : 'file'), String(name ? name.value : ''));
}
function hdWinOneDriveRename(computerName, index, target, newName) {
  if (hdProveLocked()) return;
  const value = String(newName || '').trim();
  if (!value) { hdWinOneDriveError(computerName, 'Type the new name first.'); return; }
  if (HD_ONEDRIVE_BAD.test(value)) { hdWinOneDriveError(computerName, 'A file name can\'t contain any of the following characters: \\ / : * ? " < > |'); return; }
  if (value.length > 120) { hdWinOneDriveError(computerName, 'That name is too long.'); return; }
  hdState.machineView = { ...hdMachineView(), computer:computerName, odError:'' };
  hdMachineChange(computerName, machine => {
    const oneDrive = hdWinOneDrive(machine); const file = oneDrive && hdWinOneDriveFiles(oneDrive)[index]; if (!file) return false;
    const folder = /^folder:(\d+)$/.exec(target);
    if (target === 'file') {
      if (file.name === value) return false;
      const from = file.name; file.name = value;
      hdMachineAction(computerName, 'onedrive-renamed', `renamed the file ${from} to ${value} (OneDrive)`, { kind:'file', from, to:value });
      return true;
    }
    if (!folder) return false;
    const tidy = (text) => String(text || '').split('\\').filter(Boolean).join('\\');
    const parts = tidy(file.folder).split('\\').filter(Boolean); const at = Number(folder[1]);
    if (at >= parts.length || parts[at] === value) return false;
    const prefix = parts.slice(0, at + 1).join('\\'); const from = parts[at];
    const renamed = [...parts.slice(0, at), value].join('\\');
    hdWinOneDriveFiles(oneDrive).forEach(item => {
      const own = tidy(item.folder);
      if (own === prefix || own.startsWith(`${prefix}\\`)) item.folder = renamed + own.slice(prefix.length);
    });
    hdMachineAction(computerName, 'onedrive-renamed', `renamed the folder ${from} to ${value} (OneDrive)`, { kind:'folder', from, to:value });
    return true;
  });
}
function hdWinOneDriveDelete(computerName, index) {
  if (hdProveLocked()) return;
  const oneDrive = hdWinOneDrive(hdFeatureMachine(computerName)); const file = oneDrive && hdWinOneDriveFiles(oneDrive)[index]; if (!file) return;
  // A Prove It asks plainly; Practice says what deleting does.
  if (typeof confirm === 'function' && !confirm(HD_PROVE ? `Delete ${file.name}?` : `Delete ${file.name}? It is deleted from this PC and from OneDrive.`)) return;
  hdMachineChange(computerName, machine => {
    const drive = hdWinOneDrive(machine);
    drive.files = drive.files.filter(item => item !== file);
    hdMachineAction(computerName, 'onedrive-file-deleted', `deleted ${file.name} (OneDrive)`, { file:String(file.name) });
  });
}
function hdWinOneDriveControl(computerName, control) {
  if (!['unlink', 'reset'].includes(control) || hdProveLocked()) return;
  const ask = HD_PROVE ? (control === 'unlink' ? 'Unlink this PC?' : 'Reset OneDrive?')
    : control === 'unlink' ? 'Unlink this PC? Files stop syncing to this PC until you sign in again.' : 'Reset OneDrive? OneDrive disconnects every sync and syncs everything again.';
  if (typeof confirm === 'function' && !confirm(ask)) return;
  hdMachineChange(computerName, machine => {
    const oneDrive = hdWinOneDrive(machine); if (!oneDrive) return false;
    if (control === 'unlink') {
      if (oneDrive.linked === false) return false;
      oneDrive.linked = false;
      hdMachineAction(computerName, 'onedrive-unlinked', 'unlinked OneDrive from this PC', {});
      return true;
    }
    hdMachineAction(computerName, 'onedrive-reset', 'reset OneDrive', {});
    return true;
  });
}
VIEWS['helpdesk/onedrive'] = () => {
  const found = hdWinScreen('onedrive'); const oneDrive = found && hdWinOneDrive(found.machine);
  if (!oneDrive) return hdMachineMissing('OneDrive');
  const { computer } = found; const n = `'${hdJsArg(computer.name)}'`;
  const locked = hdProveLocked() ? 'disabled' : '';
  const tab = hdWinTabOf('onedrive');
  const status = hdWinOneDriveStatus(oneDrive);
  const problems = hdWinOneDriveProblems(oneDrive);
  const error = hdMachineView().odError ? `<p class="muted" role="alert" data-hd-od-error>${hdEsc(hdMachineView().odError)}</p>` : '';
  let body;
  if (tab === 'status') {
    body = `<p data-hd-onedrive-status="${status.id}"><span aria-hidden="true">${status.icon}</span> ${hdEsc(status.text)}</p><dl class="hd-dl"><dt>Storage used</dt><dd data-hd-onedrive-storage>${hdEsc(Number(oneDrive.storageUsed) || 0)}%</dd><dt>Folder</dt><dd><code>${hdEsc(oneDrive.root || '')}</code></dd></dl><p><strong>Settings › Account</strong></p><ul class="hd-list"><li><button type="button" class="btn btn-secondary btn-sm" ${locked} ${oneDrive.linked === false ? 'disabled' : ''} data-hd-onedrive-unlink onclick="hdWinOneDriveControl(${n},'unlink')">Unlink this PC</button></li></ul><p><strong>Troubleshoot</strong></p><ul class="hd-list"><li><button type="button" class="btn btn-secondary btn-sm" ${locked} data-hd-onedrive-reset onclick="hdWinOneDriveControl(${n},'reset')">Reset OneDrive</button> <span class="muted">Runs onedrive.exe /reset</span></li></ul>`;
  } else if (tab === 'sync-problems') {
    body = problems.length ? `<div class="hd-note-list" data-hd-sync-problems>${problems.map(({ file, index, causes }) => {
      const parts = String(file.folder || '').split('\\').filter(Boolean);
      const options = [`<option value="file">This file: ${hdEsc(file.name)}</option>`, ...parts.map((part, i) => `<option value="folder:${i}">Folder: ${hdEsc(part)}</option>`)].join('');
      return `<div data-hd-sync-problem="${index}"><strong>${hdEsc(file.name)}</strong><p><code data-hd-sync-path>${hdEsc(hdWinOneDrivePath(oneDrive, file))}</code></p><ul class="hd-list">${causes.map(cause => `<li data-hd-sync-cause>${hdEsc(cause)}</li>`).join('')}</ul><form class="filterbar" onsubmit="event.preventDefault();hdWinOneDriveRenameFrom(${n},${index})"><label>Rename <select id="hd-od-target-${index}" class="select" ${locked}>${options}</select></label><label>New name <input id="hd-od-name-${index}" class="ipt" maxlength="120" ${locked}></label><button type="submit" class="btn btn-secondary btn-sm" ${locked} data-hd-od-rename>Rename</button><button type="button" class="btn btn-ghost btn-sm" ${locked} data-hd-od-delete onclick="hdWinOneDriveDelete(${n},${index})">Delete file</button></form></div>`;
    }).join('')}</div>${error}` : `<p class="muted" data-hd-sync-none>No sync problems.</p>${error}`;
  } else {
    const synced = hdWinOneDriveFiles(oneDrive).filter(file => !hdWinOneDriveCauses(oneDrive, file).length);
    body = `<p class="muted">My files, as OneDrive on the web shows them.</p><div class="table-wrap"><table data-hd-onedrive-web><thead><tr><th>Name</th><th>Folder</th></tr></thead><tbody>${synced.map(file => `<tr data-hd-web-file="${hdEsc(file.name)}"><td>${hdEsc(file.name)}</td><td>${hdEsc(file.folder ? `My files › ${String(file.folder).split('\\').join(' › ')}` : 'My files')}</td></tr>`).join('') || '<tr><td colspan="2" class="muted">No files.</td></tr>'}</tbody></table></div>`;
  }
  return `${hdPageHeader('OneDrive', computer.name, hdMachineBack(computer))}<div class="card" data-hd-onedrive="${tab}"><div class="card-header" ${HD_CONSOLE_HEADER}>${hdWinTabs(HD_WIN_SCREENS.onedrive.tabs, tab, id => `hdWinScreenTab(${n},'onedrive','${id}')`)}<span aria-hidden="true" data-hd-onedrive-icon="${status.id}">${status.icon}</span></div><div class="card-body">${body}</div></div>`;
};
window.hdWinScreenTab=hdWinScreenTab; window.hdWinThreatSet=hdWinThreatSet; window.hdWinRealtimeSet=hdWinRealtimeSet; window.hdWinExclusionFrom=hdWinExclusionFrom; window.hdWinScanNow=hdWinScanNow;
window.hdWinRemoveExtension=hdWinRemoveExtension; window.hdWinOneDriveRenameFrom=hdWinOneDriveRenameFrom; window.hdWinOneDriveRename=hdWinOneDriveRename; window.hdWinOneDriveDelete=hdWinOneDriveDelete; window.hdWinOneDriveControl=hdWinOneDriveControl;

/* ---------- Windows client tools, console B (added for Module 5, key its-03) ----------
 * Event Viewer's logs on a computer, Reliability Monitor, the Safe Mode
 * route, the signed-in profile notice, the Active Directory computer pane
 * with its BitLocker Recovery tab, and the typed repair and file commands.
 * Each is off unless the computer's machine state has the key it reads:
 *   events: { system:[], application:[], 'diagnostics-performance':[] }
 *     ({ level:'Critical' | 'Error' | 'Warning' | 'Information', time,
 *     source, id, message, details? }). Diagnostics-Performance also lists
 *     Event ID 100 from bootSeconds (and lastBootSeconds after a Restart;
 *     bootTime and restartTime label them), so the data leaves it out.
 *     bootSecondsAfterFixNeeds: { freePercent?, startupOff?:[names] } keeps
 *     the slow boot after a Restart until C: has that much free and each
 *     named startup app is Disabled or uninstalled
 *   reliability: [{ day, today?, critical:[text], warnings:[text],
 *     installs:[text] }]   Reliability Monitor, oldest day first
 *   devices[].crashOnDock: { version, stopCode?, file? }   connecting the
 *     dock while the device's driver is that version crashes the laptop
 *     (a blue-screen action, and a critical event on today's reliability day)
 *   safeMode: false   Settings › System › Recovery and the route to Safe Mode
 *   profile: { temporary, restartClears, path? }   the signed-in profile line
 *     on the Windows Desktop; Restart clears temporary only if restartClears
 *   bitlockerKeys: [{ keyId, date, key }]   Active Directory › Computers ›
 *     the computer › BitLocker Recovery. Read key takes the owning ticket's
 *     action whose bitlockerKey is that Key ID (its verification and critical
 *     rules apply); otherwise it is a machine action. Only the Key ID is ever
 *     recorded, never the key
 *   files: { 'C:\\Users\\name\\Desktop':[name | { name, length?, modified? }] }
 *     dir and Get-ChildItem
 *   repairs: { dism?, sfc?, chkdsk? }   the result line of DISM
 *     /RestoreHealth, sfc /scannow and chkdsk C: /scan (defaults: no problems)
 * Sources: event-log:<computer>:<log> (and
 * event-log:<computer>:diagnostics-performance:after-restart once the
 * computer has restarted), reliability:<computer>, recovery:<computer>,
 * ad-computer:<computer>, ad-bitlocker:<computer>. The same keys, without the
 * computer, go in machine.seen for a coach. */
function hdWinEvents(machine) { return machine && machine.events && typeof machine.events === 'object' && !Array.isArray(machine.events) ? machine.events : null; }
function hdWinProfile(machine) { return machine && machine.profile && typeof machine.profile === 'object' ? machine.profile : null; }
function hdWinRepairs(machine) { return machine && machine.repairs && typeof machine.repairs === 'object' ? machine.repairs : null; }
function hdWinFiles(machine) { return machine && machine.files && typeof machine.files === 'object' && !Array.isArray(machine.files) ? machine.files : null; }
function hdWinSeenSave(machine, keys) {
  if (!machine) return;
  let changed = false;
  keys.forEach(key => { if (hdWinSeen(machine, key)) changed = true; });
  if (changed) hdSave();
}

// Event Viewer › a computer's logs.
const HD_WIN_LOGS = [
  ['system', 'System', 'Windows Logs › System'],
  ['application', 'Application', 'Windows Logs › Application'],
  ['diagnostics-performance', 'Diagnostics-Performance', 'Applications and Services Logs › Microsoft › Windows › Diagnostics-Performance › Operational'],
];
const HD_WIN_LEVELS = ['Critical', 'Error', 'Warning', 'Information'];
function hdWinEventState() { return hdState.eventLog && typeof hdState.eventLog === 'object' ? hdState.eventLog : {}; }
function hdWinEventComputers() { return hdComputers().map(computer => computer.name).filter(name => hdWinHas(hdFeatureMachine(name), 'event-logs')); }
// The selected computer, when it has logs and the shared list wasn't chosen for it.
function hdWinEventComputer() {
  const name = hdState.selectedComputer; const state = hdWinEventState();
  if (!name || state.shared === name) return null;
  const machine = hdFeatureMachine(name);
  return machine && hdWinHas(machine, 'event-logs') ? { name, machine, computer:hdComputerByName(name) } : null;
}
function hdWinEventPicker(current) {
  // A Prove It lists computers only when every computer shows its logs
  // (machineTools); otherwise the list would name the case computer.
  if (HD_PROVE && !hdProveAllTools()) return '';
  const names = hdWinEventComputers(); if (!names.length) return '';
  const button = (name, label) => `<button type="button" class="btn ${name === current ? 'btn-primary' : 'btn-secondary'} btn-sm" aria-pressed="${name === current}" onclick="hdWinEventPick('${hdJsArg(name)}')">${hdEsc(label)}</button>`;
  return `<div class="filterbar" data-hd-event-picker><span class="muted">Computer logs:</span>${names.map(name => button(name, name)).join('')}${button('', 'All computers (shared list)')}</div>`;
}
function hdWinEventPick(name) {
  if (name && hdWinHas(hdFeatureMachine(name), 'event-logs')) { hdState.selectedComputer = name; hdState.eventLog = { ...hdWinEventState(), shared:'', open:null }; }
  else hdState.eventLog = { ...hdWinEventState(), shared:hdState.selectedComputer || '*', open:null };
  hdSave(); render();
}
// Windows logs every Event ID 100 as a Warning.
function hdWinBootEvent(seconds, time) {
  return { level:'Warning', time, source:'Diagnostics-Performance', id:'100', message:`Windows has started up: Boot Duration: ${Math.round(Number(seconds) * 1000)} ms (${hdWinRound(seconds)} s)` };
}
function hdWinLogEvents(machine, log) {
  const events = hdWinEvents(machine) || {};
  const rows = (Array.isArray(events[log]) ? events[log] : []).filter(event => event && typeof event === 'object');
  if (log !== 'diagnostics-performance' || typeof machine.bootSeconds !== 'number') return rows;
  const restarted = Number(machine.restarts) > 0;
  const boots = [hdWinBootEvent(machine.bootSeconds, restarted ? machine.restartTime || 'Today, after the restart' : machine.bootTime || 'Last start-up')];
  const history = Array.isArray(machine.bootHistory) ? machine.bootHistory.filter(boot => boot && typeof boot.seconds === 'number') : null;
  if (restarted && history && history.length) history.forEach(boot => boots.push(hdWinBootEvent(boot.seconds, boot.restart ? 'Today, after an earlier restart' : machine.bootTime || 'Earlier start-up')));
  else if (restarted && typeof machine.lastBootSeconds === 'number') boots.push(hdWinBootEvent(machine.lastBootSeconds, machine.bootTime || 'Earlier start-up'));
  return [...boots, ...rows];
}
function hdWinLogOpened(name, machine, log) {
  const meta = HD_WIN_LOGS.find(([id]) => id === log); if (!meta) return;
  const keys = [`event-log:${log}`];
  hdProveOpened(`event-log:${name}:${log}`, `Event Viewer › ${meta[1]} · ${name}`);
  // Read again after a restart: its own source (a Prove It reads it).
  if (log === 'diagnostics-performance' && Number(machine.restarts) > 0) {
    keys.push('event-log:diagnostics-performance:after-restart');
    hdProveOpened(`event-log:${name}:diagnostics-performance:after-restart`, `Event Viewer › Diagnostics-Performance, after a restart · ${name}`);
  }
  hdWinSeenSave(machine, keys);
}
function hdWinEventSet(name, patch) {
  const state = hdWinEventState(); const clean = {};
  if (patch && HD_WIN_LOGS.some(([id]) => id === patch.log)) clean.log = patch.log;
  if (patch && hdOwn(patch, 'level') && (patch.level === '' || HD_WIN_LEVELS.includes(patch.level))) clean.level = patch.level;
  if (!Object.keys(clean).length) return;
  hdState.eventLog = { ...state, ...clean, shared:'', open:null };
  if (hdOwn(clean, 'level')) hdPracticeEvent('event_filter', { label:`${name} · ${clean.level || 'all levels'}`, computer:name });
  hdSave(); render();
}
function hdWinEventOpen(name, index) {
  const machine = hdFeatureMachine(name); if (!machine) return;
  const state = hdWinEventState();
  const log = HD_WIN_LOGS.some(([id]) => id === state.log) ? state.log : 'system';
  const event = hdWinLogEvents(machine, log)[Number(index)]; if (!event) return;
  hdState.eventLog = { ...state, open:Number(index), openLog:log };
  hdWinSeenSave(machine, [`event-open:${log}:${event.id}`]);
  hdSave(); render();
}
function hdWinLevelBadge(level) { return hdBadge(level || 'Information', ['Critical', 'Error'].includes(level) ? 'bad' : level === 'Warning' ? 'warn' : 'ok'); }
function hdWinEventView(found) {
  const { name, machine, computer } = found; const state = hdWinEventState();
  const log = HD_WIN_LOGS.some(([id]) => id === state.log) ? state.log : 'system';
  const level = HD_WIN_LEVELS.includes(state.level) ? state.level : '';
  const meta = HD_WIN_LOGS.find(([id]) => id === log);
  hdWinLogOpened(name, machine, log);
  const all = hdWinLogEvents(machine, log);
  const rows = all.map((event, index) => ({ event, index })).filter(({ event }) => !level || event.level === level);
  const open = state.openLog === log && Number.isInteger(state.open) ? all[state.open] : null;
  const n = `'${hdJsArg(name)}'`;
  const logs = HD_WIN_LOGS.map(([id, , path]) => `<button type="button" class="btn ${id === log ? 'btn-primary' : 'btn-secondary'} btn-sm" role="tab" aria-selected="${id === log}" data-hd-event-log="${id}" onclick="hdWinEventSet(${n},{log:'${id}'})">${hdEsc(path)}</button>`).join('');
  const levels = [['', 'All levels'], ...HD_WIN_LEVELS.map(item => [item, item])].map(([id, label]) => `<button type="button" class="btn ${id === level ? 'btn-primary' : 'btn-secondary'} btn-sm" aria-pressed="${id === level}" data-hd-event-level="${id || 'all'}" onclick="hdWinEventSet(${n},{level:'${id}'})">${label}</button>`).join('');
  const table = rows.map(({ event, index }) => `<tr data-hd-event-row="${hdEsc(event.id)}"><td>${hdWinLevelBadge(event.level)}</td><td>${hdEsc(event.time || '')}</td><td>${hdEsc(event.source || '')}</td><td>${hdEsc(event.id || '')}</td><td>${hdEsc(event.message || '')}</td><td><button type="button" class="btn btn-ghost btn-sm" onclick="hdWinEventOpen(${n},${index})">Open</button></td></tr>`).join('') || '<tr><td colspan="6" class="muted">No events match this filter.</td></tr>';
  const detail = open ? `<div class="card" data-hd-event-detail="${hdEsc(open.id)}"><div class="card-header"><strong>Event ${hdEsc(open.id)}, ${hdEsc(open.source || '')}</strong></div><div class="card-body"><p>${hdEsc(open.message || '')}</p>${open.details ? `<p>${hdEsc(open.details)}</p>` : ''}<dl class="hd-dl"><dt>Log Name</dt><dd>${hdEsc(meta[1])}</dd><dt>Source</dt><dd>${hdEsc(open.source || '')}</dd><dt>Event ID</dt><dd>${hdEsc(open.id)}</dd><dt>Level</dt><dd>${hdEsc(open.level || 'Information')}</dd><dt>Logged</dt><dd>${hdEsc(open.time || '')}</dd><dt>Computer</dt><dd>${hdEsc(name)}</dd></dl></div></div>` : '';
  return `${hdPageHeader('Event Viewer', `${name} · ${meta[2]}`, hdMachineBack(computer))}${hdWinEventPicker(name)}<div class="card" data-hd-event-logs="${log}"><div class="card-header" ${HD_CONSOLE_HEADER}><div style="display:flex;flex-wrap:wrap;gap:6px" role="tablist">${logs}</div></div><div class="card-body"><div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center"><span class="muted">Filter by level:</span>${levels}<span class="muted">${rows.length} of ${all.length} shown</span></div></div><div class="table-wrap"><table><thead><tr><th>Level</th><th>Date and time</th><th>Source</th><th>Event ID</th><th>Message</th><th></th></tr></thead><tbody>${table}</tbody></table></div></div>${detail}`;
}

// Reliability Monitor, and the dock-cycle crash.
function hdWinReliabilityToday(machine) {
  const days = machine.reliability;
  let today = days.find(day => day && day.today);
  if (!today) { today = { day:'Today', today:true, critical:[], warnings:[], installs:[] }; days.push(today); }
  if (!Array.isArray(today.critical)) today.critical = [];
  return today;
}
function hdWinDockCrash(computerName, machine) {
  if (machine.lastBlueScreen) machine.lastBlueScreen = null;
  if (!machine.dock || !hdDockLive(machine)) return;
  const device = (Array.isArray(machine.devices) ? machine.devices : []).find(item => item && item.crashOnDock && typeof item.crashOnDock === 'object' && item.driver && item.driver.version === item.crashOnDock.version);
  if (!device) return;
  const crash = device.crashOnDock;
  machine.lastBlueScreen = { stopCode:crash.stopCode || '', file:crash.file || '', device:device.id };
  machine.blueScreens = (Number(machine.blueScreens) || 0) + 1;
  if (typeof machine.uptimeDays === 'number') machine.uptimeDays = 0;
  if (Array.isArray(machine.reliability)) hdWinReliabilityToday(machine).critical.push(`Windows stopped working: blue screen${crash.stopCode ? ` (${crash.stopCode})` : ''}`);
  hdMachineAction(computerName, 'blue-screen', `the laptop crashed with a blue screen when connected to the dock${crash.stopCode ? ` (${crash.stopCode})` : ''}`, { device:device.id });
}
function hdWinBlueScreenLine(machine) {
  const crash = machine && machine.lastBlueScreen; if (!crash || typeof crash !== 'object') return '';
  return `<div class="callout bad" role="alert" data-hd-blue-screen><strong>Your device ran into a problem and needs to restart.</strong><p>${crash.stopCode ? `Stop code: ${hdEsc(crash.stopCode)}` : 'Stop error'}${crash.file ? ` · What failed: ${hdEsc(crash.file)}` : ''}</p><p class="muted">The laptop restarted.</p></div>`;
}
function hdWinReliabilityDay(computerName, day) {
  const machine = hdFeatureMachine(computerName); if (!machine || !Array.isArray(machine.reliability)) return;
  if (!machine.reliability.some(item => item && item.day === day)) return;
  hdState.machineView = { ...hdMachineView(), computer:computerName, day };
  hdWinSeenSave(machine, [`reliability:day:${day}`]);
  hdSave(); render();
}
VIEWS['helpdesk/reliability'] = () => {
  const found = hdWinScreen('reliability'); if (!found || !Array.isArray(found.machine.reliability)) return hdMachineMissing('Reliability Monitor');
  const { computer, machine } = found; const n = `'${hdJsArg(computer.name)}'`;
  const days = machine.reliability.filter(day => day && day.day);
  const list = (day, key) => (Array.isArray(day[key]) ? day[key] : []).filter(Boolean);
  const view = hdMachineView(); const pick = days.find(day => day.day === view.day);
  const cell = (day, key, mark) => { const count = list(day, key).length; return `<td data-hd-rel-count="${key}">${count ? `${mark} ${count}` : ''}</td>`; };
  const head = days.map(day => `<th><button type="button" class="btn ${pick === day ? 'btn-primary' : 'btn-ghost'} btn-sm" aria-pressed="${pick === day}" data-hd-rel-day="${hdEsc(day.day)}" onclick="hdWinReliabilityDay(${n},'${hdJsArg(day.day)}')">${hdEsc(day.day)}</button></th>`).join('');
  const row = (label, key, mark) => `<tr data-hd-rel-row="${key}"><th scope="row">${label}</th>${days.map(day => cell(day, key, mark)).join('')}</tr>`;
  const detail = pick ? `<div class="card" data-hd-rel-detail="${hdEsc(pick.day)}"><div class="card-header"><strong>Reliability details for ${hdEsc(pick.day)}</strong></div><div class="card-body">${[['critical', 'Critical events'], ['warnings', 'Warnings'], ['installs', 'Information (updates and installs)']].map(([key, label]) => list(pick, key).length ? `<p><strong>${label}</strong></p><ul class="hd-list">${list(pick, key).map(item => `<li>${hdEsc(item)}</li>`).join('')}</ul>` : '').join('') || '<p class="muted">Nothing was recorded on this day.</p>'}</div></div>` : '<p class="muted">Choose a day to see what happened.</p>';
  return `${hdPageHeader('Reliability Monitor', computer.name, hdMachineBack(computer))}<div class="card" data-hd-reliability><div class="table-wrap"><table><thead><tr><th></th>${head}</tr></thead><tbody>${row('Critical events', 'critical', '✖')}${row('Warnings', 'warnings', '⚠')}${row('Information', 'installs', 'ℹ')}</tbody></table></div></div>${detail}`;
};

// Settings › System › Recovery: Advanced startup to Safe Mode.
// step: the screen the computer is on; each move is a machine action.
const HD_WIN_RECOVERY_FLOW = {
  choose:{ from:'recovery', id:'recovery-advanced-startup', label:'chose Restart now under Advanced startup' },
  troubleshoot:{ from:'choose', id:'recovery-troubleshoot', label:'chose Troubleshoot' },
  advanced:{ from:'troubleshoot', id:'recovery-advanced-options', label:'chose Advanced options' },
  'startup-settings':{ from:'advanced', id:'recovery-startup-settings', label:'chose Startup Settings' },
  'startup-menu':{ from:'startup-settings', id:'recovery-startup-restart', label:'chose Restart in Startup Settings' },
};
const HD_WIN_STARTUP_OPTIONS = ['Enable debugging', 'Enable boot logging', 'Enable low-resolution video', 'Enable Safe Mode', 'Enable Safe Mode with Networking', 'Enable Safe Mode with Command Prompt', 'Disable driver signature enforcement', 'Disable early launch anti-malware protection', 'Disable automatic restart after failure'];
function hdWinRecoveryStep(machine) { const step = machine && machine.recoveryStep; return step === 'recovery' || hdOwn(HD_WIN_RECOVERY_FLOW, step) ? step : 'recovery'; }
// Recovery shows on a machine with safeMode, or (Module 6) with resetPc.
function hdWinHasRecovery(machine) { return !!machine && (typeof machine.safeMode === 'boolean' || machine.resetPc === true); }
// Module 6: Reset this PC is a recorded choice on a resetPc machine. The
// simulator never wipes anything.
function hdWinResetPc(computerName) {
  if (hdProveLocked()) return;
  const machine = hdFeatureMachine(computerName); if (!machine || machine.resetPc !== true) return;
  if (typeof confirm === 'function' && !confirm('Reset this PC? This reinstalls Windows.')) return;
  hdMachineChange(computerName, () => { hdMachineAction(computerName, 'pc-reset-chosen', 'chose Reset this PC (Settings › System › Recovery)'); });
  // Practice only: a Prove It shows nothing.
  if (!HD_PROVE && typeof toast === 'function') toast('Reset this PC recorded as your choice. This training shell never wipes a computer.');
}
function hdWinRecoveryGo(computerName, to) {
  hdMachineChange(computerName, machine => {
    if (!hdWinHasRecovery(machine)) return false;
    const at = hdWinRecoveryStep(machine);
    if (to === 'back') { machine.recoveryStep = hdOwn(HD_WIN_RECOVERY_FLOW, at) ? HD_WIN_RECOVERY_FLOW[at].from : 'recovery'; return false; }
    if (to === 'continue') {
      if (at === 'recovery') return false;
      machine.recoveryStep = 'recovery';
      hdMachineAction(computerName, 'recovery-continue', 'chose Continue and started Windows normally');
      return;
    }
    const move = HD_WIN_RECOVERY_FLOW[to];
    if (!move || move.from !== at) return false;
    machine.recoveryStep = to;
    hdMachineAction(computerName, move.id, `${move.label} (Settings › System › Recovery)`);
  });
}
function hdWinStartupOption(computerName, number) {
  const option = Math.round(Number(number));
  if (option < 1 || option > HD_WIN_STARTUP_OPTIONS.length) return;
  let started = false;
  hdMachineChange(computerName, machine => {
    if (!hdWinHasRecovery(machine) || hdWinRecoveryStep(machine) !== 'startup-menu') return false;
    machine.recoveryStep = 'recovery';
    const safe = option >= 4 && option <= 6;
    machine.safeMode = safe;
    machine.safeModeOption = safe ? HD_WIN_STARTUP_OPTIONS[option - 1].replace(/^Enable /, '') : '';
    hdMachineAction(computerName, safe ? 'safe-mode-started' : 'startup-option', `pressed ${option} in Startup Settings (${HD_WIN_STARTUP_OPTIONS[option - 1]})`, { option });
    started = true;
  });
  if (started) navigate('#/helpdesk/windows');
}
VIEWS['helpdesk/settings-recovery'] = () => {
  const found = hdWinScreen('settings-recovery'); if (!found || !hdWinHasRecovery(found.machine)) return hdMachineMissing('Recovery');
  const { computer, machine } = found; const n = `'${hdJsArg(computer.name)}'`;
  const locked = hdProveLocked() ? 'disabled' : '';
  const step = hdWinRecoveryStep(machine);
  const go = (to, label, note) => `<li><button type="button" class="btn btn-secondary btn-sm" ${locked} data-hd-recovery-go="${to}" onclick="hdWinRecoveryGo(${n},'${to}')">${label}</button>${note ? ` <span class="muted">${note}</span>` : ''}</li>`;
  const off = (label, note) => `<li><button type="button" class="btn btn-secondary btn-sm" disabled>${label}</button> <span class="muted">${note ? `${note} · ` : ''}Not available in this training shell.</span></li>`;
  // Module 6: on a resetPc machine, Reset is a live (recorded) choice.
  const reset = (label, note) => machine.resetPc === true ? `<li><button type="button" class="btn btn-secondary btn-sm" ${locked} data-hd-reset-pc onclick="hdWinResetPc(${n})">${label}</button> <span class="muted">${note}</span></li>` : off(label, note);
  const back = step === 'recovery' ? '' : `<button type="button" class="btn btn-ghost btn-sm" ${locked} onclick="hdWinRecoveryGo(${n},'back')">← Back</button>`;
  let title; let body;
  if (step === 'recovery') {
    title = 'Recovery options';
    body = `<ul class="hd-list">${reset('Reset PC', 'Reset this PC: choose to keep or remove your personal files, then reinstall Windows')}${go('choose', 'Restart now', 'Advanced startup: restart from a device or disc, change Windows startup settings, or restore Windows from a system image')}</ul>${machine.safeMode && !HD_PROVE ? '<p class="muted">This computer is in Safe Mode. Restart it to start Windows normally.</p>' : ''}`;
  } else if (step === 'choose') {
    title = 'Choose an option';
    body = `<ul class="hd-list">${go('continue', 'Continue', 'Exit and continue to Windows 11')}${go('troubleshoot', 'Troubleshoot', 'Reset your PC or see advanced options')}${off('Turn off your PC')}</ul>`;
  } else if (step === 'troubleshoot') {
    title = 'Troubleshoot';
    body = `<ul class="hd-list">${reset('Reset this PC', 'Lets you choose to keep or remove your personal files, and then reinstalls Windows')}${go('advanced', 'Advanced options')}</ul>`;
  } else if (step === 'advanced') {
    title = 'Advanced options';
    body = `<ul class="hd-list">${off('Startup Repair')}${go('startup-settings', 'Startup Settings', 'Change Windows startup behavior')}${off('Command Prompt')}${off('Uninstall Updates')}${off('UEFI Firmware Settings')}${off('System Restore')}</ul>`;
  } else if (step === 'startup-settings') {
    title = 'Startup Settings';
    body = `<p>Restart to change Windows options such as:</p><ul class="hd-list">${['Enable low-resolution video mode', 'Enable debugging mode', 'Enable boot logging', 'Enable Safe Mode', 'Disable driver signature enforcement', 'Disable early-launch anti-malware protection', 'Disable automatic restart on system failure'].map(item => `<li>${item}</li>`).join('')}</ul><ul class="hd-list">${go('startup-menu', 'Restart')}</ul>`;
  } else {
    title = 'Startup Settings';
    body = `<p>Press a number to choose from the options below:</p><ol class="hd-list" data-hd-startup-menu>${HD_WIN_STARTUP_OPTIONS.map((label, index) => `<li><button type="button" class="btn btn-secondary btn-sm" ${locked} data-hd-startup-option="${index + 1}" onclick="hdWinStartupOption(${n},${index + 1})">${index + 1}) ${label}</button></li>`).join('')}</ol>`;
  }
  return `${hdPageHeader('Recovery', `Settings › System › Recovery · ${computer.name}`, hdMachineBack(computer))}<div class="card" data-hd-recovery="${step}"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>${title}</strong>${back}</div><div class="card-body">${body}</div></div>`;
};

// The Windows Desktop: Safe Mode and the signed-in profile.
function hdWinDesktopNotices(name) {
  const machine = hdFeatureMachine(name); if (!machine) return '';
  const out = [];
  if (machine.safeMode === true) out.push(`<div class="callout warning" role="status" data-hd-safe-mode style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px"><strong>Safe Mode</strong><span>${hdEsc(machine.safeModeOption || 'Safe Mode')}: minimal drivers and startup apps</span><strong>Safe Mode</strong></div>`);
  const profile = hdWinProfile(machine);
  // Windows shows nothing for a normal profile, so neither does this.
  if (profile && profile.temporary) {
    out.push(`<div class="callout warning" role="status" data-hd-profile="temporary"><strong>Signed in with a temporary profile</strong><p>You've been signed in with a temporary profile. You can't access your files, and files created in this profile will be deleted when you sign out. To fix this, sign out and try signing in later. Please see the event log for details or contact your system administrator.</p></div>`);
  }
  return out.join('');
}

// Active Directory › Computers › a computer. The smallest look-up a later
// module can reuse: a pane with a tab list (HD_AD_COMPUTER_TABS); a tab shows
// when its show() says so. With no tab beyond General to show (no stored keys
// on any listed computer), the Computers tab looks exactly as before.
const HD_AD_COMPUTER_TABS = [
  { id:'general', label:'General', show:() => true, body:(computer) => `<dl class="hd-dl" data-hd-ad-general><dt>Name</dt><dd>${hdEsc(computer.name)}</dd><dt>DNS name</dt><dd>${hdEsc(`${computer.name.toLowerCase()}.${HD_ORG.domain}`)}</dd><dt>Operating system</dt><dd>${hdEsc(computer.os || '')}</dd><dt>Primary user</dt><dd>${hdEsc(computer.user || '')}</dd><dt>OU</dt><dd><code>${hdEsc(computer.ou || '')}</code></dd><dt>BitLocker</dt><dd>${hdEsc(computer.bitlocker || '')}</dd></dl>` },
  // Shown on every computer once any listed computer has stored keys, so the
  // tab never points at one computer.
  { id:'bitlocker', label:'BitLocker Recovery', source:'ad-bitlocker', show:() => hdAdKeysAnywhere(), body:(computer, machine) => hdAdBitlockerTab(computer, machine) },
];
function hdAdKeysAnywhere() { return hdComputers().some(computer => hdWinHas(hdFeatureMachine(computer.name), 'ad-computer')); }
function hdAdComputerState() { return hdState.adComputer && typeof hdState.adComputer === 'object' ? hdState.adComputer : {}; }
function hdAdComputerTabs(name) {
  const computer = hdComputerByName(name); const machine = computer && hdFeatureMachine(name);
  return computer ? HD_AD_COMPUTER_TABS.filter(tab => tab.id === 'general' || tab.show(computer, machine)) : [];
}
// A row opens when a tab beyond General shows for it (then every row does).
function hdAdComputerOpens(name) { return hdAdComputerTabs(name).length > 1; }
function hdAdComputerLookup() { return hdAdKeysAnywhere(); }
function hdAdComputerFind(event) {
  if (event && event.preventDefault) event.preventDefault();
  const el = document.getElementById('hd-ad-computer-q');
  hdState.adComputer = { ...hdAdComputerState(), q:String(el ? el.value : '').trim().slice(0, 40) };
  hdSave(); render();
}
function hdAdOpenComputer(name) {
  if (!hdAdComputerOpens(name)) return;
  hdState.adTab = 'computers';
  hdState.adComputer = { ...hdAdComputerState(), name, tab:'general', reveal:'' };
  hdProveOpened(`ad-computer:${name}`, `Active Directory › Computers › ${name}`);
  hdWinSeenSave(hdFeatureMachine(name), ['ad-computer']);
  hdSave(); render();
}
function hdAdComputerTab(name, tabId) {
  const tab = hdAdComputerTabs(name).find(item => item.id === tabId); if (!tab) return;
  hdState.adComputer = { ...hdAdComputerState(), name, tab:tab.id };
  if (tab.source) {
    hdProveOpened(`${tab.source}:${name}`, `Active Directory › Computers › ${name} › ${tab.label}`);
    hdWinSeenSave(hdFeatureMachine(name), [tab.source]);
  }
  hdSave(); render();
}
function hdAdBitlockerTab(computer, machine) {
  const keys = (machine && Array.isArray(machine.bitlockerKeys) ? machine.bitlockerKeys : []).filter(key => key && key.keyId);
  if (!keys.length) return '<p class="muted">No BitLocker recovery passwords are stored for this computer.</p>';
  const state = hdAdComputerState(); const n = `'${hdJsArg(computer.name)}'`;
  const locked = hdProveLocked() ? 'disabled' : '';
  const rows = keys.map(key => `<tr data-hd-bitlocker-key="${hdEsc(key.keyId)}"><td><code>${hdEsc(key.keyId)}</code></td><td>${hdEsc(key.date || '')}</td><td>${state.name === computer.name && state.reveal === key.keyId ? `<code data-hd-recovery-password>${hdEsc(key.key || '')}</code>` : `<button type="button" class="btn btn-secondary btn-sm" ${locked} onclick="hdAdReadKey(${n},'${hdJsArg(key.keyId)}')">Read key</button>`}</td></tr>`).join('');
  return `${HD_PROVE ? '' : '<p class="muted">The Key ID is the first 8 characters of the recovery key ID on the user\'s BitLocker recovery screen.</p>'}<div class="table-wrap"><table data-hd-bitlocker><thead><tr><th>Key ID</th><th>Date added</th><th>Recovery password</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
// Read key: the owning ticket's bitlockerKey action when it has one (its
// verification and critical rules apply), otherwise a machine action. Only
// the Key ID is recorded.
function hdAdReadKey(name, keyId) {
  if (hdProveLocked()) return;
  const machine = hdFeatureMachine(name);
  const key = machine && Array.isArray(machine.bitlockerKeys) && machine.bitlockerKeys.find(item => item && item.keyId === keyId);
  if (!key) return;
  const ticket = hdMachineTicket(name);
  const actions = ticket ? hdConsole(ticket).actions : null;
  const action = Array.isArray(actions) ? actions.find(item => item && item.bitlockerKey === keyId) : null;
  // A ticket with key actions names every key it allows; any other key is wrong.
  const keyed = Array.isArray(actions) && actions.some(item => item && item.bitlockerKey);
  if (action) {
    hdConsoleAction(ticket.id, action.id);
    if (!hdConsoleState(ticket).actions.some(entry => entry.id === action.id)) return;
  } else if (ticket && (keyed || hdConsole(ticket).verification) && !hdConsoleState(ticket).verification.passed) {
    // A key with no action of its own, on a ticket that verifies its caller:
    // refused until verification passes, and recorded as a critical error.
    hdConsoleCritical(ticket, `early:bitlocker:${keyId}`, 'Read out a BitLocker recovery key before verifying the caller');
    hdPracticeEvent('action_refused', { ticket:ticket.id, action:'bitlocker-key-read', computer:name, keyId });
    toast('Verify the caller first (KB-0024).');
    hdRerender(); return;
  } else {
    if (ticket && keyed) hdConsoleCritical(ticket, `bitlocker:${keyId}`, "Read out a BitLocker recovery key this ticket doesn't call for");
    hdMachineAction(name, 'bitlocker-key-read', `read out the BitLocker recovery key with Key ID ${keyId}`, { keyId });
  }
  hdState.adComputer = { ...hdAdComputerState(), name, tab:'bitlocker', reveal:keyId };
  hdProveEdited(); hdSave(); render();
}
function hdAdComputerPane(name) {
  const computer = hdComputerByName(name); const machine = hdFeatureMachine(name);
  const tabs = hdAdComputerTabs(name); const state = hdAdComputerState();
  const tab = tabs.find(item => item.id === state.tab) || tabs[0];
  const n = `'${hdJsArg(name)}'`;
  const buttons = tabs.map(item => `<button type="button" class="btn ${item === tab ? 'btn-primary' : 'btn-secondary'} btn-sm" role="tab" aria-selected="${item === tab}" data-hd-ad-tab="${item.id}" onclick="hdAdComputerTab(${n},'${item.id}')">${hdEsc(item.label)}</button>`).join('');
  return `<aside class="card hd-object-pane" data-hd-ad-computer-pane="${hdEsc(name)}"><div class="card-header"><strong>${hdEsc(name)}</strong>${hdBadge(computer.trust, computer.trust === 'Healthy' ? 'ok' : 'bad')}</div><div class="card-body"><div style="display:flex;flex-wrap:wrap;gap:6px" role="tablist">${buttons}</div>${tab.body(computer, machine)}</div></aside>`;
}
function hdAdComputersWithPane() {
  const state = hdAdComputerState(); const q = String(state.q || '').toLowerCase();
  const rows = hdComputers().map(item => hdComputerByName(item.name)).filter(x => x && (!q || x.name.toLowerCase().includes(q)));
  const table = rows.map(x => `<tr data-hd-ad-computer="${hdEsc(x.name)}"><td><strong>${hdEsc(x.name)}</strong><small>${hdEsc(x.ip)}</small></td><td>${hdEsc(x.user)}</td><td><code>${hdEsc(x.ou)}</code></td><td>${hdBadge(x.trust, x.trust === 'Healthy' ? 'ok' : 'bad')}</td><td>${hdBadge(x.bitlocker, x.bitlocker === 'Protected' ? 'ok' : 'warn')}</td><td>${hdEsc(x.health)}</td><td>${hdAdComputerOpens(x.name) ? `<button class="btn btn-sm btn-secondary" onclick="hdAdOpenComputer('${hdJsArg(x.name)}')">Open</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="7" class="muted">No computer matches this name.</td></tr>';
  const pane = state.name && hdAdComputerOpens(state.name) ? hdAdComputerPane(state.name) : '<aside class="card hd-object-pane"><div class="card-body"><p class="muted">Open a computer to see its properties.</p></div></aside>';
  return `<div class="hd-admin-layout"><div><form class="filterbar" onsubmit="hdAdComputerFind(event)"><label>Find a computer by name <input id="hd-ad-computer-q" class="ipt" maxlength="40" value="${hdEsc(state.q || '')}" placeholder="Computer name"></label><button class="btn btn-primary btn-sm" type="submit">Find</button><span class="muted">${rows.length} shown</span></form><div class="card"><div class="table-wrap"><table data-hd-ad-computers><thead><tr><th>Computer</th><th>User</th><th>OU</th><th>Trust</th><th>BitLocker</th><th>Health</th><th></th></tr></thead><tbody>${table}</tbody></table></div></div></div>${pane}</div>`;
}

// The typed commands: DISM, sfc, chkdsk, dir / Get-ChildItem, and
// Get-WinEvent on a computer's logs. Any letter case; extra valid options
// allowed. In Practice a wrong option or a misspelled command name gets a
// one-line hint with the right command; a Prove It answers as Windows would.
const HD_WIN_TYPED = { dism:'DISM /Online /Cleanup-Image /RestoreHealth', sfc:'sfc /scannow', chkdsk:'chkdsk C: /scan', dir:'dir <folder>', 'get-childitem':'Get-ChildItem <folder>',
  // Module 6, console A.
  winget:HD_WINGET_LINES,
  // Module 6, console B: the optional Defender lines only.
  'get-mpcomputerstatus':'Get-MpComputerStatus', 'start-mpscan':'Start-MpScan -ScanType QuickScan', 'get-mpthreatdetection':'Get-MpThreatDetection' };
function hdWinDistance(a, b) {
  const d = Array.from({ length:a.length + 1 }, (_, i) => Array.from({ length:b.length + 1 }, (__, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= a.length; i += 1) for (let j = 1; j <= b.length; j += 1) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
  }
  return d[a.length][b.length];
}
function hdWinWrongOptions(head) {
  hdLastCommandResult = `${head}: wrong options`;
  return HD_PROVE ? 'Error: 87\n\nThe parameter is incorrect.' : `${head} didn't run: an option is missing or misspelled. Did you mean: ${HD_WIN_TYPED[head]}`;
}
function hdWinPathKey(value) { return String(value || '').trim().replace(/^["']|["']$/g, '').replace(/\//g, '\\').replace(/\\+$/, '').toLowerCase(); }
function hdWinTypedCommand(command, normalized, machine) {
  const repairs = hdWinRepairs(machine); const files = hdWinFiles(machine); const events = hdWinEvents(machine);
  if (!repairs && !files && !events) return null;
  const line = normalized.replace(/^(dism|sfc|chkdsk)(\.exe)?(?=\/)/, '$1 ');
  const words = line.split(' '); const head = words[0].replace(/\.exe$/, ''); const args = words.slice(1);
  if (repairs && head === 'dism') {
    const known = args.every(arg => /^\/(online|cleanup-image|restorehealth|scanhealth|checkhealth|limitaccess|quiet|norestart|english|source:.+|logpath:.+|loglevel:\d)$/.test(arg));
    const task = ['/restorehealth', '/scanhealth', '/checkhealth'].filter(arg => args.includes(arg));
    if (!known || !args.includes('/online') || !args.includes('/cleanup-image') || task.length !== 1) return hdWinWrongOptions('dism');
    const result = task[0] === '/restorehealth' ? String(repairs.dism || 'The restore operation completed successfully.') : 'No component store corruption detected.';
    hdLastCommandResult = result;
    return `Deployment Image Servicing and Management tool\nVersion: 10.0.26100.1\n\nImage Version: 10.0.26100.2314\n\n${task[0] === '/restorehealth' ? '[==========================100.0%==========================]\n' : ''}${result}\nThe operation completed successfully.`;
  }
  if (repairs && head === 'sfc') {
    if (!args.includes('/scannow') || !args.every(arg => /^\/(scannow|offbootdir=.+|offwindir=.+|offlogfile=.+)$/.test(arg))) return hdWinWrongOptions('sfc');
    const result = String(repairs.sfc || 'Windows Resource Protection did not find any integrity violations.');
    hdLastCommandResult = result;
    return `Beginning system scan. This process will take some time.\n\nBeginning verification phase of system scan.\nVerification 100% complete.\n\n${result}`;
  }
  if (repairs && head === 'chkdsk') {
    if (args.includes('c:') && args.includes('/scan') && args.every(arg => /^(c:|\/scan|\/perf|\/forceofflinefix|\/i|\/c|\/v)$/.test(arg))) {
      const result = String(repairs.chkdsk || 'Windows has scanned the file system and found no problems.');
      hdLastCommandResult = result;
      return `The type of the file system is NTFS.\nVolume label is Windows.\n\nStage 1: Examining basic file system structure ...\nStage 2: Examining file name linkage ...\nStage 3: Examining security descriptors ...\n\n${result}\nNo further action is required.`;
    }
    if (args.includes('c:') && (args.includes('/f') || args.includes('/r'))) {
      hdLastCommandResult = 'chkdsk: volume in use';
      return `Chkdsk cannot run because the volume is in use by another process. Chkdsk may run if this volume is dismounted first.${HD_PROVE ? '' : `\nFor a check while Windows runs, type: ${HD_WIN_TYPED.chkdsk}`}`;
    }
    return hdWinWrongOptions('chkdsk');
  }
  if (files && ['dir', 'get-childitem', 'gci'].includes(head)) {
    const raw = command.trim().replace(/^\S+\s*/, '').replace(/^-(literal)?path\s+/i, '').trim().replace(/^["']|["']$/g, '');
    if (!raw) { hdLastCommandResult = 'no folder'; return HD_PROVE ? '\n    Directory: C:\\Support\n' : 'Type the folder after the command, for example: dir C:\\Users\\<username>\\Desktop'; }
    const folder = Object.keys(files).find(key => hdWinPathKey(key) === hdWinPathKey(raw));
    // A folder the data doesn't list, inside a profile it does (C:\Users\name\...): empty.
    const profileOf = (value) => hdWinPathKey(value).split('\\').slice(0, 3).join('\\');
    const inProfile = /^c:\\users\\[^\\]+\\.+/.test(hdWinPathKey(raw)) && Object.keys(files).some(key => profileOf(key) === profileOf(raw));
    if (!folder && inProfile) { hdLastCommandResult = `0 items in ${raw}`; return `\n    Directory: ${raw.replace(/\//g, '\\').replace(/\\+$/, '')}\n`; }
    if (!folder) { hdLastCommandResult = 'path not found'; return `Get-ChildItem : Cannot find path '${raw}' because it does not exist.`; }
    const items = (Array.isArray(files[folder]) ? files[folder] : []).map(item => (typeof item === 'string' ? { name:item } : item)).filter(item => item && item.name);
    hdLastCommandResult = `${items.length} item${items.length === 1 ? '' : 's'} in ${folder}`;
    return [`\n    Directory: ${folder}\n`, 'Mode                 LastWriteTime         Length Name', '----                 -------------         ------ ----',
      ...items.map(item => `-a---        ${String(item.modified || '').padEnd(20)} ${String(item.length || '').padStart(10)} ${item.name}`)].join('\n');
  }
  if (events && head === 'get-winevent') {
    // On a computer with logs, every Get-WinEvent reads them: -LogName (or a
    // LogName= in -FilterHashtable, with an optional Id=) and -MaxEvents, in
    // any order; a pipe after it is ignored.
    const main = normalized.split('|')[0];
    const named = /-logname\s+["']?([a-z0-9\-/]+)["']?/.exec(main) || /logname\s*=\s*["']([^"']+)["']/.exec(main) || /^get-winevent\s+["']?([a-z0-9][a-z0-9\-/]*)["']?(\s|$)/.exec(main);
    const max = /-maxevents\s+(\d+)/.exec(main);
    const idFilter = /\bid\s*=\s*(\d+)/.exec(main);
    if (!named) { hdLastCommandResult = 'no log named'; return HD_PROVE ? 'Get-WinEvent : No events were found that match the specified selection criteria.' : 'Name the log, for example: Get-WinEvent -LogName System -MaxEvents 20'; }
    const log = { system:'system', application:'application', 'microsoft-windows-diagnostics-performance/operational':'diagnostics-performance' }[named[1]];
    if (!log && ['security', 'setup'].includes(named[1])) return 'Get-WinEvent : No events were found that match the specified selection criteria.';
    if (!log) return `Get-WinEvent : There is not an event log on the localhost computer that matches "${named[1]}".`;
    const rows = hdWinLogEvents(machine, log).filter(event => !idFilter || String(event.id) === idFilter[1]).slice(0, max ? Math.max(1, Number(max[1])) : undefined);
    if (!rows.length) return 'Get-WinEvent : No events were found that match the specified selection criteria.';
    return ['TimeCreated                     Id LevelDisplayName Message', '-----------                     -- ---------------- -------',
      ...rows.map(event => `${String(event.time || '').padEnd(31)} ${String(event.id || '').padStart(4)} ${String(event.level || 'Information').padEnd(16)} ${event.message || ''}`)].join('\n');
  }
  return null;
}
// A misspelled command name, when nothing else answered it (Practice only).
function hdWinNearMiss(command, computer) {
  const machine = !HD_PROVE && computer && hdFeatureMachine(computer.name); if (!machine) return null;
  const head = command.trim().toLowerCase().split(/\s+/)[0].replace(/\.exe$/, '').replace(/\/.*$/, '');
  const words = [...(hdWinRepairs(machine) ? ['dism', 'sfc', 'chkdsk'] : []), ...(hdWinFiles(machine) ? ['dir', 'get-childitem'] : []), ...(machine.winget === true ? ['winget'] : []), ...(hdWinProtection(machine) ? ['get-mpcomputerstatus', 'start-mpscan', 'get-mpthreatdetection'] : [])];
  const near = words.find(word => head !== word && Math.abs(head.length - word.length) <= (word.length <= 3 ? 0 : 1) && hdWinDistance(head, word) <= (word.length <= 4 ? 1 : 2));
  if (!near) return null;
  hdLastCommandResult = `misspelled: ${near}`;
  return `The term '${command.trim().split(/\s+/)[0]}' is not recognized. Did you mean: ${HD_WIN_TYPED[near]}`;
}
function hdWinTypedHelp(machine) {
  const lines = [];
  if (hdWinEvents(machine)) lines.push("Events: Get-WinEvent -LogName <System | Application | 'Microsoft-Windows-Diagnostics-Performance/Operational'> -MaxEvents <n>");
  if (hdWinRepairs(machine)) lines.push(`Repair: ${HD_WIN_TYPED.dism}, ${HD_WIN_TYPED.sfc}, ${HD_WIN_TYPED.chkdsk}`);
  if (hdWinFiles(machine)) lines.push('Files: dir <folder>, Get-ChildItem <folder>');
  // Module 6, console A.
  if (machine && machine.winget === true) lines.push(`Apps: ${HD_WINGET_LINES}`);
  // Module 6, console B: the optional Defender lines (never the unsafe ones).
  if (hdWinProtection(machine)) lines.push(`Defender: ${HD_DEFENDER_LINES}`);
  return lines;
}
window.hdWinEventPick=hdWinEventPick; window.hdWinEventSet=hdWinEventSet; window.hdWinEventOpen=hdWinEventOpen; window.hdWinReliabilityDay=hdWinReliabilityDay;
window.hdWinRecoveryGo=hdWinRecoveryGo; window.hdWinStartupOption=hdWinStartupOption; window.hdAdComputerFind=hdAdComputerFind; window.hdAdOpenComputer=hdAdOpenComputer;
window.hdAdComputerTab=hdAdComputerTab; window.hdAdReadKey=hdAdReadKey;

window.hdOpenMachineScreen=hdOpenMachineScreen; window.hdQueueToggle=hdQueueToggle; window.hdQueueCancel=hdQueueCancel; window.hdQueueClearStuck=hdQueueClearStuck;
window.hdQueueTestPage=hdQueueTestPage; window.hdPrinterSet=hdPrinterSet; window.hdPrinterTab=hdPrinterTab; window.hdSettingsAddByIp=hdSettingsAddByIp;
window.hdDeviceOpen=hdDeviceOpen; window.hdDeviceDriver=hdDeviceDriver; window.hdDockDo=hdDockDo; window.hdVdiLogOff=hdVdiLogOff; window.hdVdiRestartPool=hdVdiRestartPool;

/* ---------- VM screen (added for Module 4, key its-02) ----------
 * A VirtualBox-style VM Manager on a simulated host, plus Task Manager ›
 * Performance › CPU on that host. Off unless a lab in HD_VM_LABS
 * (ui/helpdesk-data.js) lists the coach this tab runs (?coach=, or the coach
 * a reload resumes). Nothing is installed and it isn't real Windows: the
 * student's settings are data, and the coach's checks read them.
 *   HD_VM_LABS['<key>'] = { coaches:[ids], host:{ name, ramGb, cores, cpu,
 *     virtualization }, images:[{ id, label, kind:'client'|'server', minRamGb,
 *     os }], addresses:{ internal:{ '<vm name>':'<ip>' }, nat, hostOnly,
 *     bridged }, modes:{ '<mode>':'<what it means>' }, shortcut, finishCards:
 *     [{ title, text }] }
 * The VMs are the student's own, never seeded. They are saved in this
 * browser per student (defender-lab.helpdesk.vm.v1.<student>), and to the
 * student's account through the course page that opened this tab: each
 * change sends mnt-vm-save (answered by mnt-vm-received), and at launch the
 * tab asks with mnt-vm-state (answered by mnt-vm-state-reply). The server
 * copy wins, unless this browser holds a newer save the server never
 * confirmed. Nothing is sent before that first answer (or its timeout), so
 * an empty screen after a new sign-in can't overwrite the saved VMs. */
const HD_VM_MODES = ['NAT', 'Bridged', 'Internal', 'Host-only'];
const HD_VM_INSTALL_MS = 4000;
const HD_VM_REPLY_MS = 8000;
const HD_VM_SAVE_DELAY_MS = 600;
const HD_VM_MAX = 4;
function hdVmLabs() { return typeof HD_VM_LABS === 'undefined' || !HD_VM_LABS ? {} : HD_VM_LABS; }
// The lab this tab runs: the one whose coaches include the launching coach.
const HD_VM = (() => {
  if (HD_PROVE || HD_PRACTICE_SET) return null;
  const labs = hdVmLabs();
  let coach = '';
  try { coach = new URLSearchParams(location.search).get('coach') || ''; } catch (_) { coach = ''; }
  if (!coach) { try { const saved = JSON.parse(sessionStorage.getItem('mnt.coach.state') || 'null'); coach = saved && typeof saved.id === 'string' ? saved.id : ''; } catch (_) { coach = ''; } }
  const key = Object.keys(labs).find(name => Array.isArray(labs[name].coaches) && labs[name].coaches.includes(coach));
  if (!key) return null;
  // ui/coach.js removes student= once the page loads; a reload finds it here.
  const remembered = 'defender-lab.helpdesk.vm.student';
  let student = '';
  try { student = new URLSearchParams(location.search).get('student') || ''; } catch (_) { student = ''; }
  student = student.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
  try {
    if (student) sessionStorage.setItem(remembered, student);
    else student = (sessionStorage.getItem(remembered) || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
  } catch (_) { /* storage blocked: this load only */ }
  return { key, lab:labs[key], student };
})();
function hdVmKey() { return `defender-lab.helpdesk.vm.v1.${HD_VM.key}.${HD_VM.student || 'anonymous'}`; }
function hdVmFresh() { return { version:1, lab:HD_VM ? HD_VM.key : '', vms:[], form:null, selected:'', modesViewed:[], cpuSeen:false, taskTab:'processes', savedAt:'' }; }
// The sync status: phase 'asking' until the course page answers (or not);
// unsynced: the savedAt the server hasn't confirmed; status for the line.
let hdVmSync = { phase:'asking', status:'', unsynced:'', loadedUnsynced:'', sending:false, timer:0, serverSeen:false, asked:0 };
let hdVm = null;
let hdVmConsoleLines = {};
function hdVmUnsyncedKey() { return `${hdVmKey()}.unsynced`; }

// The same rules the course page applies (portal/it-support-shared.js
// itsCleanVmState): known fields only, bounded. Anything else is dropped.
function hdVmCleanVm(vm) {
  if (!vm || typeof vm !== 'object' || typeof vm.name !== 'string' || !/^[A-Za-z0-9-]{1,15}$/.test(vm.name)) return null;
  const int = (value, min, max, fallback) => Number.isInteger(value) && value >= min && value <= max ? value : fallback;
  const snapshots = Array.isArray(vm.snapshots) ? vm.snapshots.slice(0, 5).filter(item => item && typeof item.name === 'string' && item.name.trim()).map(item => ({ name:item.name.slice(0, 40), shortcut:item.shortcut !== false, at:typeof item.at === 'string' ? item.at.slice(0, 40) : '' })) : [];
  const pings = Array.isArray(vm.pings) ? vm.pings.slice(-20).filter(item => item && typeof item.to === 'string').map(item => ({ to:item.to.slice(0, 40), ok:item.ok === true, mode:HD_VM_MODES.includes(item.mode) ? item.mode : '' })) : [];
  return {
    name:vm.name, image:typeof vm.image === 'string' && /^[a-z0-9-]{1,20}$/.test(vm.image) ? vm.image : '',
    memoryGb:int(vm.memoryGb, 1, 64, 1), cores:int(vm.cores, 1, 16, 1), diskGb:int(vm.diskGb, 1, 2048, 64),
    diskType:vm.diskType === 'fixed' ? 'fixed' : 'dynamic', network:HD_VM_MODES.includes(vm.network) ? vm.network : 'NAT',
    state:['Off', 'Installing', 'Running'].includes(vm.state) ? vm.state : 'Off', installed:vm.installed === true,
    installStartedAt:Number.isFinite(vm.installStartedAt) ? vm.installStartedAt : 0, shortcut:vm.shortcut !== false,
    snapshots, pings, restored:int(vm.restored, 0, 99, 0), shortcutDeleted:vm.shortcutDeleted === true,
  };
}
function hdVmCleanForm(form) {
  if (!form || typeof form !== 'object') return null;
  const int = (value, min, max, fallback) => Number.isInteger(value) && value >= min && value <= max ? value : fallback;
  return {
    name:typeof form.name === 'string' ? form.name.replace(/[^A-Za-z0-9-]/g, '').slice(0, 15) : '',
    image:typeof form.image === 'string' && /^[a-z0-9-]{0,20}$/.test(form.image) ? form.image : '',
    memoryGb:int(form.memoryGb, 1, 64, 2), cores:int(form.cores, 1, 16, 1), diskGb:int(form.diskGb, 1, 2048, 32),
    diskType:form.diskType === 'fixed' ? 'fixed' : (form.diskType === 'dynamic' ? 'dynamic' : ''),
    network:HD_VM_MODES.includes(form.network) ? form.network : '', lowRamSeen:form.lowRamSeen === true,
  };
}
function hdVmClean(state) {
  if (!state || typeof state !== 'object' || state.version !== 1) return null;
  const vms = Array.isArray(state.vms) ? state.vms.slice(0, HD_VM_MAX).map(hdVmCleanVm).filter(Boolean) : [];
  const names = new Set();
  return {
    version:1, lab:typeof state.lab === 'string' ? state.lab.slice(0, 20) : '',
    vms:vms.filter(vm => (names.has(vm.name.toLowerCase()) ? false : names.add(vm.name.toLowerCase()))),
    form:hdVmCleanForm(state.form), selected:typeof state.selected === 'string' ? state.selected.slice(0, 15) : '',
    modesViewed:Array.isArray(state.modesViewed) ? HD_VM_MODES.filter(mode => state.modesViewed.includes(mode)) : [],
    viewMode:HD_VM_MODES.includes(state.viewMode) ? state.viewMode : '',
    cpuSeen:state.cpuSeen === true, taskTab:['processes', 'performance'].includes(state.taskTab) ? state.taskTab : 'processes',
    savedAt:typeof state.savedAt === 'string' ? state.savedAt.slice(0, 40) : '',
  };
}
// What leaves the tab: the VM summary only (no ticket data, no console text).
function hdVmSummary() {
  if (!HD_VM) return null;
  const state = hdVmState();
  const { taskTab, ...summary } = hdClone(state);
  return summary;
}
function hdVmState() {
  if (!HD_VM) return null;
  if (!hdVm) {
    let saved = null;
    try { saved = hdVmClean(JSON.parse(localStorage.getItem(hdVmKey()) || 'null')); } catch (_) { saved = null; }
    hdVm = saved && saved.lab === HD_VM.key ? saved : hdVmFresh();
    try { hdVmSync.unsynced = localStorage.getItem(hdVmUnsyncedKey()) || ''; } catch (_) { hdVmSync.unsynced = ''; }
    // Only a save from an earlier visit that the server never confirmed can
    // beat the server copy; a change made while the first answer is on its
    // way can't.
    hdVmSync.loadedUnsynced = saved && hdVmSync.unsynced && saved.savedAt === hdVmSync.unsynced ? hdVmSync.unsynced : '';
  }
  // An install that ran its time while the tab was away finishes now.
  hdVm.vms.forEach(vm => { if (vm.state === 'Installing' && hdNowMs() - vm.installStartedAt >= HD_VM_INSTALL_MS) hdVmFinishInstall(vm.name, true); });
  return hdVm;
}
function hdVmImage(id) { return (HD_VM && Array.isArray(HD_VM.lab.images) ? HD_VM.lab.images : []).find(image => image.id === id) || null; }
function hdVmByName(name) { const state = hdVmState(); return state ? state.vms.find(vm => vm.name.toLowerCase() === String(name || '').toLowerCase()) || null : null; }
function hdVmHost() { const host = HD_VM && HD_VM.lab.host || {}; return { name:host.name || 'Host PC', ramGb:host.ramGb || 16, cores:host.cores || 8, cpu:host.cpu || 'Simulated CPU', virtualization:host.virtualization || 'Enabled' }; }
// Every guest's share comes out of the host, including the one being made.
function hdVmRamUsed() { const state = hdVmState(); return state.vms.reduce((sum, vm) => sum + vm.memoryGb, 0) + (state.form ? state.form.memoryGb : 0); }
function hdVmRamLeft() { return hdVmHost().ramGb - hdVmRamUsed(); }

// Saved here at once; to the server after a short pause, once the first
// answer is in.
function hdVmSave() {
  if (!HD_VM || !hdVm) return;
  hdVm.savedAt = new Date().toISOString();
  try { localStorage.setItem(hdVmKey(), JSON.stringify(hdVm)); localStorage.setItem(hdVmUnsyncedKey(), hdVm.savedAt); } catch (_) { /* storage blocked */ }
  hdVmSync.unsynced = hdVm.savedAt;
  hdVmQueueSend();
}
function hdVmOpener() { return window.opener && !window.opener.closed ? window.opener : null; }
function hdVmNonce() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`; }
function hdVmQueueSend() {
  if (hdVmSync.phase !== 'ready' || !hdVmSync.unsynced) return;
  clearTimeout(hdVmSync.timer);
  hdVmSync.timer = setTimeout(hdVmSend, HD_VM_SAVE_DELAY_MS);
}
function hdVmAsk(type, extra, replyType, done) {
  const opener = hdVmOpener();
  if (!opener) { done(null, 'closed'); return; }
  const origin = hdPortalOrigin();
  const nonce = hdVmNonce();
  let timer = 0;
  function onReply(event) {
    const data = event.data;
    if (event.source !== opener || event.origin !== origin) return;
    if (!data || data.type !== replyType || data.id !== HD_VM.key || data.nonce !== nonce) return;
    clearTimeout(timer); window.removeEventListener('message', onReply); done(data, '');
  }
  window.addEventListener('message', onReply);
  timer = setTimeout(() => { window.removeEventListener('message', onReply); done(null, 'unconfirmed'); }, HD_VM_REPLY_MS);
  opener.postMessage({ type, id:HD_VM.key, nonce, student:HD_VM.student, ...extra }, origin);
}
function hdVmSend() {
  if (!HD_VM || hdVmSync.phase !== 'ready' || !hdVmSync.unsynced || hdVmSync.sending) return;
  // Never answered with the saved VMs (a timeout, or signed out then): ask
  // again first, so this tab's copy can't replace VMs saved elsewhere.
  if (!hdVmSync.serverSeen) { hdVmAskServer(); return; }
  const sentAt = hdVmSync.unsynced;
  hdVmSync.sending = true;
  hdVmAsk('mnt-vm-save', { state:hdVmSummary(), base:hdVmSync.base || '' }, 'mnt-vm-received', (reply, reason) => {
    hdVmSync.sending = false;
    const newer = reply && reply.reason === 'stale' ? hdVmClean(reply.state) : null;
    if (reply && reply.saved === true) {
      hdVmSync.base = sentAt;
      if (hdVmSync.unsynced === sentAt) { hdVmSync.unsynced = ''; try { localStorage.removeItem(hdVmUnsyncedKey()); } catch (_) { /* storage blocked */ } }
      hdVmSync.status = 'saved';
    } else if (newer && newer.lab === HD_VM.key) {
      // Another tab saved first: show its copy rather than overwrite it.
      hdVmAdopt(newer);
      toast('Your VMs were changed in another tab. This tab now shows the latest saved copy.');
      hdVmRefresh();
      return;
    } else hdVmSync.status = (reply && reply.reason) || reason || 'unconfirmed';
    // A change made while this one was on its way goes next.
    if (hdVmSync.unsynced && hdVmSync.unsynced !== sentAt) hdVmQueueSend();
    hdVmRefresh();
  });
}
// At launch: the server copy, unless this browser's newer save never landed.
function hdVmAskServer() {
  if (!HD_VM) return;
  hdVmState();
  hdVmSync.phase = 'asking';
  hdVmSync.asked = (hdVmSync.asked || 0) + 1;
  hdVmAsk('mnt-vm-state', {}, 'mnt-vm-state-reply', (reply, reason) => {
    hdVmSync.phase = 'ready';
    if (!reply) { hdVmSync.status = reason === 'closed' ? 'closed' : 'unconfirmed'; hdVmRefresh(); return; }
    if (reply.saved === false && reply.reason) { hdVmSync.status = reply.reason; hdVmRefresh(); return; }
    const later = hdVmSync.asked > 1;
    hdVmSync.serverSeen = true;
    const server = hdVmClean(reply.state);
    // A later answer (after a timeout) treats this tab's changes like an
    // unconfirmed save from an earlier visit only if the account has none.
    const localNewer = (Boolean(hdVmSync.loadedUnsynced) && (!server || !server.savedAt || hdVmSync.loadedUnsynced > server.savedAt))
      || (later && (!server || !server.vms.length));
    if (later && server && server.vms.length && !localNewer && hdVmSync.unsynced) toast('Your VMs saved to your course were loaded. Changes made in this tab before they loaded were replaced.');
    hdVmSync.base = server && server.savedAt ? server.savedAt : '';
    if (server && server.lab === HD_VM.key && !localNewer) hdVmAdopt(server);
    else if (hdVmSync.unsynced) hdVmQueueSend();
    else hdVmSync.status = 'saved';
    hdVmRefresh();
  });
}
// The account's saved copy replaces this tab's. The view the student is on
// (the Task Manager tab) stays this tab's own.
function hdVmAdopt(server) {
  hdVm = { ...server, taskTab:hdVm ? hdVm.taskTab : 'processes' };
  try { localStorage.setItem(hdVmKey(), JSON.stringify(hdVm)); localStorage.removeItem(hdVmUnsyncedKey()); } catch (_) { /* storage blocked */ }
  hdVmSync.unsynced = '';
  hdVmSync.base = server.savedAt || '';
  hdVmSync.status = 'saved';
}
function hdVmRefresh() { if (typeof render === 'function') render(); }
function hdVmSaveLine() {
  const line = {
    closed:'Open this lab from the course page to save your VMs. Until then they are kept in this browser only.',
    'signed-out':'You’re signed out on your course page, so your VMs are kept in this browser only. Sign in there to save them.',
    'other-student':'Your course page is signed in as a different student, so your VMs are kept in this browser only.',
    'no-student':'This lab wasn’t opened from your course page, so your VMs are kept in this browser only.',
    invalid:'Your course page couldn’t read your VMs, so they are kept in this browser only.',
    unconfirmed:'Your course page didn’t confirm the save yet. Your VMs are kept in this browser, and the next change tries again.',
  };
  if (hdVmSync.phase === 'asking') return '<p class="muted" data-hd-vm-save="asking">Loading your saved VMs…</p>';
  if (hdVmSync.status === 'saved' && !hdVmSync.unsynced) return '<p class="muted" data-hd-vm-save="saved">Your VMs are saved to your course.</p>';
  if (line[hdVmSync.status]) return `<p class="muted" data-hd-vm-save="${hdEsc(hdVmSync.status)}">${hdEsc(line[hdVmSync.status])}</p>`;
  return hdVmSync.unsynced ? '<p class="muted" data-hd-vm-save="saving">Saving your VMs to your course…</p>' : '';
}

// Each change: saved, then drawn again.
function hdVmChanged() { hdVmSave(); hdVmRefresh(); }
function hdVmNew() {
  const state = hdVmState(); if (!state) return;
  if (state.vms.length >= HD_VM_MAX) { toast(`This host holds ${HD_VM_MAX} practice VMs. Delete one first.`); return; }
  state.form = hdVmCleanForm({ name:'', image:'', memoryGb:2, cores:1, diskGb:32, diskType:'', network:'' });
  hdVmChanged();
}
function hdVmCancelNew() { const state = hdVmState(); if (!state) return; state.form = null; hdVmChanged(); }
// One form field. Memory below the image's minimum shows the warning, and
// the form remembers it was seen.
function hdVmFormSet(field, value) {
  const state = hdVmState(); if (!state || !state.form) return;
  const form = state.form;
  if (field === 'name') form.name = String(value || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 15);
  else if (field === 'image') form.image = hdVmImage(value) ? value : '';
  else if (['memoryGb', 'cores', 'diskGb'].includes(field)) {
    const max = { memoryGb:hdVmHost().ramGb, cores:hdVmHost().cores, diskGb:2048 }[field];
    const number = Math.round(Number(value));
    if (!Number.isInteger(number) || number < 1 || number > max) return;
    form[field] = number;
  } else if (field === 'diskType') form.diskType = value === 'fixed' ? 'fixed' : 'dynamic';
  else if (field === 'network') { if (!HD_VM_MODES.includes(value)) return; form.network = value; hdVmModeViewed(value); }
  else return;
  const image = hdVmImage(form.image);
  if (image && form.memoryGb < (image.minRamGb || 0)) form.lowRamSeen = true;
  hdVmChanged();
}
function hdVmModeViewed(mode) { const state = hdVmState(); if (HD_VM_MODES.includes(mode) && !state.modesViewed.includes(mode)) state.modesViewed = HD_VM_MODES.filter(item => item === mode || state.modesViewed.includes(item)); }
// Just looking at a mode's diagram (the student hasn't chosen it).
function hdVmViewMode(mode) { const state = hdVmState(); if (!state || !HD_VM_MODES.includes(mode)) return; hdVmModeViewed(mode); state.viewMode = mode; hdVmChanged(); }
// The lab's target settings for a VM of this name (HD_VM_LABS targets): one
// line per setting that is off, naming it. Practice feedback only.
function hdVmTargetHints(settings) {
  const targets = HD_VM && HD_VM.lab.targets && typeof HD_VM.lab.targets === 'object' ? HD_VM.lab.targets : {};
  const key = Object.keys(targets).find(name => name.toLowerCase() === String(settings && settings.name || '').toLowerCase());
  if (!key) return [];
  const want = targets[key];
  const hints = [];
  if (want.image && settings.image !== want.image) hints.push(`Install image: this lab uses ${(hdVmImage(want.image) || {}).label || want.image}.`);
  if (want.memoryGb && settings.memoryGb !== want.memoryGb) hints.push(`Memory is ${settings.memoryGb} GB: this lab asks for ${want.memoryGb} GB.`);
  if (want.cores && settings.cores !== want.cores) hints.push(`CPU cores: ${settings.cores}; this lab asks for ${want.cores}.`);
  if (want.diskGb && settings.diskGb !== want.diskGb) hints.push(`Disk size is ${settings.diskGb} GB: this lab asks for ${want.diskGb} GB.`);
  if (want.diskType && settings.diskType && settings.diskType !== want.diskType) hints.push(`Disk file: this lab asks for ${want.diskType === 'dynamic' ? 'Dynamically allocated' : 'Fixed size'}.`);
  if (want.network && settings.network && settings.network !== want.network) hints.push(`Network mode is ${settings.network}: this lab asks for ${want.network}.`);
  return hints;
}
function hdVmHintsHtml(settings, created) {
  const hints = hdVmTargetHints(settings);
  if (!hints.length) return '';
  const fix = created ? 'Power the VM off to change memory or cores. A wrong image or disk means Delete VM and build it again.' : 'Fix it here before you click Create.';
  return `<div class="callout warning" data-hd-vm-hints="${hints.length}"><strong>Check your settings.</strong><ul class="hd-list">${hints.map(item => `<li>${hdEsc(item)}</li>`).join('')}</ul><p class="muted">${hdEsc(fix)}</p></div>`;
}
function hdVmFormProblems(form) {
  const state = hdVmState();
  const problems = [];
  if (!form.name) problems.push('Type a name for the VM.');
  else if (state.vms.some(vm => vm.name.toLowerCase() === form.name.toLowerCase())) problems.push(`A VM named ${form.name} already exists.`);
  if (!hdVmImage(form.image)) problems.push('Pick an install image.');
  if (!form.diskType) problems.push('Choose Dynamically allocated or Fixed size for the disk.');
  if (!form.network) problems.push('Choose a network mode.');
  if (hdVmRamLeft() < 0) problems.push('The host doesn’t have that much memory left.');
  return problems;
}
function hdVmCreate() {
  const state = hdVmState(); if (!state || !state.form) return;
  const problems = hdVmFormProblems(state.form);
  if (problems.length) { toast(problems[0]); return; }
  const { lowRamSeen, ...form } = state.form;
  state.vms.push(hdVmCleanVm({ ...form, state:'Off', installed:false, shortcut:true, snapshots:[], pings:[] }));
  state.selected = form.name;
  state.form = null;
  hdVmChanged();
}
function hdVmSelect(name) { const state = hdVmState(); if (!state || !hdVmByName(name)) return; state.selected = hdVmByName(name).name; hdVmChanged(); }
// Settings on a VM that exists: network mode any time; memory and cores
// while it is off.
function hdVmSet(name, field, value) {
  const vm = hdVmByName(name); if (!vm) return;
  if (field === 'network') { if (!HD_VM_MODES.includes(value)) return; vm.network = value; hdVmModeViewed(value); }
  else if (field === 'memoryGb' || field === 'cores') {
    if (vm.state !== 'Off') { toast('Power off the VM to change its memory or CPU cores.'); return; }
    const number = Math.round(Number(value));
    const max = field === 'memoryGb' ? hdVmHost().ramGb : hdVmHost().cores;
    if (!Number.isInteger(number) || number < 1 || number > max) return;
    const before = vm[field];
    vm[field] = number;
    if (field === 'memoryGb' && hdVmRamLeft() < 0) { vm[field] = before; toast('The host doesn’t have that much memory left.'); return; }
  } else return;
  hdVmChanged();
}
function hdVmStart(name) {
  const vm = hdVmByName(name); if (!vm || vm.state !== 'Off') return;
  if (!vm.installed) {
    vm.state = 'Installing'; vm.installStartedAt = hdNowMs();
    setTimeout(() => { hdVmFinishInstall(vm.name); }, HD_VM_INSTALL_MS);
  } else vm.state = 'Running';
  hdVmChanged();
}
// The simulated install, fast-forwarded to a desktop.
function hdVmFinishInstall(name, quiet) {
  const vm = (hdVm ? hdVm.vms : []).find(item => item.name === name);
  if (!vm || vm.state !== 'Installing') return;
  vm.state = 'Running'; vm.installed = true;
  if (quiet) { hdVmSave(); return; }
  hdVmChanged();
}
function hdVmPowerOff(name) { const vm = hdVmByName(name); if (!vm || vm.state !== 'Running') return; vm.state = 'Off'; hdVmChanged(); }
function hdVmDelete(name) {
  const state = hdVmState(); const vm = hdVmByName(name); if (!vm) return;
  if (typeof confirm === 'function' && !confirm(`Delete ${vm.name}? Its disk and snapshots go with it.`)) return;
  state.vms = state.vms.filter(item => item !== vm);
  if (state.selected === vm.name) state.selected = '';
  delete hdVmConsoleLines[vm.name];
  hdVmChanged();
}
function hdVmSnapshot(name, snapshotName) {
  const vm = hdVmByName(name); if (!vm) return;
  const label = String(snapshotName || '').trim().slice(0, 40);
  if (!label) { toast('Type a name for the snapshot.'); return; }
  if (vm.snapshots.length >= 5) { toast('This VM already has five snapshots. Real snapshots fill the host’s disk too.'); return; }
  vm.snapshots.push({ name:label, shortcut:vm.shortcut, at:new Date(hdNowMs()).toISOString() });
  hdVmChanged();
}
function hdVmRestore(name, index) {
  const vm = hdVmByName(name); if (!vm) return;
  const snapshot = vm.snapshots[Number(index)]; if (!snapshot) return;
  vm.shortcut = snapshot.shortcut;
  vm.restored = Math.min((vm.restored || 0) + 1, 99);
  hdVmChanged();
}
function hdVmDeleteShortcut(name) { const vm = hdVmByName(name); if (!vm || vm.state !== 'Running' || !vm.shortcut) return; vm.shortcut = false; vm.shortcutDeleted = true; hdVmChanged(); }

// A VM's address on its network mode right now.
function hdVmAddress(vm) {
  const addresses = (HD_VM && HD_VM.lab.addresses) || {};
  const state = hdVmState();
  const index = Math.max(0, state.vms.indexOf(vm));
  if (vm.network === 'NAT') return addresses.nat || '10.0.2.15';
  if (vm.network === 'Internal') {
    // Names match without case, the way hdVmByName does.
    const internal = addresses.internal || {};
    const key = Object.keys(internal).find(name => name.toLowerCase() === String(vm.name || '').toLowerCase());
    return (key && internal[key]) || `10.0.5.${100 + index}`;
  }
  if (vm.network === 'Host-only') return `${addresses.hostOnly || '192.168.56.'}${101 + index}`;
  return `${addresses.bridged || '10.20.99.'}${150 + index}`;
}
// Who a guest can reach: another running guest on the same mode, except NAT
// (each NAT guest sits behind its own router, so guests never meet there).
function hdVmReaches(from, address) {
  if (!from || from.state !== 'Running') return false;
  if (address === hdVmAddress(from)) return true;
  if (from.network === 'NAT') return false;
  return hdVmState().vms.some(vm => vm !== from && vm.state === 'Running' && vm.network === from.network && hdVmAddress(vm) === address);
}
function hdVmCommand(name, command) {
  const vm = hdVmByName(name); if (!vm) return '';
  const text = String(command || '').trim().slice(0, 200);
  if (!text) return '';
  const lines = hdVmConsoleLines[vm.name] = hdVmConsoleLines[vm.name] || [];
  let output;
  const ping = /^ping(?:\s+-[nt](?:\s+\d+)?)?\s+([^\s-]\S*)$/i.exec(text);
  if (vm.state !== 'Running') output = `${vm.name} isn’t running. Start it first.`;
  else if (ping) {
    const target = ping[1];
    const ok = hdVmReaches(vm, target);
    output = hdPingText(target, ok ? [] : null);
    vm.pings.push({ to:target.slice(0, 40), ok, mode:vm.network });
    if (vm.pings.length > 20) vm.pings.splice(0, vm.pings.length - 20);
    hdVmSave();
  } else if (/^ipconfig$/i.test(text)) output = `Ethernet adapter Ethernet:\n\n   IPv4 Address. . . . . . . . . . . : ${hdVmAddress(vm)}\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0`;
  else if (/^hostname$/i.test(text)) output = vm.name;
  else if (/^(get-help|help)$/i.test(text)) output = 'Supported in this training console: ping <address>, ipconfig, hostname';
  else output = `'${text.split(/\s+/)[0]}' isn’t supported in this training console. Supported: ping <address>, ipconfig, hostname`;
  lines.push({ type:'command', text:`C:\\> ${text}` }, { type:'output', text:output });
  if (lines.length > 24) lines.splice(0, lines.length - 24);
  return output;
}
function hdVmRunConsole(event, name) {
  if (event && event.preventDefault) event.preventDefault();
  const input = document.getElementById('hd-vm-console-input');
  const command = input ? input.value : '';
  hdVmCommand(name, command);
  if (input) input.value = '';
  hdVmRefresh();
}
function hdVmTaskTab(tab) {
  const state = hdVmState(); if (!state) return;
  if (tab === 'cpu') { state.taskTab = 'performance'; state.cpuSeen = true; }
  else if (['processes', 'performance'].includes(tab)) state.taskTab = tab;
  else return;
  hdVmChanged();
}

function hdVmMissing(title) {
  return `${hdPageHeader(title, 'Not available in this shift.', `<button class="btn btn-secondary" onclick="navigate('#/helpdesk/dashboard')">← Dashboard</button>`)}<div class="card"><div class="card-body"><p class="muted">Open the virtualization lab from your course page to use this screen.</p></div></div>`;
}
function hdVmRamBar() {
  const host = hdVmHost(); const used = Math.min(hdVmRamUsed(), host.ramGb); const left = hdVmRamLeft();
  const pct = Math.round((used / host.ramGb) * 100);
  return `<div data-hd-vm-ram="${left}"><div class="hd-progress" role="img" aria-label="Host memory: ${used} of ${host.ramGb} GB given to VMs"><i style="width:${pct}%"></i></div><p class="muted">${used} GB given to VMs · <strong>${Math.max(left, 0)} GB left</strong> for the host of ${host.ramGb} GB${left < 0 ? ' · over the host’s memory' : left < 2 ? ' · the host will starve' : ''}</p></div>`;
}
function hdVmModeDiagram(mode) {
  const modes = (HD_VM && HD_VM.lab.modes) || {};
  const reach = { NAT:['VM', '→ host', '→ internet'], Bridged:['VM', '= another PC', 'on the network'], Internal:['VM', '⇄ VM', '(nothing else)'], 'Host-only':['VM', '⇄ host', '⇄ VM'] }[mode] || [];
  return `<div data-hd-vm-diagram="${hdEsc(mode)}" class="callout info"><strong>${hdEsc(mode)}</strong> <span style="font-family:monospace">${reach.map(hdEsc).join(' ')}</span>${modes[mode] ? `<p>${hdEsc(modes[mode])}</p>` : ''}</div>`;
}
function hdVmForm(form) {
  const images = (HD_VM.lab.images || []).map(image => `<option value="${hdEsc(image.id)}" ${form.image === image.id ? 'selected' : ''}>${hdEsc(image.label)}</option>`).join('');
  const image = hdVmImage(form.image);
  const low = image && form.memoryGb < (image.minRamGb || 0) ? `<div class="callout warning" role="alert" data-hd-vm-warning="memory">${hdEsc(image.os || image.label)} needs at least ${hdEsc(image.minRamGb)} GB of memory. With ${form.memoryGb} GB it will crawl or fail to install.</div>` : '';
  const host = hdVmHost();
  const state = hdVmState();
  const viewed = state.viewMode && HD_VM_MODES.includes(state.viewMode) ? state.viewMode : form.network;
  const modeButtons = HD_VM_MODES.map(mode => `<button type="button" class="btn btn-secondary btn-sm" data-hd-vm-mode="${hdEsc(mode)}" aria-pressed="${viewed === mode}" onclick="hdVmViewMode('${mode}')">${hdEsc(mode)}</button>`).join('');
  const problems = hdVmFormProblems(form);
  return `<div class="card" data-hd-vm-form><div class="card-header" ${HD_CONSOLE_HEADER}><strong>New virtual machine</strong><span class="muted">${hdEsc(host.name)}</span></div><div class="card-body">
    <div class="hd-field-grid">
      <label>Name <input class="input" id="hd-vm-name" value="${hdEsc(form.name)}" maxlength="15" autocomplete="off" onchange="hdVmFormSet('name',this.value)"></label>
      <label>Install image (ISO) <select class="select" id="hd-vm-image" onchange="hdVmFormSet('image',this.value)"><option value="">Choose an image…</option>${images}</select></label>
      <label>Memory: <strong>${form.memoryGb} GB</strong> <input type="range" id="hd-vm-memory" min="1" max="${host.ramGb}" step="1" value="${form.memoryGb}" aria-label="Memory in GB" onchange="hdVmFormSet('memoryGb',this.value)"></label>
      <label>CPU cores: <strong>${form.cores}</strong> <input type="range" id="hd-vm-cores" min="1" max="${host.cores}" step="1" value="${form.cores}" aria-label="CPU cores" onchange="hdVmFormSet('cores',this.value)"></label>
      <label>Disk size (GB) <input class="input" type="number" id="hd-vm-disk" min="1" max="2048" value="${form.diskGb}" onchange="hdVmFormSet('diskGb',this.value)"></label>
      <fieldset><legend>Disk file</legend><label><input type="radio" name="hd-vm-disk-type" ${form.diskType === 'dynamic' ? 'checked' : ''} onchange="hdVmFormSet('diskType','dynamic')"> Dynamically allocated (grows as it fills)</label> <label><input type="radio" name="hd-vm-disk-type" ${form.diskType === 'fixed' ? 'checked' : ''} onchange="hdVmFormSet('diskType','fixed')"> Fixed size (takes all ${form.diskGb} GB now)</label></fieldset>
    </div>
    ${low}
    ${form.name && form.image ? hdVmHintsHtml(form, false) : ''}
    ${hdVmRamBar()}
    <div><strong>Network mode</strong> <span class="muted">Click each mode to see who the VM can talk to.</span><div style="display:flex;flex-wrap:wrap;gap:6px">${modeButtons}</div>${viewed ? hdVmModeDiagram(viewed) : ''}${viewed ? `<button type="button" class="btn btn-secondary btn-sm" data-hd-vm-choose="${hdEsc(viewed)}" ${form.network === viewed ? 'disabled' : ''} onclick="hdVmFormSet('network','${viewed}')">${form.network === viewed ? `${hdEsc(viewed)} chosen` : `Use ${hdEsc(viewed)}`}</button>` : ''}</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px"><button type="button" class="btn btn-primary" data-hd-vm-create ${problems.length ? 'aria-disabled="true"' : ''} onclick="hdVmCreate()">Create</button><button type="button" class="btn btn-ghost" onclick="hdVmCancelNew()">Cancel</button></div>
    ${problems.length ? `<ul class="hd-list muted">${problems.map(item => `<li>${hdEsc(item)}</li>`).join('')}</ul>` : ''}
  </div></div>`;
}
function hdVmScreen(vm) {
  const image = hdVmImage(vm.image) || {};
  const name = hdJsArg(vm.name);
  if (vm.state === 'Off') return `<div class="hd-windows-screen" data-hd-vm-screen="off"><div class="hd-window-body"><p class="muted">${hdEsc(vm.name)} is powered off.</p></div></div>`;
  if (vm.state === 'Installing') {
    const pct = Math.min(99, Math.round(((hdNowMs() - vm.installStartedAt) / HD_VM_INSTALL_MS) * 100));
    return `<div class="hd-windows-screen" data-hd-vm-screen="installing"><div class="hd-window-body"><strong>Installing ${hdEsc(image.os || image.label || 'the guest OS')}…</strong><div class="hd-progress"><i style="width:${Math.max(pct, 5)}%"></i></div><p class="muted">Fast-forwarded: a real install takes 20 to 40 minutes.</p></div></div>`;
  }
  const lines = (hdVmConsoleLines[vm.name] || []).map(row => `<pre class="${row.type}">${hdEsc(row.text)}</pre>`).join('');
  const shortcut = vm.shortcut ? `<div data-hd-vm-shortcut="present">📄 ${hdEsc((HD_VM.lab.shortcut) || 'Shortcut')} <button type="button" class="btn btn-ghost btn-sm" onclick="hdVmDeleteShortcut('${name}')">Delete</button></div>` : '<div data-hd-vm-shortcut="gone" class="muted">The desktop shortcut is gone.</div>';
  const server = image.kind === 'server' ? `<div class="card" data-hd-vm-server-manager><div class="card-header"><strong>Server Manager</strong><span class="muted">${hdEsc(vm.name)} · Local Server</span></div><div class="card-body"><p class="muted">Roles and features: none yet. You’ll work in Server Manager in a later module.</p></div></div>` : '';
  return `<div class="hd-windows-screen" data-hd-vm-screen="running"><div class="hd-window-bar"><span>${hdEsc(vm.name)} · ${hdEsc(image.os || image.label || '')} · ${hdEsc(vm.network)} · ${hdEsc(hdVmAddress(vm))}</span><span>Running</span></div><div class="hd-window-body">${shortcut}${server}
    <div class="hd-terminal"><div class="hd-terminal-title">Command Prompt · ${hdEsc(vm.name)}</div><div class="hd-terminal-output" data-hd-vm-console="${hdEsc(vm.name)}">${lines}</div><form onsubmit="hdVmRunConsole(event,'${name}')" class="hd-terminal-input"><span>C:\\&gt;</span><input id="hd-vm-console-input" autocomplete="off" spellcheck="false" placeholder="ping 10.0.5.10" aria-label="Command for ${hdEsc(vm.name)}"><button>Run</button></form></div>
  </div></div>`;
}
function hdVmDetail(vm) {
  const image = hdVmImage(vm.image) || {};
  const name = hdJsArg(vm.name);
  const off = vm.state === 'Off';
  const snapshots = vm.snapshots.map((snapshot, index) => `<li data-hd-vm-snapshot="${hdEsc(snapshot.name)}">📸 ${hdEsc(snapshot.name)} <button type="button" class="btn btn-secondary btn-sm" onclick="hdVmRestore('${name}',${index})">Restore</button></li>`).join('');
  const network = HD_VM_MODES.map(mode => `<option ${vm.network === mode ? 'selected' : ''}>${hdEsc(mode)}</option>`).join('');
  return `<div class="card" data-hd-vm-detail="${hdEsc(vm.name)}"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>${hdEsc(vm.name)}</strong>${hdBadge(vm.state === 'Running' ? 'Running' : vm.state === 'Installing' ? 'Installing' : 'Powered off', vm.state === 'Running' ? 'ok' : 'warn')}
    <span style="display:flex;gap:6px;flex-wrap:wrap">${off ? `<button type="button" class="btn btn-primary btn-sm" data-hd-vm-start onclick="hdVmStart('${name}')">Start</button>` : ''}${vm.state === 'Running' ? `<button type="button" class="btn btn-secondary btn-sm" onclick="hdVmPowerOff('${name}')">Power off</button>` : ''}<button type="button" class="btn btn-ghost btn-sm" onclick="hdVmDelete('${name}')">Delete VM</button></span></div><div class="card-body">
    <dl class="hd-dl"><dt>Install image</dt><dd>${hdEsc(image.label || '—')}</dd><dt>Memory</dt><dd>${off ? `<input class="input" type="number" min="1" max="${hdVmHost().ramGb}" value="${vm.memoryGb}" aria-label="Memory in GB" onchange="hdVmSet('${name}','memoryGb',this.value)"> GB` : `${vm.memoryGb} GB`}</dd><dt>CPU cores</dt><dd>${off ? `<input class="input" type="number" min="1" max="${hdVmHost().cores}" value="${vm.cores}" aria-label="CPU cores" onchange="hdVmSet('${name}','cores',this.value)">` : vm.cores}</dd><dt>Disk</dt><dd>${vm.diskGb} GB, ${vm.diskType === 'fixed' ? 'fixed size' : 'dynamically allocated'}</dd><dt>Network</dt><dd><select class="select" aria-label="Network mode for ${hdEsc(vm.name)}" onchange="hdVmSet('${name}','network',this.value)">${network}</select></dd></dl>
    ${hdVmHintsHtml(vm, true)}
    ${hdVmModeDiagram(vm.network)}
    <div class="card"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Snapshots</strong><span class="muted">A checkpoint on the same disk, not a backup</span></div><div class="card-body"><form onsubmit="event.preventDefault();hdVmSnapshot('${name}',(document.getElementById('hd-vm-snapshot-name')||{}).value)" style="display:flex;gap:6px;flex-wrap:wrap"><input class="input" id="hd-vm-snapshot-name" maxlength="40" placeholder="Snapshot name" aria-label="Snapshot name"><button class="btn btn-secondary btn-sm">Take snapshot</button></form>${snapshots ? `<ul class="hd-list">${snapshots}</ul>` : '<p class="muted">No snapshots yet.</p>'}</div></div>
    ${hdVmScreen(vm)}
  </div></div>`;
}
function hdVmFinishCards() {
  const cards = Array.isArray(HD_VM.lab.finishCards) ? HD_VM.lab.finishCards : [];
  if (!cards.length || !hdVmState().vms.some(vm => vm.installed)) return '';
  return `<div class="card" data-hd-vm-finish><div class="card-header"><strong>Where Tier 1 meets VMs at work</strong></div><div class="card-body"><div class="hd-tool-grid">${cards.map(card => `<div class="card"><div class="card-body"><strong>${hdEsc(card.title)}</strong><p class="muted">${hdEsc(card.text)}</p></div></div>`).join('')}</div></div></div>`;
}
VIEWS['helpdesk/vm-manager'] = () => {
  if (!HD_VM) return hdVmMissing('VM Manager');
  const state = hdVmState(); const host = hdVmHost();
  const list = state.vms.map(vm => `<button type="button" class="hd-device-card${state.selected === vm.name ? ' active' : ''}" data-hd-vm="${hdEsc(vm.name)}" onclick="hdVmSelect('${hdJsArg(vm.name)}')"><strong>${hdEsc(vm.name)}</strong><small>${hdEsc(vm.state === 'Off' ? 'Powered off' : vm.state)} · ${vm.memoryGb} GB · ${vm.cores} core${vm.cores === 1 ? '' : 's'} · ${hdEsc(vm.network)}</small></button>`).join('');
  const selected = hdVmByName(state.selected);
  return `${hdPageHeader('VM Manager', `${host.name} · a Type 2 hypervisor app on the host`, `<button class="btn btn-secondary" onclick="navigate('#/helpdesk/task-manager')">Task Manager</button><button class="btn btn-primary" data-hd-vm-new onclick="hdVmNew()" ${state.form ? 'disabled' : ''}>New</button>`)}
    <div class="callout info">Simulated: nothing is installed on your computer, and the guests aren’t real Windows. The lab checks the settings you choose.</div>
    ${hdVmSaveLine()}
    <div class="card"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Host: ${hdEsc(host.name)}</strong><span class="muted">${host.ramGb} GB memory · ${host.cores} cores</span></div><div class="card-body">${hdVmRamBar()}</div></div>
    ${state.form ? hdVmForm(state.form) : ''}
    <div class="hd-endpoint-layout"><aside class="card"><div class="card-header"><strong>Virtual machines</strong></div><div class="hd-device-list">${list || '<p class="muted" style="padding:12px">No VMs yet. Click New to make one.</p>'}</div></aside><div>${selected ? hdVmDetail(selected) : ''}</div></div>
    ${hdVmFinishCards()}`;
};
VIEWS['helpdesk/task-manager'] = () => {
  if (!HD_VM) return hdVmMissing('Task Manager');
  const state = hdVmState(); const host = hdVmHost();
  const tab = (id, label, on) => `<button type="button" class="btn ${on ? 'btn-primary' : 'btn-secondary'} btn-sm" data-hd-task-tab="${id}" aria-pressed="${on}" onclick="hdVmTaskTab('${id}')">${label}</button>`;
  const performance = state.taskTab === 'performance';
  const body = performance
    ? `<div style="display:flex;gap:6px;flex-wrap:wrap">${tab('cpu', 'CPU', state.cpuSeen)}</div>${state.cpuSeen ? `<dl class="hd-dl" data-hd-task-cpu><dt>Processor</dt><dd>${hdEsc(host.cpu)}</dd><dt>Cores</dt><dd>${host.cores}</dd><dt>Virtualization</dt><dd><strong>${hdEsc(host.virtualization)}</strong></dd><dt>Memory</dt><dd>${host.ramGb} GB installed</dd></dl>` : '<p class="muted">Choose CPU to see the processor.</p>'}`
    : `<div class="table-wrap"><table><thead><tr><th>Name</th><th>CPU</th><th>Memory</th></tr></thead><tbody><tr><td>VM Manager</td><td>1%</td><td>180 MB</td></tr><tr><td>Desktop Window Manager</td><td>1%</td><td>90 MB</td></tr><tr><td>Microsoft Edge</td><td>0%</td><td>420 MB</td></tr></tbody></table></div>`;
  return `${hdPageHeader('Task Manager', host.name, `<button class="btn btn-secondary" onclick="navigate('#/helpdesk/vm-manager')">VM Manager</button>`)}<div class="card" data-hd-task-manager><div class="card-header" ${HD_CONSOLE_HEADER}>${tab('processes', 'Processes', !performance)}${tab('performance', 'Performance', performance)}</div><div class="card-body">${body}</div></div>`;
};
// The dashboard's way in, only in the virtualization lab.
function hdVmDashboardCard() {
  if (!HD_VM) return '';
  return `<div class="card" data-hd-vm-card><div class="card-header"><strong>Virtualization lab</strong></div><div class="card-body"><p>Build and test practice VMs on ${hdEsc(hdVmHost().name)}.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary btn-sm" onclick="navigate('#/helpdesk/vm-manager')">VM Manager</button><button class="btn btn-secondary btn-sm" onclick="navigate('#/helpdesk/task-manager')">Task Manager</button></div></div></div>`;
}
window.hdVmNew=hdVmNew; window.hdVmCancelNew=hdVmCancelNew; window.hdVmFormSet=hdVmFormSet; window.hdVmViewMode=hdVmViewMode; window.hdVmCreate=hdVmCreate;
window.hdVmSelect=hdVmSelect; window.hdVmSet=hdVmSet; window.hdVmStart=hdVmStart; window.hdVmPowerOff=hdVmPowerOff; window.hdVmDelete=hdVmDelete;
window.hdVmSnapshot=hdVmSnapshot; window.hdVmRestore=hdVmRestore; window.hdVmDeleteShortcut=hdVmDeleteShortcut; window.hdVmRunConsole=hdVmRunConsole; window.hdVmTaskTab=hdVmTaskTab;
window.hdVmState=hdVmState; window.hdVmByName=hdVmByName; window.hdVmSummary=hdVmSummary; window.hdVmAddress=hdVmAddress;
if (HD_VM) hdVmAskServer();

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

// hdNoteMissingParts (the note parts, with HD_NOTE_PARTS) is with the console
// features above; with no list it is this ticket's Reported / Tried / Result.
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
    passwordTyped:scenario.passwordTyped === true, passwordWritten:!!(hdM01Ticket() && hdM01Ticket().passwordWritten === true), hintsUsed:scenario.hintsUsed,
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
Events: Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4740}`}${hdFeatureHelp(computer)}`;
  const practiceOutput = hdPracticeCommand(command, normalized, computer);
  if(practiceOutput !== null) return practiceOutput;
  const featureOutput = hdFeatureCommand(command, normalized, computer);
  if(featureOutput !== null) return featureOutput;
  const machineOutput = hdMachineCommand(command, normalized, computer);
  if(machineOutput !== null) return machineOutput;
  if(normalized==='get-computerinfo') return `CsName: ${computer.name}\nWindowsProductName: Windows 11 Enterprise\nOsVersion: 10.0.26100\nCsDomain: ${HD_ORG.domain}${computer.uptimeDays || computer.uptimeDays === 0 ? `\nOsUptime: ${computer.uptimeDays} days` : ''}`;
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
  const nearMiss = hdWinNearMiss(command, computer);
  if(nearMiss !== null) return nearMiss;
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
  // A command can change a machine a late message waits for (when.machine).
  if (hdHasArrivals()) hdCheckArrivals();
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
// Knowledge drafts students create (state Review) show above the articles,
// only once there is one.
function hdKbDraftsHtml() {
  const drafts = hdState.tickets.map(ticket => ({ ticket, draft:ticket.consoleState && ticket.consoleState.kbDraft })).filter(row => row.draft);
  if (!drafts.length) return '';
  return `<div class="card hd-kb-drafts"><div class="card-header"><strong>Drafts in review</strong></div><div class="card-body"><div class="hd-note-list">${drafts.map(row => `<div><strong>${hdEsc(row.draft.title)}</strong> ${hdBadge(`State: ${row.draft.state}`, 'in-progress')}<small class="muted"> from ${hdEsc(hdTicketLabel(row.ticket))}</small><p>${hdEsc(row.draft.text)}</p></div>`).join('')}</div></div></div>`;
}
VIEWS['helpdesk/knowledge-base'] = () => `${hdPageHeader('Knowledge Base', 'Use approved runbooks, then improve them with validated symptoms, evidence, resolution, and escalation boundaries.')}${hdKbDraftsHtml()}<div class="hd-kb-grid">${hdKbArticles().map(k=>`<article class="card"><div class="card-header"><strong>${k.id}</strong>${hdBadge(k.category)}</div><div class="card-body"><h3>${hdEsc(k.title)}</h3>${hdKbBody(k.summary)}<small>${hdEsc(k.audience)} · Updated ${hdEsc(k.updated)}</small></div></article>`).join('')}</div>`;
VIEWS['helpdesk/remote-support'] = () => {const c=hdComputerByName(hdState.selectedComputer)||hdComputers()[0];return `${hdPageHeader('Remote Support', 'Obtain consent, explain actions, protect privacy, and leave the endpoint in a verified state.')}<div class="two-col"><div class="card"><div class="card-header"><strong>Session target</strong>${hdBadge(c.health,c.health==='Healthy'?'ok':'warn')}</div><div class="card-body"><select class="select" onchange="hdSelectComputer(this.value,'#/helpdesk/remote-support')">${hdComputers().map(x=>`<option ${x.name===c.name?'selected':''}>${x.name}</option>`).join('')}</select><dl class="hd-dl"><dt>User</dt><dd>${c.user}</dd><dt>Last seen</dt><dd>${c.lastSeen}</dd><dt>Address</dt><dd>${c.ip}</dd><dt>Domain trust</dt><dd>${c.trust}</dd></dl><button class="btn btn-primary" onclick="toast('Consent request sent to ${hdEsc(c.user)}.')">Request session consent</button></div></div><div class="card"><div class="card-header"><strong>Remote-support checklist</strong></div><div class="card-body">${hdList(['Verify the requester and ticket','Explain what you need to inspect','Ask before viewing personal or sensitive content','Narrate material actions','Stop if security indicators appear','Verify the fix with the user','End the session and document it'],true)}</div></div></div>`;};
VIEWS['helpdesk/environment'] = () => `${hdPageHeader('Enterprise Map', `${HD_ORG.name} · persistent fictional training environment`)}<div class="three-col"><div class="card"><div class="card-header"><strong>Identity</strong></div><div class="card-body"><h2>${HD_USERS.length} users</h2><p>${HD_GROUPS.length} modeled groups · ${HD_ORG.domain}</p><button class="btn btn-secondary" onclick="navigate('#/helpdesk/active-directory')">Open directory</button></div></div><div class="card"><div class="card-header"><strong>Endpoints</strong></div><div class="card-body"><h2>${hdComputers().length} Windows devices</h2><p>Managed Windows 11 laptops and workstations</p><button class="btn btn-secondary" onclick="navigate('#/helpdesk/windows')">Open endpoints</button></div></div><div class="card"><div class="card-header"><strong>Infrastructure</strong></div><div class="card-body"><h2>${hdServers().length} servers</h2><p>AD DS, DNS, DHCP, file, print, and applications</p><button class="btn btn-secondary" onclick="navigate('#/helpdesk/server-manager')">Open servers</button></div></div></div><div class="card"><div class="card-header"><strong>Support model</strong></div><div class="table-wrap"><table><thead><tr><th>Tier</th><th>Owner</th><th>Typical scope</th></tr></thead><tbody>${HD_ORG.supportTiers.map(t=>`<tr><td><strong>${t.tier}</strong></td><td>${t.owner}</td><td>${t.scope}</td></tr>`).join('')}</tbody></table></div></div><div class="card"><div class="card-header"><strong>SLA model</strong></div><div class="table-wrap"><table><thead><tr><th>Priority</th><th>Respond within</th><th>Resolve within</th><th>Who must be told</th></tr></thead><tbody>${HD_ORG.slas.map(s=>`<tr><td>${hdBadge(s.priority,s.priority.toLowerCase())}</td><td>${s.response}</td><td>${s.resolve}</td><td>${s.tell}</td></tr>`).join('')}</tbody></table></div></div>`;

/* ---------- Prove It: a queue shift (Module 2) ----------
 * On when the Prove shift says queue: true. Several short tickets on the
 * shift's fixed clock (hdShiftNow). On each ticket the student sets Impact and
 * Urgency (Priority calculates, as in Lab 2.1), a Class, an optional parent
 * ticket and a reason; they put the queue in work order with Move up and Move
 * down, and rewrite the ticket the shift marks `rewrite`. A ticket with
 * `arrives` joins the queue later (hdProveQueueArrive). The screens show only
 * INC numbers, and the controls pass the number, never the internal id, so
 * an id's prefix can't give the class away. No coach, no hints, no Check
 * order and no feedback before Submit: nothing here says which choice is
 * right. Module 1's one-ticket Prove It never comes here. */
const HD_PROVE_CLASSES = ['Incident', 'Service request', 'Security incident'];
const HD_PROVE_QUEUE_LIMITS = { reason:1000, shortDescription:160, description:4000 };
function hdProveQueue() { return !!(HD_PROVE && HD_PROVE.shift && HD_PROVE.shift.queue === true); }
// A queue ticket as the student first sees it: nothing set. The ticket
// factory's defaults (priority, business impact, SLA text) are cleared so no
// screen can show them.
function hdProveQueueTicket(source) {
  return hdTicket({
    id:source.id, number:source.number, title:source.title, requester:source.requester, requesterTitle:source.requesterTitle,
    department:source.department, contactType:source.contactType || '', description:source.description,
    conversation:hdClone(source.conversation || []), category:'', subcategory:'', priority:'', businessImpact:'', sla:'',
    createdTimestamp:new Date(source.createdAt || HD_PROVE.shift.now).toISOString(),
    impact:'', urgency:'', ticketClass:'', parentId:'', reason:'',
  });
}
function hdProveQueueByCreated(a, b) { return Date.parse(a.createdTimestamp) - Date.parse(b.createdTimestamp) || String(a.number).localeCompare(String(b.number)); }
// A fresh queue attempt: the tickets that are there at the start, in the
// order they came in (oldest first), which is the starting work order. A
// ticket that arrives later is added at the bottom.
function hdFreshProveQueueState() {
  const shift = HD_PROVE.shift;
  const tickets = shift.tickets.filter(source => !source.arrives).map(hdProveQueueTicket).sort(hdProveQueueByCreated);
  return {
    version:1, seed:1, mode:'prove', moduleKey:HD_PROVE.moduleKey, student:HD_PROVE.student,
    tickets, selectedTicketId:null, queueFilter:'All', priorityFilter:'All', adTab:'users', selectedUserId:'u-1005',
    selectedComputer:'NS-LT-0131', selectedServer:'NS-PRINT01', userOverrides:{}, computerOverrides:{}, printerOverrides:{}, machines:{},
    powershell:[{ type:'system', text:'Northstar Enterprise Support Shell · training subset\nType Get-Help to list supported commands.' }],
    prove:{
      shape:'queue', rubricVersion:shift.rubricVersion, startedAt:new Date().toISOString(),
      order:tickets.map(ticket => ticket.id), arrivals:[], rewrite:{ shortDescription:'', description:'' },
      events:[], opened:[], passwordTyped:false, passwordWritten:false,
    },
  };
}
function hdProveQueueByNumber(number) { return hdState.tickets.find(ticket => ticket.number === number) || null; }
function hdProveRewriteTicket() {
  const source = HD_PROVE.shift.tickets.find(ticket => ticket.rewrite === true);
  return source ? hdTicketById(source.id) || null : null;
}
// Triaged: Impact, Urgency and Class are set. Counted for an arrival rule.
function hdProveTriaged(ticket) { return !!(ticket && ticket.impact && ticket.urgency && ticket.ticketClass); }
// Adds every waiting ticket whose rule is met: `afterTriaged` tickets
// triaged, or `afterMinutes` real minutes since the attempt started (so a
// reload keeps the count). It is created at the shift clock. Not an edit of
// the student's: it doesn't move editedAt.
function hdProveQueueArrive(quiet) {
  if (!hdProveQueue() || !hdState.prove || hdProveLocked()) return false;
  const prove = hdState.prove;
  const started = Date.parse(prove.startedAt) || Date.now();
  const triaged = hdState.tickets.filter(hdProveTriaged).length;
  let arrived = false;
  HD_PROVE.shift.tickets.filter(source => source.arrives && !hdTicketById(source.id)).forEach(source => {
    const rule = source.arrives;
    const reason = Number.isInteger(rule.afterTriaged) && triaged >= rule.afterTriaged ? 'triaged'
      : Number.isFinite(rule.afterMinutes) && Date.now() - started >= rule.afterMinutes * 60000 ? 'minutes' : '';
    if (!reason) return;
    const at = new Date().toISOString();
    hdState.tickets.push(hdProveQueueTicket(source));
    prove.order.push(source.id);
    prove.arrivals.push({ ticketId:source.id, at, reason });
    prove.events.push({ type:'ticket_arrived', at, source:source.number, value:reason });
    arrived = true;
  });
  if (arrived) {
    hdSave();
    if (!quiet && typeof toast === 'function') toast('A new ticket arrived in the queue.');
  }
  return arrived;
}
// A redraw that keeps the student's place on the page.
function hdProveQueueRender() {
  const content = typeof document !== 'undefined' && document.getElementById ? document.getElementById('content') : null;
  const top = content ? content.scrollTop : 0;
  render();
  if (content) content.scrollTop = top;
}
function hdProveQueueSet(number, field, value) {
  const ticket = hdProveQueueByNumber(number);
  if (hdProveLocked() || !hdProveQueue() || !ticket) return;
  const text = String(value || '');
  if (field === 'impact' || field === 'urgency') ticket[field] = ['1', '2', '3'].includes(text) ? text : '';
  else if (field === 'ticketClass') ticket.ticketClass = HD_PROVE_CLASSES.includes(text) ? text : '';
  else if (field === 'parent') {
    const parent = hdProveQueueByNumber(text);
    ticket.parentId = parent && parent.id !== ticket.id && parent.parentId !== ticket.id ? parent.id : '';
  } else return;
  ticket.priority = hdMatrixPriority(ticket.impact, ticket.urgency);
  hdProveEvent('field_set', { source:ticket.number, label:field, value:field === 'parent' ? (hdTicketById(ticket.parentId) || {}).number || '' : ticket[field] });
  hdSave();
  hdProveQueueArrive();
  hdProveQueueRender();
}
// Typing is saved, not recorded as events, and never redraws the page. A box
// that holds a password isn't saved and holds Submit back, as on Module 1.
function hdProveQueueText(number, field, value) {
  if (hdProveLocked() || !hdProveQueue() || !HD_PROVE_QUEUE_LIMITS[field]) return;
  const ticket = field === 'reason' ? hdProveQueueByNumber(number) : hdProveRewriteTicket();
  if (!ticket || (field !== 'reason' && ticket.number !== number)) return;
  const text = String(value || '').slice(0, HD_PROVE_QUEUE_LIMITS[field]);
  const key = `${field}:${number}`;
  if (hdPasswordInText(text)) {
    if (!hdProveRefused[key]) hdProveRefused[key] = `${hdRefusePasswordText(null, field === 'reason' ? `reason on ${number}` : `rewrite of ${number}`)} Remove it to submit.`;
    hdProveSyncSubmit();
    return;
  }
  delete hdProveRefused[key];
  if (field === 'reason') ticket.reason = text; else hdState.prove.rewrite[field] = text;
  hdProveEdited();
  hdSave();
  hdProveSyncSubmit();
}
function hdProveQueueMove(number, delta) {
  const ticket = hdProveQueueByNumber(number);
  if (hdProveLocked() || !hdProveQueue() || !ticket || ![-1, 1].includes(delta)) return;
  const order = hdState.prove.order;
  const from = order.indexOf(ticket.id); const to = from + delta;
  if (from < 0 || to < 0 || to >= order.length) return;
  order.splice(to, 0, order.splice(from, 1)[0]);
  hdProveEvent('order_changed', { source:number, value:String(to + 1) });
  hdSave();
  hdProveQueueRender();
  // Keep the keyboard on the moved ticket's button.
  const button = typeof document !== 'undefined' && document.querySelector ? document.querySelector(`[data-hd-prove-move="${delta < 0 ? 'up' : 'down'}:${number}"]`) : null;
  if (button && !button.disabled && typeof button.focus === 'function') button.focus();
}
// Tickets that need a reason: the student's own top two, and any they set to
// P1 or P2. Which boxes are required follows only the student's choices.
function hdProveQueueNeedsReason() {
  const order = hdState.prove.order;
  return hdState.tickets.filter(ticket => order.indexOf(ticket.id) > -1 && order.indexOf(ticket.id) < 2 || ['P1', 'P2'].includes(ticket.priority));
}
// Completeness only, as hdProveMissing: never whether a choice is right.
function hdProveQueueMissing() {
  const prove = hdState.prove;
  const missing = [];
  if (hdState.tickets.length < HD_PROVE.shift.tickets.length) missing.push('the rest of the queue (keep working: it is still coming in)');
  hdState.tickets.slice().sort(hdProveQueueByCreated).forEach(ticket => {
    const parts = [!ticket.impact && 'Impact', !ticket.urgency && 'Urgency', !ticket.ticketClass && 'Class'].filter(Boolean);
    if (parts.length) missing.push(`${parts.join(', ')} on ${ticket.number}`);
  });
  hdProveQueueNeedsReason().forEach(ticket => { if (!String(ticket.reason || '').trim()) missing.push(`a reason on ${ticket.number}`); });
  const rewrite = hdProveRewriteTicket();
  if (rewrite && (!prove.rewrite.shortDescription.trim() || !prove.rewrite.description.trim())) missing.push(`the rewrite of ${rewrite.number}`);
  return missing;
}
// The work the portal receives. position is each ticket's place in the work
// order (1 is first), worked out from order; the portal works it out again.
// Every reason is sent, also on a ticket that left the top two.
function hdProveQueuePackage() {
  const prove = hdState.prove;
  const shift = HD_PROVE.shift;
  const order = prove.order.filter(id => hdTicketById(id));
  const tickets = {};
  hdState.tickets.forEach(ticket => {
    tickets[ticket.id] = { number:ticket.number, impact:ticket.impact, urgency:ticket.urgency, priority:ticket.priority, ticketClass:ticket.ticketClass,
      parentId:ticket.parentId || '', position:order.indexOf(ticket.id) + 1, reason:ticket.reason || '' };
  });
  const rewrite = hdProveRewriteTicket();
  const arrival = prove.arrivals[0];
  return {
    version:1, kind:'hdesk-prove', shape:'queue', moduleKey:HD_PROVE.moduleKey, labKey:shift.labKey, rubricVersion:shift.rubricVersion,
    startedAt:prove.startedAt, elapsedSeconds:Math.max(0, Math.round((Date.now() - (Date.parse(prove.startedAt) || Date.now())) / 1000)),
    interrupt:arrival ? { ticketId:arrival.ticketId, arrivedAt:arrival.at, reason:arrival.reason } : null,
    tickets, order,
    rewrite:{ ticketId:rewrite ? rewrite.id : '', shortDescription:prove.rewrite.shortDescription, description:prove.rewrite.description },
    events:prove.events.slice(-400),
    passwordTyped:prove.passwordTyped === true, passwordWritten:prove.passwordWritten === true,
  };
}
// A returned attempt reopens with what the student last sent, only over a
// draft older than it (as hdProvePrefill). Every ticket is there, the
// arrival counts as done, and values the shift no longer offers stay empty.
function hdProveQueuePrefill(work) {
  const prove = hdState.prove;
  const submitted = Date.parse(work && work.completedAt);
  if (!prove || !work || work.shape !== 'queue' || !submitted || !work.tickets || typeof work.tickets !== 'object') return false;
  if (prove.editedAt && Date.parse(prove.editedAt) > submitted) return false;
  const sources = HD_PROVE.shift.tickets;
  const ids = sources.map(source => source.id);
  const tickets = sources.map(source => {
    const ticket = hdProveQueueTicket(source);
    const sent = work.tickets[source.id] && typeof work.tickets[source.id] === 'object' ? work.tickets[source.id] : {};
    ticket.impact = ['1', '2', '3'].includes(sent.impact) ? sent.impact : '';
    ticket.urgency = ['1', '2', '3'].includes(sent.urgency) ? sent.urgency : '';
    ticket.priority = hdMatrixPriority(ticket.impact, ticket.urgency);
    ticket.ticketClass = HD_PROVE_CLASSES.includes(sent.ticketClass) ? sent.ticketClass : '';
    ticket.parentId = ids.includes(sent.parentId) && sent.parentId !== source.id ? sent.parentId : '';
    ticket.reason = hdMaskPasswordText(String(sent.reason || '').slice(0, HD_PROVE_QUEUE_LIMITS.reason));
    return ticket;
  });
  tickets.forEach(ticket => { const parent = tickets.find(item => item.id === ticket.parentId); if (parent && parent.parentId === ticket.id) ticket.parentId = ''; });
  hdState.tickets = tickets.sort(hdProveQueueByCreated);
  const sent = Array.isArray(work.order) ? work.order.filter((id, index, list) => ids.includes(id) && list.indexOf(id) === index) : [];
  prove.order = [...sent, ...hdState.tickets.map(ticket => ticket.id).filter(id => !sent.includes(id))];
  const interrupt = work.interrupt && typeof work.interrupt === 'object' ? work.interrupt : {};
  prove.arrivals = sources.filter(source => source.arrives).map(source => ({ ticketId:source.id, at:typeof interrupt.arrivedAt === 'string' ? interrupt.arrivedAt.slice(0, 40) : work.completedAt, reason:['triaged', 'minutes'].includes(interrupt.reason) ? interrupt.reason : 'earlier-attempt' }));
  const rewrite = work.rewrite && typeof work.rewrite === 'object' ? work.rewrite : {};
  prove.rewrite = {
    shortDescription:hdMaskPasswordText(String(rewrite.shortDescription || '').slice(0, HD_PROVE_QUEUE_LIMITS.shortDescription)),
    description:hdMaskPasswordText(String(rewrite.description || '').slice(0, HD_PROVE_QUEUE_LIMITS.description)),
  };
  if (Array.isArray(work.events)) prove.events = work.events.filter(event => event && typeof event === 'object' && typeof event.type === 'string').slice(-400).map(event => ({ ...event }));
  if (work.passwordTyped === true) prove.passwordTyped = true;
  if (work.passwordWritten === true) prove.passwordWritten = true;
  hdSave();
  return true;
}
// A neutral line: how long the attempt has run against the time box. No
// lock and no automatic submit.
function hdProveTimeText() {
  const minutes = Math.max(0, Math.floor((Date.now() - (Date.parse(hdState.prove && hdState.prove.startedAt) || Date.now())) / 60000));
  return `Time used: ${minutes} min · time box ${HD_PROVE.shift.timeBoxMinutes || 20} min · shift clock ${hdShiftTimeText(hdShiftNow())}`;
}
function hdProveQueueSla(ticket) {
  const sla = hdMatrixSla(ticket);
  if (sla.notSet) return '<span class="muted" data-sla="not-set">Not set</span>';
  return `<span data-sla="${hdEsc(sla.cls)}"><small class="muted">${hdEsc(sla.phase || '')} </small>${hdBadge(sla.label, sla.cls)}</span>`;
}
function hdProveQueuePriority(ticket) { return ticket.priority ? hdBadge(ticket.priority, ticket.priority.toLowerCase()) : '<span class="muted">Not set</span>'; }
const HD_PROVE_QUEUE_INTRO = '<div class="callout info"><strong>Prove It.</strong> Work this queue on your own: there is no coach and no feedback before you submit. On every ticket set Impact, Urgency and Class, and link a ticket to a parent ticket where that applies. Put the queue in the order you would work it, and give a reason on your top two tickets and on any P1 or P2. One ticket has a Rewrite box: rewrite that ticket. Your instructor reviews your work.</div>';
function hdProveQueueSubmitBlock() {
  return `<div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Submit</strong></div><div class="card-body hd-control-stack"><p id="hd-prove-time" class="muted" role="status">${hdEsc(hdProveTimeText())}</p>${hdProveSubmitCard()}</div></div>`;
}
function hdProveQueueView() {
  const prove = hdState.prove;
  const locked = hdProveLocked();
  Object.keys(hdProveRefused).forEach(field => { delete hdProveRefused[field]; });
  const tickets = hdState.tickets.slice().sort(hdProveQueueByCreated);
  const rows = tickets.map(ticket => {
    const parent = ticket.parentId ? hdTicketById(ticket.parentId) : null;
    const number = hdEsc(ticket.number);
    return `<tr class="hd-ticket-row" data-hd-prove-row="${number}" tabindex="0" onclick="hdProveQueueOpen('${number}')" onkeydown="if(event.key==='Enter')hdProveQueueOpen('${number}')"><td><strong>${number}</strong>${parent ? `<small>Child of ${hdEsc(parent.number)}</small>` : ''}</td><td>${hdEsc(ticket.title)}</td><td><strong>${hdEsc(ticket.requester)}</strong><small>${hdEsc(ticket.department)}</small></td><td>${hdEsc(hdShiftTimeText(ticket.createdTimestamp))}</td><td>${hdProveQueuePriority(ticket)}</td><td>${hdProveQueueSla(ticket)}</td><td>${ticket.ticketClass ? hdEsc(ticket.ticketClass) : '<span class="muted">Not set</span>'}</td></tr>`;
  }).join('') || '<tr><td colspan="7" class="muted">No tickets.</td></tr>';
  const order = prove.order.map(id => hdTicketById(id)).filter(Boolean);
  const items = order.map((ticket, index) => {
    const number = hdEsc(ticket.number);
    return `<li data-hd-prove-order="${number}" style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px;border:1px solid #e4e7ec;border-radius:8px"><strong>${index + 1}. ${number}</strong>${hdProveQueuePriority(ticket)}${hdProveQueueSla(ticket)}<span style="flex:1 1 160px">${hdEsc(ticket.title)}</span><button type="button" class="btn btn-ghost btn-sm" data-hd-prove-move="up:${number}" aria-label="Move ${number} up" ${locked || index === 0 ? 'disabled' : ''} onclick="hdProveQueueMove('${number}',-1)">Move up</button><button type="button" class="btn btn-ghost btn-sm" data-hd-prove-move="down:${number}" aria-label="Move ${number} down" ${locked || index === order.length - 1 ? 'disabled' : ''} onclick="hdProveQueueMove('${number}',1)">Move down</button></li>`;
  }).join('');
  return `${hdPageHeader('Ticket Queue', 'Incidents assigned to your group › Unassigned')}${hdProveBlockedNotice()}${HD_PROVE.blocked ? '' : `${HD_PROVE_QUEUE_INTRO}
    <div class="card"><div class="table-wrap"><table><thead><tr><th>Number</th><th>Short description</th><th>Caller</th><th>Created</th><th>Priority</th><th>SLA</th><th>Class</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    <div class="card hd-work-order"><div class="card-header" ${HD_PROVE_HEADER}><strong>Your work order</strong><span class="muted">Use Move up and Move down. The first ticket is the one you work first.</span></div><div class="card-body"><ol style="list-style:none;margin:0;padding:0;display:grid;gap:6px">${items}</ol></div></div>
    ${hdProveQueueSubmitBlock()}`}`;
}
function hdProveQueueOpen(number) { const ticket = hdProveQueueByNumber(number); if (ticket) hdSelectTicket(ticket.id); }
function hdProveQueueSelect(ticket, field, label, options, value, locked) {
  return `<label>${hdEsc(label)}<select class="select" data-hd-field="${field}" ${locked ? 'disabled' : ''} onchange="hdProveQueueSet('${hdEsc(ticket.number)}','${field}',this.value)"><option value="">Choose…</option>${options.map(([optionValue, text]) => `<option value="${hdEsc(optionValue)}" ${optionValue === value ? 'selected' : ''}>${hdEsc(text)}</option>`).join('')}</select></label>`;
}
function hdProveQueueTicketView(ticket) {
  const prove = hdState.prove;
  const locked = hdProveLocked();
  Object.keys(hdProveRefused).forEach(field => { delete hdProveRefused[field]; });
  const off = locked ? 'disabled' : '';
  const number = hdEsc(ticket.number);
  const levels = ['1', '2', '3'].map(value => [value, HD_IMPACT_LABELS[value]]);
  // By INC number, which says nothing about the tickets (created order would
  // put the oldest ticket first).
  const parents = hdState.tickets.filter(item => item.id !== ticket.id && item.parentId !== ticket.id).sort((a, b) => String(a.number).localeCompare(String(b.number)));
  const parent = ticket.parentId ? hdTicketById(ticket.parentId) : null;
  const children = hdState.tickets.filter(item => item.parentId === ticket.id);
  const replies = ticket.conversation.length ? `<div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Ticket replies</strong></div><div class="card-body hd-note-list">${ticket.conversation.map(reply => `<div><strong>${hdEsc(reply.from)} · ${hdEsc(reply.role)}</strong><p>${hdEsc(reply.text)}</p></div>`).join('')}</div></div>` : '';
  const rewriting = hdProveRewriteTicket();
  const rewrite = rewriting && rewriting.id === ticket.id ? `<div class="card" data-hd-prove-rewrite><div class="card-header" ${HD_PROVE_HEADER}><strong>Rewrite this ticket</strong><span class="muted">Write it so the next technician can act on it without asking again.</span></div><div class="card-body hd-control-stack"><label>Short description<input id="hd-prove-rewrite-short" class="ipt" maxlength="${HD_PROVE_QUEUE_LIMITS.shortDescription}" ${off} value="${hdEsc(prove.rewrite.shortDescription)}" oninput="hdProveQueueText('${number}','shortDescription',this.value)"></label><label>Description<textarea id="hd-prove-rewrite-description" class="ipt hd-note-input" rows="7" maxlength="${HD_PROVE_QUEUE_LIMITS.description}" ${off} oninput="hdProveQueueText('${number}','description',this.value)">${hdEsc(prove.rewrite.description)}</textarea></label></div></div>` : '';
  return `${hdPageHeader(ticket.number, ticket.title, `<button class="btn btn-secondary" onclick="navigate('#/helpdesk/tickets')">← Queue</button>`)}
    ${HD_PROVE_QUEUE_INTRO}
    <div class="hd-ticket-layout">
      <div class="hd-ticket-main">
        <div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Requester statement</strong>${hdBadge('New', 'new')}</div><div class="card-body"><blockquote class="hd-request">${hdEsc(ticket.description)}</blockquote><div class="hd-field-grid"><div><span>Caller</span><strong>${hdEsc(ticket.requester)}</strong></div><div><span>Title</span><strong>${hdEsc(ticket.requesterTitle)}</strong></div><div><span>Department</span><strong>${hdEsc(ticket.department)}</strong></div><div><span>Contact type</span><strong>${hdEsc(ticket.contactType)}</strong></div><div><span>Created</span><strong>${hdEsc(hdShiftTimeText(ticket.createdTimestamp))}</strong></div><div><span>SLA</span><strong>${hdProveQueueSla(ticket)}</strong></div></div></div></div>
        ${replies}
        ${rewrite}
        <div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Reason</strong><span class="muted">Needed on your top two tickets and on any P1 or P2: why this priority and this place in the queue.</span></div><div class="card-body"><textarea id="hd-prove-reason" class="ipt hd-note-input" aria-label="Reason for ${number}" rows="4" maxlength="${HD_PROVE_QUEUE_LIMITS.reason}" ${off} oninput="hdProveQueueText('${number}','reason',this.value)">${hdEsc(ticket.reason)}</textarea></div></div>
      </div>
      <aside class="hd-ticket-side">
        <div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Ticket fields</strong></div><div class="card-body hd-control-stack">
          ${hdProveQueueSelect(ticket, 'impact', 'Impact', levels, ticket.impact, locked)}
          ${hdProveQueueSelect(ticket, 'urgency', 'Urgency', levels, ticket.urgency, locked)}
          <div class="hd-priority-preset" data-hd-priority="${hdEsc(ticket.priority || '')}"><span>Priority</span> ${ticket.priority ? `${hdBadge(ticket.priority, ticket.priority.toLowerCase())} ${hdEsc(HD_PRIORITY_NAMES[ticket.priority])}` : '<span class="muted">Not set</span>'}<p class="muted" style="margin:4px 0 0">Calculated from Impact × Urgency. You don't type it.</p></div>
          ${hdProveQueueSelect(ticket, 'ticketClass', 'Class', HD_PROVE_CLASSES.map(value => [value, value]), ticket.ticketClass, locked)}
          ${hdProveQueueSelect(ticket, 'parent', 'Parent ticket (same outage)', parents.map(item => [item.number, `${item.number} · ${item.title}`]), parent ? parent.number : '', locked)}
          ${children.length ? `<p class="muted">Parent of ${children.map(item => hdEsc(item.number)).join(', ')}</p>` : ''}
        </div></div>
        ${hdProveQueueSubmitBlock()}
      </aside>
    </div>`;
}
window.hdProveQueueSet=hdProveQueueSet; window.hdProveQueueText=hdProveQueueText; window.hdProveQueueMove=hdProveQueueMove; window.hdProveQueueOpen=hdProveQueueOpen;

/* ---------- Prove It ticket ----------
 * One assigned ticket, worked with no coach and no feedback: the student sets
 * the ticket fields, chooses a diagnosis from a shuffled list and the steps
 * they took from a shuffled mixed pool, decides Resolve or Escalate, writes
 * the work note (the ticket's resolution) and the reply to the user, and
 * takes and closes the ticket (Assign to me, then Resolve). Nothing here says
 * which choice is right; scoring is not in the simulator. */
function hdProveSetField(field, value) {
  // Pre-set fields (Module 1) can't be changed.
  if (hdProveLocked() || hdProvePreset()) return;
  if (hdProveMatrix()) { hdProveSetMatrixField(field, value); return; }
  if (!['category','type','priority'].includes(field)) return;
  hdState.prove.fields[field] = String(value || '');
  hdProveEdited();
  hdSave();
  hdProveSyncSubmit();
}
// Module 3: only values the ticket offers. Priority is Impact x Urgency, as in
// Lab 2.1, and redraws in place; nothing says whether a choice is right.
function hdProveMatrixValue(field, value) {
  const spec = hdProveSpec();
  const text = String(value || '');
  const offered = {
    ticketClass:HD_PROVE_CLASSES, category:(spec && spec.categoryOptions) || [], impact:['1', '2', '3'], urgency:['1', '2', '3'], group:HD_ASSIGNMENT_GROUPS,
  }[field] || [];
  return offered.includes(text) ? text : '';
}
function hdProveSetMatrixField(field, value) {
  if (!HD_PROVE_MATRIX_FIELDS.includes(field)) return;
  const fields = hdState.prove.fields;
  fields[field] = hdProveMatrixValue(field, value);
  fields.priority = hdMatrixPriority(fields.impact, fields.urgency) || '';
  hdProveEdited();
  hdSave();
  const shown = typeof document !== 'undefined' && document.getElementById ? document.getElementById('hd-prove-priority') : null;
  if (shown) shown.innerHTML = hdProvePriorityHtml(fields.priority);
  const warm = typeof document !== 'undefined' && document.getElementById ? document.getElementById('hd-prove-warm') : null;
  if (warm) warm.disabled = !fields.group;
  hdProveSyncSubmit();
}
function hdProvePriorityHtml(priority) {
  return priority ? `${hdBadge(priority, priority.toLowerCase())} ${hdEsc(HD_PRIORITY_NAMES[priority] || '')}` : '<span class="muted">Not set</span>';
}
// Module 3: an evidence card or an earlier call, opened on its own and
// recorded once (evidence_opened, source card:<id> or history:<id>).
function hdProveOpenCard(kind, id) {
  const spec = hdProveSpec();
  const list = spec && (kind === 'history' ? spec.history : kind === 'card' ? spec.evidence : null);
  const item = Array.isArray(list) ? list.find(entry => entry.id === id) : null;
  if (hdProveLocked() || !item) return;
  hdProveOpened(`${kind}:${id}`, item.title);
  render();
}
// Module 3: a warm handoff, a call to the chosen assignment group, logged in
// the ticket history on the shift clock. Once per group. Never scored; the
// instructor sees it.
function hdProveWarmHandoff() {
  const spec = hdProveSpec();
  const ticket = hdState.tickets[0];
  const group = hdState.prove && hdState.prove.fields.group;
  if (hdProveLocked() || !spec || spec.warmHandoff !== true || !ticket || !group) return;
  if (hdState.prove.events.some(event => event.type === 'warm_handoff' && event.value === group)) return;
  const label = `Called ${group} at ${hdShiftTimeText(hdShiftNow())}`;
  hdProveEvent('warm_handoff', { value:group, label });
  hdHistory(ticket, `${label}.`);
  hdSave();
  render();
}
window.hdProveOpenCard=hdProveOpenCard; window.hdProveWarmHandoff=hdProveWarmHandoff;
function hdProveChoose(field, value) {
  if (hdProveLocked() || !['diagnosis','decision'].includes(field)) return;
  hdState.prove[field] = String(value || '');
  hdProveEvent(field === 'diagnosis' ? 'diagnosis_chosen' : 'decision_chosen', { value:hdState.prove[field] });
  hdProveEdited();
  // The close control follows the decision, so a ticket closed the other way
  // goes back to In Progress and the close card is drawn again.
  if (field === 'decision') {
    hdState.tickets.filter(ticket => hdProveClosed(ticket) && ticket.status !== HD_PROVE_CLOSE[hdState.prove.decision]).forEach(ticket => { ticket.status = 'In Progress'; });
    hdSave();
    render();
    return;
  }
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
/* Taking and closing a Prove ticket, as on the Module 1 practice tickets:
 * Assign to me (In Progress, Riley Morgan), then one close control that
 * follows the student's own decision: Resolve with a Resolution code, or
 * Escalate. Recorded in the attempt (assignedTo, ticketState, resolutionCode)
 * and never scored. Nothing here looks at which decision is right. Each
 * function takes the ticket, so a shift with more tickets can reuse them.
 * A draft saved before 2026-11-20 has its ticket Assigned to Riley Morgan:
 * that counts as assigned. */
const HD_PROVE_CLOSE = { Resolve:'Resolved', Escalate:'Escalated' };
const HD_PROVE_RESOLUTION_CODES = HD_RESOLUTION_CODES.filter(code => !['Escalated', 'Routed to Security Operations'].includes(code));
function hdProveAssigned(ticket) { return !!ticket && ticket.assignedTechnician === 'Riley Morgan'; }
function hdProveClosed(ticket) { return !!ticket && Object.values(HD_PROVE_CLOSE).includes(ticket.status); }
function hdProveAssign(id) {
  const ticket = hdTicketById(id);
  if (hdProveLocked() || !ticket || hdProveAssigned(ticket)) return;
  ticket.assignedTechnician = 'Riley Morgan';
  ticket.status = 'In Progress';
  hdHistory(ticket, 'Assigned to Riley Morgan; state In Progress.');
  hdProveEdited();
  hdSave();
  render();
}
function hdProveSetCode(id, code) {
  const ticket = hdTicketById(id);
  if (hdProveLocked() || !ticket || (code && !HD_PROVE_RESOLUTION_CODES.includes(code))) return;
  ticket.closureCode = String(code || '');
  hdProveEdited();
  hdSave();
  render();
}
function hdProveClose(id) {
  const ticket = hdTicketById(id);
  const decision = hdState.prove && hdState.prove.decision;
  if (hdProveLocked() || !ticket || !hdProveAssigned(ticket) || !HD_PROVE_CLOSE[decision]) return;
  if (decision === 'Resolve' && !HD_PROVE_RESOLUTION_CODES.includes(ticket.closureCode)) return;
  ticket.status = HD_PROVE_CLOSE[decision];
  hdHistory(ticket, decision === 'Resolve' ? `State changed to Resolved (${ticket.closureCode}).` : 'State changed to Escalated.');
  hdProveEdited();
  hdSave();
  render();
}
// The close card: what the student can do next, never whether it is right.
function hdProveCloseCard(ticket, locked) {
  const decision = hdState.prove.decision;
  const off = locked ? 'disabled' : '';
  let body;
  if (hdProveClosed(ticket)) body = `<p role="status"><strong>${hdEsc(ticket.status)}</strong>${ticket.status === 'Resolved' && ticket.closureCode ? ` · ${hdEsc(ticket.closureCode)}` : ''}</p>${locked ? '' : '<p class="muted">Changing your decision reopens the ticket.</p>'}`;
  else if (!hdProveAssigned(ticket)) body = '<p class="muted">Assign the ticket to yourself first.</p>';
  else if (!HD_PROVE_CLOSE[decision]) body = '<p class="muted">Choose your decision first.</p>';
  else if (decision === 'Resolve') {
    const code = HD_PROVE_RESOLUTION_CODES.includes(ticket.closureCode) ? ticket.closureCode : '';
    body = `<label>Resolution code<select id="hd-prove-code" class="select" ${off} onchange="hdProveSetCode('${ticket.id}',this.value)"><option value="">Choose…</option>${HD_PROVE_RESOLUTION_CODES.map(option => `<option ${option === code ? 'selected' : ''}>${hdEsc(option)}</option>`).join('')}</select></label><button id="hd-prove-close" class="btn btn-primary" ${off || (code ? '' : 'disabled')} onclick="hdProveClose('${ticket.id}')">Resolve</button>`;
  } else body = `<button id="hd-prove-close" class="btn btn-primary" ${off} onclick="hdProveClose('${ticket.id}')">Escalate</button>`;
  return `<div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Close the ticket</strong></div><div class="card-body hd-control-stack">${body}</div></div>`;
}
window.hdProveAssign=hdProveAssign; window.hdProveSetCode=hdProveSetCode; window.hdProveClose=hdProveClose;

// Typing is saved, not recorded as events. While a box holds a password it
// isn't saved (the last text without one stays) and Submit waits until the
// student removes it. Not kept across reloads: a reload shows the saved text.
// The one Work notes box is saved as resolutionNote: it is the ticket's
// resolution, and the answer key's note checks read that field.
const HD_PROVE_TEXT_LABELS = { resolutionNote:'work note', userReply:'reply to the user' };
const hdProveRefused = {};
function hdProveText(field, value) {
  const extra = hdProveWriting()[field];
  if (hdProveLocked() || !(['resolutionNote','userReply'].includes(field) || (HD_PROVE_EXTRA_TEXT.includes(field) && extra))) return;
  const text = String(value || '').slice(0, extra ? extra.max || 4000 : 4000);
  if (hdPasswordInText(text)) {
    const name = extra ? String(extra.label || field).toLowerCase() : HD_PROVE_TEXT_LABELS[field];
    if (!hdProveRefused[field]) hdProveRefused[field] = `${hdRefusePasswordText(null, name)} Remove it to submit.`;
    hdProveSyncSubmit();
    return;
  }
  delete hdProveRefused[field];
  hdState.prove[field] = text;
  hdProveEdited();
  hdSave();
  hdProveSyncSubmit();
}
// The work the portal receives on Submit: the ticket fields, choices, writing,
// commands, events and the machine's end state. stepTexts: the portal doesn't
// load this simulator's data, so the instructor reads the steps from here.
function hdProvePackage() {
  if (!HD_PROVE || !hdState.prove) return null;
  if (hdProveQueue()) return hdProveQueuePackage();
  const prove = hdState.prove;
  const ticket = hdState.tickets[0];
  const shift = HD_PROVE.shift;
  return {
    version:1, kind:'hdesk-prove', moduleKey:HD_PROVE.moduleKey, labKey:shift.labKey, rubricVersion:shift.rubricVersion,
    ticketId:ticket.id, startedAt:prove.startedAt,
    fields:{ ...prove.fields }, diagnosis:prove.diagnosis, steps:prove.steps.slice(),
    stepTexts:prove.steps.map(id => (ticket.pathPool.find(step => step.id === id) || {}).text || ''), decision:prove.decision,
    // noteIsResolution: resolutionNote is the one Work notes box. workNotes
    // holds only notes from an earlier attempt or an older draft.
    resolutionNote:prove.resolutionNote, userReply:prove.userReply, noteIsResolution:true,
    workNotes:ticket.notes.map(note => note.text),
    assignedTo:ticket.assignedTechnician, ticketState:ticket.status, resolutionCode:ticket.status === 'Resolved' ? ticket.closureCode || '' : '',
    commands:prove.events.filter(event => event.type === 'command_run').map(event => ({ command:hdRedactCommand(event.command || ''), computer:event.computer, at:event.at })),
    events:prove.events.map(event => (typeof event.command === 'string' ? { ...event, command:hdRedactCommand(event.command) } : event)),
    machine:shift.printerSummary === true ? hdProvePrinterSummary(shift.selectedComputer)
      : shift.windowsSummary === true ? hdProveWindowsSummary(shift.selectedComputer)
        : hdClone(hdMachine(shift.selectedComputer) || {}),
    passwordTyped:prove.passwordTyped === true, passwordWritten:prove.passwordWritten === true,
    // Module 3: the extra writing and the time used (the efficiency band).
    ...hdProveExtraPackage(prove),
  };
}
// Module 4 (shift printerSummary): a small summary of the selected computer's
// print queues instead of the whole machine, so the package stays inside the
// course page's 4 KB machine limit. Per queue: port, driver, paper size and
// the job counts. Nothing says which values are right.
function hdProvePrinterSummary(name) {
  const machine = hdMachine(name) || {};
  const queues = hdPrintQueues(machine) || {};
  return { printQueues:Object.fromEntries(Object.keys(queues).slice(0, 8).map(printer => {
    const queue = queues[printer];
    const printed = Array.isArray(queue.printed) ? queue.printed : [];
    return [printer, {
      port:String(queue.port || ''), driver:String(queue.driver || ''), media:String(queue.media || ''),
      queued:Array.isArray(queue.jobs) ? queue.jobs.length : 0, printed:printed.length,
      testPages:printed.filter(job => job && job.document === 'Test Page').length,
    }];
  })) };
}
// A returned attempt's printer summary back onto the selected computer: each
// queue's port, driver and paper size, only where this computer offers them.
function hdProvePrefillPrinters(summary, machine) {
  const queues = hdPrintQueues(machine);
  const saved = summary && summary.printQueues && typeof summary.printQueues === 'object' ? summary.printQueues : null;
  if (!queues || !saved) return;
  Object.keys(queues).forEach(printer => {
    const queue = queues[printer]; const was = saved[printer];
    if (!was || typeof was !== 'object') return;
    if (typeof was.port === 'string' && (hdMachinePort(machine, was.port) || was.port === queue.port)) queue.port = was.port;
    if (typeof was.driver === 'string' && (hdPrinterDrivers(machine, queue).includes(was.driver) || was.driver === hdOutsideDriver(queue))) queue.driver = was.driver;
    if (typeof was.media === 'string' && (queue.mediaSizes || []).includes(was.media)) queue.media = was.media;
    // The saved counts back, no more: jobs print in order, so the first ones
    // the attempt printed are printed again here, its test pages are added,
    // and only as many jobs as it left queued stay queued (the rest were
    // cancelled). A resubmission never sends them twice or invents a print.
    if (!Number.isInteger(was.printed) || !Number.isInteger(was.queued) || !Array.isArray(queue.jobs)) return;
    const before = Array.isArray(queue.printed) ? queue.printed : [];
    const tests = Math.max(0, Number.isInteger(was.testPages) ? was.testPages : 0);
    const labels = Math.max(0, Math.min(queue.jobs.length, was.printed - tests - before.length));
    const owner = (hdComputerByName(HD_PROVE.shift.selectedComputer) || {}).user || '';
    queue.printed = [...before, ...queue.jobs.slice(0, labels).map(job => ({ document:job.document, pages:job.pages || 1, owner:job.owner || '' })),
      ...Array.from({ length:Math.min(tests, 60) }, () => ({ document:'Test Page', pages:1, owner }))];
    const rest = queue.jobs.slice(labels);
    queue.jobs = rest.slice(0, Math.max(0, Math.min(rest.length, was.queued)));
  });
}
// Module 5 (shift windowsSummary): a small summary of the selected computer's
// Windows state instead of the whole machine (the 4 KB machine limit): each
// startup app's status, the installed apps' names, the restart count, the
// boot time and the uptime. Nothing says which values are right.
function hdProveWindowsSummary(name) {
  const machine = hdMachine(name) || {};
  const summary = {
    startup:Object.fromEntries(hdWinList(machine, 'startupApps').slice(0, 20).map(app => [String(app.name).slice(0, 80), app.status === 'Disabled' ? 'Disabled' : 'Enabled'])),
    installed:hdWinList(machine, 'installedApps').slice(0, 40).map(app => String(app.name).slice(0, 80)),
    restarts:Number(machine.restarts) || 0,
  };
  if (typeof machine.bootSeconds === 'number') summary.bootSeconds = machine.bootSeconds;
  if (typeof machine.uptimeDays === 'number') summary.uptimeDays = machine.uptimeDays;
  return summary;
}
// A returned attempt's Windows summary back onto the selected computer:
// startup statuses and removed apps only for apps this computer has, then the
// restarts, so Event ID 100 lists the first boot and the latest one. A boot
// time is taken only if it is the computer's before or after-fix time.
function hdProvePrefillWindows(summary, machine, fixture) {
  // The general copy (hdProvePrefillActions) took any boot time; start from
  // the computer's own and take the saved one only as checked below.
  if (typeof fixture.bootSeconds === 'number') machine.bootSeconds = fixture.bootSeconds;
  if (!summary || typeof summary !== 'object' || Array.isArray(summary)) return;
  const startup = summary.startup && typeof summary.startup === 'object' && !Array.isArray(summary.startup) ? summary.startup : null;
  if (startup) hdWinList(machine, 'startupApps').forEach(app => { if (['Enabled', 'Disabled'].includes(startup[app.name])) app.status = startup[app.name]; });
  if (Array.isArray(summary.installed) && Array.isArray(machine.installedApps)) {
    const kept = summary.installed.filter(item => typeof item === 'string');
    machine.installedApps.filter(app => app && !kept.includes(app.name)).forEach(app => {
      const entry = typeof app.startup === 'string' && app.startup ? app.startup : app.name;
      if (Array.isArray(machine.startupApps)) machine.startupApps = machine.startupApps.filter(item => !item || item.name !== entry);
    });
    machine.installedApps = machine.installedApps.filter(app => app && kept.includes(app.name));
  }
  const restarts = Number.isInteger(summary.restarts) ? Math.max(0, Math.min(summary.restarts, 20)) : 0;
  if (!restarts) return;
  const first = fixture.bootSeconds;
  machine.restarts = restarts;
  machine.uptimeDays = 0;
  if (typeof first === 'number') {
    machine.lastBootSeconds = first;
    // The slow time a later Restart goes back to (hdWinRestart, startupOff).
    if (fixture.bootSecondsAfterFixNeeds && Array.isArray(fixture.bootSecondsAfterFixNeeds.startupOff)) machine.bootSecondsSlow = first;
    machine.bootHistory = [{ seconds:first, restart:false }];
    if ([first, fixture.bootSecondsAfterFix].includes(summary.bootSeconds)) machine.bootSeconds = summary.bootSeconds;
  }
}
function hdProveExtraPackage(prove) {
  if (!hdProveMatrix()) return {};
  const writing = Object.fromEntries(Object.keys(hdProveWriting()).filter(field => HD_PROVE_EXTRA_TEXT.includes(field)).map(field => [field, String(prove[field] || '')]));
  return { ...writing, elapsedSeconds:Math.max(0, Math.round((Date.now() - (Date.parse(prove.startedAt) || Date.now())) / 1000)) };
}

// Which required parts are still empty. Completeness only: nothing here looks
// at what was chosen or written, so it can never hint at what is right.
function hdProveMissing() {
  if (hdProveQueue()) return hdProveQueueMissing();
  const prove = hdState.prove;
  const ticket = hdState.tickets[0];
  if (hdProveMatrix()) {
    const labels = hdProveLabels();
    const writing = hdProveWriting();
    return [
      ['Assign to me', hdProveAssigned(ticket) ? 'yes' : ''],
      ['class', prove.fields.ticketClass], ['category', prove.fields.category], ['impact', prove.fields.impact], ['urgency', prove.fields.urgency],
      ['assignment group', prove.fields.group], ['diagnosis', prove.diagnosis], ['decision', prove.decision],
      ...Object.keys(writing).filter(field => HD_PROVE_EXTRA_TEXT.includes(field) && field !== 'kbDraft').map(field => [String(writing[field].label || field).toLowerCase(), prove[field]]),
      [labels.resolutionNote.toLowerCase(), prove.resolutionNote], [labels.userReply.toLowerCase(), prove.userReply],
      ...(writing.kbDraft ? [['KB draft', prove.kbDraft]] : []),
      ['close the ticket', hdProveClosed(ticket) ? 'yes' : ''],
    ].filter(([, value]) => !String(value || '').trim()).map(([name]) => name);
  }
  return [
    ['Assign to me', hdProveAssigned(ticket) ? 'yes' : ''],
    ['category', prove.fields.category], ['type', prove.fields.type], ['priority', prove.fields.priority],
    ['diagnosis', prove.diagnosis], ['decision', prove.decision],
    ['work note', prove.resolutionNote], ['reply to the user', prove.userReply],
    ['close the ticket', hdProveClosed(ticket) ? 'yes' : ''],
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
  if (hdProveQueue()) return hdProveQueuePrefill(work);
  const prove = hdState.prove;
  const ticket = hdState.tickets[0];
  const submitted = Date.parse(work && work.completedAt);
  if (!prove || !ticket || work.ticketId !== ticket.id || !submitted) return false;
  if (prove.editedAt && Date.parse(prove.editedAt) > submitted) return false;
  const fields = work.fields || {};
  const offered = (value, options) => (options.includes(value) ? value : '');
  const steps = Array.isArray(work.steps) ? work.steps : [];
  if (hdProveMatrix()) {
    prove.fields = Object.fromEntries(HD_PROVE_MATRIX_FIELDS.map(field => [field, hdProveMatrixValue(field, fields[field])]));
    prove.fields.priority = hdMatrixPriority(prove.fields.impact, prove.fields.urgency) || '';
    Object.keys(hdProveWriting()).filter(field => HD_PROVE_EXTRA_TEXT.includes(field)).forEach(field => {
      prove[field] = hdMaskPasswordText(String(work[field] || '').slice(0, hdProveWriting()[field].max || 4000));
    });
  } else prove.fields = hdProvePreset() || {
    category:offered(fields.category, ticket.categoryOptions), type:offered(fields.type, ticket.typeOptions),
    priority:offered(fields.priority, ['P1','P2','P3','P4']),
  };
  prove.diagnosis = offered(work.diagnosis, prove.order.diagnosis);
  prove.decision = offered(work.decision, ['Resolve','Escalate']);
  prove.steps = prove.order.path.filter(id => steps.includes(id));
  // Writing from an attempt sent before passwords were refused is masked.
  prove.resolutionNote = hdMaskPasswordText(String(work.resolutionNote || '').slice(0, 4000));
  prove.userReply = hdMaskPasswordText(String(work.userReply || '').slice(0, 4000));
  ticket.notes = (Array.isArray(work.workNotes) ? work.workNotes : []).map(text => ({ time:'Earlier attempt', author:'Riley Morgan', text:hdMaskPasswordText(String(text)) }));
  hdProvePrefillActions(work, prove, ticket);
  hdSave();
  return true;
}
// What the student did before, so a resubmission from another browser (or
// after clearing site data) keeps it, as one from the same browser does:
// the recorded actions, the laptop as they left it, the two password flags,
// and the ticket's assignment and close. An attempt sent before 2026-11-20
// has no assignment or close, so the ticket starts unassigned.
function hdProvePrefillActions(work, prove, ticket) {
  if (Array.isArray(work.events)) {
    prove.events = work.events.filter(event => event && typeof event === 'object' && typeof event.type === 'string').slice(-400).map(event => ({ ...event }));
    prove.opened = [...new Set(prove.events.filter(event => event.type === 'evidence_opened' && event.source).map(event => event.source))];
  }
  const name = HD_PROVE.shift.selectedComputer;
  const fixture = (HD_PROVE.shift.machines || {})[name];
  if (fixture && work.machine && typeof work.machine === 'object' && !Array.isArray(work.machine)) {
    // Only the fixture's own keys, each with the fixture's type.
    const machine = hdClone(fixture);
    Object.keys(fixture).forEach(key => {
      const value = work.machine[key];
      if (Array.isArray(fixture[key]) && Array.isArray(value)) machine[key] = value.filter(item => typeof item === 'string');
      else if (typeof fixture[key] === typeof value && typeof value !== 'object') machine[key] = value;
    });
    if (HD_PROVE.shift.printerSummary === true) hdProvePrefillPrinters(work.machine, machine);
    if (HD_PROVE.shift.windowsSummary === true) hdProvePrefillWindows(work.machine, machine, fixture);
    hdState.machines = { ...(hdState.machines || {}), [name]:machine };
  }
  if (work.passwordTyped === true) prove.passwordTyped = true;
  if (work.passwordWritten === true) prove.passwordWritten = true;
  // Module 3: a warm handoff from the earlier attempt stays in the history.
  prove.events.filter(event => event.type === 'warm_handoff' && event.label).forEach(event => {
    if (!ticket.troubleshootingHistory.some(entry => entry.action === `${event.label}.`)) ticket.troubleshootingHistory.push({ time:'Earlier attempt', action:`${event.label}.` });
  });
  if (work.assignedTo === 'Riley Morgan') {
    ticket.assignedTechnician = 'Riley Morgan';
    ticket.closureCode = HD_PROVE_RESOLUTION_CODES.includes(work.resolutionCode) ? work.resolutionCode : '';
    const closed = HD_PROVE_CLOSE[prove.decision];
    ticket.status = closed && work.ticketState === closed && (closed !== 'Resolved' || ticket.closureCode) ? closed : 'In Progress';
  } else {
    ticket.assignedTechnician = 'Unassigned';
    ticket.status = 'New';
    ticket.closureCode = '';
  }
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
  if (hdProveLocked() || hdProveServer.sending || hdProveServer.status === 'checking' || hdProveMissing().length || Object.keys(hdProveRefused).length) return;
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
  const refused = Object.values(hdProveRefused);
  const parts = [
    hdProveServer.status === 'returned' ? 'Your instructor returned this Prove It. Their notes are on your course page.' : '',
    hdProveServer.notice,
    ...refused,
    missing.length ? `Still needed: ${missing.join(', ')}.` : '',
  ];
  return { enabled:!missing.length && !refused.length, label, note:parts.filter(Boolean).join(' ') };
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
// Module 3: Class, Category, group and decision are shuffled per attempt
// (seeded, so a reload keeps the order), so no right answer has a fixed
// place. Saved work is restored by value, never by position. Module 1 keeps
// its fixed order.
function hdProveListOrder(options, salt) { return hdProveMatrix() ? hdSeededOrder(options.slice(), ((hdState && hdState.seed) || 1) ^ salt) : options; }
function hdProveSelect(field, label, options, value, locked) {
  return `<label>${hdEsc(label)}<select class="select" ${locked ? 'disabled' : ''} onchange="hdProveSetField('${field}',this.value)"><option value="">Choose…</option>${options.map(option => `<option ${option === value ? 'selected' : ''}>${hdEsc(option)}</option>`).join('')}</select></label>`;
}
// Ticket fields: the student's to set, or (Module 1) set for them and shown
// read-only, with no control to change them.
function hdProveFieldsCard(ticket, prove, locked) {
  if (hdProveMatrix()) {
    const levels = ['1', '2', '3'];
    const select = (field, label, options, names) => `<label>${hdEsc(label)}<select class="select" data-hd-field="${field}" ${locked ? 'disabled' : ''} onchange="hdProveSetField('${field}',this.value)"><option value="">Choose…</option>${options.map(option => `<option value="${hdEsc(option)}" ${option === prove.fields[field] ? 'selected' : ''}>${hdEsc(names ? names[option] : option)}</option>`).join('')}</select></label>`;
    return `<div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Ticket fields</strong></div><div class="card-body hd-control-stack">
      ${select('ticketClass', 'Class', hdProveListOrder(HD_PROVE_CLASSES, 0x27d4eb2f))}${select('category', 'Category', hdProveListOrder(ticket.categoryOptions || [], 0x165667b1))}
      ${select('impact', 'Impact', levels, HD_IMPACT_LABELS)}${select('urgency', 'Urgency', levels, HD_IMPACT_LABELS)}
      <div class="hd-priority-preset"><span>Priority</span> <span id="hd-prove-priority">${hdProvePriorityHtml(prove.fields.priority)}</span><p class="muted" style="margin:4px 0 0">Calculated from Impact × Urgency. You don't type it.</p></div>
      ${select('group', 'Assignment group', hdProveListOrder(HD_ASSIGNMENT_GROUPS, 0x1b873593))}
    </div></div>`;
  }
  const preset = hdProvePreset();
  const body = preset
    ? `<div class="hd-field-grid" data-hd-prove-preset>${[['Category', preset.category], ['Type', preset.type], ['Priority', preset.priority]].map(([label, value]) => `<div><span>${label}</span><strong>${hdEsc(value)}</strong></div>`).join('')}</div><p class="muted">Set for you in Module 1.</p>`
    : `${hdProveSelect('category', 'Category', ticket.categoryOptions, prove.fields.category, locked)}${hdProveSelect('type', 'Type', ticket.typeOptions, prove.fields.type, locked)}${hdProveSelect('priority', 'Priority', ['P1','P2','P3','P4'], prove.fields.priority, locked)}`;
  return `<div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Ticket fields</strong></div><div class="card-body hd-control-stack">${body}</div></div>`;
}
function hdProveTicketView(ticket) {
  const prove = hdState.prove;
  const locked = hdProveLocked();
  // The boxes are drawn from the saved text, which never holds a refused
  // password, so a redraw (Assign to me, Resolve, a decision) clears the
  // refusal too. passwordWritten stays set for the instructor.
  Object.keys(hdProveRefused).forEach(field => { delete hdProveRefused[field]; });
  const off = locked ? 'disabled' : '';
  const steps = prove.order.path.map(id => ticket.pathPool.find(step => step.id === id)).filter(Boolean);
  const labels = hdProveLabels();
  const clock = !!HD_PROVE.shift.now;
  const created = clock ? hdShiftTimeText(ticket.createdTimestamp) : new Date(ticket.createdTimestamp).toLocaleString();
  return `${hdPageHeader(hdTicketLabel(ticket), ticket.title, `<button class="btn btn-secondary" onclick="navigate('#/helpdesk/tickets')">← Queue</button>${locked || hdProveAssigned(ticket) ? '' : `<button id="hd-prove-assign" class="btn btn-primary" onclick="hdProveAssign('${ticket.id}')">Assign to me</button>`}`)}
    <div class="callout info"><strong>Prove It.</strong> Work this ticket on your own: there is no coach and no feedback before you submit. Your instructor reviews your work.</div>
    <div class="hd-ticket-layout">
      <div class="hd-ticket-main">
        <div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Requester statement</strong>${hdBadge(ticket.status)}</div><div class="card-body"><blockquote class="hd-request">${hdEsc(ticket.description)}</blockquote><div class="hd-field-grid"><div><span>Requester</span><strong>${hdEsc(ticket.requester)}</strong></div><div><span>Title</span><strong>${hdEsc(ticket.requesterTitle)}</strong></div><div><span>Department</span><strong>${hdEsc(ticket.department)}</strong></div><div><span>Device</span><strong>${hdEsc(ticket.device)}</strong></div>${ticket.contactType ? `<div><span>Contact type</span><strong>${hdEsc(ticket.contactType)}</strong></div>` : ''}${ticket.cc || !ticket.contactType ? `<div><span>CC</span><strong>${hdEsc(ticket.cc)}</strong></div>` : ''}<div><span>Created</span><strong>${hdEsc(created)}</strong></div>${clock ? `<div><span>Now</span><strong>${hdEsc(hdShiftTimeText(hdShiftNow()))}</strong></div>` : ''}<div><span>Assigned technician</span><strong>${hdEsc(ticket.assignedTechnician)}</strong></div></div></div></div>
        ${hdProveRepliesCard(ticket)}
        ${hdProveOpenList('history', 'Earlier calls on this ticket', 'Open an entry to read it.', ticket.history, locked)}
        ${hdProveOpenList('card', 'Evidence', 'Open a card to see it.', ticket.evidence, locked)}
        ${hdConsoleKbCard(ticket)}
        <div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Your diagnosis</strong></div><div class="card-body"><select id="hd-prove-diagnosis" class="select" ${off} onchange="hdProveChoose('diagnosis',this.value)"><option value="">Choose what this ticket is…</option>${prove.order.diagnosis.map(value => `<option ${prove.diagnosis === value ? 'selected' : ''}>${hdEsc(value)}</option>`).join('')}</select></div></div>
        ${hdProveWritingCard('keyFinding', prove, off)}
        <div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Steps you took</strong><span class="muted">Select every step you actually took.</span></div><div class="card-body"><div class="hd-path">${steps.map(step => `<label style="${hdProveChoiceStyle(prove.steps.includes(step.id))}"><input type="checkbox" ${off} onchange="hdProveToggleStep('${step.id}',this.checked);hdProveMark(this)" ${prove.steps.includes(step.id) ? 'checked' : ''}>${hdEsc(step.text)}</label>`).join('')}</div></div></div>
        <div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Your decision</strong></div><div class="card-body"><div class="hd-path">${hdProveListOrder(['Resolve','Escalate'], 0x85ebca6b).map(value => `<label style="${hdProveChoiceStyle(prove.decision === value)}"><input type="radio" name="hd-prove-decision" ${off} onchange="hdProveChoose('decision','${value}');hdProveMark(this)" ${prove.decision === value ? 'checked' : ''}>${value}</label>`).join('')}</div></div></div>
        <div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>${hdEsc(labels.resolutionNote)}</strong><span class="muted">${hdEsc(labels.resolutionHint)}</span></div><div class="card-body"><textarea id="hd-prove-note" class="ipt hd-note-input" aria-label="${hdEsc(labels.resolutionNote === 'Work notes' ? 'Work note' : labels.resolutionNote)}" rows="7" maxlength="4000" ${off} oninput="hdProveText('resolutionNote',this.value)">${hdEsc(prove.resolutionNote)}</textarea>${ticket.notes.length ? `<p class="muted">Earlier notes:</p><div class="hd-note-list">${ticket.notes.map(note => `<div><strong>${hdEsc(note.author)} · ${hdEsc(note.time)}</strong><p>${hdEsc(note.text)}</p></div>`).join('')}</div>` : ''}</div></div>
        <div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>${hdEsc(labels.userReply)}</strong><span class="muted">Written to ${hdEsc(ticket.requester)}, in your own words.</span></div><div class="card-body"><textarea id="hd-prove-reply" class="ipt hd-note-input" aria-label="${hdEsc(labels.userReply)}" rows="7" maxlength="4000" ${off} oninput="hdProveText('userReply',this.value)">${hdEsc(prove.userReply)}</textarea></div></div>
        ${hdProveWritingCard('kbDraft', prove, off)}
      </div>
      <aside class="hd-ticket-side">
        ${hdProveFieldsCard(ticket, prove, locked)}
        ${hdProveWarmCard(ticket, prove, locked)}
        ${hdProveCloseCard(ticket, locked)}
        <div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Submit</strong></div><div class="card-body hd-control-stack">${HD_PROVE.shift.timeBoxMinutes ? `<p id="hd-prove-time" class="muted" role="status">${hdEsc(hdProveTimeText())}</p>` : ''}${hdProveSubmitCard()}</div></div>
      </aside>
    </div>`;
}
// The ticket's replies: the ones it opens with, then (Module 4) a user's late
// reply once it has arrived (console.arrivals). Nothing when there are none.
function hdProveRepliesCard(ticket) {
  const arrived = ticket.consoleState && Array.isArray(ticket.consoleState.arrived) ? ticket.consoleState.arrived : [];
  const replies = [...ticket.conversation, ...arrived.map(entry => ({ from:entry.from, role:`${ticket.requesterTitle} · ${entry.time}`, text:entry.text }))];
  if (!replies.length) return '';
  return `<div class="card" data-hd-prove-replies><div class="card-header" ${HD_PROVE_HEADER}><strong>Ticket replies</strong></div><div class="card-body hd-note-list">${replies.map(reply => `<div><strong>${hdEsc(reply.from)} · ${hdEsc(reply.role)}</strong><p>${hdEsc(reply.text)}</p></div>`).join('')}</div></div>`;
}
// Module 3: the earlier calls and the evidence cards. Each shows its title
// and an Open button; its text shows once opened (recorded once). Nothing
// says which entries matter. Shows nothing on a ticket with none (Module 1).
function hdProveOpenList(kind, title, hint, items, locked) {
  if (!Array.isArray(items) || !items.length) return '';
  const opened = hdState.prove.opened;
  const body = items.map(item => {
    const source = `${kind}:${item.id}`;
    const open = opened.includes(source);
    const text = kind === 'history'
      ? `<p>${hdEsc(item.text)}</p>`
      : `${(item.lines || []).map(line => `<p><strong>${hdEsc(line)}</strong></p>`).join('')}${(item.notes || []).map(line => `<p class="muted">${hdEsc(line)}</p>`).join('')}`;
    return `<div data-hd-prove-open="${hdEsc(source)}"><strong>${hdEsc(item.title)}</strong>${kind === 'history' && item.author ? ` <small class="muted">${hdEsc(item.author)}</small>` : ''}${open ? text : locked ? '<p class="muted">Not opened.</p>' : `<p><button type="button" class="btn btn-secondary btn-sm" onclick="hdProveOpenCard('${kind}','${hdEsc(item.id)}')">Open</button></p>`}</div>`;
  }).join('');
  return `<div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>${hdEsc(title)}</strong><span class="muted">${hdEsc(hint)}</span></div><div class="card-body hd-note-list">${body}</div></div>`;
}
// Module 3's extra writing boxes (hdProveWriting). Nothing for Module 1.
function hdProveWritingCard(field, prove, off) {
  const box = hdProveWriting()[field];
  if (!box || !HD_PROVE_EXTRA_TEXT.includes(field)) return '';
  return `<div class="card" data-hd-prove-writing="${field}"><div class="card-header" ${HD_PROVE_HEADER}><strong>${hdEsc(box.label)}</strong><span class="muted">${hdEsc(box.hint || '')}</span></div><div class="card-body"><textarea id="hd-prove-${field}" class="ipt hd-note-input" aria-label="${hdEsc(box.label)}" rows="${Number(box.rows) || 5}" maxlength="${Number(box.max) || 4000}" ${off} oninput="hdProveText('${field}',this.value)">${hdEsc(prove[field] || '')}</textarea></div></div>`;
}
// Module 3: Warm handoff calls the chosen assignment group and logs it.
function hdProveWarmCard(ticket, prove, locked) {
  const spec = hdProveSpec();
  if (!spec || spec.warmHandoff !== true) return '';
  const calls = prove.events.filter(event => event.type === 'warm_handoff' && event.label).map(event => `<p>${hdEsc(event.label)}</p>`).join('');
  return `<div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Warm handoff</strong></div><div class="card-body hd-control-stack"><p class="muted">Calls the assignment group you chose and logs the call on the ticket.</p>${locked ? '' : `<button id="hd-prove-warm" type="button" class="btn btn-secondary" ${prove.fields.group ? '' : 'disabled'} onclick="hdProveWarmHandoff()">Call the assignment group</button>`}${calls || '<p class="muted">No calls logged.</p>'}</div></div>`;
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
    'helpdesk/knowledge-base':'Knowledge Base', 'helpdesk/settings-printers':'Settings · Printers & scanners',
  };
  Object.entries(HD_PROVE_EVIDENCE_ROUTES).forEach(([route, label]) => {
    const view = VIEWS[route];
    if (typeof view === 'function') VIEWS[route] = (...args) => { hdProveOpened(`screen:${route}`, label); return view(...args); };
  });
  // A queue shift: the dashboard is the queue (the dashboard would list the
  // tickets by internal id). A ticket waiting to arrive is checked now and
  // every 15 seconds, with the time-used line. A redraw waits while the
  // student is typing or choosing.
  if (hdProveQueue() && !HD_PROVE.blocked) {
    VIEWS['helpdesk/dashboard'] = () => VIEWS['helpdesk/tickets']();
    hdProveQueueArrive(true);
    if (typeof setInterval === 'function') {
      setInterval(() => {
        const time = typeof document !== 'undefined' && document.getElementById ? document.getElementById('hd-prove-time') : null;
        if (time) time.textContent = hdProveTimeText();
        if (!hdProveQueueArrive()) return;
        const active = typeof document !== 'undefined' ? document.activeElement : null;
        if (active && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName || '')) return;
        hdProveQueueRender();
      }, 15000);
    }
  }
  // A one-ticket shift with its own clock (Module 3): the dashboard is the
  // queue (its metrics would count an SLA the ticket doesn't show), and the
  // time-used line updates every 15 seconds without a redraw.
  if (!hdProveQueue() && HD_PROVE.shift.now && !HD_PROVE.blocked) {
    VIEWS['helpdesk/dashboard'] = () => VIEWS['helpdesk/tickets']();
    if (HD_PROVE.shift.timeBoxMinutes && typeof setInterval === 'function') {
      setInterval(() => {
        const time = typeof document !== 'undefined' && document.getElementById ? document.getElementById('hd-prove-time') : null;
        if (time) time.textContent = hdProveTimeText();
      }, 15000);
    }
  }
}

window.hdSelectTicket=hdSelectTicket; window.hdSetQueueFilter=hdSetQueueFilter; window.hdSetPriorityFilter=hdSetPriorityFilter;
window.hdAssignTicket=hdAssignTicket; window.hdTransitionTicket=hdTransitionTicket; window.hdSetTicketPriority=hdSetTicketPriority;
window.hdAddNote=hdAddNote; window.hdContactRequester=hdContactRequester; window.hdSubmitDiagnosis=hdSubmitDiagnosis; window.hdResolveTicket=hdResolveTicket;
window.hdLinkProblem=hdLinkProblem; window.hdResetShift=hdResetShift; window.hdPracticeReport=hdPracticeReport; window.hdOpenUser=hdOpenUser;
window.hdSetAdTab=hdSetAdTab; window.hdAdAction=hdAdAction; window.hdSelectComputer=hdSelectComputer;
window.hdRunPowerShell=hdRunPowerShell; window.hdPrinterAction=hdPrinterAction;
window.hdSetEventFilter=hdSetEventFilter; window.hdClearEventFilter=hdClearEventFilter; window.hdM01Identity=hdM01Identity;
window.hdM01Hint=hdM01Hint; window.hdM01AdLockoutDetails=hdM01AdLockoutDetails;
window.hdKbSearch=hdKbSearch; window.hdKbOpen=hdKbOpen; window.hdChatAsk=hdChatAsk; window.hdVerify=hdVerify; window.hdKeepDraft=hdKeepDraft;
window.hdConsoleUnlock=hdConsoleUnlock; window.hdAddComment=hdAddComment; window.hdSetResolutionCode=hdSetResolutionCode; window.hdKeepPendingState=hdKeepPendingState;
window.hdConsoleAction=hdConsoleAction; window.hdConsoleOwner=hdConsoleOwner; window.hdConsoleCheckWork=hdConsoleCheckWork;

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
// Module 3 on: a caller's messages arrive and a hold timer counts in real
// time. The timer text changes in place; a redraw comes only when a message
// arrives or a hold runs over, and waits while the student is typing.
// A redraw that waited is owed: the first tick with no focused field does it.
let hdCommsRedrawOwed = false;
function hdCommsTimerTick() {
  hdHoldTimerRefresh();
  if (hdCommsTick()) { hdSave(); hdCommsRedrawOwed = true; }
  if (!hdCommsRedrawOwed) return false;
  // Any focused field waits, empty or not (a date and time picker reads
  // empty until both parts are set).
  const active = typeof document !== 'undefined' ? document.activeElement : null;
  if (active && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName || '')) return false;
  hdCommsRedrawOwed = false;
  const content = typeof document !== 'undefined' && document.getElementById ? document.getElementById('content') : null;
  const top = content ? content.scrollTop : 0;
  render();
  if (content) content.scrollTop = top;
  return true;
}
if (!HD_PROVE && typeof setInterval === 'function') setInterval(hdCommsTimerTick, 1000);
