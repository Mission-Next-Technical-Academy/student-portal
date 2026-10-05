import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const sandbox = { console, window: {}, React: {} };
vm.createContext(sandbox);
for (const file of ['src/data/labs/security-assessments.labs.js']) {
  vm.runInContext(fs.readFileSync(new URL(file, root), 'utf8'), sandbox, { filename: file });
}
const lab = sandbox.window.MISSION_NEXT_LABS['sa-3'];
assert.equal(lab.title, 'Web Application Security Assessment', 'Title must match the Module 08 card');
assert.equal(lab.exercises.length, 1);
const steps = lab.exercises.flatMap(exercise => exercise.steps);
assert.equal(steps.length, 4);
assert.match(lab.scenario.incident, /authorized AppSec team/);
assert.match(steps[0].instruction, /scanner report/);
assert.match(steps[0].instruction, /access log/);
assert.match(steps[0].hint, /grep/);
assert.equal(steps[0].validation.type, 'commandExecuted');
assert.equal(steps[1].validation.expected, '198.51.100.44');
assert.match(String(steps[2].validation.expected), /customer-facing commerce application/i);
assert.match(String(steps[3].validation.expected), /sql\|500/i);
assert(steps.every(step => !/install|nikto|sqlmap|wapiti|fuzz/i.test(step.instruction)));

const inspector = fs.readFileSync(new URL('src/shells/security-assessments-shells.jsx', root), 'utf8');
const inspectorStart = inspector.indexOf('function TrafficInspectorShell');
const inspectorEnd = inspector.indexOf('function IamMatrixLabShell', inspectorStart);
const inspectorUi = inspector.slice(inspectorStart, inspectorEnd);
assert.match(inspectorUi, /Traffic Inspector — Authorized AppSec Evidence/);
assert.match(inspectorUi, /Authorized testing only/);
assert.doesNotMatch(inspectorUi, /Burp Suite Professional|PortSwigger/);

const saSource = fs.readFileSync(new URL('src/data/sources/sa-3.source.md', root), 'utf8');
assert.match(saSource, /authorized scope/i);
assert.match(saSource, /Do not launch scans/i);
console.log('Web finding check passed (authorized report, log correlation, exposure rationale, neutral inspector UI).');
