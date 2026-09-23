# Mission Next Handoff

Use this file to rehydrate context quickly in a new Codex session or when spawning more agents.

## Current Focus

- The app is a static React + Tailwind training UI served from `index.html`.
- `lap-4` now opens a Kibana-style ELK training lab with a guided tour overlay.
- `ad-2` now opens a Windows-like Active Directory workstation with desktop shortcuts and right-click menus.

## Key Files

- [`src/module-page.jsx`](./src/module-page.jsx)
- [`src/lab-shells.jsx`](./src/lab-shells.jsx)
- [`src/enterprise-components.jsx`](./src/enterprise-components.jsx)
- [`src/data.js`](./src/data.js)
- [`index.html`](./index.html)

## Important Routes

- `http://127.0.0.1:5173/#/track/log-analysis/project/lap-4/lab`
- `http://127.0.0.1:5173/#/track/active-directory/project/ad-2/lab`

## What Was Changed Recently

- `lap-4` was replaced with a 5-screen ELK walkthrough:
  - Elasticsearch Status
  - Logstash Pipeline
  - Data Ingestion
  - Index Pattern Setup
  - Discover Page
- The ELK lab includes a floating slide-style tour.
- `ad-2` was reworked into a Windows desktop-style Active Directory UI.
- `EnterpriseTreeView` now supports `onNodeContextMenu` for OU right-click actions.

## Good Next Agent Targets

- Tighten the ELK tour animations and callouts.
- Add more Windows-authentic affordances to the AD shell, like a more MMC-like tree and property dialogs.
- Convert remaining generic catalog-style labs into purpose-built local simulations.

## Validation

- `npm run check`

## Notes

- If a future agent needs the fastest context, point it here first, then inspect `src/module-page.jsx` and `src/lab-shells.jsx`.
- Keep using click-based interactions only for the training UI.
