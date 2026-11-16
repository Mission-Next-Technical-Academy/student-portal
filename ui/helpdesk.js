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
function hdPracticeClosed() {
  if (!HD_PRACTICE_SET || !hdState || !Array.isArray(hdState.tickets)) return false;
  return HD_PRACTICE_SET.set.tickets.every(id => {
    const ticket = hdState.tickets.find(item => item.id === id);
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
  opener.postMessage({ type:'mnt-practice-complete', id:HD_PRACTICE_SET.key, nonce, student:HD_PRACTICE_SET.student, tickets:HD_PRACTICE_SET.set.tickets.slice() }, origin);
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
  // Only a Practice shift gets the Practice scenarios.
  return practice ? hdEnsurePractice(state) : state;
}
// A shift with only a set's tickets, built from every Practice template so
// a set's own (ownSet) tickets are there. A set with `now` runs on its own
// fixed clock (hdShiftNow), which only "Next day" moves.
function hdFreshSetState(set) {
  const state = hdFreshState(HD_TICKET_TEMPLATES, true);
  state.tickets = state.tickets.filter(ticket => set.tickets.includes(ticket.id));
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
  hdState = fresh;
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
// A fresh Prove shift: the Practice shift builder with the module's own
// tickets, fixtures and machine state. Ticket fields start empty (the student
// sets them) unless the ticket pre-sets them, and the option lists are
// shuffled per attempt.
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
      rubricVersion:shift.rubricVersion, startedAt:new Date().toISOString(),
      order:{
        diagnosis:hdSeededOrder(ticket.diagnosisOptions, state.seed),
        path:hdSeededOrder(ticket.pathPool.map(step => step.id), state.seed ^ 0x5bd1e995),
      },
      fields:hdProvePreset() || { category:'', type:'', priority:'' },
      diagnosis:'', steps:[], decision:'', resolutionNote:'', userReply:'',
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
  if (state.prove) ['resolutionNote', 'userReply'].forEach(field => scrubText(state.prove, field, state.prove));
  if (changed) { try { localStorage.setItem(hdStateKey(), JSON.stringify(state)); } catch (_) {} }
  return state;
}
// A Prove draft saved under an earlier version of the ticket (its rubric
// version differs, or it has none) starts from the current ticket, keeping the
// student's writing, notes and recorded actions. Its step choices are dropped
// (the step ids are new) and the laptop starts as the current fixture says.
function hdProveUpgrade(saved) {
  if (!HD_PROVE || !saved || !saved.prove || saved.prove.rubricVersion === HD_PROVE.shift.rubricVersion) return saved;
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
function hdKbArticles() { return HD_PROVE ? [...HD_KB_ARTICLES.filter(article => !article.practiceOnly), ...(HD_PROVE.shift.kbArticles || [])] : HD_KB_ARTICLES; }
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
  return base ? { ...base, ...(hdState.computerOverrides[name] || {}) } : null;
}
function hdOpenTickets() { return hdState.tickets.filter(t => !['Resolved','Closed','Canceled'].includes(t.status)); }
// Older tickets' SLA clock, unchanged: a matrix ticket uses hdMatrixSla.
function hdSlaMinutes(ticket) { return { P1:15, P2:120, P3:480, P4:1440 }[ticket.priority] || 480; }
function hdAgeMinutes(ticket) { return Math.max(0, Math.round((hdShiftNow() - new Date(ticket.createdTimestamp)) / 60000)); }
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
// On a set's own clock the history shows shift time (day and time, UTC).
function hdHistory(ticket, action) {
  ticket.troubleshootingHistory.push({ time:hdActiveSet() && hdActiveSet().now ? hdShiftTimeText(hdShiftNow()) : new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }), action });
}

