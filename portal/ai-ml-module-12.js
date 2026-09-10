/* Module 12 — AI & Machine Learning Capstone.
 * Content authored from AI_ML_ENGINEERING_CURRICULUM.md (2026-09-10).
 * Not a quiz — a single realistic, multi-stage project spanning the full
 * CRISP-DM lifecycle. Students work in their own Python environment on a
 * real or instructor-provided dataset. Completion is tracked per stage as
 * a checkbox (done/not-done) plus a written reflection (evidence-based,
 * like it-support-module-01.js's Lab 1.1).
 */

const AIM12_LESSONS = [
  {
    id: 'aim12-lesson-01', number: '12.1', icon: 'ri-compass-discovery-line',
    title: 'Scenario Orientation & Rules of Engagement', minutes: 15,
    learn: [
      'Scope your own realistic business problem from initial decision through a complete CRISP-DM workflow',
      'Work independently in your Python environment on a public or instructor-approved dataset',
      'Understand the capstone is a portfolio project, not a quiz with a single correct answer',
    ],
    topics: [
      { heading: 'Scope the Business Problem', body: 'Choose or receive a realistic decision-making scenario: reduce customer churn, predict equipment failures, identify fraud patterns, recommend products, or forecast demand. Define the target variable, success metric, and stakeholder context. The capstone succeeds when your model answers that business question rigorously.' },
      { heading: 'Work in Your Environment', body: 'This capstone has no in-portal sandbox. You will code, train, and validate models in your own Jupyter notebook or Python scripts, using your own or a public dataset. Document every transformation and validation decision as you go.' },
    ],
    practice: [
      'Write a one-sentence problem statement that identifies the decision, target, and success metric.',
      'List three realistic datasets (Kaggle, UCI ML Repository, or internal) you could use and why.',
    ],
    comingUp: 'You will work through eight stages from problem scoping through model deployment and a final presentation.',
  },
  {
    id: 'aim12-lesson-02', number: '12.2', icon: 'ri-tools-line',
    title: 'Available Tools & Datasets', minutes: 12,
    learn: [
      'Where to find public datasets and how to evaluate them for your chosen problem',
      'How to structure your capstone code repository with separate modules for data, training, and inference',
      'What a model card is and why it matters for transparency and risk management',
    ],
    topics: [
      { heading: 'Public Data Sources', body: 'Kaggle Datasets, UCI Machine Learning Repository, Google Dataset Search, and domain-specific repositories (e.g., healthcare, finance) all offer real or realistic datasets. Evaluate size, quality, licensing, and relevance to your problem before committing to a dataset.' },
      { heading: 'Repository Structure', body: 'Organize your work into a git repository with a README, a data/ folder, a scripts/ folder for training and evaluation, a models/ folder for saved models, and a notebooks/ folder for exploratory analysis. This structure makes your work reproducible and portfolio-ready.' },
    ],
    practice: [
      'Clone or fork a public repository that contains data pipeline + model training code; review its structure.',
      'Create a requirements.txt for your capstone environment with scikit-learn, pandas, and at least one visualization library.',
    ],
    comingUp: 'Stages 2–7 will produce code, notebooks, and trained artifacts that belong in this repository.',
  },
  {
    id: 'aim12-lesson-03', number: '12.3', icon: 'ri-file-list-line',
    title: 'Documentation & Model Card Expectations', minutes: 14,
    learn: [
      'How to write a technical project report that documents every CRISP-DM stage',
      'The structure and purpose of a model card (Module 11 review)',
      'How to communicate model limitations, failure modes, and intended use to non-technical stakeholders',
    ],
    topics: [
      { heading: 'Project Report Format', body: 'Your report follows the eight capstone stages: problem statement (Stage 1), data description and cleaning steps (Stages 2–3), feature engineering justification (Stage 4), model comparison (Stage 5–6), deployment plan (Stage 7), and responsible-AI review (Stage 8). Treat it as a technical memo for other data scientists who might inherit the code.' },
      { heading: 'Model Card Purpose', body: 'The model card (Stage 8 deliverable) is a one-page artifact that communicates: model purpose, data summary, performance metrics (overall and by subgroup if applicable), known limitations, failure modes, and intended/out-of-scope use cases. It bridges technical and non-technical audiences.' },
    ],
    practice: [
      'Review a published model card (e.g., from Google or Hugging Face); list the five most important details it contains.',
      'Sketch a one-paragraph model card section for your capstone problem (you will fill it in during Stage 8).',
    ],
    comingUp: 'Stage 8 will require you to draft a model card and deliver a 10–15 minute presentation.',
  },
  {
    id: 'aim12-lesson-04', number: '12.4', icon: 'ri-presentation-line',
    title: 'Presentation Format & Rubric', minutes: 13,
    learn: [
      'How to structure a technical presentation for a mixed audience (engineers, managers, non-technical stakeholders)',
      'The capstone rubric: eight stages, each scored for completeness and rigor',
      'How to defend your model choices and limitations under questions',
    ],
    topics: [
      { heading: 'Audience and Duration', body: 'Your presentation will be 10–15 minutes, delivered to classmates and instructors with varying technical depth. Spend half the time on the business problem and outcomes, and half on technical rigor: data quality, model selection, validation approach, and limitations. Avoid assuming advanced statistics knowledge.' },
      { heading: 'Rubric Scoring', body: 'Each of the eight stages is evaluated for evidence, rigor, and clarity: Stage 1 (problem framed), Stage 2 (data quality documented), Stage 3 (signals identified), Stage 4 (features justified), Stage 5 (models compared fairly), Stage 6 (metrics appropriate), Stage 7 (deployment feasible), Stage 8 (responsible AI addressed). Passing the capstone requires all eight to be substantially complete.' },
    ],
    practice: [
      'Record yourself explaining your problem statement and top three features in 3 minutes; review for clarity.',
      'List five questions a non-technical stakeholder might ask your model, and how you would answer them.',
    ],
    comingUp: 'Submit your work after completing all eight stages and recording or preparing your presentation.',
  },
];

