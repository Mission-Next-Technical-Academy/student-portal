#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const context = {};
vm.createContext(context);
for (const file of [
  'soc-m08-assessment-data.js', 'soc-m07-assessment-data.js', 'soc-m06-assessment-data.js',
  'soc-m05-assessment-data.js', 'soc-m04-assessment-data.js',
]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', file), 'utf8'), context);
}
const data = vm.runInContext('SocM08AssessmentData', context);
const scenario = data.scenario;
const priorScenarios = [
  vm.runInContext('SocM07AssessmentData.scenario', context),
  vm.runInContext('SocM06AssessmentData.scenario', context),
  vm.runInContext('SocM05AssessmentData.scenario', context),
  vm.runInContext('SocM04AssessmentData.scenario', context),
];

function validateScenario(candidate, earlierScenarios = priorScenarios) {
  const start = Date.parse(candidate.start);
  const end = Date.parse(candidate.end);
  const fixedAt = Date.parse(candidate.fixedAt);
  assert.ok(Number.isFinite(start) && Number.isFinite(end) && Number.isFinite(fixedAt));
  assert.ok(start < end && end === fixedAt, 'review window is fixed and ordered');
  assert.ok(earlierScenarios.every((prior) => candidate.id !== prior.id
    && candidate.stateKey !== prior.stateKey), 'scenario and persistence key are isolated'); // gitleaks:allow

  const inWindow = (value, label) => {
    const time = Date.parse(value);
    assert.match(value, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/, `${label} uses canonical UTC`);
    assert.ok(Number.isFinite(time) && time >= start && time <= end,
      `${label} falls within the review window`);
  };
  const uniqueIds = [
    ...candidate.assetInventory.map((asset) => asset.id),
    ...candidate.findings.map((finding) => finding.id),
    ...candidate.findingEvidence.map((evidence) => evidence.id),
    ...candidate.assetEvidence.map((evidence) => evidence.id),
    ...(candidate.incidents || []).map((incident) => incident.id),
    ...(candidate.incidentEvidence || []).map((evidence) => evidence.id),
    ...(candidate.riskAcceptanceDispositions || []).map((item) => item.id),
    ...(candidate.riskAcceptanceEvidence || []).map((evidence) => evidence.id),
  ];
  assert.strictEqual(new Set(uniqueIds).size, uniqueIds.length, 'asset, finding, and evidence IDs are globally unique');
  assert.ok(Array.isArray(candidate.escalationRoutes) && candidate.escalationRoutes.length > 0);
  assert.strictEqual(new Set(candidate.escalationRoutes.map((route) => route.id)).size, candidate.escalationRoutes.length);
  assert.ok(candidate.escalationRoutes.every((route) => route.id && route.label
    && Array.isArray(route.evidenceKinds) && route.evidenceKinds.length));
  const assetsById = new Map(candidate.assetInventory.map((asset) => [asset.assetId, asset]));
  const findingEvidenceById = new Map(candidate.findingEvidence.map((evidence) => [evidence.id, evidence]));
  const assetEvidenceById = new Map(candidate.assetEvidence.map((evidence) => [evidence.id, evidence]));

  for (const asset of candidate.assetInventory) {
    for (const [label, ids] of [
      ['criticality', asset.criticality.evidenceIds],
      ['reachability', asset.reachability.evidenceIds],
      ['exposure', asset.exposure.evidenceIds],
      ['compensating control', asset.compensatingControls.flatMap((control) => control.evidenceIds)],
    ]) {
      assert.ok(ids.length, `${asset.assetId} ${label} cites evidence`);
      for (const id of ids) {
        const evidence = assetEvidenceById.get(id);
        assert.ok(evidence, `${asset.assetId} ${label} evidence resolves`);
        assert.strictEqual(evidence.assetId, asset.assetId, `${id} belongs to its owning asset`);
        inWindow(evidence.observedAt, id);
      }
    }
  }

  const cveIds = new Set();
  for (const finding of candidate.findings) {
    assert.ok(assetsById.has(finding.assetId), `${finding.id} references a fixture asset`);
    assert.match(finding.cve, /^CVE-(?:19|20)\d{2}-\d{4,}$/);
    assert.ok(!cveIds.has(finding.cve), `${finding.cve} is not duplicated`);
    cveIds.add(finding.cve);
    assert.strictEqual(finding.cvss.version, '3.1');
    assert.strictEqual(finding.cvss.source, 'NVD');
    assert.ok(Number.isFinite(finding.cvss.baseScore) && finding.cvss.baseScore >= 0 && finding.cvss.baseScore <= 10);
    assert.match(finding.cvss.vector, /^CVSS:3\.1\/(?:AV:[NALP]\/AC:[LH]\/PR:[NLH]\/UI:[NR]\/S:[UC]\/C:[NLH]\/I:[NLH]\/A:[NLH])$/);
    inWindow(finding.observedAt, `${finding.id} observation`);
    assert.ok(['current', 'stale'].includes(finding.freshness.status));
    assert.ok(['confirmed', 'unverified', 'not-applicable'].includes(finding.applicability.status));
    assert.ok(['credible-public-exploit', 'public-exploit-reported', 'known-exploit'].includes(finding.exploitability.status));
    for (const id of [
      ...finding.freshness.evidenceIds,
      ...finding.applicability.evidenceIds,
      ...finding.exploitability.evidenceIds,
    ]) {
      const evidence = findingEvidenceById.get(id);
      assert.ok(evidence, `${finding.id} evidence ${id} resolves`);
      assert.strictEqual(evidence.findingId, finding.id, `${id} belongs to its owning finding`);
      const time = Date.parse(evidence.observedAt);
      assert.ok(Number.isFinite(time) && time <= fixedAt, `${id} is not future-dated`);
      if (time < start) {
        assert.ok(finding.freshness.status === 'stale' && evidence.kind === 'scanner-observation',
          `${id} is the explicitly stale historical scan`);
      } else {
        inWindow(evidence.observedAt, id);
      }
    }
  }
  for (const evidence of candidate.findingEvidence) {
    assert.ok(candidate.findings.some((finding) => finding.id === evidence.findingId), `${evidence.id} finding owner resolves`);
  }
  for (const evidence of candidate.assetEvidence) {
    assert.ok(assetsById.has(evidence.assetId), `${evidence.id} asset owner resolves`);
  }
  for (const incident of candidate.incidents || []) {
    assert.ok(incident.findingIds.length && incident.findingIds.every((id) => candidate.findings.some((finding) => finding.id === id)));
  }
  for (const evidence of candidate.incidentEvidence || []) {
    const incident = candidate.incidents.find((item) => item.id === evidence.incidentId);
    assert.ok(incident?.findingIds.includes(evidence.findingId));
    inWindow(evidence.observedAt, evidence.id);
  }
  for (const disposition of candidate.riskAcceptanceDispositions || []) {
    assert.strictEqual(disposition.status, 'explicitly-supported');
    assert.ok(candidate.findings.some((finding) => finding.id === disposition.findingId));
    assert.ok(disposition.evidenceIds.length);
    for (const id of disposition.evidenceIds) assert.ok(candidate.riskAcceptanceEvidence.some((item) => item.id === id && item.dispositionId === disposition.id));
  }
  for (const evidence of candidate.riskAcceptanceEvidence || []) inWindow(evidence.observedAt, evidence.id);
}

