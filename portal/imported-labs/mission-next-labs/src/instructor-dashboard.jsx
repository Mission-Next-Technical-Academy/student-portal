// ============================================================
//  Instructor Dashboard — cohort bars and section drilldown
// ============================================================

function InstructorDashboard({ user, onLogout }) {
  const [selectedUsername, setSelectedUsername] = React.useState('student_01');
  const [progressVersion, setProgressVersion] = React.useState(0);
  const [resetNotice, setResetNotice] = React.useState('');

  const progress = getProgress();
  const students = USERS.filter(u => u.role === 'student');
  const allLabs = [...MODULES, ...ALL_PROJECT_LABS];

  const sections = [
    { id:'splunk', label:'Splunk SIEM', modules:MODULES },
    ...TRAINING_CATALOG
      .filter(track => track.id !== 'splunk')
      .map(track => ({
        id:track.id,
        label:track.label,
        modules:(track.projects || []).map(project => project.lab).filter(Boolean),
      })),
  ];

  function getProgressForModule(username, mod) {
    const mp = (progress[username] || {})[mod.id] || { completedTasks: [], score: 0, started: false };
    const totalTasks = mod.tasks.length;
    const doneTasks = mp.completedTasks.length;
    const maxScore = mod.tasks.reduce((sum, task) => sum + task.points, 0);
    return {
      doneTasks,
      totalTasks,
      score:mp.score || 0,
      maxScore,
      complete: totalTasks > 0 && doneTasks === totalTasks,
      started: !!mp.started || doneTasks > 0,
    };
  }

  function getSectionStats(username, section) {
    const moduleStats = section.modules.map(mod => ({ ...mod, progress:getProgressForModule(username, mod) }));
    const totalTasks = moduleStats.reduce((sum, mod) => sum + mod.progress.totalTasks, 0);
    const doneTasks = moduleStats.reduce((sum, mod) => sum + mod.progress.doneTasks, 0);
    const score = moduleStats.reduce((sum, mod) => sum + mod.progress.score, 0);
    const maxScore = moduleStats.reduce((sum, mod) => sum + mod.progress.maxScore, 0);
    const completedModules = moduleStats.filter(mod => mod.progress.complete).length;
    return {
      ...section,
      moduleStats,
      totalTasks,
      doneTasks,
      score,
      maxScore,
      completedModules,
      pct: totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0,
    };
  }

  function getStudentStats(student) {
    const sectionStats = sections.map(section => getSectionStats(student.username, section));
    const doneTasks = sectionStats.reduce((sum, section) => sum + section.doneTasks, 0);
    const totalTasks = sectionStats.reduce((sum, section) => sum + section.totalTasks, 0);
    const score = sectionStats.reduce((sum, section) => sum + section.score, 0);
    const maxScore = sectionStats.reduce((sum, section) => sum + section.maxScore, 0);
    const completedModules = sectionStats.reduce((sum, section) => sum + section.completedModules, 0);
    return {
      ...student,
      _v:progressVersion,
      sectionStats,
      doneTasks,
      totalTasks,
      score,
      maxScore,
      completedModules,
      totalModules:allLabs.length,
      pct: totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0,
      engagement: getEngagementStats(student.username),
    };
  }

  // Roll up step-attempt + CoL data from the new MISSION_NEXT_PROGRESS_EXT store.
  function getEngagementStats(username) {
    const ext = window.MISSION_NEXT_PROGRESS_EXT && window.MISSION_NEXT_PROGRESS_EXT.getAllForUser(username) || {};
    let attempts = 0, hintsShown = 0, colCorrect = 0, colTotal = 0, colSkipped = 0;
    let lastInteractionAt = null;
    for (const labId of Object.keys(ext)) {
      const lab = ext[labId] || {};
      if (lab.lastInteractionAt && (!lastInteractionAt || lab.lastInteractionAt > lastInteractionAt)) {
        lastInteractionAt = lab.lastInteractionAt;
      }
      const stepAttempts = lab.stepAttempts || {};
      for (const id of Object.keys(stepAttempts)) {
        const a = stepAttempts[id];
        attempts += a.count || 0;
        hintsShown += a.hintsShown || 0;
      }
      const col = lab.colResponses || {};
      for (const id of Object.keys(col)) {
        colTotal += 1;
        if (col[id].passed) colCorrect += 1;
        if (col[id].lastResponse && col[id].lastResponse.skipped) colSkipped += 1;
      }
    }
    return { attempts, hintsShown, colCorrect, colTotal, colSkipped, lastInteractionAt };
  }

  function handleResetStudent(username) {
    if (!window.confirm(`Reset all progress for ${username}?`)) return;
    resetUserProgress(username);
    setResetNotice(`Reset progress for ${username}.`);
    setProgressVersion(v => v + 1);
  }

  function handleResetAll() {
    if (!window.confirm('Reset progress for every student?')) return;
    resetAllStudentProgress();
    setResetNotice('Reset progress for all students.');
    setProgressVersion(v => v + 1);
  }

  const cohortStats = students.map(getStudentStats);
  const selectedStudent = cohortStats.find(student => student.username === selectedUsername) || cohortStats[0];
  const avgPct = Math.round(cohortStats.reduce((sum, student) => sum + student.pct, 0) / cohortStats.length);
  const activeStudents = cohortStats.filter(student => student.doneTasks > 0).length;
  const completedStudents = cohortStats.filter(student => student.pct === 100).length;
  const totalDone = cohortStats.reduce((sum, student) => sum + student.doneTasks, 0);
  const totalTasks = cohortStats.reduce((sum, student) => sum + student.totalTasks, 0);

  return (
    <div style={id2.root}>
      <nav style={id2.nav}>
        <div style={id2.navLeft}>
          <img src='./assets/boot-logo-transparent.png' style={{width:41,height:41,objectFit:'contain'}} />
          <span style={id2.logoText}>MISSION NEXT</span>
          <span style={id2.sep}>›</span>
          <span style={id2.navPage}>Instructor Dashboard</span>
        </div>
        <div style={id2.navRight}>
          <span style={id2.instrBadge}>INSTRUCTOR</span>
          <span style={id2.userText}>{user.displayName}</span>
          <button onClick={onLogout} style={id2.logoutBtn}>LOGOUT</button>
        </div>
      </nav>

      <main style={id2.body}>
        <section data-reveal style={id2.metrics}>
          <MetricCardV2 label="COHORT SIZE" value={students.length} sub="students enrolled" accent="#38bdf8" />
          <MetricCardV2 label="AVG PROGRESS" value={`${avgPct}%`} sub={`${totalDone}/${totalTasks} tasks`} accent="#22c55e" />
          <MetricCardV2 label="ACTIVE STUDENTS" value={activeStudents} sub="started work" accent="#f59e0b" />
          <MetricCardV2 label="FULLY COMPLETE" value={completedStudents} sub="all sections done" accent="#a78bfa" />
        </section>

        <section data-reveal style={id2.adminBar}>
          <div>
            <div style={id2.sectionLabel}>COHORT CONTROL</div>
            <div style={id2.adminCopy}>One row shows students 1-10. Select a student to inspect progress by training section.</div>
          </div>
          <button onClick={handleResetAll} style={id2.resetAllBtn}>RESET ALL STUDENTS</button>
        </section>
        {resetNotice && <div style={id2.notice}>{resetNotice}</div>}

        <section data-reveal style={id2.studentPanel}>
          <div style={id2.panelHeader}>
            <div>
              <div style={id2.sectionLabel}>STUDENTS</div>
              <div style={id2.panelSub}>Click a student segment for section progress.</div>
            </div>
            <div style={id2.selectedName}>{selectedStudent.username}</div>
          </div>

          <div style={id2.studentBar}>
            {cohortStats.map(student => (
              <button
                key={student.username}
                onClick={() => setSelectedUsername(student.username)}
                style={{
                  ...id2.studentSegment,
                  borderColor: selectedStudent.username === student.username ? '#22c55e' : 'rgba(56,189,248,0.14)',
                  background: selectedStudent.username === student.username ? 'rgba(34,197,94,0.12)' : 'rgba(15,21,32,0.72)',
                }}
              >
                <span style={id2.studentNum}>{student.displayName.replace('Student ', '')}</span>
                <span style={{...id2.studentPct, color:barColorV2(student.pct)}}>{student.pct}%</span>
                <span style={id2.segmentTrack}>
                  <span style={{...id2.segmentFill, width:`${student.pct}%`, background:barColorV2(student.pct)}} />
                </span>
              </button>
            ))}
          </div>
        </section>

        {selectedStudent && (
          <section data-reveal data-card style={id2.detailPanel}>
            <div style={id2.detailTop}>
              <div>
                <div style={id2.sectionLabel}>{selectedStudent.username}</div>
                <h1 style={id2.detailTitle}>{selectedStudent.displayName}</h1>
                <div style={id2.detailMeta}>
                  {selectedStudent.doneTasks}/{selectedStudent.totalTasks} tasks · {selectedStudent.score}/{selectedStudent.maxScore} points · {selectedStudent.completedModules}/{selectedStudent.totalModules} labs complete
                </div>
              </div>
              <button onClick={() => handleResetStudent(selectedStudent.username)} style={id2.resetBtn}>RESET STUDENT</button>
            </div>

            <div style={id2.overallTrack}>
              <div style={{...id2.overallFill, width:`${selectedStudent.pct}%`, background:barColorV2(selectedStudent.pct)}} />
            </div>

            <div style={id2.engagementRow}>
              <div style={id2.engagementCard}>
                <div style={id2.engagementLabel}>STEP ATTEMPTS</div>
                <div style={id2.engagementValue}>{selectedStudent.engagement.attempts}</div>
              </div>
              <div style={id2.engagementCard}>
                <div style={id2.engagementLabel}>HINTS SHOWN</div>
                <div style={id2.engagementValue}>{selectedStudent.engagement.hintsShown}</div>
              </div>
              <div style={id2.engagementCard}>
                <div style={id2.engagementLabel}>CoL ANSWERED</div>
                <div style={id2.engagementValue}>
                  {selectedStudent.engagement.colCorrect}<span style={id2.engagementSub}>/{selectedStudent.engagement.colTotal}</span>
                </div>
              </div>
              <div style={id2.engagementCard}>
                <div style={id2.engagementLabel}>CoL SKIPPED</div>
                <div style={{...id2.engagementValue, color: selectedStudent.engagement.colSkipped > 0 ? '#f59e0b' : '#475569'}}>
                  {selectedStudent.engagement.colSkipped}
                </div>
              </div>
              <div style={id2.engagementCard}>
                <div style={id2.engagementLabel}>LAST SEEN</div>
                <div style={id2.engagementValue}>
                  {selectedStudent.engagement.lastInteractionAt
                    ? new Date(selectedStudent.engagement.lastInteractionAt).toLocaleString()
                    : '—'}
                </div>
              </div>
            </div>

            <div style={id2.sectionBars}>
              {selectedStudent.sectionStats.map(section => (
                <div key={section.id} style={id2.sectionRow}>
                  <div style={id2.sectionInfo}>
                    <span style={id2.sectionName}>{section.label}</span>
                    <span style={id2.sectionStats}>{section.completedModules}/{section.modules.length} labs · {section.doneTasks}/{section.totalTasks} tasks</span>
                  </div>
                  <div style={id2.sectionTrack}>
                    <div style={{...id2.sectionFill, width:`${section.pct}%`, background:barColorV2(section.pct)}} />
                  </div>
                  <span style={{...id2.sectionPct, color:barColorV2(section.pct)}}>{section.pct}%</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function MetricCardV2({ label, value, sub, accent }) {
  return (
    <div data-card style={{...id2.metricCard, borderColor: accent + '28'}}>
      <div style={{fontSize:26,fontFamily:"'Space Mono',monospace",color:accent,lineHeight:1}}>{value}</div>
      <div style={{fontSize:9,color:'#475569',letterSpacing:2,marginTop:7}}>{label}</div>
      <div style={{fontSize:10,color:'#334155',marginTop:3}}>{sub}</div>
    </div>
  );
}

function barColorV2(pct) {
  if (pct >= 80) return '#22c55e';
  if (pct >= 40) return '#f59e0b';
  if (pct > 0) return '#f87171';
  return '#1e3a2e';
}

const id2 = {
  root: { minHeight:'100vh', background:'transparent', color:'#e2e8f0', fontFamily:"'Inter',sans-serif" },
  nav: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 clamp(1rem, 3vw, 2rem)', minHeight:52, background:'rgba(10,15,22,0.76)', borderBottom:'1px solid rgba(56,189,248,0.12)', position:'sticky', top:0, zIndex:100, backdropFilter:'blur(18px)', flexWrap:'wrap', gap:10 },
  navLeft: { display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', minWidth:0 },
  logoText: { fontFamily:"'Space Mono',monospace", fontSize:12, color:'#22c55e', letterSpacing:3, fontWeight:'bold' },
  sep: { color:'#1e3a2e' },
  navPage: { fontFamily:"'Space Mono',monospace", fontSize:10, color:'#475569', letterSpacing:2 },
  navRight: { display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' },
  instrBadge: { fontSize:9, color:'#38bdf8', border:'1px solid rgba(56,189,248,0.3)', padding:'3px 8px', letterSpacing:2, fontFamily:"'Space Mono',monospace" },
  userText: { color:'#94a3b8', fontSize:11, fontFamily:"'Space Mono',monospace" },
  logoutBtn: { background:'transparent', border:'1px solid #1e3a2e', color:'#475569', fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:2, padding:'6px 12px', cursor:'pointer' },
  body: { padding:'clamp(1rem, 3vw, 2rem)', maxWidth:1380, margin:'0 auto' },
  metrics: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%, 13rem),1fr))', gap:'clamp(0.75rem, 2vw, 1rem)', marginBottom:20 },
  metricCard: { background:'linear-gradient(180deg, rgba(15,21,32,0.84), rgba(8,13,20,0.7))', border:'1px solid', padding:'clamp(1rem, 2.5vw, 1.35rem)' },
  adminBar: { display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, background:'rgba(15,21,32,0.78)', border:'1px solid rgba(248,113,113,0.22)', padding:'16px', marginBottom:16, flexWrap:'wrap' },
  adminCopy: { color:'#64748b', fontSize:12, lineHeight:1.5 },
  resetAllBtn: { background:'rgba(239,68,68,0.12)', border:'1px solid rgba(248,113,113,0.45)', color:'#f87171', fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:2, padding:'10px 12px', cursor:'pointer' },
  resetBtn: { background:'transparent', border:'1px solid rgba(248,113,113,0.45)', color:'#f87171', fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:2, padding:'10px 12px', cursor:'pointer' },
  notice: { border:'1px solid rgba(34,197,94,0.28)', background:'rgba(34,197,94,0.08)', color:'#22c55e', fontSize:11, fontFamily:"'Space Mono',monospace", padding:'10px 12px', marginBottom:16 },
  sectionLabel: { fontSize:9, color:'#475569', letterSpacing:3, marginBottom:6, fontFamily:"'Space Mono',monospace" },
  studentPanel: { background:'rgba(15,21,32,0.78)', border:'1px solid rgba(56,189,248,0.12)', padding:18, marginBottom:18 },
  panelHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, marginBottom:14, flexWrap:'wrap' },
  panelSub: { color:'#64748b', fontSize:12 },
  selectedName: { color:'#22c55e', fontFamily:"'Space Mono',monospace", fontSize:12 },
  studentBar: { display:'grid', gridTemplateColumns:'repeat(10,minmax(72px,1fr))', gap:8, overflowX:'auto', paddingBottom:2 },
  studentSegment: { minHeight:78, border:'1px solid', color:'#e2e8f0', padding:9, cursor:'pointer', display:'flex', flexDirection:'column', justifyContent:'space-between', alignItems:'stretch' },
  studentNum: { fontFamily:"'Space Mono',monospace", color:'#94a3b8', fontSize:11 },
  studentPct: { fontFamily:"'Space Mono',monospace", fontSize:16, fontWeight:700 },
  segmentTrack: { display:'block', height:4, background:'#0f1e2e', overflow:'hidden' },
  segmentFill: { display:'block', height:'100%', transition:'width 0.3s' },
  detailPanel: { background:'rgba(15,21,32,0.86)', border:'1px solid rgba(34,197,94,0.25)', padding:'clamp(1rem, 2.5vw, 1.4rem)' },
  detailTop: { display:'flex', justifyContent:'space-between', gap:16, alignItems:'flex-start', flexWrap:'wrap', marginBottom:14 },
  detailTitle: { fontSize:28, lineHeight:1.1, margin:0, letterSpacing:0 },
  detailMeta: { color:'#64748b', fontSize:12, marginTop:7 },
  overallTrack: { height:8, background:'#0f1e2e', marginBottom:20, overflow:'hidden' },
  overallFill: { height:'100%', transition:'width 0.35s' },
  sectionBars: { display:'flex', flexDirection:'column', gap:12 },
  sectionRow: { display:'grid', gridTemplateColumns:'minmax(180px,260px) minmax(180px,1fr) 54px', gap:12, alignItems:'center' },
  sectionInfo: { minWidth:0 },
  sectionName: { display:'block', color:'#e2e8f0', fontSize:13, fontWeight:600 },
  sectionStats: { display:'block', color:'#475569', fontFamily:"'Space Mono',monospace", fontSize:10, marginTop:3 },
  sectionTrack: { height:7, background:'#0f1e2e', overflow:'hidden' },
  sectionFill: { height:'100%', transition:'width 0.35s' },
  sectionPct: { fontFamily:"'Space Mono',monospace", fontSize:12, textAlign:'right' },

  engagementRow: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,9.5rem),1fr))', gap:10, marginBottom:18 },
  engagementCard: { background:'rgba(8,13,20,0.55)', border:'1px solid rgba(56,189,248,0.14)', padding:'10px 12px', borderRadius:4 },
  engagementLabel: { fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:2, color:'#475569' },
  engagementValue: { fontFamily:"'Space Mono',monospace", fontSize:18, color:'#e2e8f0', marginTop:6 },
  engagementSub: { fontSize:13, color:'#475569' },
};

Object.assign(window, { InstructorDashboard });
