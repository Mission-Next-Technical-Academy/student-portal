// Rail lock policy (docs/workstreams/LAB_CLICK_RESPONSIVENESS_FINDINGS.md #1, #3).
// Slices the pure nav helpers out of portal/app.js and runs them in a vm.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const src = fs.readFileSync('portal/app.js', 'utf8');
// Top-level functions in app.js close with a "}" at column 0.
const grab = (start) => {
  const from = src.indexOf(start);
  assert.ok(from >= 0, `found ${start}`);
  return src.slice(from, src.indexOf('\n}\n', from) + 3);
};
const code = [
  src.slice(src.indexOf('const esc = '), src.indexOf('function chip(')),
  grab('function standardModuleStageId'), grab('function normalizeModuleStages'),
  grab('function moduleNavStatuses'), grab('function moduleNavLockAttrs'), grab('function moduleUnifiedNav'),
].join('\n');
const ctx = vm.createContext({});
vm.runInContext(code, ctx, { filename: 'app.js(slice)' });
const nav = (sections) => vm.runInContext('moduleUnifiedNav', ctx)(sections, { moduleKey: 'm99' });

const row = (id, title, type, isComplete, extra = {}) => ({ id, title, type, isComplete, scrollId: `s-${id}`, ...extra });
const course = (done, extra = {}) => [
  row('f', 'Foundations', 'lecture', done[0]),
  row('g', 'Guided Lab', 'lab', done[1]),
  row('a', 'Assessment Lab', 'review', done[2], extra),
  row('src', 'Sources', 'read', null, { gated: false, supplemental: true }),
];
const anchor = (html, scrollId) => html.match(new RegExp(`<a href="#${scrollId}"[^>]*>`))[0];
const state = (html, scrollId) => {
  const tag = anchor(html, scrollId);
  return {
    locked: /aria-disabled="true"/.test(tag),
    cls: /mnav-chip-(complete|current|locked)/.exec(tag)?.[0],
    reason: /data-mnav-locked-reason="([^"]*)"/.exec(tag)?.[1],
    target: /data-mnav-locked-target="([^"]*)"/.exec(tag)?.[1],
  };
};

// Fresh learner: only the first row is current; later gated rows locked with a named reason.
{
  const html = nav(course([false, false, false]));
  assert.equal(state(html, 's-f').cls, 'mnav-chip-current');
  assert.equal(state(html, 's-f').locked, false);
  const g = state(html, 's-g');
  assert.deepEqual([g.locked, g.cls, g.reason, g.target], [true, 'mnav-chip-locked', 'Foundations', 's-f']);
  const a = state(html, 's-a');
  assert.deepEqual([a.locked, a.reason], [true, 'Foundations']);
  assert.match(anchor(html, 's-g'), /title="Guided Lab"/);
  assert.match(html, /ri-lock-line/);
  assert.match(html, /data-mnav-lock-msg role="status" aria-live="polite"/);
}

// In progress: Foundations done -> Guided Lab current, Assessment locked behind it.
{
  const html = nav(course([true, false, false]));
  assert.equal(state(html, 's-f').cls, 'mnav-chip-complete');
  assert.equal(state(html, 's-g').cls, 'mnav-chip-current');
  assert.deepEqual([state(html, 's-a').locked, state(html, 's-a').reason], [true, 'Guided Lab']);
}

// Previously complete / legacy learner: nothing locked, no lock attrs.
{
  const html = nav(course([true, true, true]));
  assert.ok(!/aria-disabled="true"/.test(html), 'no locked row');
  assert.ok(!/data-mnav-locked-reason/.test(html));
  assert.ok(!/mnav-chip-locked/.test(html));
}

// Sub-lesson locking derives from the same rule.
{
  const sections = course([false, false, false]);
  sections[0].items = [
    { title: 'L1', kind: 'lesson', isComplete: true, scrollId: 'l1' },
    { title: 'L2', kind: 'lesson', isComplete: false, scrollId: 'l2' },
    { title: 'L3', kind: 'lesson', isComplete: false, scrollId: 'l3' },
  ];
  const html = nav(sections);
  assert.equal(state(html, 'l2').locked, false);
  assert.deepEqual([state(html, 'l3').locked, state(html, 'l3').reason], [true, 'L2']);
}

// Pending-review / returned assessment: never locks later rows, and stays openable.
for (const reviewState of ['review', 'returned']) {
  // Assessment (incomplete, in review) sits before another gated row.
  const sections = [
    row('f', 'Foundations', 'lecture', true),
    row('g', 'Guided Lab', 'lab', true),
    row('a', 'Assessment Lab', 'review', false, { reviewState }),
    row('r', 'Module Review', 'review', false, { phase: 'prove' }),
  ];
  const html = nav(sections);
  assert.equal(state(html, 's-a').locked, false, `${reviewState}: assessment reopenable`);
  assert.equal(state(html, 's-a').cls, 'mnav-chip-current');
  assert.equal(state(html, 's-r').locked, false, `${reviewState}: later row not locked`);
  assert.match(html, reviewState === 'returned' ? />Returned</ : />In review</);
}
// Assessment with no reviewState (e.g. M02 reopened by a redo) also never gates later rows.
{
  const html = nav([row('g', 'Guided Lab', 'lab', true), row('a', 'Assessment Lab', 'review', false), row('r', 'Module Review', 'review', false, { phase: 'prove' })]);
  assert.equal(state(html, 's-a').locked, false);
  assert.equal(state(html, 's-r').locked, false);
}
// ...but an assessment is still sequenced behind unfinished earlier work.
{
  const html = nav(course([false, true, false], { reviewState: 'review' }));
  assert.equal(state(html, 's-a').locked, true);
}

console.log('module-nav-lock: all assertions passed');
