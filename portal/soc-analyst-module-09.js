/* Module 09 — semi-independent incident response.
 * All people, systems, addresses, and evidence are synthetic and browser-local.
 */

const MODULE_NINE_LAB_ID = 'm09-proportional-response-v1';
const MODULE_NINE_FLAG = 'M09-INCIDENT-RESPONSE-COMPLETE';
const MODULE_NINE_CATALOG_LAB_KEY = 'lab-active-incident';
const MODULE_NINE_PASSING_SCORE = 70;
const MODULE_NINE_CATALOG_MODULE = LABS.find((item) => item.key === MODULE_NINE_CATALOG_LAB_KEY);
const MODULE_NINE_LIFECYCLE_PHASES = [
  { id: 'prepare', icon: 'ri-tools-line', title: 'Prepare', description: 'Define roles, logging, playbooks, access, communications, and backups before an incident.' },
  { id: 'detect-analyze', icon: 'ri-search-eye-line', title: 'Detect & analyze', description: 'Validate the signal, determine what happened, estimate scope and impact, and declare an incident when warranted.' },
  { id: 'contain', icon: 'ri-shield-keyhole-line', title: 'Contain', description: 'Limit harm-for example, revoke a session or isolate a device-under an approved playbook.' },
  { id: 'eradicate', icon: 'ri-delete-bin-6-line', title: 'Eradicate', description: 'Remove the cause and attacker foothold, such as malware, persistence, or stolen credentials.' },
  { id: 'recover', icon: 'ri-refresh-line', title: 'Recover', description: 'Restore normal operations carefully, monitor for recurrence, and confirm controls are working.' },
  { id: 'learn', icon: 'ri-lightbulb-flash-line', title: 'Learn', description: 'Capture lessons, improve detections and playbooks, and assign follow-up actions.' },
];

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

// Prove It case — the standard ticket for INC-4937, authored from the same
// evidence contract above (ws-173 / acct-173 / fs-02). Classification and
// scope keep the module's original analysis decisions as ticket findings;
// the response-plan phases render as findingsHtml; escalation replaces the
// old escalation-path radio with the standard Escalation required + Route
// to Department fields.
const MODULE_NINE_ENTITY_ROSTER = {
  users: [
    { id: 'acct-173', tier: 'principal' },
    { id: 'svc-backup', tier: 'pivot' },
    { id: 'acct-045', tier: 'noise' },
    { id: 'acct-220', tier: 'noise' },
    { id: 'acct-338', tier: 'noise' },
    { id: 'guest-311', tier: 'noise' },
  ],
  devices: [
    { id: 'ws-173', tier: 'principal' },
    { id: 'fs-02', tier: 'pivot' },
    { id: 'ws-054', tier: 'noise' },
    { id: 'ws-311', tier: 'noise' },
    { id: 'print-08', tier: 'noise' },
    { id: 'db-02', tier: 'noise' },
  ],
};
const MODULE_NINE_DEPARTMENT_OPTIONS = [
  { id: 'ir-lead-owners', text: 'Incident Lead + Endpoint/Identity Owners', fit: 100, note: 'Authorized to execute eradication and validate recovery.' },
  { id: 'service-desk', text: 'Service Desk (no incident escalation)', fit: 15, note: 'Not equipped for active ransomware response.', bounce: 'Returned — active encryption and an unauthorized session require incident-lead escalation, not the service desk.' },
  { id: 'exec-comms', text: 'Executive Communications (public breach notice)', fit: 5, note: 'Exceeds Tier 1 authority before scope is validated.', bounce: 'Returned — a public notice exceeds Tier 1 authority and the currently bounded scope.' },
];
const MODULE_NINE_CLASSIFICATION_OPTIONS = [
  { id: 'ransomware-impact', text: 'Active ransomware impact with identity overlap' },
  { id: 'endpoint-only', text: 'Endpoint impact only; identity and service signals are unrelated' },
  { id: 'benign', text: 'Benign maintenance activity' },
];
const MODULE_NINE_SCOPE_OPTIONS = [
  { id: 'bounded-three', text: 'ws-173 and acct-173 confirmed; fs-02 disruption observed; broader compromise is not established' },
  { id: 'fleet-wide', text: 'The full endpoint fleet and every identity are compromised' },
  { id: 'none', text: 'No affected entities because the second payload was blocked' },
];
// Answer key — kept in module data, never shown live in Prove It.
const MODULE_NINE_ANSWER_KEY = { severity: 'critical', disposition: 'true-positive', escalateTo: 'ir-lead-owners', classification: 'ransomware-impact', scope: 'bounded-three' };

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

let moduleNineState = null;
let moduleNineUser = null;
let moduleNineQuizState = null;
// Set when the learner explicitly asks to retake a knowledge check that the
// account already records as passed (see moduleNineQuizVerifiedElsewhere()).
let moduleNineQuizForceRetake = false;
let moduleNineReviewMode = false;

function moduleNineFreshDefaults() {
  return {
    activeSource: 'endpoint',
    reviewedSources: [],
    selectedEvidence: [],
    detailEvidence: '',
    hintsOpened: [],
    responsePlan: { contain: [], eradicate: [], recover: [] },
    lastSubmittedAt: '',
    practiceComplete: false,
    practiceNotes: '',
    labProgress: {},
    caseRecord: { status: '', affectedUser: '', affectedDevice: '', severity: '', disposition: '', escalation: '', escalateTo: '', notes: '', findings: {}, submitted: false, submittedAt: '', actionHistory: [] },
  };
}

