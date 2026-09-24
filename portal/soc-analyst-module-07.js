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
let moduleSevenReviewMode = false;
let moduleSevenQuizState = null;

function moduleSevenFreshState() {
  return {
    practiceComplete: false, practiceNotes: '',
    attempts: 0, score: 0, bestScore: 0, flags: [], completed: false,
    feedback: [], validationError: '', lastSubmittedAt: '', notes: '',
    evidenceDesk: { exposure: '', correlation: '', action: '', note: '', checked: false, complete: false, feedback: '' },
    labProgress: {},
  };
}

function moduleSevenLoad(user) {
  moduleSevenUser = user;
  const defaults = moduleSevenFreshState();
  moduleSevenState = LabRuntime.load(MODULE_SEVEN_LAB_ID, user, defaults);
  ['feedback', 'flags'].forEach((key) => {
    if (!Array.isArray(moduleSevenState[key])) moduleSevenState[key] = [];
  });
  if (typeof moduleSevenState.notes !== 'string') moduleSevenState.notes = '';
  if (typeof moduleSevenState.practiceNotes !== 'string') moduleSevenState.practiceNotes = '';
  if (!moduleSevenState.evidenceDesk || typeof moduleSevenState.evidenceDesk !== 'object') {
    moduleSevenState.evidenceDesk = moduleSevenFreshState().evidenceDesk;
  }
  if (!moduleSevenState.labProgress || typeof moduleSevenState.labProgress !== 'object') moduleSevenState.labProgress = {};

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
  if (moduleSevenUser && moduleSevenState) LabRuntime.save(MODULE_SEVEN_LAB_ID, moduleSevenUser, moduleSevenState);
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
  return [
    { id: 'lecture', title: 'Lecture', type: 'lecture', isComplete: true, scrollId: 'm07-lecture' },
    { id: 'knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: moduleSevenQuizState?.passed, scrollId: 'm07-knowledge-check' },
    { id: 'guided-lab', title: 'Guided Lab', type: 'lab', isComplete: moduleSevenState.practiceComplete, scrollId: 'm07-guided-lab' },
    { id: 'assessment-lab', title: 'Assessment Lab', type: 'review', isComplete: moduleSevenState.completed, scrollId: 'm07-assessment-lab' },
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

function moduleSevenQuizPanel() {
  if (!moduleSevenQuizState?.selectedQuestions || moduleSevenQuizState.selectedQuestions.length === 0) {
    return `<div class="m07-quiz-empty" id="m07-quiz-feedback" role="status">Loading quiz...</div>`;
  }

  const selected = moduleSevenQuizState.selectedQuestions;
  const answered = Object.keys(moduleSevenQuizState.answers || {}).length;
  const total = selected.length;

  let feedbackHtml = '';
  if (moduleSevenQuizState.scored) {
    const passed = moduleSevenQuizState.score >= 70;
    feedbackHtml = `<section class="m07-quiz-score ${passed ? 'm07-quiz-pass' : 'm07-quiz-remediate'}" id="m07-quiz-feedback" tabindex="-1" aria-live="polite">
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

  return `<form class="m07-quiz-form" id="m07-quiz-form" novalidate>
    <div class="m07-panel-heading"><div><p class="m07-kicker">Knowledge check</p><h3 id="m07-quiz-title" tabindex="-1">Test your understanding of email and network analysis</h3></div><span>${answered}/${total} answered</span></div>
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
  return `<details class="m07-video-script">
    <summary><strong>Video script (recording pending)</strong></summary>
    <div class="m07-script-body">
      <p><strong>Introduction:</strong> Welcome to email and network analysis. This module builds on your understanding of phishing, authentication, and network session correlation. Your job is to inspect a delivered phishing message across authentication headers, artifacts, and trace, then correlate its indicators with network DNS and TLS sessions. Finally, you will bound the exposure, scope the response, and communicate a proportionate recommendation.</p>

      <p><strong>Segment 1 — Reading email authentication signals.</strong> A message's visible From address is presentation. The real sender is authenticated through SPF (envelope validation), DKIM (body signature), and DMARC (alignment). A passing SPF result proves the mailserver sent the message from the envelope domain, but does not validate the displayed From. DMARC failure means the visible identity is not aligned with what the mailserver authenticated. Vendor-impersonation messages commonly use SPF-passing lookalike domains (northstarr-payments.example for northstar-suppliers.example) to make an urgent invoice request look routine.</p>

      <p><strong>Segment 2 — Inspecting URLs and attachments safely.</strong> Never click or execute suspicious links or files. Instead, defang them (replace hxxps, [.], etc.), compare the displayed text to the actual target (browsers show hover previews), and run attachments through a sandbox before opening them. An HTML attachment or link that resolves to a first-seen domain and initiates a browser connection to an external server is behaving like credential-theft software, not a innocent form.</p>

      <p><strong>Segment 3 — Using message trace to bound delivery and exposure.</strong> A message trace shows each copy: delivered to an inbox (exposed), delivered to a folder (quarantined/reviewed), blocked at the gateway (protected), rejected at the server (not received). Do not assume every recipient was exposed; base your exposure count on delivery status, not on the total recipient list.</p>

      <p><strong>Segment 4 — Correlating DNS and TLS with email artifacts.</strong> When a user opens a phishing message and interacts with it (clicks a link, opens an attachment), their device may generate network traffic. Tight timing (seconds to minutes after open), matching destinations (the URL domain matches a DNS lookup and TLS destination), and coherent sequence (DNS lookup → TLS connection to the answer) form a corroboration chain. This cross-source correlation transforms separate indicators into evidence of user interaction.</p>

      <p><strong>Segment 5 — Distinguishing baselines from meaningful activity.</strong> Benign traffic is in every network. Approved services, update checks, internal DNS, and routine backups are distractors. A meaningful chain requires the artifact domain (from email) to match the DNS lookup AND the TLS destination, plus timing and device alignment. A single match (e.g., an IP appears in both) is a pivot; a full chain is evidence.</p>

      <p><strong>Segment 6 — Proportionate scoping and response.</strong> If 500 users received a phishing message but only 1 opened it and interacted with it, your containment scope is that 1 user. Investigate their device for malware, reset their sessions, and block validated artifacts. Do not disable 500 accounts for 1 confirmed click. Escalate what you know, search for what you cannot see, and avoid both overreaction and under-reaction.</p>

      <p><strong>Closing:</strong> Email and network analysis is the bridge between message delivery and user behavior. Authentication headers tell you the sender's origin. Artifacts tell you the message's intent. Trace tells you who received it. Network sessions tell you who acted on it. Together, they tell a story about which users were truly exposed and what response is proportionate.</p>
    </div>
  </details>`;
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
  const labs = [
    { title: 'SMTP Log Analysis — Phishing Campaign Detection', detail: 'Trace a phishing campaign through mail log evidence', href: 'imported-labs/mission-next-labs/index.html#/track/splunk/module/smtp-log-analysis', labId: 'guided-1' },
    { title: 'Network Traffic Analysis of a Trojan', detail: 'Identify trojan behavior in captured network traffic', href: 'imported-labs/mission-next-labs/index.html#/track/malware-analysis/project/ma-5/lab', labId: 'guided-2' },
  ];
  const gateOk = missionNextAllLabsComplete(moduleSevenState.labProgress, ['guided-1', 'guided-2']);
  return `<section class="m07-external-lab" id="m07-guided-lab-panel">
    <p class="m07-panel-instruction">Work through both imported Splunk log-analysis modules below; each opens on this page with its own guided tasks. Mark each lab complete, then note what you found and mark the Guided Lab complete.</p>
    ${missionNextLabLaunchGroup(7, 'guided', labs, moduleSevenState.labProgress)}
    <label class="m07-note-label">Working notes (optional)<textarea rows="4" maxlength="900" data-m07-practice-notes placeholder="What did you find? Any blockers?">${esc(moduleSevenState.practiceNotes)}</textarea></label>
    ${!gateOk ? `<p class="m07-help" role="status">Mark both guided labs above complete before marking the Guided Lab complete.</p>` : ''}
    <div class="m07-actions"><button type="button" class="m07-submit" data-m07-practice-complete ${gateOk ? '' : 'disabled'}>${moduleSevenState.practiceComplete ? 'Guided Lab marked complete' : 'Mark Guided Lab complete'}</button></div>
  </section>`;
}

function moduleSevenAssessmentLabPanel() {
  const feedbackHtml = moduleSevenState.feedback?.length ? `<div class="m07-independent-feedback is-pass" role="status"><strong>Submitted</strong><ul>${moduleSevenState.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div>` : '';
  const labs = [
    { title: 'Tunnel Log Analysis — GRE Covert Channel Detection', detail: 'Independent tunnel/GRE log analysis', href: 'imported-labs/mission-next-labs/index.html#/track/splunk/module/gre-tunnel-log-analysis', labId: 'assessment-1' },
    { title: 'HTTP Log Analysis', detail: 'Web attack detection in HTTP access logs', href: 'imported-labs/mission-next-labs/index.html#/track/splunk/module/http-log-analysis', labId: 'assessment-2' },
  ];
  const gateOk = missionNextAllLabsComplete(moduleSevenState.labProgress, MODULE_SEVEN_COMPLETION_LAB_IDS);
  return `<section class="m07-external-lab" id="m07-assessment-lab-panel">
    <p class="m07-panel-instruction">Complete both imported assessment log-analysis modules below, then write up your findings below for instructor review.</p>
    ${missionNextLabLaunchGroup(7, 'assessment', labs, moduleSevenState.labProgress)}
    <form id="m07-assessment-form">
      <label class="m07-note-label">Assessment write-up<textarea id="m07-assessment-notes" rows="6" maxlength="900" data-m07-assessment-notes placeholder="Summarize what the tunnel-log module surfaced, your analysis, and your recommended action…">${esc(moduleSevenState.notes)}</textarea></label>
      <p class="m07-help">In at least 80 characters, describe what you found and your recommended action.</p>
      ${!gateOk ? `<p class="m07-help" role="status">Mark both assessment labs and the required FTP log analysis lab (below) complete before submitting.</p>` : ''}
      <div class="m07-actions"><button type="submit" class="m07-submit" ${gateOk ? '' : 'disabled'}>${moduleSevenState.completed ? 'Resubmit for review' : 'Submit for review'}</button></div>
    </form>
    ${feedbackHtml}
  </section>`;
}

function moduleSevenAdditionalLabs() {
  const labs = [
    { title: 'FTP Log Analysis — Anonymous Access & Data Exfiltration', detail: 'Optional supplementary log-analysis practice', href: 'imported-labs/mission-next-labs/index.html#/track/splunk/module/ftp-log-analysis', labId: 'additional-ftp-log-analysis' },
  ];
  return `<section class="mn-additional-labs" aria-labelledby="mn-additional-labs-7">
    <div class="mn-additional-labs-heading"><div><p class="mn-additional-labs-kicker">REQUIRED LABS</p><h2 id="mn-additional-labs-7">Additional Mission Next Labs</h2></div><span>Graded and required for module completion</span></div>
    <p class="mn-additional-labs-copy">These related projects extend the module topic and are required. Complete them for credit alongside the Guided Lab and Assessment Lab.</p>
    <div id="m07-additional-lab-dynamic">${missionNextLabLaunchGroup(7, 'additional', labs, moduleSevenState.labProgress)}</div>
  </section>`;
}

function viewModuleSeven(user, program) {
  moduleSevenLoad(user);
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
    ${moduleProgressShell(sections, { reviewMode: moduleSevenReviewMode })}
    <div class="mquick-nav-layout">
      <main class="m07-main">
      <section class="m07-hero" aria-labelledby="m07-title"><div><p class="m07-kicker">Module 07 · ${formatHandsOnDuration(module.durationMinutes)} · analysis practice</p><h1 id="m07-title">${esc(module.title)}</h1><p class="m07-lede">Work through imported Splunk log-analysis modules covering SMTP, FTP, and tunnel traffic, then write up a defensible finding for instructor review.</p></div><dl class="m07-progress" aria-label="Saved lab progress"><div><dt>Curriculum items</dt><dd>${module.lessons}</dd></div><div><dt>Guided Lab</dt><dd>${moduleSevenState.practiceComplete ? 'Complete' : 'Not started'}</dd></div><div><dt>Assessment Lab</dt><dd id="m07-status">${moduleSevenState.completed ? 'Complete' : moduleSevenState.attempts ? 'In progress' : 'Not started'}</dd></div></dl></section>

      <details class="m07-section-collapsible" ${lectureOpen ? 'open' : ''}>
        <summary class="m07-section"><div class="m07-section-heading"><span class="m07-section-badge">1</span><div><p class="m07-kicker">Lecture</p><h2 id="m07-lecture">Email authentication and network correlation</h2></div></div></summary>
        <div class="m07-section-body">
          <section class="m07-objective" aria-labelledby="m07-objective-title"><i class="ri-focus-3-line" aria-hidden="true"></i><div><p class="m07-kicker">Measurable objective</p><h3 id="m07-objective-title">Analyze real-world-style network and log data and justify a defensible triage decision in your assessment write-up.</h3></div></section>
          <section class="m07-section" id="m07-field-guide" aria-labelledby="m07-guide-title"><div class="m07-section-heading"><span>a</span><div><p class="m07-kicker">Field guide</p><h3 id="m07-guide-title">Follow identity, artifact, delivery, and session</h3></div></div>${moduleSevenConcepts()}<div class="m07-analysis-chain" aria-label="Email and network analysis sequence"><span>Sender identity</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>URL &amp; file</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>Delivery trace</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>DNS &amp; TLS</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>Scope &amp; response</span></div></section>
          ${moduleSevenEvidenceDesk()}
          ${moduleSevenVideoScript()}
        </div>
      </details>

      <details class="m07-section-collapsible" ${quizOpen ? 'open' : ''}>
        <summary class="m07-section"><div class="m07-section-heading"><span class="m07-section-badge">2</span><div><p class="m07-kicker">Knowledge Check</p><h2 id="m07-knowledge-check">Test your understanding of email and network analysis</h2></div></div></summary>
        <div class="m07-section-body">${moduleSevenQuizPanel()}</div>
      </details>

      <details class="m07-section-collapsible" ${guidedLabOpen ? 'open' : ''}>
        <summary class="m07-section"><div class="m07-section-heading"><span class="m07-section-badge">3</span><div><p class="m07-kicker">Practice It · Guided Lab</p><h2 id="m07-guided-lab">Log analysis practice</h2></div></div></summary>
        <div class="m07-section-body">
          <div class="m07-boundary"><i class="ri-shield-check-line" aria-hidden="true"></i><p><strong>Lab boundary:</strong> These labs open in the imported training application on this page.</p></div>
          <div id="m07-guided-lab-dynamic">${moduleSevenGuidedLabPanel()}</div>
        </div>
      </details>

      <details class="m07-section-collapsible" ${assessmentLabOpen ? 'open' : ''}>
        <summary class="m07-section"><div class="m07-section-heading"><span class="m07-section-badge">4</span><div><p class="m07-kicker">Prove It · Assessment Labs</p><h2 id="m07-assessment-lab">Independent tunnel and HTTP log analysis review</h2></div></div></summary>
        <div class="m07-section-body">
          <div id="m07-assessment-lab-dynamic">${moduleSevenAssessmentLabPanel()}</div>
        </div>
      </details>

      ${moduleSevenAdditionalLabs()}

      <details class="m07-section-collapsible" ${reviewOpen ? 'open' : ''}>
        <summary class="m07-section"><div class="m07-section-heading"><span class="m07-section-badge">5</span><div><p class="m07-kicker">Module Review</p><h2 id="m07-review">Key concepts and takeaways</h2></div></div></summary>
        <div class="m07-section-body">${moduleSevenReview()}</div>
      </details>

      <details class="m07-section-collapsible" ${moduleSevenReviewMode ? 'open' : ''}>
        <summary class="m07-section"><div class="m07-section-heading"><span class="m07-section-badge">6</span><div><p class="m07-kicker">Sources &amp; Further Reading</p><h2 id="m07-sources">Authoritative references</h2></div></div></summary>
        <div class="m07-section-body">${moduleSourcesBlock(MODULE_SEVEN_SOURCES_LIST)}</div>
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

function wireModuleSevenGuidedLabGating(root) {
  wireMissionNextLabGating(root, moduleSevenState.labProgress, () => {
    moduleSevenSave();
    root.innerHTML = moduleSevenGuidedLabPanel();
    wireModuleSevenGuidedLabGating(root);
  });
}

function wireModuleSevenGuidedLab() {
  const root = document.getElementById('m07-guided-lab-dynamic');
  if (!root || !moduleSevenState) return;
  wireModuleSevenGuidedLabGating(root);
  root.addEventListener('input', (event) => {
    if (event.target.matches('[data-m07-practice-notes]')) {
      moduleSevenState.practiceNotes = event.target.value;
      moduleSevenSave();
    }
  });
  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-m07-practice-complete]')) {
      if (!missionNextAllLabsComplete(moduleSevenState.labProgress, ['guided-1', 'guided-2'])) {
        root.innerHTML = moduleSevenGuidedLabPanel();
        wireModuleSevenGuidedLabGating(root);
        return;
      }
      moduleSevenState.practiceComplete = true;
      moduleSevenSave();
      root.innerHTML = moduleSevenGuidedLabPanel();
      wireModuleSevenGuidedLabGating(root);
    }
  });
}

function wireModuleSevenAdditionalLabGating() {
  const root = document.getElementById('m07-additional-lab-dynamic');
  if (!root || !moduleSevenState) return;
  wireMissionNextLabGating(root, moduleSevenState.labProgress, () => {
    moduleSevenSave();
    root.innerHTML = missionNextLabLaunchGroup(7, 'additional', [
      { title: 'FTP Log Analysis — Anonymous Access & Data Exfiltration', detail: 'Optional supplementary log-analysis practice', href: 'imported-labs/mission-next-labs/index.html#/track/splunk/module/ftp-log-analysis', labId: 'additional-ftp-log-analysis' },
    ], moduleSevenState.labProgress);
    wireModuleSevenAdditionalLabGating();
    const assessmentRoot = document.getElementById('m07-assessment-lab-dynamic');
    if (assessmentRoot) {
      assessmentRoot.innerHTML = moduleSevenAssessmentLabPanel();
      wireModuleSevenAssessmentLabGating(assessmentRoot);
    }
  });
}

function wireModuleSevenAssessmentLabGating(root) {
  wireMissionNextLabGating(root, moduleSevenState.labProgress, () => {
    moduleSevenSave();
    root.innerHTML = moduleSevenAssessmentLabPanel();
    wireModuleSevenAssessmentLabGating(root);
  });
}

function wireModuleSevenAssessmentLab() {
  const root = document.getElementById('m07-assessment-lab-dynamic');
  if (!root || !moduleSevenState) return;
  wireModuleSevenAssessmentLabGating(root);
  root.addEventListener('submit', (event) => {
    if (event.target.id !== 'm07-assessment-form') return;
    event.preventDefault();
    if (!missionNextAllLabsComplete(moduleSevenState.labProgress, MODULE_SEVEN_COMPLETION_LAB_IDS)) {
      root.innerHTML = moduleSevenAssessmentLabPanel();
      wireModuleSevenAssessmentLabGating(root);
      return;
    }
    const notes = event.target.querySelector('#m07-assessment-notes')?.value || '';
    moduleSevenState.notes = notes;
    if (notes.trim().length < 80) {
      moduleSevenState.feedback = ['Write at least 80 characters describing your findings and recommended action before submitting.'];
      moduleSevenSave();
      root.innerHTML = moduleSevenAssessmentLabPanel();
      wireModuleSevenAssessmentLabGating(root);
      return;
    }
    moduleSevenState.attempts = (moduleSevenState.attempts || 0) + 1;
    moduleSevenState.lastSubmittedAt = new Date().toISOString();
    moduleSevenState.completed = true;
    moduleSevenState.feedback = ['Submitted. This write-up has been recorded as your Assessment Lab submission for instructor review.'];
    if (!moduleSevenState.flags.includes(MODULE_SEVEN_FLAG)) moduleSevenState.flags.push(MODULE_SEVEN_FLAG);
    if (typeof recordLabAttempt === 'function') {
      const attemptFields = { state: 'complete', result: { notes } };
      MODULE_SEVEN_CATALOG_LAB_KEYS.forEach((labKey) => recordLabAttempt(moduleSevenUser, labKey, attemptFields));
    }
    moduleSevenMarkCatalogLabs(true);
    moduleSevenSave();
    const status = document.getElementById('m07-status');
    if (status) status.textContent = 'Complete';
    root.innerHTML = moduleSevenAssessmentLabPanel();
    wireModuleSevenAssessmentLabGating(root);
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
