// ============================================================
//  Windows Forensics Project Page
// ============================================================

function WindowsForensicsPage({ user, onBack, onLogout, activeProjectId, onSelectProject, onOpenProject }) {
  const projects = window.WINDOWS_FORENSICS_LABS || WINDOWS_FORENSICS_PROJECTS;
  const [selectedId, setSelectedId] = React.useState(activeProjectId || projects[0].id);
  const [activeTool, setActiveTool] = React.useState(null);
  const selectedProject = projects.find(project => project.id === selectedId) || projects[0];
  const toolset = WINDOWS_TOOL_SIMULATIONS[selectedProject.id] || [];
  const selectedTool = toolset.find(tool => tool.id === activeTool) || toolset[0];

  React.useEffect(() => {
    if (activeProjectId) setSelectedId(activeProjectId);
  }, [activeProjectId]);

  React.useEffect(() => {
    setActiveTool((WINDOWS_TOOL_SIMULATIONS[selectedProject.id] || [])[0]?.id || null);
  }, [selectedProject.id]);

  function selectProject(projectId) {
    setSelectedId(projectId);
    onSelectProject?.(projectId);
  }

  return (
    <div style={wfStyles.desktop}>
      <div style={wfStyles.wallpaper}>
        <div style={wfStyles.desktopShortcuts}>
          {projects.map((project, index) => (
            <button
              key={project.id}
              onClick={() => selectProject(project.id)}
              style={{
                ...wfStyles.shortcut,
                outline: selectedProject.id === project.id ? '1px solid rgba(255,255,255,0.45)' : '1px solid transparent',
                background: selectedProject.id === project.id ? 'rgba(255,255,255,0.12)' : 'transparent',
              }}
            >
              <span style={wfStyles.shortcutIcon}>{shortcutIcon(project.focus)}</span>
              <span style={wfStyles.shortcutText}>Project {index + 1}</span>
            </button>
          ))}
        </div>

        <main data-reveal data-card style={wfStyles.window}>
          <div style={wfStyles.titleBar}>
            <div style={wfStyles.titleLeft}>
              <span style={wfStyles.appIcon}>EVTX</span>
              <span style={wfStyles.windowTitle}>Windows Forensics Workbench</span>
            </div>
            <div style={wfStyles.windowControls}>
              <span style={wfStyles.control}>-</span>
              <span style={wfStyles.control}>□</span>
              <span style={wfStyles.closeControl}>x</span>
            </div>
          </div>

          <div style={wfStyles.commandBar}>
            <button onClick={onBack} style={wfStyles.commandBtn}>‹ Training Paths</button>
            <a
              href="https://github.com/0xrajneesh/Windows-Forensics-Projects-for-Beginners"
              target="_blank"
              rel="noreferrer"
              style={wfStyles.commandLink}
            >
              Source Repo
            </a>
            <span style={wfStyles.pathText}>C:\Cases\Mission Next\Windows_Forensics</span>
          </div>

          <div data-wf-workspace style={wfStyles.workspace}>
            <aside style={wfStyles.sidePane}>
              <div style={wfStyles.sideTitle}>Quick Access</div>
                    {projects.map((project, index) => (
                <button
                  key={project.id}
                  onClick={() => selectProject(project.id)}
                  style={{
                    ...wfStyles.navItem,
                    background: selectedProject.id === project.id ? '#cce8ff' : 'transparent',
                    color: selectedProject.id === project.id ? '#111827' : '#374151',
                  }}
                >
                  <span style={wfStyles.navIcon}>{shortcutIcon(project.focus)}</span>
                  <span>{String(index + 1).padStart(2, '0')} {project.focus}</span>
                </button>
              ))}
            </aside>

            <section style={wfStyles.contentPane}>
              <div style={wfStyles.breadcrumb}>This PC &gt; Cases &gt; Windows Forensics &gt; {selectedProject.focus}</div>

              <div style={wfStyles.caseHeader}>
                <div>
                  <div style={wfStyles.caseLabel}>ACTIVE CASE FILE</div>
                  <h1 style={wfStyles.caseTitle}>{selectedProject.title}</h1>
                </div>
                <div style={wfStyles.caseBadge}>{selectedProject.difficulty}</div>
              </div>

              <div style={wfStyles.caseGrid}>
                <section data-card style={wfStyles.viewerPane}>
                  <div style={wfStyles.paneHeader}>
                    <span>Evidence Preview</span>
                    <span>{selectedProject.estimatedTime}</span>
                  </div>
                  <div style={wfStyles.evidenceBody}>
                    <div style={wfStyles.evidenceRow}>
                      <span style={wfStyles.rowName}>Investigation objective</span>
                      <span style={wfStyles.rowValue}>{selectedProject.summary}</span>
                    </div>
                    <div style={wfStyles.evidenceRow}>
                      <span style={wfStyles.rowName}>Primary artifact</span>
                      <span style={wfStyles.rowValue}>{selectedProject.focus}</span>
                    </div>
                    <div style={wfStyles.evidenceRow}>
                      <span style={wfStyles.rowName}>Case status</span>
                      <span style={wfStyles.rowValue}>Ready for analyst review</span>
                    </div>
                  </div>
                </section>

                <section data-card style={wfStyles.toolsPane}>
                  <div style={wfStyles.paneHeader}>
                    <span>Simulated Analyst Tools</span>
                    <span>{toolset.length} tools</span>
                  </div>
                  <div style={wfStyles.toolList}>
                    {toolset.map(tool => (
                      <button
                        key={tool.id}
                        onClick={() => setActiveTool(tool.id)}
                        style={{
                          ...wfStyles.toolButton,
                          background: selectedTool?.id === tool.id ? '#dbeafe' : '#fff',
                          borderColor: selectedTool?.id === tool.id ? '#2563eb' : '#d1d5db',
                        }}
                      >
                        {tool.name}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => onOpenProject(selectedProject.lab)}
                    style={wfStyles.startLabBtn}
                    disabled={!selectedProject.lab}
                  >
                    Start Local Lab
                  </button>
                  <a href={selectedProject.url} target="_blank" rel="noreferrer" style={wfStyles.openProject}>
                    Source Brief
                  </a>
                </section>
              </div>

              {selectedTool && (
                <section style={wfStyles.simPane}>
                  <div style={wfStyles.paneHeader}>
                    <span>{selectedTool.name}</span>
                    <span>dummy output</span>
                  </div>
                  <div style={wfStyles.simBody}>
                    <div style={wfStyles.simSummary}>{selectedTool.summary}</div>
                    <table style={wfStyles.simTable}>
                      <thead>
                        <tr>
                          {selectedTool.columns.map(col => <th key={col} style={wfStyles.simTh}>{col}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTool.rows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {selectedTool.columns.map(col => (
                              <td key={col} style={wfStyles.simTd}>{row[col]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              <section data-card style={wfStyles.timelinePane}>
                <div style={wfStyles.paneHeader}>
                  <span>Case Notes</span>
                  <span>local worksheet</span>
                </div>
                <textarea
                  style={wfStyles.notes}
                  placeholder="Record indicators, artifact paths, timestamps, and conclusions as you work the project."
                  spellCheck={false}
                />
              </section>
            </section>
          </div>
        </main>
      </div>

      <footer style={wfStyles.taskbar}>
        <button onClick={onBack} style={wfStyles.startBtn}>⊞</button>
        <div style={wfStyles.taskItem}>Windows Forensics Workbench</div>
        <div style={wfStyles.taskSpacer} />
        <span style={wfStyles.userText}>{user.displayName}</span>
        <button onClick={onLogout} style={wfStyles.logoutBtn}>LOGOUT</button>
      </footer>
    </div>
  );
}

function shortcutIcon(focus) {
  if (focus === 'Event Logs') return 'EV';
  if (focus === 'Registry') return 'REG';
  if (focus === 'File System') return 'FS';
  if (focus === 'Browser Artifacts') return 'WEB';
  return 'DEL';
}

const WINDOWS_TOOL_SIMULATIONS = {
  'wf-1': [
    {
      id:'event-viewer', name:'Event Viewer', summary:'Security log view filtered for authentication and privilege activity.',
      columns:['TimeCreated','EventID','Account','Source','Result'],
      rows:[
        { TimeCreated:'2024-02-10 09:14:22', EventID:'4625', Account:'svc_backup', Source:'10.20.4.88', Result:'Failed logon' },
        { TimeCreated:'2024-02-10 09:16:03', EventID:'4625', Account:'administrator', Source:'10.20.4.88', Result:'Failed logon' },
        { TimeCreated:'2024-02-10 09:18:44', EventID:'4624', Account:'administrator', Source:'10.20.4.88', Result:'Successful logon' },
        { TimeCreated:'2024-02-10 09:19:01', EventID:'4672', Account:'administrator', Source:'WIN-DC01', Result:'Special privileges assigned' },
      ],
    },
    {
      id:'powershell', name:'PowerShell', summary:'Common analyst commands used to scope Windows event evidence.',
      columns:['Command','Purpose','Finding'],
      rows:[
        { Command:'Get-WinEvent -FilterHashtable @{LogName="Security"; Id=4625}', Purpose:'Failed logons', Finding:'Burst from 10.20.4.88' },
        { Command:'Get-WinEvent -FilterHashtable @{LogName="Security"; Id=4672}', Purpose:'Privileged logons', Finding:'Administrator received privileges' },
      ],
    },
  ],
  'wf-2': [
    {
      id:'registry-explorer', name:'Registry Explorer', summary:'Offline registry hives loaded into an artifact viewer.',
      columns:['Hive','Key','Value','Data'],
      rows:[
        { Hive:'NTUSER.DAT', Key:'Software\\Microsoft\\Windows\\CurrentVersion\\Run', Value:'Updater', Data:'C:\\Users\\Public\\updater.exe' },
        { Hive:'SYSTEM', Key:'ControlSet001\\Services\\WinHelper', Value:'Start', Data:'2' },
        { Hive:'SOFTWARE', Key:'Microsoft\\Windows\\CurrentVersion\\Uninstall', Value:'InstallDate', Data:'20240210' },
      ],
    },
    {
      id:'autoruns', name:'Autoruns', summary:'Startup locations reduced to suspicious persistence candidates.',
      columns:['Entry','Publisher','Image Path','Status'],
      rows:[
        { Entry:'Updater', Publisher:'Unsigned', 'Image Path':'C:\\Users\\Public\\updater.exe', Status:'Review' },
        { Entry:'OneDrive', Publisher:'Microsoft', 'Image Path':'C:\\Program Files\\Microsoft OneDrive\\OneDrive.exe', Status:'Expected' },
      ],
    },
  ],
  'wf-3': [
    {
      id:'timeline-explorer', name:'Timeline Explorer', summary:'File-system timeline around the suspected compromise window.',
      columns:['Timestamp','Path','Action','User'],
      rows:[
        { Timestamp:'2024-02-11 08:43:01', Path:'C:\\Users\\analyst\\Downloads\\invoice.zip', Action:'Created', User:'analyst' },
        { Timestamp:'2024-02-11 08:44:22', Path:'C:\\Users\\Public\\updater.exe', Action:'Created', User:'analyst' },
        { Timestamp:'2024-02-11 08:45:09', Path:'C:\\ProgramData\\cache.dat', Action:'Modified', User:'SYSTEM' },
      ],
    },
    {
      id:'mft-viewer', name:'MFT Viewer', summary:'NTFS metadata view for created, modified, and deleted artifacts.',
      columns:['Record','Filename','Created','Flags'],
      rows:[
        { Record:'84211', Filename:'updater.exe', Created:'2024-02-11 08:44:22', Flags:'Archive' },
        { Record:'84219', Filename:'notes.tmp', Created:'2024-02-11 08:46:05', Flags:'Deleted' },
      ],
    },
  ],
  'wf-4': [
    {
      id:'browser-history', name:'Browser History Viewer', summary:'Browser history and downloads extracted from a user profile.',
      columns:['Time','Artifact','URL','Result'],
      rows:[
        { Time:'2024-02-12 10:12:31', Artifact:'History', URL:'hxxps://fileshare.example/invoice', Result:'Visited' },
        { Time:'2024-02-12 10:13:08', Artifact:'Download', URL:'invoice.zip', Result:'Saved to Downloads' },
        { Time:'2024-02-12 10:19:44', Artifact:'History', URL:'hxxps://paste.example/raw/loader', Result:'Visited' },
      ],
    },
    {
      id:'cache-viewer', name:'Cache Viewer', summary:'Cached browser objects that support user activity reconstruction.',
      columns:['Cache Key','Content Type','Size','Note'],
      rows:[
        { 'Cache Key':'invoice.zip', 'Content Type':'application/zip', Size:'184 KB', Note:'Downloaded archive' },
        { 'Cache Key':'loader.txt', 'Content Type':'text/plain', Size:'3 KB', Note:'Script-like content' },
      ],
    },
  ],
  'wf-5': [
    {
      id:'recovery-console', name:'File Recovery', summary:'Deleted-file recovery queue with analyst-friendly confidence values.',
      columns:['Filename','Original Path','Recovered','Confidence'],
      rows:[
        { Filename:'customer_export.csv', 'Original Path':'C:\\Users\\analyst\\Desktop', Recovered:'Yes', Confidence:'High' },
        { Filename:'notes.tmp', 'Original Path':'C:\\Users\\analyst\\AppData\\Local\\Temp', Recovered:'Partial', Confidence:'Medium' },
      ],
    },
    {
      id:'hash-checker', name:'Hash Checker', summary:'Hash verification of recovered files using dummy values.',
      columns:['Filename','SHA256','Disposition','Note'],
      rows:[
        { Filename:'customer_export.csv', SHA256:'5f2d...b91a', Disposition:'Evidence', Note:'Sensitive data export' },
        { Filename:'notes.tmp', SHA256:'a021...4caa', Disposition:'Supporting', Note:'Partial temp artifact' },
      ],
    },
  ],
};

const wfStyles = {
  desktop: { minHeight:'100vh', background:'#0b1f35', color:'#111827', fontFamily:"'Inter',sans-serif", overflow:'auto' },
  wallpaper: {
    minHeight:'calc(100vh - 44px)', position:'relative', padding:'clamp(1rem, 3vw, 1.4rem) clamp(1rem, 3vw, 1.5rem) clamp(1rem, 3vw, 1.25rem) clamp(6rem, 12vw, 7rem)',
    background:'linear-gradient(135deg,#0b2d4f 0%,#1266a3 48%,#0a2440 100%)',
  },
  desktopShortcuts: { position:'absolute', left:12, top:18, width:82, display:'flex', flexDirection:'column', gap:12 },
  shortcut: { border:'none', color:'#fff', padding:'6px 4px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:5, minHeight:72 },
  shortcutIcon: {
    width:38, height:32, background:'#f8fafc', color:'#2563eb', border:'1px solid #bfdbfe',
    display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700,
    boxShadow:'0 8px 18px rgba(0,0,0,0.18)',
  },
  shortcutText: { color:'#fff', textShadow:'0 1px 2px rgba(0,0,0,0.7)', fontSize:11, textAlign:'center', lineHeight:1.2 },
  window: { minHeight:'min(760px, calc(100vh - 88px))', background:'#f3f4f6', border:'1px solid rgba(255,255,255,0.55)', boxShadow:'0 24px 70px rgba(0,0,0,0.35)', display:'flex', flexDirection:'column', minWidth:0 },
  titleBar: { height:34, background:'#ffffff', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #d1d5db', flexShrink:0 },
  titleLeft: { display:'flex', alignItems:'center', gap:8, paddingLeft:10 },
  appIcon: { width:26, height:20, background:'#2563eb', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700 },
  windowTitle: { fontSize:12, color:'#111827' },
  windowControls: { display:'flex', alignItems:'stretch', height:'100%' },
  control: { width:46, display:'flex', alignItems:'center', justifyContent:'center', color:'#374151', fontSize:13 },
  closeControl: { width:46, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', background:'#dc2626', fontSize:15 },
  commandBar: { minHeight:44, background:'#f9fafb', borderBottom:'1px solid #d1d5db', display:'flex', alignItems:'center', gap:10, padding:'0.35rem 12px', flexShrink:0, flexWrap:'wrap' },
  commandBtn: { background:'#fff', border:'1px solid #d1d5db', color:'#111827', fontSize:12, padding:'6px 10px', cursor:'pointer' },
  commandLink: { background:'#fff', border:'1px solid #d1d5db', color:'#1d4ed8', textDecoration:'none', fontSize:12, padding:'6px 10px' },
  pathText: { color:'#6b7280', fontSize:12, border:'1px solid #d1d5db', background:'#fff', padding:'6px 10px', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  workspace: { flex:1, minHeight:0, display:'grid', gridTemplateColumns:'minmax(12rem, 14.5rem) minmax(0,1fr)' },
  sidePane: { minWidth:0, background:'#f9fafb', borderRight:'1px solid #d1d5db', padding:'14px 10px', overflow:'auto' },
  sideTitle: { fontSize:11, color:'#6b7280', margin:'0 8px 10px', fontWeight:600 },
  navItem: { width:'100%', border:'none', padding:'8px', display:'flex', alignItems:'center', gap:9, textAlign:'left', fontSize:12, cursor:'pointer' },
  navIcon: { width:28, height:24, background:'#e0f2fe', color:'#0369a1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, flexShrink:0 },
  contentPane: { flex:1, minWidth:0, padding:'16px', overflow:'auto', background:'#fff' },
  breadcrumb: { fontSize:12, color:'#6b7280', marginBottom:16 },
  caseHeader: { display:'flex', justifyContent:'space-between', gap:20, alignItems:'flex-start', marginBottom:16 },
  caseLabel: { fontSize:10, color:'#2563eb', letterSpacing:1.8, fontWeight:700, marginBottom:6 },
  caseTitle: { fontSize:24, lineHeight:1.18, margin:0, letterSpacing:0, color:'#111827' },
  caseBadge: { color:'#065f46', background:'#d1fae5', border:'1px solid #a7f3d0', padding:'6px 10px', fontSize:12, flexShrink:0 },
  caseGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%, 17rem),1fr))', gap:14, marginBottom:14 },
  viewerPane: { border:'1px solid #d1d5db', background:'#fff' },
  toolsPane: { border:'1px solid #d1d5db', background:'#fff', display:'flex', flexDirection:'column' },
  paneHeader: { height:34, background:'#f3f4f6', borderBottom:'1px solid #d1d5db', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 10px', color:'#374151', fontSize:12, fontWeight:600 },
  evidenceBody: { padding:'10px' },
  evidenceRow: { display:'grid', gridTemplateColumns:'150px minmax(0,1fr)', gap:12, borderBottom:'1px solid #e5e7eb', padding:'11px 0' },
  rowName: { color:'#6b7280', fontSize:12 },
  rowValue: { color:'#111827', fontSize:13, lineHeight:1.5 },
  toolList: { padding:'12px', display:'flex', flexDirection:'column', gap:9 },
  toolButton: { textAlign:'left', color:'#111827', fontSize:12, padding:'8px 10px', border:'1px solid', cursor:'pointer' },
  startLabBtn: { margin:'auto 12px 8px', border:'1px solid #065f46', background:'#047857', color:'#fff', padding:'10px 12px', fontSize:12, cursor:'pointer' },
  openProject: { margin:'0 12px 12px', textAlign:'center', textDecoration:'none', background:'#2563eb', color:'#fff', padding:'10px 12px', fontSize:12 },
  simPane: { border:'1px solid #d1d5db', background:'#fff', marginBottom:14 },
  simBody: { padding:12, overflow:'auto' },
  simSummary: { color:'#4b5563', fontSize:12, lineHeight:1.5, marginBottom:10 },
  simTable: { width:'100%', borderCollapse:'collapse', fontSize:12 },
  simTh: { textAlign:'left', background:'#f3f4f6', color:'#374151', border:'1px solid #d1d5db', padding:'7px 8px', fontWeight:600 },
  simTd: { color:'#111827', border:'1px solid #e5e7eb', padding:'7px 8px', verticalAlign:'top' },
  timelinePane: { border:'1px solid #d1d5db', background:'#fff' },
  notes: { width:'100%', minHeight:118, border:'none', outline:'none', resize:'vertical', padding:'12px', color:'#111827', fontSize:13, lineHeight:1.5, fontFamily:"'Inter',sans-serif" },
  taskbar: { height:44, background:'rgba(17,24,39,0.96)', color:'#fff', display:'flex', alignItems:'center', gap:8, padding:'0 10px' },
  startBtn: { width:36, height:32, border:'none', background:'#1f2937', color:'#fff', fontSize:18, cursor:'pointer' },
  taskItem: { height:32, display:'flex', alignItems:'center', padding:'0 12px', background:'#374151', fontSize:12 },
  taskSpacer: { flex:1 },
  userText: { color:'#d1d5db', fontSize:12 },
  logoutBtn: { background:'transparent', border:'1px solid #4b5563', color:'#d1d5db', fontSize:10, letterSpacing:1, padding:'6px 10px', cursor:'pointer' },
};

Object.assign(window, { WindowsForensicsPage });
