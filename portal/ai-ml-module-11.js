/* Module 11 — Responsible AI, Ethics & Communicating Results ('ai-ml').
 * Content authored from AI_ML_ENGINEERING_CURRICULUM.md (2026-09-10).
 * Labs run in the student's own real Python environment (no in-portal code
 * execution sandbox exists) — completion is tracked as a guided step
 * checklist plus short written reflections, evidence-based like
 * ai-ml-module-01.js's pattern, not a simulated console.
 */

const AIM11_LESSONS = [
  {
    id: 'aim11-lesson-01', number: '11.1', icon: 'ri-scales-3-line',
    title: 'Bias, Fairness & Data Quality', minutes: 90,
    learn: [
      'Where bias enters an ML system: historical data, sampling, labeling, proxy variables, and feedback loops',
      'What "fairness" means across different definitions and why trade-offs exist',
      'How to audit a training dataset for underrepresented groups and proxy variables',
    ],
    topics: [
      { heading: 'Sources of Bias', body: 'Bias enters at every stage: historical data contains patterns from the past (e.g., hiring decisions reflect historical discrimination), sampling may oversample some populations and undersample others, labeling introduces human judgment and inconsistency, proxy variables (like zip code) correlate with protected attributes and reintroduce their effects even if the protected attribute is removed, and feedback loops amplify initial biases as a model\'s predictions influence future training data.' },
      { heading: 'Fairness Definitions', body: 'Fairness is not a single concept — demographic parity (equal rates across groups), equalized odds (equal error rates), calibration (consistent confidence across groups), and individual fairness (similar individuals treated similarly) can conflict. There is no one-size-fits-all definition; the choice depends on the problem, the stakeholders, and the downstream consequences.' },
      { heading: 'Auditing for Bias', body: 'Look for underrepresented groups in the data, hidden proxy variables that correlate with protected attributes, label noise or inconsistency that affects some groups more than others, and feedback loops where poor predictions on one group cause them to be undersampled in future training. Document the finding and the magnitude of the imbalance so downstream decisions are informed.' },
    ],
    practice: [
      'Identify one underrepresented group in a dataset you have access to and quantify how many rows it represents.',
      'List three proxy variables that might correlate with a protected attribute in a real-world hiring or lending dataset.',
    ],
    comingUp: 'Your lab\'s second step is an audit of training data for bias — you\'ll document one plausible source and its magnitude.',
  },
  {
    id: 'aim11-lesson-02', number: '11.2', icon: 'ri-lightbulb-flash-line',
    title: 'Model Interpretability & Explainability', minutes: 85,
    learn: [
      'The difference between global and local explanations, and why you need both',
      'Feature importance methods (permutation, coefficient-based) and their limits',
      'SHAP and LIME as applied tools for explaining individual predictions',
    ],
    topics: [
      { heading: 'Global vs. Local', body: 'Global interpretability answers "what matters overall?" — which features does the model rely on most. Local interpretability answers "why did the model make this specific prediction?" — which input features pushed this particular instance toward the predicted class. A feature might have low global importance but still dominate a single prediction, or vice versa. Both are necessary for understanding model behavior.' },
      { heading: 'Feature Importance', body: 'Permutation importance measures how much a model\'s performance drops when you shuffle a feature, showing feature relevance. Coefficient-based importance (from linear models or tree gains) shows direction and magnitude. Both can be misleading if features are correlated — removing one correlated feature appears to diminish importance when its signal just shifts to its correlation partner.' },
      { heading: 'SHAP & LIME', body: 'SHAP (SHapley Additive exPlanations) decomposes each prediction into contributions from each feature, with a theoretical foundation in game theory. LIME (Local Interpretable Model-agnostic Explanations) fits a simple surrogate model around a single prediction to approximate the complex model locally. Both work on any model; SHAP is more rigorous but slower, LIME is faster but less stable.' },
    ],
    practice: [
      'Train a simple classifier and compute permutation importance for two features; compare your results to model coefficients if it\'s a linear model.',
      'Use SHAP or LIME on one prediction from a trained model and write down which features pushed it toward the prediction.',
    ],
    comingUp: 'Your lab\'s first step is to apply a local interpretability technique (SHAP, LIME, or similar) to one prediction from a model trained earlier in the program.',
  },
  {
    id: 'aim11-lesson-03', number: '11.3', icon: 'ri-shield-check-line',
    title: 'NIST AI Risk Management Framework', minutes: 75,
    learn: [
      'The four core functions of the NIST AI RMF: Govern, Map, Measure, Manage',
      'How to map a project\'s AI risks to the framework and document mitigations',
      'Risk categories: performance, security, privacy, fairness, and more',
    ],
    topics: [
      { heading: 'The Four Functions', body: 'Govern: establish policies and accountability so AI decisions are overseen at the organizational level. Map: identify and categorize AI risks for the system (performance, fairness, security, etc.). Measure: select and track metrics to quantify risk exposure over time. Manage: implement mitigations and adapt as the system evolves or new risks emerge.' },
      { heading: 'Mapping Risks', body: 'For each use case and data pipeline, list plausible failure modes: low accuracy on a subgroup, data poisoning, model drift, privacy leaks from training data, adversarial examples, or deployment in an out-of-scope context. For each risk, assign a severity (low/medium/high) and the function(s) that will address it (governance policy, fairness audit, performance monitoring, etc.).' },
      { heading: 'Performance, Fairness, Security, Privacy', body: 'Performance risk: the model is inaccurate overall or on key subgroups. Fairness risk: the model treats some groups worse than others. Security risk: the model is vulnerable to adversarial input or poisoning. Privacy risk: training data can be extracted or reconstructed. Each requires different measurement and mitigation strategies.' },
    ],
    practice: [
      'For a model you work with, list three possible failure modes and assign a severity.',
      'Write one sentence mitigation for each failure mode (what will you do if it happens?).',
    ],
    comingUp: 'Your lab\'s second audit ties into NIST: document bias findings in terms of risk (severity and impact).',
  },
  {
    id: 'aim11-lesson-04', number: '11.4', icon: 'ri-article-line',
    title: 'Model Cards & Communicating Results', minutes: 80,
    learn: [
      'Model card structure: purpose, training data, performance, limitations, intended use, and out-of-scope use',
      'How to present model results and caveats honestly to non-technical stakeholders',
      'Privacy considerations and responsible deployment decisions',
    ],
    topics: [
      { heading: 'Model Card Essentials', body: 'A model card is a short (one-page) document that answers: What is this model for? What data was it trained on, and are there known imbalances? How does it perform overall and on key subgroups? What are its known limitations? When should it be used, and when should it not? A good model card reduces downstream surprises and supports informed deployment decisions.' },
      { heading: 'Plain-Language Communication', body: 'Avoid overconfidence. Instead of "the model is 95% accurate," say "the model predicts correctly 95% of the time on the test set, but only 70% on the underrepresented subgroup, and it has not been tested on data from 2024." Use plain language for non-technical audiences: explain what the model does, not how. Acknowledge limits and spell out when it should not be used.' },
      { heading: 'Privacy & Deployment', body: 'Training data can leak through model extraction attacks or membership inference. Decide whether your model needs formal differential privacy, output sanitization, or restricted access. Deployment context matters: a model trained on one region may not generalize to another. Document these constraints so decision-makers know the scope.' },
    ],
    practice: [
      'Find a real-world model card (e.g., from a published paper or company repository) and list the sections it includes.',
      'Write a 3-sentence plain-language summary of a model you have built, suitable for a stakeholder with no ML background.',
    ],
    comingUp: 'Your lab\'s third step is writing a model card for a model trained earlier in the program.',
  },
];