function hdSelectTicket(id) {
  hdState.selectedTicketId = id;
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
  ticket.notes.push({ time:new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }), author:'Riley Morgan', text });
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
      <td><strong>${hdEsc(hdTicketLabel(ticket))}</strong>${ticket.linkedProblem ? `<small>${hdEsc(ticket.linkedProblem)}</small>` : ''}</td>
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
        ${HD_PROVE || !correlated ? '' : `<div class="card hd-correlation"><div class="card-header"><strong>Correlation opportunity</strong>${hdBadge(`${cluster.length} reports`,'warn')}</div><div class="card-body"><h3>Purchasing sign-in failures</h3><p>Users in five departments report the same secure-connection error. Treat the shared timing and evidence as a possible broader incident.</p><button class="btn btn-primary btn-sm" onclick="hdSelectTicket('${cluster[0] ? cluster[0].id : ''}')">Investigate cluster</button></div></div>`}
        <div class="card"><div class="card-header"><strong>Shift discipline</strong></div><div class="card-body">${hdList(['Prioritize business impact and urgency','Own every handoff until accepted','Preserve security evidence','Verify fixes from the user perspective','Close with complete resolution notes'])}</div></div>
      </div>
    </div>`;
};

VIEWS['helpdesk/tickets'] = () => {
  // A set with queue: true gets the ServiceNow-style list instead.
  const set = hdActiveSet();
  if (set && set.queue) return `${hdPageHeader('Ticket Queue', 'Incidents assigned to your group. Add the columns you need, sort, then set your work order.', `${hdNextDayControl()}<button class="btn btn-secondary" onclick="hdResetShift()">Generate new shift</button>`)}${hdProveBlockedNotice()}${hdSetQueueHtml(set)}`;
  let tickets = hdState.tickets;
  if (hdState.queueFilter === 'Open') tickets = tickets.filter(t => !['Resolved','Closed','Canceled'].includes(t.status));
  else if (hdState.queueFilter !== 'All') tickets = tickets.filter(t => t.status === hdState.queueFilter);
  if (hdState.priorityFilter !== 'All') tickets = tickets.filter(t => t.priority === hdState.priorityFilter);
  return `${hdPageHeader('Ticket Queue', 'Classify, prioritize, own, investigate, communicate, resolve, and close.', HD_PROVE ? '' : `<button class="btn btn-secondary" onclick="hdResetShift()">Generate new shift</button>`)}${hdProveBlockedNotice()}
    <div class="filterbar"><label>Status <select class="select" onchange="hdSetQueueFilter(this.value)">${['All','Open',...(hdState.tickets.some(hdIsMatrix) ? [...new Set([...HD_STATUSES, ...HD_SN_STATUSES])] : HD_STATUSES)].map(v => `<option ${v===hdState.queueFilter?'selected':''}>${v}</option>`).join('')}</select></label><label>Priority <select class="select" onchange="hdSetPriorityFilter(this.value)">${['All','P1','P2','P3','P4',...(hdState.tickets.some(hdIsMatrix) ? ['P5'] : [])].map(v => `<option ${v===hdState.priorityFilter?'selected':''}>${v}</option>`).join('')}</select></label><span class="muted">${tickets.length} shown${HD_PROVE ? '' : ' · roots remain hidden until diagnosed'}</span></div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>Ticket</th><th>Priority</th><th>Requester</th><th>Category / summary</th><th>Status</th><th>SLA</th><th>Assigned</th></tr></thead><tbody>${hdQueueRows(tickets)}</tbody></table></div></div>`;
};

VIEWS['helpdesk/ticket'] = () => {
  const ticket = hdCurrentTicket();
  if (!ticket) return `${hdPageHeader('Ticket', 'No ticket selected.')}${hdProveBlockedNotice()}`;
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
    ? `<div><span>Caller</span><strong>${hdEsc(ticket.requester)}</strong></div><div><span>Department</span><strong>${hdEsc(ticket.department)}</strong></div><div><span>Short description</span><strong>${hdEsc(hdShortDescription(ticket) || '—')}</strong></div><div><span>SLA target</span><strong>${hdEsc(hdMatrixTargetText(ticket))}</strong></div><div><span>Created</span><strong>${hdEsc(hdShiftTimeText(ticket.createdTimestamp))}</strong></div><div><span>Assignment group</span><strong>${hdEsc(ticket.assignmentGroup || HD_SERVICE_DESK)}</strong></div><div><span>Assigned to</span><strong>${hdEsc(ticket.assignedTechnician)}</strong></div>${hdConsole(ticket).classify ? '' : `${ticket.contactType ? `<div><span>Contact type</span><strong>${hdEsc(ticket.contactType)}</strong></div>` : ''}${ticket.ci ? `<div><span>Configuration item</span><strong>${hdEsc(ticket.ci)}</strong></div>` : ''}`}`
    : '';
  const factCards = matrix && !(ticket.symptoms || []).length && !(ticket.systemState || []).length ? '' : `<div class="two-col"><div class="card"><div class="card-header"><strong>Observable symptoms</strong></div><div class="card-body">${hdList(ticket.symptoms)}</div></div><div class="card"><div class="card-header"><strong>Relevant system state</strong></div><div class="card-body">${hdList(ticket.systemState)}</div></div></div>`;
  const controls = matrix
    ? `${hdMatrixControls(ticket)}`
    : `${hdConsolePriorityControl(ticket)}${nextStates.length?`<label>Next state<select class="select" onchange="if(this.value)hdTransitionTicket('${ticket.id}',this.value)"><option value="">Choose…</option>${nextStates.map(v=>`<option>${v}</option>`).join('')}</select></label>`:''}<button class="btn btn-secondary" onclick="hdContactRequester('${ticket.id}')">Contact requester</button>${hdConsoleResolutionControl(ticket)}${hdConsole(ticket).owner ? '' : `<button class="btn btn-primary" onclick="hdResolveTicket('${ticket.id}')">${simpleStates ? 'Resolve' : ticket.category==='Security Incident'?'Warm escalate':'Resolve / escalate'}</button>`}`;
  return `${hdPageHeader(hdTicketLabel(ticket), matrix || hdConsole(ticket).classify ? `${hdTicketCategoryText(ticket)} · ${hdStatusText(ticket)}` : `${ticket.category} · ${ticket.subcategory}`, `<button class="btn btn-secondary" onclick="navigate('#/helpdesk/tickets')">← Queue</button>${ticket.assignedTechnician==='Unassigned'?`<button class="btn btn-primary" onclick="hdAssignTicket('${ticket.id}')">Assign to me</button>`:''}`)}
    ${related.length > 1 ? `<div class="callout warning hd-related"><strong>${related.length} related reports detected.</strong> Same application, symptom, and time window. ${ticket.linkedProblem ? `Linked to ${hdEsc(ticket.linkedProblem)}.` : `<button class="btn btn-sm btn-secondary" onclick="hdLinkProblem('${ticket.id}')">Link to problem record</button>`}</div>` : ''}
    <div class="hd-ticket-layout">
      <div class="hd-ticket-main">
        <div class="card"><div class="card-header"><strong>Requester statement</strong>${matrix ? `${ticket.priority ? hdBadge(ticket.priority, ticket.priority.toLowerCase()) : '<span class="muted">Priority not set</span>'}${hdStatusBadge(ticket)}${hdSlaBadge(ticket)}` : `${hdBadge(ticket.priority,ticket.priority.toLowerCase())}${hdBadge(ticket.status)}${hdBadge(sla.label,sla.cls)}`}</div><div class="card-body"><blockquote class="hd-request">${hdEsc(ticket.description)}</blockquote><div class="hd-field-grid">${matrix ? fieldGrid : `<div><span>Requester</span><strong>${hdEsc(ticket.requester)}</strong></div><div><span>Department</span><strong>${hdEsc(ticket.department)}</strong></div><div><span>Business impact</span><strong>${hdEsc(ticket.businessImpact)}</strong></div><div><span>SLA target</span><strong>${hdEsc(ticket.sla)}</strong></div><div><span>Created</span><strong>${new Date(ticket.createdTimestamp).toLocaleString()}</strong></div><div><span>Assigned technician</span><strong>${hdEsc(ticket.assignedTechnician)}</strong></div>${ticket.contactType ? `<div><span>Contact type</span><strong>${hdEsc(ticket.contactType)}</strong></div>` : ''}${ticket.ci ? `<div><span>Configuration item</span><strong>${hdEsc(ticket.ci)}</strong></div>` : ''}${ticket.callerStatus ? `<div><span>Caller</span><strong>${hdEsc(ticket.callerStatus)}</strong></div>` : ''}`}</div></div></div>${hdConsoleVerifyCard(ticket)}${hdConsoleChatCard(ticket)}${hdConsoleKbCard(ticket)}${hdConsoleAccountCard(ticket)}${hdConsoleActionsCard(ticket)}${hdConsoleComputerCard(ticket)}${hdConsoleOwnerCard(ticket)}${hdMatrixCards(ticket)}
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
 *              earlyFeedback?, feedback, history? }]
 *                                  things the technician can do; a critical
 *                                  one is recorded as a critical error
 *   owner: { options:[{ id, text, status, group, code, right?, category?,
 *              subcategory?, caller?, feedback }] }
 *                                  who owns the ticket (resolve at Tier 1,
 *                                  escalate, or route to Security Operations)
 *   feedback: [{ area, checks:[rule], good, fix }]
 *                                  Practice "Check my work": one line per
 *                                  area, never points (hdConsoleFeedback);
 *                                  rule printerInstalled:{ computer, printer }
 *                                  reads the laptop's installed printers
 *   resolveByOutcomes: true        worked through these features alone: no
 *                                  diagnosis or path checklist; Resolved needs
 *                                  every outcome (HD_CONSOLE_OUTCOMES)
 * The student's work on these lives in ticket.consoleState and
 * ticket.customerComments, created only for a ticket that has the feature. */
