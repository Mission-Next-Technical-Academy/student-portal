# SOC Analyst Modular Lab Program — Orchestration and Progress

Last updated: 2026-08-17 (Europe/Berlin)

## Status

- [x] Read `/home/alex/Downloads/cybersecurity_analyst_modular_lab_program.md`.
- [x] Confirm the live target at `http://127.0.0.1:8768/#/program/soc-analyst/module/11`.
- [x] Confirm the live SOC Analyst track contains 12 modules.
- [x] Define module ownership and execution order.
- [x] Launch and complete Module Agent 01 only.
- [ ] Launch Module Agents 02–12.
- [ ] Integrate module changes.
- [ ] Run cross-module, accessibility, state-isolation, and capstone-gating QA.

Current phase: **Module Agent 01 complete; implementation stopped before Module Agent 02 at the user's requested stop point.**

## Agent Count

**12 module implementation agents are needed: one agent for each live SOC Analyst module.**

Including the coordinating/integration agent, the program requires **13 agent roles total**:

- 1 orchestration/integration agent.
- 12 module implementation agents.

The current four-slot concurrency limit permits the orchestrator plus three module agents at once, so implementation should run in four waves of three module agents.

Agents launched: **1**. Agents complete: **1**. Application implementation is limited to Module 1.

## Source-of-Truth Decision

The live course structure and module titles remain authoritative. The downloaded modular-lab specification supplies the lab architecture, isolation rules, progression model, assessment model, state requirements, and capstone rules.

The guide's numbered example curriculum does not exactly match the live course's numbered curriculum. Agents must therefore apply the guide's design principles to each live module's existing learning outcomes instead of blindly renaming or replacing live modules.

In particular:

- Live Module 12 is the course capstone and must receive the guide's complete integrated cyber-range treatment.
- Regular Modules 1–11 must remain isolated miniature labs and must not expose the complete portal, shared incident story, future evidence, or capstone workflow.
- Response, case notes, reporting, and closure concepts from the guide should be placed where they fit the live Module 11 outcomes and the live Module 12 capstone.

## Module Ownership

| Agent | Live route | Live module | Primary orchestration brief | Status |
|---|---|---|---|---|
| Module Agent 01 | `#/program/soc-analyst/module/1` | SOC & Security Architecture | Create isolated foundation/alert-orientation lab slices; no full range navigation. | Complete |
| Module Agent 02 | `#/program/soc-analyst/module/2` | Network, Identity & Security Foundations | Create constrained identity/network interpretation labs with synthetic data. | Not started |
| Module Agent 03 | `#/program/soc-analyst/module/3` | SIEM & Log Analysis | Create miniature alert triage, log interpretation, timeline, and query tasks. | Not started |
| Module Agent 04 | `#/program/soc-analyst/module/4` | Detection Engineering, Threat Intelligence & Automation | Create limited detection logic, tuning, enrichment, and alert-context workflows. | Not started |
| Module Agent 05 | `#/program/soc-analyst/module/5` | Endpoint & Malware Investigation | Create constrained process-tree, endpoint-timeline, and file-evidence labs. | Not started |
| Module Agent 06 | `#/program/soc-analyst/module/6` | Threat Hunting & Investigation | Create hypothesis, query, bookmarking, scoping, IOC, and ATT&CK exercises. | Not started |
| Module Agent 07 | `#/program/soc-analyst/module/7` | Network & Email Analysis | Create isolated network-session, phishing, header, URL/attachment, and trace labs. | Not started |
| Module Agent 08 | `#/program/soc-analyst/module/8` | Vulnerability Management & Exposure Analysis | Create constrained prioritization and exposure-analysis workflows without enterprise-wide browsing. | Not started |
| Module Agent 09 | `#/program/soc-analyst/module/9` | Incident Response | Create limited correlation, investigation, and proportional-response exercises. | Not started |
| Module Agent 10 | `#/program/soc-analyst/module/10` | Digital Evidence, Forensics & Incident Frameworks | Create evidence handling, timeline/root-cause, graph, and ATT&CK mapping exercises. | Not started |
| Module Agent 11 | `#/program/soc-analyst/module/11` | SOC Operations, Metrics, Reporting & Communication | Create miniature metrics, case-note, executive-report, escalation, and closure workflows. | Not started |
| Module Agent 12 | `#/program/soc-analyst/module/12` | SOC Analyst Capstone | Build the only complete integrated range and end-to-end synthetic incident. | Not started |

## Execution Waves

