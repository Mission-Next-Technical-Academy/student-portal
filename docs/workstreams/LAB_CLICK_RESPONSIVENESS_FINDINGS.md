# Guided and Assessment Lab Click Responsiveness — Findings

> **Next AI — start here (2026-10-03, implementation pass).** Findings 1–5 are
> addressed in the working tree (uncommitted — another session shares the tree;
> check `git diff` overlap before committing). Status per finding and the
> follow-on Console Guide work are in **Implementation status** at the bottom.

**Date:** 2026-10-03  
**Scope reviewed:** SOC Analyst course modules 01–12, shared portal navigation and lab routing, plus imported Mission Next lab launch wiring.  
**Method:** Static source trace. No code or learner data was changed; this review did not reproduce the reported behavior in a live browser.

## Findings

### 1. The most likely shared “click does nothing” cause is an intentional navigation lock

The unified module navigation marks every incomplete row after the first incomplete row as locked. This applies to lessons, Guided Labs, and Assessment Labs. In `moduleUnifiedNav()` (`portal/app.js`, around lines 4700–4770), locked anchors get `aria-disabled="true"`; `wireModuleQuickNavRail()` returns immediately on click for such anchors (around lines 7483–7501). The links have no visible explanation at the point of click beyond a title tooltip, and the handler does not announce why it ignored the click.

This means a learner can click a Guided Lab or Assessment Lab row in the rail and see no movement until all preceding rows are complete. It is deliberate sequencing behavior, but it directly matches the reported symptom. It affects every module using the shared rail, so it is course-wide.

**Needed work:** Decide whether labs should be directly reachable before earlier lessons are complete. If yes, make lab rows exempt from sequential locking while retaining any assessment submission/progress rules. If sequencing must remain, show an inline, keyboard-accessible explanation (“Complete [current item] first”) and provide a visible focus/disabled state; do not rely on a title tooltip. Keep `aria-disabled` and click behavior in sync.

### 2. The module rail and the actual lab disclosure are separate controls

Most modules render labs in native `<details><summary>` disclosures. Clicking the lab heading expands or collapses the body; it does not itself launch a separate page. M01 has explicit section-toggle buttons and hides/shows the lab body. M02 Guided Lab is rendered inline and open in its environment. M03–M11 use disclosure panels, with per-module markup differences. M12 is the independent capstone assessment rather than a Guided Lab.

The navigation rows point at the section heading IDs, then `revealCourseCardTarget()` opens collapsed `<details>` ancestors before scrolling. This path appears wired in source. If the learner clicks a rail row and expects an external lab launch, that expectation does not match the current interaction model.

**Needed work:** Make the interaction affordance consistent and explicit: the rail should reveal and scroll to the section; the section summary should expand/collapse; interactive lab controls should be inside the revealed body. Audit M01’s custom toggle against native disclosures and ensure a click on the heading, chevron, or rail row has a clear result.

### 3. Lab rail entries can become locked because the completion model is broader than lab readiness

The shared lock algorithm infers lock state from row order and `isComplete`; it does not distinguish a lab from a lesson or define a separate readiness policy. Several modules derive lab completion from submissions, remote verification, or legacy state, while assessments may remain incomplete until instructor review. Consequently the navigation availability may change based on state migration or review status, even when the lab itself is usable.

**Needed work:** Replace the implicit “all earlier rows complete” rule with a deliberate policy per row type. In particular, keep instructor grading/review status separate from whether a student can open or resume an assessment. Add coverage for fresh learner, in-progress learner, previously completed/legacy learner, and returned-for-remediation states.

### 4. There is no single lab click handler to explain failures inside the lab body

M01–M11 wire their own Guided and Assessment Lab actions in module-specific functions; M02’s console is in `soc-analyst-module-02-environment.js`, and M12 uses its capstone handlers. The portal route `#/program/<slug>/module/<n>/lab/<slug>` only covers imported projects and is separate from inline SOC Guided/Assessment Labs (`portal/app.js`, around lines 4160–4200 and 7040–7060). A handler failure in one module can therefore be local to that module or its re-render path rather than a shared route failure.

**Needed work:** Capture the exact clicked control and browser console error for each report. Audit each lab’s delegated event root, re-rendered controls, and script load order. Check that rerendering does not replace a node whose listener was attached directly, and that no earlier runtime exception prevents the module’s wire function from running. Prioritize the `wireModule*GuidedLab()` and `wireModule*AssessmentLab()` functions in modules where the body opens but its buttons do not respond.

### 5. Imported project labs have a separate fragile link-to-route conversion

`missionNextLabPortalHref()` only rewrites hrefs matching its expected imported-lab fragment shape and only when the current hash is a program route. `missionNextLabAppRoute()` recognizes a fixed set of slug prefixes. A lab href outside those patterns falls back to the original href rather than reporting a missing mapping (`portal/app.js`, around lines 4160–4191). This affects supplemental/required imported labs, not the inline core Guided/Assessment Labs.

**Needed work:** Inventory each module’s imported lab href against both slug parsers and confirm every generated route resolves to a registered project. Fail visibly for an unsupported slug rather than silently returning a possibly nonfunctional path.

## Course coverage notes

