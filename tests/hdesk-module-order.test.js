// Help Desk module order: each module key keeps its content, minutes and
// saved progress, but shows under the display number and week of the
// rebuilt course order (ITHD-101.1 to 101.9). This test holds that order in
// one place and checks every file that repeats a module's number: the
// catalogue, the week groups, the page registry, lab links, lesson labels,
// coach numbers and Finish links, and the admin sheet labels.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const ROOT = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const ctx = loadPortal();
const run = (code) => vm.runInContext(code, ctx);
const HD = run(`PROGRAMS.find((p) => p.slug === 'it-support')`);
const LABS = run('LABS').filter((l) => String(l.module).startsWith('its-'));
const pad = (n) => String(n).padStart(2, '0');

// [key, display number, week, technical minutes]. Minutes are the filed
// values and must not move with the number.
const ORDER = [
  ['its-01', 1, 1, 180],
  ['its-10', 2, 1, 210],
  ['its-11', 3, 2, 210],
  ['its-02', 4, 2, 660],
  ['its-03', 5, 3, 180],
  ['its-07', 6, 3, 120],
  ['its-05', 7, 4, 720],
  ['its-06', 8, 4, 360],
  ['its-04', 9, 5, 480],
  ['its-08', 10, 5, 120],
  ['its-09', 11, 6, 120],
  ['its-12', 12, 6, 240],
];
const numberOf = Object.fromEntries(ORDER.map(([key, n]) => [key, n]));

// Catalogue: numbers 1 to 12 with no repeats, weeks and minutes as mapped,
// and the module map itself in display order.
{
  assert.deepEqual(Object.keys(HD.modules), ORDER.map(([key]) => key), 'the module map runs in display-number order');
  ORDER.forEach(([key, n, week, minutes]) => {
    const m = HD.modules[key];
    assert.ok(m, `${key} exists`);
    assert.equal(m.key, key);
    assert.equal(m.number, n, `${key} is Module ${n}`);
    assert.equal(m.week, week, `${key} is in week ${week}`);
    assert.equal(m.durationMinutes, minutes, `${key} keeps ${minutes} minutes`);
    assert.equal(m.creditMinutes, minutes, `${key} keeps ${minutes} credit minutes`);
  });
  const numbers = Object.values(HD.modules).map((m) => m.number).sort((a, b) => a - b);
  assert.deepEqual(numbers, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 'numbers 1 to 12, no repeats');
  assert.equal(Object.values(HD.modules).reduce((sum, m) => sum + m.durationMinutes, 0), 3600, 'technical minutes total 3,600');
  assert.equal(HD.modules['its-12'].isCapstone, true, 'Module 12 is the capstone');
}

// Week groups: six weeks, two modules each, matching each module's week.
{
  assert.equal(HD.weekGroups.length, 6);
  HD.weekGroups.forEach((group, i) => {
    assert.equal(group.number, i + 1);
    assert.match(group.label, new RegExp(`^Week ${i + 1} — `));
    const expected = ORDER.filter(([, , week]) => week === i + 1).map(([key]) => key);
    assert.deepEqual([...group.modules], expected, `week ${i + 1} holds ${expected.join(' and ')}`);
  });
}

// Page registry: /module/N opens the page for the key that is Module N.
ORDER.forEach(([key, n]) => {
  const page = run(`MODULE_LABS['it-support/${n}']`);
  assert.ok(page, `a page is registered for Module ${n}`);
  assert.equal(page.moduleKey, key, `#/program/it-support/module/${n} opens ${key}`);
});

// Lab cards link to their own module's number.
LABS.forEach((lab) => {
  if (!lab.portalEntry) return;
  assert.equal(lab.portalEntry, `#/program/it-support/module/${numberOf[lab.module]}`, `${lab.key} links to its module`);
});

// Lesson labels on each page start with the module's display number.
ORDER.forEach(([key, n]) => {
  const file = `portal/it-support-module-${key.slice(4)}.js`;
  const labels = [...read(file).matchAll(new RegExp(`id: '${key}-lesson-\\d+', number: '([^']+)'`, 'g'))].map((m) => m[1]);
  assert.ok(labels.length > 0, `${file} has lesson labels`);
  labels.forEach((label, i) => assert.equal(label, `${n}.${i + 1}`, `${file} lesson ${i + 1} reads ${n}.${i + 1}`));
});

// Coaches (ui/helpdesk-coaches.js can't load portal/data.js, so it repeats
// the numbers): each coach's module number and Finish link follow its key.
{
  const coaches = read('ui/helpdesk-coaches.js');
  for (let k = 1; k <= 11; k += 1) {
    const id = `hd-m${pad(k)}`;
    const n = numberOf[`its-${pad(k)}`];
    const declared = new RegExp(`hdRegisterSimpleCoach\\('${id}', (\\d+),|id: '${id}',\\s*module: (\\d+),`).exec(coaches);
    assert.ok(declared, `${id} declares a module number`);
    assert.equal(Number(declared[1] || declared[2]), n, `${id} shows Module ${n}`);
    const finishes = [...coaches.matchAll(new RegExp(`itsPortalUrl\\('#/program/it-support/module/(\\d+)', '${id}'\\)`, 'g'))].map((m) => Number(m[1]));
    assert.ok(finishes.length > 0, `${id} has a Finish link`);
    finishes.forEach((f) => assert.equal(f, n, `${id} finishes on Module ${n}`));
  }
}

// Admin sheet labels name each lab's module by its display number.
{
  const sheet = read('portal/admin-sheets/hdesk.js');
  const labels = [...sheet.matchAll(/'(lab-its-(\d\d)-[a-z0-9-]+)': 'Module (\d\d) · /g)];
  assert.ok(labels.length >= 12, 'the admin sheet labels every Help Desk lab');
  labels.forEach(([, labKey, keyNum, shown]) => {
    assert.equal(Number(shown), numberOf[`its-${keyNum}`], `${labKey} is labelled Module ${pad(numberOf[`its-${keyNum}`])}`);
  });
}

// Admin student detail lists module rows by display number.
{
  const order = run('adminModuleOrder');
  assert.equal(order('HDESK', 'its-10'), 2);
  assert.equal(order('HDESK', 'its-02'), 4);
  assert.equal(order('HDESK', 'not-a-module'), Infinity, 'an unknown key sorts last');
  assert.equal(order('SOCAN', 'soc-03'), 3, 'SOC numbers are unchanged');
}

// Per-module grades (gradebook and exports) list modules in course order.
{
  const scores = run('computeModuleScores')(HD, [], []);
  assert.deepEqual([...scores.map((s) => s.moduleKey)], ORDER.map(([key]) => key), 'module grades run in display-number order');
}

// Other programs keep their numbers in key order.
run('PROGRAMS').filter((p) => p.slug !== 'it-support' && p.modules).forEach((p) => {
  const keys = Object.keys(p.modules);
  assert.deepEqual(keys.map((k) => p.modules[k].number), keys.map((_, i) => i + 1), `${p.slug} keeps Modules 1 to 12 in key order`);
});

console.log('hdesk-module-order: ok');
