---
paths:
  - "portal/**/*.js"
  - "portal/**/*.css"
  - "portal/**/*.html"
  - "ui/**/*.js"
  - "ui/**/*.css"
  - "ui/**/*.html"
---

# UI and frontend rules

Updated 2026-11-14. Layout contract: `docs/specs/MODULE_STANDARD.md` §7.
Tokens and component recipes: `docs/MNT_DESIGN_TOKENS.md`.

## Academy shell

- Module 1 is the visual and interaction reference for every module.
- Use the shared `moduleTopbar` and left rail as the only Learn/Practice/Prove navigator.
- Never add a second phase rail, phase tabs or duplicate stage labels.
- Simulator-local controls may only work with that simulator's data.
- Use the locked components in `MODULE_STANDARD.md` §7 (cards, ITSM ticket, Console Guide, Learn It).
- Follow the Module 2 console guide for every floating guide card.

## Shared code

- Scope CSS to a component or track class; never use broad selectors.
- Search every UI file before renaming a global function; inline handlers call them.
- Keep the established script load order in `ui/index.html` and `portal/index.html`.
- Never add a display utility (`inline-flex`, `block`) next to `hidden`; it overrides it.

## Content and labels

- Follow `docs/MNT_DESIGN_TOKENS.md`; the live site wins on naming.
- Never state certification endorsement, partnership or a pass guarantee.
- Base status labels on established LMS models (Canvas, Moodle, Blackboard).

## Checks

- Check changed layouts at 1,280 px and 1,512 px wide.
- Check the browser console for errors on every changed page.
- Check keyboard activation for interactive rows and buttons.
- Check that saved state survives a reload when it should.
