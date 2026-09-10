/* Module 02 — Data Fundamentals, Mathematics & Statistics ('ai-ml').
 * Content authored from AI_ML_ENGINEERING_CURRICULUM.md (2026-09-10).
 * Labs run in the student's own real Python environment (no in-portal code
 * execution sandbox exists) — completion is tracked as a guided step
 * checklist plus short written reflections, evidence-based like
 * it-support-module-01.js's Lab 1.1, not a simulated console.
 * Reference implementation for the ai-ml-module-02..12.js pattern.
 */

const AIM02_LESSONS = [
  {
    id: 'aim02-lesson-01', number: '2.1', icon: 'ri-layout-grid-line',
    title: 'Vectors, Matrices & Linear Algebra', minutes: 60,
    learn: [
      'How to represent data as vectors and matrices',
      'When to use dot products and matrix multiplication',
      'What transpose, norms, and matrix shapes tell you',
    ],
    topics: [
      { heading: 'Representing Data as Vectors and Matrices', body: 'A vector is a 1D array of numbers; a matrix is 2D. In machine learning, each data point often becomes a vector (a row in a CSV becomes a row in a matrix). A dataset is then a matrix where each row is one observation and each column is one feature — this representation is fundamental to every algorithm that follows, because linear algebra gives us a language and tools to work with entire datasets at once.' },
      { heading: 'Dot Products and Matrix Multiplication', body: 'A dot product combines two vectors element-wise and sums the result: [1, 2] · [3, 4] = 1*3 + 2*4 = 11. This is how similarity is computed, how predictions are made, and how many algorithms measure alignment. Matrix multiplication chains these operations: multiplying a (3,4) matrix by a (4,2) matrix yields a (3,2) result, where each entry is a dot product of a row from the first matrix with a column from the second.' },
      { heading: 'Transpose, Norms, and Shapes', body: 'Transposing a matrix flips rows and columns: a (3,4) becomes (4,3). The norm of a vector is its magnitude (distance from the origin): the Euclidean norm of [3, 4] is 5. These operations are not exotic — they are so foundational that every linear-algebra library (including numpy) makes them fast.' },
    ],
    practice: [
      'Compute a dot product of two 3-element vectors by hand, then verify with numpy.',
      'Visualize a (2,3) matrix, transpose it, and verify the shape changed to (3,2).',
    ],
    comingUp: 'The lab\'s first task computes summary statistics for entire numpy arrays at once — that\'s the vectorized thinking you\'re learning here.',
  },
  {
    id: 'aim02-lesson-02', number: '2.2', icon: 'ri-bar-chart-line',
    title: 'Descriptive Statistics', minutes: 60,
    learn: [
      'What mean, median, mode tell you about a dataset',
      'How variance and standard deviation measure spread',
      'When outliers lie and quartiles catch them',
    ],
    topics: [
      { heading: 'Center and Spread', body: 'The mean is the sum divided by count — sensitive to outliers. The median is the middle value — robust to outliers. The mode is the most frequent value — useful for categorical data. Variance is the average squared deviation from the mean; standard deviation is its square root, expressed in the original units. Together, they quantify how tightly or loosely data clusters.' },
      { heading: 'Detecting Outliers', body: 'The interquartile range (IQR) is the distance from the 25th percentile to the 75th percentile — the middle 50% of data. Points beyond 1.5 × IQR above Q3 or below Q1 are often called outliers. A robust rule of thumb: never ignore outliers without checking whether they are data-entry errors, measurement failures, or legitimate signals.' },
      { heading: 'Why Numbers Matter', body: 'A dataset\'s mean can be far from its median if high or low extremes pull it. This skew is not a defect — it tells you the data has a tail. But it matters for deciding whether to report the mean (symmetric data) or median (skewed data) as the "typical" value.' },
    ],
    practice: [
      'Load a dataset and compute mean, median, and standard deviation; compare them.',
      'Find the IQR and identify any outliers in a small sample by hand.',
    ],
    comingUp: 'The lab computes these statistics with numpy for a real dataset, then times the vectorized version against a manual loop.',
  },
  {
    id: 'aim02-lesson-03', number: '2.3', icon: 'ri-ball-pen-line',
    title: 'Probability & Bayes\' Theorem', minutes: 60,
    learn: [
      'Independence, conditional probability, and what Bayes\' theorem does',
      'Why rare conditions produce mostly false positives even with accurate tests',
      'How to reason about uncertainty with math instead of intuition',
    ],
    topics: [
      { heading: 'Conditional Probability', body: 'P(A|B) is the probability of A given that B is true — the conditional probability. It is different from P(A) alone because the condition restricts the universe. Example: P(sick | positive test) is not the same as P(positive test | sick). The first is what a patient cares about after a positive result; the second is the test\'s accuracy. Confusing the two leads to the base-rate fallacy.' },
      { heading: 'Bayes\' Theorem', body: 'Bayes\' theorem says P(A|B) = P(B|A) * P(A) / P(B). It lets you reverse conditional probabilities. Knowing the test accuracy (P(positive | sick)) and the disease prevalence (P(sick)), you can compute what you actually want: P(sick | positive). This is how spam filters work and why they fail when trained on skewed data.' },
      { heading: 'The Base-Rate Fallacy', body: 'A 99% accurate test on a 1-in-10,000 disease still produces mostly false positives — because the prior probability is so low that even rare false positives outnumber the true positives. A patient testing positive should get a retest or a different confirmation, not immediate treatment.' },
    ],
    practice: [
      'Compute P(sick | positive) by hand for a disease with 1% prevalence and a 95% accurate test.',
      'Explain why a high-accuracy test can still mislead on a rare condition.',
    ],
    comingUp: 'The lab\'s second part asks you to implement Bayes\' theorem on a spam-classifier scenario and write out the reasoning behind the base-rate fallacy.',
  },
  {
    id: 'aim02-lesson-04', number: '2.4', icon: 'ri-fluctuation-line',
    title: 'Probability Distributions & Sampling', minutes: 50,
    learn: [
      'What normal, binomial, and uniform distributions model',
      'Why sample size matters and what "representative sample" means',
      'How to recognize when a distribution assumption might fail',
    ],
    topics: [
      { heading: 'Common Distributions', body: 'The normal (Gaussian) distribution is bell-shaped and symmetric — many measurements (heights, test scores, errors) follow it approximately. The binomial distribution counts successes in a fixed number of independent trials — coin flips, pass/fail results. The uniform distribution says every outcome is equally likely. Each has a story and a use case in modeling.' },
      { heading: 'Sampling and Bias', body: 'A sample is representative if its statistical properties (mean, variance) reflect the population. Sampling biases — surveying only people with internet access, measuring only on weekdays — skew results. A larger, random sample is better than a smaller, convenient one, even if data collection is harder.' },
      { heading: 'Small Samples Lie', body: 'A sample of 10 people might have a mean far from the population mean just by chance. As sample size grows, sample statistics stabilize around the truth. This is the law of large numbers, and it is why statistical inference requires understanding sample size.' },
    ],
    practice: [
      'Generate 1000 random samples from a normal distribution and check that their mean is close to zero.',
      'Compare the variance of sample means for samples of size 10 versus 100.',
    ],
    comingUp: 'The lab uses a real dataset to practice these ideas: computing statistics from a numpy array and seeing how they stabilize with larger samples.',
  },
  {
    id: 'aim02-lesson-05', number: '2.5', icon: 'ri-error-warning-line',
    title: 'Correlation vs. Causation & Hypothesis Testing', minutes: 50,
    learn: [
      'Why correlation alone never proves causation',
      'How Simpson\'s paradox can reverse a correlation',
      'What a p-value is and what it is NOT',
    ],
    topics: [
      { heading: 'Correlation and Confounders', body: 'Two variables can move together because one causes the other, they both respond to a third variable (a confounder), or by pure chance. Ice cream sales and drowning are correlated — but summer heat is the confounder. High-quality marketing and high sales are correlated — but underlying product quality might be the cause. A p-value or an r-squared can tell you two things are related; only experimental design and domain knowledge can tell you *how*.' },
      { heading: 'Simpson\'s Paradox', body: 'A trend can reverse when data is split by a lurking variable. Example: College A admits 30% of applicants overall, College B admits 40%, so B seems less selective. But if you split by gender, A might admit 60% of women and 20% of men, while B admits 50% of women and 30% of men — now A is actually more selective within each group. The reversal happened because more women applied to B.' },
      { heading: 'Hypothesis Testing Basics', body: 'A p-value is the probability of observing data this extreme (or more extreme) *if the null hypothesis is true*. A p-value of 0.03 does not mean the effect is 97% likely to be real — it means if the null were true, you\'d see this data 3% of the time by chance. A common threshold is 0.05 for "statistically significant," but even a significant result can be misleading if the sample is huge or the effect size is tiny.' },
    ],
    practice: [
      'Find two correlated variables in the news or data, identify a likely confounder, and explain why causation is unclear.',
      'Given a p-value of 0.02 and an effect size of 0.01, discuss why statistical and practical significance can differ.',
    ],
    comingUp: 'The lab\'s reflection on the base-rate fallacy is a real-world application of hypothesis testing and how easy it is to misinterpret probabilities.',
  },
];

