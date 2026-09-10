/* Module 01 — Python Programming Foundations ('ai-ml').
 * Content authored from AI_ML_ENGINEERING_CURRICULUM.md (2026-09-10).
 * Labs run in the student's own real Python environment (no in-portal code
 * execution sandbox exists) — completion is tracked as a guided step
 * checklist plus short written reflections, evidence-based like
 * it-support-module-01.js's Lab 1.1, not a simulated console.
 * Reference implementation for the ai-ml-module-02..12.js pattern.
 */

const AIM01_LESSONS = [
  {
    id: 'aim01-lesson-01', number: '1.1', icon: 'ri-braces-line',
    title: 'Syntax, Types & Control Flow', minutes: 45,
    learn: [
      "Python's core types and the difference between mutable and immutable values",
      'How to branch with if/elif/else and repeat with for and while loops',
      'How to build a new list in one line with a list comprehension',
    ],
    topics: [
      { heading: 'Types and Mutability', body: 'Every value in Python has a type — int, float, str, bool, and more. Some types are immutable (numbers, strings, tuples: any "change" actually creates a new value) and some are mutable (lists, dicts, sets: they can be changed in place). This distinction matters the moment you pass a list into a function and the caller sees your edits, or the moment a supposedly-fixed value like a mutable default argument keeps state you never asked it to keep.' },
      { heading: 'Control Flow', body: 'if/elif/else branches on a condition; for iterates over a known sequence (a list, a range, a file\'s lines); while repeats until a condition goes false. A list comprehension — [x * 2 for x in values if x > 0] — builds a new list from an existing iterable in a single readable expression instead of an explicit append loop.' },
    ],
    practice: [
      'Write a one-line list comprehension that keeps only the even numbers from a list and doubles them.',
      'Rewrite a for-loop that builds a list of squares as a comprehension, and compare readability.',
    ],
    comingUp: 'You\'ll use control flow and comprehensions constantly in the CLI utility lab — filtering CSV rows is exactly this pattern.',
  },
  {
    id: 'aim01-lesson-02', number: '1.2', icon: 'ri-function-line',
    title: 'Functions, Parameters & Scope', minutes: 45,
    learn: [
      'How to define functions with default arguments, *args, and **kwargs',
      'Why a mutable default argument is a classic, silent bug',
      'How function scope and closures work',
    ],
    topics: [
      { heading: 'Parameters', body: 'A function can take positional parameters, keyword parameters with defaults, *args to collect extra positional arguments into a tuple, and **kwargs to collect extra keyword arguments into a dict. Defaults are evaluated once, when the function is defined — not on every call.' },
      { heading: 'The Mutable Default Trap', body: 'def add_item(item, bucket=[]) looks like it gives every call a fresh empty list, but that [] is created exactly once and reused across every call that does not pass its own bucket — items silently accumulate across unrelated calls. The fix is bucket=None, then bucket = bucket if bucket is not None else [] inside the function.' },
      { heading: 'Scope and Closures', body: 'A variable defined inside a function is local to it; a nested function can read (but not, without nonlocal, reassign) a variable from its enclosing function — that captured reference is a closure, and it is how a function can carry configuration with it.' },
    ],
    practice: [
      'Predict the output of calling a function with a mutable default argument three times in a row, then run it to check.',
      'Write a function that returns another function which remembers a multiplier (a closure).',
    ],
    comingUp: 'The debugging drill\'s second bug is exactly the mutable-default trap above — you\'ll fix a live instance of it.',
  },
  {
    id: 'aim01-lesson-03', number: '1.3', icon: 'ri-database-2-line',
    title: 'Core Data Structures', minutes: 40,
    learn: [
      'When to reach for a list, dict, tuple, or set',
      'Why sets give fast membership checks and automatic de-duplication',
      'How to model structured records with dictionaries',
    ],
    topics: [
      { heading: 'Choosing a Structure', body: 'list: an ordered, mutable sequence — use it when order matters and you\'ll add/remove items. dict: key-value pairs — use it to model a record or a lookup table. tuple: an ordered, immutable sequence — use it for a fixed-shape value like a coordinate pair. set: an unordered collection of unique values — use it when you need fast "have I seen this before?" checks or de-duplication, since membership testing is O(1) average versus O(n) for a list.' },
      { heading: 'Records as Dictionaries', body: 'A CSV row naturally becomes a dict — {"name": "...", "email": "..."} — once read with csv.DictReader. Nested structures (a list of dicts) are how you model a whole dataset in memory before it becomes a DataFrame in Module 03.' },
    ],
    practice: [
      'Given a list of 10,000 user IDs with duplicates, write the one-line set() call that de-duplicates it.',
      'Model one CSV row as a dict and access two of its fields.',
    ],
    comingUp: 'The CLI utility lab reads CSV rows as dicts and filters them — this is that pattern for real.',
  },
  {
    id: 'aim01-lesson-04', number: '1.4', icon: 'ri-error-warning-line',
    title: 'Exceptions & File I/O', minutes: 45,
    learn: [
      'How to catch specific exceptions with try/except/finally',
      'When to raise a custom exception instead of returning a sentinel value',
      'How to read and write CSV and JSON files with the standard library',
    ],
    topics: [
      { heading: 'Handling Failure Narrowly', body: 'Wrap only the code that can actually fail — not the whole program — in a narrow try/except, catch the specific exception type you expect (KeyError, ValueError), and decide deliberately whether to log-and-continue, log-and-skip, or re-raise. A bare except: pass swallows every error, including ones you never intended to hide, and makes a 100,000-row batch job impossible to debug when row 40,000 silently vanishes.' },
      { heading: 'finally and Custom Exceptions', body: 'A finally block runs whether or not an exception was raised — the right place for cleanup like closing a file. Raising a custom exception class (class InvalidRowError(Exception): pass) documents intent better than returning None or -1 and hoping every caller checks for it.' },
      { heading: 'CSV and JSON', body: 'The csv module\'s DictReader/DictWriter read and write rows as dictionaries keyed by header; the json module\'s load/dump move between Python objects and JSON text. Both are standard library — no install required.' },
    ],
    practice: [
      'Write a try/except around a dict lookup that might raise KeyError, and log the offending row instead of crashing.',
      'Read a small CSV with csv.DictReader and print the third row\'s value for one column.',
    ],
    comingUp: 'The CLI utility lab\'s malformed-row handling and the debugging drill\'s unhandled KeyError both come from this lesson.',
  },
  {
    id: 'aim01-lesson-05', number: '1.5', icon: 'ri-terminal-box-line',
    title: 'Modules, Virtual Environments & a NumPy Preview', minutes: 40,
    learn: [
      'How import and the standard library are organized',
      'Why every project needs its own virtual environment',
      'What requirements.txt is for, and a first look at numpy arrays',
    ],
    topics: [
      { heading: 'Modules and the Standard Library', body: 'Any .py file is a module; import brings its names into scope. Python ships a large standard library (os, csv, json, argparse among others) — check there before reaching for a third-party package.' },
      { heading: 'Virtual Environments', body: 'python -m venv .venv creates an isolated environment so one project\'s installed package versions never collide with another\'s. pip install inside an active venv installs only into that environment; pip freeze > requirements.txt captures exact versions so the environment is reproducible on another machine.' },
      { heading: 'A First Look at NumPy', body: 'A numpy array behaves like a list but applies operations to every element at once — array * 2 doubles every value with no explicit loop. This "vectorized" way of thinking is the foundation Module 02 builds its statistics on.' },
    ],
    practice: [
      'Create a venv, activate it, install one package, and generate requirements.txt.',
      'Create a numpy array from a Python list and multiply it by 3 without writing a loop.',
    ],
    comingUp: 'The CLI utility lab starts by scaffolding exactly this venv and requirements.txt.',
  },
];

