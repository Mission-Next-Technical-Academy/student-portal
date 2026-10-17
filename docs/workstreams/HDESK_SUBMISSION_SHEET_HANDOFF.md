# IT Help Desk (HDESK) — instructor Submission Sheet handoff

> **Status update, 2026-10-17:** The owner authorized standardizing the Help
> Desk submission view with SOC Analyst, including simulator work capture and
> capstone response persistence. Preserve existing scoring and immediate
> student feedback. H0–H3 are implemented on `feat/hdesk-submission-sheets`;
> only H4 verification remains. The older decision prompts below are historical.

## Next AI — start here (written 2026-10-17; H0–H3 implemented)

**Goal (owner, Alex, 2026-10-17):** give the IT Help Desk track the same
instructor experience the SOC Analyst track is getting, a printed-sheet
view with ✓/✗ sweeps, red-pen notes and prefilled teacher feedback. The
bar: "ANYONE could be an effective instructor to review assignments."

**Read first, in order:**
1. `CLAUDE.md` (top), `docs/operations/AI_AGENT_RULES.md`,
   `docs/LAB_ASSESSMENT_STANDARD.md`.
2. `docs/workstreams/ADMIN_SUBMISSION_SHEET.md`, the SOC spec. Its framework
   (`portal/admin-submission-sheet.js`, `AdminSubmissionSheet.register`,
   verdict rule, key-evidence narrative checks, writing mechanics,
   spelling, parity tables) is what you reuse. **Wait until its S1 is
   ticked**, or confirm the framework exists on `master` /
   `feat/admin-submission-sheet` before starting.
3. `~/.claude/playbooks/cyber-hygiene.md`.

**Ownership caution:** the `portal/it-support-*.js` files are mostly
Alex's, but Megan Correira committed `8c9a007` (#41) there on
2026-10-02. Other agent sessions share this working tree and `.git/index`.
Check `git status` / `git log -5 -- portal/it-support-*.js` before editing,
never stage someone else's WIP, and work on your own `feat/` branch with a
PR to `master`. Never push to `master` and never merge without the owner's
approval.

## The problem (verified 2026-10-17 by reading the code)

The instructor panel itself is shared. HDESK uses the same Lab Attempts tab
and `adminAttemptReviewCard()` in `portal/app.js` as SOC. The failure is in
**what HDESK saves**: there is almost no student work to show.

| Module | Lab key(s) | What `recordLabAttempt` saves today | Where |
| --- | --- | --- | --- |
| 01 | `lab-its-01-lms-validation` | `{ evidence: 2, aup: true }`, score 100 | `it-support-module-01.js:221` |
| 01 | `lab-its-01-ticket-triage` | `{ source: 'mnt-coach-complete' }` | `it-support-module-01.js:311` |
| 02 | `lab-its-02-vm-build`, `lab-its-02-vm-snapshot-server` | `{ evidence: 2 }` / `{ evidence: 3 }`, score 100 | `it-support-module-02.js:224,233` |
| 02 | `lab-its-02-device-manager`, `lab-its-02-print-spooler` | `{ source: 'mnt-coach-complete' }` | `it-support-module-02.js:334-335` |
| 03–11 | one each (`lab-its-03-blank-desktop` … `lab-its-11-handoff-documentation`) | `{ source: 'mnt-coach-complete' }`, no score | `it-support-shared.js:227` (`itsRegisterCoachModule.onMessage`) |
| 12 | `lab-its-12-capstone` | `{ breakdown, criticalErrors, attempts }` + score | `it-support-module-12.js:390` |

- **M03–M11** are registered by `itsRegisterCoachModule()`
  (`it-support-shared.js:174`). The lab runs in the embedded Mission Next
  simulator (`portal/imported-labs/mission-next-labs/`, `SIM_ORIGIN`). On
  finish it `postMessage`s `{ type: 'mnt-coach-complete', id: coachId }`,
  and nothing about what the student did crosses over. The instructor sees
  "No score" plus a one-line raw JSON block. *Inference:* this is likely
  why HDESK had ~40 never-graded attempts (memory, 2026-10-05).
- **M12 capstone** puts the score breakdown on the review card, but the
  student's writing (`ticketResponses`, `kbArticle`, `afterAction`,
  `feedback`) goes only to `portfolio_artifacts` via
  `persistPortfolioArtifact()` (`it-support-module-12.js:403`). The review
  card never reads that table. The instructor gets a score with no work
  behind it.
- `adminGradingLabMeta()` treats every catalogued non-SOC lab as PROVE IT.
  Confirm with the owner which HDESK labs really need instructor review and
  which are autograded practice (SOC rule: only Prove It waits in Grading).

## Owner decisions needed before building (ask, don't assume)

1. Which HDESK labs are Prove It (instructor-reviewed) vs. autograded?
2. For the simulator labs (M03–M11): is changing the simulator's completion
   message in `portal/imported-labs/mission-next-labs/` OK? That app has its
   own docs (`AGENT_HANDOFF.md`, `WORKFLOW.md`, `LAB_AUTHORING_GUIDE.md`)
   and may have another owner.
3. M12: copy the writing into `lab_attempts.result` (simplest, no schema
   change), or have the review card read `portfolio_artifacts`? Recommend
   copying into `result`, which matches SOC and needs no RLS work.

### H0 answers and recommendations (2026-10-17; owner still has to confirm)

**Q1. Prove It (instructor-reviewed) vs. autograded.**
Evidence: `docs/LAB_ASSESSMENT_STANDARD.md` defines Prove It as independent,
with no procedural guidance, glowing controls, forced click paths or
answer-revealing hints, and every Prove It needs a durable record with all
student writing readable. Every coach lab (M01.2, M02.3/2.4, M03-M11) is the
opposite by design: it spotlights each step, gates "Next" on the right action,
and its text tells the student which clue to use. By the standard those are
**Practice It**. Only M12 is built as an independent assessment
(`isCapstone`, no cueing, `portfolio_artifacts` + `capstone_reviews`). Today
`adminGradingLabMeta` calls all of them PROVE IT, which is why ~40 attempts
sat in Grading with nothing to grade.

Recommended split:

| Lab(s) | Class | Reason |
| --- | --- | --- |
| `lab-its-12-capstone` | **Prove It** (sheet, H1) | Independent, all writing, critical-error gate, already reviewed via `capstone_reviews` |
| `lab-its-01-lms-validation` | Autograded (attestation); keep AUP acknowledgment as a dated record | Nothing to judge; screenshots not retained |
| `lab-its-02-vm-build`, `lab-its-02-vm-snapshot-server` | **Owner choice.** Only a human can verify these (real VM, settings, ping). Either (a) promote to Prove It and store the images (needs a Storage bucket + RLS = owner-run migration), or (b) keep as attestation and stop auto-scoring 100 | Today they award 100 for any file |
| `lab-its-01-ticket-triage`, `lab-its-02-device-manager`, `lab-its-02-print-spooler`, `lab-its-03` ... `lab-its-09` | Autograded Practice It, with a **read-only work view** on the sheet (no Grading-queue wait) | Guided; machine can verify diagnosis + disposition; H3 captures the work so any instructor can look |
| `lab-its-10-priority-queue` | Autograded Practice It; fix the completion hole first (note not required) | Single short note |
| `lab-its-11-handoff-documentation` | Practice It now; **best candidate to promote to Prove It** after an unguided final ticket | Its whole objective is handoff-note quality, which only a reader can judge |

Consequences: the Grading queue needs HDESK keys in `ADMIN_PROVE_IT_LAB_KEYS`
and a non-SOC fallback of PRACTICE IT (or a per-program set) in
`adminGradingLabMeta` (`portal/app.js`, owned by the SOC sheet work, so do it
after that lands). This is the only classification change needed for the
queue; the sheets themselves can exist for every lab regardless.

