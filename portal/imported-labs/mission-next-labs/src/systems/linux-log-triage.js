// Stateful Linux log-triage simulation for sa-4, "Linux Log Triage: The Audit Gap".
// The environment is built from the S1 scenario engine and the S2 Operation Night Shift
// fixtures (seed A or B). Grading derives every expected fact from the virtual host's
// own files at runtime, so no answer key lives in the lab definition. Nothing executes.
(function () {
  const C = window.MISSION_NEXT_NIGHT_SHIFT_COMMON;
  const WRITE_PREFIXES = ['/home/analyst/', '/tmp/'];
  const AUTH = '/var/log/auth.log';
  const AUDIT = '/var/log/audit/audit.log';
  const FORWARDER = '/var/log/siem-forwarder.log';
  const FORWARD_CONF = '/etc/rsyslog.d/50-forward.conf';
  const UNIT_LOGS = { 'rsyslog.service': '/var/log/journal/rsyslog.service.log', 'auditd.service': '/var/log/journal/auditd.service.log' };

  function ticketId(seed) { return `IR-${seed}-204`; }

  function buildFs(context = {}) {
    const fixture = C.fixtureFor(context);
    const { truth, artifacts } = fixture;
    const linux = artifacts.linux;
    const host = linux.hostname;
    const date = truth.timeline.linuxSuccess.slice(0, 10);
    const stop = truth.timeline.auditStopped;
    const at = (time, message, program = 'systemd[1]') => `${date}T${time}Z ${host} ${program}: ${message}`;
    // Ordinary noise around the incident: the analyst must separate it from the burst.
    const authLog = [
      at('01:12:40', 'Accepted publickey for helpdesk-admin from 192.0.2.10 port 41200 ssh2', 'sshd[1800]'),
      at('01:58:02', 'Failed password for j.sanders from 192.0.2.25 port 50222 ssh2', 'sshd[1811]'),
      at('01:58:09', 'Accepted password for j.sanders from 192.0.2.25 port 50222 ssh2', 'sshd[1811]'),
      linux.authLog.replace(/\n$/, ''),
    ].join('\n') + '\n';
    const stopLine = at(C.hms(stop), 'Stopped auditd.service - Security Auditing Service.');
    const forwarder = [
      at('00:00:03', 'omfwd: connected to siem.nightshift.test:514', 'siem-forwarder[812]'),
      `${C.addSeconds(stop, -300)} ${host} siem-forwarder[812]: stream=audit delivered=41 last_seq=4409`,
      `${stop} ${host} siem-forwarder[812]: stream=audit delivered=1 last_seq=4410`,
      `${C.addSeconds(stop, 1)} ${host} siem-forwarder[812]: stream=auth delivered=2 last_seq=9120`,
      `${C.addSeconds(stop, 60)} ${host} siem-forwarder[812]: stream=audit idle: no new records since last_seq=4410`,
      `${C.addSeconds(stop, 120)} ${host} siem-forwarder[812]: stream=audit idle: no new records since last_seq=4410`,
    ].join('\n') + '\n';
    return {
      home: { analyst: {
        'ir-ticket.txt': [
          `Ticket ${ticketId(fixture.seed)} | Linux log triage | opened ${date}`,
          `Host: ${host} (Ubuntu 24.04) | All timestamps are UTC`,
          `Symptom: the SIEM reports that the audit stream from this host stopped arriving on ${date}.`,
          'Authority: read-only triage of logs on this host. You may not restart services, change accounts, or delete anything.',
          'Deliverable: an event timeline, findings for the IR lead, and a detection-gap note for the M4 rule-tuning backlog.',
        ].join('\n') + '\n',
      } },
      etc: {
        hostname: host + '\n',
        'os-release': 'PRETTY_NAME="Ubuntu 24.04 LTS"\nNAME="Ubuntu"\nVERSION_ID="24.04"\nID=ubuntu\n',
        'rsyslog.d': { '50-forward.conf': '# Forward the auth and audit streams to the SOC SIEM\n*.* @@siem.nightshift.test:514\n' },
      },
      var: { log: {
        'auth.log': authLog,
        syslog: [at('00:00:01', 'CRON[901]: (root) CMD (run-parts /etc/cron.hourly)', 'CRON[901]'), at('00:05:00', 'Started rsyslog.service - System Logging Service.'), stopLine].join('\n') + '\n',
        'siem-forwarder.log': forwarder,
        audit: { 'audit.log': linux.auditLog },
        journal: {
          'auditd.service.log': [at('00:00:04', 'Started auditd.service - Security Auditing Service.'), stopLine].join('\n') + '\n',
          'rsyslog.service.log': at('00:00:03', 'Started rsyslog.service - System Logging Service.') + '\n',
        },
      } },
      tmp: {},
    };
  }

  function parseLine(line) {
    const match = /^(\S+Z) (\S+) ([^:]+): (.*)$/.exec(line);
    return match ? { ts: match[1], host: match[2], program: match[3], message: match[4] } : null;
  }

  // Every expected value is recomputed from the host's current files.
  function facts(vfs) {
    const auth = (vfs.read(AUTH) || '').split('\n').map(parseLine).filter(Boolean);
    const failed = auth.map(entry => ({ entry, m: /^Failed password for (\S+) from (\S+) port/.exec(entry.message) })).filter(item => item.m)
      .map(item => ({ ts: item.entry.ts, account: item.m[1], ip: item.m[2] }));
    const groups = {};
    failed.forEach(item => { (groups[`${item.account}|${item.ip}`] = groups[`${item.account}|${item.ip}`] || []).push(item); });
    const burst = Object.values(groups).sort((a, b) => b.length - a.length)[0] || [];
    const account = burst.length ? burst[0].account : '';
    const ip = burst.length ? burst[0].ip : '';
    const lastFailure = burst.length ? burst[burst.length - 1].ts : '';
    const after = (entry, other) => Date.parse(entry.ts) > Date.parse(other);
    const accepted = auth.find(entry => after(entry, lastFailure) && new RegExp(`^Accepted \\w+ for ${C.escapeRegex(account)} from ${C.escapeRegex(ip)}`).test(entry.message));
    const sudo = auth.find(entry => accepted && after(entry, accepted.ts) && entry.message.startsWith(`${account} : `) && /COMMAND=/.test(entry.message));
    const stopEntry = auth.find(entry => sudo && after(entry, sudo.ts) && /^Stopped \S+\.service\b/.test(entry.message));
    const unit = stopEntry ? /^Stopped (\S+\.service)\b/.exec(stopEntry.message)[1] : '';
    const forwarded = (vfs.read(FORWARDER) || '').split('\n').filter(line => /stream=audit delivered=/.test(line)).map(parseLine).filter(Boolean);
    const gap = forwarded.length ? forwarded[forwarded.length - 1].ts : '';
    const rule = (vfs.read(FORWARD_CONF) || '').split('\n').filter(line => line.trim() && !line.trim().startsWith('#'))[0] || '';
    const ok = Boolean(account && accepted && sudo && stopEntry && gap && rule);
    return {
      ok, account, ip, failures: burst.length, firstFailure: burst.length ? burst[0].ts : '', accepted: accepted ? accepted.ts : '',
      sudo: sudo ? sudo.ts : '', stop: stopEntry ? stopEntry.ts : '', unit, unitShort: unit.replace(/\.service$/, ''), gap, rule,
      burstTimes: burst.map(item => item.ts), date: (stopEntry ? stopEntry.ts : '').slice(0, 10),
      ticket: /^Ticket (\S+)/.exec(vfs.read('/home/analyst/ir-ticket.txt') || '') ? /^Ticket (\S+)/.exec(vfs.read('/home/analyst/ir-ticket.txt'))[1] : '',
    };
  }

  // Evidence detectors: the command output itself must surface the fact.
  const detectors = {
    ticket: ({ stdout, f }) => f.ticket && stdout.includes(f.ticket),
    forwarderRule: ({ stdout, f }) => f.rule && stdout.includes(f.rule),
    gapEvidence: ({ stdout, f }) => f.gap && stdout.includes(C.hms(f.gap)) && /stream=audit/.test(stdout),
    burst: ({ stdout, line, f }) => {
      if (!f.failures) return false;
      if (f.burstTimes.every(ts => stdout.includes(C.hms(ts)))) return true;
      if (new RegExp(`(?:^|\\s)${f.failures}\\s+.*${C.escapeRegex(f.ip)}`, 'm').test(stdout)) return true;
      return /Failed/i.test(line) && stdout.trim() === String(f.failures);
    },
    acceptedLogin: ({ stdout, f }) => f.accepted && stdout.includes(C.hms(f.accepted)) && stdout.includes(f.account),
    sudoUse: ({ stdout, f }) => f.sudo && stdout.includes(C.hms(f.sudo)) && stdout.includes(f.account),
    auditStop: ({ stdout, f }) => f.stop && stdout.includes(C.hms(f.stop)) && (stdout.includes(f.unitShort) || /SERVICE_STOP/.test(stdout)),
  };

  function createSession() { return { seen: [], last: [], denied: 0, commands: 0 }; }

  function detect(vfs, line, stdout, session) {
    const f = facts(vfs);
    const found = Object.keys(detectors).filter(key => f.ok !== false && detectors[key]({ stdout: String(stdout || ''), line, f }));
    session.last = found;
    found.forEach(key => { if (!session.seen.includes(key)) session.seen.push(key); });
    session.commands += 1;
  }

  // ---- simulated commands ----
  const ok = stdout => ({ stdout, stderr: '', exitCode: 0 });
  const fail = (stderr, code = 1) => ({ stdout: '', stderr, exitCode: code });
  const unitName = value => (String(value || '').endsWith('.service') ? value : `${value}.service`);

  function commandsFor(session) {
    const denied = message => { session.denied += 1; return fail(`${message}\n`); };
    const readOnly = name => () => denied(`${name}: this ticket authorizes read-only triage. Request changes through the IR lead; do not alter the host.`);
    return {
      systemctl(env, args) {
        const action = args.filter(arg => !arg.startsWith('-'))[0];
        const unit = unitName(args.filter(arg => !arg.startsWith('-'))[1]);
        if (['start', 'stop', 'restart', 'reload', 'enable', 'disable', 'mask', 'kill'].includes(action)) return denied(`systemctl ${action}: this ticket authorizes read-only triage. Request service changes through the IR lead.`);
        if (action !== 'status' && action !== 'is-active') return fail('Usage in this lab: systemctl status UNIT\n');
        const journal = UNIT_LOGS[unit];
        if (!journal) return fail(`Unit ${unit} could not be found.\n`, 4);
        const entries = env.vfs.read(journal) || '';
        const lastLine = entries.split('\n').filter(Boolean).pop() || '';
        const stopped = /Stopped/.test(lastLine);
        const stamp = (lastLine.split(' ')[0] || '').replace('T', ' ').replace('Z', ' UTC');
        if (action === 'is-active') return { stdout: stopped ? 'inactive\n' : 'active\n', stderr: '', exitCode: stopped ? 3 : 0 };
        const head = [
          `${stopped ? '○' : '●'} ${unit} - ${unit === 'auditd.service' ? 'Security Auditing Service' : 'System Logging Service'}`,
          `     Loaded: loaded (/lib/systemd/system/${unit}; enabled; preset: enabled)`,
          stopped ? `     Active: inactive (dead) since ${stamp}` : '     Active: active (running) since boot',
        ];
        const tail = unit === 'rsyslog.service' ? C.readTail(env.vfs, FORWARDER, 4) : entries.trim();
        return { stdout: head.join('\n') + '\n\n' + tail + '\n', stderr: '', exitCode: stopped ? 3 : 0 };
      },
      journalctl(env, args) {
        let unit = null, since = null, until = null, limit = null, pattern = null;
        for (let i = 0; i < args.length; i++) {
          if (args[i] === '-u' || args[i] === '--unit') unit = args[++i];
          else if (args[i].startsWith('--unit=')) unit = args[i].slice(7);
          else if (args[i] === '--since' || args[i] === '-S') since = args[++i];
          else if (args[i].startsWith('--since=')) since = args[i].slice(8);
          else if (args[i] === '--until' || args[i] === '-U') until = args[++i];
          else if (args[i].startsWith('--until=')) until = args[i].slice(8);
          else if (args[i] === '-n') limit = parseInt(args[++i], 10);
          else if (args[i] === '-g' || args[i] === '--grep') pattern = args[++i];
        }
        const path = unit ? UNIT_LOGS[unitName(unit)] : '/var/log/syslog';
        const data = path ? env.vfs.read(path) : null;
        if (data == null) return ok('-- No entries --\n');
        const date = (env.vfs.read(AUTH) || '').slice(0, 10);
        const bound = text => {
          if (text == null) return null;
          const clean = String(text).trim();
          if (/^\d{2}:\d{2}(:\d{2})?$/.test(clean)) return `${date}T${clean.length === 5 ? clean + ':00' : clean}`;
          if (/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}(:\d{2})?)?$/.test(clean)) return clean.replace(' ', 'T');
          return false;
        };
        const from = bound(since), to = bound(until);
        if (from === false || to === false) return fail(`Failed to parse timestamp: ${since || until}\n`);
        let lines = data.split('\n').filter(Boolean).filter(line => (!from || line.split(' ')[0] >= from) && (!to || line.split(' ')[0] <= to));
        if (pattern) { try { lines = lines.filter(line => new RegExp(pattern).test(line)); } catch (_) { return fail('journalctl: invalid pattern\n'); } }
        if (limit) lines = lines.slice(-limit);
        return ok(lines.length ? lines.join('\n') + '\n' : '-- No entries --\n');
      },
      ausearch(env, args) {
        let types = null, key = null;
        for (let i = 0; i < args.length; i++) {
          if (args[i] === '-m' || args[i] === '--message') types = String(args[++i]).split(',');
          else if (args[i] === '-k' || args[i] === '--key') key = args[++i];
        }
        const records = (env.vfs.read(AUDIT) || '').split('\n').filter(Boolean)
          .filter(line => (!types || types.some(type => line.includes(`type=${type}`))) && (!key || line.includes(`key="${key}"`)));
        if (!records.length) return fail('<no matches>\n');
        return ok(records.map(line => `----\ntime->${line.split(' ')[0]}\n${line.slice(line.indexOf(' ') + 1)}`).join('\n') + '\n');
      },
      awk: C.awkCommand,
      rm: readOnly('rm'), mv: readOnly('mv'), chmod: readOnly('chmod'), usermod: readOnly('usermod'), userdel: readOnly('userdel'), kill: readOnly('kill'), pkill: readOnly('pkill'),
    };
  }

  function runLine(env, line, session) {
    const result = C.runWithCommands(env, line, commandsFor(session), WRITE_PREFIXES);
    if (result.clear || result.pager) return { ...result, observed: { nightShift: JSON.parse(JSON.stringify(session)) } };
    detect(env.vfs, line, result.stdout, session);
    return { ...result, observed: { nightShift: JSON.parse(JSON.stringify(session)) } };
  }

  // ---- state-derived grading ----
  const phases = {
    preparation: { label: 'Preparation', objective: 'Confirm ticket authority and SIEM forwarding health before touching evidence.' },
    detection: { label: 'Detection & Analysis', objective: 'Triage authentication and audit evidence into a supported timeline.' },
    postIncident: { label: 'Post-Incident', objective: 'Record the detection gap and the rule that would have caught it.' },
  };
  const deny = window.MISSION_NEXT_SCENARIO_ENGINE.deny;
  const commandCheck = key => ({ last }) => (last.includes(key) ? true : deny('Run a read-only command whose output shows this evidence.'));
  const scenario = window.MISSION_NEXT_SCENARIO_ENGINE.createScenario({
    fsFactory: buildFs,
    initialState: createSession(),
    phases,
    commands: { line: ({ env, line, session }) => runLine(env, line, session) },
    checks: {
      ticketRead: commandCheck('ticket'),
      forwarderRule: commandCheck('forwarderRule'),
      gapEvidence: commandCheck('gapEvidence'),
      burst: commandCheck('burst'),
      acceptedLogin: commandCheck('acceptedLogin'),
      sudoUse: commandCheck('sudoUse'),
      auditStop: commandCheck('auditStop'),
      gapTime: ({ answer, f, seen }) => {
        if (!seen.includes('gapEvidence')) return deny('Read the forwarder evidence before submitting the time.');
        const found = C.times(answer);
        return found.length === 1 && found[0] === C.hms(f.gap) ? true : deny('Submit the UTC time (HH:MM:SS) of the last audit record the SIEM received.');
      },
      sourceIp: ({ answer, f, seen }) => {
        if (!seen.includes('burst') && !seen.includes('acceptedLogin')) return deny('Read the authentication log before submitting findings.');
        const found = C.ipv4s(answer);
        return found.length === 1 && found[0] === f.ip ? true : deny('Submit only the source address that produced the burst of failed passwords.');
      },
      account: ({ answer, f, seen }) => {
        if (!seen.includes('acceptedLogin')) return deny('Find the successful login in the authentication log first.');
        return String(answer || '').trim().toLowerCase() === f.account.toLowerCase() ? true : deny('Submit the account that succeeded right after the burst of failures.');
      },
      unit: ({ answer, f, seen }) => {
        if (!seen.includes('auditStop')) return deny('Confirm the service stop in the journal or audit trail first.');
        const value = String(answer || '').trim().toLowerCase();
        return value === f.unit.toLowerCase() || value === f.unitShort.toLowerCase() ? true : deny('Submit the systemd unit that the same account stopped.');
      },
      timeline: ({ answer, f, seen }) => {
        const needed = ['burst', 'acceptedLogin', 'sudoUse', 'auditStop', 'gapEvidence'];
        if (!needed.every(key => seen.includes(key))) return deny('Gather each of the five events from the logs before building the timeline.');
        const dates = String(answer || '').match(/\d{4}-\d{2}-\d{2}/g) || [];
        if (dates.some(date => date !== f.date)) return deny('One of the dates does not match the incident logs.');
        const submitted = C.times(answer);
        const expected = [f.firstFailure, f.accepted, f.sudo, f.stop, f.gap].map(C.hms).sort();
        if (submitted.length !== expected.length) return deny('List exactly five events, one UTC timestamp (HH:MM:SS) each.');
        if (submitted.slice().sort().join() !== expected.join()) return deny('At least one timestamp does not match the evidence for the five required events.');
        return submitted.join() === expected.join() ? true : deny('Order the events chronologically. Events at the same second may be listed either way.');
      },
      caseNote: ({ answer, f, seen }) => {
        if (!seen.includes('auditStop')) return deny('Confirm the audit stop before writing the note.');
        const text = String(answer || '');
        const missing = [];
        if (!new RegExp(C.escapeRegex(f.account), 'i').test(text)) missing.push('the account');
        if (!text.includes(f.ip)) missing.push('the source address');
        if (!C.countMentioned(text, f.failures)) missing.push('the failed-password count');
        if (!text.includes(C.hms(f.stop))) missing.push('the UTC time of the stop');
        if (!new RegExp(`${C.escapeRegex(f.unitShort)}`, 'i').test(text)) missing.push('the affected service');
        if (!/no alert|not alert|without (?:an? )?alert|never alert|did not (?:fire|alert|trigger)|no detection|undetected|not detected|detection gap|blind spot|missed/i.test(text)) missing.push('that nothing alerted (the detection gap)');
        if (!(/(rule|alert|detection)/i.test(text) && /(stop|disabl|tamper|kill)/i.test(text) && /(propos|recommend|add|create|should|need)/i.test(text))) missing.push('a proposed detection rule');
        if (!/escalat|hand ?off|notify|report to|raise to/i.test(text)) missing.push('escalation to the IR lead');
        return missing.length ? deny(`The case note is missing: ${missing.join(', ')}.`) : true;
      },
    },
  });

  function validate(step, sim, submission) {
    const state = sim && sim.observed && sim.observed.nightShift;
    if (!state) return deny('Run a command in the terminal first.');
    const f = facts(sim.vfs);
    if (!f.ok) return deny('The log evidence on this host could not be read.');
    const check = step.validation.check;
    let last = [];
    if (step.kind === 'command') {
      const result = sim.commandResult && sim.commandResult.observed && sim.commandResult.observed.nightShift;
      last = (result && result.last) || [];
    }
    const outcome = scenario.check(check, { answer: String(submission || '').trim(), f, seen: state.seen || [], last });
    return typeof outcome === 'boolean' ? (outcome ? { ok: true } : deny('Not yet.')) : outcome;
  }

  function signature(vfs) { return C.sha256Hex(vfs.read(AUTH) || ''); }

  window.MISSION_NEXT_LINUX_LOG_TRIAGE = { buildFs, createSession, runLine, facts, validate, scenario, phase: scenario.phase, phases: scenario.phases, signature, ticketId };
  window.MISSION_NEXT_VALIDATOR.predicates.nightShiftTriage = validate;
})();
