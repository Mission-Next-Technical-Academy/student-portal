/* Module 09 — semi-independent incident response.
 * All people, systems, addresses, and evidence are synthetic and browser-local.
 */

const MODULE_NINE_LAB_ID = 'm09-proportional-response-v1';
const MODULE_NINE_SECOND_LAB_ID = 'm09-independent-containment-v1';
const MODULE_NINE_FLAG = 'M09-INCIDENT-RESPONSE-COMPLETE';
const MODULE_NINE_CATALOG_LAB_KEY = 'lab-active-incident';
const MODULE_NINE_PASSING_SCORE = 70;
const MODULE_NINE_CATALOG_MODULE = LABS.find((item) => item.key === MODULE_NINE_CATALOG_LAB_KEY);

/*
 * Shared evidence-set contract (Sprint 10 / Module 09).
 * Modules 10, 11, and 12 may consume this browser-local, synthetic case by
 * stable incident/evidence IDs. The contract deliberately records observed
 * facts and boundaries, not real IOCs, victims, operators, or attribution.
 */
const MISSION_NEXT_M09_EVIDENCE_CONTRACT = {
  contractVersion: 'm09-ransomware-evidence-v1',
  organization: 'Mission Next Labs',
  incidentId: 'INC-4937',
  title: 'Operation Cedar Lock — active ransomware response',
  status: 'contained-in-lab-slice',
  entities: { endpoint: 'ws-173', account: 'acct-173', fileServer: 'fs-02' },
  timeBasis: 'Synthetic UTC training timeline; all addresses are documentation-range fixtures.',
  confirmed: ['ws-173 encryption activity', 'acct-173 suspicious remote session', 'fs-02 service disruption'],
  notEstablished: ['enterprise-wide compromise', 'data exfiltration', 'specific operator identity', 'real-world victim or IOC match'],
  evidenceIds: ['M09-E01', 'M09-E02', 'M09-E03', 'M09-E04', 'M09-E05', 'M09-E06', 'M09-E07', 'M09-E08'],
  consumerSlices: {
    module10: ['M09-E01', 'M09-E02', 'M09-E03', 'M09-E04', 'M09-E05'],
    module11: ['M09-E01', 'M09-E03', 'M09-E06', 'M09-E07', 'M09-E08'],
    module12: ['M09-E01', 'M09-E02', 'M09-E03', 'M09-E04', 'M09-E05', 'M09-E06', 'M09-E07', 'M09-E08'],
  },
};
if (typeof window !== 'undefined') window.MISSION_NEXT_M09_EVIDENCE_CONTRACT = MISSION_NEXT_M09_EVIDENCE_CONTRACT;

const MODULE_NINE_SOURCES = {
  endpoint: {
    label: 'Endpoint activity',
    icon: 'ri-computer-line',
    prompt: 'Decide which endpoint records establish active impact, containment status, and the affected host.',
    rows: [
      { id: 'M09-E01', time: '10:02', entity: 'ws-173', title: 'Ransomware encryption activity detected', summary: 'unsigned worker renamed documents; 37 files changed in 90 seconds', detail: 'The endpoint sensor reports rapid file-encryption behavior in the user profile. This is a synthetic behavior record, not a real malware sample or hash.', relevant: true },
      { id: 'M09-E02', time: '10:04', entity: 'ws-173', title: 'Recovery service stopped', summary: 'shadow-copy service stop request observed', detail: 'A process on ws-173 requested a recovery-service stop shortly after encryption began. The record supports impact behavior; it does not prove every recovery point was deleted.', relevant: true },
      { id: 'M09-E03', time: '10:06', entity: 'ws-173', title: 'Endpoint isolation succeeded', summary: 'network isolation playbook completed; local process remained active', detail: 'Isolation limits network spread but does not itself stop local encryption or prove the host is clean.', relevant: true },
      { id: 'M09-E04', time: '10:09', entity: 'ws-173', title: 'Known-good workstation baseline', summary: 'managed backup agent completed before the incident window', detail: 'The signed backup process ran during its approved window and is included as a benign comparison record.', relevant: false },
    ],
  },
  identity: {
    label: 'Identity sessions',
    icon: 'ri-user-shared-line',
    prompt: 'Correlate the account activity to the impact window without treating every successful sign-in as hostile.',
    rows: [
      { id: 'M09-E05', time: '09:58', entity: 'acct-173', title: 'Interactive sign-in from managed workstation', summary: '192.0.2.173 · ws-173 · MFA satisfied', detail: 'The account authenticated from its registered workstation before the impact behavior.', relevant: false },
      { id: 'M09-E06', time: '10:05', entity: 'acct-173', title: 'Unfamiliar remote session overlaps encryption', summary: '203.0.113.173 · unmanaged client', detail: 'The session overlaps the ws-173 encryption window. It is correlation evidence, not proof of operator identity.', relevant: true },
      { id: 'M09-E07', time: '10:11', entity: 'acct-173', title: 'Account owner denied the remote session', summary: 'Synthetic service-desk callback SD-4937', detail: 'The account owner confirmed the workstation was in use but denied the unmanaged client session.', relevant: true },
    ],
  },
  scope: {
    label: 'Network & scope',
    icon: 'ri-node-tree',
    prompt: 'Use network and scoping results to bound the response. Absence in this small dataset is not proof of enterprise safety.',
    rows: [
      { id: 'M09-E08', time: '10:12', entity: 'fs-02', title: 'File-share availability degraded', summary: 'one synthetic share unavailable; no confirmed second host encryption', detail: 'The file server reports a service interruption during the ws-173 incident window. Current data does not establish file-level encryption on fs-02 or broader lateral movement.', relevant: true },
      { id: 'M09-E09', time: '10:15', entity: 'Scoped search', title: 'No second endpoint matched the impact behavior', summary: 'encryption pattern searched across the assigned lab slice', detail: 'The bounded search supports one confirmed endpoint. Continue monitoring; do not claim the wider environment is clean.', relevant: true },
      { id: 'M09-E10', time: '10:18', entity: 'Data access check', title: 'No exfiltration evidence in assigned slice', summary: 'synthetic egress review returned no matching transfer record', detail: 'Current evidence does not show data exfiltration. This limits demonstrated impact, not attacker intent.', relevant: false },
    ],
  },
};

const MODULE_NINE_EXPECTED_EVIDENCE = ['M09-E01', 'M09-E02', 'M09-E03', 'M09-E06', 'M09-E07', 'M09-E08', 'M09-E09'];

