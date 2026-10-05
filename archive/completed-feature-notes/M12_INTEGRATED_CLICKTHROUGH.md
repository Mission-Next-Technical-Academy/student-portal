# Module 12 integrated capstone — S5 clickthrough

Date: 2026-10-05
Status: **Local acceptance complete; live account UAT tracked in the active capstone plan**

This report is closed for local implementation and browser acceptance. The
remaining learner/faculty account actions stay open in
`docs/workstreams/M12_INTEGRATED_CAPSTONE_PLAN.md` §6 and are not represented
as complete here.

## Changes activated

- Existing `assessmentState.actionHistory` is replayed unchanged by the M12 state loader. Active work upgrades to rubric v2 after replay; the action state keeps v1 as its direct/default version so historical scorer fixtures remain reproducible.
- Submitted Module 12 attempts remain locked. The loader does not recompute their saved score. For already-completed legacy tickets, ticket fields are backfilled from `answers` once, then the retired `answers` property is dropped.
- New portfolio artifacts identify the rubric version used by the submitted score.
- The faculty review card displays the Student Analyst Response, competency points and scoring details, plus selected evidence, determinations, and meaningful actions. The raw payload remains available as secondary diagnostic data.
- The Assessment rail now has a stable `#m12-ticket` anchor for the ITSM Ticket tab. The browser sweep found this target was missing until the tab was opened; the host anchor now lets the rail open and reach the ticket.

## Browser evidence

- `bin/console-tab-sweep.js`: **304 / 304 console tabs passed**, including all 24 Module 12 tabs.
- `bin/lab-click-sweep.js 1,12`: Module 1 and Module 12 Guided Lab and Assessment Lab click, heading, control, and rerender checks passed after the ticket-anchor fix.
- Module 1 and Module 12 `bin/portal-check.js` renders passed.
- Module 12 test files: **6 / 6 passed**.
- ITSM Ticket tab screenshot: [M12-it-ticket-tab.png](../../docs/handoffs/assets/M12-it-ticket-tab.png). Captured in Chrome on the local portal with a synthetic stand-in learner; no real learner record was submitted.

### 2026-10-05 resumed acceptance pass

- Restarted the local portal and simulator with `bin/dev.sh start` after confirming both were down.
- Re-ran `bin/console-tab-sweep.js`: **304 / 304 tabs passed**.
- Re-ran `bin/lab-click-sweep.js 1,12`: fresh and complete Module 1/12 states passed their Guided Lab and Assessment Lab rail, heading, control, and rerender checks.
- Ran every `tests/soc-m12-*.test.js`: **6 / 6 passed**, including the v2 scorer cases, migration/state contract, contextual console controls, tool bridge, and ticket submission integration.
- Ran the all-module `bin/portal-check.js` render sweep successfully.
- The scored Chrome scenarios are recorded below; provisioned-account persistence/review checks remain separate.

### 2026-10-05 scored Chrome scenarios

Added `bin/m12-scored-browser-sweep.js` to run three isolated synthetic Module
12 submissions through the actual ticket UI, scorer, submission lock, local
case-state rehydration, and faculty review renderer. Persistence functions are
stubbed in the page, so the run writes no learner, portfolio, or capstone rows.
After submission, the runner restores the native case-state loader and
rehydrates the synthetic learner from browser-local storage before checking the
saved score and disabled ticket fields. Run it with the local Playwright cache
on `NODE_PATH`, for example:

```sh
NODE_PATH=/home/alex/.npm/_npx/6bcb61ec6d5aea22/node_modules node bin/m12-scored-browser-sweep.js
```

| Scenario | Result | Evidence |
|---|---|---|
| Gold path | **100/100**, rubric v2, safe, ticket remains locked after local rehydration | [ticket](../../docs/handoffs/assets/M12-gold-ticket.png) · [faculty review](../../docs/handoffs/assets/M12-gold-faculty-review.png) |
| Exploration-heavy path | **100/100**, rubric v2, safe; pins all 167 evidence records and runs 12 additional queries without penalizing correct conclusions | [ticket](../../docs/handoffs/assets/M12-click-everything-ticket.png) · [faculty review](../../docs/handoffs/assets/M12-click-everything-faculty-review.png) |
| Unsafe path | **69/100**, unsafe attempt retained and capped; out-of-scope `isolate ws-118`; ticket stays locked after local rehydration | [ticket](../../docs/handoffs/assets/M12-unsafe-action-ticket.png) · [faculty review](../../docs/handoffs/assets/M12-unsafe-action-faculty-review.png) |

The faculty screenshots show the submitted responses, competency points,
scoring explanations, and the unsafe-path cap explanation. These synthetic
browser runs verify the local app flow and browser-local state. They do not
verify authentication, remote persistence after sign-out/sign-in, or the
provisioned faculty queue against a real saved attempt.

### Module 1 regression

Added `bin/m01-case-regression-sweep.js` for the capstone's Module 1 regression
gate. It submits the Module 1 Assessment Lab through its real case-console
button using synthetic case data, then restores the native local case-state
loader and confirms the 100-point attempt stays submitted and locked. It also
renders the saved case through the faculty ticket renderer:
[Module 1 synthetic faculty review](../../docs/handoffs/assets/M01-synthetic-faculty-review.png).
The synthetic account has no `trackCode`, and attempt persistence is stubbed,
so the run does not write to Supabase.

## Closeout

- [x] CI, portal render, M12 tests, console tabs, and Module 1/12 interaction sweeps pass.
- [x] Three scored Module 12 Chrome submissions show the expected gold, exploration-neutral, and unsafe-cap outcomes.
- [x] Module 1 synthetic submit, local state rehydration, lock, and faculty ticket rendering pass.
- [x] Ticket, faculty-review, and regression evidence screenshots are saved under `docs/handoffs/assets/`.

Live account UAT remains open in the active capstone plan. No authenticated
Chrome session or faculty credentials were available during this pass; the
local roster's learners are not designated disposable QA accounts, so no live
submission was made.
