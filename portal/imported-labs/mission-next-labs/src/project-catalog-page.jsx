// ============================================================
//  Generic External Project Catalog Page
// ============================================================

function ProjectCatalogPage({ trackId, user, onBack, onLogout, onOpenProject }) {
  const track = TRAINING_CATALOG.find(item => item.id === trackId);
  if (!track) return <TrackSelection user={user} onSelectTrack={() => {}} onLogout={onLogout} />;

  return (
    <div style={pcStyles.root}>
      <nav style={pcStyles.nav}>
        <div style={pcStyles.navLeft}>
          <button onClick={onBack} style={pcStyles.backBtn}>‹ PATHS</button>
          <span style={pcStyles.logoText}>MISSION NEXT</span>
          <span style={pcStyles.sep}>›</span>
          <span style={pcStyles.navPage}>{track.label}</span>
        </div>
        <div style={pcStyles.navRight}>
          <span style={pcStyles.userText}>{user.displayName}</span>
          <button onClick={onLogout} style={pcStyles.logoutBtn}>LOGOUT</button>
        </div>
      </nav>

      <main style={pcStyles.body}>
        <section data-reveal style={pcStyles.header}>
          <div style={pcStyles.kicker}>{track.label.toUpperCase()}</div>
          <DecodeTitle text={track.title} style={pcStyles.title} />
          <p style={pcStyles.copy}>{track.description}</p>
          <a href={track.source} target="_blank" rel="noreferrer" style={pcStyles.repoLink}>OPEN SOURCE REPOSITORY</a>
        </section>

        <section style={pcStyles.grid}>
          {track.projects.map((project, index) => {
            const newShape = window.MISSION_NEXT_LABS && window.MISSION_NEXT_LABS[project.id];
            const migrated = !!(newShape && Array.isArray(newShape.exercises));
            const ownerStub = newShape && newShape.comingSoon ? newShape.owner : null;
            return (
            <article key={project.id} data-reveal data-card style={pcStyles.card}>
              <div style={pcStyles.cardTop}>
                <span style={pcStyles.projectNum}>{String(index + 1).padStart(2, '0')}</span>
                <span style={project.simulation ? pcStyles.simBadge : pcStyles.focus}>{project.simulation ? 'SIMULATED' : project.focus}</span>
                {migrated && <span style={pcStyles.migratedBadge}>HIGH-FIDELITY</span>}
                {ownerStub && <span style={pcStyles.ownerBadge}>{ownerStub}</span>}
              </div>
              <h2 style={pcStyles.cardTitle}>{project.title}</h2>
              <p style={pcStyles.summary}>{project.summary}</p>
              <div style={pcStyles.skillRow}>
                {project.skills.map(skill => <span key={skill} style={pcStyles.skill}>{skill}</span>)}
              </div>
              <div style={pcStyles.meta}>
                <span>{project.difficulty}</span>
                <span>{project.estimatedTime}</span>
              </div>
              <div style={pcStyles.actions}>
                <button
                  onClick={() => onOpenProject(project.lab)}
                  style={pcStyles.openBtn}
                  disabled={!project.lab}
                >
                  START LOCAL LAB
                </button>
                <a href={project.url} target="_blank" rel="noreferrer" style={pcStyles.briefLink}>
                  SOURCE BRIEF
                </a>
              </div>
            </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}

const pcStyles = {
  root: { minHeight:'100vh', background:'transparent', color:'#e2e8f0', fontFamily:"'Inter',sans-serif" },
  nav: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 clamp(1rem, 3vw, 1.5rem)', height:52, background:'rgba(10,15,22,0.76)', borderBottom:'1px solid rgba(56,189,248,0.12)', position:'sticky', top:0, zIndex:100, backdropFilter:'blur(18px)' },
  navLeft: { display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', minWidth:0 },
  backBtn: { background:'transparent', border:'1px solid #1e3a2e', color:'#22c55e', fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:2, padding:'6px 10px', cursor:'pointer' },
  logoText: { fontFamily:"'Space Mono',monospace", fontSize:12, color:'#22c55e', letterSpacing:3, fontWeight:'bold' },
  sep: { color:'#1e3a2e' },
  navPage: { fontFamily:"'Space Mono',monospace", fontSize:10, color:'#94a3b8', letterSpacing:2 },
  navRight: { display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' },
  userText: { color:'#94a3b8', fontSize:11, fontFamily:"'Space Mono',monospace" },
  logoutBtn: { background:'transparent', border:'1px solid #1e3a2e', color:'#475569', fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:2, padding:'6px 12px', cursor:'pointer' },
  body: { padding:'clamp(2rem, 5vw, 3rem) clamp(1rem, 3vw, 2rem) clamp(3rem, 7vw, 4.5rem)', maxWidth:1180, margin:'0 auto' },
  header: { marginBottom:28 },
  kicker: { fontSize:10, color:'#22c55e', letterSpacing:3, fontFamily:"'Space Mono',monospace", marginBottom:10 },
  title: { fontSize:'clamp(2rem, 5vw, 3.5rem)', lineHeight:1.08, fontWeight:700, marginBottom:10, letterSpacing:0 },
  copy: { fontSize:'clamp(0.9rem, 1.6vw, 1rem)', color:'#7b8da5', lineHeight:1.7, maxWidth:780, marginBottom:16 },
  repoLink: { display:'inline-block', border:'1px solid rgba(34,197,94,0.35)', color:'#22c55e', textDecoration:'none', fontSize:10, letterSpacing:2, fontFamily:"'Space Mono',monospace", padding:'9px 12px' },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%, 16.5rem),1fr))', gap:'clamp(0.8rem, 2vw, 1rem)' },
  card: { background:'linear-gradient(180deg, rgba(15,21,32,0.84), rgba(8,13,20,0.72))', border:'1px solid rgba(56,189,248,0.12)', padding:'clamp(1rem, 2.5vw, 1.25rem)', minHeight:320, display:'flex', flexDirection:'column' },
  cardTop: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 },
  projectNum: { fontSize:10, color:'#1e3a2e', letterSpacing:2, fontFamily:"'Space Mono',monospace" },
  focus: { fontSize:9, color:'#38bdf8', border:'1px solid rgba(56,189,248,0.25)', padding:'3px 7px', fontFamily:"'Space Mono',monospace" },
  simBadge: { fontSize:9, color:'#f59e0b', border:'1px solid rgba(245,158,11,0.35)', padding:'3px 7px', fontFamily:"'Space Mono',monospace" },
  migratedBadge: { fontSize:9, color:'#22c55e', border:'1px solid rgba(34,197,94,0.55)', background:'rgba(34,197,94,0.08)', padding:'3px 7px', fontFamily:"'Space Mono',monospace", letterSpacing:1 },
  ownerBadge: { fontSize:9, color:'#94a3b8', border:'1px dashed rgba(148,163,184,0.45)', padding:'3px 7px', fontFamily:"'Space Mono',monospace", letterSpacing:0.5 },
  cardTitle: { fontSize:15, lineHeight:1.35, fontWeight:600, marginBottom:10, letterSpacing:0 },
  summary: { fontSize:12, color:'#64748b', lineHeight:1.65, marginBottom:14 },
  skillRow: { display:'flex', flexWrap:'wrap', gap:6, marginTop:'auto', marginBottom:14 },
  skill: { fontSize:9, color:'#94a3b8', border:'1px solid #1a2535', padding:'3px 6px', fontFamily:"'Space Mono',monospace" },
  meta: { display:'flex', justifyContent:'space-between', color:'#334155', fontSize:10, fontFamily:"'Space Mono',monospace", paddingTop:12, borderTop:'1px solid #0f1e2e', marginBottom:14 },
  actions: { display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', gap:10 },
  openBtn: { display:'block', width:'100%', textAlign:'center', textDecoration:'none', background:'transparent', border:'1px solid #22c55e', color:'#22c55e', fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:2, padding:'9px 10px', cursor:'pointer' },
  briefLink: { color:'#475569', textDecoration:'none', fontSize:9, letterSpacing:1.5, fontFamily:"'Space Mono',monospace", whiteSpace:'nowrap' },
};

Object.assign(window, { ProjectCatalogPage });
