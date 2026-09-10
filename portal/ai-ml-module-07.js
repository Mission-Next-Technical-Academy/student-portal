/* Module 07 — Model Evaluation, Validation & Tuning ('ai-ml').
 * Content authored from AI_ML_ENGINEERING_CURRICULUM.md (2026-09-10).
 * Labs run in the student's own real Python environment (no in-portal code
 * execution sandbox exists) — completion is tracked as a guided step
 * checklist plus short written reflections, evidence-based like
 * it-support-module-01.js's Lab 1.1, not a simulated console.
 * Reference implementation for the ai-ml-module-02..12.js pattern.
 */

const AIM07_LESSONS = [
  {
    id: 'aim07-lesson-01', number: '7.1', icon: 'ri-check-double-line',
    title: 'Why Accuracy Alone Is Misleading', minutes: 45,
    learn: [
      'How imbalanced datasets break the accuracy metric',
      'Why "accuracy paradox" means high accuracy can mask worthless models',
      'How precision and recall each answer a different question',
    ],
    topics: [
      { heading: 'The Accuracy Paradox', body: 'Imagine a dataset where only 1% of samples are positive. A model that predicts "negative" for every input will achieve 99% accuracy without doing anything useful. This is the accuracy paradox: the metric rewards guessing the majority class. High accuracy tells you nothing when classes are severely imbalanced.' },
      { heading: 'Precision vs. Recall', body: 'Precision answers "of the predictions I labeled positive, how many were actually positive?" Recall answers "of the actual positive cases in the data, how many did my model catch?" They trade off: increasing recall often lowers precision and vice versa. Choosing which to optimize depends on the business cost of false positives versus false negatives.' },
      { heading: 'F1 Score', body: 'The F1 score harmonizes precision and recall into a single number — it is high only when both are high. It is a default choice when you care equally about minimizing both false positives and false negatives, and it handles imbalanced data far better than accuracy.' },
    ],
    practice: [
      'Given a dataset with 5% positive cases, calculate accuracy, precision, recall, and F1 by hand for a naive model.',
      'Identify which metric you would optimize for in a medical screening task (false positives burden the system; false negatives harm patients).',
    ],
    comingUp: 'Your first hands-on lab does exactly this: you\'ll train a model on imbalanced data and discover why accuracy alone was misleading.',
  },
  {
    id: 'aim07-lesson-02', number: '7.2', icon: 'ri-table-line',
    title: 'The Confusion Matrix', minutes: 40,
    learn: [
      'How to read and build a confusion matrix',
      'The four cells: true positives, false positives, true negatives, false negatives',
      'How to derive precision, recall, and other metrics from it',
    ],
    topics: [
      { heading: 'Reading the Matrix', body: 'A confusion matrix has four cells: TP (predicted positive, actually positive), FP (predicted positive, actually negative), FN (predicted negative, actually positive), TN (predicted negative, actually negative). Each row is an actual class, each column is a predicted class. The matrix is your rosetta stone for understanding what kinds of errors your model makes.' },
      { heading: 'From Matrix to Metrics', body: 'Precision = TP / (TP + FP): of predicted positives, how many were correct? Recall = TP / (TP + FN): of actual positives, how many were caught? Specificity = TN / (TN + FP): of actual negatives, how many were correctly rejected? Building the matrix first makes these definitions concrete instead of abstract.' },
    ],
    practice: [
      'Sketch a 2×2 confusion matrix for a disease screening test and label all four cells.',
      'Calculate precision and recall from your matrix; reason about what they tell a clinician.',
    ],
    comingUp: 'Your lab will generate a confusion matrix and use it to explain why simple accuracy misled you.',
  },
  {
    id: 'aim07-lesson-03', number: '7.3', icon: 'ri-curve-line',
    title: 'ROC Curves & AUC', minutes: 45,
    learn: [
      'What an ROC curve plots: true positive rate vs. false positive rate across thresholds',
      'What AUC (Area Under the Curve) means and why 0.5 is no better than a coin flip',
      'How to use ROC-AUC to compare classifiers fairly',
    ],
    topics: [
      { heading: 'Threshold Sweeping', body: 'Most classifiers predict a probability, not just a hard label. By varying the threshold (e.g., "predict positive if probability > 0.5"), you trade off true positives and false positives. An ROC curve plots true positive rate (TPR) on the y-axis against false positive rate (FPR) on the x-axis as the threshold sweeps from 0 to 1. A random classifier produces a diagonal line from (0,0) to (1,1) with AUC = 0.5; a perfect classifier reaches the top-left corner with AUC = 1.0.' },
      { heading: 'AUC as a Ranking Metric', body: 'AUC measures the probability that your model ranks a random positive case higher than a random negative case. High AUC (close to 1.0) means the model confidently separates the classes. Unlike accuracy, AUC is insensitive to class imbalance because it works with ranked predictions instead of hard thresholds.' },
    ],
    practice: [
      'Sketch an ROC curve for a classifier that perfectly separates two classes, and another for a random classifier.',
      'Reason about why AUC is a better summary than accuracy for imbalanced data.',
    ],
    comingUp: 'You\'ll generate an ROC curve and report AUC alongside the confusion matrix in your lab.',
  },
  {
    id: 'aim07-lesson-04', number: '7.4', icon: 'ri-divide-line',
    title: 'Cross-Validation & the Train/Validation/Test Split', minutes: 45,
    learn: [
      'Why k-fold cross-validation gives a more stable performance estimate than a single train/test split',
      'How stratified k-fold preserves class proportions in imbalanced data',
      'The three-way split: train to fit, validation to tune, test to report',
    ],
    topics: [
      { heading: 'Why a Single Split Is Not Enough', body: 'If you have 1,000 samples and split 70/30 into train/test, you measure performance on only 300 samples. The reported score could be unlucky if those 300 samples happen to be easier or harder than average. k-fold cross-validation splits the data into k folds, trains k models each leaving one fold out for testing, and averages the k scores. This uses every sample for both training and testing and gives a much more stable, generalizable estimate.' },
      { heading: 'The Three-Way Split', body: 'Training data: used to fit model weights. Validation data: used to tune hyperparameters and select between models — never touch it until you have a candidate. Test data: held completely separate, touched only once, at the very end, to report final performance. Violating this separation (using test data to choose hyperparameters, for example) is "test-set leakage" and inflates your reported performance on data the model has indirectly learned from.' },
      { heading: 'Stratified k-Fold', body: 'In classification with imbalanced classes, a random k-fold split can accidentally put all positives in one fold. Stratified k-fold ensures each fold has roughly the same class ratio as the full dataset, so each fold is a representative mini-dataset.' },
    ],
    practice: [
      'Write pseudocode for 5-fold cross-validation: loop k times, hold one fold as test, fit on the other k-1, score on the test fold.',
      'Explain why reporting a single test-set score after tuning on that same test set is invalid.',
    ],
    comingUp: 'Your second lab sets up 5-fold cross-validation and tunes hyperparameters on the validation folds, not the test set.',
  },
  {
    id: 'aim07-lesson-05', number: '7.5', icon: 'ri-settings-3-line',
    title: 'Hyperparameter Tuning Without Overfitting', minutes: 40,
    learn: [
      'Grid search and randomized search: when to use each',
      'How to avoid test-set leakage when tuning',
      'Interpreting tuning results to pick the best configuration',
    ],
    topics: [
      { heading: 'Grid Search vs. Randomized Search', body: 'Grid search exhaustively tries every combination of hyperparameters in a grid you define — it is thorough but can be slow with many parameters or large ranges. Randomized search samples randomly from the parameter space and is much faster, often finding configurations as good as grid search with far fewer trials. Choose grid search for a small, well-defined search space; randomized search for large or exploratory spaces.' },
      { heading: 'Respecting the Train/Validation/Test Boundary', body: 'When tuning hyperparameters, use only the training and validation data. The test set must not see the tuning process — it is for reporting final performance only. Scikit-learn\'s GridSearchCV and RandomizedSearchCV do this automatically by running cross-validation on the training data passed to them.' },
      { heading: 'Reading the Results', body: 'Tuning produces a set of candidate configurations ranked by cross-validated score. Pick the best configuration, retrain it on the full training set (not the validation folds), and evaluate it once on the held-out test set. The test-set score is your final, honest estimate of how it will perform on new data.' },
    ],
    practice: [
      'List three hyperparameters for a model of your choice and define a reasonable grid or range for each.',
      'Reason about whether grid or randomized search is more appropriate for that search space.',
    ],
    comingUp: 'Your lab runs a grid search over two hyperparameters, reports the best configuration, and confirms the test set was touched only once.',
  },
];

