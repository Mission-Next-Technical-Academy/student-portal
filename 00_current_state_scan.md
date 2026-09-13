# MNTA SOC Analyst Track — Current State Scan

**Purpose:** Baseline assessment of the existing coursework against the target model (12 in-depth, hands-on labs; quiz-light; job-realistic grading) before architecture work begins.

## 1. Current Model (as-is)
- Quiz-heavy assessment; labs appear supplementary rather than primary.
- Submission pattern (assumed from description): copy/paste strings into generic input fields — closer to "answer a question" than "resolve a ticket."
- No stated per-student admin queue, notification system, or per-parameter grading/notes.
- No stated credential-rotation policy for admin accounts.

## 2. Target Model (to-be)
- 12 modules = 12 labs, each an in-depth, comprehensive, hands-on simulation.
- Each module ≈ half a work-week (2–3 days) to complete.
- Quizzes retained only where they prime a concept immediately before its lab — trimmed to the minimum needed, not used for deep assessment.
- Grading and scoring driven primarily by lab performance in a simulated work environment, not by quiz score.
- Submission fields modeled on real analyst work product (ticket/incident resolution fields), not raw string paste.
- Admin panel: notification per course card, grading queue, recommended actions + grade + notes per parameter, per student.
- Security: admin-only credential rotation, no perpetual admin password storage, backend devs retain hash-change capability per account.
- UI exposure across major SOC/vendor tool families (SIEM look-alikes for Splunk/QRadar, Wazuh, Nessus-style vulnerability scanning, Wireshark, CLI tools), regardless of which underlying open-source tool powers the simulation.

## 3. Gap Analysis

| Parameter | Current | Target | Gap |
|---|---|---|---|
| Assessment weight | Quiz-heavy | Lab-heavy, quiz-light (concept priming only) | Rebalance scoring; trim quiz depth |
| Submission realism | Generic string input | Ticket/incident resolution fields | Redesign submission field schema per lab type |
| Grading | Manual/undefined | Per-parameter grade + notes + recommended action, queued for instructor | Build grading queue + rubric engine |
| Admin visibility | None stated | Notification per course card on admin panel | Add card-level notification + larger card UI |
| Tool exposure | Unclear/limited | Multi-vendor UI mimicry (SIEM, vuln scan, packet capture, CLI) across 12 modules | Map each module to specific tool-UI requirement |
| Security posture (admin) | Unclear | Rotating creds, no perpetual save, dev-level hash override | Define auth/credential policy |
| Industry alignment | Unclear | Mapped against Security+ objectives, "real world" framing | Objective-to-module crosswalk needed |

## 4. Open Questions (to resolve before build)
1. Which specific 12 domains/modules — is this a straight Security+ domain mapping, or a custom SOC-analyst-workflow sequence (triage → detection → containment → reporting, etc.)?
2. Per module, which tool-UI is primary (e.g., Module 3 = SIEM triage, Module 7 = vuln scan review)?
3. What does "recommended actions inside each parameter" mean concretely — is this an instructor-facing suggestion engine, or an answer key the instructor grades against?
4. Does grading need partial automation (rubric-scored fields) with instructor override, or is it fully manual with the admin panel just organizing the queue?

## 5. Next Step
Produce the Plan of Action & Milestones (POA&M) markdown covering all 12 modules, sprint sequencing, and the admin panel build — see `01_plan_of_action_milestones.md`.
