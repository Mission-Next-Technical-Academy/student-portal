# Boots2Bytes → Mission Next Migration Crosswalk (Epic B)

**Status:** Draft crosswalk — complete, not yet owner-reviewed.
**Date:** 2026-09-23
**Inputs:** `archive/historical-plans/BOOTS2BYTES_LAB_INVENTORY.md` (Story A1, accepted), `docs/MISSION_NEXT_LAB_ARCHITECTURE.md`
(Story A2, accepted), `docs/LAB_ASSESSMENT_STANDARD.md`, and a fresh read of the current 12 SOC Analyst
module files (`portal/soc-analyst-module-01.js` through `-12.js`, plus `soc-analyst-module-02-environment.js`).

This document is the Epic B deliverable required by `archive/historical-plans/BOOTS2BYTES_MIGRATION_AGILE_HANDOFF.md` §7. It maps
every inventoried Boots2Bytes component onto the **existing** 12-module curriculum. **It does not authorize
implementation.** Per that section: "Review the matrix before any implementation agent is started." Epic C
(shared adapter) and Epic D (controlled domain migration) remain unauthorized until the owner reviews this
matrix and gives an explicit go-ahead.

## Crosswalk rules applied (from AGILE_HANDOFF §7, Epic B)

- Map tools into the existing 12 modules; never reorganize the curriculum around Boots2Bytes.
- Prefer one shared Mission Next engine over duplicate Boots2Bytes/Mission Next versions.
- Preserve Module 1's successful UX and Module 2's improved identity/network workspace.
- Do not approve a tool only because it exists; it must serve a learning objective.

