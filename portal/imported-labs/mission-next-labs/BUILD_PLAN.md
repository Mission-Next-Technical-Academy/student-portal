# Lab Realism Build Plan

This is the single source of truth for the lab realism initiative. Every console working on this project reads this file. Each agent reads §1 (architecture) plus their own agent section.

---

## How to Use This File

1. The user will assign you an agent number (01 through 08).
2. Read **§1 Architecture & Realism Spec** end to end. That is canon.
3. Then jump to your agent section (§3 through §10) and execute it.
4. Do not modify other agents' files unless §10 (QA) directs you to.

Each agent works in its own console. Phase 0 (Agent 01) runs first and alone. Agents 02–07 run in parallel after Phase 0 merges. Agent 08 runs after Agents 02–07 merge.

---

# §1 Architecture & Realism Spec

## 1.1 Non-Negotiable Design Philosophy

Every lab MUST:

- Mimic real-world tools, UIs, and analyst workflows.
- Match actual technology interfaces (not generic UI).
- Use synthetic but realistic data.
- Simulate real commands, syntax, and outputs.
- Follow the upstream GitHub project workflow step-by-step.
- Require ZERO real installations (fully simulated environment).

A lab that "summarizes" the upstream workflow is a regression. A lab is a 1:1 experiential replica.

## 1.2 Source-of-Truth Contract

For every lab, the upstream `0xrajneesh/...` markdown file is canon.

Implementation:
1. At lab-creation time, snapshot the upstream `.md` to `src/data/sources/<lab-id>.source.md`.
2. The lab module declares `source.commit` and `source.sha256`.
3. CI fails if `sha256` doesn't match the bytes of the snapshot file.

Track-to-repo map:

| Track | Repo |
|---|---|
| log-analysis | `0xrajneesh/Log-Analysis-Projects-for-Beginners` |
| windows-forensics | `0xrajneesh/Windows-Forensics-Projects-for-Beginners` |
| active-directory | `0xrajneesh/Active-Directory-Monitoring-Projects` |
| security-assessments | `0xrajneesh/Security-Assessments-projects-for-Beginners` |
| vulnerability-management | `0xrajneesh/Vulnerability-Management-Projects-for-Beginners` |
| malware-analysis | `0xrajneesh/Malware-Analysis-Projects-for-Beginners` |

## 1.3 Step-to-Simulation Schema

Every numbered step in the upstream `.md` becomes one row in the lab's `exercises[].steps[]` array.

```js
{
  id: 'lap-1.ex3.s2',                       // dot-path: lab.exercise.step

  upstream: {
    exercise: 'Exercise 3',                 // exact heading from .md
    stepNumber: 2,                          // 1-indexed in that exercise
    sourceLine: "grep ' 404 ' access.log",  // verbatim from upstream
  },

  kind: 'command' | 'ui' | 'observe' | 'analyze',

  instruction: 'Filter the access log to entries returning HTTP 404.',

  acceptedInputs: [
    { type:'exact',  value:"grep ' 404 ' access.log" },
    { type:'regex',  value:/^grep\s+['"]?\s*404\s*['"]?\s+access\.log$/ },
  ],

  response: {
    stdout: '...realistic synthetic output...',
    exitCode: 0,
    stateMutations: [
      { key:'observed.404Count', value:12 },
    ],
  },

  validation: {
    type: 'commandExecuted',                // see §1.6.1 for the full list
    requires: ['shell.lastFilteredLines >= 1'],
  },

  checkOnLearning: 'col-q3' | null,         // optional CoL trigger
}
```

Hard rules:
- No step may exist that doesn't trace to a line in the upstream `.md`.
- No upstream step may be omitted.
- The upstream `Exercise N` ordering is preserved.

## 1.4 Per-Environment UI Fidelity

### 1.4.1 Windows-based labs

A `WindowsLabShell` MUST render:
- Title bar: 32px, system icon + window title + min/max/close at right.
- Menu bar (File / Edit / View / Action / Help — items match the real tool).
- Toolbar with authentic iconography.
- Status bar at bottom (selected-item count, license status, etc.).
- Right-click context menus on tree nodes and table rows.
- Keyboard accelerators: F5 refresh, Ctrl+F find, Ctrl+S save, Alt+F4 close.
- Modal dialogs styled like Win10/11 system dialogs.

Required Windows shells:
- `EventViewerLabShell` (exists — extend)
- `RegistryLabShell` (exists)
- `FileExplorerLabShell` (new — ribbon UI, address bar, navigation pane)
- `PowerShellShell` (new — pick blue ISE-style OR Windows Terminal style; one only)
- `WindowsCmdShell` (new — black bg, `C:\>` prompt)
- `WindowsRunDialog` (new — small modal, fires on Win+R)

### 1.4.2 Linux-based labs

A `LinuxTerminalShell` MUST:
- Honor a virtual FS (`/etc`, `/var/log`, `/home/student`, `/tmp`).
- Implement: `ls`, `cd`, `pwd`, `cat`, `less`, `grep`, `awk`, `sort`, `uniq`, `wc`, `head`, `tail`, `find`, `chmod`, `chown`, `sudo`, `systemctl`, `journalctl`.
- Support pipes `|`, redirects `>` / `>>`, chains `&&` / `||`.
- Tab-completion against the virtual FS.
- Command history via Up/Down arrows.
- `less` opens a pager overlay; `q` returns control.
- Errors mirror real bash: `bash: foo: command not found`, `grep: bar: No such file or directory`.

### 1.4.3 SIEM / Log Analysis

`SplunkLabShell` (exists) and `KibanaLabShell` (new) MUST:
- Time picker (Last 15m / 30m / 1h / 24h / custom).
- Field sidebar (selected fields / interesting fields with frequencies).
- Histogram strip above results.
- Query bar with syntax highlighting.
- Click a histogram bar → drill into that time slice.
- "Save as Dashboard Panel" / "Save as Alert" affordances.

Engines:
- Splunk: SPL — `search`, `where`, `stats`, `count by`, `eval`, `dedup`, `top`, `rare`, `sort`.
- Kibana: KQL — `field: value`, `field: "phrase"`, `not field: value`, `*` wildcards.

### 1.4.4 Active Directory

`ADUCLabShell` (new) MUST:
- MMC chrome (snap-in style).
- Three-pane: console tree (left) / result pane (center) / action pane (right).
- Tree: `corp.example.local → Builtin / Computers / Domain Controllers / ForeignSecurityPrincipals / Users / Custom OUs`.
- Right-click menu items match real ADUC: New / Properties / Reset Password / Disable Account / Move / Delete.
- Properties dialog tabs match real ADUC: General / Address / Account / Profile / Telephones / Organization / Member Of / Dial-in / Environment / Sessions / Remote control / Remote Desktop Services Profile / COM+ / Attribute Editor.

