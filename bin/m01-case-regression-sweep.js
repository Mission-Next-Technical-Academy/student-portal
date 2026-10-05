#!/usr/bin/env node
// Synthetic regression for Module 1 Assessment Lab → saved case → faculty
// ticket renderer. All writes to Supabase are guarded by the absent trackCode;
// recordLabAttempt is stubbed. This never submits a real learner attempt.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const BASE = process.env.SWEEP_BASE_URL || 'http://127.0.0.1:8768';
const CHROME = process.env.SWEEP_CHROME || '/usr/bin/google-chrome';
const OUT = process.env.M12_SCREENSHOT_DIR || path.resolve('docs/handoffs/assets');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  try {
    await page.goto(`${BASE}/?m01-case-regression-sweep=1#/login`);
    await page.waitForFunction(() => typeof viewModuleOne === 'function' && typeof moduleOneFinalizeProveIt === 'function');
    await page.evaluate(() => {
      const program = PROGRAMS.find((item) => item.slug === 'soc-analyst');
      const user = { id: 'synthetic-m01-case-review', userId: 'synthetic-m01-case-review', email: 'synthetic-m01-case-review@example.test', name: 'Synthetic M01' };
      window.__m01User = user;
      window.__m01Program = program;
      moduleOneLoad(user);
      window.__m01NativeLoad = moduleOneLoad;
      const lab = MODULE_ONE_ESCALATION_LAB;
      const department = lab.departmentOptions.slice().sort((a, b) => b.fit - a.fit)[0];
      const state = moduleOneState.lab2;
      Object.assign(state, {
        reviewedEvidence: lab.scenario.evidence.map((item) => item.id),
        status: 'resolved', affectedUser: 'a.chen', affectedDevice: 'LAP-442',
        priority: lab.correctPriority, severity: lab.correctPriority,
        verdict: lab.correctVerdict, disposition: lab.correctVerdict,
        escalation: 'required', escalateTo: department.id,
        notes: 'The sign-in from 198.51.100.24 and PowerShell execution on LAP-442 correlate with the proxy upload. The user denies approving the prompts. Scope is limited to a.chen and LAP-442 in available telemetry; no lateral movement is established. Escalate containment and identity response to Tier 2.',
        actionHistory: [{ action: 'Reviewed identity, endpoint, proxy, and callback evidence', at: new Date().toISOString() }],
      });
      moduleOneState.sectionOpen.review = true;
      recordLabAttempt = () => Promise.resolve({ id: 'synthetic-m01-attempt' });
      persistPortfolioArtifact = () => Promise.resolve({ id: 'synthetic-m01-artifact' });
      markModuleLabComplete = () => {};
      moduleOneSave();
      // Module 1 has no separate remote case-state loader in this synthetic
      // pass. Restore the real loader after finalization to prove local reload.
      moduleOneLoad = (nextUser) => { moduleOneUser = nextUser; return moduleOneState; };
      window.__renderM01 = () => {
        document.getElementById('app').innerHTML = viewModuleOne(user, program);
        wireCommon();
        const form = document.getElementById('m01-lab2-form');
        for (let node = form; node; node = node.parentElement) {
          if (node.tagName === 'DETAILS') node.open = true;
          node.removeAttribute('hidden');
        }
        window.scrollTo(0, 0);
      };
      window.__renderM01();
    });
    await page.locator('#m01-lab2-form').waitFor({ state: 'attached' });
    const before = await page.evaluate(() => moduleOneProveItPerformance());
    if (before.missing.length || before.score < 70) throw new Error(`Module 1 case is not submit-ready: ${JSON.stringify(before)}`);
    await page.locator('[data-m01-submit-proveit]').click();
    await page.waitForFunction(() => moduleOneState.lab2.submitted === true);
    const restored = await page.evaluate(() => {
      const user = window.__m01User;
      moduleOneLoad = window.__m01NativeLoad;
      moduleOneLoad(user);
      window.__renderM01();
      return {
        submitted: moduleOneState.lab2.submitted,
        score: moduleOneState.lab2.score,
        locked: document.querySelector('#m01-lab2-form textarea[name="notes"]')?.disabled === true,
        reviewStatus: document.querySelector('#m01-review-submission')?.textContent.trim() || '',
        notes: moduleOneState.lab2.notes,
      };
    });
    if (!restored.submitted || !restored.locked || restored.score !== before.score || !restored.notes) throw new Error(`Module 1 local rehydration failed: ${JSON.stringify(restored)}`);
    await page.evaluate((review) => {
      const row = { id: 'synthetic-m01-attempt', student_id: 'Synthetic M01', lab_key: 'lab-soc-escalation', score: review.score,
        completed_at: new Date().toISOString(), result: { case_record: moduleOneState.lab2 } };
      document.getElementById('app').innerHTML = adminCaseTicketSubmissionPanel(row);
    }, restored);
    await page.locator('[aria-label="Student submitted case ticket"]').screenshot({ path: path.join(OUT, 'M01-synthetic-faculty-review.png') });
    if (errors.length) throw new Error(`Module 1 browser errors: ${errors.join(' | ')}`);
    console.log(`Module 1 synthetic regression passed: ${restored.score}/100, submitted and locally restored, locked, Student case ticket rendered for faculty.`);
    console.log(path.join(OUT, 'M01-synthetic-faculty-review.png'));
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exit(1); });
