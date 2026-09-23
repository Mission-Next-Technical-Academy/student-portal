// Log Explorer — dataset for Module 3 (Assisted SIEM triage & log correlation).
//
// Log rows and task list ported from the Boots2Bytes SOC Analyst Track's
// "mod-3" HTTP Log Analysis dataset (`src/data.js`), copied as part of the
// Epic B/C migration (docs/LAB_MIGRATION_MATRIX.md). Values are unchanged
// from the source; only the module id/title were kept generic. The task
// list's `validation` objects are visible client-side, same as in the
// source app — this is a known, carried-over limitation, not fixed here
// (see the matrix row's "REQUIRED ADAPTATION" and RISKS columns).

const M03_LOG_DATASET = {
  id: 'm03-http-log-analysis',
  title: 'HTTP Access Log Analysis',
  subtitle: 'Web Attack Detection',
  description: 'Analyze web server access logs to detect SQL injection attempts, directory traversal, web shells, and automated scanning tools like sqlmap and Nikto.',
  fields: ['id', 'ts', 'src_ip', 'method', 'uri', 'status', 'bytes', 'user_agent'],
  logs: [
    { id: 1, ts: '2024-01-17 10:00:01', src_ip: '192.168.2.10', method: 'GET', uri: '/index.html', status: 200, bytes: 1024, user_agent: 'Mozilla/5.0' },
    { id: 2, ts: '2024-01-17 10:00:03', src_ip: '192.168.2.10', method: 'GET', uri: '/about.html', status: 200, bytes: 512, user_agent: 'Mozilla/5.0' },
    { id: 3, ts: '2024-01-17 10:01:00', src_ip: '45.33.32.156', method: 'GET', uri: '/admin/login.php', status: 200, bytes: 4096, user_agent: 'sqlmap/1.7' },
    { id: 4, ts: '2024-01-17 10:01:01', src_ip: '45.33.32.156', method: 'POST', uri: '/admin/login.php', status: 200, bytes: 256, user_agent: 'sqlmap/1.7' },
    { id: 5, ts: '2024-01-17 10:01:02', src_ip: '45.33.32.156', method: 'GET', uri: "/admin/login.php?id=1'", status: 500, bytes: 128, user_agent: 'sqlmap/1.7' },
    { id: 6, ts: '2024-01-17 10:01:03', src_ip: '45.33.32.156', method: 'GET', uri: '/admin/login.php?id=1 OR 1=1', status: 200, bytes: 8192, user_agent: 'sqlmap/1.7' },
    { id: 7, ts: '2024-01-17 10:01:04', src_ip: '45.33.32.156', method: 'GET', uri: '/admin/users.php', status: 200, bytes: 16384, user_agent: 'sqlmap/1.7' },
    { id: 8, ts: '2024-01-17 10:02:00', src_ip: '192.168.2.22', method: 'GET', uri: '/products.html', status: 200, bytes: 2048, user_agent: 'Mozilla/5.0' },
    { id: 9, ts: '2024-01-17 10:02:30', src_ip: '45.33.32.156', method: 'GET', uri: '/admin/config.php', status: 403, bytes: 64, user_agent: 'sqlmap/1.7' },
    { id: 10, ts: '2024-01-17 10:03:00', src_ip: '45.33.32.156', method: 'GET', uri: '/etc/passwd', status: 404, bytes: 64, user_agent: 'Nikto/2.1.6' },
    { id: 11, ts: '2024-01-17 10:03:01', src_ip: '45.33.32.156', method: 'GET', uri: '/../../../etc/shadow', status: 404, bytes: 64, user_agent: 'Nikto/2.1.6' },
    { id: 12, ts: '2024-01-17 10:03:02', src_ip: '45.33.32.156', method: 'GET', uri: '/phpmyadmin/', status: 404, bytes: 64, user_agent: 'Nikto/2.1.6' },
    { id: 13, ts: '2024-01-17 10:04:00', src_ip: '192.168.2.5', method: 'GET', uri: '/contact.html', status: 200, bytes: 768, user_agent: 'Mozilla/5.0' },
    { id: 14, ts: '2024-01-17 10:05:00', src_ip: '45.33.32.156', method: 'POST', uri: '/admin/upload.php', status: 200, bytes: 512, user_agent: 'curl/7.81.0' },
    { id: 15, ts: '2024-01-17 10:05:01', src_ip: '45.33.32.156', method: 'GET', uri: '/uploads/shell.php', status: 200, bytes: 4096, user_agent: 'curl/7.81.0' },
    { id: 16, ts: '2024-01-17 10:06:00', src_ip: '192.168.2.10', method: 'GET', uri: '/services.html', status: 200, bytes: 1536, user_agent: 'Mozilla/5.0' },
    { id: 17, ts: '2024-01-17 10:07:00', src_ip: '10.0.0.5', method: 'GET', uri: '/api/v1/users', status: 401, bytes: 128, user_agent: 'python-requests/2.28' },
    { id: 18, ts: '2024-01-17 10:07:01', src_ip: '10.0.0.5', method: 'GET', uri: '/api/v1/users', status: 401, bytes: 128, user_agent: 'python-requests/2.28' },
    { id: 19, ts: '2024-01-17 10:08:00', src_ip: '192.168.2.30', method: 'GET', uri: '/blog/', status: 200, bytes: 3072, user_agent: 'Mozilla/5.0' },
    { id: 20, ts: '2024-01-17 10:09:00', src_ip: '45.33.32.156', method: 'GET', uri: '/wp-login.php', status: 404, bytes: 64, user_agent: 'Nikto/2.1.6' },
  ],
  tasks: [
    { id: 't1', title: 'Identify automated scanners', points: 10, description: 'Attackers often use automated tools. Find all requests where the user_agent contains "sqlmap" or "Nikto".', hint: 'Try: search sqlmap OR Nikto', validation: { type: 'count', expected: 10 } },
    { id: 't2', title: 'Find HTTP 500 error responses', points: 20, description: 'Server errors (500) during scanning may indicate successful injection probing. Isolate all 500 responses.', hint: 'Try: search status=500', validation: { type: 'count', field: 'status', value: 500, expected: 1 } },
    { id: 't3', title: 'Detect web shell access', points: 30, description: 'A web shell was uploaded. Find the request to the uploaded shell at /uploads/shell.php, which indicates the attacker achieved code execution. Submit the number of matching requests.', hint: 'Try: search uri=/uploads/shell.php', validation: { type: 'count', field: 'uri', value: '/uploads/shell.php', expected: 1 } },
  ],
};

Object.assign(window, { M03_LOG_DATASET });
