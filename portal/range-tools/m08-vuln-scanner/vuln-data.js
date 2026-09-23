// Vulnerability Scanner — dataset for Module 8 (Vulnerability prioritization
// and exposure analysis).
//
// Target and findings are ported from the Boots2Bytes SOC Analyst Track's
// "vm-1" OpenVAS Network Scan lab (`src/shells/vuln-management-shells.jsx`'s
// OPENVAS_FINDINGS catalogue and vm-1's target/scenario in
// `src/data/labs/vuln-management.labs.js`), copied as part of the Epic B/C
// migration — see docs/LAB_MIGRATION_MATRIX.md, "Vulnerability management"
// row. Finding names, CVEs, hosts, and CVSS scores are unchanged from the
// source; the OpenVAS-specific OID identifiers were replaced with short
// generic finding IDs, and the tool itself was de-branded per the matrix's
// "prefer one shared engine, vendor-neutral" rule. This is ONE
// representative scan/target/findings workflow (the vm-1 shape), not a port
// of all five branded scanner shells (OpenVAS/Nessus/Qualys/ZAP/WSUS) the
// source app defines — porting all five would duplicate the same learning
// objective five times, which the matrix explicitly recommends against.
//
// A "prioritization rationale" free-text field was added to the task list
// below (task t4) per the matrix row's REQUIRED ADAPTATION note: the source
// lab only asked the student to click through an install/scan/report
// workflow with no reasoning narrative. Static findings with no reasoning
// narrative was the named risk; this dataset's tasks now require writing
// that reasoning, not just clicking a finding.

