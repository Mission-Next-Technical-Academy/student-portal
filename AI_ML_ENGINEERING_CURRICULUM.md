# Foundations of AI & Machine Learning — Curriculum & Content Draft

Status: **built** (2026-09-10) — transcribed into `portal/data.js` (full `mod()`
entries + `LABS` catalogue, replacing the `skeleton('aim', …)` stub) and into
12 interactive `portal/ai-ml-module-01..12.js` files plus a shared
`portal/ai-ml-shared.css`, mirroring the `soc-analyst-module-*.js` pattern —
lessons, a fill-in-the-blank drill, a `selectQuizQuestions()`-driven knowledge
check, and a checklist-plus-written-reflection hands-on lab per module (no
live code-execution sandbox exists for this track, so labs are evidence-based
in the student's own Python environment, same pattern as
`it-support-module-01.js`'s Lab 1.1). Verified live in Chrome against the
linked Supabase project: all 12 `view()`s render, and Module 01's and Module
12's full interaction loops (lab checklist, reflection, quiz scoring,
fill-in-blank checking, capstone stage completion) were exercised end to end
with a synthetic user — no JS exceptions; the only console errors were
expected Supabase rejections of that fake user's ID, caught and logged, never
thrown. `PROGRAMS.find(p => p.slug === 'ai-ml').isPublished` is deliberately
left `false` — flipping the track live is the site owner's call, not made
here. Track skeleton titles are canonical per `MODULE_STANDARD.md` §4 — do
not rename or reorder.

**Still open** (see "Track-Level Notes for the Next Author" below): quiz
banks are only the first variant per objective (5–6 questions/module) and
video lecture segments are not authored — do not archive this doc until
those are addressed.
Aligned to the **CRISP-DM** lifecycle and current **MLOps** practice, matching
the program frame in `MODULE_STANDARD.md` §1 (6 weeks, 12 modules, 2/week,
Module 11 = professional practice, Module 12 = capstone).

Format mirrors the `Module` contract in `MODULE_STANDARD.md` §2: summary,
hours (range), objectives (measurable verbs), topics, hands-on labs, skills,
assessment (knowledge-check quiz bank + fill-in-the-blank + practical lab),
prerequisites, sources. Quiz questions are written as a **bank per objective**
(course_SOC_standardized.md §4 pattern) — multiple scenario variants per
concept, not one fixed set — so retries can reshuffle without repeating the
exact question. No certification endorsement or partnership language is used
anywhere below, per `MODULE_STANDARD.md` §6.

---

## Module 01 — Python Programming Foundations

**Week:** 1 · **Hours:** 6–8 Hours · **Lessons:** 5 · **Labs:** 2 · **Status:** authored
**Key:** `aiml-01` · **Prerequisites:** none

**Summary:** Write, run, and debug Python programs using the core language
constructs and standard-library tools that every later module assumes —
variables, control flow, functions, data structures, file I/O, and virtual
environments.

**Learning Objectives**
- Write Python scripts using conditionals, loops, functions, and exceptions.
- Manipulate lists, dictionaries, tuples, and sets to model structured data.
- Read and write CSV/JSON files using the standard library.
- Configure an isolated Python environment with `venv` and `pip`.
- Debug a failing script using tracebacks and a debugger (`pdb` or an IDE
  debugger).

**Topics**
- Python syntax, types, and operators; mutability vs. immutability
- Control flow: `if`/`elif`/`else`, `for`, `while`, comprehensions
- Functions: parameters, default args, `*args`/`**kwargs`, scope, closures
- Core data structures: `list`, `dict`, `tuple`, `set` and when to use each
- Exceptions: `try`/`except`/`finally`, raising custom exceptions
- File I/O: text files, `csv` module, `json` module
- Modules and packages; `import` mechanics; the standard library tour
- Virtual environments (`venv`), `pip`, `requirements.txt`
- Intro to `numpy` arrays as a preview of vectorized thinking (bridges to
  Module 02)

**Hands-On Labs**
1. **Command-Line Data Utility**
   1. Scaffold a `venv` and a `requirements.txt`.
   2. Write a script that reads a CSV of records, filters rows by a
      condition, and writes the filtered result to a new CSV.
   3. Add exception handling for malformed rows (log and skip, don't crash).
   4. Add a `--summary` flag that prints row counts before/after filtering.
2. **Debugging Drill**
   1. Given a script with three seeded bugs (an off-by-one loop, a mutable
      default argument, and an unhandled `KeyError`), reproduce each failure
      from its traceback.
   2. Fix each bug and add a regression check that would have caught it.

**Skills:** Python, Data Structures, Debugging, Virtual Environments, CLI Tooling

**Knowledge Check (Quiz Bank)**

*Objective: control flow & data structures*
1. A function is called repeatedly with `def add_item(item, bucket=[])`. What
   is the MOST likely defect a code reviewer should flag?
   A) `bucket` is unused
   B) `bucket` is a mutable default argument shared across calls
   C) `item` should be typed
   D) the function name is unclear
   **Answer:** B — mutable defaults are created once at function definition
   and persist across calls, silently accumulating state.
2. Which data structure is the BEST fit for de-duplicating a large list of
   user IDs while checking membership repeatedly?
   A) `list` B) `tuple` C) `set` D) `str`
   **Answer:** C — `set` gives O(1) average membership checks and enforces
   uniqueness.

*Objective: exceptions & I/O*
3. A script processing 100,000 CSV rows should skip malformed rows without
   stopping. What is the FIRST change to make?
   A) Wrap the whole `main()` in a bare `except: pass`
   B) Wrap only the per-row parsing in `try`/`except`, log the row, and
      `continue`
   C) Pre-validate the file by hand before running
   D) Reduce the file to 10 rows to avoid errors
   **Answer:** B — narrow exception handling around the failing unit keeps
   the rest of the run intact and preserves visibility into what failed.

*Objective: environments*
4. Two projects on the same machine need different versions of the same
   package. What is the MOST appropriate fix?
   A) Uninstall and reinstall the package before each run
   B) Use a separate virtual environment per project
   C) Rename one package after install
   D) Install both versions globally with `--force`
   **Answer:** B.
5. `requirements.txt` exists mainly to:
   A) Store secrets B) Pin reproducible dependencies for the project
   C) Replace `venv` D) Document code style
   **Answer:** B.
6. A traceback ends in `KeyError: 'email'`. What does this tell you FIRST?
   A) A network call failed
   B) A dictionary was accessed with a key that isn't present
   C) A file could not be opened
   D) A loop never terminated
   **Answer:** B.

**Fill in the Blank**
1. A `______` comprehension builds a new list in a single expression instead
   of an explicit loop. **Answer:** list
2. The `______` block in a `try` statement runs whether or not an exception
   was raised. **Answer:** finally
3. `pip freeze > ______` captures the exact installed package versions for a
   project. **Answer:** requirements.txt
4. `*args` collects extra positional arguments into a `______`, while
   `**kwargs` collects extra keyword arguments into a `______`.
   **Answer:** tuple; dict

**Assessment:** knowledgeCheck ✔ · practicalLab ✔ · capstoneGate ✘

