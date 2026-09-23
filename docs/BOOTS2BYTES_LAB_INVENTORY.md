# Boots2Bytes Lab Inventory

**Status:** Corrected Story A1 inventory  
**Inventory date:** 2026-09-23  
**Authoritative source (read-only):** `/home/alex/Downloads/Boots2Bytes SOC Analyst Track`  
**Migration destination:** `/home/alex/Mission_Next_Technical_Academy_SOC_Analyst_course`

## Scope, method, and classification

This document replaces the superseded inventory of `/home/alex/boots2bytes-range`. It traces the live application's hash routes, script load order, global registrations, lab registries, render dispatch, state flow, assessment helpers, and all registered environment shells. The source repository was inspected and tested without modification.

Evidence labels mean:

- **Observed:** directly present in the cited source.
- **Inference:** a migration recommendation based on observed implementation and Mission Next constraints.

Recommended-action classifications are intentionally strict:

- **DIRECT REUSE:** portable logic can move essentially intact behind a namespace/module boundary.
- **EXTRACT:** a useful component is embedded in a larger file or global runtime and should be separated before use.
- **ADAPT:** the behavior is useful but needs Mission Next scenario, event, persistence, accessibility, or assessment contracts.
- **REFERENCE ONLY:** retain the workflow or visual lesson, not the implementation.
- **DO NOT USE:** prototype/duplicate infrastructure that should not enter the migration.

Each record contains the required 13 fields: `NAME`, `SOURCE FILES`, `DEPENDENCIES`, `WHAT IT SIMULATES`, `CURRENT LABS USING IT`, `INTERACTION MODEL`, `DATA MODEL`, `GUIDANCE SUPPORT`, `ASSESSMENT SUPPORT`, `COUPLING`, `PORTABILITY`, `MISSION NEXT MODULE CANDIDATES`, and `RECOMMENDED ACTION`. `CAPSTONE_REUSABLE`, `RISKS`, and `EVIDENCE` are separate so capstone and migration decisions are explicit.

## Executive finding

The real source contains a broad simulator library, not a single incident console. Its most reusable investment is the combination of a scenario-driven `LabPlayer`, predicate validation, forward gating, local attempt tracking, an in-memory filesystem, terminal/query engines, reusable enterprise UI primitives, and domain shells for log analysis, Windows forensics, malware analysis, security assessment, vulnerability management, and identity/AD monitoring.

It is nevertheless a prototype, not a drop-in Academy platform:

- It is a no-bundler static React application. `index.html` loads React, ReactDOM, Babel, Tailwind, and Motion from CDNs, then every local script in a fixed global order (`index.html:170-180`, `index.html:459-498`).
- Hash routing in `src/app.jsx:218-291` selects either a new-shape `window.B2B_LABS` entry or a legacy `ALL_PROJECT_LABS` fixture. `ModulePage` sends labs with `exercises[]` to `LabPlayer` and all others through legacy special cases or shell dispatch (`src/module-page.jsx:2474-2488`, `src/module-page.jsx:3076-3114`).
- There are 7 built-in log-analysis modules and 32 catalog projects. Of the catalog projects, 29 register schema-based labs; `lap-3`, `lap-5`, and `wf-2` intentionally remain on legacy shells (`src/data.js:204-356`, `src/data.js:1481-1489`, `src/data/labs/log-analysis.labs.js:1239-1246`, `src/data/labs/windows-forensics.labs.js:1456-1470`).
- Progress and checks are browser-local. There is no authenticated server persistence, submission record, student-writing payload, competency rubric, instructor feedback workflow, or review queue.
- `LabPlayer` displays upstream command lines and reveals the same source line as the answer after five failed attempts (`src/systems/labPlayer.jsx:409-421`). This is suitable only for guided practice.
- `completion.requireAllSteps` and `completion.minQuizScore` are documented, but `LabPlayer` never consumes the completion object. Its visible percentage is step completion only (`src/data/labs/_schema.js:130-159`, `src/systems/labPlayer.jsx:226-258`).
- Browser route-smoke expectations are stale: they expect older ADUC, ServiceNow, and Defender surfaces at `ad-1`, `sa-1`, and `vm-1`, while routing now selects schema-based Grafana, Linux terminal, and OpenVAS labs (`scripts/route-smoke.mjs:29-48`; `src/app.jsx:253-259`).

## Route and import trace

```text
index.html
  CDN globals: React -> ReactDOM -> Babel -> optional Motion -> Tailwind
  local data: data.js -> query-engine.js
  lab runtime: schema -> virtualFs -> validator -> gating -> progress
  lab registries: log -> Windows -> assessments -> vulnerability -> malware -> AD
  UI/shell globals: animations -> enterprise primitives -> generic shells
                    -> domain shells -> CheckOnLearning -> LabPlayer
                    -> route pages -> ModulePage -> legacy lab shells -> App

App.parseHashRoute()
  #/tracks -> TrackSelection
  #/track/splunk -> StudentDashboard -> MODULES[mod-1..mod-7]
  #/track/<catalog-track> -> ProjectCatalogPage
                             (Windows uses WindowsForensicsPage)
  #/track/<track>/project/<id>/lab
      -> B2B_LABS[id] when it has exercises[]
      -> otherwise ALL_PROJECT_LABS['lab-' + id]

ModulePage
  mod.exercises[] + window.LabPlayer
      -> LabPlayer -> window[step.environment.shell || lab.environment.shell]
                   -> validateStep -> gating -> progress -> CheckOnLearningDrawer
  legacy lap-2 / lap-4 / wf-1 special cases (normally shadowed now)
      -> page-local environments in module-page.jsx
  remaining legacy lab
      -> getEnterpriseLabType -> window.LabShells/domain shell
      -> executeQuery + validateTask + markTaskComplete
```

Route resolution, not a filename or catalog card, is the authority for “current labs using it.”

