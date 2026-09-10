/* Module 04 — Exploratory Data Analysis & Visualization ('ai-ml').
 * Content authored from AI_ML_ENGINEERING_CURRICULUM.md (2026-09-10).
 * Labs run in the student's own real Python environment (no in-portal code
 * execution sandbox exists) — completion is tracked as a guided step
 * checklist plus short written reflections, evidence-based like
 * it-support-module-01.js's Lab 1.1, not a simulated console.
 * Reference pattern: ai-ml-module-01.js. Rename all 'aim01' → 'aim04', etc.
 */

const AIM04_LESSONS = [
  {
    id: 'aim04-lesson-01', number: '4.1', icon: 'ri-bar-chart-line',
    title: 'EDA in CRISP-DM & Univariate Analysis', minutes: 120,
    learn: [
      'How exploratory data analysis (EDA) fits into the CRISP-DM data understanding phase',
      'How to profile a dataset\'s shape, types, and distributions before modeling',
      'How to spot outliers and skew with histograms, box plots, and summary statistics',
    ],
    topics: [
      { heading: 'Why EDA Matters', body: 'In CRISP-DM, the data understanding phase comes before any model is written. EDA is how you learn what your dataset actually contains — its shape (rows/columns), data types (numeric, categorical, date), distributions, missing values, and quality issues. A model trained on data you did not understand will fail predictably or silently give wrong answers to the business. Spending a few hours here saves weeks of debugging a bad model later.' },
      { heading: 'Univariate Analysis', body: 'Start by analyzing each column in isolation. A histogram shows the distribution shape of a numeric column — where its values cluster, how spread out it is, whether it is skewed (left or right tail). A box plot shows the quartiles (25th, 50th, 75th percentile) and flags outliers beyond the whiskers. Summary statistics like mean, median, standard deviation, min, and max tell you the center and spread of each numeric column, while value_counts() on a categorical column shows which categories appear most.' },
      { heading: 'Detecting Skew and Outliers', body: 'A histogram heavily skewed to one side (income often skews right, log income skews less) signals that a future linear model may not work well without transformation. Box plots highlight outliers — points beyond 1.5× the interquartile range (IQR) — which may be genuine extremes, measurement errors, or domain-specific edge cases worth flagging to stakeholders.' },
    ],
    practice: [
      'Generate a histogram and box plot for a numeric column in a dataset you have; describe what you see about its distribution and any outliers.',
      'Run .describe() on a DataFrame and interpret the mean, std, min, and max for a column with skew.',
    ],
    comingUp: 'You\'ll apply this univariate analysis to every numeric and categorical column in your lab dataset, the first step of a complete EDA.',
  },
  {
    id: 'aim04-lesson-02', number: '4.2', icon: 'ri-git-network-line',
    title: 'Bivariate & Categorical Analysis', minutes: 110,
    learn: [
      'How to visualize relationships between two or more variables',
      'When to use scatter plots, pair plots, and correlation heatmaps',
      'How to analyze categorical variables with bar charts and cross-tabulations',
    ],
    topics: [
      { heading: 'Scatter Plots and Pair Plots', body: 'A scatter plot of two numeric variables shows whether they move together (positive correlation), in opposite directions (negative), or not at all. A pair plot draws every pairwise scatter plot in a grid, letting you scan for linear and non-linear relationships at a glance. Scatter plots are essential for spotting non-linear relationships that a correlation coefficient alone would miss.' },
      { heading: 'Correlation Heatmaps', body: 'A correlation matrix computes the Pearson correlation coefficient (range: −1 to 1) between every pair of numeric columns. A visualization of this matrix as a colored heatmap (dark = high correlation, light = low) makes patterns jump out visually. A heatmap shows you which features move together, but remember: correlation ≠ causation. High correlations can signal multicollinearity, a problem for certain models later.' },
      { heading: 'Categorical Analysis', body: 'A bar chart shows the count of each category, or the mean of a numeric outcome grouped by category. A cross-tabulation (crosstab) builds a two-way table showing how often pairs of categories appear together, useful for spotting patterns like "female customers tend to buy product X more often than male customers".' },
    ],
    practice: [
      'Create a scatter plot of two numeric columns; note whether you see a linear pattern, a non-linear one, or no pattern at all.',
      'Build a correlation heatmap for 5+ numeric columns and identify the three strongest pairwise correlations.',
    ],
    comingUp: 'Your lab asks you to build a correlation heatmap and flag high correlations as multicollinearity risks — this lesson teaches the exact technique.',
  },
  {
    id: 'aim04-lesson-03', number: '4.3', icon: 'ri-line-chart-line',
    title: 'Time-Series & Chart Selection', minutes: 100,
    learn: [
      'How time-series data differs from cross-sectional snapshots and why it matters',
      'How to choose the right chart type for the question you\'re trying to answer',
      'How to spot trend, seasonality, and cyclic patterns in time-indexed data',
    ],
    topics: [
      { heading: 'Time-Series Basics', body: 'A time-series dataset has a datetime index and values observed at regular intervals (daily, monthly, yearly). Line charts are the standard for showing how a value changes over time — trends (is it growing or shrinking?), seasonality (does it repeat every year?), and anomalies (sudden spikes or drops). Aggregating time-series data (monthly average from daily readings) can reveal patterns obscured in raw noise.' },
      { heading: 'Choosing the Right Chart', body: 'The question determines the chart: To show a distribution, use a histogram or box plot. To compare values across categories, use a bar chart. To show correlation between two numeric variables, use a scatter plot. To show composition (parts of a whole), use a stacked bar or pie chart. To show trends over time, use a line chart. Choosing wrong makes patterns invisible or confuses the viewer — a pie chart cannot show whether a series is growing.' },
      { heading: 'Spotting Patterns', body: 'A line chart that climbs steadily shows an upward trend. One that repeats the same pattern every 12 months shows annual seasonality. A sudden jump or drop is an anomaly worth investigating — did a business event cause it, or is it a data-collection error? Decomposing a time-series into trend, seasonality, and residual (what\'s left over) makes these patterns explicit.' },
    ],
    practice: [
      'Plot a time-series column and describe the trend, seasonality, and any anomalies you observe.',
      'Given a business question (e.g., "which month sells the most?"), choose the chart type you\'d use and sketch why.',
    ],
    comingUp: 'Your lab focuses on a static dataset, but knowing time-series visualization prepares you for real-world datasets that often come indexed by date.',
  },
  {
    id: 'aim04-lesson-04', number: '4.4', icon: 'ri-file-text-line',
    title: 'Multicollinearity, Libraries & Communication', minutes: 90,
    learn: [
      'What multicollinearity is, why it matters for certain models, and how to spot it',
      'How to use matplotlib and seaborn to build publication-quality charts',
      'How to write an EDA summary that non-technical stakeholders can act on',
    ],
    topics: [
      { heading: 'Multicollinearity', body: 'Multicollinearity occurs when two or more features are highly correlated — they contain redundant information. For some models (linear regression, logistic regression), high multicollinearity inflates coefficients and makes the model unstable: tiny changes to the data cause huge swings in which feature is "most important". Detecting it early (via correlation heatmap and VIF — variance inflation factor) lets you decide whether to drop a feature, combine them (e.g., ratio or average), or keep them if the model is robust to it. The key: high correlation ≠ always bad, but always flag it and decide intentionally.' },
      { heading: 'matplotlib and seaborn', body: 'matplotlib is the foundation library for Python charting — it is low-level but gives complete control. seaborn is built on matplotlib and adds statistical plotting: sns.histplot() for distributions, sns.scatterplot() for relationships, sns.heatmap() for correlation matrices. seaborn handles legend, label, and color palette details automatically, making it faster for EDA than raw matplotlib.' },
      { heading: 'Communicating to Stakeholders', body: 'A stakeholder (business leader, product manager, domain expert) cares about findings, not code or statistics. An EDA summary is a one-page narrative: key patterns, data-quality caveats, and a clear recommendation for modeling, backed by no more than three charts. Avoid jargon; explain what "correlation" means in simple terms. If data is missing or biased in a way that affects the recommendation, call it out explicitly. A good summary is a bridge between the data analyst and the decision-maker.' },
    ],
    practice: [
      'Calculate the Pearson correlation matrix for a dataset; identify and flag any pair above 0.85 as a multicollinearity risk.',
      'Draft the opening paragraph of an EDA summary: what is the single most important insight from your dataset?',
    ],
    comingUp: 'Your lab asks you to do both: profile the dataset, flag multicollinearity, and write a stakeholder EDA summary.',
  },
];