assert.strictEqual(data.schemaVersion, 1);
assert.strictEqual(scenario.id, 'M08-ASSESS-2026-09-27');
assert.strictEqual(scenario.stateKey, 'm08-vulnerability-priority-assessment-v1'); // gitleaks:allow
assert.strictEqual(scenario.fixedAt, '2026-09-27T11:00:00Z');
assert.strictEqual(scenario.end, scenario.fixedAt);
assert.ok(Date.parse(scenario.start) < Date.parse(scenario.end));
assert.ok(priorScenarios.every((prior) => scenario.id !== prior.id && scenario.stateKey !== prior.stateKey)); // gitleaks:allow
assert.deepStrictEqual(JSON.parse(JSON.stringify(scenario.assetInventory.slice(0, 2))), [
  {
    id: 'M08-ASSET-001', assetId: 'web-dmz-14', hostname: 'web-dmz-14', function: 'Public web service', ownerId: 'p.diallo', environment: 'production',
    criticality: { tier: 'critical', rationale: 'Customer-facing authentication and payment entry point.', evidenceIds: ['M08-ASSET-EVID-001'] },
    reachability: { zone: 'internet-facing-dmz', reachableFrom: ['internet'], evidenceIds: ['M08-ASSET-EVID-002'] },
    exposure: { status: 'publicly-accessible', services: ['tcp/443'], evidenceIds: ['M08-ASSET-EVID-003'] },
    compensatingControls: [{ control: 'managed-waf', status: 'partial', evidenceIds: ['M08-ASSET-EVID-004'] }],
  },
  {
    id: 'M08-ASSET-002', assetId: 'app-dmz-22', hostname: 'app-dmz-22', function: 'Application service', ownerId: 'j.moreau', environment: 'production',
    criticality: { tier: 'high', rationale: 'Internal application backend with limited business impact.', evidenceIds: ['M08-ASSET-EVID-005'] },
    reachability: { zone: 'restricted-application-network', reachableFrom: ['web-dmz-14'], evidenceIds: ['M08-ASSET-EVID-006'] },
    exposure: { status: 'restricted-internal', services: ['tcp/8443'], evidenceIds: ['M08-ASSET-EVID-007'] },
    compensatingControls: [{ control: 'network-segmentation', status: 'verified', evidenceIds: ['M08-ASSET-EVID-008'] }],
  },
]);
assert.deepStrictEqual(JSON.parse(JSON.stringify(scenario.expectedPriority)), {
  assetId: 'web-dmz-14',
  ownerId: 'p.diallo',
  priority: 'critical',
  rationale: 'The existing M08 assessment case identifies web-dmz-14 as the confirmed affected asset and requires urgent remediation routing. Priority must be justified from validated local evidence and asset context, not CVSS alone.',
});
const findingIds = scenario.findings.map((finding) => finding.id);
const evidenceIds = scenario.findingEvidence.map((evidence) => evidence.id);
assert.strictEqual(new Set(findingIds).size, findingIds.length, 'finding IDs are unique and stable');
assert.strictEqual(new Set(evidenceIds).size, evidenceIds.length, 'evidence IDs are unique and stable');
const assets = new Set(scenario.assetInventory.map((asset) => asset.assetId));
const assetEvidenceIds = scenario.assetEvidence.map((evidence) => evidence.id);
assert.strictEqual(new Set(assetEvidenceIds).size, assetEvidenceIds.length, 'asset evidence IDs are unique and stable');
assert.ok(assetEvidenceIds.every((id) => !evidenceIds.includes(id)), 'asset and finding evidence namespaces do not collide');
const assetEvidenceById = new Map(scenario.assetEvidence.map((evidence) => [evidence.id, evidence]));
for (const asset of scenario.assetInventory) {
  for (const [context, ids] of [
    ['criticality', asset.criticality.evidenceIds],
    ['reachability', asset.reachability.evidenceIds],
    ['exposure', asset.exposure.evidenceIds],
    ['compensating control', asset.compensatingControls.flatMap((control) => control.evidenceIds)],
  ]) {
    assert.ok(ids.length > 0, `${asset.assetId} ${context} links to evidence`);
    for (const id of ids) {
      const evidence = assetEvidenceById.get(id);
      assert.ok(evidence, `${asset.assetId} ${context} evidence resolves: ${id}`);
      assert.strictEqual(evidence.assetId, asset.assetId, `${id} belongs to the referenced asset`);
      assert.ok(Date.parse(scenario.start) <= Date.parse(evidence.observedAt)
        && Date.parse(evidence.observedAt) <= Date.parse(scenario.fixedAt), `${id} timestamp is within fixture bounds`);
    }
  }
}
assert.notStrictEqual(scenario.assetInventory[0].criticality.tier, scenario.assetInventory[1].criticality.tier);
assert.notStrictEqual(scenario.assetInventory[0].exposure.status, scenario.assetInventory[1].exposure.status);
assert.notStrictEqual(scenario.assetInventory[0].compensatingControls[0].status, scenario.assetInventory[1].compensatingControls[0].status);
assert.strictEqual(scenario.findings[0].cvss.baseScore, scenario.findings[1].cvss.baseScore,
  'equal base scores coexist with materially different asset and finding validation context');