## Current lab registry

| Runtime path | Labs | Environment selection |
|---|---|---|
| Built-in legacy SIEM | `mod-1` DNS, `mod-2` FTP, `mod-3` HTTP, `mod-4` SSH, `mod-5` tunnel, `mod-6` SMTP, `mod-7` DHCP | `SplunkLabShell` |
| New-shape log analysis | `lap-1`, `lap-2`, `lap-4` | Linux terminal for Apache/syslog; `KibanaLabShell` for ELK |
| Legacy log analysis | `lap-3`, `lap-5` | `EventViewerLabShell`, `SysmonLabShell` |
| New-shape Windows forensics | `wf-1`, `wf-3`, `wf-4`, `wf-5` | Event logs, timeline, browser history, FTK-style recovery |
| Legacy Windows forensics | `wf-2` | `RegistryLabShell` |
| New-shape security assessment | `sa-1` through `sa-5` | Linux terminal, Burp-style proxy, IAM matrix |
| New-shape vulnerability management | `vm-1` through `vm-5` | OpenVAS-, Nessus-, Qualys-, ZAP-, and WSUS-style shells |
| New-shape malware analysis | `ma-1` through `ma-5` | CMD/Notepad plus PE, dependency, resource, hex, sandbox, Procmon, RegShot, and Wireshark-style shells |
| New-shape AD monitoring | `ad-1` through `ad-7` | Grafana, Splunk, Datadog, Nagios, Checkmk, Prometheus, Cacti; `ad-2` reuses legacy `SplunkLabShell` |

## Inventory records

### 1. Scenario-driven lab player and lab schema

**NAME:** Schema-based lab orchestration (`LabPlayer` + `LabModule`).

**SOURCE FILES:** `src/systems/labPlayer.jsx`; `src/data/labs/_schema.js`; all six `src/data/labs/*.labs.js` registries.

**DEPENDENCIES:** React; `B2B_GATING`; `validateStep`; `B2B_PROGRESS_EXT`; `createVirtualFs`; `CheckOnLearningDrawer`; base `markTaskComplete`; globally registered shell names.

**WHAT IT SIMULATES:** A scenario host that selects a tool per lab/step, presents exercises, applies shell-result state, evaluates unlocked steps, records progress, and launches checks on learning.

**CURRENT LABS USING IT:** All 29 new-shape labs: `lap-1/2/4`, `wf-1/3/4/5`, `sa-1..5`, `vm-1..5`, `ma-1..5`, `ad-1..7`.

**INTERACTION MODEL:** Work an unlocked step in the left environment; shell actions update services/files/observations/UI path; matching steps auto-complete; analyze/value steps use manual submission; the right panel advances.

**DATA MODEL:** `LabModule -> exercises[] -> steps[]`, source provenance, environment factory, scenario, checks, completion settings. Runtime state holds completion, services, files, observations, UI path, quiz, and VFS.

**GUIDANCE SUPPORT:** Scenario, ordered/locked steps, points, hint after three failures, answer after five, visible upstream lines, auto-advance. No practice/prove mode.

**ASSESSMENT SUPPORT:** Eight generic predicates and per-step points/attempts. No enforced declared completion/quiz threshold, partial final submission, analyst narrative, competency events, or instructor review.

**COUPLING:** High to `window.*`, script order, base progress, inline styles, and string shell names.

**PORTABILITY:** Medium; the orchestration seam is strong, but Mission Next must replace answer reveal, local state, and step-count scoring.

**MISSION NEXT MODULE CANDIDATES:** Shared adapter across Modules 3-12 where an occupational workspace needs scenario orchestration; Module 12 can compose already introduced shells.

**RECOMMENDED ACTION:** ADAPT

**CAPSTONE_REUSABLE:** TRUE — as orchestration, never as submission/scoring.

**RISKS:** Answer leakage; forward-only path; exact-answer bias; unused completion policy; no notes/writing; local state diverges from Academy persistence.

**EVIDENCE:** `src/systems/labPlayer.jsx:18-224`, `src/systems/labPlayer.jsx:226-309`, `src/systems/labPlayer.jsx:374-426`, `src/data/labs/_schema.js:9-162`.

### 2. Validation, gating, progress, and check-on-learning systems

**NAME:** Reusable learning-state subsystem.

**SOURCE FILES:** `src/systems/validator.js`; `src/systems/gating.js`; `src/systems/progress.js`; `src/systems/checkOnLearning.jsx`.

**DEPENDENCIES:** `localStorage`; React for the drawer; lab schema and `LabPlayer` callbacks.

**WHAT IT SIMULATES:** Predicate evaluation, prerequisites, attempt history, hint counters, contextual quizzes, and completion percentage.

**CURRENT LABS USING IT:** All 29 new-shape labs; legacy labs use `validateTask` and base progress.

**INTERACTION MODEL:** Shell results re-evaluate unlocked steps; attempts and quiz responses persist per user/lab; multi-select, single-select, and short answers may be skipped/retried.

**DATA MODEL:** Predicates `commandExecuted`, `uiPath`, `stateEquals`, `valueExtracted`, `fileCreated`, `serviceState`, `observationLogged`, `quizPassed`; attempt and response records.

**GUIDANCE SUPPORT:** Attempt-triggered hints/answers and Bloom-tagged checks. `recordHintShown` exists but `LabPlayer` does not call it, so the dashboard hint count can be false zero.

**ASSESSMENT SUPPORT:** Useful low-level evidence; no weighted competencies, alternative-path aggregation, final submission, writing rubric, or feedback.

**COUPLING:** Low for validator/gating; high for localStorage progress; medium for React/global quiz UI.

**PORTABILITY:** High for predicates/gating; medium for progress/quiz.

**MISSION NEXT MODULE CANDIDATES:** Shared practical-module infrastructure after mapping to Mission Next events and `LabRuntime`.

