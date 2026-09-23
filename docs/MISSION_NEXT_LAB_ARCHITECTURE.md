# Mission Next Lab Architecture Audit

**Status:** Story A2 discovery complete; implementation not started  
**Audit date:** 2026-09-23  
**Scope:** Mission Next Academy shell, SOC Analyst Modules 1 and 2, lab state, submission, verified progress, and instructor review  
**Standard:** `docs/LAB_ASSESSMENT_STANDARD.md`

This is a source and deterministic-CI audit. It did not apply migrations or
write test submissions to the live Supabase project. Database conclusions below
describe the repository contract when migrations are applied in filename order.

## 1. Executive conclusion

Mission Next already has the right major platform boundaries for migration:

```text
route/access control
  -> registered module view
  -> shared Academy topbar + Learn/Practice/Prove rail
  -> module-specific simulator/workspace
  -> LabRuntime draft state
  -> recordLabAttempt() append-only submission
  -> Supabase grading queue
  -> human-readable instructor review
```

Module 1 and the improved Module 2 both use the shared Academy shell while
preserving occupationally distinct tools. Module 1 uses a focused SOC case
console; Module 2 uses a focused Network & Identity Security workspace. Neither
active experience depends on replacing the Academy shell or embedding the full
`ui/` simulator.

The smallest migration seam is therefore a **shared assessment-submission
adapter immediately above `recordLabAttempt()`**, paired with the existing
`LabRuntime.loadCaseState()` / `saveCaseState()` draft seam. Migrated simulators
should emit one normalized, reviewable submission envelope; they should not
replace routing, module registration, Academy navigation, Supabase attempts, or
the grading queue.

The audit also found contract drift that must be addressed before treating the
current assessment lifecycle as the migration-ready reference:

1. SOC Module 2's CI failure is a false negative caused by case-sensitive text
   recognition, not a missing assessment surface.
2. Module 1 submits a readable case artifact, but its payload lacks the
   `simulator_performance.actions` array required by the latest
   repository-defined database completion view. Faculty approval therefore
   cannot produce verified Module 1 completion from the current payload under
   that contract.
3. Module 2 persists and queues only a fully correct submission as `complete`.
   A non-perfect submission is labeled submitted, locked locally, stored as
   `in_progress`, and excluded from the instructor queue.
4. Module 2 verified completion currently depends on an automated passing
   attempt, not faculty approval. This does not meet the repository standard
   that automated scoring is a recommendation rather than the final academic
   decision.
5. Module 1 and Module 2 expose explainable category point totals and readable
   writing, but neither current payload implements the standard's normalized
   competency/evidence model or tests multiple valid investigation paths.

This document is an architecture audit only. No simulator, portal, test, or
database code was changed.

## 2. Evidence and load order

The portal is a static, script-tag application. Its relevant browser load order
is:

```text
portal/data.js
portal/lab-runtime.js
portal/module-registry.js
portal/soc-analyst-module-01.js
portal/soc-analyst-module-02.js
portal/soc-analyst-module-02-environment.js
...
portal/app.js
```

Evidence: `portal/index.html:197-205,253`.

Both Module 2 files call `registerModuleLab()` for
`soc-analyst/module/2`. The registry stores a single definition per
`program/moduleNumber`, so the later environment registration replaces the
legacy definition:

- first registration: `portal/soc-analyst-module-02.js:1377-1378`;
- active replacement: `portal/soc-analyst-module-02-environment.js:461`;
- replacement behavior: `portal/module-registry.js:25-56`.

This is deterministic because the environment script loads second. It is also
implicit: the registry neither declares an override nor warns on duplicate
registration. For this audit, "Module 2" means the active environment view in
`soc-analyst-module-02-environment.js`; the earlier file is loaded but is not
the routed Module 2 view or wire handler.

## 3. Shared Academy shell

### 3.1 Route, access, render, and wiring

`app.js` matches `#/program/<slug>/module/<number>`, asks
`moduleLabFor()` for the registered module, applies `hasModuleAccess()`, and
renders the module's `view(user, program)`. After inserting the HTML it runs
`wireCommon()` and then every active registered module's `wire()` function.

Evidence:

