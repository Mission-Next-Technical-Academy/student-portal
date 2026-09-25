# SOC Analyst Track Reimagining — Vision

**Status:** Vision + real-code gap scan done. No curriculum content built yet.
**Owner framing, 2026-09-13 (verbal):** "0 to hero," CySA+-territory hands-on
depth, each module reframed as one incident (INC) run front-to-back — "much
more valuable to a potential employer" than isolated skill checks.
**Relationship to other docs in this repo:** does not replace or duplicate
`archive/completed-feature-notes/CURRICULUM_SCENARIO_ARCHITECTURE_2026-09-10.md`
(the existing, Security+/SY0-701-mapped, `Mission Next Labs`/`INC-####`
scenario-continuity plan) — extends it with a CySA+ lens and a real
tool-exposure gap list. See "How this relates to existing work" below before
building anything.

---

## 1. CySA+ vs. Security+ — answering the framing question directly

Security+ (SY0-701) is the broad, five-domain foundation: general security
concepts, threats/vulnerabilities/mitigations, architecture, operations,
program management. It's exam-recall-shaped and intentionally shallow across
a wide surface. The existing root POA&M (`archive/historical-plans/01_plan_of_action_milestones.md`)
already has this right: **Security+-aligned quizzes stay as light
concept-priming throughout, never the graded depth** — that decision doesn't
change here.

CySA+ (CS0-003) is the next cert up, and it's built for exactly what's being
asked for: four domains — **Security Operations** (SOC workflows, SIEM/log
analysis, network/endpoint analysis), **Vulnerability Management** (scanning,
prioritization, remediation — this is where Nessus-class tooling lives as an
explicit exam objective, not an incidental extra), **Incident Response &
Management** (the full detection→containment→eradication→recovery→reporting
lifecycle), and **Reporting & Communication**. It is written around an
analyst *doing the job*, not recalling a definition — which is exactly the
"0 to hero, nearly all hands-on" shape being asked for.

**Recommendation:** keep Security+ as the light conceptual spine (already the
plan), and make **CySA+ the hands-on lab framework** — every module's lab
maps to a CySA+ domain/objective, not just a Security+ one. This is an
addition to the existing crosswalk work, not a replacement of it.

## 2. The core structural idea: each module = one incident, front to back

Right now the built modules are strong on individual skills (see §4) but are
mostly single-tool, single-skill exercises per lesson, not one continuous
incident a student owns start to finish. The ask: reframe each module as a
complete incident narrative — detection → triage → investigation →
containment → eradication → recovery → reporting — using a realistic
toolchain, so a graduate can say "I ran an incident end to end" instead of "I
answered questions about 12 disconnected topics." That's a materially
stronger signal to an employer, and it's also literally how CySA+'s Incident
Response domain is structured.

**This is not starting from zero.** The archived scenario-architecture doc
already built exactly this shape for Security+: a continuous fictional org
(`Mission Next Labs`), a recurring identity, an `INC-####` case-numbering
convention, and a per-module real-world scenario (e.g. Module 8's ransomware
case `INC-4937`, "Operation Cedar"). Per `NEXT_SESSION.md`'s own 2026-09-10
notes, modules 02–12 reportedly already got real content expansion along
these lines — **but that work is uncommitted, self-reported as done, and
explicitly flagged as not yet curriculum/compliance-reviewed.** Before
building anything new here, that existing work needs to be read for real
(not trusted from the handoff summary) and evaluated against the CySA+ lens
below — it may already satisfy most of this ask.

## 3. Grading quality criteria — the owner's own framing, made concrete

Directly from the brief: a passing incident lab isn't "did you click the
right answer," it's **"were all the IOCs needed to effectively contain the
threat identified, and were proper, real remediation tasks completed."**
That's the rubric shape for every module's capstone incident, not a
generic point score:

- **IOC coverage** — of the IOCs actually present in the scenario's evidence,
  how many did the student correctly identify and cite? (Not "did they find
  *an* IOC" — did they find the *complete set* needed to actually contain
  *this* threat.)
- **Remediation completeness and correctness** — did the student's
  containment/eradication/recovery actions match what the incident actually
  required, not just "did they click a button in the simulator."

**Auto vs. instructor split (confirmed by owner, 2026-09-13, and already
reflected in the grading-system schema — see
`../lab-grading-notification-system/`):** the system's own scoring gives an
**instant, per-criterion pass/fail overview** (e.g., "3 of 5 IOCs identified,"
"containment step missing") — that's fine to automate and show immediately.
The **specific corrective guidance** — what exactly to go fix, and how — is
never auto-generated; it's always the instructor's handwritten call, at their
discretion, per flagged item. A failing attempt is sent back for a **full
resubmission of the lab**, not a patch to one field.

## 4. Real gap scan (2026-09-13) — checked actual module code, not just docs

The root docs (`archive/historical-plans/00_current_state_scan.md` / `archive/historical-plans/01_plan_of_action_milestones.md`)
list an aspirational tool set. Grepping the real, live module files and the
real simulator (`ui/`) instead of trusting that list turned up a materially
different picture:

