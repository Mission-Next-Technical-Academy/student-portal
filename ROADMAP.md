# Delivery Roadmap — Mission Next Technical Academy

**Status:** Canonical delivery roadmap as of 2026-09-20. This is the one
starting document for people and agents. It defines priority, dependencies,
acceptance gates, and the CI/CD path. Detailed plans are implementation
references; they cannot independently authorize contradictory work.

## Product direction

Mission Next delivers supervised, job-shaped technical training. Learners
perform work in the simulated environment, and the durable evidence of that
work—not a parallel worksheet or quiz alone—is what an instructor reviews.

**Required implementation standard:** Any lab, simulator, Learn It, Practice
It, Prove It, assessment/scoring, or instructor/admin review work must follow
`docs/LAB_ASSESSMENT_STANDARD.md`. Module 1 is the UX reference; Prove It
requires a durable instructor-reviewable submission, readable student-written
work, competency-based partial credit, and support for multiple valid paths.

For the SOC Analyst track, Security+ remains the light conceptual spine and
CySA+-territory hands-on practice provides depth. Each module should move
through **Learn it → Practice it → Prove it**, where "Prove it" means
reduced-guidance application that produces the durable, instructor-reviewable
evidence described above — not a separate fourth stage. Lifecycle and scoring
sections may vary by domain; threat hunting and vulnerability management must
not be forced into a fake incident-response template. `docs/specs/INSTRUCTIONAL_ARCHITECTURE.md`
is the detailed reference for this cycle: the guidance-reduction curve across
modules 01–12, skill-carryover expectations, and the per-module "finished"
rubric. It does not authorize reordering modules, renaming keys, or changing
compliance-controlled hours — those remain governed by `docs/specs/MODULE_STANDARD.md`
and `docs/specs/CURRICULUM_ALIGNMENT_ARCHITECTURE.md`.

## Locked Module 1 sequence

**Module 1 begins with an LMS orientation tour. This is required.** It gives a
new learner the Day 1 context, rules of engagement, assigned scope, and a
clear tour of the workspace before the learner is asked to perform assessed
work. It must be accessible from the beginning of Module 1 and may be reopened
as a refresher.

**Superseded 2026-09-21 by `docs/specs/MODULE_01_CASE_CONSOLE_SPEC.md` — read that file
first for Module 1's actual assessment design.** This paragraph's original
"simulator-first... SIEM" language is no longer the target design and is kept
here only as history. The owner's specification is explicit and resolves what
was briefly an open discrepancy the same day (a same-day commit,`1add6d6`, had
already dropped `lab-soc-escalation`'s `simEntry` and moved Prove It to a
portal-only console before the spec landed — that pivot turned out to be
correct, not drift): **Module 1 does not use the full SOC range.** Both
Practice It and Prove It open their own small, focused, vendor-neutral case
console — Alert Queue / Logs+Evidence / Incident-Case Record — in a new
browser tab, launched from a card on the LMS page. The full `ui/` simulator
(SIEM query workspace, packet analyzer, EDR, threat hunting, etc.) is
deliberately withheld from Module 1 and remains reserved for later modules and
the capstone, per that spec's §15-16. The durable case record plus a
meaningful action-history log (not a raw simulator log) is the
instructor-reviewable artifact. Do not restore a parallel LMS worksheet or
expose a live student score — both rules still hold, they just now apply to
the case console instead of the SIEM.