**Sources & Further Reading**
- [Python 3 official documentation](https://docs.python.org/3/) — the
  language reference and standard library, authoritative for syntax and
  built-ins.

---

## Module 02 — Data Fundamentals, Mathematics & Statistics

**Week:** 1 · **Hours:** 7–9 Hours · **Lessons:** 5 · **Labs:** 2 · **Status:** authored
**Key:** `aiml-02` · **Prerequisites:** `aiml-01`

**Summary:** Build the quantitative reasoning that every ML algorithm sits
on top of — linear algebra for representing data, probability for reasoning
under uncertainty, and descriptive/inferential statistics for deciding
whether a pattern in data is real.

**Learning Objectives**
- Represent data as vectors and matrices and perform core linear-algebra
  operations (dot product, matrix multiplication, transpose).
- Compute and interpret descriptive statistics (mean, median, variance,
  standard deviation, percentiles) for a dataset.
- Apply basic probability rules (conditional probability, Bayes' theorem) to
  a classification scenario.
- Distinguish correlation from causation and identify when a sample
  statistic likely reflects noise rather than signal.
- Use `numpy` to perform vectorized numerical computation instead of
  manual loops.

**Topics**
- Vectors, matrices, dot products, matrix multiplication, transpose, norms
- Descriptive statistics: mean, median, mode, variance, standard deviation,
  quartiles, outliers
- Probability basics: independence, conditional probability, Bayes' theorem
- Distributions: normal, binomial, uniform — what each models
- Correlation vs. causation; Simpson's paradox as a cautionary example
- Sampling, sample size, and why small samples mislead
- Hypothesis testing at a conceptual level (null hypothesis, p-value,
  significance) — enough to read a result, not a full stats course
- `numpy` arrays: shape, broadcasting, vectorized operations vs. Python loops

**Hands-On Labs**
1. **Vectorized Statistics with NumPy**
   1. Load a numeric dataset into a `numpy` array.
   2. Compute mean, median, standard deviation, and IQR-based outlier bounds
      without Python-level loops.
   3. Re-implement the same computation with a manual loop and compare
      runtime on a large array.
2. **Bayes' Theorem on a Real Scenario**
   1. Given a spam-classifier scenario with prior probabilities and observed
      word frequencies, compute the posterior probability a message is spam
      by hand and then in code.
   2. Explain, in writing, why a 99%-accurate test can still produce mostly
      false positives when the underlying condition is rare (base rate
      fallacy).

**Skills:** Linear Algebra, Probability, Statistics, NumPy, Data Reasoning

**Knowledge Check (Quiz Bank)**

*Objective: linear algebra*
1. Multiplying a `(3,4)` matrix by a `(4,2)` matrix produces a matrix of
   shape:
   A) `(3,2)` B) `(4,4)` C) `(2,3)` D) undefined
   **Answer:** A.

*Objective: descriptive statistics*
2. A dataset's mean is far higher than its median. This MOST likely
   indicates:
   A) The data is perfectly normal
   B) A right-skew, likely driven by high-value outliers
   C) The data has no variance
   D) A calculation error
   **Answer:** B.
3. Which measure is LEAST sensitive to extreme outliers?
   A) Mean B) Standard deviation C) Median D) Range
   **Answer:** C.

*Objective: probability & inference*
4. A rare disease affects 1 in 10,000 people. A test is 99% accurate. A
   patient tests positive. What is the BEST next step before concluding
   they are likely sick?
   A) Treat immediately — 99% accuracy is conclusive
   B) Apply Bayes' theorem using the base rate, since most positives in a
      rare-condition population are false positives
   C) Ignore the test — it's unreliable
   D) Retest with the same test only
   **Answer:** B.
5. A study finds ice cream sales and drowning deaths are correlated. The
   BEST interpretation is:
   A) Ice cream causes drowning
   B) Drowning causes ice cream sales
   C) A confounding variable (e.g., summer heat) likely drives both
   D) The correlation is meaningless and should be discarded
   **Answer:** C.
6. A p-value of 0.03 in a hypothesis test is generally interpreted as:
   A) Proof the effect is real
   B) 3% chance the null hypothesis is true
   C) Evidence against the null hypothesis at a common significance
      threshold, not proof
   D) The effect size
   **Answer:** C.

**Fill in the Blank**
1. The `______` is the square root of the variance and expresses spread in
   the same units as the original data. **Answer:** standard deviation
2. `______` theorem updates the probability of a hypothesis given new
   evidence. **Answer:** Bayes'
3. Two variables moving together does not imply one `______` the other.
   **Answer:** causes
4. In `numpy`, applying an operation across an entire array without an
   explicit loop is called `______`. **Answer:** vectorization

**Assessment:** knowledgeCheck ✔ · practicalLab ✔ · capstoneGate ✘

**Sources & Further Reading**
- [NumPy documentation](https://numpy.org/doc/stable/) — array operations,
  broadcasting, and vectorized computation used throughout the track.
- [Khan Academy — Statistics and Probability](https://www.khanacademy.org/math/statistics-probability) —
  free, structured coverage of the distributions and inference concepts
  introduced here.

---

## Module 03 — Data Acquisition, Cleaning & Preparation

**Week:** 2 · **Hours:** 7–9 Hours · **Lessons:** 5 · **Labs:** 2 · **Status:** authored
**Key:** `aiml-03` · **Prerequisites:** `aiml-01`, `aiml-02`

**Summary:** Turn messy, real-world data into a clean, model-ready dataset —
pulling data from files and APIs, handling missing and inconsistent values,
and structuring the work using the CRISP-DM data-preparation phase.

**Learning Objectives**
- Acquire data from local files, a REST API, and a relational database.
- Identify and handle missing values, duplicates, and inconsistent types in
  a dataset using `pandas`.
- Apply the CRISP-DM data-preparation phase to justify each cleaning
  decision in writing.
- Detect and treat outliers using a defensible, documented method.
- Split a dataset into training and test sets without leaking information
  between them.

**Topics**
- CRISP-DM overview and where data preparation sits in the lifecycle
- Acquiring data: flat files, REST APIs (`requests`), SQL queries
- `pandas` fundamentals: `DataFrame`, `Series`, indexing, filtering
- Missing data: detection (`isna`), strategies (drop, impute, flag) and
  when each is appropriate
- Duplicates and inconsistent categorical encodings (e.g., "NY" vs.
  "New York")
- Type coercion and schema validation
- Outlier detection: IQR method, z-score method
- Train/test split; why splitting before cleaning-derived statistics
  (e.g., imputation values) avoids data leakage
- Documenting cleaning decisions for reproducibility

**Hands-On Labs**
1. **Multi-Source Data Pull**
   1. Pull a dataset from a public REST API into a `pandas.DataFrame`.
   2. Merge it with a local CSV on a shared key.
   3. Validate the merge (row counts before/after, check for unexpected
      nulls introduced by the join).
2. **Clean-and-Document Pipeline**
   1. Given a deliberately messy dataset (missing values, duplicate rows,
      inconsistent category labels, a few extreme outliers), write a
      `pandas` cleaning script.
   2. For every transformation, write a one-line comment justifying the
      choice (why impute vs. drop, why this outlier bound).
   3. Split the cleaned data into train/test sets and confirm no row
      appears in both.

**Skills:** pandas, Data Cleaning, REST APIs, CRISP-DM, Data Validation

**Knowledge Check (Quiz Bank)**

*Objective: CRISP-DM*
1. In CRISP-DM, which phase comes immediately BEFORE modeling?
   A) Business understanding B) Data preparation
   C) Deployment D) Evaluation
   **Answer:** B.

*Objective: missing data*
2. A column is missing 60% of its values and has no reliable way to impute
   them. The BEST first action is to:
   A) Impute with the mean regardless
   B) Consider dropping the column and document why
   C) Drop every row with any missing value
   D) Replace missing values with 0 silently
   **Answer:** B.
3. Imputing a numeric column's missing values with the column mean computed
   BEFORE the train/test split MOST likely causes:
   A) Faster training B) Data leakage into the test set
   C) Better generalization D) No effect
   **Answer:** B.

*Objective: outliers*
4. A single data-entry error records someone's age as 999. The MOST
   appropriate response is:
   A) Leave it — outliers always matter
   B) Investigate the source; if it's an entry error, correct or remove it,
      not silently keep it as a "real" extreme value
   C) Delete the entire dataset
   D) Cap all ages at the dataset's current maximum before investigating
   **Answer:** B.

