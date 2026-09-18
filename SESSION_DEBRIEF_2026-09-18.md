# Session debrief — 2026-09-18

Working session on the SOC Analyst track, centered on Module 1. Started from
a simple ask (log in as a test account and page through coursework) and
expanded, live, into a full pass on Module 1's reading structure, the nav
rail across all 12 modules, the NST-2407 case's branding and submission UX,
and a first-day orientation tour. Nothing in this debrief is committed —
see "Not committed" at the bottom.

## 1. Test account survey

Logged into all four `SOCAN` training accounts to find one sitting at "not
complete, only working on Module 1." Findings, since they're useful context
for anyone testing again later:

- `8987495051-SOCAN` — disenrolled as of 2026-09-16 (per earlier session
  notes), not usable.
- `4437023872-SOCAN` — actually 100% complete, capstone-ready. Useful going
  forward as the "everything unlocked" account for testing modules 2-12.
- `9334491415-SOCAN` — 0% complete, still enrolled. Landed on this one;
  opened Module 1 without submitting any work, per your instruction to just
  open it.
- `5520852787-SOCAN` — not enrolled in the SOC Analyst track at all.

## 2. Module 1 reading structure

Three widgets ("How activity becomes analyst work," "Incident response
lifecycle," "Your five-step triage loop") were standalone top-level nav
sections despite being pure supplementary reading with no completion state
of their own — and one of them, "2 Performance Labs" on the module-01
catalog card, was flagged as an inconsistency (every other module has 1).

Fixed: moved all three inline into the Foundations reading, each placed
directly after the lesson it illustrates (L5, L6, L8 respectively) instead
of as separate sections a student has to notice exist.

## 3. Nav rail consistency, all 12 SOC Analyst modules

- Renamed every module's hands-on-lab nav section to **"Module Lab"**
  (was inconsistent: "Guided Labs"/"Guided Lab"/"Detection Lab"/"Endpoint
  Lab"/"Threat Hunt Labs"/"Investigation Lab"/"Prioritization Labs"/
  "Evidence & Incident Labs"/"Operations & Reporting Labs" depending on the
  module).
- Module 9 previously listed its guided lab and independent drill as two
  separate nav rows even though they render in one page section — merged
  into one "Module Lab" row.
- Module 1 was the only module with Knowledge Check placed *after* the lab,
  in both nav order and the rendered page. Reordered to match every other
  module: Foundations → Knowledge Check → Module Lab → Review → Sources.
- Module 1's hero stat showed a raw "Labs complete 0/2" fraction, the only
  module doing this. Replaced with the same single Complete/In
  progress/Not started status every other module shows.
- Module 12 (capstone) deliberately left alone — its three sections are
  phases of one integrated capstone, not parallel labs.
- Did **not** touch Module 1's actual completion-crediting logic (still
  requires knowledge-check-passed AND both labs before self-certifying to
  the backend) — that's real crediting behavior, not display, and changing
  it wasn't asked for. Flagged as an open question in `NEXT_SESSION.md` for
  whether Module 1 should stop self-certifying client-side the way modules
  2-11 already don't.

One thing checked and ruled out as a bug: briefly worried that visiting
Modules 9/10 directly by URL on the 100%-complete test account was a
gating bypass. Confirmed via `app.js`'s `hasModuleAccess()` check that it
wasn't — that account had genuinely completed every prior module, so
access was correctly granted, not skipped.

## 4. NST-2407 case: branding and copy

- "Northstar Finance" → **"Mission Next Labs"**, matching the fictional
  company already used throughout Module 1's own foundation lessons. The
  fictional identity's email domain changed to match
  (`a.chen@missionnextlabs.example`).
