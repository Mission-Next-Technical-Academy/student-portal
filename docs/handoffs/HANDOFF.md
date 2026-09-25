# Engineering handoff index

For active direction, start with `ROADMAP.md`, then the governing
specification for its selected work item. This file records concise evidence
for that active item only; move finished entries to `archive/session-logs/`
or a focused completed-feature note. `docs/handoffs/NEXT_SESSION.md` is a compatibility
pointer and must not become a second task queue.

The prior chronological engineering handoff is preserved at
`archive/session-logs/HANDOFF_THROUGH_2026-09-10.md`.

## Module 1 learner-facing lab names corrected, 2026-09-21

Module 1 now uses the requested stage names throughout the learner-facing
rail, progress summary, cards, and launch/resume actions: **Practice It →
Guided Lab** and **Prove It → Assessment Lab**. The former generic labels
"Module Lab" and "Module Review" remain only in unrelated historical notes
or internal implementation identifiers. The Assessment Lab LMS card is now
intentionally concise because the independent work belongs in its separate
case-console tab.

**Follow-up correction:** Guided Lab now gives immediate coaching feedback
after submission (scope, priority, disposition, and handoff guidance).
Assessment Lab deliberately gives no student-facing evaluative feedback or
score; it submits the independent case for teacher grading. The stages now
have separate completion flags, so finishing Guided Lab unlocks Assessment
Lab instead of leaving the learner in the amber current state.

Guided Lab's feedback now uses the exact case-record labels (Status, Affected
User, Affected Device, Severity, Disposition, Escalation required, Escalate
to, and Analyst Work Notes) and states the required correction. Its green
field highlights appear only for correct Guided Lab choices. Assessment Lab
starts with Select placeholders for every choice, including Status and its
own Affected User/Device dropdowns; it never shows correctness highlighting.

## Assessment review refresh and redo recovery, 2026-09-21

Learner program/module returns now re-fetch the institutional completion and
redo records. An instructor approval therefore clears a stale redo banner and
populates the module-completion dot from `student_verified_module_progress`
without relying on the learner's old cached session. The new
`admin_open_lab_redos` and course-scoped `faculty_open_lab_redos` views also
keep currently sent-back attempts visible in the Grading tab, where faculty can
reverse an accidental return with **Approve without resubmission**. That action
clears the same latest-attempt `redo_requested` flag the learner portal uses.

## Sources & Further Reading — detached "Reference" panel, platform-wide, 2026-09-21 (later still)

Owner feedback on the earlier same-day nav-grouping fix: the "Reference"
group I'd added still shared the drawer's bordered/shadowed box and sat
directly under "Prove It" with no real gap. Ask: detach it fully (its own
card, lower, not touching the progress menu) and roll the same treatment
out to every other module in every other course, not just SOC Module 1.

