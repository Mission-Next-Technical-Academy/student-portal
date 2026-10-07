/* Module 11 — independent SOC operations and communication practice.
 * All metrics, people, systems, and incident evidence are synthetic and local.
 */

const MODULE_ELEVEN_METRICS_LAB_ID = 'm11-soc-metrics-v1';
const MODULE_ELEVEN_GUIDED_CASE_ID = 'OPS-6640';
const MODULE_ELEVEN_GUIDED_REPLACEMENTS = {
  'M11-': 'M11G-', 'Q-': 'GQ-', 'R-': 'GR-', 'OPS-5511': 'OPS-6640', 'INC-4937': 'INC-6240', 'INC-5020': 'INC-6242',
  'ws-173': 'ws-264', 'acct-173': 'acct-264', 'fs-02': 'fs-07', 'an-okafor': 'an-blake', 'an-ruiz': 'an-morgan',
  'an-chen': 'an-jordan', 'an-patel': 'an-silva', 'ir-lead-owners': 'response-leads', 'identity-owners': 'directory-owners',
  'detection-engineering': 'detection-content', 'fs02-service-owner': 'fs07-service-owner', 'SHIFT-0927-DAY': 'SHIFT-1004-EARLY',
  '2026-09-27': '2026-10-04', 'Analyst Okafor': 'Analyst Blake', 'Analyst Ruiz': 'Analyst Morgan',
  'Analyst Chen': 'Analyst Jordan', 'Analyst Patel': 'Analyst Silva', 'collector-01': 'collector-11', 'ticketing-01': 'ticketing-02',
  'siem-scheduler-01': 'siem-scheduler-02', 'paging-01': 'paging-02', 'PLT-3318': 'PLT-3402',
};
// Prior-day series dates (2026-09-17..26) shift by one week in a single pass so the guided case never shares them
// with the assessment; the shift day itself (2026-09-27) is mapped by the replacement table above.
const moduleElevenShiftSeriesDates = (text) => text.replace(/2026-09-(1[7-9]|2[0-6])/g, (_, d) => {
  const moved = new Date(Date.UTC(2026, 8, Number(d) + 7));
  return moved.toISOString().slice(0, 10);
});
function moduleElevenGuidedClone(value) {
  if (typeof value === 'string') return moduleElevenShiftSeriesDates(Object.entries(MODULE_ELEVEN_GUIDED_REPLACEMENTS).reduce((text, [from, to]) => text.split(from).join(to), value));
  if (Array.isArray(value)) return value.map(moduleElevenGuidedClone);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, moduleElevenGuidedClone(item)]));
  return value;
}
const MODULE_ELEVEN_GUIDED_FIXTURE = (() => {
  const fixture = moduleElevenGuidedClone(SocM11AssessmentData);
  fixture.scenario.stateKey = 'm11-guided-operations-actions-v1';
  fixture.expectedTruth.dueBy = '2026-10-11';
  return fixture;
})();
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
  return {
    caseId: MODULE_ELEVEN_CASE.caseId,
    userOptions: MODULE_ELEVEN_CASE.userOptions,
    deviceOptions: MODULE_ELEVEN_CASE.deviceOptions,
    departmentOptions: MODULE_ELEVEN_CASE.departmentOptions,
    notesPlaceholder: 'Summarize the operational-metrics signal, the shared-case evidence it corresponds to, and your recommended escalation/closure…',
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
    practiceComplete: false, practiceNotes: '', feedback: [], validationError: '', lastSubmittedAt: '', labProgress: {}, learnItStep: 0,
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
  if (moduleElevenUser?.email !== user?.email) { moduleElevenQuizForceRetake = false; moduleElevenLearnViewed = null; }
  moduleElevenUser = user;
  moduleElevenMetricsState = LabRuntime.loadCaseState(MODULE_ELEVEN_METRICS_LAB_ID, 'soc-11', user, moduleElevenMetricsFreshDefaults());
  moduleElevenReportState = LabRuntime.loadCaseState(MODULE_ELEVEN_REPORT_LAB_ID, 'soc-11', user, moduleElevenReportFreshDefaults());
  moduleElevenGuidedState = LabRuntime.loadCaseState('m11-guided-operations-v1', 'soc-11', user, {
    completed: false, caseRecord: { status: '', affectedUser: '', affectedDevice: '', severity: '', disposition: '', escalation: '', escalateTo: '', notes: '', findings: {}, submitted: false, submittedAt: '', actionHistory: [] },
  });
  if (moduleElevenGuidedState.completed === true && !moduleElevenGuidedState.caseRecord.submitted) { moduleElevenGuidedState.caseRecord.submitted = true; moduleElevenGuidedState.caseRecord.submittedAt ||= new Date().toISOString(); }
  moduleElevenGuidedOpsState = SocM11AssessmentState.load(user, MODULE_ELEVEN_GUIDED_FIXTURE);
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
let moduleElevenLearnViewed = null;
function moduleElevenLearnItHtml() { const deck = LearnItDecks['soc-11']; return LearnItCards.render({ deck, step: moduleElevenMetricsState.learnItStep || 0, viewed: moduleElevenLearnViewed, done: (moduleElevenMetricsState.learnItStep || 0) >= deck.length, prefix: 'm11', id: 'm11-learn-it', headingId: 'm11-learn-title', heading: 'Turn operations into decisions', intro: `${deck.length} ideas for queue health, handoffs, and reporting.`, readyHeading: `SOC operations, in ${deck.length} ideas`, readyText: 'Start with the operating principles, then open the Guided Lab.', readyActionLabel: 'LEARN IT', finalActionLabel: 'Finish', doneHeading: 'Operations principles ready', doneIntro: 'Open the Guided Lab to apply these decisions.' }); }
function moduleElevenWireLearnIt() { const shell = document.querySelector('.m11-shell'); if (!shell || shell.dataset.learnItWired) return; shell.dataset.learnItWired = 'true'; LearnItCards.wire(shell, { prefix: 'm11', onStep: (step) => { moduleElevenMetricsState.learnItStep = step; moduleElevenLearnViewed = null; moduleElevenSaveMetrics(); document.getElementById('m11-learn-it').outerHTML = moduleElevenLearnItHtml(); }, onView: (index) => { moduleElevenLearnViewed = index; document.getElementById('m11-learn-it').outerHTML = moduleElevenLearnItHtml(); shell.querySelector(`[data-m11-learn-view="${index}"]`)?.focus(); } }); }

function moduleElevenGuidedSave() {
  if (moduleElevenUser && moduleElevenGuidedState) LabRuntime.saveCaseState('m11-guided-operations-v1', 'soc-11', moduleElevenUser, moduleElevenGuidedState);
}

function moduleElevenMaybeCompleteGuided() {
  if (!moduleElevenGuidedComplete()) return false;
  if (!moduleElevenGuidedState.completed) {
    moduleElevenGuidedState.completed = true;
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleElevenUser, 'soc-analyst', 'soc-11', MODULE_ELEVEN_METRICS_CATALOG_KEY);
  }
  moduleElevenGuidedSave();
  return true;
}

function moduleElevenUpdateGuidedProgress() {
  const complete = moduleElevenMaybeCompleteGuided();
  const status = document.querySelector('#m11-guided-lab-dynamic .m11-guided-status');
  if (status) status.textContent = complete ? 'Practice shift record complete.' : 'Progress saved. Finish the operations and reporting handoff.';
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
    <article><p class="m11-kicker">Lesson 3 · Knowledge check</p><h4>Test the closure claim</h4><p>Use the lesson material and source list to reject premature closure, unsupported exfiltration claims, and role-only escalation.</p></article>
    <article><p class="m11-kicker">Lesson 3 · Applied task</p><h4>State the decision and next review</h4><p>Translate the same bounded facts into an audience-appropriate closure note with a condition that can be checked on the next review.</p></article>
    <p class="m11-crosswalk-note"><strong>Supplementary draft crosswalk:</strong> this module primarily relates to Security+ SY0-701 Domain 5 (Security Program Management) with secondary Domain 4 (Security Operations). It is a developer-authored mapping pending curriculum/compliance/faculty review, not an approval, certification, affiliation, or pass guarantee.</p>
  </section>`;
}

function moduleElevenVideoScript() {
  return '';
}

function moduleElevenReview() {
  return `<section class="m11-review-section"><h3>Module concepts at a glance</h3><ul><li><strong>Operational metrics vs. incident proof:</strong> A rising MTTD or SLA miss is an operational signal, not direct evidence of a breach. Investigate the signal's root cause before linking it to incident scope.</li><li><strong>Traceability:</strong> When a metric trend occurs, trace it to a specific controllable driver—a rule change, staffing change, or alert-generation threshold. Targeted fixes preserve coverage better than broad disables.</li><li><strong>Audience-appropriate communication:</strong> Technical case notes document entities, actions, and evidence. Executive summaries state business impact, affected scope, residual risk, and next steps in plain language. Write both.</li><li><strong>Escalation accountability:</strong> Escalate upward with quantified risk, a hypothesis, and a specific request to named decision-makers. Broadcast to peers or uncontrolled groups is not escalation.</li><li><strong>Closure discipline:</strong> Close only after verified recovery, a clean monitoring window, and an assigned control owner with a deadline. Closure on containment alone is premature.</li></ul><h3>Before you continue</h3><p>For Module 12, be ready to distinguish metrics from incident findings, trace trends to controllable drivers, and summarize technical evidence in business language. Practice named escalation, clear requests, and closure plans with monitoring and control ownership in your labs.</p></section>`;
}

