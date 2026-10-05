#!/usr/bin/env node
// Click the Guided Lab / Assessment Lab entry points of every SOC module in a
// real browser, as a fresh learner and as a fully-complete one, and fail on
// anything that makes a click "do nothing":
//   a. rail row (.munified-row): locked -> the "Complete X first." message
//      appears and its "Go to X" button reveals + scrolls to the current item;
//      unlocked -> target exists, every ancestor <details>/hidden body is
//      open, and the target is in the viewport once scrolling settles.
//   b. the section's own heading (native <summary> or M01's custom toggle)
//      toggles open/closed.
//   c. the first visible enabled control inside the revealed lab body causes
//      a DOM mutation within 1.5s, with no pageerror / console error.
//   d. re-render the module (view + wire again) and repeat (c).
// Modules are called directly on the login page with a stand-in user, like
// bin/console-tab-sweep.js, so no sign-in or Supabase is involved. "complete"
// = user.remoteVerifiedModuleProgress['soc-NN'] = true (what every module's
// section builder reads as server-verified completion).
//
// Needs the portal running (bin/dev.sh) and Playwright (not a dependency):
//   NODE_PATH=~/.npm/_npx/6bcb61ec6d5aea22/node_modules node bin/lab-click-sweep.js
//   node bin/lab-click-sweep.js 3,12      only Modules 3 and 12
// Env: SWEEP_BASE_URL (default http://localhost:8768), SWEEP_CHROME.
const fs = require('fs');
let chromium;
try { ({ chromium } = require('playwright')); } catch (_) {
  console.error('Playwright is not installed. Use NODE_PATH=<npx cache>/node_modules node bin/lab-click-sweep.js');
  process.exit(2);
}
const BASE = process.env.SWEEP_BASE_URL || 'http://localhost:8768';
const CHROME = process.env.SWEEP_CHROME || (fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined);
const MODULES = (process.argv[2] || '1,2,3,4,5,6,7,8,9,10,11,12').split(',').map(Number);
const LABS = ['Guided Lab', 'Assessment Lab'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (n) => String(n).padStart(2, '0');

async function freshPage(browser, number, complete) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`EXC ${e.message.slice(0, 200)}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`ERR ${m.text().slice(0, 200)}`); });
  await page.goto(`${BASE}/?lab-click-sweep=1#/login`);
  await page.waitForFunction(() => typeof moduleLabFor === 'function' && typeof PROGRAMS !== 'undefined');
  await page.evaluate(([number, complete]) => {
    const key = `soc-${String(number).padStart(2, '0')}`;
    window.__u = { userId: 'lab-click-sweep', id: 'lab-click-sweep', email: 'sweep@example.test', name: 'Sweep',
      remoteVerifiedModuleProgress: complete ? { [key]: true } : {} };
    window.__p = PROGRAMS.find((p) => p.slug === 'soc-analyst');
    if (typeof moduleTwelveUnlocked === 'function') moduleTwelveUnlocked = () => true;
    window.__render = () => {
      const lab = moduleLabFor('soc-analyst', number);
      document.getElementById('app').innerHTML = lab.view(__u, __p);
      wireCommon(); // what the router runs after every view: rail, accordion and every module's wire()
      window.scrollTo(0, 0);
    };
    window.__render();
  }, [number, complete]);
  return { page, errors };
}

// The element a rail row points at, plus its heading toggle and lab body.
const probe = (page, label, nth = 0) => page.evaluate(([label, nth]) => {
  const row = [...document.querySelectorAll('.munified-row')].filter((r) => r.querySelector('.munified-row-label')?.textContent.trim() === label)[nth];
  if (!row) return { missing: true };
  const t = document.getElementById(row.dataset.mnavChipScroll);
  return { id: row.dataset.mnavChipScroll, locked: row.getAttribute('aria-disabled') === 'true', hasTarget: !!t };
}, [label, nth]);

