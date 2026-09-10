/* Module 07 — semi-independent network and email investigation.
 * All messages, domains, addresses, identities, and telemetry are fictional.
 */

const MODULE_SEVEN_LAB_ID = 'm07-network-email-investigation-v1';
const MODULE_SEVEN_FLAG = 'M07-PHISH-NETWORK-CORRELATED';
const MODULE_SEVEN_CATALOG_LAB_KEYS = ['lab-email-triage', 'lab-network-investigation', 'lab-network-email-independent'];
const MODULE_SEVEN_PASSING_SCORE = 70;
const MODULE_SEVEN_EMAIL_MINUTES = LABS.find((item) => item.key === 'lab-email-triage').instructionalMinutes;
const MODULE_SEVEN_NETWORK_MINUTES = LABS.find((item) => item.key === 'lab-network-investigation').instructionalMinutes;

const MODULE_SEVEN_NETWORK = [
  { id: 'NS-701', time: '10:02:11', device: 'WS-204', account: 'acct-11', protocol: 'TLS', source: '10.24.8.21:51744', destination: '198.51.100.20:443', bytes: '1.8 MB in / 92 KB out', verdict: 'Allowed', summary: 'Signed update agent contacted its documented service during the maintenance window.', evidence: false },
  { id: 'NS-702', time: '10:08:42', device: 'WS-312', account: 'acct-46', protocol: 'DNS', source: '10.24.9.33:53310', destination: '10.24.0.10:53', bytes: '142 B in / 96 B out', verdict: 'Allowed', summary: 'Managed workstation resolved helpdesk.internal.test through the internal resolver.', evidence: false },
  { id: 'NS-703', time: '10:13:05', device: 'WS-517', account: 'acct-63', protocol: 'TLS', source: '10.24.12.57:51902', destination: '192.0.2.45:443', bytes: '438 KB in / 51 KB out', verdict: 'Allowed', summary: 'Existing authenticated session to the approved collaboration service; destination is common in the baseline.', evidence: false },
  { id: 'NS-704', time: '10:17:26', device: 'WS-517', account: 'acct-63', protocol: 'DNS', source: '10.24.12.57:54819', destination: '10.24.0.10:53', bytes: '188 B in / 102 B out', verdict: 'Allowed', query: 'invoice-qr.example', answer: '203.0.113.88', summary: 'First-seen domain resolved one minute after the delivered invoice QR message was opened.', evidence: true },
  { id: 'NS-705', time: '10:18:03', device: 'WS-517', account: 'acct-63', protocol: 'TLS', source: '10.24.12.57:51948', destination: '203.0.113.88:443', bytes: '31 KB in / 84 KB out', verdict: 'Allowed', sni: 'invoice-qr.example', summary: 'Rare destination and matching SNI followed the DNS lookup by 37 seconds; outbound transfer exceeds the short inbound response.', evidence: true },
  { id: 'NS-706', time: '10:21:18', device: 'SRV-009', account: 'backup-job', protocol: 'TLS', source: '10.24.2.19:50802', destination: '192.0.2.80:443', bytes: '12 KB in / 4.2 GB out', verdict: 'Allowed', summary: 'Large transfer is an expected encrypted archive upload from the registered backup server and service identity.', evidence: false },
  { id: 'NS-707', time: '10:27:54', device: 'WS-118', account: 'acct-52', protocol: 'TLS', source: '10.24.7.18:52117', destination: '203.0.113.41:443', bytes: '2.1 MB in / 61 KB out', verdict: 'Allowed', summary: 'Browser reached the approved training site; this address is unrelated to the message artifacts.', evidence: false },
];

const MODULE_SEVEN_MESSAGES = [
  { id: 'EM-071', time: '10:15', from: 'Vendor Payments <payments@northstar-suppliers.example>', to: 'acct-63', subject: 'Invoice NW-1842: scan QR code to release payment', auth: 'DMARC fail', delivery: 'Delivered · Inbox', trace: 'MT-071', category: 'Inbox', preview: 'A payment hold is pending. Scan the attached QR code to review the invoice and release the supplier payment.', suspicious: true },
  { id: 'EM-072', time: '09:41', from: 'People Operations <people-ops@mnt-internal.test>', to: 'acct-18', subject: 'August payroll calendar', auth: 'DMARC pass', delivery: 'Delivered · Inbox', trace: 'MT-068', category: 'Internal', preview: 'The published payroll calendar is available on the internal employee hub.', suspicious: false },
  { id: 'EM-073', time: '09:57', from: 'SOC Briefing <digest@security-news.example>', to: 'acct-52', subject: 'Weekly defensive operations digest', auth: 'DMARC pass', delivery: 'Delivered · Bulk', trace: 'MT-069', category: 'Bulk', preview: 'This week: DNS monitoring, secure mail gateways, and analyst career notes.', suspicious: false },
  { id: 'EM-074', time: '10:11', from: 'Training Team <simulations@mnt-internal.test>', to: 'acct-41', subject: '[EXERCISE] Can you spot this phish?', auth: 'DMARC pass', delivery: 'Delivered · Training', trace: 'MT-070', category: 'Training', preview: 'Approved awareness simulation. Report the message using the training button.', suspicious: false },
  { id: 'EM-075', time: '10:24', from: 'Northwind Billing <billing@northwind-supplier.example>', to: 'acct-27', subject: 'Invoice NW-1841 received', auth: 'DMARC pass', delivery: 'Delivered · Inbox', trace: 'MT-074', category: 'Inbox', preview: 'Receipt confirmation for the existing Northwind supplier account. No attachment included.', suspicious: false },
  { id: 'EM-076', time: '09:33', from: 'IT Helpdesk <helpdesk@mnt-internal.test>', to: 'acct-09', subject: 'Ticket HD-4471 updated: VPN client reinstalled', auth: 'DMARC pass', delivery: 'Delivered · Inbox', trace: 'MT-065', category: 'Internal', preview: 'Your VPN client was reinstalled per your request. Reply if issues continue.', suspicious: false },
  { id: 'EM-077', time: '09:47', from: 'Product Updates <news@cloudsuite-app.example>', to: 'acct-33', subject: 'New features in your March release notes', auth: 'DMARC pass', delivery: 'Delivered · Bulk', trace: 'MT-066', category: 'Bulk', preview: 'Three new dashboard widgets are now available for your workspace.', suspicious: false },
  { id: 'EM-078', time: '09:52', from: 'Northwind Billing <billing@northwind-supplier.example>', to: 'acct-27', subject: 'Payment confirmation for Invoice NW-1841', auth: 'DMARC pass', delivery: 'Delivered · Inbox', trace: 'MT-073', category: 'Inbox', preview: 'This confirms receipt of payment against the existing Northwind supplier account.', suspicious: false },
  { id: 'EM-079', time: '10:02', from: 'Unknown Sender <update@secure-billing-verify.example>', to: 'acct-58', subject: 'Your invoice payment failed - resend banking details', auth: 'DMARC fail', delivery: 'Quarantined · Gateway block', trace: 'MT-071b', category: 'Quarantined', preview: 'This message was withheld by the mail gateway before reaching an inbox.', suspicious: false },
  { id: 'EM-080', time: '10:07', from: 'Training Team <simulations@mnt-internal.test>', to: 'acct-19', subject: "Reminder: complete the July phishing module", auth: 'DMARC pass', delivery: 'Delivered · Training', trace: 'MT-067', category: 'Training', preview: "You have three days left to complete this quarter's awareness training.", suspicious: false },
  { id: 'EM-081', time: '10:19', from: 'J. Okafor <j.okafor@partner-firm.example>', to: 'acct-71', subject: 'Following up on our call', auth: 'DMARC pass', delivery: 'Delivered · Inbox', trace: 'MT-075', category: 'Inbox', preview: 'Thanks for the time today - sending the summary doc as agreed.', suspicious: false },
  { id: 'EM-082', time: '10:28', from: 'Facilities <facilities@mnt-internal.test>', to: 'all-staff', subject: 'Elevator maintenance in Building 2, Thursday', auth: 'DMARC pass', delivery: 'Delivered · Bulk', trace: 'MT-076', category: 'Bulk', preview: 'Elevator service will be unavailable 08:00-12:00 Thursday for scheduled maintenance.', suspicious: false },
  { id: 'EM-083', time: '10:33', from: 'Unknown Sender <security-alert@mnt-secur1ty.example>', to: 'acct-64', subject: 'Unusual sign-in detected - verify your account now', auth: 'DMARC fail', delivery: 'Quarantined · Gateway block', trace: 'MT-071c', category: 'Quarantined', preview: 'This message was withheld by the mail gateway before reaching an inbox.', suspicious: false },
  { id: 'EM-084', time: '10:39', from: 'Northwind Billing <billing@northwind-supplier.example>', to: 'acct-27', subject: 'Updated remittance address on file', auth: 'DMARC pass', delivery: 'Delivered · Inbox', trace: 'MT-077', category: 'Inbox', preview: 'Please note the updated remittance address for future payments, effective next quarter.', suspicious: false },
];

