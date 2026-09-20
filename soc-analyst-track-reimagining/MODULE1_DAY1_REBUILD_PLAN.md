# Module 1 Rebuild — Day 1 Onboarding, a Real Multi-Day Triage, Mistake-Based Grading

**Date:** 2026-09-17. This extends `REBUILD_PLAN.md` decision 4 ("Module 1's
guided-triage lab stays as Module 1, relabeled tour/tutorial") with the actual
execution design — decision 4 was made 2026-09-15 and has **not** been built
yet; Module 1 today is still gated and scored exactly like a graded lab.

**Scope of this pass: Module 1 only.** Modules 2–12 are untouched here —
their own depth work is `REBUILD_PLAN.md`'s Phase 3/4 (Arc A/B), a separate
track of work. One module at a time, starting here.

**2026-09-20: see `ACADEMY_ORIENTATION_SPRINT.md` before extending this
doc's tour mechanism.** A separate, Academy-wide first-login orientation
(`portal/orientation.js`) now runs once, before the student ever opens
Module 1 — LMS navigation, program discovery, module structure, then Module
1's Learn It/Practice It/Prove It and how grading works, all discipline-
neutral. It does not replace or overlap this doc's `m01-orientation` coach
(the in-module "Take the tour" icon, D1 below) — that coach still owns Day 1
framing, rules of engagement, and assigned scope once the student is
actually inside Module 1's SIEM surface. Keep the two systems separate: the
Academy tour must stay content-free of SOC/task-coaching language (see that
sprint doc's own note on why), and this coach must stay scoped to `m01`'s
`allow` list rather than growing into a second onboarding-flow engine.

## Shipped so far, 2026-09-17 (real code, not just design)

- **Corner dock, `ui/coach.js`/`ui/styles.css`:** a small fixed bottom-left
  dock, always present on every simulator view. Two controls: **"←
  Coursework"** (always there — returns to the exact module page via
  `courseworkModuleNumber()`, which reads the active coach's module, a
  `?module=soc-NN` URL param, or a session fallback set when a coach last
  ran) and **"🧭 Take the tour"** (shown only when no coach is currently
  running and the current module has one defined; hidden while a tour is
  active, so it's never redundant with the coach's own step bar). Verified
  live via DOM inspection: mounts correctly, `courseworkHref()` resolves,
  clicking "Take the tour" relaunches the `m01` coach and the button
  correctly re-hides itself.
- **"Exit lab" removed.** It only stopped coach mode and dropped the
  student into the *entire* unscoped simulator, free-roam — on Alex's own
  read, that recreates the exact overwhelm problem this whole plan exists
  to fix, now that "← Coursework" is a real, always-available way out.
  Removed the button, its CSS, and its dead click-handler branch from
  `ui/coach.js`. One way out, not two.
- **Not yet done:** the tour's actual *content* needs to change (see the
  revised §1 below) and hasn't been touched yet — what's shipped so far is
  only the trigger mechanism (icon, corner dock, relaunch wiring), reusing
  the *existing* `m01` task-based coach steps as a placeholder target.

## Owner decisions, resolved 2026-09-17 (supersede this doc's first draft)

1. The new graded multi-task lab stays **inside Module 1**, right after the
   tour — decision 4's "same module number" promise holds.
2. "Perpetual" state means **real cross-device persistence** — a student
   picks up on a different browser/device and sees the exact same
   environment state, not just their own machine. This is a real
   requirement now, not an optional stretch (see §5 — it's load-bearing
   once a module can take multiple sittings across days).
3. The orientation "tour" is **not** a forced sequence a student must
   complete before reaching the lab. The lab/environment is always the
   thing that's there. A small **floating tour icon**, present on the lab
   surface, launches the existing coach-overlay walkthrough on demand —
   available any time the student wants a refresher on what a given
   element is, not a gate they walk through once. Reuses the existing
   `ui/coach.js` engine (spotlighting, step dock) exactly as built; the
   only change is *how it's triggered* (icon, on demand) instead of *when*
   (forced, before the lab).
