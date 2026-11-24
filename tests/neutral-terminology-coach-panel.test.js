// The simulator's terminology layer (ui/neutral-terminology.js) shows SOC
// pages in vendor-neutral words ("Windows" becomes "Endpoint OS"). The IT Help
// Desk course teaches named Windows tools, so inside the Help Desk workload it
// keeps those words in the page (#content), the left nav (#sidenav) and the
// coach panel (#coach-panel), where coached-lab step text appears.
//
// This test proves:
//   - Help Desk coach panel keeps Windows, PowerShell and Microsoft, on the
//     first page walk, for nodes added later, for changed text and for
//     attributes such as title.
//   - SOC reads exactly as before: the coach panel and the page are still
//     neutralized when the Help Desk workload is not open.
//   - Inside the Help Desk workload, anything outside those three containers
//     is still neutralized.
//
// Loads the real script into a Node vm with a small fake DOM.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SOURCE = fs.readFileSync(path.join(__dirname, '..', 'ui', 'neutral-terminology.js'), 'utf8');

const HD_TEXT = 'Software › Windows performance: open PowerShell, then Microsoft Store.';
const HD_TITLE = 'Run PowerShell as administrator';
const NEUTRAL_TEXT = 'Software › Endpoint OS performance: open command shell, then platform vendor Store.';
const NEUTRAL_TITLE = 'Run command shell as administrator';

function sim(bodyClass) {
  class FakeNode {
    constructor(nodeType) {
      this.nodeType = nodeType;
      this.parentNode = null;
      this.childNodes = [];
    }
    get parentElement() {
      return this.parentNode instanceof FakeElement ? this.parentNode : null;
    }
    appendChild(child) {
      child.parentNode = this;
      this.childNodes.push(child);
      return child;
    }
  }
  FakeNode.ELEMENT_NODE = 1;
  FakeNode.TEXT_NODE = 3;

  class FakeText extends FakeNode {
    constructor(value) {
      super(3);
      this.nodeValue = value;
    }
  }

  class FakeElement extends FakeNode {
    constructor(tagName, id) {
      super(1);
      this.tagName = tagName.toUpperCase();
      this.id = id || '';
      this.attributes = new Map();
      const classes = new Set();
      this.classList = {
        add: (c) => classes.add(c),
        contains: (c) => classes.has(c),
      };
    }
    hasAttribute(name) { return this.attributes.has(name); }
    getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    // Supports the comma-separated "#id" lists the script passes in.
    closest(selector) {
      const ids = selector.split(',').map((part) => {
        const trimmed = part.trim();
        if (!/^#[\w-]+$/.test(trimmed)) throw new Error(`fake closest() cannot parse ${trimmed}`);
        return trimmed.slice(1);
      });
      for (let el = this; el; el = el.parentElement) {
        if (ids.includes(el.id)) return el;
      }
      return null;
    }
  }

  const body = new FakeElement('body');
  for (const c of bodyClass.split(' ')) body.classList.add(c);

  const document = {
    body,
    title: 'Simulator',
    createTreeWalker(root) {
      const nodes = [];
      const visit = (node) => {
        for (const child of node.childNodes) {
          nodes.push(child);
          visit(child);
        }
      };
      visit(root);
      let index = 0;
      return { nextNode: () => (index < nodes.length ? nodes[index++] : null) };
    },
  };

  const storage = () => ({ length: 0, key: () => null, getItem: () => null, setItem() {} });
  let observerCallback = null;

  const context = {
    document,
    Node: FakeNode,
    Element: FakeElement,
    NodeFilter: { SHOW_ELEMENT: 1, SHOW_TEXT: 4 },
    localStorage: storage(),
    sessionStorage: storage(),
    MutationObserver: class {
      constructor(callback) { observerCallback = callback; }
      observe() {}
    },
  };
  context.window = context;

  const el = (tag, id, text, title) => {
    const node = new FakeElement(tag, id);
    if (text) node.appendChild(new FakeText(text));
    if (title) node.setAttribute('title', title);
    return node;
  };

  // The page as it stands when the script loads.
  const content = body.appendChild(el('main', 'content', HD_TEXT));
  const sidenav = body.appendChild(el('nav', 'sidenav', HD_TEXT));
  const topbar = body.appendChild(el('header', 'topbar', HD_TEXT, HD_TITLE));
  const panel = body.appendChild(el('aside', 'coach-panel'));
  const panelLoaded = panel.appendChild(el('p', '', HD_TEXT, HD_TITLE));

  vm.createContext(context);
  vm.runInContext(SOURCE, context, { filename: 'neutral-terminology.js' });

  // The coach fills the panel after load: one added step, then a text change.
  const panelAdded = el('div', '', HD_TEXT, HD_TITLE);
  panel.appendChild(panelAdded);
  const changed = panelLoaded.childNodes[0];
  changed.nodeValue = HD_TEXT;
  // Something else added outside the three containers.
  const outsideAdded = body.appendChild(el('div', 'toast', HD_TEXT, HD_TITLE));
  observerCallback([
    { type: 'childList', addedNodes: [panelAdded] },
    { type: 'characterData', target: changed, addedNodes: [] },
    { type: 'childList', addedNodes: [outsideAdded] },
  ]);

  const text = (node) => node.childNodes[0].nodeValue;
  return { content, sidenav, topbar, panelLoaded, panelAdded, outsideAdded, text };
}

let failures = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (err) {
    failures += 1;
    console.log(`not ok - ${name}\n  ${err.message}`);
  }
}