const AIM01_QUIZ_BANKS = [
  {
    conceptId: 'aim01-control-data', conceptTitle: 'Control flow & data structures', questions: [
      { id: 'aim01-q-cd-1', prompt: "A function is called repeatedly with def add_item(item, bucket=[]). What is the MOST likely defect a code reviewer should flag?", options: [
        { id: 'a', text: 'bucket is a mutable default argument shared across calls' },
        { id: 'b', text: 'bucket is unused' },
        { id: 'c', text: 'item should be typed' },
        { id: 'd', text: 'The function name is unclear' },
      ], correctId: 'a', feedbackCorrect: 'Correct — mutable defaults are created once at function definition and persist across calls, silently accumulating state.', feedbackIncorrect: 'Mutable default arguments are created once at definition time and shared across every call that does not supply its own — that is the defect to flag.' },
      { id: 'aim01-q-cd-2', prompt: 'Which data structure is the BEST fit for de-duplicating a large list of user IDs while checking membership repeatedly?', options: [
        { id: 'a', text: 'list' },
        { id: 'b', text: 'tuple' },
        { id: 'c', text: 'set' },
        { id: 'd', text: 'str' },
      ], correctId: 'c', feedbackCorrect: 'Correct — a set gives O(1) average membership checks and enforces uniqueness.', feedbackIncorrect: 'A set gives O(1) average membership checks and automatically enforces uniqueness, unlike a list which needs an O(n) scan per check.' },
      { id: 'aim01-q-cd-3', prompt: 'A list comprehension is BEST described as:', options: [
        { id: 'a', text: 'A way to build a new list from an iterable in a single expression' },
        { id: 'b', text: 'A special kind of dictionary' },
        { id: 'c', text: 'A way to permanently sort a list in place' },
        { id: 'd', text: 'A built-in exception type' },
      ], correctId: 'a', feedbackCorrect: 'Correct — a comprehension builds a new list in one expression instead of an explicit append loop.', feedbackIncorrect: 'A list comprehension builds a new list from an iterable, optionally filtered/transformed, in a single expression.' },
    ],
  },
  {
    conceptId: 'aim01-exceptions-io', conceptTitle: 'Exceptions & I/O', questions: [
      { id: 'aim01-q-eio-1', prompt: 'A script processing 100,000 CSV rows should skip malformed rows without stopping. What is the FIRST change to make?', options: [
        { id: 'a', text: 'Wrap only the per-row parsing in try/except, log the row, and continue' },
        { id: 'b', text: 'Wrap the whole main() in a bare except: pass' },
        { id: 'c', text: 'Pre-validate the file by hand before running' },
        { id: 'd', text: 'Reduce the file to 10 rows to avoid errors' },
      ], correctId: 'a', feedbackCorrect: 'Correct — narrow exception handling around the failing unit keeps the rest of the run intact and preserves visibility into what failed.', feedbackIncorrect: 'Narrow the try/except to the per-row parsing step, log the failure, and continue — a bare except: pass on the whole run hides errors you need to see.' },
      { id: 'aim01-q-eio-2', prompt: 'A traceback ends in KeyError: \'email\'. What does this tell you FIRST?', options: [
        { id: 'a', text: 'A dictionary was accessed with a key that is not present' },
        { id: 'b', text: 'A network call failed' },
        { id: 'c', text: 'A file could not be opened' },
        { id: 'd', text: 'A loop never terminated' },
      ], correctId: 'a', feedbackCorrect: 'Correct — a KeyError means a dict lookup used a key that is not in the dict.', feedbackIncorrect: 'KeyError specifically means a dictionary was accessed with a key that is not present in it.' },
      { id: 'aim01-q-eio-3', prompt: 'Which block in a try statement runs whether or not an exception was raised?', options: [
        { id: 'a', text: 'finally' },
        { id: 'b', text: 'except' },
        { id: 'c', text: 'else' },
        { id: 'd', text: 'raise' },
      ], correctId: 'a', feedbackCorrect: 'Correct — finally always runs, making it the right place for cleanup like closing a file.', feedbackIncorrect: 'finally runs whether or not an exception was raised — that makes it the place for cleanup that must always happen.' },
    ],
  },
  {
    conceptId: 'aim01-environments', conceptTitle: 'Environments', questions: [
      { id: 'aim01-q-env-1', prompt: 'Two projects on the same machine need different versions of the same package. What is the MOST appropriate fix?', options: [
        { id: 'a', text: 'Use a separate virtual environment per project' },
        { id: 'b', text: 'Uninstall and reinstall the package before each run' },
        { id: 'c', text: 'Rename one package after install' },
        { id: 'd', text: 'Install both versions globally with --force' },
      ], correctId: 'a', feedbackCorrect: 'Correct — a venv per project isolates dependency versions cleanly.', feedbackIncorrect: 'A separate virtual environment per project isolates each project\'s installed package versions from every other project.' },
      { id: 'aim01-q-env-2', prompt: 'requirements.txt exists mainly to:', options: [
        { id: 'a', text: 'Pin reproducible dependencies for the project' },
        { id: 'b', text: 'Store secrets' },
        { id: 'c', text: 'Replace venv' },
        { id: 'd', text: 'Document code style' },
      ], correctId: 'a', feedbackCorrect: 'Correct — it pins exact package versions so the environment can be reproduced elsewhere.', feedbackIncorrect: 'requirements.txt pins the exact installed package versions so another machine can reproduce the same environment.' },
      { id: 'aim01-q-env-3', prompt: 'In numpy, applying an operation across an entire array without an explicit loop is called:', options: [
        { id: 'a', text: 'Vectorization' },
        { id: 'b', text: 'Serialization' },
        { id: 'c', text: 'Recursion' },
        { id: 'd', text: 'Normalization' },
      ], correctId: 'a', feedbackCorrect: 'Correct — vectorized operations apply across the whole array at once, without a Python-level loop.', feedbackIncorrect: 'Applying an operation to an entire array at once, with no explicit loop, is called vectorization.' },
    ],
  },
];