**RECOMMENDED ACTION:** EXTRACT

**CAPSTONE_REUSABLE:** TRUE

**RISKS:** Binary correctness, string state paths, client-visible keys, editable local state, incomplete hint telemetry.

**EVIDENCE:** `src/systems/validator.js:8-145`, `src/systems/gating.js:9-72`, `src/systems/progress.js:14-137`, `src/systems/checkOnLearning.jsx:5-145`.

### 3. Virtual filesystem

**NAME:** In-memory filesystem (`B2B_VFS`).

**SOURCE FILES:** `src/systems/virtualFs.js`.

**DEPENDENCIES:** Standard JavaScript; lab registries supply initial trees.

**WHAT IT SIMULATES:** Directories/files with metadata, reads/writes, mkdir/delete, stat/list, and snapshot/restore; Windows paths normalize to slash paths.

**CURRENT LABS USING IT:** New-shape labs with `environment.fs` across all six domains; Linux terminal uses it most deeply.

**INTERACTION MODEL:** Shell engines call the API; each `LabPlayer` creates an isolated instance.

**DATA MODEL:** Directory nodes with `children`; file nodes with content, timestamp, mode, owner, and group.

**GUIDANCE SUPPORT:** None directly.

**ASSESSMENT SUPPORT:** `fileCreated` checks saved files/VFS existence; snapshot/restore is available but not wired to UI.

**COUPLING:** Low; exported only as two globals.

**PORTABILITY:** High and deterministic.

**MISSION NEXT MODULE CANDIDATES:** Terminal work in Modules 3, 6, 8, 9, and 12, subject to crosswalk.

**RECOMMENDED ACTION:** DIRECT REUSE

**CAPSTONE_REUSABLE:** TRUE

**RISKS:** No permission enforcement, symlinks, binary data, quotas, persistence, or native Windows drive semantics.

**EVIDENCE:** `src/systems/virtualFs.js:13-179`; `src/systems/labPlayer.jsx:59-69`.

### 4. Linux terminal and security-command extensions

**NAME:** Linux terminal/Bash-like command engine.

**SOURCE FILES:** `src/shells/LinuxTerminalShell.jsx`; `src/shells/security-assessments-shells.jsx:1-477`.

**DEPENDENCIES:** React; VFS; mutable `B2B_BASH_ENGINE.BUILTINS`; lab filesystem/services.

**WHAT IT SIMULATES:** Shell history, pipes/redirection, files/text processing, packages/network/services/logs, plus nmap, auditctl/ausearch, Tripwire/AIDE, chkrootkit, Nikto, sqlmap, Wapiti, account/ACL, logwatch/logrotate, tshark, and OSSEC.

**CURRENT LABS USING IT:** `lap-1`, `lap-2`; `sa-1`, `sa-2`, `sa-4`, `sa-5`; selected `sa-3` steps; also the player fallback.

**INTERACTION MODEL:** Type commands, use history/pipes, open pager/editor views, mutate state, emit results.

**DATA MODEL:** Tokens, pipelines, environment (`cwd`, user, host, VFS, services, files), and structured command results.

**GUIDANCE SUPPORT:** Realistic supported-command feedback; player supplies exact lines/hints.

**ASSESSMENT SUPPORT:** Commands and mutations feed validators; engine lacks semantic action types.

**COUPLING:** Medium; assessment commands monkey-patch the global builtin table and use fixture paths.

**PORTABILITY:** High for core; medium-low for extensions.

**MISSION NEXT MODULE CANDIDATES:** Log triage/hunting, host assessment, response, and familiar capstone terminal work.

**RECOMMENDED ACTION:** EXTRACT

**CAPSTONE_REUSABLE:** TRUE

**RISKS:** Recognizer, not sandbox; incomplete parsing; fixture overfitting; load-order dependency; offensive commands require safe framing.

**EVIDENCE:** `src/shells/LinuxTerminalShell.jsx:13-630`, `src/shells/LinuxTerminalShell.jsx:633-801`, `src/shells/security-assessments-shells.jsx:42-477`.

### 5. Windows command, PowerShell, browser, and Notepad shells

**NAME:** Generic workstation primitives (`WindowsCmdShell`, `PowerShellShell`, `BrowserShell`, `NotepadShell`).

**SOURCE FILES:** The four like-named files in `src/shells/`.

**DEPENDENCIES:** React; injected command/page maps; player callbacks. No direct VFS dependency.

**WHAT IT SIMULATES:** CMD/PowerShell prompts, single-tab browser/TLS warning, and selectable editable/read-only Notepad.

**CURRENT LABS USING IT:** CMD: `ma-1`; Notepad: `ma-1`, `ma-3`; PowerShell: embedded in Windows event logs; Browser is registered but no registry selects it directly.

**INTERACTION MODEL:** Type mapped commands, navigate injected pages, acknowledge TLS warning, select/edit text.

**DATA MODEL:** Matcher/run arrays and command results; URL/page map; text/title/read-only state.

**GUIDANCE SUPPORT:** Familiar UI and unknown-command feedback; no guidance mode.

**ASSESSMENT SUPPORT:** Command/selection/navigation callbacks can become evidence.

**COUPLING:** Low-medium; global registration and inline styles remain.

**PORTABILITY:** High after registry/import adaptation.

**MISSION NEXT MODULE CANDIDATES:** Endpoint/Windows work, evidence review, safe malware triage, capstone workstations.

**RECOMMENDED ACTION:** EXTRACT

**CAPSTONE_REUSABLE:** TRUE — Browser only after an earlier curriculum use.

**RISKS:** Narrow scripts; no Windows VFS; disabled browser history; Notepad can leak answers; accessibility review needed.

**EVIDENCE:** registrations at `src/shells/WindowsCmdShell.jsx:130`, `PowerShellShell.jsx:162`, `BrowserShell.jsx:127`, `NotepadShell.jsx:94`; wiring at `src/systems/labPlayer.jsx:227-287`.

