# Lab Grading & Notification System — Initial Brief

**Status:** Brief locked. Scan/gap comparison done (`00_SCAN_AND_GAP_COMPARISON.md`).
Build not started.
**Owner directive captured:** 2026-09-13, verbal CEO-level brief from Alex.
**Relationship to existing docs:** This project narrows and extends the
grading/admin-panel items already scoped at the root of
`Mission_Next_Technical_Academy_SOC_Analyst_course/00_current_state_scan.md`
and `01_plan_of_action_milestones.md` (Sprints 1–2 there). Those docs cover
the platform-wide 12-module rebuild; this directory is the focused build-out
of just the grading/notification loop, with the specific mechanics below
that weren't nailed down before.

---

## The requirement, as given

**Executive framing:** instructors grade a lab per module. This is not
instructors watching a student work — it's a review-and-feedback step on
work the student already did and the system already scored.

1. **Notification, not a queue the instructor has to go hunting through.**
   A notification appears directly on the specific course card on the admin
   panel: *"3 Labs need grading."* Per-card, per-course — not a single
   global queue.

2. **The lab is already pregraded.** The student's performance in the UI on
   the actual on-the-job-style work item **is** the grading. The system
   already knows what the student got right and wrong before an instructor
   ever looks at it — this is not a blank submission waiting for a human to
   score from scratch.

3. **What's missed and why populates on the admin panel.** Exactly which
   parameter(s) the student got wrong, and the reason it's wrong, surfaces
   in the admin panel automatically, per student, per lab.

4. **The teacher's role is human feedback, not scoring from zero:**
   - Handwritten feedback fields, one input per wrong item — the instructor
     writes specific, per-mistake commentary rather than one blob of notes.
   - A button the instructor clicks to send it back to the student: what
     was wrong, why it was wrong, and what to do to fix it.
   - This triggers a **redo** — the student gets another attempt at the
     specific thing they got wrong, with the instructor's guidance attached.

5. **Scoring gate: 70% minimum to pass, enforced per lab, per module** — not
   a track-wide average. Each lab within each module has its own 70% floor;
   falling short routes into the redo loop above rather than passing through.

6. **Admin panel cards are currently too small for this.** The existing
   course-card tile (`portal/app.js` `tile()`, ~line 741,
   `px-3 py-2.5` single-line flex row) has no room for a notification
   badge/count. Card layout needs to grow before the "N Labs need grading"
   badge can land on it.

---

## What this explicitly is NOT
- Not a system where the instructor invents a grade from an ungraded
  blank submission — the auto-scoring already exists in some form
  (`lab_attempts.score`, `pass_threshold`) and is the starting point, not
  something to build from scratch.
- Not a single flat "grading queue" list with no per-card visibility on the
  course cards themselves (that was the old POA&M's Sprint 1 framing — this
  brief is more specific: the count lives on the card).
- Not a global percentage across a whole program — the 70% gate is
  per-lab, per-module.

## Open questions for the next working session
1. Does "redo" reset just the failed parameter/section, or the whole lab
   attempt? (Brief implies "the specific thing they got wrong" — leans
   toward parameter-level redo, but the current schema scores a whole lab
   attempt, not sub-fields — needs a decision, see gap doc.)
2. Does an instructor's per-mistake feedback get stored as structured data
   (queryable, reportable) or free text per field? (Leans structured, one
   record per flagged parameter, given "input fields per wrong thing.")
3. Multiple instructors per cohort — does the notification badge follow
   cohort/track assignment, or is it global to all admins?
