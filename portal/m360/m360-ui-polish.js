(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const week = Number(params.get('week'));
  const CAREER_SPOTLIGHT_SLIDES_ID = '1msVm3QQ5gJ_iaoEKCtNecimjYV8PZXGHhAU5T4dul_U';

  function ensureStyles() {
    if (document.getElementById('m360UiPolishStyles')) return;
    const style = document.createElement('style');
    style.id = 'm360UiPolishStyles';
    style.textContent = `
      .artifact-heading{align-items:center}
      .artifact-heading .status-badge{align-self:center;flex:0 0 auto;white-space:nowrap;text-align:center}
      #m360WeekNavigation{justify-content:center;align-items:center;gap:12px;padding:8px 0 2px}
      #m360WeekNavigation .btn{display:inline-flex;align-items:center;justify-content:center;min-width:138px;text-align:center;line-height:1.2}
      @media(max-width:640px){#m360WeekNavigation{display:grid;grid-template-columns:1fr}#m360WeekNavigation .btn{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function rewriteCourseNavigation() {
    const nav = document.getElementById('m360WeekNavigation');
    if (!nav) return false;
    nav.querySelectorAll('a').forEach(link => {
      const href = link.getAttribute('href') || '';
      if (/index\.html(?:$|\?)/.test(href) || /\/m360\/?$/.test(href)) {
        link.textContent = 'M360 Home';
        return;
      }
      const match = href.match(/[?&]week=(\d+)/);
      if (!match) return;
      const target = Number(match[1]);
      if (target < week) link.textContent = `Previous: Week ${target}`;
      else if (target > week) link.textContent = `Next: Week ${target}`;
      else link.textContent = `Week ${target}`;
    });
    return true;
  }

  function centerPortfolioReadyStatus() {
    let changed = false;
    document.querySelectorAll('.artifact-heading .status-badge').forEach(status => {
      status.style.alignSelf = 'center';
      status.style.flex = '0 0 auto';
      status.style.whiteSpace = 'nowrap';
      status.style.textAlign = 'center';
      changed = true;
    });
    return changed;
  }

  function fixCareerSpotlightTemplateLinks() {
    if (week !== 6) return false;
    const resources = Array.from(document.querySelectorAll('.workbook-resource'));
    const resource = resources.find(item => item.textContent.includes('Career Spotlight Student Slide Template'));
    if (!resource) return false;

    const exportUrl = `https://docs.google.com/presentation/d/${CAREER_SPOTLIGHT_SLIDES_ID}/export/pptx`;
    const copyUrl = `https://docs.google.com/presentation/d/${CAREER_SPOTLIGHT_SLIDES_ID}/copy`;
    resource.querySelectorAll('a').forEach(link => {
      const label = link.textContent.trim().toLowerCase();
      if (label.includes('download template')) link.href = exportUrl;
      if (label.includes('google slides copy')) link.href = copyUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });
    return true;
  }

  function apply() {
    ensureStyles();
    const navReady = rewriteCourseNavigation();
    const statusReady = centerPortfolioReadyStatus();
    const templateReady = week !== 6 || fixCareerSpotlightTemplateLinks();
    return navReady && templateReady && (statusReady || Boolean(document.querySelector('.artifact-heading')));
  }

  if (!apply()) {
    const observer = new MutationObserver(() => {
      if (apply()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 15000);
  }
})();
