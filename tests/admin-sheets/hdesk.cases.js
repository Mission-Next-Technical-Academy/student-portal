/* Help Desk registration and verdict coverage for every lab key. Detailed
 * section-level pass/fail behavior is covered below for representative saved
 * work shapes; these rows ensure every registered definition renders. */
const assert = require('assert/strict');
const KEYS = [
  'lab-its-01-lms-validation', 'lab-its-01-ticket-triage',
  'lab-its-02-vm-build', 'lab-its-02-vm-snapshot-server',
  'lab-its-02-device-manager', 'lab-its-02-print-spooler',
  'lab-its-03-blank-desktop', 'lab-its-04-connectivity',
  'lab-its-05-server-ad', 'lab-its-06-identity-access',
  'lab-its-07-app-cert', 'lab-its-08-unfamiliar-problems',
  'lab-its-09-security-incidents', 'lab-its-10-priority-queue',
  'lab-its-11-handoff-documentation', 'lab-its-12-capstone',
];

const savedCapstoneResponses = {
  'SEC-2114': { priority: '1', category: 'security', firstStep: 'Report to security team and do not reset the password.', decision: 'escalate', reasoning: 'Credential phishing means escalate to security immediately.' },
  'HD-2110': { priority: '2', category: 'server', firstStep: 'Confirm the domain trust scope and escalate to Tier 2.', decision: 'escalate', reasoning: 'Domain trust is outside L1 scope; escalate to Tier 2.' },
  'HD-2104': { priority: '3', category: 'network', firstStep: 'Run ipconfig and renew DHCP.', decision: 'resolve', reasoning: 'APIPA indicates a DHCP network issue within L1 scope.' },
  'SR-2107': { priority: '4', category: 'identity', firstStep: 'Check Active Directory group membership.', decision: 'resolve', reasoning: 'Group membership explains the access issue within L1 scope.' },
  'HD-2109': { priority: '5', category: 'endpoint', firstStep: 'Check the temporary profile.', decision: 'resolve', reasoning: 'A corrupt profile fits these endpoint symptoms and is within L1 scope.' },
  'HD-2106': { priority: '6', category: 'peripheral', firstStep: 'Restart the spooler and clear the print queue.', decision: 'resolve', reasoning: 'A spooler failure is a peripheral issue within L1 scope.' },
};

// A saved simulator ticket as the coach sends it. `worked` fills the student's
// work; otherwise the ticket is as the queue left it (no notes, state New).
const savedTicket = (id, { worked = false, priority = 'P3', expectedStatus = 'Resolved', notes = null, status = null } = {}) => ({
  id, requester: `Requester ${id}`, category: 'Incident', subcategory: 'Synthetic', description: `Issue for ${id}.`,
  businessImpact: 'One user blocked', sla: '8 hours', symptoms: [`Symptom for ${id}`], systemState: [], logs: [`Log for ${id}`],
  expectedDiagnosis: `Cause of ${id}`, expectedResolution: '', expectedPath: [`Check ${id}`], expectedStatus,
  priority, assignedTechnician: worked ? 'Student technician' : '', status: status || (worked ? expectedStatus : 'New'),
  diagnosis: worked ? `Cause of ${id}` : '', diagnosisCorrect: worked ? true : null, linkedProblem: '',
  checkedSteps: worked ? [`Checked ${id} step one`] : [],
  notes: notes || (worked ? [{ author: 'Student technician', time: '10:00', text: `Evidence for ${id} confirmed the cause; next technician should verify the fix.` }] : []),
  statusHistory: worked ? [{ time: '10:00', action: `${expectedStatus} ${id}.` }] : [],
  resolution: worked ? `Student resolution for ${id}.` : '', closureCode: worked ? expectedStatus : '',
});
const coachRow = (id, lab_key, tickets, extra = {}) => ({
  id, lab_key, track_code: 'HDESK', student_id: 'synthetic-hdesk', score: null, pass_threshold: 70,
  completed_at: '2026-10-26T10:00:00Z', result: { source: 'mnt-coach-complete', work: { version: 1, tickets } }, ...extra,
});
// Lists built inside the portal VM are another realm's arrays; compare as plain lists.
const eqList = (actual, expected, message) => assert.deepEqual(Array.from(actual), expected, message);
const ids = (sheet) => sheet.sections.map((section) => section.id);
const ticketSectionIds = (sheet, id) => ids(sheet).filter((sectionId) => sectionId.endsWith(`-${id.toLowerCase()}`));
// Context tickets: one section, not required, no checks, never ✗ or ◐, no prefilled note.
const assertContext = (sheet, suggested, id) => {
  eqList(ticketSectionIds(sheet, id), [`context-${id.toLowerCase()}`], `${id} is context only`);
  const section = sheet.sections.find((entry) => entry.id === `context-${id.toLowerCase()}`);
  assert.equal(section.required, false, `${id} is not required`);
  assert.equal(section.status, 'judgment', `${id} has no mark`);
  assert.equal(section.checks.length, 0, `${id} has no checks`);
  assert.ok(!suggested.some((item) => item.item_label.includes(id)), `${id} has no prefilled note`);
  [...sheet.verdict.needsWork, ...sheet.verdict.judgment, ...sheet.verdict.partly, ...sheet.verdict.advisory]
    .forEach((entry) => assert.ok(!entry.title.includes(id), `${id} is not in the summary line`));
};
// The student's marked-lab section block for one section id.
const studentSection = (html, id) => {
  const start = html.indexOf(`data-sheet-section="${id}"`);
  assert.ok(start > 0, `student sheet has ${id}`);
  const next = html.indexOf('data-sheet-section="', start + 1);
  return html.slice(start, next > 0 ? next : undefined);
};