const AIM01_BLANKS = [
  { id: 'aim01-b1', prompt: 'A ______ comprehension builds a new list in a single expression instead of an explicit loop.', accept: ['list'] },
  { id: 'aim01-b2', prompt: 'The ______ block in a try statement runs whether or not an exception was raised.', accept: ['finally'] },
  { id: 'aim01-b3', prompt: 'pip freeze > ______ captures the exact installed package versions for a project.', accept: ['requirements.txt', 'requirements'] },
  { id: 'aim01-b4', prompt: '*args collects extra positional arguments into a ______, while **kwargs collects extra keyword arguments into a ______.', accept: ['tuple; dict', 'tuple, dict', 'tuple and dict'] },
];

const AIM01_SOURCES = [
  { title: 'Python 3 official documentation', org: 'Python Software Foundation', url: 'https://docs.python.org/3/', note: 'The language reference and standard library, authoritative for syntax and built-ins.' },
];

const AIM01_LAB_ID = 'aim01-cli-utility-v1';
const AIM01_LAB_KEY = 'lab-aim-01-cli-utility';

const AIM01_LAB_STEPS = [
  { id: 'venv', label: 'Scaffolded a venv and a requirements.txt for the project.' },
  { id: 'script', label: 'Wrote a script that reads a CSV of records, filters rows by a condition, and writes the filtered result to a new CSV.' },
  { id: 'handling', label: "Added exception handling for malformed rows (log and skip, don't crash)." },
  { id: 'summary', label: 'Added a --summary flag that prints row counts before/after filtering.' },
  { id: 'repro', label: 'Reproduced each of the three seeded bugs (off-by-one loop, mutable default argument, unhandled KeyError) from its traceback.' },
  { id: 'fixed', label: 'Fixed each bug and added a regression check that would have caught it.' },
];

