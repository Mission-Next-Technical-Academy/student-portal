/* Module 05 — Supervised Learning: Regression & Classification ('ai-ml').
 * Content authored from AI_ML_ENGINEERING_CURRICULUM.md (2026-09-10).
 * Labs run in the student's own real Python environment (no in-portal code
 * execution sandbox exists) — completion is tracked as a guided step
 * checklist plus short written reflections, evidence-based like
 * it-support-module-01.js's Lab 1.1, not a simulated console.
 * Reference implementation follows ai-ml-module-01.js pattern.
 */

const AIM05_LESSONS = [
  {
    id: 'aim05-lesson-01', number: '5.1', icon: 'ri-bar-chart-2-line',
    title: 'Supervised Learning Framing', minutes: 60,
    learn: [
      'The structure of supervised learning: features, targets, and training vs. inference',
      'Why train/test splits exist and how they protect against overfitting',
      'The core scikit-learn estimator API: .fit(), .predict(), .score()',
    ],
    topics: [
      { heading: 'Features, Targets, and Data Shapes', body: 'In supervised learning, your dataset splits into features (independent variables) and a target (the thing you\'re predicting). A feature matrix X has shape (n_samples, n_features); a target vector y has shape (n_samples,). During training you have both X and y; during inference (prediction) you have only X and produce predictions.' },
      { heading: 'Train/Test Split and Overfitting', body: 'A model trained and tested on the same data will always overstate its real-world performance — it has already seen those answers. The standard defense is to split your data, train on one part, and evaluate on a held-out part it has never seen. This split reveals whether the model is memorizing training data (overfitting) or learning a generalizable pattern.' },
      { heading: 'The Estimator Interface', body: 'scikit-learn\'s .fit(X_train, y_train) learns parameters from labeled data; .predict(X_test) produces predictions on new data; .score(X_test, y_test) computes an accuracy metric automatically. This consistent interface is why scikit-learn is so powerful — every regression and classification algorithm speaks the same API.' },
    ],
    practice: [
      'Create a train/test split at 80/20 on a small dataset using sklearn.model_selection.train_test_split.',
      'Fit a simple model on the training set and call .score() on both training and test sets. Which score is usually higher, and why?',
    ],
    comingUp: 'The regression and classification labs both use this train/test pattern and the .fit()/.predict()/.score() API.',
  },
  {
    id: 'aim05-lesson-02', number: '5.2', icon: 'ri-line-chart-line',
    title: 'Linear Regression', minutes: 55,
    learn: [
      'How linear regression models a continuous target as a linear combination of features',
      'What a coefficient means and how to interpret it in business terms',
      'How to read and use R², residuals, and other diagnostic metrics',
    ],
    topics: [
      { heading: 'Coefficients and Linear Relationships', body: 'Linear regression fits y ≈ w₀ + w₁·x₁ + w₂·x₂ + … — each coefficient w_i tells you the expected change in y for a one-unit increase in feature x_i, holding all others constant. A coefficient of 2.5 for years_experience means "each additional year is associated with a 2.5-unit increase in predicted salary" — not a guarantee, but the fitted relationship in the data.' },
      { heading: 'R² and Residuals', body: 'R² (coefficient of determination) ranges from 0 to 1 and measures what fraction of y\'s variance the model explains. Residuals are the differences between actual and predicted values — plotting residuals against predictions can reveal non-linearity, heteroscedasticity, and other assumption violations that the summary R² alone won\'t show.' },
      { heading: 'Assumptions and Diagnostics', body: 'Linear regression assumes a linear relationship between features and target, normally distributed errors, and no multicollinearity (features not highly correlated with each other). Violating these does not make the model "wrong" — it just shifts what the coefficients and p-values truly mean. Always plot and inspect, don\'t trust summaries blindly.' },
    ],
    practice: [
      'Fit a linear regression on a dataset with 3+ features and print the coefficients. Pick one and write a plain-language interpretation.',
      'Compute R² and compare it to R² of a "predict the mean" baseline model. The difference shows how much the features helped.',
    ],
    comingUp: 'Lab 1 walks through exactly this: fitting, interpreting coefficients, and comparing against a baseline.',
  },
  {
    id: 'aim05-lesson-03', number: '5.3', icon: 'ri-percent-line',
    title: 'Logistic Regression', minutes: 50,
    learn: [
      'Logistic regression as probability estimation, not hard classification',
      'Log-odds, sigmoid curves, and how 0.5 threshold turns probabilities into labels',
      'Why you sometimes want thresholds other than 0.5, especially in cost-sensitive scenarios',
    ],
    topics: [
      { heading: 'Probabilities and the Sigmoid', body: 'Logistic regression does not predict classes directly — it predicts probabilities. The sigmoid function transforms a linear combination of features into a value between 0 and 1, which you can interpret as "probability of the positive class." A prediction of 0.7 means "70% chance this is class 1" — that is the raw output.' },
      { heading: 'The Decision Threshold', body: 'By default, logistic regression uses 0.5: if predicted probability ≥ 0.5, predict class 1; else class 0. But this is just a choice. In fraud detection, missing a fraud case might cost you $10,000 while a false alarm costs $10 — you could lower the threshold to 0.2 to catch more fraud, accepting more false positives as a tradeoff.' },
      { heading: 'Cost-Sensitive Classification', body: 'Different problems have different costs. A medical test might prioritize recall (catching every true positive) over precision (every positive is real). Precision-recall tradeoffs are controlled by the threshold, and scikit-learn gives you access to the raw probabilities so you can choose the threshold that fits your problem\'s economics.' },
    ],
    practice: [
      'Fit a logistic regression on a binary classification dataset and call .predict_proba() to see the raw probabilities.',
      'Manually threshold the probabilities at 0.3, 0.5, and 0.7 and compare the resulting precision and recall using sklearn.metrics.',
    ],
    comingUp: 'Lab 2 trains both logistic regression and a decision tree on the same data and compares their predictions.',
  },
  {
    id: 'aim05-lesson-04', number: '5.4', icon: 'ri-share-tree-2-line',
    title: 'Decision Trees', minutes: 55,
    learn: [
      'How decision trees recursively split data to minimize impurity (Gini or entropy)',
      'The bias/variance tradeoff: depth controls it, and overfitting is a tree\'s classic failure mode',
      'Pruning and hyperparameter tuning to find the right complexity',
    ],
    topics: [
      { heading: 'Splits and Impurity', body: 'A decision tree partitions the feature space with a series of yes/no questions (e.g., "is feature 2 > 15?"). Each split aims to separate the classes as cleanly as possible, measured by impurity metrics: Gini index (how likely a random sample is misclassified) and entropy (information-theoretic uncertainty). Lower impurity = better split.' },
      { heading: 'Depth, Overfitting, and the Bias/Variance Tradeoff', body: 'A shallow tree (depth=2) makes simple assumptions and rarely overfits but may underfit (high bias, low variance). A deep tree (depth=100) memorizes training data perfectly but fails on test data (low bias, high variance). The right depth is usually somewhere in the middle, found via cross-validation.' },
      { heading: 'Pruning and Hyperparameters', body: 'Instead of growing a tree and then cutting branches (pruning), scikit-learn lets you control max_depth, min_samples_split, and min_samples_leaf upfront. These hyperparameters prevent overgrowth and are tuned via grid search or random search.' },
    ],
    practice: [
      'Train a decision tree with max_depth=2, 5, 10 on a classification dataset. Plot or print the trees and observe how deeper trees split more finely.',
      'Compare training accuracy vs. test accuracy at each depth to spot where overfitting begins.',
    ],
    comingUp: 'Lab 2 includes a decision tree baseline and Lab 3 will compare it against an ensemble.',
  },
  {
    id: 'aim05-lesson-05', number: '5.5', icon: 'ri-group-line',
    title: 'Ensemble Methods', minutes: 60,
    learn: [
      'Bagging (bootstrap aggregating) and random forests: training many trees on random subsets and averaging their predictions',
      'Boosting (gradient boosting, AdaBoost) and why sequentially correcting errors can outperform averaging',
      'When and why ensembles reduce variance and often beat a single model',
    ],
    topics: [
      { heading: 'Bagging and Random Forests', body: 'Bagging trains many models on random samples with replacement from the training set and averages their predictions. Random forests extend this by also randomizing which features each tree considers at each split — this decorrelates the trees further. Many weak, slightly different models average out noise better than one complex model.' },
      { heading: 'Boosting and Gradient Boosting', body: 'Boosting trains models sequentially, each one focusing on samples the previous one got wrong. Gradient boosting (implemented in scikit-learn via GradientBoostingClassifier/Regressor) builds a sequence of trees that correct each other\'s mistakes, often achieving state-of-the-art performance on tabular data. The tradeoff is slower training and more hyperparameters to tune.' },
      { heading: 'Bias/Variance Redux: Why Ensembles Help', body: 'An ensemble of uncorrelated predictors has lower variance than any individual one. If each tree has high variance (overfits easily), training 100 of them on different data and averaging their predictions reduces the variance significantly — the prediction is less likely to swing wildly with small changes in training data.' },
    ],
    practice: [
      'Train a random forest on a dataset and compare its accuracy to a single decision tree. Is the ensemble more stable across random splits?',
      'Try gradient boosting on the same data. Which ensemble method performs better, and can you guess why?',
    ],
    comingUp: 'Lab 3 trains a random forest on the same data as Lab 2\'s single tree and compares stability.',
  },
  {
    id: 'aim05-lesson-06', number: '5.6', icon: 'ri-balance-line',
    title: 'Bias/Variance and Regularization', minutes: 50,
    learn: [
      'The bias/variance tradeoff formalized: bias (underfitting), variance (overfitting), and the sweet spot',
      'L1 (Lasso) and L2 (Ridge) regularization penalize large coefficients to reduce overfitting',
      'How to choose regularization strength and when to use each',
    ],
    topics: [
      { heading: 'Bias and Variance', body: 'Bias is the error from oversimplifying (e.g., fitting a line to data that is quadratic). Variance is the error from overfitting to noise — the model is highly sensitive to which training samples it sees. The total error (bias² + variance + irreducible noise) is minimized somewhere in between, and that sweet spot depends on data size and problem complexity.' },
      { heading: 'L1 and L2 Regularization', body: 'L2 regularization (Ridge) adds a penalty proportional to the squared coefficients, shrinking all coefficients toward zero but not eliminating them — good for multicollinearity. L1 regularization (Lasso) penalizes the absolute value of coefficients, often shrinking some to exactly zero, performing feature selection — useful when you suspect many features are irrelevant. Elastic Net combines both.' },
      { heading: 'Tuning the Regularization Strength', body: 'Regularization strength is controlled by a hyperparameter (alpha, C, or lambda depending on the library). Small values mean weak regularization (high variance risk), large values mean strong regularization (high bias risk). Cross-validation sweeps over a grid of values to find the best balance for your data.' },
    ],
    practice: [
      'Fit a Ridge regression and a Lasso regression on a dataset with many features. Compare how many coefficients are exactly zero (Lasso) vs. just small (Ridge).',
      'Use sklearn.linear_model.LassoCV or RidgeCV to automatically select the best regularization strength via cross-validation.',
    ],
    comingUp: 'Lab 1 uses a linear regression; L2 regularization can improve it if features are correlated — try adding it to your implementation.',
  },
];