const rowClick = async (page, label, nth = 0) => {
  const row = page.locator('.munified-row', { has: page.locator('.munified-row-label', { hasText: new RegExp(`^${label}$`) }) }).nth(nth);
  // Rows sit in Learn/Practice/Prove groups; only the current group starts
  // open, so a student first opens the group through its own arrow.
  if (await row.evaluate((r) => !!r.closest('.munified-phase-body.is-collapsed'))) {
    const groupId = await row.evaluate((r) => r.closest('.munified-phase-body')?.id);
    if (groupId) await page.locator(`[data-munified-group-toggle][aria-controls="${groupId}"]`).click({ timeout: 3000 });
    await sleep(1100); // group slide animation; force-click would otherwise hit stale coordinates
  }
  await row.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
  for (let prev = null, same = 0, i = 0; same < 3 && i < 40; i += 1) { // wait for the rail to stop moving
    const top = await row.evaluate((r) => Math.round(r.getBoundingClientRect().top));
    same = top === prev ? same + 1 : 0; prev = top; await sleep(100);
  }
  // aria-disabled rows are still clickable for a student; force skips Playwright's enabled check.
  await row.click({ timeout: 3000, force: true });
};

// Everything hiding the element: closed <details>, hidden / is-collapsed bodies.
const hiddenState = (page, id) => page.evaluate((id) => {
  const t = document.getElementById(id);
  if (!t) return { none: true };
  const closed = [];
  for (let a = t; a; a = a.parentElement) {
    if (a.tagName === 'DETAILS' && !a.open) closed.push(`details#${a.id}`);
    if (a.hidden || a.classList?.contains('is-collapsed')) closed.push(`${a.tagName.toLowerCase()}#${a.id}[hidden]`);
  }
  const r = t.getBoundingClientRect();
  return { closed, inView: r.bottom > 0 && r.top < innerHeight, top: Math.round(r.top) };
}, id);

// First visible, enabled primary control in the lab body (not summary, not rail,
// not a submit button of a still-invalid form: the browser blocks that natively).
const firstControl = (page, id) => page.evaluateHandle((id) => {
  const t = document.getElementById(id);
  const root = t?.closest('details, [class*="section-collapsible"]') || t;
  const body = root && [...root.querySelectorAll('button, [role=button], [role=tab]')].filter((b) => {
    if (b.disabled || b.getAttribute('aria-disabled') === 'true' || (b.form && !b.form.checkValidity()) || b.closest('summary, [data-m01-section-toggle], .munified-lock-msg')) return false;
    const r = b.getBoundingClientRect(); const s = getComputedStyle(b);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden';
  });
  return body?.[0] || null;
}, id);

async function clickControl(page, errors, id) {
  const handle = (await firstControl(page, id)).asElement();
  if (!handle) return 'no enabled control found in lab body';
  const desc = await handle.evaluate((b) => `${b.tagName.toLowerCase()} "${(b.textContent || b.getAttribute('aria-label') || '').trim().slice(0, 30)}"`);
  const before = errors.length;
  await handle.evaluate((b) => {
    window.__mut = 0; window.__mo?.disconnect();
    window.__mo = new MutationObserver((l) => { window.__mut += l.length; });
    window.__mo.observe(document.getElementById('app'), { subtree: true, childList: true, attributes: true, characterData: true });
    window.__h0 = location.hash;
  });
  await handle.click({ timeout: 3000 }).catch(async () => handle.evaluate((b) => b.click()));
  await sleep(1500);
  const changed = await page.evaluate(() => window.__mut > 0 || location.hash !== window.__h0).catch(() => true);
  if (errors.length > before) return `${desc}: ${errors.slice(before).join(' | ')}`;
  return changed ? null : `${desc}: click caused no DOM mutation in 1.5s`;
}