const AIM04_QUIZ_BANKS = [
  {
    conceptId: 'aim04-chart-selection', conceptTitle: 'Chart selection', questions: [
      { id: 'aim04-q-cs-1', prompt: 'To show the distribution of a single numeric variable and spot outliers at the same time, the BEST chart is:', options: [
        { id: 'a', text: 'Pie chart' },
        { id: 'b', text: 'Box plot' },
        { id: 'c', text: 'Line chart' },
        { id: 'd', text: 'Bar chart' },
      ], correctId: 'b', feedbackCorrect: 'Correct — a box plot displays quartiles and flags outliers beyond the whiskers in a single, compact view.', feedbackIncorrect: 'A box plot is the chart that displays quartiles and flags outliers beyond the whiskers, making it ideal for univariate analysis.' },
      { id: 'aim04-q-cs-2', prompt: 'To compare a numeric outcome across five product categories, the BEST chart is:', options: [
        { id: 'a', text: 'Scatter plot' },
        { id: 'b', text: 'Grouped bar chart or box plot per category' },
        { id: 'c', text: 'Pie chart' },
        { id: 'd', text: 'Single histogram of all categories combined' },
      ], correctId: 'b', feedbackCorrect: 'Correct — grouped bar charts and per-category box plots both let you compare a numeric value across categories side-by-side.', feedbackIncorrect: 'A grouped bar chart or separate box plots per category let you compare numeric values across categories clearly; a pie chart or single histogram obscures the comparison.' },
    ],
  },
  {
    conceptId: 'aim04-relationships', conceptTitle: 'Relationships', questions: [
      { id: 'aim04-q-rel-1', prompt: 'A correlation heatmap shows two features at 0.93 correlation. The MOST appropriate next step before modeling is:', options: [
        { id: 'a', text: 'Ignore it' },
        { id: 'b', text: 'Consider dropping or combining one of the two features to reduce multicollinearity' },
        { id: 'c', text: 'Automatically conclude one causes the other' },
        { id: 'd', text: 'Delete both features immediately without review' },
      ], correctId: 'b', feedbackCorrect: 'Correct — high correlation signals multicollinearity; the responsible step is to consider dropping or combining features intentionally.', feedbackIncorrect: 'High correlation is a multicollinearity risk. The correct response is to consider dropping one feature or combining them; ignoring it, claiming causation, or deleting both without thought are all mistakes.' },
      { id: 'aim04-q-rel-2', prompt: 'A scatter plot shows no visible linear pattern between two variables. This means:', options: [
        { id: 'a', text: 'There is definitely no relationship of any kind' },
        { id: 'b', text: 'There is no strong linear relationship, but a non-linear one is still possible' },
        { id: 'c', text: 'The data must be wrong' },
        { id: 'd', text: 'A correlation coefficient is unnecessary now' },
      ], correctId: 'b', feedbackCorrect: 'Correct — a scatter plot showing no linear pattern still leaves room for non-linear relationships, which Pearson correlation would miss.', feedbackIncorrect: 'No visible linear pattern means no linear relationship, but a non-linear one (exponential, quadratic, etc.) can still exist and a correlation coefficient alone would miss it.' },
    ],
  },
  {
    conceptId: 'aim04-communication', conceptTitle: 'Communication', questions: [
      { id: 'aim04-q-comm-1', prompt: 'An EDA summary for a non-technical stakeholder should PRIORITIZE:', options: [
        { id: 'a', text: 'Every statistical test run during exploration' },
        { id: 'b', text: 'Key patterns, data-quality caveats, and a clear recommendation' },
        { id: 'c', text: 'Raw output from every chart generated' },
        { id: 'd', text: 'Code used to generate the charts' },
      ], correctId: 'b', feedbackCorrect: 'Correct — stakeholders care about findings, caveats, and what to do next, not raw output or code.', feedbackIncorrect: 'A stakeholder-facing EDA summary focuses on key patterns, data-quality caveats, and a clear recommendation; statistical details, raw output, and code are not the priority.' },
      { id: 'aim04-q-comm-2', prompt: 'A histogram of income is heavily right-skewed. Before feeding this into a linear model later, the analyst should:', options: [
        { id: 'a', text: 'Ignore the skew' },
        { id: 'b', text: 'Note it now and flag it for possible transformation (e.g., log transform) in feature engineering' },
        { id: 'c', text: 'Delete high-income rows' },
        { id: 'd', text: 'Convert income to a categorical variable immediately with no analysis' },
      ], correctId: 'b', feedbackCorrect: 'Correct — detecting skew in EDA and flagging it for transformation later is the professional practice.', feedbackIncorrect: 'Detecting skew in EDA and planning a transformation (like log transform) in the feature engineering phase is the right approach; ignoring it, deleting rows, or converting recklessly are all mistakes.' },
    ],
  },
];