const AIM02_QUIZ_BANKS = [
  {
    conceptId: 'aim02-linear-algebra', conceptTitle: 'Linear algebra', questions: [
      { id: 'aim02-q-la-1', prompt: 'Multiplying a (3,4) matrix by a (4,2) matrix produces a matrix of shape:', options: [
        { id: 'a', text: '(3,2)' },
        { id: 'b', text: '(4,4)' },
        { id: 'c', text: '(2,3)' },
        { id: 'd', text: 'undefined' },
      ], correctId: 'a', feedbackCorrect: 'Correct — the result takes the outer dimensions: (3,4) × (4,2) = (3,2).', feedbackIncorrect: 'Matrix multiplication (m,n) × (n,p) produces shape (m,p) — here that\'s (3,2).' },
    ],
  },
  {
    conceptId: 'aim02-descriptive-stats', conceptTitle: 'Descriptive statistics', questions: [
      { id: 'aim02-q-ds-1', prompt: 'A dataset\'s mean is far higher than its median. This MOST likely indicates:', options: [
        { id: 'a', text: 'The data is perfectly normal' },
        { id: 'b', text: 'A right-skew, likely driven by high-value outliers' },
        { id: 'c', text: 'The data has no variance' },
        { id: 'd', text: 'A calculation error' },
      ], correctId: 'b', feedbackCorrect: 'Correct — high outliers pull the mean upward while leaving the median unchanged, creating a right-skewed distribution.', feedbackIncorrect: 'When the mean is much higher than the median, the data is likely right-skewed with high-value outliers pulling the mean away from the center.' },
      { id: 'aim02-q-ds-2', prompt: 'Which measure is LEAST sensitive to extreme outliers?', options: [
        { id: 'a', text: 'Mean' },
        { id: 'b', text: 'Standard deviation' },
        { id: 'c', text: 'Median' },
        { id: 'd', text: 'Range' },
      ], correctId: 'c', feedbackCorrect: 'Correct — the median is the middle value and ignores extremes, making it robust to outliers.', feedbackIncorrect: 'The median is the middle value and is insensitive to extremes, unlike the mean, standard deviation, and range.' },
    ],
  },
  {
    conceptId: 'aim02-probability-inference', conceptTitle: 'Probability & inference', questions: [
      { id: 'aim02-q-pi-1', prompt: 'A rare disease affects 1 in 10,000 people. A test is 99% accurate. A patient tests positive. What is the BEST next step before concluding they are likely sick?', options: [
        { id: 'a', text: 'Treat immediately — 99% accuracy is conclusive' },
        { id: 'b', text: 'Apply Bayes\' theorem using the base rate, since most positives in a rare-condition population are false positives' },
        { id: 'c', text: 'Ignore the test — it\'s unreliable' },
        { id: 'd', text: 'Retest with the same test only' },
      ], correctId: 'b', feedbackCorrect: 'Correct — Bayes\' theorem accounts for how rare the condition is; even a 99% test produces mostly false positives when the underlying condition is rare.', feedbackIncorrect: 'When a condition is very rare, even a highly accurate test produces more false positives than true positives — use Bayes\' theorem to compute the actual probability of disease given a positive test.' },
      { id: 'aim02-q-pi-2', prompt: 'A study finds ice cream sales and drowning deaths are correlated. The BEST interpretation is:', options: [
        { id: 'a', text: 'Ice cream causes drowning' },
        { id: 'b', text: 'Drowning causes ice cream sales' },
        { id: 'c', text: 'A confounding variable (e.g., summer heat) likely drives both' },
        { id: 'd', text: 'The correlation is meaningless and should be discarded' },
      ], correctId: 'c', feedbackCorrect: 'Correct — correlation does not imply causation; a third variable like warm weather drives both ice cream sales and more swimming, hence more drownings.', feedbackIncorrect: 'Correlation between two variables can result from a confounding variable that influences both; summer heat drives both ice cream consumption and swimming activity (hence drowning risk).' },
      { id: 'aim02-q-pi-3', prompt: 'A p-value of 0.03 in a hypothesis test is generally interpreted as:', options: [
        { id: 'a', text: 'Proof the effect is real' },
        { id: 'b', text: '3% chance the null hypothesis is true' },
        { id: 'c', text: 'Evidence against the null hypothesis at a common significance threshold, not proof' },
        { id: 'd', text: 'The effect size' },
      ], correctId: 'c', feedbackCorrect: 'Correct — a p-value measures the probability of the data under the null hypothesis, not the probability the effect is real; p = 0.03 means 3% chance of this data if null were true, crossing the common 0.05 threshold.', feedbackIncorrect: 'A p-value is the probability of observing this data (or more extreme) *if the null hypothesis is true*, not the probability the effect is real or the magnitude of the effect.' },
    ],
  },
];

