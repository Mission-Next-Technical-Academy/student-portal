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
    'lab-its-01-ticket-triage': ['HD-2101'],
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
  const TITLES = {
    'lab-its-01-lms-validation': 'Module 01 · LMS & Environment Validation',
    'lab-its-01-ticket-triage': 'Module 01 · Guided Ticket Triage',
    'lab-its-02-vm-build': 'Module 02 · Build Your Windows Client VM',
    'lab-its-02-vm-snapshot-server': 'Module 02 · Snapshot, Recover & Connect',
    'lab-its-02-device-manager': 'Module 02 · The Misbehaving Peripheral',
    'lab-its-02-print-spooler': 'Module 02 · The Stuck Queue and Offline Printer',
    'lab-its-03-blank-desktop': 'Module 03 · The Blank Desktop',
    'lab-its-04-connectivity': 'Module 04 · Connected But Nothing Works',
    'lab-its-05-server-ad': 'Module 05 · Server and Active Directory',
    'lab-its-06-identity-access': 'Module 06 · Restoring Access the Right Way',
    'lab-its-07-app-cert': 'Module 07 · Application and Certificate Support',
    'lab-its-08-unfamiliar-problems': 'Module 08 · Unfamiliar Problems',
    'lab-its-09-security-incidents': 'Module 09 · Security Incidents',
    'lab-its-10-priority-queue': 'Module 10 · Working the Queue by Priority',
    'lab-its-11-handoff-documentation': 'Module 11 · Handoff Documentation',
    'lab-its-12-capstone': 'Module 12 · IT Help Desk Capstone',
  };
  const workTickets = (result) => result.work && Array.isArray(result.work.tickets) ? result.work.tickets : [];
  const text = (value) => value === undefined || value === null || value === '' ? null : String(value);
  const savedNotes = (ticket) => Array.isArray(ticket && ticket.notes) ? ticket.notes.filter((note) => note && note.text) : [];
  const noteResponses = (notes) => notes.map((note) => ({ label: `${note.author || 'Student note'} · ${note.time || ''}`, text: note.text }));
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

  // Module 10 saves every P1 in the queue; the coach asks for one note on one
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

  function coachSections(result, ctx) {
    const key = ctx.row.lab_key;
    // Every saved ticket, from this attempt first, then from any other attempt
    // in the same grading card (Labs 2.3 and 2.4 save the same walkthrough).
    const tickets = [];
    [result].concat(ctx.rows.map((row) => row && row.result)).forEach((saved) => workTickets(saved || {}).forEach((ticket) => {
      if (ticket && ticket.id && !tickets.some((other) => other.id === ticket.id)) tickets.push(ticket);
    }));
    if (key === PRIORITY_KEY) return prioritySections(tickets);
    // A card holding Lab 2.3 and Lab 2.4 grades both labs' tickets, in course order.
    const cardKeys = new Set([key].concat(ctx.rows.map((row) => row && row.lab_key)));
    const ids = Array.from(new Set(Object.keys(TICKETS_BY_LAB).filter((labKey) => cardKeys.has(labKey)).flatMap((labKey) => TICKETS_BY_LAB[labKey])));
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
        {
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
        },
        {
          id: `work-notes-${id.toLowerCase()}`, title: `Work notes · ${id}`, recordedSince: '2026-10-17',
          instructorPrompt: 'Look for the fact, what it proves, and the next action. Give one specific example of how to make the note more useful to the next technician.',
          response: saved ? notes.map((note) => ({ label: `${note.author || 'Student note'} · ${note.time || ''}`, text: note.text })) : [{ label: 'Student work notes', text: null }],
          checks: [{ label: 'A work note was recorded', expected: 'At least one useful work note', test: () => saved ? notes.length > 0 : null, given: () => saved ? `${notes.length} note(s)` : null, fix: help.note }],
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
