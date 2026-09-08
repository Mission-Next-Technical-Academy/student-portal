# Mission Next Multi-Track Administration and M360 Progress Architecture

Status: proposed implementation architecture  
Scope: `http://127.0.0.1:8768/#/admin`, technical-track administration, M360 progress visibility, and the Supabase read model  
Non-scope: changing curriculum, awarding credentials, recording attendance minutes, or making application changes in this document

## 1. Outcome

The Admin dashboard becomes one clean, consistent control plane for every Mission Next technical track.

| Track code | Track | Technical requirement | M360 eligibility now |
|---|---|---:|---|
| `SOCAN` | SOC Analyst | 12 modules | Yes |
| `HDESK` | IT Help Desk | 12 modules | Yes |
| `AIENG` | AI/ML | 12 modules | Yes |
| `ELECT` | Electrical | 12 modules | Yes |

Every student remains visible in the master roster. An administrator can filter or enter a track-specific administration workspace without losing the all-student view. Each student row/card has one primary completion indicator. For M360-eligible students, it represents 12 technical modules plus six accepted M360 weeks; M360 completion gates remain visibly separate so 18/18 is never falsely shown as fully completed M360.

The requested Networking / 5 and Interview / 5 values remain Start Here readiness signals below the completion indicator. They are not completion units, grades, attendance, or substitutes for reviewed M360 work.

## 2. Current-state findings

### Existing strengths

- `portal/data.js` defines four consistent 12-module technical programs.
- `module_progress` is the durable technical record and `course_progress` is its per-student rollup.
- `admin_student_progress` already provides an all-track technical roster.
- M360 has durable isolated tables, staff review actions, presentation verification, and an external-attendance verification bridge.
- `portal/m360/review.html` is a purpose-built M360 reviewer workspace.

### Gaps

1. `#/admin` renders a technical-progress roster table and does not receive M360 progress, gates, or readiness from Supabase.
2. `portal/m360-entry.js` injects one generic M360 administration call-to-action below the admin heading. It does not scale into a consistent multi-track administration pattern.
3. M360 eligibility is duplicated across client code and database constraints. The canonical policy must include `SOCAN`, `HDESK`, `AIENG`, and `ELECT` consistently.
4. A legacy browser-local `m360CompletionSummary()` exists, but it is not suitable for an admin dashboard or durable completion display.
5. Technical 12/12 must not become program completion automatically when M360 is required.

## 3. Authoritative completion model

### Technical course

Technical progress remains derived from `module_progress`:

```text
technical_completed = count(module_progress where state = 'complete')
technical_required  = 12
technical_percent   = technical_completed / 12
```

`in_progress` is useful for status and activity but never raises the completion numerator.

### M360 course

The existing durable M360 view remains authoritative:

```text
m360_artifacts_accepted = accepted_artifact_count       # 0..6
m360_weeks_graded       = graded_week_count             # 0..6
m360_grade_ready        = all 6 graded and final grade >= 70
m360_spotlight_ready    = accepted Week 6 + staff-verified presentation
m360_attendance_ready   = staff-confirmed external requirement
m360_course_complete    = all conditions above are true
```

`start_here_completed_at` is a completion-support signal but is not one of the six artifact units. Networking comfort and interview readiness are 1–5 baselines only; they do not affect completion.

### One primary completion bar

The single bar is a work-item indicator, not a credential or attendance claim.

| Student type | Bar label | Numerator / denominator | Full-bar condition |
|---|---|---:|---|
| M360 eligible (all tracks) | `Coursework 14 / 18` | technical modules complete + accepted M360 weeks / 18 | 12 modules and 6 accepted M360 weeks |

Show a status chip adjacent to the bar for M360-eligible students:

| Condition | Chip |
|---|---|
| Technical work incomplete | `Technical coursework in progress` |
| 12/12 technical, M360 incomplete | `Technical complete · M360 pending` |
| 18/18 work units, M360 gate incomplete | `M360 verification pending` |
| 12/12 technical and `m360_course_complete` | `Program requirements complete` |

