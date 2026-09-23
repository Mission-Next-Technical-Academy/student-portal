// ============================================================
//  Vulnerability Management Track — Scanner Shells
// ============================================================
//  Owner: Agent 06.  Specs: BUILD_PLAN.md §1.4.6.
//
//  Shells defined here:
//    OpenVASLabShell   — Greenbone GSA chrome (dark green)
//    NessusLabShell    — Tenable Nessus blue chrome
//    QualysLabShell    — Qualys VMDR red chrome + donuts
//    ZAPLabShell       — OWASP ZAP three-pane chrome
//    WSUSLabShell      — Update Services MMC chrome
//
//  Every shell honours the standard LabPlayer prop contract:
//    { vfs, initialCwd, user, host, onCommand, autoFocus }
//  and reports user actions via onCommand(synthLine, result, env).
//  The lab modules in vuln-management.labs.js validate against
//  those synthLine strings using regex acceptedInputs.
//
//  synthLine conventions (stable contract):
//    cli:<bash command>       — install / setup commands typed in
//                                an embedded terminal
//    nav:<url>                — browser navigation inside the shell
//    auth:<verb>[ args]       — login / activation flows
//    ui:<area>.<verb>[ args]  — UI interaction events
//
//  Each shell is internally state-driven.  Multi-phase shells
//  (install → setup → product) flip phases when their state
//  reaches the threshold the upstream lab demands.
// ============================================================

