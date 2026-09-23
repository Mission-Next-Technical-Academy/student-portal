// ============================================================
//  Check-on-Learning Drawer (Mission Next boot icon)
// ============================================================
//  Bottom-left floating boot icon that pops a slide-up panel
//  with context-aware questions. Triggered by step events.
//
//  Props:
//    questions     CheckOnLearningQuestion[]
//    triggeredId   id of the question that should pop now (or null)
//    answered      { [questionId]: { passed, lastResponse } }
//    onAnswer      (questionId, response, passed) => void
//    onSkip        (questionId) => void
//    onClose       () => void
//
//  Rendering is intentionally vanilla — relies on React + inline
//  styles to play nicely with the existing browser-Babel setup.
// ============================================================

function CheckOnLearningDrawer({
  questions = [],
  triggeredId = null,
  answered = {},
  onAnswer = function () {},
  onSkip = function () {},
  onClose = function () {},
}) {
  const [open, setOpen] = React.useState(false);
  const [activeId, setActiveId] = React.useState(null);
  const [response, setResponse] = React.useState(null);
  const [feedback, setFeedback] = React.useState(null);

  // Pop open when a new triggered question arrives.
  React.useEffect(() => {
    if (!triggeredId) return;
    const q = questions.find(x => x.id === triggeredId);
    if (!q) return;
    if (answered[triggeredId] && answered[triggeredId].passed) return;
    setActiveId(triggeredId);
    setResponse(null);
    setFeedback(null);
    setOpen(true);
  }, [triggeredId, questions, answered]);

  const unread = React.useMemo(() => {
    return questions.filter(q => {
      const a = answered[q.id];
      return !a || !a.passed;
    });
  }, [questions, answered]);

  const active = activeId ? questions.find(q => q.id === activeId) : (unread[0] || null);

  function evaluatePass(question, resp) {
    if (!question) return false;
    if (question.type === 'multi-select') {
      const correctIds = (question.options || []).filter(o => o.correct).map(o => o.id).sort();
      const got = (resp || []).slice().sort();
      const allCorrect = correctIds.length === got.length && correctIds.every((id, i) => id === got[i]);
      if (question.passThreshold === 'any-correct') return (resp || []).some(id => correctIds.includes(id));
      if (question.passThreshold === 'majority') {
        const hits = (resp || []).filter(id => correctIds.includes(id)).length;
        return hits >= Math.ceil(correctIds.length / 2) && (resp || []).every(id => correctIds.includes(id));
      }
      return allCorrect;
    }
    if (question.type === 'single-select') {
      const correctIds = (question.options || []).filter(o => o.correct).map(o => o.id);
      return correctIds.length > 0 && correctIds.includes(resp);
    }
    if (question.type === 'short-answer') {
      const want = question.acceptedAnswer;
      const sub = String(resp || '').trim();
      if (want instanceof RegExp) return want.test(sub);
      if (Array.isArray(want)) return want.some(a => sub.toLowerCase() === String(a).trim().toLowerCase());
      return sub.toLowerCase() === String(want || '').trim().toLowerCase();
    }
    return false;
  }

  function handleSubmit() {
    if (!active) return;
    const passed = evaluatePass(active, response);
    setFeedback(passed ? 'correct' : 'incorrect');
    onAnswer(active.id, response, passed);
    if (passed) {
      window.setTimeout(() => {
        setFeedback(null);
        const next = unread.filter(q => q.id !== active.id)[0];
        if (next) {
          setActiveId(next.id);
          setResponse(null);
        } else {
          setOpen(false);
          onClose();
        }
      }, 700);
    }
  }

  function handleSkip() {
    if (!active) return;
    onSkip(active.id);
    setFeedback(null);
    const next = unread.filter(q => q.id !== active.id)[0];
    if (next) {
      setActiveId(next.id);
      setResponse(null);
    } else {
      setOpen(false);
      onClose();
    }
  }

  return (
    <div style={drawerStyles.root}>
      {!open && (
        <button
          aria-label="Open Check on Learning"
          onClick={() => { setOpen(true); setFeedback(null); }}
          style={drawerStyles.boot}
        >
          <img
            src="./assets/boot-logo-transparent.png"
            alt=""
            style={drawerStyles.bootImg}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <span style={drawerStyles.bootGlyph}>?</span>
          {unread.length > 0 && (
            <span style={drawerStyles.badge}>{unread.length}</span>
          )}
        </button>
      )}

      {open && (
        <div style={drawerStyles.panel} role="dialog" aria-label="Check on Learning">
          <div style={drawerStyles.header}>
            <span style={drawerStyles.headerLabel}>CHECK ON LEARNING</span>
            <span style={drawerStyles.headerCount}>
              {active ? `Q${(questions.findIndex(q => q.id === active.id) + 1)} of ${questions.length}` : ''}
            </span>
            <button onClick={() => { setOpen(false); onClose(); }} style={drawerStyles.closeBtn} aria-label="Close">×</button>
          </div>

          <div style={drawerStyles.body}>
            {!active && (
              <div style={drawerStyles.empty}>No active questions. Keep working — questions appear after key steps.</div>
            )}
            {active && (
              <React.Fragment>
                <div style={drawerStyles.bloom}>{active.bloom || 'check'}</div>
                <div style={drawerStyles.question}>{active.question}</div>

                {active.type === 'multi-select' && (
                  <div style={drawerStyles.options}>
                    {(active.options || []).map(opt => {
                      const checked = Array.isArray(response) && response.includes(opt.id);
                      return (
                        <label key={opt.id} style={drawerStyles.optionRow}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const cur = Array.isArray(response) ? response.slice() : [];
                              if (checked) setResponse(cur.filter(x => x !== opt.id));
                              else setResponse(cur.concat([opt.id]));
                            }}
                          />
                          <span>{opt.text}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {active.type === 'single-select' && (
                  <div style={drawerStyles.options}>
                    {(active.options || []).map(opt => (
                      <label key={opt.id} style={drawerStyles.optionRow}>
                        <input
                          type="radio"
                          name={`col-${active.id}`}
                          checked={response === opt.id}
                          onChange={() => setResponse(opt.id)}
                        />
                        <span>{opt.text}</span>
                      </label>
                    ))}
                  </div>
                )}

                {active.type === 'short-answer' && (
                  <input
                    type="text"
                    value={response || ''}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Type your answer"
                    style={drawerStyles.shortInput}
                  />
                )}

                {feedback === 'correct' && <div style={drawerStyles.feedbackOk}>Correct.</div>}
                {feedback === 'incorrect' && <div style={drawerStyles.feedbackBad}>Not quite. Re-read the result above and try again.</div>}
              </React.Fragment>
            )}
          </div>

          {active && (
            <div style={drawerStyles.footer}>
              <button onClick={handleSkip} style={drawerStyles.skipBtn}>SKIP</button>
              <button onClick={handleSubmit} style={drawerStyles.submitBtn}>SUBMIT</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const drawerStyles = {
  root: { position: 'fixed', left: 16, bottom: 16, zIndex: 1000, fontFamily: "'Inter', sans-serif" },
  boot: {
    width: 48, height: 48, borderRadius: '50%', border: '1px solid rgba(34,197,94,0.45)',
    background: 'rgba(11,15,20,0.92)', color: '#22c55e', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
    boxShadow: '0 6px 18px rgba(0,0,0,0.45), 0 0 14px rgba(34,197,94,0.18)',
  },
  bootImg: { width: 28, height: 28, objectFit: 'contain' },
  bootGlyph: { position: 'absolute', fontSize: 18, fontWeight: 700, color: '#22c55e', textShadow: '0 0 8px rgba(34,197,94,0.45)' },
  badge: {
    position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9,
    background: '#f87171', color: '#0b0f14', fontSize: 11, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
  },
  panel: {
    width: 'min(480px, calc(100vw - 32px))', height: 'min(520px, calc(100vh - 64px))',
    background: 'rgba(11,15,20,0.97)', border: '1px solid rgba(34,197,94,0.32)', borderRadius: 8,
    boxShadow: '0 24px 80px rgba(0,0,0,0.55)', display: 'flex', flexDirection: 'column',
    color: '#e2e8f0', overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
    borderBottom: '1px solid rgba(34,197,94,0.18)', background: 'rgba(7,11,16,0.6)',
  },
  headerLabel: { fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: 2, color: '#22c55e' },
  headerCount: { marginLeft: 'auto', fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#64748b' },
  closeBtn: {
    background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 22, cursor: 'pointer',
    width: 28, height: 28, lineHeight: '28px', padding: 0,
  },
  body: { flex: 1, overflow: 'auto', padding: '16px 18px' },
  empty: { color: '#64748b', fontSize: 13, lineHeight: 1.6 },
  bloom: { fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 },
  question: { fontSize: 14, lineHeight: 1.55, color: '#e2e8f0', marginBottom: 16 },
  options: { display: 'flex', flexDirection: 'column', gap: 8 },
  optionRow: {
    display: 'flex', alignItems: 'flex-start', gap: 8, padding: 8,
    border: '1px solid rgba(56,189,248,0.16)', borderRadius: 4, background: 'rgba(8,13,20,0.5)',
    fontSize: 13, lineHeight: 1.45, cursor: 'pointer',
  },
  shortInput: {
    width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid #1e3a2e',
    color: '#e2e8f0', fontFamily: "'Space Mono', monospace", fontSize: 13,
    padding: '10px 12px', borderRadius: 6,
  },
  feedbackOk: { marginTop: 12, color: '#22c55e', fontSize: 12, fontFamily: "'Space Mono', monospace" },
  feedbackBad: { marginTop: 12, color: '#f87171', fontSize: 12, fontFamily: "'Space Mono', monospace" },
  footer: { display: 'flex', gap: 8, padding: 12, borderTop: '1px solid rgba(34,197,94,0.18)', background: 'rgba(7,11,16,0.6)' },
  skipBtn: {
    flex: '0 0 auto', background: 'transparent', border: '1px solid #475569', color: '#94a3b8',
    fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: 2, padding: '8px 14px', cursor: 'pointer',
  },
  submitBtn: {
    flex: 1, background: '#22c55e', border: 'none', color: '#0b0f14',
    fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: 2, padding: '8px 14px', cursor: 'pointer', fontWeight: 700,
  },
};

Object.assign(window, { CheckOnLearningDrawer });
