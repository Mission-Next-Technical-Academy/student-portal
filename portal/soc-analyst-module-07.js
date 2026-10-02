/* Module 07 — semi-independent network and email investigation.
 * All messages, domains, addresses, identities, and telemetry are fictional.
 */

const MODULE_SEVEN_LAB_ID = 'm07-network-email-investigation-v1';
const MODULE_SEVEN_FLAG = 'M07-PHISH-NETWORK-CORRELATED';
const MODULE_SEVEN_CATALOG_LAB_KEYS = ['lab-email-triage', 'lab-network-investigation', 'lab-network-email-independent'];
/* Labs the Assessment Lab submit action gates on: both assessment labs plus
 * the required "additional" FTP log-analysis lab, so module completion
 * (this module's own completion action) requires every Guided, Assessment,
 * and additional/required lab to be individually marked complete first. */
const MODULE_SEVEN_COMPLETION_LAB_IDS = ['assessment-1', 'assessment-2', 'additional-ftp-log-analysis'];
// Recorded across all three MODULE_SEVEN_CATALOG_LAB_KEYS; review status is
// tracked against the last (this module's own independent-assessment key).
const MODULE_SEVEN_PRIMARY_CATALOG_KEY = MODULE_SEVEN_CATALOG_LAB_KEYS[MODULE_SEVEN_CATALOG_LAB_KEYS.length - 1];

// Prove It case — authored from the imported GRE-tunnel (10.1.0.33 covert
// channel), HTTP web-shell (/uploads/shell.php), and required FTP
// anonymous-exfil (10.4.5.200) lab scenarios in
// portal/imported-labs/mission-next-labs/src/data.js: one incident chain —
// web-shell foothold -> persistent GRE tunnel -> anonymous-FTP exfiltration.
const MODULE_SEVEN_CASE_ID = 'NEC-0731';
// The ticket's entities are the M07 assessment case's own recipients and devices.
const MODULE_SEVEN_ENTITY_ROSTER = {
  users: [
    { id: 'acct-63', tier: 'principal' },
    { id: 'acct-82', tier: 'pivot' },
    { id: 'acct-17', tier: 'noise' },
  ],
  devices: [
    { id: 'WS-517', tier: 'principal' },
    { id: 'WS-204', tier: 'noise' },
  ],
};
const MODULE_SEVEN_DEPARTMENT_OPTIONS = [
  { id: 'tier2-soc-net', text: 'Tier 2 SOC — Network Intrusion', fit: 100, note: 'Owns active tunnel/C2 and exfiltration response.' },
  { id: 'app-sec', text: 'Application Security', fit: 60, note: 'Owns the vulnerable web app, but not the active exfiltration response.' },
  { id: 'identity-response', text: 'Identity Response', fit: 20, note: 'No compromised identity/session evidence in this case.', bounce: 'Returned — this case has no identity-compromise evidence; route to Tier 2 SOC Network Intrusion.' },
  { id: 'helpdesk', text: 'Help Desk', fit: 10, note: 'Not equipped for active intrusion response.', bounce: 'Returned — escalate active intrusions to Tier 2 SOC, not Help Desk.' },
];
// Answer key — kept in module data, never shown live in Prove It.
const MODULE_SEVEN_ANSWER_KEY = { severity: 'critical', disposition: 'true-positive', escalateTo: 'tier2-soc-net' };

const MODULE_SEVEN_QUIZ_BANKS = [
  {
    conceptId: 'email-authentication',
    conceptTitle: 'Email authentication and identity alignment',
    questions: [
      {
        id: 'm07-q-auth-1',
        prompt: "An incoming message has a From header showing \"support@company.example\" but the Return-Path is \"bounce@companyy-support.example\". SPF passes. What is the correct interpretation?",
        options: [
          { id: 'a', text: 'SPF pass proves the message is from support@company.example.' },
          { id: 'b', text: 'SPF authenticates only the envelope sender (companyy-support.example); it does not align with or validate the displayed From domain.' },
          { id: 'c', text: 'The typo in the Return-Path indicates a minor administrative error, not a security concern.' },
          { id: 'd', text: 'Mismatched From and Return-Path domains are normal for external email.' },
        ],
        correctId: 'b',
        feedbackCorrect: "SPF validates the mailserver identity, not the visible From address. DMARC alignment requires both SPF and DKIM to pass AND the domain to match. A lookalike envelope domain is a classic phishing pattern.",
        feedbackIncorrect: "SPF authenticates the envelope sender (MAIL FROM) using the Return-Path domain. The visible From is a separate header that may not match. That mismatch is a red flag.",
      },
      {
        id: 'm07-q-auth-2',
        prompt: "A message passes SPF and DKIM but fails DMARC because the DKIM-signed domain does not match the From header domain. What does this indicate?",
        options: [
          { id: 'a', text: 'The message is definitely legitimate; all three checks passed.' },
          { id: 'b', text: 'DMARC alignment failure means the message signed by one domain but claims to be from a different domain--a sign of misalignment or spoofing.' },
          { id: 'c', text: 'DMARC failures are never a concern if the message appears to come from inside the organization.' },
          { id: 'd', text: 'SPF and DKIM alone are sufficient to trust the message.' },
        ],
        correctId: 'b',
        feedbackCorrect: "DMARC requires both SPF and DKIM to be aligned with the visible From domain. When the DKIM domain differs from the From domain, the message fails alignment--a reliable indicator of forwarding, compromise, or spoofing.",
        feedbackIncorrect: "Alignment failures indicate the message's actual origin does not match its claimed identity. This is a critical difference from a pass.",
      },
      {
        id: 'm07-q-auth-3',
        prompt: "You are reviewing a message with a high-urgency claim (\"Your account will close in 2 hours\"). SPF and DMARC both fail. What should be your first action?",
        options: [
          { id: 'a', text: 'Trust the message because high urgency is typical of legitimate operational alerts.' },
          { id: 'b', text: 'Examine the actual recipient, sender domain alignment, and authentication status before trusting any claim in the message.' },
          { id: 'c', text: 'Forward the message to the claimed sender to verify it.' },
          { id: 'd', text: 'Treat urgency as a sufficient signal to act immediately.' },
        ],
        correctId: 'b',
        feedbackCorrect: "Urgency is a social-engineering tactic. Failed SPF and DMARC are technical red flags. Always prioritize authentication alignment and sender identity over message tone.",
        feedbackIncorrect: "Phishing messages deliberately use urgency and authority to bypass rational decision-making. Authentication alignment is the objective signal.",
      },
      {
        id: 'm07-q-auth-4',
        prompt: "A message from an external partner passes all email authentication checks (SPF, DKIM, DMARC aligned). What is the next analysis step?",
        options: [
          { id: 'a', text: 'The message is completely safe; no further analysis is needed.' },
          { id: 'b', text: 'Authentication confirms the message came from the claimed domain, but you must still inspect the actual content, links, and attachments for legitimacy.' },
          { id: 'c', text: 'Assume the message is definitely from the partner even if the content seems unusual.' },
          { id: 'd', text: 'Authentication replaces the need to examine the message body.' },
        ],
        correctId: 'b',
        feedbackCorrect: "Authentication confirms origin, not intent. A legitimate domain can be compromised or spoofed at the application level. Inspect content, links (their actual targets vs. display text), and attachments.",
        feedbackIncorrect: "Authentication is one layer. Content inspection is the next. A legitimate sender's account can be compromised.",
      },
    ],
  },
  {
    conceptId: 'artifact-inspection',
    conceptTitle: 'Inspecting URLs and attachments safely',
    questions: [
      {
        id: 'm07-q-art-1',
        prompt: "A phishing message includes a button labeled \"Verify Account\" that displays \"support.company.example\" when you hover over it. The defanged target is \"hxxps[://]support-verify[.]net/login\". What should you report?",
        options: [
          { id: 'a', text: 'The message is safe because the button text matches a trusted domain.' },
          { id: 'b', text: 'The displayed text is a decoy; the actual target is a typosquatted domain different from support.company.example. This is a credential-phishing artifact.' },
          { id: 'c', text: 'The defanging process proves the link is malicious.' },
          { id: 'd', text: 'Users should click the link to verify it before deciding.' },
        ],
        correctId: 'b',
        feedbackCorrect: "The gap between displayed text and actual href is a classic phishing technique. Defanging (replacing hxxps, [.], etc.) is a presentation tool to prevent accidental clicks, not proof of maliciousness--context does.",
        feedbackIncorrect: "Phishing URLs are hidden behind legitimate-looking display text. Always compare the displayed text to the defanged actual target.",
      },
      {
        id: 'm07-q-art-2',
        prompt: "An HTML attachment contains JavaScript that, when opened in a browser sandbox, attempts to resolve a domain and open a TLS connection to an IP not in your baseline. What does this indicate?",
        options: [
          { id: 'a', text: 'HTML attachments are always safe; they cannot perform network actions.' },
          { id: 'b', text: 'The JavaScript behavior (domain resolution and connection attempt) indicates the attachment is designed to interact with an external system, not a user credential form.' },
          { id: 'c', text: 'Sandbox results are unreliable; the attachment is definitely benign.' },
          { id: 'd', text: 'The attachment is safe because it only resolves a domain and does not download a file.' },
        ],
        correctId: 'b',
        feedbackCorrect: "Artifact behavior in a sandbox is observable. Domain resolution + TLS connection = the attachment is trying to reach an external server, consistent with credential theft (exfiltration) or malware download.",
        feedbackIncorrect: "Sandboxed behavior is reliable evidence of intent. A benign HTML form would not attempt external network connections.",
      },
      {
        id: 'm07-q-art-3',
        prompt: "You compare an HTML attachment hash (SHA-256: aaa...) against threat-intelligence databases and find no matches. What can you conclude?",
        options: [
          { id: 'a', text: 'The attachment is benign because the hash is not in threat-intelligence databases.' },
          { id: 'b', text: 'The hash has not been seen before in public databases, but the attachment may still be malicious based on its behavior, content, and context.' },
          { id: 'c', text: 'Hash lookups prove the attachment is safe.' },
          { id: 'd', text: 'The attachment is definitely new malware.' },
        ],
        correctId: 'b',
        feedbackCorrect: "First-seen hashes are common for targeted or freshly created phishing. Lack of a known-malicious signature does not prove benignity. Behavior (sandbox analysis) and context (authentication, delivery) are more reliable.",
        feedbackIncorrect: "Hash databases cover known malware. New or targeted phishing will have unknown hashes. Never rely on hash lookups alone.",
      },
      {
        id: 'm07-q-art-4',
        prompt: "A message contains an attachment labeled \"Invoice.pdf\" but the MIME type is \"text/html\". When inspected, the file contains JavaScript. What should you flag?",
        options: [
          { id: 'a', text: 'The filename and MIME type mismatch is a critical red flag indicating a masqueraded file type.' },
          { id: 'b', text: 'PDF files can contain HTML and JavaScript; this is normal.' },
          { id: 'c', text: 'The filename determines the file type; MIME headers are irrelevant.' },
          { id: 'd', text: 'JavaScript in an attachment proves it is definitely malicious.' },
        ],
        correctId: 'a',
        feedbackCorrect: "Filename/MIME mismatch is a classic evasion tactic. An HTML file labeled .pdf will execute in a browser environment, not a PDF reader. This is a strong indicator of masquerading.",
        feedbackIncorrect: "MIME type is the real file type. A .pdf label on an HTML file with JavaScript is suspicious behavior designed to bypass user assumptions.",
      },
    ],
  },
  {
    conceptId: 'message-trace',
    conceptTitle: 'Using message trace to bound delivery scope',
    questions: [
      {
        id: 'm07-q-trace-1',
        prompt: "Message trace shows one copy of a suspicious phishing message delivered to acct-63, but a second copy addressed to acct-82 was rejected at the gateway before delivery. What is the correct scope of exposed users?",
        options: [
          { id: 'a', text: 'Both acct-63 and acct-82 were exposed because the message was sent to both.' },
          { id: 'b', text: 'Only acct-63 was exposed; acct-82 did not receive the message and cannot have acted on it.' },
          { id: 'c', text: 'Neither account was exposed because the second copy was blocked.' },
          { id: 'd', text: 'The trace is unreliable; assume all recipients received the message.' },
        ],
        correctId: 'b',
        feedbackCorrect: "Message trace distinguishes delivery outcome. A blocked/quarantined copy never reached the inbox. Exposure scope is determined by delivery, not attempted delivery. Gateway blocks are a success.",
        feedbackIncorrect: "Trace outcomes matter: delivered = exposed, blocked = protected, quarantined = reviewed by security. Do not conflate sending intent with actual delivery.",
      },
      {
        id: 'm07-q-trace-2',
        prompt: "A message was delivered to 47 recipients at 10:15 UTC. Trace shows all deliveries marked \"Inbox\". At 10:18, a third-party reports the message as phishing. What is the most accurate risk statement?",
        options: [
          { id: 'a', text: 'All 47 users are compromised because they all received the message.' },
          { id: 'b', text: '47 users were exposed to the message; actual compromise depends on individual user action (click, credential entry) and endpoint protection.' },
          { id: 'c', text: 'No users are at risk because the message was reported quickly.' },
          { id: 'd', text: 'Only the reporter is at risk.' },
        ],
        correctId: 'b',
        feedbackCorrect: "Delivery is exposure, not compromise. Outcome depends on user action. Rapid reporting and quarantine limit damage. Communicate exposure count, not assumed compromise.",
        feedbackIncorrect: "Phishing messages can be delivered without the user interacting with them. Scope is measured by delivery, not by clicking or credential theft.",
      },
      {
        id: 'm07-q-trace-3',
        prompt: "A malicious message was delivered to 200 users. You cannot determine how many actually opened it. What should you report as the scope?",
        options: [
          { id: 'a', text: 'Assume all 200 were compromised.' },
          { id: 'b', text: 'Report the delivery scope (200 users exposed to the message) separately from the interaction scope (unknown; cannot determine from message trace alone).' },
          { id: 'c', text: 'Report zero scope because you cannot confirm all opened it.' },
          { id: 'd', text: 'Message trace includes open rates; use those to determine scope.' },
        ],
        correctId: 'b',
        feedbackCorrect: "Be precise: delivery scope is known (200), interaction scope is not. Report what you know and what you cannot determine. Do not inflate scope by assuming action you cannot confirm.",
        feedbackIncorrect: "Trace provides delivery status and some servers provide open/read status, but that is not universal. Stick to confirmed data.",
      },
      {
        id: 'm07-q-trace-4',
        prompt: "A message was delivered to 50 users, but trace shows it passed through a forwarding rule that may have distributed it to 200 more addresses on a shared mailbox. How should you scope the investigation?",
        options: [
          { id: 'a', text: 'Assume all 250 addresses were exposed.' },
          { id: 'b', text: 'Investigate the forwarding rule behavior and trace any forwarded copies separately; do not assume forwarding without evidence.' },
          { id: 'c', text: 'Report only the 50 directly delivered addresses.' },
          { id: 'd', text: 'Forwarding rules never expand exposure beyond direct delivery.' },
        ],
        correctId: 'b',
        feedbackCorrect: "Forwarding rules are a separate concern. Trace the rule and any forwarded copies independently. Do not speculate; investigate.",
        feedbackIncorrect: "Forwarding can expand scope, but not every forwarding rule is triggered. Verify the behavior by checking the actual rule and any forwarded traces.",
      },
    ],
  },
  {
    conceptId: 'cross-source-correlation',
    conceptTitle: 'Correlating DNS, TLS, and email artifacts by timing and destination',
    questions: [
      {
        id: 'm07-q-corr-1',
        prompt: "A QR-phishing invoice message is opened at 10:16 UTC. Network logs show a DNS query at 10:17 UTC resolving invoice-qr.example from the same device. A TLS connection at 10:17:37 connects to the resolved IP. What is the strongest claim?",
        options: [
          { id: 'a', text: 'The user opened the message and the network activity is unrelated coincidence.' },
          { id: 'b', text: 'The sequence (open → DNS → TLS in 1-2 minutes from the same device) suggests the user interacted with a message artifact (link or attachment) that initiated the connection.' },
          { id: 'c', text: 'DNS and TLS activity alone prove credential compromise.' },
          { id: 'd', text: 'Timing alignment is not meaningful because multiple activities happen on a device throughout the day.' },
        ],
        correctId: 'b',
        feedbackCorrect: "Tight timing (minutes, same device), matching destinations (email artifact domain, DNS answer, TLS SNI), and sequence (open → lookup → connect) form a coherent chain. This is cross-source correlation.",
        feedbackIncorrect: "Correlation requires alignment across multiple signals: timing, device, user, and destination. A single match is not proof.",
      },
      {
        id: 'm07-q-corr-2',
        prompt: "An invoice attachment's QR redirect reaches invoice-qr.example. DNS resolves that domain to 203.0.113.88. A TLS session connects to 203.0.113.88 with SNI invoice-qr.example. What does this chain demonstrate?",
        options: [
          { id: 'a', text: 'The shared domain and IP prove the artifact works as designed.' },
          { id: 'b', text: 'The domain, IP, and SNI alignment indicates the artifact successfully reached its intended destination; this supports a credential-phishing or malware-download hypothesis.' },
          { id: 'c', text: 'IP addresses alone are sufficient to determine intent.' },
          { id: 'd', text: 'The chain proves the user was compromised.' },
        ],
        correctId: 'b',
        feedbackCorrect: "Domain→IP→TLS SNI alignment shows the artifact is intentionally designed to reach that server. This does not prove compromise, but it proves the artifact's purpose.",
        feedbackIncorrect: "Alignment of email artifacts with network sessions is the signal. User action (whether they clicked or not) is a separate question.",
      },
      {
        id: 'm07-q-corr-3',
        prompt: "An email has a URL to example.com. A DNS lookup at the same time resolves example.com to 198.51.100.42. Later, a TLS session connects to 203.0.113.77 (a different IP). What can you conclude?",
        options: [
          { id: 'a', text: 'The DNS and TLS are part of the email artifact attack chain.' },
          { id: 'b', text: 'The different destination IPs indicate these may be unrelated activities; do not assume they form a chain without additional context.' },
          { id: 'c', text: 'IP mismatch proves no correlation.' },
          { id: 'd', text: 'All network activity on the device must be attributed to the email.' },
        ],
        correctId: 'b',
        feedbackCorrect: "A DNS result that does not match the TLS destination breaks the chain unless there is explanation (redirect, secondary server, etc.). Always verify destination alignment.",
        feedbackIncorrect: "Cross-source correlation requires matching destinations, not just similar timing. Misaligned destinations indicate separate activities.",
      },
      {
        id: 'm07-q-corr-4',
        prompt: "You see a TLS connection to 203.0.113.88 at 10:18 UTC. You also see an email with a defanged URL to that IP at 10:15 UTC on the same device. No DNS query is logged. What is the most accurate statement?",
        options: [
          { id: 'a', text: 'The missing DNS query breaks the chain; the TLS connection must be unrelated.' },
          { id: 'b', text: 'The TLS connection and email artifact destination align, suggesting the artifact may have been opened and reached its target. The missing DNS query could indicate a cached result or direct IP use.' },
          { id: 'c', text: 'Missing DNS means the connection never happened.' },
          { id: 'd', text: 'DNS queries are always logged; the absence proves tampering.' },
        ],
        correctId: 'b',
        feedbackCorrect: "DNS lookups are cached by devices, proxies, and networks. A missing DNS log does not break the chain if the IP matches and timing aligns. Look for destination alignment.",
        feedbackIncorrect: "DNS caching and logging gaps are normal. Do not require DNS logs to corroborate a TLS connection; IP and timing alignment can be sufficient.",
      },
    ],
  },
  {
    conceptId: 'proportionate-scoping',
    conceptTitle: 'Proportionate investigation scoping and response',
    questions: [
      {
        id: 'm07-q-scope-1',
        prompt: "A phishing message was delivered to 500 users, but trace and engagement data show only 5 users opened it and 1 clicked a link. What is the correct scope for containment response?",
        options: [
          { id: 'a', text: 'Disable all 500 accounts because they all received the message.' },
          { id: 'b', text: 'Isolate and investigate the 1 user who clicked, reset their session, then search for indicators of the artifact on other systems.' },
          { id: 'c', text: 'Take no action because only 1 out of 500 is a low percentage.' },
          { id: 'd', text: 'Contact all 500 users individually to confirm they are safe.' },
        ],
        correctId: 'b',
        feedbackCorrect: "Response scales to proven exposure and interaction. 1 click = 1 confirmed interaction point. Investigate that user and trace known-bad indicators. Notifying 500 users is alerting; containing 1 is proportionate.",
        feedbackIncorrect: "Proportionality avoids overreaction (locking 500 accounts for 1 click) and under-reaction (ignoring the click). Match response to confirmed exposure.",
      },
      {
        id: 'm07-q-scope-2',
        prompt: "Analysis shows a phishing message reached acct-63 on WS-517 and the user opened it, but trace blocked an identical copy before it was delivered to acct-82. What should the containment decision be?",
        options: [
          { id: 'a', text: 'Disable both acct-63 and acct-82 because both were targeted.' },
          { id: 'b', text: 'Focus on acct-63 and WS-517 (confirmed exposure); document the blocked copy as evidence of scope and continued threat.' },
          { id: 'c', text: 'Reset only acct-82 because acct-63 likely has no risk.' },
          { id: 'd', text: 'Archive the message and close the case.' },
        ],
        correctId: 'b',
        feedbackCorrect: "Deliver confirmed exposure to action. acct-63 was exposed; acct-82 was protected by the gateway. Scope response to confirmed impact while documenting the broader campaign.",
        feedbackIncorrect: "Do not punish users whose messages were blocked. Focus resources on those actually exposed.",
      },
      {
        id: 'm07-q-scope-3',
        prompt: "A website compromise leads to malware being served to 10,000 visitors, but your organization only sent 12 employees to that site. What is the appropriate scope for your incident response?",
        options: [
          { id: 'a', text: 'Respond as if the entire organization (10,000+) is compromised.' },
          { id: 'b', text: 'Focus on the 12 employees: review their endpoint activity for malware signatures, inspect their network activity, and monitor their sessions.' },
          { id: 'c', text: 'No response is needed because the site was external.' },
          { id: 'd', text: 'Assume all 10,000 visitors including external customers were compromised by your organization.' },
        ],
        correctId: 'b',
        feedbackCorrect: "Your scope is your exposure. 12 employees visited the site; investigate them. The 10,000 visitors are the external site's problem and potentially public knowledge.",
        feedbackIncorrect: "Incident scope is determined by what reached your systems, not what happened on external systems.",
      },
      {
        id: 'm07-q-scope-4',
        prompt: "A credential-phishing message used by an attacker successfully compromised 1 account. The attacker then accessed 50 files across 8 additional accounts. How should you describe the incident scope?",
        options: [
          { id: 'a', text: 'Only 1 account was compromised.' },
          { id: 'b', text: '1 account was directly compromised (initial phishing); investigate the 8 accounts with unauthorized file access as potential lateral movement or privilege abuse.' },
          { id: 'c', text: 'All 9 accounts are equally compromised.' },
          { id: 'd', text: 'The 50 files are the scope, not the accounts.' },
        ],
        correctId: 'b',
        feedbackCorrect: "Distinguish initial compromise (1 account via phishing) from lateral access (8 accounts). Each represents different containment and investigation strategies.",
        feedbackIncorrect: "Incident scope evolves. The phishing is the attack entry point; the lateral access is the impact. Report both separately.",
      },
    ],
  },
];

