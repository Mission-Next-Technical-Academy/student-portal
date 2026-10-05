# Universal Academy first-login orientation — sprint spec

**Status, 2026-09-20: DONE, live-verified, migration pushed.** Built per an
owner sprint brief (not a `ROADMAP.md` queue item — see "Relationship to
`ROADMAP.md` item 1" below) for a single, program-agnostic first-login tour:
Welcome → Academy nav/programs/help → the student's enrolled program card →
that program's module structure → Module 1 → Learn It/Practice It/Prove It →
how grading/review works → done. Fed entirely from `PROGRAMS` (`portal/
data.js`) and the real rendered DOM — no per-program copy of the engine.

## Files

- `portal/orientation.js` (new) — the whole state machine: step definitions,
  spotlight/mask rendering, sessionStorage-based progress that survives the
  SPA's full `innerHTML` route replacements.
- `portal/orientation.css` (new) — overlay styling.
- `supabase/migrations/20260920100000_academy_orientation_state.sql` (new,
  **pushed to the linked project**) — `students.academy_orientation_
  completed_at` + `mark_academy_orientation_complete()` self-service RPC
  (SECURITY DEFINER, scoped to `auth.uid()`, idempotent).
- `portal/app.js` — `students` select now includes the new column; one call
  (`AcademyOrientation.onRouteRendered(user, hash)`) added at the end of
  `render()`'s non-admin branch; `#mnt-my-programs` id added to the dashboard
  programs section; `#sec-curriculum-summary` id added to the compact "N
  Weeks · N Modules" line (see bug 3 below); "Generate New User" panel copy
  corrected (see bug 1).
- `portal/index.html` — new `<link>`/`<script>` tags, cache-buster bumps.

## How it survives route transitions

`render()` in `app.js` is a full `app.innerHTML = ...` replace on every
hashchange — nothing DOM-based can persist across a navigation on its own.
Progress is kept as `{programSlug, stepId}` in `sessionStorage`; `render()`
calls `AcademyOrientation.onRouteRendered(user, hash)` once at the end of
every non-admin route render, which decides whether to (re)mount the current
step, advance past a step whose required click already happened, or tear
down and wait for the student to navigate back to a route the tour cares
about.

## Program-agnostic degradation

Only SOC Analyst has the quick-nav rail (`moduleUnifiedNav`,
`[data-mquick-nav-rail]`) today. `buildSteps()` checks for it fresh on every
call (so it reflects real DOM state once the student is actually on the
module route) and swaps the three separate Learn It/Practice It/Prove It
spotlighted call-outs for one combined, un-anchored explanation on programs
without it — same copy, same step id, no per-program file. Verified by
removing the rail node and re-invoking `AcademyOrientation.onRouteRendered`
directly (see Verification); **not yet exercised against a real live IT Help
Desk account** — the account-enrollment friction in bug 2 below made that
impractical this session. Worth a real pass once an enrolled HDESK test
account is easy to get.

## Persistence

Academy-level, not per-program (`students` already has exactly one row per
student, independent of `track_code` — same reasoning as `module_progress.
detail`'s Module 1 beacon comment). A student sees the full walkthrough once
regardless of which program they're enrolled in or later add.

## Bugs found and fixed this session (all pre-existing, not introduced here)

1. **Misleading "auto-enrolled" copy.** "Generate New User" claimed the new
   account was auto-enrolled; `supabase/functions/admin-provision/index.ts`'s
   `handleCreateUser` deliberately hardcodes `isEnrolled: false` for ad hoc
   single-account creation regardless of a chosen cohort (documented,
   intentional — "unassigned/not-yet-activated... matching 'unused' cleanup
   semantics"). Not a bug in the provisioning logic; the panel copy was
   wrong. Fixed the copy only — no schema/function change.
2. **Spotlight overlay pointer-events bug (this sprint's own code).** The
   root `.mnt-orient` div spans the full viewport with default `pointer-
   events: auto`; any point not covered by a mask panel (i.e. the "hole"
   over the spotlighted control) still hit-tested to that root div, silently
   swallowing the click. Fixed: `pointer-events: none` on the root, opted
   back in explicitly on the mask panels and the card.
3. **Oversized spotlight target (this sprint's own code).** The
   program-structure step originally spotlighted `#sec-curriculum`, which is
   the entire scrollable module list (~3000px for a 12-module program) — a
   ring far bigger than the viewport, and `positionCard()`'s corner-pin
   fallback (for a target that fills the screen) placed the card somewhere
   disconnected from what the student was looking at. Fixed by adding
   `#sec-curriculum-summary` (the compact "N Weeks · N Modules" line) as a
   dedicated, appropriately-sized target.

## Owner feedback incorporated (2026-09-20, after first live pass)

1. "The blur out does not need to be there once we navigate into the actual
   program." Every step from `program-structure` onward now sets `dim:
   false` — no backdrop mask panels are created at all for those steps, only
   the ring and card; the real page stays fully legible and fully
   interactive underneath.
2. "Adjustment for the Helpdesk 'this is your course' situation?" — the
   rail-presence check above; IT Help Desk (and any future program without
   `moduleUnifiedNav`) gets the combined single-card Learn/Practice/Prove
   explanation instead of three redundant un-anchored call-outs.
3. "Highlight for lab submission and how it's not fully passed until the
   teacher has reviewed it — capstone is the same format, don't add anything
   special for it." Added a `review-gate` step after Prove It (reuses Prove
   It's own spotlight target, or the combined card's spot, rather than a new
   fragile selector), explaining the `lab_attempts`/faculty-review/"Redo
   Requested" gate (see `lab-grading-notification-system/STATE.md`). One
   sentence explicitly covers the capstone ("works the same way, just at a
   larger scale") so it needed no step of its own, per instruction.

## Verification

Live, twice, as a freshly admin-provisioned SOC Analyst account
(`7634107909-SOCAN`), full path: welcome modal → academy nav/programs/help
→ click program card → program-structure (dynamic "12 modules... 6 weeks...
2 each week" copy, confirmed against `PROGRAMS`' `soc-analyst` entry) →
click Module 1 → Learn It/Practice It/Prove It (real `moduleUnifiedNav` rail
targets) → review-gate → done → landed in real Module 1 content, overlay
gone. `students.academy_orientation_completed_at` confirmed written after
completion and confirmed **not** re-shown on a subsequent login. No-rail
fallback verified by removing `[data-mquick-nav-rail]` from the live DOM and
re-invoking the engine directly (see "Program-agnostic degradation" above).
`bash bin/ci-check.sh` clean throughout (syntax, portal render, simulator
route render, diff whitespace).

**Known gap:** enrollment for a program was set via the admin dashboard's
"Enrollment Planning" checkbox — that control's `<input>` is `sr-only`
(a hidden native checkbox inside a styled `<label>`); clicking the
accessibility-tree-resolved `<input>` node directly does nothing, clicking
the visible `<label>`/its text does. Not code-fixed (it's a real, working
control once you know to target the label), just noted here so the next
session doesn't lose the time this one did rediscovering it.

## Relationship to `ROADMAP.md` item 1

**This is not `ROADMAP.md`'s "Module 1 orientation tour" (Ordered delivery
queue, item 1) and does not close it.** That item is Day 1 framing, rules of
engagement, assigned scope, and a workspace walkthrough — content owned by
the existing in-module `ui/coach.js` "Take the tour" system (the
`m01-orientation` coach, scoped to Module 1's own `allow` list; see
`soc-analyst-track-reimagining/MODULE1_DAY1_REBUILD_PLAN.md`). This sprint
is a separate, earlier layer: an Academy-wide, LMS-navigation-only tour that
runs once at first login, before the student ever opens Module 1, and is
deliberately discipline-neutral (no SOC/SIEM language, no "your move"/
task-coaching framing — that distinction is exactly what MODULE1_DAY1_
REBUILD_PLAN.md's D1 decision says the in-module coach must own instead).
Do not mark item 1 done because of this sprint, and do not fold this
engine into `ui/coach.js` — they solve different problems for different
moments and currently target different DOM (`portal/` vs `ui/`).