**Built 2026-09-21 for Practice It** (`portal/soc-analyst-module-01.js`'s
`viewModuleOneCaseConsole()`, opened via a `?console=practice` query param on
Module 1's own route, in a new tab): three-pane case console with a real
sign-in-log table (not pre-summarized evidence cards — click a row to expand
its raw structured record, which is the actual "read the evidence" action),
the existing ticket-field record, and a persisted action history. Verified
live in Chrome: log rows expand and record real actions, Save/Submit Case
work, completion state round-trips back to the LMS card correctly ("Launch
Guided Lab" → "Resume Guided Lab" → "Review the case"), and "Back to Module
1" correctly leaves the console (an early version of that link only changed
the hash and left `?console=practice` in the URL, silently reopening the same
console — fixed to build the href from `location.pathname` instead of a bare
`#...` string). **Prove It (NST-2407) subsequently received the same
launch-card/new-tab pattern** via `?console=prove`, with its own evidence-log
table. Its learner-facing label is **Assessment Lab**; Practice It's is
**Guided Lab**.

The tour is orientation, not the assessment. It may observe real UI telemetry,
but it must not be the sole completion or grading evidence. The detailed
implementation reference is
`docs/workstreams/soc-analyst-track-reimagining/MODULE1_DAY1_REBUILD_PLAN.md`; this section
supersedes its former tour-versus-Objectives-panel ambiguity.

**Do not confuse this with the Academy-wide first-login orientation shipped
2026-09-20** (`archive/completed-feature-notes/ACADEMY_ORIENTATION_SPRINT.md`, `portal/orientation.js`) — a
separate, earlier layer that runs once at first login, before the student
ever opens Module 1: Welcome → Academy nav/programs/help → the student's
program → that program's module structure → Module 1 → Learn It/Practice
It/Prove It → how grading/review works. It is discipline-neutral (no SOC/
SIEM language) and program-agnostic across all four tracks. It does **not**
satisfy this section's requirement — Day 1 framing, rules of engagement,
assigned scope, and the workspace walkthrough remain owned by the in-module
`ui/coach.js` `m01-orientation` coach ("Take the tour").

**Fixed 2026-09-21:** the coach's content (Day 1 framing, rules of engagement,
assigned scope, alert-queue/severity/filters/sign-in-log walkthrough) was
already all there, but it was **not actually reachable from Module 1** —
nothing in the portal ever linked to `?coach=m01-orientation`, so the tour
existed only as dead content. Added a "🧭 Take the Day 1 tour" link to Module
1's hero section (`portal/soc-analyst-module-01.js`, opens
`${SIM_ORIGIN}?coach=m01-orientation&restart=1#/defender/alerts` in a new tab,
same pattern as the existing "Reopen the log" link) — reopenable any time, not
gating anything. Also fixed the tour's final 3 steps
(`ui/coach-data.js`), which still spotlighted `#/sentinel/incidents` /
`#m01-assigned-case-callout` / `#m01-escalate-btn` / `#mnt-submit-btn` — all
part of the simulator-based NST-2407 flow the same-day `1add6d6` commit
removed. Replaced with one accurate framing-only closing step describing the
case ticket console. `node --check` and `bash bin/ci-check.sh` clean.
Live-verified in Chrome later the same day: the launch link opens correctly,
steps advance ("Step 1 of 9" → "Step 2 of 9" confirmed), matching the trimmed
9-step count.

**New tension, noted 2026-09-21, not touched — owner said the tour itself is
fine, out of scope for now.** The tour's still-live steps walk `#/defender/alerts`
and `#/entra/sign-in-logs` inside the full `ui/` simulator — exactly the
surface `docs/specs/MODULE_01_CASE_CONSOLE_SPEC.md` §16 says a brand-new Module 1 learner
should not be dropped into. This wasn't rebuilt this session (explicit owner
direction), but it's a real inconsistency between the Day 1 tour and the new
case-console design worth resolving eventually: either move the tour's content
into the case console itself, or accept the tour as a deliberate, brief,
narrated exception to §16 since it's guided/observational rather than
free-roam.

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
| 1 | Module 1 orientation tour | **Built and live-verified 2026-09-21** | none | The beginning of Module 1 presents the LMS orientation tour: Day 1 framing, rules, scope, and workspace walkthrough. It is reopenable and does not replace assessment evidence. Reachable from Module 1's hero card; steps confirmed advancing live in Chrome. See the "new tension" note above (tour still uses the full simulator) — flagged, not blocking. |
| 2 | Faculty-gate live UAT | **Blocked on controlled credentials** | deployed faculty-gate migration | Controlled student submit → faculty return → resubmit → approve → Module 2 unlock is verified and recorded. |
| 3 | Module 1 case-console assessment | **Both Practice It and Prove It built and live-verified, 2026-09-21** | 1 and 2; cross-device state smoke test | Per `docs/specs/MODULE_01_CASE_CONSOLE_SPEC.md`: a focused case console (not the full SOC range) with a real log table, scoped action history, an incident/case record, and instructor-reviewable persistence. `viewModuleOneCaseConsole()` (Practice It, ALT-1001) and `viewModuleOneProveItCaseConsole()` (Prove It, NST-2407, with its own `logEvents` covering the identity/endpoint/proxy sources it correlates) both open in a new tab from the LMS page's launch card. Still gated on items 1 and 2 per this row's own dependency column. |
| 4 | Module completion integrity | **Queued** | 2 and 3 | Modules 2–12 receive verified-completion protection using the proven Module 1 pattern. See `docs/workstreams/module-completion-integrity/BRIEF.md`. |
| 5 | SOC curriculum Arc A | **Queued content work** | stable Module 1 assessment | Reconcile Modules 02→03 fixtures/narrative with owner content review. Arc B is undecided; do not build the rejected 07→04 pairing. |
| 6 | Tool-depth expansion | **Later discovery** | 5 sequencing decision | Scope real interactive CLI and PCAP lab surfaces plus CySA+ crosswalk. See `docs/workstreams/soc-analyst-track-reimagining/VISION.md` and `docs/workstreams/soc-analyst-track-reimagining/LAB_INTERFACE_ROADMAP.md` (per-module interface concepts, shared-component build order — owner vision, not yet scoped or authorized). |

