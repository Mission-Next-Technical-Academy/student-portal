const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const handlers = {};
const makeButton = (index) => {
  const attrs = { 'data-lab-max-toggle': String(index) };
  return {
    attrs,
    getAttribute: (name) => attrs[name] ?? null,
    setAttribute: (name, value) => { attrs[name] = value; },
    setAttributeTitle(value) { this.title = value; },
    focus() {},
    innerHTML: '',
  };
};
const makeCard = (index) => {
  const classes = new Set();
  const button = makeButton(index);
  const kicker = {
    textContent: 'Guided Lab',
    nextElementSibling: { tagName: 'H2' },
    parentElement: { parentElement: {} },
    closest: (selector) => selector === '[data-lab-maximize]' ? card : null,
  };
  const card = {
    tagName: 'DETAILS', open: false, scrollTop: 0, isConnected: true, children: [],
    classList: { toggle: (name, on) => on ? classes.add(name) : classes.delete(name), contains: (name) => classes.has(name) },
    querySelector: (selector) => selector.includes('data-lab-max-toggle') ? button : null,
    contains: () => true,
    scrollIntoView: () => {},
    button,
  };
  return { card, button, kicker, classes };
};
const first = makeCard(0);
const second = makeCard(1);
const app = { querySelectorAll: () => [first.kicker, second.kicker] };
const rootClasses = new Set();
const document = {
  readyState: 'loading',
  getElementById: (id) => id === 'app' ? app : null,
  addEventListener: (name, fn, capture) => { (handlers[name] ||= []).push({ fn, capture }); },
  documentElement: { classList: { toggle: (name, on) => on ? rootClasses.add(name) : rootClasses.delete(name) } },
};
const context = {
  document, window: { addEventListener() {} }, location: { hash: '#module' },
  requestAnimationFrame: (fn) => fn(), setTimeout: () => {},
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('portal/lab-maximize.js', 'utf8'), context);

const click = handlers.click.find(({ capture }) => capture).fn;
click({
  target: { closest: (selector) => selector === '[data-lab-max-toggle]' ? first.button : null },
  preventDefault() {}, stopPropagation() {},
});
assert.ok(first.classes.has('lab-max-active'), 'first lab maximizes');

const toggle = handlers.toggle.find(({ capture }) => capture).fn;
second.card.open = true;
toggle({ target: second.card });
assert.ok(!first.classes.has('lab-max-active'), 'opening another lab unmaximizes the previous lab');
assert.equal(first.button.getAttribute('aria-pressed'), 'false');
assert.ok(!rootClasses.has('lab-max-open'), 'page scroll is restored');

console.log('Lab maximize switching passed.');