const AIM12_STAGES = [
  {
    id: 'aim12-stage-01', number: '1', title: 'Business Understanding',
    description: 'Write a one-page problem statement: the decision the model needs to support, the target variable, and the success metric.',
  },
  {
    id: 'aim12-stage-02', number: '2', title: 'Data Acquisition & Cleaning',
    description: 'Acquire the dataset; clean and document every transformation, as in Module 03.',
  },
  {
    id: 'aim12-stage-03', number: '3', title: 'Exploratory Data Analysis',
    description: 'Profile the dataset and produce a short EDA brief identifying the strongest signals and data-quality caveats, as in Module 04.',
  },
  {
    id: 'aim12-stage-04', number: '4', title: 'Feature Engineering',
    description: 'Engineer and justify at least three features beyond the raw columns, as in Module 06.',
  },
  {
    id: 'aim12-stage-05', number: '5', title: 'Modeling',
    description: 'Train at least two model types (e.g., a linear/logistic baseline and an ensemble or neural network), using cross-validation.',
  },
  {
    id: 'aim12-stage-06', number: '6', title: 'Evaluation & Selection',
    description: 'Select a final model using metrics appropriate to the problem (not just accuracy), and justify the choice in writing, as in Module 07.',
  },
  {
    id: 'aim12-stage-07', number: '7', title: 'Deployment & Monitoring Plan',
    description: 'Package the chosen model behind a minimal served endpoint and write a monitoring/drift plan, as in Module 10.',
  },
  {
    id: 'aim12-stage-08', number: '8', title: 'Responsible AI Review & Presentation',
    description: 'Produce a model card (purpose, data, performance by subgroup where feasible, limitations, intended/out-of-scope use) and deliver a final presentation to a mixed audience, as in Module 11.',
  },
];

const AIM12_SOURCES = [
  { title: 'CRISP-DM methodology overview', org: 'Data Science PM', url: 'https://www.datascience-pm.com/crisp-dm-2/', note: 'The lifecycle the eight capstone stages implement end to end.' },
  { title: 'NIST AI Risk Management Framework', org: 'NIST', url: 'https://www.nist.gov/itl/ai-risk-management-framework', note: 'Reference for the Stage 8 responsible-AI review.' },
  { title: 'scikit-learn documentation', org: 'scikit-learn', url: 'https://scikit-learn.org/stable/', note: 'Primary modeling reference, consistent with earlier modules.' },
];

const AIM12_LAB_ID = 'lab-aim-12-capstone-v1';
const AIM12_LAB_KEY = 'lab-aim-12-capstone';

const AIM12_DEFAULT_STATE = {
  stagesDone: {}, stagesReflection: {}, reviewMode: false,
  repoUrl: '', demoUrl: '', repoUrlTouched: false,
};

/* Real-product deliverable, per AI_ML_APPLIED_BUILD_TRACK.md (Model B —
 * the capstone starts its own fresh repo, converging the program's work). */
function aim12IsValidUrl(value) {
  return /^https?:\/\/.+\..+/.test((value || '').trim());
}