const MODULE_SEVEN_SOURCES_LIST = [
  {
    title: 'Overview',
    org: 'dmarc.org',
    url: 'https://dmarc.org/overview/',
    note: 'Explains how DMARC builds on SPF and DKIM to check alignment between the authenticated sending domain and the visible From address.',
  },
  {
    title: 'How Email Authentication Works in Microsoft 365',
    org: 'Microsoft Learn',
    url: 'https://learn.microsoft.com/en-us/defender-office-365/email-authentication-about',
    note: 'Official Microsoft documentation on SPF, DKIM, and DMARC configuration and authentication alignment principles.',
  },
  {
    title: 'Phishing and Credential Harvesting (T1566, T1598) — MITRE ATT&CK',
    org: 'MITRE',
    url: 'https://attack.mitre.org/techniques/T1566/',
    note: 'MITRE ATT&CK technique documentation on phishing delivery methods, email-based credential harvesting, and related TTPs.',
  },
  {
    title: 'Avoiding Social Engineering and Phishing Attacks',
    org: 'CISA',
    url: 'https://www.cisa.gov/tips/st04-014',
    note: 'CISA guidance on recognizing phishing red flags — the broader social-engineering context this lab\'s isolated message sits inside.',
  },
  {
    title: 'Message Trace FAQ in Exchange Online',
    org: 'Microsoft Learn',
    url: 'https://learn.microsoft.com/en-us/exchange/monitoring/trace-an-email-message/message-trace-faq',
    note: 'Official documentation on message trace, delivery status, and using search criteria to scope exactly which copies were delivered, blocked, or quarantined.',
  },
  {
    title: 'Guide to Integrating Forensic Techniques into Incident Response (SP 800-86)',
    org: 'NIST',
    url: 'https://csrc.nist.gov/pubs/sp/800/86/final',
    note: 'Standard reference for using network traffic and other data sources as forensic evidence during incident response — the network-correlation half of this lab.',
  },
  {
    title: 'Security+ (SY0-701) supplementary domain reference: Email Security and Threat Investigation',
    org: 'CompTIA',
    url: 'https://www.comptia.org/certifications/security',
    note: 'Supplementary public reference only. The §2 crosswalk is a developer draft pending curriculum, compliance, and faculty review; this study aid is not an approval, affiliation, endorsement, or pass guarantee.',
  },
];

let moduleSevenState = null;
let moduleSevenUser = null;
let moduleSevenAssessmentState = null;
let moduleSevenAssessmentNetworkFilters = { query: '', type: 'all', device: '' };
let moduleSevenReviewMode = false;
let moduleSevenQuizState = null;
// Set when the learner explicitly asks to retake a knowledge check that the
// account already records as passed (see moduleSevenQuizVerifiedElsewhere()).
let moduleSevenQuizForceRetake = false;

function moduleSevenFreshState() {
  return {
    practiceComplete: false, practiceNotes: '',
    attempts: 0, score: 0, bestScore: 0, flags: [], completed: false,
    feedback: [], validationError: '', lastSubmittedAt: '', notes: '',
    evidenceDesk: { exposure: '', correlation: '', action: '', note: '', checked: false, complete: false, feedback: '' },
    labProgress: {},
    caseRecord: { status: '', affectedUser: '', affectedDevice: '', severity: '', disposition: '', escalation: '', escalateTo: '', notes: '', findings: {}, submitted: false, submittedAt: '', actionHistory: [] },
  };
}

let moduleSevenProveItShowMissing = false;

