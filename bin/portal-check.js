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

  // Stub Supabase for test harness: makes signIn/currentUser async calls resolve properly.
  var mntSupabase = {
    auth: {
      _session: null,
      async signInWithPassword({ email, password }) {
        if (email === 'user2@missionnext.example' && password === 'user2') {
          this._session = {
            user: { id: 'stub-user2-id', email: 'user2@missionnext.example' }
          };
          return {
            data: { session: this._session },
            error: null
          };
        }
        return { data: { session: null }, error: { message: 'Invalid credentials' } };
      },
      async getSession() {
        return {
          data: { session: this._session }
        };
      }
    },
    from(table) {
      const builder = {
        _filters: {},
        select: (cols) => builder,
        eq: (column, value) => {
          builder._filters[column] = value;
          return builder;
        },
        maybeSingle: async function() {
          if (this._table === 'students' && this._filters.user_id === 'stub-user2-id') {
            return {
              data: { student_id: 'user2', track_code: 'SOCAN', is_admin: false },
              error: null
            };
          }
          return { data: null, error: null };
        },
        single: async function() {
          if (this._table === 'students' && this._filters.user_id === 'stub-user2-id') {
            return {
              data: { student_id: 'user2', track_code: 'SOCAN', is_admin: false },
              error: null
            };
          }
          return { data: null, error: { message: 'No rows' } };
        },
        insert: async function() { return { error: null }; },
        upsert: async function() { return { error: null }; },
        then: function(onResolve, onReject) {
          // Support Promise-like interface for fire-and-forget calls
          if (this._table === 'students' && this._filters.user_id === 'stub-user2-id') {
            return onResolve?.({
              data: { student_id: 'user2', track_code: 'SOCAN', is_admin: false },
              error: null
            });
          }
          return onResolve?.({ data: null, error: null });
        },
        _table: table
      };
      return builder;
    }
  };
`, ctx);
ctx.URLSearchParams = URLSearchParams;
ctx.URL = URL;

const files = ['data.js', 'lab-runtime.js', 'module-registry.js',
  ...fs.readdirSync(PORTAL).filter((f) => /-module-\d\d\.js$/.test(f)).sort(),
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

// Run async test in a wrapper that returns a Promise we can await from Node.
const testPromise = vm.runInContext(`
  (async () => {
    // user2 is the SOC Analyst student — the only demo account with the track.
    await signIn('user2', 'user2');

    let failures = 0;
    const targets = ${JSON.stringify(targets)};

    for (const target of targets) {
      try {
        const p = PROGRAMS.find((x) => x.slug === target.program);
        const lab = moduleLabFor(target.program, target.n);
        const user = await currentUser();
        const html = lab.view(user, p);
        if (typeof html !== 'string' || html.length < 500) throw new Error(\`view returned \${typeof html} of length \${(html || '').length}\`);
        console.log(\`  module \${target.n}  OK  (\${target.key}, \${html.length} chars)\`);
      } catch (error) {
        failures += 1;
        console.error(\`  module \${target.n}  FAIL  \${error.message}\`);
      }
    }

    // The program overview must survive too — every module links back to it.
    try {
      const user = await currentUser();
      viewProgram(user, 'soc-analyst');
      console.log('  program overview  OK');
    } catch (error) {
      failures += 1;
      console.error(\`  program overview  FAIL  \${error.message}\`);
    }

    return failures;
  })()
`, ctx);

// Await the async test function and exit with the failure count
(async () => {
  const failures = await testPromise;
  process.exit(failures ? 1 : 0);
})();
