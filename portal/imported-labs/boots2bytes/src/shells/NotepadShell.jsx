// ============================================================
//  NotepadShell — Windows Notepad-style text viewer/editor
// ============================================================
//  Used whenever a lab "opens" a text file (strings_output.txt,
//  ransom note, etc.). Supports text selection for CoL questions
//  that ask the user to highlight a specific token.
//
//  Props:
//    title        string (window title; appears in title bar)
//    content      string
//    readOnly     boolean (default true)
//    onSelect     (selectedText) => void
//    onChange     (newContent) => void
// ============================================================

(function () {
  function NotepadShell(props) {
    const { title = 'Untitled - Notepad', content = '', readOnly = true, onSelect, onChange } = props;
    const taRef = React.useRef(null);

    function handleSelect() {
      if (!onSelect) return;
      const ta = taRef.current;
      if (!ta) return;
      const sel = ta.value.substring(ta.selectionStart, ta.selectionEnd);
      if (sel) onSelect(sel);
    }

    return (
      <div style={npStyles.root}>
        <div style={npStyles.titleBar}>
          <div style={npStyles.titleText}>{title}</div>
          <div style={npStyles.titleBtns}>
            <span style={npStyles.titleBtn}>—</span>
            <span style={npStyles.titleBtn}>▢</span>
            <span style={{ ...npStyles.titleBtn, color: '#fff' }}>×</span>
          </div>
        </div>
        <div style={npStyles.menuBar}>
          <span style={npStyles.menuItem}>File</span>
          <span style={npStyles.menuItem}>Edit</span>
          <span style={npStyles.menuItem}>Format</span>
          <span style={npStyles.menuItem}>View</span>
          <span style={npStyles.menuItem}>Help</span>
        </div>
        <textarea
          ref={taRef}
          value={content}
          onChange={(e) => { if (onChange) onChange(e.target.value); }}
          onMouseUp={handleSelect}
          onKeyUp={handleSelect}
          readOnly={readOnly}
          style={npStyles.text}
          spellCheck={false}
        />
        <div style={npStyles.statusBar}>
          <span>Ln 1, Col 1</span>
          <span>{Math.max(0, (content || '').length)} chars</span>
          <span>UTF-8</span>
        </div>
      </div>
    );
  }

  const npStyles = {
    root: {
      width: '100%', height: '100%', minHeight: 320, display: 'flex', flexDirection: 'column',
      background: '#fff', color: '#000', borderRadius: 4, overflow: 'hidden',
      fontFamily: "'Segoe UI', Tahoma, sans-serif", fontSize: 12, border: '1px solid #999',
    },
    titleBar: {
      height: 32, background: '#0078d7', color: '#fff', display: 'flex',
      alignItems: 'center', padding: '0 8px',
    },
    titleText: { flex: 1, fontSize: 12 },
    titleBtns: { display: 'flex', gap: 0 },
    titleBtn: {
      width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'default', color: '#fff', fontSize: 13,
    },
    menuBar: { display: 'flex', gap: 0, background: '#f0f0f0', borderBottom: '1px solid #d4d4d4', height: 24 },
    menuItem: { padding: '4px 10px', fontSize: 12, cursor: 'default', color: '#000' },
    text: {
      flex: 1, border: 'none', outline: 'none', resize: 'none',
      fontFamily: "Consolas, 'Courier New', monospace", fontSize: 13, padding: '8px 10px',
      background: '#fff', color: '#000', whiteSpace: 'pre',
    },
    statusBar: {
      display: 'flex', justifyContent: 'space-between', padding: '4px 10px',
      background: '#f0f0f0', borderTop: '1px solid #d4d4d4', fontSize: 11, color: '#333',
    },
  };

  Object.assign(window, { NotepadShell });
})();