function moduleSevenProveItRedoRequested() {
  return moduleSevenUser?.openLabRedosByModuleKey?.['soc-07'] != null;
}

// '' until submitted; then 'review' while the latest attempt awaits faculty,
// 'graded' once an instructor has reviewed it without sending it back.
function moduleSevenProveItReviewStatus() {
  if (!moduleSevenState?.caseRecord?.submitted) return '';
  const attempt = moduleSevenUser?.latestLabAttemptByKey?.[MODULE_SEVEN_PRIMARY_CATALOG_KEY];
  return attempt?.reviewedAt && !attempt.redoRequested ? 'graded' : 'review';
}

function moduleSevenProveItRedoFeedback() {
  if (!moduleSevenProveItRedoRequested()) return '';
  const items = moduleSevenUser.openLabRedosByModuleKey['soc-07'].feedback || [];
  return `<div class="m01-redo-feedback" role="note">
    <strong><i class="ri-feedback-line" aria-hidden="true"></i> Instructor feedback</strong>
    ${items.length
      ? `<ul>${items.map((item) => `<li>${item.item_label ? `<strong>${esc(item.item_label)}:</strong> ` : ''}${esc(item.comment || '')}</li>`).join('')}</ul>`
      : '<p>Your instructor returned this case without written notes. Use Message Instructor if you are not sure what to change.</p>'}
  </div>`;
}

function moduleSevenProveItSpec() {
  return {
    formId: 'm07-assessment-form',
    panelId: 'm07-review-submission',
    caseId: MODULE_SEVEN_CASE_ID,
    userOptions: MODULE_SEVEN_ENTITY_ROSTER.users.map((entry) => ({ id: entry.id, text: entry.id })),
    deviceOptions: MODULE_SEVEN_ENTITY_ROSTER.devices.map((entry) => ({ id: entry.id, text: entry.id })),
    departmentOptions: MODULE_SEVEN_DEPARTMENT_OPTIONS,
    notesPlaceholder: 'Summarize the confirmed delivery chain, what remains unverified, the noise you excluded, and your recommended action…',
    saveAttr: 'data-m07-save-proveit',
    submitAttr: 'data-m07-submit-proveit',
    lockedMessage: 'Module 8 stays locked until your instructor approves the submission.',
  };
}

// Prove It scoring: entity tiers 20, severity 15, disposition 20,
// escalation/routing up to 35, notes 10 — Module 01's weighting model. No
// extra domain findings existed on the old m07-assessment-form beyond the
// write-up, which is now the standard Analyst Work Notes field.
function moduleSevenProveItPerformance() {
  const state = moduleSevenState.caseRecord;
  const spec = moduleSevenProveItSpec();
  const gateOk = missionNextAllLabsComplete(moduleSevenState.labProgress, MODULE_SEVEN_COMPLETION_LAB_IDS);
  const missing = caseRecordMissing(state, { ...spec, extraMissing: gateOk ? [] : ['Mark both assessment labs and the required FTP log analysis lab complete'] });

  const userTier = MODULE_SEVEN_ENTITY_ROSTER.users.find((entry) => entry.id === state.affectedUser)?.tier;
  const deviceTier = MODULE_SEVEN_ENTITY_ROSTER.devices.find((entry) => entry.id === state.affectedDevice)?.tier;
  const tierFit = (tier) => (tier === 'principal' ? 1 : tier === 'pivot' ? 0.5 : 0);
  const entityPoints = Math.round((tierFit(userTier) + tierFit(deviceTier)) * 10); // 0-20

  const severityOk = caseRecordSeverity(state) === MODULE_SEVEN_ANSWER_KEY.severity;
  const dispositionOk = caseRecordDisposition(state) === MODULE_SEVEN_ANSWER_KEY.disposition;
  const department = MODULE_SEVEN_DEPARTMENT_OPTIONS.find((option) => option.id === state.escalateTo) || null;
  const escalationRequiredOk = state.escalation === 'required';
  const bounced = escalationRequiredOk && department && department.fit < 40;
  const escalation = escalationRequiredOk && department && !bounced ? Math.round((department.fit / 100) * 35) : 0;
  const notesLen = (state.notes || '').trim().length;
  const notes = Math.round(Math.min(1, notesLen / 80) * 10);
  const score = entityPoints + (severityOk ? 15 : 0) + (dispositionOk ? 20 : 0) + escalation + notes;
  const criticalErrors = state.escalation === 'not-required' ? ['escalation-not-required'] : [];

  return {
    missing,
    score,
    breakdown: { affected_entity: entityPoints, severity: severityOk ? 15 : 0, disposition: dispositionOk ? 20 : 0, escalation, analyst_notes: notes },
    department, bounced,
    feedback: [
      entityPoints >= 20
        ? 'Affected entity/scope: correct — the compromised web-app service account and host.'
        : entityPoints > 0
          ? 'Affected entity/scope: partial credit — a related host/account is supported by the evidence, but SRV-WEB07 / svc-webapp01 is the confirmed source.'
          : 'Affected entity/scope: review the tunnel, web-shell, and FTP evidence for the confirmed source host and account.',
      severityOk ? 'Severity: correct.' : 'Severity: review — an active, persistent exfiltration chain is Critical.',
      dispositionOk ? 'Disposition: correct.' : 'Disposition: review — the tunnel, web shell, and anonymous FTP downloads together confirm malicious activity.',
      !escalationRequiredOk
        ? 'Routing: not applicable — escalation was set to not required.'
        : !department
          ? 'Routing: review — this case needs a department routed with the recorded evidence.'
          : department.fit >= 100
            ? `Routing: correct — ${department.text} is the best-fit department for this case.`
            : department.fit >= 40
              ? `Routing: accepted, but not the best fit — ${department.note}`
              : `Routing: returned — ${department.bounce || department.note}`,
    ],
    criticalErrors,
  };
}

function moduleSevenLoad(user) {
  if (moduleSevenUser?.email !== user?.email) moduleSevenQuizForceRetake = false;
  moduleSevenUser = user;
  if (typeof SocM07AssessmentState !== 'undefined' && typeof SocM07AssessmentData !== 'undefined') {
    moduleSevenAssessmentState = SocM07AssessmentState.load(user, SocM07AssessmentData);
  }
  const defaults = moduleSevenFreshState();
  moduleSevenState = LabRuntime.loadCaseState(MODULE_SEVEN_LAB_ID, 'soc-07', user, defaults);
  ['feedback', 'flags'].forEach((key) => {
    if (!Array.isArray(moduleSevenState[key])) moduleSevenState[key] = [];
  });
  if (typeof moduleSevenState.notes !== 'string') moduleSevenState.notes = '';
  if (typeof moduleSevenState.practiceNotes !== 'string') moduleSevenState.practiceNotes = '';
  if (!moduleSevenState.evidenceDesk || typeof moduleSevenState.evidenceDesk !== 'object') {
    moduleSevenState.evidenceDesk = moduleSevenFreshState().evidenceDesk;
  }
  if (!moduleSevenState.labProgress || typeof moduleSevenState.labProgress !== 'object') moduleSevenState.labProgress = {};
  // Backward compat: a pre-case-record submission only had `completed` +
  // `notes`. Preserve it as an already-submitted ITSM ticket so the student
  // still sees Lab Under Review / Lab Graded, never a reset or a crash.
  if (!moduleSevenState.caseRecord || typeof moduleSevenState.caseRecord !== 'object') {
    moduleSevenState.caseRecord = {
      status: '', affectedUser: '', affectedDevice: '', severity: '', disposition: '', escalation: '', escalateTo: '',
      notes: moduleSevenState.notes || '', findings: {}, submitted: Boolean(moduleSevenState.completed),
      submittedAt: moduleSevenState.lastSubmittedAt || '', actionHistory: [],
    };
  }
  ['status', 'affectedUser', 'affectedDevice', 'severity', 'disposition', 'escalation', 'escalateTo', 'notes'].forEach((key) => {
    if (typeof moduleSevenState.caseRecord[key] !== 'string') moduleSevenState.caseRecord[key] = '';
  });
  if (!moduleSevenState.caseRecord.findings || typeof moduleSevenState.caseRecord.findings !== 'object') moduleSevenState.caseRecord.findings = {};
  if (!Array.isArray(moduleSevenState.caseRecord.actionHistory)) moduleSevenState.caseRecord.actionHistory = [];
  if (typeof moduleSevenState.caseRecord.submitted !== 'boolean') moduleSevenState.caseRecord.submitted = Boolean(moduleSevenState.completed);
  // A returned attempt must not stay permanently unsubmittable.
  if (moduleSevenProveItRedoRequested() && moduleSevenState.caseRecord.submitted === true) {
    moduleSevenState.caseRecord.submitted = false;
    moduleSevenState.caseRecord.submittedAt = '';
    moduleSevenSave();
  }

  // Initialize quiz state
  if (!moduleSevenQuizState) {
    const previousQuestionIds = moduleSevenState.lastQuizQuestionIds || [];
    const selection = selectQuizQuestions(MODULE_SEVEN_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    moduleSevenQuizState = {
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

  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'soc-analyst', 'soc-07');
  return moduleSevenState;
}

function moduleSevenSave() {
  if (moduleSevenUser && moduleSevenState) LabRuntime.saveCaseState(MODULE_SEVEN_LAB_ID, 'soc-07', moduleSevenUser, moduleSevenState);
}

function moduleSevenMarkCatalogLabs(completed) {
  if (typeof markModuleLabComplete !== 'function') return;
  MODULE_SEVEN_CATALOG_LAB_KEYS.forEach((labKey) => {
    markModuleLabComplete(moduleSevenUser, 'soc-analyst', 'soc-07', labKey, completed);
  });
}

function moduleSevenConcepts() {
  const items = [
    ['ri-route-line', 'Read sessions as sequences', 'DNS, destination, timing, direction, and byte counts gain meaning when they form a coherent sequence. A large transfer can still be an approved backup.'],
    ['ri-mail-check-line', 'Separate identity from authentication', 'Display names are presentation. Compare From, Return-Path, SPF identity, DKIM signing, and DMARC alignment before trusting a sender.'],
    ['ri-link-unlink-m', 'Defang and resolve artifacts', 'Inspect the actual URL target and file type without opening them. Correlate sandbox behavior and hashes with observed network telemetry.'],
    ['ri-git-commit-line', 'Use trace to bound delivery', 'Message trace distinguishes delivered, blocked, redirected, and quarantined copies. Scope exposure by delivery outcome, not recipient count alone.'],
  ];
  return `<div class="m07-concepts">${items.map((item) => `<article><i class="${esc(item[0])}" aria-hidden="true"></i><h3>${esc(item[1])}</h3><p>${esc(item[2])}</p></article>`).join('')}</div>`;
}

function moduleSevenEvidenceDesk() {
  const desk = moduleSevenState.evidenceDesk;
  const feedback = desk.feedback
    ? `<div class="m07-evidence-feedback ${desk.complete ? 'is-complete' : 'is-retry'}" role="status">${esc(desk.feedback)}</div>`
    : '';
  return `<section class="m07-evidence-desk" aria-labelledby="m07-evidence-desk-title">
    <div class="m07-panel-heading"><div><p class="m07-kicker">Analyst desk · formative practice</p><h3 id="m07-evidence-desk-title">Make the bounded call</h3></div><span class="m07-chip">Case M07-QR-014</span></div>
    <p class="m07-instruction">You are the analyst on queue. Use the evidence slice below; separate delivery, interaction, and compromise instead of collapsing them into one verdict.</p>
    <div class="m07-evidence-grid">
      <div class="m07-evidence-card"><strong>Email and trace</strong><dl><div><dt>Recipient</dt><dd>acct-63 · WS-517</dd></div><div><dt>Message trace</dt><dd>Delivered to Inbox at 10:15 UTC</dd></div><div><dt>Second copy</dt><dd>acct-82 · blocked at gateway</dd></div></dl></div>
      <div class="m07-evidence-card"><strong>Network pivot</strong><dl><div><dt>10:16 UTC</dt><dd>User opened the QR-invoice message</dd></div><div><dt>10:17 UTC</dt><dd>DNS: invoice-qr.example → 203.0.113.88</dd></div><div><dt>10:17:37 UTC</dt><dd>TLS SNI: invoice-qr.example → 203.0.113.88</dd></div></dl></div>
    </div>
    <form class="m07-evidence-form" data-m07-evidence-form>
      <fieldset><legend>1. What exposure is confirmed?</legend><label><input type="radio" name="m07-exposure" value="acct-63" ${desk.exposure === 'acct-63' ? 'checked' : ''}> acct-63 / WS-517 received the message; acct-82 was protected by the gateway</label><label><input type="radio" name="m07-exposure" value="all" ${desk.exposure === 'all' ? 'checked' : ''}> Both accounts were exposed because both were targeted</label></fieldset>
      <fieldset><legend>2. How strong is the email-to-network correlation?</legend><label><input type="radio" name="m07-correlation" value="corroborated" ${desk.correlation === 'corroborated' ? 'checked' : ''}> Strong corroboration of interaction with the message artifact; it does not prove credential compromise</label><label><input type="radio" name="m07-correlation" value="proof" ${desk.correlation === 'proof' ? 'checked' : ''}> Proof that the user entered credentials and the endpoint is compromised</label></fieldset>
      <label class="m07-evidence-select">3. Choose the next authorized action<select name="m07-action"><option value="">Select an action…</option><option value="scope" ${desk.action === 'scope' ? 'selected' : ''}>Investigate acct-63 / WS-517, preserve evidence, reset sessions, and search for the indicator</option><option value="disable-all" ${desk.action === 'disable-all' ? 'selected' : ''}>Disable both accounts immediately and close the case</option><option value="close" ${desk.action === 'close' ? 'selected' : ''}>Close the case because DNS and TLS alone are not a verdict</option></select></label>
      <label class="m07-evidence-note">Analyst note <textarea name="m07-evidence-note" rows="3" maxlength="500" placeholder="State what is known, what is not proven, and what you will do next…">${esc(desk.note || '')}</textarea></label>
      <div class="m07-actions"><button type="submit" class="m07-submit">${desk.complete ? 'Review analyst call' : 'Record analyst call'}</button><p class="m07-form-help">Formative only — this does not alter module completion.</p></div>
      ${feedback}
    </form>
  </section>`;
}

function moduleSevenGetSections() {
  // Server-verified modules (finished on another device, before the 09-27
  // lab rebuild, or by admin override) read complete instead of empty.
  const verified = moduleSevenUser?.remoteVerifiedModuleProgress?.['soc-07'] === true;
  return [
    { id: 'lecture', title: 'Lecture', type: 'lecture', isComplete: true, scrollId: 'm07-lecture' },
    { id: 'knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: verified || moduleSevenQuizState?.passed, scrollId: 'm07-knowledge-check' },
    { id: 'guided-lab', title: 'Guided Lab', type: 'lab', isComplete: verified || moduleSevenGuidedChecks().every((check) => check[2]), scrollId: 'm07-guided-lab' },
    { id: 'assessment-lab', title: 'Assessment Lab', type: 'review', isComplete: verified || moduleSevenState.completed, scrollId: 'm07-assessment-lab' },
    { id: 'review', title: 'Module Review', type: 'review', isComplete: true, scrollId: 'm07-review' },
    { id: 'sources', title: 'Sources & Further Reading', type: 'read', isComplete: null, scrollId: 'm07-sources', gated: false, supplemental: true },
  ];
}

function moduleSevenGetQuickNavItems() {
  const sections = moduleSevenGetSections();
  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    kind: section.type,
    isComplete: section.isComplete,
    scrollId: section.scrollId,
  }));
}

