// Artifact Timeline — vendor-neutral filesystem/Prefetch/Shellbags console
// for Module 10 (Evidence handling & case reconstruction).
//
// `ArtifactTimelineShell` is a renamed, restyled reimplementation of the
// Mission Next SOC Analyst Track's `TimelineExplorerLabShell`
// (`src/shells/windows-forensics-shells.jsx:429-520`) — same three-view idea
// (filesystem timeline / Prefetch / Shellbags) and detail-on-select
// interaction, rebuilt against this port's own dataset shape rather than the
// source's `wfShellStyles`/`DataTable` machinery, per
// docs/LAB_MIGRATION_MATRIX.md's "vendor-neutral reskin" and "renamed away
// from real-product implication" requirements (no FTK Imager / Autopsy /
// Timeline Explorer branding). `ArtifactTimelineConsole` is new: a small
// state container (search, view, selection, task state, the required
// chain-of-custody note) that the source didn't need because it lived inside
// a larger legacy lab-runner page.
//
// Deliberately NOT wired to `recordLabAttempt()`, competency scoring, or
// instructor review in this pass — task completion is tracked locally only,
// same as the M3 pilot (`portal/range-tools/m03-log-explorer/`). See
// docs/LAB_MIGRATION_MATRIX.md's Epic C row before treating a Prove It pass
// here as a reviewable submission.

