# Delivery Roadmap — Mission Next Technical Academy

**Status:** Canonical delivery roadmap as of 2026-09-20. This is the one
starting document for people and agents. It defines priority, dependencies,
acceptance gates, and the CI/CD path. Detailed plans are implementation
references; they cannot independently authorize contradictory work.

## Product direction

Mission Next delivers supervised, job-shaped technical training. Learners
perform work in the simulated environment, and the durable evidence of that
work—not a parallel worksheet or quiz alone—is what an instructor reviews.

For the SOC Analyst track, Security+ remains the light conceptual spine and
CySA+-territory hands-on practice provides depth. Each module should move
through **Learn it → Practice it → Prove it**, where "Prove it" means
reduced-guidance application that produces the durable, instructor-reviewable
evidence described above — not a separate fourth stage. Lifecycle and scoring
sections may vary by domain; threat hunting and vulnerability management must
not be forced into a fake incident-response template. `INSTRUCTIONAL_ARCHITECTURE.md`
is the detailed reference for this cycle: the guidance-reduction curve across
modules 01–12, skill-carryover expectations, and the per-module "finished"
rubric. It does not authorize reordering modules, renaming keys, or changing
compliance-controlled hours — those remain governed by `MODULE_STANDARD.md`
and `CURRICULUM_ALIGNMENT_ARCHITECTURE.md`.

## Locked Module 1 sequence

**Module 1 begins with an LMS orientation tour. This is required.** It gives a
new learner the Day 1 context, rules of engagement, assigned scope, and a
clear tour of the workspace before the learner is asked to perform assessed
work. It must be accessible from the beginning of Module 1 and may be reopened
as a refresher.

The assessment that follows is simulator-first: the learner investigates the
assigned incident in the SIEM, pivots through incident/alert/entity evidence,
assigns or updates the case as permitted, records evidence, and makes a
justified escalation or containment request. The durable simulator action log
and final case record are the instructor-reviewable artifact. Do not restore a
parallel LMS worksheet or expose a live student score.

The tour is orientation, not the assessment. It may observe real UI telemetry,
but it must not be the sole completion or grading evidence. The detailed
implementation reference is
`soc-analyst-track-reimagining/MODULE1_DAY1_REBUILD_PLAN.md`; this section
supersedes its former tour-versus-Objectives-panel ambiguity.

**Do not confuse this with the Academy-wide first-login orientation shipped
2026-09-20** (`ACADEMY_ORIENTATION_SPRINT.md`, `portal/orientation.js`) — a
separate, earlier layer that runs once at first login, before the student
ever opens Module 1: Welcome → Academy nav/programs/help → the student's
program → that program's module structure → Module 1 → Learn It/Practice
It/Prove It → how grading/review works. It is discipline-neutral (no SOC/
SIEM language) and program-agnostic across all four tracks. It does **not**
satisfy this section's requirement — Day 1 framing, rules of engagement,
assigned scope, and the workspace walkthrough remain owned by the in-module
`ui/coach.js` `m01-orientation` coach ("Take the tour"). Item 1 below is
still open.

## Source-of-truth order

1. This roadmap: priority, release state, decision gates, and agent workflow.
2. The linked work-item specification: file-level design and acceptance detail.
3. Current code, tests, migrations, and deployed state: implementation facts.
4. Historical handoffs: context only.

When a historical document conflicts with this roadmap, follow this roadmap
and update the historical document when that workstream is next touched.

## Ordered delivery queue