### 6. SIEM query engine and Splunk-style workspace

**NAME:** Pipeline query engine + legacy Splunk-style search workspace.

**SOURCE FILES:** `src/query-engine.js`; `src/lab-shells.jsx:461-659`; `src/module-page.jsx:2520-2940`; `src/data.js:22-356`.

**DEPENDENCIES:** Flat event arrays; React legacy state; base progress.

**WHAT IT SIMULATES:** Filter/comparison/OR, count/group, sort, limit, `stats count`, dedup, fields/results/timeline.

**CURRENT LABS USING IT:** `mod-1..7`; legacy `lap-3`, `lap-5`, `wf-2` share query/task state. `ad-2` selects `SplunkLabShell` under the new player despite its legacy prop design.

**INTERACTION MODEL:** Run pipelines, inspect results, submit typed answers, advance tasks; includes history/chips.

**DATA MODEL:** Flat rows, fields, result objects, and tasks with `count`, `count_gt`, `groupby`, `equals` validation.

**GUIDANCE SUPPORT:** Descriptions, hints, chips, fields, and query/error feedback.

**ASSESSMENT SUPPORT:** Legacy page requires both validating result and typed answer; fixed points and narrow accepted paths.

**COUPLING:** Low query-engine coupling; high legacy UI/brand/progress coupling.

**PORTABILITY:** High logic, medium UX, low whole page.

**MISSION NEXT MODULE CANDIDATES:** SIEM/log analysis, triage, hunting, email/network telemetry, capstone correlation.

**RECOMMENDED ACTION:** ADAPT

**CAPSTONE_REUSABLE:** TRUE

**RISKS:** Simple parser; weak unknown-command handling; `\w+` fields; result-shape grading; vendor-specific SPL cues.

**EVIDENCE:** `src/query-engine.js:5-165`, `src/module-page.jsx:2558-2669`, `src/lab-shells.jsx:461-659`.

### 7. Kibana/ELK workspace

**NAME:** Kibana-style ingest, Discover, and dashboard environment.

**SOURCE FILES:** `src/shells/log-analysis-shells.jsx`; `src/data/labs/log-analysis.labs.js`; duplicate legacy ELK code in `src/module-page.jsx`.

**DEPENDENCIES:** React; player; accepted-input tokens; hard-coded documents/histogram.

**WHAT IT SIMULATES:** ELK setup, services, Logstash pipeline, index pattern, Discover filtering/inspection, visualization/dashboard save.

**CURRENT LABS USING IT:** New-shape `lap-4`; route precedence bypasses the legacy `lab-lap-4` special case.

**INTERACTION MODEL:** Navigate sections, use controls/query bar, inspect fields/documents, save dashboard.

**DATA MODEL:** Fixed documents, histogram, navigation/query/filter state, observation/UI path.

**GUIDANCE SUPPORT:** Strong workflow and step-linked commands.

**ASSESSMENT SUPPORT:** Emits player actions; judgment remains exact step/quiz validation.

**COUPLING:** High to `lap-4`, vendor UX, and duplicate code.

**PORTABILITY:** Medium when parameterized.

**MISSION NEXT MODULE CANDIDATES:** Log management/SIEM and a familiar Module 12 pane if selected.

**RECOMMENDED ACTION:** ADAPT

**CAPSTONE_REUSABLE:** TRUE

**RISKS:** Duplicates; vendor specificity; scripted exploration; fixed evidence; the lab registry file contains a NUL byte and some text tools treat it as binary.

**EVIDENCE:** `src/shells/log-analysis-shells.jsx:2-426`, `src/data/labs/log-analysis.labs.js:917-1252`, `src/app.jsx:253-259`.

### 8. Enterprise primitives and AD object manager

**NAME:** Enterprise UI kit + ADUC-style object workflow (`ActiveDirectoryLabShell`).

**SOURCE FILES:** `src/enterprise-components.jsx`; `src/lab-shells.jsx:97-460`, `src/lab-shells.jsx:2031-2088`.

**DEPENDENCIES:** React; legacy shared props; directory fixtures; `LabShells` global.

**WHAT IT SIMULATES:** Toolbars, tables, trees, details, modals, context menus; creating/moving/disabling/enabling/renaming/editing/resetting directory objects.

**CURRENT LABS USING IT:** AD object manager is shadowed because current `ad-*` routes resolve new-shape entries. Primitives support several legacy shells.

**INTERACTION MODEL:** Select/right-click objects, edit modals, mutate local directory state.

**DATA MODEL:** Generic UI definitions; directory entries, OU/status/group/DN, overrides and created objects.

**GUIDANCE SUPPORT:** Task inspector, context actions, active tasks, evidence previews.

**ASSESSMENT SUPPORT:** Legacy completion calls; no semantic distinction between selection and justified decision.

**COUPLING:** Medium-low primitives; high AD shell fixture/legacy coupling.

**PORTABILITY:** High primitives, medium AD workflows.

**MISSION NEXT MODULE CANDIDATES:** Enhance—not replace—Module 2 with selected missing behaviors; possible access/response support.

**RECOMMENDED ACTION:** EXTRACT

**CAPSTONE_REUSABLE:** TRUE — selected primitives/actions, not a second identity platform.

**RISKS:** Shadowed/weakly tested; pointer context menus; hard-coded domain; conflict with improved Module 2.

**EVIDENCE:** `src/enterprise-components.jsx:5-204`, `src/lab-shells.jsx:97-460`, `src/module-page.jsx:3076-3114`.

### 9. Event Viewer and Sysmon workspaces

**NAME:** Legacy Windows Event Viewer and Sysmon environments.

**SOURCE FILES:** `src/lab-shells.jsx:966-1677`; `src/data.js:590-983`, `src/data.js:1266-1467`.

