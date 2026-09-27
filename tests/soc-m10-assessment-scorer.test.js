#!/usr/bin/env node
// Builds Module 10 locker/reconstruction states only through the state
// transitions the workspaces call, then scores them.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const portal = path.join(__dirname, '..', 'portal');
const store = new Map();
const context = {
  console, setTimeout: () => 0, clearTimeout: () => {},
  localStorage: { getItem: (key) => (store.has(key) ? store.get(key) : null), setItem: (key, value) => store.set(key, String(value)), removeItem: (key) => store.delete(key) },
};
vm.createContext(context);
for (const file of ['lab-runtime.js', 'soc-assessment-scorer.js', 'soc-m10-assessment-data.js', 'soc-m10-assessment-state.js', 'soc-m10-assessment-rubric.js', 'soc-m10-assessment-scorer.js']) {
  vm.runInContext(fs.readFileSync(path.join(portal, file), 'utf8'), context, { filename: file });
}
const { api, fixture, scorer } = vm.runInContext('({ api: SocM10AssessmentState, fixture: SocM10AssessmentData, scorer: SocM10AssessmentScorer })', context);
const artifact = (id) => fixture.scenario.artifacts.find((item) => item.id === id);
let clock = Date.parse(fixture.scenario.request.receivedAt);
const at = () => { clock += 30000; return new Date(clock).toISOString(); };
const plain = (value) => JSON.parse(JSON.stringify(value));

assert.ok(Object.isFrozen(fixture) && Object.isFrozen(fixture.scenario.artifacts[0]), 'fixture is immutable');
assert.strictEqual(new Set(fixture.scenario.artifacts.map((item) => item.id)).size, fixture.scenario.artifacts.length, 'artifact ids are unique');
assert.ok(fixture.expectedTruth.chain.every((id, index, chain) => index === 0 || artifact(chain[index - 1]).time <= artifact(id).time), 'truth chain is chronological');

const empty = scorer.score(api.normalize({}, fixture), fixture);
assert.strictEqual(empty.score, 0, 'no locker work earns no credit');

