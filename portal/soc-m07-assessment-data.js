/* Independent Module 07 assessment identity and incident-chain truth contract. */
const SocM07AssessmentData = (() => {
  'use strict';

  function freeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(freeze);
    return value;
  }

  const scenario = {
    id: 'M07-ASSESS-2026-09-27',
    stateKey: 'm07-network-email-assessment-v1',
    fixedAt: '2026-09-27T10:20:00Z',
    start: '2026-09-27T10:00:00Z',
    end: '2026-09-27T10:20:00Z',
    recipientGroups: [
      { id: 'M07-GROUP-DELIVERED', recipientIds: ['acct-63'], deviceIds: ['WS-517'], delivery: 'delivered' },
      { id: 'M07-GROUP-BLOCKED', recipientIds: ['acct-82'], deviceIds: [], delivery: 'blocked_at_gateway' },
    ],
    messages: [
      {
        id: 'M07-MSG-001',
        subject: 'QR invoice available',
        from: { displayName: 'Northwind Billing', address: 'billing@northwind-billing.example' },
        replyTo: 'billing@northwind-billing.example',
        returnPath: 'bounce@mailer.northwind-billing.example',
        headerMessageId: '<m07-qr-001@mailer.northwind-billing.example>',
        receivedAt: '2026-09-27T10:02:00Z',
        authentication: { spf: 'pass', dkim: 'pass', dmarc: 'fail', aligned: false },
        urls: [
          {
            id: 'M07-URL-001',
            original: 'https://invoice-qr.example/open/7f3a',
            redirects: [
              { id: 'M07-REDIRECT-001', status: 302, url: 'https://invoice-qr.example/r/7f3a' },
              { id: 'M07-REDIRECT-002', status: 200, url: 'https://invoice-qr.example/invoice/7f3a' },
            ],
          },
        ],
        attachments: [
          { id: 'M07-ATTACH-001', fileName: 'invoice-QR.pdf', mediaType: 'application/pdf', sizeBytes: 184320, sha256: 'a'.repeat(64) },
        ],
      },
    ],
    deliveryEvents: [
      { id: 'M07-DELIVERY-001', messageId: 'M07-MSG-001', recipientId: 'acct-63', groupId: 'M07-GROUP-DELIVERED', status: 'delivered', timestamp: '2026-09-27T10:03:00Z' },
      { id: 'M07-DELIVERY-002', messageId: 'M07-MSG-001', recipientId: 'acct-82', groupId: 'M07-GROUP-BLOCKED', status: 'blocked_at_gateway', timestamp: '2026-09-27T10:03:02Z' },
    ],
    recipientEvents: [
      { id: 'M07-QR-014', messageId: 'M07-MSG-001', recipientId: 'acct-63', deviceId: 'WS-517', type: 'open_and_link_click', timestamp: '2026-09-27T10:08:00Z', urlId: 'M07-URL-001' },
    ],
    networkEvents: [
      { id: 'M07-DNS-001', type: 'dns_query', timestamp: '2026-09-27T10:08:04Z', deviceId: 'WS-517', recipientId: 'acct-63', domain: 'invoice-qr.example', answers: ['203.0.113.88'], source: 'resolver-02', relatedRecipientEventId: 'M07-QR-014' },
      { id: 'M07-TLS-001', type: 'tls_session', timestamp: '2026-09-27T10:08:07Z', deviceId: 'WS-517', recipientId: 'acct-63', destinationIp: '203.0.113.88', destinationPort: 443, sni: 'invoice-qr.example', certificateSha256: 'b'.repeat(64), relatedDnsEventId: 'M07-DNS-001', relatedRecipientEventId: 'M07-QR-014' },
      { id: 'M07-FW-001', type: 'firewall_flow', timestamp: '2026-09-27T10:08:08Z', deviceId: 'WS-517', recipientId: 'acct-63', sourceIp: '192.0.2.57', destinationIp: '203.0.113.88', destinationPort: 443, action: 'allow', relatedTlsEventId: 'M07-TLS-001' },
      { id: 'M07-PROXY-001', type: 'proxy_request', timestamp: '2026-09-27T10:08:09Z', deviceId: 'WS-517', recipientId: 'acct-63', method: 'GET', url: 'https://invoice-qr.example/invoice/7f3a', status: 200, relatedTlsEventId: 'M07-TLS-001', relatedRecipientEventId: 'M07-QR-014' },
      { id: 'M07-DNS-002', type: 'dns_query', timestamp: '2026-09-27T10:11:00Z', deviceId: 'WS-204', recipientId: 'acct-17', domain: 'payroll.northwind.example', answers: ['198.51.100.24'], source: 'resolver-02', relatedRecipientEventId: null, benignLookalike: true },
      { id: 'M07-TLS-002', type: 'tls_session', timestamp: '2026-09-27T10:11:03Z', deviceId: 'WS-204', recipientId: 'acct-17', destinationIp: '198.51.100.24', destinationPort: 443, sni: 'payroll.northwind.example', certificateSha256: 'c'.repeat(64), relatedDnsEventId: 'M07-DNS-002', relatedRecipientEventId: null, benignLookalike: true },
      { id: 'M07-FW-002', type: 'firewall_flow', timestamp: '2026-09-27T10:11:04Z', deviceId: 'WS-204', recipientId: 'acct-17', sourceIp: '192.0.2.84', destinationIp: '198.51.100.24', destinationPort: 443, action: 'allow', relatedTlsEventId: 'M07-TLS-002', benignLookalike: true },
      { id: 'M07-PROXY-002', type: 'proxy_request', timestamp: '2026-09-27T10:11:05Z', deviceId: 'WS-204', recipientId: 'acct-17', method: 'GET', url: 'https://payroll.northwind.example/portal', status: 200, relatedTlsEventId: 'M07-TLS-002', relatedRecipientEventId: null, benignLookalike: true },
    ],
    packetSamples: [
      { eventId: 'M07-DNS-001', summary: 'Synthetic DNS query and response', capturedBytes: 84, protocol: 'DNS', sampleHex: '12 34 01 00 00 01 00 01 00 00 00 00', sampleText: 'invoice-qr.example -> 203.0.113.88' },
      { eventId: 'M07-TLS-001', summary: 'Synthetic TLS client hello metadata', capturedBytes: 128, protocol: 'TLS', sampleHex: '16 03 01 00 2f 01 00 00 2b 03 03 5a', sampleText: 'SNI: invoice-qr.example; destination port: 443' },
      { eventId: 'M07-PROXY-001', summary: 'Synthetic HTTP request metadata; payload omitted', capturedBytes: 96, protocol: 'HTTP', sampleHex: '47 45 54 20 2f 69 6e 76 6f 69 63 65', sampleText: 'GET /invoice/7f3a; payload not included' },
    ],
    endpointProcessEvents: [
      { id: 'M07-PROC-001', type: 'process_start', timestamp: '2026-09-27T10:08:11Z', deviceId: 'WS-517', recipientId: 'acct-63', processName: 'chrome.exe', imagePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', commandLine: 'chrome.exe https://invoice-qr.example/invoice/7f3a', parentProcessName: 'explorer.exe', relatedProxyEventId: 'M07-PROXY-001', classification: 'browser_activity', establishesPayloadExecution: false },
      { id: 'M07-PROC-002', type: 'process_start', timestamp: '2026-09-27T10:11:06Z', deviceId: 'WS-204', recipientId: 'acct-17', processName: 'msedge.exe', imagePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', commandLine: 'msedge.exe https://payroll.northwind.example/portal', parentProcessName: 'explorer.exe', relatedProxyEventId: 'M07-PROXY-002', classification: 'benign_lookalike_browser_activity', establishesPayloadExecution: false },
    ],
    expectedTruth: {
      confirmed: [
        'The QR-invoice message was delivered to acct-63 on WS-517; the copy addressed to acct-82 was blocked at the gateway.',
        'acct-63 opened the message. A subsequent lookup for invoice-qr.example resolved to 203.0.113.88, followed by a TLS session to that IP with matching SNI.',
      ],
      unconfirmed: [
        'Endpoint process execution is not established by the existing formative case evidence.',
        'Credential entry, credential compromise, and successful payload execution are not established.',
      ],
      incidentChain: [
        { step: 'message_delivery', status: 'confirmed', recipientIds: ['acct-63'], evidence: 'M07-QR-014' },
        { step: 'recipient_open', status: 'confirmed', recipientIds: ['acct-63'], evidence: 'M07-QR-014' },
        { step: 'dns_resolution', status: 'confirmed', domain: 'invoice-qr.example', address: '203.0.113.88', evidence: 'M07-DNS-001' },
        { step: 'tls_connection', status: 'confirmed', address: '203.0.113.88', sni: 'invoice-qr.example', evidence: 'M07-TLS-001' },
        { step: 'endpoint_execution', status: 'unverified', evidence: null },
        { step: 'credential_compromise', status: 'unverified', evidence: null },
      ],
    },
  };

  return freeze({ schemaVersion: 1, scenario });
})();
