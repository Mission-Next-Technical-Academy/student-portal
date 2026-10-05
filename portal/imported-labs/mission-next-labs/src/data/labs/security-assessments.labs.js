// ============================================================
//  Security Assessments Track — Labs (Agent 05)
// ============================================================
//  sa-2  File System Security
//  sa-9  File Server Integrity Triage  (L3a share review + L3b host integrity, NightShiftShell)
//  sa-3  Web Application Security Assessment (Traffic Inspector; validate-a-finding flow)
//  sa-4  Linux Log Triage: The Audit Gap  (NightShiftShell)
//  sa-5  User Account Security  (IamMatrixLabShell)
//
//  Shells defined in src/shells/security-assessments-shells.jsx.
//  Bash builtins extended there with realistic stubs (nmap, nikto,
//  faillog, getfacl, …).
// ============================================================

(function () {
  // ────────────────────────────────────────────────────────────
  //  sa-2  File System Security
  // ────────────────────────────────────────────────────────────
  // Host: FILESRV-01 — Debian/Ubuntu file server (apt, aideinit, auditd).
  const SA2_HOST = 'FILESRV-01.corp.example.local';

  const SA2_AIDE = [
    'Start timestamp: 2026-04-23 15:14:11 -0400 (AIDE 0.17.4)',
    'AIDE found differences between database and filesystem!!',
    '',
    'Summary:',
    '  Total number of entries:      24811',
    '  Added entries:                1',
    '  Removed entries:              0',
    '  Changed entries:              2',
    '',
    '---------------------------------------------------',
    'Added entries:',
    '---------------------------------------------------',
    '',
    'f++++++++++++++++: /srv/share/finance/wages-2025-Q4.xlsx',
    '',
    '---------------------------------------------------',
    'Changed entries:',
    '---------------------------------------------------',
    '',
    'f   ...    .C... : /etc/passwd',
    'f   ...    .C... : /etc/sudoers',
    '',
    '---------------------------------------------------',
    'Detailed information about changes:',
    '---------------------------------------------------',
    '',
    'File: /etc/passwd',
    '  SHA256    : 3yq1Qm0k2dH8bJp4Tf6uV1c9eXwZrN7sL5aG0oPiKjM= | 9Rt2Lw6yXc1bVn8mQp3sDf5gHj7kLz0aSe4rTu6iOpA=',
    '',
    'File: /etc/sudoers',
    '  SHA256    : Ab4cD8eF1gH5iJ9kL2mN6oP0qR3sT7uV1wX5yZ9aB2c= | Zx8cV4bN1mQ6wE3rT9yU5iO2pA7sD0fG4hJ8kL1zX6c=',
    '',
    'End timestamp: 2026-04-23 15:14:39 -0400 (run time: 0m 28s)',
  ].join('\n') + '\n';

  // Frozen image output. bindshell on 465/tcp is chkrootkit's best-known
  // false positive (SMTPS listener) — gives a deterministic graded answer.
  const SA2_CHKROOT = [
    'ROOTDIR is `/\'',
    'Checking `amd\'...                                          not found',
    'Checking `chsh\'...                                         not infected',
    'Checking `cron\'...                                         not infected',
    'Checking `crontab\'...                                      not infected',
    'Checking `ifconfig\'...                                     not infected',
    'Checking `lsof\'...                                         not infected',
    'Checking `netstat\'...                                      not infected',
    'Checking `passwd\'...                                       not infected',
    'Checking `sshd\'...                                         not infected',
    'Checking `bindshell\'...                                    INFECTED (PORTS:  465)',
    'Checking `lkm\'...                                          chkproc: nothing detected',
    'Checking `rexedcs\'...                                      not found',
    'Checking `sniffer\'...                                      lo: not promisc and no packet sniffer sockets',
    'Checking `wted\'...                                         chkwtmp: nothing deleted',
    'Checking `z2\'...                                           chklastlog: nothing deleted',
  ].join('\n') + '\n';

  function buildSa2Fs() {
    const finFile = (content) => ({ __file: true, content, mode: '0777', owner: 'root', group: 'finance' });
    return {
      'home': { 'student': { '.bashrc': 'alias ll="ls -la"\n' } },
      'srv': {
        'share': {
          'finance': {
            __mode: '0777', __owner: 'root', __group: 'finance',
            'wages-2025-Q4.xlsx': finFile('binary xlsx'),
            'tax-form-W2-jsanders.pdf': finFile('binary pdf'),
            'ap-vendor-banking.csv': finFile('vendor,routing,account\n'),
          },
          'public': {
            'README.txt': 'Public read-only share.\n',
          },
        },
      },
      'etc': {
        'hostname': 'FILESRV-01\n',
        'os-release': 'PRETTY_NAME="Ubuntu 22.04.4 LTS"\nNAME="Ubuntu"\nVERSION_ID="22.04"\nID=ubuntu\nID_LIKE=debian\n',
        'passwd': 'root:x:0:0:root:/root:/bin/bash\nj.sanders:x:1001:1001::/home/j.sanders:/bin/bash\nm.chen:x:1002:1002::/home/m.chen:/bin/bash\nsvc_backup:x:1003:1003::/var/lib/backup:/bin/false\ntemp.contractor:x:1099:1099::/home/temp.contractor:/bin/bash\n',
        'sudoers': '# /etc/sudoers\nroot ALL=(ALL:ALL) ALL\nhelpdesk-admin ALL=(ALL) NOPASSWD: /usr/bin/systemctl\ntemp.contractor ALL=(ALL) NOPASSWD: ALL\n',
        'aide': { 'aide.conf': '# /etc/aide/aide.conf (Debian default)\ndatabase_in=file:/var/lib/aide/aide.db\ndatabase_out=file:/var/lib/aide/aide.db.new\n' },
        'audit': { 'rules.d': { '_b2b.rules': '' } },
      },
      'var': {
        'lib': {
          'sa': {
            'aide-check.txt':      SA2_AIDE,
            'chkrootkit-report.txt': SA2_CHKROOT,
            'ss.txt': [
              'State  Recv-Q Send-Q Local Address:Port  Peer Address:Port Process',
              'LISTEN 0      128          0.0.0.0:22         0.0.0.0:*     users:(("sshd",pid=812,fd=3))',
              'LISTEN 0      50           0.0.0.0:445        0.0.0.0:*     users:(("smbd",pid=1044,fd=46))',
              'LISTEN 0      100          0.0.0.0:465        0.0.0.0:*     users:(("master",pid=1290,fd=18))',
            ].join('\n') + '\n',
            'ausearch-passwd.txt':
              '----\ntime->Thu Apr 23 14:41:09 2026\ntype=PATH msg=audit(1745423469.118:412): item=0 name="/etc/passwd" inode=786433 dev=08:01 mode=0100644 ouid=0 ogid=0\ntype=SYSCALL msg=audit(1745423469.118:412): arch=c000003e syscall=257 success=yes exit=4 comm="vi" exe="/usr/bin/vi" key="passwd_changes"\n',
          },
          // Empty until aideinit runs; aide --check needs aide.db promoted from aide.db.new.
          'aide': {},
        },
        'log': {},
      },
      'tmp': {},
    };
  }

  const SA2_LAB = {
    id: 'sa-2',
    track: 'security-assessments',
    title: 'File System Security Assessment',
    difficulty: 'Beginner',
    estimatedTime: '40 min',
    icon: '🗂',
    tags: ['Permissions', 'ACLs', 'Auditd', 'AIDE', 'chkrootkit'],

    source: {
      repo: '0xrajneesh/Security-Assessments-projects-for-Beginners',
      file: 'project-2-File System Security Assessment.md',
      sha256: '261c60ac55c3739e3721cab757410fad4d646956c80ae145f5eee6e9329c54c9',
      snapshot: 'src/data/sources/sa-2.source.md',
    },

    environment: { type: 'linux', shell: 'LinuxTerminalShell', fs: buildSa2Fs, host: 'filesrv-01' },

    scenario: {
      role: 'SOC analyst on the host-integrity rotation',
      incident: 'An internal audit flagged the finance share (`/srv/share/finance`) on ' + SA2_HOST + ' (Ubuntu 22.04 file server) as potentially world-readable. Verify and fix the share permissions, put file-access monitoring in place, baseline file integrity, and check for rootkit indicators.',
    },

    exercises: [
      {
        id: 'ex0',
        upstreamHeading: 'Exercise 1: Verify and Fix the Finance Share Permissions',
        steps: [
          {
            id: 'sa-2.ex0.s1',
            upstream: { exercise: 'Scenario task', stepNumber: 1, sourceLine: 'ls -l /srv/share/finance' },
            kind: 'command',
            instruction: 'List the finance share with long-format permissions and look at the mode bits on each file.',
            hint: '`ls -l /srv/share/finance` (add `-d` to see the directory itself)',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?ls\s+-(l|ld|dl|la|al|lad)\s+\/srv\/share\/finance\/?\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-2.ex0.s2',
            upstream: { exercise: 'Scenario task', stepNumber: 2, sourceLine: 'getfacl /srv/share/finance' },
            kind: 'analyze',
            instruction: 'Run getfacl on /srv/share/finance. What permissions does "other" (everyone else on the box) have? Submit the other:: line exactly as shown.',
            hint: '`getfacl /srv/share/finance` — the last line starts with `other::`.',
            validation: { type: 'valueExtracted', expected: ['other::rwx'] },
            points: 10,
            checkOnLearning: 'sa2-q0',
          },
          {
            id: 'sa-2.ex0.s3',
            upstream: { exercise: 'Scenario task', stepNumber: 3, sourceLine: 'chmod -R o-rwx /srv/share/finance' },
            kind: 'command',
            instruction: 'Remove all access for "other" on the share and everything inside it. Owner and the finance group keep their access.',
            hint: '`sudo chmod -R o-rwx /srv/share/finance` (or `sudo setfacl -R -m o::--- /srv/share/finance`)',
            acceptedInputs: [
              { type: 'regex', value: /^(sudo\s+)?chmod\s+-R\s+(o-rwx|o=|o=---|0?7[57]0)\s+\/srv\/share\/finance\/?\s*$/ },
              { type: 'regex', value: /^(sudo\s+)?setfacl\s+-R\s+-m\s+o::---\s+\/srv\/share\/finance\/?\s*$/ },
            ],
            validation: { type: 'commandExecuted' },
            points: 10,
          },
          {
            id: 'sa-2.ex0.s4',
            upstream: { exercise: 'Scenario task', stepNumber: 4, sourceLine: 'getfacl /srv/share/finance' },
            kind: 'analyze',
            instruction: 'Verify the fix: run getfacl on the share again and submit the new other:: line.',
            hint: 'If it still shows rwx, your chmod/setfacl did not apply — re-run it with -R against /srv/share/finance.',
            validation: { type: 'valueExtracted', expected: ['other::---'] },
            points: 10,
          },
        ],
      },
      {
        id: 'ex1',
        upstreamHeading: 'Exercise 2: Monitoring File Access with Auditd',
        steps: [
          {
            id: 'sa-2.ex1.s1',
            upstream: { exercise: 'Exercise 1', stepNumber: 1, sourceLine: 'sudo apt-get install auditd' },
            kind: 'command',
            instruction: 'Install Auditd.',
            hint: '`sudo apt-get install auditd`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?apt-get\s+install\s+(-y\s+)?auditd\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-2.ex1.s2',
            upstream: { exercise: 'Exercise 1', stepNumber: 2, sourceLine: 'sudo auditctl -w /etc/passwd -p wa -k passwd_changes' },
            kind: 'command',
            instruction: 'Watch /etc/passwd for write/attribute-change operations and tag them with the key passwd_changes.',
            hint: '`sudo auditctl -w /etc/passwd -p wa -k passwd_changes`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?auditctl\s+-w\s+\/etc\/passwd\s+-p\s+wa\s+-k\s+passwd_changes\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 10,
            checkOnLearning: 'sa2-q1',
          },
          {
            id: 'sa-2.ex1.s3',
            upstream: { exercise: 'Exercise 1', stepNumber: 3, sourceLine: 'sudo ausearch -k passwd_changes' },
            kind: 'command',
            instruction: 'Read back any audit events tagged passwd_changes.',
            hint: '`sudo ausearch -k passwd_changes`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?ausearch\s+-k\s+passwd_changes\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 10,
          },
        ],
      },
      {
        id: 'ex3',
        upstreamHeading: 'Exercise 3: File Integrity Baseline with AIDE',
        steps: [
          {
            id: 'sa-2.ex3.s1',
            upstream: { exercise: 'Exercise 3', stepNumber: 1, sourceLine: 'sudo apt-get install aide' },
            kind: 'command',
            instruction: 'Install AIDE.',
            hint: '`sudo apt-get install aide`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?apt-get\s+install\s+(-y\s+)?aide\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-2.ex3.s2',
            upstream: { exercise: 'Exercise 3', stepNumber: 2, sourceLine: 'sudo aideinit' },
            kind: 'command',
            instruction: 'Build the AIDE baseline with the Debian/Ubuntu wrapper. Note where it writes the new database.',
            hint: '`sudo aideinit`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?aideinit\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-2.ex3.s2a',
            upstream: { exercise: 'Exercise 3', stepNumber: 2, sourceLine: 'sudo cp /var/lib/aide/aide.db.new /var/lib/aide/aide.db' },
            kind: 'command',
            instruction: 'aideinit wrote the baseline to aide.db.new, but aide --check reads aide.db. Promote the new database so the check has something to compare against.',
            hint: '`sudo cp /var/lib/aide/aide.db.new /var/lib/aide/aide.db`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?(cp|mv)\s+\/var\/lib\/aide\/aide\.db\.new\s+\/var\/lib\/aide\/aide\.db\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-2.ex3.s3',
            upstream: { exercise: 'Exercise 3', stepNumber: 3, sourceLine: 'sudo aide --check' },
            kind: 'analyze',
            instruction: 'Run an AIDE check. Two files under /etc show content changes — submit the path of the one that grants privilege escalation (the most urgent finding).',
            hint: '`sudo aide --config /etc/aide/aide.conf --check`, then look under "Changed entries" and cat each file.',
            validation: { type: 'valueExtracted', expected: ['/etc/sudoers'] },
            points: 15,
            checkOnLearning: 'sa2-q3',
          },
        ],
      },
      {
        id: 'ex5',
        upstreamHeading: 'Exercise 4: Rootkit Detection with Chkrootkit',
        steps: [
          {
            id: 'sa-2.ex5.s1',
            upstream: { exercise: 'Exercise 5', stepNumber: 1, sourceLine: 'sudo apt-get install chkrootkit' },
            kind: 'command',
            instruction: 'Install chkrootkit.',
            hint: '`sudo apt-get install chkrootkit`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?apt-get\s+install\s+(-y\s+)?chkrootkit\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-2.ex5.s2',
            upstream: { exercise: 'Exercise 5', stepNumber: 2, sourceLine: 'sudo chkrootkit' },
            kind: 'analyze',
            instruction: 'Run chkrootkit. Which check, if any, reports a warning? Submit the check name (or "none").',
            hint: 'Scan for any line that does not say "not infected", "not found" or "nothing detected/deleted".',
            validation: { type: 'valueExtracted', expected: ['bindshell', '`bindshell\''] },
            points: 10,
            checkOnLearning: 'sa2-q4',
          },
        ],
      },
    ],

    checkOnLearning: [
      {
        id: 'sa2-q0',
        bloom: 'comprehension',
        question: 'The finance share shows other::rwx. What does that mean on a multi-user file server?',
        type: 'single-select',
        options: [
          { id: 'a', text: 'Only root and the finance group can read the files', correct: false },
          { id: 'b', text: 'Any local account can read, modify, or delete the payroll files', correct: true },
          { id: 'c', text: 'Only users logged in over SMB can reach the files', correct: false },
          { id: 'd', text: 'Nothing — the ACL overrides the mode bits', correct: false },
        ],
        triggerOn: { stepId: 'sa-2.ex0.s2' },
        reinforces: 'sa-2.ex0.s2',
      },
      {
        id: 'sa2-q1',
        bloom: 'recall',
        question: 'In auditctl -w /etc/passwd -p wa -k passwd_changes, what does the wa indicate?',
        type: 'single-select',
        options: [
          { id: 'a', text: 'Watch attribute changes only', correct: false },
          { id: 'b', text: 'Watch writes and attribute changes', correct: true },
          { id: 'c', text: 'Watch all reads', correct: false },
          { id: 'd', text: 'Web access', correct: false },
        ],
        triggerOn: { stepId: 'sa-2.ex1.s2' },
        reinforces: 'sa-2.ex1.s2',
      },
      {
        id: 'sa2-q3',
        bloom: 'application',
        question: 'In the AIDE output, the .C... flag column on a changed entry means…',
        type: 'short-answer',
        acceptedAnswer: [/content/i, 'Content', 'content'],
        triggerOn: { stepId: 'sa-2.ex3.s3' },
        reinforces: 'sa-2.ex3.s3',
      },
      {
        id: 'sa2-q4',
        bloom: 'analysis',
        question: 'chkrootkit flagged bindshell INFECTED (PORTS: 465). Pick every reasonable next step or conclusion.',
        type: 'multi-select',
        options: [
          { id: 'a', text: 'Check what is listening on 465 (ss -tlnp) — an SMTPS listener is a well-known false positive', correct: true },
          { id: 'b', text: 'The host is confirmed rootkitted; wipe it immediately', correct: false },
          { id: 'c', text: 'Corroborate with a second scanner (e.g. rkhunter) before drawing a conclusion', correct: true },
          { id: 'd', text: 'A clean chkrootkit run would not rule out kernel-level rootkits or custom implants', correct: true },
        ],
        passThreshold: 'all-correct',
        triggerOn: { stepId: 'sa-2.ex5.s2' },
        reinforces: 'sa-2.ex5.s2',
      },
    ],

    completion: { requireAllSteps: true, minQuizScore: 0.8 },
  };

  // ────────────────────────────────────────────────────────────
  //  sa-9  File Server Integrity Triage: L3a share review + L3b host integrity triage (Operation Night Shift)
  // ────────────────────────────────────────────────────────────
  // The host is built at launch from the Operation Night Shift fixtures (seed A or B,
  // fixed per learner). Expected values are recomputed from that host's own files by
  // src/systems/host-integrity.js, so nothing in this definition is an answer key.
  function nightShiftStep(id, phase, objective, kind, engineCheck, fields) {
    return Object.assign({
      id, phase, objective, kind,
      validation: { type: 'nightShiftHost', check: engineCheck },
    }, fields);
  }

  const SA9_LAB = {
    id: 'sa-9',
    track: 'security-assessments',
    title: 'File Server Integrity Triage',
    difficulty: 'Intermediate',
    estimatedTime: '50 min',
    icon: '🗂',
    tags: ['Permissions', 'ACLs', 'File Integrity', 'Persistence', 'Evidence'],

    source: {
      repo: '0xrajneesh/Security-Assessments-projects-for-Beginners',
      file: 'project-2-File System Security Assessment.md',
      sha256: '261c60ac55c3739e3721cab757410fad4d646956c80ae145f5eee6e9329c54c9',
      snapshot: 'src/data/sources/sa-2.source.md',
    },

    environment: {
      type: 'linux',
      shell: 'NightShiftShell',
      engine: 'MISSION_NEXT_HOST_INTEGRITY',
      fixtureAware: true,
      initialCwd: '/home/analyst',
      fs: context => window.MISSION_NEXT_HOST_INTEGRITY.buildFs(context),
    },

    scenario: {
      role: 'SOC analyst on the host-integrity rotation',
      incident: 'A Linux file server is in scope for a scheduled least-privilege review, and integrity tooling has flagged it. Your ticket is in /home/analyst/ir-ticket.txt. Part A authorizes a permission fix on the finance share. Part B is request-only: preserve evidence, investigate persistence, and recommend the response. AIDE and chkrootkit are already installed and the baseline is from the golden-image build; there is nothing to set up.',
    },

    exercises: [
      {
        id: 'ex0',
        upstreamHeading: 'L3a — Least-Privilege Share Review',
        steps: [
          nightShiftStep('sa-9.ex0.s1', 'preparation', 'soc-02-lesson-06', 'command', 'shareListed', {
            upstream: { exercise: 'Scenario task', stepNumber: 1, sourceLine: 'ls -l /srv/share/finance' },
            instruction: 'Read your ticket (ir-ticket.txt) for scope, then inspect the finance share at /srv/share/finance. Show the mode bits on the directory and its files.',
            hint: 'Try `ls -l /srv/share/finance`, `ls -ld /srv/share/finance`, or `stat /srv/share/finance`.',
            points: 5,
          }),
          nightShiftStep('sa-9.ex0.s2', 'detection', 'soc-02-lesson-04', 'analyze', 'shareOther', {
            upstream: { exercise: 'Scenario task', stepNumber: 2, sourceLine: 'getfacl /srv/share/finance' },
            instruction: 'Run getfacl on /srv/share/finance. What permissions does "other" (every local account) have? Submit the other:: line exactly as getfacl shows it.',
            hint: '`getfacl /srv/share/finance` — the last entry starts with `other::`.',
            answerLabel: 'other:: entry',
            points: 10,
            checkOnLearning: 'sa9-q0',
          }),
          nightShiftStep('sa-9.ex0.s3', 'containment', 'soc-02-lesson-06', 'command', 'sharePermsFixed', {
            upstream: { exercise: 'Scenario task', stepNumber: 3, sourceLine: 'chmod -R o-rwx /srv/share/finance' },
            instruction: 'Part A authorizes this change. Remove all access for "other" on the share and everything inside it. The owner and the finance group must keep the access they need.',
            hint: 'Any correct route works: `sudo chmod -R o-rwx /srv/share/finance`, a numeric mode such as 770, or `sudo setfacl -R -m o::--- /srv/share/finance`. Do not remove the finance group\'s access.',
            points: 10,
          }),
          nightShiftStep('sa-9.ex0.s4', 'detection', 'soc-02-lesson-04', 'analyze', 'shareVerified', {
            upstream: { exercise: 'Scenario task', stepNumber: 4, sourceLine: 'getfacl /srv/share/finance' },
            instruction: 'Verify the fix: run getfacl on the share again and submit the other:: entry it reports now.',
            hint: 'If getfacl still shows access for other, the change did not apply to the whole tree.',
            answerLabel: 'other:: entry',
            points: 10,
          }),
          nightShiftStep('sa-9.ex0.s5', 'detection', 'soc-02-lesson-02', 'analyze', 'exposedAccount', {
            upstream: { exercise: 'Scenario task', stepNumber: 5, sourceLine: 'cat /etc/passwd /etc/group' },
            instruction: 'Before the fix, "other" meant every local account. Compare /etc/passwd with /etc/group. Which interactive account is not in the finance group, is not an administrator (sudo group), and is not your own analyst account, yet could read and change the payroll files? Submit its username.',
            hint: 'Read /etc/passwd for interactive shells and /etc/group for the finance and sudo members.',
            answerLabel: 'Exposed account',
            points: 10,
          }),
        ],
      },
      {
        id: 'ex1',
        upstreamHeading: 'L3b part 1 — Baseline check and evidence preservation',
        steps: [
          nightShiftStep('sa-9.ex1.s4', 'preparation', 'soc-10-lesson-01', 'command', 'evidenceDir', {
            upstream: { exercise: 'Integrity', stepNumber: 1, sourceLine: 'mkdir -p /evidence/IR-001' },
            instruction: 'Create an evidence directory named /evidence/IR-<id>/ for this incident. Copies and the chain-of-custody log go here.',
            hint: '`mkdir -p /evidence/IR-<id>` using the ticket id.',
            points: 5,
          }),
          nightShiftStep('sa-9.ex1.s5', 'detection', 'soc-10-lesson-02', 'command', 'aideReport', {
            upstream: { exercise: 'Integrity', stepNumber: 2, sourceLine: 'aide --check' },
            instruction: 'Run the AIDE integrity check against the golden-image baseline. The database is already built.',
            hint: '`sudo aide --check`, `aide -C`, or `aide --config /etc/aide/aide.conf --check`.',
            points: 10,
          }),
          nightShiftStep('sa-9.ex1.s6', 'detection', 'soc-05-lesson-07', 'analyze', 'privilegePath', {
            upstream: { exercise: 'Integrity', stepNumber: 3, sourceLine: 'aide --check' },
            instruction: 'AIDE flagged more than one path. Read the flagged files. Submit the path of the one that grants privilege escalation.',
            hint: 'Look at the contents of each flagged file, not only its name.',
            answerLabel: 'Flagged path',
            points: 10,
          }),
          nightShiftStep('sa-9.ex1.s7', 'containment', 'soc-10-lesson-01', 'command', 'evidencePreserved', {
            upstream: { exercise: 'Integrity', stepNumber: 4, sourceLine: 'cp -p, sha256sum, custody.csv' },
            instruction: 'Preserve every flagged file before anything else. Copy each into your evidence directory so content, mode and owner are kept, hash it, and append one row per item to custody.csv in the same directory with these fields: item, sha256, time, handler, reason. The hash must match the state AIDE reported.',
            hint: '`cp -p FILE /evidence/IR-<id>/`, `sha256sum FILE`, then `echo "FILE,HASH,TIME,analyst,REASON" >> /evidence/IR-<id>/custody.csv`. Run one command at a time.',
            points: 15,
          }),
        ],
      },
      {
        id: 'ex2',
        upstreamHeading: 'L3b part 2 — Network and persistence triage',
        steps: [
          nightShiftStep('sa-9.ex2.s1', 'detection', 'soc-05-lesson-07', 'command', 'listener', {
            upstream: { exercise: 'Persistence', stepNumber: 1, sourceLine: 'ss -tlnp' },
            instruction: 'List the listening TCP sockets with their owning processes. Find the listener that does not belong on a file server.',
            hint: '`ss -tlnp` or `netstat -tlnp`.',
            points: 10,
          }),
          nightShiftStep('sa-9.ex2.s2', 'detection', 'soc-05-lesson-02', 'command', 'persistence', {
            upstream: { exercise: 'Persistence', stepNumber: 2, sourceLine: 'ps -ef --forest' },
            instruction: 'Show how that process is started and what launched it. Any process-tree or service-definition view works.',
            hint: '`ps -ef --forest`, `pstree`, or read the unit that starts the process with `systemctl cat` or `systemctl status`.',
            points: 10,
          }),
          nightShiftStep('sa-9.ex2.s3', 'detection', 'soc-05-lesson-07', 'analyze', 'listenerPort', {
            upstream: { exercise: 'Persistence', stepNumber: 3, sourceLine: 'ss -tlnp' },
            instruction: 'Submit the TCP port that the unexpected process is listening on.',
            hint: 'It is in the Local Address column of the listener you found.',
            answerLabel: 'Listener port',
            points: 10,
            checkOnLearning: 'sa9-q1',
          }),
        ],
      },
      {
        id: 'ex3',
        upstreamHeading: 'L3b part 3 — Eradication decision and rebuild request',
        steps: [
          nightShiftStep('sa-9.ex3.s4', 'eradication', 'soc-09-lesson-01', 'analyze', 'hostNote', {
            upstream: { exercise: 'Report', stepNumber: 1, sourceLine: 'Document findings' },
            instruction: 'Write the case note for the IR lead. Name every flagged path, the account behind the unauthorized sudoers rule, the persistence process with its executable and listening port, and the evidence you preserved. Under this request-only ticket, recommend the response instead of performing it: list each persistence artifact for the rebuild checklist.',
            hint: 'Root-level compromise means the host cannot be trusted. Say what you recommend, why, and that you are asking rather than acting.',
            answerLabel: 'Case note',
            answerMultiline: true,
            points: 15,
          }),
        ],
      },
    ],

    checkOnLearning: [
      {
        id: 'sa9-q0',
        bloom: 'comprehension',
        question: 'The other:: entry on the finance share grants read, write and execute. What does that mean on a multi-user file server?',
        type: 'single-select',
        options: [
          { id: 'a', text: 'Only root and the finance group can read the files', correct: false },
          { id: 'b', text: 'Any local account can read, modify, or delete the payroll files', correct: true },
          { id: 'c', text: 'Only users logged in over SMB can reach the files', correct: false },
          { id: 'd', text: 'Nothing — the ACL overrides the mode bits', correct: false },
        ],
        triggerOn: { stepId: 'sa-9.ex0.s2' },
        reinforces: 'sa-9.ex0.s2',
      },
      {
        id: 'sa9-q1',
        bloom: 'analysis',
        question: 'A root-level compromised account has installed service-based persistence and changed the sudoers policy. Under a request-only ticket, what is the right recommendation?',
        type: 'single-select',
        options: [
          { id: 'a', text: 'Eradicate on-host: delete the service file and sudoers rule', correct: false },
          { id: 'b', text: 'Rebuild from an approved image: root-level compromise makes on-host remediation untrustworthy', correct: true },
          { id: 'c', text: 'Isolate and do forensics first, never rebuild', correct: false },
          { id: 'd', text: 'Just disable sudo to prevent further escalation', correct: false },
        ],
        triggerOn: { stepId: 'sa-9.ex2.s3' },
        reinforces: 'sa-9.ex2.s3',
      },
    ],

    completion: { requireAllSteps: true, minQuizScore: 0.5 },
  };

  // ────────────────────────────────────────────────────────────
  //  sa-3  Validate a Web Finding (Traffic Inspector)
  // ────────────────────────────────────────────────────────────
  function buildSa3Capture() {
    const rows = [];
    function add(id, ip, url, status, title, request, response) {
      rows.push({ id, method: 'GET', url, hasParams: true, edited: false, status,
        length: response.length, mime: 'HTML', title, tls: true, ip,
        request: `GET ${url} HTTP/1.1\nHost: app.example.local\nUser-Agent: Authorized assessment evidence\n\n`,
        response: `HTTP/1.1 ${status} ${status === 500 ? 'Internal Server Error' : 'OK'}\nContent-Type: text/html\n\n${response}\n` });
    }
    add('scan-1', '10.10.24.90', "/products?id=1%27", 500, 'SQL syntax error', '', 'Database syntax error');
    add('external-1', '198.51.100.44', "/products?id=1%27", 500, 'SQL syntax error', '', 'Database syntax error');
    add('scan-2', '10.10.24.90', '/products?id=2', 200, 'Product detail', '', 'Product page response');
    return JSON.stringify(rows);
  }

  function buildSa3Fs() {
    return {
      'home': { 'student': { '.bashrc': '' } },
      'var': {
        'lib': {
          'traffic-inspector': {
            'http-history.json': buildSa3Capture(),
            'scanner-report.txt': 'Authorized AppSec scan — app.example.local\nFinding: SQL error disclosed after a single-quote test in GET /products?id=1%27\nSeverity: High (scanner estimate)\nScanner source: 10.10.24.90\nValidation: correlate with access logs; report alone does not establish exploitation or data access.\n',
            'asset-inventory.txt': 'asset,role,exposure,owner\napp.example.local,customer-facing commerce application,internet-facing,web-platform\n',
          },
        },
        'log': { 'app': { 'access.log': '2026-04-23T09:14:02Z 10.10.24.90 GET /products?id=1%27 500 sql_error\n2026-04-23T09:18:44Z 198.51.100.44 GET /products?id=1%27 500 sql_error\n2026-04-23T09:20:10Z 10.10.24.90 GET /products?id=2 200 ok\n' } },
      },
      'tmp': {},
    };
  }

  const SA3_LAB = {
    id: 'sa-3',
    track: 'security-assessments',
    title: 'Web Application Security Assessment',
    difficulty: 'Intermediate',
    estimatedTime: '60 min',
    icon: '🕸',
    tags: ['Web Logs', 'Finding Validation', 'Exposure', 'Prioritization'],

    source: {
      repo: '0xrajneesh/Security-Assessments-projects-for-Beginners',
      file: 'project-3-Web Application Security Assessment.md',
      sha256: '155e696c01f6e41da36a5303416b49eecd881da72d7d60abe48af503d4dcedf8',
      snapshot: 'src/data/sources/sa-3.source.md',
    },

    environment: { type: 'web', shell: 'TrafficInspectorShell', fs: buildSa3Fs },

    scenario: {
      role: 'SOC analyst reviewing an authorized AppSec handoff',
      incident: 'The authorized AppSec team supplied a scanner report for app.example.local. Validate the SQL error finding against web access logs, determine whether activity came only from the approved scanner, check the asset role and exposure, then document a priority rationale. All test traffic in this lab was generated within the approved assessment scope.',
    },

    exercises: [{
      id: 'ex1', upstreamHeading: 'L7 — Validate the AppSec Finding',
      steps: [
        { id: 'sa-3.ex1.s1', upstream: { exercise: 'L7', stepNumber: 1, sourceLine: 'Review the authorized scanner report and correlate the finding with access logs.' }, phase: 'detection', objective: 'soc-08-lesson-01', kind: 'command',
          environment: { shell: 'LinuxTerminalShell', shellProps: { initialCwd: '/var/log/app' } },
          instruction: 'The authorized scanner report is at /var/lib/traffic-inspector/scanner-report.txt. Review it, then search the supplied access log for the single-quote request that returned HTTP 500. Use grep; do not run a scan.',
          hint: '`cat /var/lib/traffic-inspector/scanner-report.txt` and `grep "id=1%27" /var/log/app/access.log`',
          acceptedInputs: [{ type: 'regex', value: /^grep\s+.*(id=1%27|id=1').*access\.log\s*$/i }],
          validation: { type: 'commandExecuted' }, points: 15 },
        { id: 'sa-3.ex1.s2', upstream: { exercise: 'L7', stepNumber: 2, sourceLine: 'Determine whether anyone other than the approved scanner made the matching request.' }, phase: 'analysis', objective: 'soc-08-lesson-03', kind: 'analyze',
          environment: { shell: 'LinuxTerminalShell', shellProps: { initialCwd: '/var/log/app' } },
          instruction: 'The access log shows the same SQL error pattern from more than one source. Submit the source address that is not the authorized scanner (10.10.24.90).',
          answerLabel: 'Non-scanner source IP', hint: 'Compare matching log entries with the scanner source listed in the report.',
          validation: { type: 'valueExtracted', expected: '198.51.100.44' }, points: 20 },
        { id: 'sa-3.ex1.s3', upstream: { exercise: 'L7', stepNumber: 3, sourceLine: 'Check the asset role and exposure.' }, phase: 'analysis', objective: 'soc-08-lesson-04', kind: 'analyze',
          instruction: 'Check the asset inventory in the Traffic Inspector. What is the application asset role?',
          answerLabel: 'Asset role', hint: 'The inventory identifies the service function and internet exposure.',
          validation: { type: 'valueExtracted', expected: /customer-facing commerce application/i }, points: 15 },
        { id: 'sa-3.ex1.s4', upstream: { exercise: 'L7', stepNumber: 4, sourceLine: 'Write a priority rationale and safe owner handoff.' }, phase: 'analysis', objective: 'soc-08-lesson-04', kind: 'analyze',
          instruction: 'Write a concise priority rationale that cites the confirmed SQL error, the non-scanner source, and the customer-facing internet exposure. Recommend validation and an owner handoff; do not claim data access from these records alone.',
          answerLabel: 'Priority rationale', hint: 'Include evidence, impact context, uncertainty, and the next safe action.',
          validation: { type: 'valueExtracted', expected: /sql|500/i }, points: 25 },
      ],
    }],

    checkOnLearning: [
      { id: 'sa3-q1', bloom: 'analysis', question: 'Why does a matching request from a source other than the approved scanner change the finding assessment?', type: 'single-select', options: [
        { id: 'a', text: 'It is evidence of possible activity beyond the authorized scan and needs incident validation.', correct: true },
        { id: 'b', text: 'It proves customer data was accessed.', correct: false },
        { id: 'c', text: 'It means the scanner report is invalid.', correct: false },
      ], triggerOn: { stepId: 'sa-3.ex1.s2' }, reinforces: 'sa-3.ex1.s2' },
      { id: 'sa3-q2', bloom: 'application', question: 'What should drive the initial priority rationale?', type: 'multi-select', passThreshold: 'all-correct', options: [
        { id: 'a', text: 'Confirmed evidence in the report and access logs.', correct: true },
        { id: 'b', text: 'The application’s customer-facing role and internet exposure.', correct: true },
        { id: 'c', text: 'An assumption that exploitation succeeded.', correct: false },
      ], triggerOn: { stepId: 'sa-3.ex1.s4' }, reinforces: 'sa-3.ex1.s4' },
    ],

    completion: { requireAllSteps: true, minQuizScore: 0.8 },
  };

  // ────────────────────────────────────────────────────────────
  //  sa-4  Linux Log Triage: The Audit Gap (L2)
  // ────────────────────────────────────────────────────────────
  // The host is built at launch from the Operation Night Shift fixtures (seed A or B,
  // fixed per learner). src/systems/linux-log-triage.js recomputes every expected fact
  // from that host's own logs, so this definition contains no answer key.
  function triageStep(id, phase, objective, kind, engineCheck, fields) {
    return Object.assign({
      id, phase, objective, kind,
      validation: { type: 'nightShiftTriage', check: engineCheck },
    }, fields);
  }

  const SA4_LAB = {
    id: 'sa-4',
    track: 'security-assessments',
    title: 'Linux Log Triage: The Audit Gap',
    difficulty: 'Intermediate',
    estimatedTime: '45 min',
    icon: '📜',
    tags: ['Log Triage', 'Incident Response', 'Audit Logging', 'Detection Gap'],

    source: {
      repo: '0xrajneesh/Security-Assessments-projects-for-Beginners',
      file: 'project-4-System Log Assessment.md',
      sha256: '914b093adfc6241772a2362be40cd01392f42a8a8a05b0983c093145773fab0d',
      snapshot: 'src/data/sources/sa-4.source.md',
    },

    environment: {
      type: 'linux',
      shell: 'NightShiftShell',
      engine: 'MISSION_NEXT_LINUX_LOG_TRIAGE',
      fixtureAware: true,
      initialCwd: '/home/analyst',
      fs: context => window.MISSION_NEXT_LINUX_LOG_TRIAGE.buildFs(context),
    },

    scenario: {
      role: 'SOC analyst on the Detection & Analysis rotation',
      incident: 'Your SIEM stopped receiving audit events from a Linux file server. Your ticket is in /home/analyst/ir-ticket.txt and authorizes read-only triage. The environment is already provisioned: rsyslog forwarding, the audit daemon and the logs are in place, so there is nothing to install. Find why telemetry stopped, which account is responsible, and what should have alerted.',
    },

    exercises: [
      {
        id: 'ex1',
        upstreamHeading: 'Preparation: confirm authority and forwarding health',
        steps: [
          triageStep('sa-4.ex1.s4', 'preparation', 'soc-03-lesson-01', 'command', 'ticketRead', {
            upstream: { exercise: 'Preparation', stepNumber: 1, sourceLine: 'cat ir-ticket.txt' },
            instruction: 'Read the ticket in your home directory. Confirm the host, the symptom and exactly what you are authorized to do.',
            hint: '`cat /home/analyst/ir-ticket.txt`',
            points: 5,
          }),
          triageStep('sa-4.ex1.s2', 'preparation', 'soc-03-lesson-01', 'command', 'forwarderRule', {
            upstream: { exercise: 'Preparation', stepNumber: 2, sourceLine: 'cat /etc/rsyslog.d/50-forward.conf' },
            instruction: 'Read the rsyslog forward rule to confirm where this host sends its logs.',
            hint: '`cat /etc/rsyslog.d/50-forward.conf`',
            points: 5,
          }),
          triageStep('sa-4.ex1.s5', 'preparation', 'soc-03-lesson-01', 'analyze', 'gapTime', {
            upstream: { exercise: 'Preparation', stepNumber: 3, sourceLine: 'systemctl status rsyslog' },
            instruction: 'Check the forwarder. The rule is in place, but at what UTC time did the SIEM last receive an audit record from this host? Submit HH:MM:SS.',
            hint: 'Try `systemctl status rsyslog` or read /var/log/siem-forwarder.log. Follow the audit stream, not the auth stream.',
            answerLabel: 'Last audit record delivered (UTC)',
            points: 10,
          }),
        ],
      },
      {
        id: 'ex2',
        upstreamHeading: 'Detection & Analysis: triage authentication events',
        steps: [
          triageStep('sa-4.ex2.s3', 'detection', 'soc-03-lesson-03', 'command', 'burst', {
            upstream: { exercise: 'Analysis', stepNumber: 1, sourceLine: 'grep "Failed password" /var/log/auth.log' },
            instruction: 'Surface the failed-password burst in /var/log/auth.log. Any tool works: show the events, or aggregate them by source.',
            hint: '`grep "Failed password" /var/log/auth.log`, an awk filter, or `... | sort | uniq -c` on the source column. Several sources appear; look for the burst.',
            points: 10,
          }),
          triageStep('sa-4.ex2.s4', 'detection', 'soc-03-lesson-04', 'command', 'acceptedLogin', {
            upstream: { exercise: 'Analysis', stepNumber: 2, sourceLine: 'grep "Accepted" /var/log/auth.log' },
            instruction: 'Show the successful login that follows the burst, from the same source. Other logins are noise.',
            hint: '`grep Accepted /var/log/auth.log` lists every success; pick the one after the burst.',
            points: 10,
          }),
          triageStep('sa-4.ex2.s5', 'detection', 'soc-03-lesson-04', 'command', 'sudoUse', {
            upstream: { exercise: 'Analysis', stepNumber: 3, sourceLine: 'grep "sudo:" /var/log/auth.log' },
            instruction: 'Show what that account did with sudo.',
            hint: '`grep sudo /var/log/auth.log`, or filter on the account name.',
            points: 10,
          }),
        ],
      },
      {
        id: 'ex3',
        upstreamHeading: 'Detection & Analysis: confirm the audit gap and build the timeline',
        steps: [
          triageStep('sa-4.ex3.s3', 'detection', 'soc-03-lesson-03', 'command', 'auditStop', {
            upstream: { exercise: 'Analysis', stepNumber: 4, sourceLine: 'journalctl -u UNIT' },
            instruction: 'Confirm from the system journal or the audit trail that a security service was stopped after that sudo activity. Use whichever source you prefer.',
            hint: 'Query the journal for a unit (`journalctl -u UNIT`), check `systemctl status UNIT`, run `ausearch -m SERVICE_STOP`, or grep the audit log.',
            points: 10,
            checkOnLearning: 'sa4-q1',
          }),
          triageStep('sa-4.ex3.s4', 'detection', 'SOC-101.4', 'analyze', 'timeline', {
            upstream: { exercise: 'Timeline', stepNumber: 1, sourceLine: 'Build the incident timeline' },
            instruction: 'Build the UTC timeline. List five events in chronological order, one per line, each as HH:MM:SS plus a short label: first failed password of the burst, successful login, first sudo command, audit service stop, and last audit record the SIEM received. Events in the same second may be listed either way.',
            hint: 'Use the times you found in auth.log, the journal and the forwarder log.',
            answerLabel: 'Timeline',
            answerMultiline: true,
            points: 15,
            checkOnLearning: 'sa4-q2',
          }),
        ],
      },
      {
        id: 'ex4',
        upstreamHeading: 'Detection & Analysis: findings for the IR lead',
        steps: [
          triageStep('sa-4.ex4.s4', 'detection', 'soc-03-lesson-04', 'analyze', 'sourceIp', {
            upstream: { exercise: 'Escalation', stepNumber: 1, sourceLine: 'Report the source address' },
            instruction: 'Which source address produced the burst of failed passwords? Submit only that address.',
            hint: 'Aggregating the failures by source makes it obvious.',
            answerLabel: 'Source IP',
            points: 10,
          }),
          triageStep('sa-4.ex4.s2', 'detection', 'soc-03-lesson-04', 'analyze', 'account', {
            upstream: { exercise: 'Escalation', stepNumber: 2, sourceLine: 'Report the account' },
            instruction: 'Which account succeeded right after the burst? Submit just the username.',
            hint: 'Look for an Accepted line after the failures, from the same source.',
            answerLabel: 'Account',
            points: 10,
          }),
          triageStep('sa-4.ex4.s3', 'detection', 'soc-03-lesson-04', 'analyze', 'unit', {
            upstream: { exercise: 'Escalation', stepNumber: 3, sourceLine: 'Report the stopped service' },
            instruction: 'After that login, which systemd unit did the same account stop to suppress telemetry? Submit the unit name.',
            hint: 'The journal and the audit record both name it.',
            answerLabel: 'Unit',
            points: 10,
          }),
        ],
      },
      {
        id: 'ex5',
        upstreamHeading: 'Post-Incident: document the detection gap',
        steps: [
          triageStep('sa-4.ex5.s7', 'postIncident', 'SOC-101.5', 'analyze', 'caseNote', {
            upstream: { exercise: 'Report', stepNumber: 1, sourceLine: 'Write a case note' },
            instruction: 'Write the case note for the IR lead. Include the account, source address and failed-password count, the UTC time the service was stopped and which service it was, and your escalation. Then record the detection gap: state that nothing alerted when the service was stopped, and propose the detection rule that should be added for the M4 tuning backlog.',
            hint: 'Separate what you observed from what you recommend. The rule should fire on an unexpected stop of a security service.',
            answerLabel: 'Case note',
            answerMultiline: true,
            points: 15,
          }),
        ],
      },
    ],

    checkOnLearning: [
      {
        id: 'sa4-q1',
        bloom: 'analysis',
        question: 'Why is stopping the audit daemon after gaining unauthorized sudo access an effective attack technique?',
        type: 'multi-select',
        options: [
          { id: 'a', text: 'It disables the primary endpoint-level logging and audit trail', correct: true },
          { id: 'b', text: 'It creates a gap in detection between the privilege gain and later actions', correct: true },
          { id: 'c', text: 'It causes the SIEM to go offline', correct: false },
          { id: 'd', text: 'It deletes all prior log entries', correct: false },
          { id: 'e', text: 'It prevents investigators from detecting subsequent lateral movement', correct: true },
        ],
        passThreshold: 'all-correct',
        triggerOn: { stepId: 'sa-4.ex3.s3' },
        reinforces: 'sa-4.ex3.s3',
      },
      {
        id: 'sa4-q2',
        bloom: 'analysis',
        question: 'You detect that the audit daemon was stopped by a non-admin account. What should your immediate containment action be?',
        type: 'single-select',
        options: [
          { id: 'a', text: 'Disable the account and restart the audit daemon immediately', correct: false },
          { id: 'b', text: 'Snapshot the host state and syslog, escalate to IR, and recommend a rebuild', correct: true },
          { id: 'c', text: 'Restart the audit daemon and monitor for new activity', correct: false },
          { id: 'd', text: 'Wait for the next shift to investigate', correct: false },
        ],
        triggerOn: { stepId: 'sa-4.ex3.s4' },
        reinforces: 'sa-4.ex3.s4',
      },
    ],

    completion: { requireAllSteps: true, minQuizScore: 0.5 },
  };

  // ────────────────────────────────────────────────────────────
  //  sa-6  Windows Jump Host Triage (L4, PowerShell)
  // ────────────────────────────────────────────────────────────
  function psStep(id, phase, objective, kind, check, fields) {
    return Object.assign({ id, phase, objective, kind, validation:{ type:'powershellTriage', check } }, fields);
  }
  const SA6_LAB = {
    id:'sa-6', track:'security-assessments', title:'Windows Jump Host Triage', difficulty:'Intermediate', estimatedTime:'45 min', icon:'🪟',
    tags:['PowerShell','Windows Events','Persistence','Network Triage'],
    environment:{ type:'windows', shell:'PowerShellShell', engine:'MISSION_NEXT_POWERSHELL_TRIAGE', fixtureAware:true, initialCwd:'C:\\Users\\Analyst' },
    scenario:{ role:'SOC analyst on the Windows response queue', incident:'Ticket IR-NS-204 authorizes read-only triage of the Windows jump host and a containment handoff. Use the provided PowerShell object pipeline to correlate the Night Shift identity, inspect process and persistence evidence, assess the dropped file, and report the beacon. Do not disable accounts, delete tasks, or isolate the host; request containment from the incident commander. All commands run against a fictional browser simulation.' },
    exercises:[
      { id:'ex1', upstreamHeading:'Detection & Analysis: correlate the remote logon', steps:[
        psStep('sa-6.ex1.s1','detection','soc-05-lesson-01','command','logon',{ instruction:'Query Security events and identify the successful type 10 remote logon that follows the failed attempts. Use Get-WinEvent with a Security filter, then narrow the objects with Where-Object and select useful fields.', hint:"Try `Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625,4624} | Where-Object {$_.Id -eq 4624} | Select-Object TimeCreated,TargetUserName,IpAddress,LogonType`.", points:10 }),
        psStep('sa-6.ex1.s2','detection','soc-05-lesson-01','analyze','logonDetails',{ instruction:'Record the identity and source IP shown by the suspicious remote logon. The same identity appears in the Linux and cloud evidence.', answerLabel:'Identity and source IP', hint:'Use the matching 4624 row, not a nearby failed logon.', points:10 }),
      ]},
      { id:'ex2', upstreamHeading:'Detection & Analysis: reconstruct execution and persistence', steps:[
        psStep('sa-6.ex2.s1','detection','soc-05-lesson-02','command','process',{ instruction:'Inspect 4688 process-creation evidence and trace the parent process to the launched script. Filter, select and sort the event objects as needed.', hint:'Get-WinEvent for Id 4688; the process row includes ParentImage, Image and CommandLine.', points:10 }),
        psStep('sa-6.ex2.s2','detection','soc-05-lesson-03','command','processTree',{ instruction:'Use Get-CimInstance Win32_Process to inspect the parent/child process chain.', hint:'Filter on ProcessId or ParentProcessId, or select and sort the process objects.', points:10 }),
        psStep('sa-6.ex2.s3','detection','soc-05-lesson-05','command','persistence',{ instruction:"Inspect scheduled tasks and identify the task outside Microsoft's task path that launches the staged script.", hint:"`Get-ScheduledTask | Where-Object {$_.TaskPath -notlike '\\Microsoft\\*'} | Format-Table`.", points:10 }),
        psStep('sa-6.ex2.s4','detection','soc-05-lesson-05','command','run',{ instruction:'Inspect the machine Run key for the persistence value and its executable path.', hint:"`Get-ItemProperty 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' | Select-Object *`.", points:10 }),
      ]},
      { id:'ex3', upstreamHeading:'Detection & Analysis: evaluate the file and network activity', steps:[
        psStep('sa-6.ex3.s1','detection','soc-05-lesson-06','command','hash',{ instruction:'Calculate the SHA256 hash of the dropped binary with Get-FileHash. Treat an unknown hash as a lead, not proof of maliciousness.', hint:'`Get-FileHash C:\\ProgramData\\Cache\\telemetry.exe`.', points:10 }),
        psStep('sa-6.ex3.s2','detection','soc-05-lesson-06','analyze','hashAssessment',{ instruction:'Check the signature with Get-AuthenticodeSignature, then assess the sample. State that signer verification failed and prevalence is unknown; explain why the hash alone does not prove maliciousness.', answerLabel:'Assessment', answerMultiline:true, hint:'Use `Get-AuthenticodeSignature C:\\ProgramData\\Cache\\telemetry.exe`. This simulation has no reputation service, so prevalence is unknown; separate that gap from the hash itself.', points:10 }),
        psStep('sa-6.ex3.s3','detection','soc-05-lesson-07','command','beacon',{ instruction:'Review established TCP connections and identify the external beacon destination.', hint:'`Get-NetTCPConnection -State Established | Where-Object {$_.RemotePort -eq 443} | Format-Table`.', points:10 }),
      ]},
      { id:'ex4', upstreamHeading:'Containment handoff: request action within your authority', steps:[
        psStep('sa-6.ex4.s1','containment','soc-05-lesson-09','analyze','handoff',{ instruction:'Write a concise handoff to the incident commander. Include the account and source, jump host, observed process/persistence and beacon, evidence preservation, a request for containment, and your scope limit: read-only triage, no account disablement or host isolation performed.', answerLabel:'Containment handoff', answerMultiline:true, hint:'State observed facts, requested action, and the authority boundary.', points:15 }),
      ]},
    ], completion:{ requireAllSteps:true },
  };

  // ────────────────────────────────────────────────────────────
  //  sa-7  Contain, Collect, Rebuild (L5, simulated PowerShell)
  // ────────────────────────────────────────────────────────────
  function rebuildStep(id, phase, objective, kind, check, fields) {
    return Object.assign({ id, phase, objective, kind, validation:{type:'powershellRebuild',check} }, fields);
  }
  const SA7_LAB = {
    id:'sa-7', track:'security-assessments', title:'Contain, Collect, Rebuild', difficulty:'Intermediate', estimatedTime:'55 min', icon:'🧰',
    tags:['Incident Response','Evidence Collection','PowerShell','Recovery'],
    environment:{type:'windows',shell:'PowerShellScriptShell',engine:'MISSION_NEXT_POWERSHELL_REBUILD',fixtureAware:true,initialCwd:'C:\\IR'},
    scenario:{role:'SOC analyst executing approved response ticket IR-NS',incident:'The incident commander authorizes containment, evidence collection, removal of the identified jump-host persistence, and a scripted rebuild. Start by running Get-IRTicket. Disable only the incident account, revoke its sessions, and limit inbound management to the approved subnet. Export and hash the Security log before writing custody.csv. Remove only the incident task and Run-key value and verify both are gone. Finally write and run Rebuild-JumpHost.ps1. This ticket does not authorize DNS or user-traffic cutover; hand off the verified replacement for that separate change. All cmdlets and cloud operations are simulated in this browser; nothing contacts a real directory or Azure tenant.'},
    exercises:[
      {id:'ex1',upstreamHeading:'Containment: apply the authorized response',steps:[
        rebuildStep('sa-7.ex1.s1','containment','soc-09-lesson-01','command','ticket',{instruction:'Read the response ticket and confirm the authorized identity, host and scope.',hint:'Run `Get-IRTicket` in the command field.',points:5}),
        rebuildStep('sa-7.ex1.s2','containment','soc-09-lesson-01','command','containment',{instruction:'Disable the incident account and revoke its active sign-in sessions. Both actions are explicitly authorized by this ticket.',hint:'Use `Disable-ADAccount -Identity <ticket account>` and `Revoke-MgUserSignInSession -UserId <ticket account>`.',points:10}),
        rebuildStep('sa-7.ex1.s3','containment','soc-09-lesson-01','command','isolation',{instruction:'Add inbound allow rules for ports 22 and 3389 from the management subnet only. No other source or inbound port is authorized.',hint:'Use `New-NetFirewallRule -Direction Inbound -Action Allow -RemoteAddress <management subnet> -LocalPort 22` and an equivalent rule for 3389.',points:10}),
      ]},
      {id:'ex2',upstreamHeading:'Collection and eradication: preserve, then remove persistence',steps:[
        rebuildStep('sa-7.ex2.s1','containment','SOC-101.6','command','collection',{instruction:'Export the Security event log, hash the exported EVTX file, and write a custody record to custody.csv. The hash must be calculated after export.',hint:'`wevtutil epl Security C:\\IR\\Security.evtx` then `Get-FileHash -LiteralPath C:\\IR\\Security.evtx | Export-Csv -Path C:\\IR\\custody.csv -NoTypeInformation`.',points:15}),
        rebuildStep('sa-7.ex2.s2','eradication','soc-09-lesson-01','command','eradication',{instruction:'Remove only the incident scheduled task and Run-key value. Query both locations afterward to verify they are absent.',hint:'Use `Unregister-ScheduledTask -TaskName UpdateTelemetry -Confirm:$false`, `Remove-ItemProperty` for the ticketed Run value, then `Get-ScheduledTask` and `Get-ItemProperty` to verify.',points:10}),
      ]},
      {id:'ex3',upstreamHeading:'Recovery: script a clean, monitored replacement',steps:[
        rebuildStep('sa-7.ex3.s1','recovery','SOC-101.7','command','secretFree',{instruction:'Save and run Rebuild-JumpHost.ps1. Use the approved image, isolated network, baseline, monitoring extension, diagnostics workspace and incident tag from the ticket. Read back VM state and confirm Heartbeat before declaring success. Rerunning the script must not create a duplicate VM. Do not switch DNS or user traffic; the separately approved change owner handles cutover.',hint:'Use the editor above the command prompt. The shell exposes ticket values as `$env:APPROVED_IMAGE`, `$env:RECOVERY_VNET`, `$env:RECOVERY_SUBNET`, `$env:RECOVERY_NSG`, `$env:MANAGEMENT_SUBNET`, `$env:BASELINE`, `$env:MONITORING_EXTENSION`, `$env:WORKSPACE`, and `$env:INCIDENT_ID`.',points:15}),
        rebuildStep('sa-7.ex3.s2','recovery','SOC-101.7','command','rebuild',{instruction:'Confirm the completed VM is built from the approved image, isolated on the recovery subnet with no public IP, hardened, monitored, incident-tagged and producing Heartbeat. The script must query the provisioned VM before it reports success.',hint:'Run a state-verification command such as `Get-AzVM -Name $vmName` after provisioning and configuration, then query the Heartbeat stream.',points:15}),
      ]},
      {id:'ex4',upstreamHeading:'Post-incident: record cause and improvement',steps:[
        rebuildStep('sa-7.ex4.s1','postIncident','soc-09-lesson-01','analyze','postIncident',{instruction:'Write a short post-incident note covering the credential cause, persistence, containment performed, and one detection improvement for identity misuse or unauthorized persistence.',answerLabel:'Post-incident note',answerMultiline:true,hint:'State the observed cause, actions completed under the ticket and a specific control to improve detection.',points:10}),
      ]},
    ], completion:{requireAllSteps:true},
  };

  // L6 — Cloud Identity & Workload Incident. This optional lab is deliberately
  // catalogued only inside the imported labs application.
  function cloudStep(id,phase,objective,check,fields){return Object.assign({id,phase,objective,kind:check==='post'?'analyze':'command',validation:{type:'cloudIncident',check}},fields);}
  const SA8_LAB={
    id:'sa-8',track:'security-assessments',title:'Cloud Identity & Workload Incident',difficulty:'Intermediate',estimatedTime:'55 min',icon:'☁️',tags:['Cloud IR','KQL','Identity','Recovery'],
    environment:{type:'cloud',shell:'CloudShell',engine:'MISSION_NEXT_CLOUD_INCIDENT',fixtureAware:true,initialCwd:'/home/analyst'},
    scenario:{role:'SOC analyst on the cloud response rotation',incident:'A risky sign-in for the Operation Night Shift identity precedes an unapproved VM, an internet-exposed SSH rule and an unauthorized role assignment. The incident ticket authorizes identity/session containment, NSG response, a forensic snapshot verified before VM deletion, role removal and a clean scripted rebuild. Use the virtual Cloud Shell only; no Azure tenant is contacted.'},
    exercises:[
      {id:'ex1',upstreamHeading:'Detection and scope',steps:[
        cloudStep('sa-8.ex1.s1','detection','soc-09-lesson-01','ticket',{instruction:'Read the cloud response ticket and confirm its authority and recovery boundary.',hint:'Run `cat /home/analyst/ir-ticket.txt`.',points:5}),
        cloudStep('sa-8.ex1.s2','detection','SOC-101.6','detect',{instruction:'Use Log Analytics KQL to find the risky sign-in, then pivot to AzureActivity for the unapproved VM write and NSG SSH rule opened to 0.0.0.0/0.',hint:'Query SigninLogs and AzureActivity. Example: `SigninLogs | where riskState == "atRisk"`.',points:15}),
        cloudStep('sa-8.ex1.s3','analysis','soc-09-lesson-01','scope',{instruction:'Scope the affected resources and role assignment with resource, VM and NSG listing commands.',hint:'Try `az resource list --tag IncidentId=...`, `az vm list -d`, and `az network nsg rule list`.',points:10}),
      ]},
      {id:'ex2',upstreamHeading:'Containment, preservation and eradication',steps:[
        cloudStep('sa-8.ex2.s1','containment','soc-09-lesson-01','contain',{instruction:'Disable the incident identity, revoke its active sign-in sessions, and remove the internet-exposed NSG rule.',hint:'Use simulated `az ad user update`, `az ad user revoke-sign-in-sessions`, and `az network nsg rule delete` commands.',points:15}),
        cloudStep('sa-8.ex2.s2','containment','SOC-101.6','snapshot',{instruction:'Create a snapshot of the rogue VM OS disk and verify its provisioning state and source before any deletion.',hint:'Run `az snapshot create ...` followed by `az snapshot show ...`.',points:15}),
        cloudStep('sa-8.ex2.s3','eradication','soc-09-lesson-01','eradicate',{instruction:'After snapshot verification, deallocate and delete the rogue VM, then remove the unauthorized role assignment.',hint:'The VM delete command is rejected until the snapshot has been verified.',points:10}),
      ]},
      {id:'ex3',upstreamHeading:'Recovery and post-incident improvement',steps:[
        cloudStep('sa-8.ex3.s1','recovery','SOC-101.7','rebuild',{instruction:'Write and run rebuild.sh to create a replacement from the approved image with no public IP, the recovery NSG, monitoring, diagnostics and the incident tag. Query its state before declaring success. A rerun must not create a duplicate.',hint:'The editor is in the Cloud Shell pane. Include `az vm create`, monitoring extension, diagnostics, `IncidentId`, and `az vm show`.',points:20}),
        cloudStep('sa-8.ex3.s2','recovery','SOC-101.7','heartbeat',{instruction:'Query Heartbeat and confirm a row for the replacement VM in the ticketed SIEM workspace.',hint:'Run `az monitor log-analytics query -w <workspace> --analytics-query "Heartbeat"`.',points:10}),
        cloudStep('sa-8.ex3.s3','postIncident','soc-09-lesson-01','post',{instruction:'Propose a KQL analytic for an internet-open NSG rule created by an identity outside the network team. Include the identity, NSG, preserved snapshot, and improvement in your note.',answerLabel:'Post-incident analytic and note',answerMultiline:true,hint:'Name the AzureActivity operation and describe a useful identity/team filter.',points:10}),
      ]},
    ],completion:{requireAllSteps:true},
  };

  // Original source retained for attribution; this is the Mission Next SSH adaptation.
  function iamStep(ex, number, command, instruction, check, extra = {}) {
    return {
      id: `sa-5.ssh.ex${ex}.s${number}`,
      upstream: { exercise: 'Mission Next SSH access review', sourceLine: command || '' },
      kind: command ? 'command' : 'analyze',
      command,
      instruction,
      hint: command ? `Run \`${command}\` and read the output.` : null,
      acceptedInputs: command ? [{ type: 'exact', value: command }] : [],
      validation: { type: 'iamReview', check },
      points: 5,
      ...extra,
    };
  }

  const SA5_LAB = {
    id: 'sa-5',
    track: 'security-assessments',
    title: 'User Account Security Assessment',
    difficulty: 'Beginner',
    estimatedTime: '30 min',
    icon: '🪪',
    tags: ['SSH', 'sudo', 'IAM', 'Account Review'],
    source: {
      repo: '0xrajneesh/Security-Assessments-projects-for-Beginners',
      file: 'project-5-User Account Security Assessment.md',
      sha256: 'bd458aefbd6caf390f2e95ff84985210d60fba730507d093793fb6e58b42bcd8',
      snapshot: 'src/data/sources/sa-5.source.md',
    },
    environment: { type: 'linux', shell: 'IamReviewShell', fs: () => window.MISSION_NEXT_IAM_REVIEW.buildFs() },
    scenario: {
      role: 'You are a junior IAM analyst completing approved ticket IAM-2059.',
      incident: 'Connect to the Ubuntu server iam-server using your assigned analyst account. Compare local accounts with the HR roster, investigate unusual contractor logins, remove unauthorized administrator access, and verify the result. The contractor still needs standard access. The training SSH key and trusted host key are already configured; all activity is simulated.',
    },
    beginnerGuide: 'SSH connects you to the server; Bash runs your commands there; sudo authorizes administrative actions. Type each shown command and press Enter. For findings, use the answer box. The guided sudoers editor has Save and Cancel buttons. Your workspace and progress resume when you return.',
    completionMessage: 'The access review and SOC escalation notes are recorded. Return to Module 2 to continue.',
    exercises: [
      { id: 'ex1', upstreamHeading: 'Connect and confirm the server', steps: [
        iamStep(1, 1, 'ssh analyst@iam-server', 'Open the approved SSH session using your assigned training key. Watch the prompt change to analyst@iam-server.', 'connected', {
          learning: { title: 'You connected through SSH', what: 'The preconfigured key authenticates the analyst and the trusted host key identifies iam-server.', why: 'Confirm the destination before reviewing or changing access.' },
        }),
        iamStep(1, 2, 'whoami', 'Confirm that your remote session uses the analyst account.', 'identity'),
        iamStep(1, 3, 'hostname', 'Confirm that you reached iam-server, the host named in the ticket.', 'host'),
      ] },
      { id: 'ex2', upstreamHeading: 'Find unauthorized administrator access', steps: [
        iamStep(2, 1, 'cat /home/analyst/hr-roster.txt', 'Read the approved access, source address, working hours, and change scope. Which account is a contractor?', 'rosterRead'),
        iamStep(2, 2, 'getent group sudo', 'List the administrator group. Compare its members with the HR roster and identify the contractor.', 'adminMembers'),
        iamStep(2, 3, 'sudo -l -U temp.contractor', 'Inspect the contractor’s effective sudo permissions. Notice both the group grant and the separate passwordless grant.', 'sudoListed', {
          learning: { title: 'Two paths grant administrator access', what: 'The sudo group permits administrator commands. A separate NOPASSWD: ALL rule grants them without a password prompt.', why: 'Removing one grant does not remove the other. Verification must inspect effective permissions.' },
        }),
      ] },
      { id: 'ex3', upstreamHeading: 'Investigate login evidence', steps: [
        iamStep(3, 1, "sudo grep -F 'temp.contractor' /var/log/auth.log", 'Read the contractor’s authentication and sudo events. Count failed passwords, then locate the successful login. Keep the evidence intact.', 'logRead'),
        iamStep(3, 2, null, 'Which source IP appears in the failed attempts and successful login? Compare it with the approved source in the HR roster, then enter the observed IP below.', 'sourceIp', { answerLabel: 'Observed source IP', points: 10 }),
        iamStep(3, 3, null, 'At what UTC time did the contractor successfully log in? Enter HH:MM:SS. Compare that time with the approved working hours.', 'loginTime', { answerLabel: 'Successful login time (UTC)', points: 10 }),
      ] },
      { id: 'ex4', upstreamHeading: 'Remove both unauthorized grants', steps: [
        iamStep(4, 1, 'sudo gpasswd -d temp.contractor sudo', 'Remove the contractor from the sudo group. Keep their engineering group and standard account access.', 'groupRemoved', { points: 10 }),
        iamStep(4, 2, 'sudo visudo', 'Open the guided sudoers editor. Delete the entire temp.contractor rule, keep the root and %sudo rules, then select Save. Opening the editor alone does not complete this step.', 'policySaved', { points: 10 }),
        iamStep(4, 3, 'sudo visudo -c', 'Check the saved sudoers configuration for errors before verifying permissions.', 'policyChecked'),
      ] },
      { id: 'ex5', upstreamHeading: 'Verify and record the findings', steps: [
        iamStep(5, 1, 'id temp.contractor', 'Confirm the account still exists and retains engineering membership, with no sudo group.', 'groupsListed'),
        iamStep(5, 2, 'sudo -l -U temp.contractor', 'Verify that the account is no longer allowed to run sudo. A denial is the expected successful outcome of this review.', 'permissionsVerified', {
          validation: { type: 'iamReview', check: 'permissionsVerified', exitCode: 1 },
          learning: { title: 'Administrator access is removed', what: 'The account retains standard access, but neither administrator grant remains.', why: 'Checking actual permissions confirms the change worked. This case has no existing contractor sessions or privileged processes to terminate.' },
        }),
        iamStep(5, 3, null, 'Write a short case note: account reviewed; group and direct sudoers grants removed; source IP; number of failed passwords; successful-login time in UTC; verification result; and escalation to the SOC. Preserve the original logs. Suspicious activity needs investigation, not an automatic conclusion that compromise is proven.', 'report', {
          answerLabel: 'IAM-2059 case note', answerMultiline: true, points: 15,
        }),
      ] },
    ],
    completion: { requireAllSteps: true },
  };

  // ────────────────────────────────────────────────────────────
  //  Register
  // ────────────────────────────────────────────────────────────
  Object.assign(window.MISSION_NEXT_LABS = window.MISSION_NEXT_LABS || {}, {
    'sa-2': SA2_LAB,
    'sa-3': SA3_LAB,
    'sa-4': SA4_LAB,
    'sa-5': SA5_LAB,
    'sa-6': SA6_LAB,
    'sa-7': SA7_LAB,
    'sa-8': SA8_LAB,
    'sa-9': SA9_LAB,
  });

  Object.assign(window, {
    MISSION_NEXT_SA_2: SA2_LAB,
    MISSION_NEXT_SA_3: SA3_LAB,
    MISSION_NEXT_SA_4: SA4_LAB,
    MISSION_NEXT_SA_5: SA5_LAB,
    MISSION_NEXT_SA_6: SA6_LAB,
    MISSION_NEXT_SA_7: SA7_LAB,
    MISSION_NEXT_SA_8: SA8_LAB,
    MISSION_NEXT_SA_9: SA9_LAB,
  });
})();
