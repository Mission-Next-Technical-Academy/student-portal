# Program Parity & Grading Gaps — Sprint Plan

**Date:** 2026-09-10
**Reference:** Full-platform robustness audit this session (3 parallel read-only
agents), triggered by owner asking whether `it-support`, `ai-ml`, and
`electrical` are "as robust and full as" `soc-analyst`, whether they justify
their claimed hours, and whether grades/rubrics exist. `soc-analyst` (70
hours, 4,200 module-minutes matching exactly, per-lesson scored quizzes in
11/12 modules, real 10-domain capstone rubric) is the baseline every other
track is measured against. See `HELPDESK_CURRICULUM_SWEEP.md` for the
earlier, narrower Day-1-ticket-topics sweep this builds on.

## Status board

| Sprint | Track | Scope | Type | Status |
|---|---|---|---|---|
| 0 | it-support | Reconcile hour-compliance mismatch (bug from this session's HD-2124 edit) | Decision + small fix | Not started |
| 1 | it-support | Add per-lesson knowledge-check quizzes, all 12 modules | Build, one module per sub-sprint | Not started |
| 2 | ai-ml | Implement real capstone rubric scoring (currently hardcodes `score: 100`) | Build | Not started |
| 3 | electrical | Decide whether to build the track at all before any content work | Decision only | Not started |

---

## Sprint 0 — IT Help Desk hour-compliance mismatch (decision needed)

**The bug:** earlier this session, adding ticket HD-2124 to Module 11 bumped
that module's lab time 75→135 min (`portal/data.js:2169`,
`lab-its-11-handoff-documentation`), which correctly kept the *module's own*
`durationMinutes`/`creditMinutes` internally consistent (135+270=... see
`portal/data.js:375`, 210→270, "3.5 Hours"→"4.5 Hours"). What it did **not**
do: propagate to the *program-level* hour claim. Summed across all 12
`its-*` modules, real content now totals 3,660 min = **61 hours**, but:

- `compliance.technicalHours`/`totalHours` (`portal/data.js:173-174`) still say **60**
- `compliance.labHours` (`portal/data.js:176`) still says **23** (should be 24)
- `stats` display block (`portal/data.js:198-199`) still shows "60 Clock
  Hours" / "23 Hours" lab instruction — this is user-facing, on the program
  catalogue page
- The `ITHD-101.2` parent-course row (`portal/data.js:190`) still says
  `hours: 7` / `labMinutes: 150` — doesn't reflect the extra 60 min

Before this session's edit, the sum was exactly 3,600 min = 60h and matched
the compliance block perfectly. Now it doesn't.

**Why this needs a decision, not just a patch:** `compliance.technicalHours`
etc. are marked `status: 'developer-mapped'` and sourced from
`MNT_HelpDesk_Parent_Course_Hour_Mapping_ALL_12_MODULES.docx` (an external,
not-in-repo controlling document — see `sourceNotes` at `portal/data.js:180-183`).
That docx, not the app's own module-minute sum, may be the actual source of
truth for the *published/credentialed* hour figure. Silently bumping
published clock-hours because a lab got 60 minutes longer is a compliance
change, not a code fix.

**Options:**
1. **Revert** — trim Module 11's lab back toward 75 min (or find 60 min
   elsewhere to cut) so the real sum stays at exactly 60h and the published
   figure needs no change. Lowest risk; keeps the external docx and the app
   in sync without touching compliance numbers.
2. **Reconcile forward** — bump `technicalHours`/`totalHours` to 61,
   `labHours` to 24, the `stats` strings, and the `ITHD-101.2` parent row to
   match reality (7h→8h, `labMinutes` 150→210). Correct if the docx itself
   is due for revision anyway, but changes a number that appears on the
   public program page and possibly the diploma/Form 301 mapping — get
   sign-off before doing this one.

**Next AI:** don't pick for the owner — ask which option, or check
`COMPLIANCE_DECISIONS_NEEDED.md` for whether this should be folded into that
doc's existing decision-needed pattern instead of being fixed ad hoc.

---

## Sprint 1 — IT Help Desk: per-lesson knowledge-check quizzes

**The gap:** `it-support` has zero per-lesson formative quizzes anywhere —
`grep -ln "knowledgeCheck\|radio\|questions:" portal/it-support-module-*.js`
returns no files, and the module catalogue entries in `portal/data.js`
(lines 229-374) don't even declare an `assessment` field. `soc-analyst` has
scored multiple-choice knowledge checks (`correctId` + feedback) in 11 of
its 12 modules, and `ai-ml` has the same in 11 of 12. This is the single
largest content gap found in the audit — it-support's hands-on practice
(coach-guided real-ticket walkthroughs via `ui/helpdesk-coaches.js`) is
genuinely strong and holds parity with soc-analyst's capstone rigor, but the
*lesson* layer has no formative check at all before a student reaches a lab.

**Reference implementation to copy the pattern from:**
- `soc-analyst`'s per-lesson quiz structures embedded in `portal/data.js`
  (e.g. `l1-q1` and neighbors, search `questions:` in the soc-analyst
  module blocks) — original pattern.
- `ai-ml`'s more recent build (`portal/ai-ml-module-*.js`,
  `selectQuizQuestions()`/`scoreQuizAttempt()`, built in the 2026-09-10
  session logged in `NEXT_SESSION.md`) — closer in age/style, worth
  checking first since it may be the cleaner reusable pattern.

