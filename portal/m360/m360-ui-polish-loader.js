(() => {
  'use strict';

  const current = document.currentScript;
  const src = current && current.dataset.polishSrc;
  if (!src) return;

  let loaded = false;

  function sanitizeProductionCopy() {
    const saveState = document.getElementById('saveState');
    if (saveState && /local mock adapter|not production data/i.test(saveState.textContent || '')) {
      saveState.textContent = 'Connected M360 workspace';
      saveState.classList.add('saved');
    }

    const validation = document.getElementById('validationMessage');
    if (validation && /local mock adapter/i.test(validation.textContent || '')) {
      validation.textContent = validation.textContent.replace(/local mock adapter/gi, 'M360 workspace');
    }
  }

  function ensurePortfolioNavigation() {
    const nav = document.getElementById('m360WeekNavigation');
    if (!nav || document.getElementById('m360PortfolioNavLink')) return;
    const link = document.createElement('a');
    link.id = 'm360PortfolioNavLink';
    link.className = 'btn btn-secondary';
    link.href = 'portfolio.html';
    link.textContent = 'My M360 Portfolio';
    nav.appendChild(link);
  }

  function loadPolish() {
    if (loaded || document.querySelector('script[data-m360-polish-runtime="true"]')) return;
    loaded = true;
    ensurePortfolioNavigation();
    sanitizeProductionCopy();

    const validation = document.getElementById('validationMessage');
    if (validation) {
      new MutationObserver(sanitizeProductionCopy).observe(validation, { childList: true, subtree: true, characterData: true });
    }
    const saveState = document.getElementById('saveState');
    if (saveState) {
      new MutationObserver(sanitizeProductionCopy).observe(saveState, { childList: true, subtree: true, characterData: true });
    }

    const script = document.createElement('script');
    script.src = src;
    script.dataset.m360PolishRuntime = 'true';
    script.addEventListener('error', error => console.error('M360 UI polish failed to load', error), { once: true });
    document.body.appendChild(script);
  }

  // Do not run presentation rewrites while the production bridge is still
  // hydrating and loading the week-specific script. Waiting for the bridge-
  // created course navigation proves the core week runtime has completed.
  const deadline = Date.now() + 15000;
  function waitForRuntime() {
    const navigationReady = Boolean(document.getElementById('m360WeekNavigation'));
    const contentReady = Boolean(document.querySelector('.content'));
    const weekReady = Boolean(document.getElementById('journeyProgress'));
    if (navigationReady && contentReady && weekReady) {
      loadPolish();
      return;
    }
    if (Date.now() >= deadline) {
      console.warn('M360 UI polish skipped because the authenticated week runtime did not become ready in time.');
      return;
    }
    setTimeout(waitForRuntime, 100);
  }

  waitForRuntime();
})();