function aim12StagesComplete() {
  return AIM12_STAGES.every((stage) => {
    const done = Boolean(aim12State.stagesDone[stage.id]);
    const reflection = (aim12State.stagesReflection[stage.id] || '').trim();
    return done && reflection.length >= 30;
  });
}

function aim12CapstoneComplete() {
  return aim12StagesComplete() && aim12IsValidUrl(aim12State.repoUrl);
}

let aim12State = null;
let aim12User = null;

function aim12Load(user) {
  aim12User = user;
  aim12State = LabRuntime.load(AIM12_LAB_ID, user, AIM12_DEFAULT_STATE);
  if (!aim12State.stagesDone || typeof aim12State.stagesDone !== 'object') aim12State.stagesDone = {};
  if (!aim12State.stagesReflection || typeof aim12State.stagesReflection !== 'object') aim12State.stagesReflection = {};

  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'ai-ml', 'aim-12');
  return aim12State;
}

function aim12Save() {
  if (aim12User && aim12State) LabRuntime.save(AIM12_LAB_ID, aim12User, aim12State);
}

/* -------------------------------------------------------------- lessons */

function aim12LessonCard(lesson) {
  return `<details class="aim-lesson" data-aim12-lesson="${esc(lesson.id)}" ${aim12State.reviewMode ? 'open' : ''}>
    <summary><span class="aim-lesson-icon"><i class="${esc(lesson.icon)}" aria-hidden="true"></i></span><span><strong>Lesson ${esc(lesson.number)} · ${esc(lesson.title)}</strong><small>${formatInstructionalMinutes(lesson.minutes)}</small></span><i class="ri-arrow-down-s-line aim-lesson-chevron" aria-hidden="true"></i></summary>
    <div class="aim-lesson-body">
      <h4>What You'll Learn</h4>
      <ul>${lesson.learn.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
      ${lesson.topics.map((topic) => `<div class="aim-lesson-topic"><strong>${esc(topic.heading)}</strong><p>${esc(topic.body)}</p></div>`).join('')}
      <div class="aim-practice"><strong><i class="ri-flashlight-line" aria-hidden="true"></i> Try It Yourself</strong><ol>${lesson.practice.map((item) => `<li>${esc(item)}</li>`).join('')}</ol></div>
      <p class="aim-instruction" style="margin-top:10px"><strong>Coming up in your capstone:</strong> ${esc(lesson.comingUp)}</p>
    </div>
  </details>`;
}

/* -------------------------------------------------------------- capstone stages */

function aim12StageItem(stage) {
  const done = Boolean(aim12State.stagesDone[stage.id]);
  const reflection = aim12State.stagesReflection[stage.id] || '';
  return `<li class="aim-stage ${done ? 'is-done' : ''}" data-aim12-stage="${esc(stage.id)}">
    <span class="aim-stage-num">${esc(stage.number)}</span>
    <div style="flex: 1;">
      <h4>${esc(stage.title)}</h4>
      <p>${esc(stage.description)}</p>
      <div class="aim-reflection" style="margin-top: 12px;">
        <label for="aim12-reflection-${esc(stage.id)}">Reflection or evidence</label>
        <textarea id="aim12-reflection-${esc(stage.id)}" data-aim12-reflection="${esc(stage.id)}" rows="3">${esc(reflection)}</textarea>
        <small>Paste a brief summary or key deliverable from this stage (at least ~30 characters).</small>
      </div>
      <label style="display: flex; align-items: center; gap: 8px; margin-top: 10px; cursor: pointer;">
        <input type="checkbox" data-aim12-step="${esc(stage.id)}" ${done ? 'checked' : ''} />
        <span style="color: #475569; font: 700 13px Inter, sans-serif;">I have completed this stage</span>
      </label>
    </div>
  </li>`;
}

function aim12CapstoneStatus() {
  const complete = aim12CapstoneComplete();
  return `<div class="aim-lab-status ${complete ? 'aim-status-pass' : 'aim-status-pending'}"><i class="${complete ? 'ri-checkbox-circle-fill' : 'ri-time-line'}" aria-hidden="true"></i><span>${complete ? 'Capstone complete — all eight stages are checked, reflections are recorded, and your final repository URL is saved.' : 'Check off each stage, record a reflection summarizing what you delivered, and paste your final repository URL below.'}</span></div>`;
}

