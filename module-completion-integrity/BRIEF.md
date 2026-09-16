# Module completion integrity — generalize the detail-beacon pattern

**Status, 2026-09-16: NOT STARTED. Spec only.** Written for a fresh session
(owner intends to run this via Codex) after a live debugging session found
the root cause below. Read this whole file before writing any code.

**Owner instruction:** once every item in this doc is actually done and
verified, `git mv` this file into `archive/` per that directory's own
"When to archive a doc" rule — don't archive it while any part is still
open.

## Context: no real students yet

Confirmed with the owner 2026-09-16: this environment has no real student
data. It's deployed to the production GitHub Pages repo, but is still
pre-launch — effectively staging. That means this work can freely reset
any currently-"complete"-but-uncorroborated module row for any test
account without worrying about disrupting a real student's visible
progress. **Re-confirm this is still true before shipping if this doc is
picked up significantly later than 2026-09-16** — if real enrollment has
started by then, this becomes a much more sensitive rollout and needs the
owner's sign-off on the blast radius first.

## The problem

`moduleCompletion()` in `portal/app.js` decides whether a module counts as
complete — this feeds the student's progress percentage
(`programProgress()`) AND the sequential module-access gate
(`hasModuleAccess()`, which requires every lower-numbered module in the
program to be `moduleCompletion(...).complete`, not just the immediately
preceding one).

For **Module 1 only**, this check is strict: it refuses to trust the coarse
`module_progress.state = 'complete'` flag alone. It requires a detailed
per-field beacon (`quizPassed`, `consoleCompleted`, `lab2Completed`,
`lessonsComplete`) corroborating it, sourced from local browser state OR a
`module_progress.detail` jsonb beacon synced from whichever device did the
real work. See `portal/app.js` ~line 3622 (`moduleOneRequirementsComplete`)
and its comment: *"A historical module_progress row can be a coarse
lab-only claim, so it must not override the detailed rule."*

**Modules 2–12 have no equivalent.** Their `allLabsComplete` check (same
function, ~line 3604) is:
```js
const allLabsComplete = (moduleKey !== 'soc-01' && remoteComplete) || labs.every(...)
```
— for any module other than `soc-01`, a coarse `remoteComplete` (i.e.
`module_progress.state === 'complete'`) is sufficient on its own. No
per-field corroboration required.

**Why this matters:** this is the same class of bug Module 1 already had
and was fixed for — *"the page must never show work complete merely
because another layer has a stale summary badge"* — just not yet
generalized. Discovered today via 3 known test accounts
(`4437023872-SOCAN`, `9334491415-SOCAN`, `5520852787-SOCAN`) whose
`module_progress` rows show `state: 'complete'` for modules 2–12 with no
real per-field evidence behind it, inflating their displayed progress
(11/12 · 92%) and — more importantly — meaning `hasModuleAccess()` could
wrongly unlock a later module for module 2–12 on the same kind of stale
coarse row Module 1 already had to be protected against.

## Goal

Generalize the Module 1 pattern to modules 2–12, so `moduleCompletion()`
never trusts a coarse `state` flag alone for **any** module.

## Reference implementation (already built and live for Module 1)

- `portal/soc-analyst-module-01.js`, `moduleOneSyncDetailBeacon()` —
  computes `{quizPassed, consoleCompleted, lab2Completed, lessonsComplete}`
  from local state, **ratchets** it (OR's each field against
  `user.remoteModuleDetail['soc-01']` before writing — never regresses
  true back to false; see the 2026-09-16 fix for why this matters, same
  file, and the commit that added it), writes via `upsertModuleProgress()`.
  Fires from `moduleOneSave()`.
- `portal/app.js`, `moduleCompletion()` (~line 3622) — the `soc-01`-specific
  branch (`moduleOneRequirementsComplete`) that requires the detail fields.
- `portal/app.js`, `buildUserFromSession()` (~line 107–119) — **already
  fetches `module_progress.detail` for every module**, once per session,
  into `user.remoteModuleDetail[moduleKey]`. The read side is already
  generic. Nothing to add here.
- `supabase/migrations/20260916050000_module_one_detail_beacon.sql` — added
  the `detail` jsonb column to `module_progress`. It's a general column,
  not soc-01-specific. **No new migration needed** for this generalization,
  only population + read logic per module.

## What needs to be built, modules 2–12

For each of `soc-analyst-module-02.js` through `-12.js`:

1. Identify that module's own real local completion signals — each module
   already tracks its own quiz/lesson/lab state locally (e.g.
   `moduleTwoState`, `moduleThreeState`, ...) the same way Module 1 does.
   Survey each file for what "genuinely done" means there — the exact
   shape will differ per module (some have no quiz, some have 1 lab not 2,
   Module 12 is the capstone with its own `moduleTwelveUnlocked()` gate —
   check whether it needs this treatment at all or is already gated
   differently).
2. Add a `moduleNSyncDetailBeacon()` per module mirroring Module 1's
   ratchet pattern exactly (OR against `user.remoteModuleDetail[moduleKey]`,
   dedupe via a last-synced-in-memory guard, fire from that module's own
   save function).
3. Extend `moduleCompletion()` in `portal/app.js` to add the same kind of
   per-module strict branch Module 1 has — or, better, look for a way to
   express this generically across modules 2–12 instead of duplicating the
   `soc-01` special-case pattern 11 more times (their per-field shapes
   differ, so full generalization may not be possible, but at minimum
   don't copy-paste-drift 11 near-identical branches — see if the common
   part factors out).
4. Decide what happens to the 3 known test accounts' modules 2–12 rows once
   this ships: their `state: 'complete'` rows will now correctly evaluate
   as incomplete (no detail corroboration exists for them either) — this is
   the *correct* outcome per the "no real students yet" note above, but
   confirm it doesn't surprise anyone reviewing those accounts.

## Verification

- `node --check` every touched file.
- `node bin/portal-check.js` — 38/38 expected, no regressions.
- Live browser: pick at least one module beyond 01 that has real local
  completion state to test against (Module 1 was the only unblocked
  account this session — check whether that's still true, or whether the
  3 flagged accounts are now usable now that Module 1 itself is fixed).
- Confirm `hasModuleAccess()`'s full-chain check still behaves correctly
  end-to-end once modules 2–12 are strict, not just each module in
  isolation.

## Out of scope for this doc

- IT-support / AI-ML / Electrical tracks' own module files likely have the
  identical coarse-trust gap in their own completion logic — same class of
  fix, different files/track. Separate pass, don't touch without a
  separate go-ahead (same reasoning as flagging AI/ML out of scope for the
  nav-rail sprint).
- The one-time backfill of the 3 known test accounts' Module 1 beacon is
  tracked in `lab-grading-notification-system/STATE.md`, not blocked on
  this generalization landing first.
- The left-pane/unified-nav layout work (separate active thread, see
  `NEXT_SESSION.md`) is unrelated UI work, not touched by this doc.