**Q2. May the simulator's completion message change?**
Evidence: the file to change is `ui/coach.js` (`reportCompletion` :467,
`finish` :491) plus `ui/helpdesk-coaches.js`, **not**
`portal/imported-labs/mission-next-labs/`. Ownership: `mission-next-labs` has
26 commits, all Alex Ansbergs, and its `AGENT_HANDOFF.md` is a generic Codex
rehydration note about the ELK and AD labs; it is unrelated to HDESK. `ui/` is
Alex's (45 commits; `coach.js` 9 of 9), except `helpdesk-coaches.js`, the
M01-M12 portal modules and the capstone wiring, which were authored by
`kkr1pt3k` (2026-09-04 to 09-08, Randy's content reviews). Megan Correira
touched `portal/it-support-*.js` once (`8c9a007`). `ui/coach.js` is shared
with SOC (`m01-orientation` etc.), so the change must be additive.

Recommended answer: **yes**, as an additive, optional field, and tell
kkr1pt3k/Megan. Design: `coach.js` calls an optional
`coach.collectWork()` hook (defined only by the `hd-m*` coaches) and adds
`work` to the **`finish()`** post only (that is when the final resolve has
happened; the arrival post in `reportCompletion` cannot hold it). The portal
handler in `itsRegisterCoachModule.onMessage` keeps its origin check, adds a
shape/size check (cap e.g. 32 KB, array/string limits, strip unknown keys),
treats it as untrusted text, and ignores `work` on the arrival post. The
portal cannot read the simulator's `localStorage` (different origin), so
`postMessage` is the only channel. Also make the portal dedupe the two posts.
No SOC coach defines the hook, so SOC behavior is unchanged.

**Q3. M12: copy into `lab_attempts.result` or read `portfolio_artifacts`?**
Evidence: `lab_attempts` is already read by the review card and has an
assigned-instructor read policy (`20260920120000:126`);
`portfolio_artifacts` has only an `is_admin()` read policy and the admin
detail query deliberately omits `content`, so reading it needs a query change
plus an RLS decision (owner-run migration). `capstone_submissions.answers`
has the writing only on pass. Recommended answer: **copy into
`result`** (additive; `ticketResponses`, `kbArticle`, `afterAction`,
`feedback`, `score`), matching the SOC sheet and needing no schema change.
Keep writing the artifact snapshot unchanged for the integrity hash. Size is
small (about 6 tickets x 2 short fields + 2 paragraphs).

## Sprint plan

- [x] **H0 — Recon + parity tables (done 2026-10-17).** For every HDESK lab: list each
  student-side input (ticket fields, checklists, written answers, simulator
  actions), its answer key / scorer, and what is saved today. Fill the
  parity tables below. No code. Ask the owner the 3 questions above.
- [x] **H1 — M12 capstone sheet.** Save ticket answers, KB article,
  after-action reflection, feedback, and the existing score breakdown into
  `lab_attempts.result`. The shared definition checks ticket fields against
  the same rules as the current capstone scorer and shows full writing.
- [x] **H2 — M01–M02 portal-native labs.** Show AUP status, uploaded evidence
  metadata, and screenshot links through the existing signed-file panel.
  Guided ticket work is captured through the shared coach message.
- [x] **H3 — Simulator labs M03–M11 (`ui/coach.js` +
  `ui/helpdesk-coaches.js`).** Send a bounded student-work snapshot with the
  completion message. The portal validates and whitelists it before storing
  it in `result`. The sheet shows ticket fields, path selections, diagnosis
  feedback, work notes, history and resolution. Path checkbox state persists.
- [x] **H4 — Verification (2026-10-17).** `bash bin/ci-check.sh` passed.
  `node tests/admin-submission-sheet.test.js` passed (114 checks, including
  pass/return synthetic attempts for all 16 Help Desk lab keys); spelling
  tests passed (18 tests). `bin/dev.sh status` showed `target=STAGING` before
  browser review. A headless Chrome session loaded the local portal served by
  `bin/dev.sh`, rendered every Help Desk sheet with synthetic data, and found
  16/16 sheets, no page errors, and no horizontal overflow. No student or
  instructor account was used. H4 verification is complete. PR #68 is open:
  https://github.com/Mission-Next-Technical-Academy/student-portal/pull/68

## Rules carried over from the SOC spec

- Plain language. No ids/JSON above the debug fold. Expected values shown
  to the instructor only.
- Verdict (current rule, PR #67): the score plus scorer-flagged critical
  failures decide PASS or RETURN. A red section on a passing score reads
  "Recommend PASS — with corrections (N sections to fix)" and prefills a
  correction. Amber ◐ prefills "To strengthen next time: …".
- Narrative = key-evidence match, plus advisory writing mechanics and
  spelling, which never fail a section.
- Answer keys are read from the module's own data/scorer, never re-typed.
- Student text is escaped and never sent to an external service.
- No Supabase schema/RLS/function changes without the owner. Per
  `AI_AGENT_RULES.md`, the owner runs any `db push` / function deploy.

## Current state

H0–H4 are implemented and verified on `feat/hdesk-submission-sheets`. The SOC
renderer is shared by explicit lab-key registration, with Help Desk
definitions in `portal/admin-sheets/hdesk.js`. Older submissions remain
readable and identify work that was not recorded in that attempt. Verification
details are recorded in H4 above. PR #68 was approved by the owner for merge on
2026-10-17. Still open after this work:
- the H0 Help Desk bugs (early completion, probable duplicate rows,
  `restart=1` wiping work, guessable diagnoses, M08/M12 HD-2110 conflict,
  HD-2106 priority, SOC rubric stamp);
- the Practice It vs Prove It labelling for the guided labs, which are still
  treated as PROVE IT by `adminGradingLabMeta`;
- a staging click-through.
See `docs/handoffs/CLAUDE_ADMIN_SUBMISSION_SHEET_HANDOFF.md`.

## Parity tables

_(filled in H0, 2026-10-17; recon only, no code changed)_

### H0 corrections to this doc's premises (read first)

1. **The HDESK simulator is `ui/`, not `portal/imported-labs/mission-next-labs/`.**
   `SIM_ORIGIN` (`portal/app.js:30`) is `http://127.0.0.1:8767/` locally and
   the `sim/` mount when deployed; that serves `ui/` (`ui/helpdesk.js`,
   `ui/helpdesk-data.js`, `ui/helpdesk-coaches.js`, `ui/coach.js`).
   `mission-next-labs` contains no coach `hd-m*` ids and no Help Desk labs
   (its docs describe the ELK and Active Directory labs). The H3 file list and
   Owner decision Q2 both need to point at `ui/`.
2. **M12 writing is not only in `portfolio_artifacts`.** On a *pass*,
   `recordCapstoneSubmission` also writes the same `artifactContent`
   (responses, KB article, after-action) to `capstone_submissions.answers`
   (`it-support-module-12.js:414`). Failed attempts still live only in
   `portfolio_artifacts`. Nothing in the instructor review card reads either.
3. **Students' simulator work is not just "not sent"; most of it is wiped.**
   Every launch link uses `restart=1`, which calls `resetState()`
   (`ui/coach.js:564`) and replaces the ticket list, so even "Review the
   walkthrough" destroys the earlier notes. The path checkboxes are never
   stored at all.

### Where HDESK data lives today (common to every lab)

| Store | What is in it | Reaches instructor? |
| --- | --- | --- |
| `lab_attempts.result` (Supabase) | M01.1 `{evidence:2,aup:true}`; M02.1/2.2 `{evidence:N}`; coach labs `{source:'mnt-coach-complete'}`; M12 `{breakdown,criticalErrors,attempts}` | Yes, as raw JSON; no score for coach labs |
| `LabRuntime` local state (portal origin, per browser) | evidence file *name/size/time* (never the bytes: `itswReadEvidenceFile`, `it-support-shared.js:35`), AUP flags, `consoleCompleted`, full M12 draft (`its12State`) | No |
| Simulator `localStorage` `defender-lab.helpdesk.state.v1` (sim origin, per browser, not per student) | tickets with `diagnosis`, `diagnosisCorrect`, `notes[]`, `status`, `troubleshootingHistory` (one line per diagnosis attempt, priority change, note) | No. Different origin from the portal, so only a `postMessage` can carry it. |
| `portfolio_artifacts` | M12 only: every attempt, full writing | Admin only (`is_admin()` read policy, `20260829120000`); assigned instructors have **no** read policy, unlike `lab_attempts` (`20260920120000:126`); the admin detail query selects only `id, lab_key, submitted_at, content_sha256` (`portal/app.js:9058`) |
| `capstone_submissions.answers` | M12 pass only: full writing + breakdown | Admin detail query selects `answers` (`app.js:9056`); not rendered in the Lab Attempts review card |

Also verified:

- `recordLabAttempt` stamps every row `rubric_version 'soc-analyst-rubric-v1'`,
  `pass_threshold 70` even for HDESK (`app.js:3968`).
- A module is verified complete when each mapped lab has `state='complete'`
  and (`score is null` or `score >= pass_threshold`)
  (`20260916100000_verified_assessment_progress.sql`). So a coach-lab row with
  null score completes the module; that row is the only gate.
- `adminGradingLabMeta` (`app.js:9225`) labels every catalogued non-SOC lab
  PROVE IT; `ADMIN_PROVE_IT_LAB_KEYS` has SOC keys only.

### Findings that look like bugs (not fixed, recon only)

- **Completion is reported before the last action.** `coach.js:361` calls
  `reportCompletion()` on *arriving* at the last step, i.e. before the final
  Resolve/Escalate click. For **M10 the last step is the work note**, so a
  student can finish M10 without writing any note (Next on the previous step is
  only "Got it"). For the other coach labs the final status is the only
  ungated action.
- **Probable duplicate attempt rows.** `finish()` (`coach.js:491`) posts the
  same `mnt-coach-complete` again after `reportCompletion()` already posted
  (`reportedToken` guards only the first). The portal handler has no dedupe,
  so each lab likely gets two `lab_attempts` rows per run. Verify on staging
  before H3; the sheet must show the newest, richest row.
- **`?coachComplete=hd-mNN` fallback marks the lab complete locally only.** If
  the opener is gone (`coach.js:495`), the module page shows "complete" but no
  `lab_attempts` row and no `markModuleLabComplete` happen
  (`it-support-shared.js:186-193`, `it-support-module-01.js:61`, `-02.js:65`).
  The module then never verifies. Likely a source of "complete badge but not
  complete" reports.
- **Evidence-upload labs score 100 for any file.** M01.1, M02.1, M02.2 record
  `score:100` as soon as the tiles are filled; only the filename is kept, so
  no one can ever look at the screenshot.
- **Diagnosis answer is guessable by position.** The correct option is the
  *last* of `plausibleCauses` for every ticket except four overrides
  (`HD_DIAGNOSIS_OVERRIDES`, `ui/helpdesk.js:47`), and retries are unlimited.
- **Key conflict between modules.** M08 walks HD-2110 (domain trust) to
  *Resolved* by L1 (`helpdesk-coaches.js:472`), while the M12 key says the same
  ticket must be *escalated* (`it-support-module-12.js` HD-2110,
  `decision:'escalate'`). A student who follows M08 loses escalation points
  in M12. Also M12 tags HD-2106 "P4" but the simulator ticket is P3.
- **M10 first check can pre-pass.** `hdCurrentTicket()` falls back to
  `tickets[0]` when nothing is selected, so "Open a P1 ticket"
  (`helpdesk-coaches.js:541`) can be satisfied without a click if the shuffled
  first ticket is P1 (three tickets are P1).
- M01 Lesson 1.2 "Try It Yourself" asks for category, first question and
  resolve/escalate on three scenarios; nothing records any of it.

### Per-lab tables

Legend: sheet sections follow the SOC spec (student order, ✓/✗/◐, red-pen
fix, prefilled feedback). "Not saved" = exists only in the DOM or is lost.

#### `lab-its-01-lms-validation` (portal-native, `it-support-module-01.js`)

| Student input | Saved today | Expected answer / source | Proposed sheet section |
| --- | --- | --- | --- |
| Upload "Sandbox desktop screenshot" (any image) | `LabRuntime` `evidence1` = {name,size label,time}; bytes discarded | Image of a logged-in sandbox desktop; **cannot be checked, file not retained** | "Evidence 1": filename/time, banner "screenshot not retained" |
| Upload "Evidence-upload confirmation" screenshot | `evidence2` same | Screenshot of an "Uploaded" tile with timestamp; not checkable | "Evidence 2" same |
| Scroll AUP to the end | `aupScrolled` local only | Must reach end (or text fits) | Part of "AUP" |
| Tick "I acknowledge the AUP" | `aupAcknowledged` local; row `result.aup:true` | `true`; `it-support-module-01.js:221` | "AUP acknowledged" ✓ with timestamp (row `completed_at`) |
| (completion) | `lab_attempts` state complete, **score 100**, `{evidence:2,aup:true}` | Auto 100 once both tiles + checkbox | Score line "auto 100 (attestation)" |

Narrative fields: none.

#### `lab-its-02-vm-build` (portal-native, `it-support-module-02.js`)

| Student input | Saved today | Expected answer / source | Proposed sheet section |
| --- | --- | --- | --- |
| Upload "Finished Windows desktop" screenshot | `LabRuntime` `evDesktop` metadata only | Windows 11 desktop, VM running (human check only) | "Evidence: desktop" |
| Upload "VM settings summary" screenshot | `evVmSettings` metadata only | 4 GB RAM, 2 cores, 64 GB dynamic disk, NAT (`its02` lab 2.1 text) | "Evidence: VM settings" with the four expected values (instructor only) |
| (completion) | `lab_attempts` score 100, `{evidence:2}` (`-02.js:224`) | Auto | Score line |

Narrative fields: none.

#### `lab-its-02-vm-snapshot-server` (portal-native)

| Student input | Saved today | Expected answer / source | Proposed sheet section |
| --- | --- | --- | --- |
| Upload "Snapshot list" screenshot | `evSnapshot` metadata only | Snapshot named "Clean Install" visible | "Evidence: snapshot" |
| Upload "Ping client to server" | `evPing1` metadata only | Successful replies, correct direction | "Evidence: ping 1" |
| Upload "Ping server to client" | `evPing2` metadata only | Successful replies, correct direction | "Evidence: ping 2" |
| Lesson 2.1 "write down what you changed" (breaking change) | Not captured (lesson text only) | Any deliberate change | Not assessable; optional new text field |
| (completion) | `lab_attempts` score 100, `{evidence:3}` (`-02.js:233`) | Auto | Score line |

Narrative fields: none today (optional "what I changed" if added).

Note for the three evidence labs: the instructor can only judge these if the
images are stored (Storage bucket, owner-run migration) or the lab is recast
as an attestation. See Q1.

#### Coach-guided labs (simulator, `ui/`)

Common to every row below: the sim saves state only in its own `localStorage`; the completion message carries no work; the portal writes `{source:'mnt-coach-complete'}` with no score. Per ticket the student does the same five things, so each table lists them with that ticket's answer key (generated from `ui/helpdesk-data.js` and the key at `ui/helpdesk.js:47,164`; do not retype, read `HD_TICKET_TEMPLATES` in code). Disposition rule: Security Incident or any `escalationCriteria` starting "Always" ends *Escalated*, else *Resolved*. Extras a student may do but no coach checks (assign, priority change, contact requester, status transitions, link problem) are saved in sim state `troubleshootingHistory` and are not scored.

#### `lab-its-01-ticket-triage` — coach hd-m01 (ui/helpdesk-coaches.js:46)

| Student input | Saved today | Expected answer / source | Proposed sheet section |
| --- | --- | --- | --- |
| Open **HD-2101** (Jordan Bell, Incident/Account lockout, P2) | Not saved (sim UI selection) | Ticket HD-2101, ui/helpdesk-data.js | Context header only (no ✓/✗) |
| Troubleshooting path: tick boxes (coach needs only >=1) | **Not saved anywhere**: bare `<input type=checkbox>`, no handler (ui/helpdesk.js:255) | Every listed step is valid (no distractors): 1) Verify identity; 2) Trace caller computer; 3) Inspect stored credentials; 4) Correct approved task credential; 5) Unlock once and monitor | "Troubleshooting path": cannot be assessed until captured (H3) |
| Diagnosis dropdown + "Check diagnosis" (unlimited retries) | sim localStorage `defender-lab.helpdesk.state.v1` only: `diagnosis`, `diagnosisCorrect`, one history line per attempt | **Scheduled task credential** (option 3 of 3: User typing old password / Mobile mail cache / Scheduled task credential); key ui/helpdesk.js:47,164-170 | "Diagnosis" ✓/✗ + wrong-attempt count |
| Work note (free text, any non-empty text accepted) | sim localStorage `defender-lab.helpdesk.state.v1` only: `notes[]` | No scorer. Coach hint: (coach: "what you checked, what you found, what you are about to do"; no ticket-specific hint). Evidence lines to cite: "Event 4740: jbell locked out · caller NS-LT-0117"; "Task Scheduler: FinanceReportSync last run 08:11" | "Work note" (narrative: key-evidence check vs the log lines + mechanics + spelling) |
| Resolve / Warm escalate button | sim localStorage `defender-lab.helpdesk.state.v1` only: `status`, `resolution`, `closureCode`, history | **Resolved** (ui/helpdesk.js:173-184; expected resolution: Update the task through the approved service credential workflow, unlock the account, and verify no new 4740 event.) | "Disposition" ✓/✗ + expected resolution (instructor only) |
| Finish click / reaching last step | `lab_attempts`: `{source:'mnt-coach-complete'}`, state complete, score null; local `LabRuntime` `consoleCompleted` | n/a | "Completion" line only |

