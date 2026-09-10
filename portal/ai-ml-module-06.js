/* Module 06 — Unsupervised Learning & Feature Engineering ('ai-ml').
 * Content authored from AI_ML_ENGINEERING_CURRICULUM.md (2026-09-10).
 * Labs run in the student's own real Python environment (no in-portal code
 * execution sandbox exists) — completion is tracked as a guided step
 * checklist plus short written reflections, evidence-based like
 * it-support-module-01.js's Lab 1.1.
 * Reference implementation pattern from ai-ml-module-01.js.
 */

const AIM06_LESSONS = [
  {
    id: 'aim06-lesson-01', number: '6.1', icon: 'ri-lightbulb-line',
    title: 'Unsupervised Learning & Finding Structure', minutes: 60,
    learn: [
      'Why unsupervised learning is essential when you have data but no labels',
      'The difference between clustering, dimensionality reduction, and feature engineering',
      'When to reach for each technique based on your data and research question',
    ],
    topics: [
      { heading: 'The Unsupervised Setting', body: 'Unsupervised learning tackles data that has no target label — a bank has customer transaction records but no assigned "segments," or a hospital has patient test results but no diagnosis ground truth. Your goal is to find structure: patterns, groups, or compressed representations that reveal something new about the data.' },
      { heading: 'Three Pillars', body: 'Clustering groups similar rows together (k-means, hierarchical clustering). Dimensionality reduction compresses many features into fewer without losing essential information (PCA). Feature engineering creates or transforms raw features to make them more useful downstream — scaling, encoding, interactions.' },
      { heading: 'Choosing a Technique', body: 'Start by asking: Do I want to group rows (clustering), compress features (dimensionality reduction), or improve my raw data (feature engineering)? Often you use all three in the same pipeline — standardize and one-hot encode, run PCA to reduce noise, then cluster the result.' },
    ],
    practice: [
      'Look at a dataset with no labels. What structure questions would you ask? Could you answer them with clustering, dimensionality reduction, or feature engineering?',
      'Sketch a pipeline that chains a scaler, one-hot encoder, and dimensionality reduction in sequence.',
    ],
    comingUp: 'Your first hands-on lab will standardize a dataset and cluster it with k-means — this is all three pillars in one exercise.',
  },
  {
    id: 'aim06-lesson-02', number: '6.2', icon: 'ri-bubble-chart-line',
    title: 'K-Means Clustering & Choosing K', minutes: 75,
    learn: [
      'How k-means assigns points to k centroids and iterates until convergence',
      'Why the "elbow method" and silhouette score help you pick the right k',
      'How to interpret cluster membership and profile each cluster in plain language',
    ],
    topics: [
      { heading: 'How K-Means Works', body: 'K-means picks k random centroids, assigns each point to the nearest centroid (hard assignment), recomputes centroids as the mean of all points in each cluster, and repeats until assignments stop changing. It minimizes within-cluster variance — the total squared distance from each point to its cluster\'s centroid. It is fast, interpretable, and requires a specified k.' },
      { heading: 'Elbow Method', body: 'Run k-means for k=1, 2, 3, … and plot within-cluster variance (inertia) against k. As k increases, inertia always decreases — more clusters fit the data better. The "elbow" is the k where inertia stops dropping steeply, suggesting diminishing returns beyond that point.' },
      { heading: 'Silhouette Score', body: 'For each point, measure how much closer it is to its own cluster than to the nearest other cluster (range -1 to 1; higher is better). A silhouette score near 0 means clusters overlap significantly. Score near +1 means well-separated clusters. Use it alongside the elbow method to validate your k choice.' },
    ],
    practice: [
      'Generate a small dataset, run k-means with k=2, 3, 4, and plot inertia against k. Where is the elbow?',
      'For the same dataset, compute silhouette scores for each k. Does the best silhouette score match your elbow choice?',
    ],
    comingUp: 'The first hands-on lab will have you implement both the elbow method and silhouette score on a real customer segmentation dataset.',
  },
  {
    id: 'aim06-lesson-03', number: '6.3', icon: 'ri-compress-line',
    title: 'Dimensionality Reduction with PCA', minutes: 75,
    learn: [
      'Why high-dimensional data is hard to visualize and computationally expensive',
      'How PCA finds directions of maximum variance and projects data onto fewer dimensions',
      'How to interpret principal components and choose how many to keep',
    ],
    topics: [
      { heading: 'The Curse of Dimensionality', body: 'A dataset with 100 features has 100 dimensions. Clustering and visualization in 100 dimensions is slow and hard to interpret. Most features may be noise or redundant. PCA finds a lower-dimensional representation that captures the bulk of the variance.' },
      { heading: 'Principal Components', body: 'PCA ranks directions (eigenvectors of the covariance matrix) by how much variance they explain. The first principal component is the direction of maximum variance. The second is perpendicular to the first and has the second-most variance. You project your data onto the top k components, keeping the signal and dropping noise.' },
      { heading: 'Choosing K Components', body: 'Plot cumulative explained variance against the number of components. A 95% threshold is common — how many components do you need to explain 95% of the variance? Fewer components mean faster training and easier visualization, but risk losing important signal. This is a speed-accuracy trade-off.' },
    ],
    practice: [
      'Load a dataset with 10+ features. Run PCA and plot cumulative explained variance. How many components are needed for 90% variance?',
      'Project your data onto the first two principal components and plot them. Do you see any clusters or outliers?',
    ],
    comingUp: 'You will not perform PCA directly in this module\'s labs, but understanding it prepares you for Module 08 (Anomaly Detection), where dimensionality reduction helps identify outliers.',
  },
  {
    id: 'aim06-lesson-04', number: '6.4', icon: 'ri-settings-3-line',
    title: 'Feature Engineering: Scaling & Encoding', minutes: 60,
    learn: [
      'Why numeric features must be scaled before distance-based algorithms',
      'How one-hot encoding handles low-cardinality categorical features',
      'When one-hot encoding fails and what alternatives exist',
    ],
    topics: [
      { heading: 'Feature Scaling', body: 'A feature with values 0-100 dominates distance calculations versus a feature with values 0-1. Standardization (subtract mean, divide by std) puts all features on a common scale. Min-max scaling shrinks values to [0, 1]. Distance-based algorithms (k-means, PCA, KNN) are sensitive to scale; tree-based models are not.' },
      { heading: 'One-Hot Encoding', body: 'A categorical feature like "color" with 3 values becomes 3 binary columns: is_red, is_green, is_blue. This is called one-hot encoding — each row has exactly one "1" and the rest "0"s. It works well for low-cardinality features (few unique values, say < 20).' },
      { heading: 'High-Cardinality Problem', body: 'If "user_id" has 100,000 unique values, one-hot encoding creates 100,000 new columns — exploding dimensionality. Your model trains slower, overfits, and uses more memory. Alternatives: ordinal encoding (assign 1, 2, 3, …), target encoding (encode as the mean target value within each category), or leave it as a raw ID for embedding-based models.' },
    ],
    practice: [
      'Standardize a dataset with features in different ranges (e.g., age 18-80, salary 20k-200k). Verify all have mean ≈0 and std ≈1.',
      'One-hot encode a low-cardinality feature (e.g., season with 4 values) and show the resulting binary columns.',
    ],
    comingUp: 'Your feature engineering lab will build a scikit-learn Pipeline that scales numeric features and one-hot encodes categorical features — this is the full workflow in code.',
  },
  {
    id: 'aim06-lesson-05', number: '6.5', icon: 'ri-function-add-line',
    title: 'Feature Engineering: Interactions & Selection', minutes: 60,
    learn: [
      'How interaction terms and polynomial features create higher-order signal',
      'What filter, wrapper, and embedded feature selection methods do',
      'How scikit-learn Pipelines keep preprocessing reproducible and prevent data leakage',
    ],
    topics: [
      { heading: 'Interaction and Polynomial Features', body: 'A model may learn non-linear relationships better if you engineer features: multiply two existing features (interaction, e.g., age * income), or raise them to powers (polynomial, e.g., age²). Scikit-learn\'s PolynomialFeatures automates this, but it quickly explodes dimensionality—use it sparingly and pair with feature selection or dimensionality reduction.' },
      { heading: 'Feature Selection', body: 'Not all features help. Filter methods score features by correlation with the target or variance (quick, independent of the model). Wrapper methods train the model repeatedly on subsets, choosing the subset with the best score (slower, model-aware). Embedded methods (like tree importance) select features as part of training. Start with filter methods to get intuition, then iterate.' },
      { heading: 'Pipelines and Data Leakage', body: 'A Pipeline chains preprocessing (scaling, encoding) and a model into one unit. When you fit the pipeline, all transforms learn from the training set only; the test set is never seen during preprocessing. This prevents data leakage (using test information to fit preprocessing) and ensures reproducibility.' },
    ],
    practice: [
      'Create interaction and polynomial features from two raw features. How many new features does degree-2 polynomials create? Is that practical?',
      'Build a scikit-learn Pipeline with StandardScaler, OneHotEncoder, and a clustering model. Fit it on a train set, score on a test set.',
    ],
    comingUp: 'Your second hands-on lab will build exactly this pipeline, compare a model\'s performance with and without engineered features, and learn why this matters in production.',
  },
];

