# Console Guide in Practice It · Guided Labs: completed rollout (SOC M01–M12)

Date: 2026-10-03 · Rev 3 plan executed.

**Status: completed, then amended by owner direction on 2026-10-03.** Shared
helpers and Guided Labs M01–M11 use the common console guide and practice
debrief. M02 follows the owner amendment below: its Guided Lab is the console
walkthrough and its ITSM case is the Assessment Lab;
M01's Guided and Assessment Labs render inline. Submitted guides dock into the
console header/banner and expand to reveal the debrief. Assessment Labs M01–M12
show standard faculty-review states without student scores or debriefs. Existing
completed Guided Labs retain credit. The Day-1 orientation tour was not changed.

Verification: `node tests/guided-lab-console-guide.test.js`,
`node bin/portal-check.js`, `node --check` on touched JavaScript, and
`git diff --check`.

### Owner amendment · 2026-10-03

For Module 02 only, the owner later directed a role swap: Learn It and its Deep
Dive remain in their own section, the Network & Identity console walkthrough
is the Guided Lab, and the HR authorization case with its ITSM tab is the
Assessment Lab. The duplicate standalone Assessment ticket is removed. This supersedes the M02-specific
ticket-completion and debrief requirements below; the common floating guide,
evidence highlight, and console-banner home remain the standard for all
modules.

## Owner direction (locks the design)

1. **The goal of every Guided Lab is to resolve the ITSM ticket.** The console guide
   exists to get the student to a submitted ticket. Every step should feed a ticket
   field: affected user, affected device, severity, disposition, escalation and
   department, findings, work notes.
2. **Submitting the ITSM ticket completes the Guided Lab.** Finishing the guide does not
   complete it, and neither does filling in fields.
3. **Next is never blocked.** The guide advises; it does not gate. Progress can tick
   live ("Found ✓"), but the student can always move on, skip ahead or submit.
4. **Partial credit, as in real SOC work.** A contributing log that correlates to the
   event but is not the source is still a finding worth points, just not full points.
   The guide must teach the difference between the primary source and
   contributing/secondary evidence. It must not imply that there is one right click
   path or one right log.
5. **The Assessment Lab score is never shown to the student.** The guide and the ticket
   UI must not leak scores, point values, or "correct/incorrect" on graded fields.
   Students see "Submitted for faculty review" / "Lab graded" only
   (`portal/case-record.js:175`).
6. **The template is the M02 console guide card.** It is MODULE_STANDARD.md §7.3:
   renderer `portal/console-guide.js`, CSS `.m02e-learn-tip` in
   `portal/module-labs.css`. Steps are authored as `{ title, body, lookFor, lab, tab }`.
   Only the words change per module.
7. **Every lab sits inside its own section card.** Guided and Assessment Labs render the
   console inline in the module's Practice It / Prove It card, as M02–M12 already do.
   There are no "Launch/Resume … Lab" buttons that open a new tab. **M01 is the only
   exception today**, and it must change to match.
8. **One post-Submit debrief standard across all 12 modules:**
   - **Guided Lab (M01–M11):** after Submit, the guide card switches to
     `CONSOLE GUIDE · COMPLETE` and shows a practice debrief. The debrief has the same
     shape in every module:
     1. what the evidence supports (the case story);
     2. a per-ticket-field note (captured / contributing / missed), with no points;
     3. what a strong handoff includes.
     The ticket locks as "Practice submitted", and a Restart is offered.
   - **Assessment Lab (M01–M12):** after Submit, the student sees only the standard
     `caseRecordPanel` states ("Submitted for faculty review" → "Lab graded" /
     "Returned for remediation"). There is no debrief and no score.

## Is the console guide already in the modules?

**Only partly.** The shared template exists and two modules call it. Neither use
matches the direction above yet.

