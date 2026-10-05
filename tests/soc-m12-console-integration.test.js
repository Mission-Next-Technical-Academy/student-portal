'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const page = read('portal/index.html');
const pageModule = page.indexOf('soc-analyst-module-12.js');
for (const name of ['soc-m12-assessment-data.js','soc-m12-assessment-state.js','soc-m12-assessment-rubric.js','soc-m12-assessment-scorer.js','soc-m12-assessment-console.js','soc-m12-tool-bridge.js']) {
  assert.ok(page.indexOf(name) >= 0 && page.indexOf(name) < pageModule, `${name} loads before Module 12`);
}
assert.match(read('portal/data.js'), /key: 'lab-capstone-simulator-practice'.*optional: true/);
const context = vm.createContext({ console, registerModuleLab: () => {}, esc: (x) => String(x ?? '') });
for (const file of ['portal/soc-assessment-scorer.js','portal/soc-m12-assessment-data.js','portal/soc-m12-assessment-state.js','portal/soc-m12-assessment-rubric.js','portal/soc-m12-assessment-scorer.js']) {
  vm.runInContext(read(file), context, { filename: file });
}
vm.runInContext(read('portal/kql-engine.js'), context, { filename: 'portal/kql-engine.js' });
context.m03eRow = (source, id, day, time, fields) => ({ EventSource: source, EventId: id, __rid: id, TimeGenerated: `${day}T${time}Z`, ...fields });
context.m03eBuildDataset = ({ caseId, events, identities, ips, watchlists, now }) => ({
  caseId, now, events, identities, ips, watchlists,
  tables: { ...Object.fromEntries([...new Set(events.map((row) => row.EventSource))].map((source) => [source, events.filter((row) => row.EventSource === source)])), UnifiedEvents: events },
});
vm.runInContext(read('portal/soc-m12-assessment-console.js'), context, { filename: 'portal/soc-m12-assessment-console.js' });
assert.equal(vm.runInContext('SocM12AssessmentConsole.dataset().caseId', context), 'INC-4821');
const observed = vm.runInContext('SocM12AssessmentConsole.evaluateQuery("DeviceProcessEvents | where EventId == \\\"EP-301\\\"")', context);
assert.equal(observed.outcome, 'narrow');
assert.deepEqual(Array.from(observed.matchedEvidence), ['EP-301'], 'query outcome and evidence come from MnKql rows');
vm.runInContext(read('portal/attack-catalog.js'), context, { filename: 'portal/attack-catalog.js' });
vm.runInContext(read('portal/case-record.js'), context, { filename: 'portal/case-record.js' });
vm.runInContext(read('portal/soc-analyst-module-12.js'), context, { filename: 'portal/soc-analyst-module-12.js' });
vm.runInContext('moduleTwelveState = moduleTwelveFreshDefaults(); moduleTwelveState.assessmentState = SocM12AssessmentState.fresh(SocM12AssessmentData);', context);
const html = vm.runInContext('moduleTwelveTicketView()', context);
assert.match(html, /id="m12-case-form"/);
assert.match(html, /data-m12-save-case/);
assert.match(html, /data-m12-submit-case/);
for (const name of ['status','severity','affectedUser','affectedDevice','disposition','escalation','notes']) assert.match(html, new RegExp(`name="${name}"`));
for (const name of ['priorityRationale','scopeStatement','executiveSummary','closureNote']) assert.match(html, new RegExp(`<textarea name="finding:${name}"`));
assert.match(html, /minlength="180"/);
assert.match(html, /No response action attempted yet/);
assert.doesNotMatch(html, /data-m12-assessment-action|data-m12-submit-capstone|m12-action-grid|m12-evidence-grid|is-correct|rubric|\d+ of \d+ points/);
const moduleUi = read('portal/soc-analyst-module-12.js');
assert.doesNotMatch(moduleUi, /m12-assessment-section|moduleTwelveAssessment\(|moduleTwelveFindingsHtml\(|MODULE_TWELVE_CONSOLES|MODULE_TWELVE_EVIDENCE|data-m12-hint|data-m12-assessment-action/);
assert.match(moduleUi, /data-m12-open-ticket/);
assert.match(moduleUi, /scrollId: 'm12-ticket'/);
assert.match(read('portal/soc-m12-assessment-console.js'), /caseView:\(\)=>moduleTwelveTicketView\(\)/);
const consoleUi = read('portal/soc-m12-assessment-console.js');
for (const marker of ['data-m12-action="hypothesis"','data-m12-action="handoff"','data-m12-action="closure"','[\'technical\',\'executive\',\'lessons\']','data-m12-report="${kind}"']) {
  assert.ok(consoleUi.includes(marker), `${marker} is available in the cumulative Operations/Reporting workspaces`);
}
const emptyTracker = vm.runInContext('moduleTwelveMissionStatus()', context);
assert.equal((emptyTracker.match(/<span>\d{2}<\/span>/g) || []).length, 12, 'the tracker renders all twelve mission requirements');
assert.doesNotMatch(emptyTracker, /is-seen|· reviewed|· open/, 'mission outcomes never report per-item correctness or visits');
vm.runInContext(`moduleTwelveState.status='pending'; moduleTwelveState.severity='high'; moduleTwelveState.affectedUser='acct-204'; moduleTwelveState.affectedDevice='ws-204'; moduleTwelveState.disposition='true-positive'; moduleTwelveState.escalation='required'; moduleTwelveState.escalateTo='tier2-soc';
moduleTwelveState.notes='EP-301 and ID-402 support the confirmed scope and timeline. '+ 'Technical reasoning with supported sequence and remaining uncertainty. '.repeat(5);
moduleTwelveState.findings={ priorityRationale: 'EP-301 and ID-402 demonstrate concurrent endpoint and identity exposure requiring timely response.', scopeStatement: 'EP-301 and ID-402 identify ws-204 and acct-204. NW-504 bounds the observed scope to the supplied telemetry; remaining devices need monitoring.', executiveSummary: 'The affected user and service require a containment decision. '+ 'Business impact remains bounded while the team preserves evidence and validates recovery. '.repeat(3), closureNote: 'Keep the incident open pending validated recovery and continued monitoring. The incident lead owns the remaining follow-up and residual risk.' };
moduleTwelveSyncTicket();`, context);
const firstCount=vm.runInContext('moduleTwelveState.assessmentState.actionHistory.length',context);
vm.runInContext('moduleTwelveSyncTicket()',context);
assert.equal(vm.runInContext('moduleTwelveState.assessmentState.actionHistory.length',context),firstCount,'unchanged ticket saves do not duplicate actions');
assert.deepEqual(Array.from(vm.runInContext('moduleTwelveState.assessmentState.investigations[0].evidenceIds',context)),['EP-301','ID-402','NW-504']);
assert.equal(vm.runInContext('moduleTwelveState.assessmentState.reports.technical.ticketCore.priorityRationale',context),vm.runInContext('moduleTwelveState.findings.priorityRationale',context));
assert.equal(vm.runInContext('moduleTwelveState.assessmentState.closure.decision',context),'retain');
const rows=vm.runInContext('caseRecordDisplay(moduleTwelveState,moduleTwelveCaseSpec())',context);
assert.equal(rows.find(([label])=>label==='Severity')[1],'High');
assert.ok(rows.find(([label])=>label==='Scope statement')[1].includes('NW-504'));
const app=read('portal/app.js');
vm.runInContext(app.slice(app.indexOf('function adminCaseTicketSubmissionPanel('),app.indexOf('// Same purpose as adminCaseTicketSubmissionPanel()')),context);
context.reviewRow={result:{case_record:vm.runInContext('moduleTwelveState',context),case_display:rows}};
const reviewHtml=vm.runInContext('adminCaseTicketSubmissionPanel(reviewRow)',context);
assert.match(reviewHtml,/Priority rationale|Scope statement|Executive summary|Closure note/);
assert.match(reviewHtml,/whitespace-pre-wrap/);
assert.ok(reviewHtml.includes(context.reviewRow.result.case_record.notes),'full analyst notes remain readable in faculty ticket review');
vm.runInContext('moduleTwelveState.submitted=true',context);
const lockedHtml=vm.runInContext('moduleTwelveTicketView()',context);
assert.match(lockedHtml,/Submitted for faculty review/);
assert.doesNotMatch(lockedHtml,/data-m12-submit-case|data-m12-save-case/);
assert.match(lockedHtml,/<textarea[^>]*disabled/);
console.log('M12 ticket tab contract, action-only requirements, narratives, immutable saves and faculty core review: passed');