## 4. Admin information architecture

### Navigation

Replace the singleton injected M360 card with a reusable **Track Administration** strip in the Student Progress tab:

```text
Student Progress
├── All Students                    [default master roster]
├── SOC Analyst Administration      [SOCAN roster / technical detail]
├── IT Help Desk Administration     [HDESK roster / technical detail]
├── AI/ML Administration            [AIENG roster / technical detail]
├── Electrical Administration       [ELECT roster / technical detail]
└── M360 Administration             [eligible cross-track review workspace]
```

The technical controls navigate to `#/admin/track/SOCAN` (and equivalent track codes). M360 opens `m360/review.html` only after the existing M360 authorization check. M360 stays one cross-track reviewer workspace, not three copies; technical workspaces may launch it with an optional track filter.

### Shared visual contract

All five controls use the same card geometry and action:

- Equal-height cards in a responsive 2–5 column grid; one full-width card per row on mobile.
- Track eyebrow, title, one-line purpose, optional count badge, and consistent `Open administration` button.
- M360 retains the orange accent; technical cards use the established navy/orange tokens.
- No absolute-positioned action button: it remains in the card grid so wrapped text cannot create mismatched spacing.

### All Students roster

Each student row becomes a compact summary with drill-in:

```text
Student ID · Track · Enrollment/status                         [View details]
████████████████░░░░  Coursework 14 / 18
Technical 12 / 12 · M360 2 / 6 accepted · M360 verification pending
Start Here: complete · Networking 4 / 5 · Interview 3 / 5
```

- Every row shows technical progress, including not-started and withdrawn students.
- All track rows show the M360 line and readiness baseline.
- An eligible student with no M360 row shows `M360: not started`; readiness values are not invented.
- The existing filter uses human track labels, with codes available secondarily for precision.

### Track administration workspace

`#/admin/track/:trackCode` is a filtered presentation of the same authoritative roster data—not a new table or a second calculation. It contains:

1. Track summary: enrolled, not started, active, technical complete, and—for M360 tracks—M360 complete / verification pending.
2. The same reusable student-summary component as All Students.
3. A student detail drawer with technical state, M360 milestones where applicable, Start Here support signals, and reviewer links.
4. A return to All Students and a track switcher.

Detailed M360 evidence review, faculty feedback, Career Spotlight updates, and attendance confirmation remain in `m360/review.html`; they are not duplicated in the technical drawer.

## 5. Supabase read model

Add one read-only, admin-gated view such as `public.admin_student_program_progress`. Do not widen the reporting-focused `admin_student_progress` with a large M360 field set.

| Field group | Proposed fields | Source |
|---|---|---|
| Identity / enrollment | `student_id`, `user_id`, `track_code`, `program_slug`, `is_enrolled`, existing status/dates | `students`, existing read model |
| Technical | `technical_completed`, `technical_required`, `technical_percent`, `technical_in_progress`, `technical_last_active` | `course_progress` |
| Applicability | `m360_required` | canonical eligibility policy |
| M360 work | `m360_accepted_weeks`, `m360_required_weeks`, `m360_graded_weeks`, `m360_final_grade` | `m360_course_progress` |
| M360 gates | `m360_start_here_complete`, `m360_spotlight_complete`, `m360_attendance_complete`, `m360_course_complete` | `m360_course_progress` |
| Readiness | `networking_comfort`, `interview_readiness`, `support_flag` | controlled Start Here payload projection |
| UI rollup | `work_items_completed`, `work_items_required`, `work_items_percent`, `program_requirements_complete` | SQL derived |

Project only the three named readiness values. Do not pass the entire Start Here payload into the technical administration list. Full payload access remains in the M360 review workspace.

```sql
m360_required := s.track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT');
technical_completed := coalesce(cp.modules_complete, 0);
technical_required := 12;
m360_accepted_weeks := case when m360_required then coalesce(mp.accepted_artifact_count, 0) else null end;
m360_required_weeks := case when m360_required then 6 else null end;
work_items_completed := technical_completed + case when m360_required then m360_accepted_weeks else 0 end;
work_items_required := 12 + case when m360_required then 6 else 0 end;
program_requirements_complete := technical_completed = 12 and (not m360_required or coalesce(mp.course_complete, false));
```