*Objective: data acquisition*
5. When merging two datasets on a `customer_id` key, row count unexpectedly
   grows after the join. This MOST likely indicates:
   A) A successful merge B) Duplicate keys in at least one source
   C) A missing index D) The API rate-limited the request
   **Answer:** B.
6. A REST API returns paginated results. The BEST practice for a complete
   pull is:
   A) Only fetch page 1 B) Loop through pages until no more data is
      returned, respecting rate limits
   C) Request all pages simultaneously with no limit
   D) Estimate the total and fetch a fixed number of pages
   **Answer:** B.

**Fill in the Blank**
1. CRISP-DM stands for Cross-Industry Standard Process for `______`.
   **Answer:** Data Mining
2. Computing an imputation value from the full dataset before splitting
   train and test sets causes data `______`. **Answer:** leakage
3. The `______` method flags outliers as points beyond 1.5× the
   interquartile range from the quartiles. **Answer:** IQR
4. In `pandas`, `______()` returns a boolean mask of missing values in a
   `DataFrame`. **Answer:** isna

**Assessment:** knowledgeCheck ✔ · practicalLab ✔ · capstoneGate ✘

**Sources & Further Reading**
- [pandas documentation](https://pandas.pydata.org/docs/) — `DataFrame`
  operations, missing-data handling, merging/joining.
- [CRISP-DM methodology overview — Data Science PM](https://www.datascience-pm.com/crisp-dm-2/) —
  the six-phase lifecycle this module and Module 07/10 build on.

---

## Module 04 — Exploratory Data Analysis & Visualization

**Week:** 2 · **Hours:** 6–8 Hours · **Lessons:** 4 · **Labs:** 2 · **Status:** authored
**Key:** `aiml-04` · **Prerequisites:** `aiml-03`

**Summary:** Use exploratory data analysis (EDA) and visualization to
understand a dataset's structure, relationships, and quality problems
before any model is built — and to communicate those findings clearly.

**Learning Objectives**
- Profile a dataset's shape, types, and distributions before modeling.
- Choose the correct chart type for a given variable relationship
  (distribution, comparison, correlation, composition, trend over time).
- Detect multicollinearity and skew visually and numerically.
- Build a correlation matrix and interpret it without over-claiming
  causation.
- Produce an EDA summary a non-technical stakeholder can act on.

**Topics**
- The purpose of EDA in CRISP-DM's data understanding phase
- Univariate analysis: histograms, box plots, summary statistics
- Bivariate/multivariate analysis: scatter plots, pair plots, correlation
  heatmaps
- Categorical analysis: bar charts, cross-tabulations
- Time-series visualization basics: trend, seasonality
- Choosing the right chart for the question being asked
- Multicollinearity: what it is, why it matters for later modeling
- Visualization libraries: `matplotlib` fundamentals, `seaborn` for
  statistical plots
- Communicating findings: a short written EDA summary for stakeholders

**Hands-On Labs**
1. **Full Dataset Profile**
   1. Given a cleaned dataset from Module 03, produce histograms for all
      numeric columns and bar charts for all categorical columns.
   2. Build a correlation heatmap and identify the three strongest
      relationships.
   3. Flag any variable pair with correlation above 0.85 as a
      multicollinearity risk for later modeling.
2. **Stakeholder EDA Brief**
   1. Write a one-page, non-technical summary of the dataset's key
      patterns, data-quality caveats, and one recommendation for modeling,
      backed by at most three charts.

**Skills:** EDA, matplotlib, seaborn, Data Visualization, Stakeholder Communication

**Knowledge Check (Quiz Bank)**

*Objective: chart selection*
1. To show the distribution of a single numeric variable and spot outliers
   at the same time, the BEST chart is:
   A) Pie chart B) Box plot C) Line chart D) Bar chart
   **Answer:** B.
2. To compare a numeric outcome across five product categories, the BEST
   chart is:
   A) Scatter plot B) Grouped bar chart or box plot per category
   C) Pie chart D) Single histogram of all categories combined
   **Answer:** B.

*Objective: relationships*
3. A correlation heatmap shows two features at 0.93 correlation. The MOST
   appropriate next step before modeling is:
   A) Ignore it B) Consider dropping or combining one of the two
      features to reduce multicollinearity
   C) Automatically conclude one causes the other
   D) Delete both features immediately without review
   **Answer:** B.
4. A scatter plot shows no visible linear pattern between two variables.
   This means:
   A) There is definitely no relationship of any kind
   B) There is no strong linear relationship, but a non-linear one is still
      possible
   C) The data must be wrong
   D) A correlation coefficient is unnecessary now
   **Answer:** B.

*Objective: communication*
5. An EDA summary for a non-technical stakeholder should PRIORITIZE:
   A) Every statistical test run during exploration
   B) Key patterns, data-quality caveats, and a clear recommendation
   C) Raw output from every chart generated
   D) Code used to generate the charts
   **Answer:** B.
6. A histogram of income is heavily right-skewed. Before feeding this into
   a linear model later, the analyst should:
   A) Ignore the skew B) Note it now and flag it for possible
      transformation (e.g., log transform) in feature engineering
   C) Delete high-income rows D) Convert income to a categorical variable
      immediately with no analysis
   **Answer:** B.

**Fill in the Blank**
1. A `______` plot displays the distribution of a numeric variable using
   quartiles and highlights outliers. **Answer:** box
2. When two features are highly correlated with each other, this is called
   `______`. **Answer:** multicollinearity
3. EDA in CRISP-DM primarily supports the `______ ______` phase.
   **Answer:** data understanding
4. A `______` map visualizes the pairwise correlation between numeric
   variables using color intensity. **Answer:** heat(map)

**Assessment:** knowledgeCheck ✔ · practicalLab ✔ · capstoneGate ✘

**Sources & Further Reading**
- [pandas documentation](https://pandas.pydata.org/docs/) — `.describe()`,
  `.corr()`, and grouping used throughout EDA.
- [NumPy documentation](https://numpy.org/doc/stable/) — numeric backing
  for the summary statistics behind every chart in this module.

---

## Module 05 — Supervised Learning: Regression & Classification

**Week:** 3 · **Hours:** 9–11 Hours · **Lessons:** 6 · **Labs:** 3 · **Status:** authored
**Key:** `aiml-05` · **Prerequisites:** `aiml-04`

**Summary:** Build, train, and interpret the core supervised-learning
algorithms — linear and logistic regression, decision trees, and ensemble
methods — and apply them to real regression and classification problems.

**Learning Objectives**
- Train a linear regression model and interpret its coefficients.
- Train a logistic regression model and interpret it as a probability
  estimator, not a hard rule.
- Build and prune a decision tree, explaining the bias/variance tradeoff at
  each depth.
- Train an ensemble model (random forest or gradient boosting) and compare
  it against a single-tree baseline.
- Select an appropriate algorithm for a given problem type and dataset
  size.

**Topics**
- Supervised learning framing: features, target, training vs. inference
- Linear regression: assumptions, coefficients, residuals, R²
- Logistic regression: log-odds, sigmoid, decision threshold
- Decision trees: splits, impurity (Gini, entropy), overfitting via depth
- Ensembles: bagging (random forest) vs. boosting (gradient boosting) at a
  conceptual level
- Bias/variance tradeoff
- Regularization (L1/L2) as a way to control overfitting
- `scikit-learn`'s estimator API: `.fit()`, `.predict()`, `.score()`
- Baseline models — why every project needs one before claiming "the model
  works"

**Hands-On Labs**
1. **Regression: Predicting a Continuous Target**
   1. Train a linear regression model on a numeric dataset from Module 04.
   2. Interpret at least three coefficients in plain language.
   3. Compare against a "predict the mean" baseline and report the
      improvement.
2. **Classification: Binary Outcome**
   1. Train a logistic regression and a decision tree on the same
      classification dataset.
   2. Compare predictions at the default 0.5 threshold and explain a case
      where a different threshold would be more appropriate (e.g., a
      cost-sensitive scenario).
3. **Ensembles vs. a Single Tree**
   1. Train a random forest on the same data as Lab 2.
   2. Compare accuracy, and explain in writing why the ensemble is more
      stable across different train/test splits.

**Skills:** scikit-learn, Regression, Classification, Decision Trees, Ensemble Methods

**Knowledge Check (Quiz Bank)**

*Objective: regression*
1. In a linear regression, a coefficient of 2.5 on `years_experience`
   means, holding other features constant:
   A) Experience explains 2.5% of the outcome
   B) Each additional year of experience is associated with a 2.5-unit
      increase in the predicted target
   C) The model is 2.5% accurate
   D) Experience is the most important feature
   **Answer:** B.