(function () {
  // ─────────────────────────────────────────────────────────────────
  //  Synthetic finding catalogues — referenced by individual shells.
  //  All IPs are RFC 5737 / RFC 1918, all CVEs are real-format,
  //  all hosts are §1.12 cast.  Plugin/QID/OID/KB IDs are real-format.
  // ─────────────────────────────────────────────────────────────────

  const NESSUS_FINDINGS = [
    { plugin: 19506,  severity: 'Info',     name: 'Nessus Scan Information',                       cve: null,             host: '10.10.24.21' },
    { plugin: 11936,  severity: 'Info',     name: 'OS Identification',                             cve: null,             host: '10.10.24.21' },
    { plugin: 10287,  severity: 'Info',     name: 'Traceroute Information',                        cve: null,             host: '10.10.24.21' },
    { plugin: 10107,  severity: 'Info',     name: 'HTTP Server Type and Version',                  cve: null,             host: 'WEB-01.corp.example.local' },
    { plugin: 25220,  severity: 'Info',     name: 'TCP/IP Timestamps Supported',                   cve: null,             host: 'APP-DB-02.corp.example.local' },
    { plugin: 51192,  severity: 'Medium',   name: 'SSL Certificate Cannot Be Trusted',             cve: 'CVE-2018-0732',   host: 'WEB-01.corp.example.local' },
    { plugin: 57582,  severity: 'Medium',   name: 'SSL Self-Signed Certificate',                   cve: null,             host: 'WEB-01.corp.example.local' },
    { plugin: 35291,  severity: 'Medium',   name: 'SSL Certificate Signed Using Weak Hashing Algorithm', cve: 'CVE-2004-2761', host: 'WEB-01.corp.example.local' },
    { plugin: 42873,  severity: 'Medium',   name: 'SSL Medium Strength Cipher Suites Supported (SWEET32)', cve: 'CVE-2016-2183', host: 'WEB-01.corp.example.local' },
    { plugin: 26928,  severity: 'High',     name: 'SSL Weak Cipher Suites Supported',              cve: 'CVE-2013-2566',   host: 'WEB-01.corp.example.local' },
    { plugin: 65821,  severity: 'Medium',   name: 'SSL RC4 Cipher Suites Supported (Bar Mitzvah)', cve: 'CVE-2013-2566',   host: 'WEB-01.corp.example.local' },
    { plugin: 78479,  severity: 'High',     name: 'SSLv3 Padding Oracle (POODLE)',                 cve: 'CVE-2014-3566',   host: 'WEB-01.corp.example.local' },
    { plugin: 73412,  severity: 'Critical', name: 'OpenSSL Heartbleed Information Disclosure',     cve: 'CVE-2014-0160',   host: 'APP-DB-02.corp.example.local' },
    { plugin: 97737,  severity: 'Critical', name: 'Microsoft Windows SMBv1 EternalBlue (MS17-010)', cve: 'CVE-2017-0144', host: 'FILE-01.corp.example.local' },
    { plugin: 11154,  severity: 'Medium',   name: 'Unknown Service Detection: Banner Retrieval',   cve: null,             host: 'APP-DB-02.corp.example.local' },
    { plugin: 70658,  severity: 'Medium',   name: 'SSH Server CBC Mode Ciphers Enabled',           cve: 'CVE-2008-5161',   host: 'APP-DB-02.corp.example.local' },
    { plugin: 20007,  severity: 'High',     name: 'SSL Version 2 and 3 Protocol Detection',        cve: 'CVE-2011-3389',   host: 'WEB-01.corp.example.local' },
    { plugin: 33850,  severity: 'Medium',   name: 'Unsupported Unix Operating System',             cve: null,             host: 'APP-DB-02.corp.example.local' },
    { plugin: 91572,  severity: 'High',     name: 'Microsoft Windows RDP MITM',                    cve: 'CVE-2005-1794',   host: 'WKSTN-15.corp.example.local' },
    { plugin: 90510,  severity: 'Critical', name: 'MS16-047 SAM and LSAD (Badlock)',               cve: 'CVE-2016-0128',   host: 'WKSTN-15.corp.example.local' },
    { plugin: 50686,  severity: 'Low',      name: 'IP Forwarding Enabled',                         cve: null,             host: 'APP-DB-02.corp.example.local' },
    { plugin: 22964,  severity: 'Info',     name: 'Service Detection',                             cve: null,             host: '10.10.24.21' },
    { plugin: 19592,  severity: 'Medium',   name: 'Telnet Server Detection',                       cve: null,             host: '10.10.24.21' },
    { plugin: 10882,  severity: 'Medium',   name: 'SSH Protocol Version 1 Session Key Retrieval',  cve: 'CVE-2001-0572',   host: 'APP-DB-02.corp.example.local' },
    { plugin: 89058,  severity: 'High',     name: 'SSL DROWN Attack Vulnerability',                cve: 'CVE-2016-0800',   host: 'WEB-01.corp.example.local' },
    { plugin: 58751,  severity: 'Critical', name: 'Apache HTTP Server <= 2.4.49 Path Traversal',   cve: 'CVE-2021-41773',  host: 'WEB-01.corp.example.local' },
    { plugin: 138454, severity: 'High',     name: 'Microsoft Exchange ProxyShell Auth Bypass',     cve: 'CVE-2021-34473',  host: 'FILE-01.corp.example.local' },
    { plugin: 156032, severity: 'Critical', name: 'Apache Log4j Remote Code Execution (Log4Shell)', cve: 'CVE-2021-44228', host: 'APP-DB-02.corp.example.local' },
    { plugin: 161948, severity: 'High',     name: 'OpenSSL 3.0.x < 3.0.7 Multiple Vulnerabilities', cve: 'CVE-2022-3786',  host: 'WEB-01.corp.example.local' },
    { plugin: 59275,  severity: 'High',     name: 'PHP < 7.4.30 Multiple Vulnerabilities',         cve: 'CVE-2022-31625',  host: 'WEB-01.corp.example.local' },
  ];

  const OPENVAS_FINDINGS = [
    { oid: '1.3.6.1.4.1.25623.1.0.103674', severity: 'High',     cvss: 7.5, name: 'Apache HTTP Server Path Traversal',          cve: 'CVE-2021-41773',  host: 'WEB-01.corp.example.local' },
    { oid: '1.3.6.1.4.1.25623.1.0.117794', severity: 'Critical', cvss: 9.8, name: 'Apache Log4j Remote Code Execution (Log4Shell)', cve: 'CVE-2021-44228', host: 'APP-DB-02.corp.example.local' },
    { oid: '1.3.6.1.4.1.25623.1.0.105637', severity: 'Critical', cvss: 9.3, name: 'Microsoft Windows SMBv1 EternalBlue',          cve: 'CVE-2017-0144',  host: 'FILE-01.corp.example.local' },
    { oid: '1.3.6.1.4.1.25623.1.0.105187', severity: 'High',     cvss: 7.5, name: 'OpenSSL Heartbleed Information Disclosure',   cve: 'CVE-2014-0160',  host: 'APP-DB-02.corp.example.local' },
    { oid: '1.3.6.1.4.1.25623.1.0.108030', severity: 'High',     cvss: 7.4, name: 'OpenSSH < 7.7 User Enumeration',              cve: 'CVE-2018-15473', host: 'APP-DB-02.corp.example.local' },
    { oid: '1.3.6.1.4.1.25623.1.0.105328', severity: 'Medium',   cvss: 5.9, name: 'SSL/TLS: SSLv3 POODLE',                       cve: 'CVE-2014-3566',  host: 'WEB-01.corp.example.local' },
    { oid: '1.3.6.1.4.1.25623.1.0.103440', severity: 'Medium',   cvss: 5.9, name: 'SSL/TLS: Weak Cipher Suites Supported',       cve: 'CVE-2013-2566',  host: 'WEB-01.corp.example.local' },
    { oid: '1.3.6.1.4.1.25623.1.0.103781', severity: 'Medium',   cvss: 5.0, name: 'SSL/TLS: Self-Signed Certificate',            cve: null,             host: 'WEB-01.corp.example.local' },
    { oid: '1.3.6.1.4.1.25623.1.0.802067', severity: 'Medium',   cvss: 5.0, name: 'SSH Server CBC Mode Ciphers Enabled',         cve: 'CVE-2008-5161',  host: 'APP-DB-02.corp.example.local' },
    { oid: '1.3.6.1.4.1.25623.1.0.108280', severity: 'Medium',   cvss: 5.5, name: 'Apache HTTPD: mod_rewrite Information Disclosure', cve: 'CVE-2019-10092', host: 'WEB-01.corp.example.local' },
    { oid: '1.3.6.1.4.1.25623.1.0.103672', severity: 'Low',      cvss: 3.7, name: 'TCP timestamps',                              cve: null,             host: 'APP-DB-02.corp.example.local' },
    { oid: '1.3.6.1.4.1.25623.1.0.108560', severity: 'Low',      cvss: 3.1, name: 'IP Forwarding Enabled',                       cve: null,             host: 'APP-DB-02.corp.example.local' },
    { oid: '1.3.6.1.4.1.25623.1.0.117310', severity: 'High',     cvss: 7.5, name: 'Microsoft Windows RDP MITM',                  cve: 'CVE-2005-1794',  host: 'WKSTN-15.corp.example.local' },
    { oid: '1.3.6.1.4.1.25623.1.0.106203', severity: 'Critical', cvss: 9.0, name: 'Microsoft Badlock SAM/LSAD',                  cve: 'CVE-2016-0128',  host: 'WKSTN-15.corp.example.local' },
    { oid: '1.3.6.1.4.1.25623.1.0.108950', severity: 'Medium',   cvss: 5.0, name: 'Telnet Service Detected',                     cve: null,             host: '10.10.24.21' },
    { oid: '1.3.6.1.4.1.25623.1.0.103956', severity: 'Info',     cvss: 0.0, name: 'OS Detection (TCP/IP Fingerprinting)',         cve: null,             host: '10.10.24.21' },
    { oid: '1.3.6.1.4.1.25623.1.0.111038', severity: 'Info',     cvss: 0.0, name: 'Service Detection',                            cve: null,             host: '10.10.24.21' },
    { oid: '1.3.6.1.4.1.25623.1.0.117540', severity: 'High',     cvss: 7.4, name: 'Microsoft Exchange ProxyShell Auth Bypass',   cve: 'CVE-2021-34473', host: 'FILE-01.corp.example.local' },
    { oid: '1.3.6.1.4.1.25623.1.0.118160', severity: 'High',     cvss: 7.5, name: 'OpenSSL 3.0.x < 3.0.7 Buffer Overflow',       cve: 'CVE-2022-3786',  host: 'WEB-01.corp.example.local' },
    { oid: '1.3.6.1.4.1.25623.1.0.114239', severity: 'Medium',   cvss: 6.5, name: 'PostgreSQL Default Credentials Detection',    cve: null,             host: 'APP-DB-02.corp.example.local' },
    { oid: '1.3.6.1.4.1.25623.1.0.114987', severity: 'Medium',   cvss: 5.4, name: 'HTTP Server: Missing X-Frame-Options',        cve: null,             host: 'WEB-01.corp.example.local' },
    { oid: '1.3.6.1.4.1.25623.1.0.114988', severity: 'Medium',   cvss: 5.4, name: 'HTTP Server: Missing Strict-Transport-Security', cve: null,         host: 'WEB-01.corp.example.local' },
    { oid: '1.3.6.1.4.1.25623.1.0.108761', severity: 'Low',      cvss: 2.6, name: 'ICMP Timestamp Reply',                        cve: null,             host: 'APP-DB-02.corp.example.local' },
    { oid: '1.3.6.1.4.1.25623.1.0.108762', severity: 'Info',     cvss: 0.0, name: 'Traceroute',                                  cve: null,             host: 'APP-DB-02.corp.example.local' },
    { oid: '1.3.6.1.4.1.25623.1.0.103692', severity: 'High',     cvss: 7.4, name: 'PHP < 7.4.30 Multiple Vulnerabilities',       cve: 'CVE-2022-31625', host: 'WEB-01.corp.example.local' },
    { oid: '1.3.6.1.4.1.25623.1.0.108290', severity: 'Medium',   cvss: 6.1, name: 'HTTP Server: Reflected XSS Parameter',         cve: null,             host: 'WEB-01.corp.example.local' },
    { oid: '1.3.6.1.4.1.25623.1.0.105200', severity: 'Critical', cvss: 9.8, name: 'BlueKeep RDP Pre-auth Remote Code Execution', cve: 'CVE-2019-0708',  host: 'WKSTN-15.corp.example.local' },
    { oid: '1.3.6.1.4.1.25623.1.0.117793', severity: 'High',     cvss: 8.1, name: 'Spring4Shell Spring Framework RCE',           cve: 'CVE-2022-22965', host: 'APP-DB-02.corp.example.local' },
    { oid: '1.3.6.1.4.1.25623.1.0.118271', severity: 'Medium',   cvss: 4.3, name: 'Anonymous SMB Share Listing',                  cve: null,             host: 'FILE-01.corp.example.local' },
    { oid: '1.3.6.1.4.1.25623.1.0.108991', severity: 'Medium',   cvss: 5.3, name: 'NTP Mode 6 Query Vulnerability',              cve: 'CVE-2014-9293',  host: 'APP-DB-02.corp.example.local' },
  ];

  const QUALYS_FINDINGS = [
    { qid: 38601,  severity: 4, name: 'TLS/SSL Server Supports Weak Cipher Suites',             cve: 'CVE-2013-2566',  host: 'WEB-01.corp.example.local' },
    { qid: 38138,  severity: 4, name: 'SSL/TLS Server supports SSLv3 (POODLE)',                 cve: 'CVE-2014-3566',  host: 'WEB-01.corp.example.local' },
    { qid: 38628,  severity: 4, name: 'OpenSSL Heartbleed Information Disclosure',              cve: 'CVE-2014-0160',  host: 'APP-DB-02.corp.example.local' },
    { qid: 91345,  severity: 5, name: 'Microsoft Windows SMBv1 EternalBlue (MS17-010)',         cve: 'CVE-2017-0144',  host: 'FILE-01.corp.example.local' },
    { qid: 91787,  severity: 5, name: 'Microsoft Windows BlueKeep RDP Pre-auth RCE',            cve: 'CVE-2019-0708',  host: 'WKSTN-15.corp.example.local' },
    { qid: 87067,  severity: 5, name: 'Apache Log4j Remote Code Execution (Log4Shell)',         cve: 'CVE-2021-44228', host: 'APP-DB-02.corp.example.local' },
    { qid: 87063,  severity: 4, name: 'Apache HTTP Server <= 2.4.49 Path Traversal',            cve: 'CVE-2021-41773', host: 'WEB-01.corp.example.local' },
    { qid: 86000,  severity: 3, name: 'Apache HTTP Server Information Disclosure',              cve: 'CVE-2019-10092', host: 'WEB-01.corp.example.local' },
    { qid: 90043,  severity: 3, name: 'Microsoft GPP Password Disclosure',                      cve: 'CVE-2014-1812',  host: 'WKSTN-15.corp.example.local' },
    { qid: 38141,  severity: 3, name: 'SSL/TLS Server Supports RC4 Ciphers (Bar Mitzvah)',      cve: 'CVE-2013-2566',  host: 'WEB-01.corp.example.local' },
    { qid: 38142,  severity: 3, name: 'SSL Self-Signed Certificate',                             cve: null,             host: 'WEB-01.corp.example.local' },
    { qid: 78032,  severity: 4, name: 'OpenSSH < 7.7 Username Enumeration',                     cve: 'CVE-2018-15473', host: 'APP-DB-02.corp.example.local' },
    { qid: 38172,  severity: 3, name: 'SSL Certificate Signed With Weak Hashing Algorithm',     cve: 'CVE-2004-2761',  host: 'WEB-01.corp.example.local' },
    { qid: 105945, severity: 5, name: 'Microsoft Exchange ProxyShell Auth Bypass',              cve: 'CVE-2021-34473', host: 'FILE-01.corp.example.local' },
    { qid: 38881,  severity: 4, name: 'OpenSSL 3.0.x < 3.0.7 Buffer Overflow',                  cve: 'CVE-2022-3786',  host: 'WEB-01.corp.example.local' },
    { qid: 38794,  severity: 3, name: 'NTP Mode 6 Query Vulnerability',                          cve: 'CVE-2014-9293',  host: 'APP-DB-02.corp.example.local' },
    { qid: 38291,  severity: 2, name: 'TCP Timestamps Information Disclosure',                   cve: null,             host: 'APP-DB-02.corp.example.local' },
    { qid: 86001,  severity: 2, name: 'HTTP Server: Missing X-Frame-Options Header',            cve: null,             host: 'WEB-01.corp.example.local' },
    { qid: 86002,  severity: 2, name: 'HTTP Server: Missing Strict-Transport-Security',          cve: null,             host: 'WEB-01.corp.example.local' },
    { qid: 38670,  severity: 1, name: 'ICMP Timestamp Request',                                  cve: null,             host: 'APP-DB-02.corp.example.local' },
  ];

  const ZAP_ALERTS = [
    { id: 40012, risk: 'High',          confidence: 'High',     name: 'Cross Site Scripting (Reflected)',           url: 'https://app.example.local/search?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E', param: 'q',       cwe: 79,    wasc: 8,  evidence: '<script>alert(1)</script>' },
    { id: 40018, risk: 'High',          confidence: 'Medium',   name: 'SQL Injection',                              url: "https://app.example.local/products?id=1'",                                param: 'id',      cwe: 89,    wasc: 19, evidence: 'You have an error in your SQL syntax' },
    { id: 90019, risk: 'High',          confidence: 'Medium',   name: 'Server Side Code Injection',                 url: 'https://app.example.local/preview',                                       param: 'tpl',     cwe: 94,    wasc: 20, evidence: '${7*7}=49' },
    { id: 10202, risk: 'Medium',        confidence: 'Medium',   name: 'Absence of Anti-CSRF Tokens',                url: 'https://app.example.local/account/update',                                param: '',        cwe: 352,   wasc: 9,  evidence: '' },
    { id: 10038, risk: 'Medium',        confidence: 'Medium',   name: 'Content Security Policy (CSP) Header Not Set', url: 'https://app.example.local/',                                            param: '',        cwe: 693,   wasc: 15, evidence: '' },
    { id: 10020, risk: 'Medium',        confidence: 'Medium',   name: 'X-Frame-Options Header Not Set',             url: 'https://app.example.local/',                                              param: '',        cwe: 1021,  wasc: 15, evidence: '' },
    { id: 10035, risk: 'Medium',        confidence: 'High',     name: 'Strict-Transport-Security Header Not Set',   url: 'https://app.example.local/',                                              param: '',        cwe: 319,   wasc: 15, evidence: '' },
    { id: 10021, risk: 'Low',           confidence: 'Medium',   name: 'X-Content-Type-Options Header Missing',      url: 'https://app.example.local/static/app.js',                                 param: '',        cwe: 693,   wasc: 15, evidence: '' },
    { id: 10027, risk: 'Low',           confidence: 'Low',      name: 'Information Disclosure - Suspicious Comments', url: 'https://app.example.local/static/app.js',                              param: '',        cwe: 200,   wasc: 13, evidence: '// TODO: remove debug' },
    { id: 10049, risk: 'Low',           confidence: 'Medium',   name: 'Storable and Cacheable Content',             url: 'https://app.example.local/account',                                       param: '',        cwe: 524,   wasc: 13, evidence: 'Cache-Control: public' },
    { id: 10094, risk: 'Informational', confidence: 'Low',      name: 'Modern Web Application',                     url: 'https://app.example.local/',                                              param: '',        cwe: -1,    wasc: -1, evidence: 'react' },
  ];

  const WSUS_UPDATES = [
    { kb: 'KB5034441', cls: 'Security Updates',   product: 'Windows 10, version 22H2',    severity: 'Critical',  released: '2026-01-09', title: '2026-01 Cumulative Update for Windows 10, version 22H2 (KB5034441)' },
    { kb: 'KB5034122', cls: 'Security Updates',   product: 'Windows Server 2022',          severity: 'Critical',  released: '2026-01-09', title: '2026-01 Cumulative Update for Windows Server 2022 (KB5034122)' },
    { kb: 'KB5036896', cls: 'Security Updates',   product: 'Windows 11',                    severity: 'Critical',  released: '2026-02-13', title: '2026-02 Cumulative Update for Windows 11 (KB5036896)' },
    { kb: 'KB5037853', cls: 'Security Updates',   product: 'Windows Server 2019',          severity: 'Important', released: '2026-03-12', title: '2026-03 Security Monthly Quality Rollup (KB5037853)' },
    { kb: 'KB5037771', cls: 'Critical Updates',   product: 'Windows 10, version 22H2',     severity: 'Important', released: '2026-03-12', title: '2026-03 Servicing Stack Update (KB5037771)' },
    { kb: 'KB5034771', cls: 'Definition Updates', product: 'Microsoft Defender Antivirus', severity: 'Critical',  released: '2026-04-21', title: 'Security Intelligence Update for Microsoft Defender (KB5034771)' },
    { kb: 'KB5040430', cls: 'Security Updates',   product: 'Windows 10, version 22H2',     severity: 'Critical',  released: '2026-04-09', title: '2026-04 Cumulative Update for Windows 10 (KB5040430)' },
    { kb: 'KB5040435', cls: 'Security Updates',   product: 'Windows 11',                    severity: 'Critical',  released: '2026-04-09', title: '2026-04 Cumulative Update for Windows 11 (KB5040435)' },
    { kb: 'KB5039217', cls: 'Security Updates',   product: 'Windows Server 2022',          severity: 'Important', released: '2026-04-09', title: '2026-04 Security-Only Quality Update for Server 2022 (KB5039217)' },
    { kb: 'KB890830',  cls: 'Update Rollups',     product: 'Windows Malicious Software Removal Tool', severity: 'Important', released: '2026-04-09', title: 'Windows Malicious Software Removal Tool x64 (KB890830)' },
  ];

  const SEVERITY_TINT = {
    Critical:      '#CC0000',
    High:          '#FF8C00',
    Medium:        '#FFD700',
    Low:           '#3399CC',
    Info:          '#999999',
    Informational: '#999999',
  };

  // ─────────────────────────────────────────────────────────────────
  //  Shared mini-components
  // ─────────────────────────────────────────────────────────────────

  // Mini terminal that emits cli:* events.  Used during install phases.
  function InstallConsole({ onLine, prompt = 'student@b2b:~$', placeholder = 'paste install commands…', greeting }) {
    const [lines, setLines] = React.useState(() => greeting ? [{ kind: 'stdout', text: greeting }] : []);
    const [draft, setDraft] = React.useState('');
    const inputRef = React.useRef(null);
    const scrollRef = React.useRef(null);

    React.useEffect(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [lines]);

    function submit() {
      const cmd = draft.trim();
      if (!cmd) return;
      setLines(prev => prev.concat([{ kind: 'prompt', text: `${prompt} ${cmd}` }]));
      setDraft('');
      const reply = (typeof onLine === 'function' ? onLine(cmd) : null) || {};
      const next = [];
      if (reply.stdout) next.push({ kind: 'stdout', text: reply.stdout });
      if (reply.stderr) next.push({ kind: 'stderr', text: reply.stderr });
      if (next.length) setLines(prev => prev.concat(next));
    }

    return (
      <div style={icStyles.root} onClick={() => inputRef.current && inputRef.current.focus()}>
        <div ref={scrollRef} style={icStyles.scroll}>
          {lines.map((l, i) => (
            <div key={i} style={l.kind === 'stderr' ? icStyles.lineErr : icStyles.line}>{l.text}</div>
          ))}
          <div style={icStyles.row}>
            <span style={icStyles.prompt}>{prompt} </span>
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
              placeholder={placeholder}
              style={icStyles.input}
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </div>
      </div>
    );
  }

  const icStyles = {
    root: { background: '#0b0d10', color: '#d6d6d6', fontFamily: "'Space Mono',monospace", fontSize: 12, padding: '10px 12px', minHeight: 240, maxHeight: 280, overflow: 'hidden', cursor: 'text', borderRadius: 4 },
    scroll: { width: '100%', height: '100%', maxHeight: 260, overflow: 'auto', whiteSpace: 'pre-wrap' },
    line: { whiteSpace: 'pre-wrap' },
    lineErr: { whiteSpace: 'pre-wrap', color: '#fca5a5' },
    row: { display: 'flex', alignItems: 'center' },
    prompt: { color: '#22c55e', whiteSpace: 'pre' },
    input: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#d6d6d6', fontFamily: "'Space Mono',monospace", fontSize: 12 },
  };

  function SeverityBadge({ level }) {
    const tint = SEVERITY_TINT[level] || '#999';
    const dark = level === 'Medium';
    return (
      <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 2, background: tint, color: dark ? '#000' : '#fff', fontSize: 10, fontFamily: "'Inter',sans-serif", fontWeight: 600, letterSpacing: 0.4 }}>
        {level}
      </span>
    );
  }

  function emit(props, line, payload) {
    if (typeof props.onCommand === 'function') {
      props.onCommand(line, payload || {}, { phase: payload && payload.phase });
    }
  }

  function sevRank(s) { return { Critical: 5, High: 4, Medium: 3, Low: 2, Info: 1 }[s] || 0; }
  function countSev(arr) {
    return arr.reduce((acc, f) => { acc[f.severity] = (acc[f.severity] || 0) + 1; return acc; }, { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0 });
  }
  function countQualys(arr) {
    return arr.reduce((acc, f) => { acc[f.severity] = (acc[f.severity] || 0) + 1; return acc; }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  }

  // ─── Shared modal primitives (each shell themes the header). ───
  function Modal({ onCancel, title, accent = '#0d6240', children }) {
    return (
      <div style={modalStyles.scrim}>
        <div style={modalStyles.box}>
          <div style={{ ...modalStyles.head, background: accent }}>{title}</div>
          <div style={modalStyles.body}>{children}</div>
        </div>
      </div>
    );
  }
  function ModalActions({ onCancel, onSave, accent = '#0d6240', saveLabel = 'Save' }) {
    return (
      <div style={modalStyles.actions}>
        <button onClick={onCancel} style={modalStyles.cancel}>Cancel</button>
        <button onClick={onSave} style={{ ...modalStyles.save, background: accent }}>{saveLabel}</button>
      </div>
    );
  }
  function Field({ label, children }) {
    return (
      <label style={modalStyles.field}>
        <span style={modalStyles.fieldLabel}>{label}</span>
        {children}
      </label>
    );
  }
  const modalStyles = {
    scrim: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30 },
    box: { background: '#fff', minWidth: 360, maxWidth: 420, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', overflow: 'hidden' },
    head: { color: '#fff', padding: '8px 14px', fontWeight: 600 },
    body: { padding: 14, display: 'flex', flexDirection: 'column', gap: 8 },
    field: { display: 'flex', flexDirection: 'column', fontSize: 11, color: '#444' },
    fieldLabel: { marginBottom: 2 },
    input: { padding: '6px 8px', border: '1px solid #c8c8c0', borderRadius: 2, fontSize: 12, fontFamily: 'inherit' },
    actions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 },
    cancel: { background: '#e5e5dd', color: '#333', border: '1px solid #c8c8c0', padding: '6px 12px', borderRadius: 2, cursor: 'pointer' },
    save: { color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 2, cursor: 'pointer', fontWeight: 600 },
  };

  function navBtn(active, activeBg) {
    return {
      background: active ? activeBg : 'transparent', color: '#fff',
      border: 'none', padding: '10px 14px', fontFamily: "'Inter',sans-serif",
      fontSize: 13, cursor: 'pointer', letterSpacing: 0.4,
      borderBottom: active ? '2px solid #ffffff' : '2px solid transparent',
    };
  }

  // ─────────────────────────────────────────────────────────────────
  //  OpenVAS / Greenbone GSA  — vm-1
  // ─────────────────────────────────────────────────────────────────
  function OpenVASLabShell(props) {
    const [phase, setPhase] = React.useState('install');
    const [pageId, setPageId] = React.useState('dashboard');
    const [targets, setTargets] = React.useState([]);
    const [tasks, setTasks] = React.useState([]);
    const [reports, setReports] = React.useState([]);
    const [showNewTarget, setShowNewTarget] = React.useState(false);
    const [showNewTask, setShowNewTask] = React.useState(false);
    const [activeReportId, setActiveReportId] = React.useState(null);
    const [installState, setInstallState] = React.useState({ aptUpdated: false, repoAdded: false, installed: false, setup: false, started: false });
    const [remediated, setRemediated] = React.useState({});

    function installLine(cmd) {
      let stdout = '';
      if (/^sudo\s+apt\s+update/.test(cmd)) {
        stdout = 'Hit:1 http://archive.ubuntu.com/ubuntu jammy InRelease\nReading package lists... Done\nBuilding dependency tree... Done\n';
        setInstallState(s => ({ ...s, aptUpdated: true }));
      } else if (/^sudo\s+apt\s+upgrade/.test(cmd)) {
        stdout = 'Reading package lists... Done\n0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.\n';
      } else if (/^sudo\s+add-apt-repository\s+ppa:mrazavi\/openvas/.test(cmd)) {
        stdout = 'Adding PPA: ppa:mrazavi/openvas\nMore info: https://launchpad.net/~mrazavi/+archive/ubuntu/openvas\nPress [ENTER] to continue or Ctrl-c to cancel.\nOK\ngpg: keyring `/tmp/tmpaeqk_ywj/secring.gpg` created\ngpg: imported: 1\n';
        setInstallState(s => ({ ...s, repoAdded: true }));
      } else if (/^sudo\s+apt\s+install\s+openvas/.test(cmd)) {
        stdout = 'Reading package lists... Done\nThe following NEW packages will be installed:\n  openvas openvas-cli openvas-manager openvas-scanner gvm\nFetched 38.4 MB in 6s (6,212 kB/s)\nUnpacking openvas (21.4.4-1) ...\nSetting up openvas (21.4.4-1) ...\n';
        setInstallState(s => ({ ...s, installed: true }));
      } else if (/^sudo\s+gvm-setup/.test(cmd)) {
        stdout = '[+] Creating GVM\'s certificate infrastructure\n[+] Updating NVTs (this can take several minutes)\n[*] feed update: 89,142 NVTs\n[+] Generating gvmd certificates\n[*] User created with password "8a3f1e2c-bbcf-44da-9f70-3ddc18c11122"\n[+] Setup complete.\n';
        setInstallState(s => ({ ...s, setup: true }));
      } else if (/^sudo\s+gvm-start/.test(cmd)) {
        stdout = '[+] Please wait for the GVM/Greenbone Vulnerability Manager start-up\n[*] Starting Greenbone Security Assistant Daemon (gsad) ...\n[+] OpenVAS scanner is up and running.\n[+] Open https://localhost:9392 in your browser.\n';
        setInstallState(s => ({ ...s, started: true }));
      } else {
        stdout = `bash: ${cmd}: command not found\n`;
      }
      emit(props, `cli:${cmd}`, { stdout, phase: 'install' });
      return { stdout };
    }

    function gotoLogin() {
      emit(props, 'nav:https://localhost:9392', { phase: 'login' });
      setPhase('login');
    }

    function doLogin(username) {
      emit(props, `auth:login user=${username}`, { phase: 'login' });
      setPhase('app');
    }

    function navigate(area) {
      emit(props, `ui:nav ${area}`, { area });
      if (/Targets/.test(area))      setPageId('targets');
      else if (/Tasks/.test(area))   setPageId('tasks');
      else if (/Reports/.test(area)) setPageId('reports');
      else                           setPageId('dashboard');
    }

    function createTarget(name, hosts) {
      const tgt = { id: 't' + (targets.length + 1), name, hosts };
      setTargets(prev => prev.concat([tgt]));
      setShowNewTarget(false);
      emit(props, `ui:targets.save name=${name} hosts=${hosts}`, { target: tgt });
    }

    function createTask(name, targetName, config) {
      const tk = { id: 'k' + (tasks.length + 1), name, target: targetName, config, status: 'New', progress: 0 };
      setTasks(prev => prev.concat([tk]));
      setShowNewTask(false);
      emit(props, `ui:tasks.save name=${name} target=${targetName} config=${config}`, { task: tk });
    }

    function startTask(taskId) {
      const tk = tasks.find(t => t.id === taskId);
      if (!tk) return;
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Done', progress: 100 } : t));
      const rid = 'r' + (reports.length + 1);
      const findings = OPENVAS_FINDINGS.slice();
      const rpt = {
        id: rid,
        taskName: tk.name,
        target: tk.target,
        finished: '2026-04-23 13:42:09',
        findings,
        counts: countSev(findings),
      };
      setReports(prev => prev.concat([rpt]));
      emit(props, `ui:tasks.start id=${taskId}`, { task: tk, reportId: rid });
    }

    function openReport(reportId) {
      setActiveReportId(reportId);
      setPageId('reportDetail');
      emit(props, `ui:reports.open id=${reportId}`, { reportId });
    }

    function exportPdf(reportId) {
      emit(props, `ui:reports.export id=${reportId} format=pdf`, { reportId, format: 'pdf' });
    }

    function markRemediated(oid) {
      setRemediated(prev => ({ ...prev, [oid]: true }));
      emit(props, `ui:remediation.mark oid=${oid}`, { oid });
    }

    function rescan() {
      emit(props, 'ui:tasks.rescan', {});
    }

    if (phase === 'install') {
      return (
        <div style={ovStyles.installRoot}>
          <div style={ovStyles.installHeader}>
            <span style={ovStyles.installLogo}>🛡 GREENBONE</span>
            <span style={ovStyles.installSub}>OpenVAS / GVM-21.4 — first-time installation</span>
          </div>
          <div style={ovStyles.installBody}>
            <div style={ovStyles.installCopy}>
              The OpenVAS framework is not yet installed on this Ubuntu host. Use the embedded terminal below to add the
              <code> ppa:mrazavi/openvas </code> repository, install the <code>openvas</code> package, run
              <code> gvm-setup </code> to bootstrap the certificate infrastructure and feed,
              and finally <code>gvm-start </code> to bring the Greenbone Security Assistant up on port 9392.
            </div>
            <ul style={ovStyles.installChecklist}>
              <li style={installState.aptUpdated ? ovStyles.installCheckOn : ovStyles.installCheckOff}>{installState.aptUpdated ? '✔' : '○'} apt indexes refreshed</li>
              <li style={installState.repoAdded ? ovStyles.installCheckOn : ovStyles.installCheckOff}>{installState.repoAdded ? '✔' : '○'} OpenVAS PPA added</li>
              <li style={installState.installed ? ovStyles.installCheckOn : ovStyles.installCheckOff}>{installState.installed ? '✔' : '○'} openvas package installed</li>
              <li style={installState.setup ? ovStyles.installCheckOn : ovStyles.installCheckOff}>{installState.setup ? '✔' : '○'} gvm-setup completed (admin password generated)</li>
              <li style={installState.started ? ovStyles.installCheckOn : ovStyles.installCheckOff}>{installState.started ? '✔' : '○'} gvm-start: GSA listening on https://localhost:9392</li>
            </ul>
            <InstallConsole onLine={installLine} prompt="student@b2b:~$" placeholder="sudo apt update" greeting="OpenVAS installation console — paste each upstream command in order." />
            {installState.started && (
              <button onClick={gotoLogin} style={ovStyles.installGo}>OPEN https://localhost:9392 →</button>
            )}
          </div>
        </div>
      );
    }

    if (phase === 'login') {
      return (
        <div style={ovStyles.loginRoot}>
          <div style={ovStyles.loginCard}>
            <div style={ovStyles.loginLogo}>🛡 Greenbone Security Assistant</div>
            <div style={ovStyles.loginSub}>21.4.4 — https://localhost:9392</div>
            <LoginForm accent="#0d6240" onSubmit={(u) => doLogin(u)} hint="admin / 8a3f1e2c-bbcf-44da-9f70-3ddc18c11122" />
          </div>
        </div>
      );
    }

    return (
      <div style={ovStyles.appRoot}>
        <header style={ovStyles.appHeader}>
          <div style={ovStyles.appBrand}>🛡 Greenbone Security Assistant</div>
          <nav style={ovStyles.appNav}>
            <button style={navBtn(pageId === 'dashboard', '#0a3a23')}                              onClick={() => navigate('Dashboards')}>Dashboards</button>
            <button style={navBtn(pageId === 'tasks', '#0a3a23')}                                   onClick={() => navigate('Scans/Tasks')}>Scans</button>
            <button style={navBtn(pageId === 'reports' || pageId === 'reportDetail', '#0a3a23')}    onClick={() => navigate('Scans/Reports')}>Reports</button>
            <button style={navBtn(pageId === 'targets', '#0a3a23')}                                 onClick={() => navigate('Configuration/Targets')}>Configuration</button>
            <button style={navBtn(false, '#0a3a23')}                                                onClick={() => navigate('Resilience')}>Resilience</button>
            <button style={navBtn(false, '#0a3a23')}                                                onClick={() => navigate('SecInfo')}>SecInfo</button>
            <button style={navBtn(false, '#0a3a23')}                                                onClick={() => navigate('Administration')}>Administration</button>
          </nav>
          <div style={ovStyles.appUser}>admin ▾</div>
        </header>
        <div style={ovStyles.appBody}>
          {pageId === 'dashboard' && (
            <div style={ovStyles.pad}>
              <h1 style={ovStyles.h1}>Dashboards › Overview</h1>
              <div style={ovStyles.kpiRow}>
                <div style={ovStyles.kpi}><div style={ovStyles.kpiLabel}>Targets</div><div style={ovStyles.kpiVal}>{targets.length}</div></div>
                <div style={ovStyles.kpi}><div style={ovStyles.kpiLabel}>Tasks</div><div style={ovStyles.kpiVal}>{tasks.length}</div></div>
                <div style={ovStyles.kpi}><div style={ovStyles.kpiLabel}>Reports</div><div style={ovStyles.kpiVal}>{reports.length}</div></div>
              </div>
              <div style={ovStyles.muted}>Use Configuration › Targets to add a host range, then Scans › Tasks to launch a scan.</div>
            </div>
          )}
          {pageId === 'targets' && (
            <div style={ovStyles.pad}>
              <div style={ovStyles.toolbar}>
                <h1 style={ovStyles.h1}>Configuration › Targets</h1>
                <button style={ovStyles.primaryBtn} onClick={() => { setShowNewTarget(true); emit(props, 'ui:targets.new'); }}>＋ New Target</button>
              </div>
              <table style={ovStyles.table}>
                <thead><tr><th style={ovStyles.th}>Name</th><th style={ovStyles.th}>Hosts</th><th style={ovStyles.th}>Modified</th></tr></thead>
                <tbody>
                  {targets.length === 0 ? (
                    <tr><td colSpan="3" style={ovStyles.empty}>(No targets yet — click ＋ New Target to add one.)</td></tr>
                  ) : targets.map(t => (
                    <tr key={t.id}><td style={ovStyles.td}>{t.name}</td><td style={ovStyles.td}>{t.hosts}</td><td style={ovStyles.td}>2026-04-23 09:00</td></tr>
                  ))}
                </tbody>
              </table>
              {showNewTarget && (
                <NewTargetModal onSave={(n, h) => createTarget(n, h)} onCancel={() => setShowNewTarget(false)} />
              )}
            </div>
          )}
          {pageId === 'tasks' && (
            <div style={ovStyles.pad}>
              <div style={ovStyles.toolbar}>
                <h1 style={ovStyles.h1}>Scans › Tasks</h1>
                <button style={ovStyles.primaryBtn} disabled={targets.length === 0} onClick={() => { setShowNewTask(true); emit(props, 'ui:tasks.new'); }}>＋ New Task</button>
              </div>
              <table style={ovStyles.table}>
                <thead><tr><th style={ovStyles.th}>Name</th><th style={ovStyles.th}>Target</th><th style={ovStyles.th}>Config</th><th style={ovStyles.th}>Status</th><th style={ovStyles.th}>Actions</th></tr></thead>
                <tbody>
                  {tasks.length === 0 ? (
                    <tr><td colSpan="5" style={ovStyles.empty}>(No tasks. Add a target first, then create a task.)</td></tr>
                  ) : tasks.map(t => (
                    <tr key={t.id}>
                      <td style={ovStyles.td}>{t.name}</td>
                      <td style={ovStyles.td}>{t.target}</td>
                      <td style={ovStyles.td}>{t.config}</td>
                      <td style={ovStyles.td}>{t.status} ({t.progress}%)</td>
                      <td style={ovStyles.td}>
                        {t.status === 'Done'
                          ? <button style={ovStyles.smallBtn} onClick={rescan}>↻ Rescan</button>
                          : <button style={ovStyles.smallBtn} onClick={() => startTask(t.id)}>▶ Start</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {showNewTask && (
                <NewTaskModal targets={targets} onSave={(n, tgt, cfg) => createTask(n, tgt, cfg)} onCancel={() => setShowNewTask(false)} />
              )}
            </div>
          )}
          {pageId === 'reports' && (
            <div style={ovStyles.pad}>
              <h1 style={ovStyles.h1}>Scans › Reports</h1>
              <table style={ovStyles.table}>
                <thead><tr><th style={ovStyles.th}>Task</th><th style={ovStyles.th}>Target</th><th style={ovStyles.th}>Finished</th><th style={ovStyles.th}>Severity Counts</th><th style={ovStyles.th}>Open</th></tr></thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr><td colSpan="5" style={ovStyles.empty}>(No reports yet — start a task.)</td></tr>
                  ) : reports.map(r => (
                    <tr key={r.id}>
                      <td style={ovStyles.td}>{r.taskName}</td>
                      <td style={ovStyles.td}>{r.target}</td>
                      <td style={ovStyles.td}>{r.finished}</td>
                      <td style={ovStyles.td}>
                        <SeverityBadge level="Critical" /> {r.counts.Critical}{' '}
                        <SeverityBadge level="High" /> {r.counts.High}{' '}
                        <SeverityBadge level="Medium" /> {r.counts.Medium}{' '}
                        <SeverityBadge level="Low" /> {r.counts.Low}
                      </td>
                      <td style={ovStyles.td}><button style={ovStyles.smallBtn} onClick={() => openReport(r.id)}>Open</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {pageId === 'reportDetail' && (() => {
            const rpt = reports.find(r => r.id === activeReportId);
            if (!rpt) return <div style={ovStyles.pad}>Report not found.</div>;
            return (
              <div style={ovStyles.pad}>
                <div style={ovStyles.toolbar}>
                  <h1 style={ovStyles.h1}>{rpt.taskName} — {rpt.target}</h1>
                  <button style={ovStyles.primaryBtn} onClick={() => exportPdf(rpt.id)}>⬇ Export PDF</button>
                </div>
                <div style={ovStyles.muted}>Finished {rpt.finished} · {rpt.findings.length} results</div>
                <table style={ovStyles.table}>
                  <thead><tr><th style={ovStyles.th}>Severity</th><th style={ovStyles.th}>CVSS</th><th style={ovStyles.th}>NVT</th><th style={ovStyles.th}>OID</th><th style={ovStyles.th}>CVE</th><th style={ovStyles.th}>Host</th><th style={ovStyles.th}>Status</th></tr></thead>
                  <tbody>
                    {rpt.findings.slice().sort((a, b) => sevRank(b.severity) - sevRank(a.severity)).map((f, i) => (
                      <tr key={i}>
                        <td style={ovStyles.td}><SeverityBadge level={f.severity} /></td>
                        <td style={ovStyles.td}>{f.cvss.toFixed(1)}</td>
                        <td style={ovStyles.td}>{f.name}</td>
                        <td style={{ ...ovStyles.td, fontFamily: "'Space Mono',monospace", fontSize: 11 }}>{f.oid}</td>
                        <td style={{ ...ovStyles.td, fontFamily: "'Space Mono',monospace" }}>{f.cve || '—'}</td>
                        <td style={ovStyles.td}>{f.host}</td>
                        <td style={ovStyles.td}>
                          {remediated[f.oid]
                            ? <span style={{ color: '#0d6240', fontWeight: 600 }}>Remediated</span>
                            : f.severity === 'Critical' || f.severity === 'High'
                              ? <button style={ovStyles.smallBtn} onClick={() => markRemediated(f.oid)}>Mark fixed</button>
                              : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
        <footer style={ovStyles.appFooter}>Greenbone Security Assistant 21.4.4 · gvmd 21.4.4 · openvas 21.4.4 · feed 202604231030</footer>
      </div>
    );
  }

  function NewTargetModal({ onSave, onCancel }) {
    const [name, setName] = React.useState('Internal_Subnet');
    const [hosts, setHosts] = React.useState('10.10.24.0/24');
    return (
      <Modal onCancel={onCancel} accent="#0d6240" title="New Target">
        <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} style={modalStyles.input} /></Field>
        <Field label="Hosts (manual)"><input value={hosts} onChange={(e) => setHosts(e.target.value)} style={modalStyles.input} placeholder="10.10.24.0/24" /></Field>
        <Field label="Port List"><select style={modalStyles.input}><option>OpenVAS Default</option><option>All TCP</option><option>All IANA assigned TCP and UDP</option></select></Field>
        <Field label="Alive Test"><select style={modalStyles.input}><option>ICMP, TCP-ACK Service & ARP Ping</option><option>ICMP Ping</option><option>Consider Alive</option></select></Field>
        <ModalActions onCancel={onCancel} accent="#0d6240" onSave={() => onSave(name, hosts)} />
      </Modal>
    );
  }

  function NewTaskModal({ targets, onSave, onCancel }) {
    const [name, setName] = React.useState('Weekly_Internal_Scan');
    const [tgt, setTgt] = React.useState((targets[0] && targets[0].name) || '');
    const [cfg, setCfg] = React.useState('Full and fast');
    return (
      <Modal onCancel={onCancel} accent="#0d6240" title="New Task">
        <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} style={modalStyles.input} /></Field>
        <Field label="Scan Targets"><select value={tgt} onChange={(e) => setTgt(e.target.value)} style={modalStyles.input}>{targets.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}</select></Field>
        <Field label="Scan Config"><select value={cfg} onChange={(e) => setCfg(e.target.value)} style={modalStyles.input}><option>Full and fast</option><option>Full and very deep</option><option>Discovery</option></select></Field>
        <ModalActions onCancel={onCancel} accent="#0d6240" onSave={() => onSave(name, tgt, cfg)} />
      </Modal>
    );
  }

  function LoginForm({ onSubmit, hint, accent = '#0d6240' }) {
    const [u, setU] = React.useState('admin');
    const [p, setP] = React.useState('');
    return (
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(u, p); }} style={loginStyles.form}>
        <label style={loginStyles.label}>Username<input value={u} onChange={(e) => setU(e.target.value)} style={loginStyles.input} /></label>
        <label style={loginStyles.label}>Password<input type="password" value={p} onChange={(e) => setP(e.target.value)} style={loginStyles.input} /></label>
        {hint && <div style={loginStyles.hint}>Setup credentials: <code>{hint}</code></div>}
        <button type="submit" style={{ ...loginStyles.btn, background: accent }}>Login</button>
      </form>
    );
  }

  const loginStyles = {
    form: { display: 'flex', flexDirection: 'column', gap: 8 },
    label: { display: 'flex', flexDirection: 'column', fontSize: 11, color: '#444' },
    input: { padding: '6px 8px', border: '1px solid #c8c8c0', borderRadius: 2, fontSize: 13, marginTop: 2 },
    hint: { fontSize: 10, color: '#888' },
    btn: { color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 2, cursor: 'pointer', marginTop: 6, fontWeight: 600 },
  };

  // ─── OpenVAS styles ───
  const ovStyles = {
    installRoot: { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 520, background: '#f4f4f0', color: '#222', fontFamily: "'Inter',sans-serif" },
    installHeader: { background: '#0d6240', color: '#fff', padding: '10px 18px', display: 'flex', alignItems: 'baseline', gap: 12 },
    installLogo: { fontSize: 14, fontWeight: 700, letterSpacing: 0.5 },
    installSub: { fontSize: 11, opacity: 0.85 },
    installBody: { padding: 16, overflow: 'auto', flex: 1 },
    installCopy: { fontSize: 13, lineHeight: 1.55, marginBottom: 12 },
    installChecklist: { listStyle: 'none', padding: 0, margin: '8px 0 12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 4, fontSize: 12 },
    installCheckOn: { color: '#0d6240' },
    installCheckOff: { color: '#777' },
    installGo: { marginTop: 10, background: '#0d6240', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 3, cursor: 'pointer', fontWeight: 600 },

    loginRoot: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 520, background: 'linear-gradient(180deg,#093f29,#062518)' },
    loginCard: { background: '#fff', padding: 28, borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.4)', minWidth: 320 },
    loginLogo: { fontSize: 16, fontWeight: 700, color: '#0d6240', marginBottom: 4 },
    loginSub: { fontSize: 11, color: '#666', marginBottom: 18 },

    appRoot: { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 520, background: '#f6f6f0', fontFamily: "'Inter',sans-serif", color: '#1a1a1a', position: 'relative' },
    appHeader: { background: '#0d6240', color: '#fff', display: 'flex', alignItems: 'center' },
    appBrand: { padding: '10px 16px', fontWeight: 700, letterSpacing: 0.4, borderRight: '1px solid rgba(255,255,255,0.15)' },
    appNav: { display: 'flex', flex: 1 },
    appUser: { padding: '0 14px', color: '#cfead9', fontSize: 12 },
    appBody: { flex: 1, overflow: 'auto', background: '#f6f6f0' },
    appFooter: { padding: '6px 14px', background: '#e5e5dd', color: '#3c3c3c', fontSize: 10, borderTop: '1px solid #c8c8c0' },
    pad: { padding: '14px 18px' },
    h1: { fontSize: 16, fontWeight: 600, margin: '0 0 12px' },
    toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    primaryBtn: { background: '#0d6240', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 2, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
    smallBtn: { background: '#0d6240', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: 2, cursor: 'pointer', fontSize: 11 },
    table: { width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #d4d4cf', fontSize: 12 },
    th: { textAlign: 'left', padding: '6px 10px', background: '#e5e5dd', borderBottom: '1px solid #d4d4cf', fontWeight: 600 },
    td: { padding: '6px 10px', borderBottom: '1px solid #ececea' },
    empty: { padding: '12px 10px', color: '#888', fontStyle: 'italic' },
    kpiRow: { display: 'flex', gap: 12, marginBottom: 12 },
    kpi: { background: '#fff', border: '1px solid #d4d4cf', padding: 14, borderRadius: 3, minWidth: 110 },
    kpiLabel: { fontSize: 11, color: '#666' },
    kpiVal: { fontSize: 26, fontWeight: 700, color: '#0d6240' },
    muted: { fontSize: 12, color: '#666' },
  };

  // ─────────────────────────────────────────────────────────────────
  //  Nessus  — vm-2
  //  Severity tints LOCKED to: Critical=#CC0000, High=#FF8C00,
  //                            Medium=#FFD700, Low=#3399CC, Info=#999999
  // ─────────────────────────────────────────────────────────────────
  function NessusLabShell(props) {
    const [phase, setPhase] = React.useState('install');
    const [installState, setInstallState] = React.useState({ pkg: false, started: false, enabled: false });
    const [pageId, setPageId] = React.useState('scans');
    const [policies, setPolicies] = React.useState([]);
    const [scans, setScans] = React.useState([]);
    const [reports, setReports] = React.useState([]);
    const [showNewPolicy, setShowNewPolicy] = React.useState(false);
    const [showNewScan, setShowNewScan] = React.useState(false);
    const [activeScanId, setActiveScanId] = React.useState(null);

    function installLine(cmd) {
      let stdout = '';
      if (/^wget\s+https:\/\/www\.tenable\.com\/downloads/.test(cmd)) {
        stdout = 'Resolving www.tenable.com... 23.50.78.121\nHTTP request sent, awaiting response... 200 OK\nLength: 47104328 (45M) [application/x-debian-package]\nSaving to: ‘Nessus-10.7.0-ubuntu1604_amd64.deb’\n100%[================================>] 47,104,328 18.2M/s in 2.4s\n';
      } else if (/^sudo\s+dpkg\s+-i\s+\S*Nessus.*\.deb/.test(cmd)) {
        stdout = '(Reading database ... 234812 files and directories currently installed.)\nPreparing to unpack Nessus-10.7.0-ubuntu1604_amd64.deb ...\nUnpacking nessus (10.7.0) ...\nSetting up nessus (10.7.0) ...\n - You can start nessusd by typing /bin/systemctl start nessusd.service\n - Then go to https://nessus-host:8834/ to configure your scanner\n';
        setInstallState(s => ({ ...s, pkg: true }));
      } else if (/^sudo\s+systemctl\s+start\s+nessusd/.test(cmd)) {
        stdout = '';
        setInstallState(s => ({ ...s, started: true }));
      } else if (/^sudo\s+systemctl\s+enable\s+nessusd/.test(cmd)) {
        stdout = 'Created symlink /etc/systemd/system/multi-user.target.wants/nessusd.service → /lib/systemd/system/nessusd.service.\n';
        setInstallState(s => ({ ...s, enabled: true }));
      } else if (/^sudo\s+systemctl\s+status\s+nessusd/.test(cmd)) {
        stdout = '● nessusd.service - The Nessus Vulnerability Scanner\n     Loaded: loaded (/lib/systemd/system/nessusd.service; enabled)\n     Active: active (running) since Thu 2026-04-23 08:14:02 EDT\n';
      } else {
        stdout = `bash: ${cmd}: command not found\n`;
      }
      emit(props, `cli:${cmd}`, { stdout, phase: 'install' });
      return { stdout };
    }

    function gotoSetup() {
      emit(props, 'nav:https://10.10.24.10:8834', { phase: 'setup' });
      setPhase('setup');
    }

    function completeSetup(account, code) {
      emit(props, `auth:activate user=${account} code=${code}`, { phase: 'setup' });
      setPhase('app');
    }

    function navigate(area) {
      emit(props, `ui:nav ${area}`, { area });
      if (/Polic/.test(area))     setPageId('policies');
      else if (/Scans/.test(area)) setPageId('scans');
      else                         setPageId('scans');
    }

    function createPolicy(name, template) {
      const p = { id: 'p' + (policies.length + 1), name, template };
      setPolicies(prev => prev.concat([p]));
      setShowNewPolicy(false);
      emit(props, `ui:policies.save name=${name} template=${template}`, { policy: p });
    }
    function createScan(name, policyName, target) {
      const s = { id: 's' + (scans.length + 1), name, policy: policyName, target, status: 'New', launchedAt: null };
      setScans(prev => prev.concat([s]));
      setShowNewScan(false);
      emit(props, `ui:scans.save name=${name} policy=${policyName} target=${target}`, { scan: s });
    }
    function launchScan(scanId) {
      const s = scans.find(x => x.id === scanId);
      if (!s) return;
      const findings = NESSUS_FINDINGS.slice();
      const rid = 'r' + (reports.length + 1);
      const rpt = { id: rid, scanId, name: s.name, target: s.target, finished: '2026-04-23 09:51:42', findings, counts: countSev(findings) };
      setReports(prev => prev.concat([rpt]));
      setScans(prev => prev.map(x => x.id === scanId ? { ...x, status: 'Completed', launchedAt: '2026-04-23 09:14:00' } : x));
      emit(props, `ui:scans.launch id=${scanId}`, { scan: s });
    }
    function viewScan(scanId) {
      setActiveScanId(scanId);
      setPageId('scanDetail');
      emit(props, `ui:scans.open id=${scanId}`);
    }
    function exportScanPdf(scanId) {
      emit(props, `ui:scans.export id=${scanId} format=pdf`);
    }

    if (phase === 'install') {
      return (
        <div style={nsStyles.installRoot}>
          <div style={nsStyles.installHeader}>
            <span style={nsStyles.brand}>tenable.</span><span style={nsStyles.brandTwo}>nessus</span>
            <span style={nsStyles.installSub}>10.7.0 — Linux installer</span>
          </div>
          <div style={nsStyles.installBody}>
            <div style={nsStyles.installCopy}>
              Nessus is delivered as a Debian package. Use the embedded terminal below to run <code>wget</code> for the
              installer, install with <code>sudo dpkg -i Nessus-10.7.0-ubuntu1604_amd64.deb</code>, then start and
              enable the <code>nessusd</code> service.
            </div>
            <ul style={nsStyles.installChecklist}>
              <li style={installState.pkg ? nsStyles.checkOn : nsStyles.checkOff}>{installState.pkg ? '✔' : '○'} Nessus .deb package installed</li>
              <li style={installState.started ? nsStyles.checkOn : nsStyles.checkOff}>{installState.started ? '✔' : '○'} nessusd service started</li>
              <li style={installState.enabled ? nsStyles.checkOn : nsStyles.checkOff}>{installState.enabled ? '✔' : '○'} nessusd service enabled at boot</li>
            </ul>
            <InstallConsole onLine={installLine} prompt="student@b2b:~$" placeholder="wget https://www.tenable.com/...Nessus.deb" greeting="Nessus installation console — paste each upstream command in order." />
            {installState.pkg && installState.started && (
              <button onClick={gotoSetup} style={nsStyles.go}>OPEN https://10.10.24.10:8834 →</button>
            )}
          </div>
        </div>
      );
    }

    if (phase === 'setup') {
      return (
        <div style={nsStyles.setupRoot}>
          <div style={nsStyles.setupCard}>
            <div style={nsStyles.brandRow}><span style={nsStyles.brand}>tenable.</span><span style={nsStyles.brandTwo}>nessus</span></div>
            <h2 style={nsStyles.setupH2}>Welcome to Nessus</h2>
            <div style={nsStyles.setupSub}>Step 1 of 2 — Create an admin account and enter your activation code.</div>
            <SetupForm onSubmit={(u, c) => completeSetup(u, c)} />
          </div>
        </div>
      );
    }

    return (
      <div style={nsStyles.appRoot}>
        <header style={nsStyles.appHeader}>
          <div style={nsStyles.brandRow}><span style={nsStyles.brand}>tenable.</span><span style={nsStyles.brandTwo}>nessus</span></div>
          <nav style={nsStyles.appNav}>
            <button onClick={() => navigate('Scans')}    style={navBtn(pageId === 'scans' || pageId === 'scanDetail', '#0a2c47')}>Scans</button>
            <button onClick={() => navigate('Policies')} style={navBtn(pageId === 'policies', '#0a2c47')}>Policies</button>
            <button onClick={() => navigate('Plugins')}  style={navBtn(false, '#0a2c47')}>Plugins</button>
            <button onClick={() => navigate('Settings')} style={navBtn(false, '#0a2c47')}>Settings</button>
          </nav>
          <div style={nsStyles.appUser}>admin ▾</div>
        </header>
        <div style={nsStyles.appBody}>
          {pageId === 'policies' && (
            <div style={nsStyles.pad}>
              <div style={nsStyles.toolbar}>
                <h1 style={nsStyles.h1}>Policies</h1>
                <button style={nsStyles.primaryBtn} onClick={() => { setShowNewPolicy(true); emit(props, 'ui:policies.new'); }}>＋ New Policy</button>
              </div>
              <table style={nsStyles.table}>
                <thead><tr><th style={nsStyles.th}>Name</th><th style={nsStyles.th}>Template</th></tr></thead>
                <tbody>
                  {policies.length === 0 ? <tr><td colSpan="2" style={nsStyles.empty}>(No policies yet — click ＋ New Policy.)</td></tr>
                  : policies.map(p => <tr key={p.id}><td style={nsStyles.td}>{p.name}</td><td style={nsStyles.td}>{p.template}</td></tr>)}
                </tbody>
              </table>
              {showNewPolicy && <NewPolicyModal onSave={(n, t) => createPolicy(n, t)} onCancel={() => setShowNewPolicy(false)} />}
            </div>
          )}
          {pageId === 'scans' && (
            <div style={nsStyles.pad}>
              <div style={nsStyles.toolbar}>
                <h1 style={nsStyles.h1}>My Scans</h1>
                <button style={nsStyles.primaryBtn} disabled={policies.length === 0} onClick={() => { setShowNewScan(true); emit(props, 'ui:scans.new'); }}>＋ New Scan</button>
              </div>
              <table style={nsStyles.table}>
                <thead><tr><th style={nsStyles.th}>Name</th><th style={nsStyles.th}>Policy</th><th style={nsStyles.th}>Target</th><th style={nsStyles.th}>Status</th><th style={nsStyles.th}>Actions</th></tr></thead>
                <tbody>
                  {scans.length === 0 ? <tr><td colSpan="5" style={nsStyles.empty}>(No scans yet — define a policy first.)</td></tr>
                  : scans.map(s => (
                    <tr key={s.id}>
                      <td style={nsStyles.td}>{s.name}</td>
                      <td style={nsStyles.td}>{s.policy}</td>
                      <td style={nsStyles.td}>{s.target}</td>
                      <td style={nsStyles.td}>{s.status}</td>
                      <td style={nsStyles.td}>
                        {s.status === 'New' && <button style={nsStyles.smallBtn} onClick={() => launchScan(s.id)}>▶ Launch</button>}
                        {s.status === 'Completed' && <button style={nsStyles.smallBtn} onClick={() => viewScan(s.id)}>Open</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {showNewScan && <NewScanModal policies={policies} onSave={(n, p, t) => createScan(n, p, t)} onCancel={() => setShowNewScan(false)} />}
            </div>
          )}
          {pageId === 'scanDetail' && (() => {
            const rpt = reports.find(r => r.scanId === activeScanId);
            if (!rpt) return <div style={nsStyles.pad}>Report not available.</div>;
            return (
              <div style={nsStyles.pad}>
                <div style={nsStyles.toolbar}>
                  <h1 style={nsStyles.h1}>{rpt.name}</h1>
                  <button style={nsStyles.primaryBtn} onClick={() => exportScanPdf(rpt.scanId)}>⬇ Export ▾</button>
                </div>
                <div style={nsStyles.muted}>Target {rpt.target} · finished {rpt.finished} · {rpt.findings.length} results</div>
                <div style={nsStyles.donutRow}>
                  {['Critical','High','Medium','Low','Info'].map(level => (
                    <div key={level} style={nsStyles.donut}>
                      <div style={{ ...nsStyles.donutCount, color: SEVERITY_TINT[level] }}>{rpt.counts[level] || 0}</div>
                      <div style={nsStyles.donutLabel}>{level}</div>
                    </div>
                  ))}
                </div>
                <table style={nsStyles.table}>
                  <thead><tr><th style={nsStyles.th}>Severity</th><th style={nsStyles.th}>Plugin ID</th><th style={nsStyles.th}>Name</th><th style={nsStyles.th}>CVE</th><th style={nsStyles.th}>Host</th></tr></thead>
                  <tbody>
                    {rpt.findings.slice().sort((a, b) => sevRank(b.severity) - sevRank(a.severity)).map((f, i) => (
                      <tr key={i}>
                        <td style={nsStyles.td}><SeverityBadge level={f.severity} /></td>
                        <td style={{ ...nsStyles.td, fontFamily: "'Space Mono',monospace" }}>{f.plugin}</td>
                        <td style={nsStyles.td}>{f.name}</td>
                        <td style={{ ...nsStyles.td, fontFamily: "'Space Mono',monospace" }}>{f.cve || '—'}</td>
                        <td style={nsStyles.td}>{f.host}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
        <footer style={nsStyles.appFooter}>Nessus Professional 10.7.0 · plugin set 202604231030 · © Tenable</footer>
      </div>
    );
  }

  function SetupForm({ onSubmit }) {
    const [user, setUser] = React.useState('admin');
    const [pass, setPass] = React.useState('');
    const [code, setCode] = React.useState('');
    return (
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(user, code); }} style={loginStyles.form}>
        <label style={loginStyles.label}>Admin Username<input value={user} onChange={(e) => setUser(e.target.value)} style={loginStyles.input} /></label>
        <label style={loginStyles.label}>Admin Password<input type="password" value={pass} onChange={(e) => setPass(e.target.value)} style={loginStyles.input} /></label>
        <label style={loginStyles.label}>Activation Code<input value={code} onChange={(e) => setCode(e.target.value)} placeholder="XXXX-XXXX-XXXX-XXXX" style={loginStyles.input} /></label>
        <button type="submit" style={{ ...loginStyles.btn, background: '#0073e6' }}>Continue</button>
      </form>
    );
  }

  function NewPolicyModal({ onSave, onCancel }) {
    const [name, setName] = React.useState('Internal_BaselinePolicy');
    const [template, setTemplate] = React.useState('Basic Network Scan');
    return (
      <Modal onCancel={onCancel} accent="#0073e6" title="New Policy">
        <Field label="Template"><select value={template} onChange={(e) => setTemplate(e.target.value)} style={modalStyles.input}><option>Basic Network Scan</option><option>Advanced Scan</option><option>Web Application Tests</option><option>Credentialed Patch Audit</option></select></Field>
        <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} style={modalStyles.input} /></Field>
        <Field label="Description"><input style={modalStyles.input} placeholder="(optional)" /></Field>
        <ModalActions onCancel={onCancel} accent="#0073e6" onSave={() => onSave(name, template)} />
      </Modal>
    );
  }
  function NewScanModal({ policies, onSave, onCancel }) {
    const [name, setName] = React.useState('Internal_Subnet_Scan');
    const [pol, setPol] = React.useState((policies[0] && policies[0].name) || '');
    const [tgt, setTgt] = React.useState('10.10.24.0/24');
    return (
      <Modal onCancel={onCancel} accent="#0073e6" title="New Scan">
        <Field label="Policy"><select value={pol} onChange={(e) => setPol(e.target.value)} style={modalStyles.input}>{policies.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></Field>
        <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} style={modalStyles.input} /></Field>
        <Field label="Targets"><input value={tgt} onChange={(e) => setTgt(e.target.value)} style={modalStyles.input} /></Field>
        <ModalActions onCancel={onCancel} accent="#0073e6" onSave={() => onSave(name, pol, tgt)} />
      </Modal>
    );
  }

  const nsStyles = {
    installRoot: { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 520, background: '#fff', color: '#1a1a1a', fontFamily: "'Inter',sans-serif" },
    installHeader: { background: '#103a5c', color: '#fff', padding: '10px 18px', display: 'flex', alignItems: 'baseline', gap: 12 },
    brand: { fontSize: 14, fontWeight: 600 },
    brandTwo: { fontSize: 14, fontWeight: 700, color: '#5cb8ff' },
    brandRow: { display: 'flex', gap: 4, alignItems: 'baseline', padding: '10px 14px' },
    installSub: { fontSize: 11, opacity: 0.85 },
    installBody: { padding: 16, overflow: 'auto', flex: 1 },
    installCopy: { fontSize: 13, lineHeight: 1.55, marginBottom: 12 },
    installChecklist: { listStyle: 'none', padding: 0, margin: '8px 0 12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 4, fontSize: 12 },
    checkOn: { color: '#103a5c' },
    checkOff: { color: '#888' },
    go: { marginTop: 10, background: '#0073e6', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 3, cursor: 'pointer', fontWeight: 600 },

    setupRoot: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 520, background: '#103a5c' },
    setupCard: { background: '#fff', padding: 28, borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.4)', minWidth: 340 },
    setupH2: { fontSize: 18, fontWeight: 600, color: '#103a5c', margin: '8px 14px 4px' },
    setupSub: { fontSize: 12, color: '#666', margin: '0 14px 16px' },

    appRoot: { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 520, background: '#f4f7fa', fontFamily: "'Inter',sans-serif", color: '#1a1a1a', position: 'relative' },
    appHeader: { background: '#103a5c', color: '#fff', display: 'flex', alignItems: 'center' },
    appNav: { display: 'flex', flex: 1, marginLeft: 8 },
    appUser: { padding: '0 14px', color: '#cfe2ff', fontSize: 12 },
    appBody: { flex: 1, overflow: 'auto', background: '#f4f7fa' },
    appFooter: { padding: '6px 14px', background: '#e1e7ee', color: '#3c3c3c', fontSize: 10, borderTop: '1px solid #c8d0d8' },
    pad: { padding: '14px 18px' },
    h1: { fontSize: 16, fontWeight: 600, margin: '0 0 12px' },
    toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    primaryBtn: { background: '#0073e6', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 2, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
    smallBtn: { background: '#0073e6', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: 2, cursor: 'pointer', fontSize: 11 },
    table: { width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #d4dae1', fontSize: 12 },
    th: { textAlign: 'left', padding: '6px 10px', background: '#e1e7ee', borderBottom: '1px solid #d4dae1', fontWeight: 600 },
    td: { padding: '6px 10px', borderBottom: '1px solid #ececf2' },
    empty: { padding: '12px 10px', color: '#888', fontStyle: 'italic' },
    muted: { fontSize: 12, color: '#666', marginBottom: 8 },
    donutRow: { display: 'flex', gap: 14, marginBottom: 14 },
    donut: { background: '#fff', border: '1px solid #d4dae1', padding: '12px 18px', borderRadius: 50, minWidth: 76, textAlign: 'center' },
    donutCount: { fontSize: 22, fontWeight: 700 },
    donutLabel: { fontSize: 10, color: '#666' },
  };

  // ─────────────────────────────────────────────────────────────────
  //  QualysGuard VMDR  — vm-3
  // ─────────────────────────────────────────────────────────────────
  function QualysLabShell(props) {
    const [phase, setPhase] = React.useState('home');
    const [tabId, setTabId] = React.useState('vm');
    const [assets, setAssets] = React.useState([]);
    const [scans, setScans] = React.useState([]);
    const [reports, setReports] = React.useState([]);
    const [tickets, setTickets] = React.useState([]);
    const [showNewAsset, setShowNewAsset] = React.useState(false);
    const [showNewScan, setShowNewScan] = React.useState(false);
    const [showNewTicket, setShowNewTicket] = React.useState(false);
    const [activeScanId, setActiveScanId] = React.useState(null);

    function navigate(area) {
      emit(props, `ui:nav ${area}`, { area });
      if (/Home/.test(area))         setPhase('home');
      else if (/Assets/.test(area))  setPhase('assets');
      else if (/Scans/.test(area))   setPhase('scans');
      else if (/Tickets/.test(area)) setPhase('tickets');
      else if (/Reports/.test(area)) setPhase('reports');
      else                            setPhase('home');
    }

    function navTab(t) {
      setTabId(t);
      emit(props, `ui:tab ${t.toUpperCase()}`, { tab: t });
    }

    function createAsset(name, ip) {
      const a = { id: 'a' + (assets.length + 1), name, ip };
      setAssets(prev => prev.concat([a]));
      setShowNewAsset(false);
      emit(props, `ui:assets.save name=${name} ip=${ip}`, { asset: a });
    }
    function createScan(name, assetName, scanType) {
      const s = { id: 's' + (scans.length + 1), name, asset: assetName, scanType, status: 'Queued' };
      setScans(prev => prev.concat([s]));
      setShowNewScan(false);
      emit(props, `ui:scans.save name=${name} asset=${assetName} type=${scanType}`, { scan: s });
    }
    function launchScan(scanId) {
      const sc = scans.find(s => s.id === scanId);
      if (!sc) return;
      const findings = QUALYS_FINDINGS.slice();
      const rid = 'r' + (reports.length + 1);
      const rpt = { id: rid, scanId, name: sc.name, asset: sc.asset, finished: '2026-04-23 11:08:31', findings, counts: countQualys(findings) };
      setReports(prev => prev.concat([rpt]));
      setScans(prev => prev.map(s => s.id === scanId ? { ...s, status: 'Finished' } : s));
      emit(props, `ui:scans.launch id=${scanId}`, { scan: sc });
    }
    function viewScan(scanId) {
      setActiveScanId(scanId);
      setPhase('scanDetail');
      emit(props, `ui:scans.open id=${scanId}`);
    }
    function exportPatch(scanId) {
      emit(props, `ui:reports.patchReport id=${scanId}`);
    }
    function createTicket(qid, host, owner) {
      const t = { id: 'k' + (tickets.length + 1), qid, host, owner, state: 'OPEN', created: '2026-04-23 11:18:02' };
      setTickets(prev => prev.concat([t]));
      setShowNewTicket(false);
      emit(props, `ui:tickets.save qid=${qid} host=${host} owner=${owner}`, { ticket: t });
    }

    return (
      <div style={qStyles.appRoot}>
        <header style={qStyles.appHeader}>
          <div style={qStyles.brand}>QUALYS<span style={qStyles.brandSub}>VMDR</span></div>
          <nav style={qStyles.tabBar}>
            <button onClick={() => navTab('vm')}  style={tabBtn(tabId === 'vm')}>VM</button>
            <button onClick={() => navTab('pc')}  style={tabBtn(tabId === 'pc')}>PC</button>
            <button onClick={() => navTab('was')} style={tabBtn(tabId === 'was')}>WAS</button>
          </nav>
          <div style={qStyles.appUser}>j.sanders@example.local ▾</div>
        </header>
        <div style={qStyles.subNav}>
          <button onClick={() => navigate('Home')}    style={subBtn(phase === 'home')}>Dashboard</button>
          <button onClick={() => navigate('Assets')}  style={subBtn(phase === 'assets')}>Assets</button>
          <button onClick={() => navigate('Scans')}   style={subBtn(phase === 'scans' || phase === 'scanDetail')}>Scans</button>
          <button onClick={() => navigate('Reports')} style={subBtn(phase === 'reports')}>Reports</button>
          <button onClick={() => navigate('Tickets')} style={subBtn(phase === 'tickets')}>Tickets</button>
        </div>
        <div style={qStyles.appBody}>
          {phase === 'home' && (
            <div style={qStyles.pad}>
              <h1 style={qStyles.h1}>Home — VMDR Dashboard</h1>
              <div style={qStyles.kpiRow}>
                <DonutKpi color="#CC0000" label="Severity 5 (Critical)" value={reports.reduce((a, r) => a + (r.counts[5] || 0), 0)} />
                <DonutKpi color="#FF8C00" label="Severity 4"            value={reports.reduce((a, r) => a + (r.counts[4] || 0), 0)} />
                <DonutKpi color="#FFD700" label="Severity 3"            value={reports.reduce((a, r) => a + (r.counts[3] || 0), 0)} />
                <DonutKpi color="#3399CC" label="Severity 2"            value={reports.reduce((a, r) => a + (r.counts[2] || 0), 0)} />
                <DonutKpi color="#999999" label="Severity 1"            value={reports.reduce((a, r) => a + (r.counts[1] || 0), 0)} />
              </div>
              <div style={qStyles.muted}>Use Assets ▸ Host Assets to register a target, then run a Scan from the Scans tab. Open a remediation Ticket from Scan results.</div>
            </div>
          )}
          {phase === 'assets' && (
            <div style={qStyles.pad}>
              <div style={qStyles.toolbar}>
                <h1 style={qStyles.h1}>Assets ▸ Host Assets</h1>
                <button style={qStyles.primaryBtn} onClick={() => { setShowNewAsset(true); emit(props, 'ui:assets.new'); }}>＋ New ▾</button>
              </div>
              <table style={qStyles.table}>
                <thead><tr><th style={qStyles.th}>Asset Name</th><th style={qStyles.th}>IP / Hostname</th><th style={qStyles.th}>Tracking Method</th><th style={qStyles.th}>Tags</th></tr></thead>
                <tbody>
                  {assets.length === 0 ? <tr><td colSpan="4" style={qStyles.empty}>(No assets yet — click ＋ New to add one.)</td></tr>
                  : assets.map(a => <tr key={a.id}><td style={qStyles.td}>{a.name}</td><td style={qStyles.td}>{a.ip}</td><td style={qStyles.td}>IP</td><td style={qStyles.td}>Internal</td></tr>)}
                </tbody>
              </table>
              {showNewAsset && <NewAssetModal onSave={(n, ip) => createAsset(n, ip)} onCancel={() => setShowNewAsset(false)} />}
            </div>
          )}
          {phase === 'scans' && (
            <div style={qStyles.pad}>
              <div style={qStyles.toolbar}>
                <h1 style={qStyles.h1}>Scans</h1>
                <button style={qStyles.primaryBtn} disabled={assets.length === 0} onClick={() => { setShowNewScan(true); emit(props, 'ui:scans.new'); }}>＋ New Scan ▾</button>
              </div>
              <table style={qStyles.table}>
                <thead><tr><th style={qStyles.th}>Name</th><th style={qStyles.th}>Asset</th><th style={qStyles.th}>Type</th><th style={qStyles.th}>Status</th><th style={qStyles.th}>Actions</th></tr></thead>
                <tbody>
                  {scans.length === 0 ? <tr><td colSpan="5" style={qStyles.empty}>(No scans yet.)</td></tr>
                  : scans.map(s => (
                    <tr key={s.id}>
                      <td style={qStyles.td}>{s.name}</td>
                      <td style={qStyles.td}>{s.asset}</td>
                      <td style={qStyles.td}>{s.scanType}</td>
                      <td style={qStyles.td}>{s.status}</td>
                      <td style={qStyles.td}>
                        {s.status === 'Queued' && <button style={qStyles.smallBtn} onClick={() => launchScan(s.id)}>▶ Launch</button>}
                        {s.status === 'Finished' && <button style={qStyles.smallBtn} onClick={() => viewScan(s.id)}>View</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {showNewScan && <NewQualysScanModal assets={assets} onSave={(n, a, t) => createScan(n, a, t)} onCancel={() => setShowNewScan(false)} />}
            </div>
          )}
          {phase === 'scanDetail' && (() => {
            const rpt = reports.find(r => r.scanId === activeScanId);
            if (!rpt) return <div style={qStyles.pad}>Scan results unavailable.</div>;
            return (
              <div style={qStyles.pad}>
                <div style={qStyles.toolbar}>
                  <h1 style={qStyles.h1}>{rpt.name} — Detection Report</h1>
                  <div>
                    <button style={{ ...qStyles.primaryBtn, marginRight: 6 }} onClick={() => exportPatch(rpt.scanId)}>Generate Patch Report</button>
                    <button style={qStyles.smallBtn} onClick={() => { setShowNewTicket(true); emit(props, 'ui:tickets.new'); }}>＋ Open Remediation Ticket</button>
                  </div>
                </div>
                <div style={qStyles.muted}>Asset {rpt.asset} · finished {rpt.finished} · {rpt.findings.length} detections</div>
                <div style={qStyles.kpiRow}>
                  <DonutKpi color="#CC0000" label="Severity 5 (Critical)" value={rpt.counts[5] || 0} />
                  <DonutKpi color="#FF8C00" label="Severity 4 (High)"     value={rpt.counts[4] || 0} />
                  <DonutKpi color="#FFD700" label="Severity 3"            value={rpt.counts[3] || 0} />
                  <DonutKpi color="#3399CC" label="Severity 2"            value={rpt.counts[2] || 0} />
                  <DonutKpi color="#999999" label="Severity 1"            value={rpt.counts[1] || 0} />
                </div>
                <table style={qStyles.table}>
                  <thead><tr><th style={qStyles.th}>Sev</th><th style={qStyles.th}>QID</th><th style={qStyles.th}>Title</th><th style={qStyles.th}>CVE</th><th style={qStyles.th}>Host</th></tr></thead>
                  <tbody>
                    {rpt.findings.slice().sort((a, b) => b.severity - a.severity).map((f, i) => (
                      <tr key={i}>
                        <td style={qStyles.td}><QualysSevPill level={f.severity} /></td>
                        <td style={{ ...qStyles.td, fontFamily: "'Space Mono',monospace" }}>{f.qid}</td>
                        <td style={qStyles.td}>{f.name}</td>
                        <td style={{ ...qStyles.td, fontFamily: "'Space Mono',monospace" }}>{f.cve || '—'}</td>
                        <td style={qStyles.td}>{f.host}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {showNewTicket && <NewTicketModal findings={rpt.findings} onSave={(qid, host, owner) => createTicket(qid, host, owner)} onCancel={() => setShowNewTicket(false)} />}
              </div>
            );
          })()}
          {phase === 'reports' && (
            <div style={qStyles.pad}>
              <h1 style={qStyles.h1}>Reports</h1>
              <table style={qStyles.table}>
                <thead><tr><th style={qStyles.th}>Type</th><th style={qStyles.th}>Source Scan</th><th style={qStyles.th}>Generated</th></tr></thead>
                <tbody>
                  {reports.length === 0 ? <tr><td colSpan="3" style={qStyles.empty}>(No reports yet.)</td></tr>
                  : reports.map(r => <tr key={r.id}><td style={qStyles.td}>Detection</td><td style={qStyles.td}>{r.name}</td><td style={qStyles.td}>{r.finished}</td></tr>)}
                </tbody>
              </table>
            </div>
          )}
          {phase === 'tickets' && (
            <div style={qStyles.pad}>
              <h1 style={qStyles.h1}>Remediation Tickets</h1>
              <table style={qStyles.table}>
                <thead><tr><th style={qStyles.th}>Ticket</th><th style={qStyles.th}>QID</th><th style={qStyles.th}>Host</th><th style={qStyles.th}>Owner</th><th style={qStyles.th}>State</th><th style={qStyles.th}>Created</th></tr></thead>
                <tbody>
                  {tickets.length === 0 ? <tr><td colSpan="6" style={qStyles.empty}>(No tickets yet.)</td></tr>
                  : tickets.map(t => <tr key={t.id}><td style={qStyles.td}>{t.id}</td><td style={qStyles.td}>{t.qid}</td><td style={qStyles.td}>{t.host}</td><td style={qStyles.td}>{t.owner}</td><td style={qStyles.td}>{t.state}</td><td style={qStyles.td}>{t.created}</td></tr>)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  function QualysSevPill({ level }) {
    const map = { 5: { c: '#CC0000', t: 'Crit' }, 4: { c: '#FF8C00', t: 'High' }, 3: { c: '#FFD700', t: 'Med' }, 2: { c: '#3399CC', t: 'Low' }, 1: { c: '#999', t: 'Info' } };
    const v = map[level] || { c: '#999', t: '?' };
    return <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 2, background: v.c, color: level === 3 ? '#000' : '#fff', fontSize: 10, fontWeight: 700 }}>{v.t}</span>;
  }
  function DonutKpi({ color, label, value }) {
    return (
      <div style={qStyles.donut}>
        <div style={{ ...qStyles.donutRing, borderColor: color }}>
          <div style={qStyles.donutVal}>{value}</div>
        </div>
        <div style={qStyles.donutLabel}>{label}</div>
      </div>
    );
  }

  function NewAssetModal({ onSave, onCancel }) {
    const [name, setName] = React.useState('APP-DB-02');
    const [ip, setIp] = React.useState('10.10.24.21');
    return (
      <Modal onCancel={onCancel} accent="#cc0033" title="Add Host Asset">
        <Field label="Asset Name"><input value={name} onChange={(e) => setName(e.target.value)} style={modalStyles.input} /></Field>
        <Field label="IP Address"><input value={ip} onChange={(e) => setIp(e.target.value)} style={modalStyles.input} /></Field>
        <Field label="Tracking Method"><select style={modalStyles.input}><option>IP</option><option>DNS</option><option>NetBIOS</option><option>Qualys Host ID</option></select></Field>
        <ModalActions onCancel={onCancel} accent="#cc0033" onSave={() => onSave(name, ip)} />
      </Modal>
    );
  }
  function NewQualysScanModal({ assets, onSave, onCancel }) {
    const [name, setName] = React.useState('Internal_Subnet_Scan');
    const [asset, setAsset] = React.useState((assets[0] && assets[0].name) || '');
    const [type, setType] = React.useState('Internal Scan');
    return (
      <Modal onCancel={onCancel} accent="#cc0033" title="New Scan">
        <Field label="Scan Title"><input value={name} onChange={(e) => setName(e.target.value)} style={modalStyles.input} /></Field>
        <Field label="Target Asset"><select value={asset} onChange={(e) => setAsset(e.target.value)} style={modalStyles.input}>{assets.map(a => <option key={a.id} value={a.name}>{a.name} — {a.ip}</option>)}</select></Field>
        <Field label="Scan Type"><select value={type} onChange={(e) => setType(e.target.value)} style={modalStyles.input}><option>Internal Scan</option><option>External Scan</option><option>Discovery Scan</option></select></Field>
        <Field label="Option Profile"><select style={modalStyles.input}><option>Initial Options</option><option>PCI Options</option><option>Comprehensive</option></select></Field>
        <ModalActions onCancel={onCancel} accent="#cc0033" onSave={() => onSave(name, asset, type)} />
      </Modal>
    );
  }
  function NewTicketModal({ findings, onSave, onCancel }) {
    const sevFive = findings.filter(f => f.severity === 5);
    const first = sevFive[0] || findings[0];
    const [qid, setQid] = React.useState(first ? String(first.qid) : '');
    const [host, setHost] = React.useState(first ? first.host : '');
    const [owner, setOwner] = React.useState('helpdesk-admin');
    return (
      <Modal onCancel={onCancel} accent="#cc0033" title="New Remediation Ticket">
        <Field label="QID"><input value={qid} onChange={(e) => setQid(e.target.value)} style={modalStyles.input} /></Field>
        <Field label="Host"><input value={host} onChange={(e) => setHost(e.target.value)} style={modalStyles.input} /></Field>
        <Field label="Assignee"><input value={owner} onChange={(e) => setOwner(e.target.value)} style={modalStyles.input} /></Field>
        <Field label="Due Date"><input style={modalStyles.input} placeholder="2026-05-01" /></Field>
        <ModalActions onCancel={onCancel} accent="#cc0033" onSave={() => onSave(qid, host, owner)} />
      </Modal>
    );
  }

  function tabBtn(active) {
    return { background: active ? '#fff' : 'transparent', color: active ? '#cc0033' : '#fff', border: 'none', padding: '10px 18px', fontFamily: "'Inter',sans-serif", fontSize: 13, cursor: 'pointer', fontWeight: 700, letterSpacing: 0.5 };
  }
  function subBtn(active) {
    return { background: active ? '#f4f4f4' : 'transparent', color: '#1a1a1a', border: 'none', padding: '8px 16px', fontFamily: "'Inter',sans-serif", fontSize: 12, cursor: 'pointer', borderBottom: active ? '2px solid #cc0033' : '2px solid transparent' };
  }

  const qStyles = {
    appRoot: { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 520, background: '#f4f4f4', fontFamily: "'Inter',sans-serif", color: '#1a1a1a', position: 'relative' },
    appHeader: { background: '#cc0033', color: '#fff', display: 'flex', alignItems: 'center' },
    brand: { padding: '10px 16px', fontWeight: 800, letterSpacing: 0.6, borderRight: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'baseline', gap: 4 },
    brandSub: { fontSize: 10, fontWeight: 600, opacity: 0.85 },
    tabBar: { display: 'flex' },
    appUser: { marginLeft: 'auto', padding: '0 14px', color: '#fff', fontSize: 12 },
    subNav: { display: 'flex', borderBottom: '1px solid #d4d4d4', background: '#fff' },
    appBody: { flex: 1, overflow: 'auto', background: '#f4f4f4' },
    pad: { padding: '14px 18px' },
    h1: { fontSize: 16, fontWeight: 600, margin: '0 0 12px' },
    toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    primaryBtn: { background: '#cc0033', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 2, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
    smallBtn: { background: '#cc0033', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: 2, cursor: 'pointer', fontSize: 11 },
    table: { width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #d4d4d4', fontSize: 12 },
    th: { textAlign: 'left', padding: '6px 10px', background: '#ececec', borderBottom: '1px solid #d4d4d4', fontWeight: 600 },
    td: { padding: '6px 10px', borderBottom: '1px solid #ececec' },
    empty: { padding: '12px 10px', color: '#888', fontStyle: 'italic' },
    muted: { fontSize: 12, color: '#666' },
    kpiRow: { display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' },
    donut: { textAlign: 'center', minWidth: 110 },
    donutRing: { width: 76, height: 76, borderRadius: 38, border: '6px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' },
    donutVal: { fontSize: 22, fontWeight: 700 },
    donutLabel: { fontSize: 10, color: '#666', marginTop: 4 },
  };

  // ─────────────────────────────────────────────────────────────────
  //  OWASP ZAP  — vm-4
  // ─────────────────────────────────────────────────────────────────
  function ZAPLabShell(props) {
    const [phase, setPhase] = React.useState('install');
    const [installState, setInstallState] = React.useState({ extracted: false, started: false });
    const [proxyConfigured, setProxyConfigured] = React.useState(false);
    const [tabId, setTabId] = React.useState('history');
    const [siteOpen, setSiteOpen] = React.useState({ 'app.example.local': false });
    const [history, setHistory] = React.useState([]);
    const [alerts, setAlerts] = React.useState([]);
    const [activeAlertId, setActiveAlertId] = React.useState(null);
    const [activeScanRunning, setActiveScanRunning] = React.useState(false);
    const [activeScanDone, setActiveScanDone] = React.useState(false);
    const [reportGenerated, setReportGenerated] = React.useState(false);

    function installLine(cmd) {
      let stdout = '';
      if (/^tar\s+-xvf\s+ZAP_/.test(cmd)) {
        stdout = 'ZAP_2.14.0/\nZAP_2.14.0/zap.sh\nZAP_2.14.0/zap-2.14.0.jar\nZAP_2.14.0/db/\nZAP_2.14.0/lang/\nZAP_2.14.0/license/\n';
        setInstallState(s => ({ ...s, extracted: true }));
      } else if (/^cd\s+ZAP_/.test(cmd)) {
        stdout = '';
      } else if (/^\.\/zap\.sh/.test(cmd)) {
        stdout = 'Found Java version 17.0.10\nAvailable memory: 8192 MB\n2026-04-23 09:15:42 INFO  - ZAP starting\n2026-04-23 09:15:43 INFO  - Started Local Proxy on 127.0.0.1:8080\n2026-04-23 09:15:44 INFO  - GUI ready\n';
        setInstallState(s => ({ ...s, started: true }));
        setPhase('app');
      } else if (/^sudo\s+apt\s+install\s+zaproxy/.test(cmd)) {
        stdout = 'Reading package lists... Done\nThe following NEW packages will be installed:\n  zaproxy\nUnpacking zaproxy (2.14.0-1) ...\nSetting up zaproxy (2.14.0-1) ...\n';
        setInstallState(s => ({ ...s, extracted: true }));
      } else {
        stdout = `bash: ${cmd}: command not found\n`;
      }
      emit(props, `cli:${cmd}`, { stdout, phase: 'install' });
      return { stdout };
    }

    function configureProxy() {
      setProxyConfigured(true);
      emit(props, 'ui:proxy.configure host=127.0.0.1 port=8080', { phase: 'app' });
    }

    function browseTarget() {
      if (!proxyConfigured) return;
      const seed = [
        { method: 'GET',  url: 'https://app.example.local/',                     status: 200, size: 4128 },
        { method: 'GET',  url: 'https://app.example.local/static/app.js',        status: 200, size: 88231 },
        { method: 'GET',  url: 'https://app.example.local/static/main.css',      status: 200, size: 12882 },
        { method: 'GET',  url: 'https://app.example.local/products',             status: 200, size: 9112 },
        { method: 'GET',  url: 'https://app.example.local/products?id=1',        status: 200, size: 4012 },
        { method: 'GET',  url: 'https://app.example.local/cart',                 status: 200, size: 6234 },
        { method: 'POST', url: 'https://app.example.local/cart/add',             status: 200, size: 412 },
        { method: 'GET',  url: 'https://app.example.local/account',              status: 200, size: 5128 },
        { method: 'POST', url: 'https://app.example.local/account/update',       status: 302, size: 0 },
        { method: 'GET',  url: 'https://app.example.local/search?q=webcam',      status: 200, size: 3189 },
      ];
      setHistory(seed);
      setSiteOpen({ 'app.example.local': true });
      emit(props, 'ui:browse target=https://app.example.local/', { count: seed.length });
    }

    function startActiveScan() {
      setActiveScanRunning(true);
      window.setTimeout(() => {
        setActiveScanRunning(false);
        setActiveScanDone(true);
        setAlerts(ZAP_ALERTS.slice());
      }, 350);
      emit(props, 'ui:active-scan.start target=https://app.example.local/', {});
    }

    function openAlert(id) {
      setActiveAlertId(id);
      emit(props, `ui:alerts.open id=${id}`);
    }

    function generateReport(format) {
      setReportGenerated(true);
      emit(props, `ui:report.generate format=${format}`, { format });
    }

    if (phase === 'install') {
      return (
        <div style={zStyles.installRoot}>
          <div style={zStyles.installHeader}>
            <span style={zStyles.brand}>OWASP ZAP</span>
            <span style={zStyles.installSub}>Zed Attack Proxy 2.14.0 — installer</span>
          </div>
          <div style={zStyles.installBody}>
            <div style={zStyles.installCopy}>
              Extract the downloaded ZAP archive (or run <code>sudo apt install zaproxy</code>) and launch
              <code> zap.sh</code> to bring up the Java GUI on local proxy <code>127.0.0.1:8080</code>.
            </div>
            <ul style={zStyles.installChecklist}>
              <li style={installState.extracted ? zStyles.checkOn : zStyles.checkOff}>{installState.extracted ? '✔' : '○'} ZAP extracted / installed</li>
              <li style={installState.started ? zStyles.checkOn : zStyles.checkOff}>{installState.started ? '✔' : '○'} zap.sh launched (proxy on 127.0.0.1:8080)</li>
            </ul>
            <InstallConsole onLine={installLine} prompt="student@b2b:~$" placeholder="tar -xvf ZAP_2.14.0_Linux.tar.gz" greeting="OWASP ZAP installation console — paste each upstream command in order." />
          </div>
        </div>
      );
    }

    return (
      <div style={zStyles.appRoot}>
        <header style={zStyles.appHeader}>
          <span style={zStyles.brand}>OWASP ZAP 2.14.0</span>
          <nav style={zStyles.menuBar}>
            <span style={zStyles.menuItem}>File</span>
            <span style={zStyles.menuItem}>Edit</span>
            <span style={zStyles.menuItem}>View</span>
            <span style={zStyles.menuItem}>Analyse</span>
            <span style={zStyles.menuItem}>Report</span>
            <span style={zStyles.menuItem}>Tools</span>
            <span style={zStyles.menuItem}>Help</span>
          </nav>
        </header>
        <div style={zStyles.toolbar}>
          <button style={zStyles.toolbarBtn} onClick={configureProxy} disabled={proxyConfigured}>{proxyConfigured ? '✓ Proxy 127.0.0.1:8080' : 'Configure Proxy 127.0.0.1:8080'}</button>
          <button style={zStyles.toolbarBtn} onClick={browseTarget} disabled={!proxyConfigured || history.length > 0}>Browse https://app.example.local/</button>
          <button style={zStyles.toolbarBtn} onClick={startActiveScan} disabled={history.length === 0 || activeScanRunning || activeScanDone}>▶ Active Scan</button>
          <button style={zStyles.toolbarBtn} onClick={() => generateReport('html')} disabled={!activeScanDone}>Generate HTML Report</button>
          {activeScanRunning && <span style={zStyles.runningPill}>Active Scan running…</span>}
        </div>
        <div style={zStyles.threePane}>
          <aside style={zStyles.sitesPane}>
            <div style={zStyles.paneTitle}>Sites</div>
            <ul style={zStyles.tree}>
              {Object.keys(siteOpen).map(host => (
                <li key={host}>
                  <span style={zStyles.treeNode}>{siteOpen[host] ? '▼' : '▶'} https://{host}</span>
                  {siteOpen[host] && (
                    <ul style={zStyles.subtree}>
                      {Array.from(new Set(history.map(h => h.url))).map(u => <li key={u} style={zStyles.subtreeNode}>{u.replace('https://' + host, '') || '/'}</li>)}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            <div style={zStyles.paneTitle}>Alerts</div>
            <ul style={zStyles.tree}>
              {['High','Medium','Low','Informational'].map(risk => {
                const sub = alerts.filter(a => a.risk === risk);
                if (sub.length === 0) return null;
                return (
                  <li key={risk}>
                    <span style={{ ...zStyles.treeNode, color: SEVERITY_TINT[risk] }}>● {risk} ({sub.length})</span>
                    <ul style={zStyles.subtree}>
                      {sub.map(a => <li key={a.id + a.url} style={zStyles.subtreeNode} onClick={() => openAlert(a.id)}>{a.name}</li>)}
                    </ul>
                  </li>
                );
              })}
            </ul>
          </aside>
          <main style={zStyles.mainPane}>
            <div style={zStyles.tabRow}>
              <button onClick={() => { setTabId('history');  emit(props, 'ui:tab History'); }}    style={zTab(tabId === 'history')}>History</button>
              <button onClick={() => { setTabId('search');   emit(props, 'ui:tab Search'); }}     style={zTab(tabId === 'search')}>Search</button>
              <button onClick={() => { setTabId('alerts');   emit(props, 'ui:tab Alerts'); }}     style={zTab(tabId === 'alerts')}>Alerts</button>
              <button onClick={() => { setTabId('output');   emit(props, 'ui:tab Output'); }}     style={zTab(tabId === 'output')}>Output</button>
              <button onClick={() => { setTabId('active');   emit(props, 'ui:tab ActiveScan'); }} style={zTab(tabId === 'active')}>Active Scan</button>
              <button onClick={() => { setTabId('repeater'); emit(props, 'ui:tab Repeater'); }}   style={zTab(tabId === 'repeater')}>Repeater</button>
            </div>
            <div style={zStyles.tabBody}>
              {tabId === 'history' && (
                <table style={zStyles.table}>
                  <thead><tr><th style={zStyles.th}>#</th><th style={zStyles.th}>Method</th><th style={zStyles.th}>URL</th><th style={zStyles.th}>Code</th><th style={zStyles.th}>Size</th></tr></thead>
                  <tbody>
                    {history.length === 0 ? <tr><td colSpan="5" style={zStyles.empty}>(History empty — configure proxy and browse target.)</td></tr>
                    : history.map((h, i) => <tr key={i}><td style={zStyles.td}>{i + 1}</td><td style={zStyles.td}>{h.method}</td><td style={zStyles.td}>{h.url}</td><td style={zStyles.td}>{h.status}</td><td style={zStyles.td}>{h.size}</td></tr>)}
                  </tbody>
                </table>
              )}
              {tabId === 'alerts' && (
                <table style={zStyles.table}>
                  <thead><tr><th style={zStyles.th}>Risk</th><th style={zStyles.th}>Confidence</th><th style={zStyles.th}>Name</th><th style={zStyles.th}>URL</th><th style={zStyles.th}>CWE</th></tr></thead>
                  <tbody>
                    {alerts.length === 0 ? <tr><td colSpan="5" style={zStyles.empty}>(Run Active Scan to populate alerts.)</td></tr>
                    : alerts.map(a => <tr key={a.id + a.url} onClick={() => openAlert(a.id)} style={{ cursor: 'pointer' }}>
                        <td style={zStyles.td}><SeverityBadge level={a.risk} /></td>
                        <td style={zStyles.td}>{a.confidence}</td>
                        <td style={zStyles.td}>{a.name}</td>
                        <td style={zStyles.td}>{a.url}</td>
                        <td style={zStyles.td}>{a.cwe}</td>
                      </tr>)}
                  </tbody>
                </table>
              )}
              {tabId === 'output' && (
                <pre style={zStyles.pre}>
                  {`2026-04-23 09:15:43 INFO  - ZAP starting\n2026-04-23 09:15:43 INFO  - Started Local Proxy on 127.0.0.1:8080\n2026-04-23 09:15:44 INFO  - GUI ready\n`}
                  {activeScanDone ? `2026-04-23 09:33:18 INFO  - Active Scan finished — ${alerts.length} alerts\n` : ''}
                  {reportGenerated ? `2026-04-23 09:35:02 INFO  - Report saved to /home/student/zap-report.html\n` : ''}
                </pre>
              )}
              {tabId === 'active'   && <div style={zStyles.pad}>{activeScanDone ? `Active Scan complete — ${alerts.length} alerts.` : activeScanRunning ? 'Scanning…' : 'Click ▶ Active Scan to start.'}</div>}
              {tabId === 'repeater' && <div style={zStyles.pad}>Right-click a request in History → Open in Repeater. (Demo placeholder.)</div>}
              {tabId === 'search'   && <div style={zStyles.pad}>Search across requests / responses (placeholder).</div>}
            </div>
          </main>
          <aside style={zStyles.detailsPane}>
            <div style={zStyles.paneTitle}>{activeAlertId ? 'Alert Details' : 'Request / Response'}</div>
            {activeAlertId ? (() => {
              const a = alerts.find(x => x.id === activeAlertId);
              if (!a) return <div style={zStyles.muted}>(no alert)</div>;
              return (
                <div style={zStyles.detailBox}>
                  <div><strong>Risk:</strong> <SeverityBadge level={a.risk} /></div>
                  <div><strong>Confidence:</strong> {a.confidence}</div>
                  <div><strong>Name:</strong> {a.name}</div>
                  <div style={zStyles.kv}><strong>URL:</strong> {a.url}</div>
                  <div><strong>Param:</strong> {a.param || '(none)'}</div>
                  <div><strong>CWE:</strong> {a.cwe} · <strong>WASC:</strong> {a.wasc}</div>
                  <div><strong>Evidence:</strong> <code>{a.evidence || '—'}</code></div>
                </div>
              );
            })() : <div style={zStyles.muted}>Select a row in History or Alerts to inspect.</div>}
          </aside>
        </div>
      </div>
    );
  }

  function zTab(active) {
    return { background: active ? '#fff' : '#e9eef2', color: '#1a1a1a', border: '1px solid #cdd5dd', borderBottom: active ? 'none' : '1px solid #cdd5dd', padding: '5px 12px', fontSize: 11, cursor: 'pointer', fontFamily: "'Inter',sans-serif" };
  }

  const zStyles = {
    installRoot: { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 520, background: '#fff', color: '#1a1a1a', fontFamily: "'Inter',sans-serif" },
    installHeader: { background: '#0b6dbf', color: '#fff', padding: '10px 18px', display: 'flex', alignItems: 'baseline', gap: 12 },
    brand: { fontWeight: 700, letterSpacing: 0.4, padding: '8px 14px' },
    installSub: { fontSize: 11, opacity: 0.85 },
    installBody: { padding: 16, overflow: 'auto', flex: 1 },
    installCopy: { fontSize: 13, lineHeight: 1.55, marginBottom: 12 },
    installChecklist: { listStyle: 'none', padding: 0, margin: '8px 0 12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 4, fontSize: 12 },
    checkOn: { color: '#0b6dbf' },
    checkOff: { color: '#888' },

    appRoot: { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 520, background: '#e9eef2', fontFamily: "'Inter',sans-serif", color: '#1a1a1a' },
    appHeader: { background: '#0b6dbf', color: '#fff', display: 'flex', alignItems: 'center' },
    menuBar: { display: 'flex', gap: 8, marginLeft: 12 },
    menuItem: { padding: '6px 8px', fontSize: 12, opacity: 0.9 },
    toolbar: { display: 'flex', gap: 8, padding: '8px 14px', borderBottom: '1px solid #c8d0d8', background: '#f4f7fa', alignItems: 'center', flexWrap: 'wrap' },
    toolbarBtn: { background: '#e6edf4', color: '#1a1a1a', border: '1px solid #c8d0d8', padding: '5px 12px', fontSize: 11, cursor: 'pointer', borderRadius: 2 },
    runningPill: { fontSize: 11, color: '#0b6dbf', fontFamily: "'Space Mono',monospace" },
    threePane: { flex: 1, display: 'grid', gridTemplateColumns: '220px 1fr 280px', minHeight: 0 },
    sitesPane: { background: '#fff', borderRight: '1px solid #c8d0d8', overflow: 'auto', padding: 8 },
    mainPane: { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    detailsPane: { background: '#fff', borderLeft: '1px solid #c8d0d8', overflow: 'auto', padding: 8 },
    paneTitle: { fontFamily: "'Inter',sans-serif", fontSize: 11, fontWeight: 700, padding: '4px 6px', color: '#0b6dbf', borderBottom: '1px solid #e3e8ec', marginBottom: 6 },
    tree: { listStyle: 'none', padding: 0, margin: 0, fontSize: 12 },
    treeNode: { display: 'block', padding: '2px 6px', cursor: 'pointer', userSelect: 'none' },
    subtree: { listStyle: 'none', paddingLeft: 16, margin: 0 },
    subtreeNode: { padding: '2px 6px', cursor: 'pointer' },
    tabRow: { display: 'flex', borderBottom: '1px solid #c8d0d8', background: '#dbe2e8', padding: '4px 6px 0' },
    tabBody: { flex: 1, overflow: 'auto', background: '#fff' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
    th: { textAlign: 'left', padding: '4px 8px', background: '#e1e7ee', borderBottom: '1px solid #c8d0d8', fontWeight: 600, position: 'sticky', top: 0 },
    td: { padding: '4px 8px', borderBottom: '1px solid #ececf2' },
    empty: { padding: '12px 10px', color: '#888', fontStyle: 'italic' },
    pre: { padding: 12, fontFamily: "'Space Mono',monospace", fontSize: 11, color: '#1a1a1a', whiteSpace: 'pre-wrap' },
    pad: { padding: 12, fontSize: 12 },
    detailBox: { fontSize: 12, lineHeight: 1.6, padding: 4 },
    kv: { wordBreak: 'break-all' },
    muted: { fontSize: 12, color: '#888', padding: 4 },
  };

  // ─────────────────────────────────────────────────────────────────
  //  WSUS  — vm-5
  // ─────────────────────────────────────────────────────────────────
  function WSUSLabShell(props) {
    const [phase, setPhase] = React.useState('serverManager');
    const [serverState, setServerState] = React.useState({ rolesAdded: false, configWizard: false, gpoLinked: false });
    const [updates, setUpdates] = React.useState(WSUS_UPDATES.map(u => ({ ...u, approved: false, approvedFor: null })));
    const [groupCmdRan, setGroupCmdRan] = React.useState(false);
    const [reportGenerated, setReportGenerated] = React.useState(false);
    const [selectedNode, setSelectedNode] = React.useState('updates.all');

    function navigateNode(node) {
      setSelectedNode(node);
      emit(props, `ui:tree.select ${node}`, { node });
    }

    function addRole() {
      setServerState(s => ({ ...s, rolesAdded: true }));
      emit(props, 'ui:serverManager.addRole role=Windows Server Update Services', {});
    }

    function runConfigWizard(source, schedule) {
      setServerState(s => ({ ...s, configWizard: true }));
      emit(props, `ui:wsus.configWizard source=${source} schedule=${schedule}`, {});
      setPhase('console');
    }

    function linkGpo() {
      setServerState(s => ({ ...s, gpoLinked: true }));
      emit(props, 'ui:gpmc.linkGpo target=Workstations OU=Corp/Workstations', {});
    }

    function approveUpdate(kb, group) {
      setUpdates(prev => prev.map(u => u.kb === kb ? { ...u, approved: true, approvedFor: group } : u));
      emit(props, `ui:updates.approve kb=${kb} group=${group}`, { kb, group });
    }

    function generateReport() {
      setReportGenerated(true);
      emit(props, 'ui:reports.generate type=Update Status Summary', {});
      setPhase('reports');
    }

    if (phase === 'serverManager') {
      return (
        <div style={wsStyles.smRoot}>
          <header style={wsStyles.smHeader}>
            <div style={wsStyles.smTitle}>Server Manager · DC-01.corp.example.local</div>
          </header>
          <div style={wsStyles.smBody}>
            <h1 style={wsStyles.h1}>Manage › Add Roles and Features Wizard</h1>
            <ol style={wsStyles.smSteps}>
              <li>Before You Begin</li>
              <li>Installation Type ▸ Role-based or feature-based</li>
              <li>Server Selection ▸ DC-01.corp.example.local</li>
              <li><strong>Server Roles ▸ ✔ Windows Server Update Services</strong></li>
              <li>Features ▸ default</li>
              <li>WSUS ▸ Role Services ▸ WID Database / WSUS Services</li>
              <li>Content ▸ <code>C:\\WSUS</code></li>
              <li>Confirmation ▸ Install</li>
            </ol>
            {!serverState.rolesAdded ? (
              <button onClick={addRole} style={wsStyles.smBtn}>Install</button>
            ) : (
              <div>
                <div style={wsStyles.installOk}>✔ WSUS role installed — post-deployment task: Launch Post-Installation tasks</div>
                <button onClick={() => setPhase('wsusConfig')} style={wsStyles.smBtn}>Launch WSUS Configuration Wizard →</button>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (phase === 'wsusConfig') {
      return <WSUSConfigWizard onComplete={runConfigWizard} />;
    }

    if (phase === 'cmd') {
      return (
        <div style={wsStyles.cmdRoot}>
          <header style={wsStyles.cmdHeader}>Command Prompt · WKSTN-15.corp.example.local · Run as administrator</header>
          <div style={wsStyles.cmdBody}>
            <InstallConsole onLine={(c) => {
              if (/^wuauclt\s+\/detectnow/.test(c)) {
                setGroupCmdRan(true);
                const stdout = 'WUAUCLT: Triggering automatic update detection cycle...\nUpdate ready to install: ' + updates.filter(u => u.approved).map(u => u.kb).join(', ') + '\n';
                emit(props, 'cli:wuauclt /detectnow', { stdout, phase: 'cmd' });
                return { stdout };
              }
              if (/^gpupdate/.test(c)) {
                const stdout = 'Updating policy...\nUser Policy update has completed successfully.\nComputer Policy update has completed successfully.\n';
                emit(props, `cli:${c}`, { stdout, phase: 'cmd' });
                return { stdout };
              }
              const stdout = `'${c}' is not recognized as an internal or external command,\noperable program or batch file.\n`;
              return { stdout };
            }} prompt="C:\\Users\\admin>" placeholder="wuauclt /detectnow" greeting={`Microsoft Windows [Version 10.0.19045.4170]\n(c) Microsoft Corporation. All rights reserved.\n`} />
            {groupCmdRan && (
              <button style={wsStyles.smBtn} onClick={() => setPhase('console')}>Return to WSUS Console →</button>
            )}
          </div>
        </div>
      );
    }

    if (phase === 'reports') {
      return (
        <div style={wsStyles.consoleRoot}>
          <header style={wsStyles.consoleHeader}><div style={wsStyles.menuBar}>Update Services Console — Reports</div></header>
          <div style={wsStyles.pad}>
            <h1 style={wsStyles.h1}>Update Status Summary Report</h1>
            <table style={wsStyles.table}>
              <thead><tr><th style={wsStyles.th}>KB</th><th style={wsStyles.th}>Title</th><th style={wsStyles.th}>Approved For</th><th style={wsStyles.th}>Installed</th><th style={wsStyles.th}>Pending</th><th style={wsStyles.th}>Failed</th></tr></thead>
              <tbody>
                {updates.filter(u => u.approved).map(u => (
                  <tr key={u.kb}>
                    <td style={wsStyles.td}>{u.kb}</td>
                    <td style={wsStyles.td}>{u.title}</td>
                    <td style={wsStyles.td}>{u.approvedFor || 'All Computers'}</td>
                    <td style={wsStyles.td}>{groupCmdRan ? 1 : 0}</td>
                    <td style={wsStyles.td}>{groupCmdRan ? 0 : 1}</td>
                    <td style={wsStyles.td}>0</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button style={{ ...wsStyles.smBtn, marginTop: 12 }} onClick={() => setPhase('console')}>← Back to Console</button>
          </div>
        </div>
      );
    }

    const updatesView = (() => {
      if (selectedNode === 'updates.security')   return updates.filter(u => u.cls === 'Security Updates');
      if (selectedNode === 'updates.critical')   return updates.filter(u => u.cls === 'Critical Updates');
      if (selectedNode === 'updates.definition') return updates.filter(u => u.cls === 'Definition Updates');
      return updates;
    })();

    return (
      <div style={wsStyles.consoleRoot}>
        <header style={wsStyles.consoleHeader}>
          <div style={wsStyles.menuBar}>
            <span style={wsStyles.menuItem}>File</span>
            <span style={wsStyles.menuItem}>Action</span>
            <span style={wsStyles.menuItem}>View</span>
            <span style={wsStyles.menuItem}>Help</span>
          </div>
          <div style={wsStyles.consoleTitle}>Update Services — DC-01\Updates</div>
        </header>
        <div style={wsStyles.threePane}>
          <aside style={wsStyles.tree}>
            <div style={wsStyles.treeNode}>📁 Update Services</div>
            <div style={wsStyles.treeNodeSub}>📁 DC-01.corp.example.local</div>
            <div style={wsStyles.treeNodeSubSub} onClick={() => navigateNode('updates.all')}>📁 Updates</div>
            <div style={{ ...wsStyles.treeLeaf, fontWeight: selectedNode === 'updates.all' ? 700 : 400 }} onClick={() => navigateNode('updates.all')}>All Updates</div>
            <div style={{ ...wsStyles.treeLeaf, fontWeight: selectedNode === 'updates.critical' ? 700 : 400 }} onClick={() => navigateNode('updates.critical')}>Critical Updates</div>
            <div style={{ ...wsStyles.treeLeaf, fontWeight: selectedNode === 'updates.security' ? 700 : 400 }} onClick={() => navigateNode('updates.security')}>Security Updates</div>
            <div style={{ ...wsStyles.treeLeaf, fontWeight: selectedNode === 'updates.definition' ? 700 : 400 }} onClick={() => navigateNode('updates.definition')}>Definition Updates</div>
            <div style={wsStyles.treeNodeSubSub} onClick={() => navigateNode('computers.all')}>📁 Computers</div>
            <div style={{ ...wsStyles.treeLeaf, fontWeight: selectedNode === 'computers.all' ? 700 : 400 }} onClick={() => navigateNode('computers.all')}>All Computers</div>
            <div style={{ ...wsStyles.treeLeaf, fontWeight: selectedNode === 'computers.workstations' ? 700 : 400 }} onClick={() => navigateNode('computers.workstations')}>Workstations</div>
            <div style={wsStyles.treeNodeSubSub} onClick={() => navigateNode('synchronizations')}>📁 Synchronizations</div>
            <div style={wsStyles.treeNodeSubSub} onClick={() => navigateNode('reports')}>📁 Reports</div>
          </aside>
          <main style={wsStyles.results}>
            <div style={wsStyles.resultsHeader}>
              {selectedNode === 'updates.all' && 'All Updates'}
              {selectedNode === 'updates.security' && 'Security Updates'}
              {selectedNode === 'updates.critical' && 'Critical Updates'}
              {selectedNode === 'updates.definition' && 'Definition Updates'}
              {selectedNode === 'computers.all' && 'All Computers'}
              {selectedNode === 'computers.workstations' && 'Workstations'}
              {selectedNode === 'synchronizations' && 'Synchronizations'}
              {selectedNode === 'reports' && 'Reports'}
            </div>
            {selectedNode.startsWith('updates') && (
              <table style={wsStyles.table}>
                <thead><tr><th style={wsStyles.th}>Approved</th><th style={wsStyles.th}>Title</th><th style={wsStyles.th}>Classification</th><th style={wsStyles.th}>Severity</th><th style={wsStyles.th}>Released</th><th style={wsStyles.th}>Action</th></tr></thead>
                <tbody>
                  {updatesView.map(u => (
                    <tr key={u.kb}>
                      <td style={wsStyles.td}>{u.approved ? '✓ Approved' : 'Not Approved'}</td>
                      <td style={wsStyles.td}>{u.title}</td>
                      <td style={wsStyles.td}>{u.cls}</td>
                      <td style={wsStyles.td}>{u.severity}</td>
                      <td style={wsStyles.td}>{u.released}</td>
                      <td style={wsStyles.td}>{!u.approved && <button style={wsStyles.smBtn} onClick={() => approveUpdate(u.kb, 'All Computers')}>Approve…</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {selectedNode === 'computers.all' && (
              <table style={wsStyles.table}>
                <thead><tr><th style={wsStyles.th}>Computer</th><th style={wsStyles.th}>Last Reported</th><th style={wsStyles.th}>Pending Updates</th></tr></thead>
                <tbody>
                  <tr><td style={wsStyles.td}>WKSTN-15.corp.example.local</td><td style={wsStyles.td}>{groupCmdRan ? '2026-04-23 09:14:22' : '—'}</td><td style={wsStyles.td}>{groupCmdRan ? 0 : updates.filter(u => u.approved).length}</td></tr>
                  <tr><td style={wsStyles.td}>WKSTN-11.corp.example.local</td><td style={wsStyles.td}>2026-04-22 22:03:11</td><td style={wsStyles.td}>{updates.filter(u => u.approved).length}</td></tr>
                  <tr><td style={wsStyles.td}>WKSTN-07.corp.example.local</td><td style={wsStyles.td}>2026-04-22 21:58:42</td><td style={wsStyles.td}>{updates.filter(u => u.approved).length}</td></tr>
                </tbody>
              </table>
            )}
            {selectedNode === 'computers.workstations' && (
              <div style={wsStyles.pad}>Group: Workstations · {serverState.gpoLinked ? '✓ GPO linked' : 'GPO not linked yet'}.
                {!serverState.gpoLinked && <button style={{ ...wsStyles.smBtn, marginLeft: 10 }} onClick={linkGpo}>Open GPMC and link policy →</button>}
              </div>
            )}
            {selectedNode === 'synchronizations' && (
              <div style={wsStyles.pad}>Last sync: 2026-04-23 06:00:00 — 24 new updates downloaded from Microsoft Update.</div>
            )}
            {selectedNode === 'reports' && (
              <div style={wsStyles.pad}>
                <button style={wsStyles.smBtn} onClick={generateReport}>Generate Update Status Summary Report →</button>
              </div>
            )}
          </main>
          <aside style={wsStyles.actions}>
            <div style={wsStyles.actionsTitle}>Actions</div>
            <button style={wsStyles.actionLink} onClick={() => setPhase('cmd')}>Open Command Prompt on Client →</button>
            <button style={wsStyles.actionLink} onClick={generateReport}>Reports…</button>
            <button style={wsStyles.actionLink} onClick={linkGpo} disabled={serverState.gpoLinked}>{serverState.gpoLinked ? '✓ GPO linked' : 'Group Policy Management →'}</button>
          </aside>
        </div>
      </div>
    );
  }

  function WSUSConfigWizard({ onComplete }) {
    const [step, setStep] = React.useState(1);
    const [source, setSource] = React.useState('Microsoft Update');
    const [schedule, setSchedule] = React.useState('Daily 03:00');
    return (
      <div style={wsStyles.wizardRoot}>
        <header style={wsStyles.wizardHeader}>Windows Server Update Services Configuration Wizard</header>
        <div style={wsStyles.wizardBody}>
          {step === 1 && (
            <div>
              <h2>Update Source</h2>
              <Field label="Synchronize from">
                <select value={source} onChange={(e) => setSource(e.target.value)} style={modalStyles.input}>
                  <option>Microsoft Update</option>
                  <option>Another upstream WSUS server</option>
                </select>
              </Field>
              <button style={wsStyles.smBtn} onClick={() => setStep(2)}>Next →</button>
            </div>
          )}
          {step === 2 && (
            <div>
              <h2>Classifications</h2>
              <ul style={wsStyles.checkList}>
                <li>✔ Security Updates</li>
                <li>✔ Critical Updates</li>
                <li>✔ Definition Updates</li>
                <li>○ Drivers</li>
                <li>○ Service Packs</li>
              </ul>
              <button style={wsStyles.smBtn} onClick={() => setStep(3)}>Next →</button>
            </div>
          )}
          {step === 3 && (
            <div>
              <h2>Synchronization Schedule</h2>
              <Field label="Schedule">
                <select value={schedule} onChange={(e) => setSchedule(e.target.value)} style={modalStyles.input}>
                  <option>Daily 03:00</option>
                  <option>Daily 21:00</option>
                  <option>Manual only</option>
                </select>
              </Field>
              <button style={wsStyles.smBtn} onClick={() => onComplete(source, schedule)}>Finish</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const wsStyles = {
    smRoot: { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 520, background: '#fafafa', color: '#1a1a1a', fontFamily: "'Segoe UI', Inter, sans-serif" },
    smHeader: { background: '#0078d4', color: '#fff', padding: '10px 18px', fontSize: 13, fontWeight: 600 },
    smTitle: {},
    smBody: { padding: 18, overflow: 'auto', flex: 1 },
    smSteps: { background: '#fff', border: '1px solid #cfd6dd', padding: 12, marginTop: 8, fontSize: 13, lineHeight: 1.7 },
    smBtn: { background: '#0078d4', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 2, cursor: 'pointer', fontSize: 12, fontWeight: 600, marginTop: 8 },
    installOk: { fontSize: 12, color: '#0d8050', marginBottom: 8 },
    h1: { fontSize: 16, fontWeight: 600, margin: '0 0 12px' },

    wizardRoot: { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 520, background: '#fff', color: '#1a1a1a', fontFamily: "'Segoe UI', Inter, sans-serif" },
    wizardHeader: { background: '#0078d4', color: '#fff', padding: '12px 18px', fontWeight: 600 },
    wizardBody: { padding: 18, overflow: 'auto', flex: 1 },
    checkList: { listStyle: 'none', padding: 0, margin: '6px 0 12px', fontSize: 13 },

    consoleRoot: { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 520, background: '#f5f5f5', color: '#1a1a1a', fontFamily: "'Segoe UI', Inter, sans-serif" },
    consoleHeader: { background: '#e7e7e7', borderBottom: '1px solid #c8c8c8', padding: '4px 10px' },
    consoleTitle: { fontSize: 12, color: '#333', padding: '4px 0' },
    menuBar: { display: 'flex', gap: 12, fontSize: 12 },
    menuItem: { padding: '2px 6px', cursor: 'default' },
    threePane: { flex: 1, display: 'grid', gridTemplateColumns: '230px 1fr 200px', minHeight: 0 },
    tree: { background: '#fff', borderRight: '1px solid #c8c8c8', overflow: 'auto', padding: 6, fontSize: 12 },
    treeNode: { padding: '2px 4px' },
    treeNodeSub: { padding: '2px 0 2px 14px' },
    treeNodeSubSub: { padding: '2px 0 2px 28px' },
    treeLeaf: { padding: '2px 0 2px 44px', cursor: 'pointer' },
    results: { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    resultsHeader: { background: '#dcdcdc', borderBottom: '1px solid #c8c8c8', padding: '4px 10px', fontSize: 12, fontWeight: 600 },
    actions: { background: '#fff', borderLeft: '1px solid #c8c8c8', padding: 8, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 },
    actionsTitle: { fontWeight: 700, color: '#0078d4', borderBottom: '1px solid #e3e8ec', paddingBottom: 4 },
    actionLink: { background: 'none', color: '#0078d4', border: 'none', padding: '2px 0', cursor: 'pointer', textAlign: 'left', fontSize: 12 },
    table: { width: '100%', borderCollapse: 'collapse', background: '#fff', fontSize: 12 },
    th: { textAlign: 'left', padding: '4px 8px', background: '#ececec', borderBottom: '1px solid #c8c8c8', fontWeight: 600, position: 'sticky', top: 0 },
    td: { padding: '4px 8px', borderBottom: '1px solid #ececec' },
    pad: { padding: 12, fontSize: 12 },

    cmdRoot: { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 520, background: '#1a1a1a', color: '#eee' },
    cmdHeader: { background: '#3b3b3b', color: '#fff', padding: '6px 12px', fontSize: 12, fontFamily: "'Segoe UI', Inter, sans-serif" },
    cmdBody: { padding: 12, overflow: 'auto', flex: 1 },
  };

  // ─────────────────────────────────────────────────────────────────
  //  Register on window
  // ─────────────────────────────────────────────────────────────────
  Object.assign(window, {
    OpenVASLabShell,
    NessusLabShell,
    QualysLabShell,
    ZAPLabShell,
    WSUSLabShell,
    MISSION_NEXT_VM_DATA: {
      NESSUS_FINDINGS,
      OPENVAS_FINDINGS,
      QUALYS_FINDINGS,
      ZAP_ALERTS,
      WSUS_UPDATES,
    },
  });
})();
