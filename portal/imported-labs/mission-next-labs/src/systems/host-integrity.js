// Stateful file-server simulation for sa-9 (File Server Integrity Triage): L3a "Least-Privilege Share Review" and
// L3b "Host Integrity & Persistence Triage". The host is built from the S1 scenario
// engine and the S2 Operation Night Shift fixtures (seed A or B). Grading recomputes
// every expected fact from the virtual host's own files, so the lab definition holds no
// answer key. Nothing executes; on-host eradication is refused because the ticket is
// request-only for L3b.
(function () {
  const C = window.MISSION_NEXT_NIGHT_SHIFT_COMMON;
  const WRITE_PREFIXES = ['/home/analyst/', '/tmp/', '/evidence/'];
  const SHARE = '/srv/share/finance';
  const PERM = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
  const AIDE_REPORT = '/var/lib/sa/aide-check.txt';
  const SS = '/var/lib/sa/ss.txt';
  const digits = mode => String(mode || '0644').padStart(4, '0').slice(-3).split('').map(Number);

  function ticketId(seed) { return `IR-${seed}-204`; }

  function buildFs(context = {}) {
    const fixture = C.fixtureFor(context);
    const { truth, artifacts } = fixture;
    const linux = artifacts.linux;
    const persistence = linux.persistence;
    const account = truth.identity.account;
    const date = truth.timeline.linuxSuccess.slice(0, 10);
    const port = persistence.listener.split(':').pop();
    const golden = '# /etc/sudoers\nroot ALL=(ALL:ALL) ALL\n%sudo ALL=(ALL:ALL) ALL\n';
    const sudoers = golden + linux.sudoers;
    const unit = [
      '[Unit]', 'Description=Network Time Helper', 'After=network.target', '',
      '[Service]', `ExecStart=${persistence.executable} --listen ${persistence.listener}`, 'Restart=always', 'User=root', '',
      '[Install]', 'WantedBy=multi-user.target', '',
    ].join('\n');
    const aideStart = C.addSeconds(truth.timeline.auditStopped, 600);
    const aideEnd = C.addSeconds(truth.timeline.auditStopped, 628);
    const stamp = value => value.replace('T', ' ').replace('Z', ' +0000');
    const aide = [
      `Start timestamp: ${stamp(aideStart)} (AIDE 0.18.6)`,
      'AIDE found differences between database and filesystem!!', '',
      'Summary:', '  Total number of entries:      24811', '  Added entries:                1', '  Removed entries:              0', '  Changed entries:              1', '',
      '---------------------------------------------------', 'Added entries:', '---------------------------------------------------', '',
      `f++++++++++++++++: ${persistence.unitPath}`, '',
      '---------------------------------------------------', 'Changed entries:', '---------------------------------------------------', '',
      'f   ...    .C... : /etc/sudoers', '',
      '---------------------------------------------------', 'Detailed information about changes:', '---------------------------------------------------', '',
      'File: /etc/sudoers', `  SHA256    : ${C.sha256Base64(golden)} | ${C.sha256Base64(sudoers)}`, '',
      `File: ${persistence.unitPath}`, `  SHA256    : ${C.sha256Base64(unit)}`, '',
      `End timestamp: ${stamp(aideEnd)} (run time: 0m 28s)`,
    ].join('\n') + '\n';
    const started = C.hms(C.addSeconds(truth.timeline.auditStopped, 150)).slice(0, 5);
    const ps = [
      'UID          PID    PPID  C STIME TTY          TIME CMD',
      'root           1       0  0 00:00 ?        00:00:03 /sbin/init',
      'root         812       1  0 00:00 ?        00:00:00  \\_ /usr/sbin/sshd -D',
      'root        1044       1  0 00:00 ?        00:00:02  \\_ /usr/sbin/smbd --foreground',
      'root        1290       1  0 00:00 ?        00:00:00  \\_ /usr/lib/postfix/sbin/master -w',
      `root        4211       1  0 ${started} ?        00:00:00  \\_ ${persistence.executable} --listen ${persistence.listener}`,
    ].join('\n') + '\n';
    const sockets = [
      'State  Recv-Q Send-Q Local Address:Port  Peer Address:Port Process',
      'LISTEN 0      128          0.0.0.0:22         0.0.0.0:*     users:(("sshd",pid=812,fd=3))',
      'LISTEN 0      50           0.0.0.0:445        0.0.0.0:*     users:(("smbd",pid=1044,fd=46))',
      'LISTEN 0      100          0.0.0.0:465        0.0.0.0:*     users:(("master",pid=1290,fd=18))',
      `LISTEN 0      5      ${persistence.listener.padStart(20, ' ')}         0.0.0.0:*     users:(("${persistence.listenerProcess}",pid=4211,fd=3))`,
    ].join('\n') + '\n';
    const chkrootkit = [
      "ROOTDIR is `/'", "Checking `chsh'...                                         not infected", "Checking `cron'...                                         not infected",
      "Checking `passwd'...                                       not infected", "Checking `sshd'...                                         not infected",
      `Checking \`bindshell'...                                    INFECTED (PORTS:  ${port})`, "Checking `lkm'...                                          chkproc: nothing detected",
    ].join('\n') + '\n';
    const fin = content => ({ __file: true, content, mode: '0777', owner: 'root', group: 'finance' });
    const bin = (content, mode) => ({ __file: true, content, mode, owner: 'root', group: 'root' });
    return {
      home: { analyst: {
        'ir-ticket.txt': [
          `Ticket ${ticketId(fixture.seed)} | File-server permission review and host integrity triage | opened ${date}`,
          `Host: ${linux.hostname} (Ubuntu 22.04) | All timestamps are UTC`,
          'Part A (authorized change): the finance share must follow least privilege. You may fix its permissions and verify the result.',
          'Part B (request-only): integrity tooling flagged this host. You may preserve evidence and investigate. You may NOT remove persistence or alter accounts on the host; recommend the response to the IR lead.',
        ].join('\n') + '\n',
      } },
      srv: { share: {
        finance: { __mode: '0777', __owner: 'root', __group: 'finance', 'wages-2025-Q4.xlsx': fin('binary xlsx'), 'tax-form-W2-jsanders.pdf': fin('binary pdf'), 'ap-vendor-banking.csv': fin('vendor,routing,account\n') },
        public: { 'README.txt': 'Public read-only share.\n' },
      } },
      etc: {
        hostname: linux.hostname + '\n',
        'os-release': 'PRETTY_NAME="Ubuntu 22.04.4 LTS"\nNAME="Ubuntu"\nVERSION_ID="22.04"\nID=ubuntu\n',
        passwd: [
          'root:x:0:0:root:/root:/bin/bash', 'analyst:x:1000:1000:SOC analyst:/home/analyst:/bin/bash', 'j.sanders:x:1001:1001::/home/j.sanders:/bin/bash',
          'm.chen:x:1002:1002::/home/m.chen:/bin/bash', 'svc_backup:x:1003:1003::/var/lib/backup:/usr/sbin/nologin', 'helpdesk-admin:x:1004:1004::/home/helpdesk-admin:/bin/bash',
          `${account}:x:1099:1099::/home/${account}:/bin/bash`,
        ].join('\n') + '\n',
        group: ['root:x:0:', 'sudo:x:27:helpdesk-admin', 'finance:x:2001:j.sanders,m.chen', 'analyst:x:1000:'].join('\n') + '\n',
        sudoers: { __file: true, content: sudoers, mode: '0440', owner: 'root', group: 'root' },
        aide: { 'aide.conf': '# /etc/aide/aide.conf\ndatabase_in=file:/var/lib/aide/aide.db\ndatabase_out=file:/var/lib/aide/aide.db.new\n' },
        systemd: { system: { [persistence.unitPath.split('/').pop()]: bin(unit, '0644') } },
      },
      usr: { local: { sbin: { [persistence.executable.split('/').pop()]: bin('ELF training placeholder\n', '0755') } } },
      var: {
        lib: {
          aide: { 'aide.db': 'golden-image-baseline\n' },
          sa: { 'aide-check.txt': aide, 'ss.txt': sockets, 'ps.txt': ps, 'chkrootkit-report.txt': chkrootkit },
        },
        log: {},
      },
      tmp: {},
    };
  }

  // ---- state readers ----
  function walk(vfs, path, visit) {
    visit(path, vfs.stat(path));
    if (!vfs.isDir(path)) return;
    for (const entry of vfs.list(path) || []) walk(vfs, `${path === '/' ? '' : path}/${entry.name}`, visit);
  }
  function aideReport(vfs) {
    const text = vfs.read(AIDE_REPORT) || '';
    const flagged = [];
    let section = '';
    for (const line of text.split('\n')) {
      if (/^Added entries:/.test(line)) section = 'added';
      else if (/^Changed entries:/.test(line)) section = 'changed';
      else if (/^Detailed information/.test(line)) section = 'detail';
      const entry = /^[fd][^:]*:\s*(\/\S+)\s*$/.exec(line);
      if ((section === 'added' || section === 'changed') && entry) flagged.push(entry[1]);
    }
    const seized = {};
    const detail = /File: (\S+)\n\s+SHA256\s*:\s*([^\n]+)/g;
    let match;
    while ((match = detail.exec(text))) seized[match[1]] = C.base64ToHex(match[2].split('|').pop().trim());
    return { text, flagged, seized, differences: /AIDE found differences/.test(text) };
  }
  function evidenceFiles(vfs) {
    const files = [];
    if (vfs.isDir('/evidence')) walk(vfs, '/evidence', (path, stat) => { if (stat && stat.type === 'file' && /^\/evidence\/IR-[A-Za-z0-9-]+\//.test(path)) files.push({ path, stat, content: vfs.read(path) }); });
    return files;
  }
  function custodyRows(vfs) {
    return evidenceFiles(vfs).filter(file => /custody\.csv$/.test(file.path))
      .flatMap(file => file.content.split('\n').filter(Boolean).map(line => line.split(',').map(field => field.trim())));
  }
  function evidenceStatus(vfs, report) {
    const files = evidenceFiles(vfs);
    const rows = custodyRows(vfs);
    return report.flagged.map(path => {
      const original = vfs.stat(path);
      const seized = report.seized[path];
      const copy = files.find(file => original && seized && C.sha256Hex(file.content) === seized && file.stat.mode === original.mode && file.stat.owner === original.owner && !/custody\.csv$/.test(file.path));
      const base = path.split('/').pop();
      const custody = rows.some(row => row.length >= 5 && (row[0] === path || row[0].endsWith('/' + base)) && row[1].toLowerCase() === seized && row[2] && row[3] && row[4]);
      return { path, copied: Boolean(copy), custody, current: vfs.read(path) != null && C.sha256Hex(vfs.read(path)) === seized };
    });
  }

  function facts(vfs) {
    const nodes = [];
    walk(vfs, SHARE, (path, stat) => { if (stat) nodes.push({ path, ...stat }); });
    const share = nodes.find(node => node.path === SHARE);
    const shareFixed = Boolean(share) && nodes.every(node => {
      const d = digits(node.mode);
      const dir = node.type === 'dir';
      return d[2] === 0 && (d[0] & (dir ? 7 : 6)) === (dir ? 7 : 6) && (d[1] & (dir ? 5 : 4)) === (dir ? 5 : 4);
    });
    const passwd = (vfs.read('/etc/passwd') || '').split('\n').filter(Boolean).map(line => line.split(':'));
    const groups = (vfs.read('/etc/group') || '').split('\n').filter(Boolean).map(line => line.split(':'));
    const members = name => ((groups.find(row => row[0] === name) || [])[3] || '').split(',').filter(Boolean);
    const exposed = passwd.filter(row => !/nologin|false$/.test(row[6] || '') && !['root', 'analyst'].includes(row[0]) && !members('finance').includes(row[0]) && !members('sudo').includes(row[0])).map(row => row[0]);
    const report = aideReport(vfs);
    const privilegePath = report.flagged.find(path => /NOPASSWD:\s*ALL/.test(vfs.read(path) || ''));
    const rule = (vfs.read('/etc/sudoers') || '').split('\n').find(line => /^\S+\s+ALL=\(ALL\)\s+NOPASSWD:\s*ALL/.test(line) && !line.startsWith('root'));
    const unitPath = report.flagged.find(path => /\.service$/.test(path));
    const exec = unitPath ? /^ExecStart=(\S+)/m.exec(vfs.read(unitPath) || '') : null;
    const process = exec ? exec[1].split('/').pop() : '';
    const listener = (vfs.read(SS) || '').split('\n').find(line => process && line.includes(`"${process}"`));
    const port = listener ? (/:(\d+)\s/.exec(listener) || [])[1] : '';
    const ticket = /^Ticket (\S+)/.exec(vfs.read('/home/analyst/ir-ticket.txt') || '');
    return {
      shareFixed, otherLine: share ? `other::${PERM[digits(share.mode)[2]]}` : '', exposed, report, privilegePath, account: rule ? rule.split(/\s+/)[0] : '',
      unitPath, executable: exec ? exec[1] : '', process, port, ticket: ticket ? ticket[1] : '', evidence: evidenceStatus(vfs, report),
      ok: Boolean(share && report.flagged.length && privilegePath && unitPath && port && exec),
    };
  }

  // ---- evidence detectors ----
  const detectors = {
    ticket: ({ stdout, f }) => f.ticket && stdout.includes(f.ticket),
    shareListed: ({ stdout }) => /finance/.test(stdout) && /[d-][rwx-]{9}|\(0\d{3}\/|other::/.test(stdout),
    aclRead: ({ stdout }) => /other::/.test(stdout),
    accountsReviewed: ({ stdout, f }) => f.exposed.length > 0 && f.exposed.every(name => stdout.includes(`${name}:x:`)),
    groupReviewed: ({ stdout }) => /finance:x:\d+:/.test(stdout),
    aideReport: ({ stdout, f }) => f.report.differences && f.report.flagged.every(path => stdout.includes(path)) && /AIDE found differences/.test(stdout),
    listener: ({ stdout, f }) => f.port && /LISTEN/.test(stdout) && stdout.includes(`:${f.port}`) && stdout.includes(f.process),
    processTree: ({ stdout, f }) => f.executable && (stdout.includes(f.executable) || new RegExp(`\\|-${C.escapeRegex(f.process)}\\(\\d+\\)`).test(stdout)),
    persistence: ({ stdout, f }) => f.unitPath && (new RegExp(`ExecStart=${C.escapeRegex(f.executable)}`).test(stdout) || (stdout.includes(f.unitPath) && /Loaded:/.test(stdout))),
  };

  function createSession() { return { seen: [], last: [], denied: 0, commands: 0, seq: 0, evidence: {} }; }

  function detect(vfs, line, stdout, session) {
    const f = facts(vfs);
    const found = Object.keys(detectors).filter(key => f.ok && detectors[key]({ stdout: String(stdout || ''), line, f }));
    if (f.ok && f.shareFixed && /other::/.test(stdout || '') && !found.includes('aclAfterFix')) found.push('aclAfterFix');
    session.last = found;
    found.forEach(key => { if (!session.seen.includes(key)) session.seen.push(key); });
    session.commands += 1;
    if (f.ok) {
      f.evidence.forEach(item => {
        const record = session.evidence[item.path] || (session.evidence[item.path] = {});
        if (item.copied && !record.copy) record.copy = ++session.seq;
        if (item.custody && !record.custody) record.custody = ++session.seq;
      });
    }
  }

  // ---- commands ----
  const ok = stdout => ({ stdout, stderr: '', exitCode: 0 });
  const fail = (stderr, code = 1) => ({ stdout: '', stderr, exitCode: code });

  function commandsFor(env, session, options) {
    const builtins = window.MISSION_NEXT_BASH_ENGINE.BUILTINS;
    const base = { chmod: builtins.chmod, setfacl: builtins.setfacl };
    const f = facts(env.vfs);
    const protectedPaths = f.ok ? [...f.report.flagged, f.executable, '/etc/passwd', '/etc/group'] : [];
    const isProtected = path => protectedPaths.includes(path);
    const denied = message => { session.denied += 1; return fail(`${message}\n`); };
    const requestOnly = name => `${name}: the L3b ticket is request-only. Preserve evidence, then recommend the response to the IR lead; do not alter persistence or accounts on the host.`;
    const operands = args => args.filter(arg => !arg.startsWith('-'));
    const touchesProtected = (args) => operands(args).some(arg => isProtected(C.normalizePath(env, arg)));
    const shareChange = (name, run) => (cmdEnv, args) => {
      const targets = operands(args).slice(1);
      const inShare = targets.length > 0 && targets.every(target => { const path = C.normalizePath(cmdEnv, target); return path === SHARE || path.startsWith(SHARE + '/'); });
      if (!inShare) return denied(`${name}: this ticket only authorizes permission changes on the finance share.`);
      const check = options.activeStep && options.activeStep.validation && options.activeStep.validation.check;
      if (check !== 'sharePermsFixed') return denied(`${name}: finish reviewing the share first. The permission change is authorized once you reach that step.`);
      return run(cmdEnv, args);
    };
    const removal = name => (cmdEnv, args) => (touchesProtected(args) || operands(args).length === 0 ? denied(requestOnly(name)) : denied(`${name}: nothing in this ticket authorizes removing or moving files.`));
    const copy = (cmdEnv, args) => {
      const paths = operands(args);
      if (paths.length !== 2) return fail('cp: missing file operand\n');
      const src = C.normalizePath(cmdEnv, paths[0]);
      let dst = C.normalizePath(cmdEnv, paths[1]);
      if (cmdEnv.vfs.isDir(dst)) dst = `${dst}/${src.split('/').pop()}`;
      if (!C.allowedWrite(dst, WRITE_PREFIXES)) return denied(`cp: cannot create regular file '${paths[1]}': Permission denied`);
      const stat = cmdEnv.vfs.stat(src);
      if (!stat || stat.type !== 'file') return fail(`cp: cannot stat '${paths[0]}': No such file or directory\n`);
      const preserve = args.some(arg => /^-[a-zA-Z]*[pa][a-zA-Z]*$/.test(arg) || arg === '--preserve' || arg.startsWith('--preserve='));
      const opts = preserve ? { mode: stat.mode, owner: stat.owner, group: stat.group } : { mode: '0644', owner: 'analyst', group: 'analyst' };
      return cmdEnv.vfs.write(dst, cmdEnv.vfs.read(src), opts) ? ok('') : fail(`cp: cannot create regular file '${paths[1]}': No such file or directory\n`);
    };
    return {
      mkdir: C.mkdirCommand(['/evidence/', '/tmp/', '/home/analyst/']),
      sha256sum: C.sha256sumCommand,
      awk: C.awkCommand,
      cp: copy,
      chmod: shareChange('chmod', base.chmod),
      setfacl: shareChange('setfacl', base.setfacl),
      rm: removal('rm'), mv: removal('mv'), kill: removal('kill'), pkill: removal('pkill'), killall: removal('killall'),
      visudo: () => denied(requestOnly('visudo')), userdel: () => denied(requestOnly('userdel')), usermod: () => denied(requestOnly('usermod')), gpasswd: () => denied(requestOnly('gpasswd')),
      ss(cmdEnv) { return ok(cmdEnv.vfs.read(SS) || ''); },
      netstat(cmdEnv) {
        const rows = (cmdEnv.vfs.read(SS) || '').split('\n').slice(1).filter(Boolean).map(line => {
          const [, , , local, , process] = line.trim().split(/\s+/);
          const detail = /"([^"]+)",pid=(\d+)/.exec(process || '') || [];
          return `tcp        0      0 ${local.padEnd(23)} 0.0.0.0:*               LISTEN      ${detail[2] || '-'}/${detail[1] || '-'}`;
        });
        return ok(['Active Internet connections (only servers)', 'Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name', ...rows].join('\n') + '\n');
      },
      ps(cmdEnv) { return ok(cmdEnv.vfs.read('/var/lib/sa/ps.txt') || ''); },
      pstree(cmdEnv) {
        const lines = (cmdEnv.vfs.read('/var/lib/sa/ps.txt') || '').split('\n').filter(line => line.includes('\\_')).map(line => {
          const columns = line.trim().split(/\s+/);
          return `  |-${line.split('\\_')[1].trim().split(' ')[0].split('/').pop()}(${columns[1]})`;
        });
        return ok(['systemd(1)', ...lines].join('\n') + '\n');
      },
      systemctl(cmdEnv, args) {
        const [action, target] = operands(args);
        const unitPath = f.unitPath;
        const unitFile = unitPath ? cmdEnv.vfs.read(unitPath) : null;
        const unitBase = unitPath ? unitPath.split('/').pop() : '';
        const named = target && (target === unitBase || target === unitBase.replace(/\.service$/, ''));
        if (['stop', 'disable', 'mask', 'kill', 'restart', 'start', 'enable'].includes(action)) return denied(requestOnly(`systemctl ${action}`));
        if (!unitFile || !named) return fail(`Unit ${target || ''} could not be found.\n`, 4);
        if (action === 'cat') return ok(`# ${unitPath}\n${unitFile}`);
        if (action === 'status') {
          return ok([`● ${unitBase} - Network Time Helper`, `     Loaded: loaded (${unitPath}; enabled; preset: enabled)`, '     Active: active (running)', '   Main PID: 4211 (' + f.process + ')', `     CGroup: /system.slice/${unitBase}`, `             └─4211 ${(/^ExecStart=(.+)$/m.exec(unitFile) || [])[1] || f.executable}`].join('\n') + '\n');
        }
        return fail('Usage in this lab: systemctl status UNIT | systemctl cat UNIT\n');
      },
      aide(cmdEnv, args) {
        if (!(args.includes('--check') || args.includes('-C'))) return ok('Usage: aide [--config FILE] --check\n');
        if (!cmdEnv.vfs.exists('/var/lib/aide/aide.db')) return fail("Couldn't open file /var/lib/aide/aide.db for reading\n", 18);
        return { stdout: cmdEnv.vfs.read(AIDE_REPORT) || '', stderr: '', exitCode: 7 };
      },
      chkrootkit(cmdEnv) { return ok(cmdEnv.vfs.read('/var/lib/sa/chkrootkit-report.txt') || ''); },
    };
  }

  function runLine(env, line, session, options = {}) {
    const overrides = commandsFor(env, session, options);
    const result = C.runWithCommands(env, line, overrides, WRITE_PREFIXES);
    if (result.clear || result.pager) return { ...result, observed: { nightShift: JSON.parse(JSON.stringify(session)) } };
    detect(env.vfs, line, result.stdout, session);
    return { ...result, observed: { nightShift: JSON.parse(JSON.stringify(session)) } };
  }

  // ---- state-derived grading ----
  const phases = {
    preparation: { label: 'Preparation', objective: 'Confirm ticket authority and the scheduled access-review scope.' },
    detection: { label: 'Detection & Analysis', objective: 'Verify permissions, integrity changes and persistence from host state.' },
    containment: { label: 'Containment', objective: 'Apply the authorized permission fix; preserve evidence before anything else.' },
    eradication: { label: 'Eradication', objective: 'Decide between on-host cleanup and rebuild, and document every persistence artifact.' },
  };
  const deny = window.MISSION_NEXT_SCENARIO_ENGINE.deny;
  const commandCheck = (...keys) => ({ last }) => (keys.some(key => last.includes(key)) ? true : deny('Run a command whose output shows this evidence.'));
  const clean = text => String(text || '').trim().toLowerCase().replace(/\s+/g, '');
  const scenario = window.MISSION_NEXT_SCENARIO_ENGINE.createScenario({
    fsFactory: buildFs,
    initialState: createSession(),
    phases,
    commands: { line: ({ env, line, session, options }) => runLine(env, line, session, options) },
    checks: {
      ticketRead: commandCheck('ticket'),
      shareListed: commandCheck('shareListed'),
      shareOther: ({ answer, f, seen }) => {
        if (!seen.includes('aclRead')) return deny('Run getfacl on the share first.');
        return [f.otherLine, f.otherLine.split('::')[1]].map(clean).includes(clean(answer)) ? true : deny('Submit the other:: entry exactly as getfacl reports it.');
      },
      sharePermsFixed: ({ f }) => (f.shareFixed ? true : deny('Other users still have access, or the owner/finance group lost access it needs. Fix the whole share tree.')),
      shareVerified: ({ answer, f, seen }) => {
        if (!f.shareFixed) return deny('The share is not fixed yet.');
        if (!seen.includes('aclAfterFix')) return deny('Run getfacl again after the change to verify it.');
        return clean(answer) === clean(f.otherLine) ? true : deny('Submit the other:: entry that getfacl now reports.');
      },
      exposedAccount: ({ answer, f, seen }) => {
        if (!seen.includes('accountsReviewed') || !seen.includes('groupReviewed')) return deny('Compare /etc/passwd with /etc/group before answering.');
        return f.exposed.map(clean).includes(clean(answer)) && f.exposed.length === 1 ? true : deny('Submit the one interactive account that is not finance, not an administrator, and not yours.');
      },
      evidenceDir: ({ vfs }) => (vfs.isDir('/evidence') && (vfs.list('/evidence') || []).some(entry => entry.type === 'dir' && /^IR-[A-Za-z0-9-]+$/.test(entry.name)) ? true : deny('Create /evidence/IR-<id>/ for this incident.')),
      aideReport: commandCheck('aideReport'),
      privilegePath: ({ answer, f, seen }) => {
        if (!seen.includes('aideReport')) return deny('Run the integrity check first.');
        return String(answer || '').trim() === f.privilegePath ? true : deny('Submit the path of the flagged file that grants privilege escalation.');
      },
      evidencePreserved: ({ f, session }) => {
        const missing = [];
        f.evidence.forEach(item => {
          const record = (session.evidence || {})[item.path] || {};
          if (!item.copied) missing.push(`${item.path}: no evidence copy that preserves content, mode and owner (use cp -p) and matches the state AIDE reported`);
          else if (!item.custody) missing.push(`${item.path}: no valid custody.csv row (item,sha256,time,handler,reason) with the seized hash`);
          else if (!record.copy || !record.custody || record.custody < record.copy) missing.push(`${item.path}: record custody after the evidence copy exists`);
        });
        return missing.length ? deny(`Evidence is not preserved yet. ${missing[0]}`) : true;
      },
      listener: commandCheck('listener'),
      persistence: commandCheck('persistence', 'processTree'),
      listenerPort: ({ answer, f, seen }) => {
        if (!seen.includes('listener')) return deny('List the listening sockets first.');
        const ports = String(answer || '').match(/\d{2,5}/g) || [];
        return ports.length === 1 && ports[0] === f.port ? true : deny('Submit the TCP port that the unexpected process is listening on.');
      },
      hostNote: ({ answer, f, seen }) => {
        if (!seen.includes('listener') || !seen.includes('aideReport')) return deny('Finish the integrity and persistence checks before writing the note.');
        const text = String(answer || '');
        const missing = [];
        f.report.flagged.forEach(path => { if (!text.includes(path)) missing.push(path); });
        if (!new RegExp(C.escapeRegex(f.account), 'i').test(text)) missing.push('the account behind the sudoers rule');
        if (!text.includes(f.port)) missing.push('the listener port');
        if (!new RegExp(C.escapeRegex(f.process), 'i').test(text)) missing.push('the persistence process');
        if (!text.includes(f.executable)) missing.push('the persistence executable');
        if (!/rebuild|re-?image|approved image|golden image/i.test(text)) missing.push('the rebuild recommendation');
        if (!/request|\bask(?:ed|ing)?\b|escalat|ir lead|hand(?:ing)? ?off/i.test(text)) missing.push('that the response is requested, not performed on-host');
        if (!/custody|evidence|hash|sha-?256/i.test(text)) missing.push('the preserved evidence');
        return missing.length ? deny(`The note is missing: ${missing.join(', ')}.`) : true;
      },
    },
  });

  function validate(step, sim, submission) {
    const state = sim && sim.observed && sim.observed.nightShift;
    if (!state) return deny('Run a command in the terminal first.');
    const f = facts(sim.vfs);
    if (!f.ok) return deny('The host evidence could not be read.');
    let last = [];
    if (step.kind === 'command') {
      const result = sim.commandResult && sim.commandResult.observed && sim.commandResult.observed.nightShift;
      last = (result && result.last) || [];
    }
    const outcome = scenario.check(step.validation.check, { answer: String(submission || '').trim(), f, vfs: sim.vfs, seen: state.seen || [], last, session: state });
    return typeof outcome === 'boolean' ? (outcome ? { ok: true } : deny('Not yet.')) : outcome;
  }

  function signature(vfs) { return C.sha256Hex(vfs.read(AIDE_REPORT) || ''); }

  window.MISSION_NEXT_HOST_INTEGRITY = { buildFs, createSession, runLine, facts, validate, scenario, phase: scenario.phase, phases: scenario.phases, signature, ticketId };
  window.MISSION_NEXT_VALIDATOR.predicates.nightShiftHost = validate;
})();
