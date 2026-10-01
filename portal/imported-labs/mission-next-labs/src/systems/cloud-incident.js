// Fictional, browser-only Azure Cloud Shell incident simulation.
(function () {
  const clone = value => JSON.parse(JSON.stringify(value));
  const clean = value => String(value || '').trim().replace(/^['"]|['"]$/g, '');
  function create(context = {}) {
    const fixture = window.MISSION_NEXT_NIGHT_SHIFT_COMMON.fixtureFor({ ...context, labId: context.labId || 'sa-8' });
    const { truth } = fixture;
    const resources = truth.resources;
    const cloud = fixture.artifacts.cloud;
    const state = { queries:[], scoped:false, accountDisabled:false, sessionsRevoked:false, nsgContained:false, snapshotCreated:false, snapshotVerified:false, vmDeleted:false, roleRemoved:false, recovery:null, script:'', scriptRuns:0, queryHeartbeat:false, files:{'ir-ticket.txt':`IR ticket ${resources.incidentId}\nAuthorized: contain the incident identity, preserve and verify a disk snapshot before deleting the rogue VM, remove the unauthorized role assignment, and rebuild from the approved image.\n` } };
    const facts = { account:truth.identity.account, actor:truth.identity.principal, sourceIp:truth.identity.sourceIp, subscription:truth.resources.subscription, vm:resources.vm, disk:resources.rogueDisk, nsg:resources.nsg, snapshot:resources.snapshot, approvedImage:resources.approvedImage, workspace:resources.siemWorkspace, recoveryNsg:resources.approvedRecoveryNsg, recoveryVnet:resources.recoveryVnet, recoverySubnet:resources.recoverySubnet, managementSubnet:resources.managementSubnet, recoveryVm:resources.recoveryVm, incidentId:resources.incidentId };
    const sourceTables = {
      SigninLogs: clone(cloud.signIns),
      AzureActivity: clone(cloud.activity),
      Heartbeat: [],
    };
    function query(raw) {
      sourceTables.Heartbeat=state.recovery&&state.recovery.verified&&state.recovery.monitoringAgent==='AzureMonitorLinuxAgent'&&state.recovery.diagnosticsWorkspace===facts.workspace?clone(cloud.activity.filter(x=>x.operation==='Microsoft.Insights/Heartbeat')):[];
      const engine=window.MISSION_NEXT_SHARED_KQL;
      if(!engine||typeof engine.evaluate!=='function')throw new Error('Shared Log Analytics query engine is unavailable.');
      const result=engine.evaluate(raw,sourceTables);
      if(result.error)throw new Error(result.error);
      const source=/^\s*(?:let\s+\w+\s*=\s*)?([A-Za-z_]\w*)/i.exec(raw);
      const table=source?source[1]:'query';
      const rows=result.rows||[];
      state.queries.push({table, query:raw, count:rows.length, rows:clone(rows)});
      return rows;
    }
    function runCommand(command) {
      const line=String(command||'').trim();
      try {
        let m=/^az\s+monitor\s+log-analytics\s+query\s+-w\s+(\S+)\s+--analytics-query\s+(["'])([\s\S]*)\2$/i.exec(line);
        if(m){const rows=query(m[3]);if(/^\s*Heartbeat\b/i.test(m[3]))state.queryHeartbeat=rows.some(r=>r.resource===facts.recoveryVm&&r.workspace===facts.workspace);return result(JSON.stringify(rows,null,2),{lastQuery:m[3],queryRows:rows,heartbeat:state.queryHeartbeat});}
        if(/^cat\s+.*ir-ticket\.txt$/i.test(line)){state.ticketViewed=true;return result(state.files['ir-ticket.txt'],{ticketViewed:true});}
        m=/^az\s+resource\s+list\b|^az\s+vm\s+list\b|^az\s+network\s+nsg\s+rule\s+list\b/i.exec(line);
        if(m){state.scoped=true;return result(JSON.stringify({vm:cloud.vm,nsg:cloud.activity.filter(x=>x.operation.includes('securityRules/write')),roleAssignment:cloud.activity.find(x=>x.operation.includes('roleAssignments/write'))},null,2),{scoped:true});}
        if(/^az\s+ad\s+user\s+update\s+--id\s+/i.test(line)){if(!line.toLowerCase().includes(facts.actor.toLowerCase())&&!line.toLowerCase().includes(facts.account.toLowerCase()))throw Error('Only the ticketed incident identity is in scope.');state.accountDisabled=true;return result('Simulated identity disabled.\n',{accountDisabled:true});}
        if(/^az\s+ad\s+user\s+revoke-sign-in-sessions\s+--id\s+/i.test(line)){if(!line.toLowerCase().includes(facts.actor.toLowerCase())&&!line.toLowerCase().includes(facts.account.toLowerCase()))throw Error('Only the ticketed incident identity is in scope.');state.sessionsRevoked=true;return result('Simulated sessions revoked.\n',{sessionsRevoked:true});}
        if(/^az\s+network\s+nsg\s+rule\s+delete\b/i.test(line)){if(!line.toLowerCase().includes(facts.nsg.toLowerCase()))throw Error('Target the ticketed rogue NSG.');state.nsgContained=true;return result('Simulated internet-exposed NSG rule removed.\n',{nsgContained:true});}
        if(/^az\s+snapshot\s+create\b/i.test(line)){if(state.vmDeleted)throw Error('The rogue VM was already deleted.');if(!line.toLowerCase().includes(facts.disk.toLowerCase()))throw Error('Snapshot the rogue VM OS disk identified in the ticket.');state.snapshotCreated=true;return result(`Snapshot ${facts.snapshot} created from ${facts.disk}.\n`,{snapshotCreated:true});}
        if(/^az\s+snapshot\s+show\b/i.test(line)){if(!state.snapshotCreated)throw Error('Create the snapshot before verifying it.');if(!line.toLowerCase().includes(facts.snapshot.toLowerCase()))throw Error('Verify the snapshot created for this incident.');state.snapshotVerified=true;return result('Snapshot provisioningState: Succeeded; source disk verified.\n',{snapshotVerified:true});}
        if(/^az\s+vm\s+deallocate\b|^az\s+vm\s+delete\b/i.test(line)){if(!state.snapshotVerified)throw Error('Verify the forensic snapshot before deallocating or deleting the VM.');state.vmDeleted=true;return result('Simulated rogue VM removed after verified snapshot.\n',{vmDeleted:true});}
        if(/^az\s+role\s+assignment\s+delete\b/i.test(line)){if(!line.toLowerCase().includes(facts.actor.toLowerCase())&&!line.toLowerCase().includes('contributor'))throw Error('Remove only the unauthorized incident role assignment.');state.roleRemoved=true;return result('Simulated unauthorized role assignment removed.\n',{roleRemoved:true});}
        if(/^az\s+vm\s+show\b/i.test(line)){if(!state.recovery)throw Error('No replacement VM exists to verify.');if(!state.recovery.monitoringAgent||state.recovery.diagnosticsWorkspace!==facts.workspace||state.recovery.incidentTag!==facts.incidentId)throw Error('VM verification failed: monitoring, SIEM diagnostics and incident tag must be configured first.');state.recovery.workspace=facts.workspace;state.recovery.verified=true;return result(JSON.stringify(state.recovery,null,2),{recovery:clone(state.recovery)});}
        if(/^az\s+monitor\s+log-analytics\s+query\b/i.test(line) && /Heartbeat/i.test(line)){const rows=query(/--analytics-query\s+["']([\s\S]*)["']/.exec(line)?.[1]||'Heartbeat');state.queryHeartbeat=rows.some(r=>r.resource===facts.recoveryVm&&r.workspace===facts.workspace);return result(JSON.stringify(rows,null,2),{heartbeat:state.queryHeartbeat});}
        return {stdout:'',stderr:`bash: unsupported command: ${line.split(/\s/)[0]||'(empty)'}\n`,exitCode:127,observed:{cloudIncident:clone(state)}};
      } catch(error){return {stdout:'',stderr:`az: ${error.message}\n`,exitCode:1,observed:{cloudIncident:clone(state)}};}
      function result(stdout,extra={}){return {stdout,stderr:'',exitCode:0,observed:{cloudIncident:clone(state),...extra}};}
    }
    function shellWords(text) {
      const words=[];let word='',quote='',started=false;
      for(const ch of String(text||'')){
        if(quote){if(ch===quote)quote='';else word+=ch;continue;}
        if(ch==='"'||ch==="'"){quote=ch;started=true;continue;}
        if(/\s/.test(ch)){if(started){words.push(word);word='';started=false;}}else{word+=ch;started=true;}
      }
      if(quote)throw new Error('unterminated quote');if(started)words.push(word);return words;
    }
    function option(tokens,name){const lower=name.toLowerCase();for(let i=0;i<tokens.length;i++){if(tokens[i].toLowerCase()===lower)return tokens[i+1];if(tokens[i].toLowerCase().startsWith(lower+'='))return tokens[i].slice(name.length+1);}return undefined;}
    function recoveryCommand(source,variables) {
      let line=String(source||'').trim();
      if(!/^az\s+/i.test(line))throw new Error(`unsupported script command: ${line.split(/\s/)[0]||'(empty)'}`);
      line=line.replace(/\s+>[^\s]+(?:\s+2>&1)?$/,'');
      line=line.replace(/\$\{?(\w+)\}?/g,(_,name)=>variables[name]??'');
      const tokens=shellWords(line);const command=tokens.slice(0,3).map(x=>x.toLowerCase()).join(' ');
      if(!state.snapshotVerified||!state.vmDeleted||!state.roleRemoved)throw new Error('complete and verify containment/eradication before recovery.');
      if(command==='az vm create'){
        const name=option(tokens,'--name'),image=option(tokens,'--image'),nsg=option(tokens,'--nsg'),publicIp=option(tokens,'--public-ip-address'),source=option(tokens,'--allow-source'),vnet=option(tokens,'--vnet'),subnet=option(tokens,'--subnet');
        const portList=String(option(tokens,'--open-ports')||option(tokens,'--ports')||'').split(',').map(x=>x.trim()).filter(Boolean).sort().join(',');
        if(name!==facts.recoveryVm||image!==facts.approvedImage||nsg!==facts.recoveryNsg||publicIp!=='none'||source!==facts.managementSubnet||vnet!==facts.recoveryVnet||subnet!==facts.recoverySubnet||portList!=='22,3389'||tokens.some(x=>x.toLowerCase()==='--source'))throw new Error('VM create rejected: use the approved image, recovery network/NSG, no public IP, and management-subnet access to ports 22 and 3389 only.');
        const requested={name,image,publicIp:false,nsg,vnet,subnet,managementSubnet:source,managementPorts:[22,3389]};
        if(state.recovery){if(JSON.stringify({...state.recovery,verified:false,monitoringAgent:null,workspace:null,diagnosticsWorkspace:null,incidentTag:null,createCount:undefined})!==JSON.stringify({...requested,monitoringAgent:null,workspace:null,diagnosticsWorkspace:null,incidentTag:null,createCount:undefined,verified:false}))throw new Error('Idempotent rerun must target the same approved replacement configuration.');}
        else state.recovery={...requested,monitoringAgent:null,workspace:null,diagnosticsWorkspace:null,incidentTag:null,verified:false,createCount:1};
        return `Simulated VM ${name} created from the approved image.\n`;
      }
      if(command==='az vm extension'){
        if(tokens[3]?.toLowerCase()!=='set'||!state.recovery||option(tokens,'--vm-name')!==facts.recoveryVm||option(tokens,'--name')!=='AzureMonitorLinuxAgent')throw new Error('Only the ticketed replacement VM may receive AzureMonitorLinuxAgent.');
        state.recovery.monitoringAgent='AzureMonitorLinuxAgent';return 'Simulated monitoring extension installed.\n';
      }
      if(command==='az monitor diagnostic-settings'){
        if(tokens[3]?.toLowerCase()!=='create'||!state.recovery||option(tokens,'--resource')!==facts.recoveryVm||option(tokens,'--workspace')!==facts.workspace)throw new Error('Diagnostics must point the replacement VM at the ticketed SIEM workspace.');
        state.recovery.diagnosticsWorkspace=facts.workspace;return 'Simulated diagnostic setting created.\n';
      }
      if(command==='az tag create'){
        const resource=option(tokens,'--resource'),tags=option(tokens,'--tags')||option(tokens,'--tags-value');
        if(!state.recovery||resource!==facts.recoveryVm||tags!==`IncidentId=${facts.incidentId}`)throw new Error('Apply the correct IncidentId tag to the replacement VM.');
        state.recovery.incidentTag=facts.incidentId;return 'Simulated incident tag applied.\n';
      }
      if(command==='az vm show'){
        if(!state.recovery||option(tokens,'--name')!==facts.recoveryVm)throw new Error('Query the ticketed replacement VM after configuration.');
        const r=state.recovery;
        if(!r.monitoringAgent||r.diagnosticsWorkspace!==facts.workspace||r.incidentTag!==facts.incidentId)throw new Error('VM verification failed: monitoring, SIEM diagnostics and incident tag must be configured first.');
        r.workspace=facts.workspace;r.verified=true;return JSON.stringify(r,null,2)+'\n';
      }
      throw new Error(`unsupported script command: ${tokens.slice(0,3).join(' ')}`);
    }
    function runScript(script) {
      state.script=String(script||'');state.scriptRuns++;
      if(/(?:password|passwd|secret|token|api[_-]?key)\s*=\s*['"]/i.test(state.script))return {stdout:'',stderr:'bash: hard-coded secrets are not allowed.\n',exitCode:1,observed:{cloudIncident:clone(state)}};
      if(!state.snapshotVerified||!state.vmDeleted||!state.roleRemoved) return {stdout:'',stderr:'bash: complete and verify containment/eradication before recovery.\n',exitCode:1,observed:{cloudIncident:clone(state)}};
      const variables={APPROVED_IMAGE:facts.approvedImage,RECOVERY_NSG:facts.recoveryNsg,RECOVERY_VNET:facts.recoveryVnet,RECOVERY_SUBNET:facts.recoverySubnet,MANAGEMENT_SUBNET:facts.managementSubnet,WORKSPACE:facts.workspace,INCIDENT_ID:facts.incidentId,VM_NAME:facts.recoveryVm};
      const scriptActions={create:false,extension:false,diagnostics:false,tag:false,verify:false};
      const output=[];
      function invoke(line){const result=recoveryCommand(line,variables);const lower=line.toLowerCase();
        if(/^az\s+vm\s+create\b/i.test(line))scriptActions.create=true;
        if(/^az\s+vm\s+extension\s+set\b/i.test(line))scriptActions.extension=true;
        if(/^az\s+monitor\s+diagnostic-settings\s+create\b/i.test(line))scriptActions.diagnostics=true;
        if(/^az\s+tag\s+create\b/i.test(line))scriptActions.tag=true;
        if(/^az\s+vm\s+show\b/i.test(line))scriptActions.verify=true;
        return result;
      }
      const expand=text=>String(text||'').replace(/\$\{?(\w+)\}?/g,(_,name)=>variables[name]??'');
      function matchingBlock(lines,start,kind){
        const close=kind==='if'?'fi':'done';let depth=0,alternate=-1;
        for(let i=start;i<lines.length;i++){
          const line=lines[i].trim();
          if(kind==='if'&&/^if\s+/.test(line))depth++;
          if(kind==='for'&&/^for\s+/.test(line))depth++;
          if(line===close){depth--;if(depth===0)return {alternate,end:i};}
          if(kind==='if'&&line==='else'&&depth===1)alternate=i;
        }
        throw new Error(`missing ${close} for ${kind} block`);
      }
      function conditionValue(text){
        const condition=text.replace(/^if\s+/,'').replace(/\s*;\s*then$/,'').trim();
        const bracket=/^\[\[?\s+([\s\S]*?)\s+\]\]?$/ .exec(condition);
        if(!bracket)throw new Error('supported if tests: [ -n "$VAR" ], [ -z "$VAR" ], and quoted string == or !=');
        const parts=shellWords(expand(bracket[1]));
        if(parts.length===2&&parts[0]==='-n')return parts[1].length>0;
        if(parts.length===2&&parts[0]==='-z')return parts[1].length===0;
        if(parts.length===3&&['=','==','!='].includes(parts[1]))return parts[1]==='!='?parts[0]!==parts[2]:parts[0]===parts[2];
        throw new Error('unsupported if test expression');
      }
      function executeLines(lines,depth=0){
        if(depth>8)throw new Error('script nesting exceeds the supported limit');
        for(let i=0;i<lines.length;i++){
          const line=lines[i].trim();if(!line||line.startsWith('#')||line==='set -e')continue;
          const ifMatch=/^if\s+(.+;\s*then)$/.exec(line);
          if(ifMatch){const block=matchingBlock(lines,i,'if');const split=block.alternate<0?block.end:block.alternate;const choose=conditionValue(ifMatch[0]);const begin=choose?i+1:(block.alternate<0?block.end:block.alternate+1);const end=choose?split:block.end;if(end>begin)executeLines(lines.slice(begin,end),depth+1);i=block.end;continue;}
          if(/^if\s+/.test(line))throw new Error('if condition must end with `; then`');
          const forMatch=/^for\s+([A-Za-z_][A-Za-z0-9_]*)\s+in\s+(.+);\s*do$/.exec(line);
          if(forMatch){const block=matchingBlock(lines,i,'for');const values=shellWords(expand(forMatch[2]));if(!values.length||values.length>20)throw new Error('for loops require one to twenty explicit values');const body=lines.slice(i+1,block.end);for(const value of values){variables[forMatch[1]]=value;executeLines(body,depth+1);}i=block.end;continue;}
          if(/^for\s+/.test(line))throw new Error('for loop syntax must be `for NAME in values; do`');
          if(line==='else'||line==='fi'||line==='done')throw new Error(`unexpected ${line}`);
          const assignment=/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
          if(assignment){const [,name,rhs]=assignment;const substitution=/^\$\((az\s+.+)\)$/.exec(rhs.trim());
            if(substitution){variables[name]=invoke(substitution[1]);continue;}
            if(rhs.includes('$('))throw new Error('unsupported command substitution');
            variables[name]=expand(rhs.trim().replace(/^(['"])(.*)\1$/,'$2'));continue;
          }
          if(/^echo\s+/i.test(line)){output.push(expand(line.replace(/^echo\s+/i,'').replace(/^(['"])(.*)\1$/,'$2'))+'\n');continue;}
          output.push(invoke(line));
        }
      }
      try {
        executeLines(state.script.split(/\r?\n/));
        if(!Object.values(scriptActions).every(Boolean)||!state.recovery||!state.recovery.verified)return {stdout:output.join(''),stderr:'bash: script must create, configure, tag, and query the replacement VM before success.\n',exitCode:1,observed:{cloudIncident:clone(state)}};
        return {stdout:output.join('')+'Replacement VM state verified.\n',stderr:'',exitCode:0,observed:{cloudIncident:clone(state)}};
      }catch(error){return {stdout:output.join(''),stderr:`bash: ${error.message}\n`,exitCode:1,observed:{cloudIncident:clone(state)}};}
    }
    function check(name,submission){const s=state; const queries=s.queries.map(q=>q.query).join('\n').toLowerCase();
      if(name==='ticket')return s.ticketViewed?{ok:true}:{ok:false,reason:'Read ir-ticket.txt first.'};
      if(name==='detect'){
        const signIn=s.queries.some(q=>q.table.toLowerCase()==='signinlogs'&&q.rows.some(r=>r.userPrincipalName===facts.actor&&r.riskState==='atRisk'&&r.result==='success'));
        const activity=s.queries.filter(q=>q.table.toLowerCase()==='azureactivity').flatMap(q=>q.rows);
        const vmWrite=activity.some(r=>r.caller===facts.actor&&r.operation==='Microsoft.Compute/virtualMachines/write');
        const openSsh=activity.some(r=>r.caller===facts.actor&&r.operation==='Microsoft.Network/networkSecurityGroups/securityRules/write'&&r.source==='0.0.0.0/0'&&String(r.destinationPort)==='22');
        return signIn&&vmWrite&&openSsh?{ok:true}:{ok:false,reason:'Query SigninLogs and AzureActivity to identify the risky identity, VM creation and internet SSH rule.'};
      }
      if(name==='scope')return s.scoped?{ok:true}:{ok:false,reason:'Use resource, VM and NSG listing commands to scope touched assets.'};
      if(name==='contain')return s.accountDisabled&&s.sessionsRevoked&&s.nsgContained?{ok:true}:{ok:false,reason:'Disable the incident identity, revoke sessions and remove the exposed NSG rule.'};
      if(name==='snapshot')return s.snapshotCreated&&s.snapshotVerified?{ok:true}:{ok:false,reason:'Create and verify a snapshot of the rogue OS disk before deletion.'};
      if(name==='eradicate')return s.vmDeleted&&s.roleRemoved?{ok:true}:{ok:false,reason:'Remove the rogue VM only after snapshot verification, then remove the unauthorized role assignment.'};
      if(name==='rebuild')return s.recovery&&s.recovery.verified&&s.recovery.createCount===1?{ok:true}:{ok:false,reason:'Run a clean rebuild script and verify its result with az vm show.'};
      if(name==='heartbeat')return s.queryHeartbeat?{ok:true}:{ok:false,reason:'Query Heartbeat for the replacement VM and correct workspace.'};
      if(name==='post')return ['nsg','identity','snapshot','analytic'].every(x=>String(submission||'').toLowerCase().includes(x))?{ok:true}:{ok:false,reason:'Document the identity, exposed NSG, preserved snapshot and proposed analytic.'};
      return {ok:false,reason:'Unknown cloud incident check.'};
    }
    return {state, facts, runCommand, runScript, check, snapshot:()=>clone(state), restore:saved=>{if(saved)Object.assign(state,clone(saved));}};
  }
  window.MISSION_NEXT_CLOUD_INCIDENT={create};
})();