Narrative fields: work note on HD-2101.

#### `lab-its-02-device-manager` and `lab-its-02-print-spooler` — one coach hd-m02 (ui/helpdesk-coaches.js:230); the portal writes two identical rows

| Student input | Saved today | Expected answer / source | Proposed sheet section |
| --- | --- | --- | --- |
| Open **HD-2106** (Elena Ruiz, Incident/Printer, P3) | Not saved (sim UI selection) | Ticket HD-2106, ui/helpdesk-data.js | Context header only (no ✓/✗) |
| Troubleshooting path: tick boxes (coach needs only >=1) | **Not saved anywhere**: bare `<input type=checkbox>`, no handler (ui/helpdesk.js:255) | Every listed step is valid (no distractors): 1) Confirm scope; 2) Preserve jobs; 3) Inspect queue and print-service log; 4) Isolate faulty driver; 5) Apply approved rollback; 6) Test one label | "Troubleshooting path": cannot be assessed until captured (H3) |
| Diagnosis dropdown + "Check diagnosis" (unlimited retries) | sim localStorage `defender-lab.helpdesk.state.v1` only: `diagnosis`, `diagnosisCorrect`, one history line per attempt | **Driver crash** (option 3 of 3: Out of labels / Network port / Driver crash); key ui/helpdesk.js:47,164-170 | "Diagnosis" ✓/✗ + wrong-attempt count |
| Work note (free text, any non-empty text accepted) | sim localStorage `defender-lab.helpdesk.state.v1` only: `notes[]` | No scorer. Coach hint: driver rollback under change control, not just "fixed the printer". Evidence lines to cite: "PrintService 372: driver LabelPro 3.8 terminated unexpectedly" | "Work note" (narrative: key-evidence check vs the log lines + mechanics + spelling) |
| Resolve / Warm escalate button | sim localStorage `defender-lab.helpdesk.state.v1` only: `status`, `resolution`, `closureCode`, history | **Resolved** (ui/helpdesk.js:173-184; expected resolution: Roll back to approved driver, restart spooler under change procedure, and verify queued work.) | "Disposition" ✓/✗ + expected resolution (instructor only) |
| Open **HD-2112** (IT Monitoring, Incident/Windows service, P2) | Not saved (sim UI selection) | Ticket HD-2112, ui/helpdesk-data.js | Context header only (no ✓/✗) |
| Troubleshooting path: tick boxes (coach needs only >=1) | **Not saved anywhere**: bare `<input type=checkbox>`, no handler (ui/helpdesk.js:255) | Every listed step is valid (no distractors): 1) Preserve logs; 2) Check dependency and recent change; 3) Quarantine faulty driver; 4) Use approved rollback; 5) Restart and validate queues | "Troubleshooting path": cannot be assessed until captured (H3) |
| Diagnosis dropdown + "Check diagnosis" (unlimited retries) | sim localStorage `defender-lab.helpdesk.state.v1` only: `diagnosis`, `diagnosisCorrect`, one history line per attempt | **Faulty driver** (option 3 of 3: Service account / Dependency / Faulty driver); key ui/helpdesk.js:47,164-170 | "Diagnosis" ✓/✗ + wrong-attempt count |
| Work note (free text, any non-empty text accepted) | sim localStorage `defender-lab.helpdesk.state.v1` only: `notes[]` | No scorer. Coach hint: driver rollback under change control, not just "fixed the printer". Evidence lines to cite: "System 7031: Print Spooler terminated unexpectedly"; "PrintService 808: LabelPro provider fault" | "Work note" (narrative: key-evidence check vs the log lines + mechanics + spelling) |
| Resolve / Warm escalate button | sim localStorage `defender-lab.helpdesk.state.v1` only: `status`, `resolution`, `closureCode`, history | **Resolved** (ui/helpdesk.js:173-184; expected resolution: Rollback the driver under change control and verify all queues.) | "Disposition" ✓/✗ + expected resolution (instructor only) |
| Finish click / reaching last step | `lab_attempts`: `{source:'mnt-coach-complete'}`, state complete, score null; local `LabRuntime` `consoleCompleted` | n/a | "Completion" line only |