**DEPENDENCIES:** React; query engine; legacy shared props; quiz/localStorage.

**WHAT IT SIMULATES:** Event channels/filter/detail/XML/LPS correlation and Sysmon process/network/image-load investigation. Both embed the reusable `LabCheckpointQuiz` surface.

**CURRENT LABS USING IT:** `lap-3` Event Viewer; `lap-5` Sysmon.

**INTERACTION MODEL:** Select channels/filters/records, run queries, follow exercises, complete draggable quiz.

**DATA MODEL:** Events, channels/details, exercises, query maps, task and quiz state.

**GUIDANCE SUPPORT:** Exercises, shortcuts, setup steps, details, feedback.

**ASSESSMENT SUPPORT:** Query/task completion and five-question local quiz, separate from Academy submission.

**COUPLING:** High legacy/fixture coupling and overlap with new Windows suite.

**PORTABILITY:** Medium after consolidation.

**MISSION NEXT MODULE CANDIDATES:** Endpoint telemetry, triage, hunting, response, Module 12.

**RECOMMENDED ACTION:** ADAPT

**CAPSTONE_REUSABLE:** TRUE

**RISKS:** Two progress stores; fixed answers; monolith; duplicate concepts; exact path.

**EVIDENCE:** `src/lab-shells.jsx:966-1677`, `src/data.js:590-983`, `src/data.js:1266-1467`.

### 10. New-shape Windows forensics suite

**NAME:** Windows event logs, timeline, browser artifacts, deleted-file recovery.

**SOURCE FILES:** `src/shells/windows-forensics-shells.jsx`; `src/data/labs/windows-forensics.labs.js`.

**DEPENDENCIES:** React; enterprise primitives; PowerShell; player; fixtures.

**WHAT IT SIMULATES:** `WindowsEventLogsLabShell`/`EventViewerPlayerShell`, `TimelineExplorerLabShell`, `BrowserHistoryViewerLabShell`, `FTKImagerLabShell`, with `WindowsRunDialog`.

**CURRENT LABS USING IT:** `wf-1`, `wf-3`, `wf-4`, `wf-5`; `wf-2` is legacy.

**INTERACTION MODEL:** Filter/select events, run mapped PowerShell, inspect timelines/browser artifacts, image/recover files, review metadata.

**DATA MODEL:** Events/details, timeline/browser/recovery artifacts, filter/selection/navigation, observation/UI path.

**GUIDANCE SUPPORT:** Exercises, navigation, filters, instructions, checks.

**ASSESSMENT SUPPORT:** Emits actions into predicates; evidence and answers remain predetermined.

**COUPLING:** Medium to schemas/fixture keys and inline visuals.

**PORTABILITY:** Medium-high per component.

**MISSION NEXT MODULE CANDIDATES:** Endpoint/Windows investigation, response, evidence preservation, Module 12.

**RECOMMENDED ACTION:** ADAPT

**CAPSTONE_REUSABLE:** TRUE

**RISKS:** Product implications; fixed paths; no chain-of-custody narrative; split `wf-2` architecture.

**EVIDENCE:** `src/shells/windows-forensics-shells.jsx:73-731`, `src/data/labs/windows-forensics.labs.js:237-1471`.

### 11. Registry forensic environment

**NAME:** Registry Explorer-style investigation (`RegistryLabShell`).

**SOURCE FILES:** `src/lab-shells.jsx:1678-2030`; `src/data.js:984-1265`.

**DEPENDENCIES:** React; enterprise patterns; legacy query/task props.

**WHAT IT SIMULATES:** Loading SAM/SOFTWARE/NTUSER, browsing keys, account counts, Run persistence, UserAssist execution.

**CURRENT LABS USING IT:** Legacy `wf-2` only.

**INTERACTION MODEL:** Navigate tree/values, quick-link tasks, inspect evidence, run query, submit.

**DATA MODEL:** Registry tree/values, artifact tags, guides, selections, fixed targets.

**GUIDANCE SUPPORT:** Detailed browse instructions and quick links.

**ASSESSMENT SUPPORT:** Exact legacy query/typed-answer completion.

**COUPLING:** High to `wf-2` fixtures and legacy state.

**PORTABILITY:** Medium after tree/data separation.

**MISSION NEXT MODULE CANDIDATES:** Endpoint persistence/artifact analysis and response.

**RECOMMENDED ACTION:** ADAPT

**CAPSTONE_REUSABLE:** TRUE

**RISKS:** Answer-leading, single path, legacy-only, no independent annotation.

**EVIDENCE:** `src/lab-shells.jsx:1678-2030`, `src/data.js:984-1265`.

### 12. Malware analysis tool suite

**NAME:** Safe static, dynamic, registry, process, and packet simulators.

**SOURCE FILES:** `src/shells/malware-analysis-shells.jsx`; `src/data/labs/malware-analysis.labs.js`; CMD/Notepad shells.

**DEPENDENCIES:** React; safe/dummy data; player callbacks; generic shells.

**WHAT IT SIMULATES:** `PEviewLabShell`, `DependencyWalkerLabShell`, `ResourceHackerLabShell`, `HxDLabShell`, `ProcmonLabShell`, `RegShotLabShell`, `SandboxReportShell`, `WiresharkLabShell`.

**CURRENT LABS USING IT:** `ma-1` static, `ma-2` dynamic, `ma-3` ransomware, `ma-4` keylogger, `ma-5` Trojan traffic; per-step tool mix is explicit in the registry.

**INTERACTION MODEL:** Inspect PE/import/resource/hex, sandbox/process/file/registry activity, diffs, and packets/details.

**DATA MODEL:** Tool constants plus sample/action/packet/process/file/registry/IOC fixtures.

**GUIDANCE SUPPORT:** Steps, hints, upstream actions, labels, checks.

