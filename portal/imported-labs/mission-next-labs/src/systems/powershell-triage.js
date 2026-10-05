// Browser-only PowerShell object-pipeline simulation for Operation Night Shift.
// Commands operate on fictional fixture objects; nothing runs on the host.
(function () {
  const clone = value => JSON.parse(JSON.stringify(value));
  function splitPipeline(line) {
    const parts = []; let current = '', quote = '', depth = 0;
    for (const ch of String(line)) {
      if (quote) { current += ch; if (ch === quote) quote = ''; continue; }
      if (ch === '"' || ch === "'") { quote = ch; current += ch; continue; }
      if (ch === '{') depth++;
      if (ch === '}') depth = Math.max(0, depth - 1);
      if (ch === '|' && depth === 0) { parts.push(current.trim()); current = ''; } else current += ch;
    }
    if (current.trim()) parts.push(current.trim());
    return parts;
  }
  function values(arg) { return String(arg || '').split(',').map(x => x.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean); }
  function filterRows(rows, expression) {
    const exp = String(expression || '').replace(/^\{\s*/, '').replace(/\s*\}$/, '').trim();
    const m = /(?:\$_\.)?([\w]+)\s+(-eq|-ne|-in|-like|-notlike|-gt|-lt)\s+(.+)/i.exec(exp);
    if (!m) throw new Error(`Unsupported Where-Object expression: ${exp}`);
    const [, prop, op, raw] = m, wanted = values(raw);
    return rows.filter(row => {
      const key = Object.keys(row).find(name => name.toLowerCase() === prop.toLowerCase());
      const got = String(key ? row[key] : '');
      if (op === '-eq') return wanted.some(v => got.toLowerCase() === v.toLowerCase());
      if (op === '-ne') return wanted.every(v => got.toLowerCase() !== v.toLowerCase());
      if (op === '-in') return wanted.some(v => v.toLowerCase() === got.toLowerCase());
      if (op === '-like' || op === '-notlike') {
        const pattern = wanted[0].replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
        const hit = new RegExp(`^${pattern}$`, 'i').test(got); return op === '-like' ? hit : !hit;
      }
      return op === '-gt' ? Number(got) > Number(wanted[0]) : Number(got) < Number(wanted[0]);
    });
  }
  function create(context = {}) {
    const fixture = window.MISSION_NEXT_NIGHT_SHIFT_COMMON.fixtureFor({ ...context, labId: context.labId || 'sa-6' });
    const facts = fixture.truth, artifacts = fixture.artifacts.windows;
    const rows = {
      events: artifacts.securityEvents.map(e => ({ Id:e.eventId, TimeCreated:e.timestamp, TargetUserName:e.targetUser, IpAddress:e.sourceIp, LogonType:e.logonType, Image:e.image || '', ParentImage:e.parentImage || '', CommandLine:e.commandLine || '', ProcessId:e.processId || '' })),
      tasks: [{ TaskPath: artifacts.scheduledTask.path, Actions: artifacts.scheduledTask.action, User: artifacts.scheduledTask.runAs }],
      run: [{ Path: artifacts.runKey.path, Value: artifacts.runKey.value, Owner: artifacts.runKey.owner }],
      processes: [{ ProcessId:'0x1a2c', ParentProcessId:'0x04', Name:'powershell.exe', ExecutablePath:'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe' }, { ProcessId:'0x1a30', ParentProcessId:'0x1a2c', Name:'stage.ps1', ExecutablePath:artifacts.scheduledTask.action }],
      connections: [{ State:'Established', LocalAddress:'10.20.4.17', LocalPort:51422, RemoteAddress:artifacts.beacon.remoteAddress, RemotePort:443, OwningProcess:4120 }],
    };
    const state = { seed: fixture.seed, observations: {}, exports: {}, lastRows: [], caseNote: '' };
    function run(line) {
      try {
        const stages = splitPipeline(line); let current = null, source = '';
        for (const stage of stages) {
          const [cmd, ...tail] = stage.split(/\s+/); const rest = tail.join(' ');
          if (/^Get-WinEvent$/i.test(cmd)) {
            if (!/Security/i.test(rest)) throw new Error('Get-WinEvent supports the Security log only.');
            const requested = /\bId\s*=\s*([\d,]+)/i.exec(rest);
            current = rows.events.filter(row => !requested || values(requested[1]).includes(String(row.Id))); source = 'events';
          } else if (/^Get-ScheduledTask$/i.test(cmd)) { current = rows.tasks.slice(); source = 'tasks'; }
          else if (/^Get-ItemProperty$/i.test(cmd) && /CurrentVersion\\Run/i.test(rest)) { current = rows.run.slice(); source = 'run'; }
          else if (/^Get-CimInstance$/i.test(cmd) && /Win32_Process/i.test(rest)) { current = rows.processes.slice(); source = 'processes'; }
          else if (/^Get-NetTCPConnection$/i.test(cmd)) { current = rows.connections.slice(); source = 'connections'; }
          else if (/^Where-Object$/i.test(cmd)) current = filterRows(current || [], rest);
          else if (/^Select-Object$/i.test(cmd)) {
            const props = rest.split(/[ ,]+/).filter(Boolean).map(x => x.replace(/^[+-]/, ''));
            current = (current || []).map(row => Object.fromEntries(props.filter(p => p in row).map(p => [p,row[p]])));
          } else if (/^Sort-Object$/i.test(cmd)) {
            const desc = /^-Descending\s+/i.test(rest), prop = rest.replace(/^-Descending\s+/i, '').trim();
            current = (current || []).slice().sort((a,b) => String(a[prop] || '').localeCompare(String(b[prop] || '')) * (desc ? -1 : 1));
          } else if (/^Format-Table$/i.test(cmd)) { /* retain objects for grading; renderer formats below */ }
          else if (/^Export-Csv$/i.test(cmd)) {
            const path = /-Path\s+['"]?([^'"\s]+)['"]?/i.exec(rest);
            if (!path) throw new Error('Export-Csv requires -Path.');
            const objects = current || [];
            state.exports[path[1]] = objects.map(row => Object.entries(row).map(([k,v]) => `${k}=${v}`).join(',')).join('\n');
          } else if (/^Get-FileHash$/i.test(cmd)) {
            current = [{ Path:artifacts.droppedFile.path, Algorithm:'SHA256', Hash:window.MISSION_NEXT_NIGHT_SHIFT_COMMON.sha256Hex(artifacts.droppedFile.path + facts.identity.sourceIp) }]; source = 'hash';
          } else if (/^Get-AuthenticodeSignature$/i.test(cmd)) {
            current = [{ Path:artifacts.droppedFile.path, Status:artifacts.droppedFile.signerStatus === 'Unverified' ? 'NotSigned' : artifacts.droppedFile.signerStatus, SignerCertificate:'None' }]; source = 'signature';
          } else throw new Error(`Unsupported PowerShell command: ${cmd}`);
        }
        current = current || [];
        state.lastRows = clone(current);
        const ids = current.map(row => row.Id);
        if (source === 'events' && current.some(row => row.LogonType === 10 && row.TargetUserName === facts.identity.account && row.IpAddress === facts.identity.sourceIp)) state.observations.rdp = true;
        if (source === 'events' && current.some(row => row.ParentImage && /services\.exe/i.test(row.ParentImage))) state.observations.process = true;
        if (source === 'tasks' && current.length) state.observations.task = true;
        if (source === 'run' && current.length) state.observations.run = true;
        if (source === 'processes' && current.length) state.observations.processTree = true;
        if (source === 'hash' && current.length) state.observations.hash = true;
        if (source === 'connections' && current.some(row => row.State === 'Established' && row.RemoteAddress === artifacts.beacon.remoteAddress)) state.observations.beacon = true;
        const output = current.length ? current.map(row => Object.entries(row).map(([k,v]) => `${k}: ${v}`).join('  ')).join('\n') + '\n' : '';
        return { stdout: output, stderr:'', exitCode:0, observed: clone(state.observations), savedFiles: clone(state.exports), objects: clone(current) };
      } catch (error) { return { stdout:'', stderr:`PowerShell error: ${error.message}\n`, exitCode:1 }; }
    }
    function check(name, submission) {
      const checks = { logon:'rdp', process:'process', processTree:'processTree', persistence:'task', run:'run', hash:'hash', beacon:'beacon' };
      if (checks[name] && state.observations[checks[name]]) return { ok:true };
      if (name === 'handoff') {
        const note = String(submission || '').toLowerCase();
        const required = ['containment','request','scope','evidence'];
        if (required.every(word => note.includes(word)) && note.includes(facts.identity.account) && note.includes(facts.identity.sourceIp)) return { ok:true };
        return { ok:false, reason:'Include the observed identity and source, preserved evidence, containment request, and your scope boundary.' };
      }
      if (name === 'logonDetails') {
        const text = String(submission || '').toLowerCase();
        return text.includes(facts.identity.account.toLowerCase()) && text.includes(facts.identity.sourceIp) ? { ok:true } : { ok:false, reason:'Use the identity and source IP from the successful type 10 event.' };
      }
      if (name === 'hashAssessment') {
        const text = String(submission || '').toLowerCase();
        return /unknown|unverified/.test(text) && /prevalence/.test(text) && /not proof|does not prove|alone/.test(text) ? { ok:true } : { ok:false, reason:'State that signer status and prevalence are unknown, and that the hash alone is not proof.' };
      }
      return { ok:false, reason:'The required fixture-derived state has not been observed yet.' };
    }
    return { fixture, state, run, check, getFs: () => ({}) };
  }
  window.MISSION_NEXT_POWERSHELL_TRIAGE = { create };
})();
