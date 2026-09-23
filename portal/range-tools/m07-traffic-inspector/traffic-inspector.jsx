// Traffic Inspector — vendor-neutral HTTP proxy/traffic workspace for
// Module 7 (network/web-assessment side of "network & email investigation").
//
// The presentational shell (`TrafficInspectorShell`) is a close, renamed
// port of the Boots2Bytes SOC Analyst Track's `BurpProxyLabShell`
// (`src/shells/security-assessments-shells.jsx:500-732`), stripped of all
// "Burp Suite" branding per docs/LAB_MIGRATION_MATRIX.md's explicit
// vendor-neutral rule. Only the Proxy-equivalent history table and the
// Repeater-equivalent request/response pane are ported — the source's
// other Burp tabs (Target, Intruder, Sequencer, Decoder, Comparer,
// Logger, Extender) were placeholders in the source too and are kept as
// inert placeholder tabs here for the same reason.
//
// `TrafficInspectorConsole` is new: a small state container that wasn't
// needed in the source (there it lived inside a larger legacy lab
// environment with its own virtual filesystem and step engine) — it owns
// the request list, the evidence tray, and the Repeater edit/send state,
// and derives the task-completion state the shell renders.
//
// Per the matrix row's RISKS column, the source's one-click "mark
// complete" shortcut is deliberately NOT ported. Every task here is
// validated against evidence the student actually produced: either a
// saved request from the history table, or a request actually rewritten
// and sent through Repeater and observed to return the manipulated
// response — never a single click claiming completion.
//
// Deliberately NOT wired to `recordLabAttempt()`, competency scoring, or
// instructor review in this pass — task completion is tracked locally
// only. See docs/LAB_MIGRATION_MATRIX.md's Epic C row before treating
// this as a reviewable Prove It.

const INSPECTOR_TABS = ['Traffic', 'Repeater', 'Decoder', 'Comparer'];

