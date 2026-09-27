#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const context = {};
vm.createContext(context);
for (const file of [
  'soc-m09-assessment-data.js', 'soc-m08-assessment-data.js', 'soc-m07-assessment-data.js',
  'soc-m06-assessment-data.js', 'soc-m05-assessment-data.js', 'soc-m04-assessment-data.js',
]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', file), 'utf8'), context);
}
const data = vm.runInContext('SocM09AssessmentData', context);
const scenario = data.scenario;
const previous = [
  vm.runInContext('SocM08AssessmentData.scenario', context),
  vm.runInContext('SocM07AssessmentData.scenario', context),
  vm.runInContext('SocM06AssessmentData.scenario', context),
  vm.runInContext('SocM05AssessmentData.scenario', context),
  vm.runInContext('SocM04AssessmentData.scenario', context),
];

assert.strictEqual(data.schemaVersion, 1);
assert.strictEqual(scenario.id, 'M09-ASSESS-2026-09-27');
assert.strictEqual(scenario.stateKey, 'm09-incident-response-assessment-v1');
assert.strictEqual(scenario.fixedAt, scenario.end);
assert.ok(Date.parse(scenario.start) < Date.parse(scenario.end));
assert.strictEqual(scenario.incidentQueue.length, 1);
assert.strictEqual(scenario.incidentQueue[0].id, scenario.incidentGraph.incidentId);
assert.ok(!['status', 'severity', 'assignee', 'tasks'].some((key) => Object.hasOwn(scenario.incidentQueue[0], key)),
  'fixture queue is limited to intake and detail data');
assert.ok(previous.every((item) => item.id !== scenario.id && item.stateKey !== scenario.stateKey),
  'Module 9 scenario and persistence key are independent from M04-M08');

const graph = scenario.incidentGraph;
const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
assert.strictEqual(graph.incidentId, 'INC-4937');
assert.deepStrictEqual(Array.from(nodes.keys()), ['INC-4937', 'ws-173', 'acct-173', 'fs-02']);
assert.strictEqual(data.validateScenario(scenario), true, 'fixture references satisfy the M09 schema');
const entities = new Map(scenario.entities.map((entity) => [entity.id, entity]));
const evidence = new Map(scenario.evidence.map((item) => [item.id, item]));
assert.ok(entities.has('acct-173') && entities.has('DEV-173') && entities.has('session-173-REMOTE')
  && entities.has('backup-ws-173') && entities.has('backup-fs-02'), 'identity, device, session, and backup entities are present');
assert.deepStrictEqual(Array.from(evidence.keys()), ['M09-E11', 'M09-E12', 'M09-E13', 'M09-E14', 'M09-E15', 'M09-E16']);
assert.ok(['persistence_artifact', 'credential_state', 'session_detail', 'backup_state']
  .every((type) => scenario.evidence.some((item) => item.type === type)), 'response evidence covers requested state domains');
assert.ok(scenario.evidence.every((item) => Date.parse(item.time) >= Date.parse(scenario.start)
  && Date.parse(item.time) <= Date.parse(scenario.end)), 'new evidence lies in the fixed scenario window');
assert.ok(scenario.evidence.every((item) => entities.has(item.entityId)
  && item.relatedEntityIds.every((id) => entities.has(id))
  && item.relatedEvidenceIds.every((id) => scenario.sourceEvidenceIds.includes(id) || evidence.has(id))),
'all evidence entity and evidence links resolve');
const outcomes = scenario.actionOutcomeExamples;
assert.deepStrictEqual(Array.from(new Set(outcomes.map((item) => item.outcome))).sort(), ['failure', 'partial', 'success'],
  'action outcome fixtures cover success, failure, and partial results');
assert.ok(outcomes.some((item) => item.signalClass === 'benign') && outcomes.some((item) => item.signalClass === 'noisy'),
  'action examples include benign and noisy context');
