// ============================================================
//  App Root — routing & state
// ============================================================

function App() {
  const [user, setUser] = React.useState(() => {
    // Local review build: auth barrier removed so the app opens straight in.
    let session = getSession();
    if (!session) {
      session = USERS.find(u => u.username === 'student_01');
      setSession(session);
      initUserProgress(session.username);
    }
    return session;
  });
  const [track, setTrack] = React.useState(null); // splunk | windows-forensics
  const [view, setView] = React.useState('tracks'); // tracks | dashboard | module
  const [activeModule, setActiveModule] = React.useState(null);
  const [activeProjectId, setActiveProjectId] = React.useState(null);
  const [routeError, setRouteError] = React.useState(null);

  React.useEffect(() => {
    function syncFromHash() {
      applyRoute(parseHashRoute());
    }
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  function applyRoute(route) {
    setTrack(route.track);
    setView(route.view);
    setActiveModule(route.module || null);
    setActiveProjectId(route.projectId || null);
    setRouteError(route.error || null);
  }

  function setRoute(path) {
    if (window.location.hash !== path) window.location.hash = path;
    applyRoute(parseHashRoute(path));
  }

  function handleLogin(u) {
    setUser(u);
    setRoute(u.role === 'instructor' ? '#/instructor' : '#/tracks');
  }

  function handleLogout() {
    clearSession();
    setUser(null);
    setTrack(null);
    setView('tracks');
    setActiveModule(null);
    setActiveProjectId(null);
    setRouteError(null);
    window.location.hash = '#/login';
  }

  function handleSelectTrack(nextTrack) {
    setRoute(`#/track/${nextTrack}`);
  }

  function handleBackToTracks() {
    setRoute('#/tracks');
  }

  function handleSelectModule(mod) {
    setRoute(`#/track/splunk/module/${mod.id}`);
  }

  function handleSelectProjectLab(lab) {
    if (!lab) return;
    const projectId = String(lab.id || '').replace(/^lab-/, '');
    setRoute(`#/track/${track}/project/${projectId}/lab`);
  }

  function handleBackToDashboard() {
    setRoute(track ? `#/track/${track}` : '#/tracks');
  }

  function handleBackFromLab() {
    const returnTo = new URLSearchParams(window.location.search).get('returnTo');
    if (returnTo && /^\/(?!\/)/.test(returnTo)) {
      window.location.href = returnTo;
      return;
    }
    handleBackToDashboard();
  }

  function handleSelectWindowsProject(projectId) {
    setRoute(`#/track/windows-forensics/project/${projectId}`);
  }

  const routeKey = !user
    ? 'login'
    : routeError
      ? `route-error-${routeError.kind}-${routeError.id || 'unknown'}`
    : view === 'tracks' || !track
      ? 'tracks'
      : track !== 'splunk' && view === 'module' && activeModule
          ? `project-module-${activeModule.id}`
          : track === 'windows-forensics'
            ? `windows-forensics-${activeProjectId || 'index'}`
          : track !== 'splunk'
            ? `catalog-${track}`
            : user.role === 'instructor'
              ? 'instructor'
              : view === 'module' && activeModule
                ? `module-${activeModule.id}`
                : 'student-dashboard';

  function withTransition(screen) {
    return (
      <AppErrorBoundary routeKey={routeKey}>
        <AnimatedPage routeKey={routeKey}>{screen}</AnimatedPage>
      </AppErrorBoundary>
    );
  }

  if (!user) return withTransition(<LoginPage onLogin={handleLogin} />);

  if (routeError?.kind === 'module') {
    return withTransition(
      <ModuleNotFound
        moduleId={routeError.id}
        track={track}
        onBack={track === 'splunk' ? handleBackToDashboard : handleBackToTracks}
      />
    );
  }

  if (routeError?.kind === 'track') {
    return withTransition(
      <TrackNotFound
        trackId={routeError.id}
        onBack={handleBackToTracks}
      />
    );
  }

  if (routeError?.kind === 'lab' || routeError?.kind === 'project') {
    return withTransition(
      <LabNotFound
        projectId={routeError.id}
        track={track}
        isProjectOnly={routeError.kind === 'project'}
        onBack={handleBackToDashboard}
      />
    );
  }

  if (view === 'tracks' || !track) {
    return withTransition(
      <TrackSelection
        user={user}
        onSelectTrack={handleSelectTrack}
        onLogout={handleLogout}
      />
    );
  }

  if (user.role === 'instructor') {
    return withTransition(<InstructorDashboard user={user} onLogout={handleLogout} onBack={handleBackToTracks} />);
  }

  if (track !== 'splunk' && view === 'module' && activeModule) {
    return withTransition(
      <ModulePage
        user={user}
        mod={activeModule}
        track={track}
        onBack={handleBackFromLab}
      />
    );
  }

  if (track === 'windows-forensics') {
    return withTransition(
      <WindowsForensicsPage
        user={user}
        onBack={handleBackToTracks}
        onLogout={handleLogout}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectWindowsProject}
        onOpenProject={handleSelectProjectLab}
      />
    );
  }

  if (track !== 'splunk') {
    return withTransition(
      <ProjectCatalogPage
        trackId={track}
        user={user}
        onBack={handleBackToTracks}
        onLogout={handleLogout}
        onOpenProject={handleSelectProjectLab}
      />
    );
  }

  if (view === 'module' && activeModule) {
    return withTransition(
      <ModulePage
        user={user}
        mod={activeModule}
        track={track}
        onBack={handleBackFromLab}
      />
    );
  }

  return withTransition(
    <StudentDashboard
      user={user}
      onSelectModule={handleSelectModule}
      onLogout={handleLogout}
      onBack={handleBackToTracks}
    />
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

function parseHashRoute(hashValue) {
  const hash = hashValue || window.location.hash || '#/tracks';
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);

  if (parts[0] === 'instructor') return { track:'instructor', view:'dashboard' };
  if (parts[0] !== 'track') return { track:null, view:'tracks' };

  const nextTrack = parts[1] || null;
  if (!nextTrack) return { track:null, view:'tracks' };
  if (!TRAINING_CATALOG.some(item => item.id === nextTrack)) {
    return {
      track:nextTrack,
      view:'dashboard',
      error:{ kind:'track', id:nextTrack },
    };
  }

  if (parts[2] === 'module') {
    const moduleId = parts[3] || null;
    const module = MODULES.find(mod => mod.id === moduleId);
    if (!module) {
      return {
        track:nextTrack,
        view:'module',
        error:{ kind:'module', id:moduleId || '(missing)' },
      };
    }
    return {
      track:nextTrack,
      view:'module',
      module,
    };
  }

  if (parts[2] === 'project') {
    const projectId = parts[3] || null;
    // New-shape labs registered at window.B2B_LABS take precedence over the legacy generic-fixture labs
    // when they declare an `exercises` array. Stubs (comingSoon) fall through to the old shape.
    const newShapeLab = (window.B2B_LABS && window.B2B_LABS[projectId]) || null;
    const useNewShape = newShapeLab && Array.isArray(newShapeLab.exercises);
    const lab = useNewShape ? newShapeLab : ALL_PROJECT_LABS.find(item => item.id === `lab-${projectId}`);
    if (!projectId) {
      return {
        track:nextTrack,
        view:parts[4] === 'lab' ? 'module' : 'dashboard',
        projectId:'(missing)',
        error:{ kind:parts[4] === 'lab' ? 'lab' : 'project', id:'(missing)' },
      };
    }
    if (parts[4] === 'lab' && !lab) {
      return {
        track:nextTrack,
        view:'module',
        projectId,
        error:{ kind:'lab', id:projectId },
      };
    }
    if (parts[4] !== 'lab' && !lab) {
      return {
        track:nextTrack,
        view:'dashboard',
        projectId,
        error:{ kind:'project', id:projectId },
      };
    }
    return {
      track:nextTrack,
      view:parts[4] === 'lab' ? 'module' : 'dashboard',
      projectId,
      module:parts[4] === 'lab' ? lab : null,
    };
  }

  return { track:nextTrack, view:'dashboard' };
}

function ModuleNotFound({ moduleId, track, onBack }) {
  return (
    <RouteNotFoundPanel
      kicker="MODULE NOT FOUND"
      title="Module Not Found"
      copy={`No training module exists for "${moduleId}". The route was not redirected so the invalid module ID is visible.`}
      detail={`Track: ${track || 'unknown'}`}
      actionLabel="RETURN TO TRACK"
      onBack={onBack}
    />
  );
}

function LabNotFound({ projectId, track, isProjectOnly, onBack }) {
  return (
    <RouteNotFoundPanel
      kicker={isProjectOnly ? 'PROJECT NOT FOUND' : 'LAB NOT FOUND'}
      title={isProjectOnly ? 'Project Not Found' : 'Lab Not Found'}
      copy={`No ${isProjectOnly ? 'project' : 'local lab'} exists for "${projectId}". The route was not redirected so the invalid project ID is visible.`}
      detail={`Track: ${track || 'unknown'}`}
      actionLabel="RETURN TO CATALOG"
      onBack={onBack}
    />
  );
}

function TrackNotFound({ trackId, onBack }) {
  return (
    <RouteNotFoundPanel
      kicker="TRACK NOT FOUND"
      title="Track Not Found"
      copy={`No training track exists for "${trackId}". The route was not redirected so the invalid track ID is visible.`}
      detail="Available tracks are defined in the local training catalog."
      actionLabel="RETURN TO TRAINING PATHS"
      onBack={onBack}
    />
  );
}

function RouteNotFoundPanel({ kicker, title, copy, detail, actionLabel, onBack }) {
  return (
    <div style={routeErrorStyles.root}>
      <div style={routeErrorStyles.panel}>
        <div style={routeErrorStyles.kicker}>{kicker}</div>
        <h1 style={routeErrorStyles.title}>{title}</h1>
        <p style={routeErrorStyles.copy}>{copy}</p>
        <div style={routeErrorStyles.detail}>{detail}</div>
        <button onClick={onBack} style={routeErrorStyles.button}>
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

const routeErrorStyles = {
  root: { minHeight:'100vh', background:'#080d14', color:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Inter',sans-serif", padding:24 },
  panel: { width:'100%', maxWidth:560, background:'rgba(15,21,32,0.94)', border:'1px solid rgba(248,113,113,0.35)', padding:24 },
  kicker: { color:'#f87171', fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:3, marginBottom:10 },
  title: { fontSize:26, margin:'0 0 10px', letterSpacing:0 },
  copy: { color:'#94a3b8', fontSize:13, lineHeight:1.6, marginBottom:12 },
  detail: { color:'#475569', border:'1px solid #1a2535', background:'rgba(0,0,0,0.22)', fontFamily:"'Space Mono',monospace", fontSize:11, padding:'9px 10px', marginBottom:18 },
  button: { background:'transparent', border:'1px solid #22c55e', color:'#22c55e', fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:2, padding:'10px 12px', cursor:'pointer' },
};

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error:null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.routeKey !== this.props.routeKey && this.state.error) {
      this.setState({ error:null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={errorStyles.root}>
        <div style={errorStyles.panel}>
          <div style={errorStyles.kicker}>ROUTE ERROR</div>
          <h1 style={errorStyles.title}>This lab view hit a recoverable error.</h1>
          <p style={errorStyles.copy}>{this.state.error.message || 'Unknown rendering error'}</p>
          <button onClick={() => { window.location.hash = '#/tracks'; window.location.reload(); }} style={errorStyles.button}>
            RETURN TO TRAINING PATHS
          </button>
        </div>
      </div>
    );
  }
}

const errorStyles = {
  root: { minHeight:'100vh', background:'#080d14', color:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Inter',sans-serif", padding:24 },
  panel: { maxWidth:520, background:'rgba(15,21,32,0.94)', border:'1px solid rgba(248,113,113,0.35)', padding:24 },
  kicker: { color:'#f87171', fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:3, marginBottom:10 },
  title: { fontSize:24, margin:'0 0 10px', letterSpacing:0 },
  copy: { color:'#94a3b8', fontSize:13, lineHeight:1.6, marginBottom:18 },
  button: { background:'transparent', border:'1px solid #22c55e', color:'#22c55e', fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:2, padding:'10px 12px', cursor:'pointer' },
};
