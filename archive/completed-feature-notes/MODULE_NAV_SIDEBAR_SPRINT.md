# Module quick-nav rail + duration copy — sprint spec

**Status, 2026-09-20: Three-stage left-navigation sweep DONE locally.** The
shared module navigation now makes `Learn It`, `Practice It`, and `Prove It`
the only top-level left-rail groups; every existing navigable section is
rendered as a child of the appropriate stage. This supersedes the previous
flat/unified group treatment (for example, Foundations, Knowledge Check,
Module Lab, Module Review, and Sources no longer sit as peer top-level rows).
The shared renderer now covers all SOC, IT Support, and AI/ML module pages,
plus Electrical's currently authored Module 01 placeholder; the M360 course
is deliberately untouched. The original Sprints 1-4 remain complete as
recorded below. Stage children are visibly indented (lesson
children one level further), and the stage chevrons use a compact CSS
slide-down/slide-up transition; `prefers-reduced-motion` disables that
transition. No deployment or commit was performed in this sweep. Validation:
`node --check` across portal app/module sources, `node bin/portal-check.js`
(all modules/program overview clean), and `git diff --check` all passed.

**Historical status, 2026-09-16: Sprints 1-3 DONE, committed (`7c59e22`), NOT yet
pushed to `master` — needs explicit go-ahead since push auto-deploys to
the live GitHub Pages site. Sprint 4 (new, owner feedback) also DONE in
that same commit — see its section below.** Sprints 1-2 built via two
Haiku sub-agent sprints (Sprint 1 + partial Sprint 2 on Modules 01-02, then
a continuation for Modules 03-12), reviewed/tested/fixed/committed by the
orchestrating session. Two real bugs shipped by the agents and caught only
by live browser testing before commit, both fixed:
1. The rail's flex wrapper had an inline `overflow: hidden`, which silently
   disables `position: sticky` on the rail inside it — the rail rendered
   once, then vanished on the first scroll. Fixed by moving the wrapper to
   a shared `.mquick-nav-layout` class with no `overflow` property.
2. `.mquick-nav-drawer[hidden] { display: none; }` (an attribute selector,
   specificity 0,2,0) outranked the desktop media query's plain class rule
   (0,1,0), so the "persistent" desktop rail never actually appeared at
   all regardless of viewport width. Fixed by repeating `[hidden]` in the
   desktop override too.

Verified live (Module 01, the only account not blocked by the Module 1
beacon gap — see `NEXT_SESSION.md`): duration copy renders correctly,
rail stays sticky through a full scroll, click-to-jump opens the target
lesson's `<details>` and scrolls to it, current-position highlight tracks
correctly. Modules 02-12 verified via `node bin/portal-check.js` (38/38)
plus a script-based tag-balance check (all 12 SOC modules' rendered HTML
has matched `<div>`/`<main>`/`<aside>` counts, `mquick-nav-rail` present
where expected) — not a live visual check, since no test account can
currently reach past Module 1. Do that live check first once account
access is unblocked, before assuming modules 2-12 look right.

Owner feedback, 2026-09-16, live-testing Module 01 as `4437023872-SOCAN`:

1. "8 hours of lecture? That's not intent... the intent is that each module
   is a lab, that can take that long." The duration badge reads as passive
   lecture length; it should read as hands-on lab time.
2. "A lot of scrolling... can I have the material of where I'm at on the
   left, for a quick navigate to? Or remove the scrolling." Confirmed:
   applies to all modules, not just Module 01.

Scope: all 12 SOC Analyst modules (`portal/soc-analyst-module-01.js` …
`-12.js`). AI/ML's 12 modules share the same shared components
(`moduleTopbar`, `moduleProgressShell` in `portal/app.js`) and would benefit
identically, but are out of scope for this sprint — flag as a fast-follow,
don't touch without a separate go-ahead (AI/ML is `isPublished: false`,
lower urgency).

## Current architecture (verified, 2026-09-16)

- `moduleTopbar(user, program, options)` — `portal/app.js:3794` — shared,
  site header.
- `moduleProgressShell(sections, state, options)` — `portal/app.js:3835` —
  shared. Renders `.mnav-shell` (`position: sticky; top: 64px` in
  `portal/module-labs.css:490`), a horizontal bar with 4 macro-section chips
  (Foundations / Knowledge Check / Guided Labs / Module Review), an overall
  percent, a "Continue to X" link, and a review-mode toggle. Each module
  file calls this with its own 4-entry `sections` array (e.g.
  `soc-analyst-module-01.js:739-742`, `moduleOneGetSections()`).
- Per-module, NOT shared: the "Module progress checklist" (e.g.
  `soc-analyst-module-01.js:800-836`, `.m01-checklist-list`). It lists every
  `module.curriculumItems` lesson plus each lab with a status pill and
  duration, but **rows are plain `<li>`, not links** — no click-to-jump.
  Each of the 12 module files duplicates this pattern under its own
  `m0N-checklist` class prefix.