*Objective: classification*
2. Logistic regression outputs are BEST described as:
   A) Guaranteed correct class labels
   B) Estimated probabilities that are thresholded into a class
   C) Raw counts D) Cluster assignments
   **Answer:** B.
3. A fraud-detection model has a default 0.5 classification threshold, but
   missing a fraud case is far costlier than a false alarm. The BEST
   adjustment is to:
   A) Leave the threshold at 0.5 regardless of cost
   B) Lower the threshold so more cases are flagged as fraud, accepting
      more false positives to catch more true positives
   C) Raise the threshold to reduce all flags
   D) Switch to an unrelated unsupervised method
   **Answer:** B.

*Objective: trees & ensembles*
4. A decision tree trained to unlimited depth on the training set shows
   near-perfect training accuracy but poor test accuracy. This is a
   textbook case of:
   A) Underfitting B) Overfitting C) Data leakage D) Class imbalance
   **Answer:** B.
5. A random forest generally outperforms a single decision tree on unseen
   data MAINLY because it:
   A) Uses a larger dataset automatically
   B) Averages many decorrelated trees, reducing variance
   C) Removes the need for a test set
   D) Always trains faster
   **Answer:** B.
6. L2 regularization in linear/logistic regression primarily works by:
   A) Removing features entirely
   B) Penalizing large coefficient values to reduce overfitting
   C) Increasing model depth
   D) Balancing class labels
   **Answer:** B.

**Fill in the Blank**
1. `______` regression predicts a continuous numeric target, while
   `______` regression predicts a class probability. **Answer:** Linear;
   logistic
2. The tradeoff between a model that is too simple and one that is too
   complex is called the `______`/`______` tradeoff. **Answer:** bias;
   variance
3. A model that performs very well on training data but poorly on new data
   is `______`. **Answer:** overfit(ting)
4. In `scikit-learn`, `______()` trains a model on labeled data, and
   `______()` produces predictions on new data. **Answer:** fit; predict

**Assessment:** knowledgeCheck ✔ · practicalLab ✔ · capstoneGate ✘

**Sources & Further Reading**
- [scikit-learn documentation](https://scikit-learn.org/stable/) —
  regression, classification, and ensemble estimator references and
  worked examples used across Modules 05–07.

---

## Module 06 — Unsupervised Learning & Feature Engineering

**Week:** 3 · **Hours:** 8–10 Hours · **Lessons:** 5 · **Labs:** 2 · **Status:** authored
**Key:** `aiml-06` · **Prerequisites:** `aiml-05`

**Summary:** Find structure in unlabeled data with clustering and
dimensionality reduction, and learn to engineer features that make any
downstream model — supervised or unsupervised — more effective.

**Learning Objectives**
- Cluster a dataset using k-means and evaluate the result with an
  appropriate metric (e.g., silhouette score).
- Reduce dimensionality with PCA and explain what the retained components
  represent.
- Engineer new features from raw data (encoding, scaling, interaction
  terms) that improve model performance.
- Choose between one-hot encoding and other categorical-encoding
  strategies based on cardinality.
- Explain when unsupervised techniques are appropriate versus when labeled
  data and supervised learning are the better fit.

**Topics**
- Unsupervised learning framing: no target label, finding structure
- K-means clustering: centroids, choosing k (elbow method, silhouette
  score)
- Hierarchical clustering at a conceptual level
- Dimensionality reduction: PCA — variance explained, component
  interpretation
- Feature engineering: scaling (standardization, min-max), encoding
  (one-hot, ordinal, target encoding), interaction and polynomial features
- Handling high-cardinality categorical features
- Feature selection: filter, wrapper, and embedded methods at a conceptual
  level
- Pipelines: chaining preprocessing and modeling steps reproducibly

**Hands-On Labs**
1. **Customer Segmentation with K-Means**
   1. Standardize a dataset's numeric features.
   2. Run k-means across a range of k values and select k using the elbow
      method and silhouette score.
   3. Profile each resulting cluster in plain language (who is in it, what
      makes it distinct).
2. **Feature Engineering Pipeline**
   1. Build a `scikit-learn` `Pipeline` that scales numeric features,
      one-hot encodes categorical features, and adds one interaction
      feature.
   2. Compare a downstream model's performance with and without the
      engineered features.

**Skills:** Clustering, PCA, Feature Engineering, scikit-learn Pipelines, Dimensionality Reduction

**Knowledge Check (Quiz Bank)**

*Objective: clustering*
1. Choosing k in k-means using the "elbow method" means:
   A) Picking the largest possible k
   B) Picking the k where added clusters stop meaningfully reducing
      within-cluster variance
   C) Always using k=2
   D) Picking k equal to the number of features
   **Answer:** B.
2. A silhouette score close to 0 for a clustering result suggests:
   A) Excellent, well-separated clusters
   B) Clusters that overlap significantly or are poorly separated
   C) The data has no numeric features
   D) The model has overfit
   **Answer:** B.

*Objective: dimensionality reduction*
3. PCA's first principal component is BEST described as:
   A) A single original feature, unchanged
   B) The direction of maximum variance in the data
   C) The mean of all features
   D) A cluster assignment
   **Answer:** B.

*Objective: feature engineering*
4. A categorical feature has 50,000 unique values (e.g., a raw user ID).
   One-hot encoding it directly would MOST likely:
   A) Improve the model with no downside
   B) Explode dimensionality and likely hurt performance and cost
   C) Have no effect on training time
   D) Automatically become a numeric feature
   **Answer:** B.
5. Standardizing numeric features before k-means is important MAINLY
   because:
   A) It's required by Python syntax
   B) Distance-based algorithms are sensitive to feature scale, and
      unscaled features can dominate the distance calculation
   C) It removes the need for a test set
   D) It changes the number of clusters automatically
   **Answer:** B.
6. Using a `scikit-learn` `Pipeline` to chain preprocessing and modeling
   steps is valuable MAINLY because it:
   A) Trains faster in all cases
   B) Prevents preprocessing steps (like scaling) from leaking test-set
      information and keeps the workflow reproducible
   C) Removes the need for a train/test split
   D) Is required syntax for any model
   **Answer:** B.

**Fill in the Blank**
1. `______` clustering groups data into `k` groups based on distance to
   centroids. **Answer:** K-means
2. `______` (PCA) reduces the number of features while preserving as much
   variance as possible. **Answer:** Principal Component Analysis
3. Converting a categorical feature into binary indicator columns is called
   `______` encoding. **Answer:** one-hot
4. A `______` score measures how similar a point is to its own cluster
   versus other clusters. **Answer:** silhouette

**Assessment:** knowledgeCheck ✔ · practicalLab ✔ · capstoneGate ✘