function moduleSevenQuizQuestion(selected, index) {
  const question = selected.question;
  const userAnswerId = moduleSevenQuizState?.answers?.[question.id];
  const answered = userAnswerId !== undefined;
  return `<fieldset class="m07-quiz-question" data-question-id="${esc(question.id)}">
    <legend><span>${index + 1}</span> ${esc(selected.conceptTitle)}: ${esc(question.prompt)}</legend>
    <div class="m07-quiz-options">
      ${selected.shuffledOptions.map((option) => `<label>
        <input type="radio" name="q-${esc(question.id)}" value="${esc(option.id)}" ${userAnswerId === option.id ? 'checked' : ''} data-m07-quiz-answer />
        <span>${esc(option.text)}</span>
      </label>`).join('')}
    </div>
  </fieldset>`;
}

// A knowledge check can read complete on the account (server-verified module,
// synced quiz detail, or knowledge-check evidence) while this browser holds no
// answers — another device did the work, or an admin override set it. Show a
// verified summary instead of a blank 0/N form; never fabricate answers.
function moduleSevenQuizVerifiedElsewhere() {
  if (moduleSevenQuizForceRetake || !moduleSevenQuizState || moduleSevenQuizState.scored) return false;
  if (Object.keys(moduleSevenQuizState.answers || {}).length > 0) return false;
  return moduleSevenUser?.remoteVerifiedModuleProgress?.['soc-07'] === true
    || moduleSevenUser?.remoteModuleDetail?.['soc-07']?.quizPassed === true
    || moduleSevenUser?.remoteModuleEvidence?.['soc-07']?.['knowledge-check'] === true;
}

function moduleSevenQuizPanel() {
  if (!moduleSevenQuizState?.selectedQuestions || moduleSevenQuizState.selectedQuestions.length === 0) {
    return `<div class="m07-quiz-empty" id="m07-quiz-feedback" role="status">Loading quiz...</div>`;
  }
  if (moduleSevenQuizVerifiedElsewhere()) {
    return `<form class="m07-quiz-form mf-quiz-form" id="m07-quiz-form" novalidate><section class="mf-score is-pass" id="m07-quiz-feedback" tabindex="-1" aria-live="polite"><p class="mf-kicker">Module knowledge check</p><h3>Already verified complete</h3><p>This knowledge check is recorded as passed on your account. It is never re-answered automatically on a new device or browser, so nothing is shown here that wasn't actually submitted.</p><button type="button" class="mf-score-retake" data-m07-quiz-retake>Retake this knowledge check</button></section></form>`;
  }

  const selected = moduleSevenQuizState.selectedQuestions;
  const answered = Object.keys(moduleSevenQuizState.answers || {}).length;
  const total = selected.length;

  let feedbackHtml = '';
  if (moduleSevenQuizState.scored) {
    const passed = moduleSevenQuizState.score >= 70;
    feedbackHtml = `<section class="m07-quiz-score mf-score ${passed ? 'm07-quiz-pass is-pass' : 'm07-quiz-remediate is-remediate'}" id="m07-quiz-feedback" tabindex="-1" aria-live="polite">
      <div class="m07-quiz-score-heading">
        <div>
          <p class="m07-kicker">Attempt ${moduleSevenQuizState.attempts} · best ${moduleSevenQuizState.bestScore}/100</p>
          <h3>${moduleSevenQuizState.score}/100 — ${passed ? 'Knowledge verified' : 'Use feedback and retry'}</h3>
        </div>
        <span>${moduleSevenQuizState.score}</span>
      </div>
      <ul class="m07-quiz-feedback-list">
        ${(moduleSevenQuizState.feedback || []).map((fb) => `<li class="${fb.correct ? 'm07-quiz-feedback-correct' : 'm07-quiz-feedback-incorrect'}">
          <i class="ri-${fb.correct ? 'checkbox-circle-fill' : 'information-line'}" aria-hidden="true"></i>
          <div>
            <strong>${fb.questionId}</strong>
            <p>${esc(fb.message)}</p>
          </div>
        </li>`).join('')}
      </ul>
      ${!passed ? `<div class="m07-quiz-actions"><button type="button" class="m07-quiz-retry" data-m07-quiz-retry><i class="ri-refresh-line" aria-hidden="true"></i> Try different questions</button></div>` : ''}
    </section>`;
  } else if (answered === total) {
    feedbackHtml = `<div class="m07-quiz-ready" id="m07-quiz-feedback" role="status">All questions answered. Submit to check your responses.</div>`;
  } else {
    feedbackHtml = `<div class="m07-quiz-empty" id="m07-quiz-feedback" role="status">Answer all ${total} questions to submit.</div>`;
  }

  return `<form class="m07-quiz-form mf-quiz-form" id="m07-quiz-form" novalidate>
    <div class="m07-panel-heading mf-panel-heading"><div><p class="m07-kicker mf-kicker">Knowledge check</p><h3 id="m07-quiz-title" tabindex="-1">Test your understanding of email and network analysis</h3></div><span>${answered}/${total} answered</span></div>
    ${selected.map((sel, idx) => moduleSevenQuizQuestion(sel, idx)).join('')}
    <div class="m07-quiz-actions">
      <button class="m07-quiz-submit" type="submit" ${answered < total ? 'disabled' : ''}>
        <i class="ri-checkbox-circle-line" aria-hidden="true"></i> Check my answers
      </button>
    </div>
    ${feedbackHtml}
  </form>`;
}

function moduleSevenVideoScript() {
  return '';
}

function moduleSevenReview() {
  return `<section class="m07-review-section">
    <h3>Module concepts at a glance</h3>
    <ul>
      <li><strong>Email authentication alignment:</strong> SPF validates the envelope sender domain; DKIM signs the message body from a domain; DMARC requires both to align with the visible From. Alignment failure is a red flag.</li>
      <li><strong>Artifact inspection:</strong> Defang URLs and files before analysis. Compare displayed text to actual targets. Sandbox attachments to observe behavior (domain resolution, network connections, file operations).</li>
      <li><strong>Message trace scope:</strong> Delivery status determines exposure: delivered (inbox/quarantine) = exposed; blocked (gateway) = protected; not received = no exposure. Count exposure by delivery outcome, not by recipient count.</li>
      <li><strong>Cross-source correlation:</strong> Tight timing, matching destinations (email artifact domain → DNS answer → TLS SNI), and device alignment form a coherent chain from message to network session.</li>
      <li><strong>Baseline vs. signal:</strong> Approved services, updates, internal DNS, and backups create noise. A meaningful chain requires matching destinations across email and network, not single indicator matches.</li>
      <li><strong>Proportionate response:</strong> Scope containment to confirmed exposure. If 1 user clicked, investigate that user. Search for related artifacts and indicators, but do not assume enterprise-wide compromise from limited evidence.</li>
    </ul>
    <h3>Before you continue</h3>
    <p>You should now be able to read email headers and interpret authentication failures, inspect message artifacts safely, use delivery trace to bound exposure, correlate email indicators with network sessions by timing and destination, and communicate a proportionate investigation scope and response. In Module 08 and beyond, you will apply these cross-source analysis skills in incident response workflows.</p>
  </section>`;
}


function moduleSevenGuidedLabPanel() {
  const complete = moduleSevenGuidedChecks().every((check) => check[2]);
  return `${moduleSevenGuidedGuide()}<div class="m03e-panel" id="m07-guided-prove-panel"><div class="m03e-brief"><p class="m03e-label">CASE NEC-0748 · PRACTICE IT · SHARED-FILE MESSAGE REVIEW</p><p>A shared-file expiry notice reached two mailboxes with different gateway outcomes. Determine who was exposed, correlate the click with DNS and TLS records, separate the legitimate HR portal, and document what remains unverified.</p></div><div class="m03e-console-host" id="m03e-console-m07-guided">${moduleThreeConsoleHtml('m07-guided')}</div></div><p class="m07-guided-status" role="status">${complete ? 'Guided Lab complete: the mail and network evidence is linked to your case.' : 'Use the console to establish exposure and correlate the network trail; progress saves as you work.'}</p>`;
}

/* The Module 3 console carrying Modules 4–6 on this case, plus Email and
 * Network. Mail, DNS, TLS, firewall, proxy and process records are also
 * normalized into Log Search tables. */
const MODULE_SEVEN_CONSOLE_DATA = (function () {
  const s = SocM07AssessmentData.scenario;
  const message = s.messages[0];
  const row = (source, id, time, fields) => m03eRow(source, id, time.slice(0, 10), time.slice(11, 19), fields);
  const related = (e) => [e.relatedRecipientEventId, e.relatedDnsEventId, e.relatedTlsEventId, e.relatedProxyEventId].filter(Boolean);
  const events = [
    ...s.deliveryEvents.map((e) => row('EmailEvents', e.id, e.timestamp, {
      EventType: 'message_delivery', Account: e.recipientId, Subject: message.subject, Sender: message.from.address, ReturnPath: message.returnPath, ReplyTo: message.replyTo,
      Spf: message.authentication.spf, Dkim: message.authentication.dkim, Dmarc: message.authentication.dmarc, Result: e.status, NetworkMessageId: e.messageId, Detail: `${message.subject} from ${message.from.address}`,
    })),
    ...s.recipientEvents.map((e) => row('EmailInteractionEvents', e.id, e.timestamp, {
      EventType: e.type, Account: e.recipientId, Host: e.deviceId, DeviceId: e.deviceId, NetworkMessageId: e.messageId, UrlId: e.urlId, Result: 'observed', Detail: `${e.type} on ${e.deviceId}`,
    })),
    ...s.networkEvents.map((e) => row({ dns_query: 'DnsEvents', tls_session: 'TlsEvents', firewall_flow: 'FirewallEvents', proxy_request: 'ProxyEvents' }[e.type] || 'NetworkEvents', e.id, e.timestamp, {
      EventType: e.type, Account: e.recipientId, Host: e.deviceId, DeviceId: e.deviceId, Domain: e.domain || e.sni || '', Answers: (e.answers || []).join(', '),
      SourceIp: e.sourceIp || '', DestinationIp: e.destinationIp || '', DestinationPort: e.destinationPort || '', Url: e.url || '', Result: e.action || e.status || 'observed',
      RelatedEventIds: related(e), Detail: e.url || (e.domain ? `${e.domain} → ${(e.answers || []).join(', ')}` : `${e.destinationIp}:${e.destinationPort}`),
    })),
    ...s.endpointProcessEvents.map((e) => row('DeviceProcessEvents', e.id, e.timestamp, {
      EventType: e.type, Account: e.recipientId, Host: e.deviceId, DeviceId: e.deviceId, Image: e.imagePath, CommandLine: e.commandLine, ParentProcess: e.parentProcessName,
      ProcessId: e.processName, ParentProcessId: e.parentProcessName,
      Result: 'success', RelatedEventIds: related(e), Detail: e.commandLine,
    })),
    // Background mail/network/endpoint telemetry (benign context, retries, similar-brand senders).
    ...(s.backgroundEvents || []).map((e) => row(e.table, e.id, e.timestamp, e.fields)),
  ];
  return {
    ...m03eBuildDataset({
      caseId: MODULE_SEVEN_CASE_ID,
      day: s.start.slice(0, 10),
      events,
      identities: ['acct-63', 'acct-82', 'acct-17', ...s.backgroundContext.accounts.filter((account) => account !== 'acct-17')].map((account) => ({ Account: account, DisplayName: account, Type: 'User', Department: 'Finance', Owner: '—', Privileged: 'No', UsualSourceIp: '—', Notes: '' })),
      ips: [
        { SourceIp: '203.0.113.88', Type: 'External', Country: '—', Asn: 'Unclassified hosting', FirstSeen: '2026-09-27 10:08', Reputation: 'No reputation data' },
        { SourceIp: '198.51.100.24', Type: 'External', Country: '—', Asn: 'Northwind payroll SaaS', FirstSeen: '2025-02-01 08:00', Reputation: 'Known business service' },
        ...s.backgroundContext.ips,
      ],
      watchlists: {},
      alerts: [
        { id: 'ALT-7101', time: '2026-09-27T10:03:05Z', severity: 'Medium', title: 'Inbound message failed DMARC alignment', entities: [message.from.address], rule: 'Mail gateway: DMARC fail on an external message', query: 'EmailEvents\n| where Dmarc == "fail"' },
        ...s.backgroundContext.alerts,
      ],
    }),
    now: s.end,
  };
}());
const MODULE_SEVEN_DEVICES = [
  { id: 'WS-517', hostname: 'WS-517', platform: 'Windows 11', role: 'User workstation', owner: 'acct-63', zone: 'CORP-USER', status: 'Online' },
  { id: 'WS-204', hostname: 'WS-204', platform: 'Windows 11', role: 'User workstation', owner: 'acct-17', zone: 'CORP-USER', status: 'Online' },
];
const MODULE_SEVEN_TOOL_FIXTURES = {
  m04: SocConsoleTools.m04Fixture({ id: SocM07AssessmentData.scenario.id, caseId: MODULE_SEVEN_CASE_ID, end: SocM07AssessmentData.scenario.end, data: MODULE_SEVEN_CONSOLE_DATA }),
  m05: SocConsoleTools.m05Fixture({ id: SocM07AssessmentData.scenario.id, stateKey: 'm07-endpoint-tools-v1', devices: MODULE_SEVEN_DEVICES, data: MODULE_SEVEN_CONSOLE_DATA }),
  m06: SocConsoleTools.m06Fixture({
    id: SocM07AssessmentData.scenario.id,
    lead: { id: 'M07-LEAD-001', type: 'suspected_delivery_chain', device: 'WS-517', account: 'acct-63', taskName: '—', observation: 'An external invoice message failed DMARC alignment and may have reached a user.' },
    devices: ['WS-517', 'WS-204'], data: MODULE_SEVEN_CONSOLE_DATA, timeStart: SocM07AssessmentData.scenario.start, timeEnd: SocM07AssessmentData.scenario.end,
  }),
};