Two rows below (#7 Kibana/ELK, #9 legacy Event Viewer/Sysmon) exist in the source inventory but are recommended
**against** independent adaptation specifically because of the "prefer one shared engine" rule — they duplicate
#6 and #10 respectively. They're kept in the matrix (not silently dropped) so the reason they're folded in is
visible to reviewers, per the inventory's own classifications.

## Current per-module state (from this session's fresh read)

Progression model: Modules 1–2 guided, 3–6 assisted, 7–9 semi-independent, 10–12 independent
(`docs/specs/MODULE_STANDARD.md`). Every module carries Learn It → Practice It → Prove It; Prove It is a fresh,
independent scenario that must reach instructor review per `docs/LAB_ASSESSMENT_STANDARD.md`.

| Module | Theme | Current tool | Notes for this crosswalk |
|---|---|---|---|
| M1 | SOC foundations / first triage | Guided case console (`soc-01`) | UX reference for the whole course — do not alter its console pattern. |
| M2 | Identity/network trust-path review | Bespoke enterprise console (`soc-analyst-module-02-environment.js`) | Explicitly bounded in its own file header against a second phase rail or competing quiz panel — **preserve, enhance only with owner sign-off.** |
| M3 | Assisted SIEM triage & log correlation | `lab-siem-triage` | No full-fidelity SIEM tool yet — real gap. |
| M4 | Detection tuning, intel enrichment, automation | `lab-detection-rule` | No 1:1 Boots2Bytes analog; extends M3's tool rather than a new shell. |
| M5 | Endpoint & malware investigation | `lab-endpoint-investigation` | No dedicated Windows/malware forensics tool yet — real gap. |
| M6 | Hypothesis-led threat hunt | `lab-threat-hunt` | Should reuse M3's adapted SIEM engine, not a duplicate. |
| M7 | Network & email investigation | `lab-email-triage`, `lab-network-investigation`, `lab-network-email-independent` | Network side has a candidate; email side has no Boots2Bytes analog. |
| M8 | Vulnerability prioritization/exposure | `lab-vuln-prioritization`, `lab-vulnerability-queue` | No dedicated vuln tool yet — real gap, strong fit available. |
| M9 | Incident response | `lab-active-incident`, `lab-independent-containment` | No dedicated Boots2Bytes IR shell; likely composed from terminal/endpoint pieces. |
| M10 | Evidence handling & case reconstruction | `lab-evidence-collection`, `lab-attack-mapping` | No dedicated forensics tool yet — real gap, strong fit available. |
| M11 | SOC operations & communication | `lab-soc-metrics` | Reporting/communication domain — no simulator analog in the inventory. |
| M12 | Capstone | Composes alert/email/SIEM/endpoint consoles | Must compose tools already introduced in M1–M11, never a new interface (AGILE_HANDOFF constraint). Only `CAPSTONE_REUSABLE = TRUE` items qualify, and only after their earlier-module introduction. |

Not covered by any current module and with no natural single-module home: a standalone malware
sandbox/dynamic-analysis workspace and a general-purpose terminal environment. Both are strong ADAPT/EXTRACT
candidates by component quality, but per the "never reorganize the curriculum" rule they must be woven into
an existing module (M5, M9, M10) rather than justify a 13th module.

## Priority scale

- **P0 — Foundational.** Must be resolved before any domain-specific tool migrates; other rows depend on it.
- **P1 — High.** Fills a clearly unmet tool gap in a specific module.
- **P2 — Medium.** Valuable but conditional, secondary, or sequenced after a P1 item.
- **P3 — Low.** Optional or marginal benefit.
- **NOT RECOMMENDED.** Inventory classified `DO NOT USE`, or this audit recommends against porting/duplicating it.

---

## 0. Foundational / cross-cutting infrastructure

These are not module-specific. They are prerequisites for every ADAPT/EXTRACT row below, and they're where
Epic C's proposed adapter (`submitReviewableLabAttempt()`, ARCHITECTURE §8) plugs in.

| SOURCE TOOL | SOURCE FILES | CURRENT BOOTS2BYTES USE | TARGET MISSION NEXT MODULE | PRACTICE USE | PROVE USE | REUSE % | REQUIRED ADAPTATION | DEPENDENCIES | ASSESSMENT INTEGRATION | CAPSTONE REUSE | RISK | PRIORITY |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Schema-based lab orchestration (`LabPlayer` + `LabModule`) | `src/systems/labPlayer.jsx`; `src/data/labs/_schema.js`; 6× `src/data/labs/*.labs.js` | All 29 new-shape labs across every domain | Shared engine consumed by M3–M11; composed (not re-authored) in M12 | Yes, as guidance-mode host | Not as scoring authority — must hand off to the adapter | ~40% (orchestration seam strong; scoring/local-state must be replaced) | Remove answer-reveal-after-5-failures; replace local step-count "completion" with real declared-completion policy; route every submission through the new adapter instead of its own local state | Virtual FS (#3), validator/gating (#2), each domain shell (#4–#14) | Must emit into the `submitReviewableLabAttempt()` envelope (ARCHITECTURE §8), not its own local completion signal | TRUE — orchestration only, never submission/scoring | HIGH — answer leakage, forward-only path, exact-answer bias affect every module built on top of it | P0 |
| Validation/gating/progress/check-on-learning subsystem | `src/systems/validator.js`; `gating.js`; `progress.js`; `checkOnLearning.jsx` | All 29 new-shape labs; legacy labs use a different validator | Shared engine consumed by M3–M11 | Yes | As an evidence source only, not the scoring authority | ~70% for validator/gating logic; ~20% for `localStorage` progress (must be replaced) | Replace `localStorage`-only progress with `LabRuntime`; wire the currently-dead `recordHintShown`; add weighted, multi-path competency aggregation on top of the existing binary predicates | Feeds #1; used by #3–#14 | Predicates become raw evidence contributing to `competencyResults[]`; final state/score come from the shared adapter, per `docs/LAB_ASSESSMENT_STANDARD.md` | TRUE | MEDIUM — binary correctness, string state paths, client-visible expected values | P0 |
| Source-backed scenario & dataset library | `src/data/labs/*.labs.js`; `src/data/sources/*.source.md`; `.manifest.json`; `src/data.js` | Supplies every current route's scenario/fixture data | Cross-cutting data layer beneath whichever tools below are actually adapted | Yes | Yes, as raw material only | ~35% for selected scenarios; not a wholesale port | Strip answer-bearing values from anything shipped to the browser (this is the single largest repeat risk across the whole inventory); confirm license/attribution before reuse; author fresh per-module scenario variants — never the original Boots2Bytes answers, per the inventory's own capstone constraint | Feeds nearly every row below | Not an assessment artifact itself; must not leak expected answers client-side — new fixtures should be authored against `docs/LAB_ASSESSMENT_STANDARD.md` from the start, not retrofitted | TRUE — fresh variants only, never the original answers | HIGH — unresolved license/attribution question, and the clearest path back into "client-visible answer keys" if handled carelessly | P0 |

## 1. Terminal engines and virtual filesystem (Epic D domain 1)

| SOURCE TOOL | SOURCE FILES | CURRENT BOOTS2BYTES USE | TARGET MISSION NEXT MODULE | PRACTICE USE | PROVE USE | REUSE % | REQUIRED ADAPTATION | DEPENDENCIES | ASSESSMENT INTEGRATION | CAPSTONE REUSE | RISK | PRIORITY |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Virtual filesystem (`B2B_VFS`) | `src/systems/virtualFs.js` | Terminal-driven labs across all six domains | M3 (SIEM/terminal work), M9 (containment), M10 (evidence collection), M12 (capstone) | Yes | Yes | ~90% — direct reuse | Wrap under a Mission Next namespace; key each instance to its `lab_attempts` id instead of a global | None (self-contained) | `fileCreated`/file-state predicates feed the evidence array | TRUE | LOW — no permission model, persistence across sessions, or native Windows semantics, all acceptable for a simulation | P0 (blocks #4, #5, #10, #11, #12 wherever they touch files) |
| Linux terminal + security-command extensions | `src/shells/LinuxTerminalShell.jsx`; `src/shells/security-assessments-shells.jsx:1-477` | `lap-1`, `lap-2`, `sa-1/2/4/5`, selected `sa-3` steps | M3 (investigative commands), M9 (containment commands), M10 (log/file forensics), M12 | Yes | Yes | ~65% core engine; ~30% for the offensive-tool extensions (nmap, sqlmap, etc.), which need reframing | Add explicit authorized-use framing for offensive commands (already flagged in `docs/LAB_ASSESSMENT_STANDARD.md`-adjacent risk); remove the monkey-patched global builtin table; map commands to semantic action types so scoring reflects investigative reasoning, not successful parsing | VFS (#3 above); orchestration (#1) if delivered as scenario steps | Command execution → semantic action → `competencyResults[]`; must not let "recognizer, not sandbox" be graded as if it were real command evaluation | TRUE | MEDIUM — incomplete parsing, fixture overfitting, offensive-command framing | P1 |
| Windows CMD/PowerShell/Browser/Notepad shells | `src/shells/WindowsCmdShell.jsx`, `PowerShellShell.jsx`, `BrowserShell.jsx`, `NotepadShell.jsx` | CMD/Notepad in `ma-1`/`ma-3`; PowerShell embedded in Windows event-log work; Browser registered but unused | M5 (endpoint triage, CMD/PowerShell), M9 (incident response), M7 (Browser — phishing/link review, its natural first use), then reusable in M12 | Yes | Yes | ~55% after registry/import adaptation | Decouple from legacy global registration; stop Notepad from ever holding pre-filled correct answers (current #5 risk: "Notepad can leak answers"); accessibility pass on all four shells | None hard; loosely assumes orchestration (#1) but can be decoupled | Command/selection/navigation callbacks become evidence entries in the submission envelope | TRUE — Browser only after its earlier introduction in M7 | MEDIUM — narrow scripted commands, no Windows-native VFS, Notepad answer leakage, accessibility gaps | P2 |

## 2. SIEM / log explorer / query engine and threat hunting (Epic D domain 2)

| SOURCE TOOL | SOURCE FILES | CURRENT BOOTS2BYTES USE | TARGET MISSION NEXT MODULE | PRACTICE USE | PROVE USE | REUSE % | REQUIRED ADAPTATION | DEPENDENCIES | ASSESSMENT INTEGRATION | CAPSTONE REUSE | RISK | PRIORITY |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SIEM query engine + Splunk-style workspace | `src/query-engine.js`; `src/lab-shells.jsx:461-659`; `src/module-page.jsx:2520-2940`; `src/data.js:22-356` | `mod-1..7`; legacy `lap-3/5`, `wf-2`; `ad-2` | M3 (primary — fills M3's real tool gap), reused (not duplicated) by M6, extended by M4, composed in M12 | Yes | Yes | ~75% query-engine logic; ~15% for the legacy Splunk-branded UI (mostly discard) | Rebuild the UI vendor-neutral (drop Splunk-specific SPL cues, a named risk in the inventory); replace fixed-points/narrow-accepted-answer grading with multi-path, partial-credit scoring; decouple from `module-page.jsx` legacy state | Dataset library (#17 above) for realistic telemetry; orchestration (#1) if scenario-stepped | Query results plus a written determination flow into evidence/competency — not a single typed-answer exact match | TRUE | MEDIUM — simplistic parser, weak `\w+` field-matching, vendor-specific SPL language cues to remove | P1 (M3's real, currently-unmet gap; also unblocks M4 and M6) |
| Kibana/ELK workspace | `src/shells/log-analysis-shells.jsx`; `src/data/labs/log-analysis.labs.js`; duplicate legacy code in `src/module-page.jsx` | New-shape `lap-4` | **Not recommended as a second tool** — would duplicate the SIEM query engine above for the same learning objective (M3) | — | — | ~35% — most of its value overlaps row above | If the owner specifically wants an ELK-style presentation instead of Splunk-style for M3, adapt this **instead of**, never **in addition to**, the row above | Would replace, not add to, the SIEM query engine row | Same envelope as the SIEM row, if selected | TRUE if selected | MEDIUM-HIGH — duplicate code path, vendor specificity, the source lab-registry file contains a NUL byte some tools mis-treat as binary | P3 — defer; only revisit if the SIEM-engine adaptation above is rejected on UX grounds |
| Legacy Event Viewer & Sysmon workspaces | `src/lab-shells.jsx:966-1677`; `src/data.js:590-983,1266-1467` | `lap-3` (Event Viewer), `lap-5` (Sysmon) | **Fold into the Windows forensics suite (§3 below) rather than adapt separately** — the inventory itself flags overlap with the new-shape suite | — | — | ~25% as a standalone path — mostly its channel/filter/detail interaction pattern is worth keeping, not the file itself | Port only the interaction concepts (channel/filter/record-detail browsing) into `WindowsEventLogsLabShell`'s adaptation (§3); do not ship both a legacy and a new-shape event viewer | Superseded by §3's Windows forensics suite row | Via M5, through the adapted Windows forensics suite | TRUE, as folded into §3 | MEDIUM — duplicate concepts and a second local-progress store if kept separate | P3 — reference only, not an independent build |

## 3. Endpoint / malware / Windows forensics (Epic D domain 3)

| SOURCE TOOL | SOURCE FILES | CURRENT BOOTS2BYTES USE | TARGET MISSION NEXT MODULE | PRACTICE USE | PROVE USE | REUSE % | REQUIRED ADAPTATION | DEPENDENCIES | ASSESSMENT INTEGRATION | CAPSTONE REUSE | RISK | PRIORITY |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| New-shape Windows forensics suite (event logs, timeline, browser artifacts, FTK-Imager-style recovery) | `src/shells/windows-forensics-shells.jsx`; `src/data/labs/windows-forensics.labs.js` | `wf-1`, `wf-3`, `wf-4`, `wf-5` | M5 (event-log/endpoint triage) and M10 (timeline/artifact recovery — fills M10's real tool gap) | Yes | Yes | ~55% per component | Vary evidence/fixture sets per attempt instead of one predetermined answer set; add a chain-of-custody narrative field (mirrors the analyst-note pattern already proven in M1/M2); absorb the Event Viewer/Sysmon interaction concepts (§2 row above) instead of shipping both; resolve the split `wf-2` legacy architecture | Validator/gating (#2), Windows shells (#5) for PowerShell wiring, enterprise primitives (§5 row) optionally | Selected artifacts/timeline entries → `evidence[]`; chain-of-custody note → `studentResponses[]`, same pattern as M1/M2's note-length scoring | TRUE | MEDIUM — visual resemblance to real forensic products, fixed evidence paths, no chain-of-custody narrative yet | P1 (fills M10's stated gap directly) |
| Registry forensic environment (`RegistryLabShell`) | `src/lab-shells.jsx:1678-2030`; `src/data.js:984-1265` | Legacy `wf-2` only | M10 (persistence/artifact analysis), secondary use in M5 (Run-key/UserAssist findings) | Yes | Yes | ~45% after separating from `wf-2` legacy fixtures | Separate the registry tree/data model from its legacy coupling; replace exact-typed-answer completion with evidence-selection plus an investigator note; add support for independent annotation (currently absent) | Enterprise primitives (§5 row) for tree/detail UI patterns; sequence after the Windows forensics suite row above | Selected registry keys/values → `evidence[]`; investigator note → `studentResponses[]` | TRUE | MEDIUM — answer-leading UI, single path, legacy-only, no independent annotation | P2 — valuable but sequence after the Windows forensics suite row |
| Malware analysis tool suite (PEview, Dependency Walker, Resource Hacker, HxD, Procmon, RegShot, sandbox report, packet view) | `src/shells/malware-analysis-shells.jsx`; `src/data/labs/malware-analysis.labs.js`; CMD/Notepad shells | `ma-1` (static), `ma-2` (dynamic), `ma-3` (ransomware), `ma-4` (keylogger), `ma-5` (Trojan traffic) | M5 (fills M5's real tool gap directly), optional `CAPSTONE_REUSABLE` pane in M12 | Yes | Yes | ~40% — needs per-tool extraction behind normalized events; 8 tools currently share one file | Split into per-tool modules behind normalized action events; replace memorized-IOC fixtures with per-attempt variation; add a reviewed malware-report narrative field so Prove It produces real analyst writing, not just tool-state completion; keep the existing safe/dummy-data framing explicit | Windows shells (#5 row, CMD/Notepad used alongside), VFS (#3 row) | Tool actions → semantic evidence per stage (static/dynamic/network); final malware-report narrative → `studentResponses[]` satisfying the instructor-review writing requirement; score per stage, not single pass/fail | TRUE | MEDIUM-HIGH — shallow fidelity, memorized IOCs, currently one monolithic file for 8 tools | P1 (fills M5's stated gap directly) |

## 4. Network / email / security-assessment tooling (Epic D domain 4)

| SOURCE TOOL | SOURCE FILES | CURRENT BOOTS2BYTES USE | TARGET MISSION NEXT MODULE | PRACTICE USE | PROVE USE | REUSE % | REQUIRED ADAPTATION | DEPENDENCIES | ASSESSMENT INTEGRATION | CAPSTONE REUSE | RISK | PRIORITY |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Security-assessment web proxy (`BurpProxyLabShell`) | `src/shells/security-assessments-shells.jsx:498-894`; `src/data/labs/security-assessments.labs.js` | Primary tool for `sa-3` | M7 (network/web assessment side of "network & email investigation") | Yes | Yes | ~40% — needs a vendor-neutral reskin plus varied fixture endpoints | Neutralize vendor references ("Burp-style" → a generic traffic-inspection tool); vary the fixed vulnerable-endpoint dataset per attempt; replace the current one-click "mark complete" shortcut with evidence-based submission; keep the existing authorized-use framing | Linux terminal (#4 row — adjacent steps already use it); dataset library (#17 row) | Selected requests/findings → `evidence[]`; requires a written assessment-summary field for Prove It | TRUE | MEDIUM-HIGH — vendor imitation, fixed vulnerable endpoints, a "mark complete" shortcut that bypasses real evidence review | P2 |
| IAM matrix (`IamMatrixLabShell`) | `src/shells/security-assessments-shells.jsx:498-894`; `src/data/labs/security-assessments.labs.js` | One step of `sa-5` | **Not recommended for now** — the inventory itself only approves this as capstone-reusable "if introduced earlier," and Module 2 already owns identity/access review as a bounded, preserved workspace | — | — | ~15% — reference only | Do not port without an explicit owner decision to introduce a *second*, earlier identity-review touchpoint distinct from Module 2; otherwise this duplicates Module 2's objective | Would need its own earlier-module slot the curriculum doesn't currently have | N/A unless the above is decided | FALSE by default | HIGH — direct conflict risk with the already-improved, explicitly-bounded Module 2 | NOT RECOMMENDED pending an explicit owner decision |

## 5. Identity / AD workflows, preserving Module 2 (Epic D domain 5)

| SOURCE TOOL | SOURCE FILES | CURRENT BOOTS2BYTES USE | TARGET MISSION NEXT MODULE | PRACTICE USE | PROVE USE | REUSE % | REQUIRED ADAPTATION | DEPENDENCIES | ASSESSMENT INTEGRATION | CAPSTONE REUSE | RISK | PRIORITY |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Enterprise UI primitives + AD object manager (`ActiveDirectoryLabShell`) | `src/enterprise-components.jsx`; `src/lab-shells.jsx:97-460,2031-2088` | AD object manager is shadowed by new-shape routes; primitives back several legacy shells | Enterprise UI kit (tables/trees/detail panels) usable wherever §3/§4 rows need one; AD-specific shell → **Module 2 only, and only for a specific, named content gap** | Practice only, and only for a confirmed M2 gap | No change to M2's existing Prove flow | ~60% for the generic UI kit; ~20% for the AD-specific shell (reference only) | Extract `enterprise-components.jsx` as a UI kit decoupled from its legacy directory fixtures; do **not** import the AD object manager wholesale into Module 2 — cherry-pick only missing interaction behaviors identified by an explicit content review | None major | Generic primitives: none, they're UI only. AD shell: any new M2 interaction must still emit through M2's existing scorer, never a parallel one | TRUE for the primitives (selected actions only, never a second identity platform); FALSE for the AD shell as a whole | HIGH — the inventory names this directly: "conflict with improved Module 2" | UI kit: P2. AD shell: NOT RECOMMENDED unless a specific M2 gap is named by content review |
| AD monitoring product shells (Grafana/Splunk/Datadog/Nagios/Checkmk/Prometheus/Cacti-style) | `src/shells/active-directory-shells.jsx`; `src/data/labs/active-directory.labs.js` | `ad-1` through `ad-7` | None — reference only | — | — | ~10% — workflow reference only | Do not port; inventory explicitly states "do not add seven tools" | — | N/A | FALSE | HIGH if ported — vendor sprawl, one-click scripted "completion," displayed answers, direct conflict with Module 2 | NOT RECOMMENDED |

## 6. Vulnerability management (Epic D domain 6)

| SOURCE TOOL | SOURCE FILES | CURRENT BOOTS2BYTES USE | TARGET MISSION NEXT MODULE | PRACTICE USE | PROVE USE | REUSE % | REQUIRED ADAPTATION | DEPENDENCIES | ASSESSMENT INTEGRATION | CAPSTONE REUSE | RISK | PRIORITY |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Vulnerability-management suite (OpenVAS/Nessus/Qualys/ZAP/WSUS-style scan, findings, ticket, patch workflows) | `src/shells/vuln-management-shells.jsx`; `src/data/labs/vuln-management.labs.js` | `vm-1` through `vm-5` | M8 (fills M8's real tool gap directly), findings/tickets reusable in M12 | Yes | Yes | ~40% workflow/state; ~15% as literal per-vendor clones | De-brand into one vendor-neutral scanner workflow plus one patch/remediation workflow instead of porting all 5 branded shells (the "prefer one shared engine" rule applies directly here); add a remediation-plan narrative and prioritization rationale; replace static findings with per-attempt variation | Dataset library (#17), validator/gating (#2) | Selected findings + remediation plan + prioritization rationale → `evidence[]` + `studentResponses[]`; score the reasoning, not just ticket-click completion | TRUE | MEDIUM — vendor branding/sprawl if all 5 are ported as-is, static findings, no reasoning narrative yet | P1 (fills M8's stated gap directly) |

## 7. Evidence / case / reporting and capstone composition (Epic D domain 7)

| SOURCE TOOL | SOURCE FILES | CURRENT BOOTS2BYTES USE | TARGET MISSION NEXT MODULE | PRACTICE USE | PROVE USE | REUSE % | REQUIRED ADAPTATION | DEPENDENCIES | ASSESSMENT INTEGRATION | CAPSTONE REUSE | RISK | PRIORITY |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ServiceNow-style case & Azure-style security shells | `src/lab-shells.jsx:660-731`; `src/module-page.jsx:3076-3114` | None — dead/shadowed code; stale smoke tests still reference it | None as a direct port; the incident-state-machine *concept* may inform M9/M11 case/ticket content design | — | — | ~10% — concept reference only | Do not port; if M9/M11 content design wants a ticket-state concept, route it through Mission Next's existing case/attempt flow, never a second case platform | — | N/A as a port | FALSE | MEDIUM — dead code, stale tests, real risk of building a second parallel case platform if literally ported | NOT RECOMMENDED as a port; reference only for content design |
| Instructor dashboard & progress administration | `src/instructor-dashboard.jsx`; `src/data.js:1570-1636`; `src/systems/progress.js` | Client-local cohort roll-up across all labs | None — Mission Next already owns review/persistence via the existing grading queue and faculty review UI | — | — | ~5% — reference only | Do not port. Its two clearest anti-patterns (non-authoritative client-side roll-up; a destructive one-click reset with no confirmation) are worth naming explicitly so the new adapter doesn't repeat them | — | N/A | FALSE | LOW if not ported; the anti-patterns themselves are a real risk if repeated elsewhere | NOT RECOMMENDED as a port |

## Explicitly excluded (inventory `DO NOT USE`, unchanged by this crosswalk)

| SOURCE TOOL | SOURCE FILES | WHY EXCLUDED |
|---|---|---|
| Alternate Windows launcher / tool-card page | `src/windows-forensics-page.jsx` | Parallel, display-only navigation duplicate of Academy navigation Mission Next already owns. |
| Boots2Bytes authentication, catalog, and dashboard shell | `src/login.jsx`, `track-selection.jsx`, `student-dashboard.jsx`, `project-catalog-page.jsx`, `app.jsx`, `animations.jsx`, `index.html` | Total coupling to the source app's own routing/auth/session model; Mission Next already owns auth, routing, and progression. Module 1 remains the UX reference, not this shell. |

## Summary for the owner

**P0 (must land first, nothing else can safely proceed without these):** shared lab orchestration adapter,
validator/gating/progress extraction, and a resolved plan for scrubbing answer-bearing data out of anything
sourced from the Boots2Bytes dataset library. These map directly to Epic C's proposed
`submitReviewableLabAttempt()` seam (ARCHITECTURE §8) — Epic C should be scoped around these three rows, not
around any individual tool.

**P1 (clear, currently-unmet module gaps — the strongest reuse case):** SIEM query engine → M3; Windows
forensics suite → M5/M10; malware analysis suite → M5; vulnerability-management suite → M8; virtual
filesystem + Linux terminal as the shared substrate under all of the above.

**P2/P3 (real but secondary, conditional, or sequenced later):** Windows generic shells, registry forensics,
web proxy for M7, enterprise UI-kit extraction for M2 (only against a named content gap).

**NOT RECOMMENDED (the inventory or this audit argues against porting):** IAM matrix, AD monitoring product
shells, ServiceNow/Azure shells, instructor dashboard, Kibana/ELK as a second SIEM UI, legacy Event
Viewer/Sysmon as a second forensics UI, and both `DO NOT USE` items. These are kept in the matrix rather than
omitted so the reasoning is visible, per the inventory's own evidence-based classification approach.

## What this document does not do

- It does not authorize Epic C or Epic D. Per AGILE_HANDOFF §7, the matrix must be reviewed first.
- It does not specify file-level implementation plans, component APIs, or agent file-ownership boundaries —
  that's Epic D's job, once this matrix is accepted, using the domain groupings above as the non-overlapping
  work boundaries.
- It does not change any source, `portal/`, `ui/`, or `supabase/` file. Only this document was written.