function moduleElevenGetSections() {
  // Server-verified modules (finished on another device, before the 09-27
  // lab rebuild, or by admin override) read complete instead of empty.
  const verified = moduleElevenUser?.remoteVerifiedModuleProgress?.['soc-11'] === true;
  return [
    { id: 'lecture', title: 'Learn It', type: 'lecture', isComplete: true, scrollId: 'm11-lecture' },
    { id: 'guided-lab', title: 'Guided Lab', type: 'lab', isComplete: verified || moduleElevenGuidedComplete(), scrollId: 'm11-guided-lab' },
    { id: 'assessment-lab', title: 'Assessment Lab', type: 'review', isComplete: verified || moduleElevenReportState.completed, scrollId: 'm11-assessment-lab' },
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


// Instant Practice It score: each SOC-operations competency counts equally.
function moduleElevenGuidedScoreItems() {
  const ops = moduleElevenGuidedOpsState || {};
  const cr = moduleElevenGuidedState.caseRecord;
  return [
    ['Prioritized the alert queue', (ops.priorityOrder || []).length > 0],
    ['Interpreted the shift metrics', (ops.interpretations || []).length > 0],
    ['Wrote a shift handoff with a follow-up owner', (ops.handoffs || []).length > 0],
    ['Wrote both the executive and the technical report', Boolean(ops.reports?.executive?.summary && ops.reports?.technical?.summary)],
    ['Documented queue risk and next verification in the ticket', (cr.notes || '').trim().length >= 80],
  ];
}
function moduleElevenGuidedSubmit() {
  const cr = moduleElevenGuidedState.caseRecord;
  if (cr.submitted) return;
  const at = new Date().toISOString();
  const routes = MODULE_ELEVEN_GUIDED_FIXTURE.scenario.escalationRoutes.map((route) => ({ id: route.id }));
  if (caseRecordMissing(cr, { departmentOptions: routes }).length) {
    cr.showMissing = true;
  } else {
    const result = practiceResult(moduleElevenGuidedScoreItems());
    cr.showMissing = false;
    cr.practiceResult = result;
    cr.actionHistory.push({ action: `Practice scored ${result.score}% (${result.passed ? 'pass' : 'not passed'})`, at });
    if (result.passed) {
      cr.submitted = true;
      cr.submittedAt = at;
      moduleElevenGuidedState.completed = true; moduleElevenGuidedState.guideStep = 3; moduleElevenGuidedState.guideDocked = true;
    }
  }
  moduleElevenGuidedSave();
  moduleElevenUpdateGuidedProgress();
  moduleElevenRenderGuided();
}
function moduleElevenGuidedComplete() {
  return moduleElevenGuidedState?.caseRecord?.submitted === true;
}

function moduleElevenGuidedEvidenceReady() {
  const ops = moduleElevenGuidedOpsState || {};
  const cr = moduleElevenGuidedState?.caseRecord || {};
  return (ops.priorityOrder || []).length > 0 && (ops.interpretations || []).length > 0 && (ops.handoffs || []).length > 0
    && Boolean(ops.reports?.executive?.summary && ops.reports?.technical?.summary && cr.status && cr.affectedUser && cr.affectedDevice && cr.severity && cr.disposition && cr.escalateTo && cr.notes?.trim().length >= 35);
}

function moduleElevenGuidedCaseTicket() {
  const s = MODULE_ELEVEN_GUIDED_FIXTURE.scenario;
  const endpoint = s.incident.entities.find((id) => id.startsWith('ws-'));
  const user = s.incident.entities.find((id) => id.startsWith('acct-'));
  const routes = s.escalationRoutes.map((route) => ({ id: route.id, text: route.label }));
  const html = caseRecordPane(moduleElevenGuidedState.caseRecord, {
    caseId: MODULE_ELEVEN_GUIDED_CASE_ID, ticketId: 'INC-6240', ticketType: 'SOC Operations & Shift Handoff',
    userOptions: [{ id: user, text: `${user} · affected incident account` }], deviceOptions: [{ id: endpoint, text: `${endpoint} · confirmed impact endpoint` }],
    departmentOptions: routes, formId: 'm11-guided-case-form', saveAttr: 'data-m11-guided-save-case', submitAttr: 'data-m11-guided-submit-case', panelId: 'm11-guided-case-panel',
    notesPlaceholder: 'Summarize the queue risk, case scope, named follow-up owner, and next verification time.', practiceSubmitted: true, practiceScored: true,
    practiceResult: moduleElevenGuidedState.caseRecord.practiceResult, showMissing: moduleElevenGuidedState.caseRecord.showMissing === true,
  });
  return moduleElevenGuidedState.caseRecord.submitted ? `${html}<button type="button" class="m01-reset" data-m11-guided-restart>Restart Guided Lab</button>` : html;
}

function moduleElevenGuidedRestart() {
  const cr = moduleElevenGuidedState.caseRecord;
  moduleElevenGuidedState.caseRecord = { ...cr, status: 'New', affectedUser: '', affectedDevice: '', severity: '', disposition: '', escalation: '', escalateTo: '', findings: {}, notes: '', submitted: false, submittedAt: '', practiceResult: null, showMissing: false, actionHistory: [] };
  moduleElevenGuidedState.completed = false; moduleElevenGuidedState.guideStep = 0; moduleElevenGuidedState.guideDocked = false;
  moduleElevenGuidedSave(); moduleElevenRenderGuided();
}

function moduleElevenGuidedSteps() {
  return [
    { title: 'Read the ticket', body: 'Review the shift context, affected case, and expected decision or handoff.', lookFor: 'The ticket describes the work to resolve; queue metrics alone do not prove an incident.', lab: 'Confirm the case scope and audience.', tab: 'case', target: '.m01-ticket-id' },
    { title: 'Start from the lead', body: 'Open the highest-priority alert or shift lead and check its age and stated impact.', lookFor: 'The current queue and service context behind the assigned work.', lab: 'Orient to the operational starting point.', tab: 'alerts', target: 'tr[data-m03e-select$=":alert:GQ-01"]' },
    { title: 'Prioritize the queue', body: 'Compare severity, business impact, and SLA age to select the work needing attention first.', lookFor: 'A measurable reason for urgency and any competing queue risk.', lab: 'Set a defensible priority order.', tab: 'operations', target: 'form[data-m11-operation="priority"]' },
    { title: 'Trace the signal and handoff', body: 'Connect a metrics trend to a controllable driver and write a clear owner request.', lookFor: 'A rule, staffing, or threshold change and an actionable next step.', lab: 'Prepare technical and audience-appropriate reporting.', tab: 'reporting', target: 'form[data-m11-report="escalation"]' },
    { title: 'Separate primary and contributing evidence', body: 'Distinguish direct incident findings from operational indicators that provide context but do not prove compromise.', lookFor: 'Case evidence versus queue, response-time, or SLA metrics.', lab: 'State what the shift evidence does and does not establish.', tab: 'reporting', target: 'form[data-m11-report="technical"]' },
    { title: 'Set scope and decide', body: 'Choose disposition and escalation based on verified case facts, residual risk, and accountable owners.', lookFor: 'A specific decision, request, and verification deadline.', lab: 'Complete the bounded shift handoff.', tab: 'case', target: '.m01-ticket-grid' },
    { title: 'Submit the ticket', body: 'Record residual risk, next owner, and verification time in the ITSM ticket, then submit.', lookFor: 'A concise handoff that separates metrics from incident proof.', lab: 'Submit the ticket when the handoff is ready.', tab: 'case', target: '.m01-ticket-actions' },
  ];
}

function moduleElevenGuidedLabPanel() {
  const complete = moduleElevenGuidedComplete();
  const cr = moduleElevenGuidedState.caseRecord;
  const steps = moduleElevenGuidedSteps();
  // Move the console to the guide's tab only when the guide step changes; doing
  // it on every render yanked the learner off the tab they were working in.
  const guideStepIndex = Math.min(moduleElevenGuidedState.guideStep || 0, steps.length - 1);
  if (!complete && m03eState('m11-guided').guideTabStep !== guideStepIndex) { m03eState('m11-guided').tab = steps[guideStepIndex].tab; m03eState('m11-guided').guideTabStep = guideStepIndex; moduleElevenGuidedSave(); }
  const quality = (value, expected, contributing = []) => !value ? 'missed' : value === expected ? 'captured' : contributing.includes(value) ? 'contributing' : 'missed';
  const ops = moduleElevenGuidedOpsState || {}; const reports = ops.reports || {};
  const opsCount = (ops.priorityOrder || []).length + (ops.interpretations || []).length + (ops.handoffs || []).length + (reports.executive?.summary ? 1 : 0) + (reports.technical?.summary ? 1 : 0);
  const notes = (cr.notes || '').toLowerCase(); const entities = /acct-264/.test(notes) && /ws-264/.test(notes); const bounded = /residual|risk|owner|verify|deadline|follow/.test(notes); const metric = /sla|response|queue|metric|trend/.test(notes);
  const debrief = complete ? guidedLabDebrief({ story: 'The shift evidence supports an operational queue and service health decision. Metrics such as response time or SLA age are operational signals; they do not by themselves prove a security incident.', fields: [
    { name: 'Ticket status', status: quality(cr.status, 'in-progress', ['pending']), note: 'Keep follow-up active until the named owner verifies the change.' },
    { name: 'Affected user', status: quality(cr.affectedUser, MODULE_ELEVEN_GUIDED_FIXTURE.scenario.incident.entities.find((id) => id.startsWith('acct-')), []), note: 'Name the account directly tied to the assigned case.' },
    { name: 'Affected device', status: quality(cr.affectedDevice, MODULE_ELEVEN_GUIDED_FIXTURE.scenario.incident.entities.find((id) => id.startsWith('ws-')), []), note: 'Name the endpoint directly tied to the assigned case.' },
    { name: 'Severity', status: quality(cr.severity, 'High', ['Critical']), note: 'Reflect verified incident context; queue severity alone is not proof.' },
    { name: 'Disposition', status: quality(cr.disposition, 'true-positive', ['false-negative']), note: 'Classify the supported case findings.' },
    { name: 'Queue and reporting evidence', status: opsCount >= 5 ? 'captured' : opsCount > 0 ? 'contributing' : 'missed', note: 'Use a priority rationale, signal interpretation, actionable handoff, and both report audiences.' },
    { name: 'Escalation and department', status: cr.escalation === 'required' && cr.escalateTo === 'response-leads' ? 'captured' : cr.escalation === 'required' && cr.escalateTo === 'directory-owners' ? 'contributing' : 'missed', note: 'Assign the shift response lead; directory owners may contribute to follow-up.' },
    { name: 'Evidence and handoff notes', status: entities && bounded && metric ? 'captured' : entities || bounded || metric ? 'contributing' : 'missed', note: 'Quantify operational context, keep incident scope bounded, and name owner and verification.' },
  ], handoff: 'A strong handoff quantifies the queue or case risk, separates metrics from incident proof, names the decision maker and action owner, and sets a verification deadline.' }) : '';
  const guide = guidedLabGuide('m11', steps, { step: moduleElevenGuidedState.guideStep, docked: complete ? moduleElevenGuidedState.guideDocked !== false : moduleElevenGuidedState.guideDocked, prefix: 'm11-guided', submitted: complete, debriefHtml: debrief });
  const consoleHtml = moduleThreeConsoleHtml('m11-guided');
  return `<section class="m11-guided-case"><p class="m11-panel-instruction">Run this synthetic shift, leave a bounded handoff, and write the audience reports.</p>
    ${complete ? '' : guide}
    <div class="m03e-console-host" id="m03e-console-m11-guided">${complete ? consoleHtml.replace('</header>', `${guide}</header>`) : consoleHtml}</div>
    <p class="m11-guided-status" role="status">${complete ? 'Practice submitted.' : `${moduleElevenGuidedEvidenceReady() ? 'Queue and reporting handoff captured. ' : 'Continue reviewing the shift evidence and reporting needs. '}Submit the ITSM ticket to complete this Guided Lab.`}</p>
  </section>`;
}

function moduleElevenAssessmentLabPanel() {
  // A returned shift must show the instructor's notes and accept a resubmission;
  // this panel has no case ticket to carry the redo state like other modules.
  const redo = moduleElevenCaseRedoRequested();
  const submitted = moduleElevenReportState.submitted === true && !redo;
  const graded = moduleElevenCaseReviewStatus() === 'graded';
  return `<section class="m11-external-lab" id="m11-assessment-lab-panel">
    <p class="m11-panel-instruction">Complete the shift assessment in the Operations and Reporting tabs, then submit for faculty review. Imported practice is listed separately under Optional Labs.</p>
    ${redo ? `<p role="status"><strong>Returned for remediation.</strong> Review your instructor's feedback, update the Operations and Reporting tabs, then resubmit.</p>${moduleElevenCaseRedoFeedback()}` : ''}
    ${submitted ? `<p role="status">${graded ? 'Lab graded' : 'Submitted for faculty review'}</p>${graded ? caseRecordGradedFeedbackHtml() : ''}` : `<p><button type="button" data-m11-submit-score>${redo ? 'Resubmit shift assessment' : 'Submit shift assessment'}</button></p>`}
  </section>`;
}

function moduleElevenPositionGuidedGuide(root = document.getElementById('m11-guided-lab-dynamic')) {
  const host = root?.querySelector('#m03e-console-m11-guided');
  const tip = root?.querySelector('#m11-guided-learn-tip');
  const workspace = host?.querySelector('.m03e-workspace');
  if (!host || !tip || !workspace) return;
  tip.classList.add('is-visible');
  if (moduleElevenGuidedState.caseRecord.submitted || moduleElevenGuidedState.guideDocked === true) {
    host.querySelector('header')?.append(tip);
    consoleGuidePosition(tip, workspace, null);
  } else {
    workspace.prepend(tip);
    consoleGuidePosition(tip, workspace, null);
  }
}
M03E_AFTER_RENDER['m11-guided'] = function () {
  const root = document.getElementById('m11-guided-lab-dynamic');
  const host = document.getElementById('m03e-console-m11-guided');
  if (!root || !host) return;
  if (!root.querySelector('#m11-guided-learn-tip')) {
    const complete = moduleElevenGuidedComplete();
    const cr = moduleElevenGuidedState.caseRecord;
    const steps = moduleElevenGuidedSteps();
    const quality = (value, expected, contributing = []) => !value ? 'missed' : value === expected ? 'captured' : contributing.includes(value) ? 'contributing' : 'missed';
    const ops = moduleElevenGuidedOpsState || {}; const reports = ops.reports || {};
    const opsCount = (ops.priorityOrder || []).length + (ops.interpretations || []).length + (ops.handoffs || []).length + (reports.executive?.summary ? 1 : 0) + (reports.technical?.summary ? 1 : 0);
    const notes = (cr.notes || '').toLowerCase(); const entities = /acct-264/.test(notes) && /ws-264/.test(notes); const bounded = /residual|risk|owner|verify|deadline|follow/.test(notes); const metric = /sla|response|queue|metric|trend/.test(notes);
    const debrief = complete ? guidedLabDebrief({ story: 'The shift evidence supports an operational queue and service health decision. Metrics such as response time or SLA age are operational signals; they do not by themselves prove a security incident.', fields: [
      { name: 'Ticket status', status: quality(cr.status, 'in-progress', ['pending']), note: 'Keep follow-up active until the named owner verifies the change.' },
      { name: 'Affected user', status: quality(cr.affectedUser, MODULE_ELEVEN_GUIDED_FIXTURE.scenario.incident.entities.find((id) => id.startsWith('acct-')), []), note: 'Name the account directly tied to the assigned case.' },
      { name: 'Affected device', status: quality(cr.affectedDevice, MODULE_ELEVEN_GUIDED_FIXTURE.scenario.incident.entities.find((id) => id.startsWith('ws-')), []), note: 'Name the endpoint directly tied to the assigned case.' },
      { name: 'Severity', status: quality(cr.severity, 'High', ['Critical']), note: 'Reflect verified incident context; queue severity alone is not proof.' },
      { name: 'Disposition', status: quality(cr.disposition, 'true-positive', ['false-negative']), note: 'Classify the supported case findings.' },
      { name: 'Queue and reporting evidence', status: opsCount >= 5 ? 'captured' : opsCount > 0 ? 'contributing' : 'missed', note: 'Use a priority rationale, signal interpretation, actionable handoff, and both report audiences.' },
      { name: 'Escalation and department', status: cr.escalation === 'required' && cr.escalateTo === 'response-leads' ? 'captured' : cr.escalation === 'required' && cr.escalateTo === 'directory-owners' ? 'contributing' : 'missed', note: 'Assign the shift response lead; directory owners may contribute to follow-up.' },
      { name: 'Evidence and handoff notes', status: entities && bounded && metric ? 'captured' : entities || bounded || metric ? 'contributing' : 'missed', note: 'Quantify operational context, keep incident scope bounded, and name owner and verification.' },
    ], handoff: 'A strong handoff quantifies the queue or case risk, separates metrics from incident proof, names the decision maker and action owner, and sets a verification deadline.' }) : '';
    const guide = guidedLabGuide('m11', steps, { step: moduleElevenGuidedState.guideStep, docked: complete ? moduleElevenGuidedState.guideDocked !== false : moduleElevenGuidedState.guideDocked, prefix: 'm11-guided', submitted: complete, debriefHtml: debrief });
    const tpl = document.createElement('template');
    tpl.innerHTML = guide;
    const fresh = tpl.content.querySelector('#m11-guided-learn-tip');
    if (fresh) root.prepend(fresh);
  }
  moduleElevenPositionGuidedGuide(root);
};

function moduleElevenRenderGuided() {
  const root = document.getElementById('m11-guided-lab-dynamic');
  if (!root) return;
  root.innerHTML = moduleElevenGuidedLabPanel();
  const consoleRoot = root.querySelector('#m03e-console-m11-guided');
  moduleElevenWireConsole(consoleRoot, MODULE_ELEVEN_GUIDED_FIXTURE, () => moduleElevenGuidedOpsState,
    (next) => { moduleElevenGuidedOpsState = next; },
    (next) => { moduleElevenGuidedOpsState = SocM11AssessmentState.save(moduleElevenUser, next, MODULE_ELEVEN_GUIDED_FIXTURE); moduleElevenGuidedSave(); },
    moduleElevenGuidedConsole);
  moduleElevenPositionGuidedGuide(root);
}

// Imported practice only: shown in the shared Optional Labs section (like
// Modules 04-10) and never gates the SIEM Guided/Assessment Labs.
function moduleElevenAdditionalLabs() {
  return missionNextOptionalLabsSection(11, [
    { title: 'Visualizing Active Directory Performance Metrics with Cacti', detail: 'Optional dashboard and reporting practice', href: 'imported-labs/mission-next-labs/index.html#/track/active-directory/project/ad-7/lab', labId: 'assessment-1' },
    { title: 'Real-time Active Directory Metrics with Datadog', detail: 'Operational monitoring and metric context', href: 'imported-labs/mission-next-labs/index.html#/track/active-directory/project/ad-3/lab', labId: 'additional-1' },
    { title: 'Active Directory Performance Monitoring with Checkmk', detail: 'Service checks and monitoring ownership', href: 'imported-labs/mission-next-labs/index.html#/track/active-directory/project/ad-5/lab', labId: 'additional-2' },
  ], moduleElevenReportState.labProgress);
}

function wireModuleElevenOptionalLabs() {
  const root = document.getElementById('m11-additional-labs-dynamic');
  if (!root || !moduleElevenReportState) return;
  wireMissionNextLabGating(root, moduleElevenReportState.labProgress, () => {
    moduleElevenSaveReport();
    root.innerHTML = moduleElevenAdditionalLabs();
    wireModuleElevenOptionalLabs();
  });
}

// The shift assessment uses the same Module 3 console shell as the earlier
// investigations. Operational actions and audience-specific reporting live
// in dedicated console tabs and are persisted by the append-only M11 engine.
function moduleElevenConsoleData(fixture = SocM11AssessmentData) {
  const s = fixture.scenario;
  const events = s.queue.map((item, index) => m03eRow('AlertQueue', item.id, item.createdAt.slice(0, 10), item.createdAt.slice(11, 19), {
    // Entity identity contract: Host is the system the alert fired on (never the title); Account is the principal
    // that raised the queue record (the rule engine, as in QueueActivity AlertCreated); the owner is AssigneeId,
    // null while unassigned.
    EventType: item.kind, AlertTitle: item.title, Host: item.host, Account: 'siem-rules', AssigneeId: item.assigneeId || null, Result: item.status,
    Severity: item.severity, RuleId: item.ruleId, BusinessImpact: item.businessImpact,
    Detail: `SLA ${item.slaMinutes} minutes; queue position ${index + 1}${item.evidenceNote ? `. ${item.evidenceNote}` : ''}`,
  })).concat(s.incident.recoveryEvidence.map((e) => m03eRow('RecoveryRecords', e.id, e.time.slice(0, 10), e.time.slice(11, 19), {
    EventType: 'RecoveryValidation', Host: /file-share/i.test(e.summary) ? s.incident.entities.find((id) => id.startsWith('fs-')) : s.incident.entities.find((id) => id.startsWith('ws-')), Account: 'soc-analyst', Result: e.status, Detail: e.summary,
  }))).concat(moduleElevenOperationalRows(s));
  const ops = s.operations || { dailyMetrics: [], shiftMetrics: [], ruleVolume: [], ruleChanges: [] };
  return m03eBuildDataset({ caseId: s.caseId, day: s.start.slice(0, 10), events,
    identities: s.analysts.map((a) => ({ Account: a.id, DisplayName: a.name, Type: a.role, Department: 'SOC', Owner: a.name, Privileged: 'No', UsualSourceIp: '—' })),
    ips: [], watchlists: { Rules: { title: 'Detection rules', rows: s.rules.map((r) => ({ RuleId: r.id, Rule: r.name, Owner: r.owner })) },
      RecoveryEvidence: { title: 'Recovery evidence', rows: s.incident.recoveryEvidence.map((e) => ({ EvidenceId: e.id, Time: e.time, Status: e.status, Summary: e.summary })) },
      // Operational metrics are aggregates over a stated window (WindowStart/WindowEnd). They are not events and not incident proof.
      DailyOpsMetrics: { title: 'Daily SOC metrics (operational)', rows: ops.dailyMetrics.map((m) => ({ MetricId: m.id, WindowStart: m.windowStart, WindowEnd: m.windowEnd, WindowType: m.windowType, AlertVolume: m.alertVolume, AnalystsOnShift: m.analystsOnShift, MttaMinutes: m.mttaMinutes, MttContainMinutes: m.mttcMinutes, SlaAttainmentPct: m.slaAttainmentPct, BacklogAtWindowEnd: m.backlogAtWindowEnd, Note: m.note })) },
      ShiftOpsMetrics: { title: 'Same-shift metrics, 08:00-12:00 UTC (operational)', rows: ops.shiftMetrics.map((m) => ({ MetricId: m.id, WindowStart: m.windowStart, WindowEnd: m.windowEnd, AlertVolume: m.alertVolume, R04Alerts: m.r04Alerts, OtherRuleAlerts: m.otherRuleAlerts, AnalystsOnShift: m.analystsOnShift, MttaMinutes: m.mttaMinutes, AcknowledgedWithinSlaPct: m.acknowledgedWithinSlaPct })) },
      RuleAlertVolume: { title: 'Alerts per rule per day (operational)', rows: ops.ruleVolume.map((m) => ({ MetricId: m.id, RuleId: m.ruleId, WindowStart: m.windowStart, WindowEnd: m.windowEnd, Alerts: m.alerts })) },
      RuleChanges: { title: 'Detection rule change records', rows: ops.ruleChanges.map((c) => ({ ChangeId: c.id, ChangeTime: c.changeTime, RuleId: c.ruleId, Author: c.author, ChangeType: c.type, Summary: c.summary, Approval: c.approval, Status: c.status })) } },
    alerts: s.queue.map((item) => ({ id: item.id, time: item.createdAt, severity: item.severity, title: item.title, entities: s.incident.entities, rule: item.ruleId, query: `AlertQueue\n| where EventId == "${item.id}"` })), now: s.end,
  });
}
/* Operational event rows around the shift: ticket lifecycle, on-call pages, rule execution windows, collector
 * health and the shift log. Each row's TimeGenerated is event time; IngestionTime (where present) is SIEM receipt;
 * RuleRuns carry the aggregation window as WindowStart/WindowEnd. Queue-derived rows always agree with the queue. */
function moduleElevenOperationalRows(s) {
  const ops = s.operations;
  if (!ops) return [];
  const prefix = s.id.split('-')[0];
  const iso = (ms) => new Date(ms).toISOString().replace('.000Z', 'Z');
  const plus = (value, seconds) => iso(Date.parse(value) + seconds * 1000);
  const row = (table, id, iso, fields) => m03eRow(table, id, iso.slice(0, 10), iso.slice(11, 19), fields);
  const rows = [];
  let n = 0;
  const nextId = (code) => `${prefix}-${code}-${String(++n).padStart(3, '0')}`;
  const queue = s.queue.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  // Items added after the original fixture (lateAdded) are emitted last so every earlier generated EventId, and any
  // evidence a learner already pinned, keeps its meaning.
  const queueRows = (item, base) => {
    const out = [];
    out.push(row('QueueActivity', nextId('QA'), item.createdAt, { ...base, EventType: 'AlertCreated', Account: 'siem-rules', Result: 'new', IngestionTime: plus(item.createdAt, 15), Detail: `${item.id} created by rule ${item.ruleId}; SLA ${item.slaMinutes} minutes.` }));
    if (item.acknowledgedAt) out.push(row('QueueActivity', nextId('QA'), item.acknowledgedAt, { ...base, EventType: 'AlertAcknowledged', Account: item.assigneeId || 'soc-analyst', Result: 'acknowledged', IngestionTime: plus(item.acknowledgedAt, 15), Detail: `${item.id} acknowledged ${Math.round((Date.parse(item.acknowledgedAt) - Date.parse(item.createdAt)) / 60000)} minutes after creation.` }));
    if (item.containedAt) out.push(row('QueueActivity', nextId('QA'), item.containedAt, { ...base, EventType: 'ContainmentRecorded', Account: item.assigneeId || 'soc-analyst', Result: 'contained', IngestionTime: plus(item.containedAt, 15), Detail: `Containment timestamp recorded for ${item.id}.` }));
    if (item.severity === 'critical' || item.severity === 'high') {
      out.push(row('OnCallPages', nextId('PG'), plus(item.createdAt, 30), { Host: 'paging-01', RuleId: item.ruleId, QueueId: item.id, EventType: 'PageSent', Account: 'on-call-router', Result: 'delivered', Detail: `${item.severity} alert ${item.id} paged to the on-call analyst group.` }));
    }
    return out;
  };
  const lateQueue = queue.filter((item) => item.lateAdded);
  const appendLateQueueRows = () => lateQueue.forEach((item) => {
    const base = { Host: 'ticketing-01', RuleId: item.ruleId, QueueId: item.id, Severity: item.severity };
    rows.push(...queueRows(item, base));
    if (item.assigneeId && item.acknowledgedAt) {
      rows.push(row('QueueActivity', nextId('QA'), plus(item.acknowledgedAt, -60), { ...base, EventType: 'AlertAssigned', Account: item.assigneeId, Result: 'assigned', IngestionTime: plus(item.acknowledgedAt, -45), Detail: `${item.id} assigned to ${item.assigneeId}.` }));
    }
  });
  queue.filter((item) => !item.lateAdded).forEach((item) => {
    const base = { Host: 'ticketing-01', RuleId: item.ruleId, QueueId: item.id, Severity: item.severity };
    rows.push(...queueRows(item, base));
  });
  // Rule execution windows (30 minutes). AlertsRaised is counted from the queue; evaluated volume is stable per rule.
  // Seven full 30-minute windows from shift start plus a final partial window that closes with the last queued alert.
  const lastQueued = Math.max(...s.queue.map((q) => Date.parse(q.createdAt)));
  const windows = Array.from({ length: 7 }, (_, i) => [Date.parse(s.start) + i * 30 * 60000, Date.parse(s.start) + (i + 1) * 30 * 60000]).concat([[Date.parse(s.start) + 7 * 30 * 60000, lastQueued]]);
  ops.rules.forEach((ruleId, ri) => {
    const base = ops.ruleRunBase.find((item) => item.ruleId === ruleId);
    const evaluated = base.evaluated; const duration = base.durationMs;
    windows.forEach(([from, to], wi) => {
      const last = wi === windows.length - 1;
      const raised = s.queue.filter((q) => q.ruleId === ruleId && Date.parse(q.createdAt) >= from && (last ? Date.parse(q.createdAt) <= to : Date.parse(q.createdAt) < to)).length;
      const share = last ? (to - from) / (30 * 60000) : 1;
      rows.push(row('RuleRuns', nextId('RX'), iso(to), { Host: 'siem-scheduler-01', RuleId: ruleId, EventType: 'RuleRun', Account: 'siem-rules', Result: last ? 'completed (partial window)' : 'completed',
        WindowStart: iso(from), WindowEnd: iso(to), EventsEvaluated: Math.round((evaluated + ((wi * 37 + ri * 11) % 90)) * share), AlertsRaised: raised, RunDurationMs: duration + ((wi * 13 + ri * 7) % 60),
        Detail: `${ruleId} evaluated its ${last ? 'partial ' : '30-minute '}window and raised ${raised} alert${raised === 1 ? '' : 's'}.` }));
    });
  });
  ops.collectors.forEach((c) => {
    rows.push(row('SourceHealth', nextId('SH'), c.time, { Host: c.host, EventType: 'CollectorHeartbeat', Account: 'siem-collector', Result: c.status, IngestionTime: plus(c.time, c.ingestionLagSeconds),
      Collector: c.collector, IngestionLagSeconds: c.ingestionLagSeconds, EventsPerMinute: c.eventsPerMinute,
      Detail: `${c.collector}: ${c.status}; ingestion lag ${c.ingestionLagSeconds} seconds; ${c.eventsPerMinute} events per minute.` }));
  });
  ops.shiftLog.forEach((e) => rows.push(row('ShiftLog', nextId('SL'), e.time, { Host: 'soc-console', EventType: e.type, Account: e.actor, Result: 'recorded', Detail: e.detail })));
  // Sprint 7 density: supplemental background, appended so the rows above keep their EventIds. Purpose tags stay in the fixture.
  const extra = ops.supplemental;
  if (!extra) { appendLateQueueRows(); return rows; }
  queue.filter((item) => item.assigneeId && item.acknowledgedAt && !item.lateAdded).forEach((item) => {
    rows.push(row('QueueActivity', nextId('QA'), plus(item.acknowledgedAt, -60), { Host: 'ticketing-01', RuleId: item.ruleId, QueueId: item.id, Severity: item.severity, EventType: 'AlertAssigned', Account: item.assigneeId, Result: 'assigned', IngestionTime: plus(item.acknowledgedAt, -45), Detail: `${item.id} assigned to ${item.assigneeId}.` }));
  });
  extra.pageAcknowledgements.forEach((p) => {
    const item = s.queue.find((q) => q.id === p.queueId);
    rows.push(row('OnCallPages', nextId('PG'), p.time, { Host: 'paging-01', RuleId: item.ruleId, QueueId: item.id, EventType: 'PageAcknowledged', Account: p.actor, Result: 'acknowledged', Detail: `On-call page for ${item.id} acknowledged on the pager; the queue item is acknowledged separately in QueueActivity.` }));
  });
  extra.heartbeats.forEach((c) => {
    rows.push(row('SourceHealth', nextId('SH'), c.time, { Host: c.host, EventType: 'CollectorHeartbeat', Account: 'siem-collector', Result: c.status, IngestionTime: plus(c.time, c.ingestionLagSeconds),
      Collector: c.collector, IngestionLagSeconds: c.ingestionLagSeconds, EventsPerMinute: c.eventsPerMinute,
      Detail: `${c.collector}: ${c.status}; ingestion lag ${c.ingestionLagSeconds} seconds; ${c.eventsPerMinute} events per minute.` }));
  });
  extra.shiftLog.forEach((e) => rows.push(row('ShiftLog', nextId('SL'), e.time, { Host: 'soc-console', EventType: e.type, Account: e.actor, Result: 'recorded', Detail: e.detail })));
  appendLateQueueRows();
  return rows;
}
function moduleElevenToolFixtures(data, fixture = SocM11AssessmentData) {
  const s = fixture.scenario;
  const endpoint = s.incident.entities.find((id) => id.startsWith('ws-'));
  const account = s.incident.entities.find((id) => id.startsWith('acct-'));
  const service = s.incident.entities.find((id) => id.startsWith('fs-'));
  const evidence = s.incident.recoveryEvidence.map((e) => ({ id: e.id, type: 'recovery_record', time: e.time, entityId: /file-share/i.test(e.summary) ? service : endpoint, summary: e.summary }));
  const m10Artifacts = s.incident.recoveryEvidence.map((e, i) => ({ id: e.id, type: 'recovery_record', time: e.time, host: /file-share/i.test(e.summary) ? service : endpoint, account: 'soc-analyst', title: e.summary, source: 'Recovery validation record', methods: ['log_export'], sourceHash: String(i + 1).repeat(64), verificationHash: String(i + 1).repeat(64), detail: e.summary }));
  return {
    m04: SocConsoleTools.m04Fixture({ id: s.id, caseId: s.caseId, end: s.end, data }),
    m05: SocConsoleTools.m05Fixture({ id: s.id, stateKey: 'm11-endpoint-tools-v1', devices: s.incident.entities.filter((x) => x.startsWith('ws-') || x.startsWith('fs-')).map((id) => ({ id, hostname: id, platform: 'Windows', role: id.startsWith('fs-') ? 'File service' : 'Workstation', owner: 'SOC', zone: 'CORP', status: 'Recovered / validation pending' })), data }),
    m06: SocConsoleTools.m06Fixture({ id: s.id, lead: { id: 'M11-LEAD-001', type: 'recovery_review', device: endpoint, account, taskName: 'Recovery validation', observation: s.incident.containment }, devices: [endpoint, service], data, timeStart: s.start, timeEnd: s.end }),
    m07: SocConsoleTools.m07Fixture({ id: s.id, stateKey: 'm11-mail-tools-v1', start: s.start, end: s.end }),
    m08: SocConsoleTools.m08Fixture({ id: s.id, stateKey: 'm11-exposure-tools-v1', start: s.start, end: s.end }),
    m09: SocConsoleTools.m09Fixture({ id: s.id, stateKey: 'm11-response-tools-v1', start: s.start, end: s.end,
      incident: { id: s.incident.id, title: s.incident.title, reportedAt: s.start, sourceEntityId: endpoint, sourceEvidenceId: s.incident.recoveryEvidence[0].id, summary: s.incident.containment },
      entities: [{ id: endpoint, type: 'endpoint', hostname: endpoint, ownerAccountId: account, status: 'isolated' }, { id: account, type: 'identity', displayName: account, status: 'active' }, { id: service, type: 'file_service', hostname: service, status: 'validation_pending' }],
      edges: [{ from: s.incident.id, to: endpoint, relation: 'contained', evidenceId: s.incident.recoveryEvidence[0].id }, { from: s.incident.id, to: account, relation: 'session_overlap', evidenceId: s.incident.recoveryEvidence[4].id }], evidence }),
    m10: { schemaVersion: 1, scenario: { id: s.id, caseId: s.caseId, incidentId: s.incident.id, stateKey: 'm11-evidence-locker-v1', start: s.start, end: s.end, fixedAt: s.end, containedAt: s.start,
      request: { id: `REQ-${s.incident.id}`, from: 'Incident lead', receivedAt: s.start, text: 'Preserve recovery and scope records with defensible custody; distinguish completed recovery checks from pending owner validation.' },
      custodians: [{ id: 'soc-analyst', label: 'SOC analyst' }, { id: 'service-owner', label: 'Service owner' }, { id: 'identity-owner', label: 'Identity owner' }], artifacts: m10Artifacts } },
  };
}

function moduleElevenOpsHtml(fixture = SocM11AssessmentData, state = moduleElevenOpsState) {
  const s = fixture.scenario;
  const metrics = SocM11AssessmentMetrics.compute(fixture, state);
  const itemOptions = s.queue.map((x) => `<option value="${esc(x.id)}">${esc(x.id)} · ${esc(x.title)}</option>`).join('');
  const openItems = s.queue.filter((x) => x.status !== 'closed');
  const dispositionItemOptions = openItems.map((x) => `<option value="${esc(x.id)}">${esc(x.id)} · ${esc(x.title)}</option>`).join('');
  const dispositionOptions = SocM11AssessmentState.DISPOSITIONS.map((id) => `<option value="${esc(id)}">${esc(SocM11AssessmentState.DISPOSITION_LABELS[id])}</option>`).join('');
  const recordedDispositions = Object.entries(state.dispositions || {});
  const analystOptions = s.analysts.map((x) => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');
  const ownerOptions = [...s.analysts.map((x) => ({ id: x.id, name: x.name })), ...s.ownerIds.map((id) => ({ id, name: id }))].map((x) => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');
  return `<section class="m03-console-extra"><h3>Shift Operations</h3><p>Prioritize the live queue, assign work, and record the handoff for the incoming shift.</p>
    <form data-m11-operation="priority"><label>Priority order (highest first)<input name="order" required placeholder="${esc(s.queue.slice(1, 4).map((item) => item.id).join(', '))}"></label><button>Save order</button></form>
    <form data-m11-operation="disposition"><h4>Alert disposition</h4><label>Queue item<select name="itemId">${dispositionItemOptions}</select></label><label>Disposition<select name="disposition">${dispositionOptions}</select></label><label>Evidence and reasoning<textarea name="reason" required minlength="10" maxlength="1000"></textarea></label><button>Record disposition</button>${recordedDispositions.length ? `<ul class="m11-recorded-dispositions" aria-label="Dispositions you have recorded">${recordedDispositions.map(([id, d]) => `<li><strong>${esc(id)}</strong> · ${esc(SocM11AssessmentState.DISPOSITION_LABELS[d.disposition] || d.disposition)}: ${esc(d.reason)}</li>`).join('')}</ul>` : ''}</form>
    <form data-m11-operation="assign"><label>Queue item<select name="itemId">${itemOptions}</select></label><label>Assign to<select name="analystId">${analystOptions}</select></label><button>Assign</button></form>
    <form data-m11-operation="escalate"><label>Queue item<select name="itemId">${itemOptions}</select></label><label>Route<select name="route">${s.escalationRoutes.map((r) => `<option value="${esc(r.id)}">${esc(r.label)}</option>`).join('')}</select></label><label>Reason<textarea name="reason" required minlength="10"></textarea></label><button>Escalate</button></form>
    <form data-m11-operation="metrics"><label>Metric interpretation<textarea name="text" required minlength="40"></textarea></label><button>Record interpretation</button></form>
    <form data-m11-operation="noise"><label>Rule<select name="ruleId">${s.rules.map((r) => `<option value="${esc(r.id)}">${esc(r.id)} · ${esc(r.name)}</option>`).join('')}</select></label><label>Rationale<textarea name="rationale" required minlength="10"></textarea></label><label>Improvement<textarea name="improvement" required minlength="20"></textarea></label><button>Flag rule</button></form>
    <form data-m11-operation="handoff"><label>Summary<textarea name="summary" required minlength="40"></textarea></label><label>Open items (comma separated IDs)<input name="openItems" required placeholder="${esc(s.queue.filter((item) => item.status !== 'closed').slice(0, 4).map((item) => item.id).join(', '))}"></label><label>Risks<textarea name="risks" required></textarea></label><label>Next actions<textarea name="nextActions" required></textarea></label><button>Save handoff</button></form>
    <form data-m11-operation="followup"><label>Title<input name="title" required minlength="5"></label><label>Kind<select name="kind"><option value="follow_up">Follow up</option><option value="lesson">Lesson learned</option><option value="detection">Detection improvement</option></select></label><label>Owner<select name="ownerId">${ownerOptions}</select></label><label>Due date<input name="dueDate" type="date" min="${esc(s.start.slice(0, 10))}" max="${esc(fixture.expectedTruth?.dueBy || s.end.slice(0, 10))}" required></label><label>Evidence<select name="evidenceId"><option value="">None</option>${s.incident.recoveryEvidence.map((e) => `<option value="${esc(e.id)}">${esc(e.id)}</option>`).join('')}</select></label><button>Add action</button></form>
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

function moduleElevenReportingHtml(fixture = SocM11AssessmentData, state = moduleElevenOpsState) {
  const s = fixture.scenario;
  const fieldNames = [['summary','Summary'],['confirmedScope','Confirmed scope'],['unknowns','Unknowns'],['businessImpact','Business impact'],['containmentStatus','Containment status'],['recoveryStatus','Recovery status'],['residualRisk','Residual risk']];
  return `<section class="m03-console-extra"><h3>Reporting and Closure</h3><p>Write a bounded report for each audience. Include recovery limits and named follow-up owners before deciding whether the incident can close.</p>
    ${['technical','executive','escalation','closure'].map((kind) => `<form data-m11-report="${kind}"><h4>${kind[0].toUpperCase()+kind.slice(1)} report</h4>${fieldNames.map(([name,label]) => `<label>${label}<textarea name="${name}" ${name === 'summary' ? 'required minlength="20"' : ''}>${esc(state.reports?.[kind]?.[name] || '')}</textarea></label>`).join('')}<button>Save ${kind} report</button></form>`).join('')}
    <form data-m11-operation="closure"><label>Decision<select name="decision"><option value="retain">Retain open</option><option value="close">Close</option></select></label><label>Rationale<textarea name="rationale" required minlength="30"></textarea></label><label>Recovery evidence<input name="evidenceIds" placeholder="${esc(s.incident.recoveryEvidence.slice(-2).map((e) => e.id).join(', '))}"></label><button>Record closure decision</button></form>
    <p role="status">${state.actionHistory.length} actions saved. Assessment scoring occurs when the ticket is submitted.</p></section>`;
}

let moduleElevenOpsState = null;
let moduleElevenGuidedOpsState = null;
let moduleElevenGuidedState = null;
let moduleElevenConsole = null;
let moduleElevenGuidedConsole = null;
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
    // The shift assessment has no ticket of its own; it is submitted below the console.
    caseView: () => `<p class="m03e-muted">${esc(data.caseId)} · Record the shift in the Operations and Reporting tabs, then use <strong>Submit shift assessment</strong> below the console.</p>`,
  });
}