| Where | What's there today | Gap vs. direction |
|---|---|---|
| **M02 Learn It** | Standard card, 6 steps, **Next is non-blocking**. This is the model behaviour. | Lives in **Learn It** only. `consoleHtml()` passes `guideStep = -1` for every scope except `learn` (`soc-analyst-module-02-environment.js:517`). |
| **M02 Guided Lab** (Network & Identity console) | The standard console guide follows and highlights evidence in its own inline section. | Owner amendment: this walkthrough is the Guided Lab; HR-FILE-01 with its ITSM tab is the Assessment Lab. |
| **M03 Guided Lab** | Standard card, 12 steps, auto-checks, "Go to tab" / "Insert query", and a debrief. | **Next is hard-gated** (`soc-analyst-module-03-environment.js:1144`: `if (!m03eStepPassed(step)) return`). **Completion = finishing the guide**, not submitting the ticket (`soc-analyst-module-03.js:536`, `-environment.js:1078`). |
| **M04–M11 Guided Labs** | No standard card. Each has its own grey `<details>` checklist (`.m04-console-guide` … `.m11-console-guide`, `.m08-practice-guide`). M04/M05 are even labelled "Console Guide". | Replace with the standard card (§7.3 bans alternate styles). M08–M11 start **collapsed**, and M09–M11's bullets **never tick**. |
| **M01 Guided Lab** | **No card.** "Launch Guided Lab" opens a full-page case console in a **new tab** (`?console=practice`, `soc-analyst-module-01.js:849`, `:975`). Fact-form hints link out to the external sim (`?coach=m01`). | Embed the case console inline in the Practice It card and add the standard card. |
| **M01 Assessment Lab** | "Launch Assessment Lab" opens a **new tab** (`?console=prove`, `:1032`, `:1107`). | Embed the console inline in the Prove It card, as M02–M12 do. |
| **M12** | Capstone, no Guided Lab. | n/a. A capstone should stay unguided. |

## What completes each Guided Lab today

None of them require pressing **Submit** on the ticket. That conflicts with direction #2.

| Mod | Completion rule today | Ref |
|---|---|---|
| M01 | Case console marks `consoleCompleted` | `soc-analyst-module-01.js:868` |
| M02 | Finish the Network & Identity console guide | `soc-analyst-module-02-environment.js:574` |
| M03 | Guide reaches its last step | `soc-analyst-module-03.js:536` |
| M04 | 4 checks; the "ticket" check passes on any action history **or** notes | `soc-analyst-module-04.js:1254` |
| M05 | 4 checks; **the ticket is not checked at all** | `soc-analyst-module-05.js:971` |
| M06 | 3 checks; the ticket check is `notes` being non-empty | `soc-analyst-module-06.js:1455` |
| M07 | 3 checks; the ticket check is `notes` being non-empty | `soc-analyst-module-07.js:972` |
| M08 | Tool actions plus all ticket fields filled and notes ≥35 chars (no submit) | `soc-analyst-module-08.js:801` |
| M09 | Tool actions plus all ticket fields filled and notes ≥35 (no submit) | `soc-analyst-module-09.js:1140` |
| M10 | Tool actions plus all ticket fields filled and notes ≥40 (no submit) | `soc-analyst-module-10.js:850` |
| M11 | Tool actions plus all ticket fields filled and notes ≥35 (no submit) | `soc-analyst-module-11.js:839` |

Every Guided Lab console in M03–M11 already has an ITSM case tab
(`caseView: () => caseRecordPane(...)`), so the ticket is already where the student works.

## Partial-credit alignment

- The standard already requires partial credit. `docs/LAB_ASSESSMENT_STANDARD.md` §"Partial
  credit is required" defines PRIMARY / SECONDARY / SUPPORTING / IRRELEVANT /
  CONTRADICTORY support levels and says that different valid paths earn equal credit.
- M02's Assessment ticket already scores this way. `caseTierPoints()` gives
  `principal` 1, `pivot` 0.5 and `noise` 0
  (`soc-analyst-module-02-environment.js:193`).
