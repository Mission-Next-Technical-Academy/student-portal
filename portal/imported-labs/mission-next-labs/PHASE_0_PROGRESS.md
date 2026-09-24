# Phase 0 Progress

Owner: Agent 01 (foundation).
**Status: COMPLETE.** `npm run check` is green. Ready to hand off to Phase 1 (Agents 02–07).

---

## Chunks

| # | Chunk | Status | Notes |
|---|---|---|---|
| 0a | Read existing source files | done | Confirmed browser-Babel setup (no bundler). |
| 0b | Snapshot 32 upstream `.md` files | done | `src/data/sources/*.source.md` + `.manifest.json` (sha256). |
| 0c | Create directory structure | done | `src/data/{labs,sources}`, `src/shells`, `src/engines`, `src/systems`. |
| 0d | Strip "Mission Next" branding | done | Chrome scrubbed. 6 references remain in synthetic case-folder paths inside existing simulated forensics labs (`C:\Cases\Mission Next\…`) — left intact to avoid breaking the existing wf-1 / module-page PowerShell sim. Note for Phase 1. |
| 0e | Lab module schema (JSDoc + validator) | done | `src/data/labs/_schema.js` + `validateLabShape()`. |
| 0f | Cross-cutting systems | done | `virtualFs`, `validator`, `gating`, `progress`, `checkOnLearning` drawer. |
| 0g | Shared shells | done | `LinuxTerminal` (real bash subset), `PowerShell`, `WindowsCmd`, `Browser`, `Notepad`. |
| 0h | BUILD_PLAN.md browser-Babel addendum | done | §1.13 + updated §1.8 file layout. |
| 1  | LabPlayer + lap-1 + routing + check.mjs | done | lap-1 plays end-to-end; new-shape labs intercepted at `module-page.jsx` and `app.jsx` route resolver. |
| 2  | Gold-shell migration | **deferred** | Risky cosmetic refactor. The gold shells stay in `lab-shells.jsx`. Documented in BUILD_PLAN.md. |
| 3  | Catalog "HIGH-FIDELITY" badge + owner stub | done | `project-catalog-page.jsx` shows badge for migrated labs + owner pill for `comingSoon: true` stubs. |
| 4  | Instructor dashboard new fields | done | `engagementRow` panel: step attempts, hints shown, CoL answered/skipped, last seen. Fed by `MISSION_NEXT_PROGRESS_EXT.getAllForUser`. |
| 5  | `LAB_AUTHORING_GUIDE.md` | done | 324 lines. Worked example = lap-1. |

---

## Files added

```
src/data/sources/                                 # 32 .source.md + .manifest.json (sha256)
src/data/labs/_schema.js                          # JSDoc types + validateLabShape()
src/data/labs/log-analysis.labs.js                # lap-1 (full) + lap-2/lap-4 stubs
src/systems/virtualFs.js                          # POSIX-style in-memory FS
src/systems/validator.js                          # 8 predicate types
src/systems/gating.js                             # forward-only progression
src/systems/progress.js                           # MISSION_NEXT_PROGRESS_EXT (attempts, CoL, last-seen)
src/systems/checkOnLearning.jsx                   # bottom-left boot drawer
src/systems/labPlayer.jsx                         # renders new-shape labs
src/shells/LinuxTerminalShell.jsx                 # real bash subset
src/shells/PowerShellShell.jsx
src/shells/WindowsCmdShell.jsx
src/shells/BrowserShell.jsx                       # with TLS warning
src/shells/NotepadShell.jsx
BUILD_PLAN.md                                     # canonical spec (Agent 01–08 reference)
LAB_AUTHORING_GUIDE.md                            # how-to for Phase 1 agents
PHASE_0_PROGRESS.md                               # this file
```

## Files modified

