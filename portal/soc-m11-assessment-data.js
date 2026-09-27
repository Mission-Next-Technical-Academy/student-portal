/* Independent, immutable Module 11 SOC operations assessment fixture. */
const SocM11AssessmentData = (() => {
  'use strict';

  function freeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(freeze);
    return value;
  }

  const day = '2026-09-27';
  const t = (hms) => `${day}T${hms}:00Z`;
  const item = (id, fields) => ({
    id, kind: 'alert', assigneeId: null, acknowledgedAt: null, containedAt: null, status: 'new', recordedDisposition: null, ...fields,
  });

  const scenario = {
    id: 'M11-ASSESS-2026-09-27',
    caseId: 'OPS-5511',
    stateKey: 'm11-soc-operations-assessment-v1', // gitleaks:allow
    start: t('08:00'),
    end: t('12:00'),
    fixedAt: t('12:00'),
    shift: { id: 'SHIFT-0927-DAY', label: 'Day shift 08:00–12:00 UTC', handoffTo: 'Evening shift lead' },
    analysts: [
      { id: 'an-okafor', name: 'Analyst Okafor', role: 'Incident lead', openItems: 3, capacity: 3 },
      { id: 'an-ruiz', name: 'Analyst Ruiz', role: 'Tier 2', openItems: 3, capacity: 3 },
      { id: 'an-chen', name: 'Analyst Chen', role: 'Tier 1', openItems: 1, capacity: 4 },
      { id: 'an-patel', name: 'Analyst Patel', role: 'Tier 1', openItems: 0, capacity: 4 },
    ],
    ownerIds: ['ir-lead-owners', 'identity-owners', 'detection-engineering', 'fs02-service-owner'],
    escalationRoutes: [
      { id: 'ir-lead-owners', label: 'Incident lead + endpoint/identity owners' },
      { id: 'identity-owners', label: 'Identity owners' },
      { id: 'detection-engineering', label: 'Detection engineering' },
      { id: 'service-desk', label: 'Service desk' },
    ],
    rules: [
      { id: 'R-01', name: 'Impossible travel sign-in', owner: 'detection-engineering' },
      { id: 'R-02', name: 'Password spray against VPN', owner: 'detection-engineering' },
      { id: 'R-03', name: 'Office macro spawns shell', owner: 'detection-engineering' },
      { id: 'R-04', name: 'DNS lookup to newly registered domain', owner: 'detection-engineering' },
      { id: 'R-05', name: 'Rapid file-rename burst', owner: 'detection-engineering' },
    ],
    queue: [
      item('Q-01', { kind: 'incident', title: 'INC-4937 ransomware on ws-173 (recovery phase)', ruleId: 'R-05', severity: 'critical', businessImpact: 'high', createdAt: t('08:05'), slaMinutes: 15, acknowledgedAt: t('08:09'), containedAt: t('08:40'), status: 'in_progress', assigneeId: 'an-okafor' }),
      item('Q-02', { title: 'Password spray against VPN gateway', ruleId: 'R-02', severity: 'high', businessImpact: 'high', createdAt: t('11:10'), slaMinutes: 60 }),
      item('Q-03', { title: 'Office macro spawned PowerShell on ws-219', ruleId: 'R-03', severity: 'critical', businessImpact: 'high', createdAt: t('11:35'), slaMinutes: 30 }),
      item('Q-04', { title: 'Impossible travel sign-in for acct-311', ruleId: 'R-01', severity: 'medium', businessImpact: 'medium', createdAt: t('10:30'), slaMinutes: 60 }),
      item('Q-05', { title: 'DNS lookup to newly registered domain (ws-051)', ruleId: 'R-04', severity: 'low', businessImpact: 'low', createdAt: t('08:20'), slaMinutes: 120, acknowledgedAt: t('08:50'), status: 'closed', assigneeId: 'an-chen', recordedDisposition: 'false_positive' }),
      item('Q-06', { title: 'DNS lookup to newly registered domain (ws-088)', ruleId: 'R-04', severity: 'low', businessImpact: 'low', createdAt: t('08:45'), slaMinutes: 120, acknowledgedAt: t('09:10'), status: 'closed', assigneeId: 'an-chen', recordedDisposition: 'benign_positive' }),
      item('Q-07', { title: 'DNS lookup to newly registered domain (ws-102)', ruleId: 'R-04', severity: 'low', businessImpact: 'low', createdAt: t('09:30'), slaMinutes: 120, acknowledgedAt: t('09:55'), status: 'closed', assigneeId: 'an-patel', recordedDisposition: 'false_positive' }),
      item('Q-08', { title: 'DNS lookup to newly registered domain (ws-140)', ruleId: 'R-04', severity: 'low', businessImpact: 'low', createdAt: t('11:40'), slaMinutes: 120 }),
      item('Q-09', { title: 'DNS lookup to newly registered domain (ws-163)', ruleId: 'R-04', severity: 'low', businessImpact: 'low', createdAt: t('09:00'), slaMinutes: 120 }),
      item('Q-10', { title: 'Password spray against OWA', ruleId: 'R-02', severity: 'high', businessImpact: 'medium', createdAt: t('08:30'), slaMinutes: 60, acknowledgedAt: t('08:40'), containedAt: t('09:30'), status: 'closed', assigneeId: 'an-ruiz', recordedDisposition: 'true_positive' }),
      item('Q-11', { title: 'Office macro spawned shell on ws-044', ruleId: 'R-03', severity: 'high', businessImpact: 'medium', createdAt: t('08:10'), slaMinutes: 30, acknowledgedAt: t('08:22'), containedAt: t('08:55'), status: 'closed', assigneeId: 'an-ruiz', recordedDisposition: 'true_positive' }),
      item('Q-12', { kind: 'incident', title: 'INC-5020 suspicious inbox rule on acct-208', ruleId: 'R-01', severity: 'high', businessImpact: 'medium', createdAt: t('10:50'), slaMinutes: 30, acknowledgedAt: t('11:05'), status: 'in_progress', assigneeId: 'an-ruiz' }),
    ],
    incident: {
      id: 'INC-4937',
      queueItemId: 'Q-01',
      title: 'Ransomware on ws-173 with overlapping remote session',
      entities: ['ws-173', 'acct-173', 'fs-02'],
      containment: 'ws-173 isolated; remote session for acct-173 revoked; startup persistence removed.',
      recoveryEvidence: [
        { id: 'M11-REC-01', time: t('09:20'), status: 'complete', summary: 'ws-173 restored from the verified pre-incident recovery point RP-WS-173-0918.' },
        { id: 'M11-REC-02', time: t('09:35'), status: 'complete', summary: 'Post-restore clean scan of ws-173 returned no detections.' },
        { id: 'M11-REC-03', time: t('10:10'), status: 'complete', summary: 'The 30-minute monitoring window for ws-173 (09:40–10:10) closed with no residual detections.' },
        { id: 'M11-REC-04', time: t('10:40'), status: 'pending', summary: 'fs-02 file-share service validation by the service owner is still pending.' },
        { id: 'M11-REC-05', time: t('11:15'), status: 'pending', summary: 'Confirmation that the acct-173 credential reset completed is still pending from identity owners.' },
      ],
    },
    audiences: [
      { id: 'technical', label: 'Technical case narrative', reader: 'Incident responders and Tier 2' },
      { id: 'executive', label: 'Executive summary', reader: 'Business leadership; plain language, no raw indicators' },
      { id: 'escalation', label: 'Escalation notice', reader: 'Receiving owner team' },
      { id: 'handoff', label: 'Shift handoff', reader: 'Evening shift lead' },
      { id: 'closure', label: 'Closure report', reader: 'Incident lead and service owners' },
    ],
  };

  const expectedTruth = {
    queuePriority: [
      { itemId: 'Q-03', reason: 'Critical, high business impact, SLA at risk (25 of 30 minutes elapsed), unassigned.' },
      { itemId: 'Q-02', reason: 'High severity and impact, SLA at risk (50 of 60 minutes elapsed), unassigned.' },
      { itemId: 'Q-04', reason: 'SLA already breached (90 of 60 minutes); medium impact.' },
    ],
    slaBreaches: ['Q-04', 'Q-09'],
    slaAtRisk: ['Q-02', 'Q-03'],
    noisyRuleId: 'R-04',
    acceptableAssignees: { 'Q-02': ['an-chen', 'an-patel'], 'Q-03': ['an-chen', 'an-patel'] },
    escalations: [{ itemId: 'Q-03', route: 'ir-lead-owners' }],
    dispositions: { 'Q-02': 'true_positive', 'Q-03': 'true_positive', 'Q-04': 'benign_positive', 'Q-08': 'false_positive', 'Q-09': 'false_positive' },
    metrics: { alertVolume: 12, mttaMinutes: 17.3, mttrMinutes: 46.7, backlog: 7, noisyRuleNonTruePositiveRate: 1 },
    closureDecision: 'retain',
    residualRisks: [
      { id: 'fs02-service-validation', evidenceId: 'M11-REC-04', ownerId: 'fs02-service-owner', keywords: ['fs-02', 'file-share', 'file share'] },
      { id: 'credential-reset-confirmation', evidenceId: 'M11-REC-05', ownerId: 'identity-owners', keywords: ['credential', 'acct-173', 'password'] },
    ],
    dueBy: `2026-10-04`,
  };

  return freeze({ schemaVersion: 1, scenario, expectedTruth });
})();