assert.ok(outcomes.every((item) => Date.parse(item.time) >= Date.parse(scenario.start)
  && Date.parse(item.time) <= Date.parse(scenario.end) && entities.has(item.entityId)
  && item.evidenceIds.length > 0 && item.evidenceIds.every((id) => scenario.sourceEvidenceIds.includes(id) || evidence.has(id))),
'action outcome timestamps and references resolve within the scenario');
assert.ok(outcomes.every((item) => item.id.startsWith('M09-AO-'))
  && new Set(outcomes.map((item) => item.id)).size === outcomes.length,
'action outcome identifiers are unique and M09-scoped');
assert.ok(scenario.incidentGraph.edges.every((edge) => scenario.sourceEvidenceIds.includes(edge.evidenceId)
  || evidence.has(edge.evidenceId)), 'incident graph links resolve to source or assessment evidence');
assert.strictEqual(new Set([...nodes.keys(), ...graph.edges.map((edge) => edge.id)]).size,
  nodes.size + graph.edges.length, 'graph IDs are unique');
assert.ok(graph.edges.every((edge) => nodes.has(edge.from) && nodes.has(edge.to) && edge.evidenceId.startsWith('M09-E')),
  'incident relationships resolve to graph nodes and existing formative evidence IDs');
assert.strictEqual(data.expectedResponseTruth.priority, 'critical');
assert.deepStrictEqual(Array.from(data.expectedResponseTruth.confirmedImpact), ['ws-173']);
assert.strictEqual(data.expectedResponseTruth.scopeBoundary.broaderCompromise, 'not-established');
assert.strictEqual(data.expectedResponseTruth.scopeBoundary.exfiltration, 'not-established');

// A normal response-state seed carries scenario identity and graph, never answer truth.
const normalState = JSON.stringify({ scenarioId: scenario.id, stateKey: scenario.stateKey, incidentGraph: scenario.incidentGraph });
assert.ok(!normalState.includes('expectedResponseTruth') && !normalState.includes('critical'),
  'normal state projection does not disclose expected response truth');
assert.ok(!Object.keys(scenario).some((key) => /truth|answer|expected/i.test(key)),
  'learner scenario does not expose an answer-key property');

assert.ok(Object.isFrozen(data) && Object.isFrozen(scenario) && Object.isFrozen(graph)
  && Object.isFrozen(scenario.incidentQueue) && Object.isFrozen(scenario.incidentQueue[0])
  && Object.isFrozen(graph.nodes) && Object.isFrozen(graph.nodes[0])
  && Object.isFrozen(graph.edges) && Object.isFrozen(graph.edges[0])
  && Object.isFrozen(data.expectedResponseTruth)
  && Object.isFrozen(data.expectedResponseTruth.responsePrinciples)
  && Object.isFrozen(scenario.entities) && Object.isFrozen(scenario.entities[0])
  && Object.isFrozen(scenario.evidence) && Object.isFrozen(scenario.evidence[0])
  && Object.isFrozen(scenario.evidence[0].relatedEvidenceIds), 'fixture and truth are deeply immutable');
assert.strictEqual(Reflect.set(graph.edges[0], 'relation', 'tampered'), false);
assert.strictEqual(graph.edges[0].relation, 'confirmed_encryption_impact');