- route/render boundary: `portal/app.js:6700-6724`;
- common then module wiring: `portal/app.js:6862-6971`;
- registry lookup/fallback: `portal/module-registry.js:59-91`;
- isolated module wiring: `portal/module-registry.js:94-115`.

The registry wraps each authored view. `moduleUnifiedNav()` records whether it
had to generate Foundations, Guided Lab, or Assessment Lab. If a module lacks
an authored Assessment Lab, the registry appends the platform-owned generic
assessment. If the module already authored one, its HTML is returned without a
duplicate.

Evidence: `portal/module-registry.js:30-54`,
`portal/app.js:4215-4259,4397-4515`.

### 3.2 Shared visual and progression shell

Both audited modules compose these existing platform components:

| Shared component | Responsibility | Evidence |
|---|---|---|
| `moduleTopbar()` | Back navigation, program progress, instructor message, identity, sign-out | `portal/app.js:4095-4131` |
| `moduleUnifiedNav()` | One Learn It / Practice It / Prove It rail, locking, progress, review mode, supplemental sources | `portal/app.js:4397-4541` |
| `normalizeModuleStages()` | Ensures the three-stage contract and adds fallback surfaces only when absent | `portal/app.js:4215-4259` |
| `registerModuleLab()` | Per-module view/wire registration and generic assessment composition | `portal/module-registry.js:25-56` |
| `wireCommon()` | Shared sign-out, messaging, navigation, generic assessment submission, and module wiring | `portal/app.js:6862-6971` |
| `LabRuntime` | Namespaced local draft state and optional remote case-state hydration/write-through | `portal/lab-runtime.js:9-139` |

The shell is already the right reuse boundary. The internal controls and data
models of a SIEM, identity console, EDR, terminal, or forensic workspace should
remain module-specific.

### 3.3 Current module-specific simulators

| Module | Active tool | Launch model | Academy relationship |
|---|---|---|---|
| SOC 1 Practice | Three-pane SOC case console: alert queue, sign-in log/evidence, incident/case record | `?console=practice` in a new same-origin tab | Module page retains shared topbar/rail; workspace intentionally removes LMS chrome |
| SOC 1 Prove | Fresh three-pane independent case console | `?console=prove` in a new same-origin tab | Same UI family as Practice, less guidance, separate scenario |
| SOC 2 Learn | Network & Identity Security console embedded in the Learn section | In-page | Guided highlighting teaches map/activity/identity/device/resource/policy concepts |
| SOC 2 Practice | Network & Identity Security workspace plus coached decision artifact | `?console=m02-practice` in a new same-origin tab | Same tool as Learn/Prove, guided case and hints |
| SOC 2 Prove | Network & Identity Security workspace plus independent access-review case record | `?console=m02-prove` in a new same-origin tab | Fresh evidence set, no answer reveal after submit |

Evidence: `portal/soc-analyst-module-01.js:847-992,1013-1109,1167-1190` and
`portal/soc-analyst-module-02-environment.js:337-415`.

## 4. Module 1 end-to-end trace

### 4.1 Render and launch

1. `viewModuleOne()` loads state, checks `location.search`, and chooses the
   Academy module page, Practice console, or Prove console
   (`portal/soc-analyst-module-01.js:1167-1189`).
2. The normal module page renders `moduleTopbar()` and `moduleUnifiedNav()`
   with Foundations, Knowledge Check, Guided Lab, Assessment Lab, and Sources
   (`portal/soc-analyst-module-01.js:1155-1164,1185-1320`).
3. Practice and Prove launch cards open focused, same-origin tabs while keeping
   the user's session and shared browser storage
   (`portal/soc-analyst-module-01.js:855-865,1020-1033`).
4. Module-specific wiring handles evidence rows, ticket fields, save, submit,
   and rerendering. The registry also retains a legacy, origin-checked
   `mnt-coach-complete` message handler, although the active launch cards use
   the local case-console routes (`portal/soc-analyst-module-01.js:1423-1603,
   1983-2034`).

### 4.2 Draft state and persistence

Module 1's state contains foundation/quiz state, guided-practice ticket state,
and a separate `lab2` Prove case record with selected evidence, determinations,
actions, notes, and handoff fields (`portal/soc-analyst-module-01.js:60-100`).

