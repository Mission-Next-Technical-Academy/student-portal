// ============================================================
//  LabPlayer — renders a new-shape lab (BUILD_PLAN.md §1.7)
// ============================================================
//  Layout:
//    Top:    nav (back button, lab title, difficulty, score)
//    Left:   environment shell (LinuxTerminalShell, etc.)
//    Right:  scenario panel + step list + current-step detail
//    Bottom-left: CheckOnLearningDrawer
//
//  Detection: ModulePage uses this when `mod.exercises` is an array.
// ============================================================

(function () {
  const STEP_HINT_THRESHOLD = 3;
  const STEP_REVEAL_THRESHOLD = 5;

  function flattenSteps(lab) {
    return window.MISSION_NEXT_GATING ? window.MISSION_NEXT_GATING.flattenSteps(lab) : (lab.exercises || []).flatMap(e => e.steps || []);
  }

  function getStep(lab, stepId) {
    return flattenSteps(lab).find(s => s.id === stepId) || null;
  }

  function LabPlayer({ lab, user, onBack, track }) {
    const [isNarrow, setIsNarrow] = React.useState(() => {
      try { return window.innerWidth < 1180; }
      catch (e) { return false; }
    });
    const [completedSet, setCompletedSet] = React.useState(() => {
      // hydrate from MISSION_NEXT_PROGRESS_EXT
      if (!user || !window.MISSION_NEXT_PROGRESS_EXT) return new Set();
      const ext = window.MISSION_NEXT_PROGRESS_EXT.getLabExtended(user.username, lab.id);
      if (!ext || !ext.stepAttempts) return new Set();
      const set = new Set();
      Object.entries(ext.stepAttempts).forEach(([id, att]) => {
        if (att && att.firstCorrectAt) set.add(id);
      });
      return set;
    });
    const [activeStepId, setActiveStepId] = React.useState(() => {
      const next = window.MISSION_NEXT_GATING ? window.MISSION_NEXT_GATING.nextUnlockedStep(lab, completedSet) : null;
      return (next && next.id) || (flattenSteps(lab)[0]?.id) || null;
    });
    const [colTrigger, setColTrigger] = React.useState(null);
    const [colAnswered, setColAnswered] = React.useState(() => {
      if (!user || !window.MISSION_NEXT_PROGRESS_EXT) return {};
      return window.MISSION_NEXT_PROGRESS_EXT.getCheckpointResponses(user.username, lab.id) || {};
    });
    const [revealedHints, setRevealedHints] = React.useState({});
    const [revealedAnswers, setRevealedAnswers] = React.useState({});
    const [feedback, setFeedback] = React.useState(null);
    const [services, setServices] = React.useState({});
    const [savedFiles, setSavedFiles] = React.useState({});
    const [observed, setObserved] = React.useState({});
    const [uiPath, setUiPath] = React.useState([]);

    // Build virtual filesystem once per lab
    const vfs = React.useMemo(() => {
      if (!lab.environment || typeof lab.environment.fs !== 'function') return null;
      try {
        const tree = lab.environment.fs();
        if (window.createVirtualFs) return window.createVirtualFs(tree || {});
      } catch (e) {
        console.error('[LabPlayer] failed to build vfs', e);
      }
      return null;
    }, [lab.id]);

    const flat = React.useMemo(() => flattenSteps(lab), [lab]);

    React.useEffect(() => {
      function onResize() {
        setIsNarrow(window.innerWidth < 1180);
      }
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }, []);

    // Auto-advance when active step is completed.
    React.useEffect(() => {
      if (!activeStepId || !completedSet.has(activeStepId)) return;
      const next = window.MISSION_NEXT_GATING ? window.MISSION_NEXT_GATING.nextUnlockedStep(lab, completedSet) : null;
      if (next && next.id !== activeStepId) setActiveStepId(next.id);
    }, [completedSet, activeStepId, lab]);

    function buildSimState(overrides = {}) {
      return {
        cwd: null,
        observed: overrides.observed || observed,
        services: overrides.services || services,
        savedFiles: overrides.savedFiles || savedFiles,
        vfs: overrides.vfs || vfs,
        quiz: overrides.quiz || colAnswered,
        completed: overrides.completed || Array.from(completedSet),
        uiPath: overrides.uiPath || uiPath,
      };
    }

    function recordCorrect(stepId, points) {
      setCompletedSet(prev => {
        if (prev.has(stepId)) return prev;
        const next = new Set(prev); next.add(stepId); return next;
      });
      // mark Check-on-Learning trigger if this step has one
      const step = getStep(lab, stepId);
      if (step && step.checkOnLearning) setColTrigger(step.checkOnLearning);
      // also mark the underlying base progress score so the existing instructor
      // dashboard sees activity even before it's updated for new fields.
      if (window.markTaskComplete && user) {
        try { window.markTaskComplete(user.username, lab.id, stepId, points || 10); }
        catch (e) { /* old API may not accept new id format — non-fatal */ }
      }
    }

    function evaluateAllUnlockedSteps(submission, simOverride) {
      // After every shell command, re-check all unlocked, incomplete steps.
      // Whichever validates true gets marked complete.
      if (!window.validateStep) return false;
      let anyHit = false;
      const sim = buildSimState(simOverride);
      for (const step of flat) {
        if (completedSet.has(step.id)) continue;
        const unlocked = window.MISSION_NEXT_GATING ? window.MISSION_NEXT_GATING.isStepUnlocked(lab, step.id, completedSet) : true;
        if (!unlocked) continue;
        if (step.kind !== 'command' && step.kind !== 'observe' && step.kind !== 'ui') continue;
        const res = window.validateStep(step, sim, submission);
        if (res.ok) {
          if (window.MISSION_NEXT_PROGRESS_EXT && user) window.MISSION_NEXT_PROGRESS_EXT.markStepAttempt(user.username, lab.id, step.id, submission, true);
          recordCorrect(step.id, step.points);
          anyHit = true;
        } else if (step.id === activeStepId) {
          if (window.MISSION_NEXT_PROGRESS_EXT && user) window.MISSION_NEXT_PROGRESS_EXT.markStepAttempt(user.username, lab.id, step.id, submission, false);
        }
      }
      return anyHit;
    }

    function applyShellResult(result) {
      const nextServices = result && result.services ? { ...services, ...result.services } : services;
      const nextSavedFiles = result && result.savedFiles ? { ...savedFiles, ...result.savedFiles } : savedFiles;
      const nextObserved = { ...observed };
      if (result && result.observed) Object.assign(nextObserved, result.observed);
      if (result && result.pager) nextObserved[`opened.${result.pager.name}`] = true;
      const nextUiPath = Array.isArray(result && result.uiPath)
        ? Array.from(new Set(uiPath.concat(result.uiPath)))
        : uiPath;

      if (nextServices !== services) setServices(nextServices);
      if (nextSavedFiles !== savedFiles) setSavedFiles(nextSavedFiles);
      if (nextObserved !== observed) setObserved(nextObserved);
      if (nextUiPath !== uiPath) setUiPath(nextUiPath);

      return {
        services: nextServices,
        savedFiles: nextSavedFiles,
        observed: nextObserved,
        uiPath: nextUiPath,
      };
    }

    function onShellCommand(cmdLine, result, env) {
      if (env && env.cwd != null) { /* shell tracks cwd internally */ }
      const hit = evaluateAllUnlockedSteps(cmdLine, applyShellResult(result));
      if (hit) {
        setFeedback({ kind: 'ok', text: 'Step complete.' });
        window.setTimeout(() => setFeedback(null), 1400);
      }
    }

    function onShellAction(submission, result) {
      const hit = evaluateAllUnlockedSteps(submission, applyShellResult(result));
      if (hit) {
        setFeedback({ kind: 'ok', text: 'Step complete.' });
        window.setTimeout(() => setFeedback(null), 1400);
      }
    }

    function onAnswerChecked(stepId, submission) {
      // For analyze / observe steps that have a manual answer field.
      if (!window.validateStep) return;
      const step = getStep(lab, stepId);
      if (!step) return;
      const sim = buildSimState();
      const res = window.validateStep(step, sim, submission);
      if (window.MISSION_NEXT_PROGRESS_EXT && user) {
        window.MISSION_NEXT_PROGRESS_EXT.markStepAttempt(user.username, lab.id, stepId, submission, res.ok);
      }
      if (res.ok) {
        recordCorrect(stepId, step.points);
        setFeedback({ kind: 'ok', text: 'Correct.' });
      } else {
        setFeedback({ kind: 'bad', text: res.reason || 'Not quite.' });
      }
      window.setTimeout(() => setFeedback(null), 1800);
    }

    function onColAnswer(qid, response, passed) {
      setColAnswered(prev => ({ ...prev, [qid]: { passed, lastResponse: response } }));
      if (window.MISSION_NEXT_PROGRESS_EXT && user) {
        window.MISSION_NEXT_PROGRESS_EXT.markCheckpointResponse(user.username, lab.id, qid, passed, response);
      }
    }
    function onColSkip(qid) {
      setColAnswered(prev => ({ ...prev, [qid]: { passed: false, skipped: true } }));
      if (window.MISSION_NEXT_PROGRESS_EXT && user) {
        window.MISSION_NEXT_PROGRESS_EXT.markCheckpointResponse(user.username, lab.id, qid, false, { skipped: true });
      }
    }

    // Hint reveal logic
    function maybeRevealHint(stepId) {
      if (!user || !window.MISSION_NEXT_PROGRESS_EXT) return;
      const att = window.MISSION_NEXT_PROGRESS_EXT.getStepAttempts(user.username, lab.id, stepId);
      const count = att ? att.count : 0;
      if (count >= STEP_HINT_THRESHOLD) setRevealedHints(prev => ({ ...prev, [stepId]: true }));
      if (count >= STEP_REVEAL_THRESHOLD) setRevealedAnswers(prev => ({ ...prev, [stepId]: true }));
    }
    React.useEffect(() => { if (activeStepId) maybeRevealHint(activeStepId); }, [activeStepId, completedSet]);

    // Pick the shell. Phase 0 ships LinuxTerminalShell only as the wired environment;
    // future agents add per-track shells and switch on lab.environment.shell.
    const activeStep = flat.find(step => step.id === activeStepId) || flat[0] || null;
    const shellName = activeStep && activeStep.environment && activeStep.environment.shell
      ? activeStep.environment.shell
      : lab.environment && lab.environment.shell;
    // SplunkLabShell is the legacy query-workbench component.  The imported
    // project catalog also uses that name in a few new-shape lab records, but
    // LabPlayer supplies the new-shape `lab` contract rather than the legacy
    // `mod` contract (which includes fields/logs/tasks).  Falling back here
    // keeps those labs on the command-driven player instead of letting the
    // legacy shell dereference an undefined `mod.fields` during first render.
    const registeredShell = window[shellName];
    const ShellComponent = shellName === 'SplunkLabShell'
      ? window.LinuxTerminalShell
      : registeredShell || window.LinuxTerminalShell;
    const shellProps = activeStep && activeStep.environment && activeStep.environment.shellProps
      ? activeStep.environment.shellProps
      : {};

    const totalSteps = flat.length;
    const doneSteps = flat.filter(s => completedSet.has(s.id)).length;
    const pct = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0;
    const labComplete = totalSteps > 0 && doneSteps === totalSteps;

    React.useEffect(() => {
      if (!labComplete || !user) return;
      try {
        localStorage.setItem('mission_next_lab_completion', JSON.stringify({
          user: user.username,
          labId: lab.id,
          completedAt: new Date().toISOString(),
        }));
      } catch (_) { /* best effort when storage is unavailable */ }
    }, [labComplete, lab.id, user && user.username]);

    return (
      <div style={lpStyles.root}>
        <nav style={lpStyles.nav}>
          <div style={lpStyles.navLeft}>
            <button onClick={onBack} style={lpStyles.backBtn}>‹ BACK</button>
            <span style={lpStyles.navSep}>›</span>
            <span style={lpStyles.navTitle}>{lab.title}</span>
            <span style={{ ...lpStyles.diffPill, color: { Beginner: '#22c55e', Intermediate: '#f59e0b', Advanced: '#f87171' }[lab.difficulty] || '#94a3b8' }}>
              {lab.difficulty || 'Lab'}
            </span>
          </div>
          <div style={lpStyles.navRight}>
            <span style={lpStyles.scoreDisplay}>{doneSteps}/{totalSteps} steps</span>
            <span style={lpStyles.pctBar}><span style={{ ...lpStyles.pctFill, width: `${pct}%` }} /></span>
            <span style={lpStyles.userText}>{user && user.displayName}</span>
          </div>
        </nav>

        {labComplete && (
          <div role="status" style={lpStyles.completionBanner}>
            <strong>Mission Next lab complete.</strong> All required steps are verified. Return to Module 3 to submit your assessment write-up.
          </div>
        )}

        <div data-module-layout style={{ ...lpStyles.layout, ...(isNarrow ? lpStyles.layoutNarrow : null) }}>
          {/* LEFT — environment shell */}
          <div style={{ ...lpStyles.shellPane, ...(isNarrow ? lpStyles.shellPaneNarrow : null) }}>
            {ShellComponent ? (
              <ShellComponent
                lab={lab}
                vfs={vfs}
                initialCwd={(lab.environment && lab.environment.initialCwd) || "/home/student"}
                user={user && user.username || 'student'}
                host="mission-next"
                onCommand={onShellCommand}
                onAction={onShellAction}
                activeStep={activeStep}
                simState={buildSimState()}
                autoFocus
                {...shellProps}
                {...(shellName === 'NotepadShell'
                  ? {
                      onSelect(selectedText) {
                        onShellAction(selectedText, {
                          observed: { 'notepad.lastSelection': selectedText },
                          uiPath: ['notepad', 'selection'],
                        });
                      },
                    }
                  : {})}
              />
            ) : (
              <div style={lpStyles.shellMissing}>
                Shell <code>{shellName}</code> is not registered. This lab cannot run yet.
              </div>
            )}
          </div>

          {/* RIGHT — scenario + steps */}
          <aside style={{ ...lpStyles.sidebar, ...(isNarrow ? lpStyles.sidebarNarrow : null) }}>
            <ScenarioPanel scenario={lab.scenario} />

            <div style={lpStyles.stepsHeader}>
              <span>EXERCISES</span>
              <span style={lpStyles.stepsHeaderCount}>{lab.exercises.length} sections</span>
            </div>

            <div style={lpStyles.stepsList}>
              {lab.exercises.map((ex, index) => (
                <ExerciseBlock
                  key={ex.id}
                  exercise={ex}
                  exerciseIndex={index}
                  lab={lab}
                  completedSet={completedSet}
                  activeStepId={activeStepId}
                  setActiveStepId={setActiveStepId}
                  revealedHints={revealedHints}
                  revealedAnswers={revealedAnswers}
                  onAnswerChecked={onAnswerChecked}
                />
              ))}
            </div>

            {feedback && (
              <div style={feedback.kind === 'ok' ? lpStyles.feedbackOk : lpStyles.feedbackBad}>
                {feedback.text}
              </div>
            )}
          </aside>
        </div>

        {window.CheckOnLearningDrawer && Array.isArray(lab.checkOnLearning) && lab.checkOnLearning.length > 0 && (
          <window.CheckOnLearningDrawer
            questions={lab.checkOnLearning}
            triggeredId={colTrigger}
            answered={colAnswered}
            onAnswer={onColAnswer}
            onSkip={onColSkip}
            onClose={() => setColTrigger(null)}
          />
        )}
      </div>
    );
  }

  function ScenarioPanel({ scenario }) {
    if (!scenario) return null;
    return (
      <div style={lpStyles.scenarioBox}>
        <div style={lpStyles.scenarioLabel}>SCENARIO</div>
        {scenario.role && <div style={lpStyles.scenarioRole}>{scenario.role}</div>}
        {scenario.incident && <div style={lpStyles.scenarioBody}>{scenario.incident}</div>}
      </div>
    );
  }

  function ExerciseBlock({ exercise, exerciseIndex, lab, completedSet, activeStepId, setActiveStepId, revealedHints, revealedAnswers, onAnswerChecked }) {
    const [open, setOpen] = React.useState(true);
    const total = exercise.steps.length;
    const done = exercise.steps.filter(s => completedSet.has(s.id)).length;
    return (
      <div style={lpStyles.exerciseBox}>
        <button onClick={() => setOpen(o => !o)} style={lpStyles.exerciseHeader}>
          <span style={lpStyles.exerciseHeadingWrap}>
            <span>{`Exercise ${exerciseIndex + 1}`}</span>
            {exercise.upstreamHeading ? <span style={lpStyles.exerciseMeta}>{exercise.upstreamHeading}</span> : null}
          </span>
          <span style={lpStyles.exerciseCount}>{done}/{total}</span>
        </button>
        {open && (
          <div>
            {exercise.steps.map((step, index) => (
              <StepRow
                key={step.id}
                step={step}
                exerciseIndex={exerciseIndex}
                stepIndex={index}
                lab={lab}
                completedSet={completedSet}
                isActive={step.id === activeStepId}
                onActivate={() => setActiveStepId(step.id)}
                hintRevealed={!!revealedHints[step.id]}
                answerRevealed={!!revealedAnswers[step.id]}
                onAnswerChecked={onAnswerChecked}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  function StepRow({ step, exerciseIndex, stepIndex, lab, completedSet, isActive, onActivate, hintRevealed, answerRevealed, onAnswerChecked }) {
    const isDone = completedSet.has(step.id);
    const isLocked = window.MISSION_NEXT_GATING ? !window.MISSION_NEXT_GATING.isStepUnlocked(lab, step.id, completedSet) : false;
    const [answer, setAnswer] = React.useState('');
    const wantsManualSubmit = step.kind === 'analyze' || step.kind === 'observe' && step.validation && step.validation.type === 'valueExtracted';

    const status = isDone ? 'done' : isLocked ? 'locked' : isActive ? 'active' : 'open';
    const statusColor = { done: '#22c55e', active: '#38bdf8', open: '#94a3b8', locked: '#475569' }[status];

    return (
      <div
        style={{ ...lpStyles.stepRow, borderLeftColor: statusColor, opacity: isLocked && !isDone ? 0.55 : 1 }}
        onClick={() => !isLocked && onActivate()}
      >
        <div style={lpStyles.stepHeader}>
          <span style={{ ...lpStyles.stepBadge, color: statusColor, borderColor: statusColor }}>
            {isDone ? '✓' : isLocked ? '🔒' : isActive ? '▶' : '○'}
          </span>
          <span style={lpStyles.stepOrdinal}>{`Step ${exerciseIndex + 1}.${stepIndex + 1}`}</span>
          {step.upstream && step.upstream.stepNumber ? (
            <span style={lpStyles.stepUpstream}>{`Source step ${step.upstream.stepNumber}`}</span>
          ) : null}
          {step.points ? <span style={lpStyles.stepPts}>{step.points} pts</span> : null}
        </div>
        <div style={lpStyles.stepInstruction}>{step.instruction}</div>
        {step.upstream && step.upstream.sourceLine && step.kind === 'command' && (
          <div style={lpStyles.stepSource}>
            <code>{step.upstream.sourceLine}</code>
          </div>
        )}
        {hintRevealed && step.hint && !isDone && (
          <div style={lpStyles.stepHint}>Hint: {step.hint}</div>
        )}
        {answerRevealed && !isDone && (
          <div style={lpStyles.stepReveal}>
            Answer: <code>{step.upstream && step.upstream.sourceLine}</code>
          </div>
        )}
        {isActive && wantsManualSubmit && !isDone && (
          <div style={lpStyles.answerRow}>
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && answer.trim()) { onAnswerChecked(step.id, answer.trim()); setAnswer(''); } }}
              placeholder="type your answer"
              style={lpStyles.answerInput}
            />
            <button
              onClick={() => { if (answer.trim()) { onAnswerChecked(step.id, answer.trim()); setAnswer(''); } }}
              style={lpStyles.answerBtn}
            >
              SUBMIT
            </button>
          </div>
        )}
      </div>
    );
  }

  const lpStyles = {
    root: { minHeight: '100vh', background: 'transparent', color: '#e2e8f0', fontFamily: "'Inter',sans-serif", display: 'flex', flexDirection: 'column' },
    nav: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 clamp(0.75rem, 2.5vw, 1.25rem)', height: 48, background: 'rgba(10,15,22,0.78)',
      borderBottom: '1px solid rgba(56,189,248,0.12)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 50,
      backdropFilter: 'blur(18px)',
    },
    navLeft: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', minWidth: 0 },
    backBtn: { background: 'transparent', border: '1px solid #1e3a2e', color: '#22c55e', fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: 2, padding: '5px 10px', cursor: 'pointer' },
    navSep: { color: '#1e3a2e' },
    navTitle: { fontSize: 12, fontWeight: 600, color: '#e2e8f0' },
    diffPill: { fontSize: 9, border: '1px solid currentColor', padding: '2px 8px', letterSpacing: 1, fontFamily: "'Space Mono',monospace", opacity: 0.8 },
    navRight: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
    scoreDisplay: { fontFamily: "'Space Mono',monospace", fontSize: 11, color: '#22c55e' },
    pctBar: { width: 80, height: 6, background: 'rgba(34,197,94,0.15)', borderRadius: 3, overflow: 'hidden' },
    pctFill: { display: 'block', height: '100%', background: '#22c55e', transition: 'width 0.25s' },
    userText: { color: '#94a3b8', fontSize: 11, fontFamily: "'Space Mono',monospace" },
    completionBanner: { padding: '10px 16px', background: 'rgba(34,197,94,0.12)', borderBottom: '1px solid rgba(34,197,94,0.35)', color: '#bbf7d0', fontSize: 12, lineHeight: 1.5 },

    layout: { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(min(100%, 22rem), 26rem)', gap: 0, flex: 1, minHeight: 0 },
    layoutNarrow: { gridTemplateColumns: 'minmax(0,1fr)', gridTemplateRows: 'minmax(24rem, 58vh) auto' },
    shellPane: { minWidth: 0, padding: 14, background: 'rgba(8,13,20,0.7)', borderRight: '1px solid rgba(56,189,248,0.10)', display: 'flex' },
    shellPaneNarrow: { borderRight: 'none', borderBottom: '1px solid rgba(56,189,248,0.10)', minHeight: '24rem' },
    shellMissing: { padding: 24, color: '#f87171', fontFamily: "'Space Mono', monospace", fontSize: 12 },
    sidebar: { minWidth: 0, overflow: 'auto', background: 'rgba(10,15,22,0.7)', padding: '14px 16px' },
    sidebarNarrow: { maxHeight: 'none' },

    scenarioBox: { padding: 14, background: 'rgba(0,0,0,0.32)', border: '1px solid rgba(56,189,248,0.18)', marginBottom: 14, borderRadius: 4 },
    scenarioLabel: { fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: 2, color: '#22c55e', marginBottom: 6 },
    scenarioRole: { fontSize: 12, color: '#e2e8f0', marginBottom: 6, fontWeight: 600 },
    scenarioBody: { fontSize: 12, color: '#94a3b8', lineHeight: 1.55 },
    sourceLink: { display: 'inline-block', marginTop: 10, color: '#38bdf8', border: '1px solid rgba(56,189,248,0.28)', padding: '4px 8px', fontSize: 9, letterSpacing: 1.5, fontFamily: "'Space Mono',monospace", textDecoration: 'none' },

    stepsHeader: { display: 'flex', justifyContent: 'space-between', fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: 2, color: '#475569', marginBottom: 8 },
    stepsHeaderCount: { color: '#64748b' },
    stepsList: { display: 'flex', flexDirection: 'column', gap: 12 },

    exerciseBox: { border: '1px solid rgba(56,189,248,0.10)', borderRadius: 4, overflow: 'hidden', background: 'rgba(8,13,20,0.4)' },
    exerciseHeader: {
      width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      background: 'rgba(11,15,20,0.7)', border: 'none', color: '#e2e8f0', fontFamily: "'Inter',sans-serif",
      fontSize: 12, fontWeight: 600, padding: '10px 12px', cursor: 'pointer', textAlign: 'left',
    },
    exerciseHeadingWrap: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
    exerciseMeta: { fontSize: 10, fontWeight: 400, color: '#64748b' },
    exerciseCount: { fontFamily: "'Space Mono',monospace", fontSize: 10, color: '#64748b' },

    stepRow: {
      padding: '10px 12px', borderLeft: '3px solid #475569', borderBottom: '1px solid rgba(56,189,248,0.06)',
      background: 'rgba(8,13,20,0.4)', cursor: 'pointer', transition: 'background 0.15s',
    },
    stepHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
    stepBadge: { width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid currentColor', borderRadius: 9, fontSize: 10, fontFamily: "'Space Mono',monospace" },
    stepOrdinal: { fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: 1, color: '#cbd5e1' },
    stepUpstream: { fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: 1, color: '#64748b' },
    stepPts: { marginLeft: 'auto', fontFamily: "'Space Mono',monospace", fontSize: 9, color: '#64748b' },
    stepInstruction: { fontSize: 12, color: '#cbd5e1', lineHeight: 1.5 },
    stepSource: { marginTop: 6, padding: '6px 8px', background: 'rgba(0,0,0,0.4)', border: '1px solid #1e3a2e', borderRadius: 3, fontFamily: "'Space Mono',monospace", fontSize: 11, color: '#22c55e', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
    stepHint: { marginTop: 6, fontSize: 11, color: '#bfdbfe', fontStyle: 'italic' },
    stepReveal: { marginTop: 6, padding: '6px 8px', background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.32)', borderRadius: 3, fontSize: 11, color: '#fca5a5' },

    answerRow: { display: 'flex', gap: 8, marginTop: 8 },
    answerInput: { flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid #1e3a2e', color: '#e2e8f0', fontFamily: "'Space Mono',monospace", fontSize: 12, padding: '6px 10px', borderRadius: 3, outline: 'none' },
    answerBtn: { background: '#22c55e', border: 'none', color: '#0b0f14', fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: 2, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, borderRadius: 3 },

    feedbackOk: { marginTop: 12, padding: '6px 10px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.4)', color: '#22c55e', fontFamily: "'Space Mono',monospace", fontSize: 11, borderRadius: 3 },
    feedbackBad: { marginTop: 12, padding: '6px 10px', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.4)', color: '#f87171', fontFamily: "'Space Mono',monospace", fontSize: 11, borderRadius: 3 },
  };

  Object.assign(window, { LabPlayer });
})();
