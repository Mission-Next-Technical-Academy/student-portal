#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
for (const file of ['soc-m07-assessment-data.js', 'soc-m06-assessment-data.js', 'soc-m05-assessment-data.js', 'soc-m04-assessment-data.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', file), 'utf8'), context);
}
const data = vm.runInContext('SocM07AssessmentData', context);
const scenario = data.scenario;
const priorScenarios = [
  vm.runInContext('SocM06AssessmentData.scenario', context),
  vm.runInContext('SocM05AssessmentData.scenario', context),
  vm.runInContext('SocM04AssessmentData.scenario', context),
];

function validateScenario(candidate, earlierScenarios = priorScenarios) {
  const start = Date.parse(candidate.start);
  const end = Date.parse(candidate.end);
  const fixedAt = Date.parse(candidate.fixedAt);
  assert.ok(Number.isFinite(start) && Number.isFinite(end) && Number.isFinite(fixedAt));
  assert.ok(start < end && end === fixedAt, 'scenario bounds are fixed and ordered');
  assert.ok(earlierScenarios.every((prior) => candidate.id !== prior.id
    && (!candidate.stateKey || !prior.stateKey || candidate.stateKey !== prior.stateKey)),
  'scenario identity and persistence key are isolated');

  const inWindow = (value, label) => {
    const time = Date.parse(value);
    assert.ok(Number.isFinite(time) && time >= start && time <= end, `${label} falls in the scenario window`);
  };
  const messages = new Map(candidate.messages.map((item) => [item.id, item]));
  const groups = new Map(candidate.recipientGroups.map((item) => [item.id, item]));
  const urls = new Map(candidate.messages.flatMap((item) => item.urls.map((url) => [url.id, url])));
  const ids = [
    ...candidate.recipientGroups.map((item) => item.id),
    ...candidate.messages.map((item) => item.id),
    ...candidate.messages.flatMap((item) => item.urls.flatMap((url) => [url.id,
      ...url.redirects.map((redirect) => redirect.id)])),
    ...candidate.messages.flatMap((item) => item.attachments.map((attachment) => attachment.id)),
    ...candidate.deliveryEvents.map((item) => item.id),
    ...candidate.recipientEvents.map((item) => item.id),
    ...candidate.networkEvents.map((item) => item.id),
    ...candidate.endpointProcessEvents.map((item) => item.id),
  ];
  assert.strictEqual(new Set(ids).size, ids.length, 'all fixture record IDs are unique');
  assert.ok(candidate.packetSamples.length <= 8, 'packet samples are tightly bounded');
  assert.strictEqual(new Set(candidate.packetSamples.map((sample) => sample.eventId)).size,
    candidate.packetSamples.length, 'each packet sample maps to one distinct fixture event');
  for (const sample of candidate.packetSamples) {
    assert.ok(candidate.networkEvents.some((event) => event.id === sample.eventId), `${sample.eventId} packet record binds to fixture telemetry`);
    assert.ok(Number.isInteger(sample.capturedBytes) && sample.capturedBytes >= 0 && sample.capturedBytes <= 512);
    assert.ok(sample.sampleHex.length <= 384 && /^(?:[0-9a-f]{2}(?:\s|$))*$/i.test(sample.sampleHex));
    assert.ok(sample.sampleText.length <= 512);
  }

  for (const message of candidate.messages) {
    inWindow(message.receivedAt, `${message.id} receipt`);
    assert.ok(message.from?.address && message.replyTo && message.returnPath);
    for (const url of message.urls) {
      assert.ok(new URL(url.original).hostname.endsWith('.example'), `${url.id} uses a reserved example domain`);
      for (const redirect of url.redirects) {
        assert.ok([301, 302, 303, 307, 308, 200].includes(redirect.status));
        assert.ok(new URL(redirect.url).hostname.endsWith('.example'), `${redirect.id} uses a reserved example domain`);
      }
    }
    for (const attachment of message.attachments) {
      assert.ok(attachment.fileName && attachment.mediaType && attachment.sizeBytes > 0);
      assert.match(attachment.sha256, /^[a-f0-9]{64}$/);
    }
  }
  for (const event of candidate.deliveryEvents) {
    inWindow(event.timestamp, event.id);
    assert.ok(messages.has(event.messageId), `${event.id} references a known message`);
    const group = groups.get(event.groupId);
    assert.ok(group && group.recipientIds.includes(event.recipientId), `${event.id} recipient belongs to its group`);
    assert.strictEqual(event.status, group.delivery, `${event.id} agrees with its delivery group`);
  }
  for (const event of candidate.recipientEvents) {
    inWindow(event.timestamp, event.id);
    assert.ok(messages.has(event.messageId), `${event.id} references a known message`);
    assert.ok(urls.has(event.urlId), `${event.id} references a known message URL`);
    const group = candidate.recipientGroups.find((item) => item.recipientIds.includes(event.recipientId)
      && item.deviceIds.includes(event.deviceId));
    assert.ok(group?.delivery === 'delivered', `${event.id} belongs to a delivered recipient/device`);
  }

  const network = new Map(candidate.networkEvents.map((item) => [item.id, item]));
  const recipients = new Map(candidate.recipientEvents.map((item) => [item.id, item]));
  for (const event of candidate.networkEvents) {
    inWindow(event.timestamp, event.id);
    if (event.relatedRecipientEventId) {
      const recipient = recipients.get(event.relatedRecipientEventId);
      assert.ok(recipient && recipient.deviceId === event.deviceId
        && recipient.recipientId === event.recipientId, `${event.id} recipient reference resolves to same entity`);
    }
    if (event.relatedDnsEventId) {
      const dns = network.get(event.relatedDnsEventId);
      assert.ok(dns?.type === 'dns_query' && dns.answers.includes(event.destinationIp),
        `${event.id} DNS reference resolves to its destination`);
    }
    if (event.relatedTlsEventId) {
      const tls = network.get(event.relatedTlsEventId);
      assert.ok(tls?.type === 'tls_session' && tls.deviceId === event.deviceId,
        `${event.id} TLS reference resolves to same device`);
    }
    if (event.relatedRecipientEventId && event.type === 'proxy_request') {
      const url = urls.get(recipients.get(event.relatedRecipientEventId).urlId);
      assert.ok(url && [url.original, ...url.redirects.map((item) => item.url)].includes(event.url),
        `${event.id} URL matches the clicked message URL or redirect`);
    }
  }
  for (const event of candidate.endpointProcessEvents) {
    inWindow(event.timestamp, event.id);
    const proxy = network.get(event.relatedProxyEventId);
    assert.ok(proxy?.type === 'proxy_request' && proxy.deviceId === event.deviceId
      && proxy.recipientId === event.recipientId, `${event.id} proxy reference resolves to same entity`);
  }
}

