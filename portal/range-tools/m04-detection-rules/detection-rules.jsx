function DetectionRuleConsole(props) {
  const { mode } = props;
  const data = window.M04_DATA;
  const [grouping, setGrouping] = React.useState('UserPrincipalName');
  const [threshold, setThreshold] = React.useState(5);
  const [tested, setTested] = React.useState(false);
  const [enriched, setEnriched] = React.useState(false);

  const t1 = grouping === 'SourceIp';
  const t2 = Number(threshold) === 4;
  const t3 = tested && t1 && t2;
  const t4 = enriched;

  const solvedCount = [t1, t2, t3, t4].filter(Boolean).length;
  const total = data.tasks.length;

  React.useEffect(() => {
    if (solvedCount === total) {
      const target = window.opener || window.parent;
target?.postMessage({ type: 'm04-detection-rules-complete', mode, solvedCount, total }, '*');
    }
  }, [solvedCount, total, mode]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', height: '100vh', background: '#0b1120' }}>
      <div style={{ padding: 24, overflowY: 'auto' }}>
        <header style={{ borderBottom: '1px solid #1e293b', paddingBottom: 16, marginBottom: 20 }}>
          <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#38bdf8', fontWeight: 700 }}>Detection Studio · {mode.toUpperCase()}</span>
          <h1 style={{ fontSize: 20, margin: '6px 0', color: '#f8fafc' }}>Rule Tuning: Distributed Authentication Spray</h1>
          <p style={{ color: '#94a3b8', fontSize: 13 }}>Tune grouping, thresholds, and enrichment to reliably detect multi-account password spray.</p>
        </header>

        <section style={{ background: '#1e293b', padding: 20, borderRadius: 8, marginBottom: 20 }}>
          <h2 style={{ fontSize: 14, color: '#f8fafc', marginBottom: 12 }}>Detection Logic Configuration</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Aggregation Grouping</label>
              <select value={grouping} onChange={(e) => setGrouping(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: 4 }}>
                <option value="UserPrincipalName">Group by UserPrincipalName (Single Account)</option>
                <option value="SourceIp">Group by SourceIp (Attack Origin / Spray)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Failure Threshold</label>
              <input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: 4 }} />
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
            <button onClick={() => setTested(true)} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, fontWeight: 600, cursor: 'pointer' }}>Test Rule Against Telemetry</button>
            <button onClick={() => setEnriched(!enriched)} style={{ background: enriched ? '#15803d' : '#334155', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, fontWeight: 600, cursor: 'pointer' }}>{enriched ? '✓ Enriched with TI-801' : '+ Enrich with Threat Intel'}</button>
          </div>
        </section>

        <section style={{ background: '#1e293b', padding: 20, borderRadius: 8 }}>
          <h2 style={{ fontSize: 14, color: '#f8fafc', marginBottom: 12 }}>Telemetry Feed & Evaluation Output</h2>
          <div style={{ fontSize: 12, color: tested ? (t3 ? '#4ade80' : '#f87171') : '#94a3b8', marginBottom: 10 }}>
            {tested ? (t3 ? '✓ Alert Fired: 5 events from 198.51.100.44 exceeded threshold of 4.' : 'Rule did not fire on distributed spray. Review grouping and threshold.') : 'Awaiting test execution.'}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                <th style={{ padding: '6px 8px' }}>Time</th><th style={{ padding: '6px 8px' }}>Source IP</th><th style={{ padding: '6px 8px' }}>Target User</th><th style={{ padding: '6px 8px' }}>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {data.telemetry.map((t, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '6px 8px', color: '#64748b' }}>{t.time}</td>
                  <td style={{ padding: '6px 8px', color: '#38bdf8' }}>{t.ip}</td>
                  <td style={{ padding: '6px 8px', color: '#f8fafc' }}>{t.user}</td>
                  <td style={{ padding: '6px 8px', color: '#f87171' }}>{t.outcome} ({t.result})</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <aside style={{ background: '#0f172a', borderLeft: '1px solid #1e293b', padding: 20 }}>
        <h2 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: 16 }}>Lab Objectives ({solvedCount}/{total})</h2>
        {data.tasks.map((task, i) => {
          const solved = (i === 0 && t1) || (i === 1 && t2) || (i === 2 && t3) || (i === 3 && t4);
          return (
            <div key={task.id} style={{ marginBottom: 12, padding: 12, background: solved ? '#064e3b' : '#1e293b', borderRadius: 6, border: `1px solid ${solved ? '#059669' : '#334155'}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: solved ? '#6ee7b7' : '#f8fafc' }}>{solved ? '✓ ' : '○ '}Step {i + 1}</div>
              <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>{task.prompt}</div>
            </div>
          );
        })}
        {solvedCount === total && (
          <div style={{ marginTop: 20, padding: 12, background: '#166534', color: '#dcfce7', borderRadius: 6, fontSize: 13, textAlign: 'center', fontWeight: 600 }}>
            Lab Completed! Progress saved.
          </div>
        )}
      </aside>
    </div>
  );
}
window.DetectionRuleConsole = DetectionRuleConsole;