const AIM05_QUIZ_BANKS = [
  {
    conceptId: 'aim05-regression', conceptTitle: 'Regression', questions: [
      { id: 'aim05-q-reg-1', prompt: "In a linear regression, a coefficient of 2.5 on years_experience means, holding other features constant:", options: [
        { id: 'a', text: 'Experience explains 2.5% of the outcome' },
        { id: 'b', text: 'Each additional year of experience is associated with a 2.5-unit increase in the predicted target' },
        { id: 'c', text: 'The model is 2.5% accurate' },
        { id: 'd', text: 'Experience is the most important feature' },
      ], correctId: 'b', feedbackCorrect: 'Correct — a coefficient quantifies the linear relationship per unit increase in that feature, not the percentage of variance explained.', feedbackIncorrect: 'A coefficient of 2.5 means a one-unit increase in that feature is associated with a 2.5-unit increase in the predicted target value, holding all others constant.' },
    ],
  },
  {
    conceptId: 'aim05-classification', conceptTitle: 'Classification', questions: [
      { id: 'aim05-q-cls-1', prompt: 'Logistic regression outputs are BEST described as:', options: [
        { id: 'a', text: 'Guaranteed correct class labels' },
        { id: 'b', text: 'Estimated probabilities that are thresholded into a class' },
        { id: 'c', text: 'Raw counts' },
        { id: 'd', text: 'Cluster assignments' },
      ], correctId: 'b', feedbackCorrect: 'Correct — logistic regression outputs a probability (0–1) which is then converted to a class label using a threshold, usually 0.5.', feedbackIncorrect: 'Logistic regression outputs probabilities; the .predict() method applies a threshold (default 0.5) to turn those probabilities into class labels.' },
      { id: 'aim05-q-cls-2', prompt: 'A fraud-detection model has a default 0.5 classification threshold, but missing a fraud case is far costlier than a false alarm. The BEST adjustment is to:', options: [
        { id: 'a', text: 'Leave the threshold at 0.5 regardless of cost' },
        { id: 'b', text: 'Lower the threshold so more cases are flagged as fraud, accepting more false positives to catch more true positives' },
        { id: 'c', text: 'Raise the threshold to reduce all flags' },
        { id: 'd', text: 'Switch to an unrelated unsupervised method' },
      ], correctId: 'b', feedbackCorrect: 'Correct — lowering the threshold increases recall (catching more true frauds) at the cost of precision (more false alarms), a worthwhile tradeoff when fraud is very costly.', feedbackIncorrect: 'When missing a positive case is very expensive, lower the threshold so more cases are predicted positive; this increases recall even if it raises false-positive rate.' },
    ],
  },
  {
    conceptId: 'aim05-trees-ensembles', conceptTitle: 'Trees & ensembles', questions: [
      { id: 'aim05-q-te-1', prompt: 'A decision tree trained to unlimited depth on the training set shows near-perfect training accuracy but poor test accuracy. This is a textbook case of:', options: [
        { id: 'a', text: 'Underfitting' },
        { id: 'b', text: 'Overfitting' },
        { id: 'c', text: 'Data leakage' },
        { id: 'd', text: 'Class imbalance' },
      ], correctId: 'b', feedbackCorrect: 'Correct — the tree has memorized the training data (high training accuracy, low test accuracy), a classic sign of overfitting.', feedbackIncorrect: 'When training accuracy is near-perfect but test accuracy is poor, the model has overfit the training set — it has memorized noise rather than learning a generalizable pattern.' },
      { id: 'aim05-q-te-2', prompt: 'A random forest generally outperforms a single decision tree on unseen data MAINLY because it:', options: [
        { id: 'a', text: 'Uses a larger dataset automatically' },
        { id: 'b', text: 'Averages many decorrelated trees, reducing variance' },
        { id: 'c', text: 'Removes the need for a test set' },
        { id: 'd', text: 'Always trains faster' },
      ], correctId: 'b', feedbackCorrect: 'Correct — ensemble averaging reduces variance without increasing bias, so the combined prediction generalizes better than any single tree.', feedbackIncorrect: 'The ensemble advantage comes from averaging many slightly-different trees; this averaging cancels out random noise and overfitting that would hurt a single tree.' },
      { id: 'aim05-q-te-3', prompt: 'L2 regularization in linear/logistic regression primarily works by:', options: [
        { id: 'a', text: 'Removing features entirely' },
        { id: 'b', text: 'Penalizing large coefficient values to reduce overfitting' },
        { id: 'c', text: 'Increasing model depth' },
        { id: 'd', text: 'Balancing class labels' },
      ], correctId: 'b', feedbackCorrect: 'Correct — L2 regularization adds a penalty for large coefficients, encouraging the model to use all features but with smaller magnitudes, reducing overfitting.', feedbackIncorrect: 'L2 regularization penalizes large coefficient values, pushing them toward zero without eliminating them entirely — this reduces overfitting without feature selection.' },
    ],
  },
];