`GPMCLabShell` (new) MUST:
- Forest → Domains → corp.example.local → Group Policy Objects tree.
- GPO Settings tab with HTML report (Computer Configuration / User Configuration).
- Scope tab: Links / Security Filtering / WMI Filtering / Delegation.

Per-product monitoring shells (one per AD project):
- `GrafanaLabShell` — panel grid + datasource form + Prometheus query bar.
- `DatadogLabShell` — host map + APM trace.
- `NagiosLabShell` — Host/Service Status two-pane red/yellow/green.
- `CheckmkLabShell` — main dashboard + WATO rules.
- `PrometheusLabShell` — `/graph` query, alert rules YAML, alertmanager.
- `CactiLabShell` — RRD-style line graph.

### 1.4.5 Malware Analysis

Match the upstream `.md` exactly. Do NOT substitute Ghidra unless the upstream says Ghidra.

- `PEviewLabShell` — IMAGE_DOS_HEADER / IMAGE_NT_HEADERS / SECTION .text/.data/.rdata / IAT tree.
- `DependencyWalkerLabShell` — hierarchical DLL tree + function list per DLL.
- `ResourceHackerLabShell` — Icon / Dialog / String Table / Version Info tree.
- `HxDLabShell` — addr / hex / ascii three-column view, jump-to-offset, search.
- `ProcmonLabShell` — Time / Process / PID / Operation / Path / Result with filter rules.
- `RegShotLabShell` — before/after diff with `+` / `-` markers.
- `WiresharkLabShell` — three-pane (packet list / details / hex), Statistics → Conversations.
- (Optional `GhidraLabShell` — only if upstream explicitly references Ghidra.)

### 1.4.6 Vulnerability / Scan UIs

Each scanner gets its own shell. They do NOT share UI.

- `OpenVASLabShell` — Greenbone GSA: dark green header, Tasks / Configuration / Reports / Resilience / SecInfo nav.
- `NessusLabShell` — Tenable blue chrome. Severity colors LOCKED to: `Critical=#CC0000`, `High=#FF8C00`, `Medium=#FFD700`, `Low=#3399CC`, `Info=#999999`.
- `QualysLabShell` — top tab bar (VM / PC / WAS), donut charts, QID-keyed findings.
- `ZAPLabShell` — Sites tree (left), History/Search/Alerts/Output tabs (bottom), Request/Response panes (right) with Header/Body sub-tabs.
- `WSUSLabShell` — Update Services MMC chrome, three-pane (Updates / All Computers / Synchronizations), Approval status icons.

## 1.5 Check-on-Learning Drawer (mandatory)

Every lab MUST register a `checkOnLearning` array.

### 1.5.1 Visual

- Position: fixed bottom-left.
- Trigger: circular boot icon (Mission Next brand).
- Closed: 48×48 boot icon + numbered badge for unread questions.
- Open: panel slides up to ~480×520, dark theme.
- Header: "Check on Learning" + step counter (`Q3 of 7`).
- Body: question + answer affordance (multiple choice / short answer / multi-select).
- Footer: Submit / Skip (skip allowed but flagged in instructor view).

### 1.5.2 Triggering

```js
{
  id: 'col-q3',
  question: 'You ran `grep \' 404 \' access.log` and saw 12 matches. What does HTTP 404 indicate, and why is a sudden spike across many distinct URIs a security concern?',
  type: 'multi-select',
  options: [
    { id:'a', text:'The server returned the requested page', correct:false },
    { id:'b', text:'The requested resource was not found', correct:true },
    { id:'c', text:'A spike across many URIs suggests directory enumeration', correct:true },
    { id:'d', text:'404s never matter for security', correct:false },
  ],
  triggerOn: { stepId:'lap-1.ex3.s2', whenStateMatches:{ 'observed.404Count':12 } },
  reinforces: 'lap-1.ex3.s2',
  passThreshold: 'all-correct',
}
```

### 1.5.3 Coverage requirements

- ≥ 1 question per upstream Exercise heading.
- ≥ 1 question of each Bloom level across the lab: recall, comprehension, application, analysis.
- ≥ 1 question must reference a value the user actually observed.

## 1.6 Validation & Forward-Only Gating

### 1.6.1 Predicate types

| Type | Meaning | Example |
|---|---|---|
| `commandExecuted` | A specific command was run | `grep ' 404 ' access.log` |
| `uiPath` | A UI navigation completed | `Win+R → eventvwr.msc → Enter` |
| `stateEquals` | A simulator state value matches | `tree.selected === 'Security'` |
| `valueExtracted` | User submitted a specific value found in data | `parent process == 'C:\\Windows\\explorer.exe'` |
| `fileCreated` | A virtual file was written | `savedFiles['FailedLogins.evtx']` |
| `serviceState` | A simulated service is in a state | `services.nessusd.state === 'active'` |
| `observationLogged` | User opened/viewed a specific record | `observed.findings.includes('plugin-19506')` |
| `quizPassed` | A CoL question was answered correctly | `quiz.col-q3.passed === true` |

### 1.6.2 Gating

```js
{
  id: 'lap-1.ex3.s3',
  requires: ['lap-1.ex3.s1.completed', 'lap-1.ex3.s2.completed'],
  validation: { type:'commandExecuted', value:"grep '192.168.1.100' access.log | grep ' 404 '" },
}
```

If `requires` is unmet, the step's instruction is grayed out. Input is rejected with `LOCKED — complete the previous step first`.

### 1.6.3 Hint escalation

- After 3 failed attempts at a step, surface a hint.
- After 5, surface the answer with a "skip-with-help" mark on the instructor dashboard.

## 1.7 Unified Lab Module Schema

```js
// src/data/labs/lap-1.lab.js
export default {
  id: 'lap-1',
  track: 'log-analysis',
  title: 'Basic Apache Web Server Log Analysis',
  difficulty: 'Beginner',
  estimatedTime: '45 min',

  source: {
    repo: '0xrajneesh/Log-Analysis-Projects-for-Beginners',
    file: 'Project-1-Apache-Web-Server-Log-Analysis.md',
    commit: 'frozen-sha-here',
    sha256: 'frozen-content-hash-here',
    snapshot: 'src/data/sources/lap-1.source.md',
  },

  environment: {
    type: 'linux',
    shell: 'LinuxTerminalShell',
    fs: () => require('./lap-1.fs.js'),
  },

  scenario: {
    role: 'Junior SOC analyst',
    incident: 'Routine review of last week\'s web server logs flagged a possible scan attempt from an internal IP.',
  },

  exercises: [
    {
      id: 'ex1',
      upstreamHeading: 'Exercise 1: Accessing Apache Log Files',
      steps: [ /* see §1.3 */ ],
    },
  ],

  checkOnLearning: [ /* see §1.5 */ ],

  completion: {
    requireAllSteps: true,
    minQuizScore: 0.8,
  },
};
```

## 1.8 File Layout

```
src/
  data.js                          # catalog index + project arrays (size shrinks over Phase 1 as labs migrate out)
  data/
    labs/
      log-analysis.labs.js         # ONE file per track holds all labs in that track
      windows-forensics.labs.js    # (browser-Babel has no bundler — fewer files = fewer <script> tags)
      active-directory.labs.js
      security-assessments.labs.js
      vuln-management.labs.js
      malware-analysis.labs.js
      _schema.js                   # JSDoc types for the lab module shape
    sources/
      lap-1.source.md              # frozen upstream snapshot
      ...
      .manifest.json               # sha256 + bytes for each snapshot
  shells/
    LinuxTerminalShell.jsx         # shared (Phase 0)
    PowerShellShell.jsx            # shared (Phase 0)
    WindowsCmdShell.jsx            # shared (Phase 0)
    BrowserShell.jsx               # shared (Phase 0)
    NotepadShell.jsx               # shared (Phase 0)
    gold-shells.jsx                # SplunkLabShell + EventViewerLabShell + SysmonLabShell + RegistryLabShell migrated together (Phase 0)
    log-analysis-shells.jsx        # KibanaLabShell — built by Agent 02
    windows-forensics-shells.jsx   # TimelineExplorer/BrowserHistoryViewer/FTKImager — Agent 03
    active-directory-shells.jsx    # Grafana/Datadog/Nagios/Checkmk/Prometheus/Cacti/ADUC — Agent 04
    security-assessments-shells.jsx# BurpProxy/IamMatrix — Agent 05
    vuln-management-shells.jsx     # OpenVAS/Nessus/Qualys/ZAP/WSUS — Agent 06
    malware-analysis-shells.jsx    # PEview/DepWalker/ResHacker/HxD/Procmon/RegShot/Wireshark — Agent 07
  engines/
    splQueryEngine.js              # moved from query-engine.js (Phase 0)
    kqlEngine.js                   # Agent 02
    bashEngine.js                  # Phase 0 (lives inside LinuxTerminalShell or extracted)
    eventLogXPathEngine.js         # Agent 03 if needed
    pcapDisplayFilter.js           # Agent 07
  systems/
    validator.js                   # Phase 0 — predicate evaluator
    gating.js                      # Phase 0 — forward-only progression
    virtualFs.js                   # Phase 0 — /var/log, /home/student, etc.
    progress.js                    # Phase 0 — extends data.js progress functions
    checkOnLearning.jsx            # Phase 0 — the boot drawer
