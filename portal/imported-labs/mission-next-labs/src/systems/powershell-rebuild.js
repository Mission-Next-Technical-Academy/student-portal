// Isolated, browser-only response and rebuild simulation. No host/cloud APIs run.
(function () {
  const clone = x => JSON.parse(JSON.stringify(x));
  const clean = x => String(x == null ? '' : x).replace(/^['"]|['"]$/g, '');
  const normalize = x => String(x || '').replace(/\\/g, '/').toLowerCase();
  function tokenize(text) {
    const out = []; let token = '', quote = '', depth = 0;
    for (const ch of String(text || '')) {
      if (quote) { token += ch; if (ch === quote) quote = ''; continue; }
      if (ch === '"' || ch === "'") { quote = ch; token += ch; continue; }
      if (ch === '{') depth++;
      if (ch === '}') depth--;
      if (/\s/.test(ch) && depth <= 0) { if (token) out.push(token); token = ''; } else token += ch;
    }
    if (token) out.push(token);
    return out;
  }
  function hasLiteralPassword(script) {
    const pattern=/(?:\$[\w:]*(?:password|passwd|pass|pw|pwd|secret|token|apikey|credential|cred)[\w:]*\s*=\s*|(?<![\w$])-(?:[\w-]*(?:password|passwd|pass|pw|secret|token|apikey|credential)[\w-]*|asplaintext)\s+)(?:"([^"\r\n]*)"|'([^'\r\n]*)'|([^\s;]+))/ig;
    let match; while((match=pattern.exec(String(script)))) {
      const value=match[1] ?? match[2] ?? match[3] ?? '';
      if (/^\$/.test(value) || /^(?:Get-Credential|Get-AzKeyVaultSecret|Get-Secret)$/i.test(value)) continue;
      return true;
    }
    return false;
  }
  function create(context = {}) {
    const fixture = window.MISSION_NEXT_NIGHT_SHIFT_COMMON.fixtureFor({ ...context, labId: context.labId || 'sa-7' });
    const facts = fixture.truth, resources = facts.resources, windows = fixture.artifacts.windows;
    const envVars = {
      APPROVED_IMAGE: resources.windowsApprovedImage, RECOVERY_VNET: resources.recoveryVnet,
      RECOVERY_SUBNET: resources.recoverySubnet, RECOVERY_NSG: resources.approvedRecoveryNsg,
      MANAGEMENT_SUBNET: resources.managementSubnet, BASELINE: resources.windowsBaseline,
      MONITORING_EXTENSION: resources.monitoringExtension, WORKSPACE: resources.siemWorkspace,
      INCIDENT_ID: resources.incidentId, RESOURCE_GROUP: 'IR-Recovery', LOCATION: 'training-region',
    };
    const state = {
      ticketViewed:false, accountDisabled:false, sessionsRevoked:false, firewallRules:[], exportedLogs:{}, fileHashes:{}, custody:[],
      scheduledTaskPresent:true, runKeyPresent:true, scheduledTaskVerifiedRemoved:false, runKeyVerifiedRemoved:false,
      vms:{}, vmCreateCount:0, scriptRuns:0, scriptSaved:'', scriptContainsSecret:false, lastRunError:'', scriptSuccessful:false, scriptProvisioningObserved:false,
      hashCalculated:false, custodyExported:false, rebuildChecks:{}, heartbeatRows:[], lastVMQuery:null,
    };
    function param(args, name) {
      const key = Object.keys(args || {}).find(k => k.toLowerCase() === name.toLowerCase());
      return key == null ? undefined : args[key];
    }
    function parseArgs(rest, vars) {
      const tokens = tokenize(rest), args = { _args:[] };
      for (let i=0;i<tokens.length;i++) {
        const token = tokens[i];
        if (!token.startsWith('-')) { args._args.push(resolve(token,vars)); continue; }
        const name = token.slice(1), next = tokens[i+1];
        if (next == null || next.startsWith('-')) { args[name] = true; continue; }
        i++;
        let value = clean(next);
        if (/^\$env:/i.test(value)) value = envVars[value.slice(5).toUpperCase()];
        else if (/^\$[\w]+$/.test(value)) value = vars[value.slice(1)];
        else if (value.toLowerCase() === '$null') value = null;
        else if (/^@\{.*\}$/.test(value)) {
          const body = value.slice(2,-1), tags = {};
          body.split(/[;,]/).forEach(pair => { const m=/^\s*([\w-]+)\s*=\s*(.*?)\s*$/.exec(pair); if(m) tags[m[1]]=resolve(m[2],vars); });
          value = tags;
        } else if (/^\d+$/.test(value)) value = Number(value);
        args[name] = value;
      }
      return args;
    }
    function resolve(expression, vars) {
      const expr = String(expression || '').trim();
      if (/^\$env:/i.test(expr)) return envVars[expr.slice(5).toUpperCase()];
      if (/^\$null$/i.test(expr)) return null;
      if (/^\$[\w]+$/.test(expr)) return vars[expr.slice(1)];
      if (/^@\(.*\)$/.test(expr)) return expr.slice(2,-1).split(',').map(x => resolve(clean(x),vars));
      if (/^@\{.*\}$/.test(expr)) {
        const result={}; expr.slice(2,-1).split(/[;,]/).forEach(pair => { const m=/^\s*([\w-]+)\s*=\s*(.*?)\s*$/.exec(pair); if(m) result[m[1]]=resolve(m[2],vars); }); return result;
      }
      if (/^(['"]).*\1$/.test(expr)) return expr.slice(1,-1);
      if (/^-?\d+$/.test(expr)) return Number(expr);
      return expr;
    }
    function invoke(line, vars, options = {}) {
      const source = String(line).trim();
      if (!source) return { value:null, stdout:'' };
      if (/^Get-IRTicket$/i.test(source)) { state.ticketViewed=true; return { value:clone({ account:facts.identity.account, host:resources.windowsHost, approvedImage:resources.windowsApprovedImage, vnet:resources.recoveryVnet, subnet:resources.recoverySubnet, nsg:resources.approvedRecoveryNsg, managementSubnet:resources.managementSubnet, baseline:resources.windowsBaseline, extension:resources.monitoringExtension, workspace:resources.siemWorkspace, incidentId:resources.incidentId }), stdout:`Incident identity: ${facts.identity.account}\nJump host: ${resources.windowsHost}\nIncident ID: ${resources.incidentId}\nApproved image: ${resources.windowsApprovedImage}\nRecovery VNet/subnet: ${resources.recoveryVnet} / ${resources.recoverySubnet}\nRecovery NSG: ${resources.approvedRecoveryNsg}\nManagement subnet: ${resources.managementSubnet}\nBaseline: ${resources.windowsBaseline}\nMonitoring extension: ${resources.monitoringExtension}\nSIEM workspace: ${resources.siemWorkspace}\nPersistence task: ${windows.scheduledTask.path}\nRun key: ${windows.runKey.path}\nRead the complete ticket before response actions.\n` }; }
      if (/^Get-Credential$/i.test(source)) return {value:{kind:'simulated-credential-prompt',secret:null},stdout:'Credential prompt simulated; no password was stored.\n'};
      if (/^Get-AzKeyVaultSecret\b/i.test(source)) return {value:{kind:'simulated-key-vault-reference',secret:null},stdout:'Key Vault secret reference simulated; secret material is not exposed.\n'};
      const requireTicket=()=>{ if(!state.ticketViewed) throw new Error('Read the response ticket before taking action.'); };
      const parts=tokenize(source), cmd=parts.shift() || '', rest=source.slice(cmd.length).trim(), args=parseArgs(rest,vars);
      if (/^Disable-ADAccount$/i.test(cmd)) {
        requireTicket();
        if (String(param(args,'Identity') || '').toLowerCase() !== facts.identity.account.toLowerCase()) throw new Error('The ticket only authorizes disabling the incident account.');
        state.accountDisabled=true; return { value:true, stdout:'Simulated directory account disabled.\n' };
      }
      if (/^Revoke-MgUserSignInSession$/i.test(cmd)) {
        requireTicket();
        if (String(param(args,'UserId') || '').toLowerCase() !== facts.identity.account.toLowerCase()) throw new Error('Session revocation target does not match the incident identity.');
        state.sessionsRevoked=true; return { value:true, stdout:'Simulated sign-in sessions revoked.\n' };
      }
      if (/^New-NetFirewallRule$/i.test(cmd)) {
        requireTicket();
        const direction=param(args,'Direction'), action=param(args,'Action'), remote=param(args,'RemoteAddress'), ports=param(args,'LocalPort');
        if (String(direction).toLowerCase() !== 'inbound' || String(action).toLowerCase() !== 'allow' || normalize(remote) !== normalize(resources.managementSubnet)) throw new Error('Allow rules must be inbound and limited to the ticket management subnet.');
        const list=Array.isArray(ports) ? ports : String(ports || '').split(',').map(Number);
        list.forEach(port => state.firewallRules.push({ remoteAddress:remote, port:Number(port), action:'Allow', direction:'Inbound' }));
        return { value:true, stdout:`Simulated inbound allow rule for ${list.join(', ')}.\n` };
      }
      if (/^wevtutil$/i.test(cmd) && /^epl\s+/i.test(rest)) {
        requireTicket();
        const words=tokenize(rest), logName=words[1], target=clean(words[2] || '');
        if (logName !== 'Security' || !target) throw new Error('Supported export: wevtutil epl Security <destination.evtx>');
        state.exportedLogs[target]=clone(windows.securityEvents); return { value:target, stdout:`Event log exported to ${target}.\n` };
      }
      if (/^Get-FileHash$/i.test(cmd)) {
        const path=String(param(args,'LiteralPath') || param(args,'Path') || param(args,'InputObject') || args._args[0] || '');
        if (!state.exportedLogs[path]) throw new Error('Hash only an exported incident log.');
        const record={ Path:path, Algorithm:'SHA256', Hash:window.MISSION_NEXT_NIGHT_SHIFT_COMMON.sha256Hex(JSON.stringify(state.exportedLogs[path])) };
        state.fileHashes[path]=record; state.hashCalculated=true; return { value:record, stdout:`Algorithm : SHA256\nHash      : ${record.Hash}\nPath      : ${record.Path}\n` };
      }
      if (/^Export-Csv$/i.test(cmd)) {
        const target=String(param(args,'Path') || ''), item=String(param(args,'InputObject') || '');
        const input=param(args,'InputObject');
        if (/custody\.csv$/i.test(target) && state.hashCalculated && input && input.Hash) {
          state.custody=[{ item:Object.keys(state.fileHashes)[0], sha256:Object.values(state.fileHashes)[0].Hash, time:'2026-09-30T12:00:00Z', handler:'analyst', reason:'incident collection' }];
          state.custodyExported=true; return { value:target, stdout:`Custody record exported to ${target}.\n` };
        }
        if (!target) throw new Error('Export-Csv requires -Path.');
        throw new Error('No supported object is available for this export.');
      }
      if (/^Unregister-ScheduledTask$/i.test(cmd)) {
        requireTicket();
        if(!state.custodyExported) throw new Error('Preserve the event log and custody record before removing persistence.');
        const name=String(param(args,'TaskName') || '');
        if (!name || !windows.scheduledTask.path.toLowerCase().includes(name.toLowerCase())) throw new Error('Ticket scope permits only the incident scheduled task.');
        state.scheduledTaskPresent=false; return { value:true, stdout:'Incident scheduled task removed in simulation.\n' };
      }
      if (/^Remove-ItemProperty$/i.test(cmd)) {
        requireTicket();
        if(!state.custodyExported) throw new Error('Preserve the event log and custody record before removing persistence.');
        const path=String(param(args,'Path') || ''), name=String(param(args,'Name') || '');
        if (!/CurrentVersion\\Run/i.test(path) || !windows.runKey.path.toLowerCase().endsWith(name.toLowerCase())) throw new Error('Ticket scope permits only the incident Run-key value.');
        state.runKeyPresent=false; return { value:true, stdout:'Incident Run-key value removed in simulation.\n' };
      }
      if (/^Get-ScheduledTask$/i.test(cmd)) {
        state.scheduledTaskVerifiedRemoved=!state.scheduledTaskPresent;
        return { value:state.scheduledTaskPresent ? clone(windows.scheduledTask) : null, stdout:state.scheduledTaskPresent ? `${windows.scheduledTask.path} ${windows.scheduledTask.action}\n` : 'No matching incident task remains.\n' };
      }
      if (/^Get-ItemProperty$/i.test(cmd)) {
        state.runKeyVerifiedRemoved=!state.runKeyPresent;
        return { value:state.runKeyPresent ? clone(windows.runKey) : null, stdout:state.runKeyPresent ? `${windows.runKey.path} = ${windows.runKey.value}\n` : 'Incident Run-key value is absent.\n' };
      }
      if (/^New-AzVM$/i.test(cmd)) {
        requireTicket();
        if(!state.accountDisabled || !state.sessionsRevoked || !check('isolation').ok || !state.custodyExported || state.scheduledTaskPresent || state.runKeyPresent || !state.scheduledTaskVerifiedRemoved || !state.runKeyVerifiedRemoved) throw new Error('Complete ticketed containment, isolated firewall rules, collection and verified persistence removal before recovery.');
        const name=String(param(args,'Name') || ''); if (!name) throw new Error('New-AzVM requires -Name.');
        state.scriptProvisioningObserved=true;
        if (state.vms[name]) return { value:state.vms[name], stdout:`VM ${name} already exists; reusing it.\n` };
        if (Object.keys(args).some(key=>/disk|snapshot/i.test(key)) || Object.values(args).some(value=>typeof value==='string' && [resources.rogueDisk,resources.snapshot,'compromised'].some(bad=>normalize(value).includes(normalize(bad))))) throw new Error('The replacement must use the approved golden image, never a compromised disk or snapshot.');
        const tag=param(args,'Tag') || {};
        const vm={ name, image:param(args,'Image'), vnet:param(args,'VirtualNetworkName'), subnet:param(args,'SubnetName'), nsg:param(args,'SecurityGroupName'), publicIp:!Object.keys(args).some(k=>k.toLowerCase()==='publicipaddressname') || !!param(args,'PublicIpAddressName'), tags:typeof tag === 'object' ? tag : {}, baseline:false, monitoringExtension:false, diagnosticWorkspace:null, heartbeat:false, extraInboundRules:[] };
        vm.inboundRules = normalize(vm.nsg) === normalize(resources.approvedRecoveryNsg) ? [22,3389].map(port => ({ remoteAddress:resources.managementSubnet, port, action:'Allow', direction:'Inbound' })) : [];
        state.vms[name]=vm; state.vmCreateCount++; return { value:vm, stdout:`Simulated VM ${name} provisioned.\n` };
      }
      if (/^Start-DscConfiguration$/i.test(cmd)) {
        const path=String(param(args,'Path') || '');
        if (!/baseline|hardening/i.test(path) || !Object.keys(state.vms).length) throw new Error('Apply a named baseline to a simulated replacement VM.');
        Object.values(state.vms).forEach(vm => { vm.baseline=true; vm.baselineName=resources.windowsBaseline; });
        return { value:true, stdout:'Approved SOC jump-host baseline applied.\n' };
      }
      if (/^Set-AzVMExtension$/i.test(cmd)) {
        const vm=state.vms[String(param(args,'VMName') || '')];
        if (!vm) throw new Error('Create the replacement VM before adding its monitoring agent.');
        vm.monitoringExtension=String(param(args,'Name') || param(args,'ExtensionType') || '') === resources.monitoringExtension;
        return { value:true, stdout:'Simulated VM extension configured.\n' };
      }
      if (/^Set-AzDiagnosticSetting$/i.test(cmd)) {
        const vm=state.vms[String(param(args,'VMName') || '')], workspace=param(args,'WorkspaceId') || param(args,'WorkspaceName');
        if (!vm) throw new Error('Create the replacement VM before configuring diagnostics.');
        vm.diagnosticWorkspace=workspace; return { value:true, stdout:'Diagnostic setting configured.\n' };
      }
      if (/^Get-AzVM$/i.test(cmd)) {
        const vm=state.vms[String(param(args,'Name') || '')] || Object.values(state.vms)[0] || null;
        state.lastVMQuery=vm ? vm.name : null;
        if (vm && state.scriptRuns && vm.image===resources.windowsApprovedImage && vm.baseline && vm.monitoringExtension && vm.diagnosticWorkspace===resources.siemWorkspace && vm.tags.IncidentId===resources.incidentId && !vm.publicIp && vm.vnet===resources.recoveryVnet && vm.subnet===resources.recoverySubnet && vm.nsg===resources.approvedRecoveryNsg) state.rebuildChecks.vmQueried=true;
        return { value:vm, stdout:vm ? `Name: ${vm.name}\nImage: ${vm.image}\nNetwork: ${vm.vnet}/${vm.subnet}\nNSG: ${vm.nsg}\n` : 'VM not found.\n' };
      }
      if (/^Get-AzOperationalInsightsSearchResult$/i.test(cmd)) {
        const vm=Object.values(state.vms).find(candidate => candidate.name === String(param(args,'Computer') || param(args,'VMName') || '')) || Object.values(state.vms)[0];
        const workspace=param(args,'WorkspaceId') || param(args,'WorkspaceName'), query=String(param(args,'Query') || '');
        if (vm && vm.name === String(param(args,'Computer') || param(args,'VMName') || '') && vm.monitoringExtension && vm.diagnosticWorkspace === resources.siemWorkspace && workspace === resources.siemWorkspace && /\bHeartbeat\b/i.test(query)) {
          vm.heartbeat=true; state.heartbeatRows.push({ Computer:vm.name, Workspace:workspace, TimeGenerated:fixture.truth.timeline.heartbeat });
          state.rebuildChecks.heartbeatQueried=true;
        }
        return { value:clone(state.heartbeatRows), stdout:state.heartbeatRows.length ? `${state.heartbeatRows.map(row => `Computer: ${row.Computer} Workspace: ${row.Workspace} TimeGenerated: ${row.TimeGenerated}`).join('\n')}\n` : 'No Heartbeat rows found.\n' };
      }
      if (/^Write-Output$/i.test(cmd)) {
        const text=resolve(rest,vars), saysSuccess=/verified|ready|success|complete/i.test(String(text || ''));
        if(saysSuccess && (!state.rebuildChecks.vmQueried || !state.rebuildChecks.heartbeatQueried)) state.rebuildChecks.successBeforeVerification=true;
        return { value:text, stdout:`${text == null ? '' : text}\n` };
      }
      throw new Error(`Unsupported simulated PowerShell command: ${cmd}`);
    }
    function check(name, submission) {
      const vms=Object.values(state.vms), vm=vms[0];
      if (name === 'ticket') return state.ticketViewed ? {ok:true} : {ok:false,reason:'Read the authorized IR ticket first.'};
      if (name === 'containment') return state.accountDisabled && state.sessionsRevoked ? {ok:true} : {ok:false,reason:'Disable the incident account and revoke its sign-in sessions.'};
      if (name === 'isolation') {
        const valid=state.firewallRules.length===2 && [22,3389].every(port => state.firewallRules.filter(rule => rule.port===port && normalize(rule.remoteAddress)===normalize(resources.managementSubnet) && rule.action==='Allow' && rule.direction==='Inbound').length===1);
        return valid ? {ok:true} : {ok:false,reason:'Allow only the management subnet to reach ports 22 and 3389.'};
      }
      if (name === 'collection') return Object.keys(state.exportedLogs).length>0 && state.custodyExported ? {ok:true} : {ok:false,reason:'Export the Security log, hash the exported file, and write its custody CSV record.'};
      if (name === 'eradication') return !state.scheduledTaskPresent && !state.runKeyPresent && state.scheduledTaskVerifiedRemoved && state.runKeyVerifiedRemoved ? {ok:true} : {ok:false,reason:'Remove and verify both incident persistence entries.'};
      if (name === 'secretFree') return state.scriptRuns>0 && state.scriptSuccessful && state.scriptProvisioningObserved && !state.scriptContainsSecret ? {ok:true} : {ok:false,reason:'Run a rebuild script that provisions the replacement VM without literal passwords. Use Get-Credential or a Key Vault reference.'};
      if (name === 'rebuild') {
        const rules=vm && vm.inboundRules || [];
        const networkSafe=vm && !vm.publicIp && vm.vnet===resources.recoveryVnet && vm.subnet===resources.recoverySubnet && vm.nsg===resources.approvedRecoveryNsg && rules.length===2 && [22,3389].every(port => rules.some(rule => rule.port===port && normalize(rule.remoteAddress)===normalize(resources.managementSubnet)));
        const checks=vm && state.scriptSuccessful && !state.scriptContainsSecret && state.vmCreateCount===1 && !state.rebuildChecks.successBeforeVerification && vm.image===resources.windowsApprovedImage && vm.baseline && vm.monitoringExtension && vm.diagnosticWorkspace===resources.siemWorkspace && vm.heartbeat && vm.tags.IncidentId===resources.incidentId && networkSafe && state.rebuildChecks.vmQueried && state.rebuildChecks.heartbeatQueried;
        return checks ? {ok:true} : {ok:false,reason:'Run a script that builds from the approved image on the isolated network, applies baseline and monitoring, tags the incident, verifies VM state and produces Heartbeat.'};
      }
      if (name === 'postIncident') {
        const note=String(submission || '').toLowerCase();
        return ['credential','persistence','containment','detection'].every(token=>note.includes(token)) ? {ok:true} : {ok:false,reason:'Document the credential root cause, persistence, containment action and a detection improvement.'};
      }
      return {ok:false,reason:'Unknown rebuild check.'};
    }
    function runCommand(line) {
      const original=String(line || '');
      try {
        const parts=original.split('|').map(x=>x.trim()); let result=null;
        for (const part of parts) {
          if (/^Get-FileHash\b/i.test(part)) result=invoke(part,{});
          else if (/^Export-Csv\b/i.test(part)) {
            const path=/\-Path\s+([^\s]+)/i.exec(part);
            if (!path || !result || !result.value || !result.value.Hash) throw new Error('Export a hash object to the custody CSV after hashing an exported log.');
            const filename=clean(path[1]); state.custody=[{item:result.value.Path,sha256:result.value.Hash,handler:'analyst',reason:'incident collection'}];
            state.custodyExported=/custody\.csv$/i.test(filename); result={value:filename,stdout:`Custody record exported to ${filename}.\n`};
          } else result=invoke(part,{});
        }
        return { stdout:result && result.stdout || '', stderr:'', exitCode:0, observed:clone(state), savedFiles:clone(state.exportedLogs) };
      } catch(error) { return {stdout:'',stderr:`PowerShell error: ${error.message}\n`,exitCode:1,observed:clone(state)}; }
    }
    function resolveValue(value, vars) {
      if (typeof value !== 'string') return value;
      return value.replace(/\$env:([A-Za-z_][\w]*)|\$([A-Za-z_]\w*)/g,(all,envName,varName)=>{
        if(envName) return envVars[envName.toUpperCase()] == null ? '' : String(envVars[envName.toUpperCase()]);
        const resolved=vars[varName]; return resolved == null ? '' : String(resolved);
      }).replace(/\$null/ig,'');
    }
    function runScript(script) {
      const source=String(script || ''); state.scriptSaved=source; state.scriptRuns++; state.scriptContainsSecret=hasLiteralPassword(source); state.lastRunError=''; state.scriptSuccessful=false; state.scriptProvisioningObserved=false; state.rebuildChecks={vmQueried:false,heartbeatQueried:false,successBeforeVerification:false};
      if(state.scriptContainsSecret) { state.lastRunError='Literal password detected.'; return {stdout:'',stderr:'Security error: do not hard-code passwords. Use Get-Credential or a Key Vault reference.\n',exitCode:1,observed:clone(state)}; }
      const lines=source.split(/\r?\n/).map(x=>x.trim()).filter(x=>x && !x.startsWith('#'));
      const vars={}; let output=''; let index=0;
      function block() {
        const statements=[];
        while(index<lines.length && lines[index]!=='}') {
          const line=lines[index++];
          if(/^if\s*\(/i.test(line) && line.endsWith('{')) {
            const condition=/^if\s*\((.*)\)\s*\{$/i.exec(line)?.[1]; if(!condition) throw new Error(`Unsupported if syntax: ${line}`);
            const body=block(); if(lines[index]!=='}') throw new Error('Unclosed if block.'); index++;
            let alternate=[]; if(/^else\s*\{$/i.test(lines[index] || '')) { index++; alternate=block(); if(lines[index]!=='}') throw new Error('Unclosed else block.'); index++; }
            statements.push({type:'if',condition,body,alternate});
          } else if(/^foreach\s*\(/i.test(line) && line.endsWith('{')) {
            const m=/^foreach\s*\(\$([\w]+)\s+in\s+(.+)\)\s*\{$/i.exec(line); if(!m) throw new Error(`Unsupported foreach syntax: ${line}`);
            const body=block(); if(lines[index]!=='}') throw new Error('Unclosed foreach block.'); index++; statements.push({type:'foreach',name:m[1],items:m[2],body});
          } else if(/^for\s*\(/i.test(line) && line.endsWith('{')) {
            const m=/^for\s*\(\$([\w]+)\s*=\s*(\d+)\s*;\s*\$\1\s+-lt\s+(\d+)\s*;\s*\$\1\+\+\)\s*\{$/i.exec(line); if(!m) throw new Error(`Unsupported for syntax: ${line}`);
            const body=block(); if(lines[index]!=='}') throw new Error('Unclosed for block.'); index++; statements.push({type:'for',name:m[1],start:Number(m[2]),end:Number(m[3]),body});
          } else if(line==='{' || /^else\b/i.test(line)) throw new Error(`Unsupported block syntax: ${line}`);
          else statements.push({type:'line',line});
        }
        return statements;
      }
      function conditionTrue(expression) {
        const m=/^\$null\s+-eq\s+\$([\w]+)$/i.exec(expression.trim());
        if(m) return vars[m[1]] == null;
        const truth=/^\$([\w]+)$/i.exec(expression.trim()); if(truth) return !!vars[truth[1]];
        const compare=/^\$([\w]+)\s+(-eq|-ne)\s+(.+)$/i.exec(expression.trim());
        if(compare) { const left=vars[compare[1]], right=resolve(compare[3],vars); return compare[2].toLowerCase()==='-eq' ? String(left)===String(right) : String(left)!==String(right); }
        throw new Error(`Unsupported if condition: ${expression}`);
      }
      function execute(statements) {
        for(const item of statements) {
          if(item.type==='if') { execute(conditionTrue(item.condition) ? item.body : item.alternate); continue; }
          if(item.type==='foreach') { const values=resolve(item.items,vars); if(!Array.isArray(values)) throw new Error('foreach input must be an array.'); for(const value of values) { vars[item.name]=value; execute(item.body); } continue; }
          if(item.type==='for') { for(let i=item.start;i<item.end;i++) { vars[item.name]=i; execute(item.body); } continue; }
          const assign=/^\$([\w]+)\s*=\s*(.+)$/.exec(item.line);
          if(assign) {
            const [,name,expr]=assign;
            if(/^(?:Get-AzVM|New-AzVM|Get-AzOperationalInsightsSearchResult|Get-Credential|Get-AzKeyVaultSecret)\b/i.test(expr)) { const result=invoke(expr,vars); vars[name]=result.value; output+=result.stdout; continue; }
            vars[name]=resolve(expr,vars); continue;
          }
          const result=invoke(item.line,vars);
          output+=result.stdout;
        }
      }
      try {
        const statements=block(); if(index<lines.length) throw new Error(`Unexpected token: ${lines[index]}`);
        execute(statements);
        state.scriptSaved=source; state.scriptSuccessful=true;
        return {stdout:output,stderr:'',exitCode:0,observed:clone(state),savedFiles:{'Rebuild-JumpHost.ps1':source}};
      } catch(error) {
        state.lastRunError=error.message; state.scriptSuccessful=false;
        return {stdout:output,stderr:`PowerShell script error: ${error.message}\n`,exitCode:1,observed:clone(state)};
      }
    }
    return { fixture, state, runCommand, runScript, check, snapshot:()=>clone(state), restore(saved){ if(saved) Object.assign(state,clone(saved)); }, envVars:clone(envVars) };
  }
  window.MISSION_NEXT_POWERSHELL_REBUILD={create,hasLiteralPassword};
})();