**Sources & Further Reading**
- [scikit-learn documentation](https://scikit-learn.org/stable/) —
  clustering, decomposition (PCA), preprocessing, and `Pipeline` reference.

---

## Module 07 — Model Evaluation, Validation & Tuning

**Week:** 4 · **Hours:** 8–10 Hours · **Lessons:** 5 · **Labs:** 2 · **Status:** authored
**Key:** `aiml-07` · **Prerequisites:** `aiml-05`, `aiml-06`

**Summary:** Move past "accuracy" as the only metric — evaluate models with
the right metric for the problem, validate results rigorously with
cross-validation, and tune hyperparameters without overfitting to the test
set.

**Learning Objectives**
- Select an evaluation metric appropriate to a given problem (e.g.,
  precision/recall for imbalanced classification, RMSE for regression).
- Build and interpret a confusion matrix and an ROC curve.
- Apply k-fold cross-validation to get a stable estimate of model
  performance.
- Tune hyperparameters using grid search or randomized search without
  leaking test data into the tuning process.
- Explain a model's evaluation results to a non-technical stakeholder in
  terms of business impact.

**Topics**
- Why accuracy alone is misleading on imbalanced data
- Confusion matrix: true/false positives/negatives
- Precision, recall, F1 score; the precision/recall tradeoff
- ROC curve and AUC
- Regression metrics: MAE, MSE, RMSE, R²
- k-fold cross-validation; stratified k-fold for classification
- Hyperparameter tuning: grid search vs. randomized search
- The three-way split (train/validation/test) and why the test set is
  touched only once
- Evaluation in CRISP-DM: what "does the model meet business requirements"
  actually means

**Hands-On Labs**
1. **Metric Selection on Imbalanced Data**
   1. Given a classification dataset where the positive class is 5% of
      rows, train a baseline model and report accuracy.
   2. Report precision, recall, F1, and AUC instead, and explain in writing
      why accuracy alone was misleading here.
2. **Cross-Validated Hyperparameter Tuning**
   1. Set up 5-fold cross-validation for a chosen model.
   2. Run a grid search over at least two hyperparameters.
   3. Report the best configuration and its cross-validated score, and
      confirm the held-out test set was touched only once, at the end.

**Skills:** Model Evaluation, Cross-Validation, Hyperparameter Tuning, Precision/Recall, ROC/AUC

**Knowledge Check (Quiz Bank)**

*Objective: metrics*
1. A model predicting a rare disease (1% prevalence) achieves 99% accuracy
   by predicting "no disease" for everyone. This shows:
   A) The model is excellent B) Accuracy alone is misleading on
      imbalanced data — recall for the positive class is what matters here
   C) The model has perfect recall D) The dataset is too small to matter
   **Answer:** B.
2. Recall answers the question:
   A) Of predicted positives, how many were correct?
   B) Of actual positives, how many did the model correctly identify?
   C) How accurate is the model overall?
   D) How many features were used?
   **Answer:** B.
3. A high AUC (close to 1.0) indicates:
   A) The model is always correct
   B) The model ranks positive cases higher than negative cases well
      across thresholds
   C) The dataset has no noise
   D) The model needs no further tuning
   **Answer:** B.

*Objective: validation*
4. K-fold cross-validation is preferred over a single train/test split
   MAINLY because it:
   A) Trains a bigger model
   B) Gives a more stable performance estimate by averaging across
      multiple splits
   C) Removes the need for a test set entirely
   D) Always improves accuracy
   **Answer:** B.
5. Using the test set to choose between five different hyperparameter
   configurations, then reporting that same test set's score as final
   performance, is a textbook example of:
   A) Best practice B) Test-set leakage, which inflates the reported
      performance C) Cross-validation D) Regularization
   **Answer:** B.

*Objective: tuning*
6. Randomized search versus grid search for hyperparameter tuning is
   generally preferred when:
   A) The search space is small enough to try every combination cheaply
   B) The search space is large, and randomized search can find good
      configurations with far fewer trials
   C) There is only one hyperparameter
   D) Cross-validation is unavailable
   **Answer:** B.

**Fill in the Blank**
1. `______` measures, of predicted positives, how many were actually
   positive; `______` measures, of actual positives, how many were caught.
   **Answer:** Precision; recall
2. `______`-fold cross-validation splits the data into k parts, training
   and validating k times to get a stable performance estimate.
   **Answer:** K
3. The `______` set should be touched only once, at the very end, to
   report final performance. **Answer:** test
4. `______` search exhaustively tries every hyperparameter combination in
   a defined grid. **Answer:** Grid

**Assessment:** knowledgeCheck ✔ · practicalLab ✔ · capstoneGate ✘

**Sources & Further Reading**
- [scikit-learn documentation](https://scikit-learn.org/stable/) —
  `model_selection` (cross-validation, `GridSearchCV`) and `metrics`
  modules.
- [CRISP-DM methodology overview — Data Science PM](https://www.datascience-pm.com/crisp-dm-2/) —
  the evaluation phase this module operationalizes.

---

## Module 08 — Neural Networks & Deep Learning Foundations

**Week:** 4 · **Hours:** 9–12 Hours · **Lessons:** 6 · **Labs:** 3 · **Status:** authored
**Key:** `aiml-08` · **Prerequisites:** `aiml-05`, `aiml-07`

**Summary:** The heaviest module in the program (per `MODULE_STANDARD.md`
§1's Week-4 weighting). Build a neural network from its components —
neurons, layers, activation functions, backpropagation — and train one with
a modern deep-learning framework.

**Learning Objectives**
- Explain how a single neuron and a multi-layer network compute a
  prediction (forward pass).
- Explain, at a conceptual and mathematical level, how backpropagation and
  gradient descent update weights.
- Choose an appropriate activation function and loss function for a given
  problem type.
- Train a feedforward neural network in PyTorch (or TensorFlow/Keras) on a
  real dataset.
- Diagnose and address overfitting in a neural network using dropout,
  regularization, or early stopping.

**Topics**
- The perceptron; from a single neuron to a multi-layer network
- Activation functions: sigmoid, tanh, ReLU and its variants — why ReLU
  dominates modern hidden layers
- Forward pass, loss functions (cross-entropy, MSE), backpropagation
- Gradient descent and its variants (SGD, momentum, Adam) at a conceptual
  level
- Learning rate: too high vs. too low, learning-rate schedules
- Overfitting in deep nets: dropout, weight decay, early stopping,
  batch normalization
- Convolutional layers at an introductory level (why they suit images)
- Recurrent/sequence concepts at an introductory level (why order matters
  for text/time series) — sets up Module 09
- Framework tour: PyTorch tensors, `nn.Module`, the training loop; brief
  contrast with TensorFlow/Keras

**Hands-On Labs**
1. **Neural Network From Scratch (NumPy)**
   1. Implement forward propagation for a 2-layer network by hand with
      `numpy` (no framework).
   2. Implement backpropagation and gradient descent for the same network.
   3. Train it on a small synthetic dataset and confirm the loss decreases.
2. **Framework Training Loop**
   1. Rebuild the same architecture in PyTorch using `nn.Module`.
   2. Train it on a real image or tabular dataset, tracking training and
      validation loss per epoch.
3. **Fighting Overfitting**
   1. Train a deliberately over-parameterized network until validation
      loss diverges from training loss.
   2. Apply dropout and/or early stopping and show the corrected
      train/validation curves.

**Skills:** Neural Networks, PyTorch, Backpropagation, Deep Learning, Regularization

**Knowledge Check (Quiz Bank)**

*Objective: architecture & forward pass*
1. In a feedforward network, the forward pass computes:
   A) The gradient of the loss with respect to weights
   B) The predicted output from the input, layer by layer
   C) Only the final accuracy
   D) The learning rate
   **Answer:** B.
2. ReLU is widely used in hidden layers MAINLY because it:
   A) Always outputs values between 0 and 1
   B) Is computationally simple and mitigates the vanishing-gradient
      problem better than sigmoid/tanh in deep networks
   C) Guarantees convergence D) Removes the need for backpropagation
   **Answer:** B.

