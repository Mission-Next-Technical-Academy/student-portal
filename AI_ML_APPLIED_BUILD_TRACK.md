# Real-Product Build Track for AI & Machine Learning — Planning Doc

Status: **built and verified (2026-09-10).** Owner chose: Decision 1 →
Option 1 (student's own GitHub account); Decision 2 → instructions only, no
Mission-Next-built starter templates for now; Decision 3 → Model B (one
small repo per project module, capstone starts its own fresh repo).
Decision 4 (who verifies the repo) stays open, tied to
`COMPLIANCE_DECISIONS_NEEDED.md` Decision 1 as noted below — not blocking,
not resolved here.

**What shipped:** a required "Repository URL" field (+ optional "Live demo
/ recording URL") added to the hands-on lab panel in the six modules where
a real deliverable makes sense — `portal/ai-ml-module-01.js`, `-03.js`,
`-08.js`, `-09.js`, `-10.js`, and `-12.js` (the capstone, one final repo
URL after all eight stages, per Model B). Lab completion for those six now
requires a syntactically valid `http(s)://` URL in addition to the existing
checklist + written reflection; the URL is stored in the same `result` JSON
`recordLabAttempt()` already sends — no schema change. New shared CSS
(`.aim-repo-fields` etc.) added to `ai-ml-shared.css`, reused by all six
files rather than duplicated.

**Bug found and fixed along the way:** `ai-ml-module-12.js`'s capstone
stage-reflection textareas called a full re-render (`aim12RenderCapstone()`)
on every keystroke (the `input` event handler), which replaces all eight
textareas' DOM nodes and would have dropped keyboard focus after every
single character typed — unusable in real use. Fixed to match every other
module's reflection field: save state on `input`, only re-render on `blur`
or a checkbox/step change. Confirmed via a real keystroke-by-keystroke
simulation in Chrome that focus and the DOM node are no longer lost mid-type.

**Verified, not just written:** `node -c` on all six changed files; live in
Chrome (`bin/dev.sh`, synthetic in-page user) — mounted all six modules,
confirmed the repository-URL field renders in each; drove Module 01's field
through real keystroke-by-keystroke typing (no focus loss, no DOM node
replacement), an invalid-URL value (inline error shown, completion blocked),
and a valid URL only completing once combined with all steps checked and a
long-enough reflection; drove the capstone through all eight
stages + repo URL to full completion. Console showed only the same expected
Supabase rejections of the synthetic test user's fake ID as the earlier
session — no JS exceptions.

Companion to
`AI_ML_ENGINEERING_CURRICULUM.md` (content) and the 12 built
`portal/ai-ml-module-*.js` files (2026-09-10, not yet committed). This
document proposes upgrading the AI/ML track's hands-on labs so each one
produces a real, versioned software artifact — a git repository a student
can point an employer to — instead of only an in-portal checklist and
written reflection.

**Date:** 2026-09-10

---

## Why this is different from the other three tracks

SOC Analyst and (partially) IT Help Desk prove a lab is done by having the
student act inside a *simulator Mission Next built and owns* (`ui/` —
Sentinel/Defender/Entra clones, a help-desk ticket console). There is no
equivalent simulator for AI/ML, and there shouldn't be one: the actual
practice of ML engineering *is* writing code, committing it, and shipping a
runnable thing. A simulated "fake GitHub" would be a worse proxy for the
real skill than just having the student use real GitHub.

The 12 module files built on 2026-09-10 reflect this — labs are
checklist-plus-written-reflection, evidence-based like
`it-support-module-01.js`'s Lab 1.1, run in the student's own real Python
environment. That was the right call for a first pass (it's honest about
what the portal can and can't verify), but it stops short of the product
claim this doc is about: **nothing durable exists afterward.** A student who
finishes Module 08 has a checked box and two paragraphs, not a repo they can
show in an interview.

---

## What "real product" means, module by module

`AI_ML_ENGINEERING_CURRICULUM.md`'s own Module 10 and Module 12 content
*already* describes real deliverables ("wrap the model in a minimal REST API
endpoint," Module 12's stated deliverables include "a public or private
repository containing the cleaned data pipeline, training code, and served
model endpoint") — the curriculum text calls for this; the platform's lab
mechanics just don't ask for or track a repo URL yet.

| Module | Existing lab (built 2026-09-10) | Real-product upgrade |
|---|---|---|
| 01 — Python Foundations | CLI CSV utility, checklist + reflection | `aiml-01-cli-utility` repo: the actual script, `requirements.txt`, `README.md` with usage |
| 03 — Data Acquisition & Cleaning | Pandas cleaning pipeline, checklist + reflection | `aiml-03-data-pipeline` repo: the cleaning script(s) + a `data/` folder convention + documented decisions in the README (the curriculum already asks for inline justification comments — a README is the natural home for the summary) |
| 05/06 — Supervised/Unsupervised | Notebook-style exercises | Could fold into the Module 08 or capstone repo rather than standing alone — see Decision 3 |
| 08 — Neural Networks | NumPy-from-scratch + PyTorch rebuild, checklist + reflection | `aiml-08-neural-network` repo: both implementations, a `training_curves.png` or similar artifact committed as evidence |
| 09 — Applied AI | Transfer learning + LLM mini-project | `aiml-09-applied-ai` repo: the fine-tuning script/notebook and the small LLM app |
| 10 — MLOps | Track/package/serve + drift monitor, checklist + reflection | `aiml-10-mlops` repo: the REST API service, the MLflow run artifacts (or a screenshot/export if MLflow's UI isn't committed), the rollback plan as a `ROLLBACK.md` |
| 12 — Capstone | 8-stage checklist + per-stage reflection | The converged final repo: pipeline, training code, served endpoint, model card, exactly as the curriculum doc's own "Deliverables" list already states |

Modules 02, 04, 07, 11 are conceptual/statistical or documentation-and-communication
modules (linear algebra, EDA, evaluation metrics, responsible AI) — a
standalone repo per module isn't a natural fit; their existing
checklist-plus-reflection labs stay as-is, or their artifact folds into
whichever adjacent project repo is live at that point (an EDA notebook
becomes part of the Module 03/08 repo, for instance).

---

## The "nested repos" question — three models

This is the core open decision this doc exists to surface.

### Model A — One cumulative repo, whole program
A single repo (`<student>-mission-next-aiml`) created in Module 01 and
built up module by module — Module 01 adds `cli_utility/`, Module 03 adds
`data_pipeline/`, Module 08 adds `neural_network/`, Module 10 adds `service/`,
and the capstone is the same repo reaching its final, deployable shape. The
commit history itself becomes evidence of the whole program's work — closest
to how a real engineer's portfolio actually looks.
**Tradeoff:** one broken/abandoned repo early on has no clean "restart"
without losing history; harder to grade a single module in isolation since
everything is interleaved in one tree.

### Model B — One small repo per project module, capstone is new
Each of the modules in the table above gets its own small, disposable repo.
The capstone starts a fresh repo that pulls in whatever pieces it needs
(students may literally copy code forward). Easiest to grade per-module in
isolation; closest to what the current LABS catalogue already assumes (one
`lab-aim-0N-*` key per module).
**Tradeoff:** no single "this is my finished product" artifact until the
very end; some duplicated boilerplate across repos.

### Model C — Mission-Next-maintained starter templates ("nested repos")
Mission Next publishes and maintains a small starter-template repo *per
project* (GitHub's native "template repository" feature, or scaffolded
folders under a new `starter-kits/` directory in this repo that get mirrored
out to their own template repos) — each pre-wired with a `requirements.txt`,
a stub `README.md`, a CI lint/test workflow, and comment markers showing
where the student's code goes. The student clicks "Use this template,"
gets their own copy, and builds inside that structure. This can be combined
with either Model A or Model B — templates seed the repo(s), they don't
replace the A/B choice.
**Tradeoff:** real, ongoing engineering work for Mission Next (someone has
to build and maintain 5-7 starter repos, keep their dependency pins current,
and decide how prescriptive the scaffolding is before it stops being "build
it yourself"). The payoff is a consistent, gradable starting point and a
much lower blank-page barrier for a career-changer audience.

---

## Platform changes this implies (scoped, additive — not a rebuild)

Whatever the model, the concrete platform change is small and additive to
what already exists, not a rewrite of the 12 files built 2026-09-10:

- Add a **"Repository URL"** text input (and optionally a **"Live demo /
  deployed URL"** field) to the existing lab panel in the affected modules
  (01, 03, 08, 09, 10, 12) — same visual slot the checklist + reflection
  textarea already occupy, just one more evidence field, mirroring how
  `it-support-module-01.js`'s Lab 1.1 already takes a screenshot upload as
  evidence alongside a checklist.
- Store the URL in the same `result` JSON payload `recordLabAttempt()`
  already sends to `lab_attempts` (no schema migration needed — `result` is
  already a free-form JSON column per `supabase/migrations/20260828160000_simplify_schema.sql`,
  confirmed in this session's earlier read of `app.js`'s `recordLabAttempt`).
- No change to the self-graded completion logic: a submitted URL is still
  just evidence the student attaches, exactly like the checklist items and
  reflection text today — the platform does not fetch, execute, or grade the
  repo's contents. That stays a human (faculty) task — see Decision 4 below,
  which is the same "who evaluates hands-on work" question
  `COMPLIANCE_DECISIONS_NEEDED.md` Decision 1 already raises for the SOC
  track.

---

## Decisions needed before this is built

### Decision 1: Whose GitHub account hosts the student's repo?

**Option 1 — Student's own GitHub account (recommended).** Real portfolio
value (a hiring manager can see it after the program ends), zero hosting
cost or liability to Mission Next, and it's the actual industry norm. Cost:
every student needs a free GitHub account and the barest git literacy —
already an implicit assumption of "push to GitHub" language already used in
several labs' framing above.
**Option 2 — Mission-Next-hosted (e.g., a private org, one repo per
student, provisioned like the existing `student_credentials` /
`admin-provision` account flow).** More control, easier for faculty to find
everything in one place, but real ongoing hosting/admin burden and the
repos disappear (or need an export step) once the student leaves — much
less useful as a portfolio artifact.

### Decision 2: Does Mission Next build and maintain starter-template repos (Model C), or ship instructions only?

Building real templates is itself a build project — see the effort note
under Model C above. The lower-cost alternative is: keep the *instructions*
(the numbered steps already in each module's `handsOn` content) as the only
scaffolding, and let the student `git init` from nothing. That is more
authentic practice but produces far less consistent submissions to grade
against and a steeper first-lab barrier for a career-changer audience with
little to no git experience (Module 01 currently assumes zero prior
programming background).

### Decision 3: One cumulative repo (Model A) or several small ones (Model B)?

This determines whether the capstone repo *is* the Module 01 repo grown up,
or a new repo assembled from the earlier ones. Affects how the LABS catalogue
and `lab_attempts` records reference the artifact (one recurring repo URL
reused across `lab-aim-01…` through `lab-aim-12-capstone`, vs. a distinct URL
per lab key as already modeled in the schema).

### Decision 4: Who verifies the repo actually works?

The platform cannot execute a student's code. Today's self-graded checklist
pattern already has this gap flagged institution-wide in
`COMPLIANCE_DECISIONS_NEEDED.md` Decision 1 (no `evaluator_id`/`reviewed_by`
column anywhere in the schema, no human-in-the-loop review step for any
track). Adding a repo URL field doesn't change that — it gives a human
reviewer something concrete to open, but doesn't create the reviewer. This
should be resolved together with, not separately from, that existing open
compliance decision.

---

## Suggested next steps once the decisions above are made

1. Pick Model A vs. B vs. C (Decisions 2–3) and the hosting model
   (Decision 1).
2. If Model C is chosen: scope and build the starter-template repos as
   their own sprint(s) — separate effort from the portal JS changes.
3. Portal change: add the Repository URL (+ optional demo URL) field to
   the six affected modules' lab panels and wire it into the existing
   `recordLabAttempt()` `result` payload — small, mechanical, one sprint
   per module or one combined sprint, agent-sized either way.
4. Update `AI_ML_ENGINEERING_CURRICULUM.md`'s Hands-On Labs sections for
   the affected modules to explicitly instruct "push your work to a public
   or private GitHub repository and paste the URL here" as the final
   numbered step, so the curriculum content and the lab UI agree.
5. Loop Decision 4 back to whoever owns `COMPLIANCE_DECISIONS_NEEDED.md`
   rather than deciding it in isolation here.