assert.strictEqual(data.schemaVersion, 1);
assert.strictEqual(scenario.id, 'M07-ASSESS-2026-09-27');
assert.strictEqual(scenario.stateKey, 'm07-network-email-assessment-v1');
assert.strictEqual(scenario.fixedAt, '2026-09-27T10:20:00Z');
assert.ok(Date.parse(scenario.start) < Date.parse(scenario.fixedAt));
assert.strictEqual(scenario.end, scenario.fixedAt);
assert.ok(priorScenarios.every((prior) => scenario.id !== prior.id && scenario.stateKey !== prior.stateKey));
assert.deepStrictEqual(JSON.parse(JSON.stringify(scenario.recipientGroups)), [
  { id: 'M07-GROUP-DELIVERED', recipientIds: ['acct-63'], deviceIds: ['ws-517'], delivery: 'delivered' },
  { id: 'M07-GROUP-BLOCKED', recipientIds: ['acct-82'], deviceIds: [], delivery: 'blocked_at_gateway' },
]);
assert.strictEqual(scenario.messages.length, 1);
const message = scenario.messages[0];
assert.deepStrictEqual([message.id, message.subject, message.from.address, message.replyTo, message.returnPath,
  message.headerMessageId, message.receivedAt], [
  'M07-MSG-001', 'QR invoice available', 'billing@northwind-billing.example',
  'billing@northwind-billing.example', 'bounce@mailer.northwind-billing.example',
  '<m07-qr-001@mailer.northwind-billing.example>', '2026-09-27T10:02:00Z',
]);
assert.deepStrictEqual(JSON.parse(JSON.stringify(message.authentication)),
  { spf: 'pass', dkim: 'pass', dmarc: 'fail', aligned: false });
assert.strictEqual(message.urls[0].id, 'M07-URL-001');
assert.deepStrictEqual(Array.from(message.urls[0].redirects, (redirect) => redirect.id),
  ['M07-REDIRECT-001', 'M07-REDIRECT-002']);
assert.ok([message.urls[0].original, ...message.urls[0].redirects.map((redirect) => redirect.url)]
  .every((url) => url.startsWith('https://') && new URL(url).hostname.endsWith('.example')));
