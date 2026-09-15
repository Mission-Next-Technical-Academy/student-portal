# Module Depth Audit — Modules 02–12 vs. LAB_DEPTH_AND_SCORING_OVERHAUL.md

**Date:** 2026-09-15. **Status:** Audit only — no code changed. This is
`STATE.md`'s required first step before resolving the 4 open questions or
writing a rebuild plan.

## Headline finding, reframes the scope

The fear behind "all the labs need redo I believe" was that these are thin,
single-skill, pass/fail checks. **They are not, structurally.** Every
module from 02–12 already scores its independent lab as several named
sections (`observation`, `analysis`, `decision`, `communication` — Module
12 uses a richer 10-domain variant including a section literally named
`Triage`), each built from multiple weighted sub-criteria, rolling into one
0–100 final score, with real partial-credit variance and per-section
written feedback. This is most of what "many parameters, sectioned
percentages, one final score, real variance" already asks for, at the code
level.

**What's actually missing is narrower than a full rebuild:**
1. **The section breakdown is computed but never shown.** Students and the
   admin grading queue both only ever see a flat `X/100` — the `breakdown`
   object (`{ observation, analysis, decision, communication }` or M12's
   10 named domains) is right there in `recordLabAttempt()`'s `result`
   payload and is currently thrown away visually. This is the direct fix
   for the "`lab_attempts.result` needs a real sections shape" gap already
   flagged in `../lab-grading-notification-system/00_SCAN_AND_GAP_COMPARISON.md`.
2. **No module has an explicit "get assigned the ticket" moment** — every
   independent lab drops the student straight into an already-framed
   scenario. `grep -c ticket` returns 0 for most modules.
3. **"Decision" usually conflates containment + triage + response into one
   bucket** rather than triage being its own scored severity/priority
   judgment — Modules 09 and 12 are the exceptions (both score
   classification/severity as their own line item).
4. **Each individual scored criterion is still a single fixed-choice pick**
   (2–4 radio options), not open evidence work. Multiple criteria do roll
   up into a real, varying score — but the "several days of investigative
   work" feel the owner wants is more about the depth *within* each
   criterion than the section architecture around them.
5. The two known tool gaps (interactive CLI, PCAP) are untouched anywhere,
   as expected — not re-verified here.

## Important discovery: Modules 09–12 already form one continuous incident

`INC-4937` / "Operation Cedar Lock" (`ws-173`, `acct-173`, `fs-02`) is the
**same incident, referenced by ID and entity, across all four modules**:
Module 09 is the live ransomware response (detect → classify → contain →
eradicate → recover → escalate), Module 10 is that incident's evidence
handling and ATT&CK mapping, Module 11 is its metrics review and final
report/closure, and Module 12's capstone explicitly gates on Modules 01–11
and reuses the same evidence family. **This already is "one continuous
case, front to back, multiple competencies" — just realized as an arc
across 4 modules instead of self-contained inside one.** That is a real
design choice already made in the codebase, and it's a different shape
than "every module is its own complete incident," which is closer to how
the owner described it. Worth an explicit decision (folded into open
question 1 below) rather than assuming either shape is obviously right.

## Per-module verdict

