/* Guided step-by-step walkthroughs for IT Help Desk modules, registered as
 * real MODULE_COACHES entries so they get the exact engine SOC's m01 coach
 * already uses: spotlighting, the progress bar, do()/check() gating, focus
 * lock. Loaded after coach-data.js and coach.js, before boot() reads the URL
 * (script execution order doesn't matter for the MODULE_COACHES.push() calls
 * themselves — boot() only runs on DOMContentLoaded, after every synchronous
 * script including this one has already executed).
 *
 * Entries: ?coach=hd-m01, ?coach=hd-m02 (matches the platform's own
 * ?coach=<id> convention).
 */

(function () {
  'use strict';
  if (typeof MODULE_COACHES === 'undefined') return;

  // coach.js's own finish()/portalUrl() default to a hardcoded soc-analyst
  // URL when a step's finish.href is omitted (it only knows about one
  // program). coach.js is wrapped in its own IIFE, so portalUrl() isn't
  // reachable from here — this replicates its exact local/deployed branching
  // so an explicit finish.href resolves to a real, valid URL (new URL(href)
  // is called on it inside finish(), which throws on a bare hash string).
  function itsPortalUrl(hash, completionToken) {
    const local = ['127.0.0.1', 'localhost'].includes(location.hostname);
    const base = local
      ? `${location.protocol}//${location.hostname}:8768/`
      : location.origin + location.pathname.replace(/sim\/?$/, '');
    const completion = completionToken ? `?coachComplete=${encodeURIComponent(completionToken)}` : '';
    return base + completion + (hash || '');
  }

  // Practice It sends a compact snapshot of the tickets this coach uses when
  // the student reaches its final step. The parent portal validates it again
  // before writing it to lab_attempts.result. Answer keys and fixture logs are
  // deliberately excluded; this is only the student's recorded work.
  const HD_COACH_TICKET_IDS = {
    'hd-m01': ['HD-2150'],
    // Module 4 (key its-02) Lab 4.3. Older attempts keep HD-2106 and HD-2112
    // on their sheet (portal/admin-sheets/hdesk.js).
    'hd-m02': ['HD-2134'],
    'hd-m02-server': ['HD-2173'],
    // Module 5 (key its-03) Lab 5.1. Older attempts keep HD-2109 on their
    // sheet (portal/admin-sheets/hdesk.js).
    'hd-m03': ['HD-2180'],
    // Module 9 (key its-04) Lab 9.1. Older attempts keep HD-2104 and HD-2105
    // (the instructor sheet's EARLIER_TICKETS_BY_LAB).
    'hd-m04': ['HD-2212', 'HD-2213', 'SR-2222'],
    // Module 7 (key its-05) Lab 7.1. Older attempts keep HD-2108 and HD-2117
    // on their sheet (portal/admin-sheets/hdesk.js).
    'hd-m05': ['HD-2189', 'HD-2190'],
    // Module 8 (key its-06) Lab 8.1. Older attempts keep SR-2107 and HD-2118
    // on their sheet (portal/admin-sheets/hdesk.js). The optional extension
    // (hd-m06-ext) sends nothing, so it has no entry.
    'hd-m06': ['HD-2196', 'HD-2197', 'SR-2207'],
    // Module 6 (key its-07) Lab 6.1. Older attempts keep HD-2119 on their
    // sheet (portal/admin-sheets/hdesk.js).
    'hd-m07': ['HD-2176'],
    'hd-m08': ['HD-2110', 'HD-2111'],
    'hd-m09': ['SEC-2114', 'SEC-2115'],
    'hd-m10': ['HD-2158', 'HD-2159', 'HD-2160', 'SR-2161', 'HD-2162', 'SEC-2163'],
    'hd-m11': ['HD-2164'],
    // Module 4 (key its-02) Lab 4.1 builds a VM and works no ticket. An
    // empty list, not a missing one: no tickets are sent.
    'hd-m02-vm': [],
  };
  // Coaches whose work includes the student's VMs (ui/helpdesk.js VM screen).
  const HD_VM_COACHES = ['hd-m02-vm', 'hd-m02-server'];
  function hdCollectCoachWork(coach) {
    if (typeof hdState === 'undefined' || !Array.isArray(hdState.tickets)) return null;
    const ids = HD_COACH_TICKET_IDS[coach && coach.id];
    const vm = coach && HD_VM_COACHES.includes(coach.id) && typeof hdVmSummary === 'function' ? hdVmSummary() : null;
    const tickets = hdState.tickets.filter((ticket) => Boolean(ids) && ids.includes(ticket.id));
    // Module 2's guided queue: the student's work order lives on the shift.
    const queue = coach && coach.id === 'hd-m10' && Array.isArray(hdState.workOrder)
      ? { workOrder: hdState.workOrder.slice(0, 8), workOrderResult: String(hdState.workOrderResult || '').slice(0, 200) } : {};
    // HD-2101's investigation: outcomes, typed commands and key results.
    const investigation = ids && ids.includes('HD-2101') && typeof hdM01Investigation === 'function' ? hdM01Investigation() : null;
    return {
      version: 1,
      ...(investigation ? { investigation } : {}),
      ...(vm ? { vm } : {}),
      ...queue,
      selectedTicketId: hdState.selectedTicketId || '',
      tickets: tickets.map((ticket) => ({
        id: ticket.id,
        requester: ticket.requester || '',
        category: ticket.category || '',
        subcategory: ticket.subcategory || '',
        description: ticket.description || '',
        businessImpact: ticket.businessImpact || '',
        sla: ticket.sla || '',
        symptoms: Array.isArray(ticket.symptoms) ? ticket.symptoms.slice(0, 8) : [],
        systemState: Array.isArray(ticket.systemState) ? ticket.systemState.slice(0, 8) : [],
        logs: Array.isArray(ticket.logs) ? ticket.logs.slice(0, 8) : [],
        expectedDiagnosis: ticket.hiddenRootCause || '',
        expectedResolution: ticket.expectedResolution || '',
        expectedPath: Array.isArray(ticket.correctPath) ? ticket.correctPath.slice(0, 8) : [],
        expectedStatus: ticket.category === 'Security Incident' || (ticket.escalationCriteria || []).some((item) => item.startsWith('Always')) ? 'Escalated' : 'Resolved',
        priority: ticket.priority || '',
        assignedTechnician: ticket.assignedTechnician || '',
        status: ticket.status || '',
        diagnosis: ticket.diagnosis || '',
        diagnosisCorrect: ticket.diagnosis ? ticket.diagnosisCorrect === true : null,
        linkedProblem: ticket.linkedProblem || '',
        checkedSteps: Array.isArray(ticket.checkedSteps) ? ticket.checkedSteps.slice(0, 20) : [],
        notes: Array.isArray(ticket.notes) ? ticket.notes.slice(-20).map((note) => ({
          author: String(note.author || '').slice(0, 80),
          time: String(note.time || '').slice(0, 40),
          text: String(note.text || '').slice(0, 4000),
        })) : [],
        statusHistory: Array.isArray(ticket.troubleshootingHistory) ? ticket.troubleshootingHistory.slice(-40).map((entry) => ({
          time: String(entry.time || '').slice(0, 40),
          action: String(entry.action || '').slice(0, 300),
        })) : [],
        resolution: ticket.resolution || '',
        closureCode: ticket.closureCode || '',
        // Module 7: a ticket the student raised from another (console.raise).
        ...(ticket.raisedFrom ? { raisedFrom: String(ticket.raisedFrom), parentId: String(ticket.parentId || '') } : {}),
        ...hdCoachConsoleWork(ticket),
      })),
    };
  }
  // A console ticket's work (ui/helpdesk.js hdConsoleProgress) and the
  // student's customer comments, word for word. Nothing for other tickets.
  // Module 3: an update was posted at the follow-up time. "updated" reads the
  // latest follow-up only, so a student who updates at 11:30 and then sets
  // the next follow-up loses it; after "Go to follow-up time" the shift clock
  // stays there, so a comment at or after that clock time was posted after
  // the jump.
  function hdFollowUpKept(ticket, progress) {
    const follow = progress && progress.followUp;
    if (!follow) return false;
    if (follow.updated) return true;
    if (!follow.visited || typeof hdShiftNow !== 'function') return false;
    const due = hdShiftNow(ticket).getTime();
    const list = typeof hdComments === 'function' ? hdComments(ticket) : (ticket.customerComments || []);
    return (Array.isArray(list) ? list : []).some((c) => c && c.author === 'Riley Morgan' && Date.parse(c.at || '') >= due);
  }
  function hdCoachConsoleWork(ticket) {
    const progress = typeof hdConsoleProgress === 'function' ? hdConsoleProgress(ticket.id) : null;
    if (!progress) return {};
    if (progress.followUp) progress.followUp.kept = hdFollowUpKept(ticket, progress);
    const state = typeof hdConsoleState === 'function' ? hdConsoleState(ticket) : {};
    // Module 2: the student's rewrite and knowledge draft, word for word.
    const writing = state.rewrite || state.kbDraft ? { writing: {
      shortDescription: state.rewrite ? String(state.rewrite.short || '').slice(0, 160) : '',
      description: state.rewrite ? String(state.rewrite.description || '').slice(0, 4000) : '',
      kbDraftTitle: state.kbDraft ? String(state.kbDraft.title || '').slice(0, 160) : '',
      kbDraftText: state.kbDraft ? String(state.kbDraft.text || '').slice(0, 4000) : '',
    } } : {};
    return {
      ...(ticket.number ? { number: String(ticket.number).slice(0, 16) } : {}),
      ...writing,
      console: progress,
      customerComments: Array.isArray(ticket.customerComments) ? ticket.customerComments.slice(-20).map((comment) => ({
        author: String(comment.author || '').slice(0, 80),
        time: String(comment.time || '').slice(0, 40),
        text: String(comment.text || '').slice(0, 2000),
      })) : [],
    };
  }
  /* ---------------------------------------------------------- hd-m01 ---- */
  /* Module 1 Practice It, Guided Lab 1: INC0010150 (HD-2150), Sam Rivera's
   * lockout, worked with the console features alone (ui/helpdesk.js): the
   * method, KB-0024, a verified unlock, a customer comment and a note. No
   * commands. HD-2101 (the repeating lockout traced to a scheduled task)
   * left Module 1 on 2026-11-09; its scenario code stays for Module 8. */

  const HD1_TICKETS = ['HD-2150', 'SR-2102', 'SR-2103', 'SR-2116'];
  const HD1_ID = 'HD-2150';

  // A fresh lab: Module 1's tickets, with Sam's account locked again.
  function hd1Reset() {
    if (typeof hdState === 'undefined' || typeof window.hdFreshState !== 'function') return;
    const fresh = window.hdFreshState();
    hdState.tickets = fresh.tickets.filter((t) => HD1_TICKETS.includes(t.id));
    ['machines', 'scenarios', 'practiceLog', 'eventFilter', 'userOverrides', 'computerOverrides', 'selectedComputer', 'selectedUserId', 'powershell']
      .forEach((key) => { hdState[key] = fresh[key]; });
    hdState.queueFilter = 'Open';
    hdState.priorityFilter = 'All';
    hdState.selectedTicketId = null;
    // A fresh lab runs the current step order (hd1RemapOldStepOrder).
    hdState.coachOrder = 2;
    if (typeof hdSave === 'function') hdSave();
    // The page was drawn from the old tickets before the coach booted.
    if (typeof render === 'function') render();
  }

  // A walkthrough saved before HD-2150 replaced HD-2101 points at steps for a
  // ticket this shift no longer has, and would wait forever. Forget it, so the
  // next launch starts the new lab fresh (ui/coach.js reads these keys).
  (function hd1ForgetOldWalkthrough() {
    // Only the shift the coached lab uses counts: a practice set or a Prove It
    // has its own shift, without HD-2150, and must leave the walkthrough alone.
    if ((typeof HD_PRACTICE_SET !== 'undefined' && HD_PRACTICE_SET) || (typeof HD_PROVE !== 'undefined' && HD_PROVE)) return;
    if (typeof hdState === 'undefined' || !Array.isArray(hdState.tickets) || hdState.tickets.some((t) => t.id === HD1_ID)) return;
    const stale = (raw) => { try { const saved = JSON.parse(raw || 'null'); return Boolean(saved && saved.id === 'hd-m01'); } catch { return false; } };
    try { if (stale(localStorage.getItem('mnt.coach.resume'))) localStorage.removeItem('mnt.coach.resume'); } catch { /* storage blocked */ }
    try { if (stale(sessionStorage.getItem('mnt.coach.state'))) sessionStorage.removeItem('mnt.coach.state'); } catch { /* storage blocked */ }
  }());

  // Every step reads the ticket's real state (ui/helpdesk.js), not a
  // checkbox, and a step already done when it comes up completes itself.
  const hd1Ticket = () => (typeof hdTicketById === 'function' ? hdTicketById(HD1_ID) : null);
  const hd1Progress = () => (typeof hdConsoleProgress === 'function' ? hdConsoleProgress(HD1_ID) : null);
  const hd1Outcome = (key) => () => { const p = hd1Progress(); return Boolean(p && p.outcomes && p.outcomes[key]); };
  const hd1Asked = (...ids) => () => { const p = hd1Progress(); return Boolean(p) && ids.every((id) => p.chatAsked.includes(id)); };

  // The step order changed on 2026-11-15: Verify caller moved from step 4 to
  // step 2, before the chat questions (old 2) and the KB (old 3). A run saved
  // under the old order at step 3 or 4 hasn't verified yet, so it resumes at
  // step 2 (verify); steps 0, 1 and 5 to 9 mean the same in both orders, and
  // a run at old step 2 lands on verify anyway. Done once per shift: the
  // shift then carries coachOrder, as does every fresh lab (hd1Reset), so a
  // run saved under the new order is never moved back. Only the coached
  // lab's shift: a practice set or a Prove It has its own.
  const HD1_COACH_ORDER = 2;
  (function hd1RemapOldStepOrder() {
    if ((typeof HD_PRACTICE_SET !== 'undefined' && HD_PRACTICE_SET) || (typeof HD_PROVE !== 'undefined' && HD_PROVE)) return;
    if (typeof hdState === 'undefined' || !hdState || hdState.coachOrder === HD1_COACH_ORDER) return;
    const remap = (storage, key) => {
      try {
        const saved = JSON.parse(storage.getItem(key) || 'null');
        if (saved && saved.id === 'hd-m01' && (saved.step === 3 || saved.step === 4)) storage.setItem(key, JSON.stringify({ ...saved, step: 2 }));
      } catch { /* storage blocked or unreadable: the coach starts as it would */ }
    };
    try { remap(localStorage, 'mnt.coach.resume'); } catch { /* storage blocked */ }
    try { remap(sessionStorage, 'mnt.coach.state'); } catch { /* storage blocked */ }
    hdState.coachOrder = HD1_COACH_ORDER;
    if (typeof hdSave === 'function') hdSave();
  }());

  MODULE_COACHES.push({
    id: 'hd-m01',
    module: 1,
    name: 'Your First Help Desk Ticket',
    role: 'Tier 1 Help Desk Technician',
    summary: 'Work Sam Rivera’s account lockout end to end: take the ticket, verify Sam, find out what changed, follow KB-0024, unlock the account, confirm Sam can sign in, tell Sam what to do if it happens again, document it and resolve it.',
    completionToken: 'hd-m01',
    home: '#/helpdesk/tickets',
    resetState: hd1Reset,
    allow: ['#/helpdesk/dashboard', '#/helpdesk/tickets', '#/helpdesk/ticket', '#/helpdesk/knowledge-base', '#/helpdesk/directory'],
    steps: [
      {
        route: '#/helpdesk/tickets',
        target: 'tr[onclick*="HD-2150"]',
        title: 'Take the ticket',
        instruction: 'Open <strong>INC0010150</strong> and click <strong>Assign to me</strong>. The ticket moves to <strong>In Progress</strong> and <strong>Assigned technician</strong> shows Riley Morgan.',
        body: 'Why: an unowned ticket stalls. Nobody is working it while its SLA clock runs. Success looks like: your name shows in Assigned technician, and the SLA badge is green.',
        waitLabel: 'Next Step: Ticket assigned to you',
        check: () => { const t = hd1Ticket(); return Boolean(t) && t.assignedTechnician === 'Riley Morgan' && t.status !== 'New'; },
      },
      {
        route: '#/helpdesk/ticket',
        target: '.hd-field-grid',
        title: 'Read the ticket',
        instruction: 'Read what Sam reported and jot down Sam’s own words (on paper or in a text file; it isn’t graded). Then read the pre-set <strong>Priority: P3</strong> and its reason.',
        body: 'Why: identify the problem before you form a theory. Success looks like: you can say “Locked out after wrong password tries; on the phones at 9.” Priority is pre-set in Module 1; you’ll set it yourself from impact and urgency in Module 2.',
        continueLabel: 'I’ve read it',
      },
      {
        route: '#/helpdesk/ticket',
        target: '.hd-verify',
        title: 'Verify the caller',
        instruction: 'In the <strong>Verify caller</strong> card, right under Sam’s statement, choose <strong>Call Sam back on the number in the User Directory and confirm their employee ID</strong>. The result stays at the top of the ticket.',
        body: 'Why: KB-0024 says verify before you act. Unlocking an account for the wrong person hands them the account. Success looks like: the badge turns green and the card shows you called Sam back on ext. 4391 and confirmed employee ID E-42856. Accepting a name and department, or asking for a password, is a critical error and is recorded for your instructor.',
        waitLabel: 'Next Step: Caller verified',
        check: hd1Outcome('verified'),
      },
      {
        route: '#/helpdesk/ticket',
        target: '.hd-chat',
        title: 'Find out what changed',
        instruction: 'In the chat, ask Sam two identify questions: <strong>when did it start</strong>, and <strong>did anything change</strong>?',
        body: 'Why: step 1 of the method is to find out what changed. Success looks like: Sam says “I typed it wrong a few times after the long weekend. I didn’t change it.” Wrong tries after a long weekend point to a simple lockout; a new password or a new device would point somewhere else.',
        waitLabel: 'Next Step: Both questions asked',
        check: hd1Asked('when', 'changed'),
      },
      {
        route: '#/helpdesk/ticket',
        target: '.hd-kb-search',
        title: 'Check the knowledge base',
        instruction: 'In the Knowledge Base search box on the ticket, type <strong>locked out</strong>. Open <strong>KB-0024</strong> and read every step.',
        body: 'Why: your theory and your fix come from approved knowledge first. Success looks like: KB-0024 is open, and you’ve read how Tier 1 unlocks an account and when a ticket goes to someone else.',
        waitLabel: 'Next Step: KB-0024 opened',
        check: () => { const p = hd1Progress(); return Boolean(p) && p.kbOpened.includes('KB-0024'); },
      },
      {
        route: '#/helpdesk/ticket',
        target: '.hd-account',
        title: 'Unlock the account',
        instruction: 'Follow KB-0024’s unlock step: click <strong>Unlock account</strong> on Sam’s account card.',
        body: 'Why: Tier 1 may unlock a verified user’s account. Success looks like: the account card shows Unlocked. This button is the simulator’s version of the Active Directory tool you’ll use in Module 8.',
        waitLabel: 'Next Step: Account unlocked',
        check: hd1Outcome('unlocked'),
      },
      {
        route: '#/helpdesk/ticket',
        target: '.hd-chat',
        title: 'Confirm from Sam’s side',
        instruction: 'In the chat, ask Sam to sign in again slowly with Caps Lock off. Never ask for or look at the password.',
        body: 'Why: verify the fix from the user’s side; you never handle passwords. Success looks like: Sam says “I’m in, thank you!”',
        waitLabel: 'Next Step: Sam is signed in',
        check: hd1Outcome('confirmed'),
      },
      {
        route: '#/helpdesk/ticket',
        target: '.hd-comments',
        title: 'Plan for a repeat',
        instruction: 'KB-0024 says a lockout that comes back within a day goes to the next-level team to find its source. Add a customer comment for Sam that says what to do <strong>if it happens again</strong>.',
        body: 'Why: plan for a repeat and know when to escalate. Success looks like: the checker finds your “if it happens again” line. Sam reads this comment, so use plain words: “our next-level team”, not “Tier 2”, and no internal terms.',
        waitLabel: 'Next Step: Comment says what to do if it happens again',
        check: hd1Outcome('comment'),
      },
      {
        route: '#/helpdesk/ticket',
        target: '#hd-note-input, #hd-resolution-code',
        title: 'Document and resolve',
        instruction: 'Add a work note in three parts: <strong>Reported</strong>: what Sam reported, <strong>Tried</strong>: what you checked and did, <strong>Result</strong>: the outcome and how you confirmed it. Set <strong>Resolution code</strong> to <strong>Solution provided</strong>, then click <strong>Resolve</strong>, the ticket’s only close control.',
        body: 'Why: document so the next technician never starts from zero. Success looks like: “Your note needs” ticks Reported, Tried and Result, your comment has no internal words, and the ticket shows Resolved. If anything is still missing, Resolve tells you what.',
        waitLabel: 'Next Step: Ticket resolved',
        check: () => { const t = hd1Ticket(); return Boolean(t) && t.status === 'Resolved'; },
      },
      {
        // Reached only after the ticket is resolved, so Finish never shows
        // before then (ui/coach.js shows Finish on the last step).
        title: 'Finish the lab',
        instruction: 'Ticket resolved. Press <strong>Finish</strong> to send your work to your course page.',
        body: 'Your work counts once your course page confirms it saved it: how you verified Sam, the unlock, your comment and your note.',
        finish: { label: 'Finish', href: itsPortalUrl('#/program/it-support/module/1', 'hd-m01') },
      },
    ],
  });

  /* ---------------------------------------------------------- hd-m02 ---- */
  /* Module 4 (key its-02). Three coached labs, feedback only, no points:
   *   hd-m02-vm      Lab 4.1, build a Windows 11 client VM (the VM screen).
   *   hd-m02-server  Lab 4.2, snapshot, a server VM, ping both ways, then the
   *                  virtual desktop ticket HD-2173 (coached set its-02-server).
   *   hd-m02         Lab 4.3, printers and peripherals on HD-2134 (coached
   *                  set its-02-guided). Its old two-ticket steps (HD-2106 and
   *                  HD-2112) were replaced on 2026-11-23; both tickets stay in
   *                  the data for Module 12 and older attempts.
   * Every check reads saved state (the VMs, the ticket, the computer), never
   * a tick box, so a step done early passes when it comes up. The coach shows
   * each command in full: Module 4 is the first time a student types one. */
  const hd2Vm = (name) => (typeof hdVmByName === 'function' ? hdVmByName(name) : null);
  const hd2VmState = () => (typeof hdVmState === 'function' ? hdVmState() : null);
  // The VM being made (the New form) or already made, by name.
  const hd2Draft = (name) => {
    const made = hd2Vm(name); if (made) return made;
    const state = hd2VmState(); const form = state && state.form;
    return form && form.name.toLowerCase() === name.toLowerCase() ? form : null;
  };
  // Pings from one VM, oldest first: [{ to, ok, mode }].
  const hd2Pings = (name) => { const vm = hd2Vm(name); return vm ? vm.pings : []; };
  const hd2Ticket = (id) => (typeof hdTicketById === 'function' ? hdTicketById(id) : null);
  const hd2Rule = (id, rule) => { const t = hd2Ticket(id); return Boolean(t) && typeof hdConsoleRule === 'function' && hdConsoleRule(t, rule) === true; };
  const hd2Actions = (id) => { const t = hd2Ticket(id); return t && typeof hdConsoleState === 'function' ? hdConsoleState(t).actions : []; };
  const hd2Did = (id, action, test) => hd2Actions(id).some((a) => a.id === action && (!test || test(a)));
  const hd2Triaged = (id, category, subcategory, ci, priority) => {
    const t = hd2Ticket(id);
    const c = t && typeof hdClassification === 'function' ? hdClassification(t) : null;
    return Boolean(t && c) && c.category === category && c.subcategory === subcategory && c.ci === ci && t.priority === priority;
  };
  // A command typed in the ticket's PowerShell on that computer.
  const hd2Typed = (computer, pattern) => (typeof hdState !== 'undefined' && Array.isArray(hdState.practiceLog) ? hdState.practiceLog : [])
    .some((e) => e && e.type === 'command_run' && e.computer === computer && pattern.test(String(e.command || '').trim()));
  const hd2Machine = (name) => (typeof hdMachine === 'function' ? hdMachine(name) : null);
  const hd2Queue = () => { const m = hd2Machine('NS-LT-0094'); return m && m.printQueues ? m.printQueues['NS-HR-MFP01'] : null; };
  const hd2InSet = (key) => typeof hdState !== 'undefined' && hdState && hdState.ticketSet === key;
  const HD2_VM_ROUTES = ['#/helpdesk/dashboard', '#/helpdesk/vm-manager', '#/helpdesk/task-manager'];

  // A saved run of a coach whose steps no longer fit the shift it would
  // resume on starts fresh (ui/coach.js reads these keys): the old two-ticket
  // hd-m02, or a VM-lab ticket step on a shift without its set.
  function hd2ForgetStale(id, setKey) {
    if ((typeof HD_PRACTICE_SET !== 'undefined' && HD_PRACTICE_SET) || (typeof HD_PROVE !== 'undefined' && HD_PROVE)) return;
    if (typeof hdState === 'undefined' || !hdState || hdState.ticketSet === setKey) return;
    const stale = (raw) => { try { const saved = JSON.parse(raw || 'null'); return Boolean(saved && saved.id === id); } catch { return false; } };
    try { if (stale(localStorage.getItem('mnt.coach.resume'))) localStorage.removeItem('mnt.coach.resume'); } catch { /* storage blocked */ }
    try { if (stale(sessionStorage.getItem('mnt.coach.state'))) sessionStorage.removeItem('mnt.coach.state'); } catch { /* storage blocked */ }
  }
  hd2ForgetStale('hd-m02', 'its-02-guided');
  hd2ForgetStale('hd-m02-server', 'its-02-server');

  /* ------------------------------------------------------- Lab 4.1 ------ */
  MODULE_COACHES.push({
    id: 'hd-m02-vm', module: 4, name: 'Guided Lab: build a Windows client VM', role: 'Tier 1 Help Desk Technician',
    summary: 'Build a Windows 11 client VM on a simulated host: check the host’s CPU, then choose the name, install image, memory, CPU cores, disk and network mode, and start it. Nothing is installed on your computer. The lab checks your settings; there is no score.',
    completionToken: 'hd-m02-vm', home: '#/helpdesk/vm-manager',
    // Your VMs are kept: Lab 4.2 uses this one. A redo shows what you built.
    resetState: () => {},
    allow: HD2_VM_ROUTES,
    steps: [
      {
        route: '#/helpdesk/task-manager', target: '[data-hd-task-tab="performance"], [data-hd-task-tab="cpu"], [data-hd-task-cpu]',
        title: 'Check the host’s CPU',
        instruction: 'On the host, open <strong>Task Manager › Performance › CPU</strong>.',
        body: 'Why: the host’s CPU must have virtualization (Intel VT-x or AMD-V) switched on in firmware, or no VM will start. Success looks like: you’ve found 16 GB RAM, 8 cores and “Virtualization: Enabled”.',
        waitLabel: 'Next Step: CPU checked',
        check: () => { const s = hd2VmState(); return Boolean(s && s.cpuSeen); },
      },
      {
        route: '#/helpdesk/vm-manager', target: '[data-hd-vm-new]',
        title: 'Open the hypervisor',
        instruction: 'Open the <strong>VM Manager</strong> and click <strong>New</strong>.',
        body: 'Why: a Type 2 hypervisor runs on a normal OS, like VirtualBox. Type 1 runs straight on server hardware (ESXi, Hyper-V). Success looks like: the new-VM form is open.',
        waitLabel: 'Next Step: New VM form open',
        check: () => { const s = hd2VmState(); return Boolean(s && (s.form || hd2Vm('NS-TEST-W11'))); },
      },
      {
        route: '#/helpdesk/vm-manager', target: '#hd-vm-name, #hd-vm-image',
        title: 'Name it and pick the image',
        instruction: 'Type the name <code>NS-TEST-W11</code> and pick the <strong>Windows 11</strong> install image (ISO).',
        body: 'Why: an ISO is a disc image of the installer. The VM is the guest; your PC is the host. Success looks like: the name and install image are set. If the screen says a setting is off, it names it.',
        waitLabel: 'Next Step: Name and image set',
        check: () => { const d = hd2Draft('NS-TEST-W11'); return Boolean(d) && d.image === 'win11'; },
      },
      {
        route: '#/helpdesk/vm-manager', target: '#hd-vm-memory, #hd-vm-cores, [data-hd-vm-ram]',
        title: 'Memory and CPU cores',
        instruction: 'Set memory to <strong>1 GB</strong> and read the warning. Then set <strong>4 GB</strong> and <strong>2 CPU cores</strong>.',
        body: 'Why: too little and the VM crawls; too much and the host starves. Every VM’s share comes out of the host. Success looks like: 4 GB and 2 cores, and the host’s bar shows 12 GB left.',
        waitLabel: 'Next Step: 4 GB and 2 cores',
        check: () => {
          const s = hd2VmState(); const made = hd2Vm('NS-TEST-W11'); const form = s && s.form;
          if (made) return made.memoryGb === 4 && made.cores === 2;
          return Boolean(form && form.name.toLowerCase() === 'ns-test-w11' && form.lowRamSeen && form.memoryGb === 4 && form.cores === 2);
        },
      },
      {
        route: '#/helpdesk/vm-manager', target: '#hd-vm-disk, [name="hd-vm-disk-type"]',
        title: 'The virtual disk',
        instruction: 'Choose a <strong>64 GB</strong> disk, then <strong>Dynamically allocated</strong>.',
        body: 'Why: dynamic saves space; fixed is a little faster. Both live as files on the host’s drive. Success looks like: 64 GB, dynamically allocated.',
        waitLabel: 'Next Step: 64 GB, dynamic',
        check: () => { const d = hd2Draft('NS-TEST-W11'); return Boolean(d) && d.diskGb === 64 && d.diskType === 'dynamic'; },
      },
      {
        route: '#/helpdesk/vm-manager', target: '[data-hd-vm-mode], [data-hd-vm-choose], [data-hd-vm-create]',
        title: 'Network mode',
        instruction: 'Click each network mode to see its diagram: <strong>NAT</strong>, <strong>Bridged</strong>, <strong>Internal</strong> and <strong>Host-only</strong>. Then choose <strong>NAT</strong> and click <strong>Create</strong>.',
        body: 'Why: NAT: the VM reaches the internet through the host. Bridged: it looks like another PC on the network. Internal: VMs talk only to each other. Host-only: VMs and the host only. Success looks like: NAT selected, and NS-TEST-W11 is in the list.',
        waitLabel: 'Next Step: NAT chosen, VM created',
        check: () => { const s = hd2VmState(); const made = hd2Vm('NS-TEST-W11'); return Boolean(s && made) && s.modesViewed.length === 4 && made.network === 'NAT'; },
      },
      {
        route: '#/helpdesk/vm-manager', target: '[data-hd-vm-start], [data-hd-vm-screen]',
        title: 'Start it',
        instruction: 'Click <strong>Start</strong> on NS-TEST-W11.',
        body: 'Why: a guest OS needs its own license, updates and antivirus, just like a real PC. Success looks like: the install fast-forwards to a Windows 11 desktop and the VM shows Running. The lab checks 4 GB, 2 cores, a 64 GB dynamic disk, NAT and Windows 11 installed; if one is off, the screen names it.',
        waitLabel: 'Next Step: Windows 11 installed and running',
        check: () => {
          const vm = hd2Vm('NS-TEST-W11');
          return Boolean(vm) && vm.image === 'win11' && vm.memoryGb === 4 && vm.cores === 2 && vm.diskGb === 64 && vm.diskType === 'dynamic' && vm.network === 'NAT' && vm.installed && vm.state === 'Running';
        },
      },
      {
        route: '#/helpdesk/vm-manager', target: '[data-hd-vm-finish]',
        title: 'Finish the lab',
        instruction: 'VM built. Read the four cards on where Tier 1 meets VMs at work, then press <strong>Finish</strong> to send your work to your course page.',
        body: 'Your VM settings count once your course page confirms it saved them. There is no score. Keep NS-TEST-W11: Lab 4.2 uses it.',
        finish: { label: 'Finish', href: itsPortalUrl('#/program/it-support/module/4', 'hd-m02-vm') },
      },
    ],
  });

  /* ------------------------------------------------------- Lab 4.2 ------ */
  const HD2_SERVER_TICKET = 'HD-2173';
  MODULE_COACHES.push({
    id: 'hd-m02-server', module: 4, name: 'Guided Lab: snapshot, server and a virtual desktop', role: 'Tier 1 Help Desk Technician',
    summary: 'Take a snapshot of NS-TEST-W11 and undo a change with it, build a server VM, put both VMs on an Internal network and ping both ways, then help a user whose virtual desktop is stuck. Checked, not graded.',
    completionToken: 'hd-m02-server', home: '#/helpdesk/vm-manager',
    // The ticket set is fresh; the VMs from Lab 4.1 are kept.
    resetState: () => { if (typeof hdUseTicketSet === 'function') hdUseTicketSet('its-02-server'); },
    allow: [...HD2_VM_ROUTES, '#/helpdesk/tickets', '#/helpdesk/ticket', '#/helpdesk/virtual-desktops', '#/helpdesk/knowledge-base'],
    steps: [
      {
        route: '#/helpdesk/vm-manager', target: '#hd-vm-snapshot-name, [data-hd-vm-snapshot]',
        title: 'Take a snapshot',
        instruction: 'Select <strong>NS-TEST-W11</strong>. Click <strong>Take snapshot</strong> and name it <code>Before-change</code>. (No NS-TEST-W11 in the list? Build it as in Lab 4.1 first.)',
        body: 'Why: a snapshot is a checkpoint before a risky change, not a backup: it lives on the same disk. Success looks like: the snapshot is listed.',
        waitLabel: 'Next Step: Snapshot taken',
        check: () => { const vm = hd2Vm('NS-TEST-W11'); return Boolean(vm && vm.installed) && vm.snapshots.some((s) => s.name.toLowerCase() === 'before-change'); },
      },
      {
        route: '#/helpdesk/vm-manager', target: '[data-hd-vm-shortcut], [data-hd-vm-snapshot]',
        title: 'Break it, then restore',
        instruction: 'In the VM, <strong>Delete</strong> the shortcut on the desktop. Then click <strong>Restore</strong> on <code>Before-change</code>.',
        body: 'Why: a bad change is undone in seconds. Success looks like: the shortcut is back.',
        waitLabel: 'Next Step: Shortcut back',
        check: () => { const vm = hd2Vm('NS-TEST-W11'); return Boolean(vm) && vm.shortcutDeleted && vm.restored > 0 && vm.shortcut; },
      },
      {
        route: '#/helpdesk/vm-manager', target: '[data-hd-vm-new], [data-hd-vm-form], [data-hd-vm-start]',
        title: 'Build a server VM',
        instruction: 'Click <strong>New</strong>, type the name <code>NS-TEST-SRV</code>, pick the <strong>Windows Server</strong> image, set <strong>4 GB</strong>, <strong>2 cores</strong> and a <strong>64 GB</strong> disk, choose a network mode, click <strong>Create</strong>, then <strong>Start</strong>.',
        body: 'Why: every guest takes its share from the same host: two 4 GB guests leave this 16 GB host 8 GB. A server runs roles for many users. Success looks like: Server Manager opens in NS-TEST-SRV, and the host’s bar shows 8 GB left.',
        waitLabel: 'Next Step: Server installed',
        check: () => { const vm = hd2Vm('NS-TEST-SRV'); return Boolean(vm) && vm.image === 'winsrv' && vm.memoryGb === 4 && vm.cores === 2 && vm.diskGb === 64 && vm.installed; },
      },
      {
        route: '#/helpdesk/vm-manager', target: '[data-hd-vm-detail] select',
        title: 'Put both on Internal',
        instruction: 'Set the network mode of <strong>both</strong> VMs to <strong>Internal</strong>.',
        body: 'Why: Internal: the guests talk only to each other. A safe place to test. Success looks like: both VMs on Internal.',
        waitLabel: 'Next Step: Both on Internal',
        check: () => {
          const a = hd2Vm('NS-TEST-W11'); const b = hd2Vm('NS-TEST-SRV');
          const pinged = hd2Pings('NS-TEST-W11').some((p) => p.ok && p.to === '10.0.5.10');
          return Boolean(a && b) && ((a.network === 'Internal' && b.network === 'Internal') || pinged);
        },
      },
      {
        route: '#/helpdesk/vm-manager', target: '[data-hd-vm-console], #hd-vm-console-input',
        title: 'Ping both ways',
        instruction: 'In <strong>NS-TEST-W11</strong>’s console type <code>ping 10.0.5.10</code>. Then select <strong>NS-TEST-SRV</strong> and in its console type <code>ping 10.0.5.20</code>. Both VMs must be running.',
        body: 'Why: a reply means one machine can reach the other. You’ll use ping on real networks in Module 9. Success looks like: four replies each way.',
        waitLabel: 'Next Step: Replies both ways',
        check: () => hd2Pings('NS-TEST-W11').some((p) => p.ok && p.to === '10.0.5.10') && hd2Pings('NS-TEST-SRV').some((p) => p.ok && p.to === '10.0.5.20'),
      },
      {
        route: '#/helpdesk/vm-manager', target: '[data-hd-vm-detail] select, #hd-vm-console-input',
        title: 'Change the mode, ping again',
        instruction: 'Switch <strong>NS-TEST-W11</strong> to <strong>NAT</strong> and type <code>ping 10.0.5.10</code> again. Then switch it back to <strong>Internal</strong> and ping once more.',
        body: 'Why: the network mode decides who a guest can talk to. When two VMs can’t reach each other, check the mode first. Success looks like: “Request timed out”, then replies again.',
        waitLabel: 'Next Step: Timed out, then replies',
        check: () => {
          const pings = hd2Pings('NS-TEST-W11').filter((p) => p.to === '10.0.5.10');
          const nat = pings.findIndex((p) => !p.ok && p.mode === 'NAT');
          const vm = hd2Vm('NS-TEST-W11');
          return nat >= 0 && pings.slice(nat + 1).some((p) => p.ok && p.mode === 'Internal') && Boolean(vm) && vm.network === 'Internal';
        },
      },
      {
        route: '#/helpdesk/ticket', target: 'select[data-hd-field="category"], select[data-hd-field="impact"], select[data-hd-field="urgency"]',
        title: 'A user’s virtual desktop',
        instruction: 'Open the ticket in your queue (Leah Brooks, Marketing). Set <strong>Category</strong> Software › Virtual desktop (VDI), <strong>Configuration item</strong> VDI-POOL-MKTG, <strong>Impact</strong> 3 and <strong>Urgency</strong> 2.',
        body: 'Why: a virtual desktop is a VM on a server, so closing the window on her laptop doesn’t restart it. Success looks like: Priority calculates as P4.',
        waitLabel: 'Next Step: Triaged at P4',
        check: () => hd2Triaged(HD2_SERVER_TICKET, 'Software', 'Virtual desktop (VDI)', 'VDI-POOL-MKTG', 'P4'),
      },
      {
        route: '#/helpdesk/ticket', target: '[data-hd-vdi-open], [data-hd-vdi]',
        title: 'Check the whole pool',
        instruction: 'Open the <strong>Virtual Desktops</strong> screen from the ticket and look at every session in VDI-POOL-MKTG.',
        body: 'Why: scope first. One user, or the whole pool? Success looks like: the other sessions are Active; Leah’s is “Disconnected – hung, 9 h”.',
        waitLabel: 'Next Step: Pool checked',
        check: () => hd2Did(HD2_SERVER_TICKET, 'vdi-viewed'),
      },
      {
        route: '#/helpdesk/ticket', target: '.hd-kb-search, #hd-kb-input',
        title: 'Read the KB first',
        instruction: 'Search the knowledge base for <code>virtual desktop black screen</code> and open <strong>KB-0072</strong>.',
        body: 'Why: the KB says what Tier 1 may do and what it may not. Success looks like: KB-0072 is open; it names Log off session and says the pool and host restarts are Tier 2.',
        waitLabel: 'Next Step: KB-0072 open',
        check: () => hd2Rule(HD2_SERVER_TICKET, { kb: 'KB-0072' }),
      },
      {
        route: '#/helpdesk/ticket', target: '.hd-chat, .hd-caller',
        title: 'Ask before you act',
        instruction: 'Tell Leah that unsaved work in the stuck session may be lost, and ask if you can go ahead.',
        body: 'Why: her work, her call. Success looks like: Leah says “Go ahead, I saved before lunch.”',
        waitLabel: 'Next Step: Leah agreed',
        check: () => hd2Rule(HD2_SERVER_TICKET, { chat: ['consent'] }),
      },
      {
        route: '#/helpdesk/virtual-desktops', target: '[data-hd-session-state="hung"], [data-hd-session]',
        title: 'Log off her session only',
        instruction: 'Click <strong>Log off session</strong> on Leah’s session only. Then go back to the ticket and ask her to reconnect.',
        body: 'Why: the smallest action that fixes it. Restart pool is a Tier 2 action that drops everyone. Success looks like: her new session is Active, and Leah confirms her desktop loads.',
        waitLabel: 'Next Step: Leah’s desktop loads',
        check: () => hd2Did(HD2_SERVER_TICKET, 'vdi-logoff', (a) => a.user === 'leah.brooks') && hd2Rule(HD2_SERVER_TICKET, { confirmed: 'reconnect' }),
      },
      {
        route: '#/helpdesk/ticket', target: '#hd-note-input, .hd-comments, #hd-resolution-code',
        title: 'Resolve it',
        instruction: 'Write a <strong>work note</strong> that starts its lines with Reported:, Tried: and Result:, including Leah’s consent and its time. Post a <strong>comment</strong> to Leah in plain words. Set the resolution code and resolve the ticket.',
        body: 'Why: same standard every time. Success looks like: the checker confirms the three parts, the comment has no flagged terms, and the ticket is Resolved.',
        waitLabel: 'Next Step: Resolved with a note and comment',
        check: () => hd2Rule(HD2_SERVER_TICKET, { note: true }) && hd2Rule(HD2_SERVER_TICKET, { comment: true }) && hd2Rule(HD2_SERVER_TICKET, { status: 'Resolved' }),
      },
      {
        title: 'Finish the lab',
        instruction: 'Lab done. Press <strong>Finish</strong> to send your work to your course page.',
        body: 'Your VMs, pings and ticket work count once your course page confirms it saved them. There is no score.',
        finish: { label: 'Finish', href: itsPortalUrl('#/program/it-support/module/4', 'hd-m02-server') },
      },
    ],
  });

  /* ------------------------------------------------------- Lab 4.3 ------ */
  const HD2_ID = 'HD-2134';
  MODULE_COACHES.push({
    id: 'hd-m02', module: 4, name: 'Guided Lab: printers and peripherals', role: 'Tier 1 Help Desk Technician',
    summary: 'Priya Shah in HR can’t print. Check her print queue, clear a stuck job in the right order, put the printer back online and test it. Then add a new label printer by its address, fix a webcam with a driver rollback and set up two monitors on a dock. Feedback only, no score.',
    completionToken: 'hd-m02', home: '#/helpdesk/tickets',
    resetState: () => {
      if (typeof hdUseTicketSet === 'function') hdUseTicketSet('its-02-guided');
      if (typeof hdState !== 'undefined' && hdState) hdState.selectedTicketId = null;
    },
    allow: ['#/helpdesk/dashboard', '#/helpdesk/tickets', '#/helpdesk/ticket', '#/helpdesk/windows', '#/helpdesk/powershell', '#/helpdesk/print-queue', '#/helpdesk/printer-properties',
      '#/helpdesk/settings-printers', '#/helpdesk/device-manager', '#/helpdesk/camera', '#/helpdesk/dock', '#/helpdesk/settings-network', '#/helpdesk/knowledge-base', '#/helpdesk/event-viewer'],
    steps: [
      {
        route: '#/helpdesk/ticket', target: 'select[data-hd-field="category"], select[data-hd-field="impact"], [data-hd-machines]',
        title: 'Open the ticket and look first',
        instruction: 'Open Priya Shah’s ticket. Set <strong>Category</strong> Hardware › Printer, <strong>Configuration item</strong> NS-HR-MFP01, <strong>Impact</strong> 3 and <strong>Urgency</strong> 2. Then open <strong>NS-LT-0094</strong> from the ticket, open <strong>PowerShell</strong> and type <code>Get-Service Spooler</code>, then <code>Get-PrintJob -PrinterName NS-HR-MFP01</code>.',
        body: 'Why: step 1 of the printer order is to see the queue before you change anything. Success looks like: the priority is P4, the spooler is Running, and four jobs are listed, the first in Error.',
        waitLabel: 'Next Step: Triaged, spooler and queue read',
        check: () => hd2Triaged(HD2_ID, 'Hardware', 'Printer', 'NS-HR-MFP01', 'P4')
          && hd2Typed('NS-LT-0094', /^get-service\s+(-name\s+)?["']?spooler["']?$/i)
          && hd2Typed('NS-LT-0094', /^get-printjob\s+(-printername\s+)?["']?ns-hr-mfp01["']?$/i),
      },
      {
        route: '#/helpdesk/ticket', target: '.hd-chat, .hd-caller',
        title: 'Check the scope, and ask',
        instruction: 'Open the <strong>PrintService log</strong> card on the ticket. Then ask Priya whether anyone else in HR can print, and whether you may cancel her 612-page job.',
        body: 'Why: the log names the job that failed. One user and her own job means Tier 1 can fix it here; a whole team would be the print server’s problem. Success looks like: the log shows job 18 failed to render, and Priya says “Everyone else is printing fine.” and “Yes, cancel it.”',
        waitLabel: 'Next Step: Log read, scope and consent',
        check: () => hd2Rule(HD2_ID, { evidence: 'printservice' }) && hd2Rule(HD2_ID, { chat: ['others', 'cancel'] }),
      },
      {
        route: '#/helpdesk/print-queue', target: '[data-hd-queue]',
        title: 'Clear the stuck job',
        instruction: 'In the <strong>print queue window</strong> for NS-HR-MFP01, cancel the first job (Benefits_Guide.pdf). It stays “Deleting”. In PowerShell type <code>Stop-Service Spooler</code>, click <strong>Clear stuck job</strong>, then type <code>Start-Service Spooler</code>.',
        body: 'Why: a job the spooler can’t cancel is cleared with the spooler stopped. Success looks like: <code>Get-Service Spooler</code> shows Running and the stuck job is gone. Her other three documents wait behind the offline flag until the next step.',
        waitLabel: 'Next Step: Stuck job cleared, spooler running',
        check: () => {
          const acts = hd2Actions(HD2_ID).map((a) => a.id);
          const cleared = acts.indexOf('job-clear-stuck');
          const queue = hd2Queue(); const machine = hd2Machine('NS-LT-0094');
          return hd2Did(HD2_ID, 'job-cancel', (a) => a.stuck === true) && cleared >= 0 && acts.lastIndexOf('spooler-start') > cleared
            && Boolean(queue && machine) && machine.spooler === 'Running' && !queue.jobs.some((job) => job.stuck);
        },
      },
      {
        route: '#/helpdesk/print-queue', target: '[role="menu"]',
        title: 'Put the printer back online',
        instruction: 'In the queue’s <strong>Printer</strong> menu, untick <strong>Use Printer Offline</strong>. Notice <strong>Pause Printing</strong> beside it.',
        body: 'Why: step 3 of the order, and the flag you’ll meet weekly. Success looks like: status Ready.',
        waitLabel: 'Next Step: Printer online',
        check: () => { const queue = hd2Queue(); return Boolean(queue) && queue.offline === false && queue.paused === false; },
      },
      {
        route: '#/helpdesk/powershell', target: '#hd-ps-input',
        title: 'Can the PC reach the printer?',
        instruction: 'In PowerShell type <code>Test-NetConnection 10.20.70.20 -Port 9100</code>.',
        body: 'Why: this checks whether this PC can reach the printer on its print port. Success looks like: <code>TcpTestSucceeded : True</code>.',
        waitLabel: 'Next Step: Print port answers',
        check: () => hd2Typed('NS-LT-0094', /^test-netconnection\s+(-computername\s+)?10\.20\.70\.20\s+-port\s+9100$/i),
      },
      {
        route: '#/helpdesk/print-queue', target: '[role="menu"], .hd-chat, .hd-caller',
        title: 'Test, then confirm with Priya',
        instruction: 'Click <strong>Print test page</strong>. Then ask Priya to check that her other three documents came out.',
        body: 'Why: verify with a test page, then with the user. Her three documents printed once the printer was back online. Success looks like: the test page prints, and Priya confirms all three came out.',
        waitLabel: 'Next Step: Test page and Priya confirms',
        check: () => hd2Did(HD2_ID, 'test-page') && hd2Rule(HD2_ID, { confirmed: 'resend' }),
      },
      {
        route: '#/helpdesk/settings-printers', target: '[data-hd-addip], [data-hd-props]',
        title: 'Add a printer by its address',
        instruction: 'HR has a new label printer. In <strong>Settings › Printers &amp; scanners</strong>, add it by address: Standard TCP/IP, <code>10.20.70.51</code>, name <code>NS-HR-LABEL01</code>. Open its <strong>Printer properties › Ports</strong>, then type <code>Get-Printer -Name NS-HR-LABEL01 | Format-List Name, PortName, DriverName</code>.',
        body: 'Why: a direct install has no print server; the port is how the PC finds the printer. Success looks like: the Ports tab shows a Standard TCP/IP port for 10.20.70.51, and the command shows the same port name.',
        waitLabel: 'Next Step: Label printer added and checked',
        check: () => hd2Rule(HD2_ID, { printerInstalled: { computer: 'NS-LT-0094', printer: 'NS-HR-LABEL01' } })
          && hd2Typed('NS-LT-0094', /^get-printer\s+(-name\s+)?["']?ns-hr-label01["']?\s*\|\s*(format-list|fl)\b/i),
      },
      {
        route: '#/helpdesk/device-manager', target: '[data-hd-device], [data-hd-devmgr]',
        title: 'Find the faulty device',
        instruction: 'Open the test laptop <strong>NS-LT-0244</strong> from the ticket, then <strong>Device Manager</strong>. Find the device with a yellow triangle and open its <strong>Properties</strong>.',
        body: 'Why: the status code says whether it’s the driver or the device. Success looks like: Integrated Camera: “Windows has stopped this device because it has reported problems. (Code 43)”.',
        waitLabel: 'Next Step: Camera properties open',
        check: () => {
          const view = typeof hdState !== 'undefined' && hdState.machineView ? hdState.machineView : {};
          return (view.computer === 'NS-LT-0244' && view.device === 'camera') || hd2Did(HD2_ID, 'driver-rollback');
        },
      },
      {
        route: '#/helpdesk/device-manager', target: '[data-hd-device]',
        title: 'Roll back the driver',
        instruction: 'On the <strong>Driver</strong> tab, read the driver date, then click <strong>Roll Back Driver</strong>. Then open the <strong>Camera</strong> app.',
        body: 'Why: this is the fix when a recent update broke a device. Success looks like: the driver date is yesterday before the rollback; afterwards “This device is working properly”, and the Camera app shows video.',
        waitLabel: 'Next Step: Camera works',
        check: () => hd2Did(HD2_ID, 'driver-rollback') && hd2Did(HD2_ID, 'camera-checked', (a) => a.working === true),
      },
      {
        route: '#/helpdesk/dock', target: '[data-hd-dock], [data-hd-projection], [data-hd-displays]',
        title: 'Dock it and set up the monitors',
        instruction: 'Connect the laptop to the dock. Press <strong>Win + P › Extend</strong>, then in <strong>Settings › Display</strong> click <strong>Detect</strong>.',
        body: 'Why: this is the routine for a dock and monitors. Success looks like: both monitors are shown in Display settings.',
        waitLabel: 'Next Step: Both monitors shown',
        check: () => {
          const m = hd2Machine('NS-LT-0244');
          return Boolean(m && m.dock && m.dock.docked) && m.projection === 'Extend' && hd2Did(HD2_ID, 'display-detect');
        },
      },
      {
        route: '#/helpdesk/ticket', target: '#hd-note-input, .hd-comments, #hd-resolution-code',
        title: 'Resolve it',
        instruction: 'Write a <strong>work note</strong> that starts its lines with Reported:, Tried: and Result:. Post a <strong>comment</strong> to Priya in plain words. Set the resolution code to <strong>Solution provided</strong> and resolve the ticket.',
        body: 'Why: same standard every time. Success looks like: the checker confirms the three parts, the comment has no flagged terms, and the ticket is Resolved.',
        waitLabel: 'Next Step: Resolved with a note and comment',
        check: () => hd2Rule(HD2_ID, { note: true }) && hd2Rule(HD2_ID, { comment: true }) && hd2Rule(HD2_ID, { code: 'Solution provided' }) && hd2Rule(HD2_ID, { status: 'Resolved' }),
      },
      {
        title: 'Finish the lab',
        instruction: 'Ticket worked. Press <strong>Finish</strong> to send your work to your course page.',
        body: 'Your triage, commands, queue work, notes and comment count once your course page confirms it saved them. There is no score.',
        finish: { label: 'Finish', href: itsPortalUrl('#/program/it-support/module/4', 'hd-m02') },
      },
    ],
  });

  /* ---------------------------------------------------------- hd-m03 ---- */
  /* Module 5 (key its-03) Lab 5.1, the slow-computer sequence and system
   * repair on HD-2180 (coached set its-03-guided). Feedback only, no points.
   * Every check reads saved state (the ticket, the computer, the command log),
   * never a tick box, so a step done early passes when it comes up. The coach
   * names the goal and keeps a typed command behind Show me the command
   * (decision 18). The optional PowerShell lines under steps 1, 2, 5, 6 and 7
   * also pass their step when typed. The old HD-2109 coach is gone; a saved
   * run of it starts fresh. */
  const HD3_ID = 'HD-2180';
  const HD3_PC = 'NS-WS-0277';
  const hd3Seen = (key) => { const m = hd2Machine(HD3_PC); return Boolean(m && Array.isArray(m.seen) && m.seen.includes(key)); };
  const hd3Log = () => (typeof hdState !== 'undefined' && hdState && Array.isArray(hdState.practiceLog) ? hdState.practiceLog : []);
  const hd3Cmds = () => hd3Log().filter((e) => e && e.type === 'command_run' && e.computer === HD3_PC);
  const hd3TypedAny = (pattern) => hd3Cmds().some((e) => pattern.test(String(e.command || '').trim()));
  // The console accepted the command: it ran, it was not a wrong option or a bad path.
  const HD3_REFUSED = ['dism: wrong options', 'sfc: wrong options', 'chkdsk: wrong options', 'chkdsk: volume in use', 'path not found', 'no folder'];
  const hd3Accepted = (e) => { const r = String(e.result || '').toLowerCase(); return !HD3_REFUSED.includes(r) && !r.startsWith('misspelled'); };
  const hd3Dism = (e) => hd3Accepted(e) && /^dism(\.exe)?\s/i.test(String(e.command || '').trim()) && /\/restorehealth\b/i.test(String(e.command || ''));
  const hd3Sfc = (e) => hd3Accepted(e) && /^sfc(\.exe)?\s/i.test(String(e.command || '').trim()) && /\/scannow\b/i.test(String(e.command || ''));
  const hd3Chkdsk = (e) => hd3Accepted(e) && /^chkdsk(\.exe)?\s/i.test(String(e.command || '').trim()) && /\bc:/i.test(String(e.command || '')) && /\/scan\b/i.test(String(e.command || ''));
  const hd3Dir = (e) => {
    if (!hd3Accepted(e)) return false;
    const m = String(e.command || '').trim().match(/^(?:dir|get-childitem|gci)\s+(?:-path\s+)?(.+)$/i);
    if (!m) return false;
    const folder = m[1].trim().replace(/^["']|["']$/g, '').replace(/\//g, '\\').replace(/\\+$/, '').toLowerCase();
    return folder === 'c:\\users\\nwilliams\\desktop';
  };
  // Step 16: one complete note also holds the three items its "Your note
  // needs" list asks for (the ticket's notes.needs).
  const hd3NoteHasEvidence = () => {
    const t = hd2Ticket(HD3_ID);
    const needs = t && typeof hdConsole === 'function' && hdConsole(t).notes && Array.isArray(hdConsole(t).notes.needs) ? hdConsole(t).notes.needs : [];
    const note = t && typeof hdConsoleCompleteNote === 'function' ? hdConsoleCompleteNote(t) : null;
    return Boolean(note) && needs.every((item) => { try { return new RegExp(item.pattern, 'i').test(note.text); } catch { return false; } });
  };
  hd2ForgetStale('hd-m03', 'its-03-guided');

  MODULE_COACHES.push({
    id: 'hd-m03', module: 5, name: 'Guided Lab: the slow-computer sequence and system repair', role: 'Tier 1 Help Desk Technician',
    summary: 'Noah Williams in Sales says his desk PC has crawled since Monday. Read the evidence in the right order, free space the safe way, repair and check Windows, finish the update and prove the fix. Feedback only, no score.',
    completionToken: 'hd-m03', home: '#/helpdesk/tickets',
    resetState: () => {
      if (typeof hdUseTicketSet === 'function') hdUseTicketSet('its-03-guided');
      if (typeof hdState !== 'undefined' && hdState) hdState.selectedTicketId = null;
    },
    allow: ['#/helpdesk/dashboard', '#/helpdesk/tickets', '#/helpdesk/ticket', '#/helpdesk/windows', '#/helpdesk/powershell', '#/helpdesk/pc-task-manager', '#/helpdesk/settings-storage',
      '#/helpdesk/settings-update', '#/helpdesk/settings-apps', '#/helpdesk/software-catalog', '#/helpdesk/reliability', '#/helpdesk/settings-recovery', '#/helpdesk/event-viewer',
      '#/helpdesk/active-directory', '#/helpdesk/knowledge-base'],
    steps: [
      {
        route: '#/helpdesk/ticket', target: 'select[data-hd-field="category"], [data-hd-machines]',
        title: 'Triage the ticket and see what is busy',
        instruction: 'Open Noah’s ticket. Set <strong>Category</strong> Software › Windows performance, <strong>Configuration item</strong> NS-WS-0277, <strong>Impact</strong> 3 and <strong>Urgency</strong> 2. Assign it to yourself. Then open <strong>NS-WS-0277</strong> from the ticket, open <strong>Task Manager › Processes</strong> and sort by <strong>CPU</strong>, then by <strong>Disk</strong>. The same check in PowerShell (optional): <code>Get-Process | Sort-Object CPU -Descending | Select-Object -First 5 Name, CPU, WorkingSet</code>',
        body: 'Why: this shows what is busy now. Reading 2’s order starts here. Success looks like: the priority is P4, the ticket is yours, and you can name the top process and say that Disk, not CPU, is at 100%.',
        waitLabel: 'Next Step: Triaged, and Task Manager read',
        check: () => {
          const t = hd2Ticket(HD3_ID);
          return hd2Triaged(HD3_ID, 'Software', 'Windows performance', HD3_PC, 'P4') && Boolean(t) && t.assignedTechnician === 'Riley Morgan'
            && ((hd3Seen('task-manager:sort:cpu') && hd3Seen('task-manager:sort:disk')) || hd3TypedAny(/^get-process\b.*sort-object\s+(-property\s+)?cpu/i));
        },
      },
      {
        route: '#/helpdesk/pc-task-manager', target: '[data-hd-startup], [data-hd-pc-task-manager]',
        title: 'Read the startup apps',
        instruction: 'In Task Manager open <strong>Startup apps</strong>. Read each app’s publisher, status and startup impact. The same check in PowerShell (optional): <code>Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location</code>',
        body: 'Why: this shows what starts when someone signs in. Success looks like: you see four apps, and each has a verified publisher.',
        waitLabel: 'Next Step: Startup apps read',
        check: () => hd3Seen('task-manager:startup') || hd3TypedAny(/^get-ciminstance\s+(-classname\s+)?win32_startupcommand\b/i),
      },
      {
        // Steps 3, 5 and 6 start on NS-WS-0277's desktop: its tool buttons are
        // what record a screen as opened (hdOpenMachineScreen).
        route: '#/helpdesk/windows', target: '[data-hd-tools="software-catalog"], [data-hd-catalog]',
        title: 'Check each app in the Software Catalog',
        instruction: 'On NS-WS-0277’s desktop, open the <strong>Software Catalog</strong>. Look for each of the four startup apps by name.',
        body: 'Why: an app that is not in the catalog is not approved. Check before you decide what to do with an app. Success looks like: all four are listed, so all four are approved.',
        waitLabel: 'Next Step: Catalog checked',
        check: () => hd3Seen('software-catalog'),
      },
      {
        route: '#/helpdesk/ticket', target: '.hd-chat, .hd-caller, [data-hd-startup]',
        title: 'Ask, then disable one startup app',
        instruction: 'Ask Noah whether he needs <strong>LumenCam Companion</strong> when he signs in. Then, in Task Manager › Startup apps, set LumenCam Companion to <strong>Disabled</strong>.',
        body: 'Why: Disabled stops an app from starting with Windows. It does not uninstall the app. Ask before you change how a person’s PC starts. Success looks like: the status is Disabled, and the app is still in Installed apps.',
        waitLabel: 'Next Step: Asked, and LumenCam disabled',
        check: () => hd2Rule(HD3_ID, { chat: ['lumencam'] }) && hd2Did(HD3_ID, 'startup-disabled', (a) => a.app === 'LumenCam Companion'),
      },
      {
        route: '#/helpdesk/windows', target: '[data-hd-tools="settings-storage"], [data-hd-storage]',
        title: 'Work out the free space',
        instruction: 'On NS-WS-0277’s desktop, open <strong>Settings › System › Storage</strong>. Work out what percentage of C: is free. The same check in PowerShell (optional): <code>Get-Volume -DriveLetter C | Select-Object SizeRemaining, Size</code>',
        body: 'Why: Windows slows down when less than about 10% of the drive is free. Success looks like: 16.6 GB free of 237 GB is 7%. That is a real cause.',
        waitLabel: 'Next Step: Free space worked out',
        check: () => hd3Seen('storage') || hd3TypedAny(/^get-volume\b/i),
      },
      {
        route: '#/helpdesk/windows', target: '[data-hd-tools="settings-update"], [data-hd-windows-update]',
        title: 'Check the update state',
        instruction: 'On NS-WS-0277’s desktop, open <strong>Settings › Windows Update</strong>. The same check in PowerShell (optional): <code>Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 3</code>',
        body: 'Why: this shows whether an update is waiting. Success looks like: the page says “Restart required”, and the last restart was 23 days ago. That is a second cause.',
        waitLabel: 'Next Step: Update state read',
        check: () => hd3Seen('windows-update') || hd3TypedAny(/^get-hotfix\b/i),
      },
      {
        route: '#/helpdesk/event-viewer', target: '[data-hd-event-logs]',
        title: 'Find an error in the System log',
        instruction: 'Open <strong>Event Viewer › Windows Logs › System</strong>. Filter for <strong>Error</strong> and open one event. The same check in PowerShell (optional): <code>Get-WinEvent -LogName System -MaxEvents 20</code>',
        body: 'Why: you want evidence that agrees with what you found. Success looks like: Event ID 2013, source srv, says the disk is at or near capacity.',
        waitLabel: 'Next Step: System error event opened',
        check: () => hd3Seen('event-open:system:2013') || hd3TypedAny(/^get-winevent\b.*\bsystem\b/i),
      },
      {
        route: '#/helpdesk/event-viewer', target: '[data-hd-event-logs]',
        title: 'Measure the slow start',
        instruction: 'In Event Viewer open <strong>Applications and Services Logs › Microsoft › Windows › Diagnostics-Performance › Operational</strong>. Read <strong>Event ID 100</strong>. Then, in the knowledge search on Noah’s ticket, search <strong>slow</strong> and open <strong>KB-0084</strong>.',
        body: 'Why: Event ID 100 measures “slow to start” in seconds. Later you can use it to prove the fix worked. Success looks like: the boot took 94 seconds, and KB-0084 is open.',
        waitLabel: 'Next Step: Boot time read and KB-0084 opened',
        check: () => hd3Seen('event-log:diagnostics-performance') && hd2Rule(HD3_ID, { kb: 'KB-0084' }),
      },
      {
        route: '#/helpdesk/reliability', target: '[data-hd-reliability]',
        title: 'Find the day it started',
        instruction: 'Open <strong>Reliability Monitor</strong>. Find the day the problems started and open that day.',
        body: 'Why: the question is “what changed?” Success looks like: Monday shows an update waiting for a restart and two critical events on the same day.',
        waitLabel: 'Next Step: Monday opened',
        check: () => hd3Seen('reliability:day:Monday'),
      },
      {
        route: '#/helpdesk/settings-storage', target: '[data-hd-temp-remove], [data-hd-storage], #hd-ps-input, .hd-chat',
        title: 'Free space the safe way',
        instruction: 'In <strong>Storage › Temporary files</strong>, remove Windows Update Cleanup and Temporary files. Ask Noah before you empty the Recycle Bin, then empty it. Last, after the cleanup, in the elevated PowerShell window, list his Desktop to show that his files are untouched. <details><summary>Show me the command</summary><code>dir C:\\Users\\nwilliams\\Desktop</code></details>',
        body: 'Why: never delete a person’s files without their consent. The Recycle Bin holds files he deleted. Listing his Desktop proves the cleanup touched none of his files. Success looks like: 38.0 GB free (16%), Disk in Task Manager below 100%, and all his Desktop files listed.',
        waitLabel: 'Next Step: Space freed, Desktop files listed',
        check: () => {
          const m = hd2Machine(HD3_PC);
          if (!m || !m.storage || !m.storage.sizeGb) return false;
          if (Math.round((m.storage.freeGb / m.storage.sizeGb) * 100) < 16) return false;
          // Asked and emptied, in any order: the Recycle Bin can be emptied only
          // once and the question asked only once, so an order gate here would
          // strand the lab. The step text teaches the order.
          if (!hd2Rule(HD3_ID, { chat: ['recycle'] }) || !hd2Did(HD3_ID, 'recycle-bin-emptied')) return false;
          // dir after the last removal (a removal trimmed off the 150-entry log
          // counts as earlier than every entry still in it).
          const log = hd3Log();
          let removedAt = -1;
          log.forEach((e, i) => { if (e && e.type === 'action_taken' && e.action === 'temp-files-removed') removedAt = i; });
          return log.some((e, i) => i > removedAt && e && e.type === 'command_run' && e.computer === HD3_PC && hd3Dir(e));
        },
      },
      {
        route: '#/helpdesk/powershell', target: '#hd-ps-input',
        title: 'Repair the component store, then the system files',
        instruction: 'In the elevated PowerShell window, repair Windows’ component store first. Then repair its system files. Do them in that order. <details><summary>Show me the command</summary><code>DISM /Online /Cleanup-Image /RestoreHealth</code> then <code>sfc /scannow</code></details>',
        body: 'Why: this is the system-file repair pair, in order. They are not the cause today. Practise them here, so the first time is not on a broken PC. Success looks like: DISM completes, and SFC finds no integrity violations.',
        waitLabel: 'Next Step: DISM, then SFC, complete',
        check: () => {
          const list = hd3Cmds();
          const first = list.findIndex(hd3Dism);
          return first >= 0 && list.some((e, i) => i > first && hd3Sfc(e));
        },
      },
      {
        route: '#/helpdesk/powershell', target: '#hd-ps-input',
        title: 'Check the file system',
        instruction: 'In the same window, run the online check of the C: file system. <details><summary>Show me the command</summary><code>chkdsk C: /scan</code></details>',
        body: 'Why: this checks the file system while Windows stays running. Success looks like: “Windows has scanned the file system and found no problems.”',
        waitLabel: 'Next Step: File system checked',
        check: () => hd3Cmds().some(hd3Chkdsk),
      },
      {
        route: '#/helpdesk/ticket', target: '[data-hd-restart-bar], .hd-chat, .hd-caller',
        title: 'Tell Noah, then finish the update',
        instruction: 'Tell Noah you are restarting his PC to finish the update. Then use <strong>Restart</strong>.',
        body: 'Why: an update is not finished, and the PC is not fully protected, until it restarts. Tell the user first, so no work is lost. Success looks like: Settings › Windows Update no longer shows “Restart required”, and Noah signs in to his normal desktop.',
        waitLabel: 'Next Step: Noah told, and the PC restarted',
        check: () => {
          const m = hd2Machine(HD3_PC);
          return hd2Rule(HD3_ID, { chat: ['restart'] }) && hd2Did(HD3_ID, 'restart', (a) => a.finishedUpdate === true)
            && Boolean(m && m.updates) && m.updates.restartRequired === false;
        },
      },
      {
        route: '#/helpdesk/settings-recovery', target: '[data-hd-recovery]',
        title: 'Walk through the Safe Mode route',
        instruction: 'Open <strong>Settings › System › Recovery</strong>. Choose <strong>Advanced startup</strong>, then <strong>Troubleshoot › Advanced options › Startup Settings</strong>, then press <strong>4</strong> for Safe Mode. When the desktop shows Safe Mode, restart normally.',
        body: 'Why: know the route before a user’s PC will not start. Success looks like: the simulated desktop shows “Safe Mode”, then a normal desktop.',
        waitLabel: 'Next Step: Safe Mode, then a normal restart',
        check: () => {
          const m = hd2Machine(HD3_PC);
          const acts = hd2Actions(HD3_ID);
          const safeAt = acts.findIndex((a) => a.id === 'safe-mode-started');
          return safeAt >= 0 && acts.some((a, i) => i > safeAt && a.id === 'restart' && a.fromSafeMode === true) && Boolean(m) && m.safeMode === false;
        },
      },
      {
        route: '#/helpdesk/active-directory', target: '[data-hd-ad-computers], [data-hd-bitlocker]',
        title: 'Look up where the recovery key is stored',
        instruction: 'In the knowledge search on Noah’s ticket, search <strong>recovery key</strong> and open <strong>KB-0083</strong>. Then open <strong>Active Directory › Computers</strong>, find <strong>NS-WS-0277</strong> by its name and open its <strong>BitLocker Recovery</strong> tab. Read the Key ID and the date. This is a look-up only. Don’t click <strong>Read key</strong>, and put nothing about the key in the ticket.',
        body: 'Why: this is where a recovery key lives. Find it now, calmly, so you are not finding it for the first time with a locked-out user on the phone. Success looks like: you can say the Key ID (8D41B6E0) and its date. Nothing is read out.',
        waitLabel: 'Next Step: KB-0083 and the BitLocker tab opened',
        check: () => hd3Seen('ad-bitlocker') && hd2Rule(HD3_ID, { kb: 'KB-0083' }),
      },
      {
        route: '#/helpdesk/ticket', target: '#hd-note-input, .hd-comments, #hd-resolution-code, .hd-chat',
        title: 'Prove the fix and resolve it',
        instruction: 'Read <strong>Event ID 100</strong> again in Diagnostics-Performance. Confirm with Noah that his apps open normally. Write a <strong>work note</strong> with the lines Reported:, Tried: and Result:. In it, include the free-space percentage, the top process and an Event ID. Post a <strong>comment</strong> to Noah in plain words. Set the resolution code to <strong>Solution provided</strong> and resolve the ticket.',
        body: 'Why: verify from the user’s side, then write an evidence-based note. Success looks like: the boot took 52 seconds, Noah confirms his apps open, the checker finds the three parts in your note, the comment has no flagged terms, and the ticket is Resolved.',
        waitLabel: 'Next Step: Verified and resolved with a note and comment',
        check: () => {
          const m = hd2Machine(HD3_PC);
          return hd3Seen('event-log:diagnostics-performance:after-restart') && Boolean(m) && m.bootSeconds === 52
            && hd2Rule(HD3_ID, { confirmed: 'apps' }) && hd2Rule(HD3_ID, { note: true }) && hd3NoteHasEvidence() && hd2Rule(HD3_ID, { comment: true })
            && hd2Rule(HD3_ID, { code: 'Solution provided' }) && hd2Rule(HD3_ID, { status: 'Resolved' });
        },
      },
      {
        title: 'Finish the lab',
        instruction: 'Ticket worked. Press <strong>Finish</strong> to send your work to your course page.',
        body: 'Your triage, screens, commands, notes and comment count once your course page confirms it saved them. There is no score.',
        finish: { label: 'Finish', href: itsPortalUrl('#/program/it-support/module/5', 'hd-m03') },
      },
    ],
  });

  /* ---------------------------------------------------------- hd-m07 ---- */
  /* Module 6 (key its-07) Lab 6.1, the endpoint check on HD-2176 (coached set
   * its-07-guided). Feedback only, no points. Every check reads saved state
   * (the ticket, the computer, the command history), never a tick box, so a
   * step done early passes when it comes up. The five winget lines are typed:
   * they pass from the command history, in any letter case, with extra valid
   * options. The coach names the goal and keeps each typed command behind
   * Show me the command. The optional Defender lines pass steps 6 and 7 like
   * their screens do. The old HD-2119 coach is gone; a saved run of it starts
   * fresh. */
  const HD7_ID = 'HD-2176';
  const HD7_PC = 'NS-WS-0233';
  const hd7Seen = (key) => { const m = hd2Machine(HD7_PC); return Boolean(m && Array.isArray(m.seen) && m.seen.includes(key)); };
  const hd7Log = () => (typeof hdState !== 'undefined' && hdState && Array.isArray(hdState.practiceLog) ? hdState.practiceLog : []);
  const hd7Cmds = () => hd7Log().filter((e) => e && e.type === 'command_run' && e.computer === HD7_PC);
  const hd7TypedAny = (pattern) => hd7Cmds().some((e) => pattern.test(String(e.command || '').trim()));
  // A winget line the console accepted: the result the console logged for it.
  const hd7Result = (pattern) => hd7Cmds().some((e) => pattern.test(String(e.result || '').trim()));
  const hd7App = (name) => {
    const m = hd2Machine(HD7_PC);
    return m && Array.isArray(m.installedApps) ? m.installedApps.find((a) => a && a.name === name) || null : null;
  };
  const hd7SearchFound = (e) => {
    const r = String(e.result || '').toLowerCase();
    return /^winget(\.exe)?\s+(search|find)\b.*notepad/i.test(String(e.command || '').trim()) && !r.endsWith('no package found') && !r.includes(': no ');
  };
  // Step 11: one complete note also holds every item its "Your note needs"
  // list asks for (the ticket's notes.needs).
  const hd7NoteHasEvidence = () => {
    const t = hd2Ticket(HD7_ID);
    const needs = t && typeof hdConsole === 'function' && hdConsole(t).notes && Array.isArray(hdConsole(t).notes.needs) ? hdConsole(t).notes.needs : [];
    const note = t && typeof hdConsoleCompleteNote === 'function' ? hdConsoleCompleteNote(t) : null;
    return Boolean(note) && needs.every((item) => { try { return new RegExp(item.pattern, 'i').test(note.text); } catch { return false; } });
  };
  hd2ForgetStale('hd-m07', 'its-07-guided');

  MODULE_COACHES.push({
    id: 'hd-m07', module: 6, name: 'Guided Lab: endpoint check', role: 'Tier 1 Help Desk Technician',
    summary: 'Leah Brooks in Marketing sends three things: she needs Notepad++ today, Teams keeps freezing, and a OneDrive file has a red X. Work all three, then run the standard endpoint check: protection, a quick scan and browser extensions. Feedback only, no score.',
    completionToken: 'hd-m07', home: '#/helpdesk/tickets',
    resetState: () => {
      if (typeof hdUseTicketSet === 'function') hdUseTicketSet('its-07-guided');
      if (typeof hdState !== 'undefined' && hdState) hdState.selectedTicketId = null;
    },
    allow: ['#/helpdesk/dashboard', '#/helpdesk/tickets', '#/helpdesk/ticket', '#/helpdesk/windows', '#/helpdesk/powershell', '#/helpdesk/settings-apps',
      '#/helpdesk/software-catalog', '#/helpdesk/windows-security', '#/helpdesk/browser-extensions', '#/helpdesk/onedrive', '#/helpdesk/knowledge-base'],
    steps: [
      {
        route: '#/helpdesk/ticket', target: 'select[data-hd-field="category"], [data-hd-machines]',
        title: 'Triage the ticket and open the computer',
        instruction: 'Open Leah’s ticket. Set <strong>Category</strong> Software › Endpoint check, <strong>Configuration item</strong> NS-WS-0233, <strong>Impact</strong> 3 and <strong>Urgency</strong> 2. Assign it to yourself. Then open <strong>NS-WS-0233</strong> from the ticket.',
        body: 'Why: Impact 3 is one person. Urgency 2 is because she needs Notepad++ today. Success looks like: the priority is P4, the ticket is yours, and you are on NS-WS-0233.',
        waitLabel: 'Next Step: Triaged, and the computer opened',
        check: () => {
          const t = hd2Ticket(HD7_ID);
          // NS-WS-0233 open too, so the winget lines in steps 1 to 4 run on it.
          return hd2Triaged(HD7_ID, 'Software', 'Endpoint check', HD7_PC, 'P4') && Boolean(t) && t.assignedTechnician === 'Riley Morgan'
            && typeof hdState !== 'undefined' && hdState.selectedComputer === HD7_PC;
        },
      },
      {
        route: '#/helpdesk/powershell', target: '#hd-ps-input',
        title: 'Install Notepad++ with winget',
        instruction: 'In the elevated PowerShell window on NS-WS-0233, find Notepad++ in the Software Catalog with winget. Then install it by its exact Id. <details><summary>Show me the command</summary><code>winget search notepad++</code> then <code>winget install --id Notepad++.Notepad++ -e</code></details>',
        body: 'Why: Notepad++ is in the Software Catalog, so the Service Desk may install it. winget installs exactly the app whose Id you give. Success looks like: the install finishes, and Notepad++ appears in Installed apps.',
        waitLabel: 'Next Step: Notepad++ installed',
        check: () => hd7Cmds().some(hd7SearchFound) && hd7Result(/^winget install notepad\+\+\.notepad\+\+: (installed|already installed)/i),
      },
      {
        route: '#/helpdesk/powershell', target: '#hd-ps-input',
        title: 'List the apps that have a newer version',
        instruction: 'In the same window, list the apps on NS-WS-0233 that have a newer version. <details><summary>Show me the command</summary><code>winget upgrade</code></details>',
        body: 'Why: Windows Update does not update apps, so an up-to-date Windows can still run an outdated app. Success looks like: a list that includes 7-Zip.',
        waitLabel: 'Next Step: Upgrade list read',
        // The listing is always typed. A 7-Zip already updated can't show in it
        // again, so then any listing counts, even "nothing to upgrade".
        check: () => hd7Result(/^winget upgrade: .*7zip\.7zip/i)
          || (hd2Did(HD7_ID, 'app-upgraded', (a) => a.app === '7-Zip') && hd7Result(/^winget upgrade: /i)),
      },
      {
        route: '#/helpdesk/powershell', target: '#hd-ps-input',
        title: 'Update 7-Zip',
        instruction: 'Update 7-Zip, the one app that is behind, by its Id. <details><summary>Show me the command</summary><code>winget upgrade --id 7zip.7zip -e</code></details>',
        body: 'Why: update the one app that is behind, and nothing else. Success looks like: the upgrade finishes, and the upgrade list no longer shows 7-Zip.',
        waitLabel: 'Next Step: 7-Zip updated',
        check: () => hd2Did(HD7_ID, 'app-upgraded', (a) => a.app === '7-Zip'),
      },
      {
        route: '#/helpdesk/powershell', target: '#hd-ps-input',
        title: 'Remove Notepad++',
        instruction: 'Leah has finished her edit and doesn’t need Notepad++ any more. Before you remove anything, ask whether something else depends on it. Nothing does here. Remove Notepad++ with winget by its exact Id. This step asks for the typed line. If you removed Notepad++ from Installed apps instead, install it again with winget, then remove it with winget. <details><summary>Show me the command</summary><code>winget uninstall --id Notepad++.Notepad++ -e</code></details>',
        body: 'Why: the uninstaller also clears the app’s settings. Ask first whether anything else depends on it. Success looks like: Notepad++ is gone from Installed apps.',
        waitLabel: 'Next Step: Notepad++ removed',
        check: () => hd7Result(/^winget uninstall notepad\+\+\.notepad\+\+: uninstalled$/i) && !hd7App('Notepad++'),
      },
      {
        route: '#/helpdesk/windows', target: '[data-hd-tools="settings-apps"], [data-hd-installed-apps]',
        title: 'Repair Teams, then ask Leah',
        instruction: 'On NS-WS-0233’s desktop, open <strong>Settings › Apps › Installed apps</strong>. Open <strong>Microsoft Teams › Advanced options</strong> and choose <strong>Repair</strong>. Then ask Leah to open Teams and tell you whether it still freezes.',
        body: 'Why: repair is the lightest fix for a misbehaving app, and it keeps the app’s data. Success looks like: the repair completes, and Leah says Teams opens.',
        waitLabel: 'Next Step: Teams repaired, and Leah asked',
        check: () => {
          const teams = hd7App('Microsoft Teams');
          return Boolean(teams && teams.repair && teams.repair.repaired === true) && hd2Rule(HD7_ID, { confirmed: 'teams' });
        },
      },
      {
        route: '#/helpdesk/windows', target: '[data-hd-tools="windows-security"], [data-hd-windows-security]',
        title: 'Check that protection is on and current',
        instruction: 'Steps 6 to 8 are the standard endpoint check a technician runs while on the machine. On NS-WS-0233’s desktop, open <strong>Windows Security › Virus &amp; threat protection</strong>. Read whether real-time protection is on, and when the definitions were last updated. Never turn off protection or add an exclusion to make a problem go away. In a graded ticket this is a critical error. If protection is turned off here, the coach turns it back on. The same check in PowerShell (optional): <code>Get-MpComputerStatus | Select-Object AMServiceEnabled, RealTimeProtectionEnabled, AntivirusSignatureLastUpdated</code>',
        body: 'Why: is protection on and current? Success looks like: real-time protection is On, and the definitions were updated today.',
        waitLabel: 'Next Step: Protection read',
        check: () => hd7Seen('windows-security:virus-threat') || hd7TypedAny(/^get-mpcomputerstatus\b/i),
      },
      {
        route: '#/helpdesk/windows', target: '[data-hd-tools="windows-security"], [data-hd-windows-security]',
        title: 'Run a quick scan, then read Protection history',
        instruction: 'In Windows Security run a <strong>Quick scan</strong>. Then open <strong>Protection history</strong>. The same check in PowerShell (optional): <code>Start-MpScan -ScanType QuickScan</code>, then <code>Get-MpThreatDetection</code>',
        body: 'Why: a quick scan checks for known threats, and the history shows anything a user chose to allow. Success looks like: the scan finds no threats and the history is empty. You can say what you would do if it weren’t. Nothing found, and nothing allowed. If the history showed an item marked Allowed, you would open KB-0080 before doing anything. If it named malware (a trojan, ransomware, a script that ran), you would stop and send the ticket to Security Operations.',
        waitLabel: 'Next Step: Scan run, history read',
        check: () => hd2Did(HD7_ID, 'quick-scan') && (hd7Seen('windows-security:protection-history') || hd7TypedAny(/^get-mpthreatdetection\b/i)),
      },
      {
        route: '#/helpdesk/windows', target: '[data-hd-tools="browser-extensions"], [data-hd-browser-extensions]',
        title: 'Compare the browser extensions with KB-0080',
        instruction: 'In the knowledge search on Leah’s ticket, search <strong>extension</strong> and open <strong>KB-0080</strong>. Then, on NS-WS-0233’s desktop, open the browser’s <strong>Extensions</strong> page and compare it with the approved list in KB-0080. Remove the extension that is not on the list.',
        body: 'Why: extensions that are not approved come off, and the user can ask for one with a software request. Success looks like: the extension that is not on the list is gone. Weather Now Tab isn’t harmful, but it isn’t on the approved list, so it comes off. Tell Leah she can ask for it with a software request.',
        waitLabel: 'Next Step: KB-0080 read, extension removed',
        check: () => {
          const m = hd2Machine(HD7_PC);
          const list = m && Array.isArray(m.extensions) ? m.extensions : [];
          return hd2Rule(HD7_ID, { kb: 'KB-0080' }) && !list.some((x) => x && x.name === 'Weather Now Tab')
            && hd2Did(HD7_ID, 'extension-removed', (a) => a.extension === 'Weather Now Tab');
        },
      },
      {
        route: '#/helpdesk/ticket', target: '[data-hd-choice-card], .hd-chat',
        title: 'Answer the admin password request',
        instruction: 'While you work, Leah asks in the chat to type the admin password for FreeVideoConverter.exe. She downloaded it for a campaign video. Search <strong>admin</strong> in the knowledge search and open <strong>KB-0058</strong>. Then, on her ticket, under <strong>Choose your response</strong>, pick your answer.',
        body: 'Why: this is KB-0058 in practice. Never type an admin password into a user’s installer. Success looks like: you decline, and you open a software request.',
        waitLabel: 'Next Step: Admin password declined',
        check: () => hd2Rule(HD7_ID, { kb: 'KB-0058' }) && hd2Did(HD7_ID, 'software-request-opened'),
      },
      {
        route: '#/helpdesk/windows', target: '[data-hd-tools="onedrive"], [data-hd-onedrive]',
        title: 'Fix the OneDrive red X',
        instruction: 'On NS-WS-0233’s desktop, click the <strong>OneDrive</strong> cloud icon and open <strong>View sync problems</strong>. Read the cause. Rename the file <code>Budget: Q4?.xlsx</code> to <code>Budget - Q4.xlsx</code>. Then open <strong>OneDrive on the web</strong> and find the file.',
        body: 'Why: fix the cause of a red X. Her file was always safe on the computer. Never unlink OneDrive or delete the file first. Success looks like: a green tick, and the file is on OneDrive on the web.',
        waitLabel: 'Next Step: File renamed, and found on the web',
        check: () => {
          const m = hd2Machine(HD7_PC);
          const od = m && m.oneDrive && typeof m.oneDrive === 'object' ? m.oneDrive : null;
          return hd2Did(HD7_ID, 'onedrive-renamed') && Boolean(od) && od.linked !== false
            && typeof hdWinOneDriveProblems === 'function' && hdWinOneDriveProblems(od).length === 0
            && hd2Rule(HD7_ID, { seen: 'onedrive:web', computer: HD7_PC, after: 'onedrive-renamed' });
        },
      },
      {
        route: '#/helpdesk/ticket', target: '#hd-note-input, #hd-resolution-code',
        title: 'Write the note and resolve it',
        instruction: 'Write a <strong>work note</strong> with the lines Reported:, Tried: and Result:. Name each part of the check: the install and removal, the 7-Zip update, the Teams repair, protection and the scan, the extension, the admin password request and the OneDrive rename. Set the resolution code to <strong>Solution provided</strong> and resolve the ticket.',
        body: 'Why: the note is the evidence trail for the next technician. Success looks like: the checker finds each part in your note, and the ticket is Resolved.',
        waitLabel: 'Next Step: Noted and resolved',
        check: () => hd2Rule(HD7_ID, { note: true }) && hd7NoteHasEvidence()
          && hd2Rule(HD7_ID, { code: 'Solution provided' }) && hd2Rule(HD7_ID, { status: 'Resolved' }),
      },
      {
        title: 'Finish the lab',
        instruction: 'Ticket worked. Press <strong>Finish</strong> to send your work to your course page.',
        body: 'Your triage, commands, screens and note count once your course page confirms it saved them. There is no score.',
        finish: { label: 'Finish', href: itsPortalUrl('#/program/it-support/module/6', 'hd-m07') },
      },
    ],
  });

  /* ---------------------------------------------------------- hd-m05 ---- */
  /* Module 7 (key its-05) Lab 7.1, the morning server check on HD-2189 (coached
   * set its-05-guided). Feedback only, no points. Every check reads saved state
   * (the shift's server and directory screens, the command history, the two
   * tickets), never a tick box, so a step done early passes when it comes up.
   * The four typed lines (gpresult /r, gpupdate /force, Get-Service on
   * NS-PRINT01 and Test-NetConnection on NS-FILE01) pass from the command
   * history, in any letter case, with extra valid options. Every other step
   * passes from its screen or from its optional command, which earn the same
   * evidence key. The old HD-2108 and HD-2117 coach is gone; a saved run of it
   * starts fresh. */
  const HD5_ID = 'HD-2189';
  const HD5_RAISED = 'HD-2190';
  const HD5_PC = 'NS-LT-0215';
  // The shift's evidence list, filled by the screens and by the typed lines.
  const hd5Seen = (key) => typeof hdState !== 'undefined' && Boolean(hdState) && Array.isArray(hdState.serverSeen) && hdState.serverSeen.includes(key);
  const hd5Log = () => (typeof hdState !== 'undefined' && hdState && Array.isArray(hdState.practiceLog) ? hdState.practiceLog : []);
  // A result that means the console did not run the line (outside the training
  // shell, a misspelling, a refused option or an unknown service or computer).
  const HD5_REFUSED = /^the term |^misspelled|^error:|^no (service|computer|share)\b|^path not found$|^no folder$|^(get-service|test-netconnection|get-winevent|get-ad\w+) :/i;
  const hd5Typed = (test) => hd5Log().some((e) => e && e.type === 'command_run' && !HD5_REFUSED.test(String(e.result || '').trim())
    && test(String(e.command || '').trim().replace(/\s+/g, ' '), e));
  // gpresult /r on NS-LT-0215: typed on that laptop, or aimed at it with /s.
  // A /s on another computer never counts, whichever laptop is open.
  const hd5Gpresult = (cmd, e) => {
    if (!/^gpresult(\.exe)?\s/i.test(cmd) || !/(^|\s)\/r(\s|$)/i.test(cmd)) return false;
    const named = /\/s\s+("[^"]*"|'[^']*'|\S+)/i.exec(cmd);
    const target = named ? named[1].replace(/^["']|["']$/g, '') : String(e.computer || '');
    return target.toLowerCase() === HD5_PC.toLowerCase();
  };
  const hd5Gpupdate = (cmd, e) => /^gpupdate \/force$/i.test(cmd) && e.computer === HD5_PC;
  const hd5Spooler = (cmd) => /^get-service\b/i.test(cmd) && /-computername\s+["']?ns-print01\b/i.test(cmd) && /(^|\s)["']?spooler["']?(\s|$)/i.test(cmd);
  const hd5Port445 = (cmd) => /^test-netconnection\b/i.test(cmd) && /\bns-file01\b/i.test(cmd) && /-port\s+445\b/i.test(cmd);
  // Step 17: HD-2190 as the student raised and filled it in.
  const hd5RaisedDone = () => {
    const t = hd2Ticket(HD5_RAISED);
    if (!t || t.raisedFrom !== HD5_ID || typeof hdConsoleState !== 'function') return false;
    const r = hdConsoleState(t).rewrite;
    return Boolean(r) && /guest/i.test(String(r.short || '')) && /95/.test(String(r.short || '')) && Array.isArray(r.missing) && r.missing.length === 0
      && String(t.impact) === '2' && String(t.urgency) === '2' && t.priority === 'P3' && t.assignmentGroup === 'Server & Identity'
      && hd2Rule(HD5_RAISED, { note: true });
  };
  // Step 18: the one complete note on HD-2189 points at HD-2190.
  const hd5NoteNamesRaised = () => {
    const t = hd2Ticket(HD5_ID);
    const note = t && typeof hdConsoleCompleteNote === 'function' ? hdConsoleCompleteNote(t) : null;
    return Boolean(note) && /HD-2190|INC0010501/i.test(String(note.text || ''));
  };
  hd2ForgetStale('hd-m05', 'its-05-guided');

  MODULE_COACHES.push({
    id: 'hd-m05', module: 7, name: 'Guided Lab: the morning server check', role: 'Tier 1 Help Desk Technician',
    summary: 'It is Wednesday, 08:00, and the daily server check is yours. Read the five servers, their services and logs, the change log, a file share’s permissions, Active Directory, Group Policy, DNS and DHCP. You change nothing. When you find something that another team owns, you raise a ticket for it and hand it on. Feedback only, no score.',
    completionToken: 'hd-m05', home: '#/helpdesk/tickets',
    resetState: () => {
      if (typeof hdUseTicketSet === 'function') hdUseTicketSet('its-05-guided');
      if (typeof hdState !== 'undefined' && hdState) hdState.selectedTicketId = null;
    },
    allow: ['#/helpdesk/dashboard', '#/helpdesk/tickets', '#/helpdesk/ticket', '#/helpdesk/windows', '#/helpdesk/powershell', '#/helpdesk/server-manager',
      '#/helpdesk/server-services', '#/helpdesk/server-events', '#/helpdesk/file-server', '#/helpdesk/change-log', '#/helpdesk/active-directory',
      '#/helpdesk/group-policy', '#/helpdesk/dns', '#/helpdesk/dhcp', '#/helpdesk/knowledge-base'],
    steps: [
      {
        route: '#/helpdesk/ticket', target: 'select[data-hd-field="category"], [data-hd-machines]',
        title: 'Triage the morning check',
        instruction: 'Open <strong>Morning server check — Wednesday</strong> (HD-2189). Set <strong>Category</strong> Server › Scheduled check, <strong>Configuration item</strong> NS-DC01, <strong>Impact</strong> 3 and <strong>Urgency</strong> 3. Assign it to yourself. The contact type is already Self-service.',
        body: 'Why: planned work is still work, and it is still triaged. This is your first P5. Everything in this lab is read-only. The only record you create is HD-2190. Success looks like: the priority calculates P5 Planning, the ticket is yours, and the SLA bar shows a 2-business-day respond target.',
        waitLabel: 'Next Step: Triaged as P5',
        check: () => {
          const t = hd2Ticket(HD5_ID);
          return hd2Triaged(HD5_ID, 'Server', 'Scheduled check', 'NS-DC01', 'P5') && Boolean(t) && t.assignedTechnician === 'Riley Morgan';
        },
      },
      {
        route: '#/helpdesk/server-manager', target: '[data-hd-server-state], [data-hd-server-warnings]',
        title: 'Read all five servers',
        instruction: 'Open <strong>Server Manager</strong> from the left menu. Read each server’s name, role and status. For each one, ask what breaks for users if it stops.',
        body: 'Why: before anything is wrong, learn what each server is responsible for. Success looks like: you can say what breaks if each one stops. Sign-ins and names (NS-DC01). New addresses (NS-DHCP01). Shared folders (NS-FILE01). Printing (NS-PRINT01). One application (NS-APP01). One warning tile is showing.',
        continueLabel: 'I can say what each one does',
      },
      {
        route: '#/helpdesk/server-manager', target: '[data-hd-server-state], [data-hd-server-detail]',
        title: 'Read the roles on NS-DC01',
        instruction: 'In Server Manager, open <strong>NS-DC01</strong> with its <strong>Open</strong> button. Read the <strong>AD DS</strong> and <strong>DNS Server</strong> roles. The same check in PowerShell (optional): <code>Get-Service -ComputerName NS-DC01</code>',
        body: 'Why: a domain controller is a server running AD DS, and Active Directory can’t work without DNS. Success looks like: both services show Running, started automatically.',
        waitLabel: 'Next Step: AD DS and DNS read',
        check: () => hd5Seen('server:NS-DC01') || hd5Seen('services:NS-DC01'),
      },
      {
        route: '#/helpdesk/server-manager', target: '[data-hd-server-state], [data-hd-server-tool="services"], [data-hd-services]',
        title: 'Find the service account on NS-APP01',
        instruction: 'Open <strong>NS-APP01</strong>, then its <strong>Services</strong> button. Find <strong>Purchasing Service</strong> and read its <strong>Log On As</strong> column.',
        body: 'Why: some services sign in as a service account, an account made for a program rather than a person. When that account’s password expires or is locked, the service won’t start. Success looks like: you can name the service (Purchasing Service), its state (Running) and the account it runs as: <code>NORTHSTAR\\svc-purchasing</code>. When a ticket’s runbook allows it, a Stopped service shows one <strong>Start</strong> button. Nothing here is stopped, and there is never a Stop or Restart button.',
        waitLabel: 'Next Step: Purchasing service account read',
        check: () => hd5Seen('service:NS-APP01:Purchasing'),
      },
      {
        route: '#/helpdesk/server-manager', target: '[data-hd-server-state], [data-hd-server-tool="logs"], [data-hd-server-logs]',
        title: 'Read the System log on NS-FILE01',
        instruction: 'Open <strong>NS-FILE01</strong>, then its <strong>Event logs</strong> button. Read this morning’s entries in the <strong>System</strong> log. The same check in PowerShell (optional): <code>Get-WinEvent -ComputerName NS-FILE01 -LogName System -MaxEvents 20</code>',
        body: 'Why: the System log is where a server says a service stopped or a disk is filling. Success looks like: nothing but Information events overnight. Learn to recognise three IDs. <strong>7031</strong> and <strong>7034</strong> mean a service stopped unexpectedly. <strong>7038</strong> means a service account couldn’t sign in. <strong>2013</strong> means a disk is at or near capacity. You only read them. You restart nothing. In Server Manager, NS-FILE01 also lists its volumes with their free space.',
        waitLabel: 'Next Step: System log read',
        check: () => hd5Seen('server-log:NS-FILE01:system'),
      },
      {
        route: '#/helpdesk/change-log', target: '[data-hd-change-log], [data-hd-change-detail]',
        title: 'Read CHG-7801 in the Change log',
        instruction: 'Open the <strong>Change log</strong> (the button on Server Manager). Open <strong>CHG-7801</strong>.',
        body: 'Why: a change that lines up with a symptom is the fastest evidence you’ll ever find. A change with no symptom is just as worth knowing. Success looks like: CHG-7801 was last night at 22:40, “Add DNS A record for timeclock-02”, by J. Keller, Completed. Nothing this morning relates to it.',
        waitLabel: 'Next Step: CHG-7801 opened',
        check: () => hd5Seen('change:CHG-7801'),
      },
      {
        route: '#/helpdesk/file-server', target: '[data-hd-shares], [data-hd-share-detail]',
        title: 'Read the two permission layers on the HR share',
        instruction: 'Open <strong>File Server</strong>. Open the <strong>HR</strong> share, <code>\\\\NS-FILE01\\HR</code>. Read <strong>Share permissions</strong>, then <strong>Security (NTFS)</strong>.',
        body: 'Why: two layers apply to every share, and they are set in different places. Success looks like: Share: GG-HR-Users · Change. NTFS: GG-HR-Readers · Read, and GG-HR-Contributors · Modify.',
        waitLabel: 'Next Step: Share and NTFS permissions read',
        check: () => hd5Seen('file-share:NS-FILE01:HR:share') && hd5Seen('file-share:NS-FILE01:HR:ntfs'),
      },
      {
        route: '#/helpdesk/file-server', target: '[data-hd-effective-user], [data-hd-effective-access]',
        title: 'Read what Priya Shah can do',
        instruction: 'On the same share, open <strong>Effective access</strong> and choose <strong>Priya Shah</strong>.',
        body: 'Why: this is the answer to “what can she actually do?” Success looks like: Read. She is in GG-HR-Readers, and a user gets the more restrictive of the two layers. Nothing here is broken. It is designed this way.',
        waitLabel: 'Next Step: Effective access read',
        check: () => hd5Seen('effective-access:NS-FILE01:HR:u-1004'),
      },
      {
        route: '#/helpdesk/active-directory', target: '[data-hd-ad-groups], [data-hd-group-members]',
        title: 'List the members of GG-HR-Contributors',
        instruction: 'Open <strong>Active Directory › Groups</strong>. Open <strong>GG-HR-Contributors</strong> with its <strong>Members</strong> button. The same check in PowerShell (optional): <code>Get-ADGroupMember GG-HR-Contributors</code>',
        body: 'Why: permissions are given to groups, so “who can do this?” is always a group’s member list. Success looks like: four members are listed. You can say who gets Modify on the HR share, and why.',
        waitLabel: 'Next Step: Group members read',
        check: () => hd5Seen('ad-group:GG-HR-Contributors'),
      },
      {
        route: '#/helpdesk/active-directory', target: '[data-hd-ad-user], [data-hd-member-of]',
        title: 'Read Jordan Bell’s account',
        instruction: 'Open <strong>Active Directory › Users</strong>. Click <strong>Jordan Bell</strong> to open his account. Read the account state and <strong>Member Of</strong>. Change nothing. The same check in PowerShell (optional): <code>Get-ADUser jbell -Properties MemberOf, LockedOut</code>',
        body: 'Why: reading an account is Tier 1’s daily work. Changing one comes next module. Success looks like: you can say whether he is locked, disabled or expired, and list his groups. His account shows Locked today. Unlocking an account is next module’s work, so you only read it here.',
        waitLabel: 'Next Step: Account and groups read',
        check: () => hd5Seen('ad-user:u-1005') && hd5Seen('ad-user-groups:u-1005'),
      },
      {
        route: '#/helpdesk/active-directory', target: '[data-hd-ad-computers], [data-hd-ad-computer-pane]',
        title: 'Find NS-LT-0215 and read its OU',
        instruction: 'Open <strong>Active Directory › Computers</strong>. Find <strong>NS-LT-0215</strong> by its name, then press its <strong>Open</strong> button. Read its <strong>OU</strong>. The same check in PowerShell (optional): <code>Get-ADComputer NS-LT-0215</code>',
        body: 'Why: where a computer object lives decides which policies reach it. Success looks like: <code>OU=Sales,OU=Workstations</code>. The laptop is in its department’s OU, where it should be.',
        waitLabel: 'Next Step: Computer and OU read',
        check: () => hd5Seen('ad-computer:NS-LT-0215'),
      },
      {
        route: '#/helpdesk/ticket', target: '[data-hd-machines], #hd-ps-input',
        title: 'Check that policy reached the laptop',
        instruction: 'Go back to HD-2189 and press <strong>Open NS-LT-0215</strong>, so PowerShell runs on that laptop. Then open <strong>PowerShell</strong> and ask the laptop which policies reached it. <details><summary>Show me the command</summary><code>gpresult /r</code></details>',
        body: 'Why: this is the one command that answers “did the policy actually reach this machine?” This step asks for the typed line. Running it on another laptop doesn’t count. Success looks like: Applied: Default Domain Policy and Workstation Security Baseline. Denied: nothing.',
        waitLabel: 'Next Step: gpresult run on NS-LT-0215',
        check: () => hd5Typed(hd5Gpresult) && hd5Seen('gp-results:NS-LT-0215'),
      },
      {
        route: '#/helpdesk/powershell', target: '#hd-ps-input, [data-hd-gp-results-card]',
        title: 'Re-apply policy, then read the result again',
        instruction: 'In the same PowerShell window on NS-LT-0215, re-apply policy. Then open <strong>Group Policy › Results</strong> for NS-LT-0215 again. <details><summary>Show me the command</summary><code>gpupdate /force</code></details>',
        body: 'Why: re-applying policy and proving it applied is the check after any policy fix. Success looks like: the computer’s <strong>Last applied</strong> time moves, and the same two policies still apply. The GPO version numbers change only when someone edits a GPO.',
        waitLabel: 'Next Step: Policy re-applied',
        check: () => hd5Typed(hd5Gpupdate) && hd5Seen('gpupdate:NS-LT-0215'),
      },
      {
        // Starts on the dashboard: the DNS screen records its records as it
        // draws, so the coach opening it would pass the step by itself.
        route: '#/helpdesk/dashboard', target: '[data-hd-dns-zone], a[href="#/helpdesk/dns"]',
        title: 'Read four DNS record types',
        instruction: 'Open <strong>DNS</strong> from the left menu, then the <code>northstar.example</code> zone. Keep the filter on <strong>All</strong>. Find the <strong>A</strong> record for <code>files</code>, the <strong>CNAME</strong> for <code>purchasing</code>, the <strong>MX</strong> record and the <strong>TXT</strong> record.',
        body: 'Why: four record types, four jobs. You’ll be asked to read these, never to create them. Success looks like: <code>files</code> → 10.20.0.30. <code>purchasing</code> → <code>ns-app01.northstar.example</code>. MX → <code>mail.northstar.example</code>. The TXT record begins <code>v=spf1</code>. The new <code>timeclock-02</code> A record from CHG-7801 is there too.',
        waitLabel: 'Next Step: Four records read',
        check: () => ['dns-record:files:A', 'dns-record:purchasing:CNAME', 'dns-record:@:MX', 'dns-record:@:TXT'].every(hd5Seen),
      },
      {
        route: '#/helpdesk/dhcp', target: '[data-hd-dhcp-scopes], [data-hd-dhcp-detail]',
        title: 'Read the Warehouse scope',
        instruction: 'Open <strong>DHCP</strong> (NS-DHCP01). Open the <strong>Warehouse</strong> scope. Read the <strong>leases</strong>, the <strong>reservation</strong> on NS-WH-LABEL01, the <strong>exclusion</strong> range and the <strong>VLAN</strong>.',
        body: 'Why: scope, lease, reservation, exclusion and VLAN are the five words every DHCP ticket uses. Success looks like: 78% used, VLAN 30, one reservation, and an excluded range at the start of the scope.',
        waitLabel: 'Next Step: Warehouse scope read',
        check: () => hd5Seen('dhcp-scope:Warehouse'),
      },
      {
        route: '#/helpdesk/dhcp', target: '[data-hd-dhcp-scopes], #hd-ps-input',
        title: 'Read Guest Wi-Fi, then two read-only checks',
        instruction: 'Still in DHCP, open the <strong>Guest Wi-Fi</strong> scope and read it. Then, in PowerShell, check the Print Spooler service on NS-PRINT01, and test that NS-FILE01 answers on port 445. Both lines only read. Nothing changes on a server. <details><summary>Show me the command</summary><code>Get-Service -ComputerName NS-PRINT01 -Name Spooler</code> then <code>Test-NetConnection NS-FILE01 -Port 445</code></details>',
        body: 'Why: these are two read-only checks Tier 1 may run on any server, any day. Success looks like: Guest Wi-Fi is 95% used, 12 free of 221, status Warning. The Spooler is Running. The test shows <code>TcpTestSucceeded : True</code>.',
        waitLabel: 'Next Step: Guest Wi-Fi read, two checks run',
        check: () => hd5Seen('dhcp-scope:Guest Wi-Fi') && hd5Typed(hd5Spooler) && hd5Seen('service:NS-PRINT01:Spooler')
          && hd5Typed(hd5Port445) && hd5Seen('port:NS-FILE01:445'),
      },
      {
        route: '#/helpdesk/ticket', target: '[data-hd-raise-card], .hd-rewrite, select[data-hd-field="impact"], select[data-hd-field="urgency"], #hd-assignment-group, #hd-note-input',
        title: 'Raise HD-2190 for the Guest Wi-Fi scope',
        instruction: 'On HD-2189, press <strong>Raise a related incident</strong>. Do this before you resolve HD-2189. HD-2190 opens. Write its short description and description, then press <strong>Save and check</strong>. Set <strong>Impact</strong> 2 and <strong>Urgency</strong> 2. Set <strong>Assignment group</strong> to <strong>Server &amp; Identity</strong> and press <strong>Assign to group</strong>. Write a work note with Reported:, Tried:, Result: and Next action:. Say plainly in it that you changed nothing.',
        body: 'Why: you found something that isn’t yours to fix. Raising it properly is the job. Scope sizing belongs to Server &amp; Identity. Success looks like: the short description names the scope (Guest Wi-Fi) and the percentage (95%), and the short description or the description names the risk. Save and check lists any part you left out. Priority calculates P3. The note has Reported, Tried, Result and Next action, and says you changed nothing. This is the only record you create in the lab.',
        waitLabel: 'Next Step: HD-2190 raised, filled in and assigned',
        check: hd5RaisedDone,
      },
      {
        route: '#/helpdesk/tickets', target: 'tr[onclick*="HD-2189"], #hd-note-input, #hd-resolution-code',
        title: 'Write HD-2189’s note and resolve it',
        instruction: 'Go back to <strong>INC0010500</strong>, the Morning server check, from <strong>Tickets</strong>. Write a <strong>work note</strong> with the lines Reported:, Tried:, Result: and Next action:. List what you checked, and name HD-2190. Set the resolution code to <strong>Solution provided</strong> and resolve the ticket.',
        body: 'Why: a check that found nothing still gets written down. “I looked and it was healthy” is evidence next week. Success looks like: the ticket is Resolved, with a note that lists what you checked and points at HD-2190. A model note:<br><strong>Reported:</strong> Scheduled morning server check, Wednesday 08:00.<br><strong>Tried:</strong> Server Manager on all five servers. NS-DC01: AD DS and DNS Running. NS-APP01: Purchasing Service Running as NORTHSTAR\\svc-purchasing. NS-FILE01 System log clear overnight. Change log: CHG-7801 (DNS A record for timeclock-02, 22:40, Completed) with no related symptom this morning. <code>\\\\NS-FILE01\\HR</code> share and NTFS permissions read; effective access for P. Shah is Read, as designed. NS-LT-0215 in OU=Sales,OU=Workstations, all policies applied after <code>gpresult /r</code> and <code>gpupdate /force</code>. DNS zone records read. DHCP Warehouse scope 78% (one reservation, one exclusion, VLAN 30); Guest Wi-Fi scope 95%. Spooler on NS-PRINT01 Running; NS-FILE01 answers on port 445.<br><strong>Result:</strong> All roles and services healthy. Nothing changed on any server. The Guest Wi-Fi scope at 95% is raised separately as HD-2190 for Server &amp; Identity.<br><strong>Next action:</strong> none on this ticket. HD-2190 carries the scope.',
        waitLabel: 'Next Step: Noted and resolved',
        check: () => hd2Rule(HD5_ID, { note: true }) && hd5NoteNamesRaised()
          && hd2Rule(HD5_ID, { code: 'Solution provided' }) && hd2Rule(HD5_ID, { status: 'Resolved' }),
      },
      {
        title: 'Finish the lab',
        instruction: 'Check worked. Press <strong>Finish</strong> to send your work to your course page.',
        body: 'Your triage, screens, commands, both tickets and notes count once your course page confirms it saved them. There is no score.',
        finish: { label: 'Finish', href: itsPortalUrl('#/program/it-support/module/7', 'hd-m05') },
      },
    ],
  });

  /* ---------------------------------------------------------- hd-m06 ---- */
  /* Module 8 (key its-06) Lab 8.1, an identity morning (coached set
   * its-06-guided): Part A on HD-2196 (Noah Williams, a lockout that comes
   * back), Part B on HD-2197 and its request SR-2207 (Sam Rivera, a new work
   * phone). Feedback only, no points. Every check reads saved state (the
   * tickets, the shift's screen list, the command history, the phone), never
   * a tick box, so a step done early passes when it comes up. Lab 8.1 types
   * cmdkey /list (required) and Get-ADUser (or reads the same pane); ticket
   * 8-C types the third line, whoami /groups. Every other step passes from its
   * screen or from its optional command, which earn the same evidence key. Phone and cloud changes record on whichever ticket is
   * open, so Part B reads both HD-2197 and SR-2207. A toggle on the phone is
   * read from the phone's state, because a toggle done twice is off. The old
   * SR-2107 and HD-2118 coach is gone; a saved run of it starts fresh. */
  const HD6_A = 'HD-2196';
  const HD6_B = 'HD-2197';
  const HD6_R = 'SR-2207';
  const HD6_PC = 'NS-WS-0277';
  const HD6_PHONE = 'NS-PH-0001';
  const HD6_CODE = 'Fixed — user guided';
  // The ticket the student opened from Tickets. A lookup counts for that
  // ticket only (hdServerPracticeTicket), so step 1 waits until it is open.
  const hd6Opened = (id) => typeof hdState !== 'undefined' && Boolean(hdState) && hdState.openedTicketId === id;
  const hd6Seen = (key) => typeof hdState !== 'undefined' && Boolean(hdState) && Array.isArray(hdState.serverSeen) && hdState.serverSeen.includes(key);
  // A line the console ran (not refused), in any letter case, with extra spaces.
  const hd6Typed = (computer, test) => (typeof hdState !== 'undefined' && hdState && Array.isArray(hdState.practiceLog) ? hdState.practiceLog : [])
    .some((e) => e && e.type === 'command_run' && (!computer || e.computer === computer) && !HD5_REFUSED.test(String(e.result || '').trim())
      && test(String(e.command || '').trim().replace(/\s+/g, ' ')));
  // The phone and the cloud record an action on the open ticket, so Part B
  // reads both of its records.
  const hd6BDid = (action, test) => hd2Did(HD6_B, action, test) || hd2Did(HD6_R, action, test);
  const hd6Phone = () => {
    try {
      const cloud = typeof hdCloud === 'function' ? hdCloud() : null;
      return cloud && typeof hdPhone === 'function' ? hdPhone(HD6_PHONE, cloud) : null;
    } catch { return null; }
  };
  // The user's own confirmation, after the fix: the ticket's questions that
  // confirm it (confirms: true), asked while the account was unlocked.
  const hd6Confirmed = (id) => {
    const t = hd2Ticket(id);
    if (!t || typeof hdConsole !== 'function' || typeof hdConsoleState !== 'function') return false;
    const ids = (((hdConsole(t).caller || {}).questions) || []).filter((q) => q && q.confirms).map((q) => q.id);
    return !ids.length || hdConsoleState(t).chat.some((e) => e && ids.includes(e.id) && !e.refused && e.whileLocked === false);
  };
  const hd6Unlocked = (userId) => {
    const user = typeof hdFileUser === 'function' ? hdFileUser(userId) : null;
    return Boolean(user) && user.locked === false;
  };
  // Part B's triage: the CI is Sam's account or his new phone.
  const hd6TriagedB = () => {
    const t = hd2Ticket(HD6_B);
    const c = t && typeof hdClassification === 'function' ? hdClassification(t) : null;
    return Boolean(t && c) && c.category === 'Access' && c.subcategory === 'MFA' && ['srivera', HD6_PHONE].includes(c.ci) && t.priority === 'P4';
  };
  // Part B step 6: the newest sign-in row for Sam is a success (the approved test).
  const hd6LatestSignInOk = () => {
    try {
      const cloud = typeof hdCloud === 'function' ? hdCloud() : null;
      const entra = cloud && typeof hdEntraUser === 'function' ? hdEntraUser('u-1013', cloud) : null;
      const last = entra && entra.signIns.length ? entra.signIns[entra.signIns.length - 1] : null;
      return Boolean(last) && last.status === 'Success';
    } catch { return false; }
  };
  // Part B step 12: the request itself is closed (Closed Complete), the state the
  // instructor sheet reads. Resolving the record alone leaves it Open.
  const hd6RequestClosed = () => {
    const t = hd2Ticket(HD6_R);
    return Boolean(t) && Boolean(t.request) && /^closed/i.test(String(t.request.state || ''));
  };
  hd2ForgetStale('hd-m06', 'its-06-guided');

  MODULE_COACHES.push({
    id: 'hd-m06', module: 8, name: 'Guided Lab: an identity morning', role: 'Tier 1 Help Desk Technician',
    summary: 'Noah Williams in Sales keeps getting locked out. Find out why and fix the cause, then unlock him once. After that, Sam Rivera walks up with a new work phone: set up his sign-in approvals, enrol the phone, set up Outlook and OneDrive, pair his headset, and give him Send as on the support mailbox. Feedback only, no score.',
    completionToken: 'hd-m06', home: '#/helpdesk/tickets',
    resetState: () => {
      if (typeof hdUseTicketSet === 'function') hdUseTicketSet('its-06-guided');
      // HD-2196 starts open: the ticket view shows a ticket before one is
      // opened, and lookups count only for an opened ticket (step 1 waits).
      if (typeof hdState !== 'undefined' && hdState) { hdState.selectedTicketId = HD6_A; hdState.openedTicketId = HD6_A; }
    },
    allow: ['#/helpdesk/dashboard', '#/helpdesk/tickets', '#/helpdesk/ticket', '#/helpdesk/windows', '#/helpdesk/powershell', '#/helpdesk/active-directory',
      '#/helpdesk/directory', '#/helpdesk/credential-manager', '#/helpdesk/file-server', '#/helpdesk/knowledge-base', '#/helpdesk/m365-admin',
      '#/helpdesk/entra-admin', '#/helpdesk/intune', '#/helpdesk/phone'],
    steps: [
      /* ---- Part A: HD-2196, Noah Williams, "Locked out AGAIN" ---- */
      {
        route: '#/helpdesk/ticket', target: 'select[data-hd-field="category"], select[data-hd-field="impact"], select[data-hd-field="urgency"]',
        title: 'Part A: triage Noah’s lockout',
        instruction: 'Open <strong>Locked out AGAIN</strong> (HD-2196) from <strong>Tickets</strong>. Noah Williams in Sales is on the phone. He was locked out three times since lunch, and you unlocked him at 12:20. Set <strong>Category</strong> Access › Account lockout and <strong>Configuration item</strong> nwilliams (the AD account). Set <strong>Contact type</strong> Phone, <strong>Impact</strong> 3 and <strong>Urgency</strong> 1.',
        body: 'Why: one person who can’t work at all. The matrix gives P3. Success looks like: the priority shows P3.',
        waitLabel: 'Next Step: Triaged as P3',
        check: () => hd6Opened(HD6_A) && hd2Triaged(HD6_A, 'Access', 'Account lockout', 'nwilliams', 'P3'),
      },
      {
        route: '#/helpdesk/ticket', target: '.hd-verify, .hd-chat, [data-hd-choice-card]',
        title: 'Verify Noah with KB-0024',
        instruction: 'Open <strong>KB-0024</strong> in the knowledge base. On the ticket, verify Noah: call back on the number in the directory and confirm his employee ID.',
        body: 'Why: every account action starts with knowing who you’re talking to. Success looks like: the Verify caller card shows Verified.',
        waitLabel: 'Next Step: Noah verified',
        check: () => hd2Rule(HD6_A, { verified: true }),
      },
      {
        // Starts on PowerShell: Noah's pane records its keys as it draws once
        // it is open, so opening the Active Directory screen could pass the
        // step by itself.
        route: '#/helpdesk/powershell', target: '#hd-ps-input',
        title: 'Read every status field on Noah’s account',
        instruction: 'Read Noah’s account status. Open <strong>PowerShell</strong> from the left menu and ask for it there, or open <strong>Active Directory › Users › Noah Williams</strong> and read his pane. <details><summary>Show me the command</summary><code>Get-ADUser nwilliams -Properties LockedOut, Enabled, AccountExpirationDate, PasswordExpired, PasswordLastSet</code></details>',
        body: 'Why: read every status field before you touch the account. Success looks like: you can say that the account is locked, enabled, never expires and its password is not expired. His password was set yesterday at 16:10.',
        waitLabel: 'Next Step: Account status read',
        // Read on HD-2196 itself, the record "Check my work" reads.
        check: () => hd2Rule(HD6_A, { serverSeen: 'ad-user:u-1003' }),
      },
      {
        route: '#/helpdesk/active-directory', target: '[data-hd-lockout="u-1003"], [data-hd-ad-user]',
        title: 'Open Lockout details',
        instruction: 'In <strong>Active Directory › Users</strong>, open <strong>Noah Williams</strong> and press <strong>Lockout details</strong>. The <strong>Show the Tier 2 view</strong> button is optional. It opens the event 4740 card that Tier 2 reads. If you opened another ticket, open HD-2196 again first: the lookup counts for the ticket that is open.',
        body: 'Why: a lockout that keeps coming back has a source. Lockout details reads it from the domain controller. Success looks like: Lockouts today 3, and the last lockout source is NS-WS-0277. The Tier 2 view shows the same computer in event 4740.',
        waitLabel: 'Next Step: Lockout source found',
        check: () => hd2Rule(HD6_A, { serverSeen: 'ad-lockout:u-1003' }),
      },
      {
        route: '#/helpdesk/ticket', target: '.hd-chat, .hd-caller',
        title: 'Ask Noah about NS-WS-0277',
        instruction: 'In the chat on HD-2196, ask Noah: <strong>Is NS-WS-0277 a computer you use?</strong>',
        body: 'Why: check what changed, which is the method. His password changed yesterday. Success looks like: Noah says it’s his old desk PC, and he left it signed in with the Sales drive mapped. Your theory: a saved password on that PC still has the old one.',
        waitLabel: 'Next Step: Noah’s old desk PC',
        // By the question's id: the consent question also names NS-WS-0277.
        check: () => hd2Rule(HD6_A, { chat: ['device'] }),
      },
      {
        route: '#/helpdesk/ticket', target: '[data-hd-machines], #hd-ps-input',
        title: 'List the saved credentials on NS-WS-0277',
        instruction: 'On HD-2196, press <strong>Open NS-WS-0277</strong>. That is the Windows desktop, signed in as Noah. Open <strong>PowerShell</strong> there and list the saved Windows credentials. <details><summary>Show me the command</summary><code>cmdkey /list</code></details>',
        body: 'Why: this lists saved Windows credentials without showing any password. This step asks for the typed line. Success looks like: <code>Target: Domain:target=NS-FILE01</code>, Type Domain Password, User <code>NORTHSTAR\\nwilliams</code>.',
        waitLabel: 'Next Step: cmdkey /list run on NS-WS-0277',
        check: () => hd6Typed(HD6_PC, (cmd) => /^cmdkey(\.exe)?\s+\/list\b/i.test(cmd)),
      },
      {
        route: '#/helpdesk/credential-manager', target: '[data-hd-cred="NS-FILE01"], [data-hd-cred-remove], [data-hd-tools="credential-manager"]',
        title: 'Remove the stale saved password',
        instruction: 'Tell Noah what you will do and get his OK. Then, on NS-WS-0277, open <strong>Credential Manager › Windows Credentials</strong>, find <strong>NS-FILE01</strong> and press <strong>Remove</strong>. Confirm with <strong>Yes, remove</strong>. The same fix in a command (optional): <code>cmdkey /delete:NS-FILE01</code>',
        body: 'Why: removing the stale entry stops the bad attempts. Windows asks for the new password the next time the drive is used. Success looks like: the entry is gone from the list, and the ticket history says you removed it.',
        waitLabel: 'Next Step: Saved credential removed',
        check: () => hd2Did(HD6_A, 'credential-removed'),
      },
      {
        route: '#/helpdesk/active-directory', target: '[data-hd-acct="unlock"], [data-hd-ad-user]',
        title: 'Unlock Noah once',
        instruction: 'On HD-2196, search the knowledge base for <strong>keeps locking</strong> and open <strong>KB-0103</strong>. Then, in <strong>Active Directory › Users</strong>, open <strong>Noah Williams</strong> and press <strong>Unlock</strong>, once. The same fix in a command (optional): <code>Unlock-ADAccount nwilliams</code>',
        body: 'Why: unlock only after the source is fixed (KB-0103). Unlocking first would let the old password lock him again. Success looks like: Locked out shows No.',
        waitLabel: 'Next Step: KB-0103 read, Noah unlocked',
        check: () => hd2Rule(HD6_A, { kb: 'KB-0103' }) && hd2Rule(HD6_A, { actionsAfter: { after: 'credential-removed', action: 'ad-unlocked' } }) && hd6Unlocked('u-1003'),
      },
      {
        route: '#/helpdesk/ticket', target: '[data-hd-wait-card], [data-hd-wait], .hd-chat',
        title: 'Make sure it stays fixed',
        instruction: 'On HD-2196, press <strong>Wait 2 minutes</strong>. Then check again: Noah’s pane, <strong>Lockout details</strong> or <code>Get-ADUser</code> all work. Ask Noah to sign in and open the Sales drive with his new password.',
        body: 'Why: make sure the fix holds. Success looks like: Noah is still unlocked with no new lockout. He signs in and reopens the Sales drive with his new password.',
        waitLabel: 'Next Step: Still unlocked, Noah confirms',
        check: () => hd2Rule(HD6_A, { actionsAfter: { after: 'ad-unlocked', action: 'waited' } }) && hd6Unlocked('u-1003') && hd6Confirmed(HD6_A),
      },
      {
        route: '#/helpdesk/ticket', target: '#hd-note-input, .hd-comments, #hd-resolution-code',
        title: 'Write the note and comment, then resolve HD-2196',
        instruction: '<strong>Attach KB-0103</strong> to HD-2196. Write a <strong>work note</strong> with the lines Reported:, Tried: and Result:. Post a <strong>comment</strong> to Noah in plain words. Set the resolution code to <strong>Fixed — user guided</strong> and resolve the ticket.',
        body: 'Why: the note is how the next technician knows what happened. Success looks like: the note has Reported, Tried and Result, the comment is in plain language, and the ticket is Resolved. A model note:<br><strong>Reported:</strong> locked out 3 times since lunch; unlocked at 12:20 and locked again; password changed yesterday.<br><strong>Tried:</strong> verified per KB-0024 (directory callback and employee ID). Account locked, enabled, never expires, password set yesterday 16:10. Lockout details: 3 lockouts today, source NS-WS-0277 (his old desk PC). <code>cmdkey /list</code> showed a saved credential for NS-FILE01 with the old password. With Noah’s OK, removed it in Credential Manager (KB-0103). Unlocked once.<br><strong>Result:</strong> no new bad attempts after 2 minutes. Noah signed in and reconnected the Sales drive with his new password.<br>A model comment: Hi Noah, you’re unlocked and it should stay that way now. Your old desk PC still had your previous password saved for the Sales drive, and it kept trying it, which locked you out. We’ve removed that saved password. If your desk PC asks for your password for the drive, type your new one. – Riley',
        waitLabel: 'Next Step: HD-2196 noted and resolved',
        check: () => hd2Rule(HD6_A, { attached: 'KB-0103' }) && hd2Rule(HD6_A, { note: true }) && hd2Rule(HD6_A, { comment: true })
          && (hd2Rule(HD6_A, { code: HD6_CODE }) || hd2Rule(HD6_A, { code: 'Solution provided' })) && hd2Rule(HD6_A, { status: 'Resolved' }),
      },
      /* ---- Part B: HD-2197 and SR-2207, Sam Rivera, "New work phone" ---- */
      {
        route: '#/helpdesk/ticket', target: 'select[data-hd-field="category"], select[data-hd-field="impact"], select[data-hd-field="urgency"], [data-hd-request]',
        title: 'Part B: triage Sam’s new phone',
        instruction: 'Sam Rivera in Customer Service walks up to the Service Desk with his badge. Open <strong>New work phone</strong> (HD-2197). Set <strong>Category</strong> Access › MFA and <strong>Configuration item</strong> Sam’s account (srivera) or his phone NS-PH-0001. Set <strong>Contact type</strong> Walk-in, <strong>Impact</strong> 3 and <strong>Urgency</strong> 2. Also open the linked request <strong>SR-2207</strong> (RITM0010162, Shared mailbox access).',
        body: 'Why: one person, still working on his laptop. Success looks like: HD-2197 shows P4. The request shows no SLA bar, because a request has no priority.',
        waitLabel: 'Next Step: Triaged as P4',
        check: hd6TriagedB,
      },
      {
        route: '#/helpdesk/ticket', target: '.hd-verify, [data-hd-evidence], .hd-chat',
        title: 'Verify Sam in person with KB-0065',
        instruction: 'On HD-2197, open <strong>KB-0065</strong>. Compare Sam’s badge with his directory photo and confirm his employee ID. Then open the hardware request on his record: <strong>Hardware request (yesterday): phone swap</strong>.',
        body: 'Why: an MFA change needs the strongest check, and in person with a matching badge is the strongest. Success looks like: Sam is verified in person. The swap is on record: old phone NS-PH-0002 returned and wiped, new phone NS-PH-0001 issued.',
        waitLabel: 'Next Step: Sam verified, swap on record',
        check: () => hd2Rule(HD6_B, { verified: true }) && hd2Rule(HD6_B, { evidence: 'sam-hardware-request' }),
      },
      {
        // Starts on the ticket: the Service health tab records its key as it
        // draws, so opening the admin center on that tab could pass the step
        // by itself.
        route: '#/helpdesk/ticket', target: '[data-hd-cloud-open="m365"], [data-hd-cloud-card]',
        title: 'Check Microsoft’s service health first',
        instruction: 'On the ticket, open the <strong>Microsoft 365 admin center</strong>. Choose the <strong>Service health</strong> tab. Read the advisories.',
        body: 'Why: check Microsoft before you change anything locally. Success looks like: one advisory, Teams meeting recordings delayed. Nothing is about sign-in or Exchange, so the problem is not on Microsoft’s side.',
        waitLabel: 'Next Step: Service health read',
        check: () => hd2Rule(HD6_B, { serverSeen: 'm365-health' }),
      },
      {
        route: '#/helpdesk/entra-admin', target: '[data-hd-entra-user="u-1013"], [data-hd-reregister], [data-hd-method-device]',
        title: 'Read Sam’s methods, then require re-registration',
        instruction: 'Open the <strong>Entra admin center</strong> and choose <strong>Sam Rivera</strong>. On <strong>Authentication methods</strong>, read his methods. Then press <strong>Require re-register multifactor authentication</strong>.',
        body: 'Why: his Authenticator is on a wiped phone. Re-registration makes him set it up again at his next sign-in. Read before you change. Success looks like: the method shown is Microsoft Authenticator on NS-PH-0002. After the action, the audit log shows the reset by rmorgan.',
        waitLabel: 'Next Step: Re-registration required',
        check: () => hd2Rule(HD6_B, { serverSeen: 'entra-methods:u-1013' }) && hd6BDid('entra-mfa-reregister'),
      },
      {
        route: '#/helpdesk/phone', target: '[data-hd-auth-add], [data-hd-phone-open="authenticator"], [data-hd-auth-test], [data-hd-auth-prompt]',
        title: 'Set up Authenticator on NS-PH-0001',
        instruction: 'Open the <strong>Phone</strong> screen for <strong>NS-PH-0001</strong>. Open <strong>Authenticator</strong> and press <strong>Add work account</strong>. Then press <strong>Sign in on the laptop (test)</strong> and <strong>Approve</strong> the prompt.',
        body: 'Why: the new phone becomes his second factor. Success looks like: Authentication methods now shows Microsoft Authenticator on NS-PH-0001.',
        waitLabel: 'Next Step: Authenticator set up and approved',
        check: () => hd6BDid('phone-auth-added') && hd6BDid('phone-auth-approved'),
      },
      {
        route: '#/helpdesk/entra-admin', target: '[data-hd-cloud-tab="signins"], [data-hd-entra-signins], [data-hd-signin-reason]',
        title: 'Read Sam’s sign-in log',
        instruction: 'In the <strong>Entra admin center</strong>, open <strong>Sam Rivera</strong> and choose <strong>Sign-in logs</strong>.',
        body: 'Why: learn to read why a sign-in failed, and that it works now. Success looks like: earlier rows say “MFA required — not completed”. The newest row is Success, with MFA by Authenticator.',
        waitLabel: 'Next Step: Sign-in log read',
        check: () => hd2Rule(HD6_B, { serverSeen: 'entra-signins:u-1013' }) && hd6BDid('phone-auth-approved') && hd6LatestSignInOk(),
      },
      {
        route: '#/helpdesk/phone', target: '[data-hd-cp-enrol], [data-hd-phone-open="company-portal"], [data-hd-cp-status]',
        title: 'Enrol the phone, then read it in Intune',
        instruction: 'On the NS-PH-0001 phone screen, open <strong>Company Portal</strong> and press <strong>Enrol this device</strong>. Then open the <strong>Intune admin center › Devices</strong> and open <strong>NS-PH-0001</strong>.',
        body: 'Why: Northstar lets only compliant company phones get work mail. Success looks like: NS-PH-0001 is Corporate and Compliant (PIN, encryption and OS current). NS-PH-0002 shows Retired.',
        waitLabel: 'Next Step: Phone enrolled and compliant',
        check: () => hd6BDid('phone-cp-enrolled') && hd6Seen('intune-device:' + HD6_PHONE),
      },
      {
        route: '#/helpdesk/phone', target: '[data-hd-outlook-add], [data-hd-phone-open="outlook"], [data-hd-phone-sync-calendar], [data-hd-phone-sync-contacts]',
        title: 'Add Sam’s work account in Outlook',
        instruction: 'On the phone screen, open <strong>Outlook</strong> and press <strong>Add work account</strong>. Check that <strong>Mail</strong>, <strong>Calendar</strong> and <strong>Contacts</strong> sync are all on. Turn on any that are off.',
        body: 'Why: this is mobile sync of business apps (A+ 1.3). Success looks like: his inbox, calendar and contacts all show up to date.',
        waitLabel: 'Next Step: Outlook synced',
        check: () => {
          const phone = hd6Phone();
          return Boolean(phone) && phone.outlook.account === true && phone.outlook.sync.mail === true && phone.outlook.sync.calendar === true && phone.outlook.sync.contacts === true;
        },
      },
      {
        route: '#/helpdesk/phone', target: '[data-hd-phone-wifi-only], [data-hd-phone-open="onedrive"], [data-hd-data-used]',
        title: 'Set OneDrive to upload on Wi-Fi only',
        instruction: 'Read the status bar. It shows 3.6 GB used of a <strong>5 GB</strong> plan. On the phone screen, open <strong>OneDrive › Settings</strong> and turn on <strong>Upload on Wi-Fi only</strong>.',
        body: 'Why: a data cap limits cellular data, and big uploads belong on Wi-Fi. Success looks like: the setting is on. One more thing to know: a phone hotspot also uses the same cap.',
        waitLabel: 'Next Step: OneDrive on Wi-Fi only',
        check: () => { const phone = hd6Phone(); return Boolean(phone) && phone.onedrive.wifiOnly === true; },
      },
      {
        route: '#/helpdesk/phone', target: '[data-hd-bt-pairing-mode], [data-hd-bt-scan], [data-hd-bt-pin], [data-hd-bt-test], [data-hd-phone-open="bluetooth"]',
        title: 'Pair Sam’s headset',
        instruction: 'On the phone screen, open <strong>Settings › Bluetooth</strong> and turn Bluetooth <strong>on</strong>. Put the <strong>HS-200 Headset</strong> in pairing mode, press <strong>Find devices</strong>, choose <strong>HS-200 Headset</strong> and enter the PIN <strong>0000</strong>. Then press <strong>Test call</strong>.',
        body: 'Why: these are the four pairing steps: on, find, PIN, test (A+ 1.3). Success looks like: the headset shows Connected, and the test call has audio.',
        waitLabel: 'Next Step: Headset paired and tested',
        check: () => hd6BDid('phone-bt-on') && hd6BDid('phone-bt-pairing-mode') && hd6BDid('phone-bt-paired') && hd6BDid('phone-bt-tested'),
      },
      {
        route: '#/helpdesk/m365-admin', target: '[data-hd-cloud-tab="mailboxes"], [data-hd-mailbox="support"], [data-hd-mailbox-add], [data-hd-send-as], [data-hd-full-access]',
        title: 'Add Send as on support@',
        instruction: 'Open <strong>SR-2207</strong> and read the approval from the mailbox owner, Celia Morales. In the <strong>Microsoft 365 admin center</strong>, open <strong>Shared mailboxes › support</strong>. Read <strong>Read and manage (Full Access)</strong>: Sam is already there. Then add Sam under <strong>Send as</strong>.',
        body: 'Why: Full Access opens a mailbox. Send as sends from it (KB-0107). The owner’s approval is on the request. Success looks like: Sam is listed under Send as. The screen says it can take up to an hour.',
        waitLabel: 'Next Step: Send as added',
        check: () => hd2Rule(HD6_R, { serverSeen: 'm365-mailbox:support' }) && hd6BDid('m365-sendas-added'),
      },
      {
        route: '#/helpdesk/ticket', target: '#hd-note-input, .hd-comments, #hd-resolution-code, [data-hd-request]',
        title: 'Close both records',
        instruction: 'On <strong>HD-2197</strong>, <strong>attach KB-0065</strong>, then write a <strong>work note</strong> with Reported:, Tried: and Result:. Post a <strong>comment</strong> to Sam in plain words. Resolve the ticket. On <strong>SR-2207</strong>, write a close note with the same three parts. Then press <strong>Close the request (Closed Complete)</strong>.',
        body: 'Why: each record says what was done for it. Success looks like: both have Reported, Tried and Result, HD-2197 is Resolved and the request is closed. A model note for HD-2197:<br><strong>Reported:</strong> new company phone yesterday; Authenticator was on the old phone, so he can’t approve sign-ins; Teams prompting on his laptop.<br><strong>Tried:</strong> verified in person per KB-0065 (badge matches directory photo, employee ID). The hardware request shows NS-PH-0002 returned and wiped, NS-PH-0001 issued. Service health: no sign-in or Exchange advisory. Required MFA re-registration. Guided Authenticator setup on NS-PH-0001. Enrolled in Company Portal. Set OneDrive to Wi-Fi only (5 GB plan). Paired the HS-200 headset.<br><strong>Result:</strong> test sign-in approved; sign-in log Success with MFA; NS-PH-0001 Compliant; Outlook mail, calendar and contacts syncing; headset test call OK.<br>A model close note for SR-2207: Send as on support@ added for Sam Rivera per owner approval (C. Morales); Full Access was already in place; may take up to an hour to apply.',
        waitLabel: 'Next Step: Both records closed',
        check: () => hd2Rule(HD6_B, { attached: 'KB-0065' }) && hd2Rule(HD6_B, { note: true }) && hd2Rule(HD6_B, { comment: true }) && hd2Rule(HD6_B, { status: 'Resolved' })
          && hd2Rule(HD6_R, { note: true }) && hd6RequestClosed(),
      },
      {
        title: 'Finish the lab',
        instruction: 'Check worked. Press <strong>Finish</strong> to send your work to your course page.',
        body: 'Your triage, screens, commands, tickets, notes and comments count once your course page confirms it saved them. There is no score. The optional extension on your course page is not part of this record.',
        finish: { label: 'Finish', href: itsPortalUrl('#/program/it-support/module/8', 'hd-m06') },
      },
    ],
  });

  /* hd-m06-ext: the optional extension of Lab 8.1 (coached set
   * its-06-extension), HD-2101 with its lockout source shown as Tier 2 work.
   * It has no completion token and is not in HD_COACH_TICKET_IDS, so nothing
   * is sent and nothing reaches the lab record. Tier 1 reads the source and
   * hands the ticket on; the fix and the unlock stay with Tier 2. */
  const HD6E_ID = 'HD-2101';
  // Extension step 2: Jordan's identity check. HD-2101 keeps it in its scenario; a
  // verification on the ticket's own console counts too.
  const hd6eVerified = () => {
    const scenario = typeof hdM01 === 'function' ? hdM01() : null;
    return (Boolean(scenario) && scenario.identity === 'callback') || hd2Rule(HD6E_ID, { verified: true });
  };
  hd2ForgetStale('hd-m06-ext', 'its-06-extension');

  MODULE_COACHES.push({
    id: 'hd-m06-ext', module: 8, name: 'Optional extension: a lockout that isn\'t Tier 1\'s', role: 'Tier 1 Help Desk Technician',
    summary: 'Optional, and not part of your lab record. Jordan Bell in Finance gets unlocked and locked again. This time the saved-password fix from the lab does not apply. Find the source, see why it is Tier 2 work, and hand it on with a note. Nothing from this extension is sent to your course page.',
    home: '#/helpdesk/tickets',
    resetState: () => {
      if (typeof hdUseTicketSet === 'function') hdUseTicketSet('its-06-extension');
      // HD-2101 starts open, for the same reason as Lab 8.1's HD-2196.
      if (typeof hdState !== 'undefined' && hdState) { hdState.selectedTicketId = HD6E_ID; hdState.openedTicketId = HD6E_ID; }
    },
    allow: ['#/helpdesk/dashboard', '#/helpdesk/tickets', '#/helpdesk/ticket', '#/helpdesk/windows', '#/helpdesk/powershell', '#/helpdesk/active-directory',
      '#/helpdesk/directory', '#/helpdesk/credential-manager', '#/helpdesk/file-server', '#/helpdesk/knowledge-base'],
    steps: [
      {
        route: '#/helpdesk/ticket', target: 'select[data-hd-field="category"], select[data-hd-field="impact"], select[data-hd-field="urgency"]',
        title: 'Extension: triage Jordan’s lockout',
        instruction: 'Open <strong>Unlocks, then locks again</strong> (HD-2101) from <strong>Tickets</strong>. Set <strong>Category</strong> Access › Account lockout and <strong>Configuration item</strong> jbell. Set <strong>Impact</strong> 2 and <strong>Urgency</strong> 1.',
        body: 'Why: a payroll analyst on a payroll day is a critical role. Success looks like: the priority shows P2. P3 is also accepted.',
        waitLabel: 'Next Step: Triaged',
        check: () => {
          const t = hd2Ticket(HD6E_ID);
          return Boolean(t) && hd6Opened(HD6E_ID) && hd2Triaged(HD6E_ID, 'Access', 'Account lockout', 'jbell', t.priority) && ['P2', 'P3'].includes(t.priority);
        },
      },
      {
        route: '#/helpdesk/ticket', target: '.hd-identity, .hd-verify, [data-hd-evidence], [data-hd-lockout="u-1005"]',
        title: 'Verify Jordan and find the lockout source',
        instruction: 'Verify Jordan with <strong>KB-0024</strong>, the same first moves as in the lab. Then open <strong>Active Directory › Users › Jordan Bell</strong> and press <strong>Lockout details</strong>, then <strong>Show the Tier 2 view</strong>. Back on the ticket, open the evidence card <strong>Tier 2’s view: Task Scheduler on NS-LT-0117</strong>. Then press <strong>Open NS-LT-0117</strong> and open <strong>Credential Manager</strong> there.',
        body: 'Why: same first moves as Part A. Success looks like: the last lockout source is NS-LT-0117, Jordan’s laptop, and the domain controller’s event 4740 names the same computer. The evidence card shows <strong>FinanceReportSync</strong> running as NORTHSTAR\\jbell every 2 minutes, with a stored password last changed 90 days ago. Credential Manager on NS-LT-0117 has no saved entry, so this is not Part A’s cause. Say so in your note.',
        waitLabel: 'Next Step: Source found',
        check: () => hd6eVerified() && hd2Rule(HD6E_ID, { serverSeen: 'ad-lockout:u-1005' }) && hd2Rule(HD6E_ID, { serverSeen: 'lockout-4740:u-1005' })
          && hd2Rule(HD6E_ID, { evidence: 'task-scheduler-ns-lt-0117' })
          && hd2Rule(HD6E_ID, { seen: 'credential-manager', computer: 'NS-LT-0117' }),
      },
      {
        route: '#/helpdesk/ticket', target: '#hd-assignment-group, [data-hd-team], .hd-handoff',
        title: 'Decide who owns the fix',
        instruction: 'Search the knowledge base for <strong>keeps locking</strong> and open <strong>KB-0103</strong>. Tier 1 doesn’t change a scheduled task (KB-0024 step 6, KB-0103). Set <strong>Assignment group</strong> to <strong>Desktop Support (Tier 2)</strong> and assign the ticket. Don’t unlock Jordan yet.',
        body: 'Why: a task’s saved password is Tier 2 work. Success looks like: the ticket is with Desktop Support (Tier 2). Unlock stays for Tier 2 to do after the fix, because an unlock now would only be undone in two minutes.',
        waitLabel: 'Next Step: KB-0103 read, assigned to Tier 2',
        check: () => hd2Rule(HD6E_ID, { kb: 'KB-0103' }) && hd2Rule(HD6E_ID, { group: 'Desktop Support (Tier 2)' }),
      },
      {
        route: '#/helpdesk/ticket', target: '#hd-note-input, .hd-comments, .hd-handoff, [data-hd-handoff]',
        title: 'Hand it on with a note and tell Jordan',
        instruction: '<strong>Attach KB-0103</strong> to HD-2101. Write a <strong>handoff note</strong> with the lines Reported:, Tried:, Result: and Next action:. Then post a <strong>comment</strong> to Jordan in plain words that says who has the ticket and when to expect an update.',
        body: 'Why: hand it on with the evidence so nobody starts again. Success looks like: the note has Reported, Tried, Result and Next action. Jordan is told who has it and when to expect an update.',
        waitLabel: 'Next Step: Handed on, Jordan told',
        check: () => hd2Rule(HD6E_ID, { attached: 'KB-0103' }) && hd2Rule(HD6E_ID, { handoffNote: true }) && hd2Rule(HD6E_ID, { comment: true }),
      },
      {
        title: 'Back to Module 8',
        instruction: 'Extension done. Press <strong>Back to Module 8</strong> to return to your course page.',
        body: 'This extension is optional. Nothing from it is sent to your course page, and it is not part of your lab record.',
        finish: { label: 'Back to Module 8', href: itsPortalUrl('#/program/it-support/module/8') },
      },
    ],
  });

  /* ---------------------------------------------------------- hd-m04 ---- */
  /* Module 9 (key its-04) Lab 9.1, the connectivity checklist (coached set
   * its-04-guided): Part A on HD-2212 (Jonah Pryce, a dead wall jack), Part B
   * on HD-2213 (Farah Qureshi, an intranet whose address moved), Part C on
   * the request SR-2222 (a new starter's laptop joined to the domain).
   * Feedback only, no points. Every check reads saved state (the ticket's
   * console state, the computer's list of screens and lines it has run, the
   * command history), never a tick box, so a step done early passes when it
   * comes up. A typed step passes from the command history on the named
   * computer, in any letter case, with extra valid options; the only other
   * line accepted is Resolve-DnsName for nslookup and Clear-DnsClientCache for
   * ipconfig /flushdns (both earn the same key or action). A step where the
   * order gives the result its meaning also asks for the computer's key after
   * the action it follows. Steps A3, B3 and C3 are screens; their optional
   * PowerShell line earns the same key. The old HD-2104 and HD-2105 coach is
   * gone; a saved run of it starts fresh. */
  const HD4_A = 'HD-2212';
  const HD4_B = 'HD-2213';
  const HD4_R = 'SR-2222';
  const HD4_PC_A = 'NS-WS-0319';
  const HD4_PC_B = 'NS-LT-0415';
  const HD4_PC_R = 'NS-LT-0416';
  const HD4_OU = 'OU=Logistics,OU=Workstations';
  // The ticket the student opened from Tickets. A lookup counts for that
  // ticket only (hdServerPracticeTicket), so the first step of a part waits
  // until its record is open.
  const hd4Opened = (id) => typeof hdState !== 'undefined' && Boolean(hdState) && hdState.openedTicketId === id;
  // Regex sources for hdConsoleRule { typed }: the line, then any options, then the target.
  const hd4Line = (command, target) => `^${command}\\s+(?:\\S+\\s+)*["']?${target}["']?(\\s|$)`;
  const hd4Ping = (target) => hd4Line('ping(\\.exe)?', target);
  const hd4Tracert = (target) => hd4Line('tracert(\\.exe)?', target);
  const hd4Lookup = (target) => hd4Line('(?:nslookup(\\.exe)?|resolve-dnsname)', target);
  const HD4_TESTNET = '^test-netconnection(\\s|$)';
  // A typed line on that computer, and the key it earns on that computer
  // (after an action, when the order matters).
  const hd4Run = (id, computer, typed, key, after) => hd2Rule(id, { typed, computer })
    && hd2Rule(id, after ? { seen: key, computer, after } : { seen: key, computer });
  // The request itself is closed (Closed Complete), the state the instructor
  // sheet reads. Resolving the record alone leaves it Open.
  const hd4RequestClosed = () => {
    const t = hd2Ticket(HD4_R);
    return Boolean(t) && Boolean(t.request) && /^closed/i.test(String(t.request.state || ''));
  };
  hd2ForgetStale('hd-m04', 'its-04-guided');

  MODULE_COACHES.push({
    id: 'hd-m04', module: 9, name: 'Guided Lab: the connectivity checklist', role: 'Tier 1 Help Desk Technician',
    summary: 'Work through the connectivity checklist on two calls and a request. A new starter has no internet at his desk: find out whether it is one person or many, check the link, then the address, the path and the services. A docked laptop can’t open the intranet: find out why. Then join a new starter’s laptop to the domain, in the right place. Feedback only, no score.',
    completionToken: 'hd-m04', home: '#/helpdesk/tickets',
    resetState: () => {
      if (typeof hdUseTicketSet === 'function') hdUseTicketSet('its-04-guided');
      // HD-2212 starts open: the ticket view shows a ticket before one is
      // opened, and lookups count only for an opened ticket.
      if (typeof hdState !== 'undefined' && hdState) { hdState.selectedTicketId = HD4_A; hdState.openedTicketId = HD4_A; }
    },
    allow: ['#/helpdesk/dashboard', '#/helpdesk/tickets', '#/helpdesk/ticket', '#/helpdesk/windows', '#/helpdesk/powershell', '#/helpdesk/settings-network',
      '#/helpdesk/network-closet', '#/helpdesk/change-log', '#/helpdesk/dns', '#/helpdesk/active-directory', '#/helpdesk/settings-about',
      '#/helpdesk/knowledge-base', '#/helpdesk/directory'],
    steps: [
      /* ---- Part A: HD-2212, Jonah Pryce, "No internet at my new desk" ---- */
      {
        route: '#/helpdesk/ticket', target: 'select[data-hd-field="category"], select[data-hd-field="impact"], select[data-hd-field="urgency"]',
        title: 'Part A: triage Jonah’s call',
        instruction: 'Phone call, 08:40. Jonah Pryce says: “Hi, it’s Jonah. I started today in Purchasing. My computer says there’s no internet, it’s got a little globe with a line through it. Facilities set the desk up yesterday. Hannah next to me is fine.” Triage <strong>No internet at my new desk</strong> (HD-2212): <strong>Category</strong> Network › Wired connectivity, <strong>Configuration item</strong> NS-WS-0319, <strong>Contact type</strong> Phone, <strong>Impact</strong> 3 and <strong>Urgency</strong> 1.',
        body: 'Why: One person who can’t work at all: the matrix gives P3. Success looks like: Priority shows <strong>P3</strong>.',
        waitLabel: 'Next Step: Triaged as P3',
        check: () => hd4Opened(HD4_A) && hd2Triaged(HD4_A, 'Network', 'Wired connectivity', HD4_PC_A, 'P3'),
      },
      {
        route: '#/helpdesk/ticket', target: '.hd-chat, .hd-caller',
        title: 'Checklist question 1: one person or many?',
        instruction: 'Find out whether this is one person or many. In the chat on HD-2212, ask Jonah about Hannah, and search the queue for floor 2 tickets.',
        body: 'Why: One-or-many decides everything that follows. Success looks like: Hannah Cole (NS-WS-0318) is working; no other floor 2 tickets. <strong>One person</strong>.',
        waitLabel: 'Next Step: One person, not many',
        check: () => hd2Rule(HD4_A, { chat: ['others'] }),
      },
      {
        route: '#/helpdesk/ticket', target: '[data-hd-machines], [data-hd-tools="settings-network"], .hd-chat',
        title: 'Look at the link first',
        instruction: 'Look at the network link on Jonah’s PC. On HD-2212, press <strong>Open NS-WS-0319</strong>, then open <strong>Settings › Network &amp; internet</strong>. Then ask Jonah whether the light next to the network port is on. <details><summary>Show me the command</summary>Optional, in PowerShell on NS-WS-0319: <code>Get-NetAdapter</code></details>',
        body: 'Why: Physical first. No link means a cable, jack or switch-port problem, not an address problem. Success looks like: <strong>Ethernet: Network cable unplugged.</strong> Jonah: “There’s no light at all”.',
        waitLabel: 'Next Step: No link, no light',
        check: () => hd2Rule(HD4_A, { seen: 'settings-network', computer: HD4_PC_A }) && hd2Rule(HD4_A, { chat: ['light'] }),
      },
      {
        route: '#/helpdesk/ticket', target: '[data-hd-closet-card], [data-hd-closet-open], [data-hd-evidence="jack-2f14"]',
        title: 'Read the network closet',
        instruction: 'Open the <strong>Network closet</strong> card for floor 2 on HD-2212. Find jack <strong>2F-14</strong> and jack <strong>2F-15</strong> (the empty desk beside him). Then go back to the ticket and open Network Operations’ evidence card for 2F-14.',
        body: 'Why: The closet is Network Operations’ room. You read it to know where the fault is and who fixes it. Success looks like: 2F-14 → patch-panel port 2-14 → <strong>Not patched</strong>. 2F-15 → port 2-15 → NS-SW-2F Gi1/0/15, <strong>link light green</strong>, VLAN 10. The evidence card: “Toner probe: 2F-14 is panel port 2-14. Cable tester: pass, wires 1–8. Not patched to the switch”.',
        waitLabel: 'Next Step: Closet and evidence card read',
        check: () => hd2Rule(HD4_A, { serverSeen: 'closet:floor-2' }) && hd2Rule(HD4_A, { evidence: 'jack-2f14' }),
      },
      {
        route: '#/helpdesk/ticket', target: '.hd-chat, .hd-caller',
        title: 'Move Jonah to a known-good jack',
        instruction: 'In the chat on HD-2212, ask Jonah to move his cable from 2F-14 to <strong>2F-15</strong>.',
        body: 'Why: A known-good jack proves the PC and its cable are fine. Success looks like: Settings: <strong>Ethernet: Connected, 1.0 Gbps</strong>.',
        waitLabel: 'Next Step: Cable moved to 2F-15',
        check: () => hd2Rule(HD4_A, { action: 'cable-connected' }),
      },
      {
        route: '#/helpdesk/ticket', target: '[data-hd-machines], #hd-ps-input',
        title: 'Read the address on the PC',
        instruction: 'On NS-WS-0319, open <strong>PowerShell</strong> and show the PC’s address, now that it has a link. <details><summary>Show me the command</summary><code>ipconfig</code></details>',
        body: 'Why: Link first, then the address. Success looks like: <code>Autoconfiguration IPv4 Address . . : 169.254.33.10</code>, no default gateway. <strong>APIPA</strong>: it gave itself an address while it was unplugged.',
        waitLabel: 'Next Step: APIPA address read',
        check: () => hd4Run(HD4_A, HD4_PC_A, '^ipconfig(\\.exe)?$', 'ipconfig', 'cable-connected'),
      },
      {
        route: '#/helpdesk/powershell', target: '#hd-ps-input',
        title: 'Read everything about the adapter',
        instruction: 'On NS-WS-0319, read everything about the adapter, including its hardware ID. <details><summary>Show me the command</summary><code>ipconfig /all</code></details>',
        body: 'Why: Read everything about the adapter, including its hardware ID. Success looks like: DHCP Enabled <strong>Yes</strong> · Physical Address <strong>3C-52-82-4A-19-07</strong> · no DHCP server listed.',
        waitLabel: 'Next Step: Every adapter detail read on NS-WS-0319',
        check: () => hd2Rule(HD4_A, { typed: '^ipconfig(\\.exe)?\\s+/all(\\s|$)', computer: HD4_PC_A }),
      },
      {
        route: '#/helpdesk/powershell', target: '#hd-ps-input',
        title: 'Ask DHCP for a fresh address',
        instruction: 'On NS-WS-0319, let go of the PC’s old address, then ask DHCP for a new one now that there is a link. Then open <strong>Settings › Network &amp; internet › Ethernet › Hardware properties</strong>. <details><summary>Show me the command</summary><code>ipconfig /release</code> then <code>ipconfig /renew</code></details>',
        body: 'Why: The client-side fix: ask DHCP for a fresh address now there’s a link. Then see what a healthy Northstar PC looks like. Success looks like: IPv4 <strong>10.20.10.141</strong>, mask 255.255.255.0, gateway <strong>10.20.10.1</strong>, DHCP server 10.20.0.20, DNS 10.20.0.10 and 10.20.0.11, lease expires in 8 days. Hardware properties: <strong>IP assignment: Automatic (DHCP) · DNS server assignment: Automatic (DHCP)</strong>.',
        waitLabel: 'Next Step: Address renewed, Hardware properties read',
        check: () => hd2Rule(HD4_A, { actionsAfter: { after: 'ip-release', action: 'ip-renew' } })
          && hd2Rule(HD4_A, { seen: 'net-adapter:Ethernet', computer: HD4_PC_A, after: 'ip-renew' }),
      },
      {
        route: '#/helpdesk/powershell', target: '#hd-ps-input',
        title: 'Test the path: gateway, a company server, the way out',
        instruction: 'On NS-WS-0319, test the path in three steps: the gateway, then a company server, then the way out to the internet. <details><summary>Show me the command</summary><code>ping 10.20.10.1</code>, then <code>ping files.northstar.example</code>, then <code>tracert www.example.com</code></details>',
        body: 'Why: Checklist question 4: the gateway, then a company server, then the way out. Success looks like: Replies in 1–2 ms; <code>files</code> is <strong>10.20.0.30</strong> and replies; tracert lists 10.20.10.1, then 10.20.255.1 (<code>nsfw01</code>, the firewall), then 10.20.255.2 (<code>nsrtr-fiber</code>), then the provider’s hops.',
        waitLabel: 'Next Step: Gateway, files and the way out tested',
        check: () => hd4Run(HD4_A, HD4_PC_A, hd4Ping('10\\.20\\.10\\.1'), 'ping:10.20.10.1', 'ip-renew')
          && hd4Run(HD4_A, HD4_PC_A, hd4Ping('files(\\.northstar\\.example)?'), 'ping:files.northstar.example', 'ip-renew')
          && hd4Run(HD4_A, HD4_PC_A, hd4Tracert('www\\.example\\.com'), 'tracert:www.example.com', 'ip-renew'),
      },
      {
        route: '#/helpdesk/powershell', target: '#hd-ps-input',
        title: 'Check the services: file shares and DNS',
        instruction: 'On NS-WS-0319, check that the file share service and the DNS service answer. The port number says which service. <details><summary>Show me the command</summary><code>Test-NetConnection files.northstar.example -Port 445</code>, then <code>Test-NetConnection dc01.northstar.example -Port 53</code></details>',
        body: 'Why: Checklist question 6: are the services there? The port number says which service (Table 8). Success looks like: Both <strong>TcpTestSucceeded : True</strong>. File shares (445) and DNS (53) answer.',
        waitLabel: 'Next Step: Ports 445 and 53 tested',
        check: () => hd4Run(HD4_A, HD4_PC_A, HD4_TESTNET, 'port:files.northstar.example:445', 'ip-renew')
          && hd4Run(HD4_A, HD4_PC_A, HD4_TESTNET, 'port:dc01.northstar.example:53', 'ip-renew'),
      },
      {
        route: '#/helpdesk/ticket', target: '.hd-team-messages, #hd-note-input, .hd-comments, #hd-resolution-code',
        title: 'Hand 2F-14 to Network Operations, then close the ticket',
        instruction: 'On HD-2212, use <strong>Message another team</strong> to tell <strong>Network Operations</strong> about 2F-14. Then write the <strong>work note</strong> with the lines Reported:, Tried:, Result: and Next action:, post a <strong>comment</strong> to Jonah in plain words, set the resolution code to <strong>Workaround provided</strong> and resolve the ticket.',
        body: 'Why: You fixed Jonah; the jack is theirs to patch. The note is how the next person knows. Success looks like: The message names the jack, the panel port and that Jonah is on 2F-15. Note has Reported / Tried / Result / Next action; comment is plain language; ticket <strong>Resolved</strong>. A model note:<br><strong>Reported:</strong> New starter, first day; desk PC NS-WS-0319 shows no internet; the colleague beside him is fine.<br><strong>Tried:</strong> One user only (H. Cole working; no other floor 2 tickets). Ethernet “Network cable unplugged”, no link light. Closet: jack 2F-14 → panel port 2-14 not patched (Network Operations’ toner and cable test: cable passes). Moved the cable to jack 2F-15: link up at 1 Gbps. Still APIPA (169.254.33.10); ipconfig /release and /renew: 10.20.10.141, gateway 10.20.10.1, DNS 10.20.0.10/11, DHCP. Gateway and files reply; tracert out through nsfw01 and the fiber router; files:445 and dc01:53 answer.<br><strong>Result:</strong> Jonah working from jack 2F-15.<br><strong>Next action:</strong> Network Operations to patch jack 2F-14 (port 2-14 to NS-SW-2F); Service Desk to tell Jonah when he can move back.<br>A model comment: Hi Jonah, welcome! Your computer and its cable are fine. The network socket at your desk hasn’t been connected in our network room yet, so we’ve moved you to the socket at the desk beside you, and everything’s working. Our network team will connect yours, and we’ll let you know when you can plug back in. – Riley',
        waitLabel: 'Next Step: HD-2212 messaged, noted and resolved',
        check: () => hd2Rule(HD4_A, { teamMessage: 'netops-2f14' }) && hd2Rule(HD4_A, { note: true }) && hd2Rule(HD4_A, { comment: true })
          && hd2Rule(HD4_A, { code: 'Workaround provided' }) && hd2Rule(HD4_A, { status: 'Resolved' }),
      },
      /* ---- Part B: HD-2213, Farah Qureshi, "The intranet won't open" ---- */
      {
        route: '#/helpdesk/ticket', target: 'select[data-hd-field="category"], select[data-hd-field="impact"], select[data-hd-field="urgency"]',
        title: 'Part B: triage Farah’s chat',
        instruction: 'Open <strong>The intranet won’t open</strong> (HD-2213) from <strong>Tickets</strong>. Chat, 09:05. Farah Qureshi in Marketing says: “Hi, the intranet won’t open for me. It says ‘This site can’t be reached’. Leah next to me can open it fine. I had it open first thing this morning, around 8:10, then it just stopped.” Triage it: <strong>Category</strong> Network › Website or intranet access, <strong>Configuration item</strong> NS-LT-0415, <strong>Contact type</strong> Chat, <strong>Impact</strong> 3 and <strong>Urgency</strong> 2.',
        body: 'Why: One person; everything except the intranet works. Success looks like: Priority shows <strong>P4</strong>.',
        waitLabel: 'Next Step: HD-2213 opened, triaged as P4',
        check: () => hd4Opened(HD4_B) && hd2Triaged(HD4_B, 'Network', 'Website or intranet access', HD4_PC_B, 'P4'),
      },
      {
        route: '#/helpdesk/ticket', target: '[data-hd-machines], #hd-ps-input',
        title: 'Read every adapter on the laptop',
        instruction: 'On HD-2213, press <strong>Open NS-LT-0415</strong>, open <strong>PowerShell</strong> there and read every adapter on the laptop. <details><summary>Show me the command</summary><code>ipconfig /all</code></details>',
        body: 'Why: Read <strong>every</strong> adapter. A docked laptop has two, and Windows uses the wired one first. Success looks like: <strong>Ethernet 2 (Dock USB Ethernet):</strong> DHCP Yes, 10.20.10.177, gateway 10.20.10.1, DNS 10.20.0.10/11. <strong>Wi-Fi:</strong> Northstar-Corp, DHCP Yes, 10.20.10.178, same gateway and DNS. Both healthy.',
        waitLabel: 'Next Step: Both adapters read on NS-LT-0415',
        check: () => hd2Rule(HD4_B, { typed: '^ipconfig(\\.exe)?\\s+/all(\\s|$)', computer: HD4_PC_B }),
      },
      {
        route: '#/helpdesk/ticket', target: '[data-hd-machines], [data-hd-tools="settings-network"], [data-hd-net-wifi]',
        title: 'Learn what good Wi-Fi looks like',
        instruction: 'On NS-LT-0415, open <strong>Settings › Network &amp; internet</strong>, then the Wi-Fi network <strong>Northstar-Corp › Properties</strong>. <details><summary>Show me the command</summary>Optional, in PowerShell on NS-LT-0415: <code>netsh wlan show interfaces</code></details>',
        body: 'Why: Learn what good Wi-Fi looks like before you meet bad Wi-Fi. Success looks like: Protocol Wi-Fi 6 (802.11ax) · Security <strong>WPA3-Enterprise</strong> · Band <strong>5 GHz</strong> · Channel 44 · Link speed 600 Mbps.',
        waitLabel: 'Next Step: Wi-Fi properties read',
        check: () => hd2Rule(HD4_B, { seen: 'wifi-properties', computer: HD4_PC_B }),
      },
      {
        route: '#/helpdesk/powershell', target: '#hd-ps-input',
        title: 'Does the name reach a server?',
        instruction: 'On NS-LT-0415, test whether the intranet’s name reaches a server. <details><summary>Show me the command</summary><code>ping intranet.northstar.example</code></details>',
        body: 'Why: Does the name reach a server? Success looks like: <code>Pinging intranet.northstar.example [10.20.0.45]</code> … <strong>Request timed out</strong> four times.',
        waitLabel: 'Next Step: The name tested on NS-LT-0415',
        check: () => hd4Run(HD4_B, HD4_PC_B, hd4Ping('intranet(\\.northstar\\.example)?'), 'ping:intranet.northstar.example'),
      },
      {
        route: '#/helpdesk/powershell', target: '#hd-ps-input',
        title: 'Ask the DNS server directly',
        instruction: 'On NS-LT-0415, ask the DNS server for the intranet’s address, instead of using what the PC remembers. <details><summary>Show me the command</summary><code>nslookup intranet.northstar.example</code> (or <code>Resolve-DnsName intranet.northstar.example</code>)</details>',
        body: 'Why: <code>nslookup</code> asks the DNS server directly; <code>ping</code> used what the PC remembered. Success looks like: Server <code>dc01.northstar.example</code> (10.20.0.10). Name <code>intranet.northstar.example</code>, Address <strong>10.20.0.50</strong>. <strong>Two different addresses</strong> for one name.',
        waitLabel: 'Next Step: The DNS server asked directly',
        check: () => hd4Run(HD4_B, HD4_PC_B, hd4Lookup('intranet(\\.northstar\\.example)?'), 'nslookup:intranet.northstar.example'),
      },
      {
        route: '#/helpdesk/change-log', target: '[data-hd-change-log], [data-hd-change-detail], [data-hd-dns]',
        title: 'Find the change that lines up',
        instruction: 'Open the <strong>Change log</strong> and open <strong>CHG-7802</strong>. Then open the <strong>DNS</strong> screen and read the <code>intranet</code> record. If you opened another record, open HD-2213 again first: the lookup counts for the ticket that is open.',
        body: 'Why: A change that lines up with the symptom is the fastest evidence there is (Module 07). Success looks like: CHG-7802, today <strong>08:30</strong>: “Move the intranet to NS-APP01; DNS A record intranet → 10.20.0.50 (was 10.20.0.45)”, J. Keller, Completed. DNS: <code>intranet</code> A 10.20.0.50, TTL 3600. Farah opened it at 08:10, before the move, so her PC kept the old answer for up to an hour.',
        waitLabel: 'Next Step: CHG-7802 and the intranet record read',
        // The DNS screen's own key (dns-zone) keeps the nslookup step from
        // passing the read of the screen.
        check: () => hd2Rule(HD4_B, { serverSeen: 'change:CHG-7802' }) && hd2Rule(HD4_B, { serverSeen: 'dns-zone' })
          && hd2Rule(HD4_B, { serverSeen: 'dns-record:intranet:A' }),
      },
      {
        route: '#/helpdesk/powershell', target: '#hd-ps-input, .hd-chat',
        title: 'Clear the old answer, then prove it works',
        instruction: 'On NS-LT-0415, clear the PC’s remembered answer, then prove the name and the web service both work. Then, in the chat on HD-2213, ask Farah to reload the page. <details><summary>Show me the command</summary><code>ipconfig /flushdns</code>, then <code>ping intranet.northstar.example</code>, then <code>Test-NetConnection intranet.northstar.example -Port 443</code> (<code>Clear-DnsClientCache</code> clears the same answer)</details>',
        body: 'Why: Clear the old answer, then prove the name and the web service both work. Success looks like: <code>Successfully flushed the DNS Resolver Cache.</code> · ping <code>[10.20.0.50]</code> replies · <strong>TcpTestSucceeded : True</strong> · Farah: “It’s back”.',
        waitLabel: 'Next Step: Cache cleared, intranet answers, Farah confirms',
        check: () => hd2Rule(HD4_B, { action: 'dns-flush' })
          && hd4Run(HD4_B, HD4_PC_B, hd4Ping('intranet(\\.northstar\\.example)?'), 'ping:intranet.northstar.example', 'dns-flush')
          && hd4Run(HD4_B, HD4_PC_B, HD4_TESTNET, 'port:intranet.northstar.example:443', 'dns-flush')
          && hd2Rule(HD4_B, { confirmed: 'reload' }),
      },
      {
        route: '#/helpdesk/ticket', target: '#hd-note-input, .hd-comments, #hd-resolution-code',
        title: 'Write the note and the plain-language reply, then resolve',
        instruction: 'On HD-2213, write the <strong>work note</strong> with the lines Reported:, Tried: and Result:. Post a <strong>comment</strong> to Farah in plain words, with no technical terms in it. Then resolve the ticket.',
        body: 'Why: The customer comment is checked for jargon. Success looks like: No “DNS”, “cache”, “flush”, “IP”, “10.20” or “CHG” in the comment. Ticket <strong>Resolved</strong>. A model note:<br><strong>Reported:</strong> Intranet “This site can’t be reached” since about 08:10 visit; colleague can open it.<br><strong>Tried:</strong> Dock Ethernet and Wi-Fi both DHCP, company DNS, healthy; Wi-Fi 5 GHz WPA3-Enterprise. ping intranet → 10.20.0.45, timed out; nslookup intranet → 10.20.0.50. CHG-7802 (08:30 today) moved the intranet to 10.20.0.50; the PC had cached the old address. ipconfig /flushdns: ping intranet → 10.20.0.50 replies; intranet:443 answers.<br><strong>Result:</strong> Farah confirmed the intranet opens.<br>A model comment: Hi Farah, the intranet is working for you again. It moved to a new server at 8:30 this morning, and your computer was still trying the old one because you’d opened it just before the move. We’ve cleared that, so it goes to the new server now. Anyone else who sees this can simply wait an hour or call us. – Riley',
        waitLabel: 'Next Step: HD-2213 noted and resolved',
        check: () => hd2Rule(HD4_B, { note: true }) && hd2Rule(HD4_B, { comment: true }) && hd2Rule(HD4_B, { status: 'Resolved' }),
      },
      /* ---- Part C: SR-2222, a new starter's laptop for Kenji Watanabe ---- */
      {
        route: '#/helpdesk/ticket', target: '[data-hd-request], .hd-kb-search, .hd-related-knowledge, [data-hd-kb-attach]',
        title: 'Part C: read the request and KB-0097',
        instruction: 'Open <strong>RITM0010164</strong> (SR-2222) from <strong>Tickets</strong>. Monica Hall (Logistics Manager) asked yesterday: “New starter laptop setup. Kenji Watanabe, Logistics Planner, starts tomorrow. Laptop NS-LT-0416 is on the Service Desk build bench.” Read who requested it, who approved it and who it is for. Then open <strong>KB-0097</strong> in the knowledge base and attach it to the request.',
        body: 'Why: A request is planned work, and its approval is what lets you do it (Module 2). Success looks like: Requested by Monica Hall · Approved · Requested for Kenji Watanabe · <strong>no SLA bar</strong>.',
        waitLabel: 'Next Step: SR-2222 opened, KB-0097 read and attached',
        check: () => hd4Opened(HD4_R) && hd2Rule(HD4_R, { kb: 'KB-0097' }) && hd2Rule(HD4_R, { attached: 'KB-0097' }),
      },
      {
        route: '#/helpdesk/ticket', target: '[data-hd-machines], #hd-ps-input',
        title: 'Check the bench laptop can find the domain',
        instruction: 'On SR-2222, press <strong>Open NS-LT-0416</strong> (wired, at the bench) and open <strong>PowerShell</strong> there. Read the laptop’s network settings, then ask the DNS server where the domain’s controllers are. <details><summary>Show me the command</summary><code>ipconfig /all</code>, then <code>nslookup northstar.example</code> (or <code>Resolve-DnsName northstar.example</code>)</details>',
        body: 'Why: A join needs company DNS first: it’s how the laptop finds a domain controller. Success looks like: Ethernet: DHCP Yes, 10.20.10.203, DNS <strong>10.20.0.10</strong> and 10.20.0.11. <code>northstar.example</code> → <strong>10.20.0.10, 10.20.0.11</strong> (the domain controllers).',
        waitLabel: 'Next Step: Settings and domain controllers read',
        check: () => hd2Rule(HD4_R, { typed: '^ipconfig(\\.exe)?\\s+/all(\\s|$)', computer: HD4_PC_R })
          && hd4Run(HD4_R, HD4_PC_R, hd4Lookup('northstar\\.example'), 'nslookup:northstar.example'),
      },
      {
        route: '#/helpdesk/settings-about', target: '[data-hd-tools="settings-about"], [data-hd-join], [data-hd-join-start]',
        title: 'Join the laptop to the domain',
        instruction: 'On NS-LT-0416, open <strong>Settings › System › About › Domain or workgroup › Change</strong>. Join the domain <code>northstar.example</code>, choose <strong>Use the provisioning account (KB-0097)</strong>, pick the OU <strong>OU=Logistics,OU=Workstations</strong>, then restart. Pick the OU with care: a laptop joins once. If you chose the wrong OU, open the <strong>Dashboard</strong>, press <strong>Reset shift</strong>, then start the lab again from your course page. <details><summary>Show me the command</summary>Optional, in PowerShell on NS-LT-0416: <code>Add-Computer -DomainName northstar.example -OUPath "OU=Logistics,OU=Workstations" -Restart</code></details>',
        body: 'Why: The right account and the right place. A computer in the wrong OU gets the wrong policies (Module 07). Success looks like: “Welcome to the northstar.example domain.” The laptop restarts.',
        waitLabel: 'Next Step: Joined into Logistics, restarted',
        check: () => hd2Did(HD4_R, 'domain-join', (a) => a.ou === HD4_OU) && hd2Rule(HD4_R, { actionsAfter: { after: 'domain-join', action: 'restart' } }),
      },
      {
        route: '#/helpdesk/powershell', target: '#hd-ps-input, [data-hd-ad-computer], #hd-note-input',
        title: 'Check the policies arrived and the object is in the right place, then close the request',
        instruction: 'On NS-LT-0416, bring in the company’s policies. <details><summary>Show me the command</summary><code>gpupdate /force</code></details> Then open <strong>Active Directory › Computers</strong>, find <strong>NS-LT-0416</strong> and press <strong>Open</strong> on its row. Then, on SR-2222, write the <strong>work note</strong> with the lines Reported:, Tried: and Result:, and close the request (<strong>Closed Complete</strong>). If you opened another record, open SR-2222 again first: the lookup counts for the ticket that is open.',
        body: 'Why: Prove the policies arrived and the object is where it should be. Success looks like: <code>Computer Policy update has completed successfully.</code> · NS-LT-0416 in <strong>OU=Logistics,OU=Workstations</strong> · RITM <strong>Closed Complete</strong>. A model note: Reported: approved new starter laptop setup for K. Watanabe (Logistics), starts tomorrow. Tried: NS-LT-0416 wired on the build bench, DHCP, company DNS; nslookup northstar.example returned both domain controllers; joined northstar.example with the provisioning account per KB-0097 into OU=Logistics,OU=Workstations; restarted; gpupdate /force completed. Result: NS-LT-0416 in OU=Logistics,OU=Workstations; ready for Kenji tomorrow.',
        waitLabel: 'Next Step: Policies applied, object found, request closed',
        check: () => hd4Run(HD4_R, HD4_PC_R, '^gpupdate(\\.exe)?\\s+/force(\\s|$)', 'gpupdate', 'restart')
          && hd2Rule(HD4_R, { serverSeen: 'ad-computer:' + HD4_PC_R }) && hd2Rule(HD4_R, { note: true }) && hd4RequestClosed(),
      },
      {
        title: 'Finish the lab',
        instruction: 'Check worked. Press <strong>Finish</strong> to send your work to your course page.',
        body: 'Your triage, screens, commands, tickets, notes and comments count once your course page confirms it saved them. There is no score.',
        finish: { label: 'Finish', href: itsPortalUrl('#/program/it-support/module/9', 'hd-m04') },
      },
    ],
  });

  /* ------------------------------------------------------ hd-m08..hd-m11 -
   * (hd-m03, hd-m04, hd-m07, hd-m05 and hd-m06 have their own steps above.)
   * Modules 3-9 each work one or two real tickets through the same generic
   * evidence/path/diagnose/note/resolve flow hd-m01/hd-m02 already proved
   * out — reused here via hdTicketFlowSteps() instead of hand-duplicating
   * six step objects per ticket. Modules with 3+ assigned tickets guide a
   * representative subset and leave the rest reachable for free practice,
   * matching hd-m01's own precedent (it guides 1 of its 4 scoped tickets).
   * Modules 10 and 11 see the full, unfiltered queue (no ticket filtering)
   * since their content — ticket structure/prioritization, documentation —
   * applies across the whole queue, not one ticket; they get bespoke,
   * shorter step lists instead of the six-step resolve flow. */

  function hdResetTicketScope(ticketIds) {
    if (typeof hdState === 'undefined' || typeof window.hdFreshState !== 'function') return;
    const fresh = window.hdFreshState();
    hdState.tickets = ticketIds ? fresh.tickets.filter((t) => ticketIds.includes(t.id)) : fresh.tickets;
    // Stale filters from a previous coach session (queueFilter/priorityFilter
    // persist in the same localStorage blob) can hide a target ticket's row
    // entirely, breaking the tr[onclick*="..."] open-ticket step — always
    // reset both, not just the ticket list.
    hdState.queueFilter = 'Open';
    hdState.priorityFilter = 'All';
    // Never pre-select a ticket: with as few as 2 scoped tickets, the fresh
    // shuffle has a real chance of already selecting the first one the coach
    // asks the student to open themselves (see hd2Reset's identical fix).
    hdState.selectedTicketId = null;
    if (typeof hdSave === 'function') hdSave();
    // The page was drawn from the old tickets before the coach booted.
    if (typeof render === 'function') render();
  }

  /* One ticket's worth of the standard six-step flow. finalStatus is
   * 'Resolved' or 'Escalated' — hdResolveTicket() routes Security Incident
   * tickets and any ticket whose escalationCriteria contains an entry
   * starting with 'Always' to 'Escalated' instead of 'Resolved'; the coach's
   * last-step check must match whichever this specific ticket actually
   * produces. isLast adds the coach's finish button to this ticket's resolve
   * step. */
  function hdTicketFlowSteps(ticketId, opts) {
    const finalStatus = opts.finalStatus || 'Resolved';
    const escalating = finalStatus === 'Escalated';
    const steps = [
      {
        route: '#/helpdesk/tickets',
        target: `tr[onclick*="${ticketId}"]`,
        require: true,
        title: opts.opening ? 'Open your first ticket' : 'Open the next ticket',
        instruction: `Next Step: open <strong>${ticketId}</strong>.`,
        body: opts.openBody,
        waitLabel: 'Next Step: Opened the ticket',
        nudge: `Click the ${ticketId} row to open it.`,
        check: () => typeof hdState !== 'undefined' && hdState.selectedTicketId === ticketId,
      },
      {
        route: '#/helpdesk/ticket',
        target: '.hd-evidence',
        title: 'Check the evidence',
        instruction: 'Read the log before you guess.',
        body: opts.evidenceBody,
        continueLabel: 'Got it',
      },
      {
        target: '.hd-path',
        require: true,
        title: 'Work the troubleshooting path',
        instruction: 'Check off each step as you work through it.',
        body: opts.pathBody,
        waitLabel: 'Next Step: Checked a troubleshooting step',
        nudge: 'Check at least one box in the troubleshooting path.',
        check: () => document.querySelectorAll('.hd-path input:checked').length > 0,
      },
      {
        target: '.hd-diagnosis-row',
        require: true,
        title: 'Choose your diagnosis',
        instruction: 'Select the cause the evidence actually supports, then click Check diagnosis.',
        body: opts.diagnosisBody,
        waitLabel: 'Next Step: Diagnosis confirmed',
        nudge: 'Pick a cause and click Check diagnosis — if it’s not supported by the evidence, you’ll be told to recheck.',
        check: () => typeof hdCurrentTicket === 'function' && hdCurrentTicket() && hdCurrentTicket().id === ticketId && hdCurrentTicket().diagnosisCorrect === true,
      },
      {
        target: '#hd-note-input, #hd-note-input ~ button',
        require: true,
        title: 'Document what you found',
        instruction: 'Write a work note: what you checked, what you found, what you’re about to do.',
        body: opts.noteBody,
        waitLabel: 'Next Step: Note added',
        nudge: 'Type a note and click Add work note.',
        check: () => typeof hdCurrentTicket === 'function' && hdCurrentTicket() && hdCurrentTicket().id === ticketId && hdCurrentTicket().notes.length > 0,
      },
      {
        target: '.hd-control-stack .btn-primary',
        require: true,
        title: escalating ? 'Escalate this one' : 'Close the loop',
        instruction: escalating ? 'This one is outside what a technician resolves alone — escalate it.' : 'Resolve the ticket.',
        body: opts.resolveBody,
        waitLabel: escalating ? 'Next Step: Ticket escalated' : 'Next Step: Ticket resolved',
        nudge: `Click ${escalating ? 'Warm escalate' : 'Resolve / escalate'} to close this ticket out.`,
        check: () => typeof hdCurrentTicket === 'function' && hdCurrentTicket() && hdCurrentTicket().id === ticketId && hdCurrentTicket().status === finalStatus,
      },
    ];
    if (opts.isLast) steps[steps.length - 1].finish = { label: 'Finish', href: opts.finishHref };
    return steps;
  }

  function hdRegisterSimpleCoach(id, moduleNumber, name, summary, ticketIds, allowExtra) {
    MODULE_COACHES.push({
      id, module: moduleNumber, name, role: 'Tier 1 Help Desk Technician', summary,
      completionToken: id, home: '#/helpdesk/tickets',
      resetState: () => hdResetTicketScope(ticketIds),
      allow: ['#/helpdesk/dashboard', '#/helpdesk/tickets', '#/helpdesk/ticket'].concat(allowExtra || []),
      steps: null, // set by caller after construction
    });
    return MODULE_COACHES[MODULE_COACHES.length - 1];
  }

  /* hd-m08 — Module 10 (key its-08): Troubleshooting Methodology & Diagnostics. Two
   * tickets, both genuinely unfamiliar-shaped problems worked with the
   * five-step method rather than a memorized fix. */
  hdRegisterSimpleCoach('hd-m08', 10, 'Two Problems You Haven’t Seen Before', 'Work two real unfamiliar-shaped tickets end to end — a broken domain trust and a BitLocker recovery — applying the troubleshooting method itself, not a memorized answer.', ['HD-2110', 'HD-2111']).steps =
    hdTicketFlowSteps('HD-2110', {
      opening: true, isLast: false, finalStatus: 'Resolved',
      openBody: 'Sofia’s workstation says the trust relationship with the domain failed — right after a VM snapshot was restored yesterday.',
      evidenceBody: 'A failed secure-channel test alongside a recent snapshot restore is the clue — snapshots roll back more than just files.',
      pathBody: 'Validating DNS, time, and the computer object’s state comes before attempting any repair.',
      diagnosisBody: 'A snapshot restored right before the failure points at a rolled-back machine-account password, not a user password or DNS issue.',
      noteBody: 'Name the snapshot-timing evidence, the approved repair procedure you used, and that domain sign-in was verified afterward.',
      resolveBody: 'Resolving is gated on your diagnosis actually being correct.',
    }).concat(hdTicketFlowSteps('HD-2111', {
      opening: false, isLast: true, finalStatus: 'Resolved', finishHref: itsPortalUrl('#/program/it-support/module/10', 'hd-m08'),
      openBody: 'Dina’s laptop is asking for a BitLocker recovery key right after an overnight firmware update.',
      evidenceBody: 'A completed, approved firmware change logged overnight, right before the recovery prompt, is the clue — not tampering.',
      pathBody: 'Verifying the user and device identity, and matching the recovery key ID, comes before disclosing anything.',
      diagnosisBody: 'An approved firmware change immediately before the prompt points at expected TPM measurement changes, not unauthorized tampering.',
      noteBody: 'Name the firmware-change evidence, that identity was verified before disclosure, and that protection status was confirmed afterward.',
      resolveBody: 'Resolving is gated on your diagnosis actually being correct.',
    }));

  /* hd-m09 — Module 11 (key its-09): Security Fundamentals for IT Support. Two Security
   * Incident tickets — both correctly end in 'Escalated', not 'Resolved'. */
  hdRegisterSimpleCoach('hd-m09', 11, 'Two Calls You Escalate, Not Fix', 'Work two real security-incident tickets end to end — a credential-phishing report and a malware alert — recognizing why L1 escalates rather than resolves.', ['SEC-2114', 'SEC-2115']).steps =
    hdTicketFlowSteps('SEC-2114', {
      opening: true, isLast: false, finalStatus: 'Escalated',
      openBody: 'Luis clicked a shipping link and signed in again — he’s asking if that was real. Treat it as a real possibility, not reassurance.',
      evidenceBody: 'A lookalike domain in the browser history, alongside an unfamiliar sign-in pending review, is the clue.',
      pathBody: 'Preserving the email, URL, and timing comes first — and protecting the account within procedure, not guessing at a fix.',
      diagnosisBody: 'A lookalike domain plus an unfamiliar sign-in together point at credential phishing, not a benign vendor portal.',
      noteBody: 'Name the lookalike-domain evidence, that the account was protected within procedure, and that this was escalated immediately.',
      resolveBody: 'This is a possible credential compromise — outside what L1 resolves alone. Escalate it, don’t declare the endpoint safe yourself.',
    }).concat(hdTicketFlowSteps('SEC-2115', {
      opening: false, isLast: true, finalStatus: 'Escalated', finishHref: itsPortalUrl('#/program/it-support/module/11', 'hd-m09'),
      openBody: 'A high-confidence EDR malware alert on a user’s laptop, with a report of browser pop-ups. Security needs help-desk coordination, not a solo fix.',
      evidenceBody: 'A suspicious PowerShell process launched as a child of the browser is the clue — that’s not a normal browser behavior.',
      pathBody: 'Do not delete evidence — confirming the user and device comes first, before any containment step.',
      diagnosisBody: 'A browser-launched, encoded PowerShell command points at a malicious extension, not a false positive.',
      noteBody: 'Name the PowerShell evidence, what containment steps were coordinated, and that this was a warm handoff to security.',
      resolveBody: 'This is a confirmed malware indicator — outside what L1 resolves alone. Escalate it as a warm handoff to security.',
    }));

  /* hd-m10 — Module 2 (key its-10): Lab 2.1, the practice queue. Six tickets,
   * ten steps, then Finish. Every check reads the saved ticket state, so it
   * passes whatever order the student works in. Feedback only, no points. */
  const HD10_ID = { sam: 'HD-2158', noah: 'HD-2159', luis: 'HD-2160', amir: 'SR-2161', priya: 'HD-2162', maya: 'SEC-2163' };
  const hd10Ticket = (id) => (typeof hdTicketById === 'function' ? hdTicketById(id) : null);
  const hd10Progress = (id) => (typeof hdConsoleProgress === 'function' ? hdConsoleProgress(id) : null);
  const hd10State = (t) => (t && typeof hdConsoleState === 'function' ? hdConsoleState(t) : null);
  const hd10Mine = (list) => (Array.isArray(list) ? list : []).filter((item) => item && item.author === 'Riley Morgan');
  const hd10Arrived = (t) => { const s = hd10State(t); return Boolean(s) && Array.isArray(s.arrived) && s.arrived.some((a) => a && a.id === 'priya-reply'); };
  const hd10Empty = (v) => !v || (Array.isArray(v) && v.length === 0);
  // A saved run of the old four-step hd-m10 coach (before 2026-11-19) points
  // at steps for a queue this shift doesn't hold, and ui/coach.js would
  // resume it at the same step number. When the shift isn't the guided queue,
  // forget it, so the next launch starts the new lab fresh (resetState).
  // Only the coached lab's shift: a practice set or a Prove It has its own.
  (function hd10ForgetOldWalkthrough() {
    if ((typeof HD_PRACTICE_SET !== 'undefined' && HD_PRACTICE_SET) || (typeof HD_PROVE !== 'undefined' && HD_PROVE)) return;
    if (typeof hdState === 'undefined' || !hdState || hdState.ticketSet === 'its-10-guided') return;
    const stale = (raw) => { try { const saved = JSON.parse(raw || 'null'); return Boolean(saved && saved.id === 'hd-m10'); } catch { return false; } };
    try { if (stale(localStorage.getItem('mnt.coach.resume'))) localStorage.removeItem('mnt.coach.resume'); } catch { /* storage blocked */ }
    try { if (stale(sessionStorage.getItem('mnt.coach.state'))) sessionStorage.removeItem('mnt.coach.state'); } catch { /* storage blocked */ }
  }());
  MODULE_COACHES.push({
    id: 'hd-m10', module: 2, name: 'Guided Lab: queue shift', role: 'Tier 1 Help Desk Technician',
    summary: 'Work a six-ticket morning queue: add the columns, set impact and urgency on every ticket, convert a request, link two tickets about one outage, put the queue in order, send a security ticket to the SOC, pause a ticket while you wait on the caller, attach a knowledge article, write for two audiences, and resolve a ticket with a knowledge draft.',
    completionToken: 'hd-m10', home: '#/helpdesk/tickets',
    resetState: () => { if (typeof hdUseTicketSet === 'function') hdUseTicketSet('its-10-guided'); },
    allow: ['#/helpdesk/dashboard', '#/helpdesk/tickets', '#/helpdesk/ticket', '#/helpdesk/knowledge-base'],
    steps: [
      {
        route: '#/helpdesk/tickets',
        target: 'input[data-hd-column]',
        title: 'See the whole queue',
        instruction: 'In the queue, open <strong>Columns</strong> and tick <strong>Priority</strong>, <strong>SLA due</strong>, <strong>Category</strong>, <strong>Caller</strong> and <strong>Created</strong>.',
        body: 'Why: you can’t sequence what you can’t see. Success looks like: six rows, with the SLA due column visible. The priority and SLA due columns say “Not set” until you triage.',
        waitLabel: 'Next Step: All five columns on',
        check: () => {
          if (typeof hdState === 'undefined' || !hdState.queueView || !Array.isArray(hdState.queueView.columns)) return false;
          const cols = hdState.queueView.columns;
          return ['priority', 'sla', 'category', 'caller', 'created'].every((c) => cols.includes(c));
        },
      },
      {
        route: '#/helpdesk/tickets',
        target: 'select[data-hd-field="impact"], select[data-hd-field="urgency"], select[data-hd-field="category"], tr[data-hd-row]',
        title: 'Triage every ticket',
        instruction: 'Open each ticket in the order it arrived. Set <strong>Category</strong>, <strong>Configuration item</strong>, <strong>Impact</strong> and <strong>Urgency</strong> from the facts, not the caller’s tone. If the ticket doesn’t say which laptop it is, ask the caller in the chat. Then read the coach note that appears on the ticket once its priority is calculated.',
        body: 'Why: priority is calculated from impact and urgency. You never type it. Success looks like: every ticket shows a priority, and the coach note on each ticket says whether your impact and urgency match the facts, and why. This is feedback only, with no points.',
        waitLabel: 'Next Step: Every ticket has a priority',
        check: () => Object.values(HD10_ID).every((id) => {
          const t = hd10Ticket(id);
          if (!t) return false;
          const c = typeof hdClassification === 'function' ? hdClassification(t) : null;
          return Boolean(t.priority) && Boolean(c) && Boolean(c.category) && Boolean(c.ci);
        }),
      },
      {
        route: '#/helpdesk/tickets',
        target: '.hd-convert, tr[data-hd-row]',
        title: 'Convert the request',
        instruction: 'Find the request in the queue. Open it, click <strong>Convert to Request</strong> and choose the catalog item.',
        body: 'Why: requests need approval and asset tracking, and an incident is the wrong record for them. Success looks like: the incident shows Canceled – Converted, and the request shows Approval = Approved, because the manager already approved it. (The request is INC0010161, from Amir Patel, who asked for a headset.) If you canceled or closed it by mistake, it can’t be converted: press <strong>Reset shift</strong> on the Dashboard to start the queue again.',
        waitLabel: 'Next Step: Request converted',
        check: () => { const t = hd10Ticket(HD10_ID.amir); return Boolean(t) && t.cancelReason === 'Converted' && Boolean(t.request) && t.request.approval === 'Approved'; },
      },
      {
        target: '.hd-link,.hd-rewrite, select[data-hd-field="impact"], select[data-hd-field="urgency"]',
        title: 'Link two tickets, rewrite the weak one',
        instruction: 'Find the two tickets that describe one problem. On the weaker one, in <strong>Related tickets</strong>, choose the stronger one and click <strong>Link</strong>. Then rewrite its short description and description, and click <strong>Save and check</strong>. Linking does not change its priority, so set it to match its parent: <strong>Impact 1</strong> and <strong>Urgency 2</strong>, which gives <strong>P2</strong>.',
        body: 'Why: two tickets, one cause. Fixing the cause fixes both, and a clear ticket saves the next technician a call. Success looks like: the weaker ticket is linked to its parent, the rewrite names who, what, where, when and the impact, and the priority is P2. (The pair is INC0010159 from Noah Williams, written well, and INC0010160 from Luis Ortega, “internet not working”. Luis is on floor 3, and his laptop says “No internet” since about 08:15.)',
        waitLabel: 'Next Step: Linked, rewritten and rated P2',
        check: () => {
          const t = hd10Ticket(HD10_ID.luis);
          if (!t || t.parentId !== HD10_ID.noah) return false;
          const s = hd10State(t);
          const rewritten = Boolean(s) && Boolean(s.rewrite) && Array.isArray(s.rewrite.missing) && s.rewrite.missing.length === 0;
          return rewritten && String(t.impact) === '1' && String(t.urgency) === '2' && t.priority === 'P2';
        },
      },
      {
        route: '#/helpdesk/tickets',
        target: '.hd-work-order',
        title: 'Put the queue in order',
        instruction: 'Sort the queue by <strong>Priority</strong>, then <strong>SLA due</strong>. Drag the rows into your work order, then click <strong>Check order</strong>.',
        body: 'Why: priority comes first, then the clock. Sorting by Created alone gives the wrong order here. Success looks like: the checker accepts your order. If it does not, it names the ticket that is out of place, so move that one and check again.',
        waitLabel: 'Next Step: Order accepted',
        check: () => typeof hdState !== 'undefined' && hdState.workOrderResult === 'ok',
      },
      {
        target: 'select[data-hd-field="category"], #hd-assignment-group, #hd-note-input',
        title: 'Send the security ticket to the SOC',
        instruction: 'On the security ticket, set <strong>Category</strong> to <strong>Security</strong> and set <strong>Assignment group</strong> to <strong>Security Operations (SOC)</strong>. Add a work note with the indicators.',
        body: 'Why: security goes to the SOC. It never waits for “later”. Success looks like: the group is Security Operations (SOC) and your note names the sender’s address, the attachment name, what the user clicked and when, and which laptop. (The ticket is INC0010163 from Maya Chen. The attachment is Invoice_8841, and she clicked Enable content.) The ticket leaves your queue once it is assigned.',
        waitLabel: 'Next Step: Assigned to the SOC with a note',
        check: () => {
          const t = hd10Ticket(HD10_ID.maya);
          if (!t || t.assignmentGroup !== 'Security Operations (SOC)') return false;
          const c = typeof hdClassification === 'function' ? hdClassification(t) : null;
          return Boolean(c) && /security/i.test(c.category || '') && hd10Mine(t.notes).length > 0;
        },
      },
      {
        target: '.hd-comments, #hd-next-state, #hd-hold-reason',
        title: 'Pause while you wait on the caller',
        instruction: 'On <strong>INC0010162</strong>, the mouse ticket, ask a question in an <strong>Additional comment</strong>. For example, ask if the mouse is wireless and when its batteries were last changed. Then set the state to <strong>On Hold</strong> with the reason <strong>Awaiting Caller</strong>.',
        body: 'Why: the SLA clock pauses only while you wait on the user. Success looks like: the state shows On Hold – Awaiting Caller and the SLA bar turns grey and says Paused. Priya’s reply may arrive later in the lab. If it has already arrived, this step is done. If you resolved or closed this ticket by mistake, it can’t go On Hold: press <strong>Reset shift</strong> on the Dashboard to start the queue again.',
        waitLabel: 'Next Step: On Hold – Awaiting Caller',
        check: () => {
          const t = hd10Ticket(HD10_ID.priya);
          if (!t) return false;
          if (hd10Arrived(t)) return true;
          const paused = typeof hdStatusText === 'function' && /On Hold\s*[–-]\s*Awaiting Caller/.test(hdStatusText(t));
          return paused && hd10Mine(t.customerComments).length > 0;
        },
      },
      {
        target: '.hd-kb-search, .hd-related-knowledge',
        title: 'Attach the Wi-Fi article',
        instruction: 'On <strong>INC0010159</strong>, the Wi-Fi ticket, search the knowledge base for <strong>wifi no internet</strong>. Open the article and click <strong>Attach knowledge</strong>.',
        body: 'Why: a linked article shows the next technician which fix was used. Success looks like: KB-0063 is listed under Related › Knowledge. The article says that when several people in one area lose Wi-Fi, the cause is the network: link the tickets to one parent and escalate it to Network Operations with the area, the start time and the business impact. Never restart network equipment yourself.',
        waitLabel: 'Next Step: Article attached',
        check: () => {
          const t = hd10Ticket(HD10_ID.noah);
          const s = hd10State(t); const p = hd10Progress(HD10_ID.noah);
          return Boolean((s && Array.isArray(s.kbAttached) && s.kbAttached.includes('KB-0063')) || (p && Array.isArray(p.kbAttached) && p.kbAttached.includes('KB-0063')));
        },
      },
      {
        target: '#hd-note-input, .hd-comments, #hd-assignment-group',
        title: 'Write for two audiences',
        instruction: 'On <strong>INC0010158</strong>, the P1 ticket from Customer Service, add one <strong>work note</strong> that includes a line telling the <strong>Service Desk lead</strong>. Add one <strong>Additional comment</strong> for Sam. Set <strong>Assignment group</strong> to <strong>Messaging &amp; Collaboration</strong>, who own the phone app.',
        body: 'Why: the work note is for IT staff and the comment is for the caller, so each has its own style. The SLA table says the Service Desk lead must be told about every P1. Success looks like: the comment check shows no jargon or internal names, and the ticket shows Escalated under Messaging &amp; Collaboration. Write the comment with four parts: thank Sam, say what is happening in plain words, say what Sam must do (if anything), and say when Sam hears from you next.',
        waitLabel: 'Next Step: Note, comment and owner done',
        check: () => {
          const t = hd10Ticket(HD10_ID.sam);
          const p = hd10Progress(HD10_ID.sam);
          if (!t || !p || t.assignmentGroup !== 'Messaging & Collaboration') return false;
          const lead = hd10Mine(t.notes).some((n) => /service desk lead/i.test(String((n && n.text) || '')));
          return lead && hd10Mine(t.customerComments).length > 0 && hd10Empty(p.lastCommentJargon) && hd10Empty(p.lastCommentInternal);
        },
      },
      {
        target: '.hd-arrivals,#hd-resolution-code, #hd-next-state',
        title: 'Resolve it and share the fix',
        instruction: 'When Priya replies on <strong>INC0010162</strong>, read her message. Set a <strong>Resolution code</strong> and add resolution notes, then resolve the ticket. Click <strong>Create knowledge draft</strong> from it.',
        body: 'Why: close with the how, and share it so the next technician can fix it faster. Success looks like: the state is Resolved and the knowledge draft is in Review. Priya’s reply arrives after you finish the P1 ticket and the mouse ticket is On Hold. If it has not arrived yet, finish the earlier steps first.',
        waitLabel: 'Next Step: Resolved, with a knowledge draft',
        check: () => {
          const t = hd10Ticket(HD10_ID.priya);
          const s = hd10State(t);
          return Boolean(t) && (t.status === 'Resolved' || t.status === 'Closed') && Boolean(s && s.kbDraft && s.kbDraft.state === 'Review');
        },
      },
      {
        // Reached only after the last work step passes, so Finish never shows
        // before then (ui/coach.js shows Finish on the last step).
        title: 'Finish the lab',
        instruction: 'Queue worked. Press <strong>Finish</strong> to send your work to your course page.',
        body: 'Your work counts once your course page confirms it saved it: your triage, work order, notes, comments, link, rewrite and knowledge draft. There is no score.',
        finish: { label: 'Finish', href: itsPortalUrl('#/program/it-support/module/2', 'hd-m10') },
      },
    ],
  });

  /* hd-m11 — Module 3 (key its-11): Lab 3.1, a frustrated caller. One ticket,
   * eight steps, then Finish. Wes Turner calls about a slow laptop with a
   * deadline today. Every check reads the saved ticket state, so it passes
   * whatever order the student works in. The mood meter is feedback only:
   * no check reads it. Feedback only, no points. */
  const HD11_ID = 'HD-2164';
  const hd11Ticket = () => (typeof hdTicketById === 'function' ? hdTicketById(HD11_ID) : null);
  const hd11Progress = () => (typeof hdConsoleProgress === 'function' ? hdConsoleProgress(HD11_ID) : null);
  const hd11Rule = (rule) => { const t = hd11Ticket(); return Boolean(t) && typeof hdConsoleRule === 'function' && hdConsoleRule(t, rule) === true; };
  const hd11Class = (t) => (t && typeof hdClassification === 'function' ? hdClassification(t) : null);
  // A saved run of the old two-ticket hd-m11 coach (before 2026-11-21) points
  // at steps for tickets this shift doesn't hold, and ui/coach.js would resume
  // it at the same step number. When the shift isn't the guided call, forget
  // it, so the next launch starts the new lab fresh (resetState).
  // Only the coached lab's shift: a practice set or a Prove It has its own.
  (function hd11ForgetOldWalkthrough() {
    if ((typeof HD_PRACTICE_SET !== 'undefined' && HD_PRACTICE_SET) || (typeof HD_PROVE !== 'undefined' && HD_PROVE)) return;
    if (typeof hdState === 'undefined' || !hdState || hdState.ticketSet === 'its-11-guided') return;
    const stale = (raw) => { try { const saved = JSON.parse(raw || 'null'); return Boolean(saved && saved.id === 'hd-m11'); } catch { return false; } };
    try { if (stale(localStorage.getItem('mnt.coach.resume'))) localStorage.removeItem('mnt.coach.resume'); } catch { /* storage blocked */ }
    try { if (stale(sessionStorage.getItem('mnt.coach.state'))) sessionStorage.removeItem('mnt.coach.state'); } catch { /* storage blocked */ }
  }());
  MODULE_COACHES.push({
    id: 'hd-m11', module: 3, name: 'Guided Lab: a frustrated caller', role: 'Tier 1 Help Desk Technician',
    summary: 'Take a phone call from an angry colleague whose laptop is slow and whose work is due today. Greet him, let him finish, ask three questions, set the priority from the facts, put him on a short hold, explain the next step in plain words, hand the ticket to Desktop Support with a note, and keep your promise to update him.',
    completionToken: 'hd-m11', home: '#/helpdesk/tickets',
    resetState: () => {
      if (typeof hdUseTicketSet === 'function') hdUseTicketSet('its-11-guided');
      if (typeof hdState !== 'undefined' && hdState) hdState.selectedTicketId = HD11_ID;
    },
    allow: ['#/helpdesk/dashboard', '#/helpdesk/tickets', '#/helpdesk/ticket', '#/helpdesk/knowledge-base'],
    steps: [
      {
        route: '#/helpdesk/ticket',
        target: '.hd-call, .hd-intake',
        title: 'Answer the call',
        instruction: 'Open <strong>INC0010440</strong>. In the call panel, pick the greeting that gives your name and asks for his name and a callback number. Then set <strong>Caller</strong> to Wes Turner, set <strong>Contact type</strong> to <strong>Phone</strong> and type his callback number.',
        body: 'Why: a professional start tells him who he reached, and the callback number lets you reach him if the call drops. Success looks like: the mood meter stays steady, and Caller, Contact type and the callback number are set. If you pick a poor greeting, read the line under the meter and choose again.',
        waitLabel: 'Next Step: Caller, Contact type and callback set',
        check: () => {
          const t = hd11Ticket(); const p = hd11Progress();
          const c = hd11Class(t);
          return Boolean(t && p && p.call) && Number(p.call.stage) >= 1 && hd11Rule({ intakeCaller: 'Wes Turner' }) && hd11Rule({ callback: true }) && Boolean(c) && c.contactType === 'Phone';
        },
      },
      {
        route: '#/helpdesk/ticket',
        target: '.hd-call',
        title: 'Let him finish',
        instruction: 'Wes will send three messages, a few seconds apart. Choose <strong>Keep listening</strong> until the third one arrives. Then pick the reply that acknowledges what this is costing him.',
        body: 'Why: an upset caller who is cut off gets angrier, and “calm down” tells him his reaction is the problem. Name the impact instead. Success looks like: you picked an empathy line, not “Calm down”, and the meter went down one step. If you replied too early or picked a poor line, read why and choose again. Nothing is lost.',
        waitLabel: 'Next Step: Acknowledgement chosen',
        check: () => hd11Rule({ call: true }),
      },
      {
        route: '#/helpdesk/ticket',
        target: '.hd-chat, select[data-hd-field="impact"], select[data-hd-field="urgency"], select[data-hd-field="category"]',
        title: 'Ask three questions, then triage',
        instruction: 'Ask Wes <strong>when it started</strong>, <strong>whether anything changed</strong> and <strong>how it is affecting his work</strong>. Then set <strong>Category</strong>, <strong>Configuration item</strong>, <strong>Impact</strong> and <strong>Urgency</strong> from the facts.',
        body: 'Why: you need the problem and the impact before you can rate it. Success looks like: all three answers are in the chat, the category and configuration item are set, and the ticket shows a priority. Rate it from who is affected and his deadline, not from his tone, then read the coach note on the ticket once the priority calculates. Never type the priority; it is calculated.',
        waitLabel: 'Next Step: Three answers and a priority',
        check: () => {
          const t = hd11Ticket(); const c = hd11Class(t);
          return Boolean(t) && hd11Rule({ chat: ['when', 'changed', 'impact'] }) && Boolean(c) && Boolean(c.category) && Boolean(c.ci) && Boolean(t.priority);
        },
      },
      {
        route: '#/helpdesk/ticket',
        target: '.hd-hold, .hd-evidence-card, .hd-kb-search',
        title: 'Hold, then check his laptop',
        instruction: 'Ask Wes if you may put him on a short hold, and start the hold. While he waits, open the ticket’s <strong>Device health</strong> card. Then search the knowledge base for <strong>disk warning</strong> and open the article. Come back to Wes before two minutes pass.',
        body: 'Why: asking first is basic hold manners, and two minutes of silence feels much longer to the person waiting. Success looks like: the hold ran under two minutes, you opened the Device health card, and you opened KB-0067. If the hold ran out or you started it without asking, start a new hold after you ask and check again.',
        waitLabel: 'Next Step: Held, card and article opened',
        check: () => hd11Rule({ held: true }) && hd11Rule({ evidence: 'device-health' }) && hd11Rule({ kb: 'KB-0067' }),
      },
      {
        route: '#/helpdesk/ticket',
        target: '.hd-explain',
        title: 'Explain it in plain words',
        instruction: 'Tell Wes what is wrong and what happens next, in words he would use. Type it in the explanation box and check it. Say what the problem means for his files and who will fix it.',
        body: 'Why: he is not a technician, and a word he does not know feels like being brushed off. Success looks like: the checker finds no flagged terms. If it flags one, it names the word: say what it means for him and check again. A sentence like “your files are safe in OneDrive” helps him.',
        waitLabel: 'Next Step: Explanation passes',
        check: () => hd11Rule({ explained: true }),
      },
      {
        route: '#/helpdesk/ticket',
        target: '#hd-assignment-group, #hd-note-input, .hd-handoff, [data-hd-warm]',
        title: 'Hand it to Desktop Support',
        instruction: 'Set <strong>Assignment group</strong> to <strong>Desktop Support (Tier 2)</strong> and press <strong>Assign to group</strong>. Write a <strong>work note</strong> with the four labels: Reported, Tried, Result and Next action. Then press <strong>Warm handoff</strong>.',
        body: 'Why: a failing disk needs hands-on repair that Tier 1 cannot do, and the next team should not have to start from zero. Success looks like: the note has all four labels with his words and the deadline, what you checked and ruled out, where it stands, and the exact ask with a time. The history shows “Called Desktop Support”. A warm handoff because it is time-critical: the disk could fail before his 3:00 deadline. A routine ticket would go by reassignment with the note. If a label is missing, the feedback names it: add it and save again.',
        waitLabel: 'Next Step: Assigned, noted and called',
        check: () => hd11Rule({ group: 'Desktop Support (Tier 2)' }) && hd11Rule({ handoffNote: true }) && hd11Rule({ warmHandoff: true }),
      },
      {
        route: '#/helpdesk/ticket',
        target: '.hd-comments, [data-hd-follow-up]',
        title: 'Tell Wes, and set the follow-up',
        instruction: 'Post an <strong>Additional comment</strong> to Wes: who has his ticket, what happens next, and when he will hear from you. Then set a <strong>Follow-up</strong> at that time.',
        body: 'Why: he needs to know who has it and when he will hear back. Success looks like: the comment names a time you control and the follow-up date is set. Do not promise a fix time; Desktop Support sets that. Promise when you will update him, even if there is no news. If the comment has no time, the feedback tells you: edit it and post again.',
        waitLabel: 'Next Step: Comment posted, follow-up set',
        check: () => hd11Rule({ commentTime: true }) && hd11Rule({ followUp: true }),
      },
      {
        route: '#/helpdesk/ticket',
        target: '[data-hd-follow-up], .hd-comments',
        title: 'Keep your promise',
        instruction: 'Press <strong>Go to follow-up time</strong>. The history shows no update from Desktop Support yet. Post an <strong>Additional comment</strong> to Wes anyway.',
        body: 'Why: an update on time, even without news, is what keeps a caller’s trust. Success looks like: your update is posted within 10 minutes of the follow-up time. Say that the desktop team has his laptop next, that you have no finish time yet, and when you will update him again. If you posted before the clock moved, press the button and post a new one.',
        waitLabel: 'Next Step: Update posted on time',
        check: () => {
          // A student who set a second follow-up afterwards still finishes.
          const t = hd11Ticket();
          return Boolean(t) && hdFollowUpKept(t, hd11Progress());
        },
      },
      {
        // Reached only after the last work step passes, so Finish never shows
        // before then (ui/coach.js shows Finish on the last step).
        title: 'Finish the lab',
        instruction: 'Call done. Press <strong>Finish</strong> to send your work to your course page.',
        body: 'The ticket stays open with Desktop Support, and that is right. You kept a promise you could control. That’s what he’ll remember. Your work counts once your course page confirms it saved it: your triage, hold, explanation, note, comments and follow-up. There is no score.',
        finish: { label: 'Finish', href: itsPortalUrl('#/program/it-support/module/3', 'hd-m11') },
      },
    ],
  });

  // coach.js resets a coach's tickets (resetState) only when it starts it
  // fresh; a reload or a relaunch of an unfinished lab resumes the saved work.
  // Module 4's lab coaches add a word: hd-m02-vm, hd-m02-server.
  MODULE_COACHES.filter((coach) => /^hd-m\d+(-[a-z]+)?$/.test(coach.id)).forEach((coach) => {
    coach.collectWork = () => hdCollectCoachWork(coach);
    coach.resumeAcrossLaunches = true;
  });
})();
