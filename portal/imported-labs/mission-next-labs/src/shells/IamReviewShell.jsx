(function () {
  function IamReviewShell({ vfs, user, simState, activeStep, onCommand, onAction, onStateRestored }) {
    const review = window.MISSION_NEXT_IAM_REVIEW;
    const storageKey = 'mission_next_iam_ssh_v1:' + user;
    const workspace = React.useRef(null);
    if (!workspace.current) {
      const session = review.createSession();
      let restored = false;
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
        if (saved && saved.fs && saved.session) {
          vfs.restore(saved.fs);
          Object.assign(session, saved.session);
          restored = true;
        }
      } catch (_) { /* A fresh training workspace is safe if storage is unavailable. */ }
      workspace.current = { session, restored };
    }
    const [connected, setConnected] = React.useState(workspace.current.session.connected);
    const [editor, setEditor] = React.useState(null);
    const [editorError, setEditorError] = React.useState('');
    const completedKey = (simState.completed || []).join('|');

    React.useEffect(() => {
      const state = workspace.current;
      if (!state.restored) {
        const completed = simState.completed || [];
        review.restoreCompleted(vfs, completed);
        const done = step => completed.includes('sa-5.ssh.' + step);
        Object.assign(state.session, {
          connected: done('ex1.s1'), logReviewed: done('ex3.s1'),
          policyChecked: done('ex4.s3'), groupsVerified: done('ex5.s1'), permissionsVerified: done('ex5.s2'),
        });
        setConnected(state.session.connected);
      }
      onStateRestored?.({ observed: { iam: { ...state.session } } });
    }, [completedKey]);

    function persist() {
      workspace.current.restored = true;
      try {
        localStorage.setItem(storageKey, JSON.stringify({ fs: vfs.snapshot(), session: workspace.current.session }));
      } catch (_) { /* Progress still records completed steps if browser storage is full. */ }
    }
    function runCommand(env, line) {
      if (/^\s*(sudo\s+)?gpasswd\b/.test(line) && activeStep?.validation?.check !== 'groupRemoved') {
        return { stdout: '', stderr: 'Complete the preceding review steps before changing group membership.\n', exitCode: 1 };
      }
      const output = review.runLine(env, line, workspace.current.session);
      setConnected(workspace.current.session.connected);
      if (output.editor != null) { setEditor(output.editor); setEditorError(''); }
      persist();
      return output;
    }
    function saveEditor() {
      if (activeStep?.validation?.check !== 'policySaved') {
        setEditorError('Complete the preceding steps before saving the policy change. You can cancel to return to the terminal.');
        return;
      }
      const output = review.savePolicy(vfs, workspace.current.session, editor);
      if (output.exitCode !== 0) { setEditorError(output.stderr); return; }
      setEditor(null);
      persist();
      onAction('sudo visudo', output);
    }
    return (
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}>
        <div style={{ color: '#cbd5e1', fontSize: 12, padding: '4px 4px 12px' }}>
          IAM-2059 · {connected ? 'SSH connected · analyst@iam-server · Ubuntu 24.04' : 'Analyst workstation · ready to connect'}
        </div>
        <div inert={editor !== null ? '' : undefined} style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <window.LinuxTerminalShell vfs={vfs} initialCwd="/home/analyst" user="analyst"
            host={connected ? 'iam-server' : 'analyst-workstation'} runCommand={runCommand} onCommand={onCommand} autoFocus />
        </div>
        {editor !== null && (
          <div role="dialog" aria-modal="true" aria-labelledby="iam-editor-title" style={{ position: 'absolute', inset: 0, zIndex: 60, padding: 20, background: '#0f172a', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <strong id="iam-editor-title">sudo visudo · /etc/sudoers</strong>
            <p style={{ margin: 0, fontSize: 14 }}>Guided editor: delete the entire temp.contractor entry. Keep the root and %sudo rules. Save validates the permitted change before applying it.</p>
            <textarea aria-label="Sudoers configuration" value={editor} onChange={event => setEditor(event.target.value)}
              autoFocus spellCheck={false} style={{ flex: 1, minHeight: 160, resize: 'vertical', background: '#020617', color: '#e2e8f0', border: '1px solid #64748b', padding: 14, fontFamily: 'monospace', fontSize: 14 }} />
            {editorError && <div role="alert" style={{ color: '#fca5a5' }}>{editorError}</div>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={saveEditor} style={{ padding: '10px 18px', background: '#f97316', color: '#0f172a', fontWeight: 700, border: 0, borderRadius: 6, cursor: 'pointer' }}>Save</button>
              <button type="button" onClick={() => setEditor(null)} style={{ padding: '10px 18px', background: '#334155', color: '#fff', border: 0, borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    );
  }
  window.IamReviewShell = IamReviewShell;
})();
