/* Module 08 — semi-independent vulnerability prioritization and exposure analysis.
 * Every asset, finding, version, score, and action is synthetic and browser-local.
 */

const MODULE_EIGHT_PRIORITY_LAB_ID = 'm08-exposure-prioritization-v1';
const MODULE_EIGHT_QUEUE_LAB_ID = 'm08-vulnerability-queue-v1';
const MODULE_EIGHT_PRIORITY_FLAG = 'M08-EXPOSURE-PRIORITIZED';
const MODULE_EIGHT_QUEUE_FLAG = 'M08-QUEUE-DISPOSITIONED';
const MODULE_EIGHT_PRIORITY_CATALOG_KEY = 'lab-vuln-prioritization';
const MODULE_EIGHT_QUEUE_CATALOG_KEY = 'lab-vuln-queue';
const MODULE_EIGHT_PASSING_SCORE = 70;
const MODULE_EIGHT_PRIORITY_MINUTES = LABS.find((item) => item.key === MODULE_EIGHT_PRIORITY_CATALOG_KEY).instructionalMinutes;
const MODULE_EIGHT_QUEUE_MINUTES = LABS.find((item) => item.key === MODULE_EIGHT_QUEUE_CATALOG_KEY).instructionalMinutes;

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

const MODULE_EIGHT_FINDINGS = [
  {
    id: 'VM-801', cve: 'CVE-2026-41017', asset: 'auth-edge-02', role: 'Customer identity gateway',
    environment: 'Production', cvss: 8.1, exploitProbability: '93%', knownExploited: true,
    exposure: 'Internet-facing', criticality: 'Critical', patch: 'Vendor fix available',
    control: 'WAF signature is monitor-only', owner: 'Identity platform', detected: '2 hours ago',
    detail: 'The affected listener handles customer authentication. A public exploit is reliable without credentials, and edge telemetry shows repeated requests matching the exploit path. The WAF records them but does not block them.',
  },
  {
    id: 'VM-802', cve: 'CVE-2026-11991', asset: 'build-agent-14', role: 'Software build runner',
    environment: 'Engineering', cvss: 9.8, exploitProbability: '82%', knownExploited: true,
    exposure: 'Admin VLAN only', criticality: 'High', patch: 'Vendor fix available',
    control: 'EDR prevention and egress allow-list active', owner: 'Developer platform', detected: '1 day ago',
    detail: 'The base score is higher than VM-801, but the runner accepts connections only from the administration VLAN. EDR blocks the observed exploit chain and outbound traffic is restricted. Remediation is still urgent, but exposure is lower.',
  },
  {
    id: 'VM-803', cve: 'CVE-2026-22008', asset: 'payroll-legacy-03', role: 'Payroll archive terminal',
    environment: 'Restricted legacy', cvss: 9.1, exploitProbability: '18%', knownExploited: false,
    exposure: 'Isolated segment', criticality: 'Critical', patch: 'No compatible fix',
    control: 'Jump host, two named admins, outbound deny', owner: 'Finance systems', detected: '12 days ago',
    detail: 'The terminal is important, but it is isolated behind a jump host, has no outbound route, and is scheduled for retirement in ten days. The control owner has verified the restrictions. Maintain and monitor the exception until retirement.',
  },
  {
    id: 'VM-804', cve: 'CVE-2026-08772', asset: 'sales-laptop-22', role: 'Managed sales workstation',
    environment: 'User endpoint', cvss: 8.8, exploitProbability: '61%', knownExploited: true,
    exposure: 'Roaming endpoint', criticality: 'Medium', patch: 'Fixed in version 131.2',
    control: 'Installed version 131.2; inventory feed still reports 129.4', owner: 'Endpoint operations', detected: '5 hours ago',
    detail: 'A live software check confirms version 131.2, which contains the fix. The scanner joined against a delayed inventory record that still lists 129.4. Validate the evidence and close the stale finding rather than scheduling another deployment.',
  },
  {
    id: 'VM-805', cve: 'CVE-2026-50112', asset: 'docs-preview-stg', role: 'Document preview service',
    environment: 'Staging', cvss: 7.5, exploitProbability: '27%', knownExploited: false,
    exposure: 'Internet route disabled', criticality: 'Low', patch: 'Approved for next window',
    control: 'Load balancer disabled; no customer data', owner: 'Web platform', detected: '3 days ago',
    detail: 'The service previously had a public route, but a reachability check confirms that its load balancer is disabled. It contains synthetic test documents only. Patch during the approved maintenance window and retest reachability.',
  },
  {
    id: 'VM-806', cve: 'CVE-2026-17330', asset: 'file-share-07', role: 'Department file share',
    environment: 'Corporate internal', cvss: 6.5, exploitProbability: '9%', knownExploited: false,
    exposure: 'Internal authenticated', criticality: 'Medium', patch: 'Vendor fix available',
    control: 'MFA admin path and network access control', owner: 'Core infrastructure', detected: '6 days ago',
    detail: 'Exploitation requires an authenticated user with share access. No public exploit or suspicious activity is known. The normal monthly window is proportionate while access controls remain verified.',
  },
];

const MODULE_EIGHT_PRIORITY_SIGNALS = [
  { id: 'internet', label: 'Internet reachability is currently verified', help: 'Attackers do not need an internal foothold to reach auth-edge-02.' },
  { id: 'exploited', label: 'Reliable exploitation is active in the wild', help: 'Exploitability changes urgency more than a base score alone.' },
  { id: 'critical', label: 'The asset supports customer authentication', help: 'Successful exploitation could affect a critical business service.' },
  { id: 'weak-control', label: 'The edge control only monitors the exploit path', help: 'The WAF does not currently reduce likelihood by blocking the request.' },
  { id: 'highest-cvss', label: 'It has the highest CVSS in the list', help: 'It does not; VM-802 has a higher base score.' },
  { id: 'oldest', label: 'It is the oldest open finding', help: 'Age can matter operationally, but VM-801 is new and still the urgent exposure.' },
];

