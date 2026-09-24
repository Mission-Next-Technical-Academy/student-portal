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
          { id: 'b', text: 'Separate the health metric from case evidence, compare the metric window to the declared case records, and state any unscoped queue causes as unknown.' },
          { id: 'c', text: 'Remove the dip from the report so closure appears successful.' },
          { id: 'd', text: 'Assign the dip to a named person without reviewing the source rows.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. A health metric is an operational signal. Compare it with the bounded case slice, preserve uncertainty, and avoid turning correlation into incident scope or blame.`,
        feedbackIncorrect: `Metrics and case records answer different questions. Review both sources, state the relationship as a hypothesis when appropriate, and retain unknowns instead of overclaiming.`,
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

let moduleElevenQuizState = null;
let moduleElevenMetricsState = null;
let moduleElevenReportState = null;
let moduleElevenUser = null;
let moduleElevenReviewMode = false;

function moduleElevenMetricsFreshDefaults() {
  return {
    practiceComplete: false, practiceNotes: '', feedback: [], validationError: '', lastSubmittedAt: '',
  };
}

function moduleElevenReportFreshDefaults() {
  return {
    notes: '', attempts: 0, completed: false, feedback: [], validationError: '', lastSubmittedAt: '',
  };
}

function moduleElevenLoad(user) {
  moduleElevenUser = user;
  moduleElevenMetricsState = LabRuntime.load(MODULE_ELEVEN_METRICS_LAB_ID, user, moduleElevenMetricsFreshDefaults());
  moduleElevenReportState = LabRuntime.load(MODULE_ELEVEN_REPORT_LAB_ID, user, moduleElevenReportFreshDefaults());
  ['feedback', 'flags'].forEach((key) => {
    if (!Array.isArray(moduleElevenMetricsState[key])) moduleElevenMetricsState[key] = [];
  });
  ['feedback', 'flags'].forEach((key) => {
    if (!Array.isArray(moduleElevenReportState[key])) moduleElevenReportState[key] = [];
  });
  if (typeof moduleElevenMetricsState.practiceNotes !== 'string') moduleElevenMetricsState.practiceNotes = '';
  if (typeof moduleElevenReportState.notes !== 'string') moduleElevenReportState.notes = '';

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

function moduleElevenScenarioLoops() {
  return `<section class="m11-loop-grid" aria-label="Module 11 four-part lesson loops">
    <article><p class="m11-kicker">Lesson 1 · Scenario</p><h4>Review health after ${esc(MODULE_ELEVEN_SHARED_CASE.incidentId)} closes</h4><p>Post-closure queue snapshots sit beside the declared ${esc(MODULE_ELEVEN_SHARED_SLICE_IDS.join(', '))} case slice. Decide which signals describe SOC health and which describe incident scope.</p></article>
    <article><p class="m11-kicker">Lesson 1 · Theory</p><h4>Metrics are signals, not proof</h4><p>MTTD, MTTR, SLA, backlog, staffing, and false-positive rate describe operating conditions. Trace trends to a supported driver before connecting them to incident impact.</p></article>
    <article><p class="m11-kicker">Lesson 1 · Knowledge check</p><h4>Source-review reasoning</h4><p>Use the source-review question bank to test whether a metric relationship is supported, correlated, or still unknown.</p></article>
    <article><p class="m11-kicker">Lesson 1 · Applied task</p><h4>Brief the incoming shift</h4><p>Choose the material signals, propose a scoped improvement, name the escalation owner, and write the next verification point.</p></article>
    <article><p class="m11-kicker">Lesson 2 · Scenario</p><h4>Turn the shared slice into an executive brief</h4><p>Read ${esc(MODULE_ELEVEN_SHARED_CASE.incidentId)} through ${esc(MODULE_ELEVEN_SHARED_SLICE_IDS.join(', '))}; the briefing must preserve the bounded impact on ${esc(MODULE_ELEVEN_SHARED_CASE.entities.endpoint)} and the unresolved wider-scope questions.</p></article>
    <article><p class="m11-kicker">Lesson 2 · Theory</p><h4>Audience and accountability</h4><p>Technical notes retain entities and evidence. Executive language states business effect, residual risk, ownership, and next action without attribution or unsupported certainty.</p></article>
    <article><p class="m11-kicker">Lesson 2 · Knowledge check</p><h4>Separate observation from inference</h4><p>Review each shared-case record before selecting it. The quiz and evidence table reward bounded statements, not a complete story invented from typical ransomware behavior.</p></article>
    <article><p class="m11-kicker">Lesson 2 · Applied task</p><h4>Deliver the independent report</h4><p>Write the case note, executive summary, escalation request, and closure conditions from the shared slice. Keep unknowns and the monitoring owner visible.</p></article>
    <article><p class="m11-kicker">Lesson 3 · Scenario</p><h4>Close the communication loop</h4><p>Leadership needs a concise status after containment, while the SOC needs a measurable control-improvement handoff.</p></article>
    <article><p class="m11-kicker">Lesson 3 · Theory</p><h4>Closure needs verification and ownership</h4><p>Containment is not closure. Confirm recovery, review monitoring results, record residual uncertainty, and assign a named control owner with a due point.</p></article>
    <article><p class="m11-kicker">Lesson 3 · Knowledge check</p><h4>Test the closure claim</h4><p>Use the randomized reasoning quiz and source list to reject premature closure, unsupported exfiltration claims, and role-only escalation.</p></article>
    <article><p class="m11-kicker">Lesson 3 · Applied task</p><h4>State the decision and next review</h4><p>Translate the same bounded facts into an audience-appropriate closure note with a condition that can be checked on the next review.</p></article>
    <p class="m11-crosswalk-note"><strong>Supplementary draft crosswalk:</strong> this module primarily relates to Security+ SY0-701 Domain 5 (Security Program Management) with secondary Domain 4 (Security Operations). It is a developer-authored mapping pending curriculum/compliance/faculty review, not an approval, certification, affiliation, or pass guarantee.</p>
  </section>`;
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
    ${missionNextLabLaunchGroup(11, 'guided', [{ title: 'Active Directory Monitoring with Grafana', detail: `${formatInstructionalMinutes(moduleLab?.instructionalMinutes)} allocated. Imported Active Directory monitoring project.`, href: 'imported-labs/mission-next-labs/index.html#/track/active-directory/project/ad-1/lab' }])}
    <label class="m11-text-label" for="m11-practice-notes">Working notes (optional)</label>
    <p class="m11-field-help">What did you find? Any blockers?</p>
    <textarea id="m11-practice-notes" rows="4" maxlength="900" data-m11-practice-notes placeholder="What did you find? Any blockers?">${esc(moduleElevenMetricsState.practiceNotes)}</textarea>
    <div class="m11-actions"><button type="button" class="m11-submit" data-m11-practice-complete>${moduleElevenMetricsState.practiceComplete ? 'Guided Lab marked complete' : 'Mark Guided Lab complete'}</button></div>
  </section>`;
}

function moduleElevenAssessmentLabPanel() {
  const moduleLab = LABS.find((item) => item.key === MODULE_ELEVEN_REPORT_CATALOG_KEY);
  const feedbackHtml = moduleElevenReportState.feedback?.length ? `<div class="m11-validation is-pass" role="status"><strong>Submitted</strong><ul>${moduleElevenReportState.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div>` : '';
  return `<section class="m11-external-lab" id="m11-assessment-lab-panel">
    <p class="m11-panel-instruction">Launch the imported Active Directory metrics project below, complete it, then write up your findings for instructor review.</p>
    ${missionNextLabLaunchGroup(11, 'assessment', [{ title: 'Visualizing Active Directory Performance Metrics with Cacti', detail: `${formatInstructionalMinutes(moduleLab?.instructionalMinutes)} allocated. Imported Active Directory metrics project.`, href: 'imported-labs/mission-next-labs/index.html#/track/active-directory/project/ad-7/lab' }])}
    <form id="m11-assessment-form">
      <label class="m11-text-label" for="m11-assessment-notes">Assessment write-up</label>
      <p class="m11-field-help">In at least 80 characters, describe what you found and your recommended action.</p>
      <textarea id="m11-assessment-notes" rows="6" maxlength="1400" data-m11-assessment-notes placeholder="Summarize what the Cacti lab surfaced, your analysis, and your recommended action…">${esc(moduleElevenReportState.notes)}</textarea>
      <div class="m11-actions"><button type="submit" class="m11-submit">${moduleElevenReportState.completed ? 'Resubmit for review' : 'Submit for review'}</button></div>
    </form>
    ${feedbackHtml}
  </section>`;
}

function moduleElevenAdditionalLabs() {
  return missionNextAdditionalLabsSection(11, [
    { label: 'Real-time Active Directory Metrics with Datadog', detail: 'Operational monitoring and metric context', href: 'imported-labs/mission-next-labs/index.html#/track/active-directory/project/ad-3/lab' },
    { label: 'Active Directory Performance Monitoring with Checkmk', detail: 'Service checks and monitoring ownership', href: 'imported-labs/mission-next-labs/index.html#/track/active-directory/project/ad-5/lab' },
  ]);
}

function viewModuleEleven(user, program) {
  moduleElevenLoad(user);
  const module = program.modules['soc-11'];
  const sections = moduleElevenGetSections();
  const lectureOpen = moduleElevenReviewMode || !sections[0].isComplete;
  const quizOpen = moduleElevenReviewMode || (moduleElevenQuizState && !moduleElevenQuizState.passed);
  const guidedLabOpen = moduleElevenReviewMode || !sections[2].isComplete;
  const assessmentLabOpen = moduleElevenReviewMode || !sections[3].isComplete;
  const reviewOpen = moduleElevenReviewMode;
  const quickNavItems = moduleElevenGetQuickNavItems();

  const html = `<div class="m11-shell">${moduleTopbar(user, program)}${moduleProgressShell(sections, { moduleKey: 'm11', reviewMode: moduleElevenReviewMode })}<div class="mquick-nav-layout"><main class="m11-main">
<details class="m11-section-collapsible" id="m11-lecture-section" ${lectureOpen ? 'open' : ''}><summary><span class="m11-section-badge">1</span><h2>Lecture</h2></summary><div class="m11-section-body" id="m11-lecture">
  <section class="m11-practice-note"><i class="ri-compass-3-line" aria-hidden="true"></i><div><p class="m11-kicker">Independent practice</p><h2>Read the objective and dataset, then choose your own working order.</h2><p>No prescribed sequence or pre-submission hints are provided. Scoring feedback and a reference model appear after you submit.</p></div></section>
  ${moduleElevenScenarioLoops()}
  ${moduleElevenVideoScript()}
</div></details>
<details class="m11-section-collapsible" id="m11-knowledge-section" ${quizOpen ? 'open' : ''}><summary><span class="m11-section-badge">2</span><h2>Knowledge Check</h2></summary><div class="m11-section-body" id="m11-knowledge-check">
  ${moduleElevenQuizPanel()}
</div></details>
<details class="m11-section-collapsible" id="m11-guided-lab-section" ${guidedLabOpen ? 'open' : ''}><summary><span class="m11-section-badge">3</span><div><p class="m11-kicker">Practice It · Guided Lab</p><h2>Guided Lab</h2></div></summary><div class="m11-section-body" id="m11-guided-lab">
  <div class="m11-boundary"><i class="ri-shield-check-line" aria-hidden="true"></i><p><strong>Lab boundary:</strong> This lab opens in the imported training application on this page.</p></div>
  <div id="m11-guided-lab-dynamic">${moduleElevenGuidedLabPanel()}</div>
</div></details>
<details class="m11-section-collapsible" id="m11-assessment-lab-section" ${assessmentLabOpen ? 'open' : ''}><summary><span class="m11-section-badge">4</span><div><p class="m11-kicker">Prove It · Assessment Lab</p><h2>Assessment Lab</h2></div></summary><div class="m11-section-body" id="m11-assessment-lab">
  <div id="m11-assessment-lab-dynamic">${moduleElevenAssessmentLabPanel()}</div>
</div></details>
${moduleElevenAdditionalLabs()}
<details class="m11-section-collapsible" id="m11-review-section" ${reviewOpen ? 'open' : ''}><summary><span class="m11-section-badge">5</span><h2>Module Review</h2></summary><div class="m11-section-body" id="m11-review">
  ${moduleElevenReview()}
</div></details>
<details class="m11-section-collapsible" id="m11-sources-section" ${moduleElevenReviewMode ? 'open' : ''}><summary><span class="m11-section-badge">6</span><h2>Sources &amp; Further Reading</h2></summary><div class="m11-section-body">
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

function wireModuleElevenAssessmentLab() {
  const root = document.getElementById('m11-assessment-lab-dynamic');
  if (!root || !moduleElevenReportState) return;
  root.addEventListener('submit', (event) => {
    if (event.target.id !== 'm11-assessment-form') return;
    event.preventDefault();
    const notes = event.target.querySelector('#m11-assessment-notes')?.value || '';
    moduleElevenReportState.notes = notes;
    if (notes.trim().length < 80) {
      moduleElevenReportState.feedback = ['Write at least 80 characters describing your findings and recommended action before submitting.'];
      moduleElevenSaveReport();
      root.innerHTML = moduleElevenAssessmentLabPanel();
      return;
    }
    moduleElevenReportState.attempts = (moduleElevenReportState.attempts || 0) + 1;
    moduleElevenReportState.lastSubmittedAt = new Date().toISOString();
    moduleElevenReportState.completed = true;
    moduleElevenReportState.feedback = ['Submitted. This write-up has been recorded as your Assessment Lab submission for instructor review.'];
    if (!moduleElevenReportState.flags.includes(MODULE_ELEVEN_REPORT_FLAG)) moduleElevenReportState.flags.push(MODULE_ELEVEN_REPORT_FLAG);
    if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(moduleElevenUser, MODULE_ELEVEN_REPORT_CATALOG_KEY, { state: 'complete', result: { notes } });
    }
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleElevenUser, 'soc-analyst', 'soc-11', MODULE_ELEVEN_REPORT_CATALOG_KEY);
    moduleElevenSaveReport();
    root.innerHTML = moduleElevenAssessmentLabPanel();
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
  wireModuleElevenGuidedLab();
  wireModuleElevenAssessmentLab();
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 11, moduleKey: 'soc-11', view: viewModuleEleven, wire: wireModuleEleven });