**ASSESSMENT SUPPORT:** Generic action/observation validation; no reviewed malware report/confidence narrative.

**COUPLING:** Medium-high to sample names and step IDs; eight tools share one file.

**PORTABILITY:** Medium; extract individually behind normalized events.

**MISSION NEXT MODULE CANDIDATES:** Endpoint/malware triage, network evidence, response, familiar capstone panes.

**RECOMMENDED ACTION:** ADAPT

**CAPSTONE_REUSABLE:** TRUE

**RISKS:** Answer-bearing data, shallow fidelity, dummy-only safety, memorized IOCs, monolithic file.

**EVIDENCE:** `src/shells/malware-analysis-shells.jsx:2-638`, `src/data/labs/malware-analysis.labs.js:47-652`, `src/data.js:473-478`.

### 13. Security-assessment web proxy and IAM matrix

**NAME:** Burp-style proxy and account/permission review (`BurpProxyLabShell`, `IamMatrixLabShell`).

**SOURCE FILES:** `src/shells/security-assessments-shells.jsx:498-894`; `src/data/labs/security-assessments.labs.js`.

**DEPENDENCIES:** React; player; request and identity fixtures; Linux terminal for adjacent steps.

**WHAT IT SIMULATES:** Proxy history/request-response inspection and replay-oriented assessment; user/group/privilege matrix.

**CURRENT LABS USING IT:** Burp is primary for `sa-3`; IAM matrix is one `sa-5` step; other assessment labs use Linux.

**INTERACTION MODEL:** Select requests/tabs/findings; filter identities, identify privilege, mark audit complete.

**DATA MODEL:** HTTP records/parameters/findings; users/groups/permissions/status/privilege and filters.

**GUIDANCE SUPPORT:** Step targets/tool labels; adjacent command tasks supply exact commands.

**ASSESSMENT SUPPORT:** Emits tokens/observations; reasoning is mainly quiz/exact answer.

**COUPLING:** High to fixtures and vendor conventions.

**PORTABILITY:** Medium after neutralization and data separation.

**MISSION NEXT MODULE CANDIDATES:** Web/network assessment; identity review only as a Module 2 enhancement.

**RECOMMENDED ACTION:** ADAPT

**CAPSTONE_REUSABLE:** TRUE — IAM only if introduced earlier.

**RISKS:** Authorized-use framing; “mark complete” shortcut; fixed vulnerable endpoints; vendor imitation.

**EVIDENCE:** `src/shells/security-assessments-shells.jsx:498-894`, `src/data/labs/security-assessments.labs.js:858-1181`, `1545-1848`.

### 14. Vulnerability-management suite

**NAME:** Scan, findings, ticket, web-scan, and patch-management environments.

**SOURCE FILES:** `src/shells/vuln-management-shells.jsx`; `src/data/labs/vuln-management.labs.js`.

**DEPENDENCIES:** React; fixed findings/update data; player callbacks.

**WHAT IT SIMULATES:** `OpenVASLabShell`, `NessusLabShell`, `QualysLabShell`, `ZAPLabShell`, `WSUSLabShell`: targets/assets, policies/tasks, scans, findings, tickets, web alerts, patches.

**CURRENT LABS USING IT:** `vm-1` through `vm-5`, respectively.

**INTERACTION MODEL:** Create targets/policies, launch scans, filter/select findings, inspect CVEs, create remediation, approve/decline updates.

**DATA MODEL:** Targets, scans, assets, findings, tickets, alerts, updates, CVSS/severity/status/owner/time.

**GUIDANCE SUPPORT:** Instructions, modal workflows, fixtures, checks.

**ASSESSMENT SUPPORT:** Emits observation/UI path; no rationale/SLA rubric/reviewed remediation plan.

**COUPLING:** High to product layouts/data and step tokens; five environments in one file.

**PORTABILITY:** Medium workflow/state, low exact clones.

**MISSION NEXT MODULE CANDIDATES:** Vulnerability lifecycle, prioritization/remediation, assessment, capstone findings/tickets.

**RECOMMENDED ACTION:** ADAPT

**CAPSTONE_REUSABLE:** TRUE

**RISKS:** Vendor branding/sprawl; static findings; no reasoning narrative; synthetic dates/products.

**EVIDENCE:** `src/shells/vuln-management-shells.jsx:38-1896`, `src/data/labs/vuln-management.labs.js:42-944`.

### 15. AD monitoring product shells

**NAME:** Grafana, Splunk, Datadog, Nagios, Checkmk, Prometheus, Cacti monitoring simulations (`GrafanaLabShell`, `SplunkLabShell`, `DatadogLabShell`, `NagiosLabShell`, `CheckmkLabShell`, `PrometheusLabShell`, `CactiLabShell`).

**SOURCE FILES:** `src/shells/active-directory-shells.jsx`; `src/data/labs/active-directory.labs.js`; legacy `SplunkLabShell`.

**DEPENDENCIES:** React; shared `ADProductShell`; player; fixed domain telemetry; `ad-2` legacy shell.

**WHAT IT SIMULATES:** Dashboards, ingestion/data sources, logon/lockout telemetry, performance/security charts, alerts, reports.

**CURRENT LABS USING IT:** `ad-1` Grafana, `ad-2` Splunk, `ad-3` Datadog, `ad-4` Nagios, `ad-5` Checkmk, `ad-6` Prometheus, `ad-7` Cacti.

**INTERACTION MODEL:** Six shells expose one “Run current step” action that submits the accepted token; `ad-2` selects legacy Splunk.

**DATA MODEL:** Product config, fixed domain/server, four-row signals, action log, source-generated exercises.

**GUIDANCE SUPPORT:** Accepted action is displayed; one click completes a step.

**ASSESSMENT SUPPORT:** Scripted completion, not authentic interaction or independent reasoning.

**COUPLING:** Very high to brands/domain/actions/dynamic shell names.

