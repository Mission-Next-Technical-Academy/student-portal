# Mission Next SOC Analyst Track

Mission Next SOC Analyst Track is a local web app for analyst training exercises. It provides a Splunk-style SOC path with guided log-analysis modules and a Windows Forensics path with a job-like workstation UI for beginner forensic projects.

The project has been consolidated into one clean folder:

```text
/home/alex/Downloads/Mission Next SOC Analyst Track
```

## Current Status

- Static React app served locally.
- No install step required for the current pipeline.
- Progress is stored in browser `localStorage`.
- Canonical UI logo is `assets/boot-logo-transparent.png`.
- Login now opens a training-path selector for `Splunk SIEM` and `Windows Forensics`.
- The Windows Forensics path uses a dummy Windows analyst workstation UI with case shortcuts, evidence preview, tools, and notes.
- Homepage/training path data comes from `TRAINING_CATALOG` in `src/data.js`.
- CI workflow is available at `.github/workflows/ci.yml`.

Continuation notes for future sessions live in [WORKFLOW.md](./WORKFLOW.md).

## Run Locally

```bash
npm run dev
```

Then open:

```text
http://127.0.0.1:5173
```

The app uses hash routes so page location is visible in the URL while still working as a static app:

```text
http://127.0.0.1:5173/#/tracks
http://127.0.0.1:5173/#/track/windows-forensics/project/wf-1
http://127.0.0.1:5173/#/track/splunk/module/mod-1
```

The app loads React and Babel from public CDNs during development. Keep internet access available unless the app is later converted to a bundled React build.

## Validate

```bash
npm run check
```

This runs a no-network validation script that checks project files, loads the data/query engine, and verifies representative module queries.

For a pipeline-compatible command:

```bash
npm run pipeline
```

`npm run build` currently aliases the same validation check because this app is static and has no bundling step yet.

## Lab access

Lab routes open directly without an imported-app login. Mission Next's course
portal handles learner authentication; local lab progress uses a browser-local
learner profile, and course-launched labs can sync progress through the portal's
existing session.

## Project Layout

```text
.
├── assets/      # Logos and static assets
├── scripts/     # Local pipeline checks
├── src/         # App data, query engine, and React components
└── index.html   # Static app entry point
```

## Training Paths

`Splunk SIEM` is the original interactive SOC analyst track. It includes query-driven modules for DNS, FTP, HTTP, SSH, GRE tunnel, SMTP, and DHCP logs.

`Windows Forensics` links the beginner projects from:

```text
https://github.com/0xrajneesh/Windows-Forensics-Projects-for-Beginners
```

That path intentionally feels different from the SIEM track: it presents the work inside a Windows-style desktop/workbench so the exercises feel closer to the environment an analyst would encounter on the job.

The Windows path includes simulated tool views for each project, including Event Viewer, PowerShell, Registry Explorer, Autoruns, Timeline Explorer, MFT Viewer, browser artifact viewers, file recovery, and hash checking.

## Git Workflow

Recommended first commit:

```bash
git add .
git commit -m "Initialize Mission Next SOC Analyst Track app"
```

Recommended local check before every commit:

```bash
npm run check
```

## Next Improvements

1. Convert the app from browser Babel scripts to a bundled Vite React app.
2. Add automated browser smoke tests for direct lab launch, query execution, and progress saving.