const AIM11_QUIZ_BANKS = [
  {
    conceptId: 'aim11-bias', conceptTitle: 'Bias', questions: [
      { id: 'aim11-q-bias-1', prompt: 'A hiring model trained on 10 years of historical hiring decisions MOST likely risks:', options: [
        { id: 'a', text: 'No bias at all, since it\'s purely data-driven' },
        { id: 'b', text: 'Reproducing and amplifying any historical bias present in those past hiring decisions' },
        { id: 'c', text: 'Being too slow to run' },
        { id: 'd', text: 'Only affecting model training time — not deployment' },
      ], correctId: 'b', feedbackCorrect: 'Correct — models trained on historical decisions inherit and often amplify the biases embedded in that history.', feedbackIncorrect: 'A model trained on historical data will encode biases already present in that history; "purely data-driven" does not mean bias-free.' },
      { id: 'aim11-q-bias-2', prompt: 'A "proxy variable" is a feature that:', options: [
        { id: 'a', text: 'Is always explicitly the protected attribute itself' },
        { id: 'b', text: 'Is correlated with a protected attribute (e.g., zip code with race) and can reintroduce its effect even if the protected attribute is removed' },
        { id: 'c', text: 'Has no relationship to any outcome' },
        { id: 'd', text: 'Is only relevant in image models' },
      ], correctId: 'b', feedbackCorrect: 'Correct — a proxy variable correlates with a protected attribute and can reintroduce bias even after the protected attribute is dropped.', feedbackIncorrect: 'A proxy variable is correlated with a protected attribute and circumvents fairness efforts by reintroducing the same bias effect under a different feature name.' },
    ],
  },
  {
    conceptId: 'aim11-interpretability', conceptTitle: 'Interpretability', questions: [
      { id: 'aim11-q-interp-1', prompt: 'A local interpretability method (like SHAP for a single prediction) explains:', options: [
        { id: 'a', text: 'The model\'s overall architecture only' },
        { id: 'b', text: 'Why the model made that specific prediction for that specific input' },
        { id: 'c', text: 'The training dataset\'s size' },
        { id: 'd', text: 'The model\'s training time' },
      ], correctId: 'b', feedbackCorrect: 'Correct — local methods explain a single prediction; global methods explain overall model behavior.', feedbackIncorrect: 'Local interpretability is the art of explaining why a model made a specific prediction for a specific input.' },
    ],
  },
  {
    conceptId: 'aim11-risk-framework', conceptTitle: 'Risk framework', questions: [
      { id: 'aim11-q-risk-1', prompt: 'The NIST AI Risk Management Framework\'s four core functions are:', options: [
        { id: 'a', text: 'Plan, Build, Test, Ship' },
        { id: 'b', text: 'Govern, Map, Measure, Manage' },
        { id: 'c', text: 'Collect, Clean, Model, Deploy' },
        { id: 'd', text: 'Design, Develop, Debug, Deliver' },
      ], correctId: 'b', feedbackCorrect: 'Correct — Govern (policy and accountability), Map (risk identification), Measure (metrics), and Manage (mitigation) form the NIST RMF.', feedbackIncorrect: 'The NIST AI Risk Management Framework\'s four functions are Govern, Map, Measure, and Manage.' },
    ],
  },
  {
    conceptId: 'aim11-documentation-communication', conceptTitle: 'Documentation & communication', questions: [
      { id: 'aim11-q-doc-1', prompt: 'A model card is MOST useful for:', options: [
        { id: 'a', text: 'Replacing the need for a test set' },
        { id: 'b', text: 'Communicating a model\'s purpose, training data, performance, and known limitations to future users and reviewers' },
        { id: 'c', text: 'Increasing model accuracy directly' },
        { id: 'd', text: 'Hiding a model\'s limitations from stakeholders' },
      ], correctId: 'b', feedbackCorrect: 'Correct — a model card documents what the model does, how it performs, and its limitations for informed decisions downstream.', feedbackIncorrect: 'A model card is a transparency document that communicates a model\'s scope, performance, and limitations to support responsible deployment.' },
      { id: 'aim11-q-doc-2', prompt: 'When presenting model results to a non-technical stakeholder, the BEST practice is to:', options: [
        { id: 'a', text: 'Present only the best-case metric and omit limitations' },
        { id: 'b', text: 'Clearly state both what the model does well and its known limitations, in plain language' },
        { id: 'c', text: 'Use only technical jargon to demonstrate rigor' },
        { id: 'd', text: 'Avoid discussing accuracy at all' },
      ], correctId: 'b', feedbackCorrect: 'Correct — honest, plain-language communication of both strengths and limitations builds trust and prevents misuse.', feedbackIncorrect: 'Effective communication means being clear about what the model does, what it cannot do, and when it should not be used — all in language the audience understands.' },
    ],
  },
];

