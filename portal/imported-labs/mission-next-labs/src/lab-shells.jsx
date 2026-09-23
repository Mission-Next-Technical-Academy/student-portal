// ============================================================
//  Realistic Lab Shells
// ============================================================

function humanizeTaskField(field) {
  return String(field || 'value').replace(/_/g, ' ');
}

function describeFieldMatch(validation) {
  const field = humanizeTaskField(validation?.field);
  if (validation?.value === undefined) return field;
  return `${field}=${validation.value}`;
}

function getTaskAnswerGuide(task) {
  const validation = task?.validation || {};
  if (validation.type === 'count') {
    if (validation.field === undefined && validation.value === undefined) {
      return {
        label:'Answer: matching event count',
        placeholder:'Enter the number of matching events',
        helper:'Submit the total number of events returned by your current query.',
      };
    }
    return {
      label:`Answer: count for ${describeFieldMatch(validation)}`,
      placeholder:`Enter the count for ${describeFieldMatch(validation)}`,
      helper:`Submit the number of matching events for ${describeFieldMatch(validation)}.`,
    };
  }
  if (validation.type === 'groupby') {
    return {
      label:`Answer: top ${humanizeTaskField(validation.field)} value`,
      placeholder:`Enter the top ${humanizeTaskField(validation.field)} value or its count`,
      helper:`Submit the top ${humanizeTaskField(validation.field)} value from your grouped results, or the count for that top row.`,
    };
  }
  if (validation.type === 'count_gt') {
    return {
      label:`Answer: ${humanizeTaskField(validation.field)} value or count`,
      placeholder:`Enter the ${humanizeTaskField(validation.field)} value being asked, or the matching event count`,
      helper:`Submit the ${humanizeTaskField(validation.field)} value the task is asking for, or the total matching event count when the task asks you to count results.`,
    };
  }
  if (validation.type === 'equals') {
    return {
      label:'Answer: exact value',
      placeholder:'Enter the exact value requested by the task',
      helper:'Submit the exact process, path, IP, or value requested by the task.',
    };
  }
  return {
    label:'Answer',
    placeholder:'Enter your answer',
    helper:'Submit the value supported by your current query results.',
  };
}

function TaskInspector(props) {
  const { mod, activeTask, setActiveTask, taskStatus, task, answer, setAnswer, feedback, hintOpen, setHintOpen, submitAnswer, earnedPoints, totalPoints, children } = props;
  const answerGuide = getTaskAnswerGuide(task);
  return (
    <aside style={rs.taskPane}>
      <div style={rs.taskHead}>Tasks <span>{earnedPoints}/{totalPoints} pts</span></div>
      {mod.tasks.map((item, index) => {
        const active = activeTask === index;
        const done = taskStatus[item.id] === 'correct';
        return (
          <button key={item.id} onClick={() => setActiveTask(index)} style={{ ...rs.taskRow, ...(active ? rs.taskActive : null) }}>
            <span style={{ ...rs.taskNum, background: done ? '#107c10' : active ? '#0078d4' : '#e5e7eb', color: done || active ? '#fff' : '#374151' }}>{done ? '✓' : index + 1}</span>
            <span style={rs.taskName}>{item.title}</span>
          </button>
        );
      })}
      {task && (
        <section style={rs.taskCard}>
          <div style={rs.kicker}>Task {activeTask + 1} of {mod.tasks.length}</div>
          <h2 style={rs.taskTitle}>{task.title}</h2>
          <p style={rs.taskCopy}>{task.description}</p>
          <button onClick={() => setHintOpen(value => !value)} style={rs.linkBtn}>{hintOpen ? 'Hide hint' : 'Show hint'}</button>
          {hintOpen && <pre style={rs.hint}>{task.hint}</pre>}
          {taskStatus[task.id] !== 'correct' && (
            <>
              <label style={rs.label}>{answerGuide.label}<input value={answer} onChange={event => setAnswer(event.target.value)} style={rs.input} placeholder={answerGuide.placeholder} /></label>
              <div style={{ fontSize:12, color:'#6b7280', lineHeight:1.45 }}>{answerGuide.helper}</div>
            </>
          )}
          {feedback && <div style={{ ...rs.feedback, borderColor: feedback.type === 'success' ? '#bbf7d0' : '#fecaca', color: feedback.type === 'success' ? '#107c10' : '#b91c1c' }}>{feedback.msg}</div>}
          {taskStatus[task.id] !== 'correct' && <button onClick={submitAnswer} style={rs.primary}>Submit answer</button>}
          {taskStatus[task.id] === 'correct' && activeTask < mod.tasks.length - 1 && <button onClick={() => setActiveTask(activeTask + 1)} style={rs.primary}>Next task</button>}
        </section>
      )}
      {children}
    </aside>
  );
}

