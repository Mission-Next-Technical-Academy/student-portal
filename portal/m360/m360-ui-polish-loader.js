(() => {
  'use strict';

  const current = document.currentScript;
  const src = current && current.dataset.polishSrc;
  if (!src) return;

  let loaded = false;
  function loadPolish() {
    if (loaded || document.querySelector('script[data-m360-polish-runtime="true"]')) return;
    loaded = true;
    const script = document.createElement('script');
    script.src = src;
    script.dataset.m360PolishRuntime = 'true';
    script.addEventListener('error', error => console.error('M360 UI polish failed to load', error), { once: true });
    document.body.appendChild(script);
  }

  // The production bridge owns authenticated hydration and then loads the
  // week-specific runtime. Wait for the core week DOM to exist before running
  // presentation-only DOM rewrites; this avoids a mutation-observer loop while
  // the Week 2 template is still initializing.
  const deadline = Date.now() + 15000;
  function waitForRuntime() {
    const contentReady = Boolean(document.querySelector('.content'));
    const weekReady = Boolean(document.getElementById('journeyProgress'));
    const formReady = Boolean(document.querySelector('[data-m360]') || document.getElementById('prove'));
    if (contentReady && weekReady && formReady) {
      loadPolish();
      return;
    }
    if (Date.now() >= deadline) {
      console.warn('M360 UI polish skipped because the week runtime did not become ready in time.');
      return;
    }
    setTimeout(waitForRuntime, 100);
  }

  waitForRuntime();
})();