4. **This icon pattern is universal, not SOC/Module-1-specific.** It should
   be buildable into every course and every module — one shared component,
   with its tour *content* authored per module. Build the shared mechanism
   now; author real tour content for Module 1 only in this pass. Every
   other module gets the same icon wired to its own future content later,
   module by module.

## The bigger reframe: Module 1 must be hours of real work, not a sitting

**Locked, reconfirmed 2026-09-17: this must take a few days to actually
complete, not hours as a stretch goal — that's the bar, not an aspiration.**
Module 1 (the *graded* part, after the tour) should take **hours, closing
in on the feel of a multi-day on-the-job triage**, not a single-scenario
form. Every decision should carry
a **real consequence that shows up in the environment**, not just a score
deduction — the way a wrong call on the job creates more work downstream,
not just a bad performance review. This is not "impossible or punitive,"
though — Mission Next's model is *hard but supported*: help must always be
reachable.

This changes what §3 below needs to be. It's not a bigger form with more
dropdowns — it's a **case that unfolds across multiple consoles and
multiple sittings**, where a wrong choice early on produces a visible
complication later (more evidence to chase, a wider scope, a second alert
that a correct early containment would have prevented), the way a real
Tier 1 mistake costs the *next* few hours of someone's actual day.

## Problem, as it exists in the code today

- **The coach walkthrough skips orientation entirely.** `ui/coach-data.js`'s
  `m01` coach opens directly on `#/defender/alerts`, spotlighting one alert
  row. A student who has never opened a SIEM has no idea what the left-nav
  sections mean, what a workspace is, or where data even comes from before
  being dropped into a live case.
- **Module 1's graded lab is one 4-field form, not a multi-day incident.**
  `portal/soc-analyst-module-01.js`'s `MODULE_ONE_ESCALATION_LAB` ("Lab 2")
  scores four dropdowns (entity/scope/priority/escalation) plus a free-text
  handoff note — a single decision point, completable in minutes.
- **Decision 4 is undone.** Module 1 is still behind the same gating/scoring
  path as every other module (`moduleOneRemoteComplete()`,
  `MODULE_ONE_ESCALATION_LAB.passingScore`) — nothing marks it as an
  ungraded tour yet.
- **Environment state isn't perpetual.** The `ui/` simulator side
  (sign-in-log filters, which row is open) lives in `sessionStorage`,
  wiped on every coach reset. The `portal/` side (quiz answers, lab form
  fields) persists via `LabRuntime` — `localStorage`, browser-local only.
  Once a module can legitimately span multiple days, this stops being a
  minor gap and becomes a hard blocker: a student who switches devices
  mid-case would lose real, hours-deep work.
- **What's already solid, don't rebuild it:** the admin grading queue,
  per-item instructor free-text feedback, and full-attempt redo/resubmission
  (`lab-grading-notification-system/STATE.md`) are real, live, and the
  owner explicitly chose that shape on 2026-09-13. This plan adds content
  and a feedback-authoring shortcut on top of it, not a replacement.

## Grounding: what a real Day 1 SOC analyst does (Microsoft Learn)

