/* Independent Module 07 assessment identity and incident-chain truth contract. */
const SocM07AssessmentData = (() => {
  'use strict';

  function freeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(freeze);
    return value;
  }


  /* ------------------------------------------------------------------
   * Background mail / network / endpoint telemetry (SIEM console only).
   *
   * These rows are NOT part of the case-workspace arrays (messages,
   * deliveryEvents, networkEvents ...), so the Email and Network workspaces,
   * the recipient-scope exercise and the scorer keep their original,
   * answer-bearing contract. They are surfaced as extra console rows by the
   * Module 07 console adapter (soc-analyst-module-07.js).
   *
   * Native vs normalized fields (documented in the console sourceMappings):
   *   EmailEvents       native: gateway message trace (recipient, from, spf/dkim/dmarc,
   *                     delivery status) -> Account, Sender, Spf/Dkim/Dmarc, Result.
   *                     Native delivery status stays in Result (delivered / deferred /
   *                     quarantined_spam / blocked_at_gateway); retries share a
   *                     NetworkMessageId and differ by Attempt.
   *   EmailUrlEvents    native: URL-protection verdict log (delivery-time scan and
   *                     click-time verdict) -> Url, Verdict, Category.
   *   EmailAttachmentEvents native: attachment sandbox/AV verdicts -> FileName, Verdict.
   *   DnsEvents/TlsEvents/FirewallEvents/ProxyEvents: resolver text log, TLS JSON,
   *                     key=value firewall flows, proxy access log -> Domain, DestinationIp,
   *                     Url, Result (NXDOMAIN / allow / deny / HTTP status kept native).
   *   DeviceProcessEvents native: EDR process telemetry -> Image, CommandLine, ParentProcess.
   * Every row has a purpose (kept in `purpose`, never rendered as an answer label):
   *   background | hypothesis-test | alternate-explanation | tuning | scope-check |
   *   evidence-quality. `classification` is instructor-side only.
   * ------------------------------------------------------------------ */
  function buildBackground(w) {
    const events = [];
    const counters = {};
    const add = (table, tag, mmss, classification, purpose, fields) => {
      counters[tag] = (counters[tag] || 0) + 1;
      const id = `${w.p}-${tag}-${String(counters[tag]).padStart(3, '0')}`;
      events.push({ id, table, timestamp: `${w.day}T${w.hh}:${mmss}Z`, classification, purpose, fields });
      return id;
    };
    const BEN = 'benign_background';
    const msg = (key, subject, from, returnPath, replyTo, spf, dkim, dmarc) => ({ nmid: `${w.p}-NMID-${key}`, subject, from, returnPath, replyTo, spf, dkim, dmarc });
    const mailRow = (mmss, m, rcpt, type, result, cls, purpose, extra = {}) => add('EmailEvents', 'MAIL', mmss, cls, purpose, {
      EventType: type, Account: rcpt, Subject: m.subject, Sender: m.from, ReturnPath: m.returnPath, ReplyTo: m.replyTo,
      Spf: m.spf, Dkim: m.dkim, Dmarc: m.dmarc, Result: result, NetworkMessageId: m.nmid, Detail: `${m.subject} from ${m.from}`, ...extra,
    });
    const inter = (mmss, m, user, type, urlKey, purpose) => add('EmailInteractionEvents', 'INT', mmss, BEN, purpose, {
      EventType: type, Account: user.acct, Host: user.dev, DeviceId: user.dev, NetworkMessageId: m.nmid, UrlId: urlKey || '', Result: 'observed', Detail: `${type} on ${user.dev}`,
    });
    // Entity identity contract: EmailUrlEvents always carry the recipient Account. A click-time
    // verdict names the clicking user; a delivery-time scan (user = null) takes the first
    // recipient of the same NetworkMessageId from the EmailEvents rows authored above it.
    const urlRecipient = (m) => {
      const delivery = events.find((e) => e.table === 'EmailEvents' && e.fields.NetworkMessageId === m.nmid);
      if (!delivery) throw new Error(`M07 background: no EmailEvents recipient for ${m.nmid}`);
      return delivery.fields.Account;
    };
    const urlRow = (mmss, m, user, type, url, verdict, category, purpose) => add('EmailUrlEvents', 'URL', mmss, BEN, purpose, {
      EventType: type, Account: user ? user.acct : urlRecipient(m), Url: url, Verdict: verdict, Category: category, NetworkMessageId: m.nmid, Result: verdict, Detail: `${type}: ${url} -> ${verdict} (${category})`,
    });
    const attRow = (mmss, m, rcpt, fileName, purpose) => add('EmailAttachmentEvents', 'ATT', mmss, BEN, purpose, {
      EventType: 'attachment_scan', Account: rcpt, FileName: fileName, Verdict: 'clean', NetworkMessageId: m.nmid, Result: 'clean', Detail: `${fileName} scanned: clean`,
    });
    const dns = (mmss, user, domain, answers, result, purpose, extra = {}) => add('DnsEvents', 'DNS', mmss, BEN, purpose, {
      EventType: 'dns_query', Account: user.acct, Host: user.dev, DeviceId: user.dev, Domain: domain, Answers: answers, SourceIp: '', DestinationIp: '', DestinationPort: '', Url: '', Result: result,
      RelatedEventIds: [], Detail: `${domain} → ${answers}`, ...extra,
    });
    const tls = (mmss, user, ip, sni, cert, dnsId, purpose) => add('TlsEvents', 'TLS', mmss, BEN, purpose, {
      EventType: 'tls_session', Account: user.acct, Host: user.dev, DeviceId: user.dev, Domain: sni, Answers: '', SourceIp: '', DestinationIp: ip, DestinationPort: 443, Url: '', Result: 'observed',
      CertificateSha256: cert, RelatedEventIds: [dnsId], Detail: `${ip}:443`,
    });
    const fw = (mmss, user, srcIp, ip, port, action, tlsId, purpose, host) => add('FirewallEvents', 'FW', mmss, BEN, purpose, {
      EventType: 'firewall_flow', Account: user ? user.acct : '', Host: user ? user.dev : host, DeviceId: user ? user.dev : host, Domain: '', Answers: '', SourceIp: srcIp, DestinationIp: ip, DestinationPort: port, Url: '', Result: action,
      RelatedEventIds: tlsId ? [tlsId] : [], Detail: `${ip}:${port}`,
    });
    const proxy = (mmss, user, url, status, tlsId, purpose, extra = {}) => add('ProxyEvents', 'PRX', mmss, BEN, purpose, {
      EventType: 'proxy_request', Account: user.acct, Host: user.dev, DeviceId: user.dev, Domain: '', Answers: '', SourceIp: '', DestinationIp: '', DestinationPort: '', Url: url, Result: status,
      RelatedEventIds: tlsId ? [tlsId] : [], Detail: url, ...extra,
    });
    const proc = (mmss, user, image, cmd, parent, proxyId, purpose, extra = {}) => add('DeviceProcessEvents', 'PRC', mmss, BEN, purpose, {
      EventType: 'process_start', Account: user.acct, Host: user.dev, DeviceId: user.dev, Image: image, CommandLine: cmd, ParentProcess: parent,
      ProcessId: image.split('\\').pop(), ParentProcessId: parent, Result: 'success', RelatedEventIds: proxyId ? [proxyId] : [], Detail: cmd, ...extra,
    });

    const { victim, clicker, retry, noise, finance, lookalike, d } = w;

    // 1. Legitimate marketing newsletter: authenticated, many recipients, one click.
    //    Same open -> click -> DNS -> TLS -> proxy -> browser SHAPE as the incident, but
    //    SPF/DKIM/DMARC pass and aligned, destination is a known marketing service.
    const nl = msg('NL', d.nlSubject, `news@${d.nlMail}`, `bounce@${d.nlMail}`, `news@${d.nlMail}`, 'pass', 'pass', 'pass');
    [['01:10', clicker], ['01:11', retry], ['01:12', noise], ['01:13', victim], ['01:14', lookalike]].forEach(([t, u]) => mailRow(t, nl, u.acct, 'message_delivery', 'delivered', BEN, 'background: bulk marketing delivered to many recipients'));
    urlRow('01:20', nl, null, 'delivery_scan', `https://${d.nlTrack}/c/9a1`, 'clean', 'marketing', 'evidence-quality: URL protection scanned the bulk link before delivery');
    inter('03:15', nl, retry, 'open', '', 'background: newsletter opened, no click');
    inter('03:40', nl, clicker, 'open', '', 'hypothesis-test: opens alone are not compromise');
    inter('04:10', nl, noise, 'open', '', 'background: newsletter opened, no click');
    inter('09:20', nl, clicker, 'open_and_link_click', `${w.p}-URL-NL`, 'hypothesis-test: click on authenticated marketing link');
    urlRow('09:19', nl, clicker, 'click_time_verdict', `https://${d.nlTrack}/c/9a1`, 'allowed', 'marketing', 'evidence-quality: click-time verdict is a discriminator');
    const nlDns = dns('09:21', clicker, d.nlTrack, d.ipTrack, 'NOERROR', 'alternate-explanation: first-seen-style domain with benign mail context');
    const nlTls = tls('09:23', clicker, d.ipTrack, d.nlTrack, w.certs.a, nlDns, 'alternate-explanation: TLS to marketing tracker');
    fw('09:23', clicker, clicker.ip, d.ipTrack, 443, 'allow', nlTls, 'background: allowed flow');
    proxy('09:24', clicker, `https://${d.nlTrack}/c/9a1`, 302, nlTls, 'alternate-explanation: tracker redirect');
    const nlP2 = proxy('09:25', clicker, `https://${d.nlSite}/catalog`, 200, nlTls, 'alternate-explanation: redirect lands on the sender\'s own site');
    proc('09:26', clicker, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', `chrome.exe https://${d.nlSite}/catalog`, 'explorer.exe', nlP2, 'background: ordinary browser launch');

    // 2. Internal HR notice (aligned, internal sender) with an intranet link.
    const hr = msg('HR', d.hrSubject, `hr@${d.org}`, `bounce@${d.org}`, `hr@${d.org}`, 'pass', 'pass', 'pass');
    mailRow('04:30', hr, lookalike.acct, 'message_delivery', 'delivered', BEN, 'background: internal business mail');
    attRow('04:35', hr, lookalike.acct, 'enrollment-guide.pdf', 'evidence-quality: attachment verdict recorded');
    urlRow('04:36', hr, null, 'delivery_scan', `https://${d.intranet}/benefits`, 'clean', 'internal', 'evidence-quality: internal URL scan');
    inter('05:12', hr, lookalike, 'open_and_link_click', `${w.p}-URL-HR`, 'background: ordinary intranet click');
    const hrDns = dns('05:14', lookalike, d.intranet, d.ipIntranet, 'NOERROR', 'background: internal name resolution');
    fw('05:15', lookalike, lookalike.ip, d.ipIntranet, 443, 'allow', hrDns, 'background: internal allowed flow');
    proxy('05:16', lookalike, `https://${d.intranet}/benefits`, 200, hrDns, 'background: intranet page');

    // 3. Related-but-not-matching vendor: shares the brand token of the phishing sender
    //    but is authenticated/aligned and has a documented relationship.
    const vs = msg('VS', d.vsSubject, `accounts@${d.vendor}`, `bounce@${d.vendor}`, `accounts@${d.vendor}`, 'pass', 'pass', 'pass');
    mailRow('06:15', vs, lookalike.acct, 'message_delivery', 'delivered', BEN, 'alternate-explanation: similar-brand vendor sender, authentication aligned');
    attRow('06:20', vs, lookalike.acct, 'statement.pdf', 'evidence-quality: attachment verdict recorded');
    urlRow('06:21', vs, null, 'delivery_scan', `https://${d.vendorPortal}/statements`, 'clean', 'vendor-portal', 'evidence-quality: URL scan for vendor portal link');
    inter('12:30', vs, lookalike, 'open_and_link_click', `${w.p}-URL-VS`, 'hypothesis-test: click on similar-brand vendor link');
    urlRow('12:56', vs, lookalike, 'click_time_verdict', `https://${d.vendorPortal}/statements`, 'allowed', 'vendor-portal', 'evidence-quality: click-time verdict');
    const vsDns = dns('12:57', lookalike, d.vendorPortal, d.ipVendor, 'NOERROR', 'alternate-explanation: vendor domain, known business service');
    const vsTls = tls('12:59', lookalike, d.ipVendor, d.vendorPortal, w.certs.b, vsDns, 'alternate-explanation: vendor TLS');
    fw('12:59', lookalike, lookalike.ip, d.ipVendor, 443, 'allow', vsTls, 'background: allowed flow');
    const vsP = proxy('13:00', lookalike, `https://${d.vendorPortal}/statements`, 200, vsTls, 'alternate-explanation: vendor portal page');
    proc('13:02', lookalike, 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', `msedge.exe https://${d.vendorPortal}/statements`, 'explorer.exe', vsP, 'background: ordinary browser launch');

    // 4. Delivery retry: first attempt deferred (greylisting), retry delivered. Two rows, one message.
    const pc = msg('PC', d.pcSubject, `ship@${d.parcel}`, `bounce@${d.parcel}`, `ship@${d.parcel}`, 'pass', 'pass', 'pass');
    mailRow('05:02', pc, retry.acct, 'message_deferral', 'deferred', BEN, 'tuning: retries are one message, not repeated delivery', { Attempt: 1, Detail: `${pc.subject} from ${pc.from} (451 greylisted, retry later)` });
    mailRow('10:03', pc, retry.acct, 'message_delivery', 'delivered', BEN, 'tuning: retry succeeds', { Attempt: 2 });

    // 5. Third-party survey tool sending on behalf of HR: DMARC fail (misaligned) but delivered,
    //    never clicked, known vendor. Matches the DMARC alert query without being an incident.
    const sv = msg('SV', d.svSubject, `noreply@${d.survey}`, `bounce@send.${d.survey}`, `hr@${d.org}`, 'softfail', 'pass', 'fail');
    mailRow('07:40', sv, finance.acct, 'message_delivery', 'delivered', BEN, 'alternate-explanation: DMARC fail from an HR-sanctioned survey vendor, no interaction');
    urlRow('07:45', sv, null, 'delivery_scan', `https://${d.survey}/s/pulse`, 'clean', 'survey-vendor', 'evidence-quality: URL verdict clean, known vendor');

    // 6. Internal AP notification with an invoice-like subject (subject lookalike, aligned sender).
    const ap = msg('AP', d.apSubject, `ap-notify@${d.org}`, `bounce@${d.org}`, `ap-notify@${d.org}`, 'pass', 'pass', 'pass');
    mailRow('12:20', ap, finance.acct, 'message_delivery', 'delivered', BEN, 'alternate-explanation: legitimate invoice-themed internal mail');
    attRow('12:22', ap, finance.acct, 'invoice-20418.pdf', 'evidence-quality: attachment verdict recorded');
    urlRow('12:23', ap, null, 'delivery_scan', `https://${d.intranet}/ap/20418`, 'clean', 'internal', 'evidence-quality: internal URL scan');
    inter('13:05', ap, finance, 'open', '', 'background: opened, no link click');

    // 7. Spam quarantined at the gateway (DMARC fail, never delivered).
    const sp = msg('SP', d.spSubject, `promo@${d.spam}`, `bounce@${d.spam}`, `promo@${d.spam}`, 'fail', 'none', 'fail');
    mailRow('14:05', sp, noise.acct, 'message_quarantine', 'quarantined_spam', BEN, 'background: gateway spam handling (DMARC fail, not delivered)');

    // 8. Periodic software-update check (3 x ~6 min): beacon-like cadence, explained by a signed updater.
    ['02', '08', '14'].forEach((min) => {
      proc(`${min}:04`, retry, 'C:\\Program Files\\VendorSoft\\updater.exe', 'updater.exe --check', 'services.exe', null, 'tuning: periodic signed updater explains the cadence', { Signer: d.signer });
      const q = dns(`${min}:05`, retry, d.updater, d.ipUpdater, 'NOERROR', 'tuning: periodic lookups for a known update service');
      const t = tls(`${min}:07`, retry, d.ipUpdater, d.updater, w.certs.c, q, 'tuning: periodic TLS to update service');
      fw(`${min}:07`, retry, retry.ip, d.ipUpdater, 443, 'allow', t, 'tuning: allowed update flow');
      proxy(`${min}:08`, retry, `https://${d.updater}/v2/check`, 200, t, 'tuning: update check returns 200', { UserAgent: 'VendorUpdater/4.2' });
    });

    // 9. Resolver noise: NXDOMAIN retries for a proxy auto-config name.
    dns('02:00', noise, `wpad.${d.org}`, '', 'NXDOMAIN', 'background: failed auto-proxy discovery', { Detail: `wpad.${d.org} → NXDOMAIN` });
    dns('02:30', noise, `wpad.${d.org}`, '', 'NXDOMAIN', 'background: client retry of the same failed lookup', { Detail: `wpad.${d.org} → NXDOMAIN` });

    // 10. Internet background noise at the edge: blocked scans.
    fw('06:40', null, d.scanA, d.edge, 3389, 'deny', null, 'background: blocked internet scan', d.edgeHost);
    fw('15:12', null, d.scanB, d.edge, 22, 'deny', null, 'background: blocked internet scan', d.edgeHost);

    const accounts = [clicker, retry, noise, finance].map((u) => u.acct);
    const alerts = [
      { id: w.alerts.fsPhish, time: `${w.day}T${w.hh}:08:20Z`, severity: 'Medium', title: 'First-seen domain in web proxy', entities: [victim.dev], rule: 'Proxy: destination domain not seen in the previous 30 days', query: `ProxyEvents\n| where DeviceId == "${victim.dev}"` },
      { id: w.alerts.fsBenign, time: `${w.day}T${w.hh}:09:30Z`, severity: 'Medium', title: 'First-seen domain in web proxy', entities: [clicker.dev], rule: 'Proxy: destination domain not seen in the previous 30 days', query: `ProxyEvents\n| where DeviceId == "${clicker.dev}"` },
      { id: w.alerts.periodic, time: `${w.day}T${w.hh}:14:10Z`, severity: 'Low', title: 'Periodic outbound connections', entities: [retry.dev], rule: 'Network: three or more connections to one destination at near-regular intervals', query: `ProxyEvents\n| where DeviceId == "${retry.dev}"` },
      { id: w.alerts.deferral, time: `${w.day}T${w.hh}:10:05Z`, severity: 'Low', title: 'Repeated delivery attempts for one recipient', entities: [retry.acct], rule: 'Mail gateway: more than one delivery attempt for the same message', query: `EmailEvents\n| where Account == "${retry.acct}"` },
      { id: w.alerts.brand, time: `${w.day}T${w.hh}:06:20Z`, severity: 'Medium', title: 'Sender domain resembles the organisation brand', entities: [`accounts@${d.vendor}`], rule: 'Mail gateway: sender domain contains the brand token with a different registrable domain', query: `EmailEvents\n| where Sender contains "${w.brandToken}"` },
    ];
    const truth = {
      benignBackgroundEventIds: events.map((e) => e.id),
      alertDispositions: [
        { alertId: w.alerts.fsPhish, disposition: 'incident-related', hinge: 'Same rule as the benign first-seen alert; only correlation with a DMARC-failed delivered message, an open-and-click, and an unclassified destination separates them.' },
        { alertId: w.alerts.fsBenign, disposition: 'benign', hinge: 'Click follows an SPF/DKIM/DMARC-aligned newsletter, click-time verdict allowed, destination in IpIntel as a known marketing service.' },
        { alertId: w.alerts.periodic, disposition: 'benign', hinge: 'Cadence matches a signed updater process spawned by services.exe; proxy user agent and destination match.' },
        { alertId: w.alerts.deferral, disposition: 'benign', hinge: 'One deferral (greylisting) and one successful retry of the same NetworkMessageId.' },
        { alertId: w.alerts.brand, disposition: 'benign', hinge: 'Vendor sender passes SPF/DKIM/DMARC aligned; the incident sender (separate case rows) does not.' },
      ],
    };
    return { events, accounts, truth, alerts, ips: [
      { SourceIp: d.ipTrack, Type: 'External', Country: '—', Asn: 'Marketing platform', FirstSeen: '2025-03-11 08:00', Reputation: 'Known business service' },
      { SourceIp: d.ipVendor, Type: 'External', Country: '—', Asn: 'Vendor billing portal', FirstSeen: '2025-01-20 08:00', Reputation: 'Known business service' },
      { SourceIp: d.ipUpdater, Type: 'External', Country: '—', Asn: 'Software update service', FirstSeen: '2025-01-05 08:00', Reputation: 'Known business service' },
    ] };
  }

  const cert = (hex) => hex.repeat(32);
  const WORLD_ASSESSMENT = {
    p: 'M07-BG', day: '2026-09-27', hh: '10', brandToken: 'northwind-',
    victim: { acct: 'acct-63', dev: 'ws-517', ip: '192.0.2.57' },
    clicker: { acct: 'acct-41', dev: 'ws-311', ip: '192.0.2.41' },
    retry: { acct: 'acct-52', dev: 'ws-402', ip: '192.0.2.52' },
    noise: { acct: 'acct-70', dev: 'ws-118', ip: '192.0.2.70' },
    finance: { acct: 'acct-33', dev: 'ws-266', ip: '192.0.2.33' },
    lookalike: { acct: 'acct-17', dev: 'ws-204', ip: '192.0.2.84' },
    certs: { a: cert('d1'), b: cert('d2'), c: cert('d3') },
    alerts: { fsPhish: 'ALT-7102', fsBenign: 'ALT-7103', periodic: 'ALT-7104', deferral: 'ALT-7105', brand: 'ALT-7106' },
    d: {
      org: 'northwind.example', intranet: 'intranet.northwind.example', edge: '192.0.2.10', edgeHost: 'edge-fw-01', scanA: '203.0.113.150', scanB: '203.0.113.151',
      nlMail: 'mail.learnhub.example', nlTrack: 'track.learnhub.example', nlSite: 'www.learnhub.example', nlSubject: 'Course catalog: October sessions',
      hrSubject: 'Open enrollment reminder', vendor: 'northwind-supplies.example', vendorPortal: 'portal.northwind-supplies.example', vsSubject: 'Statement for September',
      parcel: 'parcel-track.example', pcSubject: 'Shipment notice: delivery update', survey: 'surveyflow.example', svSubject: 'Quick pulse survey: benefits',
      apSubject: 'Invoice 20418 posted for approval', spam: 'deals-bulk.example', spSubject: 'Limited offer: bulk toner',
      updater: 'updates.vendor-sw.example', signer: 'VendorSoft Ltd',
      ipTrack: '198.51.100.77', ipVendor: '198.51.100.130', ipUpdater: '198.51.100.200', ipIntranet: '198.51.100.40',
    },
  };
  // Independent Practice It world: different people, devices, domains, addresses, hour and EventIds.
  const WORLD_GUIDED = {
    p: 'M07-GL-BG', day: '2026-09-27', hh: '11', brandToken: 'paperless-',
    victim: { acct: 'acct-91', dev: 'ws-733', ip: '10.20.4.20' },
    clicker: { acct: 'acct-62', dev: 'ws-319', ip: '10.20.4.62' },
    retry: { acct: 'acct-74', dev: 'ws-421', ip: '10.20.4.74' },
    noise: { acct: 'acct-38', dev: 'ws-129', ip: '10.20.4.38' },
    finance: { acct: 'acct-46', dev: 'ws-277', ip: '10.20.4.46' },
    lookalike: { acct: 'acct-55', dev: 'ws-208', ip: '10.20.4.88' },
    certs: { a: cert('e1'), b: cert('e2'), c: cert('e3') },
    alerts: { fsPhish: 'ALT-7482', fsBenign: 'ALT-7483', periodic: 'ALT-7484', deferral: 'ALT-7485', brand: 'ALT-7486' },
    d: {
      org: 'harbor.example', intranet: 'intranet.harbor.example', edge: '10.20.0.10', edgeHost: 'perimeter-fw-02', scanA: '203.0.113.221', scanB: '203.0.113.222',
      nlMail: 'mail.skillbridge.example', nlTrack: 'track.skillbridge.example', nlSite: 'www.skillbridge.example', nlSubject: 'Workshop series: autumn schedule',
      hrSubject: 'Benefits window closes Friday', vendor: 'paperless-supply.example', vendorPortal: 'portal.paperless-supply.example', vsSubject: 'Account summary for September',
      parcel: 'shipnotify.example', pcSubject: 'Courier update: package routed', survey: 'pulsecheck.example', svSubject: 'Two-minute workplace survey',
      apSubject: 'Purchase order 7731 awaiting review', spam: 'bulk-offers.example', spSubject: 'Exclusive pricing on printer supplies',
      updater: 'cdn.softupdate.example', signer: 'SoftUpdate Inc',
      ipTrack: '198.51.100.171', ipVendor: '198.51.100.172', ipUpdater: '198.51.100.173', ipIntranet: '198.51.100.174',
    },
  };
  const BACKGROUND = buildBackground(WORLD_ASSESSMENT);

  const scenario = {
    id: 'M07-ASSESS-2026-09-27',
    stateKey: 'm07-network-email-assessment-v1',
    fixedAt: '2026-09-27T10:20:00Z',
    start: '2026-09-27T10:00:00Z',
    end: '2026-09-27T10:20:00Z',
    recipientGroups: [
      { id: 'M07-GROUP-DELIVERED', recipientIds: ['acct-63'], deviceIds: ['ws-517'], delivery: 'delivered' },
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
      { id: 'M07-QR-014', messageId: 'M07-MSG-001', recipientId: 'acct-63', deviceId: 'ws-517', type: 'open_and_link_click', timestamp: '2026-09-27T10:08:00Z', urlId: 'M07-URL-001' },
    ],
    networkEvents: [
      { id: 'M07-DNS-001', type: 'dns_query', timestamp: '2026-09-27T10:08:04Z', deviceId: 'ws-517', recipientId: 'acct-63', domain: 'invoice-qr.example', answers: ['203.0.113.88'], source: 'resolver-02', relatedRecipientEventId: 'M07-QR-014' },
      { id: 'M07-TLS-001', type: 'tls_session', timestamp: '2026-09-27T10:08:07Z', deviceId: 'ws-517', recipientId: 'acct-63', destinationIp: '203.0.113.88', destinationPort: 443, sni: 'invoice-qr.example', certificateSha256: 'b'.repeat(64), relatedDnsEventId: 'M07-DNS-001', relatedRecipientEventId: 'M07-QR-014' },
      { id: 'M07-FW-001', type: 'firewall_flow', timestamp: '2026-09-27T10:08:08Z', deviceId: 'ws-517', recipientId: 'acct-63', sourceIp: '192.0.2.57', destinationIp: '203.0.113.88', destinationPort: 443, action: 'allow', relatedTlsEventId: 'M07-TLS-001' },
      { id: 'M07-PROXY-001', type: 'proxy_request', timestamp: '2026-09-27T10:08:09Z', deviceId: 'ws-517', recipientId: 'acct-63', method: 'GET', url: 'https://invoice-qr.example/invoice/7f3a', status: 200, relatedTlsEventId: 'M07-TLS-001', relatedRecipientEventId: 'M07-QR-014' },
      { id: 'M07-DNS-002', type: 'dns_query', timestamp: '2026-09-27T10:11:00Z', deviceId: 'ws-204', recipientId: 'acct-17', domain: 'payroll.northwind.example', answers: ['198.51.100.24'], source: 'resolver-02', relatedRecipientEventId: null, benignLookalike: true },
      { id: 'M07-TLS-002', type: 'tls_session', timestamp: '2026-09-27T10:11:03Z', deviceId: 'ws-204', recipientId: 'acct-17', destinationIp: '198.51.100.24', destinationPort: 443, sni: 'payroll.northwind.example', certificateSha256: 'c'.repeat(64), relatedDnsEventId: 'M07-DNS-002', relatedRecipientEventId: null, benignLookalike: true },
      { id: 'M07-FW-002', type: 'firewall_flow', timestamp: '2026-09-27T10:11:04Z', deviceId: 'ws-204', recipientId: 'acct-17', sourceIp: '192.0.2.84', destinationIp: '198.51.100.24', destinationPort: 443, action: 'allow', relatedTlsEventId: 'M07-TLS-002', benignLookalike: true },
      { id: 'M07-PROXY-002', type: 'proxy_request', timestamp: '2026-09-27T10:11:05Z', deviceId: 'ws-204', recipientId: 'acct-17', method: 'GET', url: 'https://payroll.northwind.example/portal', status: 200, relatedTlsEventId: 'M07-TLS-002', relatedRecipientEventId: null, benignLookalike: true },
    ],
    packetSamples: [
      { eventId: 'M07-DNS-001', summary: 'Synthetic DNS query and response', capturedBytes: 84, protocol: 'DNS', sampleHex: '12 34 01 00 00 01 00 01 00 00 00 00', sampleText: 'invoice-qr.example -> 203.0.113.88' },
      { eventId: 'M07-TLS-001', summary: 'Synthetic TLS client hello metadata', capturedBytes: 128, protocol: 'TLS', sampleHex: '16 03 01 00 2f 01 00 00 2b 03 03 5a', sampleText: 'SNI: invoice-qr.example; destination port: 443' },
      { eventId: 'M07-PROXY-001', summary: 'Synthetic HTTP request metadata; payload omitted', capturedBytes: 96, protocol: 'HTTP', sampleHex: '47 45 54 20 2f 69 6e 76 6f 69 63 65', sampleText: 'GET /invoice/7f3a; payload not included' },
    ],
    endpointProcessEvents: [
      { id: 'M07-PROC-001', type: 'process_start', timestamp: '2026-09-27T10:08:11Z', deviceId: 'ws-517', recipientId: 'acct-63', processName: 'chrome.exe', imagePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', commandLine: 'chrome.exe https://invoice-qr.example/invoice/7f3a', parentProcessName: 'explorer.exe', relatedProxyEventId: 'M07-PROXY-001', classification: 'browser_activity', establishesPayloadExecution: false },
      { id: 'M07-PROC-002', type: 'process_start', timestamp: '2026-09-27T10:11:06Z', deviceId: 'ws-204', recipientId: 'acct-17', processName: 'msedge.exe', imagePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', commandLine: 'msedge.exe https://payroll.northwind.example/portal', parentProcessName: 'explorer.exe', relatedProxyEventId: 'M07-PROXY-002', classification: 'benign_lookalike_browser_activity', establishesPayloadExecution: false },
    ],
    backgroundEvents: BACKGROUND.events,
    backgroundContext: { accounts: BACKGROUND.accounts, ips: BACKGROUND.ips, alerts: BACKGROUND.alerts },
    expectedTruth: {
      benignBackgroundEventIds: BACKGROUND.truth.benignBackgroundEventIds,
      alertDispositions: BACKGROUND.truth.alertDispositions,
      confirmed: [
        'The QR-invoice message was delivered to acct-63 on ws-517; the copy addressed to acct-82 was blocked at the gateway.',
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

  return freeze({ schemaVersion: 1, scenario, buildBackground, guidedBackgroundWorld: WORLD_GUIDED });
})();
