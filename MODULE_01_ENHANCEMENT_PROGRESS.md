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

`sprint: 5` — not started yet. Read "Sprint 5" row below and launch it —
Lab 2 rebuild (fresh incident, not Lab 1's exact case). This is the
riskiest remaining content sprint; read the whole Lab 2 row carefully
before writing the brief, including the note about Lab 1/Lab 2 currently
sharing one completion signal.

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
| 5 | Lab 2 rebuild: fresh incident (not Lab 1's decision path), entity/scope/priority/escalation-boundary identification, structured handoff note (observations/analysis/scope/next action), visible rubric, retained evidence | not started | `portal/soc-analyst-module-01.js`, `portal/data.js` | Lab design section + acceptance criterion 3. Current Lab 2 reuses Lab 1's exact case, and — confirmed while building sprint 4 — both labs currently flip `complete` together off ONE form submit (`moduleOneState.completed`, set around line ~971, calls `markModuleLabComplete` for both `lab-soc-environment` and `lab-soc-escalation` back to back). This sprint must give Lab 2 its own incident, its own decision fields, and its own independent completion signal — don't just reskin the copy while leaving the shared submit handler intact |
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