**Detachment (`portal/app.js`'s `moduleUnifiedNav()`):** the supplemental
group is no longer a trailing `<li>` inside `<ul class="munified-groups">`
(itself inside the bordered `.mquick-nav-drawer` card). It's now a sibling
`<div id="munified-supplemental-panel" hidden>` of the drawer, inside the
same `<aside>`, with its own border/radius/shadow and a 40px `margin-top` —
confirmed via `getBoundingClientRect()` live in Chrome (gap measured
exactly 40px, `suppIsSiblingOfDrawer: true`). Kept in sync with the mobile
hamburger toggle (`wireModuleQuickNavRail()` now also toggles
`#munified-supplemental-panel`'s `hidden`) and given the same desktop
`[hidden]`-override CSS rule the drawer already needed, for the same
reason (the element always renders with `hidden` — the mobile closed
state — and must stay visible on the persistent desktop rail).

**Platform-wide rollout.** Investigated first rather than assuming: only
Module 1 used `moduleUnifiedNav()` directly, but `moduleProgressShell()` —
called by nearly every other module across every course — turned out to
already be a thin compatibility wrapper around the exact same function.
So the nav mechanism was already shared platform-wide; the only missing
piece per module was a `supplemental: true` nav-section entry pointing at
that module's existing (or, for IT Support, newly added) Sources content.

- **SOC Analyst modules 2–11** (`portal/soc-analyst-module-0{2..9}.js`,
  `-10.js`, `-11.js`): added the nav entry, pointing at each module's
  existing sources heading id (`m0X-sources` etc.) — added a missing
  wrapper `id` for modules 2–4 only, which had none. Module 12 (capstone)
  has no sources content to point at; left alone.
- **AI-ML modules 1–12** (`portal/ai-ml-module-*.js`): same, pointing at
  each module's existing `aimNN-sources` id — all 12 already had it.
- **IT Support modules 3–11**: shared `itsSimpleModuleView()`
  (`portal/it-support-shared.js`) gained an optional `sources` param,
  rendering a new Sources section plus the nav entry in one place;
  `itsRegisterCoachModule()` now threads `sources` through from each
  module's own `itsRegisterCoachModule({...})` call. **Modules 1, 2, 12**
  use their own bespoke layout (not `itsSimpleModuleView`) — added the
  section + nav entry directly in each.
- **IT Support had zero references content before this** (confirmed by
  grep) — wrote real citations per module's actual topic: RFC 791/950 for
  module 4 (IP addressing), NIST SP 800-63-3 for module 6 (identity),
  Microsoft Learn Hyper-V/AD DS/BitLocker/winget/RDS docs for
  modules 2/3/5/6/7/8, CISA phishing guidance + NIST SP 800-61 for module 9
  (security incidents), CompTIA A+ for modules 1/10/11/12 (ticketing,
  documentation, professional conduct — no single stable free citation
  fits those as well as an existing precedent).
- **Electrical module 1** deliberately excluded — it's an unauthored
  placeholder stub (own comment: "curriculum content is being authored"),
  so there's no real content to cite; adding a fabricated Sources section
  there would be decoration, not reference material.

**Verification, without fighting a broken screenshot tool:** the Claude in
Chrome screenshot capture returned blank frames all session for reasons
unrelated to the page (confirmed via `javascript_tool` DOM inspection that
content was present and correctly positioned every time a screenshot came
back blank) — stopped trying to force it and used direct evaluation
instead. For the platform-wide rollout, built a one-off script
(`bin/portal-check.js`'s exact VM-stub/sign-in-as-`user2` approach, copied
to the scratchpad and extended to dump each module's rendered HTML) and
confirmed all 35 modules that should have it do: `supp=true ref=true
sources=true` for SOC 1–11, IT Support 1–12, AI-ML 1–12; correctly
`false` only for SOC 12 and Electrical 1. `bash bin/ci-check.sh` clean
throughout (129/129 simulator views, all portal modules render).

## Module 1 case console — Prove It ported, Sources nav fix, 2026-09-21 (later)

Continuation of the same day's case-console build. Two owner asks, both done:

1. **Prove It (NST-2407) ported to the same case-console pattern as Practice
   It.** Added `logEvents` to `MODULE_ONE_ESCALATION_LAB.scenario`
   (`portal/data.js`) — 8 rows across the identity/endpoint/proxy sources
   this case correlates (MFA denials → approval → sign-in, process
   creation, network connection, proxy upload), each expandable to a raw
   record, same mechanic as ALT-1001's log table. Added
   `moduleOneProveItLaunchCard()` / `moduleOneProveItCaseConsolePane()` /
   `viewModuleOneProveItCaseConsole()` (`?console=prove`) and
   `wireModuleOneProveItCaseConsole()`, mirroring Practice It's structure.
   `moduleOneReview()` (the LMS page) now shows just the launch card, not
   the embedded console. Removed the now-dead `#m01-review-dynamic` wiring
   block it replaced. Fixed a real gating bug this surfaced: the phone-
   callback evidence item ('owner') has no log row by design (it's handed
   over, not investigated), but `moduleOneProveItPerformance()` requires
   *all* evidence reviewed before Submit Case unlocks — so it could never
   have unlocked. Fixed by auto-crediting 'owner' in `moduleOneLoad()`.
2. **"Sources & Further Reading" was structurally its own nav group already
   (`moduleUnifiedNav()` in `portal/app.js` already filters `supplemental:
   true` sections out of the Learn/Practice/Prove phases), but that group
   had no header row** — so it rendered directly under "Prove It" with no
   visual break, reading as part of it. Added a muted "Reference" header
   row (same `.munified-phase-row` pattern as the other phases, new
   `.munified-supplemental-row` styling) so it's visually distinct.
   Live-verified via DOM query: nav now groups as Learn It → Foundations,
   Practice It → Knowledge Check + Module Lab, Prove It → Module Review,
   **Reference → Sources & Further Reading** (its own group).

`node --check` and `bash bin/ci-check.sh` clean throughout. Verified live in
Chrome as `9334491415-SOCAN` via direct DOM inspection (`javascript_tool`) —
the screenshot tool itself was returning blank captures all session despite
correct DOM/content, a tool-side issue, not a page bug; didn't fight it
further once DOM inspection confirmed correctness.

## Module 1 case console — Practice It built, 2026-09-21

Owner delivered `docs/specs/MODULE_01_CASE_CONSOLE_SPEC.md` (now the authoritative
Module 1 lab design — read it first) with an explicit, concrete complaint:
Module 1's lab had no realism, and every lab on the platform should have a
"Launch Module Lab" button that opens a new window — a small focused
workspace, not the full SOC range and not embedded in the LMS page.

**Built for Practice It (ALT-1001) this session:**
- `portal/soc-analyst-module-01.js`: `viewModuleOneCaseConsole()` — a
  full-bleed, three-pane case console (Alert Queue / Logs+Evidence /
  Incident-Case Record), opened in a new tab via a `?console=practice`
  query param on Module 1's own route (no new router entry needed — same
  page, same session, different render branch).
- `moduleOneLogTable()` / new `logEvents` data (`portal/data.js`): 9 real
  sign-in-log rows (8 failures + 1 success for j.santos/185.220.101.24,
  matching the existing case facts), each expandable into a raw
  `key=value` structured record on click — replacing the old instant
  "click evidence → instantly marked reviewed" theater with a real
  "open the log, then it's marked viewed" action.
- The LMS page's embedded console (`moduleOneLabDynamic()`) was stripped
  down to just the launch card + a status line, per the spec's "must not
  remain embedded as a small card inside the LMS."
- Reused the existing `moduleOneTicketFields()` ticket record, action
  history, and save/submit logic almost unchanged — only the evidence
  mechanism and the page shell around it are new.
- Fixed two real bugs found live-testing: (1) `.m01-submit`/`.m01-reset`
  buttons only got their padding/border-radius/font from a rule scoped to
  `.m01-actions button` — the ticket's Save/Submit Case buttons sit in
  `.m01-ticket-actions`, a different class, so they rendered undersized
  and inconsistent with every other button on the platform; fixed by
  adding `.m01-ticket-actions button` to that base rule (module-labs.css)
  and giving the actions row `justify-content: space-between` to match
  the spec's `[ Save ]  ...  [ Submit Case ]` layout. (2) "Back to Module
  1" only changed `location.hash`, leaving `?console=practice` in the URL
  and silently reopening the same console — fixed by building the href
  from `location.pathname` instead of a bare `#...` string.
- Live-verified end to end in Chrome, signed in as `9334491415-SOCAN`:
  launch card → console opens in a new tab → log rows expand and record
  real actions → ticket fields fill in → Submit Case shows "Case
  submitted... there is no live score" → completion state round-trips
  back to the LMS card ("Resume Module Lab" → "Review the case", green
  "Case worked and checked." banner) → "Back to Module 1" actually
  leaves the console this time.
- `node --check` and `bash bin/ci-check.sh` clean throughout (129/129
  simulator views, all portal modules).

**Not done, explicitly out of scope this pass:** Prove It
(`moduleOneProveItConsole()`, the NST-2407 case) still uses its older
embedded-in-page console. The spec applies to it too — same three-pane
shape, same "not the full SOC range" rule — but porting it to the new
`?console=<stage>` launch-card pattern is real, separate work. Do that
next, reusing this session's mechanism rather than inventing a second one.

See `ROADMAP.md`'s "Locked Module 1 sequence" for the corrected policy
language (the old "simulator-first" framing is superseded) and the noted
tension with the orientation tour, which still opens the full simulator
and was explicitly left alone this session (owner: "the tour is fine").

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

`archive/historical-plans/HANDOFF_2026-09-21_EVIDENCE_LOG_SIFT_FINDINGS.md` — investigation only, no
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
- `docs/specs/INSTRUCTIONAL_ARCHITECTURE.md` (added 2026-09-20) is the detailed
  Learn it → Practice it → Prove it pedagogy reference — guidance-reduction
  curve, skill carryover, and the per-module "finished" rubric. Documentation
  only; no code changed. It does not override `docs/specs/MODULE_STANDARD.md` or
  `docs/specs/CURRICULUM_ALIGNMENT_ARCHITECTURE.md`.
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
  `docs/workstreams/lab-grading-notification-system/STATE.md`), worth a quick check if a
  similar lowercase/`@missionnext.example` display turns up again.
- CI validation is `bash bin/ci-check.sh`; GitHub Pages repeats it before
  deployment.