**PORTABILITY:** Low environment, moderate workflow reference.

**MISSION NEXT MODULE CANDIDATES:** Reference while strengthening Module 2 or a justified monitoring objective; do not add seven tools.

**RECOMMENDED ACTION:** REFERENCE ONLY

**CAPSTONE_REUSABLE:** FALSE

**RISKS:** Vendor sprawl; shallow one-button model; displayed answer; `ad-2` prop mismatch; Module 2 conflict; stale smoke expectation.

**EVIDENCE:** `src/shells/active-directory-shells.jsx:2-140`, `src/data/labs/active-directory.labs.js:3-355`, `scripts/route-smoke.mjs:29-34`.

### 16. ServiceNow-style case and Azure-style security shells

**NAME:** Legacy incident/case and cloud-security shells (`ServiceNowLabShell`, `AzureLabShell`).

**SOURCE FILES:** `src/lab-shells.jsx:660-731`; `src/module-page.jsx:3076-3114`; fixtures in `src/data.js`.

**DEPENDENCIES:** React; enterprise primitives; legacy shared props.

**WHAT IT SIMULATES:** Incident assignment/state/required closure notes; cloud resource/recommendation/secure-score overview.

**CURRENT LABS USING IT:** None. Stale smoke expects them at `sa-1`/`vm-1`, but new-shape routes shadow them.

**INTERACTION MODEL:** Update case/state/notes; browse resource/recommendation summaries.

**DATA MODEL:** Incident records/overrides; resource/finding rows and counts.

**GUIDANCE SUPPORT:** Workflow buttons and required notes.

**ASSESSMENT SUPPORT:** Legacy completion; notes never reach review payload.

**COUPLING:** High legacy/vendor coupling; unreachable normally.

**PORTABILITY:** Medium incident state machine, low Azure overview.

**MISSION NEXT MODULE CANDIDATES:** Case concept may inform response/documentation/Module 12 through the existing Mission Next case flow.

**RECOMMENDED ACTION:** REFERENCE ONLY

**CAPSTONE_REUSABLE:** FALSE

**RISKS:** Dead/shadowed code; stale tests; branding; unpersisted notes; parallel-case-platform risk.

**EVIDENCE:** `src/lab-shells.jsx:660-731`, `src/module-page.jsx:3076-3114`, `scripts/route-smoke.mjs:35-48`.

### 17. Source-backed scenario and dataset library

**NAME:** Lab registries, source snapshots, provenance manifest, synthetic telemetry.

**SOURCE FILES:** `src/data/labs/*.labs.js`; `src/data/sources/*.source.md`; `.manifest.json`; `src/data.js`.

**DEPENDENCIES:** `B2B_LABS`, schema, shell names, upstream repo/file references, SHA-256 metadata.

**WHAT IT SIMULATES:** 29 authored step labs, 7 built-in query labs, 32 generated legacy fallbacks.

**CURRENT LABS USING IT:** Every current route.

**INTERACTION MODEL:** Supplies scenario, environment, steps, accepted inputs, responses, validation, hints, checks, completion; snapshots preserve source exercise text.

**DATA MODEL:** Schema objects and legacy `{logs,fields,tasks}`; source repo/file/hash/snapshot.

**GUIDANCE SUPPORT:** Rich but answer-bearing instructions/lines/hints/checks.

**ASSESSMENT SUPPORT:** Client-side keys/expected state; scenario seeds, not ready Prove It.

**COUPLING:** High to shell names, IDs, predicate vocabulary.

**PORTABILITY:** Medium selected scenarios, low wholesale.

**MISSION NEXT MODULE CANDIDATES:** Determined only by later matrix against Mission Next objectives.

**RECOMMENDED ACTION:** ADAPT

**CAPSTONE_REUSABLE:** TRUE — fresh variants only, never same answers.

**RISKS:** License/attribution review; answer leakage; synthetic conflicts; generic legacy fixtures can be mistaken for authored labs.

**EVIDENCE:** `src/data/labs/_schema.js:9-162`; registry file endings; `src/data.js:358-1568`; `src/data/sources/.manifest.json`.

### 18. Instructor dashboard and progress administration

**NAME:** Cohort progress dashboard.

**SOURCE FILES:** `src/instructor-dashboard.jsx`; `src/data.js:1570-1636`; `src/systems/progress.js`.

**DEPENDENCIES:** Demo users/catalogs; two localStorage stores; React.

**WHAT IT SIMULATES:** Cohort/student/track progress, attempts/hints/check metrics, reset controls.

**CURRENT LABS USING IT:** All labs contribute base progress; new-shape labs add extended attempts/checks; instructor route displays it.

**INTERACTION MODEL:** Select student, inspect roll-ups, reset one/all.

**DATA MODEL:** Demo users; completed tasks/score/start/access; attempts and quiz responses.

**GUIDANCE SUPPORT:** None.

**ASSESSMENT SUPPORT:** Client-local roll-up only; no queue, writing, competencies, rubric, partial credit, grade override, or feedback.

**COUPLING:** High to catalogs/demo users/localStorage.

**PORTABILITY:** Low; Mission Next already owns review/persistence.

**MISSION NEXT MODULE CANDIDATES:** None; use only as reference for adapter metrics.

**RECOMMENDED ACTION:** REFERENCE ONLY

**CAPSTONE_REUSABLE:** FALSE

**RISKS:** Non-authoritative data; destructive reset; dashboard assumes `mod.tasks` even for new schema; false hint metric; no review contract.

**EVIDENCE:** `src/instructor-dashboard.jsx:5-228`, `src/data.js:1570-1636`, `src/systems/progress.js:14-137`.

### 19. Alternate Windows launcher/tool-card page

**NAME:** `WindowsForensicsPage` catalog/static tool simulations.

**SOURCE FILES:** `src/windows-forensics-page.jsx`.

