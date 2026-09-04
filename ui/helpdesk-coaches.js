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
})();
