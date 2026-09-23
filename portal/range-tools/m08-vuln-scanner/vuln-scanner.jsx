// Vulnerability Scanner — vendor-neutral scan/target/findings workspace for
// Module 8.
//
// `VulnScannerShell` is a renamed, de-branded port of the Boots2Bytes SOC
// Analyst Track's `OpenVASLabShell` (`src/shells/vuln-management-shells.jsx`,
// the vm-1 lab), per docs/LAB_MIGRATION_MATRIX.md's "prefer one shared
// engine, vendor-neutral" rule — the source app defines five branded scanner
// shells (OpenVAS/Nessus/Qualys/ZAP/WSUS) for the same underlying workflow;
// only this one, generic version is ported. The source shell's install
// (`apt`/`gvm-setup`) and login phases were product-specific chrome, not the
// learning objective, so they are dropped here — the tool opens straight
// into the scan/target/findings workspace, the same simplification the
// Module 3 pilot made when it dropped SplunkLabShell's legacy page wiring.
// Table/toolbar/KPI styling is adapted from the source shell's own shared
// `ovStyles` object (vuln-management-shells.jsx:645-680), recolored away
// from Greenbone green.
//
// `VulnScannerConsole` is new: a small state container (findings filters,
// per-finding prioritization rationale, and task tracking) that didn't exist
// in the source — there the "task" concept lived in a separate schema file
// consumed by a shared `LabPlayer` orchestrator this port does not use.
//
// REQUIRED ADAPTATION (docs/LAB_MIGRATION_MATRIX.md, "Vulnerability
// management" row): the source lab's findings were static with no reasoning
// narrative — task completion was just clicking through a scan/report UI.
// Task t4 (vuln-data.js) and the rationale field below require the student
// to write a short prioritization rationale for real findings, not just
// select them.
//
// Deliberately NOT wired to `recordLabAttempt()`, competency scoring, or
// instructor review in this pass — task completion is tracked locally only.
// See docs/LAB_MIGRATION_MATRIX.md's Epic C row before treating this as a
// reviewable Prove It.

const SEVERITY_TINT = {
  Critical: '#b91c1c',
  High: '#c2410c',
  Medium: '#a16207',
  Low: '#2563eb',
  Info: '#64748b',
};

