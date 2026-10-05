#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const ctx = { console };
vm.createContext(ctx);
vm.runInContext(
  fs.readFileSync(path.join(__dirname, '..', 'portal', 'soc-assessment-scorer.js'), 'utf8'),
  ctx,
  { filename: 'soc-assessment-scorer.js' },
);
vm.runInContext(
  fs.readFileSync(path.join(__dirname, '..', 'portal', 'soc-assessment-evolution.js'), 'utf8'),
  ctx,
  { filename: 'soc-assessment-evolution.js' },
);

const evolution = vm.runInContext('SocAssessmentEvolution', ctx);
const local = (value) => JSON.parse(JSON.stringify(value));
let failures = 0;
const t = (name, fn) => {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (error) {
    failures += 1;
    console.log(`  FAIL ${name}\n       ${error.message}`);
  }
};

console.log('SOC assessment evolution contract');

t('modules 04-12 are registered in sequence', () => {
  assert.deepStrictEqual(
    local(evolution.modules.map((module) => module.moduleKey)),
    ['soc-04', 'soc-05', 'soc-06', 'soc-07', 'soc-08', 'soc-09', 'soc-10', 'soc-11', 'soc-12'],
  );
});

t('progression validation passes', () => {
  const result = evolution.validateProgression();
  assert.strictEqual(result.ok, true, result.errors.join('\n'));
});

t('later modules retain earlier capabilities', () => {
  const m04 = evolution.capabilitiesThrough('soc-04');
  const m09 = evolution.capabilitiesThrough('soc-09');
  for (const capability of m04) assert.ok(m09.includes(capability), `soc-09 lost ${capability}`);
  assert.ok(m09.includes('state-changing-actions'));
  assert.ok(m09.includes('recovery-workspace'));
});

t('capstone includes the full integrated environment', () => {
  const capstone = evolution.moduleFor('soc-12');
  assert.ok(capstone.capstone);
  assert.deepStrictEqual(local(capstone.domains), ['triage', 'query', 'timeline', 'scope', 'enrichment', 'attack', 'detection', 'response', 'reporting', 'closure']);
  const capabilities = evolution.capabilitiesThrough('soc-12');
  assert.ok(capabilities.includes('complete-soc-environment'));
  assert.ok(capabilities.includes('portfolio-report'));
});

t('scorer grants deterministic partial credit and caps critical misses', () => {
  const domains = ['triage', 'query', 'response', 'closure'];
  const partial = evolution.scoreDomains(domains, { triage: true, query: 0.5, response: 0.25, closure: false });
  assert.strictEqual(partial.rawScore, 18);
  assert.strictEqual(partial.score, 45);
  assert.strictEqual(partial.passed, false);

  const capped = evolution.scoreDomains(domains, { triage: true, query: true, response: true, closure: true }, { criticalMisses: ['closed before recovery validation'] });
  assert.strictEqual(capped.rawScore, 40);
  assert.strictEqual(capped.score, 69);
  assert.strictEqual(capped.passed, false);
});

console.log(failures ? `\n${failures} failing` : '\nall passing');
process.exit(failures ? 1 : 0);