Narrative fields: work note on HD-2106; work note on HD-2112.

#### `lab-its-03-blank-desktop` — coach hd-m03 (:374)

| Student input | Saved today | Expected answer / source | Proposed sheet section |
| --- | --- | --- | --- |
| Open **HD-2109** (Noah Williams, Incident/Windows profile, P3) | Not saved (sim UI selection) | Ticket HD-2109, ui/helpdesk-data.js | Context header only (no ✓/✗) |
| Troubleshooting path: tick boxes (coach needs only >=1) | **Not saved anywhere**: bare `<input type=checkbox>`, no handler (ui/helpdesk.js:255) | Every listed step is valid (no distractors): 1) Protect user data; 2) Confirm temporary-profile evidence; 3) Repair or rebuild per runbook; 4) Restore data; 5) Verify sign-in | "Troubleshooting path": cannot be assessed until captured (H3) |
| Diagnosis dropdown + "Check diagnosis" (unlimited retries) | sim localStorage `defender-lab.helpdesk.state.v1` only: `diagnosis`, `diagnosisCorrect`, one history line per attempt | **Corrupt profile mapping** (option 2 of 3: Cloud sync issue / Corrupt profile mapping / Malware); key ui/helpdesk.js:47,164-170 | "Diagnosis" ✓/✗ + wrong-attempt count |
| Work note (free text, any non-empty text accepted) | sim localStorage `defender-lab.helpdesk.state.v1` only: `notes[]` | No scorer. Coach hint: temporary-profile evidence, what was done, data verified afterward. Evidence lines to cite: "User Profile Service 1511: logged on with temporary profile" | "Work note" (narrative: key-evidence check vs the log lines + mechanics + spelling) |
| Resolve / Warm escalate button | sim localStorage `defender-lab.helpdesk.state.v1` only: `status`, `resolution`, `closureCode`, history | **Resolved** (ui/helpdesk.js:173-184; expected resolution: Repair/rebuild the profile using the approved runbook and verify data and application access.) | "Disposition" ✓/✗ + expected resolution (instructor only) |
| Finish click / reaching last step | `lab_attempts`: `{source:'mnt-coach-complete'}`, state complete, score null; local `LabRuntime` `consoleCompleted` | n/a | "Completion" line only |

Narrative fields: work note on HD-2109.

#### `lab-its-04-connectivity` — coach hd-m04 (:389); HD-2113 scoped but unguided

