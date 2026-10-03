# Console Guide and SIEM View: Scroll and Centering Action Plan

**Status:** Proposed implementation plan  
**Date:** 2026-10-03  
**Scope:** SOC Analyst course, Guided Lab and console walkthrough experiences across modules 01–12

## User experience goal

When a learner clicks an item or advances the console guide, the relevant SIEM
evidence and guide should come into view together. Keep the active console view
visually centered and readable, minimize page-level scrolling, and make the
guide follow the selected evidence as it changes. The learner should not need
to hunt for a control or scroll back and forth between the guide and the console.

The guide should stay in a predictable position relative to the active evidence
while scrolling within the console. When the evidence is outside the visible
area, smoothly reveal it and the guide together. Preserve keyboard focus and
reduced-motion preferences. Keep the SIEM workspace clean by avoiding a guide
that covers the selected evidence or consumes most of a small viewport.

## Initial code review

- The shared placement helper is `portal/console-guide.js`:
  `consoleGuidePosition()` positions the floating card relative to a target
  inside the workspace and adds a highlight. It currently changes the card's
  absolute `top` and `left`, but does not scroll the page or a nested console
  scroller to keep the target in view.
- The SOC M03 SIEM Guided Lab renders the shared card and repositions it after
  several renders in `portal/soc-analyst-module-03-environment.js`. Its target
  currently resolves to the selected item or the whole active view. The helper
  does not center that target, and some views have no selected item, which can
  leave the card following a broad container instead of the exact control or
  evidence row.
- M04–M11 call the shared helper with `target = null`; the helper then guesses
  from selected evidence or a view heading. This gives the course a common
  placement baseline, but not a guarantee that the selected target is centered
  or kept visible while the student scrolls.
- M02 supplies a selected item where possible; M01 has its own root and target
  handling. M12 is a capstone rather than a guided lab. These need explicit
  audit paths instead of assuming the M03 behavior applies unchanged.
- The shared guide card is allowed to scroll internally when tall
  (`portal/module-labs.css`), so a small viewport can show a clipped guide and
  evidence at once. The course standard is documented in
  `docs/specs/MODULE_STANDARD.md` §7.3 and the completed guided-lab sweep is in
  `docs/workstreams/CONSOLE_GUIDE_GUIDED_LAB_SWEEP.md`.

These are implementation findings from source review, not a claim that every
module has been checked at every viewport size. The sprint audit below makes
that course-wide validation explicit.

## Proposed interaction rules

1. **Follow the current guide step.** Each guide step declares a stable target
   selector or target resolver. After a step, tab, selection, or guide state
   change, resolve the target again and position the guide against it.
2. **Keep the target visible.** If the target is outside the visible region,
   scroll the nearest relevant scroll container just enough to reveal it. Use
   centered alignment where space allows; account for sticky headers and the
   guide card's footprint.
3. **Keep evidence and guide together.** Position the guide near the target
   within the console workspace. If there is not enough room beside or above
   the target, use a compact anchored placement that does not obscure the
   target, rather than pushing the learner through repeated page scrolls.
4. **Make selection navigation follow.** Clicking a tab, row, node, or other
   course console item should reveal that item and retain a useful centered
   context. Do not steal keyboard focus from the control that the learner
   activated.
5. **Respect viewport and accessibility settings.** Reposition on resize and
   console scroll; avoid scroll loops; support keyboard navigation and
   `prefers-reduced-motion`; keep focus indicators and accessible labels.
6. **Preserve guide progression rules.** Scrolling and positioning must not
   gate Next, change completion, or alter saved learner progress.

## Sprint plan

### Sprint 1 — Course audit and interaction spec

**Outcome:** A complete inventory of guide targets, scroll containers, and
viewport problems, with the behavior contract agreed in code comments and the
module standard.

- Inventory M01–M12 Learn It, Guided Lab, and other console guide instances.
- Trace each guide step through render, click, tab-switch, row selection, and
  collapse/expand paths; identify whether scrolling belongs to the document or
  an inner console panel.
- Inspect desktop, tablet, and narrow/mobile layouts, including sticky headers
  and long guide content.
- Identify missing or ambiguous per-step evidence targets, especially in M03
  and modules relying on the shared fallback selector.
- Update the relevant section of `MODULE_STANDARD.md` with the centered,
  target-following behavior and an exception process for dense views.

**Exit criteria:** All 12 modules have an audit entry; each guide action has an
expected target and scroll container; accessibility and reduced-motion cases
are specified.

### Sprint 2 — Shared positioning and scroll behavior

**Outcome:** One shared guide experience that centers the active evidence and
keeps the card anchored to it without jumpy or excessive scrolling.

- Extend `portal/console-guide.js` with a reusable target resolver and a
  nearest-scroll-container visibility/centering helper.
- Reposition after layout settles, after console interactions, and on relevant
  resize/scroll events; clean up listeners when the console view is replaced.
- Prevent scroll feedback loops and avoid moving the page when an inner panel
  can reveal the target.
- Add compact placement behavior when guide and target cannot fit together;
  retain the current shared visual style and evidence highlight.
- Handle guide docking and collapsed state without stale coordinates.