const AIM06_QUIZ_BANKS = [
  {
    conceptId: 'aim06-clustering', conceptTitle: 'Clustering', questions: [
      { id: 'aim06-q-clust-1', prompt: 'Choosing k in k-means using the "elbow method" means:', options: [
        { id: 'a', text: 'Picking the largest possible k' },
        { id: 'b', text: 'Picking the k where added clusters stop meaningfully reducing within-cluster variance' },
        { id: 'c', text: 'Always using k=2' },
        { id: 'd', text: 'Picking k equal to the number of features' },
      ], correctId: 'b', feedbackCorrect: 'Correct — the elbow is where inertia stops dropping steeply, showing that adding more clusters yields diminishing returns.', feedbackIncorrect: 'The elbow method plots inertia against k and finds the point where inertia stops dropping sharply — beyond that k, new clusters add little value.' },
      { id: 'aim06-q-clust-2', prompt: 'A silhouette score close to 0 for a clustering result suggests:', options: [
        { id: 'a', text: 'Excellent, well-separated clusters' },
        { id: 'b', text: 'Clusters that overlap significantly or are poorly separated' },
        { id: 'c', text: 'The data has no numeric features' },
        { id: 'd', text: 'The model has overfit' },
      ], correctId: 'b', feedbackCorrect: 'Correct — a silhouette score near 0 means points are roughly equally close to their own cluster and nearby clusters, indicating poor separation.', feedbackIncorrect: 'A silhouette score near 0 indicates that points are not clearly closer to their own cluster than to other clusters, suggesting overlapping or poorly-defined clusters.' },
    ],
  },
  {
    conceptId: 'aim06-dimensionality-reduction', conceptTitle: 'Dimensionality reduction', questions: [
      { id: 'aim06-q-dimred-1', prompt: 'PCA\'s first principal component is BEST described as:', options: [
        { id: 'a', text: 'A single original feature, unchanged' },
        { id: 'b', text: 'The direction of maximum variance in the data' },
        { id: 'c', text: 'The mean of all features' },
        { id: 'd', text: 'A cluster assignment' },
      ], correctId: 'b', feedbackCorrect: 'Correct — the first principal component is the eigenvector (direction) along which the data varies the most.', feedbackIncorrect: 'The first principal component is the linear combination of all features that captures the direction of maximum variance in your data.' },
    ],
  },
  {
    conceptId: 'aim06-feature-engineering', conceptTitle: 'Feature engineering', questions: [
      { id: 'aim06-q-fe-1', prompt: 'A categorical feature has 50,000 unique values (e.g., a raw user ID). One-hot encoding it directly would MOST likely:', options: [
        { id: 'a', text: 'Improve the model with no downside' },
        { id: 'b', text: 'Explode dimensionality and likely hurt performance and cost' },
        { id: 'c', text: 'Have no effect on training time' },
        { id: 'd', text: 'Automatically become a numeric feature' },
      ], correctId: 'b', feedbackCorrect: 'Correct — one-hot encoding high-cardinality features creates too many columns, exploding memory and training time while risking overfitting.', feedbackIncorrect: 'One-hot encoding a high-cardinality feature creates a column for each unique value, causing memory explosion and performance degradation. Use ordinal or target encoding instead.' },
      { id: 'aim06-q-fe-2', prompt: 'Standardizing numeric features before k-means is important MAINLY because:', options: [
        { id: 'a', text: 'It\'s required by Python syntax' },
        { id: 'b', text: 'Distance-based algorithms are sensitive to feature scale, and unscaled features can dominate the distance calculation' },
        { id: 'c', text: 'It removes the need for a test set' },
        { id: 'd', text: 'It changes the number of clusters automatically' },
      ], correctId: 'b', feedbackCorrect: 'Correct — k-means uses distance metrics, and features with large ranges dominate those with small ranges if not scaled to a common level.', feedbackIncorrect: 'Distance-based algorithms like k-means treat all features equally, so a feature with values 0-1000 dominates one with values 0-1 unless both are scaled first.' },
      { id: 'aim06-q-fe-3', prompt: 'Using a scikit-learn Pipeline to chain preprocessing and modeling steps is valuable MAINLY because it:', options: [
        { id: 'a', text: 'Trains faster in all cases' },
        { id: 'b', text: 'Prevents preprocessing steps (like scaling) from leaking test-set information and keeps the workflow reproducible' },
        { id: 'c', text: 'Removes the need for a train/test split' },
        { id: 'd', text: 'Is required syntax for any model' },
      ], correctId: 'b', feedbackCorrect: 'Correct — a Pipeline fits all preprocessing transformations on training data only, preventing test-set leakage and ensuring reproducibility.', feedbackIncorrect: 'A Pipeline ensures that all preprocessing transforms (scaling, encoding) are fit on training data only, preventing data leakage when applied to the test set.' },
    ],
  },
];