Checked against Microsoft's own Sentinel onboarding/training docs
(`learn.microsoft.com/azure/sentinel/quickstart-onboard`,
`.../connect-data-sources`, and the "Connect data to Microsoft Sentinel
using data connectors" training module): a real analyst's first exposure to
the tool is the **Defender portal navigation pane** (Sentinel nested under
it), then **Settings/Configuration → Data connectors** to see what's already
ingesting and its status (`Connected`), then the **Content Hub** for
packaged solutions, then finally the alert/incident queue. Nobody's first
click in a real SOC is an open incident — they're shown the room first.
This is exactly the content the on-demand tour icon (§1) should carry.

## Design

### 1. Day 1's literal first task: set up the workspace — a procedure checklist, not a narrated tour

**Revised, 2026-09-17.** The very first thing Module 1 asks a student to do
should be workspace setup itself — matching a real first day on the job:
verify access, confirm the workspace/tenant, check that data connectors
show `Connected`, locate where cases live. Not narrated ("here's what this
is"), but a **checklist of procedures the student must correctly follow**,
the way a real onboarding runbook reads: "Confirm you can reach the XDR
workspace. Confirm the Azure Activity connector shows Connected. Locate the
alert queue." This reuses the coach engine's existing `require`/`check()`
step shape (spotlight a real control, wait for the student to actually do
it) — the mechanism is already built, this is new step *content*, sequenced
as the true opening of Module 1, before the alert case begins.

### 1b. "Take the tour" is a different thing: what is this, what's it for

**Revised, 2026-09-17.** The on-demand tour icon (mechanism shipped, see
above) should **not** just replay the task steps above. It's a separate,
pure-orientation pass: spotlight each real control **already in scope for
the module** (the `allow`-listed pages only — never the wider, un-toured
simulator) and name it — "This is the alert queue." "This is the Severity
column — how urgent Microsoft's detection thinks this is." "This is the
User filter — narrows a shared log to one identity." No `check()`, no
required action, just "got it, next" — a glossary walk, not a task walk.
**Not built yet** — what shipped today (§ above) wires the icon to relaunch
the *existing* task-based `m01` coach as a placeholder; the real next step
is authoring a distinct `m01-orientation`-style coach (same `allow` scope
as `m01`) with this explanatory content, and pointing the icon at that
instead. Reuses the same `ui/coach.js` engine — new content, not new
mechanism.

- The corner-dock mechanism (icon + trigger + reuse of the coach engine)
  is the reusable part — designed so any future module/track can wire its
  own tour content to the same icon without rebuilding the trigger.

### 2. Actually execute decision 4 — Module 1's opening becomes the tour, ungated

- Reframe Module 1's opening section from "Lab" to "Tour" / "Walkthrough"
  in `portal/soc-analyst-module-01.js`; the tour is available via the icon
  from §1 at any point, not a one-time forced gate.
- Remove Module 1's *tour* portion specifically from the 70%-pass-threshold
  and redo-gating logic (`moduleCompletion()` in `portal/app.js`) — it's
  complete-by-doing. The knowledge-check quiz stays low-stakes as today.
  The new multi-day lab (§3) is what actually gets graded.

### 3. The real graded work: a multi-day, multi-console incident

Replace `MODULE_ONE_ESCALATION_LAB` entirely with a case that:
- **Spans multiple evidence sources/consoles**, not one scenario screen —
  matching the "pivot across consoles to collect facts" shape the existing
  coach tour already teaches, but as the real graded work, at real depth
  (more accounts, more devices, more time-ordered evidence to correlate),
  not a single four-field decision.
- **Has independently scored tasks** across the incident lifecycle (intake/
  scope, verdict, priority, a containment action choice, remediation/
  handoff), matching the weighted-section pattern Modules 2–12 already use
  (`REBUILD_PLAN.md` decision 1).
- **Has real, visible consequences for wrong choices**, not just point
  deductions — a wrong containment target should produce a *visible
  downstream complication* the student then has to deal with (a follow-up
  alert, a wider scope, more evidence to chase), the way a real Tier 1
  mistake creates more work rather than just a bad score. A choice bad
  enough to constitute a genuine on-the-job failure (tipping off the
  attacker, disrupting an unrelated system) is a **critical-error flag**,
  not just a point loss.
- Uses a **fixed-parameter case fixture** — same accounts/hosts/IPs/
  timestamps for every student — so both the consequence-branching above
  and the mistake-mapped feedback (§4) stay accurate and buildable for
  every submission, not randomized per-student.
- **Is built to be resumed across multiple sittings** — a student closing
  the tab mid-case and returning hours or days later must land back
  exactly where they left off, including which complications their own
  earlier choices already triggered. This is the real requirement §5
  exists to satisfy; author this content with that resumability in mind
  from the start rather than bolting it on after.

- **No live score shown to the student.** Confirmed 2026-09-17: this is
  what a real first day is — you do the work and turn it in, you don't get
  a running scoreboard. Today's `m01-lab2-feedback` panel
  (`portal/soc-analyst-module-01.js`) shows the score/breakdown to the
  student the instant they submit — that has to go for this new lab. The
  student sees confirmation of submission, not a grade; the grade stays
  server-side until an instructor reviews it through the existing admin
  grading queue and sends feedback back (already-built mechanism, §4). The
  "coach 'em as they go" part of this is the instructor's redo/feedback
  loop, not a live in-lab score.

This is the single biggest, most judgment-heavy piece of this whole plan —
real curriculum authoring (the case narrative, the evidence chain, which
wrong choices trigger which complications), not a mechanical file edit. Do
this one carefully, with review checkpoints, the way Arc A/B in
`REBUILD_PLAN.md` were flagged as needing owner content-review rather than
blind sprint dispatch.

### 4. Mistake-mapped feedback, layered onto the existing grading system

No change to the mechanism the owner already chose (instructor free text
per flagged item, full-attempt resubmission). What's added: for each
specific *known* wrong task-choice in the new lab, a canned "why this is
wrong, what it would cause in production" snippet — pre-filled into the
instructor's feedback textarea for that item in `adminGradingQueuePanel()`
(`portal/app.js`), editable or replaceable, never forced. E.g., picking the
wrong host to isolate pre-fills *"Isolating WS-114 instead of the sign-in
source let the attacker keep credential access"* instead of a blank box.
Keyed off `row.result.breakdown`'s per-task wrong answers, which the
scoring function already computes.

### 5. Cross-device perpetual environment state (now load-bearing, not optional)

**Locked, reconfirmed 2026-09-17: this does require real Supabase work — not
optional, not deferred.** Today: `ui/` simulator state is `sessionStorage`
(wiped every coach reset); `portal/` lab answers are `localStorage` via
`LabRuntime` (same-browser only). Confirmed requirement: real cross-device
persistence, mirroring the
proven Module 1 completion-detail beacon pattern
(`20260916050000_module_one_detail_beacon.sql`) — a Supabase-backed state
blob capturing case progress (which tasks are answered, which
consequences/complications have already fired, evidence already reviewed)
so a student resumes identically on any device. Do this **before** or
alongside §3's authoring, not after — the case content in §3 should be
designed against a real save/restore point from day one.

### 6. Support model: hard but not impossible — a reachable "ask your instructor"

The owner's framing: real consequences and real difficulty, but a teacher
is always reachable — that's the actual Mission Next model, not a detail.
Checked: there's no dedicated in-lab "contact instructor" affordance today
(the IT Support track's Module 1 has students *find* a contact link as a
practice task, but nothing surfaces it contextually inside a hard lab).
Scope for Module 1: surface whatever instructor-contact channel already
exists (find it — likely a static email/contact link elsewhere in the
portal, don't invent new messaging infrastructure) as a small, visible
"Stuck? Ask your instructor" affordance inside the multi-day lab, not
buried in a separate menu. Flag as a small open item — confirm the actual
existing contact channel before wiring this.

## Sprint plan (cheap-model delegation, per the sprint-handoff pattern this
repo already uses — one Codex/Haiku process per scoped file, orchestrator
reviews/tests/commits, mirrors `bin/run-module-agents.sh`)

| Sprint | Scope | Files | Delegation | Status |
|---|---|---|---|---|
| D0 | Workspace-setup procedure checklist (new, §1) — the real opening of Module 1 | `ui/coach-data.js` (new steps/coach), `portal/soc-analyst-module-01.js` | Mechanical — Haiku/codex | **Shipped, 2026-09-17** (commit `a4dd8cd`) — new `m01-setup` coach (tenant/connector/alert-queue), gates the existing "Lab 1" launch link via a new `workspaceSetupComplete` flag. Not yet exercised in a live browser. |
| D1 | "What is this" orientation coach content (revised, §1b) — distinct from D0 and from the task coach | `ui/coach-data.js` (new `m01-orientation`-style coach, scoped to `m01`'s `allow` list) | Mechanical — Haiku/codex | **Shipped, 2026-09-17** (commit `4dc7641`) — new `m01-orientation` coach (5 pure-narration steps), plus a fix to `tourForCurrentModule()` in `ui/coach.js` (a new `tour: true` marker) that D0 had accidentally broken by adding a second module-1 coach ahead of `m01` in the array. Not yet exercised in a live browser. |
| D2 | Module 1 tour relabel + ungate | `portal/soc-analyst-module-01.js`, `portal/app.js` (`moduleCompletion()`), new migration | Mechanical — Haiku/codex | **Shipped, 2026-09-17** — the former Lab 1 is relabeled as an optional console walkthrough, no longer locks the handoff case, and is removed from both the canonical assessment map and SOC-01's verified-progress detail gate. The existing foundation lessons, knowledge check, and Lab 2 assessment remain unchanged until D5. |
| D3 | Cross-device state beacon (build first / alongside D5, not after) | new migration + `lab-runtime.js` | Mechanical, but design the schema against §3's needs before D5 is authored | **Shipped, 2026-09-17** (commit `3249fe8`) — `module_progress.case_state` column + `LabRuntime.loadCaseState()`/`saveCaseState()`. Plumbing only, no caller yet (D5 will call it). Not yet exercised against a live Supabase login — needs a real cross-device smoke test. |
| D4 | Canned mistake-feedback snippets | `portal/app.js` (`adminGradingQueuePanel()`) | Mechanical — Haiku/codex | Not started |
| D5 | The real multi-day case: evidence chain, tasks, weighted scoring, consequence branching, **no live score shown to the student** | `portal/soc-analyst-module-01.js` (full rewrite of the lab section), `portal/data.js`, new migration | **Judgment-heavy — do this myself with close review, not blind delegation. The core of this whole plan.** | **Not accepted as complete, 2026-09-17.** A Northstar Finance fixture, cross-device save call, consequence branch, and critical-error gate were implemented in `b6bf279`; however, live review correctly found it is still a short three-stage form, not days of work. It lacks paced releases, substantial console pivots, multiple independently reviewable artifacts, and instructor checkpoints. Replace it with the actual multi-sitting investigation before calling D5 shipped. |
| D6 | Universal floating corner dock: "← Coursework" (always) + "🧭 Take the tour" (on demand, hides while a tour runs) | `ui/coach.js`, `ui/styles.css` | Mechanical — Haiku/codex | **Shipped, 2026-09-17** — trigger mechanism only; content for the button to launch is D1 |
| D7 | Remove "Exit lab" (superseded by D6's "Coursework" link — one way out, not two) | `ui/coach.js` | Mechanical | **Shipped, 2026-09-17** |

Suggested order from here: D3 (state schema, locked requirement) → D0/D1/D2
(mechanical content work, can run in parallel) → D5 (the real authoring,
informed by a working save point) → D4 (feedback snippets, needs D5's task
shape to exist first).

## Still open

### Governing correction — the SIEM is the assessment, not a narrative worksheet (2026-09-17)

**Owner direction, locked:** Module 1 must not assess whether a student can
write a plausible narrative *about* triage. It assesses whether they can do
the entry-level procedure in the simulator. The floating **Take the tour**
control is optional orientation only; there is one Module 1 SIEM lab surface,
not separate guided-lab and essay-form experiences.

Completion must be based on a durable, instructor-reviewable simulator action
record showing the student actually:

1. verifies the workspace/data readiness appropriate to the assignment;
2. finds and triages the assigned incident in the queue (filter/open/pivot to
   alerts, entities, and supporting events);
3. assigns/updates the incident as their role permits, records evidence in
   the case, and makes the justified escalation or containment request; and
4. leaves a final incident record the instructor can review alongside the
   ordered action log.

The multi-day requirement is therefore not met by labeling form fields “Day
1/2/3.” It requires meaningful procedures and independently reviewable work
across the early days of the six-week internship: workspace/data orientation,
incident intake and evidence pivots, then supervised triage/handoff and
feedback. Cross-device persistence must save the simulator case state and
the action record. The current Northstar fixture (`b6bf279`) is explicitly a
non-accepted prototype until it is rebuilt to this model.

**Implementation pointer:** extend the simulator-to-portal contract around
the existing coach/action infrastructure, capturing a scoped action/event log
and the incident's saved fields rather than accepting a portal-only worksheet.
Ground the procedures in Microsoft's Sentinel guidance: triage an incident by
filtering/opening it, investigating alerts and entities, assigning ownership,
setting status, and adding comments; use the related Defender investigation
when the case requires that pivot. See
[Navigate, triage, and manage Microsoft Sentinel incidents](https://learn.microsoft.com/en-us/azure/sentinel/incident-navigate-triage)
and [Investigate incidents with Microsoft Sentinel](https://learn.microsoft.com/en-us/azure/sentinel/investigate-cases).

- Exact existing instructor-contact channel to surface in §6 — needs a
  quick look at the portal for what already exists before wiring anything.
- §3/D5's actual case narrative and complication tree isn't written yet —
  that's the next real work, not a decision that blocks starting D3.

## Live-review notes, 2026-09-17 (mid-sprint, while D3 ran)

Raised by the owner while looking at the current live Module 1 page. None
of these block D0/D1/D2 as already scoped below (confirmed against each
sprint's file list); captured here so they aren't lost before the next
content-authoring pass.

1. **Confirmed, not a new decision:** the forced task-coach step bar
   (`Module 01 · step 1 of 5 · your move` / "Next Step: open ... on
   j.santos" / "Why this matters" disclosure / waiting-pulse indicator) is
   what "Take the tour" currently launches — this is the *placeholder*
   D1's brief already calls out (reusing the existing `m01` task coach
   until real orientation content exists). Its "your move" / dim-everything-
   else / wait-for-the-action framing is task-coaching, not orientation, and
   is exactly what D1's real `m01-orientation` content must NOT carry — a
   pure "here's what this is, got it, next" glossary walk instead. No plan
   change needed; this is confirmation the placeholder reads as expected
   (i.e., obviously temporary), not a new requirement.

2. **New, undecided — Foundations lesson placement.** Module 1 today has
   standalone lesson sections 2–4 ahead of the knowledge-check quiz:
   "Security architecture — how activity becomes analyst work," "The map
   for responding — incident response lifecycle," "The repeatable habit —
   your five-step triage loop." Open question raised live: should these
   instead be (a) reframed as "Sources & further reading" — optional
   reference material, not sequenced required reading — or (b) folded
   directly into the Foundations/tour content itself, still ahead of the
   quiz? Not decided. Doesn't touch D0/D1/D2's file scope, so doesn't block
   them; resolve before any sprint that touches lesson content.

3. **New, undecided — is the knowledge-check quiz still needed at all?**
   Raised live: once Module 1 has exactly one graded artifact (D5's
   multi-day case) and the on-demand tour icon can be reopened any time for
   a refresher, a separate mandatory knowledge-check quiz between the
   lessons and the lab may now be redundant — the tour icon already serves
   the "make sure they actually understood the basics" purpose the quiz
   exists for. Not decided. D2 as currently scoped explicitly leaves the
   knowledge-check quiz untouched ("stays low-stakes as today") — that
   remains correct to build as-is for now, but the quiz's continued
   existence past this session is an open question for whoever next scopes
   lesson/quiz content, not settled fact.