function moduleElevenMountGuidedConsole() {
  const save = () => { moduleElevenGuidedState.console ||= {}; moduleElevenGuidedState.console['m11-guided'] = m03eState('m11-guided'); moduleElevenGuidedSave(); };
  const data = moduleElevenConsoleData(MODULE_ELEVEN_GUIDED_FIXTURE);
  const fx = moduleElevenToolFixtures(data, MODULE_ELEVEN_GUIDED_FIXTURE);
  const root = () => moduleElevenGuidedState;
  const packs = [
    { id: 'm04', ctx: { fixture: fx.m04, assessment: () => { moduleElevenGuidedState.tools ||= {}; if (!moduleElevenGuidedState.tools.m04) moduleElevenGuidedState.tools.m04 = SocM04AssessmentState.normalize({}, fx.m04).assessment; return moduleElevenGuidedState.tools.m04; }, console: () => m03eState('m11-guided'), save, rerender: () => m03eRender('m11-guided') } },
    { id: 'm05', ctx: { fixture: fx.m05, ...SocConsoleTools.embedded(root, 'm05', SocM05AssessmentState.normalize, fx.m05, save) } },
    { id: 'm06', ctx: { fixture: fx.m06, ...SocConsoleTools.embedded(root, 'm06', SocM06AssessmentState.normalize, fx.m06, save) } },
    { id: 'm07', ctx: { fixture: fx.m07, ui: {}, ...SocConsoleTools.embeddedBox(root, 'm07', SocM07AssessmentState.normalize, fx.m07, save) } },
    { id: 'm08', ctx: { fixture: fx.m08, ui: {}, ...SocConsoleTools.embeddedBox(root, 'm08', SocM08AssessmentState.normalize, fx.m08, save) } },
    { id: 'm09', ctx: { fixture: fx.m09, evidence: fx.m09.scenario.evidence, routes: MODULE_ELEVEN_GUIDED_FIXTURE.scenario.escalationRoutes.map((route) => ({ id: route.id, text: route.label })), ...SocConsoleTools.embedded(root, 'm09', SocM09AssessmentState.normalize, fx.m09, save) } },
    { id: 'm10', ctx: { fixture: fx.m10, console: () => m03eState('m11-guided'), load: () => SocM10AssessmentState.normalize(moduleElevenGuidedState.tools?.m10 || {}, fx.m10), store: (next) => { moduleElevenGuidedState.tools ||= {}; moduleElevenGuidedState.tools.m10 = SocM10AssessmentState.normalize(next, fx.m10); save(); } } },
  ];
  moduleElevenGuidedConsole = SocConsoleTools.mount('m11-guided', { data, stateRoot: root, save, packs,
    title: 'SOC OPERATIONS & REPORTING · PRACTICE', ariaLabel: 'Module 11 guided SOC operations and reporting console', idPrefix: 'guided-m11',
    extraTabs: [['operations', 'Operations'], ['reporting', 'Reporting']],
    views: { operations: () => moduleElevenOpsHtml(MODULE_ELEVEN_GUIDED_FIXTURE, moduleElevenGuidedOpsState), reporting: () => moduleElevenReportingHtml(MODULE_ELEVEN_GUIDED_FIXTURE, moduleElevenGuidedOpsState) },
    caseView: () => moduleElevenGuidedCaseTicket(),
  });
}

