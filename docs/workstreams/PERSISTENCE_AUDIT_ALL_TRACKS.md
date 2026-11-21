# Persistence audit, all tracks (2026-11-02)

READ-ONLY audit. Nothing here is implemented. Code read from `origin/fix/prove-it-submit-latch` (PR #79, `d333e6d`) for SOC and from `origin/master` (`fbeb409`, includes #85 to #90) for Help Desk, AI/ML, Electrical, M360. Master does **not** yet have PR #79's `lab-runtime.js` (B9) or `recordProveItAttempt`, so every `LabRuntime.saveCaseState` user on master (HD M01/M02 today) has the quick-reload loss until #79 merges.

## 0. Owner acceptance test

Fill every input, save, clear site data / fresh browser, reload, check what stuck. Anything that lived only in browser storage fails. Strict reading used here: a file's bytes, a half-typed draft, a simulator ticket, a walkthrough step, and a quiz pick all count.

## 1. The PR #79 pattern (what "good" looks like)

| Piece | Where | What it does |
|---|---|---|
| Durable store | `module_progress.case_state` jsonb (column added `20260916120000`; column-level INSERT/UPDATE grant in `20261005120000`; own-row RLS `module_progress_own_read/insert/update` from `20261005140000`, enrollment write gate) | One row per (user_id, track_code, module_key). One key per lab: `case_state[labId] = <lab state object>`. No schema change needed to add a lab or a key. |
| Write path | `LabRuntime.saveCaseState(labId, moduleKey, user, state)` -> localStorage `mnt-portal.lab-state.v1.<labId>.<anonId>` immediately, then 300 ms debounced `persistModuleCaseState()` (`app.js` ~3873: read row, merge `[labId]: state`, update or insert, one retry on insert race) | `persistModuleCaseState` returns `true` only on a confirmed write. |
| B9 reload protection (#79 only) | `lab-runtime.js` | Each save stamps `state.savedAt` and sets `<key>.unsynced`. Marker cleared only on confirmed write. `visibilitychange` and `beforeunload` flush. On load, if marker set and local `savedAt` newer than server row, keep local and resend; else server wins. Sign-out flushes first (`app.js` ~447), then `clearStudentLocalState`. |
| Restore on load | `fetchUserDetails` selects `module_progress.case_state` into `user.remoteCaseState`; `LabRuntime.loadCaseState(labId, moduleKey, user, defaults)` hydrates from it (server wins unless B9 marker says local is newer); one-time migration copies pre-existing local-only work up. |
| Submit | `recordLabAttempt()` -> `lab_attempts` insert (`state`, `score`, `result` jsonb, `completed_at`); `recordProveItAttempt(user, labKeys, fields, rollback)` wraps it: optimistic `user.latestLabAttemptByKey`, on any failed insert restores previous status and calls the module's `rollback()` so the lab reopens, red banner via `notifySaveFailure`. Multi-key (M07/M08) resends only keys without a pending attempt. |
| Stale latch repair | `proveItLatchIsStale(user, keys)`: true when `user.labAttemptsLoaded` and a key has no attempt and no insert in flight. Each module calls it on load and reopens. |
| Below-pass fix | `lab_attempts_complete_needs_passing_score` forces below-70 to `state='submitted'` (`20261017120000`); review queues list them. |
| What counted as a bug | (a) state only in localStorage or sessionStorage, (b) a "submitted / complete" flag set before the server confirmed, (c) a debounce that could be killed by a quick reload, (d) a server-wins load that erased the newer local copy. |

Reusable helpers on master already: `itsSubmitLabAttempt` (in-flight guard, evidence upload then insert, discard on failure), `itsLabAcceptsAttempt`, `itsSubmitWalkthroughLabs`, `itsConfirmCoachReceipt`, `itsCoachStudentMismatch`, `submitModuleAssessment` (artifact first, attempt last, re-read status), `refreshModuleAssessmentStatus`, `persistPortfolioArtifact`, IndexedDB evidence draft store `itswKeepDraftFile/itswRestoreDraftFiles`.

## 2. Summary of findings

| Track | Modules | Hard FAIL (module fails owner test) | Notes |
|---|---|---|---|
| SOC Analyst (#79) | 12 | 0 | Graded work durable in all 12. 4 residual shared gaps (section 3), mostly the `ui/` simulator sandbox. |
| Help Desk (master) | 12 | 12 | Every module has at least one localStorage-only element. Worst: M12 capstone draft, Prove It draft (M01), simulator tickets, generic Assessment Lab box (M02 to M11). |
| AI/ML | 12 | 12 | Everything is `LabRuntime.load/save` (localStorage). Lab "complete" insert is fire-and-forget, never retried. Track not published. |
| Electrical | 12 | 12 | M01 stub, M02 to M12 fallback shell. Only element is the generic Assessment Lab box draft. Not published. |
| M360 | Start Here + weeks 1 to 6 | 1 (Week 1 quality checkboxes) + 6 weeks with B9 analog gap | Best architecture of the non-SOC set (RPCs, `m360_week_records.draft_payload`). Debounced autosave has the same quick-reload loss that B9 fixed. |

Schema change needed: **No** (jsonb keys in existing `module_progress.case_state`, existing `lab-evidence` bucket). Two optional hardening migrations are given in section 8.

Shared root causes (one fix each covers many modules):
1. **Generic Assessment Lab box** (`app.js` `moduleAssessmentModule`, ~5176 and submit handler ~8205): rationale textarea and attestation checkbox. Draft saved to localStorage only inside the submit click handler (never on input), attestation never saved. Appended to every module without its own "Assessment Lab" section: HD M02 to M11 (and M12, verify duplicate), AI/ML M01 to M12, Electrical M02 to M12 (M01 stub has none). 33 or more module pages share this one defect.
2. **HD simulator (`ui/helpdesk.js`, `ui/coach.js`)**: Practice and walkthrough ticket state in `localStorage['defender-lab.helpdesk.state.v1']` (not student-scoped), coach step in `sessionStorage['mnt.coach.state']` plus `localStorage['mnt.coach.resume']`; Prove It draft in `localStorage['defender-lab.helpdesk.prove.v1.<module>.<student>']`. Only the finished package goes to Supabase.
3. **AI/ML and HD M12 use `LabRuntime.load/save`**, which never writes to the database.
4. **Evidence file bytes** (HD M01/M02) live in page memory and browser IndexedDB until Submit.

## 3. SOC Analyst M01 to M12 (PR #79 branch)

Confirmed in code: every SOC module's graded state goes through `LabRuntime.loadCaseState/saveCaseState` (grep of the branch shows zero `LabRuntime.save/load` in `soc-analyst-module-*.js` or the `soc-m0x-assessment-state.js` files, each of which uses `saveCaseState`). Every Prove It uses `recordProveItAttempt` (M01, M02-env, M03-env, M04 to M12) and calls `proveItLatchIsStale` on load. Non-Prove quizzes and guided labs (M02 `soc-02-knowledge-check` + catalog lab, M06 guided, M11 `soc-11-knowledge-check`) use `recordLabAttempt` and were listed in the bug doc as already honest.

| Module | Graded state (Learn/Practice/Prove/notes/tickets/checkboxes/selects) | Written | Restored from Supabase | Result |
|---|---|---|---|---|
| M01 | `moduleOneState` (case, lab1, lab2, notes, selections) | case_state['soc-01'][MODULE_ONE_LAB_ID] + B9 | yes | PASS |
| M02 | `LAB_ID` state (learn.step, guide, practice.notes, prove.notes, labProgress, selected entity per stage) | case_state['soc-02'] | yes (with legacy-slot migration) | PASS |
| M03 | `moduleThreeState` + `soc-03-environment` assessment (lessonWork, feedback, flags); importedLabComplete mirrors `case_state['soc-03']['imported-lab-progress:lap-4']` | case_state['soc-03'] | yes; `mission_next_lab_completion` localStorage is only a read fallback | PASS |
| M04 to M12 | `moduleXState` plus `soc-mXX-assessment-state.js` (3 saveCaseState call sites each; M12 has 2) | case_state['soc-04'..'soc-12'] | yes | PASS |

Gaps to carry (apply to all of M01 to M12 unless stated):
- **S-G1 (P2) Simulator sandbox state is localStorage/sessionStorage only.** `ui/` is shared by SOC Practice It. Keys: `defender-lab.rules`, `defender-lab.hunting.guided`, `defender-lab.sentinel.analytics.created`, `defender-lab.sentinel.rules.created`, `defender-lab.sentinel.anomaly.duplicates`, `defender-lab.sentinel.playbook1Permission`, `defender-lab.defender-cloud.workflow-automations`, `defender-lab.huntingGraph.state` (session), `defender-lab.copilot.*` (session), saved KQL queries and `<storageKey>.draft` from `ui/kql-editor.js` (`defender-lab.hunting`, `.kql-practice`, `.asim-*.query`), `lab.*` from `ui/lab-widgets.js`, nav collapse flags, coach step `mnt.coach.state` (session) and `mnt.coach.resume`. Assessment-lab answers do not depend on these (they live in the portal case_state), so this fails "console state" only for ungraded practice. Fix is in `ui/` and is Alex-owned; see sprint S7.
- **S-G2 (P2) B1 shared PC leak.** `clearStudentLocalState` exists on the branch (`lab-runtime.js` line ~161 to 169: removes keys carrying `savedAt` that have no `.unsynced` marker). It clears only `LabRuntime` keys, not the `ui/` keys above or `mnt.coach.*`. Confirm the lifecycle UAT's B1 check after merge.
- **S-G3 (P3) `persistModuleCaseState` is read-merge-update on a whole-row jsonb.** Two labs in one module saving within the same round trip can overwrite each other's key (last writer wins). Window is small. The atomic RPC in section 8 closes it; optional.
- **S-G4 (P3) Cross-device loss of the last <1 s edit** (documented limit in the handoff). No fix proposed.
- **S-G5 (P3) `orientation.js`** tour position in sessionStorage. Cosmetic; a completion flag is already server-side (`students.academy_orientation_completed_at`).
- **Imported labs** (`portal/imported-labs/mission-next-labs/src/systems/progress.js`) write `imported-lab-progress:<lab>` into case_state via `app.js`; in-lab internal state not audited. Verify in sprint S7.

SOC conclusion: #79 does cover M01 to M12 for every graded input and submit. No portal-side module file in M01 to M12 needs a persistence change. Do not edit (hands-off list).

## 4. Help Desk (master `fbeb409`)

Common elements checked in every module are marked "(all)". "Lesson `<details>` open/closed" is a view preference, not input, and is excluded.

### 4.0 What master already got right

- #87: M01 and M02 state moved to `loadCaseState/saveCaseState` (`its-01`, `its-02`).
- #85: coach labs resume (`coach.resumeAcrossLaunches`, `mnt.coach.resume`), completion confirmed via `mnt-coach-received` receipt; `itsSubmitWalkthroughLabs` now awaits and only marks complete when saved (H4 fixed).
- #86/#89/#90: `result.work` now carries the cleaned ticket work for every `hd-m*` coach (`coach.collectWork` assigned to all in `ui/helpdesk-coaches.js`), M01 Prove It submit path (`mnt-prove-*` postMessage, nonce, student id), generic Assessment Lab box saves artifact then attempt.
- Status of a lab (not submitted / waiting / returned / passed) comes only from `lab_attempts` (not browser state).

### 4.1 `{source:'mnt-coach-complete'}` finding (earlier handoff, HDESK_SUBMISSION_SHEET_HANDOFF.md)

Superseded for **completed** walkthroughs: `itsSubmitWalkthroughLabs` writes `result: {source:'mnt-coach-complete', work}` where `work` is `itsCleanCoachWork(event.data.work)` (version 1, up to 8 tickets, diagnosis, notes, status history, checked steps; capped at 48 KB). If the simulator sent no `work` (older coach, or `collectWork` returned undefined, or `itsCleanCoachWork` returned null on a malformed payload), the attempt is **still** the bare `{source:'mnt-coach-complete'}` and the sheet shows nothing. Not fixed: **in-progress** work before Finish is localStorage-only (see 4.2). M12 uses the full path (`result` jsonb carries `ticketResponses`, `kbArticle`, `afterAction`, `breakdown`) plus `portfolio_artifacts` `kind='capstone_report'` (best-effort, `persistPortfolioArtifact` called without checking the result, then `recordCapstoneSubmission` -> `capstone_submissions` only if passed). The generic Assessment Lab box uses `portfolio_artifacts` `kind='module_assessment'` (checked; artifact first, then attempt `state:'submitted'`).

### 4.2 Module tables

**M01 `its-01`** (`it-support-module-01.js`; lab id `its01-lms-validation-v1`; lab keys `lab-its-01-lms-validation`, `-ticket-triage`, `-prove-it`)

| Element | Written | Restored from Supabase | Result | Minimal fix |
|---|---|---|---|---|
| `#its01-evidence-1`, `#its01-evidence-2` file metadata (name, size, uploadedAt) | case_state['its-01'][lab id] | yes | PASS | none |
| Evidence file bytes (2 screenshots) | page memory + IndexedDB `mnt-hdesk-evidence-drafts`; nothing server-side until Submit | no (re-pick on new browser) | **FAIL** | Upload draft to `lab-evidence` on pick (section 7), store path in the existing state field |
| AUP scrolled / acknowledged (`aupScrolled`, `aupAcknowledged`) | case_state | yes | PASS (but no B9 on master) | Rebase onto #79 for B9; no code change |
| `consoleStarted`, `consoleCompleted` | case_state | yes | PASS | none |
| Lab 1.2 walkthrough (simulator tickets, step) | sim localStorage `defender-lab.helpdesk.state.v1` (unscoped), sessionStorage `mnt.coach.state`, localStorage `mnt.coach.resume` | no | **FAIL** | Sim posts `mnt-coach-progress` (student id, step, `collectWork()`); portal saves `case_state['its-01']['coach:hd-m01']`; on launch portal passes the saved progress back (see 7.2) |
| Prove It draft in simulator (`?prove=its-01`: category, type, priority, diagnosis, steps, decision, resolution note, user reply, events) | sim localStorage `defender-lab.helpdesk.prove.v1.its-01.<student>` | no (only the returned attempt's last submit is prefilled) | **FAIL** | Sim posts `mnt-prove-draft` on each `hdSave()` (debounced); portal verifies origin and student, saves `case_state['its-01']['prove-draft:lab-its-01-prove-it']`; portal returns draft in the existing `mnt-prove-status` reply (as `lastWork` is today) |
| Prove It submit | `lab_attempts` via `mnt-prove-received`, saved:true only after server confirms | yes | PASS | none |

**M02 `its-02`** (lab id `its02-lab-state-v1`, keys 2.1 to 2.4)

| Element | Written | Restored | Result | Fix |
|---|---|---|---|---|
| Lab 2.1 files `its02-ev-desktop`, `its02-ev-vmsettings`; Lab 2.2 files `its02-ev-snapshot`, `-ping1`, `-ping2` (metadata) | case_state['its-02'] | yes | PASS | none |
| The five files' bytes | memory + IndexedDB | no | **FAIL** | draft upload as M01 |
| `consoleStarted/Completed` | case_state | yes | PASS | none |
| Labs 2.3/2.4 walkthrough simulator state | sim storage (as M01) | no | **FAIL** | as M01 |
| Generic Assessment Lab box (rationale textarea, attestation) | localStorage `mnt-portal.lab-state.v1.academy-assessment-its-02.<id>`; saved only on submit click | no | **FAIL** | Shared fix S1 |

**M03 to M11 `its-03` .. `its-11`** (`itsRegisterCoachModule`, state id `its-coach-<moduleKey>-v1`; lab keys `lab-its-03-blank-desktop` .. `lab-its-11-handoff-documentation`)

| Element | Written | Restored | Result | Fix |
|---|---|---|---|---|
| `consoleStarted`, `consoleCompleted` flags | `LabRuntime.load/save` localStorage only (`it-support-shared.js` ~1335 to 1383) | no | cosmetic: lab status/rail derive from `lab_attempts`, so a lost flag changes nothing visible | switch to `loadCaseState/saveCaseState('its-NN')` for consistency (one function, 3 call sites) |
| Walkthrough simulator tickets and step (each of 9 coaches: hd-m03 .. hd-m11) | sim storage | no | **FAIL** (x9) | as M01 progress channel, implemented once in `ui/coach.js` + `itsRegisterCoachModule` |
| Completed walkthrough package | `lab_attempts.result.work` (`mnt-coach-complete`) | yes | PASS | none (but see 4.1 about bare payloads) |
| Generic Assessment Lab box (rationale, attestation) | localStorage, on submit click | no | **FAIL** (x9) | Shared fix S1 |

**M12 `its-12`** (`it-support-module-12.js`; lab id `its12-capstone-v1`; key `lab-its-12-capstone`)

| Element | Written | Restored | Result | Fix |
|---|---|---|---|---|
| `activeTicket` (selected ticket) | `LabRuntime.save` localStorage only (`its12Save`, line 193) | no | **FAIL** | `loadCaseState/saveCaseState(ITS12_LAB_ID,'its-12',...)` |
| `ticketResponses[id].{priority,category,firstStep,decision,reasoning}` (`[data-itsw-field]` select/textarea/radio per ticket) | same | no | **FAIL** | same one-line swap |
| `#its12-kb` KB article, `#its12-after-action` | same | no | **FAIL** | same |
| `attempts` counter, `validationError`, `resetArmed` | same | no (attempt number resets to 1 on a new browser; stored in `result.attempts`) | **FAIL (minor)** | derive `attempts` from the count of the student's `lab_attempts` rows for this key, or keep it in case_state |
| Submit | `itsSubmitLabAttempt` checks result; answers locked while waiting; `result` has full responses; `portfolio_artifacts` capstone_report best-effort | yes | PASS | optionally await/check `persistPortfolioArtifact` |
| Generic Assessment Lab box | module has no "Assessment Lab" section title so the registry likely appends the generic box too | no | **FAIL** (verify duplicate) | Shared fix S1, or set `data-standard-assessment="false"` for M12 |

Help Desk FAIL count: 12 of 12 modules (M01: 3 elements; M02: 3; M03 to M11: 2 each; M12: capstone draft + generic box).

## 5. AI/ML (`ai-ml`, `isPublished:false`, modules 1 to 12 are authored)

All twelve share one shape (`ai-ml-module-NN.js`, state `aimNNState`, lab id `AIMNN_LAB_ID`). `LabRuntime.load` at module load and `LabRuntime.save` after each interaction: **localStorage only, no `module_progress` write.** Same pattern repeated; one table with per-module differences.

| Element (all modules unless noted) | Selector | Written | Restored | Result |
|---|---|---|---|---|
| Lab step checkboxes `stepsDone` | `[data-aimNN-step]` | localStorage | no | **FAIL** |
| Reflection textarea + `reflectionChecked` | `[data-aimNN-reflection]` | localStorage | no | **FAIL** |
| Fill-in-the-blank answers and results | `[data-aimNN-blank-input]`, `-blank-check` | localStorage | no | **FAIL** |
| `reviewMode` | toggle | localStorage | no | **FAIL (cosmetic)** |
| Repo URL and demo URL (M01, M03, M08, M09, M10) | `[data-aimNN-repo-url]`, `-demo-url` | localStorage | no | **FAIL** |
| M12: `stagesDone`, `stagesReflection`, repo/demo URL | `[data-aim12-stage]`, `-reflection`, `-repo-url`, `-demo-url` | localStorage | no | **FAIL** |
| Knowledge check answers `[data-aimNN-quiz-answer]` (all except M12) | in-memory `aimNNQuizState`, random question pool per attempt | nowhere (only the final score is sent) | no | **FAIL** (strict; mid-quiz reload loses picks) |
| Lab completion | `recordLabAttempt(..., {state:'complete', score:100})` fired **only on the transition** `!wasComplete -> complete`, return value ignored; `markModuleLabComplete()` runs regardless | lab_attempts (unchecked) | partially | **FAIL** (same bug class as #79 problem B: UI complete without server confirm; if insert fails it is never retried) |
| Knowledge check result | `recordLabAttempt(..., {state: passed?'complete':'in_progress', score})` | lab_attempts, unchecked | yes if it landed | PASS-ish |
| Generic Assessment Lab box | as shared root cause 1 | localStorage | no | **FAIL** |

Minimal fix (mechanical, identical in all 12): swap `LabRuntime.load` -> `LabRuntime.loadCaseState(AIMNN_LAB_ID, 'aim-NN', user, defaults)` and `LabRuntime.save` -> `saveCaseState(...)` (module key matches `markModuleLabComplete(user,'ai-ml','aim-NN',...)`), then replace the completion transition with an idempotent submit: when all steps done and no `lab_attempts` row exists (`user.latestLabAttemptByKey[key]` empty and no insert in flight), call `recordLabAttempt` and only then `markModuleLabComplete`; use `proveItLatchIsStale`-style reopen if the flag exists with no attempt. The knowledge-check picks can go in a `quiz` key inside the same state object (`selectedQuestions` ids + `answers`), restored on load. AI/ML 12 of 12 FAIL.

## 6. Electrical (`electrical`, `isPublished:false`)

| Module | Elements | Written | Result |
|---|---|---|---|
| M01 `eee-01` | stub page (`electrical-module-01.js`): none; no standard assessment box since no `data-standard-assessment`... the shell has `moduleProgressShell` with a single "Coursework preparation" `lecture` section so the registry appends the generic box | generic box draft in localStorage | **FAIL** (only element) |
| M02 to M12 | `module-registry.js moduleLabFor()` fallback shell + `moduleAssessmentModule(... needsGuidedLab:true)`: rationale textarea `#standard-<key>-assessment-module-rationale`, attestation checkbox | localStorage on submit click; submit itself is durable (`portfolio_artifacts` + `lab_attempts`) | **FAIL** x11 |

Fix: Shared fix S1 only. Electrical has no other state.

## 7. M360

M360 uses RPCs and `m360_week_records.draft_payload` (`m360_save_draft`, `m360_submit_week`, `m360_save_start_here`), a user-scoped localStorage cache, and server hydration at load (`m360-production-bridge.js`). Architecturally this is the #79 pattern. Residual gaps:

| Page | Element | Written | Restored | Result | Fix |
|---|---|---|---|---|---|
| Start Here (`start-here.js`, no bridge) | 19 form fields (baseline, acknowledgments, support flag) | `m360_save_start_here` only on **Save/Complete click**; no autosave, nothing in localStorage | yes (`loadOwnCourseRecord`) | PASS if the student presses Save (owner test step 2); unsaved typing is lost on any reload | add 1.2 s debounced autosave through the same RPC + beforeunload flush |
| Week 1 (`m360-preview.html` via `week.html?week=1`), fields `[data-m360]` x10 | draft keys (direction, strengths, evidence, translation, brandStatement...) | local cache immediately; `scheduleDraftSave` 1.2 s debounce -> `m360_save_draft` | yes (`writeRemoteState` overwrites local with the row) | PASS with B9 gap | see M-G1 |
| Week 1 `[data-quality]` x4 checkboxes ("Direction is clear" etc.) | `m360-preview.js` reads them only to reset (line 455); never put in `draft` | nowhere | no | **FAIL** | include in draft as `qualityChecks:{...}` (`m360_save_draft` accepts any object) and add `[data-quality]` to the bridge's listener selector |
| Week 2 (`course.html`) `[data-m360]` x13 + `[data-review-check]` x7 | `draft.reviewChecks`, keyword1..8, skill1..8 | same | yes | PASS with B9 gap |
| Week 3 `[data-m360]` x18 + `[data-review-check]` | same | same | yes | PASS with B9 gap |
| Week 4 `[data-m360]` x8 + `#evidenceIntegrity` | `draft.evidenceIntegrity` | same | yes | PASS with B9 gap |
| Week 5 `[data-m360]` x13, Week 6 `[data-m360]` x12 | draft | same | yes | PASS with B9 gap |
| Submit (`m360_submit_week`) | honest: `submitButton.dataset.remotePending`, error banner "saved locally but not submitted", `remoteToLocalWeek(saved)` only on success | server | yes | PASS |

- **M-G1 (B9 analog, P2, weeks 1 to 6):** the 1.2 s debounce has no `beforeunload`/`visibilitychange` flush, and `bootstrap()` always overwrites local with server rows (`writeRemoteState`), so a reload inside 1.2 s of the last keystroke loses it everywhere (local copy replaced by the older server row). Fix: on `visibilitychange(hidden)` and `beforeunload` call `M360Data.saveDraft` with `fetch keepalive` (or flush synchronously), stamp `draft.savedAt`, keep `.unsynced` marker, and on hydrate prefer local when `local.savedAt > row.updated_at` and marker set. Same logic as `lab-runtime.js`; implement as a small shared helper.
- Instructor-side pages (`review*.js`, `admin-*.js`) hold no student input.

M360 FAIL count: 1 hard (Week 1 quality checkboxes) plus the shared B9-analog gap on all 6 weeks and Start Here autosave.

## 8. Schema changes

**None required.** All proposed persistence uses existing jsonb and storage:

| Need | Where it goes | New key (example) |
|---|---|---|
| HD M12 capstone draft | `module_progress.case_state['its-12']['its12-capstone-v1']` | existing lab id |
| HD walkthrough progress | `case_state['its-NN']['coach:<coachId>']` = `{step, savedAt, work}` | new key, same row |
| HD Prove It draft | `case_state['its-01']['prove-draft:lab-its-01-prove-it']` = the `hdState.prove` fields + `editedAt` | new key |
| Generic Assessment Lab draft | `case_state['<moduleKey>']['academy-assessment-<moduleKey>']` = `{rationale, attested, savedAt}` | new key, same row |
| AI/ML state | `case_state['aim-NN']['AIMNN_LAB_ID']` | existing lab id |
| M360 Week 1 quality checks | `m360_week_records.draft_payload.qualityChecks` | new jsonb key |
| Evidence draft files | `lab-evidence` bucket, path `<track>/<user>/<module>/<lab>/<draft-uuid>/<field>.<ext>` (same 5-level path the existing policies parse) | no schema change |

RLS impact: none. `module_progress_own_*` already allows own-row insert/update of `case_state` (column grants in `20261005120000`). Instructors/admins already read the whole row (`module_progress_admin_read`, `..._assigned_instructor_read`), so drafts become visible to course staff; call that out in the owner's privacy review (students' unsent drafts). The student-readable hardening from `20261030221555` (`lab_attempt_feedback_student_read`) is unaffected.

Open check (storage): `can_write_lab_evidence` (`20261015120000`) requires an attempt-id folder, the module/lab to exist in `course_module_labs`, and "not yet submitted". Draft upload fits if the draft folder id is a client UUID stored in state and reused as the final attempt `id` (`itsUploadEvidence` already does `id: upload.id`). Replacing a picked file needs UPDATE or DELETE on `storage.objects` for the same path; the bucket policy list was not fully read. If DELETE is not granted, use a new file name per pick and remove the previous path best-effort. Verify before sprint S3b.

**Optional hardening migration 1 (atomic per-lab merge, closes S-G3; additive, no policy change):**

```sql
create or replace function public.save_case_state_key(
  p_track_code text, p_module_key text, p_lab_id text, p_state jsonb)
returns void
language plpgsql
security invoker              -- runs under the caller; module_progress RLS + column grants apply
set search_path = public
as $$
begin
  if p_state is null or jsonb_typeof(p_state) <> 'object' then
    raise exception 'case_state value must be a JSON object';
  end if;
  if pg_column_size(p_state) > 262144 then
    raise exception 'case_state value too large';
  end if;
  insert into public.module_progress (user_id, track_code, module_key, state, case_state)
  values (auth.uid(), p_track_code, p_module_key, 'in_progress',
          jsonb_build_object(p_lab_id, p_state))
  on conflict (user_id, track_code, module_key) do update
    set case_state = jsonb_set(
      coalesce(public.module_progress.case_state, '{}'::jsonb),
      array[p_lab_id], p_state, true);
end $$;
revoke all on function public.save_case_state_key(text,text,text,jsonb) from public, anon;
grant execute on function public.save_case_state_key(text,text,text,jsonb) to authenticated;
```
Verify the unique constraint name/columns on `module_progress` before applying (the code upserts on user_id, track_code, module_key). Client change is limited to `persistModuleCaseState` in `app.js` (Alex review, shared file).

**Optional hardening migration 2 (size guard so a runaway draft cannot bloat the row):**

```sql
alter table public.module_progress
  add constraint module_progress_case_state_size
  check (pg_column_size(case_state) <= 2097152) not valid;
-- then: alter table public.module_progress validate constraint module_progress_case_state_size;
```
`not valid` first so existing rows are not blocked; validate after a production size query. RLS: none.

## 9. Shared helpers to reuse (do not reinvent)

- `LabRuntime.loadCaseState/saveCaseState` (with B9 once #79 lands) for every state object.
- `persistModuleCaseState` return value as the confirmation signal.
- `recordProveItAttempt` / `proveItLatchIsStale` for AI/ML lab completion and any new submit.
- `itsSubmitLabAttempt`, `itsLabAcceptsAttempt`, `itsConfirmCoachReceipt`, `itsCoachStudentMismatch` (student-id check: `LabRuntime.anonymousStudentId`) for every simulator -> portal message.
- `itswKeepDraftFile/itswRestoreDraftFiles` + `itsUploadEvidence` for the evidence draft upload.
- `submitModuleAssessment` for the generic box.
- New small helper (one file, shared): `bindDraft(root, selector, {read, write})` that attaches `input/change` listeners, writes into the state object and calls `saveCaseState`, so the generic box, AI/ML, and HD M12 do not each hand-roll it. M360 gets the equivalent `flushOnUnload` helper.

## 10. Side effects and risks

1. **UX change to restore-on-load.** Students who had localStorage-only work will now see server state win over it. The existing one-time migration in `loadCaseState` copies local work up when the server row has none, so first load after deploy preserves their current text; any divergent copy loses to the server. Message nothing, but test with a student who has local work and a different server row.
2. **Row growth in `module_progress.case_state`.** Coach `work` is capped at 48 KB per submission; drafts for Prove It plus coach progress plus capstone add a few KB. Add the size guard in migration 2.
3. **Concurrency.** Two tabs or two labs in one module save the whole row (S-G3). Apply migration 1 or accept.
4. **Staff visibility.** Drafts become readable by instructors and admins via module_progress policies (owner call).
5. **Simulator trust boundary.** New `mnt-coach-progress` and `mnt-prove-draft` messages are student-controlled. Reuse the origin check, anonymous student id check and size caps from `itsCleanCoachWork`; never persist fixture keys; do not echo any answer key back.
6. **AI/ML semantics.** Making lab completion depend on a confirmed insert changes behaviour for students on flaky networks (they would now see a red banner and a retry). Intended, but it is a UX change. Track is unpublished, so exposure is low.
7. **Generic box change touches `app.js`** (Alex review). It also touches every module page's Assessment section; keep ids and the `data-module-assessment-form` contract unchanged so existing tests (`tests/module-assessment-submit.test.js`) stay green.
8. **SOC hands-off list.** Nothing in this plan edits `soc-*`; shared `app.js`/`lab-runtime.js` edits need Alex review and must keep `tests/below-pass-prove-it.test.js` and `tests/case-state-unload-recovery.test.js` green.
9. **Timing.** Master has HD work that conflicts with #79 in `it-support-shared.js` and `it-support-module-12.js`; sequence the rebase (another agent is on `~/mnt-pr79-rebase`) before any HD sprint.
10. **Browser-clock ordering.** `savedAt` comparisons use device clocks; known and accepted in #79.
11. **`beforeunload` fetch.** supabase-js writes during unload can be cancelled; the unsynced-marker design (not the write itself) is what makes recovery work, so do not skip the marker on any new path.

## 11. Proposed sprints (one subagent each)

| # | Scope | Files | Model | Notes |
|---|---|---|---|---|
| S0 | Prerequisite: merge/rebase #79 onto master; confirm `lab-runtime.js` B9 on master; rerun CI | n/a | owner | blocks S1 to S5 |
| S1 | Shared Assessment Lab box: persist rationale and attestation to `case_state` on input, restore on load, keep submit path; covers HD M02 to M11 (and M12 verify), AI/ML x12, Electrical x12 | `portal/app.js` (box markup ~5176, handler ~8205, `moduleAssessmentState` ~5074), test | strong (judgment, Alex review) | single highest-leverage fix |
| S2 | HD portal modules: M12 `LabRuntime` -> `case_state` (+ attempts derivation), coach modules M03 to M11 flags -> `loadCaseState`, M01/M02 verify after rebase | `it-support-module-12.js`, `it-support-shared.js` `itsRegisterCoachModule`, tests | cheap (mechanical) | |
| S3a | HD simulator progress channel: `mnt-coach-progress` + `mnt-prove-draft`; student-scope `HD_STATE_KEY`; portal saves to `case_state`, replies with draft on launch/status | `ui/coach.js`, `ui/helpdesk.js`, `portal/it-support-shared.js`, `it-support-module-01.js`, tests | strong | resolves H1/H2/H3 |
| S3b | HD evidence draft upload to `lab-evidence` on pick; reuse draft uuid as attempt id | `it-support-shared.js`, M01/M02 files, storage policy check | strong | after storage policy check |
| S4 | AI/ML M01 to M06: `loadCaseState`/`saveCaseState`, quiz picks in state, honest lab submit with latch | `ai-ml-module-01..06.js` | cheap | identical edit pattern |
| S5 | AI/ML M07 to M12 (M12 stages) | `ai-ml-module-07..12.js` | cheap | |
| S6 | M360: unload flush, `savedAt`/local-newer hydrate, Start Here autosave, Week 1 quality checks in draft | `m360-production-bridge.js`, `start-here.js`, `m360-preview.js` | strong | no DB change |
| S7 | SOC residuals (Alex only): `ui/` simulator sandbox state to case_state or documented as ungraded; sign-out clear of `defender-lab.*`; imported-labs verify; optional atomic RPC | `ui/`, `lab-runtime.js`, `app.js` | owner/strong | optional migrations 1 and 2 |
| S8 | Acceptance harness: Playwright-style "fill every field, save, clear storage, reload, assert" per module and track, using the login-free view harness where possible | `tests/` | cheap | gates S1 to S7 |

Suggested order: S0, S1, S2, S4/S5 (parallel), S3a, S3b, S6, S7, S8 alongside each.

## 12. Verification gaps in this audit

- Playwright run not performed (read-only static audit). Element lists come from source; module UI that is built dynamically (AI/ML blank inputs, HD ticket forms) was identified by `data-*` hooks and state defaults, not by rendering.
- HD M12 duplicate-box and the `lab-evidence` storage update/delete policy are marked "verify".
- Imported labs' internal state and `ui/` simulator keys were catalogued by grep, not exercised.
