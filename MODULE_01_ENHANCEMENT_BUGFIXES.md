# Module 01 enhancement — bugs found and fixed during review

Every bug below was introduced by a haiku sprint agent (see
`MODULE_01_ENHANCEMENT_PROGRESS.md` for the full sprint log), caught by the
orchestrating session's review before commit, and is **already fixed and
committed** — nothing here is outstanding. This file exists as a single
place to see what went wrong and why, since the sprint log spreads the
detail across several rows.

All fixes landed in the same commit as the sprint that introduced the bug
(see the commit each item names) — none needed a separate fix-up commit.

---

## 1. `moduleOneOptionList()` referenced an out-of-scope variable

**Sprint:** 5b (Lab 2 rebuild) · **Commit:** `f8f1cd4`
**Severity:** Would have broken rendering entirely for both labs.

The agent added an optional third parameter to `moduleOneOptionList()` so
Lab 2 could reuse it against `moduleOneState.lab2` instead of the top-level
state, but left a leftover line that read `option.id` before `option` was
defined (it's only bound inside the `.map((option) => ...)` callback a few
lines later):

```js
function moduleOneOptionList(name, options, stateSlot) {
  const state = stateSlot || moduleOneState;
  const checked = state[name] === option.id; // option is not defined here
  ...
```

This throws a `ReferenceError` on every call — i.e. every single fieldset
in Lab 1 and Lab 2, meaning the module would fail to render at all. `node
--check` does not catch this class of bug (it's a valid reference at parse
time; the failure only happens when the line actually executes).

**Fix:** deleted the stray line; the real comparison was already done
correctly inline inside the `.map()` a few lines down.

**Why it wasn't caught before commit:** the agent's own verification only
ran `node --check` and a couple of `grep`s — it never actually rendered the
page. Caught here by a full VM render smoke test (see item 5 below for why
that's now a standing requirement).

---

## 2. Lab 1 and Lab 2 both use the field name `priority` — one handler wasn't guarded

**Sprint:** 5b (Lab 2 rebuild) · **Commit:** `f8f1cd4`
**Severity:** Silent data corruption — picking a value in Lab 2 would overwrite Lab 1's already-scored state.

Lab 1's decision form and Lab 2's new decision form both have a radio group
named `priority` (plus `scope`, which only Lab 2 uses). The agent added a
new `change` handler branch for Lab 2's fields, correctly guarded with
`input.closest('#m01-lab2-form')` — but didn't add the mirror guard to the
**pre-existing** Lab 1 branch:

```js
// original Lab 1 branch — fires for ANY input named priority, including Lab 2's
if (['verdict', 'priority', 'phase', 'decision'].includes(input.name)) {
  moduleOneState[input.name] = input.value;
  ...
}
// new Lab 2 branch — correctly scoped
if (['entity', 'scope', 'priority', 'escalation'].includes(input.name) && input.closest('#m01-lab2-form')) {
  moduleOneState.lab2[input.name] = input.value;
  ...
}
```

Since both `if` statements run unconditionally (not `if`/`else if`),
selecting a priority option inside Lab 2's form would ALSO silently write
into Lab 1's top-level `moduleOneState.priority` — corrupting an
already-submitted, already-scored Lab 1 result without any visible error.

**Fix:** added `&& !input.closest('#m01-lab2-form')` to the original Lab 1
branch, so it only ever fires for genuine Lab 1 inputs.

---

## 3. Quiz "N of M correct" summary compared answers across the wrong question

**Sprint:** 1 (lesson-activity framework) · **Commit:** `04aef4b`
**Severity:** Would have shown a wrong correct-answer count on lesson knowledge checks.

The per-lesson knowledge-check summary line was computed like this:

```js
${Object.values(work.answers || {}).filter((id) => {
  const q = lesson.knowledgeCheck.questions.find((qu) => (qu.answers || {})[id] === id || Object.values(qu.options || {}).some((o) => o.id === id));
  return q && id === q.correctId;
}).length} of ${lesson.knowledgeCheck.questions.length} correct
```

This iterates over the learner's *answer values* (option ids like `a`/`b`/
`c`, which repeat across every question) and matches each one against
*any* question in the lesson whose `correctId` happens to equal that same
letter — not specifically the question the answer was actually given for.
With multiple questions sharing option ids, this could report the wrong
count in either direction.

**Fix:** replaced with a direct per-question comparison:

```js
${lesson.knowledgeCheck.questions.filter((q) => (work.answers || {})[q.id] === q.correctId).length} of ${lesson.knowledgeCheck.questions.length} correct
```

---

## 4. Lesson interaction listeners attached to `document`, not to a per-render element

**Sprint:** 1 (lesson-activity framework) · **Commit:** `04aef4b`
**Severity:** Would have caused each lesson's change/click/input handler to fire multiple times, compounding on every re-render.

The new lesson-quiz and applied-task listeners (`change`, `click`, `input`,
`blur`) were attached directly to `document`:

```js
document.addEventListener('change', (event) => { ... });
document.addEventListener('click', (event) => { ... });
```

`wireModuleOneLab()` runs again after every full page `render()`. Every
other delegated listener in this file is attached to an element that gets
discarded and recreated as part of that same render (e.g. `#m01-lab-
dynamic`), so re-attaching is harmless — the old element and its listeners
are thrown away together. `document` itself is never recreated, so each of
these four listeners would have stacked up a duplicate on every re-render,
and a single click would eventually fire the handler many times over in a
session with enough interactions.

**Fix:** delegated all four listeners on `#m01-lessons` instead — the
lesson-grid wrapper that IS recreated by `moduleOneLessons()` on every
render, exactly like the rest of the file's own pattern.

---

## 5. Cosmetic: stale "four-part triage record" heading

**Sprint:** 6 (Lab 1 hardening) · **Commit:** `0373d58`
**Severity:** Copy only, no functional impact.

Sprint 5b renamed Lab 1's form heading from "five-part" to "four-part"
when it removed the case-note field. Sprint 6 then added a new required
`rationale` field, making it five parts again, but the heading was never
updated back. Sprint 6's own render-smoke-test happened to only exercise
the Lab-1-**locked** render state, where this heading (and the whole form)
never appears — so its own verification didn't catch it.

**Fix:** heading corrected to "Complete the five-part triage record".

---

## Process takeaway (already folded into `MODULE_01_ENHANCEMENT_PROGRESS.md`)

`node --check` only catches syntax errors — none of bugs 1-4 above are
syntax errors, so all four passed it cleanly. Any sprint touching
`soc-analyst-module-01.js`'s rendering or wiring code now requires an
actual render smoke test (a throwaway Node `vm` harness that loads the
real files and calls `view()`) before being trusted, in both the
Lab-1-locked and Lab-1-unlocked states — bug 5 above shows that testing
only one render state can still hide a real, if cosmetic, regression.