function hdConsole(ticket) {
  if (!ticket) return {};
  // A Prove ticket can turn on the knowledge base search and nothing else:
  // no caller chat, verification, actions, owner, comments or feedback.
  if (HD_PROVE) {
    const proveTicket = (HD_PROVE.shift.tickets || []).find(item => item.id === ticket.id);
    return proveTicket && proveTicket.console && proveTicket.console.kb === true ? { kb:true } : {};
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
function hdConsoleTime() { return new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }); }
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
// server (prove_note_missing), which keeps the colon rule for now.
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
  const ticket = hdTicketById(id); if (!ticket || !['note', 'comment', 'resolution', 'rewriteShort', 'rewriteDesc', 'kbTitle', 'kbText'].includes(kind)) return;
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
    state.chat.push({ id:question.id, question:question.text, refused:true, time:hdConsoleTime() });
    hdPracticeEvent('password_refused', { ticket:ticket.id, field:'chat' });
    toast(`${HD_PASSWORD_STOP} The help desk never asks for a password, for any reason (KB-0024).`);
    hdRerender(); return;
  }
  const whileLocked = hdChatPending(ticket, question);
  const reply = whileLocked ? (question.replyLocked && hdConsoleAccountLocked(ticket) ? question.replyLocked : question.replyBefore || question.replyLocked) : question.reply;
  state.chat.push({ id:question.id, question:question.text, reply, whileLocked, time:hdConsoleTime() });
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
  hdConsoleState(ticket).unlocks.push({ via, time:hdConsoleTime() });
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
  hdComments(ticket).push({ time:hdConsoleTime(), author:'Riley Morgan', text:text.slice(0, 2000) });
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
  toast(jargon.length ? `Comment added. The customer won't know these words: ${jargon.join(', ')}. Say it in plain words.${internalTip}${repeatTip}` : internalTip ? `Comment added.${internalTip}${repeatTip}` : repeatTip ? `Customer comment added.${repeatTip}` : 'Customer comment added.');
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
  if (!state.critical.some(entry => entry.id === id)) state.critical.push({ id, text, time:hdConsoleTime() });
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
  if (!state.actions.some(entry => entry.id === action.id)) state.actions.push({ id:action.id, time:hdConsoleTime() });
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
  ];
  const flags = [
    ...(ticket.passwordAsked ? ['Asked for a password in the chat (refused, never sent).'] : []),
    ...(ticket.passwordWritten ? ['Wrote a password in a ticket field (refused, not saved).'] : []),
  ];
  return { critical, flags, areas:areas.map(area => {
    const ok = (area.checks || []).every(rule => hdConsoleRule(ticket, rule));
    return { area:area.area, ok, text:ok ? area.good : area.fix };
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
    ...hdMatrixProgress(ticket),
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
  return `<div class="card hd-chat"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Caller chat</strong><span class="muted">${hdEsc(caller.name)} · on the line</span></div><div class="card-body"><div class="hd-note-list">${log}</div>${buttons}</div></div>`;
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
function hdConsoleActionsCard(ticket) {
  const actions = hdConsole(ticket).actions; if (!Array.isArray(actions) || !actions.length) return '';
  const state = hdConsoleState(ticket);
  const taken = (id) => state.actions.some(entry => entry.id === id);
  const last = state.lastAction.startsWith('early:') ? actions.find(item => `early:${item.id}` === state.lastAction) : actions.find(item => item.id === state.lastAction);
  const early = state.lastAction.startsWith('early:');
  const earlyBad = early && last && last.earlyCritical !== false;
  const feedback = last ? `<div class="callout ${earlyBad || (!early && last.critical) ? 'bad' : early ? 'warn' : 'success'}" role="${earlyBad || (!early && last.critical) ? 'alert' : 'status'}">${hdEsc(early ? last.earlyFeedback || (last.needsApproval ? 'Wait for the request to be approved first.' : 'Verify the caller first (KB-0024).') : last.feedback || '')}</div>` : '';
  return `<div class="card hd-actions"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Take an action</strong><span class="muted">What do you do for the caller?</span></div><div class="card-body"><div style="display:grid;gap:8px">${actions.map(action => `<button type="button" class="btn btn-secondary" ${HD_CONSOLE_CHOICE} ${taken(action.id) ? 'disabled' : ''} onclick="hdConsoleAction('${ticket.id}','${hdEsc(action.id)}')">${taken(action.id) ? '✓ ' : ''}${hdEsc(action.text)}</button>`).join('')}</div>${feedback}</div></div>`;
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
  return `<div class="card hd-practice-feedback"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Check my work</strong><span class="muted">Practice: not graded</span></div><div class="card-body"><p class="muted">Feedback on your work so far, by area. Category and priority are pre-set in Module 1.</p>${critical}${flags}${areas}<button type="button" class="btn btn-secondary" onclick="hdConsoleCheckWork('${ticket.id}')">${result ? 'Check again' : 'Check my work'}</button></div></div>`;
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
 *   convert: { number, items:[{ name, approval?, approver?, fields?:[{ id, label, options }] }] }
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
 *   actions may set needsApproval: refused until the RITM is approved, and
 *                                  recorded as its earlyCritical
 * A ticket set (HD_PRACTICE_SETS or HD_COACHED_SETS) may set now (its fixed
 * clock), queue: true (the ServiceNow-style list view), workOrder:{ tickets,
 * groups? } and nextDay:{ unlock:[rule], max? }. The answer-key parts (the
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
function hdShiftNow() {
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
  const now = hdShiftNow().getTime();
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
function hdShiftIso() { return hdShiftNow().toISOString(); }
// The respond target is met once, when the desk first takes the next move.
function hdMatrixRespond(ticket) {
  const clock = hdSlaClock(ticket);
  if (!clock.respondedAt) clock.respondedAt = hdShiftIso();
}
// Every state change on a matrix ticket goes through here, on the shift
// clock: it closes an open stop and opens one for Resolved or for On Hold –
// Awaiting Caller.
function hdMatrixSetStatus(ticket, status, reason, at) {
  const clock = hdSlaClock(ticket); const now = at || hdShiftIso();
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
  const draft = hdConvertDraft(ticket);
  const item = (config.items || []).find(entry => entry.name === draft.item);
  if (!item) { toast('Choose the catalog item first.'); return; }
  if (!draft.requestedFor) { toast('Choose who the request is for.'); return; }
  const missing = (item.fields || []).find(field => !draft.fields[field.id]);
  if (missing) { toast(`Choose the ${missing.label} first.`); return; }
  const approved = item.approval === 'Approved';
  ticket.request = {
    number:config.number || 'RITM', item:item.name, requestedFor:draft.requestedFor,
    fields:(item.fields || []).map(field => ({ id:field.id, label:field.label, value:draft.fields[field.id] })),
    approval:approved ? 'Approved' : 'Requested', approver:item.approver || '', approvedAt:approved ? hdShiftIso() : '', state:'Open',
  };
  hdMatrixRespond(ticket);
  ticket.cancelReason = 'Converted';
  ticket.closureCode = 'Canceled – Converted';
  hdMatrixSetStatus(ticket, 'Canceled');
  hdHistory(ticket, `Converted to Request ${ticket.request.number} (${item.name}); incident Canceled – Converted.`);
  hdPracticeEvent('converted', { ticket:ticket.id, item:item.name });
  hdRerender();
}
function hdRequestApprove(ticket) {
  if (!ticket.request || ticket.request.approval === 'Approved') return;
  ticket.request.approval = 'Approved'; ticket.request.approvedAt = hdShiftIso();
  hdHistory(ticket, `${ticket.request.number} approved${ticket.request.approver ? ` by ${ticket.request.approver}` : ''}.`);
}
function hdRequestClose(id) {
  const ticket = hdTicketById(id); if (!ticket || !ticket.request || ticket.request.state !== 'Open') return;
  if (ticket.request.approval !== 'Approved') { toast('The request can\'t be closed before it is approved.'); return; }
  ticket.request.state = 'Closed Complete';
  hdHistory(ticket, `${ticket.request.number} closed complete.`);
  hdRerender();
}
function hdRequestApproved(ticket) { return !!(ticket.request && ticket.request.approval === 'Approved'); }

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
// linked, resolved; all: [...] needs each one. No `when`: at once.
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
      state.arrived.push({ id:arrival.id, from:arrival.from || ticket.requester, text:arrival.text, time:at ? hdShiftTimeText(at) : hdActiveSet() && hdActiveSet().now ? hdShiftTimeText(hdShiftNow()) : hdConsoleTime() });
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
  if (title.length < 5) { toast('Give the knowledge draft a title that names the symptom and the fix.'); return; }
  if (text.length < 10) { toast('Write the steps that fixed it in the knowledge draft.'); return; }
  if (hdPasswordInText(title) || hdPasswordInText(text)) { toast(hdRefusePasswordText(ticket, 'knowledge draft')); return; }
  state.kbDraft = { title, text, state:'Review', at:hdActiveSet() && hdActiveSet().now ? hdShiftIso() : new Date().toISOString() };
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
  hdConsoleState(ticket).contactAttempts.push({ at:hdShiftIso(), method });
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
  if (!HD_QUEUE_LISTS[view.list]) view.list = 'unassigned';
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
  const rows = tickets.map(ticket => `<tr class="hd-ticket-row" data-hd-row="${hdEsc(ticket.id)}" tabindex="0" onclick="hdSelectTicket('${ticket.id}')" onkeydown="if(event.key==='Enter')hdSelectTicket('${ticket.id}')"><td><strong>${hdEsc(hdTicketLabel(ticket))}</strong>${ticket.parentId && hdTicketById(ticket.parentId) ? `<small>Child of ${hdEsc(hdTicketLabel(hdTicketById(ticket.parentId)))}</small>` : ''}</td><td>${hdEsc(hdShortDescription(ticket) || ticket.description)}</td>${view.columns.map(key => `<td data-hd-cell="${key}">${hdQueueCell(ticket, key)}</td>`).join('')}<td>${hdStatusBadge(ticket)}</td><td>${hdEsc(ticket.assignedTechnician)}</td></tr>`).join('')
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
  // State first; the reason select is read when On Hold is chosen.
  // State and assignment group apply with a button, so moving through a
  // list with the arrow keys never changes the ticket.
  const state = next.length ? `<label>State<select id="hd-next-state" class="select" data-hd-field="state"><option value="">${hdEsc(hdStatusText(ticket))}</option>${next.map(value => `<option>${value}</option>`).join('')}</select></label>${next.includes('On Hold') ? `<label>On Hold reason (only for On Hold)<select id="hd-hold-reason" class="select"><option value="">Choose…</option>${HD_HOLD_REASONS.map(reason => `<option ${ticket.holdReason === reason ? 'selected' : ''}>${reason}</option>`).join('')}</select></label>` : ''}<button type="button" class="btn btn-secondary" onclick="hdApplyState('${ticket.id}')">Apply state</button>` : `<div><span class="muted">State</span> ${hdStatusBadge(ticket)}</div>`;
  const group = closed ? `<div><span class="muted">Assignment group</span> <strong>${hdEsc(ticket.assignmentGroup || HD_SERVICE_DESK)}</strong></div>` : `<label>Assignment group<select id="hd-assignment-group" class="select" data-hd-field="group">${HD_ASSIGNMENT_GROUPS.map(value => `<option ${(ticket.assignmentGroup || HD_SERVICE_DESK) === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><button type="button" class="btn btn-secondary" onclick="hdApplyGroup('${ticket.id}')">Assign to group</button>`;
  const resolving = !closed ? `<label>Resolution notes (required to resolve)<textarea id="hd-resolution-notes" class="ipt" rows="4" maxlength="4000" oninput="hdKeepDraft('${ticket.id}','resolution',this.value)" placeholder="Why and how it was closed">${hdEsc(hdDraft(ticket, 'resolution'))}</textarea></label>` : '';
  return `${select('impact', 'Impact')}${select('urgency', 'Urgency')}${priority}${hdClassifyControls(ticket)}${group}${state}${hdConsoleResolutionControl(ticket)}${resolving}`;
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
    const close = request.state === 'Open' ? `<button type="button" class="btn btn-secondary" ${request.approval === 'Approved' ? '' : 'disabled style="opacity:.55;cursor:not-allowed"'} onclick="hdRequestClose('${ticket.id}')">Close the request (Closed Complete)</button>` : '';
    return `<div class="card hd-request-item" data-hd-request="${hdEsc(request.number)}"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Requested item ${hdEsc(request.number)}</strong>${hdBadge(`Approval: ${request.approval}`, request.approval === 'Approved' ? 'ok' : 'warn')}${hdBadge(request.state, request.state === 'Open' ? 'in-progress' : 'closed')}</div><div class="card-body"><dl class="hd-dl"><dt>Catalog item</dt><dd>${hdEsc(request.item)}</dd><dt>Requested for</dt><dd>${hdEsc(request.requestedFor)}</dd>${fields}${request.approver ? `<dt>Approver</dt><dd>${hdEsc(request.approver)}</dd>` : ''}<dt>SLA</dt><dd class="muted">None: requests have no SLA bar here</dd></dl>${close}</div></div>`;
  }
  if (['Resolved', 'Closed', 'Canceled'].includes(ticket.status)) return '';
  const draft = hdConvertDraft(ticket);
  const item = (config.items || []).find(entry => entry.name === draft.item);
  const fields = item ? (item.fields || []).map(field => `<label>${hdEsc(field.label)}<select class="select" data-hd-convert="${hdEsc(field.id)}" onchange="hdConvertSet('${ticket.id}','${hdEsc(field.id)}',this.value)"><option value="">Choose…</option>${(field.options || []).map(value => `<option ${draft.fields[field.id] === value ? 'selected' : ''}>${hdEsc(value)}</option>`).join('')}</select></label>`).join('') : '';
  return `<div class="card hd-convert"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Convert to Request</strong><span class="muted">For something new, not something broken.</span></div><div class="card-body" style="display:grid;gap:8px"><label>Catalog item<select class="select" data-hd-convert="item" onchange="hdConvertSet('${ticket.id}','item',this.value)"><option value="">Choose…</option>${(config.items || []).map(entry => `<option ${draft.item === entry.name ? 'selected' : ''}>${hdEsc(entry.name)}</option>`).join('')}</select></label><label>Requested for<select class="select" data-hd-convert="requestedFor" onchange="hdConvertSet('${ticket.id}','requestedFor',this.value)"><option value="">Choose…</option>${HD_USERS.map(user => `<option ${draft.requestedFor === user.name ? 'selected' : ''}>${hdEsc(user.name)}</option>`).join('')}</select></label>${fields}<div><button type="button" class="btn btn-primary" onclick="hdConvertToRequest('${ticket.id}')">Convert to Request</button></div></div></div>`;
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
        ? `<div style="display:grid;gap:8px"><label>Knowledge draft title<input id="hd-kb-draft-title" class="ipt" maxlength="160" value="${hdEsc(hdDraft(ticket, 'kbTitle'))}" oninput="hdKeepDraft('${ticket.id}','kbTitle',this.value)" placeholder="Symptom: the fix"></label><label>Steps that fixed it<textarea id="hd-kb-draft-text" class="ipt" rows="4" maxlength="4000" oninput="hdKeepDraft('${ticket.id}','kbText',this.value)">${hdEsc(hdDraft(ticket, 'kbText') || ticket.resolution || '')}</textarea></label><div><button type="button" class="btn btn-secondary" onclick="hdKbCreateDraft('${ticket.id}')">Create knowledge draft</button></div></div>`
        : '<p class="muted">Create knowledge draft: available once the ticket is resolved.</p>';
  }
  return `<div class="card hd-related-knowledge"><div class="card-header" ${HD_CONSOLE_HEADER}><strong>Related › Knowledge</strong></div><div class="card-body">${list}${draft}</div></div>`;
}
function hdMatrixCards(ticket) {
  return `${hdArrivalsCard(ticket)}${hdConvertCard(ticket)}${hdLinkCard(ticket)}${hdRewriteCard(ticket)}${hdContactCard(ticket)}${hdKnowledgeCard(ticket)}`;
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
    ${hdState.adTab==='computers'?`<div class="card"><div class="table-wrap"><table><thead><tr><th>Computer</th><th>User</th><th>OU</th><th>Trust</th><th>BitLocker</th><th>Health</th></tr></thead><tbody>${hdComputers().map(c=>{const x=hdComputerByName(c.name);return `<tr><td><strong>${hdEsc(x.name)}</strong><small>${hdEsc(x.ip)}</small></td><td>${hdEsc(x.user)}</td><td><code>${hdEsc(x.ou)}</code></td><td>${hdBadge(x.trust,x.trust==='Healthy'?'ok':'bad')}</td><td>${hdBadge(x.bitlocker,x.bitlocker==='Protected'?'ok':'warn')}</td><td>${hdEsc(x.health)}</td></tr>`}).join('')}</tbody></table></div></div>`:''}`;
};

function hdSelectComputer(name, route) { hdState.selectedComputer=name; hdProveOpened(`computer:${name}`, `Endpoint · ${name}`); hdSave(); if(route) navigate(route); else render(); }
function hdEndpointCards() { return hdComputers().map(base=>{const c=hdComputerByName(base.name);return `<button class="hd-device-card ${hdState.selectedComputer===c.name?'active':''}" onclick="hdSelectComputer('${c.name}')"><strong>${hdEsc(c.name)}</strong><span>${hdEsc(c.user)}</span><small>${hdEsc(c.health)} · ${hdEsc(c.lastSeen)}</small></button>`}).join(''); }
VIEWS['helpdesk/windows'] = () => { const c=hdComputerByName(hdState.selectedComputer)||hdComputerByName('NS-LT-0042'); return `${hdPageHeader('Windows Desktop', 'Inspect a managed Windows 11 endpoint before choosing a repair.')}<div class="hd-endpoint-layout"><aside class="card"><div class="card-header"><strong>Endpoints</strong></div><div class="hd-device-list">${hdEndpointCards()}</div></aside><div class="hd-windows-screen"><div class="hd-window-bar"><span>${hdEsc(c.name)} · Remote session</span><span>— □ ×</span></div><div class="hd-window-body"><div class="hd-desktop-hero"><strong>Windows 11 Enterprise</strong><span>${hdEsc(c.os)}</span></div><div class="hd-field-grid"><div><span>Signed-in user</span><strong>${hdEsc(c.user)}</strong></div><div><span>IPv4</span><strong>${hdEsc(c.ip)}</strong></div><div><span>Domain trust</span><strong>${hdEsc(c.trust)}</strong></div><div><span>BitLocker</span><strong>${hdEsc(c.bitlocker)}</strong></div><div><span>OU</span><strong>${hdEsc(c.ou)}</strong></div><div><span>Health</span><strong>${hdEsc(c.health)}</strong></div>${c.uptimeDays ? `<div><span>Uptime</span><strong>${hdEsc(c.uptimeDays)} days</strong></div>` : ''}</div><div class="hd-tool-grid"><button onclick="navigate('#/helpdesk/event-viewer')">📋 Event Viewer</button><button onclick="navigate('#/helpdesk/powershell')">&gt;_ PowerShell</button><button onclick="navigate('#/helpdesk/active-directory')">🗂 Directory</button><button onclick="navigate('#/helpdesk/remote-support')">🖥 Remote Support</button>${hdSettingsPrinterPaths(c.name).length ? `<button onclick="navigate('#/helpdesk/settings-printers')">⚙ Settings › Printers &amp; scanners</button>` : ''}</div></div></div></div>`; };

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
  if (config.action && !state.actions.some(entry => entry.id === config.action)) state.actions.push({ id:config.action, time:hdConsoleTime() });
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
    </div>`;
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

/* ---------- Prove It ticket ----------
 * One assigned ticket, worked with no coach and no feedback: the student sets
 * the ticket fields, chooses a diagnosis from a shuffled list and the steps
 * they took from a shuffled mixed pool, decides Resolve or Escalate and
 * writes the resolution note and the reply to the user. Nothing here says
 * which choice is right; scoring is not in the simulator. */
function hdProveSetField(field, value) {
  // Pre-set fields (Module 1) can't be changed.
  if (hdProveLocked() || hdProvePreset() || !['category','type','priority'].includes(field)) return;
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
// Typing is saved, not recorded as events. While a box holds a password it
// isn't saved (the last text without one stays) and Submit waits until the
// student removes it. Not kept across reloads: a reload shows the saved text.
const HD_PROVE_TEXT_LABELS = { resolutionNote:'resolution note', userReply:'reply to the user' };
const hdProveRefused = {};
function hdProveText(field, value) {
  if (hdProveLocked() || !['resolutionNote','userReply'].includes(field)) return;
  const text = String(value || '').slice(0, 4000);
  if (hdPasswordInText(text)) {
    if (!hdProveRefused[field]) hdProveRefused[field] = `${hdRefusePasswordText(null, HD_PROVE_TEXT_LABELS[field])} Remove it to submit.`;
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
    commands:prove.events.filter(event => event.type === 'command_run').map(event => ({ command:hdRedactCommand(event.command || ''), computer:event.computer, at:event.at })),
    events:prove.events.map(event => (typeof event.command === 'string' ? { ...event, command:hdRedactCommand(event.command) } : event)),
    machine:hdClone(hdMachine(shift.selectedComputer) || {}),
    passwordTyped:prove.passwordTyped === true, passwordWritten:prove.passwordWritten === true,
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
  prove.fields = hdProvePreset() || {
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
  if (hdProveLocked() || hdProveServer.sending || hdProveServer.status === 'checking' || hdProveMissing().length || Object.keys(hdProveRefused).length) return;
  // A note typed but not yet added is part of the work.
  const note = document.getElementById('hd-note-input');
  if (note && note.value.trim() && !hdAddNote(hdState.tickets[0].id)) return;
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
function hdProveSelect(field, label, options, value, locked) {
  return `<label>${hdEsc(label)}<select class="select" ${locked ? 'disabled' : ''} onchange="hdProveSetField('${field}',this.value)"><option value="">Choose…</option>${options.map(option => `<option ${option === value ? 'selected' : ''}>${hdEsc(option)}</option>`).join('')}</select></label>`;
}
// Ticket fields: the student's to set, or (Module 1) set for them and shown
// read-only, with no control to change them.
function hdProveFieldsCard(ticket, prove, locked) {
  const preset = hdProvePreset();
  const body = preset
    ? `<div class="hd-field-grid" data-hd-prove-preset>${[['Category', preset.category], ['Type', preset.type], ['Priority', preset.priority]].map(([label, value]) => `<div><span>${label}</span><strong>${hdEsc(value)}</strong></div>`).join('')}</div><p class="muted">Set for you in Module 1.</p>`
    : `${hdProveSelect('category', 'Category', ticket.categoryOptions, prove.fields.category, locked)}${hdProveSelect('type', 'Type', ticket.typeOptions, prove.fields.type, locked)}${hdProveSelect('priority', 'Priority', ['P1','P2','P3','P4'], prove.fields.priority, locked)}`;
  return `<div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Ticket fields</strong></div><div class="card-body hd-control-stack">${body}</div></div>`;
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
        ${hdConsoleKbCard(ticket)}
        <div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Your diagnosis</strong></div><div class="card-body"><select id="hd-prove-diagnosis" class="select" ${off} onchange="hdProveChoose('diagnosis',this.value)"><option value="">Choose what this ticket is…</option>${prove.order.diagnosis.map(value => `<option ${prove.diagnosis === value ? 'selected' : ''}>${hdEsc(value)}</option>`).join('')}</select></div></div>
        <div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Steps you took</strong><span class="muted">Select every step you actually took.</span></div><div class="card-body"><div class="hd-path">${steps.map(step => `<label style="${hdProveChoiceStyle(prove.steps.includes(step.id))}"><input type="checkbox" ${off} onchange="hdProveToggleStep('${step.id}',this.checked);hdProveMark(this)" ${prove.steps.includes(step.id) ? 'checked' : ''}>${hdEsc(step.text)}</label>`).join('')}</div></div></div>
        <div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Your decision</strong></div><div class="card-body"><div class="hd-path">${['Resolve','Escalate'].map(value => `<label style="${hdProveChoiceStyle(prove.decision === value)}"><input type="radio" name="hd-prove-decision" ${off} onchange="hdProveChoose('decision','${value}');hdProveMark(this)" ${prove.decision === value ? 'checked' : ''}>${value}</label>`).join('')}</div></div></div>
        <div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Resolution note</strong><span class="muted">What you did, what it proved, and the outcome.</span></div><div class="card-body"><textarea id="hd-prove-resolution" class="ipt hd-note-input" rows="7" maxlength="4000" ${off} oninput="hdProveText('resolutionNote',this.value)">${hdEsc(prove.resolutionNote)}</textarea></div></div>
        <div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Reply to the user</strong><span class="muted">Written to ${hdEsc(ticket.requester)}, in your own words.</span></div><div class="card-body"><textarea id="hd-prove-reply" class="ipt hd-note-input" rows="7" maxlength="4000" ${off} oninput="hdProveText('userReply',this.value)">${hdEsc(prove.userReply)}</textarea></div></div>
        <div class="card"><div class="card-header" ${HD_PROVE_HEADER}><strong>Work notes</strong><span class="muted">Facts, commands, results, interpretation, next action.</span></div><div class="card-body"><div class="hd-note-list">${ticket.notes.length ? ticket.notes.map(note => `<div><strong>${hdEsc(note.author)} · ${hdEsc(note.time)}</strong><p>${hdEsc(note.text)}</p></div>`).join('') : '<p class="muted">No technician notes yet.</p>'}</div>${locked ? '' : `<textarea id="hd-note-input" class="ipt hd-note-input" rows="7" maxlength="2000" placeholder="Document the action you took and what the result proved…"></textarea><button class="btn btn-secondary" onclick="hdAddNote('${ticket.id}')">Add work note</button>`}</div></div>
      </div>
      <aside class="hd-ticket-side">
        ${hdProveFieldsCard(ticket, prove, locked)}
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
    'helpdesk/knowledge-base':'Knowledge Base', 'helpdesk/settings-printers':'Settings · Printers & scanners',
  };
  Object.entries(HD_PROVE_EVIDENCE_ROUTES).forEach(([route, label]) => {
    const view = VIEWS[route];
    if (typeof view === 'function') VIEWS[route] = (...args) => { hdProveOpened(`screen:${route}`, label); return view(...args); };
  });
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
window.hdConsoleUnlock=hdConsoleUnlock; window.hdAddComment=hdAddComment; window.hdSetResolutionCode=hdSetResolutionCode;
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