- Dropped the raw case ID from user-facing copy ("publications are not
  necessary"): the launch button now reads **"Open Mission Next SIEM"**
  (was "Open NST-2407 in simulated SIEM"), the lab heading reads "Mission
  Next Labs: investigate the correlated incident," and a banner in the
  simulator no longer says "Open NST-2407."
- Scoped to the NST-2407 case only. Deliberately **not** touched: Module 7's
  `northstar-suppliers.example` / `northstarr-payments.example` lookalike
  domains (an intentional phishing/typosquat teaching device — renaming it
  would break the lesson), and the IT Support track's much larger
  "Northstar Distribution Group" fixture set (a different program, AD/DNS/
  PowerShell content threaded through many exercises — out of scope, bigger
  blast radius, wasn't what was being looked at).

## 5. Simulator submission panel — real bug fix + clarity pass

- **Bug fixed:** the panel's paragraph text was invisible (white-on-white).
  A dark-card text-color rule (`.m01-siem p`) was leaking into a nested
  white card via CSS specificity/inheritance. Fixed in
  `portal/module-labs.css`.
- Replaced a flat "Still required: A; B; C; D..." run-on sentence with a
  real checklist showing all 8 requirements and their done/pending state.
- Gave the submit button real disabled styling (was vivid orange even when
  nothing had been done yet, which read as misleadingly clickable).

## 6. Submit from inside the simulator, then made floating

First pass: added a "Submit Module Lab" button inline in the NST-2407
incident view, next to "Escalate to incident response," wired through a new
`submit_for_faculty` postMessage action to the same finalization logic the
portal-side fallback button already used (extracted into one shared
function so both entry points do exactly the same thing).

Second pass, on your feedback that submission "should feel like an open
range": moved that button out of the inline card entirely and into the
simulator's existing floating corner dock (the same one that already had
"Take the tour" and "Coursework") — so it's reachable from any page of the
console, not just the one incident's card. Escalate stayed inline, since
that's a real page-specific action; submit is module-level work. Verified
live that the floating button persists across unrelated pages (Assets,
Advanced hunting).

## 7. First-day orientation tour

You asked for "a floating icon that does that" — click Next through
spotlighted steps covering orientation, rules of engagement, and scope. It
turned out this already existed: `ui/coach.js` / `coach-data.js` is a
full guided-tour engine (real element spotlighting, step progression, a
corner icon to launch it), already used for a 5-step "SOC workspace
orientation" tour on Module 1's *other* lab. It just wasn't showing up for
the NST-2407 case, because that lab's launch link never passed
`?module=soc-1` — a one-line link fix.

Extended that same tour from 5 steps to 12:

1. **Your first day** — Day-1 framing.
2. **Rules of engagement** — investigate and recommend, don't perform
   containment/isolation/account actions yourself.
3. **Your assigned scope** — stay inside what the evidence supports.
4-8. The original Lab-1 tool tour (alert queue, severity, filters, the
   sign-in log), unchanged.
9-12. New: the NST-2407 queue, the assigned-case banner, the escalate
   button, and the floating submit button.

Live-verified all 12 steps end to end, including the finish flow (closes
the simulator tab, returns focus to the portal tab) and one real side
effect: stepping through the tour genuinely ticked the portal's "Open the
assigned incident" requirement checkbox — it exercises real telemetry, not
a disconnected demo.

**Follow-up completed:** the last two steps now use the same map-style tone
as the rest of the tour: “The response handoff” describes the escalation
location and authority boundary, while “The module submission point” describes
the floating submission control and its supervisor-review destination.

## Verification done throughout

`node --check` clean on every touched `.js` file after each change. Live
browser verification at every stage (screenshots, console-error checks) on
both a fresh test account and the 100%-complete account, across the portal
and the simulator.

## Not committed

Everything above is sitting **uncommitted** in the working tree, alongside
a substantial amount of *other* uncommitted work from an earlier session
(the NST-2407 simulator/faculty-grading rework and an unapplied Supabase
migration, `20260918100000_module_one_faculty_performance_gate.sql`) —
see `NEXT_SESSION.md` for that session's own handoff notes. This session's
changes didn't touch that migration or its grading-queue logic, and were
verified not to conflict with it. Full modified-file list:

```
ASSESSMENT_REPORTING_SPEC.md          portal/soc-analyst-module-06.js
MODULE_01_ENHANCEMENT_BRIEF.md        portal/soc-analyst-module-07.js
NEXT_SESSION.md                       portal/soc-analyst-module-08.js
portal/app.js                         portal/soc-analyst-module-09.js
portal/data.js                        portal/soc-analyst-module-10.js
portal/index.html                     portal/soc-analyst-module-11.js
portal/module-labs.css                ui/app.js
portal/soc-analyst-module-01.js       ui/coach-data.js
portal/soc-analyst-module-02.js       ui/coach.js
portal/soc-analyst-module-03.js       ui/data.js
portal/soc-analyst-module-04.js       ui/index.html
portal/soc-analyst-module-05.js       ui/styles.css
                                       ui/views.js
```

Nothing here has been reviewed against the diff, staged, or committed —
that's a decision for you.
