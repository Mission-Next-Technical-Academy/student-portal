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
      .status-badge.submitted,.m360-submitted-status{background:#e7f0fb!important;border-color:#8fb3d8!important;color:#123754!important;box-shadow:0 0 0 2px rgba(31,78,121,.06)}
      #m360WeekNavigation{justify-content:center;align-items:center;gap:12px;padding:8px 0 2px}
      #m360WeekNavigation .btn{display:inline-flex;align-items:center;justify-content:center;min-width:138px;text-align:center;line-height:1.2}
      .m360-model-note{margin:14px 0 0;padding:14px 16px;border-left:4px solid #f97316;background:#fff7ed;color:#123754;border-radius:12px;line-height:1.45}
      .m360-model-note strong{display:block;margin-bottom:4px;color:#123754}
      .m360-inline-example{display:block;margin-top:6px;color:#66717c;font-size:.93rem;line-height:1.35}
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

  function emphasizeSubmittedStatus() {
    document.querySelectorAll('.status-badge,.roadmap-state').forEach(status => {
      if (/^submitted\b/i.test(status.textContent.trim())) status.classList.add('m360-submitted-status');
    });
    const reviewLabel = document.getElementById('reviewStatusLabel');
    if (reviewLabel) reviewLabel.classList.toggle('m360-submitted-status', /^submitted\b/i.test(reviewLabel.textContent.trim()));
    return true;
  }

  function removeStudentAttendanceInternals() {
    document.querySelectorAll('#live .live-note,#live .start-callout').forEach(note => {
      const text = note.textContent.toLowerCase();
      if (text.includes('attendance') || text.includes('clock-hour') || text.includes('clock hour')) note.remove();
    });
    return true;
  }

  function setText(selector, text) {
    const el = document.querySelector(selector);
    if (!el) return false;
    el.textContent = text;
    return true;
  }

  function setHelpAfter(controlId, text) {
    const control = document.getElementById(controlId);
    if (!control) return false;
    const field = control.closest('.field') || control.parentElement;
    if (!field) return false;
    let help = field.querySelector('.help');
    if (!help) {
      help = document.createElement('span');
      help.className = 'help';
      field.appendChild(help);
    }
    help.textContent = text;
    return true;
  }

  function appendExample(controlId, text) {
    const control = document.getElementById(controlId);
    if (!control || control.dataset.exampleAdded === 'true') return false;
    const field = control.closest('.field') || control.parentElement;
    if (!field) return false;
    const example = document.createElement('span');
    example.className = 'm360-inline-example';
    example.textContent = text;
    field.appendChild(example);
    control.dataset.exampleAdded = 'true';
    return true;
  }

  function renameWorkspaceByKicker(kickerText, newKicker, newHeading) {
    const sections = Array.from(document.querySelectorAll('.workspace-section'));
    const section = sections.find(item => (item.querySelector('.workspace-kicker')?.textContent || '').includes(kickerText));
    if (!section) return false;
    const kicker = section.querySelector('.workspace-kicker');
    if (kicker) kicker.textContent = newKicker;
    const h3 = section.querySelector('h3');
    if (h3 && newHeading) h3.textContent = newHeading;
    return true;
  }

  function applyWeek2LinkedInModel() {
    if (week !== 2) return true;

    setText('#brief .learning-item:nth-child(2) strong', 'Role language');
    setText('#brief .learning-item:nth-child(2) span', 'Use accurate job-title, skill, tool, responsibility, and certification language that your evidence can support.');
    setText('#brief .learning-item:nth-child(4) strong', 'Review');
    setText('#brief .learning-item:nth-child(4) span', 'Check whether a visitor can understand your direction, see proof, and spot what you are building toward.');

    renameWorkspaceByKicker('Profile + direction', '01 · Carry-forward + Week 2 direction', null);
    setText('label[for="targetDirection"]', 'Week 2 direction statement');
    setHelpAfter('targetDirection', 'Use the accepted Week 1 direction as context, then write the direction you want this profile to signal now. This creates new Week 2 evidence; it does not change Week 1.');
    appendExample('targetDirection', 'Example: “IT help desk and desktop support roles where troubleshooting, user communication, documentation, and escalation judgment matter.”');

    renameWorkspaceByKicker('Search keywords', '02 · Target-role language', 'Pull 5–8 terms from roles you would actually pursue.');
    document.querySelectorAll('#keywordFields label').forEach(label => {
      label.innerHTML = label.innerHTML.replace('Search keyword', 'Role language term');
    });
    const keywordHelp = Array.from(document.querySelectorAll('.workspace-section .help'))
      .find(item => item.textContent.includes('Keywords 1–5'));
    if (keywordHelp) keywordHelp.textContent = 'Terms 1–5 are required. Terms 6–8 are optional. Use job titles, tools, skills, responsibilities, certifications, and recurring phrases from realistic roles.';

    setText('label[for="headline"]', 'Final professional headline');
    setHelpAfter('headline', 'Make the target direction clear in one line. Prioritize searchable role language and supportable capability over generic labels.');

    setText('label[for="about"]', 'Final About section');
    setHelpAfter('about', 'Suggested flow: where you are headed, what you bring, proof you can support, and what you are building toward.');

    renameWorkspaceByKicker('Skills + discoverability', '06 · Skills + credibility check', 'Confirm 5–10 supportable skills that match the profile story.');
    const skillsHelp = Array.from(document.querySelectorAll('.workspace-section .help'))
      .find(item => item.textContent.includes('Skills 1–5'));
    if (skillsHelp) skillsHelp.textContent = 'Skills 1–5 are required. Skills 6–8 are optional. Keep terms you can support through experience, training, projects, labs, or coursework.';

    renameWorkspaceByKicker('Profile review', '07 · Profile check', null);
    const reviewSection = Array.from(document.querySelectorAll('.workspace-section'))
      .find(item => (item.querySelector('.workspace-kicker')?.textContent || '').includes('Profile check'));
    if (reviewSection && !reviewSection.querySelector('.m360-model-note')) {
      const note = document.createElement('div');
      note.className = 'm360-model-note';
      note.innerHTML = '<strong>Quick outside-reader test</strong>Can someone tell what you are targeting in 10 seconds, see proof that supports it, and understand what should happen next?';
      const checks = reviewSection.querySelector('.review-checks');
      if (checks) reviewSection.insertBefore(note, checks);
    }

    renameWorkspaceByKicker('Final reflection', '08 · Before-to-after summary', null);
    setText('label[for="reflectionStrongest"]', 'Strongest profile improvement');
    appendExample('reflectionStrongest', 'Example: “My headline now names IT support instead of using broad transition language.”');
    setText('label[for="reflectionNeedsWork"]', 'One change I still want to make');
    appendExample('reflectionNeedsWork', 'Example: “I still want to strengthen my About section once I have more Help Desk lab evidence.”');
    setText('label[for="reflectionSupport"]', 'Support that would help me make that change');
    appendExample('reflectionSupport', 'Example: “A quick review of whether my About section sounds specific enough.”');

    document.querySelectorAll('.lesson-card .lesson-tag').forEach(tag => {
      if (tag.textContent.trim() === 'Keywords + privacy') tag.textContent = 'Role language + privacy';
    });
    return Boolean(document.getElementById('targetDirection'));
  }

  function sweepStudentFacingPromptLanguage() {
    const replacements = new Map([
      ['What feedback or support would help next?', 'What support would help you take the next step?'],
      ['What feedback would help next?', 'What support would help you take the next step?'],
      ['What support would help you improve your next interview practice?', 'What support would help you improve your next interview practice?'],
      ['Search keywords', 'Target-role language'],
      ['search keywords', 'target-role language']
    ]);
    document.querySelectorAll('label,h2,h3,p,span,small,li,summary,div').forEach(el => {
      if (el.children.length) return;
      let text = el.textContent;
      let changed = false;
      replacements.forEach((to, from) => {
        if (text.includes(from)) {
          text = text.split(from).join(to);
          changed = true;
        }
      });
      if (changed) el.textContent = text;
    });
    return true;
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
    emphasizeSubmittedStatus();
    removeStudentAttendanceInternals();
    sweepStudentFacingPromptLanguage();
    const week2Ready = applyWeek2LinkedInModel();
    const templateReady = week !== 6 || fixCareerSpotlightTemplateLinks();
    return navReady && week2Ready && templateReady && (statusReady || Boolean(document.querySelector('.artifact-heading')));
  }

  if (!apply()) {
    const observer = new MutationObserver(() => {
      if (apply()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 15000);
  }
})();
