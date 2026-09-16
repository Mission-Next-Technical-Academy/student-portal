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

**Phase 1b: not needed, closed 2026-09-16.** A first attempt (parallel
per-module Codex sprint wiring a new shared helper into all 11 files)
surfaced that every module's student-facing panel already renders its own
labeled score grid — the change was reverted before committing since it
would have shown the breakdown twice. See `REBUILD_PLAN.md`'s corrected
Phase 1b note and `MODULE_DEPTH_AUDIT.md`'s inline correction. Phase 1 is
fully done as of Phase 1a; nothing else needed here.

**Phases 2, 3, and the start of 4 are done as of 2026-09-16** — see
`REBUILD_PLAN.md` for full detail:
- Phase 2: done by inspection, no code needed (Modules 06/08 already
  domain-appropriate, not forced IR shape).
- Phase 3: Module 09 got its ticket-assignment framing panel. Shipped.
  Deeper per-criterion investigative extension is NOT done — a bigger,
  separate lift if wanted.
- Phase 4: Arc C (Modules 05→06) connective framing shipped as proof of
  concept. Arc A (02+03) and Arc B (07+04) are designed in
  `REBUILD_PLAN.md` but NOT built — they need real content reconciliation
  between each pair's fixtures, not just a framing sentence, and are the
  right next sprints.

**Live browser verification, 2026-09-16** (Chrome connected this session):
signed in as the real `8987495051-SOCAN` training account and confirmed
live, against production data: (1) the redo-completion gate — Module 02's
card shows "In Progress" (not "Complete") right alongside its red "Redo
requested" banner, exactly as designed; (2) Module 09's new ticket-
assignment panel renders correctly (INC-4937, Tier 1 queue, SLA clock,
role framing); (3) Module 06's "Why this hunt opened" bulletin correctly
cites Module 05's WS-LAB-27 finding as the hunt trigger. All three were
previously only unit/render-tested — now confirmed live in a real browser.

**Owner call, 2026-09-16, on Arc B:** Modules 07+04 (email/PKI ↔
identity/network) is "a bit of a stretch... perhaps different tickets
here" — owner does not want that pairing forced. Arc A (02+03) is
confirmed fine to build. **Arc B needs a different pairing** — not yet
decided which modules; don't build 07+04 as designed in `REBUILD_PLAN.md`.

**Next up:** (1) resolve what Arc B should actually pair (not 07+04) with
the owner, (2) build Arc A (02+03) content reconciliation — real curriculum
judgment (which entities/details change so both modules' fixtures agree),
ideally with an owner content-review checkpoint before shipping.

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
- 2026-09-16 — Phase 1b attempted, found unnecessary, reverted before
  committing (every module's student panel already had its own score
  grid). Docs corrected. Phase 1 fully closed.
- 2026-09-16 — Phase 2 closed by inspection (no code needed). Phase 3's
  ticket-assignment framing shipped to Module 09. Phase 4's Arc C
  (Modules 05→06) connective framing shipped as proof of concept; Arc A
  and Arc B designed but not built.