`moduleOneLoad()` calls `LabRuntime.loadCaseState()` and
`moduleOneSave()` calls `LabRuntime.saveCaseState()`
(`portal/soc-analyst-module-01.js:143-188,261-268`). This produces:

- an immediate namespaced `localStorage` recovery copy;
- debounced write-through of the full case state to
  `module_progress.case_state` for authenticated students;
- remote hydration only when the local record still exactly matches fresh
  defaults;
- flushes on document hide or page unload.

The merge is deliberately not timestamp based; concurrently progressed devices
can conflict (`portal/lab-runtime.js:83-137`). `module_progress.case_state` is
an opaque JSONB field covered by the existing per-student RLS policy
(`supabase/migrations/20260916120000_module_one_case_state.sql:1-14`).

Separate Module 1 progress evidence is persisted through:

- `module_progress.detail` as a ratcheted summary;
- `module_completion_evidence` for nine lessons and the knowledge check;
- `student_verified_module_progress` as the academic completion read model.

Evidence: `portal/soc-analyst-module-01.js:222-258`,
`supabase/migrations/20260916050000_module_one_detail_beacon.sql:19-28`, and
`supabase/migrations/20260916110000_module_one_evidence_integrity.sql:5-45`.

The guided console is intentionally practice, not the graded artifact. Its
current same-origin submit marks local engagement and saves draft state but
does not create a `lab_attempts` row (`portal/soc-analyst-module-01.js:1482-1498`).
The later migration removes `lab-soc-environment` from the canonical assessment
map, so this is consistent with the walkthrough being optional
(`supabase/migrations/20260917100000_module_one_tour_ungate.sql:1-27`).

### 4.3 Prove submission and scoring

The Prove workflow requires evidence review, ticket fields, supported scope,
an escalation decision/route when applicable, and an analyst note of at least
80 characters. Its score awards separate points for affected entities,
severity, disposition, escalation, and notes, with tiered partial credit for a
principal versus supported pivot entity (`portal/soc-analyst-module-01.js:
508-590`).

`moduleOneFinalizeProveIt()`:

1. freezes the local `lab2` record as submitted;
2. saves the entire working state;
3. inserts an append-only `lab_attempts` row for `lab-soc-escalation` with
   `state: complete`, score, breakdown, feedback, critical errors, and the full
   `case_record`;
4. marks local engagement complete and refreshes progress.

Evidence: `portal/soc-analyst-module-01.js:117-140`.

The student sees submission confirmation, not the live answer key or score.
An instructor-requested redo is read from the user's latest remote attempt and
unlatches `lab2.submitted` so the student can revise and resubmit
(`portal/soc-analyst-module-01.js:113-115,181-188,592-601`).

### 4.4 Instructor review

A completed attempt with `reviewed_at IS NULL` enters the admin or assigned
faculty grading view. The review card displays:

- student, lab, track, timestamp, automated score, and pass threshold;
- a human-readable Student-submitted case ticket;
- status, severity, affected entities, disposition, escalation, route;
- the full analyst note with whitespace preserved;
- any non-empty handoff writing;
- system breakdown and feedback;
- raw JSON only as a secondary debug disclosure;
- instructor feedback items plus Approve / Send back for redo actions.

Evidence: `portal/app.js:995-1082,1085-1132,7700-7772`.

Instructor feedback is append-only in `lab_attempt_feedback`. Approval or
return updates `lab_attempts.reviewed_at`, `reviewed_by`, and
`redo_requested`; RLS grants the student their own attempts and an authorized
reviewer the update path (`supabase/migrations/20260913120000_lab_grading_review.sql:
9-61`).

### 4.5 Module 1 contract gap

The latest repository-defined `student_verified_module_progress` view requires a Module 1
`lab-soc-escalation` attempt to contain a non-empty
`result.simulator_performance.actions` array and to be faculty approved
(`supabase/migrations/20260918100000_module_one_faculty_performance_gate.sql:
4-21`). The current submitter sends only:

```text
breakdown
feedback
critical_errors
case_record
```

Evidence: `portal/soc-analyst-module-01.js:131-133`. There is no
`simulator_performance` occurrence in the current Module 1 file. Consequently,
the active payload cannot satisfy the latest server-side completion predicate,
even after a passing score and faculty approval. This is a real contract drift,
not the Module 2 CI detector issue.

