# Lab Depth & Scoring Overhaul — Owner Feedback

**Status:** Feedback captured. Planning only — nothing built or rebuilt yet.
**Owner framing, 2026-09-13 (later session), verbal.**

## The core critique

A module is claimed to take several days (2–3, per the root POA&M). What
currently exists per lab reads far shorter and simpler than that — "one
tiny investigation," not several days of work. Owner's words: **"the
triage must be the entire incident response lifecycle."** A lab that
resolves one alert in one sitting doesn't match the claimed depth, however
well-built that one piece is.

## What "deep enough" actually looks like

A module's assessed lab should be **one continuous case**, not a string of
disconnected single-skill drills under one title. Concretely, it needs to
show what it actually looks like to:

1. **Get assigned the ticket/incident** — picked up or handed a real
   queued item, not dropped straight into a pre-framed scenario.
2. **Investigate** — real multi-source evidence work (ties to the
   tool-exposure gaps already flagged in `VISION.md` §4 — SIEM, CLI, PCAP,
   etc., as each module calls for).
3. **Isolate / contain** — a real, concrete containment action, not a
   checkbox standing in for one.
4. **Triage** — a severity/priority judgment grounded in what the analyst
   actually found during investigation, not asked as an isolated question.
5. …continuing into remediation, recovery, and reporting — this is the
   same "Do it" stage `VISION.md` §6 already describes (the full incident,
   front to back). This document is what actually fills that stage in with
   real requirements.

**Multiple competencies roll into one lab.** The lab isn't "the triage
skill-check" — it's the whole case, and triage is one moment inside it.

## Verdict: the existing labs need a redo

Owner's read: **"all the labs need redo I believe."** Treat the current
12-module lab set as needing a structural rebuild against the bar above,
not a light pass. This includes evaluating the already-built-but-uncommitted
Modules 02–12 content expansion (`NEXT_SESSION.md`, 2026-09-10 entries) on
its own merits against *this specific bar* — its own QA reports passing
`node` checks and live rendering, but that says nothing about whether it's
deep enough or shaped like a real incident lifecycle. Don't assume it
clears this bar just because it exists and is self-reported "done."

## Scoring: many parameters, sectioned percentages, one final score

- The score is built from **many parameters**, not a single pass/fail gate.
- Break it into **sections that mirror the lifecycle stages above**
  (e.g., Assignment/Intake, Investigation, Containment, Triage/Escalation,
  Remediation/Reporting) — each section carries its own percentage.
- Roll the section percentages into **one final score** for the lab — this
  is the number the 70%-per-lab-per-module gate
  (`../lab-grading-notification-system/`) actually gates against.
- **Real variance is expected and correct**, not a bug to eliminate: "some
  decisions can be a bit off and it can still pass... someone could get a
  72% or a 91%... it all depends on the analyst's performance on the lab
  itself." The scoring model has to support that spread — judgment quality,
  not just correct/incorrect clicks.

## Module 1: keep the guided pattern, change its job

Module 1's current lab ("Your First SOC Alert: A Guided Triage") is
explicitly hand-held. Owner's call: **that's good code and a good idea —
but it belongs as a guided tour/tutorial** to familiarize a student with
the tool and its functions, not as the graded, assessed lab this overhaul
describes. Wherever the actual graded experience ends up in the sequence,
it needs to be the deep, multi-competency, less-guided case above — Module
1's walkthrough is onboarding, not proof of competency.

## How this connects to work already in progress

- **`VISION.md` §6** (Learn it → Practice it → Prove it → Do it): the
  guided-tour idea is **Practice it**. The deep, multi-competency incident
  described here is **Prove it** / **Do it**.
- **The grading system** (`../lab-grading-notification-system/`) already
  has the pregrade → instructor-review → redo loop and a 70% gate on
  `lab_attempts.score` — this overhaul is what makes that score mean
  something, instead of a flat number. `lab_attempts.result` needs a real,
  standardized "sections" shape to carry per-section percentages — flagged
  as an open decision in that project's `00_SCAN_AND_GAP_COMPARISON.md`,
  now sharpened by this feedback into a concrete requirement.

## Open questions for next session

1. Do the lifecycle sections/parameters vary per module/domain, or is there
   one canonical shape every module's lab reuses?
2. Section weighting — equal weight across sections, or does e.g.
   containment count for more than triage?
3. Rebuild priority — one module first as a template (same approach used
   for the original 12-module build), or a different order?
4. Where does the Module 1 guided tour live in the product — still "Module
   1," a separate onboarding step before Module 1, or something else?

## Next step

Do not start rebuilding lab content yet. Next session should:
1. Read the real (uncommitted) Module 02–12 content directly against this
   document's bar — deep multi-stage incident with sectioned scoring, or
   not.
2. Resolve the four open questions above with the owner.
3. Only then write a per-module rebuild plan.