const hd = sim('wl-helpdesk route-helpdesk-home');
check('Help Desk coach panel keeps the words already on the page at load', () => {
  assert.equal(hd.text(hd.panelLoaded), HD_TEXT);
  assert.equal(hd.panelLoaded.getAttribute('title'), HD_TITLE);
});
check('Help Desk coach panel keeps the words in a step added later', () => {
  assert.equal(hd.text(hd.panelAdded), HD_TEXT);
  assert.equal(hd.panelAdded.getAttribute('title'), HD_TITLE);
});
check('Help Desk page and left nav still keep their words', () => {
  assert.equal(hd.text(hd.content), HD_TEXT);
  assert.equal(hd.text(hd.sidenav), HD_TEXT);
});
check('Help Desk: text outside the page, nav and coach panel is still neutral', () => {
  assert.equal(hd.text(hd.topbar), NEUTRAL_TEXT);
  assert.equal(hd.topbar.getAttribute('title'), NEUTRAL_TITLE);
  assert.equal(hd.text(hd.outsideAdded), NEUTRAL_TEXT);
  assert.equal(hd.outsideAdded.getAttribute('title'), NEUTRAL_TITLE);
});

const soc = sim('wl-defender route-defender-home');
check('SOC coach panel reads exactly as before (neutral words)', () => {
  assert.equal(soc.text(soc.panelLoaded), NEUTRAL_TEXT);
  assert.equal(soc.panelLoaded.getAttribute('title'), NEUTRAL_TITLE);
  assert.equal(soc.text(soc.panelAdded), NEUTRAL_TEXT);
  assert.equal(soc.panelAdded.getAttribute('title'), NEUTRAL_TITLE);
});
check('SOC page, left nav and the rest read exactly as before (neutral words)', () => {
  assert.equal(soc.text(soc.content), NEUTRAL_TEXT);
  assert.equal(soc.text(soc.sidenav), NEUTRAL_TEXT);
  assert.equal(soc.text(soc.topbar), NEUTRAL_TEXT);
  assert.equal(soc.text(soc.outsideAdded), NEUTRAL_TEXT);
});

if (failures) {
  console.log(`${failures} check(s) failed`);
  process.exit(1);
}
console.log('neutral-terminology coach panel: all checks passed');
