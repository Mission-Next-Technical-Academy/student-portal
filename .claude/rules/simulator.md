---
paths:
  - "ui/**"
  - "portal/imported-labs/**"
  - "portal/range-tools/**"
---

# Simulator and imported labs

Updated 2026-11-14. Navigation source of truth: `docs/NAV_SPEC.md`.
Imported labs: `portal/imported-labs/mission-next-labs/WORKFLOW.md`.

## All simulators

- Never copy or closely reproduce proprietary Microsoft HTML, CSS or JavaScript.
- Keep all incidents, users, devices and indicators fictional and harmless.
- Never connect a simulator to a real tenant, API or cloud service.
- Never download, embed, run or link to live malware; use synthetic artifacts.
- Never rename `defender-lab.*` storage keys; it erases saved learner state.
- Use stable fixture IDs so rows, panels and saved selections agree.

## `ui/` simulator

- Keep `ui/index.html` script order; most files share browser globals.
- Register each screen as `VIEWS['workload/route']` in `ui/views.js`.
- Put fixtures and `NAV` in `ui/data.js`; every nav route needs a `VIEWS` entry.
- Read `docs/NAV_SPEC.md` before changing navigation.
- After a nav edit, run `node bin/render_all.js` and expect zero dead routes.

## Imported labs

- Use click-based interactions only in the training UI.
- Keep hash routing unless the dev server gains an `index.html` fallback.
- Run `npm run check` in `portal/imported-labs/mission-next-labs/`.
