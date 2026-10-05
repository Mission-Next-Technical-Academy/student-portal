# Boots2Bytes → Mission Next Migration: Agile Handoff

**Status:** Paused at a safe discovery checkpoint  
**Date:** 2026-09-23  
**Owner direction:** Continue the supplied 12-module migration plan, using the application running at `http://localhost:5173/` as the authoritative Boots2Bytes source.

## 1. Corrected source of truth

The initial migration brief named `/home/alex/boots2bytes-range`. That directory exists, but it is a different, small Next.js incident-console project and is **not** the Boots2Bytes SOC Analyst Track the owner intended.

The actual application was identified from the running process:

```text
URL:        http://localhost:5173/
PID:        11054
Command:    python3 -m http.server 5173 --bind 127.0.0.1
Source cwd: /home/alex/Downloads/Boots2Bytes SOC Analyst Track
Page title: Boots2Bytes | SOC Analyst Track
```

Use these repositories for all subsequent work:

```text
SOURCE
/home/alex/Downloads/Boots2Bytes SOC Analyst Track

DESTINATION
/home/alex/Mission_Next_Technical_Academy_SOC_Analyst_course
```

Do not base the migration crosswalk on `/home/alex/boots2bytes-range`.

## 2. Product constraints retained

- Mission Next remains the authoritative Academy and curriculum.
- The SOC Analyst program remains exactly 12 modules.
- Module 1 remains the Academy UX/layout reference.
- The substantially improved Module 2 must be preserved and strengthened, not replaced.
- Academy navigation, progression, persistence, submission, and instructor review remain standardized.
- Security-tool workspaces remain occupationally distinct and vendor neutral.
- Reuse follows `REUSE → EXTRACT → ADAPT → PARAMETERIZE → COMPOSE` before rebuilding.
- Practice It is guided; Prove It uses a fresh scenario and independent workflow.
- Every Prove It submission must reach instructor review with readable student writing, competency scoring, partial credit, multiple valid paths, and explainable scoring.
- Module 12 composes tools learners have already encountered; it must not introduce an unrelated new interface.

## 3. Corrected Boots2Bytes evidence

The real source is a static React/Babel application with approximately 17,000 lines across its core source files. It contains the expected reusable engines and shells, including:

```text
src/shells/LinuxTerminalShell.jsx
src/shells/PowerShellShell.jsx
src/shells/WindowsCmdShell.jsx
src/shells/BrowserShell.jsx
src/shells/NotepadShell.jsx
src/shells/active-directory-shells.jsx
src/shells/log-analysis-shells.jsx
src/shells/malware-analysis-shells.jsx
src/shells/security-assessments-shells.jsx
src/shells/vuln-management-shells.jsx
src/shells/windows-forensics-shells.jsx
src/query-engine.js
src/lab-shells.jsx
src/systems/labPlayer.jsx
src/systems/validator.js
src/systems/gating.js
src/systems/progress.js
src/systems/virtualFs.js
src/systems/checkOnLearning.jsx
src/enterprise-components.jsx
src/instructor-dashboard.jsx
```

Verified architectural seams include:

- `labPlayer.jsx`: resolves scenario/step-specific shell names, hosts the simulator, applies shell results, evaluates unlocked steps, and tracks progress.
- `validator.js`: supports reusable validation predicates instead of embedding all grading in shell UI.
- `gating.js`: calculates prerequisites, unlocked steps, progress, and completion.
- `progress.js`: persists attempts, hints, and check-on-learning responses locally.
- `virtualFs.js`: provides the in-memory filesystem shared by terminal simulations.
- `query-engine.js`: implements a small pipeline query engine with filtering, counting/grouping, sorting, limiting, deduplication, and task validation.
- `enterprise-components.jsx`: provides reusable tool-like tables, trees, detail panels, forms, and context menus.

This evidence restores the original migration plan's expected domain opportunities: terminals, SIEM/log analysis, Windows/endpoint/forensics, identity/AD-style workflows, vulnerability management, security assessments, and scenario-driven lab execution.