const AIM07_QUIZ_BANKS = [
  {
    conceptId: 'aim07-metrics', conceptTitle: 'Metrics', questions: [
      { id: 'aim07-q-m-1', prompt: 'A model predicting a rare disease (1% prevalence) achieves 99% accuracy by predicting "no disease" for everyone. This shows:', options: [
        { id: 'a', text: 'The model is excellent' },
        { id: 'b', text: 'Accuracy alone is misleading on imbalanced data — recall for the positive class is what matters here' },
        { id: 'c', text: 'The model has perfect recall' },
        { id: 'd', text: 'The dataset is too small to matter' },
      ], correctId: 'b', feedbackCorrect: 'Correct — on imbalanced data, high accuracy can hide a useless model; you need metrics like recall and F1.', feedbackIncorrect: 'On severely imbalanced data, high accuracy can be achieved by always guessing the majority class — you need recall and F1 to see the real picture.' },
      { id: 'aim07-q-m-2', prompt: 'Recall answers the question:', options: [
        { id: 'a', text: 'Of predicted positives, how many were correct?' },
        { id: 'b', text: 'Of actual positives, how many did the model correctly identify?' },
        { id: 'c', text: 'How accurate is the model overall?' },
        { id: 'd', text: 'How many features were used?' },
      ], correctId: 'b', feedbackCorrect: 'Correct — recall is the fraction of actual positives the model caught, also called "true positive rate."', feedbackIncorrect: 'Recall measures, of all actual positive cases in the data, how many the model correctly identified as positive.' },
      { id: 'aim07-q-m-3', prompt: 'A high AUC (close to 1.0) indicates:', options: [
        { id: 'a', text: 'The model is always correct' },
        { id: 'b', text: 'The model ranks positive cases higher than negative cases well across thresholds' },
        { id: 'c', text: 'The dataset has no noise' },
        { id: 'd', text: 'The model needs no further tuning' },
      ], correctId: 'b', feedbackCorrect: 'Correct — AUC measures how well the model separates the classes across all decision thresholds.', feedbackIncorrect: 'AUC (Area Under the ROC Curve) measures the probability that the model ranks a random positive higher than a random negative — high AUC means good class separation.' },
    ],
  },
  {
    conceptId: 'aim07-validation', conceptTitle: 'Validation', questions: [
      { id: 'aim07-q-v-1', prompt: 'K-fold cross-validation is preferred over a single train/test split MAINLY because it:', options: [
        { id: 'a', text: 'Trains a bigger model' },
        { id: 'b', text: 'Gives a more stable performance estimate by averaging across multiple splits' },
        { id: 'c', text: 'Removes the need for a test set entirely' },
        { id: 'd', text: 'Always improves accuracy' },
      ], correctId: 'b', feedbackCorrect: 'Correct — k-fold averages performance across k different train/test splits, giving a far more stable estimate.', feedbackIncorrect: 'K-fold cross-validation runs k models on k different train/test splits and averages their scores, producing a much more reliable performance estimate than a single random split.' },
      { id: 'aim07-q-v-2', prompt: 'Using the test set to choose between five different hyperparameter configurations, then reporting that same test set\'s score as final performance, is a textbook example of:', options: [
        { id: 'a', text: 'Best practice' },
        { id: 'b', text: 'Test-set leakage, which inflates the reported performance' },
        { id: 'c', text: 'Cross-validation' },
        { id: 'd', text: 'Regularization' },
      ], correctId: 'b', feedbackCorrect: 'Correct — using the test set to make decisions about the model violates the train/validation/test boundary and inflates reported performance.', feedbackIncorrect: 'Test-set leakage occurs when the test set influences model selection or tuning; the inflated score is no longer an honest estimate of generalization.' },
    ],
  },
  {
    conceptId: 'aim07-tuning', conceptTitle: 'Tuning', questions: [
      { id: 'aim07-q-t-1', prompt: 'Randomized search versus grid search for hyperparameter tuning is generally preferred when:', options: [
        { id: 'a', text: 'The search space is small enough to try every combination cheaply' },
        { id: 'b', text: 'The search space is large, and randomized search can find good configurations with far fewer trials' },
        { id: 'c', text: 'There is only one hyperparameter' },
        { id: 'd', text: 'Cross-validation is unavailable' },
      ], correctId: 'b', feedbackCorrect: 'Correct — randomized search is faster for large spaces and often finds configurations as good as grid search.', feedbackIncorrect: 'Randomized search samples hyperparameter combinations at random, exploring a large space efficiently; use it when grid search would require too many trials.' },
    ],
  },
];

