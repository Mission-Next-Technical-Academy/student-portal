/* Module 10 — MLOps: Deployment, Pipelines & Monitoring ('ai-ml').
 * Content authored from AI_ML_ENGINEERING_CURRICULUM.md (2026-09-10).
 * Labs run in the student's own real Python environment (no in-portal code
 * execution sandbox exists) — completion is tracked as a guided step
 * checklist plus short written reflections, evidence-based like
 * it-support-module-01.js's Lab 1.1, not a simulated console.
 * Reference implementation for the ai-ml-module-02..12.js pattern.
 */

const AIM10_LESSONS = [
  {
    id: 'aim10-lesson-01', number: '10.1', icon: 'ri-git-branch-line',
    title: 'CRISP-DM Deployment in Production', minutes: 60,
    learn: [
      'How the CRISP-DM deployment phase applies to automated, production ML systems',
      'Why treating models like software (versioning, testing, monitoring) is essential',
      'The feedback loop from production back to retraining',
    ],
    topics: [
      { heading: 'From Notebook to Production', body: 'CRISP-DM\'s deployment phase describes moving a validated model into real use. In modern ML systems, this means far more than uploading a file — it involves packaging the model reproducibly, versioning it, serving it through an API, monitoring its performance, and automatically triggering retraining when performance degrades. Every deployed model is a software component that needs testing, logging, and rollback capability.' },
      { heading: 'Model as Artifact', body: 'A trained model is best thought of as a versioned artifact, no different than a Docker image or a compiled binary. It has a training date, hyperparameters, metrics from evaluation, and dependencies (which Python version, which numpy version, what training data hash). Versioning lets you roll back if a new deployment fails.' },
      { heading: 'Feedback Loop', body: 'Production data accumulates over time. Statistical properties of that data (or the predictions the model makes) can drift. A well-designed ML system watches for drift, triggers retraining on fresh data, and compares the new model\'s performance on held-out test data before promoting it.' },
    ],
    practice: [
      'Sketch a deployment diagram showing model input, serving endpoint, logging, and monitoring feedback to a retraining trigger.',
      'List three reasons why a model that worked perfectly in a notebook might fail in production.',
    ],
    comingUp: 'Lab 1 operationalizes this: you will track experiments, package a model, and wrap it in an API.',
  },
  {
    id: 'aim10-lesson-02', number: '10.2', icon: 'ri-box-3-line',
    title: 'Model Packaging and Serving via REST API', minutes: 75,
    learn: [
      'How to serialize a trained model for persistence and deployment',
      'Building a minimal REST API endpoint to accept inference requests and return predictions',
      'Trade-offs in deployment strategies: batch scoring, real-time APIs, and edge models',
    ],
    topics: [
      { heading: 'Serialization and Versioning', body: 'A trained model is often serialized using pickle (Python\'s native serialization), joblib (faster for large numpy arrays), ONNX (a cross-platform format), or SavedModel (for TensorFlow). Each choice trades off speed, compatibility, and model size. Versioning the serialized artifact — naming it with a timestamp or run ID — ensures you can always revert to a prior model version.' },
      { heading: 'A Minimal REST API', body: 'Flask or FastAPI can wrap a deserialized model in a few lines: accept a JSON request (feature values), run model.predict(features), and return a JSON response (prediction + confidence). The API becomes a stable interface — clients don\'t need to know how the model works, only how to call the endpoint and parse its response.' },
      { heading: 'Deployment Strategies', body: 'Batch scoring (daily recomputation of predictions for known entities) is simple and cost-efficient but has stale predictions. Real-time API (per-request inference) requires lower latency and higher throughput but scales linearly with demand. Edge deployment (model lives on client devices) removes network round-trips but makes model updates harder. Each strategy fits different use cases.' },
    ],
    practice: [
      'Serialize a trained scikit-learn model to a .pkl file, then deserialize and run a prediction from it.',
      'Write a tiny Flask app with one endpoint that loads the model and returns a prediction for a JSON request.',
    ],
    comingUp: 'Lab 1b: you will package the model and build the REST API endpoint your monitoring scripts will call.',
  },
  {
    id: 'aim10-lesson-03', number: '10.3', icon: 'ri-database-line',
    title: 'Experiment Tracking and Reproducibility', minutes: 60,
    learn: [
      'How experiment tracking tools (like MLflow) record parameters, metrics, and artifacts for every run',
      'Why reproducibility is the foundation of trustworthy ML',
      'How to choose the best model from a collection of tracked runs',
    ],
    topics: [
      { heading: 'Experiment Metadata', body: 'When you train a model, record every detail: hyperparameters (learning rate, tree depth, regularization), metrics (accuracy, precision, recall, AUC), training data hash, code version, environment (Python version, package versions). MLflow Tracking automatically logs these; a centralized repository (the model registry) then lets your team browse, compare, and select candidate models for promotion to production.' },
      { heading: 'Reproducibility Promise', body: 'If you record the training data, code commit hash, random seed, and hyperparameters, you can reconstruct that exact trained model later. This is essential for debugging — if a deployed model starts failing, you need to re-run the training pipeline on the same data and know whether the model itself degrades or the input changed.' },
      { heading: 'Promotion and Versioning', body: 'MLflow\'s model registry lets you tag runs as "staging" or "production." Only runs that passed evaluation gates (test-set accuracy above threshold, prediction latency below limit) are promoted. The registry maintains version history, so rolling back to a prior production version is a single operation.' },
    ],
    practice: [
      'Log a training run to MLflow: params, train/test metrics, and the serialized model artifact.',
      'Use MLflow\'s UI to compare two runs by their metrics and select the one to promote.',
    ],
    comingUp: 'Lab 1a requires you to log at least three training runs to MLflow and pick the best one to package.',
  },
  {
    id: 'aim10-lesson-04', number: '10.4', icon: 'ri-flow-chart-line',
    title: 'Building Repeatable ML Pipelines', minutes: 75,
    learn: [
      'Separating training into discrete, order-dependent steps: data prep, feature engineering, training, evaluation',
      'Using tools like DVC (Data Version Control) or Airflow to orchestrate and retry failed steps',
      'Caching intermediate results to speed up re-runs',
    ],
    topics: [
      { heading: 'Pipeline Stages', body: 'A one-off notebook that trains a model is fine for exploration, but production retraining needs structure. Separate concerns: (1) Load and validate raw data, (2) transform raw data into features, (3) train the model, (4) evaluate on a held-out test set, (5) if metrics pass, serialize and version the model. Each stage produces outputs (data files, models) that the next stage depends on.' },
      { heading: 'Orchestration and Scheduling', body: 'A scheduler (Airflow, GitHub Actions, cloud-native services) runs the pipeline on a schedule or when triggered (e.g., daily at 2 AM when traffic is low). If the training stage fails, the orchestrator can alert you and retry; if evaluation fails, it blocks promotion of the model, protecting production.' },
      { heading: 'Caching and Efficiency', body: 'If the data preparation stage produced a cleaned CSV, and code changes only affect the training stage, re-run only training, not data prep. Tools like DVC and make-style build rules cache intermediate outputs so you don\'t recompute unchanged stages.' },
    ],
    practice: [
      'Sketch a three-stage pipeline: data prep, train, evaluate. Write the commands for each stage.',
      'Imagine data prep takes 5 minutes but only training code changes — describe how you\'d speed up re-runs.',
    ],
    comingUp: 'Lab 1c involves orchestrating experiment tracking, packaging, and API serving into one coherent script.',
  },
  {
    id: 'aim10-lesson-05', number: '10.5', icon: 'ri-alarm-warning-line',
    title: 'Monitoring, Drift & Rollback', minutes: 75,
    learn: [
      'How to detect model drift (accuracy degrades) and data drift (input distribution changes) in production',
      'Building monitoring dashboards that track prediction distribution, latency, and error rates',
      'Designing rollback plans and champion/challenger strategies for safe model updates',
    ],
    topics: [
      { heading: 'Data Drift Detection', body: 'Record the training data\'s statistical properties (mean, variance, quantiles of each feature). In production, periodically sample incoming requests and compute their properties. If they differ significantly (using a statistical test like Kolmogorov–Smirnov), data has drifted — the model was trained on different data and may no longer be reliable.' },
      { heading: 'Model Drift and Monitoring', body: 'Model drift is harder: you may not know the true label immediately. But you can monitor proxy signals: prediction distribution (is the model suddenly outputting far more 1s than 0s?), latency (does inference take longer, suggesting scale issues?), and error logs (exceptions, malformed inputs). When drift is detected, alert and consider retraining.' },
      { heading: 'Rollback and Champion/Challenger', body: 'A rollback plan names the trigger condition (accuracy drops below 85% on a weekly validation sample) and the steps to revert (kill the new model container, redeploy the prior version, alert the team). A champion/challenger pattern runs the new model on 10% of live traffic for a week, compares its metrics to the current (champion) model, and only promotes if it wins.' },
    ],
    practice: [
      'Write a monitoring query that compares the feature distribution of training data versus a sample of production inference requests.',
      'Describe a rollback plan: what metric triggers it, and what are the three concrete steps to revert?',
    ],
    comingUp: 'Lab 2 has you build a drift detection script and write your own rollback plan.',
  },
];