**Suggested execution (per this repo's established convention — see
`NEXT_SESSION.md`'s AI/ML build entry and `[[feedback_sprint_handoff]]`
project-memory pattern used elsewhere): one sprint per module, delegated to
a cheap/fast subagent per module since the shape is mechanical once module 1
sets the pattern.** Do module 1 yourself (or with a stronger model) to
settle the quiz-data shape and where it lives (embedded in
`portal/it-support-module-NN.js` like ai-ml, vs. `portal/data.js` like
soc-analyst — **pick one and match it-support's existing file layout,
don't introduce a third pattern**), then fan out modules 2-12.

Each module's quiz should map to that module's actual lesson content (don't
generate generic filler questions — read the module's `topics`/`practice`
arrays first). Module 11 already has two tickets' worth of coach content
(HD-2113, HD-2124) to draw questions from if that module is in scope.

**Verify with:** `node bin/portal-check.js` after each module, plus a live
browser pass per `[[band_jobsheet_workflow]]`-style verification (actually
click through a quiz, confirm scoring and pass/fail gate work) before
marking a module's sprint done — don't just trust the code compiles.

**Update this file's status board** (and `NEXT_SESSION.md`) after each
module lands, per the sprint-handoff convention — don't wait until all 12
are done to record progress.

---

## Sprint 2 — AI/ML: real capstone rubric scoring

**The gap:** `portal/ai-ml-module-12.js:70` describes "an eight-stage
rubric, each scored for completeness and rigor," but the implementation
(`portal/ai-ml-module-12.js:279-317`) only gates completion on a checklist +
a ≥30-char reflection per stage, and hardcodes `recordLabAttempt(...,
{state:'complete', score:100, ...})` regardless of content — every student
who fills in the boxes gets a perfect score. This is the one place in ai-ml
where the description overpromises relative to the code. (Every other
ai-ml lab's self-report/reflection-gated design is an honest, disclosed
choice — see the module's own comment about no in-portal Python execution
sandbox — not a gap; the capstone's is the one spot claiming more rigor
than it delivers.)

**Reference implementation:** `portal/it-support-module-12.js`'s scored
7-domain capstone (`portal/data.js:216`, weighted categories summing to
100, `passingScore`/`criticalErrors` gating) or `portal/soc-analyst-module-12.js`'s
10-domain version (`rubricVersion: 'soc-analyst-capstone-v1'`) — both are
real auto-scoring engines with explainable per-item feedback. Port the same
shape to ai-ml's 8 stages: weight each stage, score it against actual
content (not just presence of text/URL), surface a breakdown, gate a
pass/fail threshold, and set a matching `rubricVersion`.

**Decide first:** can ai-ml's stages (data acquisition, EDA, feature
engineering, modeling, evaluation, deployment, monitoring plan, responsible
AI review) actually be scored client-side the way SOC/it-support tickets
are (deterministic correct-answer checking), or does grading model-quality
work inherently need human/instructor review? If the latter, this sprint's
scope may really be "wire a real evaluator-review step" rather than
"auto-score," which changes the shape of the fix — check
`COMPLIANCE_DECISIONS_NEEDED.md`'s Decision 1 (evaluator/supervision
requirement) before assuming full automation is even the right target.

---

## Sprint 3 — Electrical Engineering: build-or-shelve decision (decision needed, no code)

**Current state:** all 12 `eee-*` modules are `skeleton('eee', [...])`
(`portal/data.js:1112`) — `status: 'draft'`, summary literally reads
"Curriculum content for this module is being authored." Zero lessons, zero
labs, zero hours content, `isPublished: false`. This is not a content gap
to close incrementally — it is an entire unstarted program.

**Before any content sprint gets scheduled here**, this needs the same
kind of planning-first pass the AI/ML build got
(`AI_ML_APPLIED_BUILD_TRACK.md`, written before any code, resolving open
decisions with the owner first): is this track still wanted for launch, on
what timeline, and does a controlling curriculum source doc exist yet (the
other three tracks each had one — `AI_ML_ENGINEERING_CURRICULUM.md`,
`CURRICULUM_ALIGNMENT_ARCHITECTURE.md`/SOC's mapping, the IT Help Desk
build docs)? If no source curriculum exists for Electrical Engineering yet,
that's the actual blocker, not engineering time.

---

## Notes for whoever picks this up

- Sprints 0 and 3 are **decisions**, not code — don't start writing before
  the owner has weighed in on either, per this repo's own
  `COMPLIANCE_DECISIONS_NEEDED.md` precedent of separating decision docs
  from build docs.
- Sprint 1 is the biggest lift and the most valuable one (real content
  gap on a published, live program students are in today) — prioritize it
  over Sprint 2 if only one can run.
- Sprint 2 has a hidden dependency on a compliance question (client-side
  auto-grading vs. required human evaluation) — read
  `COMPLIANCE_DECISIONS_NEEDED.md` before writing scoring code so it isn't
  thrown away.
- Run `node bin/portal-check.js` after every change touching `portal/data.js`
  or any `portal/*-module-*.js` file — it's fast and already caught nothing
  broken across this session's edits, keep it that way.
- Follow this repo's doc-lifecycle rule (`archive/README.md`): once a
  sprint here is fully done and verified, mark it done on the status board
  above; once *every* sprint in this file is done, `git mv` this whole file
  into `archive/`.