function moduleNineLoad(user) {
  if (moduleNineUser?.email !== user?.email) moduleNineQuizForceRetake = false;
  moduleNineUser = user;
  const defaults = moduleNineFreshDefaults();
  moduleNineState = LabRuntime.loadCaseState(MODULE_NINE_LAB_ID, 'soc-09', user, defaults);
  ['reviewedSources', 'selectedEvidence', 'hintsOpened', 'feedback', 'flags'].forEach((key) => {
    if (!Array.isArray(moduleNineState[key])) moduleNineState[key] = [];
  });
  moduleNineState.responsePlan = { ...defaults.responsePlan, ...(moduleNineState.responsePlan || {}) };
  Object.keys(defaults.responsePlan).forEach((phase) => {
    if (!Array.isArray(moduleNineState.responsePlan[phase])) moduleNineState.responsePlan[phase] = [];
  });
  if (!MODULE_NINE_SOURCES[moduleNineState.activeSource]) moduleNineState.activeSource = 'endpoint';
  if (typeof moduleNineState.practiceNotes !== 'string') moduleNineState.practiceNotes = '';
  if (!moduleNineState.labProgress || typeof moduleNineState.labProgress !== 'object') moduleNineState.labProgress = {};
  // Backward compat: a pre-case-record attempt kept classification/scope/
  // severity/escalation/notes as top-level fields. Preserve a passed
  // attempt as an already-submitted ITSM ticket (Lab Under Review / Lab
  // Graded, never reset); carry over the still-valid classification/scope
  // finding ids and notes text. A never-passed in-progress attempt starts
  // fresh on the standard ticket rather than guessing at unmappable old
  // severity/escalation ids.
  if (!moduleNineState.caseRecord || typeof moduleNineState.caseRecord !== 'object') {
    const wasSubmitted = Boolean(moduleNineState.completed);
    moduleNineState.caseRecord = {
      status: '', affectedUser: '', affectedDevice: '', severity: '', disposition: '', escalation: '', escalateTo: '',
      notes: moduleNineState.notes || '',
      findings: {
        ...(moduleNineState.classification ? { classification: moduleNineState.classification } : {}),
        ...(moduleNineState.scope ? { scope: moduleNineState.scope } : {}),
      },
      submitted: wasSubmitted, submittedAt: moduleNineState.lastSubmittedAt || '', actionHistory: [],
    };
  }
  ['status', 'affectedUser', 'affectedDevice', 'severity', 'disposition', 'escalation', 'escalateTo', 'notes'].forEach((key) => {
    if (typeof moduleNineState.caseRecord[key] !== 'string') moduleNineState.caseRecord[key] = '';
  });
  if (!moduleNineState.caseRecord.findings || typeof moduleNineState.caseRecord.findings !== 'object') moduleNineState.caseRecord.findings = {};
  if (!Array.isArray(moduleNineState.caseRecord.actionHistory)) moduleNineState.caseRecord.actionHistory = [];
  if (typeof moduleNineState.caseRecord.submitted !== 'boolean') moduleNineState.caseRecord.submitted = Boolean(moduleNineState.completed);
  // A returned attempt must not stay permanently unsubmittable.
  if (moduleNineProveItRedoRequested() && moduleNineState.caseRecord.submitted === true) {
    moduleNineState.caseRecord.submitted = false;
    moduleNineState.caseRecord.submittedAt = '';
    moduleNineSave();
  }

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
  if (moduleNineUser && moduleNineState) LabRuntime.saveCaseState(MODULE_NINE_LAB_ID, 'soc-09', moduleNineUser, moduleNineState);
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
    { id: 'guided-lab', title: 'Guided Lab', type: 'lab', isComplete: moduleNineState.practiceComplete, scrollId: 'm09-guided-lab' },
    { id: 'assessment-lab', title: 'Assessment Lab', type: 'review', isComplete: moduleNineState.completed, scrollId: 'm09-lab' },
    { id: 'review', title: 'Module Review', type: 'review', isComplete: true, scrollId: 'm09-review' },
    { id: 'sources', title: 'Sources & Further Reading', type: 'read', isComplete: null, scrollId: 'm09-sources', gated: false, supplemental: true },
  ];
}

function moduleNineGetQuickNavItems() {
  const sections = moduleNineGetSections();
  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    kind: section.type,
    isComplete: section.isComplete,
    scrollId: section.scrollId,
  }));
}

