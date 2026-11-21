/* SOC Analyst Instructor Guide tab (Course Dashboard, SOCAN only).
 *
 * This file is only the renderer. The guide itself (session scripts, module
 * answer keys, grading steps, capstone rubric) is never shipped with the
 * portal: it is read after sign-in from public.instructor_guides, whose RLS
 * lets only admins and assigned SOCAN instructors read it
 * (supabase/migrations/20261119202617_instructor_guides.sql). A student or a
 * signed-out visitor gets no row, so this file shows "not available".
 *
 * app.js calls SocInstructorGuide.panel() for the tab panel markup and
 * SocInstructorGuide.mount() when the tab is shown.
 */
const SocInstructorGuide = (() => {
  'use strict';

  const TRACK = 'SOCAN';
  const state = { status: 'idle', guide: null, view: 'start', week: 1, module: 'M01', error: '' };
  // Bumped by reset(), so a read that lands after sign-out is dropped.
  let generation = 0;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Guide text may mark `identifiers` and **bold** words; everything is escaped first.
  const fmt = (value) => esc(value)
    .replace(/`([^`]+)`/g, '<code class="font-mono text-[0.9em] text-[#1e3a5f] bg-[#1e3a5f]/8 px-1 rounded">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  const list = (items, cls = '') => `<ul class="list-disc pl-5 space-y-1.5 marker:text-[#f97316] ${cls}">${(items || []).map((i) => `<li>${fmt(i)}</li>`).join('')}</ul>`;
  const eyebrow = (text, cls = 'text-[#f97316]') => `<p class="${cls} text-xs font-semibold uppercase tracking-widest">${esc(text)}</p>`;
  const card = (inner, cls = '') => `<div class="bg-white border border-gray-200 rounded-2xl shadow-sm p-7 ${cls}">${inner}</div>`;
  const kv = (rows) => `<dl class="grid grid-cols-1 sm:grid-cols-[minmax(9rem,14rem)_1fr] border border-gray-200 rounded-xl overflow-hidden text-sm">${(rows || []).map(([k, v]) => `<dt class="bg-gray-50 px-4 py-2.5 font-semibold text-[#1e3a5f] border-b border-gray-100">${esc(k)}</dt><dd class="px-4 py-2.5 text-gray-700 border-b border-gray-100">${fmt(v)}</dd>`).join('')}</dl>`;
  const heading = (title, lede) => `<div class="mb-6"><h2 class="text-2xl font-bold text-[#1e3a5f] mb-2">${esc(title)}</h2><div class="w-12 h-1 bg-[#f97316] rounded-full mb-3"></div>${lede ? `<p class="text-gray-600 max-w-3xl">${fmt(lede)}</p>` : ''}</div>`;
  const pill = (text, cls = 'bg-[#1e3a5f]/8 text-[#1e3a5f]') => `<span class="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${cls}">${esc(text)}</span>`;

  const VIEWS = [['start', 'Start here'], ['weeks', 'Weeks'], ['modules', 'Modules'], ['grading', 'Grading'], ['rubric', 'Capstone rubric']];

  function subnav() {
    return `<div class="flex flex-wrap gap-2 mb-6" role="group" aria-label="Instructor guide sections">${VIEWS.map(([key, label]) => {
      const on = state.view === key;
      return `<button type="button" data-soc-guide-view="${key}" aria-pressed="${on}" class="text-sm font-semibold px-4 py-2 rounded-xl border transition-colors ${on ? 'bg-[#1e3a5f] border-[#1e3a5f] text-white' : 'bg-white border-gray-200 text-[#1e3a5f] hover:bg-[#1e3a5f]/8'}">${esc(label)}</button>`;
    }).join('')}</div>`;
  }

  function viewStart(g) {
    const s = g.start || {};
    return `${heading('Start here', s.intro)}
    <div class="flex flex-col gap-6">
      ${card(`<h3 class="font-bold text-[#1e3a5f] mb-4">Every class, do these five things</h3><ol class="space-y-3">${(s.steps || []).map((step, i) => `<li class="flex gap-3"><span class="shrink-0 w-8 h-8 rounded-xl bg-[#1e3a5f]/8 text-[#1e3a5f] font-bold flex items-center justify-center text-sm">${i + 1}</span><span class="text-gray-700 pt-1">${fmt(step)}</span></li>`).join('')}</ol>`)}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        ${card(`${eyebrow('The course')}<div class="mt-3">${kv(s.course)}</div>`)}
        ${card(`${eyebrow('How every module works')}<div class="mt-3">${kv(s.modes)}</div>${s.chain ? `<p class="mt-4 text-xs font-semibold uppercase tracking-widest text-[#f97316]">The analyst chain, said every class</p><div class="flex flex-wrap items-center gap-2 mt-2">${s.chain.map((w) => `<span class="text-sm font-semibold text-[#1e3a5f] bg-[#1e3a5f]/8 px-3 py-1 rounded-full">${esc(w)}</span>`).join('<span class="text-[#f97316]">→</span>')}</div>` : ''}`)}
      </div>
      ${s.dueRule ? card(`<h3 class="font-bold text-[#1e3a5f] mb-2">The one rule for due dates</h3><p class="text-gray-700">${fmt(s.dueRule)}</p>`) : ''}
      ${s.handover ? card(`<h3 class="font-bold text-[#1e3a5f] mb-3">Hand over the thinking as the weeks go by</h3>${kv(s.handover)}`) : ''}
      ${s.behind ? card(`<h3 class="font-bold text-[#1e3a5f] mb-2">Students falling behind</h3><p class="text-gray-700 mb-2">${fmt(s.behind.intro)}</p>${list(s.behind.list, 'text-gray-700')}${s.behind.example ? `<p class="mt-3 border-l-4 border-[#f97316] pl-3 text-gray-700">${fmt(s.behind.example)}</p>` : ''}`) : ''}
      ${s.openQuestions ? card(`<h3 class="font-bold text-[#1e3a5f] mb-2">Open questions for the program owner</h3>${list(s.openQuestions, 'text-gray-700')}`) : ''}
    </div>`;
  }

  function dayCard(week, day) {
    const late = week.n >= 4;
    const rows = [
      ['0–5', 'Open', esc('Take attendance. Read the opening line. State today\'s skill and what is due next.')],
      ['5–15', 'Review', fmt(day.review)],
      [late ? '15–25' : '15–35', 'Teach', list(day.teach)],
      [late ? '25–50' : '35–50', 'Students drive', `${fmt(day.drive)} Keep asking: <em>“What's your evidence?”</em>`],
      ['50–60', 'Close', `<strong>Exit question:</strong> ${fmt(day.exit)}<br><strong>Assign:</strong> ${fmt(day.assign)}`],
    ];
    return card(`
      ${eyebrow(`${day.d} · Week ${week.n} · ${day.mod}`)}
      <h3 class="text-lg font-bold text-[#1e3a5f] mt-1 mb-4">${esc(day.title)}</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div class="bg-gray-50 border border-gray-100 rounded-xl p-4">${eyebrow("Today's skill")}<p class="text-gray-700 mt-1">${fmt(day.skill)}</p></div>
        <div class="bg-gray-50 border border-gray-100 rounded-xl p-4">${eyebrow('Why it matters on the job')}<p class="text-gray-700 mt-1">${fmt(day.why)}</p></div>
      </div>
      <p class="border-l-4 border-[#f97316] pl-3 italic text-[#1e3a5f] mb-4">${fmt(day.say)}</p>
      <div class="border border-gray-200 rounded-xl overflow-hidden text-sm">${rows.map(([t, label, body]) => `<div class="grid grid-cols-1 sm:grid-cols-[8rem_1fr] border-b border-gray-100 last:border-b-0"><div class="bg-gray-50 px-4 py-3"><span class="font-bold text-[#1e3a5f] tabular-nums">${t}</span><span class="block text-[11px] font-semibold uppercase tracking-wider text-[#f97316]">${label}</span></div><div class="px-4 py-3 text-gray-700">${body}</div></div>`).join('')}</div>`);
  }

  function viewWeeks(g) {
    const weeks = g.weeks || [];
    const week = weeks.find((w) => w.n === state.week) || weeks[0];
    if (!week) return heading('Weeks', 'No weeks in this guide yet.');
    const modules = g.modules || {};
    return `${heading('Weeks', 'Pick a week. Each day is one 60-minute class: what to say, what to teach, and why it matters on the job.')}
    <div class="flex flex-wrap gap-2 mb-6" role="group" aria-label="Week">${weeks.map((w) => {
      const on = w.n === week.n;
      return `<button type="button" data-soc-guide-week="${w.n}" aria-pressed="${on}" class="text-sm font-semibold px-4 py-2 rounded-xl border transition-colors ${on ? 'bg-[#f97316] border-[#f97316] text-white' : 'bg-white border-gray-200 text-[#1e3a5f] hover:bg-[#1e3a5f]/8'}">Week ${w.n} <span class="font-medium ${on ? 'text-white/80' : 'text-gray-500'}">${esc((w.mods || []).join(' · '))}</span></button>`;
    }).join('')}</div>
    <div class="flex flex-wrap gap-2 mb-3">${pill((week.mods || []).map((m) => `${m} ${modules[m] ? modules[m].name : ''}`).join(' · '), 'bg-[#f97316]/10 text-[#f97316]')}${pill(`≈ ${week.hours} h portal work`)}</div>
    <h3 class="text-2xl font-bold text-[#1e3a5f] mb-2">Week ${week.n}: ${esc(week.title)}</h3>
    <p class="text-gray-600 mb-6 max-w-3xl">${fmt(week.goal)}</p>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-start">
      <div class="rounded-2xl p-7 text-white" style="background: linear-gradient(150deg, #0c1e32 0%, #1e3a5f 50%, #162d4a 100%);">
        <span class="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full border border-white/15 mb-4"><span class="w-1.5 h-1.5 rounded-full bg-[#f97316]"></span>Monday · Tell your students</span>
        <ul class="list-disc pl-5 space-y-2 marker:text-[#f97316] text-white">${(week.tell || []).map((t) => `<li class="text-white">${fmt(t)}</li>`).join('')}</ul>
      </div>
      ${card(`${eyebrow('Due this week')}<ul class="mt-2 divide-y divide-gray-100">${(week.due || []).map(([lab, when]) => `<li class="py-2.5 flex flex-wrap items-baseline justify-between gap-x-3"><span class="font-semibold text-[#1e3a5f]">${fmt(lab)}</span><span class="text-sm font-semibold text-[#f97316] whitespace-nowrap">${esc(when)}</span></li>`).join('')}</ul>`)}
    </div>
    ${week.n >= 4 ? '<p class="text-gray-600 mb-6">From Week 4, teach for 10 minutes and give the extra 10 to students driving.</p>' : ''}
    <div class="flex flex-col gap-6">${(week.days || []).map((d) => dayCard(week, d)).join('')}</div>
    ${card(`<details><summary class="font-bold text-[#1e3a5f] cursor-pointer">Mistakes to watch for this week</summary><div class="mt-3">${list(week.watch, 'text-gray-700')}</div></details>`, 'mt-6')}`;
  }

  function proveBlock(p) {
    return `<section class="border-t border-gray-100 pt-6 mt-6 flex flex-col gap-4">
      <div>${eyebrow('Prove It')}<h4 class="text-lg font-bold text-[#1e3a5f] mt-1">${esc(p.title)}</h4>${p.ids ? `<p class="font-mono text-xs text-gray-500 mt-1">${esc(p.ids)}</p>` : ''}</div>
      ${p.scenario ? `<p class="text-gray-700">${fmt(p.scenario)}</p>` : ''}
      ${p.scored ? `<p class="text-sm text-gray-500"><strong>Score comes from:</strong> ${fmt(p.scored)}</p>` : ''}
      ${p.right ? `<div>${eyebrow('What right looks like')}<div class="mt-2">${kv(p.right)}</div></div>` : ''}
      ${p.note && p.note.length ? `<div>${eyebrow('The written note must name')}<ul class="mt-2 space-y-1.5">${p.note.map((n) => `<li class="flex gap-2 text-gray-700"><span class="text-green-700 font-bold">✓</span><span>${fmt(n)}</span></li>`).join('')}</ul></div>` : ''}
      ${p.points ? `<div>${eyebrow('Points · pass at 70')}<div class="flex flex-wrap gap-1.5 mt-2">${p.points.map(([k, v]) => `<span class="text-sm bg-[#1e3a5f]/8 text-gray-700 px-3 py-1 rounded-full">${esc(k)} <strong class="text-[#1e3a5f]">${esc(v)}</strong></span>`).join('')}</div></div>` : ''}
      ${p.fail && p.fail.length ? `<div class="bg-red-50 border border-red-100 rounded-xl p-4">${eyebrow('Automatic return', 'text-red-700')}<div class="mt-2">${list(p.fail, 'text-gray-700')}</div></div>` : ''}
      ${p.mistakes && p.mistakes.length ? `<div class="bg-orange-50 border border-orange-100 rounded-xl p-4">${eyebrow('Common mistakes')}<div class="mt-2">${list(p.mistakes, 'text-gray-700')}</div></div>` : ''}
    </section>`;
  }

  function viewModules(g) {
    const modules = g.modules || {};
    const keys = Object.keys(modules);
    const key = modules[state.module] ? state.module : keys[0];
    const m = modules[key];
    if (!m) return heading('Modules', 'No modules in this guide yet.');
    const week = (g.weeks || []).find((w) => (w.mods || []).includes(key));
    return `${heading('Modules', 'Pick a module to see what it teaches and what a passing Prove It looks like. Use it to grade and to answer “am I on the right track?”')}
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6" role="group" aria-label="Module">${keys.map((k) => {
      const on = k === key;
      return `<button type="button" data-soc-guide-module="${esc(k)}" aria-pressed="${on}" class="text-left bg-white border rounded-xl px-3 py-2.5 shadow-sm transition-colors ${on ? 'border-[#f97316] ring-1 ring-[#f97316]' : 'border-gray-200 hover:bg-[#1e3a5f]/8'}"><span class="block font-bold ${on ? 'text-[#f97316]' : 'text-[#1e3a5f]'}">${esc(k)}</span><span class="block text-xs text-gray-500 leading-snug">${esc(modules[k].name)}</span></button>`;
    }).join('')}</div>
    ${card(`
      <div class="flex flex-wrap gap-2 mb-3">${pill(key, 'bg-[#f97316]/10 text-[#f97316]')}${week ? pill(`Week ${week.n}`) : ''}${m.hours ? pill(`≈ ${m.hours} h`) : ''}</div>
      <h3 class="text-2xl font-bold text-[#1e3a5f] mb-2">${esc(m.name)}</h3>
      <p class="text-gray-600 mb-5">${fmt(m.plain)}</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>${eyebrow('Learn It')}<div class="mt-2">${list(m.learn, 'text-gray-700')}</div></div>
        <div>${eyebrow('Practice It')}<div class="mt-2">${list(m.practice, 'text-gray-700')}</div></div>
      </div>
      ${(m.prove || []).map(proveBlock).join('')}`)}`;
  }

  function viewGrading(g) {
    const gr = g.grading || {};
    return `${heading('Grading', gr.intro)}
    <div class="flex flex-col gap-6">
      ${card(`<h3 class="font-bold text-[#1e3a5f] mb-4">Grade one submission in about 5 minutes</h3><ol class="space-y-3">${(gr.steps || []).map((step, i) => `<li class="flex gap-3"><span class="shrink-0 w-8 h-8 rounded-xl bg-[#1e3a5f]/8 text-[#1e3a5f] font-bold flex items-center justify-center text-sm">${i + 1}</span><span class="text-gray-700 pt-1">${fmt(step)}</span></li>`).join('')}</ol>${gr.banner ? `<div class="mt-4">${kv(gr.banner)}</div>` : ''}`)}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        ${card(`<h3 class="font-bold text-[#1e3a5f] mb-3">How the portal scores</h3>${list(gr.scoring, 'text-gray-700')}`)}
        ${card(`<h3 class="font-bold text-[#1e3a5f] mb-3">When to overrule the portal</h3>${list(gr.overrule, 'text-gray-700')}`)}
      </div>
      ${gr.dashboard ? card(`<h3 class="font-bold text-[#1e3a5f] mb-3">Your Course Dashboard</h3>${kv(gr.dashboard)}`) : ''}
    </div>`;
  }

  function viewRubric(g) {
    const rubric = g.rubric || [];
    return `${heading('Capstone rubric', g.rubricIntro)}
    <div class="flex flex-col gap-6">
      ${card(`<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left text-xs uppercase tracking-wider text-gray-500"><th class="py-2 pr-4">Area</th><th class="py-2 pr-4 text-right">Points</th><th class="py-2">How the points are earned</th></tr></thead><tbody>${rubric.map(([area, pts, how]) => `<tr class="border-t border-gray-100 align-top"><td class="py-3 pr-4 font-semibold text-[#1e3a5f]">${esc(area)}</td><td class="py-3 pr-4 text-right tabular-nums font-bold text-[#1e3a5f]">${esc(pts)}</td><td class="py-3">${list(how, 'text-gray-700')}</td></tr>`).join('')}<tr class="border-t border-gray-200"><td class="py-3 font-bold text-[#1e3a5f]">Total</td><td class="py-3 pr-4 text-right font-bold text-[#1e3a5f] tabular-nums">${rubric.reduce((n, r) => n + Number(r[1] || 0), 0)}</td><td></td></tr></tbody></table></div>`)}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        ${g.rubricBands ? card(`<h3 class="font-bold text-[#1e3a5f] mb-3">Score bands</h3>${kv(g.rubricBands)}`) : ''}
        ${card(`<h3 class="font-bold text-[#1e3a5f] mb-3">Rules that change the score</h3>${list(g.rubricRules, 'text-gray-700')}`)}
      </div>
      ${g.safetyCap ? `<div class="bg-red-50 border border-red-100 rounded-2xl p-6">${eyebrow('Safety cap: score stops at 69', 'text-red-700')}<div class="mt-2">${list(g.safetyCap, 'text-gray-700')}</div></div>` : ''}
    </div>`;
  }

  function body() {
    if (state.status === 'loading' || state.status === 'idle') {
      return `<p class="text-gray-500 text-sm"><i class="ri-loader-4-line animate-spin" aria-hidden="true"></i> Loading the instructor guide…</p>`;
    }
    if (state.status === 'missing') {
      return card(`<h3 class="font-bold text-[#1e3a5f] mb-2">The instructor guide is not available</h3><p class="text-gray-600 text-sm">It is shown only to administrators and instructors assigned to this course, and it has not been loaded for your account. Ask the program owner.</p>`);
    }
    if (state.status === 'error') {
      return card(`<h3 class="font-bold text-[#1e3a5f] mb-2">The instructor guide could not load</h3><p class="text-gray-600 text-sm mb-4">${esc(state.error || 'Check your connection and try again.')}</p><button type="button" data-soc-guide-retry class="text-sm font-semibold px-4 py-2 rounded-xl border border-[#1e3a5f]/20 text-[#1e3a5f] hover:bg-[#1e3a5f]/8">Try again</button>`);
    }
    const g = state.guide || {};
    const views = { start: viewStart, weeks: viewWeeks, modules: viewModules, grading: viewGrading, rubric: viewRubric };
    return `${subnav()}${(views[state.view] || viewStart)(g)}`;
  }

  function paint(root) {
    if (root) root.innerHTML = body();
  }

  async function load(root) {
    const mine = generation;
    state.status = 'loading';
    paint(root);
    try {
      const client = typeof mntSupabase !== 'undefined' ? mntSupabase : null;
      if (!client) throw new Error('The portal is not connected.');
      const { data, error } = await client.from('instructor_guides').select('content').eq('track_code', TRACK).maybeSingle();
      if (mine !== generation) return;
      if (error) throw error;
      if (!data || !data.content) { state.status = 'missing'; }
      else { state.guide = data.content; state.status = 'ready'; }
    } catch (err) {
      if (mine !== generation) return;
      state.status = 'error';
      state.error = 'The guide could not be read. Try again in a moment.';
    }
    paint(document.querySelector('[data-soc-guide-root]') || root);
  }

  // Sign-out: forget the guide (it holds answer keys) and any read in flight,
  // so the next person on this browser starts from nothing.
  function socInstructorGuideReset() {
    generation += 1;
    Object.assign(state, { status: 'idle', guide: null, view: 'start', week: 1, module: 'M01', error: '' });
  }

  function socInstructorGuidePanel() {
    return `<div data-soc-guide-root class="pb-4">${body()}</div>`;
  }

  function socInstructorGuideMount() {
    const root = document.querySelector('[data-soc-guide-root]');
    if (!root) return;
    if (state.status === 'ready' || state.status === 'loading') { paint(root); return; }
    load(root);
  }

  if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('click', (event) => {
    const target = event.target && event.target.closest ? event.target.closest('[data-soc-guide-view],[data-soc-guide-week],[data-soc-guide-module],[data-soc-guide-retry]') : null;
    if (!target) return;
    const root = target.closest('[data-soc-guide-root]');
    if (!root) return;
    if (target.hasAttribute('data-soc-guide-retry')) { load(root); return; }
    if (target.dataset.socGuideView) state.view = target.dataset.socGuideView;
    if (target.dataset.socGuideWeek) { state.view = 'weeks'; state.week = Number(target.dataset.socGuideWeek); }
    if (target.dataset.socGuideModule) { state.view = 'modules'; state.module = target.dataset.socGuideModule; }
    paint(root);
    root.scrollIntoView({ block: 'start' });
  });

  // Every other way a session ends also clears the guide: the portal dropping
  // a session it no longer accepts (discardLocalSession), a sign-out in another
  // tab, or an expired login. All of these send SIGNED_OUT. Same pattern as
  // itswWatchSignOut() in it-support-shared.js.
  if (typeof mntSupabase !== 'undefined' && mntSupabase.auth && typeof mntSupabase.auth.onAuthStateChange === 'function') {
    mntSupabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'SIGNED_OUT' && !(event === 'INITIAL_SESSION' && !session)) return;
      socInstructorGuideReset();
      const root = typeof document !== 'undefined' && document.querySelector ? document.querySelector('[data-soc-guide-root]') : null;
      if (root) root.innerHTML = '';
    });
  }

  return { track: TRACK, panel: socInstructorGuidePanel, mount: socInstructorGuideMount, reset: socInstructorGuideReset, _state: state };
})();