const AIM02_BLANKS = [
  { id: 'aim02-b1', prompt: 'The ______ is the square root of the variance and expresses spread in the same units as the original data.', accept: ['standard deviation'] },
  { id: 'aim02-b2', prompt: '______ theorem updates the probability of a hypothesis given new evidence.', accept: ['Bayes\'', 'Bayes'] },
  { id: 'aim02-b3', prompt: 'Two variables moving together does not imply one ______ the other.', accept: ['causes'] },
  { id: 'aim02-b4', prompt: 'In numpy, applying an operation across an entire array without an explicit loop is called ______.', accept: ['vectorization'] },
];

const AIM02_SOURCES = [
  { title: 'NumPy documentation', org: 'NumPy', url: 'https://numpy.org/doc/stable/', note: 'Array operations, broadcasting, and vectorized computation used throughout the track.' },
  { title: 'Khan Academy — Statistics and Probability', org: 'Khan Academy', url: 'https://www.khanacademy.org/math/statistics-probability', note: 'Free, structured coverage of the distributions and inference concepts introduced here.' },
];

const AIM02_LAB_ID = 'aim02-numpy-bayes-v1';
const AIM02_LAB_KEY = 'lab-aim-02-numpy-bayes';

const AIM02_LAB_STEPS = [
  { id: 'numpy-load', label: 'Loaded a numeric dataset into a numpy array.' },
  { id: 'numpy-stats', label: 'Computed mean, median, standard deviation, and IQR-based outlier bounds using numpy (no manual loops).' },
  { id: 'numpy-loop-compare', label: 'Re-implemented the same computation with a manual Python loop and compared runtime on a large array.' },
  { id: 'bayes-setup', label: 'Given a spam-classifier scenario with prior probabilities and observed word frequencies, computed the posterior probability a message is spam by hand.' },
  { id: 'bayes-code', label: 'Implemented Bayes\' theorem in code and verified it matched the hand calculation.' },
  { id: 'bayes-reflection', label: 'Wrote an explanation of why a 99%-accurate test can still produce mostly false positives when the underlying condition is rare (base-rate fallacy).' },
];

