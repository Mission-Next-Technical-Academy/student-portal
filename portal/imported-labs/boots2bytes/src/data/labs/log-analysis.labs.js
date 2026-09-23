// ============================================================
//  Log Analysis Track — Labs
// ============================================================
//  Owner: Phase 0 ships lap-1 (Apache) as the gold reference.
//  Agent 02 fills lap-2 (Syslog) and lap-4 (ELK).
//  lap-3 (Windows Event Log) and lap-5 (Sysmon) are already
//  served by their gold shells in lab-shells.jsx and stay there
//  until a future migration.
// ============================================================

(function () {
  // ──────────────────────────────────────────────────────────────
  //  lap-1  Apache access.log + error.log (synthetic)
  // ──────────────────────────────────────────────────────────────

  const UA_CHROME_WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';
  const UA_CHROME_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';
  const UA_FIREFOX    = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0';
  const UA_EDGE       = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.2420.81';
  const UA_BOT        = 'Mozilla/5.0 (compatible; CorpScanner/0.4; +http://internal/scan)';
  const UA_CURL       = 'curl/8.4.0';

  // Deterministic time generator: returns sequential timestamps starting on 2026-04-23 09:00:00 -0400.
  function makeClock() {
    let day = 23, hour = 9, minute = 0, second = 0;
    return function tick(deltaSec) {
      second += (deltaSec || 0);
      while (second >= 60) { second -= 60; minute += 1; }
      while (minute >= 60) { minute -= 60; hour += 1; }
      while (hour >= 24) { hour -= 24; day += 1; }
      const d = String(day).padStart(2, '0');
      const h = String(hour).padStart(2, '0');
      const m = String(minute).padStart(2, '0');
      const s = String(second).padStart(2, '0');
      return `[${d}/Apr/2026:${h}:${m}:${s} -0400]`;
    };
  }

  function buildApacheAccessLog() {
    const lines = [];
    const tick = makeClock();
    function add(ip, method, path, status, size, ua, deltaSec) {
      const ts = tick(deltaSec || 7);
      lines.push(`${ip} - - ${ts} "${method} ${path} HTTP/1.1" ${status} ${size} "-" "${ua}"`);
    }

    function repeat(n, fn) { for (let i = 0; i < n; i++) fn(i); }

    // Block A — 192.168.1.100  (47 lines, 5 probe-404s)
    // Daytime workstation; later in the day starts probing sensitive paths.
    repeat(18, () => add('192.168.1.100', 'GET', '/index.html',           200, 2326, UA_CHROME_WIN));
    repeat(5,  () => add('192.168.1.100', 'GET', '/about',                200,  812, UA_CHROME_WIN));
    repeat(5,  () => add('192.168.1.100', 'GET', '/products',             200, 1840, UA_CHROME_WIN));
    repeat(4,  () => add('192.168.1.100', 'GET', '/api/products.json',    200, 4912, UA_CHROME_WIN));
    repeat(5,  () => add('192.168.1.100', 'GET', '/static/css/main.css',  200, 1284, UA_CHROME_WIN));
    repeat(5,  () => add('192.168.1.100', 'GET', '/static/js/app.js',     304,    0, UA_CHROME_WIN));
    // The probing burst — 5 distinct sensitive-path requests that all 404.
    add('192.168.1.100', 'GET', '/admin/',           404,  291, UA_CHROME_WIN, 90);
    add('192.168.1.100', 'GET', '/backup.zip',       404,  289, UA_CHROME_WIN, 4);
    add('192.168.1.100', 'GET', '/.env',             404,  287, UA_CHROME_WIN, 3);
    add('192.168.1.100', 'GET', '/wp-admin/',        404,  293, UA_CHROME_WIN, 5);
    add('192.168.1.100', 'GET', '/phpmyadmin/',      404,  295, UA_CHROME_WIN, 4);

    // Block B — 10.0.0.5  (31 lines, all 2xx/3xx)
    repeat(12, () => add('10.0.0.5', 'GET', '/index.html',         200, 2326, UA_CHROME_MAC));
    repeat(6,  () => add('10.0.0.5', 'GET', '/about',              200,  812, UA_CHROME_MAC));
    repeat(5,  () => add('10.0.0.5', 'GET', '/contact',            200,  642, UA_CHROME_MAC));
    repeat(5,  () => add('10.0.0.5', 'GET', '/api/users',          200, 3128, UA_CHROME_MAC));
    repeat(3,  () => add('10.0.0.5', 'GET', '/favicon.ico',        304,    0, UA_CHROME_MAC));

    // Block C — 198.51.100.42  (12 lines, 6 × 404 to /old-page)
    repeat(4,  () => add('198.51.100.42', 'GET', '/index.html',    200, 2326, UA_FIREFOX));
    repeat(2,  () => add('198.51.100.42', 'GET', '/api/health',    200,   85, UA_FIREFOX));
    repeat(6,  () => add('198.51.100.42', 'GET', '/old-page',      404,  290, UA_FIREFOX));

    // Block D — 10.0.0.18  (22 lines, all 200/304)
    repeat(8,  () => add('10.0.0.18', 'GET', '/index.html',        200, 2326, UA_EDGE));
    repeat(6,  () => add('10.0.0.18', 'GET', '/about',             200,  812, UA_EDGE));
    repeat(4,  () => add('10.0.0.18', 'GET', '/products',          200, 1840, UA_EDGE));
    repeat(4,  () => add('10.0.0.18', 'GET', '/api/products.json', 200, 4912, UA_EDGE));

    // Block E — 192.168.1.45  (18 lines)
    repeat(7,  () => add('192.168.1.45', 'GET', '/index.html',     200, 2326, UA_CHROME_WIN));
    repeat(4,  () => add('192.168.1.45', 'GET', '/about',          200,  812, UA_CHROME_WIN));
    repeat(3,  () => add('192.168.1.45', 'GET', '/contact',        200,  642, UA_CHROME_WIN));
    repeat(4,  () => add('192.168.1.45', 'GET', '/products',       200, 1840, UA_CHROME_WIN));

    // Block F — 192.168.1.205  (9 lines, 1 × 404 to /missing.html)
    repeat(4,  () => add('192.168.1.205', 'GET', '/index.html',    200, 2326, UA_CHROME_WIN));
    repeat(4,  () => add('192.168.1.205', 'GET', '/about',         200,  812, UA_CHROME_WIN));
    add('192.168.1.205', 'GET', '/missing.html',                   404,  291, UA_CHROME_WIN);

    // Block G — 203.0.113.5  (8 lines)
    repeat(3,  () => add('203.0.113.5', 'GET', '/api/health',      200,   85, UA_CURL));
    repeat(3,  () => add('203.0.113.5', 'GET', '/index.html',      200, 2326, UA_CURL));
    repeat(2,  () => add('203.0.113.5', 'GET', '/products',        200, 1840, UA_CURL));

    // Block H — 10.0.0.42  (7 lines)
    repeat(5,  () => add('10.0.0.42', 'GET', '/index.html',        200, 2326, UA_BOT));
    repeat(2,  () => add('10.0.0.42', 'GET', '/about',             200,  812, UA_BOT));

    return lines.join('\n') + '\n';
  }

  function buildApacheErrorLog() {
    // Realistic Apache error log: AH00xxx codes, [Wed Apr 23 09:..] timestamps,
    // mix of file-not-found, permission-denied, and a script error.
    const lines = [
      '[Wed Apr 23 09:01:18.418229 2026] [mpm_event:notice] [pid 9211:tid 140123456789] AH00489: Apache/2.4.58 (Ubuntu) configured -- resuming normal operations',
      '[Wed Apr 23 09:01:18.418315 2026] [core:notice] [pid 9211:tid 140123456789] AH00094: Command line: \'/usr/sbin/apache2\'',
      // Five "File does not exist" entries — the dominant pattern.
      '[Wed Apr 23 13:42:09.115421 2026] [core:error] [pid 9215:tid 140123456777] [client 192.168.1.100:51124] AH00128: File does not exist: /var/www/html/admin/',
      '[Wed Apr 23 13:42:13.302118 2026] [core:error] [pid 9215:tid 140123456777] [client 192.168.1.100:51125] AH00128: File does not exist: /var/www/html/backup.zip',
      '[Wed Apr 23 13:42:16.518902 2026] [core:error] [pid 9215:tid 140123456777] [client 192.168.1.100:51126] AH00128: File does not exist: /var/www/html/.env',
      '[Wed Apr 23 13:42:21.094117 2026] [core:error] [pid 9215:tid 140123456777] [client 192.168.1.100:51127] AH00128: File does not exist: /var/www/html/wp-admin/',
      '[Wed Apr 23 13:42:25.612008 2026] [core:error] [pid 9215:tid 140123456777] [client 192.168.1.100:51128] AH00128: File does not exist: /var/www/html/phpmyadmin/',
      // External actor probing /old-page repeatedly.
      '[Wed Apr 23 14:08:12.225112 2026] [core:error] [pid 9216:tid 140123456778] [client 198.51.100.42:42018] AH00128: File does not exist: /var/www/html/old-page',
      '[Wed Apr 23 14:11:09.118203 2026] [core:error] [pid 9216:tid 140123456778] [client 198.51.100.42:42019] AH00128: File does not exist: /var/www/html/old-page',
      '[Wed Apr 23 14:14:21.330091 2026] [core:error] [pid 9216:tid 140123456778] [client 198.51.100.42:42020] AH00128: File does not exist: /var/www/html/old-page',
      '[Wed Apr 23 14:18:42.718202 2026] [core:error] [pid 9216:tid 140123456778] [client 198.51.100.42:42021] AH00128: File does not exist: /var/www/html/old-page',
      '[Wed Apr 23 14:21:55.408012 2026] [core:error] [pid 9216:tid 140123456778] [client 198.51.100.42:42022] AH00128: File does not exist: /var/www/html/old-page',
      '[Wed Apr 23 14:24:02.115290 2026] [core:error] [pid 9216:tid 140123456778] [client 198.51.100.42:42023] AH00128: File does not exist: /var/www/html/old-page',
      // Permission denied (rare).
      '[Wed Apr 23 16:02:15.881122 2026] [core:error] [pid 9217:tid 140123456779] [client 10.0.0.5:33012] AH01797: client denied by server configuration: /var/www/html/.htaccess',
      // Script error.
      '[Thu Apr 24 09:11:34.504018 2026] [php:error] [pid 9218:tid 140123456780] [client 10.0.0.18:51902] PHP Notice:  Undefined index: id in /var/www/html/api/products.php on line 42',
      // Day-2 file-not-found.
      '[Thu Apr 24 10:02:02.118444 2026] [core:error] [pid 9218:tid 140123456780] [client 192.168.1.205:39021] AH00128: File does not exist: /var/www/html/missing.html',
    ];
    return lines.join('\n') + '\n';
  }

  function buildLap1Fs() {
    return {
      'home': {
        'student': {
          '.bashrc':         '# auto-generated student bashrc\nalias ll="ls -la"\nexport PS1="\\u@\\h:\\w\\$ "\n',
          '.bash_history':   '',
        },
      },
      'var': {
        'log': {
          'apache2': {
            'access.log':      buildApacheAccessLog(),
            'error.log':       buildApacheErrorLog(),
            'access.log.1.gz': { __file: true, content: ' compressed-binary-data', mode: '0640', owner: 'root', group: 'adm' },
            'other_vhosts_access.log': { __file: true, content: '', mode: '0640', owner: 'root', group: 'adm' },
          },
          'syslog':          '(unrelated entries)\n',
        },
        'www': {
          'html': {
            'index.html':      '<html><body>Welcome to Boots2Bytes Web</body></html>\n',
          },
        },
      },
      'etc': {
        'apache2': {
          'apache2.conf':    '# Apache configuration\nServerName web-01.corp.example.local\n',
        },
      },
      'tmp': {},
    };
  }

  // ─── lap-1 schema-conformant lab ──────────────────────────────
  const LAP_1_LAB = {
    id: 'lap-1',
    track: 'log-analysis',
    title: 'Basic Apache Web Server Log Analysis',
    difficulty: 'Beginner',
    estimatedTime: '45 min',
    icon: '🛠',
    tags: ['Apache', 'Bash', 'grep', 'awk', 'Triage'],

    source: {
      repo: '0xrajneesh/Log-Analysis-Projects-for-Beginners',
      file: 'Project-1-Apache-Web-Server-Log-Analysis.md',
      sha256: 'f9d6f46405d491b896db3e622e44f7c3a188846114fb7e4aa59bd57641ae4cc9',
      snapshot: 'src/data/sources/lap-1.source.md',
    },

    environment: {
      type: 'linux',
      shell: 'LinuxTerminalShell',
      fs: buildLap1Fs,
    },

    scenario: {
      role: 'Junior SOC analyst on web-team rotation',
      incident: 'Routine review of last week\'s Apache logs on web-01.corp.example.local has flagged a possible internal scan attempt. You are asked to triage access.log and error.log, then summarize who is making the most requests and to which paths.',
    },

    exercises: [
      {
        id: 'ex1',
        upstreamHeading: 'Exercise 1: Accessing Apache Log Files',
        steps: [
          {
            id: 'lap-1.ex1.s1',
            upstream: { exercise: 'Exercise 1', stepNumber: 1, sourceLine: 'Open terminal on Linux machine' },
            kind: 'observe',
            instruction: 'A Linux terminal is already open on the left. Press Enter on an empty line in the shell to confirm you have a prompt, then move on.',
            acceptedInputs: [{ type: 'regex', value: /^\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'lap-1.ex1.s2',
            upstream: { exercise: 'Exercise 1', stepNumber: 2, sourceLine: 'cd /var/log/apache2/' },
            kind: 'command',
            instruction: 'Change into the Apache log directory.',
            hint: 'Type `cd /var/log/apache2/` (or without the trailing slash).',
            acceptedInputs: [{ type: 'regex', value: /^cd\s+\/var\/log\/apache2\/?\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
            checkOnLearning: 'col-q1',
          },
          {
            id: 'lap-1.ex1.s3',
            upstream: { exercise: 'Exercise 1', stepNumber: 3, sourceLine: 'ls -l' },
            kind: 'command',
            instruction: 'List the files in the directory using a long listing.',
            hint: 'Try `ls -l` or `ls -la`.',
            acceptedInputs: [{ type: 'regex', value: /^ls\s+-l\w*\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
        ],
      },
      {
        id: 'ex2',
        upstreamHeading: 'Exercise 2: Understanding Access Logs',
        steps: [
          {
            id: 'lap-1.ex2.s1',
            upstream: { exercise: 'Exercise 2', stepNumber: 1, sourceLine: 'less access.log' },
            kind: 'command',
            instruction: 'Page through access.log to study its layout.',
            hint: 'Run `less access.log`. Press q when you are done browsing.',
            acceptedInputs: [{ type: 'regex', value: /^less\s+access\.log\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 10,
            checkOnLearning: 'col-q2',
          },
          {
            id: 'lap-1.ex2.s2',
            upstream: { exercise: 'Exercise 2', stepNumber: 2, sourceLine: 'Observe entry format (IP, timestamp, method, URL, status, agent)' },
            kind: 'analyze',
            instruction: 'Pick out the request method that appears in every line of access.log. Submit the method below.',
            hint: 'It is a single uppercase word. Look right after the closing bracket of the timestamp.',
            validation: { type: 'valueExtracted', expected: ['GET'] },
            points: 10,
          },
          {
            id: 'lap-1.ex2.s3',
            upstream: { exercise: 'Exercise 2', stepNumber: 3, sourceLine: 'Identify and breakdown sample entries' },
            kind: 'analyze',
            instruction: 'In a successful access-log entry, what HTTP status code is reported? Submit the 3-digit code.',
            hint: 'It is the number that appears just after the request line in quotes.',
            validation: { type: 'valueExtracted', expected: ['200'] },
            points: 10,
          },
        ],
      },
      {
        id: 'ex3',
        upstreamHeading: 'Exercise 3: Filtering Log Entries',
        steps: [
          {
            id: 'lap-1.ex3.s1',
            upstream: { exercise: 'Exercise 3', stepNumber: 1, sourceLine: "grep '192.168.1.100' access.log" },
            kind: 'command',
            instruction: 'Filter access.log to show only requests from 192.168.1.100.',
            hint: "Use grep with the IP in single quotes: grep '192.168.1.100' access.log",
            acceptedInputs: [{ type: 'regex', value: /^grep\s+['"]?192\.168\.1\.100['"]?\s+access\.log\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 10,
          },
          {
            id: 'lap-1.ex3.s2',
            upstream: { exercise: 'Exercise 3', stepNumber: 2, sourceLine: "grep ' 404 ' access.log" },
            kind: 'command',
            instruction: 'Filter access.log to show only entries with HTTP status 404. Use spaces around 404 so you don\'t match URLs that happen to contain that substring.',
            hint: "Try: grep ' 404 ' access.log",
            acceptedInputs: [{ type: 'regex', value: /^grep\s+['"]\s*404\s*['"]\s+access\.log\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 15,
          },
          {
            id: 'lap-1.ex3.s3',
            upstream: { exercise: 'Exercise 3', stepNumber: 3, sourceLine: "grep '192.168.1.100' access.log | grep ' 404 '" },
            kind: 'command',
            instruction: 'Combine the two filters: only entries from 192.168.1.100 that returned 404.',
            hint: "Pipe one grep into the next: grep '192.168.1.100' access.log | grep ' 404 '",
            acceptedInputs: [{ type: 'regex', value: /^grep\s+['"]?192\.168\.1\.100['"]?\s+access\.log\s*\|\s*grep\s+['"]\s*404\s*['"]\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 20,
            checkOnLearning: 'col-q3',
          },
        ],
      },
      {
        id: 'ex4',
        upstreamHeading: 'Exercise 4: Analyzing Error Logs',
        steps: [
          {
            id: 'lap-1.ex4.s1',
            upstream: { exercise: 'Exercise 4', stepNumber: 1, sourceLine: 'less error.log' },
            kind: 'command',
            instruction: 'Page through error.log to identify the kinds of errors Apache is recording.',
            hint: 'Run `less error.log`. Notice the [pid …] tags and the AH00128 codes.',
            acceptedInputs: [{ type: 'regex', value: /^less\s+error\.log\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 10,
            checkOnLearning: 'col-q4',
          },
          {
            id: 'lap-1.ex4.s2',
            upstream: { exercise: 'Exercise 4', stepNumber: 2, sourceLine: 'Identify error types (missing files, scripts, permissions)' },
            kind: 'analyze',
            instruction: 'Most error.log entries share the same Apache error code. Submit that 5-character code (starts with AH).',
            hint: 'Look for the code right after the [pid …] tag — e.g., AH00xxx.',
            validation: { type: 'valueExtracted', expected: ['AH00128'] },
            points: 15,
          },
          {
            id: 'lap-1.ex4.s3',
            upstream: { exercise: 'Exercise 4', stepNumber: 3, sourceLine: 'Note timestamps and error frequency patterns' },
            kind: 'analyze',
            instruction: 'Across the error log, which client IP fires the most "File does not exist" entries?',
            hint: 'Look at the [client …] field. The repeating one is your answer.',
            validation: { type: 'valueExtracted', expected: ['192.168.1.100', '198.51.100.42'] },
            points: 15,
          },
        ],
      },
      {
        id: 'ex5',
        upstreamHeading: 'Exercise 5: Summarizing Log Data',
        steps: [
          {
            id: 'lap-1.ex5.s1',
            upstream: { exercise: 'Exercise 5', stepNumber: 1, sourceLine: "awk '{print $1}' access.log | sort | uniq -c | sort -nr" },
            kind: 'command',
            instruction: 'Build a top-IP histogram: extract column 1 from access.log, sort, count uniques, and sort by count descending.',
            hint: "awk '{print $1}' access.log | sort | uniq -c | sort -nr",
            acceptedInputs: [{ type: 'regex', value: /awk\s+['"]?\{\s*print\s+\$1\s*\}['"]?\s+access\.log\s*\|\s*sort\s*\|\s*uniq\s+-c\s*\|\s*sort\s+-n?r\w*/i }],
            validation: { type: 'commandExecuted' },
            points: 20,
            checkOnLearning: 'col-q5',
          },
          {
            id: 'lap-1.ex5.s2',
            upstream: { exercise: 'Exercise 5', stepNumber: 2, sourceLine: "awk '{print $4}' access.log | cut -d: -f1 | sort | uniq -c" },
            kind: 'command',
            instruction: 'Build a per-day request count: extract column 4 (the timestamp), keep only the date portion, sort, and count.',
            hint: "awk '{print $4}' access.log | cut -d: -f1 | sort | uniq -c",
            acceptedInputs: [{ type: 'regex', value: /awk\s+['"]?\{\s*print\s+\$4\s*\}['"]?\s+access\.log\s*\|\s*cut\s+-d\s*['"]?:\s*['"]?\s+-f\s*1\s*\|\s*sort\s*\|\s*uniq\s+-c/i }],
            validation: { type: 'commandExecuted' },
            points: 15,
          },
          {
            id: 'lap-1.ex5.s3',
            upstream: { exercise: 'Exercise 5', stepNumber: 3, sourceLine: "awk '{print $7}' access.log | sort | uniq -c | sort -nr" },
            kind: 'command',
            instruction: 'Build a top-URL histogram from column 7. Confirm /index.html dominates.',
            hint: "awk '{print $7}' access.log | sort | uniq -c | sort -nr",
            acceptedInputs: [{ type: 'regex', value: /awk\s+['"]?\{\s*print\s+\$7\s*\}['"]?\s+access\.log\s*\|\s*sort\s*\|\s*uniq\s+-c\s*\|\s*sort\s+-n?r\w*/i }],
            validation: { type: 'commandExecuted' },
            points: 20,
          },
        ],
      },
    ],

    checkOnLearning: [
      {
        id: 'col-q1',
        bloom: 'recall',
        question: 'On Debian/Ubuntu, where does Apache write its access and error logs by default?',
        type: 'short-answer',
        acceptedAnswer: ['/var/log/apache2', '/var/log/apache2/'],
        triggerOn: { stepId: 'lap-1.ex1.s2' },
        reinforces: 'lap-1.ex1.s2',
      },
      {
        id: 'col-q2',
        bloom: 'comprehension',
        question: 'In the Apache combined-log format you just paged through, which two fields together identify the requested resource?',
        type: 'multi-select',
        options: [
          { id: 'a', text: 'HTTP method (e.g., GET) and URL path', correct: true },
          { id: 'b', text: 'Status code and response size', correct: false },
          { id: 'c', text: 'Client IP and User-Agent string', correct: false },
          { id: 'd', text: 'Timestamp and protocol version', correct: false },
        ],
        passThreshold: 'all-correct',
        triggerOn: { stepId: 'lap-1.ex2.s1' },
        reinforces: 'lap-1.ex2.s1',
      },
      {
        id: 'col-q3',
        bloom: 'analysis',
        question: 'Your two-step grep showed five 404s from 192.168.1.100, all targeting /admin/, /backup.zip, /.env, /wp-admin/, and /phpmyadmin/. Pick every interpretation that applies.',
        type: 'multi-select',
        options: [
          { id: 'a', text: '192.168.1.100 is performing path enumeration / probing for sensitive resources', correct: true },
          { id: 'b', text: 'Those five paths are well-known attack-tool target paths', correct: true },
          { id: 'c', text: 'These are routine typos a normal user would make in a browser address bar', correct: false },
          { id: 'd', text: 'A 404 means the requests succeeded; nothing to investigate', correct: false },
        ],
        passThreshold: 'all-correct',
        triggerOn: { stepId: 'lap-1.ex3.s3' },
        reinforces: 'lap-1.ex3.s3',
      },
      {
        id: 'col-q4',
        bloom: 'recall',
        question: 'In Apache, an error of "AH00128: File does not exist" usually corresponds to what status code in access.log?',
        type: 'single-select',
        options: [
          { id: 'a', text: '200 OK', correct: false },
          { id: 'b', text: '301 Moved Permanently', correct: false },
          { id: 'c', text: '404 Not Found', correct: true },
          { id: 'd', text: '500 Internal Server Error', correct: false },
        ],
        triggerOn: { stepId: 'lap-1.ex4.s1' },
        reinforces: 'lap-1.ex4.s1',
      },
      {
        id: 'col-q5',
        bloom: 'application',
        question: '192.168.1.100 made 47 requests, five of which were 404 probes for sensitive paths. Pick every reasonable next investigative step.',
        type: 'multi-select',
        options: [
          { id: 'a', text: 'Correlate 192.168.1.100 with the asset inventory to identify the workstation and assigned user', correct: true },
          { id: 'b', text: 'Pull all activity from that IP in auth.log, firewall logs, and EDR for the same window', correct: true },
          { id: 'c', text: 'Block the IP at the edge firewall before any further investigation', correct: false },
          { id: 'd', text: 'Open a ticket for the user assigned to the workstation', correct: true },
        ],
        passThreshold: 'all-correct',
        triggerOn: { stepId: 'lap-1.ex5.s1' },
        reinforces: 'lap-1.ex5.s1',
      },
    ],

    completion: {
      requireAllSteps: true,
      minQuizScore: 0.8,
    },
  };

  function buildLap2RsyslogConf() {
    return [
      '# /etc/rsyslog.conf - Boots2Bytes synthetic training config',
      'module(load="imuxsock")',
      'module(load="imklog")',
      '',
      '*.*;auth,authpriv.none          -/var/log/syslog',
      'auth,authpriv.*                 /var/log/auth.log',
      'kern.*                          -/var/log/kern.log',
      'mail.*                          -/var/log/mail.log',
      'cron.*                          -/var/log/cron.log',
      '',
      '# Keep traditional messages file for compatibility',
      '*.info;mail.none;authpriv.none;cron.none                /var/log/messages',
    ].join('\n') + '\n';
  }

  function buildLap2Syslog() {
    return [
      'Jun 12 09:00:41 app-db-02 systemd[1]: Started Session 514 of user j.sanders.',
      'Jun 12 09:01:02 app-db-02 CRON[884]: (root) CMD (run-parts /etc/cron.hourly)',
      'Jun 12 09:02:17 app-db-02 systemd[1]: Starting Daily apt download activities...',
      'Jun 12 09:03:18 app-db-02 sshd[22341]: Failed password for invalid user admin from 203.0.113.5 port 51022 ssh2',
      'Jun 12 09:03:44 app-db-02 sshd[22341]: Failed password for root from 203.0.113.5 port 51037 ssh2',
      'Jun 12 09:04:12 app-db-02 kernel: [1042.391122] audit: type=1400 apparmor="ALLOWED" profile="/usr/sbin/sshd"',
      'Jun 12 09:04:58 app-db-02 sshd[22341]: Failed password for root from 203.0.113.5 port 51051 ssh2',
      'Jun 12 09:05:11 app-db-02 sudo: j.sanders : TTY=pts/0 ; PWD=/home/j.sanders ; USER=root ; COMMAND=/usr/bin/systemctl status ssh',
      'Jun 12 09:05:39 app-db-02 sshd[22341]: Failed password for invalid user backup from 198.51.100.24 port 51102 ssh2',
      'Jun 12 09:06:07 app-db-02 CRON[884]: pam_unix(cron:session): session opened for user root(uid=0) by (uid=0)',
      'Jun 12 09:06:22 app-db-02 sshd[22341]: Failed password for root from 203.0.113.5 port 51131 ssh2',
      'Jun 12 09:06:54 app-db-02 sshd[22341]: Failed password for root from 203.0.113.5 port 51144 ssh2',
      'Jun 12 09:07:21 app-db-02 sshd[22341]: Failed password for root from 192.0.2.45 port 51192 ssh2',
      'Jun 12 09:07:55 app-db-02 systemd[1]: Started Daily apt download activities.',
      'Jun 12 09:08:03 app-db-02 sshd[22341]: Failed password for invalid user oracle from 198.51.100.24 port 51209 ssh2',
      'Jun 12 09:08:46 app-db-02 sshd[22341]: Failed password for root from 203.0.113.5 port 51221 ssh2',
      'Jun 12 09:09:13 app-db-02 CRON[884]: pam_unix(cron:session): session closed for user root',
      'Jun 12 09:09:41 app-db-02 sshd[22341]: Accepted password for temp.contractor from 203.0.113.5 port 51234 ssh2',
      'Jun 12 09:10:02 app-db-02 sshd[22341]: Accepted password for j.sanders from 10.10.24.17 port 51301 ssh2',
      'Jun 12 09:10:55 app-db-02 sudo: temp.contractor : TTY=pts/1 ; PWD=/home/temp.contractor ; USER=root ; COMMAND=/usr/bin/id',
      'Jun 12 09:11:07 app-db-02 sudo: temp.contractor : TTY=pts/1 ; PWD=/home/temp.contractor ; USER=root ; COMMAND=/usr/bin/cat /etc/sudoers.d/db-maint',
      'Jun 12 09:11:33 app-db-02 kernel: [1440.902110] audit: type=1400 apparmor="DENIED" operation="open" profile="/usr/sbin/sshd" name="/root/.ssh/authorized_keys"',
      'Jun 12 09:12:09 app-db-02 systemd[1]: Stopping User Manager for UID 1001...',
      'Jun 12 09:12:30 app-db-02 sshd[22341]: Accepted password for svc_backup from 10.10.24.9 port 51318 ssh2',
      'Jun 12 09:13:11 app-db-02 CRON[884]: (root) CMD (test -x /usr/sbin/anacron && run-parts /etc/cron.daily)',
    ].join('\n') + '\n';
  }

  function buildLap2AuthLog() {
    return [
      'Jun 12 09:03:18 app-db-02 sshd[22341]: Failed password for invalid user admin from 203.0.113.5 port 51022 ssh2',
      'Jun 12 09:03:44 app-db-02 sshd[22341]: Failed password for root from 203.0.113.5 port 51037 ssh2',
      'Jun 12 09:04:58 app-db-02 sshd[22341]: Failed password for root from 203.0.113.5 port 51051 ssh2',
      'Jun 12 09:05:39 app-db-02 sshd[22341]: Failed password for invalid user backup from 198.51.100.24 port 51102 ssh2',
      'Jun 12 09:06:22 app-db-02 sshd[22341]: Failed password for root from 203.0.113.5 port 51131 ssh2',
      'Jun 12 09:06:54 app-db-02 sshd[22341]: Failed password for root from 203.0.113.5 port 51144 ssh2',
      'Jun 12 09:07:21 app-db-02 sshd[22341]: Failed password for root from 192.0.2.45 port 51192 ssh2',
      'Jun 12 09:08:03 app-db-02 sshd[22341]: Failed password for invalid user oracle from 198.51.100.24 port 51209 ssh2',
      'Jun 12 09:08:46 app-db-02 sshd[22341]: Failed password for root from 203.0.113.5 port 51221 ssh2',
      'Jun 12 09:09:41 app-db-02 sshd[22341]: Accepted password for temp.contractor from 203.0.113.5 port 51234 ssh2',
      'Jun 12 09:10:02 app-db-02 sshd[22341]: Accepted password for j.sanders from 10.10.24.17 port 51301 ssh2',
      'Jun 12 09:10:55 app-db-02 sudo: temp.contractor : TTY=pts/1 ; PWD=/home/temp.contractor ; USER=root ; COMMAND=/usr/bin/id',
      'Jun 12 09:11:07 app-db-02 sudo: temp.contractor : TTY=pts/1 ; PWD=/home/temp.contractor ; USER=root ; COMMAND=/usr/bin/cat /etc/sudoers.d/db-maint',
      'Jun 12 09:12:30 app-db-02 sshd[22341]: Accepted password for svc_backup from 10.10.24.9 port 51318 ssh2',
      'Jun 12 09:13:02 app-db-02 sshd[22341]: Accepted password for temp.contractor from 203.0.113.5 port 51336 ssh2',
    ].join('\n') + '\n';
  }

  function buildLap2Fs() {
    return {
      'home': {
        'student': {
          '.bashrc': '# syslog lab shell\nexport PS1="student@app-db-02:\\w$ "\n',
        },
      },
      'etc': {
        'rsyslog.conf': buildLap2RsyslogConf(),
      },
      'var': {
        'log': {
          'syslog': buildLap2Syslog(),
          'auth.log': buildLap2AuthLog(),
          'kern.log': [
            'Jun 12 09:04:12 app-db-02 kernel: [1042.391122] audit: type=1400 apparmor="ALLOWED" profile="/usr/sbin/sshd"',
            'Jun 12 09:11:33 app-db-02 kernel: [1440.902110] audit: type=1400 apparmor="DENIED" operation="open" profile="/usr/sbin/sshd" name="/root/.ssh/authorized_keys"',
          ].join('\n') + '\n',
          'messages': [
            'Jun 12 09:00:41 app-db-02 systemd[1]: Started Session 514 of user j.sanders.',
            'Jun 12 09:01:02 app-db-02 CRON[884]: (root) CMD (run-parts /etc/cron.hourly)',
            'Jun 12 09:12:09 app-db-02 systemd[1]: Stopping User Manager for UID 1001...',
          ].join('\n') + '\n',
          'sshd.journal': [
            '-- Logs begin at Fri 2026-06-12 08:55:00 UTC, end at Fri 2026-06-12 09:13:02 UTC. --',
            'Jun 12 09:03:18 app-db-02 sshd[22341]: Failed password for invalid user admin from 203.0.113.5 port 51022 ssh2',
            'Jun 12 09:09:41 app-db-02 sshd[22341]: Accepted password for temp.contractor from 203.0.113.5 port 51234 ssh2',
          ].join('\n') + '\n',
        },
      },
      'tmp': {},
    };
  }

  const LAP_2_LAB = {
    id: 'lap-2',
    track: 'log-analysis',
    title: 'Introduction to Syslog Analysis on Linux Systems',
    difficulty: 'Beginner',
    estimatedTime: '40 min',
    tags: ['Syslog', 'Linux', 'SSH', 'sudo', 'grep', 'awk'],

    source: {
      repo: '0xrajneesh/Log-Analysis-Projects-for-Beginners',
      file: 'Project-2-Syslog-Analysis-on-Linux-Systems.md',
      sha256: 'ced05f27be5d59ee9ac5ac4df4df730abba61c3dff0ab09eb796fff99c30973e',
      snapshot: 'src/data/sources/lap-2.source.md',
    },

    environment: {
      type: 'linux',
      shell: 'LinuxTerminalShell',
      fs: buildLap2Fs,
    },

    scenario: {
      role: 'SOC analyst covering Linux infrastructure',
      incident: 'APP-DB-02 generated a burst of failed SSH logons from 203.0.113.5 followed by a successful login for temp.contractor and immediate sudo activity. You need to confirm the syslog configuration, isolate the SSH activity, and summarize the indicators for escalation.',
    },

    exercises: [
      {
        id: 'ex1',
        upstreamHeading: 'Exercise 1: Understanding Syslog Configuration',
        steps: [
          {
            id: 'lap-2.ex1.s1',
            upstream: { exercise: 'Exercise 1', stepNumber: 1, sourceLine: 'sudo nano /etc/rsyslog.conf' },
            kind: 'command',
            instruction: 'Open the rsyslog configuration file to review how facilities are routed.',
            hint: 'Run `sudo nano /etc/rsyslog.conf`.',
            acceptedInputs: [{ type: 'regex', value: /^sudo\s+nano\s+\/etc\/rsyslog\.conf\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 10,
            checkOnLearning: 'lap-2-col-1',
          },
          {
            id: 'lap-2.ex1.s2',
            upstream: { exercise: 'Exercise 1', stepNumber: 2, sourceLine: 'Review the configuration directives to understand how syslog is set up.' },
            kind: 'analyze',
            instruction: 'Which destination file receives the `auth,authpriv.*` facility in this configuration?',
            hint: 'Look for the line beginning with `auth,authpriv.*`.',
            validation: { type: 'valueExtracted', expected: ['/var/log/auth.log'] },
            points: 10,
          },
          {
            id: 'lap-2.ex1.s3',
            upstream: { exercise: 'Exercise 1', stepNumber: 3, sourceLine: 'Identify the different logging facilities and their corresponding log files.' },
            kind: 'analyze',
            instruction: 'Which facility writes kernel events to a dedicated file in this configuration?',
            hint: 'Submit the facility name exactly as it appears before the period.',
            validation: { type: 'valueExtracted', expected: ['kern'] },
            points: 10,
          },
        ],
      },
      {
        id: 'ex2',
        upstreamHeading: 'Exercise 2: Accessing Syslog Files',
        steps: [
          {
            id: 'lap-2.ex2.s1',
            upstream: { exercise: 'Exercise 2', stepNumber: 1, sourceLine: 'cd /var/log/' },
            kind: 'command',
            instruction: 'Move into the main log directory.',
            hint: 'Run `cd /var/log/`.',
            acceptedInputs: [{ type: 'regex', value: /^cd\s+\/var\/log\/?\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'lap-2.ex2.s2',
            upstream: { exercise: 'Exercise 2', stepNumber: 2, sourceLine: 'ls -l' },
            kind: 'command',
            instruction: 'List the available log files with a long listing.',
            hint: 'Run `ls -l`.',
            acceptedInputs: [{ type: 'regex', value: /^ls\s+-l\w*\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'lap-2.ex2.s3',
            upstream: { exercise: 'Exercise 2', stepNumber: 3, sourceLine: 'less syslog' },
            kind: 'command',
            instruction: 'Open the main syslog file and study the entry format.',
            hint: 'Run `less syslog`.',
            acceptedInputs: [{ type: 'regex', value: /^less\s+syslog\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 10,
            checkOnLearning: 'lap-2-col-2',
          },
        ],
      },
      {
        id: 'ex3',
        upstreamHeading: 'Exercise 3: Filtering Syslog Entries',
        steps: [
          {
            id: 'lap-2.ex3.s1',
            upstream: { exercise: 'Exercise 3', stepNumber: 1, sourceLine: "grep 'Jun 12' syslog" },
            kind: 'command',
            instruction: 'Filter syslog for entries from Jun 12.',
            hint: "Run `grep 'Jun 12' syslog`.",
            acceptedInputs: [{ type: 'regex', value: /^grep\s+['"]Jun 12['"]\s+syslog\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 10,
          },
          {
            id: 'lap-2.ex3.s2',
            upstream: { exercise: 'Exercise 3', stepNumber: 2, sourceLine: "grep 'sshd' syslog" },
            kind: 'command',
            instruction: 'Filter the same file for SSH daemon activity.',
            hint: "Run `grep 'sshd' syslog`.",
            acceptedInputs: [{ type: 'regex', value: /^grep\s+['"]sshd['"]\s+syslog\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 10,
          },
          {
            id: 'lap-2.ex3.s3',
            upstream: { exercise: 'Exercise 3', stepNumber: 3, sourceLine: "grep 'Jun 12' syslog | grep 'sshd'" },
            kind: 'command',
            instruction: 'Combine both filters so you only see SSH activity from the target date.',
            hint: "Run `grep 'Jun 12' syslog | grep 'sshd'`.",
            acceptedInputs: [{ type: 'regex', value: /^grep\s+['"]Jun 12['"]\s+syslog\s*\|\s*grep\s+['"]sshd['"]\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 15,
            checkOnLearning: 'lap-2-col-3',
          },
        ],
      },
      {
        id: 'ex4',
        upstreamHeading: 'Exercise 4: Analyzing Authentication Logs',
        steps: [
          {
            id: 'lap-2.ex4.s1',
            upstream: { exercise: 'Exercise 4', stepNumber: 1, sourceLine: 'less auth.log' },
            kind: 'command',
            instruction: 'Open the authentication log to review logons and privilege changes.',
            hint: 'Run `less auth.log`.',
            acceptedInputs: [{ type: 'regex', value: /^less\s+auth\.log\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 10,
            checkOnLearning: 'lap-2-col-4',
          },
          {
            id: 'lap-2.ex4.s2',
            upstream: { exercise: 'Exercise 4', stepNumber: 2, sourceLine: 'Identify different types of authentication events, such as successful logins, failed login attempts, and user changes.' },
            kind: 'analyze',
            instruction: 'What event type immediately follows the failed-password burst from 203.0.113.5?',
            hint: 'Look for the first line after the failures that shows the attacker succeeded.',
            validation: { type: 'valueExtracted', expected: ['Accepted password'] },
            points: 10,
          },
          {
            id: 'lap-2.ex4.s3',
            upstream: { exercise: 'Exercise 4', stepNumber: 3, sourceLine: 'Note the timestamps, usernames, and source IP addresses for each event.' },
            kind: 'analyze',
            instruction: 'Which external IP successfully authenticated as `temp.contractor` before the sudo commands?',
            hint: 'Submit the IP address exactly as it appears in `auth.log`.',
            validation: { type: 'valueExtracted', expected: ['203.0.113.5'] },
            points: 15,
          },
        ],
      },
      {
        id: 'ex5',
        upstreamHeading: 'Exercise 5: Summarizing Log Data',
        steps: [
          {
            id: 'lap-2.ex5.s1',
            upstream: { exercise: 'Exercise 5', stepNumber: 1, sourceLine: "awk '/sshd/ && /Failed password/ {print $11}' auth.log | sort | uniq -c | sort -nr" },
            kind: 'command',
            instruction: 'Count failed SSH password attempts by source IP.',
            hint: "Run `awk '/sshd/ && /Failed password/ {print $11}' auth.log | sort | uniq -c | sort -nr`.",
            acceptedInputs: [{ type: 'regex', value: /awk\s+['"]\/sshd\/\s*&&\s*\/Failed password\/\s*\{print \$11\}['"]\s+auth\.log\s*\|\s*sort\s*\|\s*uniq\s+-c\s*\|\s*sort\s+-nr/i }],
            validation: { type: 'commandExecuted' },
            points: 20,
            checkOnLearning: 'lap-2-col-5',
          },
          {
            id: 'lap-2.ex5.s2',
            upstream: { exercise: 'Exercise 5', stepNumber: 2, sourceLine: "awk '/sshd/ && /Accepted password/ {print $9}' auth.log | sort | uniq -c | sort -nr" },
            kind: 'command',
            instruction: 'Count successful SSH logons by username.',
            hint: "Run `awk '/sshd/ && /Accepted password/ {print $9}' auth.log | sort | uniq -c | sort -nr`.",
            acceptedInputs: [{ type: 'regex', value: /awk\s+['"]\/sshd\/\s*&&\s*\/Accepted password\/\s*\{print \$9\}['"]\s+auth\.log\s*\|\s*sort\s*\|\s*uniq\s+-c\s*\|\s*sort\s+-nr/i }],
            validation: { type: 'commandExecuted' },
            points: 15,
          },
          {
            id: 'lap-2.ex5.s3',
            upstream: { exercise: 'Exercise 5', stepNumber: 3, sourceLine: "awk '{print $6}' syslog | sort | uniq -c | sort -nr" },
            kind: 'command',
            instruction: 'Determine which process token appears most often in syslog.',
            hint: "Run `awk '{print $6}' syslog | sort | uniq -c | sort -nr`.",
            acceptedInputs: [{ type: 'regex', value: /awk\s+['"]?\{\s*print\s+\$6\s*\}['"]?\s+syslog\s*\|\s*sort\s*\|\s*uniq\s+-c\s*\|\s*sort\s+-nr/i }],
            validation: { type: 'commandExecuted' },
            points: 15,
          },
        ],
      },
    ],

    checkOnLearning: [
      {
        id: 'lap-2-col-1',
        bloom: 'recall',
        question: 'Which rsyslog destination file receives authentication events in this lab?',
        type: 'single-select',
        options: [
          { id: 'a', text: '/var/log/auth.log', correct: true },
          { id: 'b', text: '/var/log/messages', correct: false },
          { id: 'c', text: '/var/log/kern.log', correct: false },
          { id: 'd', text: '/etc/rsyslog.conf', correct: false },
        ],
        triggerOn: { stepId: 'lap-2.ex1.s1' },
        reinforces: 'lap-2.ex1.s1',
      },
      {
        id: 'lap-2-col-2',
        bloom: 'comprehension',
        question: 'A syslog line such as `Jun 12 09:09:41 app-db-02 sshd[22341]: ...` is telling you what?',
        type: 'multi-select',
        options: [
          { id: 'a', text: 'The event timestamp is Jun 12 09:09:41', correct: true },
          { id: 'b', text: 'The host that logged the event is app-db-02', correct: true },
          { id: 'c', text: 'The process emitting the event is sshd', correct: true },
          { id: 'd', text: 'The line is a kernel panic entry', correct: false },
        ],
        passThreshold: 'all-correct',
        triggerOn: { stepId: 'lap-2.ex2.s3' },
        reinforces: 'lap-2.ex2.s3',
      },
      {
        id: 'lap-2-col-3',
        bloom: 'analysis',
        question: 'Your filtered SSH view shows repeated failed passwords from 203.0.113.5 followed by a success. Which interpretation fits best?',
        type: 'multi-select',
        options: [
          { id: 'a', text: 'This is consistent with a brute-force or credential-stuffing sequence', correct: true },
          { id: 'b', text: 'The success after repeated failures should be treated as suspicious', correct: true },
          { id: 'c', text: 'Repeated failed passwords are routine cron noise', correct: false },
          { id: 'd', text: 'SSH failures never matter if the service stays up', correct: false },
        ],
        passThreshold: 'all-correct',
        triggerOn: { stepId: 'lap-2.ex3.s3' },
        reinforces: 'lap-2.ex3.s3',
      },
      {
        id: 'lap-2-col-4',
        bloom: 'application',
        question: 'The log shows `temp.contractor` authenticating from `203.0.113.5` and then running sudo. What should an analyst do next?',
        type: 'multi-select',
        options: [
          { id: 'a', text: 'Correlate the IP and account in VPN, IAM, and asset records', correct: true },
          { id: 'b', text: 'Review what commands were run under sudo after the login', correct: true },
          { id: 'c', text: 'Ignore it because the account name looks temporary', correct: false },
          { id: 'd', text: 'Contain the account only after confirming whether the access was expected', correct: true },
        ],
        passThreshold: 'all-correct',
        triggerOn: { stepId: 'lap-2.ex4.s1' },
        reinforces: 'lap-2.ex4.s1',
      },
      {
        id: 'lap-2-col-5',
        bloom: 'analysis',
        question: 'Your failed-login aggregation shows 203.0.113.5 at the top with 7 failed attempts. Why does that value matter?',
        type: 'short-answer',
        acceptedAnswer: /203\.0\.113\.5|top source|most failed/i,
        triggerOn: { stepId: 'lap-2.ex5.s1' },
        reinforces: 'lap-2.ex5.s1',
      },
    ],

    completion: {
      requireAllSteps: true,
      minQuizScore: 0.8,
    },
  };

  function buildLap4Fs() {
    return {
      'home': {
        'student': {
          'labs': {
            'security-events.log': [
              '2026-04-23T09:13:48Z WEB-01 filebeat login_failed source.ip=203.0.113.77 user.name=j.sanders',
              '2026-04-23T09:14:02Z WEB-01 filebeat login_failed source.ip=203.0.113.77 user.name=m.chen',
              '2026-04-23T09:14:11Z DC-01 winlogbeat user_login_failure source.ip=203.0.113.77 user.name=helpdesk-admin',
              '2026-04-23T09:14:26Z WKSTN-11 winlogbeat user_login_failure source.ip=203.0.113.77 user.name=temp.contractor',
              '2026-04-23T09:14:39Z APP-DB-02 filebeat sudo_command source.ip=10.10.24.44 user.name=svc_sql',
            ].join('\n') + '\n',
          },
          'Downloads': {},
        },
      },
      'etc': {
        'logstash': {
          'conf.d': {
            'logstash-simple.conf': [
              'input {',
              '  file {',
              '    path => "/home/student/labs/security-events.log"',
              '    start_position => "beginning"',
              '  }',
              '}',
              'output {',
              '  elasticsearch {',
              '    hosts => ["localhost:9200"]',
              '  }',
              '  stdout { codec => rubydebug }',
              '}',
            ].join('\n') + '\n',
          },
        },
      },
      'var': {
        'log': {
          'logstash': {
            'logstash-plain.log': [
              '[2026-04-23T09:13:58,221][INFO ][logstash.javapipeline    ][main] Pipeline started {"pipeline.id"=>"main"}',
              '[2026-04-23T09:14:03,491][INFO ][logstash.inputs.file     ][main] processing /home/student/labs/security-events.log',
              '[2026-04-23T09:14:14,905][INFO ][logstash.outputs.elasticsearch][main] Indexed event into winlogbeat-2026.04.23',
              '[2026-04-23T09:14:28,144][INFO ][logstash.outputs.elasticsearch][main] Indexed event into filebeat-2026.04.23',
            ].join('\n') + '\n',
          },
        },
        'lib': {
          'elasticsearch': {
            'cluster_health.json': [
              '{',
              '  "name": "elk-01",',
              '  "cluster_name": "boots2bytes-elk",',
              '  "cluster_uuid": "synth-elk-20260423",',
              '  "version": { "number": "7.12.1" },',
              '  "tagline": "You Know, for Search"',
              '}',
            ].join('\n') + '\n',
            '_cat_indices.txt': [
              'health status index                  uuid                   pri rep docs.count docs.deleted store.size pri.store.size',
              'green  open   filebeat-2026.04.23    synth-filebeat-0423      1   0         58            0    182kb          182kb',
              'green  open   winlogbeat-2026.04.23  synth-winlogbeat-0423    1   0         41            0    144kb          144kb',
            ].join('\n') + '\n',
          },
          'dpkg': {},
        },
      },
      'run': {
        'services': {},
      },
      'tmp': {},
    };
  }

  const LAP_4_LAB = {
    id: 'lap-4',
    track: 'log-analysis',
    title: 'Simple Log Analysis with ELK Stack',
    difficulty: 'Intermediate',
    estimatedTime: '55 min',
    tags: ['ELK', 'Kibana', 'KQL', 'Logstash', 'Elasticsearch'],

    source: {
      repo: '0xrajneesh/Log-Analysis-Projects-for-Beginners',
      file: 'Project-4-Simple-Log-Analysis-with-ELK-Stack.md',
      sha256: 'f50f03e7217c5c49b81fe4e396c79a85823409f3355ed80b110e85015ed3777c',
      snapshot: 'src/data/sources/lap-4.source.md',
    },

    environment: {
      type: 'mixed',
      shell: 'KibanaLabShell',
      fs: buildLap4Fs,
    },

    scenario: {
      role: 'SOC analyst validating a fresh ELK deployment',
      incident: 'At 09:14, multiple hosts reported a spike in failed authentication events from 203.0.113.77. You need to stand up the local ELK stack, confirm ingestion, then use Kibana to inspect and preserve the suspicious activity on a dashboard.',
    },

    exercises: [
      {
        id: 'ex1',
        upstreamHeading: 'Exercise 1: Installing Elasticsearch',
        steps: [
          {
            id: 'lap-4.ex1.s1',
            upstream: { exercise: 'Exercise 1', stepNumber: 1, sourceLine: 'wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-7.12.1-amd64.deb && sudo dpkg -i elasticsearch-7.12.1-amd64.deb' },
            kind: 'command',
            instruction: 'Download the Elasticsearch package, then install it with `dpkg`.',
            hint: 'The step is considered complete when you run the `sudo dpkg -i elasticsearch-7.12.1-amd64.deb` command.',
            acceptedInputs: [{ type: 'regex', value: /^sudo\s+dpkg\s+-i\s+elasticsearch-7\.12\.1-amd64\.deb\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 10,
          },
          {
            id: 'lap-4.ex1.s2',
            upstream: { exercise: 'Exercise 1', stepNumber: 2, sourceLine: 'sudo systemctl start elasticsearch && sudo systemctl enable elasticsearch' },
            kind: 'command',
            instruction: 'Start Elasticsearch and enable it at boot.',
            hint: 'Run at least the `systemctl start elasticsearch` command before opening the API.',
            acceptedInputs: [
              { type: 'regex', value: /^sudo\s+systemctl\s+start\s+elasticsearch\s*$/ },
              { type: 'regex', value: /^sudo\s+systemctl\s+enable\s+elasticsearch\s*$/ },
            ],
            validation: { type: 'commandExecuted' },
            points: 10,
          },
          {
            id: 'lap-4.ex1.s3',
            upstream: { exercise: 'Exercise 1', stepNumber: 3, sourceLine: 'Verify that Elasticsearch is running by accessing http://localhost:9200 in a web browser.' },
            kind: 'observe',
            instruction: 'Open the local Elasticsearch API view in the browser pane and verify that the cluster responds.',
            acceptedInputs: [{ type: 'exact', value: 'browse http://localhost:9200' }],
            validation: { type: 'commandExecuted' },
            points: 10,
            checkOnLearning: 'lap-4-col-1',
          },
        ],
      },
      {
        id: 'ex2',
        upstreamHeading: 'Exercise 2: Installing Logstash',
        steps: [
          {
            id: 'lap-4.ex2.s1',
            upstream: { exercise: 'Exercise 2', stepNumber: 1, sourceLine: 'wget https://artifacts.elastic.co/downloads/logstash/logstash-7.12.1.deb && sudo dpkg -i logstash-7.12.1.deb' },
            kind: 'command',
            instruction: 'Download and install the Logstash package.',
            hint: 'Complete the step with `sudo dpkg -i logstash-7.12.1.deb`.',
            acceptedInputs: [{ type: 'regex', value: /^sudo\s+dpkg\s+-i\s+logstash-7\.12\.1\.deb\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 10,
          },
          {
            id: 'lap-4.ex2.s2',
            upstream: { exercise: 'Exercise 2', stepNumber: 2, sourceLine: 'sudo nano /etc/logstash/conf.d/logstash-simple.conf' },
            kind: 'command',
            instruction: 'Open the Logstash configuration file and confirm it reads from the sample logfile path.',
            hint: 'Run `sudo nano /etc/logstash/conf.d/logstash-simple.conf`.',
            acceptedInputs: [{ type: 'regex', value: /^sudo\s+nano\s+\/etc\/logstash\/conf\.d\/logstash-simple\.conf\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 10,
          },
          {
            id: 'lap-4.ex2.s3',
            upstream: { exercise: 'Exercise 2', stepNumber: 3, sourceLine: 'sudo systemctl start logstash && sudo systemctl enable logstash' },
            kind: 'command',
            instruction: 'Start Logstash and enable it so the pipeline begins ingesting the sample data.',
            hint: 'Run the `start` command before moving to the ingestion check.',
            acceptedInputs: [
              { type: 'regex', value: /^sudo\s+systemctl\s+start\s+logstash\s*$/ },
              { type: 'regex', value: /^sudo\s+systemctl\s+enable\s+logstash\s*$/ },
            ],
            validation: { type: 'commandExecuted' },
            points: 10,
          },
        ],
      },
      {
        id: 'ex3',
        upstreamHeading: 'Exercise 3: Installing Kibana',
        steps: [
          {
            id: 'lap-4.ex3.s1',
            upstream: { exercise: 'Exercise 3', stepNumber: 1, sourceLine: 'wget https://artifacts.elastic.co/downloads/kibana/kibana-7.12.1-amd64.deb && sudo dpkg -i kibana-7.12.1-amd64.deb' },
            kind: 'command',
            instruction: 'Download and install the Kibana package.',
            hint: 'Complete the step with `sudo dpkg -i kibana-7.12.1-amd64.deb`.',
            acceptedInputs: [{ type: 'regex', value: /^sudo\s+dpkg\s+-i\s+kibana-7\.12\.1-amd64\.deb\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 10,
          },
          {
            id: 'lap-4.ex3.s2',
            upstream: { exercise: 'Exercise 3', stepNumber: 2, sourceLine: 'sudo systemctl start kibana && sudo systemctl enable kibana' },
            kind: 'command',
            instruction: 'Start Kibana and enable it.',
            hint: 'Run the `start` command before opening Kibana in the browser pane.',
            acceptedInputs: [
              { type: 'regex', value: /^sudo\s+systemctl\s+start\s+kibana\s*$/ },
              { type: 'regex', value: /^sudo\s+systemctl\s+enable\s+kibana\s*$/ },
            ],
            validation: { type: 'commandExecuted' },
            points: 10,
          },
          {
            id: 'lap-4.ex3.s3',
            upstream: { exercise: 'Exercise 3', stepNumber: 3, sourceLine: 'Verify that Kibana is running by accessing http://localhost:5601 in a web browser.' },
            kind: 'observe',
            instruction: 'Open Kibana in the browser pane and confirm the workspace loads.',
            acceptedInputs: [{ type: 'exact', value: 'browse http://localhost:5601' }],
            validation: { type: 'commandExecuted' },
            points: 10,
            checkOnLearning: 'lap-4-col-2',
          },
        ],
      },
      {
        id: 'ex4',
        upstreamHeading: 'Exercise 4: Ingesting Log Data with Logstash',
        steps: [
          {
            id: 'lap-4.ex4.s1',
            upstream: { exercise: 'Exercise 4', stepNumber: 1, sourceLine: 'Ensure that the log file specified in logstash-simple.conf exists and contains sample log data.' },
            kind: 'observe',
            instruction: 'Use the browser-side validation control to confirm that the configured sample log file exists.',
            acceptedInputs: [{ type: 'exact', value: 'verify sample log exists' }],
            validation: { type: 'commandExecuted' },
            points: 10,
          },
          {
            id: 'lap-4.ex4.s2',
            upstream: { exercise: 'Exercise 4', stepNumber: 2, sourceLine: 'sudo tail -f /var/log/logstash/logstash-plain.log' },
            kind: 'command',
            instruction: 'Tail the Logstash service log to confirm the pipeline is processing the sample file.',
            hint: 'Run `sudo tail -f /var/log/logstash/logstash-plain.log`.',
            acceptedInputs: [{ type: 'regex', value: /^sudo\s+tail\s+-[fF]\s+\/var\/log\/logstash\/logstash-plain\.log\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 10,
          },
          {
            id: 'lap-4.ex4.s3',
            upstream: { exercise: 'Exercise 4', stepNumber: 3, sourceLine: 'curl -X GET "localhost:9200/_cat/indices?v"' },
            kind: 'command',
            instruction: 'Query Elasticsearch for the active indices and verify the beat data is present.',
            hint: 'Run `curl -X GET "localhost:9200/_cat/indices?v"`.',
            acceptedInputs: [{ type: 'regex', value: /^curl\s+-X\s+GET\s+localhost:9200\/_cat\/indices\?v\s*$/ }],
            validation: { type: 'commandExecuted' },
            points: 10,
            checkOnLearning: 'lap-4-col-3',
          },
        ],
      },
      {
        id: 'ex5',
        upstreamHeading: 'Exercise 5: Creating Visualizations in Kibana',
        steps: [
          {
            id: 'lap-4.ex5.s1',
            upstream: { exercise: 'Exercise 5', stepNumber: 1, sourceLine: 'Open Kibana in a web browser (http://localhost:5601).' },
            kind: 'observe',
            instruction: 'Switch the browser pane to Kibana.',
            acceptedInputs: [{ type: 'exact', value: 'browse http://localhost:5601' }],
            validation: { type: 'commandExecuted' },
            points: 5,
          },
          {
            id: 'lap-4.ex5.s2',
            upstream: { exercise: 'Exercise 5', stepNumber: 2, sourceLine: 'Navigate to Management > Kibana > Index Patterns and create a new index pattern matching the Logstash index (e.g., logstash-*).' },
            kind: 'observe',
            instruction: 'Create the `logstash-*` index pattern from the Stack Management view.',
            acceptedInputs: [{ type: 'exact', value: 'kibana create index-pattern logstash-*' }],
            validation: { type: 'commandExecuted' },
            points: 10,
          },
          {
            id: 'lap-4.ex5.s3',
            upstream: { exercise: 'Exercise 5', stepNumber: 3, sourceLine: 'Explore the log data in the Discover tab to understand the available fields and data.' },
            kind: 'observe',
            instruction: 'In Discover, run the credential-stuffing KQL, drill into the 09:14 spike, and inspect the suspicious document.',
            acceptedInputs: [{ type: 'exact', value: 'kibana inspect doc 09:14 source.ip=203.0.113.77' }],
            validation: { type: 'commandExecuted' },
            points: 15,
            checkOnLearning: 'lap-4-col-4',
          },
          {
            id: 'lap-4.ex5.s4',
            upstream: { exercise: 'Exercise 5', stepNumber: 4, sourceLine: 'Navigate to Visualize > Create new visualization, choose a visualization type, and configure it using the log data fields.' },
            kind: 'observe',
            instruction: 'Create a source-IP spike visualization from the suspicious slice.',
            acceptedInputs: [{ type: 'exact', value: 'kibana visualize create source-ip-spike' }],
            validation: { type: 'commandExecuted' },
            points: 15,
          },
          {
            id: 'lap-4.ex5.s5',
            upstream: { exercise: 'Exercise 5', stepNumber: 5, sourceLine: 'Save the visualizations and add them to a new dashboard in Kibana.' },
            kind: 'observe',
            instruction: 'Save the visualization and add it to the `Credential Stuffing Overview` dashboard.',
            acceptedInputs: [{ type: 'exact', value: 'kibana dashboard save credential-stuffing-overview' }],
            validation: { type: 'commandExecuted' },
            points: 15,
            checkOnLearning: 'lap-4-col-5',
          },
        ],
      },
    ],

    checkOnLearning: [
      {
        id: 'lap-4-col-1',
        bloom: 'recall',
        question: 'Which ELK component stores and searches indexed data?',
        type: 'single-select',
        options: [
          { id: 'a', text: 'Elasticsearch', correct: true },
          { id: 'b', text: 'Logstash', correct: false },
          { id: 'c', text: 'Kibana', correct: false },
          { id: 'd', text: 'Filebeat', correct: false },
        ],
        triggerOn: { stepId: 'lap-4.ex1.s3' },
        reinforces: 'lap-4.ex1.s3',
      },
      {
        id: 'lap-4-col-2',
        bloom: 'comprehension',
        question: 'Why do analysts create an index pattern before using Discover?',
        type: 'multi-select',
        options: [
          { id: 'a', text: 'It tells Kibana which indices and fields to expose for searching', correct: true },
          { id: 'b', text: 'It automatically blocks malicious IPs at the firewall', correct: false },
          { id: 'c', text: 'It lets Kibana pick a time field for the dataset', correct: true },
          { id: 'd', text: 'It installs Elasticsearch plugins', correct: false },
        ],
        passThreshold: 'all-correct',
        triggerOn: { stepId: 'lap-4.ex3.s3' },
        reinforces: 'lap-4.ex3.s3',
      },
      {
        id: 'lap-4-col-2b',
        bloom: 'application',
        question: 'In this lab, what is Logstash doing with `security-events.log` after you confirm the pipeline config?',
        type: 'multi-select',
        options: [
          { id: 'a', text: 'Reading the sample file from `/home/student/labs/security-events.log`', correct: true },
          { id: 'b', text: 'Forwarding parsed events into Elasticsearch on localhost:9200', correct: true },
          { id: 'c', text: 'Replacing Kibana as the search interface', correct: false },
          { id: 'd', text: 'Acting as the browser used to open port 5601', correct: false },
        ],
        passThreshold: 'all-correct',
        triggerOn: { stepId: 'lap-4.ex2.s2' },
        reinforces: 'lap-4.ex2.s2',
      },
      {
        id: 'lap-4-col-3',
        bloom: 'application',
        question: 'Your `_cat/indices` output shows both `filebeat-2026.04.23` and `winlogbeat-2026.04.23`. What does that confirm?',
        type: 'multi-select',
        options: [
          { id: 'a', text: 'Logstash is successfully sending multiple event streams into Elasticsearch', correct: true },
          { id: 'b', text: 'The index pattern has already been created in Kibana', correct: false },
          { id: 'c', text: 'The environment contains both Linux/filebeat and Windows/winlogbeat telemetry', correct: true },
          { id: 'd', text: 'The data is definitely benign', correct: false },
        ],
        passThreshold: 'all-correct',
        triggerOn: { stepId: 'lap-4.ex4.s3' },
        reinforces: 'lap-4.ex4.s3',
      },
      {
        id: 'lap-4-col-4',
        bloom: 'analysis',
        question: 'The Discover histogram spikes at 09:14 and the inspected document shows repeated failures from 203.0.113.77 across multiple usernames. What does that pattern suggest?',
        type: 'multi-select',
        options: [
          { id: 'a', text: 'A credential-stuffing or password-spraying campaign is underway', correct: true },
          { id: 'b', text: 'The activity is limited to a single user typo', correct: false },
          { id: 'c', text: 'The same source IP touching several usernames raises priority', correct: true },
          { id: 'd', text: 'The histogram spike means Kibana is broken', correct: false },
        ],
        passThreshold: 'all-correct',
        triggerOn: { stepId: 'lap-4.ex5.s3' },
        reinforces: 'lap-4.ex5.s3',
      },
      {
        id: 'lap-4-col-5',
        bloom: 'analysis',
        question: 'What exact external IP drove the 09:14 spike you added to the dashboard?',
        type: 'short-answer',
        acceptedAnswer: ['203.0.113.77'],
        triggerOn: { stepId: 'lap-4.ex5.s5' },
        reinforces: 'lap-4.ex5.s5',
      },
    ],

    completion: {
      requireAllSteps: true,
      minQuizScore: 0.8,
    },
  };
  // lap-3 and lap-5 keep their gold-shell labs from data.js / lab-shells.jsx; do NOT shadow them in B2B_LABS.

  Object.assign(window.B2B_LABS = window.B2B_LABS || {}, {
    'lap-1': LAP_1_LAB,
    'lap-2': LAP_2_LAB,
    'lap-4': LAP_4_LAB,
  });

  Object.assign(window, { B2B_LAP_1: LAP_1_LAB, B2B_LAP_2: LAP_2_LAB, B2B_LAP_4: LAP_4_LAB });
})();