function moduleSevenM04Tools() {
  moduleSevenState.tools ||= {};
  if (!moduleSevenState.tools.m04?.schemaVersion) moduleSevenState.tools.m04 = SocM04AssessmentState.normalize({ assessment: moduleSevenState.tools.m04 }, MODULE_SEVEN_TOOL_FIXTURES.m04).assessment;
  return moduleSevenState.tools.m04;
}

const MODULE_SEVEN_CONSOLE = (() => {
  const base = { save: () => moduleSevenSave(), rerender: () => moduleSevenRenderAssessmentPanel(), console: () => m03eState('m07') };
  const tool = (key, normalize) => SocConsoleTools.embedded(() => moduleSevenState, key, normalize, MODULE_SEVEN_TOOL_FIXTURES[key], () => moduleSevenSave());
  return SocConsoleTools.mount('m07', {
    data: MODULE_SEVEN_CONSOLE_DATA,
    stateRoot: () => moduleSevenState,
    save: () => moduleSevenSave(),
    title: 'SIEM & NETWORK / EMAIL ANALYSIS',
    ariaLabel: 'Module 07 network and email assessment console',
    sourceMappings: {
      EmailEvents: { native: 'Mail gateway message trace (JSON)', fields: [['received', 'TimeGenerated'], ['recipient', 'Account'], ['subject', 'Subject'], ['from', 'Sender'], ['return_path', 'ReturnPath'], ['reply_to', 'ReplyTo'], ['spf', 'Spf'], ['dkim', 'Dkim'], ['dmarc', 'Dmarc'], ['delivery', 'Result']] },
      EmailInteractionEvents: { native: 'Mailbox interaction audit (JSON)', fields: [['timestamp', 'TimeGenerated'], ['recipient', 'Account'], ['device', 'DeviceId'], ['action', 'EventType'], ['url_id', 'UrlId']] },
      DnsEvents: { native: 'Resolver query log (text)', fields: [['ts', 'TimeGenerated'], ['client', 'DeviceId'], ['query', 'Domain'], ['answers', 'Answers']] },
      TlsEvents: { native: 'TLS session log (JSON)', fields: [['ts', 'TimeGenerated'], ['client', 'DeviceId'], ['server_ip', 'DestinationIp'], ['port', 'DestinationPort'], ['sni', 'Domain']] },
      FirewallEvents: { native: 'Perimeter firewall flows (key=value)', fields: [['ts', 'TimeGenerated'], ['src', 'SourceIp'], ['dst', 'DestinationIp'], ['dport', 'DestinationPort'], ['action', 'Result']] },
      ProxyEvents: { native: 'Web proxy access log (text)', fields: [['ts', 'TimeGenerated'], ['client', 'DeviceId'], ['url', 'Url'], ['status', 'Result']] },
      DeviceProcessEvents: { native: 'EDR process telemetry (JSON)', fields: [['timestamp', 'TimeGenerated'], ['device', 'DeviceId'], ['user', 'Account'], ['image', 'Image'], ['command_line', 'CommandLine'], ['parent', 'ParentProcess']] },
      EmailUrlEvents: { native: 'URL-protection verdict log (JSON)', fields: [['ts', 'TimeGenerated'], ['recipient', 'Account'], ['url', 'Url'], ['verdict', 'Verdict'], ['category', 'Category']] },
      EmailAttachmentEvents: { native: 'Attachment scan verdicts (JSON)', fields: [['ts', 'TimeGenerated'], ['recipient', 'Account'], ['file', 'FileName'], ['verdict', 'Verdict']] },
    },
    packs: [
      { id: 'm04', ctx: { ...base, assessment: moduleSevenM04Tools, fixture: MODULE_SEVEN_TOOL_FIXTURES.m04 } },
      { id: 'm05', ctx: { ...base, fixture: MODULE_SEVEN_TOOL_FIXTURES.m05, ...tool('m05', SocM05AssessmentState.normalize) } },
      { id: 'm06', ctx: { ...base, fixture: MODULE_SEVEN_TOOL_FIXTURES.m06, ...tool('m06', SocM06AssessmentState.normalize) } },
      { id: 'm07', ctx: {
        ...base, fixture: SocM07AssessmentData, ui: { networkFilters: moduleSevenAssessmentNetworkFilters },
        box: { get state() { return moduleSevenAssessmentState; }, set state(value) { moduleSevenAssessmentState = value; } },
        store: (next) => SocM07AssessmentState.save(moduleSevenUser, next, SocM07AssessmentData),
      } },
    ],
    caseView: () => moduleSevenCaseTicket(),
    caseBadge: () => (moduleSevenState.caseRecord.submitted ? ' <i class="ri-checkbox-circle-fill" aria-hidden="true"></i>' : ''),
  });
})();

// Practice It uses a distinct message/network case and a separate action
// store, while retaining the same mail, network, SIEM, endpoint, and hunt tools.
const MODULE_SEVEN_GUIDED_LAB_ID = 'm07-guided-shared-file-case-v1';
const MODULE_SEVEN_GUIDED_REPLACEMENTS = {
  'M07-ASSESS-2026-09-27': 'M07-GUIDED-2026-09-27', 'm07-network-email-assessment-v1': 'm07-guided-mail-network-actions-v1',
  'M07-GROUP-DELIVERED': 'M07-GL-GROUP-DELIVERED', 'M07-GROUP-BLOCKED': 'M07-GL-GROUP-BLOCKED',
  'M07-MSG-001': 'M07-GL-MSG-301', 'M07-URL-001': 'M07-GL-URL-302', 'M07-REDIRECT-001': 'M07-GL-REDIRECT-303', 'M07-REDIRECT-002': 'M07-GL-REDIRECT-304', 'M07-ATTACH-001': 'M07-GL-ATTACH-305',
  'M07-DELIVERY-001': 'M07-GL-DELIVERY-311', 'M07-DELIVERY-002': 'M07-GL-DELIVERY-312', 'M07-QR-014': 'M07-GL-RECIPIENT-313',
  'M07-DNS-001': 'M07-GL-DNS-321', 'M07-TLS-001': 'M07-GL-TLS-331', 'M07-FW-001': 'M07-GL-FW-341', 'M07-PROXY-001': 'M07-GL-PROXY-351',
  'M07-DNS-002': 'M07-GL-DNS-322', 'M07-TLS-002': 'M07-GL-TLS-332', 'M07-FW-002': 'M07-GL-FW-342', 'M07-PROXY-002': 'M07-GL-PROXY-352',
  'M07-PROC-001': 'M07-GL-PROC-361', 'M07-PROC-002': 'M07-GL-PROC-362',
  'acct-63': 'acct-91', 'acct-82': 'acct-97', 'acct-17': 'acct-55', 'WS-517': 'WS-733', 'WS-204': 'WS-208',
  '203.0.113.88': '192.0.2.211', '198.51.100.24': '203.0.113.65', '192.0.2.57': '10.20.4.20', '192.0.2.84': '10.20.4.88',
  'invoice-qr.example': 'doc-access.example', 'payroll.northwind.example': 'hr.paperless-share.example', 'northwind-billing.example': 'paperless-share.example',
  'mailer.northwind-billing.example': 'notify.paperless-share.example', 'billing@northwind-billing.example': 'notice@paperless-share.example',
  'bounce@mailer.northwind-billing.example': 'bounce@notify.paperless-share.example', '7f3a': 'c91d',
  ['a'.repeat(64)]: 'd'.repeat(64), ['b'.repeat(64)]: 'e'.repeat(64), ['c'.repeat(64)]: 'f'.repeat(64),
  '2026-09-27T10:': '2026-09-27T11:',
};
function moduleSevenGuidedReplace(value) {
  if (typeof value === 'string') return Object.entries(MODULE_SEVEN_GUIDED_REPLACEMENTS).reduce((result, [from, to]) => result.split(from).join(to), value);
  if (Array.isArray(value)) return value.map(moduleSevenGuidedReplace);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [moduleSevenGuidedReplace(key), moduleSevenGuidedReplace(item)]));
  return value;
}
const MODULE_SEVEN_GUIDED_FIXTURE = moduleSevenGuidedReplace(JSON.parse(JSON.stringify(SocM07AssessmentData)));
MODULE_SEVEN_GUIDED_FIXTURE.scenario.stateKey = 'm07-guided-mail-network-actions-v1';
MODULE_SEVEN_GUIDED_FIXTURE.scenario.start = '2026-09-27T11:00:00Z';
MODULE_SEVEN_GUIDED_FIXTURE.scenario.end = '2026-09-27T11:20:00Z';
MODULE_SEVEN_GUIDED_FIXTURE.scenario.fixedAt = '2026-09-27T11:20:00Z';
Object.assign(MODULE_SEVEN_GUIDED_FIXTURE.scenario.messages[0], {
  subject: 'Shared file expires today',
  from: { displayName: 'Paperless Share', address: 'notice@paperless-share.example' },
  replyTo: 'help@paperless-share.example', returnPath: 'bounce@notify.paperless-share.example',
  headerMessageId: '<share-notice-301@notify.paperless-share.example>',
  authentication: { spf: 'fail', dkim: 'pass', dmarc: 'fail', aligned: false },
});
MODULE_SEVEN_GUIDED_FIXTURE.scenario.messages[0].urls[0].original = 'https://document-view.example/notice/c91d';
MODULE_SEVEN_GUIDED_FIXTURE.scenario.messages[0].urls[0].redirects = [
  { id: 'M07-GL-REDIRECT-303', status: 302, url: 'https://document-view.example/r/c91d' },
  { id: 'M07-GL-REDIRECT-304', status: 200, url: 'https://doc-access.example/shared/c91d' },
];
Object.assign(MODULE_SEVEN_GUIDED_FIXTURE.scenario.messages[0].attachments[0], { fileName: 'shared-file-notice.html', mediaType: 'text/html', sizeBytes: 24576, sha256: 'd'.repeat(64) });
MODULE_SEVEN_GUIDED_FIXTURE.scenario.networkEvents.find((event) => event.id === 'M07-GL-DNS-321').domain = 'doc-access.example';
MODULE_SEVEN_GUIDED_FIXTURE.scenario.networkEvents.find((event) => event.id === 'M07-GL-TLS-331').sni = 'doc-access.example';
MODULE_SEVEN_GUIDED_FIXTURE.scenario.networkEvents.find((event) => event.id === 'M07-GL-PROXY-351').url = 'https://doc-access.example/shared/c91d';
MODULE_SEVEN_GUIDED_FIXTURE.scenario.networkEvents.find((event) => event.id === 'M07-GL-DNS-322').domain = 'hr.paperless-share.example';
MODULE_SEVEN_GUIDED_FIXTURE.scenario.networkEvents.find((event) => event.id === 'M07-GL-TLS-332').sni = 'hr.paperless-share.example';
MODULE_SEVEN_GUIDED_FIXTURE.scenario.networkEvents.find((event) => event.id === 'M07-GL-PROXY-352').url = 'https://hr.paperless-share.example/portal';
MODULE_SEVEN_GUIDED_FIXTURE.scenario.endpointProcessEvents[0].commandLine = 'chrome.exe https://doc-access.example/shared/c91d';
MODULE_SEVEN_GUIDED_FIXTURE.scenario.endpointProcessEvents[1].commandLine = 'msedge.exe https://hr.paperless-share.example/portal';
MODULE_SEVEN_GUIDED_FIXTURE.scenario.packetSamples.forEach((sample) => { sample.sampleText = sample.sampleText.replaceAll('invoice-qr.example', 'doc-access.example').replaceAll('203.0.113.88', '192.0.2.211').replaceAll('/invoice/c91d', '/shared/c91d'); });
MODULE_SEVEN_GUIDED_FIXTURE.scenario.expectedTruth.confirmed = [
  'The shared-file expiry notice reached acct-91 on WS-733; the copy addressed to acct-97 was blocked by the gateway.',
  'acct-91 opened the message. The subsequent lookup for doc-access.example resolved to 192.0.2.211, followed by TLS with matching SNI.',
];
MODULE_SEVEN_GUIDED_FIXTURE.scenario.expectedTruth.unconfirmed = [
  'Endpoint execution is not established by the available browser process record.',
  'Credential entry or credential compromise is not established by the mail and network evidence.',
];
MODULE_SEVEN_GUIDED_FIXTURE.scenario.expectedTruth.incidentChain = [
  { step: 'message_delivery', status: 'confirmed', recipientIds: ['acct-91'], evidence: 'M07-GL-DELIVERY-311' },
  { step: 'recipient_open', status: 'confirmed', recipientIds: ['acct-91'], evidence: 'M07-GL-RECIPIENT-313' },
  { step: 'dns_resolution', status: 'confirmed', domain: 'doc-access.example', address: '192.0.2.211', evidence: 'M07-GL-DNS-321' },
  { step: 'tls_connection', status: 'confirmed', address: '192.0.2.211', sni: 'doc-access.example', evidence: 'M07-GL-TLS-331' },
  { step: 'endpoint_execution', status: 'unverified', evidence: null },
  { step: 'credential_compromise', status: 'unverified', evidence: null },
];
// Practice It background telemetry is generated from its own world (people, devices, domains, addresses, hour),
// not from the assessment rows, so no EventId, entity or indicator is shared between the two cases.
const MODULE_SEVEN_GUIDED_BACKGROUND = SocM07AssessmentData.buildBackground(SocM07AssessmentData.guidedBackgroundWorld);
MODULE_SEVEN_GUIDED_FIXTURE.scenario.backgroundEvents = MODULE_SEVEN_GUIDED_BACKGROUND.events;
MODULE_SEVEN_GUIDED_FIXTURE.scenario.backgroundContext = { accounts: MODULE_SEVEN_GUIDED_BACKGROUND.accounts, ips: MODULE_SEVEN_GUIDED_BACKGROUND.ips, alerts: MODULE_SEVEN_GUIDED_BACKGROUND.alerts };
MODULE_SEVEN_GUIDED_FIXTURE.scenario.expectedTruth.benignBackgroundEventIds = MODULE_SEVEN_GUIDED_BACKGROUND.truth.benignBackgroundEventIds;
MODULE_SEVEN_GUIDED_FIXTURE.scenario.expectedTruth.alertDispositions = MODULE_SEVEN_GUIDED_BACKGROUND.truth.alertDispositions;


