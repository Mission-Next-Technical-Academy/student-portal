**2026-10-19 (Megan; PR #<added by /pr-ready> "Shared: stop the module rail covering Help Desk controls and switch off night mode"; shared `portal/module-labs.css`, `portal/theme.js`, `portal/index.html` version lines — please review those):**
Two shared changes. (1) On Help Desk module pages the floated left rail
covered buttons, file pickers and checkboxes at 1,280–1,512 px wide: the
rail floats at the main column's left edge, but `<main>` kept its fixed
`min(1180px, …)` width and centred margins, so its left part sat under the
rail. A new rule makes `<main>` sit beside the rail instead, taking only
the width left over. (2) Night mode is switched off on every page that
loads `theme.js`, including SOC, M360, range-tool and imported-lab pages:
they always show day mode and no longer show the Night mode button. The
night-mode code and `theme.css` night styles are kept.
- `portal/module-labs.css` (shared): inside the existing `min-width: 961px`
  block that floats the rail, one new rule for
  `.itss-shell`, `.its01-shell`, `.its02-shell` and `.its12-shell`
  `> .munified-nav ~ main`: `display: flow-root; width: auto; margin-left:
  0; margin-right: max(20px, calc((100vw - 1180px) / 2))`. Help Desk only.
  The same float rule still applies to `.aim-shell`, `.eee01-shell` and
  `.m02-shell`…`.m12-shell`; this PR doesn't change them.
- `portal/theme.js` (shared): new `NIGHT_MODE_ENABLED = false`. While it's
  false, `readTheme()` returns `'day'`, and the script returns before
  mounting the toggle or adding the `storage` listener. A saved
  `mission-next-theme = night` value stays in localStorage untouched, so
  setting the flag back to `true` restores it and the toggle.
- `portal/index.html` (shared): version bumps for `module-labs.css`,
  `theme.js`, `it-support-module-01.css`, `it-support-module-02.css` and
  `it-support-shared.js`. The other pages that load `theme.js` (M360,
  range tools, imported labs, the simulator) keep `?v=20261005-theme`;
  GitHub Pages serves it with `max-age=600`, so they pick up the new script
  within 10 minutes of deploy.
- Simulator theme path (not changed here): `ui/index.html` loads
  `../portal/theme.css` and `../portal/theme.js`, but the deploy puts the
  portal at the site root and the simulator at `/sim/`, so both return 404
  on staging and production (checked: `/portal/theme.js` 404,
  `/theme.js` 200). Under `bin/dev.sh` the simulator is served on its own
  port, so the path doesn't resolve there either. The simulator has never
  loaded the theme, so this PR changes nothing there.
- Help Desk-only (Megan's): the Module 1 and 2 heroes always stack, with
  the description first and the stats box underneath at every width; the
  stats box is at most 520 px wide and its text wraps. The hero
  label (`itsLabCounterText()` in `portal/it-support-shared.js`) now reads
  e.g. "4 labs · 1 waiting for review · 1 passed · 1 returned"; expected
  strings updated in `tests/hdesk-module-page-states.test.js`.
- No migration, no data or grading change.

**2026-10-19 (Megan; PR #77 "Help Desk: full-width work notes box in the simulator ticket view"; `ui/helpdesk.js`, `ui/styles.css`, `ui/index.html` — all three fall under the `*` CODEOWNERS rule, please review those):**
The Work notes box on a Help Desk simulator ticket was an unstyled
3-row textarea (its `textarea` class had no CSS rule). It now uses the
simulator's `ipt` input style, is full width, 7 rows tall, and resizes
vertically only, with a gap above the "Add work note" button. Behaviour is
unchanged: the box keeps `id="hd-note-input"`, `hdAddNote()` still reads it
by id, and the button is still its next sibling, so the coach targets
`#hd-note-input, #hd-note-input ~ button` in `ui/helpdesk-coaches.js` still
match.
- `ui/helpdesk.js`: the textarea's class changed from `textarea` to
  `ipt hd-note-input` and `rows` from 3 to 7. Nothing else in the ticket
  view changed.
- `ui/styles.css` (shared stylesheet): one new rule after the
  `.hd-note-list` rules, `textarea.hd-note-input { display: block;
  font-family: inherit; line-height: 1.5; margin-bottom: 10px; min-height:
  80px; resize: vertical; }`. It matches only this one element, so SOC and
  other simulator screens are unaffected. `font-family: inherit` overrides
  the monospace font that `textarea.ipt` sets, so notes are typed in the
  same font they're shown in.
- `ui/index.html` (shared): version bumps, `styles.css?v=20261019-work-notes`
  (it was still `20260818`, although `styles.css` last changed on Sep 21)
  and `helpdesk.js?v=20261019-work-notes`. Every SOC simulator page loads
  `styles.css` again once, from the new URL.
- No migration, no data or grading change.

**2026-10-16 (Megan; PR #64 "Correct Supabase staging instructions and tidy agent rules"; shared docs and one workflow message: `CLAUDE.md`, `AGENTS.md`,
`docs/operations/AI_AGENT_RULES.md`, `docs/operations/STAGING_AUTOMATION.md`,
`.github/workflows/supabase-change-reminder.yml` — please review those):**
Corrected the Supabase staging instructions. `supabase db push`, `db reset`
and `migration repair` have no `--project-ref` option (only commands such as
`functions deploy` do), so the documented commands failed with an unknown-flag
error, and dropping the flag would act on whichever project the CLI happens to
be linked to. The docs now say to confirm `cat supabase/.temp/project-ref`
prints the staging ref, then use `supabase db push --linked --dry-run` and
`--linked`; the Supabase change reminder comment on PRs says the same. The
`functions deploy`/`delete --project-ref` lines are unchanged (they were
correct). Also: the local-testing paragraph at the top of `CLAUDE.md` is now a
bullet list with the same rules, and `AI_AGENT_RULES.md` is in backticks in
`CLAUDE.md` and `AGENTS.md`. No code or behaviour changes beyond the reminder's
wording.

**2026-10-15 (Megan; PR #63 "L-007: Store Help Desk evidence files and let
instructors open them"; Help Desk files plus shared `portal/app.js`, a new
`supabase/` migration, `tests/portal-vm.js`, `bin/ci-check.sh` and the
`portal/index.html` version lines — please review those):** Help Desk
evidence labs (1.1, 2.1, 2.2) now store each student's screenshots in a new
private Storage bucket, and instructors and admins can open them from the Lab
Attempts tab, including after the student has signed out. The student picks
files and presses Submit; the browser uploads each file, then saves the lab
attempt with the same id it used for the upload folder. A failed upload saves
no attempt; a refused attempt (for example, one already waiting for review)
removes the uploaded files. Picked files stay in page memory only, so after a
reload the student chooses them again. The file picker now offers only PNG,
JPEG and WebP, and files must be 10 MB or smaller (checked in the browser,
enforced by the bucket). Lab 1.1's second tile now asks for a screenshot of
the student's own dashboard. `score: 100` on evidence attempts is unchanged.
- Files: `portal/it-support-shared.js`, `-shared.css`, `-module-01.js`,
  `-module-02.js` (Megan's).
- New migration (`supabase/`, yours by CODEOWNERS default):
  `supabase/migrations/20261015120000_lab_evidence_storage.sql`. Creates the
  private `lab-evidence` bucket (10 MB per file; PNG/JPEG/WebP only), four
  functions (`lab_evidence_attempt_id`, `can_read_lab_evidence`,
  `can_write_lab_evidence`, `can_delete_lab_evidence`) and three
  `storage.objects` policies (`lab_evidence_read`, `_insert`, `_delete`; no
  update policy). Path:
  `<track_code>/<user_id>/<module_key>/<lab_key>/<attempt_id>/<field>.<ext>`.
  Read: the student whose user folder it is, or an admin or the course's
  assigned instructor (`is_admin()` / `can_manage_course_messages()`) only
  when a `lab_attempts` row with that id exists and its `user_id`,
  `track_code` and `lab_key` match the path. Insert: own folder only, with
  `has_module_write_access()` and `has_valid_site_session()`, into a lab that
  `course_module_labs` lists for that module, and refused once an attempt
  with that id exists (files can't be added or swapped after submitting).
  Delete: owner only, while no attempt with that id exists (cleanup after a
  failed submit). It doesn't alter `storage.objects` itself; rollback note is
  in the file. Megan applies it to staging first, then to production after
  the staging browser tests pass and before merging.
- Shared `portal/app.js`: (1) `recordLabAttempt()` takes an optional `id`;
  when given, the insert uses it. Every existing call is unchanged. (2)
  `adminAttemptReviewCard()` and the decided-attempt row in
  `adminLabAttemptsPanel()` include
  `typeof itsEvidenceReviewPanel === 'function' ? itsEvidenceReviewPanel(row) : ''`.
  The panel draws only when `row.result.evidence_files` is a list, offers
  Open only for paths inside that attempt's own folder, and opens files
  through a 5-minute signed link under the reviewer's own session.
- Tests (`tests/`, yours by default): new `tests/hdesk-evidence-upload.test.js`
  and `tests/lab-attempt-evidence-panel.test.js`; updated
  `tests/hdesk-module-page-states.test.js` and
  `tests/hdesk-returned-lab-resubmit.test.js` (their fake file now includes a
  File-like object, and a few checks expect files to be chosen again after a
  reload); `tests/portal-vm.js` gains a `mntSupabase.storage.from()` stub
  (`upload` / `remove` / `createSignedUrl`, recorded in `supabaseCalls` as
  `storage:<bucket>`) and `crypto`; nothing existing in the stub changed.
- `bin/ci-check.sh`: one added section, `echo '== Lab evidence files =='`
  plus `node tests/hdesk-evidence-upload.test.js` and
  `node tests/lab-attempt-evidence-panel.test.js`.
- `portal/index.html`: version bumps for `it-support-shared.css/js`,
  `it-support-module-01/02.js` and `app.js`.
- Decision recorded: the evidence list lives in
  `lab_attempts.result.evidence_files`, one entry per file:
  `{ field, label, path, name, size, type }`. It's not in
  portfolio_artifacts; the files belong to the attempt they were submitted
  with. Each resubmission gets its own folder; earlier attempts' files are
  kept.
- SOC / other programs: no behavior change. The panel draws only for rows
  with `evidence_files`, which SOC rows don't have (a test checks a SOC review
  card has no panel). `recordLabAttempt()` callers that pass no `id` behave
  exactly as before. The migration touches only the storage schema and adds
  new functions; no existing table, policy or function changes.
- Your workflow: `bin/ci-check.sh` runs two more fast Node tests. Help Desk
  attempts in Lab Attempts now show a "Student evidence files" box with Open
  buttons; older Help Desk attempts show only the count, as before. Tests
  that need Storage can use the new stub in `tests/portal-vm.js`. Known
  limitation: files uploaded without a saved attempt aren't limited or
  cleaned up yet, and staff can't open them. This includes files left after
  a failed cleanup or a page closed mid-submit. Megan is tracking this for
  after launch.
- Fixes of yours in this PR: none.
- Please review: the migration's functions and policies, the two `app.js`
  changes, the `tests/portal-vm.js` stub, the `bin/ci-check.sh` lines, and
  the `portal/index.html` version lines.

**2026-10-14 (Megan; PR #62 "Help Desk: module pages show lab status from the
database (L-013)"; Help Desk files plus one
`bin/ci-check.sh` line and the `portal/index.html` version lines — please
review those):** Help Desk module pages
(Modules 1–11) now take every lab status, the "N of M submitted · P passed"
counter and the rail ticks from the database (your `requiredLabStatus()` on
`user.latestLabAttemptByKey`), never from browser storage. This fixes ISSUE-028
from Megan's Student Portal — Code Issues Log. Evidence labs (1.1, 2.1, 2.2) no
longer submit automatically when the last file is added: the student presses
"Submit Lab X.Y". Status tiles say "Added" instead of "Uploaded" until evidence
files are stored on the server. A walkthrough that comes back by the
`?coachComplete=` link (instead of the simulator's popup message) now saves
nothing and tells the student it wasn't recorded. Start now shows a message if
the browser blocks the popup (ISSUE-041 from Megan's Student Portal — Code
Issues Log).
- Files: `portal/it-support-shared.js`, `-shared.css`, `-module-01.js`,
  `-module-02.js` (Megan's); new `tests/hdesk-module-page-states.test.js` and
  updated `tests/hdesk-returned-lab-resubmit.test.js` (both under `tests/`,
  which CODEOWNERS gives you by default); `bin/ci-check.sh`: one added line,
  `node tests/hdesk-module-page-states.test.js`; portal/index.html: stylesheet
  and script version bump (shared file). No changes to `app.js`,
  `data.js`, `ui/`, `supabase/` or any SOC file.
- SOC / other programs: no behavior change. Only Help Desk pages call the
  changed code, and the SOC card snapshot test still passes.
- Your workflow: `bin/ci-check.sh` runs one more fast Node test (11 checks).
  Help Desk students who previously saw "complete" from browser storage alone,
  with no saved attempt, now correctly show "not submitted". They have to
  submit, which may add Help Desk attempts to the instructor Lab Attempts tab.
- Fixes of yours in this PR: none.
- Please review: the `bin/ci-check.sh` line and the two test files, and the
  portal/index.html version lines.

**2026-10-14 (Megan; PR #61 "Help Desk: returned labs can be resubmitted once,
with instructor notes (L-003, L-013)", merged Oct 14; Help Desk files plus one
`bin/ci-check.sh` line):** Returned Help Desk labs can now be resubmitted once
(ISSUE-029 from Megan's Student Portal — Code Issues Log). A returned lab shows
"Returned for revision" with the instructor's notes (Modules 1–12). Evidence
labs (1.1, 2.1, 2.2) get a "Resubmit Lab X.Y" button that works only after a
file is added or replaced. A walkthrough redo resubmits only the labs that were
returned, not approved or waiting ones. Repeat clicks save one attempt.
- Files: `portal/it-support-shared.js`, `-module-01.js`, `-module-02.js`,
  `-module-12.js` (Megan's); new `tests/hdesk-returned-lab-resubmit.test.js`
  (yours by default under CODEOWNERS); `bin/ci-check.sh`: one added section,
  `echo '== Help Desk returned-lab resubmit =='` plus
  `node tests/hdesk-returned-lab-resubmit.test.js`. No changes to `app.js`,
  `data.js`, `ui/`, `supabase/` or SOC files.
- SOC / other programs: no behavior change.
- Your workflow: resubmissions arrive as new attempts in the instructor Lab
  Attempts tab, read through your existing grading queue. The notes shown to
  students come from your existing `lab_attempt_feedback` rows (read only, no
  new writes). `bin/ci-check.sh` runs one more fast Node test.
- Fixes of yours in this PR: none.
- Please review: the `bin/ci-check.sh` lines and the test file, if not already
  done at merge.

**2026-10-12 (Megan; shared portal/app.js and portal/data.js — action needed
from Alex):** Module card states are rebuilt behind an opt-in program flag
`truthfulModuleStates` (portal/data.js), on for Help Desk only. For opted-in
programs, card state comes only from the database (course_module_labs,
lab_attempts, module_progress, the verified record), reflects every required
lab, shows per-lab status, and uses the labels Not Started, In Progress,
Practice Submitted, Submitted for Faculty Review, Passed, Returned for
Revision. Every other program's card is unchanged, pinned by a snapshot of
master's card HTML in `tests/module-card-state.test.js` (now run by
`bin/ci-check.sh`). The "opened" write now saves on any device for every
program. Randy approved this (Oct 12) on the condition that you validate the
shared logic. Please: (1) review PR #60 and the shared logic in
moduleCardState() / markModuleContentOpened(); (2) decide whether SOC opts in
(one line: `truthfulModuleStates: true` on the SOC program). Opting in would
fix two current SOC card issues: attempts recorded for labs that
course_module_labs doesn't require (today, as far as the code shows, only
from the synthetic-completion script) would show "Awaiting Approval" though
nobody reviews them, and states that can differ by device. Before deciding,
check the six SOC modules where data.js LABS lists a lab that
course_module_labs doesn't require (soc-01, 05, 06, 09, 10, 11; table in the
PR), and whether those labs are practice labs. Today's portal code has no
submit path for soc-06's lab-threat-hunt, but a code comment says it submits
and bin/synthesize-soc-m360-completion.js writes attempts for it. Alex,
please confirm which is intended.

**2026-09-23 (lab-wiring session, out-of-queue, not a `ROADMAP.md` item):**
if you are touching anything related to Mission Next / imported labs / the
Guided Lab / Assessment Lab wiring for Modules 2–11, read
`docs/handoffs/HANDOFF_2026-09-23_MISSION_NEXT_LAB_WIRING.md` FIRST. It supersedes every
other Mission Next/lab-migration doc in this repo. The previously reported
lab-launch crash and login-redirect-on-exit bug are fixed there; re-run the
imported-app smoke checks before student release.

# Next session — use the canonical roadmap

`ROADMAP.md` is the single active delivery queue. Read it first, select one
unblocked roadmap item, then read only that item's governing specification.
Do not use the historical notes below as an independent plan; some describe
superseded Module 1 directions.

**2026-10-03 (committed and deployed to `master`/Pages: 8393c88, 219f22a, and the
test/check follow-up after them):** Learn It cards use a shared horizontal carousel
across SOC Modules 01–12 (`docs/workstreams/LEARN_IT_CARDS_ROLLOUT.md`,
`LEARN_IT_DECKS_REVIEW.md`). Console Guide is now one course-wide standard: per-step
`target` highlighting, card placed beside the evidence, centered on Next/Minimize,
labelled Minimize/Show guide, last step wraps to step 1 (see
`docs/specs/MODULE_STANDARD.md` §7.3 and
`docs/workstreams/LAB_CLICK_RESPONSIVENESS_FINDINGS.md` → Implementation status).
Rail lock explains itself; program page has 01–12 module jump buttons (PR #42).
Real-browser checks: `bin/lab-click-sweep.js` and `bin/console-tab-sweep.js`
(see memory/README for the NODE_PATH Playwright invocation).

**2026-09-21:** `archive/historical-plans/HANDOFF_2026-09-21_EVIDENCE_LOG_SIFT_FINDINGS.md` scoped a
masked-input, read-the-real-log evidence mechanic for ALT-1001. **Superseded
later the same day** by `docs/specs/MODULE_01_CASE_CONSOLE_SPEC.md`'s simpler,
now-shipped mechanic: click a real log row, it expands a raw structured
record. That satisfies the same underlying ask (real evidence reading, not
instant-click review) without the masked-input form — don't build that form
on top of this; it would be redundant.

**2026-09-21, same day, superseded again:** roadmap item 1 (orientation
tour) was fixed for reachability, which surfaced that `1add6d6`'s move of
Prove It off the simulator looked like an unresolved discrepancy. It
wasn't — `docs/specs/MODULE_01_CASE_CONSOLE_SPEC.md` landed the same day and confirms
that pivot was correct: **Module 1 does not use the full SOC range at all,
for either Practice It or Prove It.** Read that spec first, then
`ROADMAP.md`'s "Locked Module 1 sequence" (corrected in place) and
`docs/handoffs/HANDOFF.md`'s "Module 1 case console — Practice It built" entry.

**Done, same day:** Prove It (`viewModuleOneProveItCaseConsole()`, NST-2407)
was ported to the same `?console=prove`-driven, new-tab case-console
pattern as Practice It, with its own `logEvents` (identity/endpoint/proxy
sources). Both consoles live-verified in Chrome.

**Naming correction, same day:** Module 1 calls the Practice It surface
**Guided Lab** and the Prove It surface **Assessment Lab** throughout the
learner rail, progress summary, card headers, and launch/resume actions. The
Assessment Lab LMS card is intentionally concise; the independent work is
completed in its separate case-console tab.

**Feedback and gating correction, same day:** Guided Lab gives immediate
coaching feedback after submission. Assessment Lab remains teacher-graded and
does not expose evaluative feedback or a score to the learner. Completing
Guided Lab now unlocks Assessment Lab immediately in the originating LMS tab.

**Assessment approval refresh, same day:** returning to a program/module
dashboard re-fetches the authoritative completion and redo state, so a faculty
approval clears a stale redo notice and turns the completion dot green. Open
redo records are available in the appropriate admin/faculty Grading tab for
reversal of an accidental return.

**Also done, same day, cross-course:** "Sources & Further Reading" got a
fully detached "Reference" nav panel (own card, real gap, never touching
the graded-phase menu) rolled out to every module across SOC Analyst,
IT Support, and AI-ML that has reference content — not just Module 1. See
`docs/handoffs/HANDOFF.md`'s "Sources & Further Reading — detached 'Reference' panel,
platform-wide" entry. IT Support had no references content at all before
this; real citations were written per module. Excluded: SOC 12 (capstone)
and the still-unauthored Electrical track.

Module 1 begins with the required LMS orientation tour, reachable from the
module's hero section and live-verified in Chrome. It is followed by
Practice It and Prove It, both worked in Module 1's own focused case console
(not the full SOC range) per `docs/specs/MODULE_01_CASE_CONSOLE_SPEC.md` — both built
and live-verified.

---

# Historical session notes — reference only

## Submit button moved to the floating corner dock, later same day (2026-09-18)

Owner feedback on the pass below: submission shouldn't be tied to one page —
"it should feel like an open range." Moved "Submit Module Lab" out of the
NST-2407 incident view's inline callout and into `ui/coach.js`'s existing
`mnt-corner-dock` (the same always-present bottom-left dock that already had
"🧭 Take the tour" and "← Coursework") as a third floating button, shown
whenever `?case=NST-2407` is in the URL regardless of which page of the
console you're on. Escalate stays inline (that's a real incident-specific
action); submit is module-level work, so it now follows you anywhere —
queue, assets, hunting, wherever. Updated the tour's last step and the
portal-side help copy to match. Live-verified the button persists across
unrelated routes (confirmed on Advanced hunting, nowhere near the incident
page). `node --check` clean; no console errors.

## Module 1 / NST-2407 polish pass, later same day (2026-09-18)

Continued directly on top of the nav-rail pass above, same session:

- **Branding**: "Northstar Finance" → "Mission Next Labs" and the fictional
  identity's domain `a.chen@northstar.example` → `a.chen@missionnextlabs.example`,
  scoped to the NST-2407 case only (`portal/soc-analyst-module-01.js`,
  `portal/data.js`, `ui/data.js`, `ui/app.js`). Also dropped the raw case ID
  from user-facing copy per owner direction ("publications are not
  necessary") — the button now reads "Open Mission Next SIEM", the lab
  heading reads "Mission Next Labs: investigate the correlated incident",
  `ui/views.js`'s banner no longer says "Open NST-2407." **Deliberately not
  touched:** Module 7's `northstar-suppliers.example` / lookalike-domain
  content (that's an intentional phishing/typosquat teaching device, unrelated
  company) and the IT Support track's much larger "Northstar Distribution
  Group" fixture set (`ui/helpdesk-data.js`, `ui/helpdesk.js`,
  `portal/it-support-module-12.js`) — separate program, out of scope, owner
  didn't ask for that one and it's a much bigger blast radius (AD OUs, DNS
  records, PowerShell branding threaded through many exercises).
- **Bug fix**: the simulator-submission panel's paragraph text was invisible
  (white-on-white) — `.m01-siem p { color: rgba(255,255,255,.82) }` (meant
  for text sitting directly on the dark card) was leaking into the nested
  white `.m01-score-empty` card via inheritance/specificity. Fixed in
  `portal/module-labs.css`. Also replaced the flat "Still required: A; B;
  C" sentence with a real checklist (`.m01-requirements-list`, all 8 items
  shown with done/pending state) and gave the submit button a real disabled
  style instead of staying vivid orange when nothing was done yet.
- **Submit from inside the simulator**: added a "Submit Module Lab" button
  directly in the NST-2407 incident view (`ui/views.js`, next to "Escalate
  to incident response"), wired through the existing
  `recordAssignedCaseAction` postMessage channel to a new
  `'submit_for_faculty'` action. Extracted the finalization logic (mark
  submitted, `recordLabAttempt`, `markModuleLabComplete`, sync completion)
  into a shared `moduleOneFinalizeSimulatorSubmission()` in
  `portal/soc-analyst-module-01.js` so both the simulator button and the
  portal-side fallback button call the same path. Portal button stays as a
  secondary/fallback, per-owner request the simulator button is now primary.
- **Orientation tour, reused not rebuilt**: discovered `coach.js` /
  `coach-data.js` already had exactly the "floating icon → click Next
  through spotlighted steps" mechanism this was about to be built from
  scratch (`ui/coach.js`'s `mnt-corner-dock`, bottom-left "🧭 Take the tour"
  button, already used by `m01-orientation`). Root cause it wasn't showing
  up on the NST-2407 flow: that launch link (`incidentRoute` in
  `soc-analyst-module-01.js`) never passed `?module=soc-1`, so
  `courseworkModuleNumber()` couldn't resolve which module's tour to offer
  (Module 12 already passes this param on its own launch link — Module 1's
  NST-2407 link was the one missing it). Fixed the link, then extended
  `m01-orientation` (`ui/coach-data.js`) from 5 steps to 12: three new
  framing-only steps first (Your first day / Rules of engagement / Your
  assigned scope — real Day-1-supervisor content, matches the "labs as
  supervised procedure" framing below), then the existing 5 Lab-1
  tool-tour steps unchanged, then 4 new steps covering Lab 2's NST-2407
  incident view (queue → assigned-case banner → Escalate button → Submit
  Module Lab button, using the new `#m01-assigned-case-callout` /
  `#m01-escalate-btn` / `#m01-submit-lab-btn` ids added to `ui/views.js`).
  Live-verified all 12 steps end to end, including the finish flow closing
  the simulator tab and returning focus to the portal tab. No console
  errors. One real side effect confirmed live: stepping through the tour's
  "This one is yours" step genuinely ticked the portal's "Open the assigned
  incident" requirement checkbox — the tour exercises real telemetry, not a
  disconnected demo.
- `node --check` clean on every touched `.js` file. Not yet committed —
  adds to the same already-large uncommitted working tree described below.

## Design framing to keep in mind — labs as supervised on-the-job procedure (2026-09-18)

Owner framing, worth preserving for anyone touching lab/assessment design:
**each hands-on lab is a procedure the L1 analyst follows based on what their
supervisor (the module's briefing/case framing) tells them to do, and the
graded portion is that analyst's performance "on the job"** — not a separate
worksheet, quiz, or self-report about the work. This is exactly the same
principle behind the 2026-09-17 "work performed in the simulated SIEM is the
assignment" decision above; it's the general rule that decision is one
instance of. When designing or reviewing any module's lab, ask "would a real
supervisor accept this as evidence the analyst did the job," not "did the
student fill out the form correctly."

## Nav rail consistency pass, same day (2026-09-18)

Standardized the module nav rail across all 12 SOC Analyst modules per live
owner feedback while looking at Module 1:

- Renamed every module's hands-on-lab nav section to **"Module Lab"**
  (singular), replacing whatever it said before: M01 "Guided Labs", M02/M03
  "Guided Lab", M04 "Detection Lab", M05 "Endpoint Lab", M06 "Threat Hunt
  Labs", M07 "Investigation Lab", M08 "Prioritization Labs", M10 "Evidence &
  Incident Labs", M11 "Operations & Reporting Labs". M09 previously listed
  its guided lab and independent drill as two separate top-level nav rows
  ("Guided ransomware response" / "Independent response drill") even though
  they render inside one page section — merged into one "Module Lab" row,
  gated on both sub-states completing, matching the pattern already used by
  M06/M08/M10/M11 (multiple internal completion flags, one visible row).
  M12 (capstone) left alone — its Mission Requirements / Investigation
  Consoles / Assessment rows are phases of one integrated capstone, not
  parallel labs, and it was already the outlier that's *right*.
- Module 1 was the only module with Knowledge Check placed *after* the lab
  in both the nav order and the rendered page order. Every other module
  (M02-M11) already orders Lecture/Foundations → Knowledge Check → Lab →
  Review. Reordered M01 to match: Foundations → Knowledge Check → Module Lab
  → Module Review → Sources & Further Reading. Did **not** touch
  `moduleOneProgress()`'s completion formula or `moduleOneSyncCompletion()` —
  those still require knowledge-check-passed AND both lab flags before
  self-certifying complete to the backend, same as before. Changing that
  crediting logic is a bigger, riskier change than a reorder and wasn't part
  of what was asked; flagging it here in case a future session wants to
  revisit whether Module 1 should stop self-certifying client-side the way
  modules 2-11 don't.
- Module 1's hero stat block showed a raw "Labs complete 0/2" fraction that
  read as broken/inconsistent (every other module's hero shows a single
  Complete/In progress/Not started status, never a lab count). Replaced it
  with the same single-status format. Did not touch M07/M08/M10's hero
  blocks, which have their own different-but-also-fractional lab-count
  phrasing ("Labs: N", "Practical labs X/Y passed", "Independent labs Y /
  Completed X/Y") — those weren't what was on screen when this was flagged,
  and rewriting bespoke hero copy across those files is a separate,
  larger pass if the owner wants full consistency there too.
- Also moved Module 1's "How activity becomes analyst work" /
  "Incident response lifecycle" / "Your five-step triage loop" widgets from
  three standalone nav sections into inline companion reading inside
  Foundations, positioned right after the lesson each one illustrates
  (L5, L6, L8 respectively) — they were previously separate top-level
  sections despite being pure supplementary reading with no completion
  state of their own.
- `node --check` clean on all 11 touched module files; live-verified via
  browser on `9334491415-SOCAN` (Module 1, freshly-enrolled/untouched) and
  `4437023872-SOCAN` (100%-complete, capstone-ready — used to view modules
  02/09/10 fully unlocked). No console errors.
- **Heads up, unrelated to this pass:** while verifying Module 1 still
  rendered correctly, noticed `moduleOneLab2Score()` / `moduleOneLab2ScorePanel()`
  and a submit handler referencing `lab2Data.handoffFields` /
  `handoffMissing` (around the old `#m01-lab2-form` submit path) are still
  defined in `portal/soc-analyst-module-01.js`, but the `<form
  id="m01-lab2-form">` markup they operated on was removed as part of the
  NST-2407 simulator rework described above — looks like orphaned dead code
  from that same uncommitted change, not something this session touched or
  fixed. Worth a look during the "review the local diff before shipping"
  pass already planned above.

## Current owner direction — SIEM performance assessment (2026-09-17)

The owner has made a firm design decision for the six-week SOC internship
experience: **work performed in the simulated SIEM is the assignment.** Do not
reintroduce a parallel LMS worksheet, duplicate alert queue, copied timeline,
or mandatory handoff-note card as the assessed artifact.

This session removed Module 1's entire “Independent decision record / Work the
case across three handoffs” card and added the NST-2407 fixture to the simulator
as a four-alert Sentinel incident (identity, endpoint, proxy, and user callback).
Module 1 now launches `NST-2407` directly in the simulator. Changed files:

- `portal/soc-analyst-module-01.js` — removed the duplicate Lab 2 card;
- `ui/data.js` and `ui/views.js` — added and identified the assigned
  simulator case;
- `portal/data.js` — reframed Lab 2 as simulator-first;
- `archive/module-enhancement-records/MODULE_01_ENHANCEMENT_BRIEF.md` and `docs/specs/ASSESSMENT_REPORTING_SPEC.md` —
  contain the approved assessment and faculty-review model.

**Implementation now in the working tree (2026-09-18, not yet committed):**
NST-2407 now reports allow-listed incident, alert, identity/device-pivot, and
escalation actions back to its portal opener. “Complete Module” submits that
simulator-performance record to the existing grading queue as **pending faculty
review**. The faculty card shows overall/per-competency pass percentages,
completed/missed/unsafe actions, and editable generated recommendations; its
actions read **Return for remediation** and **Approve submission**. New
`20260918100000_module_one_faculty_performance_gate.sql` makes Module 1
ineligible for verified completion until its submitted attempts are faculty
approved (reviewer and timestamp present, no redo), so Module 2 remains locked.

Before shipping: review the local diff, apply that migration to the linked
Supabase project, then run a live student-to-faculty approval/remediation pass.
The migration was deliberately written but not deployed in this session.

## New workstream queued for a fresh session (owner: run via Codex)

`docs/workstreams/module-completion-integrity/BRIEF.md` — spec only, NOT STARTED. Modules
2-12 trust the coarse `module_progress.state === 'complete'` flag directly
in `moduleCompletion()`; only Module 1 requires the stricter per-field
detail-beacon corroboration it was given 2026-09-16. Same class of bug,
not yet generalized. Confirmed safe to do freely right now: no real
students enrolled yet, this environment is pre-launch staging despite
being deployed to the production GitHub Pages repo — re-confirm that's
still true before shipping if picked up much later. Read that file's
"Reference implementation" section before writing any code; it points at
the exact working Module 1 pattern to replicate.

## Just shipped, same day (2026-09-16), later session

Sprint 3 and a new Sprint 4 from `archive/completed-feature-notes/MODULE_NAV_SIDEBAR_SPRINT.md`, committed
as `7c59e22` — **committed but NOT pushed**, push auto-deploys to the live
GitHub Pages site and needs explicit confirmation first:

- Sprint 3: removed the now-redundant per-module hero CTAs (modules 01-04,
  08, 09 — the other 5 SOC modules never had one, module 12's is a
  different, functional simulator-launch button and was left alone) now
  that the quick-nav rail covers the same "jump to current position" job.
  Also removed the shared `.mnav-continue` "Continue to X" chip-bar link
  from `moduleProgressShell()` — the original spec said keep it, but live
  owner testing of Module 01 this session asked for it to go too, now that
  the rail replaces it across all 12 modules.
- Sprint 4 (new, from the same live owner-testing pass): Module 01's
  "Module progress checklist" section (duration/status per item, a
  running total) is now collapsible, closed by default, using the same
  toggle pattern as the module's other sections — it was always fully
  expanded and duplicated what the rail already shows. Checked: no other
  SOC module has this section, so this was Module-01-only.
- `node --check` on every touched file, `node bin/portal-check.js` (38/38
  clean), and live DOM verification via `javascript_tool` on Module 01 as
  `4437023872-SOCAN` (screenshot capture was intermittently timing out
  this session — verified via direct DOM state checks instead, plus one
  clean screenshot once the flakiness cleared).
- One open judgment call, not yet resolved: the owner's live phrasing was
  "nest it into an outer menu that says Foundations" — the checklist kept
  its own "Module progress checklist" heading (accurate, since it lists
  the 2 labs too, not just lessons) rather than being renamed/merged into
  the "Foundations" section. Confirm with the owner whether that reading
  was right, or whether they wanted it literally folded into/relabeled as
  Foundations.
- **Push confirmation still needed** before this reaches the live site,
  and a live visual re-check of Module 01 (rail, collapsed checklist,
  hero) plus a spot check of one other edited module (e.g. 08) once
  screenshot capture is reliably working again.

## Just shipped, same day (2026-09-16)

A separate session (browser-available) did a module UX pass, all pushed to
`master`:

- `c8c2c78` — a locked/not-yet-unlocked module's own "evidence recall"
  fill-in-the-blank widget was rendering on top of its lock screen,
  leaking real incident details for content the student hadn't unlocked.
  Fixed: gated behind the same `hasModuleAccess()` check as the module body.
- `941d3f8` / `archive/completed-feature-notes/MODULE_NAV_SIDEBAR_SPRINT.md` (now DONE, Sprints 1-2) —
  owner feedback: module duration read as lecture length ("8 Hours"), and
  there was too much scrolling to reach current progress. Shipped across
  all 12 SOC modules: `formatHandsOnDuration()` reframes the hero-kicker/
  program-card duration as hands-on time; `moduleQuickNavRail()` adds a
  persistent sticky left rail (desktop) / slide-out drawer (≤920px) listing
  every lesson and lab with click-to-jump and current-position highlight.
  **Sprint 3 (remove the now-redundant `.mXX-hero-action` "Begin with the
  foundations" buttons) is the one piece left** — see that doc's Sprint 3
  section for exactly what to remove and why it's safe now that the rail
  covers the same "resume" affordance.
- `a100be4` — fixed the `.mnav-chips` pill-overflow bug a concurrent
  session had in progress, and a real regression it exposed: a same-day
  "always show the loading takeover immediately" change to
  `beginRouteLoading()` broke the pre-existing in-page-anchor guard in
  `render()`, so clicking "Continue to Foundations" (or any mnav-chip
  target, or a lesson anchor) stranded the student on the branded loading
  spinner forever instead of scrolling to the section. Fixed by making
  `beginRouteLoading()` recognize the same in-page-anchor condition and
  skip the takeover for it.

**Two things flagged, not fixed — need an owner decision, not more code:**

1. Training account `8987495051-SOCAN` (previously the one fully-backfilled
   Module 1 beacon account) is now showing **Disenrolled, since
   2026-09-16** in the admin Enrollment Planning table. Not from the
   cohort-archival cron (`Archived Students` list is empty — no snapshot
   was created), so it looks like a manual toggle flip, plausibly from a
   concurrent session. Confirm whether that was intentional before
   re-enrolling it.
2. Live-testing modules beyond Module 1 is still blocked on every other
   SOC training account (`4437023872`, `9334491415`, `5520852787`) by the
   pre-existing Module 1 completion-beacon gap (see
   `docs/workstreams/lab-grading-notification-system/STATE.md`'s last section for the exact
   backfill values) — this is the same permission-blocked admin batch
   write flagged before, not new. Until it's resolved, a full live
   walkthrough of the new rail on modules 2-12, and the still-outstanding
   Module 09 ticket-panel / Module 06 hunt-framing live sanity check below,
   can only be done on Module 1.

## Active workstream: SOC Analyst track reimagining

Read `docs/workstreams/soc-analyst-track-reimagining/STATE.md`, then `REBUILD_PLAN.md`.

The next implementation candidate is **Arc A (Modules 02 → 03)**. It needs
content reconciliation—not just linking copy—so the identity and
lateral-movement evidence agrees across both modules. Use an owner
content-review checkpoint before shipping it.

**Arc B is not ready:** the previously proposed Modules 07 + 04 pairing was
rejected as too forced. Agree a different pairing with the owner before
planning or coding that arc.

## Verification to schedule when a browser is available AND account access is unblocked

- Live-sanity-check the Module 09 ticket-assignment panel and Module 06
  Module-05-to-06 hunt framing — still not done; every account that could
  reach them is either beacon-gapped (see above) or disenrolled.
- Live-check the new quick-nav rail (Sprint 2 above) on a module past 01
  once an account can reach one, plus the mobile slide-out drawer at a
  real narrow viewport (this session's `resize_window` calls didn't
  actually resize the underlying browser window in this environment).
- If reporting work resumes, run the authenticated PDF edge-case matrix;
  server-side reporting migration/storage remains a deployment concern.

## What is not an active task

The grading/notification system is complete. The full chronological handoff,
including completed September sessions and prior open-item context, is at
`archive/session-logs/NEXT_SESSION_THROUGH_2026-09-16.md`.
