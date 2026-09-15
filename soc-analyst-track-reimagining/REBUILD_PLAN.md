# Rebuild Plan — SOC Analyst Track Lab Depth & Scoring

**Date:** 2026-09-15. Owner decisions below resolve the open questions in
`LAB_DEPTH_AND_SCORING_OVERHAUL.md` and `MODULE_DEPTH_AUDIT.md`. This is
the first document in this directory that authorizes actual code changes
to the curriculum — everything before it was planning/audit only.

## Owner decisions (2026-09-15)

1. **Section shape: varies by domain.** Keep one canonical *scoring
   pattern* (named weighted sections, critical-error flags, a surfaced
   breakdown) but let the actual lifecycle-stage content differ per
   domain — Module 06 (hunting) and Module 08 (vulnerability management)
   get domain-appropriate stages instead of a forced IR
   intake/investigate/contain/triage/remediate template.
2. **Rebuild priority: breakdown UI first.** Surface the section scores
   that already exist in every module's `result` payload — student result
   view and the admin grading queue — before touching any curriculum
   content. Shared, low-risk, touches all 12 modules at once, and closes
   the `lab_attempts.result` "sections shape" gap
   `../lab-grading-notification-system/00_SCAN_AND_GAP_COMPARISON.md`
   already flagged.
3. **Cross-module incident arc: keep it.** Modules 09–12's shared
   `INC-4937`/"Operation Cedar Lock" incident is the pattern going
   forward — a handful of multi-module arcs, not a requirement that every
   single module be its own fully standalone case. Modules 02–08 can be
   grouped into their own arcs (or extended in place) rather than forced
   into 7 separate one-module incidents.
4. **Module 1's guided-triage lab: stays as Module 1**, relabeled from
   graded lab to tour/tutorial. No sequence or routing change — same
   module number, same place in the product, different framing and no
   longer gated behind the 70% pass/completion logic the way an assessed
   lab is.
5. **Section weighting:** not a blocking decision — left as an
   implementation detail to set per module/arc during the actual rebuild,
   using each module's existing point weights (already real, already
   tuned by whoever wrote them) as the starting baseline rather than
   inventing new numbers up front. Revisit per-module if a weighting
   looks obviously wrong once the sections are actually visible.

## Phased plan

### Phase 1 — Surface the existing breakdown (next, in progress)
No curriculum/lab-content changes. Every module's score function already
returns `{ score, breakdown: {...}, feedback: [...] }` — none of that
`breakdown` data is rendered anywhere today.
- **1a. Admin grading queue** (`portal/app.js`, `adminGradingQueuePanel()`):
  currently dumps the whole `result` JSON into a collapsible `<pre>`. Add a
  proper per-section rendering (section name + points earned/possible) above
  that raw-JSON fallback, reusing `row.result.breakdown` where present. This
  is centralized — one function, one file — so it's the fastest real win
  and unblocks instructors seeing structured section scores instead of a
  JSON blob.
- **1b. Student-facing per-module result panels**: each module
  (`portal/soc-analyst-module-NN.js`) renders its own feedback block inline
  (`m0N-independent-feedback` pattern) — not centralized, so this is an
  11-file change. Add a shared rendering helper (e.g. in `data.js` or
  `lab-runtime.js`, wherever the existing cross-module helpers live) that
  takes a `breakdown` object and a labeled-section map and renders a
  consistent "section: X/Y" list, then wire each module's feedback panel to
  call it instead of showing only the flat score. Good candidate for a
  parallel per-module sub-agent sprint (mirrors `bin/run-module-agents.sh`'s
  established one-Codex-process-per-module pattern) once 1a's shared
  rendering shape is settled, since every module writes to a different file.

### Phase 2 — Domain-appropriate lifecycle content
Per decision 1: keep the current `observation/analysis/decision/
communication` (or Module 09/12-style richer) section *names* as the
default IR-flavored shape, but let Module 06 and Module 08 use their own
domain-fit section names instead (e.g. Module 08 vulnerability management
might use intake/prioritization/remediation-plan/verification rather than
intake/investigate/contain/triage). No code changes until Phase 1 ships and
the shared rendering shape exists to build against.

### Phase 3 — Deepen the closest-to-bar module as the template
Module 09 (ransomware, closest to the full lifecycle per the audit) gets an
explicit ticket-assignment/intake beat added and its per-criterion
investigative depth extended, proving the deeper pattern once before it's
applied elsewhere.

### Phase 4 — Extend the rest
Modules 02–08, grouped into arcs per decision 3 rather than 7 independent
rebuilds — grouping specifics (which modules share an arc, and what each
arc's incident is) still need to be worked out once Phase 3 proves the
pattern.

### Not scheduled yet
The two known tool-exposure gaps (interactive CLI, PCAP analysis) from
`VISION.md` remain unaddressed — out of scope for this scoring/depth
rebuild specifically; revisit separately.

## Status
**Phase 1a shipped, 2026-09-15** — admin grading queue now renders the
existing score breakdown and auto-scored feedback as readable text instead
of a raw JSON dump (`portal/app.js`, `adminGradingQueuePanel()`), committed
and pushed. **Phase 1b (student-facing per-module breakdown) not started**
— it's a real 11-file change (each module renders its own feedback panel
inline, no shared helper exists yet) and needs its own scoping pass
(where the shared rendering helper lives, and — since each module's flat
`breakdown` object mixes top-level section totals with sub-criteria, e.g.
Module 04 has `observation/analysis/decision/communication` *and*
`grouping/metric/threshold/...` in the same object — which keys count as
"the section list" per module) before dispatching it as a sprint. Check
`STATE.md`'s sprint log for anything shipped after this note.
