// Sign-out clears the staff-only Prove It recommendation caches (2026-11-21).
//
// Contracts:
//   1. signOut() empties socProveRecommendations (SOC Submission Sheet) and
//      the Help Desk grading-card caches (recommendations, decision reviews,
//      drawn cards, panel rows), as it already does for the Instructor Guide.
//   2. A recommendation read still in flight at sign-out is dropped when it
//      lands, so it can't refill an emptied cache.
//   3. Supabase Auth's SIGNED_OUT (another tab, an expired login, a dropped
//      session) clears both caches too; a token refresh keeps them.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const ctx = loadPortal();
const run = (code) => vm.runInContext(code, ctx);
const flush = () => new Promise((resolve) => setImmediate(resolve));
const REC = { lab_attempt_id: 'att-1', status: 'scored' };

function fill() {
  run(`socProveRecommendations.set('att-1', ${JSON.stringify(REC)});
    itsProveRecommendations.set('att-1', ${JSON.stringify(REC)});
    itsProveReviews.set('att-1', [{ id: 'rev-1' }]);
    itsProveCards.set('att-1', { item: {} });
    itsProvePanelRows.set('att-1', {});`);
}
const sizes = () => run('[socProveRecommendations.size, itsProveRecommendations.size, itsProveReviews.size, itsProveCards.size, itsProvePanelRows.size]');

async function main() {
  run('globalThis.requestAnimationFrame = () => 0;'); // signOut() re-renders the login page

  // 1. signOut() clears every cache.
  fill();
  assert.deepEqual([...sizes()], [1, 1, 1, 1, 1]);
  await run('signOut()');
  assert.deepEqual([...sizes()], [0, 0, 0, 0, 0], 'sign-out clears both recommendation caches');

  // 2. Reads in flight at sign-out are dropped when they land.
  run(`supabaseResponder = (call) => new Promise((resolve) => {
    (globalThis.__land = globalThis.__land || []).push(() => resolve({ data: [${JSON.stringify(REC)}], error: null }));
  });`);
  const socLoad = run(`socProveLoadRecommendations(['att-1'])`);
  const itsLoad = run(`itsProveLoadRecommendations(['att-1'])`);
  await flush();
  await run('signOut()');
  run('__land.forEach((land) => land()); __land = [];');
  assert.deepEqual([...await socLoad], [], 'a late SOC read reports nothing loaded');
  assert.deepEqual([...await itsLoad], [], 'a late Help Desk read reports nothing loaded');
  assert.deepEqual([...sizes()], [0, 0, 0, 0, 0], 'late reads do not refill the caches');

  //    Signed in, a read still fills the cache (the guard only drops stale reads).
  run(`supabaseResponder = () => ({ data: [${JSON.stringify(REC)}], error: null });`);
  await run(`socProveLoadRecommendations(['att-1'])`);
  await run(`itsProveLoadRecommendations(['att-1'])`);
  assert.equal(run(`socProveRecommendations.get('att-1').status`), 'scored');
  assert.equal(run(`itsProveRecommendations.get('att-1').status`), 'scored');

  // 3. SIGNED_OUT clears both caches. Fresh copies of the two files are loaded
  //    with a listener stub, as tests/soc-instructor-guide.test.js does.
  const ctx2 = loadPortal();
  const run2 = (code) => vm.runInContext(code, ctx2);
  run2('globalThis.__authListeners = []; mntSupabase.auth.onAuthStateChange = (fn) => { __authListeners.push(fn); return { data: { subscription: { unsubscribe() {} } } }; }; itswSignOutWatched = false; itswWatchSignOut();');
  run2(fs.readFileSync(path.join(__dirname, '..', 'portal', 'admin-sheets', 'soc-prove-recommendation.js'), 'utf8').replace(/^const socProveRecommendations = new Map\(\);.*$/m, '').replace(/^let socProveCacheEpoch = 0;$/m, ''));
  assert.equal(run2('__authListeners.length'), 2, 'Help Desk and SOC each listen for the session ending');
  const fill2 = () => run2(`socProveRecommendations.set('att-1', {}); itsProveRecommendations.set('att-1', {}); itsProveReviews.set('att-1', []);`);
  fill2();
  run2(`__authListeners.forEach((fn) => fn('TOKEN_REFRESHED', { user: {} }))`);
  assert.equal(run2('socProveRecommendations.size + itsProveRecommendations.size'), 2, 'a token refresh keeps the caches');
  run2(`__authListeners.forEach((fn) => fn('SIGNED_OUT', null))`);
  assert.equal(run2('socProveRecommendations.size + itsProveRecommendations.size + itsProveReviews.size'), 0, 'SIGNED_OUT clears both caches');

  console.log('signout-prove-caches: all checks passed');
}

main().catch((err) => { console.error(err); process.exit(1); });