| Student input | Saved today | Expected answer / source | Proposed sheet section |
| --- | --- | --- | --- |
| Open **HD-2104** (Priya Shah, Incident/DHCP / connectivity, P2) | Not saved (sim UI selection) | Ticket HD-2104, ui/helpdesk-data.js | Context header only (no ✓/✗) |
| Troubleshooting path: tick boxes (coach needs only >=1) | **Not saved anywhere**: bare `<input type=checkbox>`, no handler (ui/helpdesk.js:255) | Every listed step is valid (no distractors): 1) Recognize APIPA; 2) Isolate network interfaces; 3) Renew lease; 4) Validate IP, gateway, DNS; 5) Test business resource | "Troubleshooting path": cannot be assessed until captured (H3) |
| Diagnosis dropdown + "Check diagnosis" (unlimited retries) | sim localStorage `defender-lab.helpdesk.state.v1` only: `diagnosis`, `diagnosisCorrect`, one history line per attempt | **Conflicting adapters** (option 3 of 3: DHCP unavailable / VLAN issue / Conflicting adapters); key ui/helpdesk.js:47,164-170 | "Diagnosis" ✓/✗ + wrong-attempt count |
| Work note (free text, any non-empty text accepted) | sim localStorage `defender-lab.helpdesk.state.v1` only: `notes[]` | No scorer. Coach hint: APIPA evidence, which interface was disabled, valid lease + resource access confirmed. Evidence lines to cite: "ipconfig: DHCP Enabled Yes · Autoconfiguration IPv4 169.254.44.19" | "Work note" (narrative: key-evidence check vs the log lines + mechanics + spelling) |
| Resolve / Warm escalate button | sim localStorage `defender-lab.helpdesk.state.v1` only: `status`, `resolution`, `closureCode`, history | **Resolved** (ui/helpdesk.js:173-184; expected resolution: Disable the unused dock adapter, renew Wi-Fi, confirm valid lease and resource access.) | "Disposition" ✓/✗ + expected resolution (instructor only) |
| Open **HD-2105** (Maya Chen, Incident/DNS, P2) | Not saved (sim UI selection) | Ticket HD-2105, ui/helpdesk-data.js | Context header only (no ✓/✗) |
| Troubleshooting path: tick boxes (coach needs only >=1) | **Not saved anywhere**: bare `<input type=checkbox>`, no handler (ui/helpdesk.js:255) | Every listed step is valid (no distractors): 1) Capture DNS configuration; 2) Query internal name; 3) Compare direct server query; 4) Restore VPN DNS settings; 5) Flush and retest | "Troubleshooting path": cannot be assessed until captured (H3) |
| Diagnosis dropdown + "Check diagnosis" (unlimited retries) | sim localStorage `defender-lab.helpdesk.state.v1` only: `diagnosis`, `diagnosisCorrect`, one history line per attempt | **DNS configuration** (option 3 of 3: Application outage / Routing failure / DNS configuration); key ui/helpdesk.js:47,164-170 | "Diagnosis" ✓/✗ + wrong-attempt count |
| Work note (free text, any non-empty text accepted) | sim localStorage `defender-lab.helpdesk.state.v1` only: `notes[]` | No scorer. Coach hint: DNS evidence, the VPN/DNS setting corrected, hostname resolved afterward. Evidence lines to cite: "Resolve-DnsName opsdash.northstar.example: NXDOMAIN"; "Client DNS server: 192.0.2.53" | "Work note" (narrative: key-evidence check vs the log lines + mechanics + spelling) |
| Resolve / Warm escalate button | sim localStorage `defender-lab.helpdesk.state.v1` only: `status`, `resolution`, `closureCode`, history | **Resolved** (ui/helpdesk.js:173-184; expected resolution: Reconnect/repair the approved VPN profile so corporate DNS is assigned; verify internal hostname resolution.) | "Disposition" ✓/✗ + expected resolution (instructor only) |
| Finish click / reaching last step | `lab_attempts`: `{source:'mnt-coach-complete'}`, state complete, score null; local `LabRuntime` `consoleCompleted` | n/a | "Completion" line only |

Narrative fields: work note on HD-2104; work note on HD-2105.

#### `lab-its-05-server-ad` — coach hd-m05 (:409)

| Student input | Saved today | Expected answer / source | Proposed sheet section |
| --- | --- | --- | --- |
| Open **HD-2108** (Amir Patel, Incident/Group Policy, P3) | Not saved (sim UI selection) | Ticket HD-2108, ui/helpdesk-data.js | Context header only (no ✓/✗) |
| Troubleshooting path: tick boxes (coach needs only >=1) | **Not saved anywhere**: bare `<input type=checkbox>`, no handler (ui/helpdesk.js:255) | Every listed step is valid (no distractors): 1) Verify authorization; 2) Run gpresult; 3) Check computer OU; 4) Move computer through approved admin task; 5) Refresh policy and verify | "Troubleshooting path": cannot be assessed until captured (H3) |
| Diagnosis dropdown + "Check diagnosis" (unlimited retries) | sim localStorage `defender-lab.helpdesk.state.v1` only: `diagnosis`, `diagnosisCorrect`, one history line per attempt | **GPO scope** (option 2 of 3: Disconnected drive / GPO scope / File server outage); key ui/helpdesk.js:47,164-170 | "Diagnosis" ✓/✗ + wrong-attempt count |
| Work note (free text, any non-empty text accepted) | sim localStorage `defender-lab.helpdesk.state.v1` only: `notes[]` | No scorer. Coach hint: OU evidence, object moved, drive mapping returned after policy refresh. Evidence lines to cite: "gpresult: Operations Drive Mapping absent"; "Computer DN: CN=NS-LT-0145,CN=Computers" | "Work note" (narrative: key-evidence check vs the log lines + mechanics + spelling) |
| Resolve / Warm escalate button | sim localStorage `defender-lab.helpdesk.state.v1` only: `status`, `resolution`, `closureCode`, history | **Resolved** (ui/helpdesk.js:173-184; expected resolution: Move the computer to the correct OU, run policy refresh, verify O: mapping.) | "Disposition" ✓/✗ + expected resolution (instructor only) |
| Open **HD-2117** (Monitoring, Incident/Disk space, P2) | Not saved (sim UI selection) | Ticket HD-2117, ui/helpdesk-data.js | Context header only (no ✓/✗) |
| Troubleshooting path: tick boxes (coach needs only >=1) | **Not saved anywhere**: bare `<input type=checkbox>`, no handler (ui/helpdesk.js:255) | Every listed step is valid (no distractors): 1) Confirm impact and growth; 2) Identify safe cleanup candidates; 3) Preserve business data; 4) Stop duplicate generation through owner; 5) Use approved cleanup/change | "Troubleshooting path": cannot be assessed until captured (H3) |
| Diagnosis dropdown + "Check diagnosis" (unlimited retries) | sim localStorage `defender-lab.helpdesk.state.v1` only: `diagnosis`, `diagnosisCorrect`, one history line per attempt | **Duplicate export** (option 3 of 3: Normal growth / Log growth / Duplicate export); key ui/helpdesk.js:47,164-170 | "Diagnosis" ✓/✗ + wrong-attempt count |
| Work note (free text, any non-empty text accepted) | sim localStorage `defender-lab.helpdesk.state.v1` only: `notes[]` | No scorer. Coach hint: duplicate-export evidence, who was looped in before deleting, free-space result. Evidence lines to cite: "Get-Volume D: SizeRemaining 81GB of 2TB"; "Top path: D:\Shares\Finance\Exports" | "Work note" (narrative: key-evidence check vs the log lines + mechanics + spelling) |
| Resolve / Warm escalate button | sim localStorage `defender-lab.helpdesk.state.v1` only: `status`, `resolution`, `closureCode`, history | **Resolved** (ui/helpdesk.js:173-184; expected resolution: Stop duplicate job via app owner, remove duplicates after approval, verify free-space threshold and monitoring.) | "Disposition" ✓/✗ + expected resolution (instructor only) |
| Finish click / reaching last step | `lab_attempts`: `{source:'mnt-coach-complete'}`, state complete, score null; local `LabRuntime` `consoleCompleted` | n/a | "Completion" line only |

