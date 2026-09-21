# Next session — use the canonical roadmap

`ROADMAP.md` is the single active delivery queue. Read it first, select one
unblocked roadmap item, then read only that item's governing specification.
Do not use the historical notes below as an independent plan; some describe
superseded Module 1 directions.

**2026-09-21:** `HANDOFF_2026-09-21_EVIDENCE_LOG_SIFT_FINDINGS.md` scoped a
masked-input, read-the-real-log evidence mechanic for ALT-1001. **Superseded
later the same day** by `MODULE_01_CASE_CONSOLE_SPEC.md`'s simpler,
now-shipped mechanic: click a real log row, it expands a raw structured
record. That satisfies the same underlying ask (real evidence reading, not
instant-click review) without the masked-input form — don't build that form
on top of this; it would be redundant.

**2026-09-21, same day, superseded again:** roadmap item 1 (orientation
tour) was fixed for reachability, which surfaced that `1add6d6`'s move of
Prove It off the simulator looked like an unresolved discrepancy. It
wasn't — `MODULE_01_CASE_CONSOLE_SPEC.md` landed the same day and confirms
that pivot was correct: **Module 1 does not use the full SOC range at all,
for either Practice It or Prove It.** Read that spec first, then
`ROADMAP.md`'s "Locked Module 1 sequence" (corrected in place) and
`HANDOFF.md`'s "Module 1 case console — Practice It built" entry.

**Next real work:** Prove It (`moduleOneProveItConsole()`, NST-2407) still
uses the old embedded-in-page console. Port it to the same
`?console=<stage>`-driven, new-tab case-console pattern Practice It now
uses (`viewModuleOneCaseConsole()` in `portal/soc-analyst-module-01.js`) —
same three-pane shape, its own case-appropriate log/evidence data (NST-2407
doesn't have `logEvents` yet), reduced coaching per the spec's Prove It
section. Reuse the mechanism, don't invent a second one.

Module 1 begins with the required LMS orientation tour, reachable from the
module's hero section and live-verified in Chrome. It is followed by
Practice It and Prove It, both worked in Module 1's own focused case console
(not the full SOC range) per `MODULE_01_CASE_CONSOLE_SPEC.md` — Practice It's
console is built and live-verified; Prove It's still needs porting to match.

---

# Historical session notes — reference only

## Submit button moved to the floating corner dock, later same day (2026-09-18)

Owner feedback on the pass below: submission shouldn't be tied to one page —
"it should feel like an open range." Moved "Submit Module Lab" out of the
NST-2407 incident view's inline callout and into `ui/coach.js`'s existing
`mnt-corner-dock` (the same always-present bottom-left dock that already had
"🧭 Take the tour" and "← Coursework") as a third floating button, shown
whenever `?case=NST-2407` is in the URL regardless of which page of the
console you're on. Escalate stays inline (that's a real incident-specific
action); submit is module-level work, so it now follows you anywhere —
queue, assets, hunting, wherever. Updated the tour's last step and the
portal-side help copy to match. Live-verified the button persists across
unrelated routes (confirmed on Advanced hunting, nowhere near the incident
page). `node --check` clean; no console errors.

## Module 1 / NST-2407 polish pass, later same day (2026-09-18)

Continued directly on top of the nav-rail pass above, same session:

- **Branding**: "Northstar Finance" → "Mission Next Labs" and the fictional
  identity's domain `a.chen@northstar.example` → `a.chen@missionnextlabs.example`,
  scoped to the NST-2407 case only (`portal/soc-analyst-module-01.js`,
  `portal/data.js`, `ui/data.js`, `ui/app.js`). Also dropped the raw case ID
  from user-facing copy per owner direction ("publications are not
  necessary") — the button now reads "Open Mission Next SIEM", the lab
  heading reads "Mission Next Labs: investigate the correlated incident",
  `ui/views.js`'s banner no longer says "Open NST-2407." **Deliberately not
  touched:** Module 7's `northstar-suppliers.example` / lookalike-domain
  content (that's an intentional phishing/typosquat teaching device, unrelated
  company) and the IT Support track's much larger "Northstar Distribution
  Group" fixture set (`ui/helpdesk-data.js`, `ui/helpdesk.js`,
  `portal/it-support-module-12.js`) — separate program, out of scope, owner
  didn't ask for that one and it's a much bigger blast radius (AD OUs, DNS
  records, PowerShell branding threaded through many exercises).
