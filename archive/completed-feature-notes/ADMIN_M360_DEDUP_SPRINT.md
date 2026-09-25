# Admin dashboard: dedupe M360 entry + compact Track Administration strip

Date: 2026-09-09. Small two-sprint fix requested by Alex against the live
admin dashboard (`#/admin`, `portal/app.js` + `portal/m360-entry.js`).

## Problem

The admin dashboard rendered **two** "M360 101 Administration" entry points:

1. A large banner (`portal/m360-entry.js`: `adminEntryMarkup()` /
   `ensureAdminEntry()`) client-side-inserted right after the "Student
   Progress" `<h1>`, before the tab bar even renders.
2. A card titled "M360 Administration" inside the **Track Administration**
   strip (`portal/app.js`: `adminTrackAdministrationStrip()`, the
   "Cross-track review" article), both linking to `m360/review.html`.

Alex: the top banner isn't necessary. Separately, the six Track
Administration cards (`All Students` / `SOC Analyst` / `IT Help Desk` /
`AI/ML` / `Electrical` / `M360 Administration`) are large vertical cards
(`min-h-52`, full paragraph + badge + full-width button each) that push the
actual student roster below the fold. Ask: shrink them into compact
banner/tile squares across the top so the roster is visible without much
scrolling, same idea as the existing compact tab bar (Student Progress /
Student Activity Monitor / Cohorts / Archived Students) just below.

## Sprint 1 — remove the duplicate top banner

**File:** `portal/m360-entry.js`. Delete the now-fully-dead admin banner
mechanism (only used for the redundant top banner — the strip card in
`app.js` remains the single M360 Administration entry point):

- Remove `const ADMIN_ENTRY_ID = 'm360-admin-entry';` (line ~30).
- Remove `findAdminHeadingBlock()` (~line 162-167).
- Remove `adminEntryMarkup()` (~line 199-212).
- Remove `ensureAdminEntry()` (~line 214-220).
- In `ensureEntry()`, replace:
  ```js
  if (user.isAdmin) {
    ensureAdminEntry();
    return;
  }
  ```
  with:
  ```js
  if (user.isAdmin) return;
  ```

Exit criteria: `grep -n "ADMIN_ENTRY_ID\|ensureAdminEntry\|adminEntryMarkup\|findAdminHeadingBlock" portal/m360-entry.js` returns nothing. `git status --short` touches only `portal/m360-entry.js`.

**Status: done** — commit `1108700`.

## Sprint 2 — compact the Track Administration strip into banner tiles

**File:** `portal/app.js`, function `adminTrackAdministrationStrip()`
(~line 720-739). Replace the six `min-h-52` vertical cards with compact,
single-row banner tiles (title + count + chevron, no paragraph body, no
full-width button) so the section's height drops from ~230px to ~60px.
Full replacement function supplied inline in the Sprint 2 agent prompt —
implementing agent pastes it verbatim, no invention.

Exit criteria: `grep -n "min-h-52" portal/app.js` returns nothing (old
cards gone). The six links (`#/admin`, `#/admin/track/SOCAN`,
`#/admin/track/HDESK`, `#/admin/track/AIENG`, `#/admin/track/ELECT`,
`m360/review.html`) are all still present in the new markup. `git status
--short` touches only `portal/app.js`.

**Status: done** — commit `958f386`.

## Verification (both sprints)

- `node --check portal/app.js` and `node --check portal/m360-entry.js`
  (syntax only — no bundler in this repo).
- `git diff` read in full against the specified diffs above.
- Live check in Chrome: sign in as ADMIN, confirm exactly one "M360
  Administration" entry point remains, and the Track Administration strip
  renders as a compact row with the roster visible with less scrolling.
  **Not done this session** — Claude-in-Chrome extension was disconnected;
  code-level verification (diff review + `node --check`) stood in for it.
  Next session: `./bin/dev.sh start`, sign in with an ADMIN account from
  `bin/.roster-output/ADMIN-*.csv`, open `#/admin`, eyeball it.
- Push to `master`, confirm GitHub Pages workflow run succeeds (this repo
  auto-deploys on push, no manual step). **Done** — rebased onto
  `origin/master`'s concurrent commits (9c4a340, disjoint file regions,
  clean rebase) and pushed as `1108700`/`958f386`.