| # | Module | Domain | Lifecycle coverage now | Scoring shape | Verdict |
|---|--------|--------|------------------------|----------------|---------|
| 01 | Alert triage (guided) | — | N/A — already decided: becomes tutorial, not graded | N/A | excluded |
| 02 | Identity/MFA push-bombing | IAM | investigation + analysis + decision(escalate/protect) + reporting; no explicit intake or standalone triage | obs/analysis/decision/comm, 5 sub-criteria | moderate gap |
| 03 | Lateral movement / KQL | Hunting-adjacent | investigation(query+timeline) + analysis + decision(escalate/preserve) + reporting; no intake, no containment action | obs/analysis/decision/comm | moderate gap |
| 04 | Detection engineering (Sentinel rule tuning) | Detection eng. | strong investigation/tuning depth; decision = priority/rollout/automation, **no containment action** | obs/analysis/decision/comm, rich sub-criteria | moderate gap |
| 05 | Malware chain (doc→shell→loader) | Endpoint | investigation + analysis + **real containment (isolate-preserve)**; no standalone triage | obs/analysis/decision/comm | close-ish |
| 06 | Threat hunting | Hunting | investigation + analysis(hypothesis/scope/ATT&CK) + decision(disposition/escalation); **no containment — not this domain's job** | obs/analysis/decision/comm | moderate (domain doesn't want containment) |
| 07 | Phishing (email headers + network trace) | Email/Network | investigation(headers+trace) + analysis + **real containment (contain-search)**, but decision is one binary pick, not sub-scored | obs/analysis/decision/comm | close-ish |
| 08 | Vulnerability management (priority + queue) | VM, not IR | strong on **remediation prioritization**; no incident-style containment — different lifecycle, not IR | obs/analysis/decision(treatment+timeline)/comm | moderate — needs a VM-shaped lifecycle, not the IR template |
| 09 | Ransomware active response (Cedar Lock) | IR, live | intake(scenario)+investigation+**explicit triage(severity/scope/classification)**+**contain+eradicate+recover**+escalation/reporting | obs/analysis/decision/comm, decision = contain+eradicate+recover+escalate | **close — best standalone template** |
| 10 | Evidence handling + ATT&CK mapping (Cedar Lock cont.) | Forensics | chain-of-custody + technique mapping; continuation of 09's incident, not a fresh case | obs/analysis/decision/comm ×2 labs | close, but arc-dependent |
| 11 | SOC metrics review + final report/closure (Cedar Lock cont.) | Reporting | metrics analysis + incident closure/report; continuation of 09's incident | obs/analysis/decision/comm ×2 labs | close, but arc-dependent |
| 12 | Capstone (gated on 01–11) | Integrated | **explicit 10-domain breakdown including a named `Triage` domain**, plus critical-error auto-fail conditions (e.g. closing a confirmed incident as benign, targeting the wrong identity, deleting evidence) | 10 named domains × 10 pts, critical-error penalties | **closest to the bar overall** |

## Rebuild-priority recommendation

Given the above, a ground-up rebuild of all 11 modules is not what the code
actually needs. Recommended order:

1. **Surface the section breakdown first, everywhere** (student lab result
   view + admin grading queue) — this is a shared, low-risk UI change that
   immediately makes the *existing* scoring visible and standardizes the
   `lab_attempts.result` "sections" shape the grading system needs. Highest
   leverage, touches every module at once, no curriculum redesign required.
2. **Module 09 as the template for adding an explicit intake/assignment
   beat and deepening per-criterion investigative work** — it's already
   the closest to the full lifecycle (has real triage, real
   contain/eradicate/recover), so extending it is cheaper than building a
   new shape from scratch, and proves the pattern before touching the
   other 8 non-arc modules (02–08).
3. **Then the domain-mismatched modules (06 hunting, 08 vuln-management)**
   get a *domain-appropriate* lifecycle instead of forcing the IR
   containment template where it doesn't fit — this directly answers open
   question 1 below.
4. **Modules 02–07 last**, using whichever of (2) or (3) applies to each.

## Feeding the open questions (informed, not answered — owner's call)

1. **Canonical shape vs. per-domain:** the audit says per-domain, not one
   rigid template — Module 06 (hunting) and Module 08 (vulnerability
   management) structurally don't have an incident to contain; forcing an
   IR shape on them would be artificial. Likely answer: one canonical
   *scoring pattern* (named weighted sections, critical-error flags,
   surfaced breakdown) but lifecycle-stage *content* varies by domain.
2. **Section weighting:** not yet answerable from code alone — needs the
   owner's judgment on what should count for more.
3. **Rebuild priority:** recommendation above (breakdown UI → Module 09 →
   domain-mismatched modules → the rest).
4. **Where the Module 1 tour lives:** unaffected by this audit — still
   open, product-placement question.
5. **New, audit-driven question:** should Modules 09–12's cross-module
   incident arc be the *pattern* going forward (a few multi-module arcs
   instead of 11 standalone incidents), or should the goal be making
   every module fully self-contained? This wasn't one of the original 4
   questions but the audit surfaced it as a real fork in direction.