function moduleElevenWireConsole(root = document.getElementById('m03e-console-m11'), fixture = SocM11AssessmentData,
  getState = () => moduleElevenOpsState, setState = (next) => { moduleElevenOpsState = next; },
  saveState = (state) => SocM11AssessmentState.save(moduleElevenUser, state, SocM11AssessmentData), consoleMount = moduleElevenConsole) {
  if (!root) return;
  root.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-m11-operation], [data-m11-report]'); if (!form) return;
    event.preventDefault(); const d = Object.fromEntries(new FormData(form)); const at = fixture.scenario.fixedAt;
    let state = getState();
    try {
      if (form.dataset.m11Report) state = SocM11AssessmentState.report(state, fixture, form.dataset.m11Report, d, at);
      else switch (form.dataset.m11Operation) {
        case 'priority': state = SocM11AssessmentState.setPriority(state, fixture, d.order.split(',').map((x) => x.trim()).filter(Boolean), at); break;
        case 'disposition': state = SocM11AssessmentState.recordDisposition(state, fixture, d.itemId, d.disposition, d.reason, at); break;
        case 'assign': state = SocM11AssessmentState.assign(state, fixture, d.itemId, d.analystId, at); break;
        case 'escalate': state = SocM11AssessmentState.escalate(state, fixture, d.itemId, d.route, d.reason, at); break;
        case 'metrics': state = SocM11AssessmentState.recordMetricInterpretation(state, fixture, d.text, at); break;
        case 'noise': state = SocM11AssessmentState.flagNoisyRule(state, fixture, d.ruleId, d.rationale, d.improvement, at); break;
        case 'handoff': state = SocM11AssessmentState.handoff(state, fixture, { summary: d.summary, openItems: d.openItems.split(',').map((x) => x.trim()).filter(Boolean), risks: d.risks.split('\n').map((x) => x.trim()).filter(Boolean), nextActions: d.nextActions.split('\n').map((x) => x.trim()).filter(Boolean) }, at); break;
        case 'followup': state = SocM11AssessmentState.improvementAction(state, fixture, d, at); break;
        case 'closure': state = SocM11AssessmentState.closureDecision(state, fixture, { ...d, evidenceIds: (d.evidenceIds || '').split(',').map((x) => x.trim()).filter(Boolean) }, at); break;
      }
      setState(state); saveState(state); m03eRender(fixture === SocM11AssessmentData ? 'm11' : 'm11-guided');
      if (fixture === MODULE_ELEVEN_GUIDED_FIXTURE) moduleElevenUpdateGuidedProgress();
    } catch (error) { const status = form.parentElement.querySelector('[role="status"]'); if (status) status.textContent = error.message; }
  });
  consoleMount?.wire(root);
}