const AIM10_QUIZ_BANKS = [
  {
    conceptId: 'aim10-deployment', conceptTitle: 'Deployment', questions: [
      { id: 'aim10-q-dep-1', prompt: 'Serving a trained model\'s predictions to other applications is MOST commonly done by:', options: [
        { id: 'a', text: 'Emailing the model file to users' },
        { id: 'b', text: 'Wrapping the model in an API endpoint that accepts input and returns predictions' },
        { id: 'c', text: 'Re-running the notebook manually for every request' },
        { id: 'd', text: 'Hard-coding predictions into the frontend' },
      ], correctId: 'b', feedbackCorrect: 'Correct — a REST API exposes the model as a stable interface that clients call over HTTP.', feedbackIncorrect: 'Wrapping the model in an API endpoint makes it accessible to any client over HTTP and decouples the model from the frontend.' },
    ],
  },
  {
    conceptId: 'aim10-experiment-tracking', conceptTitle: 'Experiment tracking', questions: [
      { id: 'aim10-q-exp-1', prompt: 'Experiment tracking (e.g., with MLflow) is valuable MAINLY because it:', options: [
        { id: 'a', text: 'Automatically improves model accuracy' },
        { id: 'b', text: 'Records the parameters, metrics, and artifacts of each run so results are reproducible and comparable' },
        { id: 'c', text: 'Replaces the need for a test set' },
        { id: 'd', text: 'Is only useful for deep learning models' },
      ], correctId: 'b', feedbackCorrect: 'Correct — experiment tracking enables reproducibility and comparison, the foundation of scientific ML development.', feedbackIncorrect: 'Experiment tracking records every detail of each run so you can reproduce results and compare competing models.' },
    ],
  },
  {
    conceptId: 'aim10-drift', conceptTitle: 'Drift', questions: [
      { id: 'aim10-q-drf-1', prompt: '"Data drift" refers to:', options: [
        { id: 'a', text: 'A bug in the training code' },
        { id: 'b', text: 'A change in the statistical distribution of incoming production data compared to the data the model was trained on' },
        { id: 'c', text: 'A model that trains slower over time' },
        { id: 'd', text: 'A change in the model\'s source code' },
      ], correctId: 'b', feedbackCorrect: 'Correct — data drift is a shift in the input distribution that can cause formerly-accurate models to fail.', feedbackIncorrect: 'Data drift is a statistical change in the incoming production data compared to the training data.' },
      { id: 'aim10-q-drf-2', prompt: 'A model\'s live accuracy quietly degrades over three months with no code changes. The MOST likely explanation to investigate FIRST is:', options: [
        { id: 'a', text: 'A cosmic ray flipped a bit in the weights' },
        { id: 'b', text: 'The real-world data distribution has shifted (drift) since training' },
        { id: 'c', text: 'The API framework changed' },
        { id: 'd', text: 'The model file was deleted' },
      ], correctId: 'b', feedbackCorrect: 'Correct — data or model drift is by far the most common cause of silent accuracy degradation in production.', feedbackIncorrect: 'Gradual accuracy loss without code changes is almost always due to drift in the real-world data distribution.' },
    ],
  },
  {
    conceptId: 'aim10-operations', conceptTitle: 'Operations', questions: [
      { id: 'aim10-q-ops-1', prompt: 'A newly deployed model starts returning significantly worse predictions than the previous version. The BEST immediate action is:', options: [
        { id: 'a', text: 'Wait a week to see if it improves on its own' },
        { id: 'b', text: 'Roll back to the previous known-good model version while investigating' },
        { id: 'c', text: 'Immediately retrain from scratch with no diagnosis' },
        { id: 'd', text: 'Disable monitoring so alerts stop' },
      ], correctId: 'b', feedbackCorrect: 'Correct — rolling back fast protects users; investigation happens afterward with the system stable.', feedbackIncorrect: 'The immediate action is to roll back to the previous known-good version, protecting users while you diagnose the issue.' },
      { id: 'aim10-q-ops-2', prompt: 'A "champion/challenger" deployment pattern is used to:', options: [
        { id: 'a', text: 'Gamify the data science team\'s performance' },
        { id: 'b', text: 'Compare a new candidate model against the current production model on live or held-out traffic before fully promoting it' },
        { id: 'c', text: 'Delete underperforming models automatically with no review' },
        { id: 'd', text: 'Avoid the need for monitoring entirely' },
      ], correctId: 'b', feedbackCorrect: 'Correct — champion/challenger lets you validate new models on real traffic before full rollout, reducing risk.', feedbackIncorrect: 'Champion/challenger runs a new model (challenger) on a fraction of real traffic against the current model (champion), validating it before promotion.' },
    ],
  },
];

