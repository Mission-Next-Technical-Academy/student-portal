#!/usr/bin/env node
// Module 04 indicator verdicts (capstone skill backfill, gap A): Practice It guidance, Prove It scoring,
// persistence, backward compatibility, and the instructor review card. Plain assert script like its siblings.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const portal = path.join(__dirname, '..', 'portal');
const read = (file) => fs.readFileSync(path.join(portal, file), 'utf8');
const context = { URL, FormData };
vm.createContext(context);
for (const file of ['soc-assessment-scorer.js', 'soc-m04-assessment-data.js', 'soc-m04-assessment-state.js', 'soc-m04-assessment-actions.js', 'soc-m04-intelligence-ui.js', 'soc-m04-assessment-rubric.js', 'soc-m04-assessment-scorer.js']) {
  vm.runInContext(read(file), context, { filename: file });
}
const get = (name) => vm.runInContext(name, context);
const ui = get('SocM04IntelligenceUi');
const rubric = get('SocM04AssessmentRubric');
const scorer = get('SocM04AssessmentScorer');
const stateApi = get('SocM04AssessmentState');
const fixture = get('SocM04AssessmentData');
const local = (value) => JSON.parse(JSON.stringify(value));
const truth = fixture.scenario.truth;
const stamp = '2026-09-24T09:30:00Z';

const RATIONALE = {
  'M04-I-001': 'Five accounts failed from this address within five minutes and acct-44 then signed in (M04-A-006).',
  'M04-C-001': 'acct-17 retries follow the CR-204 credential rotation and succeeded later (M04-A-121).',
  'M04-I-002': 'No sign-in or application record in this case mentions this address.',
  'M04-I-003': 'Expired indicator and nothing in this case touches this domain.',
};
const verdicts = (decisions, rationales = RATIONALE) => Object.fromEntries(Object.entries(decisions).map(([id, decision]) => [id, { decision, rationale: rationales[id] ?? RATIONALE[id], recordedAt: stamp }]));
const PERFECT = { 'M04-I-001': 'malicious', 'M04-C-001': 'benign', 'M04-I-002': 'unknown', 'M04-I-003': 'unknown' };
const verdictCriterion = (assessment) => scorer.score({ assessment }, fixture).criteria.find((c) => c.id === 'intelligence-verdicts');

// ---- Data contract ----------------------------------------------------------------------------------------------
{
  const ids = fixture.scenario.verdictIndicators.map((i) => i.id);
  assert.deepStrictEqual(local(ids.slice().sort()), local(Object.keys(truth.indicatorDecisions).sort()));
  assert.strictEqual(Object.values(truth.indicatorPoints).reduce((a, b) => a + b, 0), 10, 'verdict points fill the 10-point criterion');
  const decisions = Object.values(truth.indicatorDecisions);
  assert(decisions.includes('malicious') && decisions.includes('benign') && decisions.includes('unknown'), 'all three verdicts are exercised');
  const known = new Set([...fixture.scenario.telemetry.map((r) => r.id), ...fixture.scenario.reports.map((r) => r.id), ...truth.benignBackgroundEventIds]);
  const entities = new Set(['CR-204', ...fixture.scenario.telemetry.map((r) => r.account)]);
  for (const [id, tokens] of Object.entries(truth.indicatorEvidence)) {
    assert(tokens.every((t) => known.has(t) || entities.has(t)), `${id} evidence tokens resolve to scenario records or entities`);
    if (truth.indicatorDecisions[id] === 'unknown') assert.strictEqual(tokens.length, 0, `${id}: unknown means the case holds no evidence`);
    else assert(tokens.length > 0);
  }
  assert(Object.isFrozen(truth.indicatorDecisions) && Object.isFrozen(fixture.scenario.verdictIndicators));
  assert(fixture.scenario.verdictIndicators.every((i) => i.value && i.type && i.origin && i.context));
  assert.strictEqual(fixture.scenario.iocs.length, 3, 'the feed IOC list itself is unchanged');
}

