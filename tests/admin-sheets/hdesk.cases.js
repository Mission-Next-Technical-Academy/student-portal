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

module.exports = () => KEYS.flatMap((lab_key) => [
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
]);
