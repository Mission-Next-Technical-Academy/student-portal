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
  const workbookUrls = {
    1: 'https://drive.google.com/file/d/1mWZrh0Lq09JOoaiCSg8Bc0sm8nn7D6Wt/view?usp=drivesdk',
    2: 'https://drive.google.com/file/d/1NiO2TQJc5a9_Vq9AUODv8WT32JL82uIu/view?usp=drivesdk',
    3: 'https://drive.google.com/file/d/1xvaoUfIotqbXY04_cXZdaxFkv33mzwmn/view?usp=drivesdk',
    4: 'https://drive.google.com/file/d/15T6uaLW6pchasSjXqSIRB2kTDx-z8qIw/view?usp=drivesdk',
    5: 'https://drive.google.com/file/d/1nhzo1LFgXKQmR3xuhABd5-zxuOavOcr7/view?usp=drivesdk',
    6: 'https://drive.google.com/file/d/15bhDaGziLsitpOV-VPXKLIteDPTWMHGW/view?usp=drivesdk'
  };

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

  function setLabelLeadText(controlId, text) {
    const control = document.getElementById(controlId);
    const label = control?.closest('.field')?.querySelector('label');
    if (!label) return false;
    const textNode = Array.from(label.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
    if (textNode) textNode.textContent = `${text} `;
    else label.insertBefore(document.createTextNode(`${text} `), label.firstChild);
    return true;
  }

  function ensureFieldHelp(controlId, id, text) {
    const control = document.getElementById(controlId);
    const field = control?.closest('.field');
    if (!control || !field) return false;
    let help = document.getElementById(id);
    if (!help) {
      help = document.createElement('span');
      help.id = id;
      help.className = 'help';
      help.textContent = text;
      control.insertAdjacentElement('afterend', help);
    } else {
      help.textContent = text;
    }
    return true;
  }

  function applyWeek4Clarity() {
    if (week !== 4) return false;
    let changed = false;

    const keywordGrid = document.getElementById('keywordGrid');
    const keywordField = keywordGrid?.closest('.field');
    if (keywordGrid && keywordField && !document.getElementById('m360Week4SignalHelp')) {
      const help = document.createElement('p');
      help.id = 'm360Week4SignalHelp';
      help.className = 'help';
      help.textContent = 'Signals are repeated skills, tools, responsibilities, outcomes, and behaviors in the opportunity that tell you what the employer is emphasizing.';
      keywordField.insertBefore(help, keywordGrid);
      changed = true;
    }

    const resumeNote = document.querySelector('.resume-input-note');
    if (resumeNote) {
      const strong = resumeNote.querySelector('strong');
      const span = resumeNote.querySelector('span');
      if (strong) strong.textContent = 'Provide at least one durable copy of your resume: a link, pasted resume text, or both.';
      if (span) span.textContent = 'File upload is not required for this MVP workflow.';
      changed = true;
    }

    ['resumeLink', 'resumeText'].forEach((controlId, index) => {
      const field = document.getElementById(controlId)?.closest('.field');
      const badge = field?.querySelector('.optional-label');
      if (badge) badge.textContent = 'Conditional requirement';
      changed = ensureFieldHelp(
        controlId,
        `m360Week4ResumeRequirement${index + 1}`,
        'Required only if you are not using the other option.'
      ) || changed;
    });

    return changed;
  }

  function applyWeek5Clarity() {
    if (week !== 5) return false;
    let changed = false;

    const question1 = document.getElementById('interviewerQuestion1');
    const questionSection = question1?.closest('.workspace-section');
    const questionKicker = questionSection?.querySelector('.workspace-kicker');
    if (questionSection && questionKicker && !document.getElementById('m360Week5InterviewerHelp')) {
      const help = document.createElement('p');
      help.id = 'm360Week5InterviewerHelp';
      help.className = 'subtle';
      help.textContent = 'Write questions you would ask the interviewer about the role, team, work, expectations, or next steps.';
      questionKicker.insertAdjacentElement('afterend', help);
      changed = true;
    }

    changed = setLabelLeadText('interviewerQuestion1', 'Question you would ask the interviewer · 1') || changed;
    changed = setLabelLeadText('interviewerQuestion2', 'Question you would ask the interviewer · 2') || changed;
    changed = setLabelLeadText('interviewerQuestion3', 'Question you would ask the interviewer · 3') || changed;
    changed = setLabelLeadText('improvementSupport', 'What support would help you improve your next interview practice?') || changed;

    return changed;
  }

  function moveWeek6FinalFileField() {
    if (week !== 6) return false;
    const fileField = document.getElementById('slidesUrl')?.closest('.field');
    const slide3Field = document.getElementById('slide3Content')?.closest('.field');
    const slide3Plan = slide3Field?.closest('.slide-plan');
    if (!fileField || !slide3Plan) return false;

    if (fileField.dataset.m360Moved !== 'true') {
      fileField.dataset.m360Moved = 'true';
      setLabelLeadText('slidesUrl', 'Final Career Spotlight PDF or approved file/link');
      slide3Plan.insertAdjacentElement('afterend', fileField);
    }

    fileField.style.width = '100%';
    const input = document.getElementById('slidesUrl');
    if (input) input.style.width = '100%';
    ensureFieldHelp(
      'slidesUrl',
      'm360Week6FileHelp',
      'Paste the durable link to your three-slide Career Spotlight PDF or approved file. Confirm your instructor can open it.'
    );
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
    const workbookUrl = workbookUrls[week];
    document.querySelectorAll('.companion-card .btn').forEach(button => {
      button.style.textAlign = 'center';
      button.style.justifyContent = 'center';
    });
    if (!workbookUrl) return false;

    const workbookLinks = Array.from(document.querySelectorAll('a[href]')).filter(link => {
      const text = link.textContent.trim().toLowerCase();
      return text.includes('workbook') || Boolean(link.closest('.workbook-resource'));
    });
    workbookLinks.forEach(link => {
      link.href = workbookUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });
    return workbookLinks.length > 0;
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
    applyWeek4Clarity();
    applyWeek5Clarity();
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
