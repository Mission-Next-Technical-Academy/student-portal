/* Module 04 — assisted detection tuning, intelligence enrichment, and automation.
 * All telemetry, indicators, identities, and actions are fictional and local-only.
 */

const MODULE_FOUR_LAB_ID = 'm04-detection-enrichment-v1';
const MODULE_FOUR_FLAG = 'M04-DETECTION-ENGINEERED';
const MODULE_FOUR_CATALOG_LAB_KEY = 'lab-detection-rule';
const MODULE_FOUR_PASSING_SCORE = 70;

const MODULE_FOUR_QUIZ_BANKS = [
  {
    conceptId: 'rule-grouping-aggregation',
    conceptTitle: 'Detection rule grouping and aggregation',
    questions: [
      {
        id: 'm04-q-group-1',
        prompt: 'A detection rule counts authentication failures and alerts when a single account fails five times. Events show account A failing five times from workstation 1, and account B failing once each from five different workstations on the same source IP. Which statement best explains why changing the grouping field catches the distributed pattern?',
        options: [
          { id: 'a', text: 'The grouping field determines which events are counted together. Grouping by account misses a distributed spray across multiple accounts; grouping by source IP catches the concentrated attack source.' },
          { id: 'b', text: 'The number of failures is always the deciding factor; grouping choice does not matter.' },
          { id: 'c', text: 'Distributed attacks always target the same account, so account-based grouping is preferred.' },
          { id: 'd', text: 'Grouping by source IP increases false positives because legitimate users share IP addresses.' },
        ],
        correctId: 'a',
        feedbackCorrect: 'Correct. Grouping determines aggregation scope. Account-based grouping hides distributed activity by forcing each account to be counted independently; source-based grouping reveals the concentrated origin.',
        feedbackIncorrect: 'Grouping field choice is critical. It determines which events aggregate into a single alert decision. Switching grouping fields can reveal patterns that the original choice obscured.',
      },
      {
        id: 'm04-q-group-2',
        prompt: 'A webserver logs show 200 successful requests to /api/users and 200 to /api/products from the same account over one hour. An SOC analyst is tuning a rule: should they group by URL path or by account to detect a potential data-exfiltration scan?',
        options: [
          { id: 'a', text: 'Group by account, because the same attacker is making both requests. Grouping by path would separate them, hiding the pattern of broad enumeration.' },
          { id: 'b', text: 'Group by path, because access to multiple endpoints is suspicious regardless of the account.' },
          { id: 'c', text: 'Grouping choice is irrelevant; both approaches detect the same threat.' },
          { id: 'd', text: 'Group by time window, because the hour-long activity matters most.' },
        ],
        correctId: 'a',
        feedbackCorrect: 'Correct. Grouping by account aggregates that single user\'s broad access attempts. Grouping by path would split 200 /api/users requests from 200 /api/products requests into separate alerts, each hitting a threshold individually.',
        feedbackIncorrect: 'Grouping by path would separate two types of access into different alert groups, hiding the pattern of broad enumeration by one account. Grouping by account reveals the attacker\'s wide scan.',
      },
      {
        id: 'm04-q-group-3',
        prompt: 'A rule triggers when an IP address makes 50 DNS queries for nonexistent domains in 60 seconds. Changing the rule to trigger on 20 queries instead (lowering the threshold) will have which effect on false positives and false negatives?',
        options: [
          { id: 'a', text: 'Lowering the threshold decreases false negatives (catches more real attacks) but increases false positives (alerts on benign activity).' },
          { id: 'b', text: 'Lowering the threshold decreases both false positives and false negatives equally.' },
          { id: 'c', text: 'Lowering the threshold increases false negatives because fewer events are needed to trigger.' },
          { id: 'd', text: 'Threshold changes affect precision only, not sensitivity.' },
        ],
        correctId: 'a',
        feedbackCorrect: 'Correct. A lower threshold is more sensitive—it catches more true positives but also more false positives (legitimate DNS queries). A higher threshold reduces false positives but increases false negatives.',
        feedbackIncorrect: 'Threshold tuning is a tradeoff. Lower thresholds improve detection rate (fewer missed attacks) but worsen alert fatigue (more false alarms). Higher thresholds reduce noise but risk missing real attacks.',
      },
      {
        id: 'm04-q-group-4',
        prompt: 'A rule groups privilege-escalation events by user account and triggers at a threshold of one escalation per account per hour. An insider performs one legitimate scheduled privilege escalation at exactly the same time every day. What is the likely outcome?',
        options: [
          { id: 'a', text: 'False negative—the scheduled escalation will not trigger the rule because it happens consistently at the same time.' },
          { id: 'b', text: 'False positive—the rule triggers every day on the same scheduled escalation, creating alert fatigue if not tuned for baseline behavior.' },
          { id: 'c', text: 'True positive—the rule correctly identifies privilege escalation every time, regardless of whether it is authorized.' },
          { id: 'd', text: 'The rule has no way to know if escalation is authorized or not.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. The rule detects a real event (true positive behavior), but because it is authorized and expected, it is a false alarm in operational context. Tuning for baseline behavior (scheduled escalations) reduces this noise.',
        feedbackIncorrect: 'A rule that correctly detects activity but alerts on every instance of expected behavior is still problematic—it is a false positive from an operational standpoint, causing alert fatigue.',
      },
    ],
  },
  {
    conceptId: 'false-positive-negative-tradeoffs',
    conceptTitle: 'False positive and false negative tradeoffs in tuning',
    questions: [
      {
        id: 'm04-q-fpp-1',
        prompt: 'A security team tunes a brute-force detection rule and lowers the failure-count threshold from 10 to 5. The analyst reviewing the change predicts increased alert volume. What is the correct reasoning?',
        options: [
          { id: 'a', text: 'Lowering the threshold increases sensitivity, so more genuine attacks are caught (lower false negatives), but benign activity like mistyped passwords also triggers alerts (higher false positives).' },
          { id: 'b', text: 'Lowering the threshold reduces sensitivity, so fewer alerts are generated overall.' },
          { id: 'c', text: 'Threshold values do not affect alert volume.' },
          { id: 'd', text: 'Lowering the threshold only increases detection of actual attacks, with no change to false positives.' },
        ],
        correctId: 'a',
        feedbackCorrect: 'Correct. Lower thresholds = higher sensitivity = catch more true positives, but also more false positives. Higher thresholds = lower sensitivity = fewer alerts, but more misses.',
        feedbackIncorrect: 'Threshold tuning is about balancing sensitivity. More aggressive tuning (lower thresholds) catches more real threats but also generates more noise.',
      },
      {
        id: 'm04-q-fpp-2',
        prompt: 'A detection rule was tuned to 1% false-positive rate per week. After a business process change, the same rule generates 50% false positives. Which action is most appropriate?',
        options: [
          { id: 'a', text: 'Immediately disable the rule to stop alert fatigue, then rediscover the rule baseline for the new process.' },
          { id: 'b', text: 'Increase the alert threshold to reduce false positives, which will increase sensitivity and catch more real attacks.' },
          { id: 'c', text: 'Increase the alert threshold to reduce false positives; accept the tradeoff of potentially missing some attacks until the new baseline is established.' },
          { id: 'd', text: 'Keep the rule unchanged because it is still detecting real attacks.' },
        ],
        correctId: 'c',
        feedbackCorrect: 'Correct. A business process change affects baselines. Increasing the threshold reduces noise (helps the team investigate real threats) while the analysts re-establish expectations for the new normal.',
        feedbackIncorrect: 'When false-positive rates spike due to business change, tuning the threshold is the right response. Disabling entirely loses detection; changing the baseline is the long-term fix.',
      },
      {
        id: 'm04-q-fpp-3',
        prompt: 'A team implements a detection rule with a 5% false-positive rate in test but discovers a 25% false-positive rate in production. The rule correctly identifies real attacks (true positives) at a 70% rate. What is the implication?',
        options: [
          { id: 'a', text: 'The rule is not performing as expected; production environments have different baselines than test, and the rule needs re-tuning or additional context signals.' },
          { id: 'b', text: 'A 25% false-positive rate is acceptable as long as real attacks are caught 70% of the time.' },
          { id: 'c', text: 'The rule should be abandoned because no rule can perform well in production.' },
          { id: 'd', text: 'False-positive rates are irrelevant to real-world deployment.' },
        ],
        correctId: 'a',
        feedbackCorrect: 'Correct. Production baselines differ from test. A 5x increase in false positives suggests the production environment has different traffic patterns, user behavior, or system configurations than the test lab.',
        feedbackIncorrect: 'Test-to-production drift is common. Rules that perform well in a controlled test environment may need re-tuning for real-world traffic patterns and noise.',
      },
      {
        id: 'm04-q-fpp-4',
        prompt: 'A detection rule has a 90% true-positive rate (catches 90% of real attacks) but a 40% false-positive rate (40% of alerts are false alarms). How should the analyst frame this tradeoff for their manager?',
        options: [
          { id: 'a', text: 'The rule is excellent because it catches 90% of real attacks; the false-positive rate is a concern for tuning, but the detection capability is strong.' },
          { id: 'b', text: 'The rule is not useful because 40% false positives mean the team cannot trust the alerts.' },
          { id: 'c', text: 'True-positive rate and false-positive rate are independent metrics; one does not influence the other.' },
          { id: 'd', text: 'False positives are more important than true positives, so the rule should be disabled.' },
        ],
        correctId: 'a',
        feedbackCorrect: 'Correct. A 90% true-positive rate is strong detection. The 40% false-positive rate is an alert-fatigue issue to manage through tuning or baseline refinement, not a reason to abandon the rule.',
        feedbackIncorrect: 'High true-positive rate (strong detection) and high false-positive rate (alert fatigue) are both important. The goal is to improve both through thoughtful tuning and context enrichment.',
      },
    ],
  },
  {
    conceptId: 'threat-intel-evaluation',
    conceptTitle: 'Evaluating threat intelligence indicators',
    questions: [
      {
        id: 'm04-q-ti-1',
        prompt: 'A threat feed provides an IP address with confidence: 92%, status: "Active", last seen: "2 hours ago", and context: "C2 server for known botnet." Another feed reports the same IP with confidence: 45%, status: "Inactive", last seen: "3 months ago", context: "Mentioned in a blog post about a campaign from 2022." Which indicator is more trustworthy for immediate response?',
        options: [
          { id: 'a', text: 'The first indicator (92% confidence, active, recent) is more reliable for immediate action because it reflects current threat activity and higher confidence.' },
          { id: 'b', text: 'Both are equally valid; confidence and status do not affect indicator relevance.' },
          { id: 'c', text: 'The second indicator (3 months old) is more reliable because age indicates historical verification.' },
          { id: 'd', text: 'Indicator confidence is irrelevant; only the context matters.' },
        ],
        correctId: 'a',
        feedbackCorrect: 'Correct. High confidence, active status, and recent observation all support immediate action. Low confidence, inactive status, and stale data are weaker signals—interesting for historical context but risky for response decisions.',
        feedbackIncorrect: 'Threat intelligence value is a combination of confidence, freshness, and status. Stale or low-confidence indicators should not drive immediate incident response.',
      },
      {
        id: 'm04-q-ti-2',
        prompt: 'An analyst attaches a threat intelligence indicator (a domain name) to an alert because the domain appears in the rule\'s supporting evidence. The domain has a high-confidence rating and recent activity. However, the domain was registered to an ISP and is used by millions of users. Is this indicator a good enrichment choice?',
        options: [
          { id: 'a', text: 'No. A high-confidence indicator that is widely used by legitimate traffic is too noisy to support a specific alert. Indicator relevance requires exact matching to the threat pattern, not just high confidence.' },
          { id: 'b', text: 'Yes. High-confidence indicators always improve alert quality regardless of legitimate use.' },
          { id: 'c', text: 'The indicator\'s popularity is irrelevant to its confidence rating.' },
          { id: 'd', text: 'Enrichment should include all high-confidence indicators to avoid missing context.' },
        ],
        correctId: 'a',
        feedbackCorrect: 'Correct. Even high-confidence indicators can be too generic to be useful. Exact-match relevance (this indicator in this alert) is critical. A common ISP domain will generate false positives.',
        feedbackIncorrect: 'Threat intelligence enrichment requires both confidence AND relevance. An indicator must be specific to the threat pattern, not just a high-confidence entry in a feed.',
      },
      {
        id: 'm04-q-ti-3',
        prompt: 'An alert contains two possible threat intelligence enrichments: Indicator A (confidence 78%, last seen 6 days ago, matches a known phishing infrastructure) and Indicator B (confidence 95%, last seen 2 months ago, was involved in an unrelated malware campaign). Which should the analyst prioritize?',
        options: [
          { id: 'a', text: 'Indicator A, because it matches the alert pattern and has been active recently, even though its confidence is lower than Indicator B.' },
          { id: 'b', text: 'Indicator B, because higher confidence always outweighs other factors.' },
          { id: 'c', text: 'Neither—confidence and recency make no difference in prioritization.' },
          { id: 'd', text: 'Indicator B, because it is from a bigger campaign.' },
        ],
        correctId: 'a',
        feedbackCorrect: 'Correct. Behavioral match and freshness outweigh absolute confidence. An indicator connected to recent phishing activity is more relevant to a phishing alert than a high-confidence unrelated malware indicator.',
        feedbackIncorrect: 'Relevance and recency matter as much as confidence. An old, high-confidence indicator from a different threat context is less useful than a fresher, relevant match.',
      },
      {
        id: 'm04-q-ti-4',
        prompt: 'A threat intelligence feed marks an IP address as "Retired" with the note "No longer active as of last week." The same IP appears in today\'s alert. What does the retired status suggest about using this indicator for enrichment?',
        options: [
          { id: 'a', text: 'The retired status suggests the indicator is no longer a current threat, so it should not drive immediate response decisions. However, it can provide historical context about the attacker\'s past infrastructure.' },
          { id: 'b', text: 'Retired indicators are useless and should be ignored.' },
          { id: 'c', text: 'Retired status has no meaning; the indicator is still valid.' },
          { id: 'd', text: 'Retired indicators should always trigger escalation because they are actively monitored by threat feeds.' },
        ],
        correctId: 'a',
        feedbackCorrect: 'Correct. Retired indicators represent past activity. They provide context (this attacker used this infrastructure before) but are not signals of current active threats.',
        feedbackIncorrect: 'Indicator status matters. Retired or inactive indicators can inform investigation but should not be the primary driver of emergency response.',
      },
    ],
  },
  {
    conceptId: 'automation-approval-boundary',
    conceptTitle: 'Automation and approval boundaries in response',
    questions: [
      {
        id: 'm04-q-auto-1',
        prompt: 'A SOAR playbook can perform four actions: (1) Create a task ticket, (2) Send email notification, (3) Disable a user account, (4) Add an IP to a blocklist. Which of these is safest to automate without human approval?',
        options: [
          { id: 'a', text: 'Disabling a user account, because account action is often urgent.' },
          { id: 'b', text: 'Creating a task ticket and sending email, because they are informational and do not alter system state. Disabling accounts and blocking IPs are disruptive and warrant approval.' },
          { id: 'c', text: 'All four actions are equally safe to automate without approval.' },
          { id: 'd', text: 'Adding an IP to a blocklist is safest because it is the most specific.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. Repeatable, evidence-preserving actions (ticketing, notifications) are low-risk automation. Disruptive actions (account disablement, blocking) need human approval because they affect users and business.',
        feedbackIncorrect: 'Automation boundaries separate safe actions (evidence preservation, routing) from disruptive actions (account changes, network blocks). Disruptive actions require human approval.',
      },
      {
        id: 'm04-q-auto-2',
        prompt: 'A detection rule fires for "user accessed database after hours." The SOAR playbook automatically terminates the user\'s session. The access was actually a scheduled backup job using a service account. What type of automation failure is this?',
        options: [
          { id: 'a', text: 'An automation error that should have been prevented by requiring human approval for disruptive actions like session termination, or by whitelisting known scheduled jobs.' },
          { id: 'b', text: 'A detection rule failure, not an automation failure.' },
          { id: 'c', text: 'This cannot happen because scheduled jobs are never detected.' },
          { id: 'd', text: 'A successful automation because the playbook executed correctly.' },
        ],
        correctId: 'a',
        feedbackCorrect: 'Correct. This is a classic automation failure: a correct detection (something did access the database after hours) triggering an inappropriate response (terminating a legitimate scheduled job). Disruptive actions need approval.',
        feedbackIncorrect: 'Automating disruptive response is risky because alerts are not always accurate, and context can be missing. Even a correct alert may target legitimate activity.',
      },
      {
        id: 'm04-q-auto-3',
        prompt: 'A playbook automatically enriches an alert by querying threat feeds, then manually hands off to an analyst for decision. What is the advantage of this hybrid approach?',
        options: [
          { id: 'a', text: 'It automates repeatable, low-risk work (enrichment collection) and preserves human judgment for decisions that require context and approval (escalation/response).' },
          { id: 'b', text: 'There is no advantage; the analyst should make all decisions from scratch.' },
          { id: 'c', text: 'Full automation is always preferable to hybrid approaches.' },
          { id: 'd', text: 'Hybrid approaches introduce delays.' },
        ],
        correctId: 'a',
        feedbackCorrect: 'Correct. Automation excels at repeatable work (enrichment, aggregation). Human analysts excel at judgment calls (context, approval). Hybrid approaches get the best of both.',
        feedbackIncorrect: 'The best automation strategy is not full-auto or no-auto, but strategic: automate safe, repeatable tasks; keep approval gates for disruptive actions.',
      },
      {
        id: 'm04-q-auto-4',
        prompt: 'An organization implements a playbook that automatically blocks IP addresses flagged by a threat feed. Three months later, the feed provider makes an error and marks 10,000 legitimate IPs as malicious. What is the lesson for automation design?',
        options: [
          { id: 'a', text: 'Threat feeds are unreliable; do not use them for automation.' },
          { id: 'b', text: 'Automation should include feedback loops and human review gates, especially for disruptive actions. A feed provider error should not cause org-wide disruption without an escalation/approval layer.' },
          { id: 'c', text: 'Automation is too risky and should never be deployed.' },
          { id: 'd', text: 'Feed errors are unpreventable, so automation is acceptable regardless.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. Even trusted sources fail. Automation that bypasses approval for disruptive actions is vulnerable to cascading failures. Feedback loops and escalation gates prevent org-wide incidents.',
        feedbackIncorrect: 'Automation is valuable, but disruptive automation without approval gates can amplify single-point failures. Design playbooks with escalation and human checkpoints for high-impact actions.',
      },
    ],
  },
  {
    conceptId: 'alert-priority-reasoning',
    conceptTitle: 'Alert priority and triage reasoning',
    questions: [
      {
        id: 'm04-q-priority-1',
        prompt: 'Two alerts: (1) One account from one IP failed to authenticate 3 times, no follow-on success. (2) Five accounts from one IP each failed once, then one account succeeded. Which is higher priority and why?',
        options: [
          { id: 'a', text: 'Alert 2 is higher priority because it shows a distributed attack pattern with at least one successful compromise.' },
          { id: 'b', text: 'Alert 1 is higher priority because three failures look more suspicious than one failure per account.' },
          { id: 'c', text: 'Both are equal priority.' },
          { id: 'd', text: 'Priority depends on which accounts are involved, not the attack pattern.' },
        ],
        correctId: 'a',
        feedbackCorrect: 'Correct. Distribution across accounts + successful access = higher priority than single-account failures. Successful compromise is the deciding factor.',
        feedbackIncorrect: 'Priority reflects impact. A distributed attack with successful access matters more than repeated attempts against one account.',
      },
      {
        id: 'm04-q-priority-2',
        prompt: 'An alert shows privilege escalation on a development server with no sensitive data. A second alert shows a failed data-export attempt from a production database. Both alerts are detected at the same time. Which receives higher priority?',
        options: [
          { id: 'a', text: 'The privilege escalation, because escalation is always higher priority.' },
          { id: 'b', text: 'The data-export attempt, because it targets a sensitive asset (production DB) and impacts data confidentiality, even though it failed.' },
          { id: 'c', text: 'Both are equal priority.' },
          { id: 'd', text: 'Priority depends on who reported the alert.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. Asset value and data sensitivity drive priority. A failed attempt against sensitive systems can be more urgent than success on non-critical systems.',
        feedbackIncorrect: 'Priority should reflect impact to valuable assets. A dev-server escalation and a production-DB export attempt need different triage levels.',
      },
      {
        id: 'm04-q-priority-3',
        prompt: 'An alert fires for a user accessing files from an unusual geographic location (flagged as 10,000 miles away within 1 hour—geographically impossible). The user is on an international business trip. How should this affect priority scoring?',
        options: [
          { id: 'a', text: 'Priority should be lowered or the alert closed as benign, because the context (business trip) explains the alert and reduces concern of compromise.' },
          { id: 'b', text: 'Priority should be unchanged because alerts are independent of user context.' },
          { id: 'c', text: 'Priority should be raised because impossible travel is always critical.' },
          { id: 'd', text: 'The user should be blocked immediately because they are an outlier.' },
        ],
        correctId: 'a',
        feedbackCorrect: 'Correct. Context matters to priority. Impossible travel is a real detection, but known context (travel) explains it. This becomes a benign positive, not an emergency.',
        feedbackIncorrect: 'Alert priority should account for context. The same detection can be critical in one scenario and benign in another.',
      },
      {
        id: 'm04-q-priority-4',
        prompt: 'A detection system generates 500 alerts per day. After tuning, it generates 50 alerts per day, all of higher priority. What has changed operationally?',
        options: [
          { id: 'a', text: 'The team can now focus on truly suspicious activity instead of being overwhelmed by lower-priority noise. This is an improvement, even though fewer total alerts are generated.' },
          { id: 'b', text: 'Fewer alerts means the system is detecting fewer threats, which is bad.' },
          { id: 'c', text: 'Alert quality and priority are unrelated.' },
          { id: 'd', text: 'The tuning has made the system worse.' },
        ],
        correctId: 'a',
        feedbackCorrect: 'Correct. Operational efficiency improves with fewer, higher-quality alerts. Tuning that reduces alert fatigue while preserving detection of real threats is a major win.',
        feedbackIncorrect: 'Alert volume and quality are inversely related when tuning. Fewer alerts with higher priority signals better tuning, not worse detection.',
      },
    ],
  },
];

const MODULE_FOUR_SOURCES = [
  {
    title: 'MITRE ATT&CK — Valid Accounts',
    org: 'MITRE',
    url: 'https://attack.mitre.org/techniques/T1078/',
    note: 'Adversary behavior in using valid credentials post-compromise; detection strategy for credential-based initial access and lateral movement.',
  },
  {
    title: 'Create Analytics Rules for Microsoft Sentinel Solutions',
    org: 'Microsoft Learn',
    url: 'https://learn.microsoft.com/en-us/azure/sentinel/sentinel-analytic-rules-creation',
    note: 'Real-world detection-rule structure — grouping, thresholds, query design — directly applicable to tuning the account+IP vs. source-IP grouping distinction this lab teaches.',
  },
  {
    title: 'Incident Response Recommendations and Considerations for Cybersecurity Risk Management (SP 800-61 Rev. 3)',
    org: 'NIST',
    url: 'https://csrc.nist.gov/pubs/sp/800/61/r3/final',
    note: 'Current incident response framework (CSF 2.0 community profile) covering detection, analysis, containment, and recovery.',
  },
  {
    title: 'Guide to Cyber Threat Information Sharing (SP 800-150)',
    org: 'NIST',
    url: 'https://csrc.nist.gov/pubs/sp/800/150/final',
    note: 'Guidelines for evaluating, sharing, and using threat intelligence in security operations.',
  },
  {
    title: 'Federal Government Cybersecurity Incident and Vulnerability Response Playbooks',
    org: 'CISA',
    url: 'https://www.cisa.gov/resources-tools/resources/federal-government-cybersecurity-incident-and-vulnerability-response-playbooks',
    note: 'Standardized operational procedures for incident/vulnerability response — illustrates the kind of repeatable, bounded playbook structure appropriate for automation.',
  },
  {
    title: 'Security+ (SY0-701) Certification Overview & Objectives Summary',
    org: 'CompTIA',
    url: 'https://www.comptia.org/certifications/security',
    note: 'Supplementary public reference only. The §2 crosswalk is a developer draft pending curriculum, compliance, and faculty review; this study aid is not an approval, affiliation, endorsement, or pass guarantee.',
  },
];

const MODULE_FOUR_DEFAULT_STATE = {
  activeStation: '',
  reviewedStations: [],
  selectedEvidence: [],
  ruleGrouping: 'account-ip',
  ruleMetric: 'failure-count',
  ruleThreshold: '4',
  ruleRuns: 0,
  ruleRunResults: [],
  rulePassed: false,
  enrichedIndicator: '',
  intelAssessment: '',
  priority: '',
  ruleDisposition: '',
  automationChoice: '',
  automationRan: false,
  automationLog: [],
  hintsOpened: [],
  breakdown: null,
  feedback: [],
  validationError: '',
  lastSubmittedAt: '',
  notes: '',
  lessonWork: {},
  learnItStep: 0,
  labProgress: {},
  // Standard ITSM Incident Ticket for the m04-assessment Prove It
  // submission (docs/specs/MODULE_STANDARD.md §7.2).
  caseRecord: { status: '', severity: '', affectedUser: '', affectedDevice: '', disposition: '', escalation: '', escalateTo: '', notes: '', findings: {}, submitted: false, submittedAt: '', actionHistory: [] },
};

/* Four-part loops are embedded in the four existing theory allocations. The
 * checks and short tasks are practice evidence, not extra instructional time. */
const MODULE_FOUR_LESSON_LOOPS = [
  { id: 'coverage-fidelity-action', title: 'Balance coverage, fidelity, and action',
    scenario: 'Mission Next Labs receives a cluster of fake-verification reports. A broad rule catches the behavior but also fires on approved browser testing. The analyst must preserve useful coverage while reducing avoidable noise.',
    theory: 'Coverage asks what behavior the rule can see; fidelity asks how often its signal is trustworthy; action asks what response the evidence can safely trigger. A good detection decision names all three instead of optimizing alert volume alone.',
    questions: [
      { prompt: 'What is the BEST first question when a rule fires often?', options: ['Which observed behaviors are expected, and which threat signal must remain covered?', 'How can the rule be disabled immediately?', 'Which alert color should be changed?'], correct: 0, feedbackCorrect: 'Correct. Establish the expected baseline and the protected threat behavior before changing logic.', feedbackIncorrect: 'Start with the baseline and required coverage. Disabling or cosmetic changes do not explain the tradeoff.' },
      { prompt: 'A lower threshold catches more loader attempts but doubles benign browser-test alerts. What changed?', options: ['Sensitivity rose, while false-positive cost also rose.', 'Coverage fell and false positives fell.', 'Only the dashboard display changed.'], correct: 0, feedbackCorrect: 'Correct. Lower thresholds generally increase sensitivity and can increase noise.', feedbackIncorrect: 'Thresholds change detection sensitivity and the operational false-positive burden; they are not merely display settings.' },
      { prompt: 'Which action is MOST proportionate before publishing a noisy rule change?', options: ['Test against both suspicious and known-benign examples, then monitor the rollout.', 'Publish globally with no rollback plan.', 'Remove the rule until a perfect threshold is known.'], correct: 0, feedbackCorrect: 'Correct. A bounded test and monitored rollout preserve coverage while exposing drift.', feedbackIncorrect: 'The safe path tests both sides of the tradeoff and uses a monitored, reversible rollout.' },
    ], task: 'Write one sentence naming the coverage you would preserve and one sentence naming the benign behavior you would measure after tuning.' },
  { id: 'detection-logic', title: 'Detection logic desk',
    scenario: 'A credential-stealer rule groups one event per user and misses a campaign that touched five users from the same source. A managed browser retry is the deliberate benign distractor.',
    theory: 'Grouping determines which events are counted together. Select a grouping entity, metric, window, and threshold that expose the behavior in the hypothesis without collapsing unrelated activity into one alert.',
    questions: [
      { prompt: 'Which grouping best exposes a multi-user spray?', options: ['Source address with a distinct-account count.', 'User account with a repeated-failure count only.', 'Alert severity with no event grouping.'], correct: 0, feedbackCorrect: 'Correct. Source grouping plus distinct accounts reveals distributed targeting.', feedbackIncorrect: 'Account-only grouping can hide a distributed pattern. Severity is not an event aggregation key.' },
      { prompt: 'Why test a known managed-browser retry in the same window?', options: ['To confirm the tuned rule keeps a plausible benign pattern below the alert condition.', 'To prove every retry is malicious.', 'To avoid measuring false positives.'], correct: 0, feedbackCorrect: 'Correct. A tuning test needs both the intended signal and a benign counterexample.', feedbackIncorrect: 'Benign counterexamples are necessary to measure fidelity and avoid alert fatigue.' },
      { prompt: 'The rule catches five distinct users but also one single-user retry. What is the MOST useful next step?', options: ['Inspect the grouping and exclusion context rather than raising the threshold blindly.', 'Raise the threshold until all alerts disappear.', 'Treat the retry as proof the spray is false.'], correct: 0, feedbackCorrect: 'Correct. Contextual grouping or a narrowly justified exclusion may reduce noise without losing the campaign signal.', feedbackIncorrect: 'Blind threshold changes can create false negatives. Diagnose the grouping and context first.' },
    ], task: 'Describe the grouping, metric, and threshold you would test for the flagship campaign and why the managed retry should not drive the decision.' },
  { id: 'threat-intelligence', title: 'Threat intelligence desk',
    scenario: 'An active, recent indicator matches the loader delivery path, while a higher-confidence retired indicator belongs to an unrelated campaign. The alert evidence must remain primary.',
    theory: 'Threat intelligence is contextual evidence. Evaluate exact match, behavior, source confidence, status, and freshness together; use a matching indicator to corroborate or prioritize, never as proof that every related event is malicious.',
    questions: [
      { prompt: 'Which indicator should receive the first analyst pivot?', options: ['The exact, active, recent match whose context fits the observed delivery behavior.', 'The oldest indicator because it has more history.', 'Any high-confidence indicator even if its value is unrelated.'], correct: 0, feedbackCorrect: 'Correct. Relevance, status, and freshness make the match useful for this alert.', feedbackIncorrect: 'Confidence alone is insufficient. Exact relevance, current status, and freshness matter.' },
      { prompt: 'What does a matching indicator establish?', options: ['Corroborating context that still needs event and scope validation.', 'Proof that every event in the time window is malicious.', 'Permission to block all traffic immediately.'], correct: 0, feedbackCorrect: 'Correct. Intelligence strengthens a claim but does not replace telemetry review or authority checks.', feedbackIncorrect: 'An indicator is not a verdict or automatic authorization for disruptive response.' },
      { prompt: 'What should an analyst record for a stale indicator?', options: ['Its age and historical relevance, while avoiding use as the sole current-response trigger.', 'Only its confidence score.', 'Nothing, because stale data can never help.'], correct: 0, feedbackCorrect: 'Correct. Stale data can inform context but should be bounded in current decisions.', feedbackIncorrect: 'Record freshness and limitations. Historical context can help, but stale data should not drive emergency action alone.' },
    ], task: 'Draft a short enrichment note that names the matching indicator, its freshness/status, and the uncertainty it does not resolve.' },
  { id: 'automation-boundary', title: 'Automation boundary',
    scenario: 'A playbook can collect evidence, open a task, notify the queue, disable accounts, or block a source. The campaign evidence is concerning but scope is still being validated.',
    theory: 'Automate repeatable, reversible collection and routing first. Keep disruptive identity or network changes behind a human approval gate, with an audit trail and rollback path.',
    questions: [
      { prompt: 'Which action is safest to run automatically first?', options: ['Preserve the alert evidence, enrich it, and create an analyst task.', 'Disable every account named in the alert.', 'Block the entire source network.'], correct: 0, feedbackCorrect: 'Correct. Evidence preservation and routing are low-risk, reversible steps.', feedbackIncorrect: 'Broad account or network disruption exceeds the evidence and needs explicit review.' },
      { prompt: 'Why retain an approval gate?', options: ['A correct detection can still target legitimate activity or an overly broad scope.', 'Approval gates make evidence unnecessary.', 'Automation can never fail.'], correct: 0, feedbackCorrect: 'Correct. Human context is needed before high-impact changes.', feedbackIncorrect: 'Approval gates manage scope and false-positive risk; they do not replace evidence.' },
      { prompt: 'What makes a playbook auditable?', options: ['Recorded inputs, actions, owner/approval state, and a rollback or follow-up path.', 'Only the final notification.', 'An undocumented script that runs faster.'], correct: 0, feedbackCorrect: 'Correct. A durable action record lets another analyst reconstruct and challenge the decision.', feedbackIncorrect: 'Auditability requires inputs, actions, ownership, and follow-up—not speed alone.' },
    ], task: 'Name two low-risk automated steps and one approval-gated action for this campaign, with the reason for the boundary.' },
];

const MODULE_FOUR_AUTH_EVENTS = [
  { id: 'AE-401', time: '09:01', outcome: 'Success', account: 'acct-06', ip: '10.44.3.18', device: 'Managed', region: 'East office', detail: 'Normal interactive sign-in from the account’s assigned workstation.' },
  { id: 'AE-402', time: '09:02', outcome: 'Failed', account: 'acct-07', ip: '203.0.113.97', device: 'Managed', region: 'West office', detail: 'Stored credential rejected after the account’s approved password rotation.' },
  { id: 'AE-403', time: '09:03', outcome: 'Failed', account: 'acct-21', ip: '198.51.100.44', device: 'Unknown', region: 'Unresolved', detail: 'First failure from an unrecognized source and device.' , relevant: true },
  { id: 'AE-404', time: '09:04', outcome: 'Failed', account: 'acct-07', ip: '203.0.113.97', device: 'Managed', region: 'West office', detail: 'The same managed mail client retried its stored credential.' },
  { id: 'AE-405', time: '09:05', outcome: 'Failed', account: 'acct-22', ip: '198.51.100.44', device: 'Unknown', region: 'Unresolved', detail: 'A second anonymous account received one password attempt.', relevant: true },
  { id: 'AE-406', time: '09:06', outcome: 'Failed', account: 'acct-07', ip: '203.0.113.97', device: 'Managed', region: 'West office', detail: 'Repeated stale-client retry on the same account and managed device.' },
  { id: 'AE-407', time: '09:07', outcome: 'Failed', account: 'acct-23', ip: '198.51.100.44', device: 'Unknown', region: 'Unresolved', detail: 'A third account received one password attempt from the same source.', relevant: true },
  { id: 'AE-408', time: '09:08', outcome: 'Failed', account: 'acct-07', ip: '203.0.113.97', device: 'Managed', region: 'West office', detail: 'Fourth retry from the registered client; no other accounts were targeted.' },
  { id: 'AE-409', time: '09:09', outcome: 'Failed', account: 'acct-24', ip: '198.51.100.44', device: 'Unknown', region: 'Unresolved', detail: 'A fourth account received one attempt from the unrecognized source.', relevant: true },
  { id: 'AE-410', time: '09:10', outcome: 'Failed', account: 'acct-07', ip: '203.0.113.97', device: 'Managed', region: 'West office', detail: 'Fifth retry from the known client before its credential cache refreshed.' },
  { id: 'AE-411', time: '09:11', outcome: 'Failed', account: 'acct-25', ip: '198.51.100.44', device: 'Unknown', region: 'Unresolved', detail: 'A fifth distinct account received one attempt from the same source.', relevant: true },
  { id: 'AE-412', time: '09:12', outcome: 'Success', account: 'acct-24', ip: '198.51.100.44', device: 'Unknown', region: 'Unresolved', detail: 'One targeted account authenticated successfully after the distributed failures.', relevant: true },
  { id: 'AE-413', time: '09:13', outcome: 'Success', account: 'acct-07', ip: '203.0.113.97', device: 'Managed', region: 'West office', detail: 'The registered client succeeded after receiving the updated credential.' },
  { id: 'AE-414', time: '09:14', outcome: 'Success', account: 'acct-08', ip: '10.44.3.22', device: 'Managed', region: 'East office', detail: 'Normal sign-in from a second assigned workstation.' },
];

const MODULE_FOUR_INTEL = [
  { id: 'TI-801', value: '198.51.100.44', type: 'IP address', confidence: 88, status: 'Active', lastSeen: '09:11 today', context: 'Observed in a credential-spraying relay set; activity remains current.', relevant: true },
  { id: 'TI-802', value: '192.0.2.91', type: 'IP address', confidence: 61, status: 'Active', lastSeen: '2 days ago', context: 'Associated with a separate phishing-delivery cluster.' },
  { id: 'TI-803', value: '203.0.113.155', type: 'IP address', confidence: 77, status: 'Expired', lastSeen: '94 days ago', context: 'Former malware staging address; the indicator is no longer active.' },
  { id: 'TI-804', value: 'updates-cdn.example', type: 'Domain', confidence: 45, status: 'Active', lastSeen: '6 days ago', context: 'Low-confidence redirect infrastructure with no match in authentication telemetry.' },
];

const MODULE_FOUR_RELEVANT_EVIDENCE = [
  ...MODULE_FOUR_AUTH_EVENTS.filter((event) => event.relevant).map((event) => event.id),
  'TI-801',
];

// Standard ITSM Incident Ticket (docs/specs/MODULE_STANDARD.md §7.2) for the Prove It
// submission — `m04-assessment`, the only form here that calls
// recordLabAttempt() for MODULE_FOUR_CATALOG_LAB_KEY.
const MODULE_FOUR_CASE_ID = SocM04AssessmentData.scenario.caseId;
const MODULE_FOUR_DEPARTMENT_BOUNCE_THRESHOLD = 40;

// Keep the submitted case selections anchored to the immutable assessment truth.
const MODULE_FOUR_ENTITY_ROSTER = {
  users: [
    { id: 'acct-44', text: 'acct-44', tier: 'principal' },
    { id: 'acct-41', text: 'acct-41', tier: 'pivot' },
    { id: 'acct-42', text: 'acct-42', tier: 'pivot' },
    { id: 'acct-43', text: 'acct-43', tier: 'pivot' },
    { id: 'acct-45', text: 'acct-45', tier: 'pivot' },
    { id: 'acct-46', text: 'acct-46', tier: 'noise' },
    { id: 'acct-47', text: 'acct-47', tier: 'noise' },
    { id: 'acct-48', text: 'acct-48', tier: 'noise' },
  ],
  devices: [
    { id: '198.51.100.64', text: '198.51.100.64', tier: 'principal' },
    { id: '203.0.113.77', text: '203.0.113.77', tier: 'pivot' },
    { id: '10.44.3.18', text: '10.44.3.18 (east office managed)', tier: 'noise' },
    { id: '10.44.3.22', text: '10.44.3.22 (east office managed)', tier: 'noise' },
    { id: '192.0.2.91', text: '192.0.2.91 (unrelated phishing cluster)', tier: 'noise' },
    { id: '203.0.113.155', text: '203.0.113.155 (expired malware-staging ip)', tier: 'noise' },
    { id: 'updates-cdn.example', text: 'updates-cdn.example (low-confidence redirect domain)', tier: 'noise' },
  ],
};

const MODULE_FOUR_DEPARTMENT_OPTIONS = [
  { id: 'identity-response', text: 'Identity Response', fit: 100, note: 'Best fit — a targeted account authenticated after the distributed spray; Identity Response owns credential reset and containment.' },
  { id: 'tier2-soc', text: 'Tier 2 SOC', fit: 65, note: 'Acceptable — Tier 2 can continue monitoring and investigation, but identity containment still needs an identity-focused owner.' },
  { id: 'network-security', text: 'Network Security', fit: 35, note: 'Weak fit — the source IP is worth blocking, but the compromised account needs identity response first.', bounce: 'Network Security cannot reset the compromised account; route to Identity Response.' },
  { id: 'help-desk', text: 'IT Help Desk', fit: 10, note: 'Not a fit — this is confirmed credential-spray activity with a successful sign-in, not a routine help-desk ticket.', bounce: 'Help Desk cannot contain a credential-spray compromise; this needs Identity Response.' },
];

const MODULE_FOUR_INTEL_FINDING_OPTIONS = [
  { id: 'corroborates', text: 'Corroborates the alert but is not proof by itself' },
  { id: 'proves-attack', text: 'Proves every event in the window is malicious' },
  { id: 'unrelated', text: 'Has no bearing on this alert' },
];

const MODULE_FOUR_RULE_DISPOSITION_FINDING_OPTIONS = [
  { id: 'publish-monitored', text: 'Publish the tuned rule with monitoring and a rollback note' },
  { id: 'keep-current', text: 'Keep the current account-based rule unchanged' },
  { id: 'disable-rule', text: 'Disable password-failure detection entirely' },
];

const MODULE_FOUR_AUTOMATION_FINDING_OPTIONS = [
  { id: 'enrich-escalate', text: 'Enrich, preserve, and escalate — disruptive action stays approval-gated' },
  { id: 'auto-disable', text: 'Automatically disable every targeted account' },
  { id: 'close-no-action', text: 'Close after recording the indicator' },
];

function moduleFourCaseSpec() {
  return {
    caseId: MODULE_FOUR_CASE_ID,
    incidentIds: [SocM04AssessmentData.scenario.incidentId],
    userOptions: MODULE_FOUR_ENTITY_ROSTER.users,
    deviceOptions: MODULE_FOUR_ENTITY_ROSTER.devices,
    departmentOptions: MODULE_FOUR_DEPARTMENT_OPTIONS,
    notesMin: 100,
    notesPlaceholder: 'The original rule missed… I tuned it to… Authentication and intelligence show… Recommend…',
    findings: [
      { name: 'intelAssessment', label: 'Intelligence interpretation', options: MODULE_FOUR_INTEL_FINDING_OPTIONS, missing: 'Interpret the attached intelligence' },
      { name: 'ruleDisposition', label: 'Rule deployment decision', options: MODULE_FOUR_RULE_DISPOSITION_FINDING_OPTIONS, missing: 'Decide how to deploy the tuned rule' },
    ],
    extraMissing: moduleFourExtraMissing(),
  };
}

// The chosen automation playbook (a finding select above) still needs to be
// *run* against the local fixture, exactly like the pre-migration lab, so
// the simulated log stays part of the graded artifact.
function moduleFourCaseAutomationHtml() {
  const choice = (moduleFourState.caseRecord.findings || {}).automationChoice;
  const disabled = moduleFourState.caseRecord.submitted === true;
  return `<div class="m04-fieldset m04-case-automation">
    <p class="m04-help">Run the bounded automation you selected above. The playbook executes locally against this case only.</p>
    <button type="button" class="m04-run-automation" data-m04-run-automation ${choice && !disabled ? '' : 'disabled'}><i class="ri-play-circle-line" aria-hidden="true"></i> Run selected playbook</button>
    <div class="m04-automation-log" id="m04-automation-log" role="status" aria-live="polite">
      ${moduleFourState.automationLog.length ? `<strong>Local run complete</strong><ol>${moduleFourState.automationLog.map((item) => `<li>${esc(item)}</li>`).join('')}</ol>` : '<span>Select a playbook above, then run it.</span>'}
    </div>
  </div>`;
}

function moduleFourExtraMissing() {
  const missing = [];
  if (!(moduleFourState.assessment.executions || []).some((execution) => execution.status === 'completed')) missing.push('Run at least one analytics rule against the assessment telemetry');
  return missing;
}

function moduleFourProveItRedoRequested() {
  return moduleFourUser?.openLabRedosByModuleKey?.['soc-04']?.labKey === MODULE_FOUR_CATALOG_LAB_KEY;
}

// '' until submitted; then 'review' while the latest attempt awaits faculty,
// 'graded' once an instructor has reviewed it without sending it back.
function moduleFourProveItReviewStatus() {
  if (!moduleFourState?.caseRecord?.submitted) return '';
  const attempt = moduleFourUser?.latestLabAttemptByKey?.[MODULE_FOUR_CATALOG_LAB_KEY];
  return attempt?.reviewedAt && !attempt.redoRequested ? 'graded' : 'review';
}

function moduleFourProveItRedoFeedback() {
  if (!moduleFourProveItRedoRequested()) return '';
  const items = moduleFourUser.openLabRedosByModuleKey['soc-04'].feedback || [];
  return `<div class="m01-redo-feedback" role="note">
    <strong><i class="ri-feedback-line" aria-hidden="true"></i> Instructor feedback</strong>
    ${items.length
      ? `<ul>${items.map((item) => `<li>${item.item_label ? `<strong>${esc(item.item_label)}:</strong> ` : ''}${esc(item.comment || '')}</li>`).join('')}</ul>`
      : '<p>Your instructor returned this case without written notes. Use Message Instructor if you are not sure what to change.</p>'}
  </div>`;
}

// Prove It scoring, folded from the pre-migration observation/analysis/
// decision/communication model into the standard ticket fields plus the
// module's own domain findings. Weights sum to 100; pass threshold (70)
// and the catalog key are unchanged.
function moduleFourCaseScore() {
  const cr = moduleFourState.caseRecord;
  const roster = MODULE_FOUR_ENTITY_ROSTER;
  const userTier = roster.users.find((entry) => entry.id === cr.affectedUser)?.tier;
  const deviceTier = roster.devices.find((entry) => entry.id === cr.affectedDevice)?.tier;
  const tierFit = (tier) => (tier === 'principal' ? 1 : tier === 'pivot' ? 0.5 : 0);
  const entityPoints = Math.round((tierFit(userTier) + tierFit(deviceTier)) * 7.5); // 0-15

  const severity = caseRecordSeverity(cr);
  const severityPoints = severity === 'high' ? 10 : 0; // 0-10

  const disposition = caseRecordDisposition(cr);
  const dispositionPoints = disposition === 'true-positive' ? 15 : 0; // 0-15

  const department = MODULE_FOUR_DEPARTMENT_OPTIONS.find((option) => option.id === cr.escalateTo) || null;
  const escalationRequiredOk = cr.escalation === 'required';
  const bounced = escalationRequiredOk && department && department.fit < MODULE_FOUR_DEPARTMENT_BOUNCE_THRESHOLD;
  const escalationPoints = escalationRequiredOk && department && !bounced ? Math.round((department.fit / 100) * 20) : 0; // 0-20

  const grouping = moduleFourState.ruleGrouping === 'source-ip' ? 5 : 0;
  const metric = moduleFourState.ruleMetric === 'distinct-accounts' ? 5 : 0;
  const threshold = moduleFourState.ruleThreshold === '4' ? 3 : 0;
  const simulation = moduleFourState.rulePassed ? 2 : 0;
  const detectionLogicPoints = grouping + metric + threshold + simulation; // 0-15

  const findings = cr.findings || {};
  const intelPoints = findings.intelAssessment === 'corroborates' ? 5 : 0;
  const rulePoints = findings.ruleDisposition === 'publish-monitored' ? 5 : 0;
  const automationPoints = findings.automationChoice === 'enrich-escalate' && moduleFourState.automationRan ? 5 : 0;
  const domainFindingsPoints = intelPoints + rulePoints + automationPoints; // 0-15

  const notesLen = (cr.notes || '').trim().length;
  const notesPoints = Math.round(Math.min(1, notesLen / 100) * 10); // 0-10

  const score = entityPoints + severityPoints + dispositionPoints + escalationPoints + detectionLogicPoints + domainFindingsPoints + notesPoints;
  const criticalErrors = cr.escalation === 'not-required' ? ['escalation-not-required'] : [];

  const routingFeedback = !escalationRequiredOk
    ? 'Routing: not applicable — escalation was set to not required.'
    : !department
      ? 'Routing: review — this case needs a department routed with the recorded evidence.'
      : department.fit >= 100
        ? `Routing: correct — ${department.text} is the best-fit department for this case.`
        : department.fit >= MODULE_FOUR_DEPARTMENT_BOUNCE_THRESHOLD
          ? `Routing: accepted, but not the best fit — ${department.note}`
          : `Routing: returned — ${department.bounce || department.note}`;

  return {
    score,
    breakdown: { affected_entity: entityPoints, severity: severityPoints, disposition: dispositionPoints, escalation: escalationPoints, detection_logic: detectionLogicPoints, domain_findings: domainFindingsPoints, analyst_notes: notesPoints },
    department, bounced,
    feedback: [
      entityPoints >= 15 ? 'Affected entity/scope: correct — acct-44 and 198.51.100.64 are the confirmed affected user and source.' : entityPoints > 0 ? 'Affected entity/scope: partial credit — a related account or source is supported by the evidence, but acct-44/198.51.100.64 is the confirmed pair.' : 'Affected entity/scope: review — acct-44 and 198.51.100.64 are the confirmed affected user and source, supported by the authentication log.',
      severityPoints ? 'Severity: correct — High.' : 'Severity: review — a distributed spray with a successful sign-in is High severity.',
      dispositionPoints ? 'Disposition: correct — confirmed malicious activity.' : 'Disposition: review — the successful sign-in after a distributed spray is confirmed malicious activity, not a false positive.',
      routingFeedback,
      grouping && metric && threshold ? 'Rule logic: correct — source IP grouping with a distinct-account count at four or more.' : 'Rule logic: group by source IP, count distinct targeted accounts, and keep the four-or-more threshold.',
      simulation ? 'Test: correct — the tuned rule produced only 198.51.100.44 as an alert candidate.' : 'Test: re-run the simulation after tuning until the suspicious source is the only candidate.',
      intelPoints ? 'Enrichment: correct — TI-801 corroborates, but does not prove, the alert.' : 'Enrichment: attach TI-801 and treat it as corroborating context, not standalone proof.',
      rulePoints ? 'Deployment: correct — publish the tuned rule with monitoring.' : 'Deployment: publish the tuned rule with monitoring and a rollback note.',
      automationPoints ? 'Automation: correct — enrich, preserve, and escalate with disruptive action approval-gated.' : 'Automation: run the enrich/preserve/escalate playbook and keep disruptive action approval-gated.',
    ],
    criticalErrors,
  };
}

let moduleFourState = null;
let moduleFourLearnView = null;
let moduleFourUser = null;
let moduleFourReviewMode = false;
let moduleFourQuizState = null;
let moduleFourProveItShowMissing = false;
// Set when the learner explicitly asks to retake a knowledge check that the
// account already records as passed (see moduleFourQuizVerifiedElsewhere()).
let moduleFourQuizForceRetake = false;

function moduleFourLoad(user) {
  if (moduleFourUser?.email !== user?.email) { moduleFourQuizForceRetake = false; moduleFourLearnView = null; }
  moduleFourUser = user;
  moduleFourState = SocM04AssessmentState.load(user, MODULE_FOUR_DEFAULT_STATE, SocM04AssessmentData);
  ['reviewedStations', 'selectedEvidence', 'ruleRunResults', 'automationLog', 'hintsOpened', 'feedback', 'flags'].forEach((key) => {
    if (!Array.isArray(moduleFourState[key])) moduleFourState[key] = [];
  });
  if (!moduleFourState.lessonWork || typeof moduleFourState.lessonWork !== 'object') moduleFourState.lessonWork = {};
  if (!Number.isInteger(moduleFourState.learnItStep) || moduleFourState.learnItStep < 0) moduleFourState.learnItStep = 0;
  if (typeof moduleFourState.notes !== 'string') moduleFourState.notes = '';
  if (!moduleFourState.labProgress || typeof moduleFourState.labProgress !== 'object') moduleFourState.labProgress = {};

  // Standard ITSM ticket — init/migrate; never crash on an old saved shape.
  if (!moduleFourState.caseRecord || typeof moduleFourState.caseRecord !== 'object') {
    moduleFourState.caseRecord = JSON.parse(JSON.stringify(MODULE_FOUR_DEFAULT_STATE.caseRecord));
  }
  ['status', 'severity', 'affectedUser', 'affectedDevice', 'disposition', 'escalation', 'escalateTo', 'notes'].forEach((key) => {
    if (typeof moduleFourState.caseRecord[key] !== 'string') moduleFourState.caseRecord[key] = '';
  });
  const caseRecord = moduleFourState.caseRecord;
  if (caseRecord.caseId === 'DET-4415' || (!caseRecord.caseId && caseRecord.attemptedCaseId === 'DET-4415')
    || ['acct-21', 'acct-22', 'acct-23', 'acct-24', 'acct-25'].includes(caseRecord.affectedUser)
    || caseRecord.affectedDevice === '198.51.100.44') {
    caseRecord.legacyCaseId = 'DET-4415';
  }
  caseRecord.caseId = MODULE_FOUR_CASE_ID;
  caseRecord.scenarioId = SocM04AssessmentData.scenario.id;
  const legacyAccounts = { 'acct-21': 'acct-41', 'acct-22': 'acct-42', 'acct-23': 'acct-43', 'acct-24': 'acct-44', 'acct-25': 'acct-45' };
  if (legacyAccounts[caseRecord.affectedUser]) caseRecord.affectedUser = legacyAccounts[caseRecord.affectedUser];
  if (caseRecord.affectedDevice === '198.51.100.44') caseRecord.affectedDevice = '198.51.100.64';
  if (!moduleFourState.caseRecord.findings || typeof moduleFourState.caseRecord.findings !== 'object') moduleFourState.caseRecord.findings = {};
  if (!Array.isArray(moduleFourState.caseRecord.actionHistory)) moduleFourState.caseRecord.actionHistory = [];
  if (typeof moduleFourState.caseRecord.submitted !== 'boolean') moduleFourState.caseRecord.submitted = false;
  // Backward compat: a pre-migration submission recorded only `attempts` /
  // `completed` on the old free-form m04-assessment. Treat any such attempt
  // as already submitted so the student sees Lab Under Review / Lab Graded
  // instead of a blank ticket — never re-open work already sent to faculty.
  if (!moduleFourState.caseRecord.submitted && Number(moduleFourState.attempts) > 0) {
    moduleFourState.caseRecord.submitted = true;
    moduleFourState.caseRecord.submittedAt = moduleFourState.lastSubmittedAt || new Date().toISOString();
    if (!moduleFourState.caseRecord.notes) moduleFourState.caseRecord.notes = moduleFourState.notes || '';
  }
  // The returned attempt remains immutable in lab_attempts; its saved
  // case-state latch must not make the working case permanently unsubmitable.
  // Scope this reset to an open redo for this exact lab (see Module 01).
  if (moduleFourProveItRedoRequested() && moduleFourState.caseRecord.submitted === true) {
    moduleFourState.caseRecord.submitted = false;
    moduleFourState.caseRecord.submittedAt = '';
    moduleFourSave();
  }

  // Initialize quiz state
  if (!moduleFourQuizState) {
    const previousQuestionIds = moduleFourState.lastQuizQuestionIds || [];
    moduleFourQuizState = createQuizAttempt(MODULE_FOUR_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
  }

  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'soc-analyst', 'soc-04');
  return moduleFourState;
}

function moduleFourGetSections() {
  // Server-verified modules (finished on another device, before the 09-27
  // lab rebuild, or by admin override) read complete instead of empty.
  const verified = moduleFourUser?.remoteVerifiedModuleProgress?.['soc-04'] === true;
  return [
    { id: 'lecture', title: 'Learn It', type: 'lecture', isComplete: true, scrollId: 'm04-lecture' },
    { id: 'guided-lab', title: 'Guided Lab', type: 'lab', isComplete: verified || (moduleFourGuidedState.caseRecord.submitted || moduleFourGuidedState.legacyComplete), scrollId: 'm04-guided-lab' },
    { id: 'assessment-lab', title: 'Assessment Lab', type: 'review', isComplete: verified || moduleFourState.completed, scrollId: 'm04-assessment-lab' },
    { id: 'review', title: 'Module Review', type: 'review', isComplete: true, scrollId: 'm04-review' },
    { id: 'sources', title: 'Sources & Further Reading', type: 'read', isComplete: null, scrollId: 'm04-sources-section', gated: false, supplemental: true },
  ];
}

function moduleFourGetQuickNavItems() {
  const items = [];
  MODULE_FOUR_LESSON_LOOPS.forEach((lesson, index) => {
    const work = moduleFourState.lessonWork[lesson.id] || {};
    const isComplete = work.taskComplete === true;
    items.push({
      id: `m04-lesson-${esc(lesson.id)}`,
      title: lesson.title,
      kind: 'lesson',
      isComplete,
      scrollId: `m04-lesson-${esc(lesson.id)}`,
      lessonNumber: index + 1,
    });
  });
  items.push({
    id: 'm04-guided-lab',
    title: 'Guided Lab',
    kind: 'lab',
    isComplete: moduleFourGuidedChecks().every((check) => check[2]),
    scrollId: 'm04-guided-lab',
  });
  items.push({
    id: 'm04-assessment-lab',
    title: 'Assessment Lab',
    kind: 'lab',
    isComplete: moduleFourState.completed === true,
    scrollId: 'm04-assessment-lab',
  });
  return items;
}

function moduleFourSave() {
  if (moduleFourUser && moduleFourState) SocM04AssessmentState.save(moduleFourUser, moduleFourState, SocM04AssessmentData);
}

function moduleFourLearnIt() {
  const deck = window.LearnItDecks?.['soc-04'] || [];
  if (!deck.length || !window.LearnItCards) return '';
  return window.LearnItCards.render({ deck, step: moduleFourState.learnItStep, viewed: moduleFourLearnView, done: moduleFourState.learnItStep >= deck.length, prefix: 'm04', id: 'm04-learn-it', headingId: 'm04-learn-it-title', heading: 'Tune detections with evidence', readyHeading: 'Set up your detection decisions', intro: 'Use these ideas to guide the detection engineering practice below.', doneHeading: 'Detection ideas complete', doneIntro: 'Revisit any idea above, then explore the detailed lesson material below.', readyText: 'Start with the balance between finding threats and managing noise.', label: 'LEARN IT', countLabel: 'ideas', readyCountLabel: `${deck.length} QUICK IDEAS`, progressCopy: ({ step, total }) => `${step} of ${total} ideas explored · continue to the lesson material below.`, slideLabel: 'Idea', readyActionLabel: 'LEARN IT', nextActionLabel: 'NEXT', finalActionLabel: 'Complete Learn It', restartLabel: 'Restart Learn It' });
}

function moduleFourVideoScript() {
  return '';
}

function moduleFourLessonLoop(lesson, index) {
  const work = moduleFourState.lessonWork[lesson.id] || { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
  const feedback = work.feedback?.length ? `<p class="m04-lesson-feedback ${work.checked ? 'is-pass' : 'is-hint'}" role="status">${esc(work.feedback.join(' '))}</p>` : '';
  return `<details class="m04-lesson-loop mf-lesson" ${work.taskComplete ? '' : 'open'}>
    <summary><span class="m04-lesson-number mf-lesson-number">${String(index + 1).padStart(2, '0')}</span><span class="mf-lesson-icon"><i class="${esc(lesson.icon || 'ri-book-2-line')}" aria-hidden="true"></i></span><span class="mf-lesson-title"><strong>${esc(lesson.title)}</strong><small>${work.taskComplete ? 'Complete — reopen to review' : 'Scenario → theory → check → applied task'}</small></span>${work.taskComplete ? '<span class="mf-lesson-done" aria-label="Lesson complete"><i class="ri-check-line" aria-hidden="true"></i></span>' : ''}<i class="ri-arrow-down-s-line mf-chevron" aria-hidden="true"></i></summary>
    <div class="m04-lesson-loop-body mf-lesson-body"><section><p class="m04-kicker">Scenario</p><p>${esc(lesson.scenario)}</p></section><section><p class="m04-kicker">Theory</p><p>${esc(lesson.theory)}</p></section><section><p class="m04-kicker">Knowledge check</p>${lesson.questions.map((question, qIndex) => `<fieldset class="m04-lesson-question"><legend>${qIndex + 1}. ${esc(question.prompt)}</legend>${question.options.map((option, optionIndex) => `<label><input type="radio" name="m04-lesson-${esc(lesson.id)}-${qIndex}" value="${optionIndex}" data-m04-lesson-answer data-lesson-id="${esc(lesson.id)}" data-question-index="${qIndex}" ${Number(work.answers?.[qIndex]) === optionIndex ? 'checked' : ''}><span>${esc(option)}</span></label>`).join('')}</fieldset>`).join('')}<button type="button" class="m04-lesson-check" data-m04-lesson-check="${esc(lesson.id)}">Check this lesson</button>${feedback}</section><section><p class="m04-kicker">Applied task</p><p>${esc(lesson.task)}</p><textarea rows="3" maxlength="500" data-m04-lesson-task="${esc(lesson.id)}" placeholder="Write a short analyst response…">${esc(work.task || '')}</textarea><button type="button" class="m04-lesson-task-button" data-m04-lesson-task-submit="${esc(lesson.id)}">${work.taskComplete ? 'Task saved' : 'Save applied task'}</button></section></div>
  </details>`;
}

function moduleFourLessonLoopsView() {
  return `<section class="m04-lesson-loops" id="m04-lessons" aria-labelledby="m04-lessons-title"><div class="m04-panel-heading"><div><p class="m04-kicker">Four-part lesson loops</p><h3 id="m04-lessons-title">Practice detection decisions in the Mission Next Labs loader campaign</h3></div><span>4 lessons · embedded in 180 theory minutes</span></div>${MODULE_FOUR_LESSON_LOOPS.map(moduleFourLessonLoop).join('')}</section>`;
}

function moduleFourLecture() {
  return `<section class="m04-lecture-section">
    <div class="m04-lecture-intro">
      <p><strong>What is detection engineering?</strong> A detection rule is a logical query that aggregates security events and alerts when a pattern emerges. The challenge is that a single event can be noise (a user mistyping their password) or signal (an attacker probing multiple accounts). Detection engineers balance sensitivity—catching real threats—against specificity—avoiding false alarms. The tool is the grouping field, the aggregation metric, and the threshold. Choose them wisely, and the same telemetry reveals patterns invisible to naive rules.</p>
    </div>
    ${moduleFourLessonLoopsView()}

    <h3>Grouping and aggregation: the foundation</h3>
    <p>Events do not come pre-labeled as "attack" or "benign." A detection rule decides by grouping events and counting them. The grouping field is critical: it determines which events are counted together, and which are split into separate alerts. Consider ten authentication failures:</p>
    <ul>
      <li><strong>Group by Account + Source IP:</strong> One group (Account A, IP 10.44.3.18, 5 failures) and one group (Account B, IP 10.44.3.18, 5 failures). These are separate, parallel failures against different accounts. Lower priority, or noise from a shared network failure.</li>
      <li><strong>Group by Source IP alone:</strong> One group (IP 10.44.3.18, 10 failures across all accounts). A concentrated attack source targeting multiple accounts. Higher priority: distributed pattern, higher scope.</li>
    </ul>
    <p>The grouping field choice is not about accuracy; it is about perspective. The same telemetry, same events, different story depending on how you group them. Detection engineering means choosing the grouping that reveals the threat you are trying to catch.</p>

    <h3>False positives and false negatives: the tradeoff</h3>
    <p>A rule's threshold controls sensitivity. Lower threshold = more sensitive = catches more real attacks (lower false negatives) but also more benign activity (higher false positives). Higher threshold = less sensitive = fewer false alarms but more missed attacks.</p>
    <ul>
      <li><strong>False positive:</strong> The rule alerts, but the activity is benign. Example: a scheduled backup job triggers a privilege-escalation alert because it changes permissions on a file.</li>
      <li><strong>False negative:</strong> The rule does not alert, but malicious activity occurred. Example: an attacker changes one admin password, but the rule looks for five changes, so the one-password change is missed.</li>
    </ul>
    <p>Your job is not to eliminate false positives (impossible) or false negatives (would require a threshold so low that every event triggers). Your job is to find the threshold that your team can actually handle. If you generate 1,000 alerts per day and the team can investigate 10, alert fatigue wins. If you generate 10 alerts per day but half are real attacks, you are finding the threats that matter.</p>

    <h3>Threat intelligence and indicator evaluation</h3>
    <p>A threat intelligence feed provides indicators: IP addresses, domains, file hashes—along with metadata:</p>
    <ul>
      <li><strong>Confidence:</strong> How certain the indicator is malicious (typically 0–100%). High confidence does not mean the indicator is useful; a high-confidence ISP IP is used by millions of people.</li>
      <li><strong>Status:</strong> Active (currently in use by threat actors), Expired (was active, no longer seen), Retired (determined to be benign or inactive).</li>
      <li><strong>Freshness:</strong> Last seen date. An indicator seen 6 hours ago is fresher than one seen 6 months ago. Stale indicators provide historical context but are weaker for current decisions.</li>
      <li><strong>Context:</strong> Why the indicator is flagged. An IP flagged as "C2 server for known botnet" has more specific relevance than "involved in spam campaign."</li>
    </ul>
    <p>The best enrichment combines high confidence, active status, recent observation, and exact relevance to your alert. A lower-confidence indicator that is fresh and directly matches your alert pattern is more useful than a high-confidence indicator from a different threat context.</p>

    <h3>Automation and approval boundaries</h3>
    <p>A Security Orchestration, Automation and Response (SOAR) platform can execute playbooks—sequences of actions triggered by alerts. But not all actions should be automated without human approval:</p>
    <ul>
      <li><strong>Safe for automation:</strong> Create a ticket, send an email, enrich an alert with threat feeds, preserve evidence, summarize findings. These actions collect information and move alerts forward without changing system state.</li>
      <li><strong>Requires approval:</strong> Disable an account, revoke a session, block an IP, wipe a host. These are disruptive; even a correct alert can target legitimate activity. A business-critical service account should not be disabled without a second opinion.</li>
    </ul>
    <p>The best playbooks are hybrid: automate safe, repeatable work (enrichment, ticketing); keep approval gates for disruptive response; and let analysts make judgment calls with better context. If a playbook can make a mistake, put a human in the loop.</p>

    <h3>Alert priority and triage reasoning</h3>
    <p>Not all alerts are equal. Priority should reflect:</p>
    <ul>
      <li><strong>Evidence of compromise:</strong> Did the attack succeed? One failed attempt is lower priority than a successful sign-in followed by privilege escalation and data access.</li>
      <li><strong>Asset value:</strong> A failed access attempt against a development server is lower priority than a failed attempt against a production database containing customer data.</li>
      <li><strong>Scope and distribution:</strong> A single account's anomalous behavior is lower priority than the same anomaly across many accounts from one source (distributed attack).</li>
      <li><strong>Context:</strong> An impossible-travel alert from a user on a known international business trip is lower priority than the same alert for a user who never travels.</li>
    </ul>
    <p>Triage is the art of reading alerts as data, not gospel. An alert is correct when it detects an anomaly; it is high-priority when that anomaly carries business impact or evidence of compromise. The same detection can be a true positive (real attack) and a benign positive (real anomaly, legitimate context) simultaneously. Your job is to read the context and assign priority accordingly.</p>
  </section>`;
}

function moduleFourQuizQuestion(selected, index) {
  const question = selected.question;
  const userAnswerId = moduleFourQuizState?.answers?.[question.id];
  const answered = userAnswerId !== undefined;
  return `<fieldset class="m04-quiz-question" data-question-id="${esc(question.id)}">
    <legend><span>${index + 1}</span> ${esc(selected.conceptTitle)}: ${esc(question.prompt)}</legend>
    <div class="m04-quiz-options">
      ${selected.shuffledOptions.map((option) => `<label>
        <input type="radio" name="q-${esc(question.id)}" value="${esc(option.id)}" ${userAnswerId === option.id ? 'checked' : ''} data-m04-quiz-answer />
        <span>${esc(option.text)}</span>
      </label>`).join('')}
    </div>
  </fieldset>`;
}

// A knowledge check can read complete on the account (server-verified module,
// synced quiz detail, or knowledge-check evidence) while this browser holds no
// answers — another device did the work, or an admin override set it. Show a
// verified summary instead of a blank 0/N form; never fabricate answers.
function moduleFourQuizVerifiedElsewhere() {
  if (moduleFourQuizForceRetake || !moduleFourQuizState || moduleFourQuizState.scored) return false;
  if (Object.keys(moduleFourQuizState.answers || {}).length > 0) return false;
  return moduleFourUser?.remoteVerifiedModuleProgress?.['soc-04'] === true
    || moduleFourUser?.remoteModuleDetail?.['soc-04']?.quizPassed === true
    || moduleFourUser?.remoteModuleEvidence?.['soc-04']?.['knowledge-check'] === true;
}

function moduleFourQuizPanel() {
  if (!moduleFourQuizState?.selectedQuestions || moduleFourQuizState.selectedQuestions.length === 0) {
    return `<div class="m04-quiz-empty" id="m04-quiz-feedback" role="status">Loading quiz...</div>`;
  }
  if (moduleFourQuizVerifiedElsewhere()) {
    return `<form class="m04-quiz-form mf-quiz-form" id="m04-quiz-form" novalidate><section class="mf-score is-pass" id="m04-quiz-feedback" tabindex="-1" aria-live="polite"><p class="mf-kicker">Module knowledge check</p><h3>Already verified complete</h3><p>This knowledge check is recorded as passed on your account. It is never re-answered automatically on a new device or browser, so nothing is shown here that wasn't actually submitted.</p><button type="button" class="mf-score-retake" data-m04-quiz-retake>Retake this knowledge check</button></section></form>`;
  }

  const selected = moduleFourQuizState.selectedQuestions;
  const answered = Object.keys(moduleFourQuizState.answers || {}).length;
  const total = selected.length;

  let feedbackHtml = '';
  if (moduleFourQuizState.scored) {
    const passed = moduleFourQuizState.score >= 70;
    feedbackHtml = `<section class="m04-quiz-score mf-score ${passed ? 'm04-quiz-pass is-pass' : 'm04-quiz-remediate is-remediate'}" id="m04-quiz-feedback" tabindex="-1" aria-live="polite">
      <div class="m04-quiz-score-heading">
        <div>
          <p class="m04-kicker">Attempt ${moduleFourQuizState.attempts} · best ${moduleFourQuizState.bestScore}/100</p>
          <h3>${moduleFourQuizState.score}/100 — ${passed ? 'Knowledge verified' : 'Use feedback and retry'}</h3>
        </div>
        <span>${moduleFourQuizState.score}</span>
      </div>
      <ul class="m04-quiz-feedback-list">
        ${(moduleFourQuizState.feedback || []).map((fb) => `<li class="${fb.correct ? 'm04-quiz-feedback-correct' : 'm04-quiz-feedback-incorrect'}">
          <i class="ri-${fb.correct ? 'checkbox-circle-fill' : 'information-line'}" aria-hidden="true"></i>
          <div>
            <strong>${fb.questionId}</strong>
            <p>${esc(fb.message)}</p>
          </div>
        </li>`).join('')}
      </ul>
      ${!passed ? `<div class="m04-quiz-actions"><button type="button" class="m04-quiz-retry" data-m04-quiz-retry><i class="ri-refresh-line" aria-hidden="true"></i> Try different questions</button></div>` : ''}
    </section>`;
  } else if (answered === total) {
    feedbackHtml = `<div class="m04-quiz-ready" id="m04-quiz-feedback" role="status">All questions answered. Submit to check your responses.</div>`;
  } else {
    feedbackHtml = `<div class="m04-quiz-empty" id="m04-quiz-feedback" role="status">Answer all ${total} questions to submit.</div>`;
  }

  return `<form class="m04-quiz-form mf-quiz-form" id="m04-quiz-form" novalidate>
    <div class="m04-panel-heading mf-panel-heading"><div><p class="m04-kicker mf-kicker">Knowledge check</p><h3 id="m04-quiz-title" tabindex="-1">Test your understanding of detection concepts</h3></div><span>${answered}/${total} answered</span></div>
    ${selected.map((sel, idx) => moduleFourQuizQuestion(sel, idx)).join('')}
    <div class="m04-quiz-actions">
      <button class="m04-quiz-submit" type="submit" ${answered < total ? 'disabled' : ''}>
        <i class="ri-checkbox-circle-line" aria-hidden="true"></i> Check my answers
      </button>
    </div>
    ${feedbackHtml}
  </form>`;
}

function moduleFourReview() {
  return `<section class="m04-review-section">
    <h3>Module concepts at a glance</h3>
    <ul>
      <li><strong>Grouping and aggregation:</strong> The grouping field in a detection rule determines which events are counted together. Changing the grouping field reveals or hides patterns in the same telemetry.</li>
      <li><strong>False positives vs. false negatives:</strong> Lower thresholds increase sensitivity (catch more real attacks) but generate more false positives (alert fatigue). Higher thresholds reduce noise but risk missing real attacks. Tuning is a tradeoff.</li>
      <li><strong>Threat intelligence evaluation:</strong> Indicators are useful when they are high-confidence, active, fresh, and relevant to the alert. A high-confidence indicator that is old or unrelated is weaker than a fresher match.</li>
      <li><strong>Automation and approval boundaries:</strong> Automate safe, repeatable work (enrichment, ticketing). Keep disruptive actions (account disablement, IP blocking) behind approval gates so humans can judge context and impact.</li>
      <li><strong>Alert priority and triage:</strong> Priority reflects impact, not just detection magnitude. Evidence of compromise, asset value, attack scope, and legitimate context all factor into triage decisions.</li>
      <li><strong>Detection as iteration:</strong> Rules evolve. Test them, measure false positives and false negatives, tune the grouping or threshold, and adjust based on your environment's baselines.</li>
    </ul>
    <h3>Before you continue</h3>
    <p>Tune grouping and thresholds to balance coverage with your team's capacity, and use relevant intelligence to add context. Automate safe repeatable work while keeping disruptive actions behind approval and human review.</p>
  </section>`;
}

function moduleFourRulePreview() {
  const group = moduleFourState.ruleGrouping === 'source-ip' ? 'SourceIp' : 'Account, SourceIp';
  const metric = moduleFourState.ruleMetric === 'distinct-accounts'
    ? 'targeted_accounts=dcount(Account)'
    : 'failures=count()';
  const field = moduleFourState.ruleMetric === 'distinct-accounts' ? 'targeted_accounts' : 'failures';
  return `AuthEvents\n| where Outcome == "Failed"\n| summarize ${metric} by ${group}, bin(TimeGenerated, 15m)\n| where ${field} >= ${moduleFourState.ruleThreshold}`;
}

function moduleFourEvaluateRule() {
  const failures = MODULE_FOUR_AUTH_EVENTS.filter((event) => event.outcome === 'Failed');
  const groups = new Map();
  failures.forEach((event) => {
    const key = moduleFourState.ruleGrouping === 'source-ip' ? event.ip : `${event.account}|${event.ip}`;
    if (!groups.has(key)) groups.set(key, { ip: event.ip, accounts: new Set(), eventIds: [] });
    const group = groups.get(key);
    group.accounts.add(event.account);
    group.eventIds.push(event.id);
  });
  const threshold = Number(moduleFourState.ruleThreshold);
  return [...groups.values()].filter((group) => {
    const value = moduleFourState.ruleMetric === 'distinct-accounts' ? group.accounts.size : group.eventIds.length;
    return value >= threshold;
  }).map((group) => ({
    ip: group.ip,
    accounts: [...group.accounts],
    failures: group.eventIds.length,
    eventIds: group.eventIds,
  }));
}

function moduleFourKicker(text) {
  return `<p class="m04-kicker">${esc(text)}</p>`;
}

function moduleFourProgressStrip() {
  const ruleDone = moduleFourState.ruleRuns > 0;
  const intelDone = Boolean(moduleFourState.enrichedIndicator);
  return `<div class="m04-progress-strip" aria-label="Lab progress">
    <span class="${ruleDone ? 'is-done' : ''}"><i class="${ruleDone ? 'ri-checkbox-circle-fill' : 'ri-settings-4-line'}" aria-hidden="true"></i> Test detection</span>
    <span class="${intelDone ? 'is-done' : ''}"><i class="${intelDone ? 'ri-checkbox-circle-fill' : 'ri-radar-line'}" aria-hidden="true"></i> Attach intelligence</span>
    <span class="${moduleFourState.automationRan ? 'is-done' : ''}"><i class="${moduleFourState.automationRan ? 'ri-checkbox-circle-fill' : 'ri-play-circle-line'}" aria-hidden="true"></i> Run automation</span>
    <span class="${moduleFourState.completed ? 'is-done' : ''}"><i class="${moduleFourState.completed ? 'ri-checkbox-circle-fill' : 'ri-file-text-line'}" aria-hidden="true"></i> Submit artifact</span>
  </div>`;
}

function moduleFourStationChooser() {
  const station = moduleFourState.activeStation;
  return `<section class="m04-station-chooser" aria-labelledby="m04-choose-title">
    <div class="m04-panel-heading"><div>${moduleFourKicker('Choose your investigation order')}<h3 id="m04-choose-title" tabindex="-1">Two desks, one detection decision</h3></div><span>Both use local synthetic data</span></div>
    <p class="m04-instruction">Start with the rule or with the intelligence feed. You can switch at any time; the signposts tell you what must be ready before submission.</p>
    <div class="m04-station-buttons">
      <button type="button" data-m04-station="rule" class="${station === 'rule' ? 'is-active' : ''}" aria-pressed="${station === 'rule'}">
        <i class="ri-filter-3-line" aria-hidden="true"></i><span><strong>Detection logic desk</strong><small>Review 14 authentication events, tune two logic choices, and simulate the result.</small></span><em>${moduleFourState.ruleRuns ? `${moduleFourState.ruleRuns} test${moduleFourState.ruleRuns === 1 ? '' : 's'} run` : 'Not tested'}</em>
      </button>
      <button type="button" data-m04-station="intel" class="${station === 'intel' ? 'is-active' : ''}" aria-pressed="${station === 'intel'}">
        <i class="ri-radar-line" aria-hidden="true"></i><span><strong>Threat intelligence desk</strong><small>Compare four indicators and attach the one that adds useful alert context.</small></span><em>${moduleFourState.enrichedIndicator ? `${esc(moduleFourState.enrichedIndicator)} attached` : 'No indicator attached'}</em>
      </button>
    </div>
  </section>`;
}

function moduleFourEvidenceCheckbox(id, label) {
  const checked = moduleFourState.selectedEvidence.includes(id);
  return `<label class="m04-evidence-check"><input type="checkbox" data-m04-evidence value="${esc(id)}" ${checked ? 'checked' : ''} /><span>${esc(label)}</span></label>`;
}

function moduleFourAuthEvents() {
  return `<div class="m04-event-list" aria-label="Synthetic authentication events">
    ${MODULE_FOUR_AUTH_EVENTS.map((event) => `<article class="m04-event ${moduleFourState.selectedEvidence.includes(event.id) ? 'is-selected' : ''}">
      <div class="m04-event-select">${moduleFourEvidenceCheckbox(event.id, `Select ${event.id} as evidence`)}</div>
      <div class="m04-event-time"><time>${esc(event.time)}</time><span class="m04-outcome m04-outcome-${event.outcome.toLowerCase()}">${esc(event.outcome)}</span></div>
      <div class="m04-event-entity"><strong>${esc(event.account)}</strong><code>${esc(event.ip)}</code></div>
      <div class="m04-event-context"><span>${esc(event.device)} · ${esc(event.region)}</span><p>${esc(event.detail)}</p></div>
    </article>`).join('')}
  </div>`;
}

function moduleFourRuleResults() {
  if (!moduleFourState.ruleRuns) return `<div class="m04-empty-result" id="m04-rule-result" role="status">No local simulation has run. Change the logic or test the current rule to see which candidates it produces.</div>`;
  if (!moduleFourState.ruleRunResults.length) return `<div class="m04-empty-result" id="m04-rule-result" role="status" tabindex="-1"><strong>0 alert candidates</strong><span>This version is too restrictive for the available pattern. Review how the data is grouped and counted.</span></div>`;
  return `<div class="m04-rule-results" id="m04-rule-result" role="status" tabindex="-1" aria-live="polite">
    ${moduleFourState.ruleRunResults.map((result) => `<article class="${result.ip === '198.51.100.44' ? 'is-target' : 'is-noise'}"><strong>${esc(result.ip)}</strong><span>${result.failures} failures · ${result.accounts.length} distinct account${result.accounts.length === 1 ? '' : 's'}</span><small>${result.ip === '198.51.100.44' ? 'Distributed pattern with follow-on success' : 'Repeated retries against one account on a managed client'}</small></article>`).join('')}
  </div>`;
}

function moduleFourRuleStation() {
  return `<section class="m04-workbench" id="m04-station-panel" aria-labelledby="m04-rule-title">
    <div class="m04-panel-heading"><div>${moduleFourKicker('Source 1 of 2 · authentication telemetry')}<h3 id="m04-rule-title" tabindex="-1">Detection logic desk</h3></div><span>14 records · one 15-minute window</span></div>
    <div class="m04-baseline">
      <i class="ri-alarm-warning-line" aria-hidden="true"></i><div><strong>Review finding: the current rule alerts on the wrong pattern.</strong><p>It groups by account and source, so five retries from a known managed client create an alert. One attempt across each of five accounts stays below its per-account threshold and is missed.</p></div>
    </div>
    <div class="m04-rule-grid">
      <div class="m04-rule-card">
        <div class="m04-rule-card-heading"><div>${moduleFourKicker('Editable miniature rule')}<h4>Password failures in 15 minutes</h4></div><span>Draft</span></div>
        <label for="m04-grouping">Group matching failures by</label>
        <select id="m04-grouping" name="ruleGrouping" data-m04-rule-control>
          <option value="account-ip" ${moduleFourState.ruleGrouping === 'account-ip' ? 'selected' : ''}>Account + source IP</option>
          <option value="source-ip" ${moduleFourState.ruleGrouping === 'source-ip' ? 'selected' : ''}>Source IP</option>
        </select>
        <label for="m04-metric">Trigger on</label>
        <select id="m04-metric" name="ruleMetric" data-m04-rule-control>
          <option value="failure-count" ${moduleFourState.ruleMetric === 'failure-count' ? 'selected' : ''}>Total failed events</option>
          <option value="distinct-accounts" ${moduleFourState.ruleMetric === 'distinct-accounts' ? 'selected' : ''}>Distinct targeted accounts</option>
        </select>
        <label for="m04-threshold">Threshold</label>
        <select id="m04-threshold" name="ruleThreshold" data-m04-rule-control>
          ${['3', '4', '6'].map((value) => `<option value="${value}" ${moduleFourState.ruleThreshold === value ? 'selected' : ''}>${value} or more</option>`).join('')}
        </select>
        <pre aria-label="Generated local detection query"><code>${esc(moduleFourRulePreview())}</code></pre>
        <button type="button" class="m04-primary" data-m04-run-rule><i class="ri-play-circle-line" aria-hidden="true"></i> Test against 14 events</button>
      </div>
      <div class="m04-rule-output">
        ${moduleFourKicker(`Simulation output · ${moduleFourState.ruleRuns} run${moduleFourState.ruleRuns === 1 ? '' : 's'}`)}
        <h4>Alert candidates</h4>
        ${moduleFourRuleResults()}
        <details class="m04-hint" data-m04-hint="rule">
          <summary>Need a tuning hint?</summary>
          <p>A spray is distributed across accounts. Ask which field should form the group and which count distinguishes five targets from five retries against one target.</p>
        </details>
      </div>
    </div>
    <div class="m04-subheading"><div><h4>Select alert-context evidence</h4><p>Choose the events that best explain the distributed pattern and its outcome. Benign sign-ins and one-account retries are deliberate distractors.</p></div><span><span data-m04-selected-count>${moduleFourState.selectedEvidence.length}</span> total artifacts selected</span></div>
    ${moduleFourAuthEvents()}
  </section>`;
}

function moduleFourIntelStation() {
  return `<section class="m04-workbench" id="m04-station-panel" aria-labelledby="m04-intel-title">
    <div class="m04-panel-heading"><div>${moduleFourKicker('Source 2 of 2 · local intelligence snapshot')}<h3 id="m04-intel-title" tabindex="-1">Threat intelligence desk</h3></div><span>4 indicators · mixed relevance</span></div>
    <p class="m04-instruction">Compare exact value, status, freshness, confidence, and context. Intelligence can strengthen or weaken an assessment, but it does not replace the authentication evidence.</p>
    <div class="m04-intel-list">
      ${MODULE_FOUR_INTEL.map((indicator) => `<article class="m04-intel-card ${moduleFourState.enrichedIndicator === indicator.id ? 'is-attached' : ''}">
        <div class="m04-intel-top"><span>${esc(indicator.type)}</span><strong>${esc(indicator.id)}</strong></div>
        <code>${esc(indicator.value)}</code>
        <dl><div><dt>Confidence</dt><dd>${indicator.confidence}/100</dd></div><div><dt>Status</dt><dd>${esc(indicator.status)}</dd></div><div><dt>Last seen</dt><dd>${esc(indicator.lastSeen)}</dd></div></dl>
        <p>${esc(indicator.context)}</p>
        <div class="m04-intel-actions">${moduleFourEvidenceCheckbox(indicator.id, `Select ${indicator.id} as evidence`)}<button type="button" data-m04-enrich="${esc(indicator.id)}">${moduleFourState.enrichedIndicator === indicator.id ? 'Attached to alert' : 'Attach to alert'}</button></div>
      </article>`).join('')}
    </div>
    <details class="m04-hint" data-m04-hint="intel">
      <summary>Need an enrichment hint?</summary>
      <p>Start with an exact value from the suspicious authentication cluster. Prefer an active, recent indicator whose context describes the same behavior.</p>
    </details>
  </section>`;
}

function moduleFourArtifact() {
  const cr = moduleFourState.caseRecord;
  const spec = moduleFourCaseSpec();
  const missing = caseRecordMissing(cr, spec);
  return `<section class="m04-artifact" aria-labelledby="m04-artifact-title">
    <div class="m04-panel-heading"><div>${moduleFourKicker('Scored artifact · one submission, faculty reviewed')}<h3 id="m04-artifact-title">Complete the detection package</h3></div>${!cr.submitted ? `<button type="button" class="m04-secondary" data-m04-reset><i class="ri-restart-line" aria-hidden="true"></i> Reset only this lab</button>` : ''}</div>
    ${caseRecordPane(cr, {
      ...spec,
      missing,
      formId: 'm04-assessment',
      saveAttr: 'data-m04-save-case',
      submitAttr: 'data-m04-submit-case',
      panelId: 'm04-case-panel',
      showMissing: moduleFourProveItShowMissing,
      redoRequested: moduleFourProveItRedoRequested(),
      redoHtml: moduleFourProveItRedoFeedback(),
      reviewStatus: moduleFourProveItReviewStatus(),
      lockedMessage: 'Module 5 stays locked until your instructor approves the submission.',
    })}
  </section>`;
}

function moduleFourGuidedLabPanel() {
  return `${moduleFourGuidedGuide()}<div class="m03e-panel" id="m04-guided-console-panel"><div class="m03e-brief"><p class="m03e-label">CASE-044478 · INC-044790 · PRACTICE IT · SOC DETECTION QUEUE</p><p>Review a reported burst of sign-in failures, decide how to tune a detection, and document a bounded response. You choose the investigation path.</p></div><div class="m03e-console-host" id="m03e-console-m04-guided">${moduleThreeConsoleHtml('m04-guided')}</div></div>`;
}

// The Module 3 SIEM, mounted on the independent M04 assessment data. Module 4
// adds only Threat Intelligence, Analytics Rules and Automation; everything
// else (and the ITSM ticket tab) is the Module 3 console unchanged.
const MODULE_FOUR_CONSOLE_DATA = (function () {
  const s = SocM04AssessmentData.scenario;
  const day = s.start.slice(0, 10);
  const events = s.telemetry.map((e) => m03eRow('AuthLog', e.id, day, e.time.slice(11, 19), {
    EventType: e.type, Account: e.account, SourceIp: e.sourceIp, Result: e.result, DeviceClass: e.deviceClass, Host: 'idp-04',
    Detail: e.result === 'Failure' ? 'Invalid password' : 'Sign-in succeeded',
  }));
  // Sprint 2 context sources (console-only: Log Search and the Entities/Timeline views read them; the
  // analytics-rule evaluator runs on the AuthLog telemetry above). Purposes: M04-X-001/002 corroborate
  // the stale mail-client explanation, X-003/005 collector baseline and lag, X-004 and X-006 explain the
  // scheduled backup and probe failures, X-007 a routine directory change.
  const extra = [
    m03eRow('AppAudit', 'M04-X-001', day, '09:07:20', { EventType: 'MailSyncAuthError', Account: 'acct-17', SourceIp: '203.0.113.77', Host: 'mail-relay-01', Application: 'MailClient', Result: 'Failure', Records: 0, Detail: 'IMAP login rejected: cached credential predates the rotation; client retries every 60 seconds' }),
    m03eRow('AppAudit', 'M04-X-002', day, '09:12:35', { EventType: 'MailSync', Account: 'acct-17', SourceIp: '203.0.113.77', Host: 'mail-relay-01', Application: 'MailClient', Result: 'Success', Records: 41, Detail: 'Client re-authenticated with the refreshed credential; mailbox sync resumed' }),
    m03eRow('SystemLog', 'M04-X-003', day, '09:00:10', { EventType: 'CollectorHeartbeat', Account: 'idp-04', SourceIp: '10.44.1.4', Host: 'idp-04', Result: 'Success', Detail: 'Heartbeat on schedule (60-second interval)' }),
    m03eRow('SystemLog', 'M04-X-004', day, '09:15:20', { EventType: 'ScheduledJobStart', Account: 'svc-backup', SourceIp: '10.44.8.5', Host: 'bk-02', Result: 'Success', ChangeId: 'SCH-044', Detail: 'Backup catch-up job started under svc-backup; vault entry expired, job retries before falling back to the renewed entry' }),
    m03eRow('SystemLog', 'M04-X-005', day, '09:09:40', { EventType: 'CollectorLag', Account: 'idp-04', SourceIp: '10.44.1.4', Host: 'idp-04', Result: 'Delayed', Detail: 'Branch relay batch ingested 40 seconds late; no events dropped' }),
    m03eRow('SystemLog', 'M04-X-006', day, '09:05:00', { EventType: 'ScheduledProbe', Account: 'svc-monitor', SourceIp: '10.44.0.9', Host: 'mon-01', Result: 'Success', ChangeId: 'SCH-031', Detail: 'Availability probe of the sign-in endpoint every 5 minutes using a deliberately invalid test credential (failure expected)' }),
    m03eRow('DirectoryAudit', 'M04-X-007', day, '09:03:15', { EventType: 'GroupAdded', Account: 'acct-55', SourceIp: '10.44.1.20', Host: 'dc-04', Result: 'Success', InitiatedBy: 'it-admin', TargetGroup: 'Finance-Read', Detail: 'Added to Finance-Read (CR-212)' }),
  ];
  events.push(...extra);
  const user = (account, department, usual) => ({ Account: account, DisplayName: account, Type: 'User', Department: department, Owner: '—', Privileged: 'No', UsualSourceIp: usual, Notes: '' });
  return {
    ...m03eBuildDataset({
      caseId: s.caseId,
      day,
      events,
      identities: [user('acct-41', 'Finance', '10.44.3.18'), user('acct-42', 'Operations', '10.44.3.22'), user('acct-43', 'Legal', '10.44.3.18'), user('acct-44', 'Finance', '10.44.3.22'), user('acct-45', 'Sales', '10.44.3.18'), { ...user('acct-17', 'Operations', '203.0.113.77'), Notes: 'Uses the managed mail client' },
        user('acct-51', 'Finance', '10.44.3.30'), user('acct-52', 'Operations', '10.44.3.31'), user('acct-53', 'Legal', '10.44.3.33'), user('acct-54', 'Sales', '10.44.3.34'), user('acct-55', 'Finance', '10.44.3.36'),
        { ...user('acct-31', 'Branch office', '203.0.113.140'), Notes: 'Works from the branch office; shares its NAT egress' }, { ...user('acct-32', 'Branch office', '203.0.113.140'), Notes: 'Works from the branch office; shares its NAT egress' }, { ...user('acct-33', 'Branch office', '203.0.113.140'), Notes: 'Works from the branch office; shares its NAT egress' }],
      ips: [
        { SourceIp: '198.51.100.64', Type: 'External', Country: '—', Asn: 'Unresolved hosting network', FirstSeen: `${day} 09:01`, Reputation: 'No internal history. Check Threat Intelligence for reporting on this address.' },
        { SourceIp: '203.0.113.77', Type: 'External', Country: '—', Asn: 'Mission Next managed mail relay', FirstSeen: '2025-01-10 08:00', Reputation: 'Known managed mail-client egress' },
        { SourceIp: '203.0.113.140', Type: 'External', Country: '—', Asn: 'Mission Next branch office NAT', FirstSeen: '2024-11-04 08:00', Reputation: 'Known branch egress shared by several staff' },
      ],
      watchlists: {
        ChangeTickets: { title: 'Approved change tickets', rows: [
          { ChangeId: 'CR-204', Summary: 'Credential rotation (Identity Operations)', Account: 'acct-17', Window: `${day} 08:45–09:15`, Status: 'Completed' },
          { ChangeId: 'CR-212', Summary: 'Grant Finance-Read (Access Management)', Account: 'acct-55', Window: `${day} 09:00–09:10`, Status: 'Completed' },
          { ChangeId: 'SCH-031', Summary: 'Availability probe, every 5 minutes (invalid test credential, failures expected)', Account: 'svc-monitor', Window: `${day} Every 5 min`, Status: 'Standing' },
          { ChangeId: 'SCH-044', Summary: 'Backup catch-up job (vault credential renewal retries)', Account: 'svc-backup', Window: `${day} 09:15–09:20`, Status: 'Standing' },
        ] },
      },
      alerts: [],
    }),
    now: s.end,
  };
}());

const moduleFourAssessment = () => moduleFourState.assessment;

const MODULE_FOUR_CONSOLE = SocConsoleTools.mount('m04', {
  data: MODULE_FOUR_CONSOLE_DATA,
  stateRoot: () => moduleFourState,
  save: () => moduleFourSave(),
  title: 'SIEM & DETECTION ENGINEERING',
  ariaLabel: 'Module 04 detection assessment console',
  packs: [{ id: 'm04', ctx: { assessment: moduleFourAssessment, fixture: SocM04AssessmentData, save: () => moduleFourSave(), rerender: () => moduleFourRenderAssessment(), console: () => m03eState('m04') } }],
    caseView: () => moduleFourArtifact(),
  caseBadge: () => (moduleFourState.caseRecord.submitted ? ' <i class="ri-checkbox-circle-fill" aria-hidden="true"></i>' : ''),
});

// Practice It uses a separately persisted case root and a distinct scenario;
// none of its console or tool-pack state is stored under the Prove It lab ID.
const MODULE_FOUR_GUIDED_LAB_ID = 'm04-guided-detection-console-v1';
let moduleFourGuidedState = null;
let moduleFourGuidedUser = null;
const moduleFourGuidedClone = (value) => JSON.parse(JSON.stringify(value));
function moduleFourGuidedReplace(value) {
  const replacements = {
    'M04-ASSESS-2026-09-24': 'M04-GUIDED-2026-09-27', 'CASE-044424': 'CASE-044478', 'INC-044733': 'INC-044790',
    'M04-A-001': 'GL4-A-101', 'M04-A-002': 'GL4-A-102', 'M04-A-003': 'GL4-A-103', 'M04-A-004': 'GL4-A-104', 'M04-A-005': 'GL4-A-105', 'M04-A-006': 'GL4-A-106', 'M04-A-007': 'GL4-A-107', 'M04-A-008': 'GL4-A-108', 'M04-A-009': 'GL4-A-109',
    'M04-R-001': 'GL4-R-201', 'M04-R-002': 'GL4-R-202', 'M04-I-001': 'GL4-I-301', 'M04-I-002': 'GL4-I-302', 'M04-I-003': 'GL4-I-303',
    '198.51.100.64': '192.0.2.144', '203.0.113.77': '203.0.113.177',
    'acct-41': 'acct-61', 'acct-42': 'acct-62', 'acct-43': 'acct-63', 'acct-44': 'acct-64', 'acct-45': 'acct-65',
    'acct-17': 'acct-67',
  };
  if (typeof value === 'string') return Object.entries(replacements).reduce((result, [from, to]) => result.split(from).join(to), value);
  if (Array.isArray(value)) return value.map(moduleFourGuidedReplace);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, moduleFourGuidedReplace(item)]));
  return value;
}
const MODULE_FOUR_GUIDED_FIXTURE = moduleFourGuidedReplace(moduleFourGuidedClone(SocM04AssessmentData));
MODULE_FOUR_GUIDED_FIXTURE.scenario.telemetry = [
  { id: 'GL4-A-101', time: '2026-09-27T10:11:00Z', source: 'AuthLog', type: 'AuthFailure', account: 'acct-61', sourceIp: '192.0.2.144', result: 'Failure', deviceClass: 'Unknown' },
  { id: 'GL4-A-102', time: '2026-09-27T10:12:00Z', source: 'AuthLog', type: 'AuthFailure', account: 'acct-62', sourceIp: '192.0.2.144', result: 'Failure', deviceClass: 'Unknown' },
  { id: 'GL4-A-103', time: '2026-09-27T10:13:00Z', source: 'AuthLog', type: 'AuthFailure', account: 'acct-63', sourceIp: '192.0.2.144', result: 'Failure', deviceClass: 'Unknown' },
  { id: 'GL4-A-104', time: '2026-09-27T10:14:00Z', source: 'AuthLog', type: 'AuthSuccess', account: 'acct-62', sourceIp: '192.0.2.144', result: 'Success', deviceClass: 'Unknown' },
  { id: 'GL4-A-105', time: '2026-09-27T10:16:00Z', source: 'AuthLog', type: 'AuthFailure', account: 'acct-67', sourceIp: '203.0.113.177', result: 'Failure', deviceClass: 'Managed mail client' },
  { id: 'GL4-A-106', time: '2026-09-27T10:17:00Z', source: 'AuthLog', type: 'AuthFailure', account: 'acct-67', sourceIp: '203.0.113.177', result: 'Failure', deviceClass: 'Managed mail client' },
  { id: 'GL4-A-107', time: '2026-09-27T10:18:00Z', source: 'AuthLog', type: 'AuthFailure', account: 'acct-67', sourceIp: '203.0.113.177', result: 'Failure', deviceClass: 'Managed mail client' },
  // Sprint 2 background and alternate-explanation rows (purposes in truth.rowPurpose).
  { id: 'GL4-A-111', source: 'AuthLog', time: '2026-09-27T10:10:30Z', type: 'AuthSuccess', account: 'acct-61', sourceIp: '10.55.4.10', result: 'Success', deviceClass: 'Managed workstation' },
  { id: 'GL4-A-112', source: 'AuthLog', time: '2026-09-27T10:12:20Z', type: 'AuthSuccess', account: 'acct-68', sourceIp: '10.55.4.14', result: 'Success', deviceClass: 'Managed workstation' },
  { id: 'GL4-A-113', source: 'AuthLog', time: '2026-09-27T10:13:40Z', type: 'AuthSuccess', account: 'acct-69', sourceIp: '10.55.4.15', result: 'Success', deviceClass: 'Managed workstation' },
  { id: 'GL4-A-114', source: 'AuthLog', time: '2026-09-27T10:15:10Z', type: 'AuthSuccess', account: 'acct-63', sourceIp: '10.55.4.10', result: 'Success', deviceClass: 'Managed workstation' },
  { id: 'GL4-A-115', source: 'AuthLog', time: '2026-09-27T10:17:45Z', type: 'AuthSuccess', account: 'acct-70', sourceIp: '10.55.4.16', result: 'Success', deviceClass: 'Managed workstation' },
  { id: 'GL4-A-116', source: 'AuthLog', time: '2026-09-27T10:18:30Z', type: 'AuthFailure', account: 'acct-71', sourceIp: '203.0.113.190', result: 'Failure', deviceClass: 'Branch workstation' },
  { id: 'GL4-A-117', source: 'AuthLog', time: '2026-09-27T10:18:50Z', type: 'AuthSuccess', account: 'acct-71', sourceIp: '203.0.113.190', result: 'Success', deviceClass: 'Branch workstation' },
  { id: 'GL4-A-118', source: 'AuthLog', time: '2026-09-27T10:12:00Z', type: 'AuthFailure', account: 'svc-probe', sourceIp: '10.55.0.9', result: 'Failure', deviceClass: 'Synthetic probe' },
  { id: 'GL4-A-119', source: 'AuthLog', time: '2026-09-27T10:17:00Z', type: 'AuthFailure', account: 'svc-probe', sourceIp: '10.55.0.9', result: 'Failure', deviceClass: 'Synthetic probe' },
  { id: 'GL4-A-120', source: 'AuthLog', time: '2026-09-27T10:11:50Z', type: 'AuthSuccess', account: 'acct-69', sourceIp: '10.55.4.15', result: 'Success', deviceClass: 'Managed workstation' },
  { id: 'GL4-A-121', source: 'AuthLog', time: '2026-09-27T10:14:25Z', type: 'AuthSuccess', account: 'acct-68', sourceIp: '10.55.4.14', result: 'Success', deviceClass: 'Managed workstation' },
  { id: 'GL4-A-122', source: 'AuthLog', time: '2026-09-27T10:16:55Z', type: 'AuthSuccess', account: 'acct-61', sourceIp: '10.55.4.10', result: 'Success', deviceClass: 'Managed workstation' },
  { id: 'GL4-A-123', source: 'AuthLog', time: '2026-09-27T10:19:05Z', type: 'AuthSuccess', account: 'acct-70', sourceIp: '10.55.4.16', result: 'Success', deviceClass: 'Managed workstation' },
];
MODULE_FOUR_GUIDED_FIXTURE.scenario.start = '2026-09-27T10:10:00Z';
MODULE_FOUR_GUIDED_FIXTURE.scenario.end = '2026-09-27T10:20:00Z';
MODULE_FOUR_GUIDED_FIXTURE.scenario.generatedAt = '2026-09-27T10:21:00Z';
MODULE_FOUR_GUIDED_FIXTURE.scenario.truth = {
  maliciousSourceIp: '192.0.2.144', targetedAccounts: ['acct-61', 'acct-62', 'acct-63'], confirmedCompromisedAccounts: ['acct-62'],
  successfulAuthenticationEventIds: ['GL4-A-104'], corroboratingIocIds: ['GL4-I-301'], unrelatedIocIds: ['GL4-I-302', 'GL4-I-303'],
  benignRetry: { sourceIp: '203.0.113.177', account: 'acct-67', eventIds: ['GL4-A-105', 'GL4-A-106', 'GL4-A-107'], explanationReportId: 'GL4-R-201' },
  benignBackgroundEventIds: ['GL4-A-111', 'GL4-A-112', 'GL4-A-113', 'GL4-A-114', 'GL4-A-115', 'GL4-A-116', 'GL4-A-117', 'GL4-A-118', 'GL4-A-119', 'GL4-A-120', 'GL4-A-121', 'GL4-A-122', 'GL4-A-123', 'GL4-X-001', 'GL4-X-002', 'GL4-X-003', 'GL4-X-004', 'GL4-X-005'],
  rowPurpose: {
    'GL4-A-111..115, 120..123': 'baseline: routine managed-workstation sign-ins from usual LAN addresses',
    'GL4-A-116..117': 'tuning: one branch user mistypes once then succeeds (a single account, below any distinct-account threshold)',
    'GL4-X-001..005': 'context (console-only): mail-client auth error corroborates the refresh explanation, probe schedule, collector heartbeat/lag baseline, routine password change',
    'GL4-A-118..119': 'tuning: scheduled probe with an invalid test credential (SystemLog + SCH-052 explain it); only a raw failure count would flag it',
  },
  rule: { groupingField: 'sourceIp', metric: 'distinctAccounts', threshold: 3, windowMinutes: 5, matchEventIds: ['GL4-A-101', 'GL4-A-102', 'GL4-A-103', 'GL4-A-104'], excludeEventIds: ['GL4-A-105', 'GL4-A-106', 'GL4-A-107'] },
};
// Practice It indicator verdicts (same four-way mix as Prove It: one malicious, one benign, two unknown).
MODULE_FOUR_GUIDED_FIXTURE.scenario.verdictIndicators = [
  { id: 'GL4-I-301', type: 'ip', value: '192.0.2.144', origin: 'Threat Desk feed · IOC GL4-I-301', context: 'Listed as part of a current distributed credential-guessing cluster.' },
  { id: 'GL4-I-302', type: 'ip', value: '192.0.2.91', origin: 'Threat Desk feed · IOC GL4-I-302', context: 'Listed against a separate phishing cluster.' },
  { id: 'GL4-I-303', type: 'domain', value: 'legacy-drop.example', origin: 'Threat Desk feed · IOC GL4-I-303', context: 'Listed as retired infrastructure; status expired.' },
  { id: 'GL4-C-401', type: 'ip', value: '203.0.113.177', origin: 'Reputation sweep · not in the Threat Desk feed', context: 'Flagged for analyst review after repeated failed sign-ins from this address.' },
];
Object.assign(MODULE_FOUR_GUIDED_FIXTURE.scenario.truth, {
  indicatorDecisions: { 'GL4-I-301': 'malicious', 'GL4-I-302': 'unknown', 'GL4-I-303': 'unknown', 'GL4-C-401': 'benign' },
  indicatorEvidence: {
    'GL4-I-301': ['GL4-A-101', 'GL4-A-102', 'GL4-A-103', 'GL4-A-104', 'GL4-R-202', 'acct-61', 'acct-62', 'acct-63'],
    'GL4-I-302': [], 'GL4-I-303': [],
    'GL4-C-401': ['GL4-A-105', 'GL4-A-106', 'GL4-A-107', 'GL4-X-001', 'GL4-R-201', 'CR-288', 'acct-67'],
  },
  indicatorPoints: { 'GL4-I-301': 3, 'GL4-C-401': 3, 'GL4-I-302': 2, 'GL4-I-303': 2 },
});
// Progressive hints narrow from where to look to what to cite; feedback is shown only in Practice It.
MODULE_FOUR_GUIDED_FIXTURE.scenario.verdictHints = {
  'GL4-I-301': ['Open Log Search and look up this address. Which accounts did it try?', 'Count the distinct accounts that failed from this address, and whether any later succeeded.', 'Cite the failed attempts (GL4-A-101 to GL4-A-103), the success on acct-62 (GL4-A-104), or the Threat Desk report GL4-R-202.'],
  'GL4-C-401': ['Look up this address in the Entities view. Who normally signs in from it?', 'Check the Approved change tickets and the AppAudit rows for the same account.', 'Cite the credential refresh (CR-288), the mail-client error (GL4-X-001), or the account acct-67.'],
  'GL4-I-302': ['Search the sign-in and application records for this address.', 'Nothing in this case mentions it; the feed ties it to a different cluster.', 'With no records either way, unknown is the supported verdict. Say what evidence is missing.'],
  'GL4-I-303': ['The feed marks this domain expired. Search this case for any record that touches it.', 'No sign-in, application, or directory record here mentions it.', 'An expired indicator with no local match is historical context. Record unknown and say why.'],
};
MODULE_FOUR_GUIDED_FIXTURE.scenario.verdictFeedback = {
  'GL4-I-301': { why: 'Several accounts failed from this address within minutes and one then succeeded, which matches the report.', nudge: 'Look at the sign-in records for this address: how many distinct accounts, and did any succeed?' },
  'GL4-C-401': { why: 'The failures follow an approved credential refresh and the mail client logged the stale credential, so the report alone does not make this address hostile.', nudge: 'Check the change tickets and application records for this account before judging the address.' },
  'GL4-I-302': { why: 'No record in this case mentions this address, so the case can neither confirm nor clear it.', nudge: 'Search the records for this address. With no match you have no basis to call it malicious or benign.' },
  'GL4-I-303': { why: 'The indicator is expired and nothing in this case touches it, so it is historical context only.', nudge: 'Search the records for this domain. With no match you have no basis to call it malicious or benign.' },
};
MODULE_FOUR_GUIDED_FIXTURE.scenario.reports[0].summary = 'acct-67 mail retries follow the completed credential refresh; treat them as a managed-client baseline.';
MODULE_FOUR_GUIDED_FIXTURE.scenario.reports[1].summary = '192.0.2.144 is linked to a current distributed credential-guessing cluster; corroborate the report against local sign-in activity.';
// Teaching visual (Guided Lab reference): same Guided Lab records bucketed two ways. Built from
// MODULE_FOUR_GUIDED_FIXTURE only, so it never touches the graded Prove It dataset.
function moduleFourGroupingCompare() {
  const sc = MODULE_FOUR_GUIDED_FIXTURE.scenario;
  const truth = sc.truth;
  const rule = truth.rule;
  const retryIds = new Set(truth.benignRetry.eventIds);
  const winMs = rule.windowMinutes * 60000;
  const rows = sc.telemetry
    .filter((e) => e.result === 'Failure' || truth.successfulAuthenticationEventIds.includes(e.id))
    .map((e) => ({ ...e, ms: Date.parse(e.time), tail: e.id.replace(/^GL4-/, ''),
      kind: retryIds.has(e.id) ? 'retry' : (e.sourceIp === truth.maliciousSourceIp ? 'spray' : 'noise') }))
    .sort((a, b) => a.ms - b.ms);
  const hhmm = (e) => e.time.slice(11, 16);
  const kindLabel = { spray: 'Spray', retry: 'Managed retry', noise: 'Background' };
  const chip = (e, show) => `<li class="m04-gc-chip is-${e.kind} ${e.result === 'Success' ? 'is-ok' : ''}"><span class="m04-gc-mark" aria-hidden="true">${e.result === 'Success' ? '✓' : '✕'}</span><span class="m04-gc-chip-text"><strong>${esc(e.tail)}</strong> ${esc(hhmm(e))} ${esc(show)}</span><span class="m04-gc-tag">${e.result === 'Success' ? 'Success · ' : ''}${esc(kindLabel[e.kind])}</span></li>`;
  const bucket = (key) => rows.reduce((m, e) => { (m[e[key]] = m[e[key]] || []).push(e); return m; }, {});
  const accountThreshold = 3;
  const byAccount = bucket('account');
  const byAccountKeys = Object.keys(byAccount);
  const accountFails = (list) => list.filter((e) => e.result === 'Failure').length;
  const accountAlerts = byAccountKeys.filter((k) => accountFails(byAccount[k]) >= accountThreshold);
  const bySource = bucket('sourceIp');
  const bySourceKeys = Object.keys(bySource);
  const sourceHit = (list) => {
    const f = list.filter((e) => e.result === 'Failure');
    return f.some((a) => new Set(f.filter((b) => b.ms >= a.ms && b.ms < a.ms + winMs).map((b) => b.account)).size >= rule.threshold);
  };
  const sourceAlerts = bySourceKeys.filter((k) => sourceHit(bySource[k]));
  const group = (title, meta, list, show, alert) => `<li class="m04-gc-group ${alert ? 'is-alert' : 'is-quiet'}"><p class="m04-gc-group-head"><strong>${esc(title)}</strong><span>${esc(meta)}</span></p><ul class="m04-gc-chips">${list.map((e) => chip(e, show(e))).join('')}</ul></li>`;
  const acctCol = byAccountKeys.map((k) => group(k, `${accountFails(byAccount[k])} failure${accountFails(byAccount[k]) === 1 ? '' : 's'} · ${accountAlerts.includes(k) ? 'ALERT' : 'below threshold'}`, byAccount[k], (e) => e.sourceIp, accountAlerts.includes(k))).join('');
  const srcCol = bySourceKeys.map((k) => { const f = bySource[k].filter((e) => e.result === 'Failure'); const n = new Set(f.map((e) => e.account)).size; return group(k, `${n} distinct account${n === 1 ? '' : 's'} · ${sourceAlerts.includes(k) ? 'ALERT' : 'below threshold'}`, bySource[k], (e) => e.account, sourceAlerts.includes(k)); }).join('');
  const spraySingles = byAccountKeys.filter((k) => byAccount[k].some((e) => e.kind === 'spray') && !accountAlerts.includes(k)).length;
  const retryAlerted = accountAlerts.some((k) => byAccount[k].some((e) => e.kind === 'retry'));
  const sprayCaught = sourceAlerts.includes(truth.maliciousSourceIp);
  const textEq = `Same ${rows.length} records, two groupings. Grouping by account: ${byAccountKeys.length} buckets, ${accountAlerts.length} alert (${retryAlerted ? 'the managed retry' : 'none'}), and the spray is split across ${spraySingles} single-failure accounts that stay below the threshold of ${accountThreshold}. Grouping by source address in a ${rule.windowMinutes}-minute window: ${bySourceKeys.length} buckets, ${sourceAlerts.length} alert (${sprayCaught ? `source ${truth.maliciousSourceIp}, ${truth.targetedAccounts.length} distinct accounts` : 'none'}); the managed retry, branch mistype and scheduled probe each involve one account and stay quiet.`;
  return `<details class="m04-gc mf-lesson" id="m04-grouping-compare">
    <summary><span class="mf-lesson-icon"><i class="ri-git-merge-line" aria-hidden="true"></i></span><span class="mf-lesson-title"><strong>Reference: why grouping changes the alert</strong><small>Same Guided Lab records, two groupings</small></span><i class="ri-arrow-down-s-line mf-chevron" aria-hidden="true"></i></summary>
    <section class="m04-gc-body" aria-labelledby="m04-gc-title">
      <h3 id="m04-gc-title" class="m04-gc-title">Same records, different grouping, different alert</h3>
      <p class="m04-gc-sr">${esc(textEq)}</p>
      <div class="m04-gc-cols" aria-hidden="false">
        <section class="m04-gc-col is-current" aria-label="Current: group by account">
          <p class="m04-gc-colhead"><span class="m04-gc-badge">CURRENT</span> Group by account<small>Illustrative baseline: alert at ${accountThreshold} failures for one account</small></p>
          <ul class="m04-gc-groups">${acctCol}</ul>
          <p class="m04-gc-outcome"><strong>Outcome: ${accountAlerts.length} alert.</strong> ${retryAlerted ? 'It is the managed retry (noise). ' : ''}The spray is ${spraySingles} separate single-failure accounts, each below threshold, so it is missed.</p>
        </section>
        <section class="m04-gc-col is-proposed" aria-label="Proposed: group by source and time window">
          <p class="m04-gc-colhead"><span class="m04-gc-badge">PROPOSED</span> Group by source + ${rule.windowMinutes}-minute window<small>Alert at ${rule.threshold} or more distinct accounts from one source</small></p>
          <ul class="m04-gc-groups">${srcCol}</ul>
          <p class="m04-gc-outcome"><strong>Outcome: ${sourceAlerts.length} alert.</strong> ${sprayCaught ? `One source reached ${truth.targetedAccounts.length} distinct accounts inside the window: the distributed pattern shows as a single alert. ` : ''}Single-account retries, mistypes and probes stay quiet.</p>
        </section>
      </div>
      <p class="m04-gc-key"><strong>Key:</strong> solid border = part of the spray; dashed border = benign or background; ✕ = failure, ✓ = success. Reference only, nothing here is graded.</p>
    </section>
  </details>`;
}
const MODULE_FOUR_GUIDED_CONSOLE_DATA = (() => {
  const scenario = MODULE_FOUR_GUIDED_FIXTURE.scenario;
  const day = scenario.start.slice(0, 10);
  const events = scenario.telemetry.map((event) => m03eRow('AuthLog', event.id, day, event.time.slice(11, 19), {
    EventType: event.type, Account: event.account, SourceIp: event.sourceIp, Result: event.result, DeviceClass: event.deviceClass, Host: 'idp-07',
    Detail: event.result === 'Failure' ? 'Invalid password' : 'Sign-in succeeded',
  }));
  // Sprint 2 console-only context sources (the rule evaluator runs on the AuthLog telemetry).
  events.push(
    m03eRow('AppAudit', 'GL4-X-001', day, '10:16:25', { EventType: 'MailSyncAuthError', Account: 'acct-67', SourceIp: '203.0.113.177', Host: 'mail-relay-02', Application: 'MailClient', Result: 'Failure', Records: 0, Detail: 'IMAP login rejected: cached credential predates the refresh; client retries every 60 seconds' }),
    m03eRow('SystemLog', 'GL4-X-002', day, '10:10:05', { EventType: 'CollectorHeartbeat', Account: 'idp-07', SourceIp: '10.55.1.4', Host: 'idp-07', Result: 'Success', Detail: 'Heartbeat on schedule (60-second interval)' }),
    m03eRow('SystemLog', 'GL4-X-003', day, '10:12:00', { EventType: 'ScheduledProbe', Account: 'svc-probe', SourceIp: '10.55.0.9', Host: 'mon-02', Result: 'Success', ChangeId: 'SCH-052', Detail: 'Availability probe every 5 minutes using a deliberately invalid test credential (failure expected)' }),
    m03eRow('DirectoryAudit', 'GL4-X-004', day, '10:10:40', { EventType: 'PasswordChanged', Account: 'acct-70', SourceIp: '10.55.4.16', Host: 'dc-07', Result: 'Success', InitiatedBy: 'acct-70', TargetGroup: '', Detail: 'Self-service password change' }),
    m03eRow('SystemLog', 'GL4-X-005', day, '10:19:10', { EventType: 'CollectorLag', Account: 'idp-07', SourceIp: '10.55.1.4', Host: 'idp-07', Result: 'Delayed', Detail: 'Branch relay batch ingested 35 seconds late; no events dropped' }),
  );
  const user = (account, department, usual) => ({ Account: account, DisplayName: account, Type: 'User', Department: department, Owner: '—', Privileged: 'No', UsualSourceIp: usual, Notes: '' });
  return m03eBuildDataset({ caseId: scenario.caseId, day, events,
    identities: [user('acct-61', 'Research', '10.55.4.10'), user('acct-62', 'Design', '10.55.4.12'), user('acct-63', 'Operations', '10.55.4.10'), { ...user('acct-67', 'Operations', '203.0.113.177'), Notes: 'Uses the managed mail client' },
      user('acct-68', 'Design', '10.55.4.14'), user('acct-69', 'Research', '10.55.4.15'), user('acct-70', 'Operations', '10.55.4.16'), { ...user('acct-71', 'Branch office', '203.0.113.190'), Notes: 'Works from the branch office NAT' }],
    ips: [
      { SourceIp: '203.0.113.190', Type: 'External', Country: '—', Asn: 'Mission Next branch office NAT', FirstSeen: '2025-03-12 08:00', Reputation: 'Known branch egress' },
      { SourceIp: '192.0.2.144', Type: 'External', Country: '—', Asn: 'Unresolved residential proxy', FirstSeen: `${day} 10:11`, Reputation: 'New to the tenant; current intelligence report requires local corroboration.' },
      { SourceIp: '203.0.113.177', Type: 'External', Country: '—', Asn: 'Mission Next managed mail relay', FirstSeen: '2025-02-03 08:00', Reputation: 'Known managed mail-client egress' },
    ], watchlists: { ChangeTickets: { title: 'Approved change tickets', rows: [{ ChangeId: 'CR-288', Summary: 'Credential refresh (Messaging Operations)', Account: 'acct-67', Window: `${day} 10:10–10:20`, Status: 'Completed' }, { ChangeId: 'SCH-052', Summary: 'Availability probe, every 5 minutes (invalid test credential, failures expected)', Account: 'svc-probe', Window: `${day} Every 5 min`, Status: 'Standing' }] } }, alerts: [],
  });
})();
function moduleFourGuidedLoad(user) {
  moduleFourGuidedUser = user;
  const defaults = {
    assessment: {}, console: {}, caseRecord: { caseId: 'CASE-044478', scenarioId: MODULE_FOUR_GUIDED_FIXTURE.scenario.id, status: 'New', severity: '', affectedUser: '', affectedDevice: '', disposition: '', escalation: '', escalateTo: '', notes: '', findings: {}, submitted: false, actionHistory: [] },
    guideCollapsed: false,
  };
  moduleFourGuidedState = LabRuntime.loadCaseState(MODULE_FOUR_GUIDED_LAB_ID, 'soc-04', user, defaults);
  moduleFourGuidedState.assessment = SocM04AssessmentState.normalize(moduleFourGuidedState, MODULE_FOUR_GUIDED_FIXTURE).assessment;
  if (!Array.isArray(moduleFourGuidedState.assessment.iocs)) moduleFourGuidedState.assessment.iocs = moduleFourGuidedClone(MODULE_FOUR_GUIDED_FIXTURE.scenario.iocs);
  if (!Array.isArray(moduleFourGuidedState.assessment.reports)) moduleFourGuidedState.assessment.reports = moduleFourGuidedClone(MODULE_FOUR_GUIDED_FIXTURE.scenario.reports);
  moduleFourGuidedState.caseRecord = { ...defaults.caseRecord, ...(moduleFourGuidedState.caseRecord || {}) };
  if (moduleFourGuidedState.legacyComplete == null) moduleFourGuidedState.legacyComplete = moduleFourGuidedChecks().every((check) => check[2]);
  if (moduleFourGuidedState.guideStep == null) moduleFourGuidedState.guideStep = 0;
}
function moduleFourGuidedSave() {
  if (moduleFourGuidedUser && moduleFourGuidedState) LabRuntime.saveCaseState(MODULE_FOUR_GUIDED_LAB_ID, 'soc-04', moduleFourGuidedUser, moduleFourGuidedState);
}
function moduleFourGuidedAssessment() { return moduleFourGuidedState.assessment; }
function moduleFourGuidedChecks() {
  const state = m03eState('m04-guided');
  const assessment = moduleFourGuidedState.assessment;
  return [
    ['alert', 'Inspect the generated alert and its affected entities.', state.seen?.some((tag) => tag.startsWith('alert:'))],
    ['query', 'Run a KQL query against the sign-in records.', (state.queryLog || []).length > 0],
    ['rule', 'Save and run a detection rule against this case.', (assessment.rules || []).length > 0 && (assessment.executions || []).length > 0],
    ['ticket', 'Record the investigation in the ITSM case tab.', Boolean(moduleFourGuidedState.caseRecord.actionHistory?.length || moduleFourGuidedState.caseRecord.notes)],
  ];
}
function moduleFourGuidedSteps() {
  return [
    { title: 'Read the ITSM ticket', body: 'Open the ITSM tab and review the fields this investigation needs you to resolve.', lookFor: 'The affected user and device, severity, disposition, escalation, findings, and work notes.', lab: 'Ticket fields: scope and handoff', tab: 'case', target: '.m01-ticket-case' },
    { title: 'Start from the lead', body: 'Treat the alert or seed observation as a lead to test, not a verdict.', lookFor: 'What the initial signal establishes and what it leaves open.', lab: 'Ticket field: Findings', tab: 'search', target: '.m03e-editor-host' },
    { title: 'Correlate the records', body: 'Follow the related records across the console and compare the suspicious activity with its baseline.', lookFor: 'Which source identifies the activity and which records corroborate timing, scope, or context.', lab: 'Ticket fields: Affected User, Affected Device, Findings', tab: 'timeline', target: '.m03e-timeline' },
    { title: 'Separate source from contributing evidence', body: 'A correlated record can strengthen the timeline even when it is not the originating source.', lookFor: 'Whether each record shows where activity began or only confirms that it happened.', lab: 'Ticket field: Findings', tab: 'sources', target: '[data-m03e-select="m04-guided:source:AuthLog"]' },
    { title: 'Judge the reported source', body: 'Open Threat Intelligence and find the indicator for the reported source. Record a verdict, then name the local records that back it.', lookFor: 'Whether the sign-in records for this address match what the report claims. Use Show a hint if you get stuck.', lab: 'Threat Intelligence: Indicator verdicts', tab: 'intelligence', target: '[data-m04-verdict-card="GL4-I-301"]' },
    { title: 'Rule out a benign explanation', body: 'A flagged address is not automatically hostile. Check the change tickets and application records for the address the reputation sweep flagged.', lookFor: 'An approved change or application record that explains the failed sign-ins.', lab: 'Threat Intelligence: Indicator verdicts', tab: 'intelligence', target: '[data-m04-verdict-card="GL4-C-401"]' },
    { title: 'Know when the answer is unknown', body: 'Two feed indicators have nothing in this case to confirm or clear them. When the records are silent, record unknown and say what is missing.', lookFor: 'Whether any record in this case mentions the indicator. No record means no basis for malicious or benign.', lab: 'Threat Intelligence: Indicator verdicts', tab: 'intelligence', target: '[data-m04-verdict-card="GL4-I-302"]' },
    { title: 'Scope and decide', body: 'Choose a severity, disposition, and escalation that match the evidence and confirmed scope.', lookFor: 'The difference between confirmed impact and unresolved questions.', lab: 'Ticket fields: Severity, Disposition, Escalation, Department', tab: 'case', target: '.m01-ticket-grid' },
    { title: 'Write the handoff and submit', body: 'Summarize the evidence, scope, uncertainty, and next action in work notes, then submit the ITSM ticket.', lookFor: 'A concise record another analyst can act on.', lab: 'Ticket field: Work Notes · Submit completes this Guided Lab', tab: 'case', target: '.m01-ticket-notes' },
  ];
}
function moduleFourGuidedDebrief() {
  const cr = moduleFourGuidedState.caseRecord;
  const fields = [['Affected User', cr.affectedUser], ['Affected Device', cr.affectedDevice], ['Severity', cr.severity], ['Disposition', cr.disposition], ['Escalation', cr.escalation], ['Department', cr.escalateTo], ['Findings', Object.keys(cr.findings || {}).length], ['Indicator verdicts', Object.keys(moduleFourGuidedState.assessment?.intelVerdicts || {}).length], ['Work Notes', cr.notes]].map(([name, value]) => ({ name, status: !value ? 'missed' : name === 'Findings' || name === 'Affected Device' ? 'contributing' : 'captured', note: name === 'Indicator verdicts' ? (value ? `${value} indicator verdict(s) recorded in Threat Intelligence. A strong verdict names the records behind it, or says what is missing.` : 'No indicator verdicts were recorded in Threat Intelligence.') : !value ? 'Not recorded in the submitted ticket.' : name === 'Findings' || name === 'Affected Device' ? 'Contributes context to the case timeline.' : 'Recorded in the submitted ticket.' }));
  return guidedLabDebrief({ story: 'The sign-in evidence includes a concentrated burst from the reported source, while the managed mail client and scheduled probe explain separate failures. The submitted scope and tuning decision should distinguish these correlated signals from the primary source evidence.', fields, handoff: 'Include the primary evidence, corroborating records, confirmed scope, unresolved questions, and a proportionate next action.' });
}
function moduleFourGuidedGuide() {
  const item = moduleFourGuidedSteps()[Math.min(moduleFourGuidedState.guideStep, moduleFourGuidedSteps().length - 1)] || {};
  const consoleState = m03eState('m04-guided');
  const tabLabel = item.tab === 'case' ? 'ITSM Ticket' : item.tab || '';
  const moveTab = !moduleFourGuidedState.caseRecord.submitted && item.tab && consoleState.tab !== item.tab;
  return `${guidedLabGuide('m04g', moduleFourGuidedSteps(), { step: moduleFourGuidedState.guideStep, docked: moduleFourGuidedState.caseRecord.submitted ? moduleFourGuidedState.guideCollapsed !== false : (moduleFourGuidedState.guideCollapsed === true || moduleFourGuidedState.guideOpen === false), prefix: 'm04g', submitted: moduleFourGuidedState.caseRecord.submitted, debriefHtml: moduleFourGuidedDebrief() })}
    ${moveTab || moduleFourGuidedState.caseRecord.submitted ? `<div class="m03e-guide-controls" role="status">${moveTab ? `<button type="button" class="m03e-guide-go" data-m04g-guide-tab="${esc(item.tab)}">Go to ${esc(tabLabel)}</button>` : ''}${moduleFourGuidedState.caseRecord.submitted ? '<span>Ticket submitted — practice complete</span>' : ''}</div>` : ''}`;
}
function moduleFourGuidedRestart() {
  const cr = moduleFourGuidedState.caseRecord;
  moduleFourGuidedState.caseRecord = { ...cr, status: 'New', affectedUser: '', affectedDevice: '', severity: '', disposition: '', escalation: '', escalateTo: '', findings: {}, notes: '', submitted: false, submittedAt: '', actionHistory: [] };
  moduleFourGuidedState.assessment.intelVerdicts = {};
  moduleFourGuidedState.assessment.intelHints = {};
  moduleFourGuidedState.guideStep = 0;
  moduleFourGuidedState.guideCollapsed = false;
  moduleFourGuidedState.guideOpen = true;
  moduleFourGuidedSave();
  moduleFourRenderGuided();
}
function moduleFourPositionGuidedGuide(root, host) {
  const tip = root?.querySelector('#m04g-learn-tip');
  const workspace = host?.querySelector('.m03e-workspace');
  if (!tip || !workspace) return;
  if (moduleFourGuidedState.caseRecord.submitted || moduleFourGuidedState.guideCollapsed === true || moduleFourGuidedState.guideOpen === false) {
    host.querySelector('header')?.append(tip);
    consoleGuidePosition(tip, workspace, null);
  } else {
    workspace.prepend(tip);
    consoleGuidePosition(tip, workspace, null);
  }
}
M03E_AFTER_RENDER['m04-guided'] = function () {
  const root = document.getElementById('m04-guided-lab-dynamic');
  const host = document.getElementById('m03e-console-m04-guided');
  if (!root || !host) return;
  if (!root.querySelector('#m04g-learn-tip')) {
    const tpl = document.createElement('template');
    tpl.innerHTML = moduleFourGuidedGuide();
    const fresh = tpl.content.querySelector('#m04g-learn-tip');
    if (fresh) root.prepend(fresh);
  }
  moduleFourPositionGuidedGuide(root, host);
};

const MODULE_FOUR_GUIDED_CONSOLE = SocConsoleTools.mount('m04-guided', {
  data: MODULE_FOUR_GUIDED_CONSOLE_DATA, stateRoot: () => moduleFourGuidedState, save: moduleFourGuidedSave,
  title: 'SIEM & DETECTION ENGINEERING · PRACTICE', ariaLabel: 'Module 04 guided detection console', idPrefix: 'guided',
  packs: [{ id: 'm04', ctx: { guided: true, assessment: moduleFourGuidedAssessment, fixture: MODULE_FOUR_GUIDED_FIXTURE, save: moduleFourGuidedSave, rerender: () => moduleFourRenderGuided(), console: () => m03eState('m04-guided') } }],
    caseView: () => { const html = `<section class="m03e-case-view"><p class="m03e-case-attach">${m03eState('m04-guided').pins.length} pinned evidence record(s) and ${m03eState('m04-guided').queryLog.length} query record(s) are available to cite in this case.</p>${caseRecordPane(moduleFourGuidedState.caseRecord, { caseId: 'CASE-044478', incidentIds: ['INC-044790'], ticketType: 'Detection tuning · SOC Detection Queue', userOptions: [{ id: 'acct-61', text: 'acct-61' }, { id: 'acct-62', text: 'acct-62' }, { id: 'acct-63', text: 'acct-63' }, { id: 'acct-64', text: 'acct-64' }, { id: 'acct-65', text: 'acct-65' }], deviceOptions: [{ id: '192.0.2.144', text: '192.0.2.144 · reported source' }, { id: '203.0.113.177', text: '203.0.113.177 · managed client' }], departmentOptions: [{ id: 'soc-detection-queue', text: 'SOC Detection Queue' }, { id: 'identity-operations', text: 'Identity Operations' }], formId: 'm04-guided-case-form', saveAttr: 'data-m04-guided-case-save', submitAttr: 'data-m04-guided-case-submit', panelId: 'm04-guided-case-status', notesPlaceholder: 'Record the alert, query and rule evidence, tuning decision, and safe follow-up.' })}</section>`; return moduleFourGuidedState.caseRecord.submitted ? html.replace('Submitted for faculty review', 'Practice submitted').replace('Lab Under Review', 'Practice submitted') + '<button type="button" class="m01-reset" data-m04-guided-restart>Restart Guided Lab</button>' : html; },
});


function moduleFourAssessmentLabPanel() {
  return `<div class="m03e-panel" id="m04-prove-panel">
    <div class="m03e-brief"><p class="m03e-label">${caseRecordBriefLabel(moduleFourCaseSpec(), 'NORMAL SHIFT')}</p><p>Threat Desk has sent a new intelligence report. Your lead’s request: <em>“Decide what this report means for us, turn it into a detection that works on our telemetry, and put what you did and why in the ticket.”</em> Evaluate the report and its indicators, record a verdict and your reasoning for each indicator under review, test a query in Log Search, save it as an analytics rule, run and schedule it, review what it raises, choose only safe automation, and complete the ITSM ticket.</p></div>
    <div class="m03e-console-host" id="m03e-console-m04">${moduleThreeConsoleHtml('m04')}</div>
  </div>`;
}

function moduleFourAdditionalLabs() {
  return missionNextOptionalLabsSection(4, [
    { title: 'DHCP Log Analysis — Rogue DHCP Server Detection', detail: 'Network telemetry and automated detection', href: 'imported-labs/mission-next-labs/index.html#/track/splunk/module/dhcp-log-analysis', labId: 'additional-1', requireNote: true },
    { title: 'Active Directory Health Checks using Nagios', detail: 'Supplementary AD monitoring practice', href: 'imported-labs/mission-next-labs/index.html#/track/active-directory/project/ad-4/lab', labId: 'additional-2', requireNote: true },
    { title: 'Active Directory Monitoring and Alerting with Prometheus', detail: 'Supplementary AD monitoring practice', href: 'imported-labs/mission-next-labs/index.html#/track/active-directory/project/ad-6/lab', labId: 'additional-3', requireNote: true },
  ], moduleFourState.labProgress);
}


function viewModuleFour(user, program) {
  moduleFourLoad(user);
  moduleFourGuidedLoad(user);
  const complete = moduleFourState.completed === true;
  const module = program.modules['soc-04'];
  const sections = moduleFourGetSections();
  const lectureOpen = moduleFourReviewMode || !sections[0].isComplete || moduleFourState.learnItStep < LearnItDecks['soc-04'].length;
  const guidedLabOpen = moduleFourReviewMode || !sections[1].isComplete;
  const assessmentLabOpen = moduleFourReviewMode || !sections[2].isComplete;
  const reviewOpen = moduleFourReviewMode;
  const quickNavItems = moduleFourGetQuickNavItems();

  const lectureSection = `
    <details class="m04-section-collapsible mf-section" ${lectureOpen ? 'open' : ''}>
      <summary class="m04-section-summary">
        <section class="m04-section" id="m04-lecture" aria-labelledby="m04-lecture-title">
          <div class="m04-section-heading mf-section-heading"><span class="mf-section-badge">1</span><div><p class="m04-kicker mf-kicker">Core concepts and practice</p><h2 id="m04-lecture-title">Detection rule tuning, enrichment, and automation</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div>
        </section>
      </summary>
      <section class="m04-section m04-section-body mf-section-body" aria-labelledby="m04-lecture-title">
        ${moduleFourLearnIt()}
        <details class="m04-deep-dive mf-deep-dive"><summary>Deep Dive · lesson loops and detection reference</summary>
        ${moduleFourVideoScript()}
        ${moduleFourLecture()}
        <div class="m04-guide-grid">
          <article><i class="ri-scan-2-line" aria-hidden="true"></i><h3>Coverage</h3><p>A rule should express the behavior you intend to see. Distributed activity can disappear when the wrong entity forms the group.</p></article>
          <article><i class="ri-sound-module-line" aria-hidden="true"></i><h3>Fidelity</h3><p>Test changes against suspicious and benign examples. A quieter rule is only better if it keeps the intended signal.</p></article>
          <article><i class="ri-shield-check-line" aria-hidden="true"></i><h3>Automation boundary</h3><p>Automate repeatable collection and routing. Keep disruptive steps behind approval until confidence and scope justify them.</p></article>
        </div>
        </details>
      </section>
    </details>`;

  const guidedLabSection = `
    <details class="m04-section-collapsible mf-section mf-lab-section" ${guidedLabOpen ? 'open' : ''}>
      <summary class="m04-section-summary">
        <section class="m04-section m04-lab-section" id="m04-guided-lab" aria-labelledby="m04-guided-lab-title">
          <div class="m04-section-heading mf-section-heading"><span class="mf-section-badge">2</span><div><p class="m04-kicker mf-kicker">Practice It · Guided Lab</p><h2 id="m04-guided-lab-title">Detection rule studio: tune, test, and enrich</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div>
        </section>
      </summary>
      <section class="m04-section m04-section-body mf-section-body m04-lab-section" aria-labelledby="m04-guided-lab-title">
        <div class="m04-signposts" aria-label="Assisted lab signposts"><div><span>A</span>Inspect either source first</div><div><span>B</span>Test and enrich</div><div><span>C</span>Choose bounded action</div><div><span>D</span>Explain the package</div></div>
        <div class="m04-boundary"><i class="ri-shield-check-line" aria-hidden="true"></i><p><strong>Lab boundary:</strong> This isolated surface contains one fictional rule, one authentication slice, and one intelligence snapshot. No other course environment or future-module evidence is reachable here.</p></div>
        ${moduleFourGroupingCompare()}
        <div id="m04-guided-lab-dynamic">${moduleFourGuidedLabPanel()}</div>
      </section>
    </details>`;

  const assessmentLabSection = `
    <details class="m04-section-collapsible mf-section" ${assessmentLabOpen ? 'open' : ''}>
      <summary class="m04-section-summary">
        <section class="m04-section m04-lab-section" id="m04-assessment-lab" aria-labelledby="m04-assessment-lab-title">
          <div class="m04-section-heading mf-section-heading"><span class="mf-section-badge">3</span><div><p class="m04-kicker mf-kicker">Prove It · Assessment Lab</p><h2 id="m04-assessment-lab-title">Detection package: score and submit</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div>
        </section>
      </summary>
      <section class="m04-section m04-section-body mf-section-body m04-lab-section" aria-labelledby="m04-assessment-lab-title">
        <div id="m04-assessment-lab-dynamic">${moduleFourAssessmentLabPanel()}</div>
      </section>
    </details>`;

  const reviewSection = `
    <details class="m04-section-collapsible mf-section" ${reviewOpen ? 'open' : ''}>
      <summary class="m04-section-summary">
        <section class="m04-section" id="m04-review" aria-labelledby="m04-review-title">
          <div class="m04-section-heading mf-section-heading"><span class="mf-section-badge">5</span><div><p class="m04-kicker mf-kicker">Concept recap</p><h2 id="m04-review-title">Module review and takeaways</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div>
        </section>
      </summary>
      <section class="m04-section m04-section-body mf-section-body" aria-labelledby="m04-review-title">${moduleFourReview()}</section>
    </details>`;

  const sourcesSection = `
    <details class="m04-section-collapsible mf-section mf-section-supplemental" ${moduleFourReviewMode ? 'open' : ''}>
      <summary class="m04-section-summary">
        <section class="m04-section" id="m04-sources" aria-labelledby="m04-sources-title">
          <div class="m04-section-heading mf-section-heading"><span class="mf-section-badge"><i class="ri-book-open-line" aria-hidden="true"></i></span><div><p class="m04-kicker mf-kicker">Supporting resources</p><h2 id="m04-sources-title">Further reading on detection and automation</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div>
        </section>
      </summary>
      <section class="m04-section m04-section-body mf-section-body" id="m04-sources-section" aria-labelledby="m04-sources-title">${moduleSourcesBlock(MODULE_FOUR_SOURCES)}</section>
    </details>`;

  return `<div class="m04-shell">
    ${moduleTopbar(user, program)}
    <div class="mquick-nav-layout">
      ${moduleProgressShell(sections, { reviewMode: moduleFourReviewMode })}
      <main class="m04-main mf-frame">
      <section class="m04-hero mf-hero" aria-labelledby="m04-title">
        <div><p class="m04-kicker mf-kicker">Module 04 · ${formatHandsOnDuration(module.durationMinutes)} · assisted workflow</p><h1 id="m04-title">${esc(module.title)}</h1><p class="mf-lede">Review and tune a noisy authentication rule, add relevant threat intelligence, and choose bounded automated monitoring that moves the alert forward without outrunning the evidence.</p></div>
        <dl class="m04-status mf-stats" aria-label="Saved lab status"><div><dt>Guided Lab</dt><dd>${moduleFourGuidedState.caseRecord.submitted || moduleFourGuidedState.legacyComplete ? 'Complete' : moduleFourGuidedState.caseRecord.actionHistory.length ? 'In progress' : 'Not started'}</dd></div><div><dt>Assessment Lab</dt><dd id="m04-status">${complete ? 'Complete' : moduleFourState.attempts ? 'In progress' : 'Not started'}</dd></div></dl>
      </section>

      <section class="m04-objective" aria-labelledby="m04-objective-title"><span><i class="ri-focus-2-line" aria-hidden="true"></i></span><div><p class="m04-kicker">One measurable objective</p><h2 id="m04-objective-title">Tune a detection to catch one distributed password spray while excluding one benign retry pattern, then justify enrichment and bounded automation with at least ${MODULE_FOUR_PASSING_SCORE}/100.</h2></div></section>

      ${lectureSection}
      ${guidedLabSection}
      ${assessmentLabSection}
      <div id="m04-additional-labs-dynamic">${moduleFourAdditionalLabs()}</div>
      ${reviewSection}
      ${sourcesSection}
    </main>
    </div>
  </div>`;
}

function moduleFourRenderQuiz(focusId) {
  const root = document.getElementById('m04-quiz-dynamic');
  if (!root) return;
  root.innerHTML = moduleFourQuizPanel();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function wireModuleFourQuiz() {
  const quizForm = document.getElementById('m04-quiz-form');
  if (!quizForm) return;

  quizForm.addEventListener('change', (event) => {
    const input = event.target;
    if (input.matches('[data-m04-quiz-answer]')) {
      const radioGroup = input.getAttribute('name');
      const questionId = radioGroup.replace('q-', '');
      moduleFourQuizState.answers[questionId] = input.value;
    }
  });

  quizForm.addEventListener('submit', (event) => {
    event.preventDefault();

    // Score the quiz
    const result = scoreQuizAttempt(
      moduleFourQuizState.selectedQuestions,
      moduleFourQuizState.questionsByAnswer,
      moduleFourQuizState.answers
    );

    moduleFourQuizState.attempts += 1;
    moduleFourQuizState.score = result.score;
    moduleFourQuizState.bestScore = Math.max(moduleFourQuizState.bestScore || 0, result.score);
    moduleFourQuizState.feedback = result.feedback;
    moduleFourQuizState.scored = true;
    moduleFourQuizState.passed = result.score >= 70;

    // On failure, remember this attempt's question ids so "Try different
    // questions" can steer clear of them — but keep this attempt's scored
    // results on screen until the student chooses to retry.
    if (!moduleFourQuizState.passed) {
      moduleFourState.lastQuizQuestionIds = moduleFourQuizState.selectedQuestions.map((s) => s.question.id);
    }

    moduleFourSave();
    moduleFourRenderQuiz('m04-quiz-feedback');
  });

  quizForm.addEventListener('click', (event) => {
    if (event.target.closest('[data-m04-quiz-retake]')) {
      event.preventDefault();
      moduleFourQuizForceRetake = true;
      moduleFourRenderQuiz('m04-quiz-title');
      // The container re-render replaced the form element; wire the new one.
      wireModuleFourQuiz();
      return;
    }
    if (!event.target.closest('[data-m04-quiz-retry]')) return;
    const previousQuestionIds = moduleFourState.lastQuizQuestionIds || [];
    Object.assign(moduleFourQuizState, resetQuizAttempt(moduleFourQuizState, MODULE_FOUR_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true, preserveScoredResult: true }));
    moduleFourRenderQuiz('m04-quiz-title');
  });
}

function moduleFourRenderGuided(focusId) {
  const root = document.getElementById('m04-guided-lab-dynamic');
  if (!root) return;
  root.innerHTML = moduleFourGuidedLabPanel();
  const consoleHost = root.querySelector('#m03e-console-m04-guided');
  if (consoleHost) { MODULE_FOUR_GUIDED_CONSOLE.wire(consoleHost); m03eAttachEditor('m04-guided'); }
  moduleFourPositionGuidedGuide(root, consoleHost);
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function moduleFourRenderAssessment(focusId) {
  const root = document.getElementById('m04-assessment-lab-dynamic');
  if (!root) return;
  root.innerHTML = moduleFourAssessmentLabPanel();
  m03eAttachEditor('m04');
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function moduleFourOpenStation(station) {
  moduleFourState.activeStation = station;
  if (!moduleFourState.reviewedStations.includes(station)) moduleFourState.reviewedStations.push(station);
  moduleFourSave();
  moduleFourRenderGuided(station === 'rule' ? 'm04-rule-title' : 'm04-intel-title');
}

function wireModuleFourGuidedLab() {
  const root = document.getElementById('m04-guided-lab-dynamic');
  if (!root || !moduleFourGuidedState) return;
  const consoleHost = root.querySelector('#m03e-console-m04-guided');
  if (consoleHost) { MODULE_FOUR_GUIDED_CONSOLE.wire(consoleHost); m03eAttachEditor('m04-guided'); }
  moduleFourPositionGuidedGuide(root, consoleHost);
  root.addEventListener('input', (event) => {
    if (event.target.matches('#guided-m04-guided-case-form [name="notes"]')) moduleFourGuidedState.caseRecord.notes = event.target.value;
  });
  root.addEventListener('change', (event) => {
    const field = event.target.closest('#guided-m04-guided-case-form [name]');
    if (!field) return;
    if (field.name.startsWith('finding:')) moduleFourGuidedState.caseRecord.findings[field.name.slice(8)] = field.value;
    else moduleFourGuidedState.caseRecord[field.name] = field.value;
    moduleFourGuidedSave();
  });
  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-m04-guided-restart]')) { event.preventDefault(); moduleFourGuidedRestart(); return; }
    if (event.target.closest('[data-m04g-guide-next]')) { event.preventDefault(); if (moduleFourGuidedState.caseRecord.submitted) { moduleFourGuidedRestart(); return; } moduleFourGuidedState.guideStep = (moduleFourGuidedState.guideStep + 1) % moduleFourGuidedSteps().length; { const nextTab = moduleFourGuidedSteps()[moduleFourGuidedState.guideStep]?.tab; if (nextTab) { m03eState('m04-guided').tab = nextTab; m03eSave('m04-guided'); } } moduleFourGuidedSave(); moduleFourRenderGuided(); return; }
    if (event.target.closest('[data-m04g-guide-tab]')) { event.preventDefault(); const tab = event.target.closest('[data-m04g-guide-tab]').dataset.m04gGuideTab; m03eState('m04-guided').tab = tab; m03eSave('m04-guided'); m03eRender('m04-guided'); return; }
    if (event.target.closest('[data-m04g-guide-collapse]')) { event.preventDefault(); moduleFourGuidedState.guideCollapsed = !moduleFourGuidedState.guideCollapsed; moduleFourGuidedSave(); moduleFourRenderGuided(); return; }
    if (event.target.closest('[data-m04-guided-case-submit]')) { event.preventDefault(); if (!moduleFourGuidedState.caseRecord.submitted) { moduleFourGuidedState.caseRecord.submitted = true; moduleFourGuidedState.guideCollapsed = true; moduleFourGuidedState.caseRecord.submittedAt = new Date().toISOString(); moduleFourGuidedState.caseRecord.actionHistory.push({ action: 'Submitted practice ticket', at: moduleFourGuidedState.caseRecord.submittedAt }); moduleFourGuidedSave(); moduleFourRenderGuided(); } return; }
    if (event.target.closest('[data-m04-guided-case-save]')) {
      event.preventDefault();
      moduleFourGuidedState.caseRecord.actionHistory.push({ action: 'Ticket updated', at: new Date().toISOString() });
      moduleFourGuidedSave(); m03eRender('m04-guided'); return;
    }

  });
  return;

  root.addEventListener('click', (event) => {
    const stationButton = event.target.closest('[data-m04-station]');
    if (stationButton) {
      moduleFourOpenStation(stationButton.dataset.m04Station);
      return;
    }

    if (event.target.closest('[data-m04-run-rule]')) {
      const results = moduleFourEvaluateRule();
      moduleFourState.ruleRuns += 1;
      moduleFourState.ruleRunResults = results;
      moduleFourState.rulePassed = moduleFourState.ruleGrouping === 'source-ip'
        && moduleFourState.ruleMetric === 'distinct-accounts'
        && moduleFourState.ruleThreshold === '4'
        && results.length === 1
        && results[0].ip === '198.51.100.44';
      moduleFourState.validationError = '';
      moduleFourSave();
      moduleFourRenderGuided('m04-rule-result');
      moduleFourRenderAssessment();
      return;
    }

    const enrichButton = event.target.closest('[data-m04-enrich]');
    if (enrichButton) {
      const id = enrichButton.dataset.m04Enrich;
      moduleFourState.enrichedIndicator = id;
      if (!moduleFourState.selectedEvidence.includes(id)) moduleFourState.selectedEvidence.push(id);
      moduleFourState.validationError = '';
      moduleFourSave();
      moduleFourRenderGuided('m04-intel-title');
      moduleFourRenderAssessment();
    }
  });

  root.addEventListener('change', (event) => {
    const input = event.target;
    if (input.matches('[data-m04-evidence]')) {
      const next = new Set(moduleFourState.selectedEvidence);
      if (input.checked) next.add(input.value); else next.delete(input.value);
      moduleFourState.selectedEvidence = [...next];
      const clearedEnrichment = !input.checked && moduleFourState.enrichedIndicator === input.value;
      if (clearedEnrichment) moduleFourState.enrichedIndicator = '';
      moduleFourState.validationError = '';
      moduleFourSave();
      if (clearedEnrichment) {
        moduleFourRenderGuided('m04-intel-title');
        moduleFourRenderAssessment();
        return;
      }
      root.querySelectorAll('[data-m04-selected-count]').forEach((node) => { node.textContent = String(moduleFourState.selectedEvidence.length); });
      input.closest('.m04-event')?.classList.toggle('is-selected', input.checked);
      return;
    }
    if (input.matches('[data-m04-rule-control]')) {
      moduleFourState[input.name] = input.value;
      moduleFourState.rulePassed = false;
      moduleFourState.ruleRunResults = [];
      moduleFourState.validationError = '';
      moduleFourSave();
      moduleFourRenderGuided(input.id);
    }
  });

  root.addEventListener('toggle', (event) => {
    const hint = event.target.closest('[data-m04-hint]');
    if (!hint || !hint.open) return;
    const id = hint.dataset.m04Hint;
    if (!moduleFourState.hintsOpened.includes(id)) {
      moduleFourState.hintsOpened.push(id);
      moduleFourSave();
    }
  }, true);
}

function wireModuleFourAssessmentLab() {
  const root = document.getElementById('m04-assessment-lab-dynamic');
  if (!root || !moduleFourState) return;
  MODULE_FOUR_CONSOLE.wire(root);

  root.addEventListener('change', (event) => {
    const input = event.target;
    if (input.closest('#m04-assessment') && caseRecordApply(moduleFourState.caseRecord, input.name, input.value)) {
      moduleFourState.caseRecord.actionHistory.push({ action: `Updated ${input.name}`, at: new Date().toISOString() });
      moduleFourSave();
      // Re-render so the conditional ticket fields and missing list stay honest.
      moduleFourRenderAssessment();
    }
  });

  root.addEventListener('input', (event) => {
    if (event.target.name === 'notes' && event.target.closest('#m04-assessment')) {
      caseRecordApply(moduleFourState.caseRecord, 'notes', event.target.value);
      moduleFourSave();
    }
  });

  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-m04-run-automation]')) {
      const choice = (moduleFourState.caseRecord.findings || {}).automationChoice;
      if (!choice || moduleFourState.caseRecord.submitted) return;
      moduleFourState.automationRan = true;
      if (choice === 'enrich-escalate') {
        moduleFourState.automationLog = ['Attached the selected indicator and confidence context.', 'Preserved six authentication-event references.', 'Created a High-priority Tier 2 review task.', 'Left session revocation and account action pending human approval.'];
      } else if (choice === 'auto-disable') {
        moduleFourState.automationLog = ['Simulated bulk account disable request.', 'Safety gate recorded: broad disruptive action requires analyst approval.', 'No account state was changed in this local lab.'];
      } else {
        moduleFourState.automationLog = ['Recorded the selected indicator.', 'Simulated alert closure request.', 'Safety gate recorded: successful access remains unresolved; no closure was applied.'];
      }
      moduleFourSave();
      moduleFourRenderAssessment('m04-automation-log');
      return;
    }

    if (event.target.closest('[data-m04-save-case]')) {
      moduleFourState.caseRecord.actionHistory.push({ action: 'Saved case', at: new Date().toISOString() });
      moduleFourSave();
      moduleFourRenderAssessment();
      return;
    }

    if (event.target.closest('[data-m04-submit-case]')) {
      if (moduleFourState.caseRecord.submitted) return;
      const spec = moduleFourCaseSpec();
      const missing = caseRecordMissing(moduleFourState.caseRecord, spec);
      if (missing.length) {
        moduleFourProveItShowMissing = true;
        moduleFourSave();
        moduleFourRenderAssessment('m04-case-panel');
        return;
      }
      moduleFourProveItShowMissing = false;
      const result = SocM04AssessmentScorer.score(moduleFourState, SocM04AssessmentData);
      const submittedAt = new Date().toISOString();
      moduleFourState.caseRecord.caseId = MODULE_FOUR_CASE_ID;
      moduleFourState.caseRecord.scenarioId = SocM04AssessmentData.scenario.id;
      moduleFourState.caseRecord.submitted = true;
      moduleFourState.caseRecord.submittedAt = submittedAt;
      moduleFourState.caseRecord.score = result.score;
      moduleFourState.caseRecord.reviewPayload = {
        ...JSON.parse(JSON.stringify(result)),
        caseId: MODULE_FOUR_CASE_ID,
        scenarioId: SocM04AssessmentData.scenario.id,
      };
      moduleFourState.caseRecord.actionHistory.push({ action: 'Submitted case for faculty review', at: submittedAt });
      moduleFourState.attempts = (moduleFourState.attempts || 0) + 1;
      moduleFourState.score = result.score;
      moduleFourState.bestScore = Math.max(moduleFourState.bestScore || 0, result.score);
      moduleFourState.breakdown = result.criteria.map((criterion) => ({ id: criterion.id, score: criterion.points, max: criterion.max }));
      moduleFourState.feedback = result.review.feedback.slice();
      moduleFourState.lastSubmittedAt = submittedAt;
      // Submitted = complete pending faculty review (Module 01 model); the
      // 70% bar is applied by instructor review, not by locking the student out.
      moduleFourState.completed = true;
      if (moduleFourState.completed && !moduleFourState.flags.includes(MODULE_FOUR_FLAG)) moduleFourState.flags.push(MODULE_FOUR_FLAG);
      moduleFourSave();
      if (moduleFourUser) {
        moduleFourUser.latestLabAttemptByKey = { ...(moduleFourUser.latestLabAttemptByKey || {}), [MODULE_FOUR_CATALOG_LAB_KEY]: { completedAt: submittedAt, reviewedAt: null, redoRequested: false } };
      }
      if (typeof recordLabAttempt === 'function') {
        recordLabAttempt(moduleFourUser, MODULE_FOUR_CATALOG_LAB_KEY, {
          state: 'complete',
          score: result.score,
          result: {
            rubric_version: result.rubricVersion,
            breakdown: result.criteria,
            feedback: result.review.feedback,
            review_payload: moduleFourState.caseRecord.reviewPayload,
            critical_errors: result.criticalMisses,
            case_record: moduleFourState.caseRecord,
            case_display: caseRecordDisplay(moduleFourState.caseRecord, spec),
            case_summary: caseRecordSummary(moduleFourState.caseRecord, spec),
            attempts: moduleFourState.attempts,
          },
        }).then((saved) => { if (saved && moduleFourProveItRedoRequested()) delete moduleFourUser.openLabRedosByModuleKey['soc-04']; });
      }
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleFourUser, 'soc-analyst', 'soc-04', MODULE_FOUR_CATALOG_LAB_KEY);
      const status = document.getElementById('m04-status');
      if (status) status.textContent = moduleFourState.completed ? 'Complete' : 'In progress';
      moduleFourRenderAssessment('m04-case-panel');
      return;
    }

    if (event.target.closest('[data-m04-reset]')) {
      if (moduleFourState.caseRecord.submitted) return;
      if (!window.confirm('Reset only the Module 04 detection lab? Course progress and other labs will not be changed.')) return;
      moduleFourState = SocM04AssessmentState.reset(moduleFourUser, MODULE_FOUR_DEFAULT_STATE, SocM04AssessmentData);
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleFourUser, 'soc-analyst', 'soc-04', MODULE_FOUR_CATALOG_LAB_KEY, false);
      const status = document.getElementById('m04-status');
      if (status) status.textContent = 'Not started';
      moduleFourRenderGuided('m04-choose-title');
      moduleFourRenderAssessment();
    }
  });

  root.addEventListener('submit', (event) => {
    // The ITSM Incident Ticket form (caseRecordPane) has no native submit
    // path of its own — Submit Lab is a type="button" handled above — but
    // guard here too in case a future markup change adds one.
    if (event.target.id === 'm04-assessment') event.preventDefault();
  });
}