const evidenceById = new Map(scenario.findingEvidence.map((evidence) => [evidence.id, evidence]));
for (const finding of scenario.findings) {
  assert.ok(assets.has(finding.assetId), `${finding.id} references a fixture asset`);
  assert.match(finding.cve, /^CVE-\d{4}-\d{4,}$/);
  assert.strictEqual(finding.cvss.version, '3.1');
  assert.ok(Number.isFinite(finding.cvss.baseScore) && finding.cvss.baseScore >= 0 && finding.cvss.baseScore <= 10);
  assert.match(finding.cvss.vector, /^CVSS:3\.1\//);
  assert.ok(Date.parse(scenario.start) <= Date.parse(finding.observedAt)
    && Date.parse(finding.observedAt) <= Date.parse(scenario.end), 'finding observation is within the fixed review window');
  assert.ok(['current', 'stale'].includes(finding.freshness.status));
  assert.ok(['confirmed', 'unverified', 'not-applicable'].includes(finding.applicability.status));
  assert.ok(['credible-public-exploit', 'public-exploit-reported', 'known-exploit'].includes(finding.exploitability.status));
  for (const evidenceId of [
    ...finding.freshness.evidenceIds,
    ...finding.applicability.evidenceIds,
    ...finding.exploitability.evidenceIds,
  ]) {
    const evidence = evidenceById.get(evidenceId);
    assert.ok(evidence, `${finding.id} evidence link resolves: ${evidenceId}`);
    assert.strictEqual(evidence.findingId, finding.id, `${evidenceId} belongs to its finding`);
    assert.ok(Date.parse(evidence.observedAt) <= Date.parse(scenario.fixedAt), 'evidence is not from the future');
  }
}
assert.strictEqual(scenario.findings.find((finding) => finding.id === 'M08-FINDING-001').applicability.status, 'confirmed');
assert.strictEqual(scenario.findings.find((finding) => finding.id === 'M08-FINDING-002').freshness.status, 'stale');
assert.strictEqual(scenario.findings.find((finding) => finding.id === 'M08-FINDING-003').applicability.status, 'not-applicable');
assert.ok(Object.isFrozen(data) && Object.isFrozen(scenario)
  && Object.isFrozen(scenario.assetInventory) && Object.isFrozen(scenario.assetInventory[0])
  && Object.isFrozen(scenario.findings) && Object.isFrozen(scenario.findings[0])
  && Object.isFrozen(scenario.findings[0].cvss) && Object.isFrozen(scenario.findingEvidence)
  && Object.isFrozen(scenario.findingEvidence[0]) && Object.isFrozen(scenario.assetEvidence)
  && Object.isFrozen(scenario.assetEvidence[0]) && Object.isFrozen(scenario.assetInventory[0].criticality)
  && Object.isFrozen(scenario.expectedPriority), 'contract is deeply immutable');
function assertDeepFrozen(value, label = 'fixture') {
  if (!value || typeof value !== 'object') return;
  assert.ok(Object.isFrozen(value), `${label} is frozen`);
  for (const [key, child] of Object.entries(value)) assertDeepFrozen(child, `${label}.${key}`);
}
assertDeepFrozen(data);
scenario.assetInventory[0].assetId = 'changed';
assert.strictEqual(scenario.assetInventory[0].assetId, 'web-dmz-14', 'frozen inventory cannot be mutated');
assert.deepStrictEqual(Object.keys(scenario).sort(),
  ['alertCandidates', 'assetEvidence', 'assetInventory', 'end', 'escalationRoutes', 'expectedPriority', 'findingEvidence', 'findings', 'fixedAt', 'id', 'incidentEvidence', 'incidents', 'patchRecords', 'riskAcceptanceDispositions', 'riskAcceptanceEvidence', 'scanRuns', 'start', 'stateKey'].sort(), // gitleaks:allow
  'M08 fixture additions remain explicitly scoped and fixture-backed');

const html = fs.readFileSync(path.join(__dirname, '..', 'portal', 'index.html'), 'utf8');
assert.match(html, /<script src="soc-m08-assessment-data\.js\?v=[^"]+"><\/script>/,
  'assessment fixture is registered in the portal');