function moduleNineConcepts() {
  const cards = [
    ['ri-link-m', 'Correlate before acting', 'Connect time, entity, behavior, and source. A shared address is useful only when the surrounding activity supports the relationship.'],
    ['ri-focus-2-line', 'Bound impact and uncertainty', 'State what is confirmed, what is not observed, and what this limited dataset cannot prove. Scope controls response size.'],
    ['ri-shield-check-line', 'Respond in phases', 'Contain active harm, eradicate the foothold, then recover carefully. Preserve evidence and stay within approved authority.'],
    ['ri-file-list-3-line', 'Leave an actionable handoff', 'Record incident state, exact entities, strongest evidence, actions requested, and the condition that permits recovery.'],
  ];
  return `<div class="m09-concept-grid">${cards.map((card) => `<article><i class="${esc(card[0])}" aria-hidden="true"></i><h3>${esc(card[1])}</h3><p>${esc(card[2])}</p></article>`).join('')}</div>
    <div class="m09-lifecycle-companion" id="m09-lifecycle" aria-labelledby="m09-lifecycle-title">
      <p class="m09-companion-label"><i class="ri-cycle-line" aria-hidden="true"></i> The response map</p>
      <h3 class="m09-companion-title" id="m09-lifecycle-title">Incident response lifecycle, visualized</h3>
      <p class="m09-instruction">Frameworks group or name phases differently. This six-part model shows the complete operational idea used in day-to-day response work. Select each phase to rotate the lifecycle and open its definition.</p>
      <div class="m09-lifecycle-wheel" style="--wheel-rotation: 0deg" data-m09-lifecycle-wheel>
        <div class="m09-wheel-track" aria-hidden="true">
          ${MODULE_NINE_LIFECYCLE_PHASES.map((phase, index) => `<span style="--wheel-step: ${index}"><i class="ri-arrow-right-s-line"></i></span>`).join('')}
          <div class="m09-wheel-hub">
            <i class="ri-cycle-line"></i>
            <strong>Incident response</strong>
            <small data-m09-hub-phase>Phase 1 · ${esc(MODULE_NINE_LIFECYCLE_PHASES[0].title)}</small>
          </div>
        </div>
        <ol class="m09-lifecycle" aria-label="Incident response phases">
          ${MODULE_NINE_LIFECYCLE_PHASES.map((phase, index) => `<li class="${index === 0 ? 'is-active' : ''}" data-m09-phase-card="${index}">
            <button type="button" class="m09-phase-button" data-m09-phase="${index}"
                    aria-expanded="${index === 0 ? 'true' : 'false'}" aria-controls="m09-phase-detail-${esc(phase.id)}">
              <span class="m09-phase-heading"><span>${index + 1}</span><i class="${esc(phase.icon)}" aria-hidden="true"></i><span class="m09-phase-title">${esc(phase.title)}</span><i class="ri-arrow-down-s-line m09-phase-chevron" aria-hidden="true"></i></span>
            </button>
            <div class="m09-phase-detail" id="m09-phase-detail-${esc(phase.id)}" ${index === 0 ? '' : 'hidden'}>
              <p>${esc(phase.description)}</p>
            </div>
          </li>`).join('')}
        </ol>
      </div>
      <p class="m09-concept"><strong>Where does the SOC analyst fit?</strong> Analysts contribute across the lifecycle, but alert triage sits mainly in <em>detect &amp; analyze</em>. Module 09 carries that work forward into containment, eradication, recovery, and accountable handoff.</p>
    </div>`;
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

// A knowledge check can read complete on the account (server-verified module,
// synced quiz detail, or knowledge-check evidence) while this browser holds no
// answers — another device did the work, or an admin override set it. Show a
// verified summary instead of a blank 0/N form; never fabricate answers.
function moduleNineQuizVerifiedElsewhere() {
  if (moduleNineQuizForceRetake || !moduleNineQuizState || moduleNineQuizState.scored) return false;
  if (Object.keys(moduleNineQuizState.answers || {}).length > 0) return false;
  return moduleNineUser?.remoteVerifiedModuleProgress?.['soc-09'] === true
    || moduleNineUser?.remoteModuleDetail?.['soc-09']?.quizPassed === true
    || moduleNineUser?.remoteModuleEvidence?.['soc-09']?.['knowledge-check'] === true;
}

function moduleNineQuizPanel() {
  if (!moduleNineQuizState?.selectedQuestions || moduleNineQuizState.selectedQuestions.length === 0) {
    return `<div class="m09-quiz-empty" id="m09-quiz-feedback" role="status">Loading quiz…</div>`;
  }
  if (moduleNineQuizVerifiedElsewhere()) {
    return `<form class="m09-quiz-form mf-quiz-form" id="m09-quiz-form" novalidate><section class="mf-score is-pass" id="m09-quiz-feedback" tabindex="-1" aria-live="polite"><p class="mf-kicker">Module knowledge check</p><h3>Already verified complete</h3><p>This knowledge check is recorded as passed on your account. It is never re-answered automatically on a new device or browser, so nothing is shown here that wasn't actually submitted.</p><button type="button" class="mf-score-retake" data-m09-quiz-retake>Retake this knowledge check</button></section></form>`;
  }

  const selected = moduleNineQuizState.selectedQuestions;
  const answered = Object.keys(moduleNineQuizState.answers || {}).length;
  const total = selected.length;

  let feedbackHtml = '';
  if (moduleNineQuizState.scored) {
    const passed = moduleNineQuizState.score >= 70;
    feedbackHtml = `<section class="m09-quiz-score mf-score ${passed ? 'm09-quiz-pass is-pass' : 'm09-quiz-remediate is-remediate'}" id="m09-quiz-feedback" tabindex="-1" aria-live="polite">
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

  return `<form class="m09-quiz-form mf-quiz-form" id="m09-quiz-form" novalidate>
    <div class="m09-panel-heading mf-panel-heading"><div><p class="m09-kicker mf-kicker">Knowledge check</p><h3 id="m09-quiz-title" tabindex="-1">Test your understanding of incident response principles</h3></div><span>${answered}/${total} answered</span></div>
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
  return '';
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

function moduleNineResponsePhase(phase, number, title, description) {
  const selected = moduleNineState.responsePlan[phase];
  return `<fieldset class="m09-response-phase"><legend><span>${number}</span>${esc(title)}</legend><p>${esc(description)}</p><div class="m09-response-options">${MODULE_NINE_RESPONSE_OPTIONS[phase].map((option) => `<label><input type="checkbox" name="response-${esc(phase)}" value="${esc(option.id)}" ${selected.includes(option.id) ? 'checked' : ''} /><span><strong>${esc(option.label)}</strong><small>${esc(option.help)}</small></span></label>`).join('')}</div></fieldset>`;
}

// The response-plan phases (contain/eradicate/recover) are multi-select
// checkbox groups — outside caseRecordFields' single-select `findings` —
// so they render as spec.findingsHtml inside the standard ticket, exactly
// where the old artifact form put them.
function moduleNineResponsePlanHtml() {
  return `<div class="m09-response-grid">${moduleNineResponsePhase('contain', 'A', 'Contain', 'Limit active harm while preserving the case.')}${moduleNineResponsePhase('eradicate', 'B', 'Eradicate', 'Remove the demonstrated foothold and identity risk.')}${moduleNineResponsePhase('recover', 'C', 'Recover', 'Restore service only after clear validation conditions.')}</div>`;
}

function moduleNineInvestigation() {
  return `<section class="m09-workbench" aria-labelledby="m09-case-title"><div class="m09-casebar"><div><p class="m09-kicker">INC-4937 · Mission Next Labs · active ransomware slice</p><h3 id="m09-case-title" tabindex="-1">Operation Cedar Lock — encryption in progress</h3><p>Rapid encryption on ws-173 overlaps an unfamiliar acct-173 session and fs-02 service disruption. Decide what is confirmed, contain active impact, and hand off NIST-aligned next actions without overclaiming scope.</p></div><dl><div><dt>Assigned role</dt><dd>Tier 1 responder</dd></div><div><dt>Authority</dt><dd>Approved containment</dd></div><div><dt>Starting severity</dt><dd>Critical pending scope</dd></div></dl></div>
    <div class="m09-progress-row" aria-label="Investigation progress"><span><strong>${moduleNineState.reviewedSources.length}/3</strong> sources reviewed</span><span><strong>${moduleNineState.selectedEvidence.length}</strong> evidence records</span><span><strong>${moduleNineState.attempts || 0}</strong> scored attempts</span></div>
    ${moduleNineSourceTabs()}${moduleNineEvidenceTable(moduleNineState.activeSource)}${moduleNineEvidenceTray()}
    <details class="m09-hint" ${moduleNineState.hintsOpened.includes('correlation') ? 'open' : ''} data-m09-hint="correlation"><summary>Optional correlation hint</summary><p>Start with the process and persistence records. Then look for identity and network activity sharing both the same time window and incident entity. Keep known-good baselines out of the evidence set.</p></details>
  </section>`;
}

let moduleNineProveItShowMissing = false;

function moduleNineProveItRedoRequested() {
  return moduleNineUser?.openLabRedosByModuleKey?.['soc-09'] != null;
}

// '' until submitted; then 'review' while the latest attempt awaits faculty,
// 'graded' once an instructor has reviewed it without sending it back.
function moduleNineProveItReviewStatus() {
  if (!moduleNineState?.caseRecord?.submitted) return '';
  const attempt = moduleNineUser?.latestLabAttemptByKey?.[MODULE_NINE_CATALOG_LAB_KEY];
  return attempt?.reviewedAt && !attempt.redoRequested ? 'graded' : 'review';
}

function moduleNineProveItRedoFeedback() {
  if (!moduleNineProveItRedoRequested()) return '';
  const items = moduleNineUser.openLabRedosByModuleKey['soc-09'].feedback || [];
  return `<div class="m01-redo-feedback" role="note">
    <strong><i class="ri-feedback-line" aria-hidden="true"></i> Instructor feedback</strong>
    ${items.length
      ? `<ul>${items.map((item) => `<li>${item.item_label ? `<strong>${esc(item.item_label)}:</strong> ` : ''}${esc(item.comment || '')}</li>`).join('')}</ul>`
      : '<p>Your instructor returned this case without written notes. Use Message Instructor if you are not sure what to change.</p>'}
  </div>`;
}

function moduleNineProveItSpec() {
  const extraMissing = [];
  if (moduleNineState.reviewedSources.length < 3) extraMissing.push('Review all three evidence sources');
  if (moduleNineState.selectedEvidence.length < 4) extraMissing.push('Select at least four evidence records');
  if (Object.values(moduleNineState.responsePlan).some((items) => !items.length)) extraMissing.push('Choose at least one action in every response phase');
  return {
    formId: 'm09-form',
    panelId: 'm09-review-submission',
    caseId: 'INC-4937',
    userOptions: MODULE_NINE_ENTITY_ROSTER.users.map((entry) => ({ id: entry.id, text: entry.id })),
    deviceOptions: MODULE_NINE_ENTITY_ROSTER.devices.map((entry) => ({ id: entry.id, text: entry.id })),
    departmentOptions: MODULE_NINE_DEPARTMENT_OPTIONS,
    findings: [
      { name: 'classification', label: 'Incident classification', options: MODULE_NINE_CLASSIFICATION_OPTIONS, missing: 'Classify the incident' },
      { name: 'scope', label: 'Defensible current scope', options: MODULE_NINE_SCOPE_OPTIONS, missing: 'Record the defensible current scope' },
    ],
    findingsHtml: moduleNineResponsePlanHtml(),
    notesPlaceholder: 'Incident state: … Confirmed scope: … Evidence: … Requested response: … Recovery condition: …',
    notesMin: 140,
    extraMissing,
    saveAttr: 'data-m09-save-proveit',
    submitAttr: 'data-m09-submit-proveit',
    lockedMessage: 'Module 10 stays locked until your instructor approves the submission.',
  };
}

// Prove It scoring: entity tiers 10, severity 8, disposition 10,
// escalation/routing up to 15, classification finding 10, scope finding 8,
// contain/eradicate/recover response actions 10/7/8, analyst notes 14 — 100
// total. Module 01's weighting model, proportionally folded with this
// module's own classification/scope/response-plan domain findings, which
// the old m09-form graded directly and are now ticket findings/findingsHtml.
function moduleNineProveItPerformance() {
  const state = moduleNineState.caseRecord;
  const spec = moduleNineProveItSpec();
  const missing = caseRecordMissing(state, spec);

  // Observation: sources reviewed + evidence selected against the expected
  // set — the part of the old moduleNineScore() this ticket does not gate
  // through caseRecordMissing's extraMissing alone (reviewing 3 sources and
  // 4+ records is required to submit; the quality of the selection is
  // still scored here for the instructor).
  const sourcesReviewed = moduleNineState.reviewedSources.filter((key) => MODULE_NINE_SOURCES[key]).length;
  const sources = Math.round((sourcesReviewed / 3) * 5); // 0-5
  const evidence = moduleNineSelectionScore(moduleNineState.selectedEvidence, MODULE_NINE_EXPECTED_EVIDENCE, 10); // 0-10
  const observation = sources + evidence;

  const userTier = MODULE_NINE_ENTITY_ROSTER.users.find((entry) => entry.id === state.affectedUser)?.tier;
  const deviceTier = MODULE_NINE_ENTITY_ROSTER.devices.find((entry) => entry.id === state.affectedDevice)?.tier;
  const tierFit = (tier) => (tier === 'principal' ? 1 : tier === 'pivot' ? 0.5 : 0);
  const entityPoints = Math.round((tierFit(userTier) + tierFit(deviceTier)) * 4); // 0-8

  const severityOk = caseRecordSeverity(state) === MODULE_NINE_ANSWER_KEY.severity;
  const dispositionOk = caseRecordDisposition(state) === MODULE_NINE_ANSWER_KEY.disposition;
  const department = MODULE_NINE_DEPARTMENT_OPTIONS.find((option) => option.id === state.escalateTo) || null;
  const escalationRequiredOk = state.escalation === 'required';
  const bounced = escalationRequiredOk && department && department.fit < 40;
  const escalation = escalationRequiredOk && department && !bounced ? Math.round((department.fit / 100) * 12) : 0;

  const findings = state.findings || {};
  const classificationOk = findings.classification === MODULE_NINE_ANSWER_KEY.classification;
  const scopeOk = findings.scope === MODULE_NINE_ANSWER_KEY.scope;

  const contain = moduleNineSelectionScore(moduleNineState.responsePlan.contain, ['isolate-ws173', 'revoke-disable-acct173', 'segment-fs02'], 8);
  const eradicate = moduleNineSelectionScore(moduleNineState.responsePlan.eradicate, ['stop-encryption', 'reset-credentials', 'restore-service'], 6);
  const recover = moduleNineSelectionScore(moduleNineState.responsePlan.recover, ['validate-reconnect', 'monitored-reenable'], 7);

  const note = (state.notes || '').trim().toLowerCase();
  const noteLength = note.length >= 140 ? 3 : 0;
  const noteConclusion = /(confirm|compromis|incident|high|critical)/.test(note) ? 3 : 0;
  const noteEntities = /ws-173/.test(note) && /acct-173/.test(note) && /fs-02/.test(note) ? 3 : 0;
  const noteEvidence = /(encrypt|ransom|service|session|m09-e0|203\.0\.113\.173)/.test(note) ? 2 : 0;
  const noteContain = /(isolat|revoke|disable|contain|block)/.test(note) ? 2 : 0;
  const noteRecover = /(validat|monitor|reconnect|re-enable|reenable|recover)/.test(note) ? 1 : 0;
  const notes = noteLength + noteConclusion + noteEntities + noteEvidence + noteContain + noteRecover; // 0-14

  const severity = severityOk ? 7 : 0;
  const disposition = dispositionOk ? 8 : 0;
  const classification = classificationOk ? 8 : 0;
  const scope = scopeOk ? 7 : 0;
  const score = observation + entityPoints + severity + disposition + escalation + classification + scope + contain + eradicate + recover + notes;
  const criticalErrors = state.escalation === 'not-required' ? ['escalation-not-required'] : [];

  return {
    missing,
    score,
    breakdown: { observation, sources, evidence, affected_entity: entityPoints, severity, disposition, escalation, classification, scope, contain, eradicate, recover, analyst_notes: notes },
    department, bounced,
    feedback: [
      evidence >= 10 && sources >= 5 ? 'Observation: all three sources reviewed; the selected records establish encryption impact, identity overlap, service disruption, and bounded scope.' : `Observation: ${observation}/15. Review all sources and select the M09-E records that establish impact, identity overlap, service disruption, and scope; benign context is not incident proof.`,
      entityPoints >= 8 ? 'Affected entity/scope: correct — ws-173 and acct-173.' : entityPoints > 0 ? 'Affected entity/scope: partial credit — a related host/account is supported, but ws-173 / acct-173 is the confirmed pair.' : 'Affected entity/scope: review the endpoint and identity evidence for the confirmed affected user and device.',
      severityOk ? 'Severity: correct.' : 'Severity: review — active encryption with service disruption is Critical.',
      dispositionOk ? 'Disposition: correct.' : 'Disposition: review — the endpoint, identity, and service evidence together confirm malicious activity.',
      classificationOk ? 'Classification: correct — active ransomware impact with identity overlap.' : 'Classification: review — connect the endpoint encryption behavior with the overlapping identity session.',
      scopeOk ? 'Scope: correct — bounded to the confirmed three entities.' : 'Scope: review — state only what this evidence slice supports; do not claim fleet-wide compromise or zero impact.',
      !escalationRequiredOk ? 'Routing: not applicable — escalation was set to not required.' : !department ? 'Routing: review — this case needs a department routed with the recorded evidence.' : department.fit >= 100 ? `Routing: correct — ${department.text} is the best-fit department for this case.` : department.fit >= 40 ? `Routing: accepted, but not the best fit — ${department.note}` : `Routing: returned — ${department.bounce || department.note}`,
      contain + eradicate + recover >= 18 ? 'Response plan: proportionate containment, eradication, and recovery selections.' : `Response plan: ${contain + eradicate + recover}/21 — select every justified action in each phase without over- or under-responding.`,
    ],
    criticalErrors,
  };
}

function moduleNineArtifact() {
  const performance = moduleNineProveItPerformance();
  return `<div class="m09-panel-heading"><div><p class="m09-kicker">Scored artifact · observation, analysis, decision, communication</p><h3 id="m09-artifact-title">Incident response record</h3></div></div>
    ${caseRecordPane(moduleNineState.caseRecord, {
      ...moduleNineProveItSpec(),
      missing: performance.missing,
      reviewStatus: moduleNineProveItReviewStatus(),
      redoRequested: moduleNineProveItRedoRequested(),
      redoHtml: moduleNineProveItRedoFeedback(),
      showMissing: moduleNineProveItShowMissing,
    })}`;
}

function moduleNineDynamic() {
  return `${moduleNineInvestigation()}${moduleNineArtifact()}`;
}

function moduleNineGuidedLabPanel() {
  const href = 'imported-labs/mission-next-labs/index.html#/track/malware-analysis/project/ma-3/lab';
  return `<section class="m09-external-lab" id="m09-guided-lab-panel">
    <p class="m09-panel-instruction">Work through the imported malware-analysis project below; it opens on this page with its own guided tasks. When you're done, note what you found and mark the Guided Lab complete.</p>
    ${missionNextLabLaunchGroup(9, 'guided', [{ title: 'Analyzing a Ransomware Sample', detail: 'Imported malware-analysis project. Opens on this page with its own guided tasks.', href, labId: 'guided-1', requireNote: true }], moduleNineState.labProgress)}
    <label class="m09-note-label">Working notes (optional)<textarea rows="4" maxlength="900" data-m09-practice-notes placeholder="What did you find? Any blockers?">${esc(moduleNineState.practiceNotes)}</textarea></label>
    <div class="m09-actions"><button type="button" class="m09-submit" data-m09-practice-complete>${moduleNineState.practiceComplete ? 'Guided Lab marked complete' : 'Mark Guided Lab complete'}</button></div>
  </section>`;
}

function viewModuleNine(user, program) {
  moduleNineLoad(user);
  const module = program.modules['soc-09'];
  const sections = moduleNineGetSections();
  const lectureOpen = moduleNineReviewMode || !sections[0].isComplete;
  const quizOpen = moduleNineReviewMode || (moduleNineQuizState && !moduleNineQuizState.passed);
  const guidedLabOpen = moduleNineReviewMode || !sections[2].isComplete;
  const assessmentLabOpen = moduleNineReviewMode || !sections[3].isComplete;
  const reviewOpen = moduleNineReviewMode;
  const quickNavItems = moduleNineGetQuickNavItems();

  return `<div class="m09-shell">
    ${moduleTopbar(user, program)}
    <div class="mquick-nav-layout">
      ${moduleProgressShell(sections, { reviewMode: moduleNineReviewMode })}
      <main class="m09-main mf-frame">
      <section class="m09-hero mf-hero" aria-labelledby="m09-title"><div><p class="m09-kicker mf-kicker">Module 09 · ${formatHandsOnDuration(module.durationMinutes)} · operations &amp; response</p><h1 id="m09-title">${esc(module.title)}</h1><p class="mf-lede">Correlate a limited incident slice, decide what it proves, and build a containment-to-recovery plan that matches the verified scope.</p></div><dl class="mf-stats" aria-label="Saved lab progress"><div><dt>Guided Lab</dt><dd>${moduleNineState.practiceComplete ? 'Complete' : 'Not started'}</dd></div><div><dt>Instructional time</dt><dd>${formatInstructionalMinutes(MODULE_NINE_CATALOG_MODULE.instructionalMinutes)}</dd></div><div><dt>Assessment Lab</dt><dd id="m09-status">${moduleNineState.completed ? 'Complete' : moduleNineState.attempts ? 'In progress' : 'Not started'}</dd></div></dl></section>

      <details class="m09-section-collapsible mf-section" ${lectureOpen ? 'open' : ''}>
        <summary class="m09-section"><div class="m09-section-heading mf-section-heading"><span class="m09-section-badge mf-section-badge">1</span><div><p class="m09-kicker mf-kicker">Lecture</p><h2 id="m09-lecture">Incident response principles: correlation, scope, and proportionate action</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m09-section-body mf-section-body">
          <section class="m09-section" id="m09-field-guide" aria-labelledby="m09-guide-title"><div class="m09-section-heading"><span>a</span><div><p class="m09-kicker">Response guide</p><h3 id="m09-guide-title">Act on evidence, not urgency alone</h3></div></div>${moduleNineScenarioLoop()}${moduleNineConcepts()}</section>
          ${moduleNineVideoScript()}
        </div>
      </details>

      <details class="m09-section-collapsible mf-section" ${quizOpen ? 'open' : ''}>
        <summary class="m09-section"><div class="m09-section-heading mf-section-heading"><span class="m09-section-badge mf-section-badge">2</span><div><p class="m09-kicker mf-kicker">Knowledge Check</p><h2 id="m09-knowledge-check">Test your understanding of incident response principles</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m09-section-body mf-section-body">
          ${moduleNineQuizPanel()}
        </div>
      </details>

      <details class="m09-section-collapsible mf-section mf-lab-section" ${guidedLabOpen ? 'open' : ''}>
        <summary class="m09-section"><div class="m09-section-heading mf-section-heading"><span class="m09-section-badge mf-section-badge">3</span><div><p class="m09-kicker mf-kicker">Practice It · Guided Lab</p><h2 id="m09-guided-lab">Ransomware analysis practice</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m09-section-body mf-section-body">
          <div class="m09-boundary"><i class="ri-shield-check-line" aria-hidden="true"></i><p><strong>Lab boundary:</strong> This lab opens in the imported training application on this page.</p></div>
          <div id="m09-guided-lab-dynamic">${moduleNineGuidedLabPanel()}</div>
        </div>
      </details>

      <details class="m09-section-collapsible mf-section" ${assessmentLabOpen ? 'open' : ''}>
        <summary class="m09-section"><div class="m09-section-heading mf-section-heading"><span class="m09-section-badge mf-section-badge">4</span><div><p class="m09-kicker mf-kicker">Prove It · Assessment Lab</p><h2 id="m09-lab">Active ransomware response · INC-4937</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m09-section-body mf-section-body">
          <div class="m09-ticket" aria-labelledby="m09-ticket-title"><div class="m09-ticket-head"><i class="ri-ticket-2-line" aria-hidden="true"></i><div><p class="m09-kicker">Assigned from the Tier 1 queue</p><h3 id="m09-ticket-title">INC-4937 · Endpoint alert, unconfirmed</h3></div><span class="m09-ticket-priority">P3 at intake</span></div><dl class="m09-ticket-grid"><div><dt>Reporting source</dt><dd>Automated endpoint sensor, ws-173</dd></div><div><dt>Reported</dt><dd>10:02 UTC</dd></div><div><dt>Assigned to</dt><dd>You (Tier 1, this shift)</dd></div><div><dt>Acknowledge / respond by</dt><dd>10:17 UTC / 14:02 UTC</dd></div></dl><p class="m09-ticket-note">The queue entry carries only what the sensor reported: possible encryption activity on one endpoint. Everything else below is what you find once you start looking — the ticket does not tell you it is ransomware, that it is contained, or that it is limited to one host.</p></div>
          <div class="m09-role"><i class="ri-user-settings-line" aria-hidden="true"></i><div><strong>Your role: Tier 1 incident responder</strong><p>Investigate the three sources in any order. You may initiate playbook-approved containment and recommend later phases; the incident lead and system owners retain execution authority.</p></div></div>
          <div id="m09-lab-dynamic">${moduleNineDynamic()}</div>
        </div>
      </details>

      <details class="m09-section-collapsible mf-section" ${reviewOpen ? 'open' : ''}>
        <summary class="m09-section"><div class="m09-section-heading mf-section-heading"><span class="m09-section-badge mf-section-badge">5</span><div><p class="m09-kicker mf-kicker">Module Review</p><h2 id="m09-review">Key concepts and takeaways</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m09-section-body mf-section-body">${moduleNineReview()}</div>
      </details>

      <details class="m09-section-collapsible mf-section mf-section-supplemental" ${moduleNineReviewMode ? 'open' : ''}>
        <summary class="m09-section"><div class="m09-section-heading mf-section-heading"><span class="m09-section-badge mf-section-badge"><i class="ri-book-open-line" aria-hidden="true"></i></span><div><p class="m09-kicker mf-kicker">Sources &amp; Further Reading</p><h2 id="m09-sources">Authoritative references</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m09-section-body mf-section-body">${moduleSourcesBlock(MODULE_NINE_SOURCES_LIST)}</div>
      </details>
    </main>
    </div>
  </div>`;
}

function moduleNineSelectionScore(selected, expected, points) {
  const chosen = new Set(selected);
  const correct = expected.filter((id) => chosen.has(id)).length;
  const extras = selected.filter((id) => !expected.includes(id)).length;
  return Math.max(0, Math.round((correct / expected.length) * points) - extras * Math.ceil(points / expected.length));
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
    if (event.target.closest('[data-m09-quiz-retake]')) {
      event.preventDefault();
      moduleNineQuizForceRetake = true;
      quizForm.innerHTML = moduleNineQuizPanel();
      return;
    }
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
    if (event.target.closest('[data-m09-submit-proveit]')) { moduleNineFinalizeProveIt(); return; }
    if (event.target.closest('[data-m09-save-proveit]')) {
      moduleNineState.caseRecord.actionHistory.push({ action: 'Saved case', at: new Date().toISOString() });
      moduleNineSave();
      moduleNineRender();
    }
  });

  root.addEventListener('toggle', (event) => {
    const hint = event.target.closest('[data-m09-hint]');
    if (!hint || !hint.open) return;
    moduleNineState.hintsOpened = [...new Set([...moduleNineState.hintsOpened, hint.dataset.m09Hint])];
    moduleNineSave();
  }, true);

  root.addEventListener('input', (event) => {
    const field = event.target;
    if (field.tagName === 'TEXTAREA' && field.name === 'notes' && !moduleNineState.caseRecord.submitted) {
      moduleNineState.caseRecord.notes = field.value;
      moduleNineSave();
    }
  });

  root.addEventListener('change', (event) => {
    const input = event.target;
    if (input.name === 'evidence') {
      moduleNineState.selectedEvidence = moduleNineToggleValue(moduleNineState.selectedEvidence, input.value, input.checked);
      moduleNineSave();
      const count = root.querySelector('#m09-evidence-count');
      if (count) count.textContent = String(moduleNineState.selectedEvidence.length);
      return;
    }
    const responseMatch = input.name.match(/^response-(contain|eradicate|recover)$/);
    if (responseMatch && !moduleNineState.caseRecord.submitted) {
      const phase = responseMatch[1];
      moduleNineState.responsePlan[phase] = moduleNineToggleValue(moduleNineState.responsePlan[phase], input.value, input.checked);
      moduleNineSave();
      return;
    }
    if (input.name && !moduleNineState.caseRecord.submitted && caseRecordApply(moduleNineState.caseRecord, input.name, input.value)) {
      moduleNineState.caseRecord.actionHistory.push({ action: `Updated ${input.name}`, at: new Date().toISOString() });
      moduleNineSave();
      moduleNineRender();
    }
  });
}

function moduleNineFinalizeProveIt() {
  const performance = moduleNineProveItPerformance();
  if (moduleNineState.caseRecord.submitted) return;
  if (performance.missing.length) {
    moduleNineProveItShowMissing = true;
    moduleNineRender('m09-review-submission');
    return;
  }
  moduleNineProveItShowMissing = false;
  const now = new Date().toISOString();
  moduleNineState.caseRecord.submitted = true;
  moduleNineState.caseRecord.submittedAt = now;
  moduleNineState.caseRecord.actionHistory.push({ action: 'Submitted case for faculty review', at: now });
  moduleNineState.attempts = (moduleNineState.attempts || 0) + 1;
  moduleNineState.lastSubmittedAt = now;
  moduleNineState.completed = true;
  moduleNineState.notes = moduleNineState.caseRecord.notes;
  if (!moduleNineState.flags.includes(MODULE_NINE_FLAG)) moduleNineState.flags.push(MODULE_NINE_FLAG);
  moduleNineSave();
  if (typeof recordLabAttempt === 'function') {
    const caseSpec = moduleNineProveItSpec();
    recordLabAttempt(moduleNineUser, MODULE_NINE_CATALOG_LAB_KEY, {
      state: 'complete',
      score: performance.score,
      result: {
        breakdown: performance.breakdown,
        feedback: performance.feedback,
        critical_errors: performance.criticalErrors,
        case_record: moduleNineState.caseRecord,
        case_display: caseRecordDisplay(moduleNineState.caseRecord, caseSpec),
        case_summary: caseRecordSummary(moduleNineState.caseRecord, caseSpec),
      },
    });
  }
  if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleNineUser, 'soc-analyst', 'soc-09', MODULE_NINE_CATALOG_LAB_KEY);
  const status = document.getElementById('m09-status');
  if (status) status.textContent = 'Complete';
  moduleNineRender();
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
  const lifecycleWheel = document.querySelector('[data-m09-lifecycle-wheel]');
  if (lifecycleWheel) {
    lifecycleWheel.addEventListener('click', (event) => {
      const phaseButton = event.target.closest('[data-m09-phase]');
      if (!phaseButton || !lifecycleWheel.contains(phaseButton)) return;

      const activeIndex = Number(phaseButton.dataset.m09Phase);
      lifecycleWheel.querySelectorAll('[data-m09-phase]').forEach((button, index) => {
        const isActive = index === activeIndex;
        button.setAttribute('aria-expanded', String(isActive));
        button.closest('[data-m09-phase-card]')?.classList.toggle('is-active', isActive);
        const detail = document.getElementById(button.getAttribute('aria-controls'));
        if (detail) detail.hidden = !isActive;
      });

      lifecycleWheel.style.setProperty('--wheel-rotation', `${activeIndex * -60}deg`);
      const selectedPhase = MODULE_NINE_LIFECYCLE_PHASES[activeIndex];
      const hubPhase = lifecycleWheel.querySelector('[data-m09-hub-phase]');
      if (hubPhase && selectedPhase) hubPhase.textContent = `Phase ${activeIndex + 1} · ${selectedPhase.title}`;
    });
  }
  // Wire quiz and lab components
  wireModuleNineQuiz();
  wireModuleNineGuidedLab();
  wireModuleNineLab();
}

