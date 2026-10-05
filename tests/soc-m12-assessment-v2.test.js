const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
// Reuse the historical investigations without changing any v1 fixture/assertion.
const legacy = vm.createContext({require,console:{log(){}}});
vm.runInContext(fs.readFileSync('tests/soc-m12-assessment-scorer.test.js','utf8'),legacy);
const {fixture,stateApi,scoreApi,record,full,empty,fullResult,passLineResult} = vm.runInContext('({fixture,stateApi,scoreApi,record,full,empty,fullResult,passLineResult})',legacy);
const score = state => scoreApi.score(state,fixture,{rubricVersion:2});
const points = (result,id) => result.criteria.find(c=>c.id===id).points;
const core={status:'investigating',severity:'high',affectedUser:'acct-204',affectedDevice:'ws-204',disposition:'true-positive',escalation:'yes',escalateTo:'tier2',priorityRationale:'EP-301 and ID-402 identify execution and session activity requiring rapid incident response.'};
let perfect=record(full,'intel-decision',{indicatorId:'TI-601',decision:'malicious',rationale:'NW-501 correlates the destination with ws-204 execution and ID-402 token refresh.'});
perfect=record(perfect,'investigation',{domain:'exposure',finding:'VX-701 records the audit-only script control on ws-204 and identifies the relevant exposure.',evidenceIds:['VX-701']});
perfect=record(perfect,'investigation',{domain:'scope',finding:'EP-301 confirms ws-204 and ID-402 confirms acct-204. NW-504 found no second matching host within available source coverage; gaps remain unknown.',evidenceIds:['EP-301','ID-402','NW-504'],ticketCore:core});
perfect=record(perfect,'report',{kind:'technical',text:'EP-301 and ID-402 connect ws-204 execution with acct-204 token use. EM-212 precedes the execution and NW-501 records the destination. Memory analysis remains uncertain.',evidenceIds:['EM-212','EP-301','NW-501'],ticketCore:core});
perfect=record(perfect,'report',{kind:'executive',text:'EM-212 and EP-301 connect the affected ws-204 workstation to the delivered document. The team preserved evidence and contained the device while recovery validation continues.',evidenceIds:['EM-212','EP-301'],ticketCore:core});
perfect=record(perfect,'report',{kind:'lessons',text:'VX-701 identifies the audit-only script policy on ws-204. The endpoint control owner will enforce the policy after validation.',evidenceIds:['VX-701']});
perfect=record(perfect,'closure',{decision:'retain',rationale:'Retain INC-4821 for ws-204 while the policy owner validates enforcement and the evening shift monitors residual risk.',ticketCore:core});
const perfectResult=score(perfect);
assert.equal(perfectResult.rubricVersion,2);
assert.equal(perfectResult.score,100,JSON.stringify(perfectResult.criteria));
// Secondary scope/network evidence demonstrates real partial competency.
let secondary=record(empty,'investigation',{domain:'network',finding:'NW-504 records no second device matching both indicators within the available telemetry, with endpoint collection gaps.',evidenceIds:['NW-504']});
secondary=record(secondary,'investigation',{domain:'scope',finding:'NW-504 supports a bounded negative finding; no second matching device is confirmed within the available network sources.',evidenceIds:['NW-504']});
secondary=record(secondary,'evidence-select',{evidenceId:'NW-504',selected:true});
const secondaryResult=score(secondary);
assert(points(secondaryResult,'cross-domain-investigation')>0);
assert(points(secondaryResult,'timeline-scope-evidence-attack')>0);
assert(secondaryResult.score>0&&secondaryResult.score<70);
// Equivalent meaningful actions, reordered with different exploration, receive equal credit.
let alternate=empty;
const meaningful=perfect.actionHistory.filter(a=>!['investigation','evidence-select','attack-map','query-run'].includes(a.type));
const investigationActions=perfect.actionHistory.filter(a=>['investigation','evidence-select','attack-map','query-run'].includes(a.type));
for(const a of [...investigationActions.slice().reverse(),...meaningful]) alternate=record(alternate,a.type,a.details);
assert.equal(score(alternate).score,perfectResult.score);
let explored=perfect;
for(const evidence of fixture.scenario.evidence) explored=record(explored,'evidence-select',{evidenceId:evidence.id,selected:true});
for(let i=0;i<12;i++) explored=record(explored,'query-run',{query:'broad exploratory query '+i});
assert.equal(score(explored).score,perfectResult.score,'extra queries/pins never penalize correct conclusions');
assert.equal(score({...explored,openedRows:fixture.scenario.evidence.map(e=>e.id)}).score,perfectResult.score);
// Explicit contradictions reduce the affected competency, not unrelated exploration.
const badIntel=record(perfect,'intel-decision',{indicatorId:'TI-603',decision:'malicious',rationale:'NW-504 proves ws-118 has a malicious destination and should be contained.'});
assert(points(score(badIntel),'intelligence-preparation')<points(perfectResult,'intelligence-preparation'));
const badScope=record(perfect,'investigation',{domain:'scope',finding:'Confirmed affected scope includes ws-118 and acct-091; both are compromised.',entityIds:['ws-118','acct-091'],evidenceIds:['BEN-101','NW-504']});
assert(points(score(badScope),'timeline-scope-evidence-attack')<points(perfectResult,'timeline-scope-evidence-attack'));
const badFinding=record(perfect,'investigation',{domain:'endpoint',finding:'BEN-101 confirms malicious execution and compromise of ws-118.',evidenceIds:['BEN-101']});
assert(points(score(badFinding),'cross-domain-investigation')<points(perfectResult,'cross-domain-investigation'));
assert.equal(points(score(badFinding),'queries-detection-scheduling'),18);
// Technical work survives weak documentation; polished unsupported writing cannot earn technical points.
const weakWriting={...perfect,reports:{},handoffs:[],closure:null};
assert.equal(score(weakWriting).score,92);
let polished=record(empty,'report',{kind:'technical',text:'Confirmed scope, sequence, timeline, business impact, detection and control improvements are thoroughly documented. The investigation demonstrates outstanding technical judgment and a comprehensive response.',evidenceIds:[]});
polished=record(polished,'report',{kind:'executive',text:'The business impact and service decision are professionally communicated with a polished and actionable summary for leadership and follow-up owners.',evidenceIds:[]});
assert.equal(score(polished).score,1,'communication credit only');
// Citing every record in conclusions is not an investigation, even with convincing prose.
let everything=empty;
const allIds=fixture.scenario.evidence.map(e=>e.id);
for(const id of allIds) everything=record(everything,'evidence-select',{evidenceId:id,selected:true});
for(const domain of ['email','identity','endpoint','network','exposure','scope','timeline']) everything=record(everything,'investigation',{domain,finding:'All records prove malicious activity. Confirmed affected scope includes ws-204, acct-204, ws-118 and acct-091. '+allIds.slice(0,35).join(' '),evidenceIds:allIds});
for(const i of fixture.scenario.intelligence) everything=record(everything,'intel-decision',{indicatorId:i.id,decision:'malicious',rationale:'NW-501 EP-301 NW-504 all indicate malicious activity across every asset.'});
everything=record(everything,'report',{kind:'technical',text:'All evidence confirms broad malicious activity and business impact. Every device is affected and all records support this comprehensive technical conclusion.',evidenceIds:allIds});
assert(score(everything).score<70);
// Timeline requires chronology and pins, not just three arbitrary references.
const withoutTimeline={...perfect,investigations:perfect.investigations.filter(i=>i.domain!=='timeline')};
const reversed=record(withoutTimeline,'investigation',{domain:'timeline',finding:'Reconstructed case sequence from selected evidence.',evidenceIds:['ID-402','EP-301','EM-212']});
// record() replays history, so remove the earlier timeline action as well.
const reversedOnly={...reversed,investigations:reversed.investigations.filter(i=>i.domain!=='timeline').concat([{domain:'timeline',finding:'Reconstructed sequence',evidenceIds:['ID-402','EP-301','EM-212']}])};
assert.equal(points(score(reversedOnly),'timeline-scope-evidence-attack'),9);
assert.equal(points(score({...perfect,selectedEvidence:[]}), 'timeline-scope-evidence-attack'),6);
for(const details of [{action:'isolate',target:'acct-091'},{action:'shutdown-all',target:'enterprise'}]) {
 const unsafe=record(perfect,'execute',details), result=score(unsafe);
 assert(result.unsafeExecution); assert(result.score<=69); assert.equal(result.safetyCap.points,69);
}
let unapproved=record(empty,'execute',{action:'isolate',target:'ws-204'});
for(const a of perfect.actionHistory) unapproved=record(unapproved,a.type,a.details);
assert(score(unapproved).score<=69,'later approval cannot erase an unsafe attempt');
// Review contract includes readable full writing and all mandatory evidence; actual renderer remains S5 owner gap.
const review=perfectResult.reviewArtifact;
assert(review.studentDeterminations.findings.length>0);
assert(review.studentActions.some(a=>a.type==='execute'));
assert.equal(review.competencyResults.length,8);
assert(review.scoreExplanation.every(x=>typeof x==='string'));
assert.equal(review.studentResponses.find(r=>r.kind==='technical').text,perfect.reports.technical.text);
assert.equal(review.studentResponses.find(r=>r.kind==='executive').text,perfect.reports.executive.text);
assert.equal(review.instructorReviewStatus,'needs_review');
// Historical v1 behavior and payload are unchanged, including explicit v1 override.
assert.deepEqual(scoreApi.score(full,fixture,{rubricVersion:1}),fullResult);
assert.equal(fullResult.score,100); assert.equal(passLineResult.score,70);
assert.equal(scoreApi.score(full,fixture).rubricVersion,1);
console.log('M12 v2: eight assessment scenarios, timeline, cite-everything, safety and frozen v1 checks passed; review artifact contract passed.');
