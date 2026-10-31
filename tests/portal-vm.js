// Loads the portal's browser scripts into a Node vm, in portal/index.html's
// order, against minimal DOM/storage stubs (the same approach as
// bin/portal-check.js). Not a test on its own; tests require() it.
//
// The Supabase stub records every call in ctx.supabaseCalls and answers each
// query with ctx.supabaseResponder(call) (default: no rows, no error), so a
// test can script what the "database" returns. Storage calls are recorded the
// same way, with table 'storage:<bucket>'.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const PORTAL = path.join(__dirname, '..', 'portal');

function loadPortal() {
  const ctx = { console, setTimeout, clearTimeout, URLSearchParams, URL };
  vm.createContext(ctx);
  vm.runInContext(`
    const mkStore = () => ({ _s: {}, getItem(k) { return this._s[k] ?? null; },
      setItem(k, v) { this._s[k] = String(v); }, removeItem(k) { delete this._s[k]; }, clear() { this._s = {}; } });
    var localStorage = mkStore(), sessionStorage = mkStore();
    class CustomEvent { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } }
    var location = { hash: '#/portal', hostname: '127.0.0.1', pathname: '/', search: '' };
    var history = { replaceState() {}, pushState() {} };
    const elStub = () => new Proxy(function () {}, { get: (t, p) => {
      if (p === 'style' || p === 'dataset') return {};
      if (p === 'classList') return { add() {}, remove() {}, toggle() {}, contains() { return false; } };
      if (p === 'children' || p === 'childNodes') return [];
      if (p === Symbol.toPrimitive || p === 'toString') return () => '';
      if (['innerHTML', 'textContent', 'value', 'id', 'className'].includes(p)) return '';
      return typeof p === 'symbol' ? undefined : ((...a) => elStub());
    }, set: () => true, apply: () => elStub() });
    var document = new Proxy({}, { get: (t, p) => {
      if (p === 'querySelectorAll') return () => [];
      if (p === 'body' || p === 'documentElement') return elStub();
      if (p === 'addEventListener') return () => {};
      return (...a) => elStub();
    }, set: () => true });
    var window = new Proxy({ location, history, document }, {
      get: (t, p) => (p in t ? t[p] : (p === 'addEventListener' || p === 'dispatchEvent' || p === 'scrollTo' ? () => {} : undefined)),
      set: (t, p, value) => { t[p] = value; globalThis[p] = value; return true; } });

    var supabaseCalls = [];
    var supabaseResponder = () => ({ data: null, error: null });
    var supabaseRpcResponder = () => ({ data: null, error: null });
    var mntSupabase = {
      auth: { async getSession() { return { data: { session: null } }; }, async signOut() { return { error: null }; } },
      from(table) {
        const call = { table, op: 'select', filters: {}, payload: null };
        supabaseCalls.push(call);
        const settle = () => Promise.resolve(supabaseResponder(call));
        const builder = {
          select(columns) { call.columns = columns; return builder; },
          eq(column, value) { call.filters[column] = value; return builder; },
          not() { return builder; }, in() { return builder; }, order() { return builder; }, limit() { return builder; },
          insert(payload) { call.op = 'insert'; call.payload = payload; return builder; },
          update(payload) { call.op = 'update'; call.payload = payload; return builder; },
          upsert(payload, options) { call.op = 'upsert'; call.payload = payload; call.options = options || {}; return settle(); },
          maybeSingle: settle, single: settle,
          then(onResolve, onReject) { return settle().then(onResolve, onReject); },
        };
        return builder;
      },
      async rpc(name, args) {
        supabaseCalls.push({ rpc: name, args });
        return supabaseRpcResponder(name, args);
      },
      // Storage calls are recorded in supabaseCalls too ({ table: 'storage:<bucket>',
      // op: 'upload' | 'remove' | 'createSignedUrl' }) and answered by supabaseResponder.
      storage: {
        from(bucket) {
          const record = (op, payload, options) => {
            const call = { table: 'storage:' + bucket, op, filters: {}, payload, options: options || {} };
            supabaseCalls.push(call);
            return Promise.resolve(supabaseResponder(call));
          };
          return {
            upload(objectPath, file, options) { return record('upload', { path: objectPath, file }, options); },
            remove(paths) { return record('remove', paths); },
            createSignedUrl(objectPath, expiresIn) { return record('createSignedUrl', { path: objectPath, expiresIn }); },
          };
        },
      },
    };
  `, ctx);
  ctx.crypto = require('node:crypto').webcrypto;
  ctx.MNT_SUPABASE_URL = 'https://stub.supabase.co';
  ctx.MNT_SUPABASE_ANON_KEY = 'stub-anon-key';
  ctx.fetch = async () => ({ ok: true, async json() { return {}; } });

  const indexHtml = fs.readFileSync(path.join(PORTAL, 'index.html'), 'utf8');
  const files = [...indexHtml.matchAll(/<script\s+src="([^"]+)"/g)]
    .map((match) => match[1].split('?')[0])
    .filter((file) => !file.startsWith('vendor/') && file !== 'supabase-config.js' && file !== 'm360-entry.js');
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(PORTAL, file), 'utf8'), ctx, { filename: file });
  }
  return ctx;
}

module.exports = { loadPortal };
