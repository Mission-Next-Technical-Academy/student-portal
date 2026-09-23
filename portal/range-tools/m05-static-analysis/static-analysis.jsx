// Static File Analysis — vendor-neutral static-analysis workspace for Module 5.
//
// The presentational shell (`StaticAnalysisShell`) is a close, renamed port
// of four Mission Next SOC Analyst Track tool shells that all serve the same
// `ma-1` static-analysis lab — `PEviewLabShell`, `DependencyWalkerLabShell`,
// `ResourceHackerLabShell`, and `HxDLabShell` (all in
// `src/shells/malware-analysis-shells.jsx`) — combined into one tabbed
// console instead of four separate top-level shells, per
// docs/LAB_MIGRATION_MATRIX.md's "prefer one shared engine, vendor-neutral"
// rule and to keep the ported surface roughly the size of the Module 3
// pilot. Tab labels and function/variable names describe what each tool
// does (header inspection, import table, embedded resources, hex view)
// rather than naming the commercial products they were modeled on.
// `StaticAnalysisConsole` is new: a small state container that wasn't
// needed in the source (each shell owned its own local `useState` there) —
// it tracks the active tab and per-tab selections, and derives task
// completion from those selections.
//
// Deliberately NOT wired to `recordLabAttempt()`, competency scoring, or
// instructor review in this pass — task completion is tracked locally only.
// See docs/LAB_MIGRATION_MATRIX.md's Epic C row before treating this as a
// reviewable Prove It.

const styles = {
  root: { minHeight: '100vh', background: '#0b1220', color: '#dbe7ff', fontFamily: "'Segoe UI', Arial, sans-serif", display: 'grid', gridTemplateRows: '52px 44px minmax(0, 1fr)' },
  top: { display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px', background: 'linear-gradient(180deg, #17233a 0%, #10192a 100%)', borderBottom: '1px solid #24324f' },
  backBtn: { background: '#13223b', border: '1px solid #31446d', color: '#dbe7ff', width: 28, height: 28, borderRadius: 4, cursor: 'pointer' },
  wordmark: { fontSize: 17, fontWeight: 600, color: '#f8fbff' },
  modeBadge: { fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7ea0d8' },
  topMeta: { marginLeft: 'auto', fontSize: 12, color: '#7ea0d8' },
  tabBar: { display: 'flex', gap: 4, padding: '0 14px', alignItems: 'center', borderBottom: '1px solid #24324f', background: '#0d1525' },
  tabBtn: { padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: '2px solid transparent', color: '#93a7c7', fontSize: 12.5, cursor: 'pointer' },
  tabBtnActive: { color: '#f8fbff', borderBottom: '2px solid #58a6ff', fontWeight: 600 },
  body: { minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px' },
  workArea: { minHeight: 0, overflow: 'auto', display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr)' },
  list: { borderRight: '1px solid #24324f', padding: 12, overflow: 'auto', display: 'grid', gap: 8, alignContent: 'start' },
  listItem: { textAlign: 'left', padding: '10px 12px', background: '#121d31', color: '#dbe7ff', border: '1px solid #2a3a5e', borderRadius: 6, cursor: 'pointer' },
  listItemActive: { borderColor: '#58a6ff', boxShadow: '0 0 0 1px rgba(88,166,255,0.3) inset' },
  listTitle: { fontSize: 12, fontWeight: 600 },
  listDetail: { fontSize: 11, color: '#9ab0d1', marginTop: 4, lineHeight: 1.45 },
  detail: { padding: 16, overflow: 'auto' },
  detailHeading: { fontSize: 17, fontWeight: 600, marginBottom: 10, color: '#f8fbff' },
  detailText: { fontSize: 13, lineHeight: 1.6, color: '#c5d3ec', marginBottom: 14 },
  kvGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 },
  kvCard: { display: 'grid', gap: 6, padding: '12px 14px', borderRadius: 8, background: '#101a2c', border: '1px solid #24324f', fontSize: 12, color: '#bfd0ee' },
  hexHeader: { display: 'grid', gridTemplateColumns: '110px minmax(0, 1fr) 200px', gap: 12, paddingBottom: 8, borderBottom: '1px solid #24324f', fontSize: 11, color: '#7ea0d8', textTransform: 'uppercase' },
  hexRow: { display: 'grid', gridTemplateColumns: '110px minmax(0, 1fr) 200px', gap: 12, textAlign: 'left', padding: '9px 0', color: '#dbe7ff', background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: '1px solid rgba(36,50,79,0.45)', fontFamily: "'Consolas', monospace", fontSize: 12, width: '100%' },
  hexRowActive: { color: '#7cc2ff' },
  groupLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7ea0d8', marginBottom: 8, marginTop: 4 },
  taskRail: { borderLeft: '1px solid #24324f', padding: 14, background: '#0d1525', overflow: 'auto', display: 'grid', alignContent: 'start', gap: 12 },
  brief: { background: '#101a2c', border: '1px solid #24324f', borderRadius: 8, padding: 12 },
  briefTitle: { fontSize: 15, fontWeight: 700, color: '#f8fbff', marginBottom: 6 },
  briefCopy: { fontSize: 12.5, color: '#9ab0d1', lineHeight: 1.55 },
  paneTitle: { fontSize: 11, fontWeight: 700, color: '#7ea0d8', textTransform: 'uppercase', letterSpacing: '0.08em' },
  task: { background: '#101a2c', border: '1px solid #24324f', borderRadius: 8, padding: 12, display: 'grid', gap: 6 },
  taskDone: { background: '#12291c', border: '1px solid #2f6b45' },
  taskTitle: { fontSize: 13, fontWeight: 700, color: '#f8fbff' },
  taskDesc: { fontSize: 12, color: '#9ab0d1', lineHeight: 1.5 },
  taskHint: { fontSize: 11, color: '#7ea0d8', fontStyle: 'italic' },
};

const TABS = [
  { id: 'headers', label: 'Header Inspector' },
  { id: 'imports', label: 'Import Table' },
  { id: 'resources', label: 'Embedded Resources' },
  { id: 'hex', label: 'Hex View' },
];

function DataList({ items, activeId, onSelect }) {
  return (
    <div style={styles.list}>
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onSelect(item)}
          style={{ ...styles.listItem, ...(activeId === item.id ? styles.listItemActive : null) }}
        >
          <div style={styles.listTitle}>{item.title || item.id}</div>
          {item.detail ? <div style={styles.listDetail}>{item.detail}</div> : null}
        </button>
      ))}
    </div>
  );
}