const styles = {
  root: { minHeight: '100vh', background: '#eef1f4', color: '#1f2933', fontFamily: '"Helvetica Neue", Arial, sans-serif', display: 'grid', gridTemplateRows: '48px auto minmax(0, 1fr)' },
  top: { display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', alignItems: 'center', gap: 18, background: '#171d21', color: '#d5dadd', padding: '0 16px', fontSize: 13, borderBottom: '1px solid #0d1114' },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  wordmark: { fontSize: 20, lineHeight: 1, color: '#ffffff', fontWeight: 600, letterSpacing: '-0.02em' },
  product: { fontSize: 12, color: '#8f9aa3', textTransform: 'uppercase', letterSpacing: '0.12em' },
  darkBack: { background: '#232b30', color: '#fff', border: '1px solid #3a4348', width: 28, height: 28, borderRadius: 2, cursor: 'pointer' },
  topMeta: { display: 'flex', alignItems: 'center', gap: 14, color: '#8f9aa3', fontSize: 12 },
  searchBar: { padding: '10px 16px', background: '#20272b', borderBottom: '1px solid #0d1114', display: 'grid', gap: 8 },
  searchMeta: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  caseChip: { background: '#ffffff', border: '1px solid #c9d0d6', color: '#2d3a43', borderRadius: 3, padding: '3px 8px', fontSize: 12, fontWeight: 600 },
  metaText: { color: '#aab4bc', fontSize: 12 },
  searchRow: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 96px', gap: 8 },
  input: { border: '1px solid #b8c2c8', borderRadius: 2, fontFamily: 'Menlo, Consolas, monospace', fontSize: 13, padding: '9px 10px', color: '#111827', background: '#fff', boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.06)' },
  run: { background: '#4c8bf5', color: '#fff', border: '1px solid #3a6fd1', borderRadius: 2, fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  helperRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  helperChip: { background: '#2b333850', border: '1px solid #45505650', borderRadius: 2, color: '#cfd6dc', fontSize: 11, padding: '4px 8px', cursor: 'pointer' },
  body: { minHeight: 0, display: 'grid', gridTemplateColumns: '210px minmax(0, 1fr) 340px' },
  nav: { padding: 14, borderRight: '1px solid #cfd6dc', background: '#fff', overflow: 'auto' },
  paneTitle: { fontSize: 12, fontWeight: 700, color: '#34424b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 },
  viewBtn: { width: '100%', display: 'flex', justifyContent: 'space-between', background: 'transparent', color: '#2f3b44', border: '1px solid #e2e7ea', borderRadius: 2, padding: '8px 9px', fontSize: 12, cursor: 'pointer', marginBottom: 6 },
  viewBtnActive: { background: '#eaf1fd', borderColor: '#a9c6f5', color: '#1f4fa8', fontWeight: 700 },
  caseBrief: { marginTop: 16, background: '#f7f8f9', border: '1px solid #e2e7ea', borderRadius: 2, padding: 10 },
  caseBriefTitle: { fontSize: 12, fontWeight: 700, color: '#1f2933', marginBottom: 4 },
  caseBriefCopy: { fontSize: 11, color: '#5e6a73', lineHeight: 1.5 },
  main: { minHeight: 0, overflow: 'auto' },
  resultsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' },
  resultsKicker: { fontSize: 11, color: '#6c7a83', textTransform: 'uppercase', marginBottom: 4 },
  tableWrap: { minHeight: 0, overflow: 'auto', border: '1px solid #cfd6dc', background: '#fff', margin: '0 14px 12px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { position: 'sticky', top: 0, background: '#f3f5f6', borderBottom: '1px solid #cfd6dc', borderRight: '1px solid #e2e7ea', color: '#4d5b64', textAlign: 'left', padding: '8px 10px', fontWeight: 700, whiteSpace: 'nowrap' },
  td: { borderBottom: '1px solid #edf1f4', borderRight: '1px solid #f0f3f5', color: '#1f2933', padding: '7px 10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Menlo, Consolas, monospace', cursor: 'pointer' },
  tr: { background: '#fff' },
  trAlt: { background: '#fbfcfc' },
  trActive: { background: '#eaf1fd' },
  empty: { padding: 18, color: '#697780', fontSize: 12 },
  detail: { margin: '0 14px 14px', border: '1px solid #cfd6dc', background: '#fff', padding: 12 },
  detailTitle: { fontSize: 11, fontWeight: 700, color: '#6c7a83', textTransform: 'uppercase', marginBottom: 8 },
  detailBody: { fontFamily: 'Menlo, Consolas, monospace', fontSize: 12, color: '#1f2933', whiteSpace: 'pre-wrap', lineHeight: 1.6 },
  taskRail: { background: '#f7f8f9', borderLeft: '1px solid #cfd6dc', padding: 14, overflow: 'auto', display: 'grid', alignContent: 'start', gap: 12 },
  task: { background: '#fff', border: '1px solid #cfd6dc', padding: 12, display: 'grid', gap: 6 },
  taskDone: { background: '#f1fbf3', border: '1px solid #b7e3bf' },
  taskTitle: { fontSize: 13, fontWeight: 700, color: '#1f2933' },
  taskDesc: { fontSize: 12, color: '#55636c', lineHeight: 1.5 },
  taskHint: { fontSize: 11, color: '#6c7a83', fontStyle: 'italic' },
  custodyBlock: { background: '#fff', border: '1px solid #cfd6dc', padding: 12, display: 'grid', gap: 6 },
  custodyLabel: { fontSize: 13, fontWeight: 700, color: '#1f2933' },
  custodyHelp: { fontSize: 11, color: '#6c7a83' },
  textarea: { border: '1px solid #b8c2c8', borderRadius: 2, fontSize: 12, fontFamily: 'inherit', padding: 8, color: '#1f2933', resize: 'vertical', minHeight: 96 },
  custodyCount: { fontSize: 11, color: '#8a97a0', textAlign: 'right' },
};

const VIEWS = [
  { id: 'timeline', label: 'Filesystem timeline', columns: ['path', 'created', 'modified', 'entryNumber', 'size', 'zone'], headers: ['Path', 'Created', 'Modified', 'Entry #', 'Size', 'Zone'] },
  { id: 'prefetch', label: 'Prefetch', columns: ['executable', 'lastRun', 'runCount', 'path'], headers: ['Executable', 'Last run', 'Run count', 'Path'] },
  { id: 'shellbags', label: 'Shellbags', columns: ['path', 'lastAccessed', 'user'], headers: ['Path', 'Last accessed', 'User'] },
];

function rowsForView(mod, viewId) {
  if (viewId === 'prefetch') return mod.prefetch;
  if (viewId === 'shellbags') return mod.shellbags;
  return mod.timeline;
}

function filterRows(rows, term) {
  const needle = term.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(needle)));
}

function ArtifactTimelineShell(props) {
  const {
    mod, mode, onBack, searchTerm, setSearchTerm, activeView, setActiveView,
    selectedId, setSelectedId, tasks, taskState, custodyNote, setCustodyNote, inputRef,
  } = props;

  const view = VIEWS.find((item) => item.id === activeView) || VIEWS[0];
  const rows = filterRows(rowsForView(mod, activeView), searchTerm);
  const selectedRow = rows.find((row) => row.id === selectedId) || null;
  const helperChips = ['export', 'staging', 'archive'];

  return (
    <div style={styles.root}>
      <header style={styles.top}>
        <div style={styles.brand}>
          <button onClick={onBack} style={styles.darkBack} aria-label="Back to module">‹</button>
          <div style={styles.wordmark}>Artifact Timeline</div>
          <span style={styles.product}>{mode === 'prove' ? 'assessment lab' : 'guided lab'}</span>
        </div>
        <nav />
        <div style={styles.topMeta}>
          <span>Module 10 · Mission Next</span>
        </div>
      </header>
      <section style={styles.searchBar}>
        <div style={styles.searchMeta}>
          <span style={styles.caseChip}>{mod.caseId}</span>
          <span style={styles.metaText}>{mod.title}</span>
          <span style={styles.metaText}>{mod.subtitle}</span>
        </div>
        <div style={styles.searchRow}>
          <input
            ref={inputRef}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            style={styles.input}
            placeholder="Search the current view (path, executable, user…)"
          />
          <button onClick={() => setSearchTerm('')} style={styles.run}>Clear</button>
        </div>
        <div style={styles.helperRow}>
          {helperChips.map((item) => (
            <button key={item} onClick={() => setSearchTerm(item)} style={styles.helperChip}>{item}</button>
          ))}
        </div>
      </section>
      <div style={styles.body}>
        <aside style={styles.nav}>
          <div style={styles.paneTitle}>Views</div>
          {VIEWS.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveView(item.id); setSelectedId(''); }}
              style={activeView === item.id ? { ...styles.viewBtn, ...styles.viewBtnActive } : styles.viewBtn}
            >
              <span>{item.label}</span>
              <span>{rowsForView(mod, item.id).length}</span>
            </button>
          ))}
          <div style={styles.caseBrief}>
            <div style={styles.caseBriefTitle}>Case brief</div>
            <p style={styles.caseBriefCopy}>{mod.description}</p>
          </div>
        </aside>
        <main style={styles.main}>
          <div style={styles.resultsHeader}>
            <div>
              <div style={styles.resultsKicker}>{view.label}</div>
              <strong>{rows.length} record{rows.length === 1 ? '' : 's'}</strong>
            </div>
          </div>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {view.headers.map((header) => <th key={header} style={styles.th}>{header}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id} style={index % 2 === 0 ? styles.tr : styles.trAlt}>
                    {view.columns.map((col, colIndex) => (
                      <td
                        key={col}
                        style={{ ...styles.td, ...(selectedId === row.id ? styles.trActive : null) }}
                        onClick={() => setSelectedId(selectedId === row.id ? '' : row.id)}
                      >
                        {colIndex === 0 && selectedId === row.id ? '▸ ' : ''}{String(row[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && <div style={styles.empty}>No records match the current search in this view.</div>}
          </div>
          {selectedRow && (
            <div style={styles.detail}>
              <div style={styles.detailTitle}>Selected {view.label.toLowerCase()} record</div>
              <div style={styles.detailBody}>{view.columns.map((col) => `${col}: ${selectedRow[col]}`).join('\n')}</div>
            </div>
          )}
        </main>
        <div style={styles.taskRail}>
          <div style={styles.paneTitle}>{mode === 'prove' ? 'Prove It objectives' : 'Guided objectives'}</div>
          {tasks.map((task) => {
            const done = taskState[task.id];
            return (
              <div key={task.id} style={done ? { ...styles.task, ...styles.taskDone } : styles.task}>
                <div style={styles.taskTitle}>{done ? '✓ ' : ''}{task.title} <span style={{ fontWeight: 400, color: '#6c7a83' }}>· {task.points} pts</span></div>
                <div style={styles.taskDesc}>{task.description}</div>
                {mode !== 'prove' && <div style={styles.taskHint}>Hint: {task.hint}</div>}
              </div>
            );
          })}
          <div style={styles.custodyBlock}>
            <label style={styles.custodyLabel} htmlFor="m10-custody-note">Chain of custody / what this evidence proves</label>
            <p style={styles.custodyHelp}>At least 150 characters. Name the case ID, the artifact sources you relied on, and one limitation.</p>
            <textarea
              id="m10-custody-note"
              value={custodyNote}
              onChange={(event) => setCustodyNote(event.target.value)}
              style={styles.textarea}
              maxLength={1200}
              placeholder="This timeline, Prefetch, and Shellbags evidence for INC-5188 shows…"
            />
            <div style={styles.custodyCount}>{custodyNote.length}/1200</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArtifactTimelineConsole({ mode }) {
  const mod = window.M10_ARTIFACT_TIMELINE_DATASET;
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeView, setActiveView] = React.useState('timeline');
  const [selectedId, setSelectedId] = React.useState('');
  const [selectedPrefetch, setSelectedPrefetch] = React.useState('');
  const [selectedShellbag, setSelectedShellbag] = React.useState('');
  const [custodyNote, setCustodyNote] = React.useState('');
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (activeView === 'prefetch' && selectedId) setSelectedPrefetch(selectedId);
    if (activeView === 'shellbags' && selectedId) setSelectedShellbag(selectedId);
  }, [activeView, selectedId]);

  const taskCheckState = { timeline: mod.timeline, searchTerm, selectedPrefetch, selectedShellbag, custodyNote };
  const taskState = {};
  mod.tasks.forEach((task) => { taskState[task.id] = task.validate(taskCheckState); });
  const solvedCount = Object.values(taskState).filter(Boolean).length;

  React.useEffect(() => {
    if (solvedCount === mod.tasks.length && mod.tasks.length > 0) {
      window.opener?.postMessage({ type: 'm10-artifact-timeline-complete', mode, solvedCount, total: mod.tasks.length }, location.origin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solvedCount]);

  return (
    <ArtifactTimelineShell
      mod={mod}
      mode={mode}
      onBack={() => window.close()}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      activeView={activeView}
      setActiveView={setActiveView}
      selectedId={selectedId}
      setSelectedId={setSelectedId}
      tasks={mod.tasks}
      taskState={taskState}
      custodyNote={custodyNote}
      setCustodyNote={setCustodyNote}
      inputRef={inputRef}
    />
  );
}

window.ArtifactTimelineConsole = ArtifactTimelineConsole;
