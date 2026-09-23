(function () {
  const REPO = '0xrajneesh/Active-Directory-Monitoring-Projects';
  const HASHES = {
    'ad-1': '28f82f67be4947415b92f63a36a503a4f7a84db887dc71fe708ba8f6e300efd0',
    'ad-2': 'ace5ff8d53b8d129c5c200315bcd4a96ace2f7e7a8c7b3fcad20ed30303d4d8e',
    'ad-3': '517be79c6e500a2becdcc7ec3119aa5ff2b991a027fc15960238fa032f98d50a',
    'ad-4': '2cdfaab2f093856c683e502dd3fa585a5465680ef0a9a19d0f8b7516cb1441e3',
    'ad-5': '92bc2b685fd169afdca8f1cc40ebc357b660684f653434233925c34d6985af3e',
    'ad-6': '98d28660c9b563a3d0ea75db5e8504f6362e8bb515deef3bc3c9b7845375c605',
    'ad-7': '1099d2909047c659f6480c942b08a5a4a2eefc9cc177ecbeedbe838391fa7ab2',
  };

  function fsFor(product) {
    return {
      home: {
        student: {
          '.bashrc': 'alias ll="ls -la"\n',
          'ad-monitoring-runbook.txt': [
            'Domain: corp.example.local',
            'Domain controller: DC-01.corp.example.local / 10.10.24.10',
            'Service accounts: svc-monitor, svc-splunkuf, svc-datadog',
            'Baseline: CPU 22%, failed logons 7/hour, lockouts 1/day',
          ].join('\n') + '\n',
        },
      },
      etc: { hostname: product.toLowerCase().replace(/\s+/g, '-') + '-01\n' },
      opt: {
        monitoring: {
          'prometheus.yml': 'scrape_configs:\n  - job_name: windows\n    static_configs:\n      - targets: [DC-01.corp.example.local:9182]\n',
          'alert-rules.yml': 'groups:\n- name: active-directory\n  rules: []\n',
        },
      },
      var: {
        log: {
          'ad-security-sample.log': [
            '2026-04-23T09:11:12Z DC-01 4624 user=j.smith src=10.10.24.42',
            '2026-04-23T09:16:39Z DC-01 4625 user=a.rivera src=203.0.113.44',
            '2026-04-23T09:17:02Z DC-01 4740 user=a.rivera caller=WKSTN-15',
          ].join('\n') + '\n',
        },
      },
      tmp: {},
    };
  }

  function q(id, stepId, question, bloom, options) {
    return {
      id,
      question,
      type: 'single-select',
      options: options || [
        { id: 'a', text: 'The monitoring tool is receiving AD telemetry from DC-01.corp.example.local.', correct: true },
        { id: 'b', text: 'The domain controller was removed from corp.example.local.', correct: false },
        { id: 'c', text: 'The step disables collection to reduce noise.', correct: false },
      ],
      triggerOn: { stepId },
      reinforces: stepId,
      bloom,
      passThreshold: 'any-correct',
    };
  }

  function step(labId, ex, n, sourceLine, instruction, action, col) {
    const s = {
      id: `${labId}.ex${ex}.s${n}`,
      upstream: { exercise: `Exercise ${ex}`, stepNumber: n, sourceLine },
      kind: 'command',
      instruction,
      acceptedInputs: [{ type: 'exact', value: action }],
      validation: { type: 'commandExecuted' },
      hint: 'Use the highlighted action in the simulator. It mirrors the upstream workflow step.',
      points: 10,
    };
    if (col) s.checkOnLearning = col;
    return s;
  }

  function exercise(labId, exNum, heading, lines) {
    return {
      id: `ex${exNum}`,
      upstreamHeading: heading,
      steps: lines.map((item, i) => step(labId, exNum, i + 1, item[0], item[1], `ad:${labId}:ex${exNum}:s${i + 1}`, item[2] || null)),
    };
  }

  function lab(id, title, file, shell, product, exercises) {
    const flatLastByExercise = exercises.map((ex, i) => `${id}.ex${i + 1}.s${ex.steps.length}`);
    return {
      id,
      track: 'active-directory',
      title,
      difficulty: 'Beginner',
      estimatedTime: id === 'ad-7' ? '70 min' : '60 min',
      icon: 'AD',
      tags: ['Active Directory', product, 'Monitoring', 'corp.example.local'],
      source: { repo: REPO, file, sha256: HASHES[id], snapshot: `src/data/sources/${id}.source.md` },
      environment: { type: 'mixed', shell, fs: () => fsFor(product) },
      scenario: {
        role: 'SOC analyst responsible for Active Directory monitoring',
        incident: `corp.example.local needs ${product} telemetry for DC-01, logon events, lockouts, and performance alerting.`,
      },
      exercises,
      checkOnLearning: flatLastByExercise.map((stepId, i) => q(`${id}.col-${i + 1}`, stepId, [
        'Why verify ingestion before building AD dashboards?',
        'What does a logon-event panel help the analyst see?',
        'Why isolate failed logons and lockouts into security metrics?',
        'What makes CPU alerting useful for domain-controller health?',
        'Why save the final dashboard or report layout?',
        'Why should security graphs stay near performance graphs?',
      ][i] || 'Why does this monitoring step matter?', ['recall', 'comprehension', 'application', 'analysis', 'application', 'analysis'][i] || 'recall')),
      completion: { requireAllSteps: true, minQuizScore: 80 },
    };
  }

  const AD1 = lab('ad-1', 'AD Monitoring with Grafana', 'project-1-active-directory-monitoring-with-grafana.md', 'GrafanaLabShell', 'Grafana', [
    exercise('ad-1', 1, 'Exercise 1: Setting up Prometheus Data Source in Grafana', [
      ['Log in to Grafana.', 'Log in to Grafana as admin/admin and complete the password-change prompt.'],
      ['Navigate to "Configuration" > "Data Sources".', 'Open Configuration > Data Sources.'],
      ['Click "Add data source" and select "Prometheus".', 'Add Prometheus as the data source type.'],
      ['Enter the Prometheus server URL and click "Save & Test".', 'Set the Prometheus URL to http://monitor-01:9090 and save/test.', 'ad-1.col-1'],
    ]),
    exercise('ad-1', 2, 'Exercise 2: Creating a Dashboard for AD Metrics', [
      ['Go to "Create" > "Dashboard".', 'Create a new Grafana dashboard.'],
      ['Click "Add new panel".', 'Add a new dashboard panel.'],
      ['Select a metric from Prometheus related to AD.', 'Select windows_logical_disk_free_bytes.'],
      ['Configure the visualization type.', 'Use a gauge visualization.'],
      ['Click "Apply".', 'Apply the AD disk-free panel.', 'ad-1.col-2'],
    ]),
    exercise('ad-1', 3, 'Exercise 3: Monitoring AD User Logon Events', [
      ['Ensure the Windows Exporter is configured to collect Event Log metrics.', 'Verify Event Log collection is enabled.'],
      ['Create a new panel in Grafana.', 'Create a logon-events panel.'],
      ['Select a metric for user logon events.', 'Query windows_eventlog_security_logon.'],
      ['Apply filters to focus on specific event IDs.', 'Filter for Event ID 4624 and 4625.', 'ad-1.col-3'],
    ]),
    exercise('ad-1', 4, 'Exercise 4: Setting Up Alerts for AD Performance Issues', [
      ['Edit a panel showing critical AD metrics.', 'Edit the CPU panel.'],
      ['Go to the "Alert" tab.', 'Open the Alert tab.'],
      ['Define alert conditions.', 'Set CPU > 80% for 5 minutes.'],
      ['Configure notification channels.', 'Send the alert to secops@example.com.'],
      ['Click "Save".', 'Save the Grafana alert rule.', 'ad-1.col-4'],
    ]),
    exercise('ad-1', 5, 'Exercise 5: Visualizing AD Security Events', [
      ['Create a new dashboard specifically for security events.', 'Create an AD Security dashboard.'],
      ['Add panels for various security metrics.', 'Add failed-logon and account-lockout panels.'],
      ['Use appropriate filters to refine the data displayed.', 'Filter failed logons to 4625 and lockouts to 4740.'],
      ['Arrange panels for a comprehensive security overview.', 'Arrange and save the security overview.', 'ad-1.col-5'],
    ]),
  ]);

  const AD2 = lab('ad-2', 'AD Logs and Insights with Splunk', 'project-2-active-directory-monitoring-with-splunk.md', 'SplunkLabShell', 'Splunk', [
    exercise('ad-2', 1, 'Exercise 1: Configuring Data Inputs in Splunk', [
      ['Log in to Splunk.', 'Log in to Splunk Enterprise.'],
      ['Navigate to "Settings" > "Data Inputs".', 'Open Settings > Data Inputs.'],
      ['Click "Add New" and select "Forwarded Data".', 'Add a Forwarded Data input.'],
      ['Configure the input to receive logs from the Universal Forwarder.', 'Accept Windows Security logs from DC-01.', 'ad-2.col-1'],
    ]),
    exercise('ad-2', 2, 'Exercise 2: Creating a Dashboard for AD Logon Events', [
      ['Go to "Dashboards" and click "Create New Dashboard".', 'Create an AD Logons dashboard.'],
      ['Add a new panel and select "Search" as the data source.', 'Add a Search panel.'],
      ['Use a search query to filter logon events.', 'Run index=ad sourcetype=WinEventLog:Security EventCode=4624.'],
      ['Configure visualization and save the panel.', 'Save a timechart logon panel.', 'ad-2.col-2'],
    ]),
    exercise('ad-2', 3, 'Exercise 3: Analyzing AD Security Events', [
      ['Create a new search in Splunk.', 'Open a new Splunk search.'],
      ['Use a search query to filter security events.', 'Run index=ad EventCode=4625 OR EventCode=4740.'],
      ['Save the search and add it to a dashboard.', 'Save the security-event search.'],
      ['Configure the panel to show relevant security metrics.', 'Show failed logons and lockouts by user.', 'ad-2.col-3'],
    ]),
    exercise('ad-2', 4, 'Exercise 4: Setting Up Alerts for AD Anomalies', [
      ['Create a search for an anomaly.', 'Search for more than 20 failed logons in 10 minutes.'],
      ['Save the search and select "Alert".', 'Save the search as an alert.'],
      ['Configure alert conditions and notification settings.', 'Set trigger threshold and email SecOps.'],
      ['Save the alert.', 'Save the AD anomaly alert.', 'ad-2.col-4'],
    ]),
    exercise('ad-2', 5, 'Exercise 5: Generating Reports on AD Activity', [
      ['Create a search for the desired AD activity report.', 'Search daily logons by user.'],
      ['Save the search and select "Report".', 'Save it as a report.'],
      ['Configure the report schedule and format.', 'Schedule the report daily as PDF.'],
      ['Save the report.', 'Save the AD activity report.', 'ad-2.col-5'],
    ]),
  ]);

  const AD3 = lab('ad-3', 'Real-Time AD Metrics with Datadog', 'project-3-real-time-active-directory-monitoring-with-datadog.md', 'DatadogLabShell', 'Datadog', [
    exercise('ad-3', 1, 'Exercise 1: Configuring the Datadog Agent', [
      ['Log in to the Datadog web interface.', 'Log in to Datadog.'],
      ['Navigate to "Integrations" > "Agent" > "Configuration".', 'Open Integrations > Agent > Configuration.'],
      ['Ensure the agent is properly installed and reporting metrics.', 'Verify DC-01 reports through the Agent.'],
      ['Configure the agent to collect additional AD-specific metrics if needed.', 'Enable AD and Windows Event Log checks.', 'ad-3.col-1'],
    ]),
    exercise('ad-3', 2, 'Exercise 2: Creating a Dashboard for AD Metrics', [
      ['Go to "Dashboards" and click "New Dashboard".', 'Create a new Datadog dashboard.'],
      ['Add new widgets for key AD metrics.', 'Add CPU, memory, and logon widgets.'],
      ['Configure each widget\'s visualization and data source.', 'Bind widgets to DC-01 metrics.'],
      ['Arrange the widgets and save the dashboard.', 'Arrange and save the dashboard.', 'ad-3.col-2'],
    ]),
    exercise('ad-3', 3, 'Exercise 3: Monitoring AD Logon Events', [
      ['Ensure the Datadog Agent is collecting Windows Event Logs.', 'Confirm Windows Event Log collection.'],
      ['Create a new widget in the dashboard for logon events.', 'Add a logon-events widget.'],
      ['Use a query to filter logon events.', 'Query @evt.id:4624 OR @evt.id:4625.'],
      ['Configure the widget and save the changes.', 'Save the logon widget.', 'ad-3.col-3'],
    ]),
    exercise('ad-3', 4, 'Exercise 4: Setting Up Alerts for AD Performance Issues', [
      ['Go to "Monitors" and click "New Monitor".', 'Create a new monitor.'],
      ['Select the metric to monitor.', 'Select system.cpu.user for DC-01.'],
      ['Define the alert conditions.', 'Alert when CPU is above 80% for 5 minutes.'],
      ['Configure notification channels and save the monitor.', 'Notify SecOps and save.', 'ad-3.col-4'],
    ]),
    exercise('ad-3', 5, 'Exercise 5: Visualizing AD Security Metrics', [
      ['Create new widgets in the dashboard for security metrics.', 'Add failed-logon and account-lockout widgets.'],
      ['Use appropriate queries to filter the data.', 'Filter failed logons 4625 and lockouts 4740.'],
      ['Configure the visualization for each widget.', 'Use top-list and timeseries views.'],
      ['Arrange the widgets to create a comprehensive security overview.', 'Arrange and save the security section.', 'ad-3.col-5'],
    ]),
  ]);

  const AD4 = lab('ad-4', 'AD Health Checks using Nagios', 'project-4-active-directory-monitoring-using-nagios.md', 'NagiosLabShell', 'Nagios', [
    exercise('ad-4', 1, 'Exercise 1: Adding AD DS Servers to Nagios', [
      ['Edit nagios.cfg to include the servers directory.', 'Include /usr/local/nagios/etc/servers.'],
      ['Create adds.cfg and add AD DS server definitions.', 'Create host and service definitions for DC-01.'],
      ['Restart Nagios.', 'Restart Nagios Core.', 'ad-4.col-1'],
    ]),
    exercise('ad-4', 2, 'Exercise 2: Monitoring AD Logon Events', [
      ['Ensure NSClient++ is configured to collect Windows Event Logs.', 'Verify NSClient++ event-log collection.'],
      ['Add the command definition to commands.cfg.', 'Add the check_nrpe logon-event command.'],
      ['Update adds.cfg to monitor logon events.', 'Add the AD Logon Events service.', 'ad-4.col-2'],
    ]),
    exercise('ad-4', 3, 'Exercise 3: Setting Up Alerts for AD Performance Issues', [
      ['Edit contacts.cfg to configure email notifications.', 'Set the SecOps email contact.'],
      ['Define alert conditions in adds.cfg.', 'Set CPU warning 80 and critical 90.'],
      ['Restart Nagios to apply the changes.', 'Restart Nagios after alert edits.', 'ad-4.col-3'],
    ]),
    exercise('ad-4', 4, 'Exercise 4: Creating a Dashboard for AD Metrics', [
      ['Log in to the Nagios web interface.', 'Log in as nagiosadmin.'],
      ['Navigate to "Tactical Overview".', 'Open Tactical Overview.'],
      ['Click on "Service Details".', 'Open Service Details.'],
      ['Arrange and customize the view.', 'Pin DC-01 service status widgets.', 'ad-4.col-4'],
    ]),
    exercise('ad-4', 5, 'Exercise 5: Visualizing AD Security Metrics', [
      ['Configure NSClient++ to collect additional security metrics if needed.', 'Enable security metric checks.'],
      ['Add service definitions in adds.cfg to monitor security events.', 'Add failed-logon and lockout services.'],
      ['Restart Nagios to apply the changes.', 'Restart Nagios and verify green services.', 'ad-4.col-5'],
    ]),
  ]);

  const AD5 = lab('ad-5', 'AD Monitoring with Checkmk', 'project-5-active-directory-monitoring-with-checkmk.md', 'CheckmkLabShell', 'Checkmk', [
    exercise('ad-5', 1, 'Exercise 1: Adding AD DS Servers to Checkmk', [
      ['Log in to the Checkmk web interface.', 'Log in to Checkmk.'],
      ['Navigate to "Hosts" > "Add Host".', 'Open Hosts > Add Host.'],
      ['Enter the hostname and IP address.', 'Enter DC-01.corp.example.local and 10.10.24.10.'],
      ['Assign the appropriate tags and click "Save & Go to Services".', 'Set Windows/AD tags and discover services.'],
      ['Click "Fix all" to apply the changes.', 'Fix all discovered services and activate changes.', 'ad-5.col-1'],
    ]),
    exercise('ad-5', 2, 'Exercise 2: Monitoring AD Logon Events', [
      ['Ensure the Checkmk Agent is configured to collect Windows Event Logs.', 'Verify the Windows Event Log section.'],
      ['Navigate to "WATO" > "Host & Service Parameters".', 'Open WATO > Host & Service Parameters.'],
      ['Create a new rule in "Logwatch Event Console".', 'Create a logon-event Logwatch rule.'],
      ['Apply the rule and activate the changes.', 'Activate the logon rule.', 'ad-5.col-2'],
    ]),
    exercise('ad-5', 3, 'Exercise 3: Setting Up Alerts for AD Performance Issues', [
      ['Navigate to "WATO" > "Host & Service Parameters".', 'Open WATO parameters.'],
      ['Create a new rule in "Monitoring Configuration".', 'Create a CPU usage rule.'],
      ['Apply the rule and activate the changes.', 'Activate CPU alerting.', 'ad-5.col-3'],
    ]),
    exercise('ad-5', 4, 'Exercise 4: Creating a Dashboard for AD Metrics', [
      ['Go to "Views" > "Add View".', 'Create a new Checkmk view.'],
      ['Add new views for key AD metrics.', 'Add CPU, memory, and logon views.'],
      ['Configure each view\'s layout and data source.', 'Bind views to DC-01 services.'],
      ['Arrange the views and save the dashboard.', 'Save the AD dashboard.', 'ad-5.col-4'],
    ]),
    exercise('ad-5', 5, 'Exercise 5: Visualizing AD Security Metrics', [
      ['Configure the Checkmk Agent to collect additional security metrics if needed.', 'Enable security event collection.'],
      ['Navigate to "WATO" > "Host & Service Parameters".', 'Open WATO event parameters.'],
      ['Create new rules in "Logwatch Event Console".', 'Create failed-logon and lockout rules.'],
      ['Apply the rules and activate the changes.', 'Activate security metric rules.', 'ad-5.col-5'],
    ]),
  ]);

  const AD6 = lab('ad-6', 'AD Monitoring and Alerting with Prometheus', 'project-6-active-directory-monitoring-with-prometheus.md', 'PrometheusLabShell', 'Prometheus', [
    exercise('ad-6', 1, 'Exercise 1: Configuring Prometheus Data Source', [
      ['Open the prometheus.yml file.', 'Open prometheus.yml.'],
      ['Ensure the configuration to scrape metrics from the Windows Exporter is correct.', 'Validate DC-01:9182 scrape target.'],
      ['Add Alertmanager configuration to prometheus.yml.', 'Add alertmanagers static config.'],
      ['Restart Prometheus.', 'Restart Prometheus.', 'ad-6.col-1'],
    ]),
    exercise('ad-6', 2, 'Exercise 2: Creating a Dashboard for AD Metrics', [
      ['Access the Prometheus web interface.', 'Open http://monitor-01:9090.'],
      ['Go to "Status" > "Targets".', 'Verify the windows exporter target is UP.'],
      ['Create a new Grafana dashboard.', 'Create the linked Grafana dashboard.', 'ad-6.col-2'],
    ]),
    exercise('ad-6', 3, 'Exercise 3: Monitoring AD Logon Events', [
      ['Ensure the Windows Exporter is configured to collect Event Log metrics.', 'Confirm event-log metrics are exposed.'],
      ['Create a new Prometheus alert rule for logon events.', 'Create HighFailedLogons alert rule.'],
      ['Add the alert rule file to prometheus.yml under rule_files.', 'Register alert-rules.yml in Prometheus.', 'ad-6.col-3'],
    ]),
    exercise('ad-6', 4, 'Exercise 4: Setting Up Alerts for AD Performance Issues', [
      ['Create a new Prometheus alert rule for CPU usage.', 'Create DomainControllerHighCPU alert.'],
      ['Add the alert rule file to prometheus.yml under rule_files.', 'Confirm the CPU rule file is loaded.'],
      ['Restart Prometheus to apply the changes.', 'Restart Prometheus and reload rules.', 'ad-6.col-4'],
    ]),
    exercise('ad-6', 5, 'Exercise 5: Visualizing AD Security Metrics', [
      ['Ensure the Windows Exporter is collecting security metrics.', 'Verify failed-logon and lockout metrics.'],
      ['Create new Grafana panels for security metrics.', 'Create failed-logon and account-lockout panels.'],
      ['Use appropriate Prometheus queries to filter the data.', 'Query windows_eventlog_security_logon and lockout counters.'],
      ['Configure the visualization for each panel and arrange them.', 'Arrange and save security panels.', 'ad-6.col-5'],
    ]),
  ]);

  const AD7 = lab('ad-7', 'Visualizing AD Performance Metrics with Cacti', 'project-7-active-directory-monitoring-with-cacti.md', 'CactiLabShell', 'Cacti', [
    exercise('ad-7', 1, 'Exercise 1: Configuring SNMP on AD DS Servers', [
      ['Open "Services" from the Control Panel.', 'Open Windows Services.'],
      ['Locate and double-click "SNMP Service".', 'Open SNMP Service properties.'],
      ['Go to the "Security" tab.', 'Open the SNMP Security tab.'],
      ['Add a community string and configure allowed hosts.', 'Add public community for 10.10.24.30.', 'ad-7.col-1'],
    ]),
    exercise('ad-7', 2, 'Exercise 2: Adding AD DS Servers to Cacti', [
      ['Log in to the Cacti web interface.', 'Log in to Cacti.'],
      ['Navigate to "Devices" > "Add".', 'Open Devices > Add.'],
      ['Enter the hostname and IP address.', 'Enter DC-01.corp.example.local and 10.10.24.10.'],
      ['Select "Windows Server" as the device template.', 'Select Windows Server template.'],
      ['Configure SNMP settings with the community string and save.', 'Set public community and save the device.', 'ad-7.col-2'],
    ]),
    exercise('ad-7', 3, 'Exercise 3: Creating Graphs for AD Metrics', [
      ['Go to "Create" > "New Graphs".', 'Open Create > New Graphs.'],
      ['Select the AD DS server from the list of devices.', 'Select DC-01.'],
      ['Choose the metrics you want to graph.', 'Choose CPU and memory graphs.'],
      ['Click "Create" to generate the graphs.', 'Create the graphs.', 'ad-7.col-3'],
    ]),
    exercise('ad-7', 4, 'Exercise 4: Monitoring AD Logon Events', [
      ['Ensure SNMP is configured to capture event logs.', 'Verify event log SNMP collection.'],
      ['Create a new graph template for logon events.', 'Create the Logon Events graph template.'],
      ['Apply the graph template to the AD DS server.', 'Apply the template to DC-01.', 'ad-7.col-4'],
    ]),
    exercise('ad-7', 5, 'Exercise 5: Setting Up Alerts for AD Performance Issues', [
      ['Navigate to "Settings" > "Thresholds".', 'Open Settings > Thresholds.'],
      ['Create a new threshold rule for CPU usage.', 'Create CPU > 80 threshold.'],
      ['Configure notification settings for alerting.', 'Notify SecOps by email.', 'ad-7.col-5'],
    ]),
    exercise('ad-7', 6, 'Exercise 6: Visualizing AD Security Metrics', [
      ['Create new graph templates for security metrics.', 'Create failed-logon and lockout graph templates.'],
      ['Apply these templates to the AD DS server.', 'Apply templates to DC-01.'],
      ['Use appropriate SNMP OIDs to capture the data.', 'Map OIDs for failed logons and lockouts.'],
      ['Arrange the graphs in a comprehensive dashboard.', 'Arrange and save the security dashboard.', 'ad-7.col-6'],
    ]),
  ]);

  Object.assign(window.B2B_LABS = window.B2B_LABS || {}, {
    'ad-1': AD1,
    'ad-2': AD2,
    'ad-3': AD3,
    'ad-4': AD4,
    'ad-5': AD5,
    'ad-6': AD6,
    'ad-7': AD7,
  });
})();