function wireModuleNineGuidedLabGating(root) {
  if (!root || !moduleNineState) return;
  wireMissionNextLabGating(root, moduleNineState.labProgress, () => {
    moduleNineSave();
    root.innerHTML = moduleNineGuidedLabPanel();
    wireModuleNineGuidedLabGating(root);
  });
}

function wireModuleNineGuidedLab() {
  const root = document.getElementById('m09-guided-lab-dynamic');
  if (!root || !moduleNineState) return;
  wireModuleNineGuidedLabGating(root);
  root.addEventListener('input', (event) => {
    if (event.target.matches('[data-m09-practice-notes]')) {
      moduleNineState.practiceNotes = event.target.value;
      moduleNineSave();
    }
  });
  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-m09-practice-complete]')) {
      if (!missionNextAllLabsComplete(moduleNineState.labProgress, ['guided-1'])) {
        root.innerHTML = moduleNineGuidedLabPanel();
        wireModuleNineGuidedLabGating(root);
        return;
      }
      moduleNineState.practiceComplete = true;
      moduleNineSave();
      root.innerHTML = moduleNineGuidedLabPanel();
      wireModuleNineGuidedLabGating(root);
    }
  });
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 9, moduleKey: 'soc-09', view: viewModuleNine, wire: wireModuleNine });
