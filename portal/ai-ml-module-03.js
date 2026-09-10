/* Module 03 — Data Acquisition, Cleaning & Preparation ('ai-ml').
 * Content authored from AI_ML_ENGINEERING_CURRICULUM.md (2026-09-10).
 * Labs run in the student's own real Python environment (no in-portal code
 * execution sandbox exists) — completion is tracked as a guided step
 * checklist plus short written reflections, evidence-based like
 * it-support-module-01.js's Lab 1.1, not a simulated console.
 * Reference implementation for the ai-ml-module-02..12.js pattern.
 */

const AIM03_LESSONS = [
  {
    id: 'aim03-lesson-01', number: '3.1', icon: 'ri-flow-chart-line',
    title: 'The CRISP-DM Lifecycle', minutes: 50,
    learn: [
      'Where data preparation fits in the six-phase CRISP-DM cycle',
      'Why documenting your cleaning choices is as important as the code itself',
      'How each cleaning decision either reduces bias or introduces it',
    ],
    topics: [
      { heading: 'Six Phases of CRISP-DM', body: 'Business understanding defines what the problem is and what success looks like. Data understanding collects and explores data to see what you actually have. Data preparation (this module\'s focus) transforms raw data into a clean, model-ready dataset. Modeling applies the algorithm and tunes hyperparameters. Evaluation measures whether the model meets the business goal. Deployment puts the model into production and monitors it.' },
      { heading: 'Why Documentation Matters', body: 'A cleaning decision like "remove rows with missing age" sounds simple until someone asks "why not impute?" or "is that representative?" — the answer lives in a one-line comment, not in memory. Reproducibility means the next person (including future-you) can understand and defend every step without rebuilding it from memory.' },
      { heading: 'Bias and Cleaning', body: 'Removing all rows with any missing value may silently remove a subset of your population (for example, if certain demographics skip optional survey fields). Capping outliers at the max value before investigation can erase legitimate edge cases. The best cleaning is transparent about what was lost and why.' },
    ],
    practice: [
      'Sketch the six CRISP-DM phases on paper and label where your work from Module 01 (the CLI utility) fits.',
      'Write a one-line justification for why you would choose to drop a column with 80% missing values instead of imputing it.',
    ],
    comingUp: 'Your data-preparation lab will ask you to justify every cleaning choice in writing — that\'s CRISP-DM in action.',
  },
  {
    id: 'aim03-lesson-02', number: '3.2', icon: 'ri-database-line',
    title: 'Acquiring Data From Multiple Sources', minutes: 55,
    learn: [
      'How to read data from flat files (CSV), REST APIs, and relational databases',
      'Why merging datasets requires care: duplicate keys, unmatched rows, data types',
      'How to validate a merge by comparing row counts and checking for unexpected nulls',
    ],
    topics: [
      { heading: 'Flat Files and APIs', body: 'A CSV is simple: read it with pandas.read_csv(), and each row becomes a record. A REST API is trickier: pagination means you loop through pages until no more data is returned, and you must respect rate limits. Use the requests library to fetch, parse JSON into Python dicts, then convert those into a DataFrame.' },
      { heading: 'Databases and SQL', body: 'A relational database like PostgreSQL holds structured data in tables. pandas.read_sql() with a connection string runs a SQL query and returns a DataFrame. A query like SELECT * FROM users WHERE created_at > \'2024-01-01\' filters at the source, not in Python — always do this when the table is large.' },
      { heading: 'Merging and Validation', body: 'pandas.merge() combines two DataFrames on a shared key. A left merge keeps all rows from the left table; an inner merge keeps only rows where both tables have a key match. Validate: if left has 1000 rows, right has 500 rows, and a merge yields 1500 rows, you likely have duplicate keys in the right table. Check with result.isna().sum() — unexpected nulls after a merge often mean a key mismatch or a type difference (integer vs string).' },
    ],
    practice: [
      'Write a Python script that fetches data from a public REST API (e.g., a weather API), converts it to a DataFrame, and saves it as a CSV.',
      'Load two CSVs and merge them on a common column; print row counts before and after to catch any surprises.',
    ],
    comingUp: 'Your first lab will pull data from an API and merge it with a local file — exactly this pattern.',
  },
  {
    id: 'aim03-lesson-03', number: '3.3', icon: 'ri-table-2',
    title: 'pandas Fundamentals: DataFrames and Filtering', minutes: 50,
    learn: [
      'What a DataFrame is: a table in memory with rows, columns, and a powerful indexing system',
      'How to select rows and columns using .loc[], .iloc[], and boolean masks',
      'Why the axis parameter matters (axis=0 for rows, axis=1 for columns)',
    ],
    topics: [
      { heading: 'DataFrames and Series', body: 'A DataFrame is a 2D table; a Series is a single column. Both are indexed: df.loc[key] accesses rows by label (the index), while df.iloc[0] accesses the first row by position. Boolean indexing — df[df[\'age\'] > 30] — filters rows where a condition is true. Chaining conditions — df[(df[\'age\'] > 30) & (df[\'income\'] > 50000)] — keeps only rows matching all conditions.' },
      { heading: 'Accessing Columns and Rows', body: 'df[\'name\'] or df.name returns a column as a Series. df[[\'name\', \'age\']] returns a subset of columns as a DataFrame. df.iloc[:5] gets the first 5 rows; df.iloc[:, :3] gets the first 3 columns. Remember the order: [rows, columns].' },
      { heading: 'Groupby and Aggregation', body: 'df.groupby(\'category\').sum() groups rows by a column value and applies an aggregation. df.describe() returns min, max, mean, median for all numeric columns in one call — essential for a quick data sanity check.' },
    ],
    practice: [
      'Create a DataFrame from a dict of lists and select rows where one column exceeds a threshold.',
      'Group a DataFrame by one column and compute the mean of another column per group.',
    ],
    comingUp: 'Every cleaning step in your lab will use these indexing and groupby patterns to identify and transform messy rows.',
  },
  {
    id: 'aim03-lesson-04', number: '3.4', icon: 'ri-question-mark-circle-line',
    title: 'Handling Missing Data & Inconsistencies', minutes: 60,
    learn: [
      'How to detect missing values with .isna() and count them per column',
      'When to drop vs. impute vs. flag missing values — and why each choice has tradeoffs',
      'How to spot and unify inconsistent categorical values (e.g., "NY" vs. "New York")',
    ],
    topics: [
      { heading: 'Detecting Missing Values', body: 'df.isna() returns a boolean DataFrame showing NaN (missing) values. df.isna().sum() shows the count per column; df.isna().sum().sum() shows the total. Missing can mean NaN in numeric columns, None in objects, or empty strings — be careful, because empty strings are not NaN and won\'t show up in .isna().' },
      { heading: 'Strategies for Missing Data', body: 'Drop the entire column if >50% is missing and no reliable way to fill it exists. Drop rows with missing values only if they are rare (<5%). Impute (fill) with the column mean/median/mode if the missingness is random or small. Flag with a binary column (\'age_is_missing\') if you want to preserve the information that a row was incomplete, then impute a placeholder. Never silently drop rows or columns in production without documenting why.' },
      { heading: 'Inconsistent Categories', body: 'df[\'state\'].unique() lists all distinct values — if you see [\'NY\', \'New York\', \'ny\'], they are treated as three separate categories even though they are the same state. Use .str.lower() to normalize case; use .replace({\'NY\': \'New York\'}) to consolidate variants before modeling.' },
    ],
    practice: [
      'Create a DataFrame with missing values and compute the percentage missing per column.',
      'Fill missing numeric values with the column median, then verify with .isna().sum().',
      'Unify inconsistent category names using .str.lower() and .replace().',
    ],
    comingUp: 'Your lab will ask you to decide drop vs. impute for a deliberately messy dataset and justify the choice.',
  },
  {
    id: 'aim03-lesson-05', number: '3.5', icon: 'ri-scales-3-line',
    title: 'Outliers, Train/Test Splits & Data Leakage', minutes: 50,
    learn: [
      'How to detect outliers using the IQR method and z-score method',
      'Why data leakage is the silent killer of model validation',
      'How to split data into training and test sets without breaking your assumptions',
    ],
    topics: [
      { heading: 'Outlier Detection', body: 'The IQR (interquartile range) method: lower_bound = Q1 - 1.5×IQR, upper_bound = Q3 + 1.5×IQR; flag rows outside these bounds. The z-score method: compute z = (value - mean) / std_dev; flag rows where |z| > 3. Neither method is wrong — they have different sensitivities. Before removing an outlier, investigate: is it a data-entry error (fix or remove), a rare-but-real event (keep), or a legitimately extreme case (keep and understand why)?' },
      { heading: 'Train/Test Split Timing', body: 'Split your data into training and test sets FIRST, before computing any statistics you\'ll use for cleaning or imputation. If you impute the mean using the entire dataset, then split, you\'ve leaked information from the test set into the train set — the model sees a preview of test-set statistics during training. The test set must be pristine and unseen until the final evaluation.' },
      { heading: 'The Cost of Leakage', body: 'Data leakage is when information from the test set sneaks into training. Examples: imputing missing values with global statistics before the split, using time-series data out of order, removing outliers after seeing the test set. It makes your model look better in evaluation than it actually is in production.' },
    ],
    practice: [
      'Compute Q1, Q3, and IQR for a column, then identify rows outside the IQR bounds.',
      'Split a DataFrame into train and test, then compute the mean of a column in each separately and compare.',
    ],
    comingUp: 'Your lab will include a train/test split validation step: verify that no row appears in both sets.',
  },
];

