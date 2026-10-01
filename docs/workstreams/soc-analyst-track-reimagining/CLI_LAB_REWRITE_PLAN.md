# CLI Lab Deep Rewrite — Project Plan

**Status:** Implementation authorized for Optional Labs only. Created 2026-09-30; scope corrected 2026-09-30.
**Owner:** Alex (SOC track). Other devs own `portal/app.js`, `ui/`, `supabase/`, `tests/`, `.github/` — any change there needs their sign-off.
**Scope:** Rewrite behavior **inside** the terminal-style imported Optional Labs (`sa-2`, `sa-3`, `sa-4`, `sa-5`) and build any future PowerShell/cloud-shell simulations inside the imported-labs app. The implementation boundary is `portal/imported-labs/mission-next-labs/` (plus this plan/handoff evidence), not the course-module frontend.
**Related:** `docs/specs/CURRICULUM_MAP.md` (objectives + minute budgets), `docs/LAB_MIGRATION_MATRIX.md` (Boots2Bytes crosswalk), `docs/LAB_ASSESSMENT_STANDARD.md`, `docs/specs/MODULE_STANDARD.md`.

### Locked scope boundary (owner clarification, 2026-09-30)

- The existing native MNTA Guided Labs and Assessment Labs are the core course experience and stay unchanged.
- Imported/CLI/PowerShell/cloud-shell work belongs only in each module's separate Optional Labs section.
- Optional Labs do not gate module completion, unlock Assessment Labs, contribute to the graded score, or replace the native MNTA case/SIEM interface.
- Do not create graded "assessment copies" of imported labs.
- Keep the existing module-page placement, labels, links, registration order, navigation, and frontend exactly as they are. This plan changes only what happens after a learner launches an Optional CLI lab.
- Do not edit `portal/index.html`, `portal/soc-analyst-module-*.js`, the native SIEM/case consoles, shared portal grading, or module wiring under this plan.
- New PowerShell/cloud-shell simulations may be built and validated inside the imported-labs app, but wiring new cards into course modules requires a separate owner request.

### Scope correction audit (owner review, 2026-09-30, end of day)

The "Optional Labs only" premise was wrong for two of the four target labs. The portal wires imported labs into core course slots:

| Imported lab | Portal wiring (unchanged, not ours to edit) | Consequence |
|---|---|---|
| `sa-2` | Module 02 **Guided Lab** `guided-sa2` + **Assessment Lab** `assessment-copy-2`; Module 10 Additional Lab | Must stay byte-identical to the pre-rewrite lab |
| `sa-5` | Module 02 **Guided Lab** `guided-2` + **Assessment Lab** `assessment-copy-1` | Must stay byte-identical to the pre-rewrite lab |
| `sa-3` | Module 08 Additional Lab card titled "Web Application Security Assessment" | Internals may change; title must match the card |
| Splunk-track modules | Module 07 **Assessment Labs** (GRE, HTTP); Module 04/06/07 Additional Labs | Shell chrome must not change |
| `sa-4`, `sa-6`–`sa-9`, `vm-2` | Not linked from any module | Optional/imported-only |

Corrections applied:

- `sa-2` restored to the shipped 13-step LinuxTerminalShell lab (lab block identical to HEAD). The Operation Night Shift share-review + host-integrity rewrite now lives as **`sa-9` File Server Integrity Triage** (step ids `sa-9.*`), unlinked from any module like `sa-6`–`sa-8`.
- `sa-5` engine (`src/systems/iam-review.js`) and `scripts/iam-review-check.mjs` restored to HEAD; the S1 scenario-engine port is reverted. `scenario-engine.js` remains for the new engines.
- Vendor sweep reverted outside CLI internals: Splunk shell chrome (`lab-shells.jsx`), track catalog label/action, AD and Vuln Mgmt catalog descriptions, the whole `vm-2` lab (data, shell, source snapshot, manifest, routing).
- `sa-3` keeps the S7 finding-validation internals but its title is back to "Web Application Security Assessment" to match the Module 08 card.
- The new portal KQL dependency (`../../kql-engine.js`) is now optional at boot. Before, a failed load showed "Failed to start app" for **every** imported lab; now only `sa-8` queries degrade.
- Known weakness: `route-smoke.mjs` screenshots are taken without a virtual-time budget and capture the loading screen; its DOM check is the real assertion. It reported pass while screenshots showed a boot failure.

---

## 0. Pre-work status (verified 2026-09-30)

The two live bugs recorded in the 2026-09-23 wiring handoff are **no longer reproducible**:

| Bug | Result | Evidence |
|---|---|---|
| `mod.fields` crash on project-lab routes (`ad-2`) | All 25 currently-wired lab routes render with zero page errors / console errors in headless Chromium | `ad-2` removed from routes (`data.js?v=20260924-ad2-sa1-removed`); `mod.fields` guarded in `lab-shells.jsx:464`, `module-page.jsx:2511`, `labPlayer.jsx:230` |
| Lab exit buttons redirect to `#/login` | Every lab's Back control posts `mission-next-lab:exit` to the parent; the frame never navigates to login | `src/app.jsx` `handleBackFromLab()`; portal listener in `portal/app.js` (`viewMissionNextLab`) returns to `#/program/<slug>/module/<n>` |