// ---- recordVerdict ------------------------------------------------------------------------------------------------
{
  const a = {};
  assert.throws(() => ui.recordVerdict(a, fixture, 'nope', 'malicious', RATIONALE['M04-I-001'], stamp), /indicator/i);
  assert.throws(() => ui.recordVerdict(a, fixture, 'M04-I-001', 'guilty', RATIONALE['M04-I-001'], stamp), /malicious, benign, or unknown/);
  assert.throws(() => ui.recordVerdict(a, fixture, 'M04-I-001', 'malicious', 'too short', stamp), /at least 25/);
  assert.throws(() => ui.recordVerdict(a, fixture, 'M04-I-001', 'malicious', 'x'.repeat(1001), stamp), /under 1000/);
  assert.throws(() => ui.recordVerdict(a, fixture, 'M04-I-001', 'malicious', RATIONALE['M04-I-001'], 'not a date'), /timestamp/);
  assert.deepStrictEqual(local(a.intelVerdicts || {}), {}, 'rejected input records nothing');
  ui.recordVerdict(a, fixture, 'M04-I-001', 'unknown', RATIONALE['M04-I-002'], stamp);
  ui.recordVerdict(a, fixture, 'M04-I-001', 'malicious', `  ${RATIONALE['M04-I-001']}  `, stamp);
  assert.strictEqual(a.intelVerdicts['M04-I-001'].decision, 'malicious', 'a later record replaces the earlier verdict');
  assert.strictEqual(a.intelVerdicts['M04-I-001'].rationale, RATIONALE['M04-I-001'], 'rationale is trimmed');
  assert.deepStrictEqual(local(a.actionHistory.map((e) => e.type)), ['intel_verdict', 'intel_verdict']);
  assert.deepStrictEqual(local(a.actionHistory[1].details), { indicatorId: 'M04-I-001', decision: 'malicious' });
  // A verdict is not an IOC lifecycle edit: recording one must not satisfy the ioc-lifecycle criterion.
  const lifecycle = rubric.extract({ assessment: { ...a, reports: local(fixture.scenario.reports), iocs: local(fixture.scenario.iocs) } }, fixture).criteria.find((c) => c.id === 'ioc-lifecycle');
  assert.strictEqual(lifecycle.awarded, false);
  assert(!lifecycle.evidence.includes('IOC lifecycle edit recorded'));
}

