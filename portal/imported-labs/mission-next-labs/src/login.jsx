// ============================================================
//  Login Page Component
// ============================================================

function LoginPage({ onLogin }) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const user = USERS.find(u => u.username === username.trim() && u.password === password.trim());
      if (user) {
        setSession(user);
        initUserProgress(user.username);
        onLogin(user);
      } else {
        setError('Invalid credentials');
      }
      setLoading(false);
    }, 600);
  }

  return (
    <div style={loginStyles.bg}>
      {/* Scanline overlay */}
      <div style={loginStyles.scanlines} />

      {/* Grid background */}
      <div style={loginStyles.grid} />

      <div data-reveal style={loginStyles.panel}>
        {/* Header */}
        <div style={loginStyles.header}>
          <div style={loginStyles.logo}>
            <img src='./assets/boot-logo-transparent.png' style={{width:70,height:70,objectFit:'contain'}} />
            <div>
              <DecodeTitle text="MISSION NEXT" style={loginStyles.logoTitle} />
              <div style={loginStyles.logoSub}>SOC Analyst Training Platform</div>
            </div>
          </div>
          <div style={loginStyles.divider} />
          <div style={loginStyles.termLine}>
            <span style={{color:'#22c55e'}}>system</span>
            <span style={{color:'#475569'}}>@</span>
            <span style={{color:'#38bdf8'}}>mnt-soc</span>
            <span style={{color:'#475569'}}>:~$ </span>
            <span style={{color:'#e2e8f0'}}>authenticate --mode interactive</span>
            <span style={loginStyles.cursor} />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={loginStyles.form} autoComplete="off">
          <div data-reveal style={loginStyles.fieldGroup}>
            <label style={loginStyles.label}>USERNAME</label>
            <div style={loginStyles.inputWrap}>
              <span style={loginStyles.inputPrefix}>›</span>
              <input
                style={loginStyles.input}
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="student_01"
                autoComplete="off"
                autoFocus
              />
            </div>
          </div>

          <div data-reveal style={loginStyles.fieldGroup}>
            <label style={loginStyles.label}>PASSWORD</label>
            <div style={loginStyles.inputWrap}>
              <span style={loginStyles.inputPrefix}>›</span>
              <input
                style={loginStyles.input}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••"
                autoComplete="new-password"
              />
            </div>
          </div>

          {error && (
            <div style={loginStyles.error}>
              <span style={{color:'#f87171'}}>✗ </span>{error}
            </div>
          )}

          <button data-reveal type="submit" disabled={loading} style={{
            ...loginStyles.btn,
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE →'}
          </button>
        </form>

        {/* Quick credential reference */}
        <details data-reveal style={loginStyles.credsDetails}>
          <summary style={loginStyles.credsSummary}>▸ SHOW CREDENTIALS</summary>
          <div style={loginStyles.credsGrid}>
            {USERS.map(u => (
              <div key={u.username} style={loginStyles.credRow}
                onClick={() => { setUsername(u.username); setPassword(u.password); }}>
                <span style={{color:'#94a3b8'}}>{u.username}</span>
                <span style={{color:'#22c55e',fontFamily:"'Space Mono',monospace"}}>{u.password}</span>
                <span style={{color:'#1e3a2e',fontSize:9}}>{u.role === 'instructor' ? '[ INST ]' : ''}</span>
              </div>
            ))}
          </div>
          <div style={{fontSize:9,color:'#334155',marginTop:6,textAlign:'center'}}>Click a row to auto-fill</div>
        </details>

        <div style={loginStyles.footer}>
          <span style={{color:'#334155'}}>Mission Next · SOC Analyst Labs · v1.0</span>
        </div>
      </div>

      {/* Side decoration */}
      <div data-reveal data-side-rail style={loginStyles.sideBar}>
        <div style={loginStyles.sideHeader}>AVAILABLE MODULES</div>
        {TRAINING_CATALOG.map((track, i) => (
          <div key={track.id} style={{
            ...loginStyles.sideItem,
            opacity: 0.55 + Math.min(i * 0.06, 0.35),
          }}>
            <span style={{color:'#22c55e',marginRight:8}}>{String(i + 1).padStart(2, '0')}</span>
            <span>{track.label}</span>
            <span style={loginStyles.sideCount}>{track.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const loginStyles = {
  bg: {
    minHeight:'100vh', background:'transparent',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontFamily:"'Space Mono', monospace", position:'relative', overflow:'hidden',
    padding:'clamp(1rem, 4vw, 3rem)',
  },
  scanlines: {
    position:'absolute', inset:0, pointerEvents:'none', zIndex:1,
    background:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.08) 2px,rgba(0,0,0,0.08) 4px)',
  },
  grid: {
    position:'absolute', inset:0, pointerEvents:'none',
    backgroundImage:'linear-gradient(rgba(34,197,94,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.03) 1px,transparent 1px)',
    backgroundSize:'40px 40px',
  },
  panel: {
    position:'relative', zIndex:2, width:'min(100%, 31rem)',
    background:'rgba(11,15,20,0.72)', border:'1px solid rgba(34,197,94,0.22)',
    boxShadow:'0 24px 80px rgba(0,0,0,0.42), 0 0 60px rgba(34,197,94,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
    padding:'clamp(1.25rem, 4vw, 2.5rem)',
    borderRadius:8,
    backdropFilter:'blur(20px)',
  },
  header: { marginBottom:32 },
  logo: { display:'flex', alignItems:'center', gap:16, marginBottom:24 },

  logoTitle: { fontSize:'clamp(1rem, 3vw, 1.2rem)', fontWeight:'bold', color:'#e2e8f0', letterSpacing:4, margin:0 },
  logoSub: { fontSize:10, color:'#475569', letterSpacing:2, marginTop:2 },
  divider: { height:1, background:'linear-gradient(90deg,#1e3a2e,transparent)', marginBottom:16 },
  termLine: { fontSize:11, display:'flex', alignItems:'center', gap:0 },
  cursor: {
    display:'inline-block', width:8, height:14, background:'#22c55e',
    marginLeft:2, animation:'blink 1.2s step-end infinite',
  },
  form: { display:'flex', flexDirection:'column', gap:'clamp(0.9rem, 2.5vw, 1.25rem)' },
  fieldGroup: { display:'flex', flexDirection:'column', gap:8 },
  label: { fontSize:10, color:'#475569', letterSpacing:3 },
  inputWrap: {
    display:'flex', alignItems:'center', gap:8,
    background:'rgba(0,0,0,0.3)', border:'1px solid #1e3a2e',
    padding:'0 clamp(0.8rem, 2vw, 1rem)', borderRadius:6,
  },
  inputPrefix: { color:'#22c55e', fontSize:14 },
  input: {
    flex:1, background:'transparent', border:'none', outline:'none',
    color:'#e2e8f0', fontFamily:"'Space Mono', monospace", fontSize:13,
    padding:'clamp(0.75rem, 2vw, 0.9rem) 0', letterSpacing:1, minWidth:0,
  },
  error: { fontSize:11, color:'#f87171', padding:'8px 12px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)' },
  btn: {
    background:'transparent', border:'1px solid #22c55e', color:'#22c55e',
    fontFamily:"'Space Mono', monospace", fontSize:12, letterSpacing:3,
    padding:'clamp(0.75rem, 2vw, 0.9rem)', cursor:'pointer', marginTop:8,
    transition:'all 0.2s',
  },
  footer: { textAlign:'center', marginTop:32, fontSize:10, letterSpacing:1 },
  credsDetails: { marginTop:16 },
  credsSummary: { fontSize:9, color:'#64748b', letterSpacing:2, cursor:'pointer', fontFamily:"'Space Mono',monospace", userSelect:'none', listStyle:'none' },
  credsGrid: { marginTop:10, display:'flex', flexDirection:'column', gap:4 },
  credRow: {
    display:'flex', justifyContent:'space-between', alignItems:'center',
    padding:'5px 10px', background:'rgba(0,0,0,0.3)', border:'1px solid #0f1520',
    fontSize:11, fontFamily:"'Space Mono',monospace", cursor:'pointer',
  },
  sideBar: {
    position:'absolute', right:'clamp(1rem, 5vw, 3.75rem)', top:'50%', transform:'translateY(-50%)',
    display:'flex', flexDirection:'column', gap:12, zIndex:2,
  },
  sideHeader: {
    fontSize:9, color:'#475569', letterSpacing:3,
    fontFamily:"'Space Mono', monospace", marginBottom:2,
  },
  sideItem: {
    fontSize:10, color:'#22c55e', letterSpacing:2,
    fontFamily:"'Space Mono', monospace", whiteSpace:'nowrap',
    textShadow:'0 0 8px rgba(34,197,94,0.4)',
    display:'flex', alignItems:'center', gap:8,
  },
  sideCount: {
    color:'#475569', border:'1px solid #1e3a2e', padding:'1px 5px',
    fontSize:8, marginLeft:'auto',
  },
};

Object.assign(window, { LoginPage });