const AIM03_QUIZ_BANKS = [
  {
    conceptId: 'aim03-crisp-dm', conceptTitle: 'CRISP-DM methodology', questions: [
      { id: 'aim03-q-crisp-1', prompt: 'In CRISP-DM, which phase comes immediately BEFORE modeling?', options: [
        { id: 'a', text: 'Business understanding' },
        { id: 'b', text: 'Data preparation' },
        { id: 'c', text: 'Deployment' },
        { id: 'd', text: 'Evaluation' },
      ], correctId: 'b', feedbackCorrect: 'Correct — data preparation transforms raw data into a clean, model-ready dataset before the modeling phase begins.', feedbackIncorrect: 'Data preparation (Phase 3) is the phase that comes immediately before modeling (Phase 4) in the CRISP-DM lifecycle.' },
    ],
  },
  {
    conceptId: 'aim03-missing-data', conceptTitle: 'Missing data handling', questions: [
      { id: 'aim03-q-miss-1', prompt: 'A column is missing 60% of its values and has no reliable way to impute them. The BEST first action is to:', options: [
        { id: 'a', text: 'Impute with the mean regardless' },
        { id: 'b', text: 'Consider dropping the column and document why' },
        { id: 'c', text: 'Drop every row with any missing value' },
        { id: 'd', text: 'Replace missing values with 0 silently' },
      ], correctId: 'b', feedbackCorrect: 'Correct — a column that is 60% missing offers little signal and risks introducing bias; documenting why you dropped it preserves reproducibility.', feedbackIncorrect: 'When a column is mostly missing with no reliable imputation method, consider dropping it (not silently or without justification) — keep the documentation of why.' },
      { id: 'aim03-q-miss-2', prompt: 'Imputing a numeric column\'s missing values with the column mean computed BEFORE the train/test split MOST likely causes:', options: [
        { id: 'a', text: 'Faster training' },
        { id: 'b', text: 'Data leakage into the test set' },
        { id: 'c', text: 'Better generalization' },
        { id: 'd', text: 'No effect' },
      ], correctId: 'b', feedbackCorrect: 'Correct — computing statistics on the full dataset before the split leaks test-set information into training; split first, then impute separately in each set.', feedbackIncorrect: 'Computing the mean from the entire dataset (including test rows) and using it to impute training rows introduces data leakage — split first, then impute within each set.' },
    ],
  },
  {
    conceptId: 'aim03-outliers', conceptTitle: 'Outlier detection and treatment', questions: [
      { id: 'aim03-q-out-1', prompt: 'A single data-entry error records someone\'s age as 999. The MOST appropriate response is:', options: [
        { id: 'a', text: 'Leave it — outliers always matter' },
        { id: 'b', text: 'Investigate the source; if it\'s an entry error, correct or remove it, not silently keep it as a "real" extreme value' },
        { id: 'c', text: 'Delete the entire dataset' },
        { id: 'd', text: 'Cap all ages at the dataset\'s current maximum before investigating' },
      ], correctId: 'b', feedbackCorrect: 'Correct — investigate the root cause before removing or capping; a known data-entry error should be corrected or removed with documentation.', feedbackIncorrect: 'Always investigate an outlier before treating it; if it is a known error, fix or remove it with a note; if it is real, keep it and document why.' },
    ],
  },
  {
    conceptId: 'aim03-data-acquisition', conceptTitle: 'Data acquisition and merging', questions: [
      { id: 'aim03-q-acq-1', prompt: 'When merging two datasets on a customer_id key, row count unexpectedly grows after the join. This MOST likely indicates:', options: [
        { id: 'a', text: 'A successful merge' },
        { id: 'b', text: 'Duplicate keys in at least one source' },
        { id: 'c', text: 'A missing index' },
        { id: 'd', text: 'The API rate-limited the request' },
      ], correctId: 'b', feedbackCorrect: 'Correct — if the row count grows beyond the expected size, at least one dataset has duplicate keys; each row in the left table matched multiple rows in the right.', feedbackIncorrect: 'When row count grows after a merge, it means duplicate keys in at least one source — each left row matched multiple right rows, creating the cartesian product.' },
      { id: 'aim03-q-acq-2', prompt: 'A REST API returns paginated results. The BEST practice for a complete pull is:', options: [
        { id: 'a', text: 'Only fetch page 1' },
        { id: 'b', text: 'Loop through pages until no more data is returned, respecting rate limits' },
        { id: 'c', text: 'Request all pages simultaneously with no limit' },
        { id: 'd', text: 'Estimate the total and fetch a fixed number of pages' },
      ], correctId: 'b', feedbackCorrect: 'Correct — pagination requires looping until exhausted; respecting rate limits prevents getting blocked or getting incomplete data.', feedbackIncorrect: 'Loop through pages until the API returns no new data, and always respect rate limits to avoid blocking and to behave as a good citizen of shared infrastructure.' },
    ],
  },
];

