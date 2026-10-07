const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context=vm.createContext({console});
for(const file of ['portal/soc-assessment-scorer.js','portal/soc-m12-assessment-data.js','portal/soc-m12-assessment-state.js','portal/soc-m12-assessment-rubric.js','portal/soc-m12-assessment-scorer.js']) vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const fixture=vm.runInContext('SocM12AssessmentData',context);
const stateApi=vm.runInContext('SocM12AssessmentState',context);
const scoreApi=vm.runInContext('SocM12AssessmentScorer',context);
context.SocM12AssessmentConsole={evaluateQuery(query){
  if(query.includes('broad')) return {outcome:'broad',matchedEvidence:['EM-212','EP-301','NW-501','ID-402','EP-303'],rows:[1,2,3,4,5]};
  if(query.includes('narrow')) return {outcome:'narrow',matchedEvidence:['EP-301'],rows:[1]};
  return {outcome:'correlated',matchedEvidence:['EM-212','EP-301','NW-501','ID-402'],rows:[1,2,3,4]};
}};
const record=(state,type,details)=>stateApi.record(state,fixture,type,details);
let empty=stateApi.fresh(fixture);
assert.equal(scoreApi.score(empty,fixture).score,0,'exploration-free empty attempt earns zero');
assert.equal(scoreApi.score(empty,fixture).passed,false);

let partial=empty;
partial=record(partial,'intel-decision',{indicatorId:'TI-601',decision:'malicious',rationale:'Correlated with delivery, execution, and network timing in the incident.'});
partial=record(partial,'query-run',{query:'DeviceProcessEvents | join NetworkSessionEvents'});
const partialScore=scoreApi.score(partial,fixture);
assert(partialScore.score>0&&partialScore.score<70,'meaningful partial work earns partial credit');
assert.equal(partialScore.criteria.reduce((n,c)=>n+c.max,0),100,'rubric totals 100');
assert.equal(partialScore.criteria.find(c=>c.id==='queries-detection-scheduling').points,9,'cross-source alternate query earns partial query credit');

let alternate=empty;
alternate=record(alternate,'query-run',{query:'NetworkSessionEvents | join DeviceProcessEvents on DeviceId'});
let alternativeTwo=empty;
alternativeTwo=record(alternativeTwo,'query-run',{query:'EmailEvents | join ProcessEvents | join NetworkEvents by host/time'});
assert.equal(scoreApi.score(alternate,fixture).criteria[1].points,scoreApi.score(alternativeTwo,fixture).criteria[1].points,'equivalent outcomes do not depend on exact query text');
assert.equal(alternate.queryRuns[0].outcome,'correlated','query result is evaluator-derived, not the supplied outcome field');
const generated=record(empty,'query-run',{query:'correlated query'});
assert.equal(generated.generatedAlerts.length,1,'query results generate a persisted alert');
const reviewedGenerated=record(generated,'review-alert',{alertId:generated.generatedAlerts[0].id,disposition:'true-positive',reason:'Related endpoint and identity evidence supports this alert.'});
assert.equal(reviewedGenerated.alertReviews[generated.generatedAlerts[0].id].disposition,'true-positive','generated alerts can be reviewed');
const linkedGenerated=record(reviewedGenerated,'incident-link',{alertId:generated.generatedAlerts[0].id,incidentId:fixture.scenario.caseId});
assert.equal(linkedGenerated.incidentLinks.length,1,'generated alert links persist against the case');
assert.throws(()=>record(empty,'review-alert',{alertId:'M12-QALERT-999',disposition:'true-positive',reason:'This alert was never generated.'}),/Unknown alert/,
  'the learner cannot invent generated-alert IDs');
