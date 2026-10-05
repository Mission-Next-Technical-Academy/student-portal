import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseUrl = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:5173';
const chromeBin = process.env.CHROME_BIN || '/usr/bin/google-chrome';
const screenshotDir = process.env.SMOKE_SCREENSHOT_DIR || path.join(os.tmpdir(), 'mission-next-route-smoke-screenshots');
const chromeExecOptions = { encoding:'utf8', stdio:['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024 };

const routes = [
  {
    name:'sa-2 file system lab (Module 02 guided/assessment; unchanged)',
    hash:'#/track/security-assessments/project/sa-2/lab',
    expect:['File System Security Assessment', 'EXERCISES'],
  },
  {
    name:'sa-3 web finding lab',
    hash:'#/track/security-assessments/project/sa-3/lab',
    expect:['Web Application Security Assessment', 'Traffic Inspector', 'Authorized AppSec Evidence'],
  },
  {
    name:'sa-4 linux log triage lab',
    hash:'#/track/security-assessments/project/sa-4/lab',
    expect:['Linux Log Triage: The Audit Gap', 'EXERCISES'],
  },
  {
    name:'sa-5 identity review lab',
    hash:'#/track/security-assessments/project/sa-5/lab',
    expect:['User Account Security Assessment', 'EXERCISES'],
  },
  {
    name:'sa-6 windows jump host lab',
    hash:'#/track/security-assessments/project/sa-6/lab',
    expect:['Windows Jump Host Triage', 'PowerShell'],
  },
  {
    name:'sa-7 containment and rebuild lab',
    hash:'#/track/security-assessments/project/sa-7/lab',
    expect:['Contain, Collect, Rebuild', 'Rebuild-JumpHost.ps1'],
  },
  {
    name:'sa-8 cloud incident lab',
    hash:'#/track/security-assessments/project/sa-8/lab',
    expect:['Cloud Identity &amp; Workload Incident', 'Cloud Shell', 'SIMULATION ONLY'],
  },
  {
    name:'sa-9 file server integrity lab',
    hash:'#/track/security-assessments/project/sa-9/lab',
    expect:['File Server Integrity Triage', 'EXERCISES'],
  },
  {
    name:'log analysis catalog blocked',
    hash:'#/track/log-analysis',
    expect:['Open this lab from the course module'],
  },
  {
    name:'lap-2 lab refresh',
    hash:'#/track/log-analysis/project/lap-2/lab',
    expect:['Introduction to Syslog Analysis on Linux Systems', 'QUERY EDITOR', 'SUBMIT ANSWER'],
  },
  {
    name:'splunk search reporting',
    hash:'#/track/splunk/module/dns-log-analysis',
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
    expect:['Static Analysis of a Simple Malware Sample', 'EXERCISES', 'strings_output.txt', 'steps'],
  },
  {
    name:'azure defender resource blades',
    hash:'#/track/vulnerability-management/project/vm-1/lab',
    expect:['Microsoft Defender for Cloud', 'Security recommendations', 'Secure score', 'Access control (IAM)'],
  },
  {
    name:'training paths refresh',
    hash:'#/tracks',
    expect:['Open this lab from the course module', 'Choose a lab environment'],
  },
  {
    name:'malware catalogue blocked',
    hash:'#/track/malware-analysis',
    expect:['Open this lab from the course module', 'This catalogue is not a student destination'],
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
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mission-next-route-smoke-'));

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
if (!localStorage.getItem('mission_next_progress')) localStorage.setItem('mission_next_progress', '{}');
location.replace(${JSON.stringify(`/${hash}`)});
</script>`;
}
