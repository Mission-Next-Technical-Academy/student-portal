import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const requiredFiles = [
  'index.html',
  'package.json',
  'assets/boot-logo-transparent.png',
  'src/app.jsx',
  'src/data.js',
  'src/query-engine.js',
  'src/animations.jsx',
  'src/enterprise-components.jsx',
  'src/login.jsx',
  'src/track-selection.jsx',
  'src/student-dashboard.jsx',
  'src/module-page.jsx',
  'src/lab-shells.jsx',
  'src/shells/log-analysis-shells.jsx',
  'src/shells/windows-forensics-shells.jsx',
  'src/shells/security-assessments-shells.jsx',
  'src/shells/active-directory-shells.jsx',
  'src/instructor-dashboard.jsx',
  'src/windows-forensics-page.jsx',
  'src/project-catalog-page.jsx',
  'scripts/route-smoke.mjs',
  'src/data/labs/security-assessments.labs.js',
  'src/data/labs/active-directory.labs.js',
  'src/data/labs/windows-forensics.labs.js',
];

for (const file of requiredFiles) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${file}`);
  }
}

const requiredLabShellExports = [
  'TaskInspector',
  'ActiveDirectoryLabShell',
  'SplunkLabShell',
  'ServiceNowLabShell',
  'AzureLabShell',
  'SysmonLabShell',
];
const labShellsSource = fs.readFileSync(path.join(root, 'src/lab-shells.jsx'), 'utf8');
assert(labShellsSource.includes('const LabShells'), 'Expected lab-shells.jsx to define explicit LabShells export object');
assert(labShellsSource.includes('Object.assign(window, LabShells, { LabShells })'), 'Expected lab-shells.jsx to export window.LabShells');
for (const exportName of requiredLabShellExports) {
  assert(new RegExp(`function\\s+${exportName}\\s*\\(`).test(labShellsSource), `Expected lab-shells.jsx to define ${exportName}`);
  assert(new RegExp(`const\\s+LabShells\\s*=\\s*\\{[\\s\\S]*\\b${exportName}\\b[\\s\\S]*\\}`).test(labShellsSource), `Expected lab-shells.jsx to export ${exportName}`);
}
const logAnalysisShellsSource = fs.readFileSync(path.join(root, 'src/shells/log-analysis-shells.jsx'), 'utf8');
assert(logAnalysisShellsSource.includes('function KibanaLabShell'), 'Expected log-analysis-shells.jsx to define KibanaLabShell');
assert(logAnalysisShellsSource.includes('Object.assign(window, { KibanaLabShell })'), 'Expected log-analysis-shells.jsx to export KibanaLabShell on window');
assert(logAnalysisShellsSource.includes('kibana create index-pattern logstash-*'), 'Expected KibanaLabShell to expose index-pattern creation workflow');
assert(logAnalysisShellsSource.includes('kibana dashboard save credential-stuffing-overview'), 'Expected KibanaLabShell to expose dashboard save workflow');
const securityAssessmentShellsSource = fs.readFileSync(path.join(root, 'src/shells/security-assessments-shells.jsx'), 'utf8');
assert(securityAssessmentShellsSource.includes('function BurpProxyLabShell'), 'Expected security-assessments-shells.jsx to define BurpProxyLabShell');
assert(securityAssessmentShellsSource.includes('function IamMatrixLabShell'), 'Expected security-assessments-shells.jsx to define IamMatrixLabShell');
assert(securityAssessmentShellsSource.includes('Object.assign(window, { BurpProxyLabShell, IamMatrixLabShell })'), 'Expected security-assessments-shells.jsx to export its shells on window');
assert(securityAssessmentShellsSource.includes('window.B2B_BASH_ENGINE.BUILTINS'), 'Expected security-assessments-shells.jsx to extend the bash builtins');
const windowsForensicsShellsSource = fs.readFileSync(path.join(root, 'src/shells/windows-forensics-shells.jsx'), 'utf8');
assert(windowsForensicsShellsSource.includes('function WindowsEventLogsLabShell'), 'Expected windows-forensics-shells.jsx to define WindowsEventLogsLabShell');
assert(windowsForensicsShellsSource.includes('function TimelineExplorerLabShell'), 'Expected windows-forensics-shells.jsx to define TimelineExplorerLabShell');
assert(windowsForensicsShellsSource.includes('function BrowserHistoryViewerLabShell'), 'Expected windows-forensics-shells.jsx to define BrowserHistoryViewerLabShell');
assert(windowsForensicsShellsSource.includes('function FTKImagerLabShell'), 'Expected windows-forensics-shells.jsx to define FTKImagerLabShell');
assert(windowsForensicsShellsSource.includes('function WindowsRunDialog'), 'Expected windows-forensics-shells.jsx to define WindowsRunDialog');
const activeDirectoryShellsSource = fs.readFileSync(path.join(root, 'src/shells/active-directory-shells.jsx'), 'utf8');
['GrafanaLabShell', 'DatadogLabShell', 'NagiosLabShell', 'CheckmkLabShell', 'PrometheusLabShell', 'CactiLabShell'].forEach(name => {
  assert(activeDirectoryShellsSource.includes(`function ${name}`), `Expected active-directory-shells.jsx to define ${name}`);
  assert(activeDirectoryShellsSource.includes(name), `Expected active-directory-shells.jsx to export ${name}`);
});

const linuxShellSource = fs.readFileSync(path.join(root, 'src/shells/LinuxTerminalShell.jsx'), 'utf8');
['cmd_nano', 'cmd_wget', 'cmd_dpkg', 'cmd_curl'].forEach(fn => {
  assert(linuxShellSource.includes(`function ${fn}`), `Expected LinuxTerminalShell.jsx to define ${fn}`);
});

const sandbox = {
  console,
  window: {},
  localStorage: {
    store: new Map(),
    getItem(key) { return this.store.has(key) ? this.store.get(key) : null; },
    setItem(key, value) { this.store.set(key, String(value)); },
    removeItem(key) { this.store.delete(key); },
  },
};

vm.createContext(sandbox);
for (const file of [
  'src/data.js',
  'src/query-engine.js',
  // Phase 0 additions — new-shape lab schema + systems + registered labs
  'src/data/labs/_schema.js',
  'src/systems/virtualFs.js',
  'src/systems/validator.js',
  'src/systems/gating.js',
  'src/systems/progress.js',
  'src/data/labs/log-analysis.labs.js',
  'src/data/labs/windows-forensics.labs.js',
  'src/data/labs/security-assessments.labs.js',
  'src/data/labs/vuln-management.labs.js',
  'src/data/labs/malware-analysis.labs.js',
  'src/data/labs/active-directory.labs.js',
]) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  vm.runInContext(source, sandbox, { filename: file });
}

const { USERS, MODULES, executeQuery, validateTask, initUserProgress, markTaskComplete, getProgress, resetUserProgress, resetAllStudentProgress } = sandbox.window;
const { WINDOWS_FORENSICS_PROJECTS } = sandbox.window;
const { TRAINING_CATALOG, LOG_ANALYSIS_PROJECTS, ACTIVE_DIRECTORY_PROJECTS, SECURITY_ASSESSMENT_PROJECTS, VULNERABILITY_MANAGEMENT_PROJECTS, MALWARE_ANALYSIS_PROJECTS, ALL_PROJECT_LABS } = sandbox.window;

assert(Array.isArray(USERS) && USERS.length >= 2, 'Expected demo users to load');
assert(Array.isArray(MODULES) && MODULES.length === 7, 'Expected seven training modules');
assert(Array.isArray(WINDOWS_FORENSICS_PROJECTS) && WINDOWS_FORENSICS_PROJECTS.length === 5, 'Expected five Windows forensics projects');
assert(Array.isArray(LOG_ANALYSIS_PROJECTS) && LOG_ANALYSIS_PROJECTS.length === 5, 'Expected five log analysis projects');
assert(Array.isArray(ACTIVE_DIRECTORY_PROJECTS) && ACTIVE_DIRECTORY_PROJECTS.length === 7, 'Expected seven Active Directory projects');
assert(Array.isArray(SECURITY_ASSESSMENT_PROJECTS) && SECURITY_ASSESSMENT_PROJECTS.length === 5, 'Expected five security assessment projects');
assert(Array.isArray(VULNERABILITY_MANAGEMENT_PROJECTS) && VULNERABILITY_MANAGEMENT_PROJECTS.length === 5, 'Expected five vulnerability management projects');
assert(Array.isArray(MALWARE_ANALYSIS_PROJECTS) && MALWARE_ANALYSIS_PROJECTS.length === 5, 'Expected five malware analysis projects');
assert(Array.isArray(TRAINING_CATALOG) && TRAINING_CATALOG.length === 7, 'Expected seven training catalog entries');
assert(MALWARE_ANALYSIS_PROJECTS.every(project => project.simulation === true), 'Expected malware analysis projects to be simulation-only');
assert(Array.isArray(ALL_PROJECT_LABS) && ALL_PROJECT_LABS.length === 32, 'Expected local catalog labs for every external project');
assert(TRAINING_CATALOG.find(track => track.id === 'log-analysis').projects.every(project => project.lab), 'Expected catalog projects to expose local labs');
assert(TRAINING_CATALOG.find(track => track.id === 'windows-forensics').projects.every(project => project.lab), 'Expected Windows projects to expose local labs');
assert(typeof executeQuery === 'function', 'Expected query engine to load');

const dnsModule = MODULES.find(mod => mod.id === 'mod-1');
assert(dnsModule, 'Expected DNS module');

const searchResult = executeQuery('search qtype=TXT', dnsModule.logs);
assert(searchResult.rows.length === 11, 'Expected DNS TXT query search to return 11 rows');
assert(validateTask(dnsModule.tasks[0], searchResult, 'search qtype=TXT'), 'Expected DNS TXT task validation to pass');

const countResult = executeQuery('count by src_ip', dnsModule.logs);
assert(countResult.rows[0].src_ip === '10.0.1.88', 'Expected DNS count by src_ip to surface 10.0.1.88 first');
assert(validateTask(dnsModule.tasks[1], countResult, 'count by src_ip'), 'Expected DNS source count task validation to pass');

const smtpModule = MODULES.find(mod => mod.id === 'mod-6');
assert(smtpModule, 'Expected SMTP module');
const spamScoreResult = executeQuery('search spam_score>7', smtpModule.logs);
assert(spamScoreResult.rows.length === 13, 'Expected SMTP spam score query to return 13 rows');
assert(validateTask(smtpModule.tasks[0], spamScoreResult, 'search spam_score>7'), 'Expected SMTP spam score task validation to pass');

const httpModule = MODULES.find(mod => mod.id === 'mod-3');
assert(httpModule, 'Expected HTTP module');
const scannerResult = executeQuery('search sqlmap OR Nikto', httpModule.logs);
assert(scannerResult.rows.length === 10, 'Expected HTTP scanner query to return 10 rows');
assert(validateTask(httpModule.tasks[0], scannerResult, 'search sqlmap OR Nikto'), 'Expected HTTP scanner task validation to pass');

const sysmonLab = ALL_PROJECT_LABS.find(lab => lab.id === 'lab-lap-5');
assert(sysmonLab, 'Expected Sysmon catalog project to have a local lab');
assert(sysmonLab.logs.some(event => event.eventId === 4), 'Expected Sysmon lab to include a service state event');
const sysmonServiceResult = executeQuery('search eventId=4', sysmonLab.logs);
assert(sysmonServiceResult.rows.length === 1, 'Expected Sysmon service-state query to return one row');
assert(validateTask(sysmonLab.tasks[0], sysmonServiceResult, 'search eventId=4'), 'Expected Sysmon installation task validation to pass');
const sysmonImageLoadResult = executeQuery('search eventId=7 | search dbghelp.dll', sysmonLab.logs);
assert(sysmonImageLoadResult.rows.length === 1, 'Expected Sysmon image-load query to return one row');
assert(validateTask(sysmonLab.tasks[4], sysmonImageLoadResult, 'search eventId=7 | search dbghelp.dll'), 'Expected Sysmon image-load task validation to pass');

initUserProgress('student_01');
markTaskComplete('student_01', 'mod-1', 't1', 10);
let progress = getProgress();
assert(progress.student_01['mod-1'].completedTasks.includes('t1'), 'Expected progress to persist completed task');
assert(progress.student_01['mod-1'].score === 10, 'Expected progress score to update');
resetUserProgress('student_01');
progress = getProgress();
assert(progress.student_01['mod-1'].completedTasks.length === 0, 'Expected single-student reset to clear task completion');
markTaskComplete('student_01', 'mod-1', 't1', 10);
resetAllStudentProgress();
progress = getProgress();
assert(progress.student_01['mod-1'].score === 0, 'Expected all-student reset to clear progress scores');

const catalogLab = ALL_PROJECT_LABS.find(lab => lab.id === 'lab-lap-1');
assert(catalogLab, 'Expected Apache catalog project to have a local lab');
assert(catalogLab.logs.length === 12, 'Expected catalog lab to include fixture rows');
assert(catalogLab.tasks.length === 3, 'Expected catalog lab to include scored tasks');
const highSeverityResult = executeQuery('search severity=High', catalogLab.logs);
assert(highSeverityResult.rows.length === 4, 'Expected catalog high severity query to return four rows');
assert(validateTask(catalogLab.tasks[0], highSeverityResult, 'search severity=High'), 'Expected catalog high severity task validation to pass');

const appSource = fs.readFileSync(path.join(root, 'src/app.jsx'), 'utf8');
const indexSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert(appSource.includes('parseHashRoute'), 'Expected app hash routing to be present');
assert(appSource.includes('#/track/windows-forensics/project/'), 'Expected Windows project hash routes to be present');
assert(appSource.includes('AppErrorBoundary'), 'Expected app error boundary to prevent blank routes');

const modulePageSource = fs.readFileSync(path.join(root, 'src/module-page.jsx'), 'utf8');
assert(modulePageSource.includes('getEnterpriseLabShell'), 'Expected ModulePage to resolve lab shells explicitly');
assert(modulePageSource.includes('window.LabShells'), 'Expected ModulePage to use the explicit LabShells export object');
assert(modulePageSource.includes('Lab unavailable'), 'Expected ModulePage to show a Lab unavailable fallback');
assert(modulePageSource.includes("if (id === 'lab-vm-1') return 'openvas';"), 'Expected ModulePage vm fallback to map vm-1 to OpenVAS');
assert(modulePageSource.includes("if (id === 'lab-vm-5') return 'wsus';"), 'Expected ModulePage vm fallback to map vm-5 to WSUS');
for (const exportName of requiredLabShellExports.filter(name => name !== 'TaskInspector')) {
  assert(!modulePageSource.includes(`<${exportName}`), `Expected ModulePage not to render bare global ${exportName}`);
  assert(!modulePageSource.includes(`typeof ${exportName}`), `Expected ModulePage not to probe bare global ${exportName}`);
}
const windowsSource = fs.readFileSync(path.join(root, 'src/windows-forensics-page.jsx'), 'utf8');
assert(windowsSource.includes('WINDOWS_TOOL_SIMULATIONS'), 'Expected Windows tool simulations to be present');
assert(windowsSource.includes('Event Viewer') && windowsSource.includes('Registry Explorer') && windowsSource.includes('File Recovery'), 'Expected core Windows simulated tools');
const labShellSource = fs.readFileSync(path.join(root, 'src/lab-shells.jsx'), 'utf8');
assert(labShellSource.includes('function ActiveDirectoryLabShell'), 'Expected Active Directory lab shell to be present');
assert(labShellSource.includes('function ServiceNowLabShell'), 'Expected ServiceNow lab shell to be present');
assert(labShellSource.includes('function AzureLabShell'), 'Expected Azure lab shell to be present');
assert(labShellSource.includes('moveSelected') && labShellSource.includes('Disable Account') && labShellSource.includes('Reset Password'), 'Expected AD object workflows to mutate local state');
assert(labShellSource.includes('advanceState') && labShellSource.includes('Close notes are required'), 'Expected ServiceNow state transition workflow with required resolution notes');
markTaskComplete('student_01', catalogLab.id, 't1', 10);
assert(getProgress().student_01[catalogLab.id].completedTasks.includes('t1'), 'Expected catalog lab progress to persist');

// ── Phase 0 new-shape lab assertions ──────────────────────────
const { B2B_LABS, B2B_LAB_SCHEMA, B2B_GATING, B2B_VALIDATOR, B2B_VFS, createVirtualFs, validateStep } = sandbox.window;
assert(B2B_LABS && typeof B2B_LABS === 'object', 'Expected window.B2B_LABS registry to load');
const lap1 = B2B_LABS['lap-1'];
const lap2 = B2B_LABS['lap-2'];
const lap4 = B2B_LABS['lap-4'];
const sa1 = B2B_LABS['sa-1'];
const sa2 = B2B_LABS['sa-2'];
const sa3 = B2B_LABS['sa-3'];
const sa4 = B2B_LABS['sa-4'];
const sa5 = B2B_LABS['sa-5'];
const vm1 = B2B_LABS['vm-1'];
const ma1 = B2B_LABS['ma-1'];
const wf1 = B2B_LABS['wf-1'];
const wf3 = B2B_LABS['wf-3'];
const wf4 = B2B_LABS['wf-4'];
const wf5 = B2B_LABS['wf-5'];
const adLabs = ['ad-1', 'ad-2', 'ad-3', 'ad-4', 'ad-5', 'ad-6', 'ad-7'].map(id => B2B_LABS[id]);
assert(lap1, 'Expected B2B_LABS["lap-1"] to be registered');
assert(lap2, 'Expected B2B_LABS["lap-2"] to be registered');
assert(lap4, 'Expected B2B_LABS["lap-4"] to be registered');
assert(sa1, 'Expected B2B_LABS["sa-1"] to be registered');
assert(sa2, 'Expected B2B_LABS["sa-2"] to be registered');
assert(sa3, 'Expected B2B_LABS["sa-3"] to be registered');
assert(sa4, 'Expected B2B_LABS["sa-4"] to be registered');
assert(sa5, 'Expected B2B_LABS["sa-5"] to be registered');
assert(vm1, 'Expected B2B_LABS["vm-1"] to be registered');
assert(ma1, 'Expected B2B_LABS["ma-1"] to be registered');
assert(wf1, 'Expected B2B_LABS["wf-1"] to be registered');
assert(wf3, 'Expected B2B_LABS["wf-3"] to be registered');
assert(wf4, 'Expected B2B_LABS["wf-4"] to be registered');
assert(wf5, 'Expected B2B_LABS["wf-5"] to be registered');
adLabs.forEach((lab, index) => assert(lab, `Expected B2B_LABS["ad-${index + 1}"] to be registered`));
assert(Array.isArray(lap1.exercises) && lap1.exercises.length === 5, 'Expected lap-1 to have 5 upstream exercises');
assert(Array.isArray(lap2.exercises) && lap2.exercises.length === 5, 'Expected lap-2 to have 5 upstream exercises');
assert(Array.isArray(lap4.exercises) && lap4.exercises.length === 5, 'Expected lap-4 to have 5 upstream exercises');
assert(Array.isArray(sa1.exercises) && sa1.exercises.length === 5, 'Expected sa-1 to have 5 upstream exercises');
assert(Array.isArray(sa2.exercises) && sa2.exercises.length === 5, 'Expected sa-2 to have 5 upstream exercises');
assert(Array.isArray(sa3.exercises) && sa3.exercises.length === 5, 'Expected sa-3 to have 5 upstream exercises');
assert(Array.isArray(sa4.exercises) && sa4.exercises.length === 5, 'Expected sa-4 to have 5 upstream exercises');
assert(Array.isArray(sa5.exercises) && sa5.exercises.length === 5, 'Expected sa-5 to have 5 upstream exercises');
assert(Array.isArray(vm1.exercises) && vm1.exercises.length === 5, 'Expected vm-1 to expose 5 schema-based exercises');
assert(Array.isArray(ma1.exercises) && ma1.exercises.length === 1, 'Expected ma-1 to expose schema-based exercises');
assert(Array.isArray(wf1.exercises) && wf1.exercises.length === 5, 'Expected wf-1 to have 5 upstream exercises');
assert(Array.isArray(wf3.exercises) && wf3.exercises.length === 5, 'Expected wf-3 to have 5 upstream exercises');
assert(Array.isArray(wf4.exercises) && wf4.exercises.length === 5, 'Expected wf-4 to have 5 upstream exercises');
assert(Array.isArray(wf5.exercises) && wf5.exercises.length === 5, 'Expected wf-5 to have 5 upstream exercises');
adLabs.forEach((lab, index) => {
  const expectedExercises = index === 6 ? 6 : 5;
  assert(Array.isArray(lab.exercises) && lab.exercises.length === expectedExercises, `Expected ad-${index + 1} to have ${expectedExercises} upstream exercises`);
});
assert(lap1.checkOnLearning && lap1.checkOnLearning.length >= 5, 'Expected lap-1 to have at least 5 Check-on-Learning questions');
assert(lap2.checkOnLearning && lap2.checkOnLearning.length >= 5, 'Expected lap-2 to have at least 5 Check-on-Learning questions');
assert(lap4.checkOnLearning && lap4.checkOnLearning.length >= 5, 'Expected lap-4 to have at least 5 Check-on-Learning questions');
assert(sa1.checkOnLearning && sa1.checkOnLearning.length >= 5, 'Expected sa-1 to have at least 5 Check-on-Learning questions');
assert(sa2.checkOnLearning && sa2.checkOnLearning.length >= 5, 'Expected sa-2 to have at least 5 Check-on-Learning questions');
assert(sa3.checkOnLearning && sa3.checkOnLearning.length >= 5, 'Expected sa-3 to have at least 5 Check-on-Learning questions');
assert(sa4.checkOnLearning && sa4.checkOnLearning.length >= 5, 'Expected sa-4 to have at least 5 Check-on-Learning questions');
assert(sa5.checkOnLearning && sa5.checkOnLearning.length >= 5, 'Expected sa-5 to have at least 5 Check-on-Learning questions');
assert(vm1.checkOnLearning && vm1.checkOnLearning.length === 5, 'Expected vm-1 to have 5 Check-on-Learning questions');
assert(wf1.checkOnLearning && wf1.checkOnLearning.length >= 5, 'Expected wf-1 to have at least 5 Check-on-Learning questions');
assert(wf3.checkOnLearning && wf3.checkOnLearning.length >= 5, 'Expected wf-3 to have at least 5 Check-on-Learning questions');
assert(wf4.checkOnLearning && wf4.checkOnLearning.length >= 5, 'Expected wf-4 to have at least 5 Check-on-Learning questions');
assert(wf5.checkOnLearning && wf5.checkOnLearning.length >= 5, 'Expected wf-5 to have at least 5 Check-on-Learning questions');
adLabs.forEach((lab, index) => {
  const expectedQuestions = index === 6 ? 6 : 5;
  assert(lab.checkOnLearning && lab.checkOnLearning.length === expectedQuestions, `Expected ad-${index + 1} to have ${expectedQuestions} Check-on-Learning questions`);
});
assert(lap1.source && typeof lap1.source.sha256 === 'string' && lap1.source.sha256.length === 64, 'Expected lap-1 source sha256 to be a 64-char hex string');
assert(lap2.source && typeof lap2.source.sha256 === 'string' && lap2.source.sha256.length === 64, 'Expected lap-2 source sha256 to be a 64-char hex string');
assert(lap4.source && typeof lap4.source.sha256 === 'string' && lap4.source.sha256.length === 64, 'Expected lap-4 source sha256 to be a 64-char hex string');
assert(sa1.source && typeof sa1.source.sha256 === 'string' && sa1.source.sha256.length === 64, 'Expected sa-1 source sha256 to be a 64-char hex string');
assert(sa2.source && typeof sa2.source.sha256 === 'string' && sa2.source.sha256.length === 64, 'Expected sa-2 source sha256 to be a 64-char hex string');
assert(sa3.source && typeof sa3.source.sha256 === 'string' && sa3.source.sha256.length === 64, 'Expected sa-3 source sha256 to be a 64-char hex string');
assert(sa4.source && typeof sa4.source.sha256 === 'string' && sa4.source.sha256.length === 64, 'Expected sa-4 source sha256 to be a 64-char hex string');
assert(sa5.source && typeof sa5.source.sha256 === 'string' && sa5.source.sha256.length === 64, 'Expected sa-5 source sha256 to be a 64-char hex string');
assert(vm1.source && typeof vm1.source.sha256 === 'string' && vm1.source.sha256.length === 64, 'Expected vm-1 source sha256 to be a 64-char hex string');
assert(ma1.source && typeof ma1.source.sha256 === 'string' && ma1.source.sha256.length === 64, 'Expected ma-1 source sha256 to be a 64-char hex string');
assert(wf1.source && typeof wf1.source.sha256 === 'string' && wf1.source.sha256.length === 64, 'Expected wf-1 source sha256 to be a 64-char hex string');
assert(wf3.source && typeof wf3.source.sha256 === 'string' && wf3.source.sha256.length === 64, 'Expected wf-3 source sha256 to be a 64-char hex string');
assert(wf4.source && typeof wf4.source.sha256 === 'string' && wf4.source.sha256.length === 64, 'Expected wf-4 source sha256 to be a 64-char hex string');
assert(wf5.source && typeof wf5.source.sha256 === 'string' && wf5.source.sha256.length === 64, 'Expected wf-5 source sha256 to be a 64-char hex string');
adLabs.forEach((lab, index) => assert(lab.source && typeof lab.source.sha256 === 'string' && lab.source.sha256.length === 64, `Expected ad-${index + 1} source sha256 to be a 64-char hex string`));

// Snapshot sha256 must match the manifest
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/data/sources/.manifest.json'), 'utf8'));
assert(manifest.snapshots['lap-1'] && manifest.snapshots['lap-1'].sha256 === lap1.source.sha256, 'Expected lap-1 source sha256 to match manifest');
assert(manifest.snapshots['lap-2'] && manifest.snapshots['lap-2'].sha256 === lap2.source.sha256, 'Expected lap-2 source sha256 to match manifest');
assert(manifest.snapshots['lap-4'] && manifest.snapshots['lap-4'].sha256 === lap4.source.sha256, 'Expected lap-4 source sha256 to match manifest');
assert(manifest.snapshots['sa-1'] && manifest.snapshots['sa-1'].sha256 === sa1.source.sha256, 'Expected sa-1 source sha256 to match manifest');
assert(manifest.snapshots['sa-2'] && manifest.snapshots['sa-2'].sha256 === sa2.source.sha256, 'Expected sa-2 source sha256 to match manifest');
assert(manifest.snapshots['sa-3'] && manifest.snapshots['sa-3'].sha256 === sa3.source.sha256, 'Expected sa-3 source sha256 to match manifest');
assert(manifest.snapshots['sa-4'] && manifest.snapshots['sa-4'].sha256 === sa4.source.sha256, 'Expected sa-4 source sha256 to match manifest');
assert(manifest.snapshots['sa-5'] && manifest.snapshots['sa-5'].sha256 === sa5.source.sha256, 'Expected sa-5 source sha256 to match manifest');
assert(manifest.snapshots['vm-1'] && manifest.snapshots['vm-1'].sha256 === vm1.source.sha256, 'Expected vm-1 source sha256 to match manifest');
assert(manifest.snapshots['wf-1'] && manifest.snapshots['wf-1'].sha256 === wf1.source.sha256, 'Expected wf-1 source sha256 to match manifest');
assert(manifest.snapshots['wf-3'] && manifest.snapshots['wf-3'].sha256 === wf3.source.sha256, 'Expected wf-3 source sha256 to match manifest');
assert(manifest.snapshots['wf-4'] && manifest.snapshots['wf-4'].sha256 === wf4.source.sha256, 'Expected wf-4 source sha256 to match manifest');
assert(manifest.snapshots['wf-5'] && manifest.snapshots['wf-5'].sha256 === wf5.source.sha256, 'Expected wf-5 source sha256 to match manifest');
adLabs.forEach((lab, index) => {
  const id = `ad-${index + 1}`;
  assert(manifest.snapshots[id] && manifest.snapshots[id].sha256 === lab.source.sha256, `Expected ${id} source sha256 to match manifest`);
});

const schemaErrs = B2B_LAB_SCHEMA.validateLabShape(lap1);
assert(schemaErrs.length === 0, 'lap-1 schema errors: ' + schemaErrs.join('; '));
const lap2SchemaErrs = B2B_LAB_SCHEMA.validateLabShape(lap2);
assert(lap2SchemaErrs.length === 0, 'lap-2 schema errors: ' + lap2SchemaErrs.join('; '));
const lap4SchemaErrs = B2B_LAB_SCHEMA.validateLabShape(lap4);
assert(lap4SchemaErrs.length === 0, 'lap-4 schema errors: ' + lap4SchemaErrs.join('; '));
const sa1SchemaErrs = B2B_LAB_SCHEMA.validateLabShape(sa1);
assert(sa1SchemaErrs.length === 0, 'sa-1 schema errors: ' + sa1SchemaErrs.join('; '));
const sa2SchemaErrs = B2B_LAB_SCHEMA.validateLabShape(sa2);
assert(sa2SchemaErrs.length === 0, 'sa-2 schema errors: ' + sa2SchemaErrs.join('; '));
const sa3SchemaErrs = B2B_LAB_SCHEMA.validateLabShape(sa3);
assert(sa3SchemaErrs.length === 0, 'sa-3 schema errors: ' + sa3SchemaErrs.join('; '));
const sa4SchemaErrs = B2B_LAB_SCHEMA.validateLabShape(sa4);
assert(sa4SchemaErrs.length === 0, 'sa-4 schema errors: ' + sa4SchemaErrs.join('; '));
const sa5SchemaErrs = B2B_LAB_SCHEMA.validateLabShape(sa5);
assert(sa5SchemaErrs.length === 0, 'sa-5 schema errors: ' + sa5SchemaErrs.join('; '));
const vmSchemaErrs = B2B_LAB_SCHEMA.validateLabShape(vm1);
assert(vmSchemaErrs.length === 0, 'vm-1 schema errors: ' + vmSchemaErrs.join('; '));
const maSchemaErrs = B2B_LAB_SCHEMA.validateLabShape(ma1);
assert(maSchemaErrs.length === 0, 'ma-1 schema errors: ' + maSchemaErrs.join('; '));
const wf1SchemaErrs = B2B_LAB_SCHEMA.validateLabShape(wf1);
assert(wf1SchemaErrs.length === 0, 'wf-1 schema errors: ' + wf1SchemaErrs.join('; '));
const wf3SchemaErrs = B2B_LAB_SCHEMA.validateLabShape(wf3);
assert(wf3SchemaErrs.length === 0, 'wf-3 schema errors: ' + wf3SchemaErrs.join('; '));
const wf4SchemaErrs = B2B_LAB_SCHEMA.validateLabShape(wf4);
assert(wf4SchemaErrs.length === 0, 'wf-4 schema errors: ' + wf4SchemaErrs.join('; '));
const wf5SchemaErrs = B2B_LAB_SCHEMA.validateLabShape(wf5);
assert(wf5SchemaErrs.length === 0, 'wf-5 schema errors: ' + wf5SchemaErrs.join('; '));
adLabs.forEach((lab, index) => {
  const errs = B2B_LAB_SCHEMA.validateLabShape(lab);
  assert(errs.length === 0, `ad-${index + 1} schema errors: ` + errs.join('; '));
});

['sa-1', 'sa-2', 'sa-3', 'sa-4', 'sa-5'].forEach(id => {
  const lab = B2B_LABS[id];
  assert(lab, `Expected B2B_LABS["${id}"] to be registered`);
  const errs = B2B_LAB_SCHEMA.validateLabShape(lab);
  assert(errs.length === 0, `${id} schema errors: ` + errs.join('; '));
  assert(Array.isArray(lab.exercises) && lab.exercises.length === 5, `Expected ${id} to have 5 exercises`);
  assert(Array.isArray(lab.checkOnLearning) && lab.checkOnLearning.length >= 5, `Expected ${id} to have at least 5 Check-on-Learning questions`);
  assert(manifest.snapshots[id] && manifest.snapshots[id].sha256 === lab.source.sha256, `Expected ${id} source sha256 to match manifest`);
});
assert(B2B_LABS['sa-1'].environment.shell === 'LinuxTerminalShell', 'Expected sa-1 to use LinuxTerminalShell');
assert(B2B_LABS['sa-2'].environment.shell === 'LinuxTerminalShell', 'Expected sa-2 to use LinuxTerminalShell');
assert(B2B_LABS['sa-3'].environment.shell === 'BurpProxyLabShell', 'Expected sa-3 to use BurpProxyLabShell');
assert(B2B_LABS['sa-4'].environment.shell === 'LinuxTerminalShell', 'Expected sa-4 to use LinuxTerminalShell');
assert(B2B_LABS['sa-5'].environment.shell === 'LinuxTerminalShell', 'Expected sa-5 to use LinuxTerminalShell as its mixed-lab base shell');

['vm-1', 'vm-2', 'vm-3', 'vm-4', 'vm-5'].forEach(id => {
  const lab = B2B_LABS[id];
  assert(lab, `Expected B2B_LABS["${id}"] to be registered`);
  const errs = B2B_LAB_SCHEMA.validateLabShape(lab);
  assert(errs.length === 0, `${id} schema errors: ` + errs.join('; '));
  assert(Array.isArray(lab.exercises) && lab.exercises.length === 5, `Expected ${id} to have 5 exercises`);
  assert(Array.isArray(lab.checkOnLearning) && lab.checkOnLearning.length === 5, `Expected ${id} to have 5 Check-on-Learning questions`);
  assert(manifest.snapshots[id] && manifest.snapshots[id].sha256 === lab.source.sha256, `Expected ${id} source sha256 to match manifest`);
});
assert(B2B_LABS['vm-1'].environment.shell === 'OpenVASLabShell', 'Expected vm-1 to use OpenVASLabShell');
assert(B2B_LABS['vm-2'].environment.shell === 'NessusLabShell', 'Expected vm-2 to use NessusLabShell');
assert(B2B_LABS['vm-3'].environment.shell === 'QualysLabShell', 'Expected vm-3 to use QualysLabShell');
assert(B2B_LABS['vm-4'].environment.shell === 'ZAPLabShell', 'Expected vm-4 to use ZAPLabShell');
assert(B2B_LABS['vm-5'].environment.shell === 'WSUSLabShell', 'Expected vm-5 to use WSUSLabShell');
assert(B2B_LABS['ad-1'].environment.shell === 'GrafanaLabShell', 'Expected ad-1 to use GrafanaLabShell');
assert(B2B_LABS['ad-2'].environment.shell === 'SplunkLabShell', 'Expected ad-2 to use SplunkLabShell');
assert(B2B_LABS['ad-3'].environment.shell === 'DatadogLabShell', 'Expected ad-3 to use DatadogLabShell');
assert(B2B_LABS['ad-4'].environment.shell === 'NagiosLabShell', 'Expected ad-4 to use NagiosLabShell');
assert(B2B_LABS['ad-5'].environment.shell === 'CheckmkLabShell', 'Expected ad-5 to use CheckmkLabShell');
assert(B2B_LABS['ad-6'].environment.shell === 'PrometheusLabShell', 'Expected ad-6 to use PrometheusLabShell');
assert(B2B_LABS['ad-7'].environment.shell === 'CactiLabShell', 'Expected ad-7 to use CactiLabShell');
assert(B2B_LABS['wf-1'].environment.shell === 'WindowsEventLogsLabShell', 'Expected wf-1 to use WindowsEventLogsLabShell');
assert(B2B_LABS['wf-3'].environment.shell === 'TimelineExplorerLabShell', 'Expected wf-3 to use TimelineExplorerLabShell');
assert(B2B_LABS['wf-4'].environment.shell === 'BrowserHistoryViewerLabShell', 'Expected wf-4 to use BrowserHistoryViewerLabShell');
assert(B2B_LABS['wf-5'].environment.shell === 'FTKImagerLabShell', 'Expected wf-5 to use FTKImagerLabShell');

// Bloom coverage: every Bloom level must appear at least once
const blooms = new Set(lap1.checkOnLearning.map(q => q.bloom));
['recall', 'comprehension', 'application', 'analysis'].forEach(level => {
  assert(blooms.has(level), `Expected lap-1 CoL to cover Bloom level: ${level}`);
});

// Forward gating: step 2 must be locked until step 1 completes
const flat = B2B_GATING.flattenSteps(lap1);
assert(flat.length >= 12, 'Expected lap-1 to flatten to >= 12 steps');
const completed = new Set();
const firstStep = flat[0];
const secondStep = flat[1];
assert(B2B_GATING.isStepUnlocked(lap1, firstStep.id, completed), 'Expected first step to be unlocked initially');
assert(!B2B_GATING.isStepUnlocked(lap1, secondStep.id, completed), 'Expected second step to be locked before first completes');
completed.add(firstStep.id);
assert(B2B_GATING.isStepUnlocked(lap1, secondStep.id, completed), 'Expected second step to unlock after first completes');

// Validator smoke: ex2.s2 expects 'GET'
const ex2s2 = flat.find(s => s.id === 'lap-1.ex2.s2');
assert(ex2s2, 'Expected lap-1.ex2.s2 to exist');
const okGet = validateStep(ex2s2, {}, 'GET');
const badGet = validateStep(ex2s2, {}, 'POST');
assert(okGet.ok, 'Expected GET to validate for lap-1.ex2.s2');
assert(!badGet.ok, 'Expected POST to fail validation for lap-1.ex2.s2');

// Virtual FS smoke: lap-1 fs has /var/log/apache2/access.log with 154 lines
const labFs = createVirtualFs(lap1.environment.fs());
assert(labFs.exists('/var/log/apache2/access.log'), 'Expected lap-1 vfs to include access.log');
const accessLog = labFs.read('/var/log/apache2/access.log');
const accessLines = accessLog.trim().split('\n');
assert(accessLines.length === 154, `Expected access.log to have 154 lines (got ${accessLines.length})`);
const count100 = accessLines.filter(l => l.startsWith('192.168.1.100 ')).length;
assert(count100 === 47, `Expected 47 lines from 192.168.1.100 (got ${count100})`);
const count404 = accessLines.filter(l => l.includes(' 404 ')).length;
assert(count404 === 12, `Expected 12 lines containing ' 404 ' (got ${count404})`);
const count100And404 = accessLines.filter(l => l.startsWith('192.168.1.100 ') && l.includes(' 404 ')).length;
assert(count100And404 === 5, `Expected 5 lines from 192.168.1.100 with ' 404 ' (got ${count100And404})`);
assert(labFs.exists('/var/log/apache2/error.log'), 'Expected lap-1 vfs to include error.log');

const lap2Fs = createVirtualFs(lap2.environment.fs());
assert(lap2Fs.exists('/etc/rsyslog.conf'), 'Expected lap-2 vfs to include rsyslog.conf');
const lap2AuthLines = lap2Fs.read('/var/log/auth.log').trim().split('\n');
const lap2Failed = lap2AuthLines.filter(line => line.includes('Failed password'));
assert(lap2Failed.length === 9, `Expected lap-2 auth.log to include 9 failed-password lines (got ${lap2Failed.length})`);
const lap2Failed203 = lap2Failed.filter(line => line.includes('203.0.113.5')).length;
assert(lap2Failed203 === 6, `Expected lap-2 auth.log to include 6 failed-password lines from 203.0.113.5 (got ${lap2Failed203})`);
const lap2AcceptedTemp = lap2AuthLines.filter(line => line.includes('Accepted password for temp.contractor')).length;
assert(lap2AcceptedTemp === 2, `Expected lap-2 auth.log to include 2 accepted logons for temp.contractor (got ${lap2AcceptedTemp})`);
const lap2Step = B2B_GATING.flattenSteps(lap2).find(step => step.id === 'lap-2.ex4.s3');
assert(lap2Step && validateStep(lap2Step, {}, '203.0.113.5').ok, 'Expected lap-2.ex4.s3 to accept 203.0.113.5');

const lap4Fs = createVirtualFs(lap4.environment.fs());
assert(lap4.environment.shell === 'KibanaLabShell', 'Expected lap-4 to use KibanaLabShell');
assert(lap4Fs.exists('/etc/logstash/conf.d/logstash-simple.conf'), 'Expected lap-4 vfs to include the Logstash config');
assert(lap4Fs.exists('/var/log/logstash/logstash-plain.log'), 'Expected lap-4 vfs to include the Logstash service log');
assert(lap4Fs.exists('/var/lib/elasticsearch/_cat_indices.txt'), 'Expected lap-4 vfs to include Elasticsearch index output');
const lap4Flat = B2B_GATING.flattenSteps(lap4);
assert(lap4Flat.length === 17, `Expected lap-4 to flatten to 17 steps (got ${lap4Flat.length})`);
const lap4DiscoverStep = lap4Flat.find(step => step.id === 'lap-4.ex5.s3');
assert(lap4DiscoverStep && validateStep(lap4DiscoverStep, {}, 'kibana inspect doc 09:14 source.ip=203.0.113.77').ok, 'Expected lap-4.ex5.s3 to accept the Discover inspection action');

const wf1Failed = wf1.toolData.events.filter(event => Number(event.eventId) === 4625);
assert(wf1.toolData.events.length === 10, `Expected wf-1 to ship 10 synthetic event records (got ${wf1.toolData.events.length})`);
assert(wf1Failed.length === 5, `Expected wf-1 to include 5 failed logon events (got ${wf1Failed.length})`);
assert(wf1.toolData.events.some(event => Number(event.eventId) === 4688 && event.processId === '0x1f40'), 'Expected wf-1 to include a PowerShell process-creation event');

assert(Array.isArray(wf3.toolData.timeline) && wf3.toolData.timeline.length === 400, `Expected wf-3 to ship 400 timeline rows (got ${wf3.toolData.timeline.length})`);
assert(wf3.toolData.timeline.some(row => row.FullPath.includes('AppData\\Local\\Temp\\export\\')), 'Expected wf-3 to include temp export staging rows');
assert(wf3.toolData.timeline.some(row => row.FullPath.startsWith('E:\\') && row.ZoneId === '3'), 'Expected wf-3 to include removable-media writes with ZoneId 3');

assert(Array.isArray(wf4.toolData.history) && wf4.toolData.history.length === 150, `Expected wf-4 to ship 150 browser-history rows (got ${wf4.toolData.history.length})`);
assert(wf4.toolData.history.some(row => row.URL.includes('webmail-drop.example-bad.com')), 'Expected wf-4 to include the suspicious webmail domain');
assert(wf4.toolData.downloads.some(row => row.URL.endsWith('.zip')), 'Expected wf-4 to include suspicious ZIP downloads');

assert(wf5.toolData.recycleBin.some(row => row.Entry.startsWith('$I')), 'Expected wf-5 to include $I recycle-bin metadata entries');
assert(wf5.toolData.recycleBin.some(row => row.Entry.startsWith('$R')), 'Expected wf-5 to include $R recycle-bin content entries');
assert(wf5.toolData.timeline.length >= 5, 'Expected wf-5 to include a deleted-file correlation timeline');

assert(indexSource.includes('/src/shells/log-analysis-shells.jsx'), 'Expected index.html to register log-analysis-shells.jsx');
assert(indexSource.includes('/src/data/labs/security-assessments.labs.js'), 'Expected index.html to register security-assessments.labs.js');
assert(indexSource.includes('/src/shells/security-assessments-shells.jsx'), 'Expected index.html to register security-assessments-shells.jsx');
assert(indexSource.includes('/src/data/labs/windows-forensics.labs.js'), 'Expected index.html to register windows-forensics.labs.js');
assert(indexSource.includes('/src/shells/windows-forensics-shells.jsx'), 'Expected index.html to register windows-forensics-shells.jsx');
assert(indexSource.includes('/src/data/labs/active-directory.labs.js'), 'Expected index.html to register active-directory.labs.js');
assert(indexSource.includes('/src/shells/active-directory-shells.jsx'), 'Expected index.html to register active-directory-shells.jsx');

console.log('Project check passed.');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