const AIM11_BLANKS = [
  { id: 'aim11-b1', prompt: 'A feature correlated with a protected attribute, which can reintroduce bias even after the protected attribute itself is removed, is called a ______ variable.', accept: ['proxy'] },
  { id: 'aim11-b2', prompt: '______ interpretability explains a single prediction, while ______ interpretability explains overall model behavior.', accept: ['Local; global', 'Local, global', 'Local and global'] },
  { id: 'aim11-b3', prompt: 'The NIST AI Risk Management Framework\'s four functions are Govern, ______, Measure, and Manage.', accept: ['Map'] },
  { id: 'aim11-b4', prompt: 'A ______ ______ documents a model\'s purpose, training data, performance, and limitations for future users.', accept: ['model card', 'model-card'] },
];

const AIM11_SOURCES = [
  { title: 'NIST AI Risk Management Framework', org: 'NIST', url: 'https://www.nist.gov/itl/ai-risk-management-framework', note: 'The govern/map/measure/manage structure this module\'s risk-mapping exercise follows.' },
  { title: 'Interpretable Machine Learning', org: 'Christoph Molnar', url: 'https://christophm.github.io/interpretable-ml-book/', note: 'Free reference for SHAP, LIME, and other interpretability methods used in the lab.' },
  { title: 'OWASP Top 10 for LLM Applications', org: 'OWASP', url: 'https://genai.owasp.org/llm-top-10/', note: 'Carried forward from Module 09 for the generative-AI responsible-use topic.' },
];