// ---- Prove It scoring: required scenarios ---------------------------------------------------------------------------
{
  // perfect investigation
  const perfect = verdictCriterion({ intelVerdicts: verdicts(PERFECT) });
  assert.strictEqual(perfect.points, 10);
  assert.strictEqual(perfect.max, 10);
  assert.strictEqual(perfect.misses.length, 0);
  assert(perfect.feedback.includes('requirements evidenced.'));

  // partial investigation: one valid finding, the rest not attempted (meaningful partial credit, not zero)
  const partial = verdictCriterion({ intelVerdicts: verdicts({ 'M04-I-001': 'malicious' }) });
  assert.strictEqual(partial.points, 3);
  assert(partial.misses.some((m) => m.includes('no verdict recorded')));
  const secondary = verdictCriterion({ intelVerdicts: verdicts({ 'M04-C-001': 'benign', 'M04-I-002': 'unknown' }) });
  assert.strictEqual(secondary.points, 5, 'a benign finding and a supported unknown are credited without the primary malicious verdict');

  // unknown is full credit where evidence is insufficient
  assert.strictEqual(verdictCriterion({ intelVerdicts: verdicts({ 'M04-I-002': 'unknown' }) }).points, 2);
  assert.strictEqual(verdictCriterion({ intelVerdicts: verdicts({ 'M04-I-003': 'unknown' }) }).points, 2);

  // different valid paths (citing events, the report, or other entities) earn equivalent credit
  const viaReport = verdictCriterion({ intelVerdicts: verdicts(PERFECT, { ...RATIONALE, 'M04-I-001': 'Threat Desk report M04-R-002 matches the failures I found in the sign-in logs.', 'M04-C-001': 'The mail client error M04-X-001 shows a cached credential after the rotation.' }) });
  const viaEntities = verdictCriterion({ intelVerdicts: verdicts(PERFECT, { ...RATIONALE, 'M04-I-001': 'acct-41 through acct-45 were all tried from this address and acct-44 got in.', 'M04-C-001': 'The user acct-17 is a managed mail client user with a recent password change.' }) });
  assert.strictEqual(viaReport.points, perfect.points);
  assert.strictEqual(viaEntities.points, perfect.points);

  // excessive exploration with correct determinations: no penalty
  const noisy = scorer.score({ assessment: { intelVerdicts: verdicts(PERFECT), selectedIocIds: fixture.scenario.iocs.map((i) => i.id), actionHistory: Array.from({ length: 60 }, (_, i) => ({ type: 'query_test', details: { succeeded: i % 2 === 0 } })) } }, fixture);
  assert.strictEqual(noisy.criteria.find((c) => c.id === 'intelligence-verdicts').points, 10);

  // explicit unsupported conclusion: reduces the competency, and costs more than staying unknown
  const wrongBenign = verdictCriterion({ intelVerdicts: verdicts({ ...PERFECT, 'M04-C-001': 'malicious' }, { ...RATIONALE, 'M04-C-001': 'The repeated failures from M04-A-007 and acct-17 look like credential guessing to me.' }) });
  assert.strictEqual(wrongBenign.points, 5, '3 + 2 + 2 earned, minus the 2-point deduction for the contradicted verdict');
  assert.strictEqual(wrongBenign.deductions.length, 1);
  assert(wrongBenign.misses.some((m) => m.includes('contradicted')));
  const cautious = verdictCriterion({ intelVerdicts: verdicts({ ...PERFECT, 'M04-C-001': 'unknown' }, { ...RATIONALE, 'M04-C-001': 'Repeated failures from acct-17 but I cannot tell yet whether they are hostile.' }) });
  assert.strictEqual(cautious.points, 8, 'unknown with cited reasoning keeps the reasoning credit and costs no deduction');
  assert(wrongBenign.points < cautious.points);
  const uncitedUnknown = verdictCriterion({ intelVerdicts: verdicts({ ...PERFECT, 'M04-C-001': 'unknown' }, { ...RATIONALE, 'M04-C-001': 'I am not sure about this particular address here.' }) });
  assert.strictEqual(uncitedUnknown.points, 7);
  assert(uncitedUnknown.misses.some((m) => m.includes('left unknown')));
  const wrongOnUnknown = verdictCriterion({ intelVerdicts: verdicts({ ...PERFECT, 'M04-I-002': 'malicious' }, { ...RATIONALE, 'M04-I-002': 'Phishing cluster reports mean this address is hostile in every case.' }) });
  assert(wrongOnUnknown.deductions.length === 1 && wrongOnUnknown.points === 6, 'calling an unsupported indicator malicious is an explicit unsupported conclusion');

  // strong technical analysis, weak documentation: verdict credit stays, reasoning credit is lost
  const terse = verdictCriterion({ intelVerdicts: verdicts(PERFECT, { 'M04-I-001': 'bad one', 'M04-C-001': 'fine', 'M04-I-002': 'unclear', 'M04-I-003': 'old' }) });
  assert.strictEqual(terse.points, 6);
  assert(terse.misses.some((m) => m.includes('reasoning')));
  const uncited = verdictCriterion({ intelVerdicts: verdicts({ 'M04-I-001': 'malicious' }, { 'M04-I-001': 'This address is clearly part of an attack on the company.' }) });
  assert.strictEqual(uncited.points, 2, 'a long rationale that cites no record or entity gets verdict credit only');

  // weak analysis with polished writing: no technical credit for confident, well-written wrong verdicts
  const polished = verdictCriterion({ intelVerdicts: verdicts({ 'M04-I-001': 'benign', 'M04-C-001': 'malicious', 'M04-I-002': 'malicious', 'M04-I-003': 'benign' }, {
    'M04-I-001': 'After careful review of acct-41 and M04-A-001 I conclude this traffic is routine and expected for this tenant.',
    'M04-C-001': 'The activity on acct-17 (M04-A-007, M04-A-008) is a textbook credential attack and must be contained.',
    'M04-I-002': 'This address sits in a phishing cluster, so it is malicious, and a well-formed report supports that view.',
    'M04-I-003': 'The domain has been retired and I am confident it can be treated as harmless and benign here.',
  }) });
  assert.strictEqual(polished.points, 0);
  assert.strictEqual(polished.deductions.length, 4);
  assert.strictEqual(polished.awards.length, 0);

  // nothing recorded
  const none = verdictCriterion({});
  assert.strictEqual(none.points, 0);
  assert.strictEqual(none.misses.length, 4);
}