const MODULE_SEVEN_MAIL_CATEGORIES = ['All', 'Inbox', 'Internal', 'Bulk', 'Training', 'Quarantined'];
const MODULE_SEVEN_MAIL_QUERY_DEFAULT = 'MailEvents\n| where Category == ""\n| where Subject contains ""';
const MODULE_SEVEN_MAIL_QUERY_FIELDS = ['category', 'subject', 'from', 'auth', 'delivery'];

const MODULE_SEVEN_EVIDENCE = [
  { id: 'EV-H71', kind: 'Header', title: 'Vendor identity and authentication misalign', detail: 'Visible From is northstar-suppliers.example, Return-Path is bounce@northstarr-payments.example, DKIM is absent, and DMARC fails. SPF passes only for the lookalike envelope domain.' },
  { id: 'EV-U71', kind: 'URL', title: 'QR destination hides a first-seen domain', detail: 'The QR image resolves to invoice-qr.example/session rather than the approved supplier portal. The domain has no prior organizational traffic in this fixture.' },
  { id: 'EV-A71', kind: 'Attachment', title: 'Invoice HTML/QR artifact launches the same URL', detail: 'Invoice_NW1842.html (text/html, SHA-256 aaa…) contains the QR redirect to invoice-qr.example and produces a connection to 203.0.113.88 in the local sandbox summary.' },
  { id: 'EV-T71', kind: 'Trace', title: 'One copy delivered; matching invoice lure blocked', detail: 'MT-071 delivered EM-071 to acct-63 at 10:15. MT-072, carrying the same QR artifact hash to acct-82, was rejected at 10:22 before delivery.' },
];

const MODULE_SEVEN_EXPECTED_EVIDENCE = ['NS-704', 'NS-705', 'EV-H71', 'EV-U71', 'EV-A71', 'EV-T71'];

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
    activeDesk: 'email', activeMessage: 'EM-071', activeEmailTab: 'overview', detailSession: '',
    mailCategory: 'All', mailQueryDraft: MODULE_SEVEN_MAIL_QUERY_DEFAULT, mailQueryRuns: 0, mailQueryFeedback: '', mailQueryResultIds: [],
    reviewedSessions: [], reviewedMessages: [], reviewedEmailTabs: [], selectedEvidence: [], hintsOpened: [],
    verdict: '', headerAssessment: '', linkage: '', scope: '', response: '', notes: '',
    attempts: 0, score: 0, bestScore: 0, flags: [], completed: false,
    breakdown: null, feedback: [], validationError: '', lastSubmittedAt: '',
  };
}