Narrative fields: work note on HD-2108; work note on HD-2117.

#### `lab-its-06-identity-access` — coach hd-m06 (:433)

| Student input | Saved today | Expected answer / source | Proposed sheet section |
| --- | --- | --- | --- |
| Open **SR-2107** (Grace Kim, Service Request/Group membership, P3) | Not saved (sim UI selection) | Ticket SR-2107, ui/helpdesk-data.js | Context header only (no ✓/✗) |
| Troubleshooting path: tick boxes (coach needs only >=1) | **Not saved anywhere**: bare `<input type=checkbox>`, no handler (ui/helpdesk.js:255) | Every listed step is valid (no distractors): 1) Validate approval; 2) Add authorized group; 3) Refresh user token; 4) Verify effective access; 5) Document change | "Troubleshooting path": cannot be assessed until captured (H3) |
| Diagnosis dropdown + "Check diagnosis" (unlimited retries) | sim localStorage `defender-lab.helpdesk.state.v1` only: `diagnosis`, `diagnosisCorrect`, one history line per attempt | **Missing group membership** (option 2 of 2: NTFS ACL issue / Missing group membership); key ui/helpdesk.js:47,164-170 | "Diagnosis" ✓/✗ + wrong-attempt count |
| Work note (free text, any non-empty text accepted) | sim localStorage `defender-lab.helpdesk.state.v1` only: `notes[]` | No scorer. Coach hint: approval reference, group restored, upload access verified. Evidence lines to cite: "AD group history: removed from GG-HR-Contributors during transfer" | "Work note" (narrative: key-evidence check vs the log lines + mechanics + spelling) |
| Resolve / Warm escalate button | sim localStorage `defender-lab.helpdesk.state.v1` only: `status`, `resolution`, `closureCode`, history | **Resolved** (ui/helpdesk.js:173-184; expected resolution: Add GG-HR-Contributors, refresh sign-in token, verify upload, document approval.) | "Disposition" ✓/✗ + expected resolution (instructor only) |
| Open **HD-2118** (Evan Parker, Incident/File permissions, P2) | Not saved (sim UI selection) | Ticket HD-2118, ui/helpdesk-data.js | Context header only (no ✓/✗) |
| Troubleshooting path: tick boxes (coach needs only >=1) | **Not saved anywhere**: bare `<input type=checkbox>`, no handler (ui/helpdesk.js:255) | Every listed step is valid (no distractors): 1) Validate requested access; 2) Calculate group-based effective access; 3) Check share and NTFS; 4) Correct approved membership; 5) Refresh token and verify | "Troubleshooting path": cannot be assessed until captured (H3) |
| Diagnosis dropdown + "Check diagnosis" (unlimited retries) | sim localStorage `defender-lab.helpdesk.state.v1` only: `diagnosis`, `diagnosisCorrect`, one history line per attempt | **NTFS permission** (option 2 of 3: File locked / NTFS permission / Share offline); key ui/helpdesk.js:47,164-170 | "Diagnosis" ✓/✗ + wrong-attempt count |
| Work note (free text, any non-empty text accepted) | sim localStorage `defender-lab.helpdesk.state.v1` only: `notes[]` | No scorer. Coach hint: effective-access evidence, group restored, Modify verified without direct user ACL. Evidence lines to cite: "Effective access: Read & Execute"; "Share permission: Change" | "Work note" (narrative: key-evidence check vs the log lines + mechanics + spelling) |
| Resolve / Warm escalate button | sim localStorage `defender-lab.helpdesk.state.v1` only: `status`, `resolution`, `closureCode`, history | **Resolved** (ui/helpdesk.js:173-184; expected resolution: Restore approved contributor group and verify Modify without direct user ACL.) | "Disposition" ✓/✗ + expected resolution (instructor only) |
| Finish click / reaching last step | `lab_attempts`: `{source:'mnt-coach-complete'}`, state complete, score null; local `LabRuntime` `consoleCompleted` | n/a | "Completion" line only |

Narrative fields: work note on SR-2107; work note on HD-2118.

#### `lab-its-07-app-cert` — coach hd-m07 (:457); HD-2120..2123 scoped but unguided

| Student input | Saved today | Expected answer / source | Proposed sheet section |
| --- | --- | --- | --- |
| Open **HD-2119** (Maya Chen, Incident/Enterprise application, P2) | Not saved (sim UI selection) | Ticket HD-2119, ui/helpdesk-data.js | Context header only (no ✓/✗) |
| Troubleshooting path: tick boxes (coach needs only >=1) | **Not saved anywhere**: bare `<input type=checkbox>`, no handler (ui/helpdesk.js:255) | Every listed step is valid (no distractors): 1) Confirm shared symptom; 2) Compare timestamps and error; 3) Link related incidents; 4) Validate certificate evidence; 5) Escalate controlled renewal | "Troubleshooting path": cannot be assessed until captured (H3) |
| Diagnosis dropdown + "Check diagnosis" (unlimited retries) | sim localStorage `defender-lab.helpdesk.state.v1` only: `diagnosis`, `diagnosisCorrect`, one history line per attempt | **Application certificate** (option 3 of 3: User account / Browser cache / Application certificate); key ui/helpdesk.js:47,164-170 | "Diagnosis" ✓/✗ + wrong-attempt count |
| Work note (free text, any non-empty text accepted) | sim localStorage `defender-lab.helpdesk.state.v1` only: `notes[]` | No scorer. Coach hint: certificate-expiry evidence, the other correlated tickets, needs controlled renewal not per-user fix. Evidence lines to cite: "Browser: NET::ERR_CERT_DATE_INVALID"; "TLS NotAfter: 2026-08-16T23:59:59Z" | "Work note" (narrative: key-evidence check vs the log lines + mechanics + spelling) |
| Resolve / Warm escalate button | sim localStorage `defender-lab.helpdesk.state.v1` only: `status`, `resolution`, `closureCode`, history | **Escalated** (ui/helpdesk.js:173-184; expected resolution: Link to the common incident/problem, renew the certificate through change control, verify all user paths.) | "Disposition" ✓/✗ + expected resolution (instructor only) |
| Finish click / reaching last step | `lab_attempts`: `{source:'mnt-coach-complete'}`, state complete, score null; local `LabRuntime` `consoleCompleted` | n/a | "Completion" line only |

Narrative fields: work note on HD-2119.

#### `lab-its-08-unfamiliar-problems` — coach hd-m08 (:471)