function aim12RepoFields() {
  const repoInvalid = aim12State.repoUrlTouched && aim12State.repoUrl.trim() && !aim12IsValidUrl(aim12State.repoUrl);
  return `<div class="aim-repo-fields">
    <div class="aim-repo-field">
      <label for="aim12-repo-url">Final repository URL (required)</label>
      <input type="url" id="aim12-repo-url" data-aim12-repo-url value="${esc(aim12State.repoUrl)}" placeholder="https://github.com/your-username/aiml-capstone" ${repoInvalid ? 'class="is-invalid"' : ''} />
      ${repoInvalid ? '<small class="aim-repo-error">That doesn\'t look like a full URL (e.g. https://github.com/you/repo).</small>' : '<small>The repository containing your cleaned data pipeline, training code, and served model endpoint — your own GitHub account, per the Capstone Deliverables below.</small>'}
    </div>
    <div class="aim-repo-field">
      <label for="aim12-demo-url">Presentation / demo URL (optional)</label>
      <input type="url" id="aim12-demo-url" data-aim12-demo-url value="${esc(aim12State.demoUrl)}" placeholder="https://..." />
      <small>Optional — a link to your recorded final presentation or a live demo of the served endpoint.</small>
    </div>
  </div>`;
}

function aim12CapstonePanel() {
  return `
    <ul class="aim-stage-list">${AIM12_STAGES.map(aim12StageItem).join('')}</ul>
    ${aim12RepoFields()}
    ${aim12CapstoneStatus()}
  `;
}

/* -------------------------------------------------------------- shell */

function aim12Sections() {
  const labComplete = aim12CapstoneComplete();
  return [
    { id: 'aim12-lessons', title: 'Capstone Briefings', type: 'lecture', isComplete: true, scrollId: 'aim12-lessons' },
    { id: 'aim12-capstone', title: 'Multi-Stage Project', type: 'lab', isComplete: labComplete, scrollId: 'aim12-capstone' },
  ];
}

function viewAiMlModuleTwelve(user, program) {
  aim12Load(user);
  const module = program.modules['aim-12'];

  return `<div class="aim-shell">
    ${moduleTopbar(user, program)}
    ${moduleProgressShell(aim12Sections(), { reviewMode: aim12State.reviewMode })}
    <main class="aim-main">
      <section class="aim-hero" aria-labelledby="aim12-title">
        <div>
          <p class="aim-kicker">Module 12 · ${formatInstructionalMinutes(module.durationMinutes)} · Capstone</p>
          <h1 id="aim12-title">${esc(module.title)}</h1>
          <p class="aim-lede">${esc(module.summary)}</p>
        </div>
        <dl class="aim-progress" aria-label="Saved module progress">
          <div><dt>Lessons</dt><dd>${module.lessons}</dd></div>
          <div><dt>Project stages</dt><dd>${module.labs}</dd></div>
        </dl>
      </section>

      <section class="aim-objective" aria-labelledby="aim12-objective-title"><span><i class="ri-focus-2-line" aria-hidden="true"></i></span><div><p class="aim-kicker">One measurable objective</p><h2 id="aim12-objective-title">Scope a machine learning problem from a business question through the full CRISP-DM lifecycle, producing a portfolio-grade project with a model card, deployment plan, and final presentation.</h2></div></section>

      <details class="aim-section-collapsible" id="aim12-lessons" ${aim12State.reviewMode ? 'open' : 'open'}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>1</span><div><p class="aim-kicker">Learn</p><h2>Four capstone briefings</h2></div></div></summary>
        <div class="aim-section-body">
          <p class="aim-instruction">Open each briefing to understand the capstone scope, available tools, documentation expectations, and presentation format. Then work through the eight stages below in your own Python environment.</p>
          <div class="aim-lesson-grid">${AIM12_LESSONS.map(aim12LessonCard).join('')}</div>
        </div>
      </details>

      <details class="aim-section-collapsible" id="aim12-capstone" ${aim12State.reviewMode ? 'open' : 'open'}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>2</span><div><p class="aim-kicker">Hands-on · your own environment</p><h2>Eight-stage capstone project</h2></div></div></summary>
        <div class="aim-section-body">
          <p class="aim-instruction">Work through each of the eight stages below in your own Python environment, using a real or instructor-provided dataset. For each stage, complete the checklist item and paste a short reflection or deliverable summary (e.g., your problem statement for Stage 1, your EDA findings for Stage 3, your model card for Stage 8). The capstone is complete when all eight stages are checked and each has a reflection of at least ~30 characters.</p>
          <div id="aim12-capstone-dynamic">${aim12CapstonePanel()}</div>
        </div>
      </details>

      <details class="aim-section-collapsible" id="aim12-deliverables" ${aim12State.reviewMode ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>3</span><div><p class="aim-kicker">Portfolio artifacts</p><h2>Capstone deliverables</h2></div></div></summary>
        <div class="aim-section-body">
          <p class="aim-instruction">Your capstone project produces four deliverables that together form a portfolio-ready machine learning case study:</p>
          <ul style="color: #475569; font: 13px/1.6 Inter, sans-serif; margin: 0; padding-left: 18px;">
            <li><strong>Repository with code:</strong> A git repository containing the cleaned data pipeline, training code, model artifacts, and served endpoint (or simple app demonstrating predictions).</li>
            <li><strong>Written project report:</strong> A technical document following the eight stages, describing your problem, data, features, model choices, evaluation, deployment plan, and responsible-AI review.</li>
            <li><strong>Model card:</strong> A one-page artifact documenting model purpose, data summary, performance, limitations, failure modes, and intended/out-of-scope use.</li>
            <li><strong>Final presentation:</strong> A 10–15 minute recorded or live presentation to a mixed technical/non-technical audience, defending your model and its limitations.</li>
          </ul>
        </div>
      </details>

      <details class="aim-section-collapsible" id="aim12-sources" ${aim12State.reviewMode ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>4</span><div><p class="aim-kicker">Supporting resources</p><h2>Further reading</h2></div></div></summary>
        <div class="aim-section-body">${moduleSourcesBlock(AIM12_SOURCES)}</div>
      </details>
    </main>
  </div>`;
}

