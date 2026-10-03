const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const componentSource = fs.readFileSync('portal/learn-it-cards.js', 'utf8');
const componentCss = fs.readFileSync('portal/learn-it-cards.css', 'utf8');
const moduleSource = fs.readFileSync('portal/soc-analyst-module-02-environment.js', 'utf8');
const dataSource = fs.readFileSync('portal/data.js', 'utf8');
const allDecks = require('../portal/learn-it-decks.js');
const sandbox = { window: {} };
vm.runInNewContext(componentSource, sandbox, { filename: 'learn-it-cards.js' });
const objectiveKeys = new Set([...dataSource.matchAll(/key:\s*'([^']+)'/g)].map((item) => item[1]));
const capstoneRubric = fs.readFileSync('portal/soc-m12-assessment-rubric.js', 'utf8');
const capstoneCriterionIds = new Set([...capstoneRubric.matchAll(/id:\s*'([^']+)'/g)].map((item) => item[1]));
const legacyDeck = allDecks['soc-02'].slice(0, 6);

assert.deepEqual(Object.keys(allDecks).sort(), Array.from({ length: 12 }, (_, i) => `soc-${String(i + 1).padStart(2, '0')}`));
for (const [moduleKey, deck] of Object.entries(allDecks)) {
  assert.ok(deck.length >= 5, `${moduleKey} has a useful deck`);
  for (const [index, slide] of deck.entries()) {
    const label = `${moduleKey} slide ${index + 1}`;
    assert.ok(slide.title && slide.body, `${label} has title and body`);
    if (moduleKey === 'soc-12') {
      assert.equal(slide.objective, null, `${label} does not misstate prior curriculum as an M12 objective`);
      assert.ok(slide.carryForward && objectiveKeys.has(slide.carryForward), `${label} names a real carry-forward objective`);
      const criteria = Array.isArray(slide.capstoneCriterion) ? slide.capstoneCriterion : [slide.capstoneCriterion];
      assert.ok(criteria.length > 0 && criteria.every((id) => capstoneCriterionIds.has(id)), `${label} maps to real M12 rubric criteria`);
    } else if (slide.legacyIntro) {
      assert.equal(moduleKey, 'soc-02', `${label} legacy exemption is limited to M02`);
      assert.equal(slide.objective, null, `${label} does not claim a misleading objective`);
      assert.equal(slide.legacy, true, `${label} is explicitly grandfathered`);
    } else {
      assert.ok(slide.objective && objectiveKeys.has(slide.objective), `${label} objective exists in data.js`);
    }
    assert.ok(['guided', 'assessment', 'both'].includes(slide.lab), `${label} has a valid lab mapping`);
    if (!slide.legacy) {
      assert.ok(slide.title.trim().split(/\s+/).length <= 5, `${label} title is at most five words`);
      assert.ok((slide.body.match(/[.!?](?:\s|$)/g) || []).length <= 2, `${label} has at most two sentences`);
      assert.ok(slide.body.trim().split(/\s+/).length <= 35, `${label} has at most 35 words`);
    }
  }
  assert.equal(deck.at(-1).bridge, true, `${moduleKey} last slide is the lab bridge`);
}
for (let number = 1; number <= 11; number += 1) {
  const moduleKey = `soc-${String(number).padStart(2, '0')}`;
  const nextKey = `soc-${String(number + 1).padStart(2, '0')}`;
  const start = dataSource.indexOf(`'${moduleKey}': {`);
  const end = dataSource.indexOf(`'${nextKey}': {`, start + 1);
  assert.ok(start >= 0 && end > start, `${moduleKey} curriculum section exists`);
  const curriculum = dataSource.slice(start, end);
  const objectives = [...curriculum.matchAll(/key:\s*'(soc-\d{2}-lesson-\d+)'/g)].map((match) => match[1]);
  const mapped = new Set(allDecks[moduleKey].map((slide) => slide.objective).filter(Boolean));
  const missing = objectives.filter((objective) => !mapped.has(objective));
  assert.deepEqual(missing, [], `${moduleKey} deck covers each curriculum objective`);
}
const deck = allDecks['soc-02'];
assert.equal(JSON.stringify(deck.slice(0, 6).map(({ title, body }) => ({ title, body }))), JSON.stringify(legacyDeck.map(({ title, body }) => ({ title, body }))), 'M02 authored title/body wording remains verbatim');
const html = sandbox.window.LearnItCards.render({ deck, step: 0, done: false, prefix: 'm02e', id: 'm02e-learn-callout', readyText: 'Start here' });
assert.match(html, /class="learn-it(?:"| )/, 'shared component uses generic root class');
assert.match(html, /data-m02e-learn-next/, 'prefix option scopes interactive attributes');
assert.match(html, /learn-it-scan/, 'progress bar is rendered');
const genericHtml = sandbox.window.LearnItCards.render({
  deck: [{ title: 'One', body: 'First.' }, { title: 'Two', body: 'Second.' }],
  step: 1, prefix: 'custom', id: 'custom-deck', headingId: 'custom-title',
  heading: 'Custom heading', progressCopy: ({ step, total }) => `${step}/${total}`,
  primaryClass: 'custom-button', secondaryClass: 'custom-restart', finalActionLabel: 'Done',
});
assert.match(genericHtml, /style="--learn-it-columns:2"/, 'grid columns follow deck size');
assert.match(genericHtml, /aria-labelledby="custom-title"/, 'heading ID can be configured');
assert.match(genericHtml, /data-custom-learn-view/, 'prefix customizes controls');
assert.match(genericHtml, /custom-button/, 'button classes can be customized');
assert.match(genericHtml, /1\/2/, 'progress copy is configurable');
assert.doesNotMatch(genericHtml, /console guide|m02e/, 'generic defaults contain no M02 copy or identifiers');
assert.match(componentCss, /overflow-x:auto/, 'card strip scrolls horizontally');
assert.match(componentCss, /scroll-snap-type:x mandatory/, 'carousel cards snap into place');
assert.match(componentCss, /flex:0 0 clamp\(/, 'cards keep a fixed readable width as decks grow');
assert.match(componentCss, /prefers-reduced-motion:reduce/, 'carousel animations respect reduced-motion preferences');
assert.match(componentSource, /selected < stepNow - 1\) onView\(selected \+ 1\)/, 'NEXT follows the selected card before revealing a new idea');
const handlers = {};
const fakeRoot = {
  isConnected: true,
  addEventListener: (type, handler) => { handlers[type] = handler; },
  querySelectorAll: () => [],
};
let selectedCard = -1;
sandbox.window.requestAnimationFrame = () => {};
sandbox.requestAnimationFrame = () => {};
sandbox.document = { querySelector: () => null };
sandbox.window.LearnItCards.wire(fakeRoot, { prefix: 'custom', onView: (index) => { selectedCard = index; } });
const clickedCard = {
  getAttribute: () => '14',
  closest: (selector) => selector === '[data-custom-learn-view]' ? clickedCard : null,
};
handlers.click({ target: clickedCard });
assert.equal(selectedCard, 14, 'clicking a lesson card selects its walkthrough step');
console.log('Learn It card deck lint and renderer: passed');