Test method: a same-origin harness framed each lab exactly as `viewMissionNextLab()` does (`?mntModule=soc-NN&embed=1#<route>`), Supabase calls blocked. **Not tested:** the authenticated portal round-trip (needs a real student login). Do one manual click-through on the live site before release.

---

## 1. Why a deep rewrite

The current CLI labs are ports of a beginner sysadmin/pentest repo (`0xrajneesh/Security-Assessments-projects-for-Beginners`). They run, but they don't teach the SOC analyst role the course certifies.

| # | Problem | Where | Consequence |
|---|---|---|---|
| P1 | **Install/setup busywork.** ~40% of steps are `apt install X`, `start Logstash`, `download Splunk .deb`, validated only by `commandExecuted` | sa-2, sa-3, sa-4 | Students get points for typing, not reasoning. No curriculum objective maps to "install auditd". |
| P2 | **Role drift.** Hardening (sa-2) and offensive tooling (sa-3: nikto, sqlmap, wapiti) aren't analyst work | sa-2, sa-3 | Contradicts M1 lessons 03/07: analyst decision boundaries and escalation authority |
| P3 | **Split objective.** sa-2 mixes ACL review (fits M2) with integrity/rootkit checks (fits M5/M10) | sa-2 | Half the lab doesn't serve the module it sits in |
| P4 | **Offensive framing + vendor branding.** No authorized-use framing; UI still says "Burp Suite Professional v2024.4" | sa-3 | Crosswalk already required vendor neutralization |
| P5 | **Best SOC fit is unwired.** sa-4's auth.log → brute force → `systemctl stop auditd` is a textbook detection | sa-4 | M3 (SIEM & Log Analysis) has no Linux log triage |
| P6 | **Answer keys ship to the browser.** `expected: ['other::rwx']`, `'/etc/sudoers'`, `'temp.contractor'`, `'bindshell'` | all | Devtools reveal the optional lab's findings instead of letting the learner investigate them |
| P7 | **No IR lifecycle.** Steps aren't tagged to any phase; students never go from detection through recovery | all | M1 lesson-08 and M9 teach the lifecycle, but the hands-on work doesn't use it |
| P8 | **Linux-only terminal.** No PowerShell and no cloud shell, though most SOC jobs are Windows/Entra/Sentinel-heavy and much triage happens in a cloud shell | all | Gap between the course and entry-level job postings |

sa-5 (the IAM access review) is the exception. It already has a stateful engine (`src/systems/iam-review.js`): state-based checks, `deny()` guidance, a ticket with authority, preserved evidence and a case note. **sa-5 is the reference pattern for every rewrite below.**

---

## 2. Design principles (apply to every rewritten lab)

1. **Analyst role, explicit authority.** Every lab opens with a ticket naming who authorized what. The student validates, scopes, preserves and escalates. Remediation happens only when the ticket grants it (as sa-5 does). Otherwise the deliverable is a request to the owning team.
2. **Every step carries two tags:** a curriculum objective key (`soc-NN-lesson-NN` / SOC-101.x) and an IR phase (§3). Any step that can't be tagged gets cut.
3. **No install steps.** The environment is pre-provisioned, like a real SOC jump box. Tool setup appears only when the setup itself is the lesson (e.g. "confirm the forwarder is sending — it isn't, and that's the finding").
4. **State-based validation, not string matching.** Follow the `iam-review.js` model: commands change a simulated state, and checks ask "is the state correct?" (grant removed, evidence hashed before it was touched, VM built from the approved image). Accept several valid command paths.
5. **Findings stay inside the optional lab record.** Free-text conclusions use a readable case-note shape, but they do not create a graded submission or compete with the native module Assessment Lab's instructor-review artifact.
6. **Vendor-neutral chrome, real command syntax.** No product logos or product names in the UI. Commands use real, publicly documented syntax (`Get-WinEvent`, `az vm create`, `journalctl`) because that syntax is the job skill. *(Open decision D1.)*
7. **One incident, many lenses.** All the labs share one storyline (§4). Each lab is one phase or one viewpoint, and M12 composes them.
8. **Answer protection (P6).** Keep expected values out of the lab definition objects. Derive them at runtime from fixture state or store them as salted hashes. Server-side grading is deferred unless a future owner decision makes these labs assessed. See §8.

---

## 3. Incident response lifecycle framing

Student-facing phases follow the classic NIST SP 800-61 model that M1 lesson-08 already teaches. The course should also say that **SP 800-61 Rev. 3 (April 2025)** reorganized IR around the CSF 2.0 functions (Govern/Identify/Protect/Detect/Respond/Recover). Mapping:

