# MNTA SOC Analyst Track — Plan of Action & Milestones (POA&M)

**Scope:** Revise coursework from quiz-heavy to a 12-module, lab-centric, job-simulation model with an admin grading/notification system.
**Related:** [[mnta-student-portal]] repo (github.com/Mission-Next-Technical-Academy/student-portal)

---

## Guiding Constraints (from working session)
- 12 modules, each a comprehensive hands-on lab; ~half a work-week (2–3 days) per module.
- Quizzes trimmed to light concept-priming only, placed immediately before the lab they support — not used for deep assessment.
- Grading centers on simulated on-the-job performance, not answer recall.
- Submission fields should mirror real analyst work (e.g., ticket/incident resolution fields), not generic copy/paste string inputs.
- Admin panel needs: notification badge per course card (cards enlarged for readability), a grading queue, and per-student/per-parameter grade + recommended action + instructor notes.
- Admin account security: credential rotation option (admin only), no perpetual/persisted admin password, backend devs retain ability to change account hashes directly.
- Broad tool-UI exposure across the 12 modules: SIEM-style interfaces (Splunk/QRadar-like — Wazuh or similar under the hood is fine), vulnerability scanning (Nessus-style), packet capture (Wireshark), and CLI-based tasks.
- Benchmark alignment: map modules against Security+ objectives, framed for real-world SOC work rather than exam recall.

---

## Sprint 0 — Foundations (Week 1)
**Goal:** Lock the architecture decisions before any build starts.
- [ ] Finalize the 12-module sequence (map to a SOC workflow: intake → triage → detection → analysis → containment → escalation → reporting, or similar — cross-referenced against Security+ domains).
- [ ] For each module, assign: primary tool-UI, submission field schema, and grading rubric shape.
- [ ] Define the "recommended action" data model — is it an instructor-facing suggested grade/action per submission, or a scored-field answer key with override capability?
- [ ] Define admin credential policy: rotation trigger (manual button vs. scheduled), no-persist rule for the session/password, and the backend hash-override path for developers.
- [ ] Output: locked module map + admin panel spec (feeds Sprint 1–2).

## Sprint 1 — Admin Panel Core (Weeks 2–3)
**Goal:** Build the instructor-facing shell before lab content is wired in.
- [ ] Course card UI: enlarge cards, add per-card notification indicator (pending grading count).
- [ ] Grading queue view: list of ungraded submissions, filterable by module/student.
- [ ] Per-student grading screen: per-parameter score field, recommended-action field, free-text notes field, submit-to-student action.
- [ ] Admin auth: credential rotation control, non-persistent password handling, dev-only hash override path.
- [ ] Output: functioning admin shell (no lab content yet).

## Sprint 2 — Submission & Grading Data Model (Weeks 3–4)
**Goal:** Define how a lab submission becomes a graded, student-visible result.
- [ ] Design submission field schema per lab type (ticket number, resolution summary, actions taken, evidence/artifact reference — not raw string paste).
- [ ] Design the score/notes structure that flows back to the student's account post-grading (what they got right/wrong, per section).
- [ ] Decide automation split: which fields can be auto-scored (e.g., correct IOC identified) vs. which require instructor judgment (e.g., quality of incident write-up).
- [ ] Output: submission/grading schema reused by all 12 modules.

## Sprint 3 — Module Build, Batch 1 (Weeks 5–8)
**Goal:** Build the first 4 modules end-to-end as the template for the rest.
- [ ] Module 1–4 content: scenario, tool-UI (assign per module — e.g., SIEM triage, log analysis CLI), submission fields, grading rubric.
- [ ] Light concept-priming quiz per module (kept short, directly feeding the lab).
- [ ] Wire each module into the admin grading queue and notification system.
- [ ] Output: 4 complete modules, validated grading pipeline end-to-end.

## Sprint 4 — Module Build, Batch 2 (Weeks 9–12)
**Goal:** Modules 5–8, expanding tool-UI coverage.
- [ ] Add vulnerability-scan module (Nessus-style UI) and packet-capture module (Wireshark).
- [ ] Continue ticket/incident-style submission fields per module.
- [ ] Output: 8 of 12 modules complete.

## Sprint 5 — Module Build, Batch 3 (Weeks 13–16)
**Goal:** Modules 9–12, closing out remaining tool exposure and workflow stages (e.g., escalation, reporting, containment).
- [ ] Ensure by module 12 the student has touched: SIEM-style UI, vuln scanning, packet capture, and CLI-based investigation at minimum once each.
- [ ] Output: all 12 modules complete.

## Sprint 6 — Security+ Crosswalk & QA Pass (Weeks 17–18)
**Goal:** Validate real-world/Security+ alignment and run end-to-end QA.
- [ ] Build the module-to-Security+-domain crosswalk table.
- [ ] Full run-through: student submits → instructor notified on course card → grades in queue with notes/recommended action → result returns to student's account per section.
- [ ] Confirm admin credential rotation and no-persist behavior under test.
- [ ] Output: launch-ready track.

---

## Immediate Next Action
Before Sprint 0 can close, you need to make three calls (flagged in the scan doc):
1. The exact 12-module sequence/theme.
2. Which tool-UI belongs to which module.
3. Whether "recommended actions per parameter" is auto-suggested or instructor-authored.

These three answers unlock the rest of the plan — worth doing as a short working session before build starts.
