# Module 3 Mission Next Lab Return and Completion

## Scope

This slice is intentionally limited to the completed Module 3 launch wiring and
the shared imported-lab runtime it uses. Modules 1, 2, 4, and the remaining
modules are left untouched while Claude continues their wiring.

## Changes

- Module 3 uses the learner-facing `imported-labs/mission-next-labs/` alias;
  the legacy folder remains available only for other modules’ in-progress
  wiring.
- Each Module 3 link carries an encoded return route for
  `/#/program/soc-analyst/module/3`.
- The lab Back action honors that return route; without it, the existing lab
  catalog fallback remains unchanged.
- The lab runtime writes a small `mission_next_lab_completion` local-storage
  record only after every required lab step is verified.
- Module 3 reads that record for the current student and enables the assessment
  write-up only after the ELK lab is actually complete.
- Visible lab branding is Mission Next, and the active lab player no longer
  exposes a GitHub source link.

## Validation

Run from the repository root:

```bash
node --check portal/soc-analyst-module-03.js
node --check portal/imported-labs/boots2bytes/src/app.jsx
node --check portal/imported-labs/boots2bytes/src/systems/labPlayer.jsx
```

Browser acceptance path:

1. Open Module 3 and launch the ELK lab.
2. Confirm it remains in the same tab.
3. Complete every required step.
4. Confirm the lab shows the Mission Next completion status.
5. Click Back and confirm the URL is
   `http://localhost:8768/#/program/soc-analyst/module/3`.
6. Confirm Module 3 shows the lab complete and enables the assessment submit
   action.