const MODULE_NINE_QUIZ_BANKS = [
  {
    conceptId: 'cross-source-correlation',
    conceptTitle: 'Cross-source correlation',
    questions: [
      {
        id: 'm09-q-corr-1',
        prompt: 'You observe a script execution on an endpoint at 09:14 and an unfamiliar account token refresh from a different geographic location at 09:18. What is the BEST first step before linking them into one incident?',
        options: [
          { id: 'a', text: 'Link them immediately because they occurred within minutes of each other.' },
          { id: 'b', text: 'Validate that both events share a common entity (account, endpoint, or network address) and check timeline overlap and behavioral context.' },
          { id: 'c', text: 'Ignore the token refresh because account activity is normal background noise.' },
          { id: 'd', text: 'Report both events separately to different teams without analysis.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. Correlation requires shared identity, shared infrastructure, or timing tight enough to rule out coincidence—not just temporal proximity alone.',
        feedbackIncorrect: 'Time alone does not prove correlation. You must connect the evidence through entity (endpoint, account, IP) and check whether the surrounding behavior supports a single incident.',
      },
      {
        id: 'm09-q-corr-2',
        prompt: 'Two endpoints contact the same external IP address at different times, but endpoint A does so through normal web browsing and endpoint B through an unsigned process. How does context change your assessment?',
        options: [
          { id: 'a', text: 'They must be part of the same attack because they shared an IP address.' },
          { id: 'b', text: 'The shared IP alone is insufficient. The process context (signed vs. unsigned) and behavior patterns determine whether they belong to one incident or are independent.' },
          { id: 'c', text: 'Ignore the shared address and treat them as unrelated.' },
          { id: 'd', text: 'The destination IP is all that matters; context is irrelevant.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. A shared indicator (IP, domain, hash) is correlation material only when supported by matching behavior and entity context.',
        feedbackIncorrect: 'Indicators alone do not prove correlation. A shared address may be coincidence if the behavior, entities, and timing differ significantly.',
      },
      {
        id: 'm09-q-corr-3',
        prompt: 'An endpoint alert shows a file downloaded and executed. A separate firewall alert shows the same user account logging in from an unusual location. Both events occurred within the same hour. What should you do before escalating as a single incident?',
        options: [
          { id: 'a', text: 'Escalate both immediately as a compromised endpoint and account.' },
          { id: 'b', text: 'Verify that the download-execute and login events share the same endpoint or account identifier, and check whether the timing suggests one actor or two separate events.' },
          { id: 'c', text: 'Dismiss the unusual location as a false positive.' },
          { id: 'd', text: 'Treat them as separate incidents without further analysis.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. Correlation requires validation that events belong to the same subject and that timing/behavior suggest a single incident, not coinciding background activity.',
        feedbackIncorrect: 'Endpoint alerts and identity alerts can fire independently. You must connect them through a shared identifier and verify the sequence supports a unified incident story.',
      },
      {
        id: 'm09-q-corr-4',
        prompt: 'You see three evidence sources: endpoint execution, account token use, and network connection. Which of these BEST establishes correlation across all three?',
        options: [
          { id: 'a', text: 'The endpoint execution record, because execution is always the root cause.' },
          { id: 'b', text: 'The network connection, because network telemetry covers all endpoints.' },
          { id: 'c', text: 'The account token use sharing the endpoint ID and time window with the execution, plus the network connection from that endpoint to the same destination.' },
          { id: 'd', text: 'Any single source is sufficient if it has a high confidence score.' },
        ],
        correctId: 'c',
        feedbackCorrect: 'Correct. Strong correlation requires multiple sources sharing entity (endpoint or account) and timing alignment that makes coincidence unlikely.',
        feedbackIncorrect: 'No single source type is universally sufficient. Correlation is strongest when independent sources share common identifiers and timing.',
      },
    ],
  },
  {
    conceptId: 'scoping-uncertainty',
    conceptTitle: 'Scoping and uncertainty',
    questions: [
      {
        id: 'm09-q-scope-1',
        prompt: 'A malware sample is found on one endpoint in a department of 150 devices. Your evidence spans only 4 hours and covers a small slice of network traffic. What is accurate to communicate?',
        options: [
          { id: 'a', text: 'The full department is compromised and you should assume all 150 devices are infected.' },
          { id: 'b', text: 'One endpoint is confirmed compromised. The scope beyond that device is unproven by this limited data; continue monitoring for matches.' },
          { id: 'c', text: 'There is no incident because only one device is affected.' },
          { id: 'd', text: 'The wider network is definitely clean because the search found nothing elsewhere.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. State what is confirmed (one endpoint). Acknowledge what is not observed (lateral movement, wider compromise) without claiming the environment is clean.',
        feedbackIncorrect: 'Limited evidence cannot prove enterprise-wide safety. Absence of evidence in a bounded search is not proof of absence.',
      },
      {
        id: 'm09-q-scope-2',
        prompt: 'You search for an indicator across your network and find zero matches. Can you state that no other systems are compromised?',
        options: [
          { id: 'a', text: 'Yes, because the search covered the entire network.' },
          { id: 'b', text: 'No. A search of available logs and telemetry covers only what was collected. Gaps in logging, unmonitored segments, or different attacker behaviors remain possible.' },
          { id: 'c', text: 'Yes, if the search tool is sophisticated.' },
          { id: 'd', text: 'No, only if an executive approves the statement.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. State the search scope, tools, and time window. Do not claim the environment is clean beyond what those tools can observe.',
        feedbackIncorrect: 'Search results are bounded by log retention, collection configuration, and tool capability. Negative results do not prove absence outside those boundaries.',
      },
      {
        id: 'm09-q-scope-3',
        prompt: 'Your lab environment shows confirmed endpoint and account compromise. Your actual incident scope is limited to those two entities. How should you frame the response?',
        options: [
          { id: 'a', text: 'Contain and remediate the endpoint and account; assume the wider organization is clean.' },
          { id: 'b', text: 'Take proportionate action on confirmed entities; continue scoped monitoring for indicators; defer claims about the wider environment.' },
          { id: 'c', text: 'Declare the entire infrastructure compromised to be safe.' },
          { id: 'd', text: 'Do nothing until you can prove lateral movement.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. Respond to confirmed scope; monitor for evidence of wider compromise without making unproven claims.',
        feedbackIncorrect: 'Proportionate response means matching action to confirmed scope while remaining vigilant for evidence of expansion.',
      },
      {
        id: 'm09-q-scope-4',
        prompt: 'After containment, you search for the attacker\'s behavior elsewhere and find no matches. Your responders want to declare the environment clean. What is the professional boundary?',
        options: [
          { id: 'a', text: 'Agree with the declaration because absence of evidence is proof of absence.' },
          { id: 'b', text: 'State that the investigation found no matches within search parameters; maintain monitoring and be prepared to adjust if future data arrives.' },
          { id: 'c', text: 'Escalate to deny them the ability to declare safety.' },
          { id: 'd', text: 'Accept their declaration and close all monitoring.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. Report what the data shows; acknowledge search boundaries; maintain alertness without overclaiming certainty.',
        feedbackIncorrect: 'Professional incident response requires precision: state findings, not hopes. Monitoring continues because absence in a snapshot is not proof of permanence.',
      },
    ],
  },
  {
    conceptId: 'response-phase-discipline',
    conceptTitle: 'Incident response phase discipline',
    questions: [
      {
        id: 'm09-q-phase-1',
        prompt: 'You have contained an infected endpoint by isolating its network access. The endpoint is no longer able to communicate. What is the NEXT phase action?',
        options: [
          { id: 'a', text: 'Reconnect it immediately so users can return to work.' },
          { id: 'b', text: 'Eradicate: remove the malware, patch vulnerabilities, and validate the system is clean before recovery.' },
          { id: 'c', text: 'Delete all logs to prevent the attacker from seeing evidence.' },
          { id: 'd', text: 'Perform a full disk wipe without forensic analysis.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. After containment limits harm, eradication removes the foothold. Only after successful eradication does recovery restore service.',
        feedbackIncorrect: 'Phases are sequential: contain the active threat, then eradicate the root cause, then restore service. Skipping steps allows reinfection.',
      },
      {
        id: 'm09-q-phase-2',
        prompt: 'During the eradication phase, you discover the attacker also compromised user credentials. What action belongs in this phase, and what belongs in recovery?',
        options: [
          { id: 'a', text: 'Eradicate: reset all credentials; Recovery: restore service immediately.' },
          { id: 'b', text: 'Eradicate: reset credentials and revoke active sessions; Recovery: re-enable accounts and monitor for misuse.' },
          { id: 'c', text: 'Eradicate: do nothing to credentials because they are not malware.' },
          { id: 'd', text: 'Recovery: reset credentials before endpoint work is complete.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. Eradication removes the attacker\'s access paths (credentials, sessions). Recovery carefully restores user access with monitoring.',
        feedbackIncorrect: 'Credential reset is eradication (removes attacker access). Account re-enablement is recovery (restores legitimate access). The sequence matters.',
      },
      {
        id: 'm09-q-phase-3',
        prompt: 'Your eradication work is complete. The system has been patched, malware removed, and credentials reset. Can you reconnect the endpoint to the network now?',
        options: [
          { id: 'a', text: 'Yes, because eradication is finished.' },
          { id: 'b', text: 'No. Validate that patches are installed, the system boots cleanly, and malware scans show no alerts. Only then proceed to recovery.' },
          { id: 'c', text: 'Yes, if time-critical business needs it.' },
          { id: 'd', text: 'No, keep it isolated forever.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. Recovery requires validation that the endpoint is actually clean, not just our intention that it should be.',
        feedbackIncorrect: 'Reconnecting before validation is how reinfection happens. Validate the eradication work before recovery.',
      },
      {
        id: 'm09-q-phase-4',
        prompt: 'What is the PRIMARY purpose of documenting lessons learned AFTER recovery is complete?',
        options: [
          { id: 'a', text: 'To assign blame to individuals.' },
          { id: 'b', text: 'To identify process gaps and improve detection, response playbooks, and controls for future incidents.' },
          { id: 'c', text: 'Lessons learned are not necessary; the incident is resolved.' },
          { id: 'd', text: 'To present a case against a specific tool vendor.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. Lessons learned (part of the "Learn" phase) improve your organization\'s ability to detect and respond to similar incidents.',
        feedbackIncorrect: 'Post-incident review is critical. It converts reactive response into continuous improvement.',
      },
    ],
  },
  {
    conceptId: 'proportionate-severity',
    conceptTitle: 'Proportionate severity classification',
    questions: [
      {
        id: 'm09-q-sev-1',
        prompt: 'A malware execution and unfamiliar account session occur on a single employee workstation. No data access or lateral movement is observed. What is a proportionate severity rating?',
        options: [
          { id: 'a', text: 'Critical: because malware was executed.' },
          { id: 'b', text: 'High: the incident is confirmed and requires prompt response, but the scope and impact are limited to one device and account.' },
          { id: 'c', text: 'Low: it is only one workstation, so it is not urgent.' },
          { id: 'd', text: 'Informational: because no data was accessed.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. High severity reflects confirmed compromise and persistence, tempered by limited scope and impact. Severity increases if lateral movement or critical assets are affected.',
        feedbackIncorrect: 'Severity balances impact, scope, and exploitability. A single infected workstation with no data access is serious but not enterprise-wide critical.',
      },
      {
        id: 'm09-q-sev-2',
        prompt: 'An attacker compromised a workstation and used that endpoint to access a database server containing customer financial records. What severity is appropriate?',
        options: [
          { id: 'a', text: 'High: only one workstation was directly infected.' },
          { id: 'b', text: 'Critical: the incident includes lateral movement and access to sensitive data on a business-critical asset.' },
          { id: 'c', text: 'Medium: database breaches are common.' },
          { id: 'd', text: 'Low: because the customer data was not exfiltrated.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. Scope (lateral movement), impact (sensitive data systems), and criticality (financial data) elevate this to critical.',
        feedbackIncorrect: 'Scope and impact determine severity. Access to sensitive systems or data multiplies the incident\'s business consequence.',
      },
      {
        id: 'm09-q-sev-3',
        prompt: 'A prevention control (EDR) blocked a malware execution attempt before it ran. Does this change the severity rating?',
        options: [
          { id: 'a', text: 'Yes: there is no severity because the malware was blocked.' },
          { id: 'b', text: 'No: the malware still represents a threat; the control reduced impact but does not eliminate the need to understand why the endpoint was targeted.' },
          { id: 'c', text: 'Yes: severity downgrade to informational.' },
          { id: 'd', text: 'No: classify it as critical regardless of the control.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. Prevention success is a control strength, not a reason to ignore the threat. A blocked attack still represents targeting and risk.',
        feedbackIncorrect: 'Controls reduce impact, not severity of the underlying threat. You still need to investigate why the endpoint was chosen.',
      },
      {
        id: 'm09-q-sev-4',
        prompt: 'Your response plan is to isolate the endpoint, reset credentials, and restore the device. How should severity classification guide your response timeline?',
        options: [
          { id: 'a', text: 'High severity: complete containment within 2–4 hours; eradication and validation within 8 hours.' },
          { id: 'b', text: 'High severity: defer all action until the next day.' },
          { id: 'c', text: 'High severity: implement every possible response regardless of business impact.' },
          { id: 'd', text: 'High severity does not affect timeline.' },
        ],
        correctId: 'a',
        feedbackCorrect: 'Correct. Severity, scope, and impact determine the response timeline. High severity with confirmed compromise and active sessions requires swift but deliberate action.',
        feedbackIncorrect: 'Severity classification should drive response tempo. High severity demands hours, not days; critical demands faster.',
      },
    ],
  },
  {
    conceptId: 'escalation-handoff',
    conceptTitle: 'Escalation and handoff communication',
    questions: [
      {
        id: 'm09-q-hand-1',
        prompt: 'As a Tier 1 responder, you have completed investigation and built a containment plan. What is your authority and the next step?',
        options: [
          { id: 'a', text: 'Execute all response actions yourself without escalation.' },
          { id: 'b', text: 'Initiate approved playbook actions; escalate the evidence, scope, and requested specialist actions (eradication, recovery, validation) to the incident lead and system owners.' },
          { id: 'c', text: 'Do not escalate because you have completed your work.' },
          { id: 'd', text: 'Escalate without a clear plan or evidence.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. Tier 1 authority includes investigation and initiating approved actions. Specialists own execution of eradication, identity remediation, and recovery validation.',
        feedbackIncorrect: 'Escalation with evidence and a clear plan enables specialist teams to take action within their authority. Vague escalation wastes time.',
      },
      {
        id: 'm09-q-hand-2',
        prompt: 'You are writing a handoff to the incident lead. Which of these MUST be included for the next team to act effectively?',
        options: [
          { id: 'a', text: 'General statement that there is an incident; everything else is optional.' },
          { id: 'b', text: 'Confirmed scope (endpoint and account), strongest evidence, requested containment actions, and the condition you need before recovery (e.g., "validate clean scan").' },
          { id: 'c', text: 'A list of unrelated alerts.' },
          { id: 'd', text: 'The incident is resolved so no handoff needed.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. A complete handoff includes what is confirmed, the evidence foundation, who should do what, and the acceptance criteria for the next phase.',
        feedbackIncorrect: 'Vague handoffs result in wasted escalation, unclear accountability, and delayed response. Precision enables specialist action.',
      },
      {
        id: 'm09-q-hand-3',
        prompt: 'Your incident evidence names a specific account, endpoint, and correlated behavioral indicators. When you escalate, why is precision important?',
        options: [
          { id: 'a', text: 'It is not important; the incident lead can figure out what you meant.' },
          { id: 'b', text: 'Precision ensures the team remediates the correct entities, avoids collateral business impact, and documents the scope for compliance and forensics.' },
          { id: 'c', text: 'Precision slows down escalation.' },
          { id: 'd', text: 'The incident lead prefers ambiguity to avoid accountability.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. Precise scope prevents both under-response (missing the actual compromise) and over-response (remediating unaffected systems).',
        feedbackIncorrect: 'Vague scope creates risk. Specialists need exact entities so they can act with confidence and compliance.',
      },
      {
        id: 'm09-q-hand-4',
        prompt: 'What SHOULD NOT be in your handoff to the next team?',
        options: [
          { id: 'a', text: 'Assumptions about whether the wider environment is clean—you do not know.' },
          { id: 'b', text: 'Blame or accusations about individuals or teams.' },
          { id: 'c', text: 'The scope and evidence you actually found.' },
          { id: 'd', text: 'Both A and B.' },
        ],
        correctId: 'd',
        feedbackCorrect: 'Correct. Avoid claims beyond your evidence, and focus on facts, not blame. Let specialists and management handle accountability separately from response.',
        feedbackIncorrect: 'Professional handoffs are evidence-focused. Assumptions and blame undermine the next team\'s confidence and create distraction.',
      },
    ],
  },
];

const MODULE_NINE_SOURCES_LIST = [
  {
    title: 'Incident Response Recommendations and Considerations for Cybersecurity Risk Management (SP 800-61 Rev. 3)',
    org: 'NIST',
    url: 'https://csrc.nist.gov/pubs/sp/800/61/r3/final',
    note: 'The authoritative incident response framework covering preparation, detection, analysis, containment, eradication, and recovery phases.',
  },
  {
    title: 'Federal Government Cybersecurity Incident and Vulnerability Response Playbooks',
    org: 'CISA',
    url: 'https://www.cisa.gov/resources-tools/resources/federal-government-cybersecurity-incident-and-vulnerability-response-playbooks',
    note: 'Standardized operational procedures for incident response, including scoping, containment, and escalation within defined authority boundaries.',
  },
  {
    title: 'MITRE ATT&CK — Persistence',
    org: 'MITRE',
    url: 'https://attack.mitre.org/tactics/TA0003/',
    note: 'Provides behavior-mapping context for impact and service-disruption observations; this module uses ATT&CK as a descriptive framework, not proof of attribution.',
  },
  {
    title: 'MITRE ATT&CK — Command and Control',
    org: 'MITRE',
    url: 'https://attack.mitre.org/tactics/TA0011/',
    note: 'Provides a vocabulary for describing observed communication behavior without turning a documentation-range address into a real IOC claim.',
  },
  {
    title: 'Guide for Cybersecurity Event Recovery (SP 800-184)',
    org: 'NIST',
    url: 'https://csrc.nist.gov/pubs/sp/800/184/final',
    note: 'Planning and validation guidance for the recovery phase — deciding when it is safe to restore a contained host or re-enable an account.',
  },
  {
    title: 'Security+ (SY0-701) Certification Overview & Objectives Summary',
    org: 'CompTIA',
    url: 'https://www.comptia.org/certifications/security',
    note: 'Supplementary public reference only. The §2 crosswalk is a developer draft pending curriculum, compliance, and faculty review; this study aid is not an approval, affiliation, endorsement, or pass guarantee.',
  },
];
const MODULE_NINE_RESPONSE_OPTIONS = {
  contain: [
    { id: 'isolate-ws173', label: 'Isolate ws-173 through the approved endpoint playbook.', help: 'Limits further network spread while preserving responder access.' },
    { id: 'revoke-disable-acct173', label: 'Revoke acct-173 sessions and temporarily disable the account.', help: 'Contains the confirmed overlapping remote session while identity responders validate it.' },
    { id: 'segment-fs02', label: 'Restrict fs-02 share access and monitor the affected service.', help: 'Limits demonstrated service impact without shutting down the entire environment.' },
    { id: 'shutdown-all', label: 'Shut down every endpoint in the organization.', help: 'Business-wide disruption is unsupported by the one-host scope.' },
    { id: 'observe-only', label: 'Keep observing because the sensor blocked one launch.', help: 'One prevention event did not remove persistence or contain the identity session.' },
  ],
  eradicate: [
    { id: 'stop-encryption', label: 'Stop the encryption process after response evidence is preserved.', help: 'Stops active impact while respecting the evidence-preservation decision.' },
    { id: 'reset-credentials', label: 'Reset acct-173 credentials and review its MFA methods.', help: 'Remediates the identity path after active sessions are revoked.' },
    { id: 'restore-service', label: 'Repair the fs-02 service only after the incident lead validates scope.', help: 'Addresses the observed service disruption without inferring full server compromise.' },
    { id: 'delete-telemetry', label: 'Delete the endpoint telemetry to prevent reinfection.', help: 'Telemetry is evidence; deleting it neither eradicates the cause nor supports recovery.' },
    { id: 'reimage-fleet', label: 'Reimage every endpoint in the organization.', help: 'The current evidence supports response on ws-173, not the full fleet.' },
  ],
  recover: [
    { id: 'validate-reconnect', label: 'Validate ws-173 is clean, patched, and healthy before reconnecting it.', help: 'Recovery restores service only after responders verify eradication.' },
    { id: 'monitored-reenable', label: 'Re-enable acct-173 after credential and MFA checks, with heightened monitoring.', help: 'Returns access carefully and watches for recurrence.' },
    { id: 'reconnect-now', label: 'Reconnect ws-173 immediately after isolation succeeds.', help: 'Isolation success does not prove encryption tooling is removed.' },
    { id: 'disable-forever', label: 'Keep acct-173 disabled permanently without business-owner review.', help: 'Permanent denial is not a proportionate recovery plan for this evidence.' },
  ],
};

const MODULE_NINE_INDEPENDENT_CASE = {
  id: 'INC-4942',
  title: 'Independent response drill — backup service disruption',
  summary: 'A second Mission Next Labs endpoint shows suspicious encryption-like file changes after a privileged account session. The learner must decide whether to isolate, preserve, or escalate from a smaller evidence slice.',
  records: [
    { id: 'M09-B01', label: 'ws-208 endpoint alert', detail: '11 files changed rapidly by an unsigned process; no confirmed service stop.', relevant: true },
    { id: 'M09-B02', label: 'acct-208 sign-in', detail: 'Privileged account session from its registered workstation; MFA satisfied.', relevant: false },
    { id: 'M09-B03', label: 'backup queue delay', detail: 'One backup job missed its window; cause is not yet established.', relevant: true },
    { id: 'M09-B04', label: 'fleet search', detail: 'No matching file-change pattern in the assigned 30-minute search window.', relevant: true },
  ],
  expected: { classification: 'contain-investigate', scope: 'ws-208-only', escalation: 'lead-owner', action: 'isolate-preserve' },
};

let moduleNineState = null;
let moduleNineUser = null;
let moduleNineQuizState = null;
let moduleNineReviewMode = false;
let moduleNineSecondState = null;

function moduleNineFreshDefaults() {
  return {
    activeSource: 'endpoint',
    reviewedSources: [],
    selectedEvidence: [],
    detailEvidence: '',
    hintsOpened: [],
    classification: '',
    scope: '',
    severity: '',
    responsePlan: { contain: [], eradicate: [], recover: [] },
    escalation: '',
    notes: '',
    breakdown: null,
    feedback: [],
    validationError: '',
    lastSubmittedAt: '',
  };
}

function moduleNineSecondFreshDefaults() {
  return { selected: [], independentClassification: '', independentScope: '', independentEscalation: '', independentAction: '', notes: '', attempts: 0, score: 0, feedback: [], completed: false };
}

function moduleNineLoad(user) {
  moduleNineUser = user;
  const defaults = moduleNineFreshDefaults();
  moduleNineState = LabRuntime.load(MODULE_NINE_LAB_ID, user, defaults);
  moduleNineSecondState = LabRuntime.load(MODULE_NINE_SECOND_LAB_ID, user, moduleNineSecondFreshDefaults());
  ['reviewedSources', 'selectedEvidence', 'hintsOpened', 'feedback', 'flags'].forEach((key) => {
    if (!Array.isArray(moduleNineState[key])) moduleNineState[key] = [];
  });
  moduleNineState.responsePlan = { ...defaults.responsePlan, ...(moduleNineState.responsePlan || {}) };
  Object.keys(defaults.responsePlan).forEach((phase) => {
    if (!Array.isArray(moduleNineState.responsePlan[phase])) moduleNineState.responsePlan[phase] = [];
  });
  if (!MODULE_NINE_SOURCES[moduleNineState.activeSource]) moduleNineState.activeSource = 'endpoint';

  // Initialize quiz state
  if (!moduleNineQuizState) {
    const previousQuestionIds = moduleNineState.lastQuizQuestionIds || [];
    const selection = selectQuizQuestions(MODULE_NINE_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    moduleNineQuizState = {
      selectedQuestions: selection.selectedQuestions,
      questionsByAnswer: selection.questionsByAnswer,
      answers: {},
      scored: false,
      attempts: 0,
      score: 0,
      bestScore: 0,
      feedback: [],
      passed: false,
    };
  }

  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'soc-analyst', 'soc-09');
  return moduleNineState;
}

function moduleNineSave() {
  if (moduleNineUser && moduleNineState) LabRuntime.save(MODULE_NINE_LAB_ID, moduleNineUser, moduleNineState);
}

function moduleNineAllRows() {
  return Object.values(MODULE_NINE_SOURCES).flatMap((source) => source.rows);
}

function moduleNineRow(id) {
  return moduleNineAllRows().find((row) => row.id === id);
}

function moduleNineGetSections() {
  return [
    { id: 'lecture', title: 'Lecture', type: 'lecture', isComplete: true, scrollId: 'm09-lecture' },
    { id: 'knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: moduleNineQuizState?.passed, scrollId: 'm09-knowledge-check' },
    { id: 'guided-response-lab', title: 'Guided ransomware response', type: 'lab', isComplete: moduleNineState.completed, scrollId: 'm09-lab' },
    { id: 'independent-response-lab', title: 'Independent response drill', type: 'lab', isComplete: moduleNineSecondState?.completed, scrollId: 'm09-independent-title' },
    { id: 'review', title: 'Module Review', type: 'review', isComplete: true, scrollId: 'm09-review' },
  ];
}

function moduleNineConcepts() {
  const cards = [
    ['ri-link-m', 'Correlate before acting', 'Connect time, entity, behavior, and source. A shared address is useful only when the surrounding activity supports the relationship.'],
    ['ri-focus-2-line', 'Bound impact and uncertainty', 'State what is confirmed, what is not observed, and what this limited dataset cannot prove. Scope controls response size.'],
    ['ri-shield-check-line', 'Respond in phases', 'Contain active harm, eradicate the foothold, then recover carefully. Preserve evidence and stay within approved authority.'],
    ['ri-file-list-3-line', 'Leave an actionable handoff', 'Record incident state, exact entities, strongest evidence, actions requested, and the condition that permits recovery.'],
  ];
  return `<div class="m09-concept-grid">${cards.map((card) => `<article><i class="${esc(card[0])}" aria-hidden="true"></i><h3>${esc(card[1])}</h3><p>${esc(card[2])}</p></article>`).join('')}</div>
    <div class="m09-lifecycle" aria-label="NIST incident response sequence"><span>Prepare</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>Detect &amp; analyze</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>Contain</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>Eradicate</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>Recover</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>Learn</span></div>`;
}

function moduleNineScenarioLoop() {
  return `<div class="m09-loop-grid" aria-label="Module 09 four-part learning loop"><article><p class="m09-kicker">Scenario</p><h4>INC-4937 is encrypting now</h4><p>ws-173 shows rapid file changes, acct-173 has an overlapping unmanaged session, and fs-02 reports service disruption.</p></article><article><p class="m09-kicker">Theory</p><h4>NIST lifecycle discipline</h4><p>Detect and analyze the evidence, contain active harm, eradicate demonstrated access, recover only after validation, then learn.</p></article><article><p class="m09-kicker">Knowledge check</p><h4>Explain the next phase</h4><p>Use the embedded check to distinguish containment from eradication and a bounded finding from a fleet-wide claim.</p></article><article><p class="m09-kicker">Applied task</p><h4>Write the responder handoff</h4><p>In the guided lab, select the evidence set and request actions that a lead and system owners can execute and validate.</p></article></div>`;
}

function moduleNineQuizQuestion(selected, index) {
  const question = selected.question;
  const userAnswerId = moduleNineQuizState?.answers?.[question.id];
  const answered = userAnswerId !== undefined;
  return `<fieldset class="m09-quiz-question" data-question-id="${esc(question.id)}">
    <legend><span>${index + 1}</span> ${esc(selected.conceptTitle)}: ${esc(question.prompt)}</legend>
    <div class="m09-quiz-options">
      ${selected.shuffledOptions.map((option) => `<label>
        <input type="radio" name="q-${esc(question.id)}" value="${esc(option.id)}" ${userAnswerId === option.id ? 'checked' : ''} data-m09-quiz-answer />
        <span>${esc(option.text)}</span>
      </label>`).join('')}
    </div>
  </fieldset>`;
}

function moduleNineQuizPanel() {
  if (!moduleNineQuizState?.selectedQuestions || moduleNineQuizState.selectedQuestions.length === 0) {
    return `<div class="m09-quiz-empty" id="m09-quiz-feedback" role="status">Loading quiz…</div>`;
  }

  const selected = moduleNineQuizState.selectedQuestions;
  const answered = Object.keys(moduleNineQuizState.answers || {}).length;
  const total = selected.length;

  let feedbackHtml = '';
  if (moduleNineQuizState.scored) {
    const passed = moduleNineQuizState.score >= 70;
    feedbackHtml = `<section class="m09-quiz-score ${passed ? 'm09-quiz-pass' : 'm09-quiz-remediate'}" id="m09-quiz-feedback" tabindex="-1" aria-live="polite">
      <div class="m09-quiz-score-heading">
        <div>
          <p class="m09-kicker">Attempt ${moduleNineQuizState.attempts} · best ${moduleNineQuizState.bestScore}/100</p>
          <h3>${moduleNineQuizState.score}/100 — ${passed ? 'Knowledge verified' : 'Use feedback and retry'}</h3>
        </div>
        <span>${moduleNineQuizState.score}</span>
      </div>
      <ul class="m09-quiz-feedback-list">
        ${(moduleNineQuizState.feedback || []).map((fb) => `<li class="${fb.correct ? 'm09-quiz-feedback-correct' : 'm09-quiz-feedback-incorrect'}">
          <i class="ri-${fb.correct ? 'checkbox-circle-fill' : 'information-line'}" aria-hidden="true"></i>
          <div>
            <strong>${fb.questionId}</strong>
            <p>${esc(fb.message)}</p>
          </div>
        </li>`).join('')}
      </ul>
      ${!passed ? `<div class="m09-quiz-actions"><button type="button" class="m09-quiz-retry" data-m09-quiz-retry><i class="ri-refresh-line" aria-hidden="true"></i> Try different questions</button></div>` : ''}
    </section>`;
  } else if (answered === total) {
    feedbackHtml = `<div class="m09-quiz-ready" id="m09-quiz-feedback" role="status">All questions answered. Submit to check your responses.</div>`;
  } else {
    feedbackHtml = `<div class="m09-quiz-empty" id="m09-quiz-feedback" role="status">Answer all ${total} questions to submit.</div>`;
  }

  return `<form class="m09-quiz-form" id="m09-quiz-form" novalidate>
    <div class="m09-panel-heading"><div><p class="m09-kicker">Knowledge check</p><h3 id="m09-quiz-title" tabindex="-1">Test your understanding of incident response principles</h3></div><span>${answered}/${total} answered</span></div>
    ${selected.map((sel, idx) => moduleNineQuizQuestion(sel, idx)).join('')}
    <div class="m09-quiz-actions">
      <button class="m09-quiz-submit" type="submit" ${answered < total ? 'disabled' : ''}>
        <i class="ri-checkbox-circle-line" aria-hidden="true"></i> Check my answers
      </button>
    </div>
    ${feedbackHtml}
  </form>`;
}

function moduleNineVideoScript() {
  return `<details class="m09-video-script">
    <summary><strong>Video script (recording pending)</strong></summary>
    <div class="m09-script-body">
      <p><strong>Introduction:</strong> Welcome to incident response. This module teaches you how to investigate a suspicious event, determine whether it qualifies as an incident, bound the scope, and build a response plan that matches what you actually know—without making unfounded claims about the wider environment.</p>

      <p><strong>Segment 1 — Correlation across sources, not single indicators.</strong> In INC-4937, rapid encryption on ws-173, an overlapping acct-173 session, and fs-02 service disruption support one active incident slice. Correlation requires shared entities and timing; it does not identify a real operator or prove enterprise-wide compromise. Single indicators can be background noise or unrelated events.</p>

      <p><strong>Segment 2 — State what you know, not what you hope.</strong> After investigation, you will find some evidence and not find other evidence. A scoped search across one endpoint and no others means you have confirmed one endpoint's compromise, not that the wider environment is clean. Absence of evidence in a bounded dataset is not evidence of absence. Communicate your scope and search boundaries precisely. Say "We found these entities compromised" and "We searched this data and found no matches," not "The environment is definitely clean" or "Everyone is probably compromised." This precision lets specialists and management make informed decisions about what comes next.</p>

      <p><strong>Segment 3 — NIST lifecycle phases are sequential, not parallel.</strong> Prepare establishes roles and playbooks. Detect and analyze validates the incident. Containment stops active harm— isolate ws-173, revoke acct-173 sessions, and restrict affected service access. Eradication removes the demonstrated access and impact mechanism. Recovery restores service only after validation. Learn records control and detection improvements. Skipping a phase risks continued compromise or reinfection.</p>

      <p><strong>Segment 4 — Severity classification balances scope, impact, and evidence.</strong> Malware execution is serious, but a prevented execution on a single employee workstation is lower severity than malware running on a critical database server. Account compromise is serious, but a single account is lower severity than the compromised account used to access sensitive systems. Severity reflects the true business consequence of the incident—not panic, not minimization, but proportionate classification. High severity may warrant response within hours; critical within minutes. Low-risk events warrant standard procedures. Match your severity to what the evidence actually shows.</p>

      <p><strong>Segment 5 — Escalation with evidence and a clear plan.</strong> As a Tier 1 responder, your authority includes investigation and initiating approved playbook actions (isolation, session revocation, and evidence preservation). You do not have authority to wipe the fleet, declare the organization clean, or attribute the activity to a named operator. Your job is to correlate the ransomware impact, define the confirmed scope, and escalate with a clear request: "INC-4937 confirms encryption activity on ws-173, an overlapping acct-173 session, and fs-02 service disruption. Preserve evidence, stop active impact, restrict affected access, and validate before recovery." That precision lets specialists execute their part without guessing.</p>

      <p><strong>Closing:</strong> Incident response is a discipline of evidence-based decisions with clear authority boundaries. Correlate before acting. State your scope and uncertainty. Follow the phases. Classify proportionately. Escalate with precision. Your team depends on it.</p>
    </div>
  </details>`;
}

function moduleNineReview() {
  return `<section class="m09-review-section">
    <h3>Module concepts at a glance</h3>
    <ul>
      <li><strong>Cross-source correlation:</strong> Connect observations through shared entities (endpoint, account, IP) and timing patterns. A single indicator is not correlation—it requires multiple sources supporting the same incident story.</li>
      <li><strong>Scoping and uncertainty:</strong> Communicate what you confirmed, what you did not observe, and what your limited search cannot prove. Absence of evidence in a bounded dataset is not proof of enterprise-wide safety.</li>
      <li><strong>Response phase discipline:</strong> Containment stops active harm, eradication removes the root cause, recovery restores service. Complete each phase before the next. Skipping phases allows reinfection or continued compromise.</li>
      <li><strong>Proportionate severity classification:</strong> Match severity to demonstrated scope and impact. Malware on one user endpoint is serious; malware with lateral movement to critical systems is critical. Severity drives response timeline.</li>
      <li><strong>Escalation and handoff communication:</strong> As a Tier 1 responder, initiate approved actions and escalate the evidence, exact scope, and requested specialist actions. Precision enables the incident lead and owners to act confidently.</li>
      <li><strong>Authority and accountability:</strong> Know your role's boundaries. You investigate and escalate; specialists and owners execute remediation and validation. Clear handoffs prevent confusion and wasted cycles.</li>
    </ul>
    <h3>Before you continue</h3>
    <p>You should now be able to correlate evidence across endpoint, identity, and network sources; bound the scope of an incident based on what you actually found; classify severity proportionately; design a containment-to-recovery plan that respects response phases; and write a clear, evidence-based handoff to incident specialists. In later modules and on-the-job, you will apply these skills in rapid triage, escalation, and coordinated response scenarios.</p>
  </section>`;
}

function moduleNineSourceTabs() {
  return `<div class="m09-source-tabs" role="tablist" aria-label="Incident evidence sources">${Object.entries(MODULE_NINE_SOURCES).map(([key, source]) => {
    const reviewed = moduleNineState.reviewedSources.includes(key);
    return `<button type="button" role="tab" id="m09-tab-${esc(key)}" aria-controls="m09-source-panel" aria-selected="${moduleNineState.activeSource === key}" tabindex="${moduleNineState.activeSource === key ? '0' : '-1'}" data-m09-source="${esc(key)}"><i class="${esc(source.icon)}" aria-hidden="true"></i><span>${esc(source.label)}</span><small>${reviewed ? 'Reviewed' : 'Not reviewed'}</small></button>`;
  }).join('')}</div>`;
}

function moduleNineEvidenceTable(sourceKey) {
  const source = MODULE_NINE_SOURCES[sourceKey];
  const detail = moduleNineRow(moduleNineState.detailEvidence);
  return `<section class="m09-source-panel" id="m09-source-panel" role="tabpanel" aria-labelledby="m09-tab-${esc(sourceKey)}">
    <div class="m09-source-heading"><div><p class="m09-kicker">Source question</p><h4 id="m09-source-title" tabindex="-1">${esc(source.prompt)}</h4></div><button type="button" class="m09-review" data-m09-review="${esc(sourceKey)}"><i class="${moduleNineState.reviewedSources.includes(sourceKey) ? 'ri-checkbox-circle-fill' : 'ri-checkbox-circle-line'}" aria-hidden="true"></i>${moduleNineState.reviewedSources.includes(sourceKey) ? 'Source reviewed' : 'Mark source reviewed'}</button></div>
    <div class="m09-table-wrap"><table class="m09-data-table"><caption class="m09-visually-hidden">${esc(source.label)} synthetic incident records</caption><thead><tr><th scope="col">Evidence</th><th scope="col">Time</th><th scope="col">Entity</th><th scope="col">Observation</th><th scope="col">Context</th></tr></thead><tbody>${source.rows.map((row) => {
      const selected = moduleNineState.selectedEvidence.includes(row.id);
      return `<tr class="${selected ? 'is-selected' : ''}"><td data-label="Evidence"><label class="m09-evidence-check"><input type="checkbox" name="evidence" value="${esc(row.id)}" ${selected ? 'checked' : ''} /><span>${esc(row.id)}</span></label></td><td data-label="Time"><time>${esc(row.time)}</time></td><td data-label="Entity"><code>${esc(row.entity)}</code></td><td data-label="Observation"><strong>${esc(row.title)}</strong><small>${esc(row.summary)}</small></td><td data-label="Context"><button type="button" class="m09-inspect" data-m09-detail="${esc(row.id)}" aria-expanded="${detail?.id === row.id}">${detail?.id === row.id ? 'Hide' : 'Inspect'}</button></td></tr>`;
    }).join('')}</tbody></table></div>
    ${detail && source.rows.includes(detail) ? `<aside class="m09-detail" id="m09-evidence-detail" tabindex="-1"><div><p class="m09-kicker">${esc(detail.id)} · analyst context</p><strong>${esc(detail.title)}</strong><p>${esc(detail.detail)}</p></div><button type="button" data-m09-detail-close aria-label="Close evidence detail"><i class="ri-close-line" aria-hidden="true"></i></button></aside>` : ''}
  </section>`;
}

function moduleNineEvidenceTray() {
  const selected = moduleNineState.selectedEvidence.map(moduleNineRow).filter(Boolean);
  return `<aside class="m09-evidence-tray" aria-labelledby="m09-tray-title"><div><p class="m09-kicker">Correlation set</p><h4 id="m09-tray-title"><span id="m09-evidence-count">${selected.length}</span> records selected</h4></div>${selected.length ? `<ol>${selected.map((row) => `<li><code>${esc(row.id)}</code><span>${esc(row.entity)} · ${esc(row.title)}</span><button type="button" data-m09-remove-evidence="${esc(row.id)}" aria-label="Remove evidence ${esc(row.id)}"><i class="ri-close-line" aria-hidden="true"></i></button></li>`).join('')}</ol>` : '<p>Select records that establish execution, affected entities, correlation, and defensible scope. Benign context should stay out of the set.</p>'}</aside>`;
}

function moduleNineRadioGroup(name, legend, help, options) {
  return `<fieldset class="m09-fieldset"><legend>${esc(legend)}</legend><p class="m09-help">${esc(help)}</p><div class="m09-option-list">${options.map((option) => `<label><input type="radio" name="${esc(name)}" value="${esc(option.id)}" ${moduleNineState[name] === option.id ? 'checked' : ''} /><span><strong>${esc(option.label)}</strong><small>${esc(option.help)}</small></span></label>`).join('')}</div></fieldset>`;
}

function moduleNineResponsePhase(phase, number, title, description) {
  const selected = moduleNineState.responsePlan[phase];
  return `<fieldset class="m09-response-phase"><legend><span>${number}</span>${esc(title)}</legend><p>${esc(description)}</p><div class="m09-response-options">${MODULE_NINE_RESPONSE_OPTIONS[phase].map((option) => `<label><input type="checkbox" name="response-${esc(phase)}" value="${esc(option.id)}" ${selected.includes(option.id) ? 'checked' : ''} /><span><strong>${esc(option.label)}</strong><small>${esc(option.help)}</small></span></label>`).join('')}</div></fieldset>`;
}

function moduleNineScorePanel() {
  if (moduleNineState.validationError) return `<div class="m09-validation" id="m09-feedback" role="alert" tabindex="-1"><i class="ri-information-line" aria-hidden="true"></i><div><strong>Finish the response record</strong><p>${esc(moduleNineState.validationError)}</p></div></div>`;
  if (!moduleNineState.attempts || !moduleNineState.breakdown) return `<div class="m09-score-empty" id="m09-feedback" role="status">Your evidence and decisions are saved locally. Submit when the handoff is ready; retries do not reduce your score.</div>`;
  const b = moduleNineState.breakdown;
  const passed = moduleNineState.score >= MODULE_NINE_PASSING_SCORE;
  return `<section class="m09-score ${passed ? 'is-pass' : 'is-remediate'}" id="m09-feedback" tabindex="-1" aria-live="polite" aria-labelledby="m09-score-title"><div class="m09-score-heading"><div><p class="m09-kicker">Attempt ${moduleNineState.attempts} · best ${moduleNineState.bestScore}/100</p><h3 id="m09-score-title">${moduleNineState.score}/100 — ${passed ? 'Response plan approved' : 'Revise and resubmit'}</h3></div><span>${moduleNineState.score}</span></div><div class="m09-score-grid" aria-label="Score breakdown"><div><strong>${b.observation}/25</strong><span>Observation</span></div><div><strong>${b.analysis}/25</strong><span>Analysis</span></div><div><strong>${b.decision}/30</strong><span>Decision</span></div><div><strong>${b.communication}/20</strong><span>Communication</span></div></div><ul>${moduleNineState.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul><div class="m09-remediation"><strong>Model response boundary</strong><p>Current evidence confirms encryption on ws-173, an overlapping acct-173 session, and fs-02 service disruption. Stop active impact, preserve the selected facts, contain the affected entities, and restore service only after validation. Continue scoped monitoring instead of claiming the full environment is clean or naming an operator.</p></div></section>`;
}

function moduleNineInvestigation() {
  return `<section class="m09-workbench" aria-labelledby="m09-case-title"><div class="m09-casebar"><div><p class="m09-kicker">INC-4937 · Mission Next Labs · active ransomware slice</p><h3 id="m09-case-title" tabindex="-1">Operation Cedar Lock — encryption in progress</h3><p>Rapid encryption on ws-173 overlaps an unfamiliar acct-173 session and fs-02 service disruption. Decide what is confirmed, contain active impact, and hand off NIST-aligned next actions without overclaiming scope.</p></div><dl><div><dt>Assigned role</dt><dd>Tier 1 responder</dd></div><div><dt>Authority</dt><dd>Approved containment</dd></div><div><dt>Starting severity</dt><dd>Critical pending scope</dd></div></dl></div>
    <div class="m09-progress-row" aria-label="Investigation progress"><span><strong>${moduleNineState.reviewedSources.length}/3</strong> sources reviewed</span><span><strong>${moduleNineState.selectedEvidence.length}</strong> evidence records</span><span><strong>${moduleNineState.attempts || 0}</strong> scored attempts</span></div>
    ${moduleNineSourceTabs()}${moduleNineEvidenceTable(moduleNineState.activeSource)}${moduleNineEvidenceTray()}
    <details class="m09-hint" ${moduleNineState.hintsOpened.includes('correlation') ? 'open' : ''} data-m09-hint="correlation"><summary>Optional correlation hint</summary><p>Start with the process and persistence records. Then look for identity and network activity sharing both the same time window and incident entity. Keep known-good baselines out of the evidence set.</p></details>
  </section>`;
}

function moduleNineArtifact() {
  return `<form class="m09-artifact" id="m09-form" novalidate aria-labelledby="m09-artifact-title"><div class="m09-panel-heading"><div><p class="m09-kicker">Scored artifact · observation, analysis, decision, communication</p><h3 id="m09-artifact-title">Incident response record</h3></div><span>Pass ${MODULE_NINE_PASSING_SCORE}/100</span></div>
    <section class="m09-artifact-section" aria-labelledby="m09-analysis-title"><div class="m09-subheading"><span>1</span><div><h4 id="m09-analysis-title">Analyze the incident picture</h4><p>Use only what this isolated evidence slice supports.</p></div></div>
      ${moduleNineRadioGroup('classification', 'Incident classification', 'Connect the endpoint behavior and the unfamiliar session.', [
        { id: 'ransomware-impact', label: 'Active ransomware impact with identity overlap', help: 'Encryption, service disruption, and the overlapping session form one supported incident slice.' },
        { id: 'endpoint-only', label: 'Endpoint impact only; identity and service signals are unrelated', help: 'Ignores the timing and entity correlation.' },
        { id: 'benign', label: 'Benign maintenance activity', help: 'Does not explain the rapid encryption behavior.' },
      ])}
      ${moduleNineRadioGroup('scope', 'Defensible current scope', 'Separate confirmed entities from the unobserved wider environment.', [
        { id: 'bounded-three', label: 'ws-173 and acct-173 confirmed; fs-02 disruption observed; broader compromise is not established', help: 'Matches the assigned slice while retaining uncertainty beyond it.' },
        { id: 'fleet-wide', label: 'The full endpoint fleet and every identity are compromised', help: 'No evidence in this dataset supports that breadth.' },
        { id: 'none', label: 'No affected entities because the second payload was blocked', help: 'Prevention did not undo execution, persistence, or session activity.' },
      ])}
      ${moduleNineRadioGroup('severity', 'Response severity', 'Balance persistence and identity misuse against the demonstrated impact and scope.', [
        { id: 'critical-pending-scope', label: 'Critical pending scope — active encryption and service disruption', help: 'Requires immediate containment while the wider scope remains bounded and unproven.' },
        { id: 'critical', label: 'Critical — confirmed enterprise-wide destructive incident', help: 'Overstates scope.' },
        { id: 'low', label: 'Low — informational prevention event', help: 'Understates active impact.' },
      ])}
    </section>
    <section class="m09-artifact-section" aria-labelledby="m09-response-title"><div class="m09-subheading"><span>2</span><div><h4 id="m09-response-title">Build the response plan</h4><p>Select every justified action in each phase. Avoid both under-response and unsupported disruption.</p></div></div><div class="m09-response-grid">${moduleNineResponsePhase('contain', 'A', 'Contain', 'Limit active harm while preserving the case.')}${moduleNineResponsePhase('eradicate', 'B', 'Eradicate', 'Remove the demonstrated foothold and identity risk.')}${moduleNineResponsePhase('recover', 'C', 'Recover', 'Restore service only after clear validation conditions.')}</div>
      ${moduleNineRadioGroup('escalation', 'Escalation path', 'Your role may initiate approved actions, but specialist owners execute and validate the full response.', [
        { id: 'ir-owners', label: 'Escalate to the incident lead with endpoint and identity owners, evidence set, scope, and requested actions', help: 'Gives authorized responders a precise and reviewable starting point.' },
        { id: 'no-escalation', label: 'Do not escalate because this is only one user', help: 'Small scope does not make confirmed compromise safe.' },
        { id: 'public-notice', label: 'Publish an organization-wide breach notice immediately', help: 'This exceeds the evidence and Tier 1 authority.' },
      ])}
    </section>
    <section class="m09-artifact-section" aria-labelledby="m09-handoff-title"><div class="m09-subheading"><span>3</span><div><h4 id="m09-handoff-title">Communicate the handoff</h4><p>Write at least 140 characters. Name the incident state, entities, strongest evidence, containment request, and recovery condition.</p></div></div><label class="m09-note-label" for="m09-notes">Tier 1 response handoff</label><textarea id="m09-notes" name="notes" rows="7" maxlength="1000" aria-describedby="m09-note-help m09-note-count" placeholder="Incident state: … Confirmed scope: … Evidence: … Requested response: … Recovery condition: …">${esc(moduleNineState.notes)}</textarea><div class="m09-note-meta"><p id="m09-note-help">Observed facts first; clearly separate current scope from remaining uncertainty.</p><span id="m09-note-count">${moduleNineState.notes.length}/1000</span></div><details class="m09-hint" ${moduleNineState.hintsOpened.includes('handoff') ? 'open' : ''} data-m09-hint="handoff"><summary>Optional handoff checklist</summary><p>Conclusion → ws-173, acct-173, and fs-02 → encryption/service-stop/session evidence → preserve, isolate, revoke, stop impact → validate and monitor before recovery.</p></details></section>
    <div class="m09-actions"><button type="submit" class="m09-submit"><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Score response record</button><button type="button" class="m09-reset" data-m09-reset><i class="ri-restart-line" aria-hidden="true"></i> Reset only this lab</button></div>${moduleNineScorePanel()}
  </form>`;
}

function moduleNineDynamic() {
  return `${moduleNineInvestigation()}${moduleNineArtifact()}${moduleNineSecondLab()}`;
}

function moduleNineSecondLab() {
  const state = moduleNineSecondState || moduleNineSecondFreshDefaults();
  return `<section class="m09-workbench" aria-labelledby="m09-independent-title"><div class="m09-casebar"><div><p class="m09-kicker">Independent lab · 45 minutes · ${MODULE_NINE_INDEPENDENT_CASE.id}</p><h3 id="m09-independent-title">${esc(MODULE_NINE_INDEPENDENT_CASE.title)}</h3><p>${esc(MODULE_NINE_INDEPENDENT_CASE.summary)}</p></div><dl><div><dt>Role</dt><dd>Tier 1 responder</dd></div><div><dt>Authority</dt><dd>Preserve and recommend</dd></div><div><dt>Best action</dt><dd>Proportionate containment</dd></div></dl></div>
    <form class="m09-artifact" id="m09-independent-form" novalidate><div class="m09-panel-heading"><div><p class="m09-kicker">Fresh evidence slice · no answer path reused</p><h3>Make and explain the first response decision</h3></div><span>Pass 70/100</span></div>
      <fieldset class="m09-fieldset"><legend>Review the assigned records</legend><p class="m09-help">Select facts that support an immediate, bounded decision. The registered sign-in is context, not proof of compromise.</p><div class="m09-option-list">${MODULE_NINE_INDEPENDENT_CASE.records.map((record) => `<label><input type="checkbox" name="independentEvidence" value="${esc(record.id)}" ${state.selected.includes(record.id) ? 'checked' : ''} /><span><strong>${esc(record.label)}</strong><small>${esc(record.detail)}</small></span></label>`).join('')}</div></fieldset>
      ${moduleNineRadioGroupForState('independentClassification', 'Classification', 'Classify what the small slice supports.', [{ id: 'contain-investigate', label: 'Suspicious endpoint activity requiring containment and investigation', help: 'Preserves uncertainty while reducing active risk.' }, { id: 'confirmed-ransomware', label: 'Confirmed fleet-wide ransomware', help: 'Overstates the assigned evidence.' }, { id: 'benign', label: 'Benign backup maintenance', help: 'Does not explain the unsigned file-change activity.' }], state)}
      ${moduleNineRadioGroupForState('independentScope', 'Current scope', 'State what is established, not what is feared.', [{ id: 'ws-208-only', label: 'ws-208 is the only confirmed affected endpoint; wider scope unknown', help: 'Matches the bounded search.' }, { id: 'fleet-wide', label: 'All endpoints are affected', help: 'No evidence supports this.' }, { id: 'none', label: 'No response is needed', help: 'The endpoint behavior merits action.' }], state)}
      ${moduleNineRadioGroupForState('independentAction', 'First action', 'Choose the least disruptive action that limits active risk and protects evidence.', [{ id: 'isolate-preserve', label: 'Isolate ws-208 and preserve the assigned records before deeper changes', help: 'Proportionate first action.' }, { id: 'wipe-immediately', label: 'Wipe ws-208 immediately', help: 'May destroy evidence and exceeds the first-response need.' }, { id: 'wait', label: 'Wait for another alert', help: 'Leaves possible active impact uncontained.' }], state)}
      ${moduleNineRadioGroupForState('independentEscalation', 'Escalation', 'Name the accountable owner for the next decision.', [{ id: 'lead-owner', label: 'Escalate to the incident lead and endpoint/backup owners', help: 'Connects response authority to the affected services.' }, { id: 'no-escalation', label: 'Close as a false positive', help: 'Not supported by the evidence.' }, { id: 'public-notice', label: 'Publish a breach notice', help: 'Beyond this evidence and role.' }], state)}
      <label class="m09-note-label" for="m09-independent-notes">Independent handoff (minimum 100 characters)</label><textarea id="m09-independent-notes" name="independentNotes" rows="5" minlength="100" maxlength="800" placeholder="Observed facts: … Scope: … First action: … Owner and next decision: …">${esc(state.notes)}</textarea>
      <div class="m09-actions"><button type="submit" class="m09-submit">Score independent decision</button><button type="button" class="m09-reset" data-m09-independent-reset>Reset independent lab</button></div>${moduleNineSecondScorePanel()}</form></section>`;
}

function moduleNineRadioGroupForState(name, legend, help, options, state) {
  return `<fieldset class="m09-fieldset"><legend>${esc(legend)}</legend><p class="m09-help">${esc(help)}</p><div class="m09-option-list">${options.map((option) => `<label><input type="radio" name="${esc(name)}" value="${esc(option.id)}" ${state[name] === option.id ? 'checked' : ''} /><span><strong>${esc(option.label)}</strong><small>${esc(option.help)}</small></span></label>`).join('')}</div></fieldset>`;
}

function moduleNineSecondScorePanel() {
  const state = moduleNineSecondState;
  if (!state.attempts) return '<div class="m09-score-empty">Your independent decision is saved locally. Submit when the handoff is ready.</div>';
  const passed = state.score >= 70;
  return `<section class="m09-score ${passed ? 'is-pass' : 'is-remediate'}" tabindex="-1" aria-live="polite"><h3>${state.score}/100 — ${passed ? 'Independent decision accepted' : 'Revise the decision'}</h3><ul>${state.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></section>`;
}

function moduleNineSecondScore() {
  const state = moduleNineSecondState;
  const evidence = state.selected.length === 3 && ['M09-B01', 'M09-B03', 'M09-B04'].every((id) => state.selected.includes(id)) ? 25 : 0;
  const decision = state.independentClassification === 'contain-investigate' ? 20 : 0;
  const scope = state.independentScope === 'ws-208-only' ? 20 : 0;
  const action = state.independentAction === 'isolate-preserve' ? 20 : 0;
  const escalation = state.independentEscalation === 'lead-owner' ? 5 : 0;
  const note = state.notes.trim().toLowerCase();
  const communication = note.length >= 100 && /ws-208/.test(note) && /(isolate|preserv)/.test(note) && /(owner|lead|escalat)/.test(note) ? 10 : 0;
  return { score: evidence + decision + scope + action + escalation + communication, feedback: [evidence ? 'Evidence: selected the impact, scope, and search-boundary records.' : 'Evidence: select M09-B01, M09-B03, and M09-B04; keep the normal sign-in as context.', decision ? 'Classification: treated suspicious endpoint activity as requiring containment and investigation.' : 'Classification: do not call this fleet-wide ransomware from this slice.', scope ? 'Scope: bounded the confirmed endpoint and kept the wider environment unknown.' : 'Scope: state the one confirmed endpoint and the search boundary.', action ? 'First action: isolate and preserve before deeper changes.' : 'First action: choose proportionate isolation and preservation.', escalation ? 'Escalation: named the incident lead and endpoint/backup owners.' : 'Escalation: route to accountable response owners.', communication ? 'Handoff: identifies observations, scope, action, and owner.' : 'Handoff: write at least 100 characters with ws-208, preservation/isolation, and an owner.'] };
}

function viewModuleNine(user, program) {
  moduleNineLoad(user);
  const module = program.modules['soc-09'];
  const sections = moduleNineGetSections();
  const lectureOpen = moduleNineReviewMode || !sections[0].isComplete;
  const quizOpen = moduleNineReviewMode || (moduleNineQuizState && !moduleNineQuizState.passed);
  const labOpen = moduleNineReviewMode || !sections[2].isComplete;
  const reviewOpen = moduleNineReviewMode;

  return `<div class="m09-shell">
    ${moduleTopbar(user, program)}
    ${moduleProgressShell(sections, { reviewMode: moduleNineReviewMode })}
    <main class="m09-main">
      <section class="m09-hero" aria-labelledby="m09-title"><div><p class="m09-kicker">Module 09 · ${formatInstructionalMinutes(module.durationMinutes)} · operations &amp; response</p><h1 id="m09-title">${esc(module.title)}</h1><p>Correlate a limited incident slice, decide what it proves, and build a containment-to-recovery plan that matches the verified scope.</p><a class="m09-primary" href="#m09-lecture"><i class="ri-book-open-line" aria-hidden="true"></i> Review the response guide</a></div><dl aria-label="Saved lab progress"><div><dt>Evidence sources</dt><dd>3</dd></div><div><dt>Instructional time</dt><dd>${formatInstructionalMinutes(MODULE_NINE_CATALOG_MODULE.instructionalMinutes)}</dd></div><div><dt>Lab status</dt><dd id="m09-status">${moduleNineState.completed ? 'Complete' : moduleNineState.attempts ? 'In progress' : 'Not started'}</dd></div></dl></section>

      <details class="m09-section-collapsible" ${lectureOpen ? 'open' : ''}>
        <summary class="m09-section"><div class="m09-section-heading"><span class="m09-section-badge">1</span><div><p class="m09-kicker">Lecture</p><h2 id="m09-lecture">Incident response principles: correlation, scope, and proportionate action</h2></div></div></summary>
        <div class="m09-section-body">
          <section class="m09-section" id="m09-field-guide" aria-labelledby="m09-guide-title"><div class="m09-section-heading"><span>a</span><div><p class="m09-kicker">Response guide</p><h3 id="m09-guide-title">Act on evidence, not urgency alone</h3></div></div>${moduleNineScenarioLoop()}${moduleNineConcepts()}</section>
          ${moduleNineVideoScript()}
        </div>
      </details>

      <details class="m09-section-collapsible" ${quizOpen ? 'open' : ''}>
        <summary class="m09-section"><div class="m09-section-heading"><span class="m09-section-badge">2</span><div><p class="m09-kicker">Knowledge Check</p><h2 id="m09-knowledge-check">Test your understanding of incident response principles</h2></div></div></summary>
        <div class="m09-section-body">
          ${moduleNineQuizPanel()}
        </div>
      </details>

      <details class="m09-section-collapsible" ${labOpen ? 'open' : ''}>
        <summary class="m09-section"><div class="m09-section-heading"><span class="m09-section-badge">3</span><div><p class="m09-kicker">Incident Response Labs</p><h2 id="m09-lab">Active ransomware response · INC-4937</h2></div></div></summary>
        <div class="m09-section-body">
          <div class="m09-role"><i class="ri-user-settings-line" aria-hidden="true"></i><div><strong>Your role: Tier 1 incident responder</strong><p>Investigate the three sources in any order. You may initiate playbook-approved containment and recommend later phases; the incident lead and system owners retain execution authority.</p></div></div>
          <div id="m09-lab-dynamic">${moduleNineDynamic()}</div>
        </div>
      </details>

      <details class="m09-section-collapsible" ${reviewOpen ? 'open' : ''}>
        <summary class="m09-section"><div class="m09-section-heading"><span class="m09-section-badge">4</span><div><p class="m09-kicker">Module Review</p><h2 id="m09-review">Key concepts and takeaways</h2></div></div></summary>
        <div class="m09-section-body">${moduleNineReview()}</div>
      </details>

      <details class="m09-section-collapsible" ${moduleNineReviewMode ? 'open' : ''}>
        <summary class="m09-section"><div class="m09-section-heading"><span class="m09-section-badge">5</span><div><p class="m09-kicker">Sources &amp; Further Reading</p><h2 id="m09-sources">Authoritative references</h2></div></div></summary>
        <div class="m09-section-body">${moduleSourcesBlock(MODULE_NINE_SOURCES_LIST)}</div>
      </details>
    </main>
  </div>`;
}

function moduleNineSelectionScore(selected, expected, points) {
  const chosen = new Set(selected);
  const correct = expected.filter((id) => chosen.has(id)).length;
  const extras = selected.filter((id) => !expected.includes(id)).length;
  return Math.max(0, Math.round((correct / expected.length) * points) - extras * Math.ceil(points / expected.length));
}

function moduleNineScore() {
  const sources = moduleNineState.reviewedSources.filter((key) => MODULE_NINE_SOURCES[key]).length === 3 ? 6 : moduleNineState.reviewedSources.filter((key) => MODULE_NINE_SOURCES[key]).length * 2;
  const evidence = moduleNineSelectionScore(moduleNineState.selectedEvidence, MODULE_NINE_EXPECTED_EVIDENCE, 19);
  const observation = sources + evidence;
  const classification = moduleNineState.classification === 'ransomware-impact' ? 9 : 0;
  const scope = moduleNineState.scope === 'bounded-three' ? 8 : 0;
  const severity = moduleNineState.severity === 'critical-pending-scope' ? 8 : 0;
  const analysis = classification + scope + severity;
  const contain = moduleNineSelectionScore(moduleNineState.responsePlan.contain, ['isolate-ws173', 'revoke-disable-acct173', 'segment-fs02'], 11);
  const eradicate = moduleNineSelectionScore(moduleNineState.responsePlan.eradicate, ['stop-encryption', 'reset-credentials', 'restore-service'], 7);
  const recover = moduleNineSelectionScore(moduleNineState.responsePlan.recover, ['validate-reconnect', 'monitored-reenable'], 9);
  const escalation = moduleNineState.escalation === 'ir-owners' ? 3 : 0;
  const decision = contain + eradicate + recover + escalation;
  const note = moduleNineState.notes.trim().toLowerCase();
  const noteLength = note.length >= 140 ? 4 : 0;
  const noteConclusion = /(confirm|compromis|incident|high)/.test(note) ? 4 : 0;
  const noteEntities = /ws-173/.test(note) && /acct-173/.test(note) && /fs-02/.test(note) ? 4 : 0;
  const noteEvidence = /(encrypt|ransom|service|session|m09-e0|203\.0\.113\.173)/.test(note) ? 4 : 0;
  const noteContain = /(isolat|revoke|disable|contain|block)/.test(note) ? 2 : 0;
  const noteRecover = /(validat|monitor|reconnect|re-enable|reenable|recover)/.test(note) ? 2 : 0;
  const communication = noteLength + noteConclusion + noteEntities + noteEvidence + noteContain + noteRecover;
  const score = observation + analysis + decision + communication;
  return {
    score,
    breakdown: { observation, sources, evidence, analysis, classification, scope, severity, decision, contain, eradicate, recover, escalation, communication },
    feedback: [
      evidence === 19 && sources === 6 ? 'Observation: All three sources reviewed; the selected records establish encryption impact, identity overlap, service disruption, and bounded scope.' : `Observation: ${observation}/25. Review all sources and select the M09-E records that establish impact, identity overlap, service disruption, and scope; benign context is not incident proof.`,
      analysis === 25 ? 'Analysis: Correctly classified the active ransomware impact, identity overlap, and bounded entities without inventing enterprise-wide scope.' : `Analysis: ${analysis}/25. Connect ws-173, acct-173, and the fs-02 service signal while avoiding unsupported enterprise-wide claims.`,
      decision === 30 ? 'Decision: The plan proportionately contains the pair, removes the foothold and credential risk, validates recovery, and escalates to authorized owners.' : `Decision: ${decision}/30. Choose the three scoped containment actions, two eradication actions, two conditional recovery actions, and the incident-lead escalation.`,
      communication === 20 ? 'Communication: The handoff is complete, evidence-based, scoped, and operationally actionable.' : `Communication: ${communication}/20. In 140+ characters, name INC-4937, ws-173, acct-173, fs-02, evidence, containment, and a monitored recovery condition.`,
    ],
  };
}

function moduleNineRender(focusId) {
  const root = document.getElementById('m09-lab-dynamic');
  if (!root) return;
  root.innerHTML = moduleNineDynamic();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function moduleNineRenderQuiz() {
  const root = document.getElementById('m09-quiz-form');
  if (!root) return;
  const formHtml = moduleNineQuizPanel();
  // Parse the form from the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = formHtml;
  const newForm = tempDiv.querySelector('form') || tempDiv.querySelector('div');
  root.innerHTML = newForm.innerHTML;
}

function moduleNineToggleValue(list, value, checked) {
  return checked ? [...new Set([...list, value])] : list.filter((item) => item !== value);
}

function moduleNineScoreQuiz() {
  if (!moduleNineQuizState?.selectedQuestions || moduleNineQuizState.selectedQuestions.length === 0) {
    return null;
  }
  const result = scoreQuizAttempt(moduleNineQuizState.selectedQuestions, moduleNineQuizState.questionsByAnswer, moduleNineQuizState.answers);
  return result;
}

function wireModuleNineQuiz() {
  const quizForm = document.getElementById('m09-quiz-form');
  if (!quizForm) return;

  // Event delegation for answers (radio buttons in quiz)
  quizForm.addEventListener('change', (event) => {
    const input = event.target;
    if (input.name?.startsWith('q-') && input.type === 'radio') {
      const questionId = input.name.replace('q-', '');
      moduleNineQuizState.answers[questionId] = input.value;
      moduleNineRenderQuiz();
    }
  });

  // Event delegation for submit
  quizForm.addEventListener('submit', (event) => {
    if (event.target.classList.contains('m09-quiz-form')) {
      event.preventDefault();
      const result = moduleNineScoreQuiz();
      if (!result) return;

      moduleNineQuizState.scored = true;
      moduleNineQuizState.attempts += 1;
      moduleNineQuizState.score = result.score;
      moduleNineQuizState.bestScore = Math.max(moduleNineQuizState.bestScore || 0, result.score);
      moduleNineQuizState.feedback = result.feedback;
      moduleNineQuizState.passed = result.score >= 70;
      moduleNineQuizState.lastQuizQuestionIds = moduleNineQuizState.selectedQuestions.map((sel) => sel.question.id);

      moduleNineRenderQuiz();
    }
  });

  // Event delegation for retry button - CRITICAL: use event delegation, not one-time querySelector
  quizForm.addEventListener('click', (event) => {
    if (!event.target.closest('[data-m09-quiz-retry]')) return;
    // Reset quiz state and select new questions
    const previousQuestionIds = moduleNineQuizState.lastQuizQuestionIds || [];
    const selection = selectQuizQuestions(MODULE_NINE_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    moduleNineQuizState = {
      selectedQuestions: selection.selectedQuestions,
      questionsByAnswer: selection.questionsByAnswer,
      answers: {},
      scored: false,
      attempts: moduleNineQuizState.attempts,
      score: moduleNineQuizState.score,
      bestScore: moduleNineQuizState.bestScore,
      feedback: [],
      passed: moduleNineQuizState.passed,
    };
    moduleNineRenderQuiz();
  });
}

function wireModuleNineLab() {
  const root = document.getElementById('m09-lab-dynamic');
  if (!root || !moduleNineState) return;
  root.addEventListener('keydown', (event) => {
    const tab = event.target.closest('[data-m09-source]');
    if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const keys = Object.keys(MODULE_NINE_SOURCES);
    const current = Math.max(0, keys.indexOf(tab.dataset.m09Source));
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? keys.length - 1
      : (current + (event.key === 'ArrowRight' ? 1 : -1) + keys.length) % keys.length;
    moduleNineState.activeSource = keys[next];
    moduleNineState.detailEvidence = '';
    moduleNineSave();
    moduleNineRender(`m09-tab-${keys[next]}`);
  });
  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-m09-independent-reset]')) {
      moduleNineSecondState = LabRuntime.reset(MODULE_NINE_SECOND_LAB_ID, moduleNineUser, moduleNineSecondFreshDefaults());
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleNineUser, 'soc-analyst', 'soc-09', 'lab-independent-response', false);
      moduleNineRender('m09-independent-title');
      return;
    }
    const sourceButton = event.target.closest('[data-m09-source]');
    if (sourceButton) {
      moduleNineState.activeSource = sourceButton.dataset.m09Source;
      moduleNineState.detailEvidence = '';
      moduleNineSave();
      moduleNineRender('m09-source-title');
      return;
    }
    const reviewButton = event.target.closest('[data-m09-review]');
    if (reviewButton) {
      const key = reviewButton.dataset.m09Review;
      if (!moduleNineState.reviewedSources.includes(key)) moduleNineState.reviewedSources.push(key);
      moduleNineSave();
      moduleNineRender('m09-source-title');
      return;
    }
    const detailButton = event.target.closest('[data-m09-detail]');
    if (detailButton) {
      moduleNineState.detailEvidence = moduleNineState.detailEvidence === detailButton.dataset.m09Detail ? '' : detailButton.dataset.m09Detail;
      moduleNineSave();
      moduleNineRender(moduleNineState.detailEvidence ? 'm09-evidence-detail' : 'm09-source-title');
      return;
    }
    if (event.target.closest('[data-m09-detail-close]')) {
      moduleNineState.detailEvidence = '';
      moduleNineSave();
      moduleNineRender('m09-source-title');
      return;
    }
    const remove = event.target.closest('[data-m09-remove-evidence]');
    if (remove) {
      moduleNineState.selectedEvidence = moduleNineState.selectedEvidence.filter((id) => id !== remove.dataset.m09RemoveEvidence);
      moduleNineSave();
      moduleNineRender('m09-tray-title');
      return;
    }
    if (event.target.closest('[data-m09-reset]')) {
      if (typeof window.confirm === 'function' && !window.confirm('Reset only this Module 09 lab? Your evidence, plan, notes, and score will be cleared.')) return;
      moduleNineState = LabRuntime.reset(MODULE_NINE_LAB_ID, moduleNineUser, moduleNineFreshDefaults());
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleNineUser, 'soc-analyst', 'soc-09', MODULE_NINE_CATALOG_LAB_KEY, false);
      moduleNineRender('m09-case-title');
      const status = document.getElementById('m09-status');
      if (status) status.textContent = 'Not started';
    }
  });

  root.addEventListener('toggle', (event) => {
    const hint = event.target.closest('[data-m09-hint]');
    if (!hint || !hint.open) return;
    moduleNineState.hintsOpened = [...new Set([...moduleNineState.hintsOpened, hint.dataset.m09Hint])];
    moduleNineSave();
  }, true);

  root.addEventListener('input', (event) => {
    if (event.target.name === 'independentNotes') {
      moduleNineSecondState.notes = event.target.value;
      LabRuntime.save(MODULE_NINE_SECOND_LAB_ID, moduleNineUser, moduleNineSecondState);
      return;
    }
    if (event.target.name !== 'notes') return;
    moduleNineState.notes = event.target.value;
    const count = root.querySelector('#m09-note-count');
    if (count) count.textContent = `${event.target.value.length}/1000`;
    moduleNineSave();
  });

  root.addEventListener('change', (event) => {
    const input = event.target;
    if (input.closest('#m09-independent-form')) {
      if (input.name === 'independentEvidence') moduleNineSecondState.selected = moduleNineToggleValue(moduleNineSecondState.selected, input.value, input.checked);
      else if (['independentClassification', 'independentScope', 'independentEscalation', 'independentAction'].includes(input.name)) moduleNineSecondState[input.name] = input.value;
      LabRuntime.save(MODULE_NINE_SECOND_LAB_ID, moduleNineUser, moduleNineSecondState);
      return;
    }
    if (input.name === 'evidence') {
      moduleNineState.selectedEvidence = moduleNineToggleValue(moduleNineState.selectedEvidence, input.value, input.checked);
      moduleNineState.validationError = '';
      moduleNineSave();
      const count = root.querySelector('#m09-evidence-count');
      if (count) count.textContent = String(moduleNineState.selectedEvidence.length);
      return;
    }
    if (['classification', 'scope', 'severity', 'escalation'].includes(input.name)) {
      moduleNineState[input.name] = input.value;
      moduleNineState.validationError = '';
      moduleNineSave();
      return;
    }
    const responseMatch = input.name.match(/^response-(contain|eradicate|recover)$/);
    if (responseMatch) {
      const phase = responseMatch[1];
      moduleNineState.responsePlan[phase] = moduleNineToggleValue(moduleNineState.responsePlan[phase], input.value, input.checked);
      moduleNineState.validationError = '';
      moduleNineSave();
    }
  });

  root.addEventListener('submit', (event) => {
    if (event.target.id === 'm09-independent-form') {
      event.preventDefault();
      moduleNineSecondState.notes = event.target.elements.independentNotes.value;
      const result = moduleNineSecondScore();
      moduleNineSecondState.attempts += 1;
      moduleNineSecondState.score = result.score;
      moduleNineSecondState.feedback = result.feedback;
      if (result.score >= 70) {
        moduleNineSecondState.completed = true;
        if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleNineUser, 'soc-analyst', 'soc-09', 'lab-independent-response');
      }
      LabRuntime.save(MODULE_NINE_SECOND_LAB_ID, moduleNineUser, moduleNineSecondState);
      moduleNineRender('m09-independent-title');
      return;
    }
    if (event.target.id !== 'm09-form') return;
    event.preventDefault();
    moduleNineState.notes = event.target.elements.notes.value;
    const missing = [];
    if (moduleNineState.reviewedSources.length < 3) missing.push('review all three evidence sources');
    if (moduleNineState.selectedEvidence.length < 4) missing.push('select at least four evidence records');
    if (!moduleNineState.classification || !moduleNineState.scope || !moduleNineState.severity) missing.push('complete the incident analysis');
    if (Object.values(moduleNineState.responsePlan).some((items) => !items.length)) missing.push('choose at least one action in every response phase');
    if (!moduleNineState.escalation) missing.push('select an escalation path');
    if (moduleNineState.notes.trim().length < 140) missing.push('write a 140-character handoff');
    if (missing.length) {
      moduleNineState.validationError = `Please ${missing.join('; ')}. Your current work remains saved.`;
      moduleNineSave();
      moduleNineRender('m09-feedback');
      return;
    }
    const result = moduleNineScore();
    moduleNineState.attempts += 1;
    moduleNineState.score = result.score;
    moduleNineState.bestScore = Math.max(moduleNineState.bestScore || 0, result.score);
    moduleNineState.breakdown = result.breakdown;
    moduleNineState.feedback = result.feedback;
    moduleNineState.validationError = '';
    moduleNineState.lastSubmittedAt = new Date().toISOString();
    const passed = result.score >= MODULE_NINE_PASSING_SCORE;
    if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(moduleNineUser, MODULE_NINE_CATALOG_LAB_KEY, {
        state: passed ? 'complete' : 'in_progress',
        score: result.score,
        result: { breakdown: result.breakdown, feedback: result.feedback, attempts: moduleNineState.attempts },
      });
    }
    if (passed) {
      moduleNineState.completed = true;
      if (!moduleNineState.flags.includes(MODULE_NINE_FLAG)) moduleNineState.flags.push(MODULE_NINE_FLAG);
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleNineUser, 'soc-analyst', 'soc-09', MODULE_NINE_CATALOG_LAB_KEY);
    }
    moduleNineSave();
    moduleNineRender('m09-feedback');
    const status = document.getElementById('m09-status');
    if (status) status.textContent = moduleNineState.completed ? 'Complete' : 'In progress';
  });
}

function wireModuleNine() {
  // Wire the review toggle button
  const reviewToggle = document.querySelector('[data-mnav-review-toggle]');
  if (reviewToggle) {
    reviewToggle.addEventListener('click', () => {
      moduleNineReviewMode = !moduleNineReviewMode;
      const isOpen = moduleNineReviewMode;
      reviewToggle.setAttribute('aria-pressed', isOpen);
      reviewToggle.querySelector('i').className = isOpen ? 'ri-close-line' : 'ri-file-list-line';
      const label = reviewToggle.querySelector('span');
      if (label) label.textContent = isOpen ? 'Close review' : 'Review module';
      document.querySelectorAll('.m09-section-collapsible').forEach((details) => {
        if (isOpen) details.setAttribute('open', '');
        else details.removeAttribute('open');
      });
    });
  }
  // Wire quiz and lab components
  wireModuleNineQuiz();
  wireModuleNineLab();
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 9, moduleKey: 'soc-09', view: viewModuleNine, wire: wireModuleNine });