## 5. Module 2 end-to-end trace

### 5.1 Render and launch

The active environment's `view()` loads state, renders a focused workspace for
the two `?console=` values, or otherwise composes the Module 2 Academy page from
`moduleTopbar()` and `moduleUnifiedNav()` (`portal/soc-analyst-module-02-
environment.js:374-415`).

The Academy page authors Learn It, Practice It, Assessment Lab, and Sources.
Practice and Prove launch the same vendor-neutral identity/network tool in
separate tabs. The simulator itself provides map, access activity, identities,
devices, resources, policies, and contextual drawers; it does not add a second
Academy phase rail.

### 5.2 Draft state and persistence

Module 2 reuses the legacy lab ID `m02-trust-path-review-v1` and normalizes old
saved scope shapes so existing local work does not throw or disappear
(`portal/soc-analyst-module-02-environment.js:93-151`).

Unlike Module 1, its active `load()` / `save()` calls use only
`LabRuntime.load()` / `LabRuntime.save()`. Thus:

- Learn, Practice, and Prove drafts are namespaced and durable in this browser;
- the remote `module_progress.case_state` hydration/write-through path is not
  used;
- a new browser/device cannot resume the Module 2 draft before submission;
- the submitted attempt itself remains durable in Supabase.

### 5.3 Prove submission and scoring

The learner selects an access event, makes a policy determination, selects
identity/device/resource/policy evidence, and writes an analyst note. The
scorer awards:

```text
45  correct target event + policy-violation determination
30  all four evidence categories selected
25  analyst note has at least 45 trimmed characters
```

The durable result contains the point breakdown, explanatory feedback, and an
`access_review` object with a human-readable selected-event label, decision,
selected evidence, and the full analyst note
(`portal/soc-analyst-module-02-environment.js:287-324`).

Only the exact full-credit combination writes `state: complete` and marks
local engagement complete. Every other submitted combination writes
`state: in_progress` (`portal/soc-analyst-module-02-environment.js:326-334`).

There are two consequences:

1. The grading views select only `state = 'complete'`, so non-perfect Module 2
   submissions do not enter instructor review
   (`supabase/migrations/20260913120000_lab_grading_review.sql:68-85` and
   `supabase/migrations/20260920120000_instructor_account_provisioning.sql:
   203-220`).
2. `p.submitted` is set before pass/fail is known and disables the assessment
   controls. The active Module 2 view does not consume the generic open-redo
   state or provide a reset/retry path. A non-perfect learner can therefore be
   told the submission was recorded for review while it is absent from the
   queue and locally locked (`portal/soc-analyst-module-02-environment.js:
   280-305,326-334`).

### 5.4 Instructor review and completion

For a perfect attempt, the shared grading card calls
`adminModuleTwoAccessReviewPanel()`, which renders the selected event, decision,
evidence, and full analyst note at readable width without requiring raw JSON
(`portal/app.js:1134-1155`). The generic score-breakdown and faculty feedback
controls then work as described for Module 1.

However, the latest repository-defined verified-progress view requires faculty
approval only when `module_key = 'soc-01'`. Module 2 becomes verified from a
complete passing attempt before the pending queue is reviewed
(`supabase/migrations/20260918100000_module_one_faculty_performance_gate.sql:
7-16`). It reaches the queue when perfect, but instructor review is not an
academic completion gate.

## 6. Persistence and review audit

