(function () {
  const PRODUCT = {
    GrafanaLabShell: { name: 'Grafana', accent: '#f97316', nav: ['Dashboards', 'Explore', 'Alerting', 'Connections'] },
    DatadogLabShell: { name: 'Datadog', accent: '#632ca6', nav: ['Infrastructure', 'APM', 'Logs', 'Monitors', 'Dashboards'] },
    NagiosLabShell: { name: 'Nagios Core', accent: '#2563eb', nav: ['Tactical Overview', 'Hosts', 'Services', 'Reports'] },
    CheckmkLabShell: { name: 'Checkmk', accent: '#16a34a', nav: ['Monitor', 'Customize', 'Setup', 'WATO'] },
    PrometheusLabShell: { name: 'Prometheus', accent: '#dc2626', nav: ['Graph', 'Alerts', 'Status', 'Targets'] },
    CactiLabShell: { name: 'Cacti', accent: '#15803d', nav: ['Console', 'Devices', 'Graphs', 'Thresholds'] },
  };

  function rowsFor(product) {
    if (product === 'Nagios Core') return [
      ['DC-01', 'PING', 'OK', 'rta 0.7 ms'],
      ['DC-01', 'CPU Load', 'WARNING', '82% for 6 min'],
      ['DC-01', 'AD Logon Events', 'OK', '4624/4625 checks returning'],
      ['DC-01', 'Account Lockouts', 'CRITICAL', 'a.rivera locked out'],
    ];
    if (product === 'Checkmk') return [
      ['DC-01', 'CPU utilization', 'WARN', '82.4%'],
      ['DC-01', 'Memory', 'OK', '61% used'],
      ['DC-01', 'Logwatch Security', 'CRIT', 'Event 4740 observed'],
      ['DC-01', 'Windows Updates', 'OK', 'current'],
    ];
    if (product === 'Cacti') return [
      ['CPU usage', '82%', 'threshold armed'],
      ['Memory committed', '61%', 'normal'],
      ['LDAP binds/sec', '418', 'baseline'],
      ['Failed logons/hour', '27', 'elevated'],
    ];
    if (product === 'Prometheus') return [
      ['up{job="windows"}', '1', 'target healthy'],
      ['windows_cpu_time_total', '82%', 'alert pending'],
      ['windows_eventlog_security_logon_total', '1840', 'scraping'],
      ['windows_account_lockouts_total', '3', 'rule loaded'],
    ];
    if (product === 'Datadog') return [
      ['system.cpu.user{host:dc-01}', '82%', 'monitor ready'],
      ['win.eventlog.security{evt.id:4625}', '27', 'indexed'],
      ['ad.replication.errors', '0', 'healthy'],
      ['account.lockouts', '3', 'security widget'],
    ];
    return [
      ['windows_logical_disk_free_bytes', '46.2 GiB', 'panel'],
      ['windows_cpu_time_total', '82%', 'alert rule'],
      ['windows_eventlog_security_logon', '1840', 'panel'],
      ['windows_account_lockouts_total', '3', 'security dashboard'],
    ];
  }

  function ADProductShell(props) {
    const { lab, activeStep, onCommand } = props;
    const shellName = (lab && lab.environment && lab.environment.shell) || 'GrafanaLabShell';
    const cfg = PRODUCT[shellName] || PRODUCT.GrafanaLabShell;
    const [events, setEvents] = React.useState([
      `${cfg.name} connected to corp.example.local`,
      'DC-01.corp.example.local telemetry available',
    ]);
    const accepted = activeStep && activeStep.acceptedInputs && activeStep.acceptedInputs[0] && activeStep.acceptedInputs[0].value;

    function completeStep() {
      if (!accepted) return;
      setEvents(prev => prev.concat(activeStep.instruction));
      if (typeof onCommand === 'function') {
        onCommand(accepted, {
          stdout: `${cfg.name}: ${activeStep.instruction}`,
          exitCode: 0,
          observed: { product: cfg.name, domain: 'corp.example.local', host: 'DC-01.corp.example.local' },
          uiPath: [cfg.name, activeStep.id],
        }, { product: cfg.name });
      }
    }

    return (
      <div style={styles.root}>
        <div style={{ ...styles.top, borderColor: cfg.accent }}>
          <div style={styles.brand}>
            <span style={{ ...styles.logo, background: cfg.accent }}>{cfg.name.slice(0, 2).toUpperCase()}</span>
            <div>
              <div style={styles.title}>{cfg.name}</div>
              <div style={styles.sub}>corp.example.local / DC-01.corp.example.local</div>
            </div>
          </div>
          <button style={{ ...styles.action, background: cfg.accent }} onClick={completeStep}>
            Run current step
          </button>
        </div>
        <div style={styles.nav}>{cfg.nav.map(item => <span key={item} style={styles.navItem}>{item}</span>)}</div>
        <div style={styles.grid}>
          <section style={styles.panel}>
            <div style={styles.panelTitle}>Current Workflow</div>
            <div style={styles.stepText}>{activeStep ? activeStep.instruction : 'Select a step to begin.'}</div>
            <div style={styles.hint}>Action token: {accepted || 'none'}</div>
          </section>
          <section style={styles.panel}>
            <div style={styles.panelTitle}>Live AD Signals</div>
            <div style={styles.table}>
              {rowsFor(cfg.name).map((row, idx) => (
                <div key={idx} style={styles.tr}>
                  <span>{row[0]}</span><b>{row[1]}</b><em>{row[2]}</em>
                </div>
              ))}
            </div>
          </section>
        </div>
        <section style={styles.console}>
          {events.slice(-7).map((event, i) => <div key={i}>[{new Date(2026, 3, 23, 9, 10 + i).toISOString()}] {event}</div>)}
        </section>
      </div>
    );
  }

  function GrafanaLabShell(props) { return <ADProductShell {...props} />; }
  function DatadogLabShell(props) { return <ADProductShell {...props} />; }
  function NagiosLabShell(props) { return <ADProductShell {...props} />; }
  function CheckmkLabShell(props) { return <ADProductShell {...props} />; }
  function PrometheusLabShell(props) { return <ADProductShell {...props} />; }
  function CactiLabShell(props) { return <ADProductShell {...props} />; }

  const styles = {
    root: { height: '100%', minHeight: 560, background: '#0b1220', color: '#e5e7eb', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' },
    top: { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', padding: 14, borderBottom: '3px solid' },
    brand: { display: 'flex', alignItems: 'center', gap: 12 },
    logo: { width: 36, height: 36, borderRadius: 6, display: 'grid', placeItems: 'center', color: 'white', fontWeight: 800 },
    title: { fontWeight: 800, fontSize: 18 },
    sub: { color: '#94a3b8', fontSize: 12 },
    action: { border: 0, borderRadius: 6, color: 'white', padding: '10px 14px', fontWeight: 800, cursor: 'pointer' },
    nav: { display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 14px', borderBottom: '1px solid rgba(148,163,184,.2)' },
    navItem: { padding: '6px 10px', background: 'rgba(148,163,184,.12)', borderRadius: 4, fontSize: 12 },
    grid: { display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(280px, 1.2fr)', gap: 12, padding: 14 },
    panel: { border: '1px solid rgba(148,163,184,.2)', borderRadius: 6, background: 'rgba(15,23,42,.72)', padding: 14, minHeight: 170 },
    panelTitle: { color: '#93c5fd', fontWeight: 800, marginBottom: 10, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0 },
    stepText: { lineHeight: 1.5, fontSize: 15 },
    hint: { marginTop: 14, color: '#94a3b8', fontFamily: '"Space Mono", monospace', fontSize: 12, overflowWrap: 'anywhere' },
    table: { display: 'grid', gap: 6 },
    tr: { display: 'grid', gridTemplateColumns: '1fr 72px 96px', gap: 8, alignItems: 'center', padding: '8px 10px', background: 'rgba(2,6,23,.45)', borderRadius: 4, fontSize: 12 },
    console: { margin: 14, marginTop: 0, padding: 12, background: '#020617', borderRadius: 6, color: '#cbd5e1', fontFamily: '"Space Mono", monospace', fontSize: 12, minHeight: 130, whiteSpace: 'pre-wrap' },
  };

  Object.assign(window, { GrafanaLabShell, DatadogLabShell, NagiosLabShell, CheckmkLabShell, PrometheusLabShell, CactiLabShell });
})();