const AIM04_BLANKS = [
  { id: 'aim04-b1', prompt: 'A ______ plot displays the distribution of a numeric variable using quartiles and highlights outliers.', accept: ['box'] },
  { id: 'aim04-b2', prompt: 'When two features are highly correlated with each other, this is called ______.', accept: ['multicollinearity'] },
  { id: 'aim04-b3', prompt: 'EDA in CRISP-DM primarily supports the ______ ______ phase.', accept: ['data understanding', 'data-understanding'] },
  { id: 'aim04-b4', prompt: 'A ______ map visualizes the pairwise correlation between numeric variables using color intensity.', accept: ['heat', 'heatmap', 'heat map'] },
];

const AIM04_SOURCES = [
  { title: 'pandas documentation', org: 'pandas', url: 'https://pandas.pydata.org/docs/', note: '.describe(), .corr(), and grouping used throughout EDA.' },
  { title: 'NumPy documentation', org: 'NumPy', url: 'https://numpy.org/doc/stable/', note: 'Numeric backing for the summary statistics behind every chart in this module.' },
];

const AIM04_LAB_ID = 'aim04-eda-brief-v1';
const AIM04_LAB_KEY = 'lab-aim-04-eda-brief';

const AIM04_LAB_STEPS = [
  { id: 'histograms', label: 'Generated histograms for all numeric columns and bar charts for all categorical columns.' },
  { id: 'correlation', label: 'Built a correlation heatmap and identified the three strongest pairwise correlations.' },
  { id: 'multicollinearity', label: 'Flagged any variable pair with correlation above 0.85 as a multicollinearity risk for later modeling.' },
  { id: 'narrative', label: 'Drafted a one-page, non-technical EDA summary describing the dataset\'s key patterns and data-quality caveats.' },
  { id: 'recommendation', label: 'Included at least one clear recommendation for modeling, backed by no more than three charts.' },
  { id: 'summary', label: 'Wrote an opening paragraph explaining the single most important pattern or caveat a stakeholder needs to know.' },
];

