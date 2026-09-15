# STATE — SOC Analyst Track Reimagining (read this first, in this directory)

**Last updated:** 2026-09-15.
**Status:** Vision, gap scan, and the full Module 02–12 depth audit are all
done. **Nothing in the actual curriculum has been built, rebuilt, or
changed yet** — this whole directory is still planning, waiting on the
owner's answers to the open questions below before any rebuild plan gets
written.

## Read in this order
1. `VISION.md` — CySA+ framing, the real tool-exposure gap scan (CLI and
   PCAP are the two genuinely missing pieces), and the Learn it → Practice
   it → Prove it → Do it per-module structure.
2. `LAB_DEPTH_AND_SCORING_OVERHAUL.md` — owner's follow-up critique after
   seeing the grading system live: current labs read too short/shallow for
   a multi-day module ("the triage must be the entire incident response
   lifecycle"), labs need a structural redo (ticket assignment →
   investigation → isolation → triage → remediation/reporting, one
   continuous case, multiple competencies), scoring needs many parameters
   in weighted sections rolling into one final score (real variance, e.g.
   72% vs. 91%, is correct behavior, not a bug), and Module 1's existing
   guided-triage pattern should become a tutorial/guided-tour, not the
   graded lab itself.
3. **`MODULE_DEPTH_AUDIT.md` (new, 2026-09-15)** — the real-code audit of
   Modules 02–12 against that bar. Headline finding: every module already
   scores its lab as named weighted sections (observation/analysis/
   decision/communication, or Module 12's 10-domain variant including a
   `Triage` domain) rolling into one final score with real variance —
   structurally much closer to the ask than feared. The real gaps are
   narrower: the section breakdown is computed but never shown to anyone,
   no module has an explicit ticket-assignment moment, containment is
   often folded into "decision" rather than scored separately, and two
   domain-mismatched modules (06 hunting, 08 vulnerability management)
   don't actually want an IR-shaped template. Also surfaces a real design
   fork the original 4 questions didn't anticipate: Modules 09–12 already
   run one continuous incident (`INC-4937`/"Operation Cedar Lock") *across*
   4 modules rather than inside one — read that doc's own open-questions
   section before answering question 1 below.

## Next session starts here
**Steps 1 and 2 are done.** The audit (`MODULE_DEPTH_AUDIT.md`) and the
owner's answers to the open questions (2026-09-15: vary section shape by
domain, breakdown-UI first, keep the cross-module incident-arc pattern,
Module 1 stays numbered as a relabeled tour) are both captured in
`REBUILD_PLAN.md`, which is now the live plan doc.

**Phase 1a shipped** (admin grading queue breakdown UI — see
`REBUILD_PLAN.md`'s Status section and this file's sprint log below).

**Next up: Phase 1b** — the student-facing per-module result panels (11
files, each currently renders its own inline feedback block with no shared
helper). Needs a short scoping pass first: where the shared
breakdown-rendering helper lives, and which `breakdown` object keys count
as the top-level "section list" per module vs. sub-criteria (see
`REBUILD_PLAN.md`'s Phase 1b note — Module 04's breakdown object mixes
`observation/analysis/decision/communication` totals with
`grouping/metric/threshold/...` sub-scores in the same flat object, and
that pattern likely repeats across modules). Once scoped, Phase 1b is a
good candidate for a parallel per-module Codex sprint, mirroring
`bin/run-module-agents.sh`'s existing one-process-per-module pattern.

## Related project
`../lab-grading-notification-system/` — the grading/notification system
this overhaul's scoring model is meant to feed. Its `lab_attempts.result`
JSON needs the "sections" shape this document calls for; don't invent a
second, parallel scoring model.

## Sprint log
- 2026-09-15 — Module 02-12 depth audit (`MODULE_DEPTH_AUDIT.md`). Done.
- 2026-09-15 — Owner resolved the open questions; `REBUILD_PLAN.md`
  written as the live plan doc.
- 2026-09-15 — Phase 1a (admin grading breakdown UI). Done, verified
  (unit-level VM render check + node --check + bin/portal-check.js 38/38),
  committed and pushed.