| Wave | Module agents | Gate before the next wave | Status |
|---|---|---|---|
| 1 | 01, 02, 03 | Shared lab contract and early guided pattern validated. | Agent 01 complete; 02–03 not started; paused |
| 2 | 04, 05, 06 | Reusable detection, endpoint, and hunting components validated. | Not started |
| 3 | 07, 08, 09 | Evidence isolation and semi-independent progression validated. | Not started |
| 4 | 10, 11, 12 | Advanced artifacts integrated; capstone alone exposes full range. | Not started |

## Shared Contract for Every Module Agent

Each regular-module agent must deliver:

1. One measurable primary objective per lab.
2. A miniature interface exposing only task-relevant controls.
3. A synthetic, module-specific dataset with plausible benign distractors.
4. A guided, assisted, semi-independent, or independent investigation appropriate to the module stage.
5. A scored artifact covering observation, analysis, decision, and communication.
6. Persisted attempts, evidence selections, notes, scores, flags, and completion state.
7. An individual-lab reset that does not reset the course.
8. Reusable components that can later mount inside the capstone shell.
9. Accessibility text, hints, remediation, and explainable scoring.
10. Verification that no future evidence, full navigation, complete topology, or capstone storyline leaks into the lab.

Module Agent 12 must instead assemble the reusable components into the full capstone, preserve prerequisite gating, and require a passing end-to-end investigation before completion.

## Integration Rules

- Preserve existing live course titles, route contracts, enrollment behavior, and unrelated user changes.
- Use original product names, branding, copy, icons, and visual styling; do not copy proprietary vendor interfaces.
- Keep synthetic learner identities anonymous.
- Seed variations without changing required reasoning or difficulty.
- Reuse interaction patterns across modules while avoiding repetitive reskins.
- Do not unlock or reveal the integrated range before Module 12.
- Have the orchestrator review each wave for shared-file conflicts before launching the next wave.

## Final QA Gate

- [ ] All 11 regular modules expose only isolated miniature lab surfaces.
- [ ] Module 12 alone exposes the complete integrated cyber range.
- [ ] Every lab has a single objective, synthetic dataset, artifact, and explainable score.
- [ ] Difficulty progresses from guided to independent.
- [ ] State persists and lab reset remains scoped.
- [ ] Capstone evidence is gated by prerequisites.
- [ ] The capstone covers triage, query, timeline, scope, enrichment, ATT&CK, detection, response, reporting, and closure.
- [ ] Existing routes and unrelated work remain intact.
- [ ] Keyboard access, labels, focus behavior, contrast, and responsive layouts pass QA.

## Orchestration Stop Point

Module Agent 01 is complete and implementation has stopped. Module Agents 02–12 remain unlaunched and unchanged.

Module 1 now mounts an isolated, guided alert-orientation lab on the portal route. It presents nine foundation lessons, an activity-to-investigation concept flow, one synthetic identity alert, a sequential evidence review, and a scored verdict/priority/lifecycle/action/case-note artifact. Attempts, reviewed evidence, notes, score, best score, earned flag, and completion persist under a lab-specific browser key; reset affects only this lab.

The scoped SIEM console walkthrough is a required Module 1 step. It starts a fresh six-step coach run on the sign-in log alone, reports verified completion back to the module, and unlocks the triage worksheet. Module completion requires both this walkthrough and a passing triage artifact.

Revised 2026-08-18 after review: Module 1 is the student's first hour and must read as easy. The walkthrough previously pivoted across three consoles (sign-in logs, Identity Protection, Defender incidents) to collect four facts — that is the capstone's shape, not a first lesson's. It is now single-source: every fact the verdict depends on is readable in the sign-in log, the platform's risk score is surfaced in the sign-in detail pane, and the account owner's denial is handed to the student in the module's own evidence panel. The pass mark moved from 80 to 70 and the case note is graded in independent parts instead of all-or-nothing, so a correct verdict with an imperfect note still passes.

The full existing security operations environment remains the Module 12 capstone at `http://127.0.0.1:8767/#/defender/home`. Module 1 does not link to or reveal that environment, its navigation, its shared evidence, or an end-to-end workflow.

Agent 01 verification:

- `node --check` passed for `portal/data.js`, `portal/lab-runtime.js`, `portal/module-01.js`, and `portal/app.js`.
- `git diff --check` passed for all Agent 01 portal files.
- HTTP checks returned 200 for the portal on 8768 and the preserved capstone environment on 8767.
- Headless Chrome at 1366×768 passed 30/30 focused assertions covering the exact route, four-alert isolation, absence of full navigation/capstone links, labels, focus after scoring, overflow, explainable 0/100 and 100/100 paths, attempts/evidence/notes/score/flag/completion persistence after refresh, and a reset that preserved unrelated course state.
- A second browser check passed keyboard Space activation, managed evidence-panel focus, and horizontal containment at 390×844.