**Exit criteria:** Shared behavior works with a declared target, an absent
target fallback, a long guide card, nested scrolling, and narrow viewports.

### Sprint 3 — Module adoption, beginning with M03

**Outcome:** Every module's guide follows the intended console evidence; M03's
Next explanation consistently centers the relevant SIEM content.

- M03 first: map each guide step to its SIEM evidence target, including
  selection changes, query editor/results, timeline, entities, and ITSM ticket
  views. Ensure Next recalculates placement after the new view renders.
- Apply the shared contract across M01–M11, replacing broad or stale fallback
  targets where specific evidence is available.
- Review M12 navigation and capstone panels for matching selection-following
  behavior, without introducing a new guide flow.
- Keep per-module code limited to target mapping and view-specific exceptions;
  do not duplicate shared scroll math.

**Exit criteria:** No module's guide remains stationary while its active target
changes; every module has an explicit target or documented reason to use the
shared fallback.

### Sprint 4 — Course-wide verification and tuning

**Outcome:** Verified centered reading flow across common learner devices and
the complete SOC course.

- Exercise Next explanation, item clicks, tab changes, deep links, guide
  collapse/expand, completion, restart, and returning to prior steps.
- Check page scroll versus nested workspace scroll; ensure only the intended
  container moves and the target remains visible with the card.
- Check keyboard-only navigation, focus retention, screen reader labels,
  reduced motion, and zoom/text scaling.
- Tune target margins, card width/max-height, and compact positioning based on
  actual module content rather than global arbitrary offsets.
- Record exceptions and outcomes in the course action log; update the shared
  module standard and console-guide sweep document.

**Exit criteria:** All SOC modules pass the interaction matrix at desktop and
narrow viewport sizes; no target is hidden under the guide or sticky chrome;
scrolling is limited to the relevant container.

## Suggested sub-agent work split

These are parallel review/implementation work packages for the sprint owner to
assign. Keep shared helper changes coordinated through one integrator.

| Work package | Modules / files | Responsibility | Deliverable |
|---|---|---|---|
| A — Shared behavior owner | `portal/console-guide.js`, shared styles in `portal/module-labs.css` | Implement target resolution, scroll containment, centered visibility, responsive placement, and cleanup. | Shared helper change and interaction notes |
| B — SIEM M03 specialist | `portal/soc-analyst-module-03-environment.js`, M03 styles | Map every guide step to its evidence target; validate Next explanation, tab changes, and selected records. | M03 target map and adopted behavior |
| C — Module audit, M01–M06 | SOC module 01–06 scripts/styles | Inventory target and scroll behavior; provide concrete module-specific mappings and exceptions. | Audit matrix and module patches |
| D — Module audit, M07–M12 | SOC module 07–12 scripts/styles | Inventory target and scroll behavior; assess capstone navigation and exceptions. | Audit matrix and module patches |
| E — Accessibility and viewport review | Shared UI plus representative M01, M03, M06, M09, M12 | Review keyboard/focus, reduced motion, zoom, nested scroll, and narrow viewport behavior. | Repro steps and acceptance results |

The Sprint 1 audit can run as parallel reviews (B, C, D, E). Sprint 2 should
have one owner for the shared helper (A); module specialists can prepare target
maps in parallel. Merge adoption by module batches in Sprint 3, then have a
reviewer other than the implementer execute Sprint 4's matrix.

## Course-wide acceptance matrix

| Check | Expected result |
|---|---|
| Click a guide's Next explanation | New step's target and guide are in view together; target is centered when the viewport allows. |
| Click a console item or evidence row | The selected item is revealed and highlighted without requiring manual page hunting. |
| Switch console tabs | The new view's relevant target is followed after rendering; no stale position remains. |
| Scroll inside the console | Guide remains anchored to the active target or repositions predictably; the document does not jump unexpectedly. |
| Collapse or reopen guide | The console remains at the current target and the guide returns to a useful anchored location. |
| Small viewport or zoom | Guide remains readable, evidence is not obscured, and scrolling stays limited. |
| Keyboard and reduced motion | Focus stays on the activated control; transitions honor reduced-motion settings. |
| Complete or restart a lab | Existing progress and completion behavior remain intact; positioning adds no gate. |

## Dependencies and implementation risks

- Module consoles use different markup and may contain nested scroll regions;
  audit actual containers before choosing a universal scrolling target.
- Some evidence elements are rebuilt on render. Targets must be resolved after
  the new DOM is mounted, not cached across renders.
- A floating guide can cover evidence in narrow layouts. The compact placement
  rule needs real viewport review before values are finalized.
- Existing module standard language describes floating beside evidence and
  returning to the console banner. Update it with the new centering rule so
  subsequent module work follows one contract.

## Files likely to change

- `portal/console-guide.js`
- `portal/module-labs.css`
- `portal/soc-analyst-module-01.js` through `portal/soc-analyst-module-11.js`
  and relevant module styles, with M03 first
- `docs/specs/MODULE_STANDARD.md`
- `docs/workstreams/CONSOLE_GUIDE_GUIDED_LAB_SWEEP.md`
- A focused interaction check covering the course-wide acceptance matrix
