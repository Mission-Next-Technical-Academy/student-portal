# Module 01 enhancement — sprint progress & resumption pointer

Source spec: `MODULE_01_ENHANCEMENT_BRIEF.md` (do not archive it until every
sprint below is `done` — house rule in `archive/README.md`).

Working model: one haiku subagent per sprint, run sequentially (later
sprints depend on earlier ones), reviewed and committed by the orchestrating
session before moving on. Agents never run git. No pushes to `origin/master`
— this repo auto-deploys to GitHub Pages on push, so unreviewed curriculum
content must stay local until a human explicitly asks to push.

**If you are picking this up cold (new Claude or Codex session, prior one
ran out of tokens): read the "Next action" line at the very top of this
file, then the row for that sprint below, then go.**

---

## Next action

`sprint: 5b` — not started yet. Sprint 5 was split in two once its design
work started: 5a (Lab 2's fresh-incident data) is done, written directly
by the orchestrator rather than delegated (compliance/quality-sensitive
scenario content, cheap to just write). 5b is the actual rendering,
state, scoring, and wiring rebuild that makes Lab 2 use that data as its
own independent lab — this is real coding work and the right one to hand
to a haiku sprint. Read the "Sprint 5b" row below in full before writing
its brief; it names every exact function/line this touches.

---

## Known constraint — read before touching minutes/hours

`CURRICULUM_ALIGNMENT_ARCHITECTURE.md` locks the program's parent-code hour
totals (SOC-101.1–.8) against a controlling Form 301 that isn't in this repo.
Module 01's Lesson 1 and Lesson 5 each currently allocate 60 of the 120
SOC-101.2 minutes used inside module 01; other modules (at least soc-02)
also draw on SOC-101.2. **Do not shrink any lesson's `durationMinutes` or
`parentAllocations` to make room for the new module assessment** — that
silently changes a compliance-audited total across files this doc's author
did not fully trace. Brief acceptance criterion 1 ("exactly 480 minutes,
including embedded assessment time") is therefore treated as **blocked on a
compliance decision**, not as an engineering task — see Sprint 8.

---

## Sprint log

| # | Scope | Status | Files touched | Notes |
|---|---|---|---|---|
| 1 | Lesson-activity framework (worked example + 3–5 Q knowledge check + applied task, per lesson) + full content for Lessons 1–3 | **done** | `portal/soc-analyst-module-01.js`, `portal/data.js`, `portal/module-labs.css` | Framework: `moduleOneLessonWork(n)`, `moduleOneLessonQuizOptions(n, question)`, `moduleOneLessonComplete(lesson)`, new `lessonWork` state key. Data schema: lesson objects gain `example.scenario`, `knowledgeCheck.questions[]` ({id, prompt, options[], correctId, feedbackCorrect, feedbackIncorrect}), `appliedTask` ({prompt, placeholder}). Orchestrator review found and fixed two real bugs the agent introduced: (1) the "N of M correct" quiz summary compared raw option ids across questions instead of per-question `correctId` — could show a wrong count; (2) the new change/click/input/blur listeners were attached to `document` directly, which persists across `render()` calls, so they would have **duplicated on every re-render** (the rest of this file delegates on elements that get recreated each render, e.g. `#m01-lab-dynamic` — fixed by delegating on `#m01-lessons`, which is recreated the same way). Both fixed before commit; `node --check` clean; lessons 4-9 confirmed untouched by diff inspection. |
| 2 | Same content shape for Lessons 4–6 | **done** | `portal/data.js` only | Clean — data-only, no rendering-framework changes needed. 14 questions (l4-q1..4, l5-q1..5, l6-q1..5), all ids unique, all correctId valid, verified against lessons 1-3/7-9 untouched |
| 3 | Same content shape for Lessons 7–9 | **done** | `portal/data.js` only | All 9 lessons now complete: 40 total questions, all ids unique, all correctId valid. "Turn each of the nine existing curriculum blocks into a complete learning activity" (brief) is now satisfied |
| 4 | Module progress checklist: all 9 lessons + 2 labs, duration + real completion state (knowledge check passed AND task submitted — not "page opened") | **done** | `portal/soc-analyst-module-01.js`, `portal/module-labs.css` | New `.m01-checklist` section between hero and objective. Total confirmed prints 480 min (300 lessons + 180 labs); lesson completion reuses `moduleOneLessonComplete()`; lab completion reuses the same `loadModuleEngagement()`/`moduleLabEngagementId()` check `moduleCompletion()` in app.js already uses, so it'll automatically reflect sprint 5's fix below once that lands |
| 5a | Lab 2's own fresh-incident data | **done** | `portal/data.js` | New standalone `MODULE_ONE_ESCALATION_LAB` const (right after `MODULE_ONE_ALERT_ORIENTATION` closes, ~line 1486): endpoint/exfiltration case (`FIN-WKS-014`, `m.reyes`, phishing-click origin — deliberately not another identity case like Lab 1's `j.santos`). Has its own `scenario.evidence` (3 items), `entityOptions`/`scopeOptions`/`priorityOptions`/`escalationOptions` + matching `correctEntity`/`correctScope`/`correctPriority`/`correctEscalation`, a `rubric` string array (4 items), and `handoffFields` (4 objects: `observations`/`analysis`/`scope`/`nextAction`, each with `label`, `help`, `minLength`, `placeholder`) for the structured handoff note. `node --check` clean. Nothing in `soc-analyst-module-01.js` reads this yet |
| 5b | Lab 2 rebuild: render/state/scoring/wiring so Lab 2 is a real independent lab using 5a's data, not a reskin of Lab 1's form | not started | `portal/soc-analyst-module-01.js` | Lab design section + acceptance criterion 3 ("separate tasks, evidence, and completion records"). **Current state, confirmed while building sprints 4-5a:** `moduleOneLabDynamic()` (~line 346) renders Lab 1's evidence timeline, then ONE `<form id="m01-form">` (~line 462) that bundles Lab 1's verdict/priority/phase/decision fieldsets together with a single freeform "Lab 2" case-handoff textarea — one submit handler (~line 938-975) scores everything together via `moduleOneScore()` and calls `markModuleLabComplete()`/`recordLabAttempt()` for **both** `lab-soc-environment` and `lab-soc-escalation` back to back. That must become two independent forms/submits: Lab 1's form keeps only its own four fieldsets and its own submit (still marks only `lab-soc-environment`); a new Lab 2 form (evidence-review + entity/scope/priority/escalation radios via `moduleOneOptionList()` + the four `handoffFields` textareas) gets its own state slot in `MODULE_ONE_DEFAULT_STATE` (e.g. `lab2: { reviewedEvidence: [], entity: '', scope: '', priority: '', escalation: '', handoff: {}, attempts: 0, score: null, breakdown: null, feedback: [], completed: false }`), its own scoring function, its own submit handler marking only `lab-soc-escalation`, and its own persisted score/breakdown display (the "retained evidence" requirement — show the saved submission back to the learner, don't clear it). Keep the existing "Lab 2 unlocks after Lab 1" sequencing. Sprint 4's checklist already reads lab completion generically via `loadModuleEngagement()`/`moduleLabEngagementId()`, so it needs no changes and will pick this up automatically |
| 6 | Lab 1 hardening pass: verify/complete evidence checkpoints, timeline, disposition+priority+rationale, scored result, coaching against the brief — likely small diff, most of this already exists | not started | `portal/soc-analyst-module-01.js` | |
| 7 | Program overview UX: primary action (Start/Continue/Review Module) visible on the **collapsed** module card; chevron becomes a secondary "View curriculum blocks and labs" control | not started | `portal/app.js` (`moduleCard()`, ~line 3578) | Shared component — every program's module cards render through this function. High blast radius; verify across all 4 tracks before committing, not just soc-analyst |
| 8 | 30–45 min module assessment (event/alert/incident classification, triage choices, case-note quality) | blocked | — | Cannot proceed until someone with compliance authority decides how the assessment's minutes are carved out of the locked SOC-101.2/.6 totals. Draft the question added to `COMPLIANCE_DECISIONS_NEEDED.md` as part of this sprint, then stop |
| 9 | Final QA: `node --check` all touched files, `node bin/portal-check.js 1`, walk every acceptance criterion in the brief, write a HANDOFF.md-style entry, decide archive status (brief cannot archive while sprint 8 stays blocked) | not started | — | |

## Per-sprint mechanics (same for every row above)

1. Read this file's row for the sprint plus `MODULE_01_ENHANCEMENT_BRIEF.md`.
2. Spawn one general-purpose agent, `model: haiku`, with a self-contained
   brief: what to build, which files it may touch (and which it must not),
   the data schema/patterns already in place (existing lesson objects in
   `MODULE_ONE_ALERT_ORIENTATION.lessons` in `portal/data.js`, existing
   `m01-*` CSS prefix convention, `LabRuntime.load/save/reset`, the
   event-delegation wiring pattern in `wireModuleOneLab()`), and required
   verification (`node --check <file>`, `node bin/portal-check.js 1`).
3. Read the agent's summary + `node --check` the touched files yourself.
   Spot-check the actual diff — don't trust the summary alone.
4. `git add` only the files that sprint was scoped to touch (never
   `git add -A` — this working tree also has unrelated uncommitted M360 work
   in progress; leave it alone) and commit with a message naming the sprint.
5. Update this file's status cell and the "Next action" line at the top.
6. Move to the next sprint, or stop here if this is the end of the session.
