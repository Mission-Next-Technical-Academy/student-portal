const COPILOT_PROMPTBOOKS = [
    {
        id: 'pb-01',
        name: 'Incident investigation',
        source: 'Microsoft',
        description: 'Step-by-step triage of an incident.',
        inputs: ['Incident ID'],
        prompts: ['Summarize incident <ID>', 'List impacted entities', 'List related alerts', 'Suggest response actions', 'Draft an executive summary']
    },
    {
        id: 'pb-02',
        name: 'Suspicious script analysis',
        source: 'Microsoft',
        description: 'Analyze suspicious scripts for potential threats.',
        inputs: [],
        prompts: ['Identify the purpose of <script>', 'Check against known malware patterns', 'Examine network activity related to <script>', 'Suggest next steps']
    },
    {
        id: 'pb-03',
        name: 'Threat actor profile',
        source: 'Microsoft',
        description: 'Develop a profile of the threat actor based on attack patterns.',
        inputs: ['Device name'],
        prompts: ['List recent activity by <device>', 'Identify common tactics and techniques used', 'Suggest potential motivations']
    },
    {
        id: 'pb-04',
        name: 'Vulnerability impact assessment',
        source: 'Microsoft',
        description: 'Assess the risk of a vulnerability exploit.',
        inputs: [],
        prompts: ['Describe the vulnerability', 'Estimate potential damage', 'Suggest remediation steps']
    },
    {
        id: 'pb-05',
        name: 'User compromise assessment',
        source: 'Microsoft',
        description: 'Evaluate the risk of user data breaches.',
        inputs: [],
        prompts: ['Identify potential access vectors', 'Determine impacted users and data', 'Suggest containment actions']
    },
    {
        id: 'pb-06',
        name: 'Email threat triage',
        source: 'Microsoft',
        description: 'Triage incoming emails for potential threats.',
        inputs: ['Incident ID'],
        prompts: ['Summarize email content <ID>', 'Check against known phishing patterns', 'Analyze sender behavior', 'Suggest actions']
    },
    {
        id: 'pb-07',
        name: 'Shift handoff summary',
        source: 'Custom',
        description: 'Compile a summary of ongoing incidents for oncoming analysts.',
        inputs: [],
        prompts: ['List unresolved incidents', 'Highlight key findings and issues', 'Provide recommendations']
    },
    {
        id: 'pb-08',
        name: 'Threat hunting playbook',
        source: 'Custom',
        description: 'Detailed steps for proactive threat hunting activities.',
        inputs: [],
        prompts: ['Outline objectives and scope', 'Describe detection criteria', 'Suggest initial actions']
    }
];

if (typeof module !== 'undefined') { module.exports = { COPILOT_PROMPTBOOKS }; }