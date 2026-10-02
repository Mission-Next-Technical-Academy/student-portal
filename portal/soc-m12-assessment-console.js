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
    const events=s.evidence.map((e)=>{
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
    ],ips:[{Ip:'203.0.113.72',Reputation:'High confidence malicious in correlated incident context'},{Ip:'198.51.100.20',Reputation:'Approved update service'},{Ip:'203.0.113.140',Reputation:'Vendor monitoring service'},{Ip:'198.51.100.90',Reputation:'Offsite backup vault'},{Ip:'198.51.100.44',Reputation:'Content delivery network'},{Ip:'198.51.100.77',Reputation:'Residential broadband, Germany'}],watchlists:{
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
    const m04=SocConsoleTools.m04Fixture({id,caseId:s.caseId,end:s.end,data});
    const devices=[{id:'ws-204',hostname:'WS-204',platform:'Windows',role:'Finance workstation',owner:'acct-204',zone:'CORP',status:'investigation'},
      {id:'ws-118',hostname:'WS-118',platform:'Windows',role:'Workstation',owner:'system',zone:'CORP',status:'monitor'},
      {id:'ws-131',hostname:'WS-131',platform:'Windows',role:'Finance workstation',owner:'acct-157',zone:'CORP',status:'monitor'},
      {id:'ws-142',hostname:'WS-142',platform:'Windows',role:'Workstation',owner:'system',zone:'CORP',status:'monitor'},
      {id:'ws-177',hostname:'WS-177',platform:'Windows',role:'Workstation',owner:'system',zone:'CORP',status:'monitor'}];
    const m05=SocConsoleTools.m05Fixture({id,stateKey:'m12-m05-tools-v1',devices,data});
    const m06=SocConsoleTools.m06Fixture({id,lead:{id:'M12-LEAD-001',type:'alert',device:'ws-204',account:'acct-204',taskName:'Investigate Amber Finch',observation:'High priority process alert with related identity and network signals.'},devices:['ws-204','ws-118','ws-131','ws-142','ws-177'],data,timeStart:s.start,timeEnd:s.end});
    const m07=SocConsoleTools.m07Fixture({id,stateKey:'m12-m07-tools-v1',start:s.start,end:s.end});
    const m08=SocConsoleTools.m08Fixture({id,stateKey:'m12-m08-tools-v1',start:s.start,end:s.end});
    const artifacts=s.evidence.map((e,i)=>({id:e.id,type:e.source,time:e.at,host:e.entityIds.find(x=>x.startsWith('ws-'))||'IDP-02',account:e.entityIds.find(x=>x.startsWith('acct-'))||'soc-analyst',title:e.id,source:e.source,methods:['log_export'],sourceHash:String(i+1).repeat(64).slice(0,64),verificationHash:String(i+1).repeat(64).slice(0,64),detail:`${e.class} evidence: ${e.entityIds.join(', ')}`}));
    const m09=SocConsoleTools.m09Fixture({id,stateKey:'m12-m09-tools-v1',start:s.start,end:s.end,incident:{id:s.caseId,title:'Operation Amber Finch',reportedAt:s.start,sourceEntityId:'ws-204',sourceEvidenceId:'EM-212',summary:'Investigate correlated email, endpoint, identity and network evidence.'},entities:[{id:'ws-204',type:'endpoint',hostname:'WS-204',ownerAccountId:'acct-204',status:'under_investigation'},{id:'acct-204',type:'identity',displayName:'acct-204',status:'active'},{id:'ws-118',type:'endpoint',hostname:'WS-118',status:'monitor'}],edges:[{from:s.caseId,to:'ws-204',relation:'execution',evidenceId:'EP-301'},{from:s.caseId,to:'acct-204',relation:'identity_session',evidenceId:'ID-402'}],evidence:s.evidence.map(e=>({id:e.id,type:e.source,time:e.at,entityId:e.entityIds[0],relatedEntityIds:e.entityIds.slice(1),summary:`${e.class} evidence`}))});
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
  function mount(root) {
    if(typeof M03E_SOURCE_MAPPINGS!=='undefined') Object.entries(SOURCE).forEach(([name,map])=>{ if(!M03E_SOURCE_MAPPINGS[name]) M03E_SOURCE_MAPPINGS[name]=map; });
    const data=dataset(), fx=fixtures(data), parent=()=>moduleTwelveState;
    const initialAlerts=data.alerts.slice();
    Object.defineProperty(data,'alerts',{configurable:true,enumerable:true,get:()=>[...initialAlerts,...(moduleTwelveState.assessmentState?.generatedAlerts||[]).map(a=>({id:a.id,time:SocM12AssessmentData.scenario.end,severity:a.severity,title:a.title,entities:a.entities,rule:a.ruleId,query:'Learner-tested query'}))]});
    const save=()=>moduleTwelveSave(), base={save,rerender:()=>moduleTwelveRender(),console:()=>m03eState('m12')};
    const embedded=(key,fixture,normalize)=>SocConsoleTools.embedded(parent,key,normalize,fixture,save);
    const packs=[
      {id:'m04',ctx:{...base,fixture:fx.m04,...embedded('m04',fx.m04,(v,f)=>SocM04AssessmentState.normalize({assessment:v},f).assessment),assessment:()=>SocM04AssessmentState.normalize({assessment:moduleTwelveState.tools?.m04||{}},fx.m04).assessment}},
      {id:'m05',ctx:{...base,fixture:fx.m05,...embedded('m05',fx.m05,SocM05AssessmentState.normalize)}},
      {id:'m06',ctx:{...base,fixture:fx.m06,...embedded('m06',fx.m06,SocM06AssessmentState.normalize)}},
      {id:'m07',ctx:{...base,fixture:fx.m07,ui:{},...SocConsoleTools.embeddedBox(parent,'m07',SocM07AssessmentState.normalize,fx.m07,save)}},
      {id:'m08',ctx:{...base,fixture:fx.m08,ui:{},...SocConsoleTools.embeddedBox(parent,'m08',SocM08AssessmentState.normalize,fx.m08,save)}},
      {id:'m09',ctx:{...base,fixture:fx.m09,evidence:fx.m09.scenario.evidence,routes:[{id:'tier2',text:'Tier 2 Incident Response'}],...embedded('m09',fx.m09,SocM09AssessmentState.normalize)}},
      {id:'m10',ctx:{...base,fixture:fx.m10,console:()=>m03eState('m12'),load:()=>SocM10AssessmentState.normalize(moduleTwelveState.tools?.m10||{},fx.m10),store:(next)=>{moduleTwelveState.tools||={};moduleTwelveState.tools.m10=SocM10AssessmentState.normalize(next,fx.m10);save();}}},
    ];
    const mounted=SocConsoleTools.mount('m12',{data,stateRoot:parent,save,title:'CUMULATIVE SOC CAPSTONE',ariaLabel:'Module 12 cumulative SOC capstone console',packs,
      extraTabs:[['operations','Operations'],['reporting','Reporting']],views:{operations:()=>operations({state:()=>moduleTwelveState.assessmentState}),reporting:()=>reporting({state:()=>moduleTwelveState.assessmentState})},
      caseView:()=>`<p class="m03e-muted">INC-4821 · Operation Amber Finch. Complete the portfolio incident record in the Assessment section below the console.</p>`,
      caseBadge:()=>moduleTwelveState.submitted?' <i class="ri-checkbox-circle-fill" aria-label="Submitted"></i>':''});
    // Every render registers the mount (so the shell HTML can be built), but
    // a given console root is wired once: pack listeners have no guard of
    // their own, and a double-wired root handles each click twice.
    if(!root || root.dataset.m12ConsoleWired==='true') return;
    root.dataset.m12ConsoleWired='true';
    mounted.wire(root);
    root.addEventListener('submit',(event)=>{
      const form=event.target.closest('[data-m12-action], [data-m12-report]'); if(!form)return; event.preventDefault();
      const data=new FormData(form),v=(name)=>String(data.get(name)||''),list=(name)=>v(name).split(',').map(x=>x.trim()).filter(Boolean);
      try {
        const api=SocM12AssessmentState, fixture=SocM12AssessmentData; let next=moduleTwelveState.assessmentState;
        if(form.matches('[data-m12-report]')) next=api.record(next,fixture,'report',{kind:form.dataset.m12Report,text:v('text'),evidenceIds:list('evidenceIds')});
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
      const button=event.target.closest('[data-m03e-pin^="m12:"]'); if(!button)return;
      const id=button.dataset.m03ePin.split(':').slice(1).join(':');
      requestAnimationFrame(()=>{
        const pins=m03eState('m12').pins||[]; let next=moduleTwelveState.assessmentState;
        try { next=SocM12AssessmentState.record(next,SocM12AssessmentData,'evidence-select',{evidenceId:id,selected:pins.includes(id)}); moduleTwelveState.assessmentState=next; moduleTwelveSave(); } catch(_){/* non-case rows are not scorer evidence */}
      });
    });
  }
  return Object.freeze({dataset,fixtures,evaluateQuery,mount});
})();
