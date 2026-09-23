(function () {
  const DISCOVER_DOCS = [
    {
      ts: '2026-04-23T09:14:02Z',
      index: 'filebeat-2026.04.23',
      host: 'WEB-01',
      eventAction: 'login_failed',
      sourceIp: '203.0.113.77',
      userName: 'j.sanders',
      message: 'Repeated failed web login from 203.0.113.77 against j.sanders.',
    },
    {
      ts: '2026-04-23T09:14:11Z',
      index: 'winlogbeat-2026.04.23',
      host: 'DC-01',
      eventAction: 'user_login_failure',
      sourceIp: '203.0.113.77',
      userName: 'helpdesk-admin',
      message: 'Kerberos pre-authentication failure for helpdesk-admin from 203.0.113.77.',
    },
    {
      ts: '2026-04-23T09:14:26Z',
      index: 'winlogbeat-2026.04.23',
      host: 'WKSTN-11',
      eventAction: 'user_login_failure',
      sourceIp: '203.0.113.77',
      userName: 'temp.contractor',
      message: 'Interactive sign-in failed on WKSTN-11 from 203.0.113.77.',
    },
    {
      ts: '2026-04-23T09:14:44Z',
      index: 'filebeat-2026.04.23',
      host: 'WEB-01',
      eventAction: 'login_failed',
      sourceIp: '203.0.113.77',
      userName: 'm.chen',
      message: 'Credential stuffing candidate against m.chen from 203.0.113.77.',
    },
  ];

  const HISTOGRAM = [
    { label: '09:11', count: 3 },
    { label: '09:12', count: 5 },
    { label: '09:13', count: 8 },
    { label: '09:14', count: 21 },
    { label: '09:15', count: 7 },
  ];

  function KibanaLabShell(props) {
    const { vfs, initialCwd = '/home/student', user = 'student', host = 'elk-01', onCommand } = props;
    const [services, setServices] = React.useState({ elasticsearch: false, logstash: false, kibana: false });
    const [view, setView] = React.useState('elasticsearch');
    const [indexPatternCreated, setIndexPatternCreated] = React.useState(false);
    const [discoverQuery, setDiscoverQuery] = React.useState('event.action: "login_failed" and source.ip: "203.0.113.77"');
    const [selectedSlice, setSelectedSlice] = React.useState(null);
    const [docInspected, setDocInspected] = React.useState(false);
    const [visualCreated, setVisualCreated] = React.useState(false);
    const [dashboardSaved, setDashboardSaved] = React.useState(false);

    function forwardCommand(line, result, env) {
      const next = { ...services };
      if (/systemctl\s+start\s+elasticsearch/.test(line)) next.elasticsearch = true;
      if (/systemctl\s+start\s+logstash/.test(line)) next.logstash = true;
      if (/systemctl\s+start\s+kibana/.test(line)) next.kibana = true;
      if (next.elasticsearch !== services.elasticsearch || next.logstash !== services.logstash || next.kibana !== services.kibana) {
        setServices(next);
      }
      if (typeof onCommand === 'function') onCommand(line, result, env);
    }

    function emit(action, stateUpdater) {
      if (typeof stateUpdater === 'function') stateUpdater();
      if (typeof onCommand === 'function') onCommand(action, { stdout: '', stderr: '', exitCode: 0 }, {});
    }

    function openElasticsearch() {
      if (!services.elasticsearch) return;
      setView('elasticsearch');
      emit('browse http://localhost:9200');
    }

    function openKibana() {
      if (!services.kibana) return;
      setView('kibana-home');
      emit('browse http://localhost:5601');
    }

    function verifySampleLog() {
      emit('verify sample log exists');
    }

    function createIndexPattern() {
      if (!services.kibana) return;
      setView('management');
      setIndexPatternCreated(true);
      emit('kibana create index-pattern logstash-*');
    }

    function runDiscoverQuery() {
      if (!indexPatternCreated) return;
      setView('discover');
    }

    function drillSlice(label) {
      setSelectedSlice(label);
    }

    function inspectDocument() {
      if (!indexPatternCreated) return;
      setView('discover');
      setSelectedSlice('09:14');
      setDocInspected(true);
      emit('kibana inspect doc 09:14 source.ip=203.0.113.77');
    }

    function createVisualization() {
      if (!docInspected) return;
      setView('visualize');
      setVisualCreated(true);
      emit('kibana visualize create source-ip-spike');
    }

    function saveDashboard() {
      if (!visualCreated) return;
      setView('dashboard');
      setDashboardSaved(true);
      emit('kibana dashboard save credential-stuffing-overview');
    }

    const results = DISCOVER_DOCS.filter(doc => !selectedSlice || doc.ts.includes(selectedSlice));
    const activeDoc = results[0] || DISCOVER_DOCS[0];

    return (
      <div style={styles.root}>
        <div style={styles.terminalPane}>
          <div style={styles.paneLabel}>Elastic workstation</div>
          <window.LinuxTerminalShell
            vfs={vfs}
            initialCwd={initialCwd}
            user={user}
            host={host}
            onCommand={forwardCommand}
            autoFocus
          />
        </div>
        <div style={styles.browserPane}>
          <div style={styles.browserChrome}>
            <div style={styles.chromeDots}>
              <span style={{ ...styles.dot, background: '#ef4444' }} />
              <span style={{ ...styles.dot, background: '#f59e0b' }} />
              <span style={{ ...styles.dot, background: '#22c55e' }} />
            </div>
            <div style={styles.addressBar}>
              {view === 'elasticsearch' ? 'http://localhost:9200' : 'http://localhost:5601/app/kibana'}
            </div>
            <div style={styles.chromeActions}>
              <button style={styles.chromeBtn} onClick={openElasticsearch} disabled={!services.elasticsearch}>ES API</button>
              <button style={styles.chromeBtn} onClick={openKibana} disabled={!services.kibana}>Kibana</button>
            </div>
          </div>

          <div style={styles.browserBody}>
            <aside style={styles.sidebar}>
              <div style={styles.sidebarBrand}>Elastic</div>
              <button style={styles.sidebarBtn} onClick={openElasticsearch} disabled={!services.elasticsearch}>Cluster status</button>
              <button style={styles.sidebarBtn} onClick={verifySampleLog}>Verify sample log</button>
              <button style={styles.sidebarBtn} onClick={createIndexPattern} disabled={!services.kibana}>Stack Management</button>
              <button style={styles.sidebarBtn} onClick={runDiscoverQuery} disabled={!indexPatternCreated}>Discover</button>
              <button style={styles.sidebarBtn} onClick={createVisualization} disabled={!docInspected}>Visualize</button>
              <button style={styles.sidebarBtn} onClick={saveDashboard} disabled={!visualCreated}>Dashboard</button>
            </aside>

            <main style={styles.workspace}>
              {view === 'elasticsearch' ? (
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>Elasticsearch cluster response</div>
                  <pre style={styles.pre}>
{`{
  "name": "elk-01",
  "cluster_name": "boots2bytes-elk",
  "version": { "number": "7.12.1" },
  "tagline": "You Know, for Search"
}`}
                  </pre>
                  <div style={styles.callout}>Use this view after starting Elasticsearch to confirm the local API responds on port 9200.</div>
                </div>
              ) : null}

              {view === 'kibana-home' ? (
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>Kibana home</div>
                  <div style={styles.grid}>
                    <div style={styles.metricCard}><span style={styles.metricLabel}>Stack version</span><strong>7.12.1</strong></div>
                    <div style={styles.metricCard}><span style={styles.metricLabel}>Primary signal</span><strong>09:14 auth spike</strong></div>
                    <div style={styles.metricCard}><span style={styles.metricLabel}>Dominant IP</span><strong>203.0.113.77</strong></div>
                  </div>
                  <div style={styles.callout}>Open Stack Management first to create the `logstash-*` index pattern before Discover becomes useful.</div>
                </div>
              ) : null}

              {view === 'management' ? (
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>Stack Management -> Kibana -> Index Patterns</div>
                  <div style={styles.formRow}>
                    <label style={styles.label}>Index pattern</label>
                    <input readOnly value={indexPatternCreated ? 'logstash-*' : 'logstash-*'} style={styles.input} />
                    <button style={styles.primaryBtn} onClick={createIndexPattern}>Create pattern</button>
                  </div>
                  <div style={styles.callout}>
                    {indexPatternCreated
                      ? 'The `logstash-*` pattern is registered and ready for Discover.'
                      : 'Create an index pattern that matches the Logstash-backed indices.'}
                  </div>
                </div>
              ) : null}

              {view === 'discover' ? (
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>Discover</div>
                  <div style={styles.queryBar}>
                    <input
                      value={discoverQuery}
                      onChange={(e) => setDiscoverQuery(e.target.value)}
                      style={styles.queryInput}
                    />
                    <button style={styles.primaryBtn} onClick={runDiscoverQuery}>Run KQL</button>
                    <button style={styles.secondaryBtn} onClick={inspectDocument} disabled={!indexPatternCreated}>Inspect doc</button>
                  </div>
                  <div style={styles.histogram}>
                    {HISTOGRAM.map(bar => (
                      <button
                        key={bar.label}
                        onClick={() => drillSlice(bar.label)}
                        style={{
                          ...styles.bar,
                          height: `${20 + bar.count * 4}px`,
                          background: selectedSlice === bar.label ? '#38bdf8' : '#1d4ed8',
                        }}
                        title={`${bar.label} (${bar.count})`}
                      >
                        <span style={styles.barLabel}>{bar.label}</span>
                      </button>
                    ))}
                  </div>
                  <div style={styles.callout}>Drill into the 09:14 bar, then inspect the document showing repeated failures from 203.0.113.77.</div>
                  <div style={styles.discoverLayout}>
                    <div style={styles.fieldsPanel}>
                      <div style={styles.panelTitle}>Fields</div>
                      {['@timestamp', 'event.action', 'host.name', 'source.ip', 'user.name', 'winlog.event_id'].map(field => (
                        <div key={field} style={styles.fieldRow}>{field}</div>
                      ))}
                    </div>
                    <div style={styles.resultsPanel}>
                      <div style={styles.panelTitle}>Results {selectedSlice ? `(${selectedSlice})` : '(all)'}</div>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Time</th>
                            <th style={styles.th}>Host</th>
                            <th style={styles.th}>Action</th>
                            <th style={styles.th}>Source IP</th>
                            <th style={styles.th}>User</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.map(row => (
                            <tr key={row.ts + row.userName}>
                              <td style={styles.td}>{row.ts.slice(11, 16)}</td>
                              <td style={styles.td}>{row.host}</td>
                              <td style={styles.td}>{row.eventAction}</td>
                              <td style={styles.td}>{row.sourceIp}</td>
                              <td style={styles.td}>{row.userName}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={styles.docPanel}>
                      <div style={styles.panelTitle}>Document</div>
                      <pre style={styles.docPre}>
{`@timestamp: ${activeDoc.ts}
index: ${activeDoc.index}
host.name: ${activeDoc.host}
event.action: ${activeDoc.eventAction}
source.ip: ${activeDoc.sourceIp}
user.name: ${activeDoc.userName}
message: ${activeDoc.message}`}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : null}

              {view === 'visualize' ? (
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>Visualize Library</div>
                  <div style={styles.chartCard}>
                    <div style={styles.metricLabel}>Visualization</div>
                    <div style={styles.chartTitle}>Source IP spike by minute</div>
                    <div style={styles.histogram}>
                      {HISTOGRAM.map(bar => (
                        <div key={bar.label} style={{ ...styles.bar, height: `${20 + bar.count * 4}px`, background: bar.label === '09:14' ? '#f97316' : '#334155' }}>
                          <span style={styles.barLabel}>{bar.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={styles.callout}>Use the suspicious 09:14 slice to preserve the source-IP spike as a reusable visualization.</div>
                </div>
              ) : null}

              {view === 'dashboard' ? (
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>Dashboard: Credential Stuffing Overview</div>
                  <div style={styles.grid}>
                    <div style={styles.metricCard}><span style={styles.metricLabel}>Saved panel</span><strong>{dashboardSaved ? 'Source IP spike by minute' : 'Pending'}</strong></div>
                    <div style={styles.metricCard}><span style={styles.metricLabel}>Primary IOC</span><strong>203.0.113.77</strong></div>
                    <div style={styles.metricCard}><span style={styles.metricLabel}>Peak window</span><strong>09:14</strong></div>
                  </div>
                  <div style={styles.callout}>The dashboard preserves the log spike so an instructor or analyst can return to the exact slice later.</div>
                </div>
              ) : null}
            </main>
          </div>
        </div>
      </div>
    );
  }

  const styles = {
    root: {
      display: 'grid',
      gridTemplateColumns: 'minmax(340px, 1fr) minmax(420px, 1.2fr)',
      gap: 14,
      width: '100%',
      height: '100%',
      minHeight: 420,
    },
    terminalPane: { display: 'flex', flexDirection: 'column', minHeight: 420 },
    paneLabel: { marginBottom: 8, color: '#94a3b8', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
    browserPane: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: 420,
      border: '1px solid rgba(148,163,184,0.18)',
      borderRadius: 10,
      overflow: 'hidden',
      background: '#0f172a',
      boxShadow: '0 24px 50px rgba(2,6,23,0.4)',
    },
    browserChrome: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 12px',
      background: '#111827',
      borderBottom: '1px solid rgba(148,163,184,0.15)',
    },
    chromeDots: { display: 'flex', gap: 6 },
    dot: { width: 10, height: 10, borderRadius: 999 },
    addressBar: {
      flex: 1,
      background: '#020617',
      color: '#cbd5e1',
      border: '1px solid rgba(148,163,184,0.15)',
      borderRadius: 999,
      padding: '8px 12px',
      fontSize: 12,
      fontFamily: "'Space Mono', monospace",
    },
    chromeActions: { display: 'flex', gap: 8 },
    chromeBtn: {
      background: '#1e293b',
      color: '#e2e8f0',
      border: '1px solid rgba(148,163,184,0.15)',
      borderRadius: 8,
      padding: '7px 10px',
      fontSize: 11,
      cursor: 'pointer',
    },
    browserBody: { display: 'grid', gridTemplateColumns: '180px 1fr', minHeight: 0, flex: 1 },
    sidebar: { background: '#0b1220', borderRight: '1px solid rgba(148,163,184,0.15)', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 },
    sidebarBrand: { color: '#f8fafc', fontWeight: 700, marginBottom: 8, fontSize: 18 },
    sidebarBtn: {
      textAlign: 'left',
      background: '#111827',
      color: '#cbd5e1',
      border: '1px solid rgba(148,163,184,0.12)',
      borderRadius: 8,
      padding: '10px 12px',
      fontSize: 12,
      cursor: 'pointer',
    },
    workspace: { padding: 16, overflow: 'auto', background: '#f8fafc', color: '#0f172a' },
    section: { display: 'flex', flexDirection: 'column', gap: 14 },
    sectionTitle: { fontSize: 20, fontWeight: 700, color: '#111827' },
    pre: { background: '#0f172a', color: '#e2e8f0', padding: 14, borderRadius: 8, fontSize: 12, overflow: 'auto' },
    callout: { padding: '12px 14px', borderRadius: 8, background: '#dbeafe', color: '#1e3a8a', fontSize: 13 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 },
    metricCard: { border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, background: '#ffffff', display: 'flex', flexDirection: 'column', gap: 6 },
    metricLabel: { color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
    formRow: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
    label: { fontSize: 12, color: '#475569', minWidth: 96 },
    input: { flex: 1, minWidth: 180, padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#ffffff' },
    primaryBtn: { background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 8, padding: '9px 12px', fontSize: 12, cursor: 'pointer' },
    secondaryBtn: { background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: 8, padding: '9px 12px', fontSize: 12, cursor: 'pointer' },
    queryBar: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
    queryInput: { flex: 1, minWidth: 240, padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontFamily: "'Space Mono', monospace", fontSize: 12 },
    histogram: { display: 'flex', alignItems: 'flex-end', gap: 10, height: 150, padding: '18px 10px 8px', border: '1px solid #e2e8f0', borderRadius: 10, background: '#ffffff' },
    bar: { flex: 1, minWidth: 48, border: 'none', borderRadius: '8px 8px 0 0', color: '#ffffff', position: 'relative', cursor: 'pointer' },
    barLabel: { position: 'absolute', left: 0, right: 0, bottom: -22, textAlign: 'center', fontSize: 11, color: '#475569' },
    discoverLayout: { display: 'grid', gridTemplateColumns: '180px 1fr 280px', gap: 12 },
    fieldsPanel: { border: '1px solid #e2e8f0', borderRadius: 10, background: '#ffffff', padding: 12 },
    resultsPanel: { border: '1px solid #e2e8f0', borderRadius: 10, background: '#ffffff', padding: 12, overflow: 'auto' },
    docPanel: { border: '1px solid #e2e8f0', borderRadius: 10, background: '#ffffff', padding: 12 },
    panelTitle: { fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
    fieldRow: { padding: '7px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12, color: '#334155' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
    th: { textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #e2e8f0', color: '#475569' },
    td: { padding: '8px 6px', borderBottom: '1px solid #f1f5f9', color: '#0f172a' },
    docPre: { whiteSpace: 'pre-wrap', margin: 0, fontSize: 12, color: '#1e293b' },
    chartCard: { border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, background: '#ffffff' },
    chartTitle: { fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#0f172a' },
  };

  Object.assign(window, { KibanaLabShell });
})();
