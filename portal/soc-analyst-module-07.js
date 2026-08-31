/* Module 07 — semi-independent network and email investigation.
 * All messages, domains, addresses, identities, and telemetry are fictional.
 */

const MODULE_SEVEN_LAB_ID = 'm07-network-email-investigation-v1';
const MODULE_SEVEN_FLAG = 'M07-PHISH-NETWORK-CORRELATED';
const MODULE_SEVEN_CATALOG_LAB_KEYS = ['lab-email-triage', 'lab-network-investigation'];
const MODULE_SEVEN_PASSING_SCORE = 70;
const MODULE_SEVEN_EMAIL_MINUTES = LABS.find((item) => item.key === 'lab-email-triage').instructionalMinutes;
const MODULE_SEVEN_NETWORK_MINUTES = LABS.find((item) => item.key === 'lab-network-investigation').instructionalMinutes;

const MODULE_SEVEN_NETWORK = [
  { id: 'NS-701', time: '10:02:11', device: 'WS-204', account: 'acct-11', protocol: 'TLS', source: '10.24.8.21:51744', destination: '198.51.100.20:443', bytes: '1.8 MB in / 92 KB out', verdict: 'Allowed', summary: 'Signed update agent contacted its documented service during the maintenance window.', evidence: false },
  { id: 'NS-702', time: '10:08:42', device: 'WS-312', account: 'acct-46', protocol: 'DNS', source: '10.24.9.33:53310', destination: '10.24.0.10:53', bytes: '142 B in / 96 B out', verdict: 'Allowed', summary: 'Managed workstation resolved helpdesk.internal.test through the internal resolver.', evidence: false },
  { id: 'NS-703', time: '10:13:05', device: 'WS-517', account: 'acct-63', protocol: 'TLS', source: '10.24.12.57:51902', destination: '192.0.2.45:443', bytes: '438 KB in / 51 KB out', verdict: 'Allowed', summary: 'Existing authenticated session to the approved collaboration service; destination is common in the baseline.', evidence: false },
  { id: 'NS-704', time: '10:17:26', device: 'WS-517', account: 'acct-63', protocol: 'DNS', source: '10.24.12.57:54819', destination: '10.24.0.10:53', bytes: '188 B in / 102 B out', verdict: 'Allowed', query: 'auth-renewal.example', answer: '203.0.113.88', summary: 'First-seen domain resolved one minute after the delivered benefits message was opened.', evidence: true },
  { id: 'NS-705', time: '10:18:03', device: 'WS-517', account: 'acct-63', protocol: 'TLS', source: '10.24.12.57:51948', destination: '203.0.113.88:443', bytes: '31 KB in / 84 KB out', verdict: 'Allowed', sni: 'auth-renewal.example', summary: 'Rare destination and matching SNI followed the DNS lookup by 37 seconds; outbound transfer exceeds the short inbound response.', evidence: true },
  { id: 'NS-706', time: '10:21:18', device: 'SRV-009', account: 'backup-job', protocol: 'TLS', source: '10.24.2.19:50802', destination: '192.0.2.80:443', bytes: '12 KB in / 4.2 GB out', verdict: 'Allowed', summary: 'Large transfer is an expected encrypted archive upload from the registered backup server and service identity.', evidence: false },
  { id: 'NS-707', time: '10:27:54', device: 'WS-118', account: 'acct-52', protocol: 'TLS', source: '10.24.7.18:52117', destination: '203.0.113.41:443', bytes: '2.1 MB in / 61 KB out', verdict: 'Allowed', summary: 'Browser reached the approved training site; this address is unrelated to the message artifacts.', evidence: false },
];