| Concern | Current mechanism | Module 1 | Module 2 | Audit result |
|---|---|---|---|---|
| Local draft isolation | `mnt-portal.lab-state.v1.<lab>.<anonymous-student>` | Yes | Yes | Meets baseline |
| Cross-device draft | `module_progress.case_state` via `loadCaseState/saveCaseState` | Yes, local-first merge | No | Module 2 gap |
| Append-only attempts | `recordLabAttempt()` inserts `lab_attempts` | Prove only | Every Prove submit, but failures are `in_progress` | Partial |
| Attempt metadata | user, lab, track, state, score, result, rubric/scorer version, threshold, timestamps | Yes | Yes | Meets structural baseline |
| Full student writing | JSONB result plus readable review panel | `case_record.notes` and handoff | `access_review.analystNote` | Meets for queued attempts |
| Selected evidence/determination | Module-specific JSONB | Full ticket/evidence state | selected event/evidence/decision | Meets basic requirement |
| Semantic actions | Structured meaningful action list | Local `actionHistory`, but no required server `simulator_performance.actions` | Opened entities stay local; no submitted semantic actions | Gap |
| Competency payload | Named earned/available competency results with evidence contributions | Flat category points and feedback | Flat category points and feedback | Gap |
| Partial credit | Scenario/rubric supports meaningful partial performance | Entity-tier and routing partial credit | All-or-nothing decision/evidence/note buckets | Module 2 gap |
| Multiple valid paths | Equivalent evidence/determinations earn equivalent competency credit | Not demonstrated/tested | One answer event and decision | Gap |
| Instructor queue | completed, unreviewed attempts | Yes | Perfect only | Module 2 gap |
| Human approval gates completion | verified-progress view | Intended, but payload cannot satisfy action predicate | No | Gap in both, for different reasons |
| Redo lifecycle | feedback rows + latest attempt redo signal | Consumed and resubmittable | Signal exists globally but active module does not consume it | Module 2 gap |
| Score adjustment/final score | Standard requires permitted adjustment | Approve/return and feedback only | Same | No explicit score-adjustment path |

`recordLabAttempt()` is the authoritative client insertion seam. It always
inserts rather than upserts, stamps the current fixed rubric/scoring-engine
versions and 70 threshold, then refreshes the verified read model
(`portal/app.js:3758-3801`). Student writes are protected by ownership and
track-access RLS (`supabase/migrations/20260828160000_simplify_schema.sql:
286-306`).

The platform-owned generic Assessment Lab is not a substitute for the authored
Module 1/2 flows, but it exposes a related shared gap: it records its attempt as
`in_progress` and separately inserts a portfolio artifact, while the grading
queue only reads completed attempts. Its UI says instructor review is pending,
but that attempt will not appear in the current grading queue
(`portal/app.js:6918-6965`). The migration adapter should fix the common
submission-state meaning once, rather than reproduce this behavior in imported
tools.

## 7. Pre-existing Module 2 CI failure

### Reproduction

From the repository root:

```text
$ node bin/portal-check.js 2
  module 2  OK  (its-02, 30521 chars)
  module 2  FAIL  missing authored Assessment Lab surface
  module 2  OK  (aim-02, 34612 chars)
  module 2  OK  (eee-02, 10194 chars)
  program overview  OK
```

Full baseline command:

```text
$ bash bin/ci-check.sh
== JavaScript syntax ==
== Portal module render ==
...
  module 1  OK  (soc-01, 105619 chars)
  module 2  FAIL  missing authored Assessment Lab surface
  module 3  OK  (soc-03, 60095 chars)
...
```

Exit status was `1`. Because `bin/ci-check.sh` uses `set -e`, the later
simulator render/navigation and whitespace gates did not run.

### Cause

This is a recognition-contract mismatch:

1. The active Module 2 nav declares a section titled exactly `Assessment Lab`
   (`portal/soc-analyst-module-02-environment.js:339-345`).
2. `normalizeModuleStages()` therefore does not generate a generic assessment,
   and the rendered rail reports `data-standard-assessment="false"`
   (`portal/app.js:4248-4258,4515`).
3. The registry correctly preserves the authored Module 2 page instead of
   appending a duplicate (`portal/module-registry.js:48-53`).
4. The render gate's authored branch searches for the exact,
   case-sensitive string `Prove It · Assessment Lab`
   (`bin/portal-check.js:194-207`).
5. The visible Module 2 heading is `Prove It · assessment lab` with lowercase
   `assessment lab`, while the section, launch control, workspace, case form,
   submit handler, and review presenter all exist
   (`portal/soc-analyst-module-02-environment.js:399-407,280-335`).

Therefore CI reports a missing surface even though the active rendered module
has one. The smallest eventual fix is to make the render contract structural
(for example, an authored assessment data marker or target ID), not to discard
or replace Module 2. A one-character capitalization change would make this
specific baseline pass but would leave the recognition contract brittle.

## 8. Smallest shared adapter seam