/* -------------------------------------------------------------- render helpers */

function aim12RenderCapstone() {
  const el = document.getElementById('aim12-capstone-dynamic');
  if (!el) return;
  el.innerHTML = aim12CapstonePanel();
}

function aim12CheckCapstoneComplete(wasComplete) {
  const nowComplete = aim12CapstoneComplete();
  if (nowComplete && !wasComplete) {
    if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(aim12User, AIM12_LAB_KEY, { state: 'complete', score: 100, result: { stages: AIM12_STAGES.length, repoUrl: aim12State.repoUrl, demoUrl: aim12State.demoUrl || null } });
    }
    if (typeof markModuleLabComplete === 'function') {
      markModuleLabComplete(aim12User, 'ai-ml', 'aim-12', AIM12_LAB_KEY);
    }
  }
  return nowComplete;
}

/* -------------------------------------------------------------- wiring */

function wireAiMlModuleTwelve() {
  const shell = document.querySelector('.aim-shell');
  if (!shell || !aim12State) return;

  shell.addEventListener('click', (event) => {
    if (event.target.closest('[data-mnav-review-toggle]')) {
      aim12State.reviewMode = !aim12State.reviewMode;
      aim12Save();
      render();
      return;
    }
  });

  shell.addEventListener('input', (event) => {
    if (event.target.matches('[data-aim12-reflection]')) {
      // Save/check only — no re-render here. aim12RenderCapstone() replaces
      // every stage's textarea DOM node, so calling it per keystroke would
      // drop focus out of the field being typed in after every character.
      // The status pill catches up on the next full re-render (a checkbox
      // toggle, a repo-url blur, or review-mode toggle), same pattern every
      // other ai-ml module's reflection field already uses.
      const id = event.target.dataset.aim12Reflection;
      const wasComplete = aim12CapstoneComplete();
      aim12State.stagesReflection[id] = event.target.value;
      aim12CheckCapstoneComplete(wasComplete);
      aim12Save();
      return;
    }
    if (event.target.matches('[data-aim12-repo-url]')) {
      const wasComplete = aim12CapstoneComplete();
      aim12State.repoUrl = event.target.value;
      aim12CheckCapstoneComplete(wasComplete);
      aim12Save();
      return;
    }
    if (event.target.matches('[data-aim12-demo-url]')) {
      aim12State.demoUrl = event.target.value;
      aim12Save();
    }
  });

  shell.addEventListener('blur', (event) => {
    if (!event.target.matches('[data-aim12-repo-url]')) return;
    aim12State.repoUrlTouched = true;
    aim12Save();
    aim12RenderCapstone();
  }, true);

  shell.addEventListener('change', (event) => {
    if (event.target.matches('[data-aim12-step]')) {
      const wasComplete = aim12CapstoneComplete();
      const id = event.target.dataset.aim12Step;
      aim12State.stagesDone[id] = event.target.checked;
      aim12CheckCapstoneComplete(wasComplete);
      aim12Save();
      aim12RenderCapstone();
      return;
    }
  });
}

registerModuleLab({
  program: 'ai-ml',
  moduleNumber: 12,
  moduleKey: 'aim-12',
  view: viewAiMlModuleTwelve,
  wire: wireAiMlModuleTwelve,
});