const MODULE_EIGHT_QUEUE = [
  {
    id: 'VQ-821', asset: 'remote-access-01', cve: 'CVE-2026-33102', cvss: '8.4',
    summary: 'Internet-reachable administration portal; exploit observed; vendor fix ready.',
    evidence: 'A reachability test succeeded from outside the lab perimeter. The exploit needs no account, the portal controls privileged remote access, and the current WAF rule only logs. The owner can deploy the tested fix today.',
    answer: 'fix-now', rationale: 'Fix now: verified exposure, active exploitation, high-impact function, weak prevention, and an available tested fix all align.',
  },
  {
    id: 'VQ-822', asset: 'design-laptop-08', cve: 'CVE-2026-28440', cvss: '9.0',
    summary: 'Scanner reports a vulnerable browser, but current endpoint inventory differs.',
    evidence: 'The scan used yesterday\'s software inventory (version 129.1). A signed live inventory record and package receipt both show fixed version 132.0 installed before this queue opened.',
    answer: 'false-positive', rationale: 'Close as a validated false positive and repair the stale inventory join; do not treat one old scanner record as current state.',
  },
  {
    id: 'VQ-823', asset: 'imaging-console-03', cve: 'CVE-2026-14418', cvss: '8.7',
    summary: 'A vendor-supported clinical imaging console cannot take the patch for 21 days.',
    evidence: 'The console is on an isolated VLAN with an outbound deny rule, two named operators, and jump-host-only administration. The vendor has scheduled validation in 21 days; the service owner cannot safely stop imaging today.',
    answer: 'compensating-control', rationale: 'Time-box and verify compensating controls until the supported patch is available; record the owner, expiry, monitoring, and retest.',
  },
  {
    id: 'VQ-824', asset: 'archive-api-stg', cve: 'CVE-2026-09155', cvss: '7.4',
    summary: 'Staging API has no current route, no sensitive data, and no known exploit.',
    evidence: 'The load balancer target group is disabled and an independent reachability test fails. The approved patch window is in four days. The environment contains generated test records only.',
    answer: 'schedule', rationale: 'Schedule the patch in the near maintenance window and verify both version and reachability afterward.',
  },
];