validateScenario(scenario);
const corruptedCopies = [
  ['duplicate finding ID', (copy) => { copy.findings[1].id = copy.findings[0].id; }],
  ['duplicate asset ID', (copy) => { copy.assetInventory[1].id = copy.assetInventory[0].id; }],
  ['orphaned finding evidence', (copy) => { copy.findings[0].freshness.evidenceIds[0] = 'M08-EVID-MISSING'; }],
  ['evidence assigned to the wrong finding', (copy) => { copy.findingEvidence[0].findingId = copy.findings[1].id; }],
  ['orphaned asset evidence', (copy) => { copy.assetInventory[0].criticality.evidenceIds[0] = 'M08-ASSET-EVID-MISSING'; }],
  ['evidence assigned to the wrong asset', (copy) => { copy.assetEvidence[0].assetId = copy.assetInventory[1].assetId; }],
  ['invalid CVE syntax', (copy) => { copy.findings[0].cve = 'CVE-21-1'; }],
  ['invalid CVSS score', (copy) => { copy.findings[0].cvss.baseScore = 10.1; }],
  ['invalid CVSS vector schema', (copy) => { copy.findings[0].cvss.vector = 'CVSS:4.0/AV:N'; }],
  ['finding outside window', (copy) => { copy.findings[0].observedAt = '2026-09-27T11:01:00Z'; }],
  ['future evidence', (copy) => { copy.findingEvidence[0].observedAt = '2026-09-27T11:01:00Z'; }],
  ['non-stale evidence outside window', (copy) => { copy.findingEvidence[0].observedAt = '2026-06-02T08:00:00Z'; }],
  ['asset evidence outside window', (copy) => { copy.assetEvidence[0].observedAt = '2026-09-27T09:00:00Z'; }],
  ['cross-module scenario identity', (copy) => { copy.id = priorScenarios[0].id; }],
  ['cross-module persistence key', (copy) => { copy.stateKey = priorScenarios[0].stateKey; }], // gitleaks:allow
];
for (const [label, corrupt] of corruptedCopies) {
  const copy = JSON.parse(JSON.stringify(scenario));
  corrupt(copy);
  assert.throws(() => validateScenario(copy), undefined, `${label} is rejected`);
}
console.log('M08 assessment data contract tests passed.');
