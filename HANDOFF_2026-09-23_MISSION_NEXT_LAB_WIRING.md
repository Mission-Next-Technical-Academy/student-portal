# Mission Next Lab Wiring — session handoff (2026-09-23)

**Read this first if resuming the Boots2Bytes/Mission Next lab-wiring work.
This doc supersedes every other Boots2Bytes/lab-migration handoff in this
repo as of 2026-09-23** — specifically:
`HANDOFF_2026-09-23_BOOTS2BYTES_MIGRATION_DISCOVERY.md`,
`docs/BOOTS2BYTES_LAB_INVENTORY.md`,
`docs/BOOTS2BYTES_MIGRATION_AGILE_HANDOFF.md`,
`docs/LAB_MIGRATION_MATRIX.md`, `docs/MISSION_NEXT_LAB_ARCHITECTURE.md`, and
`docs/MODULE_03_MISSION_NEXT_LAB_RETURN_AND_COMPLETION.md`. All of those
describe plans, gates, or partial states that predate the owner's explicit
mid-session go-ahead to wire directly per a separate spec pasted into chat,
skipping the Epic C/D authorization gate the discovery doc set up. Treat
them as historical background only, never as the current state or the
current plan — **this file is the current state.** (`NEXT_SESSION.md` /
`ROADMAP.md` govern unrelated, non-lab-migration work and are not
superseded by this doc.)

## What shipped this session

