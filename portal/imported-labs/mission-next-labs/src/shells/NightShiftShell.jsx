(function () {
  // Terminal for the Operation Night Shift labs (sa-9, sa-4). The virtual host and every
  // expected value come from the lab engine named in lab.environment.engine; this shell
  // only keeps the workspace across reloads and forwards commands to that engine.
  function NightShiftShell({ lab, vfs, user, activeStep, onCommand, onStateRestored }) {
    const engine = window[lab.environment.engine];
    const storageKey = `mission_next_nightshift_v1:${lab.id}:${user}`;
    const workspace = React.useRef(null);
    if (!workspace.current) {
      const session = engine.createSession();
      const signature = engine.signature(vfs);
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
        if (saved && saved.signature === signature && saved.fs && saved.session) {
          vfs.restore(saved.fs);
          Object.assign(session, saved.session);
        }
      } catch (_) { /* A fresh training workspace is safe if storage is unavailable. */ }
      workspace.current = { session, signature };
    }
    const host = (vfs.read('/etc/hostname') || 'host').trim();

    React.useEffect(() => {
      if (onStateRestored) onStateRestored({ observed: { nightShift: JSON.parse(JSON.stringify(workspace.current.session)) } });
    }, []);

    function persist() {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ signature: workspace.current.signature, fs: vfs.snapshot(), session: workspace.current.session }));
      } catch (_) { /* Progress still records completed steps if browser storage is full. */ }
    }
    function runCommand(env, line) {
      const output = engine.runLine(env, line, workspace.current.session, { activeStep });
      persist();
      return output;
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}>
        <div style={{ color: '#cbd5e1', fontSize: 12, padding: '4px 4px 12px' }}>
          Ticket in /home/analyst/ir-ticket.txt · analyst@{host} · read-only simulation
        </div>
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <window.LinuxTerminalShell vfs={vfs} initialCwd="/home/analyst" user="analyst" host={host}
            runCommand={runCommand} onCommand={onCommand} autoFocus />
        </div>
      </div>
    );
  }
  window.NightShiftShell = NightShiftShell;
})();
