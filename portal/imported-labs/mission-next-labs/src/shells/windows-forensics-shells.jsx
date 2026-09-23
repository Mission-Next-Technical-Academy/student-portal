(function () {
  function toDateValue(value) {
    return String(value || '').toLowerCase();
  }

  function DataTable({ columns, rows, selectedRowId, onSelectRow, compact }) {
    return (
      <div style={{ ...wfShellStyles.tableWrap, ...(compact ? wfShellStyles.tableWrapCompact : null) }}>
        <table style={wfShellStyles.table}>
          <thead>
            <tr>
              {columns.map(column => <th key={column} style={wfShellStyles.th}>{column}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const rowId = row.id || `${index}`;
              const active = selectedRowId === rowId;
              return (
                <tr
                  key={rowId}
                  onClick={() => onSelectRow && onSelectRow(row)}
                  style={{ ...wfShellStyles.tr, ...(active ? wfShellStyles.trActive : null) }}
                >
                  {columns.map(column => <td key={column} style={wfShellStyles.td}>{row[column] != null ? String(row[column]) : ''}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  function WindowsRunDialog({ open, value, onChange, onOk, onCancel }) {
    if (!open) return null;
    return (
      <div style={wfShellStyles.modalScrim}>
        <div style={wfShellStyles.runDialog}>
          <div style={wfShellStyles.runTitleBar}>
            <span>Run</span>
            <button type="button" onClick={onCancel} style={wfShellStyles.modalClose}>×</button>
          </div>
          <div style={wfShellStyles.runBody}>
            <div style={wfShellStyles.runIcon}>RUN</div>
            <div style={{ flex: 1 }}>
              <p style={wfShellStyles.runText}>Type the name of a program, folder, document, or Internet resource, and Windows will open it for you.</p>
              <label style={wfShellStyles.runLabel}>
                <span>Open:</span>
                <input
                  value={value}
                  onChange={event => onChange(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter') onOk();
                    if (event.key === 'Escape') onCancel();
                  }}
                  style={wfShellStyles.runInput}
                  autoFocus
                />
              </label>
            </div>
          </div>
          <div style={wfShellStyles.runActions}>
            <button type="button" onClick={onOk} style={wfShellStyles.primaryBtn}>OK</button>
            <button type="button" onClick={onCancel} style={wfShellStyles.secondaryBtn}>Cancel</button>
            <button type="button" style={wfShellStyles.secondaryBtn}>Browse...</button>
          </div>
        </div>
      </div>
    );
  }

  function EventViewerPlayerShell({ config, onAction }) {
    const events = Array.isArray(config?.events) ? config.events : [];
    const channels = ['Application', 'Security', 'Setup', 'System', 'Forwarded Events'];
    const [selectedChannel, setSelectedChannel] = React.useState('Security');
    const [filterValue, setFilterValue] = React.useState('');
    const [draftFilter, setDraftFilter] = React.useState('4625');
    const [showFilterDialog, setShowFilterDialog] = React.useState(false);
    const [showSaveDialog, setShowSaveDialog] = React.useState(false);
    const [saveName, setSaveName] = React.useState('FailedLogins.evtx');
    const [selectedId, setSelectedId] = React.useState(events[0]?.id || null);

    const filteredEvents = events.filter(event => {
      if (event.logName !== selectedChannel) return false;
      if (filterValue && String(event.eventId) !== String(filterValue)) return false;
      return true;
    });

    React.useEffect(() => {
      if (!filteredEvents.some(event => event.id === selectedId)) {
        setSelectedId(filteredEvents[0]?.id || null);
      }
    }, [selectedChannel, filterValue]);

    const selectedEvent = filteredEvents.find(event => event.id === selectedId) || filteredEvents[0] || null;

    function openChannel(channel) {
      setSelectedChannel(channel);
      onAction && onAction(channel === 'Security' ? 'Open Security Log' : `Open ${channel} Log`);
    }

    function saveFilteredLog() {
      const matching = filteredEvents.map(event => `${event.date} ${event.time} ${event.eventId} ${event.user} ${event.sourceIp} ${event.message}`).join('\n') + '\n';
      onAction && onAction(`Save Filtered Log File As ${saveName}`, {
        savedFiles: { [saveName]: matching },
      });
      setShowSaveDialog(false);
    }

    return (
      <div style={wfShellStyles.winAppRoot}>
        <div style={wfShellStyles.winTitleBar}>
          <span>Event Viewer</span>
          <div style={wfShellStyles.windowButtons}><span>—</span><span>□</span><span>×</span></div>
        </div>
        <div style={wfShellStyles.menuRow}>
          {['File', 'Action', 'View', 'Help'].map(item => <span key={item}>{item}</span>)}
        </div>
        <div style={wfShellStyles.toolbar}>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => openChannel('Security')}>Security</button>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => setShowFilterDialog(true)}>Filter Current Log</button>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => setShowSaveDialog(true)}>Save Filtered Log File As</button>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => { setFilterValue(''); onAction && onAction('Clear Event Viewer Filter'); }}>Clear</button>
        </div>
        <div style={wfShellStyles.eventLayout}>
          <aside style={wfShellStyles.eventNav}>
            <div style={wfShellStyles.sectionLabel}>Console Tree</div>
            <div style={wfShellStyles.treeRoot}>Event Viewer (Local)</div>
            <div style={wfShellStyles.treeBranch}>Windows Logs</div>
            {channels.map(channel => (
              <button
                key={channel}
                type="button"
                onClick={() => openChannel(channel)}
                style={{ ...wfShellStyles.treeItem, ...(selectedChannel === channel ? wfShellStyles.treeItemActive : null) }}
              >
                <span>{channel}</span>
                <span style={wfShellStyles.treeCount}>{events.filter(event => event.logName === channel).length}</span>
              </button>
            ))}
          </aside>
          <section style={wfShellStyles.eventMain}>
            <div style={wfShellStyles.filterSummary}>
              <div>
                <strong>{selectedChannel}</strong>
                <span style={wfShellStyles.filterMeta}>{filterValue ? `Filtered to Event ID ${filterValue}` : 'No active filter'}</span>
              </div>
              <div style={wfShellStyles.filterMeta}>{filteredEvents.length} events</div>
            </div>
            <DataTable
              columns={['Level', 'Date', 'Time', 'Source', 'Event ID', 'User', 'Source IP']}
              rows={filteredEvents.map(event => ({
                id: event.id,
                Level: event.level,
                Date: event.date,
                Time: event.time,
                Source: event.source,
                'Event ID': event.eventId,
                User: event.user,
                'Source IP': event.sourceIp,
              }))}
              selectedRowId={selectedId}
              onSelectRow={row => setSelectedId(row.id)}
            />
            <div style={wfShellStyles.detailCard}>
              <div style={wfShellStyles.sectionLabel}>Event Details</div>
              {selectedEvent ? (
                <>
                  <div style={wfShellStyles.detailMessage}>{selectedEvent.message}</div>
                  <div style={wfShellStyles.metaGrid}>
                    {[
                      ['Computer', selectedEvent.computer],
                      ['Status', selectedEvent.status],
                      ['Task Category', selectedEvent.taskCategory],
                      ['Process', selectedEvent.processId || 'N/A'],
                    ].map(([label, value]) => (
                      <div key={label} style={wfShellStyles.metaBox}>
                        <span style={wfShellStyles.metaLabel}>{label}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={wfShellStyles.detailMessage}>Select an event to inspect it.</div>
              )}
            </div>
          </section>
        </div>

        {showFilterDialog && (
          <div style={wfShellStyles.modalScrim}>
            <div style={wfShellStyles.smallDialog}>
              <div style={wfShellStyles.runTitleBar}>
                <span>Filter Current Log</span>
                <button type="button" onClick={() => setShowFilterDialog(false)} style={wfShellStyles.modalClose}>×</button>
              </div>
              <div style={wfShellStyles.dialogBody}>
                <label style={wfShellStyles.formRow}>
                  <span>Event ID</span>
                  <input value={draftFilter} onChange={event => setDraftFilter(event.target.value)} style={wfShellStyles.formInput} />
                </label>
              </div>
              <div style={wfShellStyles.runActions}>
                <button
                  type="button"
                  onClick={() => {
                    setFilterValue(draftFilter.trim());
                    onAction && onAction(`Filter Current Log: Event ID ${draftFilter.trim()}`);
                    setShowFilterDialog(false);
                  }}
                  style={wfShellStyles.primaryBtn}
                >
                  OK
                </button>
                <button type="button" onClick={() => setShowFilterDialog(false)} style={wfShellStyles.secondaryBtn}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {showSaveDialog && (
          <div style={wfShellStyles.modalScrim}>
            <div style={wfShellStyles.smallDialog}>
              <div style={wfShellStyles.runTitleBar}>
                <span>Save Filtered Log File As</span>
                <button type="button" onClick={() => setShowSaveDialog(false)} style={wfShellStyles.modalClose}>×</button>
              </div>
              <div style={wfShellStyles.dialogBody}>
                <label style={wfShellStyles.formRow}>
                  <span>File name</span>
                  <input value={saveName} onChange={event => setSaveName(event.target.value)} style={wfShellStyles.formInput} />
                </label>
              </div>
              <div style={wfShellStyles.runActions}>
                <button type="button" onClick={saveFilteredLog} style={wfShellStyles.primaryBtn}>Save</button>
                <button type="button" onClick={() => setShowSaveDialog(false)} style={wfShellStyles.secondaryBtn}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function buildFailedLoginRows(events) {
    return events.filter(event => Number(event.eventId) === 4625);
  }

  function buildSuccessfulRows(events) {
    return events.filter(event => Number(event.eventId) === 4624);
  }

  function toCsv(headers, rows) {
    return [headers.join(','), ...rows.map(row => headers.map(header => `"${String(row[header] != null ? row[header] : '').replace(/"/g, '""')}"`).join(','))].join('\n') + '\n';
  }

  function buildWf1CmdMap(data) {
    const failedRows = buildFailedLoginRows(data.events).map(event => ({
      TimeGenerated: `${event.date} ${event.time}`,
      EventID: event.eventId,
      EventTypeName: event.status,
      Message: event.message,
    }));
    const successful = buildSuccessfulRows(data.events)[0];
    const correlated = buildFailedLoginRows(data.events).map(event => ({
      FailedLoginTime: `${event.date} ${event.time}`,
      SuccessfulLoginTime: successful ? `${successful.date} ${successful.time}` : 'N/A',
      FailedLoginMessage: event.message,
      SuccessfulLoginMessage: successful ? successful.message : 'N/A',
    }));
    return [
      {
        match: /^\s*cd\s+/i,
        run: () => ({ stdout: '' }),
      },
      {
        match: /LogParser\.exe/i,
        run: line => {
          if (/CorrelatedLogins\.csv/i.test(line)) {
            return {
              stdout: 'Input format: EVT\nOutput format: CSV\n4 rows written to CorrelatedLogins.csv\n',
              savedFiles: { 'CorrelatedLogins.csv': toCsv(['FailedLoginTime', 'SuccessfulLoginTime', 'FailedLoginMessage', 'SuccessfulLoginMessage'], correlated) },
            };
          }
          return {
            stdout: 'Input format: EVT\nOutput format: CSV\n5 rows written to FailedLogins.csv\n',
            savedFiles: { 'FailedLogins.csv': toCsv(['TimeGenerated', 'EventID', 'EventTypeName', 'Message'], failedRows) },
          };
        },
      },
      {
        match: /^\s*type\s+(FailedLogins|CorrelatedLogins)\.csv\s*$/i,
        run: line => {
          const name = /CorrelatedLogins/i.test(line) ? 'CorrelatedLogins.csv' : 'FailedLogins.csv';
          return { stdout: name === 'FailedLogins.csv' ? toCsv(['TimeGenerated', 'EventID', 'EventTypeName', 'Message'], failedRows) : toCsv(['FailedLoginTime', 'SuccessfulLoginTime', 'FailedLoginMessage', 'SuccessfulLoginMessage'], correlated) };
        },
      },
    ];
  }

  function buildWf1PowerShellMap(data) {
    const failedRows = buildFailedLoginRows(data.events);
    const tableText = failedRows.map(event => `${event.date} ${event.time}  4625  ${event.message}`).join('\n') + '\n';
    return [
      {
        match: /Get-WinEvent/i,
        run: line => {
          if (/Out-File/i.test(line)) {
            return {
              stdout: '',
              savedFiles: { 'FailedLogins.txt': tableText },
            };
          }
          return { stdout: tableText };
        },
      },
    ];
  }

  function SavedFilesPane({ files, onOpen }) {
    const names = Object.keys(files || {});
    return (
      <div style={wfShellStyles.savedPane}>
        <div style={wfShellStyles.sectionLabel}>Recovered / Exported Files</div>
        {names.length === 0 ? <div style={wfShellStyles.savedEmpty}>No exported files yet.</div> : names.map(name => (
          <button key={name} type="button" onClick={() => onOpen(name)} style={wfShellStyles.savedFileBtn}>{name}</button>
        ))}
      </div>
    );
  }

  function WindowsEventLogsLabShell(props) {
    const { lab, onCommand, initialCwd } = props;
    const data = lab?.toolData || {};
    const [activeApp, setActiveApp] = React.useState('eventviewer');
    const [showRun, setShowRun] = React.useState(false);
    const [runValue, setRunValue] = React.useState('eventvwr.msc');
    const [savedFiles, setSavedFiles] = React.useState({});
    const [openFile, setOpenFile] = React.useState('');

    function emit(line, result) {
      const nextSaved = result && result.savedFiles ? result.savedFiles : null;
      if (nextSaved) setSavedFiles(prev => ({ ...prev, ...nextSaved }));
      if (typeof onCommand === 'function') onCommand(line, result || {}, { cwd: initialCwd || 'C:\\Cases\\WF-1', savedFiles: nextSaved || {} });
    }

    function launchFromRun() {
      const cmd = runValue.trim().toLowerCase();
      if (cmd === 'eventvwr.msc') setActiveApp('eventviewer');
      if (cmd === 'cmd') setActiveApp('cmd');
      if (cmd === 'powershell') setActiveApp('powershell');
      emit(`Run ${runValue.trim()}`, {});
      setShowRun(false);
    }

    const cmdMap = React.useMemo(() => buildWf1CmdMap(data), [data]);
    const psMap = React.useMemo(() => buildWf1PowerShellMap(data), [data]);
    const fileContent = openFile ? savedFiles[openFile] || '' : '';

    return (
      <div style={wfShellStyles.workstationRoot}>
        <div style={wfShellStyles.workstationTop}>
          <div style={wfShellStyles.desktopRail}>
            {[
              ['Run', () => { setShowRun(true); emit('Open Run Dialog', {}); }],
              ['Event Viewer', () => { setActiveApp('eventviewer'); emit('Open Event Viewer', {}); }],
              ['Command Prompt', () => { setActiveApp('cmd'); emit('Open Command Prompt', {}); }],
              ['PowerShell', () => { setActiveApp('powershell'); emit('Open PowerShell', {}); }],
              ['Notes', () => setActiveApp('notes')],
            ].map(([label, handler]) => (
              <button key={label} type="button" onClick={handler} style={wfShellStyles.desktopShortcut}>{label}</button>
            ))}
          </div>
          <div style={wfShellStyles.mainStage}>
            <div style={wfShellStyles.stageHeader}>
              <div>
                <div style={wfShellStyles.caseEyebrow}>WINDOWS FORENSICS</div>
                <h2 style={wfShellStyles.caseTitle}>Interactive Event Log Workstation</h2>
              </div>
              <div style={wfShellStyles.caseBadge}>wf-1</div>
            </div>
            <div style={wfShellStyles.stageBody}>
              <div style={wfShellStyles.viewerPane}>
                {activeApp === 'eventviewer' && (
                  <EventViewerPlayerShell config={data} onAction={(line, result) => emit(line, result)} />
                )}
                {activeApp === 'cmd' && (
                  <div style={wfShellStyles.consoleWrap}>
                    <WindowsCmdShell commandMap={cmdMap} initialCwd={'C:\\Program Files\\Log Parser 2.2'} onCommand={(line, result) => emit(line, result)} />
                  </div>
                )}
                {activeApp === 'powershell' && (
                  <div style={wfShellStyles.consoleWrap}>
                    <PowerShellShell commandMap={psMap} initialCwd={'C:\\Cases\\WF-1'} onCommand={(line, result) => emit(line, result)} elevated />
                  </div>
                )}
                {activeApp === 'notes' && (
                  <div style={wfShellStyles.noteViewer}>
                    <div style={wfShellStyles.sectionLabel}>{openFile || 'Saved Output Preview'}</div>
                    <pre style={wfShellStyles.noteContent}>{fileContent || 'Select an exported file from the right pane to review it here.'}</pre>
                  </div>
                )}
              </div>
              <SavedFilesPane
                files={savedFiles}
                onOpen={name => {
                  setActiveApp('notes');
                  setOpenFile(name);
                  emit(`Open ${name}`, { pager: { name } });
                }}
              />
            </div>
          </div>
        </div>
        <div style={wfShellStyles.taskbar}>Start  |  Event Viewer  |  Command Prompt  |  PowerShell  |  Notes</div>
        <WindowsRunDialog
          open={showRun}
          value={runValue}
          onChange={setRunValue}
          onOk={launchFromRun}
          onCancel={() => setShowRun(false)}
        />
      </div>
    );
  }

  function TimelineExplorerLabShell(props) {
    const { lab, onCommand } = props;
    const data = lab?.toolData || {};
    const timeline = Array.isArray(data.timeline) ? data.timeline : [];
    const [view, setView] = React.useState('timeline');
    const [filter, setFilter] = React.useState('');
    const [selected, setSelected] = React.useState(timeline[0] || null);

    const filtered = timeline.filter(row => {
      if (!filter.trim()) return true;
      const needle = toDateValue(filter);
      return Object.values(row).some(value => toDateValue(value).includes(needle));
    });

    function emit(line, result) {
      if (typeof onCommand === 'function') onCommand(line, result || {}, { cwd: 'C:\\Cases\\WF-3', savedFiles: (result && result.savedFiles) || {} });
    }

    return (
      <div style={wfShellStyles.genericRoot}>
        <div style={wfShellStyles.winTitleBar}>
          <span>Timeline Explorer</span>
          <div style={wfShellStyles.windowButtons}><span>—</span><span>□</span><span>×</span></div>
        </div>
        <div style={wfShellStyles.toolbar}>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => emit('Create Disk Image', { savedFiles: { 'wf3-disk-image.E01': 'synthetic image manifest\n' } })}>Create Disk Image</button>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => emit('Create Autopsy Case')}>Create Case</button>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => emit('Add Image as Data Source')}>Add Data Source</button>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => emit('Locate $MFT')}>Locate $MFT</button>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => emit('Export $MFT', { savedFiles: { '$MFT': 'synthetic-mft\n' } })}>Export $MFT</button>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => emit('Run MFTECmd', { savedFiles: { 'MFTECmd_Output.csv': 'parsed,mft,output\n' } })}>Run MFTECmd</button>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => emit('Load Prefetch Files')}>Prefetch</button>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => emit('Run SBECmd', { savedFiles: { 'Shellbags.csv': 'path,last_accessed\n' } })}>Shellbags</button>
        </div>
        <div style={wfShellStyles.genericLayout}>
          <aside style={wfShellStyles.sideInfo}>
            <div style={wfShellStyles.sectionLabel}>Views</div>
            {[
              ['timeline', 'Timeline'],
              ['autopsy', 'Autopsy'],
              ['prefetch', 'Prefetch'],
              ['shellbags', 'Shellbags'],
            ].map(([id, label]) => (
              <button key={id} type="button" onClick={() => setView(id)} style={{ ...wfShellStyles.navBtn, ...(view === id ? wfShellStyles.navBtnActive : null) }}>{label}</button>
            ))}
            <label style={wfShellStyles.filterBlock}>
              <span>Filter row</span>
              <input value={filter} onChange={event => setFilter(event.target.value)} style={wfShellStyles.formInput} placeholder="Path, artifact, or drive" />
            </label>
            <div style={wfShellStyles.metricBox}>
              <strong>{timeline.length}</strong>
              <span>synthetic MFT rows</span>
            </div>
            <div style={wfShellStyles.metricBox}>
              <strong>{data.prefetch?.length || 0}</strong>
              <span>prefetch records</span>
            </div>
            <div style={wfShellStyles.metricBox}>
              <strong>{data.shellbags?.length || 0}</strong>
              <span>shellbag paths</span>
            </div>
          </aside>
          <section style={wfShellStyles.contentInfo}>
            <div style={wfShellStyles.sectionLabel}>
              {view === 'timeline' ? 'Timeline Explorer Rows' : view === 'autopsy' ? 'Autopsy Key Directories' : view === 'prefetch' ? 'Prefetch Findings' : 'Shellbags Findings'}
            </div>
            {view === 'timeline' && (
              <DataTable
                columns={['FullPath', 'Created0x10', 'Modified0x10', 'EntryNumber', 'Size', 'ZoneId', 'LogFileSeq']}
                rows={filtered}
                selectedRowId={selected?.id}
                onSelectRow={setSelected}
              />
            )}
            {view === 'autopsy' && (
              <DataTable columns={['Directory', 'Purpose']} rows={data.directories || []} compact />
            )}
            {view === 'prefetch' && (
              <DataTable columns={['Executable', 'LastRun', 'RunCount', 'Path']} rows={data.prefetch || []} compact />
            )}
            {view === 'shellbags' && (
              <DataTable columns={['Path', 'LastAccessed', 'User']} rows={data.shellbags || []} compact />
            )}
            <div style={wfShellStyles.detailCard}>
              <div style={wfShellStyles.sectionLabel}>Selected Artifact</div>
              <pre style={wfShellStyles.noteContent}>{selected ? JSON.stringify(selected, null, 2) : 'Select a row to review detailed NTFS metadata.'}</pre>
            </div>
          </section>
        </div>
      </div>
    );
  }

  function BrowserHistoryViewerLabShell(props) {
    const { lab, onCommand } = props;
    const data = lab?.toolData || {};
    const history = Array.isArray(data.history) ? data.history : [];
    const [browserFilter, setBrowserFilter] = React.useState('All');
    const [mode, setMode] = React.useState('history');
    const [selected, setSelected] = React.useState(history[0] || null);

    const filteredHistory = history.filter(row => browserFilter === 'All' || row['Web Browser'] === browserFilter);

    function emit(line, result) {
      if (typeof onCommand === 'function') onCommand(line, result || {}, { cwd: 'C:\\Cases\\WF-4', savedFiles: (result && result.savedFiles) || {} });
    }

    return (
      <div style={wfShellStyles.genericRoot}>
        <div style={wfShellStyles.winTitleBar}>
          <span>BrowserHistoryView</span>
          <div style={wfShellStyles.windowButtons}><span>—</span><span>□</span><span>×</span></div>
        </div>
        <div style={wfShellStyles.toolbar}>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => emit('Open BrowserHistoryViewer')}>Open Tool</button>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => emit('Load History for Chrome and Edge')}>Load History</button>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => emit('Open WebBrowserPassView')}>Passwords</button>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => emit('Locate Cookies Database')}>Cookies DB</button>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => emit('Open Cookies Table in SQLite Browser')}>SQLite Browser</button>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => emit('Load Cache Entries')}>Load Cache</button>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => emit('Open Downloads Table in SQLite Browser')}>Downloads DB</button>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => emit('Export Browser History CSV', { savedFiles: { 'BrowserHistory.csv': toCsv(['URL', 'Title', 'Visit Time', 'Visit Count', 'Visited From', 'Web Browser', 'User Profile', 'URL Length'], filteredHistory) } })}>Export CSV</button>
        </div>
        <div style={wfShellStyles.genericLayout}>
          <aside style={wfShellStyles.sideInfo}>
            <div style={wfShellStyles.sectionLabel}>Browser Filter</div>
            <select value={browserFilter} onChange={event => setBrowserFilter(event.target.value)} style={wfShellStyles.formInput}>
              {['All', 'Chrome', 'Edge'].map(name => <option key={name} value={name}>{name}</option>)}
            </select>
            <div style={wfShellStyles.sectionLabel}>Views</div>
            {[
              ['history', 'History'],
              ['passwords', 'Passwords'],
              ['cookies', 'Cookies'],
              ['cache', 'Cache'],
              ['downloads', 'Downloads'],
            ].map(([id, label]) => (
              <button key={id} type="button" onClick={() => setMode(id)} style={{ ...wfShellStyles.navBtn, ...(mode === id ? wfShellStyles.navBtnActive : null) }}>{label}</button>
            ))}
            <div style={wfShellStyles.metricBox}>
              <strong>{history.length}</strong>
              <span>history rows</span>
            </div>
          </aside>
          <section style={wfShellStyles.contentInfo}>
            {mode === 'history' && (
              <DataTable
                columns={['URL', 'Title', 'Visit Time', 'Visit Count', 'Visited From', 'Web Browser', 'User Profile', 'URL Length']}
                rows={filteredHistory}
                selectedRowId={selected?.id}
                onSelectRow={setSelected}
              />
            )}
            {mode === 'passwords' && <DataTable columns={['Site', 'Username', 'Password']} rows={data.passwords || []} compact />}
            {mode === 'cookies' && <DataTable columns={['Host', 'Name', 'Value', 'Creation', 'Expiry']} rows={data.cookies || []} compact />}
            {mode === 'cache' && <DataTable columns={['URL', 'Cache Type', 'Size', 'Status']} rows={data.cache || []} compact />}
            {mode === 'downloads' && <DataTable columns={['URL', 'Target Path', 'Start Time', 'End Time']} rows={data.downloads || []} compact />}
            <div style={wfShellStyles.detailCard}>
              <div style={wfShellStyles.sectionLabel}>Selected Record</div>
              <pre style={wfShellStyles.noteContent}>{selected ? JSON.stringify(selected, null, 2) : 'Select a record to inspect it.'}</pre>
            </div>
          </section>
        </div>
      </div>
    );
  }

  function FTKImagerLabShell(props) {
    const { lab, onCommand } = props;
    const data = lab?.toolData || {};
    const [mode, setMode] = React.useState('recuva');
    const [selected, setSelected] = React.useState((data.deletedFiles || [])[0] || null);

    function emit(line, result) {
      if (typeof onCommand === 'function') onCommand(line, result || {}, { cwd: 'C:\\Cases\\WF-5', savedFiles: (result && result.savedFiles) || {} });
    }

    return (
      <div style={wfShellStyles.genericRoot}>
        <div style={wfShellStyles.winTitleBar}>
          <span>AccessData FTK Imager</span>
          <div style={wfShellStyles.windowButtons}><span>—</span><span>□</span><span>×</span></div>
        </div>
        <div style={wfShellStyles.toolbar}>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => emit('Open Recuva')}>Recuva</button>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => emit('Select All Files Recovery')}>All Files</button>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => emit('Choose Drive D: for Deleted File Scan')}>Choose Drive</button>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => emit('Start Deleted File Scan')}>Scan</button>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => emit('Recover Selected Files', { savedFiles: { 'Recovered_customer_export.csv': 'name,email,segment\n' } })}>Recover</button>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => emit('Create Disk Image', { savedFiles: { 'wf5-disk-image.E01': 'synthetic image\n' } })}>Create Image</button>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => emit('Create Autopsy Case')}>Autopsy Case</button>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => emit('Filter Deleted Files in File Analysis')}>Deleted Filter</button>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => emit('Extract File Metadata')}>Metadata</button>
          <button type="button" style={wfShellStyles.toolbarBtn} onClick={() => emit('Open System Timeline')}>Timeline</button>
        </div>
        <div style={wfShellStyles.genericLayout}>
          <aside style={wfShellStyles.sideInfo}>
            <div style={wfShellStyles.sectionLabel}>Evidence Tree</div>
            {[
              ['recuva', 'Recuva Queue'],
              ['ftk', '$Recycle.Bin'],
              ['autopsy', 'Autopsy Deleted Files'],
              ['metadata', 'Metadata'],
              ['timeline', 'Timeline'],
            ].map(([id, label]) => (
              <button key={id} type="button" onClick={() => setMode(id)} style={{ ...wfShellStyles.navBtn, ...(mode === id ? wfShellStyles.navBtnActive : null) }}>{label}</button>
            ))}
            <div style={wfShellStyles.metricBox}>
              <strong>{(data.recycleBin || []).length}</strong>
              <span>recycle bin entries</span>
            </div>
          </aside>
          <section style={wfShellStyles.contentInfo}>
            {mode === 'recuva' && <DataTable columns={['Filename', 'Original Path', 'Recovered', 'Confidence']} rows={data.deletedFiles || []} selectedRowId={selected?.id} onSelectRow={setSelected} />}
            {mode === 'ftk' && <DataTable columns={['Entry', 'Type', 'Original Path', 'Deleted Time']} rows={data.recycleBin || []} selectedRowId={selected?.id} onSelectRow={setSelected} />}
            {mode === 'autopsy' && <DataTable columns={['Name', 'Status', 'Path', 'Notes']} rows={data.autopsyDeleted || []} selectedRowId={selected?.id} onSelectRow={setSelected} />}
            {mode === 'metadata' && <DataTable columns={['Filename', 'Created', 'Modified', 'Accessed', 'Size', 'Type']} rows={data.metadata || []} selectedRowId={selected?.id} onSelectRow={setSelected} compact />}
            {mode === 'timeline' && <DataTable columns={['Timestamp', 'Event', 'User', 'Artifact']} rows={data.timeline || []} selectedRowId={selected?.id} onSelectRow={setSelected} compact />}
            <div style={wfShellStyles.detailCard}>
              <div style={wfShellStyles.sectionLabel}>Selected Artifact</div>
              <pre style={wfShellStyles.noteContent}>{selected ? JSON.stringify(selected, null, 2) : 'Select a record to inspect the details.'}</pre>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const wfShellStyles = {
    workstationRoot: { height: '100%', minHeight: 640, display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #0d2f52 0%, #113f6d 100%)', color: '#111827', fontFamily: "'Inter', sans-serif" },
    workstationTop: { flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '108px minmax(0,1fr)', gap: 14, padding: 14 },
    desktopRail: { display: 'flex', flexDirection: 'column', gap: 10 },
    desktopShortcut: { border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 11, padding: '12px 8px', textAlign: 'center', cursor: 'pointer' },
    mainStage: { minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 },
    stageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'rgba(255,255,255,0.94)', padding: '14px 16px' },
    caseEyebrow: { fontSize: 10, letterSpacing: 2, color: '#2563eb', fontWeight: 700 },
    caseTitle: { margin: '6px 0 0', fontSize: 24, lineHeight: 1.1, color: '#111827' },
    caseBadge: { border: '1px solid #bfdbfe', background: '#dbeafe', color: '#1d4ed8', padding: '6px 10px', fontSize: 12, fontWeight: 700 },
    stageBody: { flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 220px', gap: 12 },
    viewerPane: { minWidth: 0, background: '#f8fafc', border: '1px solid #cbd5e1', overflow: 'hidden' },
    savedPane: { background: '#fff', border: '1px solid #cbd5e1', padding: 12, overflow: 'auto' },
    savedEmpty: { color: '#64748b', fontSize: 12 },
    savedFileBtn: { width: '100%', marginBottom: 8, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', textAlign: 'left', padding: '8px 10px', cursor: 'pointer' },
    taskbar: { height: 34, background: '#0f172a', color: '#e2e8f0', display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 12 },
    modalScrim: { position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.48)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
    runDialog: { width: 460, background: '#f8fafc', border: '1px solid #94a3b8', boxShadow: '0 18px 48px rgba(15,23,42,0.4)' },
    runTitleBar: { height: 34, background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', fontSize: 12 },
    modalClose: { border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 16 },
    runBody: { display: 'flex', gap: 14, padding: 18 },
    runIcon: { width: 60, height: 60, border: '1px solid #bfdbfe', background: '#dbeafe', color: '#1d4ed8', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    runText: { fontSize: 12, color: '#334155', marginBottom: 12, lineHeight: 1.5 },
    runLabel: { display: 'grid', gridTemplateColumns: '50px minmax(0,1fr)', alignItems: 'center', gap: 8, fontSize: 12, color: '#334155' },
    runInput: { border: '1px solid #94a3b8', padding: '7px 8px', background: '#fff' },
    runActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '0 18px 18px' },
    primaryBtn: { border: '1px solid #2563eb', background: '#2563eb', color: '#fff', padding: '7px 14px', cursor: 'pointer' },
    secondaryBtn: { border: '1px solid #94a3b8', background: '#fff', color: '#0f172a', padding: '7px 14px', cursor: 'pointer' },
    winAppRoot: { display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' },
    winTitleBar: { height: 34, background: '#f8fafc', borderBottom: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', fontSize: 12, fontWeight: 600 },
    windowButtons: { display: 'flex', gap: 12, color: '#64748b', fontWeight: 400 },
    menuRow: { height: 28, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 16, padding: '0 10px', fontSize: 12, color: '#475569' },
    toolbar: { display: 'flex', flexWrap: 'wrap', gap: 8, padding: 10, borderBottom: '1px solid #e2e8f0', background: '#f8fafc' },
    toolbarBtn: { border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', padding: '6px 10px', fontSize: 12, cursor: 'pointer' },
    eventLayout: { flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '220px minmax(0,1fr)' },
    eventNav: { borderRight: '1px solid #e2e8f0', background: '#f8fafc', padding: 10, overflow: 'auto' },
    sectionLabel: { fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 },
    treeRoot: { fontSize: 12, color: '#0f172a', marginBottom: 8 },
    treeBranch: { fontSize: 12, color: '#334155', marginBottom: 8 },
    treeItem: { width: '100%', border: 'none', background: 'transparent', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', color: '#0f172a', textAlign: 'left' },
    treeItemActive: { background: '#dbeafe', color: '#1d4ed8' },
    treeCount: { color: '#64748b' },
    eventMain: { minWidth: 0, display: 'flex', flexDirection: 'column', padding: 12, gap: 12, overflow: 'auto' },
    filterSummary: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0' },
    filterMeta: { display: 'block', fontSize: 12, color: '#64748b', marginTop: 4 },
    tableWrap: { border: '1px solid #cbd5e1', background: '#fff', overflow: 'auto', maxHeight: 320 },
    tableWrapCompact: { maxHeight: 240 },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
    th: { position: 'sticky', top: 0, background: '#e2e8f0', textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #cbd5e1', whiteSpace: 'nowrap' },
    td: { padding: '8px 10px', borderBottom: '1px solid #e2e8f0', color: '#0f172a', verticalAlign: 'top', whiteSpace: 'nowrap' },
    tr: { cursor: 'pointer' },
    trActive: { background: '#eff6ff' },
    detailCard: { border: '1px solid #cbd5e1', background: '#fff', padding: 12 },
    detailMessage: { fontSize: 12, color: '#334155', lineHeight: 1.6, marginBottom: 10 },
    metaGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 },
    metaBox: { border: '1px solid #e2e8f0', background: '#f8fafc', padding: 10, fontSize: 12, color: '#0f172a' },
    metaLabel: { display: 'block', fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 },
    smallDialog: { width: 360, background: '#fff', border: '1px solid #94a3b8' },
    dialogBody: { padding: 16 },
    formRow: { display: 'grid', gap: 6, fontSize: 12, color: '#334155' },
    formInput: { border: '1px solid #94a3b8', padding: '7px 8px', background: '#fff', width: '100%' },
    consoleWrap: { height: '100%', minHeight: 520, padding: 12, background: '#0f172a' },
    noteViewer: { height: '100%', padding: 12, background: '#fff' },
    noteContent: { whiteSpace: 'pre-wrap', fontSize: 12, lineHeight: 1.6, color: '#0f172a', background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, maxHeight: 340, overflow: 'auto' },
    genericRoot: { height: '100%', minHeight: 640, display: 'flex', flexDirection: 'column', background: '#fff', fontFamily: "'Inter', sans-serif", color: '#111827' },
    genericLayout: { flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '240px minmax(0,1fr)' },
    sideInfo: { borderRight: '1px solid #e2e8f0', background: '#f8fafc', padding: 12, overflow: 'auto' },
    contentInfo: { minWidth: 0, padding: 12, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12 },
    navBtn: { width: '100%', marginBottom: 8, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', padding: '8px 10px', textAlign: 'left', cursor: 'pointer' },
    navBtnActive: { background: '#dbeafe', color: '#1d4ed8', borderColor: '#93c5fd' },
    metricBox: { border: '1px solid #cbd5e1', background: '#fff', padding: 10, marginTop: 10, display: 'grid', gap: 4 },
    filterBlock: { display: 'grid', gap: 6, marginTop: 10, fontSize: 12, color: '#334155' },
  };

  Object.assign(window, {
    WindowsRunDialog,
    EventViewerPlayerShell,
    WindowsEventLogsLabShell,
    TimelineExplorerLabShell,
    BrowserHistoryViewerLabShell,
    FTKImagerLabShell,
  });
})();
