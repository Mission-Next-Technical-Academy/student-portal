---
paths:
  - "docs/**"
  - "archive/**"
  - "ROADMAP.md"
  - "README.md"
  - "CONTRIBUTING.md"
---

# Docs, roadmap and handoffs

Updated 2026-11-14. Archive policy: `archive/README.md`.

## Writing docs

- Write short, plain-language, imperative docs.
- Date every change to a doc or tracker.
- Never put secrets, credentials or real student details in a doc.
- Record only facts you verified; say how you verified them.
- When a historical doc conflicts with `ROADMAP.md`, fix the historical doc.

## Lifecycle

- When every task in a doc is done and verified, `git mv` it into `archive/`.
- Never delete a doc; archiving keeps history.
- Never archive a doc that still has open work.
- Move finished `NEXT_SESSION.md` entries into `archive/session-logs/`.

## Handoffs

- Add new `docs/handoffs/NEXT_SESSION.md` entries at the top, newest first.
- Lead each entry with date, author, PR and files touched (name shared ones).
- Cover only your changes and how they affect other owners.
- Never edit, reorder or drop another person's entry.
- Update `ROADMAP.md` state only after that item's definition of done is met.
