# Mission Next Training Catalog Workflow

This file exists so future Codex sessions can continue the app without relying on chat context.

## Current Direction

The app is becoming a catalog of analyst training modules. The homepage and training path selector must be driven by `TRAINING_CATALOG` in `src/data.js`, not by hardcoded visual lists.

The current app has:

- A local Splunk/SIEM-style interactive track.
- A Windows Forensics track with a Windows-workstation UI.
- Generic external project catalog pages for beginner project repositories.
- Malware Analysis listed as simulation-only. Do not introduce real malware samples.

## Current Source Repositories

| Track ID | Source | Project Count | UI Treatment |
|---|---|---:|---|
| `splunk` | Local app modules | 7 | Interactive SIEM query lab |
| `log-analysis` | https://github.com/0xrajneesh/Log-Analysis-Projects-for-Beginners | 5 | Generic project catalog |
| `windows-forensics` | https://github.com/0xrajneesh/Windows-Forensics-Projects-for-Beginners | 5 | Windows workstation UI |
| `active-directory` | https://github.com/0xrajneesh/Active-Directory-Monitoring-Projects | 7 | Generic project catalog |
| `security-assessments` | https://github.com/0xrajneesh/Security-Assessments-projects-for-Beginners | 5 | Generic project catalog |
| `vulnerability-management` | https://github.com/0xrajneesh/Vulnerability-Management-Projects-for-Beginners | 5 | Generic project catalog |
| `malware-analysis` | https://github.com/0xrajneesh/Malware-Analysis-Projects-for-Beginners | 5 | Simulation-only catalog |

## How To Add Another Repo

1. Browse the GitHub repo and capture the project titles and file URLs.
2. Add a `const SOME_PROJECTS = [...]` array in `src/data.js`.
3. Add one entry to `TRAINING_CATALOG`.
4. Export the new project array through `Object.assign(window, ...)`.
5. Update `scripts/check.mjs` with the expected count.
6. Run `npm run check`.
7. Commit with a scoped message.

## Homepage Rule

The login/homepage side module list must use:

```js
TRAINING_CATALOG.map(...)
```

Do not reintroduce a hardcoded list like DNS/FTP/HTTP there. Individual module lists belong inside their track pages.

## URL Routing Rule

The app uses hash routes so navigation is visible while still working with the static Python server:

```text
http://127.0.0.1:5173/#/tracks
http://127.0.0.1:5173/#/instructor
http://127.0.0.1:5173/#/track/splunk
http://127.0.0.1:5173/#/track/splunk/module/mod-1
http://127.0.0.1:5173/#/track/windows-forensics
http://127.0.0.1:5173/#/track/windows-forensics/project/wf-1
http://127.0.0.1:5173/#/track/windows-forensics/project/wf-1/lab
```

Do not switch to clean path routing like `/track/windows-forensics` unless the dev server is also changed to serve `index.html` as a fallback for unknown paths.

Instructor login should route to `#/instructor`, not to `#/tracks`. Instructor accounts are for cohort progress tracking and reset controls.

The instructor dashboard should stay compact: one student bar for students 1-10, then section-level bars for the selected student. Do not reintroduce a large table or card grid for every student.

## Windows Forensics Simulation Rule

The Windows Forensics track should feel like an analyst workstation. Keep its UI scoped to `src/windows-forensics-page.jsx`.

Each Windows project should include simulated tool output:

- Event logs: Event Viewer and PowerShell.
- Registry evidence: Registry Explorer and Autoruns.
- File-system artifacts: Timeline Explorer and MFT Viewer.
- Browser artifacts: Browser History Viewer and Cache Viewer.
- Deleted-file recovery: File Recovery and Hash Checker.

These outputs are dummy evidence, not real case data.

## Malware Analysis Safety Rule

Malware labs must use only dummy/synthetic data that mimics analyst workflows:

- Fake strings output.
- Fake PE header fields.
- Fake imports/exports.
- Fake process/file/registry activity.
- Fake packet or beacon records.
- Fake ransom notes and IOCs.

Do not download, embed, execute, or link users toward live malware samples from inside the app.

## Good Offload Targets For Another Codex Session

1. Build the malware-analysis simulator as its own full UI.
   This should be a separate session because it needs dummy datasets, multiple views, and careful safety boundaries.

2. Convert external project catalog cards into local interactive labs.
   This is larger than catalog work because each repo needs purpose-built exercises, scoring, and data fixtures.

3. Refactor the app from browser Babel globals to Vite React modules.
   This should be separate because it touches every component and changes the project build model.

4. Add browser tests with Playwright.
   Keep it separate after routing stabilizes. Test login, track selection, Splunk task submission, Windows workstation selection, and generic catalog links.

## Current Verification Command

```bash
npm run check
```

The local app is usually served at:

```text
http://127.0.0.1:5173
```
