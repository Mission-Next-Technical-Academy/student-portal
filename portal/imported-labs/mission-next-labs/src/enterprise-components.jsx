// ============================================================
//  Enterprise UI Primitives
// ============================================================

function EnterpriseToolbar({ menus = [], actions = [], right }) {
  return (
    <div style={entStyles.toolbar}>
      <div style={entStyles.menuStrip}>
        {menus.map(menu => <button key={menu} style={entStyles.menuButton}>{menu}</button>)}
      </div>
      <div style={entStyles.toolActions}>
        {actions.map(action => (
          <button
            key={action.label}
            onClick={action.onClick}
            disabled={action.disabled}
            title={action.title || action.label}
            style={{ ...entStyles.actionButton, ...(action.primary ? entStyles.primaryAction : null) }}
          >
            {action.icon && <span aria-hidden="true">{action.icon}</span>}
            <span>{action.label}</span>
          </button>
        ))}
      </div>
      <div style={entStyles.toolbarRight}>{right}</div>
    </div>
  );
}

function EnterpriseDataTable({ columns = [], rows = [], selectedKey, rowKey, onRowClick, onRowContextMenu, dense = true }) {
  return (
    <div style={entStyles.tableWrap}>
      <table style={entStyles.table}>
        <thead>
          <tr>
            {columns.map(col => <th key={col.key || col} style={entStyles.th}>{col.label || col}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const key = rowKey ? rowKey(row, index) : row.id || index;
            const selected = selectedKey !== undefined && selectedKey === key;
            return (
              <tr
                key={key}
                onClick={() => onRowClick?.(row, index)}
                onContextMenu={event => onRowContextMenu?.(event, row, index)}
                style={{
                  ...entStyles.tr,
                  ...(selected ? entStyles.selectedRow : null),
                  height: dense ? 28 : 34,
                }}
              >
                {columns.map(col => {
                  const id = col.key || col;
                  return <td key={id} style={entStyles.td}>{col.render ? col.render(row[id], row) : formatCell(id, row[id])}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && <div style={entStyles.empty}>No items to show in this view.</div>}
    </div>
  );
}

function EnterpriseTreeView({ nodes = [], selectedId, onSelect, onNodeContextMenu }) {
  return <div role="tree" style={entStyles.tree}>{nodes.map(node => <TreeNode key={node.id} node={node} selectedId={selectedId} onSelect={onSelect} onNodeContextMenu={onNodeContextMenu} depth={0} />)}</div>;
}

function TreeNode({ node, selectedId, onSelect, onNodeContextMenu, depth }) {
  const [open, setOpen] = React.useState(node.open !== false);
  const children = node.children || [];
  const selected = selectedId === node.id;
  return (
    <div>
      <button
        role="treeitem"
        aria-expanded={children.length ? open : undefined}
        onClick={() => {
          if (children.length) setOpen(value => !value);
          onSelect?.(node);
        }}
        onContextMenu={event => onNodeContextMenu?.(event, node)}
        style={{
          ...entStyles.treeItem,
          paddingLeft: 8 + depth * 16,
          background: selected ? '#dbeafe' : 'transparent',
          color: selected ? '#111827' : '#1f2937',
        }}
      >
        <span style={entStyles.twisty}>{children.length ? (open ? '▾' : '▸') : ''}</span>
        <span style={entStyles.treeIcon}>{node.icon || '□'}</span>
        <span style={entStyles.treeText}>{node.label}</span>
      </button>
      {open && children.map(child => <TreeNode key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />)}
    </div>
  );
}

function EnterpriseDetailPanel({ title, subtitle, fields = [], onClose }) {
  return (
    <aside style={entStyles.detailPanel}>
      <div style={entStyles.detailHeader}>
        <div>
          <div style={entStyles.detailTitle}>{title}</div>
          {subtitle && <div style={entStyles.detailSub}>{subtitle}</div>}
        </div>
        {onClose && <button onClick={onClose} style={entStyles.closeBtn}>x</button>}
      </div>
      <div style={entStyles.detailFields}>
        {fields.map(field => (
          <div key={field.label} style={entStyles.detailRow}>
            <span style={entStyles.detailLabel}>{field.label}</span>
            <span style={entStyles.detailValue}>{field.value}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

function EnterpriseModalForm({ title, children, primaryLabel = 'OK', secondaryLabel = 'Cancel', onSubmit, onCancel }) {
  if (!title) return null;
  return (
    <div style={entStyles.modalOverlay}>
      <div role="dialog" aria-modal="true" aria-label={title} style={entStyles.modal}>
        <div style={entStyles.modalTitle}>{title}</div>
        <div style={entStyles.modalBody}>{children}</div>
        <div style={entStyles.modalFooter}>
          <button onClick={onSubmit} style={entStyles.primaryDialog}>{primaryLabel}</button>
          <button onClick={onCancel} style={entStyles.dialogButton}>{secondaryLabel}</button>
        </div>
      </div>
    </div>
  );
}

function EnterpriseContextMenu({ x, y, items = [], onClose }) {
  React.useEffect(() => {
    function close() { onClose?.(); }
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);
  if (x == null || y == null) return null;
  return (
    <div style={{ ...entStyles.contextMenu, left: x, top: y }}>
      {items.map((item, index) => item.type === 'separator'
        ? <div key={index} style={entStyles.contextSeparator} />
        : <button key={item.label} onClick={item.onClick} style={entStyles.contextItem}>{item.label}</button>
      )}
    </div>
  );
}

const entStyles = {
  toolbar: { height:64, borderBottom:'1px solid #d1d5db', background:'#f8f8f8', color:'#111827', display:'grid', gridTemplateColumns:'auto 1fr auto', alignItems:'stretch', fontFamily:'Segoe UI, Arial, sans-serif' },
  menuStrip: { display:'flex', alignItems:'flex-start', gap:4, padding:'5px 8px 0' },
  menuButton: { border:'1px solid transparent', background:'transparent', color:'#111827', fontSize:12, padding:'3px 7px', borderRadius:0, cursor:'default' },
  toolActions: { display:'flex', alignItems:'center', gap:6, padding:'24px 8px 6px', minWidth:0 },
  actionButton: { display:'inline-flex', alignItems:'center', gap:6, border:'1px solid #b8c2cc', background:'#fff', color:'#111827', minHeight:26, padding:'4px 9px', borderRadius:2, fontSize:12, fontFamily:'Segoe UI, Arial, sans-serif' },
  primaryAction: { background:'#0078d4', borderColor:'#006cbe', color:'#fff' },
  toolbarRight: { display:'flex', alignItems:'center', padding:'0 12px', fontSize:12, color:'#4b5563' },
  tableWrap: { minHeight:0, overflow:'auto', background:'#fff', border:'1px solid #d1d5db' },
  table: { width:'100%', borderCollapse:'collapse', tableLayout:'auto', fontFamily:'Segoe UI, Arial, sans-serif', fontSize:12, color:'#111827' },
  th: { position:'sticky', top:0, zIndex:2, textAlign:'left', background:'#f3f4f6', borderBottom:'1px solid #c7cdd4', borderRight:'1px solid #d1d5db', padding:'5px 8px', fontWeight:400, whiteSpace:'nowrap' },
  tr: { cursor:'default', background:'#fff' },
  selectedRow: { background:'#cce8ff' },
  td: { borderRight:'1px solid #edf0f2', borderBottom:'1px solid #eef0f2', padding:'4px 8px', whiteSpace:'nowrap', maxWidth:280, overflow:'hidden', textOverflow:'ellipsis' },
  empty: { padding:24, color:'#6b7280', fontFamily:'Segoe UI, Arial, sans-serif', fontSize:12 },
  tree: { fontFamily:'Segoe UI, Arial, sans-serif', fontSize:12, color:'#111827', padding:'6px 0' },
  treeItem: { width:'100%', height:25, border:'none', borderRadius:0, display:'flex', alignItems:'center', gap:4, textAlign:'left', fontFamily:'Segoe UI, Arial, sans-serif', fontSize:12 },
  twisty: { width:12, color:'#374151' },
  treeIcon: { width:18, color:'#d97706' },
  treeText: { overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  detailPanel: { background:'#fff', borderLeft:'1px solid #cfd6df', color:'#111827', fontFamily:'Segoe UI, Arial, sans-serif', minWidth:280, maxWidth:360 },
  detailHeader: { display:'flex', justifyContent:'space-between', gap:12, padding:14, borderBottom:'1px solid #e5e7eb', background:'#f8fafc' },
  detailTitle: { fontSize:15, fontWeight:600 },
  detailSub: { marginTop:3, fontSize:12, color:'#6b7280' },
  closeBtn: { border:'none', background:'transparent', color:'#374151', fontSize:16, borderRadius:0, alignSelf:'flex-start' },
  detailFields: { padding:14, display:'grid', gap:10 },
  detailRow: { display:'grid', gap:3 },
  detailLabel: { fontSize:11, color:'#6b7280' },
  detailValue: { fontSize:12, color:'#111827', wordBreak:'break-word' },
  modalOverlay: { position:'fixed', inset:0, background:'rgba(17,24,39,0.32)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:500 },
  modal: { width:'min(520px, calc(100vw - 32px))', background:'#f8f8f8', border:'1px solid #7a8794', boxShadow:'0 16px 36px rgba(0,0,0,0.35)', color:'#111827', fontFamily:'Segoe UI, Arial, sans-serif' },
  modalTitle: { padding:'8px 12px', background:'#fff', borderBottom:'1px solid #d1d5db', fontSize:13, fontWeight:600 },
  modalBody: { padding:16, display:'grid', gap:12, fontSize:12 },
  modalFooter: { display:'flex', justifyContent:'flex-end', gap:8, padding:'10px 12px', borderTop:'1px solid #d1d5db', background:'#f3f4f6' },
  primaryDialog: { minWidth:82, background:'#0078d4', color:'#fff', border:'1px solid #006cbe', borderRadius:2, padding:'5px 12px' },
  dialogButton: { minWidth:82, background:'#fff', color:'#111827', border:'1px solid #9ca3af', borderRadius:2, padding:'5px 12px' },
  contextMenu: { position:'fixed', zIndex:600, width:190, padding:'3px 0', background:'#fff', border:'1px solid #9ca3af', boxShadow:'0 8px 20px rgba(0,0,0,0.22)', fontFamily:'Segoe UI, Arial, sans-serif' },
  contextItem: { display:'block', width:'100%', border:'none', background:'transparent', color:'#111827', textAlign:'left', borderRadius:0, padding:'5px 18px', fontSize:12 },
  contextSeparator: { height:1, background:'#e5e7eb', margin:'3px 0' },
};

Object.assign(window, {
  EnterpriseToolbar,
  EnterpriseDataTable,
  EnterpriseTreeView,
  EnterpriseDetailPanel,
  EnterpriseModalForm,
  EnterpriseContextMenu,
});