| Modules | Entry behavior found in source | Review note |
|---|---|---|
| M01 | Custom expand/collapse controls; Guided and Assessment content inline | Uses a different toggle implementation from the native disclosures used elsewhere. |
| M02 | Guided console inline; Assessment case inline | Guided Lab is the console walkthrough; Assessment Lab is the HR authorization case per the owner amendment. |
| M03–M11 | Guided and Assessment panels generally use native `<details>/<summary>` | Lab actions are module-specific; inspect exact action/control if the panel opens but interaction fails. |
| M12 | Capstone Assessment section; no Guided Lab | Assessment is an integrated capstone flow, not the same inline case-console pattern. |
| SOC M02 supplemental project links | Imported project route/iframe | Separate route conversion path; not evidence of a core Guided/Assessment lab defect. |

The older `docs/workstreams/CONSOLE_GUIDE_GUIDED_LAB_SWEEP.md` records a prior interaction audit, but it does not verify this current report’s “click does nothing” symptom. Treat it as design history, not current runtime proof.

## Recommended fix and verification order

1. Reproduce the issue on a learner account and record module, exact control, viewport, current section completion state, and console errors.
2. Fix the shared rail lock affordance/policy first, since it can silently block lab entry across modules.
3. For any lab that opens but has dead controls, fix that module’s event wiring or render lifecycle; do not change the shared route unless the failure is specifically an imported project link.
4. Walk all 12 modules from a fresh account and an in-progress account: open Guided Lab and Assessment Lab from both the rail and section heading; operate one primary control; navigate away/back; reload and resume.
5. Verify locked states are explained, links that are available reveal the section, and no assessment is blocked just because faculty review is pending.

## Confidence and limitation

The sequential nav lock is a confirmed behavior in source and is the strongest shared explanation for unresponsive lab-row clicks. The source alone does not establish which specific clicks the learner made or whether any module-specific runtime error is also present. Exact reproduction is required before attributing failures inside an opened lab body to a particular handler.

## Implementation status (2026-10-03)

| Finding | Status | Where |
|---|---|---|
| 1 Silent rail lock | ✅ Sequencing kept (owner decision). Locked click shows an aria-live "Complete X first." with a "Go to X" button; visible locked/focus styles; lock, title, aria-disabled and handler share one `moduleNavStatuses()` result. | `portal/app.js` `moduleNavStatuses` / `moduleNavLockAttrs` / `showModuleNavLock`; `portal/module-labs.css` |
| 2 Rail vs disclosure | ✅ Verified in a real browser: rail reveals+scrolls, headings toggle, in all 12 modules. M12's briefing row was mislabelled a second "Guided Lab" — now `type: 'read'`. | `bin/lab-click-sweep.js`; `portal/soc-analyst-module-12.js` |
| 3 Lock policy | ✅ Assessment rows never block later rows; optional `reviewState` ('review'/'returned') rows don't block and show a label. ⏳ No module passes `reviewState` yet (M01's `moduleOneProveItReviewStatus()` could). | `portal/app.js`; `tests/module-nav-lock.test.js` |
| 4 Module wiring | ✅ Sweep: 155 checks, 12 modules × fresh/complete × Guided/Assessment, incl. re-render. Fixed M02 server-verified learner seeing an unlocked rail row but a locked Assessment body. ⏳ Optional: M03 fresh Guided Lab body is text-only — add a "Go to card 1" button. | `portal/soc-analyst-module-02-environment.js` `guidedLabsUnlocked()` |
| 5 Imported lab routes | ✅ 23/23 hrefs resolve; unmapped imported-lab hrefs now `console.warn`. | `portal/app.js` `missionNextLabPortalHref`; `tests/mission-next-lab-routes.test.js` |

### Console Guide follow-on (owner-approved "M01 standard", all Guided Labs)

- Practice guides wrap last step → step 1 ("Back to first explanation"); M01 used to clamp, so Next on 6/6 was a dead click.
- "Next explanation" and the toggle scroll the card to viewport center (shared listener, reduced-motion aware).
- Toggle is a labelled pill "Minimize" / "Show guide".
- Steps declare `target: '<selector>'`; `consoleGuidePosition()` highlights it and places the card above / below / beside it, or in the larger gap with internal scroll when nothing fits. Card measured by layout size (not the scaled hidden rect) and positioned in its real containing block.
- Guide text is protected from module section CSS (`.m02e-learn-tip:not(#_)`); M04–M06 had dark-on-navy text.
- Targets: M01 6/6, M02 6/6, M03 15/15, M04–M06 6/6, M07 6/6, M08–M11 7/7. M04–M06 card now sits in the workspace (`workspace.prepend`) with an `M03E_AFTER_RENDER` re-seat hook.
- ⏳ **M07–M11 still place the card with `host.before(tip)`** (outside the workspace, so it lands far from the console) — swap to `workspace.prepend(tip)` like M04–M06; awaiting owner OK.
- Verify: guide sweep script lives in the session scratchpad (not committed); `bin/lab-click-sweep.js` is the committed click sweep.

### Known pre-existing failures (not from this pass)
- `bin/portal-check.js`: M02 "missing authored Assessment Lab surface" (other session's M02 WIP).
- `tests/guided-lab-console-guide.test.js`: expects a submitted guide to render docked (`is-collapsed`); `guidedLabGuide()` doesn't.
