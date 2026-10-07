'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = vm.createContext({ console, Date, Object, Array, Map, Set, JSON, Number, String, RegExp });
for (const file of ['portal/soc-m09-assessment-data.js', 'portal/soc-m09-assessment-rubric.js']) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
}
const { data, rubric } = vm.runInContext(`({ data: SocM09AssessmentData, rubric: SocM09AssessmentRubric })`, context);
const fixture = data;
const result = rubric.extract({}, fixture);
assert.equal(result.criteria.length, rubric.RUBRIC.length);
assert.deepEqual(Array.from(result.criteria.map((item) => item.finding)), Array(rubric.RUBRIC.length).fill('unknown'));
assert.equal(rubric.RUBRIC.length, 11, 'M09 v3 grades the original nine plus workflow design and safe conduct');
assert.equal(rubric.RUBRIC_V2.length, 9, 'the original nine-criterion rubric stays reproducible');
assert.equal(rubric.extract({}, fixture, { rubricVersion: 2 }).criteria.length, 9);
assert.ok(result.criteria.every((item) => !Object.hasOwn(item, 'points') && !Object.hasOwn(item, 'awarded')),
  'extraction reports evidence only, never scores or awards');
assert.ok(!JSON.stringify(result).includes('expectedResponseTruth'), 'extraction does not expose hidden truth');

const state = {
  reviewedEvidenceIds: ['M09-E01', 'M09-E09', 'M99-FOREIGN'],
  incidentWorkflows: { 'INC-4937': { severity: 'critical', assigneeId: 'ir-lead-owners' } },
  workflowHistory: [
    { id: 'wf-1', incidentId: 'INC-4937', field: 'severity', value: 'critical' },
    { id: 'wf-2', incidentId: 'INC-4937', field: 'assigneeId', value: 'ir-lead-owners' },
  ],
  incidentMembership: ['ws-173', 'foreign-entity'],
  incidentRelationships: [{ from: 'INC-4937', to: 'ws-173', evidenceId: 'M09-E01' },
    { from: 'INC-4937', to: 'foreign-entity', evidenceId: 'M09-E99' }],
  actionHistory: [], entityStates: {},
};
const before = JSON.stringify(state);
const extracted = rubric.extract(state, fixture);
const byId = new Map(extracted.criteria.map((item) => [item.id, item]));
assert.equal(byId.get('triage-and-ownership').finding, 'observed');
assert.deepEqual(Array.from(byId.get('evidence-and-scope').evidenceIds), ['M09-E01', 'M09-E09']);
assert.ok(byId.get('evidence-and-scope').evidenceIds.every((id) => data.scenario.sourceEvidenceIds.includes(id)
  || data.scenario.evidence.some((item) => item.id === id)), 'foreign evidence claims are excluded');
assert.equal(JSON.stringify(state), before, 'extractor does not mutate saved state');
const validAction = { id: `${data.scenario.id}:ACTION-000001`, sequence: 1, type: 'disable_identity', outcome: 'success',
  timestamp: '2026-09-27T10:16:00.000Z', details: { incidentId: 'INC-4937', entityId: 'acct-173',
    approval: { incidentId: 'INC-4937', actionType: 'disable_identity', targetId: 'acct-173',
      approverId: 'ir-lead-1', reason: 'Contain confirmed risk.' }, evidenceIds: ['M09-E06', 'M99-FOREIGN'],
    effects: [{ entityId: 'acct-173', field: 'disabled', value: true }] } };
const actedState = { actionHistory: [validAction], entityStates: { 'acct-173': { disabled: true } } };
const actionExtract = rubric.extract(actedState, fixture);
const actionCriteria = new Map(actionExtract.criteria.map((item) => [item.id, item]));
assert.equal(actionCriteria.get('approval-and-containment').finding, 'observed');
assert.equal(actionCriteria.get('outcome-verification').finding, 'observed');
assert.deepEqual(Array.from(actionCriteria.get('approval-and-containment').evidenceIds), ['M09-E06']);
assert.equal(actionCriteria.get('approval-and-containment').actionIds[0], validAction.id);
const tamperedState = { ...actedState, entityStates: { 'acct-173': { disabled: false } } };
assert.equal(new Map(rubric.extract(tamperedState, fixture).criteria.map((item) => [item.id, item]))
  .get('outcome-verification').finding, 'unknown', 'effect claims without matching persisted state are not supported');
assert.equal(rubric.extract({ actionHistory: [{ ...validAction, id: 'forged' }] }, fixture)
  .criteria.find((item) => item.id === 'approval-and-containment').finding, 'unknown',
  'malformed/unsequenced actions cannot support a response claim');
assert.equal(rubric.extract(state, null).criteria.length, rubric.RUBRIC.length);

console.log('M09 rubric extraction tests passed');