const AIM11_LAB_ID = 'aim11-responsible-ai-v1';
const AIM11_LAB_KEY = 'lab-aim-11-responsible-ai';

const AIM11_LAB_STEPS = [
  { id: 'interpretability', label: 'Applied a local interpretability technique (SHAP, LIME, or similar) to explain one individual prediction from a trained model.' },
  { id: 'bias-audit', label: 'Audited the training dataset for at least one plausible source of bias and documented the finding.' },
  { id: 'model-card', label: 'Wrote a model card covering purpose, training data summary, performance by key subgroup, known limitations, and intended/out-of-scope use.' },
  { id: 'presentation', label: 'Delivered a 5-minute plain-language summary of the model\'s results and limitations to a non-technical stakeholder (or peer).' },
];

const AIM11_DEFAULT_STATE = {
  stepsDone: {}, reflection: '', reflectionChecked: false,
  reviewMode: false,
  blankAnswers: {}, blankResults: {},
};

let aim11State = null;
let aim11User = null;
let aim11QuizState = null;

function aim11Load(user) {
  aim11User = user;
  aim11State = LabRuntime.load(AIM11_LAB_ID, user, AIM11_DEFAULT_STATE);
  if (!aim11State.stepsDone || typeof aim11State.stepsDone !== 'object') aim11State.stepsDone = {};
  if (!aim11State.blankAnswers) aim11State.blankAnswers = {};
  if (!aim11State.blankResults) aim11State.blankResults = {};

  if (!aim11QuizState) {
    const previousQuestionIds = aim11State.lastQuizQuestionIds || [];
    const selection = selectQuizQuestions(AIM11_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    aim11QuizState = {
      selectedQuestions: selection.selectedQuestions,
      questionsByAnswer: selection.questionsByAnswer,
      answers: {}, scored: false, attempts: 0, score: 0, bestScore: 0, feedback: [], passed: false,
    };
  }

  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'ai-ml', 'aim-11');
  return aim11State;
}

function aim11Save() {
  if (aim11User && aim11State) LabRuntime.save(AIM11_LAB_ID, aim11User, aim11State);
}

/* -------------------------------------------------------------- lessons */