const AIM07_BLANKS = [
  { id: 'aim07-b1', prompt: '______ measures, of predicted positives, how many were actually positive; ______ measures, of actual positives, how many were caught.', accept: ['Precision; recall', 'Precision, recall', 'Precision and recall'] },
  { id: 'aim07-b2', prompt: '______ -fold cross-validation splits the data into k parts, training and validating k times to get a stable performance estimate.', accept: ['K', 'k'] },
  { id: 'aim07-b3', prompt: 'The ______ set should be touched only once, at the very end, to report final performance.', accept: ['test'] },
  { id: 'aim07-b4', prompt: '______ search exhaustively tries every hyperparameter combination in a defined grid.', accept: ['Grid', 'grid'] },
];

const AIM07_SOURCES = [
  { title: 'scikit-learn documentation', org: 'scikit-learn', url: 'https://scikit-learn.org/stable/', note: 'model_selection (cross-validation, GridSearchCV) and metrics modules.' },
  { title: 'CRISP-DM methodology overview', org: 'Data Science PM', url: 'https://www.datascience-pm.com/crisp-dm-2/', note: 'The evaluation phase this module operationalizes.' },
];

const AIM07_LAB_ID = 'aim07-eval-tuning-v1';
const AIM07_LAB_KEY = 'lab-aim-07-eval-tuning';

