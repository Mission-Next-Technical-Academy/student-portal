const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
// Rubric v3: CASE-124821 with three child incidents. Reuses the v2 perfect
// attempt and adds the per-incident work v3 asks for.
const legacy = vm.createContext({require,console:{log(){}}});
vm.runInContext(fs.readFileSync('tests/soc-m12-assessment-v2.test.js','utf8'),legacy);
const {fixture,stateApi,scoreApi,record,perfect,empty} = vm.runInContext('({fixture,stateApi,scoreApi,record,perfect,empty})',legacy);
const v3 = state => scoreApi.score(state,fixture,{rubricVersion:3});
const points = (result,id) => result.criteria.find(c=>c.id===id).points;
const criterion = (result,id) => result.criteria.find(c=>c.id===id);
// Objects come from the vm realm; compare their JSON shape.
const same = (actual,expected,message) => assert.deepEqual(JSON.parse(JSON.stringify(actual)),expected,message);

const parent = fixture.scenario.parentCase;
assert.equal(parent.id,'CASE-124821');
same(parent.incidents.map(i=>i.id),['INC-4821','INC-4822','INC-4823']);
assert.equal(fixture.scenario.caseId,'INC-4821','legacy incident id is kept for v1/v2 and the M08/M09 packs');

// The v2 perfect attempt is unchanged under v2 and loses only incident work under v3.
assert.equal(scoreApi.score(perfect,fixture,{rubricVersion:2}).score,100);
const before = v3(perfect);
assert.equal(before.rubricVersion,3);
assert.equal(points(before,'alert-incident-management'),2+1+3,'two dispositions, one linked incident, ticket core; no incident resolved');

const resolve = (state,incidentId,disposition,note) => record(state,'incident-update',{incidentId,status:'resolved',disposition,note});
let complete = perfect;
complete = record(complete,'review-alert',{alertId:'AL-1203',disposition:'benign-positive',reason:'BEN-101 shows the approved inventory script on ws-118.'});
complete = record(complete,'incident-link',{alertId:'AL-1202',incidentId:'INC-4822'});
complete = record(complete,'incident-link',{alertId:'AL-1203',incidentId:'INC-4823'});
complete = resolve(complete,'INC-4821','true-positive','EP-301 and NW-501 confirm execution and the outbound connection on ws-204.');
complete = resolve(complete,'INC-4822','true-positive','ID-402 shows the unfamiliar token refresh for acct-204 after the EM-212 click.');
complete = resolve(complete,'INC-4823','benign-positive','BEN-101 shows the approved inventory script; NW-504 finds no matching destination.');
const completeResult = v3(complete);
assert.equal(points(completeResult,'alert-incident-management'),12,JSON.stringify(criterion(completeResult,'alert-incident-management')));
assert.equal(completeResult.score,100);
same(completeResult.reviewArtifact.studentDeterminations.incidents.map(i=>[i.id,i.status,i.disposition]),
  [['INC-4821','resolved','true-positive'],['INC-4822','resolved','true-positive'],['INC-4823','resolved','benign-positive']]);
assert.equal(completeResult.reviewArtifact.studentDeterminations.caseId,'CASE-124821');

// Linking the benign WS-118 alert into the malicious chain costs points.
const wrongLink = record(complete,'incident-link',{alertId:'AL-1203',incidentId:'INC-4821'});
assert.equal(points(v3(wrongLink),'alert-incident-management'),10);
assert(criterion(v3(wrongLink),'alert-incident-management').deductions.some(d=>d.reason.includes('AL-1203: linked to INC-4821')));

// Calling the approved WS-118 activity a true positive costs points and the resolution credit.
const wrongResolution = resolve(complete,'INC-4823','true-positive','BEN-101 and NW-504 were reviewed for the ws-118 script activity.');
assert.equal(points(v3(wrongResolution),'alert-incident-management'),12-1-2);

// A resolution without cited evidence earns no resolution credit.
const uncited = resolve(complete,'INC-4822','true-positive','The account activity looked suspicious so the incident is resolved.');
assert.equal(points(v3(uncited),'alert-incident-management'),11);

// The CASE closes only after every child incident is resolved.
const closeNote = 'Close CASE-124821: ws-204 restored from BK-204-0900, scanned clean and monitored; acct-204 sessions revoked.';
// The base attempt has restored, scanned and monitored ws-204, so only the
// incident state differs between these two closures.
const closedResolved = record(complete,'closure',{decision:'close',rationale:closeNote});
const closedOpen = record(record(perfect,'closure',{decision:'close',rationale:closeNote}),'incident-update',{incidentId:'INC-4821',status:'in-progress',disposition:'',note:'EP-301 under review on ws-204 while recovery is validated.'});
const closureAward = (result) => criterion(result,'reporting-operations-lessons').awards.find(a=>a.reason.startsWith('Closure reasoning')).points;
assert.equal(closureAward(v3(closedResolved)),1,'closing after all incidents are resolved and recovery is validated is supported');
assert.equal(closureAward(v3(closedOpen)),0,'closing while incidents are open is not supported');
assert.equal(closureAward(scoreApi.score(closedOpen,fixture,{rubricVersion:2})),1,'v2 keeps its original closure rule');

// State validation.
assert.throws(()=>record(empty,'incident-update',{incidentId:'INC-9999',status:'resolved',disposition:'true-positive',note:'EP-301 shows execution on ws-204 today.'}),/Unknown incident/);
assert.throws(()=>record(empty,'incident-update',{incidentId:'INC-4821',status:'resolved',disposition:'',note:'EP-301 shows execution on ws-204 today.'}),/final disposition/);
assert.throws(()=>record(empty,'incident-update',{incidentId:'INC-4821',status:'resolved',disposition:'needs-investigation',note:'EP-301 shows execution on ws-204 today.'}),/final disposition/);
const progress = record(empty,'incident-update',{incidentId:'INC-4821',status:'in-progress',disposition:'needs-investigation',note:'EP-301 under review on ws-204.'});
same(progress.incidents['INC-4821'].evidenceIds,['EP-301']);
// The latest update wins and replays from the action log.
const replayed = stateApi.normalize(JSON.parse(JSON.stringify(complete)),fixture);
assert.equal(replayed.incidents['INC-4823'].disposition,'benign-positive');
assert.equal(stateApi.normalize({...complete,rubricVersion:3},fixture).rubricVersion,3);
console.log('soc-m12-assessment-v3: ok');
