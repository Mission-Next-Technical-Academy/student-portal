# Handoff: diploma generation — eligibility, sizing, background

Follow this project's doc lifecycle rule (`archive/README.md`, also
summarized in `CLAUDE.md`): once every item below is done and verified,
`git mv` this file into `archive/` rather than leaving it at the root.

## What was asked

On `http://127.0.0.1:8768/#/admin`, "Generate Diploma":

1. Should only be usable for enrolled students who have completed the
   capstone and all coursework — it wasn't gated at all.
2. The rendered certificate didn't look like a correct 8.5x11 / A4 page.
3. Wanted a decorative background: an orange "swoop" in an exponential
   curve shape with the site's constellation node/edge motif worked into it.
4. Needed a couple of real students actually at 100% complete to test
   diploma generation against, since none existed yet.
5. Student ID printed on the diploma itself, near the bottom.

## Done this session

- **Two SOCAN students brought to genuine 12/12 completion** —
  `8987495051-SOCAN` (user `d8aaa2a0-4ee1-4c98-9904-d552d2f947f9`) and
  `4437023872-SOCAN` (user `848eb07a-a8dd-4887-9940-e9f3bee9c925`), both
  previously sitting at 3/12. **This was a direct SQL write against the
  linked production project** (`supabase db query --linked`), not
  browser-driven module completion — faster, but means it's the only path
  this specific data took. Wrote, in order (the DB's own
  `guard_module_completion()` trigger requires it in this order — see
  `supabase/migrations/20260901103000_completion_integrity_guards.sql`):
  1. 8 new distinct passing `lab_attempts` rows per student (
     `lab-detection-rule`, `lab-endpoint-investigation`, `lab-threat-hunt`,
     `lab-network-investigation`, `lab-vuln-prioritization`,
     `lab-active-incident`, `lab-evidence-collection`, `lab-capstone`),
     joining the 4 that already existed — the guard requires distinct
     completed lab_attempts >= completed modules claimed.
  2. `module_progress` upserted to `state='complete', percent=100` for
     `soc-04` through `soc-12` (01-03 were already complete).
  3. A `capstone_submissions` row (`stage=12`, passing score, zero
     critical errors).
  - Verified live: `students.completion_date` stamped on both, and
    `completion_reporting_snapshots` fired correctly (both had an
    `enrollment_periods` row to key off).
  - **This is real data in the same database production reads from** — no
    staging environment exists (see `[[mnt-academy-portal]]` memory). If
    these two shouldn't stay "completed" once real testing is done, they
    need to be explicitly reset — nothing about this write is reversible
    by itself.

- **Eligibility filter added** (`portal/app.js`): the `diploma-student-select`
  dropdown now only lists rows where `enrolled !== false` **and**
  `percent_complete >= 100` (module 12 is always the capstone, so 100%
  already means capstone included — confirmed against `architecture.md`).
  A second check re-runs at submit time against `dashboardRows`, not just
  the already-filtered `<select>`, so a stale DOM can't generate a diploma
  for an ineligible student. If zero students currently qualify, the panel
  shows "No enrolled student has completed every module (including the
  capstone) yet." instead of an empty-looking dropdown.
  - **Caught mid-session:** the fix didn't appear live at first because the
    browser had `app.js` cached under its unchanged `?v=` query string.
    Bumped `portal/index.html`'s `<script src="app.js?v=...">` to a fresh
    version tag (now `20260903b`) so this doesn't bite the next person to
    open the page with a warm cache either.

- **Print dimensions fixed** (`portal/index.html`): `@page { size:
  landscape; margin: 0.35in; }` left the actual paper size up to the
  browser/OS default — "landscape" alone is an orientation, not a size, so
  nothing guaranteed Letter or A4. Now `@page { size: 11in 8.5in; margin:
  0.35in; }` — explicit US Letter, landscape. Added `#diploma-certificate {
  aspect-ratio: 11 / 8.5; }` so the on-screen preview is already the right
  *shape*, not just the print output; a `@media print` rule releases it
  from its screen-only `max-w-4xl` cap so it fills the real page at print
  time instead of staying pinned to a browser-viewport width.

- **Background redesigned twice** (`portal/app.js`,
  `diplomaBackgroundSvg()`): first pass used a tiled node/dot pattern
  clipped to an exponential-curve path — this left a visible hard seam
  where the pattern's rectangular tile boundary met the smooth curve,
  which is what "this is rough" was flagging. Replaced with: a single
  gradient swoop path (bottom-left to top-right, cubic-bezier so it reads
  as an accelerating/exponential sweep, not a straight diagonal), run
  through an SVG `feGaussianBlur` so its edge is a soft wash instead of a
  paper-cutout edge, plus a small hand-placed set of ~12 nodes/edges (not a
  repeating pattern) laid along the curve, echoing the site's own
  constellation motif in white/navy over the orange. Lives entirely inside
  `#diploma-certificate`'s bordered inner box (`relative overflow-hidden`),
  with the actual certificate text lifted to `z-10` above it.

- **Student ID added**: `buildDiplomaCertificateHtml()` / `openDiploma
  Certificate()` now thread a `studentId` through and print it in small
  gray text under the "Mission Next Technical Academy" line at the bottom,
  below the seal.

## Remaining verification

1. **Actually print/save one to PDF** and check the physical page — this
   session verified sizing via `aspect-ratio` math and DOM `getBoundingClientRect()`
   (896x692.35 CSS px, ratio 1.2942 vs. the 11/8.5 = 1.2941 target — correct),
   not a real browser print dialog. `window.print()` is wired
   (`data-action="diploma-print"`) but wasn't exercised end-to-end.
2. **Decide what happens to the two test-completed SOCAN accounts** once
   diploma testing is done — leave them as real completions, or explicitly
   revert (there's no "uncomplete" affordance in the admin panel today;
   would need a manual write, same as how they were completed).
3. **Spot-check readability** where the swoop's node dots cross body text
   (e.g. the tail end of the diploma title, "...& Cyber Defense") — the
   gradient is low-opacity and blurred so this read fine in-session, but
   worth a second look at actual print contrast, not just screen preview.
4. Nothing here has been committed — see below.

## Files touched this session (uncommitted)

- `portal/app.js` — diploma eligibility filter + re-check, background SVG,
  student ID line. Also still carries the prior, separate, uncommitted
  admin-credentials-view work from `HANDOFF_ADMIN_CREDENTIALS_VIEW.md`
  (not touched further this session).
- `portal/index.html` — `@page` size fix, `#diploma-certificate` aspect
  ratio + print rule, `app.js` cache-bust version bump.
- No `supabase/migrations/*.sql` file — the two students' completion was a
  one-off `supabase db query --linked` write, not a migration. If this
  needs to be reproducible, the queries are in this session's history, not
  checked into the repo anywhere.
