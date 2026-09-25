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
  independentLab: { answers: {}, notes: '', attempts: 0, score: 0, completed: false, feedback: [] },
  labProgress: {},
  // Standard Incident / Case Record for the m04-assessment Prove It
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

const MODULE_FOUR_INDEPENDENT_LAB = {
  title: 'Independent lab: fake-verification loader alert', caseId: 'INC-4404',
  scenario: 'Mission Next Labs receives a medium-confidence alert for ws-244 after acct-244 opened a fake verification page. A child process launched a script interpreter, then a browser credential store was read. A signed updater event and a help-desk test are nearby distractors. Decide what the evidence supports and how to tune the follow-up.',
  questions: [
    { id: 'signal', label: 'Which combination is the strongest detection signal?', options: [{ id: 'chain', text: 'Fake-verification page → script interpreter child process → browser credential-store read on ws-244' }, { id: 'signed', text: 'The signed updater alone proves the workstation is clean' }, { id: 'severity', text: 'Medium severity means no further review is needed' }], correct: 'chain' },
    { id: 'scope', label: 'What scope is supportable now?', options: [{ id: 'bounded', text: 'acct-244 and ws-244; broader credential exposure remains unconfirmed' }, { id: 'tenant', text: 'Every Mission Next Labs endpoint is compromised' }, { id: 'none', text: 'No scope can be recorded until malware is reverse engineered' }], correct: 'bounded' },
    { id: 'next', label: 'What is the BEST first automation decision?', options: [{ id: 'preserve', text: 'Preserve process/browser evidence, open a scoped investigation, and require approval before credential/session disruption' }, { id: 'wipe', text: 'Wipe every endpoint that visited the page' }, { id: 'close', text: 'Close because a signed updater also ran' }], correct: 'preserve' },
  ],
};