```

## 1.13 Implementation Constraint: Browser-Babel (no bundler)

This project does NOT use Vite/Webpack. Scripts are loaded via `<script type="text/babel">` in `index.html`, transformed in-browser. There is no module system at runtime.

Implications every agent must follow:

- **No `import`/`export`** in any `.js` or `.jsx` file. The schema example in §1.7 is illustrative; in code, replace `export default { ... }` with the global-registration pattern below.
- Each new file ends with `Object.assign(window, { ...exports });` (or namespaced like `window.MISSION_NEXT_LABS`).
- Lab modules are grouped **one file per track**, not one per lab — to keep `index.html` manageable. Inside, register all labs in that track at once:
  ```js
  // src/data/labs/log-analysis.labs.js
  const LAP_1_LAB = { id:'lap-1', /* ... */ };
  const LAP_2_LAB = { id:'lap-2', /* ... */ };
  // ...
  Object.assign(window.MISSION_NEXT_LABS = window.MISSION_NEXT_LABS || {}, {
    'lap-1': LAP_1_LAB, 'lap-2': LAP_2_LAB, /* ... */
  });
  ```
- Add new files to `index.html` in dependency order: vanilla JS first (data, engines, systems-without-React), then JSX (shells, components, page modules, app last).
- Snapshot `sha256` verification lives in `scripts/check.mjs` (Node-side). The browser does not verify hashes at runtime.
- The check script (`scripts/check.mjs`) executes `data.js` and `query-engine.js` in a `vm` sandbox. Any new globals exposed must be exercised in that sandbox if they're load-bearing for tests.

## 1.9 11-Point Realism Checklist (merge gate)

A lab is not "done" until all 11 pass.

| # | Check | Pass criterion |
|---|---|---|
| 1 | UI matches real tool | Side-by-side comparison: chrome, panes, fonts, colors, icons match within reasonable approximation. |
| 2 | Native query/command syntax | Inputs accepted are valid in the real tool. Foreign syntax rejected. |
| 3 | Field names match | Dataset uses real field names from the tool's documentation. |
| 4 | Output format matches | A returned row renders the way the real tool renders it. |
| 5 | Realistic IOCs | RFC 5737 IPs, real CVE format, real KB IDs, plausible hostnames, real SHA256 lengths. |
| 6 | Narrative dataset | Baseline → anomaly → impact arc with plausible noise. NOT the 12-row generic fixture. |
| 7 | Workflow follows GitHub steps | Each task corresponds to a step in the upstream `.md`. |
| 8 | Validation requires evidence extraction | ≥ 2 of 3+ tasks use `valueExtracted`, not just `count`. |
| 9 | 1:1 step coverage | Every numbered step in `data/sources/<lab-id>.source.md` has a matching `exercises[].steps[]` entry. |
| 10 | Forward gating | No step accepts input until its `requires[]` are satisfied. Verified by automated test. |
| 11 | CoL coverage | ≥ 1 question per upstream Exercise. ≥ 1 question per Bloom level. |

## 1.10 Shell Reuse Map

Phase 0 shared shells (built by Agent 01, used by everyone):

| Shell | Used by |
|---|---|
| `LinuxTerminalShell` | lap-1, lap-2, sa-1, sa-4, vm-1 (install), vm-2 (install) |
| `PowerShellShell` | wf-1, wf-2..5, ad-1, lap-3 (Get-WinEvent) |
| `WindowsCmdShell` | wf-1 (LogParser), ma-1 (strings.exe) |
| `BrowserShell` | ad-1..ad-7 web UIs, vm-2/vm-3/vm-4 web UIs |
| `NotepadShell` | wf-1, ma-1, anywhere a text file is "opened" |

Existing gold shells (do NOT modify in Phase 1 unless coordinating):
- `SplunkLabShell`, `EventViewerLabShell`, `SysmonLabShell`, `RegistryLabShell`.

## 1.11 Forbidden Patterns

The following are regressions. PRs containing them must be rejected.

- Adding a step that doesn't trace to upstream.
- Skipping an upstream step.
- Reusing the generic 12-row fixture (`buildProjectLabFixtures` at `src/data.js:521`).
- Reusing the generic 3-task template (`Find High-Severity Evidence` / `Identify the Primary Finding` / `Scope Open Work`).
- Sharing a shell across tools that aren't the same product.
- Skipping the CoL drawer.
- Skipping forward gating.
- Inventing field names, CVE IDs, or KB IDs that don't match upstream conventions.

## 1.12 Synthetic Cast (consistent across labs)

Use this fictional cast across all labs that need an environment so students gradually learn the world:

- Domain: `corp.example.local`
- DCs: `DC-01`, `DC-02`
- Workstations: `WKSTN-07`, `WKSTN-11`, `WKSTN-15`
- Servers: `APP-DB-02`, `WEB-01`, `FILE-01`
- Users: `j.sanders`, `m.chen`, `helpdesk-admin`, `svc_backup`, `svc_sql`, `temp.contractor`
- IP space: `10.10.24.0/24` for internal, RFC 5737 (`198.51.100.0/24`, `203.0.113.0/24`, `192.0.2.0/24`) for external.
- Domains in lab data: `*.example`, `*.example-bad.com`, reserved/test TLDs only. NEVER use a real malicious domain.

---

# §2 Agent Index & Sequencing

| # | Agent | Phase | Runs | Heaviness |
|---|---|---|---|---|
| 01 | Foundation | 0 | first, alone | Heavy |
| 02 | Log Analysis | 1 | parallel after 01 | Light |
| 03 | Windows Forensics | 1 | parallel after 01 | Medium |
| 04 | Active Directory | 1 | parallel after 01 | Heavy |
| 05 | Security Assessments | 1 | parallel after 01 | Medium |
| 06 | Vuln Management | 1 | parallel after 01 | Heavy |
| 07 | Malware Analysis | 1 | parallel after 01 | Heavy |
| 08 | Integration & QA | 2 | last, alone, after 02–07 | Medium |

Open one console for each agent. Hand them this file and tell them which agent number they are.

---

# §3 Agent 01 — Foundation

Sequence: first, alone. Agents 02–07 cannot start until this is merged.

## Mission

Build the platform on which six parallel track agents will work without colliding. Validate the framework end-to-end on `lap-1` (Apache Log Analysis) so it becomes the reference for every later lab.

## In Scope

1. Repo restructure — split monoliths into per-lab and per-shell files per §1.8.
2. Source snapshots — fetch all 32 upstream `.md` files into `src/data/sources/` with frozen `sha256`.
3. Shared shells (used by ≥ 2 tracks): `LinuxTerminalShell`, `PowerShellShell`, `WindowsCmdShell`, `BrowserShell`, `NotepadShell`.
4. Cross-cutting systems:
   - Step validator (`src/systems/validator.js`)
   - Forward-only gating engine (`src/systems/gating.js`)
   - Virtual filesystem layer (`src/systems/virtualFs.js`)
   - Check-on-Learning drawer component (`src/systems/checkOnLearning.jsx`)
   - Updated lab module schema + per-lab loader
   - Updated progress + instructor-dashboard fields (attempt count, time-on-step, CoL responses)
5. Reference lab — `lap-1` Apache fully implemented end-to-end against §1.3, §1.5, §1.6.
6. Output: `LAB_AUTHORING_GUIDE.md` distilled from what you learned building lap-1.

## Out of Scope

- Track-specific shells (Grafana, Nessus, ADUC, PEview, etc.).
- Per-track datasets beyond lap-1.
- Modifying the gold-standard labs (`mod-*`, `lap-3`, `lap-5`, `wf-2`) beyond what's required to fit the new file layout. They must keep working.

## Execution Order

1. Read `src/data.js`, `src/lab-shells.jsx`, `src/module-page.jsx`, `src/query-engine.js` end-to-end.
2. Create the directory structure from §1.8.
3. Move existing gold shells (`SplunkLabShell`, `EventViewerLabShell`, `SysmonLabShell`, `RegistryLabShell`) into `src/shells/` one file each. Update `src/shells/index.js`. Update `src/module-page.jsx` shell-router. **Verify gold labs still play.**
4. Move `src/query-engine.js` to `src/engines/splQueryEngine.js`.
5. Snapshot all 32 upstream `.md` files into `src/data/sources/`. Compute and freeze `sha256` per file. Add a build-time check.
6. Define the unified lab module schema (§1.7) as JSDoc types. Document required and optional fields.
7. Build the shared shells per §1.4.
8. Build the systems: `validator.js`, `gating.js`, `virtualFs.js`, `checkOnLearning.jsx`, `progress.js`.
9. Implement `lap-1` end-to-end with all 5 upstream exercises mapped, all 11 checklist points passing.
10. Update `src/instructor-dashboard.jsx` to surface `attemptCount`, `lastInteractionAt`, `colResponses[]`.
11. Write `LAB_AUTHORING_GUIDE.md` with the lap-1 walkthrough.

## Definition of Done

- [ ] `src/data/labs/` exists. Gold labs migrated and still play.
- [ ] `src/data/sources/` contains all 32 frozen `.md` files with `sha256` build check enforced.
- [ ] `src/shells/` exists with registry + 5 shared shells + 4 migrated gold shells.
- [ ] `src/engines/`, `src/systems/` exist per §1.8.
- [ ] `lap-1` plays end-to-end with `LinuxTerminalShell`, all 5 exercises gated forward-only, CoL drawer fires per coverage rules, all 11 checklist points pass.
- [ ] All 32 lab IDs render in the catalog. Labs not yet implemented show `Coming soon — Agent 0X owns this`.
- [ ] No regressions on `mod-1..7`, `lap-3`, `lap-5`, `wf-2`.
- [ ] Instructor dashboard shows new fields.
- [ ] `LAB_AUTHORING_GUIDE.md` exists with the lap-1 walkthrough.
- [ ] `npm run build` and `npm run dev` are clean.

---

# §4 Agent 02 — Log Analysis

Prerequisite: Agent 01 merged. Read §1 + `LAB_AUTHORING_GUIDE.md`.

## Lab Inventory

| Lab | Title | Status | Owner |
|---|---|---|---|
| lap-1 | Apache Log Analysis | done by Agent 01 (reference) | — |
| lap-2 | Syslog on Linux | TO BUILD | YOU |
| lap-3 | Windows Event Logs | already gold | — |
| lap-4 | ELK Stack | TO BUILD | YOU |
| lap-5 | Sysmon | already gold | — |

## Upstream Sources

- `lap-2`: https://github.com/0xrajneesh/Log-Analysis-Projects-for-Beginners/blob/main/Project-2-Syslog-Analysis-on-Linux-Systems.md
- `lap-4`: https://github.com/0xrajneesh/Log-Analysis-Projects-for-Beginners/blob/main/Project-4-Simple-Log-Analysis-with-ELK-Stack.md

## Shells

- Reuse: `LinuxTerminalShell` (Agent 01).
- Build: `KibanaLabShell` per §1.4.3.

## Per-Lab Acceptance

### lap-2 — Syslog

- Environment: `LinuxTerminalShell`.
- Virtual FS: `/var/log/syslog`, `/var/log/auth.log`, `/var/log/kern.log`, `/var/log/messages`. Real syslog format: `Apr 23 09:03:18 hostname sshd[12345]: Failed password for invalid user admin from 203.0.113.5 port 51022 ssh2`.
- All upstream exercises mapped 1:1.
- Commands work: `tail -F`, `grep`, `awk`, `cut`, `journalctl -u <service>`.
- Narrative: brute-force SSH → success → sudo abuse, mixed with cron/systemd noise.

### lap-4 — ELK

- Environment: `KibanaLabShell`.
- Synthetic indices: `winlogbeat-2026.04.*`, `filebeat-2026.04.*` with ECS field names (`event.action`, `host.name`, `source.ip`, `user.name`, `winlog.event_id`).
- All upstream exercises mapped: index pattern creation, KQL search, histogram drill-in, document inspection, save dashboard.
- Narrative: a log spike at 09:14 reveals a credential-stuffing campaign.

## Definition of Done

- [ ] 2 source snapshots with sha256.
- [ ] 2 lab modules.
- [ ] `KibanaLabShell` registered.
- [ ] Both labs play with forward gating + CoL.
- [ ] Each lab passes all 11 checklist points.
- [ ] No regression on lap-1, lap-3, lap-5.

---

# §5 Agent 03 — Windows Forensics

Prerequisite: Agent 01 merged. Read §1 + `LAB_AUTHORING_GUIDE.md`.

## Lab Inventory

| Lab | Title | Status |
|---|---|---|
| wf-1 | Windows Event Logs Investigation | TO BUILD |
| wf-2 | Registry Analysis | already gold |
| wf-3 | File System & Artifacts | TO BUILD |
| wf-4 | Browser Artifacts | TO BUILD |
| wf-5 | Deleted Files | TO BUILD |

## Upstream Sources

- `wf-1`: https://github.com/0xrajneesh/Windows-Forensics-Projects-for-Beginners/blob/main/project-1-investigating-windows-event-logs-for-security-incidents.md
- `wf-3`: https://github.com/0xrajneesh/Windows-Forensics-Projects-for-Beginners/blob/main/project-3-Forensic-analysis-of-Windows-file-system-and-artifacts.md
- `wf-4`: https://github.com/0xrajneesh/Windows-Forensics-Projects-for-Beginners/blob/main/project-4-extracting-and-interpreting-browser-artifacts-on-windows.md
- `wf-5`: https://github.com/0xrajneesh/Windows-Forensics-Projects-for-Beginners/blob/main/project-5-Recovering-and-Analyzing-Deleted-Files-on-Windows-Systems.md

## Shells

- Reuse: `EventViewerLabShell`, `PowerShellShell`, `WindowsCmdShell`.
- Build: `WindowsRunDialog`, `TimelineExplorerLabShell`, `BrowserHistoryViewerLabShell`, `FTKImagerLabShell`.
- Extend `EventViewerLabShell` with Filter Current Log dialog and Save Filtered Log dialog.

### `WindowsRunDialog`
Small modal centered on screen. "Run" title bar. Single text field `Open:`. Buttons OK / Cancel / Browse. On OK dispatches to whatever shell maps to the typed command (`eventvwr.msc` → EventViewer, `regedit` → Registry, `cmd` → WindowsCmd, `powershell` → PowerShell).

### `TimelineExplorerLabShell`
Eric Zimmerman Timeline Explorer chrome — light theme, dense table. Columns: `FullPath`, `Created0x10`, `Created0x30`, `Modified0x10`, `Modified0x30`, `LastAccess0x10`, `EntryNumber`, `SequenceNumber`, `IsADS`, `Size`, `ZoneId`, `LogFileSeq`. Filter row beneath headers. Right-click → Tag As Suspicious / Mark for Report / Copy Cell.

### `BrowserHistoryViewerLabShell`
NirSoft BrowserHistoryView style. Columns: URL / Title / Visit Time / Visit Count / Visited From / Web Browser / User Profile / URL Length. Browser dropdown filter. Time range picker. Export CSV / HTML.

### `FTKImagerLabShell`
AccessData FTK Imager chrome — three-pane gray Win32. Left: Evidence Tree. Center: File List with name/size/type/dates. Right: Properties / Hex Viewer / File Content Viewer tabs. File menu: Add Evidence Item, Export Files, Export File Hash List, Export Logical Image. `$Recycle.Bin` entries show `$I` and `$R` files.

## Per-Lab Acceptance

### wf-1
Multi-shell: `WindowsRunDialog` → `EventViewerLabShell` → `WindowsCmdShell` (Log Parser) → `PowerShellShell` (Get-WinEvent). All 5 upstream exercises mapped 1:1. Filter Current Log accepts Event ID. Save Filtered Log writes virtual `.evtx`. Get-WinEvent piped to `Out-File` writes `.txt`. Narrative: brute-force then successful logon then process creation chain.

### wf-3
`TimelineExplorerLabShell`. ~400 synthetic MFT entries. Insider-data-staging narrative: file copies into `C:\Users\jdoe\AppData\Local\Temp\export\`, ZIP creation, USB drive `E:\` writes (Zone.Identifier=3).

### wf-4
`BrowserHistoryViewerLabShell`. ~150 synthetic Chrome+Edge history rows. Legitimate browsing + visits to webmail-exfil URL + downloads of `.zip` from external domain.

### wf-5
`FTKImagerLabShell`. Synthetic FS with `$Recycle.Bin\<SID>\` containing `$I*` metadata pairs and `$R*` content pairs. Carving result list. Export Files writes virtual recovered files.

## Definition of Done

- [ ] 4 source snapshots with sha256.
- [ ] 4 lab modules.
- [ ] 4 new shells + extended EventViewer registered.
- [ ] All 4 labs play with forward gating + CoL.
- [ ] Each lab passes all 11 checklist points.
- [ ] No regression on wf-2.

---

# §6 Agent 04 — Active Directory

Prerequisite: Agent 01 merged. Read §1 + `LAB_AUTHORING_GUIDE.md`. This is a heavy track (7 labs, 6 distinct products).

## Lab Inventory

| Lab | Title | Product |
|---|---|---|
| ad-1 | AD with Grafana | Grafana + Prometheus + windows_exporter |
| ad-2 | AD with Splunk | Splunk |
| ad-3 | AD with Datadog | Datadog |
| ad-4 | AD with Nagios | Nagios Core |
| ad-5 | AD with Checkmk | Checkmk |
| ad-6 | AD with Prometheus | Prometheus + Alertmanager |
| ad-7 | AD with Cacti | Cacti |

## Upstream Sources

- `ad-1`: https://github.com/0xrajneesh/Active-Directory-Monitoring-Projects/blob/main/project-1-active-directory-monitoring-with-grafana.md
- `ad-2`: https://github.com/0xrajneesh/Active-Directory-Monitoring-Projects/blob/main/project-2-active-directory-monitoring-with-splunk.md
- `ad-3`: https://github.com/0xrajneesh/Active-Directory-Monitoring-Projects/blob/main/project-3-real-time-active-directory-monitoring-with-datadog.md
- `ad-4`: https://github.com/0xrajneesh/Active-Directory-Monitoring-Projects/blob/main/project-4-active-directory-monitoring-using-nagios.md
- `ad-5`: https://github.com/0xrajneesh/Active-Directory-Monitoring-Projects/blob/main/project-5-active-directory-monitoring-with-checkmk.md
- `ad-6`: https://github.com/0xrajneesh/Active-Directory-Monitoring-Projects/blob/main/project-6-active-directory-monitoring-with-prometheus.md
- `ad-7`: https://github.com/0xrajneesh/Active-Directory-Monitoring-Projects/blob/main/project-7-active-directory-monitoring-with-cacti.md

## Shells

- Reuse: `PowerShellShell`, `LinuxTerminalShell`, `BrowserShell`, `TextEditorShell`, `SplunkLabShell` (gold).
- Build: `GrafanaLabShell`, `DatadogLabShell`, `NagiosLabShell`, `CheckmkLabShell`, `PrometheusLabShell`, `CactiLabShell`. Optionally `ADUCLabShell` per §1.4.4.

### Each product shell — see §1.4.4 for spec.

## Per-Lab Acceptance

### ad-1 — Grafana

| Phase | Step | Simulation |
|---|---|---|
| Install | `Start-Process -FilePath .\windows_exporter-<v>-amd64.msi -ArgumentList /quiet` | `PowerShellShell` accepts |
| Install | `New-Service`, `Start-Service` for wmi_exporter | service state flips to Running |
| Config | Edit `prometheus.yml` | `TextEditorShell` accepts paste; lint validates |
| Run | `./prometheus --config.file=prometheus.yml` | bash echoes startup logs |
| Run | `sudo systemctl start grafana-server` | service flips active |
| GUI | Browse `http://<server>:3000`, login admin/admin | `BrowserShell` → Grafana login → forced password change |
| GUI | Configuration → Data Sources → Add Prometheus | `GrafanaLabShell` data-source form |
| GUI | Save & Test → green check | toast |
| GUI | Create Dashboard → Add Panel → `windows_logical_disk_free_bytes` | metric autocomplete |
| GUI | Add CPU panel; Alert (CPU > 80% for 5m) | alert tab |
| GUI | Build Security dashboard with logon + lockout panels | two more panels |

