#!/usr/bin/env node
// Click every tab of every SOC console (Modules 3–12) in a real browser and
// fail on anything a student would hit: a frozen page, a JS error, a tab that
// does not switch, or a tab that renders nothing.
//
// bin/portal-check.js renders each module once in a DOM stub; it cannot see
// wiring or click-time bugs (for example a MutationObserver that re-triggers
// itself and hangs the page on the first click). This covers that gap.
//
// Needs the portal running (bin/dev.sh) and Playwright, which is not a
// project dependency:
//   npx -p playwright node bin/console-tab-sweep.js
//   node bin/console-tab-sweep.js 5,11          only Modules 5 and 11
// Env: SWEEP_BASE_URL (default http://localhost:8768), SWEEP_CHROME (browser
// executable, default /usr/bin/google-chrome when present).
const fs = require('fs');

let chromium;
try { ({ chromium } = require('playwright')); } catch (_) {
  console.error('Playwright is not installed. Run: npx -p playwright node bin/console-tab-sweep.js');
  process.exit(2);
}

const BASE = process.env.SWEEP_BASE_URL || 'http://localhost:8768';
const CHROME = process.env.SWEEP_CHROME || (fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined);
const MODULES = (process.argv[2] || '3,4,5,6,7,8,9,10,11,12').split(',').map(Number);
const HANG_MS = 8000;

const withTimeout = (promise, ms) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('HANG')), ms))]);

// A fresh page with a stand-in student. Module views are called directly, so
// no sign-in or real progress is needed and nothing reaches Supabase.
async function freshPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(`EXC ${error.message}`));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`ERR ${message.text().slice(0, 200)}`); });
  await page.goto(`${BASE}/?console-tab-sweep=1#/login`);
  await page.waitForFunction(() => typeof moduleLabFor === 'function' && typeof PROGRAMS !== 'undefined');
  await page.evaluate(() => {
    window.__sweepUser = { userId: 'console-tab-sweep', id: 'console-tab-sweep', email: 'sweep@example.test', name: 'Sweep' };
    window.__sweepProgram = PROGRAMS.find((program) => program.slug === 'soc-analyst');
    if (typeof moduleTwelveUnlocked === 'function') moduleTwelveUnlocked = () => true;
  });
  return { page, errors };
}

// Render and wire the module exactly as the router's first render does.
function openModule(page, number) {
  return page.evaluate((number) => {
    const lab = moduleLabFor('soc-analyst', number);
    document.getElementById('app').innerHTML = lab.view(__sweepUser, __sweepProgram);
    if (lab.wire) lab.wire(__sweepUser, __sweepProgram);
    return [...document.querySelectorAll('[id^="m03e-console-"]')]
      .flatMap((host) => [...host.querySelectorAll('nav[role=tablist] button')].map((button) => [host.id, button.textContent.trim()]));
  }, number);
}

function clickTab(page, id, label) {
  return page.evaluate(([id, label]) => {
    const tabs = () => [...(document.getElementById(id)?.querySelectorAll('nav[role=tablist] button') || [])];
    const button = tabs().find((tab) => tab.textContent.trim() === label);
    if (!button) return { missing: true };
    button.click();
    const host = document.getElementById(id);
    const active = tabs().find((tab) => tab.getAttribute('aria-selected') === 'true')?.textContent.trim();
    return { gone: !host, active, viewLength: (host?.querySelector('.m03e-view')?.textContent.trim() || '').length };
  }, [id, label]);
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  let failed = 0, total = 0;
  for (const number of MODULES) {
    let { page, errors } = await freshPage(browser);
    const plan = await openModule(page, number);
    const failures = [];
    for (const [id, label] of plan) {
      total += 1;
      const before = errors.length;
      try {
        const result = await withTimeout(clickTab(page, id, label), HANG_MS);
        if (result.missing) failures.push(`${id} › ${label}: tab disappeared`);
        else if (result.gone) failures.push(`${id} › ${label}: console disappeared`);
        else if (result.active !== label) failures.push(`${id} › ${label}: did not switch (active: ${result.active})`);
        else if (result.viewLength < 20) failures.push(`${id} › ${label}: empty view`);
      } catch (_) {
        failures.push(`${id} › ${label}: page froze for more than ${HANG_MS / 1000}s`);
        await page.close().catch(() => {});
        ({ page, errors } = await freshPage(browser));
        await openModule(page, number);
        continue;
      }
      if (errors.length > before) failures.push(`${id} › ${label}: ${errors.slice(before).join(' | ').slice(0, 240)}`);
    }
    failed += failures.length;
    console.log(`Module ${String(number).padStart(2, '0')}: ${plan.length} tabs ${failures.length ? `— ${failures.length} FAILED` : 'OK'}`);
    failures.forEach((failure) => console.log(`  ✗ ${failure}`));
    await page.close().catch(() => {});
  }
  await browser.close();
  console.log(failed ? `${failed} of ${total} console tabs failed.` : `All ${total} console tabs switch and render cleanly.`);
  process.exit(failed ? 1 : 0);
})().catch((error) => { console.error(error); process.exit(1); });
