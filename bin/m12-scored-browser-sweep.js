#!/usr/bin/env node
// Local, synthetic Chrome acceptance for the M12 submitted ticket and faculty
// review renderer. Persistence functions are stubbed in-page; no learner,
// faculty, or production rows are written.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const BASE = process.env.SWEEP_BASE_URL || 'http://127.0.0.1:8768';
const CHROME = process.env.SWEEP_CHROME || '/usr/bin/google-chrome';
const OUT = process.env.M12_SCREENSHOT_DIR || path.resolve('docs/handoffs/assets');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
fs.mkdirSync(OUT, { recursive: true });

function seedAssessment(pathName) {
  let state = SocM12AssessmentState.fresh(SocM12AssessmentData);
  state.rubricVersion = 2;
  const record = (type, details) => { state = SocM12AssessmentState.record(state, SocM12AssessmentData, type, details); };
  const ticketCore = { status: 'investigating', severity: 'high', affectedUser: 'acct-204', affectedDevice: 'ws-204', disposition: 'true-positive', escalation: 'required', escalateTo: 'tier2-soc' };
  record('review-alert', { alertId: 'AL-1201', disposition: 'true-positive', reason: 'The process and identity evidence correlate.' });
  record('alert-disposition', { alertId: 'AL-1202', disposition: 'true-positive' });
  record('incident-link', { alertId: 'AL-1201', incidentId: 'INC-4821' });
  record('intel-decision', { indicatorId: 'TI-601', decision: 'malicious', rationale: 'NW-501 correlates the destination with ws-204 execution and ID-402 token refresh.' });
  const correlatedQuery = 'union EmailEvents, DeviceProcessEvents, DeviceRegistryEvents, IdentityLogonEvents, NetworkSessionEvents | where EventId in ("EM-212", "EP-301", "EP-303", "ID-402", "NW-501")';
  record('query-run', { query: correlatedQuery, outcome: 'correlated', matchedEvidence: ['EM-212', 'EP-301', 'EP-303', 'ID-402', 'NW-501'] });
  record('rule-save', { ruleId: 'RULE-03', query: correlatedQuery, outcome: 'correlated' });
  record('rule-schedule', { ruleId: 'RULE-03', frequency: 'daily' });
  record('investigation', { domain: 'exposure', finding: 'VX-701 records the audit-only script control on ws-204 and identifies the relevant exposure.', evidenceIds: ['VX-701'] });
  record('investigation', { domain: 'identity', finding: 'ID-402 records an unfamiliar token refresh associated with acct-204.', evidenceIds: ['ID-402'] });
  record('investigation', { domain: 'email', finding: 'EM-212 records delivery and user interaction before endpoint execution.', evidenceIds: ['EM-212'] });
  record('investigation', { domain: 'endpoint', finding: 'EP-301 records script execution and EP-303 records persistence on ws-204.', evidenceIds: ['EP-301', 'EP-303'] });
  record('investigation', { domain: 'network', finding: 'NW-501 records the external destination contacted from ws-204.', evidenceIds: ['NW-501'] });
  record('investigation', { domain: 'scope', finding: 'EP-301 confirms ws-204 and ID-402 confirms acct-204. NW-504 found no second matching host within available source coverage; gaps remain unknown.', evidenceIds: ['EP-301', 'ID-402', 'NW-504'], ticketCore });
  for (const [technique, evidenceIds] of [['T1204.001', ['EM-212']], ['T1059.007', ['EP-301']], ['T1547.001', ['EP-303']], ['T1071.001', ['NW-501']]]) {
    record('attack-map', { technique, evidenceIds, rationale: 'The cited event demonstrates this behavior.' });
  }
  record('workflow-design', { name: 'Preserve, approve, contain, validate', nodes: ['preserve', 'approval', 'isolate'], edges: [{ from: 'preserve', to: 'approval' }, { from: 'approval', to: 'isolate' }] });
  record('approval', { action: 'isolate', target: 'ws-204', approved: true });
  record('approval', { action: 'revoke-session', target: 'acct-204', approved: true });
  record('approval', { action: 'restore', target: 'BK-204-0900', approved: true });
  record('execute', { action: 'preserve', target: 'ws-204' });
  record('execute', { action: 'isolate', target: 'ws-204' });
  record('execute', { action: 'revoke-session', target: 'acct-204' });
  record('execute', { action: 'block-indicator', target: '203.0.113.72' });
  record('recovery', { action: 'remove-persistence', target: 'ws-204' });
  record('recovery', { action: 'restore', target: 'BK-204-0900' });
  record('recovery', { action: 'scan', target: 'ws-204' });
  record('recovery', { action: 'monitor', target: 'ws-204' });
  record('investigation', { domain: 'timeline', finding: 'Reconstructed incident chronology from selected evidence.', evidenceIds: ['EM-212', 'EP-301', 'ID-402'] });
  record('report', { kind: 'technical', text: 'EP-301 and ID-402 connect ws-204 execution with acct-204 token use. EM-212 precedes the execution and NW-501 records the destination. Memory analysis remains uncertain.', evidenceIds: ['EM-212', 'EP-301', 'NW-501'], ticketCore });
  record('report', { kind: 'executive', text: 'EM-212 and EP-301 connect the affected ws-204 workstation to the delivered document. The team preserved evidence and contained the device while recovery validation continues.', evidenceIds: ['EM-212', 'EP-301'], ticketCore });
  record('report', { kind: 'lessons', text: 'VX-701 identifies the audit-only script policy on ws-204. The endpoint control owner will enforce the policy after validation.', evidenceIds: ['VX-701'] });
  record('handoff', { text: 'Evening incident lead: continue clean-scan monitoring on ws-204 and confirm the endpoint policy change with its owner.', openRisks: ['Recovery validation is in progress.'] });
  record('closure', { decision: 'retain', rationale: 'Retain INC-4821 for ws-204 while the policy owner validates enforcement and the evening shift monitors residual risk.', ticketCore });
  const pinIds = pathName === 'click-everything'
    ? SocM12AssessmentData.scenario.evidence.map((item) => item.id)
    : ['EM-212', 'EP-301', 'EP-303', 'ID-402', 'NW-501', 'NW-504', 'VX-701'];
  for (const evidenceId of pinIds) record('evidence-select', { evidenceId, selected: true });

  if (pathName === 'click-everything') {
    for (let index = 0; index < 12; index += 1) record('query-run', { query: `exploratory query ${index + 1}`, outcome: 'other', matchedEvidence: [] });
  }
  if (pathName === 'unsafe-action') record('execute', { action: 'isolate', target: 'ws-118' });
  return state;
}

