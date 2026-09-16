# Next session — start here

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

