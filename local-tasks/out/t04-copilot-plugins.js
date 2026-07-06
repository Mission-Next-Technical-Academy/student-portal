const COPILOT_PLUGINS = [
    {
        id: 'pl-01',
        name: 'Microsoft Defender XDR - Endpoint Security Policies',
        category: 'First-party',
        status: 'On',
        description: 'Enforces security policies for endpoints.',
        setupNote: 'Configure policy sets in the Workspace.'
    },
    {
        id: 'pl-02',
        name: 'Microsoft Sentinel - Data Connector to APM',
        category: 'First-party',
        status: 'On',
        description: 'Automatically correlates events from application performance monitoring.',
        setupNote: 'Integrate with the on-prem SIEM.'
    },
    {
        id: 'pl-03',
        name: 'Microsoft Entra - Conditional Access Policy',
        category: 'First-party',
        status: 'On',
        description: 'Enforces access rules for cloud resources.',
        setupNote: 'Configure policy in Microsoft Entra ID.'
    },
    {
        id: 'pl-04',
        name: 'Microsoft Intune - Device Management',
        category: 'First-party',
        status: 'On',
        description: 'Manages company-owned and personal devices.',
        setupNote: 'Set up managed devices via the portal.'
    },
    {
        id: 'pl-05',
        name: 'Microsoft Defender Threat Intelligence - Real-Time Indicators',
        category: 'First-party',
        status: 'Off',
        description: 'Provides real-time cyber threat intelligence.',
        setupNote: 'Enable in the workspace and manage threats.'
    },
    {
        id: 'pl-06',
        name: 'Microsoft Purview - Information Protection Policies',
        category: 'First-party',
        status: 'On',
        description: 'Protects sensitive data in documents and emails.',
        setupNote: 'Create policies for email and file shares.'
    },
    {
        id: 'pl-07',
        name: 'Azure Firewall - Network Security Policy',
        category: 'First-party',
        status: 'On',
        description: 'Secures network traffic flow.',
        setupNote: 'Configure firewall rules in the Azure portal.'
    },
    {
        id: 'pl-08',
        name: 'NetScope CASB - Cloud Security Risk Policy',
        category: 'Non-Microsoft',
        status: 'Off',
        description: 'Monitors and manages cloud security risks.',
        setupNote: 'Integrate with NetScope platform.'
    },
    {
        id: 'pl-09',
        name: 'ComplySoft Compliance Manager - Audit Policies',
        category: 'Non-Microsoft',
        status: 'Off',
        description: 'Enforces compliance of cloud applications.',
        setupNote: 'Configure policies for SaaS apps.'
    },
    {
        id: 'pl-10',
        name: 'KQL Debugger - Query Optimization Tool',
        category: 'Custom',
        status: 'On',
        description: 'Optimizes Kusto queries for performance.',
        setupNote: 'Requires Node.js environment.'
    },
    {
        id: 'pl-11',
        name: 'Azure API Manager - Gateway Management Tool',
        category: 'Custom',
        status: 'Off',
        description: 'Manages and secures APIs.',
        setupNote: 'Configure in the Azure portal.'
    },
    {
        id: 'pl-12',
        name: 'ChatGPT Prompt Engine - Interactive Assistance Tool',
        category: 'Custom',
        status: 'On',
        description: 'Provides interactive Q&A support for analysts.',
        setupNote: 'No additional setup required.'
    }
];

if (typeof module !== 'undefined') { module.exports = { COPILOT_PLUGINS }; }