const lab23 = 'lab-its-02-device-manager';
const lab24 = 'lab-its-02-print-spooler';
const module2Work = () => [savedTicket('HD-2106', { worked: true }), savedTicket('HD-2112', { worked: true })];
const hd2112Note = { item_label: 'Diagnosis · HD-2112', comment: 'Recheck the Print Spooler crash event before naming the driver.' };

module.exports = ({ run, AdminSubmissionSheet: Sheet }) => [
  ...KEYS.flatMap((lab_key) => [
  {
    name: `${lab_key} passing saved attempt`,
    row: { id: `${lab_key}-pass`, lab_key, track_code: 'HDESK', student_id: 'synthetic-hdesk', score: 100, pass_threshold: 70, completed_at: '2026-10-17T10:00:00Z', result: {} },
    expect: { verdict: 'pass', html: ['data-submission-sheet'] },
  },
  {
    name: `${lab_key} failing saved attempt`,
    row: { id: `${lab_key}-fail`, lab_key, track_code: 'HDESK', student_id: 'synthetic-hdesk', score: 0, pass_threshold: 70, completed_at: '2026-10-17T10:00:00Z', result: {} },
    expect: { verdict: 'return', html: ['data-submission-sheet'] },
  },
  ]),
  {
    name: 'Help Desk capstone perfect saved responses',
    row: {
      id: 'hdesk-capstone-real-work', lab_key: 'lab-its-12-capstone', track_code: 'HDESK',
      student_id: 'synthetic-hdesk', score: 100, pass_threshold: 70,
      completed_at: '2026-10-17T10:00:00Z',
      result: {
        ticketResponses: savedCapstoneResponses,
        kbArticle: 'Symptom: the user cannot print. Cause: the local spooler queue is stuck. Fix: clear the queue and restart the approved service. Verification: print a test page and confirm the queue remains clear.',
        afterAction: 'The queue check found the cause quickly. Next time I will record the exact error before restarting the service.',
      },
    },
    expect: {
      verdict: 'pass',
      sections: { 'capstone-sec-2114': 'pass', 'capstone-hd-2110': 'pass', 'knowledge-article': 'pass', 'after-action': 'pass' },
      html: ['SEC-2114', 'Report to security team', 'Symptom: the user cannot print', 'The queue check found the cause quickly'],
    },
  },
  {
    name: 'Help Desk guided lab renders saved ticket work',
    row: {
      id: 'hdesk-guided-real-work', lab_key: 'lab-its-03-blank-desktop', track_code: 'HDESK',
      student_id: 'synthetic-hdesk', score: null, pass_threshold: 70,
      completed_at: '2026-10-17T10:00:00Z',
      result: { work: { version: 1, tickets: [{
        id: 'HD-2109', requester: 'Noah Williams', category: 'Incident', subcategory: 'Desktop profile',
        description: 'The desktop is empty after login.', businessImpact: 'Sales work delayed', sla: '8 hours',
        symptoms: ['Desktop settings reset'], systemState: ['User can still sign in'], logs: ['User profile service loaded a temporary profile'],
        expectedDiagnosis: 'Temporary profile', expectedResolution: 'Escalate profile rebuild if needed.', expectedPath: ['Check profile event logs'], expectedStatus: 'Resolved',
        priority: 'P3', assignedTechnician: 'Student technician', status: 'Resolved', diagnosis: 'Corrupt profile', diagnosisCorrect: false,
        linkedProblem: '', checkedSteps: ['Check profile event logs'],
        notes: [{ author: 'Student technician', time: '10:00', text: 'Profile service loaded a temporary profile; compare the event log before rebuilding.' }],
        statusHistory: [{ time: '10:00', action: 'Added a work note.' }], resolution: 'Profile issue documented.', closureCode: 'Resolved',
      }] } },
    },
    expect: {
      verdict: 'judgment',
      sections: { 'troubleshooting-hd-2109': 'pass', 'diagnosis-hd-2109': 'fail', 'work-notes-hd-2109': 'pass', 'resolution-hd-2109': 'pass' },
      html: ['Noah Williams', 'HD-2109', 'Corrupt profile', 'Profile service loaded a temporary profile', 'compare the event log before rebuilding'],
    },
  },
  // Module 4: the coach walks HD-2104 and HD-2105; HD-2113 is free practice.
  {
    name: 'Module 4 grades only the two coached tickets',
    row: coachRow('hdesk-m04-worked', 'lab-its-04-connectivity', [
      savedTicket('HD-2104', { worked: true }), savedTicket('HD-2105', { worked: true }),
      // Worked loosely on the side: still context, so no ✗ and no writing ◐.
      savedTicket('HD-2113', { priority: 'P2', notes: [{ author: 'Student technician', time: '10:05', text: 'idk lol vpn broke' }] }),
    ]),
    expect: {
      verdict: 'judgment',
      sections: { 'resolution-hd-2104': 'pass', 'diagnosis-hd-2105': 'pass', 'context-hd-2113': 'judgment' },
      feedback: [],
      html: ['Other queue ticket · HD-2113 (not graded)', 'idk lol vpn broke', 'No required section is marked ✗'],
      notHtml: ['Read and judge', 'Work notes · HD-2113', 'Diagnosis · HD-2113'],
    },
    custom: ({ sheet, suggested }) => {
      assert.equal(ticketSectionIds(sheet, 'HD-2104').length, 6);
      assert.equal(ticketSectionIds(sheet, 'HD-2105').length, 6);
      assertContext(sheet, suggested, 'HD-2113');
    },
  },
  {
    name: 'Module 4 untouched queue ticket is not a missing section',
    row: coachRow('hdesk-m04-wrong', 'lab-its-04-connectivity', [
      savedTicket('HD-2104', { worked: true }),
      { ...savedTicket('HD-2105', { worked: true }), diagnosis: 'Bad cable', diagnosisCorrect: false },
      savedTicket('HD-2113', { priority: 'P2' }),
    ]),
    expect: { verdict: 'judgment', sections: { 'diagnosis-hd-2105': 'fail' }, feedback: ['Diagnosis · HD-2105'] },
    custom: ({ sheet, suggested }) => {
      eqList(sheet.verdict.needsWork.map((s) => s.title), ['Diagnosis · HD-2105'], 'only the worked ticket needs work');
      assertContext(sheet, suggested, 'HD-2113');
    },
  },
  // Module 7: the coach walks HD-2119 only; the other four are the same outage.
  {
    name: 'Module 7 grades only HD-2119',
    row: coachRow('hdesk-m07-worked', 'lab-its-07-app-cert', [
      savedTicket('HD-2119', { worked: true, expectedStatus: 'Escalated' }),
      ...['HD-2120', 'HD-2121', 'HD-2122', 'HD-2123'].map((id) => savedTicket(id, { expectedStatus: 'Escalated' })),
    ]),
    expect: {
      verdict: 'judgment',
      sections: { 'resolution-hd-2119': 'pass', 'work-notes-hd-2119': 'pass', 'context-hd-2120': 'judgment', 'context-hd-2123': 'judgment' },
      feedback: [],
      html: ['Other queue ticket · HD-2121 (not graded)'],
      notHtml: ['Read and judge'],
    },
    custom: ({ sheet, suggested }) => {
      assert.equal(ticketSectionIds(sheet, 'HD-2119').length, 6);
      ['HD-2120', 'HD-2121', 'HD-2122', 'HD-2123'].forEach((id) => assertContext(sheet, suggested, id));
      assert.equal(sheet.sections.filter((s) => s.status === 'fail').length, 0, 'no ✗ anywhere');
    },
  },
  // Module 10: every P1 is saved; the one with a note is the one worked.
  {
    name: 'Module 10 requires a justification only on the P1 worked',
    row: coachRow('hdesk-m10-one', 'lab-its-10-priority-queue', [
      savedTicket('SR-2103', { priority: 'P1' }),
      savedTicket('SEC-2114', { priority: 'P1', notes: [{ author: 'Student technician', time: '10:00', text: 'Possible credential compromise with a 15 minute SLA, so this comes first.' }] }),
      savedTicket('SEC-2115', { priority: 'P1' }),
      // Not a P1 (the simulator only sends P1s): a note here never counts.
      savedTicket('HD-2104', { priority: 'P3', notes: [{ author: 'Student technician', time: '10:01', text: 'Looked at this one too.' }] }),
    ]),
    expect: {
      verdict: 'judgment',
      sections: { 'priority-sec-2114': 'pass', 'context-sr-2103': 'judgment', 'context-sec-2115': 'judgment', 'context-hd-2104': 'judgment' },
      feedback: [],
      html: ['Possible credential compromise with a 15 minute SLA'],
      notHtml: ['Read and judge', 'Priority decision · SR-2103'],
    },
    custom: ({ sheet, suggested }) => {
      eqList(sheet.sections.filter((s) => s.required).map((s) => s.id), ['priority-sec-2114']);
      ['SR-2103', 'SEC-2115', 'HD-2104'].forEach((id) => assertContext(sheet, suggested, id));
    },
  },
  {
    name: 'Module 10 with no P1 note shows one required ✗',
    row: coachRow('hdesk-m10-none', 'lab-its-10-priority-queue', ['SR-2103', 'SEC-2114', 'SEC-2115'].map((id) => savedTicket(id, { priority: 'P1' }))),
    expect: {
      verdict: 'judgment',
      sections: { 'priority-justification': 'fail' },
      feedback: ['Priority justification'],
      html: ['No P1 ticket has a note', 'SR-2103, SEC-2114, SEC-2115'],
    },
    custom: ({ sheet, suggested }) => {
      eqList(sheet.sections.filter((s) => s.status === 'fail').map((s) => s.id), ['priority-justification'], 'one ✗, not one per ticket');
      eqList(sheet.verdict.needsWork.map((s) => s.title), ['Priority justification']);
      ['SR-2103', 'SEC-2114', 'SEC-2115'].forEach((id) => assertContext(sheet, suggested, id));
    },
  },
  {
    name: 'Module 10 with no saved tickets shows the justification as not recorded',
    row: { ...coachRow('hdesk-m10-empty', 'lab-its-10-priority-queue', []), result: {} },
    expect: { verdict: 'judgment', sections: { 'priority-justification': 'missing' }, feedback: [], html: ['Read and judge: Priority justification.'] },
    custom: ({ sheet }) => assert.equal(sheet.sections.length, 1),
  },
  // Labs 2.3 and 2.4: one walkthrough saves two attempts at the same instant,
  // with the same work, and the Lab Attempts tab shows them as one card.
  ...[[lab23, lab24], [lab24, lab23]].map(([leadKey, otherKey]) => {
    const lead = coachRow(`hdesk-m02-${leadKey}`, leadKey, module2Work());
    const other = coachRow(`hdesk-m02-${otherKey}`, otherKey, module2Work());
    return {
      name: `Labs 2.3 + 2.4 card led by ${leadKey} grades both tickets in course order`,
      row: lead,
      item: { lead, rows: [lead, other], ids: [lead.id, other.id] },
      expect: {
        verdict: 'judgment',
        sections: { 'troubleshooting-hd-2106': 'pass', 'troubleshooting-hd-2112': 'pass', 'diagnosis-hd-2112': 'pass', 'resolution-hd-2112': 'pass' },
        feedback: [],
        html: ['Checked HD-2112 step one', 'Cause of HD-2112', 'Student resolution for HD-2112.', 'Evidence for HD-2112 confirmed the cause'],
        notHtml: ['not graded', 'Priority work'],
      },
      custom: ({ sheet }) => {
        assert.equal(ticketSectionIds(sheet, 'HD-2106').length, 6);
        assert.equal(ticketSectionIds(sheet, 'HD-2112').length, 6);
        assert.ok(ids(sheet).indexOf('resolution-hd-2106') < ids(sheet).indexOf('scenario-hd-2112'), 'HD-2106 before HD-2112');
      },
    };
  }),
  {
    name: 'Lab 2.4 on its own card grades HD-2112, HD-2106 is context',
    row: coachRow('hdesk-m02-lab24-alone', lab24, module2Work()),
    expect: { verdict: 'judgment', sections: { 'diagnosis-hd-2112': 'pass', 'context-hd-2106': 'judgment' }, feedback: [] },
    custom: ({ sheet, suggested }) => assertContext(sheet, suggested, 'HD-2106'),
  },
  (() => {
    const lead = coachRow('hdesk-m02-sent-lead', lab23, module2Work(), { reviewed_at: '2026-10-26T12:00:00Z' });
    const other = coachRow('hdesk-m02-sent-other', lab24, module2Work(), { reviewed_at: '2026-10-26T12:00:00Z' });
    return {
      name: 'Labs 2.3 + 2.4 approved card shows an HD-2112 note beside its section',
      row: lead, item: { lead, rows: [lead, other], ids: [lead.id, other.id] },
      readOnly: true, sentFeedback: [hd2112Note],
      expect: { verdict: 'judgment', html: [/data-sheet-section="diagnosis-hd-2112"[\s\S]*Teacher note sent[\s\S]*Recheck the Print Spooler crash event/] },
    };
  })(),
  {
    name: 'Lab 2.4 marked lab shows the HD-2112 note beside its section',
    row: coachRow('hdesk-m02-marked-24', lab24, module2Work()),
    expect: { verdict: 'judgment' },
    custom: () => {
      const row = coachRow('hdesk-m02-marked-24', lab24, module2Work(), { reviewed_at: '2026-10-26T12:00:00Z' });
      const student = Sheet.renderStudent(row, { feedback: [hd2112Note] });
      const section = studentSection(student, 'diagnosis-hd-2112');
      assert.match(section, /Your instructor’s note[\s\S]*Recheck the Print Spooler crash event before naming the driver\./);
      assert.doesNotMatch(student, /data-student-overall-notes/, 'not repeated as an overall note');
      // Known follow-up (shared code): a merged card saves every note against
      // both attempts, so Lab 2.3's marked lab lists this note under "Notes
      // from your instructor". Update this when notes save per attempt.
      const lab23Student = Sheet.renderStudent({ ...row, id: 'hdesk-m02-marked-23', lab_key: lab23 }, { feedback: [hd2112Note] });
      assert.match(lab23Student, /data-student-overall-notes[\s\S]*Recheck the Print Spooler crash event/);
    },
  },
];