const AIM02_DEFAULT_STATE = {
  stepsDone: {}, reflection: '', reflectionChecked: false,
  reviewMode: false,
  blankAnswers: {}, blankResults: {},
};

let aim02State = null;
let aim02User = null;
let aim02QuizState = null;

function aim02Load(user) {
  aim02User = user;
  aim02State = LabRuntime.load(AIM02_LAB_ID, user, AIM02_DEFAULT_STATE);
  if (!aim02State.stepsDone || typeof aim02State.stepsDone !== 'object') aim02State.stepsDone = {};
  if (!aim02State.blankAnswers) aim02State.blankAnswers = {};
  if (!aim02State.blankResults) aim02State.blankResults = {};

  if (!aim02QuizState) {
    const previousQuestionIds = aim02State.lastQuizQuestionIds || [];
    const selection = selectQuizQuestions(AIM02_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    aim02QuizState = {
      selectedQuestions: selection.selectedQuestions,
      questionsByAnswer: selection.questionsByAnswer,
      answers: {}, scored: false, attempts: 0, score: 0, bestScore: 0, feedback: [], passed: false,
    };
  }

  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'ai-ml', 'aim-02');
  return aim02State;
}

function aim02Save() {
  if (aim02User && aim02State) LabRuntime.save(AIM02_LAB_ID, aim02User, aim02State);
}