function moduleSevenGuidedBuildConsoleData() {
  const s = MODULE_SEVEN_GUIDED_FIXTURE.scenario;
  const message = s.messages[0];
  const row = (source, id, time, fields) => m03eRow(source, id, time.slice(0, 10), time.slice(11, 19), fields);
  const related = (event) => [event.relatedRecipientEventId, event.relatedDnsEventId, event.relatedTlsEventId, event.relatedProxyEventId].filter(Boolean);
  const events = [
    ...s.deliveryEvents.map((event) => row('EmailEvents', event.id, event.timestamp, { EventType: 'message_delivery', Account: event.recipientId, Subject: message.subject, Sender: message.from.address, ReturnPath: message.returnPath, ReplyTo: message.replyTo, Spf: message.authentication.spf, Dkim: message.authentication.dkim, Dmarc: message.authentication.dmarc, Result: event.status, NetworkMessageId: event.messageId, Detail: `${message.subject} from ${message.from.address}` })),
    ...s.recipientEvents.map((event) => row('EmailInteractionEvents', event.id, event.timestamp, { EventType: event.type, Account: event.recipientId, Host: event.deviceId, DeviceId: event.deviceId, NetworkMessageId: event.messageId, UrlId: event.urlId, Result: 'observed', Detail: `${event.type} on ${event.deviceId}` })),
    ...s.networkEvents.map((event) => row({ dns_query: 'DnsEvents', tls_session: 'TlsEvents', firewall_flow: 'FirewallEvents', proxy_request: 'ProxyEvents' }[event.type] || 'NetworkEvents', event.id, event.timestamp, { EventType: event.type, Account: event.recipientId, Host: event.deviceId, DeviceId: event.deviceId, Domain: event.domain || event.sni || '', Answers: (event.answers || []).join(', '), SourceIp: event.sourceIp || '', DestinationIp: event.destinationIp || '', DestinationPort: event.destinationPort || '', Url: event.url || '', Result: event.action || event.status || 'observed', RelatedEventIds: related(event), Detail: event.url || (event.domain ? `${event.domain} → ${(event.answers || []).join(', ')}` : `${event.destinationIp}:${event.destinationPort}`) })),
    ...s.endpointProcessEvents.map((event) => row('DeviceProcessEvents', event.id, event.timestamp, { EventType: event.type, Account: event.recipientId, Host: event.deviceId, DeviceId: event.deviceId, Image: event.imagePath, CommandLine: event.commandLine, ParentProcess: event.parentProcessName, ProcessId: event.processName, ParentProcessId: event.parentProcessName, Result: 'success', RelatedEventIds: related(event), Detail: event.commandLine })),
    ...(s.backgroundEvents || []).map((event) => row(event.table, event.id, event.timestamp, event.fields)),
  ];
  const person = (account) => ({ Account: account, DisplayName: account, Type: 'User', Department: 'Finance', Owner: '—', Privileged: 'No', UsualSourceIp: '—', Notes: '' });
  return { ...m03eBuildDataset({ caseId: 'NEC-0748', day: s.start.slice(0, 10), events,
    identities: ['acct-91', 'acct-97', 'acct-55', ...s.backgroundContext.accounts.filter((account) => account !== 'acct-55')].map(person),
    ips: [{ SourceIp: '192.0.2.211', Type: 'External', Country: '—', Asn: 'Unclassified file-hosting test range', FirstSeen: '2026-09-27 11:08', Reputation: 'No reputation data' }, { SourceIp: '203.0.113.65', Type: 'External', Country: '—', Asn: 'Paperless Share HR portal', FirstSeen: '2025-02-01 08:00', Reputation: 'Known business service' }, ...s.backgroundContext.ips],
    watchlists: {}, alerts: [{ id: 'ALT-7481', time: '2026-09-27T11:03:05Z', severity: 'Medium', title: 'Shared-file notice failed DMARC alignment', entities: ['notice@paperless-share.example'], rule: 'Mail gateway: DMARC fail on an external message', query: 'EmailEvents\n| where Dmarc == "fail"' }, ...s.backgroundContext.alerts],
  }), now: s.end };
}
const MODULE_SEVEN_GUIDED_CONSOLE_DATA = moduleSevenGuidedBuildConsoleData();
const MODULE_SEVEN_GUIDED_DEVICES = [
  { id: 'WS-733', hostname: 'WS-733', platform: 'Windows 11', role: 'User workstation', owner: 'acct-91', zone: 'CORP-USER', status: 'Online' },
  { id: 'WS-208', hostname: 'WS-208', platform: 'Windows 11', role: 'User workstation', owner: 'acct-55', zone: 'CORP-USER', status: 'Online' },
];
const MODULE_SEVEN_GUIDED_TOOL_FIXTURES = {
  m04: SocConsoleTools.m04Fixture({ id: MODULE_SEVEN_GUIDED_FIXTURE.scenario.id, caseId: 'NEC-0748', end: MODULE_SEVEN_GUIDED_FIXTURE.scenario.end, data: MODULE_SEVEN_GUIDED_CONSOLE_DATA }),
  m05: SocConsoleTools.m05Fixture({ id: MODULE_SEVEN_GUIDED_FIXTURE.scenario.id, stateKey: 'm07-guided-endpoint-tools-v1', devices: MODULE_SEVEN_GUIDED_DEVICES, data: MODULE_SEVEN_GUIDED_CONSOLE_DATA }),
  m06: SocConsoleTools.m06Fixture({ id: MODULE_SEVEN_GUIDED_FIXTURE.scenario.id, lead: { id: 'M07-GUIDED-LEAD-001', type: 'suspected_delivery_chain', device: 'WS-733', account: 'acct-91', taskName: '—', observation: 'An external shared-file message failed DMARC alignment and may have reached a user.' }, devices: ['WS-733', 'WS-208'], data: MODULE_SEVEN_GUIDED_CONSOLE_DATA, timeStart: MODULE_SEVEN_GUIDED_FIXTURE.scenario.start, timeEnd: MODULE_SEVEN_GUIDED_FIXTURE.scenario.end }),
};
let moduleSevenGuidedState = null;
let moduleSevenGuidedAssessmentState = null;
let moduleSevenGuidedUser = null;
let moduleSevenGuidedNetworkFilters = {};
function moduleSevenGuidedLoad(user) {
  moduleSevenGuidedUser = user;
  const defaults = { console: {}, tools: {}, caseRecord: { caseId: 'NEC-0748', scenarioId: MODULE_SEVEN_GUIDED_FIXTURE.scenario.id, status: 'New', affectedUser: '', affectedDevice: '', severity: '', disposition: '', escalation: '', escalateTo: '', notes: '', findings: {}, submitted: false, actionHistory: [] }, guideOpen: true };
  moduleSevenGuidedState = LabRuntime.loadCaseState(MODULE_SEVEN_GUIDED_LAB_ID, 'soc-07', user, defaults);
  moduleSevenGuidedState.caseRecord = { ...defaults.caseRecord, ...(moduleSevenGuidedState.caseRecord || {}) };
  moduleSevenGuidedState.tools ||= {};
  moduleSevenGuidedState.tools.m04 = SocM04AssessmentState.normalize({ assessment: moduleSevenGuidedState.tools.m04 }, MODULE_SEVEN_GUIDED_TOOL_FIXTURES.m04).assessment;
  moduleSevenGuidedState.tools.m05 = SocM05AssessmentState.normalize(moduleSevenGuidedState.tools.m05, MODULE_SEVEN_GUIDED_TOOL_FIXTURES.m05);
  moduleSevenGuidedState.tools.m06 = SocM06AssessmentState.normalize(moduleSevenGuidedState.tools.m06, MODULE_SEVEN_GUIDED_TOOL_FIXTURES.m06);
  moduleSevenGuidedAssessmentState = SocM07AssessmentState.load(user, MODULE_SEVEN_GUIDED_FIXTURE);
}
function moduleSevenGuidedSave() { if (moduleSevenGuidedUser && moduleSevenGuidedState) LabRuntime.saveCaseState(MODULE_SEVEN_GUIDED_LAB_ID, 'soc-07', moduleSevenGuidedUser, moduleSevenGuidedState); }
function moduleSevenGuidedM04Tools() { return moduleSevenGuidedState.tools.m04; }
function moduleSevenGuidedM07Store(state) { moduleSevenGuidedAssessmentState = SocM07AssessmentState.save(moduleSevenGuidedUser, state, MODULE_SEVEN_GUIDED_FIXTURE); moduleSevenGuidedSave(); }
function moduleSevenGuidedChecks() {
  const action = moduleSevenGuidedAssessmentState;
  const selected = new Set((action.evidenceChanges || []).filter((entry) => entry.operation === 'add').map((entry) => entry.eventId));
  const network = MODULE_SEVEN_GUIDED_FIXTURE.scenario.networkEvents;
  const benignReviewed = (action.reviewedNetworkEventIds || []).some((id) => network.find((event) => event.id === id)?.benignLookalike === true);
  const incident = (action.incidentLinks || []).at(-1);
  return [
    ['exposure', 'Review the message and confirm the delivered versus blocked recipient scope.', (action.reviewedMessageIds || []).includes('M07-GL-MSG-301') && (action.actionHistory || []).some((entry) => entry.type === 'recipient_search')],
    ['network', 'Correlate the click with the matching DNS and TLS destination; review the HR lookalike.', ['M07-GL-RECIPIENT-313', 'M07-GL-DNS-321', 'M07-GL-TLS-331'].every((id) => selected.has(id) || (action.reviewedNetworkEventIds || []).includes(id)) && benignReviewed],
    ['case', 'Link the supported evidence to an incident and state what remains unverified in your ticket.', Boolean(incident && !incident.eventIds.some((id) => network.find((event) => event.id === id)?.benignLookalike) && moduleSevenGuidedState.caseRecord.notes?.trim())],
  ];
}
function moduleSevenGuidedGuide() {
  const checks = moduleSevenGuidedChecks();
  return `<details class="m07-console-guide" ${moduleSevenGuidedState.guideOpen ? 'open' : ''}><summary>Investigation checkpoints · ${checks.filter((check) => check[2]).length}/${checks.length}</summary><ol>${checks.map((check) => `<li>${check[1]} <span>${check[2] ? 'Done' : 'Pending'}</span></li>`).join('')}</ol><details><summary>Optional hint</summary><p>Match the message's final URL host to the resolver answer and TLS SNI; keep the trusted HR portal out of the case.</p></details></details>`;
}
const MODULE_SEVEN_GUIDED_CONSOLE = (() => {
  const base = { save: moduleSevenGuidedSave, rerender: () => moduleSevenRenderGuidedPanel(), console: () => m03eState('m07-guided') };
  const tool = (key, normalize) => SocConsoleTools.embedded(() => moduleSevenGuidedState, key, normalize, MODULE_SEVEN_GUIDED_TOOL_FIXTURES[key], moduleSevenGuidedSave);
  return SocConsoleTools.mount('m07-guided', {
    data: MODULE_SEVEN_GUIDED_CONSOLE_DATA, stateRoot: () => moduleSevenGuidedState, save: moduleSevenGuidedSave,
    title: 'SIEM & NETWORK / EMAIL ANALYSIS · PRACTICE', ariaLabel: 'Module 07 guided email and network console', idPrefix: 'guided-m07',
    sourceMappings: {
      EmailEvents: { native: 'Mail gateway message trace (JSON)', fields: [['received', 'TimeGenerated'], ['recipient', 'Account'], ['subject', 'Subject'], ['from', 'Sender'], ['spf', 'Spf'], ['dkim', 'Dkim'], ['dmarc', 'Dmarc'], ['delivery', 'Result']] },
      EmailInteractionEvents: { native: 'Mailbox interaction audit (JSON)', fields: [['timestamp', 'TimeGenerated'], ['recipient', 'Account'], ['device', 'DeviceId'], ['action', 'EventType'], ['url_id', 'UrlId']] },
      DnsEvents: { native: 'Resolver query log (text)', fields: [['ts', 'TimeGenerated'], ['client', 'DeviceId'], ['query', 'Domain'], ['answers', 'Answers']] },
      TlsEvents: { native: 'TLS session log (JSON)', fields: [['ts', 'TimeGenerated'], ['client', 'DeviceId'], ['server_ip', 'DestinationIp'], ['port', 'DestinationPort'], ['sni', 'Domain']] },
      FirewallEvents: { native: 'Perimeter firewall flows (key=value)', fields: [['ts', 'TimeGenerated'], ['src', 'SourceIp'], ['dst', 'DestinationIp'], ['dport', 'DestinationPort'], ['action', 'Result']] },
      ProxyEvents: { native: 'Web proxy access log (text)', fields: [['ts', 'TimeGenerated'], ['client', 'DeviceId'], ['url', 'Url'], ['status', 'Result']] },
      DeviceProcessEvents: { native: 'EDR process telemetry (JSON)', fields: [['timestamp', 'TimeGenerated'], ['device', 'DeviceId'], ['user', 'Account'], ['image', 'Image'], ['command_line', 'CommandLine'], ['parent', 'ParentProcess']] },
      EmailUrlEvents: { native: 'URL-protection verdict log (JSON)', fields: [['ts', 'TimeGenerated'], ['recipient', 'Account'], ['url', 'Url'], ['verdict', 'Verdict'], ['category', 'Category']] },
      EmailAttachmentEvents: { native: 'Attachment scan verdicts (JSON)', fields: [['ts', 'TimeGenerated'], ['recipient', 'Account'], ['file', 'FileName'], ['verdict', 'Verdict']] },
    },
    packs: [
      { id: 'm04', ctx: { ...base, assessment: moduleSevenGuidedM04Tools, fixture: MODULE_SEVEN_GUIDED_TOOL_FIXTURES.m04 } },
      { id: 'm05', ctx: { ...base, fixture: MODULE_SEVEN_GUIDED_TOOL_FIXTURES.m05, ...tool('m05', SocM05AssessmentState.normalize) } },
      { id: 'm06', ctx: { ...base, fixture: MODULE_SEVEN_GUIDED_TOOL_FIXTURES.m06, ...tool('m06', SocM06AssessmentState.normalize) } },
      { id: 'm07', ctx: { ...base, fixture: MODULE_SEVEN_GUIDED_FIXTURE, ui: { get networkFilters() { return moduleSevenGuidedNetworkFilters; }, set networkFilters(value) { moduleSevenGuidedNetworkFilters = value; } }, box: { get state() { return moduleSevenGuidedAssessmentState; }, set state(value) { moduleSevenGuidedAssessmentState = value; } }, store: moduleSevenGuidedM07Store } },
    ],
    caseView: () => caseRecordPane(moduleSevenGuidedState.caseRecord, { caseId: 'NEC-0748', ticketId: 'INC-0748', ticketType: 'Shared-file phishing exposure · Messaging Security', userOptions: [{ id: 'acct-91', text: 'acct-91 · delivered/clicked' }, { id: 'acct-97', text: 'acct-97 · gateway blocked' }, { id: 'acct-55', text: 'acct-55 · HR baseline' }], deviceOptions: [{ id: 'WS-733', text: 'WS-733 · clicked user device' }, { id: 'WS-208', text: 'WS-208 · HR portal baseline' }], departmentOptions: [{ id: 'messaging-security', text: 'Messaging Security' }, { id: 'tier2-soc', text: 'Tier 2 SOC' }, { id: 'identity-response', text: 'Identity Response' }], formId: 'm07-guided-case', saveAttr: 'data-m07-guided-save-case', submitAttr: 'data-m07-guided-submit-case', panelId: 'm07-guided-case-panel', notesPlaceholder: 'Document message authentication, delivery scope, click-to-network correlation, and unverified endpoint/credential outcomes.' }),
  });
})();