const AIM01_DEFAULT_STATE = {
  stepsDone: {}, reflection: '', reflectionChecked: false,
  reviewMode: false,
  blankAnswers: {}, blankResults: {},
  repoUrl: '', demoUrl: '', repoUrlTouched: false,
};

/* Real-product deliverable, per AI_ML_APPLIED_BUILD_TRACK.md (Model B —
 * student's own GitHub, one small repo per project module). Not strict to
 * github.com: any http(s) git host is accepted. */
function aim01IsValidUrl(value) {
  return /^https?:\/\/.+\..+/.test((value || '').trim());
}

function aim01LabComplete() {
  const allDone = AIM01_LAB_STEPS.every((step) => aim01State.stepsDone[step.id]);
  const reflectionOk = aim01State.reflection.trim().length >= 40;
  const repoOk = aim01IsValidUrl(aim01State.repoUrl);
  return allDone && reflectionOk && repoOk;
}

let aim01State = null;
let aim01User = null;
let aim01QuizState = null;

function aim01Load(user) {
  aim01User = user;
  aim01State = LabRuntime.load(AIM01_LAB_ID, user, AIM01_DEFAULT_STATE);
  if (!aim01State.stepsDone || typeof aim01State.stepsDone !== 'object') aim01State.stepsDone = {};
  if (!aim01State.blankAnswers) aim01State.blankAnswers = {};
  if (!aim01State.blankResults) aim01State.blankResults = {};

  if (!aim01QuizState) {
    const previousQuestionIds = aim01State.lastQuizQuestionIds || [];
    const selection = selectQuizQuestions(AIM01_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    aim01QuizState = {
      selectedQuestions: selection.selectedQuestions,
      questionsByAnswer: selection.questionsByAnswer,
      answers: {}, scored: false, attempts: 0, score: 0, bestScore: 0, feedback: [], passed: false,
    };
  }

  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'ai-ml', 'aim-01');
  return aim01State;
}

function aim01Save() {
  if (aim01User && aim01State) LabRuntime.save(AIM01_LAB_ID, aim01User, aim01State);
}

