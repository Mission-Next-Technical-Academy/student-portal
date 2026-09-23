/* Module 08 — vulnerability prioritization and exposure analysis.
 * The Guided Lab and Assessment Lab launch real imported Mission Next
 * training projects (portal/imported-labs/mission-next-labs/); this file tracks
 * completion and the assessment write-up only.
 */

const MODULE_EIGHT_LAB_ID = 'm08-exposure-prioritization-v1';
const MODULE_EIGHT_FLAG = 'M08-VULNERABILITY-PRIORITIZED';
const MODULE_EIGHT_PRIORITY_CATALOG_KEY = 'lab-vuln-prioritization';
const MODULE_EIGHT_QUEUE_CATALOG_KEY = 'lab-vuln-queue';

const MODULE_EIGHT_QUIZ_BANKS = [
  {
    conceptId: 'contextual-risk-prioritization',
    conceptTitle: 'Contextual risk prioritization',
    questions: [
      {
        id: 'm08-q-ctx-1',
        prompt: 'Two findings have different CVSS scores. VM-A is CVSS 9.8 in an isolated admin VLAN with EDR and outbound deny-rules active. VM-B is CVSS 8.1 in a public-facing identity service with exploit traffic observed. Which is the correct prioritization?',
        options: [
          { id: 'a', text: 'VM-A first because it has the higher CVSS base score.' },
          { id: 'b', text: 'VM-B first because active exploitation, internet exposure, and weak prevention outweigh the raw severity difference.' },
          { id: 'c', text: 'Both have equal priority; they need parallel remediation.' },
          { id: 'd', text: 'Neither is urgent until they appear on a scan a second time.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. Severity is input to priority, not the complete decision. Exploitability, exposure, business impact, and control strength matter more than base score alone.',
        feedbackIncorrect: 'Base score describes technical severity under standard assumptions. The actual priority requires validation of exposure, exploitability evidence, compensating controls, and business criticality.',
      },
      {
        id: 'm08-q-ctx-2',
        prompt: 'A staging environment has the same vulnerability as your production system, but staging contains only synthetic test data with no customer or operational data. How should their prioritization differ?',
        options: [
          { id: 'a', text: 'Production first, because the same vulnerability carries different risk when the asset holds different data.' },
          { id: 'b', text: 'Staging first, because staging usually has a faster change window.' },
          { id: 'c', text: 'They should be prioritized equally; the vulnerability is identical.' },
          { id: 'd', text: 'Staging should not be patched at all; it is not a business system.' },
        ],
        correctId: 'a',
        feedbackCorrect: 'Correct. Business impact depends on asset data and function, not vulnerability properties alone. Production systems holding customer data warrant faster response.',
        feedbackIncorrect: 'Asset criticality and data sensitivity are separate inputs to prioritization. A test or staging environment\'s patch window may be shorter, but the actual risk is lower.',
      },
      {
        id: 'm08-q-ctx-3',
        prompt: 'A third-party tool reports a high-severity vulnerability in a database engine on your network. Your database team says the affected code path is not used in your configuration. What is the next step before prioritizing remediation?',
        options: [
          { id: 'a', text: 'Treat it as-is and schedule it for the next standard maintenance window.' },
          { id: 'b', text: 'Validate whether the vulnerable code path is actually reached in your live configuration.' },
          { id: 'c', text: 'Assume the tool is correct and prioritize it as high regardless.' },
          { id: 'd', text: 'Ignore the database team\'s claim and escalate to management.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. Validator findings against live evidence before accepting exposure. A vulnerability in unused code is lower priority than one in active execution paths.',
        feedbackIncorrect: 'Tool output requires context verification. A scanner cannot know your configuration details. Work with asset owners to confirm whether vulnerable code is actually active.',
      },
      {
        id: 'm08-q-ctx-4',
        prompt: 'Your organization just deployed a compensating control (network segmentation) for a critical vulnerability that has no patch available for 30 days. How should you track this?',
        options: [
          { id: 'a', text: 'Close the vulnerability finding; the control eliminates the risk.' },
          { id: 'b', text: 'Document the control, assign an owner, set an expiry, and retest on or before day 30.' },
          { id: 'c', text: 'Create a ticket but do not assign an owner or expiry.' },
          { id: 'd', text: 'Wait for the patch, then forget the control was ever in place.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. Compensating controls must be accountable, time-bound, verified, and reviewed. An indefinite exception without monitoring is not a valid remediation path.',
        feedbackIncorrect: 'A control reduces risk but does not eliminate a vulnerability permanently. You must monitor, verify ownership, and expire the control when the permanent fix is in place.',
      },
    ],
  },
  {
    conceptId: 'false-positive-validation',
    conceptTitle: 'Validating scanner findings against live evidence',
    questions: [
      {
        id: 'm08-q-fpv-1',
        prompt: 'A scanner reports that a workstation is running vulnerable version 129.1 of an application. A current software inventory and package receipt both show version 131.0 (patched) is installed. What is the correct interpretation?',
        options: [
          { id: 'a', text: 'Both reports are valid; the system is running two versions simultaneously.' },
          { id: 'b', text: 'Close the finding as a validated false positive; your inventory and live check override the stale scan result.' },
          { id: 'c', text: 'Trust the scanner and schedule an emergency rebuild.' },
          { id: 'd', text: 'The scanner and inventory are both wrong; a manual check is needed.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. A stale or inventory-join error is a common false-positive pattern. Live evidence from the affected system takes precedence over scan dates.',
        feedbackIncorrect: 'Scanners can report out-of-date inventory records. When live verification contradicts the scan, use the live evidence to close stale findings.',
      },
      {
        id: 'm08-q-fpv-2',
        prompt: 'An asset inventory feed shows a server is offline. A scanner still reports vulnerabilities on it, and remediation staff say they have not yet reached that server. How should you validate before closing these findings?',
        options: [
          { id: 'a', text: 'Close the findings based on the inventory feed showing offline status.' },
          { id: 'b', text: 'Verify offline status independently before closing; offline inventory data can lag behind reality.' },
          { id: 'c', text: 'Assume the scanner is more current than the inventory feed.' },
          { id: 'd', text: 'Open the findings in perpetuity until remediation staff confirm.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. Inventory data can lag, especially in dynamic environments. Independent verification ensures you are not ignoring an active asset.',
        feedbackIncorrect: 'Multiple sources can disagree on asset state. Corroborate before deciding; an offline state must be verified, not just reported.',
      },
      {
        id: 'm08-q-fpv-3',
        prompt: 'A finding names a legacy device by an old asset ID, but your current inventory uses a different ID for the same physical device. The old scan reference cannot be matched to current ownership. What is the proportionate response?',
        options: [
          { id: 'a', text: 'Close the finding because the ID does not match current inventory.' },
          { id: 'b', text: 'Reconcile the old ID to the current asset record, assign it to the current owner, and treat it as a current finding.' },
          { id: 'c', text: 'Assume it is a false positive if you cannot instantly match the ID.' },
          { id: 'd', text: 'Escalate to the inventory team without taking action on the vulnerability.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. A naming or ID mismatch requires reconciliation, not dismissal. Find the asset owner and proceed.',
        feedbackIncorrect: 'Do not discard findings because of ID mismatches. Reconcile them to current inventory; an old vulnerability can be a current exposure.',
      },
      {
        id: 'm08-q-fpv-4',
        prompt: 'A scanner reports a vulnerability in a service that exited the network 12 hours ago. The scan was run 8 hours ago, after the service was already decommissioned. Should this finding be investigated?',
        options: [
          { id: 'a', text: 'Yes; it is still a real vulnerability that could have been exploited.' },
          { id: 'b', text: 'No; the asset is gone, so the finding is moot.' },
          { id: 'c', text: 'Only if the service will return to the network in the future.' },
          { id: 'd', text: 'Investigate only if external threat intelligence confirms active exploitation.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. A finding on a decommissioned asset has no remediation scope. Archive it without action.',
        feedbackIncorrect: 'Historical findings on removed assets do not require current action. Verify asset removal status before closing.',
      },
    ],
  },
  {
    conceptId: 'exposure-and-reachability',
    conceptTitle: 'Exposure and reachability context',
    questions: [
      {
        id: 'm08-q-reach-1',
        prompt: 'A security researcher publishes a new exploit for a vulnerability in a common library. Your organization uses the vulnerable version in a component that is reachable only from an isolated internal VLAN, behind two authenticated jump-host hops. How does exposure context change the priority versus the same version on an internet-facing API?',
        options: [
          { id: 'a', text: 'No difference; the base score is the same, so the priority is the same.' },
          { id: 'b', text: 'The internal component is lower priority because it has a smaller attack surface and requires more preconditions.' },
          { id: 'c', text: 'The internal component is higher priority because it is often overlooked.' },
          { id: 'd', text: 'Reachability does not affect priority; only patch availability matters.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. Reachability and entry requirements are key inputs to likelihood. An internal system behind multiple authentication barriers has lower likelihood than a public endpoint.',
        feedbackIncorrect: 'CVSS base score assumes standard conditions. Real-world priority must account for actual exposure—how an attacker would reach the asset.',
      },
      {
        id: 'm08-q-reach-2',
        prompt: 'A network reachability test from outside your organization\'s perimeter fails to reach a system that a scanner marks as vulnerable. What is the correct next step?',
        options: [
          { id: 'a', text: 'Assume the test was wrong and prioritize the finding as if the system were reachable.' },
          { id: 'b', text: 'Close the finding because it is not internet-reachable.' },
          { id: 'c', text: 'Use the reachability evidence to lower the priority and verify the network control is actively maintained.' },
          { id: 'd', text: 'Ignore the reachability test and trust only the scanner result.' },
        ],
        correctId: 'c',
        feedbackCorrect: 'Correct. Failed external reachability lowers likelihood but does not eliminate the finding. Verify the network control is active and monitored.',
        feedbackIncorrect: 'A network control can fail unexpectedly. Verified non-reachability lowers priority but requires ongoing verification of the control itself.',
      },
      {
        id: 'm08-q-reach-3',
        prompt: 'Your organization recently disabled a load balancer that was the sole external route to a staging environment. Scan results from before the change still reference that route as active. How should you handle the old findings?',
        options: [
          { id: 'a', text: 'Keep them open in perpetuity because they were once reachable.' },
          { id: 'b', text: 'Close them immediately without verification of the load-balancer shutdown.' },
          { id: 'c', text: 'Verify the load-balancer shutdown independently, confirm no other external routes exist, and close the findings.' },
          { id: 'd', text: 'Escalate to management without taking action.' },
        ],
        correctId: 'c',
        feedbackCorrect: 'Correct. Verify the control change independently. Exposure context can change significantly, but you must confirm the change before closing.',
        feedbackIncorrect: 'Route changes must be validated. A documented shutdown is stronger than a scan report, but confirm both the change and the absence of alternate routes.',
      },
      {
        id: 'm08-q-reach-4',
        prompt: 'Two systems have identical vulnerabilities: one is on a guest WiFi network, the other is on a segregated industrial control system network. How should their prioritization differ, assuming both have applied the same compensating control?',
        options: [
          { id: 'a', text: 'Guest WiFi has lower priority because guests expect less privacy.' },
          { id: 'b', text: 'Industrial control is lower priority because downtime is expensive and less common.' },
          { id: 'c', text: 'Industrial control is higher priority because a compromise could affect physical operations and safety.' },
          { id: 'd', text: 'Priority is identical because the vulnerability is the same.' },
        ],
        correctId: 'c',
        feedbackCorrect: 'Correct. Business impact and consequences differ by asset type. Industrial systems carry higher operational risk.',
        feedbackIncorrect: 'Asset function and criticality are key context factors. An identical vulnerability in systems with different purposes has different impact.',
      },
    ],
  },
  {
    conceptId: 'compensating-controls-timeboxing',
    conceptTitle: 'Compensating controls and time-boxing',
    questions: [
      {
        id: 'm08-q-comp-1',
        prompt: 'A critical vulnerability in a legacy payment terminal has no vendor patch available for 45 days. Network segmentation and whitelisting of payment operations are verified and monitored. What is the proper way to record this?',
        options: [
          { id: 'a', text: 'Close the vulnerability; the controls are sufficient.' },
          { id: 'b', text: 'Document the control, the owner, the expiry date (patch date), verification steps, and retest schedule.' },
          { id: 'c', text: 'Leave it open forever as a "known issue."' },
          { id: 'd', text: 'Assume the vendor will extend the patch if needed.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. Compensating controls require documented ownership, an accountable expiry, and planned verification.',
        feedbackIncorrect: 'A temporary control needs exit criteria and monitoring. Without a time-bound plan, the exception becomes permanent debt.',
      },
      {
        id: 'm08-q-comp-2',
        prompt: 'You document a compensating control with an expiry of "when the patch is released." The vendor misses the original timeline and reschedules the patch. Who should update the record, and what should the new expiry be?',
        options: [
          { id: 'a', text: 'The analyst who created it; the new expiry is the new vendor target date.' },
          { id: 'b', text: 'The control owner should update the record and commit to a revised expiry before the original expires.' },
          { id: 'c', text: 'No update is needed; assume the vendor will deliver.' },
          { id: 'd', text: 'Escalate to executive leadership.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. The control owner is accountable for updating the exception before it expires.',
        feedbackIncorrect: 'Patch timelines slip. The owner must proactively refresh the exception commitment before the existing expiry passes.',
      },
      {
        id: 'm08-q-comp-3',
        prompt: 'A system with a compensating control has reached its documented expiry date. The vulnerability is still unpatched, and the control owner says they need another 30 days. What is the correct action?',
        options: [
          { id: 'a', text: 'Automatically extend the exception by 30 days.' },
          { id: 'b', text: 'Require a new formal exception request before extending; do not allow the old one to pass without review.' },
          { id: 'c', text: 'Remove the control and escalate as a breach.' },
          { id: 'd', text: 'Make it a permanent exception to avoid repeated reviews.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. Time-bound exceptions must be renewed; do not extend by default.',
        feedbackIncorrect: 'An expired exception requires active renewal, not automatic extension. This ensures accountability and prevents indefinite drift.',
      },
      {
        id: 'm08-q-comp-4',
        prompt: 'An application team says their compensating control (restricted admin access) is so effective that patching is no longer necessary. How should you respond?',
        options: [
          { id: 'a', text: 'Close the vulnerability and remove it from the backlog.' },
          { id: 'b', text: 'Agree and mark the system as an exception perpetually.' },
          { id: 'c', text: 'Acknowledge the control reduces risk but explain that the goal is to apply the patch; the control is interim, not permanent.' },
          { id: 'd', text: 'Escalate to force an immediate patch regardless of the control.' },
        ],
        correctId: 'c',
        feedbackCorrect: 'Correct. Compensating controls are temporary measures. The long-term goal is permanent remediation via patching.',
        feedbackIncorrect: 'Controls reduce risk but do not eliminate vulnerabilities. A permanent exception is technical debt; the goal is resolution.',
      },
    ],
  },
  {
    conceptId: 'remediation-closure-verification',
    conceptTitle: 'Closing the remediation loop with ownership and verification',
    questions: [
      {
        id: 'm08-q-remed-1',
        prompt: 'An asset owner says "We patched the system yesterday. All done." without providing a test report. What should your remediation process do before marking the finding closed?',
        options: [
          { id: 'a', text: 'Accept the owner\'s statement and close the finding.' },
          { id: 'b', text: 'Perform an independent technical retest to verify the patch and absence of the vulnerability.' },
          { id: 'c', text: 'Re-scan only if the owner request a rescan.' },
          { id: 'd', text: 'Archive the finding and assume success.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. Remediation is confirmed by technical verification, not by owner claim. Retest the version and the vulnerability state.',
        feedbackIncorrect: 'A report of a successful patch is not proof. Technical testing closes the loop; this prevents unverified "done" statuses.',
      },
      {
        id: 'm08-q-remed-2',
        prompt: 'A finding was assigned to the storage team three months ago with a due date. They now say the system will be retired in two weeks and they will not patch it. What should the remediation owner do?',
        options: [
          { id: 'a', text: 'Close the finding because the system is going away.' },
          { id: 'b', text: 'Verify the retirement is in progress and will actually occur, then document the closure reason and date.' },
          { id: 'c', text: 'Escalate to force an emergency patch before retirement.' },
          { id: 'd', text: 'Keep the finding open forever.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. Verify the retirement is real and imminent; document the closure reason.',
        feedbackIncorrect: 'Retirement claims must be verified. However, an authentic retirement plan (with an actual decommission date) is a valid closure path.',
      },
      {
        id: 'm08-q-remed-3',
        prompt: 'After patching a system, the scanner still reports the same vulnerability. What is the first step before declaring failure?',
        options: [
          { id: 'a', text: 'Immediately re-patch the system.' },
          { id: 'b', text: 'Verify independently that the patch actually installed and the vulnerable code is no longer present.' },
          { id: 'c', text: 'Assume the scanner has a stale cache and wait for the next scan.' },
          { id: 'd', text: 'Report a false positive to the scanner vendor.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. Live verification takes precedence. The scanner result could lag, or the patch could have failed silently.',
        feedbackIncorrect: 'Scanner results can be stale or incorrect. Always verify the actual state on the affected asset before assuming patching failed.',
      },
      {
        id: 'm08-q-remed-4',
        prompt: 'Your remediation process requires both a due date for the owner AND a planned verification date. Why is the verification date important?',
        options: [
          { id: 'a', text: 'It prevents the owner from delaying unnecessarily.' },
          { id: 'b', text: 'It ensures that a finding is not marked closed on the owner\'s word alone.' },
          { id: 'c', text: 'It is redundant; the due date is sufficient.' },
          { id: 'd', text: 'It allows the owner to extend the due date.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct. A separate verification date creates accountability for technical testing, not just ticket creation.',
        feedbackIncorrect: 'Due dates and verification dates serve different purposes. One commits to action; the other commits to proof.',
      },
    ],
  },
];

/* Module 08 lesson contract: the four catalog lessons retain their locked
 * minutes in portal/data.js. Scenario, theory, check, and applied response are
 * practice embedded inside those minutes; they do not add allocation. */
const MODULE_EIGHT_LESSON_LOOPS = [
  { id: 'decision-input', title: 'Treat vulnerability data as a decision input', minutes: 30,
    scenario: 'Mission Next Labs receives a scanner record for edge-gw-07. The record has a high CVSS, but the analyst cannot yet tell whether the vulnerable service is running or reachable.',
    theory: 'CVE identifies a published weakness, CVSS describes technical severity under defined assumptions, and exploitability context estimates how practical abuse may be. None of those fields alone proves that the local asset is affected. Validate the running version, service role, exposure, and available controls before ranking it.',
    questions: [
      { prompt: 'What should be verified before ranking a scanner finding?', options: ['Affected version and active service path', 'Only the CVSS score', 'The scanner color'], correct: 0, good: 'Correct. Local exposure begins with proof that the affected component and path are present.', bad: 'A score is a decision input, not proof of local exposure. Verify the running version and service path.' },
      { prompt: 'What does a CVSS base score represent?', options: ['Technical severity under stated assumptions', 'Your organization’s final remediation deadline', 'Proof of active exploitation'], correct: 0, good: 'Correct. Base severity must be combined with local context and threat evidence.', bad: 'CVSS is not your deadline and does not prove exploitation. It describes technical severity under a defined model.' },
      { prompt: 'Which record is strongest for current state?', options: ['A signed live version check tied to the asset', 'A six-month-old scan export', 'A copied finding title'], correct: 0, good: 'Correct. Current, asset-specific evidence is more useful than stale labels.', bad: 'Prefer current, asset-specific evidence over stale exports or copied labels.' },
    ], task: 'Write two sentences naming the local evidence you would request for edge-gw-07 before accepting the finding as current.' },
  { id: 'exposure-priority', title: 'Exposure-driven remediation priority', minutes: 30,
    scenario: 'Two synthetic findings compete for the next response slot: a CVSS 9.8 build runner on an admin VLAN and a CVSS 8.1 customer identity gateway with exploit requests observed from the public edge.',
    theory: 'Prioritization is a contextual decision: validated exploitability, reachability, business impact, and control strength can outweigh a higher base score. Known-exploited status is a strong urgency signal, but it still needs local confirmation and an owned response path.',
    questions: [
      { prompt: 'Which finding should lead when evidence is otherwise complete?', options: ['The public identity gateway with active exploit evidence', 'Always the highest CVSS', 'The oldest record regardless of context'], correct: 0, good: 'Correct. Public reachability, active exploitation, and critical service impact raise priority.', bad: 'Do not let CVSS or age replace context. Compare exploit evidence, reachability, impact, and controls.' },
      { prompt: 'What is a known-exploited catalog signal?', options: ['Evidence that exploitation has been observed or documented', 'A guarantee that your asset is compromised', 'A patch approval'], correct: 0, good: 'Correct. It changes urgency, but local scope still requires validation.', bad: 'Known-exploited status is not proof of compromise or a patch approval. It is a threat-urgency signal.' },
      { prompt: 'What weakens priority most?', options: ['Verified segmentation and effective prevention', 'A critical service role', 'A reachable public listener'], correct: 0, good: 'Correct. Effective controls can reduce likelihood, though they must be verified and monitored.', bad: 'Verified controls reduce likelihood; critical role and public reachability increase it.' },
    ], task: 'Draft a short ranking rationale that names the exploitability, exposure, impact, and control evidence you would compare.' },
  { id: 'validate-rank', title: 'Validate before you rank', minutes: 20,
    scenario: 'The edge inventory says edge-gw-07 is decommissioned, yet an external probe still receives a service banner and the load balancer team cannot find a shutdown record.',
    theory: 'Conflicting sources are an investigation task, not permission to close a finding. Reconcile the asset identity, confirm whether a route is live, record source dates, and preserve the uncertainty. A false positive is a supported disposition only after current evidence explains the conflict.',
    questions: [
      { prompt: 'What is the safest next action?', options: ['Reconcile inventory and independently test reachability', 'Close because inventory says offline', 'Ignore the probe and trust the oldest record'], correct: 0, good: 'Correct. Conflicting evidence requires corroboration before closure or reprioritization.', bad: 'Do not close on one stale source. Reconcile identity and independently test the route.' },
      { prompt: 'What should the analyst record?', options: ['Source, timestamp, test method, and unresolved conflict', 'Only the preferred conclusion', 'A generic “scanner error” label'], correct: 0, good: 'Correct. The record must let another analyst reproduce the reasoning.', bad: 'Preserve the evidence chain, including dates, method, and what remains uncertain.' },
      { prompt: 'When may a false-positive disposition be defensible?', options: ['When current evidence explains why the finding no longer applies', 'Whenever an owner requests closure', 'When the score is below 9.0'], correct: 0, good: 'Correct. Closure depends on validated current state, not a request or threshold.', bad: 'A false positive needs current supporting evidence; owner preference or score alone is insufficient.' },
    ], task: 'Write the validation steps you would use to resolve the edge-gw-07 inventory-versus-reachability conflict.' },
  { id: 'decision-loop', title: 'Close the decision loop', minutes: 25,
    scenario: 'The SOC has selected a synthetic edge appliance for urgent treatment. The platform owner needs an actionable handoff that includes timing, interim controls, escalation, and proof of completion.',
    theory: 'A remediation handoff converts analysis into accountable work: name the asset and finding, state evidence and scope, assign the owner, set a due point or exception expiry, identify interim controls, and define the retest that closes or reopens the item.',
    questions: [
      { prompt: 'What makes a compensating control accountable?', options: ['Owner, expiry, monitoring, and retest', 'A note that says “mitigated”', 'An unassigned exception with no date'], correct: 0, good: 'Correct. Temporary risk treatment needs ownership, time bounds, monitoring, and proof.', bad: 'A temporary control is not complete without ownership, expiry, monitoring, and retest.' },
      { prompt: 'What closes a remediation item?', options: ['Technical verification that exposure or version changed', 'Ticket creation alone', 'An informal owner message'], correct: 0, good: 'Correct. Work starts with a ticket; evidence of changed risk closes it.', bad: 'A ticket or informal message is not proof that exposure changed. Retest the technical condition.' },
      { prompt: 'When should escalation be explicit?', options: ['When evidence supports harmful activity, uncertain scope, or action beyond analyst authority', 'Only after the patch window expires', 'Never, if the finding is high severity'], correct: 0, good: 'Correct. Escalation boundaries protect both response speed and analyst authority.', bad: 'Escalate when evidence, uncertainty, or authority requires it—not only after a deadline.' },
    ], task: 'Write a handoff sentence naming the edge appliance owner, target timing, interim control, escalation condition, and retest.' },
];

const MODULE_EIGHT_SOURCES_LIST = [
  {
    title: 'Common Vulnerability Scoring System v3.1: Specification Document',
    org: 'FIRST.org',
    url: 'https://www.first.org/cvss/v3.1/specification-document',
    note: 'Authoritative reference for CVSS scoring principles, including how context (exploitability, impact, scope) shapes the base score.',
  },
  {
    title: 'Known Exploited Vulnerabilities Catalog',
    org: 'CISA',
    url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
    note: 'Tracks vulnerabilities with active exploitation in the wild. Cross-reference findings against this list to prioritize active threats.',
  },
  {
    title: 'Guide to Enterprise Patch Management Planning: Preventive Maintenance for Technology (SP 800-40 Rev. 4)',
    org: 'NIST',
    url: 'https://csrc.nist.gov/pubs/sp/800/40/r4/final',
    note: 'Comprehensive patch and vulnerability management framework covering discovery, assessment, remediation, and compensating controls.',
  },
  {
    title: 'Common Weakness Enumeration (CWE)',
    org: 'MITRE',
    url: 'https://cwe.mitre.org/',
    note: 'Community-maintained catalog of software and hardware weakness types that underlie CVE-listed vulnerabilities and their classification.',
  },
  {
    title: 'Supplementary Security+ domain crosswalk (developer draft)',
    org: 'CompTIA',
    url: 'https://www.comptia.org/certifications/security',
    note: 'Supplementary public reference only. The §2 crosswalk is a developer draft pending curriculum, compliance, and faculty review; this study aid is not an approval, affiliation, endorsement, or pass guarantee. The core lesson teaches transferable vulnerability-prioritization reasoning.',
  },
  {
    title: 'Stakeholder-Specific Vulnerability Categorization (SSVC)',
    org: 'CISA',
    url: 'https://www.cisa.gov/stakeholder-specific-vulnerability-categorization-ssvc',
    note: 'A real decision-tree prioritization methodology (exploitation status, technical impact, mission prevalence) — the formalized version of this lab\'s contextual-risk reasoning.',
  },
  {
    title: 'NIST Risk Management Framework (RMF)',
    org: 'NIST',
    url: 'https://csrc.nist.gov/projects/risk-management/about-rmf',
    note: 'Broader framework for risk assessment and treatment options (remediation, compensating controls, acceptance).',
  },
];

const MODULE_EIGHT_DEFAULT_STATE = {
  practiceComplete: false,
  practiceNotes: '',
  attempts: 0,
  score: 0,
  bestScore: 0,
  feedback: [],
  validationError: '',
  lastSubmittedAt: '',
  notes: '',
  lessonWork: {},
};

let moduleEightState = null;
let moduleEightUser = null;
let moduleEightQuizState = null;
let moduleEightReviewMode = false;

function moduleEightLoad(user) {
  moduleEightUser = user;
  moduleEightState = LabRuntime.load(MODULE_EIGHT_LAB_ID, user, MODULE_EIGHT_DEFAULT_STATE);
  if (!Array.isArray(moduleEightState.feedback)) moduleEightState.feedback = [];
  if (!Array.isArray(moduleEightState.flags)) moduleEightState.flags = [];
  if (!moduleEightState.lessonWork || typeof moduleEightState.lessonWork !== 'object') moduleEightState.lessonWork = {};
  if (typeof moduleEightState.notes !== 'string') moduleEightState.notes = '';
  if (typeof moduleEightState.practiceNotes !== 'string') moduleEightState.practiceNotes = '';

  // Initialize quiz state
  if (!moduleEightQuizState) {
    const previousQuestionIds = moduleEightState.lastQuizQuestionIds || [];
    const selection = selectQuizQuestions(MODULE_EIGHT_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    moduleEightQuizState = {
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

  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'soc-analyst', 'soc-08');
}

function moduleEightSave() {
  if (moduleEightUser && moduleEightState) LabRuntime.save(MODULE_EIGHT_LAB_ID, moduleEightUser, moduleEightState);
}

function moduleEightConcepts() {
  const topics = [
    ['ri-radar-line', 'Asset discovery', 'Start with an accountable inventory and ownership. An unknown or stale asset record weakens every later decision.'],
    ['ri-bug-line', 'Vulnerability assessment', 'Validate affected versions and scanner confidence before treating a finding as current exposure.'],
    ['ri-cloud-line', 'Environments', 'Internet reachability, identity boundaries, network paths, and business purpose change likelihood and impact.'],
    ['ri-scales-3-line', 'Analysis & prioritization', 'Combine severity with exploitability, exposure, asset criticality, controls, and threat evidence.'],
    ['ri-tools-line', 'Remediation', 'Assign an owner, due date, verification step, and safe exception path—not only a patch instruction.'],
    ['ri-code-box-line', 'Application security', 'Track vulnerable components into deployment and verify the running version, not merely the build manifest.'],
  ];
  return `<div class="m08-concept-grid">${topics.map((topic) => `<article><i class="${esc(topic[0])}" aria-hidden="true"></i><h3>${esc(topic[1])}</h3><p>${esc(topic[2])}</p></article>`).join('')}</div>
    <div class="m08-risk-model" aria-label="Contextual exposure prioritization model"><strong>Practical risk order</strong><span>Validate</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>Exploitability</span><i class="ri-add-line" aria-hidden="true"></i><span>Exposure</span><i class="ri-add-line" aria-hidden="true"></i><span>Business impact</span><i class="ri-subtract-line" aria-hidden="true"></i><span>Effective controls</span></div>`;
}

function moduleEightLessonLoop(lesson, index) {
  const work = moduleEightState.lessonWork[lesson.id] || { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
  const feedback = work.feedback?.length ? `<p class="m08-lesson-feedback ${work.checked ? 'is-pass' : 'is-hint'}" role="status">${esc(work.feedback.join(' '))}</p>` : '';
  return `<details class="m08-lesson-loop" ${work.taskComplete ? '' : 'open'}><summary><span class="m08-lesson-number">${String(index + 1).padStart(2, '0')}</span><span><strong>${esc(lesson.title)}</strong><small>${lesson.minutes} minutes · ${work.taskComplete ? 'Complete — reopen to review' : 'Scenario → theory → check → applied task'}</small></span>${work.taskComplete ? '<i class="ri-checkbox-circle-fill m08-lesson-done" aria-label="Lesson complete"></i>' : '<i class="ri-arrow-down-s-line" aria-hidden="true"></i>'}</summary><div class="m08-lesson-loop-body"><section><p class="m08-kicker">Scenario</p><p>${esc(lesson.scenario)}</p></section><section><p class="m08-kicker">Theory</p><p>${esc(lesson.theory)}</p></section><section><p class="m08-kicker">Knowledge check</p>${lesson.questions.map((question, qIndex) => `<fieldset class="m08-lesson-question"><legend>${qIndex + 1}. ${esc(question.prompt)}</legend>${question.options.map((option, optionIndex) => `<label><input type="radio" name="m08-lesson-${esc(lesson.id)}-${qIndex}" value="${optionIndex}" data-m08-lesson-answer data-lesson-id="${esc(lesson.id)}" data-question-index="${qIndex}" ${Number(work.answers?.[qIndex]) === optionIndex ? 'checked' : ''}><span>${esc(option)}</span></label>`).join('')}</fieldset>`).join('')}<button type="button" class="m08-lesson-check" data-m08-lesson-check="${esc(lesson.id)}">Check this lesson</button>${feedback}</section><section><p class="m08-kicker">Applied task</p><p>${esc(lesson.task)}</p><textarea rows="3" maxlength="500" data-m08-lesson-task="${esc(lesson.id)}" placeholder="Write a short analyst response…">${esc(work.task || '')}</textarea><button type="button" class="m08-lesson-task-button" data-m08-lesson-task-submit="${esc(lesson.id)}">${work.taskComplete ? 'Task saved' : 'Save applied task'}</button></section></div></details>`;
}

function moduleEightLessonLoopsView() {
  return `<section class="m08-lesson-loops" id="m08-lessons" aria-labelledby="m08-lessons-title"><div class="m08-panel-heading"><div><p class="m08-kicker">Four-part lesson loops · locked ledger preserved</p><h3 id="m08-lessons-title">Practice each vulnerability-prioritization skill</h3></div><span>4 lessons · 105 minutes</span></div>${MODULE_EIGHT_LESSON_LOOPS.map(moduleEightLessonLoop).join('')}</section>`;
}

function moduleEightGetSections() {
  return [
    { id: 'lecture', title: 'Lecture', type: 'lecture', isComplete: true, scrollId: 'm08-lecture' },
    { id: 'knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: moduleEightQuizState?.passed, scrollId: 'm08-knowledge-check' },
    { id: 'guided-lab', title: 'Guided Lab', type: 'lab', isComplete: moduleEightState.practiceComplete, scrollId: 'm08-guided-lab' },
    { id: 'assessment-lab', title: 'Assessment Lab', type: 'review', isComplete: moduleEightState.completed, scrollId: 'm08-assessment-lab' },
    { id: 'review', title: 'Module Review', type: 'review', isComplete: true, scrollId: 'm08-review' },
    { id: 'sources', title: 'Sources & Further Reading', type: 'read', isComplete: null, scrollId: 'm08-sources', gated: false, supplemental: true },
  ];
}

function moduleEightGetQuickNavItems() {
  const items = [];
  MODULE_EIGHT_LESSON_LOOPS.forEach((lesson, index) => {
    const work = moduleEightState.lessonWork[lesson.id] || {};
    const isComplete = work.taskComplete === true;
    items.push({
      id: `m08-lesson-${esc(lesson.id)}`,
      title: lesson.title,
      kind: 'lesson',
      isComplete,
      scrollId: `m08-lesson-${esc(lesson.id)}`,
      lessonNumber: index + 1,
    });
  });
  items.push({
    id: 'm08-guided-lab',
    title: 'Guided Lab',
    kind: 'lab',
    isComplete: moduleEightState.practiceComplete === true,
    scrollId: 'm08-guided-lab',
  });
  items.push({
    id: 'm08-assessment-lab',
    title: 'Assessment Lab',
    kind: 'lab',
    isComplete: moduleEightState.completed === true,
    scrollId: 'm08-assessment-lab',
  });
  return items;
}

function moduleEightQuizQuestion(selected, index) {
  const question = selected.question;
  const userAnswerId = moduleEightQuizState?.answers?.[question.id];
  const answered = userAnswerId !== undefined;
  return `<fieldset class="m08-quiz-question" data-question-id="${esc(question.id)}">
    <legend><span>${index + 1}</span> ${esc(selected.conceptTitle)}: ${esc(question.prompt)}</legend>
    <div class="m08-quiz-options">
      ${selected.shuffledOptions.map((option) => `<label>
        <input type="radio" name="q-${esc(question.id)}" value="${esc(option.id)}" ${userAnswerId === option.id ? 'checked' : ''} data-m08-quiz-answer />
        <span>${esc(option.text)}</span>
      </label>`).join('')}
    </div>
  </fieldset>`;
}

function moduleEightQuizPanel() {
  if (!moduleEightQuizState?.selectedQuestions || moduleEightQuizState.selectedQuestions.length === 0) {
    return `<div class="m08-quiz-empty" id="m08-quiz-feedback" role="status">Loading quiz…</div>`;
  }

  const selected = moduleEightQuizState.selectedQuestions;
  const answered = Object.keys(moduleEightQuizState.answers || {}).length;
  const total = selected.length;

  let feedbackHtml = '';
  if (moduleEightQuizState.scored) {
    const passed = moduleEightQuizState.score >= 70;
    feedbackHtml = `<section class="m08-quiz-score ${passed ? 'm08-quiz-pass' : 'm08-quiz-remediate'}" id="m08-quiz-feedback" tabindex="-1" aria-live="polite">
      <div class="m08-quiz-score-heading">
        <div>
          <p class="m08-kicker">Attempt ${moduleEightQuizState.attempts} · best ${moduleEightQuizState.bestScore}/100</p>
          <h3>${moduleEightQuizState.score}/100 — ${passed ? 'Knowledge verified' : 'Use feedback and retry'}</h3>
        </div>
        <span>${moduleEightQuizState.score}</span>
      </div>
      <ul class="m08-quiz-feedback-list">
        ${(moduleEightQuizState.feedback || []).map((fb) => `<li class="${fb.correct ? 'm08-quiz-feedback-correct' : 'm08-quiz-feedback-incorrect'}">
          <i class="ri-${fb.correct ? 'checkbox-circle-fill' : 'information-line'}" aria-hidden="true"></i>
          <div>
            <strong>${fb.questionId}</strong>
            <p>${esc(fb.message)}</p>
          </div>
        </li>`).join('')}
      </ul>
      ${!passed ? `<div class="m08-quiz-actions"><button type="button" class="m08-quiz-retry" data-m08-quiz-retry><i class="ri-refresh-line" aria-hidden="true"></i> Try different questions</button></div>` : ''}
    </section>`;
  } else if (answered === total) {
    feedbackHtml = `<div class="m08-quiz-ready" id="m08-quiz-feedback" role="status">All questions answered. Submit to check your responses.</div>`;
  } else {
    feedbackHtml = `<div class="m08-quiz-empty" id="m08-quiz-feedback" role="status">Answer all ${total} questions to submit.</div>`;
  }

  return `<form class="m08-quiz-form" id="m08-quiz-form" novalidate>
    <div class="m08-panel-heading"><div><p class="m08-kicker">Knowledge check</p><h3 id="m08-quiz-title" tabindex="-1">Test your understanding of vulnerability prioritization</h3></div><span>${answered}/${total} answered</span></div>
    ${selected.map((sel, idx) => moduleEightQuizQuestion(sel, idx)).join('')}
    <div class="m08-quiz-actions">
      <button class="m08-quiz-submit" type="submit" ${answered < total ? 'disabled' : ''}>
        <i class="ri-checkbox-circle-line" aria-hidden="true"></i> Check my answers
      </button>
    </div>
    ${feedbackHtml}
  </form>`;
}

function moduleEightVideoScript() {
  return `<details class="m08-video-script">
    <summary><strong>Video script (recording pending)</strong></summary>
    <div class="m08-script-body">
      <p><strong>Introduction:</strong> Welcome to vulnerability prioritization. This module builds on basic vulnerability scanning and teaches you how to make remediation decisions based on exploitability, exposure, business impact, and compensating controls. CVSS is an input, not the complete priority.</p>

      <p><strong>Segment 1 — From CVSS to context.</strong> CVSS base score describes technical severity under standard assumptions. Your prioritization must combine this with four additional questions: Is this version actually running? Can an attacker reach the asset? If exploited, what is the business impact? What controls reduce likelihood? A CVSS 9.8 in an isolated internal VLAN with EDR and outbound deny-rules is lower priority than a CVSS 8.1 in an internet-facing service with active exploitation observed.</p>

      <p><strong>Segment 2 — Validate scanner findings against live evidence.</strong> Scanners join against inventory feeds that can lag days or weeks behind reality. Before closing a finding, verify the actual state on the asset: sign into the device, check the running version, confirm the configuration. A scanner reporting a vulnerable version that is actually patched is a common false-positive pattern. Live verification takes precedence.</p>

      <p><strong>Segment 3 — Exposure and reachability matter.</strong> A vulnerability in a system that exited your network is no longer a priority. A vulnerability in a system behind multiple authentication barriers and network segmentation is lower priority than the same vulnerability in an internet-facing public API. Independent reachability testing can validate or override scanner assumptions. An asset marked offline in inventory still requires verification; inventory data lags reality.</p>

      <p><strong>Segment 4 — Compensating controls and time-boxing.</strong> When a patch is not immediately available, you can reduce risk using network segmentation, access restrictions, or monitoring. These are interim measures. Document the control, assign an owner, commit to a specific expiry date (e.g., "patch date + 1 week"), and plan a verification retest. An indefinite exception without monitoring is technical debt. On the expiry date, require the owner to either patch the system or request a formal renewal with updated risk acceptance.</p>

      <p><strong>Segment 5 — Close the remediation loop with verification.</strong> Ticket creation is not closure. An owner saying "We patched it" is not closure. Technical verification is closure: retest the version, confirm the vulnerability is not present, and document the result. If the patch fails or the vulnerability persists, reopen the finding. This transforms unverified claims into accountable, measurable remediation.</p>

      <p><strong>Closing:</strong> Vulnerability management is the continuous cycle of discovery → assessment → prioritization → remediation → verification. Each step requires validation and ownership. Your role as an analyst is to ensure findings move from discovery to verified closure without getting stuck in indefinite exceptions or false-positive denial.</p>
    </div>
  </details>`;
}

function moduleEightReview() {
  return `<section class="m08-review-section">
    <h3>Module concepts at a glance</h3>
    <ul>
      <li><strong>Contextual risk prioritization:</strong> Combine CVSS base score with exploitability evidence, reachability, business impact, and control strength. A higher base score is not automatically the highest priority.</li>
      <li><strong>False-positive validation:</strong> Live version verification on the affected asset takes precedence over scanner results. Confirm stale inventory joins, decommissioned systems, and unused code paths before accepting exposure.</li>
      <li><strong>Exposure and reachability:</strong> Internet-facing systems, systems accessible without authentication, and systems in production environments carry higher likelihood than isolated internal systems with compensating controls.</li>
      <li><strong>Compensating controls and time-boxing:</strong> Interim controls require an owner, a documented expiry date, and a planned retest. Without a defined exit, the exception becomes technical debt.</li>
      <li><strong>Remediation verification:</strong> An owner's claim or a ticket creation is not closure. Technical verification—retesting the version and confirming vulnerability absence—closes the loop.</li>
      <li><strong>Proportionate response:</strong> Remediation timeline should match risk. Active exploitation in a critical service warrants 24–48 hours; a staging environment with no customer data can use the standard patch window.</li>
    </ul>
    <h3>Before you continue</h3>
    <p>You should now be able to assess vulnerability findings using exploitability, exposure, and control context; validate scanner results against live evidence; design compensating controls with clear ownership and expiry; and close findings via technical verification rather than unverified claims. In later modules and on-the-job, you will apply these prioritization skills in triage, ticket creation, and incident response workflows.</p>
  </section>`;
}

const MODULE_EIGHT_RETURN_TO = encodeURIComponent(window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + '#/program/soc-analyst/module/8');

function moduleEightGuidedLabPanel() {
  const links = [
    { label: 'Vulnerability Assessment using Nessus', href: `imported-labs/mission-next-labs/index.html?returnTo=${MODULE_EIGHT_RETURN_TO}#/track/vulnerability-management/project/vm-2/lab` },
    { label: 'Vulnerability Management using QualysGuard', href: `imported-labs/mission-next-labs/index.html?returnTo=${MODULE_EIGHT_RETURN_TO}#/track/vulnerability-management/project/vm-3/lab` },
  ];
  return `<section class="m08-external-lab" id="m08-guided-lab-panel">
    <p class="m08-panel-instruction">Work through both imported vulnerability-management projects below; each opens on this page with its own guided tasks. When you're done, note what you found and mark the Guided Lab complete.</p>
    <div class="m08-external-lab-links">${links.map((l) => `<a class="m08-lab-launch" href="${esc(l.href)}" rel="noopener"><i class="ri-external-link-line" aria-hidden="true"></i> Launch: ${esc(l.label)}</a>`).join('')}</div>
    <label class="m08-note-label">Working notes (optional)<textarea rows="4" maxlength="900" data-m08-practice-notes placeholder="What did you find? Any blockers?">${esc(moduleEightState.practiceNotes)}</textarea></label>
    <div class="m08-actions"><button type="button" class="m08-submit" data-m08-practice-complete>${moduleEightState.practiceComplete ? 'Guided Lab marked complete' : 'Mark Guided Lab complete'}</button></div>
  </section>`;
}

function moduleEightAdditionalLabs() {
  return missionNextAdditionalLabsSection(8, [
    { label: 'Network Vulnerability Scanning with OpenVAS', detail: 'OpenVAS scan interpretation and remediation', href: `imported-labs/mission-next-labs/index.html?returnTo=${MODULE_EIGHT_RETURN_TO}#/track/vulnerability-management/project/vm-1/lab` },
    { label: 'Web Application Vulnerability Detection with OWASP ZAP', detail: 'Web vulnerability discovery and review', href: `imported-labs/mission-next-labs/index.html?returnTo=${MODULE_EIGHT_RETURN_TO}#/track/vulnerability-management/project/vm-4/lab` },
    { label: 'Web Application Security Assessment', detail: 'Application findings and risk assessment', href: `imported-labs/mission-next-labs/index.html?returnTo=${MODULE_EIGHT_RETURN_TO}#/track/security-assessments/project/sa-3/lab` },
  ]);
}

function moduleEightAssessmentLabPanel() {
  const feedbackHtml = moduleEightState.feedback?.length ? `<div class="m08-independent-feedback is-pass" role="status"><strong>Submitted</strong><ul>${moduleEightState.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div>` : '';
  return `<section class="m08-external-lab" id="m08-assessment-lab-panel">
    <p class="m08-panel-instruction">Complete the imported WSUS patch-management project, then write up your findings below for instructor review.</p>
    <div class="m08-external-lab-links"><a class="m08-lab-launch" href="imported-labs/mission-next-labs/index.html?returnTo=${MODULE_EIGHT_RETURN_TO}#/track/vulnerability-management/project/vm-5/lab" rel="noopener"><i class="ri-external-link-line" aria-hidden="true"></i> Launch: Patch Management and Vulnerability Remediation using WSUS</a></div>
    <form id="m08-assessment-form">
      <label class="m08-note-label">Assessment write-up<textarea id="m08-assessment-notes" rows="6" maxlength="900" data-m08-assessment-notes placeholder="Summarize what the WSUS lab surfaced, your analysis, and your recommended action…">${esc(moduleEightState.notes)}</textarea></label>
      <p class="m08-help">In at least 80 characters, describe what you found and your recommended action.</p>
      <div class="m08-actions"><button type="submit" class="m08-submit">${moduleEightState.completed ? 'Resubmit for review' : 'Submit for review'}</button></div>
    </form>
    ${feedbackHtml}
  </section>`;
}

function viewModuleEight(user, program) {
  moduleEightLoad(user);
  const complete = moduleEightState.completed === true;
  const module = program.modules['soc-08'];
  const sections = moduleEightGetSections();
  const lectureOpen = moduleEightReviewMode || !sections[0].isComplete;
  const quizOpen = moduleEightReviewMode || (moduleEightQuizState && !moduleEightQuizState.passed);
  const guidedLabOpen = moduleEightReviewMode || !sections[2].isComplete;
  const assessmentLabOpen = moduleEightReviewMode || !sections[3].isComplete;
  const reviewOpen = moduleEightReviewMode;
  const quickNavItems = moduleEightGetQuickNavItems();

  return `<div class="m08-shell">
    ${moduleTopbar(user, program)}
    ${moduleProgressShell(sections, { reviewMode: moduleEightReviewMode })}
    <div class="mquick-nav-layout">
      <main class="m08-main">
      <section class="m08-hero" aria-labelledby="m08-title"><div><p class="m08-kicker">Module 08 · ${formatHandsOnDuration(module.durationMinutes)} · SOC prioritization</p><h1 id="m08-title">${esc(module.title)}</h1><p class="m08-lede">Validate assigned findings, weigh exploitability, reachability, business impact, and controls, then prioritize and escalate them through the SOC workflow. Enterprise scanning governance, remediation-program ownership, and risk acceptance remain outside this module.</p></div><dl class="m08-progress" aria-label="Saved Module 08 progress"><div><dt>Guided Lab</dt><dd>${moduleEightState.practiceComplete ? 'Complete' : 'Not started'}</dd></div><div><dt>Assessment Lab</dt><dd id="m08-status">${complete ? 'Complete' : moduleEightState.attempts ? 'In progress' : 'Not started'}</dd></div></dl></section>

      <details class="m08-section-collapsible" ${lectureOpen ? 'open' : ''}>
        <summary class="m08-section"><div class="m08-section-heading"><span class="m08-section-badge">1</span><div><p class="m08-kicker">Lecture</p><h2 id="m08-lecture">Vulnerability prioritization using contextual risk</h2></div></div></summary>
        <div class="m08-section-body">
          <section class="m08-section" id="m08-field-guide" aria-labelledby="m08-guide-title"><div class="m08-section-heading"><span>a</span><div><p class="m08-kicker">Field guide</p><h3 id="m08-guide-title">Treat vulnerability data as a decision input</h3></div></div><p class="m08-intro">The base score describes technical severity under standard assumptions. Your priority must also explain whether this instance is actually affected, reachable, exploitable, important, and protected.</p>${moduleEightConcepts()}${moduleEightLessonLoopsView()}</section>
          ${moduleEightVideoScript()}
        </div>
      </details>

      <details class="m08-section-collapsible" ${quizOpen ? 'open' : ''}>
        <summary class="m08-section"><div class="m08-section-heading"><span class="m08-section-badge">2</span><div><p class="m08-kicker">Knowledge Check</p><h2 id="m08-knowledge-check">Test your understanding of vulnerability prioritization</h2></div></div></summary>
        <div class="m08-section-body">${moduleEightQuizPanel()}</div>
      </details>

      <details class="m08-section-collapsible" ${guidedLabOpen ? 'open' : ''}>
        <summary class="m08-section"><div class="m08-section-heading"><span class="m08-section-badge">3</span><div><p class="m08-kicker">Practice It · Guided Lab</p><h2 id="m08-guided-lab">Vulnerability management practice</h2></div></div></summary>
        <div class="m08-section-body">
          <div class="m08-role"><i class="ri-user-settings-line" aria-hidden="true"></i><div><strong>Lab boundary:</strong><p>These labs open in the imported training application on this page.</p></div></div>
          <div id="m08-guided-lab-dynamic">${moduleEightGuidedLabPanel()}</div>
        </div>
      </details>

      <details class="m08-section-collapsible" ${assessmentLabOpen ? 'open' : ''}>
        <summary class="m08-section"><div class="m08-section-heading"><span class="m08-section-badge">4</span><div><p class="m08-kicker">Prove It · Assessment Lab</p><h2 id="m08-assessment-lab">Independent vulnerability remediation review</h2></div></div></summary>
        <div class="m08-section-body">
          <div id="m08-assessment-lab-dynamic">${moduleEightAssessmentLabPanel()}</div>
        </div>
      </details>
      ${moduleEightAdditionalLabs()}

      <details class="m08-section-collapsible" ${reviewOpen ? 'open' : ''}>
        <summary class="m08-section"><div class="m08-section-heading"><span class="m08-section-badge">5</span><div><p class="m08-kicker">Module Review</p><h2 id="m08-review">Key concepts and takeaways</h2></div></div></summary>
        <div class="m08-section-body">${moduleEightReview()}</div>
      </details>

      <details class="m08-section-collapsible" ${moduleEightReviewMode ? 'open' : ''}>
        <summary class="m08-section"><div class="m08-section-heading"><span class="m08-section-badge">6</span><div><p class="m08-kicker">Sources &amp; Further Reading</p><h2 id="m08-sources">Authoritative references</h2></div></div></summary>
        <div class="m08-section-body">${moduleSourcesBlock(MODULE_EIGHT_SOURCES_LIST)}</div>
      </details>
    </main>
    </div>
  </div>`;
}

function moduleEightRender(focusId) {
  const guidedRoot = document.getElementById('m08-guided-lab-dynamic');
  if (guidedRoot) guidedRoot.innerHTML = moduleEightGuidedLabPanel();
  const assessmentRoot = document.getElementById('m08-assessment-lab-dynamic');
  if (assessmentRoot) assessmentRoot.innerHTML = moduleEightAssessmentLabPanel();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
  const status = document.getElementById('m08-status');
  if (status) status.textContent = moduleEightState.completed ? 'Complete' : 'In progress';
}

function moduleEightRenderQuiz(focusId) {
  const form = document.getElementById('m08-quiz-form');
  if (!form) return;
  form.innerHTML = moduleEightQuizPanel();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function wireModuleEightQuiz() {
  const form = document.getElementById('m08-quiz-form');
  if (!form || !moduleEightQuizState) return;

  form.addEventListener('change', (event) => {
    if (!event.target.hasAttribute('data-m08-quiz-answer')) return;
    const questionId = event.target.closest('[data-question-id]')?.dataset.questionId;
    if (questionId) {
      moduleEightQuizState.answers[questionId] = event.target.value;
      moduleEightRenderQuiz();
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const answers = moduleEightQuizState.answers;
    const feedback = [];
    let correctCount = 0;

    moduleEightQuizState.selectedQuestions.forEach((selected) => {
      const question = selected.question;
      const userAnswerId = answers[question.id];
      const isCorrect = userAnswerId === question.correctId;
      if (isCorrect) correctCount++;
      feedback.push({
        questionId: question.id,
        correct: isCorrect,
        message: isCorrect ? question.feedbackCorrect : question.feedbackIncorrect,
      });
    });

    moduleEightQuizState.score = Math.round((correctCount / moduleEightQuizState.selectedQuestions.length) * 100);
    moduleEightQuizState.attempts += 1;
    moduleEightQuizState.bestScore = Math.max(moduleEightQuizState.bestScore || 0, moduleEightQuizState.score);
    moduleEightQuizState.feedback = feedback;
    moduleEightQuizState.scored = true;
    const passed = moduleEightQuizState.score >= 70;
    moduleEightQuizState.passed = passed;

    if (!passed) {
      moduleEightState.lastQuizQuestionIds = moduleEightQuizState.selectedQuestions.map((s) => s.question.id);
    }

    moduleEightSave();
    moduleEightRenderQuiz('m08-quiz-feedback');
  });

  form.addEventListener('click', (event) => {
    if (!event.target.closest('[data-m08-quiz-retry]')) return;
    event.preventDefault();
    const previousQuestionIds = moduleEightQuizState.selectedQuestions.map((s) => s.question.id);
    const selection = selectQuizQuestions(MODULE_EIGHT_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    moduleEightQuizState = {
      selectedQuestions: selection.selectedQuestions,
      questionsByAnswer: selection.questionsByAnswer,
      answers: {},
      scored: false,
      attempts: moduleEightQuizState.attempts,
      score: 0,
      bestScore: moduleEightQuizState.bestScore,
      feedback: [],
      passed: false,
    };
    moduleEightRenderQuiz();
  });
}

function wireModuleEightLab() {
  const root = document.querySelector('.m08-shell');
  if (!root || !moduleEightState) return;

  root.addEventListener('click', (event) => {
    const lessonCheck = event.target.closest('[data-m08-lesson-check]');
    if (lessonCheck) {
      const lesson = MODULE_EIGHT_LESSON_LOOPS.find((item) => item.id === lessonCheck.dataset.m08LessonCheck);
      if (!lesson) return;
      const work = moduleEightState.lessonWork[lesson.id] ||= { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
      const correct = lesson.questions.filter((question, index) => Number(work.answers[index]) === question.correct).length;
      work.checked = true;
      work.feedback = lesson.questions.map((question, index) => Number(work.answers[index]) === question.correct ? question.good : question.bad);
      work.feedback.unshift(`${correct}/${lesson.questions.length} correct. ${correct === lesson.questions.length ? 'Now complete the applied task.' : 'Review the feedback and retry the choices.'}`);
      moduleEightSave();
      moduleEightRender('m08-lessons');
      return;
    }
    const lessonTaskButton = event.target.closest('[data-m08-lesson-task-submit]');
    if (lessonTaskButton) {
      const lesson = MODULE_EIGHT_LESSON_LOOPS.find((item) => item.id === lessonTaskButton.dataset.m08LessonTaskSubmit);
      if (!lesson) return;
      const work = moduleEightState.lessonWork[lesson.id] ||= { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
      const field = root.querySelector(`[data-m08-lesson-task="${lesson.id}"]`);
      work.task = field ? field.value : work.task;
      const correct = lesson.questions.every((question, index) => Number(work.answers[index]) === question.correct);
      if (!correct || work.task.trim().length < 35) {
        work.feedback = [`Finish the check with all ${lesson.questions.length} answers correct and write at least 35 characters for the applied task.`];
        work.checked = false;
      } else {
        work.taskComplete = true;
        work.feedback = ['Lesson complete. Your applied response is saved with this learner record.'];
        work.checked = true;
      }
      moduleEightSave();
      moduleEightRender('m08-lessons');
      return;
    }
    if (event.target.closest('[data-m08-practice-complete]')) {
      moduleEightState.practiceComplete = true;
      moduleEightSave();
      const guidedRoot = document.getElementById('m08-guided-lab-dynamic');
      if (guidedRoot) guidedRoot.innerHTML = moduleEightGuidedLabPanel();
      return;
    }
  });

  root.addEventListener('input', (event) => {
    const lessonField = event.target.closest('[data-m08-lesson-task]');
    if (lessonField) {
      const lessonId = lessonField.dataset.m08LessonTask;
      const work = moduleEightState.lessonWork[lessonId] ||= { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
      work.task = lessonField.value;
      moduleEightSave();
      return;
    }
    if (event.target.matches('[data-m08-practice-notes]')) {
      moduleEightState.practiceNotes = event.target.value;
      moduleEightSave();
    }
  });

  root.addEventListener('change', (event) => {
    const input = event.target;
    if (input.matches('[data-m08-lesson-answer]')) {
      const work = moduleEightState.lessonWork[input.dataset.lessonId] ||= { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
      work.answers[input.dataset.questionIndex] = Number(input.value);
      work.checked = false;
      moduleEightSave();
    }
  });

  root.addEventListener('submit', (event) => {
    if (event.target.id !== 'm08-assessment-form') return;
    event.preventDefault();
    const notes = event.target.querySelector('#m08-assessment-notes')?.value || '';
    moduleEightState.notes = notes;
    if (notes.trim().length < 80) {
      moduleEightState.feedback = ['Write at least 80 characters describing your findings and recommended action before submitting.'];
      moduleEightSave();
      moduleEightRender('m08-assessment-lab-dynamic');
      return;
    }
    moduleEightState.attempts = (moduleEightState.attempts || 0) + 1;
    moduleEightState.lastSubmittedAt = new Date().toISOString();
    moduleEightState.completed = true;
    moduleEightState.feedback = ['Submitted. This write-up has been recorded as your Assessment Lab submission for instructor review.'];
    if (!moduleEightState.flags.includes(MODULE_EIGHT_FLAG)) moduleEightState.flags.push(MODULE_EIGHT_FLAG);
    if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(moduleEightUser, MODULE_EIGHT_PRIORITY_CATALOG_KEY, { state: 'complete', result: { notes } });
      recordLabAttempt(moduleEightUser, MODULE_EIGHT_QUEUE_CATALOG_KEY, { state: 'complete', result: { notes } });
    }
    if (typeof markModuleLabComplete === 'function') {
      markModuleLabComplete(moduleEightUser, 'soc-analyst', 'soc-08', MODULE_EIGHT_PRIORITY_CATALOG_KEY);
      markModuleLabComplete(moduleEightUser, 'soc-analyst', 'soc-08', MODULE_EIGHT_QUEUE_CATALOG_KEY);
    }
    moduleEightSave();
    const status = document.getElementById('m08-status');
    if (status) status.textContent = 'Complete';
    moduleEightRender('m08-assessment-lab-dynamic');
  });
}

function wireModuleEight() {
  const reviewToggle = document.querySelector('[data-mnav-review-toggle]');
  if (reviewToggle) {
    reviewToggle.addEventListener('click', () => {
      moduleEightReviewMode = !moduleEightReviewMode;
      const isOpen = moduleEightReviewMode;
      reviewToggle.setAttribute('aria-pressed', isOpen);
      reviewToggle.querySelector('i').className = isOpen ? 'ri-close-line' : 'ri-file-list-line';
      const label = reviewToggle.querySelector('span');
      if (label) label.textContent = isOpen ? 'Close review' : 'Review module';
      document.querySelectorAll('.m08-section-collapsible').forEach((details) => {
        if (isOpen) details.setAttribute('open', '');
        else details.removeAttribute('open');
      });
    });
  }
  wireModuleEightQuiz();
  wireModuleEightLab();
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 8, moduleKey: 'soc-08', view: viewModuleEight, wire: wireModuleEight });