### ad-2 through ad-7

Each follows its own product workflow. Use the upstream `.md` as canon. Match each tool's chrome and query syntax exactly.

## Definition of Done

- [ ] 7 source snapshots with sha256.
- [ ] 7 lab modules.
- [ ] 6 new product shells registered.
- [ ] Consistent `corp.example.local` cast across all 7 labs (per §1.12).
- [ ] All 7 labs play with forward gating + CoL.
- [ ] Each lab passes all 11 checklist points.
- [ ] No regression on Splunk gold or any other track.

---

# §7 Agent 05 — Security Assessments

Prerequisite: Agent 01 merged. Read §1 + `LAB_AUTHORING_GUIDE.md`.

## Lab Inventory

| Lab | Title | Tool |
|---|---|---|
| sa-1 | Network Security Assessment | nmap / netstat in `LinuxTerminalShell` |
| sa-2 | File System Security | `FileExplorerLabShell` + `LinuxTerminalShell` |
| sa-3 | Web Application Security | `BurpProxyLabShell` (NEW) |
| sa-4 | System Log Assessment | `LinuxTerminalShell` |
| sa-5 | User Account Security | `IamMatrixLabShell` (NEW) + `LinuxTerminalShell` |

## Upstream Sources

- `sa-1`: https://github.com/0xrajneesh/Security-Assessments-projects-for-Beginners/blob/main/project-1-Basic%20Network%20Security%20Assessment:%20Identifying%20Vulnerabilities%20in%20Network%20Configurations.md
- `sa-2`: https://github.com/0xrajneesh/Security-Assessments-projects-for-Beginners/blob/main/project-2-File%20System%20Security%20Assessment:%20Detecting%20Unauthorized%20Access%20and%20Modifications.md
- `sa-3`: https://github.com/0xrajneesh/Security-Assessments-projects-for-Beginners/blob/main/project-3-Web%20Application%20Security%20Assessment:%20Assessing%20Common%20Web%20Vulnerabilities.md
- `sa-4`: https://github.com/0xrajneesh/Security-Assessments-projects-for-Beginners/blob/main/project-4-System%20Log%20Assessment:%20Analyzing%20Logs%20for%20Potential%20Security%20Incidents.md
- `sa-5`: https://github.com/0xrajneesh/Security-Assessments-projects-for-Beginners/blob/main/project-5-User%20Account%20Security%20Assessment:%20Evaluating%20User%20Permissions%20and%20Activity%20Logs.md