- **Bug fix**: the simulator-submission panel's paragraph text was invisible
  (white-on-white) — `.m01-siem p { color: rgba(255,255,255,.82) }` (meant
  for text sitting directly on the dark card) was leaking into the nested
  white `.m01-score-empty` card via inheritance/specificity. Fixed in
  `portal/module-labs.css`. Also replaced the flat "Still required: A; B;
  C" sentence with a real checklist (`.m01-requirements-list`, all 8 items
  shown with done/pending state) and gave the submit button a real disabled
  style instead of staying vivid orange when nothing was done yet.
- **Submit from inside the simulator**: added a "Submit Module Lab" button
  directly in the NST-2407 incident view (`ui/views.js`, next to "Escalate
  to incident response"), wired through the existing
  `recordAssignedCaseAction` postMessage channel to a new
  `'submit_for_faculty'` action. Extracted the finalization logic (mark
  submitted, `recordLabAttempt`, `markModuleLabComplete`, sync completion)
  into a shared `moduleOneFinalizeSimulatorSubmission()` in
  `portal/soc-analyst-module-01.js` so both the simulator button and the
  portal-side fallback button call the same path. Portal button stays as a
  secondary/fallback, per-owner request the simulator button is now primary.
- **Orientation tour, reused not rebuilt**: discovered `coach.js` /
  `coach-data.js` already had exactly the "floating icon → click Next
  through spotlighted steps" mechanism this was about to be built from
  scratch (`ui/coach.js`'s `mnt-corner-dock`, bottom-left "🧭 Take the tour"
  button, already used by `m01-orientation`). Root cause it wasn't showing
  up on the NST-2407 flow: that launch link (`incidentRoute` in
  `soc-analyst-module-01.js`) never passed `?module=soc-1`, so
  `courseworkModuleNumber()` couldn't resolve which module's tour to offer
  (Module 12 already passes this param on its own launch link — Module 1's
  NST-2407 link was the one missing it). Fixed the link, then extended
  `m01-orientation` (`ui/coach-data.js`) from 5 steps to 12: three new
  framing-only steps first (Your first day / Rules of engagement / Your
  assigned scope — real Day-1-supervisor content, matches the "labs as
  supervised procedure" framing below), then the existing 5 Lab-1
  tool-tour steps unchanged, then 4 new steps covering Lab 2's NST-2407
  incident view (queue → assigned-case banner → Escalate button → Submit
  Module Lab button, using the new `#m01-assigned-case-callout` /
  `#m01-escalate-btn` / `#m01-submit-lab-btn` ids added to `ui/views.js`).
  Live-verified all 12 steps end to end, including the finish flow closing
  the simulator tab and returning focus to the portal tab. No console
  errors. One real side effect confirmed live: stepping through the tour's
  "This one is yours" step genuinely ticked the portal's "Open the assigned
  incident" requirement checkbox — the tour exercises real telemetry, not a
  disconnected demo.
- `node --check` clean on every touched `.js` file. Not yet committed —
  adds to the same already-large uncommitted working tree described below.

## Design framing to keep in mind — labs as supervised on-the-job procedure (2026-09-18)

Owner framing, worth preserving for anyone touching lab/assessment design:
**each hands-on lab is a procedure the L1 analyst follows based on what their
supervisor (the module's briefing/case framing) tells them to do, and the
graded portion is that analyst's performance "on the job"** — not a separate
worksheet, quiz, or self-report about the work. This is exactly the same
principle behind the 2026-09-17 "work performed in the simulated SIEM is the
assignment" decision above; it's the general rule that decision is one
instance of. When designing or reviewing any module's lab, ask "would a real
supervisor accept this as evidence the analyst did the job," not "did the
student fill out the form correctly."

## Nav rail consistency pass, same day (2026-09-18)

Standardized the module nav rail across all 12 SOC Analyst modules per live
owner feedback while looking at Module 1:

- Renamed every module's hands-on-lab nav section to **"Module Lab"**
  (singular), replacing whatever it said before: M01 "Guided Labs", M02/M03
  "Guided Lab", M04 "Detection Lab", M05 "Endpoint Lab", M06 "Threat Hunt
  Labs", M07 "Investigation Lab", M08 "Prioritization Labs", M10 "Evidence &
  Incident Labs", M11 "Operations & Reporting Labs". M09 previously listed
  its guided lab and independent drill as two separate top-level nav rows
  ("Guided ransomware response" / "Independent response drill") even though
  they render inside one page section — merged into one "Module Lab" row,
  gated on both sub-states completing, matching the pattern already used by
  M06/M08/M10/M11 (multiple internal completion flags, one visible row).
  M12 (capstone) left alone — its Mission Requirements / Investigation
  Consoles / Assessment rows are phases of one integrated capstone, not
  parallel labs, and it was already the outlier that's *right*.
- Module 1 was the only module with Knowledge Check placed *after* the lab
  in both the nav order and the rendered page order. Every other module
  (M02-M11) already orders Lecture/Foundations → Knowledge Check → Lab →
  Review. Reordered M01 to match: Foundations → Knowledge Check → Module Lab
  → Module Review → Sources & Further Reading. Did **not** touch
  `moduleOneProgress()`'s completion formula or `moduleOneSyncCompletion()` —
  those still require knowledge-check-passed AND both lab flags before
  self-certifying complete to the backend, same as before. Changing that
  crediting logic is a bigger, riskier change than a reorder and wasn't part
  of what was asked; flagging it here in case a future session wants to
  revisit whether Module 1 should stop self-certifying client-side the way
  modules 2-11 don't.
- Module 1's hero stat block showed a raw "Labs complete 0/2" fraction that
  read as broken/inconsistent (every other module's hero shows a single
  Complete/In progress/Not started status, never a lab count). Replaced it
  with the same single-status format. Did not touch M07/M08/M10's hero
  blocks, which have their own different-but-also-fractional lab-count
  phrasing ("Labs: N", "Practical labs X/Y passed", "Independent labs Y /
  Completed X/Y") — those weren't what was on screen when this was flagged,
  and rewriting bespoke hero copy across those files is a separate,
  larger pass if the owner wants full consistency there too.
- Also moved Module 1's "How activity becomes analyst work" /
  "Incident response lifecycle" / "Your five-step triage loop" widgets from
  three standalone nav sections into inline companion reading inside
  Foundations, positioned right after the lesson each one illustrates
  (L5, L6, L8 respectively) — they were previously separate top-level
  sections despite being pure supplementary reading with no completion
  state of their own.
- `node --check` clean on all 11 touched module files; live-verified via
  browser on `9334491415-SOCAN` (Module 1, freshly-enrolled/untouched) and
  `4437023872-SOCAN` (100%-complete, capstone-ready — used to view modules
  02/09/10 fully unlocked). No console errors.
- **Heads up, unrelated to this pass:** while verifying Module 1 still
  rendered correctly, noticed `moduleOneLab2Score()` / `moduleOneLab2ScorePanel()`
  and a submit handler referencing `lab2Data.handoffFields` /
  `handoffMissing` (around the old `#m01-lab2-form` submit path) are still
  defined in `portal/soc-analyst-module-01.js`, but the `<form
  id="m01-lab2-form">` markup they operated on was removed as part of the
  NST-2407 simulator rework described above — looks like orphaned dead code
  from that same uncommitted change, not something this session touched or
  fixed. Worth a look during the "review the local diff before shipping"
  pass already planned above.

## Current owner direction — SIEM performance assessment (2026-09-17)

The owner has made a firm design decision for the six-week SOC internship
experience: **work performed in the simulated SIEM is the assignment.** Do not
reintroduce a parallel LMS worksheet, duplicate alert queue, copied timeline,
or mandatory handoff-note card as the assessed artifact.

This session removed Module 1's entire “Independent decision record / Work the
case across three handoffs” card and added the NST-2407 fixture to the simulator
as a four-alert Sentinel incident (identity, endpoint, proxy, and user callback).
Module 1 now launches `NST-2407` directly in the simulator. Changed files:

- `portal/soc-analyst-module-01.js` — removed the duplicate Lab 2 card;
- `ui/data.js` and `ui/views.js` — added and identified the assigned
  simulator case;
- `portal/data.js` — reframed Lab 2 as simulator-first;
- `MODULE_01_ENHANCEMENT_BRIEF.md` and `ASSESSMENT_REPORTING_SPEC.md` —
  contain the approved assessment and faculty-review model.

**Implementation now in the working tree (2026-09-18, not yet committed):**
NST-2407 now reports allow-listed incident, alert, identity/device-pivot, and
escalation actions back to its portal opener. “Complete Module” submits that
simulator-performance record to the existing grading queue as **pending faculty
review**. The faculty card shows overall/per-competency pass percentages,
completed/missed/unsafe actions, and editable generated recommendations; its
actions read **Return for remediation** and **Approve submission**. New
`20260918100000_module_one_faculty_performance_gate.sql` makes Module 1
ineligible for verified completion until its submitted attempts are faculty
approved (reviewer and timestamp present, no redo), so Module 2 remains locked.

Before shipping: review the local diff, apply that migration to the linked
Supabase project, then run a live student-to-faculty approval/remediation pass.
The migration was deliberately written but not deployed in this session.

## New workstream queued for a fresh session (owner: run via Codex)

`module-completion-integrity/BRIEF.md` — spec only, NOT STARTED. Modules
2-12 trust the coarse `module_progress.state === 'complete'` flag directly
in `moduleCompletion()`; only Module 1 requires the stricter per-field
detail-beacon corroboration it was given 2026-09-16. Same class of bug,
not yet generalized. Confirmed safe to do freely right now: no real
students enrolled yet, this environment is pre-launch staging despite
being deployed to the production GitHub Pages repo — re-confirm that's
still true before shipping if picked up much later. Read that file's
"Reference implementation" section before writing any code; it points at
the exact working Module 1 pattern to replicate.

## Just shipped, same day (2026-09-16), later session

Sprint 3 and a new Sprint 4 from `MODULE_NAV_SIDEBAR_SPRINT.md`, committed
as `7c59e22` — **committed but NOT pushed**, push auto-deploys to the live
GitHub Pages site and needs explicit confirmation first:

- Sprint 3: removed the now-redundant per-module hero CTAs (modules 01-04,
  08, 09 — the other 5 SOC modules never had one, module 12's is a
  different, functional simulator-launch button and was left alone) now
  that the quick-nav rail covers the same "jump to current position" job.
  Also removed the shared `.mnav-continue` "Continue to X" chip-bar link
  from `moduleProgressShell()` — the original spec said keep it, but live
  owner testing of Module 01 this session asked for it to go too, now that
  the rail replaces it across all 12 modules.
- Sprint 4 (new, from the same live owner-testing pass): Module 01's
  "Module progress checklist" section (duration/status per item, a
  running total) is now collapsible, closed by default, using the same
  toggle pattern as the module's other sections — it was always fully
  expanded and duplicated what the rail already shows. Checked: no other
  SOC module has this section, so this was Module-01-only.
- `node --check` on every touched file, `node bin/portal-check.js` (38/38
  clean), and live DOM verification via `javascript_tool` on Module 01 as
  `4437023872-SOCAN` (screenshot capture was intermittently timing out
  this session — verified via direct DOM state checks instead, plus one
  clean screenshot once the flakiness cleared).
- One open judgment call, not yet resolved: the owner's live phrasing was
  "nest it into an outer menu that says Foundations" — the checklist kept
  its own "Module progress checklist" heading (accurate, since it lists
  the 2 labs too, not just lessons) rather than being renamed/merged into
  the "Foundations" section. Confirm with the owner whether that reading
  was right, or whether they wanted it literally folded into/relabeled as
  Foundations.
- **Push confirmation still needed** before this reaches the live site,
  and a live visual re-check of Module 01 (rail, collapsed checklist,
  hero) plus a spot check of one other edited module (e.g. 08) once
  screenshot capture is reliably working again.

## Just shipped, same day (2026-09-16)

A separate session (browser-available) did a module UX pass, all pushed to
`master`:

- `c8c2c78` — a locked/not-yet-unlocked module's own "evidence recall"
  fill-in-the-blank widget was rendering on top of its lock screen,
  leaking real incident details for content the student hadn't unlocked.
  Fixed: gated behind the same `hasModuleAccess()` check as the module body.
- `941d3f8` / `MODULE_NAV_SIDEBAR_SPRINT.md` (now DONE, Sprints 1-2) —
  owner feedback: module duration read as lecture length ("8 Hours"), and
  there was too much scrolling to reach current progress. Shipped across
  all 12 SOC modules: `formatHandsOnDuration()` reframes the hero-kicker/
  program-card duration as hands-on time; `moduleQuickNavRail()` adds a
  persistent sticky left rail (desktop) / slide-out drawer (≤920px) listing
  every lesson and lab with click-to-jump and current-position highlight.
  **Sprint 3 (remove the now-redundant `.mXX-hero-action` "Begin with the
  foundations" buttons) is the one piece left** — see that doc's Sprint 3
  section for exactly what to remove and why it's safe now that the rail
  covers the same "resume" affordance.
- `a100be4` — fixed the `.mnav-chips` pill-overflow bug a concurrent
  session had in progress, and a real regression it exposed: a same-day
  "always show the loading takeover immediately" change to
  `beginRouteLoading()` broke the pre-existing in-page-anchor guard in
  `render()`, so clicking "Continue to Foundations" (or any mnav-chip
  target, or a lesson anchor) stranded the student on the branded loading
  spinner forever instead of scrolling to the section. Fixed by making
  `beginRouteLoading()` recognize the same in-page-anchor condition and
  skip the takeover for it.

**Two things flagged, not fixed — need an owner decision, not more code:**

1. Training account `8987495051-SOCAN` (previously the one fully-backfilled
   Module 1 beacon account) is now showing **Disenrolled, since
   2026-09-16** in the admin Enrollment Planning table. Not from the
   cohort-archival cron (`Archived Students` list is empty — no snapshot
   was created), so it looks like a manual toggle flip, plausibly from a
   concurrent session. Confirm whether that was intentional before
   re-enrolling it.
2. Live-testing modules beyond Module 1 is still blocked on every other
   SOC training account (`4437023872`, `9334491415`, `5520852787`) by the
   pre-existing Module 1 completion-beacon gap (see
   `lab-grading-notification-system/STATE.md`'s last section for the exact
   backfill values) — this is the same permission-blocked admin batch
   write flagged before, not new. Until it's resolved, a full live
   walkthrough of the new rail on modules 2-12, and the still-outstanding
   Module 09 ticket-panel / Module 06 hunt-framing live sanity check below,
   can only be done on Module 1.

## Active workstream: SOC Analyst track reimagining

Read `soc-analyst-track-reimagining/STATE.md`, then `REBUILD_PLAN.md`.

The next implementation candidate is **Arc A (Modules 02 → 03)**. It needs
content reconciliation—not just linking copy—so the identity and
lateral-movement evidence agrees across both modules. Use an owner
content-review checkpoint before shipping it.

**Arc B is not ready:** the previously proposed Modules 07 + 04 pairing was
rejected as too forced. Agree a different pairing with the owner before
planning or coding that arc.

## Verification to schedule when a browser is available AND account access is unblocked

- Live-sanity-check the Module 09 ticket-assignment panel and Module 06
  Module-05-to-06 hunt framing — still not done; every account that could
  reach them is either beacon-gapped (see above) or disenrolled.
- Live-check the new quick-nav rail (Sprint 2 above) on a module past 01
  once an account can reach one, plus the mobile slide-out drawer at a
  real narrow viewport (this session's `resize_window` calls didn't
  actually resize the underlying browser window in this environment).
- If reporting work resumes, run the authenticated PDF edge-case matrix;
  server-side reporting migration/storage remains a deployment concern.

## What is not an active task

The grading/notification system is complete. The full chronological handoff,
including completed September sessions and prior open-item context, is at
`archive/session-logs/NEXT_SESSION_THROUGH_2026-09-16.md`.
