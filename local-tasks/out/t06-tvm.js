const TVM_SOFTWARE = [
  { id: 'sw-01', name: 'CodeGenius', vendor: 'TechNova', version: '5.2.3', weaknesses: 4, exposedDevices: 7, threatInsight: 'Exploit available' },
  { id: 'sw-02', name: 'DataMaster Pro', vendor: 'InfoForge', version: '2.8.1', weaknesses: 6, exposedDevices: 12, threatInsight: 'Active alert' },
  { id: 'sw-03', name: 'OfficeSuite Premium', vendor: 'OffiSys', version: '4.5.0', weaknesses: 2, exposedDevices: 28, threatInsight: 'None' },
  { id: 'sw-04', name: 'CryptoSecure', vendor: 'SecuroTech', version: '1.9.3', weaknesses: 7, exposedDevices: 6, threatInsight: 'Exploit available' },
  { id: 'sw-05', name: 'VideoEditor Suite', vendor: 'Vidsoft', version: '3.2.2', weaknesses: 1, exposedDevices: 34, threatInsight: 'Active alert' },
  { id: 'sw-06', name: 'PDFXpert Pro', vendor: 'DocuMaster', version: '3.7', weaknesses: 8, exposedDevices: 21, threatInsight: 'Exploit available' },
  { id: 'sw-07', name: 'ImageMagick Pro', vendor: 'ImagoSys', version: '6.5.4', weaknesses: 3, exposedDevices: 9, threatInsight: 'None' },
  { id: 'sw-08', name: 'AudioMaster XL', vendor: 'Sonicscape', version: '1.2.1', weaknesses: 3, exposedDevices: 6, threatInsight: 'Exploit available' },
  { id: 'sw-09', name: 'SecuritySuite Pro', vendor: 'SecuTech', version: '4.1.5', weaknesses: 6, exposedDevices: 2, threatInsight: 'None' },
  { id: 'sw-10', name: 'DataFlow X', vendor: 'BitStream', version: '3.8', weaknesses: 9, exposedDevices: 14, threatInsight: 'Active alert' }
];

const TVM_CVES = [
  { id: 'cv-01', cve: 'CVE-2026-9001', severity: 'Critical', cvss: 8.5, software: 'CodeGenius', exploitAvailable: true, exposedDevices: 4 },
  { id: 'cv-02', cve: 'CVE-2026-9003', severity: 'High', cvss: 7.1, software: 'DataMaster Pro', exploitAvailable: false, exposedDevices: 10 },
  { id: 'cv-03', cve: 'CVE-2026-9005', severity: 'Critical', cvss: 8.8, software: 'OfficeSuite Premium', exploitAvailable: true, exposedDevices: 35 },
  { id: 'cv-04', cve: 'CVE-2026-9007', severity: 'Medium', cvss: 5.3, software: 'CryptoSecure', exploitAvailable: false, exposedDevices: 8 },
  { id: 'cv-05', cve: 'CVE-2026-9009', severity: 'Critical', cvss: 9.4, software: 'VideoEditor Suite', exploitAvailable: true, exposedDevices: 30 },
  { id: 'cv-06', cve: 'CVE-2026-9011', severity: 'High', cvss: 7.8, software: 'PDFXpert Pro', exploitAvailable: false, exposedDevices: 25 },
  { id: 'cv-07', cve: 'CVE-2026-9013', severity: 'Low', cvss: 2.4, software: 'ImageMagick Pro', exploitAvailable: false, exposedDevices: 15 },
  { id: 'cv-08', cve: 'CVE-2026-9015', severity: 'Critical', cvss: 8.3, software: 'AudioMaster XL', exploitAvailable: true, exposedDevices: 6 },
  { id: 'cv-09', cve: 'CVE-2026-9017', severity: 'Medium', cvss: 5.7, software: 'SecuritySuite Pro', exploitAvailable: false, exposedDevices: 4 },
  { id: 'cv-10', cve: 'CVE-2026-9019', severity: 'Critical', cvss: 8.6, software: 'DataFlow X', exploitAvailable: true, exposedDevices: 18 },
  { id: 'cv-11', cve: 'CVE-2026-9021', severity: 'High', cvss: 7.6, software: 'OfficeSuite Premium', exploitAvailable: false, exposedDevices: 30 },
  { id: 'cv-12', cve: 'CVE-2026-9023', severity: 'Low', cvss: 4.5, software: 'CryptoSecure', exploitAvailable: true, exposedDevices: 7 }
];

const TVM_RECOMMENDATIONS = [
  { id: 'tr-01', title: 'Update CodeGenius to version 5.2.4', software: 'CodeGenius', exposedDevices: 6, impact: 8.2, status: 'Active' },
  { id: 'tr-02', title: 'Fix DataMaster Pro vulnerabilities', software: 'DataMaster Pro', exposedDevices: 12, impact: 5.9, status: 'Exception' },
  { id: 'tr-03', title: 'Update OfficeSuite Premium to latest version', software: 'OfficeSuite Premium', exposedDevices: 28, impact: 6.7, status: 'Active' },
  { id: 'tr-04', title: 'Upgrade CryptoSecure version', software: 'CryptoSecure', exposedDevices: 6, impact: 4.5, status: 'Completed' },
  { id: 'tr-05', title: 'Resolve VideoEditor Suite issues', software: 'VideoEditor Suite', exposedDevices: 34, impact: 9.1, status: 'Active' },
  { id: 'tr-06', title: 'Secure PDFXpert Pro', software: 'PDFXpert Pro', exposedDevices: 21, impact: 7.8, status: 'Exception' },
  { id: 'tr-07', title: 'Patch ImageMagick Pro', software: 'ImageMagick Pro', exposedDevices: 9, impact: 3.4, status: 'Completed' },
  { id: 'tr-08', title: 'Address AudioMaster XL flaws', software: 'AudioMaster XL', exposedDevices: 6, impact: 7.2, status: 'Active' }
];

if (typeof module !== 'undefined') {
  module.exports = { TVM_SOFTWARE, TVM_CVES, TVM_RECOMMENDATIONS };
}