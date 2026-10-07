/* Module 12 mounts the cumulative M03 console and M04–M10 tool packs on the
 * independent Amber Finch case. Operations/reporting are M12's shift tools. */
const SocM12AssessmentConsole = (() => {
  'use strict';
  const SOURCE = {
    EmailEvents:{native:'Mail gateway message trace (JSON)',fields:[['timestamp','TimeGenerated'],['recipient','Account'],['host','Host'],['summary','Detail']]},
    EmailUrlEvents:{native:'Mail click-time protection log (JSON)',fields:[['timestamp','TimeGenerated'],['recipient','Account'],['url','Url'],['verdict','Result']]},
    DeviceProcessEvents:{native:'Endpoint process telemetry (JSON)',fields:[['timestamp','TimeGenerated'],['device','Host'],['user','Account'],['command','Detail']]},
    DeviceFileEvents:{native:'Endpoint file telemetry (JSON)',fields:[['timestamp','TimeGenerated'],['device','Host'],['user','Account'],['path','FilePath']]},
    DeviceRegistryEvents:{native:'Registry audit export (JSON)',fields:[['timestamp','TimeGenerated'],['device','Host'],['user','Account'],['change','Detail']]},
    DeviceNetworkEvents:{native:'Endpoint network connection log (JSON)',fields:[['timestamp','TimeGenerated'],['device','Host'],['dst','DestinationIp'],['verdict','Result']]},
    DeviceSensorHealth:{native:'Endpoint sensor health feed (JSON)',fields:[['timestamp','TimeGenerated'],['device','Host'],['state','EventType'],['coverage','CoverageStatus']]},
    IdentityLogonEvents:{native:'Identity provider session log (JSON)',fields:[['timestamp','TimeGenerated'],['principal','Account'],['source_ip','SourceIp'],['summary','Detail']]},
    NetworkSessionEvents:{native:'Network session telemetry (JSON)',fields:[['timestamp','TimeGenerated'],['device','Host'],['destination','DestinationIp'],['summary','Detail']]},
    DnsEvents:{native:'Resolver query log (text)',fields:[['ts','TimeGenerated'],['client','DeviceId'],['query','Domain'],['answers','Answers']]},
    ProxyEvents:{native:'Web proxy access log (text)',fields:[['ts','TimeGenerated'],['client','DeviceId'],['url','Url'],['status','Result']]},
    FirewallEvents:{native:'Perimeter firewall flows (key=value)',fields:[['ts','TimeGenerated'],['src','SourceIp'],['dst','DestinationIp'],['action','Result']]},
    VulnerabilityFindings:{native:'Exposure and finding records (JSON)',fields:[['time','TimeGenerated'],['asset','Host'],['state','EventType'],['summary','Detail']]},
    ScanRuns:{native:'Scanner job records (JSON)',fields:[['time','TimeGenerated'],['scanner','Host'],['job','EventType'],['status','Result']]},
    BackupEvents:{native:'Backup catalog job records (JSON)',fields:[['time','TimeGenerated'],['target','Host'],['job','EventType'],['status','Result']]},
    ResponseRecords:{native:'Response inventory records (JSON)',fields:[['time','TimeGenerated'],['entity','Host'],['type','EventType'],['summary','Detail']]},
    EvidenceCustodyLog:{native:'Evidence custody ledger (JSON)',fields:[['time','TimeGenerated'],['custodian','Account'],['action','EventType'],['summary','Detail']]},
    ShiftLog:{native:'SOC shift log (JSON)',fields:[['time','TimeGenerated'],['author','Account'],['entry','EventType'],['note','Detail']]},
  };
  const lc=(v)=>typeof v==='string'?v.toLowerCase():v;
  function dataset() {
    const s=SocM12AssessmentData.scenario, day=s.start.slice(0,10);
    const d=SocM12AssessmentData;
    const normalize=(row)=>({...row,Host:lc(row.Host),DeviceId:lc(row.DeviceId)});
    const events=s.evidence.filter(e=>!(d.telemetry||[]).some(r=>r.EventId===e.id)).map((e)=>{
      const account=e.entityIds.find(id=>id.startsWith('acct-'))||'system';
      const host=e.entityIds.find(id=>id.startsWith('ws-'))||'idp-02';
      const type=e.id==='EM-212'?'LinkOpened':e.id==='EP-301'?'ScriptExecution':e.id==='EP-303'?'PersistenceCreated':e.id==='ID-402'?'TokenRefresh':e.id==='NW-501'?'OutboundConnection':'ScopeCheck';
      return normalize(m03eRow(e.source,e.id,day,e.at.slice(11,19),{Account:account,Host:host,DeviceId:host,EventType:type,Result:'Allowed',DestinationIp:e.entityIds.find(id=>/^\d/.test(id))||'',...(d.evidenceFields[e.id]||{})}));
    });
    (d.telemetry||[]).forEach(({EventSource,EventId,at,...fields})=>events.push(normalize(m03eRow(EventSource,EventId,day,at,{DeviceId:fields.Host,...fields}))));
    const alerts=s.queue.map((a)=>({id:a.id,time:`${day}T${a.at||'09:14:00'}Z`,severity:a.severity,title:a.signal,entities:[a.entityId],rule:'Cumulative shift alert triage',query:`AlertQueue\n| where EventId == "${a.id}"`}));
    return m03eBuildDataset({caseId:s.caseId,day,events,alerts,identities:[
      {Account:'acct-204',DisplayName:'Finance user',Type:'User',Department:'Finance',Owner:'Finance',Privileged:'No',UsualSourceIp:'10.20.4.204'},
      {Account:'acct-091',DisplayName:'Unrelated user',Type:'User',Department:'Operations',Owner:'Operations',Privileged:'No',UsualSourceIp:'10.20.4.91'},
      {Account:'system',DisplayName:'Local system',Type:'Service',Department:'Endpoint',Owner:'Endpoint',Privileged:'Yes',UsualSourceIp:'—'},
      {Account:'acct-112',DisplayName:'Finance analyst',Type:'User',Department:'Finance',Owner:'Finance',Privileged:'No',UsualSourceIp:'192.0.2.12'},
      {Account:'acct-133',DisplayName:'Field sales user',Type:'User',Department:'Sales',Owner:'Sales',Privileged:'No',UsualSourceIp:'192.0.2.33'},
      {Account:'acct-157',DisplayName:'Finance planner',Type:'User',Department:'Finance',Owner:'Finance',Privileged:'No',UsualSourceIp:'192.0.2.57'},
      {Account:'acct-166',DisplayName:'Help desk analyst',Type:'User',Department:'IT',Owner:'IT',Privileged:'Yes',UsualSourceIp:'192.0.2.66'},
      {Account:'acct-188',DisplayName:'HR coordinator',Type:'User',Department:'HR',Owner:'HR',Privileged:'No',UsualSourceIp:'192.0.2.88'},
      {Account:'svc-patch',DisplayName:'Patch scheduler',Type:'Service',Department:'IT',Owner:'IT',Privileged:'Yes',UsualSourceIp:'192.0.2.70'},
      {Account:'svc-report',DisplayName:'Ledger report job',Type:'Service',Department:'Finance',Owner:'Finance',Privileged:'No',UsualSourceIp:'192.0.2.60'},
      {Account:'backup-job',DisplayName:'Backup job',Type:'Service',Department:'IT',Owner:'IT',Privileged:'No',UsualSourceIp:'192.0.2.80'},
    ],ips:[{Ip:'203.0.113.72',Reputation:'Deny-list match · high confidence · first seen 3 days before incident'},{Ip:'198.51.100.20',Reputation:'Approved update service'},{Ip:'203.0.113.140',Reputation:'Vendor monitoring service'},{Ip:'198.51.100.90',Reputation:'Offsite backup vault'},{Ip:'198.51.100.44',Reputation:'Content delivery network'},{Ip:'198.51.100.77',Reputation:'Residential broadband, Germany'}],watchlists:{
      ChangeTickets:{title:'Change tickets',rows:[{ChangeId:'CHG-9201',Scope:'ws-142',Summary:'Monitoring agent rollout',Window:'2026-09-27T10:00Z/12:00Z'},{ChangeId:'CHG-9204',Scope:'ws-177',Summary:'Managed installer for IT agent',Window:'2026-09-27T11:30Z/13:30Z'},{ChangeId:'CHG-9207',Scope:'weekend change window',Summary:'Planned restarts, service credential rotation, month-end export',Window:'2026-09-27T11:00Z/14:00Z'}]},
      TravelNotices:{title:'Travel notices',rows:[{Account:'acct-133',Destination:'Germany',From:'2026-09-26',To:'2026-09-28'}]},
      ApprovedSoftware:{title:'Approved software',rows:[{Name:'inventory-script.exe',Publisher:'Mission Next IT',Sha256:SocM12AssessmentData.telemetry.find(r=>r.EventId==='EP-309').Sha256},{Name:'policy-update.js (ITOps copy)',Publisher:'Mission Next IT',Sha256:SocM12AssessmentData.telemetry.find(r=>r.EventId==='EP-308').Sha256}]},
      ThreatIntelligence:{title:'Threat intelligence',rows:SocM12AssessmentData.scenario.intelligence.map(x=>({Indicator:x.indicator,Confidence:x.confidence,Context:x.context}))},
      Backups:{title:'Recovery points',rows:SocM12AssessmentData.scenario.backups.map(x=>({BackupId:x.id,DeviceId:x.deviceId,Trust:x.trust,Time:x.at}))},
    },now:s.end});
  }
  function evaluateQuery(query) {
    const data=dataset(), result=MnKql.evaluate(String(query||''),data.tables,{now:data.now});
    const ids=(result.rows||[]).map(r=>r.__rid).filter(id=>SocM12AssessmentData.scenario.evidence.some(e=>e.id===id));
    const sourceCount=new Set(ids.map(id=>SocM12AssessmentData.scenario.evidence.find(e=>e.id===id)?.source).filter(Boolean)).size;
    const relevant=ids.filter(id=>SocM12AssessmentData.expectedTruth.selectedEvidence.includes(id));
    const outcome=ids.length===0?'no-match':(relevant.length>=3&&sourceCount>=2?'correlated':ids.length>4?'broad':'narrow');
    return {outcome,matchedEvidence:ids,rows:result.rows||[],errors:result.errors||[]};
  }
  function fixtures(data) {
    const s=SocM12AssessmentData.scenario, id=s.id;
    const m04=SocConsoleTools.m04Fixture({id,caseId:s.caseId,end:s.end,data,iocs:s.intelligence.map(i=>({id:i.id,type:/^\d/.test(i.indicator)?'ip':i.indicator.includes('…')?'file-hash':'domain',value:i.indicator,confidence:i.confidence==='high'?90:i.confidence==='medium'?60:50,status:'active',context:i.context,firstSeen:s.start,lastSeen:s.end,sourceReportId:''}))});
    const devices=[{id:'ws-204',hostname:'WS-204',platform:'Windows',role:'Finance workstation',owner:'acct-204',zone:'CORP',status:'investigation'},
      {id:'ws-118',hostname:'WS-118',platform:'Windows',role:'Workstation',owner:'system',zone:'CORP',status:'monitor'},
      {id:'ws-131',hostname:'WS-131',platform:'Windows',role:'Finance workstation',owner:'acct-157',zone:'CORP',status:'monitor'},
      {id:'ws-142',hostname:'WS-142',platform:'Windows',role:'Workstation',owner:'system',zone:'CORP',status:'monitor'},
      {id:'ws-177',hostname:'WS-177',platform:'Windows',role:'Workstation',owner:'system',zone:'CORP',status:'monitor'}];
    const m05=SocConsoleTools.m05Fixture({id,stateKey:'m12-m05-tools-v1',devices,data});
    const m06=SocConsoleTools.m06Fixture({id,lead:{id:'M12-LEAD-001',type:'alert',device:'ws-204',account:'acct-204',taskName:'Investigate Amber Finch',observation:'High priority process alert with related identity and network signals.'},devices:['ws-204','ws-118','ws-131','ws-142','ws-177'],data,timeStart:s.start,timeEnd:s.end});
    const mail=data.events.filter(r=>r.EventSource==='EmailEvents');
    const network=data.events.filter(r=>['NetworkSessionEvents','DnsEvents','ProxyEvents','FirewallEvents'].includes(r.EventSource));
    const m07=SocConsoleTools.m07Fixture({id,stateKey:'m12-m07-tools-v1',start:s.start,end:s.end,
      recipientGroups:mail.map(r=>({id:`GROUP-${r.EventId}`,recipientIds:[r.Account],deviceIds:r.Host.startsWith('ws-')?[r.Host]:[],delivery:r.Result==='Blocked'?'blocked_at_gateway':'delivered'})),
      messages:mail.map(r=>({id:r.EventId,subject:r.Subject||r.Detail,from:{address:r.Sender||'unknown',displayName:r.Sender||'Sender not recorded'},replyTo:r.ReplyTo||'',returnPath:r.ReturnPath||'',headerMessageId:r.NetworkMessageId||r.EventId,receivedAt:r.TimeGenerated,authentication:{spf:r.SpfResult||'unknown',dkim:r.DkimResult||'unknown',dmarc:r.DmarcResult||'unknown'},urls:r.Url?[{id:`URL-${r.EventId}`,original:r.Url,redirects:[]}]:[],attachments:[]})),
      deliveryEvents:mail.map(r=>({id:`DELIVERY-${r.EventId}`,messageId:r.EventId,recipientId:r.Account,groupId:`GROUP-${r.EventId}`,status:r.Result==='Blocked'?'blocked_at_gateway':'delivered',timestamp:r.TimeGenerated})),
      recipientEvents:mail.filter(r=>r.EventType==='LinkOpened').map(r=>({id:`CLICK-${r.EventId}`,messageId:r.EventId,recipientId:r.Account,deviceId:r.Host,type:'open_and_link_click',timestamp:r.TimeGenerated,urlId:`URL-${r.EventId}`})),
      networkEvents:network.map(r=>({id:r.EventId,type:r.EventSource==='DnsEvents'?'dns_query':r.EventSource==='ProxyEvents'?'proxy_request':r.EventSource==='FirewallEvents'?'firewall_flow':'tls_session',timestamp:r.TimeGenerated,deviceId:r.DeviceId||r.Host,recipientId:r.Account,domain:r.Domain,answers:String(r.Answers||'').split(',').filter(Boolean),source:r.Collector||'resolver',destinationIp:r.DestinationIp,destinationPort:Number(r.DestinationPort)||443,sourceIp:r.SourceIp,action:r.Result,sni:r.Domain||'',method:'GET',url:r.Url,status:Number(r.Result)||200})),
      endpointProcessEvents:data.events.filter(r=>r.EventSource==='DeviceProcessEvents').map(r=>({id:r.EventId,type:'process_start',timestamp:r.TimeGenerated,deviceId:r.Host,recipientId:r.Account,processName:r.Image,imagePath:r.Image,commandLine:r.CommandLine,parentProcessName:r.ParentImage}))});
    const exposure=data.events.filter(r=>r.EventSource==='VulnerabilityFindings');
    const assets=[...new Set(exposure.map(r=>r.Host))];
    const m08=SocConsoleTools.m08Fixture({id,stateKey:'m12-m08-tools-v1',start:s.start,end:s.end,
      assetInventory:assets.map(host=>({id:`ASSET-${host}`,assetId:host,hostname:host,function:'Case inventory asset',ownerId:devices.find(d=>d.id===host)?.owner||'IT operations',environment:'production',criticality:{tier:'medium',rationale:'Business role requires owner validation.',evidenceIds:[]},reachability:{zone:'corporate',reachableFrom:[],evidenceIds:[]},exposure:{status:'internal',services:[],evidenceIds:[]},compensatingControls:[]})),
      findings:exposure.map(r=>({id:r.EventId,assetId:r.Host,product:r.Detail,cve:'Not recorded',cvss:{version:'N/A',baseScore:'Not scored',source:'Case control assessment'},scanner:'Case exposure inventory',observedAt:r.TimeGenerated,freshness:{status:'current',scanAt:r.TimeGenerated,evidenceIds:[r.EventId]},applicability:{status:r.EventType==='FindingVerified'?'confirmed':'unverified',evidenceIds:[r.EventId]},exploitability:{status:'not-established',evidenceIds:[]}})),
      findingEvidence:exposure.map(r=>({id:r.EventId,findingId:r.EventId,kind:'control-observation',observedAt:r.TimeGenerated,source:r.EventSource,detail:r.Detail})),
      incidents:[{id:s.caseId,title:'Operation Amber Finch',findingIds:exposure.map(r=>r.EventId),summary:'Assess incident relevance from linked telemetry.'}],
      incidentEvidence:exposure.map(r=>({id:r.EventId,incidentId:s.caseId,findingId:r.EventId,kind:'inventory-context',observedAt:r.TimeGenerated,source:r.EventSource,detail:r.Detail})),escalationRoutes:[{id:'tier2',label:'Tier 2 Incident Response'}]});
    const artifacts=s.evidence.map((e,i)=>({id:e.id,type:e.source,time:e.at,host:e.entityIds.find(x=>x.startsWith('ws-'))||'IDP-02',account:e.entityIds.find(x=>x.startsWith('acct-'))||'soc-analyst',title:e.id,source:e.source,methods:['log_export'],sourceHash:String(i+1).repeat(64).slice(0,64),verificationHash:String(i+1).repeat(64).slice(0,64),detail:`${e.source} export: ${e.entityIds.join(', ')}`}));
    const m09=SocConsoleTools.m09Fixture({id,stateKey:'m12-m09-tools-v1',start:s.start,end:s.end,incident:{id:s.caseId,title:'Operation Amber Finch',reportedAt:s.start,sourceEntityId:'ws-204',sourceEvidenceId:'EM-212',summary:'Investigate correlated email, endpoint, identity and network evidence.'},entities:[{id:'ws-204',type:'endpoint',hostname:'WS-204',ownerAccountId:'acct-204',status:'under_investigation'},{id:'acct-204',type:'identity',displayName:'acct-204',status:'active'},{id:'ws-118',type:'endpoint',hostname:'WS-118',status:'monitor'}, {id:'DEV-204',type:'device',hostname:'ws-204',linkedEntityId:'ws-204'}, {id:'SESSION-204',type:'session',accountId:'acct-204',deviceId:'DEV-204'}, {id:'IOC-204',type:'ioc',value:'203.0.113.72',linkedEntityId:'ws-204'}, {id:'PERSIST-204',type:'persistence',name:'PolicyUpdate',linkedEntityId:'ws-204'}],backups:s.backups.map(b=>({id:b.id,targetEntityId:'DEV-204',recoveryPointId:b.id,capturedAt:b.at,integrity:'verified',knownGood:b.trust==='verified-pre-incident',evidenceId:'EP-301',scope:'device'})),edges:[{from:s.caseId,to:'ws-204',relation:'execution',evidenceId:'EP-301'},{from:s.caseId,to:'acct-204',relation:'identity_session',evidenceId:'ID-402'}],evidence:s.evidence.map(e=>({id:e.id,type:e.source,time:e.at,entityId:e.entityIds[0],relatedEntityIds:e.entityIds.slice(1),summary:`${e.source} record ${e.id}`}))});
    const m10={schemaVersion:1,scenario:{id,caseId:s.caseId,incidentId:s.caseId,stateKey:'m12-m10-tools-v1',start:s.start,end:s.end,fixedAt:s.end,containedAt:s.start,request:{id:'REQ-M12',from:'Incident lead',receivedAt:s.start,text:'Preserve the linked records, verify integrity and document the bounded reconstruction.'},custodians:[{id:'soc-analyst',label:'SOC analyst'},{id:'forensics',label:'Digital Forensics'},{id:'legal',label:'Legal hold'}],artifacts}};
    return {m04,m05,m06,m07,m08,m09,m10};
  }
  function operations(ctx) {
    const s=SocM12AssessmentData.scenario, state=ctx.state();
    return `<section class="m03-console-extra"><h3>Shift Operations</h3><p>Review queue pressure, record a prioritization and create a shift handoff for unresolved risk.</p>
      <form data-m12-action="hypothesis"><label>Working hypothesis<textarea name="statement" required minlength="20" maxlength="1000"></textarea></label><label>Entities to test<input name="entityIds" placeholder="ws-204, acct-204"></label><button>Record hypothesis</button></form>
      <form data-m12-action="handoff"><label>Shift handoff<textarea name="text" required minlength="30" maxlength="3000"></textarea></label><label>Open risks<input name="openRisks" placeholder="policy remediation, monitoring"></label><button>Save handoff</button></form>
      <p role="status">${state.handoffs.length} handoff(s), ${state.hypotheses.length} hypothesis records.</p></section>`;
  }
  function reporting(ctx) {
    const state=ctx.state();
    return `<section class="m03-console-extra"><h3>Reporting &amp; Closure</h3><p>Write the technical account, executive decision, and lessons learned with supporting record references.</p>
      ${['technical','executive','lessons'].map(kind=>`<form data-m12-report="${kind}"><h4>${kind[0].toUpperCase()+kind.slice(1)} report</h4><label>Student response<textarea name="text" required minlength="30" maxlength="5000">${esc(state.reports[kind]?.text||'')}</textarea></label><label>Evidence IDs<input name="evidenceIds" placeholder="EM-212, EP-301, NW-501"></label><button>Save ${kind} report</button></form>`).join('')}
      <form data-m12-action="closure"><label>Case decision<select name="decision"><option value="retain">Retain open</option><option value="close">Close after validation</option><option value="reopen">Reopen</option></select></label><label>Rationale<textarea name="rationale" required minlength="20"></textarea></label><button>Record closure decision</button></form>
      <p role="status">${Object.keys(state.reports).length} report(s) saved.</p></section>`;
  }
  function evidenceDomain(source) {
    if (/^Email/.test(source)) return 'email';
    if (/^Identity/.test(source)) return 'identity';
    if (/Network|Dns|Proxy|Firewall/.test(source)) return 'network';
    if (/Vulnerability|Exposure/.test(source)) return 'exposure';
    if (/^Device/.test(source)) return 'endpoint';
    return '';
  }
  function selectedEvidence(consoleState, data, tab) {
    const selected=consoleState.selected;
    if(selected?.type!=='record') return null;
    const row=data.events.find(r=>r.EventId===selected.id);
    if(!row || !SocM12AssessmentData.scenario.evidence.some(e=>e.id===row.EventId)) return null;
    if(['email','network','exposure'].includes(tab) && evidenceDomain(row.EventSource)!==tab) return null;
    return row;
  }
  function findingControls(row) {
    const domain=evidenceDomain(row.EventSource); if(!domain) return '';
    return `<section class="m04-console-extra" data-m12-selected-evidence="${esc(row.EventId)}"><h4>Finding · ${esc(row.EventId)}</h4><p>${esc(row.TimeGenerated)} · ${esc(row.EventSource)} · ${esc(row.Host)} · ${esc(row.Account||'')}<br>${esc(row.Detail||'')}</p>
      <form data-m12-context="finding" data-evidence-id="${esc(row.EventId)}"><label>Finding type<select name="domain" required><option value="">Choose…</option><option value="${domain}">${domain} analysis</option><option value="scope">Scope determination</option></select></label><label>Finding and reasoning<textarea name="finding" required minlength="20" maxlength="1000"></textarea></label><p class="m03e-muted">Recorded with selected evidence ${esc(row.EventId)}.</p><button type="submit">Record finding</button></form></section>`;
  }
  function contextualMarkup(tab, consoleState, data) {
    const scenario=SocM12AssessmentData.scenario, selected=consoleState.selected;
    if(tab==='alerts') {
      const alert=selected?.type==='alert' && data.alerts.find(a=>a.id===selected.id); if(!alert)return '';
      return `<section class="m04-console-extra" data-m12-selected-alert="${esc(alert.id)}"><h4>Alert determination · ${esc(alert.id)}</h4>
        <form data-m12-context="alert" data-alert-id="${esc(alert.id)}"><label>Disposition<select name="disposition" required><option value="">Choose…</option>${['true-positive','benign-positive','false-positive','needs-investigation'].map(d=>`<option value="${d}">${d}</option>`).join('')}</select></label><label>Evidence and reasoning<textarea name="reason" required minlength="20" maxlength="1000"></textarea></label><button type="submit">Record alert determination</button></form>
        <form data-m12-context="incident-link" data-alert-id="${esc(alert.id)}"><label>Incident ID<input name="incidentId" required maxlength="120"></label><button type="submit">Link selected alert</button></form></section>`;
    }
    if(tab==='intelligence') {
      const indicator=selected?.type==='intel'&&scenario.intelligence.find(i=>i.id===selected.id);
      return `<section class="m04-console-extra"><h4>Contextual indicator assessment</h4><div class="m03e-listing">${scenario.intelligence.map(i=>`<button type="button" data-m12-select-intel="${esc(i.id)}" aria-pressed="${indicator?.id===i.id}"><strong>${esc(i.indicator)}</strong><span>${esc(i.id)}</span></button>`).join('')}</div>
        ${indicator?`<article data-m12-selected-indicator="${esc(indicator.id)}"><h5>${esc(indicator.indicator)}</h5><p>${esc(indicator.context)}</p><form data-m12-context="intel" data-indicator-id="${esc(indicator.id)}"><label>Verdict<select name="decision" required><option value="">Choose…</option>${['malicious','benign','unknown'].map(v=>`<option value="${v}">${v}</option>`).join('')}</select></label><label>Context and reasoning<textarea name="rationale" required minlength="20" maxlength="1000"></textarea></label><button type="submit">Record indicator verdict</button></form></article>`:'<p>Select an indicator to record its contextual verdict.</p>'}</section>`;
    }
    if(tab==='response') {
      return `<section class="m04-console-extra m09-console-extra"><h4>Response workflow design</h4>
        <form data-m12-context="workflow"><label>Workflow name<input name="name" required maxlength="120"></label><fieldset><legend>Action nodes</legend>${scenario.workflowNodes.map(n=>`<label><input type="checkbox" name="nodes" value="${n}"> ${n}</label>`).join('')}</fieldset><label>Connections (one from&gt;to pair per line)<textarea name="edges" rows="4" maxlength="1000" required></textarea></label><button type="submit">Save workflow design</button></form>
        <h4>Response action</h4><form data-m12-context="execute"><label>Action<select name="action" required><option value="">Choose…</option>${['preserve','isolate','revoke-session','block-indicator'].map(a=>`<option value="${a}">${a}</option>`).join('')}</select></label><label>Target<select name="target" required><option value="">Choose…</option>${scenario.entities.map(e=>`<option value="${esc(e.id)}">${esc(e.id)}</option>`).join('')}</select></label><button type="submit">Attempt response action</button></form><p class="m03e-muted">The range records the attempt and checks scope and recorded approval.</p>
        <ol>${(moduleTwelveState.assessmentState.executions||[]).filter(e=>e.sourceRef?.startsWith('m09:range-attempt:')).map(e=>`<li>${esc(e.action)} → ${esc(e.target)} · ${esc(e.outcome)}${e.blockReason?` · ${esc(e.blockReason)}`:''}</li>`).join('')}</ol></section>`;
    }
    if(['search','timeline','evidence','email','network','exposure'].includes(tab)) {
      const row=selectedEvidence(consoleState,data,tab);
      // Tool packs retain their own record selectors; these buttons bind a
      // finding to the same native evidence identity used by Log Search.
      const records=['email','network','exposure'].includes(tab)?scenario.evidence.filter(e=>evidenceDomain(e.source)===tab):[];
      const picker=records.length?`<section class="m04-console-extra"><h4>Record context</h4><div class="m03e-listing">${records.map(e=>`<button type="button" data-m12-select-record="${esc(e.id)}" aria-pressed="${row?.EventId===e.id}"><strong>${esc(e.id)}</strong><span>${esc(e.at)} · ${esc(e.entityIds.join(', '))}</span></button>`).join('')}</div></section>`:'';
      return picker+(row?findingControls(row):'<p class="m03e-muted">Select an evidence record to document a finding or scope determination.</p>');
    }
    return '';
  }
  function recordContextual(state, consoleState, data, kind, values) {
    const api=SocM12AssessmentState, fixture=SocM12AssessmentData, selected=consoleState.selected;
    if(kind==='alert'||kind==='incident-link') {
      const alert=selected?.type==='alert'&&data.alerts.find(a=>a.id===selected.id);
      if(!alert || values.contextId!==alert.id)throw new Error('Select the alert again before recording this decision.');
      return api.record(state,fixture,kind==='alert'?'review-alert':'incident-link',kind==='alert'?{alertId:alert.id,disposition:values.disposition,reason:values.reason}:{alertId:alert.id,incidentId:String(values.incidentId||'').trim()});
    }
    if(kind==='intel') {
      if(selected?.type!=='intel'||selected.id!==values.contextId)throw new Error('Select the indicator again before recording this verdict.');
      return api.record(state,fixture,'intel-decision',{indicatorId:selected.id,decision:values.decision,rationale:values.rationale});
    }
    if(kind==='finding') {
      const row=selectedEvidence(consoleState,data,consoleState.tab);
      if(!row||row.EventId!==values.contextId||![evidenceDomain(row.EventSource),'scope'].includes(values.domain))throw new Error('Select the evidence record again before recording this finding.');
      return api.record(state,fixture,'investigation',{domain:values.domain,finding:values.finding,evidenceIds:[row.EventId]});
    }
    if(kind==='workflow') {
      const lines=String(values.edges||'').split(/[\n,]/).map(v=>v.trim()).filter(Boolean);
      const edges=lines.map(line=>{const pair=line.split('>').map(v=>v.trim());if(pair.length!==2)throw new Error('Each connection needs a from>to pair.');return {from:pair[0],to:pair[1]};});
      return api.record(state,fixture,'workflow-design',{name:values.name,nodes:values.nodes,edges});
    }
    if(kind==='execute') {
      // An explicit response attempt must survive even if the M09 approval
      // UI/API would refuse to execute it before writing an audit record.
      return api.record(state,fixture,'execute',{action:values.action,target:values.target,sourceRef:`m09:range-attempt:${state.nextActionSequence}`});
    }
    throw new Error('Unknown contextual console action.');
  }
  function mount(root) {
    if(typeof M03E_SOURCE_MAPPINGS!=='undefined') Object.entries(SOURCE).forEach(([name,map])=>{ if(!M03E_SOURCE_MAPPINGS[name]) M03E_SOURCE_MAPPINGS[name]=map; });
    const data=dataset(), fx=fixtures(data), parent=()=>moduleTwelveState;
    // M04 mutates its assessment in place; returning a normalized clone here
    // discarded every rule/intelligence change before the save callback.
    moduleTwelveState.tools ||= {};
    moduleTwelveState.tools.m04 = SocM04AssessmentState.normalize({assessment:moduleTwelveState.tools.m04||{}},fx.m04).assessment;
    const initialAlerts=data.alerts.slice();
    Object.defineProperty(data,'alerts',{configurable:true,enumerable:true,get:()=>[...initialAlerts,...(moduleTwelveState.assessmentState?.generatedAlerts||[]).map(a=>({id:a.id,time:SocM12AssessmentData.scenario.end,severity:a.severity,title:a.title,entities:a.entities,rule:a.ruleId,query:'Learner-tested query'}))]});
    const save=()=>moduleTwelveSave(), base={save,rerender:()=>moduleTwelveRender(),console:()=>m03eState('m12')};
    const embedded=(key,fixture,normalize)=>SocConsoleTools.embedded(parent,key,normalize,fixture,save);
    const packs=[
      {id:'m04',ctx:{...base,fixture:fx.m04,...embedded('m04',fx.m04,(v,f)=>SocM04AssessmentState.normalize({assessment:v},f).assessment),assessment:()=>moduleTwelveState.tools.m04}},
      {id:'m05',ctx:{...base,fixture:fx.m05,...embedded('m05',fx.m05,SocM05AssessmentState.normalize)}},
      {id:'m06',ctx:{...base,fixture:fx.m06,...embedded('m06',fx.m06,SocM06AssessmentState.normalize)}},
      {id:'m07',ctx:{...base,fixture:fx.m07,ui:{},...SocConsoleTools.embeddedBox(parent,'m07',SocM07AssessmentState.normalize,fx.m07,save)}},
      {id:'m08',ctx:{...base,fixture:fx.m08,ui:{},...SocConsoleTools.embeddedBox(parent,'m08',SocM08AssessmentState.normalize,fx.m08,save)}},
      {id:'m09',ctx:{...base,fixture:fx.m09,evidence:fx.m09.scenario.evidence,routes:[{id:'tier2',text:'Tier 2 Incident Response'}],...embedded('m09',fx.m09,SocM09AssessmentState.normalize)}},
      {id:'m10',ctx:{...base,fixture:fx.m10,console:()=>m03eState('m12'),load:()=>SocM10AssessmentState.normalize(moduleTwelveState.tools?.m10||{},fx.m10),store:(next)=>{moduleTwelveState.tools||={};moduleTwelveState.tools.m10=SocM10AssessmentState.normalize(next,fx.m10);save();}}},
    ];
    const packViews=Object.assign({},...packs.map(({id,ctx})=>SocConsoleTools.PACKS[id].views({...ctx,scope:'m12'})));
    const contextualViews={};
    const baseViews={alerts:()=>m03eAlertsView('m12'),search:()=>m03eSearchView('m12'),timeline:()=>m03eTimelineView('m12'),evidence:()=>m03eEvidenceView('m12')};
    for(const tab of ['alerts','search','timeline','evidence','intelligence','email','network','exposure','response']) {
      const view=packViews[tab]||baseViews[tab];
      contextualViews[tab]=()=>view()+`<div data-m12-contextual="${tab}">${contextualMarkup(tab,m03eState('m12'),data)}</div>`;
    }
    // Selecting a Log Search row re-renders only results/drawer (to keep the
    // editor), which left this panel showing the previous record's finding form.
    // mount() runs on every render, so install the refresher once.
    if(typeof M03E_AFTER_RENDER!=='undefined' && !M03E_AFTER_RENDER.m12?.m12Contextual) {
      const previousAfterRender=M03E_AFTER_RENDER.m12;
      const refresh=()=>{
        previousAfterRender?.();
        const st=m03eState('m12'), panel=document.querySelector(`#m03e-console-m12 [data-m12-contextual="${st.tab}"]`);
        if(panel) panel.innerHTML=contextualMarkup(st.tab,st,dataset());
      };
      refresh.m12Contextual=true;
      M03E_AFTER_RENDER.m12=refresh;
    }
    const mounted=SocConsoleTools.mount('m12',{data,stateRoot:parent,save,title:'CUMULATIVE SOC CAPSTONE',ariaLabel:'Module 12 cumulative SOC capstone console',packs,
      extraTabs:[['operations','Operations'],['reporting','Reporting']],views:{...contextualViews,operations:()=>operations({state:()=>moduleTwelveState.assessmentState}),reporting:()=>reporting({state:()=>moduleTwelveState.assessmentState})},
      caseView:()=>moduleTwelveTicketView(),
      caseBadge:()=>moduleTwelveState.submitted?' <i class="ri-checkbox-circle-fill" aria-label="Submitted"></i>':''});
    // Every render registers the mount (so the shell HTML can be built), but
    // a given console root is wired once: pack listeners have no guard of
    // their own, and a double-wired root handles each click twice.
    if(!root || root.dataset.m12ConsoleWired==='true') return;
    root.dataset.m12ConsoleWired='true';
    mounted.wire(root);
    root.addEventListener('submit',(event)=>{
      const form=event.target.closest('[data-m12-action], [data-m12-report], [data-m12-context]'); if(!form)return; event.preventDefault();
      const fields=new FormData(form),v=(name)=>String(fields.get(name)||''),list=(name)=>v(name).split(',').map(x=>x.trim()).filter(Boolean);
      try {
        const api=SocM12AssessmentState, fixture=SocM12AssessmentData; let next=moduleTwelveState.assessmentState;
        if(moduleTwelveState.submitted) throw new Error('This submitted attempt is locked.');
        if(form.matches('[data-m12-context]')) next=recordContextual(next,m03eState('m12'),data,form.dataset.m12Context,{...Object.fromEntries(fields.entries()),nodes:fields.getAll('nodes'),contextId:form.dataset.evidenceId||form.dataset.alertId||form.dataset.indicatorId});
        else if(form.matches('[data-m12-report]')) next=api.record(next,fixture,'report',{kind:form.dataset.m12Report,text:v('text'),evidenceIds:list('evidenceIds')});
        else if(form.dataset.m12Action==='hypothesis') next=api.record(next,fixture,'hypothesis',{statement:v('statement'),entityIds:list('entityIds')});
        else if(form.dataset.m12Action==='handoff') next=api.record(next,fixture,'handoff',{text:v('text'),openRisks:list('openRisks')});
        else if(form.dataset.m12Action==='closure') next=api.record(next,fixture,'closure',{decision:v('decision'),rationale:v('rationale')});
        moduleTwelveState.assessmentState=next;
        const stage=form.matches('[data-m12-report]')?'reporting':form.dataset.m12Action==='closure'?'closure':'query';
        moduleTwelveState.stageVisits=[...new Set([...moduleTwelveState.stageVisits,stage])];
        moduleTwelveSave(); moduleTwelveRender();
      } catch(error) { let status=form.querySelector('[role="alert"]'); if(!status){status=document.createElement('p');status.setAttribute('role','alert');form.append(status);} status.textContent=error.message; }
    });
    root.addEventListener('click',(event)=>{
      const selection=event.target.closest('[data-m12-select-intel], [data-m12-select-record]');
      if(selection) {
        const st=m03eState('m12');
        st.selected={type:selection.dataset.m12SelectIntel?'intel':'record',id:selection.dataset.m12SelectIntel||selection.dataset.m12SelectRecord};
        moduleTwelveSave(); moduleTwelveRender(); return;
      }
      const button=event.target.closest('[data-m03e-pin^="m12:"]'); if(!button)return;
      const id=button.dataset.m03ePin.split(':').slice(1).join(':');
      requestAnimationFrame(()=>{
        const pins=m03eState('m12').pins||[]; let next=moduleTwelveState.assessmentState;
        try { next=SocM12AssessmentState.record(next,SocM12AssessmentData,'evidence-select',{evidenceId:id,selected:pins.includes(id)}); moduleTwelveState.assessmentState=next; moduleTwelveSave(); } catch(_){/* non-case rows are not scorer evidence */}
      });
    });
  }
  return Object.freeze({dataset,fixtures,evaluateQuery,mount,contextualMarkup,recordContextual});
})();
