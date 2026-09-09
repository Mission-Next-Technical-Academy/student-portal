# Admin master-roster scope sprint

## Objective

Keep `#/admin` as the cross-track management dashboard. The detailed
student-program-progress cards and their student-detail drill-down must appear
only after an administrator selects a specific track (`#/admin/track/:code`).

## Required master-roster content

The All Students workspace retains its existing management controls and roster:

- account summary tiles and average progress;
- track filter, not-started filter, student/cohort creation, enrollment
  planning, diploma, report, and progress-file controls;
- the cross-track student table; and
- the existing Student Detail selector at the bottom.

It must not render the `Student program progress` card collection or its
per-card `View details` buttons.

## Required track-workspace content

Each selected track retains its track summary and shows only that track's
student-program-progress cards. Those cards retain their `View details`
behavior and the Student Detail selector is scoped to students in that track.

## Sprint 1 — implementation

- [x] Gate the card collection on `activeTrackCode`.
- [x] Scope the detail selector and its backing rows to the active track.
- [x] Preserve the master roster’s table and management controls.

## Sprint 2 — verification

- [x] Syntax-check `portal/app.js` and run whitespace checks.
- [x] Confirm the rendered template gates cards, card buttons, and detail
  selector options on the selected-track state.
- [x] Review unrelated working-tree changes and exclude them from this sprint.

## Completion record

Completed 2026-09-09. The pre-existing route-loading work in `portal/app.js`,
the `portal/index.html` cache-version change, and the deleted temporary Office
lock file were reviewed and intentionally left untouched.