function aim11LessonCard(lesson) {
  return `<details class="aim-lesson" data-aim11-lesson="${esc(lesson.id)}" ${aim11State.reviewMode ? 'open' : ''}>
    <summary><span class="aim-lesson-icon"><i class="${esc(lesson.icon)}" aria-hidden="true"></i></span><span><strong>Lesson ${esc(lesson.number)} · ${esc(lesson.title)}</strong><small>${formatInstructionalMinutes(lesson.minutes)}</small></span><i class="ri-arrow-down-s-line aim-lesson-chevron" aria-hidden="true"></i></summary>
    <div class="aim-lesson-body">
      <h4>What You'll Learn</h4>
      <ul>${lesson.learn.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
      ${lesson.topics.map((topic) => `<div class="aim-lesson-topic"><strong>${esc(topic.heading)}</strong><p>${esc(topic.body)}</p></div>`).join('')}
      <div class="aim-practice"><strong><i class="ri-flashlight-line" aria-hidden="true"></i> Try It Yourself</strong><ol>${lesson.practice.map((item) => `<li>${esc(item)}</li>`).join('')}</ol></div>
      <p class="aim-instruction" style="margin-top:10px"><strong>Coming up in your lab:</strong> ${esc(lesson.comingUp)}</p>
    </div>
  </details>`;
}

/* -------------------------------------------------------------- fill-in-the-blank */

function aim11BlankItem(blank) {
  const value = aim11State.blankAnswers[blank.id] || '';
  const result = aim11State.blankResults[blank.id];
  const statusClass = result === true ? 'is-correct' : result === false ? 'is-incorrect' : '';
  return `<li class="aim-blank-item ${statusClass}" data-aim11-blank="${esc(blank.id)}">
    <p class="aim-blank-prompt">${esc(blank.prompt)}</p>
    <div class="aim-blank-row">
      <input type="text" value="${esc(value)}" data-aim11-blank-input="${esc(blank.id)}" aria-label="Your answer" autocomplete="off" />
      <button type="button" class="aim-blank-check" data-aim11-blank-check="${esc(blank.id)}">Check</button>
    </div>
    ${result === true ? '<p class="aim-blank-result">Correct.</p>' : ''}
    ${result === false ? `<p class="aim-blank-result">Not quite — expected: ${esc(blank.accept[0])}</p>` : ''}
  </li>`;
}

function aim11BlankDrill() {
  return `<ul class="aim-blank-list">${AIM11_BLANKS.map(aim11BlankItem).join('')}</ul>`;
}

/* -------------------------------------------------------------- quiz */

function aim11QuizQuestion(selected, index) {
  const question = selected.question;
  const userAnswerId = aim11QuizState?.answers?.[question.id];
  return `<fieldset class="aim-quiz-question" data-question-id="${esc(question.id)}">
    <legend><span>${index + 1}</span> ${esc(selected.conceptTitle)}: ${esc(question.prompt)}</legend>
    <div class="aim-quiz-options">
      ${selected.shuffledOptions.map((option) => `<label>
        <input type="radio" name="q-${esc(question.id)}" value="${esc(option.id)}" ${userAnswerId === option.id ? 'checked' : ''} data-aim11-quiz-answer />
        <span>${esc(option.text)}</span>
      </label>`).join('')}
    </div>
  </fieldset>`;
}

function aim11QuizPanel() {
  if (!aim11QuizState?.selectedQuestions || aim11QuizState.selectedQuestions.length === 0) {
    return `<div class="aim-quiz-empty" id="aim11-quiz-feedback" role="status">Loading quiz…</div>`;
  }
  const selected = aim11QuizState.selectedQuestions;
  const answered = Object.keys(aim11QuizState.answers || {}).length;
  const total = selected.length;

  let feedbackHtml = '';
  if (aim11QuizState.scored) {
    const passed = aim11QuizState.score >= 70;
    feedbackHtml = `<section class="aim-quiz-score ${passed ? 'aim-quiz-pass' : 'aim-quiz-remediate'}" id="aim11-quiz-feedback" tabindex="-1" aria-live="polite">
      <div class="aim-quiz-score-heading">
        <div><p class="aim-kicker">Attempt ${aim11QuizState.attempts} · best ${aim11QuizState.bestScore}/100</p><h3>${aim11QuizState.score}/100 — ${passed ? 'Knowledge check passed' : 'Review and retry'}</h3></div>
        <span>${aim11QuizState.score}</span>
      </div>
      <ul class="aim-quiz-feedback-list">${(aim11QuizState.feedback || []).map((fb) => `<li>
        <i class="ri-${fb.correct ? 'checkbox-circle-fill' : 'information-line'}" aria-hidden="true"></i>
        <div><strong>${fb.correct ? 'Correct' : 'Review'}</strong><p>${esc(fb.message)}</p></div>
      </li>`).join('')}</ul>
      ${!passed ? `<div class="aim-quiz-actions"><button type="button" class="aim-quiz-retry" data-aim11-quiz-retry><i class="ri-refresh-line" aria-hidden="true"></i> Try different questions</button></div>` : ''}
    </section>`;
  } else if (answered === total) {
    feedbackHtml = `<div class="aim-quiz-ready" id="aim11-quiz-feedback" role="status">All questions answered. Submit to check your responses.</div>`;
  } else {
    feedbackHtml = `<div class="aim-quiz-empty" id="aim11-quiz-feedback" role="status">Answer all ${total} questions to submit.</div>`;
  }

  return `<form class="aim-quiz-form" id="aim11-quiz-form" novalidate>
    <div class="aim-panel-heading"><div><p class="aim-kicker">Knowledge check</p><h3>Test your understanding of responsible AI practices</h3></div><span>${answered}/${total} answered</span></div>
    ${selected.map((sel, idx) => aim11QuizQuestion(sel, idx)).join('')}
    <div class="aim-quiz-actions">
      <button class="aim-quiz-submit" type="submit" ${answered < total ? 'disabled' : ''}><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Check my answers</button>
    </div>
    ${feedbackHtml}
  </form>`;
}