- **Guide copy rule:** the "Look for" box teaches the student to judge the evidence
  ("Does this log show where the activity started, or does it only confirm it
  happened?"). It never names the answer and never says a contributing log is
  "wrong".
- **Guided Lab feedback:** after Submit, the Guided Lab is ungraded practice, so it may
  show a short debrief, e.g. "You captured a contributing log (correlated to the event);
  the originating source was X". **Assessment Lab:** show no debrief and no score.

## Standard Guided Lab guide: the shape every module follows

The step arc is the same everywhere; only the words change:

1. **Read the ticket.** Open the ITSM tab and see which fields you must resolve.
2. **Start from the alert/lead.** It is a lead, not a verdict.
3. **Investigate (2–5 module-specific steps).** Each one names the console tab, what to
   look for, and which ticket field it informs (`lab:` box = "Ticket field: Affected
   Device").
4. **Primary vs. contributing evidence.** One step explains that correlated logs count
   as findings, and that the source log is the strongest.
5. **Scope and decide.** Severity, disposition, escalation and department.
6. **Write the work notes and Submit the ticket.** This is the last step. The button
   goes to the ITSM tab. Submitting completes the lab.

Behaviour:
- `consoleGuideCard()` / `consoleGuideStartButton()` / `consoleGuidePosition()`, prefix
  `mXXg`, rendered inside the Guided Lab console workspace.
- **Next is always enabled.** Each step shows a live status ("Found ✓" / "Not yet") from
  the existing check predicates, as a hint only.
- Keep the "Go to <tab>" helper. "Insert query" is allowed only in early modules (M03/M04).
- The card docks into the console header when collapsed (standard §7.3 behaviour).
- After Submit, the card switches to `· COMPLETE` and shows the standard practice
  debrief (direction #8).

### Current post-Submit feedback (to be normalised to #8)

| Mod | Today |
|---|---|
| M01 | Per-field "Correct: … / Set X to Y" list (`moduleOneGuidedLabFeedback`, `:622`). Closest to the target shape, but uses right/wrong wording. |
| M02 | One sentence of decision feedback (`:735`) |
| M03 | Guide `doneTitle` "Case debrief" paragraph (`-environment.js:805`) |
| M04–M11 | One status line, e.g. "Guided Lab complete: …" |

## Rollout plan

| Sprint | Scope | Notes |
|---|---|---|
| 0 | Shared helpers | **Complete.** Added `guidedLabGuide()` and `guidedLabDebrief()` with shared styling and header docking behavior. |
| 1 | **M03** | **Complete.** Next is advisory; ticket submission completes practice; the shared debrief covers source and contributing evidence. |
| 2 | **M02** | **Complete, then amended.** The HR authorization ITSM case now serves as the Assessment Lab; the Network & Identity console guide is the Guided Lab. |
| 3 | M04–M07 | **Complete.** Replaced custom checklists with shared guided steps, ticket completion, debrief, restart, and header docking. |
| 4 | M08–M11 | **Complete.** Added evidence predicates and seven-step guides; removed custom checklist and student score displays. |
| 5 | **M01** | **Complete.** Embedded both labs, added the guide/debrief, and amended `docs/specs/MODULE_01_CASE_CONSOLE_SPEC.md` §2. The separate orientation tour remains intact. |
| — | Cleanup | **Complete.** Removed obsolete checklist styles/markup, standardized header visibility and expansion, added `tests/guided-lab-console-guide.test.js`, and updated MODULE_STANDARD.md §7.3. |

**Progress migration:** students who already completed a Guided Lab under the old rules
must stay complete. Follow the existing `remoteVerifiedModuleProgress` /
`creditLegacyGuidedLab()` pattern.

**M01 caution:** `ui/coach.js` `m01-orientation` is ROADMAP item 1's Day-1 tour, a
separate system (see CLAUDE.md). The `?coach=m01` "Reopen the log" links in the M01 fact
forms point at the external sim. Decide in Sprint 5 whether those links stay once the
case console is inline. Don't break the orientation tour.

## Owner decisions (all resolved 2026-10-03)

1. M02 Guided Lab → **console walkthrough**; HR authorization ITSM ticket → Assessment Lab (owner amendment supersedes the original decision).
2. M01 → **add the standard console guide**, and **embed both labs inline** (no new-tab launch).
3. Post-Submit practice debrief → **yes, one identical shape across all 12 modules**
   (Assessment Labs show no debrief and no score).
4. Next is never blocked; ticket Submit is the completion trigger.

## Completion note

The owner subsequently authorized committing and pushing the shared branch,
including the adjacent Learn It cards work that was already present in the
working tree. This archive records the completed Console Guide sweep; use
`MODULE_STANDARD.md` §7.3 as the continuing implementation standard.