const AIM10_BLANKS = [
  { id: 'aim10-b1', prompt: '______ is the practice of applying DevOps-style automation and discipline (versioning, pipelines, monitoring) to machine learning systems.', accept: ['MLOps'] },
  { id: 'aim10-b2', prompt: 'A change in the statistical properties of incoming production data versus training data is called ______.', accept: ['data drift'] },
  { id: 'aim10-b3', prompt: '______ tracking records the parameters, metrics, and artifacts of each training run for reproducibility.', accept: ['Experiment'] },
  { id: 'aim10-b4', prompt: 'In CRISP-DM, ______ is the phase where a validated model is put into real use.', accept: ['deployment'] },
];

const AIM10_SOURCES = [
  { title: 'MLflow documentation', org: 'MLflow', url: 'https://mlflow.org/docs/latest/index.html', note: 'Experiment tracking, model packaging, and the model registry used in Lab 1.' },
  { title: 'CRISP-DM methodology overview', org: 'Data Science PM', url: 'https://www.datascience-pm.com/crisp-dm-2/', note: 'The deployment phase this module operationalizes for production systems.' },
];

const AIM10_LAB_ID = 'aim10-mlops-v1';
const AIM10_LAB_KEY = 'lab-aim-10-mlops';

const AIM10_LAB_STEPS = [
  { id: 'tracking', label: 'Logged parameters, metrics, and model artifacts for at least three training runs in MLflow (or equivalent).' },
  { id: 'select', label: 'Selected the best-performing run and reviewed its tracked metrics.' },
  { id: 'packaging', label: 'Serialized (pickled) the best model to a .pkl or .joblib file.' },
  { id: 'api', label: 'Built a minimal REST API endpoint (Flask or FastAPI) that accepts JSON input, loads the model, and returns a prediction.' },
  { id: 'monitoring', label: 'Built a monitoring script that compares incoming inference request distributions against training data distributions.' },
  { id: 'rollback', label: 'Deliberately sent out-of-distribution inputs to test the monitoring script, then wrote a concrete rollback plan.' },
];