async function checkLab(page, errors, label, nth, locked) {
  const out = [];
  const info = await probe(page, label, nth);
  if (info.missing) return [['a rail', `no "${label}" rail row`]];
  const id = info.id;
  if (!info.hasTarget) return [['a rail', `target #${id} missing`]];
  // a. rail row click
  try { await rowClick(page, label, nth); } catch (e) { return [['a rail', `row not clickable: ${e.message.split('\n')[0]}`]]; }
  if (locked) {
    const msg = await page.evaluate(() => { const b = document.querySelector('[data-mnav-lock-msg]'); return { text: b?.textContent || '', go: !!b?.querySelector('.munified-lock-go'), live: b?.getAttribute('aria-live') }; });
    if (!/Complete .+ first\./.test(msg.text) || !msg.go || msg.live !== 'polite') out.push(['a rail', `lock message missing/incomplete: ${JSON.stringify(msg)}`]);
    else {
      const goTo = await page.evaluate(() => { const b = document.querySelector('.munified-lock-go'); return { target: document.querySelector('.munified-row[aria-disabled=true]')?.dataset.mnavLockedTarget }; });
      await page.locator('.munified-lock-go').click();
      await sleep(1200);
      const st = await hiddenState(page, goTo.target);
      if (st.none || st.closed.length || !st.inView) out.push(['a rail', `"Go to" did not reveal+scroll #${goTo.target}: ${JSON.stringify(st)}`]);
      else out.push(['a rail', null]);
    }
    return out; // locked lab body is not reachable; b-d do not apply
  }
  await sleep(1200);
  const st = await hiddenState(page, id);
  out.push(['a rail', st.closed.length ? `ancestors still closed: ${st.closed.join(', ')}` : !st.inView ? `target #${id} not in viewport (top=${st.top})` : null]);
  // b. heading toggle
  const tog = await page.evaluate((id) => {
    const t = document.getElementById(id);
    const m1 = t.matches('[data-m01-section-toggle]') ? t : t.querySelector('[data-m01-section-toggle]') || t.closest('[class*="section-collapsible"]')?.querySelector('[data-m01-section-toggle]');
    const d = t.closest('details');
    return { kind: m1 ? 'm01' : d ? 'details' : 'none', detailsId: d?.id };
  }, id);
  if (tog.kind === 'none') out.push(['b heading', 'no summary or section toggle found']);
  else {
    const state = () => page.evaluate(([id, kind]) => kind === 'm01'
      ? (() => { const t = document.getElementById(id); const b = t.matches('[data-m01-section-toggle]') ? t : t.querySelector('[data-m01-section-toggle]') || t.closest('[class*="section-collapsible"]').querySelector('[data-m01-section-toggle]'); return b.getAttribute('aria-expanded'); })()
      : String(document.getElementById(id).closest('details').open), [id, tog.kind]);
    const trigger = tog.kind === 'm01'
      ? page.locator(`#${id}[data-m01-section-toggle], #${id} [data-m01-section-toggle], [class*="section-collapsible"]:has(#${id}) [data-m01-section-toggle]`).first()
      : page.locator(`details#${id} > summary, details:has(#${id}) > summary`).first();
    const s0 = await state();
    await trigger.click({ timeout: 3000 }).catch((e) => out.push(['b heading', `not clickable: ${e.message.split('\n')[0]}`]));
    await sleep(500);
    const s1 = await state();
    await trigger.click({ timeout: 3000 }).catch(() => {});
    await sleep(500);
    const s2 = await state();
    out.push(['b heading', s0 === s1 ? `state did not change (${s0})` : s2 !== s0 ? `second click did not restore (${s0}->${s1}->${s2})` : null]);
  }
  await rowClick(page, label, nth).catch(() => {}); await sleep(900); // reopen for c
  // c. control in body
  out.push(['c control', await clickControl(page, errors, id)]);
  // d. re-render, repeat
  await page.evaluate(() => window.__render());
  await rowClick(page, label, nth).catch(() => {}); await sleep(900);
  out.push(['d rerender', await clickControl(page, errors, id)]);
  return out;
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  let failed = 0;
  for (const number of MODULES) {
    for (const complete of [false, true]) {
      const { page, errors } = await freshPage(browser, number, complete);
      const counts = await page.evaluate((labs) => Object.fromEntries(labs.map((l) => [l, [...document.querySelectorAll('.munified-row-label')].filter((e) => e.textContent.trim() === l).length])), LABS);
      for (const l of LABS) if (!counts[l]) console.log(`M${pad(number)} ${complete ? 'complete' : 'fresh   '} ${l} SKIP no such rail row`);
      const rows = LABS.flatMap((label) => Array.from({ length: counts[label] }, (_, nth) => [label, nth]));
      for (const [label, nth] of rows) {
        const name = counts[label] > 1 ? `${label} #${nth + 1}` : label;
        const locked = (await probe(page, label, nth)).locked;
        let results;
        try { results = await checkLab(page, errors, label, nth, locked); } catch (e) { results = [['sweep', `script error: ${e.message.split('\n')[0]}`]]; }
        for (const [check, problem] of results) {
          if (problem) failed += 1;
          console.log(`M${pad(number)} ${complete ? 'complete' : 'fresh   '} ${name.padEnd(16)} ${locked ? '[locked] ' : ''}${check.padEnd(10)} ${problem ? `FAIL ${problem}` : 'OK'}`);
        }
        await page.evaluate(() => window.__render());
      }
      await page.close().catch(() => {});
    }
  }
  await browser.close();
  console.log(failed ? `${failed} check(s) FAILED.` : 'All lab click checks passed.');
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