const AIM07_LAB_STEPS = [
  { id: 'baseline', label: 'Trained a baseline model on imbalanced classification data (positive class is ~5% of rows).' },
  { id: 'accuracy', label: 'Reported accuracy of the baseline model.' },
  { id: 'metrics', label: 'Calculated precision, recall, F1, and AUC for the baseline model and compared to accuracy.' },
  { id: 'cv-setup', label: 'Set up 5-fold cross-validation for a chosen model architecture.' },
  { id: 'grid-search', label: 'Ran a grid search over at least two hyperparameters using cross-validation on the training data.' },
  { id: 'test-once', label: 'Evaluated the best configuration on the held-out test set exactly once and verified test-set leakage did not occur.' },
];

const AIM07_DEFAULT_STATE = {
  stepsDone: {}, reflection: '', reflectionChecked: false,
  reviewMode: false,
  blankAnswers: {}, blankResults: {},
};

let aim07State = null;
let aim07User = null;
let aim07QuizState = null;

function aim07Load(user) {
  aim07User = user;
  aim07State = LabRuntime.load(AIM07_LAB_ID, user, AIM07_DEFAULT_STATE);
  if (!aim07State.stepsDone || typeof aim07State.stepsDone !== 'object') aim07State.stepsDone = {};
  if (!aim07State.blankAnswers) aim07State.blankAnswers = {};
  if (!aim07State.blankResults) aim07State.blankResults = {};

  if (!aim07QuizState) {
    const previousQuestionIds = aim07State.lastQuizQuestionIds || [];
    const selection = selectQuizQuestions(AIM07_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    aim07QuizState = {
      selectedQuestions: selection.selectedQuestions,
      questionsByAnswer: selection.questionsByAnswer,
      answers: {}, scored: false, attempts: 0, score: 0, bestScore: 0, feedback: [], passed: false,
    };
  }

  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'ai-ml', 'aim-07');
  return aim07State;
}