const styles = {
  root: { minHeight: '100vh', background: '#f6f6f0', color: '#1a1a1a', fontFamily: '"Inter", sans-serif', display: 'grid', gridTemplateRows: '48px auto minmax(0, 1fr)' },
  top: { display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', alignItems: 'center', gap: 18, background: '#1f2933', color: '#e5e7eb', padding: '0 16px', fontSize: 13, borderBottom: '1px solid #0d1114' },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  wordmark: { fontSize: 18, lineHeight: 1, color: '#ffffff', fontWeight: 700, letterSpacing: '-0.01em' },
  product: { fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' },
  topMeta: { display: 'flex', alignItems: 'center', gap: 14, color: '#94a3b8', fontSize: 12 },
  back: { background: '#2d3944', color: '#fff', border: '1px solid #414f5b', width: 28, height: 28, borderRadius: 4, cursor: 'pointer' },
  scanBar: { padding: '12px 16px', background: '#ffffff', borderBottom: '1px solid #d4d4cf', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  targetLine: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#475569' },
  targetName: { fontWeight: 700, color: '#1a1a1a', fontSize: 13 },
  scanBtn: { background: '#0f5132', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 700 },
  scanBtnDisabled: { background: '#94a3b8', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'default' },
  body: { minHeight: 0, display: 'grid', gridTemplateColumns: '220px minmax(0, 1fr) 340px' },
  aside: { padding: 14, borderRight: '1px solid #d4d4cf', background: '#fff', overflow: 'auto' },
  paneTitle: { fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 },
  kpiRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 },
  kpi: { background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 8px', borderRadius: 4, textAlign: 'center' },
  kpiVal: { fontSize: 18, fontWeight: 700, color: '#0f172a' },
  kpiLabel: { fontSize: 10, color: '#64748b', marginTop: 2 },
  filterGroup: { marginBottom: 16 },
  filterLabel: { fontSize: 10, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 },
  chip: { display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: '1px solid transparent', borderRadius: 3, padding: '6px 8px', fontSize: 12, color: '#334155', cursor: 'pointer', marginBottom: 2 },
  chipActive: { display: 'block', width: '100%', textAlign: 'left', background: '#0f5132', border: '1px solid #0f5132', borderRadius: 3, padding: '6px 8px', fontSize: 12, color: '#fff', fontWeight: 600, cursor: 'pointer', marginBottom: 2 },
  select: { width: '100%', border: '1px solid #cbd5e1', borderRadius: 3, background: '#fff', color: '#1f2933', fontSize: 12, padding: '6px 8px' },
  main: { minHeight: 0, overflow: 'auto' },
  resultsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' },
  resultsKicker: { fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 },
  tableWrap: { minHeight: 0, overflow: 'auto', border: '1px solid #d4d4cf', background: '#fff', margin: '0 14px 14px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { position: 'sticky', top: 0, background: '#eef0f2', borderBottom: '1px solid #d4d4cf', color: '#334155', textAlign: 'left', padding: '8px 10px', fontWeight: 700, whiteSpace: 'nowrap' },
  td: { borderBottom: '1px solid #edf1f4', color: '#1f2933', padding: '7px 10px', whiteSpace: 'nowrap' },
  tr: { background: '#fff', cursor: 'pointer' },
  trAlt: { background: '#fbfcfc', cursor: 'pointer' },
  trSelected: { background: '#e6f4ea', cursor: 'pointer' },
  empty: { padding: 24, color: '#697780', fontSize: 12, textAlign: 'center' },
  badge: { display: 'inline-block', padding: '1px 7px', borderRadius: 10, color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: 0.3 },
  taskRail: { background: '#f7f8f9', borderLeft: '1px solid #d4d4cf', padding: 14, overflow: 'auto', display: 'grid', alignContent: 'start', gap: 12 },
  brief: { background: '#fff', border: '1px solid #d4d4cf', padding: 12 },
  briefTitle: { fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 },
  briefCopy: { fontSize: 12, color: '#55636c', lineHeight: 1.55 },
  detail: { background: '#fff', border: '1px solid #0f5132', padding: 12, display: 'grid', gap: 8 },
  detailTitle: { fontSize: 13, fontWeight: 700, color: '#1f2933' },
  detailMeta: { fontSize: 11, color: '#64748b' },
  textarea: { width: '100%', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: 3, fontFamily: 'inherit', fontSize: 12, padding: 8, resize: 'vertical' },
  charCount: { fontSize: 10, color: '#94a3b8', textAlign: 'right' },
  task: { background: '#fff', border: '1px solid #d4d4cf', padding: 12, display: 'grid', gap: 6 },
  taskDone: { background: '#f1fbf3', border: '1px solid #b7e3bf' },
  taskTitle: { fontSize: 13, fontWeight: 700, color: '#1f2933' },
  taskDesc: { fontSize: 12, color: '#55636c', lineHeight: 1.5 },
  taskHint: { fontSize: 11, color: '#6c7a83', fontStyle: 'italic' },
};

function SeverityBadge({ level }) {
  const tint = SEVERITY_TINT[level] || '#64748b';
  return <span style={{ ...styles.badge, background: tint }}>{level}</span>;
}

function VulnScannerShell(props) {
  const {
    mod, mode, onBack, scanned, runScan, scanning,
    filters, setSeverityFilter, setHostFilter, hosts,
    filteredRows, selectedId, selectFinding, selectedFinding,
    rationale, setRationale, tasks, solved,
  } = props;

  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0 };
  mod.findings.forEach((finding) => { counts[finding.severity] = (counts[finding.severity] || 0) + 1; });

  return (
    <div style={styles.root}>
      <header style={styles.top}>
        <div style={styles.brand}>
          <button onClick={onBack} style={styles.back} aria-label="Back to module">‹</button>
          <div style={styles.wordmark}>Vulnerability Scanner</div>
          <span style={styles.product}>{mode === 'prove' ? 'assessment lab' : 'guided lab'}</span>
        </div>
        <div />
        <div style={styles.topMeta}><span>Module 8 · Mission Next</span></div>
      </header>
      <section style={styles.scanBar}>
        <div style={styles.targetLine}>
          <span>Target</span>
          <span style={styles.targetName}>{mod.target.name}</span>
          <span>· {mod.target.hosts}</span>
          <span>· profile: {mod.target.profile}</span>
        </div>
        <button
          onClick={runScan}
          disabled={scanned || scanning}
          style={scanned || scanning ? styles.scanBtnDisabled : styles.scanBtn}
        >
          {scanning ? 'Scanning…' : scanned ? '✓ Scan complete' : '▶ Run Scan'}
        </button>
      </section>
      <div style={styles.body}>
        <aside style={styles.aside}>
          <div style={styles.paneTitle}>Severity</div>
          <div style={styles.kpiRow}>
            {['Critical', 'High', 'Medium', 'Low'].map((level) => (
              <div key={level} style={styles.kpi}>
                <div style={{ ...styles.kpiVal, color: SEVERITY_TINT[level] }}>{scanned ? counts[level] : '–'}</div>
                <div style={styles.kpiLabel}>{level}</div>
              </div>
            ))}
          </div>
          <div style={styles.filterGroup}>
            <div style={styles.filterLabel}>Filter by severity</div>
            {['all', 'Critical', 'High', 'Medium', 'Low', 'Info'].map((level) => (
              <button
                key={level}
                type="button"
                style={(level === 'all' ? !filters.severity && !filters.severityIn : filters.severity === level) ? styles.chipActive : styles.chip}
                onClick={() => setSeverityFilter(level)}
              >
                {level === 'all' ? 'All findings' : level}
              </button>
            ))}
            <button
              key="critical-high"
              type="button"
              style={(filters.severityIn || []).join(',') === 'Critical,High' ? styles.chipActive : styles.chip}
              onClick={() => setSeverityFilter('Critical,High')}
            >
              Critical + High
            </button>
          </div>
          <div style={styles.filterGroup}>
            <div style={styles.filterLabel}>Filter by host</div>
            <select style={styles.select} value={filters.host || ''} onChange={(event) => setHostFilter(event.target.value)}>
              <option value="">All hosts</option>
              {hosts.map((host) => <option key={host} value={host}>{host}</option>)}
            </select>
          </div>
        </aside>
        <main style={styles.main}>
          <div style={styles.resultsHeader}>
            <div>
              <div style={styles.resultsKicker}>{scanned ? 'Scan results' : 'No scan yet'}</div>
              <strong>{scanned ? `${filteredRows.length} findings` : 'Run a scan to populate the report'}</strong>
            </div>
          </div>
          <div style={styles.tableWrap}>
            {!scanned ? (
              <div style={styles.empty}>The report is empty until the target is scanned. Use “Run Scan” above.</div>
            ) : !filteredRows.length ? (
              <div style={styles.empty}>No findings match the current filter.</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Severity</th>
                    <th style={styles.th}>CVSS</th>
                    <th style={styles.th}>Finding</th>
                    <th style={styles.th}>CVE</th>
                    <th style={styles.th}>Host</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((finding, index) => {
                    const rowStyle = finding.id === selectedId ? styles.trSelected : (index % 2 === 0 ? styles.tr : styles.trAlt);
                    return (
                      <tr key={finding.id} style={rowStyle} onClick={() => selectFinding(finding.id)}>
                        <td style={styles.td}><SeverityBadge level={finding.severity} /></td>
                        <td style={styles.td}>{finding.cvss.toFixed(1)}</td>
                        <td style={styles.td}>{finding.name}</td>
                        <td style={styles.td}>{finding.cve || '—'}</td>
                        <td style={styles.td}>{finding.host}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </main>
        <div style={styles.taskRail}>
          <div style={styles.brief}>
            <div style={styles.paneTitle}>Investigation brief</div>
            <div style={styles.briefTitle}>{mod.subtitle}</div>
            <p style={styles.briefCopy}>{mod.description}</p>
          </div>
          {selectedFinding && (
            <div style={styles.detail}>
              <div style={styles.paneTitle}>Prioritization rationale</div>
              <div style={styles.detailTitle}>{selectedFinding.name}</div>
              <div style={styles.detailMeta}>{selectedFinding.id} · {selectedFinding.host} · {selectedFinding.severity} · CVSS {selectedFinding.cvss.toFixed(1)}{selectedFinding.cve ? ` · ${selectedFinding.cve}` : ''}</div>
              <textarea
                style={styles.textarea}
                rows={4}
                maxLength={500}
                placeholder="Why does this finding matter, and what would you ask before remediating it?"
                value={rationale}
                onChange={(event) => setRationale(selectedFinding.id, event.target.value)}
              />
              <div style={styles.charCount}>{rationale.length}/500</div>
            </div>
          )}
          <div style={styles.paneTitle}>{mode === 'prove' ? 'Prove It objectives' : 'Guided objectives'}</div>
          {tasks.map((task) => {
            const done = solved[task.id];
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

function VulnScannerConsole({ mode }) {
  const mod = window.M08_VULN_DATASET;
  const [scanned, setScanned] = React.useState(false);
  const [scanning, setScanning] = React.useState(false);
  const [filters, setFilters] = React.useState({});
  const [selectedId, setSelectedId] = React.useState('');
  const [rationales, setRationales] = React.useState({});
  const [solved, setSolved] = React.useState({});

  function runScan() {
    setScanning(true);
    window.setTimeout(() => { setScanning(false); setScanned(true); }, 450);
  }

  function setSeverityFilter(level) {
    if (level === 'all') { setFilters((prev) => ({ ...prev, severity: undefined, severityIn: undefined })); return; }
    if (level === 'Critical,High') { setFilters((prev) => ({ ...prev, severity: undefined, severityIn: ['Critical', 'High'] })); return; }
    setFilters((prev) => ({ ...prev, severity: level, severityIn: undefined }));
  }

  function setHostFilter(host) {
    setFilters((prev) => ({ ...prev, host: host || undefined }));
  }

  function selectFinding(id) {
    setSelectedId(id);
  }

  function setRationale(id, text) {
    setRationales((prev) => ({ ...prev, [id]: text }));
  }

  const filteredRows = React.useMemo(
    () => (scanned ? window.sortFindings(window.filterFindings(mod.findings, filters)) : []),
    [scanned, filters]
  );
  const hosts = React.useMemo(() => Array.from(new Set(mod.findings.map((finding) => finding.host))).sort(), []);
  const selectedFinding = mod.findings.find((finding) => finding.id === selectedId) || null;

  React.useEffect(() => {
    if (!scanned) return;
    setSolved((prev) => {
      const next = { ...prev };
      mod.tasks.forEach((task) => {
        if (window.validateVulnTask(task, { filters, filteredRows, rationales, findings: mod.findings })) next[task.id] = true;
      });
      return next;
    });
  }, [scanned, filters, filteredRows, rationales]);

  const solvedCount = Object.values(solved).filter(Boolean).length;

  React.useEffect(() => {
    if (mod.tasks.length > 0 && solvedCount === mod.tasks.length) {
      window.opener?.postMessage({ type: 'm08-vuln-scanner-complete', mode, solvedCount, total: mod.tasks.length }, location.origin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solvedCount]);

  return (
    <VulnScannerShell
      mod={mod}
      mode={mode}
      onBack={() => window.close()}
      scanned={scanned}
      scanning={scanning}
      runScan={runScan}
      filters={filters}
      setSeverityFilter={setSeverityFilter}
      setHostFilter={setHostFilter}
      hosts={hosts}
      filteredRows={filteredRows}
      selectedId={selectedId}
      selectFinding={selectFinding}
      selectedFinding={selectedFinding}
      rationale={selectedFinding ? (rationales[selectedFinding.id] || '') : ''}
      setRationale={setRationale}
      tasks={mod.tasks}
      solved={solved}
    />
  );
}

window.VulnScannerConsole = VulnScannerConsole;