## Shells

- Reuse: `LinuxTerminalShell`, `FileExplorerLabShell`.
- Build: `BurpProxyLabShell`, `IamMatrixLabShell`.

### `BurpProxyLabShell`
PortSwigger Burp Suite chrome. Top tabs: Dashboard / Target / Proxy / Intruder / Repeater / Sequencer / Decoder / Comparer / Logger / Extender. Proxy → HTTP history with columns Method/URL/Params/Edited/Status/Length/MIME/Extension/Title/Comment/TLS/IP/Cookies/Time/Listener. Click row → Request/Response panes with Pretty/Raw/Hex/Render sub-tabs. Right-click → Send to Repeater / Send to Intruder. Repeater tab: side-by-side Request/Response.

### `IamMatrixLabShell`
Two-pane: Users (left) / Groups & Roles (right). Cross-reference matrix: User × Group cells filled with last-seen-active timestamp. "Show admin members" filter. "Inactive > 90 days" filter. Export CSV.

## Per-Lab Acceptance

### sa-1 Network
`LinuxTerminalShell` with `nmap`, `netstat`, `ss`, `ip a`, `iptables -L`, `nslookup`, `dig`. Synthetic target `10.10.24.0/24` with realistic open-port pattern (22, 80, 443, 3389, 445, plus misconfigured 5985 WinRM exposed). Narrative: discover an exposed management interface.

