/* Help Desk registration and verdict coverage for every lab key. Detailed
 * section-level pass/fail behavior is covered below for representative saved
 * work shapes; these rows ensure every registered definition renders. */
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

module.exports = ({ run }) => [
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
];
