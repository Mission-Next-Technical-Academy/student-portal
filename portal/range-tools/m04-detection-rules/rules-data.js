window.M04_DATA = {
  rules: [
    { id: 'RULE-101', name: 'Distributed Authentication Spray', grouping: 'SourceIp', threshold: 4, windowMin: 15, severity: 'High', mitre: 'T1110.003' },
    { id: 'RULE-102', name: 'Excessive Single-Account Failures', grouping: 'UserPrincipalName', threshold: 5, windowMin: 10, severity: 'Medium', mitre: 'T1110.001' }
  ],
  telemetry: [
    { time: '09:12:01', ip: '198.51.100.44', user: 'j.doe@example.com', outcome: 'Failure', result: 'BadPassword' },
    { time: '09:12:08', ip: '198.51.100.44', user: 'm.smith@example.com', outcome: 'Failure', result: 'BadPassword' },
    { time: '09:12:15', ip: '198.51.100.44', user: 'a.chen@example.com', outcome: 'Failure', result: 'BadPassword' },
    { time: '09:12:22', ip: '198.51.100.44', user: 'b.wilson@example.com', outcome: 'Failure', result: 'BadPassword' },
    { time: '09:12:30', ip: '198.51.100.44', user: 'k.taylor@example.com', outcome: 'Failure', result: 'BadPassword' }
  ],
  tasks: [
    { id: 't1', prompt: 'Select the SourceIp grouping field to aggregate spray attacks across distinct users.' },
    { id: 't2', prompt: 'Set detection threshold to 4 events within a 15-minute window.' },
    { id: 't3', prompt: 'Validate rule firing against the 198.51.100.44 telemetry cluster.' },
    { id: 't4', prompt: 'Enrich rule with Threat Intelligence indicator TI-801 (AbuseIPDB 100% confidence).' }
  ]
};