Modules 2, 4, 5, 6, 7, 8, 9 (Guided Lab only), 10, 11 were each restructured
so their Guided Lab (Practice It) / Assessment Lab (Prove It) cards launch
real imported lab projects instead of bespoke in-house exercises, per a
pasted migration spec. Module 3 was done directly in this session and used
as the reference pattern; the rest were delegated to parallel subagents
using that pattern. **Module 1 and Module 12 were explicitly left
unchanged** (per spec: no strong replacement needed for M1, capstone stays
Mission Next's own integrated assessment for M12). Module 9's Assessment Lab
(incident-response case) was also explicitly left unchanged — only its
Guided Lab was rewired (ransomware sample, `ma-3`) — because no good
full-incident-response replacement exists in the imported catalog.

Each rewired module keeps: lecture, knowledge-check quiz, module review,
sources, `markModuleContentOpened`, `registerModuleLab` registration, and
its existing save/load + instructor-review plumbing (`recordLabAttempt`,
`markModuleLabComplete`). The old bespoke practice/assessment exercise code
(hundreds of lines per module — custom query workbenches, scoring rubrics,
findings engines, tabbed dual-labs) was deleted; each subagent grepped for
dead references before deleting. Net effect across the 9 files: roughly
2,900 lines of bespoke lab code removed in favor of shared launch-button +
write-up panels.

**Full lab-ID mapping actually wired** (track / project-id, or splunk
module-id):

| Module | Guided Lab | Assessment Lab |
|---|---|---|
| 2 | sa-1, sa-5 (security-assessments) | ad-2 (active-directory) |
| 3 | lap-1, lap-2 (log-analysis) | lap-4 (log-analysis) |
| 4 | ad-4 (active-directory) | ad-6 (active-directory) |
| 5 | ma-1, ma-2 (malware-analysis) | lap-5 (log-analysis) |
| 6 | splunk/mod-1 (DNS) | splunk/mod-4 (SSH) |
| 7 | splunk/mod-6 (SMTP), splunk/mod-2 (FTP) | splunk/mod-5 (Tunnel/GRE) |
| 8 | vm-2, vm-3 (vulnerability-management) | vm-5 (vulnerability-management) |
| 9 | ma-3 (malware-analysis) | **unchanged** (native incident-response case) |
| 10 | wf-2, wf-3 (windows-forensics) | wf-5 (windows-forensics) |
| 11 | ad-1 (active-directory) | ad-7 (active-directory) |

## Boots2Bytes → Mission Next de-branding (in progress, coordinate with Codex)

The owner is running a **separate, concurrent Codex session** renaming
Boots2Bytes naming conventions in this same repo. Do not assume you're the
only writer of `portal/imported-labs/`, `portal/app.js`, or
`portal/index.html` — check `git status`/`git log` before editing them.

State as of this handoff:
- `portal/imported-labs/mission-next-labs` is a **symlink** to the
  `boots2bytes/` directory (Codex's doing, not a real move). All this
  session's launch hrefs point at `imported-labs/mission-next-labs/...`,
  not the literal `boots2bytes` path, so the URL bar never shows
  "boots2bytes" — but the underlying files are still physically in
  `portal/imported-labs/boots2bytes/`.
- Visible "BOOTS2BYTES" logo text was changed to "MISSION NEXT" in
  `src/track-selection.jsx`, `src/project-catalog-page.jsx`,
  `src/instructor-dashboard.jsx` (all inside the imported app). Grepped the
  whole `src/` tree afterward — no other visible Boots2Bytes string
  remained (`<title>` was already "Mission Next | SOC Analyst Labs").
- Every rewired module JS file's launch links and doc-comments were updated
  from `imported-labs/boots2bytes/...` to `imported-labs/mission-next-labs/...`.
- Every launch link now carries a `returnTo` query param
  (`encodeURIComponent('/#/program/soc-analyst/module/{N}')`) so the
  imported app's own in-lab "‹ BACK" button (`handleBackFromLab` in
  `src/app.jsx`) returns the student to their Mission Next module instead of
  the imported app's own track/dashboard catalog. Module 3 established this
  convention (done by Codex or a prior pass, matched exactly for 2/4–11).

## Two real bugs found live, NOT yet fixed — next session should start here

1. **Some project-lab routes crash on launch.** Reported live by the owner:
   opening `#/track/active-directory/project/ad-2/lab` (Module 2's
   Assessment Lab) throws a React error-boundary crash: "ROUTE ERROR — This
   lab view hit a recoverable error. can't access property 'fields', mod is
   undefined." The only unguarded `mod.fields` access in the whole app is in
   `SplunkLabShell` (`src/lab-shells.jsx` ~line 463), which is supposed to
   receive a fully-defaulted `safeMod` (never undefined) from
   `module-page.jsx`. Static reading says this *shouldn't* be reachable for
   `ad-2`: `attachProjectLabs`/`buildProjectLab` in `src/data.js` generates a
   generic `fields: PROJECT_LAB_FIELDS` for every project entry except
   `lap-3`/`lap-5`/`wf-2` (which get custom builders), and
   `getEnterpriseLabType` routes any `lab-ad-*` id to the dedicated
   `ActiveDirectoryLabShell` (a hand-built Windows-desktop AD console),
   which never touches `mod.fields` — so `SplunkLabShell` should never be
   selected for `ad-2` at all. Root cause is **not confirmed** — needs a
   live browser devtools repro (actual thrown stack trace with real line
   numbers, since this is Babel-transpiled JSX with no build step) rather
   than more static reading. Suspect areas to check first: whether
   `window.LabShells`/`window.B2B_LABS` are actually populated at the point
   `getEnterpriseLabShell` runs (both are referenced via `window.X` global
   lookups with no visible assignment found via grep — if the assignment
   happens in a script tag order issue, `shells.ActiveDirectoryLabShell`
   could resolve to something unexpected instead of `undefined` cleanly).
   **This may affect other generic catalog-style project labs too** (any
   `sa-*`, `vm-*`, `wf-*` id not custom-built) — worth a systematic check of
   every wired lab ID before trusting the mapping table above is fully
   launchable.
2. **Exiting the imported lab back to Mission Next lands on `#/login`
   instead of the intended module — reported for more than one exit path.**
   First reported: the `returnTo`-driven "‹ BACK" button
   (`window.location.href = '/#/program/soc-analyst/module/N'`) ends up at
   `http://localhost:8768/#/login` instead of the module. **Then reported
   again**, separately, for at least one other lab exit button (owner's own
   words: "some lab exit buttons redirect to login as well... another
   issue here") — meaning this is not isolated to the one `returnTo` code
   path and is more likely a Mission Next-side problem: any full page
   reload/deep link back into `portal/index.html` with a non-empty hash
   appears to fall through to login instead of restoring session + hash.
   This is a full page reload (different document than the imported app's
   SPA navigation), so Mission Next's own `portal/app.js` boot sequence
   runs fresh each time — likely it isn't restoring a session or the
   requested hash correctly on cold load, and defaults unauthenticated or
   unrecognized deep-links to login, dropping the hash in the process.
   Needs investigation in `portal/app.js`'s boot/session-restore path (the
   `wireLogin()` area and whatever reads `location.hash` on first paint) —
   this is exactly the kind of pre-login-redirect gap
   `STUDENT_LOGIN_COURSEWORK_REDIRECT.md` already flags as unresolved, so
   read that file too. **Next session should enumerate every exit/back
   button inside the imported app** (not just `handleBackFromLab`'s
   `returnTo`, also plain `handleBackToTracks`/`handleBackToDashboard` and
   any explicit "log out"/"exit" affordance) and check whether each one is
   hitting this same Mission Next-side gap, rather than assuming only the
   one path reported first is affected.

## Also fixed in passing

- `bin/curriculum-check.js`'s `EXPECTED_RUNTIME_IDS` still expected
  `soc-analyst-module-08.js` to contain both `'m08-exposure-prioritization-v1'`
  and `'m08-vulnerability-queue-v1'` as literal strings; Module 8's two
  labs are now one consolidated state tree under the first ID only, so the
  second expectation was removed. **Note:** `bin/curriculum-check.js` still
  crashes on an unrelated, pre-existing bug (`allocationsCell`:
  `record.parentAllocations` undefined for some `LABS` entry in
  `portal/data.js`) — confirmed via `git stash` that this crash exists on
  `master`/before this session's changes too. Not fixed; not caused by this
  work.
- Deleted ~34 stale remote branches on `origin` (GitHub) at the owner's
  request, leaving only `master` and the working branch,
  `lab-migration-20260923-133658` (not yet pushed as of this handoff).

## Verified clean (Mission Next portal side only — NOT the imported app)

- `node --check` on every portal/ui JS file.
- `node bin/portal-check.js` — 129/129 module×program renders clean, 0
  errors, across all 4 programs (soc-analyst, its, aim, eee).
- `node bin/render_all.js` — 129/129 views render clean, 0 dead nav routes.
- `git diff --check` — no whitespace errors.

**Not verified**: the imported lab app itself was never exercised through
an actual build/runtime check by this session beyond static grep reading —
see bug #1 above. Before calling this migration done, someone needs to
click through every lab ID in the mapping table in a real browser.

## Files touched this session

`portal/soc-analyst-module-{02-environment,03,04,05,06,07,08,09,10,11}.js`,
`bin/curriculum-check.js`, plus (inside the imported app, coordinate with
Codex) `portal/imported-labs/boots2bytes/src/{track-selection,
project-catalog-page,instructor-dashboard}.jsx`. `portal/app.js` and
`portal/index.html` show as modified in `git status` but were **not**
touched by this session — that's Codex's concurrent work.