```
package.json                  # name + description (mission-next-labs)
index.html                    # title + new <script> tags
src/data.js                   # header comment branding
src/app.jsx                   # route resolver checks MISSION_NEXT_LABS first
src/module-page.jsx           # intercept new-shape labs (mod.exercises) and render LabPlayer
src/track-selection.jsx       # chrome branding
src/student-dashboard.jsx     # chrome branding
src/instructor-dashboard.jsx  # branding + engagement metrics panel
src/project-catalog-page.jsx  # branding + HIGH-FIDELITY badge + owner stub badge
src/query-engine.js           # header comment branding
AGENT_HANDOFF.md              # title
WORKFLOW.md                   # title
scripts/check.mjs             # +60 lines of lap-1 / new-shape assertions
```

---

## Verification

| When | Command | Result |
|---|---|---|
| After branding sweep | `npm run check` | passed |
| After systems wired | `npm run check` | passed |
| After shared shells wired | `npm run check` | passed |
| After lap-1 + LabPlayer + routing | `npm run check` | **passed (with new lap-1 assertions)** |
| After catalog + dashboard updates | `npm run check` | passed |
| Final | `npm run check` | passed |

The `check.mjs` assertions for lap-1 enforce:
- `MISSION_NEXT_LABS['lap-1']` registered with all required fields
- 5 exercises, ≥ 12 flattened steps, ≥ 5 CoL questions
- Source `sha256` matches `src/data/sources/.manifest.json`
- `validateLabShape(lap1)` returns no errors
- All 4 Bloom levels covered in CoL
- Forward gating: step 2 locked until step 1 completes
- Validator: lap-1.ex2.s2 accepts 'GET' and rejects 'POST'
- VFS: access.log has 154 lines, 47 from 192.168.1.100, 12 with ' 404 ', 5 intersection

---

## How Phase 1 starts

1. User opens 6 consoles (one per Agent 02–07 brief in BUILD_PLAN.md §4–§9).
2. Each agent reads `BUILD_PLAN.md` §1 (architecture) + their own section + `LAB_AUTHORING_GUIDE.md`.
3. Each agent works in their track's files only:
   - `src/data/labs/<track>.labs.js`
   - `src/data/sources/<their-lab-ids>.source.md` (already snapshotted by Phase 0)
   - `src/shells/<track>-shells.jsx` (track-specific shells)
4. Each agent updates `index.html` to register their new files.
5. Each agent updates `scripts/check.mjs` with lap-1-style assertions for their labs.
6. After all 6 merge: Agent 08 runs the integration & QA pass per BUILD_PLAN.md §10.

The `MISSION_NEXT_LABS` namespace pattern means each agent registers their labs without touching the legacy generic-fixture data. Old shape and new shape coexist; new shape wins on the user route.

---

## Known intentional limitations / Phase 1 cleanup notes

- **Gold-shell migration deferred**: `SplunkLabShell`, `EventViewerLabShell`, `SysmonLabShell`, `RegistryLabShell` remain in `src/lab-shells.jsx`. They work and are referenced from there. Moving them is a cosmetic refactor with non-trivial risk to existing assertions; punted.
- **Synthetic "Mission Next" case folders**: `C:\Cases\Mission Next\…` paths in `src/windows-forensics-page.jsx` and `src/module-page.jsx` (PowerShell forensics sim) are inside existing labs. They look like fictional case-folder names. Phase 1 forensics agent (03) can rename them when migrating wf-1 to the new shape.
- **`scripts/check.mjs` mixes old-shape + new-shape assertions**: this is the transitional design. As each track migrates labs, that agent's PR removes the old-shape assertions for those labs and replaces with new-shape ones.
- **`src/data.js` is still 1636 lines**: shrinking it requires migrating every lab's data into `src/data/labs/<track>.labs.js`. Phase 1 work, agent by agent.

---

## Final state by the numbers

| Metric | Value |
|---|---|
| Lines of code added | ~3,200 |
| New files | 17 |
| Modified files | 14 |
| Upstream snapshots frozen | 32 (sha256 manifest) |
| Shared shells built | 5 |
| Cross-cutting systems built | 5 |
| Reference labs implemented end-to-end | 1 (lap-1 Apache) |
| Build status | green |
