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

  /* ---------------------------------------------------------- hd-m01 ---- */

  const HD1_TICKETS = ['HD-2101', 'SR-2102', 'SR-2103', 'SR-2116'];

  function hd1Reset() {
    if (typeof hdState === 'undefined' || typeof window.hdFreshState !== 'function') return;
    const fresh = window.hdFreshState();
    hdState.tickets = fresh.tickets.filter((t) => HD1_TICKETS.includes(t.id));
    if (hdState.tickets.length && !hdState.tickets.find((t) => t.id === hdState.selectedTicketId)) {
      hdState.selectedTicketId = hdState.tickets[0].id;
    }
    if (typeof hdSave === 'function') hdSave();
  }

  MODULE_COACHES.push({
    id: 'hd-m01',
    module: 1,
    name: 'Your First Help Desk Ticket',
    role: 'Tier 1 Help Desk Technician',
    summary: 'Work Jordan Bell’s account-lockout ticket end to end: read the evidence, work the troubleshooting path, diagnose against the log rather than the obvious guess, document it, and resolve it.',
    completionToken: 'hd-m01',
    home: '#/helpdesk/tickets',
    resetState: hd1Reset,
    allow: ['#/helpdesk/dashboard', '#/helpdesk/tickets', '#/helpdesk/ticket'],
    steps: [
      {
        route: '#/helpdesk/tickets',
        target: 'tr[onclick*="HD-2101"]',
        require: true,
        title: 'Open your first ticket',
        instruction: 'Next Step: open <strong>HD-2101</strong>, Jordan Bell’s account lockout ticket.',
        body: 'Every shift starts in the queue. This one is a good first case: the account keeps locking itself again a few minutes after it’s unlocked — which is a clue the real cause probably isn’t the obvious one.',
        waitLabel: 'Next Step: Opened the ticket',
        nudge: 'Click the HD-2101 row to open it.',
        check: () => typeof hdState !== 'undefined' && hdState.selectedTicketId === 'HD-2101',
      },
      {
        route: '#/helpdesk/ticket',
        target: '.hd-field-grid',
        title: 'Read before you diagnose',
        instruction: 'Read the requester statement and the ticket details before doing anything else.',
        body: 'Business impact, SLA, and the requester’s own words all shape how you’ll prioritize and what you’ll say back to them — gather this before you touch the evidence.',
        continueLabel: 'I’ve read it',
      },
      {
        target: '.hd-evidence',
        title: 'Check the evidence, not the assumption',
        instruction: 'Look closely at the log line about the scheduled task.',
        body: '“User typing an old password” is the tempting first guess — but the second log line (a scheduled task that last ran right around the lockout) is the actual clue. Evidence first, guess second.',
        continueLabel: 'Got it',
      },
      {
        target: '.hd-path',
        require: true,
        title: 'Work the troubleshooting path',
        instruction: 'Check off each step as you work through it.',
        body: 'This isn’t busywork — it’s what a real technician’s documentation looks like while investigating. Check at least the first step to continue.',
        waitLabel: 'Next Step: Checked a troubleshooting step',
        nudge: 'Check at least one box in the troubleshooting path.',
        check: () => document.querySelectorAll('.hd-path input:checked').length > 0,
      },
      {
        target: '.hd-diagnosis-row',
        require: true,
        title: 'Choose your diagnosis',
        instruction: 'Select the cause the evidence actually supports, then click Check diagnosis.',
        body: 'Two of the three options are plausible-sounding distractors. The log line about the scheduled task is what should drive your answer, not which one sounds most familiar.',
        waitLabel: 'Next Step: Diagnosis confirmed',
        nudge: 'Pick a cause and click Check diagnosis — if it’s not supported by the evidence, you’ll be told to recheck.',
        check: () => typeof hdCurrentTicket === 'function' && hdCurrentTicket() && hdCurrentTicket().diagnosisCorrect === true,
      },
      {
        target: '#hd-note-input, #hd-note-input ~ button',
        require: true,
        title: 'Document what you found',
        instruction: 'Write a work note: what you checked, what you found, what you’re about to do.',
        body: '“Fixed it” is not a note. A useful one tells the next technician exactly what happened without them having to redo your work.',
        waitLabel: 'Next Step: Note added',
        nudge: 'Type a note and click Add work note.',
        check: () => typeof hdCurrentTicket === 'function' && hdCurrentTicket() && hdCurrentTicket().notes.length > 0,
      },
      {
        target: '.hd-control-stack .btn-primary',
        require: true,
        title: 'Close the loop',
        instruction: 'Resolve the ticket.',
        body: 'Resolving is gated on your diagnosis actually being correct — if you jumped to the wrong cause earlier, this button will tell you to recheck the evidence instead of letting you close it anyway.',
        waitLabel: 'Next Step: Ticket resolved',
        nudge: 'Click Resolve / escalate to close this ticket out.',
        check: () => typeof hdCurrentTicket === 'function' && hdCurrentTicket() && hdCurrentTicket().status === 'Resolved',
        finish: { label: 'Finish', href: itsPortalUrl('#/program/it-support/module/1', 'hd-m01') },
      },
    ],
  });

  document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(location.search);
    if (params.get('coach') === 'hd-m01') {
      setTimeout(() => {
        hd1Reset();
        if (typeof render === 'function') render();
      }, 30);
    }
  });

  /* ---------------------------------------------------------- hd-m02 ---- */
  /* Covers what were "Lab 2.3 The Misbehaving Peripheral" and "Lab 2.4 The
   * Stuck Queue and the Offline Printer" in the original lab-spec docx.
   * Neither a Device Manager UI nor a full Print Spooler console exists in
   * this simulator (confirmed by search) — but both tickets' real data
   * already carries that exact driver-crash-then-rollback narrative through
   * the generic evidence/diagnose/note/resolve flow, so this coach walks
   * both real tickets through that flow rather than inventing new UI. */

  const HD2_TICKETS = ['HD-2106', 'HD-2112'];

  function hd2Reset() {
    if (typeof hdState === 'undefined' || typeof window.hdFreshState !== 'function') return;
    const fresh = window.hdFreshState();
    hdState.tickets = fresh.tickets.filter((t) => HD2_TICKETS.includes(t.id));
    // Unlike hd1Reset's 4-ticket set, this coach only has 2 tickets, so
    // hdFreshState()'s random shuffle has a genuine 50% chance of already
    // selecting 'HD-2106' — which would silently pre-satisfy step 1's "open
    // it yourself" check before the student has clicked anything. Force a
    // clean slate every time instead of leaving it to chance.
    hdState.selectedTicketId = null;
    if (typeof hdSave === 'function') hdSave();
  }

  function hd2TicketSteps(ticketId, opening) {
    return [
      {
        route: '#/helpdesk/tickets',
        target: `tr[onclick*="${ticketId}"]`,
        require: true,
        title: opening ? 'Open your first ticket' : 'Open the second ticket',
        instruction: `Next Step: open <strong>${ticketId}</strong>.`,
        body: opening
          ? 'A label printer is stuck mid-job and the printer itself claims it’s Ready — that mismatch between what the printer reports and what the queue shows is the first clue.'
          : 'This one came in from monitoring, not a person — the Print Spooler service itself is crashing on the print server. Same underlying cause, different vantage point.',
        waitLabel: 'Next Step: Opened the ticket',
        nudge: `Click the ${ticketId} row to open it.`,
        check: () => typeof hdState !== 'undefined' && hdState.selectedTicketId === ticketId,
      },
      {
        route: '#/helpdesk/ticket',
        target: '.hd-evidence',
        title: 'Check the evidence',
        instruction: 'Read the log line before you guess.',
        body: 'Out of labels and a bad network port are the tempting first guesses on a stuck print job — but the print-service log line about the driver terminating is the actual clue.',
        continueLabel: 'Got it',
      },
      {
        target: '.hd-path',
        require: true,
        title: 'Work the troubleshooting path',
        instruction: 'Check off each step as you work through it.',
        body: 'Preserve the queued jobs before you touch anything — confidential print jobs and print-service evidence matter here, same as any other ticket.',
        waitLabel: 'Next Step: Checked a troubleshooting step',
        nudge: 'Check at least one box in the troubleshooting path.',
        check: () => document.querySelectorAll('.hd-path input:checked').length > 0,
      },
      {
        target: '.hd-diagnosis-row',
        require: true,
        title: 'Choose your diagnosis',
        instruction: 'Select the cause the evidence actually supports, then click Check diagnosis.',
        body: 'The other options sound plausible, but only one matches what the print-service log actually reported.',
        waitLabel: 'Next Step: Diagnosis confirmed',
        nudge: 'Pick a cause and click Check diagnosis — if it’s not supported by the evidence, you’ll be told to recheck.',
        check: () => typeof hdCurrentTicket === 'function' && hdCurrentTicket() && hdCurrentTicket().diagnosisCorrect === true,
      },
      {
        target: '#hd-note-input, #hd-note-input ~ button',
        require: true,
        title: 'Document what you found',
        instruction: 'Write a work note: what you checked, what you found, what you’re about to do.',
        body: 'The expected resolution here is a driver rollback under change control — say so, not just "fixed the printer."',
        waitLabel: 'Next Step: Note added',
        nudge: 'Type a note and click Add work note.',
        check: () => typeof hdCurrentTicket === 'function' && hdCurrentTicket() && hdCurrentTicket().notes.length > 0,
      },
      {
        target: '.hd-control-stack .btn-primary',
        require: true,
        title: 'Close the loop',
        instruction: 'Resolve the ticket.',
        body: 'Resolving is gated on your diagnosis actually being correct, same as every ticket in this program.',
        waitLabel: 'Next Step: Ticket resolved',
        nudge: 'Click Resolve / escalate to close this ticket out.',
        check: () => typeof hdCurrentTicket === 'function' && hdCurrentTicket() && hdCurrentTicket().status === 'Resolved',
      },
    ];
  }

  const hd2Steps = hd2TicketSteps('HD-2106', true).concat(hd2TicketSteps('HD-2112', false));
  hd2Steps[hd2Steps.length - 1].finish = { label: 'Finish', href: itsPortalUrl('#/program/it-support/module/2', 'hd-m02') };

  MODULE_COACHES.push({
    id: 'hd-m02',
    module: 2,
    name: 'The Misbehaving Peripheral & The Stuck Queue',
    role: 'Tier 1 Help Desk Technician',
    summary: 'Work two real print-driver tickets end to end — a stuck label queue and a crashing Print Spooler service — tracing both back to the same root cause and resolving them under change control.',
    completionToken: 'hd-m02',
    home: '#/helpdesk/tickets',
    resetState: hd2Reset,
    allow: ['#/helpdesk/dashboard', '#/helpdesk/tickets', '#/helpdesk/ticket'],
    steps: hd2Steps,
  });

  document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(location.search);
    if (params.get('coach') === 'hd-m02') {
      setTimeout(() => {
        hd2Reset();
        if (typeof render === 'function') render();
      }, 30);
    }
  });

  /* ------------------------------------------------------ hd-m03..hd-m11 -
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
    document.addEventListener('DOMContentLoaded', () => {
      if (new URLSearchParams(location.search).get('coach') === id) {
        setTimeout(() => { hdResetTicketScope(ticketIds); if (typeof render === 'function') render(); }, 30);
      }
    });
    return MODULE_COACHES[MODULE_COACHES.length - 1];
  }

  /* hd-m03 — Module 3: Windows Operating System Support. One ticket. */
  hdRegisterSimpleCoach('hd-m03', 3, 'The Blank Desktop', 'Diagnose a corrupted Windows profile end to end: read the evidence, work the troubleshooting path, diagnose against the log, document it, and resolve it.', ['HD-2109']).steps =
    hdTicketFlowSteps('HD-2109', {
      opening: true, isLast: true, finalStatus: 'Resolved', finishHref: itsPortalUrl('#/program/it-support/module/3', 'hd-m03'),
      openBody: 'Noah signed in to a completely empty desktop with his shortcuts missing — but he can still sign in fine. That combination is the clue.',
      evidenceBody: 'The User Profile Service log line about a temporary profile is the tell — Windows quietly loaded a fallback profile because it couldn’t load the real one.',
      pathBody: 'Protecting the user’s data comes first, before any repair — a profile fix should never risk losing what’s already there.',
      diagnosisBody: 'A blank desktop with a working sign-in points at the profile itself, not the account, not malware.',
      noteBody: '“Fixed it” is not a note. Name the temporary-profile evidence, what you did, and that data was verified afterward.',
      resolveBody: 'Resolving is gated on your diagnosis actually being correct — the same discipline as every ticket in this program.',
    });

  /* hd-m04 — Module 4: Networking Fundamentals. Three tickets scoped;
   * guides HD-2104 (DHCP/APIPA) then HD-2105 (DNS), leaves HD-2113 (VPN
   * gateway certificate, an 'Always' escalation) for free practice — it
   * gets its own dedicated treatment in hd-m11 instead. */
  hdRegisterSimpleCoach('hd-m04', 4, 'Connected But Nothing Works', 'Work two real connectivity tickets end to end — an APIPA/DHCP failure and a DNS failure — using ipconfig, ping, and nslookup-style evidence rather than guessing.', ['HD-2104', 'HD-2105', 'HD-2113']).steps =
    hdTicketFlowSteps('HD-2104', {
      opening: true, isLast: false, finalStatus: 'Resolved',
      openBody: 'Priya is connected to the office network but nothing opens — that gap between “connected” and “working” is exactly what this module is about.',
      evidenceBody: 'A 169.254.x.x address is APIPA — Windows self-assigned it because DHCP never answered. That’s the clue, not proof of which interface is at fault yet.',
      pathBody: 'Isolating which network interface is actually carrying the connection comes before touching anything.',
      diagnosisBody: 'Two working interfaces claiming the same connection is the pattern here — one of them is interfering with the other.',
      noteBody: 'Name the APIPA evidence, which interface you disabled, and that a valid lease and resource access were confirmed afterward.',
      resolveBody: 'Resolving is gated on your diagnosis actually being correct — recheck the evidence if it isn’t.',
    }).concat(hdTicketFlowSteps('HD-2105', {
      opening: false, isLast: true, finalStatus: 'Resolved', finishHref: itsPortalUrl('#/program/it-support/module/4', 'hd-m04'),
      openBody: 'Maya can reach the public internet and internal resources by IP, but a hostname fails — a classic DNS-shaped symptom.',
      evidenceBody: 'NXDOMAIN on an internal hostname, plus a client DNS server that isn’t the corporate resolver — that combination is the clue.',
      pathBody: 'Capturing the current DNS configuration before changing anything is what makes this fixable and documentable.',
      diagnosisBody: 'Public sites working but an internal hostname failing points at DNS configuration specifically, not a broader outage.',
      noteBody: 'Name the DNS evidence, the VPN/DNS setting you corrected, and that the hostname resolved afterward.',
      resolveBody: 'Resolving is gated on your diagnosis actually being correct, same as every ticket.',
    }));

  /* hd-m05 — Module 5: Windows Server & Active Directory. Two tickets. */
  hdRegisterSimpleCoach('hd-m05', 5, 'The Missing Drive & The Vanishing Free Space', 'Work two real Windows Server tickets end to end — a Group Policy scope issue and a file-server disk-space incident.', ['HD-2108', 'HD-2117']).steps =
    hdTicketFlowSteps('HD-2108', {
      opening: true, isLast: false, finalStatus: 'Resolved',
      openBody: 'Amir’s Operations drive disappeared after his laptop was replaced — his group membership is correct, so it isn’t an access problem.',
      evidenceBody: 'gpresult showing the Operations Drive Mapping policy absent, alongside a computer object still sitting in the default Computers container, is the clue.',
      pathBody: 'Checking the computer’s OU placement in Active Directory comes before touching any policy.',
      diagnosisBody: 'A correct group membership but a missing policy result points at where the computer object lives, not the user’s access.',
      noteBody: 'Name the OU evidence, the object you moved, and that the drive mapping returned after a policy refresh.',
      resolveBody: 'Resolving is gated on your diagnosis actually being correct.',
    }).concat(hdTicketFlowSteps('HD-2117', {
      opening: false, isLast: true, finalStatus: 'Resolved', finishHref: itsPortalUrl('#/program/it-support/module/5', 'hd-m05'),
      openBody: 'A monitoring alert: the file server’s data volume has 4% free space left and is dropping fast.',
      evidenceBody: 'A single export path accounting for most of the growth, right after a job that ran overnight, is the clue.',
      pathBody: 'Confirming impact and growth rate first is what keeps you from deleting something that turns out to matter.',
      diagnosisBody: 'Accelerated growth traced to one specific export path points at a duplicate job, not normal usage or log growth.',
      noteBody: 'Name the duplicate-export evidence, who you looped in before deleting anything, and the free-space result afterward.',
      resolveBody: 'Resolving is gated on your diagnosis actually being correct.',
    }));

  /* hd-m06 — Module 6: Identity, Accounts & Access Management. Two
   * tickets. SR-2107 is a Service Request (its resolve gate doesn't
   * actually require diagnosisCorrect in the underlying app) — the coach
   * still requires a correct diagnosis anyway, for the same reasoning
   * practice as every other ticket. */
  hdRegisterSimpleCoach('hd-m06', 6, 'Restoring Access the Right Way', 'Work two real identity tickets end to end — an approved group-membership restore and a missing file-permission group — verifying authorization before you act.', ['SR-2107', 'HD-2118']).steps =
    hdTicketFlowSteps('SR-2107', {
      opening: true, isLast: false, finalStatus: 'Resolved',
      openBody: 'An approved request: restore Grace’s contributor access to the HR onboarding folder. Manager approval is already attached — verify it before acting.',
      evidenceBody: 'The AD group history showing removal from the contributor group during a role transfer is the clue — read access still works, contributor doesn’t.',
      pathBody: 'Validating the attached approval comes first — a group grants access to real resources, so confirm before adding anyone.',
      diagnosisBody: 'Read access working but write access denied, with a group removed during a transfer, points at missing group membership specifically.',
      noteBody: 'Name the approval reference, the group you restored, and that upload access was verified afterward.',
      resolveBody: 'Resolving is gated on your diagnosis actually being correct, the same discipline whether or not it’s strictly required for a request.',
    }).concat(hdTicketFlowSteps('HD-2118', {
      opening: false, isLast: true, finalStatus: 'Resolved', finishHref: itsPortalUrl('#/program/it-support/module/6', 'hd-m06'),
      openBody: 'Evan can open the payroll workbook but can’t save — read succeeds, modify is denied.',
      evidenceBody: 'Effective access showing Read & Execute while the share permission allows Change is the clue — the block is on the NTFS side.',
      pathBody: 'Calculating group-based effective access (not just the share permission) is what actually explains this.',
      diagnosisBody: 'A share permission that allows more than the effective NTFS result points at a missing NTFS-level group, not a locked file or offline share.',
      noteBody: 'Name the effective-access evidence, the group you restored, and that Modify was verified without a direct user ACL.',
      resolveBody: 'Resolving is gated on your diagnosis actually being correct.',
    }));

  /* hd-m07 — Module 7: Software, Applications & Endpoint Management. Five
   * correlated tickets scoped (same underlying cert expiry); guides just
   * HD-2119 and leaves the other four for free practice — matching hd-m01's
   * own "guide one, scope the rest" precedent, doubly appropriate here
   * since all five are literally the same root cause from different users. */
  hdRegisterSimpleCoach('hd-m07', 7, 'The Purchasing App Everyone’s Locked Out Of', 'Work one of five correlated tickets end to end — a shared application certificate expiry — and recognize the pattern across the others.', ['HD-2119', 'HD-2120', 'HD-2121', 'HD-2122', 'HD-2123']).steps =
    hdTicketFlowSteps('HD-2119', {
      opening: true, isLast: true, finalStatus: 'Escalated', finishHref: itsPortalUrl('#/program/it-support/module/7', 'hd-m07'),
      openBody: 'Maya can’t sign in to the Purchasing app — a secure-connection error, not a login error. Four other tickets in this queue report the exact same thing.',
      evidenceBody: 'A certificate-date browser error alongside a NotAfter timestamp that’s already passed is the clue — this isn’t a user account or browser-cache problem.',
      pathBody: 'Comparing timestamps and linking the related incidents comes before escalating — confirm the pattern, don’t just assume it.',
      diagnosisBody: 'The same error, on the same application, for multiple unrelated users, on the same day points at the shared application certificate, not any one user’s setup.',
      noteBody: 'Name the certificate-expiry evidence, the other correlated tickets, and that this needs a controlled renewal, not a per-user fix.',
      resolveBody: 'This is a shared production certificate — outside what a technician fixes alone. Escalate it, don’t try to resolve it user by user.',
    });

  /* hd-m08 — Module 8: Troubleshooting Methodology & Diagnostics. Two
   * tickets, both genuinely unfamiliar-shaped problems worked with the
   * five-step method rather than a memorized fix. */
  hdRegisterSimpleCoach('hd-m08', 8, 'Two Problems You Haven’t Seen Before', 'Work two real unfamiliar-shaped tickets end to end — a broken domain trust and a BitLocker recovery — applying the troubleshooting method itself, not a memorized answer.', ['HD-2110', 'HD-2111']).steps =
    hdTicketFlowSteps('HD-2110', {
      opening: true, isLast: false, finalStatus: 'Resolved',
      openBody: 'Sofia’s workstation says the trust relationship with the domain failed — right after a VM snapshot was restored yesterday.',
      evidenceBody: 'A failed secure-channel test alongside a recent snapshot restore is the clue — snapshots roll back more than just files.',
      pathBody: 'Validating DNS, time, and the computer object’s state comes before attempting any repair.',
      diagnosisBody: 'A snapshot restored right before the failure points at a rolled-back machine-account password, not a user password or DNS issue.',
      noteBody: 'Name the snapshot-timing evidence, the approved repair procedure you used, and that domain sign-in was verified afterward.',
      resolveBody: 'Resolving is gated on your diagnosis actually being correct.',
    }).concat(hdTicketFlowSteps('HD-2111', {
      opening: false, isLast: true, finalStatus: 'Resolved', finishHref: itsPortalUrl('#/program/it-support/module/8', 'hd-m08'),
      openBody: 'Dina’s laptop is asking for a BitLocker recovery key right after an overnight firmware update.',
      evidenceBody: 'A completed, approved firmware change logged overnight, right before the recovery prompt, is the clue — not tampering.',
      pathBody: 'Verifying the user and device identity, and matching the recovery key ID, comes before disclosing anything.',
      diagnosisBody: 'An approved firmware change immediately before the prompt points at expected TPM measurement changes, not unauthorized tampering.',
      noteBody: 'Name the firmware-change evidence, that identity was verified before disclosure, and that protection status was confirmed afterward.',
      resolveBody: 'Resolving is gated on your diagnosis actually being correct.',
    }));

  /* hd-m09 — Module 9: Security Fundamentals for IT Support. Two Security
   * Incident tickets — both correctly end in 'Escalated', not 'Resolved'. */
  hdRegisterSimpleCoach('hd-m09', 9, 'Two Calls You Escalate, Not Fix', 'Work two real security-incident tickets end to end — a credential-phishing report and a malware alert — recognizing why L1 escalates rather than resolves.', ['SEC-2114', 'SEC-2115']).steps =
    hdTicketFlowSteps('SEC-2114', {
      opening: true, isLast: false, finalStatus: 'Escalated',
      openBody: 'Luis clicked a shipping link and signed in again — he’s asking if that was real. Treat it as a real possibility, not reassurance.',
      evidenceBody: 'A lookalike domain in the browser history, alongside an unfamiliar sign-in pending review, is the clue.',
      pathBody: 'Preserving the email, URL, and timing comes first — and protecting the account within procedure, not guessing at a fix.',
      diagnosisBody: 'A lookalike domain plus an unfamiliar sign-in together point at credential phishing, not a benign vendor portal.',
      noteBody: 'Name the lookalike-domain evidence, that the account was protected within procedure, and that this was escalated immediately.',
      resolveBody: 'This is a possible credential compromise — outside what L1 resolves alone. Escalate it, don’t declare the endpoint safe yourself.',
    }).concat(hdTicketFlowSteps('SEC-2115', {
      opening: false, isLast: true, finalStatus: 'Escalated', finishHref: itsPortalUrl('#/program/it-support/module/9', 'hd-m09'),
      openBody: 'A high-confidence EDR malware alert on a user’s laptop, with a report of browser pop-ups. Security needs help-desk coordination, not a solo fix.',
      evidenceBody: 'A suspicious PowerShell process launched as a child of the browser is the clue — that’s not a normal browser behavior.',
      pathBody: 'Do not delete evidence — confirming the user and device comes first, before any containment step.',
      diagnosisBody: 'A browser-launched, encoded PowerShell command points at a malicious extension, not a false positive.',
      noteBody: 'Name the PowerShell evidence, what containment steps were coordinated, and that this was a warm handoff to security.',
      resolveBody: 'This is a confirmed malware indicator — outside what L1 resolves alone. Escalate it as a warm handoff to security.',
    }));

  /* hd-m10 — Module 10: Ticketing, Service Management & SLAs. Full,
   * unfiltered queue — this module is about ticket structure and
   * prioritization across the whole queue, not fixing one ticket. Guides
   * filtering to P1 and reading a real ticket's fields, no resolve step. */
  MODULE_COACHES.push({
    id: 'hd-m10', module: 10, name: 'Working the Queue by Priority', role: 'Tier 1 Help Desk Technician',
    summary: 'Filter the full ticket queue down to what actually needs attention first, then read a priority ticket the way a real shift starts.',
    completionToken: 'hd-m10', home: '#/helpdesk/tickets',
    resetState: () => hdResetTicketScope(null),
    allow: ['#/helpdesk/dashboard', '#/helpdesk/tickets', '#/helpdesk/ticket'],
    steps: [
      {
        route: '#/helpdesk/tickets',
        target: '.filterbar select[onchange*="hdSetPriorityFilter"]',
        require: true,
        title: 'Filter to what matters first',
        instruction: 'Set the Priority filter to P1.',
        body: 'Working tickets in arrival order is rarely the right call. Impact and urgency combined — priority — is what actually determines the order.',
        waitLabel: 'Next Step: Filtered to P1',
        nudge: 'Use the Priority dropdown and choose P1.',
        check: () => typeof hdState !== 'undefined' && hdState.priorityFilter === 'P1',
      },
      {
        target: '.hd-ticket-row',
        require: true,
        title: 'Open a P1 ticket',
        instruction: 'Click any ticket now showing in the filtered queue.',
        body: 'A P1 ticket carries the tightest SLA in this queue — that’s exactly why it sorts to the top of a real shift.',
        waitLabel: 'Next Step: Opened a P1 ticket',
        nudge: 'Click any row in the filtered queue to open it.',
        check: () => typeof hdCurrentTicket === 'function' && hdCurrentTicket() && hdCurrentTicket().priority === 'P1',
      },
      {
        route: '#/helpdesk/ticket',
        target: '.hd-field-grid',
        title: 'Read the fields that drive the SLA',
        instruction: 'Read the business impact and SLA target before anything else.',
        body: 'Business impact and SLA target are what actually justify the priority — not just a label someone assigned on intake.',
        continueLabel: 'Got it',
      },
      {
        target: '#hd-note-input, #hd-note-input ~ button',
        require: true,
        title: 'Note why this ticket sorts first',
        instruction: 'Write one note explaining the impact and urgency that justify working this ticket first.',
        body: '“It’s P1” is not a justification. Name the actual impact and the SLA deadline driving it.',
        waitLabel: 'Next Step: Note added',
        nudge: 'Type a note and click Add work note.',
        check: () => typeof hdCurrentTicket === 'function' && hdCurrentTicket() && hdCurrentTicket().notes.length > 0,
        finish: { label: 'Finish', href: itsPortalUrl('#/program/it-support/module/10', 'hd-m10') },
      },
    ],
  });
  document.addEventListener('DOMContentLoaded', () => {
    if (new URLSearchParams(location.search).get('coach') === 'hd-m10') {
      setTimeout(() => { hdResetTicketScope(null); if (typeof render === 'function') render(); }, 30);
    }
  });

  /* hd-m11 — Module 11: Customer Service, Documentation & Escalation. One
   * ticket (HD-2113, also reachable unguided from Module 4's scope) whose
   * 'Always' escalation criteria makes it a clean example of recognizing an
   * escalation trigger and writing a handoff-quality note, rather than a
   * fixable-by-L1 ticket. */
  hdRegisterSimpleCoach('hd-m11', 11, 'Writing the Handoff That Actually Helps', 'Work one real ticket end to end, focused on documentation and escalation: recognize the trigger, write a note a stranger could act on, and hand it off cleanly.', ['HD-2113']).steps =
    hdTicketFlowSteps('HD-2113', {
      opening: true, isLast: true, finalStatus: 'Escalated', finishHref: itsPortalUrl('#/program/it-support/module/11', 'hd-m11'),
      openBody: 'Kai’s VPN accepts MFA, connects for a few seconds, then drops — every time.',
      evidenceBody: 'A certificate validation failure with a NotAfter date already in the past is the clue — and it’s the gateway’s certificate, not the user’s.',
      pathBody: 'Capturing the client log and timing, then validating the certificate chain, comes before escalating — show your work, don’t just forward the ticket.',
      diagnosisBody: 'A user certificate that’s valid, paired with an expired gateway certificate, points at the gateway — not the user’s password or home network.',
      noteBody: 'This is the note a stranger has to act on: name the expired-certificate evidence, confirm other users are affected the same way, and state plainly that this needs a certificate renewal — not a per-user fix.',
      resolveBody: 'A shared gateway certificate is outside what a technician replaces alone. Escalate it with a note complete enough that the next person isn’t starting from zero.',
    });
})();