/* -------------------------------------------------------------- lab */

function aim11LabStepItem(step) {
  const done = Boolean(aim11State.stepsDone[step.id]);
  return `<li class="aim-lab-step ${done ? 'is-done' : ''}"><input type="checkbox" id="aim11-step-${esc(step.id)}" data-aim11-step="${esc(step.id)}" ${done ? 'checked' : ''} /><label for="aim11-step-${esc(step.id)}"><span>${esc(step.label)}</span></label></li>`;
}

function aim11LabStatus() {
  const allDone = AIM11_LAB_STEPS.every((step) => aim11State.stepsDone[step.id]);
  const reflectionOk = aim11State.reflection.trim().length >= 40;
  const complete = allDone && reflectionOk;
  return `<div class="aim-lab-status ${complete ? 'aim-status-pass' : 'aim-status-pending'}"><i class="${complete ? 'ri-checkbox-circle-fill' : 'ri-time-line'}" aria-hidden="true"></i><span>${complete ? 'Lab complete — every step is checked and your reflection is recorded.' : 'Check off every step in your own Python environment, then record a short reflection.'}</span></div>`;
}

function aim11LabPanel() {
  return `
    <ol class="aim-lab-steps">${AIM11_LAB_STEPS.map(aim11LabStepItem).join('')}</ol>
    <div class="aim-reflection">
      <label for="aim11-reflection">Draft the core of your model card: what is this model's purpose, one key limitation, and its intended (and out-of-scope) use?</label>
      <textarea id="aim11-reflection" data-aim11-reflection rows="4">${esc(aim11State.reflection)}</textarea>
      <small>Write at least a couple of sentences — this is your evidence that the model card step was completed.</small>
    </div>
    ${aim11LabStatus()}
  `;
}

/* -------------------------------------------------------------- shell */