const AIM05_BLANKS = [
  { id: 'aim05-b1', prompt: '______ regression predicts a continuous numeric target, while ______ regression predicts a class probability.', accept: ['Linear; logistic', 'Linear, logistic', 'Linear and logistic'] },
  { id: 'aim05-b2', prompt: 'The tradeoff between a model that is too simple and one that is too complex is called the ______/______ tradeoff.', accept: ['bias; variance', 'bias, variance', 'bias and variance'] },
  { id: 'aim05-b3', prompt: 'A model that performs very well on training data but poorly on new data is ______.', accept: ['overfit', 'overfitting', 'overfitted'] },
  { id: 'aim05-b4', prompt: 'In scikit-learn, ______() trains a model on labeled data, and ______() produces predictions on new data.', accept: ['fit; predict', 'fit, predict', 'fit and predict'] },
];

const AIM05_SOURCES = [
  { title: 'scikit-learn documentation', org: 'scikit-learn', url: 'https://scikit-learn.org/stable/', note: 'Regression, classification, and ensemble estimator references and worked examples used across this and later modules.' },
];

const AIM05_LAB_ID = 'aim05-supervised-models-v1';
const AIM05_LAB_KEY = 'lab-aim-05-supervised-models';

const AIM05_LAB_STEPS = [
  { id: 'reg-train', label: 'Trained a linear regression model on a numeric dataset and inspected its coefficients.' },
  { id: 'reg-interpret', label: 'Interpreted at least three coefficients in plain language, relating each to the predicted target.' },
  { id: 'reg-baseline', label: 'Compared linear regression against a "predict the mean" baseline and reported the improvement in R² or MSE.' },
  { id: 'cls-train', label: 'Trained both logistic regression and a decision tree on the same binary classification dataset.' },
  { id: 'cls-compare', label: 'Compared predictions at the default 0.5 threshold and explained a scenario where a different threshold would be more appropriate.' },
  { id: 'ensemble-train', label: 'Trained a random forest on the same data as the decision tree and compared accuracy.' },
  { id: 'ensemble-stability', label: 'Evaluated ensemble stability across multiple train/test splits and documented the comparison in your reflection.' },
];

