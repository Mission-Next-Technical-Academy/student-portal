// ============================================================
//  LabPlayer — renders a new-shape lab (BUILD_PLAN.md §1.7)
// ============================================================
//  Layout:
//    Top:    nav (back button, lab title, difficulty, score)
//    Left:   environment shell (LinuxTerminalShell, etc.)
//    Right:  scenario panel + step list + current-step detail
//    Bottom: direct analyst workflow with step validation
//
//  Detection: ModulePage uses this when `mod.exercises` is an array.
// ============================================================

(function () {
  const STEP_HINT_THRESHOLD = 3;
  const STEP_REVEAL_THRESHOLD = 5;

  // Six short, floating "console guide"-style steps shown the first time a
  // student opens a terminal-driven lab, mirroring Module 2's Learn It
  // console guide (m02e-learn-tip). Each step is one to two sentences so it
  // reads in a single glance before the student clicks Next.
  const TERMINAL_GUIDE_STEPS = [
    'This is a terminal — a place where commands are sent directly to a computer.',
    'Administrators and engineers often use terminals to remotely manage devices.',
    "Many companies prefer command-line (CLI) interfaces because it's harder for attackers to compromise than a dashboard or admin panel.",
    "Most pentesting (ethical hacking) happens on the CLI — it's lower-level and closer to how a device's software actually works.",
    'Windows, Mac, and Linux are the main operating systems, and each uses its own scripting language: PowerShell for Windows, BASH (Bourne Again Shell) for Linux/Unix.',
    "In this lab, you'll get acquainted with a typical Linux command-line interface and run the basic commands a SOC analyst would use.",
  ];

  function TerminalGuidePanel({ stepIndex, onNext, onSkip }) {
    const total = TERMINAL_GUIDE_STEPS.length;
    const done = stepIndex >= total;
    const text = TERMINAL_GUIDE_STEPS[Math.min(stepIndex, total - 1)];
    // Rendered through a portal to document.body: the route wrapper this
    // component lives under applies a CSS transform for page transitions,
    // which would otherwise make `position: fixed` anchor to that wrapper's
    // box (often far below the viewport) instead of the real viewport.
    return ReactDOM.createPortal(
      <aside style={lpStylesShared.terminalGuide} role="status" aria-live="polite">
        <div style={lpStylesShared.terminalGuideLabel}>
          {done ? 'TERMINAL GUIDE · COMPLETE' : `TERMINAL GUIDE · STEP ${stepIndex + 1} OF ${total}`}
        </div>
        <p style={lpStylesShared.terminalGuideBody}>
          {done ? 'You can keep exploring, or open this guide again from the sidebar.' : text}
        </p>
        <div style={lpStylesShared.terminalGuideActions}>
          {!done && (
            <button type="button" onClick={onSkip} style={lpStylesShared.terminalGuideSkip}>Skip</button>
          )}
          <button type="button" onClick={onNext} style={lpStylesShared.terminalGuideNext}>
            {done ? 'Close' : stepIndex === total - 1 ? 'Finish guide' : 'Next'}
          </button>
        </div>
      </aside>,
      document.body
    );
  }

  const lpStylesShared = {
    terminalGuide: { position: 'fixed', left: 16, bottom: 16, zIndex: 60, width: 'min(92vw, 22rem)', padding: '14px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 14, boxShadow: '0 12px 32px rgba(15,23,42,0.35)' },
    terminalGuideLabel: { fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: '#38bdf8', marginBottom: 8 },
    terminalGuideBody: { fontSize: 13, lineHeight: 1.55, color: '#e2e8f0', margin: 0 },
    terminalGuideActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
    terminalGuideSkip: { background: 'transparent', border: '1px solid #334155', color: '#94a3b8', fontSize: 11, letterSpacing: 0.5, padding: '6px 12px', borderRadius: 999, cursor: 'pointer' },
    terminalGuideNext: { background: '#38bdf8', border: 'none', color: '#0f172a', fontSize: 11, fontWeight: 800, letterSpacing: 0.5, padding: '6px 14px', borderRadius: 999, cursor: 'pointer' },
  };

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
    const [revealedHints, setRevealedHints] = React.useState({});
    const [revealedAnswers, setRevealedAnswers] = React.useState({});
    const [feedback, setFeedback] = React.useState(null);
    const [takeaway, setTakeaway] = React.useState(null);
    const [services, setServices] = React.useState({});
    const [savedFiles, setSavedFiles] = React.useState({});
    const [observed, setObserved] = React.useState({});
    const [uiPath, setUiPath] = React.useState([]);
    const terminalGuideKey = `mission_next_terminal_guide_seen_${(user && user.username) || 'guest'}`;
    const [terminalGuideStep, setTerminalGuideStep] = React.useState(() => {
      try { return localStorage.getItem(terminalGuideKey) ? TERMINAL_GUIDE_STEPS.length : 0; }
      catch (e) { return 0; }
    });
    const [terminalGuideOpen, setTerminalGuideOpen] = React.useState(() => terminalGuideStep < TERMINAL_GUIDE_STEPS.length);
    function advanceTerminalGuide() {
      const next = terminalGuideStep + 1;
      if (next > TERMINAL_GUIDE_STEPS.length) {
        setTerminalGuideOpen(false);
        return;
      }
      setTerminalGuideStep(next);
      try { if (next >= TERMINAL_GUIDE_STEPS.length) localStorage.setItem(terminalGuideKey, '1'); } catch (e) { /* best effort */ }
    }
    function dismissTerminalGuide() {
      setTerminalGuideStep(TERMINAL_GUIDE_STEPS.length);
      setTerminalGuideOpen(false);
      try { localStorage.setItem(terminalGuideKey, '1'); } catch (e) { /* best effort */ }
    }

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
        completed: overrides.completed || Array.from(completedSet),
        uiPath: overrides.uiPath || uiPath,
      };
    }

    function recordCorrect(stepId, points) {
      setCompletedSet(prev => {
        if (prev.has(stepId)) return prev;
        const next = new Set(prev); next.add(stepId); return next;
      });
      // also mark the underlying base progress score so the existing instructor
      // dashboard sees activity even before it's updated for new fields.
      if (window.markTaskComplete && user) {
        try { window.markTaskComplete(user.username, lab.id, stepId, points || 10); }
        catch (e) { /* old API may not accept new id format — non-fatal */ }
      }
    }

    function evaluateAllUnlockedSteps(submission, simOverride) {
      // After every shell command, re-check all unlocked, incomplete steps.
      // Return the steps that were completed so the UI can explain the win.
      if (!window.validateStep) return [];
      const hitSteps = [];
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
          hitSteps.push(step);
        } else if (step.id === activeStepId) {
          if (window.MISSION_NEXT_PROGRESS_EXT && user) window.MISSION_NEXT_PROGRESS_EXT.markStepAttempt(user.username, lab.id, step.id, submission, false);
        }
      }
      return hitSteps;
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
      const hitSteps = evaluateAllUnlockedSteps(cmdLine, applyShellResult(result));
      if (hitSteps.length) {
        const step = hitSteps[0];
        setTakeaway({
          step,
          command: cmdLine,
          result,
        });
        setFeedback({ kind: 'ok', text: 'Step complete.' });
        window.setTimeout(() => setFeedback(null), 1400);
      }
    }

    function onShellAction(submission, result) {
      const hitSteps = evaluateAllUnlockedSteps(submission, applyShellResult(result));
      if (hitSteps.length) {
        setTakeaway({ step: hitSteps[0], command: submission, result });
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

    const showTerminalGuide = ShellComponent === window.LinuxTerminalShell;

    return (
      <div style={lpStyles.root}>
        {showTerminalGuide && terminalGuideOpen && (
          <TerminalGuidePanel stepIndex={terminalGuideStep} onNext={advanceTerminalGuide} onSkip={dismissTerminalGuide} />
        )}
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
            <span
              style={lpStyles.pctBar}
              role="progressbar"
              aria-label="Lab progress"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={pct}
            >
              <span style={{ ...lpStyles.pctFill, width: `${pct}%` }} />
            </span>
            <span style={lpStyles.userText}>{user && user.displayName}</span>
          </div>
        </nav>

        {labComplete && (
          <div role="status" style={lpStyles.completionBanner}>
            <strong>Mission Next lab complete.</strong> All required steps are verified. Return to Module 3 to submit your assessment write-up.
          </div>
        )}

        {takeaway && (
          <TakeawayCard takeaway={takeaway} onClose={() => setTakeaway(null)} />
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

            <div style={lpStyles.beginnerGuide}>
              <div style={lpStyles.beginnerGuideTitle}>NEW TO BASH?</div>
              <div style={lpStyles.beginnerGuideBody}>
                Click the active step, type the command shown in the terminal, and press <kbd style={lpStyles.key}>Enter</kbd>.
                You can use <kbd style={lpStyles.key}>↑</kbd> to reuse a previous command and <kbd style={lpStyles.key}>Tab</kbd> to complete a path.
                Read any output before moving to the next step.
              </div>
              {showTerminalGuide && !terminalGuideOpen && (
                <button
                  type="button"
                  onClick={() => { setTerminalGuideStep(0); setTerminalGuideOpen(true); }}
                  style={lpStyles.beginnerGuideReplay}
                >
                  Replay terminal guide
                </button>
              )}
            </div>

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

      </div>
    );
  }

  function TakeawayCard({ takeaway, onClose }) {
    const step = takeaway.step || {};
    const learning = step.learning || {};
    const resultText = takeaway.result && takeaway.result.exitCode === 0
      ? 'The simulated command completed successfully.'
      : 'The command ran in the practice environment.';
    return (
      <div role="status" aria-live="polite" style={lpStyles.takeawayCard}>
        <div style={lpStyles.takeawayTopline}>
          <span style={lpStyles.takeawayEyebrow}>TAKEAWAY · STEP COMPLETE</span>
          <button type="button" onClick={onClose} style={lpStyles.takeawayClose} aria-label="Dismiss takeaway">×</button>
        </div>
        <div style={lpStyles.takeawayTitle}>{learning.title || 'You just changed the lab state'}</div>
        <div style={lpStyles.takeawayCommand}><code>{takeaway.command}</code></div>
        <p style={lpStyles.takeawayBody}><strong>What happened:</strong> {learning.what || resultText}</p>
        <p style={lpStyles.takeawayBody}><strong>Why you are learning it:</strong> {learning.why || 'SOC analysts need to connect each command to the security control or evidence it produces.'}</p>
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
    const hintCommand = step.hint && step.hint.match(/`([^`]+)`/);
    const commandToType = hintCommand ? hintCommand[1] : (step.upstream && step.upstream.sourceLine && !/[—()]/.test(step.upstream.sourceLine) && /^(sudo\s+)?[a-z][a-z0-9-]*(\s|$)/i.test(step.upstream.sourceLine) ? step.upstream.sourceLine : null);

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
        {commandToType && (
          <div style={lpStyles.commandCallout}>
            <div style={lpStyles.commandLabel}>TYPE THIS IN THE TERMINAL</div>
            <code>{commandToType}</code>
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

  // Mission Next styling applies to this instructional shell only. Product
  // simulators (Procmon, Wireshark, Windows, Splunk-style views) own their
  // internal chrome and typography in their respective shell files.
  const lpStyles = {
    root: { minHeight: '100vh', background: 'linear-gradient(150deg, #0c1e32 0%, #1e3a5f 50%, #162d4a 100%)', color: '#e2e8f0', fontFamily: "'Space Grotesk',sans-serif", display: 'flex', flexDirection: 'column' },
    nav: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 clamp(0.75rem, 2.5vw, 1.25rem)', height: 56, background: 'rgba(10,22,40,0.94)',
      borderBottom: '1px solid rgba(255,255,255,0.12)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 50,
      backdropFilter: 'blur(18px)',
    },
    navLeft: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', minWidth: 0 },
    backBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 12, color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, fontWeight: 600, padding: '7px 12px', cursor: 'pointer' },
    navSep: { color: '#f97316' },
    navTitle: { fontSize: 14, fontWeight: 700, color: '#fff' },
    diffPill: { fontSize: 10, border: '1px solid currentColor', borderRadius: 999, padding: '3px 9px', letterSpacing: 1, fontFamily: "'Space Grotesk',sans-serif", opacity: 0.9 },
    navRight: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
    scoreDisplay: { fontFamily: "'Space Mono',monospace", fontSize: 11, color: '#f97316' },
    pctBar: { width: 96, height: 7, background: 'rgba(249,115,22,0.18)', borderRadius: 999, overflow: 'hidden' },
    pctFill: { display: 'block', height: '100%', background: '#f97316', transition: 'width 0.25s' },
    userText: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontFamily: "'Space Grotesk',sans-serif" },
    completionBanner: { padding: '12px 16px', background: 'rgba(249,115,22,0.14)', borderBottom: '1px solid rgba(249,115,22,0.45)', color: '#ffedd5', fontSize: 13, lineHeight: 1.5 },
    takeawayCard: { position: 'fixed', right: 22, bottom: 22, width: 'min(390px, calc(100vw - 44px))', padding: 18, background: 'rgba(255,255,255,0.98)', color: '#334155', border: '1px solid #fed7aa', borderTop: '4px solid #f97316', borderRadius: 16, boxShadow: '0 18px 48px rgba(2,6,23,0.3)', zIndex: 80, animation: 'mission-next-takeaway-in 0.22s ease-out' },
    takeawayTopline: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    takeawayEyebrow: { fontSize: 10, fontWeight: 800, letterSpacing: 1.4, color: '#ea580c' },
    takeawayClose: { border: 'none', background: 'transparent', color: '#64748b', fontSize: 22, lineHeight: 1, cursor: 'pointer', padding: 0 },
    takeawayTitle: { marginTop: 8, color: '#1e3a5f', fontSize: 17, fontWeight: 800, lineHeight: 1.25 },
    takeawayCommand: { marginTop: 10, padding: '8px 10px', background: '#0f172a', borderRadius: 8, color: '#fed7aa', fontFamily: "'Space Mono',monospace", fontSize: 11, overflowWrap: 'anywhere' },
    takeawayBody: { margin: '12px 0 0', fontSize: 12, lineHeight: 1.55, color: '#475569' },

    layout: { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(min(100%, 22rem), 26rem)', gap: 0, flex: 1, minHeight: 0 },
    layoutNarrow: { gridTemplateColumns: 'minmax(0,1fr)', gridTemplateRows: 'minmax(24rem, 58vh) auto' },
    shellPane: { minWidth: 0, padding: 14, background: 'rgba(10,22,40,0.72)', borderRight: '1px solid rgba(255,255,255,0.12)', display: 'flex' },
    shellPaneNarrow: { borderRight: 'none', borderBottom: '1px solid rgba(255,255,255,0.12)', minHeight: '24rem' },
    shellMissing: { padding: 24, color: '#f87171', fontFamily: "'Space Mono', monospace", fontSize: 12 },
    sidebar: { minWidth: 0, overflow: 'auto', background: 'rgba(248,250,252,0.98)', color: '#334155', padding: '18px 16px' },
    sidebarNarrow: { maxHeight: 'none' },

    scenarioBox: { padding: 20, background: '#fff', border: '1px solid #e2e8f0', marginBottom: 12, borderRadius: 16, boxShadow: '0 1px 2px rgba(15,23,42,0.06)' },
    scenarioLabel: { fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#f97316', marginBottom: 8 },
    scenarioRole: { fontSize: 16, color: '#1e3a5f', marginBottom: 8, fontWeight: 700 },
    scenarioBody: { fontSize: 14, color: '#64748b', lineHeight: 1.65 },
    sourceLink: { display: 'inline-block', marginTop: 10, color: '#1e3a5f', border: '1px solid rgba(30,58,95,0.2)', borderRadius: 12, padding: '6px 10px', fontSize: 11, fontWeight: 600, textDecoration: 'none' },
    beginnerGuide: { padding: '12px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', marginBottom: 16, borderRadius: 12, color: '#1e3a5f' },
    beginnerGuideTitle: { fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: '#2563eb', marginBottom: 5 },
    beginnerGuideBody: { fontSize: 12, lineHeight: 1.55 },
    beginnerGuideReplay: { marginTop: 10, background: 'transparent', border: '1px solid #bfdbfe', color: '#2563eb', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, padding: '6px 12px', borderRadius: 999, cursor: 'pointer' },
    key: { display: 'inline-block', padding: '1px 5px', margin: '0 2px', border: '1px solid #93c5fd', borderBottomWidth: 2, borderRadius: 4, background: '#fff', fontFamily: "'Space Mono',monospace", fontSize: 10 },

    stepsHeader: { display: 'flex', justifyContent: 'space-between', fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#1e3a5f', marginBottom: 10 },
    stepsHeaderCount: { color: '#64748b', fontWeight: 500, letterSpacing: 0 },
    stepsList: { display: 'flex', flexDirection: 'column', gap: 12 },

    exerciseBox: { border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' },
    exerciseHeader: {
      width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      background: '#fff', border: 'none', color: '#1e3a5f', fontFamily: "'Space Grotesk',sans-serif",
      fontSize: 14, fontWeight: 700, padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
    },
    exerciseHeadingWrap: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
    exerciseMeta: { fontSize: 11, fontWeight: 500, color: '#64748b' },
    exerciseCount: { fontFamily: "'Space Mono',monospace", fontSize: 11, color: '#f97316' },

    stepRow: {
      padding: '12px 16px', borderLeft: '3px solid #94a3b8', borderBottom: '1px solid #f1f5f9',
      background: '#fff', cursor: 'pointer', transition: 'background 0.15s',
    },
    stepHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
    stepBadge: { width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid currentColor', borderRadius: 9, fontSize: 10, fontFamily: "'Space Mono',monospace" },
    stepOrdinal: { fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: 1, color: '#1e3a5f' },
    stepUpstream: { fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, letterSpacing: 0, color: '#64748b' },
    stepPts: { marginLeft: 'auto', fontFamily: "'Space Mono',monospace", fontSize: 9, color: '#f97316' },
    stepInstruction: { fontSize: 14, color: '#475569', lineHeight: 1.55 },
    stepSource: { marginTop: 6, padding: '6px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontFamily: "'Space Mono',monospace", fontSize: 11, color: '#1e3a5f', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
    commandCallout: { marginTop: 9, padding: '9px 10px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#bbf7d0', fontFamily: "'Space Mono',monospace", fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
    commandLabel: { color: '#93c5fd', fontFamily: "'Space Grotesk',sans-serif", fontSize: 9, fontWeight: 800, letterSpacing: 1, marginBottom: 5 },
    stepHint: { marginTop: 6, fontSize: 12, color: '#1e3a5f', fontStyle: 'italic' },
    stepReveal: { marginTop: 6, padding: '8px 10px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, fontSize: 12, color: '#9a3412' },

    answerRow: { display: 'flex', gap: 8, marginTop: 8 },
    answerInput: { flex: 1, background: '#fff', border: '1px solid #cbd5e1', color: '#1e3a5f', fontFamily: "'Space Mono',monospace", fontSize: 12, padding: '8px 10px', borderRadius: 8, outline: 'none' },
    answerBtn: { background: '#f97316', border: 'none', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, letterSpacing: 1, padding: '8px 14px', cursor: 'pointer', fontWeight: 700, borderRadius: 12 },

    feedbackOk: { marginTop: 12, padding: '8px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontFamily: "'Space Mono',monospace", fontSize: 11, borderRadius: 8 },
    feedbackBad: { marginTop: 12, padding: '8px 10px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontFamily: "'Space Mono',monospace", fontSize: 11, borderRadius: 8 },
  };

  Object.assign(window, { LabPlayer });
})();
