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
**Step 1 (read the real Module 02–12 content against the bar) is done —
see `MODULE_DEPTH_AUDIT.md`.** What's left:
1. Resolve the open questions with the owner — the original 4 from
   `LAB_DEPTH_AND_SCORING_OVERHAUL.md`, now informed by the audit's
   findings/recommendations, plus the new one the audit surfaced (keep the
   09–12 cross-module incident-arc pattern, or move toward every module
   being self-contained?).
2. Only then write a per-module rebuild plan — not before. The audit's own
   recommendation, if useful as a starting point: surface the existing
   section breakdown in the UI first (shared, low-risk, feeds the grading
   system's `lab_attempts.result` sections-shape gap too), then use Module
   09 as the template to extend (closest to the bar already), then the
   domain-mismatched modules (06, 08), then the rest.

## Related project
`../lab-grading-notification-system/` — the grading/notification system
this overhaul's scoring model is meant to feed. Its `lab_attempts.result`
JSON needs the "sections" shape this document calls for; don't invent a
second, parallel scoring model.
