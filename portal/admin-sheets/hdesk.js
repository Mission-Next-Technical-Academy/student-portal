/* Help Desk instructor sheets. These use the shared SOC renderer so teachers
 * see one familiar submission layout across tracks. Student work is read only
 * from the saved attempt; older attempts are explicitly marked as unrecorded.
 * The guided simulator's diagnosis result reflects the immediate feedback the
 * learner saw. Narrative work remains a human judgment. */
(() => {
  'use strict';
  if (typeof AdminSubmissionSheet === 'undefined') return;

  // Graded tickets: only the ones each coach walks the student through
  // (hdTicketFlowSteps in ui/helpdesk-coaches.js). Other saved queue tickets
  // show as ungraded context.
  const TICKETS_BY_LAB = {
    'lab-its-01-ticket-triage': ['HD-2150'],
    'lab-its-02-device-manager': ['HD-2106'],
    'lab-its-02-print-spooler': ['HD-2112'],
    'lab-its-03-blank-desktop': ['HD-2109'],
    'lab-its-04-connectivity': ['HD-2104', 'HD-2105'],
    'lab-its-05-server-ad': ['HD-2108', 'HD-2117'],
    'lab-its-06-identity-access': ['SR-2107', 'HD-2118'],
    'lab-its-07-app-cert': ['HD-2119'],
    'lab-its-08-unfamiliar-problems': ['HD-2110', 'HD-2111'],
    'lab-its-09-security-incidents': ['SEC-2114', 'SEC-2115'],
    'lab-its-11-handoff-documentation': ['HD-2113', 'HD-2124'],
  };
  // Lab 1.2 used HD-2101 until 2026-11-09: an attempt saved before then holds
  // HD-2101 and no HD-2150, and keeps the sheet it was worked against.
  const EARLIER_TICKETS_BY_LAB = { 'lab-its-01-ticket-triage': ['HD-2101'] };
  const TITLES = {
    // Retired 2026-11-10; kept so its past attempts still open.
    'lab-its-01-lms-validation': 'Module 01 · LMS & Environment Validation',
    'lab-its-01-ticket-triage': 'Module 01 · Guided Ticket Triage',
    'lab-its-01-practice-tickets': 'Module 01 · Lab 1.2 · Practice tickets',
    'lab-its-02-vm-build': 'Module 04 · Build Your Windows Client VM',
    'lab-its-02-vm-snapshot-server': 'Module 04 · Snapshot, Recover & Connect',
    'lab-its-02-device-manager': 'Module 04 · The Misbehaving Peripheral',
    'lab-its-02-print-spooler': 'Module 04 · The Stuck Queue and Offline Printer',
    'lab-its-03-blank-desktop': 'Module 05 · The Blank Desktop',
    'lab-its-04-connectivity': 'Module 09 · Connected But Nothing Works',
    'lab-its-05-server-ad': 'Module 07 · Server and Active Directory',
    'lab-its-06-identity-access': 'Module 08 · Restoring Access the Right Way',
    'lab-its-07-app-cert': 'Module 06 · Application and Certificate Support',
    'lab-its-08-unfamiliar-problems': 'Module 10 · Unfamiliar Problems',
    'lab-its-09-security-incidents': 'Module 11 · Security Incidents',
    'lab-its-10-priority-queue': 'Module 02 · Lab 2.1 · Guided Lab: queue shift',
    'lab-its-10-practice-tickets': 'Module 02 · Lab 2.2 · Practice tickets (not graded)',
    'lab-its-10-prove-it': 'Module 02 · Prove It: queue shift',
    'lab-its-11-handoff-documentation': 'Module 03 · Handoff Documentation',
    'lab-its-12-capstone': 'Module 12 · IT Help Desk Capstone',
  };
  const workTickets = (result) => result.work && Array.isArray(result.work.tickets) ? result.work.tickets : [];
  const text = (value) => value === undefined || value === null || value === '' ? null : String(value);
  const savedNotes = (ticket) => Array.isArray(ticket && ticket.notes) ? ticket.notes.filter((note) => note && note.text) : [];
  // Riley Morgan is the simulator's technician: the student. Other authors
  // (a recorded requester contact) keep their own label.
  const noteLabel = (note) => `${!note.author || note.author === 'Riley Morgan' ? 'Student work note' : note.author} · ${note.time || ''}`;
  const noteResponses = (notes) => notes.map((note) => ({ label: noteLabel(note), text: note.text }));
  const help = {
    priorityPrompt: 'Ask which business impact and SLA clues support the priority the learner selected.',
    diagnosis: 'Revisit the log or system evidence and explain how it supports your chosen diagnosis.',
    path: 'Add the troubleshooting step you performed and connect it to the evidence you found.',
    note: 'Strengthen this note by naming the finding, what it proves, and the next action another technician should take.',
    disposition: 'Choose resolve or escalate based on the evidence and your authority, then record the safe next step.',
    status: 'Select the ticket state that reflects what is complete and who must act next.',
    firstStep: 'Start with the key information or safety check, then explain why it should come first.',
    reasoning: 'Connect the evidence, diagnosis, and action in your own words.',
    general: 'Acknowledge what the learner recorded, then give one specific next step they can apply on the next ticket.',
  };

  // A saved ticket the coach did not ask the student to work: shown for
  // reference, with no checks and no writing check, so never ✗ or ◐.
  function contextSection(ticket) {
    return {
      id: `context-${String(ticket.id).toLowerCase()}`, title: `Other queue ticket · ${ticket.id}`,
      required: false, mechanics: false,
      instructorPrompt: 'Context only: the coach did not ask the student to work this ticket, so it is not graded. Any notes the student added are shown for reference.',
      answer: [['Issue', text(ticket.description)], ['Priority', text(ticket.priority)], ['Ticket state', text(ticket.status)]],
      response: noteResponses(savedNotes(ticket)),
    };
  }

  const PRIORITY_KEY = 'lab-its-10-priority-queue';
  const priorityFix = 'Explain the business impact and time remaining against the SLA, then state why this ticket comes before the others.';

  // Module 2 (its-10) saves every P1 in the queue; the coach asks for one note on one
  // of them. A P1 with a note is the one the student worked. A note shows;
  // whether it justifies the priority stays the instructor's judgment.
  function prioritySections(tickets) {
    const worked = tickets.filter((ticket) => ticket.priority === 'P1' && savedNotes(ticket).length);
    const graded = worked.length ? worked.map((ticket) => ({
      id: `priority-${ticket.id.toLowerCase()}`, title: `Priority decision · ${ticket.id}`,
      instructorPrompt: help.priorityPrompt,
      answer: [['Ticket', text(ticket.id)], ['Issue', text(ticket.description)], ['Business impact', text(ticket.businessImpact)], ['SLA target', text(ticket.sla)], ['Priority rank', text(ticket.priority)], ['Ticket state', text(ticket.status)]],
      response: noteResponses(savedNotes(ticket)),
      checks: [{ label: 'Priority justification was recorded', expected: 'Impact and SLA reasoning', test: () => true, given: () => `${savedNotes(ticket).length} note(s)`, fix: priorityFix }],
    })) : [{
      id: 'priority-justification', title: 'Priority justification',
      instructorPrompt: help.priorityPrompt,
      answer: [['P1 tickets in the queue', tickets.length ? tickets.map((ticket) => ticket.id).join(', ') : null]],
      response: [{ label: 'Student priority justification', text: null }],
      checks: [{ label: 'A P1 ticket has a priority justification', expected: 'Impact and SLA reasoning on the P1 ticket worked', test: () => tickets.length ? false : null, given: () => tickets.length ? 'No P1 ticket has a note' : null, fix: priorityFix }],
    }];
    return graded.concat(tickets.filter((ticket) => !worked.includes(ticket)).map(contextSection));
  }

  // Lab 2.1 from 2026-11-19 (Module 2, key its-10): the guided queue shift,
  // six practice tickets the coach walks the student through. An attempt
  // that saved one of them gets this sheet; an older attempt (the P1-note
  // coach) keeps prioritySections. Practice It: the checks are feedback for
  // the instructor's decision, never a score. The expected priorities are
  // practice content (ui/helpdesk-data.js priorityCoach on each ticket;
  // tests/hdesk-m02-guided-lab.test.js keeps the two in step), not a Prove
  // It key.
  const QUEUE_TICKETS = [
    { id: 'HD-2158', priority: 'P1', focus: 'The understated P1: two audiences', prompt: 'A whole department can’t take customer calls, however calmly Sam asked. Look for the Service Desk lead being told, the hand-off to Messaging & Collaboration, a note with Reported / Tried / Result / Next action, and a comment in plain words with no internal names.' },
    { id: 'HD-2159', priority: 'P2', focus: 'The Wi-Fi outage: knowledge', prompt: 'Several people in one area: the cause is the network. Look for KB-0063 attached and the outage handled as the parent.' },
    { id: 'HD-2160', priority: 'P2', focus: 'The same outage told badly: link and rewrite', prompt: 'Look for the link to the parent and a rewrite a stranger could follow: who, what, where, when and impact.' },
    { id: 'SEC-2163', priority: 'P2', focus: 'The security ticket', prompt: 'Security goes to the SOC at once. Look for Security Operations as the group and a work note with the indicators (sender, attachment name, what was clicked and when, which laptop).' },
    { id: 'HD-2162', priority: 'P4', focus: 'The overstated low ticket: waiting on the caller', prompt: 'Capital letters aren’t urgency. Look for a question to Priya, On Hold – Awaiting Caller while waiting, then a resolution with a code and notes and a knowledge draft in Review.' },
    { id: 'SR-2161', priority: 'P5', focus: 'The request logged as an incident', prompt: 'Nothing is broken: it is a request. Look for Convert to Request with the manager’s approval on the RITM.' },
  ];
  const QUEUE_IDS = QUEUE_TICKETS.map((entry) => entry.id);
  const QUEUE_GROUPS = { 'HD-2158': 'Messaging & Collaboration', 'SEC-2163': 'Security Operations (SOC)' };
  const queueLabel = (ticket, id) => (ticket && ticket.number) || id;
  const listText = (value) => (Array.isArray(value) && value.length ? value.join(', ') : 'None');
  function queueTicketSection(entry, ticket) {
    const saved = Boolean(ticket);
    const work = saved && ticket.console ? ticket.console : null;
    const matrix = work && work.matrix ? work.matrix : null;
    const cls = work && work.classification ? work.classification : null;
    const writing = saved && ticket.writing ? ticket.writing : null;
    const comments = saved && Array.isArray(ticket.customerComments) ? ticket.customerComments.filter((comment) => comment && comment.text) : [];
    const id = entry.id;
    const has = (value) => (saved ? value : null);
    const checks = [{
      label: 'Priority matches the facts (Impact × Urgency)', expected: entry.priority,
      test: () => (matrix ? (matrix.priority ? matrix.priority === entry.priority : false) : null),
      given: () => (matrix ? (matrix.priority ? `Impact ${matrix.impact} × Urgency ${matrix.urgency} = ${matrix.priority}` : 'Not set') : null),
      fix: 'Set Impact from how much of the business is hurt and Urgency from how fast it grows, never from the caller’s tone, and let Priority calculate.',
    }, {
      label: 'Category and configuration item set', expected: 'Both set',
      test: () => (cls ? (cls.category && cls.ci ? true : false) : null),
      given: () => (cls ? `${[cls.category, cls.subcategory].filter(Boolean).join(' › ') || 'No category'} · ${cls.ci || 'No CI'}` : null),
      fix: 'Set Category / Subcategory from the symptom and the configuration item the ticket is about.',
    }];
    if (id === 'SR-2161') checks.push({ label: 'Converted to a request with its approval', expected: 'Canceled – Converted; RITM Approval = Approved', test: () => (work ? Boolean(work.request && work.request.approval === 'Approved') : null), given: () => (work ? (work.request ? `${work.request.item} for ${work.request.requestedFor} · Approval ${work.request.approval}` : 'Not converted') : null), fix: 'Asking for something new is a request: Convert to Request and choose the catalog item.' });
    if (id === 'HD-2160') {
      checks.push({ label: 'Linked to the outage it belongs to', expected: 'Child of INC0010159', test: () => (work ? work.parent === 'HD-2159' : null), given: () => (work ? (work.parent ? `Child of ${work.parent === 'HD-2159' ? 'INC0010159' : work.parent}` : 'Not linked') : null), fix: 'Two tickets, one cause: link the weaker ticket to the stronger one as related.' });
      checks.push({ label: 'Rewrite names who, what, where, when and impact', expected: 'Nothing missing', test: () => (work ? Array.isArray(work.rewriteMissing) && !work.rewriteMissing.length : null), given: () => (work ? (Array.isArray(work.rewriteMissing) ? (work.rewriteMissing.length ? `Missing: ${work.rewriteMissing.join(', ')}` : 'Every part') : 'Not rewritten') : null), fix: 'Rewrite the short description and description so a stranger can follow them: who, what, where, when and impact.' });
    }
    if (QUEUE_GROUPS[id]) checks.push({ label: `Assigned to ${QUEUE_GROUPS[id]}`, expected: QUEUE_GROUPS[id], test: () => (matrix ? matrix.assignmentGroup === QUEUE_GROUPS[id] : null), given: () => (matrix ? matrix.assignmentGroup || 'Service Desk (Tier 1)' : null), fix: id === 'SEC-2163' ? 'Security goes to Security Operations at once, with the indicators in the work note.' : 'The phone app belongs to Messaging & Collaboration: assign it there and tell the Service Desk lead.' });
    if (id === 'HD-2159') checks.push({ label: 'KB-0063 attached', expected: 'Listed under Related › Knowledge', test: () => (work ? (work.kbAttached || []).includes('KB-0063') : null), given: () => (work ? listText(work.kbAttached) : null), fix: 'Search the KB for the symptom words, open the article that fits and click Attach knowledge.' });
    if (id === 'HD-2162') {
      checks.push({ label: 'Resolved with a resolution code after Priya’s reply', expected: 'Resolved', test: () => (matrix ? matrix.status === 'Resolved' || matrix.status === 'Closed' : null), given: () => (matrix ? `${matrix.status}${ticket.closureCode ? ` · ${ticket.closureCode}` : ''}` : null), fix: 'Ask by Additional comment, set On Hold – Awaiting Caller, and resolve with a code and notes once Priya replies.' });
      checks.push({ label: 'Knowledge draft created', expected: 'State Review', test: () => (work ? work.kbDraft === 'Review' : null), given: () => (work ? work.kbDraft || 'No draft' : null), fix: 'After resolving, click Create knowledge draft so the next technician finds the fix.' });
    }
    if (id === 'HD-2158') checks.push({ label: 'Customer comment free of jargon and internal names', expected: 'None flagged', test: () => (work && comments.length ? !(work.lastCommentJargon || []).length && !(work.lastCommentInternal || []).length : work ? false : null), given: () => (work ? (comments.length ? listText([...(work.lastCommentJargon || []), ...(work.lastCommentInternal || [])]) : 'No comment') : null), fix: 'Write the customer comment in plain words: no internal team or system names, no P1 or SLA.' });
    const notes = savedNotes(ticket).filter((note) => note.author === 'Riley Morgan' || !note.author);
    const response = [
      ...noteResponses(notes),
      ...comments.map((comment) => ({ label: `Customer comment · ${comment.time || ''}`, text: comment.text })),
      ...(saved && ticket.resolution ? [{ label: 'Resolution notes', text: ticket.resolution }] : []),
      ...(writing && writing.shortDescription ? [{ label: 'Rewritten short description', text: writing.shortDescription }, { label: 'Rewritten description', text: writing.description || '(empty)' }] : []),
      ...(writing && writing.kbDraftTitle ? [{ label: 'Knowledge draft title', text: writing.kbDraftTitle }, { label: 'Knowledge draft text', text: writing.kbDraftText || '(empty)' }] : []),
    ];
    return {
      id: `queue-${id.toLowerCase()}`, title: `${entry.focus} · ${queueLabel(ticket, id)}`, recordedSince: '2026-11-19', mechanics: false,
      instructorPrompt: `${entry.prompt} Practice It: these checks inform your decision; they are never a score.`,
      answer: [
        ['Caller', has(text(ticket && ticket.requester))], ['Reported', has(text(ticket && ticket.description))],
        ['Impact × Urgency = Priority', matrix ? (matrix.priority ? `${matrix.impact} × ${matrix.urgency} = ${matrix.priority}` : 'Not set') : has(null)],
        ['Classification', cls ? [cls.category, cls.subcategory, cls.ci, cls.contactType].filter(Boolean).join(' · ') || 'Not set' : has(null)],
        ['State and SLA', matrix ? `${matrix.status} · ${matrix.assignmentGroup || 'Service Desk (Tier 1)'} · SLA ${matrix.sla || '—'}` : has(null)],
      ],
      response: response.length ? response : [{ label: 'Student work notes and comments', text: saved ? 'None' : null }],
      checks,
    };
  }
  function queueSections(tickets, result) {
    const order = result.work && Array.isArray(result.work.workOrder) ? result.work.workOrder : null;
    const orderResult = result.work ? text(result.work.workOrderResult) : null;
    const byId = (id) => tickets.find((ticket) => ticket.id === id) || null;
    return [{
      id: 'queue-work-order', title: 'Work order', recordedSince: '2026-11-19',
      instructorPrompt: 'Priority first, then the SLA clock: the P1 first, the three P2s in any order, then the P4, then the P5. Ask the learner why the order differs from arrival order. Practice It: never a score.',
      answer: [['Student’s work order', order ? (order.length ? order.map((id, index) => `${index + 1}. ${queueLabel(byId(id), id)}`) : 'Not set') : null], ['Check order said', orderResult ? (orderResult === 'ok' ? 'This order works.' : orderResult) : order ? 'Not checked' : null]],
      checks: [{ label: 'Check order accepted the work order', expected: 'This order works', test: () => (order ? orderResult === 'ok' : null), given: () => (orderResult ? (orderResult === 'ok' ? 'Accepted' : orderResult) : order ? 'Not checked' : null), fix: 'Re-sort by Priority, then SLA due, drag the rows into that order and click Check order.' }],
    }].concat(QUEUE_TICKETS.map((entry) => queueTicketSection(entry, byId(entry.id))));
  }

  // Lab 3.1 from 2026-11-21 (Module 3, key its-11): one call, HD-2164
  // (INC0010440), worked with the call and handoff features. An attempt that
  // saved HD-2164 gets this sheet; an older attempt (HD-2113 and HD-2124)
  // keeps the generic ticket sheet. Practice It: the checks inform the
  // instructor's decision, never a score. The mood meter is feedback the
  // student saw and is never saved, so it never shows here. The expected
  // priority is practice content (priorityCoach on the ticket).
  const CALL_KEY = 'lab-its-11-handoff-documentation';
  const CALL_ID = 'HD-2164';
  const CALL_GROUP = 'Desktop Support (Tier 2)';
  function callSections(ticket) {
    const work = ticket && ticket.console ? ticket.console : null;
    const has = Boolean(work);
    const label = (ticket && ticket.number) || CALL_ID;
    const matrix = has && work.matrix ? work.matrix : null;
    const cls = has && work.classification ? work.classification : null;
    const call = has && work.call ? work.call : null;
    const intake = has && work.intake ? work.intake : null;
    const holds = has && work.hold ? work.hold.holds : [];
    const explain = has && work.explain ? work.explain : null;
    const warm = has && Array.isArray(work.warmHandoffs) ? work.warmHandoffs : [];
    const follow = has && work.followUp ? work.followUp : null;
    const checksMade = has && Array.isArray(work.commentChecks) ? work.commentChecks : [];
    const comments = has && Array.isArray(ticket.customerComments) ? ticket.customerComments.filter((comment) => comment && comment.text) : [];
    const notes = has ? savedNotes(ticket).filter((note) => note.author === 'Riley Morgan' || !note.author) : [];
    const yes = (value) => (value ? 'Yes' : 'No');
    const v = (value) => (has ? value : null);
    // A second follow-up set after the update can clear "updated"; the jump
    // plus a later comment still shows the update was posted.
    const updated = follow ? follow.updated || (follow.visited && comments.length >= 2) : false;
    return [
      {
        id: 'call-hd-2164', title: `The call · ${label}`, recordedSince: '2026-11-21', mechanics: false,
        instructorPrompt: 'Wes Turner called, angry, about a slow laptop with a 3:00 deadline. Look for a professional greeting with his name and callback number first, letting him finish before replying, an acknowledgement, three questions, and a hold he was asked about and brought back from in time. Wrong replies the learner tried are listed so they can be discussed; in Practice It they never block the lab.',
        answer: [
          ['Caller and callback number', intake ? `${intake.caller || 'Caller not set'} · ${intake.callback || 'no callback number'}` : v(null)],
          ['Contact type', cls ? cls.contactType || 'Not set' : v(null)],
          ['Interrupted the caller', call ? String(call.interruptions) : v(null)],
          ['Wrong replies tried first', call ? (call.wrong.length ? call.wrong : 'None') : v(null)],
          ['Questions asked', has ? (work.chatAsked.length ? work.chatAsked : 'None') : null],
          ['Holds', has ? (holds.length ? holds.map((hold) => `${hold.seconds} seconds · ${hold.asked ? 'asked first' : 'not asked'}${hold.over ? ' · too long' : ''}`) : 'None') : null],
          ['Evidence opened', has ? (Array.isArray(work.evidenceOpened) && work.evidenceOpened.length ? work.evidenceOpened : 'None') : null],
          ['Knowledge Base articles opened', has ? (work.kbOpened.length ? work.kbOpened : 'None') : null],
        ],
        checks: [
          { label: 'Caller details taken first', expected: 'Wes Turner and a callback number', test: () => (intake ? intake.caller === 'Wes Turner' && Boolean(intake.callback) : v(false)), given: () => (intake ? `${intake.caller || 'Not set'} · ${intake.callback || 'Not set'}` : v('Not set')), fix: 'Greet with your name and the desk, then get the caller’s name and a callback number before anything else.' },
          { label: 'Let him finish, then acknowledged', expected: 'The scripted call completed', test: () => (call ? call.done : v(false)), given: () => (call ? `${call.done ? 'Completed' : 'Not completed'} · interrupted ${call.interruptions} time(s)` : v('Not started')), fix: 'Let a stressed caller finish, then name the impact: CALM’s C and A.' },
          { label: 'Asked before the hold and came back in time', expected: 'One hold: asked first, under 2 minutes', test: () => (has ? holds.some((hold) => hold.asked && !hold.over) : null), given: () => (has ? (holds.length ? `${holds.length} hold(s)` : 'No hold') : null), fix: 'Ask “May I put you on a short hold?” first, and come back within two minutes.' },
          { label: 'Device health card read', expected: 'Opened', test: () => (has ? (work.evidenceOpened || []).includes('device-health') : null), given: () => (has ? yes((work.evidenceOpened || []).includes('device-health')) : null), fix: 'Open the ticket’s Device health card: it shows the disk warning.' },
          { label: 'KB-0067 opened', expected: 'Opened', test: () => (has ? work.kbOpened.includes('KB-0067') : null), given: () => (has ? yes(work.kbOpened.includes('KB-0067')) : null), fix: 'Search the KB for “disk warning” and open KB-0067: it says what Tier 1 does.' },
        ],
      },
      {
        id: 'triage-hd-2164', title: `Triage · ${label}`, recordedSince: '2026-11-21', mechanics: false,
        instructorPrompt: 'His anger doesn’t set the priority; the 3:00 deadline does. One person whose work has stopped with a deadline today: Impact 3 × Urgency 1 = P3.',
        answer: [
          ['Impact × Urgency = Priority', matrix ? (matrix.priority ? `${matrix.impact} × ${matrix.urgency} = ${matrix.priority}` : 'Not set') : v(null)],
          ['Classification', cls ? [cls.category, cls.subcategory, cls.ci].filter(Boolean).join(' · ') || 'Not set' : v(null)],
        ],
        checks: [
          { label: 'Priority matches the facts', expected: 'P3', test: () => (matrix ? matrix.priority === 'P3' : v(false)), given: () => (matrix ? matrix.priority || 'Not set' : v('Not set')), fix: 'Set Impact from who is affected and Urgency from the deadline, never from the caller’s tone.' },
          { label: 'Category and configuration item set', expected: 'Hardware › Laptop · NS-LT-0236', test: () => (cls ? cls.category === 'Hardware' && cls.ci === 'NS-LT-0236' : v(false)), given: () => (cls ? `${cls.category || 'No category'} · ${cls.ci || 'No CI'}` : v('Not set')), fix: 'Set the category from the symptom and the configuration item to his laptop.' },
        ],
      },
      {
        id: 'explain-hd-2164', title: `Plain words · ${label}`, recordedSince: '2026-11-21', mechanics: false,
        instructorPrompt: 'What the learner told Wes about the next step. Look for the effect in his words (the part that stores his files is wearing out), what happens next, and that his files are safe, with no technical terms.',
        response: [{ label: 'Student explanation to the caller', text: explain ? explain.text || 'None' : v(null) }],
        answer: [['Tries before it passed', explain ? String(explain.tries) : v(null)]],
        checks: [{ label: 'Explained with no flagged terms', expected: 'No jargon', test: () => (explain ? explain.passed : v(false)), given: () => (explain ? (explain.passed ? 'Passed' : `Flagged: ${(explain.flagged || []).join(', ') || 'not checked'}`) : v('Not explained')), fix: 'Say what it means for him, not what the part is called.' }],
      },
      {
        id: 'handoff-hd-2164', title: `Handoff · ${label}`, recordedSince: '2026-11-21',
        instructorPrompt: 'The note Desktop Support reads. Look for his words and the 3:00 deadline (Reported), what was checked, found and ruled out (Tried), why it can’t be finished at Tier 1 (Result), and the exact ask, who, by when and when Wes hears next (Next action). It’s time-critical, so a warm handoff is expected.',
        response: notes.length ? noteResponses(notes) : [{ label: 'Student work notes', text: v('None') }],
        answer: [['Assignment group', matrix ? matrix.assignmentGroup || 'Service Desk (Tier 1)' : v(null)], ['Warm handoff', has ? (warm.length ? warm.map((entry) => `Called ${entry.group} · ${entry.at}`) : 'None') : null]],
        checks: [
          { label: `Assigned to ${CALL_GROUP}`, expected: CALL_GROUP, test: () => (matrix ? matrix.assignmentGroup === CALL_GROUP : v(false)), given: () => (matrix ? matrix.assignmentGroup || 'Service Desk (Tier 1)' : v('Not set')), fix: 'A failing disk needs hands-on repair: reassign to Desktop Support.' },
          { label: 'Handoff note has all four labels', expected: 'Reported, Tried, Result, Next action', test: () => (has ? Array.isArray(work.handoffMissing) && !work.handoffMissing.length : null), given: () => (has ? (Array.isArray(work.handoffMissing) ? (work.handoffMissing.length ? `Missing: ${work.handoffMissing.join(', ')}` : 'All four') : 'Not reassigned') : null), fix: 'Write the latest work note with Reported, Tried, Result and Next action, so a stranger can act on it.' },
          { label: 'Warm handoff logged', expected: 'Called the team', test: () => (has ? warm.length > 0 : null), given: () => (has ? (warm.length ? 'Yes' : 'No') : null), fix: 'Urgent tickets get a warm handoff: call the team as well as writing the note.' },
        ],
      },
      {
        id: 'updates-hd-2164', title: `Updates to Wes · ${label}`, recordedSince: '2026-11-21', mechanics: false,
        instructorPrompt: 'Look for who has it, what happens next and when he’ll hear again, with an update time and never a fix time (Desktop Support sets that). Then an update at the follow-up time, even with no news.',
        response: comments.length ? comments.map((comment) => ({ label: `Customer comment · ${comment.time || ''}`, text: comment.text })) : [{ label: 'Customer comment', text: v('No customer comment') }],
        answer: [['Follow-up', follow ? (follow.at || 'Not set') : v(null)], ['Went to the follow-up time', follow ? yes(follow.visited) : v(null)]],
        checks: [
          { label: 'A comment with an update time and no fix-time promise', expected: 'Yes', test: () => (has ? checksMade.some((entry) => entry.hasTime && !entry.promise) : null), given: () => (has ? `${checksMade.length} comment(s) checked${checksMade.some((entry) => entry.promise) ? ' · one promised a fix time first' : ''}` : null), fix: 'Commit to when you’ll update him, not when it will be fixed.' },
          { label: 'Follow-up set', expected: 'A follow-up time on the ticket', test: () => (follow ? Boolean(follow.at) : v(false)), given: () => (follow ? follow.at || 'Not set' : v('Not set')), fix: 'Set a Follow-up on the ticket for the time you promised.' },
          { label: 'Update posted at the follow-up time', expected: 'Within 10 minutes of the follow-up', test: () => (follow ? updated : v(false)), given: () => (follow ? yes(updated) : v('No')), fix: 'At the follow-up time, post the update you promised, even when there’s no news yet.' },
        ],
      },
    ];
  }

  // HD-2101 (Lab 1.2) is worked on the simulated machines: the sheet reads its
  // investigation (outcomes, typed commands and key results) instead of the
  // step checklist and diagnosis dropdown, which that ticket doesn't show.
  const INVESTIGATION_CHECKS = [
    ['identityVerified', 'Caller verified per KB-0024', 'Callback on the User Directory number', 'Verify every caller the KB-0024 way before any account action: call back on the number in the User Directory, never ask for a password.'],
    ['sourceFound', 'Lockout source found', 'Caller computer from event 4740 or lockout details', 'Find the computer named as the caller in event 4740 (Event Viewer or Lockout details) before changing anything.'],
    ['taskInspected', 'Cause found on the caller computer', 'FinanceReportSync stores the old password', 'Connect to the caller computer and check what runs with the user’s account (Get-ScheduledTask), then name it in your note.'],
    ['credentialFixed', 'Stored credential updated the approved way', 'Set-ScheduledTask or schtasks /Change, user types the password', 'Fix the cause before unlocking: update the stored credential through the approved workflow, so the user types the password.'],
    ['unlockedAfterFix', 'Unlocked once, after the fix', 'Account unlocked with the credential current', 'Unlock once, after the cause is fixed; unlocking first only buys a few minutes.'],
    ['verified', 'Verified no new 4740 after the next run', 'A clean task run, then a lockout check', 'Prove the fix holds: after the task runs again, show there is no new 4740 and the account is still unlocked.'],
    ['noteComplete', 'Reported / Tried / Result note', 'All three parts', 'Write the note in three parts so the next technician can follow it: Reported, Tried, Result.'],
  ];
  const IDENTITY_TEXT = { callback: 'Callback on the User Directory number', name: 'Accepted the caller’s own details', password: 'Asked for the password' };
  function investigationSections(ticket) {
    const work = ticket ? ticket.investigation : null;
    const has = Boolean(work);
    const yes = (value) => (value ? 'Yes' : 'No');
    const tries = has ? work.identity.tries : [];
    const commands = has ? work.events.filter((event) => event.type === 'command_run') : [];
    return [
      {
        id: 'investigation-hd-2101', title: 'Investigation · HD-2101', recordedSince: '2026-11-03',
        instructorPrompt: 'Read how the learner reached each outcome. Any order is valid; what counts is the cause found, the credential fixed before or alongside the final unlock, the fix verified and the work documented. Re-locks the learner caused by unlocking first are part of Practice, not a penalty.',
        answer: [
          ['Caller verification', has ? (tries.length ? tries.map((choice) => IDENTITY_TEXT[choice] || choice).join(' → ') : 'Not answered') : null],
          ['Lockout source found with', has ? (work.sourceFoundVia.length ? work.sourceFoundVia : 'Not found') : null],
          ['Stored credential updated', has ? (work.credentialFixedBy ? `${work.credentialFixedBy} at ${work.credentialFixedAt}` : 'Not updated') : null],
          ['Unlocks', has ? (work.unlocks.length ? work.unlocks.map((unlock) => `${unlock.at} · ${unlock.via} · ${unlock.credentialCurrent ? 'after the fix' : 'before the fix'}`) : 'None') : null],
          ['Re-locks the learner caused', has ? String(work.relocks) : null],
          ['Verified with', has ? (work.verifiedBy ? `${work.verifiedBy} at ${work.verifiedAt}` : 'Not verified') : null],
          ['End state', has ? `Account ${work.end.accountLocked ? 'locked' : 'unlocked'} · stored credential ${work.end.taskCredential || 'unknown'} · last task result ${work.end.taskLastResult || 'unknown'}` : null],
          ['Hints used', has ? String(work.hintsUsed) : null],
          // A flag for the instructor, not a check: it never changes the sheet's verdict.
          ['Password in a ticket field', has ? (work.passwordWritten === true ? 'Wrote a password in a ticket field (refused, not recorded)' : 'Did not') : null],
        ],
        checks: INVESTIGATION_CHECKS.map(([key, label, expected, fix]) => ({
          label, expected, test: () => (has ? work.outcomes[key] === true : null),
          given: () => (has ? yes(work.outcomes[key] === true) : null), fix,
        })).concat([{
          label: 'Never asked the caller for a password', expected: 'The help desk never asks for a password',
          test: () => (has ? !tries.includes('password') : null),
          given: () => (has ? (tries.includes('password') ? 'Chose “ask for the password” before correcting it' : 'Did not ask') : null),
          fix: 'The help desk never asks for a password, for any reason. Verify by calling back on the number in the User Directory (KB-0024).',
        }, {
          label: 'Never typed a password into the shell', expected: 'The user types it at the secure prompt',
          test: () => (has ? !work.passwordTyped : null),
          given: () => (has ? (work.passwordTyped ? 'Typed a password into a command (refused, not recorded)' : 'Did not') : null),
          fix: 'Never type a user’s password yourself. Run the approved command without one; the user types it at the secure prompt on their own screen.',
        }]),
      },
      {
        id: 'commands-hd-2101', title: 'Commands and key results · HD-2101', required: false, recordedSince: '2026-11-03',
        instructorPrompt: 'The commands the learner typed, in order, with what each one showed. Use them to ask what the learner concluded from a result, or which command they would run first next time.',
        answer: [['Commands typed', has ? (commands.length ? commands.map((event) => `[${event.computer || '?'}] ${event.command}${event.result ? ` → ${event.result}` : ''}`) : 'No commands typed') : null]],
      },
    ];
  }

  // HD-2150 (Lab 1.2 from 2026-11-09) is worked through the console alone:
  // the sheet reads its console work (how the caller was verified, the
  // unlock, the chat, the customer comment) instead of the step checklist and
  // diagnosis dropdown, which that ticket doesn't show. Practice It: a failing
  // row here never blocks the save or module progress.
  const VERIFY_TEXT = { callback: 'Callback on the directory number + employee ID', name: 'Accepted the name and department', password: 'Asked for the password' };
  function consoleSections(ticket) {
    const work = ticket && ticket.console ? ticket.console : null;
    const has = Boolean(work);
    const outcome = (key) => (has && work.outcomes ? work.outcomes[key] === true : null);
    const critical = (choice) => (has ? work.verification.criticalErrors.includes(choice) : null);
    const comments = has && Array.isArray(ticket.customerComments) ? ticket.customerComments.filter((comment) => comment && comment.text) : [];
    const id = ticket ? ticket.id : 'HD-2150';
    return [
      {
        id: `verification-${id.toLowerCase()}`, title: `Caller verification and unlock · ${id}`, recordedSince: '2026-11-09',
        instructorPrompt: 'KB-0024: verify before any account action. Every choice the learner made is listed in order. A critical error is shown even when the learner corrected it, so it can be discussed; in Practice It it never blocks the lab.',
        answer: [
          ['Verification choices, in order', has ? (work.verification.tries.length ? work.verification.tries.map((choice) => VERIFY_TEXT[choice] || choice).join(' → ') : 'Not answered') : null],
          ['Unlocks', has ? String(work.unlocks) : null],
          ['Account at the end', has ? (work.accountUnlocked ? 'Unlocked' : 'Locked') : null],
          ['Knowledge Base searches', has ? (work.kbSearches.length ? work.kbSearches : 'None') : null],
          ['Articles opened', has ? (work.kbOpened.length ? work.kbOpened : 'None') : null],
          ['Questions asked in the chat', has ? (work.chatAsked.length ? work.chatAsked : 'None') : null],
          // Flags for the instructor, not checks: they never change the verdict.
          ['Asked for a password in the chat', has ? (work.passwordAsked ? 'Yes (refused, never sent to the caller)' : 'Did not') : null],
          ['Password in a ticket field', has ? (work.passwordWritten ? 'Wrote a password in a ticket field (refused, not recorded)' : 'Did not') : null],
        ],
        checks: [
          { label: 'Caller verified per KB-0024', expected: 'Callback on the User Directory number and the employee ID', test: () => (has ? work.verification.passed : null), given: () => (has ? (work.verification.passed ? 'Yes' : 'No') : null), fix: 'Verify every caller the KB-0024 way before any account action: call back on the number in the User Directory and confirm the employee ID.' },
          { label: 'Critical error: accepted a name and department as verification', expected: 'Never', test: () => (has ? !critical('name') : null), given: () => (has ? (critical('name') ? 'Chose it' : 'Did not') : null), fix: 'A name and department are not verification: anyone can learn them. Call back on the directory number and confirm the employee ID (KB-0024).' },
          { label: 'Critical error: asked the caller for their password', expected: 'Never', test: () => (has ? !critical('password') : null), given: () => (has ? (critical('password') ? 'Chose it' : 'Did not') : null), fix: 'The help desk never asks for a password, for any reason (KB-0024).' },
          { label: 'Account unlocked after verifying', expected: 'Unlocked once, after a passing verification', test: () => outcome('unlocked'), given: () => (has ? (outcome('unlocked') ? 'Yes' : 'No') : null), fix: 'Once the caller is verified, unlock the account on the account card (KB-0024).' },
          { label: 'User confirmed they can sign in', expected: 'The user signs in while you are still on the call', test: () => outcome('confirmed'), given: () => (has ? (outcome('confirmed') ? 'Yes' : 'No') : null), fix: 'Ask the user to sign in again slowly with Caps Lock off, and confirm it works from their side.' },
        ],
      },
      {
        id: `customer-comment-${id.toLowerCase()}`, title: `Customer comment · ${id}`, recordedSince: '2026-11-09',
        // The shared proofreading reads a sign-off ("– Riley, Northstar
        // Service Desk") as a sentence with no end punctuation, so it would
        // flag every signed comment, the spec's model one included.
        mechanics: false,
        instructorPrompt: 'The customer reads this comment. Look for plain words, what was done, and what to do if the lockout comes back (KB-0024: a lockout that returns within a day goes to Tier 2).',
        response: has ? (comments.length ? comments.map((comment) => ({ label: `Customer comment · ${comment.time || ''}`, text: comment.text })) : [{ label: 'Customer comment', text: 'No customer comment' }]) : [{ label: 'Customer comment', text: null }],
        answer: [['Internal terms in the last comment', has ? (work.lastCommentJargon.length ? work.lastCommentJargon : 'None') : null]],
        checks: [
          { label: 'Says what to do if it happens again', expected: 'A line telling the user what to do if the lockout comes back', test: () => (has ? work.commentRepeatLine : null), given: () => (has ? (work.commentRepeatLine ? 'Yes' : 'No') : null), fix: 'Tell the user what to do if it locks again (reply or call back), and that the next-level team will then find out why.' },
        ],
      },
    ];
  }

  function coachSections(result, ctx) {
    const key = ctx.row.lab_key;
    // Every saved ticket, from this attempt first, then from any other attempt
    // in the same grading card (Labs 2.3 and 2.4 save the same walkthrough).
    const tickets = [];
    [result].concat(ctx.rows.map((row) => row && row.result)).forEach((saved) => workTickets(saved || {}).forEach((ticket) => {
      if (ticket && ticket.id && !tickets.some((other) => other.id === ticket.id)) tickets.push(ticket);
    }));
    if (key === PRIORITY_KEY) {
      // Chosen from this attempt's own tickets: the card may also hold older attempts.
      const own = workTickets(result);
      return own.some((ticket) => QUEUE_IDS.includes(ticket.id)) ? queueSections(own, result) : prioritySections(tickets);
    }
    if (key === CALL_KEY) {
      // Chosen from this attempt's own tickets, as Lab 2.1 is.
      const call = workTickets(result).find((ticket) => ticket.id === CALL_ID);
      if (call) return callSections(call);
    }
    // A card holding Lab 4.3 and Lab 4.4 grades both labs' tickets, in course order.
    const cardKeys = new Set([key].concat(ctx.rows.map((row) => row && row.lab_key)));
    const ticketsFor = (labKey) => {
      const current = TICKETS_BY_LAB[labKey];
      const earlier = EARLIER_TICKETS_BY_LAB[labKey];
      const saved = (list) => list.some((id) => tickets.some((ticket) => ticket.id === id));
      return earlier && !saved(current) && saved(earlier) ? earlier : current;
    };
    const ids = Array.from(new Set(Object.keys(TICKETS_BY_LAB).filter((labKey) => cardKeys.has(labKey)).flatMap(ticketsFor)));
    return ids.flatMap((id) => {
      const ticket = tickets.find((entry) => entry.id === id) || null;
      const saved = Boolean(ticket);
      const diagnosisCheck = {
        label: 'Diagnosis checkpoint shown to the student',
        expected: 'The student should identify a cause supported by the ticket evidence.',
        test: () => !saved || ticket.diagnosisCorrect === null ? null : ticket.diagnosisCorrect,
        given: () => !saved ? null : ticket.diagnosis ? `${ticket.diagnosis} · ${ticket.diagnosisCorrect ? 'student saw “Supported by the evidence”' : 'student saw “Not sufficiently supported”'}` : 'No diagnosis submitted',
        fix: help.diagnosis,
      };
      const notes = saved ? (ticket.notes || []).filter((note) => note && note.text) : [];
      const history = saved ? (ticket.statusHistory || []).map((entry) => `${entry.time}: ${entry.action}`) : null;
      const worked = id === 'HD-2101' ? investigationSections(saved ? { ...ticket, investigation: result.work && result.work.investigation } : null)
        : id === 'HD-2150' ? consoleSections(saved ? ticket : null) : null;
      // HD-2150's note has three parts (Reported / Tried / Result).
      const noteParts = id === 'HD-2150' ? [{
        label: 'Reported / Tried / Result note', expected: 'All three parts', test: () => (saved && ticket.console && ticket.console.outcomes ? ticket.console.outcomes.note === true : null),
        given: () => (saved && ticket.console ? (ticket.console.outcomes && ticket.console.outcomes.note ? 'All three parts' : `Missing: ${(ticket.console.noteMissing || []).join(', ') || 'a complete note'}`) : null),
        fix: 'Write the note in three parts so the next technician can follow it: Reported, Tried, Result.',
      }] : [];
      return [
        {
          id: `scenario-${id.toLowerCase()}`, title: `Ticket and evidence · ${id}`, required: false, recordedSince: '2026-10-17',
          instructorPrompt: 'Use the requester statement, impact, symptoms, system state and logs as the context for reviewing the student’s decisions.',
          answer: [
            ['Requester', saved ? text(ticket.requester) : null], ['Issue type', saved ? [ticket.category, ticket.subcategory].filter(Boolean).join(' · ') : null], ['Issue', saved ? text(ticket.description) : null],
            ['Business impact', saved ? text(ticket.businessImpact) : null], ['SLA target', saved ? text(ticket.sla) : null],
            ['Symptoms', saved ? ticket.symptoms : null], ['System state', saved ? ticket.systemState : null], ['Logs and evidence', saved ? ticket.logs : null],
          ],
        },
        {
          id: `ticket-details-${id.toLowerCase()}`, title: `Ticket details · ${id}`, recordedSince: '2026-10-17',
          instructorPrompt: help.general,
          answer: [['Priority', saved ? text(ticket.priority) : null], ['Assigned technician', saved ? text(ticket.assignedTechnician) : null], ['Current state', saved ? text(ticket.status) : null], ['Linked problem', saved ? text(ticket.linkedProblem) : null]],
          checks: [{ label: 'Ticket details were recorded', test: () => saved ? Boolean(ticket.status) : null, given: () => saved ? `${ticket.priority || 'Priority not changed'} · ${ticket.status || 'No state recorded'}` : null, fix: help.status }],
        },
        ...(worked || [{
          id: `troubleshooting-${id.toLowerCase()}`, title: `Troubleshooting path · ${id}`, recordedSince: '2026-10-17',
          instructorPrompt: 'Ask which step produced the most useful evidence and whether any safety or approval check was needed.',
          answer: [['Steps the student checked', saved ? ticket.checkedSteps : null], ['Scenario reference: expected path', saved ? ticket.expectedPath : null]],
          checks: [{ label: 'Troubleshooting steps were documented', expected: 'Steps checked while working the ticket', test: () => saved ? (ticket.checkedSteps || []).length > 0 : null, given: () => saved ? `${(ticket.checkedSteps || []).length} step(s)` : null, fix: help.path }],
        },
        {
          id: `diagnosis-${id.toLowerCase()}`, title: `Diagnosis · ${id}`, recordedSince: '2026-10-17',
          instructorPrompt: 'Compare the diagnosis and the student-visible checkpoint result. If it was incorrect, direct the learner back to the evidence they should reconsider.',
          answer: [['Diagnosis entered', saved ? text(ticket.diagnosis) : null], ['Scenario reference: expected cause', saved ? text(ticket.expectedDiagnosis) : null]],
          checks: [diagnosisCheck],
        }]),
        {
          id: `work-notes-${id.toLowerCase()}`, title: `Work notes · ${id}`, recordedSince: '2026-10-17',
          instructorPrompt: 'Look for the fact, what it proves, and the next action. Give one specific example of how to make the note more useful to the next technician.',
          response: saved ? noteResponses(notes) : [{ label: 'Student work notes', text: null }],
          checks: [{ label: 'A work note was recorded', expected: 'At least one useful work note', test: () => saved ? notes.length > 0 : null, given: () => saved ? `${notes.length} note(s)` : null, fix: help.note }].concat(noteParts),
        },
        {
          id: `resolution-${id.toLowerCase()}`, title: `Resolution and history · ${id}`, recordedSince: '2026-10-17',
          instructorPrompt: 'Check that the recorded action matches the ticket state. Explain what the learner or next team must verify before closing.',
          answer: [['Expected ticket state', saved ? text(ticket.expectedStatus) : null], ['Student resolution / escalation', saved ? text(ticket.resolution) : null], ['Closure code', saved ? text(ticket.closureCode) : null], ['Recent ticket history', history]],
          checks: [{ label: 'Ticket outcome matches the scenario', expected: saved ? ticket.expectedStatus : null, test: () => !saved || !ticket.expectedStatus ? null : ticket.status === ticket.expectedStatus, given: () => saved ? ticket.resolution || ticket.status : null, fix: help.disposition }],
        },
      ];
    }).concat(tickets.filter((ticket) => !ids.includes(ticket.id)).map(contextSection));
  }

  function evidenceSections(result, ctx) {
    const key = ctx.row.lab_key;
    const files = Array.isArray(result.evidence_files) ? result.evidence_files : [];
    const expectedFields = {
      'lab-its-01-lms-validation': [['evidence1', 'Sandbox desktop screenshot'], ['evidence2', 'LMS sign-in screenshot']],
      'lab-its-02-vm-build': [['evDesktop', 'Finished Windows desktop'], ['evVmSettings', 'VM settings summary']],
      'lab-its-02-vm-snapshot-server': [['evSnapshot', 'Snapshot list'], ['evPing1', 'Ping: client to server'], ['evPing2', 'Ping: server to client']],
    }[key] || [];
    const section = {
      id: 'submitted-evidence', title: 'Evidence files', instructorPrompt: 'Open each screenshot in the Student evidence files panel below. Tell the learner what is visible and identify any missing setup detail.',
      answer: expectedFields.map(([field, label]) => {
        const file = files.find((entry) => entry && entry.field === field);
        return [label, file ? `${file.name || 'Uploaded'} · ${file.size ? `${Math.round(file.size / 1024)} KB` : 'size unavailable'}` : null];
      }),
      checks: expectedFields.map(([field, label]) => {
        const found = files.some((entry) => entry && entry.field === field);
        return { label: `${label} attached`, expected: label, test: () => found, given: () => found ? 'Uploaded' : 'Not attached', fix: `Attach the ${label.replace(/ screenshot$/i, '')} screenshot.` };
      }),
    };
    if (key === 'lab-its-01-lms-validation') return [section, {
      id: 'aup', title: 'Acceptable Use Policy', instructorPrompt: 'If the acknowledgment is missing, ask the learner to read the policy and confirm it before continuing.',
      answer: [['Acknowledged', result.aup === true ? 'Yes' : result.aup === false ? 'No' : null]],
      checks: [{ label: 'AUP acknowledgment recorded', test: () => result.aup === true, given: () => result.aup === true ? 'Acknowledged' : 'Not acknowledged', fix: 'Read the Acceptable Use Policy and check the acknowledgment box.' }],
    }];
    return [section];
  }

  // Lab 1.2, the practice tickets: a completion record only (no score, no
  // answers), saved when the simulator reports all three tickets closed.
  // Practice It is never reviewed: nothing here is a decision.
  function practiceCompletionSections(result, ctx) {
    const tickets = Array.isArray(result.tickets) ? result.tickets.filter((id) => typeof id === 'string') : [];
    const completedAt = ctx && ctx.row && ctx.row.completed_at;
    return [{
      id: 'practice-completion', title: 'Practice completion', required: false, instructorPrompt: 'Practice only, not graded. The student finished every practice ticket (resolved or escalated each one); no score and no answers are saved. Nothing to grade here: use this module’s Prove It for review.',
      answer: [['Completed', completedAt ? new Date(completedAt).toLocaleString() : null], ['Tickets finished', tickets.length ? tickets.join(', ') : null], ['Graded', 'No: Practice It, no score and no answers saved']],
    }];
  }

  function capstoneSections(result) {
    const tickets = typeof ITS12_TICKETS !== 'undefined' ? ITS12_TICKETS : [];
    const responses = result.ticketResponses && typeof result.ticketResponses === 'object' ? result.ticketResponses : {};
    const sections = tickets.map((ticket) => {
      const response = responses[ticket.id] || {};
      // Any order inside the priority band earns the credit; the exact SLA
      // order inside a band of two or more shows as "exceeds", score unchanged.
      const band = its12BandPositions(ticket);
      const priorityOk = its12RankInBand(ticket, response.priority);
      const bandNote = band.size === 1 ? `Only ticket in the ${ticket.priority} band`
        : priorityOk && its12BandExceeds(ticket, responses) ? `Exceeds: SLA order inside the ${ticket.priority} band` : '';
      const categoryOk = response.category === ticket.category;
      const stepOk = its12FirstStepOk(ticket, response.firstStep);
      const decisionOk = response.decision === ticket.decision;
      const reasoningText = String(response.reasoning || '').trim();
      const reasoningOk = ticket.reasoningPattern.test(reasoningText) && reasoningText.length >= 15;
      return {
        id: `capstone-${ticket.id.toLowerCase()}`, title: `${ticket.id} · ${ticket.from}`, instructorPrompt: ticket.explain, recordedSince: '2026-10-17',
        answer: [['Priority rank', text(response.priority)], ['Category', text(response.category)], ['First diagnostic step', text(response.firstStep)], ['Decision', text(response.decision)]],
        response: [{ label: 'Student reasoning', text: text(response.reasoning) }],
        checks: [
          { label: 'Priority reflects the ticket’s impact and urgency', expected: band.size === 1 ? `${ticket.priority} band, rank ${band.first}` : `${ticket.priority} band, rank ${band.first}–${band.last}`, test: () => response.priority === undefined ? null : priorityOk, given: () => [text(response.priority) || 'Not answered', bandNote].filter(Boolean).join(' · '), fix: 'Weigh this ticket’s business impact and urgency against the rest of the queue, then rank it again.' },
          { label: 'Category fits the reported issue', expected: ticket.category, test: () => !response.category ? null : categoryOk, given: () => text(response.category), fix: `Choose the category that best matches this issue, then explain the evidence for it.` },
          { label: 'First step addresses the issue safely', test: () => !response.firstStep ? null : stepOk, given: () => text(response.firstStep), fix: help.firstStep },
          { label: 'Resolve or escalate decision', expected: ticket.decision, test: () => !response.decision ? null : decisionOk, given: () => text(response.decision), fix: help.disposition },
          { label: 'Reasoning connects evidence to the decision', test: () => !reasoningText ? null : reasoningOk, given: () => text(response.reasoning), fix: help.reasoning },
        ],
      };
    });
    const kb = text(result.kbArticle);
    const after = text(result.afterAction);
    sections.push({
      id: 'knowledge-article', title: 'Knowledge base article', instructorPrompt: 'Help the learner make this reusable: symptom, cause, approved fix, and how to verify it worked.', recordedSince: '2026-10-17',
      response: [{ label: 'Student article', text: kb }],
      checks: [{ label: 'Article includes a useful troubleshooting sequence', test: () => !kb ? null : kb.trim().length >= 80 && /(symptom|cause|fix|resolv|verif)/i.test(kb), given: () => kb ? `${kb.length} characters` : null, fix: 'Add the symptom, likely cause, approved fix, and verification result so another technician can follow it.' }],
    }, {
      id: 'after-action', title: 'After-action review', instructorPrompt: 'Invite a specific reflection: what worked, what they would change, and what they learned.', recordedSince: '2026-10-17',
      response: [{ label: 'Student reflection', text: after }],
      checks: [{ label: 'Reflection gives a specific learning point', test: () => !after ? null : after.trim().length >= 40, given: () => after ? `${after.length} characters` : null, fix: 'Add a specific reflection about what worked, what you would change, and what you learned.' }],
    });
    return sections;
  }

  const COACH_KEYS = Object.keys(TICKETS_BY_LAB).concat(PRIORITY_KEY);
  COACH_KEYS.forEach((key) => AdminSubmissionSheet.register(key, {
    title: TITLES[key],
    caseId: (result) => workTickets(result).map((ticket) => ticket.id).join(', ') || null,
    sections: coachSections,
  }));

  ['lab-its-01-lms-validation', 'lab-its-02-vm-build', 'lab-its-02-vm-snapshot-server'].forEach((key) => {
    AdminSubmissionSheet.register(key, { title: TITLES[key], sections: evidenceSections });
  });

  // Module 1's and Module 2's practice tickets: a completion record only.
  ['lab-its-01-practice-tickets', 'lab-its-10-practice-tickets'].forEach((key) => {
    AdminSubmissionSheet.register(key, {
      title: TITLES[key],
      caseId: (result) => (Array.isArray(result.tickets) ? result.tickets.filter((id) => typeof id === 'string').join(', ') : '') || null,
      sections: practiceCompletionSections,
    });
  });

  AdminSubmissionSheet.register('lab-its-12-capstone', {
    title: TITLES['lab-its-12-capstone'],
    caseId: () => 'Northstar Help Desk · six-ticket integrated capstone',
    rubric: {
      labels: { triage: 'Triage & prioritization', technical: 'Technical accuracy', communication: 'Communication', escalation: 'Escalation judgment', security: 'Security judgment', kb: 'Knowledge base article', afterAction: 'After-action review' },
      max: { triage: 15, technical: 20, communication: 15, escalation: 15, security: 10, kb: 15, afterAction: 10 },
    },
    sections: capstoneSections,
  });
})();