const MODULE_EIGHT_QUEUE_EVIDENCE = [
  { id: 'live-version', label: 'Signed live version plus deployment receipt', help: 'Corroborates that VQ-822 is already fixed.' },
  { id: 'reachability', label: 'Independent external reachability test', help: 'Separates the exposed portal from the disabled staging route.' },
  { id: 'control-owner', label: 'Control-owner confirmation with an expiry date', help: 'Makes VQ-823\'s temporary control accountable and time-bound.' },
  { id: 'cvss-only', label: 'CVSS ranking with no environment context', help: 'Useful input, but insufficient validation evidence by itself.' },
  { id: 'asset-name', label: 'Asset name similarity', help: 'A naming pattern does not prove exposure, version, or control state.' },
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
    title: 'Security+ (SY0-701) Certification Overview & Objectives Summary',
    org: 'CompTIA',
    url: 'https://www.comptia.org/certifications/security',
    note: 'CompTIA Security+ exam objectives covering prioritization, remediation, risk acceptance, and compensating controls.',
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

let moduleEightPriorityState = null;
let moduleEightQueueState = null;
let moduleEightUser = null;
let moduleEightQuizState = null;
let moduleEightReviewMode = false;

function moduleEightPriorityFreshState() {
  return {
    reviewedFindings: [], filter: 'all', sort: 'context', activeFinding: '',
    priorityChoice: '', riskModel: '', treatment: '', timeline: '',
    breakdown: null, feedback: [], validationError: '', lastSubmittedAt: '',
  };
}

function moduleEightQueueFreshState() {
  return {
    reviewedItems: [], activeItem: '', decisions: {}, workflow: '', followUp: '',
    breakdown: null, feedback: [], validationError: '', lastSubmittedAt: '',
  };
}

function moduleEightLoad(user) {
  moduleEightUser = user;
  moduleEightPriorityState = LabRuntime.load(MODULE_EIGHT_PRIORITY_LAB_ID, user, moduleEightPriorityFreshState());
  moduleEightQueueState = LabRuntime.load(MODULE_EIGHT_QUEUE_LAB_ID, user, moduleEightQueueFreshState());
  if (!Array.isArray(moduleEightPriorityState.reviewedFindings)) moduleEightPriorityState.reviewedFindings = [];
  if (!Array.isArray(moduleEightPriorityState.selectedEvidence)) moduleEightPriorityState.selectedEvidence = [];
  if (!Array.isArray(moduleEightPriorityState.feedback)) moduleEightPriorityState.feedback = [];
  if (!Array.isArray(moduleEightPriorityState.flags)) moduleEightPriorityState.flags = [];
  if (!Array.isArray(moduleEightQueueState.reviewedItems)) moduleEightQueueState.reviewedItems = [];
  if (!Array.isArray(moduleEightQueueState.selectedEvidence)) moduleEightQueueState.selectedEvidence = [];
  if (!Array.isArray(moduleEightQueueState.feedback)) moduleEightQueueState.feedback = [];
  if (!Array.isArray(moduleEightQueueState.flags)) moduleEightQueueState.flags = [];
  if (!moduleEightQueueState.decisions || typeof moduleEightQueueState.decisions !== 'object') moduleEightQueueState.decisions = {};

  // Initialize quiz state
  if (!moduleEightQuizState) {
    const previousQuestionIds = moduleEightPriorityState.lastQuizQuestionIds || [];
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

function moduleEightSavePriority() {
  if (moduleEightUser && moduleEightPriorityState) LabRuntime.save(MODULE_EIGHT_PRIORITY_LAB_ID, moduleEightUser, moduleEightPriorityState);
}

function moduleEightSaveQueue() {
  if (moduleEightUser && moduleEightQueueState) LabRuntime.save(MODULE_EIGHT_QUEUE_LAB_ID, moduleEightUser, moduleEightQueueState);
}

function moduleEightStatus(state) {
  if (state.completed) return 'Complete';
  if (state.attempts || state.reviewedFindings?.length || state.reviewedItems?.length) return 'In progress';
  return 'Not started';
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

function moduleEightGetSections() {
  return [
    { id: 'lecture', title: 'Lecture', type: 'lecture', isComplete: true, scrollId: 'm08-lecture' },
    { id: 'knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: moduleEightQuizState?.passed, scrollId: 'm08-knowledge-check' },
    { id: 'prioritization-labs', title: 'Prioritization Labs', type: 'lab', isComplete: moduleEightPriorityState.completed && moduleEightQueueState.completed, scrollId: 'm08-lab' },
    { id: 'review', title: 'Module Review', type: 'review', isComplete: true, scrollId: 'm08-review' },
  ];
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

function moduleEightFilteredFindings() {
  let rows = MODULE_EIGHT_FINDINGS.filter((finding) => {
    if (moduleEightPriorityState.filter === 'internet') return finding.exposure === 'Internet-facing';
    if (moduleEightPriorityState.filter === 'exploited') return finding.knownExploited;
    if (moduleEightPriorityState.filter === 'critical') return finding.criticality === 'Critical';
    return true;
  });
  rows = rows.slice().sort((left, right) => {
    if (moduleEightPriorityState.sort === 'cvss') return right.cvss - left.cvss;
    if (moduleEightPriorityState.sort === 'age') {
      const oldestFirst = ['VM-803', 'VM-806', 'VM-805', 'VM-802', 'VM-804', 'VM-801'];
      return oldestFirst.indexOf(left.id) - oldestFirst.indexOf(right.id);
    }
    const order = ['VM-801', 'VM-802', 'VM-803', 'VM-804', 'VM-805', 'VM-806'];
    return order.indexOf(left.id) - order.indexOf(right.id);
  });
  return rows;
}

function moduleEightFindingTable() {
  const rows = moduleEightFilteredFindings();
  return `<div class="m08-table-wrap"><table class="m08-data-table">
    <caption class="m08-visually-hidden">Six synthetic findings assigned to this exercise; inspect rows for exposure context</caption>
    <thead><tr><th scope="col">Finding</th><th scope="col">Asset / role</th><th scope="col">CVSS</th><th scope="col">Exploit</th><th scope="col">Exposure</th><th scope="col">Criticality</th><th scope="col">Control / patch</th><th scope="col">Context</th></tr></thead>
    <tbody>${rows.map((finding) => {
      const reviewed = moduleEightPriorityState.reviewedFindings.includes(finding.id);
      return `<tr class="${reviewed ? 'is-reviewed' : ''}"><td data-label="Finding"><strong>${esc(finding.id)}</strong><code>${esc(finding.cve)}</code></td><td data-label="Asset / role"><code>${esc(finding.asset)}</code><span>${esc(finding.role)}</span></td><td data-label="CVSS"><span class="m08-cvss">${finding.cvss.toFixed(1)}</span></td><td data-label="Exploit"><span class="m08-pill ${finding.knownExploited ? 'is-alert' : ''}">${finding.knownExploited ? 'Known exploited' : 'No known exploit'}</span><small>${esc(finding.exploitProbability)} probability</small></td><td data-label="Exposure">${esc(finding.exposure)}</td><td data-label="Criticality">${esc(finding.criticality)}</td><td data-label="Control / patch"><span>${esc(finding.control)}</span><small>${esc(finding.patch)}</small></td><td data-label="Context"><button type="button" class="m08-inspect" data-m08-finding="${esc(finding.id)}" aria-label="Inspect ${esc(finding.id)} context"><i class="${reviewed ? 'ri-checkbox-circle-fill' : 'ri-search-eye-line'}" aria-hidden="true"></i>${reviewed ? 'Reviewed' : 'Inspect'}</button></td></tr>`;
    }).join('')}</tbody></table></div>`;
}

function moduleEightPriorityScorePanel() {
  const state = moduleEightPriorityState;
  if (state.validationError) return `<div class="m08-validation" id="m08-priority-feedback" role="alert" tabindex="-1"><i class="ri-information-line" aria-hidden="true"></i><div><strong>Finish the priority brief</strong><p>${esc(state.validationError)}</p></div></div>`;
  if (!state.attempts || !state.breakdown) return `<div class="m08-score-empty" id="m08-priority-feedback" role="status">Scoring: observation 25 · analysis 30 · decision 25 · communication 20. Passing score: ${MODULE_EIGHT_PASSING_SCORE}.</div>`;
  const passed = state.score >= MODULE_EIGHT_PASSING_SCORE;
  const b = state.breakdown;
  return `<section class="m08-score ${passed ? 'is-pass' : 'is-remediate'}" id="m08-priority-feedback" tabindex="-1" aria-live="polite" aria-labelledby="m08-priority-score-title">
    <div class="m08-score-heading"><div><p class="m08-kicker">Attempt ${state.attempts} · best ${state.bestScore}/100</p><h4 id="m08-priority-score-title">${state.score}/100 — ${passed ? 'Priority defended' : 'Reweight the exposure context'}</h4></div><span>${state.score}</span></div>
    <div class="m08-score-grid" aria-label="Priority lab score breakdown"><div><strong>${b.observation}/25</strong><span>Observation</span><small>Review depth and evidence signals</small></div><div><strong>${b.analysis}/30</strong><span>Analysis</span><small>Priority target and risk model</small></div><div><strong>${b.decision}/25</strong><span>Decision</span><small>Treatment and timeline</small></div><div><strong>${b.communication}/20</strong><span>Communication</span><small>Evidence-based remediation brief</small></div></div>
    <ul class="m08-feedback-list">${state.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
    <div class="m08-expert-model"><strong>Expert reasoning</strong><p>VM-801 is not the highest base score, but it is the first remediation priority: the identity gateway is internet reachable, supports a critical service, has reliable active exploitation, and its WAF is only monitoring. Patch it within 24 hours, move the WAF signature to an approved blocking mode as an interim measure, then verify the running version and external reachability.</p></div>
  </section>`;
}

function moduleEightRadioOptions(name, selected, options) {
  return `<div class="m08-option-list">${options.map((option) => `<label><input type="radio" name="${esc(name)}" value="${esc(option.id)}" ${selected === option.id ? 'checked' : ''} /><span><strong>${esc(option.label)}</strong><small>${esc(option.help)}</small></span></label>`).join('')}</div>`;
}

function moduleEightPriorityLab() {
  const active = MODULE_EIGHT_FINDINGS.find((finding) => finding.id === moduleEightPriorityState.activeFinding);
  return `<section class="m08-lab-card" aria-labelledby="m08-priority-title">
    <div class="m08-lab-heading"><div><p class="m08-kicker">Lab 1 · semi-independent · ${formatInstructionalMinutes(MODULE_EIGHT_PRIORITY_MINUTES)}</p><h2 id="m08-priority-title">Exposure-driven remediation priority</h2></div><span class="m08-lab-status">${moduleEightStatus(moduleEightPriorityState)}</span></div>
    <div class="m08-objective"><i class="ri-focus-3-line" aria-hidden="true"></i><div><strong>Measurable objective</strong><p>Prioritize one finding from six assigned assets and defend the first remediation using validated exploitability, exposure, business criticality, and control strength with at least ${MODULE_EIGHT_PASSING_SCORE}/100.</p></div></div>
    <div class="m08-scope-note"><i class="ri-shield-keyhole-line" aria-hidden="true"></i><p><strong>Bounded assignment:</strong> this is a six-asset portfolio prepared for the exercise. There is no enterprise inventory, hidden tenant, or route into a wider console.</p></div>
    <div class="m08-workbench" aria-labelledby="m08-workbench-title"><div class="m08-panel-heading"><div><p class="m08-kicker">Observation workspace</p><h3 id="m08-workbench-title">Validate before you rank</h3></div><span>${moduleEightPriorityState.reviewedFindings.length}/6 inspected</span></div>
      <div class="m08-toolbar" aria-label="Finding filters and sort"><div role="group" aria-label="Filter findings">${[
        ['all', 'All 6'], ['internet', 'Internet-facing'], ['exploited', 'Known exploited'], ['critical', 'Critical assets'],
      ].map((item) => `<button type="button" data-m08-filter="${item[0]}" aria-pressed="${moduleEightPriorityState.filter === item[0]}">${item[1]}</button>`).join('')}</div><label for="m08-sort">Sort <select id="m08-sort" name="prioritySort"><option value="context" ${moduleEightPriorityState.sort === 'context' ? 'selected' : ''}>Contextual priority</option><option value="cvss" ${moduleEightPriorityState.sort === 'cvss' ? 'selected' : ''}>CVSS high to low</option><option value="age" ${moduleEightPriorityState.sort === 'age' ? 'selected' : ''}>Finding age</option></select></label></div>
      ${moduleEightFindingTable()}
      ${active ? `<aside class="m08-detail" id="m08-finding-detail" tabindex="-1"><button type="button" data-m08-close-finding aria-label="Close finding detail"><i class="ri-close-line" aria-hidden="true"></i></button><p class="m08-kicker">${esc(active.id)} · validated context</p><h4>${esc(active.asset)} · ${esc(active.role)}</h4><p>${esc(active.detail)}</p><dl><div><dt>Owner</dt><dd>${esc(active.owner)}</dd></div><div><dt>Detected</dt><dd>${esc(active.detected)}</dd></div><div><dt>Environment</dt><dd>${esc(active.environment)}</dd></div></dl></aside>` : ''}
    </div>
    <form class="m08-artifact" id="m08-priority-form" novalidate><div class="m08-panel-heading"><div><p class="m08-kicker">Scored artifact</p><h3>Write the remediation priority brief</h3></div><span>Retry allowed</span></div>
      <fieldset class="m08-fieldset"><legend><span>1</span>Select the evidence that makes the first priority urgent</legend><p class="m08-help">Choose signals, not conclusions. Extra unsupported signals reduce observation credit.</p><div class="m08-check-grid">${MODULE_EIGHT_PRIORITY_SIGNALS.map((signal) => `<label><input type="checkbox" name="priorityEvidence" value="${esc(signal.id)}" ${moduleEightPriorityState.selectedEvidence.includes(signal.id) ? 'checked' : ''} /><span><strong>${esc(signal.label)}</strong><small>${esc(signal.help)}</small></span></label>`).join('')}</div></fieldset>
      <fieldset class="m08-fieldset"><legend><span>2</span>Which finding should be remediated first?</legend>${moduleEightRadioOptions('priorityChoice', moduleEightPriorityState.priorityChoice, MODULE_EIGHT_FINDINGS.map((finding) => ({ id: finding.id, label: `${finding.id} · ${finding.asset} · ${finding.cve}`, help: `${finding.cvss.toFixed(1)} CVSS · ${finding.exposure} · ${finding.criticality}` })))}</fieldset>
      <fieldset class="m08-fieldset"><legend><span>3</span>Which prioritization model supports your selection?</legend>${moduleEightRadioOptions('riskModel', moduleEightPriorityState.riskModel, [
        { id: 'contextual-risk', label: 'Validate and combine exploitability, exposure, impact, and effective controls', help: 'CVSS remains an input, not the complete decision.' },
        { id: 'cvss-only', label: 'Always remediate the highest CVSS first', help: 'Ignores reachability, current version, controls, and threat activity.' },
        { id: 'oldest-first', label: 'Always remediate the oldest open record first', help: 'Backlog age alone does not express present likelihood or impact.' },
      ])}</fieldset>
      <fieldset class="m08-fieldset"><legend><span>4</span>Choose the treatment and target</legend><div class="m08-two-column">${moduleEightRadioOptions('treatment', moduleEightPriorityState.treatment, [
        { id: 'emergency-remediation', label: 'Emergency patch plus approved interim WAF blocking', help: 'Reduce exposure now, then verify the running version.' },
        { id: 'accept', label: 'Accept the risk without another control', help: 'Not proportionate to active exploitation of a critical public service.' },
        { id: 'scan-again', label: 'Wait for next month\'s scan before acting', help: 'The affected version and current reachability are already validated.' },
      ])}${moduleEightRadioOptions('timeline', moduleEightPriorityState.timeline, [
        { id: 'within-24h', label: 'Complete within 24 hours and retest', help: 'Matches verified likelihood, impact, and fix readiness.' },
        { id: 'next-month', label: 'Use the next monthly window', help: 'Too slow for an actively exploited public identity service.' },
        { id: 'no-date', label: 'Assign no due date', help: 'An action without accountable timing is not a remediation plan.' },
      ])}</div></fieldset>
      <label class="m08-note-label" for="m08-priority-notes"><span>5</span><strong>Communicate the priority</strong></label><p class="m08-help">Name the finding and asset, cite exploitability and exposure, state the action and target, and include verification.</p><textarea id="m08-priority-notes" name="priorityNotes" rows="5" maxlength="900" aria-describedby="m08-priority-count" placeholder="Prioritize VM-… because… The owner should… by… Verify…">${esc(moduleEightPriorityState.notes)}</textarea><p class="m08-note-count" id="m08-priority-count"><span>${moduleEightPriorityState.notes.length}</span>/900 characters</p>
      <details class="m08-hint"><summary>Need a prioritization hint?</summary><p>Compare VM-801 and VM-802. One has the higher CVSS; the other is reachable without credentials, protects customer authentication, shows exploit traffic, and lacks a blocking control.</p></details>
      <div class="m08-actions"><button type="submit" class="m08-submit"><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Score priority brief</button><button type="button" class="m08-reset" data-m08-reset-priority><i class="ri-restart-line" aria-hidden="true"></i> Reset Lab 1 only</button></div>
      ${moduleEightPriorityScorePanel()}
    </form>
  </section>`;
}

function moduleEightQueueScorePanel() {
  const state = moduleEightQueueState;
  if (state.validationError) return `<div class="m08-validation" id="m08-queue-feedback" role="alert" tabindex="-1"><i class="ri-information-line" aria-hidden="true"></i><div><strong>Finish the queue handoff</strong><p>${esc(state.validationError)}</p></div></div>`;
  if (!state.attempts || !state.breakdown) return `<div class="m08-score-empty" id="m08-queue-feedback" role="status">Scoring: observation 25 · analysis 30 · decision 25 · communication 20. Passing score: ${MODULE_EIGHT_PASSING_SCORE}.</div>`;
  const passed = state.score >= MODULE_EIGHT_PASSING_SCORE;
  const b = state.breakdown;
  return `<section class="m08-score ${passed ? 'is-pass' : 'is-remediate'}" id="m08-queue-feedback" tabindex="-1" aria-live="polite" aria-labelledby="m08-queue-score-title"><div class="m08-score-heading"><div><p class="m08-kicker">Attempt ${state.attempts} · best ${state.bestScore}/100</p><h4 id="m08-queue-score-title">${state.score}/100 — ${passed ? 'Queue decisions ready for handoff' : 'Validate the queue before handoff'}</h4></div><span>${state.score}</span></div>
    <div class="m08-score-grid" aria-label="Queue lab score breakdown"><div><strong>${b.observation}/25</strong><span>Observation</span><small>Four reviews and validation evidence</small></div><div><strong>${b.analysis}/30</strong><span>Analysis</span><small>Four supported dispositions</small></div><div><strong>${b.decision}/25</strong><span>Decision</span><small>Ownership and closed-loop verification</small></div><div><strong>${b.communication}/20</strong><span>Communication</span><small>Actionable queue handoff</small></div></div>
    <ul class="m08-feedback-list">${state.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul><div class="m08-expert-model"><strong>Expert queue reasoning</strong><p>Fix VQ-821 now; close VQ-822 only after recording the corroborated current version and repairing the stale inventory join; time-box the verified controls for VQ-823 until its supported patch; and schedule VQ-824 for the near window because independent testing confirms no route. Every item still needs an owner, due date or expiry, and a retest.</p></div></section>`;
}

function moduleEightQueueLab() {
  const active = MODULE_EIGHT_QUEUE.find((item) => item.id === moduleEightQueueState.activeItem);
  const dispositions = [
    ['fix-now', 'Fix now'], ['schedule', 'Schedule remediation'], ['compensating-control', 'Apply / verify compensating control'],
    ['accept-risk', 'Accept risk'], ['escalate', 'Escalate for more investigation'], ['false-positive', 'Close validated false positive'],
  ];
  return `<section class="m08-lab-card" aria-labelledby="m08-queue-title"><div class="m08-lab-heading"><div><p class="m08-kicker">Lab 2 · semi-independent · ${formatInstructionalMinutes(MODULE_EIGHT_QUEUE_MINUTES)}</p><h2 id="m08-queue-title">SOC finding decision queue</h2></div><span class="m08-lab-status">${moduleEightStatus(moduleEightQueueState)}</span></div>
    <div class="m08-objective"><i class="ri-list-check-3" aria-hidden="true"></i><div><strong>Measurable objective</strong><p>Validate four assigned findings, give each an evidence-supported disposition, and produce an owned, time-bound, verifiable handoff with at least ${MODULE_EIGHT_PASSING_SCORE}/100.</p></div></div>
    <div class="m08-queue" aria-label="Four synthetic vulnerability queue items">${MODULE_EIGHT_QUEUE.map((item) => {
      const reviewed = moduleEightQueueState.reviewedItems.includes(item.id);
      return `<article class="${reviewed ? 'is-reviewed' : ''}"><div class="m08-queue-id"><span>${esc(item.id)}</span><code>${esc(item.cve)}</code></div><div><h3>${esc(item.asset)}</h3><p>${esc(item.summary)}</p></div><button type="button" class="m08-inspect" data-m08-queue-item="${esc(item.id)}"><i class="${reviewed ? 'ri-checkbox-circle-fill' : 'ri-search-eye-line'}" aria-hidden="true"></i>${reviewed ? 'Reviewed' : 'Inspect'}</button><label>Disposition<select name="queueDecision" data-m08-decision="${esc(item.id)}"><option value="">Choose…</option>${dispositions.map((option) => `<option value="${option[0]}" ${moduleEightQueueState.decisions[item.id] === option[0] ? 'selected' : ''}>${option[1]}</option>`).join('')}</select></label></article>`;
    }).join('')}</div>
    ${active ? `<aside class="m08-detail m08-queue-detail" id="m08-queue-detail" tabindex="-1"><button type="button" data-m08-close-queue aria-label="Close queue detail"><i class="ri-close-line" aria-hidden="true"></i></button><p class="m08-kicker">${esc(active.id)} · validation record</p><h4>${esc(active.asset)} · ${esc(active.cve)} · CVSS ${esc(active.cvss)}</h4><p>${esc(active.evidence)}</p></aside>` : ''}
    <form class="m08-artifact" id="m08-queue-form" novalidate><div class="m08-panel-heading"><div><p class="m08-kicker">Scored artifact</p><h3>Close the decision loop</h3></div><span>${moduleEightQueueState.reviewedItems.length}/4 inspected</span></div>
      <fieldset class="m08-fieldset"><legend><span>1</span>Select the validation evidence you would preserve</legend><p class="m08-help">Keep corroborating evidence that another analyst can reproduce.</p><div class="m08-check-grid">${MODULE_EIGHT_QUEUE_EVIDENCE.map((item) => `<label><input type="checkbox" name="queueEvidence" value="${esc(item.id)}" ${moduleEightQueueState.selectedEvidence.includes(item.id) ? 'checked' : ''} /><span><strong>${esc(item.label)}</strong><small>${esc(item.help)}</small></span></label>`).join('')}</div></fieldset>
      <fieldset class="m08-fieldset"><legend><span>2</span>How should the queue be operationalized?</legend>${moduleEightRadioOptions('workflow', moduleEightQueueState.workflow, [
        { id: 'owners-and-tickets', label: 'Create owned tickets with due dates or exception expiries', help: 'Route work to the asset owner while vulnerability management tracks the risk.' },
        { id: 'analyst-patches-all', label: 'Have the analyst patch every system directly', help: 'Ignores change ownership, testing, and operational authorization.' },
        { id: 'spreadsheet-only', label: 'Record the decisions without assigning owners', help: 'A list alone cannot drive remediation or accountability.' },
      ])}</fieldset>
      <fieldset class="m08-fieldset"><legend><span>3</span>What closes each queue item?</legend>${moduleEightRadioOptions('followUp', moduleEightQueueState.followUp, [
        { id: 'timebound-verify', label: 'Retest the version or control, record evidence, and reopen failures', help: 'Verification closes the loop; an exception must also expire.' },
        { id: 'ticket-created', label: 'Close as soon as a ticket is created', help: 'A work request is not proof that exposure changed.' },
        { id: 'owner-says-done', label: 'Close on an informal owner message', help: 'Capture reproducible technical validation instead.' },
      ])}</fieldset>
      <label class="m08-note-label" for="m08-queue-notes"><span>4</span><strong>Write the queue handoff</strong></label><p class="m08-help">Summarize the four dispositions, owners/timing, and what must be retested. Separate a validated false positive from accepted risk.</p><textarea id="m08-queue-notes" name="queueNotes" rows="6" maxlength="1100" aria-describedby="m08-queue-count" placeholder="VQ-821: fix now… VQ-822: close as validated false positive…">${esc(moduleEightQueueState.notes)}</textarea><p class="m08-note-count" id="m08-queue-count"><span>${moduleEightQueueState.notes.length}</span>/1100 characters</p>
      <details class="m08-hint"><summary>Need a queue hint?</summary><p>A stale record with two current-version proofs is not accepted risk. A system that cannot yet be patched still needs a time-boxed control, owner, expiry, and retest.</p></details>
      <div class="m08-actions"><button type="submit" class="m08-submit"><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Score queue handoff</button><button type="button" class="m08-reset" data-m08-reset-queue><i class="ri-restart-line" aria-hidden="true"></i> Reset Lab 2 only</button></div>${moduleEightQueueScorePanel()}
    </form>
  </section>`;
}

function moduleEightDynamic() {
  return `${moduleEightPriorityLab()}${moduleEightQueueLab()}`;
}

function viewModuleEight(user, program) {
  moduleEightLoad(user);
  const module = program.modules['soc-08'];
  const sections = moduleEightGetSections();
  const completeCount = Number(moduleEightPriorityState.completed) + Number(moduleEightQueueState.completed);
  const lectureOpen = moduleEightReviewMode || !sections[0].isComplete;
  const quizOpen = moduleEightReviewMode || (moduleEightQuizState && !moduleEightQuizState.passed);
  const labOpen = moduleEightReviewMode || !sections[2].isComplete;
  const reviewOpen = moduleEightReviewMode;

  return `<div class="m08-shell">
    ${moduleTopbar(user, program)}
    ${moduleProgressShell(sections, { reviewMode: moduleEightReviewMode })}
    <main class="m08-main">
      <section class="m08-hero" aria-labelledby="m08-title"><div><p class="m08-kicker">Module 08 · ${formatInstructionalMinutes(module.durationMinutes)} · SOC prioritization</p><h1 id="m08-title">${esc(module.title)}</h1><p class="m08-lede">Validate assigned findings, weigh exploitability, reachability, business impact, and controls, then prioritize and escalate them through the SOC workflow. Enterprise scanning governance, remediation-program ownership, and risk acceptance remain outside this module.</p><a class="m08-hero-action" href="#m08-lecture"><i class="ri-compass-3-line" aria-hidden="true"></i> Review the prioritization model</a></div><dl class="m08-progress" aria-label="Saved Module 08 progress"><div><dt>Scoped assets</dt><dd>10 total</dd></div><div><dt>Practical labs</dt><dd>${completeCount}/${module.labs} passed</dd></div><div><dt>Module status</dt><dd id="m08-status">${completeCount === module.labs ? 'Complete' : completeCount || moduleEightPriorityState.attempts || moduleEightQueueState.attempts ? 'In progress' : 'Not started'}</dd></div></dl></section>

      <details class="m08-section-collapsible" ${lectureOpen ? 'open' : ''}>
        <summary class="m08-section"><div class="m08-section-heading"><span class="m08-section-badge">1</span><div><p class="m08-kicker">Lecture</p><h2 id="m08-lecture">Vulnerability prioritization using contextual risk</h2></div></div></summary>
        <div class="m08-section-body">
          <section class="m08-section" id="m08-field-guide" aria-labelledby="m08-guide-title"><div class="m08-section-heading"><span>a</span><div><p class="m08-kicker">Field guide</p><h3 id="m08-guide-title">Treat vulnerability data as a decision input</h3></div></div><p class="m08-intro">The base score describes technical severity under standard assumptions. Your priority must also explain whether this instance is actually affected, reachable, exploitable, important, and protected.</p>${moduleEightConcepts()}</section>
          ${moduleEightVideoScript()}
        </div>
      </details>

      <details class="m08-section-collapsible" ${quizOpen ? 'open' : ''}>
        <summary class="m08-section"><div class="m08-section-heading"><span class="m08-section-badge">2</span><div><p class="m08-kicker">Knowledge Check</p><h2 id="m08-knowledge-check">Test your understanding of vulnerability prioritization</h2></div></div></summary>
        <div class="m08-section-body">${moduleEightQuizPanel()}</div>
      </details>

      <details class="m08-section-collapsible" ${labOpen ? 'open' : ''}>
        <summary class="m08-section"><div class="m08-section-heading"><span class="m08-section-badge">3</span><div><p class="m08-kicker">Prioritization Labs</p><h2 id="m08-lab">Contextual findings analysis</h2></div></div></summary>
        <div class="m08-section-body">
          <div class="m08-role"><i class="ri-user-settings-line" aria-hidden="true"></i><div><strong>Your role: SOC analyst reviewing assigned findings</strong><p>Work only the records below, validate their context, rank what needs attention, and escalate an owned next step. You do not administer an enterprise vulnerability program, approve risk acceptance, or control other business units.</p></div></div>
          <div id="m08-dynamic">${moduleEightDynamic()}</div>
        </div>
      </details>

      <details class="m08-section-collapsible" ${reviewOpen ? 'open' : ''}>
        <summary class="m08-section"><div class="m08-section-heading"><span class="m08-section-badge">4</span><div><p class="m08-kicker">Module Review</p><h2 id="m08-review">Key concepts and takeaways</h2></div></div></summary>
        <div class="m08-section-body">${moduleEightReview()}</div>
      </details>

      <details class="m08-section-collapsible" ${moduleEightReviewMode ? 'open' : ''}>
        <summary class="m08-section"><div class="m08-section-heading"><span class="m08-section-badge">5</span><div><p class="m08-kicker">Sources &amp; Further Reading</p><h2 id="m08-sources">Authoritative references</h2></div></div></summary>
        <div class="m08-section-body">${moduleSourcesBlock(MODULE_EIGHT_SOURCES_LIST)}</div>
      </details>
    </main>
  </div>`;
}

function moduleEightExactSelection(selected, expected, points) {
  const chosen = new Set(selected);
  const correct = expected.filter((item) => chosen.has(item)).length;
  const extras = selected.filter((item) => !expected.includes(item)).length;
  return Math.max(0, Math.round((correct / expected.length) * points) - extras * Math.ceil(points / expected.length));
}

function moduleEightPriorityScore() {
  const review = Math.min(8, moduleEightPriorityState.reviewedFindings.length * 2);
  const signals = moduleEightExactSelection(moduleEightPriorityState.selectedEvidence, ['internet', 'exploited', 'critical', 'weak-control'], 17);
  const priority = moduleEightPriorityState.priorityChoice === 'VM-801' ? 20 : 0;
  const model = moduleEightPriorityState.riskModel === 'contextual-risk' ? 10 : 0;
  const treatment = moduleEightPriorityState.treatment === 'emergency-remediation' ? 15 : 0;
  const timeline = moduleEightPriorityState.timeline === 'within-24h' ? 10 : 0;
  const note = moduleEightPriorityState.notes.trim().toLowerCase();
  const communication = (note.length >= 120 ? 4 : 0)
    + (/(vm-801|auth-edge-02)/.test(note) ? 4 : 0)
    + (/(exploit|active|known)/.test(note) && /(internet|public|reachable)/.test(note) ? 4 : 0)
    + (/(patch|waf|block)/.test(note) && /(24|today|immediate|urgent)/.test(note) ? 4 : 0)
    + (/(verify|retest|version|reachability)/.test(note) ? 4 : 0);
  const observation = review + signals;
  const analysis = priority + model;
  const decision = treatment + timeline;
  return {
    score: observation + analysis + decision + communication,
    breakdown: { observation, analysis, decision, communication },
    feedback: [
      review === 8 ? 'Review depth: Sufficient context was inspected before ranking.' : `Review depth: ${review}/8. Inspect at least four distinct findings so the recommendation reflects comparison, not a single-row reaction.`,
      signals === 17 ? 'Evidence: Correct. Current reachability, exploitation, critical service impact, and monitor-only control explain the urgency.' : `Evidence: ${signals}/17. Preserve the four contextual signals; CVSS rank and record age are distractors here.`,
      priority && model ? 'Analysis: Correct. VM-801 leads under a contextual model even though VM-802 has the higher CVSS.' : `Analysis: ${analysis}/30. Choose VM-801 and a model that combines validation, exploitability, exposure, impact, and controls.`,
      treatment && timeline ? 'Decision: Proportionate. Patch within 24 hours, use approved interim blocking, and retest.' : `Decision: ${decision}/25. Active exploitation of a critical public service needs an emergency target, not the monthly queue.`,
      communication === 20 ? 'Communication: The brief names the target, evidence, action, timing, and verification.' : `Communication: ${communication}/20. Include VM-801/auth-edge-02, exploit and public exposure, the immediate patch/control target, and a verification step in at least 120 characters.`,
    ],
  };
}

function moduleEightQueueScore() {
  const reviews = moduleEightQueueState.reviewedItems.length === MODULE_EIGHT_QUEUE.length ? 12 : moduleEightQueueState.reviewedItems.length * 3;
  const evidence = moduleEightExactSelection(moduleEightQueueState.selectedEvidence, ['live-version', 'reachability', 'control-owner'], 13);
  const correctDecisions = MODULE_EIGHT_QUEUE.filter((item) => moduleEightQueueState.decisions[item.id] === item.answer);
  const analysis = Math.round((correctDecisions.length / MODULE_EIGHT_QUEUE.length) * 30);
  const workflow = moduleEightQueueState.workflow === 'owners-and-tickets' ? 15 : 0;
  const followUp = moduleEightQueueState.followUp === 'timebound-verify' ? 10 : 0;
  const note = moduleEightQueueState.notes.trim().toLowerCase();
  const communication = (note.length >= 140 ? 4 : 0)
    + (/(vq-821|remote-access-01)/.test(note) && /(fix|patch|immediate|now)/.test(note) ? 4 : 0)
    + (/(vq-822|design-laptop-08)/.test(note) && /(false positive|current version|132\.0|stale)/.test(note) ? 4 : 0)
    + (/(vq-823|imaging-console-03)/.test(note) && /(compensat|segment|21 days|time.box)/.test(note) ? 4 : 0)
    + (/(vq-824|archive-api-stg)/.test(note) && /(schedul|window|four days|4 days)/.test(note) && /(verify|retest|owner|due|expir)/.test(note) ? 4 : 0);
  const observation = reviews + evidence;
  const decision = workflow + followUp;
  return {
    score: observation + analysis + decision + communication,
    breakdown: { observation, analysis, decision, communication },
    feedback: [
      reviews === 12 ? 'Review depth: All four queue records were inspected.' : `Review depth: ${reviews}/12. Open every validation record before closing the queue.`,
      evidence === 13 ? 'Evidence: Correct. Current version, independent reachability, and a time-bound control record are reproducible validation artifacts.' : `Evidence: ${evidence}/13. Preserve corroborating technical and owner evidence; names and severity-only ranking are not validation.`,
      analysis === 30 ? 'Dispositions: Correct—fix now, validated false positive, compensating control, then scheduled remediation.' : `Dispositions: ${analysis}/30. Revisit ${MODULE_EIGHT_QUEUE.filter((item) => moduleEightQueueState.decisions[item.id] !== item.answer).map((item) => item.id).join(', ')} and compare each record with its validated version, route, controls, and fix readiness.`,
      decision === 25 ? 'Workflow: Correct. Owned work, time-bound exceptions, technical retesting, and reopen-on-failure close the loop.' : `Workflow: ${decision}/25. Ticket creation starts work; verified risk reduction closes it.`,
      communication === 20 ? 'Communication: Every disposition is explicit, bounded, and verifiable.' : `Communication: ${communication}/20. Cover all four item IDs, distinguish false positive from risk treatment, assign timing, and state how results will be verified in at least 140 characters.`,
    ],
  };
}

function moduleEightRender(focusId) {
  const root = document.getElementById('m08-dynamic');
  if (!root) return;
  root.innerHTML = moduleEightDynamic();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
  const completeCount = Number(moduleEightPriorityState.completed) + Number(moduleEightQueueState.completed);
  const status = document.getElementById('m08-status');
  if (status) status.textContent = completeCount === 2 ? 'Complete' : 'In progress';
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
      moduleEightPriorityState.lastQuizQuestionIds = moduleEightQuizState.selectedQuestions.map((s) => s.question.id);
    }

    moduleEightSavePriority();
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
  const root = document.getElementById('m08-dynamic');
  if (!root || !moduleEightPriorityState || !moduleEightQueueState) return;

  root.addEventListener('click', (event) => {
    const filter = event.target.closest('[data-m08-filter]');
    if (filter) {
      moduleEightPriorityState.filter = filter.dataset.m08Filter;
      moduleEightPriorityState.activeFinding = '';
      moduleEightSavePriority();
      moduleEightRender('m08-workbench-title');
      return;
    }
    const findingButton = event.target.closest('[data-m08-finding]');
    if (findingButton) {
      const id = findingButton.dataset.m08Finding;
      moduleEightPriorityState.activeFinding = id;
      if (!moduleEightPriorityState.reviewedFindings.includes(id)) moduleEightPriorityState.reviewedFindings.push(id);
      moduleEightSavePriority();
      moduleEightRender('m08-finding-detail');
      return;
    }
    if (event.target.closest('[data-m08-close-finding]')) {
      moduleEightPriorityState.activeFinding = '';
      moduleEightSavePriority();
      moduleEightRender('m08-workbench-title');
      return;
    }
    const queueButton = event.target.closest('[data-m08-queue-item]');
    if (queueButton) {
      const id = queueButton.dataset.m08QueueItem;
      moduleEightQueueState.activeItem = id;
      if (!moduleEightQueueState.reviewedItems.includes(id)) moduleEightQueueState.reviewedItems.push(id);
      moduleEightSaveQueue();
      moduleEightRender('m08-queue-detail');
      return;
    }
    if (event.target.closest('[data-m08-close-queue]')) {
      moduleEightQueueState.activeItem = '';
      moduleEightSaveQueue();
      moduleEightRender('m08-queue-title');
      return;
    }
    if (event.target.closest('[data-m08-reset-priority]')) {
      if (typeof window.confirm === 'function' && !window.confirm('Reset Lab 1 only? Lab 2 and course progress will stay unchanged.')) return;
      moduleEightPriorityState = LabRuntime.reset(MODULE_EIGHT_PRIORITY_LAB_ID, moduleEightUser, moduleEightPriorityFreshState());
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleEightUser, 'soc-analyst', 'soc-08', MODULE_EIGHT_PRIORITY_CATALOG_KEY, false);
      moduleEightRender('m08-priority-title');
      return;
    }
    if (event.target.closest('[data-m08-reset-queue]')) {
      if (typeof window.confirm === 'function' && !window.confirm('Reset Lab 2 only? Lab 1 and course progress will stay unchanged.')) return;
      moduleEightQueueState = LabRuntime.reset(MODULE_EIGHT_QUEUE_LAB_ID, moduleEightUser, moduleEightQueueFreshState());
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleEightUser, 'soc-analyst', 'soc-08', MODULE_EIGHT_QUEUE_CATALOG_KEY, false);
      moduleEightRender('m08-queue-title');
    }
  });

  root.addEventListener('input', (event) => {
    if (event.target.name === 'priorityNotes') {
      moduleEightPriorityState.notes = event.target.value;
      root.querySelector('#m08-priority-count span').textContent = String(event.target.value.length);
      moduleEightSavePriority();
    }
    if (event.target.name === 'queueNotes') {
      moduleEightQueueState.notes = event.target.value;
      root.querySelector('#m08-queue-count span').textContent = String(event.target.value.length);
      moduleEightSaveQueue();
    }
  });

  root.addEventListener('change', (event) => {
    const input = event.target;
    if (input.name === 'prioritySort') {
      moduleEightPriorityState.sort = input.value;
      moduleEightSavePriority();
      moduleEightRender('m08-workbench-title');
      return;
    }
    if (input.name === 'priorityEvidence') {
      moduleEightPriorityState.selectedEvidence = input.checked ? [...new Set([...moduleEightPriorityState.selectedEvidence, input.value])] : moduleEightPriorityState.selectedEvidence.filter((item) => item !== input.value);
      moduleEightPriorityState.validationError = '';
      moduleEightSavePriority();
      return;
    }
    if (['priorityChoice', 'riskModel', 'treatment', 'timeline'].includes(input.name)) {
      moduleEightPriorityState[input.name] = input.value;
      moduleEightPriorityState.validationError = '';
      moduleEightSavePriority();
      return;
    }
    if (input.name === 'queueDecision') {
      moduleEightQueueState.decisions[input.dataset.m08Decision] = input.value;
      moduleEightQueueState.validationError = '';
      moduleEightSaveQueue();
      return;
    }
    if (input.name === 'queueEvidence') {
      moduleEightQueueState.selectedEvidence = input.checked ? [...new Set([...moduleEightQueueState.selectedEvidence, input.value])] : moduleEightQueueState.selectedEvidence.filter((item) => item !== input.value);
      moduleEightQueueState.validationError = '';
      moduleEightSaveQueue();
      return;
    }
    if (['workflow', 'followUp'].includes(input.name)) {
      moduleEightQueueState[input.name] = input.value;
      moduleEightQueueState.validationError = '';
      moduleEightSaveQueue();
    }
  });

  root.addEventListener('submit', (event) => {
    if (event.target.id === 'm08-priority-form') {
      event.preventDefault();
      moduleEightPriorityState.notes = event.target.elements.priorityNotes.value;
      const missing = [];
      if (moduleEightPriorityState.reviewedFindings.length < 4) missing.push('inspect at least four findings');
      if (!moduleEightPriorityState.selectedEvidence.length) missing.push('select evidence signals');
      if (!moduleEightPriorityState.priorityChoice || !moduleEightPriorityState.riskModel) missing.push('complete the priority analysis');
      if (!moduleEightPriorityState.treatment || !moduleEightPriorityState.timeline) missing.push('choose treatment and timing');
      if (moduleEightPriorityState.notes.trim().length < 120) missing.push('write a 120-character remediation brief');
      if (missing.length) {
        moduleEightPriorityState.validationError = `Add: ${missing.join(', ')}. Your current work is saved.`;
        moduleEightSavePriority();
        moduleEightRender('m08-priority-feedback');
        return;
      }
      const result = moduleEightPriorityScore();
      moduleEightPriorityState.attempts += 1;
      moduleEightPriorityState.score = result.score;
      moduleEightPriorityState.bestScore = Math.max(moduleEightPriorityState.bestScore || 0, result.score);
      moduleEightPriorityState.breakdown = result.breakdown;
      moduleEightPriorityState.feedback = result.feedback;
      moduleEightPriorityState.validationError = '';
      moduleEightPriorityState.lastSubmittedAt = new Date().toISOString();
      const priorityPassed = result.score >= MODULE_EIGHT_PASSING_SCORE;
      if (typeof recordLabAttempt === 'function') {
        recordLabAttempt(moduleEightUser, MODULE_EIGHT_PRIORITY_CATALOG_KEY, {
          state: priorityPassed ? 'complete' : 'in_progress',
          score: result.score,
          result: { breakdown: result.breakdown, feedback: result.feedback, attempts: moduleEightPriorityState.attempts },
        });
      }
      if (priorityPassed) {
        moduleEightPriorityState.completed = true;
        if (!moduleEightPriorityState.flags.includes(MODULE_EIGHT_PRIORITY_FLAG)) moduleEightPriorityState.flags.push(MODULE_EIGHT_PRIORITY_FLAG);
        if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleEightUser, 'soc-analyst', 'soc-08', MODULE_EIGHT_PRIORITY_CATALOG_KEY);
      }
      moduleEightSavePriority();
      moduleEightRender('m08-priority-feedback');
      return;
    }

    if (event.target.id === 'm08-queue-form') {
      event.preventDefault();
      moduleEightQueueState.notes = event.target.elements.queueNotes.value;
      const missing = [];
      if (moduleEightQueueState.reviewedItems.length < MODULE_EIGHT_QUEUE.length) missing.push('inspect all four queue items');
      if (MODULE_EIGHT_QUEUE.some((item) => !moduleEightQueueState.decisions[item.id])) missing.push('choose all four dispositions');
      if (!moduleEightQueueState.selectedEvidence.length) missing.push('select validation evidence');
      if (!moduleEightQueueState.workflow || !moduleEightQueueState.followUp) missing.push('complete ownership and verification decisions');
      if (moduleEightQueueState.notes.trim().length < 140) missing.push('write a 140-character queue handoff');
      if (missing.length) {
        moduleEightQueueState.validationError = `Add: ${missing.join(', ')}. Your current work is saved.`;
        moduleEightSaveQueue();
        moduleEightRender('m08-queue-feedback');
        return;
      }
      const result = moduleEightQueueScore();
      moduleEightQueueState.attempts += 1;
      moduleEightQueueState.score = result.score;
      moduleEightQueueState.bestScore = Math.max(moduleEightQueueState.bestScore || 0, result.score);
      moduleEightQueueState.breakdown = result.breakdown;
      moduleEightQueueState.feedback = result.feedback;
      moduleEightQueueState.validationError = '';
      moduleEightQueueState.lastSubmittedAt = new Date().toISOString();
      const queuePassed = result.score >= MODULE_EIGHT_PASSING_SCORE;
      if (typeof recordLabAttempt === 'function') {
        recordLabAttempt(moduleEightUser, MODULE_EIGHT_QUEUE_CATALOG_KEY, {
          state: queuePassed ? 'complete' : 'in_progress',
          score: result.score,
          result: { breakdown: result.breakdown, feedback: result.feedback, attempts: moduleEightQueueState.attempts },
        });
      }
      if (queuePassed) {
        moduleEightQueueState.completed = true;
        if (!moduleEightQueueState.flags.includes(MODULE_EIGHT_QUEUE_FLAG)) moduleEightQueueState.flags.push(MODULE_EIGHT_QUEUE_FLAG);
        if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleEightUser, 'soc-analyst', 'soc-08', MODULE_EIGHT_QUEUE_CATALOG_KEY);
      }
      moduleEightSaveQueue();
      moduleEightRender('m08-queue-feedback');
    }
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
