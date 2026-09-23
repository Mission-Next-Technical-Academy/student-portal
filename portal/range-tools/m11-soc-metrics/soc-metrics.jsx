function SocMetricsConsole(props) {
  const { mode } = props;
  const [slaReviewed, setSlaReviewed] = React.useState(false);
  const [fpAnalyzed, setFpAnalyzed] = React.useState(false);
  const [shiftNote, setShiftNote] = React.useState('');

  const t1 = slaReviewed;
  const t2 = fpAnalyzed;
  const t3 = shiftNote.trim().length >= 40;

  const solvedCount = [t1, t2, t3].filter(Boolean).length;
  const total = 3;

  React.useEffect(() => {
    if (solvedCount === total) {
      window.opener?.postMessage({ type: 'm11-soc-metrics-complete', mode, solvedCount, total }, location.origin);
    }
  }, [solvedCount, total, mode]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', height: '100vh', background: '#0b1120' }}>
      <div style={{ padding: 24, overflowY: 'auto' }}>
        <header style={{ borderBottom: '1px solid #1e293b', paddingBottom: 16, marginBottom: 20 }}>
          <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#10b981', fontWeight: 700 }}>SOC Analytics & Reporting · {mode.toUpperCase()}</span>
          <h1 style={{ fontSize: 20, margin: '6px 0', color: '#f8fafc' }}>SOC Performance, SLA & Queue Health</h1>
          <p style={{ color: '#94a3b8', fontSize: 13 }}>Analyze alert ingestion rates, triage velocity, false-positive ratios, and author shift handover.</p>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
          <div style={{ background: '#1e293b', padding: 14, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Total Ingested Alerts</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#38bdf8', marginTop: 4 }}>1,482</div>
            <div style={{ fontSize: 10, color: '#10b981' }}>+12% vs last shift</div>
          </div>
          <div style={{ background: '#1e293b', padding: 14, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Mean Time to Triage (MTTD)</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#facc15', marginTop: 4 }}>18.4m</div>
            <div style={{ fontSize: 10, color: '#ef4444' }}>Target: 15m (SLA Breach)</div>
          </div>
          <div style={{ background: '#1e293b', padding: 14, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>False Positive Ratio</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#f87171', marginTop: 4 }}>64.2%</div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>Dominant: RULE-102 spray</div>
          </div>
          <div style={{ background: '#1e293b', padding: 14, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Queue Backlog</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#a855f7', marginTop: 4 }}>29 alerts</div>
            <div style={{ fontSize: 10, color: '#38bdf8' }}>Tier 1 Queue</div>
          </div>
        </section>

        <section style={{ background: '#1e293b', padding: 20, borderRadius: 8, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, color: '#f8fafc', marginBottom: 12 }}>Operational Bottleneck Analysis</h3>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setSlaReviewed(true)} style={{ background: slaReviewed ? '#059669' : '#0284c7', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {slaReviewed ? '✓ SLA Breach Profile Audited' : 'Review MTTD Breach Drivers'}
            </button>
            <button onClick={() => setFpAnalyzed(true)} style={{ background: fpAnalyzed ? '#059669' : '#0284c7', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {fpAnalyzed ? '✓ High False Positive Rules Identified' : 'Analyze Noise Distribution'}
            </button>
          </div>
        </section>

        <section style={{ background: '#1e293b', padding: 20, borderRadius: 8 }}>
          <h3 style={{ fontSize: 14, color: '#f8fafc', marginBottom: 12 }}>Shift Handover & Operations Brief</h3>
          <textarea rows={4} value={shiftNote} onChange={(e) => setShiftNote(e.target.value)} placeholder="Draft shift handoff summarizing alert backlog, tuning requests, and ongoing investigations (min 40 chars)..." style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: 10, borderRadius: 4, fontSize: 12, boxSizing: 'border-box' }} />
          <div style={{ fontSize: 11, color: t3 ? '#10b981' : '#94a3b8', marginTop: 4 }}>{shiftNote.length}/40 characters minimum</div>
        </section>
      </div>

      <aside style={{ background: '#0f172a', borderLeft: '1px solid #1e293b', padding: 20 }}>
        <h2 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: 16 }}>Reporting Requirements ({solvedCount}/{total})</h2>
        <div style={{ marginBottom: 12, padding: 10, background: t1 ? '#064e3b' : '#1e293b', borderRadius: 4, fontSize: 12, color: t1 ? '#6ee7b7' : '#f9fafb' }}>{t1 ? '✓' : '○'} Audit MTTD SLA metric</div>
        <div style={{ marginBottom: 12, padding: 10, background: t2 ? '#064e3b' : '#1e293b', borderRadius: 4, fontSize: 12, color: t2 ? '#6ee7b7' : '#f9fafb' }}>{t2 ? '✓' : '○'} Identify high-FP rules</div>
        <div style={{ marginBottom: 12, padding: 10, background: t3 ? '#064e3b' : '#1e293b', borderRadius: 4, fontSize: 12, color: t3 ? '#6ee7b7' : '#f9fafb' }}>{t3 ? '✓' : '○'} Write shift handoff report</div>
        {solvedCount === total && (
          <div style={{ marginTop: 20, padding: 12, background: '#166534', color: '#dcfce7', borderRadius: 6, fontSize: 13, textAlign: 'center', fontWeight: 600 }}>
            Reporting Complete!
          </div>
        )}
      </aside>
    </div>
  );
}
window.SocMetricsConsole = SocMetricsConsole;