/* -------------------------------------------------------------- lessons */

function aim01LessonCard(lesson) {
  return `<details class="aim-lesson" data-aim01-lesson="${esc(lesson.id)}" ${aim01State.reviewMode ? 'open' : ''}>
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

function aim01BlankItem(blank) {
  const value = aim01State.blankAnswers[blank.id] || '';
  const result = aim01State.blankResults[blank.id];
  const statusClass = result === true ? 'is-correct' : result === false ? 'is-incorrect' : '';
  return `<li class="aim-blank-item ${statusClass}" data-aim01-blank="${esc(blank.id)}">
    <p class="aim-blank-prompt">${esc(blank.prompt)}</p>
    <div class="aim-blank-row">
      <input type="text" value="${esc(value)}" data-aim01-blank-input="${esc(blank.id)}" aria-label="Your answer" autocomplete="off" />
      <button type="button" class="aim-blank-check" data-aim01-blank-check="${esc(blank.id)}">Check</button>
    </div>
    ${result === true ? '<p class="aim-blank-result">Correct.</p>' : ''}
    ${result === false ? `<p class="aim-blank-result">Not quite — expected: ${esc(blank.accept[0])}</p>` : ''}
  </li>`;
}

function aim01BlankDrill() {
  return `<ul class="aim-blank-list">${AIM01_BLANKS.map(aim01BlankItem).join('')}</ul>`;
}

/* -------------------------------------------------------------- quiz */

function aim01QuizQuestion(selected, index) {
  const question = selected.question;
  const userAnswerId = aim01QuizState?.answers?.[question.id];
  return `<fieldset class="aim-quiz-question" data-question-id="${esc(question.id)}">
    <legend><span>${index + 1}</span> ${esc(selected.conceptTitle)}: ${esc(question.prompt)}</legend>
    <div class="aim-quiz-options">
      ${selected.shuffledOptions.map((option) => `<label>
        <input type="radio" name="q-${esc(question.id)}" value="${esc(option.id)}" ${userAnswerId === option.id ? 'checked' : ''} data-aim01-quiz-answer />
        <span>${esc(option.text)}</span>
      </label>`).join('')}
    </div>
  </fieldset>`;
}

function aim01QuizPanel() {
  if (!aim01QuizState?.selectedQuestions || aim01QuizState.selectedQuestions.length === 0) {
    return `<div class="aim-quiz-empty" id="aim01-quiz-feedback" role="status">Loading quiz…</div>`;
  }
  const selected = aim01QuizState.selectedQuestions;
  const answered = Object.keys(aim01QuizState.answers || {}).length;
  const total = selected.length;

  let feedbackHtml = '';
  if (aim01QuizState.scored) {
    const passed = aim01QuizState.score >= 70;
    feedbackHtml = `<section class="aim-quiz-score ${passed ? 'aim-quiz-pass' : 'aim-quiz-remediate'}" id="aim01-quiz-feedback" tabindex="-1" aria-live="polite">
      <div class="aim-quiz-score-heading">
        <div><p class="aim-kicker">Attempt ${aim01QuizState.attempts} · best ${aim01QuizState.bestScore}/100</p><h3>${aim01QuizState.score}/100 — ${passed ? 'Knowledge check passed' : 'Review and retry'}</h3></div>
        <span>${aim01QuizState.score}</span>
      </div>
      <ul class="aim-quiz-feedback-list">${(aim01QuizState.feedback || []).map((fb) => `<li>
        <i class="ri-${fb.correct ? 'checkbox-circle-fill' : 'information-line'}" aria-hidden="true"></i>
        <div><strong>${fb.correct ? 'Correct' : 'Review'}</strong><p>${esc(fb.message)}</p></div>
      </li>`).join('')}</ul>
      ${!passed ? `<div class="aim-quiz-actions"><button type="button" class="aim-quiz-retry" data-aim01-quiz-retry><i class="ri-refresh-line" aria-hidden="true"></i> Try different questions</button></div>` : ''}
    </section>`;
  } else if (answered === total) {
    feedbackHtml = `<div class="aim-quiz-ready" id="aim01-quiz-feedback" role="status">All questions answered. Submit to check your responses.</div>`;
  } else {
    feedbackHtml = `<div class="aim-quiz-empty" id="aim01-quiz-feedback" role="status">Answer all ${total} questions to submit.</div>`;
  }

  return `<form class="aim-quiz-form" id="aim01-quiz-form" novalidate>
    <div class="aim-panel-heading"><div><p class="aim-kicker">Knowledge check</p><h3>Test your understanding of Python foundations</h3></div><span>${answered}/${total} answered</span></div>
    ${selected.map((sel, idx) => aim01QuizQuestion(sel, idx)).join('')}
    <div class="aim-quiz-actions">
      <button class="aim-quiz-submit" type="submit" ${answered < total ? 'disabled' : ''}><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Check my answers</button>
    </div>
    ${feedbackHtml}
  </form>`;
}

/* -------------------------------------------------------------- lab */

function aim01LabStepItem(step) {
  const done = Boolean(aim01State.stepsDone[step.id]);
  return `<li class="aim-lab-step ${done ? 'is-done' : ''}"><input type="checkbox" id="aim01-step-${esc(step.id)}" data-aim01-step="${esc(step.id)}" ${done ? 'checked' : ''} /><label for="aim01-step-${esc(step.id)}"><span>${esc(step.label)}</span></label></li>`;
}

function aim01LabStatus() {
  const complete = aim01LabComplete();
  return `<div class="aim-lab-status ${complete ? 'aim-status-pass' : 'aim-status-pending'}"><i class="${complete ? 'ri-checkbox-circle-fill' : 'ri-time-line'}" aria-hidden="true"></i><span>${complete ? 'Lab complete — every step is checked, your reflection is recorded, and your repository URL is saved.' : 'Check off every step in your own Python environment, record a short reflection, and paste your repository URL.'}</span></div>`;
}

function aim01RepoFields() {
  const repoInvalid = aim01State.repoUrlTouched && aim01State.repoUrl.trim() && !aim01IsValidUrl(aim01State.repoUrl);
  return `<div class="aim-repo-fields">
    <div class="aim-repo-field">
      <label for="aim01-repo-url">Repository URL (required)</label>
      <input type="url" id="aim01-repo-url" data-aim01-repo-url value="${esc(aim01State.repoUrl)}" placeholder="https://github.com/your-username/aiml-01-cli-utility" ${repoInvalid ? 'class="is-invalid"' : ''} />
      ${repoInvalid ? '<small class="aim-repo-error">That doesn\'t look like a full URL (e.g. https://github.com/you/repo).</small>' : '<small>Push your CLI utility and debugging-drill fixes to a public or private repo (your own GitHub account) and paste the URL here.</small>'}
    </div>
    <div class="aim-repo-field">
      <label for="aim01-demo-url">Live demo / recording URL (optional)</label>
      <input type="url" id="aim01-demo-url" data-aim01-demo-url value="${esc(aim01State.demoUrl)}" placeholder="https://..." />
      <small>Optional — a screen recording, asciinema link, or similar showing the CLI running.</small>
    </div>
  </div>`;
}

function aim01LabPanel() {
  return `
    <ol class="aim-lab-steps">${AIM01_LAB_STEPS.map(aim01LabStepItem).join('')}</ol>
    <div class="aim-reflection">
      <label for="aim01-reflection">What was the trickiest bug to reproduce from its traceback, and how did the traceback point you to it?</label>
      <textarea id="aim01-reflection" data-aim01-reflection rows="4">${esc(aim01State.reflection)}</textarea>
      <small>Write at least a couple of sentences — this is your evidence that the lab was actually completed.</small>
    </div>
    ${aim01RepoFields()}
    ${aim01LabStatus()}
  `;
}

/* -------------------------------------------------------------- shell */

function aim01Sections() {
  const labComplete = aim01LabComplete();
  return [
    { id: 'aim01-lessons', title: 'Foundations', type: 'lecture', isComplete: true, scrollId: 'aim01-lessons' },
    { id: 'aim01-knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: Boolean(aim01QuizState?.passed), scrollId: 'aim01-knowledge-check' },
    { id: 'aim01-lab', title: 'Hands-On Lab', type: 'lab', isComplete: labComplete, scrollId: 'aim01-lab' },
  ];
}

function viewAiMlModuleOne(user, program) {
  aim01Load(user);
  const module = program.modules['aim-01'];

  return `<div class="aim-shell">
    ${moduleTopbar(user, program)}
    ${moduleProgressShell(aim01Sections(), { reviewMode: aim01State.reviewMode })}
    <main class="aim-main">
      <section class="aim-hero" aria-labelledby="aim01-title">
        <div>
          <p class="aim-kicker">Module 01 · ${formatInstructionalMinutes(module.durationMinutes)} · Week 1</p>
          <h1 id="aim01-title">${esc(module.title)}</h1>
          <p class="aim-lede">${esc(module.summary)}</p>
        </div>
        <dl class="aim-progress" aria-label="Saved module progress">
          <div><dt>Lessons</dt><dd>${module.lessons}</dd></div>
          <div><dt>Hands-on labs</dt><dd>${module.labs}</dd></div>
        </dl>
      </section>

      <section class="aim-objective" aria-labelledby="aim01-objective-title"><span><i class="ri-focus-2-line" aria-hidden="true"></i></span><div><p class="aim-kicker">One measurable objective</p><h2 id="aim01-objective-title">Write, run, and debug a real Python script using control flow, functions, data structures, exceptions, and file I/O.</h2></div></section>

      <details class="aim-section-collapsible" id="aim01-lessons" ${aim01State.reviewMode ? 'open' : 'open'}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>1</span><div><p class="aim-kicker">Learn</p><h2>Five foundation lessons</h2></div></div></summary>
        <div class="aim-section-body">
          <p class="aim-instruction">Open each lesson for the full walkthrough, then work its Try It Yourself exercise in your own Python environment.</p>
          <div class="aim-lesson-grid">${AIM01_LESSONS.map(aim01LessonCard).join('')}</div>
        </div>
      </details>

      <details class="aim-section-collapsible" id="aim01-blanks" ${aim01State.reviewMode ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>2</span><div><p class="aim-kicker">Vocabulary drill</p><h2>Fill in the blank</h2></div></div></summary>
        <div class="aim-section-body">${aim01BlankDrill()}</div>
      </details>

      <details class="aim-section-collapsible" id="aim01-knowledge-check" ${aim01State.reviewMode || (aim01QuizState && !aim01QuizState.passed) ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>3</span><div><p class="aim-kicker">Interactive knowledge check</p><h2>Test your understanding</h2></div></div></summary>
        <div class="aim-section-body"><div id="aim01-quiz-dynamic">${aim01QuizPanel()}</div></div>
      </details>

      <details class="aim-section-collapsible" id="aim01-lab" ${aim01State.reviewMode ? 'open' : 'open'}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>4</span><div><p class="aim-kicker">Hands-on · your own environment</p><h2>Command-Line Data Utility &amp; Debugging Drill</h2></div></div></summary>
        <div class="aim-section-body">
          <p class="aim-instruction">Work both labs in your own Python environment: build a CSV-filtering CLI tool with exception handling, then reproduce and fix three seeded bugs from their tracebacks. Check off each step below as you complete it.</p>
          <div id="aim01-lab-dynamic">${aim01LabPanel()}</div>
        </div>
      </details>

      <details class="aim-section-collapsible" id="aim01-sources" ${aim01State.reviewMode ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>5</span><div><p class="aim-kicker">Supporting resources</p><h2>Further reading</h2></div></div></summary>
        <div class="aim-section-body">${moduleSourcesBlock(AIM01_SOURCES)}</div>
      </details>
    </main>
  </div>`;
}

/* -------------------------------------------------------------- render helpers */

function aim01RenderQuiz(focusId) {
  const el = document.getElementById('aim01-quiz-dynamic');
  if (!el) return;
  el.innerHTML = aim01QuizPanel();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function aim01RenderLab() {
  const el = document.getElementById('aim01-lab-dynamic');
  if (!el) return;
  el.innerHTML = aim01LabPanel();
}

function aim01CheckLabComplete(wasComplete) {
  const nowComplete = aim01LabComplete();
  if (nowComplete && !wasComplete) {
    if (typeof recordLabAttempt === 'function') recordLabAttempt(aim01User, AIM01_LAB_KEY, { state: 'complete', score: 100, result: { steps: AIM01_LAB_STEPS.length, repoUrl: aim01State.repoUrl, demoUrl: aim01State.demoUrl || null } });
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(aim01User, 'ai-ml', 'aim-01', AIM01_LAB_KEY);
  }
  return nowComplete;
}

/* -------------------------------------------------------------- wiring */

function wireAiMlModuleOne() {
  const shell = document.querySelector('.aim-shell');
  if (!shell || !aim01State) return;

  shell.addEventListener('click', (event) => {
    if (event.target.closest('[data-mnav-review-toggle]')) {
      aim01State.reviewMode = !aim01State.reviewMode;
      aim01Save();
      render();
      return;
    }
    const blankCheck = event.target.closest('[data-aim01-blank-check]');
    if (blankCheck) {
      const id = blankCheck.dataset.aim01BlankCheck;
      const blank = AIM01_BLANKS.find((b) => b.id === id);
      const input = shell.querySelector(`[data-aim01-blank-input="${id}"]`);
      const given = (input?.value || '').trim().toLowerCase();
      aim01State.blankResults[id] = blank.accept.some((accepted) => accepted.toLowerCase() === given);
      aim01Save();
      const item = shell.querySelector(`[data-aim01-blank="${id}"]`);
      if (item) item.outerHTML = aim01BlankItem(blank);
      return;
    }
    const retry = event.target.closest('[data-aim01-quiz-retry]');
    if (retry) {
      const previousQuestionIds = aim01QuizState.selectedQuestions.map((s) => s.question.id);
      const selection = selectQuizQuestions(AIM01_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
      aim01QuizState = { selectedQuestions: selection.selectedQuestions, questionsByAnswer: selection.questionsByAnswer, answers: {}, scored: false, attempts: aim01QuizState.attempts, score: 0, bestScore: aim01QuizState.bestScore, feedback: [], passed: false };
      aim01State.lastQuizQuestionIds = previousQuestionIds;
      aim01Save();
      aim01RenderQuiz('aim01-quiz-title');
    }
  });

  shell.addEventListener('input', (event) => {
    if (event.target.matches('[data-aim01-blank-input]')) {
      const id = event.target.dataset.aim01BlankInput;
      aim01State.blankAnswers[id] = event.target.value;
      aim01Save();
      return;
    }
    if (event.target.matches('[data-aim01-reflection]')) {
      const wasComplete = aim01LabComplete();
      aim01State.reflection = event.target.value;
      aim01CheckLabComplete(wasComplete);
      aim01Save();
      return;
    }
    if (event.target.matches('[data-aim01-repo-url]')) {
      const wasComplete = aim01LabComplete();
      aim01State.repoUrl = event.target.value;
      aim01CheckLabComplete(wasComplete);
      aim01Save();
      return;
    }
    if (event.target.matches('[data-aim01-demo-url]')) {
      aim01State.demoUrl = event.target.value;
      aim01Save();
    }
  });

  // Blur, not input, for the repo-url field's re-render — re-rendering on
  // every keystroke would replace the input element mid-type and drop focus.
  shell.addEventListener('blur', (event) => {
    if (!event.target.matches('[data-aim01-repo-url]')) return;
    aim01State.repoUrlTouched = true;
    aim01Save();
    aim01RenderLab();
  }, true);

  shell.addEventListener('change', (event) => {
    if (event.target.matches('[data-aim01-step]')) {
      const wasComplete = aim01LabComplete();
      const id = event.target.dataset.aim01Step;
      aim01State.stepsDone[id] = event.target.checked;
      aim01CheckLabComplete(wasComplete);
      aim01Save();
      aim01RenderLab();
      return;
    }
    if (event.target.matches('[data-aim01-quiz-answer]')) {
      const questionId = event.target.closest('[data-question-id]')?.dataset.questionId;
      if (questionId) {
        aim01QuizState.answers[questionId] = event.target.value;
        aim01State.lastQuizQuestionIds = aim01QuizState.selectedQuestions.map((s) => s.question.id);
        aim01Save();
        aim01RenderQuiz();
      }
    }
  });

  shell.addEventListener('submit', (event) => {
    if (event.target.id !== 'aim01-quiz-form') return;
    event.preventDefault();
    const result = scoreQuizAttempt(aim01QuizState.selectedQuestions, aim01QuizState.questionsByAnswer, aim01QuizState.answers);
    aim01QuizState.attempts += 1;
    aim01QuizState.score = result.score;
    aim01QuizState.bestScore = Math.max(aim01QuizState.bestScore || 0, result.score);
    aim01QuizState.feedback = result.feedback;
    aim01QuizState.passed = result.score >= 70;
    aim01QuizState.scored = true;
    if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(aim01User, 'aim-01-knowledge-check', { state: aim01QuizState.passed ? 'complete' : 'in_progress', score: result.score });
    }
    aim01Save();
    aim01RenderQuiz('aim01-quiz-feedback');
  });
}

registerModuleLab({
  program: 'ai-ml',
  moduleNumber: 1,
  moduleKey: 'aim-01',
  view: viewAiMlModuleOne,
  wire: wireAiMlModuleOne,
});
