// ============================================================
//  Security Assessments Track — Shells (Agent 05)
// ============================================================
//  Shells:
//    - BurpProxyLabShell  (PortSwigger Burp Suite chrome)
//    - IamMatrixLabShell  (User × Group cross-reference matrix)
//
//  Also extends window.MISSION_NEXT_BASH_ENGINE.BUILTINS with realistic
//  stub commands for tools that the upstream sa-1..sa-5 .md
//  files invoke but which are not part of the core shared bash
//  subset (nmap, netstat, ss, ip, iptables, nslookup, dig,
//  auditctl, ausearch, tripwire, aide, aideinit, chkrootkit,
//  nikto, sqlmap, wapiti, msfconsole, openvas-setup, faillog,
//  chage, last, getfacl, stat, usermod, gpasswd, groups,
//  chkpasswd, ossec-control, logwatch, logrotate, tshark).
//
//  These stubs return deterministic, realistic synthetic output
//  drawn from the lab's vfs where possible. They are gated on
//  load order (this file is JSX, loaded after vanilla shell
//  globals, before the labs render).
// ============================================================

(function () {
  // ─── BUILTINS extension ─────────────────────────────────────
  function readVfs(env, p) {
    if (!env || !env.vfs || typeof env.vfs.read !== 'function') return null;
    return env.vfs.read(p);
  }

  function ok(stdout) { return { stdout: stdout, stderr: '', exitCode: 0 }; }
  function err(stderr, code) { return { stdout: '', stderr: stderr, exitCode: code != null ? code : 1 }; }

  function pickNarrative(env, key, fallback) {
    const data = readVfs(env, '/var/lib/sa-narrative.json');
    if (!data) return fallback;
    try {
      const obj = JSON.parse(data);
      return (obj && obj[key]) || fallback;
    } catch (e) { return fallback; }
  }

  function cmd_nmap(env, args) {
    const flags = new Set(args.filter(a => a.startsWith('-')));
    const target = args.filter(a => !a.startsWith('-')).pop() || '';
    const isPing = flags.has('-sn') || flags.has('-sP');
    const isStealth = flags.has('-sS');
    if (isPing) {
      const data = readVfs(env, '/var/lib/sa/nmap-arp.txt');
      if (data) return ok(data);
      return ok([
        'Starting Nmap 7.94 ( https://nmap.org ) at 2026-04-23 09:14 EDT',
        `Nmap scan report for 10.10.24.1`,
        'Host is up (0.00091s latency).',
        `Nmap scan report for 10.10.24.10`,
        'Host is up (0.00084s latency).',
        `Nmap scan report for 10.10.24.15`,
        'Host is up (0.00076s latency).',
        `Nmap scan report for 10.10.24.42`,
        'Host is up (0.00092s latency).',
        'Nmap done: 256 IP addresses (4 hosts up) scanned in 8.43 seconds',
      ].join('\n') + '\n');
    }
    if (isStealth || target) {
      const path = `/var/lib/sa/nmap-${target.replace(/\//g, '_')}.txt`;
      const data = readVfs(env, path) || readVfs(env, '/var/lib/sa/nmap-host.txt');
      if (data) return ok(data);
      return ok([
        'Starting Nmap 7.94 ( https://nmap.org ) at 2026-04-23 09:21 EDT',
        `Nmap scan report for ${target || '10.10.24.15'}`,
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
      ].join('\n') + '\n');
    }
    return ok('Starting Nmap 7.94 ( https://nmap.org )\nNmap done: 0 IP addresses (0 hosts up) scanned in 0.05 seconds\n');
  }

  function cmd_netstat(env, args) {
    return ok([
      'Active Internet connections (only servers)',
      'Proto Recv-Q Send-Q Local Address           Foreign Address         State',
      'tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN',
      'tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN',
      'tcp        0      0 0.0.0.0:443             0.0.0.0:*               LISTEN',
      'tcp        0      0 0.0.0.0:5985            0.0.0.0:*               LISTEN',
      'tcp6       0      0 :::3389                 :::*                    LISTEN',
      'udp        0      0 0.0.0.0:68              0.0.0.0:*',
    ].join('\n') + '\n');
  }

  function cmd_ss(env, args) {
    return ok([
      'Netid State  Recv-Q Send-Q Local Address:Port   Peer Address:Port',
      'tcp   LISTEN 0      128    0.0.0.0:22           0.0.0.0:*',
      'tcp   LISTEN 0      511    0.0.0.0:80           0.0.0.0:*',
      'tcp   LISTEN 0      511    0.0.0.0:443          0.0.0.0:*',
      'tcp   LISTEN 0      128    0.0.0.0:5985         0.0.0.0:*',
      'tcp   LISTEN 0      4096   *:3389               *:*',
    ].join('\n') + '\n');
  }

  function cmd_ip(env, args) {
    if (args[0] === 'a' || args[0] === 'addr') {
      return ok([
        '1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN',
        '    inet 127.0.0.1/8 scope host lo',
        '2: ens33: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP',
        '    inet 10.10.24.42/24 brd 10.10.24.255 scope global ens33',
      ].join('\n') + '\n');
    }
    return ok('Usage: ip [ OPTIONS ] OBJECT { COMMAND | help }\n');
  }

  function cmd_iptables(env, args) {
    if (args.includes('-L') || args.includes('--list')) {
      return ok([
        'Chain INPUT (policy ACCEPT)',
        'target     prot opt source               destination',
        'ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:ssh',
        'ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:http',
        'ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:https',
        'ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:5985',
        '',
        'Chain FORWARD (policy ACCEPT)',
        'target     prot opt source               destination',
        '',
        'Chain OUTPUT (policy ACCEPT)',
        'target     prot opt source               destination',
      ].join('\n') + '\n');
    }
    return ok('iptables: usage information.\n');
  }

  function cmd_nslookup(env, args) {
    const host = args[0] || '';
    return ok([
      'Server:\t\t10.10.24.1',
      'Address:\t10.10.24.1#53',
      '',
      `Non-authoritative answer:`,
      `Name:\t${host || 'app.example.local'}`,
      `Address: 10.10.24.15`,
    ].join('\n') + '\n');
  }

  function cmd_dig(env, args) {
    const host = args.filter(a => !a.startsWith('+') && !a.startsWith('-')).pop() || 'app.example.local';
    return ok([
      `; <<>> DiG 9.18.18-1ubuntu0 <<>> ${host}`,
      ';; global options: +cmd',
      ';; Got answer:',
      ';; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 21118',
      ';; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1',
      '',
      ';; QUESTION SECTION:',
      `;${host}.\t\tIN\tA`,
      '',
      ';; ANSWER SECTION:',
      `${host}.\t300\tIN\tA\t10.10.24.15`,
      '',
      ';; Query time: 4 msec',
      ';; SERVER: 10.10.24.1#53(10.10.24.1) (UDP)',
    ].join('\n') + '\n');
  }

  function cmd_auditctl(env, args) {
    if (args[0] === '-w') {
      const path = args[1];
      const tag = args[args.indexOf('-k') + 1] || 'unknown';
      env.vfs.mkdir('/etc/audit/rules.d', true);
      const old = env.vfs.read('/etc/audit/rules.d/_b2b.rules') || '';
      env.vfs.write('/etc/audit/rules.d/_b2b.rules', old + args.join(' ') + '\n');
      return ok('');
    }
    if (args[0] === '-l') {
      const data = env.vfs.read('/etc/audit/rules.d/_b2b.rules') || '';
      return ok(data || 'No rules\n');
    }
    return ok('');
  }

  function cmd_ausearch(env, args) {
    const data = readVfs(env, '/var/lib/sa/ausearch-passwd.txt');
    if (data) return ok(data);
    return ok([
      '----',
      'time->Thu Apr 23 14:41:09 2026',
      'type=PATH msg=audit(1745423469.118:412): item=0 name="/etc/passwd" inode=786433 dev=08:01 mode=0100644 ouid=0 ogid=0 rdev=00:00',
      'type=SYSCALL msg=audit(1745423469.118:412): arch=c000003e syscall=257 success=yes exit=4 comm="vi" exe="/usr/bin/vi" key="passwd_changes"',
    ].join('\n') + '\n');
  }

  function cmd_tripwire(env, args) {
    if (args.includes('--init')) return ok('Generating database...\n### The database was successfully generated.\n');
    if (args.includes('--check')) {
      const data = readVfs(env, '/var/lib/sa/tripwire-report.txt');
      if (data) return ok(data);
      return ok('Total objects scanned:  18327\nTotal violations found:  3\n');
    }
    return ok('Tripwire(R) 2.4.3 Open Source for LINUX\n');
  }

  function cmd_aide(env, args) {
    if (args.includes('--check') || args.includes('-C')) {
      const data = readVfs(env, '/var/lib/sa/aide-check.txt');
      if (data) return ok(data);
      return ok('AIDE 0.17.4 found differences between database and filesystem!!\nStart timestamp: 2026-04-23 15:02:11\n');
    }
    return ok('Aide 0.17.4 — usage info\n');
  }

  function cmd_aideinit(env, args) {
    return ok('Running aide --init...\nAIDE initialized.\nThe database is at /var/lib/aide/aide.db.new\n');
  }

  function cmd_chkrootkit(env, args) {
    const data = readVfs(env, '/var/lib/sa/chkrootkit-report.txt');
    if (data) return ok(data);
    return ok([
      'ROOTDIR is `/\'',
      'Checking `amd\'... not found',
      'Checking `chsh\'... not infected',
      'Checking `cron\'... not infected',
      'Checking `crontab\'... not infected',
      'Checking `ifconfig\'... not infected',
      'Checking `lsof\'... not infected',
      'Checking `netstat\'... not infected',
      'Checking `passwd\'... not infected',
      'Checking `bindshell\'... not infected',
      'Checking `lkm\'... nothing detected',
    ].join('\n') + '\n');
  }

  function cmd_nikto(env, args) {
    const target = args[args.indexOf('-h') + 1] || args[args.indexOf('-host') + 1] || '';
    return ok([
      '- Nikto v2.5.0',
      '---------------------------------------------------------------------------',
      `+ Target IP:          ${target || '10.10.24.15'}`,
      `+ Target Hostname:    ${target || 'app.example.local'}`,
      '+ Target Port:        80',
      '+ Start Time:         2026-04-23 09:34:11',
      '---------------------------------------------------------------------------',
      '+ Server: Apache/2.4.58 (Ubuntu)',
      '+ /robots.txt: Entry \'/admin/\' is returned a non-forbidden or redirect HTTP code (200).',
      '+ /admin/: Admin login page found.',
      '+ Cookie PHPSESSID created without the httponly flag',
      '+ /login.php: Allowed HTTP Methods: HEAD, GET, POST, OPTIONS',
      '+ Apache mod_negotiation is enabled with MultiViews — directory contents discoverable.',
      '+ 7967 requests: 0 error(s) and 11 item(s) reported on remote host',
      '+ End Time:           2026-04-23 09:36:42 (151 seconds)',
    ].join('\n') + '\n');
  }

  function cmd_sqlmap(env, args) {
    const u = args[args.indexOf('-u') + 1] || args[args.indexOf('--url') + 1] || '';
    return ok([
      '        ___',
      '       __H__',
      ' ___ ___[\']_____ ___ ___  {1.7.11#stable}',
      '|_ -| . [\']     | .\'| . |',
      '|___|_  ["]_|_|_|__,|  _|',
      '      |_|V...       |_|',
      '',
      `[*] starting @ 09:42:18 /2026-04-23/`,
      `[09:42:18] [INFO] testing connection to the target URL`,
      `[09:42:19] [INFO] heuristic (basic) test shows that GET parameter 'id' might be injectable`,
      `[09:42:21] [INFO] GET parameter 'id' is 'MySQL >= 5.6 AND error-based — WHERE, HAVING, ORDER BY or GROUP BY clause' injectable`,
      `[09:42:24] [INFO] the back-end DBMS is MySQL`,
      `available databases [4]:`,
      `[*] information_schema`,
      `[*] mysql`,
      `[*] performance_schema`,
      `[*] webapp`,
    ].join('\n') + '\n');
  }

  function cmd_wapiti(env, args) {
    return ok([
      '[*] Wapiti 3.1.7 — Web vulnerability scanner',
      '[*] Crawling https://app.example.local/',
      '[+] Found 73 URLs',
      '[+] Launching module xss',
      '[+] Launching module sql',
      '[+] Launching module backup',
      '[+] Launching module exec',
      '',
      'Generated report:',
      '  reports/wapiti_report.html',
      '  reports/wapiti_report.txt',
    ].join('\n') + '\n');
  }

  function cmd_msfconsole(env, args) {
    return ok([
      '       =[ metasploit v6.4.5-dev                          ]',
      '+ -- --=[ 2389 exploits - 1240 auxiliary - 423 post       ]',
      '+ -- --=[ 1397 payloads - 47 encoders - 11 nops           ]',
      '',
      'msf6 >',
    ].join('\n') + '\n');
  }

  function cmd_openvas(env, args) {
    return ok([
      'GVM/OpenVAS scanner setup',
      '[*] Generating CA + certificate ...',
      '[*] Updating NVT feed ...',
      '[*] Setup complete. Web UI available at https://localhost:9392',
    ].join('\n') + '\n');
  }

  function cmd_chkpasswd(env, args) {
    return ok([
      'Username        Strength    Last Changed',
      'root            STRONG      2026-03-12',
      'svc_backup      WEAK        2024-08-04',
      'svc_sql         WEAK        2024-09-19',
      'helpdesk-admin  STRONG      2026-02-22',
      'j.sanders       MEDIUM      2025-12-09',
      'm.chen          STRONG      2026-04-08',
      'temp.contractor MEDIUM      2025-06-14',
    ].join('\n') + '\n');
  }

  function cmd_usermod(env, args) {
    return ok('');  // silent on success, mirrors real behaviour
  }
  function cmd_gpasswd(env, args) {
    if (args[0] === '-d') return ok(`Removing user ${args[1]} from group ${args[2]}\n`);
    return ok('');
  }

  function cmd_groups(env, args) {
    const user = args[0] || env.user;
    const map = {
      'temp.contractor': 'temp.contractor : temp.contractor wheel',
      'j.sanders':       'j.sanders : j.sanders staff',
      'm.chen':          'm.chen : m.chen staff developers',
      'svc_backup':      'svc_backup : svc_backup',
      'svc_sql':         'svc_sql : svc_sql dba',
      'helpdesk-admin':  'helpdesk-admin : helpdesk-admin sudo',
    };
    return ok((map[user] || `${user} : ${user}`) + '\n');
  }

  function cmd_faillog(env, args) {
    const data = readVfs(env, '/var/log/faillog.txt');
    if (data) return ok(data);
    return ok([
      'Login       Failures Maximum Latest                   On',
      'root            0      0   never',
      'temp.contractor 7      5   Wed Apr 22 17:03:11 -0400 2026 ssh:notty 198.51.100.42',
      'svc_backup      3      0   Tue Apr 21 02:17:02 -0400 2026 cron',
      'j.sanders       0      0   never',
    ].join('\n') + '\n');
  }

  function cmd_chage(env, args) {
    if (args[0] === '-l') {
      const user = args[1] || env.user;
      return ok([
        `Last password change                                    : Jun 14, 2025`,
        `Password expires                                        : never`,
        `Password inactive                                       : never`,
        `Account expires                                         : never`,
        `Minimum number of days between password change          : 0`,
        `Maximum number of days between password change          : 99999`,
        `Number of days of warning before password expires       : 7`,
      ].join('\n') + '\n');
    }
    return ok('');
  }

  function cmd_last(env, args) {
    const data = readVfs(env, '/var/log/wtmp.txt');
    if (data) return ok(data);
    return ok([
      'temp.contractor pts/3        198.51.100.42    Wed Apr 22 17:09 - 18:42  (01:33)',
      'helpdesk-admin  pts/0        10.10.24.7       Wed Apr 22 09:01 - 17:04  (08:03)',
      'm.chen          pts/2        10.10.24.18      Wed Apr 22 08:52 - 17:18  (08:26)',
      'svc_backup      cron         (none)           Tue Apr 21 02:00 - 02:01  (00:01)',
      'wtmp begins Mon Apr 20 06:00:01 2026',
    ].join('\n') + '\n');
  }

  function cmd_getfacl(env, args) {
    const target = args.filter(a => !a.startsWith('-')).pop() || '';
    if (target.includes('finance')) {
      return ok([
        '# file: srv/share/finance',
        '# owner: root',
        '# group: finance',
        '# flags: -s-',
        'user::rwx',
        'group::rwx',
        'other::rwx',
      ].join('\n') + '\n');
    }
    return ok([`# file: ${target}`, '# owner: root', '# group: root', 'user::rwx', 'group::r-x', 'other::r-x'].join('\n') + '\n');
  }

  function cmd_stat(env, args) {
    const target = args.filter(a => !a.startsWith('-')).pop() || '';
    const data = env.vfs.stat(target);
    if (!data) return err(`stat: cannot stat '${target}': No such file or directory\n`);
    const isFinance = target.includes('finance');
    const mode = isFinance ? '0777' : (data.mode || '0644');
    return ok([
      `  File: ${target}`,
      `  Size: ${data.size}\tBlocks: 8\t  IO Block: 4096   ${data.type === 'dir' ? 'directory' : 'regular file'}`,
      `Device: 8,1\tInode: 786442\tLinks: 1`,
      `Access: (${mode}/${data.type === 'dir' ? 'drwxrwxrwx' : '-rwxrwxrwx'})  Uid: ( 0/    root)   Gid: ( ${isFinance ? '1003/finance' : '0/    root'})`,
      `Modify: 2026-04-22 09:14:17.118 -0400`,
    ].join('\n') + '\n');
  }

  function cmd_logwatch(env, args) {
    return ok([
      ' ################### Logwatch 7.5.6 (01/22/22) ####################',
      '       Processing Initiated: Thu Apr 23 06:25:01 2026',
      '       Date Range Processed: today',
      '       Detail Level of Output: 10',
      '################ Logwatch End #########################',
    ].join('\n') + '\n');
  }
  function cmd_logrotate(env, args) {
    if (args.includes('-d')) return ok('reading config file /etc/logrotate.d/custom_logs\n  rotating pattern: /var/log/custom_log\n  daily (7 rotations)\n');
    return ok('');
  }

  function cmd_tshark(env, args) {
    const data = readVfs(env, '/var/lib/sa/tshark.txt');
    if (data) return ok(data);
    return ok([
      'Capturing on \'ens33\'',
      '  1   0.000000  10.10.24.42 → 10.10.24.15  TCP 74 51224 → 80 [SYN] Seq=0',
      '  2   0.000041  10.10.24.15 → 10.10.24.42  TCP 74 80 → 51224 [SYN, ACK] Seq=0 Ack=1',
      '  3   0.000088  10.10.24.42 → 10.10.24.15  HTTP 391 GET / HTTP/1.1',
      '  4   0.001112  10.10.24.15 → 10.10.24.42  HTTP 718 HTTP/1.1 200 OK',
    ].join('\n') + '\n');
  }

  function cmd_ossec(env, args) {
    return ok('Starting OSSEC HIDS v3.7.0...\nStarted ossec-monitord (pid: 21134).\nCompleted.\n');
  }

  function patchBuiltins() {
    if (!window.MISSION_NEXT_BASH_ENGINE || !window.MISSION_NEXT_BASH_ENGINE.BUILTINS) {
      // Defer if bash engine isn't loaded yet (shouldn't happen in normal load order)
      window.setTimeout(patchBuiltins, 50);
      return;
    }
    Object.assign(window.MISSION_NEXT_BASH_ENGINE.BUILTINS, {
      nmap: cmd_nmap,
      netstat: cmd_netstat,
      ss: cmd_ss,
      ip: cmd_ip,
      iptables: cmd_iptables,
      nslookup: cmd_nslookup,
      dig: cmd_dig,
      auditctl: cmd_auditctl,
      ausearch: cmd_ausearch,
      tripwire: cmd_tripwire,
      aide: cmd_aide,
      aideinit: cmd_aideinit,
      chkrootkit: cmd_chkrootkit,
      nikto: cmd_nikto,
      sqlmap: cmd_sqlmap,
      wapiti: cmd_wapiti,
      msfconsole: cmd_msfconsole,
      'openvas-setup': cmd_openvas,
      chkpasswd: cmd_chkpasswd,
      usermod: cmd_usermod,
      gpasswd: cmd_gpasswd,
      groups: cmd_groups,
      faillog: cmd_faillog,
      chage: cmd_chage,
      last: cmd_last,
      getfacl: cmd_getfacl,
      stat: cmd_stat,
      logwatch: cmd_logwatch,
      logrotate: cmd_logrotate,
      tshark: cmd_tshark,
      'ossec-control': cmd_ossec,
    });
  }
  patchBuiltins();

  // ─── Burp Suite chrome ──────────────────────────────────────
  const BURP_TABS = ['Dashboard', 'Target', 'Proxy', 'Intruder', 'Repeater', 'Sequencer', 'Decoder', 'Comparer', 'Logger', 'Extender'];

  function BurpProxyLabShell(props) {
    const { lab, vfs, onCommand, onAction, activeStep } = props;
    const [tab, setTab] = React.useState('Proxy');
    const [proxyOn, setProxyOn] = React.useState(false);
    const [interceptOn, setInterceptOn] = React.useState(false);
    const [selected, setSelected] = React.useState(null);
    const [repeaterRow, setRepeaterRow] = React.useState(null);
    const [contextMenu, setContextMenu] = React.useState(null);
    const [reqEdit, setReqEdit] = React.useState('');
    const [responseText, setResponseText] = React.useState('');

    const rows = React.useMemo(() => {
      if (!vfs) return [];
      const data = vfs.read('/var/lib/burp/http-history.json');
      if (!data) return [];
      try { return JSON.parse(data); } catch (e) { return []; }
    }, [vfs]);

    function emit(action, payload) {
      if (typeof onAction === 'function') onAction(action, payload || {});
    }

    function doConfigureProxy() {
      setProxyOn(true);
      emit('burp.configure-proxy', { uiPath: ['burp', 'proxy', 'listener:8080'] });
    }
    function doToggleIntercept() {
      const next = !interceptOn;
      setInterceptOn(next);
      emit(next ? 'burp.intercept-on' : 'burp.intercept-off', { uiPath: ['burp', 'proxy', 'intercept'] });
    }

    function selectRow(row) {
      setSelected(row);
      setReqEdit(row.request || '');
      setResponseText(row.response || '');
      emit('burp.row-selected:' + row.id, {
        observed: { 'burp.lastSelectedId': row.id, 'burp.lastSelectedUrl': row.url },
        uiPath: ['burp', 'proxy', 'history', 'select:' + row.id],
      });
    }

    function sendToRepeater(row) {
      setTab('Repeater');
      setRepeaterRow(row);
      setReqEdit(row.request || '');
      setResponseText(row.response || '');
      setContextMenu(null);
      emit('burp.send-to-repeater:' + row.id, { uiPath: ['burp', 'send-to-repeater', row.id] });
    }
    function sendToIntruder(row) {
      setTab('Intruder');
      setContextMenu(null);
      emit('burp.send-to-intruder:' + row.id, { uiPath: ['burp', 'send-to-intruder', row.id] });
    }

    function repeaterSend() {
      // Detect "price=1" rewrites for the IDOR scenario.
      let resp = repeaterRow && repeaterRow.response || '';
      if (/price\s*=\s*1\b/i.test(reqEdit)) {
        resp = repeaterRow.responseManipulated || resp;
        emit('burp.repeater-idor-success', { observed: { 'burp.priceManipulated': true } });
      } else {
        emit('burp.repeater-send', { uiPath: ['burp', 'repeater', 'send'] });
      }
      setResponseText(resp);
    }

    return (
      <div style={burpStyles.root} onClick={() => setContextMenu(null)}>
        <div style={burpStyles.titleBar}>
          <span style={burpStyles.swirl}>⛧</span>
          <span style={burpStyles.titleTxt}>Burp Suite Professional v2024.4 — Project: SOC-rotation-2026.04.23</span>
          <span style={burpStyles.titleSpacer} />
          <span style={burpStyles.miniDot} />
          <span style={burpStyles.miniDot} />
          <span style={burpStyles.miniDot} />
        </div>

        <div style={burpStyles.tabBar}>
          {BURP_TABS.map(name => (
            <button key={name} onClick={() => setTab(name)} style={tab === name ? burpStyles.tabActive : burpStyles.tab}>
              {name}
            </button>
          ))}
        </div>

        {tab === 'Proxy' && (
          <div style={burpStyles.proxyWrap}>
            <div style={burpStyles.subTabBar}>
              <span style={burpStyles.subTabActive}>HTTP history</span>
              <span style={burpStyles.subTab}>WebSockets history</span>
              <span style={burpStyles.subTab}>Proxy settings</span>
            </div>
            <div style={burpStyles.proxyToolbar}>
              <button onClick={doConfigureProxy} style={proxyOn ? burpStyles.btnGreen : burpStyles.btn}>
                {proxyOn ? '✓ Listener 127.0.0.1:8080' : 'Open browser'}
              </button>
              <button onClick={doToggleIntercept} style={interceptOn ? burpStyles.btnOrange : burpStyles.btn}>
                {interceptOn ? 'Intercept is ON' : 'Intercept is off'}
              </button>
              <span style={burpStyles.toolbarMute}>{rows.length} entries</span>
            </div>

            <div style={burpStyles.tableWrap}>
              <table style={burpStyles.table}>
                <thead>
                  <tr>
                    {['#','Method','URL','Params','Edited','Status','Length','MIME','Title','TLS','IP'].map(h => (
                      <th key={h} style={burpStyles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.id}
                        onClick={() => selectRow(r)}
                        onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, row: r }); }}
                        style={selected && selected.id === r.id ? burpStyles.trSel : burpStyles.tr}>
                      <td style={burpStyles.td}>{i + 1}</td>
                      <td style={burpStyles.td}>{r.method}</td>
                      <td style={burpStyles.tdUrl}>{r.url}</td>
                      <td style={burpStyles.td}>{r.hasParams ? '✓' : ''}</td>
                      <td style={burpStyles.td}>{r.edited ? '✓' : ''}</td>
                      <td style={{ ...burpStyles.td, color: r.status >= 400 ? '#f87171' : r.status >= 300 ? '#f59e0b' : '#22c55e' }}>{r.status}</td>
                      <td style={burpStyles.td}>{r.length}</td>
                      <td style={burpStyles.td}>{r.mime || 'HTML'}</td>
                      <td style={burpStyles.tdUrl}>{r.title || ''}</td>
                      <td style={burpStyles.td}>{r.tls ? '✓' : ''}</td>
                      <td style={burpStyles.td}>{r.ip || '10.10.24.15'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selected && (
              <div style={burpStyles.detailWrap}>
                <div style={burpStyles.detailPane}>
                  <div style={burpStyles.detailHead}>Request — Pretty | Raw | Hex</div>
                  <pre style={burpStyles.pre}>{selected.request}</pre>
                </div>
                <div style={burpStyles.detailPane}>
                  <div style={burpStyles.detailHead}>Response — Pretty | Raw | Hex | Render</div>
                  <pre style={burpStyles.pre}>{selected.response}</pre>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'Repeater' && (
          <div style={burpStyles.proxyWrap}>
            <div style={burpStyles.proxyToolbar}>
              <button onClick={repeaterSend} style={burpStyles.btnGreen}>Send</button>
              <span style={burpStyles.toolbarMute}>
                {repeaterRow ? `Target: ${repeaterRow.method} ${repeaterRow.url}` : 'No request loaded — Send-to-Repeater from the Proxy tab.'}
              </span>
            </div>
            <div style={burpStyles.repeaterPanes}>
              <div style={burpStyles.detailPane}>
                <div style={burpStyles.detailHead}>Request</div>
                <textarea value={reqEdit} onChange={(e) => setReqEdit(e.target.value)} style={burpStyles.textarea} spellCheck={false} />
              </div>
              <div style={burpStyles.detailPane}>
                <div style={burpStyles.detailHead}>Response</div>
                <pre style={burpStyles.pre}>{responseText}</pre>
              </div>
            </div>
          </div>
        )}

        {tab !== 'Proxy' && tab !== 'Repeater' && (
          <div style={burpStyles.placeholder}>
            <div style={burpStyles.placeholderH1}>{tab}</div>
            <div style={burpStyles.placeholderBody}>
              For this lab, work in the Proxy and Repeater tabs.
            </div>
          </div>
        )}

        {contextMenu && (
          <div style={{ ...burpStyles.contextMenu, left: contextMenu.x, top: contextMenu.y }}>
            <div style={burpStyles.contextItem} onClick={() => sendToRepeater(contextMenu.row)}>Send to Repeater</div>
            <div style={burpStyles.contextItem} onClick={() => sendToIntruder(contextMenu.row)}>Send to Intruder</div>
            <div style={burpStyles.contextItemMute}>Send to Sequencer</div>
            <div style={burpStyles.contextItemMute}>Add to scope</div>
            <div style={burpStyles.contextItemMute}>Copy URL</div>
          </div>
        )}
      </div>
    );
  }

  const burpStyles = {
    root: { width: '100%', height: '100%', minHeight: 540, background: '#262626', color: '#dcdcdc', fontFamily: 'Inter, sans-serif', fontSize: 12, display: 'flex', flexDirection: 'column', borderRadius: 4, overflow: 'hidden', position: 'relative' },
    titleBar: { background: '#1f1f1f', color: '#dcdcdc', padding: '6px 10px', borderBottom: '1px solid #ff6633', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 },
    swirl: { color: '#ff6633', fontWeight: 700, fontSize: 14 },
    titleTxt: { flex: 1, color: '#cbd5e1' },
    titleSpacer: { flex: 1 },
    miniDot: { width: 10, height: 10, borderRadius: 5, background: '#3a3a3a' },
    tabBar: { background: '#3a3a3a', display: 'flex', borderBottom: '1px solid #1f1f1f' },
    tab: { background: 'transparent', border: 'none', color: '#cbd5e1', padding: '8px 14px', fontFamily: 'Inter, sans-serif', fontSize: 11, cursor: 'pointer', borderRight: '1px solid #1f1f1f' },
    tabActive: { background: '#262626', border: 'none', color: '#ff6633', padding: '8px 14px', fontFamily: 'Inter, sans-serif', fontSize: 11, cursor: 'pointer', borderRight: '1px solid #1f1f1f', fontWeight: 600 },
    proxyWrap: { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 },
    subTabBar: { display: 'flex', background: '#262626', borderBottom: '1px solid #1f1f1f' },
    subTab: { padding: '6px 12px', fontSize: 11, color: '#94a3b8' },
    subTabActive: { padding: '6px 12px', fontSize: 11, color: '#ff6633', borderBottom: '2px solid #ff6633' },
    proxyToolbar: { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', background: '#2e2e2e', borderBottom: '1px solid #1f1f1f' },
    btn: { background: '#3a3a3a', border: '1px solid #555', color: '#cbd5e1', fontSize: 11, padding: '4px 10px', cursor: 'pointer', borderRadius: 2 },
    btnGreen: { background: '#22c55e', border: '1px solid #16a34a', color: '#0b0f14', fontSize: 11, padding: '4px 10px', cursor: 'pointer', borderRadius: 2, fontWeight: 600 },
    btnOrange: { background: '#ff6633', border: '1px solid #c44a1f', color: '#0b0f14', fontSize: 11, padding: '4px 10px', cursor: 'pointer', borderRadius: 2, fontWeight: 600 },
    toolbarMute: { color: '#94a3b8', fontSize: 10 },
    tableWrap: { overflow: 'auto', maxHeight: 280, borderBottom: '1px solid #1f1f1f' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'Space Mono, monospace' },
    th: { background: '#3a3a3a', color: '#cbd5e1', padding: '4px 8px', textAlign: 'left', borderBottom: '1px solid #1f1f1f', position: 'sticky', top: 0 },
    tr: { cursor: 'pointer' },
    trSel: { cursor: 'pointer', background: 'rgba(255,102,51,0.15)' },
    td: { padding: '3px 8px', borderBottom: '1px solid #1f1f1f', whiteSpace: 'nowrap' },
    tdUrl: { padding: '3px 8px', borderBottom: '1px solid #1f1f1f', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' },
    detailWrap: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: 6, background: '#262626', flex: 1, minHeight: 0 },
    repeaterPanes: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: 6, background: '#262626', flex: 1, minHeight: 0 },
    detailPane: { display: 'flex', flexDirection: 'column', background: '#1f1f1f', border: '1px solid #3a3a3a', borderRadius: 2, overflow: 'hidden', minHeight: 0 },
    detailHead: { background: '#3a3a3a', color: '#cbd5e1', padding: '4px 8px', fontSize: 10, letterSpacing: 1 },
    pre: { padding: 8, fontSize: 11, fontFamily: 'Space Mono, monospace', whiteSpace: 'pre-wrap', overflow: 'auto', flex: 1, color: '#dcdcdc', margin: 0 },
    textarea: { padding: 8, fontSize: 11, fontFamily: 'Space Mono, monospace', background: '#1f1f1f', color: '#dcdcdc', border: 'none', outline: 'none', flex: 1, resize: 'none', minHeight: 200 },
    contextMenu: { position: 'fixed', background: '#3a3a3a', border: '1px solid #555', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 100, minWidth: 200 },
    contextItem: { padding: '6px 12px', cursor: 'pointer', fontSize: 11, color: '#dcdcdc', borderBottom: '1px solid #2e2e2e' },
    contextItemMute: { padding: '6px 12px', cursor: 'default', fontSize: 11, color: '#64748b', borderBottom: '1px solid #2e2e2e' },
    placeholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#64748b' },
    placeholderH1: { fontSize: 18, color: '#94a3b8', marginBottom: 6 },
    placeholderBody: { fontSize: 11 },
  };

  // ─── IAM Matrix ─────────────────────────────────────────────
  function IamMatrixLabShell(props) {
    const { vfs, onAction } = props;
    const [showAdmins, setShowAdmins] = React.useState(false);
    const [showInactive, setShowInactive] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState(null);
    const [exported, setExported] = React.useState(false);

    const data = React.useMemo(() => {
      if (!vfs) return { users: [], groups: [], matrix: {} };
      const raw = vfs.read('/var/lib/iam/matrix.json');
      if (!raw) return { users: [], groups: [], matrix: {} };
      try { return JSON.parse(raw); } catch (e) { return { users: [], groups: [], matrix: {} }; }
    }, [vfs]);

    const ADMIN_GROUPS = new Set(['wheel', 'sudo', 'Domain Admins', 'Enterprise Admins']);

    function lastSeenDays(ts) {
      if (!ts) return 9999;
      const ms = Date.now() - new Date(ts).getTime();
      return Math.round(ms / 86400000);
    }

    let visibleUsers = data.users || [];
    if (showAdmins) {
      visibleUsers = visibleUsers.filter(u => (u.groups || []).some(g => ADMIN_GROUPS.has(g)));
    }
    if (showInactive) {
      visibleUsers = visibleUsers.filter(u => lastSeenDays(u.lastSeen) > 90);
    }

    function emit(action, payload) {
      if (typeof onAction === 'function') onAction(action, payload || {});
    }

    function pickUser(u) {
      setSelectedUser(u);
      emit('iam.user-selected:' + u.username, {
        observed: { 'iam.lastUser': u.username, 'iam.lastUserAdmin': (u.groups || []).some(g => ADMIN_GROUPS.has(g)) },
        uiPath: ['iam', 'user', u.username],
      });
    }

    function doExportCsv() {
      setExported(true);
      emit('iam.export-csv', {
        savedFiles: { 'iam_matrix.csv': true },
        observed: { 'iam.exported': true },
        uiPath: ['iam', 'export', 'csv'],
      });
    }

    return (
      <div style={iamStyles.root}>
        <div style={iamStyles.title}>Identity & Access — Matrix Review · corp.example.local</div>
        <div style={iamStyles.toolbar}>
          <label style={iamStyles.checkLabel}>
            <input type="checkbox" checked={showAdmins} onChange={(e) => { setShowAdmins(e.target.checked); emit('iam.filter-admins', { uiPath: ['iam', 'filter', 'admins'] }); }} />
            Show admin members
          </label>
          <label style={iamStyles.checkLabel}>
            <input type="checkbox" checked={showInactive} onChange={(e) => { setShowInactive(e.target.checked); emit('iam.filter-inactive', { uiPath: ['iam', 'filter', 'inactive-90d'] }); }} />
            Inactive &gt; 90 days
          </label>
          <span style={iamStyles.toolbarSpacer} />
          <button onClick={doExportCsv} style={exported ? iamStyles.btnDone : iamStyles.btn}>
            {exported ? '✓ Exported iam_matrix.csv' : 'Export CSV'}
          </button>
        </div>

        <div style={iamStyles.body}>
          <div style={iamStyles.left}>
            <div style={iamStyles.subhead}>Users ({visibleUsers.length})</div>
            <div style={iamStyles.userList}>
              {visibleUsers.map(u => {
                const days = lastSeenDays(u.lastSeen);
                const isInactive = days > 90;
                const isAdmin = (u.groups || []).some(g => ADMIN_GROUPS.has(g));
                return (
                  <div key={u.username}
                       onClick={() => pickUser(u)}
                       style={selectedUser && selectedUser.username === u.username ? iamStyles.userRowSel : iamStyles.userRow}>
                    <div style={iamStyles.userName}>{u.username} {isAdmin && <span style={iamStyles.adminBadge}>ADMIN</span>}</div>
                    <div style={iamStyles.userMeta}>
                      Last seen: <span style={{ color: isInactive ? '#f87171' : '#94a3b8' }}>{u.lastSeen || 'never'} ({days}d)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={iamStyles.right}>
            <div style={iamStyles.subhead}>{selectedUser ? `${selectedUser.username} — Groups & Roles` : 'Groups & Roles'}</div>
            {selectedUser ? (
              <div>
                <table style={iamStyles.matrixTable}>
                  <thead>
                    <tr>
                      <th style={iamStyles.matrixTh}>Group</th>
                      <th style={iamStyles.matrixTh}>Member?</th>
                      <th style={iamStyles.matrixTh}>Last activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.groups || []).map(g => {
                      const isMember = (selectedUser.groups || []).includes(g);
                      const isAdminGroup = ADMIN_GROUPS.has(g);
                      return (
                        <tr key={g} style={isMember && isAdminGroup ? iamStyles.matrixRowAlert : iamStyles.matrixRow}>
                          <td style={iamStyles.matrixTd}>{g}{isAdminGroup ? ' ⚠' : ''}</td>
                          <td style={iamStyles.matrixTd}>{isMember ? '✓' : ''}</td>
                          <td style={iamStyles.matrixTd}>{isMember ? (selectedUser.lastSeen || 'never') : ''}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={iamStyles.userExtra}>
                  <div><b>Comment:</b> {selectedUser.comment || '—'}</div>
                  <div><b>Sudoers entry:</b> {selectedUser.sudoers || 'none'}</div>
                  <div><b>Account expires:</b> {selectedUser.expires || 'never'}</div>
                </div>
              </div>
            ) : (
              <div style={iamStyles.empty}>Select a user to see their group membership matrix.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const iamStyles = {
    root: { width: '100%', height: '100%', minHeight: 540, background: '#0d1117', color: '#cbd5e1', fontFamily: 'Inter, sans-serif', fontSize: 12, display: 'flex', flexDirection: 'column', borderRadius: 4, overflow: 'hidden' },
    title: { background: '#161b22', color: '#cbd5e1', padding: '8px 12px', borderBottom: '1px solid #30363d', fontSize: 12, fontWeight: 600 },
    toolbar: { display: 'flex', alignItems: 'center', gap: 14, padding: '6px 12px', background: '#0d1117', borderBottom: '1px solid #30363d' },
    checkLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer' },
    toolbarSpacer: { flex: 1 },
    btn: { background: '#21262d', border: '1px solid #30363d', color: '#cbd5e1', fontSize: 11, padding: '4px 10px', cursor: 'pointer', borderRadius: 3 },
    btnDone: { background: '#22c55e', border: '1px solid #16a34a', color: '#0b0f14', fontSize: 11, padding: '4px 10px', cursor: 'pointer', borderRadius: 3, fontWeight: 600 },
    body: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: 0, flex: 1, minHeight: 0 },
    left: { borderRight: '1px solid #30363d', display: 'flex', flexDirection: 'column', minHeight: 0 },
    right: { display: 'flex', flexDirection: 'column', minHeight: 0, padding: 10, overflow: 'auto' },
    subhead: { fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 2, color: '#6e7681', padding: '8px 12px', borderBottom: '1px solid #30363d' },
    userList: { overflow: 'auto', flex: 1 },
    userRow: { padding: '8px 12px', borderBottom: '1px solid #21262d', cursor: 'pointer' },
    userRowSel: { padding: '8px 12px', borderBottom: '1px solid #21262d', background: 'rgba(56,189,248,0.08)', cursor: 'pointer' },
    userName: { fontSize: 12, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6 },
    adminBadge: { fontSize: 8, padding: '2px 5px', background: '#7f1d1d', color: '#fecaca', letterSpacing: 1, borderRadius: 2 },
    userMeta: { fontSize: 10, color: '#94a3b8', marginTop: 2, fontFamily: 'Space Mono, monospace' },
    matrixTable: { width: '100%', borderCollapse: 'collapse', fontSize: 11 },
    matrixTh: { background: '#161b22', color: '#94a3b8', padding: '6px 8px', textAlign: 'left', fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1 },
    matrixRow: { borderBottom: '1px solid #21262d' },
    matrixRowAlert: { borderBottom: '1px solid #21262d', background: 'rgba(248,113,113,0.08)' },
    matrixTd: { padding: '5px 8px' },
    userExtra: { marginTop: 14, padding: 10, background: '#161b22', border: '1px solid #30363d', borderRadius: 3, fontSize: 11, lineHeight: 1.6 },
    empty: { padding: 24, color: '#6e7681', fontSize: 11 },
  };

  Object.assign(window, { BurpProxyLabShell, IamMatrixLabShell });
})();