const AIM10_DEFAULT_STATE = {
  stepsDone: {}, reflection: '', reflectionChecked: false,
  reviewMode: false,
  blankAnswers: {}, blankResults: {},
  repoUrl: '', demoUrl: '', repoUrlTouched: false,
};

/* Real-product deliverable, per AI_ML_APPLIED_BUILD_TRACK.md (Model B —
 * student's own GitHub, one small repo per project module). */
function aim10IsValidUrl(value) {
  return /^https?:\/\/.+\..+/.test((value || '').trim());
}

function aim10LabComplete() {
  const allDone = AIM10_LAB_STEPS.every((step) => aim10State.stepsDone[step.id]);
  const reflectionOk = aim10State.reflection.trim().length >= 40;
  const repoOk = aim10IsValidUrl(aim10State.repoUrl);
  return allDone && reflectionOk && repoOk;
}

let aim10State = null;
let aim10User = null;
let aim10QuizState = null;

function aim10Load(user) {
  aim10User = user;
  aim10State = LabRuntime.load(AIM10_LAB_ID, user, AIM10_DEFAULT_STATE);
  if (!aim10State.stepsDone || typeof aim10State.stepsDone !== 'object') aim10State.stepsDone = {};
  if (!aim10State.blankAnswers) aim10State.blankAnswers = {};
  if (!aim10State.blankResults) aim10State.blankResults = {};

  if (!aim10QuizState) {
    const previousQuestionIds = aim10State.lastQuizQuestionIds || [];
    const selection = selectQuizQuestions(AIM10_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    aim10QuizState = {
      selectedQuestions: selection.selectedQuestions,
      questionsByAnswer: selection.questionsByAnswer,
      answers: {}, scored: false, attempts: 0, score: 0, bestScore: 0, feedback: [], passed: false,
    };
  }

  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'ai-ml', 'aim-10');
  return aim10State;
}