const AIM03_BLANKS = [
  { id: 'aim03-b1', prompt: 'CRISP-DM stands for Cross-Industry Standard Process for ______.', accept: ['Data Mining'] },
  { id: 'aim03-b2', prompt: 'Computing an imputation value from the full dataset before splitting train and test sets causes data ______.', accept: ['leakage'] },
  { id: 'aim03-b3', prompt: 'The ______ method flags outliers as points beyond 1.5× the interquartile range from the quartiles.', accept: ['IQR'] },
  { id: 'aim03-b4', prompt: 'In pandas, ______() returns a boolean mask of missing values in a DataFrame.', accept: ['isna'] },
];

const AIM03_SOURCES = [
  { title: 'pandas documentation', org: 'pandas', url: 'https://pandas.pydata.org/docs/', note: 'DataFrame operations, missing-data handling, merging/joining.' },
  { title: 'CRISP-DM methodology overview', org: 'Data Science PM', url: 'https://www.datascience-pm.com/crisp-dm-2/', note: 'The six-phase lifecycle this module and later modules build on.' },
];

const AIM03_LAB_ID = 'aim03-data-pipeline-v1';
const AIM03_LAB_KEY = 'lab-aim-03-data-pipeline';

const AIM03_LAB_STEPS = [
  { id: 'api-pull', label: 'Pulled a dataset from a public REST API into a pandas DataFrame.' },
  { id: 'merge', label: 'Merged the API data with a local CSV on a shared key and validated the merge (checked row counts and for unexpected nulls).' },
  { id: 'detect-issues', label: 'Identified missing values, duplicate rows, and inconsistent categorical encodings in the dataset.' },
  { id: 'clean-script', label: 'Wrote a pandas cleaning script with a one-line comment justifying each transformation (drop, impute, unify, outlier treatment).' },
  { id: 'split', label: 'Split the cleaned data into training and test sets and verified that no row appears in both.' },
];

