'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context=vm.createContext({console,URL});
const files=['attack-catalog','soc-assessment-scorer','soc-m12-assessment-data','soc-m12-assessment-state','soc-m12-assessment-rubric','soc-m12-assessment-scorer','kql-engine','soc-m04-assessment-actions','soc-m04-assessment-state','soc-m04-rules-ui','soc-m04-rule-evaluator','soc-m04-intelligence-ui','soc-m05-assessment-state','soc-m05-assessment-actions','soc-m06-assessment-state','soc-m06-assessment-actions','soc-m06-assessment-related-search','soc-m09-assessment-state','soc-m10-assessment-state','soc-console-tools','soc-m12-assessment-console','soc-m12-tool-bridge'];
context.m03eRow=(source,id,day,time,fields)=>({EventSource:source,EventId:id,__rid:id,TimeGenerated:`${day}T${time}Z`,...fields});
context.m03eBuildDataset=({caseId,events,alerts,identities,ips,watchlists,now})=>({caseId,events,alerts,identities,ips,watchlists,now,records:Object.fromEntries(events.map(e=>[e.EventId,e])),tables:{...Object.fromEntries([...new Set(events.map(e=>e.EventSource))].map(source=>[source,events.filter(e=>e.EventSource===source)])),UnifiedEvents:events}});
for(const file of files) vm.runInContext(fs.readFileSync(`portal/${file}.js`,'utf8'),context,{filename:file});
const get=name=>vm.runInContext(name,context);
const fixture=get('SocM12AssessmentData'),bridge=get('SocM12ToolBridge'),api=get('SocM12AssessmentState'),score=get('SocM12AssessmentScorer');
const fx=get('SocM12AssessmentConsole.fixtures(SocM12AssessmentConsole.dataset())');
const tools={},pins={pins:[]};let state=api.fresh(fixture),minute=0;
const time=()=>new Date(Date.parse(fixture.scenario.start)+(++minute)*60000).toISOString();
const save=()=>{state=bridge.project(tools,pins,state,fixture);};
const m04=get('SocM04RulesUi'),m05=get('SocM05AssessmentActions'),m06=get('SocM06AssessmentActions'),m09=get('SocM09AssessmentState'),m10=get('SocM10AssessmentState');
tools.m04=get('SocM04AssessmentState').normalize({},fx.m04).assessment;
// Real Analytics Rules actions, including generated IDs and a recurring schedule.
const query='union EmailEvents, DeviceProcessEvents, DeviceRegistryEvents, IdentityLogonEvents, NetworkSessionEvents | where EventId in ("EM-212", "EP-301", "EP-303", "ID-402", "NW-501")';
assert.equal(m04.test(tools.m04,fx.m04,query,time()).succeeded,true);save();
const saved=m04.saveQuery(tools.m04,query,time(),'Correlated case events');save();
const rule=m04.convertToDraft(tools.m04,saved.id,time());save();
m04.updateDraft(tools.m04,rule.id,{name:rule.name,description:'Correlate evidence within the shift',severity:'High',groupingField:'Account',threshold:1,windowMinutes:1440},time());save();
m04.configureSchedule(tools.m04,rule.id,{enabled:true,frequencyMinutes:60,scheduledAt:'2026-09-27T15:00:00Z'},time());save();
const run=m04.recordExecution(tools.m04,rule.id,time());m04.completePendingExecution(tools.m04,run.id,fx.m04);save();
const runAgain=m04.recordExecution(tools.m04,rule.id,time());m04.completePendingExecution(tools.m04,runAgain.id,fx.m04);save();
assert.ok(tools.m04.alerts.length>=2,JSON.stringify(tools.m04.executions));
for(const alert of tools.m04.alerts.slice(0,2)) {m04.reviewAlert(tools.m04,alert.id,'Reviewing the cited process and identity records for incident scope.',time());save();}
// No outcome is inferred from a click or a mere device selection.
tools.m05=m05.append({},'analysis_note',time(),{text:'EP-301 and EP-303 record script execution and persistence on the affected endpoint.',relatedDeviceIds:['ws-204']},fx.m05);save();
for(const [eventIds,text] of [
  [['EM-212'],'EM-212 records delivery and a user interaction before endpoint execution.'],
  [['ID-402'],'ID-402 records the unfamiliar refresh on the affected user account.'],
  [['NW-501'],'NW-501 records the external destination contacted from the affected workstation.'],
]) {tools.m06=m06.append(tools.m06||{},'conclusion',time(),{text,eventIds,disposition:'supported'},fx.m06);save();}
tools.m05=m05.append(tools.m05,'evidence_package_preserved',time(),{deviceId:'ws-204',eventIds:['EP-301'],hashes:[fixture.evidenceFields['EP-301'].Sha256]},fx.m05);save();
// Reconstruction and pins use the case's original evidence identities.
pins.pins=['EM-212','EP-301','NW-501','EP-303','ID-402'];save();
for(const artifactId of pins.pins) {tools.m10=m10.intake(tools.m10||{},fx.m10,{artifactId,source:'Case telemetry',method:'log_export',acquiredBy:'soc-analyst'},time());save();}
tools.m10=m10.setTimeline(tools.m10,fx.m10,pins.pins,time());save();
// Response approvals are actual M09 workflow events, not current-state guesses.
tools.m09=m09.normalize({},fx.m09);
const approve=(actionType,targetId)=>{
  tools.m09=m09.updateIncidentWorkflow(tools.m09,'INC-4821',{approvalStatus:'pending',approvalTargetId:targetId,approvalActionType:actionType,approvalReason:'Correlated evidence supports this scoped response.'},time(),fx.m09);save();
  tools.m09=m09.updateIncidentWorkflow(tools.m09,'INC-4821',{approvalStatus:'approved',approvalActorId:'ir-lead-1',approvalReason:'Approved for the documented scope and recovery plan.'},time(),fx.m09);save();
};
const execute=(type,entityId)=>{tools.m09=m09.executeApprovedAction(tools.m09,'INC-4821',{type,outcome:'success',details:{entityId,incidentId:'INC-4821'}},time(),fx.m09);save();};
for(const [type,target] of [['isolate_endpoint','ws-204'],['revoke_session','SESSION-204'],['block_ioc','IOC-204'],['remove_persistence','PERSIST-204']]) {approve(type,target);execute(type,target);}
tools.m09=m09.selectRecoveryPoint(tools.m09,'INC-4821','BK-204-0900',time(),fx.m09);save();
approve('restore_backup','DEV-204');
for(const type of ['restore_backup','scan_recovery','validate_recovery']) execute(type,'DEV-204');
tools.m09=m09.completeRecoveryMonitoring(tools.m09,'INC-4821','DEV-204',time(),[],fx.m09);save();
// M04's authored intelligence reports support arbitrary report types and retain
// student text. These use that existing UI/API, never the retired M12 form grid.
for(const [kind,summary] of [
  ['technical','Confirmed scope and sequence: EM-212 precedes EP-301 and NW-501. The full identity exposure remains unknown.'],
  ['executive','Business impact affects a Finance user and workstation; containment protects the service while recovery is validated.'],
  ['lessons','Improve script controls and assign an owner to follow-up detection tuning based on EP-301 and EP-303.'],
  ['handoff','Next shift should monitor the restored workstation and verify the policy owner completes remediation.'],
]) {get('SocM04IntelligenceUi').mutate(tools.m04,fx.m04,'report-create',{source:'SOC analyst',kind,summary},time());save();}
const result=score.score(state,fixture);
assert.ok(result.score>=70,JSON.stringify(result.criteria.map(c=>[c.id,c.points])));
assert.equal(result.unsafeExecution,false);
const before=JSON.stringify({tools,pins,state});
const replay=bridge.project(tools,pins,state,fixture);
assert.equal(JSON.stringify(replay),JSON.stringify(state),'reprojection is exactly idempotent');
assert.equal(JSON.stringify({tools,pins,state}),before,'projection is pure');
assert.equal(replay.actionHistory.length,state.actionHistory.length);
assert.ok(state.actionHistory.filter(a=>a.details.sourceRef).every(a=>a.details.sourceRef.includes(':')));
// A malicious/imported or future UI response attempt without approval must
// still be range-blocked and cap a previously passing submission.
const unapprovedTools=JSON.parse(JSON.stringify(tools));
unapprovedTools.m09.actionHistory.push({id:'UNAPPROVED-ISOLATE',type:'isolate_endpoint',timestamp:time(),details:{entityId:'ws-118'},outcome:'success'});
let unsafe=bridge.project(unapprovedTools,pins,state,fixture);
assert.equal(unsafe.executions.at(-1).outcome,'blocked');
assert.equal(score.score(unsafe,fixture).safetyCap.points,69);
const noApproval=bridge.project({m09:{actionHistory:[{id:'NO-APPROVAL',type:'isolate_endpoint',timestamp:time(),details:{entityId:'ws-204'},outcome:'success'}]}},{},api.fresh(fixture),fixture);
assert.equal(noApproval.executions[0].outcome,'blocked');
assert.equal(score.score(noApproval,fixture).unsafeExecution,true);
assert.throws(()=>m09.executeApprovedAction(m09.normalize({},fx.m09),'INC-4821',{type:'isolate_endpoint',outcome:'success',details:{entityId:'ws-204'}},time(),fx.m09),/approved target/,'M09 UI API itself rejects missing approval');
// Changing pins removes selections exactly once.
const unpinned=bridge.project(tools,{pins:[]},state,fixture);
assert.equal(unpinned.selectedEvidence.length,0);
assert.equal(bridge.project(tools,{pins:[]},unpinned,fixture).actionHistory.length,unpinned.actionHistory.length);
console.log(`M12 tool bridge: real pack path ${result.score}/100, pure/idempotent replay, scoped approvals, recovery and safety cap passed`);
