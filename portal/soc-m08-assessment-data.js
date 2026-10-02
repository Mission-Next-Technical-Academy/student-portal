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
      // --- Added comparison assets (Sprint 4). Not the answer asset; each differs from WEB-DMZ-14 on at least
      // criticality, reachability, exposure or controls so priority cannot be read from CVSS alone. ---
      {
        id: 'M08-ASSET-003', assetId: 'HR-PORTAL-07', hostname: 'hr-portal-07', function: 'Employee self-service portal', ownerId: 'a.okafor', environment: 'production',
        classification: 'unrelated-comparison-asset', purpose: 'scope-check: internal-only service with MFA in front',
        criticality: { tier: 'medium', rationale: 'Internal HR self-service; outage is inconvenient but not revenue-impacting.', evidenceIds: ['M08-ASSET-EVID-009'] },
        reachability: { zone: 'corporate-internal', reachableFrom: ['corp-vpn', 'corp-lan'], evidenceIds: ['M08-ASSET-EVID-010'] },
        exposure: { status: 'internal-only', services: ['tcp/443'], evidenceIds: ['M08-ASSET-EVID-011'] },
        compensatingControls: [{ control: 'mfa-gateway', status: 'verified', evidenceIds: ['M08-ASSET-EVID-012'] }],
      },
      {
        id: 'M08-ASSET-004', assetId: 'LAB-BUILD-03', hostname: 'lab-build-03', function: 'Isolated build runner', ownerId: 'r.tanaka', environment: 'lab',
        classification: 'unrelated-comparison-asset', purpose: 'hypothesis-test: very high CVSS on an isolated, non-production host',
        criticality: { tier: 'low', rationale: 'Disposable lab build runner with no production data or customer function.', evidenceIds: ['M08-ASSET-EVID-013'] },
        reachability: { zone: 'isolated-lab-vlan', reachableFrom: [], evidenceIds: ['M08-ASSET-EVID-014'] },
        exposure: { status: 'not-exposed', services: ['tcp/8080'], evidenceIds: ['M08-ASSET-EVID-015'] },
        compensatingControls: [{ control: 'network-isolation', status: 'verified', evidenceIds: ['M08-ASSET-EVID-016'] }],
      },
      {
        id: 'M08-ASSET-005', assetId: 'DB-REP-11', hostname: 'db-rep-11', function: 'Reporting database replica', ownerId: 'm.haddad', environment: 'production',
        classification: 'unrelated-comparison-asset', purpose: 'scope-check: reachable only through APP-DMZ-22, which is itself reachable only from WEB-DMZ-14',
        criticality: { tier: 'high', rationale: 'Holds reporting copies of customer data; not on the customer request path.', evidenceIds: ['M08-ASSET-EVID-017'] },
        reachability: { zone: 'restricted-data-network', reachableFrom: ['APP-DMZ-22'], evidenceIds: ['M08-ASSET-EVID-018'] },
        exposure: { status: 'restricted-internal', services: ['tcp/5432'], evidenceIds: ['M08-ASSET-EVID-019'] },
        compensatingControls: [{ control: 'host-firewall', status: 'partial', evidenceIds: ['M08-ASSET-EVID-020'] }],
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
      // --- Added findings (Sprint 4): deprioritisation / applicability / reachability comparisons. ---
      {
        id: 'M08-FINDING-004', assetId: 'HR-PORTAL-07', product: 'TLS configuration (legacy 3DES suites)', cve: 'CVE-2016-2183',
        classification: 'unrelated-lower-priority', purpose: 'tuning: moderate CVSS, internal-only asset, long-attack-window exploit',
        cvss: { version: '3.1', baseScore: 7.5, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N', source: 'NVD' },
        scanner: 'OpenVAS', observedAt: '2026-09-27T10:43:00Z',
        freshness: { status: 'current', scanAt: '2026-09-27T10:43:00Z', evidenceIds: ['M08-EVID-011'] },
        applicability: { status: 'confirmed', evidenceIds: ['M08-EVID-012'] },
        exploitability: { status: 'public-exploit-reported', evidenceIds: ['M08-EVID-013'] },
      },
      {
        id: 'M08-FINDING-005', assetId: 'LAB-BUILD-03', product: 'Jenkins', cve: 'CVE-2024-23897',
        classification: 'unrelated-lower-priority', purpose: 'hypothesis-test: critical CVSS and known exploit, but isolated lab host with no reachability',
        cvss: { version: '3.1', baseScore: 9.8, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', source: 'NVD' },
        scanner: 'OpenVAS', observedAt: '2026-09-27T10:45:00Z',
        freshness: { status: 'current', scanAt: '2026-09-27T10:45:00Z', evidenceIds: ['M08-EVID-014'] },
        applicability: { status: 'confirmed', evidenceIds: ['M08-EVID-015'] },
        exploitability: { status: 'known-exploit', evidenceIds: ['M08-EVID-016'] },
      },
      {
        id: 'M08-FINDING-006', assetId: 'DB-REP-11', product: 'PostgreSQL', cve: 'CVE-2023-5868',
        classification: 'unrelated-lower-priority', purpose: 'scope-check: low CVSS on a high-criticality asset behind two other tiers',
        cvss: { version: '3.1', baseScore: 4.3, vector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:N/A:N', source: 'NVD' },
        scanner: 'OpenVAS', observedAt: '2026-09-27T10:47:00Z',
        freshness: { status: 'current', scanAt: '2026-09-27T10:47:00Z', evidenceIds: ['M08-EVID-017'] },
        applicability: { status: 'confirmed', evidenceIds: ['M08-EVID-018'] },
        exploitability: { status: 'public-exploit-reported', evidenceIds: ['M08-EVID-019'] },
      },
      {
        id: 'M08-FINDING-007', assetId: 'WEB-DMZ-14', product: 'OpenSSH', cve: 'CVE-2023-38408',
        classification: 'unrelated-not-applicable', purpose: 'alternate-explanation: second high-CVSS finding on the answer asset that does not apply',
        cvss: { version: '3.1', baseScore: 9.8, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', source: 'NVD' },
        scanner: 'OpenVAS', observedAt: '2026-09-27T10:48:00Z',
        freshness: { status: 'current', scanAt: '2026-09-27T10:48:00Z', evidenceIds: ['M08-EVID-020'] },
        applicability: { status: 'not-applicable', evidenceIds: ['M08-EVID-021'] },
        exploitability: { status: 'public-exploit-reported', evidenceIds: ['M08-EVID-022'] },
      },
      {
        id: 'M08-FINDING-008', assetId: 'HR-PORTAL-07', product: 'OpenSSL', cve: 'CVE-2022-0778',
        classification: 'unrelated-stale', purpose: 'evidence-quality: old scan on an internal host, applicability never re-collected',
        cvss: { version: '3.1', baseScore: 7.5, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H', source: 'NVD' },
        scanner: 'OpenVAS', observedAt: '2026-09-27T10:49:00Z',
        freshness: { status: 'stale', scanAt: '2026-05-20T08:00:00Z', evidenceIds: ['M08-EVID-023'] },
        applicability: { status: 'unverified', evidenceIds: ['M08-EVID-024'] },
        exploitability: { status: 'public-exploit-reported', evidenceIds: ['M08-EVID-025'] },
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
      { id: 'M08-EVID-010', findingId: 'M08-FINDING-001', kind: 'scanner-observation', observedAt: '2026-09-27T10:44:00Z', source: 'Synthetic second-scanner export', detail: 'An independent Nessus-style scan also reports Apache HTTP Server 2.4.49 on WEB-DMZ-14. It corroborates the same finding and is not a second vulnerability.', purpose: 'evidence-quality: duplicate observation of one finding' },
      { id: 'M08-EVID-011', findingId: 'M08-FINDING-004', kind: 'scanner-observation', observedAt: '2026-09-27T10:43:00Z', source: 'Synthetic OpenVAS export', detail: 'Scan reports 3DES-based cipher suites offered by the HR-PORTAL-07 listener.', classification: 'unrelated-context' },
      { id: 'M08-EVID-012', findingId: 'M08-FINDING-004', kind: 'version-applicability', observedAt: '2026-09-27T10:51:00Z', source: 'Synthetic signed package inventory', detail: 'Local TLS configuration confirms 3DES suites remain enabled on the internal listener.', classification: 'unrelated-context' },
      { id: 'M08-EVID-013', findingId: 'M08-FINDING-004', kind: 'exploitability-advisory', observedAt: '2026-09-27T10:51:00Z', source: 'Synthetic threat-intelligence bulletin', detail: 'The attack needs very large volumes of captured traffic over a long-lived session; practical exploitation is impractical on this path.', classification: 'unrelated-context' },
      { id: 'M08-EVID-014', findingId: 'M08-FINDING-005', kind: 'scanner-observation', observedAt: '2026-09-27T10:45:00Z', source: 'Synthetic OpenVAS export', detail: 'Version detection reports Jenkins in the affected range on LAB-BUILD-03.', classification: 'unrelated-context' },
      { id: 'M08-EVID-015', findingId: 'M08-FINDING-005', kind: 'version-applicability', observedAt: '2026-09-27T10:52:00Z', source: 'Synthetic signed package inventory', detail: 'Package inventory confirms the affected Jenkins version is installed on LAB-BUILD-03.', classification: 'unrelated-context' },
      { id: 'M08-EVID-016', findingId: 'M08-FINDING-005', kind: 'exploitability-advisory', observedAt: '2026-09-27T10:52:00Z', source: 'Synthetic threat-intelligence bulletin', detail: 'Exploit code is widely available for this CVE; exploitation needs network reach to the CI listener, which this host does not have.', classification: 'unrelated-context' },
      { id: 'M08-EVID-017', findingId: 'M08-FINDING-006', kind: 'scanner-observation', observedAt: '2026-09-27T10:47:00Z', source: 'Synthetic OpenVAS export', detail: 'Scan reports a PostgreSQL minor version in the affected range on DB-REP-11.', classification: 'unrelated-context' },
      { id: 'M08-EVID-018', findingId: 'M08-FINDING-006', kind: 'version-applicability', observedAt: '2026-09-27T10:53:00Z', source: 'Synthetic signed package inventory', detail: 'Package inventory confirms the affected PostgreSQL minor version; the issue allows limited memory disclosure to an authenticated role.', classification: 'unrelated-context' },
      { id: 'M08-EVID-019', findingId: 'M08-FINDING-006', kind: 'exploitability-advisory', observedAt: '2026-09-27T10:53:00Z', source: 'Synthetic threat-intelligence bulletin', detail: 'A proof-of-concept report exists; it requires an authenticated database role and is not evidence of exploitation here.', classification: 'unrelated-context' },
      { id: 'M08-EVID-020', findingId: 'M08-FINDING-007', kind: 'scanner-observation', observedAt: '2026-09-27T10:48:00Z', source: 'Synthetic OpenVAS export', detail: 'Authenticated package scan reports an OpenSSH version in the affected range on WEB-DMZ-14.', classification: 'unrelated-context' },
      { id: 'M08-EVID-021', findingId: 'M08-FINDING-007', kind: 'applicability-check', observedAt: '2026-09-27T10:54:00Z', source: 'Synthetic signed package inventory', detail: 'The vulnerable path needs ssh-agent forwarding to a host the attacker controls; agent forwarding is not configured and TCP/22 was not reachable in the external scan, so the issue does not apply.', classification: 'unrelated-context' },
      { id: 'M08-EVID-022', findingId: 'M08-FINDING-007', kind: 'exploitability-advisory', observedAt: '2026-09-27T10:54:00Z', source: 'Synthetic threat-intelligence bulletin', detail: 'Public analysis exists for the CVE generally; it cannot apply to this asset without agent forwarding.', classification: 'unrelated-context' },
      { id: 'M08-EVID-023', findingId: 'M08-FINDING-008', kind: 'scanner-observation', observedAt: '2026-05-20T08:00:00Z', source: 'Synthetic OpenVAS export', detail: 'Old scan reports an OpenSSL version potentially in the affected range on HR-PORTAL-07; the observation predates the current review window.', classification: 'unrelated-context' },
      { id: 'M08-EVID-024', findingId: 'M08-FINDING-008', kind: 'applicability-check', observedAt: '2026-09-27T10:55:00Z', source: 'Synthetic service-owner note', detail: 'Current library version has not been collected; applicability remains unverified.', classification: 'unrelated-context' },
      { id: 'M08-EVID-025', findingId: 'M08-FINDING-008', kind: 'exploitability-advisory', observedAt: '2026-09-27T10:55:00Z', source: 'Synthetic threat-intelligence bulletin', detail: 'Public exploit reports exist for the CVE; they do not establish that HR-PORTAL-07 is affected.', classification: 'unrelated-context' },
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
      { id: 'M08-ASSET-EVID-009', assetId: 'HR-PORTAL-07', kind: 'business-criticality', observedAt: '2026-09-27T10:31:00Z', source: 'Synthetic service catalog', detail: 'HR-PORTAL-07 is an internal self-service portal; it has no customer-facing or payment function.', classification: 'unrelated-context' },
      { id: 'M08-ASSET-EVID-010', assetId: 'HR-PORTAL-07', kind: 'reachability', observedAt: '2026-09-27T10:32:00Z', source: 'Synthetic network path inventory', detail: 'Reachable only from the corporate LAN and VPN address ranges.', classification: 'unrelated-context' },
      { id: 'M08-ASSET-EVID-011', assetId: 'HR-PORTAL-07', kind: 'exposure', observedAt: '2026-09-27T10:33:00Z', source: 'Synthetic external attack-surface scan', detail: 'No listener on HR-PORTAL-07 was reachable from the internet in this review.', classification: 'unrelated-context' },
      { id: 'M08-ASSET-EVID-012', assetId: 'HR-PORTAL-07', kind: 'compensating-control', observedAt: '2026-09-27T10:34:00Z', source: 'Synthetic access-policy review', detail: 'A verified MFA gateway fronts the portal; it does not remove the weak cipher configuration itself.', classification: 'unrelated-context' },
      { id: 'M08-ASSET-EVID-013', assetId: 'LAB-BUILD-03', kind: 'business-criticality', observedAt: '2026-09-27T10:35:00Z', source: 'Synthetic service catalog', detail: 'LAB-BUILD-03 is a disposable lab build runner with no production data.', classification: 'unrelated-context' },
      { id: 'M08-ASSET-EVID-014', assetId: 'LAB-BUILD-03', kind: 'reachability', observedAt: '2026-09-27T10:36:00Z', source: 'Synthetic network path inventory', detail: 'The host sits on an isolated lab VLAN with no route from corporate, DMZ or internet segments.', classification: 'unrelated-context' },
      { id: 'M08-ASSET-EVID-015', assetId: 'LAB-BUILD-03', kind: 'exposure', observedAt: '2026-09-27T10:37:00Z', source: 'Synthetic internal attack-surface scan', detail: 'TCP/8080 is open only inside the isolated VLAN; it is not reachable from outside it.', classification: 'unrelated-context' },
      { id: 'M08-ASSET-EVID-016', assetId: 'LAB-BUILD-03', kind: 'compensating-control', observedAt: '2026-09-27T10:38:00Z', source: 'Synthetic segmentation control review', detail: 'Network isolation is verified; this reduces reachability, not the presence of the vulnerable software.', classification: 'unrelated-context' },
      { id: 'M08-ASSET-EVID-017', assetId: 'DB-REP-11', kind: 'business-criticality', observedAt: '2026-09-27T10:39:00Z', source: 'Synthetic service catalog', detail: 'DB-REP-11 holds reporting copies of customer data; it is not on the customer request path.', classification: 'unrelated-context' },
      { id: 'M08-ASSET-EVID-018', assetId: 'DB-REP-11', kind: 'reachability', observedAt: '2026-09-27T10:40:00Z', source: 'Synthetic network path inventory', detail: 'Inbound paths are limited to APP-DMZ-22, which is itself reachable only from WEB-DMZ-14. There is no direct internet or corporate path.', classification: 'unrelated-context' },
      { id: 'M08-ASSET-EVID-019', assetId: 'DB-REP-11', kind: 'exposure', observedAt: '2026-09-27T10:41:00Z', source: 'Synthetic internal attack-surface scan', detail: 'TCP/5432 is available only on the restricted data network.', classification: 'unrelated-context' },
      { id: 'M08-ASSET-EVID-020', assetId: 'DB-REP-11', kind: 'compensating-control', observedAt: '2026-09-27T10:41:30Z', source: 'Synthetic host firewall review', detail: 'A host firewall allows the application tier only; rule review is incomplete, so the control is partial.', classification: 'unrelated-context' },
    ],
    // Scanner job records (Sprint 4): how each asset was scanned. They explain freshness and applicability limits;
    // they are context, not additional vulnerabilities.
    scanRuns: [
      { id: 'M08-SCAN-001', assetId: 'APP-DMZ-22', observedAt: '2026-06-02T08:00:00Z', scanner: 'OpenVAS', mode: 'authenticated', coverage: 'complete', outcome: 'completed', detail: 'Last successful authenticated scan of APP-DMZ-22; the source of the historical OpenSSL observation.', classification: 'unrelated-context', purpose: 'evidence-quality: scan coverage and credential state behind the findings' },
      { id: 'M08-SCAN-002', assetId: 'WEB-DMZ-14', observedAt: '2026-09-27T10:41:00Z', scanner: 'OpenVAS', mode: 'authenticated', coverage: 'complete', outcome: 'completed', detail: 'Authenticated scan of WEB-DMZ-14 completed; package inventory collected.', classification: 'unrelated-context', purpose: 'evidence-quality: scan coverage and credential state behind the findings' },
      { id: 'M08-SCAN-003', assetId: 'HR-PORTAL-07', observedAt: '2026-09-27T10:42:00Z', scanner: 'OpenVAS', mode: 'authenticated', coverage: 'complete', outcome: 'completed', detail: 'Authenticated scan of HR-PORTAL-07 completed; TLS listener enumerated.', classification: 'unrelated-context', purpose: 'evidence-quality: scan coverage and credential state behind the findings' },
      { id: 'M08-SCAN-004', assetId: 'APP-DMZ-22', observedAt: '2026-09-27T10:44:00Z', scanner: 'OpenVAS', mode: 'authenticated', coverage: 'none', outcome: 'credential_failure', detail: 'Authenticated scan of APP-DMZ-22 could not log in (service credential rejected); no package data was collected in this window.', classification: 'unrelated-context', purpose: 'evidence-quality: scan coverage and credential state behind the findings' },
      { id: 'M08-SCAN-005', assetId: 'LAB-BUILD-03', observedAt: '2026-09-27T10:45:00Z', scanner: 'OpenVAS', mode: 'authenticated', coverage: 'complete', outcome: 'completed', detail: 'Authenticated scan of LAB-BUILD-03 completed from inside the isolated VLAN.', classification: 'unrelated-context', purpose: 'evidence-quality: scan coverage and credential state behind the findings' },
      { id: 'M08-SCAN-006', assetId: 'WEB-DMZ-14', observedAt: '2026-09-27T10:46:00Z', scanner: 'OpenVAS', mode: 'unauthenticated', coverage: 'partial', outcome: 'completed_with_warnings', detail: 'Unauthenticated network-signature profile against WEB-DMZ-14; signature matches are indicative only and carry no package evidence.', classification: 'unrelated-context', purpose: 'evidence-quality: scan coverage and credential state behind the findings' },
      { id: 'M08-SCAN-007', assetId: 'DB-REP-11', observedAt: '2026-09-27T10:47:00Z', scanner: 'OpenVAS', mode: 'authenticated', coverage: 'complete', outcome: 'completed', detail: 'Authenticated scan of DB-REP-11 completed.', classification: 'unrelated-context', purpose: 'evidence-quality: scan coverage and credential state behind the findings' },
    ],
    // Patch / change records (Sprint 4): remediation status. A scheduled or approved change is not a fix.
    patchRecords: [
      { id: 'M08-PATCH-001', assetId: 'WEB-DMZ-14', observedAt: '2026-09-27T10:56:00Z', changeId: 'CHG-5521', status: 'approved_not_applied', detail: 'Change CHG-5521 approves an Apache HTTP Server upgrade for the 2026-09-29 window. It has not been applied; the affected version is still installed.', classification: 'unrelated-context', purpose: 'scope-check: planned remediation is not completed remediation' },
      { id: 'M08-PATCH-002', assetId: 'LAB-BUILD-03', observedAt: '2026-09-27T10:52:00Z', changeId: 'CHG-5530', status: 'queued', detail: 'Jenkins upgrade queued at low priority for the next lab maintenance cycle; not applied.', classification: 'unrelated-context', purpose: 'scope-check: planned remediation is not completed remediation' },
      { id: 'M08-PATCH-003', assetId: 'DB-REP-11', observedAt: '2026-09-27T10:53:00Z', changeId: 'CHG-5533', status: 'scheduled', detail: 'PostgreSQL minor update is scheduled with the next quarterly window; not applied.', classification: 'unrelated-context', purpose: 'scope-check: planned remediation is not completed remediation' },
      { id: 'M08-PATCH-004', assetId: 'HR-PORTAL-07', observedAt: '2026-09-27T10:55:00Z', changeId: 'CHG-5538', status: 'requested_not_scheduled', detail: 'A TLS cipher policy change is requested to disable legacy suites; no window is scheduled.', classification: 'unrelated-context', purpose: 'scope-check: planned remediation is not completed remediation' },
    ],
    // Alert candidates raised by scanner rules over the findings above (Sprint 4). They are triage inputs, not
    // proof: `triage` is instructor-side and is never rendered. Two of the five rules fire only on findings that
    // asset context and applicability show to be lower priority than the answer finding.
    alertCandidates: [
      { id: 'M08-ALERT-001', time: '2026-09-27T10:46:30Z', severity: 'High', title: 'Scanner: critical CVSS (9.0 or higher) finding', entities: ['LAB-BUILD-03', 'WEB-DMZ-14'], findingIds: ['M08-FINDING-005', 'M08-FINDING-007'], rule: 'Scanner rule: CVSS base score of 9.0 or higher', query: 'VulnerabilityFindings\n| where CvssScore >= 9',
        triage: { disposition: 'deprioritize', hinge: 'Both matches lose priority once asset context and applicability are read: FINDING-005 sits on an isolated lab VLAN, FINDING-007 is not applicable (no agent forwarding, port not reachable).' } },
      { id: 'M08-ALERT-002', time: '2026-09-27T10:47:10Z', severity: 'Medium', title: 'Scanner: open finding on an internet-facing asset', entities: ['WEB-DMZ-14'], findingIds: ['M08-FINDING-001', 'M08-FINDING-003', 'M08-FINDING-007'], rule: 'Scanner rule: open finding on an asset with public exposure', query: 'VulnerabilityFindings\n| where Host == "WEB-DMZ-14"',
        triage: { disposition: 'investigate-one', hinge: 'Only FINDING-001 is confirmed applicable; FINDING-003 and FINDING-007 are not applicable.' } },
      { id: 'M08-ALERT-003', time: '2026-09-27T10:50:20Z', severity: 'Low', title: 'Scanner: stale scan result still open', entities: ['APP-DMZ-22', 'HR-PORTAL-07'], findingIds: ['M08-FINDING-002', 'M08-FINDING-008'], rule: 'Scanner rule: open finding whose last scan is older than 30 days', query: 'VulnerabilityFindings\n| where Freshness == "stale"',
        triage: { disposition: 'needs-validation', hinge: 'Stale observations are not confirmation; applicability is unverified for both.' } },
      { id: 'M08-ALERT-004', time: '2026-09-27T10:53:40Z', severity: 'Medium', title: 'Scanner: finding on a high-criticality data asset', entities: ['DB-REP-11'], findingIds: ['M08-FINDING-006'], rule: 'Scanner rule: open finding on an asset tiered high or critical', query: 'VulnerabilityFindings\n| where Host == "DB-REP-11"',
        triage: { disposition: 'deprioritize', hinge: 'Low CVSS, authenticated-role precondition and reachability only through APP-DMZ-22 outweigh the asset tier.' } },
      { id: 'M08-ALERT-005', time: '2026-09-27T10:55:30Z', severity: 'Low', title: 'Scanner: weak TLS cipher suite offered', entities: ['HR-PORTAL-07'], findingIds: ['M08-FINDING-004'], rule: 'Scanner rule: legacy cipher suite offered by a listener', query: 'VulnerabilityFindings\n| where Host == "HR-PORTAL-07"',
        triage: { disposition: 'deprioritize', hinge: 'Internal-only listener behind MFA; the attack is impractical on this path.' } },
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