function wireModuleFourLessons() {
  const root = document.getElementById('m04-lessons');
  if (!root) return;
  root.addEventListener('change', (event) => {
    const input = event.target.closest('[data-m04-lesson-answer]');
    if (!input) return;
    const work = moduleFourState.lessonWork[input.dataset.lessonId] ||= { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
    work.answers[input.dataset.questionIndex] = Number(input.value);
    moduleFourSave();
  });
  root.addEventListener('input', (event) => {
    const field = event.target.closest('[data-m04-lesson-task]');
    if (!field) return;
    const work = moduleFourState.lessonWork[field.dataset.m04LessonTask] ||= { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
    work.task = field.value;
    moduleFourSave();
  });
  root.addEventListener('click', (event) => {
    const check = event.target.closest('[data-m04-lesson-check]');
    if (check) {
      const lesson = MODULE_FOUR_LESSON_LOOPS.find((item) => item.id === check.dataset.m04LessonCheck);
      const work = moduleFourState.lessonWork[lesson.id] ||= { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
      if (lesson.questions.some((question, index) => work.answers?.[index] === undefined)) work.feedback = [`Answer all ${lesson.questions.length} questions before checking this lesson.`];
      else {
        const correct = lesson.questions.filter((question, index) => work.answers[index] === question.correct).length;
        work.checked = correct === lesson.questions.length;
        work.feedback = lesson.questions.map((question, index) => `Q${index + 1}: ${work.answers[index] === question.correct ? question.feedbackCorrect : question.feedbackIncorrect}`);
      }
      moduleFourSave();
      check.closest('details').outerHTML = moduleFourLessonLoop(lesson, MODULE_FOUR_LESSON_LOOPS.indexOf(lesson));
      return;
    }
    const button = event.target.closest('[data-m04-lesson-task-submit]');
    if (!button) return;
    const lesson = MODULE_FOUR_LESSON_LOOPS.find((item) => item.id === button.dataset.m04LessonTask);
    const work = moduleFourState.lessonWork[lesson.id] ||= { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
    work.taskComplete = work.checked && (work.task || '').trim().length >= 20;
    work.feedback = work.taskComplete ? ['Applied task saved.'] : ['Complete the knowledge check and write at least 20 characters before saving the task.'];
    moduleFourSave();
    button.closest('details').outerHTML = moduleFourLessonLoop(lesson, MODULE_FOUR_LESSON_LOOPS.indexOf(lesson));
  });
}

function wireModuleFour() {
  const reviewToggle = document.querySelector('[data-mnav-review-toggle]');
  wireReviewToggle({ button: reviewToggle, sectionSelector: '.m04-section-collapsible', getReviewMode: () => moduleFourReviewMode, setReviewMode: (value) => { moduleFourReviewMode = value; }, enabledLabel: 'Exit Review', disabledLabel: 'Review Module', enabledIcon: 'ri-eye-off-line', disabledIcon: 'ri-eye-line' });

  const learnRoot = document.querySelector('.m04-shell');
  if (learnRoot) window.LearnItCards?.wire(learnRoot, { prefix: 'm04', onStep: (step) => { moduleFourState.learnItStep = step; moduleFourLearnView = null; moduleFourSave(); const deck = document.getElementById('m04-learn-it'); if (deck) deck.outerHTML = moduleFourLearnIt(); }, onView: (index) => { moduleFourLearnView = index; const deck = document.getElementById('m04-learn-it'); if (deck) deck.outerHTML = moduleFourLearnIt(); } });
  wireModuleFourQuiz();
  wireModuleFourLessons();
  wireModuleFourGuidedLab();
  wireModuleFourAssessmentLab();
  wireModuleFourAdditionalLabsGating(document.getElementById('m04-additional-labs-dynamic'));
}

function wireModuleFourAdditionalLabsGating(root) {
  if (!root || !moduleFourState) return;
  wireMissionNextLabGating(root, moduleFourState.labProgress, () => {
    moduleFourSave();
    root.innerHTML = moduleFourAdditionalLabs();
    wireModuleFourAdditionalLabsGating(root);
  });
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 4, moduleKey: 'soc-04',
  view: viewModuleFour, wire: wireModuleFour, sections: moduleFourGetSections });