Completed foundations include the grading-breakdown UI, domain-appropriate
Module 06/08 review, Module 09 ticket framing, and the Module 05→06 Arc C
connector. Reopen them only for a regression or new owner direction.

The internal **Message Instructor** capability is also complete: students
compose and read plain-text threads in the portal, faculty have a scoped Inbox
and unread badges, and the persistent shared banner on every course/module
and student-program page opens the same focused compose pane. It is not a queued work item and
must remain one shared message system rather than separate module-level inboxes.
Replies identify the sender's authority as either **Global Admin** or the
relevant course instructor without exposing staff email addresses.
See `docs/handoffs/HANDOFF_2026-09-18_FACULTY_GATE.md` (Sprint E) for implementation and
verification evidence.

## Agent protocol

Work one roadmap item or approved subtask at a time.

1. Read this file and the governing specification for the selected item.
2. State the acceptance criteria and intended files before editing.
3. Preserve unrelated worktree changes and implement the smallest coherent
   change.
4. Run `bash bin/ci-check.sh`, plus focused browser/UAT checks appropriate to
   the change.
5. Record concise evidence in `docs/handoffs/HANDOFF.md`. Update this roadmap's state only
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
| `docs/specs/MODULE_01_CASE_CONSOLE_SPEC.md` | Authoritative Module 1 lab design — owner spec, the case console (not the full SOC range) is the required shape |
| `docs/specs/INSTRUCTIONAL_ARCHITECTURE.md` | Program-wide Learn/Practice/Prove pedagogy, guidance-reduction curve across modules 01–12, and the module-completion rubric |
| `docs/handoffs/HANDOFF.md` | Concise evidence for the currently active roadmap item |
| `docs/handoffs/NEXT_SESSION.md` | Pointer only; never a second task queue |
| `docs/workstreams/soc-analyst-track-reimagining/VISION.md` | Strategic curriculum rationale and future tool gaps |
| `docs/workstreams/soc-analyst-track-reimagining/LAB_INTERFACE_ROADMAP.md` | Full-program per-module interface/component vision for item 6 — reference only, not scoped |
| `docs/workstreams/soc-analyst-track-reimagining/REBUILD_PLAN.md` | Detailed curriculum-arc specification |
| `archive/completed-feature-notes/ACADEMY_ORIENTATION_SPRINT.md` | Academy-wide first-login orientation tour (`portal/orientation.js`) — separate from and does not satisfy this roadmap's Module 1 orientation-tour item |
| `docs/workstreams/soc-analyst-track-reimagining/MODULE1_DAY1_REBUILD_PLAN.md` | Detailed Module 1 implementation specification |
| `docs/handoffs/HANDOFF_2026-09-18_FACULTY_GATE.md` | Faculty-gate implementation/UAT and completed Message Instructor evidence |

## Current action

The Module 1 orientation tour is built and live-verified. Both Practice It
and Prove It now open their own case console in a new tab per
`docs/specs/MODULE_01_CASE_CONSOLE_SPEC.md`. Run faculty-gate UAT when controlled
credentials are available (item 2) — the remaining real blocker on this
roadmap.

**Cross-course side item, 2026-09-21, not part of this roadmap's Module 1
scope but recorded here for visibility:** the same day's work also gave
"Sources & Further Reading" a detached "Reference" nav panel (not bordering
the graded Learn/Practice/Prove menu) across every module in every course
that has reference content — SOC Analyst 1–11, IT Support 1–12 (which had
no references content before this and got real citations written for the
first time), and AI-ML 1–12. See `docs/handoffs/HANDOFF.md`'s "Sources & Further
Reading — detached 'Reference' panel, platform-wide" entry for detail and
verification evidence. Excluded: SOC Analyst 12 (capstone, no sources
content) and the Electrical track's Module 1 (still an unauthored
placeholder).
