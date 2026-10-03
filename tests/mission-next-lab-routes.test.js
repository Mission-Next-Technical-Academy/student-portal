#!/usr/bin/env node
// Test that all imported-labs/mission-next-labs hrefs found in portal/*.js
// resolve to valid routes via missionNextLabSlugFromHref and missionNextLabAppRoute
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Define the routing functions locally (copied from app.js ~L4169–4184)
const MISSION_NEXT_LAB_TRACKS = {
  sa: 'security-assessments', ma: 'malware-analysis', vm: 'vulnerability-management',
  wf: 'windows-forensics', ad: 'active-directory', lap: 'log-analysis',
};

function missionNextLabSlugFromHref(href) {
  const match = String(href || '').match(/imported-labs\/mission-next-labs\/(?:index\.html)?#\/track\/[a-z-]+\/(?:project\/([a-z0-9-]+)\/lab|module\/([a-z0-9-]+))$/i);
  return match ? (match[1] || match[2]) : null;
}

function missionNextLabAppRoute(labSlug) {
  if (/^[a-z0-9-]+-log-analysis$/.test(labSlug)) return `#/track/splunk/module/${labSlug}`;
  const match = String(labSlug || '').match(/^([a-z]+)-\d+$/);
  const track = match && MISSION_NEXT_LAB_TRACKS[match[1]];
  return track ? `#/track/${track}/project/${labSlug}/lab` : null;
}

// Collect all hrefs from portal/*.js files
const portalDir = path.join(__dirname, '..', 'portal');
const allHrefs = new Set();
const files = fs.readdirSync(portalDir).filter(f => f.endsWith('.js'));
files.forEach(file => {
  const content = fs.readFileSync(path.join(portalDir, file), 'utf8');
  const matches = content.match(/imported-labs\/mission-next-labs\/index\.html#\/track\/[a-z-]+\/(?:project\/[a-z0-9-]+\/lab|module\/[a-z0-9-]+)/g);
  if (matches) {
    matches.forEach(href => allHrefs.add(href));
  }
});

// Valid slugs registered in the imported lab app (from data.js)
const validSlugs = new Set([
  // windows-forensics
  'wf-1', 'wf-2', 'wf-3', 'wf-4', 'wf-5',
  // log-analysis
  'lap-1', 'lap-2', 'lap-3', 'lap-4', 'lap-5',
  // active-directory
  'ad-1', 'ad-3', 'ad-4', 'ad-5', 'ad-6', 'ad-7',
  // security-assessments
  'sa-2', 'sa-3', 'sa-4', 'sa-5', 'sa-6', 'sa-7', 'sa-8', 'sa-9',
  // vulnerability-management
  'vm-1', 'vm-2', 'vm-3', 'vm-4', 'vm-5',
  // malware-analysis
  'ma-1', 'ma-2', 'ma-3', 'ma-4', 'ma-5',
  // Splunk modules
  'gre-tunnel-log-analysis', 'http-log-analysis', 'ftp-log-analysis',
  'dns-log-analysis', 'ssh-log-analysis', 'dhcp-log-analysis',
]);

// Test each href
let passed = 0;
let failed = 0;
const failures = [];

allHrefs.forEach(href => {
  const slug = missionNextLabSlugFromHref(href);
  const route = slug ? missionNextLabAppRoute(slug) : null;
  const valid = slug && validSlugs.has(slug);

  if (!slug) {
    failed++;
    failures.push({ href, reason: 'slug parsing failed' });
  } else if (!route) {
    failed++;
    failures.push({ href, slug, reason: 'no route for slug' });
  } else if (!valid) {
    failed++;
    failures.push({ href, slug, reason: 'slug not in validSlugs' });
  } else {
    passed++;
  }
});

// Report results
console.log(`mission-next-lab-routes: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(f => {
    console.log(`  href: ${f.href}`);
    console.log(`    slug: ${f.slug || 'null'}`);
    console.log(`    reason: ${f.reason}`);
  });
  process.exit(1);
}

assert.strictEqual(passed, allHrefs.size, `Expected all ${allHrefs.size} hrefs to resolve`);
console.log(`✓ All ${allHrefs.size} imported-lab hrefs resolve correctly`);
