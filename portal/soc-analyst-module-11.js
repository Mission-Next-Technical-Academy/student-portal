/* Module 11 — independent SOC operations and communication practice.
 * All metrics, people, systems, and incident evidence are synthetic and local.
 */

const MODULE_ELEVEN_METRICS_LAB_ID = 'm11-soc-metrics-v1';
const MODULE_ELEVEN_PASSING_SCORE = 70;
const MODULE_ELEVEN_QUIZ_BANKS = [
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
        prompt: `A technical case note states, "NB-44 spawned unsigned script-host.exe from document-reader.exe after opening Benefits_Adjustment.zip." An executive asks, "Did we lose data?" What gap does the technical note not address for the executive?`,
        options: [
          { id: 'a', text: 'The technical note is perfect for all audiences.' },
          { id: 'b', text: 'The technical note lacks business impact: how many users were affected, what sensitive access occurred, and what is the operational disruption?' },
          { id: 'c', text: 'Executives should not ask about data loss.' },
          { id: 'd', text: 'The note is too short.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Executives need impact framing—scope (one user, one device), access result (no sensitive access observed), and operational effect (one employee used a loaner for 83 minutes).`,
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
    note: `Foundational security certification covering incident classification, SLA management, escalation procedures, and case closure — aligned with this module's core concepts.`,
  },
];

const MODULE_ELEVEN_REPORT_LAB_ID = 'm11-executive-report-v1';
const MODULE_ELEVEN_METRICS_CATALOG_KEY = 'lab-soc-metrics';
const MODULE_ELEVEN_REPORT_CATALOG_KEY = 'lab-exec-report';
const MODULE_ELEVEN_METRICS_FLAG = 'M11-SOC-METRICS-BRIEFED';
const MODULE_ELEVEN_REPORT_FLAG = 'M11-EXECUTIVE-REPORT-COMPLETE';

const MODULE_ELEVEN_WEEKLY_METRICS = [
  { week: 'Week 27', alerts: 520, closed: 500, falsePositives: 320, mttd: 12, mttr: 98, sla: 96, backlog: 18, staffed: 6 },
  { week: 'Week 28', alerts: 610, closed: 590, falsePositives: 390, mttd: 14, mttr: 110, sla: 93, backlog: 25, staffed: 6 },
  { week: 'Week 29', alerts: 740, closed: 680, falsePositives: 480, mttd: 19, mttr: 154, sla: 84, backlog: 58, staffed: 5 },
  { week: 'Week 30', alerts: 705, closed: 650, falsePositives: 465, mttd: 21, mttr: 171, sla: 78, backlog: 76, staffed: 5 },
];

const MODULE_ELEVEN_METRIC_EVIDENCE = [
  { id: 'MET-1101', label: 'Alert volume', value: '+36% since Week 27', detail: 'Weekly alerts rose from 520 to 705. Volume peaked at 740 in Week 29.', relevant: false },
  { id: 'MET-1102', label: 'Mean time to detect', value: '12 → 21 minutes', detail: 'MTTD worsened by 75%, showing that actionable activity is waiting longer for initial analyst recognition.', relevant: true },
  { id: 'MET-1103', label: 'Mean time to respond', value: '98 → 171 minutes', detail: 'MTTR rose 73 minutes. This is a response-speed signal, not proof that each case caused greater business impact.', relevant: true },
  { id: 'MET-1104', label: 'Priority SLA met', value: '96% → 78%', detail: 'The team fell below its 90% target in Weeks 29 and 30, so the operational risk requires escalation.', relevant: true },
  { id: 'MET-1105', label: 'Open alert backlog', value: '18 → 76 alerts', detail: 'Backlog more than quadrupled, including nine high-priority alerts older than the response target.', relevant: true },
  { id: 'MET-1106', label: 'Noisy rule contribution', value: '287 false positives', detail: 'The “Unfamiliar travel” rule generated 342 Week 30 alerts; 287 were validated false positives after a remote-access change.', relevant: true },
  { id: 'MET-1107', label: 'Scheduled staffing', value: '5 of 6 analysts', detail: 'One planned absence reduced capacity in Weeks 29 and 30. It contributes to pressure but does not explain the concentrated rule noise by itself.', relevant: false },
  { id: 'MET-1108', label: 'Platform availability', value: '99.98%', detail: 'The queue and case platform remained available throughout the period. Availability is healthy and does not explain the degraded handling times.', relevant: false },
];

const MODULE_ELEVEN_RULE_METRICS = [
  { rule: 'Unfamiliar travel', alerts: 342, truePositive: 31, falsePositive: 287, pending: 24, medianAge: '74 min' },
  { rule: 'Unsigned script from document', alerts: 96, truePositive: 43, falsePositive: 48, pending: 5, medianAge: '29 min' },
  { rule: 'Privileged role change', alerts: 54, truePositive: 17, falsePositive: 35, pending: 2, medianAge: '18 min' },
  { rule: 'Known test scanner', alerts: 128, truePositive: 0, falsePositive: 128, pending: 0, medianAge: 'Closed' },
  { rule: 'Outbound beacon pattern', alerts: 85, truePositive: 29, falsePositive: 50, pending: 6, medianAge: '41 min' },
];

const MODULE_ELEVEN_CASE_EVENTS = [
  { id: 'CASE-1101', time: '11:02', source: 'Endpoint', title: 'Attachment launched an unsigned script', detail: 'On NB-44, employee-44 opened Benefits_Adjustment.zip from an external message. document-reader.exe then spawned unsigned script-host.exe.', relevant: true },
  { id: 'CASE-1102', time: '11:04', source: 'Network', title: 'NB-44 contacted an unapproved destination', detail: 'The script created a TLS session to documentation address 203.0.113.211. The destination is not used by an approved service in this case slice.', relevant: true },
  { id: 'CASE-1103', time: '11:08', source: 'Identity', title: 'Unfamiliar token refresh for acct-44', detail: 'An unmanaged client refreshed acct-44 from 203.0.113.211, correlating the identity activity with the endpoint destination.', relevant: true },
  { id: 'CASE-1104', time: '11:12', source: 'Detection', title: 'Incident CASE-11-27 declared', detail: 'The analyst correlated the endpoint, network, and identity records and classified the incident as a confirmed compromise.', relevant: false },
  { id: 'CASE-1105', time: '11:19', source: 'Response', title: 'NB-44 isolated', detail: 'Endpoint operations isolated the affected notebook through the approved playbook while preserving responder access.', relevant: true },
  { id: 'CASE-1106', time: '11:23', source: 'Response', title: 'acct-44 sessions revoked', detail: 'Identity operations revoked active sessions and temporarily disabled the account pending credential and MFA review.', relevant: true },
  { id: 'CASE-1107', time: '11:41', source: 'Endpoint', title: 'Persistence removed and scan completed', detail: 'Responders removed the startup entry and payload. An approved full scan completed with no additional malicious artifact.', relevant: false },
  { id: 'CASE-1108', time: '12:18', source: 'Recovery', title: 'Credential and MFA review completed', detail: 'The account password was reset, registered MFA methods were validated, and the account was re-enabled under enhanced monitoring.', relevant: false },
  { id: 'CASE-1109', time: '12:42', source: 'Recovery', title: 'Endpoint restored after validation', detail: 'NB-44 passed health checks and returned to service. Monitoring found no repeat indicator on the affected entities.', relevant: true },
  { id: 'CASE-1110', time: '13:05', source: 'Scope', title: 'No sensitive access or lateral movement observed', detail: 'The scoped identity, repository, endpoint, and network searches found no sensitive-repository access or second affected host. This does not prove organization-wide absence.', relevant: true },
  { id: 'CASE-1111', time: '13:10', source: 'Business', title: 'Operational impact recorded', detail: 'One employee and one managed notebook were affected. The employee used a loaner for 83 minutes; no customer-facing service was interrupted.', relevant: false },
];

let moduleElevenQuizState = null;
let moduleElevenMetricsState = null;
let moduleElevenReportState = null;
let moduleElevenUser = null;
let moduleElevenActiveLab = 'metrics';
let moduleElevenReviewMode = false;

function moduleElevenMetricsFreshDefaults() {
  return {
    selectedEvidence: [], reviewedMetrics: [], primaryCause: '', trendConclusion: '', action: '', escalation: '',
    notes: '', breakdown: null, feedback: [], validationError: '', lastSubmittedAt: '',
  };
}

function moduleElevenReportFreshDefaults() {
  return {
    selectedEvidence: [], reviewedEvents: [], activeEvent: '', classification: '', rootCause: '', impact: '',
    escalation: '', closure: '', caseNote: '', executiveSummary: '', breakdown: null, feedback: [], validationError: '', lastSubmittedAt: '',
  };
}

function moduleElevenLoad(user) {
  moduleElevenUser = user;
  moduleElevenMetricsState = LabRuntime.load(MODULE_ELEVEN_METRICS_LAB_ID, user, moduleElevenMetricsFreshDefaults());
  moduleElevenReportState = LabRuntime.load(MODULE_ELEVEN_REPORT_LAB_ID, user, moduleElevenReportFreshDefaults());
  ['selectedEvidence', 'reviewedMetrics', 'feedback', 'flags'].forEach((key) => {
    if (!Array.isArray(moduleElevenMetricsState[key])) moduleElevenMetricsState[key] = [];
  });
  ['selectedEvidence', 'reviewedEvents', 'feedback', 'flags'].forEach((key) => {
    if (!Array.isArray(moduleElevenReportState[key])) moduleElevenReportState[key] = [];
  });

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
  if (moduleElevenUser && moduleElevenMetricsState) LabRuntime.save(MODULE_ELEVEN_METRICS_LAB_ID, moduleElevenUser, moduleElevenMetricsState);
}

function moduleElevenSaveReport() {
  if (moduleElevenUser && moduleElevenReportState) LabRuntime.save(MODULE_ELEVEN_REPORT_LAB_ID, moduleElevenUser, moduleElevenReportState);
}

function moduleElevenSaveQuiz() {
  if (moduleElevenUser && moduleElevenQuizState && moduleElevenMetricsState) {
    moduleElevenMetricsState.lastQuizQuestionIds = moduleElevenQuizState.selectedQuestions.map((s) => s.question.id);
    LabRuntime.save(MODULE_ELEVEN_METRICS_LAB_ID, moduleElevenUser, moduleElevenMetricsState);
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

function moduleElevenQuizPanel() {
  if (!moduleElevenQuizState?.selectedQuestions || moduleElevenQuizState.selectedQuestions.length === 0) {
    return `<div class="m11-quiz-empty" id="m11-quiz-feedback" role="status">Loading quiz…</div>`;
  }

  const selected = moduleElevenQuizState.selectedQuestions;
  const answered = Object.keys(moduleElevenQuizState.answers || {}).length;
  const total = selected.length;

  let feedbackHtml = '';
  if (moduleElevenQuizState.scored) {
    const passed = moduleElevenQuizState.score >= 70;
    feedbackHtml = `<section class="m11-quiz-score ${passed ? 'm11-quiz-pass' : 'm11-quiz-remediate'}" id="m11-quiz-feedback" tabindex="-1" aria-live="polite">
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

  return `<form class="m11-quiz-form" id="m11-quiz-form" novalidate>
    <div class="m11-panel-heading"><div><p class="m11-kicker">Knowledge check</p><h3 id="m11-quiz-title" tabindex="-1">Test your understanding of SOC operations and reporting</h3></div><span>${answered}/${total} answered</span></div>
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

function moduleElevenStatus(state) {
  if (state.completed) return 'Complete';
  if (state.attempts || state.selectedEvidence.length || state.notes || state.caseNote || state.executiveSummary) return 'In progress';
  return 'Not started';
}

function moduleElevenLabSwitcher() {
  const labs = [
    { key: 'metrics', number: 'Lab 1', title: 'SOC Metrics Dashboard', state: moduleElevenMetricsState, icon: 'ri-line-chart-line' },
    { key: 'report', number: 'Lab 2', title: 'Executive Incident Report', state: moduleElevenReportState, icon: 'ri-file-chart-line' },
  ];
  return `<nav class="m11-lab-switcher" aria-label="Module 11 labs">${labs.map((lab) => `<button type="button" data-m11-lab="${lab.key}" aria-current="${moduleElevenActiveLab === lab.key ? 'page' : 'false'}"><i class="${lab.icon}" aria-hidden="true"></i><span><small>${lab.number}</small>${lab.title}</span><strong class="${lab.state.completed ? 'is-complete' : ''}">${moduleElevenStatus(lab.state)}</strong></button>`).join('')}</nav>`;
}

function moduleElevenRadio(name, legend, options, state) {
  return `<fieldset class="m11-fieldset"><legend>${esc(legend)}</legend><div class="m11-option-list">${options.map((option) => `<label><input type="radio" name="${esc(name)}" value="${esc(option.id)}" ${state[name] === option.id ? 'checked' : ''} /><span>${esc(option.label)}</span></label>`).join('')}</div></fieldset>`;
}

function moduleElevenScorePanel(state, kind) {
  if (state.validationError) return `<div class="m11-validation" id="m11-feedback" role="alert" tabindex="-1"><i class="ri-information-line" aria-hidden="true"></i><div><strong>Submission is incomplete</strong><p>${esc(state.validationError)}</p></div></div>`;
  if (!state.attempts || !state.breakdown) return `<div class="m11-score-empty" id="m11-feedback" role="status">Submit the completed deliverable for an explainable score. Work is saved locally as you go.</div>`;
  const passed = state.score >= MODULE_ELEVEN_PASSING_SCORE;
  const b = state.breakdown;
  const model = kind === 'metrics'
    ? 'MTTD rose from 12 to 21 minutes, MTTR from 98 to 171 minutes, SLA attainment fell to 78%, and backlog reached 76. The main controllable driver is the noisy Unfamiliar travel rule after the access change, amplified by one planned absence. Escalate the SLA risk to the duty manager and detection owner, test a scoped tuning change, and assign the next shift to work the nine aging high-priority alerts.'
    : 'CASE-11-27 was a confirmed compromise limited by current evidence to NB-44 and acct-44. An external archive led to unsigned script execution, a correlated destination, and an unfamiliar session. The host was isolated, sessions revoked, persistence removed, credentials reviewed, and service restored after validation. No sensitive access or lateral movement was observed in the scoped data. Close only with 24-hour monitoring and a named control-improvement owner.';
  return `<section class="m11-score ${passed ? 'is-pass' : 'is-remediate'}" id="m11-feedback" tabindex="-1" aria-live="polite"><div class="m11-score-heading"><div><p class="m11-kicker">Attempt ${state.attempts} · best ${state.bestScore}/100</p><h3>${state.score}/100 — ${passed ? 'Deliverable accepted' : 'Revise and resubmit'}</h3></div><span>${state.score}</span></div><div class="m11-score-grid"><div><strong>${b.observation}/25</strong><span>Observation</span></div><div><strong>${b.analysis}/25</strong><span>Analysis</span></div><div><strong>${b.decision}/30</strong><span>Decision</span></div><div><strong>${b.communication}/20</strong><span>Communication</span></div></div><ul>${state.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul><div class="m11-remediation"><strong>Reference model</strong><p>${esc(model)}</p></div></section>`;
}

function moduleElevenMetricsDataset() {
  return `<section class="m11-dataset" aria-labelledby="m11-metrics-data-title"><div class="m11-dataset-heading"><div><p class="m11-kicker">Synthetic dataset · four weekly snapshots</p><h3 id="m11-metrics-data-title">SOC performance and queue health</h3></div><span>Target: ≥90% priority SLA</span></div>
    <div class="m11-table-wrap"><table class="m11-data-table"><caption class="m11-visually-hidden">Weekly synthetic SOC metrics</caption><thead><tr><th scope="col">Period</th><th scope="col">Alerts</th><th scope="col">Closed</th><th scope="col">False positives</th><th scope="col">MTTD</th><th scope="col">MTTR</th><th scope="col">Priority SLA</th><th scope="col">Backlog</th><th scope="col">Staffed</th></tr></thead><tbody>${MODULE_ELEVEN_WEEKLY_METRICS.map((row) => `<tr><th scope="row">${row.week}</th><td>${row.alerts}</td><td>${row.closed}</td><td>${row.falsePositives}</td><td>${row.mttd} min</td><td>${row.mttr} min</td><td class="${row.sla < 90 ? 'is-risk' : ''}">${row.sla}%</td><td class="${row.backlog > 50 ? 'is-risk' : ''}">${row.backlog}</td><td>${row.staffed}/6</td></tr>`).join('')}</tbody></table></div>
    <div class="m11-metric-cards">${MODULE_ELEVEN_METRIC_EVIDENCE.map((item) => { const checked = moduleElevenMetricsState.selectedEvidence.includes(item.id); return `<label class="${checked ? 'is-selected' : ''}"><input type="checkbox" name="metricsEvidence" value="${item.id}" ${checked ? 'checked' : ''} /><span><small>${item.id} · ${item.label}</small><strong>${item.value}</strong><em>${item.detail}</em></span></label>`; }).join('')}</div>
    <div class="m11-table-wrap m11-rule-table"><table class="m11-data-table"><caption>Week 30 alert-rule distribution</caption><thead><tr><th scope="col">Rule</th><th scope="col">Alerts</th><th scope="col">True positive</th><th scope="col">False positive</th><th scope="col">Pending</th><th scope="col">Median age</th></tr></thead><tbody>${MODULE_ELEVEN_RULE_METRICS.map((row) => `<tr><th scope="row">${row.rule}</th><td>${row.alerts}</td><td>${row.truePositive}</td><td>${row.falsePositive}</td><td>${row.pending}</td><td>${row.medianAge}</td></tr>`).join('')}</tbody></table></div>
  </section>`;
}

function moduleElevenMetricsForm() {
  return `<form class="m11-deliverable" id="m11-metrics-form" novalidate aria-labelledby="m11-metrics-deliverable-title"><div class="m11-deliverable-heading"><div><p class="m11-kicker">Scored deliverable</p><h3 id="m11-metrics-deliverable-title">Operations brief and shift handoff</h3></div><span>Pass ${MODULE_ELEVEN_PASSING_SCORE}/100</span></div>
    <div class="m11-form-grid">
      ${moduleElevenRadio('primaryCause', 'Primary operational driver', [
        { id: 'rule-capacity', label: 'Concentrated Unfamiliar travel false positives, amplified by reduced capacity' },
        { id: 'platform-outage', label: 'Case-platform availability failure' },
        { id: 'incident-impact', label: 'Every alert became a higher-impact incident' },
      ], moduleElevenMetricsState)}
      ${moduleElevenRadio('trendConclusion', 'Defensible performance conclusion', [
        { id: 'degrading', label: 'Detection and response speed degraded while backlog and SLA risk increased' },
        { id: 'healthy', label: 'Operations improved because more alerts were closed' },
        { id: 'breach-proof', label: 'The metrics prove an enterprise-wide breach occurred' },
      ], moduleElevenMetricsState)}
      ${moduleElevenRadio('action', 'Recommended action', [
        { id: 'tune-prioritize', label: 'Test scoped rule tuning and assign aging high-priority alerts for immediate review' },
        { id: 'disable-detection', label: 'Disable all identity detections until backlog reaches zero' },
        { id: 'close-backlog', label: 'Bulk-close the backlog as false positive without case review' },
      ], moduleElevenMetricsState)}
      ${moduleElevenRadio('escalation', 'Escalation path', [
        { id: 'duty-detection', label: 'Notify the SOC duty manager and detection owner with SLA impact, owner, and review time' },
        { id: 'no-escalation', label: 'Keep the trend within the current shift because availability is healthy' },
        { id: 'public-notice', label: 'Issue a public incident statement based only on queue metrics' },
      ], moduleElevenMetricsState)}
    </div>
    <label class="m11-text-label" for="m11-metrics-notes">Shift handoff</label><p class="m11-field-help">Write for the incoming SOC lead. Include quantified trend, operational risk, assigned action and owner, and what the next shift must verify.</p><textarea id="m11-metrics-notes" name="notes" rows="6" maxlength="1200">${esc(moduleElevenMetricsState.notes)}</textarea><div class="m11-text-meta"><span id="m11-metrics-count">${moduleElevenMetricsState.notes.length}/1200</span><span>Minimum 160 characters</span></div>
    <div class="m11-actions"><button class="m11-submit" type="submit"><i class="ri-send-plane-line" aria-hidden="true"></i> Submit operations brief</button><button class="m11-reset" type="button" data-m11-reset="metrics"><i class="ri-restart-line" aria-hidden="true"></i> Reset metrics lab only</button></div>${moduleElevenScorePanel(moduleElevenMetricsState, 'metrics')}
  </form>`;
}

function moduleElevenMetricsLab() {
  return `<article class="m11-lab" aria-labelledby="m11-metrics-title"><header class="m11-casebar"><div><p class="m11-kicker">Lab 1 · ${MODULE_ELEVEN_METRICS_CATALOG_KEY} · independent</p><h2 id="m11-metrics-title" tabindex="-1">SOC Metrics Dashboard</h2><p><strong>Objective:</strong> Diagnose the material operating trend, recommend a proportionate improvement, escalate the service risk, and leave the incoming shift an evidence-based handoff.</p></div><dl><div><dt>Dataset</dt><dd>4 weeks</dd></div><div><dt>Role</dt><dd>Shift lead</dd></div><div><dt>Status</dt><dd>${moduleElevenStatus(moduleElevenMetricsState)}</dd></div></dl></header>${moduleElevenMetricsDataset()}${moduleElevenMetricsForm()}</article>`;
}

function moduleElevenCaseDataset() {
  const active = MODULE_ELEVEN_CASE_EVENTS.find((item) => item.id === moduleElevenReportState.activeEvent);
  return `<section class="m11-dataset" aria-labelledby="m11-case-data-title"><div class="m11-dataset-heading"><div><p class="m11-kicker">Synthetic dataset · CASE-11-27</p><h3 id="m11-case-data-title">Technical case record</h3></div><span>Closed-loop review</span></div>
    <div class="m11-case-summary"><dl><div><dt>Initial severity</dt><dd>High</dd></div><div><dt>Current state</dt><dd>Recovered</dd></div><div><dt>Affected</dt><dd>NB-44 · acct-44</dd></div><div><dt>Monitoring</dt><dd>24 hours required</dd></div></dl></div>
    <div class="m11-table-wrap"><table class="m11-data-table m11-case-table"><caption class="m11-visually-hidden">Synthetic CASE-11-27 timeline</caption><thead><tr><th scope="col">Use</th><th scope="col">Time</th><th scope="col">Source</th><th scope="col">Case event</th><th scope="col">Detail</th></tr></thead><tbody>${MODULE_ELEVEN_CASE_EVENTS.map((item) => { const selected = moduleElevenReportState.selectedEvidence.includes(item.id); return `<tr class="${selected ? 'is-selected' : ''}"><td data-label="Use"><label class="m11-evidence-check"><input type="checkbox" name="reportEvidence" value="${item.id}" ${selected ? 'checked' : ''} /><span>${item.id}</span></label></td><td data-label="Time"><time>${item.time}</time></td><td data-label="Source">${item.source}</td><td data-label="Case event"><strong>${item.title}</strong></td><td data-label="Detail"><button type="button" class="m11-inspect" data-m11-event="${item.id}" aria-expanded="${active?.id === item.id}">${active?.id === item.id ? 'Hide' : 'Inspect'}</button></td></tr>`; }).join('')}</tbody></table></div>
    ${active ? `<aside class="m11-event-detail" id="m11-event-detail" tabindex="-1"><div><p class="m11-kicker">${active.id} · ${active.time} · ${active.source}</p><strong>${active.title}</strong><p>${active.detail}</p></div><button type="button" data-m11-close-event aria-label="Close event detail"><i class="ri-close-line" aria-hidden="true"></i></button></aside>` : ''}
  </section>`;
}

function moduleElevenReportForm() {
  return `<form class="m11-deliverable" id="m11-report-form" novalidate aria-labelledby="m11-report-deliverable-title"><div class="m11-deliverable-heading"><div><p class="m11-kicker">Scored deliverable</p><h3 id="m11-report-deliverable-title">Case note, executive report, escalation and closure</h3></div><span>Pass ${MODULE_ELEVEN_PASSING_SCORE}/100</span></div>
    <div class="m11-form-grid m11-form-grid-three">
      ${moduleElevenRadio('classification', 'Case classification', [{ id: 'confirmed', label: 'Confirmed endpoint and identity compromise' }, { id: 'benign', label: 'Benign user activity' }, { id: 'enterprise', label: 'Confirmed enterprise-wide compromise' }], moduleElevenReportState)}
      ${moduleElevenRadio('rootCause', 'Root cause', [{ id: 'archive-script', label: 'External archive opened; content process spawned an unsigned script' }, { id: 'sensor', label: 'Endpoint sensor caused the incident' }, { id: 'password', label: 'Password age alone caused the activity' }], moduleElevenReportState)}
      ${moduleElevenRadio('impact', 'Impact statement', [{ id: 'bounded', label: 'One user and notebook; temporary disruption; no observed sensitive access or lateral movement in scope' }, { id: 'none', label: 'No impact because the endpoint was restored' }, { id: 'all-data', label: 'All organizational data was exfiltrated' }], moduleElevenReportState)}
      ${moduleElevenRadio('escalation', 'Escalation record', [{ id: 'incident-owners', label: 'Incident manager plus endpoint and identity owners, with evidence and requested actions' }, { id: 'none', label: 'No escalation because containment completed' }, { id: 'broadcast', label: 'Send unverified technical detail to all employees' }], moduleElevenReportState)}
      ${moduleElevenRadio('closure', 'Closure decision', [{ id: 'verified-monitor', label: 'Close after verified recovery, 24-hour monitoring, and an assigned control-improvement owner' }, { id: 'contained', label: 'Close immediately when isolation succeeds' }, { id: 'never', label: 'Keep the case open permanently despite verified recovery' }], moduleElevenReportState)}
    </div>
    <div class="m11-writing-grid"><div><label class="m11-text-label" for="m11-case-note">Technical case note</label><p class="m11-field-help">Record time, affected entities, evidence, actions, current scope or uncertainty, and ownership.</p><textarea id="m11-case-note" name="caseNote" rows="7" maxlength="1400">${esc(moduleElevenReportState.caseNote)}</textarea><div class="m11-text-meta"><span id="m11-case-count">${moduleElevenReportState.caseNote.length}/1400</span><span>Minimum 180 characters</span></div></div><div><label class="m11-text-label" for="m11-exec-summary">Executive summary</label><p class="m11-field-help">State business impact, current status, residual risk, and the next accountable action in plain language.</p><textarea id="m11-exec-summary" name="executiveSummary" rows="7" maxlength="1400">${esc(moduleElevenReportState.executiveSummary)}</textarea><div class="m11-text-meta"><span id="m11-exec-count">${moduleElevenReportState.executiveSummary.length}/1400</span><span>Minimum 160 characters</span></div></div></div>
    <div class="m11-actions"><button class="m11-submit" type="submit"><i class="ri-send-plane-line" aria-hidden="true"></i> Submit incident report</button><button class="m11-reset" type="button" data-m11-reset="report"><i class="ri-restart-line" aria-hidden="true"></i> Reset report lab only</button></div>${moduleElevenScorePanel(moduleElevenReportState, 'report')}
  </form>`;
}

function moduleElevenReportLab() {
  return `<article class="m11-lab" aria-labelledby="m11-report-title"><header class="m11-casebar"><div><p class="m11-kicker">Lab 2 · ${MODULE_ELEVEN_REPORT_CATALOG_KEY} · independent</p><h2 id="m11-report-title" tabindex="-1">Executive Incident Report</h2><p><strong>Objective:</strong> Convert the bounded technical case into an accurate case note, an audience-appropriate executive summary, an accountable escalation, and a defensible closure decision.</p></div><dl><div><dt>Dataset</dt><dd>11 events</dd></div><div><dt>Role</dt><dd>Case owner</dd></div><div><dt>Status</dt><dd>${moduleElevenStatus(moduleElevenReportState)}</dd></div></dl></header>${moduleElevenCaseDataset()}${moduleElevenReportForm()}</article>`;
}

function moduleElevenDynamic() {
  return `${moduleElevenLabSwitcher()}${moduleElevenActiveLab === 'metrics' ? moduleElevenMetricsLab() : moduleElevenReportLab()}`;
}

function moduleElevenVideoScript() {
  return `<details class="m11-video-script"><summary><strong>Video script (recording pending)</strong></summary><div class="m11-script-body"><p><strong>Introduction (0:00–1:00):</strong> Welcome to Module 11, where you'll translate operational signals and incident evidence into decisions. We'll cover five core ideas: distinguishing operational trends from proof of incidents, tracing a metric spike to its controllable driver, writing the same facts for two different audiences, escalating with named accountability, and closing cases with verified recovery and control ownership.</p><p><strong>Segment 1: Metrics Are Signals, Not Proof (1:00–5:00):</strong> A SOC dashboard shows MTTD rising from 12 to 21 minutes, SLA falling to 78%, and backlog hitting 76 alerts. What does this tell us? Operational degradation—the detection and response pipeline slowed. But it doesn't prove an active enterprise-wide breach. Metrics guide investigation: they show where pressure exists. A rising metric might mean more legitimate work, rule noise, staff shortage, or platform issues. Always ask, "What changed?" If alert volume tripled after a new rule deployed, or MTTR doubled after staffing dropped, you've found a hypothesis. Test it. Don't confuse operational pressure with incident proof.</p><p><strong>Segment 2: Tracing a Trend to Its Driver (5:00–10:00):</strong> Module 11's dataset shows one rule—"Unfamiliar travel"—generated 342 weekly alerts, of which 287 were false positives after a remote-access policy changed. That single fact explains much of the noise. A week earlier, MTTD was 12 minutes and backlog was low. One policy change and one noisy rule drove the observed degradation. This is traceability: the controllable driver. Once you identify it, you can tune just that rule or roll back the change. You don't have to disable all detection; you isolate and fix the cause. This discipline prevents wasteful broad actions—like disabling all identity detection—that reduce coverage without solving the real problem.</p><p><strong>Segment 3: Same Facts, Two Audiences (10:00–14:00):</strong> A technical case note reads: "NB-44 spawned unsigned script-host.exe from document-reader.exe after opening Benefits_Adjustment.zip. TLS session to 203.0.113.211. Unfamiliar token refresh from same IP." All true. An executive reads this and asks, "Did we lose data?" The technical note is silent on business impact. Now translate: "One employee's notebook and account were compromised via a phishing attachment. The endpoint was isolated, the account was disabled, sessions were revoked, and the system was restored. No sensitive repository access or lateral movement was observed. The employee used a loaner device for 83 minutes; no customer service was interrupted." Same facts. Different framing. Technical peers care about TTPs, IOCs, and timeline. Executives care about impact, residual risk, and what's next. Write both versions from the same evidence.</p><p><strong>Segment 4: Escalation With Accountability (14:00–19:00):</strong> Operational risk—SLA miss, backlog, rule noise—must escalate to decision-makers with specific requests. Telling the team "we have a queue problem" is broadcast, not escalation. Escalation is: "Alert the SOC duty manager (name) and detection rule owner (name). Quantified risk: 76-alert backlog, nine aging above SLA, 78% SLA attainment. Hypothesis: concentrated false positives from the Unfamiliar travel rule after the access change. Request: authorize a scoped tuning test, reassign aging high-priority alerts, and review the rule baseline by end of shift." That's escalation—up the chain, to decision-makers, with context and a clear request. Without names and specific actions, escalation becomes noise.</p><p><strong>Segment 5: Closure With Verification and Control Ownership (19:00–23:00):</strong> A case closes when three conditions are met: the endpoint is verified clean (scans, health checks), a 24-hour monitoring window shows no repeat indicators, and a specific person owns a control improvement to prevent recurrence. Closing on containment alone is premature. The attacker may have left persistence. Closing without monitoring assumes the environment is hostile-free, but you may not have scanned every system. And closure without control ownership means the same entry point may be exploited again next month. Control ownership is specific: "Alice from SecEng reviews the file-opening permission model for ZIP archives by Friday, reports findings by EOW, and implements a hardening change by next week." That's discipline.</p><p><strong>Closing (23:00–24:00):</strong> Module 11 teaches you to think like a shift lead and a case owner: see signals, trace them to causes, communicate across audiences, escalate with accountability, and close with discipline. Master these five ideas, and you'll ship work that both technical peers and leaders trust.</p></div></details>`;
}

function moduleElevenReview() {
  return `<section class="m11-review-section"><h3>Module concepts at a glance</h3><ul><li><strong>Operational metrics vs. incident proof:</strong> A rising MTTD or SLA miss is an operational signal, not direct evidence of a breach. Investigate the signal's root cause before linking it to incident scope.</li><li><strong>Traceability:</strong> When a metric trend occurs, trace it to a specific controllable driver—a rule change, staffing change, or alert-generation threshold. Targeted fixes preserve coverage better than broad disables.</li><li><strong>Audience-appropriate communication:</strong> Technical case notes document entities, actions, and evidence. Executive summaries state business impact, affected scope, residual risk, and next steps in plain language. Write both.</li><li><strong>Escalation accountability:</strong> Escalate upward with quantified risk, a hypothesis, and a specific request to named decision-makers. Broadcast to peers or uncontrolled groups is not escalation.</li><li><strong>Closure discipline:</strong> Close only after verified recovery, a clean monitoring window, and an assigned control owner with a deadline. Closure on containment alone is premature.</li></ul><h3>Before you continue</h3><p>You are ready for Module 12 if you can: distinguish operational signals from incident findings; trace a metrics trend to its controllable driver; rewrite technical evidence as a business-language summary; escalate a decision or action to a named owner with a clear request; and plan case closure with monitoring and control ownership attached. Use your labs to practice each skill and ask for feedback on your handoff notes and executive summaries.</p></section>`;
}

function moduleElevenGetSections() {
  return [
    { id: 'lecture', title: 'Lecture', type: 'lecture', isComplete: true, scrollId: 'm11-lecture' },
    { id: 'knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: moduleElevenQuizState?.passed, scrollId: 'm11-knowledge-check' },
    { id: 'operations-labs', title: 'Operations & Reporting Labs', type: 'lab', isComplete: moduleElevenMetricsState.completed && moduleElevenReportState.completed, scrollId: 'm11-lab' },
    { id: 'review', title: 'Module Review', type: 'review', isComplete: true, scrollId: 'm11-review' },
  ];
}

function viewModuleEleven(user, program) {
  moduleElevenLoad(user);
  const module = program.modules['soc-11'];
  const sections = moduleElevenGetSections();
  const lectureOpen = moduleElevenReviewMode || !sections[0].isComplete;
  const quizOpen = moduleElevenReviewMode || (moduleElevenQuizState && !moduleElevenQuizState.passed);
  const labOpen = moduleElevenReviewMode || !sections[2].isComplete;
  const reviewOpen = moduleElevenReviewMode;

  const html = `<div class="m11-shell">${moduleTopbar(user, program)}<main class="m11-main">
${moduleProgressShell(sections, { reviewMode: moduleElevenReviewMode })}
<details class="m11-section-collapsible" id="m11-lecture-section" ${lectureOpen ? 'open' : ''}><summary><span class="m11-section-badge">1</span><h2>Lecture</h2></summary><div class="m11-section-body" id="m11-lecture">
  <section class="m11-practice-note"><i class="ri-compass-3-line" aria-hidden="true"></i><div><p class="m11-kicker">Independent practice</p><h2>Read the objective and dataset, then choose your own working order.</h2><p>No prescribed sequence or pre-submission hints are provided. Scoring feedback and a reference model appear after you submit.</p></div></section>
  ${moduleElevenVideoScript()}
</div></details>
<details class="m11-section-collapsible" id="m11-knowledge-section" ${quizOpen ? 'open' : ''}><summary><span class="m11-section-badge">2</span><h2>Knowledge Check</h2></summary><div class="m11-section-body" id="m11-knowledge-check">
  ${moduleElevenQuizPanel()}
</div></details>
<details class="m11-section-collapsible" id="m11-lab-section" ${labOpen ? 'open' : ''}><summary><span class="m11-section-badge">3</span><h2>Operations & Reporting Labs</h2></summary><div class="m11-section-body"><div id="m11-lab-dynamic">${moduleElevenDynamic()}</div></div></details>
<details class="m11-section-collapsible" id="m11-review-section" ${reviewOpen ? 'open' : ''}><summary><span class="m11-section-badge">4</span><h2>Module Review</h2></summary><div class="m11-section-body" id="m11-review">
  ${moduleElevenReview()}
</div></details>
<details class="m11-section-collapsible" id="m11-sources-section" ${moduleElevenReviewMode ? 'open' : ''}><summary><span class="m11-section-badge">5</span><h2>Sources &amp; Further Reading</h2></summary><div class="m11-section-body">
  ${moduleSourcesBlock(MODULE_ELEVEN_SOURCES_LIST)}
</div></details>
</main></div>`;
  return html;
}

function moduleElevenRender(focusId) {
  const root = document.getElementById('m11-lab-dynamic');
  if (!root) return;
  root.innerHTML = moduleElevenDynamic();
  const completeCount = document.getElementById('m11-complete-count');
  if (completeCount) completeCount.textContent = `${Number(moduleElevenMetricsState.completed) + Number(moduleElevenReportState.completed)}/2`;
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function moduleElevenToggle(list, value, checked) {
  return checked ? [...new Set([...list, value])] : list.filter((item) => item !== value);
}

function moduleElevenEvidenceScore(selected, rows, expectedCount) {
  const correct = selected.filter((id) => rows.find((row) => row.id === id)?.relevant).length;
  const wrong = selected.length - correct;
  return Math.max(0, Math.min(25, Math.round((correct / expectedCount) * 25) - (wrong * 3)));
}

function moduleElevenMetricsScore() {
  const observation = moduleElevenEvidenceScore(moduleElevenMetricsState.selectedEvidence, MODULE_ELEVEN_METRIC_EVIDENCE, 5);
  const analysis = (moduleElevenMetricsState.primaryCause === 'rule-capacity' ? 15 : 0) + (moduleElevenMetricsState.trendConclusion === 'degrading' ? 10 : 0);
  const decision = (moduleElevenMetricsState.action === 'tune-prioritize' ? 15 : 0) + (moduleElevenMetricsState.escalation === 'duty-detection' ? 15 : 0);
  const note = moduleElevenMetricsState.notes.toLowerCase();
  const communicationChecks = [/(21|171).*(minute|min)|(?:minute|min).*(21|171)/, /(78%|76\s+(?:alert|open|backlog))/, /(unfamiliar travel|false positive|rule noise)/, /(duty manager|detection owner|owner)/];
  const communication = communicationChecks.filter((pattern) => pattern.test(note)).length * 5;
  return { score: observation + analysis + decision + communication, breakdown: { observation, analysis, decision, communication }, feedback: [
    observation === 25 ? 'Observation: The selected signals isolate the degraded speed, SLA, backlog, and concentrated false-positive driver.' : `Observation: ${observation}/25. Use the five signals that directly establish handling degradation and the controllable noise source; exclude healthy availability and context-only staffing.`,
    analysis === 25 ? 'Analysis: The conclusion connects the noisy rule and reduced capacity to worsening MTTD, MTTR, SLA, and backlog.' : `Analysis: ${analysis}/25. Distinguish operational degradation from incident impact and identify the concentrated rule noise as the main controllable driver.`,
    decision === 30 ? 'Decision: The proposal preserves coverage, prioritizes aging risk, and names the correct accountable escalation.' : `Decision: ${decision}/30. Tune in a controlled scope, assign aging high-priority work, and notify both the duty manager and detection owner.`,
    communication === 20 ? 'Communication: The handoff quantifies the risk, identifies the driver, and names accountable ownership.' : `Communication: ${communication}/20. Include 21-minute MTTD or 171-minute MTTR, 78% SLA or 76-alert backlog, the noisy rule, and an owner.`,
  ] };
}

function moduleElevenReportScore() {
  const observation = moduleElevenEvidenceScore(moduleElevenReportState.selectedEvidence, MODULE_ELEVEN_CASE_EVENTS, 7);
  const analysis = (moduleElevenReportState.classification === 'confirmed' ? 8 : 0) + (moduleElevenReportState.rootCause === 'archive-script' ? 9 : 0) + (moduleElevenReportState.impact === 'bounded' ? 8 : 0);
  const decision = (moduleElevenReportState.escalation === 'incident-owners' ? 15 : 0) + (moduleElevenReportState.closure === 'verified-monitor' ? 15 : 0);
  const caseNote = moduleElevenReportState.caseNote.toLowerCase();
  const executive = moduleElevenReportState.executiveSummary.toLowerCase();
  const caseChecks = [/(nb-44).*(acct-44)|(acct-44).*(nb-44)/, /(isolate|revok|disable|remov|restore)/];
  const executiveChecks = [/(one|1).*(user|employee|notebook|device)/, /(monitor|residual|no sensitive|no lateral)/];
  const communication = [...caseChecks.map((pattern) => pattern.test(caseNote)), ...executiveChecks.map((pattern) => pattern.test(executive))].filter(Boolean).length * 5;
  return { score: observation + analysis + decision + communication, breakdown: { observation, analysis, decision, communication }, feedback: [
    observation === 25 ? 'Observation: The chosen evidence supports execution, correlation, containment, recovery, and bounded scope.' : `Observation: ${observation}/25. Select the seven records that directly support compromise, affected entities, response, recovery, and scope; leave administrative milestones as context.`,
    analysis === 25 ? 'Analysis: The report states a confirmed but bounded compromise, root cause, and supported business impact.' : `Analysis: ${analysis}/25. Separate confirmed scope from enterprise-wide claims and connect the external archive to unsigned script execution.`,
    decision === 30 ? 'Decision: Escalation names accountable owners, and closure requires verified recovery, monitoring, and follow-up ownership.' : `Decision: ${decision}/30. Escalate to the incident manager and technical owners; do not close on containment alone.`,
    communication === 20 ? 'Communication: The technical note is traceable and the executive summary states impact and residual risk plainly.' : `Communication: ${communication}/20. Name NB-44 and acct-44 plus response actions in the case note; state one-entity impact and monitored residual risk for leaders.`,
  ] };
}

function wireModuleElevenLab() {
  const root = document.getElementById('m11-lab-dynamic');
  if (!root || !moduleElevenMetricsState || !moduleElevenReportState) return;
  root.addEventListener('click', (event) => {
    const labButton = event.target.closest('[data-m11-lab]');
    if (labButton) {
      moduleElevenActiveLab = labButton.dataset.m11Lab;
      moduleElevenRender(moduleElevenActiveLab === 'metrics' ? 'm11-metrics-title' : 'm11-report-title');
      return;
    }
    const eventButton = event.target.closest('[data-m11-event]');
    if (eventButton) {
      const id = eventButton.dataset.m11Event;
      moduleElevenReportState.activeEvent = moduleElevenReportState.activeEvent === id ? '' : id;
      if (!moduleElevenReportState.reviewedEvents.includes(id)) moduleElevenReportState.reviewedEvents.push(id);
      moduleElevenSaveReport();
      moduleElevenRender(moduleElevenReportState.activeEvent ? 'm11-event-detail' : 'm11-case-data-title');
      return;
    }
    if (event.target.closest('[data-m11-close-event]')) {
      moduleElevenReportState.activeEvent = '';
      moduleElevenSaveReport();
      moduleElevenRender('m11-case-data-title');
      return;
    }
    const reset = event.target.closest('[data-m11-reset]');
    if (!reset) return;
    const kind = reset.dataset.m11Reset;
    if (typeof window.confirm === 'function' && !window.confirm(`Reset only the ${kind} lab? The other lab and course progress will stay unchanged.`)) return;
    if (kind === 'metrics') {
      moduleElevenMetricsState = LabRuntime.reset(MODULE_ELEVEN_METRICS_LAB_ID, moduleElevenUser, moduleElevenMetricsFreshDefaults());
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleElevenUser, 'soc-analyst', 'soc-11', MODULE_ELEVEN_METRICS_CATALOG_KEY, false);
      moduleElevenRender('m11-metrics-title');
    } else {
      moduleElevenReportState = LabRuntime.reset(MODULE_ELEVEN_REPORT_LAB_ID, moduleElevenUser, moduleElevenReportFreshDefaults());
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleElevenUser, 'soc-analyst', 'soc-11', MODULE_ELEVEN_REPORT_CATALOG_KEY, false);
      moduleElevenRender('m11-report-title');
    }
  });

  root.addEventListener('input', (event) => {
    if (event.target.name === 'notes') {
      moduleElevenMetricsState.notes = event.target.value;
      moduleElevenSaveMetrics();
      const count = root.querySelector('#m11-metrics-count');
      if (count) count.textContent = `${event.target.value.length}/1200`;
    }
    if (event.target.name === 'caseNote' || event.target.name === 'executiveSummary') {
      moduleElevenReportState[event.target.name] = event.target.value;
      moduleElevenSaveReport();
      const count = root.querySelector(event.target.name === 'caseNote' ? '#m11-case-count' : '#m11-exec-count');
      if (count) count.textContent = `${event.target.value.length}/1400`;
    }
  });

  root.addEventListener('change', (event) => {
    const input = event.target;
    if (input.name === 'metricsEvidence') {
      moduleElevenMetricsState.selectedEvidence = moduleElevenToggle(moduleElevenMetricsState.selectedEvidence, input.value, input.checked);
      moduleElevenSaveMetrics();
      return;
    }
    if (['primaryCause', 'trendConclusion', 'action', 'escalation'].includes(input.name) && moduleElevenActiveLab === 'metrics') {
      moduleElevenMetricsState[input.name] = input.value;
      moduleElevenSaveMetrics();
      return;
    }
    if (input.name === 'reportEvidence') {
      moduleElevenReportState.selectedEvidence = moduleElevenToggle(moduleElevenReportState.selectedEvidence, input.value, input.checked);
      moduleElevenSaveReport();
      return;
    }
    if (['classification', 'rootCause', 'impact', 'escalation', 'closure'].includes(input.name) && moduleElevenActiveLab === 'report') {
      moduleElevenReportState[input.name] = input.value;
      moduleElevenSaveReport();
    }
  });

  root.addEventListener('submit', (event) => {
    if (event.target.id === 'm11-metrics-form') {
      event.preventDefault();
      moduleElevenMetricsState.notes = event.target.elements.notes.value;
      const missing = [];
      if (moduleElevenMetricsState.selectedEvidence.length < 4) missing.push('select at least four material metric signals');
      if (!moduleElevenMetricsState.primaryCause || !moduleElevenMetricsState.trendConclusion) missing.push('complete the operational analysis');
      if (!moduleElevenMetricsState.action || !moduleElevenMetricsState.escalation) missing.push('complete the action and escalation decisions');
      if (moduleElevenMetricsState.notes.trim().length < 160) missing.push('write a 160-character shift handoff');
      if (missing.length) {
        moduleElevenMetricsState.validationError = `${missing.join('; ')}. Your current work remains saved.`;
      } else {
        const result = moduleElevenMetricsScore();
        moduleElevenMetricsState.attempts += 1;
        moduleElevenMetricsState.score = result.score;
        moduleElevenMetricsState.bestScore = Math.max(moduleElevenMetricsState.bestScore || 0, result.score);
        moduleElevenMetricsState.breakdown = result.breakdown;
        moduleElevenMetricsState.feedback = result.feedback;
        moduleElevenMetricsState.validationError = '';
        moduleElevenMetricsState.lastSubmittedAt = new Date().toISOString();
        const metricsPassed = result.score >= MODULE_ELEVEN_PASSING_SCORE;
        if (typeof recordLabAttempt === 'function') {
          recordLabAttempt(moduleElevenUser, MODULE_ELEVEN_METRICS_CATALOG_KEY, {
            state: metricsPassed ? 'complete' : 'in_progress',
            score: result.score,
            result: { breakdown: result.breakdown, feedback: result.feedback, attempts: moduleElevenMetricsState.attempts },
          });
        }
        if (metricsPassed) {
          moduleElevenMetricsState.completed = true;
          if (!moduleElevenMetricsState.flags.includes(MODULE_ELEVEN_METRICS_FLAG)) moduleElevenMetricsState.flags.push(MODULE_ELEVEN_METRICS_FLAG);
          if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleElevenUser, 'soc-analyst', 'soc-11', MODULE_ELEVEN_METRICS_CATALOG_KEY);
        }
      }
      moduleElevenSaveMetrics();
      moduleElevenRender('m11-feedback');
      return;
    }
    if (event.target.id === 'm11-report-form') {
      event.preventDefault();
      moduleElevenReportState.caseNote = event.target.elements.caseNote.value;
      moduleElevenReportState.executiveSummary = event.target.elements.executiveSummary.value;
      const missing = [];
      if (moduleElevenReportState.selectedEvidence.length < 5) missing.push('select at least five supporting case events');
      if (!moduleElevenReportState.classification || !moduleElevenReportState.rootCause || !moduleElevenReportState.impact) missing.push('complete the case analysis');
      if (!moduleElevenReportState.escalation || !moduleElevenReportState.closure) missing.push('complete escalation and closure decisions');
      if (moduleElevenReportState.caseNote.trim().length < 180) missing.push('write a 180-character technical case note');
      if (moduleElevenReportState.executiveSummary.trim().length < 160) missing.push('write a 160-character executive summary');
      if (missing.length) {
        moduleElevenReportState.validationError = `${missing.join('; ')}. Your current work remains saved.`;
      } else {
        const result = moduleElevenReportScore();
        moduleElevenReportState.attempts += 1;
        moduleElevenReportState.score = result.score;
        moduleElevenReportState.bestScore = Math.max(moduleElevenReportState.bestScore || 0, result.score);
        moduleElevenReportState.breakdown = result.breakdown;
        moduleElevenReportState.feedback = result.feedback;
        moduleElevenReportState.validationError = '';
        moduleElevenReportState.lastSubmittedAt = new Date().toISOString();
        const reportPassed = result.score >= MODULE_ELEVEN_PASSING_SCORE;
        if (typeof recordLabAttempt === 'function') {
          recordLabAttempt(moduleElevenUser, MODULE_ELEVEN_REPORT_CATALOG_KEY, {
            state: reportPassed ? 'complete' : 'in_progress',
            score: result.score,
            result: { breakdown: result.breakdown, feedback: result.feedback, attempts: moduleElevenReportState.attempts },
          });
        }
        if (reportPassed) {
          moduleElevenReportState.completed = true;
          if (!moduleElevenReportState.flags.includes(MODULE_ELEVEN_REPORT_FLAG)) moduleElevenReportState.flags.push(MODULE_ELEVEN_REPORT_FLAG);
          if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleElevenUser, 'soc-analyst', 'soc-11', MODULE_ELEVEN_REPORT_CATALOG_KEY);
        }
      }
      moduleElevenSaveReport();
      moduleElevenRender('m11-feedback');
    }
  });
}

function wireModuleEleven() {
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
  wireModuleElevenLab();
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 11, moduleKey: 'soc-11', view: viewModuleEleven, wire: wireModuleEleven });