- Per-module, NOT shared: individual lesson bodies are native
  `<details data-m01-lesson="N">` (`soc-analyst-module-01.js:175`) with no
  `id` attribute, so nothing can deep-link to lesson N — closed `<details>`
  also won't visually reveal content even if you could scroll to it.
- Duration text: `formatInstructionalMinutes()` (`portal/app.js:3671`) turns
  a minute count into "8 Hours" / "7 Hours 45 Minutes" etc. It's used in
  three places per module: the hero kicker ("Module 01 · 8 Hours · Start
  here", `soc-analyst-module-01.js:786`), each checklist row's duration
  column, and the checklist's running total. Source data:
  `module.durationMinutes` / `module.curriculumItems[].durationMinutes` in
  `portal/data.js` (SOC block starts ~line 495).
- Layout: `.m01-main` (`portal/module-labs.css:11`) is a single centered
  column, `width: min(1180px, calc(100% - 40px))`. No existing sidebar/grid
  structure in any module file — this is a real addition, not a tweak.

## Sprint 1 — duration copy (small, do first, all 12 modules)

`formatInstructionalMinutes()` output alone, in a kicker that also says
"Start here," reads like a lecture-length claim. Fix at the source function
plus its call sites, not per-module strings:

- Add a second exported helper (or a `{ suffix }` option on the existing
  one) that appends a hands-on qualifier, e.g. `formatHandsOnDuration()` →
  "8 Hours hands-on" / "7h 45m hands-on". Use it in the three hero-kicker
  call sites per module (the `m0N-kicker` line adjacent to `Start here` /
  the section title). Leave the checklist's per-row and total durations
  using the plain formatter — those already sit next to an explicit lesson
  or lab title, so "hands-on" there would be noise.
- Also check `portal/app.js`'s program-overview curriculum cards (the
  `/#/program/soc-analyst` listing, e.g. "8 Hours · 9 Curriculum Blocks · 2
  Performance Labs") — apply the same qualifier there for consistency, one
  shared call site, not per-module.
- Do not touch `MODULE_STANDARD.md`'s "hours is always a range" rule or
  `portal/data.js` duration values themselves — this is a display-copy
  fix, not a re-estimation of module length.

## Sprint 2 — persistent quick-nav rail (all 12 modules)

Goal: a student can jump straight to their current position, or any
completed section, without scrolling. Two acceptable presentations, and
both are actually wanted here, not a choice between them:

- **Desktop (≥ ~960px):** a persistent left rail, sticky alongside the main
  content (mirrors `.mnav-shell`'s `position: sticky; top: 64px` — pick a
  `top` that sits below both the site header and the existing `.mnav-shell`
  bar so they don't overlap).
- **Narrow viewports:** the rail collapses behind a toggle button that
  slides it in as an overlay drawer. This is the existing
  `@media (max-width: 920px)` breakpoint already used elsewhere in
  `module-labs.css:392` — reuse it, don't invent a new one.

Implementation shape:

1. Extend `moduleProgressShell()` (or add a sibling function called right
   next to it, `moduleQuickNavRail(items, state)`) that takes a flat list of
   **every** lesson + lab + the macro sections (title, `scrollId`/anchor,
   `isComplete`, `kind: 'lesson' | 'lab' | 'quiz' | 'review'`) and renders
   the rail markup. Build this from data already computed for each
   module's existing checklist — don't recompute completion logic a second
   time; expose the same per-item status array the checklist already
   builds (e.g. `soc-analyst-module-01.js:804-819`'s per-item `isComplete`)
   to the new renderer instead of duplicating it.
2. Give every lesson `<details>` a real `id` (e.g. `id="m01-lesson-03"`)
   and every lab section the same treatment. Rail links point at these
   ids.
3. Clicking a rail link to a lesson must open its `<details>` if closed —
   a plain anchor jump to a closed `<details>` shows nothing. Wire a small
   shared click handler (delegate on the rail container) that opens the
   target `<details>` before/as the browser scrolls to it.
4. Highlight the current position in the rail (first incomplete item, same
   `currentSection` logic already in `moduleProgressShell`) and keep it
   distinguishable from completed/locked items using the existing
   `mnav-chip-complete` / `mnav-chip-current` / `mnav-chip-locked` color
   language for visual consistency — new classes, same palette.
5. This is additive to `.mnav-shell`, not a replacement — the existing
   4-chip horizontal bar still gives macro orientation; the rail gives
   lesson-level jump access.

Apply identically across all 12 SOC module files using Module 01 as the
reference implementation, the same way `MODULE_STANDARD.md` intends (one
shape, no per-module reinvention) even though today's checklist code is
already duplicated 12 ways — don't make that worse by writing 12 different
rail implementations; centralize what you can in `app.js` and keep each
module file's own addition to "call the shared renderer with my data."

## Sprint 3 — remove the now-redundant CTAs (DONE, 2026-09-16, `7c59e22`)

Once the rail exists and highlights current position, two existing buttons
duplicate what it already does and duplicate each other:

- The hero's own "Begin with the foundations" link
  (`soc-analyst-module-01.js:789`, `.m01-hero-action`, one per module file,
  each hardcoded to jump straight to that module's first macro section).
- `moduleProgressShell()`'s "Continue to X" link
  (`portal/app.js:3885`, `.mnav-continue`) — already computes the correct
  next-incomplete destination generically, for any module.

**Correction to the original plan below: both were removed, not just the
per-module one.** The spec as originally written said keep
`.mnav-continue` since it's the one generic, always-correct resume
affordance. Live owner testing of Module 01 the same day asked for it to
go too, now that the rail's current-position highlight covers the same
job across all 12 modules — see Sprint 4.

What actually shipped: only 6 of the 12 modules had a per-module hero CTA
to remove (`.m0N-hero-action` in modules 01-04 and 08, `.m09-primary` in
09 — same pattern, different class name); modules 05, 06, 07, 10, 11 never
had one, and module 12's `.m12-hero-actions` is the simulator-launch
button, functionally different, left untouched. `.mnav-continue` was
removed once from the shared `moduleProgressShell()` in `portal/app.js`,
covering all 12 modules including the ones with no per-module CTA to
begin with. Verified the hero divs still read fine with the link gone —
the lede paragraph stands alone with no stray gap (confirmed live on
Module 01; the other 5 are the identical pattern and passed
`node bin/portal-check.js`'s 38/38 tag-balance check).

## Sprint 4 — collapse the Module 01 progress checklist (DONE, 2026-09-16, `7c59e22`)

New scope, added mid-session from live owner feedback testing Module 01 as
`4437023872-SOCAN`: the "Module progress checklist" section
(`soc-analyst-module-01.js`, `.m01-checklist`, right below the hero) lists
every lesson/lab with its own duration and status, always fully expanded,
plus a "Total instructional time" line — the owner called this out as
redundant now that the rail (Sprint 2) already lists the same items in a
persistent left pane, and asked for it nested/collapsed rather than always
taking up scroll space.

**Scope note: this section only exists in Module 01.** Checked all 12
module files for the same pattern (`grep -c 'm0N-checklist"'`) — modules
02-12 have no equivalent standalone checklist-with-durations section, so
there was nothing to change there.

What shipped: converted `.m01-checklist` to use the same
`.m01-section-collapsible` / `.m01-section-heading` / `.m01-section-collapse`
/ `.m01-section-body[hidden]` toggle pattern already used by every other
module section (foundations, flow, lifecycle, etc.) — no new CSS or click-
handler JS needed, since `wireModuleOneLab()`'s existing
`[data-m01-section-toggle]` delegation and the review-mode
`.m01-section-collapsible` sweep are both already generic over section
key. Added `checklist: false` to `MODULE_ONE_DEFAULT_STATE.sectionOpen`
(closed by default — the point was to stop it always showing). Kept the
existing "Module progress checklist" heading text rather than renaming it
to "Foundations" as the owner's shorthand suggested, since the section
also lists the two labs, not just the foundation lessons — flag this if
the owner meant the label literally, not just "make it collapse."

Verified live: DOM state confirmed via `javascript_tool` (section starts
`hidden`, toggle button starts `aria-expanded="false"`, clicking it flips
both and reveals the list) since screenshot capture was intermittently
timing out in this session's browser tooling (matches the pre-existing
"`resize_window` doesn't actually resize" flakiness noted elsewhere in
this doc's history) — a clean screenshot after the flakiness cleared also
confirmed the collapsed heading renders correctly above the rail/hero.

## Superseded scope note

- `soc-analyst-track-reimagining/STATE.md` and `portal/index.html`'s
  current uncommitted edits — per `HANDOFF.md`, another session's WIP.
  Don't revert, don't build on top of them, don't let an editor tool
  auto-format them incidentally.
- Arc A/B curriculum reconciliation — unrelated active workstream, see
  `NEXT_SESSION.md`.
- AI/ML module parity was a fast-follow for the original 2026-09-16 sprint;
  it is included in the completed 2026-09-20 shared-navigation sweep above.

## Verification before commit

- `node --check portal/app.js` and every touched module file.
- `node bin/portal-check.js` — expect 38/38 clean (matches the count from
  the 2026-09-16 session baseline).
- Live browser check via `bin/dev.sh start`, at minimum Module 01 (full
  walkthrough: rail visible, sticky, jump-to-lesson opens the right
  `<details>` and scrolls to it, narrow-viewport drawer toggle works) plus
  one spot-check module from later in the program (e.g. Module 08, the
  largest module, or Module 12, the capstone with `moduleTwelveUnlocked()`
  gating) to confirm the rail's completion logic doesn't fight the
  sequential-access gate added 2026-09-16
  (`hasModuleAccess()`/`canAccessModule`).
- Git hygiene: `portal/app.js` currently has unrelated uncommitted WIP from
  a concurrent session (M360 silent-render change, routing-loading-delay
  refactor). Isolate this sprint's hunks the same way the evidence-recall
  gating fix was isolated earlier today (`git show HEAD:portal/app.js` +
  patch + `git hash-object -w` + `git update-index --cacheinfo`, or
  `git add -p`) rather than committing the whole file. Do not push to
  `master` without explicit confirmation — push auto-deploys to the live
  GitHub Pages site.