const AIM03_DEFAULT_STATE = {
  stepsDone: {}, reflection: '', reflectionChecked: false,
  reviewMode: false,
  blankAnswers: {}, blankResults: {},
  repoUrl: '', demoUrl: '', repoUrlTouched: false,
};

/* Real-product deliverable, per AI_ML_APPLIED_BUILD_TRACK.md (Model B —
 * student's own GitHub, one small repo per project module). */
function aim03IsValidUrl(value) {
  return /^https?:\/\/.+\..+/.test((value || '').trim());
}

function aim03LabComplete() {
  const allDone = AIM03_LAB_STEPS.every((step) => aim03State.stepsDone[step.id]);
  const reflectionOk = aim03State.reflection.trim().length >= 40;
  const repoOk = aim03IsValidUrl(aim03State.repoUrl);
  return allDone && reflectionOk && repoOk;
}

let aim03State = null;
let aim03User = null;
let aim03QuizState = null;

function aim03Load(user) {
  aim03User = user;
  aim03State = LabRuntime.load(AIM03_LAB_ID, user, AIM03_DEFAULT_STATE);
  if (!aim03State.stepsDone || typeof aim03State.stepsDone !== 'object') aim03State.stepsDone = {};
  if (!aim03State.blankAnswers) aim03State.blankAnswers = {};
  if (!aim03State.blankResults) aim03State.blankResults = {};

  if (!aim03QuizState) {
    const previousQuestionIds = aim03State.lastQuizQuestionIds || [];
    const selection = selectQuizQuestions(AIM03_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    aim03QuizState = {
      selectedQuestions: selection.selectedQuestions,
      questionsByAnswer: selection.questionsByAnswer,
      answers: {}, scored: false, attempts: 0, score: 0, bestScore: 0, feedback: [], passed: false,
    };
  }

  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'ai-ml', 'aim-03');
  return aim03State;
}

