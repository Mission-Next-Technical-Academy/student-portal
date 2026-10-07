'use strict';
// Keeps portal/soc-capstone-traceability.js honest. The M12 mechanics are read
// from the capstone code itself (rubric v2 award / deduction / miss text,
// moduleTwelveActionMissing() messages, ticket fields, action types), so a new
// graded mechanic that has no traceability entry fails here.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

// ---------------------------------------------------------------- known gaps
// Mechanics that still have no Practice and/or Prove home. Adding an entry with
// an empty list WITHOUT adding it here fails; so does leaving an entry here once
// its gap is closed. Closing a gap = add the home in the data file, delete the
// line here.
const KNOWN_GAPS = {
  'rule-saved': ['practice'],
  'rule-scheduled': ['practice'],
  'alert-incident-link': ['practice', 'prove'],
  'alert-incident-link-unrelated-deduction': ['practice', 'prove'],
  'attack-mapping': ['practice'],
  'attack-unsupported-deduction': ['practice'],
  'evidence-preserved-before-eradication': ['practice'],
  'recovery-persistence-removed': ['practice'],
  'recovery-restored': ['practice'],
  'recovery-validated': ['practice'],
  'report-lessons': ['practice'],
};

// Graded-looking rubric strings that are not mechanics.
const IGNORED_RUBRIC_TEXT = ['Scenario unavailable.'];

// ---------------------------------------------------------------- load code
const context = vm.createContext({ console });
for (const file of ['portal/soc-capstone-traceability.js', 'portal/soc-m12-assessment-data.js', 'portal/soc-m12-assessment-state.js', 'portal/soc-m12-assessment-rubric.js']) {
  vm.runInContext(read(file), context, { filename: file });
}
const plain = (expr) => JSON.parse(JSON.stringify(vm.runInContext(expr, context)));
const data = plain('SocCapstoneTraceability');
const CRITERIA = plain('SocM12AssessmentRubric.CRITERIA');
const ACTION_TYPES = plain('SocM12AssessmentState.TYPES');
const entries = data.entries;