assert.deepStrictEqual(JSON.parse(JSON.stringify(message.attachments[0])), {
  id: 'M07-ATTACH-001', fileName: 'invoice-QR.pdf', mediaType: 'application/pdf',
  sizeBytes: 184320, sha256: 'a'.repeat(64),
});
const fixtureIds = [
  ...scenario.messages.map((item) => item.id),
  ...scenario.messages.flatMap((item) => [
    ...item.urls.map((url) => url.id),
    ...item.urls.flatMap((url) => url.redirects.map((redirect) => redirect.id)),
    ...item.attachments.map((attachment) => attachment.id),
  ]),
  ...scenario.deliveryEvents.map((event) => event.id),
  ...scenario.recipientEvents.map((event) => event.id),
  ...scenario.networkEvents.map((event) => event.id),
  ...scenario.endpointProcessEvents.map((event) => event.id),
];
assert.strictEqual(new Set(fixtureIds).size, fixtureIds.length, 'fixture IDs are unique');
for (const event of [...scenario.deliveryEvents, ...scenario.recipientEvents]) {
  assert.ok(Date.parse(event.timestamp) >= Date.parse(scenario.start)
    && Date.parse(event.timestamp) <= Date.parse(scenario.end), `${event.id} falls in the scenario window`);
  assert.ok(scenario.messages.some((item) => item.id === event.messageId), `${event.id} references a known message`);
}
for (const event of scenario.deliveryEvents) {
  const group = scenario.recipientGroups.find((item) => item.id === event.groupId);
  assert.ok(group && group.recipientIds.includes(event.recipientId), `${event.id} recipient belongs to its group`);
  assert.strictEqual(event.status, group.delivery, `${event.id} agrees with delivery group outcome`);
}
for (const event of scenario.recipientEvents) {
  assert.ok(scenario.recipientGroups.some((group) => group.delivery === 'delivered'
    && group.recipientIds.includes(event.recipientId)), `${event.id} is associated with a delivered recipient`);
  const messageUrls = scenario.messages.find((item) => item.id === event.messageId).urls;
  assert.ok(messageUrls.some((url) => url.id === event.urlId), `${event.id} URL reference resolves`);
}
const networkById = new Map(scenario.networkEvents.map((event) => [event.id, event]));
const recipientById = new Map(scenario.recipientEvents.map((event) => [event.id, event]));
for (const event of scenario.networkEvents) {
  assert.ok(['dns_query', 'tls_session', 'firewall_flow', 'proxy_request'].includes(event.type),
    `${event.id} has a supported network event type`);
  assert.ok(Date.parse(event.timestamp) >= Date.parse(scenario.start)
    && Date.parse(event.timestamp) <= Date.parse(scenario.end), `${event.id} falls in the scenario window`);
  if (event.relatedRecipientEventId) {
    const recipient = recipientById.get(event.relatedRecipientEventId);
    assert.ok(recipient && recipient.deviceId === event.deviceId && recipient.recipientId === event.recipientId,
      `${event.id} recipient linkage resolves to the same entity`);
  }
  if (event.relatedDnsEventId) {
    const dns = networkById.get(event.relatedDnsEventId);
    assert.ok(dns && dns.type === 'dns_query' && dns.answers.includes(event.destinationIp),
      `${event.id} DNS linkage resolves to its destination`);
  }
  if (event.relatedTlsEventId) {
    const tls = networkById.get(event.relatedTlsEventId);
    assert.ok(tls && tls.type === 'tls_session' && tls.deviceId === event.deviceId,
      `${event.id} TLS linkage resolves to the same device`);
  }
}
for (const event of scenario.endpointProcessEvents) {
  assert.strictEqual(event.type, 'process_start');
  assert.strictEqual(typeof event.establishesPayloadExecution, 'boolean');
  assert.ok(Date.parse(event.timestamp) >= Date.parse(scenario.start)
    && Date.parse(event.timestamp) <= Date.parse(scenario.end), `${event.id} falls in the scenario window`);
  const proxy = networkById.get(event.relatedProxyEventId);
  assert.ok(proxy && proxy.type === 'proxy_request' && proxy.deviceId === event.deviceId,
    `${event.id} proxy linkage resolves to the same device`);
}
assert.ok(scenario.networkEvents.filter((event) => event.benignLookalike)
  .every((event) => event.deviceId === 'ws-204' && event.domain !== 'invoice-qr.example'),
'benign lookalike traffic is distinct from the incident domain and device');
assert.strictEqual(scenario.expectedTruth.incidentChain[2].evidence, 'M07-DNS-001');
assert.strictEqual(scenario.expectedTruth.incidentChain[3].evidence, 'M07-TLS-001');
assert.strictEqual(scenario.expectedTruth.incidentChain[4].status, 'unverified',
  'browser process telemetry does not establish payload execution');
assert.strictEqual(scenario.expectedTruth.incidentChain[5].status, 'unverified',
  'network and process telemetry do not establish credential compromise');
assert.deepStrictEqual(Array.from(scenario.expectedTruth.incidentChain.slice(0, 2), (step) => step.evidence),
  ['M07-QR-014', 'M07-QR-014']);
