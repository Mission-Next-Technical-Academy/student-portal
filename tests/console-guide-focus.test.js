const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const listeners = {};
const classes = new Set();
const attrs = {};
const label = { textContent: 'Minimize' };
const toggle = {
  querySelector: () => label,
  setAttribute: (name, value) => { attrs[name] = value; },
  set title(value) { this._title = value; },
};
const tip = {
  classList: { contains: (name) => classes.has(name), add: (name) => classes.add(name), remove: (name) => classes.delete(name), toggle: (name, on) => on ? classes.add(name) : classes.delete(name) },
  getBoundingClientRect: () => ({ left: 0, right: 100, top: 0, bottom: 100 }),
  querySelector: () => toggle,
  contains: () => false,
};
const host = { querySelector: (selector) => selector.includes(':not(.is-collapsed)') ? (classes.has('is-collapsed') ? null : tip) : tip };
const control = { tagName: 'INPUT', closest: () => host, getBoundingClientRect: () => ({ left: 20, right: 40, top: 20, bottom: 40 }) };
const document = { addEventListener: (name, handler) => { listeners[name] = handler; } };
const window = { consoleGuideCenterOnToggleBound: false };
const context = { document, window, esc: String };
vm.createContext(context);
vm.runInContext(fs.readFileSync('portal/console-guide.js', 'utf8'), context);

listeners.focusin({ target: control });
assert.ok(classes.has('is-collapsed'), 'an overlapping guide minimizes when a form control receives focus');
assert.equal(attrs['aria-expanded'], 'false');
assert.equal(label.textContent, 'Show guide');

listeners.focusout({ target: control, relatedTarget: null });
assert.ok(!classes.has('is-collapsed'), 'the expanded guidance returns when focus leaves the form');
assert.equal(attrs['aria-expanded'], 'true');
assert.equal(label.textContent, 'Minimize');

console.log('Console guide focus behavior passed.');