function viewModuleEleven(user, program) {
  moduleElevenLoad(user);
  moduleElevenOpsState = SocM11AssessmentState.load(user, SocM11AssessmentData);
  moduleElevenMetricsState.console = { ...(moduleElevenMetricsState.console || {}), m11: moduleElevenMetricsState.console?.m11 || {} };
  moduleElevenMountConsole();
  moduleElevenGuidedState.console = { ...(moduleElevenGuidedState.console || {}), 'm11-guided': moduleElevenGuidedState.console?.['m11-guided'] || {} };
  moduleElevenMountGuidedConsole();
  const module = program.modules['soc-11'];
  const sections = moduleElevenGetSections();
  const lectureOpen = moduleElevenReviewMode || !sections[0].isComplete || moduleElevenMetricsState.learnItStep < LearnItDecks['soc-11'].length;
  const guidedLabOpen = moduleElevenReviewMode || !sections[1].isComplete;
  const assessmentLabOpen = moduleElevenReviewMode || !sections[2].isComplete;
  const reviewOpen = moduleElevenReviewMode;
  const quickNavItems = moduleElevenGetQuickNavItems();

  const html = `<div class="m11-shell">${moduleTopbar(user, program)}<div class="mquick-nav-layout">${moduleProgressShell(sections, { moduleKey: 'm11', reviewMode: moduleElevenReviewMode })}<main class="m11-main mf-frame">
<section class="m11-hero mf-hero" aria-labelledby="m11-title"><div><p class="m11-kicker mf-kicker">Module 11 · ${formatHandsOnDuration(module.durationMinutes)} · Week 6</p><h1 id="m11-title">${esc(module.title)}</h1><p class="mf-lede">Turn operating signals and technical evidence into decisions that analysts, incident owners, and leaders can act on.</p></div><dl class="mf-stats" aria-label="Saved lab progress"><div><dt>Guided Lab</dt><dd>${sections[1].isComplete ? 'Complete' : 'Not started'}</dd></div><div><dt>Assessment Lab</dt><dd>${moduleElevenCaseRedoRequested() ? 'Returned for redo' : sections[2].isComplete ? 'Complete' : moduleElevenReportState?.submitted ? 'In review' : 'Not started'}</dd></div></dl></section>
<details class="m11-section-collapsible mf-section" id="m11-lecture-section" ${lectureOpen ? 'open' : ''}><summary><div class="mf-section-heading"><span class="m11-section-badge mf-section-badge">1</span><div><p class="m11-kicker mf-kicker">Learn It</p><h2>Learn It</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary><div class="m11-section-body mf-section-body" id="m11-lecture">
  ${moduleElevenLearnItHtml()}
  <details class="m11-deep-dive mf-deep-dive"><summary>Deep Dive · operating guide and reference notes</summary>
  <section class="m11-practice-note"><i class="ri-compass-3-line" aria-hidden="true"></i><div><p class="m11-kicker">Independent practice</p><h2>Read the objective and dataset, then choose your own working order.</h2><p>No prescribed sequence or pre-submission hints are provided. Scoring feedback and a reference model appear after you submit.</p></div></section>
  ${moduleElevenScenarioLoops()}
  ${moduleElevenVideoScript()}
  </details>
</div></details>
<details class="m11-section-collapsible mf-section mf-lab-section" id="m11-guided-lab-section" ${guidedLabOpen ? 'open' : ''}><summary><div class="mf-section-heading"><span class="m11-section-badge mf-section-badge">2</span><div><p class="m11-kicker mf-kicker">Practice It · Guided Lab</p><h2>Guided Lab</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary><div class="m11-section-body mf-section-body" id="m11-guided-lab">
  <div class="m11-boundary"><i class="ri-shield-check-line" aria-hidden="true"></i><p><strong>Practice shift:</strong> Queue, reporting, tool, and case state are saved separately from the scored Assessment Lab.</p></div>
  <div id="m11-guided-lab-dynamic">${moduleElevenGuidedLabPanel()}</div>
</div></details>
<details class="m11-section-collapsible mf-section" id="m11-assessment-lab-section" ${assessmentLabOpen ? 'open' : ''}><summary><div class="mf-section-heading"><span class="m11-section-badge mf-section-badge">3</span><div><p class="m11-kicker mf-kicker">Prove It · Assessment Lab</p><h2>Assessment Lab</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary><div class="m11-section-body mf-section-body" id="m11-assessment-lab">
  <div id="m11-assessment-lab-dynamic">${moduleElevenAssessmentLabPanel()}<div class="m03e-console-host" id="m03e-console-m11">${moduleThreeConsoleHtml('m11')}</div></div>
</div></details>
<div id="m11-additional-labs-dynamic">${moduleElevenAdditionalLabs()}</div>
<details class="m11-section-collapsible mf-section" id="m11-review-section" ${reviewOpen ? 'open' : ''}><summary><div class="mf-section-heading"><span class="m11-section-badge mf-section-badge">4</span><div><p class="m11-kicker mf-kicker">Concept recap</p><h2>Module Review</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary><div class="m11-section-body mf-section-body" id="m11-review">
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
  if (!root || !moduleElevenGuidedState) return;
  const consoleRoot = document.getElementById('m03e-console-m11-guided');
  moduleElevenWireConsole(consoleRoot, MODULE_ELEVEN_GUIDED_FIXTURE, () => moduleElevenGuidedOpsState,
    (next) => { moduleElevenGuidedOpsState = next; },
    (next) => { moduleElevenGuidedOpsState = SocM11AssessmentState.save(moduleElevenUser, next, MODULE_ELEVEN_GUIDED_FIXTURE); moduleElevenGuidedSave(); },
    moduleElevenGuidedConsole);
  moduleElevenPositionGuidedGuide(root);
  root.addEventListener('change', (event) => {
    const field = event.target.closest('[id$="m11-guided-case-form"] [name]');
    if (!field) return;
    if (field.name.startsWith('finding:')) moduleElevenGuidedState.caseRecord.findings[field.name.slice(8)] = field.value;
    else moduleElevenGuidedState.caseRecord[field.name] = field.value;
    moduleElevenGuidedState.completed = moduleElevenGuidedComplete();
    moduleElevenGuidedSave();
    moduleElevenUpdateGuidedProgress();
  });
  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-m11-guided-restart]')) { event.preventDefault(); moduleElevenGuidedRestart(); return; }
    if (event.target.closest('[data-m11-guided-submit-case]')) { event.preventDefault(); moduleElevenGuidedSubmit(); return; }
    if (event.target.closest('[data-m11-guided-guide-next]')) { moduleElevenGuidedState.guideStep = ((moduleElevenGuidedState.guideStep || 0) + 1) % moduleElevenGuidedSteps().length; moduleElevenGuidedSave(); const tab = moduleElevenGuidedSteps()[moduleElevenGuidedState.guideStep].tab; document.querySelector(`[data-m03e-tab="m11-guided:${tab}"]`)?.click(); moduleElevenRenderGuided(); return; }
    if (event.target.closest('[data-m11-guided-guide-collapse]')) { moduleElevenGuidedState.guideDocked = !moduleElevenGuidedState.guideDocked; moduleElevenGuidedSave(); moduleElevenRenderGuided(); return; }
    if (event.target.closest('[data-m11-guided-save-case]')) {
      event.preventDefault();
      moduleElevenGuidedState.caseRecord.actionHistory.push({ action: 'Ticket updated', at: new Date().toISOString() });
      moduleElevenGuidedState.completed = moduleElevenGuidedComplete();
      moduleElevenGuidedSave();
      m03eRender('m11-guided');
      moduleElevenUpdateGuidedProgress();
    }
  });
}

function moduleElevenFinalizeCase(root) {
  if (moduleElevenReportState.submitted && !moduleElevenCaseRedoRequested()) return;
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
  // Clear the returned state now so the panel shows the resubmission at once;
  // put it back only if the attempt fails to save.
  const openRedo = moduleElevenCaseRedoRequested() ? moduleElevenUser.openLabRedosByModuleKey['soc-11'] : null;
  if (openRedo) delete moduleElevenUser.openLabRedosByModuleKey['soc-11'];
  if (typeof recordLabAttempt === 'function') {
    recordLabAttempt(moduleElevenUser, MODULE_ELEVEN_REPORT_CATALOG_KEY, {
      state: 'complete',
      score: scored.score,
      result: { ...scored, action_history: moduleElevenOpsState.actionHistory },
    }).then((saved) => {
      if (!saved && openRedo) { moduleElevenUser.openLabRedosByModuleKey['soc-11'] = openRedo; root.innerHTML = moduleElevenAssessmentLabPanel(); }
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
  moduleElevenWireLearnIt();
  moduleElevenWireConsole();
  wireModuleElevenOptionalLabs();
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

registerModuleLab({ program: 'soc-analyst', moduleNumber: 11, moduleKey: 'soc-11', view: viewModuleEleven, wire: wireModuleEleven, sections: moduleElevenGetSections });