const AIM05_DEFAULT_STATE = {
  stepsDone: {}, reflection: '', reflectionChecked: false,
  reviewMode: false,
  blankAnswers: {}, blankResults: {},
};

let aim05State = null;
let aim05User = null;
let aim05QuizState = null;

function aim05Load(user) {
  aim05User = user;
  aim05State = LabRuntime.load(AIM05_LAB_ID, user, AIM05_DEFAULT_STATE);
  if (!aim05State.stepsDone || typeof aim05State.stepsDone !== 'object') aim05State.stepsDone = {};
  if (!aim05State.blankAnswers) aim05State.blankAnswers = {};
  if (!aim05State.blankResults) aim05State.blankResults = {};

  if (!aim05QuizState) {
    const previousQuestionIds = aim05State.lastQuizQuestionIds || [];
    const selection = selectQuizQuestions(AIM05_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    aim05QuizState = {
      selectedQuestions: selection.selectedQuestions,
      questionsByAnswer: selection.questionsByAnswer,
      answers: {}, scored: false, attempts: 0, score: 0, bestScore: 0, feedback: [], passed: false,
    };
  }

  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'ai-ml', 'aim-05');
  return aim05State;
}

function aim05Save() {
  if (aim05User && aim05State) LabRuntime.save(AIM05_LAB_ID, aim05User, aim05State);
}