function aim11Sections() {
  const labComplete = AIM11_LAB_STEPS.every((step) => aim11State.stepsDone[step.id]) && aim11State.reflection.trim().length >= 40;
  return [
    { id: 'aim11-lessons', title: 'Responsible AI', type: 'lecture', isComplete: true, scrollId: 'aim11-lessons' },
    { id: 'aim11-knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: Boolean(aim11QuizState?.passed), scrollId: 'aim11-knowledge-check' },
    { id: 'aim11-lab', title: 'Hands-On Lab', type: 'lab', isComplete: labComplete, scrollId: 'aim11-lab' },
  ];
}

function viewAiMlModuleEleven(user, program) {
  aim11Load(user);
  const module = program.modules['aim-11'];

  return `<div class="aim-shell">
    ${moduleTopbar(user, program)}
    ${moduleProgressShell(aim11Sections(), { reviewMode: aim11State.reviewMode })}
    <main class="aim-main">
      <section class="aim-hero" aria-labelledby="aim11-title">
        <div>
          <p class="aim-kicker">Module 11 · ${formatInstructionalMinutes(module.durationMinutes)} · Week 6</p>
          <h1 id="aim11-title">${esc(module.title)}</h1>
          <p class="aim-lede">${esc(module.summary)}</p>
        </div>
        <dl class="aim-progress" aria-label="Saved module progress">
          <div><dt>Lessons</dt><dd>${module.lessons}</dd></div>
          <div><dt>Hands-on labs</dt><dd>${module.labs}</dd></div>
        </dl>
      </section>

      <section class="aim-objective" aria-labelledby="aim11-objective-title"><span><i class="ri-focus-2-line" aria-hidden="true"></i></span><div><p class="aim-kicker">Five measurable objectives</p><h2 id="aim11-objective-title">Identify bias in data and models, explain predictions using interpretability methods, apply a risk framework, document limitations in a model card, and communicate results honestly to stakeholders.</h2></div></section>

      <details class="aim-section-collapsible" id="aim11-lessons" ${aim11State.reviewMode ? 'open' : 'open'}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>1</span><div><p class="aim-kicker">Learn</p><h2>Four responsible AI lessons</h2></div></div></summary>
        <div class="aim-section-body">
          <p class="aim-instruction">Open each lesson for the full walkthrough, then work its Try It Yourself exercise in your own Python environment.</p>
          <div class="aim-lesson-grid">${AIM11_LESSONS.map(aim11LessonCard).join('')}</div>
        </div>
      </details>

      <details class="aim-section-collapsible" id="aim11-blanks" ${aim11State.reviewMode ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>2</span><div><p class="aim-kicker">Vocabulary drill</p><h2>Fill in the blank</h2></div></div></summary>
        <div class="aim-section-body">${aim11BlankDrill()}</div>
      </details>

      <details class="aim-section-collapsible" id="aim11-knowledge-check" ${aim11State.reviewMode || (aim11QuizState && !aim11QuizState.passed) ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>3</span><div><p class="aim-kicker">Interactive knowledge check</p><h2>Test your understanding</h2></div></div></summary>
        <div class="aim-section-body"><div id="aim11-quiz-dynamic">${aim11QuizPanel()}</div></div>
      </details>

      <details class="aim-section-collapsible" id="aim11-lab" ${aim11State.reviewMode ? 'open' : 'open'}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>4</span><div><p class="aim-kicker">Hands-on · your own environment</p><h2>Explain, Document, and Present</h2></div></div></summary>
        <div class="aim-section-body">
          <p class="aim-instruction">Work in your own Python environment: apply an interpretability technique to a trained model, audit training data for bias, write a model card, and present results to a stakeholder. Check off each step below as you complete it.</p>
          <div id="aim11-lab-dynamic">${aim11LabPanel()}</div>
        </div>
      </details>

      <details class="aim-section-collapsible" id="aim11-sources" ${aim11State.reviewMode ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>5</span><div><p class="aim-kicker">Supporting resources</p><h2>Further reading</h2></div></div></summary>
        <div class="aim-section-body">${moduleSourcesBlock(AIM11_SOURCES)}</div>
      </details>
    </main>
  </div>`;
}

/* -------------------------------------------------------------- render helpers */

function aim11RenderQuiz(focusId) {
  const el = document.getElementById('aim11-quiz-dynamic');
  if (!el) return;
  el.innerHTML = aim11QuizPanel();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function aim11RenderLab() {
  const el = document.getElementById('aim11-lab-dynamic');
  if (!el) return;
  el.innerHTML = aim11LabPanel();
}

function aim11CheckLabComplete(wasComplete) {
  const allDone = AIM11_LAB_STEPS.every((step) => aim11State.stepsDone[step.id]);
  const reflectionOk = aim11State.reflection.trim().length >= 40;
  const nowComplete = allDone && reflectionOk;
  if (nowComplete && !wasComplete) {
    if (typeof recordLabAttempt === 'function') recordLabAttempt(aim11User, AIM11_LAB_KEY, { state: 'complete', score: 100, result: { steps: AIM11_LAB_STEPS.length } });
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(aim11User, 'ai-ml', 'aim-11', AIM11_LAB_KEY);
  }
  return nowComplete;
}

/* -------------------------------------------------------------- wiring */

function wireAiMlModuleEleven() {
  const shell = document.querySelector('.aim-shell');
  if (!shell || !aim11State) return;

  shell.addEventListener('click', (event) => {
    if (event.target.closest('[data-mnav-review-toggle]')) {
      aim11State.reviewMode = !aim11State.reviewMode;
      aim11Save();
      render();
      return;
    }
    const blankCheck = event.target.closest('[data-aim11-blank-check]');
    if (blankCheck) {
      const id = blankCheck.dataset.aim11BlankCheck;
      const blank = AIM11_BLANKS.find((b) => b.id === id);
      const input = shell.querySelector(`[data-aim11-blank-input="${id}"]`);
      const given = (input?.value || '').trim().toLowerCase();
      aim11State.blankResults[id] = blank.accept.some((accepted) => accepted.toLowerCase() === given);
      aim11Save();
      const item = shell.querySelector(`[data-aim11-blank="${id}"]`);
      if (item) item.outerHTML = aim11BlankItem(blank);
      return;
    }
    const retry = event.target.closest('[data-aim11-quiz-retry]');
    if (retry) {
      const previousQuestionIds = aim11QuizState.selectedQuestions.map((s) => s.question.id);
      const selection = selectQuizQuestions(AIM11_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
      aim11QuizState = { selectedQuestions: selection.selectedQuestions, questionsByAnswer: selection.questionsByAnswer, answers: {}, scored: false, attempts: aim11QuizState.attempts, score: 0, bestScore: aim11QuizState.bestScore, feedback: [], passed: false };
      aim11State.lastQuizQuestionIds = previousQuestionIds;
      aim11Save();
      aim11RenderQuiz('aim11-quiz-title');
    }
  });

  shell.addEventListener('input', (event) => {
    if (event.target.matches('[data-aim11-blank-input]')) {
      const id = event.target.dataset.aim11BlankInput;
      aim11State.blankAnswers[id] = event.target.value;
      aim11Save();
      return;
    }
    if (event.target.matches('[data-aim11-reflection]')) {
      const wasComplete = AIM11_LAB_STEPS.every((step) => aim11State.stepsDone[step.id]) && aim11State.reflection.trim().length >= 40;
      aim11State.reflection = event.target.value;
      aim11CheckLabComplete(wasComplete);
      aim11Save();
    }
  });

  shell.addEventListener('change', (event) => {
    if (event.target.matches('[data-aim11-step]')) {
      const wasComplete = AIM11_LAB_STEPS.every((step) => aim11State.stepsDone[step.id]) && aim11State.reflection.trim().length >= 40;
      const id = event.target.dataset.aim11Step;
      aim11State.stepsDone[id] = event.target.checked;
      aim11CheckLabComplete(wasComplete);
      aim11Save();
      aim11RenderLab();
      return;
    }
    if (event.target.matches('[data-aim11-quiz-answer]')) {
      const questionId = event.target.closest('[data-question-id]')?.dataset.questionId;
      if (questionId) {
        aim11QuizState.answers[questionId] = event.target.value;
        aim11State.lastQuizQuestionIds = aim11QuizState.selectedQuestions.map((s) => s.question.id);
        aim11Save();
        aim11RenderQuiz();
      }
    }
  });

  shell.addEventListener('submit', (event) => {
    if (event.target.id !== 'aim11-quiz-form') return;
    event.preventDefault();
    const result = scoreQuizAttempt(aim11QuizState.selectedQuestions, aim11QuizState.questionsByAnswer, aim11QuizState.answers);
    aim11QuizState.attempts += 1;
    aim11QuizState.score = result.score;
    aim11QuizState.bestScore = Math.max(aim11QuizState.bestScore || 0, result.score);
    aim11QuizState.feedback = result.feedback;
    aim11QuizState.passed = result.score >= 70;
    aim11QuizState.scored = true;
    if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(aim11User, 'aim-11-knowledge-check', { state: aim11QuizState.passed ? 'complete' : 'in_progress', score: result.score });
    }
    aim11Save();
    aim11RenderQuiz('aim11-quiz-feedback');
  });
}

registerModuleLab({
  program: 'ai-ml',
  moduleNumber: 11,
  moduleKey: 'aim-11',
  view: viewAiMlModuleEleven,
  wire: wireAiMlModuleEleven,
});
