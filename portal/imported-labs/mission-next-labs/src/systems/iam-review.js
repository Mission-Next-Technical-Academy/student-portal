// Stateful, deliberately scoped Ubuntu account-review simulation for sa-5.
// It never connects to a host or executes operating-system commands.
(function () {
  const ACCOUNT = 'temp.contractor';
  const HOST = 'iam-server';
  const PREFIX = 'sa-5.ssh.';
  const ROOT_RULE = 'root ALL=(ALL:ALL) ALL';
  const GROUP_RULE = '%sudo ALL=(ALL:ALL) ALL';
  const DIRECT_RULE = 'temp.contractor ALL=(ALL) NOPASSWD: ALL';
  const initialPolicy = '# /etc/sudoers — Ubuntu 24.04 training server\n' +
    ROOT_RULE + '\n' + GROUP_RULE + '\n' + DIRECT_RULE + ' # temporary exception\n';

  function buildFs() {
    const failures = ['02:14:50', '02:14:55', '02:15:00', '02:15:05', '02:15:10', '02:15:15', '02:15:20'];
    const log = [
      '2026-09-24T09:01:00Z iam-server sshd[1800]: Accepted publickey for helpdesk-admin from 10.10.24.7 port 41200 ssh2',
      ...failures.map(time => `2026-09-25T${time}Z iam-server sshd[2100]: Failed password for ${ACCOUNT} from 198.51.100.42 port 38814 ssh2`),
      `2026-09-25T02:15:34Z iam-server sshd[2100]: Accepted password for ${ACCOUNT} from 198.51.100.42 port 38814 ssh2`,
      `2026-09-25T02:16:02Z iam-server sudo: ${ACCOUNT} : TTY=pts/3 ; PWD=/home/${ACCOUNT} ; USER=root ; COMMAND=/usr/bin/id`,
      `2026-09-25T02:25:00Z iam-server sshd[2100]: pam_unix(sshd:session): session closed for user ${ACCOUNT}`,
    ].join('\n') + '\n';
    return {
      home: { analyst: {
        'hr-roster.txt': [
          'IAM-2059 | Approved local-account access review | 2026-09-25 09:00 UTC',
          'Server: iam-server | Ubuntu 24.04 | All evidence timestamps are UTC',
          'Account          Employment  Approved access',
          'analyst          Employee    IAM administration for this approved ticket',
          'helpdesk-admin   Employee    Server administrator',
          'j.sanders        Employee    Standard user',
          'temp.contractor  Contractor  Standard engineering SSH access; NO administrator access',
          'Contract active through 2026-09-30. Do not delete or disable the account.',
          'Contractor approved source: 10.10.24.88 through the corporate VPN, 08:00–18:00 UTC.',
          'Approved change: remove contractor sudo membership and its direct sudoers exception.',
          'No contractor sessions or privileged processes remain active at review time.',
          'Preserve login evidence. Escalate suspicious activity to the SOC for investigation.',
        ].join('\n') + '\n',
      } },
      etc: {
        hostname: HOST + '\n',
        passwd: 'root:x:0:0:root:/root:/bin/bash\nanalyst:x:1000:1000:IAM analyst:/home/analyst:/bin/bash\nhelpdesk-admin:x:1001:1001:Helpdesk:/home/helpdesk-admin:/bin/bash\nj.sanders:x:1002:1002:Employee:/home/j.sanders:/bin/bash\ntemp.contractor:x:1099:1099:Contractor:/home/temp.contractor:/bin/bash\n',
        group: 'root:x:0:\nanalyst:x:1000:\nhelpdesk-admin:x:1001:\nj.sanders:x:1002:\ntemp.contractor:x:1099:\nsudo:x:27:analyst,helpdesk-admin,temp.contractor\nengineering:x:1100:temp.contractor\n',
        sudoers: { __file: true, content: initialPolicy, mode: '0440' },
      },
      var: { log: { 'auth.log': log } },
      tmp: {},
    };
  }

  function rows(vfs, path) {
    return (vfs.read(path) || '').trim().split('\n').filter(Boolean).map(line => line.split(':'));
  }
  function memberships(vfs, username) {
    const account = rows(vfs, '/etc/passwd').find(row => row[0] === username);
    if (!account) return null;
    return rows(vfs, '/etc/group').filter(row => row[2] === account[3] || (row[3] || '').split(',').includes(username));
  }
  function policyLines(text) {
    return String(text).split('\n').map(line => line.replace(/#.*/, '').trim()).filter(Boolean);
  }
  function policyValid(text) {
    // This guided editor supports the supplied rules, not the full sudoers grammar.
    const lines = policyLines(text);
    return lines.filter(line => line === ROOT_RULE).length === 1 &&
      lines.filter(line => line === GROUP_RULE).length === 1 &&
      lines.filter(line => line === DIRECT_RULE).length <= 1 &&
      lines.every(line => [ROOT_RULE, GROUP_RULE, DIRECT_RULE].includes(line));
  }
  function access(vfs, username = ACCOUNT) {
    const groups = memberships(vfs, username);
    const policy = vfs.read('/etc/sudoers') || '';
    const lines = policyLines(policy);
    return {
      valid: policyValid(policy),
      group: Boolean(groups && groups.some(row => row[0] === 'sudo') && lines.includes(GROUP_RULE)),
      direct: username === ACCOUNT && lines.includes(DIRECT_RULE),
    };
  }
  function removeMembership(vfs) {
    const content = rows(vfs, '/etc/group').map(row => {
      if (row[0] === 'sudo') row[3] = row[3].split(',').filter(name => name !== ACCOUNT).join(',');
      return row.join(':');
    }).join('\n') + '\n';
    vfs.write('/etc/group', content);
  }
  function restoreCompleted(vfs, completed) {
    // Reconstruct verified changes when course progress resumes on another device.
    if (completed.includes(PREFIX + 'ex4.s1')) removeMembership(vfs);
    if (completed.includes(PREFIX + 'ex4.s2')) {
      vfs.write('/etc/sudoers', initialPolicy.split('\n').filter(line => !line.startsWith(ACCOUNT + ' ')).join('\n'), { mode: '0440' });
    }
  }
  function createSession() {
    return { connected: false, action: '', logReviewed: false, policyChecked: false, groupsVerified: false, permissionsVerified: false };
  }
  function result(session, action, stdout = '', stderr = '', exitCode = 0, extra = {}) {
    session.action = action;
    return { stdout, stderr, exitCode, ...extra, observed: { iam: { ...session } } };
  }
  function invalidate(session) {
    session.policyChecked = false;
    session.groupsVerified = false;
    session.permissionsVerified = false;
  }
  function savePolicy(vfs, session, text) {
    if (!session.connected) return result(session, 'error', '', 'Connect with SSH first.\n', 1);
    if (!policyValid(text)) return result(session, 'error', '', 'Not saved. Keep the root and %sudo rules unchanged; remove only the contractor entry. This guided editor supports the supplied sudoers rules.\n', 1);
    vfs.write('/etc/sudoers', text.endsWith('\n') ? text : text + '\n', { mode: '0440' });
    invalidate(session);
    return result(session, 'policySaved', '/etc/sudoers: saved; parsed OK\n');
  }

  function runLine(env, line, session) {
    const engine = window.MISSION_NEXT_BASH_ENGINE;
    const tokens = engine.tokenize(line.trim());
    const sudo = tokens[0] === 'sudo';
    const args = sudo ? tokens.slice(1) : tokens;
    const cmd = args[0];
    const fail = message => result(session, 'error', '', message + '\n', 1);
    if (!cmd) return result(session, 'empty');
    if (/[<>]|&&|\|\|/.test(line)) return fail('Use one command at a time. Edit the account policy through sudo visudo.');
    if (cmd === 'ssh') {
      if (sudo || args.length !== 2 || args[1] !== 'analyst@' + HOST) return fail('Use the ticket destination: ssh analyst@iam-server');
      if (session.connected) return fail('Already connected to iam-server. Use exit to return to the workstation.');
      session.connected = true;
      env.cwd = '/home/analyst';
      return result(session, 'connected', 'Host key verified against the preconfigured training known_hosts file.\nAuthenticated with the assigned training key.\nWelcome to Ubuntu 24.04 LTS (iam-server).\n');
    }
    if (cmd === 'exit') {
      session.connected = false;
      return result(session, 'disconnected', 'Connection to iam-server closed.\n');
    }
    if (cmd === 'clear') return result(session, 'clear', '', '', 0, { clear: true });
    if (!session.connected) return fail('You are on the analyst workstation. Connect first: ssh analyst@iam-server');
    if (cmd === 'whoami' && args.length === 1) return result(session, 'identity', (sudo ? 'root' : 'analyst') + '\n');
    if (cmd === 'hostname' && args.length === 1) return result(session, 'host', HOST + '\n');
    if (sudo && args[0] === '-l' && args[1] === '-U' && args.length === 3) {
      const username = args[2];
      if (!memberships(env.vfs, username)) return fail('sudo: unknown user ' + username);
      const rights = access(env.vfs, username);
      if (!rights.valid) return fail('sudo: invalid sudoers policy; review sudo visudo');
      const grants = [];
      if (username === 'root' || rights.group) grants.push('    (ALL : ALL) ALL');
      if (rights.direct) grants.push('    (ALL) NOPASSWD: ALL');
      if (username === ACCOUNT) session.permissionsVerified = grants.length === 0;
      return result(session, username === ACCOUNT ? 'sudoListed' : 'otherAccount', grants.length
        ? `User ${username} may run the following commands on ${HOST}:\n${grants.join('\n')}\n`
        : `User ${username} is not allowed to run sudo on ${HOST}.\n`, '', grants.length ? 0 : 1);
    }
    if (cmd === 'id' || cmd === 'groups') {
      if (args.length > 2 || (args[1] || '').startsWith('-')) return fail(`Usage: ${cmd} [username]`);
      const username = args[1] || (sudo ? 'root' : 'analyst');
      const groups = memberships(env.vfs, username);
      if (!groups) return fail(`${cmd}: '${username}': no such user`);
      const account = rows(env.vfs, '/etc/passwd').find(row => row[0] === username);
      if (username === ACCOUNT) session.groupsVerified = !groups.some(row => row[0] === 'sudo');
      const output = cmd === 'groups' ? `${username} : ${groups.map(row => row[0]).join(' ')}`
        : `uid=${account[2]}(${username}) gid=${account[3]}(${username}) groups=${groups.map(row => `${row[2]}(${row[0]})`).join(',')}`;
      return result(session, username === ACCOUNT ? 'groupsListed' : 'otherAccount', output + '\n');
    }
    if (cmd === 'getent') {
      if (args.length !== 3 || args[1] !== 'group') return fail('Usage in this lab: getent group NAME');
      const row = rows(env.vfs, '/etc/group').find(item => item[0] === args[2]);
      if (!row) return fail('Group not found: ' + args[2]);
      return result(session, args[2] === 'sudo' ? 'adminMembers' : 'otherGroup', row.join(':') + '\n');
    }
    if (cmd === 'gpasswd') {
      if (!sudo) return fail('gpasswd: Permission denied. Use sudo for the approved change.');
      if (args.join(' ') !== 'gpasswd -d temp.contractor sudo') return fail('This ticket authorizes removing temp.contractor from sudo only.');
      if (!access(env.vfs).group) return fail('gpasswd: user temp.contractor is not a member of sudo');
      removeMembership(env.vfs);
      invalidate(session);
      return result(session, 'groupRemoved', 'Removing user temp.contractor from group sudo\n');
    }
    if (cmd === 'visudo') {
      if (!sudo) return fail('visudo: Permission denied. Use sudo visudo.');
      if (args.length === 1) return result(session, 'editorOpened', '', '', 0, { editor: env.vfs.read('/etc/sudoers') });
      if (args.length === 2 && args[1] === '-c') {
        if (!policyValid(env.vfs.read('/etc/sudoers'))) return fail('/etc/sudoers: parse error');
        session.policyChecked = true;
        return result(session, 'policyChecked', '/etc/sudoers: parsed OK\n');
      }
      return fail('Usage in this lab: sudo visudo or sudo visudo -c');
    }
    const readCommands = ['cat', 'less', 'grep', 'head', 'tail', 'ls', 'pwd', 'history'];
    if (!readCommands.includes(cmd)) return fail(`bash: ${cmd}: command not available in this training lab`);
    if (!sudo && args.some(arg => ['/etc/sudoers', '/var/log/auth.log'].includes(arg))) return fail(`${cmd}: Permission denied. Use sudo to read protected evidence.`);
    const output = engine.runLine(env, line);
    let action = 'read';
    if (output.exitCode === 0 && args.includes('/home/analyst/hr-roster.txt')) action = 'rosterRead';
    if (output.exitCode === 0 && args.includes('/var/log/auth.log') && (output.stdout || '').includes('Accepted password for ' + ACCOUNT)) {
      action = 'logRead';
      session.logReviewed = true;
    }
    return result(session, action, output.stdout, output.stderr, output.exitCode, output.pager ? { pager: output.pager } : {});
  }

  function validate(step, sim, submission) {
    const state = sim.observed && sim.observed.iam;
    const deny = reason => ({ ok: false, reason });
    if (!state || !state.connected) return deny('Connect to iam-server with SSH first.');
    const check = step.validation.check;
    const rights = access(sim.vfs);
    if (step.kind === 'command') {
      if (!window.MISSION_NEXT_VALIDATOR.inputMatches(submission, step.acceptedInputs)) return deny('Run the command shown for this step.');
      if (!sim.commandResult || sim.commandResult.exitCode !== (step.validation.exitCode || 0)) return deny('The command did not produce the required result.');
      if (state.action !== check) return deny('Complete the requested action and read its output.');
    }
    if (['groupRemoved', 'groupsListed'].includes(check) && rights.group) return deny('The contractor still belongs to the administrator group.');
    if (check === 'policySaved' && (!rights.valid || rights.direct)) return deny('Remove the contractor entry, leaving the root and %sudo rules intact.');
    if (check === 'permissionsVerified' || check === 'report') {
      if (!rights.valid || rights.group || rights.direct) return deny('The contractor still has administrator access. Remove both grants.');
      if (!state.policyChecked || !state.groupsVerified || !state.permissionsVerified) return deny('Recheck the policy, groups, and sudo permissions after the changes.');
    }
    if (['sourceIp', 'loginTime', 'report'].includes(check) && !state.logReviewed) return deny('Read the authentication log before submitting your findings.');
    const answer = String(submission || '').trim();
    if (check === 'sourceIp' && answer !== '198.51.100.42') return deny('Use the source IP in the contractor authentication events.');
    if (check === 'loginTime' && !/^(?:2026-09-25[T ])?02:15:34(?:Z| UTC)?$/i.test(answer)) return deny('Enter the successful login time in UTC, including seconds.');
    if (check === 'report') {
      const facts = [/temp\.contractor/i, /sudo/i, /direct|NOPASSWD|sudoers/i, /198\.51\.100\.42/, /\b7\b|\bseven\b/i, /02:15:34/, /success|accepted/i, /verif|no (?:sudo|admin)/i, /escalat/i];
      if (!facts.every(pattern => pattern.test(answer))) return deny('Include the account, both removed grants, source IP, failure count, successful-login time, verification, and escalation to the SOC.');
    }
    return { ok: true };
  }

  // Verification runs sudo -l: its real nonzero result means no privileges remain.
  function validateReview(step, sim, submission) {
    if (step.validation.check === 'permissionsVerified') {
      const commandCheck = validate({ ...step, validation: { ...step.validation, check: 'sudoListed' } }, sim, submission);
      if (!commandCheck.ok) return commandCheck;
      return validate({ ...step, kind: 'observe' }, sim, submission);
    }
    return validate(step, sim, submission);
  }
  window.MISSION_NEXT_IAM_REVIEW = { buildFs, createSession, runLine, savePolicy, access, restoreCompleted, validateReview };
  window.MISSION_NEXT_VALIDATOR.predicates.iamReview = validateReview;
})();