function aim07Save() {
  if (aim07User && aim07State) LabRuntime.save(AIM07_LAB_ID, aim07User, aim07State);
}

/* -------------------------------------------------------------- lessons */

function aim07LessonCard(lesson) {
  return `<details class="aim-lesson" data-aim07-lesson="${esc(lesson.id)}" ${aim07State.reviewMode ? 'open' : ''}>
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

function aim07BlankItem(blank) {
  const value = aim07State.blankAnswers[blank.id] || '';
  const result = aim07State.blankResults[blank.id];
  const statusClass = result === true ? 'is-correct' : result === false ? 'is-incorrect' : '';
  return `<li class="aim-blank-item ${statusClass}" data-aim07-blank="${esc(blank.id)}">
    <p class="aim-blank-prompt">${esc(blank.prompt)}</p>
    <div class="aim-blank-row">
      <input type="text" value="${esc(value)}" data-aim07-blank-input="${esc(blank.id)}" aria-label="Your answer" autocomplete="off" />
      <button type="button" class="aim-blank-check" data-aim07-blank-check="${esc(blank.id)}">Check</button>
    </div>
    ${result === true ? '<p class="aim-blank-result">Correct.</p>' : ''}
    ${result === false ? `<p class="aim-blank-result">Not quite — expected: ${esc(blank.accept[0])}</p>` : ''}
  </li>`;
}

function aim07BlankDrill() {
  return `<ul class="aim-blank-list">${AIM07_BLANKS.map(aim07BlankItem).join('')}</ul>`;
}

/* -------------------------------------------------------------- quiz */

function aim07QuizQuestion(selected, index) {
  const question = selected.question;
  const userAnswerId = aim07QuizState?.answers?.[question.id];
  return `<fieldset class="aim-quiz-question" data-question-id="${esc(question.id)}">
    <legend><span>${index + 1}</span> ${esc(selected.conceptTitle)}: ${esc(question.prompt)}</legend>
    <div class="aim-quiz-options">
      ${selected.shuffledOptions.map((option) => `<label>
        <input type="radio" name="q-${esc(question.id)}" value="${esc(option.id)}" ${userAnswerId === option.id ? 'checked' : ''} data-aim07-quiz-answer />
        <span>${esc(option.text)}</span>
      </label>`).join('')}
    </div>
  </fieldset>`;
}

function aim07QuizPanel() {
  if (!aim07QuizState?.selectedQuestions || aim07QuizState.selectedQuestions.length === 0) {
    return `<div class="aim-quiz-empty" id="aim07-quiz-feedback" role="status">Loading quiz…</div>`;
  }
  const selected = aim07QuizState.selectedQuestions;
  const answered = Object.keys(aim07QuizState.answers || {}).length;
  const total = selected.length;

  let feedbackHtml = '';
  if (aim07QuizState.scored) {
    const passed = aim07QuizState.score >= 70;
    feedbackHtml = `<section class="aim-quiz-score ${passed ? 'aim-quiz-pass' : 'aim-quiz-remediate'}" id="aim07-quiz-feedback" tabindex="-1" aria-live="polite">
      <div class="aim-quiz-score-heading">
        <div><p class="aim-kicker">Attempt ${aim07QuizState.attempts} · best ${aim07QuizState.bestScore}/100</p><h3>${aim07QuizState.score}/100 — ${passed ? 'Knowledge check passed' : 'Review and retry'}</h3></div>
        <span>${aim07QuizState.score}</span>
      </div>
      <ul class="aim-quiz-feedback-list">${(aim07QuizState.feedback || []).map((fb) => `<li>
        <i class="ri-${fb.correct ? 'checkbox-circle-fill' : 'information-line'}" aria-hidden="true"></i>
        <div><strong>${fb.correct ? 'Correct' : 'Review'}</strong><p>${esc(fb.message)}</p></div>
      </li>`).join('')}</ul>
      ${!passed ? `<div class="aim-quiz-actions"><button type="button" class="aim-quiz-retry" data-aim07-quiz-retry><i class="ri-refresh-line" aria-hidden="true"></i> Try different questions</button></div>` : ''}
    </section>`;
  } else if (answered === total) {
    feedbackHtml = `<div class="aim-quiz-ready" id="aim07-quiz-feedback" role="status">All questions answered. Submit to check your responses.</div>`;
  } else {
    feedbackHtml = `<div class="aim-quiz-empty" id="aim07-quiz-feedback" role="status">Answer all ${total} questions to submit.</div>`;
  }

  return `<form class="aim-quiz-form" id="aim07-quiz-form" novalidate>
    <div class="aim-panel-heading"><div><p class="aim-kicker">Knowledge check</p><h3>Test your understanding of model evaluation and validation</h3></div><span>${answered}/${total} answered</span></div>
    ${selected.map((sel, idx) => aim07QuizQuestion(sel, idx)).join('')}
    <div class="aim-quiz-actions">
      <button class="aim-quiz-submit" type="submit" ${answered < total ? 'disabled' : ''}><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Check my answers</button>
    </div>
    ${feedbackHtml}
  </form>`;
}

/* -------------------------------------------------------------- lab */

function aim07LabStepItem(step) {
  const done = Boolean(aim07State.stepsDone[step.id]);
  return `<li class="aim-lab-step ${done ? 'is-done' : ''}"><input type="checkbox" id="aim07-step-${esc(step.id)}" data-aim07-step="${esc(step.id)}" ${done ? 'checked' : ''} /><label for="aim07-step-${esc(step.id)}"><span>${esc(step.label)}</span></label></li>`;
}

function aim07LabStatus() {
  const allDone = AIM07_LAB_STEPS.every((step) => aim07State.stepsDone[step.id]);
  const reflectionOk = aim07State.reflection.trim().length >= 40;
  const complete = allDone && reflectionOk;
  return `<div class="aim-lab-status ${complete ? 'aim-status-pass' : 'aim-status-pending'}"><i class="${complete ? 'ri-checkbox-circle-fill' : 'ri-time-line'}" aria-hidden="true"></i><span>${complete ? 'Lab complete — every step is checked and your reflection is recorded.' : 'Check off every step in your own Python environment, then record a short reflection.'}</span></div>`;
}

function aim07LabPanel() {
  return `
    <ol class="aim-lab-steps">${AIM07_LAB_STEPS.map(aim07LabStepItem).join('')}</ol>
    <div class="aim-reflection">
      <label for="aim07-reflection">Explain in writing why accuracy alone was misleading on this 5%-positive-class dataset, and which metric told the real story.</label>
      <textarea id="aim07-reflection" data-aim07-reflection rows="4">${esc(aim07State.reflection)}</textarea>
      <small>Write at least a couple of sentences — this is your evidence that the lab was actually completed.</small>
    </div>
    ${aim07LabStatus()}
  `;
}

/* -------------------------------------------------------------- shell */

function aim07Sections() {
  const labComplete = AIM07_LAB_STEPS.every((step) => aim07State.stepsDone[step.id]) && aim07State.reflection.trim().length >= 40;
  return [
    { id: 'aim07-lessons', title: 'Lessons', type: 'lecture', isComplete: true, scrollId: 'aim07-lessons' },
    { id: 'aim07-knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: Boolean(aim07QuizState?.passed), scrollId: 'aim07-knowledge-check' },
    { id: 'aim07-lab', title: 'Hands-On Lab', type: 'lab', isComplete: labComplete, scrollId: 'aim07-lab' },
  ];
}

function viewAiMlModuleSeven(user, program) {
  aim07Load(user);
  const module = program.modules['aim-07'];

  return `<div class="aim-shell">
    ${moduleTopbar(user, program)}
    ${moduleProgressShell(aim07Sections(), { reviewMode: aim07State.reviewMode })}
    <main class="aim-main">
      <section class="aim-hero" aria-labelledby="aim07-title">
        <div>
          <p class="aim-kicker">Module 07 · ${formatInstructionalMinutes(module.durationMinutes)} · Week 4</p>
          <h1 id="aim07-title">${esc(module.title)}</h1>
          <p class="aim-lede">${esc(module.summary)}</p>
        </div>
        <dl class="aim-progress" aria-label="Saved module progress">
          <div><dt>Lessons</dt><dd>${module.lessons}</dd></div>
          <div><dt>Hands-on labs</dt><dd>${module.labs}</dd></div>
        </dl>
      </section>

      <section class="aim-objective" aria-labelledby="aim07-objective-title"><span><i class="ri-focus-2-line" aria-hidden="true"></i></span><div><p class="aim-kicker">One measurable objective</p><h2 id="aim07-objective-title">Select, calculate, and interpret evaluation metrics appropriate to a problem; validate with cross-validation; tune hyperparameters without test-set leakage.</h2></div></section>

      <details class="aim-section-collapsible" id="aim07-lessons" ${aim07State.reviewMode ? 'open' : 'open'}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>1</span><div><p class="aim-kicker">Learn</p><h2>Five core lessons</h2></div></div></summary>
        <div class="aim-section-body">
          <p class="aim-instruction">Open each lesson for the full walkthrough, then work its Try It Yourself exercise in your own Python environment.</p>
          <div class="aim-lesson-grid">${AIM07_LESSONS.map(aim07LessonCard).join('')}</div>
        </div>
      </details>

      <details class="aim-section-collapsible" id="aim07-blanks" ${aim07State.reviewMode ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>2</span><div><p class="aim-kicker">Vocabulary drill</p><h2>Fill in the blank</h2></div></div></summary>
        <div class="aim-section-body">${aim07BlankDrill()}</div>
      </details>

      <details class="aim-section-collapsible" id="aim07-knowledge-check" ${aim07State.reviewMode || (aim07QuizState && !aim07QuizState.passed) ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>3</span><div><p class="aim-kicker">Interactive knowledge check</p><h2>Test your understanding</h2></div></div></summary>
        <div class="aim-section-body"><div id="aim07-quiz-dynamic">${aim07QuizPanel()}</div></div>
      </details>

      <details class="aim-section-collapsible" id="aim07-lab" ${aim07State.reviewMode ? 'open' : 'open'}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>4</span><div><p class="aim-kicker">Hands-on · your own environment</p><h2>Model Evaluation, Validation &amp; Tuning</h2></div></div></summary>
        <div class="aim-section-body">
          <p class="aim-instruction">Work both labs in your own Python environment: evaluate a model on imbalanced data and discover why accuracy was misleading, then run cross-validated hyperparameter tuning while respecting the train/validation/test boundary. Check off each step below as you complete it.</p>
          <div id="aim07-lab-dynamic">${aim07LabPanel()}</div>
        </div>
      </details>

      <details class="aim-section-collapsible" id="aim07-sources" ${aim07State.reviewMode ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>5</span><div><p class="aim-kicker">Supporting resources</p><h2>Further reading</h2></div></div></summary>
        <div class="aim-section-body">${moduleSourcesBlock(AIM07_SOURCES)}</div>
      </details>
    </main>
  </div>`;
}

/* -------------------------------------------------------------- render helpers */

function aim07RenderQuiz(focusId) {
  const el = document.getElementById('aim07-quiz-dynamic');
  if (!el) return;
  el.innerHTML = aim07QuizPanel();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function aim07RenderLab() {
  const el = document.getElementById('aim07-lab-dynamic');
  if (!el) return;
  el.innerHTML = aim07LabPanel();
}

function aim07CheckLabComplete(wasComplete) {
  const allDone = AIM07_LAB_STEPS.every((step) => aim07State.stepsDone[step.id]);
  const reflectionOk = aim07State.reflection.trim().length >= 40;
  const nowComplete = allDone && reflectionOk;
  if (nowComplete && !wasComplete) {
    if (typeof recordLabAttempt === 'function') recordLabAttempt(aim07User, AIM07_LAB_KEY, { state: 'complete', score: 100, result: { steps: AIM07_LAB_STEPS.length } });
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(aim07User, 'ai-ml', 'aim-07', AIM07_LAB_KEY);
  }
  return nowComplete;
}

/* -------------------------------------------------------------- wiring */

function wireAiMlModuleSeven() {
  const shell = document.querySelector('.aim-shell');
  if (!shell || !aim07State) return;

  shell.addEventListener('click', (event) => {
    if (event.target.closest('[data-mnav-review-toggle]')) {
      aim07State.reviewMode = !aim07State.reviewMode;
      aim07Save();
      render();
      return;
    }
    const blankCheck = event.target.closest('[data-aim07-blank-check]');
    if (blankCheck) {
      const id = blankCheck.dataset.aim07BlankCheck;
      const blank = AIM07_BLANKS.find((b) => b.id === id);
      const input = shell.querySelector(`[data-aim07-blank-input="${id}"]`);
      const given = (input?.value || '').trim().toLowerCase();
      aim07State.blankResults[id] = blank.accept.some((accepted) => accepted.toLowerCase() === given);
      aim07Save();
      const item = shell.querySelector(`[data-aim07-blank="${id}"]`);
      if (item) item.outerHTML = aim07BlankItem(blank);
      return;
    }
    const retry = event.target.closest('[data-aim07-quiz-retry]');
    if (retry) {
      const previousQuestionIds = aim07QuizState.selectedQuestions.map((s) => s.question.id);
      const selection = selectQuizQuestions(AIM07_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
      aim07QuizState = { selectedQuestions: selection.selectedQuestions, questionsByAnswer: selection.questionsByAnswer, answers: {}, scored: false, attempts: aim07QuizState.attempts, score: 0, bestScore: aim07QuizState.bestScore, feedback: [], passed: false };
      aim07State.lastQuizQuestionIds = previousQuestionIds;
      aim07Save();
      aim07RenderQuiz('aim07-quiz-title');
    }
  });

  shell.addEventListener('input', (event) => {
    if (event.target.matches('[data-aim07-blank-input]')) {
      const id = event.target.dataset.aim07BlankInput;
      aim07State.blankAnswers[id] = event.target.value;
      aim07Save();
      return;
    }
    if (event.target.matches('[data-aim07-reflection]')) {
      const wasComplete = AIM07_LAB_STEPS.every((step) => aim07State.stepsDone[step.id]) && aim07State.reflection.trim().length >= 40;
      aim07State.reflection = event.target.value;
      aim07CheckLabComplete(wasComplete);
      aim07Save();
    }
  });

  shell.addEventListener('change', (event) => {
    if (event.target.matches('[data-aim07-step]')) {
      const wasComplete = AIM07_LAB_STEPS.every((step) => aim07State.stepsDone[step.id]) && aim07State.reflection.trim().length >= 40;
      const id = event.target.dataset.aim07Step;
      aim07State.stepsDone[id] = event.target.checked;
      aim07CheckLabComplete(wasComplete);
      aim07Save();
      aim07RenderLab();
      return;
    }
    if (event.target.matches('[data-aim07-quiz-answer]')) {
      const questionId = event.target.closest('[data-question-id]')?.dataset.questionId;
      if (questionId) {
        aim07QuizState.answers[questionId] = event.target.value;
        aim07State.lastQuizQuestionIds = aim07QuizState.selectedQuestions.map((s) => s.question.id);
        aim07Save();
        aim07RenderQuiz();
      }
    }
  });

  shell.addEventListener('submit', (event) => {
    if (event.target.id !== 'aim07-quiz-form') return;
    event.preventDefault();
    const result = scoreQuizAttempt(aim07QuizState.selectedQuestions, aim07QuizState.questionsByAnswer, aim07QuizState.answers);
    aim07QuizState.attempts += 1;
    aim07QuizState.score = result.score;
    aim07QuizState.bestScore = Math.max(aim07QuizState.bestScore || 0, result.score);
    aim07QuizState.feedback = result.feedback;
    aim07QuizState.passed = result.score >= 70;
    aim07QuizState.scored = true;
    if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(aim07User, 'aim-07-knowledge-check', { state: aim07QuizState.passed ? 'complete' : 'in_progress', score: result.score });
    }
    aim07Save();
    aim07RenderQuiz('aim07-quiz-feedback');
  });
}

registerModuleLab({
  program: 'ai-ml',
  moduleNumber: 7,
  moduleKey: 'aim-07',
  view: viewAiMlModuleSeven,
  wire: wireAiMlModuleSeven,
});
