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

  /* Operational telemetry. Four distinct time semantics:
   *  - event time (row TimeGenerated): when the platform event happened;
   *  - ingestion time (IngestionTime): when the SIEM received it, only where lag is meaningful;
   *  - metric window (WindowStart/WindowEnd): the period an aggregate describes, never an event time;
   *  - change time (ChangeTime): when a rule change was deployed.
   * Metrics describe SOC workload and tuning health. They are not evidence that any incident occurred or spread. */
  const RULE_IDS = ['R-01', 'R-02', 'R-03', 'R-04', 'R-05'];
  // Alerts raised per rule per UTC day (order: R-01..R-05). 2026-09-27 is the partial shift window and equals the live queue.
  const DAILY = [
    // day, [R-01..R-05], analysts on shift (peak), MTTA min, mean time to contain min, SLA attainment %, backlog at window end, note
    ['2026-09-17', [6, 4, 3, 5, 2], 4, 11.0, 44.5, 96, 3, 'Weekday baseline.'],
    ['2026-09-18', [5, 3, 4, 6, 1], 4, 10.5, 46.0, 97, 4, 'Weekday baseline.'],
    ['2026-09-19', [3, 2, 1, 3, 0], 2, 14.0, 52.0, 93, 2, 'Weekend; two analysts on shift.'],
    ['2026-09-20', [2, 2, 1, 4, 0], 2, 19.0, 55.5, 91, 2, 'Weekend; two analysts on shift. Slower acknowledgement with lower volume.'],
    ['2026-09-21', [7, 5, 4, 5, 2], 4, 12.0, 45.0, 96, 3, 'Weekday baseline.'],
    ['2026-09-22', [6, 4, 3, 6, 1], 4, 11.5, 44.0, 95, 3, 'Weekday baseline.'],
    ['2026-09-23', [6, 3, 4, 5, 2], 4, 12.0, 47.0, 96, 3, 'Weekday baseline.'],
    ['2026-09-24', [5, 4, 3, 19, 1], 4, 15.0, 48.0, 92, 6, 'Alert volume rises after the afternoon.'],
    ['2026-09-25', [6, 4, 4, 41, 2], 4, 24.0, 51.0, 78, 14, 'Highest alert volume and lowest SLA attainment of the period.'],
    ['2026-09-26', [3, 2, 1, 33, 0], 2, 28.0, 56.0, 71, 17, 'Weekend; two analysts on shift with elevated volume.'],
  ];
  // Same 08:00-12:00 UTC shift across prior days (alert volume, share from R-04, analysts, MTTA minutes, % acknowledged within SLA).
  const SHIFTS = [
    ['2026-09-19', 3, 1, 2, 13.0, 100], ['2026-09-20', 3, 1, 2, 17.0, 100], ['2026-09-21', 9, 2, 4, 11.5, 100], ['2026-09-22', 8, 2, 4, 11.0, 100],
    ['2026-09-23', 8, 2, 4, 12.0, 100], ['2026-09-24', 8, 2, 4, 12.5, 100], ['2026-09-25', 21, 15, 4, 22.0, 81], ['2026-09-26', 14, 11, 2, 26.0, 71],
  ];
  const operations = {
    rules: RULE_IDS,
    // Per rule: events evaluated per 30-minute run and typical run duration (ms). Drives the RuleRuns table.
    ruleRunBase: [{ ruleId: 'R-01', evaluated: 1840, durationMs: 420 }, { ruleId: 'R-02', evaluated: 960, durationMs: 310 }, { ruleId: 'R-03', evaluated: 5200, durationMs: 780 }, { ruleId: 'R-04', evaluated: 41200, durationMs: 1650 }, { ruleId: 'R-05', evaluated: 7300, durationMs: 940 }],
    basis: 'Operational metric: describes SOC workload and tuning, not incident evidence.',
    dailyMetrics: DAILY.map(([day, counts, analysts, mtta, mttc, sla, backlog, note]) => ({
      id: `M11-DAY-${day.slice(5).replace('-', '')}`, windowStart: `${day}T00:00:00Z`, windowEnd: `${day}T23:59:59Z`, windowType: 'full UTC day',
      alertVolume: counts.reduce((a, b) => a + b, 0), analystsOnShift: analysts, mttaMinutes: mtta, mttcMinutes: mttc, slaAttainmentPct: sla, backlogAtWindowEnd: backlog, note,
    })).concat([{ id: 'M11-DAY-0927', windowStart: t('08:00'), windowEnd: t('12:00'), windowType: 'partial: current shift only', alertVolume: 12, analystsOnShift: 4, mttaMinutes: 17.3, mttcMinutes: 46.7, slaAttainmentPct: 77.8, backlogAtWindowEnd: 7, note: 'In progress; same fixed shift as the queue.' }]),
    shiftMetrics: SHIFTS.map(([day, volume, r04, analysts, mtta, slaPct]) => ({
      id: `M11-SHF-${day.slice(5).replace('-', '')}`, windowStart: `${day}T08:00:00Z`, windowEnd: `${day}T12:00:00Z`, alertVolume: volume, r04Alerts: r04, otherRuleAlerts: volume - r04, analystsOnShift: analysts, mttaMinutes: mtta, acknowledgedWithinSlaPct: slaPct,
    })).concat([{ id: 'M11-SHF-0927', windowStart: t('08:00'), windowEnd: t('12:00'), alertVolume: 12, r04Alerts: 5, otherRuleAlerts: 7, analystsOnShift: 4, mttaMinutes: 17.3, acknowledgedWithinSlaPct: 77.8 }]),
    ruleVolume: DAILY.flatMap(([day, counts]) => counts.map((count, i) => ({ id: `M11-RV-${day.slice(5).replace('-', '')}-${RULE_IDS[i].slice(2)}`, ruleId: RULE_IDS[i], windowStart: `${day}T00:00:00Z`, windowEnd: `${day}T23:59:59Z`, alerts: count }))),
    // Historical change records; ChangeTime is when the rule was altered, not when anything happened to a monitored host.
    ruleChanges: [
      { id: 'CHG-2201', changeTime: '2026-09-18T15:30:00Z', ruleId: 'R-02', author: 'detection-engineering', type: 'threshold', summary: 'Raised failed-sign-in threshold from 10 to 12 per 5 minutes.', approval: 'peer reviewed', status: 'deployed' },
      { id: 'CHG-2204', changeTime: '2026-09-19T10:05:00Z', ruleId: 'R-05', author: 'detection-engineering', type: 'exclusion', summary: 'Added the signed backup agent process to the rename-burst exclusions.', approval: 'peer reviewed', status: 'deployed' },
      { id: 'CHG-2209', changeTime: '2026-09-22T09:40:00Z', ruleId: 'R-03', author: 'detection-engineering', type: 'text only', summary: 'Updated the rule description and runbook link; no change to logic.', approval: 'standard change', status: 'deployed' },
      { id: 'CHG-2212', changeTime: '2026-09-24T14:10:00Z', ruleId: 'R-04', author: 'detection-engineering', type: 'logic', summary: 'Widened domain-age threshold from 30 to 90 days and removed the vendor/CDN allowlist from the exclusions.', approval: 'standard change; peer review waived (low-severity rule)', status: 'deployed' },
      { id: 'CHG-2215', changeTime: '2026-09-26T08:20:00Z', ruleId: 'R-01', author: 'detection-engineering', type: 'exclusion', summary: 'Added the corporate travel-VPN exit nodes to the impossible-travel exclusions.', approval: 'peer reviewed', status: 'deployed' },
    ],
    // Platform health around the shift. IngestionLagSeconds is how long the SIEM took to receive the heartbeat.
    collectors: [
      ['DNS resolver collector', 'dns-collector-01', 'Healthy', 3, 41200], ['Endpoint sensor collector', 'edr-collector-01', 'Healthy', 4, 18800], ['VPN gateway collector', 'vpn-collector-01', 'Healthy', 2, 950], ['Mail gateway collector', 'mail-collector-01', 'Healthy', 3, 2100],
    ].flatMap(([name, host, status, lag, rate]) => ['08:00', '09:00', '10:00', '11:00'].map((hm, hour) => {
      const lagging = host === 'edr-collector-01' && hour === 2;
      const seconds = lagging ? 840 : lag;
      return { collector: name, host, time: t(`${hm}`), status: lagging ? 'Lagging' : status, ingestionLagSeconds: seconds, eventsPerMinute: lagging ? Math.round(rate * 0.35) : rate + hour * 10 };
    })),
    shiftLog: [
      { time: t('08:00'), type: 'ShiftStart', actor: 'an-okafor', detail: 'Day shift roster loaded: four analysts available.' },
      { time: t('08:02'), type: 'HandoffReceived', actor: 'an-okafor', detail: 'Night shift handoff received: INC-4937 recovery in progress; no unassigned critical items.' },
      { time: t('09:00'), type: 'QueueReview', actor: 'an-okafor', detail: 'Hourly queue review completed; R-04 volume noted for the shift report.' },
      { time: t('10:00'), type: 'QueueReview', actor: 'an-okafor', detail: 'Hourly queue review completed; two analysts at capacity.' },
      { time: t('11:00'), type: 'QueueReview', actor: 'an-okafor', detail: 'Hourly queue review completed; handoff notes started.' },
      { time: t('11:40'), type: 'HandoffDrafted', actor: 'an-okafor', detail: 'Shift handoff package opened for the evening shift lead.' },
    ],
  };

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
    operations,
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