function moduleSevenLoad(user) {
  moduleSevenUser = user;
  const defaults = moduleSevenFreshState();
  moduleSevenState = LabRuntime.load(MODULE_SEVEN_LAB_ID, user, defaults);
  ['reviewedSessions', 'reviewedMessages', 'reviewedEmailTabs', 'selectedEvidence', 'hintsOpened', 'feedback', 'flags', 'mailQueryResultIds'].forEach((key) => {
    if (!Array.isArray(moduleSevenState[key])) moduleSevenState[key] = [];
  });
  if (typeof moduleSevenState.mailCategory !== 'string') moduleSevenState.mailCategory = 'All';
  if (typeof moduleSevenState.mailQueryDraft !== 'string') moduleSevenState.mailQueryDraft = MODULE_SEVEN_MAIL_QUERY_DEFAULT;

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

function moduleSevenAddUnique(key, value) {
  if (!moduleSevenState[key].includes(value)) moduleSevenState[key] = [...moduleSevenState[key], value];
}

function moduleSevenEvidenceButton(id, label) {
  const selected = moduleSevenState.selectedEvidence.includes(id);
  return `<button type="button" class="m07-evidence-button" data-m07-evidence="${esc(id)}" aria-pressed="${selected}"><i class="${selected ? 'ri-bookmark-fill' : 'ri-bookmark-line'}" aria-hidden="true"></i>${selected ? 'Evidence saved' : `Save ${esc(label)}`}</button>`;
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

function moduleSevenGetSections() {
  return [
    { id: 'lecture', title: 'Lecture', type: 'lecture', isComplete: true, scrollId: 'm07-lecture' },
    { id: 'knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: moduleSevenQuizState?.passed, scrollId: 'm07-knowledge-check' },
    { id: 'investigation-lab', title: 'Investigation Lab', type: 'lab', isComplete: moduleSevenState.completed, scrollId: 'm07-lab' },
    { id: 'review', title: 'Module Review', type: 'review', isComplete: true, scrollId: 'm07-review' },
  ];
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

function moduleSevenNetworkTable() {
  return `<div class="m07-table-wrap"><table class="m07-table"><caption class="m07-visually-hidden">Synthetic network sessions with benign distractors</caption><thead><tr><th scope="col">Time</th><th scope="col">Device / account</th><th scope="col">Protocol</th><th scope="col">Destination</th><th scope="col">Bytes</th><th scope="col">Action</th></tr></thead><tbody>${MODULE_SEVEN_NETWORK.map((row) => `<tr class="${moduleSevenState.selectedEvidence.includes(row.id) ? 'is-selected' : ''}"><td data-label="Time"><time>${esc(row.time)}</time></td><td data-label="Device / account"><strong>${esc(row.device)}</strong><small>${esc(row.account)}</small></td><td data-label="Protocol">${esc(row.protocol)}</td><td data-label="Destination"><code>${esc(row.destination)}</code>${row.query ? `<small>${esc(row.query)}</small>` : ''}</td><td data-label="Bytes">${esc(row.bytes)}</td><td data-label="Action"><button type="button" class="m07-row-action" data-m07-session="${esc(row.id)}" aria-label="Inspect network session ${esc(row.id)}">Inspect ${esc(row.id)}</button></td></tr>`).join('')}</tbody></table></div>`;
}

function moduleSevenNetworkDesk() {
  const row = MODULE_SEVEN_NETWORK.find((item) => item.id === moduleSevenState.detailSession);
  return `<section class="m07-desk-panel" id="m07-desk-panel" role="tabpanel" aria-labelledby="m07-tab-network"><div class="m07-desk-heading"><div><p class="m07-kicker">Lab A · Session analysis · ${formatInstructionalMinutes(MODULE_SEVEN_NETWORK_MINUTES)}</p><h3>Network session ledger</h3></div><span>${moduleSevenState.reviewedSessions.length}/7 inspected</span></div><p class="m07-instruction">Find the short sequence that connects a workstation to an unusual destination. Expected maintenance, internal DNS, approved services, and backups remain in view as distractors.</p>${moduleSevenNetworkTable()}${row ? `<aside class="m07-detail" id="m07-session-detail" tabindex="-1"><button type="button" data-m07-close-session aria-label="Close network session detail"><i class="ri-close-line" aria-hidden="true"></i></button><p class="m07-kicker">${esc(row.id)} · ${esc(row.protocol)} context</p><h4>${esc(row.device)} / ${esc(row.account)}</h4><dl><div><dt>Source</dt><dd><code>${esc(row.source)}</code></dd></div><div><dt>Destination</dt><dd><code>${esc(row.destination)}</code></dd></div>${row.query ? `<div><dt>DNS answer</dt><dd><code>${esc(row.query)} → ${esc(row.answer)}</code></dd></div>` : ''}${row.sni ? `<div><dt>TLS SNI</dt><dd><code>${esc(row.sni)}</code></dd></div>` : ''}<div><dt>Context</dt><dd>${esc(row.summary)}</dd></div></dl>${row.evidence ? moduleSevenEvidenceButton(row.id, row.id) : '<p class="m07-baseline"><i class="ri-information-line" aria-hidden="true"></i> This row supplies baseline context; it is not part of the strongest evidence set.</p>'}</aside>` : ''}<button type="button" class="m07-hint-button" data-m07-hint="network" aria-expanded="${moduleSevenState.hintsOpened.includes('network')}"><i class="ri-lightbulb-line" aria-hidden="true"></i>Network reasoning hint</button>${moduleSevenState.hintsOpened.includes('network') ? '<p class="m07-hint" role="status">Start with the message-open time. Look for a same-device DNS answer followed quickly by TLS to that answer; compare it with the approved-service and backup baselines.</p>' : ''}</section>`;
}

function moduleSevenMailFieldValue(mail, field) {
  return { category: mail.category, subject: mail.subject, from: mail.from, auth: mail.auth, delivery: mail.delivery }[field];
}

function moduleSevenParseMailQuery(text) {
  const lines = String(text || '').split('\n').map((line) => line.trim()).filter(Boolean);
  const tableOk = /^MailEvents\b/i.test(lines[0] || '');
  const clauses = [];
  const unsupported = [];
  lines.slice(1).forEach((line) => {
    const eq = line.match(/^\|\s*where\s+(\w+)\s*==\s*"([^"]*)"$/i);
    const contains = line.match(/^\|\s*where\s+(\w+)\s+contains\s+"([^"]*)"$/i);
    if (eq && MODULE_SEVEN_MAIL_QUERY_FIELDS.includes(eq[1].toLowerCase())) { clauses.push({ field: eq[1].toLowerCase(), op: '==', value: eq[2] }); return; }
    if (contains && MODULE_SEVEN_MAIL_QUERY_FIELDS.includes(contains[1].toLowerCase())) { clauses.push({ field: contains[1].toLowerCase(), op: 'contains', value: contains[2] }); return; }
    unsupported.push(line);
  });
  return { tableOk, clauses, unsupported };
}

function moduleSevenRunMailQuery(text) {
  const { tableOk, clauses, unsupported } = moduleSevenParseMailQuery(text);
  let rows = tableOk ? MODULE_SEVEN_MESSAGES.slice() : [];
  const activeClauses = clauses.filter((clause) => clause.value.trim() !== '');
  activeClauses.forEach((clause) => {
    rows = rows.filter((mail) => {
      const value = moduleSevenMailFieldValue(mail, clause.field);
      if (value === undefined) return true;
      const haystack = String(value).toLowerCase();
      const needle = clause.value.trim().toLowerCase();
      return clause.op === '==' ? haystack === needle : haystack.includes(needle);
    });
  });
  return { tableOk, clauses: activeClauses, unsupported, rows };
}

function moduleSevenMessageList(rows) {
  if (!rows.length) return `<div class="m07-mail-empty" role="status"><i class="ri-search-line" aria-hidden="true"></i>No messages match the current query. Broaden the filter and run it again.</div>`;
  return `<div class="m07-mail-list" aria-label="Filtered message queue">${rows.map((mail) => `<button type="button" data-m07-message="${esc(mail.id)}" aria-pressed="${moduleSevenState.activeMessage === mail.id}"><span><strong>${esc(mail.from)}</strong><time>${esc(mail.time)}</time></span><b>${esc(mail.subject)}</b><small>${esc(mail.to)} · ${esc(mail.auth)} · ${esc(mail.delivery)}</small></button>`).join('')}</div>`;
}

function moduleSevenMailCategoryChips() {
  return `<div class="m07-mail-chips" role="group" aria-label="Filter mail log by category">${MODULE_SEVEN_MAIL_CATEGORIES.map((category) => `<button type="button" data-m07-mail-category="${esc(category)}" aria-pressed="${moduleSevenState.mailCategory === category}">${esc(category)}<small>${category === 'All' ? MODULE_SEVEN_MESSAGES.length : MODULE_SEVEN_MESSAGES.filter((mail) => mail.category === category).length}</small></button>`).join('')}</div>`;
}

function moduleSevenMailQueryFeedback() {
  if (!moduleSevenState.mailQueryRuns) return `<div class="m07-query-empty" id="m07-mail-query-feedback" role="status">Run the query to search the full mail log, or use a category chip for a quick filter.</div>`;
  return `<div class="m07-query-feedback" id="m07-mail-query-feedback" role="status" tabindex="-1"><strong>${moduleSevenState.mailQueryResultIds.length} message${moduleSevenState.mailQueryResultIds.length === 1 ? '' : 's'} matched</strong><p>${esc(moduleSevenState.mailQueryFeedback)}</p></div>`;
}

function moduleSevenMailQueryWorkbench() {
  return `<section class="m07-mail-query" aria-labelledby="m07-mail-query-title">
    <div class="m07-panel-heading"><div><p class="m07-kicker">Search the mail log</p><h4 id="m07-mail-query-title">Mail query workbench</h4></div><span class="m07-chip">Runs: ${moduleSevenState.mailQueryRuns}</span></div>
    <div class="m07-mail-query-layout">
      <div>
        <label for="m07-mail-query-editor">Filter <code>MailEvents</code> by category and/or a text field.</label>
        <textarea id="m07-mail-query-editor" name="mailQueryDraft" rows="4" spellcheck="false" aria-describedby="m07-mail-query-help">${esc(moduleSevenState.mailQueryDraft)}</textarea>
        <p id="m07-mail-query-help">Supported subset: a table name, <code>where Category == "value"</code>, and <code>where Subject|From|Auth|Delivery contains "value"</code>. Blank clauses are ignored.</p>
        <button type="button" class="m07-run-mail-query" data-m07-run-mail-query><i class="ri-play-circle-line" aria-hidden="true"></i> Run local query</button>
      </div>
      <details class="m07-mail-query-hint">
        <summary>Need a syntax hint?</summary>
        <p>Category values match the chips above exactly (e.g. <code>"Inbox"</code>). Text fields use <code>contains</code> for a partial, case-insensitive match.</p>
      </details>
    </div>
    ${moduleSevenMailQueryFeedback()}
  </section>`;
}

function moduleSevenEmailTabContent(mail) {
  if (mail.id !== 'EM-071') return `<div class="m07-email-copy"><p>${esc(mail.preview)}</p><dl><div><dt>Authentication</dt><dd>${esc(mail.auth)}</dd></div><div><dt>Trace</dt><dd>${esc(mail.trace)} · ${esc(mail.delivery)}</dd></div></dl><p class="m07-baseline"><i class="ri-information-line" aria-hidden="true"></i>Available context supports a routine or explicitly authorized message. Compare its alignment and delivery labels with EM-071.</p></div>`;
  if (moduleSevenState.activeEmailTab === 'headers') return `<div class="m07-email-copy"><dl><div><dt>From</dt><dd><code>payments@northstar-suppliers.example</code></dd></div><div><dt>Return-Path</dt><dd><code>bounce@northstarr-payments.example</code></dd></div><div><dt>Received</dt><dd><code>mail.northstarr-payments.example [203.0.113.88]</code></dd></div><div><dt>SPF</dt><dd>Pass for northstarr-payments.example</dd></div><div><dt>DKIM</dt><dd>None</dd></div><div><dt>DMARC</dt><dd>Fail; visible From domain not aligned</dd></div></dl>${moduleSevenEvidenceButton('EV-H71', 'header finding')}</div>`;
  if (moduleSevenState.activeEmailTab === 'artifacts') return `<div class="m07-artifact-grid"><article><p class="m07-kicker">QR destination</p><h4>Invoice QR code</h4><dl><div><dt>Displayed text</dt><dd>Scan to release payment</dd></div><div><dt>Defanged target</dt><dd><code>hxxps[://]invoice-qr[.]example/session</code></dd></div><div><dt>Reputation</dt><dd>First seen in this dataset</dd></div></dl>${moduleSevenEvidenceButton('EV-U71', 'URL finding')}</article><article><p class="m07-kicker">Attachment</p><h4>Invoice_NW1842.html</h4><dl><div><dt>Detected type</dt><dd>text/html · 18 KB</dd></div><div><dt>SHA-256</dt><dd><code>aaa…</code></dd></div><div><dt>Local sandbox summary</dt><dd>Decoded QR → requested invoice-qr.example → connected to 203.0.113.88</dd></div></dl>${moduleSevenEvidenceButton('EV-A71', 'attachment finding')}</article></div>`;
  if (moduleSevenState.activeEmailTab === 'trace') return `<div class="m07-trace"><ol><li><time>10:14</time><span><strong>Accepted</strong>EM-071 accepted from 203.0.113.88.</span></li><li><time>10:15</time><span><strong>Delivered</strong>MT-071 placed message in acct-63 Inbox.</span></li><li><time>10:16</time><span><strong>User interaction</strong>Message opened on WS-517.</span></li><li><time>10:22</time><span><strong>Blocked</strong>MT-072 rejected a copy with hash aaa… addressed to acct-82; no delivery.</span></li></ol>${moduleSevenEvidenceButton('EV-T71', 'trace finding')}</div>`;
  return `<div class="m07-email-copy"><p>${esc(mail.preview)}</p><dl><div><dt>Sender identity</dt><dd>${esc(mail.from)}</dd></div><div><dt>Recipient</dt><dd>${esc(mail.to)}</dd></div><div><dt>Authentication</dt><dd>${esc(mail.auth)}</dd></div><div><dt>Delivery</dt><dd>${esc(mail.delivery)}</dd></div></dl><p class="m07-callout">Do not decide from urgency alone. Inspect authentication alignment, the actual URL and attachment behavior, then the message trace.</p></div>`;
}

function moduleSevenVisibleMessages() {
  const byCategory = moduleSevenState.mailCategory === 'All' ? MODULE_SEVEN_MESSAGES : MODULE_SEVEN_MESSAGES.filter((mail) => mail.category === moduleSevenState.mailCategory);
  if (!moduleSevenState.mailQueryRuns) return byCategory;
  const queried = new Set(moduleSevenState.mailQueryResultIds);
  return byCategory.filter((mail) => queried.has(mail.id));
}

function moduleSevenEmailDesk() {
  const mail = MODULE_SEVEN_MESSAGES.find((item) => item.id === moduleSevenState.activeMessage) || MODULE_SEVEN_MESSAGES[0];
  const tabs = [['overview', 'Overview'], ['headers', 'Headers'], ['artifacts', 'URL & attachment'], ['trace', 'Message trace']];
  const visible = moduleSevenVisibleMessages();
  return `<section class="m07-desk-panel" id="m07-desk-panel" role="tabpanel" aria-labelledby="m07-tab-email"><div class="m07-desk-heading"><div><p class="m07-kicker">Lab B · Phishing analysis · ${formatInstructionalMinutes(MODULE_SEVEN_EMAIL_MINUTES)}</p><h3>Email evidence and delivery trace</h3></div><span>${moduleSevenState.reviewedMessages.length}/${MODULE_SEVEN_MESSAGES.length} messages reviewed</span></div><p class="m07-instruction">Search or filter the mail log to find the message worth a full read, then inspect it across header, artifacts, and trace. Bulk mail, an approved exercise, quarantined spam, and legitimate external mail are plausible distractors.</p>${moduleSevenMailCategoryChips()}${moduleSevenMailQueryWorkbench()}<div class="m07-mail-layout">${moduleSevenMessageList(visible)}<article class="m07-mail-reader"><header><p class="m07-kicker">${esc(mail.id)} · ${esc(mail.trace)}</p><h4>${esc(mail.subject)}</h4><p>${esc(mail.from)} → ${esc(mail.to)}</p></header><div class="m07-email-tabs" role="tablist" aria-label="Selected message evidence">${tabs.map(([key, label]) => `<button type="button" role="tab" data-m07-email-tab="${esc(key)}" aria-selected="${moduleSevenState.activeEmailTab === key}">${esc(label)}</button>`).join('')}</div><div role="tabpanel" class="m07-email-panel">${moduleSevenEmailTabContent(mail)}</div></article></div><button type="button" class="m07-hint-button" data-m07-hint="email" aria-expanded="${moduleSevenState.hintsOpened.includes('email')}"><i class="ri-lightbulb-line" aria-hidden="true"></i>Email reasoning hint</button>${moduleSevenState.hintsOpened.includes('email') ? '<p class="m07-hint" role="status">A passing SPF result authenticates its envelope identity, not necessarily the visible From address. Let DMARC alignment, actual targets, sandbox behavior, and delivery status carry the conclusion.</p>' : ''}</section>`;
}

function moduleSevenDesk() {
  return `<section class="m07-workbench" aria-labelledby="m07-workbench-title"><div class="m07-panel-heading"><div><p class="m07-kicker">Two contained evidence desks</p><h2 id="m07-workbench-title">Correlation workbench</h2></div><span class="m07-chip">${moduleSevenState.selectedEvidence.length}/6 evidence saved</span></div><div class="m07-desk-tabs" role="tablist" aria-label="Investigation desks"><button id="m07-tab-email" type="button" role="tab" data-m07-desk="email" aria-selected="${moduleSevenState.activeDesk === 'email'}" aria-controls="m07-desk-panel"><i class="ri-mail-search-line" aria-hidden="true"></i>Email &amp; trace</button><button id="m07-tab-network" type="button" role="tab" data-m07-desk="network" aria-selected="${moduleSevenState.activeDesk === 'network'}" aria-controls="m07-desk-panel"><i class="ri-radar-line" aria-hidden="true"></i>Network sessions</button></div>${moduleSevenState.activeDesk === 'network' ? moduleSevenNetworkDesk() : moduleSevenEmailDesk()}<aside class="m07-tray" aria-labelledby="m07-tray-title"><div><p class="m07-kicker">Selected evidence</p><h3 id="m07-tray-title">Analyst tray</h3></div>${moduleSevenState.selectedEvidence.length ? `<ul>${moduleSevenState.selectedEvidence.map((id) => { const evidence = MODULE_SEVEN_EVIDENCE.find((item) => item.id === id); const network = MODULE_SEVEN_NETWORK.find((item) => item.id === id); return `<li><code>${esc(id)}</code><span>${esc(evidence ? evidence.title : network.summary)}</span><button type="button" data-m07-evidence="${esc(id)}" aria-label="Remove ${esc(id)} from evidence"><i class="ri-close-line" aria-hidden="true"></i></button></li>`; }).join('')}</ul>` : '<p>No evidence saved. Inspect records and keep only facts that support the final analysis.</p>'}</aside><aside class="m07-independent" aria-labelledby="m07-independent-title"><p class="m07-kicker">Independent lab · 0 additional minutes</p><h3 id="m07-independent-title">Vendor invoice follow-up: fresh case</h3><p>A separate fictional case is provided for transfer practice. A supplier mailbox reports a QR code in <code>INV-2097.html</code>; <code>acct-28</code> on <code>ws-204</code> queried <code>remit-check.example</code> once, but no TLS follow-on is present. A signed supplier portal message to <code>acct-31</code> is the benign comparison.</p><ol><li>State whether the single DNS query is sufficient to call compromise.</li><li>List the missing corroboration you would seek without opening the QR destination.</li><li>Write a bounded handoff separating delivery, interaction, and compromise.</li></ol><p class="m07-baseline"><i class="ri-information-line" aria-hidden="true"></i>This second lab is independent of the scored EM-071 chain and uses documentation-only fictional indicators.</p></aside></section>`;
}

function moduleSevenRadio(name, options) {
  return `<div class="m07-options">${options.map((option) => `<label><input type="radio" name="${esc(name)}" value="${esc(option.id)}" ${moduleSevenState[name] === option.id ? 'checked' : ''}><span><strong>${esc(option.label)}</strong><small>${esc(option.help)}</small></span></label>`).join('')}</div>`;
}

function moduleSevenScorePanel() {
  if (moduleSevenState.validationError) return `<div class="m07-validation" id="m07-feedback" role="alert" tabindex="-1"><i class="ri-information-line" aria-hidden="true"></i><div><strong>Complete the analyst brief</strong><p>${esc(moduleSevenState.validationError)}</p></div></div>`;
  if (!moduleSevenState.attempts || !moduleSevenState.breakdown) return `<div class="m07-score-empty" id="m07-feedback" role="status">Scoring: observation 30 · analysis 30 · decision 20 · communication 20. Passing score: ${MODULE_SEVEN_PASSING_SCORE}.</div>`;
  const b = moduleSevenState.breakdown;
  const passed = moduleSevenState.score >= MODULE_SEVEN_PASSING_SCORE;
  return `<section class="m07-score ${passed ? 'is-pass' : 'is-remediate'}" id="m07-feedback" tabindex="-1" aria-live="polite"><div class="m07-score-heading"><div><p class="m07-kicker">Attempt ${moduleSevenState.attempts} · best ${moduleSevenState.bestScore}/100</p><h3>${moduleSevenState.score}/100 — ${passed ? 'Correlated finding is defensible' : 'Refine the correlation and scope'}</h3></div><span>${moduleSevenState.score}</span></div><div class="m07-score-grid"><div><strong>${b.observation}/30</strong><span>Observation</span><small>Evidence ${b.evidence}/18 · inspection ${b.review}/12</small></div><div><strong>${b.analysis}/30</strong><span>Analysis</span><small>Verdict ${b.verdict}/8 · headers ${b.headers}/6 · link ${b.linkage}/8 · scope ${b.scope}/8</small></div><div><strong>${b.decision}/20</strong><span>Decision</span><small>Proportionate response</small></div><div><strong>${b.communication}/20</strong><span>Communication</span><small>Finding, scope, correlation, action</small></div></div><ul class="m07-feedback-list">${moduleSevenState.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul><div class="m07-expert"><strong>Expert reasoning</strong><p>EM-071 is a QR-phishing invoice lure: its visible vendor identity is not aligned with the authenticated envelope identity, DMARC fails, and both the QR artifact and HTML attachment resolve to invoice-qr.example. After delivery and open, WS-517 resolves that first-seen domain and connects to its sandbox-matched address. MT-072 was blocked, so observed delivery scope is acct-63 on WS-517; remove the delivered copy, isolate and investigate that workstation, invalidate the affected session, block the validated artifacts, and search for further copies.</p></div></section>`;
}

function moduleSevenArtifact() {
  return `<form class="m07-artifact" id="m07-form" novalidate aria-labelledby="m07-artifact-title"><div class="m07-panel-heading"><div><p class="m07-kicker">Scored artifact</p><h2 id="m07-artifact-title">Network-and-email analyst brief</h2></div><span class="m07-chip">Retry allowed</span></div><p class="m07-instruction">Use the evidence tray to make one bounded finding. Select only what the records demonstrate.</p><fieldset><legend><span>1</span>Classify EM-071</legend>${moduleSevenRadio('verdict', [
    { id: 'credential-phish', label: 'Credential-phishing message', help: 'Authentication misalignment and the HTML/URL behavior support malicious intent.' },
    { id: 'marketing', label: 'Legitimate supplier payment notice', help: 'Urgency alone is weak, but the technical artifacts contradict this verdict.' },
    { id: 'simulation', label: 'Approved awareness simulation', help: 'The queue contains a labeled simulation, but it is a different message and sender.' },
  ])}</fieldset><fieldset><legend><span>2</span>Interpret the header authentication</legend>${moduleSevenRadio('headerAssessment', [
    { id: 'misaligned', label: 'SPF passes only for the envelope domain; absent DKIM and failed DMARC leave the visible From unaligned.', help: 'This distinguishes authentication of a sender path from alignment with the displayed identity.' },
    { id: 'spf-safe', label: 'SPF pass proves the visible sender and message are trustworthy.', help: 'SPF alone does not validate alignment with the visible From domain.' },
    { id: 'dmarc-benign', label: 'DMARC failure is expected for all external supplier messages.', help: 'The legitimate external distractors demonstrate that external mail can align and pass.' },
  ])}</fieldset><fieldset><legend><span>3</span>Relate email and network telemetry</legend>${moduleSevenRadio('linkage', [
    { id: 'timed-artifact-match', label: 'The message artifacts and WS-517 session form one timed chain.', help: 'The URL, sandbox destination, DNS answer, TLS SNI, device, account, and time agree.' },
    { id: 'ip-only', label: 'The shared IP alone proves compromise.', help: 'An address is a pivot; the timing and artifact context make it meaningful.' },
    { id: 'unrelated', label: 'The session is unrelated because email and network logs are different sources.', help: 'Cross-source correlation is the purpose of this analysis.' },
  ])}</fieldset><fieldset><legend><span>4</span>Bound the observed delivery and interaction scope</legend>${moduleSevenRadio('scope', [
    { id: 'acct63-ws517', label: 'Delivered and interacted: acct-63 on WS-517; acct-82 copy was blocked.', help: 'Trace and session evidence support one exposed user-device pair.' },
    { id: 'two-users', label: 'acct-63 and acct-82 both received and opened the message.', help: 'The second copy was rejected before delivery.' },
    { id: 'enterprise', label: 'Enterprise-wide compromise is confirmed.', help: 'The contained fixture cannot support that conclusion.' },
  ])}</fieldset><fieldset><legend><span>5</span>Recommend a proportionate response</legend>${moduleSevenRadio('response', [
    { id: 'contain-search', label: 'Remove EM-071, isolate/investigate WS-517, invalidate acct-63 sessions, block validated artifacts, and trace-search for matches.', help: 'This contains the observed exposure while extending scope with known evidence.' },
    { id: 'block-ip-only', label: 'Block only 203.0.113.88 and close the case.', help: 'That leaves the delivered message, account session, URL, and attachment unaddressed.' },
    { id: 'disable-all', label: 'Disable every recipient and isolate every device in the dataset.', help: 'That response exceeds the demonstrated scope.' },
  ])}</fieldset><div class="m07-note-field"><label for="m07-notes"><span>6</span><strong>Write the investigation handoff</strong></label><p id="m07-notes-help">In 140+ characters, state the verdict, name EM-071 and the affected user/device, cite one email artifact and the timed network link, then recommend action.</p><textarea id="m07-notes" name="notes" rows="6" maxlength="1000" aria-describedby="m07-notes-help m07-note-count" placeholder="Verdict: … Scope: … Correlation: … Recommended action: …">${esc(moduleSevenState.notes)}</textarea><p id="m07-note-count"><span>${moduleSevenState.notes.length}</span>/1000 characters</p></div><button type="button" class="m07-hint-button m07-artifact-hint" data-m07-hint="brief" aria-expanded="${moduleSevenState.hintsOpened.includes('brief')}"><i class="ri-lightbulb-line" aria-hidden="true"></i>Handoff checklist</button>${moduleSevenState.hintsOpened.includes('brief') ? '<p class="m07-hint m07-artifact-hint" role="status">Verdict → exact delivered scope → header or artifact fact → DNS/TLS correlation → proportionate containment and continued search.</p>' : ''}<div class="m07-actions"><button type="submit" class="m07-submit"><i class="ri-checkbox-circle-line" aria-hidden="true"></i>Score analyst brief</button><button type="button" class="m07-reset" data-m07-reset><i class="ri-restart-line" aria-hidden="true"></i>Reset only this lab</button></div>${moduleSevenScorePanel()}</form>`;
}

function moduleSevenDynamic() {
  return `${moduleSevenDesk()}${moduleSevenArtifact()}`;
}

function viewModuleSeven(user, program) {
  moduleSevenLoad(user);
  const module = program.modules['soc-07'];
  const sections = moduleSevenGetSections();
  const lectureOpen = moduleSevenReviewMode || !sections[0].isComplete;
  const quizOpen = moduleSevenReviewMode || (moduleSevenQuizState && !moduleSevenQuizState.passed);
  const labOpen = moduleSevenReviewMode || !sections[2].isComplete;
  const reviewOpen = moduleSevenReviewMode;

  return `<div class="m07-shell">
    ${moduleTopbar(user, program)}
    ${moduleProgressShell(sections, { reviewMode: moduleSevenReviewMode })}
    <main class="m07-main">
      <section class="m07-hero" aria-labelledby="m07-title"><div><p class="m07-kicker">Module 07 · ${formatInstructionalMinutes(module.durationMinutes)} · analysis practice</p><h1 id="m07-title">${esc(module.title)}</h1><p class="m07-lede">Correlate a QR-phishing vendor invoice lure with DNS and TLS activity, distinguish meaningful artifacts from plausible benign traffic, and produce a bounded response handoff.</p></div><dl class="m07-progress" aria-label="Saved lab progress"><div><dt>Curriculum items</dt><dd>${module.lessons}</dd></div><div><dt>Labs</dt><dd>${module.labs}</dd></div><div><dt>Lab status</dt><dd id="m07-status">${moduleSevenState.completed ? 'Complete' : moduleSevenState.attempts ? 'In progress' : 'Not started'}</dd></div></dl></section>

      <details class="m07-section-collapsible" ${lectureOpen ? 'open' : ''}>
        <summary class="m07-section"><div class="m07-section-heading"><span class="m07-section-badge">1</span><div><p class="m07-kicker">Lecture</p><h2 id="m07-lecture">Email authentication and network correlation</h2></div></div></summary>
        <div class="m07-section-body">
          <section class="m07-objective" aria-labelledby="m07-objective-title"><i class="ri-focus-3-line" aria-hidden="true"></i><div><p class="m07-kicker">Measurable objective</p><h3 id="m07-objective-title">Correlate one suspicious delivered message with its DNS and TLS sessions, bound the exposed recipient-device pair, and communicate a proportionate response with at least ${MODULE_SEVEN_PASSING_SCORE}/100.</h3></div></section>
          <section class="m07-section" id="m07-field-guide" aria-labelledby="m07-guide-title"><div class="m07-section-heading"><span>a</span><div><p class="m07-kicker">Field guide</p><h3 id="m07-guide-title">Follow identity, artifact, delivery, and session</h3></div></div>${moduleSevenConcepts()}<div class="m07-analysis-chain" aria-label="Email and network analysis sequence"><span>Sender identity</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>URL &amp; file</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>Delivery trace</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>DNS &amp; TLS</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>Scope &amp; response</span></div></section>
          ${moduleSevenVideoScript()}
        </div>
      </details>

      <details class="m07-section-collapsible" ${quizOpen ? 'open' : ''}>
        <summary class="m07-section"><div class="m07-section-heading"><span class="m07-section-badge">2</span><div><p class="m07-kicker">Knowledge Check</p><h2 id="m07-knowledge-check">Test your understanding of email and network analysis</h2></div></div></summary>
        <div class="m07-section-body">${moduleSevenQuizPanel()}</div>
      </details>

      <details class="m07-section-collapsible" ${labOpen ? 'open' : ''}>
        <summary class="m07-section"><div class="m07-section-heading"><span class="m07-section-badge">3</span><div><p class="m07-kicker">Investigation Lab</p><h2 id="m07-lab">QR invoice vendor-impersonation message</h2></div></div></summary>
        <div class="m07-section-body">
          <div class="m07-role"><i class="ri-user-search-line" aria-hidden="true"></i><div><strong>Your role: network and email analyst</strong><p>Investigate the desks in either order. Decide which records belong to one evidence chain, preserve only the strongest facts, and avoid expanding scope beyond observed delivery and interaction.</p></div></div>
          <div id="m07-dynamic">${moduleSevenDynamic()}</div>
        </div>
      </details>

      <details class="m07-section-collapsible" ${reviewOpen ? 'open' : ''}>
        <summary class="m07-section"><div class="m07-section-heading"><span class="m07-section-badge">4</span><div><p class="m07-kicker">Module Review</p><h2 id="m07-review">Key concepts and takeaways</h2></div></div></summary>
        <div class="m07-section-body">${moduleSevenReview()}</div>
      </details>

      <details class="m07-section-collapsible" ${moduleSevenReviewMode ? 'open' : ''}>
        <summary class="m07-section"><div class="m07-section-heading"><span class="m07-section-badge">5</span><div><p class="m07-kicker">Sources &amp; Further Reading</p><h2 id="m07-sources">Authoritative references</h2></div></div></summary>
        <div class="m07-section-body">${moduleSourcesBlock(MODULE_SEVEN_SOURCES_LIST)}</div>
      </details>
    </main>
  </div>`;
}

function moduleSevenExactSelection(selected, expected, points) {
  const correct = expected.filter((item) => selected.includes(item)).length;
  const extras = selected.filter((item) => !expected.includes(item)).length;
  return Math.max(0, Math.round((correct / expected.length) * points) - extras * Math.ceil(points / expected.length));
}

function moduleSevenScore() {
  const evidence = moduleSevenExactSelection(moduleSevenState.selectedEvidence, MODULE_SEVEN_EXPECTED_EVIDENCE, 18);
  const reviewedEmail = moduleSevenState.reviewedMessages.includes('EM-071') && ['headers', 'artifacts', 'trace'].every((tab) => moduleSevenState.reviewedEmailTabs.includes(tab));
  const reviewedNetwork = ['NS-704', 'NS-705'].every((id) => moduleSevenState.reviewedSessions.includes(id));
  const review = (reviewedEmail ? 6 : 0) + (reviewedNetwork ? 6 : 0);
  const verdict = moduleSevenState.verdict === 'credential-phish' ? 8 : 0;
  const headers = moduleSevenState.headerAssessment === 'misaligned' ? 6 : 0;
  const linkage = moduleSevenState.linkage === 'timed-artifact-match' ? 8 : 0;
  const scope = moduleSevenState.scope === 'acct63-ws517' ? 8 : 0;
  const decision = moduleSevenState.response === 'contain-search' ? 20 : 0;
  const note = moduleSevenState.notes.trim().toLowerCase();
  const communication = (note.length >= 140 ? 4 : 0)
    + (/(phish|malicious|credential)/.test(note) ? 4 : 0)
    + (/em-071/.test(note) && /acct-63/.test(note) && /ws-517/.test(note) ? 4 : 0)
    + (/(invoice-qr|aaa|dmarc|return-path|attachment|qr)/.test(note) && /(ns-704|ns-705|dns|tls|203\.0\.113\.88)/.test(note) ? 4 : 0)
    + (/(remove|isolate|contain|invalidate|reset|block|search|trace)/.test(note) ? 4 : 0);
  const observation = evidence + review;
  const analysis = verdict + headers + linkage + scope;
  const score = observation + analysis + decision + communication;
  return { score, breakdown: { observation, evidence, review, analysis, verdict, headers, linkage, scope, decision, communication }, feedback: [
    evidence === 18 ? 'Evidence: The six saved facts form a clean header → artifact → trace → DNS/TLS chain.' : `Evidence: ${evidence}/18. Keep NS-704, NS-705, EV-H71, EV-U71, EV-A71, and EV-T71 without benign baseline rows.`,
    review === 12 ? 'Inspection: The suspicious message evidence and both linked network sessions were examined.' : `Inspection: ${review}/12. Review EM-071 headers, artifacts, and trace, plus NS-704 and NS-705.`,
    verdict && headers ? 'Email analysis: Correct phishing verdict and precise SPF/DMARC alignment interpretation.' : `Email analysis: ${verdict + headers}/14. SPF authenticates the lookalike envelope domain; it does not repair failed alignment with the visible From.`,
    linkage && scope ? 'Correlation and scope: Correctly ties the timed artifact chain to acct-63 on WS-517 and excludes the blocked copy.' : `Correlation and scope: ${linkage + scope}/16. Use artifact, time, host, identity, and delivery outcome together.`,
    decision ? 'Decision: Response removes the delivered message, contains the affected pair, blocks validated artifacts, and continues a scoped search.' : 'Decision: Address message, workstation, account session, validated artifacts, and continued trace search without taking enterprise-wide action.',
    communication === 20 ? 'Handoff: Complete, bounded, evidence-based, and actionable.' : `Handoff: ${communication}/20. Include verdict, EM-071, acct-63/WS-517, one email artifact, the DNS/TLS link, and action in at least 140 characters.`,
  ] };
}

function moduleSevenRender(focusId) {
  const root = document.getElementById('m07-dynamic');
  if (!root) return;
  root.innerHTML = moduleSevenDynamic();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
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

function wireModuleSevenLab() {
  const root = document.getElementById('m07-dynamic');
  if (!root || !moduleSevenState) return;
  root.addEventListener('click', (event) => {
    const desk = event.target.closest('[data-m07-desk]');
    if (desk) { moduleSevenState.activeDesk = desk.dataset.m07Desk; moduleSevenState.detailSession = ''; moduleSevenSave(); moduleSevenRender(`m07-tab-${moduleSevenState.activeDesk}`); return; }
    const message = event.target.closest('[data-m07-message]');
    if (message) { moduleSevenState.activeMessage = message.dataset.m07Message; moduleSevenState.activeEmailTab = 'overview'; moduleSevenAddUnique('reviewedMessages', moduleSevenState.activeMessage); moduleSevenSave(); moduleSevenRender('m07-desk-panel'); return; }
    const mailCategory = event.target.closest('[data-m07-mail-category]');
    if (mailCategory) { moduleSevenState.mailCategory = mailCategory.dataset.m07MailCategory; moduleSevenSave(); moduleSevenRender(); return; }
    if (event.target.closest('[data-m07-run-mail-query]')) {
      const editor = root.querySelector('#m07-mail-query-editor');
      moduleSevenState.mailQueryDraft = editor ? editor.value : moduleSevenState.mailQueryDraft;
      const result = moduleSevenRunMailQuery(moduleSevenState.mailQueryDraft);
      moduleSevenState.mailQueryRuns += 1;
      moduleSevenState.mailQueryResultIds = result.rows.map((row) => row.id);
      moduleSevenState.mailQueryFeedback = result.tableOk
        ? (result.clauses.length ? `Filtered by ${result.clauses.map((c) => `${c.field} ${c.op} "${c.value}"`).join(', ')}.` : 'No filter clauses applied yet; showing every message.')
        : 'Start the query with the table name MailEvents.';
      moduleSevenSave();
      moduleSevenRender('m07-mail-query-feedback');
      return;
    }
    const emailTab = event.target.closest('[data-m07-email-tab]');
    if (emailTab) { moduleSevenState.activeEmailTab = emailTab.dataset.m07EmailTab; if (moduleSevenState.activeMessage === 'EM-071') moduleSevenAddUnique('reviewedEmailTabs', moduleSevenState.activeEmailTab); moduleSevenSave(); moduleSevenRender('m07-desk-panel'); return; }
    const session = event.target.closest('[data-m07-session]');
    if (session) { moduleSevenState.detailSession = session.dataset.m07Session; moduleSevenAddUnique('reviewedSessions', moduleSevenState.detailSession); moduleSevenSave(); moduleSevenRender('m07-session-detail'); return; }
    if (event.target.closest('[data-m07-close-session]')) { moduleSevenState.detailSession = ''; moduleSevenSave(); moduleSevenRender('m07-desk-panel'); return; }
    const evidence = event.target.closest('[data-m07-evidence]');
    if (evidence) { const id = evidence.dataset.m07Evidence; moduleSevenState.selectedEvidence = moduleSevenState.selectedEvidence.includes(id) ? moduleSevenState.selectedEvidence.filter((item) => item !== id) : [...moduleSevenState.selectedEvidence, id]; moduleSevenState.validationError = ''; moduleSevenSave(); moduleSevenRender('m07-tray-title'); return; }
    const hint = event.target.closest('[data-m07-hint]');
    if (hint) { const id = hint.dataset.m07Hint; moduleSevenState.hintsOpened = moduleSevenState.hintsOpened.includes(id) ? moduleSevenState.hintsOpened.filter((item) => item !== id) : [...moduleSevenState.hintsOpened, id]; moduleSevenSave(); moduleSevenRender(); return; }
    if (event.target.closest('[data-m07-reset]')) {
      if (typeof window.confirm === 'function' && !window.confirm('Reset only this Module 07 lab? Your saved investigation will be cleared.')) return;
      moduleSevenState = LabRuntime.reset(MODULE_SEVEN_LAB_ID, moduleSevenUser, moduleSevenFreshState());
      moduleSevenMarkCatalogLabs(false);
      moduleSevenRender('m07-workbench-title');
      const status = document.getElementById('m07-status'); if (status) status.textContent = 'Not started';
    }
  });
  root.addEventListener('input', (event) => {
    if (event.target.name === 'mailQueryDraft') { moduleSevenState.mailQueryDraft = event.target.value; moduleSevenSave(); return; }
    if (event.target.name !== 'notes') return;
    moduleSevenState.notes = event.target.value;
    const count = root.querySelector('#m07-note-count span'); if (count) count.textContent = String(event.target.value.length);
    moduleSevenSave();
  });
  root.addEventListener('change', (event) => {
    if (!['verdict', 'headerAssessment', 'linkage', 'scope', 'response'].includes(event.target.name)) return;
    moduleSevenState[event.target.name] = event.target.value; moduleSevenState.validationError = ''; moduleSevenSave();
  });
  root.addEventListener('submit', (event) => {
    if (event.target.id !== 'm07-form') return;
    event.preventDefault(); moduleSevenState.notes = event.target.elements.notes.value;
    const missing = [];
    if (!moduleSevenState.selectedEvidence.length) missing.push('selected evidence');
    if (!moduleSevenState.verdict) missing.push('message verdict');
    if (!moduleSevenState.headerAssessment) missing.push('header assessment');
    if (!moduleSevenState.linkage) missing.push('cross-source relationship');
    if (!moduleSevenState.scope) missing.push('delivery scope');
    if (!moduleSevenState.response) missing.push('response recommendation');
    if (moduleSevenState.notes.trim().length < 140) missing.push('140-character handoff');
    if (missing.length) { moduleSevenState.validationError = `Add: ${missing.join(', ')}. Your existing work is saved.`; moduleSevenSave(); moduleSevenRender('m07-feedback'); return; }
    const result = moduleSevenScore();
    moduleSevenState.attempts += 1; moduleSevenState.score = result.score; moduleSevenState.bestScore = Math.max(moduleSevenState.bestScore || 0, result.score); moduleSevenState.breakdown = result.breakdown; moduleSevenState.feedback = result.feedback; moduleSevenState.validationError = ''; moduleSevenState.lastSubmittedAt = new Date().toISOString();
    const passed = result.score >= MODULE_SEVEN_PASSING_SCORE;
    if (typeof recordLabAttempt === 'function') {
      const attemptFields = {
        state: passed ? 'complete' : 'in_progress',
        score: result.score,
        result: { breakdown: result.breakdown, feedback: result.feedback, attempts: moduleSevenState.attempts },
      };
      MODULE_SEVEN_CATALOG_LAB_KEYS.forEach((labKey) => recordLabAttempt(moduleSevenUser, labKey, attemptFields));
    }
    if (passed) { moduleSevenState.completed = true; if (!moduleSevenState.flags.includes(MODULE_SEVEN_FLAG)) moduleSevenState.flags.push(MODULE_SEVEN_FLAG); moduleSevenMarkCatalogLabs(true); }
    moduleSevenSave(); moduleSevenRender('m07-feedback');
    const status = document.getElementById('m07-status'); if (status) status.textContent = moduleSevenState.completed ? 'Complete' : 'In progress';
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
  wireModuleSevenLab();
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 7, moduleKey: 'soc-07', view: viewModuleSeven, wire: wireModuleSeven });