const duplicateEntity = JSON.parse(JSON.stringify(scenario));
duplicateEntity.entities[1].id = duplicateEntity.entities[0].id;
assert.strictEqual(data.validateScenario(duplicateEntity), false, 'duplicate entity IDs are rejected');
const danglingQueue = JSON.parse(JSON.stringify(scenario));
danglingQueue.incidentQueue[0].sourceEvidenceId = 'M09-E999';
assert.strictEqual(data.validateScenario(danglingQueue), false, 'queue records with missing source evidence are rejected');
const queueWorkflowLeak = JSON.parse(JSON.stringify(scenario));
queueWorkflowLeak.incidentQueue[0].severity = 'critical';
assert.strictEqual(data.validateScenario(queueWorkflowLeak), false, 'queue fixture excludes later severity workflow');
const danglingEntity = JSON.parse(JSON.stringify(scenario));
danglingEntity.evidence[0].relatedEntityIds.push('ghost-device');
assert.strictEqual(data.validateScenario(danglingEntity), false, 'dangling entity references are rejected');
const danglingEvidence = JSON.parse(JSON.stringify(scenario));
danglingEvidence.evidence[0].relatedEvidenceIds.push('M09-E999');
assert.strictEqual(data.validateScenario(danglingEvidence), false, 'dangling evidence references are rejected');
const outsideWindow = JSON.parse(JSON.stringify(scenario));
outsideWindow.evidence[0].time = '2026-09-27T10:21:00Z';
assert.strictEqual(data.validateScenario(outsideWindow), false, 'out-of-window timestamps are rejected');
const duplicateOutcome = JSON.parse(JSON.stringify(scenario));
duplicateOutcome.actionOutcomeExamples[1].id = duplicateOutcome.actionOutcomeExamples[0].id;
assert.strictEqual(data.validateScenario(duplicateOutcome), false, 'duplicate action outcome IDs are rejected');
const danglingOutcomeEntity = JSON.parse(JSON.stringify(scenario));
danglingOutcomeEntity.actionOutcomeExamples[0].entityId = 'ghost-endpoint';
assert.strictEqual(data.validateScenario(danglingOutcomeEntity), false, 'action outcomes with dangling entities are rejected');
const danglingOutcomeEvidence = JSON.parse(JSON.stringify(scenario));
danglingOutcomeEvidence.actionOutcomeExamples[0].evidenceIds.push('M09-E999');
assert.strictEqual(data.validateScenario(danglingOutcomeEvidence), false, 'action outcomes with dangling evidence are rejected');
const invalidOutcome = JSON.parse(JSON.stringify(scenario));
invalidOutcome.actionOutcomeExamples[0].outcome = 'complete';
assert.strictEqual(data.validateScenario(invalidOutcome), false, 'unknown action outcome values are rejected');
const duplicateRecoveryPoint = JSON.parse(JSON.stringify(scenario));
duplicateRecoveryPoint.backups[1].recoveryPointId = duplicateRecoveryPoint.backups[0].recoveryPointId;
assert.strictEqual(data.validateScenario(duplicateRecoveryPoint), false, 'duplicate recovery point IDs are rejected');
const danglingBackupEvidence = JSON.parse(JSON.stringify(scenario));
danglingBackupEvidence.backups[0].evidenceId = 'M09-E999';
assert.strictEqual(data.validateScenario(danglingBackupEvidence), false, 'backup records require linked evidence');
const inconsistentBackupIntegrity = JSON.parse(JSON.stringify(scenario));
inconsistentBackupIntegrity.backups[0].integrity = 'unverified';
assert.strictEqual(data.validateScenario(inconsistentBackupIntegrity), false, 'known-good backups require verified integrity');
const outsideOutcomeWindow = JSON.parse(JSON.stringify(scenario));
outsideOutcomeWindow.actionOutcomeExamples[0].time = '2026-09-27T10:21:00Z';
assert.strictEqual(data.validateScenario(outsideOutcomeWindow), false, 'out-of-window action timestamps are rejected');
assert.ok(previous.every((item) => !item.actionOutcomeExamples
  && !(item.entities || []).some((entity) => outcomes.some((outcome) => outcome.entityId === entity.id))),
'M09 action outcome fixtures remain isolated from M04-M08 fixture schemas and entities');
assert.ok(Object.isFrozen(scenario.actionOutcomeExamples) && Object.isFrozen(outcomes[0])
  && Object.isFrozen(outcomes[0].evidenceIds), 'action outcome fixtures are deeply immutable');

console.log('M09 assessment data contract tests passed.');