const AIM04_DEFAULT_STATE = {
  stepsDone: {}, reflection: '', reflectionChecked: false,
  reviewMode: false,
  blankAnswers: {}, blankResults: {},
};

let aim04State = null;
let aim04User = null;
let aim04QuizState = null;

function aim04Load(user) {
  aim04User = user;
  aim04State = LabRuntime.load(AIM04_LAB_ID, user, AIM04_DEFAULT_STATE);
  if (!aim04State.stepsDone || typeof aim04State.stepsDone !== 'object') aim04State.stepsDone = {};
  if (!aim04State.blankAnswers) aim04State.blankAnswers = {};
  if (!aim04State.blankResults) aim04State.blankResults = {};

  if (!aim04QuizState) {
    const previousQuestionIds = aim04State.lastQuizQuestionIds || [];
    const selection = selectQuizQuestions(AIM04_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    aim04QuizState = {
      selectedQuestions: selection.selectedQuestions,
      questionsByAnswer: selection.questionsByAnswer,
      answers: {}, scored: false, attempts: 0, score: 0, bestScore: 0, feedback: [], passed: false,
    };
  }

  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'ai-ml', 'aim-04');
  return aim04State;
}

function aim04Save() {
  if (aim04User && aim04State) LabRuntime.save(AIM04_LAB_ID, aim04User, aim04State);
}