### Recommendation

Add one small platform function beside `recordLabAttempt()`—conceptually
`submitReviewableLabAttempt()`—and have each module-specific simulator call it
at the point the learner submits Prove It.

The adapter should accept a normalized envelope equivalent to:

```text
moduleKey / labKey / assessmentVersion
startedAt / submittedAt
studentResponses[]          full, untruncated writing
selectedEvidence[]          semantic identifiers + readable labels
studentDeterminations[]
studentActions[]            meaningful actions, not navigation noise
competencyResults[]         competency, earned, available, evidence, misses
automatedScore / passThreshold / criticalErrors[]
scoreExplanation[]
moduleArtifact              optional module-specific snapshot
```

It should:

1. preserve a local/remote draft through the existing `LabRuntime` case-state
   functions;
2. write every actual submission as a completed **submission attempt** so pass
   and fail both reach the existing review queue;
3. call the existing append-only `recordLabAttempt()` rather than create a new
   persistence platform;
4. retain the module-specific artifact under a stable result key;
5. refresh verified progress, while leaving academic completion dependent on
   score/critical criteria and faculty disposition;
6. provide enough normalized data for one generic human-readable review panel,
   with Module 1/2 presenters retained temporarily as compatibility fallbacks;
7. expose redo state to the module so returned work becomes editable again.

### Why this is the minimum seam

- It composes with `LabRuntime`, `recordLabAttempt()`, the registry, the current
  grading views, and instructor decision controls.
- It does not change the 12-module catalogue or route model.
- It does not merge unlike security tools into one UI.
- It does not require migrating Module 1 or Module 2 rendering into a new
  component system.
- It eliminates per-module drift in submission state, payload vocabulary,
  writing retention, review eligibility, and redo behavior.
- Boots2Bytes engines can adapt semantic outcomes to this envelope without
  importing their local progress system as a parallel Academy.

Do **not** start by refactoring `module-registry.js`, replacing
`moduleUnifiedNav()`, or creating a second attempt/review table. The adapter
belongs at the already shared submission boundary. Scenario loading and
guidance mode may be composed around individual tools later, after the
migration crosswalk identifies which Boots2Bytes engines are actually needed.

## 9. Required follow-up before migration implementation

These are findings for later stories, not changes authorized by A2:

1. Replace the Module 2 render gate's text sniff with a structural authored
   assessment marker and retain the improved environment.
2. Reconcile Module 1's submitted result with the latest
   `simulator_performance.actions` server predicate, or deliberately replace
   that predicate with the current semantic case-action contract.
3. Make all Prove submissions—including failing/partial ones—durable and
   reviewable without conflating "submitted" with "passed."
4. Require human disposition for Module 2 and future Prove completion, with a
   reviewed/final score model where adjustment is allowed.
5. Move Module 2 drafts to `loadCaseState()` / `saveCaseState()` if cross-device
   resume is a product requirement.
6. Normalize competency/evidence/action payloads and add the assessment tests
   required by `docs/LAB_ASSESSMENT_STANDARD.md`.
7. Make returned Module 2 work editable and resubmittable using the existing
   latest-attempt redo signal.
8. Reconcile the platform generic Assessment Lab's `in_progress` submission
   with the completed-only grading queue.

## 10. Validation performed

- Read the full migration handoff and assessment standard.
- Traced browser script order, module registry replacement, route/render/wire
  flow, both active module views, launch URLs, local and remote state helpers,
  attempt insertion, verified-progress SQL, queue SQL, review rendering, and
  instructor decisions.
- Ran `node bin/portal-check.js 2`; reproduced the isolated SOC Module 2
  authored-surface failure while the other tracks' Module 2 views rendered.
- Ran `bash bin/ci-check.sh`; JavaScript syntax passed and the run stopped at
  the same SOC Module 2 portal-render failure with exit status 1.
- Confirmed by source inspection that the active Module 2 page contains its
  Assessment Lab and that the mismatch is exact string capitalization.
- Did not mutate or inspect live Supabase data; SQL findings are migration-order
  contract findings rather than a claim about a particular deployed database.
- Confirmed that this story changed only
  `docs/MISSION_NEXT_LAB_ARCHITECTURE.md`.