const MODULE_SEVEN_MESSAGES = [
  { id: 'EM-071', time: '10:15', from: 'Benefits Desk <benefits@northstar-people.example>', to: 'acct-63', subject: 'Action required: confirm 2026 benefit election', auth: 'DMARC fail', delivery: 'Delivered · Inbox', trace: 'MT-071', category: 'Inbox', preview: 'Your benefit election will expire today. Open the attached update page to retain coverage.', suspicious: true },
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
  { id: 'EV-H71', kind: 'Header', title: 'Authentication and identity misalign', detail: 'Visible From is northstar-people.example, Return-Path is bounce@northstarr-benefits.example, DKIM is absent, and DMARC fails. SPF passes only for the lookalike envelope domain.' },
  { id: 'EV-U71', kind: 'URL', title: 'Displayed destination hides a first-seen domain', detail: 'Button text says “Benefits portal,” but the HTML target is auth-renewal.example/session. The domain has no prior organizational traffic in this fixture.' },
  { id: 'EV-A71', kind: 'Attachment', title: 'HTML attachment launches the same URL', detail: 'Benefits_Update.html (text/html, SHA-256 aaa…) opens a browser to auth-renewal.example and produces a connection to 203.0.113.88 in the local sandbox summary.' },
  { id: 'EV-T71', kind: 'Trace', title: 'One copy delivered; matching follow-up blocked', detail: 'MT-071 delivered EM-071 to acct-63 at 10:15. MT-072, carrying the same attachment hash to acct-82, was rejected at 10:22 before delivery.' },
];

const MODULE_SEVEN_EXPECTED_EVIDENCE = ['NS-704', 'NS-705', 'EV-H71', 'EV-U71', 'EV-A71', 'EV-T71'];

let moduleSevenState = null;
let moduleSevenUser = null;

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
  if (moduleSevenState.activeEmailTab === 'headers') return `<div class="m07-email-copy"><dl><div><dt>From</dt><dd><code>benefits@northstar-people.example</code></dd></div><div><dt>Return-Path</dt><dd><code>bounce@northstarr-benefits.example</code></dd></div><div><dt>Received</dt><dd><code>mail.northstarr-benefits.example [203.0.113.88]</code></dd></div><div><dt>SPF</dt><dd>Pass for northstarr-benefits.example</dd></div><div><dt>DKIM</dt><dd>None</dd></div><div><dt>DMARC</dt><dd>Fail; visible From domain not aligned</dd></div></dl>${moduleSevenEvidenceButton('EV-H71', 'header finding')}</div>`;
  if (moduleSevenState.activeEmailTab === 'artifacts') return `<div class="m07-artifact-grid"><article><p class="m07-kicker">URL</p><h4>Benefits portal button</h4><dl><div><dt>Displayed text</dt><dd>Benefits portal</dd></div><div><dt>Defanged target</dt><dd><code>hxxps[://]auth-renewal[.]example/session</code></dd></div><div><dt>Reputation</dt><dd>First seen in this dataset</dd></div></dl>${moduleSevenEvidenceButton('EV-U71', 'URL finding')}</article><article><p class="m07-kicker">Attachment</p><h4>Benefits_Update.html</h4><dl><div><dt>Detected type</dt><dd>text/html · 18 KB</dd></div><div><dt>SHA-256</dt><dd><code>aaa…</code></dd></div><div><dt>Local sandbox summary</dt><dd>Opened browser → requested auth-renewal.example → connected to 203.0.113.88</dd></div></dl>${moduleSevenEvidenceButton('EV-A71', 'attachment finding')}</article></div>`;
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
  return `<section class="m07-workbench" aria-labelledby="m07-workbench-title"><div class="m07-panel-heading"><div><p class="m07-kicker">Two contained evidence desks</p><h2 id="m07-workbench-title">Correlation workbench</h2></div><span class="m07-chip">${moduleSevenState.selectedEvidence.length}/6 evidence saved</span></div><div class="m07-desk-tabs" role="tablist" aria-label="Investigation desks"><button id="m07-tab-email" type="button" role="tab" data-m07-desk="email" aria-selected="${moduleSevenState.activeDesk === 'email'}" aria-controls="m07-desk-panel"><i class="ri-mail-search-line" aria-hidden="true"></i>Email &amp; trace</button><button id="m07-tab-network" type="button" role="tab" data-m07-desk="network" aria-selected="${moduleSevenState.activeDesk === 'network'}" aria-controls="m07-desk-panel"><i class="ri-radar-line" aria-hidden="true"></i>Network sessions</button></div>${moduleSevenState.activeDesk === 'network' ? moduleSevenNetworkDesk() : moduleSevenEmailDesk()}<aside class="m07-tray" aria-labelledby="m07-tray-title"><div><p class="m07-kicker">Selected evidence</p><h3 id="m07-tray-title">Analyst tray</h3></div>${moduleSevenState.selectedEvidence.length ? `<ul>${moduleSevenState.selectedEvidence.map((id) => { const evidence = MODULE_SEVEN_EVIDENCE.find((item) => item.id === id); const network = MODULE_SEVEN_NETWORK.find((item) => item.id === id); return `<li><code>${esc(id)}</code><span>${esc(evidence ? evidence.title : network.summary)}</span><button type="button" data-m07-evidence="${esc(id)}" aria-label="Remove ${esc(id)} from evidence"><i class="ri-close-line" aria-hidden="true"></i></button></li>`; }).join('')}</ul>` : '<p>No evidence saved. Inspect records and keep only facts that support the final analysis.</p>'}</aside></section>`;
}