function moduleSevenCaseTicket() {
  const cr = moduleSevenState.caseRecord;
  const spec = moduleSevenProveItSpec();
  return `${caseRecordPane(cr, {
    ...spec,
    missing: caseRecordMissing(cr, spec),
    reviewStatus: moduleSevenProveItReviewStatus(),
    redoRequested: moduleSevenProveItRedoRequested(),
    redoHtml: moduleSevenProveItRedoFeedback(),
    showMissing: moduleSevenProveItShowMissing,
  })}${cr.submitted && cr.reviewPayload ? `<section class="m04-assessment-review" data-m07-submitted-review><h4>Assessment review</h4><p><strong>${esc(cr.reviewPayload.score)}/${esc(cr.reviewPayload.maxScore)} points</strong></p><ol>${(cr.reviewPayload.criteria || []).map((criterion) => `<li><strong>${esc(criterion.label)}: ${esc(criterion.points)}/${esc(criterion.max)}</strong></li>`).join('')}</ol></section>` : ''}`;
}

function moduleSevenAssessmentLabPanel() {
  return `<div class="m03e-panel" id="m07-prove-panel">
    <div class="m03e-brief"><p class="m03e-label">CASE ${esc(MODULE_SEVEN_CASE_ID)} · SUSPECTED DELIVERY CHAIN · ASSIGNED TO YOU</p><p>The mail gateway flagged an external invoice message. Your lead’s request: <em>“Tell me who actually got it, what they did with it, and what their machine did next — and keep what we can prove separate from what we can’t.”</em> Validate the sender and authentication, inspect the URL, determine delivery and recipient scope, correlate the user action with endpoint and DNS/TLS/network activity, separate it from nearby noise, preserve email and network evidence, create or update the incident, and complete the ITSM ticket.</p></div>
    <div class="m03e-console-host" id="m03e-console-m07">${moduleThreeConsoleHtml('m07')}</div>
  </div>`;
}

const MODULE_SEVEN_OPTIONAL_LABS = [
  { title: 'Tunnel Log Analysis — GRE Covert Channel Detection', detail: 'Independent tunnel/GRE log analysis', href: 'imported-labs/mission-next-labs/index.html#/track/splunk/module/gre-tunnel-log-analysis', labId: 'assessment-1' },
  { title: 'HTTP Log Analysis', detail: 'Web attack detection in HTTP access logs', href: 'imported-labs/mission-next-labs/index.html#/track/splunk/module/http-log-analysis', labId: 'assessment-2' },
  { title: 'FTP Log Analysis — Anonymous Access & Data Exfiltration', detail: 'Supplementary log-analysis practice', href: 'imported-labs/mission-next-labs/index.html#/track/splunk/module/ftp-log-analysis', labId: 'additional-ftp-log-analysis' },
];

function moduleSevenAdditionalLabs() {
  return `<div id="m07-additional-lab-dynamic">${missionNextOptionalLabsSection(7, MODULE_SEVEN_OPTIONAL_LABS, moduleSevenState.labProgress)}</div>`;
}

function viewModuleSeven(user, program) {
  moduleSevenLoad(user);
  moduleSevenGuidedLoad(user);
  const module = program.modules['soc-07'];
  const sections = moduleSevenGetSections();
  const lectureOpen = moduleSevenReviewMode || !sections[0].isComplete;
  const quizOpen = moduleSevenReviewMode || (moduleSevenQuizState && !moduleSevenQuizState.passed);
  const guidedLabOpen = moduleSevenReviewMode || !sections[2].isComplete;
  const assessmentLabOpen = moduleSevenReviewMode || !sections[3].isComplete;
  const reviewOpen = moduleSevenReviewMode;
  const quickNavItems = moduleSevenGetQuickNavItems();

  return `<div class="m07-shell">
    ${moduleTopbar(user, program)}
    <div class="mquick-nav-layout">
      ${moduleProgressShell(sections, { reviewMode: moduleSevenReviewMode })}
      <main class="m07-main mf-frame">
      <section class="m07-hero mf-hero" aria-labelledby="m07-title"><div><p class="m07-kicker mf-kicker">Module 07 · ${formatHandsOnDuration(module.durationMinutes)} · analysis practice</p><h1 id="m07-title">${esc(module.title)}</h1><p class="m07-lede mf-lede">Trace a suspicious shared-file notice from mail authentication and delivery through the user's network session, while keeping unverified endpoint and credential outcomes explicit.</p></div><dl class="m07-progress mf-stats" aria-label="Saved lab progress"><div><dt>Curriculum items</dt><dd>${module.lessons}</dd></div><div><dt>Guided Lab</dt><dd id="m07-guided-status">${moduleSevenGuidedChecks().every((check) => check[2]) ? 'Complete' : moduleSevenGuidedChecks().some((check) => check[2]) ? 'In progress' : 'Not started'}</dd></div><div><dt>Assessment Lab</dt><dd id="m07-status">${moduleSevenState.completed ? 'Complete' : moduleSevenState.attempts ? 'In progress' : 'Not started'}</dd></div></dl></section>

      <details class="m07-section-collapsible mf-section" ${lectureOpen ? 'open' : ''}>
        <summary class="m07-section"><div class="m07-section-heading mf-section-heading"><span class="m07-section-badge mf-section-badge">1</span><div><p class="m07-kicker mf-kicker">Lecture</p><h2 id="m07-lecture">Email authentication and network correlation</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m07-section-body mf-section-body">
          <section class="m07-objective" aria-labelledby="m07-objective-title"><i class="ri-focus-3-line" aria-hidden="true"></i><div><p class="m07-kicker">Measurable objective</p><h3 id="m07-objective-title">Analyze real-world-style network and log data and justify a defensible triage decision in your assessment write-up.</h3></div></section>
          <section class="m07-section" id="m07-field-guide" aria-labelledby="m07-guide-title"><div class="m07-section-heading"><span>a</span><div><p class="m07-kicker">Field guide</p><h3 id="m07-guide-title">Follow identity, artifact, delivery, and session</h3></div></div>${moduleSevenConcepts()}<div class="m07-analysis-chain" aria-label="Email and network analysis sequence"><span>Sender identity</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>URL &amp; file</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>Delivery trace</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>DNS &amp; TLS</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>Scope &amp; response</span></div></section>
          ${moduleSevenEvidenceDesk()}
          ${moduleSevenVideoScript()}
        </div>
      </details>

      <details class="m07-section-collapsible mf-section" ${quizOpen ? 'open' : ''}>
        <summary class="m07-section"><div class="m07-section-heading mf-section-heading"><span class="m07-section-badge mf-section-badge">2</span><div><p class="m07-kicker mf-kicker">Knowledge Check</p><h2 id="m07-knowledge-check">Test your understanding of email and network analysis</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m07-section-body mf-section-body">${moduleSevenQuizPanel()}</div>
      </details>

      <details class="m07-section-collapsible mf-section mf-lab-section" ${guidedLabOpen ? 'open' : ''}>
        <summary class="m07-section"><div class="m07-section-heading mf-section-heading"><span class="m07-section-badge mf-section-badge">3</span><div><p class="m07-kicker mf-kicker">Practice It · Guided Lab</p><h2 id="m07-guided-lab">Shared-file message and network investigation</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m07-section-body mf-section-body">
          <div id="m07-guided-lab-dynamic">${moduleSevenGuidedLabPanel()}</div>
        </div>
      </details>

      <details class="m07-section-collapsible mf-section" ${assessmentLabOpen ? 'open' : ''}>
        <summary class="m07-section"><div class="m07-section-heading mf-section-heading"><span class="m07-section-badge mf-section-badge">4</span><div><p class="m07-kicker mf-kicker">Prove It · Assessment Labs</p><h2 id="m07-assessment-lab">Independent tunnel and HTTP log analysis review</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m07-section-body mf-section-body">
          <div id="m07-assessment-lab-dynamic">${moduleSevenAssessmentLabPanel()}</div>
        </div>
      </details>

      ${moduleSevenAdditionalLabs()}

      <details class="m07-section-collapsible mf-section" ${reviewOpen ? 'open' : ''}>
        <summary class="m07-section"><div class="m07-section-heading mf-section-heading"><span class="m07-section-badge mf-section-badge">5</span><div><p class="m07-kicker mf-kicker">Module Review</p><h2 id="m07-review">Key concepts and takeaways</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m07-section-body mf-section-body">${moduleSevenReview()}</div>
      </details>

      <details class="m07-section-collapsible mf-section mf-section-supplemental" ${moduleSevenReviewMode ? 'open' : ''}>
        <summary class="m07-section"><div class="m07-section-heading mf-section-heading"><span class="m07-section-badge mf-section-badge"><i class="ri-book-open-line" aria-hidden="true"></i></span><div><p class="m07-kicker mf-kicker">Sources &amp; Further Reading</p><h2 id="m07-sources">Authoritative references</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m07-section-body mf-section-body">${moduleSourcesBlock(MODULE_SEVEN_SOURCES_LIST)}</div>
      </details>
    </main>
    </div>
  </div>`;
}