let corrected=record(empty,'query-run',{query:'broad first pass'});
corrected=record(corrected,'query-run',{query:'corrected correlated query'});
assert.equal(scoreApi.score(corrected,fixture).criteria[1].points,9,'a corrected broad query earns partial credit without losing all query credit');
const broad=record(empty,'query-run',{query:'broad query'}), narrow=record(empty,'query-run',{query:'narrow query'});
assert.equal(broad.queryRuns[0].outcome,'broad'); assert.equal(narrow.queryRuns[0].outcome,'narrow');
assert.equal(scoreApi.score(broad,fixture).criteria[1].points,0,'broad coverage without precision does not earn query credit');
assert.equal(scoreApi.score(narrow,fixture).criteria[1].points,0,'narrow query with one hit misses required cross-source coverage');

let workflow=empty;
workflow=record(workflow,'workflow-design',{name:'Preserve, approve, contain',nodes:['preserve','approval','isolate'],edges:[{from:'preserve',to:'approval'},{from:'approval',to:'isolate'}]});
assert.equal(scoreApi.score(workflow,fixture).criteria.find(c=>c.id==='tuning-automation-containment').points,7,'the bounded workflow UI action reaches partial automation credit');
// Every node the designer offers can be ticked at once (it used to reject the ninth).
const allNodes=record(empty,'workflow-design',{name:'Every step',nodes:[...fixture.scenario.workflowNodes],edges:[{from:'preserve',to:'approval'},{from:'approval',to:'isolate'}]});
assert.equal(allNodes.workflows.length,1,'a workflow using all offered nodes records');

function buildPassLine(){
  let s=empty;
  s=record(s,'intel-decision',{indicatorId:'TI-601',decision:'malicious',rationale:'Corroborated by delivery, script execution and destination evidence.'});
  s=record(s,'query-run',{query:'UnifiedEvents | where Account == "acct-204"'});
  s=record(s,'rule-save',{ruleId:'RULE-03',query:'UnifiedEvents | join related process and network rows by device and time',outcome:'correlated'});
  s=record(s,'rule-schedule',{ruleId:'RULE-03',frequency:'hourly'});
  for(const alertId of ['AL-1201','AL-1202']) s=record(s,'review-alert',{alertId,disposition:'true-positive',reason:'Correlated source evidence supports incident review.'});
  s=record(s,'incident-link',{alertId:'AL-1201',incidentId:'INC-4821'});
  for(const [domain,finding,evidenceIds] of [
    ['email','EM-212 records a user opened the message before endpoint execution.',['EM-212']],
    ['endpoint','EP-301 shows script execution and EP-303 records persistence.',['EP-301','EP-303']],
    ['identity','ID-402 ties an unfamiliar token refresh to the affected account.',['ID-402']],
    ['network','NW-501 ties the affected workstation to the correlated destination.',['NW-501']],
    ['scope','Confirmed scope includes ws-204 and acct-204; ws-118 remains a benign pivot.',['EP-301','ID-402']],
    ['timeline','Email, process, network, persistence and identity evidence establish event order.',['EM-212','EP-301','NW-501','EP-303','ID-402']],
  ]) s=record(s,'investigation',{domain,finding,evidenceIds});
  for(const evidenceId of fixture.expectedTruth.selectedEvidence) s=record(s,'evidence-select',{evidenceId,selected:true});
  for(const [technique,evidenceIds] of Object.entries(fixture.expectedTruth.attackEvidence)) s=record(s,'attack-map',{technique,evidenceIds});
  return s;
}
const passLine=buildPassLine(), passLineResult=scoreApi.score(passLine,fixture);
assert.equal(passLineResult.score,70,'the five core competencies provide a minimum passing path');
assert.equal(passLineResult.passed,true,'70 points passes');

