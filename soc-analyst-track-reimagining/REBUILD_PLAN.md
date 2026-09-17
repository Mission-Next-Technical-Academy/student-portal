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
   lab is. **Execution design (not yet built as of 2026-09-17):
   `MODULE1_DAY1_REBUILD_PLAN.md`** — Day 1 orientation steps prepended to
   the coach walkthrough, the actual relabel/ungate, a new multi-task
   graded lab to replace it, mistake-mapped instructor feedback snippets,
   and a universal floating "back to coursework" shell button.
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
**Done by inspection, 2026-09-16, no code change needed.** Checked Module 06
("assisted hypothesis-led threat hunt") and Module 08 ("vulnerability
prioritization and exposure analysis") — both already describe themselves,
in their own header comments and content, as their own domain rather than a
forced IR shape: Module 06's decision content is hypothesis/scope/ATT&CK/
disposition (no fake containment step), Module 08's is priority/treatment/
timeline (remediation-focused, not incident containment). The shared
top-level labels (Observation/Analysis/Decision/Communication) are generic
enough to fit either domain without implying "this is incident response."
The owner's "vary by domain" decision is already satisfied by existing
content — nothing to build here.

### Phase 3 — Deepen the closest-to-bar module as the template
**Ticket-assignment beat: shipped, 2026-09-16.** Module 09 (ransomware,
closest to the full lifecycle per the audit) now opens its lab with a
queue-ticket panel (INC-4937, intake priority, reporting source, SLA clock)
before the existing "Your role" briefing — the "get assigned the ticket"
beat the bar called for and no module had. Presentational only, no scoring
or evidence changed. Further per-criterion investigative-depth extension
(the "several days of work" feel, beyond the intake framing) is not started
— would need actual new evidence/decision content, a bigger lift than the
framing addition, better scoped as its own sprint if the owner wants more
here.

### Phase 4 — Extend the rest via cross-module arcs
Per decision 3 (keep the arc pattern), Modules 02–08 group into a few
multi-module arcs instead of 7 independent rebuilds. Proposed grouping,
chosen because each pair's existing technical content is already
compatible — this is connective narrative work, not new incident content:

- **Arc C — Endpoint compromise → fleet hunt (Modules 05 + 06). Proof of
  concept shipped, 2026-09-16.** Module 05 confirms a document-reader →
  unsigned-script → loader chain on WS-LAB-27. Module 06's hunt already
  searches for exactly that pattern (document reader spawning an unsigned
  script host, then an outbound connection) on other hosts — the two labs
  were already technically compatible, just never said so. Added one
  framing panel to Module 06 ("Why this hunt opened") explaining the hunt
  was triggered by Module 05's finding. No evidence, scoring, or data
  changed.
- **Arc A — Identity compromise → lateral movement (Modules 02 + 03). Not
  started.** Module 02's compromised identity (IDN-317) and Module 03's
  lateral-movement account (svc_reports) are currently unrelated fixtures.
  Design: reframe Module 03's investigation as "the same identity family
  compromised in Module 02, now found making internal moves" — needs the
  entity names/details actually reconciled between the two modules (more
  than a framing sentence, since the two labs currently use different
  invented accounts), so this is real content work, not just a connector.
- **Arc B — Phishing → detection-engineering response (Modules 07 + 04).
  Not started.** Module 07's phishing case (EM-071, credential-phish
  leading to WS-517 activity) is a natural "why this rule got built"
  precursor to Module 04's Sentinel rule-tuning exercise — real SOC
  practice is post-incident detection improvement. Design: frame Module
  04's exercise as the detection gap discovered *because of* the Module 07
  incident. Same caveat as Arc A: the two modules' fixtures aren't
  currently the same incident, so this needs real reconciliation work, not
  just a sentence.
- **Module 08 stays standalone** — vulnerability management is a genuinely
  different lifecycle (proactive, not incident response), consistent with
  the Phase 2 finding. No arc needed.

Arc A and Arc B are the concrete next sprints if this work continues —
each needs an actual content-reconciliation pass (deciding what changes so
the two modules' fixtures agree), which is more curriculum-authoring
judgment than the mechanical/framing changes shipped so far this session.
Good candidates for their own scoped sprint with a content review
checkpoint, rather than blind parallel dispatch.

### Not scheduled yet
The two known tool-exposure gaps (interactive CLI, PCAP analysis) from
`VISION.md` remain unaddressed — out of scope for this scoring/depth
rebuild specifically; revisit separately.

## Status
**Phase 1a shipped, 2026-09-15** — admin grading queue now renders the
existing score breakdown and auto-scored feedback as readable text instead
of a raw JSON dump (`portal/app.js`, `adminGradingQueuePanel()`), committed
and pushed.

**Phase 1b — correction, 2026-09-16: not needed, closed without shipping.**
The original plan (this section, previous revision) claimed the section
breakdown was "computed but never shown to anyone" and scoped an 11-file
change to add it to every module's student-facing result panel. That claim
was wrong for the student side — a first attempt at Phase 1b (wiring a new
shared `renderLabScoreSections()` helper into all 11 modules) revealed that
every module's student-facing panel *already* renders its own labeled
`.m0N-score-grid` with named sections and per-section fractions, directly
in the template, above the plain feedback list. The gap was real only on
the admin side (fixed in 1a) — students already had this. The 11-file
change was reverted before committing (it would have shown the section
breakdown twice, once from each module's existing grid and once from the
new shared helper). `MODULE_DEPTH_AUDIT.md`'s "never shown to anyone"
framing is corrected inline there too.

The shared `renderLabScoreSections()` helper added to `portal/lab-runtime.js`
this session is harmless and unused — kept in place as a real building
block for Phase 2 (new domain-appropriate modules can call it fresh
instead of hand-rolling their own grid markup again), not reverted.

**Net effect:** Phase 1 (surfacing the existing breakdown) is fully done —
it just turned out to be one file's worth of work (1a), not two. Moving on
to Phase 2 directly.
