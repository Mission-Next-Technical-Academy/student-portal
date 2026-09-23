function CapstoneConsole(props) {
  const { mode } = props;
  const [activeTab, setActiveTab] = React.useState('siem');
  const [siemDone, setSiemDone] = React.useState(false);
  const [endpointDone, setEndpointDone] = React.useState(false);
  const [networkDone, setNetworkDone] = React.useState(false);
  const [containmentDone, setContainmentDone] = React.useState(false);
  const [report, setReport] = React.useState('');

  const t1 = siemDone;
  const t2 = endpointDone;
  const t3 = networkDone;
  const t4 = containmentDone;
  const t5 = report.trim().length >= 60;

  const solvedCount = [t1, t2, t3, t4, t5].filter(Boolean).length;
  const total = 5;

  React.useEffect(() => {
    if (solvedCount === total) {
      window.opener?.postMessage({ type: 'm12-capstone-complete', mode, solvedCount, total }, location.origin);
    }
  }, [solvedCount, total, mode]);

  return (
    <div style={{ display: 'grid', gridTemplateRows: '56px 1fr', height: '100vh', background: '#030712' }}>
      <header style={{ background: '#111827', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontWeight: 800, color: '#f59e0b', fontSize: 16 }}>MISSION NEXT · CAPSTONE</span>
          <nav style={{ display: 'flex', gap: 8 }}>
            {[
              ['siem', '1. SIEM & Logs'],
              ['endpoint', '2. Endpoint/Malware'],
              ['network', '3. Traffic & Email'],
              ['containment', '4. IR Containment'],
              ['report', '5. Final Report']
            ].map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: activeTab === tab ? '#1f2937' : 'transparent', color: activeTab === tab ? '#38bdf8' : '#9ca3af', border: 'none', padding: '8px 12px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                {label}
              </button>
            ))}
          </nav>
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af' }}>Milestones: {solvedCount}/{total} Complete</div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', height: 'calc(100vh - 56px)' }}>
        <main style={{ padding: 24, overflowY: 'auto' }}>
          {activeTab === 'siem' && (
            <div>
              <h2 style={{ fontSize: 16, color: '#f9fafb' }}>Stage 1: Multi-Vector SIEM Correlation</h2>
              <p style={{ fontSize: 13, color: '#9ca3af' }}>Correlate initial delivery phishing telemetry to suspicious authentication and host execution.</p>
              <button onClick={() => setSiemDone(true)} style={{ background: siemDone ? '#059669' : '#0284c7', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 4, fontWeight: 600, cursor: 'pointer', marginTop: 12 }}>
                {siemDone ? '✓ Telemetry Timeline Correlated' : 'Correlate Initial Compromise Chain'}
              </button>
            </div>
          )}
          {activeTab === 'endpoint' && (
            <div>
              <h2 style={{ fontSize: 16, color: '#f9fafb' }}>Stage 2: Endpoint Ancestry & Artifact Analysis</h2>
              <p style={{ fontSize: 13, color: '#9ca3af' }}>Inspect parent-child execution chain: powershell.exe invoking unsigned payload with shadow-copy deletion.</p>
              <button onClick={() => setEndpointDone(true)} style={{ background: endpointDone ? '#059669' : '#0284c7', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 4, fontWeight: 600, cursor: 'pointer', marginTop: 12 }}>
                {endpointDone ? '✓ LOLBin & Persistence Confirmed' : 'Confirm Execution Provenance'}
              </button>
            </div>
          )}
          {activeTab === 'network' && (
            <div>
              <h2 style={{ fontSize: 16, color: '#f9fafb' }}>Stage 3: Network C2 & Beacon Inspection</h2>
              <p style={{ fontSize: 13, color: '#9ca3af' }}>Analyze outbound TLS session records and DNS queries to high-risk fast-flux domain.</p>
              <button onClick={() => setNetworkDone(true)} style={{ background: networkDone ? '#059669' : '#0284c7', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 4, fontWeight: 600, cursor: 'pointer', marginTop: 12 }}>
                {networkDone ? '✓ External C2 Destinations Mapped' : 'Verify C2 Session Telemetry'}
              </button>
            </div>
          )}
          {activeTab === 'containment' && (
            <div>
              <h2 style={{ fontSize: 16, color: '#f9fafb' }}>Stage 4: Proportional Containment Actions</h2>
              <p style={{ fontSize: 13, color: '#9ca3af' }}>Isolate infected host, revoke compromised identity credentials, and block external C2 egress.</p>
              <button onClick={() => setContainmentDone(true)} style={{ background: containmentDone ? '#059669' : '#dc2626', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 4, fontWeight: 600, cursor: 'pointer', marginTop: 12 }}>
                {containmentDone ? '✓ Bounded Containment Executed' : 'Execute Emergency Containment'}
              </button>
            </div>
          )}
          {activeTab === 'report' && (
            <div>
              <h2 style={{ fontSize: 16, color: '#f9fafb' }}>Stage 5: Comprehensive Analyst Final Report</h2>
              <p style={{ fontSize: 13, color: '#9ca3af' }}>Synthesize root cause, affected scope, ATT&CK mappings, and executive recommendations.</p>
              <textarea rows={8} value={report} onChange={(e) => setReport(e.target.value)} placeholder="Draft final incident report covering: Initial Access, Execution, Persistence, Containment, and Next Remediation steps (min 60 characters)..." style={{ width: '100%', background: '#111827', border: '1px solid #374151', color: '#f9fafb', padding: 12, borderRadius: 4, fontSize: 13, boxSizing: 'border-box', marginTop: 12 }} />
              <div style={{ fontSize: 12, color: t5 ? '#10b981' : '#9ca3af', marginTop: 6 }}>{report.length}/60 characters minimum</div>
            </div>
          )}
        </main>

        <aside style={{ background: '#111827', borderLeft: '1px solid #1f2937', padding: 20 }}>
          <h2 style={{ fontSize: 12, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 16 }}>Capstone Stages</h2>
          <div style={{ marginBottom: 12, padding: 10, background: t1 ? '#064e3b' : '#1f2937', borderRadius: 4, fontSize: 12, color: t1 ? '#6ee7b7' : '#f9fafb' }}>{t1 ? '✓' : '○'} Stage 1: SIEM Correlation</div>
          <div style={{ marginBottom: 12, padding: 10, background: t2 ? '#064e3b' : '#1f2937', borderRadius: 4, fontSize: 12, color: t2 ? '#6ee7b7' : '#f9fafb' }}>{t2 ? '✓' : '○'} Stage 2: Endpoint Analysis</div>
          <div style={{ marginBottom: 12, padding: 10, background: t3 ? '#064e3b' : '#1f2937', borderRadius: 4, fontSize: 12, color: t3 ? '#6ee7b7' : '#f9fafb' }}>{t3 ? '✓' : '○'} Stage 3: Network C2 Trace</div>
          <div style={{ marginBottom: 12, padding: 10, background: t4 ? '#064e3b' : '#1f2937', borderRadius: 4, fontSize: 12, color: t4 ? '#6ee7b7' : '#f9fafb' }}>{t4 ? '✓' : '○'} Stage 4: Response Execution</div>
          <div style={{ marginBottom: 12, padding: 10, background: t5 ? '#064e3b' : '#1f2937', borderRadius: 4, fontSize: 12, color: t5 ? '#6ee7b7' : '#f9fafb' }}>{t5 ? '✓' : '○'} Stage 5: Final Report</div>
          {solvedCount === total && (
            <div style={{ marginTop: 20, padding: 12, background: '#166534', color: '#dcfce7', borderRadius: 6, fontSize: 13, textAlign: 'center', fontWeight: 600 }}>
              Capstone Successfully Completed!
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
window.CapstoneConsole = CapstoneConsole;
