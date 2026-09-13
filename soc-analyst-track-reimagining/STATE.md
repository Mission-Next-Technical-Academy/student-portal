# STATE — SOC Analyst Track Reimagining (read this first, in this directory)

**Last updated:** 2026-09-13 (later session).
**Status:** Vision + a real-code gap scan done. Owner then reviewed and
pushed back on lab depth and scoring — that feedback is captured. **Nothing
in the actual curriculum has been built, rebuilt, or changed yet** — this
whole directory is still planning.

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

## Next session starts here
1. Read the real, still-uncommitted Module 02–12 content
   (`portal/soc-analyst-module-02.js` through `-12.js`) directly against
   `LAB_DEPTH_AND_SCORING_OVERHAUL.md`'s bar — don't assume it clears the
   bar just because its own QA doc says "done."
2. Resolve that document's 4 open questions with the owner (do lifecycle
   sections vary per module, section weighting, rebuild priority order,
   where the Module 1 guided tour lives) before writing any rebuild plan.
3. Only then write a per-module rebuild plan — not before.

## Related project
`../lab-grading-notification-system/` — the grading/notification system
this overhaul's scoring model is meant to feed. Its `lab_attempts.result`
JSON needs the "sections" shape this document calls for; don't invent a
second, parallel scoring model.
