/* Independent Module 08 assessment identity and expected-priority contract. */
const SocM08AssessmentData = (() => {
  'use strict';

  function freeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(freeze);
    return value;
  }

  const scenario = {
    id: 'M08-ASSESS-2026-09-27',
    stateKey: 'm08-vulnerability-priority-assessment-v1', // gitleaks:allow
    fixedAt: '2026-09-27T11:00:00Z',
    start: '2026-09-27T10:30:00Z',
    end: '2026-09-27T11:00:00Z',
    assetInventory: [
      {
        id: 'M08-ASSET-001', assetId: 'WEB-DMZ-14', hostname: 'web-dmz-14', function: 'Public web service', ownerId: 'p.diallo', environment: 'production',
        criticality: { tier: 'critical', rationale: 'Customer-facing authentication and payment entry point.', evidenceIds: ['M08-ASSET-EVID-001'] },
        reachability: { zone: 'internet-facing-dmz', reachableFrom: ['internet'], evidenceIds: ['M08-ASSET-EVID-002'] },
        exposure: { status: 'publicly-accessible', services: ['tcp/443'], evidenceIds: ['M08-ASSET-EVID-003'] },
        compensatingControls: [{ control: 'managed-waf', status: 'partial', evidenceIds: ['M08-ASSET-EVID-004'] }],
      },
      {
        id: 'M08-ASSET-002', assetId: 'APP-DMZ-22', hostname: 'app-dmz-22', function: 'Application service', ownerId: 'j.moreau', environment: 'production',
        criticality: { tier: 'high', rationale: 'Internal application backend with limited business impact.', evidenceIds: ['M08-ASSET-EVID-005'] },
        reachability: { zone: 'restricted-application-network', reachableFrom: ['WEB-DMZ-14'], evidenceIds: ['M08-ASSET-EVID-006'] },
        exposure: { status: 'restricted-internal', services: ['tcp/8443'], evidenceIds: ['M08-ASSET-EVID-007'] },
        compensatingControls: [{ control: 'network-segmentation', status: 'verified', evidenceIds: ['M08-ASSET-EVID-008'] }],
      },
    ],
    findings: [
      {
        id: 'M08-FINDING-001',
        assetId: 'WEB-DMZ-14',
        product: 'Apache HTTP Server',
        cve: 'CVE-2021-41773',
        cvss: { version: '3.1', baseScore: 7.5, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N', source: 'NVD' },
        scanner: 'OpenVAS',
        observedAt: '2026-09-27T10:42:00Z',
        freshness: { status: 'current', scanAt: '2026-09-27T10:42:00Z', evidenceIds: ['M08-EVID-001'] },
        applicability: { status: 'confirmed', evidenceIds: ['M08-EVID-002'] },
        exploitability: { status: 'credible-public-exploit', evidenceIds: ['M08-EVID-003'] },
      },
      {
        id: 'M08-FINDING-002',
        assetId: 'APP-DMZ-22',
        product: 'OpenSSL',
        cve: 'CVE-2022-3786',
        cvss: { version: '3.1', baseScore: 7.5, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H', source: 'NVD' },
        scanner: 'OpenVAS',
        observedAt: '2026-09-27T10:44:00Z',
        freshness: { status: 'stale', scanAt: '2026-06-02T08:00:00Z', evidenceIds: ['M08-EVID-004'] },
        applicability: { status: 'unverified', evidenceIds: ['M08-EVID-005'] },
        exploitability: { status: 'public-exploit-reported', evidenceIds: ['M08-EVID-006'] },
      },
      {
        id: 'M08-FINDING-003',
        assetId: 'WEB-DMZ-14',
        product: 'Microsoft SMBv1',
        cve: 'CVE-2017-0144',
        cvss: { version: '3.1', baseScore: 8.8, vector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H', source: 'NVD' },
        scanner: 'OpenVAS',
        observedAt: '2026-09-27T10:46:00Z',
        freshness: { status: 'current', scanAt: '2026-09-27T10:46:00Z', evidenceIds: ['M08-EVID-007'] },
        applicability: { status: 'not-applicable', evidenceIds: ['M08-EVID-008'] },
        exploitability: { status: 'known-exploit', evidenceIds: ['M08-EVID-009'] },
      },
    ],
    findingEvidence: [
      { id: 'M08-EVID-001', findingId: 'M08-FINDING-001', kind: 'scanner-observation', observedAt: '2026-09-27T10:42:00Z', source: 'Synthetic OpenVAS export', detail: 'Authenticated version detection reports Apache HTTP Server 2.4.49 on WEB-DMZ-14.' },
      { id: 'M08-EVID-002', findingId: 'M08-FINDING-001', kind: 'version-applicability', observedAt: '2026-09-27T10:47:00Z', source: 'Synthetic signed package inventory', detail: 'Local package inventory independently confirms Apache HTTP Server 2.4.49; the affected version range applies.' },
      { id: 'M08-EVID-003', findingId: 'M08-FINDING-001', kind: 'exploitability-advisory', observedAt: '2026-09-27T10:48:00Z', source: 'Synthetic threat-intelligence bulletin', detail: 'Public exploitation is documented for the affected Apache release. This supports exploitability context, not evidence of compromise.' },
      { id: 'M08-EVID-004', findingId: 'M08-FINDING-002', kind: 'scanner-observation', observedAt: '2026-06-02T08:00:00Z', source: 'Synthetic OpenVAS export', detail: 'Old scan reports an OpenSSL version potentially in the affected range; the observation is outside the current review window.' },
      { id: 'M08-EVID-005', findingId: 'M08-FINDING-002', kind: 'applicability-check', observedAt: '2026-09-27T10:49:00Z', source: 'Synthetic service-owner note', detail: 'Current package and runtime version have not yet been collected; applicability remains unverified.' },
      { id: 'M08-EVID-006', findingId: 'M08-FINDING-002', kind: 'exploitability-advisory', observedAt: '2026-09-27T10:49:00Z', source: 'Synthetic threat-intelligence bulletin', detail: 'A public exploit report exists for this CVE; it does not establish that APP-DMZ-22 is affected.' },
      { id: 'M08-EVID-007', findingId: 'M08-FINDING-003', kind: 'scanner-observation', observedAt: '2026-09-27T10:46:00Z', source: 'Synthetic OpenVAS export', detail: 'A broad network signature matched an SMB-related response on WEB-DMZ-14.' },
      { id: 'M08-EVID-008', findingId: 'M08-FINDING-003', kind: 'applicability-check', observedAt: '2026-09-27T10:50:00Z', source: 'Synthetic signed package and service inventory', detail: 'The asset runs Linux and has no Microsoft SMBv1 service or affected component; the signature is irrelevant to this host.' },
      { id: 'M08-EVID-009', findingId: 'M08-FINDING-003', kind: 'exploitability-advisory', observedAt: '2026-09-27T10:50:00Z', source: 'Synthetic threat-intelligence bulletin', detail: 'Public exploit code is known for the CVE generally; it cannot apply without the affected product.' },
    ],
    incidents: [
      { id: 'M08-INCIDENT-001', title: 'Web service vulnerability review', findingIds: ['M08-FINDING-001'], evidenceIds: ['M08-INC-EVID-001'] },
    ],
    incidentEvidence: [
      { id: 'M08-INC-EVID-001', incidentId: 'M08-INCIDENT-001', findingId: 'M08-FINDING-001', kind: 'incident-triage', observedAt: '2026-09-27T10:53:00Z', source: 'Synthetic incident record', detail: 'Incident triage is tracking validation and exposure review for the affected public web service.' },
    ],
    riskAcceptanceDispositions: [
      { id: 'M08-RISK-DISP-001', findingId: 'M08-FINDING-002', status: 'explicitly-supported', evidenceIds: ['M08-RISK-EVID-001'] },
    ],
    riskAcceptanceEvidence: [
      { id: 'M08-RISK-EVID-001', dispositionId: 'M08-RISK-DISP-001', findingId: 'M08-FINDING-002', kind: 'approved-temporary-exception', observedAt: '2026-09-27T10:54:00Z', source: 'Synthetic risk review record', detail: 'A documented temporary risk acceptance is approved while current OpenSSL applicability is validated; the exception applies only to this finding and is not evidence that the asset is unaffected.' },
    ],
    escalationRoutes: [
      { id: 'security-lead-review', label: 'Security lead review', evidenceKinds: ['exploitability-advisory', 'reachability', 'exposure'] },
      { id: 'service-owner-remediation', label: 'Service owner remediation', evidenceKinds: ['version-applicability', 'business-criticality', 'compensating-control'] },
    ],
    assetEvidence: [
      { id: 'M08-ASSET-EVID-001', assetId: 'WEB-DMZ-14', kind: 'business-criticality', observedAt: '2026-09-27T10:32:00Z', source: 'Synthetic service catalog', detail: 'WEB-DMZ-14 hosts customer-facing authentication and payment entry; outage has critical business impact.' },
      { id: 'M08-ASSET-EVID-002', assetId: 'WEB-DMZ-14', kind: 'reachability', observedAt: '2026-09-27T10:34:00Z', source: 'Synthetic network path inventory', detail: 'The production DMZ listener is reachable from the public internet.' },
      { id: 'M08-ASSET-EVID-003', assetId: 'WEB-DMZ-14', kind: 'exposure', observedAt: '2026-09-27T10:35:00Z', source: 'Synthetic external attack-surface scan', detail: 'TCP/443 is publicly exposed; no other listener was confirmed in this review.' },
      { id: 'M08-ASSET-EVID-004', assetId: 'WEB-DMZ-14', kind: 'compensating-control', observedAt: '2026-09-27T10:36:00Z', source: 'Synthetic WAF policy review', detail: 'A managed WAF blocks some known probes, but does not remove origin reachability or establish protection against this finding.' },
      { id: 'M08-ASSET-EVID-005', assetId: 'APP-DMZ-22', kind: 'business-criticality', observedAt: '2026-09-27T10:37:00Z', source: 'Synthetic service catalog', detail: 'APP-DMZ-22 is a high-importance internal backend; it is not the customer-facing authentication or payment entry point.' },
      { id: 'M08-ASSET-EVID-006', assetId: 'APP-DMZ-22', kind: 'reachability', observedAt: '2026-09-27T10:38:00Z', source: 'Synthetic network path inventory', detail: 'Inbound paths are limited to WEB-DMZ-14 within the segmented application network.' },
      { id: 'M08-ASSET-EVID-007', assetId: 'APP-DMZ-22', kind: 'exposure', observedAt: '2026-09-27T10:39:00Z', source: 'Synthetic internal attack-surface scan', detail: 'TCP/8443 is available only on the restricted application network and is not internet-facing.' },
      { id: 'M08-ASSET-EVID-008', assetId: 'APP-DMZ-22', kind: 'compensating-control', observedAt: '2026-09-27T10:40:00Z', source: 'Synthetic segmentation control review', detail: 'A verified network policy permits only the designated web tier to reach the application service.' },
    ],
    expectedPriority: {
      assetId: 'WEB-DMZ-14',
      ownerId: 'p.diallo',
      priority: 'critical',
      rationale: 'The existing M08 assessment case identifies WEB-DMZ-14 as the confirmed affected asset and requires urgent remediation routing. Priority must be justified from validated local evidence and asset context, not CVSS alone.',
    },
  };

  return freeze({ schemaVersion: 1, scenario });
})();
