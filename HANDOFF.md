# Engineering handoff index

For active direction, start with `ROADMAP.md`, then the governing
specification for its selected work item. This file records concise evidence
for that active item only; move finished entries to `archive/session-logs/`
or a focused completed-feature note. `NEXT_SESSION.md` is a compatibility
pointer and must not become a second task queue.

The prior chronological engineering handoff is preserved at
`archive/session-logs/HANDOFF_THROUGH_2026-09-10.md`.

## Current baseline — 2026-09-20

- `ROADMAP.md` is the canonical delivery queue.
- Module 1 begins with the required LMS orientation tour; the subsequent
  assessment is simulator-first and instructor-reviewable.
- The next substantive build is the Module 1 performance assessment after
  orientation verification and controlled faculty-gate UAT.
- Arc A (Modules 02 → 03) remains queued curriculum work; Arc B is undecided
  and the old 07 → 04 proposal must not be built.
- CI validation is `bash bin/ci-check.sh`; GitHub Pages repeats it before
  deployment.
