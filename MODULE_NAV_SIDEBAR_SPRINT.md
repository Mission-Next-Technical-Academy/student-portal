# Module quick-nav rail + duration copy — sprint spec

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

## Sprint 3 — remove the now-redundant CTAs (do this last, after Sprint 2 works)

Once the rail exists and highlights current position, two existing buttons
duplicate what it already does and duplicate each other:

- The hero's own "Begin with the foundations" link
  (`soc-analyst-module-01.js:789`, `.m01-hero-action`, one per module file,
  each hardcoded to jump straight to that module's first macro section).
- `moduleProgressShell()`'s "Continue to X" link
  (`portal/app.js:3885`, `.mnav-continue`) — already computes the correct
  next-incomplete destination generically, for any module.

Once the rail's current-position highlight ships, remove the per-module
hero CTA (`.m01-hero-action` and its 12 per-file equivalents) and keep only
the shared `.mnav-continue` link plus the rail. Do not remove
`.mnav-continue` — it's the one generic, always-correct "resume" affordance
and the rail complements it rather than replacing it. Verify the hero
section still reads fine with that link gone (it may need the lede
paragraph to stand alone, or the CTA slot repurposed — use judgment, this
is a copy/layout detail, not a functional one).

## Out of scope / do not touch

- `soc-analyst-track-reimagining/STATE.md` and `portal/index.html`'s
  current uncommitted edits — per `HANDOFF.md`, another session's WIP.
  Don't revert, don't build on top of them, don't let an editor tool
  auto-format them incidentally.
- Arc A/B curriculum reconciliation — unrelated active workstream, see
  `NEXT_SESSION.md`.
- AI/ML module parity — fast-follow, not this sprint.

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
