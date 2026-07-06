const AUDIT_RETENTION_POLICIES = [
    {
        id: 'arp-1',
        name: 'Daily Usage Tracking',
        users: ['R.Vance@northwindops.example','M.Okafor@northwindops.example'],
        recordTypes: ['ExchangeItem','SharePointFileOperation','CopilotInteraction'],
        duration: '30 days',
        priority: 1
    },
    {
        id: 'arp-2',
        name: 'Quarterly Data Review',
        users: ['M.Okafor@northwindops.example'],
        recordTypes: ['SharePointFileOperation','CopilotInteraction'],
        duration: '90 days',
        priority: 3
    },
    {
        id: 'arp-3',
        name: 'Full Year Audit',
        users: [],
        recordTypes: ['ExchangeItem','SharePointFileOperation','CopilotInteraction'],
        duration: '1 year',
        priority: 5
    },
    {
        id: 'arp-4',
        name: 'Annual Compliance Check',
        users: [],
        recordTypes: ['ExchangeItem','SharePointFileOperation','CopilotInteraction'],
        duration: '10 years',
        priority: 2
    },
    {
        id: 'arp-5',
        name: 'Special Project Audits',
        users: [],
        recordTypes: ['ExchangeItem'],
        duration: '365 days',
        priority: 4
    }
];

const AUDIT_COPILOT_EVENTS = [
    {
        time: '2026-06-01T09:15:00.000Z',
        user: 'R.Vance@northwindops.example',
        operation: 'CopilotInteraction',
        workload: 'SecurityCopilot',
        detail: 'Generated a custom DLP policy for sensitive data.'
    },
    {
        time: '2026-06-15T14:30:00.000Z',
        user: 'M.Okafor@northwindops.example',
        operation: 'CopilotInteraction',
        workload: 'Word',
        detail: 'Saved draft document on OneDrive.'
    },
    {
        time: '2026-06-30T11:45:00.000Z',
        user: 'R.Vance@northwindops.example',
        operation: 'CopilotInteraction',
        workload: 'Teams',
        detail: 'Integrated Office 365 DLP policies with compliance features.'
    },
    {
        time: '2026-07-01T08:00:00.000Z',
        user: 'M.Okafor@northwindops.example',
        operation: 'CopilotInteraction',
        workload: 'Outlook',
        detail: 'Created a calendar event reminder for next month.'
    },
    {
        time: '2026-07-05T13:25:00.000Z',
        user: 'R.Vance@northwindops.example',
        operation: 'CopilotInteraction',
        workload: 'SecurityCopilot',
        detail: 'Set up audit trails for all Office 365 tenants.'
    },
    {
        time: '2026-07-06T10:45:00.000Z',
        user: 'M.Okafor@northwindops.example',
        operation: 'CopilotInteraction',
        workload: 'Word',
        detail: 'Saved final draft for board presentation on OneDrive.'
    },
    {
        time: '2026-06-10T15:30:00.000Z',
        user: 'R.Vance@northwindops.example',
        operation: 'CopilotInteraction',
        workload: 'Teams',
        detail: 'Integrated DLP policies into compliance dashboards.'
    },
    {
        time: '2026-06-25T11:00:00.000Z',
        user: 'M.Okafor@northwindops.example',
        operation: 'CopilotInteraction',
        workload: 'Teams',
        detail: 'Prepared presentation slides for next meeting.'
    },
    {
        time: '2026-07-03T14:50:00.000Z',
        user: 'R.Vance@northwindops.example',
        operation: 'CopilotInteraction',
        workload: 'Outlook',
        detail: 'Set up reminders for upcoming board meetings.'
    },
    {
        time: '2026-07-04T09:35:00.000Z',
        user: 'M.Okafor@northwindops.example',
        operation: 'CopilotInteraction',
        workload: 'SecurityCopilot',
        detail: 'Reviewed DLP policy settings for new users.'
    }
];

if (typeof module !== 'undefined') { module.exports = { AUDIT_RETENTION_POLICIES, AUDIT_COPILOT_EVENTS }; }