/* -------------------------------------------------------------- lessons */

function aim04LessonCard(lesson) {
  return `<details class="aim-lesson" data-aim04-lesson="${esc(lesson.id)}" ${aim04State.reviewMode ? 'open' : ''}>
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

function aim04BlankItem(blank) {
  const value = aim04State.blankAnswers[blank.id] || '';
  const result = aim04State.blankResults[blank.id];
  const statusClass = result === true ? 'is-correct' : result === false ? 'is-incorrect' : '';
  return `<li class="aim-blank-item ${statusClass}" data-aim04-blank="${esc(blank.id)}">
    <p class="aim-blank-prompt">${esc(blank.prompt)}</p>
    <div class="aim-blank-row">
      <input type="text" value="${esc(value)}" data-aim04-blank-input="${esc(blank.id)}" aria-label="Your answer" autocomplete="off" />
      <button type="button" class="aim-blank-check" data-aim04-blank-check="${esc(blank.id)}">Check</button>
    </div>
    ${result === true ? '<p class="aim-blank-result">Correct.</p>' : ''}
    ${result === false ? `<p class="aim-blank-result">Not quite — expected: ${esc(blank.accept[0])}</p>` : ''}
  </li>`;
}

function aim04BlankDrill() {
  return `<ul class="aim-blank-list">${AIM04_BLANKS.map(aim04BlankItem).join('')}</ul>`;
}

/* -------------------------------------------------------------- quiz */

function aim04QuizQuestion(selected, index) {
  const question = selected.question;
  const userAnswerId = aim04QuizState?.answers?.[question.id];
  return `<fieldset class="aim-quiz-question" data-question-id="${esc(question.id)}">
    <legend><span>${index + 1}</span> ${esc(selected.conceptTitle)}: ${esc(question.prompt)}</legend>
    <div class="aim-quiz-options">
      ${selected.shuffledOptions.map((option) => `<label>
        <input type="radio" name="q-${esc(question.id)}" value="${esc(option.id)}" ${userAnswerId === option.id ? 'checked' : ''} data-aim04-quiz-answer />
        <span>${esc(option.text)}</span>
      </label>`).join('')}
    </div>
  </fieldset>`;
}

function aim04QuizPanel() {
  if (!aim04QuizState?.selectedQuestions || aim04QuizState.selectedQuestions.length === 0) {
    return `<div class="aim-quiz-empty" id="aim04-quiz-feedback" role="status">Loading quiz…</div>`;
  }
  const selected = aim04QuizState.selectedQuestions;
  const answered = Object.keys(aim04QuizState.answers || {}).length;
  const total = selected.length;

  let feedbackHtml = '';
  if (aim04QuizState.scored) {
    const passed = aim04QuizState.score >= 70;
    feedbackHtml = `<section class="aim-quiz-score ${passed ? 'aim-quiz-pass' : 'aim-quiz-remediate'}" id="aim04-quiz-feedback" tabindex="-1" aria-live="polite">
      <div class="aim-quiz-score-heading">
        <div><p class="aim-kicker">Attempt ${aim04QuizState.attempts} · best ${aim04QuizState.bestScore}/100</p><h3>${aim04QuizState.score}/100 — ${passed ? 'Knowledge check passed' : 'Review and retry'}</h3></div>
        <span>${aim04QuizState.score}</span>
      </div>
      <ul class="aim-quiz-feedback-list">${(aim04QuizState.feedback || []).map((fb) => `<li>
        <i class="ri-${fb.correct ? 'checkbox-circle-fill' : 'information-line'}" aria-hidden="true"></i>
        <div><strong>${fb.correct ? 'Correct' : 'Review'}</strong><p>${esc(fb.message)}</p></div>
      </li>`).join('')}</ul>
      ${!passed ? `<div class="aim-quiz-actions"><button type="button" class="aim-quiz-retry" data-aim04-quiz-retry><i class="ri-refresh-line" aria-hidden="true"></i> Try different questions</button></div>` : ''}
    </section>`;
  } else if (answered === total) {
    feedbackHtml = `<div class="aim-quiz-ready" id="aim04-quiz-feedback" role="status">All questions answered. Submit to check your responses.</div>`;
  } else {
    feedbackHtml = `<div class="aim-quiz-empty" id="aim04-quiz-feedback" role="status">Answer all ${total} questions to submit.</div>`;
  }

  return `<form class="aim-quiz-form" id="aim04-quiz-form" novalidate>
    <div class="aim-panel-heading"><div><p class="aim-kicker">Knowledge check</p><h3>Test your understanding of data analysis and visualization</h3></div><span>${answered}/${total} answered</span></div>
    ${selected.map((sel, idx) => aim04QuizQuestion(sel, idx)).join('')}
    <div class="aim-quiz-actions">
      <button class="aim-quiz-submit" type="submit" ${answered < total ? 'disabled' : ''}><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Check my answers</button>
    </div>
    ${feedbackHtml}
  </form>`;
}

/* -------------------------------------------------------------- lab */

function aim04LabStepItem(step) {
  const done = Boolean(aim04State.stepsDone[step.id]);
  return `<li class="aim-lab-step ${done ? 'is-done' : ''}"><input type="checkbox" id="aim04-step-${esc(step.id)}" data-aim04-step="${esc(step.id)}" ${done ? 'checked' : ''} /><label for="aim04-step-${esc(step.id)}"><span>${esc(step.label)}</span></label></li>`;
}

function aim04LabStatus() {
  const allDone = AIM04_LAB_STEPS.every((step) => aim04State.stepsDone[step.id]);
  const reflectionOk = aim04State.reflection.trim().length >= 40;
  const complete = allDone && reflectionOk;
  return `<div class="aim-lab-status ${complete ? 'aim-status-pass' : 'aim-status-pending'}"><i class="${complete ? 'ri-checkbox-circle-fill' : 'ri-time-line'}" aria-hidden="true"></i><span>${complete ? 'Lab complete — every step is checked and your reflection is recorded.' : 'Check off every step in your own Python environment, then record a short reflection.'}</span></div>`;
}

function aim04LabPanel() {
  return `
    <ol class="aim-lab-steps">${AIM04_LAB_STEPS.map(aim04LabStepItem).join('')}</ol>
    <div class="aim-reflection">
      <label for="aim04-reflection">Draft the opening paragraph of your one-page, non-technical EDA summary: what's the single most important pattern or caveat a stakeholder needs to know?</label>
      <textarea id="aim04-reflection" data-aim04-reflection rows="4">${esc(aim04State.reflection)}</textarea>
      <small>Write at least a couple of sentences — this is your evidence that the lab was actually completed.</small>
    </div>
    ${aim04LabStatus()}
  `;
}

/* -------------------------------------------------------------- shell */

function aim04Sections() {
  const labComplete = AIM04_LAB_STEPS.every((step) => aim04State.stepsDone[step.id]) && aim04State.reflection.trim().length >= 40;
  return [
    { id: 'aim04-lessons', title: 'Foundations', type: 'lecture', isComplete: true, scrollId: 'aim04-lessons' },
    { id: 'aim04-knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: Boolean(aim04QuizState?.passed), scrollId: 'aim04-knowledge-check' },
    { id: 'aim04-lab', title: 'Hands-On Lab', type: 'lab', isComplete: labComplete, scrollId: 'aim04-lab' },
  ];
}

function viewAiMlModuleFour(user, program) {
  aim04Load(user);
  const module = program.modules['aim-04'];

  return `<div class="aim-shell">
    ${moduleTopbar(user, program)}
    ${moduleProgressShell(aim04Sections(), { reviewMode: aim04State.reviewMode })}
    <main class="aim-main">
      <section class="aim-hero" aria-labelledby="aim04-title">
        <div>
          <p class="aim-kicker">Module 04 · ${formatInstructionalMinutes(module.durationMinutes)} · Week 2</p>
          <h1 id="aim04-title">${esc(module.title)}</h1>
          <p class="aim-lede">${esc(module.summary)}</p>
        </div>
        <dl class="aim-progress" aria-label="Saved module progress">
          <div><dt>Lessons</dt><dd>${module.lessons}</dd></div>
          <div><dt>Hands-on labs</dt><dd>${module.labs}</dd></div>
        </dl>
      </section>

      <section class="aim-objective" aria-labelledby="aim04-objective-title"><span><i class="ri-focus-2-line" aria-hidden="true"></i></span><div><p class="aim-kicker">One measurable objective</p><h2 id="aim04-objective-title">Profile a dataset's structure and relationships, detect quality issues and multicollinearity, and communicate findings clearly to non-technical stakeholders.</h2></div></section>

      <details class="aim-section-collapsible" id="aim04-lessons" ${aim04State.reviewMode ? 'open' : 'open'}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>1</span><div><p class="aim-kicker">Learn</p><h2>Four foundation lessons</h2></div></div></summary>
        <div class="aim-section-body">
          <p class="aim-instruction">Open each lesson for the full walkthrough, then work its Try It Yourself exercise in your own Python environment.</p>
          <div class="aim-lesson-grid">${AIM04_LESSONS.map(aim04LessonCard).join('')}</div>
        </div>
      </details>

      <details class="aim-section-collapsible" id="aim04-blanks" ${aim04State.reviewMode ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>2</span><div><p class="aim-kicker">Vocabulary drill</p><h2>Fill in the blank</h2></div></div></summary>
        <div class="aim-section-body">${aim04BlankDrill()}</div>
      </details>

      <details class="aim-section-collapsible" id="aim04-knowledge-check" ${aim04State.reviewMode || (aim04QuizState && !aim04QuizState.passed) ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>3</span><div><p class="aim-kicker">Interactive knowledge check</p><h2>Test your understanding</h2></div></div></summary>
        <div class="aim-section-body"><div id="aim04-quiz-dynamic">${aim04QuizPanel()}</div></div>
      </details>

      <details class="aim-section-collapsible" id="aim04-lab" ${aim04State.reviewMode ? 'open' : 'open'}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>4</span><div><p class="aim-kicker">Hands-on · your own environment</p><h2>Full Dataset Profile &amp; Stakeholder EDA Brief</h2></div></div></summary>
        <div class="aim-section-body">
          <p class="aim-instruction">Work both labs in your own Python environment: profile a dataset with histograms and correlation analysis, flag multicollinearity risks, and draft a one-page, non-technical EDA summary for stakeholders. Check off each step below as you complete it.</p>
          <div id="aim04-lab-dynamic">${aim04LabPanel()}</div>
        </div>
      </details>

      <details class="aim-section-collapsible" id="aim04-sources" ${aim04State.reviewMode ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>5</span><div><p class="aim-kicker">Supporting resources</p><h2>Further reading</h2></div></div></summary>
        <div class="aim-section-body">${moduleSourcesBlock(AIM04_SOURCES)}</div>
      </details>
    </main>
  </div>`;
}

/* -------------------------------------------------------------- render helpers */

function aim04RenderQuiz(focusId) {
  const el = document.getElementById('aim04-quiz-dynamic');
  if (!el) return;
  el.innerHTML = aim04QuizPanel();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function aim04RenderLab() {
  const el = document.getElementById('aim04-lab-dynamic');
  if (!el) return;
  el.innerHTML = aim04LabPanel();
}

function aim04CheckLabComplete(wasComplete) {
  const allDone = AIM04_LAB_STEPS.every((step) => aim04State.stepsDone[step.id]);
  const reflectionOk = aim04State.reflection.trim().length >= 40;
  const nowComplete = allDone && reflectionOk;
  if (nowComplete && !wasComplete) {
    if (typeof recordLabAttempt === 'function') recordLabAttempt(aim04User, AIM04_LAB_KEY, { state: 'complete', score: 100, result: { steps: AIM04_LAB_STEPS.length } });
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(aim04User, 'ai-ml', 'aim-04', AIM04_LAB_KEY);
  }
  return nowComplete;
}

/* -------------------------------------------------------------- wiring */

function wireAiMlModuleFour() {
  const shell = document.querySelector('.aim-shell');
  if (!shell || !aim04State) return;

  shell.addEventListener('click', (event) => {
    if (event.target.closest('[data-mnav-review-toggle]')) {
      aim04State.reviewMode = !aim04State.reviewMode;
      aim04Save();
      render();
      return;
    }
    const blankCheck = event.target.closest('[data-aim04-blank-check]');
    if (blankCheck) {
      const id = blankCheck.dataset.aim04BlankCheck;
      const blank = AIM04_BLANKS.find((b) => b.id === id);
      const input = shell.querySelector(`[data-aim04-blank-input="${id}"]`);
      const given = (input?.value || '').trim().toLowerCase();
      aim04State.blankResults[id] = blank.accept.some((accepted) => accepted.toLowerCase() === given);
      aim04Save();
      const item = shell.querySelector(`[data-aim04-blank="${id}"]`);
      if (item) item.outerHTML = aim04BlankItem(blank);
      return;
    }
    const retry = event.target.closest('[data-aim04-quiz-retry]');
    if (retry) {
      const previousQuestionIds = aim04QuizState.selectedQuestions.map((s) => s.question.id);
      const selection = selectQuizQuestions(AIM04_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
      aim04QuizState = { selectedQuestions: selection.selectedQuestions, questionsByAnswer: selection.questionsByAnswer, answers: {}, scored: false, attempts: aim04QuizState.attempts, score: 0, bestScore: aim04QuizState.bestScore, feedback: [], passed: false };
      aim04State.lastQuizQuestionIds = previousQuestionIds;
      aim04Save();
      aim04RenderQuiz('aim04-quiz-title');
    }
  });

  shell.addEventListener('input', (event) => {
    if (event.target.matches('[data-aim04-blank-input]')) {
      const id = event.target.dataset.aim04BlankInput;
      aim04State.blankAnswers[id] = event.target.value;
      aim04Save();
      return;
    }
    if (event.target.matches('[data-aim04-reflection]')) {
      const wasComplete = AIM04_LAB_STEPS.every((step) => aim04State.stepsDone[step.id]) && aim04State.reflection.trim().length >= 40;
      aim04State.reflection = event.target.value;
      aim04CheckLabComplete(wasComplete);
      aim04Save();
    }
  });

  shell.addEventListener('change', (event) => {
    if (event.target.matches('[data-aim04-step]')) {
      const wasComplete = AIM04_LAB_STEPS.every((step) => aim04State.stepsDone[step.id]) && aim04State.reflection.trim().length >= 40;
      const id = event.target.dataset.aim04Step;
      aim04State.stepsDone[id] = event.target.checked;
      aim04CheckLabComplete(wasComplete);
      aim04Save();
      aim04RenderLab();
      return;
    }
    if (event.target.matches('[data-aim04-quiz-answer]')) {
      const questionId = event.target.closest('[data-question-id]')?.dataset.questionId;
      if (questionId) {
        aim04QuizState.answers[questionId] = event.target.value;
        aim04State.lastQuizQuestionIds = aim04QuizState.selectedQuestions.map((s) => s.question.id);
        aim04Save();
        aim04RenderQuiz();
      }
    }
  });

  shell.addEventListener('submit', (event) => {
    if (event.target.id !== 'aim04-quiz-form') return;
    event.preventDefault();
    const result = scoreQuizAttempt(aim04QuizState.selectedQuestions, aim04QuizState.questionsByAnswer, aim04QuizState.answers);
    aim04QuizState.attempts += 1;
    aim04QuizState.score = result.score;
    aim04QuizState.bestScore = Math.max(aim04QuizState.bestScore || 0, result.score);
    aim04QuizState.feedback = result.feedback;
    aim04QuizState.passed = result.score >= 70;
    aim04QuizState.scored = true;
    if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(aim04User, 'aim-04-knowledge-check', { state: aim04QuizState.passed ? 'complete' : 'in_progress', score: result.score });
    }
    aim04Save();
    aim04RenderQuiz('aim04-quiz-feedback');
  });
}

registerModuleLab({
  program: 'ai-ml',
  moduleNumber: 4,
  moduleKey: 'aim-04',
  view: viewAiMlModuleFour,
  wire: wireAiMlModuleFour,
});