### sa-2 File System
`LinuxTerminalShell` (`find`, `stat`, `getfacl`, `ls -la`); optionally `FileExplorerLabShell` for the Windows perspective. Synthetic FS with mixed-permission shares (`/srv/share/finance` mode 0777, SUID binaries, world-writable files). Narrative: identify the leaked-permission share with employee tax forms.

### sa-3 Web App
`BurpProxyLabShell`. ~80 synthetic captured requests against `https://app.example.local/`. Steps: configure proxy, intercept, modify in Repeater, identify reflected XSS / SQLi / IDOR. Narrative: price-manipulation IDOR in the cart endpoint.

### sa-4 System Log
`LinuxTerminalShell` with `tail -F`, `journalctl -u <service>`, `grep`. Synthetic `/var/log/auth.log` and `/var/log/syslog` with a service-restart chain masking lateral movement. Narrative: attacker restarts auditd before privesc.

### sa-5 User Accounts
`IamMatrixLabShell` + `LinuxTerminalShell`. ~30 users, 12 groups. Inactive admins, shared service accounts, sudoers anomalies. Steps: review `/etc/passwd`, `/etc/sudoers`, `chage -l`, `last -f /var/log/wtmp`, then cross-reference in matrix. Narrative: contractor account left with `wheel` membership.