/* -------------------------------------------------------------- lessons */

function aim02LessonCard(lesson) {
  return `<details class="aim-lesson" data-aim02-lesson="${esc(lesson.id)}" ${aim02State.reviewMode ? 'open' : ''}>
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

function aim02BlankItem(blank) {
  const value = aim02State.blankAnswers[blank.id] || '';
  const result = aim02State.blankResults[blank.id];
  const statusClass = result === true ? 'is-correct' : result === false ? 'is-incorrect' : '';
  return `<li class="aim-blank-item ${statusClass}" data-aim02-blank="${esc(blank.id)}">
    <p class="aim-blank-prompt">${esc(blank.prompt)}</p>
    <div class="aim-blank-row">
      <input type="text" value="${esc(value)}" data-aim02-blank-input="${esc(blank.id)}" aria-label="Your answer" autocomplete="off" />
      <button type="button" class="aim-blank-check" data-aim02-blank-check="${esc(blank.id)}">Check</button>
    </div>
    ${result === true ? '<p class="aim-blank-result">Correct.</p>' : ''}
    ${result === false ? `<p class="aim-blank-result">Not quite — expected: ${esc(blank.accept[0])}</p>` : ''}
  </li>`;
}

function aim02BlankDrill() {
  return `<ul class="aim-blank-list">${AIM02_BLANKS.map(aim02BlankItem).join('')}</ul>`;
}

/* -------------------------------------------------------------- quiz */

function aim02QuizQuestion(selected, index) {
  const question = selected.question;
  const userAnswerId = aim02QuizState?.answers?.[question.id];
  return `<fieldset class="aim-quiz-question" data-question-id="${esc(question.id)}">
    <legend><span>${index + 1}</span> ${esc(selected.conceptTitle)}: ${esc(question.prompt)}</legend>
    <div class="aim-quiz-options">
      ${selected.shuffledOptions.map((option) => `<label>
        <input type="radio" name="q-${esc(question.id)}" value="${esc(option.id)}" ${userAnswerId === option.id ? 'checked' : ''} data-aim02-quiz-answer />
        <span>${esc(option.text)}</span>
      </label>`).join('')}
    </div>
  </fieldset>`;
}

function aim02QuizPanel() {
  if (!aim02QuizState?.selectedQuestions || aim02QuizState.selectedQuestions.length === 0) {
    return `<div class="aim-quiz-empty" id="aim02-quiz-feedback" role="status">Loading quiz…</div>`;
  }
  const selected = aim02QuizState.selectedQuestions;
  const answered = Object.keys(aim02QuizState.answers || {}).length;
  const total = selected.length;

  let feedbackHtml = '';
  if (aim02QuizState.scored) {
    const passed = aim02QuizState.score >= 70;
    feedbackHtml = `<section class="aim-quiz-score ${passed ? 'aim-quiz-pass' : 'aim-quiz-remediate'}" id="aim02-quiz-feedback" tabindex="-1" aria-live="polite">
      <div class="aim-quiz-score-heading">
        <div><p class="aim-kicker">Attempt ${aim02QuizState.attempts} · best ${aim02QuizState.bestScore}/100</p><h3>${aim02QuizState.score}/100 — ${passed ? 'Knowledge check passed' : 'Review and retry'}</h3></div>
        <span>${aim02QuizState.score}</span>
      </div>
      <ul class="aim-quiz-feedback-list">${(aim02QuizState.feedback || []).map((fb) => `<li>
        <i class="ri-${fb.correct ? 'checkbox-circle-fill' : 'information-line'}" aria-hidden="true"></i>
        <div><strong>${fb.correct ? 'Correct' : 'Review'}</strong><p>${esc(fb.message)}</p></div>
      </li>`).join('')}</ul>
      ${!passed ? `<div class="aim-quiz-actions"><button type="button" class="aim-quiz-retry" data-aim02-quiz-retry><i class="ri-refresh-line" aria-hidden="true"></i> Try different questions</button></div>` : ''}
    </section>`;
  } else if (answered === total) {
    feedbackHtml = `<div class="aim-quiz-ready" id="aim02-quiz-feedback" role="status">All questions answered. Submit to check your responses.</div>`;
  } else {
    feedbackHtml = `<div class="aim-quiz-empty" id="aim02-quiz-feedback" role="status">Answer all ${total} questions to submit.</div>`;
  }

  return `<form class="aim-quiz-form" id="aim02-quiz-form" novalidate>
    <div class="aim-panel-heading"><div><p class="aim-kicker">Knowledge check</p><h3>Test your understanding of data fundamentals and statistics</h3></div><span>${answered}/${total} answered</span></div>
    ${selected.map((sel, idx) => aim02QuizQuestion(sel, idx)).join('')}
    <div class="aim-quiz-actions">
      <button class="aim-quiz-submit" type="submit" ${answered < total ? 'disabled' : ''}><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Check my answers</button>
    </div>
    ${feedbackHtml}
  </form>`;
}

/* -------------------------------------------------------------- lab */

function aim02LabStepItem(step) {
  const done = Boolean(aim02State.stepsDone[step.id]);
  return `<li class="aim-lab-step ${done ? 'is-done' : ''}"><input type="checkbox" id="aim02-step-${esc(step.id)}" data-aim02-step="${esc(step.id)}" ${done ? 'checked' : ''} /><label for="aim02-step-${esc(step.id)}"><span>${esc(step.label)}</span></label></li>`;
}

function aim02LabStatus() {
  const allDone = AIM02_LAB_STEPS.every((step) => aim02State.stepsDone[step.id]);
  const reflectionOk = aim02State.reflection.trim().length >= 40;
  const complete = allDone && reflectionOk;
  return `<div class="aim-lab-status ${complete ? 'aim-status-pass' : 'aim-status-pending'}"><i class="${complete ? 'ri-checkbox-circle-fill' : 'ri-time-line'}" aria-hidden="true"></i><span>${complete ? 'Lab complete — every step is checked and your reflection is recorded.' : 'Check off every step in your own Python environment, then record a short reflection.'}</span></div>`;
}

function aim02LabPanel() {
  return `
    <ol class="aim-lab-steps">${AIM02_LAB_STEPS.map(aim02LabStepItem).join('')}</ol>
    <div class="aim-reflection">
      <label for="aim02-reflection">Explain why a 99%-accurate test can still produce mostly false positives when the underlying condition is rare (the base-rate fallacy).</label>
      <textarea id="aim02-reflection" data-aim02-reflection rows="4">${esc(aim02State.reflection)}</textarea>
      <small>Write at least a couple of sentences — this is your evidence that the lab was actually completed.</small>
    </div>
    ${aim02LabStatus()}
  `;
}

/* -------------------------------------------------------------- shell */

function aim02Sections() {
  const labComplete = AIM02_LAB_STEPS.every((step) => aim02State.stepsDone[step.id]) && aim02State.reflection.trim().length >= 40;
  return [
    { id: 'aim02-lessons', title: 'Foundations', type: 'lecture', isComplete: true, scrollId: 'aim02-lessons' },
    { id: 'aim02-knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: Boolean(aim02QuizState?.passed), scrollId: 'aim02-knowledge-check' },
    { id: 'aim02-lab', title: 'Hands-On Lab', type: 'lab', isComplete: labComplete, scrollId: 'aim02-lab' },
  ];
}

function viewAiMlModuleTwo(user, program) {
  aim02Load(user);
  const module = program.modules['aim-02'];

  return `<div class="aim-shell">
    ${moduleTopbar(user, program)}
    ${moduleProgressShell(aim02Sections(), { reviewMode: aim02State.reviewMode })}
    <main class="aim-main">
      <section class="aim-hero" aria-labelledby="aim02-title">
        <div>
          <p class="aim-kicker">Module 02 · ${formatInstructionalMinutes(module.durationMinutes)} · Week 1</p>
          <h1 id="aim02-title">${esc(module.title)}</h1>
          <p class="aim-lede">${esc(module.summary)}</p>
        </div>
        <dl class="aim-progress" aria-label="Saved module progress">
          <div><dt>Lessons</dt><dd>${module.lessons}</dd></div>
          <div><dt>Hands-on labs</dt><dd>${module.labs}</dd></div>
        </dl>
      </section>

      <section class="aim-objective" aria-labelledby="aim02-objective-title"><span><i class="ri-focus-2-line" aria-hidden="true"></i></span><div><p class="aim-kicker">One measurable objective</p><h2 id="aim02-objective-title">Apply linear algebra, probability, and statistics to reason about data, test hypotheses, and distinguish signal from noise using numpy.</h2></div></section>

      <details class="aim-section-collapsible" id="aim02-lessons" ${aim02State.reviewMode ? 'open' : 'open'}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>1</span><div><p class="aim-kicker">Learn</p><h2>Five foundation lessons</h2></div></div></summary>
        <div class="aim-section-body">
          <p class="aim-instruction">Open each lesson for the full walkthrough, then work its Try It Yourself exercise in your own Python environment.</p>
          <div class="aim-lesson-grid">${AIM02_LESSONS.map(aim02LessonCard).join('')}</div>
        </div>
      </details>

      <details class="aim-section-collapsible" id="aim02-blanks" ${aim02State.reviewMode ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>2</span><div><p class="aim-kicker">Vocabulary drill</p><h2>Fill in the blank</h2></div></div></summary>
        <div class="aim-section-body">${aim02BlankDrill()}</div>
      </details>

      <details class="aim-section-collapsible" id="aim02-knowledge-check" ${aim02State.reviewMode || (aim02QuizState && !aim02QuizState.passed) ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>3</span><div><p class="aim-kicker">Interactive knowledge check</p><h2>Test your understanding</h2></div></div></summary>
        <div class="aim-section-body"><div id="aim02-quiz-dynamic">${aim02QuizPanel()}</div></div>
      </details>

      <details class="aim-section-collapsible" id="aim02-lab" ${aim02State.reviewMode ? 'open' : 'open'}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>4</span><div><p class="aim-kicker">Hands-on · your own environment</p><h2>Vectorized Statistics &amp; Bayes\' Theorem</h2></div></div></summary>
        <div class="aim-section-body">
          <p class="aim-instruction">Work both labs in your own Python environment: compute summary statistics with numpy and compare performance to a manual loop, then apply Bayes\' theorem to a spam-classification scenario and explain the base-rate fallacy in writing. Check off each step below as you complete it.</p>
          <div id="aim02-lab-dynamic">${aim02LabPanel()}</div>
        </div>
      </details>

      <details class="aim-section-collapsible" id="aim02-sources" ${aim02State.reviewMode ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>5</span><div><p class="aim-kicker">Supporting resources</p><h2>Further reading</h2></div></div></summary>
        <div class="aim-section-body">${moduleSourcesBlock(AIM02_SOURCES)}</div>
      </details>
    </main>
  </div>`;
}

/* -------------------------------------------------------------- render helpers */

function aim02RenderQuiz(focusId) {
  const el = document.getElementById('aim02-quiz-dynamic');
  if (!el) return;
  el.innerHTML = aim02QuizPanel();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function aim02RenderLab() {
  const el = document.getElementById('aim02-lab-dynamic');
  if (!el) return;
  el.innerHTML = aim02LabPanel();
}

function aim02CheckLabComplete(wasComplete) {
  const allDone = AIM02_LAB_STEPS.every((step) => aim02State.stepsDone[step.id]);
  const reflectionOk = aim02State.reflection.trim().length >= 40;
  const nowComplete = allDone && reflectionOk;
  if (nowComplete && !wasComplete) {
    if (typeof recordLabAttempt === 'function') recordLabAttempt(aim02User, AIM02_LAB_KEY, { state: 'complete', score: 100, result: { steps: AIM02_LAB_STEPS.length } });
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(aim02User, 'ai-ml', 'aim-02', AIM02_LAB_KEY);
  }
  return nowComplete;
}

/* -------------------------------------------------------------- wiring */

function wireAiMlModuleTwo() {
  const shell = document.querySelector('.aim-shell');
  if (!shell || !aim02State) return;

  shell.addEventListener('click', (event) => {
    if (event.target.closest('[data-mnav-review-toggle]')) {
      aim02State.reviewMode = !aim02State.reviewMode;
      aim02Save();
      render();
      return;
    }
    const blankCheck = event.target.closest('[data-aim02-blank-check]');
    if (blankCheck) {
      const id = blankCheck.dataset.aim02BlankCheck;
      const blank = AIM02_BLANKS.find((b) => b.id === id);
      const input = shell.querySelector(`[data-aim02-blank-input="${id}"]`);
      const given = (input?.value || '').trim().toLowerCase();
      aim02State.blankResults[id] = blank.accept.some((accepted) => accepted.toLowerCase() === given);
      aim02Save();
      const item = shell.querySelector(`[data-aim02-blank="${id}"]`);
      if (item) item.outerHTML = aim02BlankItem(blank);
      return;
    }
    const retry = event.target.closest('[data-aim02-quiz-retry]');
    if (retry) {
      const previousQuestionIds = aim02QuizState.selectedQuestions.map((s) => s.question.id);
      const selection = selectQuizQuestions(AIM02_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
      aim02QuizState = { selectedQuestions: selection.selectedQuestions, questionsByAnswer: selection.questionsByAnswer, answers: {}, scored: false, attempts: aim02QuizState.attempts, score: 0, bestScore: aim02QuizState.bestScore, feedback: [], passed: false };
      aim02State.lastQuizQuestionIds = previousQuestionIds;
      aim02Save();
      aim02RenderQuiz('aim02-quiz-title');
    }
  });

  shell.addEventListener('input', (event) => {
    if (event.target.matches('[data-aim02-blank-input]')) {
      const id = event.target.dataset.aim02BlankInput;
      aim02State.blankAnswers[id] = event.target.value;
      aim02Save();
      return;
    }
    if (event.target.matches('[data-aim02-reflection]')) {
      const wasComplete = AIM02_LAB_STEPS.every((step) => aim02State.stepsDone[step.id]) && aim02State.reflection.trim().length >= 40;
      aim02State.reflection = event.target.value;
      aim02CheckLabComplete(wasComplete);
      aim02Save();
    }
  });

  shell.addEventListener('change', (event) => {
    if (event.target.matches('[data-aim02-step]')) {
      const wasComplete = AIM02_LAB_STEPS.every((step) => aim02State.stepsDone[step.id]) && aim02State.reflection.trim().length >= 40;
      const id = event.target.dataset.aim02Step;
      aim02State.stepsDone[id] = event.target.checked;
      aim02CheckLabComplete(wasComplete);
      aim02Save();
      aim02RenderLab();
      return;
    }
    if (event.target.matches('[data-aim02-quiz-answer]')) {
      const questionId = event.target.closest('[data-question-id]')?.dataset.questionId;
      if (questionId) {
        aim02QuizState.answers[questionId] = event.target.value;
        aim02State.lastQuizQuestionIds = aim02QuizState.selectedQuestions.map((s) => s.question.id);
        aim02Save();
        aim02RenderQuiz();
      }
    }
  });

  shell.addEventListener('submit', (event) => {
    if (event.target.id !== 'aim02-quiz-form') return;
    event.preventDefault();
    const result = scoreQuizAttempt(aim02QuizState.selectedQuestions, aim02QuizState.questionsByAnswer, aim02QuizState.answers);
    aim02QuizState.attempts += 1;
    aim02QuizState.score = result.score;
    aim02QuizState.bestScore = Math.max(aim02QuizState.bestScore || 0, result.score);
    aim02QuizState.feedback = result.feedback;
    aim02QuizState.passed = result.score >= 70;
    aim02QuizState.scored = true;
    if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(aim02User, 'aim-02-knowledge-check', { state: aim02QuizState.passed ? 'complete' : 'in_progress', score: result.score });
    }
    aim02Save();
    aim02RenderQuiz('aim02-quiz-feedback');
  });
}

registerModuleLab({
  program: 'ai-ml',
  moduleNumber: 2,
  moduleKey: 'aim-02',
  view: viewAiMlModuleTwo,
  wire: wireAiMlModuleTwo,
});