**DEPENDENCIES:** React; Windows catalogs; route callbacks.

**WHAT IT SIMULATES:** Display cards for Event Viewer, PowerShell, Registry, Autoruns, Timeline, MFT, browser history/cache, recovery, hash checker.

**CURRENT LABS USING IT:** Windows track/project selection; `/lab` routes then use other environments.

**INTERACTION MODEL:** Select project/tool card, inspect summary, launch lab.

**DATA MODEL:** Hard-coded `WINDOWS_TOOL_SIMULATIONS`.

**GUIDANCE SUPPORT:** Descriptions only.

**ASSESSMENT SUPPORT:** None.

**COUPLING:** High to track routing/catalog.

**PORTABILITY:** Low; Mission Next owns Academy navigation.

**MISSION NEXT MODULE CANDIDATES:** None.

**RECOMMENDED ACTION:** DO NOT USE

**CAPSTONE_REUSABLE:** FALSE

**RISKS:** Parallel navigation and display-only duplicates.

**EVIDENCE:** `src/windows-forensics-page.jsx:5-211`, `220-318`; `src/app.jsx:174-195`.

### 20. Boots2Bytes authentication, catalog, and dashboard shell

**NAME:** Demo session, track catalog, student dashboard, route shell.

**SOURCE FILES:** `src/login.jsx`; `track-selection.jsx`; `student-dashboard.jsx`; `project-catalog-page.jsx`; `app.jsx`; `animations.jsx`; `index.html`.

**DEPENDENCIES:** Demo users; localStorage; hash routing; CDN React/Babel/Tailwind/Motion; global order.

**WHAT IT SIMULATES:** Demo auth, track/module selection, progress cards, transitions, route errors.

**CURRENT LABS USING IT:** Surrounds every route.

**INTERACTION MODEL:** Choose identity/track/module/project and navigate hashes.

**DATA MODEL:** Hard-coded users/catalogs, route state, local session.

**GUIDANCE SUPPORT:** Catalog metadata/progress.

**ASSESSMENT SUPPORT:** None beyond local progress links.

**COUPLING:** Total to source app.

**PORTABILITY:** Very low; Mission Next owns auth/routing/progression/UX.

**MISSION NEXT MODULE CANDIDATES:** None; Module 1 remains UX reference.

**RECOMMENDED ACTION:** DO NOT USE

**CAPSTONE_REUSABLE:** FALSE

**RISKS:** Parallel platform; runtime CDNs; login auto-seeds `student_01`; duplicates Mission Next.

**EVIDENCE:** `src/app.jsx:5-215`, `218-291`; `index.html:170-180`, `459-498`.

## Cross-cutting migration risks

1. **No Prove It contract.** Steps/checks are not fresh independent scenarios with final submission, partial credit, competencies, full writing, and review.
2. **Client-visible keys.** Accepted inputs, expected values, correct options, hints, source lines, and fixture evidence ship to the browser.
3. **Single-path gating.** Default prerequisites require the previous flat step; multiple valid paths need a new model.
4. **Global coupling.** Every file assumes `window.*` and script order. Extract behind Mission Next runtime; do not reproduce the boot chain.
5. **Duplicate generations.** Legacy and schema versions coexist. Route precedence, not filenames, identifies the live environment.
6. **Vendor neutrality.** Migrate occupational behavior/data relationships, not product tours.
7. **Provenance.** Hashes prove integrity, not reuse rights; confirm licenses/attribution.
8. **Accessibility/responsiveness.** Large grids, draggable controls, right-click menus, and fixed-height workspaces require review.
9. **Synthetic truth.** Findings/CVEs/hosts/dates/outputs are fixtures, not live product or intelligence data.
10. **Test drift.** `npm run check` passes, but stale browser smoke cannot prove current route correctness.

## Reuse decision summary

| Inventory item | Classification | Capstone reusable |
|---|---|---|
| Lab player/schema | ADAPT | TRUE |
| Validation/gating/progress/CoL | EXTRACT | TRUE |
| Virtual filesystem | DIRECT REUSE | TRUE |
| Linux terminal | EXTRACT | TRUE |
| Generic workstation shells | EXTRACT | TRUE |
| Query engine/SIEM workspace | ADAPT | TRUE |
| Kibana/ELK | ADAPT | TRUE |
| Enterprise primitives/AD object manager | EXTRACT | TRUE |
| Event Viewer/Sysmon | ADAPT | TRUE |
| Windows forensics suite | ADAPT | TRUE |
| Registry forensics | ADAPT | TRUE |
| Malware suite | ADAPT | TRUE |
| Web proxy/IAM matrix | ADAPT | TRUE |
| Vulnerability suite | ADAPT | TRUE |
| AD monitoring product shells | REFERENCE ONLY | FALSE |
| ServiceNow/Azure legacy shells | REFERENCE ONLY | FALSE |
| Scenario/dataset library | ADAPT | TRUE |
| Instructor dashboard | REFERENCE ONLY | FALSE |
| Alternate Windows launcher | DO NOT USE | FALSE |
| Boots2Bytes app shell | DO NOT USE | FALSE |

`CAPSTONE_REUSABLE = TRUE` means a component or familiar tool interaction may be composed into Module 12 only after it appears earlier in Mission Next. It does not approve source scenarios, answer keys, scoring, navigation, or local persistence.

## Validation and source-preservation evidence

- `npm run check` completed with `Project check passed.` against the authoritative source.
- The check asserts seven built-in modules, 32 local catalog labs, schema registries, query behavior, shell exports, progress behavior, and representative domain data (`scripts/check.mjs`).
- Source worktree status fingerprint before and after inventory work: `4310b30f6ba2840840be899ce858ccf25d8f966d7f7df099449760a06392847a` for `git status --porcelain=v1 --untracked-files=all`; no source file was modified.
- Only this destination document was replaced for Story A1.