async function runPath(browser, pathName) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(`${BASE}/?m12-scored-browser-sweep=1#/login`);
  await page.waitForFunction(() => typeof moduleTwelveRender === 'function' && typeof SocM12AssessmentState !== 'undefined');
  const details = await page.evaluate(({ pathName, seedSource }) => {
    const program = PROGRAMS.find((item) => item.slug === 'soc-analyst');
    const user = { id: `m12-${pathName}`, userId: `m12-${pathName}`, email: `${pathName}@example.test`, name: `Synthetic ${pathName}`, remoteVerifiedModuleProgress: {} };
    moduleTwelveUnlocked = () => true;
    moduleTwelveLoad(user, program);
    const makeSeed = (0, eval)(`(${seedSource})`);
    window.__m12NativeLoad = moduleTwelveLoad;
    moduleTwelveState.assessmentState = makeSeed(pathName);
    moduleTwelveSave();
    // Keep this isolated fixture in memory across UI rerenders. Migration and
    // reload behavior are covered by the state-contract tests; this sweep is
    // for score → submission → faculty presentation.
    moduleTwelveLoad = (nextUser, nextProgram) => { moduleTwelveUser = nextUser; moduleTwelveProgram = nextProgram; return moduleTwelveState; };
    // Keep this browser acceptance isolated from all real account services.
    recordLabAttempt = () => Promise.resolve({ id: `synthetic-${pathName}` });
    persistPortfolioArtifact = () => Promise.resolve({ id: `synthetic-artifact-${pathName}` });
    recordCapstoneSubmission = () => Promise.resolve({ id: `synthetic-capstone-${pathName}` });
    markModuleLabComplete = () => {};
    moduleTwelveRender();
    return { actionCount: moduleTwelveState.assessmentState.actionHistory.length };
  }, { pathName, seedSource: seedAssessment.toString() });

  await page.locator('[data-m12-open-ticket]').first().click();
  await page.locator('#m12-case-form').waitFor();
  const selectValues = { status: 'in-progress', severity: 'high', affectedUser: 'acct-204', affectedDevice: 'ws-204', disposition: 'true-positive', escalation: 'required', escalateTo: 'tier2-soc' };
  await page.evaluate((values) => {
    Object.entries(values).forEach(([name, value]) => caseRecordApply(moduleTwelveState, name, value));
    moduleTwelveSave();
    m03eState('m12').tab = 'case';
    moduleTwelveRender();
  }, selectValues);
  await page.locator('[data-m12-open-ticket]').first().click();
  await page.locator('#m12-case-form select[name="escalateTo"]').waitFor({ state: 'visible' });
  const textValues = {
    'finding:priorityRationale': 'EP-301 and ID-402 identify correlated execution and session activity on ws-204 and acct-204, requiring rapid incident response and Tier 2 ownership.',
    'finding:scopeStatement': 'EP-301 confirms ws-204 and ID-402 confirms acct-204. NW-504 found no second matching host in the available network sources; collection gaps remain unknown.',
    'finding:executiveSummary': 'EM-212 and EP-301 connect the affected ws-204 workstation to the delivered document. Evidence was preserved, approved containment was applied, and recovery validation continues under Tier 2 ownership.',
    'finding:closureNote': 'Retain INC-4821 while the endpoint policy owner validates enforcement and the evening shift monitors for residual risk on ws-204.',
    notes: 'EP-301 and ID-402 connect execution on ws-204 with token activity for acct-204. EM-212 precedes the process event, and NW-501 records the matching destination. NW-504 bounds the search but does not prove another host was affected. Evidence was preserved before approved isolation. Recovery validation and policy-owner confirmation remain with the evening incident lead.',
  };
  for (const [name, value] of Object.entries(textValues)) await page.locator(`#m12-case-form textarea[name="${name}"]`).fill(value);
  await page.locator('[data-m12-submit-case]').click();
  try { await page.waitForFunction(() => moduleTwelveState.submitted === true, undefined, { timeout: 5000 }); }
  catch (_) {
    const missing = await page.evaluate(() => ({ visibleMissing: moduleTwelveState.showMissing, missing: caseRecordMissing(moduleTwelveState, moduleTwelveCaseSpec()), actionMissing: moduleTwelveActionMissing(), fields: moduleTwelveState.findings }));
    throw new Error(`${pathName} submit did not finalize: ${JSON.stringify(missing)}`);
  }
  const result = await page.evaluate(() => {
    const user = moduleTwelveUser, program = moduleTwelveProgram;
    moduleTwelveLoad = window.__m12NativeLoad;
    moduleTwelveLoad(user, program); // Rehydrate the synthetic learner from local case storage.
    moduleTwelveRender();
    return { score: moduleTwelveState.score, unsafe: moduleTwelveState.reviewPayload.unsafeExecution, rubricVersion: moduleTwelveState.reviewPayload.rubricVersion, locked: moduleTwelveState.submitted && document.querySelector('#m12-case-form textarea[name="notes"]')?.disabled === true, hasAnswers: Object.hasOwn(moduleTwelveState, 'answers') };
  });
  if (pathName === 'gold' && result.score < 70) {
    const breakdown = await page.evaluate(() => moduleTwelveState.reviewPayload.criteria.map(({ label, points, max, misses }) => ({ label, points, max, misses })));
    throw new Error(`gold path scored ${result.score}: ${JSON.stringify(breakdown)}`);
  }
  if (pathName === 'click-everything' && result.score < 70) throw new Error(`exploration path was penalized: ${result.score}`);
  if (pathName === 'unsafe-action' && (!result.unsafe || result.score > 69)) throw new Error(`unsafe path did not trigger safety cap: ${JSON.stringify(result)}`);
  if (!result.locked || result.hasAnswers || result.rubricVersion !== 2) throw new Error(`submitted ticket did not remain locked, drop retired answers, or use rubric v2: ${JSON.stringify(result)}`);

  await page.locator('[data-m12-open-ticket]').first().click();
  await page.locator('#m12-case-panel').waitFor({ state: 'visible' });
  await page.evaluate(() => [...document.querySelectorAll('body *')]
    .filter((element) => getComputedStyle(element).position === 'fixed')
    .forEach((element) => { element.style.visibility = 'hidden'; }));
  const ticketPath = path.join(OUT, `M12-${pathName}-ticket.png`);
  await page.locator('.m01-console-ticket').screenshot({ path: ticketPath });
  await page.evaluate(() => {
    const spec = moduleTwelveCaseSpec();
    const row = { id: `synthetic-${moduleTwelveUser.id}`, student_id: moduleTwelveUser.name, lab_key: 'lab-soc-capstone', score: moduleTwelveState.score, completed_at: moduleTwelveState.lastSubmittedAt,
      result: { case_display: caseRecordDisplay(moduleTwelveState, spec), notes: moduleTwelveState.notes, reviewPayload: moduleTwelveState.reviewPayload } };
    document.getElementById('app').innerHTML = adminCaseTicketSubmissionPanel(row) + adminCapstoneReviewPanel(row);
  });
  await page.locator('[aria-label="Capstone analyst response and scoring"]').screenshot({ path: path.join(OUT, `M12-${pathName}-faculty-review.png`) });
  if (errors.length) throw new Error(`${pathName} browser errors: ${errors.join(' | ')}`);
  await page.close();
  return { pathName, ...details, ...result, screenshots: [ticketPath, path.join(OUT, `M12-${pathName}-faculty-review.png`)] };
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  try {
    for (const pathName of ['gold', 'click-everything', 'unsafe-action']) {
      const result = await runPath(browser, pathName);
      console.log(`${result.pathName}: score ${result.score}, unsafe=${result.unsafe}, rubric=v${result.rubricVersion}, locked=${result.locked}`);
      result.screenshots.forEach((file) => console.log(`  ${file}`));
    }
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exit(1); });
