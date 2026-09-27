/* Module 11 — independent SOC operations and communication practice.
 * All metrics, people, systems, and incident evidence are synthetic and local.
 */

const MODULE_ELEVEN_METRICS_LAB_ID = 'm11-soc-metrics-v1';
const MODULE_ELEVEN_QUIZ_BANKS = [
  {
    conceptId: 'shared-case-source-review',
    conceptTitle: 'Shared-case source review and evidence boundaries',
    questions: [
      {
        id: 'm11-q-source-1',
        prompt: `The INC-4937 Module 11 slice contains M09-E01, M09-E03, M09-E06, M09-E07, and M09-E08. Which executive statement is MOST defensible after reviewing those sources?`,
        options: [
          { id: 'a', text: 'Ransomware was proven across the enterprise and a named operator was identified.' },
          { id: 'b', text: 'The slice supports impact on ws-173, an overlapping acct-173 session, and fs-02 service disruption; wider compromise and operator identity remain unestablished.' },
          { id: 'c', text: 'No incident occurred because isolation succeeded.' },
          { id: 'd', text: 'The account owner caused the encryption because the session overlapped the timeline.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. The bounded slice supports a concise impact and scope statement while preserving the contract's explicit unknowns. It does not establish enterprise-wide compromise, attribution, or operator identity.`,
        feedbackIncorrect: `Use only the declared records and keep their boundaries visible. The shared slice supports bounded observations, not enterprise-wide claims, attribution, or a named operator.`,
      },
      {
        id: 'm11-q-source-2',
        prompt: `A post-closure dashboard shows an SLA dip during the INC-4937 review window. What is the BEST source-review move before briefing leadership?`,
        options: [
          { id: 'a', text: 'Treat the dip as proof that every queued alert was part of the ransomware case.' },
          { id: 'b', text: 'Separate the health metric from case evidence, compare the metric window to the declared ITSM tickets, and state any unscoped queue causes as unknown.' },
          { id: 'c', text: 'Remove the dip from the report so closure appears successful.' },
          { id: 'd', text: 'Assign the dip to a named person without reviewing the source rows.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. A health metric is an operational signal. Compare it with the bounded case slice, preserve uncertainty, and avoid turning correlation into incident scope or blame.`,
        feedbackIncorrect: `Metrics and ITSM tickets answer different questions. Review both sources, state the relationship as a hypothesis when appropriate, and retain unknowns instead of overclaiming.`,
      },
    ],
  },
  {
    conceptId: 'metrics-vs-incident-impact',
    conceptTitle: 'Operational metrics degradation vs. specific incident proof',
    questions: [
      {
        id: 'm11-q-metrics-1',
        prompt: `A SOC's MTTD rose from 12 to 21 minutes over four weeks. What does this signal prove?`,
        options: [
          { id: 'a', text: 'An active enterprise-wide breach is occurring.' },
          { id: 'b', text: 'Detection response speed degraded; root cause requires analysis of capacity, rule tuning, and alert volume.' },
          { id: 'c', text: 'The SIEM platform has failed.' },
          { id: 'd', text: 'All incidents this week are lower severity.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. A metric trend is an operational signal, not direct proof of an incident. Degraded MTTD indicates handling pressure, which may stem from staffing, rule noise, or platform issues—not necessarily a breach.`,
        feedbackIncorrect: `Metrics show operational health, not incident occurrence. Distinguish between "response got slower" (operational signal) and "a breach happened" (incident proof requiring evidence).`,
      },
      {
        id: 'm11-q-metrics-2',
        prompt: `Priority SLA attainment fell from 96% to 78% while alert volume rose 36%. Which conclusion is defensible?`,
        options: [
          { id: 'a', text: 'The organization suffered a confirmed data breach.' },
          { id: 'b', text: 'SLA miss indicates operational risk; volume and staffing trends help explain the miss but do not by themselves prove breach scope.' },
          { id: 'c', text: 'All users have been compromised.' },
          { id: 'd', text: 'The metrics are too inconsistent to analyze.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. A missed SLA is an operational risk requiring escalation, not proof of a specific incident. The cause may be legitimate volume, rule tuning, or staffing—investigate, then escalate the risk.`,
        feedbackIncorrect: `Operational metrics require analysis and escalation, but they do not directly prove incident scope or impact. Separate the operational signal from the security finding.`,
      },
      {
        id: 'm11-q-metrics-3',
        prompt: `One alert-generation rule produced 342 weekly alerts, of which 287 were validated false positives after a recent access-control change. What is the primary controllable driver?`,
        options: [
          { id: 'a', text: 'The entire SOC has lost analytical capability.' },
          { id: 'b', text: 'A specific rule became noisy after a configuration change; scoped tuning can reduce false positives without disabling detection.' },
          { id: 'c', text: 'Enterprise-wide unauthorized access.' },
          { id: 'd', text: 'False positives prove the rule is useless.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Tracing a metric spike to a specific rule and correlating it to a known change isolates the controllable driver. Tuning or disabling that rule in a scoped manner preserves coverage.`,
        feedbackIncorrect: `Identifying the rule responsible for noise is the key first step. Do not abandon the rule entirely if a scoped adjustment can recover its value.`,
      },
      {
        id: 'm11-q-metrics-4',
        prompt: `The open alert backlog reached 76 items, including nine aged above the response SLA. One analyst noted, "We have more to do." Is this assessment sufficient?`,
        options: [
          { id: 'a', text: 'Yes; acknowledging the backlog is sufficient action.' },
          { id: 'b', text: 'No. The backlog requires quantification, trend analysis, root-cause hypothesis, assignment of aging work, and clear ownership.' },
          { id: 'c', text: 'No; the backlog should be immediately discarded to start fresh.' },
          { id: 'd', text: 'Yes; backlog size is irrelevant to SOC operations.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. A handoff to the incoming shift must quantify the risk, explain the operational trend, identify the driver, propose an action, and name an owner.`,
        feedbackIncorrect: `Observations alone are not handoffs. Include quantified risk, suspected root cause, recommended action, and accountable ownership.`,
      },
    ],
  },
  {
    conceptId: 'distinguishing-correlation-from-causation',
    conceptTitle: 'Distinguishing operational correlation from proof of causation',
    questions: [
      {
        id: 'm11-q-corr-1',
        prompt: `A metrics trend begins immediately after a remote-access policy change. Can you conclude the policy change caused the trend?`,
        options: [
          { id: 'a', text: 'Yes; temporal proximity proves causation.' },
          { id: 'b', text: 'No. Temporal correlation is material; investigate whether the policy change directly generated the alert volume or rule noise observed.' },
          { id: 'c', text: 'Only if the policy was unpopular.' },
          { id: 'd', text: 'No; policies never affect detection rules.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Correlation (timing) suggests a hypothesis. Causation requires evidence connecting the change to the observed effect—e.g., did the policy expand matching signatures for a specific rule?`,
        feedbackIncorrect: `A coincidence in timing is a clue, not proof. Always verify that the hypothesized cause actually produces the observed effect.`,
      },
      {
        id: 'm11-q-corr-2',
        prompt: `Staffing was reduced by one analyst in Week 29, and MTTD rose in Week 29. Is reduced staffing the root cause of the MTTD increase?`,
        options: [
          { id: 'a', text: 'Yes, reduced staffing always causes slower response.' },
          { id: 'b', text: 'Staffing is a contributing factor. However, alert volume and rule noise also rose sharply; all three factors combined affect handling speed.' },
          { id: 'c', text: 'No; staffing and response time are unrelated.' },
          { id: 'd', text: 'Yes, and staffing is the only factor that matters.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Staffing reduction contributes to pressure, but it does not fully explain the trend. Identify all contributing factors: capacity, alert volume, rule quality.`,
        feedbackIncorrect: `Avoid pinning the trend to a single cause when multiple factors compound. A complete diagnosis acknowledges all contributors.`,
      },
      {
        id: 'm11-q-corr-3',
        prompt: `MTTR (mean time to respond) rose from 98 to 171 minutes. A colleague suggests the analysts are less skilled. What question first clarifies whether skill or operational burden is the issue?`,
        options: [
          { id: 'a', text: '"Did our analysts recently lose training?"' },
          { id: 'b', text: '"Did the volume of alerts, complexity of cases, or staffing level change?"—operational pressure may explain slow responses better than skill loss.' },
          { id: 'c', text: '"Are the analysts lazy?"' },
          { id: 'd', text: 'Skip analysis; replace the analysts.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Operational burden (alert volume, queue saturation, rule noise) is often the culprit. Verify whether external pressure increased before assuming internal capability declined.`,
        feedbackIncorrect: `Performance degradation can stem from workload, not competence. Separate operational factors from personnel factors.`,
      },
      {
        id: 'm11-q-corr-4',
        prompt: `A 24-hour monitoring window follows a case's recovery, and no repeat indicators are observed. Can you conclude the incident is fully resolved?`,
        options: [
          { id: 'a', text: 'Yes; one clean day proves no residual risk.' },
          { id: 'b', text: 'No. One 24-hour window is a necessary but insufficient basis for closure. Closure requires monitoring completion, persistence removal verification, and an assigned control owner.' },
          { id: 'c', text: 'Only if management approves.' },
          { id: 'd', text: 'Yes; monitoring is optional.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Monitoring establishes baseline recovery but does not prove permanent resolution. Closure requires verified remediation, control improvement ownership, and continued vigilance.`,
        feedbackIncorrect: `A clean monitoring window is one milestone, not case closure. Assign ownership of a control improvement to prevent recurrence.`,
      },
    ],
  },
  {
    conceptId: 'audience-appropriate-communication',
    conceptTitle: 'Audience-appropriate communication—technical vs. executive framing',
    questions: [
      {
        id: 'm11-q-comm-1',
        prompt: `A technical note says "ws-173 showed encryption activity while an unfamiliar acct-173 session overlapped the window." An executive asks, "Did we lose data?" What gap does the note not address?`,
        options: [
          { id: 'a', text: 'The technical note is perfect for all audiences.' },
          { id: 'b', text: 'The technical note lacks bounded business impact: affected scope, observed sensitive access or lateral movement, service effect, residual risk, and what remains unknown.' },
          { id: 'c', text: 'Executives should not ask about data loss.' },
          { id: 'd', text: 'The note is too short.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Executives need impact framing—bounded entities, observed access results, service effect, residual risk, and explicit unknowns from the shared case slice.`,
        feedbackIncorrect: `Translate technical findings into business language. Connect observable behavior to business risk and recovery status.`,
      },
      {
        id: 'm11-q-comm-2',
        prompt: `An executive summary states, "Endpoint isolated after exfiltration risk." However, scoped network and identity searches found no exfiltration evidence. What is the communication error?`,
        options: [
          { id: 'a', text: 'The summary is accurate.' },
          { id: 'b', text: 'The statement overclaims by stating exfiltration risk without evidence. It should say: "Endpoint isolated; no evidence of data access or exfiltration in scoped searches."' },
          { id: 'c', text: 'Executives should not receive risk discussions.' },
          { id: 'd', text: 'Exfiltration always occurs in endpoints.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. An executive summary must distinguish what happened (isolation) from what did not happen (exfiltration) and what remains unknown (unscoped segments).`,
        feedbackIncorrect: `Avoid hedging with unproven risks. State observed impact, negative findings, and limitations clearly.`,
      },
      {
        id: 'm11-q-comm-3',
        prompt: `A case note uses technical jargon: "Scheduled task persistence vector removed after signature-based malware scan negative." A non-technical stakeholder reads this. What is missing?`,
        options: [
          { id: 'a', text: "The case note is appropriate for all readers." },
          { id: 'b', text: "Plain-language translation: \"The attacker's hidden startup mechanism was removed, and a full system scan found no other malicious files.\"" },
          { id: 'c', text: "Case notes should never be read by non-technical people." },
          { id: 'd', text: "The jargon is helpful and clear." },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Executives and boards need plain-language versions alongside technical details. Translate "persistence" to "a mechanism to re-establish the attacker's access."`,
        feedbackIncorrect: `Write case notes for technical peers; write executive summaries for decision-makers using clear language and business framing.`,
      },
      {
        id: 'm11-q-comm-4',
        prompt: `You write: "Case escalated to incident manager, endpoint owner, and identity owner with evidence summaries and follow-up assignments." Is this an accountable escalation?`,
        options: [
          { id: 'a', text: 'Yes; mentioning roles is sufficient.' },
          { id: 'b', text: 'No. Accountable escalation requires naming the specific person, clear evidence, and a follow-up condition—e.g., "Escalated to IM-Alice, Endpoint-Bob, Identity-Carol. Evidence: timeline, scope, recovery status. Condition: confirm control owner assigned by EOD."' },
          { id: 'c', text: 'Yes; roles are more important than names.' },
          { id: 'd', text: 'Escalations should not include follow-up conditions.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. An accountable escalation names people (not just roles), provides evidence, and specifies a follow-up condition or hand-off requirement.`,
        feedbackIncorrect: `Escalation without accountability is just broadcasting. Name the recipient, state what they need to do, and define success.`,
      },
    ],
  },
  {
    conceptId: 'escalation-with-ownership',
    conceptTitle: 'Escalation with named ownership and follow-up accountability',
    questions: [
      {
        id: 'm11-q-escal-1',
        prompt: `You discover an SLA miss and notify "the SOC team." Is this an escalation?`,
        options: [
          { id: 'a', text: 'Yes; notifying the team is sufficient.' },
          { id: 'b', text: 'No. Escalation requires notifying the duty manager and detection owner with quantified risk and an assigned action—not broadcast to peers.' },
          { id: 'c', text: 'Yes; team notification is the highest escalation.' },
          { id: 'd', text: 'Escalations should never occur.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Escalation means reporting up the chain of authority (duty manager, owner) with quantified context and a request for decision or action—not peer notification.`,
        feedbackIncorrect: `Escalation is directional: upward to decision-makers, not sideways to peers. Name the recipient and their responsibility.`,
      },
      {
        id: 'm11-q-escal-2',
        prompt: `An incident response escalates to "all engineers." What is the escalation failure?`,
        options: [
          { id: 'a', text: 'Broadcasting to a large group dilutes accountability and may send unverified detail to uncontrolled audiences.' },
          { id: 'b', text: 'Engineers are the right recipients.' },
          { id: 'c', text: 'All-hands notification is appropriate.' },
          { id: 'd', text: 'Broadcasting is the best escalation practice.' },
        ],
        correctId: 'a',
        feedbackCorrect: `Correct. Escalation should target decision-makers (incident manager, security leadership) with verified facts. Broad broadcasting risks panic and misinformation.`,
        feedbackIncorrect: `Escalate to accountable leaders with complete information, not to the organization at large with partial detail.`,
      },
      {
        id: 'm11-q-escal-3',
        prompt: `You escalate an SLA miss to the duty manager but do not specify the requested action or decision. What is the accountability gap?`,
        options: [
          { id: 'a', text: 'The escalation is complete.' },
          { id: 'b', text: 'Without a clear request (e.g., "Authorize a tuning change," "Approve weekend coverage"), the duty manager cannot take specific action.' },
          { id: 'c', text: 'Duty managers always know what to do.' },
          { id: 'd', text: 'Escalations should never request action.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Escalation must include a specific request: "Approve scoped rule tuning," "Assign aging-alert review," or "Schedule weekend analyst." This gives the recipient a clear hand-off.`,
        feedbackIncorrect: `Vague escalations create confusion. State the risk, propose a solution, and request a specific decision or action.`,
      },
      {
        id: 'm11-q-escal-4',
        prompt: `After closing an incident, you assign control improvement to "future work." Is this accountable closure?`,
        options: [
          { id: 'a', text: 'Yes; mentioning control improvement is sufficient.' },
          { id: 'b', text: 'No. Accountable closure requires naming the specific control owner and deadline—e.g., "SecEng-Dave reviews rule tuning by EOW, reports findings by Friday."' },
          { id: 'c', text: 'Yes; responsibility spreads across the team.' },
          { id: 'd', text: 'Controls should never be assigned.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Control ownership without a name and deadline is not a commitment. Assign it to a specific person with a target completion date.`,
        feedbackIncorrect: `"Future work" is not a plan. Close with named ownership and a deadline.`,
      },
    ],
  },
  {
    conceptId: 'closure-discipline',
    conceptTitle: 'Closure discipline—recovery verification, monitoring, and control ownership',
    questions: [
      {
        id: 'm11-q-closure-1',
        prompt: `An endpoint was isolated and restored. All scans are clean. Should the case close immediately?`,
        options: [
          { id: 'a', text: 'Yes; clean scans prove the endpoint is safe.' },
          { id: 'b', text: 'No. Closure requires verified recovery plus 24-hour monitoring, absence of repeat indicators, and an assigned control owner to prevent recurrence.' },
          { id: 'c', text: 'Only if the employee approves.' },
          { id: 'd', text: 'Cases should never close.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Scans prove current state, but monitoring ensures persistence did not re-establish. Control ownership prevents the same entry point from being used again.`,
        feedbackIncorrect: `Closure requires three conditions: verified recovery, clean monitoring window, and assigned control improvement. Verify each before closing.`,
      },
      {
        id: 'm11-q-closure-2',
        prompt: `You close a case after isolation succeeds but before credential review completes. What is the closure risk?`,
        options: [
          { id: 'a', text: 'No risk; containment is the only requirement.' },
          { id: 'b', text: 'High risk. An incomplete credential refresh leaves a compromised account exposed, enabling re-entry. Verify recovery before closure.' },
          { id: 'c', text: 'Recovery is optional.' },
          { id: 'd', text: 'Credentials are irrelevant to closure.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Containment (isolation) stops current activity; recovery (credential refresh, MFA reset) prevents re-entry. Both are required before closure.`,
        feedbackIncorrect: `Containment and recovery are sequential gates. Do not close until both are verified complete.`,
      },
      {
        id: 'm11-q-closure-3',
        prompt: `After closure, a repeat indicator appears on the same endpoint. What does this reveal about the closure decision?`,
        options: [
          { id: 'a', text: 'Cases sometimes cannot be fully closed.' },
          { id: 'b', text: 'The initial closure was premature. Recovery or control improvements were incomplete—e.g., the attacker retained access or the exploited vulnerability was not patched.' },
          { id: 'c', text: 'Repeat indicators never happen.' },
          { id: 'd', text: 'The original case was unrelated to the repeat indicator.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. A repeat indicator after closure means remediation was incomplete. Investigate whether the attacker retained persistence, a control was misconfigured, or monitoring was insufficient.`,
        feedbackIncorrect: `Repeat indicators after closure indicate closure was premature. Use them to refine closure discipline and control improvements.`,
      },
      {
        id: 'm11-q-closure-4',
        prompt: `A control owner is assigned to "prevent similar incidents," with no deadline or specific control. Is this discipline?`,
        options: [
          { id: 'a', text: 'Yes; assigning ownership is sufficient.' },
          { id: 'b', text: 'No. Discipline requires naming the owner, the specific control (e.g., "Enable MFA on VPN accounts"), and a deadline—e.g., "Alice implements MFA by end of month."' },
          { id: 'c', text: 'Yes; general assignments are standard.' },
          { id: 'd', text: 'Controls should not be assigned.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Closure discipline requires specificity: who (Alice), what (MFA on VPN accounts), when (end of month). Vague assignments go unaccompleted.`,
        feedbackIncorrect: `Assign controls with precision. Name the owner, the specific technical change, and the deadline. Review progress regularly.`,
      },
    ],
  },
];

const MODULE_ELEVEN_SOURCES_LIST = [
  {
    title: `Incident Response Recommendations and Considerations for Cybersecurity Risk Management (SP 800-61 Rev. 3)`,
    org: `NIST`,
    url: `https://csrc.nist.gov/pubs/sp/800/61/r3/final`,
    note: `Foundational incident-response guidance covering classification, escalation, case closure, and lessons-learned documentation — directly applicable to this module's escalation and closure workflows.`,
  },
  {
    title: `Federal Government Cybersecurity Incident and Vulnerability Response Playbooks`,
    org: `CISA`,
    url: `https://www.cisa.gov/resources-tools/resources/federal-government-cybersecurity-incident-and-vulnerability-response-playbooks`,
    note: `Standardized operational procedures for escalating and reporting incidents within defined authority boundaries — the reporting half of this module's closure lab.`,
  },
  {
    title: `Education & Training`,
    org: `FIRST.org`,
    url: `https://www.first.org/education/trainings`,
    note: `CSIRT/SOC operations training catalog covering incident-handling fundamentals and reporting practice for security operations teams.`,
  },
  {
    title: `Cybersecurity Framework (CSF) 2.0`,
    org: `NIST`,
    url: `https://www.nist.gov/cyberframework`,
    note: `Includes the GOVERN function, which frames how organizations communicate cybersecurity risk and operational metrics to leadership.`,
  },
  {
    title: `Security+ (SY0-701) Certification Overview & Objectives Summary`,
    org: `CompTIA`,
    url: `https://www.comptia.org/certifications/security`,
    note: `Supplementary public reference only. The §2 crosswalk is a developer draft pending curriculum, compliance, and faculty review; this study aid is not an approval, affiliation, endorsement, or pass guarantee.`,
  },
];

const MODULE_ELEVEN_REPORT_LAB_ID = 'm11-executive-report-v1';
const MODULE_ELEVEN_METRICS_CATALOG_KEY = 'lab-soc-metrics';
const MODULE_ELEVEN_REPORT_CATALOG_KEY = 'lab-exec-report';
const MODULE_ELEVEN_METRICS_FLAG = 'M11-SOC-METRICS-BRIEFED';
const MODULE_ELEVEN_REPORT_FLAG = 'M11-EXECUTIVE-REPORT-COMPLETE';

// M09 is the source of truth for the shared fictional case. This fallback
// keeps Module 11 renderable in isolation while preserving the same IDs and
// explicit evidence boundaries used when the portal loads Module 09 first.
const MODULE_ELEVEN_SHARED_CASE = (typeof window !== 'undefined' && window.MISSION_NEXT_M09_EVIDENCE_CONTRACT)
  || { contractVersion: 'm09-ransomware-evidence-v1', organization: 'Mission Next Labs', incidentId: 'INC-4937', title: 'Operation Cedar Lock — active ransomware response', status: 'contained-in-lab-slice', entities: { endpoint: 'ws-173', account: 'acct-173', fileServer: 'fs-02' }, timeBasis: 'Synthetic UTC training timeline; all addresses are documentation-range fixtures.', notEstablished: ['enterprise-wide compromise', 'data exfiltration', 'specific operator identity'], consumerSlices: { module11: ['M09-E01', 'M09-E03', 'M09-E06', 'M09-E07', 'M09-E08'] } };
const MODULE_ELEVEN_SHARED_SLICE_IDS = MODULE_ELEVEN_SHARED_CASE.consumerSlices?.module11 || ['M09-E01', 'M09-E03', 'M09-E06', 'M09-E07', 'M09-E08'];

// Standard ITSM Incident Ticket (docs/specs/MODULE_STANDARD.md §7.2) for the
// Assessment Lab's Prove It submission. Authored from the shared M09
// evidence contract this module consumes (MODULE_ELEVEN_SHARED_CASE):
// INC-4937, the ws-173/acct-173 endpoint-and-identity compromise, with
// fs-02 as the bounded file-server impact. Answer key stays here, never
// shown live in Prove It.
const MODULE_ELEVEN_CASE = {
  caseId: 'OPS-5511',
  userOptions: [
    { id: 'acct-173', text: 'acct-173', tier: 'principal' },
    { id: 'svc-fs02', text: 'svc-fs02', tier: 'pivot' },
    { id: 'acct-091', text: 'acct-091', tier: 'noise' },
    { id: 'acct-204', text: 'acct-204', tier: 'noise' },
    { id: 'm.reyes', text: 'm.reyes', tier: 'noise' },
    { id: 'svc-backup', text: 'svc-backup', tier: 'noise' },
  ],
  deviceOptions: [
    { id: 'ws-173', text: 'ws-173', tier: 'principal' },
    { id: 'fs-02', text: 'fs-02', tier: 'pivot' },
    { id: 'ws-118', text: 'ws-118', tier: 'noise' },
    { id: 'ws-204', text: 'ws-204', tier: 'noise' },
    { id: 'srv-print-01', text: 'srv-print-01', tier: 'noise' },
    { id: 'ws-091', text: 'ws-091', tier: 'noise' },
  ],
  departmentOptions: [
    { id: 'tier2-soc', text: 'Tier 2 SOC — Incident Response', fit: 100 },
    { id: 'identity-response', text: 'Identity Response', fit: 60,
      note: 'Identity Response can act on acct-173, but the shared slice also shows fs-02 service disruption it has no authority over — Tier 2 SOC owns both legs together.' },
    { id: 'endpoint-edr', text: 'Endpoint / EDR Team', fit: 55,
      note: 'EDR can act on ws-173, but can’t revoke the overlapping acct-173 session on its own — Tier 2 SOC coordinates both actions.' },
    { id: 'help-desk', text: 'Help Desk', fit: 5,
      bounce: 'Help Desk can’t act on a confirmed incident with service impact — this needs Tier 2 SOC’s incident-response authority.' },
  ],
  correctStatus: 'in-progress',
  correctSeverity: 'high',
  correctAffectedUser: 'acct-173',
  correctAffectedDevice: 'ws-173',
  correctDisposition: 'true-positive',
  correctEscalation: 'required',
  correctEscalateTo: 'tier2-soc',
  departmentBounceThreshold: 40,
};

function moduleElevenCaseSpec() {
  const labsReady = missionNextAllLabsComplete(moduleElevenReportState.labProgress, ['assessment-1', 'additional-1', 'additional-2']);
  return {
    caseId: MODULE_ELEVEN_CASE.caseId,
    userOptions: MODULE_ELEVEN_CASE.userOptions,
    deviceOptions: MODULE_ELEVEN_CASE.deviceOptions,
    departmentOptions: MODULE_ELEVEN_CASE.departmentOptions,
    notesPlaceholder: 'Summarize the operational-metrics signal, the shared-case evidence it corresponds to, and your recommended escalation/closure…',
    extraMissing: labsReady ? [] : ['Mark all required labs above complete'],
    disabled: moduleElevenReportState.submitted === true,
  };
}

// Prove It scoring: same weighting model as Module 01/10 (entity tiers 20,
// severity 15, disposition 20, escalation/routing up to 35, notes 10).
function moduleElevenCasePerformance() {
  const state = moduleElevenReportState;
  const lab = MODULE_ELEVEN_CASE;
  const spec = moduleElevenCaseSpec();
  const department = lab.departmentOptions.find((option) => option.id === state.escalateTo) || null;
  const escalationRequiredOk = state.escalation === 'required';
  const bounced = escalationRequiredOk && department && department.fit < lab.departmentBounceThreshold;

  const missing = caseRecordMissing(state, spec);

  const userTier = lab.userOptions.find((entry) => entry.id === state.affectedUser)?.tier;
  const deviceTier = lab.deviceOptions.find((entry) => entry.id === state.affectedDevice)?.tier;
  const tierFit = (tier) => (tier === 'principal' ? 1 : tier === 'pivot' ? 0.5 : 0);
  const entityPoints = Math.round((tierFit(userTier) + tierFit(deviceTier)) * 10);

  const severity = caseRecordSeverity(state) === lab.correctSeverity ? 15 : 0;
  const disposition = caseRecordDisposition(state) === lab.correctDisposition ? 20 : 0;
  const escalation = escalationRequiredOk && department && !bounced ? Math.round((department.fit / 100) * 35) : 0;
  const notesLen = (state.notes || '').trim().length;
  const notes = Math.round(Math.min(1, notesLen / 80) * 10);
  const score = entityPoints + severity + disposition + escalation + notes;
  const criticalErrors = state.escalation === 'not-required' ? ['escalation-not-required'] : [];

  const entityFeedback = entityPoints >= 20
    ? 'Affected entity/scope: correct — the confirmed account and endpoint.'
    : entityPoints > 0
      ? 'Affected entity/scope: partial credit — a related entity is supported by the shared case slice, but acct-173/ws-173 is the confirmed affected user/device.'
      : 'Affected entity/scope: review — acct-173/ws-173 is the confirmed affected user/device, per the shared M09 evidence contract.';
  const routingFeedback = !escalationRequiredOk
    ? 'Routing: not applicable — escalation was set to not required.'
    : !department
      ? 'Routing: review — this case needs a department routed with the recorded evidence.'
      : department.fit >= 100
        ? `Routing: correct — ${department.text} is the best-fit department for this case.`
        : department.fit >= lab.departmentBounceThreshold
          ? `Routing: accepted, but not the best fit — ${department.note}`
          : `Routing: returned — ${department.bounce || department.note}`;

  return {
    missing,
    score,
    breakdown: { affected_entity: entityPoints, severity, disposition, escalation, analyst_notes: notes },
    department, bounced,
    feedback: [
      entityFeedback,
      severity ? 'Severity: correct.' : 'Severity: review — the bounded impact statement supports High severity.',
      disposition ? 'Disposition: correct.' : 'Disposition: review — the shared slice supports confirmed malicious activity.',
      routingFeedback,
    ],
    criticalErrors,
  };
}

function moduleElevenCaseReviewStatus() {
  if (!moduleElevenReportState?.submitted) return '';
  const attempt = moduleElevenUser?.latestLabAttemptByKey?.[MODULE_ELEVEN_REPORT_CATALOG_KEY];
  return attempt?.reviewedAt && !attempt.redoRequested ? 'graded' : 'review';
}

function moduleElevenCaseRedoRequested() {
  return moduleElevenUser?.openLabRedosByModuleKey?.['soc-11']?.labKey === MODULE_ELEVEN_REPORT_CATALOG_KEY;
}

function moduleElevenCaseRedoFeedback() {
  if (!moduleElevenCaseRedoRequested()) return '';
  const items = moduleElevenUser.openLabRedosByModuleKey['soc-11'].feedback || [];
  return `<div class="m01-redo-feedback" role="note">
    <strong><i class="ri-feedback-line" aria-hidden="true"></i> Instructor feedback</strong>
    ${items.length
      ? `<ul>${items.map((item) => `<li>${item.item_label ? `<strong>${esc(item.item_label)}:</strong> ` : ''}${esc(item.comment || '')}</li>`).join('')}</ul>`
      : '<p>Your instructor returned this case without written notes. Use Message Instructor if you are not sure what to change.</p>'}
  </div>`;
}

let moduleElevenQuizState = null;
// Set when the learner explicitly asks to retake a knowledge check that the
// account already records as passed (see moduleElevenQuizVerifiedElsewhere()).
let moduleElevenQuizForceRetake = false;
let moduleElevenMetricsState = null;
let moduleElevenReportState = null;
let moduleElevenUser = null;
let moduleElevenReviewMode = false;

function moduleElevenMetricsFreshDefaults() {
  return {
    practiceComplete: false, practiceNotes: '', feedback: [], validationError: '', lastSubmittedAt: '', labProgress: {},
  };
}

function moduleElevenReportFreshDefaults() {
  return {
    notes: '', attempts: 0, completed: false, feedback: [], validationError: '', lastSubmittedAt: '', labProgress: {},
    // Standard case-record ticket fields (docs/specs/MODULE_STANDARD.md §7.2).
    submitted: false, status: '', severity: '', affectedUser: '', affectedDevice: '',
    disposition: '', escalation: '', escalateTo: '', findings: {}, actionHistory: [],
    score: null, breakdown: null, showMissing: false,
  };
}

function moduleElevenLoad(user) {
  if (moduleElevenUser?.email !== user?.email) moduleElevenQuizForceRetake = false;
  moduleElevenUser = user;
  moduleElevenMetricsState = LabRuntime.loadCaseState(MODULE_ELEVEN_METRICS_LAB_ID, 'soc-11', user, moduleElevenMetricsFreshDefaults());
  moduleElevenReportState = LabRuntime.loadCaseState(MODULE_ELEVEN_REPORT_LAB_ID, 'soc-11', user, moduleElevenReportFreshDefaults());
  ['feedback', 'flags'].forEach((key) => {
    if (!Array.isArray(moduleElevenMetricsState[key])) moduleElevenMetricsState[key] = [];
  });
  ['feedback', 'flags'].forEach((key) => {
    if (!Array.isArray(moduleElevenReportState[key])) moduleElevenReportState[key] = [];
  });
  if (typeof moduleElevenMetricsState.practiceNotes !== 'string') moduleElevenMetricsState.practiceNotes = '';
  if (typeof moduleElevenReportState.notes !== 'string') moduleElevenReportState.notes = '';
  if (!moduleElevenMetricsState.labProgress || typeof moduleElevenMetricsState.labProgress !== 'object') moduleElevenMetricsState.labProgress = {};
  if (!moduleElevenReportState.labProgress || typeof moduleElevenReportState.labProgress !== 'object') moduleElevenReportState.labProgress = {};
  // Case-record migration: default any field an older saved attempt never
  // had, and treat any already-completed old-form attempt as submitted so
  // it keeps rendering "Lab Under Review" / "Lab Graded" rather than
  // re-opening a blank ticket.
  if (!moduleElevenReportState.findings || typeof moduleElevenReportState.findings !== 'object') moduleElevenReportState.findings = {};
  if (!Array.isArray(moduleElevenReportState.actionHistory)) moduleElevenReportState.actionHistory = [];
  ['status', 'severity', 'affectedUser', 'affectedDevice', 'disposition', 'escalation', 'escalateTo'].forEach((key) => {
    if (typeof moduleElevenReportState[key] !== 'string') moduleElevenReportState[key] = '';
  });
  if (typeof moduleElevenReportState.submitted !== 'boolean') moduleElevenReportState.submitted = false;
  if (typeof moduleElevenReportState.showMissing !== 'boolean') moduleElevenReportState.showMissing = false;
  if (moduleElevenReportState.completed && !moduleElevenReportState.submitted) moduleElevenReportState.submitted = true;

  // Initialize quiz state
  if (!moduleElevenQuizState) {
    const previousQuestionIds = moduleElevenMetricsState.lastQuizQuestionIds || [];
    const selection = selectQuizQuestions(MODULE_ELEVEN_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    moduleElevenQuizState = {
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

  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'soc-analyst', 'soc-11');
}

function moduleElevenSaveMetrics() {
  if (moduleElevenUser && moduleElevenMetricsState) LabRuntime.saveCaseState(MODULE_ELEVEN_METRICS_LAB_ID, 'soc-11', moduleElevenUser, moduleElevenMetricsState);
}

function moduleElevenSaveReport() {
  if (moduleElevenUser && moduleElevenReportState) LabRuntime.saveCaseState(MODULE_ELEVEN_REPORT_LAB_ID, 'soc-11', moduleElevenUser, moduleElevenReportState);
}

function moduleElevenSaveQuiz() {
  if (moduleElevenUser && moduleElevenQuizState && moduleElevenMetricsState) {
    moduleElevenMetricsState.lastQuizQuestionIds = moduleElevenQuizState.selectedQuestions.map((s) => s.question.id);
    LabRuntime.saveCaseState(MODULE_ELEVEN_METRICS_LAB_ID, 'soc-11', moduleElevenUser, moduleElevenMetricsState);
  }
}

function moduleElevenQuizQuestion(selected, index) {
  const question = selected.question;
  const userAnswerId = moduleElevenQuizState?.answers?.[question.id];
  return `<fieldset class="m11-quiz-question" data-question-id="${esc(question.id)}">
    <legend><span>${index + 1}</span> ${esc(selected.conceptTitle)}: ${esc(question.prompt)}</legend>
    <div class="m11-quiz-options">
      ${selected.shuffledOptions.map((option) => `<label>
        <input type="radio" name="q-${esc(question.id)}" value="${esc(option.id)}" ${userAnswerId === option.id ? 'checked' : ''} data-m11-quiz-answer />
        <span>${esc(option.text)}</span>
      </label>`).join('')}
    </div>
  </fieldset>`;
}

// A knowledge check can read complete on the account (server-verified module,
// synced quiz detail, or knowledge-check evidence) while this browser holds no
// answers — another device did the work, or an admin override set it. Show a
// verified summary instead of a blank 0/N form; never fabricate answers.
function moduleElevenQuizVerifiedElsewhere() {
  if (moduleElevenQuizForceRetake || !moduleElevenQuizState || moduleElevenQuizState.scored) return false;
  if (Object.keys(moduleElevenQuizState.answers || {}).length > 0) return false;
  return moduleElevenUser?.remoteVerifiedModuleProgress?.['soc-11'] === true
    || moduleElevenUser?.remoteModuleDetail?.['soc-11']?.quizPassed === true
    || moduleElevenUser?.remoteModuleEvidence?.['soc-11']?.['knowledge-check'] === true;
}

function moduleElevenQuizPanel() {
  if (!moduleElevenQuizState?.selectedQuestions || moduleElevenQuizState.selectedQuestions.length === 0) {
    return `<div class="m11-quiz-empty" id="m11-quiz-feedback" role="status">Loading quiz…</div>`;
  }
  if (moduleElevenQuizVerifiedElsewhere()) {
    return `<form class="m11-quiz-form mf-quiz-form" id="m11-quiz-form" novalidate><section class="mf-score is-pass" id="m11-quiz-feedback" tabindex="-1" aria-live="polite"><p class="mf-kicker">Module knowledge check</p><h3>Already verified complete</h3><p>This knowledge check is recorded as passed on your account. It is never re-answered automatically on a new device or browser, so nothing is shown here that wasn't actually submitted.</p><button type="button" class="mf-score-retake" data-m11-quiz-retake>Retake this knowledge check</button></section></form>`;
  }

  const selected = moduleElevenQuizState.selectedQuestions;
  const answered = Object.keys(moduleElevenQuizState.answers || {}).length;
  const total = selected.length;

  let feedbackHtml = '';
  if (moduleElevenQuizState.scored) {
    const passed = moduleElevenQuizState.score >= 70;
    feedbackHtml = `<section class="m11-quiz-score mf-score ${passed ? 'm11-quiz-pass is-pass' : 'm11-quiz-remediate is-remediate'}" id="m11-quiz-feedback" tabindex="-1" aria-live="polite">
      <div class="m11-quiz-score-heading">
        <div>
          <p class="m11-kicker">Attempt ${moduleElevenQuizState.attempts} · best ${moduleElevenQuizState.bestScore}/100</p>
          <h3>${moduleElevenQuizState.score}/100 — ${passed ? 'Knowledge check passed' : 'Review and retry'}</h3>
        </div>
        <span>${moduleElevenQuizState.score}</span>
      </div>
      <ul class="m11-quiz-feedback-list">
        ${(moduleElevenQuizState.feedback || []).map((fb) => `<li class="${fb.correct ? 'm11-quiz-feedback-correct' : 'm11-quiz-feedback-incorrect'}">
          <i class="ri-${fb.correct ? 'checkbox-circle-fill' : 'information-line'}" aria-hidden="true"></i>
          <div>
            <strong>${fb.questionId}</strong>
            <p>${esc(fb.message)}</p>
          </div>
        </li>`).join('')}
      </ul>
      ${!passed ? `<div class="m11-quiz-actions"><button type="button" class="m11-quiz-retry" data-m11-quiz-retry><i class="ri-refresh-line" aria-hidden="true"></i> Try different questions</button></div>` : ''}
    </section>`;
  } else if (answered === total) {
    feedbackHtml = `<div class="m11-quiz-ready" id="m11-quiz-feedback" role="status">All questions answered. Submit to check your responses.</div>`;
  } else {
    feedbackHtml = `<div class="m11-quiz-empty" id="m11-quiz-feedback" role="status">Answer all ${total} questions to submit.</div>`;
  }

  return `<form class="m11-quiz-form mf-quiz-form" id="m11-quiz-form" novalidate>
    <div class="m11-panel-heading mf-panel-heading"><div><p class="m11-kicker mf-kicker">Knowledge check</p><h3 id="m11-quiz-title" tabindex="-1">Test your understanding of SOC operations and reporting</h3></div><span>${answered}/${total} answered</span></div>
    ${selected.map((sel, idx) => moduleElevenQuizQuestion(sel, idx)).join('')}
    <div class="m11-quiz-actions">
      <button class="m11-quiz-submit" type="submit" ${answered < total ? 'disabled' : ''}>
        <i class="ri-checkbox-circle-line" aria-hidden="true"></i> Check my answers
      </button>
    </div>
    ${feedbackHtml}
  </form>`;
}

function moduleElevenRenderQuiz(focusId) {
  const form = document.getElementById('m11-quiz-form');
  if (!form) return;
  form.innerHTML = moduleElevenQuizPanel();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function wireModuleElevenQuiz() {
  const form = document.getElementById('m11-quiz-form');
  if (!form || !moduleElevenQuizState) return;

  form.addEventListener('change', (event) => {
    if (!event.target.hasAttribute('data-m11-quiz-answer')) return;
    const questionId = event.target.closest('[data-question-id]')?.dataset.questionId;
    if (questionId) {
      moduleElevenQuizState.answers[questionId] = event.target.value;
      moduleElevenSaveQuiz();
      moduleElevenRenderQuiz();
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const result = scoreQuizAttempt(moduleElevenQuizState.selectedQuestions, moduleElevenQuizState.questionsByAnswer, moduleElevenQuizState.answers);
    moduleElevenQuizState.attempts += 1;
    moduleElevenQuizState.score = result.score;
    moduleElevenQuizState.bestScore = Math.max(moduleElevenQuizState.bestScore || 0, result.score);
    moduleElevenQuizState.feedback = result.feedback;
    moduleElevenQuizState.passed = result.score >= 70;
    moduleElevenQuizState.scored = true;
    if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(moduleElevenUser, 'soc-11-knowledge-check', {
        state: moduleElevenQuizState.passed ? 'complete' : 'in_progress',
        score: result.score,
      });
    }
    moduleElevenSaveQuiz();
    moduleElevenRenderQuiz('m11-quiz-feedback');
  });

  form.addEventListener('click', (event) => {
    if (event.target.closest('[data-m11-quiz-retake]')) {
      event.preventDefault();
      moduleElevenQuizForceRetake = true;
      form.innerHTML = moduleElevenQuizPanel();
      return;
    }
    if (!event.target.closest('[data-m11-quiz-retry]')) return;
    event.preventDefault();
    const previousQuestionIds = moduleElevenQuizState.selectedQuestions.map((s) => s.question.id);
    const selection = selectQuizQuestions(MODULE_ELEVEN_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    moduleElevenQuizState.selectedQuestions = selection.selectedQuestions;
    moduleElevenQuizState.questionsByAnswer = selection.questionsByAnswer;
    moduleElevenQuizState.answers = {};
    moduleElevenQuizState.scored = false;
    moduleElevenSaveQuiz();
    moduleElevenRenderQuiz('m11-quiz-title');
  });
}

function moduleElevenScenarioLoops() {
  return `<section class="m11-loop-grid" aria-label="Module 11 four-part lesson loops">
    <article><p class="m11-kicker">Lesson 1 · Scenario</p><h4>Review health after ${esc(MODULE_ELEVEN_SHARED_CASE.incidentId)} closes</h4><p>Post-closure queue snapshots sit beside the declared ${esc(MODULE_ELEVEN_SHARED_SLICE_IDS.join(', '))} case slice. Decide which signals describe SOC health and which describe incident scope.</p></article>
    <article><p class="m11-kicker">Lesson 1 · Theory</p><h4>Metrics are signals, not proof</h4><p>MTTD, MTTR, SLA, backlog, staffing, and false-positive rate describe operating conditions. Trace trends to a supported driver before connecting them to incident impact.</p></article>
    <article><p class="m11-kicker">Lesson 1 · Knowledge check</p><h4>Source-review reasoning</h4><p>Use the source-review question bank to test whether a metric relationship is supported, correlated, or still unknown.</p></article>
    <article><p class="m11-kicker">Lesson 1 · Applied task</p><h4>Brief the incoming shift</h4><p>Choose the material signals, propose a scoped improvement, name the escalation owner, and write the next verification point.</p></article>
    <article><p class="m11-kicker">Lesson 2 · Scenario</p><h4>Turn the shared slice into an executive brief</h4><p>Read ${esc(MODULE_ELEVEN_SHARED_CASE.incidentId)} through ${esc(MODULE_ELEVEN_SHARED_SLICE_IDS.join(', '))}; the briefing must preserve the bounded impact on ${esc(MODULE_ELEVEN_SHARED_CASE.entities.endpoint)} and the unresolved wider-scope questions.</p></article>
    <article><p class="m11-kicker">Lesson 2 · Theory</p><h4>Audience and accountability</h4><p>Technical notes retain entities and evidence. Executive language states business effect, residual risk, ownership, and next action without attribution or unsupported certainty.</p></article>
    <article><p class="m11-kicker">Lesson 2 · Knowledge check</p><h4>Separate observation from inference</h4><p>Review each shared-ITSM ticket before selecting it. The quiz and evidence table reward bounded statements, not a complete story invented from typical ransomware behavior.</p></article>
    <article><p class="m11-kicker">Lesson 2 · Applied task</p><h4>Deliver the independent report</h4><p>Write the case note, executive summary, escalation request, and closure conditions from the shared slice. Keep unknowns and the monitoring owner visible.</p></article>
    <article><p class="m11-kicker">Lesson 3 · Scenario</p><h4>Close the communication loop</h4><p>Leadership needs a concise status after containment, while the SOC needs a measurable control-improvement handoff.</p></article>
    <article><p class="m11-kicker">Lesson 3 · Theory</p><h4>Closure needs verification and ownership</h4><p>Containment is not closure. Confirm recovery, review monitoring results, record residual uncertainty, and assign a named control owner with a due point.</p></article>
    <article><p class="m11-kicker">Lesson 3 · Knowledge check</p><h4>Test the closure claim</h4><p>Use the randomized reasoning quiz and source list to reject premature closure, unsupported exfiltration claims, and role-only escalation.</p></article>
    <article><p class="m11-kicker">Lesson 3 · Applied task</p><h4>State the decision and next review</h4><p>Translate the same bounded facts into an audience-appropriate closure note with a condition that can be checked on the next review.</p></article>
    <p class="m11-crosswalk-note"><strong>Supplementary draft crosswalk:</strong> this module primarily relates to Security+ SY0-701 Domain 5 (Security Program Management) with secondary Domain 4 (Security Operations). It is a developer-authored mapping pending curriculum/compliance/faculty review, not an approval, certification, affiliation, or pass guarantee.</p>
  </section>`;
}

function moduleElevenVideoScript() {
  return '';
}

function moduleElevenReview() {
  return `<section class="m11-review-section"><h3>Module concepts at a glance</h3><ul><li><strong>Operational metrics vs. incident proof:</strong> A rising MTTD or SLA miss is an operational signal, not direct evidence of a breach. Investigate the signal's root cause before linking it to incident scope.</li><li><strong>Traceability:</strong> When a metric trend occurs, trace it to a specific controllable driver—a rule change, staffing change, or alert-generation threshold. Targeted fixes preserve coverage better than broad disables.</li><li><strong>Audience-appropriate communication:</strong> Technical case notes document entities, actions, and evidence. Executive summaries state business impact, affected scope, residual risk, and next steps in plain language. Write both.</li><li><strong>Escalation accountability:</strong> Escalate upward with quantified risk, a hypothesis, and a specific request to named decision-makers. Broadcast to peers or uncontrolled groups is not escalation.</li><li><strong>Closure discipline:</strong> Close only after verified recovery, a clean monitoring window, and an assigned control owner with a deadline. Closure on containment alone is premature.</li></ul><h3>Before you continue</h3><p>You are ready for Module 12 if you can: distinguish operational signals from incident findings; trace a metrics trend to its controllable driver; rewrite technical evidence as a business-language summary; escalate a decision or action to a named owner with a clear request; and plan case closure with monitoring and control ownership attached. Use your labs to practice each skill and ask for feedback on your handoff notes and executive summaries.</p></section>`;
}

function moduleElevenGetSections() {
  return [
    { id: 'lecture', title: 'Lecture', type: 'lecture', isComplete: true, scrollId: 'm11-lecture' },
    { id: 'knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: moduleElevenQuizState?.passed, scrollId: 'm11-knowledge-check' },
    { id: 'guided-lab', title: 'Guided Lab', type: 'lab', isComplete: moduleElevenMetricsState.practiceComplete, scrollId: 'm11-guided-lab' },
    { id: 'assessment-lab', title: 'Assessment Lab', type: 'review', isComplete: moduleElevenReportState.completed, scrollId: 'm11-assessment-lab' },
    { id: 'review', title: 'Module Review', type: 'review', isComplete: true, scrollId: 'm11-review' },
    { id: 'sources', title: 'Sources & Further Reading', type: 'read', isComplete: null, scrollId: 'm11-sources-section', gated: false, supplemental: true },
  ];
}

function moduleElevenGetQuickNavItems() {
  const sections = moduleElevenGetSections();
  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    kind: section.type,
    isComplete: section.isComplete,
    scrollId: section.scrollId,
  }));
}


function moduleElevenGuidedLabPanel() {
  const moduleLab = LABS.find((item) => item.key === MODULE_ELEVEN_METRICS_CATALOG_KEY);
  return `<section class="m11-external-lab" id="m11-guided-lab-panel">
    <p class="m11-panel-instruction">Launch the imported Active Directory monitoring project below and work through its guided tasks on this page. When you're done, note what you found and mark the Guided Lab complete.</p>
    ${missionNextLabLaunchGroup(11, 'guided', [{ title: 'Active Directory Monitoring with Grafana', detail: `${formatInstructionalMinutes(moduleLab?.instructionalMinutes)} allocated. Imported Active Directory monitoring project.`, href: 'imported-labs/mission-next-labs/index.html#/track/active-directory/project/ad-1/lab', labId: 'guided-1', requireNote: true }], moduleElevenMetricsState.labProgress)}
    <label class="m11-text-label" for="m11-practice-notes">Working notes (optional)</label>
    <p class="m11-field-help">What did you find? Any blockers?</p>
    <textarea id="m11-practice-notes" rows="4" maxlength="900" data-m11-practice-notes placeholder="What did you find? Any blockers?">${esc(moduleElevenMetricsState.practiceNotes)}</textarea>
    <div class="m11-actions"><button type="button" class="m11-submit" data-m11-practice-complete>${moduleElevenMetricsState.practiceComplete ? 'Guided Lab marked complete' : 'Mark Guided Lab complete'}</button></div>
  </section>`;
}

function moduleElevenAssessmentLabPanel() {
  const scored = moduleElevenReportState.assessmentScore;
  return `<section class="m11-external-lab" id="m11-assessment-lab-panel">
    <p class="m11-panel-instruction">Complete the scored shift assessment in the Operations and Reporting tabs, then submit your work. Imported practice is listed separately under Optional Labs.</p>
    ${scored ? `<section class="m04-assessment-review"><h3>Shift assessment result</h3><p><strong>${esc(scored.score)}/${esc(scored.maxScore)} points</strong> · ${scored.passed ? 'Passed' : 'Review and improve'}</p></section>` : '<p><button type="button" data-m11-submit-score>Submit shift assessment</button></p>'}
  </section>`;
}

function moduleElevenAdditionalLabs() {
  return missionNextLabLaunchGroup(11, 'additional', [
    { title: 'Visualizing Active Directory Performance Metrics with Cacti', detail: 'Optional dashboard and reporting practice', href: 'imported-labs/mission-next-labs/index.html#/track/active-directory/project/ad-7/lab', labId: 'assessment-1', requireNote: true },
    { title: 'Real-time Active Directory Metrics with Datadog', detail: 'Operational monitoring and metric context', href: 'imported-labs/mission-next-labs/index.html#/track/active-directory/project/ad-3/lab', labId: 'additional-1', requireNote: true },
    { title: 'Active Directory Performance Monitoring with Checkmk', detail: 'Service checks and monitoring ownership', href: 'imported-labs/mission-next-labs/index.html#/track/active-directory/project/ad-5/lab', labId: 'additional-2', requireNote: true },
  ], moduleElevenReportState.labProgress);
}

// The shift assessment uses the same Module 3 console shell as the earlier
// investigations. Operational actions and audience-specific reporting live
// in dedicated console tabs and are persisted by the append-only M11 engine.
function moduleElevenConsoleData() {
  const s = SocM11AssessmentData.scenario;
  const events = s.queue.map((item, index) => m03eRow('AlertQueue', item.id, item.createdAt.slice(0, 10), item.createdAt.slice(11, 19), {
    EventType: item.kind, Host: item.title, Account: item.assigneeId || 'unassigned', Result: item.status,
    Severity: item.severity, RuleId: item.ruleId, BusinessImpact: item.businessImpact,
    Detail: `SLA ${item.slaMinutes} minutes; queue position ${index + 1}`,
  })).concat(s.incident.recoveryEvidence.map((e) => m03eRow('RecoveryRecords', e.id, e.time.slice(0, 10), e.time.slice(11, 19), {
    EventType: 'RecoveryValidation', Host: e.id === 'M11-REC-04' ? 'fs-02' : 'ws-173', Account: 'soc-analyst', Result: e.status, Detail: e.summary,
  })));
  return m03eBuildDataset({ caseId: s.caseId, day: s.start.slice(0, 10), events,
    identities: s.analysts.map((a) => ({ Account: a.id, DisplayName: a.name, Type: a.role, Department: 'SOC', Owner: a.name, Privileged: 'No', UsualSourceIp: '—' })),
    ips: [], watchlists: { Rules: { title: 'Detection rules', rows: s.rules.map((r) => ({ RuleId: r.id, Rule: r.name, Owner: r.owner })) },
      RecoveryEvidence: { title: 'Recovery evidence', rows: s.incident.recoveryEvidence.map((e) => ({ EvidenceId: e.id, Time: e.time, Status: e.status, Summary: e.summary })) } },
    alerts: s.queue.map((item) => ({ id: item.id, time: item.createdAt, severity: item.severity, title: item.title, entities: s.incident.entities, rule: item.ruleId, query: `AlertQueue\n| where EventId == "${item.id}"` })), now: s.end,
  });
}
function moduleElevenToolFixtures(data) {
  const s = SocM11AssessmentData.scenario;
  const evidence = s.incident.recoveryEvidence.map((e) => ({ id: e.id, type: 'recovery_record', time: e.time, entityId: e.id === 'M11-REC-04' ? 'fs-02' : 'ws-173', summary: e.summary }));
  const m10Artifacts = s.incident.recoveryEvidence.map((e, i) => ({ id: e.id, type: 'recovery_record', time: e.time, host: e.id === 'M11-REC-04' ? 'fs-02' : 'ws-173', account: 'soc-analyst', title: e.summary, source: 'Recovery validation record', methods: ['log_export'], sourceHash: String(i + 1).repeat(64), verificationHash: String(i + 1).repeat(64), detail: e.summary }));
  return {
    m04: SocConsoleTools.m04Fixture({ id: s.id, caseId: s.caseId, end: s.end, data }),
    m05: SocConsoleTools.m05Fixture({ id: s.id, stateKey: 'm11-endpoint-tools-v1', devices: s.incident.entities.filter((x) => x.startsWith('ws-') || x.startsWith('fs-')).map((id) => ({ id, hostname: id, platform: 'Windows', role: id === 'fs-02' ? 'File service' : 'Workstation', owner: 'SOC', zone: 'CORP', status: 'Recovered / validation pending' })), data }),
    m06: SocConsoleTools.m06Fixture({ id: s.id, lead: { id: 'M11-LEAD-001', type: 'recovery_review', device: 'ws-173', account: 'acct-173', taskName: 'Recovery validation', observation: s.incident.containment }, devices: ['ws-173', 'fs-02'], data, timeStart: s.start, timeEnd: s.end }),
    m07: SocConsoleTools.m07Fixture({ id: s.id, stateKey: 'm11-mail-tools-v1', start: s.start, end: s.end }),
    m08: SocConsoleTools.m08Fixture({ id: s.id, stateKey: 'm11-exposure-tools-v1', start: s.start, end: s.end }),
    m09: SocConsoleTools.m09Fixture({ id: s.id, stateKey: 'm11-response-tools-v1', start: s.start, end: s.end,
      incident: { id: s.incident.id, title: s.incident.title, reportedAt: s.start, sourceEntityId: 'ws-173', sourceEvidenceId: 'M11-REC-01', summary: s.incident.containment },
      entities: [{ id: 'ws-173', type: 'endpoint', hostname: 'ws-173', ownerAccountId: 'acct-173', status: 'isolated' }, { id: 'acct-173', type: 'identity', displayName: 'acct-173', status: 'active' }, { id: 'fs-02', type: 'file_service', hostname: 'fs-02', status: 'validation_pending' }],
      edges: [{ from: s.incident.id, to: 'ws-173', relation: 'contained', evidenceId: 'M11-REC-01' }, { from: s.incident.id, to: 'acct-173', relation: 'session_overlap', evidenceId: 'M11-REC-05' }], evidence }),
    m10: { schemaVersion: 1, scenario: { id: s.id, caseId: s.caseId, incidentId: s.incident.id, stateKey: 'm11-evidence-locker-v1', start: s.start, end: s.end, fixedAt: s.end, containedAt: s.start,
      request: { id: 'REQ-INC-4937', from: 'Incident lead', receivedAt: s.start, text: 'Preserve recovery and scope records with defensible custody; distinguish completed recovery checks from pending owner validation.' },
      custodians: [{ id: 'soc-analyst', label: 'SOC analyst' }, { id: 'service-owner', label: 'Service owner' }, { id: 'identity-owner', label: 'Identity owner' }], artifacts: m10Artifacts } },
  };
}

function moduleElevenOpsHtml() {
  const s = SocM11AssessmentData.scenario; const state = moduleElevenOpsState;
  const metrics = SocM11AssessmentMetrics.compute(SocM11AssessmentData, state);
  const itemOptions = s.queue.map((x) => `<option value="${esc(x.id)}">${esc(x.id)} · ${esc(x.title)}</option>`).join('');
  const analystOptions = s.analysts.map((x) => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');
  const ownerOptions = [...s.analysts.map((x) => ({ id: x.id, name: x.name })), ...s.ownerIds.map((id) => ({ id, name: id }))].map((x) => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');
  return `<section class="m03-console-extra"><h3>Shift Operations</h3><p>Prioritize the live queue, assign work, and record the handoff for the incoming shift.</p>
    <form data-m11-operation="priority"><label>Priority order (highest first)<input name="order" required placeholder="Q-03, Q-02, Q-04"></label><button>Save order</button></form>
    <form data-m11-operation="assign"><label>Queue item<select name="itemId">${itemOptions}</select></label><label>Assign to<select name="analystId">${analystOptions}</select></label><button>Assign</button></form>
    <form data-m11-operation="escalate"><label>Queue item<select name="itemId">${itemOptions}</select></label><label>Route<select name="route">${s.escalationRoutes.map((r) => `<option value="${esc(r.id)}">${esc(r.label)}</option>`).join('')}</select></label><label>Reason<textarea name="reason" required minlength="10"></textarea></label><button>Escalate</button></form>
    <form data-m11-operation="metrics"><label>Metric interpretation<textarea name="text" required minlength="40"></textarea></label><button>Record interpretation</button></form>
    <form data-m11-operation="noise"><label>Rule<select name="ruleId">${s.rules.map((r) => `<option value="${esc(r.id)}">${esc(r.id)} · ${esc(r.name)}</option>`).join('')}</select></label><label>Rationale<textarea name="rationale" required minlength="10"></textarea></label><label>Improvement<textarea name="improvement" required minlength="20"></textarea></label><button>Flag rule</button></form>
    <form data-m11-operation="handoff"><label>Summary<textarea name="summary" required minlength="40"></textarea></label><label>Open items (comma separated IDs)<input name="openItems" required placeholder="Q-01, Q-02, Q-03, Q-04"></label><label>Risks<textarea name="risks" required></textarea></label><label>Next actions<textarea name="nextActions" required></textarea></label><button>Save handoff</button></form>
    <form data-m11-operation="followup"><label>Title<input name="title" required minlength="5"></label><label>Kind<select name="kind"><option value="follow_up">Follow up</option><option value="lesson">Lesson learned</option><option value="detection">Detection improvement</option></select></label><label>Owner<select name="ownerId">${ownerOptions}</select></label><label>Due date<input name="dueDate" type="date" min="${esc(s.start.slice(0, 10))}" max="${esc(SocM11AssessmentData.expectedTruth.dueBy)}" required></label><label>Evidence<select name="evidenceId"><option value="">None</option>${s.incident.recoveryEvidence.map((e) => `<option value="${esc(e.id)}">${esc(e.id)}</option>`).join('')}</select></label><button>Add action</button></form>
    <h4>Shift metrics · ${esc(metrics.at)}</h4><div class="m03e-table-wrap"><table class="m03e-table"><thead><tr><th>Measure</th><th>Value</th><th>Interpretation boundary</th></tr></thead><tbody>
      <tr><td>Alert volume</td><td>${esc(metrics.alertVolume)}</td><td>One fixed synthetic shift</td></tr>
      <tr><td>Mean time to acknowledge</td><td>${esc(metrics.mttaMinutes)} min</td><td>Dispositioned/acknowledged items only</td></tr>
      <tr><td>Mean time to contain</td><td>${esc(metrics.mttrMinutes)} min</td><td>Recorded containment timestamps only</td></tr>
      <tr><td>Open backlog</td><td>${esc(metrics.backlog)}</td><td>Closed records excluded</td></tr>
      <tr><td>Unassigned open work</td><td>${esc(metrics.unassigned)}</td><td>Assignment updates reflect in workload below</td></tr></tbody></table></div>
    <h4>SLA and queue</h4><div class="m03e-table-wrap"><table class="m03e-table"><thead><tr><th>Item</th><th>Priority / impact</th><th>Assignee</th><th>Elapsed / SLA</th><th>Status</th></tr></thead><tbody>${metrics.queue.map((item) => `<tr><td>${esc(item.id)} · ${esc(item.title)}</td><td>${esc(item.severity)} / ${esc(item.businessImpact)}</td><td>${esc(item.assigneeId || 'Unassigned')}</td><td>${esc(item.ageMinutes)} / ${esc(item.slaMinutes)} min</td><td>${esc(item.sla)}</td></tr>`).join('')}</tbody></table></div>
    <h4>Rule noise and analyst workload</h4><div class="m03e-table-wrap"><table class="m03e-table"><thead><tr><th>Rule</th><th>Alerts</th><th>Dispositioned</th><th>Non-true-positive rate</th></tr></thead><tbody>${metrics.ruleNoise.map((item) => `<tr><td>${esc(item.ruleId)} · ${esc(item.name)}</td><td>${esc(item.alerts)}</td><td>${esc(item.dispositioned)}</td><td>${item.nonTruePositiveRate === null ? 'Not enough dispositions' : `${esc(Math.round(item.nonTruePositiveRate * 100))}%`}</td></tr>`).join('')}</tbody></table></div>
    <ul>${metrics.workload.map((item) => `<li>${esc(item.name)}: ${esc(item.openItems)}/${esc(item.capacity)} open${item.overCapacity ? ' · over capacity' : ''}</li>`).join('')}</ul>
    <p>${metrics.caveats.map(esc).join(' ')}</p><p role="status">${state.actionHistory.length} operational actions saved.</p></section>`;
}

function moduleElevenReportingHtml() {
  const s = SocM11AssessmentData.scenario; const state = moduleElevenOpsState;
  const fieldNames = [['summary','Summary'],['confirmedScope','Confirmed scope'],['unknowns','Unknowns'],['businessImpact','Business impact'],['containmentStatus','Containment status'],['recoveryStatus','Recovery status'],['residualRisk','Residual risk']];
  return `<section class="m03-console-extra"><h3>Reporting and Closure</h3><p>Write a bounded report for each audience. Include recovery limits and named follow-up owners before deciding whether the incident can close.</p>
    ${['technical','executive','escalation','closure'].map((kind) => `<form data-m11-report="${kind}"><h4>${kind[0].toUpperCase()+kind.slice(1)} report</h4>${fieldNames.map(([name,label]) => `<label>${label}<textarea name="${name}" ${name === 'summary' ? 'required minlength="20"' : ''}>${esc(state.reports?.[kind]?.[name] || '')}</textarea></label>`).join('')}<button>Save ${kind} report</button></form>`).join('')}
    <form data-m11-operation="closure"><label>Decision<select name="decision"><option value="retain">Retain open</option><option value="close">Close</option></select></label><label>Rationale<textarea name="rationale" required minlength="30"></textarea></label><label>Recovery evidence<input name="evidenceIds" placeholder="M11-REC-04, M11-REC-05"></label><button>Record closure decision</button></form>
    <p role="status">${state.actionHistory.length} actions saved. Assessment scoring occurs when the ticket is submitted.</p></section>`;
}

let moduleElevenOpsState = null;
let moduleElevenConsole = null;
function moduleElevenMountConsole() {
  const save = () => { moduleElevenMetricsState.console ||= {}; moduleElevenMetricsState.console.m11 = m03eState('m11'); moduleElevenSaveMetrics(); };
  const data = moduleElevenConsoleData();
  const fx = moduleElevenToolFixtures(data); const root = () => moduleElevenMetricsState;
  const packs = [
    { id: 'm04', ctx: { fixture: fx.m04, assessment: () => { moduleElevenMetricsState.tools ||= {}; if (!moduleElevenMetricsState.tools.m04) moduleElevenMetricsState.tools.m04 = SocM04AssessmentState.normalize({}, fx.m04).assessment; return moduleElevenMetricsState.tools.m04; }, console: () => m03eState('m11'), save, rerender: () => m03eRender('m11') } },
    { id: 'm05', ctx: { fixture: fx.m05, ...SocConsoleTools.embedded(root, 'm05', SocM05AssessmentState.normalize, fx.m05, save) } },
    { id: 'm06', ctx: { fixture: fx.m06, ...SocConsoleTools.embedded(root, 'm06', SocM06AssessmentState.normalize, fx.m06, save) } },
    { id: 'm07', ctx: { fixture: fx.m07, ui: {}, ...SocConsoleTools.embeddedBox(root, 'm07', SocM07AssessmentState.normalize, fx.m07, save) } },
    { id: 'm08', ctx: { fixture: fx.m08, ui: {}, ...SocConsoleTools.embeddedBox(root, 'm08', SocM08AssessmentState.normalize, fx.m08, save) } },
    { id: 'm09', ctx: { fixture: fx.m09, evidence: fx.m09.scenario.evidence, routes: SocM11AssessmentData.scenario.escalationRoutes.map((route) => ({ id: route.id, text: route.label })), ...SocConsoleTools.embedded(root, 'm09', SocM09AssessmentState.normalize, fx.m09, save) } },
    { id: 'm10', ctx: { fixture: fx.m10, console: () => m03eState('m11'), load: () => SocM10AssessmentState.normalize(moduleElevenMetricsState.tools?.m10 || {}, fx.m10), store: (next) => { moduleElevenMetricsState.tools ||= {}; moduleElevenMetricsState.tools.m10 = SocM10AssessmentState.normalize(next, fx.m10); save(); } } },
  ];
  moduleElevenConsole = SocConsoleTools.mount('m11', { data, stateRoot: () => moduleElevenMetricsState, save, packs,
    title: 'SOC OPERATIONS & REPORTING', ariaLabel: 'Module 11 SOC operations and reporting console',
    extraTabs: [['operations', 'Operations'], ['reporting', 'Reporting']],
    views: { operations: moduleElevenOpsHtml, reporting: moduleElevenReportingHtml },
  });
}

function moduleElevenWireConsole() {
  const root = document.getElementById('m03e-console-m11'); if (!root) return;
  root.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-m11-operation], [data-m11-report]'); if (!form) return;
    event.preventDefault(); const d = Object.fromEntries(new FormData(form)); const at = SocM11AssessmentData.scenario.fixedAt;
    try {
      if (form.dataset.m11Report) moduleElevenOpsState = SocM11AssessmentState.report(moduleElevenOpsState, SocM11AssessmentData, form.dataset.m11Report, d, at);
      else switch (form.dataset.m11Operation) {
        case 'priority': moduleElevenOpsState = SocM11AssessmentState.setPriority(moduleElevenOpsState, SocM11AssessmentData, d.order.split(',').map((x) => x.trim()).filter(Boolean), at); break;
        case 'assign': moduleElevenOpsState = SocM11AssessmentState.assign(moduleElevenOpsState, SocM11AssessmentData, d.itemId, d.analystId, at); break;
        case 'escalate': moduleElevenOpsState = SocM11AssessmentState.escalate(moduleElevenOpsState, SocM11AssessmentData, d.itemId, d.route, d.reason, at); break;
        case 'metrics': moduleElevenOpsState = SocM11AssessmentState.recordMetricInterpretation(moduleElevenOpsState, SocM11AssessmentData, d.text, at); break;
        case 'noise': moduleElevenOpsState = SocM11AssessmentState.flagNoisyRule(moduleElevenOpsState, SocM11AssessmentData, d.ruleId, d.rationale, d.improvement, at); break;
        case 'handoff': moduleElevenOpsState = SocM11AssessmentState.handoff(moduleElevenOpsState, SocM11AssessmentData, { summary: d.summary, openItems: d.openItems.split(',').map((x) => x.trim()).filter(Boolean), risks: d.risks.split('\n').map((x) => x.trim()).filter(Boolean), nextActions: d.nextActions.split('\n').map((x) => x.trim()).filter(Boolean) }, at); break;
        case 'followup': moduleElevenOpsState = SocM11AssessmentState.improvementAction(moduleElevenOpsState, SocM11AssessmentData, d, at); break;
        case 'closure': moduleElevenOpsState = SocM11AssessmentState.closureDecision(moduleElevenOpsState, SocM11AssessmentData, { ...d, evidenceIds: (d.evidenceIds || '').split(',').map((x) => x.trim()).filter(Boolean) }, at); break;
      }
      SocM11AssessmentState.save(moduleElevenUser, moduleElevenOpsState, SocM11AssessmentData); m03eRender('m11');
    } catch (error) { const status = form.parentElement.querySelector('[role="status"]'); if (status) status.textContent = error.message; }
  });
  moduleElevenConsole?.wire(root);
}

function viewModuleEleven(user, program) {
  moduleElevenLoad(user);
  moduleElevenOpsState = SocM11AssessmentState.load(user, SocM11AssessmentData);
  moduleElevenMetricsState.console = { ...(moduleElevenMetricsState.console || {}), m11: moduleElevenMetricsState.console?.m11 || {} };
  moduleElevenMountConsole();
  const module = program.modules['soc-11'];
  const sections = moduleElevenGetSections();
  const lectureOpen = moduleElevenReviewMode || !sections[0].isComplete;
  const quizOpen = moduleElevenReviewMode || (moduleElevenQuizState && !moduleElevenQuizState.passed);
  const guidedLabOpen = moduleElevenReviewMode || !sections[2].isComplete;
  const assessmentLabOpen = moduleElevenReviewMode || !sections[3].isComplete;
  const reviewOpen = moduleElevenReviewMode;
  const quickNavItems = moduleElevenGetQuickNavItems();

  const html = `<div class="m11-shell">${moduleTopbar(user, program)}<div class="mquick-nav-layout">${moduleProgressShell(sections, { moduleKey: 'm11', reviewMode: moduleElevenReviewMode })}<main class="m11-main mf-frame">
<section class="m11-hero mf-hero" aria-labelledby="m11-title"><div><p class="m11-kicker mf-kicker">Module 11 · ${formatHandsOnDuration(module.durationMinutes)} · Week 6</p><h1 id="m11-title">${esc(module.title)}</h1><p class="mf-lede">Turn operating signals and technical evidence into decisions that analysts, incident owners, and leaders can act on.</p></div><dl class="mf-stats" aria-label="Saved lab progress"><div><dt>Guided Lab</dt><dd>${sections[2].isComplete ? 'Complete' : 'Not started'}</dd></div><div><dt>Assessment Lab</dt><dd>${sections[3].isComplete ? 'Complete' : 'Not started'}</dd></div></dl></section>
<details class="m11-section-collapsible mf-section" id="m11-lecture-section" ${lectureOpen ? 'open' : ''}><summary><div class="mf-section-heading"><span class="m11-section-badge mf-section-badge">1</span><div><p class="m11-kicker mf-kicker">Learn It</p><h2>Lecture</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary><div class="m11-section-body mf-section-body" id="m11-lecture">
  <section class="m11-practice-note"><i class="ri-compass-3-line" aria-hidden="true"></i><div><p class="m11-kicker">Independent practice</p><h2>Read the objective and dataset, then choose your own working order.</h2><p>No prescribed sequence or pre-submission hints are provided. Scoring feedback and a reference model appear after you submit.</p></div></section>
  ${moduleElevenScenarioLoops()}
  ${moduleElevenVideoScript()}
</div></details>
<details class="m11-section-collapsible mf-section" id="m11-knowledge-section" ${quizOpen ? 'open' : ''}><summary><div class="mf-section-heading"><span class="m11-section-badge mf-section-badge">2</span><div><p class="m11-kicker mf-kicker">Module assessment</p><h2>Knowledge Check</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary><div class="m11-section-body mf-section-body" id="m11-knowledge-check">
  ${moduleElevenQuizPanel()}
</div></details>
<details class="m11-section-collapsible mf-section mf-lab-section" id="m11-guided-lab-section" ${guidedLabOpen ? 'open' : ''}><summary><div class="mf-section-heading"><span class="m11-section-badge mf-section-badge">3</span><div><p class="m11-kicker mf-kicker">Practice It · Guided Lab</p><h2>Guided Lab</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary><div class="m11-section-body mf-section-body" id="m11-guided-lab">
  <div class="m11-boundary"><i class="ri-shield-check-line" aria-hidden="true"></i><p><strong>Lab boundary:</strong> This lab opens in the imported training application on this page.</p></div>
  <div id="m11-guided-lab-dynamic">${moduleElevenGuidedLabPanel()}</div>
</div></details>
<details class="m11-section-collapsible mf-section" id="m11-assessment-lab-section" ${assessmentLabOpen ? 'open' : ''}><summary><div class="mf-section-heading"><span class="m11-section-badge mf-section-badge">4</span><div><p class="m11-kicker mf-kicker">Prove It · Assessment Lab</p><h2>Assessment Lab</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary><div class="m11-section-body mf-section-body" id="m11-assessment-lab">
  <div id="m11-assessment-lab-dynamic">${moduleElevenAssessmentLabPanel()}<div class="m03e-console-host" id="m03e-console-m11">${moduleThreeConsoleHtml('m11')}</div></div>
</div></details>
<div id="m11-additional-labs-dynamic">${moduleElevenAdditionalLabs()}</div>
<details class="m11-section-collapsible mf-section" id="m11-review-section" ${reviewOpen ? 'open' : ''}><summary><div class="mf-section-heading"><span class="m11-section-badge mf-section-badge">5</span><div><p class="m11-kicker mf-kicker">Concept recap</p><h2>Module Review</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary><div class="m11-section-body mf-section-body" id="m11-review">
  ${moduleElevenReview()}
</div></details>
<details class="m11-section-collapsible mf-section mf-section-supplemental" id="m11-sources-section" ${moduleElevenReviewMode ? 'open' : ''}><summary><div class="mf-section-heading"><span class="m11-section-badge mf-section-badge"><i class="ri-book-open-line" aria-hidden="true"></i></span><div><p class="m11-kicker mf-kicker">Reference — not a graded step</p><h2>Sources &amp; Further Reading</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary><div class="m11-section-body mf-section-body">
  ${moduleSourcesBlock(MODULE_ELEVEN_SOURCES_LIST)}
</div></details>
</main></div></div>`;
  return html;
}

function wireModuleElevenGuidedLab() {
  const root = document.getElementById('m11-guided-lab-dynamic');
  if (!root || !moduleElevenMetricsState) return;
  root.addEventListener('input', (event) => {
    if (event.target.matches('[data-m11-practice-notes]')) {
      moduleElevenMetricsState.practiceNotes = event.target.value;
      moduleElevenSaveMetrics();
    }
  });
  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-m11-practice-complete]')) {
      moduleElevenMetricsState.practiceComplete = true;
      if (!moduleElevenMetricsState.flags.includes(MODULE_ELEVEN_METRICS_FLAG)) moduleElevenMetricsState.flags.push(MODULE_ELEVEN_METRICS_FLAG);
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleElevenUser, 'soc-analyst', 'soc-11', MODULE_ELEVEN_METRICS_CATALOG_KEY);
      moduleElevenSaveMetrics();
      root.innerHTML = moduleElevenGuidedLabPanel();
    }
  });
}

function moduleElevenFinalizeCase(root) {
  if (moduleElevenReportState.submitted) return;
  const scored = SocM11AssessmentScorer.score(moduleElevenOpsState, SocM11AssessmentData);
  moduleElevenReportState.showMissing = false;
  moduleElevenReportState.submitted = true;
  moduleElevenReportState.completed = true;
  moduleElevenReportState.attempts = (moduleElevenReportState.attempts || 0) + 1;
  moduleElevenReportState.lastSubmittedAt = new Date().toISOString();
  moduleElevenReportState.score = scored.score;
  moduleElevenReportState.assessmentScore = scored;
  moduleElevenReportState.breakdown = scored.criteria;
  moduleElevenReportState.actionHistory.push({ action: 'Submitted case for faculty review', at: moduleElevenReportState.lastSubmittedAt });
  if (!moduleElevenReportState.flags.includes(MODULE_ELEVEN_REPORT_FLAG)) moduleElevenReportState.flags.push(MODULE_ELEVEN_REPORT_FLAG);
  moduleElevenSaveReport();
  if (moduleElevenUser) {
    moduleElevenUser.latestLabAttemptByKey = { ...(moduleElevenUser.latestLabAttemptByKey || {}), [MODULE_ELEVEN_REPORT_CATALOG_KEY]: { completedAt: moduleElevenReportState.lastSubmittedAt, reviewedAt: null, redoRequested: false } };
  }
  if (typeof recordLabAttempt === 'function') {
    recordLabAttempt(moduleElevenUser, MODULE_ELEVEN_REPORT_CATALOG_KEY, {
      state: 'complete',
      score: scored.score,
      result: { ...scored, action_history: moduleElevenOpsState.actionHistory },
    }).then((saved) => {
      if (saved && moduleElevenCaseRedoRequested()) delete moduleElevenUser.openLabRedosByModuleKey['soc-11'];
    });
  }
  if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleElevenUser, 'soc-analyst', 'soc-11', MODULE_ELEVEN_REPORT_CATALOG_KEY);
  root.innerHTML = moduleElevenAssessmentLabPanel();
}

function wireModuleElevenAssessmentLab() {
  const root = document.getElementById('m11-assessment-lab-dynamic');
  if (!root || !moduleElevenReportState) return;
  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-m11-submit-score]')) { moduleElevenFinalizeCase(root); return; }

  });

}

function wireModuleEleven() {
  moduleElevenWireConsole();
  // Wire review toggle
  const reviewToggle = document.querySelector('[data-mnav-review-toggle]');
  if (reviewToggle) {
    reviewToggle.addEventListener('click', () => {
      moduleElevenReviewMode = !moduleElevenReviewMode;
      reviewToggle.setAttribute('aria-pressed', String(moduleElevenReviewMode));
      const icon = reviewToggle.querySelector('i');
      if (icon) icon.className = moduleElevenReviewMode ? 'ri-eye-line' : 'ri-eye-off-line';
      const sections = document.querySelectorAll('.m11-section-collapsible');
      sections.forEach((section) => {
        section.open = moduleElevenReviewMode;
      });
    });
  }

  // Wire quiz
  wireModuleElevenQuiz();

  // Wire labs
  wireModuleElevenGuidedLab();
  wireModuleElevenAssessmentLab();
  // Imported additional labs are practice only and do not gate module progress.
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 11, moduleKey: 'soc-11', view: viewModuleEleven, wire: wireModuleEleven });