*Objective: training*
3. Backpropagation is BEST described as:
   A) A method for cleaning training data
   B) An algorithm that computes gradients of the loss with respect to
      each weight, using the chain rule, to update the network
   C) A type of activation function
   D) A regularization technique
   **Answer:** B.
4. A learning rate set far too high during training MOST likely causes:
   A) Slow but stable convergence
   B) Loss that oscillates wildly or diverges instead of decreasing
   C) Guaranteed overfitting only D) No effect on training
   **Answer:** B.

*Objective: overfitting & regularization*
5. Training loss keeps decreasing while validation loss starts increasing
   after epoch 10. The BEST immediate response is:
   A) Keep training for many more epochs regardless
   B) Apply early stopping around where validation loss starts rising, and
      consider dropout or weight decay
   C) Increase the learning rate D) Remove the validation set
   **Answer:** B.
6. Dropout during training works by:
   A) Removing data points from the dataset permanently
   B) Randomly zeroing out a fraction of neurons each forward pass, which
      discourages co-dependence between neurons
   C) Lowering the learning rate automatically
   D) Reducing the number of layers permanently
   **Answer:** B.

**Fill in the Blank**
1. A `______` function introduces non-linearity into a neural network;
   without one, stacked layers would collapse into a single linear
   transformation. **Answer:** activation
2. `______` computes gradients of the loss with respect to each weight by
   applying the chain rule backward through the network. **Answer:**
   Backpropagation
3. `______` is a regularization technique that randomly deactivates a
   fraction of neurons during training. **Answer:** Dropout
4. `______` descent iteratively updates weights in the direction that
   reduces the loss function. **Answer:** Gradient

**Assessment:** knowledgeCheck ✔ · practicalLab ✔ · capstoneGate ✘

**Sources & Further Reading**
- [Deep Learning — Goodfellow, Bengio & Courville](https://www.deeplearningbook.org/) —
  the standard free reference for the math behind this module (MIT Press).
- [Dive into Deep Learning (d2l.ai)](https://d2l.ai/) — interactive,
  code-first companion covering the same material with runnable notebooks.
- [PyTorch documentation](https://docs.pytorch.org/docs/stable/index.html) —
  `nn.Module`, autograd, and the training-loop API used in the labs.

---

## Module 09 — Applied AI: Language, Vision & Generative Models

**Week:** 5 · **Hours:** 8–10 Hours · **Lessons:** 5 · **Labs:** 2 · **Status:** authored
**Key:** `aiml-09` · **Prerequisites:** `aiml-08`

**Summary:** Apply deep learning to real modalities — computer vision with
CNNs, language with transformers, and generative models — using
pretrained models rather than training everything from scratch, the way
this work happens in industry today.

**Learning Objectives**
- Explain how a convolutional neural network processes image data
  differently from a fully-connected network.
- Explain, at a conceptual level, how self-attention lets a transformer
  model relate distant tokens in a sequence.
- Use a pretrained model (vision or language) via transfer learning /
  fine-tuning on a new, smaller dataset.
- Build a basic application using a pretrained language model (e.g.,
  classification or retrieval-augmented generation) via an API or local
  inference.
- Identify the main risks generative models introduce (hallucination, bias
  amplification, prompt injection) and one mitigation for each.

**Topics**
- Convolutional neural networks: filters, pooling, feature maps; why CNNs
  suit images
- Transfer learning: fine-tuning a pretrained vision model on a small
  dataset
- The attention mechanism and the transformer architecture, conceptually
  ("Attention Is All You Need")
- Pretrained language models: tokenization, embeddings, fine-tuning vs.
  prompting
- Generative models at a survey level: autoencoders, GANs, diffusion
  models, and generative language models — what each is used for
- Practical LLM application patterns: prompting, retrieval-augmented
  generation (RAG), function/tool calling
- Risks specific to generative AI: hallucination, bias amplification,
  prompt injection, data leakage through prompts — and how they map onto
  the OWASP LLM Top 10

**Hands-On Labs**
1. **Transfer Learning for Image Classification**
   1. Load a pretrained CNN (e.g., a ResNet-family model) with frozen
      base layers.
   2. Fine-tune only the final layer(s) on a small, new image dataset.
   3. Compare accuracy and training time against training the same
      architecture from scratch.
2. **Applied LLM Mini-Project**
   1. Use a pretrained language model (via a hosted API or a local model
      through Hugging Face) to build a small classification or
      question-answering feature over a provided document set.
   2. Deliberately probe it with an ambiguous or adversarial input and
      document the failure mode observed (e.g., hallucinated fact,
      prompt injection attempt) and one mitigation.

**Skills:** CNNs, Transformers, Transfer Learning, Hugging Face, Generative AI Risk

**Knowledge Check (Quiz Bank)**

*Objective: vision*
1. A convolutional layer, compared to a fully-connected layer on raw
   pixels, is advantageous for images MAINLY because it:
   A) Requires no training data
   B) Exploits local spatial structure and shares weights across the
      image, reducing parameters
   C) Removes the need for labels D) Only works on grayscale images
   **Answer:** B.
2. Transfer learning is most useful when:
   A) You have millions of labeled examples for your exact task
   B) You have a small dataset and can leverage features already learned
      by a model trained on a large, related dataset
   C) You want to avoid using any pretrained weights
   D) The new task has nothing in common with the pretrained task
   **Answer:** B.

*Objective: transformers*
3. Self-attention in a transformer allows the model to:
   A) Process tokens strictly one at a time with no context
   B) Weigh the relevance of every other token in the sequence when
      representing a given token, regardless of distance
   C) Replace the need for any training data D) Only work on images
   **Answer:** B.
4. Fine-tuning a pretrained language model differs from prompting it
   MAINLY in that fine-tuning:
   A) Requires no data at all
   B) Updates the model's weights on task-specific data, while prompting
      leaves weights unchanged and relies on instructions/context
   C) Is always cheaper than prompting
   D) Only applies to image models
   **Answer:** B.

*Objective: generative AI risk*
5. A generative language model confidently states an incorrect fact with
   no indication of uncertainty. This is an example of:
   A) Overfitting B) Hallucination
   C) Data leakage D) Gradient explosion
   **Answer:** B.
6. A user embeds hidden instructions inside a document that an LLM-powered
   application later summarizes, causing the model to ignore its original
   instructions. This is an example of:
   A) Model collapse B) Prompt injection
   C) Vanishing gradients D) Class imbalance
   **Answer:** B.

**Fill in the Blank**
1. A `______` neural network uses filters that slide across an image to
   detect local patterns like edges and textures. **Answer:**
   convolutional
2. `______` learning reuses a model trained on one large task as a
   starting point for a new, related task. **Answer:** Transfer
3. The `______` mechanism lets a transformer weigh how relevant each token
   is to every other token in a sequence. **Answer:** (self-)attention
4. A generative model producing plausible-sounding but false output is
   called `______`. **Answer:** hallucination

**Assessment:** knowledgeCheck ✔ · practicalLab ✔ · capstoneGate ✘