const AIM06_BLANKS = [
  { id: 'aim06-b1', prompt: '______ clustering groups data into k groups based on distance to centroids.', accept: ['K-means'] },
  { id: 'aim06-b2', prompt: '______ (PCA) reduces the number of features while preserving as much variance as possible.', accept: ['Principal Component Analysis'] },
  { id: 'aim06-b3', prompt: 'Converting a categorical feature into binary indicator columns is called ______ encoding.', accept: ['one-hot'] },
  { id: 'aim06-b4', prompt: 'A ______ score measures how similar a point is to its own cluster versus other clusters.', accept: ['silhouette'] },
];

const AIM06_SOURCES = [
  { title: 'scikit-learn documentation', org: 'scikit-learn', url: 'https://scikit-learn.org/stable/', note: 'Clustering, decomposition (PCA), preprocessing, and Pipeline reference.' },
];

const AIM06_LAB_ID = 'aim06-unsupervised-pipeline-v1';
const AIM06_LAB_KEY = 'lab-aim-06-clustering-features';

const AIM06_LAB_STEPS = [
  { id: 'standardize', label: 'Standardized all numeric features in your dataset.' },
  { id: 'elbow', label: 'Ran k-means for k=2 to 10 and plotted the elbow curve (inertia vs. k).' },
  { id: 'silhouette', label: 'Computed silhouette scores for each k and chose the k with the best balance.' },
  { id: 'profile', label: 'Profiled each cluster in plain language: describe the size, characteristics, and distinctiveness of one cluster.' },
  { id: 'pipeline', label: 'Built a scikit-learn Pipeline that scales numeric features, one-hot encodes categorical features, and adds one interaction feature.' },
  { id: 'compare', label: 'Trained a downstream model (e.g., logistic regression or decision tree) with and without engineered features, and compared performance metrics.' },
];

