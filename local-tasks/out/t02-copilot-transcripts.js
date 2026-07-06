const COPILOT_TRANSCRIPTS = [
{
    sessionId: 'cs-001',
    steps: [
        { role: 'analyst', text: 'Reviewing the incident details of A123. This is a suspected phishing attack.', plugin: 'none', pinned: true },
        { role: 'copilot', text: 'The summary shows an email campaign targeting employees with a phishing link. 90% open rate, 25% click-through to payload delivery page.', plugin: 'Defender XDR', pinned: false },
        { role: 'analyst', text: 'Which users clicked the malicious link?', plugin: 'none', pinned: true },
        { role: 'copilot', text: 'The list of affected users includes R. Vance and M. Okafor.', plugin: 'Defender XDR', pinned: false },
        { role: 'analyst', text: 'What are the recommended actions?', plugin: 'none', pinned: true }
    ]
},
{
    sessionId: 'cs-003',
    steps: [
        { role: 'analyst', text: 'Analyzing a suspicious PowerShell command pasted by the analyst.', plugin: 'MDTI', pinned: true },
        { role: 'copilot', text: 'Providing context, this command decodes an encoded payload that appears to be a downloader script.', plugin: 'none', pinned: false },
        { role: 'analyst', text: 'Could you provide more related intel on the actor?', plugin: 'none', pinned: true },
        { role: 'copilot', text: 'The command was likely executed by an actor called Nickel Sleet, known for spear-phishing campaigns targeting financial institutions.', plugin: 'none', pinned: false },
        { role: 'analyst', text: 'Draft a summary with this information.', plugin: 'none', pinned: true }
    ]
}
];
if (typeof module !== 'undefined') { module.exports = { COPILOT_TRANSCRIPTS }; }