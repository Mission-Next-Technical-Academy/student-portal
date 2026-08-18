#!/usr/bin/env node
// Render every registered portal module lab in a node vm and report failures.
//
// The portal is plain script-tag JS with no build step, so the cheapest real
// check is to load the same files index.html loads, in order, against DOM stubs
// and call the router's view function for each module route. It catches the
// failures that actually happen here: a throw at load time, a typo'd helper, a
// module registered under the wrong number, a view that returns nothing.
//
//   node bin/portal-check.js            check every module
//   node bin/portal-check.js 3 4        check only modules 3 and 4
const fs = require('fs'), vm = require('vm'), path = require('path');
const PORTAL = path.join(__dirname, '..', 'portal');

const ctx = { console };
vm.createContext(ctx);
vm.runInContext(`
  const mkStore = () => ({ _s:{}, getItem(k){ return this._s[k] ?? null; },
    setItem(k,v){ this._s[k]=String(v); }, removeItem(k){ delete this._s[k]; } });
  var localStorage = mkStore(), sessionStorage = mkStore();
  var location = { hash: '#/portal', hostname: '127.0.0.1', pathname: '/', search: '' };
  var history = { replaceState(){}, pushState(){} };
  const elStub = () => new Proxy(function(){}, { get: (t, p) => {
    if (p === 'style' || p === 'dataset') return {};
    if (p === 'classList') return { add(){}, remove(){}, toggle(){}, contains(){ return false; } };
    if (p === 'children' || p === 'childNodes') return [];
    if (p === Symbol.toPrimitive || p === 'toString') return () => '';
    if (['innerHTML','textContent','value','id','className'].includes(p)) return '';
    return typeof p === 'symbol' ? undefined : ((...a) => elStub());
  }, set: () => true, apply: () => elStub() });
  var document = new Proxy({}, { get: (t, p) => {
    if (p === 'querySelectorAll') return () => [];
    if (p === 'body' || p === 'documentElement') return elStub();
    if (p === 'addEventListener') return () => {};
    return (...a) => elStub();
  }, set: () => true });
  var window = new Proxy({ location, history, document }, {
    get: (t, p) => (p in t ? t[p] : (p === 'addEventListener' || p === 'scrollTo' ? () => {} : undefined)),
    set: () => true });
`, ctx);
ctx.URLSearchParams = URLSearchParams;
ctx.URL = URL;

const files = ['data.js', 'lab-runtime.js', 'module-registry.js',
  ...fs.readdirSync(PORTAL).filter((f) => /^module-\d\d\.js$/.test(f)).sort(),
  'app.js'];

for (const file of files) {
  try {
    vm.runInContext(fs.readFileSync(path.join(PORTAL, file), 'utf8'), ctx, { filename: file });
  } catch (error) {
    console.error(`LOAD FAIL ${file}: ${error.message}`);
    process.exit(1);
  }
}

const wanted = process.argv.slice(2).map(Number);
const registered = vm.runInContext('Object.values(MODULE_LABS).map((d) => ({ program: d.program, n: d.moduleNumber, key: d.moduleKey }))', ctx);
const targets = wanted.length ? registered.filter((d) => wanted.includes(d.n)) : registered;

for (const n of wanted) {
  if (!registered.some((d) => d.n === n)) console.log(`  module ${n}  not registered (placeholder)`);
}

// user2 is the SOC Analyst student — the only demo account with the track.
vm.runInContext("signIn('user2', 'user2');", ctx);

let failures = 0;
for (const target of targets) {
  try {
    const html = vm.runInContext(
      `(() => { const p = PROGRAMS.find((x) => x.slug === ${JSON.stringify(target.program)});
        const lab = moduleLabFor(${JSON.stringify(target.program)}, ${target.n});
        return lab.view(currentUser(), p); })()`, ctx);
    if (typeof html !== 'string' || html.length < 500) throw new Error(`view returned ${typeof html} of length ${(html || '').length}`);
    console.log(`  module ${target.n}  OK  (${target.key}, ${html.length} chars)`);
  } catch (error) {
    failures += 1;
    console.error(`  module ${target.n}  FAIL  ${error.message}`);
  }
}

// The program overview must survive too — every module links back to it.
try {
  vm.runInContext("viewProgram(currentUser(), 'soc-analyst')", ctx);
  console.log('  program overview  OK');
} catch (error) {
  failures += 1;
  console.error(`  program overview  FAIL  ${error.message}`);
}

process.exit(failures ? 1 : 0);