const styles = {
  root: { minHeight: '100vh', background: '#1b1f22', color: '#dcdcdc', fontFamily: '"Helvetica Neue", Arial, sans-serif', fontSize: 13, display: 'flex', flexDirection: 'column' },
  titleBar: { background: '#15181a', color: '#dcdcdc', padding: '8px 14px', borderBottom: '1px solid #2e3438', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 },
  back: { background: '#232b30', color: '#fff', border: '1px solid #3a4348', width: 26, height: 26, borderRadius: 3, cursor: 'pointer' },
  wordmark: { fontSize: 15, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' },
  product: { fontSize: 11, color: '#8f9aa3', textTransform: 'uppercase', letterSpacing: '0.1em' },
  titleSpacer: { flex: 1 },
  titleMeta: { color: '#8f9aa3', fontSize: 11 },
  tabBar: { background: '#232b30', display: 'flex', borderBottom: '1px solid #15181a' },
  tab: { background: 'transparent', border: 'none', color: '#b3bcc3', padding: '8px 16px', fontSize: 12, cursor: 'pointer', borderRight: '1px solid #15181a' },
  tabActive: { background: '#1b1f22', border: 'none', color: '#5aa3f5', padding: '8px 16px', fontSize: 12, cursor: 'pointer', borderRight: '1px solid #15181a', fontWeight: 700 },
  body: { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 },
  toolbar: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: '#20272b', borderBottom: '1px solid #15181a' },
  toolbarMute: { color: '#8f9aa3', fontSize: 11 },
  layout: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', flex: 1, minHeight: 0 },
  main: { minHeight: 0, overflow: 'auto', padding: '0 0 14px' },
  tableWrap: { overflow: 'auto', maxHeight: 300, borderBottom: '1px solid #15181a' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'Menlo, Consolas, monospace' },
  th: { background: '#232b30', color: '#b3bcc3', padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid #15181a', position: 'sticky', top: 0 },
  tr: { cursor: 'pointer' },
  trSel: { cursor: 'pointer', background: 'rgba(90,163,245,0.15)' },
  trEvidence: { cursor: 'pointer', background: 'rgba(90,163,245,0.06)' },
  td: { padding: '5px 10px', borderBottom: '1px solid #20272b', whiteSpace: 'nowrap' },
  tdUrl: { padding: '5px 10px', borderBottom: '1px solid #20272b', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis' },
  detailWrap: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 10 },
  detailPane: { display: 'flex', flexDirection: 'column', background: '#15181a', border: '1px solid #2e3438', borderRadius: 3, overflow: 'hidden', minHeight: 160 },
  detailHead: { background: '#232b30', color: '#b3bcc3', padding: '5px 10px', fontSize: 10, letterSpacing: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pre: { padding: 10, fontSize: 12, fontFamily: 'Menlo, Consolas, monospace', whiteSpace: 'pre-wrap', overflow: 'auto', flex: 1, color: '#dcdcdc', margin: 0 },
  textarea: { padding: 10, fontSize: 12, fontFamily: 'Menlo, Consolas, monospace', background: '#15181a', color: '#dcdcdc', border: 'none', outline: 'none', flex: 1, resize: 'none', minHeight: 200 },
  evidenceButton: { background: '#233246', border: '1px solid #345', color: '#9fc4f5', fontSize: 11, padding: '4px 10px', borderRadius: 3, cursor: 'pointer', margin: '0 10px 10px' },
  evidenceButtonDone: { background: '#1f3a2a', border: '1px solid #2f5a3f', color: '#8fe3a8', fontSize: 11, padding: '4px 10px', borderRadius: 3, cursor: 'pointer', margin: '0 10px 10px' },
  btn: { background: '#2a3338', border: '1px solid #3a4348', color: '#dcdcdc', fontSize: 12, padding: '5px 12px', cursor: 'pointer', borderRadius: 3 },
  btnPrimary: { background: '#3f8f5f', border: '1px solid #2f6f47', color: '#fff', fontSize: 12, padding: '5px 12px', cursor: 'pointer', borderRadius: 3, fontWeight: 700 },
  placeholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, color: '#64748b' },
  placeholderH1: { fontSize: 18, color: '#94a3b8', marginBottom: 6 },
  taskRail: { background: '#20272b', borderLeft: '1px solid #15181a', padding: 14, overflow: 'auto', display: 'grid', alignContent: 'start', gap: 12 },
  brief: { background: '#1b1f22', border: '1px solid #2e3438', padding: 12, borderRadius: 3 },
  briefTitle: { fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 },
  briefCopy: { fontSize: 12, color: '#aab4bc', lineHeight: 1.55 },
  paneTitle: { fontSize: 11, fontWeight: 700, color: '#8f9aa3', textTransform: 'uppercase', letterSpacing: '0.05em' },
  task: { background: '#1b1f22', border: '1px solid #2e3438', padding: 12, borderRadius: 3, display: 'grid', gap: 6 },
  taskDone: { background: '#16241b', border: '1px solid #2f5a3f' },
  taskTitle: { fontSize: 13, fontWeight: 700, color: '#fff' },
  taskDesc: { fontSize: 12, color: '#aab4bc', lineHeight: 1.5 },
  taskHint: { fontSize: 11, color: '#8f9aa3', fontStyle: 'italic' },
};

function TrafficInspectorShell(props) {
  const {
    mod, mode, onBack, tab, setTab, rows, selectedId, selectRow,
    repeaterRow, reqEdit, setReqEdit, responseText, repeaterSend, sendToRepeater,
    evidence, toggleEvidence, tasks, taskState,
  } = props;

  const selected = rows.find((row) => row.id === selectedId) || null;

  return (
    <div style={styles.root}>
      <header style={styles.titleBar}>
        <button onClick={onBack} style={styles.back} aria-label="Back to module">‹</button>
        <span style={styles.wordmark}>Traffic Inspector</span>
        <span style={styles.product}>{mode === 'prove' ? 'assessment lab' : 'guided lab'}</span>
        <span style={styles.titleSpacer} />
        <span style={styles.titleMeta}>Module 7 · Mission Next</span>
      </header>

      <nav style={styles.tabBar}>
        {INSPECTOR_TABS.map((name) => (
          <button key={name} onClick={() => setTab(name)} style={tab === name ? styles.tabActive : styles.tab}>{name}</button>
        ))}
      </nav>

      <div style={styles.layout}>
        <main style={styles.main}>
          {tab === 'Traffic' && (
            <React.Fragment>
              <div style={styles.toolbar}>
                <span style={styles.toolbarMute}>{rows.length} captured requests · {mod.title}</span>
              </div>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>{['#', 'Method', 'URL', 'Status', 'Length', 'MIME', 'Action'].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => {
                      const rowStyle = selectedId === row.id ? styles.trSel : (row.evidence ? styles.trEvidence : styles.tr);
                      return (
                        <tr key={row.id} onClick={() => selectRow(row.id)} style={rowStyle}>
                          <td style={styles.td}>{index + 1}</td>
                          <td style={styles.td}>{row.method}</td>
                          <td style={styles.tdUrl}>{row.url}</td>
                          <td style={{ ...styles.td, color: row.status >= 500 ? '#f87171' : row.status >= 400 ? '#f59e0b' : row.status >= 300 ? '#93c5fd' : '#22c55e' }}>{row.status}</td>
                          <td style={styles.td}>{row.length}</td>
                          <td style={styles.td}>{row.mime}</td>
                          <td style={styles.td}>
                            <button type="button" style={styles.btn} onClick={(event) => { event.stopPropagation(); sendToRepeater(row); }}>Send to Repeater</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {selected && (
                <React.Fragment>
                  <div style={styles.detailWrap}>
                    <div style={styles.detailPane}>
                      <div style={styles.detailHead}>Request</div>
                      <pre style={styles.pre}>{selected.request}</pre>
                    </div>
                    <div style={styles.detailPane}>
                      <div style={styles.detailHead}>Response</div>
                      <pre style={styles.pre}>{selected.response}</pre>
                    </div>
                  </div>
                  {selected.summary && (
                    <div style={{ padding: '0 10px 6px', color: '#aab4bc', fontSize: 12 }}>{selected.summary}</div>
                  )}
                  {selected.evidence && (
                    <button type="button" onClick={() => toggleEvidence(selected.id)} style={evidence.includes(selected.id) ? styles.evidenceButtonDone : styles.evidenceButton}>
                      {evidence.includes(selected.id) ? '✓ Evidence saved' : 'Save as evidence'}
                    </button>
                  )}
                </React.Fragment>
              )}
            </React.Fragment>
          )}

          {tab === 'Repeater' && (
            <React.Fragment>
              <div style={styles.toolbar}>
                <button type="button" onClick={repeaterSend} style={styles.btnPrimary}>Send</button>
                <span style={styles.toolbarMute}>{repeaterRow ? `Target: ${repeaterRow.method} ${repeaterRow.url}` : 'No request loaded — click "Send to Repeater" from the Traffic tab.'}</span>
              </div>
              <div style={styles.detailWrap}>
                <div style={styles.detailPane}>
                  <div style={styles.detailHead}>Request (editable)</div>
                  <textarea value={reqEdit} onChange={(event) => setReqEdit(event.target.value)} style={styles.textarea} spellCheck={false} disabled={!repeaterRow} />
                </div>
                <div style={styles.detailPane}>
                  <div style={styles.detailHead}>Response</div>
                  <pre style={styles.pre}>{responseText}</pre>
                </div>
              </div>
            </React.Fragment>
          )}

          {tab !== 'Traffic' && tab !== 'Repeater' && (
            <div style={styles.placeholder}>
              <div style={styles.placeholderH1}>{tab}</div>
              <p>For this lab, work in the Traffic and Repeater tabs.</p>
            </div>
          )}
        </main>

        <aside style={styles.taskRail}>
          <div style={styles.brief}>
            <p style={styles.paneTitle}>Investigation brief</p>
            <div style={styles.briefTitle}>{mod.subtitle}</div>
            <p style={styles.briefCopy}>{mod.description}</p>
          </div>
          <p style={styles.paneTitle}>{mode === 'prove' ? 'Prove It objectives' : 'Guided objectives'}</p>
          {tasks.map((task) => {
            const done = taskState[task.id];
            return (
              <div key={task.id} style={done ? { ...styles.task, ...styles.taskDone } : styles.task}>
                <div style={styles.taskTitle}>{done ? '✓ ' : ''}{task.title} <span style={{ fontWeight: 400, color: '#8f9aa3' }}>· {task.points} pts</span></div>
                <div style={styles.taskDesc}>{task.description}</div>
                {mode !== 'prove' && <div style={styles.taskHint}>Hint: {task.hint}</div>}
              </div>
            );
          })}
        </aside>
      </div>
    </div>
  );
}

function validateTrafficTask(task, state) {
  const v = task.validation;
  if (v.type === 'evidence') return state.evidence.includes(v.requestId);
  if (v.type === 'repeater-manipulated') return state.evidence.includes(v.requestId) && state.repeaterManipulated === true;
  return false;
}

function TrafficInspectorConsole({ mode }) {
  const mod = window.M07_TRAFFIC_DATASET;
  const [tab, setTab] = React.useState('Traffic');
  const [selectedId, setSelectedId] = React.useState(null);
  const [repeaterRow, setRepeaterRow] = React.useState(null);
  const [reqEdit, setReqEdit] = React.useState('');
  const [responseText, setResponseText] = React.useState('');
  const [repeaterManipulated, setRepeaterManipulated] = React.useState(false);
  const [evidence, setEvidence] = React.useState([]);

  function selectRow(id) {
    setSelectedId(id);
  }

  function sendToRepeater(row) {
    setTab('Repeater');
    setRepeaterRow(row);
    setReqEdit(row.request || '');
    setResponseText(row.response || '');
  }

  function repeaterSend() {
    if (!repeaterRow) return;
    // Mirrors the source's IDOR detection: a request body that rewrites
    // price to 1 gets the manipulated (still-200, now-wrong) response.
    if (/price\s*=\s*1\b/i.test(reqEdit) && repeaterRow.responseManipulated) {
      setResponseText(repeaterRow.responseManipulated);
      setRepeaterManipulated(true);
    } else {
      setResponseText(repeaterRow.response || '');
    }
  }

  function toggleEvidence(id) {
    setEvidence((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  const taskState = {};
  mod.tasks.forEach((task) => {
    taskState[task.id] = validateTrafficTask(task, { evidence, repeaterManipulated });
  });
  const solvedCount = Object.values(taskState).filter(Boolean).length;

  React.useEffect(() => {
    if (solvedCount === mod.tasks.length && mod.tasks.length > 0) {
      window.opener?.postMessage({ type: 'm07-traffic-inspector-complete', mode, solvedCount, total: mod.tasks.length }, location.origin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solvedCount]);

  return (
    <TrafficInspectorShell
      mod={mod}
      mode={mode}
      onBack={() => window.close()}
      tab={tab}
      setTab={setTab}
      rows={mod.requests}
      selectedId={selectedId}
      selectRow={selectRow}
      repeaterRow={repeaterRow}
      reqEdit={reqEdit}
      setReqEdit={setReqEdit}
      responseText={responseText}
      repeaterSend={repeaterSend}
      sendToRepeater={sendToRepeater}
      evidence={evidence}
      toggleEvidence={toggleEvidence}
      tasks={mod.tasks}
      taskState={taskState}
    />
  );
}

window.TrafficInspectorConsole = TrafficInspectorConsole;
