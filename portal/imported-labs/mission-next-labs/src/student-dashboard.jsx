// ============================================================
//  Student Dashboard Component
// ============================================================

function StudentDashboard({ user, onSelectModule, onLogout, onBack }) {
  const progress = getProgress()[user.username] || {};

  function getModuleStats(mod) {
    const mp = progress[mod.id] || { completedTasks: [], score: 0 };
    const total = mod.tasks.length;
    const done = mp.completedTasks.length;
    const maxScore = mod.tasks.reduce((s, t) => s + t.points, 0);
    return { done, total, pct: Math.round((done / total) * 100), score: mp.score, maxScore, started: mp.started };
  }

  const totalScore = Object.values(progress).reduce((s, mp) => s + (mp.score || 0), 0);
  const totalMax = MODULES.reduce((s, m) => s + m.tasks.reduce((a, t) => a + t.points, 0), 0);
  const completedMods = MODULES.filter(m => {
    const mp = progress[m.id];
    return mp && mp.completedTasks.length === m.tasks.length;
  }).length;

  const diffColor = { Beginner: '#22c55e', Intermediate: '#f59e0b', Advanced: '#f87171' };

  return (
    <div style={sdStyles.root}>
      {/* Top Nav */}
      <nav style={sdStyles.nav}>
        <div style={sdStyles.navLeft}>
          <button onClick={onBack} style={sdStyles.pathBtn}>‹ PATHS</button>
          <img src='./assets/boot-logo-transparent.png' style={{width:41,height:41,objectFit:'contain'}} />
          <span style={sdStyles.navTitle}>MISSION NEXT</span>
          <span style={sdStyles.navSep}>›</span>
          <span style={sdStyles.navPage}>SOC Analyst Track</span>
        </div>
        <div style={sdStyles.navRight}>
          <div style={sdStyles.navUser}>
            <span data-status="online" style={sdStyles.navUserDot} />
            <span style={{color:'#94a3b8',fontSize:11}}>{user.displayName}</span>
          </div>
          <button onClick={onLogout} style={sdStyles.logoutBtn}>LOGOUT</button>
        </div>
      </nav>

      <div style={sdStyles.body}>
        {/* Stats bar */}
        <div data-reveal style={sdStyles.statsBar}>
          <StatCard label="TOTAL SCORE" value={`${totalScore}/${totalMax}`} accent="#22c55e" />
          <StatCard label="MODULES COMPLETE" value={`${completedMods}/${MODULES.length}`} accent="#38bdf8" />
          <StatCard label="MODULES ACTIVE" value={MODULES.filter(m => progress[m.id]?.started && progress[m.id]?.completedTasks.length < m.tasks.length).length} accent="#f59e0b" />
          <StatCard label="RANK" value={totalScore >= 400 ? 'TIER 3' : totalScore >= 200 ? 'TIER 2' : 'TIER 1'} accent="#a78bfa" />
        </div>

        {/* Progress overview bar */}
        <div data-reveal data-card style={sdStyles.overallBar}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
            <span style={{fontSize:10,color:'#475569',letterSpacing:2}}>OVERALL COMPLETION</span>
            <span style={{fontSize:10,color:'#22c55e'}}>{Math.round((totalScore/totalMax)*100)}%</span>
          </div>
          <div style={sdStyles.trackBg}>
            <div data-shimmer style={{...sdStyles.trackFill, width:`${Math.round((totalScore/totalMax)*100)}%`}} />
          </div>
        </div>

        {/* Module grid */}
        <div style={sdStyles.sectionLabel}>TRAINING MODULES</div>
        <div style={sdStyles.grid}>
          {MODULES.map(mod => {
            const stats = getModuleStats(mod);
            return (
              <div
                key={mod.id}
                data-reveal
                data-card
                onClick={() => onSelectModule(mod)}
                style={{
                  ...sdStyles.card,
                  borderColor: stats.done === stats.total ? '#1e3a2e' : stats.started ? '#2a3a1e' : '#1a2535',
                  boxShadow: stats.done === stats.total ? '0 0 20px rgba(34,197,94,0.06)' : 'none',
                }}
              >
                <div style={sdStyles.cardTop}>
                  <span style={sdStyles.cardIcon}>{mod.icon}</span>
                  <span style={{...sdStyles.diffBadge, color: diffColor[mod.difficulty], borderColor: diffColor[mod.difficulty] + '40'}}>
                    {mod.difficulty}
                  </span>
                </div>

                <div style={sdStyles.cardNum}>{'0' + (MODULES.indexOf(mod) + 1)}</div>
                <div style={sdStyles.cardTitle}>{mod.title}</div>
                <div style={sdStyles.cardSub}>{mod.subtitle}</div>

                <div style={sdStyles.cardTags}>
                  {mod.tags.slice(0,2).map(t => (
                    <span key={t} style={sdStyles.tag}>{t}</span>
                  ))}
                </div>

                <div style={sdStyles.cardMeta}>
                  <span style={{color:'#475569',fontSize:10}}>⏱ {mod.estimatedTime}</span>
                  <span style={{color:'#475569',fontSize:10}}>{mod.tasks.length} tasks</span>
                </div>

                {/* Progress bar */}
                <div style={{marginTop:16}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                    <span style={{fontSize:9,color:'#475569',letterSpacing:2}}>
                      {stats.done === stats.total ? '✓ COMPLETE' : stats.started ? 'IN PROGRESS' : 'NOT STARTED'}
                    </span>
                    <span style={{fontSize:9,color: stats.done===stats.total ? '#22c55e' : '#475569'}}>
                      {stats.done}/{stats.total}
                    </span>
                  </div>
                  <div style={sdStyles.cardTrackBg}>
                    <div style={{
                      ...sdStyles.cardTrackFill,
                      width: `${stats.pct}%`,
                      background: stats.done === stats.total ? '#22c55e' : stats.started ? '#f59e0b' : '#334155',
                    }} />
                  </div>
                </div>

                <div style={sdStyles.cardFooter}>
                  <span style={{fontSize:10,color:'#334155'}}>Score</span>
                  <span style={{fontSize:11,color: stats.score > 0 ? '#22c55e' : '#334155'}}>
                    {stats.score}/{stats.maxScore} pts
                  </span>
                </div>

                <div style={sdStyles.cardCta}>
                  {stats.done === stats.total ? 'REVIEW MODULE ›' : stats.started ? 'CONTINUE ›' : 'LAUNCH MODULE ›'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div data-card style={{...sdStyles.statCard, borderColor: accent + '30'}}>
      <div style={{fontSize:18,fontWeight:'bold',color:accent,fontFamily:"'Space Mono',monospace"}}>{value}</div>
      <div style={{fontSize:9,color:'#475569',letterSpacing:2,marginTop:4}}>{label}</div>
    </div>
  );
}

const sdStyles = {
  root: { minHeight:'100vh', background:'transparent', fontFamily:"'Inter',sans-serif", color:'#e2e8f0' },
  nav: {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'0 clamp(1rem, 3vw, 2rem)', height:52, background:'rgba(10,15,22,0.76)',
    borderBottom:'1px solid rgba(56,189,248,0.12)', position:'sticky', top:0, zIndex:100,
    backdropFilter:'blur(18px)',
  },
  navLeft: { display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', minWidth:0 },
  pathBtn: {
    background:'transparent', border:'1px solid #1e3a2e', color:'#22c55e',
    fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:2,
    padding:'5px 9px', cursor:'pointer',
  },
  navTitle: { fontFamily:"'Space Mono',monospace", fontSize:12, color:'#22c55e', letterSpacing:3, fontWeight:'bold' },
  navSep: { color:'#1e3a2e', fontSize:16 },
  navPage: { fontFamily:"'Space Mono',monospace", fontSize:10, color:'#475569', letterSpacing:2 },
  navRight: { display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' },
  navUser: { display:'flex', alignItems:'center', gap:8 },
  navUserDot: { width:6, height:6, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 6px #22c55e' },
  logoutBtn: {
    background:'transparent', border:'1px solid #1e3a2e', color:'#475569',
    fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:2,
    padding:'6px 12px', cursor:'pointer',
  },
  body: { padding:'clamp(1rem, 3.5vw, 2rem) clamp(1rem, 3vw, 2rem) clamp(3rem, 6vw, 4rem)' },
  statsBar: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%, 13rem),1fr))', gap:'clamp(0.75rem, 2vw, 1rem)', marginBottom:'clamp(1rem, 3vw, 1.5rem)' },
  statCard: {
    background:'linear-gradient(180deg, rgba(15,21,32,0.82), rgba(8,13,20,0.68))', border:'1px solid', padding:'clamp(1rem, 2.5vw, 1.4rem)',
    minWidth:0,
  },
  overallBar: { background:'rgba(15,21,32,0.72)', border:'1px solid rgba(56,189,248,0.12)', padding:'clamp(1rem, 2.5vw, 1.4rem)', marginBottom:'clamp(1.5rem, 4vw, 2rem)' },
  trackBg: { height:3, background:'#0f1e2e', borderRadius:2 },
  trackFill: { height:'100%', background:'linear-gradient(90deg,#22c55e,#16a34a)', borderRadius:2, transition:'width 0.4s' },
  sectionLabel: { fontSize:10, color:'#475569', letterSpacing:3, marginBottom:16, fontFamily:"'Space Mono',monospace" },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%, 17rem),1fr))', gap:'clamp(0.8rem, 2vw, 1rem)' },
  card: {
    background:'linear-gradient(180deg, rgba(15,21,32,0.86), rgba(8,13,20,0.72))', border:'1px solid', padding:'clamp(1rem, 2.5vw, 1.5rem)',
    cursor:'pointer', transition:'all 0.2s', position:'relative', overflow:'hidden',
  },
  cardTop: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  cardIcon: { fontSize:20 },
  diffBadge: { fontSize:9, border:'1px solid', padding:'2px 8px', letterSpacing:1, fontFamily:"'Space Mono',monospace" },
  cardNum: { fontSize:10, color:'#1e3a2e', fontFamily:"'Space Mono',monospace", letterSpacing:2, marginBottom:6 },
  cardTitle: { fontSize:15, fontWeight:600, color:'#e2e8f0', marginBottom:4 },
  cardSub: { fontSize:11, color:'#475569', marginBottom:12 },
  cardTags: { display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' },
  tag: { fontSize:9, color:'#334155', border:'1px solid #1a2535', padding:'2px 6px', letterSpacing:1 },
  cardMeta: { display:'flex', justifyContent:'space-between' },
  cardTrackBg: { height:2, background:'#0f1e2e' },
  cardTrackFill: { height:'100%', transition:'width 0.4s' },
  cardFooter: { display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14, paddingTop:14, borderTop:'1px solid #0f1e2e' },
  cardCta: { fontSize:9, color:'#1e3a2e', letterSpacing:2, marginTop:10, fontFamily:"'Space Mono',monospace", textAlign:'right' },
};

Object.assign(window, { StudentDashboard });