function buildFull(){
  let s=buildPassLine();
  s=record(s,'workflow-design',{name:'Preserve then approved response',nodes:['preserve','approval','isolate','revoke-session','remove-persistence','restore','scan','monitor'],edges:[{from:'preserve',to:'approval'},{from:'approval',to:'isolate'}]});
  s=record(s,'approval',{action:'isolate',target:'ws-204',approved:true});
  s=record(s,'approval',{action:'revoke-session',target:'acct-204',approved:true});
  s=record(s,'approval',{action:'restore',target:'BK-204-0900',approved:true});
  s=record(s,'execute',{action:'preserve',target:'ws-204'});
  s=record(s,'execute',{action:'isolate',target:'ws-204'});
  s=record(s,'execute',{action:'revoke-session',target:'acct-204'});
  s=record(s,'execute',{action:'block-indicator',target:'203.0.113.72'});
  s=record(s,'recovery',{action:'remove-persistence',target:'ws-204'});
  s=record(s,'recovery',{action:'restore',target:'BK-204-0900'});
  s=record(s,'recovery',{action:'scan',target:'ws-204'});
  s=record(s,'recovery',{action:'monitor',target:'ws-204'});
  s=record(s,'report',{kind:'technical',text:'Confirmed scope is ws-204 and acct-204. The event sequence is supported by the selected primary evidence; one remaining unknown is complete memory analysis.',evidenceIds:['EM-212','EP-301','NW-501']});
  s=record(s,'report',{kind:'executive',text:'Business impact is limited to the confirmed Finance user and workstation. The response decision is to contain and validate recovery before returning service.',evidenceIds:['EM-212','EP-301']});
  s=record(s,'report',{kind:'lessons',text:'Improve the script control from audit-only to enforcement, tune the detection and assign a control owner for follow-up.',evidenceIds:['EP-303']});
  s=record(s,'handoff',{text:'Evening shift: monitor the restored workstation and confirm the endpoint policy owner completed remediation.',openRisks:['policy-remediation','monitoring']});
  s=record(s,'closure',{decision:'retain',rationale:'Keep open until monitoring and the policy-owner action are confirmed.'});
  return s;
}
const full=buildFull(), fullResult=scoreApi.score(full,fixture);
assert.equal(fullResult.score,100,'complete evidence-backed response earns full rubric credit');
assert.equal(fullResult.passed,true);
const noIncident={...full,incidentLinks:[]};
assert.equal(scoreApi.score(noIncident,fixture).criteria[2].points,6,'missing incident association loses alert/incident credit only');
const incompleteRecovery={...full,recovery:full.recovery.filter(x=>x.action!=='monitor')};
assert.equal(scoreApi.score(incompleteRecovery,fixture).criteria[6].points,4,'incomplete recovery earns partial credit');

let unsafe=empty;
unsafe=record(unsafe,'execute',{action:'shutdown-all',target:'enterprise',outcome:'success'});
const unsafeScore=scoreApi.score(unsafe,fixture);
assert.equal(unsafeScore.rawScore,0,'unsafe execution does not itself earn credit');
assert.equal(unsafeScore.score,0);
assert.equal(unsafe.executions[0].outcome,'blocked','the simulated range blocks destructive out-of-scope execution');
assert.equal(unsafeScore.unsafeExecution,false,'a blocked action is not treated as executed');
// Imported legacy execution records still receive the rubric's explicit safety cap.
const legacyUnsafe={...empty,executions:[{action:'shutdown-all',target:'enterprise',outcome:'success'}],actionHistory:[{id:'legacy',type:'execute',details:{action:'shutdown-all',target:'enterprise',outcome:'success'}}]};
assert.equal(scoreApi.score(legacyUnsafe,fixture).unsafeExecution,true,'executed unsafe actions trigger the safety cap');

let badApproval=empty;
badApproval=record(badApproval,'execute',{action:'isolate',target:'acct-091',outcome:'success'});
assert.equal(scoreApi.score(badApproval,fixture).score,0,'bad target earns no credit');
assert.equal(badApproval.executions[0].outcome,'blocked','out-of-scope targets are denied');

const normalized=stateApi.normalize(partial,fixture);
assert.deepEqual(normalized.actionHistory.map(a=>a.id),partial.actionHistory.map(a=>a.id),'action history restores in sequence');
assert.equal(scoreApi.score(normalized,fixture).score,partialScore.score,'restore preserves deterministic scoring');
console.log('M12 capstone rubric and scorer: all checks passed');