/* -------------------------------------------------------------- lessons */

function aim05LessonCard(lesson) {
  return `<details class="aim-lesson" data-aim05-lesson="${esc(lesson.id)}" ${aim05State.reviewMode ? 'open' : ''}>
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

function aim05BlankItem(blank) {
  const value = aim05State.blankAnswers[blank.id] || '';
  const result = aim05State.blankResults[blank.id];
  const statusClass = result === true ? 'is-correct' : result === false ? 'is-incorrect' : '';
  return `<li class="aim-blank-item ${statusClass}" data-aim05-blank="${esc(blank.id)}">
    <p class="aim-blank-prompt">${esc(blank.prompt)}</p>
    <div class="aim-blank-row">
      <input type="text" value="${esc(value)}" data-aim05-blank-input="${esc(blank.id)}" aria-label="Your answer" autocomplete="off" />
      <button type="button" class="aim-blank-check" data-aim05-blank-check="${esc(blank.id)}">Check</button>
    </div>
    ${result === true ? '<p class="aim-blank-result">Correct.</p>' : ''}
    ${result === false ? `<p class="aim-blank-result">Not quite — expected: ${esc(blank.accept[0])}</p>` : ''}
  </li>`;
}

function aim05BlankDrill() {
  return `<ul class="aim-blank-list">${AIM05_BLANKS.map(aim05BlankItem).join('')}</ul>`;
}

/* -------------------------------------------------------------- quiz */

function aim05QuizQuestion(selected, index) {
  const question = selected.question;
  const userAnswerId = aim05QuizState?.answers?.[question.id];
  return `<fieldset class="aim-quiz-question" data-question-id="${esc(question.id)}">
    <legend><span>${index + 1}</span> ${esc(selected.conceptTitle)}: ${esc(question.prompt)}</legend>
    <div class="aim-quiz-options">
      ${selected.shuffledOptions.map((option) => `<label>
        <input type="radio" name="q-${esc(question.id)}" value="${esc(option.id)}" ${userAnswerId === option.id ? 'checked' : ''} data-aim05-quiz-answer />
        <span>${esc(option.text)}</span>
      </label>`).join('')}
    </div>
  </fieldset>`;
}

function aim05QuizPanel() {
  if (!aim05QuizState?.selectedQuestions || aim05QuizState.selectedQuestions.length === 0) {
    return `<div class="aim-quiz-empty" id="aim05-quiz-feedback" role="status">Loading quiz…</div>`;
  }
  const selected = aim05QuizState.selectedQuestions;
  const answered = Object.keys(aim05QuizState.answers || {}).length;
  const total = selected.length;

  let feedbackHtml = '';
  if (aim05QuizState.scored) {
    const passed = aim05QuizState.score >= 70;
    feedbackHtml = `<section class="aim-quiz-score ${passed ? 'aim-quiz-pass' : 'aim-quiz-remediate'}" id="aim05-quiz-feedback" tabindex="-1" aria-live="polite">
      <div class="aim-quiz-score-heading">
        <div><p class="aim-kicker">Attempt ${aim05QuizState.attempts} · best ${aim05QuizState.bestScore}/100</p><h3>${aim05QuizState.score}/100 — ${passed ? 'Knowledge check passed' : 'Review and retry'}</h3></div>
        <span>${aim05QuizState.score}</span>
      </div>
      <ul class="aim-quiz-feedback-list">${(aim05QuizState.feedback || []).map((fb) => `<li>
        <i class="ri-${fb.correct ? 'checkbox-circle-fill' : 'information-line'}" aria-hidden="true"></i>
        <div><strong>${fb.correct ? 'Correct' : 'Review'}</strong><p>${esc(fb.message)}</p></div>
      </li>`).join('')}</ul>
      ${!passed ? `<div class="aim-quiz-actions"><button type="button" class="aim-quiz-retry" data-aim05-quiz-retry><i class="ri-refresh-line" aria-hidden="true"></i> Try different questions</button></div>` : ''}
    </section>`;
  } else if (answered === total) {
    feedbackHtml = `<div class="aim-quiz-ready" id="aim05-quiz-feedback" role="status">All questions answered. Submit to check your responses.</div>`;
  } else {
    feedbackHtml = `<div class="aim-quiz-empty" id="aim05-quiz-feedback" role="status">Answer all ${total} questions to submit.</div>`;
  }

  return `<form class="aim-quiz-form" id="aim05-quiz-form" novalidate>
    <div class="aim-panel-heading"><div><p class="aim-kicker">Knowledge check</p><h3>Test your understanding of supervised learning</h3></div><span>${answered}/${total} answered</span></div>
    ${selected.map((sel, idx) => aim05QuizQuestion(sel, idx)).join('')}
    <div class="aim-quiz-actions">
      <button class="aim-quiz-submit" type="submit" ${answered < total ? 'disabled' : ''}><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Check my answers</button>
    </div>
    ${feedbackHtml}
  </form>`;
}

/* -------------------------------------------------------------- lab */

function aim05LabStepItem(step) {
  const done = Boolean(aim05State.stepsDone[step.id]);
  return `<li class="aim-lab-step ${done ? 'is-done' : ''}"><input type="checkbox" id="aim05-step-${esc(step.id)}" data-aim05-step="${esc(step.id)}" ${done ? 'checked' : ''} /><label for="aim05-step-${esc(step.id)}"><span>${esc(step.label)}</span></label></li>`;
}

function aim05LabStatus() {
  const allDone = AIM05_LAB_STEPS.every((step) => aim05State.stepsDone[step.id]);
  const reflectionOk = aim05State.reflection.trim().length >= 40;
  const complete = allDone && reflectionOk;
  return `<div class="aim-lab-status ${complete ? 'aim-status-pass' : 'aim-status-pending'}"><i class="${complete ? 'ri-checkbox-circle-fill' : 'ri-time-line'}" aria-hidden="true"></i><span>${complete ? 'Lab complete — every step is checked and your reflection is recorded.' : 'Check off every step in your own Python environment, then record a short reflection.'}</span></div>`;
}

function aim05LabPanel() {
  return `
    <ol class="aim-lab-steps">${AIM05_LAB_STEPS.map(aim05LabStepItem).join('')}</ol>
    <div class="aim-reflection">
      <label for="aim05-reflection">Explain in writing why the random forest ensemble was more stable across different train/test splits than the single decision tree.</label>
      <textarea id="aim05-reflection" data-aim05-reflection rows="4">${esc(aim05State.reflection)}</textarea>
      <small>Write at least a couple of sentences — this is your evidence that the lab was actually completed.</small>
    </div>
    ${aim05LabStatus()}
  `;
}

/* -------------------------------------------------------------- shell */

function aim05Sections() {
  const labComplete = AIM05_LAB_STEPS.every((step) => aim05State.stepsDone[step.id]) && aim05State.reflection.trim().length >= 40;
  return [
    { id: 'aim05-lessons', title: 'Foundations', type: 'lecture', isComplete: true, scrollId: 'aim05-lessons' },
    { id: 'aim05-knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: Boolean(aim05QuizState?.passed), scrollId: 'aim05-knowledge-check' },
    { id: 'aim05-lab', title: 'Hands-On Lab', type: 'lab', isComplete: labComplete, scrollId: 'aim05-lab' },
  ];
}

function viewAiMlModuleFive(user, program) {
  aim05Load(user);
  const module = program.modules['aim-05'];

  return `<div class="aim-shell">
    ${moduleTopbar(user, program)}
    ${moduleProgressShell(aim05Sections(), { reviewMode: aim05State.reviewMode })}
    <main class="aim-main">
      <section class="aim-hero" aria-labelledby="aim05-title">
        <div>
          <p class="aim-kicker">Module 05 · ${formatInstructionalMinutes(module.durationMinutes)} · Week 3</p>
          <h1 id="aim05-title">${esc(module.title)}</h1>
          <p class="aim-lede">${esc(module.summary)}</p>
        </div>
        <dl class="aim-progress" aria-label="Saved module progress">
          <div><dt>Lessons</dt><dd>${module.lessons}</dd></div>
          <div><dt>Hands-on labs</dt><dd>${module.labs}</dd></div>
        </dl>
      </section>

      <section class="aim-objective" aria-labelledby="aim05-objective-title"><span><i class="ri-focus-2-line" aria-hidden="true"></i></span><div><p class="aim-kicker">One measurable objective</p><h2 id="aim05-objective-title">Build, train, and interpret supervised-learning models — linear and logistic regression, decision trees, and ensembles — and apply them to real regression and classification problems.</h2></div></section>

      <details class="aim-section-collapsible" id="aim05-lessons" ${aim05State.reviewMode ? 'open' : 'open'}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>1</span><div><p class="aim-kicker">Learn</p><h2>Six core lessons</h2></div></div></summary>
        <div class="aim-section-body">
          <p class="aim-instruction">Open each lesson for the full walkthrough, then work its Try It Yourself exercise in your own Python environment using scikit-learn.</p>
          <div class="aim-lesson-grid">${AIM05_LESSONS.map(aim05LessonCard).join('')}</div>
        </div>
      </details>

      <details class="aim-section-collapsible" id="aim05-blanks" ${aim05State.reviewMode ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>2</span><div><p class="aim-kicker">Vocabulary drill</p><h2>Fill in the blank</h2></div></div></summary>
        <div class="aim-section-body">${aim05BlankDrill()}</div>
      </details>

      <details class="aim-section-collapsible" id="aim05-knowledge-check" ${aim05State.reviewMode || (aim05QuizState && !aim05QuizState.passed) ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>3</span><div><p class="aim-kicker">Interactive knowledge check</p><h2>Test your understanding</h2></div></div></summary>
        <div class="aim-section-body"><div id="aim05-quiz-dynamic">${aim05QuizPanel()}</div></div>
      </details>

      <details class="aim-section-collapsible" id="aim05-lab" ${aim05State.reviewMode ? 'open' : 'open'}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>4</span><div><p class="aim-kicker">Hands-on · your own environment</p><h2>Regression, Classification &amp; Ensembles</h2></div></div></summary>
        <div class="aim-section-body">
          <p class="aim-instruction">Work all three labs in your own Python environment: train regression and classification models, compare predictions and thresholds, then evaluate ensemble stability. Check off each step below as you complete it.</p>
          <div id="aim05-lab-dynamic">${aim05LabPanel()}</div>
        </div>
      </details>

      <details class="aim-section-collapsible" id="aim05-sources" ${aim05State.reviewMode ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>5</span><div><p class="aim-kicker">Supporting resources</p><h2>Further reading</h2></div></div></summary>
        <div class="aim-section-body">${moduleSourcesBlock(AIM05_SOURCES)}</div>
      </details>
    </main>
  </div>`;
}

/* -------------------------------------------------------------- render helpers */

function aim05RenderQuiz(focusId) {
  const el = document.getElementById('aim05-quiz-dynamic');
  if (!el) return;
  el.innerHTML = aim05QuizPanel();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function aim05RenderLab() {
  const el = document.getElementById('aim05-lab-dynamic');
  if (!el) return;
  el.innerHTML = aim05LabPanel();
}

function aim05CheckLabComplete(wasComplete) {
  const allDone = AIM05_LAB_STEPS.every((step) => aim05State.stepsDone[step.id]);
  const reflectionOk = aim05State.reflection.trim().length >= 40;
  const nowComplete = allDone && reflectionOk;
  if (nowComplete && !wasComplete) {
    if (typeof recordLabAttempt === 'function') recordLabAttempt(aim05User, AIM05_LAB_KEY, { state: 'complete', score: 100, result: { steps: AIM05_LAB_STEPS.length } });
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(aim05User, 'ai-ml', 'aim-05', AIM05_LAB_KEY);
  }
  return nowComplete;
}

/* -------------------------------------------------------------- wiring */

function wireAiMlModuleFive() {
  const shell = document.querySelector('.aim-shell');
  if (!shell || !aim05State) return;

  shell.addEventListener('click', (event) => {
    if (event.target.closest('[data-mnav-review-toggle]')) {
      aim05State.reviewMode = !aim05State.reviewMode;
      aim05Save();
      render();
      return;
    }
    const blankCheck = event.target.closest('[data-aim05-blank-check]');
    if (blankCheck) {
      const id = blankCheck.dataset.aim05BlankCheck;
      const blank = AIM05_BLANKS.find((b) => b.id === id);
      const input = shell.querySelector(`[data-aim05-blank-input="${id}"]`);
      const given = (input?.value || '').trim().toLowerCase();
      aim05State.blankResults[id] = blank.accept.some((accepted) => accepted.toLowerCase() === given);
      aim05Save();
      const item = shell.querySelector(`[data-aim05-blank="${id}"]`);
      if (item) item.outerHTML = aim05BlankItem(blank);
      return;
    }
    const retry = event.target.closest('[data-aim05-quiz-retry]');
    if (retry) {
      const previousQuestionIds = aim05QuizState.selectedQuestions.map((s) => s.question.id);
      const selection = selectQuizQuestions(AIM05_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
      aim05QuizState = { selectedQuestions: selection.selectedQuestions, questionsByAnswer: selection.questionsByAnswer, answers: {}, scored: false, attempts: aim05QuizState.attempts, score: 0, bestScore: aim05QuizState.bestScore, feedback: [], passed: false };
      aim05State.lastQuizQuestionIds = previousQuestionIds;
      aim05Save();
      aim05RenderQuiz('aim05-quiz-title');
    }
  });

  shell.addEventListener('input', (event) => {
    if (event.target.matches('[data-aim05-blank-input]')) {
      const id = event.target.dataset.aim05BlankInput;
      aim05State.blankAnswers[id] = event.target.value;
      aim05Save();
      return;
    }
    if (event.target.matches('[data-aim05-reflection]')) {
      const wasComplete = AIM05_LAB_STEPS.every((step) => aim05State.stepsDone[step.id]) && aim05State.reflection.trim().length >= 40;
      aim05State.reflection = event.target.value;
      aim05CheckLabComplete(wasComplete);
      aim05Save();
    }
  });

  shell.addEventListener('change', (event) => {
    if (event.target.matches('[data-aim05-step]')) {
      const wasComplete = AIM05_LAB_STEPS.every((step) => aim05State.stepsDone[step.id]) && aim05State.reflection.trim().length >= 40;
      const id = event.target.dataset.aim05Step;
      aim05State.stepsDone[id] = event.target.checked;
      aim05CheckLabComplete(wasComplete);
      aim05Save();
      aim05RenderLab();
      return;
    }
    if (event.target.matches('[data-aim05-quiz-answer]')) {
      const questionId = event.target.closest('[data-question-id]')?.dataset.questionId;
      if (questionId) {
        aim05QuizState.answers[questionId] = event.target.value;
        aim05State.lastQuizQuestionIds = aim05QuizState.selectedQuestions.map((s) => s.question.id);
        aim05Save();
        aim05RenderQuiz();
      }
    }
  });

  shell.addEventListener('submit', (event) => {
    if (event.target.id !== 'aim05-quiz-form') return;
    event.preventDefault();
    const result = scoreQuizAttempt(aim05QuizState.selectedQuestions, aim05QuizState.questionsByAnswer, aim05QuizState.answers);
    aim05QuizState.attempts += 1;
    aim05QuizState.score = result.score;
    aim05QuizState.bestScore = Math.max(aim05QuizState.bestScore || 0, result.score);
    aim05QuizState.feedback = result.feedback;
    aim05QuizState.passed = result.score >= 70;
    aim05QuizState.scored = true;
    if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(aim05User, 'aim-05-knowledge-check', { state: aim05QuizState.passed ? 'complete' : 'in_progress', score: result.score });
    }
    aim05Save();
    aim05RenderQuiz('aim05-quiz-feedback');
  });
}

registerModuleLab({
  program: 'ai-ml',
  moduleNumber: 5,
  moduleKey: 'aim-05',
  view: viewAiMlModuleFive,
  wire: wireAiMlModuleFive,
});
