// Log Explorer — vendor-neutral SIEM correlation workspace for Module 3.
//
// The presentational shell (`LogExplorerShell`) is a close, renamed port of
// the Mission Next SOC Analyst Track's `SplunkLabShell`
// (`src/lab-shells.jsx:461-659`), stripped of its Splunk branding, per
// docs/LAB_MIGRATION_MATRIX.md's "prefer one shared engine, vendor-neutral"
// rule. `LogExplorerConsole` is new: a small state container that wasn't
// needed in the source (there it lived inside a larger legacy page) —
// it owns the query text, calls the ported `executeQuery()`, and derives
// the timeline/fields/task state the shell renders.
//
// Deliberately NOT wired to `recordLabAttempt()`, competency scoring, or
// instructor review in this pass — task completion is tracked locally only.
// See docs/LAB_MIGRATION_MATRIX.md's Epic C row before treating this as a
// reviewable Prove It.

const styles = {
  root: { minHeight: '100vh', background: '#e8ebee', color: '#1f2933', fontFamily: '"Helvetica Neue", Arial, sans-serif', display: 'grid', gridTemplateRows: '48px auto 40px minmax(0, 1fr)' },
  top: { display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', alignItems: 'center', gap: 18, background: '#171d21', color: '#d5dadd', padding: '0 16px', fontSize: 13, borderBottom: '1px solid #0d1114' },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  wordmark: { fontSize: 20, lineHeight: 1, color: '#ffffff', fontWeight: 600, letterSpacing: '-0.02em' },
  product: { fontSize: 12, color: '#8f9aa3', textTransform: 'uppercase', letterSpacing: '0.12em' },
  nav: { display: 'flex', alignItems: 'center', gap: 18, color: '#b3bcc3', whiteSpace: 'nowrap' },
  navActive: { color: '#ffffff', fontWeight: 600 },
  topMeta: { display: 'flex', alignItems: 'center', gap: 14, color: '#8f9aa3', fontSize: 12 },
  darkBack: { background: '#232b30', color: '#fff', border: '1px solid #3a4348', width: 28, height: 28, borderRadius: 2, cursor: 'pointer' },
  searchBar: { padding: '10px 16px', background: '#20272b', borderBottom: '1px solid #0d1114', display: 'grid', gap: 8 },
  searchMeta: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  dataset: { background: '#ffffff', border: '1px solid #c9d0d6', color: '#2d3a43', borderRadius: 3, padding: '3px 8px', fontSize: 12, fontWeight: 600 },
  metaText: { color: '#aab4bc', fontSize: 12 },
  searchRow: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 160px 96px', gap: 8 },
  input: { border: '1px solid #b8c2c8', borderRadius: 2, fontFamily: 'Menlo, Consolas, monospace', fontSize: 14, padding: '9px 10px', color: '#111827', background: '#fff', boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.06)' },
  select: { border: '1px solid #b8c2c8', borderRadius: 2, background: '#fff', color: '#1f2933', fontSize: 12, padding: '0 8px' },
  run: { background: '#4c8bf5', color: '#fff', border: '1px solid #3a6fd1', borderRadius: 2, fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  helperRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  helperChip: { background: '#2b333850', border: '1px solid #45505650', borderRadius: 2, color: '#cfd6dc', fontSize: 11, padding: '4px 8px', cursor: 'pointer' },
  subnav: { display: 'flex', alignItems: 'center', gap: 18, padding: '0 16px', background: '#ffffff', borderBottom: '1px solid #cfd6dc', fontSize: 12, color: '#60707a' },
  subnavActive: { color: '#111827', fontWeight: 700, borderBottom: '2px solid #4c8bf5', alignSelf: 'stretch', display: 'inline-flex', alignItems: 'center' },
  body: { minHeight: 0, display: 'grid', gridTemplateColumns: '250px minmax(0, 1fr) 360px' },
  paneTitle: { fontSize: 12, fontWeight: 700, color: '#34424b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 },
  paneSection: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, color: '#6c7a83', textTransform: 'uppercase', marginBottom: 6 },
  fieldBtn: { width: '100%', display: 'flex', justifyContent: 'space-between', background: 'transparent', color: '#2f3b44', border: '1px solid transparent', borderBottom: '1px solid #e2e7ea', borderRadius: 0, padding: '7px 2px', fontSize: 12, cursor: 'pointer' },
  fieldStatic: { display: 'flex', justifyContent: 'space-between', color: '#5e6a73', borderBottom: '1px solid #e2e7ea', padding: '7px 2px', fontSize: 12 },
  resultsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' },
  resultsKicker: { fontSize: 11, color: '#6c7a83', textTransform: 'uppercase', marginBottom: 4 },
  statusPills: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  statusPill: { background: '#f3f5f6', border: '1px solid #d8dee3', color: '#56636c', borderRadius: 12, padding: '3px 8px', fontSize: 11 },
  resultTabs: { display: 'flex', gap: 2, alignItems: 'end', padding: '0 14px' },
  tab: { background: '#e2e7ea', border: '1px solid #c6d0d6', borderBottom: 'none', color: '#55636c', padding: '7px 10px', fontSize: 12, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  tabActive: { background: '#ffffff', border: '1px solid #c6d0d6', borderBottom: 'none', color: '#1f2933', padding: '7px 10px', fontSize: 12, fontWeight: 700, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  timelineWrap: { margin: '0 14px', border: '1px solid #e0e6ea', background: '#fff' },
  timelineHead: { display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderBottom: '1px solid #e0e6ea', fontSize: 12, color: '#5f6c75' },
  timeline: { display: 'flex', alignItems: 'end', gap: 4, padding: '10px', minHeight: 86 },
  timelineBarWrap: { flex: 1, minWidth: 6, display: 'flex', alignItems: 'end' },
  bar: { width: '100%', background: 'linear-gradient(180deg, #6fa1f5 0%, #3a6fd1 100%)', minWidth: 3, borderRadius: '1px 1px 0 0' },
  tableWrap: { minHeight: 0, overflow: 'auto', border: '1px solid #cfd6dc', background: '#fff', margin: '10px 14px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12, tableLayout: 'fixed' },
  th: { position: 'sticky', top: 0, background: '#f3f5f6', borderBottom: '1px solid #cfd6dc', borderRight: '1px solid #e2e7ea', color: '#4d5b64', textAlign: 'left', padding: '8px 10px', fontWeight: 700, whiteSpace: 'nowrap' },
  td: { borderBottom: '1px solid #edf1f4', borderRight: '1px solid #f0f3f5', color: '#1f2933', padding: '7px 10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Menlo, Consolas, monospace' },
  tr: { background: '#fff' },
  trAlt: { background: '#fbfcfc' },
  empty: { padding: 18, color: '#697780', fontSize: 12 },
  taskRail: { background: '#f7f8f9', borderLeft: '1px solid #cfd6dc', padding: 14, overflow: 'auto', display: 'grid', alignContent: 'start', gap: 12 },
  brief: { background: '#fff', border: '1px solid #cfd6dc', padding: 12 },
  briefTitle: { fontSize: 16, fontWeight: 700, color: '#1f2933', marginBottom: 6 },
  briefCopy: { fontSize: 13, color: '#55636c', lineHeight: 1.55 },
  task: { background: '#fff', border: '1px solid #cfd6dc', padding: 12, display: 'grid', gap: 6 },
  taskDone: { background: '#f1fbf3', border: '1px solid #b7e3bf' },
  taskTitle: { fontSize: 13, fontWeight: 700, color: '#1f2933' },
  taskDesc: { fontSize: 12, color: '#55636c', lineHeight: 1.5 },
  taskHint: { fontSize: 11, color: '#6c7a83', fontStyle: 'italic' },
  error: { color: '#c53030' },
};

function LogExplorerShell(props) {
  const { mod, mode, onBack, query, setQuery, runQuery, running, displayRows, columns, results, timeline, maxCount, tasks, taskState, inputRef } = props;
  const fields = mod.fields.map(name => ({ name, count: new Set(displayRows.map(row => row[name]).filter(Boolean)).size })).filter(field => field.count);
  const selectedFields = fields.slice(0, 8);
  const defaultFields = ['id', 'timestamp', 'source'].filter(f => mod.fields.includes(f)).map(name => ({ name, count: displayRows.length || mod.logs.length }));
  const queryHelpers = ['search account=acct-428', 'search source_ip=198.51.100.24 | sort by timestamp', 'search account=acct-428 | count by source'];
  const visibleRows = displayRows.slice(0, 80);
  const timeRangeLabel = timeline.length > 0 ? `${timeline[0][0]} to ${timeline[timeline.length - 1][0]}` : 'All time';

  return (
    <div style={styles.root}>
      <header style={styles.top}>
        <div style={styles.brand}>
          <button onClick={onBack} style={styles.darkBack} aria-label="Back to module">‹</button>
        <div style={styles.wordmark}>SIEM Workbench</div>
          <span style={styles.product}>{mode === 'prove' ? 'assessment lab' : 'guided lab'}</span>
        </div>
        <nav style={styles.nav}>
          <strong style={styles.navActive}>Search &amp; Investigate</strong>
        </nav>
        <div style={styles.topMeta}>
          <span>Module 3 · Mission Next</span>
        </div>
      </header>
      <section style={styles.searchBar}>
        <div style={styles.searchMeta}>
          <span style={styles.dataset}>Search</span>
          <span style={styles.metaText}>Dataset: {mod.title}</span>
          <span style={styles.metaText}>Range: {timeRangeLabel}</span>
        </div>
        <div style={styles.searchRow}>
          <input ref={inputRef} value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') runQuery(); }} style={styles.input} placeholder="search account=acct-428 | sort by timestamp" />
          <select style={styles.select} defaultValue="24h"><option value="24h">Last 24 hours</option><option value="7d">Last 7 days</option><option value="all">All time</option></select>
          <button onClick={runQuery} disabled={running} style={styles.run}>{running ? 'Running…' : 'Search'}</button>
        </div>
        <div style={styles.helperRow}>
          {queryHelpers.map(item => (
            <button key={item} onClick={() => setQuery(item)} style={styles.helperChip}>{item}</button>
          ))}
        </div>
      </section>
      <section style={styles.subnav}>
        <span style={styles.subnavActive}>Investigation</span>
      </section>
      <div style={styles.body}>
        <aside style={{ padding: 14, borderRight: '1px solid #cfd6dc', background: '#fff', overflow: 'auto' }}>
          <div style={styles.paneTitle}>Fields</div>
          <div style={styles.paneSection}>
            <div style={styles.sectionTitle}>Selected fields</div>
            {selectedFields.map(field => (
              <button key={field.name} onClick={() => setQuery(query ? `${query} ${field.name}=` : `search ${field.name}=`)} style={styles.fieldBtn}>
                <span>{field.name}</span>
                <span>{field.count}</span>
              </button>
            ))}
          </div>
          <div style={styles.paneSection}>
            <div style={styles.sectionTitle}>Default fields</div>
            {defaultFields.map(field => (
              <div key={field.name} style={styles.fieldStatic}>
                <span>{field.name}</span>
                <span>{field.count}</span>
              </div>
            ))}
          </div>
        </aside>
        <main style={{ minHeight: 0, overflow: 'auto' }}>
          <div style={styles.resultsHeader}>
            <div>
              <div style={styles.resultsKicker}>Search completed</div>
              <strong>{displayRows.length} events</strong>
              {results?.error && <span style={styles.error}> — {results.error}</span>}
            </div>
            <div style={styles.statusPills}>
              <span style={styles.statusPill}>Simulated dataset</span>
            </div>
          </div>
          <div style={styles.resultTabs}>
            {['Events', 'Statistics'].map(tab => (
              <span key={tab} style={tab === 'Events' ? styles.tabActive : styles.tab}>{tab}</span>
            ))}
          </div>
          <div style={styles.timelineWrap}>
            <div style={styles.timelineHead}>
              <span>Events timeline</span>
              <span>{timeline.length} buckets</span>
            </div>
            <div style={styles.timeline}>
              {timeline.map(([label, count]) => (
                <div key={label} style={styles.timelineBarWrap}>
                  <div title={`${label}: ${count}`} style={{ ...styles.bar, height: `${Math.max(4, Math.round((count / maxCount) * 52))}px` }} />
                </div>
              ))}
            </div>
          </div>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {columns.map(col => <th key={col} style={styles.th}>{col}</th>)}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, index) => (
                  <tr key={row.id ?? index} style={index % 2 === 0 ? styles.tr : styles.trAlt}>
                {columns.map(col => <td key={col} style={styles.td}>{String(row[col] ?? '')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            {!visibleRows.length && <div style={styles.empty}>No events returned for the current search.</div>}
          </div>
        </main>
        <div style={styles.taskRail}>
          <div style={styles.brief}>
            <div style={styles.paneTitle}>Investigation brief</div>
            <div style={styles.briefTitle}>{mod.subtitle}</div>
            <p style={styles.briefCopy}>{mod.description}</p>
          </div>
          <div style={styles.paneTitle}>{mode === 'prove' ? 'Prove It objectives' : 'Guided objectives'}</div>
          {tasks.map(task => {
            const done = taskState[task.id];
            return (
              <div key={task.id} style={done ? { ...styles.task, ...styles.taskDone } : styles.task}>
                <div style={styles.taskTitle}>{done ? '✓ ' : ''}{task.title} <span style={{ fontWeight: 400, color: '#6c7a83' }}>· {task.points} pts</span></div>
                <div style={styles.taskDesc}>{task.description}</div>
                {mode !== 'prove' && <div style={styles.taskHint}>Hint: {task.hint}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LogExplorerConsole({ mode }) {
  const mod = window.M03_LOG_DATASET;
  const [query, setQuery] = React.useState('');
  const [running, setRunning] = React.useState(false);
  const [results, setResults] = React.useState({ rows: mod.logs, type: 'raw', error: null, count: mod.logs.length });
  const [taskState, setTaskState] = React.useState({});
  const inputRef = React.useRef(null);

  function runQuery() {
    setRunning(true);
    const result = window.executeQuery(query, mod.logs);
    setResults(result);
    const nextTaskState = { ...taskState };
    mod.tasks.forEach(task => {
      if (window.validateTask(task, result, query)) nextTaskState[task.id] = true;
    });
    setTaskState(nextTaskState);
    setRunning(false);
  }

  const displayRows = results.rows || [];
  const columns = results.type === 'grouped'
    ? (displayRows[0] ? Object.keys(displayRows[0]) : [])
    : mod.fields;

  const timelineMap = {};
  if (results.type === 'raw') {
    displayRows.forEach(row => {
      const bucket = String(row.timestamp || '').slice(0, 13) || 'unknown';
      timelineMap[bucket] = (timelineMap[bucket] || 0) + 1;
    });
  }
  const timeline = Object.entries(timelineMap).sort(([a], [b]) => a.localeCompare(b));
  const maxCount = Math.max(1, ...timeline.map(([, count]) => count));

  const solvedCount = Object.values(taskState).filter(Boolean).length;

  React.useEffect(() => {
    if (solvedCount === mod.tasks.length && mod.tasks.length > 0) {
      window.opener?.postMessage({ type: 'm03-log-explorer-complete', mode, solvedCount, total: mod.tasks.length }, location.origin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solvedCount]);

  return (
    <LogExplorerShell
      mod={mod}
      mode={mode}
      onBack={() => window.close()}
      query={query}
      setQuery={setQuery}
      runQuery={runQuery}
      running={running}
      displayRows={displayRows}
      columns={columns}
      results={results}
      timeline={timeline}
      maxCount={maxCount}
      tasks={mod.tasks}
      taskState={taskState}
      inputRef={inputRef}
    />
  );
}

window.LogExplorerConsole = LogExplorerConsole;
