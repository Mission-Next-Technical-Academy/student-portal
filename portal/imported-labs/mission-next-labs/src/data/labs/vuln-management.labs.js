(function () {
  const REPO = '0xrajneesh/Vulnerability-Management-Projects-for-Beginners';

  function makeAnalystFs(hostname, notes) {
    return {
      home: {
        student: {
          '.bashrc': 'alias ll="ls -la"\nexport PS1="student@' + hostname + ':\\w\\$ "\n',
          'runbook.txt': notes.join('\n') + '\n',
          reports: {},
        },
      },
      etc: {
        hostname: hostname + '\n',
      },
      var: {
        log: {
          apt: {
            history: 'Start-Date: 2026-04-27  08:13:12\nCommandline: apt install scanner tooling\nEnd-Date: 2026-04-27  08:14:41\n',
          },
        },
      },
      tmp: {},
    };
  }

  function mkQuestion(id, stepId, question, type, options, bloom, acceptedAnswer) {
    const q = {
      id,
      question,
      type,
      triggerOn: { stepId },
      reinforces: stepId,
      bloom,
      passThreshold: type === 'multi-select' ? 'all-correct' : 'any-correct',
    };
    if (options) q.options = options;
    if (acceptedAnswer) q.acceptedAnswer = acceptedAnswer;
    return q;
  }

  const VM_1 = {
    id: 'vm-1',
    track: 'vulnerability-management',
    title: 'OpenVAS Network Scan',
    difficulty: 'Beginner',
    estimatedTime: '55 min',
    icon: 'O',
    tags: ['OpenVAS', 'GVM', 'Network Scanning', 'CVE', 'Remediation'],
    source: {
      repo: REPO,
      file: 'Project-1-Network-Vulnerability-Scanning-with-OpenVAS.md',
      sha256: 'bcb8f8fd00f6bcde863bc78097da0dea48b7daf82e98398f65236f80b5c6d1f7',
      snapshot: 'src/data/sources/vm-1.source.md',
    },
    environment: {
      type: 'mixed',
      shell: 'OpenVASLabShell',
      fs: function () {
        return makeAnalystFs('openvas-01', [
          'Target subnet: 10.10.24.0/24',
          'Preferred config: Full and fast',
          'Export the PDF report after you review the High findings.',
        ]);
      },
    },
    scenario: {
      role: 'Vulnerability management analyst on the infrastructure team',
      incident: 'A new branch-office subnet was added without a formal exposure review. Launch an OpenVAS scan, review the most severe findings, and export evidence for the remediation ticket.',
    },
    exercises: [
      {
        id: 'ex1',
        upstreamHeading: 'Exercise 1: Installing OpenVAS',
        steps: [
          {
            id: 'vm-1.ex1.s1',
            upstream: { exercise: 'Exercise 1', stepNumber: 1, sourceLine: 'sudo apt update' },
            kind: 'command',
            instruction: 'Refresh the Ubuntu package indexes before installing OpenVAS.',
            acceptedInputs: [{ type: 'exact', value: 'cli:sudo apt update' }],
            validation: { type: 'commandExecuted' },
            hint: 'Run `sudo apt update` in the install console.',
            points: 10,
          },
          {
            id: 'vm-1.ex1.s2',
            upstream: { exercise: 'Exercise 1', stepNumber: 1, sourceLine: 'sudo apt upgrade -y' },
            kind: 'command',
            instruction: 'Apply any pending package upgrades so the scanner dependencies are current.',
            acceptedInputs: [{ type: 'exact', value: 'cli:sudo apt upgrade -y' }],
            validation: { type: 'commandExecuted' },
            hint: 'The source guide upgrades packages immediately after refreshing indexes.',
            points: 10,
          },
          {
            id: 'vm-1.ex1.s3',
            upstream: { exercise: 'Exercise 1', stepNumber: 2, sourceLine: 'sudo add-apt-repository ppa:mrazavi/openvas' },
            kind: 'command',
            instruction: 'Add the OpenVAS package repository to the Ubuntu host.',
            acceptedInputs: [{ type: 'exact', value: 'cli:sudo add-apt-repository ppa:mrazavi/openvas' }],
            validation: { type: 'commandExecuted' },
            hint: 'Use the exact PPA from the source lab.',
            points: 10,
          },
          {
            id: 'vm-1.ex1.s4',
            upstream: { exercise: 'Exercise 1', stepNumber: 3, sourceLine: 'sudo apt update' },
            kind: 'command',
            instruction: 'Refresh package indexes again so Ubuntu can see the new OpenVAS repository.',
            acceptedInputs: [{ type: 'exact', value: 'cli:sudo apt update' }],
            validation: { type: 'commandExecuted' },
            hint: 'Run the same package index refresh after adding the PPA.',
            points: 10,
          },
          {
            id: 'vm-1.ex1.s5',
            upstream: { exercise: 'Exercise 1', stepNumber: 3, sourceLine: 'sudo apt install openvas -y' },
            kind: 'command',
            instruction: 'Install the OpenVAS packages from the newly added repository.',
            acceptedInputs: [{ type: 'exact', value: 'cli:sudo apt install openvas -y' }],
            validation: { type: 'commandExecuted' },
            hint: 'Install the `openvas` package with the `-y` flag.',
            points: 10,
          },
          {
            id: 'vm-1.ex1.s6',
            upstream: { exercise: 'Exercise 1', stepNumber: 4, sourceLine: 'sudo gvm-setup' },
            kind: 'command',
            instruction: 'Initialize the GVM stack so certificates, feeds, and the default admin account are created.',
            acceptedInputs: [{ type: 'exact', value: 'cli:sudo gvm-setup' }],
            validation: { type: 'commandExecuted' },
            hint: 'Run the setup command before trying to start the services.',
            points: 10,
          },
          {
            id: 'vm-1.ex1.s7',
            upstream: { exercise: 'Exercise 1', stepNumber: 5, sourceLine: 'sudo gvm-start' },
            kind: 'command',
            instruction: 'Start the guided GVM stack so the Greenbone Security Assistant is available on port 9392.',
            acceptedInputs: [{ type: 'exact', value: 'cli:sudo gvm-start' }],
            validation: { type: 'commandExecuted' },
            hint: 'Use the quick-run card in the shell or type `sudo gvm-start`.',
            points: 10,
            checkOnLearning: 'vm-1.col-1',
          },
        ],
      },
      {
        id: 'ex2',
        upstreamHeading: 'Exercise 2: Configuring OpenVAS for Scanning',
        steps: [
          {
            id: 'vm-1.ex2.s1',
            upstream: { exercise: 'Exercise 2', stepNumber: 1, sourceLine: 'Log in to the OpenVAS web interface.' },
            kind: 'command',
            instruction: 'Open the Greenbone Security Assistant login page after the services start.',
            acceptedInputs: [{ type: 'exact', value: 'nav:https://localhost:9392' }],
            validation: { type: 'commandExecuted' },
            hint: 'Use the `OPEN https://localhost:9392` button once `gvm-start` completes.',
            points: 10,
          },
          {
            id: 'vm-1.ex2.s2',
            upstream: { exercise: 'Exercise 2', stepNumber: 1, sourceLine: 'Log in with the generated admin account.' },
            kind: 'command',
            instruction: 'Authenticate to the OpenVAS web interface with the generated admin account.',
            acceptedInputs: [{ type: 'exact', value: 'auth:login user=admin' }],
            validation: { type: 'commandExecuted' },
            hint: 'The login form defaults to the `admin` username.',
            points: 10,
          },
          {
            id: 'vm-1.ex2.s3',
            upstream: { exercise: 'Exercise 2', stepNumber: 2, sourceLine: 'Navigate to the "Configuration" section and select "Targets".' },
            kind: 'command',
            instruction: 'Navigate to `Configuration > Targets` so you can define the subnet to scan.',
            acceptedInputs: [{ type: 'exact', value: 'ui:nav Configuration/Targets' }],
            validation: { type: 'commandExecuted' },
            hint: 'Use the `Configuration` tab in the Greenbone header.',
            points: 10,
          },
          {
            id: 'vm-1.ex2.s4',
            upstream: { exercise: 'Exercise 2', stepNumber: 3, sourceLine: 'Click "New Target" to create a new scan target.' },
            kind: 'command',
            instruction: 'Open the `New Target` dialog.',
            acceptedInputs: [{ type: 'exact', value: 'ui:targets.new' }],
            validation: { type: 'commandExecuted' },
            hint: 'Use the `+ New Target` button on the Targets page.',
            points: 10,
          },
          {
            id: 'vm-1.ex2.s5',
            upstream: { exercise: 'Exercise 2', stepNumber: 4, sourceLine: 'Enter the target details (e.g., target name and IP address).' },
            kind: 'command',
            instruction: 'Create the branch-office target as `Internal_Subnet` for subnet `10.10.24.0/24`.',
            acceptedInputs: [{ type: 'exact', value: 'ui:targets.save name=Internal_Subnet hosts=10.10.24.0/24' }],
            validation: { type: 'commandExecuted' },
            hint: 'The default target dialog values already match the source lab.',
            points: 10,
            checkOnLearning: 'vm-1.col-2',
          },
        ],
      },
      {
        id: 'ex3',
        upstreamHeading: 'Exercise 3: Performing a Basic Network Scan',
        steps: [
          {
            id: 'vm-1.ex3.s1',
            upstream: { exercise: 'Exercise 3', stepNumber: 1, sourceLine: 'In the OpenVAS web interface, go to the "Scans" section and select "Tasks".' },
            kind: 'command',
            instruction: 'Navigate to `Scans > Tasks` to create the first vulnerability scan task.',
            acceptedInputs: [{ type: 'exact', value: 'ui:nav Scans/Tasks' }],
            validation: { type: 'commandExecuted' },
            hint: 'Use the `Scans` tab in the Greenbone header.',
            points: 10,
          },
          {
            id: 'vm-1.ex3.s2',
            upstream: { exercise: 'Exercise 3', stepNumber: 2, sourceLine: 'Click "New Task" to create a new scan task.' },
            kind: 'command',
            instruction: 'Open the `New Task` dialog.',
            acceptedInputs: [{ type: 'exact', value: 'ui:tasks.new' }],
            validation: { type: 'commandExecuted' },
            hint: 'The `+ New Task` button is enabled after at least one target exists.',
            points: 10,
          },
          {
            id: 'vm-1.ex3.s3',
            upstream: { exercise: 'Exercise 3', stepNumber: 3, sourceLine: 'Fill in the task details, selecting the previously created target.' },
            kind: 'command',
            instruction: 'Create a `Weekly_Internal_Scan` task that uses the `Internal_Subnet` target and the `Full and fast` profile.',
            acceptedInputs: [{ type: 'exact', value: 'ui:tasks.save name=Weekly_Internal_Scan target=Internal_Subnet config=Full and fast' }],
            validation: { type: 'commandExecuted' },
            hint: 'The default task dialog values already match the intended scan settings.',
            points: 10,
          },
          {
            id: 'vm-1.ex3.s4',
            upstream: { exercise: 'Exercise 3', stepNumber: 4, sourceLine: 'Save the task and start the scan.' },
            kind: 'command',
            instruction: 'Start the newly created scan task.',
            acceptedInputs: [{ type: 'exact', value: 'ui:tasks.start id=k1' }],
            validation: { type: 'commandExecuted' },
            hint: 'Click the `Start` action on the first task row.',
            points: 10,
            checkOnLearning: 'vm-1.col-3',
          },
        ],
      },
      {
        id: 'ex4',
        upstreamHeading: 'Exercise 4: Reviewing Scan Results',
        steps: [
          {
            id: 'vm-1.ex4.s1',
            upstream: { exercise: 'Exercise 4', stepNumber: 1, sourceLine: 'Once the scan is complete, navigate to the "Scans" section and select "Reports".' },
            kind: 'command',
            instruction: 'Open the `Scans > Reports` page after the task completes.',
            acceptedInputs: [{ type: 'exact', value: 'ui:nav Scans/Reports' }],
            validation: { type: 'commandExecuted' },
            hint: 'Use the `Reports` area under `Scans`.',
            points: 10,
          },
          {
            id: 'vm-1.ex4.s2',
            upstream: { exercise: 'Exercise 4', stepNumber: 2, sourceLine: 'Click on the report corresponding to the completed scan task.' },
            kind: 'command',
            instruction: 'Open the report for the completed `Weekly_Internal_Scan` task.',
            acceptedInputs: [{ type: 'exact', value: 'ui:reports.open id=r1' }],
            validation: { type: 'commandExecuted' },
            hint: 'Use the `Open` button on the first report row.',
            points: 10,
          },
          {
            id: 'vm-1.ex4.s3',
            upstream: { exercise: 'Exercise 4', stepNumber: 3, sourceLine: 'Review the scan results, focusing on identified vulnerabilities and their severity.' },
            kind: 'analyze',
            instruction: 'How many `High` severity findings are listed in the OpenVAS report summary?',
            validation: { type: 'valueExtracted', expected: '8' },
            hint: 'Read the severity tiles in the OpenVAS report pane.',
            points: 10,
            checkOnLearning: 'vm-1.col-4',
          },
        ],
      },
      {
        id: 'ex5',
        upstreamHeading: 'Exercise 5: Remediating Identified Vulnerabilities',
        steps: [
          {
            id: 'vm-1.ex5.s1',
            upstream: { exercise: 'Exercise 5', stepNumber: 1, sourceLine: 'Based on the scan report, identify high-severity vulnerabilities.' },
            kind: 'analyze',
            instruction: 'Which CVE is tied to the Log4Shell critical finding in the report?',
            validation: { type: 'valueExtracted', expected: 'CVE-2021-44228' },
            hint: 'Look for the Apache Log4j remote code execution finding.',
            points: 10,
          },
          {
            id: 'vm-1.ex5.s2',
            upstream: { exercise: 'Exercise 5', stepNumber: 2, sourceLine: 'Research and implement remediation steps for the identified vulnerabilities (e.g., applying patches, configuring firewalls).' },
            kind: 'command',
            instruction: 'Mark the Log4Shell finding as fixed to simulate remediation tracking.',
            acceptedInputs: [{ type: 'exact', value: 'ui:remediation.mark oid=1.3.6.1.4.1.25623.1.0.117794' }],
            validation: { type: 'commandExecuted' },
            hint: 'Use the `Mark fixed` action on the Apache Log4j finding row.',
            points: 10,
          },
          {
            id: 'vm-1.ex5.s3',
            upstream: { exercise: 'Exercise 5', stepNumber: 3, sourceLine: 'Return to the task list before starting the verification scan.' },
            kind: 'command',
            instruction: 'Navigate back to `Scans > Tasks` to launch the verification scan.',
            acceptedInputs: [{ type: 'exact', value: 'ui:nav Scans/Tasks' }],
            validation: { type: 'commandExecuted' },
            hint: 'Use the `Scans` tab and return to the Tasks view.',
            points: 10,
          },
          {
            id: 'vm-1.ex5.s4',
            upstream: { exercise: 'Exercise 5', stepNumber: 3, sourceLine: 'Re-scan the target to verify that vulnerabilities have been mitigated.' },
            kind: 'command',
            instruction: 'Return to the Tasks page and trigger a re-scan to verify the remediation workflow.',
            acceptedInputs: [{ type: 'exact', value: 'ui:tasks.rescan' }],
            validation: { type: 'commandExecuted' },
            hint: 'The `Rescan` action appears on completed tasks in `Scans > Tasks`.',
            points: 10,
            checkOnLearning: 'vm-1.col-5',
          },
        ],
      },
    ],
    checkOnLearning: [
      mkQuestion('vm-1.col-1', 'vm-1.ex1.s7', 'Why do analysts start the GVM stack before browsing to port 9392?', 'single-select', [
        { id: 'a', text: 'It exposes the management UI and scanner daemons needed for the lab.', correct: true },
        { id: 'b', text: 'It clears existing findings from the database.', correct: false },
        { id: 'c', text: 'It disables TLS validation in the browser.', correct: false },
      ], 'recall'),
      mkQuestion('vm-1.col-2', 'vm-1.ex2.s5', 'Why is defining the exact target subnet important before launching a scan?', 'multi-select', [
        { id: 'a', text: 'It limits the assessment scope to the intended hosts.', correct: true },
        { id: 'b', text: 'It makes severity scores automatically lower.', correct: false },
        { id: 'c', text: 'It reduces the chance of scanning unrelated systems.', correct: true },
        { id: 'd', text: 'It guarantees every host is patched.', correct: false },
      ], 'comprehension'),
      mkQuestion('vm-1.col-3', 'vm-1.ex3.s4', 'What does the `Full and fast` profile trade off compared with a deeper credentialed scan?', 'single-select', [
        { id: 'a', text: 'It is quicker but may miss host-level detail that credentials would expose.', correct: true },
        { id: 'b', text: 'It produces only informational findings.', correct: false },
        { id: 'c', text: 'It scans only web applications.', correct: false },
      ], 'application'),
      mkQuestion('vm-1.col-4', 'vm-1.ex4.s3', 'A cluster of High findings on a public subnet most strongly suggests what next action?', 'single-select', [
        { id: 'a', text: 'Prioritize remediation planning and confirm internet exposure.', correct: true },
        { id: 'b', text: 'Ignore them until a Critical appears.', correct: false },
        { id: 'c', text: 'Delete the task and rescan later.', correct: false },
      ], 'analysis'),
      mkQuestion('vm-1.col-5', 'vm-1.ex5.s4', 'Why do analysts re-scan after documenting a remediation change?', 'single-select', [
        { id: 'a', text: 'To verify the vulnerable condition is no longer present and confirm the fix worked.', correct: true },
        { id: 'b', text: 'To automatically delete all previous findings from the report history.', correct: false },
        { id: 'c', text: 'To convert High findings into Informational findings without patching.', correct: false },
      ], 'comprehension'),
    ],
    completion: { requireAllSteps: true, minQuizScore: 0.8 },
  };

  const VM_2 = {
    id: 'vm-2',
    track: 'vulnerability-management',
    title: 'Nessus Vulnerability Assessment',
    difficulty: 'Beginner',
    estimatedTime: '60 min',
    icon: 'N',
    tags: ['Nessus', 'Plugin IDs', 'CVSS', 'Host Triage', 'Reporting'],
    source: {
      repo: REPO,
      file: 'Project-2-Vulnerability-Assessment-using-Nessus.md',
      sha256: '3bebf6c1a006070a41beb6d2056f71e72da8699531c5baeeeb88c4e6d3215683',
      snapshot: 'src/data/sources/vm-2.source.md',
    },
    environment: {
      type: 'mixed',
      shell: 'NessusLabShell',
      fs: function () {
        return makeAnalystFs('nessus-01', [
          'Nessus URL: https://172.16.56.12:8834',
          'Create policy: Basic Network Scan',
          'Pilot target: filesrv-01, web-02, vpn-gw-01',
        ]);
      },
    },
    scenario: {
      role: 'SOC analyst validating exposure before a quarterly patch window',
      incident: 'The patching team wants a fast Nessus baseline for three externally reachable hosts. Stand up Nessus, create the standard policy, launch the scan, and identify the riskiest host before exporting evidence.',
    },
    exercises: [
      {
        id: 'ex1',
        upstreamHeading: 'Exercise 1: Installing Nessus',
        steps: [
          {
            id: 'vm-2.ex1.s1',
            upstream: { exercise: 'Exercise 1', stepNumber: 3, sourceLine: 'sudo systemctl start nessusd' },
            kind: 'command',
            instruction: 'Start the Nessus daemon for the guided assessment environment.',
            acceptedInputs: [{ type: 'exact', value: 'sudo systemctl start nessusd' }],
            validation: { type: 'commandExecuted' },
            hint: 'Use the daemon-start quick action.',
            points: 10,
            checkOnLearning: 'vm-2.col-1',
          },
        ],
      },
      {
        id: 'ex2',
        upstreamHeading: 'Exercise 2: Configuring Nessus for Scanning',
        steps: [
          {
            id: 'vm-2.ex2.s1',
            upstream: { exercise: 'Exercise 2', stepNumber: 2, sourceLine: 'Complete the initial setup by creating an admin account and activating Nessus with the provided activation code.' },
            kind: 'command',
            instruction: 'Finish the initial Nessus setup flow so the scanner is ready for policy creation.',
            acceptedInputs: [{ type: 'exact', value: 'nessus:complete-setup admin' }],
            validation: { type: 'commandExecuted' },
            hint: 'The browser shell includes a `Complete setup` action.',
            points: 10,
            checkOnLearning: 'vm-2.col-2',
          },
        ],
      },
      {
        id: 'ex3',
        upstreamHeading: 'Exercise 3: Creating a Scan Policy',
        steps: [
          {
            id: 'vm-2.ex3.s1',
            upstream: { exercise: 'Exercise 3', stepNumber: 3, sourceLine: 'Choose a policy template that suits your needs (e.g., Basic Network Scan).' },
            kind: 'command',
            instruction: 'Create a `Basic Network Scan` policy for the perimeter baseline.',
            acceptedInputs: [{ type: 'exact', value: 'nessus:create-policy Basic Network Scan' }],
            validation: { type: 'commandExecuted' },
            hint: 'Use the policy builder card in the Nessus UI.',
            points: 10,
            checkOnLearning: 'vm-2.col-3',
          },
        ],
      },
      {
        id: 'ex4',
        upstreamHeading: 'Exercise 4: Running a Vulnerability Scan',
        steps: [
          {
            id: 'vm-2.ex4.s1',
            upstream: { exercise: 'Exercise 4', stepNumber: 4, sourceLine: 'Save the scan and click "Launch" to start the scan.' },
            kind: 'analyze',
            instruction: 'Which host shows the highest risk after the Nessus scan completes?',
            validation: { type: 'valueExtracted', expected: 'filesrv-01.corp.example.local' },
            hint: 'Check the host table and compare the Critical column first.',
            points: 10,
            checkOnLearning: 'vm-2.col-4',
          },
        ],
      },
      {
        id: 'ex5',
        upstreamHeading: 'Exercise 5: Analyzing Scan Results',
        steps: [
          {
            id: 'vm-2.ex5.s1',
            upstream: { exercise: 'Exercise 5', stepNumber: 3, sourceLine: 'Export the scan report in your preferred format (e.g., PDF, HTML).' },
            kind: 'command',
            instruction: 'Export the Nessus scan as a PDF report for the quarterly review packet.',
            acceptedInputs: [{ type: 'exact', value: 'nessus:export-report pdf' }],
            validation: { type: 'commandExecuted' },
            hint: 'Use the report button in the scan header.',
            points: 10,
            checkOnLearning: 'vm-2.col-5',
          },
        ],
      },
    ],
    checkOnLearning: [
      mkQuestion('vm-2.col-1', 'vm-2.ex1.s1', 'Why must `nessusd` be running before the browser workflow succeeds?', 'single-select', [
        { id: 'a', text: 'The web UI depends on the daemon and plugin engine being available.', correct: true },
        { id: 'b', text: 'It changes the target IP addresses automatically.', correct: false },
        { id: 'c', text: 'It deletes old policies on startup.', correct: false },
      ], 'recall'),
      mkQuestion('vm-2.col-2', 'vm-2.ex2.s1', 'What is the purpose of the initial activation and admin setup in Nessus?', 'multi-select', [
        { id: 'a', text: 'It unlocks scanner updates and creates a management account.', correct: true },
        { id: 'b', text: 'It assigns every host the same CVSS score.', correct: false },
        { id: 'c', text: 'It prepares the scanner to create policies and scans.', correct: true },
        { id: 'd', text: 'It disables evidence export.', correct: false },
      ], 'comprehension'),
      mkQuestion('vm-2.col-3', 'vm-2.ex3.s1', 'Why is a reusable policy helpful during repeated assessment cycles?', 'single-select', [
        { id: 'a', text: 'It keeps scan settings consistent across hosts and reporting periods.', correct: true },
        { id: 'b', text: 'It guarantees zero false positives.', correct: false },
        { id: 'c', text: 'It prevents plugin updates.', correct: false },
      ], 'application'),
      mkQuestion('vm-2.col-4', 'vm-2.ex4.s1', 'When prioritizing a Nessus result set, what should usually drive host order first?', 'single-select', [
        { id: 'a', text: 'Critical exposure count combined with asset importance.', correct: true },
        { id: 'b', text: 'Alphabetical hostname sorting.', correct: false },
        { id: 'c', text: 'How recently the policy was saved.', correct: false },
      ], 'analysis'),
      mkQuestion('vm-2.col-5', 'vm-2.ex5.s1', 'Why export the Nessus report after triage?', 'single-select', [
        { id: 'a', text: 'To share evidence with patching and audit stakeholders outside the scanner UI.', correct: true },
        { id: 'b', text: 'To reset plugin IDs.', correct: false },
        { id: 'c', text: 'To disable the scan history.', correct: false },
      ], 'comprehension'),
    ],
    completion: { requireAllSteps: true, minQuizScore: 0.8 },
  };

  const VM_3 = {
    id: 'vm-3',
    track: 'vulnerability-management',
    title: 'QualysGuard',
    difficulty: 'Beginner',
    estimatedTime: '55 min',
    icon: 'Q',
    tags: ['Qualys VMDR', 'QID', 'Patch Reporting', 'Asset Inventory'],
    source: {
      repo: REPO,
      file: 'Project-3-Vulnerability-Management-using-QualysGuard.md',
      sha256: '4dfe461b5e2d0f642682264fe71dd70b3a3eaeda1d2005790d5d3da6d4c43c2d',
      snapshot: 'src/data/sources/vm-3.source.md',
    },
    environment: {
      type: 'web',
      shell: 'QualysLabShell',
    },
    scenario: {
      role: 'VMDR analyst preparing a remediation review for internet-facing systems',
      incident: 'The Qualys tenant already has authenticated telemetry, but a new external asset needs to be added, scanned, and rolled into the next patch report. Build the asset record, launch the scan, and identify the top QID before generating the patch view.',
    },
    exercises: [
      {
        id: 'ex1',
        upstreamHeading: 'Exercise 1: Setting up QualysGuard Account',
        steps: [
          {
            id: 'vm-3.ex1.s1',
            upstream: { exercise: 'Exercise 1', stepNumber: 2, sourceLine: 'Once registered, log in to the QualysGuard portal using the provided credentials.' },
            kind: 'command',
            instruction: 'Enter the Qualys VMDR workspace from the guided portal shell.',
            acceptedInputs: [{ type: 'exact', value: 'qualys:login-trial' }],
            validation: { type: 'commandExecuted' },
            hint: 'Use the `Open VMDR workspace` action.',
            points: 10,
            checkOnLearning: 'vm-3.col-1',
          },
        ],
      },
      {
        id: 'ex2',
        upstreamHeading: 'Exercise 2: Configuring Scanning Assets',
        steps: [
          {
            id: 'vm-3.ex2.s1',
            upstream: { exercise: 'Exercise 2', stepNumber: 4, sourceLine: 'Save the new asset.' },
            kind: 'command',
            instruction: 'Add asset `10.20.14.25` to the Qualys asset inventory.',
            acceptedInputs: [{ type: 'exact', value: 'qualys:add-asset 10.20.14.25' }],
            validation: { type: 'commandExecuted' },
            hint: 'The Assets panel contains a pre-filled add action.',
            points: 10,
            checkOnLearning: 'vm-3.col-2',
          },
        ],
      },
      {
        id: 'ex3',
        upstreamHeading: 'Exercise 3: Creating and Launching a Scan',
        steps: [
          {
            id: 'vm-3.ex3.s1',
            upstream: { exercise: 'Exercise 3', stepNumber: 5, sourceLine: 'Launch the scan.' },
            kind: 'command',
            instruction: 'Launch the internal scan for the newly added production web tier.',
            acceptedInputs: [{ type: 'exact', value: 'qualys:launch-internal-scan vm-web-tier' }],
            validation: { type: 'commandExecuted' },
            hint: 'Use the scan launcher after the asset is present.',
            points: 10,
            checkOnLearning: 'vm-3.col-3',
          },
        ],
      },
      {
        id: 'ex4',
        upstreamHeading: 'Exercise 4: Reviewing Scan Results',
        steps: [
          {
            id: 'vm-3.ex4.s1',
            upstream: { exercise: 'Exercise 4', stepNumber: 2, sourceLine: 'Review the scan summary and details, focusing on detected vulnerabilities and their severity.' },
            kind: 'analyze',
            instruction: 'Which QID is marked as the highest-priority external exposure in the Qualys findings table?',
            validation: { type: 'valueExtracted', expected: '376157' },
            hint: 'Look for the finding with severity 5 and the highest exposed-host count.',
            points: 10,
            checkOnLearning: 'vm-3.col-4',
          },
        ],
      },
      {
        id: 'ex5',
        upstreamHeading: 'Exercise 5: Creating a Remediation Plan',
        steps: [
          {
            id: 'vm-3.ex5.s1',
            upstream: { exercise: 'Exercise 5', stepNumber: 4, sourceLine: 'Include details about the vulnerabilities, recommended fixes, and a timeline for remediation.' },
            kind: 'command',
            instruction: 'Generate the patch report that the remediation team will use as its work queue.',
            acceptedInputs: [{ type: 'exact', value: 'qualys:create-patch-report' }],
            validation: { type: 'commandExecuted' },
            hint: 'Use the patch report action from the report card.',
            points: 10,
            checkOnLearning: 'vm-3.col-5',
          },
        ],
      },
    ],
    checkOnLearning: [
      mkQuestion('vm-3.col-1', 'vm-3.ex1.s1', 'What does the Qualys VMDR workspace centralize for the analyst?', 'single-select', [
        { id: 'a', text: 'Asset inventory, findings, and remediation reporting in one portal.', correct: true },
        { id: 'b', text: 'Only passive packet capture.', correct: false },
        { id: 'c', text: 'A local package manager.', correct: false },
      ], 'recall'),
      mkQuestion('vm-3.col-2', 'vm-3.ex2.s1', 'Why is clean asset inventory data essential in Qualys?', 'multi-select', [
        { id: 'a', text: 'It ensures findings map to the right host population.', correct: true },
        { id: 'b', text: 'It helps remediation teams scope ownership correctly.', correct: true },
        { id: 'c', text: 'It automatically approves all patches.', correct: false },
        { id: 'd', text: 'It removes the need for validation.', correct: false },
      ], 'comprehension'),
      mkQuestion('vm-3.col-3', 'vm-3.ex3.s1', 'What is the operational value of launching an internal scan after adding a new asset?', 'single-select', [
        { id: 'a', text: 'It builds a vulnerability baseline for that asset under current conditions.', correct: true },
        { id: 'b', text: 'It permanently suppresses QIDs.', correct: false },
        { id: 'c', text: 'It converts the asset into a patch server.', correct: false },
      ], 'application'),
      mkQuestion('vm-3.col-4', 'vm-3.ex4.s1', 'Why does a severity-5 QID with broad exposure rise to the top of the queue?', 'single-select', [
        { id: 'a', text: 'It combines exploit severity with a larger blast radius.', correct: true },
        { id: 'b', text: 'Because it appears first alphabetically.', correct: false },
        { id: 'c', text: 'Because all QIDs are equally urgent.', correct: false },
      ], 'analysis'),
      mkQuestion('vm-3.col-5', 'vm-3.ex5.s1', 'Why generate a patch report instead of sharing raw findings alone?', 'single-select', [
        { id: 'a', text: 'Patch reports translate findings into remediation-oriented action lists.', correct: true },
        { id: 'b', text: 'They hide the affected assets from operators.', correct: false },
        { id: 'c', text: 'They disable future scans.', correct: false },
      ], 'comprehension'),
    ],
    completion: { requireAllSteps: true, minQuizScore: 0.8 },
  };

  const VM_4 = {
    id: 'vm-4',
    track: 'vulnerability-management',
    title: 'OWASP ZAP',
    difficulty: 'Beginner',
    estimatedTime: '55 min',
    icon: 'Z',
    tags: ['OWASP ZAP', 'Proxy', 'Spider', 'Active Scan', 'XSS'],
    source: {
      repo: REPO,
      file: 'Project-4-Web-Application-Vulnerability-Detection-with-OWASP-ZAP.md',
      sha256: 'e2a0d3d0748b9319a941658067de2e3358f3a52e2632980db6aa768020166114',
      snapshot: 'src/data/sources/vm-4.source.md',
    },
    environment: {
      type: 'mixed',
      shell: 'ZAPLabShell',
      fs: function () {
        return makeAnalystFs('appsec-01', [
          'Proxy target: https://app.example.local/',
          'Local proxy: localhost:8080',
          'Focus alert: reflected XSS in /search',
        ]);
      },
    },
    scenario: {
      role: 'Application security analyst validating a pre-release portal',
      incident: 'A staging web application is ready for a lightweight security pass. Stand up ZAP, proxy the browser, spider the site, run an active scan, and confirm how many high-confidence reflected XSS alerts were generated.',
    },
    exercises: [
      {
        id: 'ex1',
        upstreamHeading: 'Exercise 1: Installing OWASP ZAP',
        steps: [
          {
            id: 'vm-4.ex1.s1',
            upstream: { exercise: 'Exercise 1', stepNumber: 2, sourceLine: 'On Linux: Extract the downloaded package and run the `zap.sh` script' },
            kind: 'command',
            instruction: 'Install the packaged ZAP tooling for the staging assessment host.',
            acceptedInputs: [{ type: 'exact', value: 'sudo apt install zaproxy -y' }],
            validation: { type: 'commandExecuted' },
            hint: 'Use the installer action in the terminal rail.',
            points: 10,
            checkOnLearning: 'vm-4.col-1',
          },
        ],
      },
      {
        id: 'ex2',
        upstreamHeading: 'Exercise 2: Configuring OWASP ZAP',
        steps: [
          {
            id: 'vm-4.ex2.s1',
            upstream: { exercise: 'Exercise 2', stepNumber: 2, sourceLine: 'Set the proxy server to `localhost` and the port to `8080`.' },
            kind: 'command',
            instruction: 'Configure the browser proxy so the application traffic flows through ZAP.',
            acceptedInputs: [{ type: 'exact', value: 'zap:configure-proxy localhost:8080' }],
            validation: { type: 'commandExecuted' },
            hint: 'The proxy card toggles the browser to the local listener.',
            points: 10,
            checkOnLearning: 'vm-4.col-2',
          },
        ],
      },
      {
        id: 'ex3',
        upstreamHeading: 'Exercise 3: Performing a Passive Scan',
        steps: [
          {
            id: 'vm-4.ex3.s1',
            upstream: { exercise: 'Exercise 3', stepNumber: 3, sourceLine: 'Browse through the web application to capture the traffic.' },
            kind: 'command',
            instruction: 'Spider the proxied application to populate the Sites tree and passive findings.',
            acceptedInputs: [{ type: 'exact', value: 'zap:spider https://app.example.local/' }],
            validation: { type: 'commandExecuted' },
            hint: 'Use the spider action once the proxy is marked active.',
            points: 10,
            checkOnLearning: 'vm-4.col-3',
          },
        ],
      },
      {
        id: 'ex4',
        upstreamHeading: 'Exercise 4: Performing an Active Scan',
        steps: [
          {
            id: 'vm-4.ex4.s1',
            upstream: { exercise: 'Exercise 4', stepNumber: 3, sourceLine: 'Configure the scan settings and start the scan.' },
            kind: 'command',
            instruction: 'Launch the active scan against `https://app.example.local/`.',
            acceptedInputs: [{ type: 'exact', value: 'zap:active-scan https://app.example.local/' }],
            validation: { type: 'commandExecuted' },
            hint: 'The active-scan action appears in the Alerts workspace.',
            points: 10,
            checkOnLearning: 'vm-4.col-4',
          },
        ],
      },
      {
        id: 'ex5',
        upstreamHeading: 'Exercise 5: Reviewing and Analyzing Scan Results',
        steps: [
          {
            id: 'vm-4.ex5.s1',
            upstream: { exercise: 'Exercise 5', stepNumber: 2, sourceLine: 'Review the list of identified vulnerabilities, categorized by severity.' },
            kind: 'analyze',
            instruction: 'How many high-confidence reflected XSS alerts are visible in the ZAP Alerts tab?',
            validation: { type: 'valueExtracted', expected: '3' },
            hint: 'Read the alert list after the active scan completes.',
            points: 10,
            checkOnLearning: 'vm-4.col-5',
          },
        ],
      },
    ],
    checkOnLearning: [
      mkQuestion('vm-4.col-1', 'vm-4.ex1.s1', 'What role does the ZAP client itself play in this workflow?', 'single-select', [
        { id: 'a', text: 'It acts as the intercepting proxy and scanning console.', correct: true },
        { id: 'b', text: 'It replaces the target application server.', correct: false },
        { id: 'c', text: 'It approves Windows patches.', correct: false },
      ], 'recall'),
      mkQuestion('vm-4.col-2', 'vm-4.ex2.s1', 'Why point the browser at `localhost:8080`?', 'multi-select', [
        { id: 'a', text: 'So ZAP can observe requests and responses in transit.', correct: true },
        { id: 'b', text: 'So passive checks can run on captured traffic.', correct: true },
        { id: 'c', text: 'So the site certificate becomes automatically trusted everywhere.', correct: false },
        { id: 'd', text: 'So XSS is prevented by default.', correct: false },
      ], 'comprehension'),
      mkQuestion('vm-4.col-3', 'vm-4.ex3.s1', 'What does spidering the application primarily provide before active testing?', 'single-select', [
        { id: 'a', text: 'A map of reachable pages and parameters for later testing.', correct: true },
        { id: 'b', text: 'Guaranteed exploit verification.', correct: false },
        { id: 'c', text: 'A patch deployment plan.', correct: false },
      ], 'application'),
      mkQuestion('vm-4.col-4', 'vm-4.ex4.s1', 'Why is active scanning riskier than passive browsing in a test environment?', 'single-select', [
        { id: 'a', text: 'It sends attack payloads that can change application behavior.', correct: true },
        { id: 'b', text: 'It hides every alert from the analyst.', correct: false },
        { id: 'c', text: 'It cannot discover input points.', correct: false },
      ], 'analysis'),
      mkQuestion('vm-4.col-5', 'vm-4.ex5.s1', 'Why do repeated reflected XSS alerts deserve immediate review?', 'single-select', [
        { id: 'a', text: 'They suggest user-controlled input is being reflected without proper encoding.', correct: true },
        { id: 'b', text: 'They always indicate a server patch is missing.', correct: false },
        { id: 'c', text: 'They are only cosmetic browser warnings.', correct: false },
      ], 'analysis'),
    ],
    completion: { requireAllSteps: true, minQuizScore: 0.8 },
  };

  const VM_5 = {
    id: 'vm-5',
    track: 'vulnerability-management',
    title: 'WSUS Patch Management',
    difficulty: 'Beginner',
    estimatedTime: '50 min',
    icon: 'W',
    tags: ['WSUS', 'Patching', 'GPO', 'KB', 'Compliance'],
    source: {
      repo: REPO,
      file: 'Project-5-Patch-Management-and-Vulnerability-Remediation-using-WSUS.md',
      sha256: '10c8552df7fb58f50131b5a1811cd5bc73a6bd105ee2a64ba650fd4f8c884167',
      snapshot: 'src/data/sources/vm-5.source.md',
    },
    environment: {
      type: 'mixed',
      shell: 'WSUSLabShell',
    },
    scenario: {
      role: 'Endpoint operations analyst running the monthly security update cycle',
      incident: 'A critical Microsoft update must be approved through WSUS, clients need to check in, and compliance needs to be reviewed before leadership signs off on the maintenance window.',
    },
    exercises: [
      {
        id: 'ex1',
        upstreamHeading: 'Exercise 1: Installing and Configuring WSUS',
        steps: [
          {
            id: 'vm-5.ex1.s1',
            upstream: { exercise: 'Exercise 1', stepNumber: 3, sourceLine: 'Select "Windows Server Update Services".' },
            kind: 'command',
            instruction: 'Install the WSUS role from Server Manager in the guided console.',
            acceptedInputs: [{ type: 'exact', value: 'wsus:add-role' }],
            validation: { type: 'commandExecuted' },
            hint: 'Use the `Add WSUS role` action in the left rail.',
            points: 10,
            checkOnLearning: 'vm-5.col-1',
          },
        ],
      },
      {
        id: 'ex2',
        upstreamHeading: 'Exercise 2: Configuring Group Policies for WSUS',
        steps: [
          {
            id: 'vm-5.ex2.s1',
            upstream: { exercise: 'Exercise 2', stepNumber: 4, sourceLine: 'Specify Intranet Microsoft update service location: Set it to the WSUS server URL.' },
            kind: 'command',
            instruction: 'Apply the intranet update-service policy so clients use `http://wsus-01:8530`.',
            acceptedInputs: [{ type: 'exact', value: 'wsus:configure-gpo http://wsus-01:8530' }],
            validation: { type: 'commandExecuted' },
            hint: 'Configure the policy card before approving updates.',
            points: 10,
            checkOnLearning: 'vm-5.col-2',
          },
        ],
      },
      {
        id: 'ex3',
        upstreamHeading: 'Exercise 3: Approving and Deploying Updates',
        steps: [
          {
            id: 'vm-5.ex3.s1',
            upstream: { exercise: 'Exercise 3', stepNumber: 4, sourceLine: 'Right-click on the selected updates and choose "Approve".' },
            kind: 'command',
            instruction: 'Approve update `KB5034122` for the pilot workstation group.',
            acceptedInputs: [{ type: 'exact', value: 'wsus:approve-update KB5034122' }],
            validation: { type: 'commandExecuted' },
            hint: 'Approve the Critical update in the Updates pane.',
            points: 10,
            checkOnLearning: 'vm-5.col-3',
          },
        ],
      },
      {
        id: 'ex4',
        upstreamHeading: 'Exercise 4: Verifying Update Status on Client Machines',
        steps: [
          {
            id: 'vm-5.ex4.s1',
            upstream: { exercise: 'Exercise 4', stepNumber: 2, sourceLine: 'wuauclt /detectnow' },
            kind: 'command',
            instruction: 'Force the pilot clients to check in after the approval is published.',
            acceptedInputs: [{ type: 'exact', value: 'wuauclt /detectnow' }],
            validation: { type: 'commandExecuted' },
            hint: 'Use the client check-in action in the console rail.',
            points: 10,
            checkOnLearning: 'vm-5.col-4',
          },
        ],
      },
      {
        id: 'ex5',
        upstreamHeading: 'Exercise 5: Generating and Analyzing WSUS Reports',
        steps: [
          {
            id: 'vm-5.ex5.s1',
            upstream: { exercise: 'Exercise 5', stepNumber: 4, sourceLine: 'Analyze the report to review update compliance and identify any issues.' },
            kind: 'analyze',
            instruction: 'How many pilot clients are fully compliant after the WSUS deployment finishes?',
            validation: { type: 'valueExtracted', expected: '3' },
            hint: 'Check the `Installed/Not Applicable` status count in the computer summary.',
            points: 10,
            checkOnLearning: 'vm-5.col-5',
          },
        ],
      },
    ],
    checkOnLearning: [
      mkQuestion('vm-5.col-1', 'vm-5.ex1.s1', 'What does adding the WSUS role provide to the environment?', 'single-select', [
        { id: 'a', text: 'A centralized update approval and reporting service.', correct: true },
        { id: 'b', text: 'A web vulnerability scanner.', correct: false },
        { id: 'c', text: 'A packet sniffer.', correct: false },
      ], 'recall'),
      mkQuestion('vm-5.col-2', 'vm-5.ex2.s1', 'Why must clients receive the WSUS server location by policy?', 'multi-select', [
        { id: 'a', text: 'So endpoints know where to obtain approved updates.', correct: true },
        { id: 'b', text: 'So compliance can be tracked centrally.', correct: true },
        { id: 'c', text: 'So browsers trust every internal certificate.', correct: false },
        { id: 'd', text: 'So update severity ratings disappear.', correct: false },
      ], 'comprehension'),
      mkQuestion('vm-5.col-3', 'vm-5.ex3.s1', 'What is the practical effect of approving a WSUS update for a target group?', 'single-select', [
        { id: 'a', text: 'It authorizes those clients to install that update from WSUS.', correct: true },
        { id: 'b', text: 'It forces every server in the domain to reboot immediately.', correct: false },
        { id: 'c', text: 'It deletes superseded updates from the catalog.', correct: false },
      ], 'application'),
      mkQuestion('vm-5.col-4', 'vm-5.ex4.s1', 'Why trigger client detection right after approval?', 'single-select', [
        { id: 'a', text: 'To shorten the time between approval and compliance verification.', correct: true },
        { id: 'b', text: 'To disable the update workflow if failures exist.', correct: false },
        { id: 'c', text: 'To generate a new KB number.', correct: false },
      ], 'analysis'),
      mkQuestion('vm-5.col-5', 'vm-5.ex5.s1', 'What does a compliance report let the operations team decide?', 'single-select', [
        { id: 'a', text: 'Whether deployment succeeded broadly enough to close the maintenance window.', correct: true },
        { id: 'b', text: 'Whether to uninstall WSUS.', correct: false },
        { id: 'c', text: 'Whether CVEs are no longer valid.', correct: false },
      ], 'analysis'),
    ],
    completion: { requireAllSteps: true, minQuizScore: 0.8 },
  };

  Object.assign(window.MISSION_NEXT_LABS = window.MISSION_NEXT_LABS || {}, {
    'vm-1': VM_1,
    'vm-2': VM_2,
    'vm-3': VM_3,
    'vm-4': VM_4,
    'vm-5': VM_5,
  });
})();