**Sources & Further Reading**
- ["Attention Is All You Need" — Vaswani et al., arXiv:1706.03762](https://arxiv.org/abs/1706.03762) —
  the original transformer paper.
- ["Deep Residual Learning for Image Recognition" (ResNet) — He et al., arXiv:1512.03385](https://arxiv.org/abs/1512.03385) —
  the CNN architecture used as the transfer-learning base in Lab 1.
- [Hugging Face documentation](https://huggingface.co/docs) — pretrained
  model hub, tokenizers, and fine-tuning APIs used in Lab 2.
- [TensorFlow guide](https://www.tensorflow.org/guide) — alternative
  framework reference for transfer learning if not using PyTorch.
- [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/) —
  risk categories referenced in the generative-AI risk topic and lab.

---

## Module 10 — MLOps: Deployment, Pipelines & Monitoring

**Week:** 5 · **Hours:** 8–10 Hours · **Lessons:** 5 · **Labs:** 2 · **Status:** authored
**Key:** `aiml-10` · **Prerequisites:** `aiml-07`, `aiml-08`

**Summary:** Take a trained model out of a notebook and into production —
packaging it, serving predictions through an API, tracking experiments,
building a repeatable pipeline, and monitoring for drift once it's live.

**Learning Objectives**
- Package a trained model and serve it behind a REST API for inference.
- Track experiments (parameters, metrics, artifacts) so any run is
  reproducible.
- Build a repeatable training pipeline instead of a one-off notebook run.
- Explain what model drift and data drift are and how to detect them in
  production.
- Describe a rollback plan for a model that degrades after deployment.

**Topics**
- CRISP-DM's deployment phase in a modern, automated context
- Model packaging: serialization (e.g., pickling, ONNX at a conceptual
  level), versioning
- Serving predictions: a minimal REST API wrapping a trained model
- Experiment tracking: parameters, metrics, and artifacts with a tool like
  MLflow
- Building a pipeline: separating data prep, training, and evaluation into
  reproducible, orderable steps
- Model and data drift: what changes in production, how to detect it
  (statistical tests, monitoring dashboards)
- Monitoring: latency, prediction distribution, error rates, data-quality
  checks on incoming requests
- Rollback and champion/challenger deployment patterns at a conceptual
  level
- CI/CD concepts applied to ML (retraining triggers, automated evaluation
  gates before promotion)

**Hands-On Labs**
1. **Track, Package, and Serve**
   1. Use MLflow (or an equivalent) to log parameters, metrics, and the
      trained model artifact for at least three training runs.
   2. Package the best run's model and wrap it in a minimal REST API
      endpoint that accepts a JSON payload and returns a prediction.
2. **Simulate Drift and Monitor**
   1. Build a small monitoring script that compares the distribution of
      incoming inference requests against the training data distribution.
   2. Deliberately feed the endpoint out-of-distribution inputs and show
      the monitoring script flags the drift.
   3. Write a short rollback plan describing the trigger condition and the
      steps to revert to the previous model version.

**Skills:** MLOps, Model Deployment, MLflow, Model Monitoring, CI/CD for ML

**Knowledge Check (Quiz Bank)**

*Objective: deployment*
1. Serving a trained model's predictions to other applications is MOST
   commonly done by:
   A) Emailing the model file to users
   B) Wrapping the model in an API endpoint that accepts input and returns
      predictions
   C) Re-running the notebook manually for every request
   D) Hard-coding predictions into the frontend
   **Answer:** B.

*Objective: experiment tracking*
2. Experiment tracking (e.g., with MLflow) is valuable MAINLY because it:
   A) Automatically improves model accuracy
   B) Records the parameters, metrics, and artifacts of each run so
      results are reproducible and comparable
   C) Replaces the need for a test set
   D) Is only useful for deep learning models
   **Answer:** B.

*Objective: drift*
3. "Data drift" refers to:
   A) A bug in the training code
   B) A change in the statistical distribution of incoming production
      data compared to the data the model was trained on
   C) A model that trains slower over time
   D) A change in the model's source code
   **Answer:** B.
4. A model's live accuracy quietly degrades over three months with no code
   changes. The MOST likely explanation to investigate FIRST is:
   A) A cosmic ray flipped a bit in the weights
   B) The real-world data distribution has shifted (drift) since training
   C) The API framework changed D) The model file was deleted
   **Answer:** B.

*Objective: operations*
5. A newly deployed model starts returning significantly worse predictions
   than the previous version. The BEST immediate action is:
   A) Wait a week to see if it improves on its own
   B) Roll back to the previous known-good model version while
      investigating
   C) Immediately retrain from scratch with no diagnosis
   D) Disable monitoring so alerts stop
   **Answer:** B.
6. A "champion/challenger" deployment pattern is used to:
   A) Gamify the data science team's performance
   B) Compare a new candidate model against the current production model
      on live or held-out traffic before fully promoting it
   C) Delete underperforming models automatically with no review
   D) Avoid the need for monitoring entirely
   **Answer:** B.

**Fill in the Blank**
1. `______` is the practice of applying DevOps-style automation and
   discipline (versioning, pipelines, monitoring) to machine learning
   systems. **Answer:** MLOps
2. A change in the statistical properties of incoming production data
   versus training data is called `______`. **Answer:** data drift
3. `______` tracking records the parameters, metrics, and artifacts of
   each training run for reproducibility. **Answer:** Experiment
4. In CRISP-DM, `______` is the phase where a validated model is put into
   real use. **Answer:** deployment

**Assessment:** knowledgeCheck ✔ · practicalLab ✔ · capstoneGate ✘

**Sources & Further Reading**
- [MLflow documentation](https://mlflow.org/docs/latest/index.html) —
  experiment tracking, model packaging, and the model registry used in
  Lab 1.
- [CRISP-DM methodology overview — Data Science PM](https://www.datascience-pm.com/crisp-dm-2/) —
  the deployment phase this module operationalizes for production systems.

---

## Module 11 — Responsible AI, Ethics & Communicating Results

**Week:** 6 · **Hours:** 6–8 Hours · **Lessons:** 4 · **Labs:** 1 · **Status:** authored
**Key:** `aiml-11` · **Prerequisites:** `aiml-07`, `aiml-09`, `aiml-10`

**Summary:** Module 11 is professional practice, per `MODULE_STANDARD.md`
§3 — workflow, documentation, and communication. For this track that means
identifying bias and fairness problems in models, applying a risk
framework, and explaining model behavior and limitations to both technical
and non-technical audiences.

**Learning Objectives**
- Identify potential sources of bias in a dataset or model and describe
  their downstream impact on affected groups.
- Apply at least one model-interpretability technique to explain an
  individual prediction.
- Map a project's AI risks to a recognized framework (NIST AI RMF) and
  document mitigations.
- Write a model card / documentation artifact that communicates a model's
  purpose, limitations, and intended use.
- Present model results and limitations to a non-technical audience
  without overstating certainty.

**Topics**
- Where bias enters an ML system: historical data, sampling, labeling,
  proxy variables, feedback loops
- Fairness at a conceptual level: what "fair" can mean across different,
  sometimes conflicting definitions
- Model interpretability: global vs. local explanations; feature
  importance; SHAP/LIME at a conceptual and applied level
- The NIST AI Risk Management Framework: govern, map, measure, manage
- Model documentation: model cards, limitations, intended use, out-of-scope
  use
- Privacy considerations: what training data a model can leak, and why
  that matters for deployment decisions
- Communicating uncertainty and limitations honestly to stakeholders,
  without either overselling or burying the caveats
- Generative-AI-specific responsible-use considerations (building on
  Module 09's risk topic)

**Hands-On Labs**
1. **Explain, Document, and Present**
   1. Take a model trained earlier in the program and apply a local
      interpretability technique (e.g., SHAP) to explain one individual
      prediction.
   2. Audit the training data for at least one plausible source of bias
      (e.g., an underrepresented group, a proxy variable) and document the
      finding.
   3. Write a one-page model card covering purpose, training data summary,
      performance by key subgroup, known limitations, and intended/
      out-of-scope use.
   4. Deliver a 5-minute plain-language summary of the model's results and
      limitations as if presenting to a non-technical stakeholder.

**Skills:** Responsible AI, Model Interpretability, Bias Auditing, Model Documentation, Technical Communication

**Knowledge Check (Quiz Bank)**

*Objective: bias*
1. A hiring model trained on 10 years of historical hiring decisions
   MOST likely risks:
   A) No bias at all, since it's purely data-driven
   B) Reproducing and amplifying any historical bias present in those past
      hiring decisions
   C) Being too slow to run D) Only affecting model training time
   **Answer:** B.