assert.strictEqual(scenario.expectedTruth.incidentChain.map((step) => step.step).join(','),
  'message_delivery,recipient_open,dns_resolution,tls_connection,endpoint_execution,credential_compromise');
assert.deepStrictEqual(Array.from(scenario.expectedTruth.incidentChain.slice(0, 4), (step) => step.status),
  ['confirmed', 'confirmed', 'confirmed', 'confirmed']);
assert.deepStrictEqual(Array.from(scenario.expectedTruth.incidentChain.slice(4), (step) => step.status),
  ['unverified', 'unverified']);
assert.ok(Object.isFrozen(scenario) && Object.isFrozen(scenario.recipientGroups[0])
  && Object.isFrozen(scenario.messages[0].urls[0].redirects[0])
  && Object.isFrozen(scenario.deliveryEvents[0])
  && Object.isFrozen(scenario.recipientEvents[0])
  && Object.isFrozen(scenario.networkEvents[0])
  && Object.isFrozen(scenario.endpointProcessEvents[0])
  && Object.isFrozen(scenario.expectedTruth.incidentChain[0]), 'contract is deeply immutable');
function assertDeepFrozen(value, pathName = 'scenario') {
  if (!value || typeof value !== 'object') return;
  assert.ok(Object.isFrozen(value), `${pathName} is frozen`);
  for (const [key, nested] of Object.entries(value)) assertDeepFrozen(nested, `${pathName}.${key}`);
}
assertDeepFrozen(data);

validateScenario(scenario);
const corruptedCopies = [
  ['message outside window', (copy) => { copy.messages[0].receivedAt = '2026-09-27T10:21:00Z'; }],
  ['orphaned delivery message', (copy) => { copy.deliveryEvents[0].messageId = 'M07-MSG-MISSING'; }],
  ['orphaned recipient URL', (copy) => { copy.recipientEvents[0].urlId = 'M07-URL-MISSING'; }],
  ['orphaned network reference', (copy) => { copy.networkEvents[1].relatedDnsEventId = 'M07-DNS-MISSING'; }],
  ['mismatched process entity', (copy) => { copy.endpointProcessEvents[0].recipientId = 'acct-82'; }],
  ['duplicate nested identifier', (copy) => { copy.messages[0].attachments[0].id = copy.messages[0].urls[0].id; }],
  ['cross-module scenario ID', (copy) => { copy.id = priorScenarios[0].id; }],
  ['cross-module persistence key', (copy) => { copy.stateKey = priorScenarios.find((item) => item.stateKey)?.stateKey; }],
];
for (const [label, corrupt] of corruptedCopies) {
  const copy = JSON.parse(JSON.stringify(scenario));
  corrupt(copy);
  assert.throws(() => validateScenario(copy), undefined, `${label} is rejected`);
}
// Entity identity contract: lower-case hosts; EmailUrlEvents always carry the recipient Account.
{
  const hostOk = (value) => typeof value === 'string' && /^[a-z0-9][a-z0-9._-]*$/.test(value);
  const worlds = [['assessment', scenario.backgroundEvents], ['guided', data.buildBackground(data.guidedBackgroundWorld).events]];
  for (const [label, events] of worlds) {
    for (const event of events) {
      for (const key of ['Host', 'DeviceId']) {
        if (event.fields[key] !== undefined) assert.ok(hostOk(event.fields[key]), `${label} ${event.id} ${key} is a lower-case host token`);
      }
      if (event.fields.Host !== undefined && event.fields.DeviceId !== undefined) assert.strictEqual(event.fields.Host, event.fields.DeviceId, `${label} ${event.id} Host equals DeviceId`);
    }
    const mailRecipients = new Map();
    events.filter((event) => event.table === 'EmailEvents').forEach((event) => {
      if (!mailRecipients.has(event.fields.NetworkMessageId)) mailRecipients.set(event.fields.NetworkMessageId, new Set());
      mailRecipients.get(event.fields.NetworkMessageId).add(event.fields.Account);
    });
    for (const event of events.filter((item) => item.table === 'EmailUrlEvents')) {
      assert.ok(event.fields.Account, `${label} ${event.id} EmailUrlEvents row carries an Account`);
      assert.ok(mailRecipients.get(event.fields.NetworkMessageId)?.has(event.fields.Account), `${label} ${event.id} Account is a recipient of that message`);
    }
  }
  [...scenario.recipientGroups.flatMap((group) => group.deviceIds), ...scenario.recipientEvents.map((event) => event.deviceId),
    ...scenario.networkEvents.map((event) => event.deviceId), ...scenario.endpointProcessEvents.map((event) => event.deviceId)]
    .forEach((id) => assert.ok(hostOk(id), `case device ${id} is a lower-case host token`));
}
console.log('M07 assessment identity and incident-chain contract tests passed.');