## Routing Update

In `src/module-page.jsx` — replace `'lab-sa-' → ServiceNowLabShell` with per-lab routing. `ServiceNowLabShell` is no longer used by this track but stays in place for future ticketing labs.

## Definition of Done

- [ ] 5 source snapshots with sha256.
- [ ] 5 lab modules.
- [ ] 2 new shells registered.
- [ ] Routing in `module-page.jsx` updated per-lab.
- [ ] All 5 labs play with forward gating + CoL.
- [ ] Each lab passes all 11 checklist points.

---

# §8 Agent 06 — Vulnerability Management

Prerequisite: Agent 01 merged. Read §1 + `LAB_AUTHORING_GUIDE.md`. Heavy track (5 labs, 5 distinct scanners).

## Lab Inventory

| Lab | Title | Product |
|---|---|---|
| vm-1 | OpenVAS Network Scan | Greenbone OpenVAS / GVM |
| vm-2 | Nessus Vulnerability Assessment | Tenable Nessus |
| vm-3 | QualysGuard | Qualys VMDR |
| vm-4 | OWASP ZAP | OWASP ZAP |
| vm-5 | WSUS Patch Management | Microsoft WSUS |

## Upstream Sources

- `vm-1`: https://github.com/0xrajneesh/Vulnerability-Management-Projects-for-Beginners/blob/main/Project-1-Network-Vulnerability-Scanning-with-OpenVAS.md
- `vm-2`: https://github.com/0xrajneesh/Vulnerability-Management-Projects-for-Beginners/blob/main/Project-2-Vulnerability-Assessment-using-Nessus.md
- `vm-3`: https://github.com/0xrajneesh/Vulnerability-Management-Projects-for-Beginners/blob/main/Project-3-Vulnerability-Management-using-QualysGuard.md
- `vm-4`: https://github.com/0xrajneesh/Vulnerability-Management-Projects-for-Beginners/blob/main/Project-4-Web-Application-Vulnerability-Detection-with-OWASP-ZAP.md
- `vm-5`: https://github.com/0xrajneesh/Vulnerability-Management-Projects-for-Beginners/blob/main/Project-5-Patch-Management-and-Vulnerability-Remediation-using-WSUS.md

## Shells

- Reuse: `LinuxTerminalShell`, `BrowserShell`.
- Build: `OpenVASLabShell`, `NessusLabShell`, `QualysLabShell`, `ZAPLabShell`, `WSUSLabShell`. Specs in §1.4.6.

## Per-Lab Acceptance

### vm-1 OpenVAS
Install via `LinuxTerminalShell`. Browse to `https://localhost:9392`. Create scan target `10.10.24.0/24`, select Full and fast config, launch. ~30 synthetic findings across severities. Export PDF.

### vm-2 Nessus
| Phase | Steps |
|---|---|
| Install | `sudo dpkg -i Nessus.deb` → `sudo systemctl start nessusd` |
| Setup | Browse `https://<ip>:8834` → admin → activation → proxy/update |
| Policy | Policies → New Policy → "Basic Network Scan" → Save |
| Scan | Scans → New Scan → use policy → target → Save → Launch |
| Review | Hosts → Vulnerabilities → click critical findings |
| Report | Export → PDF |

### vm-3 QualysGuard
Web-only. Create scan, review by QID, map QIDs to CVEs, generate Patch Report.

### vm-4 OWASP ZAP
Install via `apt install zaproxy`. Configure browser proxy. Spider `https://app.example.local/`. Active Scan; review Alerts tree. Investigate high-confidence reflected XSS.

### vm-5 WSUS
Server Manager → Add Roles → WSUS. Synchronize. Approve a critical security update. Verify deployment.

## Synthetic Vulnerability Data

- Nessus plugin IDs: 4-5 digit (`19506`, `42873`, `97737`).
- CVEs: real-format `CVE-YYYY-NNNNN`, fictional spread 2018–2025.
- CVSSv3 vectors: `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`.
- KB IDs: `KB5034122` real-format.
- Affected hosts: per §1.12 cast.

## Routing Update

In `src/module-page.jsx` — replace `'lab-vm-' → AzureLabShell` with per-lab routing. `AzureLabShell` no longer used; stays in place.

## Definition of Done

- [ ] 5 source snapshots with sha256.
- [ ] 5 lab modules.
- [ ] 5 new scanner shells registered.
- [ ] Routing per-lab in `module-page.jsx`.
- [ ] All 5 labs play with forward gating + CoL.
- [ ] Each lab passes all 11 checklist points.
- [ ] Realistic CVE/plugin/KB IDs.

---

# §9 Agent 07 — Malware Analysis

Prerequisite: Agent 01 merged. Read §1 + `LAB_AUTHORING_GUIDE.md`. This track currently has NO shell wired. You're building from scratch.

## Lab Inventory

| Lab | Title | Tools |
|---|---|---|
| ma-1 | Static Analysis | Strings.exe + PEview + Dependency Walker + Resource Hacker + HxD |
| ma-2 | Dynamic Analysis | Procmon + RegShot + Wireshark + sandbox |
| ma-3 | Ransomware Sample | static + dynamic + IOC review |
| ma-4 | Keylogger Behavior | Procmon + persistence inspection |
| ma-5 | Trojan Network Traffic | Wireshark |

## Upstream Sources

- `ma-1`: https://github.com/0xrajneesh/Malware-Analysis-Projects-for-Beginners/blob/main/Project-1-Static-Analysis-of-a-Simple-Malware-Sample.md
- `ma-2`: https://github.com/0xrajneesh/Malware-Analysis-Projects-for-Beginners/blob/main/Project-2-Dynamic-Analysis-in-a-Controlled-Environment.md
- `ma-3`: https://github.com/0xrajneesh/Malware-Analysis-Projects-for-Beginners/blob/main/Project-3-Analyzing-a-Ransomware-Sample.md
- `ma-4`: https://github.com/0xrajneesh/Malware-Analysis-Projects-for-Beginners/blob/main/Project-4-Behavioral-Analysis-of-a-Keylogger.md
- `ma-5`: https://github.com/0xrajneesh/Malware-Analysis-Projects-for-Beginners/blob/main/Project-5-Network-Traffic-Analysis-of-a-Trojan.md

