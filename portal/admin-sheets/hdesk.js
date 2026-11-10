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
    'lab-its-01-practice-tickets': 'Module 01 · Lab 1.2 · Practice tickets (not graded)',
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
    if (key === PRIORITY_KEY) return prioritySections(tickets);
    // A card holding Lab 2.3 and Lab 2.4 grades both labs' tickets, in course order.
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
      id: 'practice-completion', title: 'Practice completion', required: false, instructorPrompt: 'Practice only, not graded. The student finished every practice ticket (resolved or escalated each one); no score and no answers are saved. Nothing to grade here: use the Module 1 Prove It for review.',
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

  AdminSubmissionSheet.register('lab-its-01-practice-tickets', {
    title: TITLES['lab-its-01-practice-tickets'],
    caseId: (result) => (Array.isArray(result.tickets) ? result.tickets.filter((id) => typeof id === 'string').join(', ') : '') || null,
    sections: practiceCompletionSections,
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
