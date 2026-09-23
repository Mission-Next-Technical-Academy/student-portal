// ============================================================
//  Track Selection Page
// ============================================================

function TrackSelection({ user, onSelectTrack, onLogout }) {
  const splunkPoints = MODULES.reduce((sum, mod) => sum + mod.tasks.reduce((taskSum, task) => taskSum + task.points, 0), 0);

  const tracks = TRAINING_CATALOG.map(track => ({
    ...track,
    stats: track.id === 'splunk'
      ? [`${track.count} modules`, `${splunkPoints} points`, track.badge]
      : [`${track.count} projects`, track.badge, 'Beginner'],
  }));

  return (
    <div style={tsStyles.root}>
      <nav style={tsStyles.nav}>
        <div style={tsStyles.navLeft}>
          <img src='/assets/boot-logo-transparent.png' style={{width:41,height:41,objectFit:'contain'}} />
          <span style={tsStyles.logoText}>MISSION NEXT</span>
          <span style={tsStyles.sep}>›</span>
          <span style={tsStyles.navPage}>Training Paths</span>
        </div>
        <div style={tsStyles.navRight}>
          <span style={tsStyles.userText}>{user.displayName}</span>
          <button onClick={onLogout} style={tsStyles.logoutBtn}>LOGOUT</button>
        </div>
      </nav>

      <main style={tsStyles.body}>
        <div data-reveal style={tsStyles.header}>
          <div style={tsStyles.kicker}>SELECT TRAINING PATH</div>
          <DecodeTitle text="Choose a lab environment" style={tsStyles.title} />
        </div>

        <div style={tsStyles.grid}>
          {tracks.map(track => (
            <button key={track.id} data-reveal data-card onClick={() => onSelectTrack(track.id)} style={tsStyles.card}>
              <div style={tsStyles.cardTop}>
                <span style={tsStyles.trackLabel}>{track.label}</span>
                <span style={tsStyles.arrow}>›</span>
              </div>
              <div style={tsStyles.cardTitle}>{track.title}</div>
              <div style={tsStyles.cardDesc}>{track.description}</div>
              <div style={tsStyles.stats}>
                {track.stats.map(stat => <span key={stat} style={tsStyles.stat}>{stat}</span>)}
              </div>
              <div style={tsStyles.cardAction}>{track.action}</div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

const tsStyles = {
  root: { minHeight:'100vh', background:'transparent', color:'#e2e8f0', fontFamily:"'Inter',sans-serif" },
  nav: {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'0 clamp(1rem, 3vw, 2rem)', height:52, background:'rgba(10,15,22,0.76)',
    borderBottom:'1px solid rgba(56,189,248,0.12)', position:'sticky', top:0, zIndex:100,
    backdropFilter:'blur(18px)',
  },
  navLeft: { display:'flex', alignItems:'center', gap:12 },
  logoText: { fontFamily:"'Space Mono',monospace", fontSize:12, color:'#22c55e', letterSpacing:3, fontWeight:'bold' },
  sep: { color:'#1e3a2e' },
  navPage: { fontFamily:"'Space Mono',monospace", fontSize:10, color:'#475569', letterSpacing:2 },
  navRight: { display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' },
  userText: { color:'#94a3b8', fontSize:11, fontFamily:"'Space Mono',monospace" },
  logoutBtn: { background:'transparent', border:'1px solid #1e3a2e', color:'#475569', fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:2, padding:'6px 12px', cursor:'pointer' },
  body: { padding:'clamp(2rem, 6vw, 4rem) clamp(1rem, 4vw, 2rem) clamp(3rem, 7vw, 4.5rem)', maxWidth:1180, margin:'0 auto' },
  header: { marginBottom:'clamp(1.25rem, 4vw, 2rem)' },
  kicker: { fontSize:10, color:'#22c55e', letterSpacing:3, fontFamily:"'Space Mono',monospace", marginBottom:10 },
  title: { fontSize:'clamp(2rem, 6vw, 4.35rem)', lineHeight:1.03, letterSpacing:0, marginBottom:10, fontWeight:700, maxWidth:860 },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%, 18rem),1fr))', gap:'clamp(0.85rem, 2vw, 1.15rem)' },
  card: {
    textAlign:'left', background:'linear-gradient(180deg, rgba(15,21,32,0.82), rgba(8,13,20,0.72))', border:'1px solid rgba(56,189,248,0.12)',
    color:'#e2e8f0', padding:'clamp(1.1rem, 3vw, 1.5rem)', minHeight:260, cursor:'pointer',
    display:'flex', flexDirection:'column', transition:'all 0.2s', overflow:'hidden',
  },
  cardTop: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 },
  trackLabel: { fontSize:10, color:'#22c55e', letterSpacing:2, fontFamily:"'Space Mono',monospace" },
  arrow: { fontSize:28, color:'#1e3a2e', lineHeight:1 },
  cardTitle: { fontSize:20, fontWeight:600, marginBottom:10 },
  cardDesc: { fontSize:13, color:'#64748b', lineHeight:1.7, marginBottom:18 },
  stats: { display:'flex', flexWrap:'wrap', gap:8, marginTop:'auto', marginBottom:18 },
  stat: { fontSize:10, color:'#94a3b8', border:'1px solid #1a2535', padding:'4px 8px', fontFamily:"'Space Mono',monospace" },
  cardAction: { fontSize:10, color:'#22c55e', letterSpacing:2, fontFamily:"'Space Mono',monospace", textAlign:'right' },
};

Object.assign(window, { TrackSelection });