Decision rule: match upstream tools exactly. Do NOT substitute Ghidra unless an upstream `.md` says Ghidra.

## Shells

- Reuse: `WindowsCmdShell`, `NotepadShell`.
- Build: `PEviewLabShell`, `DependencyWalkerLabShell`, `ResourceHackerLabShell`, `HxDLabShell`, `ProcmonLabShell`, `RegShotLabShell`, `WiresharkLabShell`, `SandboxReportShell`. Specs in §1.4.5.

## Per-Lab Acceptance

### ma-1 Static
| # | Step | Simulation |
|---|---|---|
| 1 | `strings malware_sample.exe > strings_output.txt` | `WindowsCmdShell` writes virtual file |
| 2 | Open output, find URLs/IPs/registry keys | `NotepadShell`; user selects suspicious URL |
| 3 | Open in PEview; review sections / entry / timestamp | `PEviewLabShell` |
| 4 | Open in Dependency Walker; examine imports | `DependencyWalkerLabShell`; user clicks `WS2_32.DLL`, sees `WSAStartup`, `connect` |
| 5 | Open in Resource Hacker; find suspicious resource | `ResourceHackerLabShell`; user finds fake "System Update" string |
| 6 | Open in HxD; find encoded patterns | `HxDLabShell`; user searches `MZ`, finds XOR sentinel |

### ma-2 Dynamic
`SandboxReportShell` shows Signatures / Behavior / Process Tree. `ProcmonLabShell` live capture: file creates in `%APPDATA%`, registry Run key write, child process spawn. `RegShotLabShell` before/after diff shows persistence key. `WiresharkLabShell` shows beaconing to `198.51.100.42` every 60s.

### ma-3 Ransomware
Mix of static + dynamic + IOC. `SandboxReportShell` flags Ransomware family. Synthetic FS shows `.locked` extension; `README_RECOVER.txt` ransom note. Network capture shows Tor-like outbound to fictional onion-host pattern.

### ma-4 Keylogger
`ProcmonLabShell` shows continuous writes to `%APPDATA%\Microsoft\Network\nethist.dat` every 30s. Persistence: HKCU Run key. `WiresharkLabShell` shows periodic POST exfil to `keys.example-bad.com/u`.

### ma-5 Trojan Traffic
`WiresharkLabShell` opens synthetic `.pcap`. Display filters `tcp.port == 443`, `dns.qry.name contains "example-bad"`. Statistics → Conversations reveals beaconing. Identify exfil burst.

## Routing Update

In `src/module-page.jsx` — ADD routing for `lab-ma-*`. Each lab maps to its primary shell; the lab module orchestrates handoff between shells via the step `kind` and `environment.shell` overrides.

## Synthetic Sample Realism

- File hashes: real-format SHA256, plausible-looking but synthetic.
- IPs: RFC 5737 (`198.51.100.0/24`, `203.0.113.0/24`, `192.0.2.0/24`).
- Domains: `*.example`, `*.example-bad.com`, reserved/test TLDs only. NEVER use a real malicious domain.

## Definition of Done

- [ ] 5 source snapshots with sha256.
- [ ] 5 lab modules.
- [ ] 8 new shells registered.
- [ ] Routing in `module-page.jsx` adds `lab-ma-*`.
- [ ] All 5 labs play with forward gating + CoL.
- [ ] Each lab passes all 11 checklist points.
- [ ] All synthetic IOCs clearly fictional.

---

# §10 Agent 08 — Integration & QA

Prerequisite: Agents 01–07 all merged. Read §1 + every other agent section + `LAB_AUTHORING_GUIDE.md`.

## Mission

Verify all 32 labs ship with full realism, correct gating, working CoL, zero cross-track regressions. You are the merge gatekeeper.

## In Scope

1. Click through every lab as a student, end to end.
2. Run §1.9 11-point checklist against every lab.
3. Verify forward gating in every lab (try to skip — must return `LOCKED`).
4. Verify CoL drawer fires per coverage rules in every lab.
5. Verify shared-shell regressions: changes any track agent made to `LinuxTerminalShell`, `PowerShellShell`, etc. did not break other labs.
6. Verify instructor dashboard renders attempt count, time-on-step, CoL responses across all 32 labs.
7. Verify `npm run build` and `npm run dev` are clean.
8. Verify all 32 source snapshots have valid `sha256`.
9. Verify no use of forbidden patterns (§1.11).

## QA Matrix

For each of the 32 labs (`mod-1..7` + `lap-1..5` + `wf-1..5` + `ad-1..7` + `sa-1..5` + `vm-1..5` + `ma-1..5`), record pass/fail on C1–C11 from §1.9. Output: a markdown table of `lab_id × C1..C11`. Any lab with any fail does NOT ship.

## Cross-Track Regression Matrix

| Shell | Used by | Verify |
|---|---|---|
| `LinuxTerminalShell` | lap-1, lap-2, sa-1, sa-2, sa-4, sa-5, vm-1 (install), vm-2 (install), vm-4 (install), ad-1 (systemd), ad-3 (agent install) | Each lab's commands still execute correctly |
| `PowerShellShell` | wf-1, ad-1, lap-3 | Each lab's commands still execute correctly |
| `WindowsCmdShell` | wf-1, ma-1 | Each lab's commands still execute correctly |
| `BrowserShell` | ad-1..7, vm-1..4 | Wraps each child shell correctly |
| `EventViewerLabShell` | wf-1, lap-3 | Filter Current Log dialog works in both contexts |
| `SplunkLabShell` | mod-1..7, ad-2 | Both contexts produce correct results |

## Forbidden-Pattern Audit

Grep the codebase for these and confirm zero hits:

```
buildProjectLabFixtures
'Find High-Severity Evidence'
'Identify the Primary Finding'
'Scope Open Work'
buildProjectLab(
PROJECT_LAB_PROFILES
```

Any hit = open a defect against the owning agent.

## Definition of Done

- [ ] QA matrix populated for all 32 labs, all C1–C11 pass.
- [ ] Cross-track regression matrix all green.
- [ ] Instructor dashboard verified.
- [ ] `npm run build` and `npm run dev` clean.
- [ ] Source snapshots all verified.
- [ ] Forbidden-pattern audit returns zero hits.
- [ ] All BLOCKER and HIGH defects closed.
- [ ] Final release notes drafted (one paragraph per track).
