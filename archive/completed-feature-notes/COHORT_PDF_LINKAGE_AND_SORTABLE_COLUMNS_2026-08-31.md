# Cohort PDF linkage detail + sortable admin columns — 2026-08-31

Both items below started as `NEXT_SESSION.md` "planned, not started" sprint
entries from an earlier 2026-08-31 audit session; this session implemented,
verified live in-browser, and closed them out. Complete and verified —
archived per `archive/README.md`'s "When to archive a doc" rule.

## Cohort PDF: Student-to-Program Linkage Detail table

The audit found `evaluateReportingCompliance()`'s `student_program_linkage`
requirement counted `credential`, `enrollment_date`, `scheduled_start_date`,
and `completion_date` as dynamically available, but none of the four ever
printed anywhere in the rendered Cohort/Annual Progress Report PDF — so a
"covered"/"partial" badge had no visible backing evidence in the document.

User's choice (asked directly, not assumed): add the fields to the PDF
rather than downgrade the compliance claim. Implemented as a second, compact
`autoTable` — "Student-to-Program Linkage Detail" — appended after the main
student roster table on the landscape roster page in `renderCohortPdf()`
(`portal/app.js`), columns: Student ID, Credential, Enrollment Date,
Scheduled Start Date, Completion Date. `buildCohortReportData()`'s per-student
mapping was extended to carry `enrollmentDate`/`completionDate` through to
`cohortData.students` (they were already computed upstream in
`applyAdminDashboardState()`, just not passed through). Verified by
generating the PDF in-memory via the browser console
(`buildCohortReportData` + `renderCohortPdf`, no file download) and
confirming the new heading and all four column headers appear in the raw PDF
content stream (`doc.internal.pages`).

## Sortable admin table columns

All 8 admin dashboard table headers (Student ID, Track, Program, Enrollment,
Progress, Modules, Capstone, Last Active) are now clickable sort controls —
click to sort ascending, click again to reverse, with a ▲/▼ arrow indicator.
User confirmed a plain per-column sort was sufficient (disenrolled 0%-progress
rows naturally cluster at one end); no enrolled-first grouping was added.

Implementation, in `portal/app.js`:
- Module-scope `adminTableSort = { key, dir }` (declared just above
  `viewAdmin`) persists the active sort across `render()`'s full
  `app.innerHTML` rebuilds — the exact reset-on-render trap the original
  sprint note flagged (same class of bug as the pre-existing track-filter/
  hide-not-started weakness, which was *not* touched — out of scope, not
  asked for).
- `wireAdmin()` does the actual sort as a client-side DOM reorder
  (`tableBodyEl.appendChild` in sorted order) — no Supabase re-fetch, and no
  interference with the existing track-filter/hide-not-started `style.display`
  filtering, which runs after every sort via the existing `applyFilters()`.
- Null-safe comparator: capstone score and Last Active nulls always sort to
  one consistent end regardless of direction (never `new Date(null)`).
- `wireAdmin()` re-applies the persisted sort unconditionally on every call,
  so a full rebuild (enrollment toggle, planning-record save, re-poll)
  restores the user's last chosen sort instead of resetting to the default
  modules_complete/last_active order.

Verified live against the running dev server (port 8768) as real admin
`7355312413-ADMIN`: ascending/descending Student ID sort, Last Active
null-handling (4 dated rows first, all 76 blank rows consistently last in
both directions), sort survives a real `render()` re-fetch, and the track
filter still narrows correctly with a sort active. `node --check portal/app.js`
and `node bin/portal-check.js` both clean.