function aim03Save() {
  if (aim03User && aim03State) LabRuntime.save(AIM03_LAB_ID, aim03User, aim03State);
}

/* -------------------------------------------------------------- lessons */

function aim03LessonCard(lesson) {
  return `<details class="aim-lesson" data-aim03-lesson="${esc(lesson.id)}" ${aim03State.reviewMode ? 'open' : ''}>
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

function aim03BlankItem(blank) {
  const value = aim03State.blankAnswers[blank.id] || '';
  const result = aim03State.blankResults[blank.id];
  const statusClass = result === true ? 'is-correct' : result === false ? 'is-incorrect' : '';
  return `<li class="aim-blank-item ${statusClass}" data-aim03-blank="${esc(blank.id)}">
    <p class="aim-blank-prompt">${esc(blank.prompt)}</p>
    <div class="aim-blank-row">
      <input type="text" value="${esc(value)}" data-aim03-blank-input="${esc(blank.id)}" aria-label="Your answer" autocomplete="off" />
      <button type="button" class="aim-blank-check" data-aim03-blank-check="${esc(blank.id)}">Check</button>
    </div>
    ${result === true ? '<p class="aim-blank-result">Correct.</p>' : ''}
    ${result === false ? `<p class="aim-blank-result">Not quite — expected: ${esc(blank.accept[0])}</p>` : ''}
  </li>`;
}

function aim03BlankDrill() {
  return `<ul class="aim-blank-list">${AIM03_BLANKS.map(aim03BlankItem).join('')}</ul>`;
}

/* -------------------------------------------------------------- quiz */

function aim03QuizQuestion(selected, index) {
  const question = selected.question;
  const userAnswerId = aim03QuizState?.answers?.[question.id];
  return `<fieldset class="aim-quiz-question" data-question-id="${esc(question.id)}">
    <legend><span>${index + 1}</span> ${esc(selected.conceptTitle)}: ${esc(question.prompt)}</legend>
    <div class="aim-quiz-options">
      ${selected.shuffledOptions.map((option) => `<label>
        <input type="radio" name="q-${esc(question.id)}" value="${esc(option.id)}" ${userAnswerId === option.id ? 'checked' : ''} data-aim03-quiz-answer />
        <span>${esc(option.text)}</span>
      </label>`).join('')}
    </div>
  </fieldset>`;
}

function aim03QuizPanel() {
  if (!aim03QuizState?.selectedQuestions || aim03QuizState.selectedQuestions.length === 0) {
    return `<div class="aim-quiz-empty" id="aim03-quiz-feedback" role="status">Loading quiz…</div>`;
  }
  const selected = aim03QuizState.selectedQuestions;
  const answered = Object.keys(aim03QuizState.answers || {}).length;
  const total = selected.length;

  let feedbackHtml = '';
  if (aim03QuizState.scored) {
    const passed = aim03QuizState.score >= 70;
    feedbackHtml = `<section class="aim-quiz-score ${passed ? 'aim-quiz-pass' : 'aim-quiz-remediate'}" id="aim03-quiz-feedback" tabindex="-1" aria-live="polite">
      <div class="aim-quiz-score-heading">
        <div><p class="aim-kicker">Attempt ${aim03QuizState.attempts} · best ${aim03QuizState.bestScore}/100</p><h3>${aim03QuizState.score}/100 — ${passed ? 'Knowledge check passed' : 'Review and retry'}</h3></div>
        <span>${aim03QuizState.score}</span>
      </div>
      <ul class="aim-quiz-feedback-list">${(aim03QuizState.feedback || []).map((fb) => `<li>
        <i class="ri-${fb.correct ? 'checkbox-circle-fill' : 'information-line'}" aria-hidden="true"></i>
        <div><strong>${fb.correct ? 'Correct' : 'Review'}</strong><p>${esc(fb.message)}</p></div>
      </li>`).join('')}</ul>
      ${!passed ? `<div class="aim-quiz-actions"><button type="button" class="aim-quiz-retry" data-aim03-quiz-retry><i class="ri-refresh-line" aria-hidden="true"></i> Try different questions</button></div>` : ''}
    </section>`;
  } else if (answered === total) {
    feedbackHtml = `<div class="aim-quiz-ready" id="aim03-quiz-feedback" role="status">All questions answered. Submit to check your responses.</div>`;
  } else {
    feedbackHtml = `<div class="aim-quiz-empty" id="aim03-quiz-feedback" role="status">Answer all ${total} questions to submit.</div>`;
  }

  return `<form class="aim-quiz-form" id="aim03-quiz-form" novalidate>
    <div class="aim-panel-heading"><div><p class="aim-kicker">Knowledge check</p><h3>Test your understanding of data preparation</h3></div><span>${answered}/${total} answered</span></div>
    ${selected.map((sel, idx) => aim03QuizQuestion(sel, idx)).join('')}
    <div class="aim-quiz-actions">
      <button class="aim-quiz-submit" type="submit" ${answered < total ? 'disabled' : ''}><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Check my answers</button>
    </div>
    ${feedbackHtml}
  </form>`;
}

/* -------------------------------------------------------------- lab */

function aim03LabStepItem(step) {
  const done = Boolean(aim03State.stepsDone[step.id]);
  return `<li class="aim-lab-step ${done ? 'is-done' : ''}"><input type="checkbox" id="aim03-step-${esc(step.id)}" data-aim03-step="${esc(step.id)}" ${done ? 'checked' : ''} /><label for="aim03-step-${esc(step.id)}"><span>${esc(step.label)}</span></label></li>`;
}

function aim03LabStatus() {
  const complete = aim03LabComplete();
  return `<div class="aim-lab-status ${complete ? 'aim-status-pass' : 'aim-status-pending'}"><i class="${complete ? 'ri-checkbox-circle-fill' : 'ri-time-line'}" aria-hidden="true"></i><span>${complete ? 'Lab complete — every step is checked, your reflection is recorded, and your repository URL is saved.' : 'Check off every step in your own Python environment, record a short reflection, and paste your repository URL.'}</span></div>`;
}

function aim03RepoFields() {
  const repoInvalid = aim03State.repoUrlTouched && aim03State.repoUrl.trim() && !aim03IsValidUrl(aim03State.repoUrl);
  return `<div class="aim-repo-fields">
    <div class="aim-repo-field">
      <label for="aim03-repo-url">Repository URL (required)</label>
      <input type="url" id="aim03-repo-url" data-aim03-repo-url value="${esc(aim03State.repoUrl)}" placeholder="https://github.com/your-username/aiml-03-data-pipeline" ${repoInvalid ? 'class="is-invalid"' : ''} />
      ${repoInvalid ? '<small class="aim-repo-error">That doesn\'t look like a full URL (e.g. https://github.com/you/repo).</small>' : '<small>Push your multi-source pull and clean-and-document pipeline scripts to a public or private repo (your own GitHub account) and paste the URL here.</small>'}
    </div>
    <div class="aim-repo-field">
      <label for="aim03-demo-url">Live demo / recording URL (optional)</label>
      <input type="url" id="aim03-demo-url" data-aim03-demo-url value="${esc(aim03State.demoUrl)}" placeholder="https://..." />
      <small>Optional — a screen recording or notebook export showing the pipeline running end to end.</small>
    </div>
  </div>`;
}

function aim03LabPanel() {
  return `
    <ol class="aim-lab-steps">${AIM03_LAB_STEPS.map(aim03LabStepItem).join('')}</ol>
    <div class="aim-reflection">
      <label for="aim03-reflection">Pick one cleaning decision you made (e.g., impute vs. drop, an outlier bound) and explain why you chose it over the alternative.</label>
      <textarea id="aim03-reflection" data-aim03-reflection rows="4">${esc(aim03State.reflection)}</textarea>
      <small>Write at least a couple of sentences — this is your evidence that the lab was actually completed and you understand the tradeoffs in your choices.</small>
    </div>
    ${aim03RepoFields()}
    ${aim03LabStatus()}
  `;
}

/* -------------------------------------------------------------- shell */

function aim03Sections() {
  const labComplete = aim03LabComplete();
  return [
    { id: 'aim03-lessons', title: 'Data Preparation Essentials', type: 'lecture', isComplete: true, scrollId: 'aim03-lessons' },
    { id: 'aim03-knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: Boolean(aim03QuizState?.passed), scrollId: 'aim03-knowledge-check' },
    { id: 'aim03-lab', title: 'Hands-On Lab', type: 'lab', isComplete: labComplete, scrollId: 'aim03-lab' },
  ];
}

function viewAiMlModuleThree(user, program) {
  aim03Load(user);
  const module = program.modules['aim-03'];

  return `<div class="aim-shell">
    ${moduleTopbar(user, program)}
    ${moduleProgressShell(aim03Sections(), { reviewMode: aim03State.reviewMode })}
    <main class="aim-main">
      <section class="aim-hero" aria-labelledby="aim03-title">
        <div>
          <p class="aim-kicker">Module 03 · ${formatInstructionalMinutes(module.durationMinutes)} · Week 2</p>
          <h1 id="aim03-title">${esc(module.title)}</h1>
          <p class="aim-lede">${esc(module.summary)}</p>
        </div>
        <dl class="aim-progress" aria-label="Saved module progress">
          <div><dt>Lessons</dt><dd>${module.lessons}</dd></div>
          <div><dt>Hands-on labs</dt><dd>${module.labs}</dd></div>
        </dl>
      </section>

      <section class="aim-objective" aria-labelledby="aim03-objective-title"><span><i class="ri-focus-2-line" aria-hidden="true"></i></span><div><p class="aim-kicker">One measurable objective</p><h2 id="aim03-objective-title">Turn messy, real-world data into a clean, model-ready dataset using pandas and the CRISP-DM framework, with every cleaning decision documented and justified.</h2></div></section>

      <details class="aim-section-collapsible" id="aim03-lessons" ${aim03State.reviewMode ? 'open' : 'open'}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>1</span><div><p class="aim-kicker">Learn</p><h2>Five data-preparation lessons</h2></div></div></summary>
        <div class="aim-section-body">
          <p class="aim-instruction">Open each lesson for the full walkthrough, then work its Try It Yourself exercise in your own Python environment.</p>
          <div class="aim-lesson-grid">${AIM03_LESSONS.map(aim03LessonCard).join('')}</div>
        </div>
      </details>

      <details class="aim-section-collapsible" id="aim03-blanks" ${aim03State.reviewMode ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>2</span><div><p class="aim-kicker">Vocabulary drill</p><h2>Fill in the blank</h2></div></div></summary>
        <div class="aim-section-body">${aim03BlankDrill()}</div>
      </details>

      <details class="aim-section-collapsible" id="aim03-knowledge-check" ${aim03State.reviewMode || (aim03QuizState && !aim03QuizState.passed) ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>3</span><div><p class="aim-kicker">Interactive knowledge check</p><h2>Test your understanding</h2></div></div></summary>
        <div class="aim-section-body"><div id="aim03-quiz-dynamic">${aim03QuizPanel()}</div></div>
      </details>

      <details class="aim-section-collapsible" id="aim03-lab" ${aim03State.reviewMode ? 'open' : 'open'}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>4</span><div><p class="aim-kicker">Hands-on · your own environment</p><h2>Multi-Source Data Pull &amp; Cleaning Pipeline</h2></div></div></summary>
        <div class="aim-section-body">
          <p class="aim-instruction">Work the labs in your own Python environment: pull data from a REST API, merge it with a local CSV, identify and clean issues (missing values, duplicates, inconsistent categories, outliers), then split into training and test sets. Check off each step below as you complete it.</p>
          <div id="aim03-lab-dynamic">${aim03LabPanel()}</div>
        </div>
      </details>

      <details class="aim-section-collapsible" id="aim03-sources" ${aim03State.reviewMode ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>5</span><div><p class="aim-kicker">Supporting resources</p><h2>Further reading</h2></div></div></summary>
        <div class="aim-section-body">${moduleSourcesBlock(AIM03_SOURCES)}</div>
      </details>
    </main>
  </div>`;
}

/* -------------------------------------------------------------- render helpers */

function aim03RenderQuiz(focusId) {
  const el = document.getElementById('aim03-quiz-dynamic');
  if (!el) return;
  el.innerHTML = aim03QuizPanel();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function aim03RenderLab() {
  const el = document.getElementById('aim03-lab-dynamic');
  if (!el) return;
  el.innerHTML = aim03LabPanel();
}

function aim03CheckLabComplete(wasComplete) {
  const nowComplete = aim03LabComplete();
  if (nowComplete && !wasComplete) {
    if (typeof recordLabAttempt === 'function') recordLabAttempt(aim03User, AIM03_LAB_KEY, { state: 'complete', score: 100, result: { steps: AIM03_LAB_STEPS.length, repoUrl: aim03State.repoUrl, demoUrl: aim03State.demoUrl || null } });
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(aim03User, 'ai-ml', 'aim-03', AIM03_LAB_KEY);
  }
  return nowComplete;
}

/* -------------------------------------------------------------- wiring */

function wireAiMlModuleThree() {
  const shell = document.querySelector('.aim-shell');
  if (!shell || !aim03State) return;

  shell.addEventListener('click', (event) => {
    if (event.target.closest('[data-mnav-review-toggle]')) {
      aim03State.reviewMode = !aim03State.reviewMode;
      aim03Save();
      render();
      return;
    }
    const blankCheck = event.target.closest('[data-aim03-blank-check]');
    if (blankCheck) {
      const id = blankCheck.dataset.aim03BlankCheck;
      const blank = AIM03_BLANKS.find((b) => b.id === id);
      const input = shell.querySelector(`[data-aim03-blank-input="${id}"]`);
      const given = (input?.value || '').trim().toLowerCase();
      aim03State.blankResults[id] = blank.accept.some((accepted) => accepted.toLowerCase() === given);
      aim03Save();
      const item = shell.querySelector(`[data-aim03-blank="${id}"]`);
      if (item) item.outerHTML = aim03BlankItem(blank);
      return;
    }
    const retry = event.target.closest('[data-aim03-quiz-retry]');
    if (retry) {
      const previousQuestionIds = aim03QuizState.selectedQuestions.map((s) => s.question.id);
      const selection = selectQuizQuestions(AIM03_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
      aim03QuizState = { selectedQuestions: selection.selectedQuestions, questionsByAnswer: selection.questionsByAnswer, answers: {}, scored: false, attempts: aim03QuizState.attempts, score: 0, bestScore: aim03QuizState.bestScore, feedback: [], passed: false };
      aim03State.lastQuizQuestionIds = previousQuestionIds;
      aim03Save();
      aim03RenderQuiz('aim03-quiz-title');
    }
  });

  shell.addEventListener('input', (event) => {
    if (event.target.matches('[data-aim03-blank-input]')) {
      const id = event.target.dataset.aim03BlankInput;
      aim03State.blankAnswers[id] = event.target.value;
      aim03Save();
      return;
    }
    if (event.target.matches('[data-aim03-reflection]')) {
      const wasComplete = aim03LabComplete();
      aim03State.reflection = event.target.value;
      aim03CheckLabComplete(wasComplete);
      aim03Save();
      return;
    }
    if (event.target.matches('[data-aim03-repo-url]')) {
      const wasComplete = aim03LabComplete();
      aim03State.repoUrl = event.target.value;
      aim03CheckLabComplete(wasComplete);
      aim03Save();
      return;
    }
    if (event.target.matches('[data-aim03-demo-url]')) {
      aim03State.demoUrl = event.target.value;
      aim03Save();
    }
  });

  shell.addEventListener('blur', (event) => {
    if (!event.target.matches('[data-aim03-repo-url]')) return;
    aim03State.repoUrlTouched = true;
    aim03Save();
    aim03RenderLab();
  }, true);

  shell.addEventListener('change', (event) => {
    if (event.target.matches('[data-aim03-step]')) {
      const wasComplete = aim03LabComplete();
      const id = event.target.dataset.aim03Step;
      aim03State.stepsDone[id] = event.target.checked;
      aim03CheckLabComplete(wasComplete);
      aim03Save();
      aim03RenderLab();
      return;
    }
    if (event.target.matches('[data-aim03-quiz-answer]')) {
      const questionId = event.target.closest('[data-question-id]')?.dataset.questionId;
      if (questionId) {
        aim03QuizState.answers[questionId] = event.target.value;
        aim03State.lastQuizQuestionIds = aim03QuizState.selectedQuestions.map((s) => s.question.id);
        aim03Save();
        aim03RenderQuiz();
      }
    }
  });

  shell.addEventListener('submit', (event) => {
    if (event.target.id !== 'aim03-quiz-form') return;
    event.preventDefault();
    const result = scoreQuizAttempt(aim03QuizState.selectedQuestions, aim03QuizState.questionsByAnswer, aim03QuizState.answers);
    aim03QuizState.attempts += 1;
    aim03QuizState.score = result.score;
    aim03QuizState.bestScore = Math.max(aim03QuizState.bestScore || 0, result.score);
    aim03QuizState.feedback = result.feedback;
    aim03QuizState.passed = result.score >= 70;
    aim03QuizState.scored = true;
    if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(aim03User, 'aim-03-knowledge-check', { state: aim03QuizState.passed ? 'complete' : 'in_progress', score: result.score });
    }
    aim03Save();
    aim03RenderQuiz('aim03-quiz-feedback');
  });
}

registerModuleLab({
  program: 'ai-ml',
  moduleNumber: 3,
  moduleKey: 'aim-03',
  view: viewAiMlModuleThree,
  wire: wireAiMlModuleThree,
});