| Claimed / asked for | Actual state, verified in code |
|---|---|
| SIEM exposure | **Real, but Microsoft-stack only.** The simulator (`ui/`) is Sentinel/Defender/Entra-themed (`#/sentinel/incidents`, `#/sentinel/analytics`, `#/defender/incidents`, `#/defender/hunting`, `#/entra/risky-users`, etc.) — genuinely used in real SOCs, not a toy. Splunk/QRadar-*styled* UI, as named in the root docs, was never built. |
| Vulnerability scanning ("Nessus-style") | **Partially real.** `#/defender/vuln-management` exists as a sim entry point. Not Nessus-branded, but the root docs themselves say the underlying tool doesn't matter — this is closer to done than the other gaps below. |
| Email header analysis | **Already real and hands-on** — Module 07 (`portal/soc-analyst-module-07.js`) has a genuine Headers tab (From/Return-Path/Received/SPF/DKIM/DMARC), a 12-message triage inbox, and cross-source correlation against network/DNS/TLS sessions. **This one is done, not a gap** — earlier in this session I told the owner it wasn't present; that was wrong, based on reading planning docs instead of the actual module file. Correcting the record here. |
| PowerShell | **Conceptual only, not hands-on.** Referenced in scenario/quiz text (process-tree questions: "Document → PowerShell → Unsigned executable") in Modules 05/06/10, but a student never types a real command. No interactive terminal exists anywhere in the portal. |
| Unix/Linux CLI | **Not present at all.** No module, no sim entry, nothing — the whole built simulator is Windows/Azure-stack. |
| PCAP / Wireshark-style packet inspection | **Not present at all.** No module content, no sim entry point, confirmed by grep across every module and `ui/`. |

**Net: the two real, confirmed-missing pieces for a genuine "0 to hero" CySA+
build are (1) an interactive command-line surface (PowerShell and/or
Linux/bash) and (2) packet-capture analysis.** Everything else on the
original wish list is either already real (email headers) or a styling
preference on top of something that already functions (SIEM, vuln scanning).

## 5. Open decisions before building
1. **Extend vs. rebuild the existing scenario work.** Read the actual
   uncommitted Module 02–12 content (not just its self-reported progress
   docs) before deciding whether it already satisfies the "one incident,
   front to back" ask, or whether a CySA+-specific pass is still needed on
   top of it.
2. **Which modules get the two new tool surfaces.** A CLI exercise and a
   PCAP exercise each need a home — likely one or two dedicated modules
   rather than retrofitting all 12, but that's a real curriculum-design call,
   not made here.
3. **CySA+ crosswalk itself** — no CS0-003 domain/objective mapping exists
   yet anywhere in this repo (only the SY0-701 Security+ crosswalk does).
   This has to exist before "CySA+-aligned" is a claim anyone can stand
   behind on the site.
4. **Rubric implementation** — the IOC-coverage / remediation-completeness
   rubric in §3 needs a concrete per-module data shape. This is downstream
   of, and should reuse, the `lab_attempts.result` JSON structure the
   grading system already writes to (see the sibling grading-system
   project) — don't invent a second, parallel scoring model.

## 6. Per-module structure — Learn it, Practice it, Prove it

**Superseded 2026-09-20:** the original owner framing here (2026-09-13) had
a fourth stage — a separate full incident per module beyond the assessed
lab. `REBUILD_PLAN.md`'s actual shipped work (Module 09's ticket panel, the
Arc C connector, etc.) never built two separate labs per module; it
deepened the one assessed lab into the "full incident, front to back"
shape instead. `ROADMAP.md` and `INSTRUCTIONAL_ARCHITECTURE.md` now use a
three-stage Learn it → Practice it → Prove it cycle, with that full-incident
depth folded into "Prove it." This section is corrected in place to match;
the "one real case, worth showing an employer" ambition below is preserved,
just as part of Prove it rather than a separate stage.

This is the shape every module should build toward, and it's the concrete
answer to "how do we frame the syllabus as hands-on labs":

1. **Learn it** — the lesson/theory content. Short, concept-priming, tied to
   Security+ where it maps (unchanged from the existing plan, §1 above).
2. **Practice it** — a guided, scaffolded lab on the same skill: lower
   stakes, coaching/hints available, builds the muscle memory before it
   counts.
3. **Prove it** — the assessed lab: one real, on-the-job-shaped case run
   start to finish (§2's "one INC per module" idea), pulling together
   everything learned and practiced in that module. This is where the
   IOC-coverage / remediation-completeness rubric (§3) actually applies,
   and where the grading-system project's pregrade → instructor-review →
   redo loop kicks in (see `../lab-grading-notification-system/`) — a
   student doesn't move on until they've proven it at the required 70%.
   This is also the artifact that's actually worth showing an employer —
   not a quiz score, a completed incident.

This gives every module the same skeleton regardless of which CySA+ domain
or tool surface it's built around, and it's the structure the next build
pass should map the real (uncommitted) Module 02–12 content against — see
§7.

## 7. Next step
Read the real (uncommitted) Module 02–12 content end to end against this
vision before writing a build plan — not another planning pass on top of
planning passes. Specifically check each module against the three-stage
shape in §6 (does it currently have all three stages, or just Learn/Practice
with no real Prove it depth?) alongside CySA+ domain fit, the
IOC/remediation rubric shape, and the two real tooling gaps (§4) — this
document exists so that read has a clear target instead of starting cold.