const MODULE_FOUR_AUTH_EVENTS = [
  { id: 'AE-401', time: '09:01', outcome: 'Success', account: 'acct-06', ip: '10.44.3.18', device: 'Managed', region: 'East office', detail: 'Normal interactive sign-in from the account’s assigned workstation.' },
  { id: 'AE-402', time: '09:02', outcome: 'Failed', account: 'acct-17', ip: '203.0.113.77', device: 'Managed', region: 'West office', detail: 'Stored credential rejected after the account’s approved password rotation.' },
  { id: 'AE-403', time: '09:03', outcome: 'Failed', account: 'acct-21', ip: '198.51.100.44', device: 'Unknown', region: 'Unresolved', detail: 'First failure from an unrecognized source and device.' , relevant: true },
  { id: 'AE-404', time: '09:04', outcome: 'Failed', account: 'acct-17', ip: '203.0.113.77', device: 'Managed', region: 'West office', detail: 'The same managed mail client retried its stored credential.' },
  { id: 'AE-405', time: '09:05', outcome: 'Failed', account: 'acct-22', ip: '198.51.100.44', device: 'Unknown', region: 'Unresolved', detail: 'A second anonymous account received one password attempt.', relevant: true },
  { id: 'AE-406', time: '09:06', outcome: 'Failed', account: 'acct-17', ip: '203.0.113.77', device: 'Managed', region: 'West office', detail: 'Repeated stale-client retry on the same account and managed device.' },
  { id: 'AE-407', time: '09:07', outcome: 'Failed', account: 'acct-23', ip: '198.51.100.44', device: 'Unknown', region: 'Unresolved', detail: 'A third account received one password attempt from the same source.', relevant: true },
  { id: 'AE-408', time: '09:08', outcome: 'Failed', account: 'acct-17', ip: '203.0.113.77', device: 'Managed', region: 'West office', detail: 'Fourth retry from the registered client; no other accounts were targeted.' },
  { id: 'AE-409', time: '09:09', outcome: 'Failed', account: 'acct-24', ip: '198.51.100.44', device: 'Unknown', region: 'Unresolved', detail: 'A fourth account received one attempt from the unrecognized source.', relevant: true },
  { id: 'AE-410', time: '09:10', outcome: 'Failed', account: 'acct-17', ip: '203.0.113.77', device: 'Managed', region: 'West office', detail: 'Fifth retry from the known client before its credential cache refreshed.' },
  { id: 'AE-411', time: '09:11', outcome: 'Failed', account: 'acct-25', ip: '198.51.100.44', device: 'Unknown', region: 'Unresolved', detail: 'A fifth distinct account received one attempt from the same source.', relevant: true },
  { id: 'AE-412', time: '09:12', outcome: 'Success', account: 'acct-24', ip: '198.51.100.44', device: 'Unknown', region: 'Unresolved', detail: 'One targeted account authenticated successfully after the distributed failures.', relevant: true },
  { id: 'AE-413', time: '09:13', outcome: 'Success', account: 'acct-17', ip: '203.0.113.77', device: 'Managed', region: 'West office', detail: 'The registered client succeeded after receiving the updated credential.' },
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

// Standard Incident / Case Record (docs/specs/MODULE_STANDARD.md §7.2) for the Prove It
// submission — `m04-assessment`, the only form here that calls
// recordLabAttempt() for MODULE_FOUR_CATALOG_LAB_KEY. The independent lab
// (m04-independent-form) is Practice It — locally scored, no catalog
// attempt — and is out of scope for this migration.
const MODULE_FOUR_CASE_ID = 'DET-4415';
const MODULE_FOUR_DEPARTMENT_BOUNCE_THRESHOLD = 40;

// Confirmed entity = acct-24 (targeted by the spray and the one account that
// authenticated afterward). Pivots = the other four sprayed accounts —
// plausible but not the confirmed principal. Noise = accounts untouched by
// the 198.51.100.44 cluster, pulled from the same event/intel volume as
// Module 01's entityRoster distractors are.
const MODULE_FOUR_ENTITY_ROSTER = {
  users: [
    { id: 'acct-24', text: 'acct-24', tier: 'principal' },
    { id: 'acct-21', text: 'acct-21', tier: 'pivot' },
    { id: 'acct-22', text: 'acct-22', tier: 'pivot' },
    { id: 'acct-23', text: 'acct-23', tier: 'pivot' },
    { id: 'acct-25', text: 'acct-25', tier: 'pivot' },
    { id: 'acct-06', text: 'acct-06', tier: 'noise' },
    { id: 'acct-17', text: 'acct-17', tier: 'noise' },
    { id: 'acct-08', text: 'acct-08', tier: 'noise' },
  ],
  devices: [
    { id: '198.51.100.44', text: '198.51.100.44 (unresolved source)', tier: 'principal' },
    { id: '203.0.113.77', text: '203.0.113.77 (managed mail client)', tier: 'pivot' },
    { id: '10.44.3.18', text: '10.44.3.18 (East office managed)', tier: 'noise' },
    { id: '10.44.3.22', text: '10.44.3.22 (East office managed)', tier: 'noise' },
    { id: '192.0.2.91', text: '192.0.2.91 (unrelated phishing cluster)', tier: 'noise' },
    { id: '203.0.113.155', text: '203.0.113.155 (expired malware-staging IP)', tier: 'noise' },
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
    userOptions: MODULE_FOUR_ENTITY_ROSTER.users,
    deviceOptions: MODULE_FOUR_ENTITY_ROSTER.devices,
    departmentOptions: MODULE_FOUR_DEPARTMENT_OPTIONS,
    notesMin: 100,
    notesPlaceholder: 'The original rule missed… I tuned it to… Authentication and intelligence show… Recommend…',
    findings: [
      { name: 'intelAssessment', label: 'Intelligence interpretation', options: MODULE_FOUR_INTEL_FINDING_OPTIONS, missing: 'Interpret the attached intelligence' },
      { name: 'ruleDisposition', label: 'Rule deployment decision', options: MODULE_FOUR_RULE_DISPOSITION_FINDING_OPTIONS, missing: 'Decide how to deploy the tuned rule' },
      { name: 'automationChoice', label: 'Bounded automation choice', options: MODULE_FOUR_AUTOMATION_FINDING_OPTIONS, missing: 'Choose a bounded automation playbook' },
    ],
    findingsHtml: moduleFourCaseAutomationHtml(),
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
  if (!missionNextAllLabsComplete(moduleFourState.labProgress, ['additional-1', 'additional-2', 'additional-3'])) missing.push('Mark all required imported labs complete');
  if (moduleFourState.selectedEvidence.length < 6) missing.push('Select at least six evidence artifacts across the two sources in the Guided Lab');
  if (!moduleFourState.ruleRuns) missing.push('Run the rule simulation in the Guided Lab');
  if (!moduleFourState.enrichedIndicator) missing.push('Attach an intelligence indicator in the Guided Lab');
  if (!moduleFourState.automationRan) missing.push('Run the selected automation playbook');
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
      entityPoints >= 15 ? 'Affected entity/scope: correct — acct-24 and 198.51.100.44 are the confirmed affected user and device.' : entityPoints > 0 ? 'Affected entity/scope: partial credit — a related account or source is supported by the evidence, but acct-24/198.51.100.44 is the confirmed pair.' : 'Affected entity/scope: review — acct-24 and 198.51.100.44 are the confirmed affected user and device, supported by the authentication log.',
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
let moduleFourUser = null;
let moduleFourReviewMode = false;
let moduleFourQuizState = null;
let moduleFourProveItShowMissing = false;
// Set when the learner explicitly asks to retake a knowledge check that the
// account already records as passed (see moduleFourQuizVerifiedElsewhere()).
let moduleFourQuizForceRetake = false;

function moduleFourLoad(user) {
  if (moduleFourUser?.email !== user?.email) moduleFourQuizForceRetake = false;
  moduleFourUser = user;
  moduleFourState = LabRuntime.loadCaseState(MODULE_FOUR_LAB_ID, 'soc-04', user, MODULE_FOUR_DEFAULT_STATE);
  ['reviewedStations', 'selectedEvidence', 'ruleRunResults', 'automationLog', 'hintsOpened', 'feedback', 'flags'].forEach((key) => {
    if (!Array.isArray(moduleFourState[key])) moduleFourState[key] = [];
  });
  if (!moduleFourState.lessonWork || typeof moduleFourState.lessonWork !== 'object') moduleFourState.lessonWork = {};
  if (!moduleFourState.independentLab || typeof moduleFourState.independentLab !== 'object') moduleFourState.independentLab = JSON.parse(JSON.stringify(MODULE_FOUR_DEFAULT_STATE.independentLab));
  if (!moduleFourState.independentLab.answers || typeof moduleFourState.independentLab.answers !== 'object') moduleFourState.independentLab.answers = {};
  if (!Array.isArray(moduleFourState.independentLab.feedback)) moduleFourState.independentLab.feedback = [];
  if (typeof moduleFourState.notes !== 'string') moduleFourState.notes = '';
  if (!moduleFourState.labProgress || typeof moduleFourState.labProgress !== 'object') moduleFourState.labProgress = {};

  // Standard case record — init/migrate; never crash on an old saved shape.
  if (!moduleFourState.caseRecord || typeof moduleFourState.caseRecord !== 'object') {
    moduleFourState.caseRecord = JSON.parse(JSON.stringify(MODULE_FOUR_DEFAULT_STATE.caseRecord));
  }
  ['status', 'severity', 'affectedUser', 'affectedDevice', 'disposition', 'escalation', 'escalateTo', 'notes'].forEach((key) => {
    if (typeof moduleFourState.caseRecord[key] !== 'string') moduleFourState.caseRecord[key] = '';
  });
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
  return [
    { id: 'lecture', title: 'Lecture', type: 'lecture', isComplete: true, scrollId: 'm04-lecture' },
    { id: 'knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: moduleFourQuizState?.passed, scrollId: 'm04-knowledge-check' },
    { id: 'guided-lab', title: 'Guided Lab', type: 'lab', isComplete: moduleFourState.ruleRuns > 0 && Boolean(moduleFourState.enrichedIndicator), scrollId: 'm04-guided-lab' },
    { id: 'assessment-lab', title: 'Assessment Lab', type: 'review', isComplete: moduleFourState.completed, scrollId: 'm04-assessment-lab' },
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
    isComplete: moduleFourState.ruleRuns > 0 && Boolean(moduleFourState.enrichedIndicator),
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
  if (moduleFourUser && moduleFourState) LabRuntime.saveCaseState(MODULE_FOUR_LAB_ID, 'soc-04', moduleFourUser, moduleFourState);
}

function moduleFourVideoScript() {
  return `<details class="m04-video-script">
    <summary><strong>Video script (recording pending)</strong></summary>
    <div class="m04-script-body">
      <p><strong>Introduction:</strong> Welcome to the detection engineering workshop. Modern security systems generate thousands of alerts daily. Your job is not to respond to every signal—it's to tune rules, enrich alerts with context, and automate safely. Over the next 10 minutes, we'll explore how to write better detection rules, use threat intelligence to corroborate or question alerts, and set boundaries on automation so disruptive decisions stay human-approved.</p>

      <p><strong>Segment 1 — What is a detection rule?</strong> A detection rule is a logical expression that aggregates events and triggers an alert when a condition is met. The key insight: the rule's grouping field determines what events are counted together. Group by account, and a user's single credential failure looks like a login attempt from an assigned device. Group by source IP, and that user's failure combined with four other users' failures from the same IP reveals a distributed spray. Same events, different patterns, different grouping choices.</p>

      <p><strong>Segment 2 — Grouping and aggregation in practice.</strong> Imagine ten authentication failures—five from Account A's workstation retrying a stale password, and five from five different accounts all from IP 198.51.100.44. A rule grouping by (Account, Source IP) produces one alert for the managed client (known noise) and keeps four distinct 1-failure alerts under the radar. A rule grouping by Source IP and counting distinct accounts produces one alert: five accounts from 198.51.100.44. Same data, but changing the grouping field surfaces the distributed pattern. This module's lab demonstrates that exact tradeoff.</p>

      <p><strong>Segment 3 — False positives vs. false negatives.</strong> Tuning a rule is a tradeoff. Lower thresholds catch more real attacks (fewer false negatives) but trigger on more benign activity (more false positives). Higher thresholds reduce alert noise but risk missing real attacks. There is no magic threshold; your job is to choose the tradeoff that fits your risk tolerance and follow-up capacity. Too many false positives: analysts ignore alerts (alert fatigue). Too high a threshold: attackers slip through undetected. The best threshold is the one your team can actually investigate.</p>

      <p><strong>Segment 4 — Threat intelligence and confidence.</strong> A threat feed provides an indicator—an IP, domain, file hash—and metadata: confidence (how sure the indicator is malicious), status (active, retired, expired), and freshness (when it was last seen). High confidence and recent activity suggest a current threat. Low confidence or aged indicators provide historical context but should not drive emergency decisions. Exact match also matters: a high-confidence indicator for a common ISP IP is less useful than a lower-confidence match for a known attacker's infrastructure. Context and relevance are as important as confidence.</p>

      <p><strong>Segment 5 — Automation and approval boundaries.</strong> A SOAR playbook can automate repeatable, low-risk tasks: creating tickets, sending notifications, enriching alerts with threat feeds. These actions preserve evidence and move alerts forward without altering system state. Disruptive actions—disabling accounts, blocking IPs, revoking sessions—should stay behind approval gates. Even a correct detection can target legitimate activity; humans are needed to judge context. The safest playbooks are hybrid: automate collection and enrichment, escalate decisions to analysts, then execute disruptive actions only with approval.</p>

      <p><strong>Segment 6 — Priority and triage reasoning.</strong> Two alerts, both correct detections: a single account's repeated password failures, and a distributed spray across five accounts from one IP with one successful access. Which is higher priority? The distributed pattern with successful access, because it suggests compromise. Potential impact (data sensitivity, asset criticality) and evidence of success determine priority, not just the magnitude of the alert signal. An alert is correct when it detects anomalous events; it is high-priority when those events threaten valuable assets or show signs of compromise.</p>

      <p><strong>Closing:</strong> Detection engineering is iterative. You will write rules, test them, tune them, and adjust based on what your environment actually generates. The lab lets you test a rule against synthetic data and see which grouping reveals the intended pattern while minimizing noise. From there, enrichment adds context (threat intelligence), and bounded automation handles the routine work so analysts can focus on judgment calls. Remember: better detection means fewer missed attacks and lower alert fatigue—the sweet spot.</p>
    </div>
  </details>`;
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
    <p>You should now understand how detection rules work, why grouping and thresholds matter, how threat intelligence enriches alerts, and where automation needs human oversight. In the field, you will inherit rules that need tuning, integrate threat feeds into playbooks, and build response procedures that balance automation with human judgment. Remember: the best detection system is not perfectly sensitive or perfectly specific—it is tuned to your team's capacity and your organization's risk tolerance.</p>
  </section>`;
}


function moduleFourIndependentLab() {
  const state = moduleFourState.independentLab;
  const answered = MODULE_FOUR_INDEPENDENT_LAB.questions.filter((q) => state.answers?.[q.id]).length;
  const feedback = state.feedback?.length ? `<div class="m04-independent-feedback ${state.completed ? 'is-pass' : 'is-hint'}" role="status"><strong>${state.score}/100 — ${state.completed ? 'Independent lab complete' : 'Review and retry'}</strong><ul>${state.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div>` : '';
  return `<section class="m04-independent-lab" id="m04-independent-lab" aria-labelledby="m04-independent-title"><div class="m04-panel-heading"><div><p class="m04-kicker">Independent · fresh decision path · included in the existing 120-minute lab allocation</p><h3 id="m04-independent-title">${esc(MODULE_FOUR_INDEPENDENT_LAB.title)}</h3></div><span>${answered}/${MODULE_FOUR_INDEPENDENT_LAB.questions.length} answered</span></div><p class="m04-panel-instruction">${esc(MODULE_FOUR_INDEPENDENT_LAB.scenario)}</p><form id="m04-independent-form">${MODULE_FOUR_INDEPENDENT_LAB.questions.map((q) => `<fieldset class="m04-independent-question"><legend>${esc(q.label)}</legend>${q.options.map((o) => `<label><input type="radio" name="m04-independent-${esc(q.id)}" value="${esc(o.id)}" data-m04-independent-answer data-question-id="${esc(q.id)}" ${state.answers?.[q.id] === o.id ? 'checked' : ''}><span>${esc(o.text)}</span></label>`).join('')}</fieldset>`).join('')}<label class="m04-note-label">Analyst note (optional)<textarea rows="3" maxlength="500" data-m04-independent-notes placeholder="Record the bounded scope and approval boundary…">${esc(state.notes || '')}</textarea></label><button type="submit" class="m04-independent-submit">Score independent lab</button></form>${feedback}</section>`;
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
  const ready = moduleFourState.ruleRuns > 0 && Boolean(moduleFourState.enrichedIndicator);
  if (!ready) return `<section class="m04-artifact-locked" aria-label="Detection package locked"><i class="ri-lock-line" aria-hidden="true"></i><div><strong>Detection package</strong><p>Run at least one rule simulation and attach one intelligence indicator in the Guided Lab. You may complete those desks in either order.</p></div></section>`;
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
  const station = moduleFourState.activeStation === 'rule'
    ? moduleFourRuleStation()
    : moduleFourState.activeStation === 'intel'
      ? moduleFourIntelStation()
      : `<section class="m04-start-panel" aria-label="Choose a starting desk"><i class="ri-route-line" aria-hidden="true"></i><div><strong>Choose either desk to begin.</strong><p>This assisted lab signposts the required outputs but leaves the investigation order to you.</p></div></section>`;
  return `${moduleFourProgressStrip()}${moduleFourStationChooser()}${station}`;
}

function moduleFourAssessmentLabPanel() {
  return `${moduleFourArtifact()}${moduleFourIndependentLab()}`;
}

function moduleFourAdditionalLabs() {
  return missionNextLabLaunchGroup(4, 'additional', [
    { title: 'DHCP Log Analysis — Rogue DHCP Server Detection', detail: 'Network telemetry and automated detection', href: 'imported-labs/mission-next-labs/index.html#/track/splunk/module/dhcp-log-analysis', labId: 'additional-1', requireNote: true },
    { title: 'Active Directory Health Checks using Nagios', detail: 'Optional supplementary AD monitoring practice', href: 'imported-labs/mission-next-labs/index.html#/track/active-directory/project/ad-4/lab', labId: 'additional-2', requireNote: true },
    { title: 'Active Directory Monitoring and Alerting with Prometheus', detail: 'Optional supplementary AD monitoring practice', href: 'imported-labs/mission-next-labs/index.html#/track/active-directory/project/ad-6/lab', labId: 'additional-3', requireNote: true },
  ], moduleFourState.labProgress);
}


function viewModuleFour(user, program) {
  moduleFourLoad(user);
  const complete = moduleFourState.completed === true;
  const module = program.modules['soc-04'];
  const sections = moduleFourGetSections();
  const lectureOpen = moduleFourReviewMode || !sections[0].isComplete;
  const quizOpen = moduleFourReviewMode || (moduleFourQuizState && !moduleFourQuizState.passed);
  const guidedLabOpen = moduleFourReviewMode || !sections[2].isComplete;
  const assessmentLabOpen = moduleFourReviewMode || !sections[3].isComplete;
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
        ${moduleFourVideoScript()}
        ${moduleFourLecture()}
        <div class="m04-guide-grid">
          <article><i class="ri-scan-2-line" aria-hidden="true"></i><h3>Coverage</h3><p>A rule should express the behavior you intend to see. Distributed activity can disappear when the wrong entity forms the group.</p></article>
          <article><i class="ri-sound-module-line" aria-hidden="true"></i><h3>Fidelity</h3><p>Test changes against suspicious and benign examples. A quieter rule is only better if it keeps the intended signal.</p></article>
          <article><i class="ri-shield-check-line" aria-hidden="true"></i><h3>Automation boundary</h3><p>Automate repeatable collection and routing. Keep disruptive steps behind approval until confidence and scope justify them.</p></article>
        </div>
      </section>
    </details>`;

  const quizSection = `
    <details class="m04-section-collapsible mf-section" ${quizOpen ? 'open' : ''}>
      <summary class="m04-section-summary">
        <section class="m04-section" id="m04-knowledge-check" aria-labelledby="m04-quiz-title">
          <div class="m04-section-heading mf-section-heading"><span class="mf-section-badge">2</span><div><p class="m04-kicker mf-kicker">Interactive knowledge check</p><h2 id="m04-quiz-title">Test your detection engineering knowledge</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div>
        </section>
      </summary>
      <section class="m04-section m04-section-body mf-section-body" aria-labelledby="m04-quiz-title"><div id="m04-quiz-dynamic">${moduleFourQuizPanel()}</div></section>
    </details>`;

  const guidedLabSection = `
    <details class="m04-section-collapsible mf-section mf-lab-section" ${guidedLabOpen ? 'open' : ''}>
      <summary class="m04-section-summary">
        <section class="m04-section m04-lab-section" id="m04-guided-lab" aria-labelledby="m04-guided-lab-title">
          <div class="m04-section-heading mf-section-heading"><span class="mf-section-badge">3</span><div><p class="m04-kicker mf-kicker">Practice It · Guided Lab</p><h2 id="m04-guided-lab-title">Detection rule studio: tune, test, and enrich</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div>
        </section>
      </summary>
      <section class="m04-section m04-section-body mf-section-body m04-lab-section" aria-labelledby="m04-guided-lab-title">
        <div class="m04-signposts" aria-label="Assisted lab signposts"><div><span>A</span>Inspect either source first</div><div><span>B</span>Test and enrich</div><div><span>C</span>Choose bounded action</div><div><span>D</span>Explain the package</div></div>
        <div class="m04-boundary"><i class="ri-shield-check-line" aria-hidden="true"></i><p><strong>Lab boundary:</strong> This isolated surface contains one fictional rule, one authentication slice, and one intelligence snapshot. No other course environment or future-module evidence is reachable here.</p></div>
        <div id="m04-guided-lab-dynamic">${moduleFourGuidedLabPanel()}</div>
      </section>
    </details>`;

  const assessmentLabSection = `
    <details class="m04-section-collapsible mf-section" ${assessmentLabOpen ? 'open' : ''}>
      <summary class="m04-section-summary">
        <section class="m04-section m04-lab-section" id="m04-assessment-lab" aria-labelledby="m04-assessment-lab-title">
          <div class="m04-section-heading mf-section-heading"><span class="mf-section-badge">4</span><div><p class="m04-kicker mf-kicker">Prove It · Assessment Lab</p><h2 id="m04-assessment-lab-title">Detection package: score and submit</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div>
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
        <dl class="m04-status mf-stats" aria-label="Saved lab status"><div><dt>Guided Lab</dt><dd>${moduleFourState.ruleRuns > 0 && moduleFourState.enrichedIndicator ? 'Complete' : (moduleFourState.ruleRuns || moduleFourState.enrichedIndicator) ? 'In progress' : 'Not started'}</dd></div><div><dt>Assessment Lab</dt><dd id="m04-status">${complete ? 'Complete' : moduleFourState.attempts ? 'In progress' : 'Not started'}</dd></div></dl>
      </section>

      <section class="m04-objective" aria-labelledby="m04-objective-title"><span><i class="ri-focus-2-line" aria-hidden="true"></i></span><div><p class="m04-kicker">One measurable objective</p><h2 id="m04-objective-title">Tune a detection to catch one distributed password spray while excluding one benign retry pattern, then justify enrichment and bounded automation with at least ${MODULE_FOUR_PASSING_SCORE}/100.</h2></div></section>

      ${lectureSection}
      ${quizSection}
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
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function moduleFourRenderAssessment(focusId) {
  const root = document.getElementById('m04-assessment-lab-dynamic');
  if (!root) return;
  root.innerHTML = moduleFourAssessmentLabPanel();
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
  if (!root || !moduleFourState) return;

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

  root.addEventListener('change', (event) => {
    const input = event.target;
    if (input.matches('[data-m04-independent-answer]')) {
      moduleFourState.independentLab.answers[input.dataset.questionId] = input.value;
      moduleFourSave();
      return;
    }
    if (input.closest('#m04-assessment') && caseRecordApply(moduleFourState.caseRecord, input.name, input.value)) {
      moduleFourState.caseRecord.actionHistory.push({ action: `Updated ${input.name}`, at: new Date().toISOString() });
      moduleFourSave();
      // A finding change can flip the "run automation" button's disabled
      // state (automationChoice) — re-render so it reflects the new pick.
      moduleFourRenderAssessment();
    }
  });

  root.addEventListener('input', (event) => {
    if (event.target.matches('[data-m04-independent-notes]')) {
      moduleFourState.independentLab.notes = event.target.value;
      moduleFourSave();
      return;
    }
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
      const result = moduleFourCaseScore();
      const submittedAt = new Date().toISOString();
      moduleFourState.caseRecord.submitted = true;
      moduleFourState.caseRecord.submittedAt = submittedAt;
      moduleFourState.caseRecord.actionHistory.push({ action: 'Submitted case for faculty review', at: submittedAt });
      moduleFourState.attempts = (moduleFourState.attempts || 0) + 1;
      moduleFourState.score = result.score;
      moduleFourState.bestScore = Math.max(moduleFourState.bestScore || 0, result.score);
      moduleFourState.breakdown = result.breakdown;
      moduleFourState.feedback = result.feedback;
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
            breakdown: result.breakdown,
            feedback: result.feedback,
            critical_errors: result.criticalErrors,
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
      moduleFourState = LabRuntime.resetCaseState(MODULE_FOUR_LAB_ID, 'soc-04', moduleFourUser, MODULE_FOUR_DEFAULT_STATE);
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleFourUser, 'soc-analyst', 'soc-04', MODULE_FOUR_CATALOG_LAB_KEY, false);
      const status = document.getElementById('m04-status');
      if (status) status.textContent = 'Not started';
      moduleFourRenderGuided('m04-choose-title');
      moduleFourRenderAssessment();
    }
  });

  root.addEventListener('submit', (event) => {
    if (event.target.id === 'm04-independent-form') {
      event.preventDefault();
      const state = moduleFourState.independentLab;
      const missing = MODULE_FOUR_INDEPENDENT_LAB.questions.some((question) => !state.answers?.[question.id]);
      if (missing) { state.feedback = [`Answer all ${MODULE_FOUR_INDEPENDENT_LAB.questions.length} independent-lab decisions before scoring.`]; moduleFourSave(); moduleFourRenderAssessment('m04-independent-title'); return; }
      const correct = MODULE_FOUR_INDEPENDENT_LAB.questions.filter((question) => state.answers[question.id] === question.correct).length;
      state.attempts += 1;
      state.score = Math.round((correct / MODULE_FOUR_INDEPENDENT_LAB.questions.length) * 100);
      state.completed = state.score >= 70;
      state.feedback = MODULE_FOUR_INDEPENDENT_LAB.questions.map((question) => state.answers[question.id] === question.correct ? `${question.id}: Correct — the evidence supports a bounded, approval-aware response.` : `${question.id}: Revisit the evidence chain; do not let a nearby benign event erase the stronger sequence or justify broad disruption.`);
      if (state.completed) state.feedback.push('Independent lab passed. You preserved evidence and kept disruptive response approval-gated.');
      moduleFourSave();
      moduleFourRenderAssessment('m04-independent-title');
      return;
    }
    // The Incident / Case Record form (caseRecordPane) has no native submit
    // path of its own — Submit Case is a type="button" handled above — but
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
  view: viewModuleFour, wire: wireModuleFour });
