(function () {
  function PowerShellScriptShell({ lab, user='Learner', powershellRebuildEngine, onCommand, onAction, onStateRestored }) {
    const engine=powershellRebuildEngine;
    const key=`mission_next_rebuild_v1:${lab.id}:${user}`;
    const [script,setScript]=React.useState(()=>'# Rebuild-JumpHost.ps1\n');
    const [command,setCommand]=React.useState('');
    const [output,setOutput]=React.useState('SIMULATION ONLY — commands affect fictional training state in this browser.\n');
    const [error,setError]=React.useState(false);
    const textareaRef=React.useRef(null), highlightRef=React.useRef(null), gutterRef=React.useRef(null);
    React.useEffect(()=>{
      try {
        const saved=JSON.parse(localStorage.getItem(key)||'null');
        if(saved?.session) engine?.restore(saved.session);
        if(saved?.script) setScript(saved.script);
        if(saved?.output) setOutput(saved.output);
      } catch(_) { /* Continue with a clean simulated workspace. */ }
      onStateRestored?.({observed:{powershellRebuild:engine?.snapshot() || {}}});
    },[]);
    function persist(nextScript=script,nextOutput=output) {
      try { localStorage.setItem(key,JSON.stringify({script:nextScript,output:nextOutput,session:engine?.snapshot()})); } catch(_) { /* The lab remains usable if storage is unavailable. */ }
    }
    function runCommand() {
      if(!engine || !command.trim()) return;
      const result=engine.runCommand(command);
      const next=output+`\nPS C:\\IR> ${command}\n`+(result.stdout||result.stderr||'');
      setOutput(next); setError(result.exitCode!==0); persist(script,next);
      onCommand?.(command,result,{cwd:'C:\\IR',user}); setCommand('');
    }
    function saveScript() {
      if(engine) engine.state.scriptSaved=script;
      const next=output+'\nSaved Rebuild-JumpHost.ps1 in the simulated workspace.\n';
      setOutput(next); persist(script,next);
    }
    function runScript() {
      if(!engine) return;
      const result=engine.runScript(script);
      const next=output+`\nPS C:\\IR> .\\Rebuild-JumpHost.ps1\n`+(result.stdout||'')+(result.stderr||'');
      setOutput(next); setError(result.exitCode!==0); persist(script,next);
      onAction?.('.\\Rebuild-JumpHost.ps1',result);
    }
    function syncScroll(event) {
      if(highlightRef.current) { highlightRef.current.scrollTop=event.target.scrollTop; highlightRef.current.scrollLeft=event.target.scrollLeft; }
      if(gutterRef.current) gutterRef.current.scrollTop=event.target.scrollTop;
    }
    const highlighted=script.split(/(#[^\n]*|"[^"\n]*"|'[^'\n]*'|\$[\w:]+|\b(?:if|else|foreach|for|in|param|return)\b|\b(?:New-AzVM|Get-AzVM|Set-AzVMExtension|Set-AzDiagnosticSetting|Start-DscConfiguration|Get-AzOperationalInsightsSearchResult|Get-Credential|Get-AzKeyVaultSecret)\b)/gi);
    const lineCount=script.split('\n').length;
    return <div style={styles.root}>
      <div style={styles.notice}><strong>SIMULATION ONLY</strong> · Script and response actions update fictional browser state. No real host, directory or cloud account is contacted.</div>
      <div style={styles.toolbar}><span style={styles.filename}>Rebuild-JumpHost.ps1</span><button onClick={saveScript} style={styles.button}>Save</button><button onClick={runScript} style={styles.primary}>Run Script</button></div>
      <div style={styles.editor}>
        <div ref={gutterRef} style={styles.gutter}>{Array.from({length:lineCount},(_,i)=><div key={i}>{i+1}</div>)}</div>
        <div style={styles.codeArea}>
          <pre ref={highlightRef} aria-hidden="true" style={styles.highlight}>{highlighted.map((part,i)=>{
            let color='#e2e8f0'; if(part.startsWith('#')) color='#94a3b8'; else if(/^['"]/.test(part)) color='#a5d6a7'; else if(part.startsWith('$')) color='#79c0ff'; else if(/^(if|else|foreach|for|in|param|return)$/i.test(part)) color='#ff7b72'; else if(/^(New-AzVM|Get-AzVM|Set-AzVMExtension|Set-AzDiagnosticSetting|Start-DscConfiguration|Get-AzOperationalInsightsSearchResult|Get-Credential|Get-AzKeyVaultSecret)$/i.test(part)) color='#d2a8ff';
            return <span key={i} style={{color}}>{part}</span>;
          })}</pre>
          <textarea ref={textareaRef} value={script} onChange={e=>setScript(e.target.value)} onScroll={syncScroll} spellCheck={false} aria-label="PowerShell rebuild script" style={styles.textarea}/>
        </div>
      </div>
      <div style={styles.commandRow}><span style={styles.prompt}>PS C:\IR&gt;</span><input value={command} onChange={e=>setCommand(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();runCommand();}}} aria-label="PowerShell command" placeholder="Run authorized containment, collection, or evidence commands" style={styles.commandInput}/><button onClick={runCommand} style={styles.button}>Run Command</button></div>
      <pre role="log" aria-live="polite" style={{...styles.output,color:error?'#fecaca':'#e2e8f0'}}>{output}</pre>
    </div>;
  }
  const styles={
    root:{height:'100%',minHeight:520,display:'flex',flexDirection:'column',gap:8,background:'#0b1220',padding:10,borderRadius:6,color:'#e2e8f0',fontFamily:'Inter,system-ui,sans-serif'},
    notice:{padding:'8px 10px',border:'1px solid #375a7f',borderRadius:5,background:'#10233d',fontSize:11,lineHeight:1.5,color:'#bfdbfe'},
    toolbar:{display:'flex',gap:7,alignItems:'center'}, filename:{fontFamily:'monospace',fontSize:12,marginRight:'auto',color:'#cbd5e1'},
    button:{border:'1px solid #475569',borderRadius:4,padding:'6px 10px',background:'#1e293b',color:'#e2e8f0',cursor:'pointer',fontSize:11},
    primary:{border:'1px solid #2563eb',borderRadius:4,padding:'6px 12px',background:'#1d4ed8',color:'#fff',cursor:'pointer',fontSize:11},
    editor:{height:260,minHeight:190,display:'flex',overflow:'hidden',border:'1px solid #334155',borderRadius:4,background:'#0d1117'},
    gutter:{width:38,flex:'0 0 38px',overflow:'hidden',padding:'10px 8px 10px 0',textAlign:'right',color:'#64748b',font:'12px/20px Consolas,monospace',userSelect:'none'},
    codeArea:{position:'relative',flex:1,overflow:'hidden'},
    highlight:{position:'absolute',inset:0,margin:0,padding:10,overflow:'hidden',whiteSpace:'pre',font:'12px/20px Consolas,monospace',pointerEvents:'none'},
    textarea:{position:'absolute',inset:0,width:'100%',height:'100%',resize:'none',border:0,outline:0,margin:0,padding:10,overflow:'auto',whiteSpace:'pre',background:'transparent',color:'transparent',caretColor:'#f8fafc',font:'12px/20px Consolas,monospace',tabSize:2},
    commandRow:{display:'flex',gap:7,alignItems:'center'},prompt:{font:'12px Consolas,monospace',color:'#93c5fd'},commandInput:{flex:1,minWidth:0,background:'#111827',border:'1px solid #334155',borderRadius:4,padding:'7px 8px',color:'#f8fafc',font:'12px Consolas,monospace',outline:'none'},
    output:{flex:1,minHeight:90,maxHeight:180,overflow:'auto',margin:0,padding:'9px 10px',border:'1px solid #1e293b',borderRadius:4,background:'#050a14',whiteSpace:'pre-wrap',font:'11px/1.5 Consolas,monospace'},
  };
  window.PowerShellScriptShell=PowerShellScriptShell;
})();