// ------------------------------------------------- derive M12 mechanics from code
const rubricSource = read('portal/soc-m12-assessment-rubric.js');
const v2Body = rubricSource.slice(rubricSource.indexOf('function extractV2'), rubricSource.indexOf('// Unversioned historical'));
assert.ok(v2Body.length > 1000, 'extractV2 body located');
const normalise = (raw) => raw.replace(/\$\{[^}]*\}/g, '').replace(/^[\s:]+/, '').trim();
const rubricTexts = new Set();
for (const m of v2Body.matchAll(/'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g)) {
  const text = normalise(m[1] !== undefined ? m[1] : m[2]);
  if (/\.$/.test(text) && text.length >= 10 && !IGNORED_RUBRIC_TEXT.includes(text)) rubricTexts.add(text);
}

const moduleTwelveSource = read('portal/soc-analyst-module-12.js');
const missingBody = moduleTwelveSource.slice(moduleTwelveSource.indexOf('function moduleTwelveActionMissing'), moduleTwelveSource.indexOf('function moduleTwelveCaseSpec'));
const missingChecks = new Set([...missingBody.matchAll(/'(No [^']*? yet)'/g)].map((m) => m[1]));

const findingsBody = moduleTwelveSource.slice(moduleTwelveSource.indexOf('const MODULE_TWELVE_TICKET_FINDINGS'), moduleTwelveSource.indexOf('// Presence checks describe'));
const coreMatch = /Object\.fromEntries\(\[((?:'[A-Za-z]+',?\s*)+)\]\.map/.exec(moduleTwelveSource);
const ticketFields = new Set([
  ...[...findingsBody.matchAll(/name:\s*'([A-Za-z]+)'/g)].map((m) => m[1]),
  ...(coreMatch ? [...coreMatch[1].matchAll(/'([A-Za-z]+)'/g)].map((m) => m[1]) : []),
  'notes',
]);

// ------------------------------------------------- derive module homes from code
const consoleToolsSource = read('portal/soc-console-tools.js');
const knownTabs = new Set([
  ...[...(/const M03E_TABS = \[(.*)\];/.exec(read('portal/soc-analyst-module-03-environment.js'))?.[1] || '').matchAll(/\['([a-z]+)'/g)].map((m) => m[1]),
  ...[...consoleToolsSource.matchAll(/^\s*tabs: \[(.*)\],$/gm)].flatMap((m) => [...m[1].matchAll(/\['([a-z]+)'/g)].map((x) => x[1])),
  'case', 'itsm', 'operations', 'reporting',
]);

const GUIDE = {
  M01: { file: 'portal/soc-analyst-module-01.js', start: 'const MODULE_ONE_GUIDED_STEPS = [', end: '\n];', key: 'title' },
  M03: { file: 'portal/soc-analyst-module-03-environment.js', start: 'const M03E_GUIDE_STEPS = [', end: '\n];', key: 'id' },
  M04: { file: 'portal/soc-analyst-module-04.js', start: 'function moduleFourGuidedSteps', end: '\n}\n', key: 'title' },
  M05: { file: 'portal/soc-analyst-module-05.js', start: 'function moduleFiveGuidedSteps', end: '\n}\n', key: 'title' },
  M06: { file: 'portal/soc-analyst-module-06.js', start: 'function moduleSixGuidedSteps', end: '\n}\n', key: 'title' },
  M07: { file: 'portal/soc-analyst-module-07.js', start: 'function moduleSevenGuidedSteps', end: '\n}\n', key: 'title' },
  M08: { file: 'portal/soc-analyst-module-08.js', start: 'function moduleEightGuidedSteps', end: '\n}\n', key: 'title' },
  M09: { file: 'portal/soc-analyst-module-09.js', start: 'function moduleNineGuidedSteps', end: '\n}\n', key: 'title' },
  M10: { file: 'portal/soc-analyst-module-10.js', start: 'function moduleTenGuidedSteps', end: '\n}\n', key: 'title' },
  M11: { file: 'portal/soc-analyst-module-11.js', start: 'function moduleElevenGuidedSteps', end: '\n}\n', key: 'title' },
};
const guideBlock = (module) => {
  const g = GUIDE[module];
  assert.ok(g, `${module} has no guided-lab definition in this test`);
  const src = read(g.file), start = src.indexOf(g.start);
  assert.ok(start >= 0, `${g.file}: guide steps block (${g.start}) not found`);
  return src.slice(start, src.indexOf(g.end, start));
};
const hasGuideStep = (module, step) => guideBlock(module).includes(`${GUIDE[module].key}: '${step}'`);

const ruleFile = (module) => ({
  M01: 'portal/soc-analyst-module-01.js',
  M02: 'portal/soc-analyst-module-02-environment.js',
  M03: 'portal/soc-analyst-module-03-environment.js',
}[module] || `portal/soc-m${module.slice(1)}-assessment-rubric.js`);
const hasCriterion = (module, criterion) => {
  const file = ruleFile(module);
  if (!exists(file)) return false;
  const src = read(file);
  // M01/M02 store a score breakdown { affected_entity, severity, ... } instead of rubric ids.
  if (module === 'M01' || module === 'M02') return new RegExp(`breakdown:\\s*\\{[^}]*\\b${criterion}\\b`).test(src);
  return src.includes(`id: '${criterion}'`);
};

const codeRefOk = (ref) => {
  const [file, fragment] = ref.split('#');
  return exists(file) && (!fragment || read(file).includes(fragment));
};

const emptyLists = (entry) => [...(entry.practice.length ? [] : ['practice']), ...(entry.prove.length ? [] : ['prove'])];
const covered = (select) => new Set(entries.flatMap((entry) => select(entry.capstone) || []));

// ---------------------------------------------------------------- tests
test('data shape: unique ids and required fields', () => {
  assert.ok(entries.length >= 30, 'the map has entries');
  assert.deepEqual(data.embeddedPacks, ['m04', 'm05', 'm06', 'm07', 'm08', 'm09', 'm10'], 'M12 embeds PACKS m04-m10');
  assert.ok(read('portal/soc-m12-assessment-console.js').includes('SocConsoleTools.PACKS[id]'), 'M12 console still mounts packs by id');
  const seen = new Set();
  for (const entry of entries) {
    assert.match(entry.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${entry.id}: kebab-case id`);
    assert.ok(!seen.has(entry.id), `${entry.id}: duplicate id`);
    seen.add(entry.id);
    for (const key of ['criterion', 'mechanic', 'tab', 'recordedAs']) assert.ok(entry.capstone[key], `${entry.id}: capstone.${key}`);
    assert.ok(Array.isArray(entry.practice) && Array.isArray(entry.prove) && Array.isArray(entry.code), `${entry.id}: practice, prove and code are arrays`);
    assert.ok(entry.code.length > 0, `${entry.id}: names the shared code`);
    assert.ok(CRITERIA.some((c) => c.id === entry.capstone.criterion), `${entry.id}: unknown M12 criterion ${entry.capstone.criterion}`);
    assert.ok(knownTabs.has(entry.capstone.tab), `${entry.id}: unknown M12 tab ${entry.capstone.tab}`);
  }
});

test('every M12 rubric criterion has at least one entry', () => {
  const have = covered((c) => [c.criterion]);
  for (const criterion of CRITERIA) assert.ok(have.has(criterion.id), `no traceability entry for criterion ${criterion.id}`);
});

test('every rubric v2 award, deduction and miss is traced (and no entry cites text that is gone)', () => {
  const have = covered((c) => c.rubricText);
  const untraced = [...rubricTexts].filter((text) => !have.has(text));
  assert.deepEqual(untraced, [], `rubric v2 text with no traceability entry (add an entry or extend one's capstone.rubricText): ${untraced.join(' | ')}`);
  const stale = [...have].filter((text) => !rubricTexts.has(text));
  assert.deepEqual(stale, [], `entries cite rubric text that no longer exists in extractV2: ${stale.join(' | ')}`);
});

test('every moduleTwelveActionMissing() check is traced', () => {
  assert.ok(missingChecks.size >= 13, 'parsed the missing-action checks');
  const have = covered((c) => c.missingCheck);
  assert.deepEqual([...missingChecks].filter((m) => !have.has(m)), [], 'missing-action checks with no entry');
  assert.deepEqual([...have].filter((m) => !missingChecks.has(m)), [], 'entries cite missing-action checks that no longer exist');
});

test('every M12 ticket field is traced', () => {
  for (const name of ['priorityRationale', 'scopeStatement', 'executiveSummary', 'closureNote', 'severity', 'affectedUser', 'affectedDevice', 'disposition', 'escalation', 'escalateTo', 'status', 'notes']) {
    assert.ok(ticketFields.has(name), `parsed ticket field ${name}`);
  }
  const have = covered((c) => c.ticketFields);
  assert.deepEqual([...ticketFields].filter((f) => !have.has(f)), [], 'ticket fields with no entry');
  assert.deepEqual([...have].filter((f) => !ticketFields.has(f)), [], 'entries cite ticket fields that no longer exist');
});

test('every M12 action type is traced or explicitly ungraded', () => {
  const have = covered((c) => c.actionTypes);
  const ungraded = new Set(data.ungradedActionTypes);
  for (const type of ACTION_TYPES) assert.ok(have.has(type) || ungraded.has(type), `action type ${type} is neither traced nor listed as ungraded`);
  for (const type of have) assert.ok(ACTION_TYPES.includes(type), `entry cites unknown action type ${type}`);
  for (const type of ungraded) {
    assert.ok(ACTION_TYPES.includes(type), `ungraded type ${type} no longer exists`);
    assert.ok(!v2Body.includes(`'${type}'`), `ungraded type ${type} is now read by the rubric: give it an entry`);
  }
});

test('the unsafe-execution cap is traced and still exists', () => {
  assert.ok(entries.some((e) => e.id === 'unsafe-execution-cap'), 'unsafe-execution-cap entry');
  assert.ok(entries.some((e) => e.id === 'unsafe-execution-deduction'), 'unsafe-execution-deduction entry');
  const scorer = read('portal/soc-m12-assessment-scorer.js');
  assert.match(scorer, /SAFETY_CAP\s*=\s*69/);
  assert.match(scorer, /unsafeExecution\?\{cap:/);
  assert.match(v2Body, /unsafeExecution/);
});

test('practice and prove homes exist in the module code', () => {
  for (const entry of entries) {
    for (const p of entry.practice) {
      assert.equal(p.lab, 'guided', `${entry.id}: practice lab`);
      assert.ok(['direct', 'generic'].includes(p.coverage), `${entry.id}: practice coverage ${p.coverage}`);
      assert.ok(knownTabs.has(p.where.tab), `${entry.id}: ${p.module} unknown tab ${p.where.tab}`);
      assert.ok(hasGuideStep(p.module, p.where.step), `${entry.id}: ${p.module} has no guided step "${p.where.step}"`);
    }
    for (const group of [entry.prove, entry.related || []]) {
      for (const v of group) assert.ok(hasCriterion(v.module, v.criterion), `${entry.id}: ${v.module} has no criterion "${v.criterion}" in ${ruleFile(v.module)}`);
    }
    for (const x of entry.exposedIn || []) {
      assert.ok(GUIDE[x.module], `${entry.id}: exposedIn module ${x.module}`);
      assert.ok(knownTabs.has(x.tab), `${entry.id}: exposedIn unknown tab ${x.tab}`);
    }
  }
});

test('every referenced code file exists (and contains its #fragment)', () => {
  for (const entry of entries) for (const ref of entry.code) assert.ok(codeRefOk(ref), `${entry.id}: code reference ${ref} not found`);
});

test('empty practice/prove lists carry a gap and match the known-gap allowlist exactly', () => {
  const actual = {};
  for (const entry of entries) {
    const empty = emptyLists(entry);
    if (empty.length) {
      assert.ok(typeof entry.gap === 'string' && entry.gap.length >= 20, `${entry.id}: empty ${empty.join('+')} list needs a gap explanation`);
      actual[entry.id] = empty;
    } else {
      assert.ok(!entry.gap, `${entry.id}: has a gap note but both lists are filled; drop the stale gap`);
    }
  }
  const sort = (obj) => Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
  assert.deepEqual(sort(actual), sort(KNOWN_GAPS), 'gaps differ from KNOWN_GAPS: a NEW gap must be fixed or listed here on purpose; a CLOSED gap must be removed from the list');
});