## 4. Worktree safety

The real Boots2Bytes source already contains extensive user changes:

```text
Modified: README.md, index.html, scripts/*, and multiple src/*.jsx/js files
Untracked: AGENT_HANDOFF.md, BUILD_PLAN.md, LAB_AUTHORING_GUIDE.md,
           PHASE_0_PROGRESS.md, src/data/, src/shells/, src/systems/
```

Treat the entire source repository as read-only during discovery. Do not reset, clean, checkout, format, or overwrite it. Migration work belongs in Mission Next unless a later, explicit task authorizes source maintenance.

## 5. Mission Next baseline

Destination architecture:

```text
portal/      Static Academy, module pages, authentication, progress, grading UI
ui/          Existing integrated SOC simulator
supabase/    Persistence, RLS, lab attempts, grading/review records
```

Important destination seams already present:

- `portal/module-registry.js` registers per-module views and wiring.
- `portal/lab-runtime.js` provides namespaced local state plus selected remote case-state persistence.
- `portal/app.js` owns routing, progress, lab-attempt submission, and instructor grading/review.
- `portal/soc-analyst-module-01.js` is the Academy UX and focused case-console reference.
- `portal/soc-analyst-module-02-environment.js` is the improved focused identity/network workspace and must be preserved.
- `portal/soc-analyst-module-03.js` through `-12.js` already provide authored, module-specific starting points.
- `docs/LAB_ASSESSMENT_STANDARD.md` is mandatory for all simulator and Prove It work.

Pre-migration CI was run in Mission Next:

```text
bash bin/ci-check.sh
```

Result: failed at the portal render gate because SOC Module 2 was reported as `missing authored Assessment Lab surface`. Every other SOC module rendered in that stage, as did all checked IT Support, AI/ML, and Electrical modules. Treat this as a pre-existing baseline defect. The Module 2 environment visibly defines an Assessment Lab, so the next audit must reconcile the test's recognition contract with the newly split environment implementation without discarding the Module 2 improvements.

## 6. Discovery artifacts

`docs/BOOTS2BYTES_LAB_INVENTORY.md` currently describes the wrong `/home/alex/boots2bytes-range` checkout. It now carries a superseded warning. It must be **replaced** by a corrected inventory of the live application's source before the crosswalk begins.

`docs/MISSION_NEXT_LAB_ARCHITECTURE.md` was not completed before this pause and remains a required Wave 1 deliverable.

No simulator migration or Mission Next implementation changes have been made.

## 7. Agile workflow from this checkpoint

### Epic A — Corrected discovery

**Story A1: Inventory the real Boots2Bytes application**

Scope: `/home/alex/Downloads/Boots2Bytes SOC Analyst Track` (read-only).

Deliverable: replace `docs/BOOTS2BYTES_LAB_INVENTORY.md`.

Acceptance criteria:

- Trace routes and imports rather than relying on filenames.
- Inventory every reusable environment using the required 13 fields.
- Include shell engines, query/validation/gating/progress systems, data/scenarios, enterprise components, instructor UI, and all domain-specific shells.
- Classify each item as `DIRECT REUSE`, `EXTRACT`, `ADAPT`, `REFERENCE ONLY`, or `DO NOT USE`.
- Mark `CAPSTONE_REUSABLE = TRUE/FALSE`.
- Record dependencies, current labs, coupling, portability, risks, and evidence.
- Do not modify the source repository.

**Story A2: Complete the Mission Next architecture audit**

Deliverable: `docs/MISSION_NEXT_LAB_ARCHITECTURE.md`.

Acceptance criteria:

- Trace Module 1 and Module 2 render, launch, state, submission, and review flows.
- Document the shared Academy shell and current module-specific simulators.
- Audit persistence, Supabase lab attempts, competency payloads, student writing, and instructor review.
- Explain the pre-existing Module 2 CI failure.
- Identify the smallest shared adapter seam without broad refactoring.