| Order | Work item | State | Depends on | Done when |
|---:|---|---|---|---|
| 0 | CI baseline | **Active** | none | `bash bin/ci-check.sh` passes locally and on PRs / `master`; Pages repeats it before deployment. |
| 1 | Module 1 orientation tour | **Required build/verification** | none | The beginning of Module 1 presents the LMS orientation tour: Day 1 framing, rules, scope, and workspace walkthrough. It is reopenable and does not replace assessment evidence. |
| 2 | Faculty-gate live UAT | **Blocked on controlled credentials** | deployed faculty-gate migration | Controlled student submit → faculty return → resubmit → approve → Module 2 unlock is verified and recorded. |
| 3 | Module 1 SIEM performance assessment | **Next substantive build** | 1 and 2; cross-device state smoke test | Multi-sitting simulator assessment with scoped action log, evidence pivots, assignment/status/comments, consequence handling, persistence, and instructor-reviewable record. |
| 4 | Module completion integrity | **Queued** | 2 and 3 | Modules 2–12 receive verified-completion protection using the proven Module 1 pattern. See `module-completion-integrity/BRIEF.md`. |
| 5 | SOC curriculum Arc A | **Queued content work** | stable Module 1 assessment | Reconcile Modules 02→03 fixtures/narrative with owner content review. Arc B is undecided; do not build the rejected 07→04 pairing. |
| 6 | Tool-depth expansion | **Later discovery** | 5 sequencing decision | Scope real interactive CLI and PCAP lab surfaces plus CySA+ crosswalk. See `soc-analyst-track-reimagining/VISION.md`. |

Completed foundations include the grading-breakdown UI, domain-appropriate
Module 06/08 review, Module 09 ticket framing, and the Module 05→06 Arc C
connector. Reopen them only for a regression or new owner direction.

The internal **Message Instructor** capability is also complete: students
compose and read plain-text threads in the portal, faculty have a scoped Inbox
and unread badges, and the persistent shared banner on every course module
links directly to the portal compose form. It is not a queued work item and
must remain one shared message system rather than separate module-level inboxes.
See `HANDOFF_2026-09-18_FACULTY_GATE.md` (Sprint E) for implementation and
verification evidence.

## Agent protocol

Work one roadmap item or approved subtask at a time.

1. Read this file and the governing specification for the selected item.
2. State the acceptance criteria and intended files before editing.
3. Preserve unrelated worktree changes and implement the smallest coherent
   change.
4. Run `bash bin/ci-check.sh`, plus focused browser/UAT checks appropriate to
   the change.
5. Record concise evidence in `HANDOFF.md`. Update this roadmap's state only
   after its definition of done is met; archive finished detailed handoffs.

Never treat a status note as proof that a migration, browser flow, or release
succeeded. Verify it in the appropriate environment.

## CI/CD pipeline

```text
Approved roadmap item
  → focused implementation branch / pull request
  → CI: syntax + portal render + simulator route/navigation render + diff check
  → review against the work-item definition of done
  → merge to master
  → CD: validate again, assemble single-origin site, deploy to GitHub Pages
  → controlled UAT for changes to data, permissions, grading, or migrations
```

- `bin/ci-check.sh` is the shared, read-only local and CI gate. It does not
  mutate QA logs or a linked database.
- `.github/workflows/ci.yml` runs that gate on pull requests and `master`.
- `.github/workflows/pages.yml` runs the same gate before publishing the
  single-origin portal and simulator to GitHub Pages.
- Linked-Supabase migrations and faculty/student UAT remain explicit release
  gates because they create persistent shared data and require approved access.

## Document roles

| Document | Role |
|---|---|
| `ROADMAP.md` | Canonical delivery order, Module 1 direction, agent protocol, and CI/CD reference |
| `INSTRUCTIONAL_ARCHITECTURE.md` | Program-wide Learn/Practice/Prove pedagogy, guidance-reduction curve across modules 01–12, and the module-completion rubric |
| `HANDOFF.md` | Concise evidence for the currently active roadmap item |
| `NEXT_SESSION.md` | Pointer only; never a second task queue |
| `soc-analyst-track-reimagining/VISION.md` | Strategic curriculum rationale and future tool gaps |
| `soc-analyst-track-reimagining/REBUILD_PLAN.md` | Detailed curriculum-arc specification |
| `ACADEMY_ORIENTATION_SPRINT.md` | Academy-wide first-login orientation tour (`portal/orientation.js`) — separate from and does not satisfy this roadmap's Module 1 orientation-tour item |
| `soc-analyst-track-reimagining/MODULE1_DAY1_REBUILD_PLAN.md` | Detailed Module 1 implementation specification |
| `HANDOFF_2026-09-18_FACULTY_GATE.md` | Faculty-gate implementation/UAT and completed Message Instructor evidence |

## Current action

Verify and complete the required beginning-of-Module-1 orientation tour, then
run faculty-gate UAT when controlled credentials are available. The next large
implementation is the simulator-first Module 1 performance assessment.
