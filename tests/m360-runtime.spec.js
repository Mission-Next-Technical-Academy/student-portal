const { test, expect } = require('@playwright/test');

// The local portal server serves `portal/` as its document root on 8768.
// Keep this overrideable for CI, but make the default match the real gate target.
const BASE = process.env.M360_TEST_BASE_URL || 'http://localhost:8768';

function m360DataStub() {
  return `
(() => {
  const USER='00000000-0000-4000-8000-000000000001';
  const COHORT='00000000-0000-4000-8000-000000000002';
  const key='__m360_browser_test_rows';
  const read=()=>{try{return JSON.parse(localStorage.getItem(key)||'[]')}catch(_){return[]}};
  const write=rows=>localStorage.setItem(key,JSON.stringify(rows));
  const rowFor=(week)=>read().find(r=>Number(r.week_number)===Number(week));
  const put=(week,patch)=>{
    const rows=read(); const idx=rows.findIndex(r=>Number(r.week_number)===Number(week));
    const current=idx>=0?rows[idx]:{user_id:USER,track_code:'HDESK',week_number:Number(week),review_status:'draft',revision_number:0,draft_payload:{}};
    const next={...current,...patch}; if(idx>=0)rows[idx]=next;else rows.push(next); write(rows); return next;
  };
  window.M360Data=Object.freeze({
    getContext:async()=>({authenticated:true,eligible:true,isAdmin:false,userId:USER,cohortId:COHORT,trackCode:'HDESK',isEnrolled:true}),
    schemaAvailable:async()=>true,
    loadOwnWeekRecords:async()=>read(),
    loadOwnCourseRecord:async()=>null,
    loadOwnCourseProgress:async()=>({user_id:USER,accepted_artifact_count:0,graded_week_count:0,course_complete:false}),
    saveDraft:async(week,payload)=>put(week,{draft_payload:payload,review_status:'draft'}),
    submitWeek:async(week,payload)=>{
      if(window.m360TestBeforeSubmit)await window.m360TestBeforeSubmit();
      return put(week,{draft_payload:payload,submitted_payload:payload,review_status:'submitted',revision_number:(rowFor(week)?.revision_number||0)+1,submitted_at:new Date().toISOString()});
    },
    loadLiveSessions:async()=>[]
  });
})();`;
}

test.beforeEach(async ({ page }) => {
  await page.route('**/m360-data.js*', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: m360DataStub() }));
});

for (let week = 1; week <= 6; week += 1) {
  test(`Week ${week} loads, scrolls, and exposes production navigation`, async ({ page }) => {
    await page.goto(`${BASE}/m360/week.html?week=${week}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#page-title')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#m360WeekNavigation')).toBeVisible({ timeout: 15000 });
    await page.evaluate(() => window.scrollTo(0, document.scrollingElement.scrollHeight));
    await page.waitForTimeout(250);
    const text = (await page.locator('body').innerText()).toLowerCase();
    expect(text).not.toContain('local mock adapter');
    expect(text).not.toContain('standalone prototype');
    expect(text).not.toContain('vertical-slice boundary');
    expect(await page.evaluate(() => document.scrollingElement.scrollTop > 0)).toBeTruthy();
  });
}

test('Week 2 saves a draft and restores it after reload', async ({ page }) => {
  await page.goto(`${BASE}/m360/week.html?week=2`, { waitUntil: 'domcontentloaded' });
  const target = page.locator('#targetDirection');
  await expect(target).toBeVisible({ timeout: 15000 });
  await target.fill('IT support and desktop support roles');
  await page.locator('#saveBtn').click();
  await page.waitForTimeout(500);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#targetDirection')).toHaveValue('IT support and desktop support roles', { timeout: 15000 });
  await page.evaluate(() => window.scrollTo(0, document.scrollingElement.scrollHeight));
  await expect(page.locator('#m360WeekNavigation')).toBeVisible();
});

test('Week navigation traverses Week 1 through Week 6 without a runtime lock', async ({ page }) => {
  for (let week = 1; week <= 6; week += 1) {
    await page.goto(`${BASE}/m360/week.html?week=${week}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#page-title')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#m360WeekNavigation')).toBeVisible({ timeout: 15000 });
  }
});


test('Week 6 waits for confirmation, keeps the draft on rejection, and submits one revision on retry', async ({ page }) => {
  await page.goto(`${BASE}/m360/week.html?week=6`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#m360WeekNavigation')).toBeVisible();
  const submit = page.locator('#submitReviewBtn');
  const status = page.locator('#reviewStatusLabel');
  const message = page.locator('#validationMessage');
  await submit.click();
  await expect(message).toContainText('Complete before submitting');
  const fieldIds = await page.locator('[data-m360]').evaluateAll(fields => fields.map(field => field.id));
  for (const id of fieldIds) {
    await page.locator(`#${id}`).fill(id === 'slidesUrl' ? 'https://example.test/spotlight.pdf' : `Practice for ${id}`);
  }
  await page.evaluate(() => {
    window.m360TestBeforeSubmit = () => new Promise((_, reject) => {
      window.m360TestRejectSubmit = () => reject(new Error('Simulated connection loss'));
    });
  });
  await submit.click();
  await expect(submit).toBeDisabled();
  await expect(message).toContainText('Sending');
  await expect(status).toHaveText('Draft');
  await page.evaluate(() => window.m360TestRejectSubmit());
  await expect(message).toContainText('could not confirm');
  await expect(status).toHaveText('Draft');
  await expect(page.locator('#week6ArtifactStatus')).not.toContainText('SUBMITTED');
  await expect(page.locator('#sidebarWeek6Status')).not.toContainText('Submitted');
  await expect(page.locator('#slide1Content')).toHaveValue('Practice for slide1Content');
  await expect(submit).toBeEnabled();
  await page.evaluate(() => { delete window.m360TestBeforeSubmit; });
  await submit.click();
  await expect(status).toHaveText('Submitted for review');
  await expect(message).toContainText('Submitted for review');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(status).toHaveText('Submitted for review');
  const row = await page.evaluate(() => JSON.parse(localStorage.getItem('__m360_browser_test_rows')).find(r => r.week_number === 6));
  expect(row.revision_number).toBe(1);
  expect(row.submitted_payload.slide1Content).toBe('Practice for slide1Content');
});