function moduleSevenRenderQuiz(focusId) {
  const form = document.getElementById('m07-quiz-form');
  if (!form) return;
  form.innerHTML = moduleSevenQuizPanel();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function wireModuleSevenQuiz() {
  const form = document.getElementById('m07-quiz-form');
  if (!form || !moduleSevenQuizState) return;

  form.addEventListener('change', (event) => {
    if (!event.target.hasAttribute('data-m07-quiz-answer')) return;
    const questionId = event.target.closest('[data-question-id]')?.dataset.questionId;
    if (questionId) {
      moduleSevenQuizState.answers[questionId] = event.target.value;
      moduleSevenRenderQuiz();
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const answers = moduleSevenQuizState.answers;
    const feedback = [];
    let correctCount = 0;

    moduleSevenQuizState.selectedQuestions.forEach((selected) => {
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

    moduleSevenQuizState.score = Math.round((correctCount / moduleSevenQuizState.selectedQuestions.length) * 100);
    moduleSevenQuizState.attempts += 1;
    moduleSevenQuizState.bestScore = Math.max(moduleSevenQuizState.bestScore || 0, moduleSevenQuizState.score);
    moduleSevenQuizState.feedback = feedback;
    moduleSevenQuizState.scored = true;
    const passed = moduleSevenQuizState.score >= 70;
    moduleSevenQuizState.passed = passed;

    if (!passed) {
      moduleSevenState.lastQuizQuestionIds = moduleSevenQuizState.selectedQuestions.map((s) => s.question.id);
    }

    moduleSevenSave();
    moduleSevenRenderQuiz('m07-quiz-feedback');
  });

  form.addEventListener('click', (event) => {
    if (event.target.closest('[data-m07-quiz-retake]')) {
      event.preventDefault();
      moduleSevenQuizForceRetake = true;
      form.innerHTML = moduleSevenQuizPanel();
      return;
    }
    if (!event.target.closest('[data-m07-quiz-retry]')) return;
    event.preventDefault();
    const previousQuestionIds = moduleSevenQuizState.selectedQuestions.map((s) => s.question.id);
    const selection = selectQuizQuestions(MODULE_SEVEN_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    moduleSevenQuizState = {
      selectedQuestions: selection.selectedQuestions,
      questionsByAnswer: selection.questionsByAnswer,
      answers: {},
      scored: false,
      attempts: moduleSevenQuizState.attempts,
      score: 0,
      bestScore: moduleSevenQuizState.bestScore,
      feedback: [],
      passed: false,
    };
    moduleSevenRenderQuiz();
  });
}

function moduleSevenRenderGuidedPanel() {
  const root = document.getElementById('m07-guided-lab-dynamic');
  if (!root) return;
  root.innerHTML = moduleSevenGuidedLabPanel();
  const host = root.querySelector('#m03e-console-m07-guided');
  if (host) { MODULE_SEVEN_GUIDED_CONSOLE.wire(host); m03eAttachEditor('m07-guided'); }
}

function wireModuleSevenGuidedLab() {
  const root = document.getElementById('m07-guided-lab-dynamic');
  if (!root || !moduleSevenGuidedState) return;
  const host = root.querySelector('#m03e-console-m07-guided');
  if (host) { MODULE_SEVEN_GUIDED_CONSOLE.wire(host); m03eAttachEditor('m07-guided'); }
  if (!root.dataset.m07GuidedObserver) {
    root.dataset.m07GuidedObserver = 'true';
    SocConsoleTools.watchGuide(root, { selector: '.m07-console-guide', render: moduleSevenGuidedGuide, update: () => {
      const checks = moduleSevenGuidedChecks();
      const complete = checks.every((check) => check[2]);
      SocConsoleTools.setText(root.querySelector('.m07-guided-status'), complete ? 'Guided Lab complete: the mail and network evidence is linked to your case.' : 'Use the console to establish exposure and correlate the network trail; progress saves as you work.');
      SocConsoleTools.setText(document.getElementById('m07-guided-status'), complete ? 'Complete' : checks.some((check) => check[2]) ? 'In progress' : 'Not started');
    } });
  }
  root.addEventListener('input', (event) => {
    if (event.target.matches('#guided-m07-m07-guided-case [name="notes"]')) moduleSevenGuidedState.caseRecord.notes = event.target.value;
  });
  root.addEventListener('change', (event) => {
    const field = event.target.closest('#guided-m07-m07-guided-case [name]');
    if (!field) return;
    if (field.name.startsWith('finding:')) moduleSevenGuidedState.caseRecord.findings[field.name.slice(8)] = field.value;
    else moduleSevenGuidedState.caseRecord[field.name] = field.value;
    moduleSevenGuidedSave();
  });
  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-m07-guided-submit-case]')) { event.preventDefault(); return; }
    if (event.target.closest('[data-m07-guided-save-case]')) {
      event.preventDefault();
      moduleSevenGuidedState.caseRecord.actionHistory.push({ action: 'Ticket updated', at: new Date().toISOString() });
      moduleSevenGuidedSave();
      m03eRender('m07-guided');
      return;
    }
    if (event.target.closest('.m07-console-guide > summary')) {
      requestAnimationFrame(() => { moduleSevenGuidedState.guideOpen = Boolean(root.querySelector('.m07-console-guide')?.open); moduleSevenGuidedSave(); });
    }
  });
}

function wireModuleSevenAdditionalLabGating() {
  const root = document.getElementById('m07-additional-lab-dynamic');
  if (!root || !moduleSevenState) return;
  wireMissionNextLabGating(root, moduleSevenState.labProgress, () => {
    moduleSevenSave();
    root.outerHTML = moduleSevenAdditionalLabs();
    wireModuleSevenAdditionalLabGating();
  });
}

function wireModuleSevenAssessmentLabGating() {}

function moduleSevenRenderAssessmentPanel(focusId) {
  const root = document.getElementById('m07-assessment-lab-dynamic');
  if (!root) return;
  root.innerHTML = moduleSevenAssessmentLabPanel();
  m03eAttachEditor('m07');
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function moduleSevenFinalizeProveIt() {
  if (moduleSevenState.caseRecord.submitted) return;
  const missing = caseRecordMissing(moduleSevenState.caseRecord, moduleSevenProveItSpec());
  const scored = SocM07AssessmentScorer.score(SocM07AssessmentState.load(moduleSevenUser, SocM07AssessmentData), SocM07AssessmentData);
  const performance = { missing, score: scored.score, breakdown: scored.criteria, feedback: scored.review.feedback, criticalErrors: scored.criticalMisses || [] };
  if (performance.missing.length) {
    moduleSevenProveItShowMissing = true;
    moduleSevenRenderAssessmentPanel('m07-review-submission');
    return;
  }
  moduleSevenProveItShowMissing = false;
  const now = new Date().toISOString();
  moduleSevenState.caseRecord.submitted = true;
  moduleSevenState.caseRecord.submittedAt = now;
  moduleSevenState.caseRecord.caseId = MODULE_SEVEN_CASE_ID;
  moduleSevenState.caseRecord.scenarioId = SocM07AssessmentData.scenario.id;
  moduleSevenState.caseRecord.reviewPayload = { ...JSON.parse(JSON.stringify(scored)), caseId: MODULE_SEVEN_CASE_ID, scenarioId: SocM07AssessmentData.scenario.id };
  moduleSevenState.score = scored.score;
  moduleSevenState.caseRecord.actionHistory.push({ action: 'Submitted case for faculty review', at: now });
  moduleSevenState.attempts = (moduleSevenState.attempts || 0) + 1;
  moduleSevenState.lastSubmittedAt = now;
  moduleSevenState.completed = true;
  moduleSevenState.notes = moduleSevenState.caseRecord.notes;
  if (!moduleSevenState.flags.includes(MODULE_SEVEN_FLAG)) moduleSevenState.flags.push(MODULE_SEVEN_FLAG);
  moduleSevenSave();
  if (typeof recordLabAttempt === 'function') {
    const caseSpec = moduleSevenProveItSpec();
    const attemptFields = {
      state: 'complete',
      score: performance.score,
      result: {
        rubric_version: scored.rubricVersion,
        breakdown: performance.breakdown,
        feedback: performance.feedback,
        review_payload: moduleSevenState.caseRecord.reviewPayload,
        critical_errors: performance.criticalErrors,
        case_record: moduleSevenState.caseRecord,
        case_display: caseRecordDisplay(moduleSevenState.caseRecord, caseSpec),
        case_summary: caseRecordSummary(moduleSevenState.caseRecord, caseSpec),
      },
    };
    MODULE_SEVEN_CATALOG_LAB_KEYS.forEach((labKey) => recordLabAttempt(moduleSevenUser, labKey, attemptFields));
  }
  moduleSevenMarkCatalogLabs(true);
  const status = document.getElementById('m07-status');
  if (status) status.textContent = 'Complete';
  moduleSevenRenderAssessmentPanel();
}

function wireModuleSevenAssessmentLab() {
  const root = document.getElementById('m07-assessment-lab-dynamic');
  if (!root || !moduleSevenState) return;
  MODULE_SEVEN_CONSOLE.wire(root);
  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-m07-submit-proveit]')) { moduleSevenFinalizeProveIt(); return; }
    if (event.target.closest('[data-m07-save-proveit]')) {
      moduleSevenState.caseRecord.actionHistory.push({ action: 'Saved case', at: new Date().toISOString() });
      moduleSevenSave();
      moduleSevenRenderAssessmentPanel();
    }
  });
  root.addEventListener('change', (event) => {
    const input = event.target;
    // Only the ITSM ticket form writes ticket fields.
    if (!input.name || !input.closest('#m07-assessment-form') || moduleSevenState.caseRecord.submitted) return;
    if (caseRecordApply(moduleSevenState.caseRecord, input.name, input.value)) {
      moduleSevenState.caseRecord.actionHistory.push({ action: `Updated ${input.name}`, at: new Date().toISOString() });
      moduleSevenSave();
      moduleSevenRenderAssessmentPanel();
    }
  });
  root.addEventListener('input', (event) => {
    const field = event.target;
    if (field.tagName === 'TEXTAREA' && field.name === 'notes' && field.closest('#m07-assessment-form') && !moduleSevenState.caseRecord.submitted) {
      moduleSevenState.caseRecord.notes = field.value;
      moduleSevenSave();
    }
  });
}

function wireModuleSevenEvidenceDesk() {
  const form = document.querySelector('[data-m07-evidence-form]');
  if (!form || !moduleSevenState?.evidenceDesk) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const desk = moduleSevenState.evidenceDesk;
    desk.exposure = form.querySelector('[name="m07-exposure"]:checked')?.value || '';
    desk.correlation = form.querySelector('[name="m07-correlation"]:checked')?.value || '';
    desk.action = form.querySelector('[name="m07-action"]')?.value || '';
    desk.note = form.querySelector('[name="m07-evidence-note"]')?.value || '';
    const valid = desk.exposure === 'acct-63' && desk.correlation === 'corroborated' && desk.action === 'scope' && desk.note.trim().length >= 40;
    desk.checked = true;
    desk.complete = valid;
    desk.feedback = valid
      ? 'Recorded. You separated confirmed delivery from interaction evidence and kept compromise as an open verification question.'
      : 'Revise the call: identify the delivered account, describe correlation without claiming compromise, choose proportionate follow-up, and write at least 40 characters.';
    moduleSevenSave();
    const root = form.closest('.m07-evidence-desk');
    if (root) root.outerHTML = moduleSevenEvidenceDesk();
    wireModuleSevenEvidenceDesk();
  });
}

function wireModuleSeven() {
  const reviewToggle = document.querySelector('[data-mnav-review-toggle]');
  if (reviewToggle) {
    reviewToggle.addEventListener('click', () => {
      moduleSevenReviewMode = !moduleSevenReviewMode;
      const isOpen = moduleSevenReviewMode;
      reviewToggle.setAttribute('aria-pressed', isOpen);
      reviewToggle.querySelector('i').className = isOpen ? 'ri-close-line' : 'ri-file-list-line';
      const label = reviewToggle.querySelector('span');
      if (label) label.textContent = isOpen ? 'Close review' : 'Review module';
      document.querySelectorAll('.m07-section-collapsible').forEach((details) => {
        if (isOpen) details.setAttribute('open', '');
        else details.removeAttribute('open');
      });
    });
  }
  wireModuleSevenQuiz();
  wireModuleSevenEvidenceDesk();
  wireModuleSevenGuidedLab();
  wireModuleSevenAssessmentLab();
  wireModuleSevenAdditionalLabGating();
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 7, moduleKey: 'soc-07', view: viewModuleSeven, wire: wireModuleSeven });