function moduleSevenRadio(name, options) {
  return `<div class="m07-options">${options.map((option) => `<label><input type="radio" name="${esc(name)}" value="${esc(option.id)}" ${moduleSevenState[name] === option.id ? 'checked' : ''}><span><strong>${esc(option.label)}</strong><small>${esc(option.help)}</small></span></label>`).join('')}</div>`;
}

function moduleSevenScorePanel() {
  if (moduleSevenState.validationError) return `<div class="m07-validation" id="m07-feedback" role="alert" tabindex="-1"><i class="ri-information-line" aria-hidden="true"></i><div><strong>Complete the analyst brief</strong><p>${esc(moduleSevenState.validationError)}</p></div></div>`;
  if (!moduleSevenState.attempts || !moduleSevenState.breakdown) return `<div class="m07-score-empty" id="m07-feedback" role="status">Scoring: observation 30 · analysis 30 · decision 20 · communication 20. Passing score: ${MODULE_SEVEN_PASSING_SCORE}.</div>`;
  const b = moduleSevenState.breakdown;
  const passed = moduleSevenState.score >= MODULE_SEVEN_PASSING_SCORE;
  return `<section class="m07-score ${passed ? 'is-pass' : 'is-remediate'}" id="m07-feedback" tabindex="-1" aria-live="polite"><div class="m07-score-heading"><div><p class="m07-kicker">Attempt ${moduleSevenState.attempts} · best ${moduleSevenState.bestScore}/100</p><h3>${moduleSevenState.score}/100 — ${passed ? 'Correlated finding is defensible' : 'Refine the correlation and scope'}</h3></div><span>${moduleSevenState.score}</span></div><div class="m07-score-grid"><div><strong>${b.observation}/30</strong><span>Observation</span><small>Evidence ${b.evidence}/18 · inspection ${b.review}/12</small></div><div><strong>${b.analysis}/30</strong><span>Analysis</span><small>Verdict ${b.verdict}/8 · headers ${b.headers}/6 · link ${b.linkage}/8 · scope ${b.scope}/8</small></div><div><strong>${b.decision}/20</strong><span>Decision</span><small>Proportionate response</small></div><div><strong>${b.communication}/20</strong><span>Communication</span><small>Finding, scope, correlation, action</small></div></div><ul class="m07-feedback-list">${moduleSevenState.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul><div class="m07-expert"><strong>Expert reasoning</strong><p>EM-071 is credential-phishing delivery: its visible sender is not aligned with the authenticated envelope identity, DMARC fails, and both the HTML attachment and hidden URL resolve to auth-renewal.example. After delivery and open, WS-517 resolves that first-seen domain and connects to its sandbox-matched address. MT-072 was blocked, so observed delivery scope is acct-63 on WS-517; remove the delivered copy, isolate and investigate that workstation, invalidate the affected session, block the validated artifacts, and search for further copies.</p></div></section>`;
}

