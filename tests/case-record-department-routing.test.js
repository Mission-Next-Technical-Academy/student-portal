#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {
  esc: (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]),
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', 'case-record.js'), 'utf8'), context);

for (const escalation of ['', 'not-required', 'required']) {
  const html = vm.runInContext(`caseRecordFields({ status: '', severity: '', affectedUser: '', affectedDevice: '', disposition: '',
    escalation: ${JSON.stringify(escalation)}, escalateTo: '', findings: {} }, {
    departmentOptions: [{ id: 'team-a', text: 'Team A' }, { id: 'team-b', text: 'Team B' }]
  })`, context);
  assert.match(html, /Route to Department \(if escalation is required\)/,
    `the route field is visible before the escalation value is saved (${escalation || 'unset'})`);
  assert.match(html, /Choose a receiving team when you set Escalation required to Required/);
}

console.log('Shared case ticket shows department routing before escalation is saved.');