2. A "proxy variable" is a feature that:
   A) Is always explicitly the protected attribute itself
   B) Is correlated with a protected attribute (e.g., zip code with race)
      and can reintroduce its effect even if the protected attribute is
      removed
   C) Has no relationship to any outcome D) Is only relevant in image
      models
   **Answer:** B.

*Objective: interpretability*
3. A local interpretability method (like SHAP for a single prediction)
   explains:
   A) The model's overall architecture only
   B) Why the model made that specific prediction for that specific input
   C) The training dataset's size D) The model's training time
   **Answer:** B.

*Objective: risk framework*
4. The NIST AI Risk Management Framework's four core functions are:
   A) Plan, Build, Test, Ship
   B) Govern, Map, Measure, Manage
   C) Collect, Clean, Model, Deploy
   D) Design, Develop, Debug, Deliver
   **Answer:** B.

*Objective: documentation & communication*
5. A model card is MOST useful for:
   A) Replacing the need for a test set
   B) Communicating a model's purpose, training data, performance, and
      known limitations to future users and reviewers
   C) Increasing model accuracy directly
   D) Hiding a model's limitations from stakeholders
   **Answer:** B.
6. When presenting model results to a non-technical stakeholder, the BEST
   practice is to:
   A) Present only the best-case metric and omit limitations
   B) Clearly state both what the model does well and its known
      limitations, in plain language
   C) Use only technical jargon to demonstrate rigor
   D) Avoid discussing accuracy at all
   **Answer:** B.

**Fill in the Blank**
1. A feature correlated with a protected attribute, which can reintroduce
   bias even after the protected attribute itself is removed, is called a
   `______` variable. **Answer:** proxy
2. `______` interpretability explains a single prediction, while
   `______` interpretability explains overall model behavior.
   **Answer:** Local; global
3. The NIST AI Risk Management Framework's four functions are Govern,
   `______`, Measure, and Manage. **Answer:** Map
4. A `______` `______` documents a model's purpose, training data,
   performance, and limitations for future users. **Answer:** model card

**Assessment:** knowledgeCheck ✔ · practicalLab ✔ · capstoneGate ✘

**Sources & Further Reading**
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) —
  the govern/map/measure/manage structure this module's risk-mapping
  exercise follows.
- [Interpretable Machine Learning — Christoph Molnar](https://christophm.github.io/interpretable-ml-book/) —
  free reference for SHAP, LIME, and other interpretability methods used
  in the lab.
- [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/) —
  carried forward from Module 09 for the generative-AI responsible-use
  topic.

---

## Module 12 — AI & Machine Learning Capstone

**Week:** 6 · **Hours:** 10–12 Hours · **Lessons:** 4 (prep) + 1 integrated scenario · **Labs:** 1 (multi-stage) · **Status:** authored
**Key:** `aiml-12` · **Prerequisites:** all prior modules · **isCapstone:** true

**Summary:** Not a quiz — per `MODULE_STANDARD.md` §3, a single realistic,
multi-stage project that requires most of the program's skills end to end,
producing a portfolio-grade deliverable, mirroring the SOC track's
12-stage capstone pattern at a similar 8–12 stage scope.

**Learning Objectives**
- Scope a machine learning problem from a business question through the
  full CRISP-DM lifecycle.
- Acquire, clean, and explore a real or realistic dataset independently.
- Train, evaluate, and select a model using rigorous validation, not a
  single train/test split.
- Package and demonstrate the model behind a served interface (API or
  simple app).
- Document the project's limitations, risks, and intended use in a model
  card, and present the full project to a mixed technical/non-technical
  audience.

**Capstone Structure (staged, per `MODULE_STANDARD.md` §3)**

*Preparation lectures (short, before the integrated scenario):*
- Scenario orientation and rules of engagement
- Available tools and datasets
- Documentation and model-card expectations
- Presentation format and grading rubric

*Integrated scenario — eight stages:*
1. **Business Understanding** — Given a realistic business prompt (e.g.,
   "reduce customer churn," "flag likely equipment failures"), write a
   one-page problem statement: the decision the model needs to support,
   the target variable, and the success metric.
2. **Data Acquisition & Cleaning** — Acquire the provided (or
   student-sourced, with instructor approval) dataset; clean and document
   every transformation as in Module 03.
3. **Exploratory Data Analysis** — Profile the dataset and produce a short
   EDA brief identifying the strongest signals and data-quality caveats,
   as in Module 04.
4. **Feature Engineering** — Engineer and justify at least three features
   beyond the raw columns, as in Module 06.
5. **Modeling** — Train at least two model types (e.g., a linear/logistic
   baseline and an ensemble or neural network), using cross-validation.
6. **Evaluation & Selection** — Select a final model using metrics
   appropriate to the problem (not just accuracy), and justify the choice
   in writing, as in Module 07.
7. **Deployment & Monitoring Plan** — Package the chosen model behind a
   minimal served endpoint and write a monitoring/drift plan, as in
   Module 10, even if full production monitoring isn't implemented.
8. **Responsible AI Review & Presentation** — Produce a model card
   (purpose, data, performance by subgroup where feasible, limitations,
   intended/out-of-scope use) and deliver a final presentation to a mixed
   audience, as in Module 11.

**Deliverables**
- A public or private repository containing the cleaned data pipeline,
  training code, and served model endpoint.
- A written project report following the eight stages above.
- A one-page model card.
- A recorded or live final presentation (10–15 minutes).

**Skills:** End-to-End ML Project Delivery, CRISP-DM, Model Deployment, Technical Communication, Portfolio Development

**Assessment:** knowledgeCheck ✘ · practicalLab ✔ · capstoneGate ✔ (all eight
stages and all four deliverables required to pass)

**Sources & Further Reading**
- [CRISP-DM methodology overview — Data Science PM](https://www.datascience-pm.com/crisp-dm-2/) —
  the lifecycle the eight capstone stages implement end to end.
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) —
  reference for the Stage 8 responsible-AI review.
- [scikit-learn documentation](https://scikit-learn.org/stable/) and
  [PyTorch documentation](https://docs.pytorch.org/docs/stable/index.html) —
  primary modeling references, consistent with Modules 05–08.

---

## Track-Level Notes for the Next Author

- **Wired into the platform (2026-09-10).** Transcribed into `portal/data.js`
  (full module objects + `LABS` catalogue) and into 12
  `portal/ai-ml-module-*.js` files — see the Status line above for what that
  covers and how it was verified. Not yet committed to git as of this
  session; not yet flipped to `isPublished: true`.
- **Quiz banks are seeded, not exhaustive.** Each module ships 5–6 bank
  questions across its objectives; `course_SOC_standardized.md` §4's
  question-bank model calls for *multiple* scenario variants per objective
  so retries don't repeat the same question. Treat what's here as the first
  variant per objective and add 2–3 more per objective before this goes
  live, matching the SOC track's depth.
- **Video lecture segments** (course_SOC_standardized.md §3, 8–15 minutes
  each) are not included — this document is written material only.
- **Sources were individually verified live** via `WebFetch` against each
  target URL during authoring (2026-09-10), consistent with the
  `Verify citation URLs live` project convention — including catching and
  discarding two dead OWASP URLs before settling on the working
  `genai.owasp.org/llm-top-10/` link. Re-verify before publishing if this
  file is picked up significantly later, since docs sites reorganize.
- **Alignment language only** — this document states alignment to
  CRISP-DM and general MLOps practice; it does not claim certification
  endorsement, exam-prep affiliation, or partnership with any vendor, per
  `MODULE_STANDARD.md` §6.
