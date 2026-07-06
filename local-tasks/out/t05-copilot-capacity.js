const COPILOT_USAGE = [
  { date: '2026-06-15', unitsUsed: 4.9, sessions: 7 },
  { date: '2026-06-16', unitsUsed: 4.8, sessions: 6 },
  { date: '2026-06-17', unitsUsed: 4.3, sessions: 5 },
  { date: '2026-06-18', unitsUsed: 4.5, sessions: 5 },
  { date: '2026-06-19', unitsUsed: 4.2, sessions: 4 },
  { date: '2026-06-20', unitsUsed: 3.8, sessions: 6 },
  { date: '2026-06-21', unitsUsed: 3.9, sessions: 6 },
  { date: '2026-06-22', unitsUsed: 4.7, sessions: 8 },
  { date: '2026-06-23', unitsUsed: 5.1, sessions: 9 },
  { date: '2026-06-24', unitsUsed: 4.7, sessions: 8 },
  { date: '2026-06-25', unitsUsed: 4.3, sessions: 7 },
  { date: '2026-06-26', unitsUsed: 3.9, sessions: 6 },
  { date: '2026-06-27', unitsUsed: 4.1, sessions: 7 },
  { date: '2026-06-28', unitsUsed: 3.5, sessions: 5 }
];

const COPILOT_CAPACITY = {
  provisionedSCU: 6,
  overageAllowed: true,
  region: 'Europe',
  owners: ['R. Vance', 'M. Okafor']
};

if (typeof module !== 'undefined') { module.exports = { COPILOT_USAGE, COPILOT_CAPACITY }; }