const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const portal = path.join(__dirname, '..', 'portal');
const guideSource = fs.readFileSync(path.join(portal, 'console-guide.js'), 'utf8');
const context = { esc: (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]) };
vm.createContext(context);
vm.runInContext(guideSource, context);
const debrief = context.guidedLabDebrief({
  story: 'The evidence supports a bounded finding.',
  fields: [{ name: 'Affected user', status: 'captured', note: 'acct-428' }, { name: 'Affected device', status: 'contributing' }, { name: 'Disposition', status: 'missed' }],
  handoff: 'Cite the source records, scope, uncertainty, and next owner.',
});
const completeGuide = context.guidedLabGuide('m01', [{ title: 'Submit', body: 'Submit the ticket.' }], {
  step: 0, prefix: 'm01g', submitted: true, debriefHtml: debrief,
});
assert.match(completeGuide, /CONSOLE GUIDE · COMPLETE/);
assert.match(completeGuide, /is-collapsed/);
assert.match(completeGuide, /What the evidence supports/);
assert.match(completeGuide, /Affected user · captured/);
assert.match(completeGuide, /Affected device · contributing/);
assert.match(completeGuide, /Disposition · missed/);
assert.match(completeGuide, /Strong handoff/);
assert.doesNotMatch(completeGuide, /\bpoints?\b|\bscore\b|correct|incorrect/i);

for (let number = 1; number <= 11; number += 1) {
  const id = String(number).padStart(2, '0');
  const mainFile = `soc-analyst-module-${id}.js`;
  const envFile = `soc-analyst-module-${id}-environment.js`;
  const sources = [mainFile, envFile]
    .filter((file) => fs.existsSync(path.join(portal, file)))
    .map((file) => fs.readFileSync(path.join(portal, file), 'utf8'));
  const source = sources.join('\n');
  // M02 is the documented exception (MODULE_STANDARD.md §7.3): its Learn It console walkthrough is the
  // Guided Lab and uses consoleGuideCard; the HR ITSM case is the Assessment Lab (no debrief).
  const m02 = number === 2;
  assert.match(source, m02 ? /consoleGuideCard\(/ : /guidedLabGuide\(/, `M${id} renders the shared guide`);
  if (!m02) {
    assert.match(source, /guidedLabDebrief\(/, `M${id} renders the shared practice debrief`);
    assert.match(source, /contributing/, `M${id} can report contributing evidence in the debrief`);
  }
  assert.doesNotMatch(source, /Launch Guided Lab|Launch Assessment Lab/, `M${id} has no new-tab lab launch buttons`);
  assert.doesNotMatch(source, /target=["']_blank[^>]*>[^<]*(?:Guided|Assessment) Lab/i, `M${id} has no new-tab lab launch link`);
  assert.doesNotMatch(source, /\{ id: 'knowledge-check', title: 'Knowledge Check'/, `M${id} has no redundant Knowledge Check navigation stop`);
  assert.doesNotMatch(source, new RegExp(`id="m${id}-knowledge-(?:check|section)"`), `M${id} has no standalone Knowledge Check card`);
}

const standard = fs.readFileSync(path.join(__dirname, '..', 'docs', 'specs', 'MODULE_STANDARD.md'), 'utf8');
assert.match(standard, /Next is always enabled/);
assert.match(standard, /automatically collapses into the console header\/banner/);
assert.match(standard, /Submitting the ITSM ticket is the only new Guided Lab completion trigger/);

const caseRecord = fs.readFileSync(path.join(portal, 'case-record.js'), 'utf8');
assert.match(caseRecord, /Submitted for faculty review/);
assert.match(caseRecord, /Lab graded/);
assert.doesNotMatch(caseRecord.slice(caseRecord.indexOf('function caseRecordPanel'), caseRecord.indexOf('function caseRecordPane')), /score|points|correct|incorrect/i);

const sharedCss = fs.readFileSync(path.join(portal, 'module-labs.css'), 'utf8');
assert.match(sharedCss, /header \.m02e-learn-tip\{opacity:1;visibility:visible\}/, 'header-docked guides remain visible');
assert.match(sharedCss, /header \.m02e-learn-tip:not\(\.is-collapsed\) \.m02e-tip-body\{display:block\}/, 'header-docked guides can expand');
const m02Environment = fs.readFileSync(path.join(portal, 'soc-analyst-module-02-environment.js'), 'utf8');
assert.match(m02Environment, /ITSM Ticket/);
assert.match(m02Environment, /CASE_ID = 'CASE-025502'/);
assert.doesNotMatch(m02Environment, /DECISION ARTIFACT|data-m02e-practice-submit|IAM-GUIDED-02/);
// The Assessment Lab (HR authorization ITSM case) is the only graded M02 ticket; its pane and submit stay separate.
const m02AssessmentStart = m02Environment.indexOf('function practiceTicketPane()');
const m02AssessmentEnd = m02Environment.indexOf('function restartPracticeLab()', m02AssessmentStart);
assert.ok(m02AssessmentStart >= 0 && m02AssessmentEnd > m02AssessmentStart, 'M02 Assessment Lab ticket renderer remains separate');
const m02AssessmentPanel = m02Environment.slice(m02AssessmentStart, m02AssessmentEnd);
assert.match(m02AssessmentPanel, /caseRecordPane\(cr/);
assert.match(m02AssessmentPanel, /formId: 'm02e-practice-form'/);
assert.match(m02AssessmentPanel, /submitAttr: 'data-m02e-submit-practice'/);
assert.doesNotMatch(m02AssessmentPanel, /guidedLabDebrief|practiceSubmitted: true/, 'M02 Assessment Lab shows no student debrief');
const m02AssessmentSubmitStart = m02Environment.indexOf('function submitProve()');
const m02ShellStart = m02Environment.indexOf('// ------------------------------------------------------------------- Shell', m02AssessmentSubmitStart);
assert.ok(m02AssessmentSubmitStart >= 0 && m02ShellStart > m02AssessmentSubmitStart, 'M02 Assessment Lab submit exists');
const m02AssessmentSubmit = m02Environment.slice(m02AssessmentSubmitStart, m02ShellStart);
assert.match(m02AssessmentSubmit, /caseScore\(cr\)/);
assert.match(m02AssessmentSubmit, /recordLabAttempt\(user, LAB_KEY/);
assert.match(m02AssessmentSubmit, /state\.practice\.caseRecord/);
assert.match(m02Environment, /\$\{practicePanel\(\)\}/, 'M02 page continues to mount Assessment Lab');

const m12 = fs.readFileSync(path.join(portal, 'soc-analyst-module-12.js'), 'utf8');
const feedbackStart = m12.indexOf('function moduleTwelveFeedback()');
const feedbackEnd = m12.indexOf('function moduleTwelveReviewStatus()', feedbackStart);
assert.ok(feedbackStart >= 0 && feedbackEnd > feedbackStart, 'M12 student feedback function exists');
assert.doesNotMatch(m12.slice(feedbackStart, feedbackEnd).replaceAll('m12-score-empty', ''), /score|points|breakdown|feedback\)/i, 'M12 student feedback hides rubric results');
assert.match(m12, /if \(moduleTwelveState\.submitted\) return `<div class="m12-assessment"/);

console.log('Guided Lab console guide rules passed.');