| Student input | Saved today | Expected answer / source | Proposed sheet section |
| --- | --- | --- | --- |
| Open **HD-2110** (Sofia Martin, Incident/Domain trust, P2) | Not saved (sim UI selection) | Ticket HD-2110, ui/helpdesk-data.js | Context header only (no ✓/✗) |
| Troubleshooting path: tick boxes (coach needs only >=1) | **Not saved anywhere**: bare `<input type=checkbox>`, no handler (ui/helpdesk.js:255) | Every listed step is valid (no distractors): 1) Confirm recovery access; 2) Validate DNS/time/object state; 3) Test secure channel; 4) Repair through approved Tier 2 procedure; 5) Verify sign-in and policy | "Troubleshooting path": cannot be assessed until captured (H3) |
| Diagnosis dropdown + "Check diagnosis" (unlimited retries) | sim localStorage `defender-lab.helpdesk.state.v1` only: `diagnosis`, `diagnosisCorrect`, one history line per attempt | **Machine-account mismatch** (option 3 of 3: Bad user password / DNS / Machine-account mismatch); key ui/helpdesk.js:47,164-170 | "Diagnosis" ✓/✗ + wrong-attempt count |
| Work note (free text, any non-empty text accepted) | sim localStorage `defender-lab.helpdesk.state.v1` only: `notes[]` | No scorer. Coach hint: snapshot-timing evidence, approved repair procedure, domain sign-in verified. Evidence lines to cite: "Test-ComputerSecureChannel: False"; "NETLOGON 3210 secure session failed" | "Work note" (narrative: key-evidence check vs the log lines + mechanics + spelling) |
| Resolve / Warm escalate button | sim localStorage `defender-lab.helpdesk.state.v1` only: `status`, `resolution`, `closureCode`, history | **Resolved** (ui/helpdesk.js:173-184; expected resolution: Repair the secure channel, restart if approved, verify domain authentication and gpresult.) | "Disposition" ✓/✗ + expected resolution (instructor only) |
| Open **HD-2111** (Dina Foster, Incident/BitLocker, P2) | Not saved (sim UI selection) | Ticket HD-2111, ui/helpdesk-data.js | Context header only (no ✓/✗) |
| Troubleshooting path: tick boxes (coach needs only >=1) | **Not saved anywhere**: bare `<input type=checkbox>`, no handler (ui/helpdesk.js:255) | Every listed step is valid (no distractors): 1) Verify user and device; 2) Match recovery key ID; 3) Provide key through approved secure channel; 4) Boot and validate protection; 5) Document disclosure | "Troubleshooting path": cannot be assessed until captured (H3) |
| Diagnosis dropdown + "Check diagnosis" (unlimited retries) | sim localStorage `defender-lab.helpdesk.state.v1` only: `diagnosis`, `diagnosisCorrect`, one history line per attempt | **Expected firmware measurement change** (option 2 of 2: Unauthorized tamper / Expected firmware measurement change); key ui/helpdesk.js:47,164-170 | "Diagnosis" ✓/✗ + wrong-attempt count |
| Work note (free text, any non-empty text accepted) | sim localStorage `defender-lab.helpdesk.state.v1` only: `notes[]` | No scorer. Coach hint: firmware-change evidence, identity verified before disclosure, protection status confirmed. Evidence lines to cite: "Firmware change CHG-4471 completed overnight" | "Work note" (narrative: key-evidence check vs the log lines + mechanics + spelling) |
| Resolve / Warm escalate button | sim localStorage `defender-lab.helpdesk.state.v1` only: `status`, `resolution`, `closureCode`, history | **Resolved** (ui/helpdesk.js:173-184; expected resolution: Use escrowed recovery key after identity verification, confirm BitLocker returns to Protected.) | "Disposition" ✓/✗ + expected resolution (instructor only) |
| Finish click / reaching last step | `lab_attempts`: `{source:'mnt-coach-complete'}`, state complete, score null; local `LabRuntime` `consoleCompleted` | n/a | "Completion" line only |

Narrative fields: work note on HD-2110; work note on HD-2111.

#### `lab-its-09-security-incidents` — coach hd-m09 (:492)

| Student input | Saved today | Expected answer / source | Proposed sheet section |
| --- | --- | --- | --- |
| Open **SEC-2114** (Luis Ortega, Security Incident/Phishing, P1) | Not saved (sim UI selection) | Ticket SEC-2114, ui/helpdesk-data.js | Context header only (no ✓/✗) |
| Troubleshooting path: tick boxes (coach needs only >=1) | **Not saved anywhere**: bare `<input type=checkbox>`, no handler (ui/helpdesk.js:255) | Every listed step is valid (no distractors): 1) Verify reporter; 2) Preserve email/URL/time; 3) Protect account within procedure; 4) Escalate immediately; 5) Do not declare endpoint safe | "Troubleshooting path": cannot be assessed until captured (H3) |
| Diagnosis dropdown + "Check diagnosis" (unlimited retries) | sim localStorage `defender-lab.helpdesk.state.v1` only: `diagnosis`, `diagnosisCorrect`, one history line per attempt | **Credential phishing** (option 2 of 2: Benign vendor portal / Credential phishing); key ui/helpdesk.js:47,164-170 | "Diagnosis" ✓/✗ + wrong-attempt count |
| Work note (free text, any non-empty text accepted) | sim localStorage `defender-lab.helpdesk.state.v1` only: `notes[]` | No scorer. Coach hint: lookalike-domain evidence, account protected within procedure, escalated immediately. Evidence lines to cite: "Browser history: northstar-shipping.example-login.test"; "Identity log: unfamiliar sign-in pending review" | "Work note" (narrative: key-evidence check vs the log lines + mechanics + spelling) |
| Resolve / Warm escalate button | sim localStorage `defender-lab.helpdesk.state.v1` only: `status`, `resolution`, `closureCode`, history | **Escalated** (ui/helpdesk.js:173-184; expected resolution: Escalate to cybersecurity, revoke sessions/reset credential per response runbook, preserve evidence.) | "Disposition" ✓/✗ + expected resolution (instructor only) |
| Open **SEC-2115** (Endpoint Security, Security Incident/Malware alert, P1) | Not saved (sim UI selection) | Ticket SEC-2115, ui/helpdesk-data.js | Context header only (no ✓/✗) |
| Troubleshooting path: tick boxes (coach needs only >=1) | **Not saved anywhere**: bare `<input type=checkbox>`, no handler (ui/helpdesk.js:255) | Every listed step is valid (no distractors): 1) Do not delete evidence; 2) Confirm user/device; 3) Coordinate containment; 4) Record observations; 5) Warm handoff to security | "Troubleshooting path": cannot be assessed until captured (H3) |
| Diagnosis dropdown + "Check diagnosis" (unlimited retries) | sim localStorage `defender-lab.helpdesk.state.v1` only: `diagnosis`, `diagnosisCorrect`, one history line per attempt | **Malicious extension** (option 1 of 2: Malicious extension / False positive); key ui/helpdesk.js:47,164-170 | "Diagnosis" ✓/✗ + wrong-attempt count |
| Work note (free text, any non-empty text accepted) | sim localStorage `defender-lab.helpdesk.state.v1` only: `notes[]` | No scorer. Coach hint: PowerShell evidence, containment steps coordinated, warm handoff to security. Evidence lines to cite: "EDR: suspicious powershell child of browser"; "SHA256 aaa... training fixture" | "Work note" (narrative: key-evidence check vs the log lines + mechanics + spelling) |
| Resolve / Warm escalate button | sim localStorage `defender-lab.helpdesk.state.v1` only: `status`, `resolution`, `closureCode`, history | **Escalated** (ui/helpdesk.js:173-184; expected resolution: Security-led containment and investigation; help desk handles user communication and replacement device.) | "Disposition" ✓/✗ + expected resolution (instructor only) |
| Finish click / reaching last step | `lab_attempts`: `{source:'mnt-coach-complete'}`, state complete, score null; local `LabRuntime` `consoleCompleted` | n/a | "Completion" line only |

Narrative fields: work note on SEC-2114; work note on SEC-2115.

#### `lab-its-11-handoff-documentation` — coach hd-m11 (:579)