function moduleSevenArtifact() {
  return `<form class="m07-artifact" id="m07-form" novalidate aria-labelledby="m07-artifact-title"><div class="m07-panel-heading"><div><p class="m07-kicker">Scored artifact</p><h2 id="m07-artifact-title">Network-and-email analyst brief</h2></div><span class="m07-chip">Retry allowed</span></div><p class="m07-instruction">Use the evidence tray to make one bounded finding. Select only what the records demonstrate.</p><fieldset><legend><span>1</span>Classify EM-071</legend>${moduleSevenRadio('verdict', [
    { id: 'credential-phish', label: 'Credential-phishing message', help: 'Authentication misalignment and the HTML/URL behavior support malicious intent.' },
    { id: 'marketing', label: 'Legitimate benefits marketing', help: 'Urgency alone is weak, but the technical artifacts contradict this verdict.' },
    { id: 'simulation', label: 'Approved awareness simulation', help: 'The queue contains a labeled simulation, but it is a different message and sender.' },
  ])}</fieldset><fieldset><legend><span>2</span>Interpret the header authentication</legend>${moduleSevenRadio('headerAssessment', [
    { id: 'misaligned', label: 'SPF passes only for the envelope domain; absent DKIM and failed DMARC leave the visible From unaligned.', help: 'This distinguishes authentication of a sender path from alignment with the displayed identity.' },
    { id: 'spf-safe', label: 'SPF pass proves the visible sender and message are trustworthy.', help: 'SPF alone does not validate alignment with the visible From domain.' },
    { id: 'dmarc-benign', label: 'DMARC failure is expected for all external benefits messages.', help: 'The legitimate external distractors demonstrate that external mail can align and pass.' },
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
  return `<div class="m07-shell"><header class="m07-topbar"><a href="#/program/${esc(program.slug)}" class="m07-brand" aria-label="Back to SOC Analyst program"><img src="assets/logo.png" alt="Mission Next Technical Academy"></a><div class="m07-top-actions"><span class="m07-simulation"><i class="ri-flask-line" aria-hidden="true"></i>Semi-independent · fictional data</span><a href="#/program/${esc(program.slug)}" class="m07-exit"><i class="ri-arrow-left-line" aria-hidden="true"></i>Course overview</a></div></header><main class="m07-main"><section class="m07-hero" aria-labelledby="m07-title"><div><p class="m07-kicker">Module 07 · ${formatInstructionalMinutes(module.durationMinutes)} · analysis practice</p><h1 id="m07-title">${esc(module.title)}</h1><p class="m07-lede">Correlate a delivered message with DNS and TLS activity, distinguish meaningful artifacts from plausible benign traffic, and produce a bounded response handoff.</p><a class="m07-hero-action" href="#m07-field-guide"><i class="ri-compass-3-line" aria-hidden="true"></i>Review the analysis method</a></div><dl class="m07-progress" aria-label="Saved lab progress"><div><dt>Curriculum items</dt><dd>${module.lessons}</dd></div><div><dt>Labs</dt><dd>${module.labs}</dd></div><div><dt>Lab status</dt><dd id="m07-status">${moduleSevenState.completed ? 'Complete' : moduleSevenState.attempts ? 'In progress' : 'Not started'}</dd></div></dl></section><section class="m07-objective" aria-labelledby="m07-objective-title"><i class="ri-focus-3-line" aria-hidden="true"></i><div><p class="m07-kicker">Measurable objective</p><h2 id="m07-objective-title">Correlate one suspicious delivered message with its DNS and TLS sessions, bound the exposed recipient-device pair, and communicate a proportionate response with at least ${MODULE_SEVEN_PASSING_SCORE}/100.</h2></div></section><section class="m07-section" id="m07-field-guide" aria-labelledby="m07-guide-title"><div class="m07-section-heading"><span>1</span><div><p class="m07-kicker">Field guide</p><h2 id="m07-guide-title">Follow identity, artifact, delivery, and session</h2></div></div>${moduleSevenConcepts()}<div class="m07-analysis-chain" aria-label="Email and network analysis sequence"><span>Sender identity</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>URL &amp; file</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>Delivery trace</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>DNS &amp; TLS</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>Scope &amp; response</span></div></section><section class="m07-section m07-lab-section" aria-labelledby="m07-lab-title"><div class="m07-section-heading"><span>2</span><div><p class="m07-kicker">Two isolated labs · ${formatInstructionalMinutes(MODULE_SEVEN_EMAIL_MINUTES + MODULE_SEVEN_NETWORK_MINUTES)} instructional time</p><h2 id="m07-lab-title">Benefits renewal message</h2></div></div><div class="m07-role"><i class="ri-user-search-line" aria-hidden="true"></i><div><strong>Your role: network and email analyst</strong><p>Investigate the desks in either order. Decide which records belong to one evidence chain, preserve only the strongest facts, and avoid expanding scope beyond observed delivery and interaction.</p></div></div><div id="m07-dynamic">${moduleSevenDynamic()}</div></section></main></div>`;
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
    + (/(auth-renewal|aaa|dmarc|return-path|attachment)/.test(note) && /(ns-704|ns-705|dns|tls|203\.0\.113\.88)/.test(note) ? 4 : 0)
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

registerModuleLab({ program: 'soc-analyst', moduleNumber: 7, moduleKey: 'soc-07', view: viewModuleSeven, wire: wireModuleSevenLab });