| Phase (student-facing) | CSF 2.0 function | What the CLI work looks like |
|---|---|---|
| **Preparation** | Govern / Identify / Protect | Confirm ticket authority, confirm logging and forwarding health, know the baseline (AIDE db, golden image) |
| **Detection & Analysis** | Detect | Query logs (`grep`/`awk`/`journalctl`, `Get-WinEvent`, KQL through the cloud shell), build a timeline, scope, pivot on IOCs |
| **Containment** | Respond | Disable the account, revoke sessions, isolate the host (firewall/NSG), take a snapshot *before* any change |
| **Eradication** | Respond | Remove persistence (sudoers rule, Run key, scheduled task, bindshell unit), then verify through effective state |
| **Recovery** | Recover | **Script the rebuild:** provision a clean replacement VM from the approved image, apply the baseline, verify, reconnect monitoring |
| **Post-Incident** | Identify (improvement) | Case note, detection-gap finding (auditd was stoppable without an alert), a proposed rule for M4 |

Each lab's step list names its phase in the lab-player rail, e.g. `DETECT · 2/5`, so students always know where they are in the cycle.

---

## 4. The shared storyline: "Operation Night Shift" (working title)

The current fixtures already contain most of this incident. It just isn't connected:

1. A contractor credential (`temp.contractor`) is brute-forced from `198.51.100.42` at 02:14–02:15 UTC, outside approved hours and off the VPN. *(Already in sa-5's `auth.log`.)*
2. The attacker uses an unauthorized `NOPASSWD` sudo rule, then **stops auditd**. *(Already in sa-4.)*
3. `/etc/sudoers` is modified and a **bindshell** listener persists. *(Already in sa-2's AIDE/chkrootkit results.)*
4. **New:** the same identity is synced to the directory and signs in to a Windows jump host (4624 type 10), drops a scheduled task, and connects to a cloud subscription.
5. **New:** in the cloud, the compromised identity starts an unapproved VM and opens an NSG rule.
6. Recovery means rebuilding the compromised Linux file server and the cloud VM from approved images, by script.

Each lab gets **fresh fixture variants** (different IPs, times, account names) for its Prove It copy, so answers from the Practice copy don't carry over.

---

## 5. Lab-by-lab rewrite spec

Lab minutes must fit the approved budgets in `CURRICULUM_MAP.md`. Any change to allocations needs curriculum/compliance review (flagged in §9).

### L1 — sa-5 → "Access Review & Emergency De-Privilege" (M2, optional) — *light touch*
- **IR phases:** Preparation → Detection & Analysis → Containment → Post-Incident note.
- **Keep:** the whole stateful SSH/sudo flow.
- **Add:**
  - `sha256sum /var/log/auth.log` recorded *before* any change (evidence integrity, which M10 builds on)
  - explicit phase tags
  - a step where the student *declines* to delete the account and cites the roster's "do not delete" clause (decision boundary)
- **Fix P6:** move `02:15:34` / `198.51.100.42` out of the regex in `iam-review.js:218` into fixture-derived values.
- **Objectives:** soc-02-lesson-03/04/06, soc-01-lesson-07/09.

### L2 — sa-4 → "Linux Log Triage: The Audit Gap" (M3-aligned optional) — *rewrite inside the imported app; no module wiring*
- **IR phases:** Preparation (forwarder health) → Detection & Analysis → Post-Incident (detection gap).
- **Cut:** every install/start step for rsyslog, logwatch, logrotate, ELK and Splunk.
- **Tasks:**
  1. Confirm the host forwards to the SIEM (`cat /etc/rsyslog.d/50-forward.conf`, `systemctl status rsyslog`) and find that forwarding stopped at 02:16 (finding: telemetry gap).
  2. Triage `auth.log` with `grep`/`awk`/`sort | uniq -c`: failed-password burst → success → sudo → `systemctl stop auditd`.
  3. `journalctl -u auditd --since` shows the stop. `ausearch` shows the audit gap.
  4. Build a UTC timeline of 5 required events (graded by selecting events in order, several valid orders allowed for concurrent events).
  5. Case note + **detection-gap finding**: "auditd stop by a non-admin-approved account raised no alert". This becomes the input to M4's rule-tuning lab.
- **Objectives:** soc-03-lesson-01/03/04, SOC-101.4/.5.

### L3a — sa-2 part A → "Least-Privilege Share Review" (M2, optional) — *trim*
- **IR phases:** Preparation (scheduled access review) → Detection & Analysis.
- **Keep:** `ls -l`, `getfacl`, the `other::rwx` finding.
- **Change:** the ticket authorizes the fix → `setfacl`/`chmod` → verify. Add "who could have read payroll? (`other` = every local account, including `temp.contractor`)" to tie in the storyline.
- **Cut:** everything about auditd, AIDE and chkrootkit (moves to L3b).

### L3b — sa-2 part B → "Host Integrity & Persistence Triage" (M10, optional) — *rewrite*
- **IR phases:** Detection & Analysis → Containment (request) → Eradication → evidence handling.
- **Environment:** AIDE and chkrootkit already installed; the baseline db is from the golden-image build.
- **Tasks:**
  1. Preserve first: create `/evidence/IR-<id>/`, `cp -p` the changed files, `sha256sum` them, and append to a chain-of-custody log (`custody.csv`: item, hash, time, handler, reason). Graded on order: hashing after modification fails.
  2. `aide --check` → `/etc/sudoers` and `/etc/systemd/system/netd.service` changed.
  3. `ss -tlnp` → listener on :31337 owned by `netd`. `ps -ef --forest` / `systemctl cat netd` → persistence unit.
  4. Decision: eradicate on-host, or request a rebuild? Per the ticket, a root-level compromise means **rebuild** (hands off to L5/L6 recovery). The student still documents every persistence artifact for the rebuild checklist.
  5. Case note separating observed facts, analysis and unknowns (soc-10-lesson-02).
- **Objectives:** soc-10-lesson-01/02, soc-05-lesson-07/08, SOC-101.6.

### L4 — NEW PowerShell #1 → "Windows Jump Host Triage" (M5, optional) — *new build*
- **IR phases:** Detection & Analysis → Containment handoff.
- **Shell:** extend `PowerShellShell.jsx` (currently a regex `commandMap`) with a stateful engine modelled on `iam-review.js`: an object pipeline subset (`Where-Object`, `Select-Object`, `Sort-Object`, `Format-Table`, `Export-Csv`).
- **Tasks:**
  1. `Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625,4624}` → RDP logon (type 10) by the same identity from the storyline IP.
  2. 4688 process creation → `Get-CimInstance Win32_Process` parent/child chain (soc-05-lesson-02/03).
  3. Persistence: `Get-ScheduledTask | Where TaskPath -notlike '\Microsoft\*'`, Run keys through `Get-ItemProperty HKLM:\...\Run`.
  4. `Get-FileHash` the dropped binary. Assess signer, prevalence and path, and don't treat an unknown hash as proof (soc-05-lesson-06).
  5. `Get-NetTCPConnection -State Established` → beacon to a known-bad IP.
  6. Handoff requesting containment, with scope limits stated (soc-05-lesson-09/10).
- **Replaces/absorbs:** the optional ma-4 Procmon lab stays optional. L4 becomes the CLI core.

### L5 — NEW PowerShell #2 → "Contain, Collect, Rebuild" (M9, optional) — *new build*
- **IR phases:** Containment → Eradication → **Recovery (scripted VM rebuild)** → Post-Incident.
- **Tasks:**
  1. **Containment (authorized in the ticket):** `Disable-ADAccount`, `Revoke-MgUserSignInSession` (simulated), host isolation through `New-NetFirewallRule` that allows only the management subnet. Verify each one through state, not output text.
  2. **Collection:** export the relevant logs (`wevtutil epl`), `Get-FileHash` them, and write a custody record with `Export-Csv`.
  3. **Eradication:** remove the scheduled task and Run key, then verify they're gone.
  4. **Recovery by script:** the student writes `Rebuild-JumpHost.ps1` in an in-lab editor. The script must:
     - build a new VM from the **approved golden image** (not the compromised disk)
     - attach it to the isolated recovery network
     - apply the baseline (e.g. a DSC-style config or a named hardening script)
     - enrol it in monitoring (agent + SIEM workspace)
     - tag it with the incident ID
     - verify all of the above before swapping DNS/traffic
  5. Post-incident note: root cause, gap, recommended control.
- The student "runs" the script in a simulated interpreter (§6).
- **Objectives:** soc-09-lesson-01, SOC-101.6/.7.

### L6 — NEW Cloud Shell → "Cloud Identity & Workload Incident" (M9 optional) — *new build*
**Why:** Yes. Cloud shell is central to SIEM work. Sentinel/Defender analysts run KQL, pivot on identities and take response actions from Azure Cloud Shell (Bash + `az`, or PowerShell + Az/Graph modules). AWS CloudShell plays the same role for GuardDuty/CloudTrail triage. It's also the most natural home for the VM-creation scripting.

- **Shell:** a browser "cloud shell" pane with a Bash/PowerShell toggle and a virtual `$HOME` that persists across the session. **Reuse `portal/kql-engine.js`** (built for M03) as the backend for log-analytics queries, so there's only one query engine.
- **IR phases:** full cycle.
- **Tasks:**
  1. **Detect:** `az monitor log-analytics query -w <ws> --analytics-query "SigninLogs | where ..."` → risky sign-in by the storyline identity. Pivot to `AzureActivity` → an unapproved `Microsoft.Compute/virtualMachines/write` and an NSG rule allowing 0.0.0.0/0:22.
  2. **Scope:** `az resource list --tag`, `az vm list -d`, `az network nsg rule list` → which resources the identity touched.
  3. **Contain:**
     - disable the user and revoke sessions (Graph PowerShell)
     - `az network nsg rule delete`, or a higher-priority deny rule
     - **snapshot the rogue VM's OS disk before deleting anything** (`az snapshot create`): the cloud equivalent of forensic imaging (links to M10)
  4. **Eradicate:** deallocate/delete the rogue VM *after* the snapshot is verified. Remove the role assignment the attacker added (`az role assignment list/delete`).
  5. **Recover by script:** write `rebuild.sh`, which runs `az vm create` from the approved image with no public IP, the recovery NSG, the monitoring agent extension, a diagnostic setting pointed at the SIEM workspace, and incident tags. Then confirm with `az vm show` that the new host is sending heartbeat data (a KQL `Heartbeat` query).
  6. **Post-incident:** propose a KQL analytic rule for "NSG rule opened to internet by non-network-team identity". This feeds back into M4.
- **Stretch/optional:** an AWS CloudShell variant (CloudTrail `lookup-events`, GuardDuty findings, `aws ec2 create-snapshot`) as an optional lab. *(See D2.)*

### L7 — sa-3 → "Validate a Web Finding" (M8, optional) — *reframe*
- **IR phases:** Detection & Analysis (vulnerability → exploitation evidence).
- **Cut:** the student running nikto/sqlmap/wapiti and the install steps. **Replace with:** the authorized AppSec team's scanner report, already produced (shown as a file). The student:
  - greps the web access logs for the single-quote → 500 pattern
  - checks whether anyone other than the scanner hit it (exploitation vs. scan noise)
  - checks the asset role and exposure
  - writes the prioritization rationale (soc-08-lesson-01/03/04)
- **UI:** replace "Burp Suite Professional" chrome with a neutral "Traffic Inspector". Add a one-line authorized-testing banner wherever raw attack traffic appears.

---

## 6. Simulated script execution (L5/L6 recovery steps)

The core new capability. Students must be able to write a *script* and have it graded on outcome, not text.

- **Editor pane:** a small code editor with line numbers and syntax highlighting (the portal already ships `kql-editor.js`; reuse its patterns). Save/Run buttons.
- **Interpreter:** parse a **restricted subset**: variables, simple `if`, `foreach`/`for`, and the supported cmdlets/`az` subcommands. Each supported command is a pure function `(state, args) → state' + output`. Unsupported syntax gives a realistic error, not a silent pass.
- **Grading by resulting state**, checked after Run:

  | Check | Passes when |
  |---|---|
  | Image | VM source = approved golden image ID, not the compromised disk/snapshot |
  | Network | no public IP; NSG = recovery NSG; only the management subnet can reach 22/3389 |
  | Monitoring | agent extension present AND a diagnostic setting points at the SIEM workspace AND a `Heartbeat` row appears |
  | Hygiene | incident tag present; no secrets hard-coded (fail if the script contains a literal password: use a Key Vault reference or `Get-Credential`) |
  | Verification | the script itself checks state (`az vm show`/`Get-VM`) before declaring success |
  | Idempotence (Prove It only) | running the script twice doesn't create a second VM |

- **Several valid scripts pass.** Parameter order, variable names and PowerShell vs. Bash are all free.
- **Safety:** nothing executes against a real host or cloud. The engine header must say so, as `iam-review.js` does.

---

## 7. Curriculum alignment (existing frontend placement stays unchanged)

| Lab | Module | Slot | Budget source (CURRICULUM_MAP) | Change |
|---|---|---|---|---|
| L1 access review | M2 | Existing Optional Lab placement unchanged | supplemental; outside graded allocation | rewrite `sa-5` internals only |
| L3a share review | M2 | Existing Optional Lab placement unchanged | supplemental; outside graded allocation | rewrite `sa-2` internals only |
| L2 log triage | M3-aligned | Imported-app catalog only unless separately wired | supplemental; outside graded allocation | rewrite `sa-4` internals only |
| L4 PS triage | M5-aligned | Imported-app catalog only unless separately wired | supplemental; outside graded allocation | new internal lab |
| L5 PS contain/rebuild | M9-aligned | Imported-app catalog only unless separately wired | supplemental; outside graded allocation | new internal lab |
| L6 cloud shell | M9-aligned | Imported-app catalog only unless separately wired | supplemental; outside graded allocation | new internal lab |
| L3b integrity triage | M10-aligned | Existing Optional Lab placement unchanged | supplemental; outside graded allocation | rewrite `sa-2` internals only |
| L7 web finding | M8 | Existing Optional Lab placement unchanged | supplemental; outside graded allocation | rewrite `sa-3` internals only |
| Capstone | M12 | unchanged | soc-12 240 | no CLI rewrite work is wired into the capstone |

These labs remain supplemental and do not consume or change the compliance-controlled core lab minutes. This table is an objective-alignment map, not authorization to change where cards render. Moving or adding any lab on a course-module page requires a separate owner request; moving one into Guided Lab, Assessment Lab, or the capstone also requires curriculum/compliance review.

---

## 8. Architecture work (shared, do first)

1. **Generalize `iam-review.js` → `scenario-engine.js`:** `buildFs()`, `state`, `commands{}`, `checks{}`, `deny(msg)`, `phase` tags. sa-5 becomes its first consumer, so a regression there shows the refactor broke something.
2. **PowerShell engine:** a stateful object pipeline on top of the existing `PowerShellShell.jsx` rendering.
3. **Cloud shell pane:** Bash/PowerShell toggle, shared VFS (`B2B_VFS` → namespaced per `lab_attempts` id, per the crosswalk), `az`/Graph command modules, KQL through `portal/kql-engine.js`.
4. **Script runner** (§6).
5. **Answer protection (P6):**
   - *Phase 1, client:* no literal expected values in lab objects; checks compare against fixture-derived state; free-text facts checked through salted hashes.
   - *Phase 2, server:* deferred while the labs remain optional and ungraded; require it before any future assessed use.
6. **Optional case-note integration:** conclusions use a readable NST-like shape with a phase-tagged evidence list, stored as optional-lab progress only; do not call the graded `recordLabAttempt` path.
7. **Fixture variants:** at least 2 replay variants per lab, generated from one seed; variants are for practice depth, not Practice/Prove copies.

---

## 9. Open decisions for Alex

| # | Decision | Recommendation |
|---|---|---|
| D1 | Real command syntax (`az`, `Get-WinEvent`) vs. invented neutral syntax | **Real syntax, neutral chrome.** The syntax is public and is the transferable job skill; logos and product names stay out. |
| D2 | Cloud: Azure only, AWS only, or both | **Azure core** (Sentinel/Defender dominate entry SOC postings and match the KQL engine already built); AWS as an optional variant later |
| D3 | Cloud shell lab home | **Resolved 2026-09-30: M9 Optional Labs only.** It is not a Prove It replacement. |
| D4 | Do L2/L4 become required (graded) or stay optional? | **Resolved 2026-09-30: stay optional.** No promotion is part of this plan. |
| D5 | Does the analyst perform containment directly or request it? | Both, explicitly: L1/L5/L6 tickets grant it; L3b/L4 are request-only. Teaching the boundary *is* the lesson. |
| D6 | Keep sa-3 at all? | Keep as optional L7; retire it if M8's vulnerability console already covers the objective |

---

## 10. Sprint plan

Per the sprint-handoff rule: update this doc and a handoff MD every sprint. Use low-token subagents for bounded implementation work; the primary agent retains scope, review, verification and checklist ownership.

| Status | Sprint | Deliverable | Sub-agent | Acceptance |
|---|---|---|---|---|
| Partial | S0 | Decisions D1–D6 recorded here | owner | D3/D4 and the strict Optional-Labs-only boundary are resolved; D1/D2/D5/D6 remain open |
| **Done; sa-5 port reverted** | S1 | `scenario-engine.js` extracted; sa-5 port reverted (sa-5 is a Module 02 Guided/Assessment Lab) | low-token | sa-5 passes end to end in the headless harness; no answer literals in the lab definition |
| **Done 2026-09-30** | S2 | Storyline bible: shared fixtures (logs, event XML, activity log, Heartbeat), 2 variants each | low-token + review | one seed generates consistent cross-lab artifacts |
| **Done; L3 moved to sa-9** | S3 | L2 (log triage) + L3a/L3b split (L3 now `sa-9`; `sa-2` restored) | low-token + review | every step phase-tagged and objective-tagged; no install steps; Operation Night Shift fixtures reused; state-derived grading; >=2 tested command paths (verified 2026-09-30, see evidence) |
| **Done 2026-09-30** | S4 | PowerShell engine + L4 | low-token + review | pipeline subset works; 3+ valid command paths per command-graded step |
| **Done 2026-09-30** | S5 | Script runner + L5 | low-token + review | state-graded rebuild; hard-coded-secret check fails a literal password |
| **Done 2026-09-30** | S6 | Cloud shell pane + L6 (reuses `kql-engine.js`) | low-token + review | full IR cycle; snapshot-before-delete enforced |
| **Done; sweep reverted** | S7 | L7 reframe (title kept); vendor-string sweep reverted outside sa-3 | low-token + review | listed student-visible surfaces contain no Nessus, Burp or Splunk vendor chrome |
| **Done 2026-09-30** | S8 | Imported-app integration and regression pass | low-token + review | sa-2 through sa-8 and refreshed routes render; native course frontend untouched |
| Deferred | S9 | Server-side validation (Phase 2 of P6) | out of scope while labs remain ungraded | revisit only if an optional lab later becomes assessed |

### Sprint evidence

- **S1 — complete 2026-09-30:** added `src/systems/scenario-engine.js`; `sa-5` now consumes its isolated state, command dispatch, named checks, denial and phase primitives without changing the existing 15-step learner workflow or saved step IDs. IP, successful-login time and failed-password count are derived from `auth.log`; mutation tests prove grading follows changed fixture values. `npm run check`, `bash bin/ci-check.sh`, `git diff --check`, and a direct headless-Chrome render of the real `sa-5` embedded route passed. The broader `npm run smoke:routes` still fails on its pre-existing `#/tracks` text expectation (`Mission Next Lab`); the same failure was reproduced against an untouched `HEAD` archive, after all preceding lab routes rendered.
- **S2 — complete 2026-09-30:** added deterministic Operation Night Shift A/B fixtures with separate truth metadata and consistent Linux authentication/audit/persistence evidence, structured Windows 4625/4624/4688 records plus event XML, scheduled-task/Run-key/beacon evidence, cloud sign-in/activity/NSG/role evidence, and a strictly ordered snapshot → verification → deallocation/deletion → approved-image recovery → Heartbeat lifecycle. Focused tests prove same-seed determinism, A/B variation, cross-artifact consistency, reserved-address/domain safety and object isolation. `npm run check`, `bash bin/ci-check.sh` and `git diff --check` passed.
- **S3 — complete 2026-09-30 (first pass was partial; finished and re-verified):**
  - **Built:** sa-4 (L2, 12 steps) and sa-2 (L3a 5 steps + L3b 8 steps, 4 exercises) now build their virtual host from the S1 scenario engine and the S2 fixtures. `src/systems/night-shift-common.js` (shared SHA-256, awk subset, guarded redirects, seed pick), `src/systems/linux-log-triage.js` and `src/systems/host-integrity.js` (engines), `src/shells/NightShiftShell.jsx` (terminal wrapper with workspace resume), `src/systems/labPlayer.jsx` (passes `{user, labId}` to `environment.fs`). The earlier unwired `linux-log-triage.js` was replaced, not reused.
  - **Seeds:** seed A or B is a stable hash of learner + lab id, so a learner always gets the same variant and both variants are reachable. sa-5 itself is not seeded (fixed data); this is a new behavior for sa-2/sa-4 only.
  - **Grading:** every expected value (account, source IP, times, failure count, unit, share ACL line, flagged paths, seized hashes, listener port) is recomputed from the virtual host's own files at validation time. The lab definitions hold no fixture answers; a check scans both seeds' values against the serialized definitions. Steps use `nightShiftTriage` / `nightShiftHost` validators and no command-string regexes. Case notes are checked for fact tokens plus concept keywords (detection gap, proposed rule, escalation, rebuild request), not for a single phrase.
  - **Authority:** sa-4 is read-only (service and account changes, and writes outside `/home/analyst` and `/tmp`, are refused). sa-2 permits the share fix only on the share and only when that step is active; L3b remediation (rm, mv, kill, systemctl stop/disable, visudo, account changes, redirects into `/etc`) is refused as request-only. Evidence steps require `cp -p` copies matching the state AIDE reported and a `custody.csv` row (item, sha256, time, handler, reason) recorded after the copy.
  - **Tags:** every step has an IR phase (preparation, detection, containment, eradication, postIncident) and a curriculum objective key; no install/setup steps remain (checked by pattern).
  - **Command paths (each exercised in tests):** burst via grep, awk, `sort | uniq -c`, per-source count; audit stop via `journalctl`, `systemctl status`, `ausearch`, grep of the audit log or syslog; forwarder gap via `tail`, `systemctl status rsyslog`, grep; share listing via `ls -l`/`ls -ld`/`stat`; fix via `chmod -R o-rwx`, numeric mode, `setfacl`; `aide --check`/`-C`/`--config`; `ss`/`netstat`; `ps --forest`/`pstree`/`systemctl cat|status`/reading the unit.
  - **Progress ids:** lab ids and routes unchanged. Steps whose meaning survives keep their shipped id (`sa-2.ex0.s1-s4`, `sa-4.ex1.s2`, `sa-4.ex4.s2`, `sa-4.ex4.s3`). Ids of the removed install/setup steps are retired and deliberately not reused (a check enforces this), so an old install completion cannot tick a new step; those completions no longer count toward the rewritten labs. New steps use previously unused ids. sa-5 is untouched and `iam-review-check.mjs` passes.
  - **Verification (2026-09-30):** `npm run check` passes and now runs `scripts/linux-log-triage-check.mjs` and `scripts/host-integrity-check.mjs` (both seeds solved end to end against an independent fixture oracle; tag and no-install checks; fixture mutation and runtime-file mutation move grading; wrong, premature and decoy answers rejected; alternate paths accepted; remediation refused). `bash bin/ci-check.sh` exits 0 but only runs `iam-review-check.mjs` for the imported app, so the two new checks are covered by `npm run check`, not CI (`bin/` is outside this plan's boundary). `git diff --check` clean. `npm run smoke:routes` fails only on the known `#/tracks` text expectation after the earlier routes render. Headless Chrome rendered the real embedded sa-4 and sa-2 routes (12 and 13 steps), typed commands ran, step completion and refusal messages showed.
  - **Not verified:** the full 12/13-step solve in a browser (Node harness covers it), resume-after-reload from `localStorage` in a browser, and instructor-dashboard progress display for the new ids.
- **S4 — complete 2026-09-30:** added `src/systems/powershell-triage.js` and the optional **Windows Jump Host Triage** lab (`sa-6`) using seeded Operation Night Shift Windows fixtures A/B. The existing `sa-4` Linux Log Triage route and learner progress IDs remain intact. The PowerShell shell now dispatches to the stateful simulator when a lab supplies it and preserves legacy `commandMap` behavior for existing Windows labs. Supported object pipeline: `Get-WinEvent`, `Get-CimInstance`, `Get-ScheduledTask`, `Get-ItemProperty`, `Get-FileHash`, `Get-AuthenticodeSignature`, `Get-NetTCPConnection`, `Where-Object` (`-eq/-ne/-in/-like/-notlike/-gt/-lt`), `Select-Object`, `Sort-Object`, `Format-Table`, and `Export-Csv`; unsupported commands and expressions return an explicit simulation error. Checks grade fixture-derived resulting objects, not command text. L4 includes logon correlation, 4688/process-tree triage, scheduled task and Run-key persistence, hash/signature assessment, beacon review and a read-only containment handoff. Three alternate command paths per command-graded evidence step are exercised for both variants in `scripts/powershell-triage-check.mjs`; handoff/hash assessment checks cover expected semantics. The lab is listed in the imported app's security-assessments catalog only; no course portal/module wiring changed. **Verified:** `npm run check`, `git diff --check`, and Node syntax checks passed. Browser interaction/resume was not separately verified.
- **S5 — complete 2026-09-30:** added fixture-provided Windows recovery image/network/baseline/monitoring values and `src/systems/powershell-rebuild.js`, a browser-only restricted interpreter for the optional `sa-7` **Contain, Collect, Rebuild** lab. `src/shells/PowerShellScriptShell.jsx` provides the line-numbered, syntax-colored script editor, Save/Run controls, command prompt and simulation output; script and simulator state resume from local storage. Supported script constructs are scalar/array/hashtable variables, simple `if/else`, `foreach`, and counted `for`, plus a whitelist of simulated PowerShell cmdlets; unsupported syntax errors explicitly. Authorized containment updates account/session/firewall state; collection requires Security log export before hash and custody CSV; eradication is scoped to the fixture task/Run entry and requires verification. Rebuild checks actual simulated VM state for the fixture-approved Windows image, isolated VNet/subnet/NSG with no public IP and only management-subnet 22/3389 rules, DSC baseline, the exact monitoring extension, SIEM diagnostics, a query-produced Heartbeat row for the rebuilt VM/workspace, incident tag, and a post-configuration VM query before any success output. DNS/user-traffic cutover is explicitly outside the ticket and handed to the separate change owner. Same-name reruns reuse the VM. Literal password values and common secret aliases/parameters are rejected; credential prompts and Key Vault references remain permitted. The catalog entry is inside the imported app only; course module wiring is unchanged. `scripts/powershell-rebuild-check.mjs` covers both fixture variants, command authority, evidence ordering, alternate script variable/parameter arrangements, `if`/loops, unsupported syntax, literal-secret rejection, false success, unrelated Heartbeat query, wrong monitoring extension, unsafe image/public IP, and idempotent rerun. **Verified:** `npm run check`, `git diff --check`, Node syntax checks, and headless-Chrome render of the direct `sa-7` route with the script editor and command area present. A full interactive browser solve and authenticated portal round-trip were not verified.

- **S6 — complete 2026-09-30:** added `src/systems/cloud-incident.js`, `src/shells/CloudShell.jsx`, and optional `sa-8` **Cloud Identity & Workload Incident** inside the imported app. Cloud Shell provides Bash/PowerShell mode selection, a persistent virtual home, command pane, and the shared script editor pattern. Log Analytics commands delegate to `portal/kql-engine.js`; cloud actions are fixture-backed and never contact a tenant. The full cycle covers sign-in/activity pivots, resource scope, approved identity/session and NSG response, snapshot verification before rogue-VM deletion, role removal, a restricted `rebuild.sh`, and a workspace/VM-specific Heartbeat check. `scripts/cloud-incident-check.mjs` exercises both fixture seeds, ordering, unsupported operations and rebuild state/idempotence. **Verified:** focused cloud check, full `npm run check`, and direct headless route rendering.
- **S7 — complete 2026-09-30:** reframed `sa-3` as a four-step authorized report review, access-log correlation, asset exposure check, and prioritization/handoff exercise. The shell presents neutral Traffic Inspector evidence and authorized-testing context; no install or active scanning steps remain. Neutralized the `vm-2` vulnerability-scanner catalog/lab/source copy and visible SIEM search naming in the listed imported-app surfaces while retaining internal route identifiers for compatibility. `scripts/web-finding-check.mjs` covers the new flow and neutral chrome. **Verified:** full `npm run check`, focused web-finding check, `git diff --check`, and route smoke.
- **S8 — complete 2026-09-30:** the imported-app check chain includes S6/S7 focused checks. `scripts/route-smoke.mjs` checks direct rendering of `sa-2` through `sa-8` and the existing refreshed routes; the stale `#/tracks` label expectation was corrected to the current page heading without changing the page. **Verified:** `npm run check` and `npm run smoke:routes` (15 routes, headless Chrome). Repository `bash bin/ci-check.sh` is included in this pass; it runs only the IAM focused check for the imported app, so new lab checks are covered by `npm run check`. No course portal, module frontend, Guided/Assessment Labs, or native grading files were edited for S6–S8. Full interactive solves and resume-after-reload were not browser-tested.

---

## 11. Out of scope

- Real VMs, containers or cloud tenants: everything stays simulated in the browser.
- Replacing or modifying the native MNTA Guided Labs, Assessment Labs, SIEM/case consoles, their grading, or their instructor-review flow.
- Any course-module frontend, card placement, labels, navigation, registration, or wiring outside `portal/imported-labs/mission-next-labs/`.
- Changes to `portal/app.js`, `supabase/`, `ui/` without the owning dev's sign-off.
- Re-organising the 12-module structure (crosswalk rule: map into existing modules, never add a 13th).
- The AD monitoring product labs (ad-3..7) and the malware tool suite. They're tracked separately in the crosswalk.