// ---- Rubric versioning and backward compatibility ---------------------------------------------------------------------
{
  assert.strictEqual(rubric.CURRENT_VERSION, 2);
  const v2 = scorer.score({ assessment: { intelVerdicts: verdicts(PERFECT) } }, fixture);
  assert.strictEqual(v2.rubricVersion, 2);
  assert.strictEqual(v2.criteria.length, 9);
  assert.strictEqual(v2.maxScore, 100, 'the maximum stays 100 so scores remain percentages');
  assert.strictEqual(scorer.PASSING_SCORE, 70, 'the passing bar is unchanged');
  assert.strictEqual(v2.score, 10);
  // The intelligence competency keeps its 25 points; only its internal split changes.
  const weight = (id) => scorer.CRITERIA.find((c) => c.id === id).weight;
  assert.strictEqual(weight('intelligence-corroboration') + weight('ioc-lifecycle') + weight('intelligence-verdicts'), 25);
  assert.strictEqual(scorer.CRITERIA_V1.find((c) => c.id === 'intelligence-corroboration').weight + scorer.CRITERIA_V1.find((c) => c.id === 'ioc-lifecycle').weight, 25);
  for (const set of [scorer.CRITERIA, scorer.CRITERIA_V1]) assert.strictEqual(set.reduce((n, c) => n + c.weight, 0), 100);
  // Every non-intelligence criterion keeps its weight.
  for (const c of scorer.CRITERIA_V1.filter((c) => !['intelligence-corroboration', 'ioc-lifecycle'].includes(c.id))) assert.strictEqual(weight(c.id), c.weight);

  // A legacy submission can still be read under the rules it was scored with.
  const legacy = scorer.score({ assessment: {}, caseRecord: {} }, fixture, { rubricVersion: 1 });
  assert.strictEqual(legacy.rubricVersion, 1);
  assert.deepStrictEqual(local(legacy.criteria.map((c) => c.id)), local(rubric.RUBRIC_V1.map((c) => c.id)));
  assert.strictEqual(legacy.maxScore, 100);
  assert.strictEqual(legacy.intelligenceVerdicts.length, 0);
  assert.strictEqual(rubric.extract({ assessment: {} }, fixture, { rubricVersion: 1 }).criteria.some((c) => c.id === 'intelligence-verdicts'), false);

  // Submitted scores are stored at submit time and never recomputed when an attempt is loaded.
  const moduleSource = read('soc-analyst-module-04.js');
  assert.strictEqual((moduleSource.match(/SocM04AssessmentScorer\.score\(/g) || []).length, 1, 'the scorer is called only when the case is submitted');
  const submitIndex = moduleSource.indexOf('SocM04AssessmentScorer.score(');
  assert(moduleSource.lastIndexOf('data-m04-submit-case', submitIndex) > moduleSource.lastIndexOf('function ', submitIndex) - 1, 'and that call sits in the submit handler');
}

// ---- Persistence: jsonb key reorder -------------------------------------------------------------------------------------
{
  const reversed = (obj) => Object.fromEntries(Object.entries(obj).reverse());
  const stored = {
    caseRecord: { notes: 'keep', submitted: true },
    assessment: {
      intelHints: reversed({ 'M04-I-001': 2, 'M04-C-001': 1 }),
      intelVerdicts: reversed(Object.fromEntries(Object.entries(verdicts(PERFECT)).map(([id, v]) => [id, reversed(v)]))),
      actionHistory: [], nextActionSequence: 1,
    },
  };
  const first = stateApi.normalize(stored, fixture).assessment;
  for (const [id, decision] of Object.entries(PERFECT)) {
    assert.strictEqual(first.intelVerdicts[id].decision, decision);
    assert.strictEqual(first.intelVerdicts[id].rationale, RATIONALE[id]);
    assert.strictEqual(first.intelVerdicts[id].recordedAt, stamp);
  }
  assert.strictEqual(first.intelHints['M04-I-001'], 2);
  assert.strictEqual(first.intelHints['M04-C-001'], 1);
  // Idempotent, and a second reorder of the normalized result changes nothing that is read by key.
  const second = stateApi.normalize(JSON.parse(JSON.stringify({ assessment: reversed(first) })), fixture).assessment;
  assert.deepStrictEqual(Object.keys(second.intelVerdicts).sort(), Object.keys(PERFECT).sort());
  for (const id of Object.keys(PERFECT)) assert.deepStrictEqual(local(second.intelVerdicts[id]), local(first.intelVerdicts[id]));
  // Reordered state scores exactly like the original.
  assert.strictEqual(verdictCriterion(second).points, 10);
  assert.strictEqual(verdictCriterion(stored.assessment).points, 10);
  // Legacy and malformed values degrade to empty / dropped, never throw.
  assert.deepStrictEqual(local(stateApi.normalize({ assessment: { selectedIocIds: [] } }, fixture).assessment.intelVerdicts), {});
  const dirty = stateApi.normalize({ assessment: { intelVerdicts: { a: null, b: { decision: 'guilty', rationale: 'x' }, c: { decision: 'benign' }, d: { decision: 'benign', rationale: 'a valid rationale for this one' }, e: [] }, intelHints: { a: -1, b: 'x', c: 2, d: 99 } } }, fixture).assessment;
  assert.deepStrictEqual(Object.keys(dirty.intelVerdicts), ['d']);
  assert.deepStrictEqual(local(dirty.intelHints), { c: 2 });
  assert.deepStrictEqual(local(stateApi.normalize({ assessment: { intelVerdicts: [1, 2] } }, fixture).assessment.intelVerdicts), {});
}

// ---- Rendering: Prove It has no guidance, Practice It has hints and instant feedback ------------------------------------------
{
  const a = { intelVerdicts: verdicts({ 'M04-C-001': 'malicious' }, { 'M04-C-001': 'Looks hostile to me given the repeated failures here.' }) };
  const prove = ui.renderVerdicts(a, fixture);
  assert.strictEqual((prove.match(/data-m04-verdict-form/g) || []).length, 4, 'one control per indicator');
  assert(prove.includes('value="malicious"') && prove.includes('value="benign"') && prove.includes('value="unknown"'));
  assert(prove.includes('data-m04-verdict-recorded="M04-C-001"'), 'the learner sees their own recorded verdict');
  assert(!/data-m04-verdict-hint|data-m04-verdict-feedback|m04-ti-verdict-hints/.test(prove), 'Prove It: no hints and no answer feedback');
  assert(!/unknown is the right answer|supported|contradict/i.test(prove), 'Prove It copy does not reveal how to answer');
  assert.strictEqual(ui.renderVerdicts(a, fixture, { guided: false }), prove);
  assert.strictEqual(ui.renderVerdicts({}, { scenario: {} }), '', 'consoles without verdict indicators (later modules) render nothing');
  const escaped = ui.renderVerdicts({ intelVerdicts: { 'M04-I-001': { decision: 'malicious', rationale: '<img src=x onerror=alert(1)> and more words to pass', recordedAt: stamp } } }, fixture);
  assert(!escaped.includes('<img src=x'));

  // Practice It, driven by the real guided fixture block in soc-analyst-module-04.js.
  const source = read('soc-analyst-module-04.js');
  const block = source.slice(source.indexOf('// Practice It indicator verdicts'), source.indexOf('MODULE_FOUR_GUIDED_FIXTURE.scenario.reports[0].summary'));
  assert(block.length > 500, 'guided verdict block found');
  const g = { MODULE_FOUR_GUIDED_FIXTURE: { scenario: { truth: {} } } };
  vm.createContext(g);
  vm.runInContext(block, g);
  const gf = vm.runInContext('MODULE_FOUR_GUIDED_FIXTURE', g);
  const gt = gf.scenario.truth;
  assert.strictEqual(gf.scenario.verdictIndicators.length, 4);
  const decisions = Object.values(gt.indicatorDecisions);
  assert(decisions.includes('malicious') && decisions.includes('benign') && decisions.filter((d) => d === 'unknown').length >= 1);
  assert.strictEqual(Object.values(gt.indicatorPoints).reduce((n, x) => n + x, 0), 10);
  for (const tokens of Object.values(gt.indicatorEvidence)) for (const token of tokens) assert(source.includes(`'${token}'`) || source.includes(`"${token}"`), `guided evidence token ${token} appears in the guided data`);
  for (const indicator of gf.scenario.verdictIndicators) {
    assert.strictEqual(gf.scenario.verdictHints[indicator.id].length, 3, 'three progressive hints per indicator');
    assert(gf.scenario.verdictFeedback[indicator.id].why && gf.scenario.verdictFeedback[indicator.id].nudge);
  }
  const ga = {};
  const startGuided = ui.renderVerdicts(ga, gf, { guided: true });
  assert(startGuided.includes('data-m04-verdict-hint="GL4-I-301"') && !startGuided.includes('m04-ti-verdict-hints'), 'hints are offered but not shown until asked');
  assert.strictEqual(ui.revealHint(ga, gf, 'GL4-I-301'), 1);
  assert.strictEqual(ui.revealHint(ga, gf, 'GL4-I-301'), 2);
  assert.strictEqual(ui.revealHint(ga, gf, 'GL4-I-301'), 3);
  assert.strictEqual(ui.revealHint(ga, gf, 'GL4-I-301'), 3, 'hints stop at the last one');
  const hinted = ui.renderVerdicts(ga, gf, { guided: true });
  assert.strictEqual((hinted.match(/<li>/g) || []).length, 3);
  assert(/data-m04-verdict-hint="GL4-I-301"[^>]*disabled/.test(hinted));
  const fb = (id, decision, rationale) => ui.verdictFeedback(gf, id, { decision, rationale });
  assert.strictEqual(fb('GL4-I-301', 'malicious', 'Three accounts failed and acct-62 then signed in (GL4-A-104).').tone, 'good');
  assert.strictEqual(fb('GL4-I-301', 'malicious', 'This is obviously the attacker so call it hostile now.').tone, 'close', 'right verdict, no cited record');
  assert.strictEqual(fb('GL4-I-301', 'benign', 'Looks like a normal address to me, nothing special there.').tone, 'wrong');
  assert.strictEqual(fb('GL4-I-301', 'unknown', 'Not sure about this one at the moment, need more.').tone, 'close');
  assert.strictEqual(fb('GL4-C-401', 'benign', 'acct-67 failures follow the CR-288 credential refresh change.').tone, 'good');
  assert.strictEqual(fb('GL4-C-401', 'malicious', 'Repeated failures from acct-67 look like a spray attack.').tone, 'wrong');
  assert.strictEqual(fb('GL4-I-302', 'unknown', 'No record in this case mentions this address at all.').tone, 'good', 'unknown is the supported answer when the case is silent');
  assert.strictEqual(fb('GL4-I-302', 'malicious', 'It is listed against a phishing cluster so it is hostile.').tone, 'wrong');
  ui.recordVerdict(ga, gf, 'GL4-I-302', 'unknown', 'No record in this case mentions this address at all.', stamp);
  const withFeedback = ui.renderVerdicts(ga, gf, { guided: true });
  assert(withFeedback.includes('data-m04-verdict-feedback="GL4-I-302"') && withFeedback.includes('is-good'));
  assert(!ui.renderVerdicts(ga, gf, {}).includes('data-m04-verdict-feedback'), 'feedback never appears outside Practice It');

  // The new guide steps point at the verdict cards on the Threat Intelligence tab and cover each verdict kind.
  const stepsSource = source.slice(source.indexOf('function moduleFourGuidedSteps'), source.indexOf('function moduleFourGuidedDebrief'));
  const steps = vm.runInContext(`${stepsSource}; moduleFourGuidedSteps()`, vm.createContext({}));
  const verdictSteps = steps.filter((step) => step.tab === 'intelligence');
  assert.strictEqual(verdictSteps.length, 3);
  assert(verdictSteps.every((step) => step.title && step.body && step.lookFor && step.lab && /data-m04-verdict-card="GL4-/.test(step.target)));
  assert.deepStrictEqual(local(verdictSteps.map((s) => s.target.match(/GL4-[A-Z]-\d+/)[0])), ['GL4-I-301', 'GL4-C-401', 'GL4-I-302']);
  assert(steps.findIndex((s) => s.tab === 'intelligence') > steps.findIndex((s) => s.tab === 'sources'), 'verdicts come after the evidence has been correlated');
}

// ---- Console wiring --------------------------------------------------------------------------------------------------------
{
  const tools = read('soc-console-tools.js');
  assert(tools.includes('renderVerdicts(ctx.assessment(), ctx.fixture, { guided: ctx.guided === true })'));
  assert(tools.includes("data-m04-verdict-form") && tools.includes('SocM04IntelligenceUi.recordVerdict('));
  assert(tools.includes('verdictHint && ctx.guided === true'), 'hints are wired for Practice It only');
  const source = read('soc-analyst-module-04.js');
  const proveCtx = source.slice(source.indexOf("const MODULE_FOUR_CONSOLE = SocConsoleTools.mount('m04'"), source.indexOf('// Practice It uses a separately persisted case root'));
  assert(!proveCtx.includes('guided'), 'the Prove It console pack is not given the guided flag');
  assert(source.includes("MODULE_FOUR_GUIDED_CONSOLE = SocConsoleTools.mount('m04-guided'"));
  assert(/packs: \[\{ id: 'm04', ctx: \{ guided: true, assessment: moduleFourGuidedAssessment/.test(source));
}

// ---- Instructor review ------------------------------------------------------------------------------------------------------
{
  const result = scorer.score({ assessment: { intelVerdicts: verdicts({ ...PERFECT, 'M04-C-001': 'malicious' }, { ...RATIONALE, 'M04-C-001': 'Repeated failures from acct-17 (M04-A-007) look like guessing.\nSecond line of the learner\'s note.' }) } }, fixture);
  assert.strictEqual(result.intelligenceVerdicts.length, 4);
  const benignRow = result.intelligenceVerdicts.find((v) => v.indicatorId === 'M04-C-001');
  assert.strictEqual(benignRow.decision, 'malicious');
  assert.strictEqual(benignRow.assessment, 'contradicted');
  assert(benignRow.rationale.includes('Second line'), 'the full rationale is preserved, not truncated');
  assert.strictEqual(benignRow.value, '203.0.113.77');
  const explained = result.criteria.find((c) => c.id === 'intelligence-verdicts');
  assert(explained.awards.length > 0 && explained.deductions.length === 1 && explained.misses.length > 0, 'earned/available, awards, deductions and misses all appear in the breakdown');

  const appSource = read('app.js');
  const start = appSource.indexOf('function adminAttemptReviewCard');
  const end = appSource.indexOf('\nfunction ', start + 10);
  const sandbox = vm.createContext({
    esc: (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]),
    adminCaseTicketSubmissionPanel: () => '', adminCapstoneReviewPanel: () => '', adminModuleTwoAccessReviewPanel: () => '', adminResponseDesignReviewPanel: () => '', adminAttemptLabel: () => 'Attempt 1',
  });
  vm.runInContext(appSource.slice(start, end), sandbox);
  const card = sandbox.adminAttemptReviewCard({
    ids: ['a1'], name: 'Test Learner', labTitles: ['Module 04'],
    lead: { id: 'a1', student_id: 's1', attempt: 1, score: result.score, pass_threshold: 70, completed_at: '2026-09-24T09:40:00Z', result: { rubric_version: 2, breakdown: local(result.criteria), feedback: local(result.review.feedback), review_payload: local({ ...result, caseId: 'CASE-044424' }) } },
  }, false);
  assert(card.includes('data-admin-intel-verdicts'));
  assert(card.includes('203.0.113.77') && card.includes('198.51.100.64') && card.includes('legacy-drop.example'));
  assert(card.includes('Student verdict:') && card.includes('<strong>malicious</strong>'));
  assert(card.includes('Contradicted by the case evidence'));
  assert(card.includes('Second line of the learner&#39;s note.'), 'full student reasoning is on the card');
  assert(card.includes('whitespace-pre-wrap'), 'paragraph breaks are preserved');
  assert(card.includes('Indicator verdicts') && card.includes('System rubric'), 'competency breakdown with earned/available points is shown beside the verdicts');
  // A pre-verdict (rubric v1) attempt has no verdict panel and still renders.
  const legacyCard = sandbox.adminAttemptReviewCard({
    ids: ['a2'], name: 'Earlier Learner', labTitles: ['Module 04'],
    lead: { id: 'a2', student_id: 's2', attempt: 1, score: 85, pass_threshold: 70, completed_at: '2026-09-20T09:40:00Z', result: { rubric_version: 1, breakdown: local(scorer.score({ assessment: {} }, fixture, { rubricVersion: 1 }).criteria), review_payload: { rubricVersion: 1 } } },
  }, false);
  assert(!legacyCard.includes('data-admin-intel-verdicts'));
  assert(legacyCard.includes('85%') && legacyCard.includes('System rubric'));
}

console.log('M04 indicator verdict tests passed.');
