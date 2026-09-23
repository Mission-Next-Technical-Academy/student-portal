// ============================================================
//  PowerShellShell — Windows PowerShell terminal
// ============================================================
//  Blue-bg PowerShell prompt. Accepts a `commandMap` prop where
//  each key is a regex-or-string matcher and each value is a
//  function returning { stdout, stderr, exitCode, services? }.
//  Unmatched commands return a realistic
//  `<cmd> : The term '<cmd>' is not recognized as the name of
//  a cmdlet, function, script file, or operable program.`
//  message.
//
//  Props:
//    commandMap   [{ match: string|RegExp, run: (line, env) => result }]
//    initialCwd   string (default 'C:\\Users\\Student')
//    user         string (default 'Student')
//    elevated     boolean — adds [Administrator] banner
//    onCommand    (line, result, env) => void
//    autoFocus    boolean
// ============================================================

(function () {
  function defaultUnknown(line) {
    const cmd = (String(line).trim().split(/\s+/)[0] || '');
    return {
      stdout: '',
      stderr: `${cmd} : The term '${cmd}' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again.\nAt line:1 char:1\n+ ${line}\n+ ${'~'.repeat(Math.min(cmd.length, 24))}\n    + CategoryInfo          : ObjectNotFound: (${cmd}:String) [], CommandNotFoundException\n    + FullyQualifiedErrorId : CommandNotFoundException\n\n`,
      exitCode: 1,
    };
  }

  function PowerShellShell(props) {
    const {
      commandMap = [],
      initialCwd = 'C:\\Users\\Student',
      user = 'Student',
      elevated = false,
      onCommand,
      autoFocus = true,
      banner = true,
    } = props;
    const [cwd, setCwd] = React.useState(initialCwd);
    const [lines, setLines] = React.useState(() => banner ? [
      { kind: 'banner', text: 'Windows PowerShell\nCopyright (C) Microsoft Corporation. All rights reserved.\n\nInstall the latest PowerShell for new features and improvements! https://aka.ms/PSWindows\n' },
    ] : []);
    const [input, setInput] = React.useState('');
    const [history, setHistory] = React.useState([]);
    const [histIdx, setHistIdx] = React.useState(-1);

    const env = React.useMemo(() => ({
      cwd, user, elevated, services: {}, savedFiles: {},
    }), [cwd, user, elevated]);

    const inputRef = React.useRef(null);
    const scrollRef = React.useRef(null);

    React.useEffect(() => { if (autoFocus && inputRef.current) inputRef.current.focus(); }, [autoFocus]);
    React.useEffect(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [lines]);

    function append(kind, text) { setLines(prev => prev.concat([{ kind, text }])); }

    function runUserLine(line) {
      const prompt = `${elevated ? '[Administrator]: ' : ''}PS ${cwd}> `;
      append('prompt', prompt + line);
      if (!line.trim()) return;
      const next = history.concat([line]).slice(-200);
      setHistory(next); setHistIdx(-1);

      let result = null;
      for (const entry of commandMap) {
        if (!entry || !entry.match) continue;
        if (typeof entry.match === 'string' ? line.trim() === entry.match : entry.match.test(line)) {
          try { result = entry.run(line, env) || { stdout: '', stderr: '', exitCode: 0 }; break; }
          catch (e) { result = { stdout: '', stderr: 'PowerShell error: ' + e.message + '\n', exitCode: 1 }; break; }
        }
      }
      if (!result) result = defaultUnknown(line);

      // Built-in cd: update cwd
      const cdMatch = line.match(/^\s*(?:cd|Set-Location)\s+["']?([^"']+)["']?\s*$/i);
      if (cdMatch && (!result || result.exitCode === 0)) {
        let target = cdMatch[1];
        if (target === '~') target = `C:\\Users\\${user}`;
        if (!/^[A-Z]:\\/i.test(target)) {
          target = (cwd.endsWith('\\') ? cwd : cwd + '\\') + target.replace(/\//g, '\\');
        }
        setCwd(target);
      }

      if (result.stdout) append('stdout', result.stdout);
      if (result.stderr) append('stderr', result.stderr);
      if (result.services && env.services) Object.assign(env.services, result.services);
      if (result.savedFiles && env.savedFiles) Object.assign(env.savedFiles, result.savedFiles);
      if (typeof onCommand === 'function') onCommand(line, result, env);
    }

    function onKeyDown(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        runUserLine(input); setInput('');
      } else if (e.key === 'ArrowUp') {
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
      <div style={psStyles.root} onClick={() => inputRef.current && inputRef.current.focus()}>
        <div ref={scrollRef} style={psStyles.scroll}>
          {lines.map((ln, i) => (
            <div
              key={i}
              style={ln.kind === 'stderr' ? psStyles.lineErr : ln.kind === 'banner' ? psStyles.lineBanner : psStyles.line}
            >
              {ln.text}
            </div>
          ))}
          <div style={psStyles.inputRow}>
            <span style={psStyles.prompt}>{`${elevated ? '[Administrator]: ' : ''}PS ${cwd}> `}</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              style={psStyles.input}
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </div>
      </div>
    );
  }

  const psStyles = {
    root: {
      width: '100%', height: '100%', minHeight: 360, background: '#012456',
      color: '#f2f2f2', fontFamily: "'Consolas', 'Lucida Console', 'Space Mono', monospace", fontSize: 13,
      padding: '12px 14px', borderRadius: 4, overflow: 'hidden', cursor: 'text',
    },
    scroll: { width: '100%', height: '100%', overflow: 'auto', whiteSpace: 'pre-wrap' },
    line: { whiteSpace: 'pre-wrap', color: '#f2f2f2' },
    lineErr: { whiteSpace: 'pre-wrap', color: '#ff6b6b' },
    lineBanner: { whiteSpace: 'pre-wrap', color: '#cfd8dc', marginBottom: 6 },
    inputRow: { display: 'flex', alignItems: 'center' },
    prompt: { color: '#f2f2f2', whiteSpace: 'pre' },
    input: {
      flex: 1, background: 'transparent', border: 'none', outline: 'none',
      color: '#f2f2f2', fontFamily: "'Consolas', 'Lucida Console', monospace", fontSize: 13, padding: 0,
    },
  };

  Object.assign(window, { PowerShellShell });
})();