| Student input | Saved today | Expected answer / source | Proposed sheet section |
| --- | --- | --- | --- |
| Open **HD-2113** (Remote Employee · Kai Ross, Incident/VPN, P2) | Not saved (sim UI selection) | Ticket HD-2113, ui/helpdesk-data.js | Context header only (no ✓/✗) |
| Troubleshooting path: tick boxes (coach needs only >=1) | **Not saved anywhere**: bare `<input type=checkbox>`, no handler (ui/helpdesk.js:255) | Every listed step is valid (no distractors): 1) Capture client log and time; 2) Validate certificate chain and expiry; 3) Correlate other users; 4) Escalate gateway certificate renewal; 5) Communicate workaround only if approved | "Troubleshooting path": cannot be assessed until captured (H3) |
| Diagnosis dropdown + "Check diagnosis" (unlimited retries) | sim localStorage `defender-lab.helpdesk.state.v1` only: `diagnosis`, `diagnosisCorrect`, one history line per attempt | **Gateway certificate** (option 3 of 3: Password / Home firewall / Gateway certificate); key ui/helpdesk.js:47,164-170 | "Diagnosis" ✓/✗ + wrong-attempt count |
| Work note (free text, any non-empty text accepted) | sim localStorage `defender-lab.helpdesk.state.v1` only: `notes[]` | No scorer. Coach hint: expired-certificate evidence, other users affected the same way, needs certificate renewal not per-user fix (module explicitly grades "a note a stranger can act on"). Evidence lines to cite: "VPN client: certificate validation failed · NotAfter 2026-08-16" | "Work note" (narrative: key-evidence check vs the log lines + mechanics + spelling) |
| Resolve / Warm escalate button | sim localStorage `defender-lab.helpdesk.state.v1` only: `status`, `resolution`, `closureCode`, history | **Escalated** (ui/helpdesk.js:173-184; expected resolution: Escalate as shared service incident for approved certificate renewal; validate new chain.) | "Disposition" ✓/✗ + expected resolution (instructor only) |
| Open **HD-2124** (Tara Singh, Incident/Email / Outlook, P2) | Not saved (sim UI selection) | Ticket HD-2124, ui/helpdesk-data.js | Context header only (no ✓/✗) |
| Troubleshooting path: tick boxes (coach needs only >=1) | **Not saved anywhere**: bare `<input type=checkbox>`, no handler (ui/helpdesk.js:255) | Every listed step is valid (no distractors): 1) Verify identity and confirm the recent password change; 2) Check other M365 apps to confirm the failure is scoped to Outlook; 3) Open Credential Manager and locate the stale Office/Outlook entry; 4) Remove the stale credential and restart Outlook; 5) Re-authenticate and confirm send/receive succeeds; 6) Set a clear, honest expectation before ending the call | "Troubleshooting path": cannot be assessed until captured (H3) |
| Diagnosis dropdown + "Check diagnosis" (unlimited retries) | sim localStorage `defender-lab.helpdesk.state.v1` only: `diagnosis`, `diagnosisCorrect`, one history line per attempt | **Stale cached credential in Credential Manager** (option 3 of 3: Outlook profile corruption / Exchange service outage / Stale cached credential in Credential Manager); key ui/helpdesk.js:47,164-170 | "Diagnosis" ✓/✗ + wrong-attempt count |
| Work note (free text, any non-empty text accepted) | sim localStorage `defender-lab.helpdesk.state.v1` only: `notes[]` | No scorer. Coach hint: stale Credential Manager entry as cause, what was removed, send/receive confirmed; plus plain-language, no-overpromise customer tone (not captured anywhere). Evidence lines to cite: "Outlook Connection Status: Auth error 0x8004101 on send/receive"; "Azure AD sign-in log: password changed 09:02 today"; "Credential Manager: generic credential MicrosoftOffice16_Data:ssp: last modified 3 weeks ago" | "Work note" (narrative: key-evidence check vs the log lines + mechanics + spelling) |
| Resolve / Warm escalate button | sim localStorage `defender-lab.helpdesk.state.v1` only: `status`, `resolution`, `closureCode`, history | **Resolved** (ui/helpdesk.js:173-184; expected resolution: Remove the stale Outlook/Office credential from Credential Manager, restart Outlook, re-authenticate with the new password, and confirm send/receive succeeds before closing.) | "Disposition" ✓/✗ + expected resolution (instructor only) |
| Finish click / reaching last step | `lab_attempts`: `{source:'mnt-coach-complete'}`, state complete, score null; local `LabRuntime` `consoleCompleted` | n/a | "Completion" line only |

Narrative fields: work note on HD-2113; work note on HD-2124.

#### `lab-its-10-priority-queue` — coach hd-m10 (`ui/helpdesk-coaches.js:515`), full unfiltered queue

| Student input | Saved today | Expected answer / source | Proposed sheet section |
| --- | --- | --- | --- |
| Set Priority filter to P1 | Not saved in the result; sim `priorityFilter` (reset on next launch) | `hdState.priorityFilter === 'P1'` (coach step 1) | "Queue filter" ✓/✗ (needs capture) |
| Open any P1 ticket | Sim `selectedTicketId`; ticket id not sent | P1 tickets: SEC-2114, SEC-2115, SR-2103 (`ui/helpdesk-data.js`) | "Ticket opened" (id + priority) |
| Read business impact + SLA (continue button) | Not saved | n/a | None |
| Work note "why this ticket sorts first" | Sim `notes[]` | No scorer. Coach asks for impact + SLA deadline: P1 SLA 15 min (`HD_ORG.slas`); ticket's `businessImpact` | "Priority justification" narrative: key-evidence = names the impact and the SLA/deadline |
| Finish | `{source:'mnt-coach-complete'}`, score null | Completion fires on *arriving* at the note step (see bugs): the note is **not required** | "Completion" + warning "note not captured / not required" |

Narrative fields: priority-justification note.

#### `lab-its-12-capstone` (portal-native, `it-support-module-12.js`)

Scorer `its12Score` (`:239`), key `ITS12_TICKETS` (`:49`), rubric `ITS12_RUBRIC` (`:23`), pass 70 + zero critical errors (`:84`). Per ticket the student enters rank, category, first step, resolve/escalate, reasoning; plus KB article and after-action. Saved today: every field in `LabRuntime` (draft) and, on **each** submit, `portfolio_artifacts.content` (all fields + score + feedback); `lab_attempts.result` = `{breakdown, criticalErrors, attempts}` only; on pass also `capstone_submissions.answers`.

| Student input (per ticket, in queue order) | Saved today | Expected answer / source | Proposed sheet section |
| --- | --- | --- | --- |
| Priority rank 1-6 (duplicates allowed) | artifacts + submissions only; **not** in `lab_attempts.result` | SEC-2114=1, HD-2110=2, HD-2104=3, SR-2107=4, HD-2109=5, HD-2106=6 (`correctRank`); 15 pts, scaled by fraction right | "Triage" per ticket ✓/✗ (Triage 15) |
| Category | same | SEC-2114 security; HD-2110 server; HD-2104 network; SR-2107 identity; HD-2109 endpoint; HD-2106 peripheral | "Category" ✓/✗ (with first step = Technical 20) |
| First diagnostic step (text) | same | **Regex, not a human key:** SEC-2114 `do ?n[o']?t (reset\|click)\|isolate\|report\|security team\|…`; HD-2110 `domain trust\|rejoin\|escalate\|tier ?2\|…`; HD-2104 `ipconfig\|apipa\|renew\|dhcp\|release`; SR-2107 `group\|member ?of\|active directory\|add …`; HD-2109 `profile\|temporary profile\|rebuild\|…`; HD-2106 `spooler\|restart\|print queue\|clear` | "First step" narrative: key-evidence from the pattern's own words |
| Resolve / Escalate | same | SEC-2114 escalate, HD-2110 escalate, others resolve; Escalation 15; a Security ticket resolved = **critical error** (fails regardless of score) | "Decision" ✓/✗ + critical-error banner; Security 10 = right category and decision on SEC-2114 |
| Reasoning (text) | same | Regex per ticket (`reasoningPattern`) AND length >= 15; Communication 15; `explain` text is the model answer | "Reasoning" narrative: key-evidence + mechanics + spelling; show `explain` to instructor only |
| KB article (text) | same | >= 80 chars and matches `symptom\|cause\|fix\|resolv\|verif` => 15; >= 40 => 8 (`:275`) | "KB article" narrative (symptom / cause / fix / verification checks) |
| After-action review (text) | same | >= 40 chars => 10; >= 15 => 5 (`:279`); length only | "After-action" narrative (honest self-review; advisory) |
| Submit | `lab_attempts` `{breakdown,criticalErrors,attempts}` + score; state `in_progress` if fail | pass = score >= 70 and no critical errors | Header: attempt n, score, breakdown, critical errors |

Narrative fields: 6 x first step, 6 x reasoning, KB article, after-action review. Automated "communication" credit is keyword-only, so the sheet must not present it as a quality judgement.

Gaps for H1: rank/category/decision/text are not in `result`; add `ticketResponses`, `kbArticle`, `afterAction`, `feedback`, `score` (additive). Keep `ITS12_TICKETS` as the single key source (it is a top-level `const`; the sheet file should read it, not copy it). Note the earlier-attempt "older rows show Not recorded" rule.