**Wave gate:** both documents reviewed by the primary orchestrator before crosswalk work starts.

### Epic B — Migration crosswalk

Create `docs/LAB_MIGRATION_MATRIX.md` only after Epic A is accepted.

Required columns:

```text
SOURCE TOOL | SOURCE FILES | CURRENT BOOTS2BYTES USE |
TARGET MISSION NEXT MODULE | PRACTICE USE | PROVE USE | REUSE % |
REQUIRED ADAPTATION | DEPENDENCIES | ASSESSMENT INTEGRATION |
CAPSTONE REUSE | RISK | PRIORITY
```

Crosswalk rules:

- Map tools into the existing 12 modules; never reorganize the curriculum around Boots2Bytes.
- Prefer one shared Mission Next engine over duplicate Boots2Bytes/Mission Next versions.
- Preserve Module 1's successful UX and Module 2's improved identity/network workspace.
- Do not approve a tool only because it exists; it must serve a learning objective.
- Review the matrix before any implementation agent is started.

### Epic C — Shared simulator adapter

Implement the smallest practical adapter after the crosswalk is approved.

Candidate responsibilities:

```text
scenario loading
guidance mode (practice/prove)
semantic assessment events
saved state/reset
student notes
submission payload
competency scoring
instructor-review payload
```

The adapter should compose with `LabRuntime`, `recordLabAttempt`, the module registry, and existing instructor grading rather than introduce a parallel platform.

### Epic D — Controlled domain migration

Start agents only for domains justified by the corrected inventory. Assign non-overlapping file ownership. Likely domains are:

1. terminal engines and virtual filesystem;
2. SIEM/log explorer/query engine and threat hunting;
3. endpoint/malware/Windows forensics;
4. network/email/security assessment tooling;
5. identity/AD workflows, preserving Module 2;
6. vulnerability management;
7. evidence/case/reporting and capstone composition.

Each domain agent must report files read/changed, components added/removed, dependencies, assumptions, risks, tests, and results.

### Epic E — Quality gates

Run separate assessment, UX, and integration/regression reviews after migration.

Required outcomes:

- meaningful events distinguish viewing from selecting, identifying, classifying, acting, and documenting;
- multiple valid investigation paths and partial credit are tested;
- full student writing is persisted and readable to instructors;
- scoring is competency-based and explainable;
- every Prove It reaches instructor review;
- Academy shell consistency does not homogenize security-tool interfaces;
- routing, locking, progress, persistence, submission, review, and responsive behavior work;
- exactly 12 SOC modules remain;
- Module 1 and improved Module 2 remain functional;
- Module 12 reuses familiar tools.

## 8. Immediate next action

Resume at **Story A1 and Story A2 in parallel**. Do not create the crosswalk or modify simulator code until both corrected discovery documents are complete and reviewed.

Recommended commands for evidence collection:

```bash
readlink -f /proc/11054/cwd
find "/home/alex/Downloads/Boots2Bytes SOC Analyst Track/src" -type f | sort
rg -n "Shell|LabPlayer|validateStep|executeQuery|scenario|assessment|rubric|score" \
  "/home/alex/Downloads/Boots2Bytes SOC Analyst Track/src"

cd /home/alex/Mission_Next_Technical_Academy_SOC_Analyst_course
bash bin/ci-check.sh
```

## 9. Definition of ready for implementation

Implementation is not ready until all are true:

- [ ] Corrected Boots2Bytes inventory replaces the superseded file.
- [ ] Mission Next architecture audit is complete.
- [ ] Migration matrix is complete and reviewed.
- [ ] Actual migration domains and file ownership are approved.
- [ ] Module 2 CI baseline defect is understood.
- [ ] Shared adapter contract is documented.
- [ ] No agents have overlapping write scopes.

This is the safe stopping point. The next session can resume without repeating repository discovery or confusing the two Boots2Bytes directories.
