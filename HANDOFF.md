# Engineering handoff index

For active direction, start with `ROADMAP.md`, then the governing
specification for its selected work item. This file records concise evidence
for that active item only; move finished entries to `archive/session-logs/`
or a focused completed-feature note. `NEXT_SESSION.md` is a compatibility
pointer and must not become a second task queue.

The prior chronological engineering handoff is preserved at
`archive/session-logs/HANDOFF_THROUGH_2026-09-10.md`.

## Module 1 orientation tour — reachability fix, 2026-09-21

Roadmap item 1's tour content (Day 1 framing, rules of engagement, assigned
scope, alert-queue/severity/filters/sign-in-log walkthrough) was already all
written in `ui/coach.js` / `ui/coach-data.js`'s `m01-orientation` coach, but
nothing in the portal ever linked to it — confirmed by grep, zero references
to `m01-orientation` outside its own definition. Not reachable "from the
beginning of Module 1" as the roadmap requires; only reachable by already
being inside the simulator for some other reason.

**Fixed:**
1. Added a "🧭 Take the Day 1 tour" link to Module 1's hero section
   (`portal/soc-analyst-module-01.js`, opens
   `${SIM_ORIGIN}?coach=m01-orientation&restart=1#/defender/alerts` in a new
   tab, same `target="_blank" rel="opener"` pattern as the module's existing
   "Reopen the log" link) — always visible, reopenable any time, gates
   nothing.
2. The tour's final 3 steps (`ui/coach-data.js`) still spotlighted
   `#/sentinel/incidents`, `#m01-assigned-case-callout`, `#m01-escalate-btn`,
   `#mnt-submit-btn` — the simulator-based NST-2407 investigation flow that
   the same-day commit `1add6d6` ("Refine Module 1 case console workflow")
   removed in favor of a portal-only ticketing console (`portal/data.js`
   dropped `lab-soc-escalation`'s `simEntry` entirely). Those steps would
   have failed to find their spotlight target. Replaced with one accurate,
   framing-only closing step describing the actual current flow (finish the
   tour, go back to Module 1, work the Case/Ticket console). Trimmed the
   coach's now-unused `allow` routes to match.

See `ROADMAP.md`'s "Locked Module 1 sequence" section for the bigger flagged
question this surfaced — the same `1add6d6` commit's removal of the
simulator step doesn't match that section's "simulator-first... SIEM"
language, and needs an owner decision (rewrite the policy language to match
the shipped design, or restore the simulator entry point). Not resolved
here; that's a real product call, not a bug fix.

**Verification:** `node --check portal/soc-analyst-module-01.js`,
`node --check ui/coach-data.js`, and `bash bin/ci-check.sh` all clean
(views: 129/129 render, dead NAV routes: 0). **Not live-browser verified —
the Claude in Chrome extension would not connect this session** (tried
twice, "extension is not connected"). A live click-through of the new tour
link (does the new tab actually open, does the tour actually run end to
end, does "Start your shift" correctly close the tab and return focus) is
still needed before this item can be called fully done, not just built.

## Pending scoping input — 2026-09-21

`HANDOFF_2026-09-21_EVIDENCE_LOG_SIFT_FINDINGS.md` — investigation only, no
code changed. Found that a masked-input, read-the-real-log evidence recall
mechanic (dense `SIGNIN_LOG_EVENTS` log table, per-fact `template`/`blanks`,
`moduleOneBlankForm`) is already substantially built for Module 1's ALT-1001
Practice It case but never wired into the live evidence-review UI. Owner
separately asked for exactly this kind of log-sifting mechanic, plus a
per-evidence "go to logs" button and the same treatment for the NST-2407
Prove It case. This is scoping input for `ROADMAP.md` item 3, which is not
yet unblocked — read that doc before starting any build from it.

## Current baseline — 2026-09-20

- `ROADMAP.md` is the canonical delivery queue.
- `INSTRUCTIONAL_ARCHITECTURE.md` (added 2026-09-20) is the detailed
  Learn it → Practice it → Prove it pedagogy reference — guidance-reduction
  curve, skill carryover, and the per-module "finished" rubric. Documentation
  only; no code changed. It does not override `MODULE_STANDARD.md` or
  `CURRICULUM_ALIGNMENT_ARCHITECTURE.md`.
- Module 1 begins with the required LMS orientation tour; the subsequent
  assessment is simulator-first and instructor-reviewable.
- The next substantive build is the Module 1 performance assessment after
  orientation verification and controlled faculty-gate UAT.
- Arc A (Modules 02 → 03) remains queued curriculum work; Arc B is undecided
  and the old 07 → 04 proposal must not be built.
- Message Instructor is complete and universal: the persistent student-program
  and module banners open the same focused compose pane. Do not add separate
  module-specific message threads or compose flows.
- **Fixed and applied, 2026-09-20:** `username`/`name` in
  `buildCoreUserFromSession()` (`portal/app.js`) no longer falls back to the
  raw session email (domain and all) when a `students` row lookup fails —
  `emailToDisplayId()` strips the domain instead. The specific triggering
  account, `7634107909-SOCAN` (previously showing as
  `7634107909-socan@missionnext.example`), was repaired live via
  `supabase/migrations/20260920130000_fix_lowercase_socan_login_id.sql`
  (owner ran `supabase db push`, confirmed applied). No other accounts are
  known to be affected — same failure class as the earlier
  Module-1-beacon-gap accounts (see
  `lab-grading-notification-system/STATE.md`), worth a quick check if a
  similar lowercase/`@missionnext.example` display turns up again.
- CI validation is `bash bin/ci-check.sh`; GitHub Pages repeats it before
  deployment.