const AIM06_DEFAULT_STATE = {
  stepsDone: {}, reflection: '', reflectionChecked: false,
  reviewMode: false,
  blankAnswers: {}, blankResults: {},
};

let aim06State = null;
let aim06User = null;
let aim06QuizState = null;

function aim06Load(user) {
  aim06User = user;
  aim06State = LabRuntime.load(AIM06_LAB_ID, user, AIM06_DEFAULT_STATE);
  if (!aim06State.stepsDone || typeof aim06State.stepsDone !== 'object') aim06State.stepsDone = {};
  if (!aim06State.blankAnswers) aim06State.blankAnswers = {};
  if (!aim06State.blankResults) aim06State.blankResults = {};

  if (!aim06QuizState) {
    const previousQuestionIds = aim06State.lastQuizQuestionIds || [];
    const selection = selectQuizQuestions(AIM06_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    aim06QuizState = {
      selectedQuestions: selection.selectedQuestions,
      questionsByAnswer: selection.questionsByAnswer,
      answers: {}, scored: false, attempts: 0, score: 0, bestScore: 0, feedback: [], passed: false,
    };
  }

  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'ai-ml', 'aim-06');
  return aim06State;
}

function aim06Save() {
  if (aim06User && aim06State) LabRuntime.save(AIM06_LAB_ID, aim06User, aim06State);
}