function ActiveDirectoryLabShell(props) {
  const {
    mod,
    onBack,
    displayRows,
    setQuery,
    runQuery,
    selectedEnterpriseItem,
    setSelectedEnterpriseItem,
    enterpriseModal,
    setEnterpriseModal,
    enterpriseContext,
    setEnterpriseContext,
  } = props;
  const [selectedOu, setSelectedOu] = React.useState('ou=users');
  const [created, setCreated] = React.useState([]);
  const [objectOverrides, setObjectOverrides] = React.useState({});
  const [moveTargetOu, setMoveTargetOu] = React.useState('ou=workstations');
  const [propertyDraft, setPropertyDraft] = React.useState({ name:'', description:'' });
  const [desktopFocus, setDesktopFocus] = React.useState('aduc');
  const tree = adTree();

  const directoryRows = [...AD_DIRECTORY_BASE, ...created].map(entry => {
    const merged = { ...entry, distinguishedName: buildDn(entry.name, entry.ou) };
    const overridden = { ...merged, ...(objectOverrides[adKey(merged)] || {}) };
    if (overridden.name || overridden.ou) {
      overridden.distinguishedName = buildDn(overridden.name || merged.name, overridden.ou || merged.ou);
    }
    return overridden;
  });

  const visibleRows = selectedOu === 'dc=corp'
    ? directoryRows
    : directoryRows.filter(row => row.ou === selectedOu);

  const selectedKey = selectedEnterpriseItem ? adKey(selectedEnterpriseItem) : null;
  const selected = visibleRows.find(row => adKey(row) === selectedKey) || selectedEnterpriseItem || visibleRows[0] || directoryRows[0];

  React.useEffect(() => {
    if (selected?.ou && selectedOu !== selected.ou) {
      setSelectedOu(selected.ou);
    }
  }, [selected?.samAccountName]);

  React.useEffect(() => {
    if (enterpriseModal === 'properties' && selected) {
      setPropertyDraft({ name:selected.name || '', description:selected.description || '' });
    }
    if (enterpriseModal === 'move' && selected) {
      setMoveTargetOu(selected.ou === 'ou=workstations' ? 'ou=users' : 'ou=workstations');
    }
  }, [enterpriseModal, selected?.samAccountName]);

  function openContextMenu(event, items) {
    event.preventDefault();
    setEnterpriseContext({ x:event.clientX, y:event.clientY, items });
  }

  function focusOu(ou, focus = 'aduc') {
    setDesktopFocus(focus);
    setSelectedOu(ou);
    const next = directoryRows.find(row => row.ou === ou);
    if (next) setSelectedEnterpriseItem(next);
  }

  function createUser() {
    const user = {
      name:'training.analyst',
      objectClass:'User',
      samAccountName:'training.analyst',
      userPrincipalName:'training.analyst@corp.missionnext.local',
      distinguishedName:`CN=training.analyst,${selectedOu.toUpperCase()},DC=corp,DC=missionnext,DC=local`,
      description:'Created through New Object - User wizard',
      status:'Enabled',
      ou:selectedOu,
    };
    setCreated(items => [user, ...items.filter(item => adKey(item) !== adKey(user))]);
    setSelectedEnterpriseItem(user);
    setSelectedOu(user.ou);
    setDesktopFocus('aduc');
    setEnterpriseModal(null);
  }

  function updateObject(row, changes) {
    const key = adKey(row);
    const next = { ...row, ...changes };
    if (changes.ou) next.distinguishedName = buildDn(next.name, changes.ou);
    if (changes.name && !changes.distinguishedName) next.distinguishedName = buildDn(next.name, next.ou || selectedOu);
    setCreated(items => items.map(item => adKey(item) === key ? next : item));
    setObjectOverrides(items => ({
      ...items,
      [key]: {
        ...(items[key] || {}),
        ...changes,
        ...(changes.ou || changes.name ? { distinguishedName: next.distinguishedName } : {}),
      },
    }));
    setSelectedEnterpriseItem(next);
    if (next.ou) setSelectedOu(next.ou);
  }

  function moveSelected() {
    if (!selected) return;
    updateObject(selected, { ou:moveTargetOu });
    setEnterpriseModal(null);
  }

  function saveProperties() {
    if (!selected) return;
    const nextName = propertyDraft.name.trim() || selected.name;
    updateObject(selected, {
      name:nextName,
      description:propertyDraft.description.trim() || selected.description,
      distinguishedName:buildDn(nextName, selected.ou || selectedOu),
    });
    setEnterpriseModal(null);
  }

  function menuForShortcut(shortcut) {
    return [
      { label:'Open', onClick:() => focusOu(shortcut.ou, shortcut.id) },
      { label:'Pin to Start' },
      { type:'separator' },
      { label:'Properties', onClick:() => setSelectedOu(shortcut.ou) },
    ];
  }

  function menuForTree(node) {
    if (!node?.ou) return [];
    return [
      { label:'Open', onClick:() => focusOu(node.id, 'aduc') },
      { label:'New User', onClick:() => setEnterpriseModal('new-user') },
      { label:'New Group' },
      { type:'separator' },
      { label:'Properties', onClick:() => setSelectedOu(node.id) },
      { label:'Refresh', onClick:runQuery },
    ];
  }

  function menuForRow(row) {
    if (!row) return [];
    const disabled = String(row.status || '').toLowerCase() === 'disabled';
    return [
      { label:'Open', onClick:() => setSelectedEnterpriseItem(row) },
      { label:'Properties', onClick:() => setEnterpriseModal('properties') },
      { type:'separator' },
      { label:'Move...', onClick:() => setEnterpriseModal('move') },
      { label:disabled ? 'Enable Account' : 'Disable Account', onClick:() => updateObject(row, { status: disabled ? 'Enabled' : 'Disabled' }) },
      { label:'Reset Password...', onClick:() => updateObject(row, { pwdLastSet:'Just now', status:'Enabled' }) },
    ];
  }

  const desktopShortcuts = AD_DESKTOP_SHORTCUTS.map(shortcut => ({
    ...shortcut,
    active: desktopFocus === shortcut.id,
  }));
  const evidenceRows = Array.isArray(displayRows) ? displayRows.slice(0, 5) : [];

  return (
    <div style={rs.adRoot}>
      <div style={rs.adWallpaper} />
      <EnterpriseToolbar
        menus={['File', 'Action', 'View', 'Help']}
        actions={[
          { label:'Back', icon:'‹', onClick:onBack },
          { label:'New User', icon:'+', primary:true, onClick:() => setEnterpriseModal('new-user') },
          { label:'Refresh', icon:'↻', onClick:runQuery },
        ]}
        right="Active Directory Users and Computers"
      />
      <div style={rs.pathBar}>Console Root &gt; Active Directory Users and Computers &gt; corp.missionnext.local</div>
      <div style={rs.adGrid}>
        <aside style={rs.desktopRail}>
          <div style={rs.desktopRailTitle}>Desktop</div>
          <div style={rs.desktopShortcutGrid}>
            {desktopShortcuts.map(shortcut => (
              <button
                key={shortcut.id}
                onClick={() => focusOu(shortcut.ou, shortcut.id)}
                onContextMenu={event => openContextMenu(event, menuForShortcut(shortcut))}
                style={{
                  ...rs.desktopShortcut,
                  ...(shortcut.active ? rs.desktopShortcutActive : null),
                }}
              >
                <div style={rs.desktopShortcutIcon}>{shortcut.icon}</div>
                <div style={rs.desktopShortcutLabel}>{shortcut.label}</div>
                <div style={rs.desktopShortcutSub}>{shortcut.description}</div>
              </button>
            ))}
          </div>
          <div style={rs.desktopHint}>
            Right-click objects and OUs to open Windows-style menus.
          </div>
        </aside>

        <section style={rs.adWindow}>
          <div style={rs.adWindowTitleBar}>
            <div style={rs.adWindowTitleCluster}>
              <span style={rs.adAppIcon}>ADUC</span>
              <div>
                <div style={rs.adWindowTitle}>{mod.title}</div>
                <div style={rs.adWindowSub}>corp.missionnext.local - Domain Controller DC01</div>
              </div>
            </div>
            <div style={rs.adWinButtons}>
              <span style={rs.adWinBtn}>-</span>
              <span style={rs.adWinBtn}>□</span>
              <span style={rs.adWinBtn}>×</span>
            </div>
          </div>
          <div style={rs.adMenuBar}>
            {['File', 'Action', 'View', 'Help'].map(item => <span key={item}>{item}</span>)}
          </div>
          <div style={rs.adToolbar}>
            <button onClick={() => setEnterpriseModal('new-user')} style={rs.adToolbarBtn}>New User</button>
            <button onClick={() => setEnterpriseModal('move')} style={rs.adToolbarBtn}>Move</button>
            <button onClick={runQuery} style={rs.adToolbarBtn}>Refresh</button>
            <button onClick={() => setSelectedOu('ou=users')} style={rs.adToolbarBtn}>Users</button>
            <button onClick={() => setSelectedOu('ou=workstations')} style={rs.adToolbarBtn}>Computers</button>
            <span style={rs.adToolbarText}>Right-click any object for Open / Properties / Reset Password</span>
          </div>

          <div style={rs.adConsoleGrid}>
            <aside style={rs.adTreePane}>
              <div style={rs.paneHeader}><strong>Directory</strong><span>{treeLabel(tree, selectedOu)}</span></div>
              <div style={rs.adTreeWrap}>
                <EnterpriseTreeView
                  nodes={tree}
                  selectedId={selectedOu}
                  onSelect={node => node.ou && focusOu(node.id, 'aduc')}
                  onNodeContextMenu={(event, node) => node.ou && openContextMenu(event, menuForTree(node))}
                />
              </div>
            </aside>

            <main style={rs.adListPane}>
              <div style={rs.paneHeader}>
                <strong>{selectedOu === 'dc=corp' ? 'corp.missionnext.local' : treeLabel(tree, selectedOu)}</strong>
                <span>{visibleRows.length} objects</span>
              </div>
              <div style={rs.adSummaryRow}>
                <div style={rs.adSummaryCard}><span>Users</span><strong>{directoryRows.filter(row => row.objectClass === 'User').length}</strong></div>
                <div style={rs.adSummaryCard}><span>Computers</span><strong>{directoryRows.filter(row => row.objectClass === 'Computer').length}</strong></div>
                <div style={rs.adSummaryCard}><span>Groups</span><strong>{directoryRows.filter(row => row.objectClass === 'Group').length}</strong></div>
              </div>
              <EnterpriseDataTable
                columns={[
                  { key:'name', label:'Name', render:(_, row) => (
                    <span style={rs.adNameCell}>
                      <span style={rs.adObjectIcon}>{adIconForObject(row)}</span>
                      <span>{row.name}</span>
                    </span>
                  ) },
                  { key:'objectClass', label:'Type', render:value => <span style={rs.adTypePill}>{value}</span> },
                  { key:'description', label:'Description' },
                  { key:'distinguishedName', label:'Distinguished Name' },
                ]}
                rows={visibleRows}
                rowKey={row => row.samAccountName || row.name}
                selectedKey={selected?.samAccountName || selected?.name}
                onRowClick={row => {
                  setSelectedEnterpriseItem(row);
                  setSelectedOu(row.ou || selectedOu);
                }}
                onRowContextMenu={(event, row) => {
                  setSelectedEnterpriseItem(row);
                  setSelectedOu(row.ou || selectedOu);
                  openContextMenu(event, menuForRow(row));
                }}
              />

              <section style={rs.adEvidenceStrip}>
                <div style={rs.paneHeader}><strong>Recent case evidence</strong><span>static log samples</span></div>
                <EnterpriseDataTable
                  columns={[
                    { key:'tool', label:'Source' },
                    { key:'asset', label:'Target' },
                    { key:'finding', label:'Signal' },
                    { key:'owner', label:'Owner' },
                  ]}
                  rows={evidenceRows}
                  rowKey={(row, index) => row.id || index}
                />
              </section>
            </main>
          </div>
        </section>

        <aside style={rs.adDetailPane}>
          <div style={rs.detailTopBar}>Object Details</div>
          {selected && (
            <EnterpriseDetailPanel
              title={`${selected.name} Properties`}
              subtitle={`${selected.objectClass} in ${treeLabel(tree, selected.ou || selectedOu)}`}
              fields={[
                { label:'User logon name', value:selected.userPrincipalName || selected.samAccountName },
                { label:'Object class', value:selected.objectClass },
                { label:'Organizational Unit', value:treeLabel(tree, selected.ou || selectedOu) },
                { label:'Distinguished name', value:selected.distinguishedName },
                { label:'Account status', value:selected.status || 'Enabled' },
              ]}
            />
          )}
          <div style={rs.adAuditPane}>
            <div style={rs.paneHeader}><strong>Audit trail</strong><span>case reference</span></div>
            <div style={rs.adAuditBody}>
              {evidenceRows.map((row, index) => (
                <div key={`${row.tool}-${index}`} style={rs.adAuditCard}>
                  <div style={rs.adAuditCardTitle}>{row.tool}</div>
                  <div style={rs.adAuditCardBody}>{row.finding}</div>
                  <div style={rs.adAuditCardMeta}>{row.asset} - {row.owner}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <footer style={rs.adTaskbar}>
        <button onClick={onBack} style={rs.adStartBtn}>⊞ Start</button>
        <div style={rs.adTaskItem}>Active Directory Users and Computers</div>
        <div style={rs.adTaskSpacer} />
        <span style={rs.adTaskClock}>DC01 09:14</span>
      </footer>

      <EnterpriseContextMenu
        {...(enterpriseContext || {})}
        onClose={() => setEnterpriseContext(null)}
        items={enterpriseContext?.items || []}
      />
      <EnterpriseModalForm
        title={enterpriseModal === 'new-user' ? 'New Object - User' : enterpriseModal === 'move' ? 'Move Object' : enterpriseModal === 'properties' ? `${selected?.name || 'Object'} Properties` : null}
        primaryLabel={enterpriseModal === 'new-user' ? 'Create' : 'OK'}
        onSubmit={enterpriseModal === 'new-user' ? createUser : enterpriseModal === 'move' ? moveSelected : enterpriseModal === 'properties' ? saveProperties : () => setEnterpriseModal(null)}
        onCancel={() => setEnterpriseModal(null)}
      >
        {enterpriseModal === 'new-user' && (
          <>
            <div>Create in: {treeLabel(tree, selectedOu)}</div>
            <label style={rs.label}>First name<input style={rs.input} defaultValue="Training" /></label>
            <label style={rs.label}>User logon name<input style={rs.input} defaultValue="training.analyst" /></label>
            <label style={rs.label}>User logon name (pre-Windows 2000)<input style={rs.input} defaultValue="CORP\\training.analyst" /></label>
          </>
        )}
        {enterpriseModal === 'move' && (
          <>
            <div>Select the container where you want to move this object.</div>
            <EnterpriseTreeView nodes={tree} selectedId={moveTargetOu} onSelect={node => node.ou && setMoveTargetOu(node.id)} />
          </>
        )}
        {enterpriseModal === 'properties' && selected && (
          <>
            <div style={rs.tabs}><span>General</span><span>Account</span><span>Member Of</span><span>Organization</span></div>
            <label style={rs.label}>Display name<input style={rs.input} value={propertyDraft.name} onChange={event => setPropertyDraft(draft => ({ ...draft, name:event.target.value }))} /></label>
            <label style={rs.label}>Description<input style={rs.input} value={propertyDraft.description} onChange={event => setPropertyDraft(draft => ({ ...draft, description:event.target.value }))} /></label>
            <div style={rs.statusLine}>Account status: {selected.status || 'Enabled'}{selected.pwdLastSet ? ` · Password reset: ${selected.pwdLastSet}` : ''}</div>
          </>
        )}
      </EnterpriseModalForm>
    </div>
  );
}

function SplunkLabShell(props) {
  const { mod, onBack, query, setQuery, runQuery, handleKeyDown, running, displayRows, columns, results, timeline, maxCount, inputRef } = props;
  const modFields = Array.isArray(mod?.fields) ? mod.fields : [];
  const modLogs = Array.isArray(mod?.logs) ? mod.logs : [];
  const fields = modFields.map(name => ({ name, count:new Set(displayRows.map(row => row[name]).filter(Boolean)).size })).filter(field => field.count);
  const selectedFields = fields.slice(0, 8);
  const defaultFields = ['host', 'source', 'sourcetype', '_time'].map(name => ({ name, count:displayRows.length || modLogs.length || 0 }));
  const queryHelpers = [
    `index=missionnext sourcetype=${modFields[2] || 'events'}`,
    `search ${modFields[1] || modFields[0] || 'field'}=`,
    `stats count by ${modFields[2] || modFields[1] || 'field'}`,
  ];
  const visibleRows = displayRows.slice(0, 80);
  const timeRangeLabel = timeline.length > 0 ? `${timeline[0][0]} to ${timeline[timeline.length - 1][0]}` : 'All time';
  const [columnWidths, setColumnWidths] = React.useState({});
  const resizeStateRef = React.useRef(null);

  React.useEffect(() => {
    setColumnWidths(current => {
      const next = {};
      columns.forEach(col => {
        if (current[col]) next[col] = current[col];
      });
      return next;
    });
  }, [columns]);

  React.useEffect(() => {
    function handlePointerMove(event) {
      const resizeState = resizeStateRef.current;
      if (!resizeState) return;
      const nextWidth = Math.max(120, resizeState.startWidth + (event.clientX - resizeState.startX));
      setColumnWidths(current => ({ ...current, [resizeState.column]: nextWidth }));
    }

    function stopResize() {
      resizeStateRef.current = null;
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopResize);
    window.addEventListener('pointercancel', stopResize);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopResize);
      window.removeEventListener('pointercancel', stopResize);
    };
  }, []);

  function startColumnResize(event, column) {
    event.preventDefault();
    event.stopPropagation();
    resizeStateRef.current = {
      column,
      startX: event.clientX,
      startWidth: columnWidths[column] || 180,
    };
  }

  return (
    <div style={rs.splunkRoot}>
      <header style={rs.splunkTop}>
        <div style={rs.splunkBrand}>
          <button onClick={onBack} style={rs.darkBack}>‹</button>
          <div style={rs.splunkWordmark}>splunk&gt;</div>
          <span style={rs.splunkProduct}>enterprise</span>
        </div>
        <nav style={rs.splunkNav}>
          <strong style={rs.splunkNavActive}>Search &amp; Reporting</strong>
          <span>Dashboards</span>
          <span>Reports</span>
          <span>Alerts</span>
          <span>Settings</span>
        </nav>
        <div style={rs.splunkTopMeta}>
          <span>Activity</span>
          <span>admin</span>
        </div>
      </header>
      <section style={rs.searchBar}>
        <div style={rs.splunkSearchMeta}>
          <span style={rs.splunkDataset}>Search</span>
          <span style={rs.splunkMetaText}>Dataset: {mod.title}</span>
          <span style={rs.splunkMetaText}>Range: {timeRangeLabel}</span>
        </div>
        <div style={rs.splunkSearchRow}>
          <input ref={inputRef} value={query} onChange={event => setQuery(event.target.value)} onKeyDown={handleKeyDown} style={rs.splunkInput} placeholder={`index=missionnext sourcetype=${modFields[2] || 'events'} | stats count by ${modFields[1] || modFields[0] || 'field'}`} />
          <select style={rs.select} defaultValue="24h"><option value="24h">Last 24 hours</option><option value="7d">Last 7 days</option><option value="all">All time</option></select>
          <button onClick={runQuery} disabled={running} style={rs.splunkRun}>{running ? 'Running...' : 'Search'}</button>
        </div>
        <div style={rs.splunkHelperRow}>
          {queryHelpers.map(item => (
            <button key={item} onClick={() => setQuery(item)} style={rs.splunkHelperChip}>{item}</button>
          ))}
        </div>
      </section>
      <section style={rs.splunkSubnav}>
        <span style={rs.splunkSubnavActive}>New Search</span>
        <span>Save As</span>
        <span>Create Table View</span>
        <span>Open in Search</span>
        <span>Job Inspector</span>
      </section>
      <div style={rs.splunkBody}>
        <aside style={rs.fieldsPane}>
          <div style={rs.splunkPaneTitle}>Fields</div>
          <div style={rs.splunkPaneSection}>
            <div style={rs.splunkSectionTitle}>Selected Fields</div>
            {selectedFields.map(field => (
              <button key={field.name} onClick={() => setQuery(query ? `${query} ${field.name}=` : `search ${field.name}=`)} style={rs.fieldBtn}>
                <span>{field.name}</span>
                <span>{field.count}</span>
              </button>
            ))}
          </div>
          <div style={rs.splunkPaneSection}>
            <div style={rs.splunkSectionTitle}>Default Fields</div>
            {defaultFields.map(field => (
              <div key={field.name} style={rs.splunkFieldStatic}>
                <span>{field.name}</span>
                <span>{field.count}</span>
              </div>
            ))}
          </div>
        </aside>
        <main style={rs.resultsPane}>
          <div style={rs.resultsHeader}>
            <div>
              <div style={rs.splunkResultsKicker}>Search job completed</div>
              <strong>{displayRows.length} events</strong>
              {results?.error && <span style={rs.error}>{results.error}</span>}
            </div>
            <div style={rs.splunkStatusPills}>
              <span style={rs.splunkStatusPill}>Verbose</span>
              <span style={rs.splunkStatusPill}>No Event Sampling</span>
            </div>
          </div>
          <div style={rs.splunkResultTabs}>
            {['Events', 'Patterns', 'Statistics', 'Visualization'].map(tab => (
              <span key={tab} style={tab === 'Events' ? rs.splunkTabActive : rs.splunkTab}>{tab}</span>
            ))}
          </div>
          <div style={rs.timelineWrap}>
            <div style={rs.splunkTimelineHead}>
              <span>Events Timeline</span>
              <span>{timeline.length} buckets</span>
            </div>
            <div style={rs.timeline}>
              {timeline.map(([label, count]) => (
                <div key={label} style={rs.splunkTimelineBarWrap}>
                  <div title={`${label}: ${count}`} style={{ ...rs.bar, height:`${Math.max(4, Math.round((count / maxCount) * 52))}px` }} />
                </div>
              ))}
            </div>
          </div>
          <div style={rs.splunkTableWrap}>
            <table style={rs.splunkTable}>
              <colgroup>
                {columns.map(col => <col key={col} style={{ width:columnWidths[col] || 180 }} />)}
              </colgroup>
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col} style={rs.splunkTh}>
                      <div style={rs.splunkThInner}>
                        <span>{col}</span>
                        <button
                          type="button"
                          aria-label={`Resize ${col} column`}
                          onPointerDown={event => startColumnResize(event, col)}
                          style={rs.splunkResizeHandle}
                        />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, index) => (
                  <tr key={row.id || index} style={index % 2 === 0 ? rs.splunkTr : rs.splunkTrAlt}>
                    {columns.map(col => <td key={col} style={rs.splunkTd}>{String(row[col] ?? '')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            {!visibleRows.length && <div style={rs.splunkEmpty}>No events returned for the current search.</div>}
          </div>
        </main>
        <div style={rs.splunkTaskRail}>
          <div style={rs.splunkTaskBrief}>
            <div style={rs.splunkPaneTitle}>Module Brief</div>
            <div style={rs.splunkBriefTitle}>{mod.subtitle || mod.title}</div>
            <p style={rs.splunkBriefCopy}>{mod.description}</p>
          </div>
          <TaskInspector {...props} />
        </div>
      </div>
    </div>
  );
}

function ServiceNowLabShell(props) {
  const { mod, onBack, displayRows, selectedEnterpriseItem, setSelectedEnterpriseItem } = props;
  const [recordOverrides, setRecordOverrides] = React.useState({});
  const [resolution, setResolution] = React.useState({ code:'Solved (Work Around)', notes:'' });
  const [formMessage, setFormMessage] = React.useState(null);
  const records = displayRows.map(row => serviceNowRecord({ ...row, ...(recordOverrides[row.id] || {}) }));
  const selected = records.find(row => row.id === selectedEnterpriseItem?.id) || records[0];

  React.useEffect(() => {
    if (selected) {
      setResolution({ code:selected.close_code || 'Solved (Work Around)', notes:selected.close_notes || '' });
      setFormMessage(null);
    }
  }, [selected?.id]);

  function updateSelected(changes) {
    if (!selected) return;
    setRecordOverrides(items => ({ ...items, [selected.id]: { ...(items[selected.id] || {}), ...changes } }));
    setSelectedEnterpriseItem({ ...selected, ...changes });
  }

  function advanceState(nextState) {
    if (!selected) return;
    if (nextState === 'Resolved' && !resolution.notes.trim()) {
      setFormMessage({ type:'error', text:'Close notes are required before resolving an incident.' });
      return;
    }
    updateSelected({
      status:nextState,
      close_code:nextState === 'Resolved' ? resolution.code : selected.close_code,
      close_notes:nextState === 'Resolved' ? resolution.notes : selected.close_notes,
      resolved_at:nextState === 'Resolved' ? '2024-02-10 10:12:00' : selected.resolved_at,
    });
    setFormMessage({ type:'success', text:`State updated to ${nextState}.` });
  }

  return (
    <div style={rs.snowRoot}>
      <aside style={rs.snowNav}><button onClick={onBack} style={rs.snowBack}>All training paths</button><input style={rs.navFilter} placeholder="Filter navigator" />{['Self-Service', 'Incident', 'Problem', 'Change', 'Reports', 'System Definition'].map(item => <button key={item} style={rs.navItem}>{item}</button>)}</aside>
      <main style={rs.snowMain}>
        <header style={rs.snowHead}><strong>{mod.title}</strong><button style={rs.newBtn}>New</button></header>
        <div style={rs.snowWorkspace}>
          <section style={rs.snowList}><div style={rs.listCtrl}>All &gt; Active = true <span>{records.length} records</span></div><EnterpriseDataTable columns={[{ key:'number', label:'Number' }, { key:'asset', label:'Configuration item' }, { key:'severity', label:'Priority' }, { key:'status', label:'State' }, { key:'owner', label:'Assignment group' }, { key:'finding', label:'Short description' }]} rows={records} rowKey={row => row.id} selectedKey={selected?.id} onRowClick={row => setSelectedEnterpriseItem(row)} /></section>
          {selected && <section style={rs.snowForm}><div style={rs.formBar}><h1 style={rs.formTitle}>Incident {selected.number}</h1><div style={rs.stateButtons}><button onClick={() => advanceState('In Progress')} style={rs.secondary}>Start work</button><button onClick={() => advanceState('On Hold')} style={rs.secondary}>On Hold</button><button onClick={() => advanceState('Resolved')} style={rs.primary}>Resolve</button></div></div><div style={rs.formGrid}>{[['Number', selected.number], ['Caller', 'SOC Analyst'], ['Category', 'Security'], ['State', selected.status], ['Priority', selected.severity], ['Assignment group', selected.owner], ['Configuration item', selected.asset], ['Short description', selected.finding]].map(([label, value]) => <label key={label} style={rs.label}>{label}<input style={rs.input} value={value} readOnly /></label>)}</div><label style={rs.label}>Close code<select style={rs.input} value={resolution.code} onChange={event => setResolution(item => ({ ...item, code:event.target.value }))}><option>Solved (Permanently)</option><option>Solved (Work Around)</option><option>Not Solved (Not Reproducible)</option></select></label><label style={rs.label}>Close notes<textarea style={rs.notes} value={resolution.notes} onChange={event => setResolution(item => ({ ...item, notes:event.target.value }))} placeholder="Document remediation evidence before resolving." /></label>{formMessage && <div style={{ ...rs.feedback, borderColor:formMessage.type === 'success' ? '#bbf7d0' : '#fecaca', color:formMessage.type === 'success' ? '#107c10' : '#b91c1c' }}>{formMessage.text}</div>}<textarea style={rs.notes} readOnly value={`Work notes\nEvidence reviewed in ${selected.tool}. Action required for ${selected.finding}.${selected.resolved_at ? `\nResolved at ${selected.resolved_at}: ${selected.close_notes}` : ''}`} /></section>}
        </div>
      </main>
      <TaskInspector {...props} />
    </div>
  );
}

function AzureLabShell(props) {
  const { mod, onBack, displayRows, selectedEnterpriseItem, setSelectedEnterpriseItem } = props;
  const selected = selectedEnterpriseItem || displayRows[0];
  const high = displayRows.filter(row => row.severity === 'High').length;
  const open = displayRows.filter(row => row.status === 'open').length;
  return (
    <div style={rs.azureRoot}>
      <aside style={rs.azureNav}><button onClick={onBack} style={rs.azureHome}>☰ Home</button>{['Create a resource', 'Dashboard', 'All services', 'Microsoft Defender for Cloud', 'Virtual machines', 'Storage accounts', 'Microsoft Entra ID'].map(item => <button key={item} style={rs.azureNavItem}>{item}</button>)}</aside>
      <main style={rs.azureMain}>
        <header style={rs.azureHead}><div><div style={rs.crumbs}>Home &gt; Defender for Cloud &gt; Security recommendations</div><h1 style={rs.azureTitle}>{mod.title}</h1></div><input style={rs.azureSearch} placeholder="Search resources, services, and docs" /></header>
        <div style={rs.metrics}>{[['Secure score', `${Math.max(42, 92 - high * 8)}%`], ['High severity recommendations', high], ['Open resources', open], ['Subscription', 'SOC-Training']].map(([label, value]) => <div key={label} style={rs.metric}><span>{label}</span><strong>{value}</strong></div>)}</div>
        <div style={rs.azureBlades}>
          <section style={rs.blade}><div style={rs.bladeTitle}>Resources</div><EnterpriseDataTable columns={[{ key:'asset', label:'Name' }, { key:'tool', label:'Type' }, { key:'severity', label:'Severity' }, { key:'status', label:'Status' }, { key:'finding', label:'Recommendation' }]} rows={displayRows} rowKey={(row, index) => row.id || index} selectedKey={selected?.id} onRowClick={row => setSelectedEnterpriseItem(row)} /></section>
          {selected && <section style={rs.detailBlade}><div style={rs.bladeTitle}>{selected.asset}</div><div style={rs.azureTabs}><span>Overview</span><span>Activity log</span><span>Access control (IAM)</span><span>Tags</span></div><EnterpriseDetailPanel title={selected.finding} subtitle={selected.tool} fields={[{ label:'Resource group', value:'rg-soc-training' }, { label:'Location', value:'East US' }, { label:'Severity', value:selected.severity }, { label:'Provisioning state', value:selected.status }, { label:'Owner', value:selected.owner }]} /></section>}
        </div>
      </main>
      <TaskInspector {...props} />
    </div>
  );
}

function LabCheckpointQuiz({ questions, storageKey, title = 'Lab Checkpoint', passThreshold = 4, onPass, renderTrigger }) {
  const total = questions.length;
  const [quizOpen, setQuizOpen] = React.useState(false);
  const [quizAnswers, setQuizAnswers] = React.useState({});
  const [quizResult, setQuizResult] = React.useState(null);
  const [quizStep, setQuizStep] = React.useState(0);
  const [quizFeedback, setQuizFeedback] = React.useState(null);
  const [dragOffset, setDragOffset] = React.useState(0);
  const dragRef = React.useRef(null);
  const onPassRef = React.useRef(onPass);
  onPassRef.current = onPass;

  React.useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      if (saved.answers && typeof saved.answers === 'object') setQuizAnswers(saved.answers);
      if (saved.result) setQuizResult(saved.result);
      if (typeof saved.open === 'boolean') setQuizOpen(saved.open);
      if (typeof saved.step === 'number') setQuizStep(saved.step);
      if (saved.feedback) setQuizFeedback(saved.feedback);
    } catch {}
  }, [storageKey]);

  React.useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        answers:quizAnswers, result:quizResult, open:quizOpen, step:quizStep, feedback:quizFeedback,
      }));
    } catch {}
  }, [quizAnswers, quizResult, quizOpen, quizStep, quizFeedback, storageKey]);

  const activeQuestion = questions[quizStep] || questions[0];
  const answeredCount = questions.reduce((n, q) => n + (quizAnswers[q.id]?.submitted ? 1 : 0), 0);
  const allAnswered = answeredCount === total;
  const answerState = quizAnswers[activeQuestion.id] || null;
  const selectedValue = answerState?.selected || '';
  const lockedAnswer = !!answerState?.submitted;
  const isCorrect = answerState?.submitted && answerState?.selected === activeQuestion.correct;

  function selectAnswer(option) {
    if (lockedAnswer) return;
    setQuizAnswers(current => ({ ...current, [activeQuestion.id]:{ selected:option, submitted:false, correct:false } }));
    setQuizResult(null);
    setQuizFeedback(null);
  }

  function submitCurrentQuestion() {
    if (!selectedValue) {
      setQuizFeedback({ type:'error', text:'Select an answer before submitting.' });
      return;
    }
    const correct = selectedValue === activeQuestion.correct;
    setQuizAnswers(current => ({
      ...current,
      [activeQuestion.id]:{ selected:selectedValue, submitted:true, correct },
    }));
    setQuizFeedback(correct
      ? { type:'success', text:'Correct. Use NEXT to continue.' }
      : { type:'hint', text:activeQuestion.hint || 'Review the visible events and try again.' });
  }

  function unlockCurrentQuestion() {
    setQuizAnswers(current => ({
      ...current,
      [activeQuestion.id]:{ selected:'', submitted:false, correct:false },
    }));
    setQuizFeedback(null);
  }

  function submitQuiz() {
    const score = questions.reduce((sum, q) => sum + (quizAnswers[q.id]?.correct ? 1 : 0), 0);
    const next = { score, total };
    setQuizResult(next);
    if (score >= passThreshold && typeof onPassRef.current === 'function') {
      onPassRef.current(next);
    }
  }

  function onDragStart(event) {
    if (event.target.closest('[data-no-drag]')) return;
    dragRef.current = { startY:event.clientY, lastY:event.clientY, lastTime:Date.now(), pointerId:event.pointerId };
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch {}
  }
  function onDragMove(event) {
    if (!dragRef.current) return;
    dragRef.current.lastY = event.clientY;
    dragRef.current.lastTime = Date.now();
    setDragOffset(Math.max(0, event.clientY - dragRef.current.startY));
  }
  function onDragEnd(event) {
    if (!dragRef.current) return;
    const { startY, lastY, lastTime, pointerId } = dragRef.current;
    const delta = (event.clientY ?? lastY) - startY;
    const elapsed = Math.max(1, Date.now() - lastTime);
    const velocity = delta / elapsed;
    try { event.currentTarget.releasePointerCapture(pointerId); } catch {}
    dragRef.current = null;
    if (delta > 140 || velocity > 0.6) setQuizOpen(false);
    setDragOffset(0);
  }

  function optionStyle(option) {
    if (!lockedAnswer) return rs.snowQuizOption;
    const isChosen = selectedValue === option;
    const isCorrect = option === activeQuestion.correct;
    if (isChosen && isCorrect) return { ...rs.snowQuizOption, ...rs.snowQuizOptionCorrect };
    if (isChosen && !isCorrect) return { ...rs.snowQuizOption, ...rs.snowQuizOptionWrong };
    if (!isChosen && isCorrect) return { ...rs.snowQuizOption, ...rs.snowQuizOptionReveal };
    return { ...rs.snowQuizOption, opacity:0.6 };
  }

  const ticketNumber = `INC00${String(Math.abs((storageKey || title).split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)) % 90000 + 10000)}`;
  const ticketState = quizResult
    ? (quizResult.score >= passThreshold ? 'Resolved' : 'Work In Progress')
    : (answeredCount > 0 ? 'In Progress' : 'New');

  return (
    <>
      {typeof renderTrigger === 'function' && renderTrigger(() => setQuizOpen(value => !value), quizOpen)}
      {ReactDOM.createPortal(
        <section
        aria-hidden={!quizOpen}
        style={{
          ...rs.snowQuizDrawer,
          ...rs.snowQuizDrawerOpen,
          transform: quizOpen ? `translateY(${dragOffset}px)` : 'translateY(calc(100% + 40px))',
          opacity: quizOpen ? 1 : 0,
          pointerEvents: quizOpen ? 'auto' : 'none',
          transition: dragRef.current
            ? 'none'
            : 'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.28s ease',
        }}
      >
        <div
          style={rs.snowQuizHeadDrag}
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        >
          <div style={rs.snowQuizGrip} />
          <div style={rs.snowQuizHead}>
            <div style={rs.snowQuizBrand}>
              <div>
                <div style={rs.snowQuizBreadcrumb}>Self-Service &gt; Incident &gt; Resolve</div>
                <div style={rs.snowQuizTitleRow}>
                  <span style={rs.snowQuizNumber}>{ticketNumber}</span>
                  <span style={{ ...rs.snowQuizStatePill, ...(ticketState === 'Resolved' ? rs.snowQuizStatePillResolved : ticketState === 'In Progress' || ticketState === 'Work In Progress' ? rs.snowQuizStatePillProgress : rs.snowQuizStatePillNew) }}>{ticketState}</span>
                </div>
                <div style={rs.snowQuizTitle}>{title}</div>
                <div style={rs.snowQuizSub}>Complete the verification questions below and submit to resolve this ticket.</div>
              </div>
            </div>
            <div style={rs.snowQuizActions} data-no-drag>
              <button type="button" onClick={() => setQuizOpen(false)} style={rs.snowQuizCloseBtn}>Close</button>
            </div>
          </div>
        </div>
        <div style={rs.snowQuizBody}>
          <div style={rs.snowQuizCard}>
            <div style={rs.snowQuizFieldLabel}>Work note {quizStep + 1} of {total}</div>
            <div style={rs.snowQuizPrompt}>{activeQuestion.prompt}</div>
            <div style={rs.snowQuizOptions}>
              {activeQuestion.options.map(option => (
                <label key={option} style={optionStyle(option)}>
                  <input
                    type="radio"
                    name={activeQuestion.id}
                    checked={selectedValue === option}
                    disabled={lockedAnswer}
                    onChange={() => selectAnswer(option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            {quizFeedback && (
              <div style={{
                ...rs.snowQuizResult,
                ...(quizFeedback.type === 'success' ? rs.snowQuizResultPass : quizFeedback.type === 'hint' ? rs.snowQuizResultHint : rs.snowQuizResultFail),
                marginTop:14,
              }}>
                {quizFeedback.text}
              </div>
            )}
          </div>
          {quizResult && (
            <div style={{ ...rs.snowQuizResult, ...(quizResult.score >= passThreshold ? rs.snowQuizResultPass : rs.snowQuizResultFail) }}>
              {quizResult.score >= passThreshold
                ? `Close notes: Verification complete (${quizResult.score}/${quizResult.total}). Ticket ${ticketNumber} resolved and lab marked complete.`
                : `Close notes: ${quizResult.score}/${quizResult.total} correct. Reach ${passThreshold} correct to resolve this ticket.`}
            </div>
          )}
        </div>
        <div style={rs.snowQuizFoot}>
          <button
            type="button"
            onClick={() => {
              setQuizFeedback(null);
              setQuizStep(step => Math.max(0, step - 1));
            }}
            disabled={quizStep === 0}
            style={{ ...rs.snowQuizSecondary, opacity:quizStep === 0 ? 0.4 : 1 }}
          >
            Previous
          </button>
          {!lockedAnswer && (
            <button type="button" onClick={submitCurrentQuestion} style={rs.snowQuizPrimary}>Submit</button>
          )}
          {lockedAnswer && !isCorrect && (
            <button type="button" onClick={unlockCurrentQuestion} style={rs.snowQuizSecondary}>Try again</button>
          )}
          <button
            type="button"
            onClick={() => {
              setQuizFeedback(null);
              setQuizStep(step => Math.min(total - 1, step + 1));
            }}
            disabled={!isCorrect || quizStep === total - 1}
            style={{ ...rs.snowQuizSecondary, opacity:!isCorrect || quizStep === total - 1 ? 0.4 : 1 }}
          >
            Next
          </button>
          {allAnswered && !quizResult && (
            <button type="button" onClick={submitQuiz} style={rs.snowQuizResolveBtn}>Resolve ticket</button>
          )}
        </div>
      </section>,
        document.body
      )}
    </>
  );
}

function EventViewerLabShell(props) {
  const { mod, onBack, completeTasksFromShell, taskStatus, user } = props;
  const viewer = mod?.viewer || {};
  const events = Array.isArray(mod?.logs) ? mod.logs : [];
  const channels = Array.isArray(viewer.channels) && viewer.channels.length
    ? viewer.channels
    : ['Application', 'Security', 'Setup', 'System', 'Forwarded Events'].map(id => ({ id, count:events.filter(event => event.logName === id).length }));
  const [selectedChannel, setSelectedChannel] = React.useState('Security');
  const [eventIdFilter, setEventIdFilter] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedEventId, setSelectedEventId] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('General');
  const [activeExercise, setActiveExercise] = React.useState(0);
  const [selectedQueryId, setSelectedQueryId] = React.useState(viewer.lpsQueries?.[0]?.id || '');
  const allTasksComplete = Array.isArray(mod?.tasks) && mod.tasks.length > 0 && mod.tasks.every(task => taskStatus?.[task.id] === 'correct');
  const quizStorageKey = React.useMemo(() => `b2b-quiz-${user?.username || 'student'}-${mod?.id || 'lab'}`, [user?.username, mod?.id]);

  const filteredEvents = events.filter(event => {
    if (event.logName !== selectedChannel) return false;
    if (eventIdFilter && String(event.eventId) !== String(eventIdFilter).trim()) return false;
    if (!searchTerm.trim()) return true;
    const needle = searchTerm.trim().toLowerCase();
    return [event.user, event.computer, event.sourceIp, event.message, event.source, event.taskCategory, event.processId, event.recordId, ...Object.values(event.details || {})]
      .some(value => String(value || '').toLowerCase().includes(needle));
  });

  React.useEffect(() => {
    const first = filteredEvents[0];
    setSelectedEventId(current => filteredEvents.some(event => event.id === current) ? current : first?.id || null);
  }, [selectedChannel, eventIdFilter, searchTerm, mod?.id]);

  const selectedEvent = filteredEvents.find(event => event.id === selectedEventId) || filteredEvents[0] || null;
  const exercise = viewer.exercises?.[activeExercise] || null;
  const selectedQuery = viewer.lpsQueries?.find(query => query.id === selectedQueryId) || viewer.lpsQueries?.[0] || null;
  const failedLogons = events.filter(event => event.logName === 'Security' && Number(event.eventId) === 4625);
  const failedBySource = Object.entries(failedLogons.reduce((acc, event) => {
    const key = event.sourceIp || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]);
  const correlatedSequence = events.filter(event =>
    event.logName === 'Security' &&
    event.user === 'j.sanders' &&
    [4625, 4624, 4688].includes(Number(event.eventId))
  );
  const quizQuestions = [
    {
      id:'q1',
      prompt:'Which Event ID in this lab represents a failed logon attempt?',
      options:['4624', '4625', '4719', '4732'],
      correct:'4625',
      hint:'Filter the Security log to failed authentication activity.',
    },
    {
      id:'q2',
      prompt:'Which source IP is responsible for the repeated failed logons against j.sanders?',
      options:['10.10.24.5', '10.10.24.19', '172.16.1.20', '127.0.0.1'],
      correct:'10.10.24.19',
      hint:'Search the failed `4625` events for `j.sanders` and compare the repeated IP address.',
    },
    {
      id:'q3',
      prompt:'Which sequence best matches the authentication pattern shown in the Security log?',
      options:[
        'A successful logon followed by three failed logons',
        'Three failed logons followed by a successful logon',
        'A policy change followed by four failed logons',
        'Two failed logons followed by account creation',
      ],
      correct:'Three failed logons followed by a successful logon',
      hint:'Look at the timestamps around the cluster of failed `4625` events and the later `4624`.',
    },
    {
      id:'q4',
      prompt:'Which Event ID in the lab reflects an audit policy change?',
      options:['4624', '4672', '4719', '6005'],
      correct:'4719',
      hint:'Check the `DC-01` Security events for audit policy activity rather than normal logons.',
    },
    {
      id:'q5',
      prompt:'After the successful j.sanders logon, which PowerShell process ID appears in the Security log process-creation event?',
      options:['0x1f40', '0x03e8', '0x08bc', '0x2a10'],
      correct:'0x1f40',
      hint:'Search Security events for process creation immediately after the successful `4624` logon.',
    },
  ];

  function pickChannel(channelId) {
    setSelectedChannel(channelId);
    setActiveTab('General');
    if (channelId === 'System') setActiveExercise(0);
    if (channelId === 'Security') setActiveExercise(value => Math.max(value, 1));
  }

  function levelColor(level) {
    if (level === 'Error') return '#c50f1f';
    if (level === 'Warning') return '#986f0b';
    return '#107c10';
  }

  function handleQuizPass(result) {
    if (!allTasksComplete && typeof completeTasksFromShell === 'function') {
      completeTasksFromShell(
        (mod?.tasks || []).map(task => task.id),
        { feedback:`Quiz passed (${result.score}/${result.total}). Lab marked complete.` }
      );
    }
  }

  return (
    <div style={rs.evRoot}>
      <header style={rs.evTitleBar}>
        <div style={rs.evTitleCluster}>
          <button onClick={onBack} style={rs.evBack}>‹</button>
          <div>
            <div style={rs.evAppTitle}>Event Viewer</div>
            <div style={rs.evAppSub}>{viewer.computer || 'Event Viewer (Local)'}</div>
          </div>
        </div>
        <div style={rs.evWinButtons}>
          <span style={rs.evWinBtn}>—</span>
          <span style={rs.evWinBtn}>□</span>
          <span style={rs.evWinBtn}>×</span>
        </div>
      </header>

      <div style={rs.evMenuBar}>
        {['File', 'Action', 'View', 'Help'].map(item => <span key={item}>{item}</span>)}
      </div>

      <div style={rs.evToolbar}>
        <button style={rs.evToolBtn} onClick={() => pickChannel('System')}>System</button>
        <button style={rs.evToolBtn} onClick={() => pickChannel('Security')}>Security</button>
        <button style={rs.evToolBtn} onClick={() => { setEventIdFilter('4625'); setSelectedChannel('Security'); setActiveExercise(2); }}>Filter 4625</button>
        <button style={rs.evToolBtn} onClick={() => { setSearchTerm('j.sanders'); setSelectedChannel('Security'); setActiveExercise(2); }}>Find User</button>
        <button style={rs.evToolBtn} onClick={() => { setEventIdFilter(''); setSearchTerm(''); }}>Clear</button>
      </div>

      <div style={rs.evLayout}>
        <aside style={rs.evNav}>
          <div style={rs.evPaneTitle}>Console Tree</div>
          <div style={rs.evTreeRoot}>Event Viewer (Local)</div>
          <div style={rs.evTreeBranch}>Windows Logs</div>
          {channels.map(channel => (
            <button
              key={channel.id}
              onClick={() => pickChannel(channel.id)}
              style={{ ...rs.evTreeItem, ...(selectedChannel === channel.id ? rs.evTreeItemActive : null) }}
            >
              <span>{channel.id}</span>
              <span style={rs.evTreeCount}>{channel.count}</span>
            </button>
          ))}
        </aside>

        <main style={rs.evCenter}>
          <div style={rs.evPaneTitle}>{selectedChannel}</div>

          <section style={rs.evFilterRow}>
            <label style={rs.evField}>Event IDs
              <input value={eventIdFilter} onChange={event => setEventIdFilter(event.target.value)} style={rs.evInput} placeholder="4625" />
            </label>
            <label style={rs.evField}>Find
              <input value={searchTerm} onChange={event => setSearchTerm(event.target.value)} style={rs.evInput} placeholder="User, computer, or IP" />
            </label>
            <div style={rs.evSummary}>
              {filteredEvents.length} events
              <span style={rs.evSummaryMeta}>
                {selectedChannel === 'Security' ? 'Logon, account management, and policy changes' : 'Service, startup, and operating system events'}
              </span>
            </div>
          </section>

          <section style={rs.evListPane}>
            <table style={rs.evTable}>
              <thead>
                <tr>
                  {['Level', 'Date and Time', 'Source', 'Event ID', 'Task Category'].map(label => <th key={label} style={rs.evTh}>{label}</th>)}
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map(event => (
                  <tr
                    key={event.id}
                    onClick={() => setSelectedEventId(event.id)}
                    style={{ ...rs.evTr, ...(selectedEvent?.id === event.id ? rs.evTrActive : null) }}
                  >
                    <td style={rs.evTd}>
                      <span style={{ ...rs.evLevelDot, background:levelColor(event.level) }} />
                      {event.level}
                    </td>
                    <td style={rs.evTd}>{event.date} {event.time}</td>
                    <td style={rs.evTd}>{event.source}</td>
                    <td style={rs.evTd}>{event.eventId}</td>
                    <td style={rs.evTd}>{event.taskCategory}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section style={rs.evDetailPane}>
            <div style={rs.evDetailHeader}>
              <div>
                <div style={rs.evDetailTitle}>{selectedEvent ? `Event ${selectedEvent.eventId}, ${selectedEvent.source}` : 'Event details'}</div>
                <div style={rs.evDetailMeta}>
                  {selectedEvent ? `${selectedEvent.logName} log on ${selectedEvent.computer}` : 'Select an event to inspect its details'}
                </div>
              </div>
              <div style={rs.evTabs}>
                {['General', 'Details'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{ ...rs.evTab, ...(activeTab === tab ? rs.evTabActive : null) }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {selectedEvent && activeTab === 'General' && (
              <div style={rs.evDetailBody}>
                <div style={rs.evMessageBox}>{selectedEvent.message}</div>
                <div style={rs.evMetaGrid}>
                  {[
                    ['Logged', `${selectedEvent.date} ${selectedEvent.time}`],
                    ['Event ID', selectedEvent.eventId],
                    ['User', selectedEvent.user],
                    ['Computer', selectedEvent.computer],
                    ['Source IP', selectedEvent.sourceIp],
                    ['Status', selectedEvent.status],
                  ].map(([label, value]) => (
                    <div key={label} style={rs.evMetaCard}>
                      <span style={rs.evMetaLabel}>{label}</span>
                      <strong style={rs.evMetaValue}>{value}</strong>
                    </div>
                  ))}
                </div>
                <div style={rs.evCorrelationBox}>
                  Correlation: {correlatedSequence.map(event => `${event.time} / ${event.eventId}`).join(' → ')}
                </div>
              </div>
            )}

            {selectedEvent && activeTab === 'Details' && (
              <div style={rs.evDetailBody}>
                <table style={rs.evDetailTable}>
                  <tbody>
                    {Object.entries(selectedEvent.details || {}).map(([label, value]) => (
                      <tr key={label}>
                        <td style={rs.evDetailKey}>{label}</td>
                        <td style={rs.evDetailValue}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>

        <aside style={rs.evActions}>
          <div style={rs.evPaneTitle}>Actions</div>
          <button style={rs.evActionBtn} onClick={() => { setSelectedChannel('Security'); setEventIdFilter('4625'); setActiveExercise(2); }}>Filter Current Log...</button>
          <button style={rs.evActionBtn} onClick={() => { setSelectedChannel('Security'); setSearchTerm('WKSTN-07'); setActiveExercise(2); }}>Find...</button>
          <button style={rs.evActionBtn} onClick={() => setActiveTab(activeTab === 'General' ? 'Details' : 'General')}>Properties</button>
          <button style={rs.evActionBtn} onClick={() => { setSelectedChannel('System'); setEventIdFilter(''); setSearchTerm(''); setActiveExercise(0); }}>Open Saved Log...</button>
          <button style={rs.evActionBtn} onClick={() => setActiveExercise(4)}>Open Log Parser Studio</button>

          <LabCheckpointQuiz
            questions={quizQuestions}
            storageKey={quizStorageKey}
            title="Lab Checkpoint"
            onPass={handleQuizPass}
            renderTrigger={openQuiz => (
              <button type="button" onClick={openQuiz} style={rs.snowQuizTrigger}>
                Resolve Ticket
              </button>
            )}
          />

          <section style={rs.evGuide}>
            <div style={rs.evGuideHead}>Lab Guide</div>
            <div style={rs.evExerciseList}>
              {viewer.exercises?.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setActiveExercise(index)}
                  style={{ ...rs.evExerciseBtn, ...(activeExercise === index ? rs.evExerciseBtnActive : null) }}
                >
                  {index + 1}. {item.title}
                </button>
              ))}
            </div>
            {exercise && (
              <div style={rs.evGuideCard}>
                <div style={rs.evGuideTitle}>{exercise.title}</div>
                {exercise.steps.map(step => <div key={step} style={rs.evGuideStep}>{step}</div>)}
                <div style={rs.evExpected}>
                  <strong>Expected Output:</strong> {exercise.expected}
                </div>
              </div>
            )}
          </section>

          <section style={rs.evGuide}>
            <div style={rs.evGuideHead}>Log Parser Studio</div>
            <div style={rs.evQueryTabs}>
              {viewer.lpsQueries?.map(query => (
                <button
                  key={query.id}
                  onClick={() => { setSelectedQueryId(query.id); setActiveExercise(4); }}
                  style={{ ...rs.evQueryTab, ...(selectedQueryId === query.id ? rs.evQueryTabActive : null) }}
                >
                  {query.name}
                </button>
              ))}
            </div>
            <textarea readOnly value={selectedQuery?.query || ''} style={rs.evQueryBox} />
            <div style={rs.evLpsMeta}>Sample file: `security-log-sample.evtx`</div>
            <table style={rs.evMiniTable}>
              <thead>
                <tr>
                  <th style={rs.evMiniTh}>Source IP</th>
                  <th style={rs.evMiniTh}>Failed Logons</th>
                </tr>
              </thead>
              <tbody>
                {failedBySource.map(([ip, count]) => (
                  <tr key={ip}>
                    <td style={rs.evMiniTd}>{ip}</td>
                    <td style={rs.evMiniTd}>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </aside>
      </div>
    </div>
  );
}

function SysmonLabShell(props) {
  const { mod, onBack, query, setQuery, runQuery, handleKeyDown, displayRows, applyShellQuery, task, activeTask, setActiveTask, completeTasksFromShell, taskStatus, user } = props;
  const sysmon = mod?.sysmon || {};
  const exercises = Array.isArray(sysmon.exercises) ? sysmon.exercises : [];
  const quickFilters = Array.isArray(sysmon.quickFilters) ? sysmon.quickFilters : [];
  const taskQueries = {
    t1:'search eventId=4',
    t2:'search eventId=1 | search -ExecutionPolicy Bypass',
    t3:'search eventId=3 | search 198.51.100.42',
    t4:'search eventId=11 | search stage-loader.dll',
    t5:'search eventId=7 | search dbghelp.dll',
  };
  const eventRows = Array.isArray(displayRows) && displayRows.every(row => row && row.eventId !== undefined)
    ? displayRows
    : (Array.isArray(mod?.logs) ? mod.logs : []);
  const [selectedEventId, setSelectedEventId] = React.useState(eventRows[0]?.id || null);
  const [activeTab, setActiveTab] = React.useState('General');
  const [activeExercise, setActiveExercise] = React.useState(activeTask || 0);
  const [viewportWidth, setViewportWidth] = React.useState(() => (
    typeof window === 'undefined' ? 1440 : window.innerWidth
  ));
  const allTasksComplete = Array.isArray(mod?.tasks) && mod.tasks.length > 0 && mod.tasks.every(item => taskStatus?.[item.id] === 'correct');
  const quizStorageKey = React.useMemo(() => `b2b-quiz-${user?.username || 'student'}-${mod?.id || 'lab'}`, [user?.username, mod?.id]);

  React.useEffect(() => {
    setActiveExercise(activeTask || 0);
    const nextQuery = taskQueries[task?.id];
    if (nextQuery) setQuery(nextQuery);
  }, [task?.id, activeTask, mod?.id]);

  React.useEffect(() => {
    function updateViewportWidth() {
      setViewportWidth(window.innerWidth);
    }
    window.addEventListener('resize', updateViewportWidth);
    return () => window.removeEventListener('resize', updateViewportWidth);
  }, []);

  React.useEffect(() => {
    const next = eventRows.find(event => event.id === selectedEventId) || eventRows[0] || null;
    setSelectedEventId(next?.id || null);
  }, [selectedEventId, eventRows]);

  const selectedEvent = eventRows.find(event => event.id === selectedEventId) || eventRows[0] || null;
  const activeExerciseDef = exercises[activeExercise] || exercises[0] || null;
  const setupSteps = [
    'Download Sysmon from Sysinternals and extract the archive.',
    'Download the SwiftOnSecurity Sysmon configuration from GitHub.',
    'Install with admin Command Prompt: sysmon -accepteula -i sysmonconfig-export.xml',
  ];
  const tools = ['Sysmon', 'Event Viewer', 'PowerShell'];
  const quizQuestions = [
    {
      id:'sq1',
      prompt:'Which Event ID confirms Sysmon started and is writing Operational events in this lab?',
      options:['1', '3', '4', '11'],
      correct:'4',
      hint:'The service state change event is the setup verification signal.',
    },
    {
      id:'sq2',
      prompt:'Which parent process launched the suspicious PowerShell command with ExecutionPolicy Bypass?',
      options:['C:\\Windows\\explorer.exe', 'C:\\Windows\\System32\\cmd.exe', 'C:\\Windows\\System32\\svchost.exe', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'],
      correct:'C:\\Windows\\explorer.exe',
      hint:'Review the Event ID 1 details and compare Image against ParentImage.',
    },
    {
      id:'sq3',
      prompt:'Which destination IP marks the suspicious outbound Sysmon network connection?',
      options:['10.10.24.12', '20.42.65.91', '198.51.100.42', '127.0.0.1'],
      correct:'198.51.100.42',
      hint:'Filter Event ID 3 and compare the normal SaaS connection with the odd external host.',
    },
    {
      id:'sq4',
      prompt:'Which file path was dropped into a public directory by the suspicious PowerShell process?',
      options:['C:\\Users\\j.sanders\\AppData\\Local\\Temp\\chrome-cache.bin', 'C:\\Users\\Public\\Libraries\\stage-loader.dll', 'C:\\Windows\\Temp\\inventory.ps1', 'C:\\ProgramData\\dbghelp.dll'],
      correct:'C:\\Users\\Public\\Libraries\\stage-loader.dll',
      hint:'The relevant event is Event ID 11, not the browser cache file.',
    },
    {
      id:'sq5',
      prompt:'Which image load indicates the suspicious unsigned DLL activity in this lab?',
      options:['C:\\Windows\\System32\\shell32.dll', 'C:\\Windows\\System32\\dbghelp.dll', 'C:\\Users\\Public\\Music\\dbghelp.dll', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.dll'],
      correct:'C:\\Users\\Public\\Music\\dbghelp.dll',
      hint:'Filter Event ID 7 and focus on user-writable paths plus the unsigned signature state.',
    },
  ];
  const isMediumViewport = viewportWidth < 1450;
  const isNarrowViewport = viewportWidth < 1080;
  const isTightQueryRow = viewportWidth < 760;
  const layoutStyle = isNarrowViewport
    ? { ...rs.evLayout, gridTemplateColumns:'minmax(0, 1fr)', gridTemplateRows:'220px minmax(0, 1fr) auto' }
    : isMediumViewport
      ? { ...rs.evLayout, gridTemplateColumns:'220px minmax(0, 1fr)', gridTemplateRows:'minmax(0, 1fr) auto' }
      : rs.evLayout;
  const navStyle = isNarrowViewport
    ? { ...rs.evNav, borderRight:'none', borderBottom:'1px solid #bcc5d1' }
    : rs.evNav;
  const centerStyle = isNarrowViewport
    ? { ...rs.evCenter, gridTemplateRows:'32px auto minmax(240px, 1fr) minmax(220px, 0.78fr)' }
    : { ...rs.evCenter, gridTemplateRows:'32px 112px minmax(240px, 1fr) minmax(220px, 0.78fr)' };
  const actionsStyle = isNarrowViewport
    ? { ...rs.evActions, borderLeft:'none', borderTop:'1px solid #bcc5d1' }
    : isMediumViewport
      ? { ...rs.evActions, gridColumn:'1 / -1', borderLeft:'none', borderTop:'1px solid #bcc5d1' }
      : rs.evActions;
  const queryRowStyle = isTightQueryRow
    ? { ...rs.sysQueryRow, gridTemplateColumns:'minmax(0, 1fr)' }
    : rs.sysQueryRow;
  const queryButtonStyle = isTightQueryRow
    ? { ...rs.sysQueryBtn, minHeight:32 }
    : rs.sysQueryBtn;

  function levelColor(level) {
    if (level === 'Error') return '#c50f1f';
    if (level === 'Warning') return '#986f0b';
    return '#107c10';
  }

  function runShellQuery(nextQuery) {
    setQuery(nextQuery);
    applyShellQuery?.(nextQuery);
  }

  function eventXml(event) {
    if (!event) return '';
    const detailXml = Object.entries(event.details || {}).map(([key, value]) => `    <Data Name="${key}">${String(value)}</Data>`).join('\n');
    return [
      '<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event">',
      '  <System>',
      `    <Provider Name="${event.source}" />`,
      `    <EventID>${event.eventId}</EventID>`,
      `    <Level>${event.level}</Level>`,
      `    <Task>${event.taskCategory}</Task>`,
      `    <EventRecordID>${event.recordId}</EventRecordID>`,
      `    <Channel>${event.logName}</Channel>`,
      `    <Computer>${event.computer}</Computer>`,
      '  </System>',
      '  <EventData>',
      detailXml,
      '  </EventData>',
      '</Event>',
    ].join('\n');
  }

  function handleQuizPass(result) {
    if (!allTasksComplete && typeof completeTasksFromShell === 'function') {
      completeTasksFromShell(
        (mod?.tasks || []).map(item => item.id),
        { feedback:`Quiz passed (${result.score}/${result.total}). Lab marked complete.` }
      );
    }
  }

  return (
    <div style={rs.evRoot}>
      <header style={rs.evTitleBar}>
        <div style={rs.evTitleCluster}>
          <button onClick={onBack} style={rs.evBack}>‹</button>
          <div>
            <div style={rs.evAppTitle}>Event Viewer</div>
            <div style={rs.evAppSub}>{sysmon.computer || 'WKSTN-07.corp.missionnext.local'}</div>
          </div>
        </div>
        <div style={rs.evWinButtons}>
          <span style={rs.evWinBtn}>—</span>
          <span style={rs.evWinBtn}>□</span>
          <span style={rs.evWinBtn}>×</span>
        </div>
      </header>

      <div style={rs.evMenuBar}>
        {['File', 'Action', 'View', 'Help'].map(item => <span key={item}>{item}</span>)}
      </div>

      <div style={rs.evToolbar}>
        {quickFilters.map(item => (
          <button key={item.label} onClick={() => runShellQuery(item.query)} style={rs.evToolBtn}>{item.label}</button>
        ))}
        <span style={rs.sysToolbarMeta}>Provider: {sysmon.provider || 'Microsoft-Windows-Sysmon'} | Config: {sysmon.configName || 'sysmonconfig-export.xml'}</span>
      </div>

      <div style={layoutStyle}>
        <aside style={navStyle}>
          <div style={rs.evPaneTitle}>Console Tree</div>
          <div style={rs.evTreeRoot}>Event Viewer (Local)</div>
          <div style={rs.evTreeBranch}>Applications and Services Logs</div>
          <div style={rs.sysTreeIndent}>Microsoft</div>
          <div style={rs.sysTreeIndent2}>Windows</div>
          <button style={{ ...rs.evTreeItem, ...rs.evTreeItemActive }}>
            <span>Sysmon / Operational</span>
            <span style={rs.evTreeCount}>{eventRows.length}</span>
          </button>
          <div style={rs.sysTreeMeta}>
            Log name: {sysmon.logName || 'Microsoft-Windows-Sysmon/Operational'}
          </div>
        </aside>

        <main style={centerStyle}>
          <div style={rs.evPaneTitle}>Microsoft-Windows-Sysmon/Operational</div>

          <section style={rs.sysQueryPanel}>
            <div style={rs.sysPathBar}>{sysmon.channel || 'Applications and Services Logs > Microsoft > Windows > Sysmon > Operational'}</div>
            <div style={queryRowStyle}>
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                onKeyDown={handleKeyDown}
                style={rs.sysQueryInput}
                placeholder="search eventId=1 | search powershell.exe"
              />
              <button onClick={runQuery} style={queryButtonStyle}>Find Now</button>
            </div>
            <div style={rs.sysBadgeRow}>
              <span style={rs.sysBadge}>Version {sysmon.serviceVersion || '15.15'}</span>
              <span style={rs.sysBadge}>Operational Log</span>
              <span style={rs.sysBadge}>{eventRows.length} visible events</span>
            </div>
          </section>

          <section style={rs.evListPane}>
            <table style={rs.evTable}>
              <thead>
                <tr>
                  {['Level', 'Date and Time', 'Source', 'Event ID', 'Task Category'].map(label => <th key={label} style={rs.evTh}>{label}</th>)}
                </tr>
              </thead>
              <tbody>
                {eventRows.map(event => (
                  <tr
                    key={event.id}
                    onClick={() => setSelectedEventId(event.id)}
                    style={{ ...rs.evTr, ...(selectedEvent?.id === event.id ? rs.evTrActive : null) }}
                  >
                    <td style={rs.evTd}>
                      <span style={{ ...rs.evLevelDot, background:levelColor(event.level) }} />
                      {event.level}
                    </td>
                    <td style={rs.evTd}>{event.date} {event.time}</td>
                    <td style={rs.evTd}>{event.source}</td>
                    <td style={rs.evTd}>{event.eventId}</td>
                    <td style={rs.evTd}>{event.taskCategory}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section style={rs.evDetailPane}>
            <div style={rs.evDetailHeader}>
              <div>
                <div style={rs.evDetailTitle}>{selectedEvent ? `Event ${selectedEvent.eventId}, ${selectedEvent.source}` : 'Event details'}</div>
                <div style={rs.evDetailMeta}>
                  {selectedEvent ? `Record ${selectedEvent.recordId} on ${selectedEvent.computer}` : 'Select a Sysmon event to inspect its details'}
                </div>
              </div>
              <div style={rs.evTabs}>
                {['General', 'Details', 'XML'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{ ...rs.evTab, ...(activeTab === tab ? rs.evTabActive : null) }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {selectedEvent && activeTab === 'General' && (
              <div style={rs.evDetailBody}>
                <pre style={rs.sysMessageBox}>{selectedEvent.message}</pre>
                <div style={rs.evMetaGrid}>
                  {[
                    ['User', selectedEvent.user],
                    ['Computer', selectedEvent.computer],
                    ['Event ID', selectedEvent.eventId],
                    ['Record ID', selectedEvent.recordId],
                    ['Log', selectedEvent.logName],
                    ['Provider', selectedEvent.source],
                  ].map(([label, value]) => (
                    <div key={label} style={rs.evMetaCard}>
                      <span style={rs.evMetaLabel}>{label}</span>
                      <strong style={rs.evMetaValue}>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedEvent && activeTab === 'Details' && (
              <div style={rs.evDetailBody}>
                <table style={rs.evDetailTable}>
                  <tbody>
                    {Object.entries(selectedEvent.details || {}).map(([label, value]) => (
                      <tr key={label}>
                        <td style={rs.evDetailKey}>{label}</td>
                        <td style={rs.evDetailValue}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedEvent && activeTab === 'XML' && (
              <div style={rs.evDetailBody}>
                <pre style={rs.sysXmlBox}>{eventXml(selectedEvent)}</pre>
              </div>
            )}
          </section>
        </main>

        <aside style={actionsStyle}>
          <div style={rs.evPaneTitle}>Actions</div>
          <button style={rs.evActionBtn} onClick={() => runShellQuery(taskQueries[task?.id] || 'search eventId=1')}>Run Task Query</button>
          <button style={rs.evActionBtn} onClick={() => runShellQuery('search eventId=1')}>Filter Current Log...</button>
          <button style={rs.evActionBtn} onClick={() => runShellQuery('search eventId=3')}>Find Network Events</button>
          <button style={rs.evActionBtn} onClick={() => setActiveTab(activeTab === 'Details' ? 'XML' : 'Details')}>Switch Details View</button>

          <LabCheckpointQuiz
            questions={quizQuestions}
            storageKey={quizStorageKey}
            title="Sysmon Lab Checkpoint"
            onPass={handleQuizPass}
            renderTrigger={openQuiz => (
              <button type="button" onClick={openQuiz} style={rs.snowQuizTrigger}>
                Resolve Ticket
              </button>
            )}
          />

          <section style={rs.evGuide}>
            <div style={rs.evGuideHead}>Lab Setup &amp; Tools</div>
            <div style={rs.evGuideCard}>
              <div style={rs.evGuideTitle}>Environment Prep</div>
              {setupSteps.map(step => <div key={step} style={rs.evGuideStep}>{step}</div>)}
              <div style={rs.evExpected}>
                <strong>Tools:</strong> {tools.join(' • ')}
              </div>
            </div>
          </section>

          <section style={rs.evGuide}>
            <div style={rs.evGuideHead}>Sysmon Lab Guide</div>
            <div style={rs.evExerciseList}>
              {exercises.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveExercise(index);
                    if (mod?.tasks?.[index]) setActiveTask(index);
                  }}
                  style={{ ...rs.evExerciseBtn, ...(activeExercise === index ? rs.evExerciseBtnActive : null) }}
                >
                  {index + 1}. {item.title}
                </button>
              ))}
            </div>
            {activeExerciseDef && (
              <div style={rs.evGuideCard}>
                <div style={rs.evGuideTitle}>{activeExerciseDef.title}</div>
                {activeExerciseDef.steps.map(step => <div key={step} style={rs.evGuideStep}>{step}</div>)}
                <div style={rs.evExpected}>
                  <strong>Expected Output:</strong> {activeExerciseDef.expected}
                </div>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function RegistryLabShell(props) {
  const { mod, onBack, applyShellQuery, activeTask, setActiveTask, task, taskStatus, completeTasksFromShell, user } = props;
  const registry = mod?.registry || {};
  const tree = Array.isArray(registry.tree) ? registry.tree : [];
  const quickLinks = Array.isArray(registry.quickLinks) ? registry.quickLinks : [];
  const taskTargets = {
    t1:{ target:'sam-names', query:'search artifact=user_accounts', title:'SAM Names', guide:['Expand HKEY_LOCAL_MACHINE.', 'Open SAM > SAM > Domains > Account > Users > Names.', 'Count every account subkey shown in the value pane.'] },
    t2:{ target:'run-key', query:'search artifact=autorun', title:'Run Key', guide:['Browse to SOFTWARE > Microsoft > Windows > CurrentVersion > Run.', 'Read the Data column carefully.', 'Submit the suspicious value name that launches from C:\\Users\\Public.'] },
    t3:{ target:'userassist-count', query:'search artifact=userassist', title:'UserAssist', guide:['Open the user SID under HKEY_USERS.', 'Browse to Explorer > UserAssist > {GUID} > Count.', 'Find the Desktop executable with the highest run count and submit its full path.'] },
  };
  const defaultTarget = taskTargets[task?.id]?.target || quickLinks[0]?.target || 'computer';
  const [selectedId, setSelectedId] = React.useState(defaultTarget);
  const [expandedIds, setExpandedIds] = React.useState(() => new Set(['computer', 'hklm', 'hku', 'sam-root', 'software-root', 'user-sid']));
  const [selectedValueRowKey, setSelectedValueRowKey] = React.useState('');
  const [openValueKeyIds, setOpenValueKeyIds] = React.useState(() => new Set());
  const allTasksComplete = Array.isArray(mod?.tasks) && mod.tasks.length > 0 && mod.tasks.every(item => taskStatus?.[item.id] === 'correct');
  const quizStorageKey = React.useMemo(() => `b2b-quiz-${user?.username || 'student'}-${mod?.id || 'lab'}`, [user?.username, mod?.id]);
  const quizQuestions = [
    {
      id:'rq1',
      prompt:'Which registry path contains the local account names for this investigation?',
      options:[
        'HKEY_LOCAL_MACHINE\\SAM\\SAM\\Domains\\Account\\Users\\Names',
        'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
        'HKEY_USERS\\...\\Explorer\\UserAssist\\...\\Count',
        'HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services',
      ],
      correct:'HKEY_LOCAL_MACHINE\\SAM\\SAM\\Domains\\Account\\Users\\Names',
      hint:'The first task sends you into the SAM hive, not the autorun or UserAssist keys.',
    },
    {
      id:'rq2',
      prompt:'How many local account subkeys are visible in the SAM Names key?',
      options:['3', '4', '5', '6'],
      correct:'5',
      hint:'Count each listed subkey under the Names key.',
    },
    {
      id:'rq3',
      prompt:'Which value name is responsible for suspicious Run-key persistence from C:\\Users\\Public?',
      options:['SecurityHealth', 'Windows Update Monitor', 'OneDrive Update', 'Adobe Updater'],
      correct:'Windows Update Monitor',
      hint:'The suspicious value launches `svhost.exe` from the Public profile.',
    },
    {
      id:'rq4',
      prompt:'Which executable appears repeatedly in UserAssist from the desktop path?',
      options:[
        'C:\\Windows\\System32\\cmd.exe',
        'C:\\Users\\j.sanders\\Desktop\\invoice_viewer.exe',
        'C:\\Program Files\\Microsoft Edge\\Application\\msedge.exe',
        'C:\\Users\\Public\\svhost.exe',
      ],
      correct:'C:\\Users\\j.sanders\\Desktop\\invoice_viewer.exe',
      hint:'Look for the desktop executable with the highest run count in the Count key.',
    },
  ];

  const index = React.useMemo(() => {
    const map = {};
    function visit(nodes, parents) {
      (nodes || []).forEach(node => {
        map[node.id] = { ...node, parents };
        visit(node.children || [], [...parents, node.id]);
      });
    }
    visit(tree, []);
    return map;
  }, [tree]);

  React.useEffect(() => {
    const next = taskTargets[task?.id];
    if (!next) return;
    const parents = index[next.target]?.parents || [];
    setSelectedId(next.target);
    setExpandedIds(current => {
      const updated = new Set(current);
      parents.forEach(id => updated.add(id));
      updated.add(next.target);
      return updated;
    });
    applyShellQuery?.(next.query);
  }, [task?.id, mod?.id, index, applyShellQuery]);

  React.useEffect(() => {
    setSelectedValueRowKey('');
  }, [selectedId]);

  const selectedNode = index[selectedId] || index[defaultTarget] || null;
  const helper = taskTargets[task?.id] || taskTargets.t1;
  const valueRows = selectedNode?.values
    ? selectedNode.values.map((row, idx) => ({
        key:`value-${idx}-${row.name}-${row.type}`,
        kind:'value',
        name:row.name,
        type:row.type,
        data:row.data,
      }))
    : (selectedNode?.children || []).map(child => ({
        key:`node-${child.id}`,
        kind:'key',
        nodeId:child.id,
        name:child.name,
        type:'REG_KEY',
        data:child.summary || `${(child.children || []).length} subkey${(child.children || []).length === 1 ? '' : 's'}`,
        hasChildren:Array.isArray(child.children) && child.children.length > 0,
      }));

  function selectNode(nodeId) {
    const parents = index[nodeId]?.parents || [];
    setSelectedId(nodeId);
    setExpandedIds(current => {
      const updated = new Set(current);
      parents.forEach(id => updated.add(id));
      return updated;
    });
  }

  function toggleNode(nodeId) {
    setExpandedIds(current => {
      const updated = new Set(current);
      if (updated.has(nodeId)) updated.delete(nodeId);
      else updated.add(nodeId);
      return updated;
    });
  }

  function toggleValueKey(nodeId) {
    if (!nodeId) return;
    setOpenValueKeyIds(current => {
      const updated = new Set(current);
      if (updated.has(nodeId)) updated.delete(nodeId);
      else updated.add(nodeId);
      return updated;
    });
  }

  function renderTree(nodes, level) {
    return (nodes || []).map(node => {
      const hasChildren = Array.isArray(node.children) && node.children.length > 0;
      const expanded = expandedIds.has(node.id);
      const selected = node.id === selectedId;
      return (
        <div key={node.id}>
          <div
            onClick={() => selectNode(node.id)}
            style={{ ...rs.regTreeRow, ...(selected ? rs.regTreeRowActive : null), paddingLeft:10 + level * 16 }}
          >
            <button type="button" onClick={event => { event.stopPropagation(); if (hasChildren) toggleNode(node.id); }} style={rs.regTwisty}>
              {hasChildren ? (expanded ? '▾' : '▸') : '·'}
            </button>
            <span style={hasChildren ? rs.regTreeFolderIcon : rs.regTreeValueIcon} />
            <span style={rs.regTreeLabel}>{node.name}</span>
          </div>
          {hasChildren && expanded && renderTree(node.children, level + 1)}
        </div>
      );
    });
  }

  function openValueRow(row) {
    if (row.kind === 'key' && row.nodeId) {
      selectNode(row.nodeId);
    }
  }

  function handleQuizPass(result) {
    if (!allTasksComplete && typeof completeTasksFromShell === 'function') {
      completeTasksFromShell(
        (mod?.tasks || []).map(item => item.id),
        { feedback:`Quiz passed (${result.score}/${result.total}). Lab marked complete.` }
      );
    }
  }

  return (
    <div style={rs.regRoot}>
      <main style={rs.regMain}>
        <header style={rs.regTitleBar}>
          <div style={rs.regTitleGroup}>
            <button onClick={onBack} style={rs.regBack}>‹</button>
            <span style={rs.regAppIcon}>▦</span>
            <span>Registry Editor</span>
          </div>
          <div style={rs.regWinButtons}>
            <span style={rs.regWinBtn}>—</span>
            <span style={rs.regWinBtn}>□</span>
            <span style={rs.regWinBtn}>×</span>
          </div>
        </header>

        <div style={rs.regMenuBar}>{['File', 'Edit', 'View', 'Favorites', 'Help'].map(item => <span key={item}>{item}</span>)}</div>

        <div style={rs.regToolbar}>
          <div style={rs.regToolbarNav}>
            <button type="button" style={rs.regNavBtn} aria-label="Back">◀</button>
            <button type="button" style={rs.regNavBtn} aria-label="Forward">▶</button>
            <button type="button" style={rs.regNavBtn} aria-label="Up" onClick={() => selectedNode?.parents?.length && selectNode(selectedNode.parents[selectedNode.parents.length - 1])}>↑</button>
          </div>
          <div style={rs.regToolbarCluster}>
            <button type="button" style={rs.regToolBtnPrimary} onClick={() => selectNode(helper.target)}>Open Task Key</button>
            {quickLinks.map(link => (
              <button key={link.target} type="button" style={rs.regToolBtn} onClick={() => selectNode(link.target)}>
                {link.label}
              </button>
            ))}
          </div>
          <div style={rs.regCapture}>{registry.image} | {registry.profile}</div>
        </div>

        <div style={rs.regAddressBar}>
          <span style={rs.regAddressLabel}>Address</span>
          <div style={rs.regAddressValue}>{selectedNode?.path || 'Computer'}</div>
        </div>

        <div style={rs.regWorkspace}>
          <aside style={rs.regTreePane}>
            <div style={rs.regPaneHead}>Console Tree</div>
            <div style={rs.regTreeScroll}>{renderTree(tree, 0)}</div>
          </aside>

          <div style={rs.regSplitter} />

          <section style={rs.regValuePane}>
            <div style={rs.regPaneHead}>
              <span>{selectedNode?.name || 'Key'}</span>
              <span>{valueRows.length} item{valueRows.length === 1 ? '' : 's'}</span>
            </div>
            <div style={rs.regValueScroll}>
              <table style={rs.regTable}>
                <thead>
                  <tr>
                    {['Name', 'Type', 'Data'].map(label => <th key={label} style={rs.regTh}>{label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {valueRows.map(row => (
                    <React.Fragment key={row.key}>
                      <tr
                        onClick={() => setSelectedValueRowKey(row.key)}
                        onDoubleClick={() => openValueRow(row)}
                        style={{
                          ...rs.regTr,
                          ...(selectedValueRowKey === row.key ? rs.regTrActive : null),
                          ...(row.kind === 'key' ? rs.regTrOpenable : null),
                        }}
                      >
                        <td style={rs.regTd}>
                          <div style={rs.regNameCell}>
                            {row.kind === 'key' ? (
                              <button
                                type="button"
                                onClick={event => {
                                  event.stopPropagation();
                                  setSelectedValueRowKey(row.key);
                                  toggleValueKey(row.nodeId);
                                }}
                                style={rs.regValueToggle}
                                aria-label={openValueKeyIds.has(row.nodeId) ? `Collapse ${row.name}` : `Expand ${row.name}`}
                              >
                                <span style={openValueKeyIds.has(row.nodeId) ? rs.regValueToggleOpen : rs.regValueToggleClosed} />
                                <span style={rs.regFolderIcon} />
                              </button>
                            ) : (
                              <span style={rs.regDataIcon} />
                            )}
                            <span style={rs.regNameText}>{row.name}</span>
                          </div>
                        </td>
                        <td style={rs.regTdType}>{row.type}</td>
                        <td style={rs.regTdData}>{row.data}</td>
                      </tr>
                      {row.kind === 'key' && openValueKeyIds.has(row.nodeId) && (
                        <tr style={rs.regNestedRow}>
                          <td colSpan={3} style={rs.regNestedCell}>
                            <div style={rs.regNestedPreview}>
                              <div style={rs.regNestedPath}>{index[row.nodeId]?.path || row.name}</div>
                              <div style={rs.regNestedMeta}>
                                {(index[row.nodeId]?.children || []).length
                                  ? `${(index[row.nodeId]?.children || []).length} subkey${(index[row.nodeId]?.children || []).length === 1 ? '' : 's'}`
                                  : `${(index[row.nodeId]?.values || []).length} value${(index[row.nodeId]?.values || []).length === 1 ? '' : 's'}`}
                                {index[row.nodeId]?.summary ? ` • ${index[row.nodeId].summary}` : ''}
                              </div>
                              <button type="button" style={rs.regNestedOpenBtn} onClick={() => openValueRow(row)}>Open key</button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={rs.regInspector}>
              <div style={rs.regInspectorCard}>
                <div style={rs.regInspectorLabel}>Investigation Summary</div>
                <div style={rs.regInspectorCopy}>{selectedNode?.summary || 'Select a key to inspect registry artifacts.'}</div>
              </div>
              <div style={rs.regInspectorCard}>
                <div style={rs.regInspectorLabel}>Last Write</div>
                <div style={rs.regInspectorCopy}>{selectedNode?.lastWrite || 'Not available for this level.'}</div>
              </div>
              <div style={rs.regInspectorCard}>
                <div style={rs.regInspectorLabel}>Task Path</div>
                <div style={rs.regInstructionList}>
                  {helper.guide.map(step => <div key={step} style={rs.regInstructionStep}>{step}</div>)}
                </div>
              </div>
              <div style={rs.regInspectorCard}>
                <div style={rs.regInspectorLabel}>Task Status</div>
                <div style={rs.regInspectorCopy}>{task?.description}</div>
                <div style={rs.regInstructionHint}>
                  {taskStatus?.[task?.id] === 'correct' ? 'Task complete. Move to the next artifact.' : `Hint: ${task?.hint}`}
                </div>
                <div style={rs.regQuickLinks}>
                  {quickLinks.map(link => (
                    <button key={link.target} type="button" style={rs.regBotLinkBtn} onClick={() => selectNode(link.target)}>
                      {link.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer style={rs.regStatusBar}>
          {selectedNode?.path || 'Computer'}{selectedNode?.lastWrite ? ` | Last Write: ${selectedNode.lastWrite}` : ''}
        </footer>
      </main>

      <TaskInspector
        {...props}
        setActiveTask={index => {
          setActiveTask(index);
          const nextTask = mod.tasks[index];
          const nextTarget = taskTargets[nextTask?.id]?.target;
          if (nextTarget) selectNode(nextTarget);
        }}
      >
        <LabCheckpointQuiz
          questions={quizQuestions}
          storageKey={quizStorageKey}
          title="Registry Lab Checkpoint"
          onPass={handleQuizPass}
          renderTrigger={openQuiz => (
            <button type="button" onClick={openQuiz} style={{ ...rs.snowQuizTrigger, marginTop:16 }}>
              Resolve Ticket
            </button>
          )}
        />
      </TaskInspector>
    </div>
  );
}

function adTree() {
  return [{
    id:'dc=corp',
    label:'corp.missionnext.local',
    icon:'DC',
    ou:true,
    children:[
      { id:'ou=users', label:'Users', icon:'U', ou:true },
      { id:'ou=workstations', label:'Computers', icon:'PC', ou:true },
      { id:'ou=service-accounts', label:'Service Accounts', icon:'SVC', ou:true },
      { id:'ou=domain-controllers', label:'Domain Controllers', icon:'DC', ou:true },
      { id:'ou=groups', label:'Groups', icon:'GRP', ou:true },
    ],
  }];
}

function treeLabel(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node.label;
    const found = treeLabel(node.children || [], id);
    if (found) return found;
  }
  return 'corp.missionnext.local';
}

function adKey(row) {
  return row?.samAccountName || row?.name || '';
}

function buildDn(name, ou) {
  return `CN=${name},${String(ou || 'ou=soc-users').toUpperCase()},DC=corp,DC=missionnext,DC=local`;
}

function adIconForObject(row) {
  const type = String(row?.objectClass || '').toLowerCase();
  if (type === 'computer') return 'PC';
  if (type === 'group') return 'GRP';
  if (type === 'domain controller') return 'DC';
  if (String(row?.samAccountName || '').includes('svc_')) return 'SVC';
  return 'USR';
}

const AD_DIRECTORY_BASE = [
  { name:'Administrator', objectClass:'User', samAccountName:'Administrator', userPrincipalName:'Administrator@corp.missionnext.local', description:'Built-in admin account', status:'Enabled', ou:'ou=users' },
  { name:'j.sanders', objectClass:'User', samAccountName:'j.sanders', userPrincipalName:'j.sanders@corp.missionnext.local', description:'Standard user showing repeated Kerberos failures', status:'Enabled', ou:'ou=users' },
  { name:'svc_backup', objectClass:'User', samAccountName:'svc_backup', userPrincipalName:'svc_backup@corp.missionnext.local', description:'Service account used for backups', status:'Enabled', ou:'ou=service-accounts' },
  { name:'svc_siem', objectClass:'User', samAccountName:'svc_siem', userPrincipalName:'svc_siem@corp.missionnext.local', description:'Log ingestion service account', status:'Enabled', ou:'ou=service-accounts' },
  { name:'WS-07', objectClass:'Computer', samAccountName:'WS-07$', userPrincipalName:'WS-07@corp.missionnext.local', description:'Workstation tied to the failed logon sequence', status:'Enabled', ou:'ou=workstations' },
  { name:'WS-12', objectClass:'Computer', samAccountName:'WS-12$', userPrincipalName:'WS-12@corp.missionnext.local', description:'Training workstation in the finance VLAN', status:'Enabled', ou:'ou=workstations' },
  { name:'DC01', objectClass:'Computer', samAccountName:'DC01$', userPrincipalName:'DC01@corp.missionnext.local', description:'Primary domain controller', status:'Enabled', ou:'ou=domain-controllers' },
  { name:'Domain Admins', objectClass:'Group', samAccountName:'Domain Admins', userPrincipalName:'', description:'Administrative group with elevated privileges', status:'Enabled', ou:'ou=groups' },
  { name:'Help Desk', objectClass:'Group', samAccountName:'Help Desk', userPrincipalName:'', description:'Support team with reset permissions', status:'Enabled', ou:'ou=groups' },
];

const AD_DESKTOP_SHORTCUTS = [
  { id:'aduc', label:'Active Directory Users and Computers', icon:'AD', ou:'ou=users', description:'Browse users, groups, computers, and OUs.' },
  { id:'powershell', label:'PowerShell ISE', icon:'PS', ou:'ou=service-accounts', description:'Run directory queries and account checks.' },
  { id:'gpmc', label:'Group Policy Management', icon:'GPO', ou:'ou=groups', description:'Review domain policy and linked GPOs.' },
  { id:'dc01', label:'DC01', icon:'DC', ou:'ou=domain-controllers', description:'Open the domain controller view.' },
];

function adObject(row, index, ou) {
  const ouCycle = ['ou=users', 'ou=workstations', 'ou=service-accounts', 'ou=domain-controllers', 'ou=groups'];
  const targetOu = row.ou || ouCycle[index % ouCycle.length] || ou;
  let name = row.asset || `ad-object-${index + 1}`;
  let objectClass = 'User';

  if (targetOu === 'ou=domain-controllers') {
    name = index % 2 === 0 ? 'DC01' : 'DC02';
    objectClass = 'Computer';
  } else if (targetOu === 'ou=workstations') {
    name = `WS-${String(index + 7).padStart(2, '0')}`;
    objectClass = 'Computer';
  } else if (targetOu === 'ou=service-accounts') {
    name = `svc_${String(row.finding || row.asset || 'audit').replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`;
    objectClass = 'User';
  } else if (targetOu === 'ou=groups') {
    name = row.owner ? `${String(row.owner).replace(/-/g, ' ')} Group` : `Group ${index + 1}`;
    objectClass = 'Group';
  } else if (String(row.asset || '').toLowerCase() === 'dc') {
    name = 'j.sanders';
  }

  return {
    name,
    objectClass,
    samAccountName: String(name).includes('$') ? name : name,
    userPrincipalName: objectClass === 'Group' ? '' : `${String(name).replace(/\s+/g, '').toLowerCase()}@corp.missionnext.local`,
    distinguishedName: buildDn(name, targetOu || ou),
    description: row.finding || row.event_type || 'Directory object',
    status: row.status === 'closed' ? 'Enabled' : 'Review',
    ou: targetOu || ou,
  };
}

function serviceNowRecord(row) {
  return {
    ...row,
    number:row.number || `INC00${String(row.id).padStart(5, '0')}`,
    status:normalizeSnowState(row.status),
  };
}

function normalizeSnowState(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'open') return 'New';
  if (value === 'triaged') return 'In Progress';
  if (value === 'closed') return 'Resolved';
  return status || 'New';
}

const rs = {
  taskPane:{ background:'#f8fafc', color:'#111827', borderLeft:'1px solid #d1d5db', padding:12, overflow:'auto', fontFamily:'Segoe UI, Arial, sans-serif' },
  taskHead:{ display:'flex', justifyContent:'space-between', fontWeight:600, fontSize:13, marginBottom:8 },
  taskRow:{ width:'100%', display:'flex', alignItems:'center', gap:8, border:'1px solid #d1d5db', background:'#fff', color:'#111827', padding:7, marginBottom:6, borderRadius:2, textAlign:'left' },
  taskActive:{ borderColor:'#0078d4', boxShadow:'inset 3px 0 0 #0078d4' },
  taskNum:{ width:20, height:20, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11 },
  taskName:{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12 },
  taskCard:{ marginTop:12, background:'#fff', border:'1px solid #d1d5db', padding:10 },
  kicker:{ fontSize:11, color:'#6b7280', marginBottom:4 },
  taskTitle:{ fontSize:14, margin:'0 0 6px', color:'#111827' },
  taskCopy:{ fontSize:12, lineHeight:1.45, color:'#374151', margin:'0 0 8px' },
  linkBtn:{ border:'none', background:'transparent', color:'#0067b8', padding:0, borderRadius:0, fontSize:12 },
  hint:{ marginTop:8, padding:8, background:'#fff8dc', border:'1px solid #eadc9b', color:'#111827', whiteSpace:'pre-wrap' },
  label:{ display:'grid', gap:4, fontSize:12, color:'#374151', marginTop:8 },
  input:{ width:'100%', minHeight:28, border:'1px solid #9ca3af', background:'#fff', color:'#111827', padding:'4px 7px', fontSize:12, fontFamily:'Segoe UI, Arial, sans-serif' },
  feedback:{ marginTop:8, border:'1px solid', padding:8, fontSize:12, background:'#fff' },
  primary:{ marginTop:8, background:'#0078d4', border:'1px solid #006cbe', color:'#fff', padding:'6px 10px', borderRadius:2, fontSize:12 },
  secondary:{ marginTop:8, background:'#fff', border:'1px solid #8a8886', color:'#111827', padding:'6px 10px', borderRadius:2, fontSize:12 },
  adRoot:{ minHeight:'100vh', background:'linear-gradient(180deg, #1b4d7d 0%, #16426e 42%, #102944 100%)', color:'#111827', fontFamily:'Segoe UI, Arial, sans-serif', display:'grid', gridTemplateRows:'64px 28px minmax(0, 1fr) 44px', position:'relative', overflow:'hidden' },
  adWallpaper:{ position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.12), transparent 30%), radial-gradient(circle at 80% 10%, rgba(255,255,255,0.08), transparent 26%), linear-gradient(135deg, rgba(255,255,255,0.04), transparent 45%)', opacity:0.9 },
  pathBar:{ background:'rgba(247,248,252,0.95)', color:'#374151', borderBottom:'1px solid #cfd6df', padding:'6px 10px', fontSize:12, backdropFilter:'blur(6px)' },
  adGrid:{ minHeight:0, display:'grid', gridTemplateColumns:'220px minmax(0, 1fr) 340px', gap:12, padding:12, position:'relative', zIndex:1 },
  desktopRail:{ background:'rgba(12,22,36,0.3)', border:'1px solid rgba(255,255,255,0.16)', borderRadius:12, padding:12, color:'#e5eef9', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.04)' },
  desktopRailTitle:{ fontSize:12, fontWeight:600, letterSpacing:1.5, textTransform:'uppercase', color:'#cfe3ff', marginBottom:10 },
  desktopShortcutGrid:{ display:'grid', gap:10 },
  desktopShortcut:{ textAlign:'left', border:'1px solid transparent', borderRadius:10, background:'rgba(255,255,255,0.04)', color:'#eff6ff', padding:10, cursor:'pointer' },
  desktopShortcutActive:{ background:'rgba(96,165,250,0.16)', borderColor:'rgba(191,219,254,0.4)' },
  desktopShortcutIcon:{ width:44, height:44, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(180deg, #eff6ff 0%, #bfdbfe 100%)', color:'#0f172a', fontWeight:700, fontSize:13, marginBottom:8, boxShadow:'inset 0 1px 0 rgba(255,255,255,0.5)' },
  desktopShortcutLabel:{ fontSize:12, fontWeight:600, lineHeight:1.25, color:'#f8fbff' },
  desktopShortcutSub:{ fontSize:11, lineHeight:1.35, color:'#c8d9ee', marginTop:4 },
  desktopHint:{ marginTop:12, paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.12)', fontSize:11, color:'#c8d9ee', lineHeight:1.45 },
  adWindow:{ minWidth:0, display:'grid', gridTemplateRows:'42px 28px 38px minmax(0, 1fr)', background:'rgba(240,243,248,0.96)', border:'1px solid #aeb7c4', borderRadius:12, overflow:'hidden', boxShadow:'0 18px 50px rgba(5,15,30,0.34)' },
  adWindowTitleBar:{ background:'linear-gradient(180deg, #f7f9fc 0%, #d9e2ef 100%)', borderBottom:'1px solid #aeb7c4', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 10px' },
  adWindowTitleCluster:{ display:'flex', alignItems:'center', gap:10 },
  adAppIcon:{ width:34, height:24, borderRadius:4, background:'linear-gradient(180deg, #0078d4 0%, #005a9e 100%)', color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, letterSpacing:1 },
  adWindowTitle:{ fontSize:13, fontWeight:700, color:'#0f172a' },
  adWindowSub:{ fontSize:11, color:'#475569' },
  adWinButtons:{ display:'flex', gap:2 },
  adWinBtn:{ width:28, height:22, display:'inline-flex', alignItems:'center', justifyContent:'center', border:'1px solid #bac4d1', background:'#eef2f7', fontSize:12, color:'#0f172a' },
  adMenuBar:{ background:'#f7f8fb', borderBottom:'1px solid #c8d2df', display:'flex', alignItems:'center', gap:18, padding:'0 12px', fontSize:12, color:'#111827' },
  adToolbar:{ background:'#edf3fb', borderBottom:'1px solid #c8d2df', display:'flex', alignItems:'center', gap:8, padding:'7px 10px', flexWrap:'wrap' },
  adToolbarBtn:{ background:'linear-gradient(180deg, #ffffff 0%, #e7eef8 100%)', border:'1px solid #aab4c2', color:'#111827', padding:'5px 10px', fontSize:12, borderRadius:2 },
  adToolbarText:{ marginLeft:'auto', fontSize:12, color:'#475569' },
  adConsoleGrid:{ minHeight:0, display:'grid', gridTemplateColumns:'250px minmax(0, 1fr)', gap:10, padding:10 },
  adTreePane:{ minWidth:0, display:'grid', gridTemplateRows:'34px minmax(0, 1fr)', background:'#fff', border:'1px solid #cfd6df' },
  adTreeWrap:{ overflow:'auto', paddingBottom:6 },
  adListPane:{ minWidth:0, display:'grid', gridTemplateRows:'34px 72px minmax(0, 1fr) auto', gap:8 },
  adSummaryRow:{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:8 },
  adSummaryCard:{ background:'linear-gradient(180deg, #fff 0%, #eef4fa 100%)', border:'1px solid #cdd7e4', padding:'10px 12px', display:'grid', gap:4, fontSize:12 },
  adNameCell:{ display:'flex', alignItems:'center', gap:8 },
  adObjectIcon:{ width:28, height:28, display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:6, background:'linear-gradient(180deg, #dbeafe 0%, #93c5fd 100%)', color:'#0f172a', fontSize:11, fontWeight:700 },
  adTypePill:{ display:'inline-flex', alignItems:'center', padding:'3px 8px', borderRadius:999, background:'#edf4fb', border:'1px solid #c8d7ea', color:'#0f172a', fontSize:11 },
  adEvidenceStrip:{ display:'grid', gridTemplateRows:'34px minmax(0, 1fr)', gap:0, minHeight:0 },
  adDetailPane:{ minWidth:0, display:'grid', gridTemplateRows:'42px minmax(0, 1fr) minmax(0, 0.95fr)', gap:10 },
  detailTopBar:{ display:'flex', alignItems:'center', padding:'0 12px', background:'rgba(255,255,255,0.86)', border:'1px solid #cfd6df', fontSize:12, fontWeight:600, color:'#111827' },
  adAuditPane:{ minHeight:0, display:'grid', gridTemplateRows:'34px minmax(0, 1fr)', background:'rgba(255,255,255,0.94)', border:'1px solid #cfd6df' },
  adAuditBody:{ padding:10, overflow:'auto', display:'grid', gap:8 },
  adAuditCard:{ border:'1px solid #d6deea', background:'linear-gradient(180deg, #fff 0%, #f5f8fc 100%)', padding:10, borderRadius:6 },
  adAuditCardTitle:{ fontSize:12, fontWeight:700, color:'#0f172a' },
  adAuditCardBody:{ fontSize:12, color:'#374151', marginTop:4, lineHeight:1.45 },
  adAuditCardMeta:{ fontSize:11, color:'#64748b', marginTop:6 },
  adTaskbar:{ position:'relative', zIndex:1, background:'linear-gradient(180deg, rgba(31,41,55,0.92), rgba(15,23,42,0.96))', borderTop:'1px solid rgba(255,255,255,0.14)', display:'flex', alignItems:'center', gap:10, padding:'0 12px', color:'#e5eef9' },
  adStartBtn:{ background:'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)', border:'1px solid rgba(255,255,255,0.18)', color:'#fff', padding:'6px 12px', borderRadius:999, fontSize:12, fontWeight:700 },
  adTaskItem:{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', color:'#eff6ff', padding:'5px 10px', borderRadius:999, fontSize:12 },
  adTaskSpacer:{ flex:1 },
  adTaskClock:{ fontSize:12, color:'#cfe3ff' },
  tabs:{ display:'flex', gap:2, marginBottom:8 },
  statusLine:{ color:'#374151', fontSize:12, padding:'6px 0' },
  splunkRoot:{ minHeight:'100vh', background:'#e8ebee', color:'#1f2933', fontFamily:'"Helvetica Neue", Arial, sans-serif', display:'grid', gridTemplateRows:'48px auto 40px minmax(0, 1fr)' },
  splunkTop:{ display:'grid', gridTemplateColumns:'auto minmax(0, 1fr) auto', alignItems:'center', gap:18, background:'#171d21', color:'#d5dadd', padding:'0 16px', fontSize:13, borderBottom:'1px solid #0d1114' },
  splunkBrand:{ display:'flex', alignItems:'center', gap:10 },
  splunkWordmark:{ fontSize:22, lineHeight:1, color:'#ffffff', fontWeight:300, letterSpacing:'-0.04em' },
  splunkProduct:{ fontSize:12, color:'#8f9aa3', textTransform:'uppercase', letterSpacing:'0.12em' },
  splunkNav:{ display:'flex', alignItems:'center', gap:18, color:'#b3bcc3', whiteSpace:'nowrap' },
  splunkNavActive:{ color:'#ffffff', fontWeight:600 },
  splunkTopMeta:{ display:'flex', alignItems:'center', gap:14, color:'#8f9aa3', fontSize:12 },
  darkBack:{ background:'#232b30', color:'#fff', border:'1px solid #3a4348', width:28, height:28, borderRadius:2 },
  searchBar:{ display:'grid', gap:10, padding:12, background:'#f5f6f7', borderBottom:'1px solid #cfd6dc' },
  splunkSearchMeta:{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' },
  splunkDataset:{ background:'#ffffff', border:'1px solid #c9d0d6', color:'#2d3a43', borderRadius:3, padding:'3px 8px', fontSize:12, fontWeight:600 },
  splunkMetaText:{ color:'#5b6871', fontSize:12 },
  splunkSearchRow:{ display:'grid', gridTemplateColumns:'minmax(0, 1fr) 160px 96px', gap:8 },
  splunkInput:{ border:'1px solid #b8c2c8', borderRadius:2, fontFamily:'Menlo, Consolas, monospace', fontSize:14, padding:'9px 10px', color:'#111827', background:'#fff', boxShadow:'inset 0 1px 1px rgba(0,0,0,0.06)' },
  select:{ border:'1px solid #b8c2c8', borderRadius:2, background:'#fff', color:'#1f2933', fontSize:12, padding:'0 8px' },
  splunkRun:{ background:'#78b43d', color:'#fff', border:'1px solid #5f932f', borderRadius:2, fontWeight:700, fontSize:12 },
  splunkHelperRow:{ display:'flex', gap:8, flexWrap:'wrap' },
  splunkHelperChip:{ background:'#eef2f4', border:'1px solid #cfd6dc', borderRadius:2, color:'#4b5963', fontSize:11, padding:'4px 8px' },
  splunkSubnav:{ display:'flex', alignItems:'center', gap:18, padding:'0 16px', background:'#ffffff', borderBottom:'1px solid #cfd6dc', fontSize:12, color:'#60707a' },
  splunkSubnavActive:{ color:'#111827', fontWeight:700, borderBottom:'2px solid #78b43d', alignSelf:'stretch', display:'inline-flex', alignItems:'center' },
  splunkBody:{ minHeight:0, display:'grid', gridTemplateColumns:'250px minmax(0, 1fr) 360px' },
  fieldsPane:{ background:'#f7f8f9', borderRight:'1px solid #cfd6dc', padding:14, overflow:'auto' },
  splunkPaneTitle:{ fontSize:12, fontWeight:700, color:'#34424b', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 },
  splunkPaneSection:{ marginBottom:16 },
  splunkSectionTitle:{ fontSize:11, color:'#6c7a83', textTransform:'uppercase', marginBottom:6 },
  fieldBtn:{ width:'100%', display:'flex', justifyContent:'space-between', background:'transparent', color:'#2f3b44', border:'1px solid transparent', borderBottom:'1px solid #e2e7ea', borderRadius:0, padding:'7px 2px', fontSize:12 },
  splunkFieldStatic:{ display:'flex', justifyContent:'space-between', color:'#5e6a73', borderBottom:'1px solid #e2e7ea', padding:'7px 2px', fontSize:12 },
  resultsPane:{ minWidth:0, padding:14, display:'grid', gridTemplateRows:'auto auto auto minmax(0, 1fr)', gap:10, background:'#edf1f4' },
  resultsHeader:{ display:'flex', justifyContent:'space-between', gap:12, alignItems:'flex-start', fontSize:13, background:'#fff', border:'1px solid #cfd6dc', padding:'10px 12px' },
  splunkResultsKicker:{ fontSize:11, color:'#6c7a83', textTransform:'uppercase', marginBottom:4 },
  splunkStatusPills:{ display:'flex', gap:8, flexWrap:'wrap' },
  splunkStatusPill:{ background:'#f3f5f6', border:'1px solid #d8dee3', color:'#56636c', borderRadius:12, padding:'3px 8px', fontSize:11 },
  splunkResultTabs:{ display:'flex', gap:2, alignItems:'end' },
  splunkTab:{ background:'#e2e7ea', border:'1px solid #c6d0d6', borderBottom:'none', color:'#55636c', padding:'7px 10px', fontSize:12, borderTopLeftRadius:2, borderTopRightRadius:2 },
  splunkTabActive:{ background:'#ffffff', border:'1px solid #c6d0d6', borderBottom:'none', color:'#1f2933', padding:'7px 10px', fontSize:12, fontWeight:700, borderTopLeftRadius:2, borderTopRightRadius:2 },
  timelineWrap:{ border:'1px solid #cfd6dc', background:'#fff' },
  splunkTimelineHead:{ display:'flex', justifyContent:'space-between', padding:'8px 10px', borderBottom:'1px solid #e0e6ea', fontSize:12, color:'#5f6c75' },
  timeline:{ display:'flex', alignItems:'end', gap:4, padding:'10px', minHeight:86 },
  splunkTimelineBarWrap:{ flex:1, minWidth:6, display:'flex', alignItems:'end' },
  bar:{ width:'100%', background:'linear-gradient(180deg, #9ccf62 0%, #6fa838 100%)', minWidth:3, borderRadius:'1px 1px 0 0' },
  splunkTableWrap:{ minHeight:0, overflow:'auto', border:'1px solid #cfd6dc', background:'#fff' },
  splunkTable:{ width:'100%', borderCollapse:'collapse', fontSize:12, tableLayout:'fixed' },
  splunkTh:{ position:'sticky', top:0, background:'#f3f5f6', borderBottom:'1px solid #cfd6dc', borderRight:'1px solid #e2e7ea', color:'#4d5b64', textAlign:'left', padding:'8px 10px', fontWeight:700, whiteSpace:'nowrap' },
  splunkThInner:{ position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, minWidth:0 },
  splunkResizeHandle:{ alignSelf:'stretch', width:8, marginRight:-6, border:'none', borderLeft:'1px solid #c8d0d6', background:'linear-gradient(180deg, rgba(255,255,255,0), rgba(15,23,42,0.08), rgba(255,255,255,0))', cursor:'col-resize', padding:0, flex:'0 0 auto' },
  splunkTd:{ borderBottom:'1px solid #edf1f4', borderRight:'1px solid #f0f3f5', color:'#1f2933', padding:'7px 10px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontFamily:'Menlo, Consolas, monospace' },
  splunkTr:{ background:'#fff' },
  splunkTrAlt:{ background:'#fbfcfc' },
  splunkEmpty:{ padding:18, color:'#697780', fontSize:12 },
  splunkTaskRail:{ background:'#f7f8f9', borderLeft:'1px solid #cfd6dc', padding:14, overflow:'auto', display:'grid', alignContent:'start', gap:12 },
  splunkTaskBrief:{ background:'#fff', border:'1px solid #cfd6dc', padding:12 },
  splunkBriefTitle:{ fontSize:16, fontWeight:700, color:'#1f2933', marginBottom:6 },
  splunkBriefCopy:{ fontSize:13, color:'#55636c', lineHeight:1.55 },
  error:{ color:'#c53030' },
  snowRoot:{ minHeight:'100vh', background:'#f5f7f7', color:'#111827', display:'grid', gridTemplateColumns:'240px minmax(0, 1fr) 370px', fontFamily:'Segoe UI, Arial, sans-serif' },
  snowNav:{ background:'#1f2a2e', color:'#fff', padding:12, display:'flex', flexDirection:'column', gap:8 },
  snowBack:{ background:'#2f3d42', color:'#fff', border:'1px solid #506066', padding:8, textAlign:'left' },
  navFilter:{ background:'#fff', border:'none', padding:8, color:'#111827' },
  navItem:{ background:'transparent', border:'none', color:'#d1d5db', textAlign:'left', padding:'7px 5px', borderRadius:0 },
  snowMain:{ minWidth:0, display:'grid', gridTemplateRows:'54px minmax(0, 1fr)' },
  snowHead:{ background:'#fff', borderBottom:'1px solid #d6dde1', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px' },
  newBtn:{ background:'#81b5a1', color:'#fff', border:'1px solid #6b9e8a', padding:'5px 14px' },
  snowWorkspace:{ minHeight:0, display:'grid', gridTemplateRows:'minmax(210px, 45%) minmax(260px, 55%)', gap:10, padding:12 },
  snowList:{ minHeight:0, display:'grid', gridTemplateRows:'32px minmax(0, 1fr)' },
  listCtrl:{ display:'flex', justifyContent:'space-between', background:'#fff', border:'1px solid #d1d5db', borderBottom:'none', padding:'7px 9px', fontSize:12 },
  snowForm:{ background:'#fff', border:'1px solid #d1d5db', padding:12, overflow:'auto' },
  formBar:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:12 },
  formTitle:{ fontSize:18, fontWeight:600, margin:'0 0 12px' },
  stateButtons:{ display:'flex', gap:8, flexWrap:'wrap' },
  formGrid:{ display:'grid', gridTemplateColumns:'repeat(2, minmax(180px, 1fr))', gap:10 },
  notes:{ marginTop:12, width:'100%', minHeight:90, border:'1px solid #9ca3af', padding:8, fontFamily:'Segoe UI, Arial, sans-serif' },
  azureRoot:{ minHeight:'100vh', background:'#f3f2f1', color:'#1b1a19', display:'grid', gridTemplateColumns:'220px minmax(0, 1fr) 370px', fontFamily:'Segoe UI, Arial, sans-serif' },
  azureNav:{ background:'#fff', borderRight:'1px solid #d2d0ce', padding:10, display:'flex', flexDirection:'column', gap:5 },
  azureHome:{ background:'#0078d4', color:'#fff', border:'none', textAlign:'left', padding:8 },
  azureNavItem:{ background:'transparent', border:'none', color:'#323130', textAlign:'left', padding:'8px 6px', borderRadius:0 },
  azureMain:{ minWidth:0, padding:16, overflow:'auto' },
  azureHead:{ display:'flex', justifyContent:'space-between', gap:16, marginBottom:14 },
  crumbs:{ fontSize:12, color:'#605e5c', marginBottom:4 },
  azureTitle:{ fontSize:24, fontWeight:600, margin:0 },
  azureSearch:{ width:320, height:32, border:'1px solid #8a8886', padding:'0 9px' },
  metrics:{ display:'grid', gridTemplateColumns:'repeat(4, minmax(130px, 1fr))', gap:10, marginBottom:12 },
  metric:{ background:'#fff', border:'1px solid #d2d0ce', padding:12, display:'grid', gap:8 },
  azureBlades:{ display:'grid', gridTemplateColumns:'minmax(0, 1.1fr) minmax(320px, 0.9fr)', gap:12, minHeight:420 },
  blade:{ minHeight:0, display:'grid', gridTemplateRows:'38px minmax(0, 1fr)' },
  bladeTitle:{ background:'#fff', border:'1px solid #d2d0ce', borderBottom:'none', padding:'9px 10px', fontWeight:600, fontSize:13 },
  detailBlade:{ minHeight:0, display:'grid', gridTemplateRows:'38px 34px minmax(0, 1fr)' },
  azureTabs:{ background:'#fff', border:'1px solid #d2d0ce', borderBottom:'none', display:'flex', gap:14, alignItems:'center', padding:'0 10px', fontSize:12, color:'#0067b8' },
  evRoot:{ minHeight:'100vh', background:'#dfe3ea', color:'#111827', fontFamily:'Segoe UI, Arial, sans-serif', display:'grid', gridTemplateRows:'34px 28px 40px minmax(0, 1fr)' },
  evTitleBar:{ background:'linear-gradient(180deg, #f6f7fb 0%, #d9dde6 100%)', borderBottom:'1px solid #aeb6c2', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 10px' },
  evTitleCluster:{ display:'flex', alignItems:'center', gap:10 },
  evBack:{ width:24, height:24, border:'1px solid #aeb6c2', background:'#fff', color:'#1f2937', padding:0 },
  evAppTitle:{ fontSize:13, fontWeight:600, color:'#111827' },
  evAppSub:{ fontSize:11, color:'#4b5563' },
  evWinButtons:{ display:'flex', gap:2 },
  evWinBtn:{ width:28, height:22, display:'inline-flex', alignItems:'center', justifyContent:'center', border:'1px solid #c4cad4', background:'#eef1f6', fontSize:12 },
  evMenuBar:{ background:'#f7f8fb', borderBottom:'1px solid #c3cad5', display:'flex', alignItems:'center', gap:18, padding:'0 12px', fontSize:12 },
  evToolbar:{ background:'#edf1f6', borderBottom:'1px solid #c3cad5', display:'flex', alignItems:'center', gap:8, padding:'6px 10px', flexWrap:'wrap' },
  evToolBtn:{ background:'linear-gradient(180deg, #ffffff 0%, #e8edf5 100%)', border:'1px solid #aab4c2', color:'#111827', padding:'5px 10px', fontSize:12, borderRadius:2 },
  evLayout:{ minHeight:0, display:'grid', gridTemplateColumns:'250px minmax(0, 1fr) 320px' },
  evNav:{ background:'#f5f6f8', borderRight:'1px solid #bcc5d1', overflow:'auto' },
  evCenter:{ minWidth:0, display:'grid', gridTemplateRows:'32px 72px minmax(240px, 1fr) minmax(220px, 0.78fr)', background:'#fff' },
  evActions:{ background:'#f7f7fa', borderLeft:'1px solid #bcc5d1', padding:10, overflow:'auto' },
  evPaneTitle:{ height:32, display:'flex', alignItems:'center', padding:'0 10px', fontSize:12, fontWeight:600, background:'#eef2f7', borderBottom:'1px solid #c4cad4' },
  evTreeRoot:{ padding:'10px 12px 4px', fontSize:12, fontWeight:600, color:'#111827' },
  evTreeBranch:{ padding:'0 12px 6px', fontSize:12, color:'#374151' },
  evTreeItem:{ width:'calc(100% - 12px)', margin:'0 6px 2px', border:'1px solid transparent', background:'transparent', color:'#111827', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 8px', textAlign:'left', fontSize:12, borderRadius:2 },
  evTreeItemActive:{ background:'#cfe8ff', borderColor:'#7fb8f1' },
  evTreeCount:{ color:'#6b7280', fontSize:11 },
  evFilterRow:{ display:'grid', gridTemplateColumns:'170px 220px minmax(0, 1fr)', gap:10, alignItems:'center', padding:'8px 10px', background:'#f8f9fb', borderBottom:'1px solid #d3d8e1' },
  evField:{ display:'grid', gap:4, fontSize:11, color:'#374151' },
  evInput:{ height:28, border:'1px solid #aab4c2', background:'#fff', padding:'0 8px', fontSize:12, color:'#111827' },
  evSummary:{ alignSelf:'end', fontSize:12, color:'#111827', fontWeight:600 },
  evSummaryMeta:{ display:'block', fontSize:11, fontWeight:400, color:'#6b7280' },
  evListPane:{ minHeight:0, overflow:'auto' },
  evTable:{ width:'100%', borderCollapse:'collapse', fontSize:12, tableLayout:'fixed' },
  evTh:{ position:'sticky', top:0, background:'#f3f5f8', borderBottom:'1px solid #c7cfda', padding:'6px 8px', textAlign:'left', fontWeight:600, color:'#374151' },
  evTr:{ cursor:'default', borderBottom:'1px solid #edf0f4' },
  evTrActive:{ background:'#dbeeff' },
  evTd:{ padding:'6px 8px', color:'#111827', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  evLevelDot:{ width:10, height:10, borderRadius:'50%', display:'inline-block', marginRight:8, verticalAlign:'middle' },
  evDetailPane:{ minHeight:0, borderTop:'1px solid #c7cfda', background:'#fafbfd', display:'grid', gridTemplateRows:'42px minmax(0, 1fr)' },
  evDetailHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, padding:'6px 10px', borderBottom:'1px solid #d7dde6' },
  evDetailTitle:{ fontSize:13, fontWeight:600, color:'#111827' },
  evDetailMeta:{ fontSize:11, color:'#6b7280', marginTop:2 },
  evTabs:{ display:'flex', gap:6 },
  evTab:{ background:'#eff3f9', border:'1px solid #bcc5d1', color:'#374151', padding:'4px 10px', fontSize:12 },
  evTabActive:{ background:'#fff', color:'#111827', borderBottomColor:'#fff' },
  evDetailBody:{ padding:10, overflow:'auto' },
  evMessageBox:{ border:'1px solid #cad2de', background:'#fff', padding:10, fontSize:12, lineHeight:1.45, marginBottom:10 },
  evMetaGrid:{ display:'grid', gridTemplateColumns:'repeat(3, minmax(120px, 1fr))', gap:8 },
  evMetaCard:{ border:'1px solid #d5dbe5', background:'#fff', padding:'8px 9px', display:'grid', gap:4 },
  evMetaLabel:{ fontSize:11, color:'#6b7280' },
  evMetaValue:{ fontSize:12, color:'#111827' },
  evCorrelationBox:{ marginTop:10, border:'1px solid #cdd6e2', background:'#eef6ff', padding:10, fontSize:12, color:'#1f2937' },
  evDetailTable:{ width:'100%', borderCollapse:'collapse', background:'#fff', border:'1px solid #d4dbe4' },
  evDetailKey:{ width:'38%', borderBottom:'1px solid #e5e7eb', padding:'7px 9px', fontSize:12, color:'#374151', background:'#f9fafb' },
  evDetailValue:{ borderBottom:'1px solid #e5e7eb', padding:'7px 9px', fontSize:12, color:'#111827' },
  evActionBtn:{ width:'100%', textAlign:'left', marginBottom:6, background:'linear-gradient(180deg, #ffffff 0%, #eef2f8 100%)', border:'1px solid #b8c2cf', color:'#111827', padding:'7px 9px', fontSize:12, borderRadius:2 },
  sysToolbarMeta:{ marginLeft:'auto', fontSize:11, color:'#4b5563' },
  sysTreeIndent:{ padding:'0 12px 4px 24px', fontSize:12, color:'#374151' },
  sysTreeIndent2:{ padding:'0 12px 6px 40px', fontSize:12, color:'#374151' },
  sysTreeMeta:{ padding:'8px 12px', fontSize:11, color:'#6b7280', lineHeight:1.4 },
  sysQueryPanel:{ display:'grid', gridTemplateRows:'28px 36px 26px', gap:6, padding:'8px 10px', background:'#f8f9fb', borderBottom:'1px solid #d3d8e1' },
  sysPathBar:{ display:'flex', alignItems:'center', padding:'0 8px', background:'#ffffff', border:'1px solid #cfd6df', fontSize:11, color:'#4b5563' },
  sysQueryRow:{ display:'grid', gridTemplateColumns:'minmax(0, 1fr) 92px', gap:8 },
  sysQueryInput:{ border:'1px solid #aab4c2', background:'#fff', padding:'0 8px', fontSize:12, color:'#111827', fontFamily:'Consolas, monospace' },
  sysQueryBtn:{ background:'#0078d4', border:'1px solid #006cbe', color:'#fff', fontSize:12 },
  sysBadgeRow:{ display:'flex', gap:6, flexWrap:'wrap' },
  sysBadge:{ display:'inline-flex', alignItems:'center', padding:'2px 7px', background:'#eef4fb', border:'1px solid #c8d7ea', color:'#0f172a', fontSize:11, borderRadius:999 },
  sysMessageBox:{ margin:0, border:'1px solid #cad2de', background:'#fff', padding:10, fontSize:12, lineHeight:1.45, marginBottom:10, whiteSpace:'pre-wrap', fontFamily:'Segoe UI, Arial, sans-serif' },
  sysXmlBox:{ margin:0, border:'1px solid #cad2de', background:'#fff', padding:10, fontSize:11, lineHeight:1.45, whiteSpace:'pre-wrap', fontFamily:'Consolas, monospace', color:'#111827' },
  evGuide:{ marginTop:12, border:'1px solid #c8cfda', background:'#fff' },
  evGuideHead:{ padding:'8px 10px', borderBottom:'1px solid #d6dbe4', background:'#f2f4f8', fontSize:12, fontWeight:600, color:'#111827' },
  evExerciseList:{ padding:8, display:'grid', gap:6 },
  evExerciseBtn:{ textAlign:'left', border:'1px solid #d8dee7', background:'#fff', color:'#1f2937', padding:'7px 8px', fontSize:12 },
  evExerciseBtnActive:{ background:'#dbeeff', borderColor:'#7fb8f1' },
  evGuideCard:{ padding:10, borderTop:'1px solid #e5e7eb', display:'grid', gap:8 },
  evGuideTitle:{ fontSize:13, fontWeight:600, color:'#111827' },
  evGuideStep:{ fontSize:12, color:'#374151', lineHeight:1.45 },
  evExpected:{ marginTop:2, border:'1px solid #d9dde5', background:'#f8fafc', padding:'8px 9px', fontSize:12, color:'#111827', lineHeight:1.45 },
  evQueryTabs:{ padding:8, display:'flex', gap:6, flexWrap:'wrap' },
  evQueryTab:{ background:'#fff', border:'1px solid #cfd6df', color:'#374151', padding:'5px 8px', fontSize:11 },
  evQueryTabActive:{ background:'#dbeeff', borderColor:'#7fb8f1', color:'#111827' },
  evQueryBox:{ width:'calc(100% - 16px)', margin:'0 8px 8px', minHeight:112, border:'1px solid #cfd6df', background:'#fbfbfc', color:'#111827', fontFamily:'Consolas, monospace', fontSize:11, padding:8, resize:'vertical' },
  evLpsMeta:{ padding:'0 10px 8px', fontSize:11, color:'#6b7280' },
  evMiniTable:{ width:'calc(100% - 16px)', margin:'0 8px 8px', borderCollapse:'collapse', fontSize:12, border:'1px solid #d4dbe4' },
  evMiniTh:{ textAlign:'left', padding:'6px 8px', background:'#f3f5f8', borderBottom:'1px solid #d4dbe4', color:'#374151' },
  evMiniTd:{ padding:'6px 8px', borderBottom:'1px solid #e5e7eb', color:'#111827' },
  evModernKicker:{ fontSize:10, color:'#22c55e', letterSpacing:3, fontFamily:"'Space Mono',monospace", marginBottom:10 },
  evModernTitle:{ fontSize:24, lineHeight:1.08, fontWeight:700, color:'#f8fafc', maxWidth:620 },
  evModernSub:{ fontSize:13, color:'#94a3b8', marginTop:10 },
  evModernStats:{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:12 },
  evModernStatCard:{ background:'linear-gradient(180deg, rgba(15,21,32,0.82), rgba(8,13,20,0.68))', border:'1px solid rgba(56,189,248,0.12)', padding:'16px 18px' },
  evModernStatValue:{ fontSize:20, fontWeight:700, color:'#22c55e', fontFamily:"'Space Mono',monospace" },
  evModernStatLabel:{ fontSize:10, color:'#475569', letterSpacing:2, marginTop:6 },
  snowQuizTrigger:{ width:'100%', textAlign:'center', marginTop:10, display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8, background:'linear-gradient(180deg, #92c3b1 0%, #6b9e8a 100%)', border:'1px solid #5c8b78', color:'#0a1f18', padding:'8px 9px', borderRadius:2, fontFamily:'Segoe UI, Arial, sans-serif', fontSize:12, fontWeight:600, cursor:'pointer' },
  snowQuizTriggerIcon:{ width:14, height:14, objectFit:'contain' },
  snowQuizCard:{ background:'#fff', border:'1px solid #d1d5db', padding:'18px 18px 16px' },
  snowQuizFieldLabel:{ fontSize:11, color:'#6b7280', letterSpacing:0.5, textTransform:'uppercase', marginBottom:10, fontFamily:'Segoe UI, Arial, sans-serif' },
  snowQuizPrompt:{ fontSize:15, fontWeight:600, color:'#111827', lineHeight:1.45, marginBottom:14, fontFamily:'Segoe UI, Arial, sans-serif' },
  snowQuizOptions:{ display:'grid', gap:8 },
  snowQuizOption:{ display:'flex', alignItems:'center', gap:10, fontSize:13, color:'#111827', border:'1px solid #d1d5db', background:'#f9fafb', padding:'9px 12px', fontFamily:'Segoe UI, Arial, sans-serif', transition:'background 0.2s ease, border-color 0.2s ease, color 0.2s ease' },
  snowQuizOptionCorrect:{ borderColor:'#6b9e8a', background:'rgba(107,158,138,0.16)', color:'#1f3d33' },
  snowQuizOptionWrong:{ borderColor:'#c0392b', background:'rgba(192,57,43,0.08)', color:'#7a2e25' },
  snowQuizOptionReveal:{ borderColor:'#6b9e8a', background:'rgba(107,158,138,0.08)', color:'#1f3d33' },
  snowQuizResult:{ padding:'12px 16px', fontSize:13, fontWeight:600, fontFamily:'Segoe UI, Arial, sans-serif' },
  snowQuizResultPass:{ border:'1px solid #6b9e8a', background:'rgba(107,158,138,0.14)', color:'#1f3d33' },
  snowQuizResultFail:{ border:'1px solid #e0a94b', background:'rgba(224,169,75,0.14)', color:'#7a5a1a' },
  snowQuizResultHint:{ border:'1px solid #9ca3af', background:'#f3f4f6', color:'#374151' },
  snowQuizFoot:{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:10, padding:'0 24px', borderTop:'1px solid #d6dde1', background:'#fff' },
  snowQuizPrimary:{ background:'#fff', border:'1px solid #8a8886', color:'#111827', fontFamily:'Segoe UI, Arial, sans-serif', fontSize:12, fontWeight:600, padding:'8px 16px', borderRadius:2, cursor:'pointer' },
  snowQuizSecondary:{ background:'transparent', border:'1px solid #d1d5db', color:'#374151', fontFamily:'Segoe UI, Arial, sans-serif', fontSize:12, padding:'8px 14px', borderRadius:2, cursor:'pointer' },
  snowQuizResolveBtn:{ background:'linear-gradient(180deg, #92c3b1 0%, #6b9e8a 100%)', border:'1px solid #5c8b78', color:'#0a1f18', fontFamily:'Segoe UI, Arial, sans-serif', fontSize:12, fontWeight:700, padding:'8px 16px', borderRadius:2, cursor:'pointer' },
  snowQuizDrawer:{ position:'fixed', left:20, bottom:72, width:'min(560px, calc(100vw - 40px))', zIndex:1000, background:'#f5f7f7', border:'1px solid #d1d5db', boxShadow:'0 30px 90px rgba(0,0,0,0.35)', color:'#111827', overflow:'hidden', willChange:'transform', resize:'both', fontFamily:'Segoe UI, Arial, sans-serif' },
  snowQuizDrawerOpen:{ height:'auto', minHeight:300, maxHeight:'none', opacity:1, display:'grid', gridTemplateRows:'auto auto 54px' },
  snowQuizHeadDrag:{ position:'relative', touchAction:'none', cursor:'grab', userSelect:'none' },
  snowQuizGrip:{ position:'absolute', top:8, left:'50%', transform:'translateX(-50%)', width:56, height:4, borderRadius:999, background:'#c3cad2' },
  snowQuizHead:{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, padding:'20px 24px 14px', background:'#1f2a2e', borderBottom:'1px solid #506066' },
  snowQuizBrand:{ display:'flex', alignItems:'flex-start', gap:14 },
  snowQuizBreadcrumb:{ fontSize:11, color:'#9fb0aa', marginBottom:6 },
  snowQuizTitleRow:{ display:'flex', alignItems:'center', gap:10, marginBottom:6 },
  snowQuizNumber:{ fontSize:13, fontWeight:700, color:'#fff', fontFamily:'Consolas, monospace' },
  snowQuizStatePill:{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase', padding:'3px 8px', borderRadius:999 },
  snowQuizStatePillNew:{ background:'#506066', color:'#fff' },
  snowQuizStatePillProgress:{ background:'#e0a94b', color:'#3a2c07' },
  snowQuizStatePillResolved:{ background:'#6b9e8a', color:'#0a1f18' },
  snowQuizTitle:{ fontSize:18, lineHeight:1.2, fontWeight:700, color:'#fff' },
  snowQuizSub:{ fontSize:12, color:'#c3cdc9', marginTop:8, maxWidth:420 },
  snowQuizActions:{ display:'flex', alignItems:'center', gap:10 },
  snowQuizCloseBtn:{ background:'#2f3d42', border:'1px solid #506066', color:'#fff', fontFamily:'Segoe UI, Arial, sans-serif', fontSize:12, padding:'7px 12px', borderRadius:2, cursor:'pointer' },
  snowQuizBody:{ overflow:'visible', padding:20, display:'grid', gap:14, background:'#f5f7f7' },
  regRoot:{ minHeight:'100vh', background:'#cfd8e3', color:'#111827', fontFamily:'Segoe UI, Arial, sans-serif', display:'grid', gridTemplateColumns:'minmax(0, 1fr) 370px' },
  regMain:{ minWidth:0, display:'grid', gridTemplateRows:'32px 26px 38px 38px minmax(0, 1fr) 22px', background:'#f5f6f7', position:'relative', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.72)' },
  regTitleBar:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 8px', background:'linear-gradient(180deg, #f8fbff, #dce8f7)', borderBottom:'1px solid #aab7c7', fontSize:12, fontWeight:600 },
  regTitleGroup:{ display:'flex', alignItems:'center', gap:8 },
  regBack:{ width:24, height:22, border:'1px solid #aab7c7', background:'linear-gradient(180deg, #ffffff, #edf2f7)', color:'#1f2937', padding:0 },
  regAppIcon:{ width:18, height:18, display:'inline-flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(180deg, #0f6cbd, #0b57a0)', color:'#fff', fontSize:12, boxShadow:'inset 0 1px 0 rgba(255,255,255,0.25)' },
  regWinButtons:{ display:'flex', gap:6 },
  regWinBtn:{ width:28, textAlign:'center', border:'1px solid #c4ced9', background:'linear-gradient(180deg, #fbfdff, #eef2f7)', color:'#374151', lineHeight:'18px' },
  regMenuBar:{ display:'flex', alignItems:'center', gap:18, padding:'0 12px', background:'#f9fafb', borderBottom:'1px solid #d6dde6', fontSize:12 },
  regToolbar:{ display:'grid', gridTemplateColumns:'auto minmax(0, 1fr) auto', alignItems:'center', gap:10, padding:'0 10px', background:'linear-gradient(180deg, #f4f6f9, #e9edf2)', borderBottom:'1px solid #cbd5e1' },
  regToolbarNav:{ display:'flex', alignItems:'center', gap:4 },
  regNavBtn:{ width:24, height:24, border:'1px solid #b8c2cf', background:'linear-gradient(180deg, #ffffff, #edf2f7)', color:'#4b5563', padding:0, borderRadius:2 },
  regToolbarCluster:{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' },
  regToolBtn:{ background:'linear-gradient(180deg, #ffffff, #eef2f7)', border:'1px solid #b6bec8', color:'#111827', padding:'5px 10px', fontSize:12, borderRadius:2, boxShadow:'inset 0 1px 0 rgba(255,255,255,0.75)' },
  regToolBtnPrimary:{ background:'linear-gradient(180deg, #fffef8, #f9e7a7)', border:'1px solid #c8b25f', color:'#111827', padding:'5px 10px', fontSize:12, borderRadius:2, boxShadow:'inset 0 1px 0 rgba(255,255,255,0.78)' },
  regCapture:{ fontSize:11, color:'#4b5563', whiteSpace:'nowrap' },
  regAddressBar:{ display:'grid', gridTemplateColumns:'60px minmax(0, 1fr)', alignItems:'center', gap:8, padding:'0 10px', background:'#fdfdfd', borderBottom:'1px solid #cfd6df' },
  regAddressLabel:{ fontSize:11, color:'#4b5563' },
  regAddressValue:{ border:'1px solid #b6bec8', background:'#fff', padding:'6px 8px', fontSize:12, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', boxShadow:'inset 0 1px 2px rgba(15,23,42,0.05)' },
  regWorkspace:{ minHeight:0, display:'grid', gridTemplateColumns:'320px 5px minmax(0, 1fr)' },
  regTreePane:{ background:'#fff', borderRight:'1px solid #cbd5e1', minHeight:0, display:'grid', gridTemplateRows:'32px minmax(0, 1fr)' },
  regSplitter:{ background:'linear-gradient(180deg, #eef2f7, #d7dee8)', borderRight:'1px solid #c3ccd7', borderLeft:'1px solid #f8fafc' },
  regValuePane:{ background:'#fff', minHeight:0, display:'grid', gridTemplateRows:'32px minmax(0, 1fr) auto' },
  regPaneHead:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 10px', background:'linear-gradient(180deg, #fafbfc, #eef2f6)', borderBottom:'1px solid #d1d5db', fontSize:12, color:'#374151' },
  regTreeScroll:{ overflow:'auto', padding:'6px 0' },
  regTreeRow:{ display:'flex', alignItems:'center', gap:6, minHeight:22, fontSize:12, color:'#111827', cursor:'pointer', userSelect:'none' },
  regTreeRowActive:{ background:'#cfe8ff', outline:'1px solid #9ccaf5', outlineOffset:-1 },
  regTwisty:{ width:18, height:18, border:'none', background:'transparent', color:'#4b5563', padding:0, fontSize:12 },
  regTreeFolderIcon:{ width:14, height:11, border:'1px solid #c28d1f', borderRadius:'1px 1px 2px 2px', background:'linear-gradient(180deg, #ffe08a, #f0c14a)', position:'relative', flex:'0 0 auto' },
  regTreeValueIcon:{ width:11, height:13, border:'1px solid #96a2b1', background:'linear-gradient(180deg, #ffffff, #eef2f7)', position:'relative', flex:'0 0 auto' },
  regTreeLabel:{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  regValueScroll:{ overflow:'auto' },
  regTable:{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed', fontSize:12 },
  regTh:{ textAlign:'left', padding:'5px 10px', background:'linear-gradient(180deg, #fafbfc, #edf2f6)', borderBottom:'1px solid #d1d5db', color:'#374151', fontWeight:600 },
  regTr:{ borderBottom:'1px solid #eef2f7', userSelect:'none' },
  regTrActive:{ background:'#cfe8ff' },
  regTrOpenable:{ cursor:'pointer' },
  regTd:{ padding:'7px 10px', color:'#111827', verticalAlign:'top', width:'28%' },
  regTdType:{ padding:'7px 10px', color:'#111827', verticalAlign:'top', width:'18%', fontFamily:'Segoe UI, Arial, sans-serif' },
  regTdData:{ padding:'7px 10px', color:'#374151', verticalAlign:'top', width:'54%', wordBreak:'break-word' },
  regNameCell:{ display:'flex', alignItems:'center', gap:8, minWidth:0 },
  regValueToggle:{ display:'inline-flex', alignItems:'center', gap:6, border:'none', background:'transparent', padding:0, margin:0, cursor:'pointer' },
  regValueToggleClosed:{ width:0, height:0, borderTop:'4px solid transparent', borderBottom:'4px solid transparent', borderLeft:'6px solid #4b5563', flex:'0 0 auto' },
  regValueToggleOpen:{ width:0, height:0, borderLeft:'4px solid transparent', borderRight:'4px solid transparent', borderTop:'6px solid #4b5563', flex:'0 0 auto' },
  regFolderIcon:{ width:15, height:11, border:'1px solid #c28d1f', borderRadius:'1px 1px 2px 2px', background:'linear-gradient(180deg, #ffe08a, #f0c14a)', position:'relative', flex:'0 0 auto' },
  regDataIcon:{ width:11, height:13, border:'1px solid #96a2b1', background:'linear-gradient(180deg, #ffffff, #eef2f7)', position:'relative', flex:'0 0 auto' },
  regNameText:{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  regNestedRow:{ background:'#f8fbff' },
  regNestedCell:{ padding:'0 10px 10px 34px', borderBottom:'1px solid #eef2f7' },
  regNestedPreview:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, border:'1px solid #d7e3f2', background:'linear-gradient(180deg, #ffffff, #f4f8fd)', padding:'8px 10px' },
  regNestedPath:{ fontSize:12, color:'#1f2937', fontFamily:'Segoe UI, Arial, sans-serif' },
  regNestedMeta:{ flex:1, fontSize:11, color:'#64748b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  regNestedOpenBtn:{ border:'1px solid #b6bec8', background:'linear-gradient(180deg, #ffffff, #eef2f7)', color:'#111827', padding:'4px 10px', fontSize:12, borderRadius:2, boxShadow:'inset 0 1px 0 rgba(255,255,255,0.75)' },
  regInspector:{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:8, padding:10, borderTop:'1px solid #d1d5db', background:'#f8fafc' },
  regInspectorCard:{ border:'1px solid #d1d5db', background:'#fff', padding:'8px 10px' },
  regInspectorLabel:{ fontSize:11, color:'#6b7280', marginBottom:4 },
  regInspectorCopy:{ fontSize:12, color:'#111827', lineHeight:1.4 },
  regInstructionList:{ display:'grid', gap:6 },
  regInstructionStep:{ fontSize:12, lineHeight:1.45, color:'#111827' },
  regInstructionHint:{ marginTop:8, fontSize:12, color:'#1d4ed8', lineHeight:1.45 },
  regQuickLinks:{ display:'flex', flexWrap:'wrap', gap:8, marginTop:10 },
  regStatusBar:{ display:'flex', alignItems:'center', padding:'0 10px', background:'linear-gradient(180deg, #eef2f7, #e1e7ee)', borderTop:'1px solid #cbd5e1', fontSize:11, color:'#4b5563', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  regBootLauncher:{ position:'fixed', right:390, bottom:18, zIndex:1000, display:'inline-flex', alignItems:'center', gap:10, background:'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(15,23,42,0.92))', border:'1px solid rgba(37,99,235,0.22)', color:'#dbeafe', padding:'10px 14px', boxShadow:'0 18px 48px rgba(15,23,42,0.35)', cursor:'pointer' },
  regBootIcon:{ width:28, height:28, objectFit:'contain' },
  regBootText:{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:2, fontWeight:700 },
  regBotDrawer:{ position:'fixed', left:18, right:390, bottom:18, zIndex:999, background:'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(15,23,42,0.94))', border:'1px solid rgba(37,99,235,0.22)', color:'#e5eefc', boxShadow:'0 30px 80px rgba(15,23,42,0.38)', overflow:'hidden' },
  regBotDrawerMin:{ height:86 },
  regBotDrawerOpen:{ minHeight:240 },
  regBotGrip:{ position:'absolute', top:8, left:'50%', transform:'translateX(-50%)', width:56, height:4, borderRadius:999, background:'rgba(148,163,184,0.35)' },
  regBotHead:{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, padding:'22px 22px 14px', borderBottom:'1px solid rgba(148,163,184,0.18)' },
  regBotKicker:{ fontSize:10, color:'#93c5fd', letterSpacing:3, fontFamily:"'Space Mono',monospace", marginBottom:8 },
  regBotTitle:{ fontSize:22, fontWeight:700, color:'#f8fafc' },
  regBotSub:{ fontSize:12, color:'#cbd5e1', marginTop:8 },
  regBotActions:{ display:'flex', gap:8 },
  regBotBtn:{ background:'transparent', border:'1px solid rgba(148,163,184,0.32)', color:'#cbd5e1', fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:2, padding:'8px 12px' },
  regBotBody:{ padding:18, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:12 },
  regBotSection:{ border:'1px solid rgba(148,163,184,0.16)', background:'rgba(15,23,42,0.46)', padding:12 },
  regBotSectionTitle:{ fontSize:11, color:'#93c5fd', letterSpacing:2, marginBottom:8, fontFamily:"'Space Mono',monospace" },
  regBotStep:{ fontSize:12, lineHeight:1.45, color:'#e2e8f0', marginBottom:7 },
  regBotLinks:{ display:'flex', flexWrap:'wrap', gap:8 },
  regBotLinkBtn:{ background:'#1d4ed8', border:'1px solid #2563eb', color:'#eff6ff', padding:'7px 10px', fontSize:12, borderRadius:3 },
  regBotTask:{ fontSize:12, lineHeight:1.45, color:'#e2e8f0', marginBottom:8 },
  regBotHint:{ fontSize:12, color:'#bfdbfe', lineHeight:1.45 },
};

const LabShells = {
  TaskInspector,
  ActiveDirectoryLabShell,
  SplunkLabShell,
  ServiceNowLabShell,
  AzureLabShell,
  EventViewerLabShell,
  SysmonLabShell,
  RegistryLabShell,
  LabCheckpointQuiz,
};

Object.assign(window, LabShells, { LabShells });
