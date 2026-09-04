(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const week = Number(params.get('week'));
  const here = new URL(location.href);
  const m360Base = new URL('./', here);
  const homeUrl = new URL('index.html', m360Base).href;
  const programsUrl = new URL('../index.html#/portal', m360Base).href;
  const week1Url = new URL('week.html?week=1', m360Base).href;
  const week2Url = new URL('week.html?week=2', m360Base).href;
  const portfolioUrl = new URL('portfolio.html', m360Base).href;
  const portfolioDownloadUrl = new URL('portfolio.html?download=1', m360Base).href;

  function ensurePortfolioLink(nav) {
    if (!nav || document.getElementById('m360PortfolioNavLink')) return;
    const link = document.createElement('a');
    link.id = 'm360PortfolioNavLink';
    link.className = 'btn btn-secondary';
    link.href = portfolioUrl;
    link.textContent = 'My M360 Portfolio';
    nav.appendChild(link);
  }

  function makeBrandProgramsLink() {
    const brand = document.querySelector('.topbar .brand');
    if (!brand || brand.tagName === 'A') {
      if (brand && brand.tagName === 'A') brand.href = programsUrl;
      return Boolean(brand);
    }
    const link = document.createElement('a');
    Array.from(brand.attributes).forEach(attribute => link.setAttribute(attribute.name, attribute.value));
    link.href = programsUrl;
    link.setAttribute('aria-label', 'Return to My Programs');
    link.title = 'My Programs';
    link.style.textDecoration = 'none';
    link.style.color = 'inherit';
    link.innerHTML = brand.innerHTML;
    brand.replaceWith(link);
    return true;
  }

  function ensureCurrentPortfolioDownload() {
    const actions = document.querySelector('#prove .portfolio-actions');
    if (!actions) return false;
    const existing = Array.from(actions.querySelectorAll('a,button')).find(control =>
      control.textContent.toLowerCase().includes('download current portfolio')
    );
    if (existing) return true;
    const link = document.createElement('a');
    link.id = 'm360DownloadCurrentPortfolio';
    link.className = 'btn btn-secondary';
    link.href = portfolioDownloadUrl;
    link.textContent = 'Download current portfolio';
    actions.appendChild(link);
    return true;
  }

  function meaningful(value) {
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.some(meaningful);
    if (value && typeof value === 'object') return Object.values(value).some(meaningful);
    return Boolean(value);
  }

  function recordStatus(record) {
    if (!record) return 'Not Started';
    if (record.accepted_artifact_payload) return 'Portfolio Ready';
    if (record.review_status === 'submitted') return 'Submitted';
    if (record.review_status === 'needs_revision') return 'Needs Revision';
    if (meaningful(record.draft_payload)) return 'In Progress';
    return 'Not Started';
  }

  async function ensureConsistentSidebar() {
    if (!Number.isInteger(week) || week < 1 || week > 6) return false;
    const panel = document.querySelector('.my-m360');
    if (!panel) return false;

    let rows = document.getElementById('m360ConsistentWeekRows');
    if (!rows) {
      rows = document.createElement('div');
      rows.id = 'm360ConsistentWeekRows';
      const portfolioRow = Array.from(panel.querySelectorAll('.my-m360-row')).find(row => {
        const label = row.querySelector('span');
        return label && label.textContent.trim() === 'Portfolio';
      });
      Array.from(panel.querySelectorAll('.my-m360-row')).forEach(row => {
        if (row !== portfolioRow) row.style.display = 'none';
      });
      for (let n = 1; n <= week; n += 1) {
        const row = document.createElement('div');
        row.className = 'my-m360-row';
        row.innerHTML = `<span>Week ${n}</span><strong id="m360ConsistentWeek${n}Status">${n === week ? 'Draft' : 'Not Started'}</strong>`;
        rows.appendChild(row);
      }
      if (portfolioRow) panel.insertBefore(rows, portfolioRow);
      else panel.appendChild(rows);
    }

    try {
      if (window.M360Data) {
        const records = await M360Data.loadOwnWeekRecords();
        const byWeek = Object.fromEntries((records || []).map(record => [Number(record.week_number), record]));
        for (let n = 1; n <= week; n += 1) {
          const output = document.getElementById(`m360ConsistentWeek${n}Status`);
          if (output) output.textContent = recordStatus(byWeek[n]);
        }
      }
    } catch (error) {
      console.warn('M360 sidebar status refresh failed', error);
    }

    const currentSource = document.getElementById(`sidebarWeek${week}Status`);
    const currentOutput = document.getElementById(`m360ConsistentWeek${week}Status`);
    if (currentSource && currentOutput) {
      if (currentOutput.textContent === 'Not Started' && currentSource.textContent.trim()) currentOutput.textContent = currentSource.textContent.trim();
      if (!currentSource.dataset.m360StatusMirror) {
        currentSource.dataset.m360StatusMirror = 'true';
        new MutationObserver(() => {
          if (currentSource.textContent.trim()) currentOutput.textContent = currentSource.textContent.trim();
        }).observe(currentSource, { childList: true, subtree: true, characterData: true });
      }
    }
    return true;
  }

  function moveWeek6FinalFileField() {
    if (week !== 6) return false;
    const fileField = document.getElementById('slidesUrl')?.closest('.field');
    const slide3Field = document.getElementById('slide3Content')?.closest('.field');
    if (!fileField || !slide3Field || fileField.dataset.m360Moved === 'true') return Boolean(fileField && slide3Field);
    fileField.dataset.m360Moved = 'true';
    const label = fileField.querySelector('label');
    if (label) label.childNodes[0].textContent = 'Final Career Spotlight PDF or approved file/link ';
    slide3Field.insertAdjacentElement('afterend', fileField);
    return true;
  }

  function wireSamePageAnchors() {
    if (document.documentElement.dataset.m360AnchorFixWired === 'true') return;
    document.documentElement.dataset.m360AnchorFixWired = 'true';

    document.addEventListener('click', event => {
      const link = event.target && event.target.closest ? event.target.closest('a[href^="#"]') : null;
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      const id = decodeURIComponent(href.slice(1));
      const target = document.getElementById(id);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', `${location.pathname}${location.search}#${encodeURIComponent(id)}`);
    });
  }

  function polishWorkbookButtons() {
    document.querySelectorAll('.companion-card .btn').forEach(button => {
      button.style.textAlign = 'center';
      button.style.justifyContent = 'center';
    });
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

    makeBrandProgramsLink();
    ensureCurrentPortfolioDownload();
    moveWeek6FinalFileField();
    ensureConsistentSidebar();
    polishWorkbookButtons();

    if (nav || back || document.querySelector('.companion-card .btn') || document.querySelector('.my-m360')) return true;
    return false;
  }

  wireSamePageAnchors();

  if (!rewrite()) {
    const observer = new MutationObserver(() => {
      if (rewrite()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 15000);
  }
})();