function HeaderInspectorPane({ sample, selection, onSelect }) {
  const items = sample.headers.concat(sample.sections);
  const selected = items.find(item => item.id === selection.headerId) || items[0];
  return (
    <div style={styles.workArea}>
      <DataList items={items} activeId={selected.id} onSelect={item => onSelect(item.id)} />
      <div style={styles.detail}>
        <div style={styles.detailHeading}>{selected.title}</div>
        <div style={styles.detailText}>{selected.detail}</div>
        <div style={styles.kvGrid}>
          <div style={styles.kvCard}><strong>Entry point</strong><span>0x00001370</span></div>
          <div style={styles.kvCard}><strong>Timestamp</strong><span>2026-04-22 14:05:33 UTC</span></div>
          <div style={styles.kvCard}><strong>Imports</strong><span>WS2_32, ADVAPI32</span></div>
        </div>
      </div>
    </div>
  );
}

function ImportTablePane({ sample, selection, onSelectDll, onSelectFunc }) {
  const active = sample.imports.find(item => item.dll === selection.dll) || sample.imports[0];
  const dllItems = sample.imports.map(item => ({ id: item.dll, title: item.dll, detail: `${item.funcs.length} exports inspected` }));
  return (
    <div style={styles.workArea}>
      <DataList items={dllItems} activeId={active.dll} onSelect={item => onSelectDll(item.id)} />
      <div style={styles.detail}>
        <div style={styles.detailHeading}>{active.dll}</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {active.funcs.map(name => (
            <button
              key={name}
              onClick={() => onSelectFunc(name)}
              style={{ ...styles.listItem, ...(selection.func === name ? styles.listItemActive : null) }}
            >
              <span style={styles.listTitle}>{name}</span>
              <div style={styles.listDetail}>{name === 'connect' ? 'network socket setup' : 'imported API'}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResourcesPane({ sample, selection, onSelect }) {
  return (
    <div style={styles.workArea}>
      <div style={styles.list}>
        {sample.resources.map(group => (
          <div key={group.group}>
            <div style={styles.groupLabel}>{group.group}</div>
            {group.items.map(item => (
              <button
                key={item}
                onClick={() => onSelect(item)}
                style={{ ...styles.listItem, ...(selection.resource === item ? styles.listItemActive : null), width: '100%', marginBottom: 6 }}
              >
                {item}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div style={styles.detail}>
        <div style={styles.detailHeading}>Selected resource</div>
        <div style={styles.detailText}>{selection.resource || 'Select a resource from the list.'}</div>
      </div>
    </div>
  );
}

function HexViewPane({ sample, selection, onSelect }) {
  return (
    <div style={{ padding: 14, overflow: 'auto' }}>
      <div style={styles.hexHeader}>
        <span>Offset</span><span>Hex</span><span>ASCII</span>
      </div>
      {sample.hexRows.map(row => (
        <button
          key={row.offset}
          onClick={() => onSelect(row.offset)}
          style={{ ...styles.hexRow, ...(selection.hexOffset === row.offset ? styles.hexRowActive : null) }}
        >
          <span>{row.offset}</span><span>{row.hex}</span><span>{row.ascii}</span>
        </button>
      ))}
    </div>
  );
}

function StaticAnalysisShell(props) {
  const { sample, mode, onBack, activeTab, setActiveTab, selection, setSelection, taskState } = props;

  return (
    <div style={styles.root}>
      <header style={styles.top}>
        <button onClick={onBack} style={styles.backBtn} aria-label="Close tool">‹</button>
        <div style={styles.wordmark}>Static File Analysis</div>
        <span style={styles.modeBadge}>{mode === 'prove' ? 'assessment lab' : 'guided lab'}</span>
        <div style={styles.topMeta}>Module 5 · Mission Next</div>
      </header>
      <nav style={styles.tabBar} role="tablist" aria-label="Static analysis views">
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ ...styles.tabBtn, ...(activeTab === tab.id ? styles.tabBtnActive : null) }}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div style={styles.body}>
        <main style={{ minHeight: 0, overflow: 'auto' }}>
          {activeTab === 'headers' && <HeaderInspectorPane sample={sample} selection={selection} onSelect={id => setSelection(s => ({ ...s, headerId: id }))} />}
          {activeTab === 'imports' && <ImportTablePane sample={sample} selection={selection} onSelectDll={dll => setSelection(s => ({ ...s, dll, func: '' }))} onSelectFunc={func => setSelection(s => ({ ...s, func }))} />}
          {activeTab === 'resources' && <ResourcesPane sample={sample} selection={selection} onSelect={resource => setSelection(s => ({ ...s, resource }))} />}
          {activeTab === 'hex' && <HexViewPane sample={sample} selection={selection} onSelect={hexOffset => setSelection(s => ({ ...s, hexOffset }))} />}
        </main>
        <div style={styles.taskRail}>
          <div style={styles.brief}>
            <div style={styles.paneTitle}>Investigation brief</div>
            <div style={styles.briefTitle}>{sample.subtitle}: {sample.title}</div>
            <p style={styles.briefCopy}>{sample.description}</p>
          </div>
          <div style={styles.paneTitle}>{mode === 'prove' ? 'Prove It objectives' : 'Guided objectives'}</div>
          {sample.tasks.map(task => {
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

function computeTaskState(selection) {
  return {
    t1: selection.headerId === 'IMAGE_NT_HEADERS',
    t2: selection.dll === 'WS2_32.DLL' && selection.func === 'connect',
    t3: !!selection.resource && selection.resource.includes('System Update'),
    t4: selection.hexOffset === '00000C40',
  };
}

function StaticAnalysisConsole({ mode }) {
  const sample = window.M05_STATIC_SAMPLE;
  const [activeTab, setActiveTab] = React.useState('headers');
  const [selection, setSelection] = React.useState({ headerId: 'IMAGE_DOS_HEADER', dll: 'KERNEL32.DLL', func: '', resource: '', hexOffset: '' });

  const taskState = computeTaskState(selection);
  const solvedCount = Object.values(taskState).filter(Boolean).length;

  React.useEffect(() => {
    if (solvedCount === sample.tasks.length && sample.tasks.length > 0) {
      window.opener?.postMessage({ type: 'm05-static-analysis-complete', mode, solvedCount, total: sample.tasks.length }, location.origin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solvedCount]);

  return (
    <StaticAnalysisShell
      sample={sample}
      mode={mode}
      onBack={() => window.close()}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      selection={selection}
      setSelection={setSelection}
      taskState={taskState}
    />
  );
}

window.StaticAnalysisConsole = StaticAnalysisConsole;
