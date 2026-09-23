// ============================================================
//  WindowsCmdShell — Windows Command Prompt
// ============================================================
//  Black-bg `C:\>` prompt. Same shape as PowerShellShell — a
//  commandMap dispatches matching lines, others fall to a
//  realistic 'is not recognized' error.
//
//  Props mirror PowerShellShell.
// ============================================================

(function () {
  function defaultUnknown(line) {
    const cmd = (String(line).trim().split(/\s+/)[0] || '');
    return {
      stdout: '',
      stderr: `'${cmd}' is not recognized as an internal or external command,\noperable program or batch file.\n`,
      exitCode: 1,
    };
  }

  function WindowsCmdShell(props) {
    const {
      commandMap = [],
      initialCwd = 'C:\\Users\\Student',
      onCommand, autoFocus = true,
    } = props;
    const [cwd, setCwd] = React.useState(initialCwd);
    const [lines, setLines] = React.useState([
      { kind: 'banner', text: 'Microsoft Windows [Version 10.0.19045.4894]\n(c) Microsoft Corporation. All rights reserved.\n' },
    ]);
    const [input, setInput] = React.useState('');
    const [history, setHistory] = React.useState([]);
    const [histIdx, setHistIdx] = React.useState(-1);

    const env = React.useMemo(() => ({ cwd, savedFiles: {} }), [cwd]);
    const inputRef = React.useRef(null);
    const scrollRef = React.useRef(null);
    React.useEffect(() => { if (autoFocus && inputRef.current) inputRef.current.focus(); }, [autoFocus]);
    React.useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [lines]);

    function append(kind, text) { setLines(prev => prev.concat([{ kind, text }])); }

    function runUserLine(line) {
      append('prompt', `${cwd}> ${line}`);
      if (!line.trim()) return;
      const next = history.concat([line]).slice(-200);
      setHistory(next); setHistIdx(-1);

      let result = null;
      for (const entry of commandMap) {
        if (!entry || !entry.match) continue;
        if (typeof entry.match === 'string' ? line.trim() === entry.match : entry.match.test(line)) {
          try { result = entry.run(line, env) || { stdout: '', stderr: '', exitCode: 0 }; break; }
          catch (e) { result = { stdout: '', stderr: 'cmd error: ' + e.message + '\n', exitCode: 1 }; break; }
        }
      }
      if (!result) result = defaultUnknown(line);

      const cdMatch = line.match(/^\s*cd\s+(?:\/d\s+)?["']?([^"']+)["']?\s*$/i);
      if (cdMatch && (!result || result.exitCode === 0)) {
        let target = cdMatch[1];
        if (!/^[A-Z]:\\/i.test(target)) {
          target = (cwd.endsWith('\\') ? cwd : cwd + '\\') + target.replace(/\//g, '\\');
        }
        setCwd(target);
      }

      if (result.stdout) append('stdout', result.stdout);
      if (result.stderr) append('stderr', result.stderr);
      if (result.savedFiles && env.savedFiles) Object.assign(env.savedFiles, result.savedFiles);
      if (typeof onCommand === 'function') onCommand(line, result, env);
    }

    function onKeyDown(e) {
      if (e.key === 'Enter') { e.preventDefault(); runUserLine(input); setInput(''); }
      else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (history.length === 0) return;
        const next = histIdx < 0 ? history.length - 1 : Math.max(0, histIdx - 1);
        setHistIdx(next); setInput(history[next] || '');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (histIdx < 0) return;
        const next = histIdx + 1;
        if (next >= history.length) { setHistIdx(-1); setInput(''); }
        else { setHistIdx(next); setInput(history[next]); }
      }
    }

    return (
      <div style={cmdStyles.root} onClick={() => inputRef.current && inputRef.current.focus()}>
        <div ref={scrollRef} style={cmdStyles.scroll}>
          {lines.map((ln, i) => (
            <div key={i} style={ln.kind === 'stderr' ? cmdStyles.lineErr : cmdStyles.line}>{ln.text}</div>
          ))}
          <div style={cmdStyles.inputRow}>
            <span style={cmdStyles.prompt}>{`${cwd}> `}</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              style={cmdStyles.input}
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </div>
      </div>
    );
  }

  const cmdStyles = {
    root: {
      width: '100%', height: '100%', minHeight: 360, background: '#0c0c0c',
      color: '#cccccc', fontFamily: "'Consolas', 'Lucida Console', monospace", fontSize: 13,
      padding: '12px 14px', borderRadius: 4, overflow: 'hidden', cursor: 'text',
    },
    scroll: { width: '100%', height: '100%', overflow: 'auto', whiteSpace: 'pre-wrap' },
    line: { whiteSpace: 'pre-wrap', color: '#cccccc' },
    lineErr: { whiteSpace: 'pre-wrap', color: '#ff8080' },
    inputRow: { display: 'flex', alignItems: 'center' },
    prompt: { color: '#cccccc', whiteSpace: 'pre' },
    input: {
      flex: 1, background: 'transparent', border: 'none', outline: 'none',
      color: '#cccccc', fontFamily: "'Consolas', 'Lucida Console', monospace", fontSize: 13, padding: 0,
    },
  };

  Object.assign(window, { WindowsCmdShell });
})();
