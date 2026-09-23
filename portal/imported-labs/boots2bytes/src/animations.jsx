// ============================================================
//  Motion primitives — Motion One backed, WAAPI fallback
// ============================================================

const motionState = {
  ready: false,
};

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function motionAnimate(target, keyframes, options = {}) {
  const motion = window.MotionOne;
  if (motion?.animate) return motion.animate(target, keyframes, options);
  const nodes = target instanceof Element ? [target] : Array.from(target || []);
  return nodes.map(node => node.animate(keyframes, {
    duration: (options.duration || 0.28) * 1000,
    delay: (options.delay || 0) * 1000,
    easing: options.easing || 'cubic-bezier(0.22, 1, 0.36, 1)',
    fill: 'both',
  }));
}

function usePageReveal(scopeRef, deps = []) {
  React.useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    scope.style.opacity = '1';
    scope.style.transform = 'translate3d(0, 0, 0)';

    if (prefersReducedMotion()) return;

    const revealItems = scope.querySelectorAll('[data-reveal]');
    const cards = scope.querySelectorAll('[data-card]');
    const controls = scope.querySelectorAll('button, a, summary, select, input');

    motionAnimate(scope, { opacity: [0, 1], transform: ['translate3d(0, 12px, 0)', 'translate3d(0, 0, 0)'] }, {
      duration: 0.42,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    });

    revealItems.forEach((item, index) => {
      motionAnimate(item, {
        opacity: [0, 1],
        transform: ['translate3d(0, 18px, 0)', 'translate3d(0, 0, 0)'],
        filter: ['blur(6px)', 'blur(0px)'],
      }, {
        duration: 0.48,
        delay: 0.05 + index * 0.045,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      });
    });

    cards.forEach(card => attachLift(card));
    controls.forEach(control => attachControlMotion(control));
  }, deps);
}

function attachLift(node) {
  if (node.dataset.motionBound) return;
  node.dataset.motionBound = 'true';
  node.addEventListener('pointerenter', () => {
    if (prefersReducedMotion()) return;
    motionAnimate(node, {
      transform: ['translate3d(0, 0, 0)', 'translate3d(0, -5px, 0)'],
      boxShadow: ['0 0 0 rgba(0,0,0,0)', '0 18px 48px rgba(0,0,0,0.42), 0 0 28px rgba(34,197,94,0.16)'],
    }, { duration: 0.24 });
  });
  node.addEventListener('pointerleave', () => {
    if (prefersReducedMotion()) return;
    motionAnimate(node, {
      transform: 'translate3d(0, 0, 0)',
      boxShadow: '0 0 0 rgba(0,0,0,0)',
    }, { duration: 0.24 });
  });
}

function attachControlMotion(node) {
  if (node.dataset.controlMotionBound) return;
  node.dataset.controlMotionBound = 'true';
  node.addEventListener('pointerenter', () => {
    if (prefersReducedMotion() || node.disabled) return;
    motionAnimate(node, {
      transform: ['scale(1)', 'scale(1.035)'],
      boxShadow: ['0 0 0 rgba(0,0,0,0)', '0 10px 28px rgba(34,197,94,0.14)'],
    }, { duration: 0.18 });
  });
  node.addEventListener('pointerleave', () => {
    if (prefersReducedMotion() || node.disabled) return;
    motionAnimate(node, {
      transform: 'scale(1)',
      boxShadow: '0 0 0 rgba(0,0,0,0)',
    }, { duration: 0.18 });
  });
}

function AnimatedPage({ routeKey, children, style }) {
  const ref = React.useRef(null);
  usePageReveal(ref, [routeKey]);
  return (
    <div ref={ref} data-route={routeKey} style={{ minHeight:'100%', opacity:1, transform:'translate3d(0, 0, 0)', ...style }}>
      {children}
    </div>
  );
}

function DecodeTitle({ text, style, className }) {
  const [display, setDisplay] = React.useState(text);
  const chars = '01#@$%&ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  React.useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(text);
      return;
    }
    let frame = 0;
    const totalFrames = 28;
    const timer = window.setInterval(() => {
      frame += 1;
      setDisplay(text.split('').map((char, index) => {
        if (char === ' ') return ' ';
        const resolveAt = Math.floor((index / Math.max(text.length - 1, 1)) * 12) + 8;
        if (frame > resolveAt) return char;
        return chars[(frame + index * 7) % chars.length];
      }).join(''));
      if (frame >= totalFrames) {
        setDisplay(text);
        window.clearInterval(timer);
      }
    }, 34);
    return () => window.clearInterval(timer);
  }, [text]);

  return <h1 className={className} style={style} aria-label={text}>{display}</h1>;
}

function SkeletonBlock({ style }) {
  return <div aria-hidden="true" style={{...skeletonStyles.block, ...style}} />;
}

const skeletonStyles = {
  block: {
    minHeight: 12,
    borderRadius: 4,
    background: 'linear-gradient(90deg, rgba(30,58,46,0.22), rgba(56,189,248,0.12), rgba(30,58,46,0.22))',
    backgroundSize: '220% 100%',
    animation: 'skeletonSweep 1.2s ease-in-out infinite',
  },
};

window.addEventListener('motion-one-ready', () => {
  motionState.ready = true;
});

Object.assign(window, {
  AnimatedPage,
  DecodeTitle,
  SkeletonBlock,
  motionAnimate,
  usePageReveal,
});
