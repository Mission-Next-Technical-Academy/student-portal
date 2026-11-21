'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const moduleSource = fs.readFileSync(path.join(root, 'portal/soc-analyst-module-11.js'), 'utf8');
const stateSource = fs.readFileSync(path.join(root, 'portal/soc-m11-assessment-state.js'), 'utf8');
const guidedSteps = moduleSource.slice(moduleSource.indexOf('function moduleElevenGuidedSteps()'), moduleSource.indexOf('\nfunction moduleElevenGuidedLabPanel()'));

test('M11 Guided Lab teaches evidence-based lessons and a detection improvement', () => {
  assert.match(guidedSteps, /title: 'Record a lesson and detection improvement'/);
  assert.match(guidedSteps, /repeated GR-04 DNS alerts and their recorded false-positive or benign dispositions/);
  assert.match(guidedSteps, /target: 'form\[data-m11-operation="noise"\]'/);
  assert.match(guidedSteps, /title: 'Assign the lesson and detection follow-up'/);
  assert.match(guidedSteps, /One Lesson learned action and one Detection improvement action, both assigned to detection-content/);
  assert.match(guidedSteps, /target: 'form\[data-m11-operation="followup"\]'/);

  assert.match(moduleSource, /<option value="lesson">Lesson learned<\/option><option value="detection">Detection improvement<\/option>/);
  assert.match(stateSource, /IMPROVEMENT_KINDS = \['lesson', 'detection', 'follow_up'\]/);
  assert.match(stateSource, /type === 'improvement_action'/);
});