function aim10Save() {
  if (aim10User && aim10State) LabRuntime.save(AIM10_LAB_ID, aim10User, aim10State);
}

/* -------------------------------------------------------------- lessons */

function aim10LessonCard(lesson) {
  return `<details class="aim-lesson" data-aim10-lesson="${esc(lesson.id)}" ${aim10State.reviewMode ? 'open' : ''}>
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

function aim10BlankItem(blank) {
  const value = aim10State.blankAnswers[blank.id] || '';
  const result = aim10State.blankResults[blank.id];
  const statusClass = result === true ? 'is-correct' : result === false ? 'is-incorrect' : '';
  return `<li class="aim-blank-item ${statusClass}" data-aim10-blank="${esc(blank.id)}">
    <p class="aim-blank-prompt">${esc(blank.prompt)}</p>
    <div class="aim-blank-row">
      <input type="text" value="${esc(value)}" data-aim10-blank-input="${esc(blank.id)}" aria-label="Your answer" autocomplete="off" />
      <button type="button" class="aim-blank-check" data-aim10-blank-check="${esc(blank.id)}">Check</button>
    </div>
    ${result === true ? '<p class="aim-blank-result">Correct.</p>' : ''}
    ${result === false ? `<p class="aim-blank-result">Not quite — expected: ${esc(blank.accept[0])}</p>` : ''}
  </li>`;
}

function aim10BlankDrill() {
  return `<ul class="aim-blank-list">${AIM10_BLANKS.map(aim10BlankItem).join('')}</ul>`;
}

/* -------------------------------------------------------------- quiz */

function aim10QuizQuestion(selected, index) {
  const question = selected.question;
  const userAnswerId = aim10QuizState?.answers?.[question.id];
  return `<fieldset class="aim-quiz-question" data-question-id="${esc(question.id)}">
    <legend><span>${index + 1}</span> ${esc(selected.conceptTitle)}: ${esc(question.prompt)}</legend>
    <div class="aim-quiz-options">
      ${selected.shuffledOptions.map((option) => `<label>
        <input type="radio" name="q-${esc(question.id)}" value="${esc(option.id)}" ${userAnswerId === option.id ? 'checked' : ''} data-aim10-quiz-answer />
        <span>${esc(option.text)}</span>
      </label>`).join('')}
    </div>
  </fieldset>`;
}

function aim10QuizPanel() {
  if (!aim10QuizState?.selectedQuestions || aim10QuizState.selectedQuestions.length === 0) {
    return `<div class="aim-quiz-empty" id="aim10-quiz-feedback" role="status">Loading quiz…</div>`;
  }
  const selected = aim10QuizState.selectedQuestions;
  const answered = Object.keys(aim10QuizState.answers || {}).length;
  const total = selected.length;

  let feedbackHtml = '';
  if (aim10QuizState.scored) {
    const passed = aim10QuizState.score >= 70;
    feedbackHtml = `<section class="aim-quiz-score ${passed ? 'aim-quiz-pass' : 'aim-quiz-remediate'}" id="aim10-quiz-feedback" tabindex="-1" aria-live="polite">
      <div class="aim-quiz-score-heading">
        <div><p class="aim-kicker">Attempt ${aim10QuizState.attempts} · best ${aim10QuizState.bestScore}/100</p><h3>${aim10QuizState.score}/100 — ${passed ? 'Knowledge check passed' : 'Review and retry'}</h3></div>
        <span>${aim10QuizState.score}</span>
      </div>
      <ul class="aim-quiz-feedback-list">${(aim10QuizState.feedback || []).map((fb) => `<li>
        <i class="ri-${fb.correct ? 'checkbox-circle-fill' : 'information-line'}" aria-hidden="true"></i>
        <div><strong>${fb.correct ? 'Correct' : 'Review'}</strong><p>${esc(fb.message)}</p></div>
      </li>`).join('')}</ul>
      ${!passed ? `<div class="aim-quiz-actions"><button type="button" class="aim-quiz-retry" data-aim10-quiz-retry><i class="ri-refresh-line" aria-hidden="true"></i> Try different questions</button></div>` : ''}
    </section>`;
  } else if (answered === total) {
    feedbackHtml = `<div class="aim-quiz-ready" id="aim10-quiz-feedback" role="status">All questions answered. Submit to check your responses.</div>`;
  } else {
    feedbackHtml = `<div class="aim-quiz-empty" id="aim10-quiz-feedback" role="status">Answer all ${total} questions to submit.</div>`;
  }

  return `<form class="aim-quiz-form" id="aim10-quiz-form" novalidate>
    <div class="aim-panel-heading"><div><p class="aim-kicker">Knowledge check</p><h3>Test your understanding of MLOps fundamentals</h3></div><span>${answered}/${total} answered</span></div>
    ${selected.map((sel, idx) => aim10QuizQuestion(sel, idx)).join('')}
    <div class="aim-quiz-actions">
      <button class="aim-quiz-submit" type="submit" ${answered < total ? 'disabled' : ''}><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Check my answers</button>
    </div>
    ${feedbackHtml}
  </form>`;
}

/* -------------------------------------------------------------- lab */

function aim10LabStepItem(step) {
  const done = Boolean(aim10State.stepsDone[step.id]);
  return `<li class="aim-lab-step ${done ? 'is-done' : ''}"><input type="checkbox" id="aim10-step-${esc(step.id)}" data-aim10-step="${esc(step.id)}" ${done ? 'checked' : ''} /><label for="aim10-step-${esc(step.id)}"><span>${esc(step.label)}</span></label></li>`;
}

function aim10LabStatus() {
  const complete = aim10LabComplete();
  return `<div class="aim-lab-status ${complete ? 'aim-status-pass' : 'aim-status-pending'}"><i class="${complete ? 'ri-checkbox-circle-fill' : 'ri-time-line'}" aria-hidden="true"></i><span>${complete ? 'Lab complete — every step is checked, your reflection is recorded, and your repository URL is saved.' : 'Check off every step in your own Python environment, record a short reflection, and paste your repository URL.'}</span></div>`;
}

function aim10RepoFields() {
  const repoInvalid = aim10State.repoUrlTouched && aim10State.repoUrl.trim() && !aim10IsValidUrl(aim10State.repoUrl);
  return `<div class="aim-repo-fields">
    <div class="aim-repo-field">
      <label for="aim10-repo-url">Repository URL (required)</label>
      <input type="url" id="aim10-repo-url" data-aim10-repo-url value="${esc(aim10State.repoUrl)}" placeholder="https://github.com/your-username/aiml-10-mlops" ${repoInvalid ? 'class="is-invalid"' : ''} />
      ${repoInvalid ? '<small class="aim-repo-error">That doesn\'t look like a full URL (e.g. https://github.com/you/repo).</small>' : '<small>Push your served-model API, experiment-tracking setup, and rollback plan to a public or private repo (your own GitHub account) and paste the URL here.</small>'}
    </div>
    <div class="aim-repo-field">
      <label for="aim10-demo-url">Live demo / recording URL (optional)</label>
      <input type="url" id="aim10-demo-url" data-aim10-demo-url value="${esc(aim10State.demoUrl)}" placeholder="https://..." />
      <small>Optional — a link to the running endpoint or a short recording of a request/response.</small>
    </div>
  </div>`;
}

function aim10LabPanel() {
  return `
    <ol class="aim-lab-steps">${AIM10_LAB_STEPS.map(aim10LabStepItem).join('')}</ol>
    <div class="aim-reflection">
      <label for="aim10-reflection">Write your rollback plan: what specific condition should trigger a rollback, and what are the concrete steps to revert to the previous model version?</label>
      <textarea id="aim10-reflection" data-aim10-reflection rows="4">${esc(aim10State.reflection)}</textarea>
      <small>Write at least a couple of sentences — this is your evidence that the lab was actually completed.</small>
    </div>
    ${aim10RepoFields()}
    ${aim10LabStatus()}
  `;
}

/* -------------------------------------------------------------- shell */

function aim10Sections() {
  const labComplete = aim10LabComplete();
  return [
    { id: 'aim10-lessons', title: 'MLOps Concepts', type: 'lecture', isComplete: true, scrollId: 'aim10-lessons' },
    { id: 'aim10-knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: Boolean(aim10QuizState?.passed), scrollId: 'aim10-knowledge-check' },
    { id: 'aim10-lab', title: 'Hands-On Lab', type: 'lab', isComplete: labComplete, scrollId: 'aim10-lab' },
  ];
}

function viewAiMlModuleTen(user, program) {
  aim10Load(user);
  const module = program.modules['aim-10'];

  return `<div class="aim-shell">
    ${moduleTopbar(user, program)}
    ${moduleProgressShell(aim10Sections(), { reviewMode: aim10State.reviewMode })}
    <main class="aim-main">
      <section class="aim-hero" aria-labelledby="aim10-title">
        <div>
          <p class="aim-kicker">Module 10 · ${formatInstructionalMinutes(module.durationMinutes)} · Week 5</p>
          <h1 id="aim10-title">${esc(module.title)}</h1>
          <p class="aim-lede">${esc(module.summary)}</p>
        </div>
        <dl class="aim-progress" aria-label="Saved module progress">
          <div><dt>Lessons</dt><dd>${module.lessons}</dd></div>
          <div><dt>Hands-on labs</dt><dd>${module.labs}</dd></div>
        </dl>
      </section>

      <section class="aim-objective" aria-labelledby="aim10-objective-title"><span><i class="ri-focus-2-line" aria-hidden="true"></i></span><div><p class="aim-kicker">One measurable objective</p><h2 id="aim10-objective-title">Package a trained model, serve it behind a REST API, track experiments, build a repeatable pipeline, and detect drift in production.</h2></div></section>

      <details class="aim-section-collapsible" id="aim10-lessons" ${aim10State.reviewMode ? 'open' : 'open'}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>1</span><div><p class="aim-kicker">Learn</p><h2>Five MLOps concepts</h2></div></div></summary>
        <div class="aim-section-body">
          <p class="aim-instruction">Open each lesson for the full walkthrough, then work its Try It Yourself exercise in your own Python environment.</p>
          <div class="aim-lesson-grid">${AIM10_LESSONS.map(aim10LessonCard).join('')}</div>
        </div>
      </details>

      <details class="aim-section-collapsible" id="aim10-blanks" ${aim10State.reviewMode ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>2</span><div><p class="aim-kicker">Vocabulary drill</p><h2>Fill in the blank</h2></div></div></summary>
        <div class="aim-section-body">${aim10BlankDrill()}</div>
      </details>

      <details class="aim-section-collapsible" id="aim10-knowledge-check" ${aim10State.reviewMode || (aim10QuizState && !aim10QuizState.passed) ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>3</span><div><p class="aim-kicker">Interactive knowledge check</p><h2>Test your understanding</h2></div></div></summary>
        <div class="aim-section-body"><div id="aim10-quiz-dynamic">${aim10QuizPanel()}</div></div>
      </details>

      <details class="aim-section-collapsible" id="aim10-lab" ${aim10State.reviewMode ? 'open' : 'open'}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>4</span><div><p class="aim-kicker">Hands-on · your own environment</p><h2>MLOps: Experiment Tracking, Packaging &amp; Drift Monitoring</h2></div></div></summary>
        <div class="aim-section-body">
          <p class="aim-instruction">Work both labs in your own Python environment: use MLflow to track experiments and package your best model behind a REST API, then build a drift-detection script and write a rollback plan. Check off each step below as you complete it.</p>
          <div id="aim10-lab-dynamic">${aim10LabPanel()}</div>
        </div>
      </details>

      <details class="aim-section-collapsible" id="aim10-sources" ${aim10State.reviewMode ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>5</span><div><p class="aim-kicker">Supporting resources</p><h2>Further reading</h2></div></div></summary>
        <div class="aim-section-body">${moduleSourcesBlock(AIM10_SOURCES)}</div>
      </details>
    </main>
  </div>`;
}

/* -------------------------------------------------------------- render helpers */

function aim10RenderQuiz(focusId) {
  const el = document.getElementById('aim10-quiz-dynamic');
  if (!el) return;
  el.innerHTML = aim10QuizPanel();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function aim10RenderLab() {
  const el = document.getElementById('aim10-lab-dynamic');
  if (!el) return;
  el.innerHTML = aim10LabPanel();
}

function aim10CheckLabComplete(wasComplete) {
  const nowComplete = aim10LabComplete();
  if (nowComplete && !wasComplete) {
    if (typeof recordLabAttempt === 'function') recordLabAttempt(aim10User, AIM10_LAB_KEY, { state: 'complete', score: 100, result: { steps: AIM10_LAB_STEPS.length, repoUrl: aim10State.repoUrl, demoUrl: aim10State.demoUrl || null } });
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(aim10User, 'ai-ml', 'aim-10', AIM10_LAB_KEY);
  }
  return nowComplete;
}

/* -------------------------------------------------------------- wiring */

function wireAiMlModuleTen() {
  const shell = document.querySelector('.aim-shell');
  if (!shell || !aim10State) return;

  shell.addEventListener('click', (event) => {
    if (event.target.closest('[data-mnav-review-toggle]')) {
      aim10State.reviewMode = !aim10State.reviewMode;
      aim10Save();
      render();
      return;
    }
    const blankCheck = event.target.closest('[data-aim10-blank-check]');
    if (blankCheck) {
      const id = blankCheck.dataset.aim10BlankCheck;
      const blank = AIM10_BLANKS.find((b) => b.id === id);
      const input = shell.querySelector(`[data-aim10-blank-input="${id}"]`);
      const given = (input?.value || '').trim().toLowerCase();
      aim10State.blankResults[id] = blank.accept.some((accepted) => accepted.toLowerCase() === given);
      aim10Save();
      const item = shell.querySelector(`[data-aim10-blank="${id}"]`);
      if (item) item.outerHTML = aim10BlankItem(blank);
      return;
    }
    const retry = event.target.closest('[data-aim10-quiz-retry]');
    if (retry) {
      const previousQuestionIds = aim10QuizState.selectedQuestions.map((s) => s.question.id);
      const selection = selectQuizQuestions(AIM10_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
      aim10QuizState = { selectedQuestions: selection.selectedQuestions, questionsByAnswer: selection.questionsByAnswer, answers: {}, scored: false, attempts: aim10QuizState.attempts, score: 0, bestScore: aim10QuizState.bestScore, feedback: [], passed: false };
      aim10State.lastQuizQuestionIds = previousQuestionIds;
      aim10Save();
      aim10RenderQuiz('aim10-quiz-title');
    }
  });

  shell.addEventListener('input', (event) => {
    if (event.target.matches('[data-aim10-blank-input]')) {
      const id = event.target.dataset.aim10BlankInput;
      aim10State.blankAnswers[id] = event.target.value;
      aim10Save();
      return;
    }
    if (event.target.matches('[data-aim10-reflection]')) {
      const wasComplete = aim10LabComplete();
      aim10State.reflection = event.target.value;
      aim10CheckLabComplete(wasComplete);
      aim10Save();
      return;
    }
    if (event.target.matches('[data-aim10-repo-url]')) {
      const wasComplete = aim10LabComplete();
      aim10State.repoUrl = event.target.value;
      aim10CheckLabComplete(wasComplete);
      aim10Save();
      return;
    }
    if (event.target.matches('[data-aim10-demo-url]')) {
      aim10State.demoUrl = event.target.value;
      aim10Save();
    }
  });

  shell.addEventListener('blur', (event) => {
    if (!event.target.matches('[data-aim10-repo-url]')) return;
    aim10State.repoUrlTouched = true;
    aim10Save();
    aim10RenderLab();
  }, true);

  shell.addEventListener('change', (event) => {
    if (event.target.matches('[data-aim10-step]')) {
      const wasComplete = aim10LabComplete();
      const id = event.target.dataset.aim10Step;
      aim10State.stepsDone[id] = event.target.checked;
      aim10CheckLabComplete(wasComplete);
      aim10Save();
      aim10RenderLab();
      return;
    }
    if (event.target.matches('[data-aim10-quiz-answer]')) {
      const questionId = event.target.closest('[data-question-id]')?.dataset.questionId;
      if (questionId) {
        aim10QuizState.answers[questionId] = event.target.value;
        aim10State.lastQuizQuestionIds = aim10QuizState.selectedQuestions.map((s) => s.question.id);
        aim10Save();
        aim10RenderQuiz();
      }
    }
  });

  shell.addEventListener('submit', (event) => {
    if (event.target.id !== 'aim10-quiz-form') return;
    event.preventDefault();
    const result = scoreQuizAttempt(aim10QuizState.selectedQuestions, aim10QuizState.questionsByAnswer, aim10QuizState.answers);
    aim10QuizState.attempts += 1;
    aim10QuizState.score = result.score;
    aim10QuizState.bestScore = Math.max(aim10QuizState.bestScore || 0, result.score);
    aim10QuizState.feedback = result.feedback;
    aim10QuizState.passed = result.score >= 70;
    aim10QuizState.scored = true;
    if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(aim10User, 'aim-10-knowledge-check', { state: aim10QuizState.passed ? 'complete' : 'in_progress', score: result.score });
    }
    aim10Save();
    aim10RenderQuiz('aim10-quiz-feedback');
  });
}

registerModuleLab({
  program: 'ai-ml',
  moduleNumber: 10,
  moduleKey: 'aim-10',
  view: viewAiMlModuleTen,
  wire: wireAiMlModuleTen,
});
