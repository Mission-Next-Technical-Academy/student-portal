#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
const root = path.join(__dirname, '..', 'portal');
for (const file of ['soc-m07-assessment-data.js', 'soc-m07-assessment-state.js',
  'soc-m07-assessment-actions.js', 'soc-m07-assessment-email-ui.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
}
const fixture = vm.runInContext('SocM07AssessmentData', context);
const stateApi = vm.runInContext('SocM07AssessmentState', context);
const actions = vm.runInContext('SocM07AssessmentActions', context);
const ui = vm.runInContext('SocM07AssessmentEmailUi', context);
const initialState = stateApi.normalize({}, fixture);
const initial = ui.render(fixture, initialState);

assert.match(initial, /aria-label="Independent email assessment"/);
assert.match(initial, /Message queue/);
assert.match(initial, /Delivery trace and recipient scope/);
assert.match(initial, /Gateway blocked/);
assert.match(initial, /acct-63/);
assert.match(initial, /acct-82/);
assert.match(initial, /Opened/);
assert.match(initial, /Link clicked/);
assert.match(initial, /No interaction recorded/);
assert.match(initial, /name="limit" type="number" min="1" max="100"/);
assert.match(initial, /QR invoice available/);
assert.match(initial, /data-m07-review-message="M07-MSG-001" aria-pressed="false"/);
assert.match(initial, /aria-label="Selected evidence" data-m07-evidence-tray/);
assert.match(initial, /data-m07-incident-workflow/);
assert.match(initial, /data-m07-incident-form/);
assert.match(initial, /name="assessment"/);
assert.match(initial, /name="recipientIds" value="acct-63"/);
assert.match(initial, /name="deviceIds" value="ws-517"/);
assert.match(initial, /name="eventIds" value="M07-DNS-001"/);
assert.match(initial, /Records not established by linked evidence remain unknown/);
assert.match(initial, /data-m07-evidence-toggle="M07-MSG-001" aria-pressed="false">Add to evidence: message/);
assert.match(initial, /data-m07-evidence-toggle="M07-ATTACH-001" aria-pressed="false">Add to evidence: attachment/);
assert.match(initial, /data-m07-evidence-toggle="M07-DELIVERY-001"/);
assert.match(initial, /<summary>Raw headers and authentication<\/summary>/);
assert.match(initial, /<dt>Message-ID<\/dt><dd>&lt;m07-qr-001@mailer\.northwind-billing\.example&gt;<\/dd>/);
assert.match(initial, /<dt>SPF<\/dt><dd>pass<\/dd>/);
assert.match(initial, /<dt>DKIM<\/dt><dd>pass<\/dd>/);
assert.match(initial, /<dt>DMARC<\/dt><dd>fail<\/dd>/);
assert.match(initial, /<dt>Domain alignment<\/dt><dd>Not aligned<\/dd>/);
assert.match(initial, /<summary>URL redirects and attachments<\/summary>/);
assert.match(initial, /<code>https:\/\/invoice-qr\.example\/r\/7f3a<\/code>/);
assert.match(initial, /HTTP 302/);
assert.match(initial, /<dt>Media type<\/dt><dd>application\/pdf<\/dd>/);
assert.match(initial, /Metadata only; this assessment does not open or execute the file\./);
assert.doesNotMatch(initial, /<a\b|\bhref\s*=|window\.open|location\./i, 'fixture URLs and artifacts never navigate or open');
assert.doesNotMatch(initial, /expectedTruth|incidentChain/);
const incidentState = actions.append(initialState, 'incident_link',
  new Date(fixture.scenario.fixedAt).toISOString(), {
    operation: 'create', incidentId: 'M07-INCIDENT-0001', title: '<img src=x>', assessment: 'unknown',
    recipientIds: ['acct-63'], deviceIds: ['ws-517'], eventIds: ['M07-DNS-001'],
    summary: '<script>not trusted</script>',
  }, fixture);
const incidentHtml = ui.render(fixture, incidentState);
assert.match(incidentHtml, /&lt;img src=x&gt;/);
assert.match(incidentHtml, /&lt;script&gt;not trusted&lt;\/script&gt;/);
assert.match(incidentHtml, /Assessment: unknown/);
assert.match(incidentHtml, /Evidence-linked records: 1/);
assert.match(incidentHtml, /Update incident/);
assert.doesNotMatch(incidentHtml, /expectedTruth|incidentChain|credential compromise|payload execution/i);
assert.doesNotMatch(incidentHtml, /<img src=x>|<script>not trusted/);
const filteredState = actions.append(initialState, 'recipient_search',
  new Date(fixture.scenario.fixedAt).toISOString(), {
    query: 'acct-63', delivery: 'delivered', interaction: 'clicked', limit: 1,
    recipientIds: ['acct-63'], deviceIds: ['ws-517'],
  }, fixture);
const filteredHtml = ui.render(fixture, filteredState);
assert.match(filteredHtml, /data-m07-recipient-id="acct-63"/);
assert.doesNotMatch(filteredHtml, /data-m07-recipient-id="acct-82"/);
assert.match(filteredHtml, /In current scope/);
assert.doesNotMatch(filteredHtml, /expectedTruth|incidentChain/);
const hostileSearchState = { ...filteredState, recipientSearch: { ...filteredState.recipientSearch,
  query: '<img src=x onerror=alert(1)>' } };
const hostileSearchHtml = ui.render(fixture, hostileSearchState);
assert.match(hostileSearchHtml, /&lt;img src=x onerror=alert\(1\)&gt;/);
assert.doesNotMatch(hostileSearchHtml, /<img src=x/);

const message = fixture.scenario.messages[0];
const hostileFixture = { scenario: { ...fixture.scenario, messages: [{ ...message,
  id: '<img src=x onerror=alert(1)>', subject: '<script>alert(1)</script> & "quoted"',
  from: { displayName: '<b>Billing</b>', address: 'attacker@example.test' },
  headerMessageId: '<script>header()</script>', replyTo: '<svg/onload=1>',
}] } };
const hostile = ui.render(hostileFixture, { reviewedMessageIds: ['<img src=x onerror=alert(1)>'] });
assert.match(hostile, /&lt;script&gt;alert\(1\)&lt;\/script&gt; &amp; &quot;quoted&quot;/);
assert.match(hostile, /&lt;script&gt;header\(\)&lt;\/script&gt;/);
assert.match(hostile, /aria-pressed="true">Mark unreviewed/);
assert.doesNotMatch(hostile, /<script>|<img src=x|<svg\/onload/);

const artifact = message.urls[0];
const hostileArtifactFixture = { scenario: { ...fixture.scenario, messages: [{ ...message,
  urls: [{ ...artifact, original: 'javascript:alert(1)', redirects: [{ ...artifact.redirects[0],
    url: '<img src=x onerror=alert(1)>', status: '<script>302</script>' }] }],
  attachments: [{ ...message.attachments[0], fileName: '<svg onload=alert(1)>.pdf', mediaType: 'text/html & more' }],
}] } };
const hostileArtifact = ui.render(hostileArtifactFixture, {});
assert.match(hostileArtifact, /&lt;img src=x onerror=alert\(1\)&gt;/);
assert.match(hostileArtifact, /&lt;script&gt;302&lt;\/script&gt;/);
assert.match(hostileArtifact, /&lt;svg onload=alert\(1\)&gt;\.pdf/);
assert.match(hostileArtifact, /text\/html &amp; more/);
assert.doesNotMatch(hostileArtifact, /<a\b|\bhref\s*=|<img src=x|<script>|<svg onload=/i);

const timestamp = new Date(fixture.scenario.fixedAt).toISOString();
const reviewedState = actions.append(initialState, 'message_review', timestamp,
  { messageId: 'M07-MSG-001', reviewed: true }, fixture);
assert.deepStrictEqual(Array.from(reviewedState.reviewedMessageIds), ['M07-MSG-001']);
assert.strictEqual(reviewedState.actionHistory[0].type, 'message_review');
assert.strictEqual(reviewedState.actionHistory[0].details.messageId, 'M07-MSG-001');
const artifactReviewed = actions.append(reviewedState, 'artifact_review', timestamp,
  { artifactId: 'M07-REDIRECT-001', reviewed: true, note: 'Redirect destination inspected' }, fixture);
assert.deepStrictEqual(Array.from(artifactReviewed.reviewedArtifactIds), ['M07-REDIRECT-001']);
assert.strictEqual(artifactReviewed.actionHistory[1].type, 'artifact_review');
assert.match(ui.render(fixture, artifactReviewed), /data-m07-review-artifact="M07-REDIRECT-001" aria-pressed="true">Mark unreviewed redirect/);
const selectedEvidence = actions.append(artifactReviewed, 'evidence_change', timestamp,
  { operation: 'add', eventId: 'M07-REDIRECT-001', reason: 'Selected redirect evidence' }, fixture);
assert.match(ui.render(fixture, selectedEvidence), /Evidence tray[\s\S]*artifact · https:\/\/invoice-qr\.example\/r\/7f3a <code>M07-REDIRECT-001/);
assert.match(ui.render(fixture, selectedEvidence), /data-m07-evidence-toggle="M07-REDIRECT-001" aria-pressed="true">Remove from evidence/);
const reviewed = ui.render(fixture, reviewedState);
assert.match(reviewed, /aria-pressed="true">Mark unreviewed/);
assert.match(reviewed, /· Reviewed<\/p>/);
assert.deepStrictEqual(Array.from(initialState.reviewedMessageIds), [], 'render and action preserve prior state');
assert.deepStrictEqual(Array.from(initialState.reviewedArtifactIds), [], 'artifact review preserves prior state');
assert.match(ui.render({}, initialState), /Assessment messages are unavailable/);

console.log('M07 assessment email UI: all checks passed');