/* -------------------------------------------------------------- lessons */

function aim06LessonCard(lesson) {
  return `<details class="aim-lesson" data-aim06-lesson="${esc(lesson.id)}" ${aim06State.reviewMode ? 'open' : ''}>
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

function aim06BlankItem(blank) {
  const value = aim06State.blankAnswers[blank.id] || '';
  const result = aim06State.blankResults[blank.id];
  const statusClass = result === true ? 'is-correct' : result === false ? 'is-incorrect' : '';
  return `<li class="aim-blank-item ${statusClass}" data-aim06-blank="${esc(blank.id)}">
    <p class="aim-blank-prompt">${esc(blank.prompt)}</p>
    <div class="aim-blank-row">
      <input type="text" value="${esc(value)}" data-aim06-blank-input="${esc(blank.id)}" aria-label="Your answer" autocomplete="off" />
      <button type="button" class="aim-blank-check" data-aim06-blank-check="${esc(blank.id)}">Check</button>
    </div>
    ${result === true ? '<p class="aim-blank-result">Correct.</p>' : ''}
    ${result === false ? `<p class="aim-blank-result">Not quite — expected: ${esc(blank.accept[0])}</p>` : ''}
  </li>`;
}

function aim06BlankDrill() {
  return `<ul class="aim-blank-list">${AIM06_BLANKS.map(aim06BlankItem).join('')}</ul>`;
}

/* -------------------------------------------------------------- quiz */

function aim06QuizQuestion(selected, index) {
  const question = selected.question;
  const userAnswerId = aim06QuizState?.answers?.[question.id];
  return `<fieldset class="aim-quiz-question" data-question-id="${esc(question.id)}">
    <legend><span>${index + 1}</span> ${esc(selected.conceptTitle)}: ${esc(question.prompt)}</legend>
    <div class="aim-quiz-options">
      ${selected.shuffledOptions.map((option) => `<label>
        <input type="radio" name="q-${esc(question.id)}" value="${esc(option.id)}" ${userAnswerId === option.id ? 'checked' : ''} data-aim06-quiz-answer />
        <span>${esc(option.text)}</span>
      </label>`).join('')}
    </div>
  </fieldset>`;
}

function aim06QuizPanel() {
  if (!aim06QuizState?.selectedQuestions || aim06QuizState.selectedQuestions.length === 0) {
    return `<div class="aim-quiz-empty" id="aim06-quiz-feedback" role="status">Loading quiz…</div>`;
  }
  const selected = aim06QuizState.selectedQuestions;
  const answered = Object.keys(aim06QuizState.answers || {}).length;
  const total = selected.length;

  let feedbackHtml = '';
  if (aim06QuizState.scored) {
    const passed = aim06QuizState.score >= 70;
    feedbackHtml = `<section class="aim-quiz-score ${passed ? 'aim-quiz-pass' : 'aim-quiz-remediate'}" id="aim06-quiz-feedback" tabindex="-1" aria-live="polite">
      <div class="aim-quiz-score-heading">
        <div><p class="aim-kicker">Attempt ${aim06QuizState.attempts} · best ${aim06QuizState.bestScore}/100</p><h3>${aim06QuizState.score}/100 — ${passed ? 'Knowledge check passed' : 'Review and retry'}</h3></div>
        <span>${aim06QuizState.score}</span>
      </div>
      <ul class="aim-quiz-feedback-list">${(aim06QuizState.feedback || []).map((fb) => `<li>
        <i class="ri-${fb.correct ? 'checkbox-circle-fill' : 'information-line'}" aria-hidden="true"></i>
        <div><strong>${fb.correct ? 'Correct' : 'Review'}</strong><p>${esc(fb.message)}</p></div>
      </li>`).join('')}</ul>
      ${!passed ? `<div class="aim-quiz-actions"><button type="button" class="aim-quiz-retry" data-aim06-quiz-retry><i class="ri-refresh-line" aria-hidden="true"></i> Try different questions</button></div>` : ''}
    </section>`;
  } else if (answered === total) {
    feedbackHtml = `<div class="aim-quiz-ready" id="aim06-quiz-feedback" role="status">All questions answered. Submit to check your responses.</div>`;
  } else {
    feedbackHtml = `<div class="aim-quiz-empty" id="aim06-quiz-feedback" role="status">Answer all ${total} questions to submit.</div>`;
  }

  return `<form class="aim-quiz-form" id="aim06-quiz-form" novalidate>
    <div class="aim-panel-heading"><div><p class="aim-kicker">Knowledge check</p><h3>Test your understanding of unsupervised learning</h3></div><span>${answered}/${total} answered</span></div>
    ${selected.map((sel, idx) => aim06QuizQuestion(sel, idx)).join('')}
    <div class="aim-quiz-actions">
      <button class="aim-quiz-submit" type="submit" ${answered < total ? 'disabled' : ''}><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Check my answers</button>
    </div>
    ${feedbackHtml}
  </form>`;
}

/* -------------------------------------------------------------- lab */

function aim06LabStepItem(step) {
  const done = Boolean(aim06State.stepsDone[step.id]);
  return `<li class="aim-lab-step ${done ? 'is-done' : ''}"><input type="checkbox" id="aim06-step-${esc(step.id)}" data-aim06-step="${esc(step.id)}" ${done ? 'checked' : ''} /><label for="aim06-step-${esc(step.id)}"><span>${esc(step.label)}</span></label></li>`;
}

function aim06LabStatus() {
  const allDone = AIM06_LAB_STEPS.every((step) => aim06State.stepsDone[step.id]);
  const reflectionOk = aim06State.reflection.trim().length >= 40;
  const complete = allDone && reflectionOk;
  return `<div class="aim-lab-status ${complete ? 'aim-status-pass' : 'aim-status-pending'}"><i class="${complete ? 'ri-checkbox-circle-fill' : 'ri-time-line'}" aria-hidden="true"></i><span>${complete ? 'Lab complete — every step is checked and your reflection is recorded.' : 'Check off every step in your own Python environment, then record a short reflection.'}</span></div>`;
}

function aim06LabPanel() {
  return `
    <ol class="aim-lab-steps">${AIM06_LAB_STEPS.map(aim06LabStepItem).join('')}</ol>
    <div class="aim-reflection">
      <label for="aim06-reflection">Pick one of your k-means clusters and describe it in plain language: who is in it, and what makes it distinct from the others?</label>
      <textarea id="aim06-reflection" data-aim06-reflection rows="4">${esc(aim06State.reflection)}</textarea>
      <small>Write at least a couple of sentences — this is your evidence that the lab was actually completed.</small>
    </div>
    ${aim06LabStatus()}
  `;
}

/* -------------------------------------------------------------- shell */

function aim06Sections() {
  const labComplete = AIM06_LAB_STEPS.every((step) => aim06State.stepsDone[step.id]) && aim06State.reflection.trim().length >= 40;
  return [
    { id: 'aim06-lessons', title: 'Foundations', type: 'lecture', isComplete: true, scrollId: 'aim06-lessons' },
    { id: 'aim06-knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: Boolean(aim06QuizState?.passed), scrollId: 'aim06-knowledge-check' },
    { id: 'aim06-lab', title: 'Hands-On Lab', type: 'lab', isComplete: labComplete, scrollId: 'aim06-lab' },
  ];
}

function viewAiMlModuleSix(user, program) {
  aim06Load(user);
  const module = program.modules['aim-06'];

  return `<div class="aim-shell">
    ${moduleTopbar(user, program)}
    ${moduleProgressShell(aim06Sections(), { reviewMode: aim06State.reviewMode })}
    <main class="aim-main">
      <section class="aim-hero" aria-labelledby="aim06-title">
        <div>
          <p class="aim-kicker">Module 06 · ${formatInstructionalMinutes(module.durationMinutes)} · Week 3</p>
          <h1 id="aim06-title">${esc(module.title)}</h1>
          <p class="aim-lede">${esc(module.summary)}</p>
        </div>
        <dl class="aim-progress" aria-label="Saved module progress">
          <div><dt>Lessons</dt><dd>${module.lessons}</dd></div>
          <div><dt>Hands-on labs</dt><dd>${module.labs}</dd></div>
        </dl>
      </section>

      <section class="aim-objective" aria-labelledby="aim06-objective-title"><span><i class="ri-focus-2-line" aria-hidden="true"></i></span><div><p class="aim-kicker">One measurable objective</p><h2 id="aim06-objective-title">Cluster a dataset using k-means with appropriate metrics, reduce dimensionality with PCA, and engineer features that improve any downstream model.</h2></div></section>

      <details class="aim-section-collapsible" id="aim06-lessons" ${aim06State.reviewMode ? 'open' : 'open'}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>1</span><div><p class="aim-kicker">Learn</p><h2>Five foundation lessons</h2></div></div></summary>
        <div class="aim-section-body">
          <p class="aim-instruction">Open each lesson for the full walkthrough, then work its Try It Yourself exercise in your own Python environment.</p>
          <div class="aim-lesson-grid">${AIM06_LESSONS.map(aim06LessonCard).join('')}</div>
        </div>
      </details>

      <details class="aim-section-collapsible" id="aim06-blanks" ${aim06State.reviewMode ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>2</span><div><p class="aim-kicker">Vocabulary drill</p><h2>Fill in the blank</h2></div></div></summary>
        <div class="aim-section-body">${aim06BlankDrill()}</div>
      </details>

      <details class="aim-section-collapsible" id="aim06-knowledge-check" ${aim06State.reviewMode || (aim06QuizState && !aim06QuizState.passed) ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>3</span><div><p class="aim-kicker">Interactive knowledge check</p><h2>Test your understanding</h2></div></div></summary>
        <div class="aim-section-body"><div id="aim06-quiz-dynamic">${aim06QuizPanel()}</div></div>
      </details>

      <details class="aim-section-collapsible" id="aim06-lab" ${aim06State.reviewMode ? 'open' : 'open'}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>4</span><div><p class="aim-kicker">Hands-on · your own environment</p><h2>Customer Segmentation & Feature Engineering Pipeline</h2></div></div></summary>
        <div class="aim-section-body">
          <p class="aim-instruction">Work both labs in your own Python environment: segment customers with k-means and the elbow/silhouette methods, then build a feature engineering pipeline that scales, encodes, and creates interaction features. Check off each step below as you complete it.</p>
          <div id="aim06-lab-dynamic">${aim06LabPanel()}</div>
        </div>
      </details>

      <details class="aim-section-collapsible" id="aim06-sources" ${aim06State.reviewMode ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>5</span><div><p class="aim-kicker">Supporting resources</p><h2>Further reading</h2></div></div></summary>
        <div class="aim-section-body">${moduleSourcesBlock(AIM06_SOURCES)}</div>
      </details>
    </main>
  </div>`;
}

/* -------------------------------------------------------------- render helpers */

function aim06RenderQuiz(focusId) {
  const el = document.getElementById('aim06-quiz-dynamic');
  if (!el) return;
  el.innerHTML = aim06QuizPanel();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function aim06RenderLab() {
  const el = document.getElementById('aim06-lab-dynamic');
  if (!el) return;
  el.innerHTML = aim06LabPanel();
}

function aim06CheckLabComplete(wasComplete) {
  const allDone = AIM06_LAB_STEPS.every((step) => aim06State.stepsDone[step.id]);
  const reflectionOk = aim06State.reflection.trim().length >= 40;
  const nowComplete = allDone && reflectionOk;
  if (nowComplete && !wasComplete) {
    if (typeof recordLabAttempt === 'function') recordLabAttempt(aim06User, AIM06_LAB_KEY, { state: 'complete', score: 100, result: { steps: AIM06_LAB_STEPS.length } });
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(aim06User, 'ai-ml', 'aim-06', AIM06_LAB_KEY);
  }
  return nowComplete;
}

/* -------------------------------------------------------------- wiring */

function wireAiMlModuleSix() {
  const shell = document.querySelector('.aim-shell');
  if (!shell || !aim06State) return;

  shell.addEventListener('click', (event) => {
    if (event.target.closest('[data-mnav-review-toggle]')) {
      aim06State.reviewMode = !aim06State.reviewMode;
      aim06Save();
      render();
      return;
    }
    const blankCheck = event.target.closest('[data-aim06-blank-check]');
    if (blankCheck) {
      const id = blankCheck.dataset.aim06BlankCheck;
      const blank = AIM06_BLANKS.find((b) => b.id === id);
      const input = shell.querySelector(`[data-aim06-blank-input="${id}"]`);
      const given = (input?.value || '').trim().toLowerCase();
      aim06State.blankResults[id] = blank.accept.some((accepted) => accepted.toLowerCase() === given);
      aim06Save();
      const item = shell.querySelector(`[data-aim06-blank="${id}"]`);
      if (item) item.outerHTML = aim06BlankItem(blank);
      return;
    }
    const retry = event.target.closest('[data-aim06-quiz-retry]');
    if (retry) {
      const previousQuestionIds = aim06QuizState.selectedQuestions.map((s) => s.question.id);
      const selection = selectQuizQuestions(AIM06_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
      aim06QuizState = { selectedQuestions: selection.selectedQuestions, questionsByAnswer: selection.questionsByAnswer, answers: {}, scored: false, attempts: aim06QuizState.attempts, score: 0, bestScore: aim06QuizState.bestScore, feedback: [], passed: false };
      aim06State.lastQuizQuestionIds = previousQuestionIds;
      aim06Save();
      aim06RenderQuiz('aim06-quiz-title');
    }
  });

  shell.addEventListener('input', (event) => {
    if (event.target.matches('[data-aim06-blank-input]')) {
      const id = event.target.dataset.aim06BlankInput;
      aim06State.blankAnswers[id] = event.target.value;
      aim06Save();
      return;
    }
    if (event.target.matches('[data-aim06-reflection]')) {
      const wasComplete = AIM06_LAB_STEPS.every((step) => aim06State.stepsDone[step.id]) && aim06State.reflection.trim().length >= 40;
      aim06State.reflection = event.target.value;
      aim06CheckLabComplete(wasComplete);
      aim06Save();
    }
  });

  shell.addEventListener('change', (event) => {
    if (event.target.matches('[data-aim06-step]')) {
      const wasComplete = AIM06_LAB_STEPS.every((step) => aim06State.stepsDone[step.id]) && aim06State.reflection.trim().length >= 40;
      const id = event.target.dataset.aim06Step;
      aim06State.stepsDone[id] = event.target.checked;
      aim06CheckLabComplete(wasComplete);
      aim06Save();
      aim06RenderLab();
      return;
    }
    if (event.target.matches('[data-aim06-quiz-answer]')) {
      const questionId = event.target.closest('[data-question-id]')?.dataset.questionId;
      if (questionId) {
        aim06QuizState.answers[questionId] = event.target.value;
        aim06State.lastQuizQuestionIds = aim06QuizState.selectedQuestions.map((s) => s.question.id);
        aim06Save();
        aim06RenderQuiz();
      }
    }
  });

  shell.addEventListener('submit', (event) => {
    if (event.target.id !== 'aim06-quiz-form') return;
    event.preventDefault();
    const result = scoreQuizAttempt(aim06QuizState.selectedQuestions, aim06QuizState.questionsByAnswer, aim06QuizState.answers);
    aim06QuizState.attempts += 1;
    aim06QuizState.score = result.score;
    aim06QuizState.bestScore = Math.max(aim06QuizState.bestScore || 0, result.score);
    aim06QuizState.feedback = result.feedback;
    aim06QuizState.passed = result.score >= 70;
    aim06QuizState.scored = true;
    if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(aim06User, 'aim-06-knowledge-check', { state: aim06QuizState.passed ? 'complete' : 'in_progress', score: result.score });
    }
    aim06Save();
    aim06RenderQuiz('aim06-quiz-feedback');
  });
}

registerModuleLab({
  program: 'ai-ml',
  moduleNumber: 6,
  moduleKey: 'aim-06',
  view: viewAiMlModuleSix,
  wire: wireAiMlModuleSix,
});
