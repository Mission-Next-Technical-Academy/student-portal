// ============================================================
//  BrowserShell — chrome wrapper for simulated web UIs
// ============================================================
//  Renders an address bar, single tab, and a content frame that
//  hosts whichever child shell renders the simulated web app
//  (Grafana, Nessus, ZAP, etc.).
//
//  Props:
//    initialUrl    string
//    title         string (tab title)
//    onNavigate    (url) => void  (lab can route between pages)
//    children      React node — the page body
//    pageMap       optional: { [url]: ReactNode } — convenience
//                  routing without a custom render function
// ============================================================

(function () {
  function BrowserShell(props) {
    const {
      initialUrl = 'about:blank',
      title = '',
      onNavigate,
      children,
      pageMap,
      tlsWarning = false,
      onTlsAccept,
    } = props;
    const [url, setUrl] = React.useState(initialUrl);
    const [draft, setDraft] = React.useState(initialUrl);
    const [tlsAccepted, setTlsAccepted] = React.useState(false);

    function navigate(next) {
      const u = String(next || '').trim();
      if (!u) return;
      setUrl(u); setDraft(u);
      if (typeof onNavigate === 'function') onNavigate(u);
    }

    function onSubmit(e) {
      e.preventDefault();
      navigate(draft);
    }

    const showTls = tlsWarning && !tlsAccepted && /^https:\/\//.test(url);
    const protocol = url.split(':')[0];
    const isHttps = protocol === 'https';

    return (
      <div style={browserStyles.root}>
        <div style={browserStyles.tabRow}>
          <div style={browserStyles.tab}>{title || (url || 'New Tab')}</div>
          <div style={browserStyles.tabPlaceholder} />
        </div>
        <div style={browserStyles.chrome}>
          <button style={browserStyles.navBtn} aria-label="back" disabled>‹</button>
          <button style={browserStyles.navBtn} aria-label="forward" disabled>›</button>
          <button style={browserStyles.navBtn} aria-label="reload" onClick={() => navigate(url)}>⟳</button>
          <form onSubmit={onSubmit} style={browserStyles.urlForm}>
            <span style={{ ...browserStyles.lock, color: isHttps ? '#22c55e' : '#94a3b8' }}>
              {isHttps ? '🔒' : '⚠'}
            </span>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              style={browserStyles.urlBar}
              spellCheck={false}
            />
          </form>
        </div>
        <div style={browserStyles.frame}>
          {showTls ? (
            <div style={browserStyles.tlsBlock}>
              <div style={browserStyles.tlsTitle}>Your connection is not private</div>
              <div style={browserStyles.tlsBody}>
                Attackers might be trying to steal your information from <strong>{(url.match(/^https:\/\/([^/]+)/) || [])[1] || 'this site'}</strong>. The certificate is self-signed (NET::ERR_CERT_AUTHORITY_INVALID).
              </div>
              <button
                style={browserStyles.tlsAccept}
                onClick={() => { setTlsAccepted(true); if (typeof onTlsAccept === 'function') onTlsAccept(); }}
              >
                Proceed (unsafe)
              </button>
            </div>
          ) : pageMap && pageMap[url] != null ? pageMap[url] : children}
        </div>
      </div>
    );
  }

  const browserStyles = {
    root: {
      width: '100%', height: '100%', minHeight: 480, display: 'flex', flexDirection: 'column',
      background: '#202124', color: '#e8eaed', borderRadius: 6, overflow: 'hidden',
      fontFamily: "Roboto, 'Segoe UI', Arial, sans-serif", fontSize: 13,
    },
    tabRow: { display: 'flex', alignItems: 'flex-end', background: '#35363a', height: 36, padding: '0 8px' },
    tab: {
      maxWidth: 220, padding: '8px 14px', borderRadius: '6px 6px 0 0',
      background: '#202124', color: '#e8eaed', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      borderTop: '1px solid rgba(232,234,237,0.1)',
    },
    tabPlaceholder: { flex: 1 },
    chrome: { display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: '#35363a' },
    navBtn: {
      width: 28, height: 28, borderRadius: '50%', background: 'transparent', border: 'none',
      color: '#e8eaed', fontSize: 16, cursor: 'pointer', flex: '0 0 auto',
    },
    urlForm: { flex: 1, marginLeft: 6, display: 'flex' },
    lock: { fontSize: 12, padding: '0 8px', display: 'flex', alignItems: 'center' },
    urlBar: {
      flex: 1, background: '#202124', color: '#e8eaed', border: '1px solid rgba(232,234,237,0.16)',
      borderRadius: 999, padding: '5px 12px', fontFamily: 'inherit', fontSize: 13, outline: 'none',
    },
    frame: { flex: 1, overflow: 'auto', background: '#fff', color: '#202124' },
    tlsBlock: {
      maxWidth: 480, margin: '60px auto', padding: 24, background: '#fff', color: '#202124',
      border: '1px solid #e0e0e0', borderRadius: 4, fontFamily: 'inherit',
    },
    tlsTitle: { fontSize: 22, fontWeight: 500, color: '#d93025', marginBottom: 12 },
    tlsBody: { fontSize: 14, lineHeight: 1.5, color: '#3c4043', marginBottom: 18 },
    tlsAccept: {
      background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px',
      fontSize: 13, cursor: 'pointer',
    },
  };

  Object.assign(window, { BrowserShell });
})();