const M08_VULN_DATASET = {
  id: 'm08-vuln-scan',
  title: 'Branch-Office Subnet Scan',
  subtitle: 'Exposure triage',
  description: 'A new branch-office subnet was added without a formal exposure review. Run a scan against it, validate the findings, and prioritize what needs attention first.',
  target: { name: 'Internal_Subnet', hosts: '10.10.24.0/24', profile: 'Full and fast' },
  findings: [
    { id: 'VULN-001', severity: 'High', cvss: 7.5, name: 'Apache HTTP Server Path Traversal', cve: 'CVE-2021-41773', host: 'WEB-01.corp.example.local' },
    { id: 'VULN-002', severity: 'Critical', cvss: 9.8, name: 'Apache Log4j Remote Code Execution (Log4Shell)', cve: 'CVE-2021-44228', host: 'APP-DB-02.corp.example.local' },
    { id: 'VULN-003', severity: 'Critical', cvss: 9.3, name: 'Microsoft Windows SMBv1 EternalBlue', cve: 'CVE-2017-0144', host: 'FILE-01.corp.example.local' },
    { id: 'VULN-004', severity: 'High', cvss: 7.5, name: 'OpenSSL Heartbleed Information Disclosure', cve: 'CVE-2014-0160', host: 'APP-DB-02.corp.example.local' },
    { id: 'VULN-005', severity: 'High', cvss: 7.4, name: 'OpenSSH < 7.7 User Enumeration', cve: 'CVE-2018-15473', host: 'APP-DB-02.corp.example.local' },
    { id: 'VULN-006', severity: 'Medium', cvss: 5.9, name: 'SSL/TLS: SSLv3 POODLE', cve: 'CVE-2014-3566', host: 'WEB-01.corp.example.local' },
    { id: 'VULN-007', severity: 'Medium', cvss: 5.9, name: 'SSL/TLS: Weak Cipher Suites Supported', cve: 'CVE-2013-2566', host: 'WEB-01.corp.example.local' },
    { id: 'VULN-008', severity: 'Medium', cvss: 5.0, name: 'SSL/TLS: Self-Signed Certificate', cve: null, host: 'WEB-01.corp.example.local' },
    { id: 'VULN-009', severity: 'Medium', cvss: 5.0, name: 'SSH Server CBC Mode Ciphers Enabled', cve: 'CVE-2008-5161', host: 'APP-DB-02.corp.example.local' },
    { id: 'VULN-010', severity: 'Medium', cvss: 5.5, name: 'Apache HTTPD: mod_rewrite Information Disclosure', cve: 'CVE-2019-10092', host: 'WEB-01.corp.example.local' },
    { id: 'VULN-011', severity: 'Low', cvss: 3.7, name: 'TCP timestamps', cve: null, host: 'APP-DB-02.corp.example.local' },
    { id: 'VULN-012', severity: 'Low', cvss: 3.1, name: 'IP Forwarding Enabled', cve: null, host: 'APP-DB-02.corp.example.local' },
    { id: 'VULN-013', severity: 'High', cvss: 7.5, name: 'Microsoft Windows RDP MITM', cve: 'CVE-2005-1794', host: 'WKSTN-15.corp.example.local' },
    { id: 'VULN-014', severity: 'Critical', cvss: 9.0, name: 'Microsoft Badlock SAM/LSAD', cve: 'CVE-2016-0128', host: 'WKSTN-15.corp.example.local' },
    { id: 'VULN-015', severity: 'Medium', cvss: 5.0, name: 'Telnet Service Detected', cve: null, host: '10.10.24.21' },
    { id: 'VULN-016', severity: 'Info', cvss: 0.0, name: 'OS Detection (TCP/IP Fingerprinting)', cve: null, host: '10.10.24.21' },
    { id: 'VULN-017', severity: 'Info', cvss: 0.0, name: 'Service Detection', cve: null, host: '10.10.24.21' },
    { id: 'VULN-018', severity: 'High', cvss: 7.4, name: 'Microsoft Exchange ProxyShell Auth Bypass', cve: 'CVE-2021-34473', host: 'FILE-01.corp.example.local' },
    { id: 'VULN-019', severity: 'High', cvss: 7.5, name: 'OpenSSL 3.0.x < 3.0.7 Buffer Overflow', cve: 'CVE-2022-3786', host: 'WEB-01.corp.example.local' },
    { id: 'VULN-020', severity: 'Medium', cvss: 6.5, name: 'PostgreSQL Default Credentials Detection', cve: null, host: 'APP-DB-02.corp.example.local' },
    { id: 'VULN-021', severity: 'Medium', cvss: 5.4, name: 'HTTP Server: Missing X-Frame-Options', cve: null, host: 'WEB-01.corp.example.local' },
    { id: 'VULN-022', severity: 'Medium', cvss: 5.4, name: 'HTTP Server: Missing Strict-Transport-Security', cve: null, host: 'WEB-01.corp.example.local' },
    { id: 'VULN-023', severity: 'Low', cvss: 2.6, name: 'ICMP Timestamp Reply', cve: null, host: 'APP-DB-02.corp.example.local' },
    { id: 'VULN-024', severity: 'Info', cvss: 0.0, name: 'Traceroute', cve: null, host: 'APP-DB-02.corp.example.local' },
    { id: 'VULN-025', severity: 'High', cvss: 7.4, name: 'PHP < 7.4.30 Multiple Vulnerabilities', cve: 'CVE-2022-31625', host: 'WEB-01.corp.example.local' },
    { id: 'VULN-026', severity: 'Medium', cvss: 6.1, name: 'HTTP Server: Reflected XSS Parameter', cve: null, host: 'WEB-01.corp.example.local' },
    { id: 'VULN-027', severity: 'Critical', cvss: 9.8, name: 'BlueKeep RDP Pre-auth Remote Code Execution', cve: 'CVE-2019-0708', host: 'WKSTN-15.corp.example.local' },
    { id: 'VULN-028', severity: 'High', cvss: 8.1, name: 'Spring4Shell Spring Framework RCE', cve: 'CVE-2022-22965', host: 'APP-DB-02.corp.example.local' },
    { id: 'VULN-029', severity: 'Medium', cvss: 4.3, name: 'Anonymous SMB Share Listing', cve: null, host: 'FILE-01.corp.example.local' },
    { id: 'VULN-030', severity: 'Medium', cvss: 5.3, name: 'NTP Mode 6 Query Vulnerability', cve: 'CVE-2014-9293', host: 'APP-DB-02.corp.example.local' },
  ],
  tasks: [
    { id: 't1', title: 'Isolate the critical findings', points: 10, description: 'Filter the report down to Critical-severity findings only. Submit the resulting count.', hint: 'Use the Critical severity filter chip.', validation: { type: 'filter-count', severity: 'Critical', expected: 4 } },
    { id: 't2', title: 'Scope the public web server', points: 20, description: 'Filter the report to findings on WEB-01.corp.example.local, the internet-facing web server.', hint: 'Use the host filter and choose WEB-01.corp.example.local.', validation: { type: 'filter-count', host: 'WEB-01.corp.example.local', expected: 10 } },
    { id: 't3', title: 'Check the file server for high-impact exposure', points: 30, description: 'Filter to High or Critical findings on FILE-01.corp.example.local. A lower-severity finding on that host is a distractor.', hint: 'Combine the Critical+High severity filter with the FILE-01 host filter.', validation: { type: 'filter-count', severityIn: ['Critical', 'High'], host: 'FILE-01.corp.example.local', expected: 2 } },
    { id: 't4', title: 'Write the prioritization rationale', points: 40, description: 'Select at least two Critical-severity findings and write a short prioritization rationale for each: why it matters, what makes it urgent (or not), and what you would ask before remediating.', hint: 'Click a Critical finding, then use the rationale field in the detail panel. Repeat for a second Critical finding.', validation: { type: 'rationale-count', minLength: 40, minCount: 2, severity: 'Critical' } },
  ],
};

Object.assign(window, { M08_VULN_DATASET });