const user = { id: 'm10-learner', email: 'm10@example.test' };
context.testUser = user;
let state = plain(vm.runInContext('SocM10AssessmentState.load(testUser, SocM10AssessmentData)', context));
for (const id of ['ART-01', 'ART-02', 'ART-03', 'ART-04', 'ART-05', 'ART-07', 'ART-09']) {
  state = api.intake(state, fixture, { artifactId: id, source: artifact(id).source, method: artifact(id).methods[0], acquiredBy: 'soc-analyst' }, at());
  state = api.verify(state, fixture, id, at());
}
assert.strictEqual(state.locker['ART-03'].integrity, 'mismatch', 'the truncated process-log export fails verification');
assert.throws(() => api.transfer(state, fixture, { artifactId: 'ART-03', to: 'df-custodian', reason: 'x' }, at()), /Verify/, 'a failed copy cannot change custody');
const detectedOnly = scorer.score(state, fixture);
state = api.reacquire(state, fixture, 'ART-03', at());
state = api.verify(state, fixture, 'ART-03', at());
assert.strictEqual(state.locker['ART-03'].integrity, 'verified', 'the re-acquired export verifies');
assert.strictEqual(state.actionHistory.filter((action) => action.type === 'verify' && action.details.artifactId === 'ART-03').length, 2, 'the failed verification stays in history');
assert.throws(() => api.reacquire(state, fixture, 'ART-09', at()), /Only an acquisition that failed/);
state = api.note(state, fixture, { artifactId: 'ART-02', text: 'Hash matches the email attachment.' }, at());
assert.strictEqual(state.locker['ART-02'].recordedHash, artifact('ART-02').sourceHash, 'analyst notes never modify the original record');
state = api.transfer(state, fixture, { artifactId: 'ART-09', to: 'df-custodian', reason: 'Memory analysis needs the forensics team.' }, at());
state = api.hold(state, fixture, { artifactIds: ['ART-01', 'ART-02', 'ART-04', 'ART-07'], reason: 'Legal hold on originals.' }, at());
state = api.exportPackage(state, fixture, at());
state = api.setTimeline(state, fixture, ['ART-01', 'ART-02', 'ART-03', 'ART-04', 'ART-05', 'ART-07'], at());
state = api.statement(state, fixture, { kind: 'fact', text: 'j.sanders received Q3_Remittance.docm at 08:41.', artifactIds: ['ART-01'] }, at());
state = api.statement(state, fixture, { kind: 'fact', text: 'WINWORD.EXE started powershell.exe with an encoded command at 08:45.', artifactIds: ['ART-03'] }, at());
state = api.statement(state, fixture, { kind: 'fact', text: 'A Run key named svchelp was created at 08:46.', artifactIds: ['ART-05'] }, at());
state = api.statement(state, fixture, { kind: 'analysis', text: 'The macro-enabled attachment most likely launched the PowerShell stage that installed persistence.', artifactIds: ['ART-02', 'ART-03', 'ART-05'] }, at());
state = api.statement(state, fixture, { kind: 'root_cause', text: 'j.sanders opened the malicious macro-enabled attachment, which executed PowerShell.', artifactIds: ['ART-01', 'ART-02', 'ART-03'] }, at());
state = api.unknown(state, fixture, { topic: 'exfiltration', text: 'Staging archive recovered; no transfer evidence.' }, at());
state = api.unknown(state, fixture, { topic: 'memory', text: 'Memory contents are not yet analysed.' }, at());
state = api.escalate(state, fixture, { route: 'digital-forensics', reason: 'Memory analysis and exfiltration confirmation.', artifactIds: ['ART-09'] }, at());
const mappings = [
  { tacticId: 'TA0001', techniqueId: 'T1566.001', status: 'supported', eventIds: ['ART-01', 'ART-02'] },
  { tacticId: 'TA0003', techniqueId: 'T1547.001', status: 'supported', eventIds: ['ART-05'] },
  { tacticId: 'TA0010', techniqueId: 'T1567', status: 'unsupported', eventIds: ['ART-08'] },
];
const full = scorer.score(state, fixture, { mappings });
assert.strictEqual(full.score, 100, `a complete, supported reconstruction earns full credit: ${JSON.stringify(plain(full.criteria).map((c) => [c.id, c.points]))}`);
assert.ok(detectedOnly.criteria.find((c) => c.id === 'hash-integrity').points < 10, 'detecting the mismatch without resolving it is partial');
assert.deepStrictEqual(plain(scorer.score(state, fixture, { mappings })), plain(full), 'scoring is deterministic');
assert.strictEqual(scorer.score(state, fixture, { mappings: [...mappings, { techniqueId: 'T1567', status: 'supported', eventIds: ['ART-07'] }] }).criteria.find((c) => c.id === 'attack-linkage').points, 0, 'mapping unevidenced exfiltration loses ATT&CK credit');

const overclaim = api.statement(state, fixture, { kind: 'analysis', text: 'Exfiltration confirmed from the staging archive.', artifactIds: ['ART-07'] }, at());
const capped = scorer.score(overclaim, fixture, { mappings });
assert.ok(capped.score <= scorer.SAFETY_CAP && capped.passed === false, 'claiming unevidenced exfiltration caps the score');
const speculativeFact = api.statement(state, fixture, { kind: 'fact', text: 'The attacker probably stole finance data.', artifactIds: ['ART-07'] }, at());
assert.strictEqual(scorer.score(speculativeFact, fixture, { mappings }).criteria.find((c) => c.id === 'fact-analysis').points, 5, 'interpretation recorded as fact loses full credit');

context.saved = state;
vm.runInContext('SocM10AssessmentState.save(testUser, saved, SocM10AssessmentData)', context);
const restored = plain(vm.runInContext('SocM10AssessmentState.load(testUser, SocM10AssessmentData)', context));
assert.strictEqual(restored.actionHistory.length, state.actionHistory.length, 'locker state survives a LabRuntime round trip');
assert.strictEqual(restored.locker['ART-09'].custodian, 'df-custodian');
const reset = api.reset(user, fixture);
assert.ok(reset.labId && reset.anonymousStudentId, 'reset retains LabRuntime identity fields for subsequent work');
const afterReset = api.intake(reset, fixture, { artifactId: 'ART-01', source: artifact('ART-01').source, method: artifact('ART-01').methods[0], acquiredBy: 'soc-analyst' }, at());
api.save(user, afterReset, fixture);
assert.ok(api.load(user, fixture).locker['ART-01'], 'a state transition after reset persists through LabRuntime');
console.log('M10 evidence locker assessment: all checks passed');
