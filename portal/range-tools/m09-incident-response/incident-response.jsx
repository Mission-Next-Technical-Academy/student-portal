function IncidentResponseConsole(props) {
  const { mode } = props;
  const [isolated, setIsolated] = React.useState(false);
  const [revoked, setRevoked] = React.useState(false);
  const [blocked, setBlocked] = React.useState(false);
  const [notes, setNotes] = React.useState('');

  const t1 = isolated;
  const t2 = revoked;
  const t3 = blocked;
  const t4 = notes.trim().length >= 40;

  const solvedCount = [t1, t2, t3, t4].filter(Boolean).length;
  const total = 4;

  React.useEffect(() => {
    if (solvedCount === total) {
      window.opener?.postMessage({ type: 'm09-incident-response-complete', mode, solvedCount, total }, location.origin);
    }
  }, [solvedCount, total, mode]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', height: '100vh', background: '#030712' }}>
      <div style={{ padding: 24, overflowY: 'auto' }}>
        <header style={{ borderBottom: '1px solid #1f2937', paddingBottom: 16, marginBottom: 20 }}>
          <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#f97316', fontWeight: 700 }}>Operation Cedar Lock (INC-4937) · {mode.toUpperCase()}</span>
          <h1 style={{ fontSize: 20, margin: '6px 0', color: '#f9fafb' }}>Active Ransomware Response & Containment</h1>
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Execute containment actions on affected assets while preserving forensics and service continuity.</p>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{ background: '#111827', padding: 16, borderRadius: 8, border: '1px solid #1f2937' }}>
            <h3 style={{ fontSize: 14, color: '#f9fafb', margin: '0 0 8px 0' }}>Workstation ws-173 (Patient Zero)</h3>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 12px 0' }}>Encryption process active. Rapid file renames detected in user profile.</p>
            <button onClick={() => setIsolated(true)} disabled={isolated} style={{ background: isolated ? '#059669' : '#dc2626', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 4, cursor: isolated ? 'default' : 'pointer', fontWeight: 600, fontSize: 12 }}>
              {isolated ? '✓ Host Isolated from Network' : 'Execute Host Network Isolation'}
            </button>
          </div>
          <div style={{ background: '#111827', padding: 16, borderRadius: 8, border: '1px solid #1f2937' }}>
            <h3 style={{ fontSize: 14, color: '#f9fafb', margin: '0 0 8px 0' }}>Compromised Account acct-173</h3>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 12px 0' }}>Concurrent external session from unmanaged client 203.0.113.173.</p>
            <button onClick={() => setRevoked(true)} disabled={revoked} style={{ background: revoked ? '#059669' : '#d97706', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 4, cursor: revoked ? 'default' : 'pointer', fontWeight: 600, fontSize: 12 }}>
              {revoked ? '✓ Active Sessions Revoked' : 'Revoke Refresh Tokens & Sign-In'}
            </button>
          </div>
        </section>

        <section style={{ background: '#111827', padding: 16, borderRadius: 8, border: '1px solid #1f2937', marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, color: '#f9fafb', margin: '0 0 8px 0' }}>File Server fs-02 Perimeter Protection</h3>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 12px 0' }}>Prevent lateral SMB/RPC spread from ws-173 subnet without knocking mission shares offline.</p>
          <button onClick={() => setBlocked(true)} disabled={blocked} style={{ background: blocked ? '#059669' : '#2563eb', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 4, cursor: blocked ? 'default' : 'pointer', fontWeight: 600, fontSize: 12 }}>
            {blocked ? '✓ Inbound SMB from Subnet Blocked' : 'Apply Bounded Firewall Ingress Rule'}
          </button>
        </section>

        <section style={{ background: '#111827', padding: 16, borderRadius: 8, border: '1px solid #1f2937' }}>
          <h3 style={{ fontSize: 14, color: '#f9fafb', margin: '0 0 8px 0' }}>Incident Commander Containment Handoff Note</h3>
          <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="State confirmed scope, containment status for ws-173/acct-173, and next forensic steps (min 40 characters)..." style={{ width: '100%', background: '#030712', border: '1px solid #374151', color: '#f9fafb', padding: 10, borderRadius: 4, fontSize: 12, boxSizing: 'border-box' }} />
          <div style={{ fontSize: 11, color: t4 ? '#10b981' : '#9ca3af', marginTop: 4 }}>{notes.length}/40 characters minimum</div>
        </section>
      </div>

      <aside style={{ background: '#111827', borderLeft: '1px solid #1f2937', padding: 20 }}>
        <h2 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: 16 }}>Containment Checklist ({solvedCount}/{total})</h2>
        <div style={{ marginBottom: 12, padding: 10, background: t1 ? '#064e3b' : '#1f2937', borderRadius: 4, fontSize: 12, color: t1 ? '#6ee7b7' : '#f9fafb' }}>{t1 ? '✓' : '○'} Isolate workstation ws-173</div>
        <div style={{ marginBottom: 12, padding: 10, background: t2 ? '#064e3b' : '#1f2937', borderRadius: 4, fontSize: 12, color: t2 ? '#6ee7b7' : '#f9fafb' }}>{t2 ? '✓' : '○'} Revoke acct-173 tokens</div>
        <div style={{ marginBottom: 12, padding: 10, background: t3 ? '#064e3b' : '#1f2937', borderRadius: 4, fontSize: 12, color: t3 ? '#6ee7b7' : '#f9fafb' }}>{t3 ? '✓' : '○'} Firewall ingress to fs-02</div>
        <div style={{ marginBottom: 12, padding: 10, background: t4 ? '#064e3b' : '#1f2937', borderRadius: 4, fontSize: 12, color: t4 ? '#6ee7b7' : '#f9fafb' }}>{t4 ? '✓' : '○'} Document containment handoff</div>
        {solvedCount === total && (
          <div style={{ marginTop: 20, padding: 12, background: '#166534', color: '#dcfce7', borderRadius: 6, fontSize: 13, textAlign: 'center', fontWeight: 600 }}>
            Containment Established!
          </div>
        )}
      </aside>
    </div>
  );
}
window.IncidentResponseConsole = IncidentResponseConsole;
