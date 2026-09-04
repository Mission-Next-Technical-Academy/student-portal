(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const week = Number(params.get('week'));
  const here = new URL(location.href);
  const m360Base = new URL('./', here);
  const homeUrl = new URL('index.html', m360Base).href;
  const week1Url = new URL('week.html?week=1', m360Base).href;
  const week2Url = new URL('week.html?week=2', m360Base).href;
  const portfolioUrl = new URL('portfolio.html', m360Base).href;

  function ensurePortfolioLink(nav) {
    if (!nav || document.getElementById('m360PortfolioNavLink')) return;
    const link = document.createElement('a');
    link.id = 'm360PortfolioNavLink';
    link.className = 'btn btn-secondary';
    link.href = portfolioUrl;
    link.textContent = 'My M360 Portfolio';
    nav.appendChild(link);
  }

  function rewrite() {
    const nav = document.getElementById('m360WeekNavigation');
    if (nav) {
      nav.querySelectorAll('a').forEach(link => {
        const text = link.textContent.trim();
        if (text.includes('M360 Home')) link.href = homeUrl;
        else if (text.includes('Week 1')) link.href = week1Url;
        else if (text.includes('Week 2')) link.href = week2Url;
      });
      ensurePortfolioLink(nav);
    }

    const back = document.querySelector('.back-link');
    if (back && week === 2) {
      back.href = week1Url;
      back.textContent = '← Week 1';
    }

    if (nav || back) return true;
    return false;
  }

  if (!rewrite()) {
    const observer = new MutationObserver(() => {
      if (rewrite()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 15000);
  }
})();
