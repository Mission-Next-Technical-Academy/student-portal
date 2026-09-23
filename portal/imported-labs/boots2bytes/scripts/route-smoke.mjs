import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseUrl = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:5173';
const chromeBin = process.env.CHROME_BIN || '/usr/bin/google-chrome';
const screenshotDir = process.env.SMOKE_SCREENSHOT_DIR || path.join(os.tmpdir(), 'b2b-route-smoke-screenshots');
const session = { id:1, username:'student_01', password:'k7m2x9', role:'student', displayName:'Student 01' };
const chromeExecOptions = { encoding:'utf8', stdio:['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024 };

const routes = [
  {
    name:'log analysis catalog',
    hash:'#/track/log-analysis',
    expect:['Log Analysis Projects', 'Introduction to Syslog Analysis on Linux Systems', 'START LOCAL LAB'],
  },
  {
    name:'lap-2 lab refresh',
    hash:'#/track/log-analysis/project/lap-2/lab',
    expect:['Introduction to Syslog Analysis on Linux Systems', 'QUERY EDITOR', 'SUBMIT ANSWER'],
  },
  {
    name:'splunk search reporting',
    hash:'#/track/splunk/module/mod-1',
    expect:['Search & Reporting', 'Selected Fields', 'Last 24 hours'],
  },
  {
    name:'active directory aduc',
    hash:'#/track/active-directory/project/ad-1/lab',
    expect:['Active Directory Users and Computers', 'Organizational Unit', 'New User', 'Domain Controller'],
  },
  {
    name:'malware static analysis',
    hash:'#/track/malware-analysis/project/ma-1/lab',
    expect:['Static Analysis of a Simple Malware Sample', 'SOURCE: GITHUB', 'strings_output.txt', 'steps'],
  },
  {
    name:'servicenow incident workspace',
    hash:'#/track/security-assessments/project/sa-1/lab',
    expect:['Filter navigator', 'Incident INC00', 'Basic Network Security Assessment', 'Assignment group'],
  },
  {
    name:'azure defender resource blades',
    hash:'#/track/vulnerability-management/project/vm-1/lab',
    expect:['Microsoft Defender for Cloud', 'Security recommendations', 'Secure score', 'Access control (IAM)'],
  },
  {
    name:'training paths refresh',
    hash:'#/tracks',
    expect:['Choose a lab environment', 'Windows Forensics', 'Log Analysis Projects'],
  },
];

await assertServer();
fs.mkdirSync(screenshotDir, { recursive:true });

for (const route of routes) {
  smokeRoute(route);
}

console.log(`Route smoke passed for ${routes.length} refreshed routes. Screenshots: ${screenshotDir}`);

async function assertServer() {
  await new Promise((resolve, reject) => {
    const request = http.get(baseUrl, response => {
      response.resume();
      response.statusCode && response.statusCode < 500
        ? resolve()
        : reject(new Error(`Dev server returned HTTP ${response.statusCode}`));
    });
    request.on('error', () => reject(new Error(`Dev server is not reachable at ${baseUrl}. Start it with: npm run dev`)));
    request.setTimeout(2500, () => {
      request.destroy(new Error(`Timed out reaching ${baseUrl}. Start it with: npm run dev`));
    });
  });
}

function smokeRoute(route) {
  const safeName = route.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const seedFile = path.join(root, `.route-smoke-${safeName}.html`);
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2b-route-smoke-'));

  try {
    fs.writeFileSync(seedFile, seedPage(route.hash));
    const dom = execFileSync(chromeBin, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      `--user-data-dir=${profileDir}`,
      '--virtual-time-budget=7000',
      '--dump-dom',
      `${baseUrl}/${path.basename(seedFile)}`,
    ], chromeExecOptions);

    for (const text of route.expect) {
      if (!dom.includes(text)) {
        throw new Error(`Route "${route.name}" did not render expected text: ${text}`);
      }
    }
    const screenshotPath = path.join(screenshotDir, `${safeName}.png`);
    execFileSync(chromeBin, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      `--user-data-dir=${profileDir}`,
      '--window-size=1440,1000',
      `--screenshot=${screenshotPath}`,
      `${baseUrl}/${hashToPath(route.hash)}`,
    ], chromeExecOptions);

    const screenshotSize = fs.statSync(screenshotPath).size;
    if (screenshotSize < 5000) {
      throw new Error(`Route "${route.name}" screenshot looked empty (${screenshotSize} bytes)`);
    }
  } finally {
    fs.rmSync(seedFile, { force:true });
    fs.rmSync(profileDir, { recursive:true, force:true });
  }
}

function hashToPath(hash) {
  return hash.startsWith('#') ? `/${hash}` : hash;
}

function seedPage(hash) {
  return `<!doctype html>
<meta charset="utf-8">
<title>Route Smoke</title>
<script>
localStorage.setItem('b2b_session', ${JSON.stringify(JSON.stringify(session))});
if (!localStorage.getItem('b2b_progress')) localStorage.setItem('b2b_progress', '{}');
location.replace(${JSON.stringify(`/${hash}`)});
</script>`;
}
