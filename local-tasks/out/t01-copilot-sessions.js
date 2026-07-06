const COPILOT_SESSIONS = [
  { id: 'cs-001', name: 'Phishing wave triage - finance dept', owner: 'R. Vance', workspace: 'Primary', lastActivity: '2026-06-28T14:02:00Z', promptCount: 9, plugins: [ 'Defender XDR', 'MDTI' ], pinned: true },
  { id: 'cs-002', name: 'Ransomware indicator in SIEM alerts', owner: 'M. Okafor', workspace: 'SOC-EU', lastActivity: '2026-06-30T15:45:00Z', promptCount: 7, plugins: [ 'Defender XDR' ], pinned: false },
  { id: 'cs-003', name: 'OAuth app misuse event timeline', owner: 'L. Harper', workspace: 'Primary', lastActivity: '2026-06-29T14:58:00Z', promptCount: 5, plugins: [ 'Defender XDR', 'MDTI' ], pinned: true },
  { id: 'cs-004', name: 'DLP alert - potential employee data exfiltration', owner: 'T. Martinez', workspace: 'Primary', lastActivity: '2026-06-27T15:30:00Z', promptCount: 11, plugins: [ 'MDTI' ], pinned: true },
  { id: 'cs-005', name: 'Vulnerability scan prioritization - high risk', owner: 'E. Silva', workspace: 'Primary', lastActivity: '2026-06-30T17:40:00Z', promptCount: 8, plugins: [ 'Defender XDR', 'Sentinel' ], pinned: false },
  { id: 'cs-006', name: 'Incident summary for C-suite: ransomware containment', owner: 'C. Williams', workspace: 'Primary', lastActivity: '2026-06-29T16:58:00Z', promptCount: 6, plugins: [ 'Defender XDR' ], pinned: false },
  { id: 'cs-007', name: 'TI analysis - suspicious DNS traffic', owner: 'J. Patel', workspace: 'Primary', lastActivity: '2026-06-30T14:25:00Z', promptCount: 3, plugins: [ 'Intune' ], pinned: true },
  { id: 'cs-008', name: 'Risk matrix for recent sign-ins - SOC report', owner: 'K. Kim', workspace: 'SOC-EU', lastActivity: '2026-06-31T17:59:00Z', promptCount: 4, plugins: [ 'Sentinel' ], pinned: true }
];

if (typeof module !== 'undefined') { module.exports = { COPILOT_SESSIONS }; }