The view writes nothing. Existing M360 RPCs remain M360’s only mutation path; technical completion continues to write `module_progress`.

### Eligibility policy

The eligibility list currently appears in `portal/m360-entry.js`, `portal/m360/m360-data.js`, M360 table constraints, and `m360_current_student_track()`. Introduce one database policy function or small policy table as the canonical source, then have the M360 client consume its result. It must return true for `SOCAN`, `HDESK`, `AIENG`, and `ELECT`.

The approved migration must include Electrical in constraints and authorization, make records creatable without backfilling completion, and update the policy/client. Electrical uses the same 18-item denominator as the other M360-eligible tracks.

## 6. Frontend boundaries

| Surface | Responsibility |
|---|---|
| `portal/app.js` | admin routes, one read-model load, shared control strip, roster summary, track workspace, status wording |
| `portal/m360-entry.js` | retire/replace singleton admin card; do not calculate durable M360 progress here |
| `portal/m360/review.html` and related scripts | optional track filter; retain review and verification writes |
| `portal/data.js` | display metadata for track controls only, never student completion truth |
| New Supabase migration | eligibility source, admin progress view, grants, RLS-safe checks, and query-plan indexes if needed |

The UI performs one roster `select` and filters it client-side for All Students and individual track workspaces. Avoid per-student M360 requests (N+1 queries and inconsistent refreshes).

## 7. Safety and reporting rules

- Do not alter `course_progress`, `module_progress`, technical hour awards, or the existing `admin_student_progress` contract for this feature.
- Never count M360 weeks as technical modules or technical hours.
- Never infer M360 attendance from login, browser, or session data.
- Do not change diploma/credential eligibility unless its governing policy explicitly adds M360 completion.
- Preserve RLS: students read their own records; only admins consume all-student progress and reviewer actions.
- Keep missing, not-started, and not-applicable distinct in copy and styling.

## 8. Delivery sequence

1. Confirm the canonical M360 eligibility policy for SOCAN, HDESK, AIENG, and ELECT.
2. Create and apply the additive Supabase migration; inspect the view from admin and student sessions to verify RLS.
3. Build the shared Track Administration strip and all-student summary component.
4. Add `#/admin/track/:trackCode` with the same component/read model.
5. Add optional M360 reviewer filtering and return-to-unfiltered navigation.
6. Retire the legacy singleton M360 admin entry only after its replacement is live and keyboard-accessible.
7. Verify the state matrix below before release.

## 9. Acceptance matrix

| Scenario | Expected result |
|---|---|
| SOCAN: 12/12 technical, 0 M360 accepted | `Coursework 12 / 18`; `Technical complete · M360 pending` |
| HDESK: 6/12 technical, 3 M360 accepted | `Coursework 9 / 18`; readiness remains separate |
| AIENG: 12/12 + 6 accepted, attendance unverified | `Coursework 18 / 18`; `M360 verification pending`; never complete |
| Eligible student: all M360 gates plus 12/12 | `Coursework 18 / 18`; `Program requirements complete` |
| ELECT: 12/12 technical, 0 M360 accepted | `Coursework 12 / 18`; `Technical complete · M360 pending` |
| Eligible student: no M360 record | Technical bar valid; `M360: not started`; no fabricated readiness |
| Any technical control | Same size/spacing/format, correct filtered roster, no duplicated M360 workspace |
| Non-admin access | No all-student data from new view; existing redirect/denial stays enforced |

## 10. Decision needed before implementation

Electrical M360 eligibility is decided: SOCAN, HDESK, AIENG, and ELECT all require M360. Implementation must make the canonical policy, constraints, authorization, and read model consistent with that decision; Electrical progress uses the 18-item denominator without implying that any existing work is complete.
