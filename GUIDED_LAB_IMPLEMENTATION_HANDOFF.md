# Guided Lab parity implementation handoff

## Objective

Implement the requested Guided Labs for Modules 4–11 serially, closing out each module before beginning the next. All seven modules are complete. Module 12 stays the independent capstone Assessment Lab and must not be changed.

Each Guided Lab must be a functional parallel of its module’s Assessment Lab. It should use the same console and KQL engine, schemas, evidence mechanics, case record/actions, persistence model, and ITSM components, while keeping its state independent. Give it a genuinely different scenario: telemetry, entities, indicators, expected answers, incident/case numbers, and ITSM routing must not be copied from the corresponding Assessment Lab. Add one collapsible Console Guide with short one-sentence instructions, optional hints, and checks that recognize task completion. Reduce the amount of guidance progressively from Module 4 through Module 11.

## Working agreement

1. Work through Modules 4–11 one at a time, confirming each module’s tools and case workflow before adapting the pattern.
2. Close out each module with changed files, validation, and known limitations before proceeding.
3. Do not modify Module 12.

## Repository map

- Main page and script order: `portal/index.html`.
- Shared console tool packs and mounting API: `portal/soc-console-tools.js`.
- Shared Module 3 console and KQL implementation: search for `m03eMountConsole` and related functions in `portal/` (loaded before the later module scripts).
- Module implementations: `portal/soc-analyst-module-04.js` through `portal/soc-analyst-module-11.js`.
- Assessment scenario fixtures: `portal/soc-m04-assessment-data.js` through `portal/soc-m11-assessment-data.js`.
- Runtime persistence: `LabRuntime` is used by the module scripts; each module has its own load/save helpers and lab ID constants.

## Findings from initial inspection

- The modules do not share one uniform Guided Lab implementation. Existing guided work includes custom exercises, imported lab launchers, and assessment-style console scenarios.
- Module 4 has custom guided stations in `moduleFourGuidedLabPanel()`. Its assessment console is mounted as `MODULE_FOUR_CONSOLE` with scope `m04`, Assessment data, and `moduleFourState` in `portal/soc-analyst-module-04.js`.
- Modules 5–7 have Guided Lab panels that launch imported exercises, while their assessment console/data are defined in their module files.
- Modules 8–9 also have imported guided exercises; their cumulative console is mounted for the assessment flow.
- Module 10 already has separate Guided and Assessment lab IDs/state objects (`MODULE_TEN_GUIDED_LAB_ID` and `MODULE_TEN_ASSESSMENT_LAB_ID`) and a console mount, which is useful as a persistence reference but does not by itself satisfy scenario and interface parity.
- Module 11 has separate metrics and report lab state IDs and a cumulative operations/reporting console. Its current Guided Lab panel is separate from that console.
- Console packs in `soc-console-tools.js` are cumulative and carry module-specific state through `ctx.assessment()`, `ctx.fixture`, `ctx.save()`, `ctx.rerender()`, and `ctx.console()`. Many pack handlers and markup use fixed module-specific IDs/selectors. A second console on one page therefore needs careful scope/DOM ID review; simply calling `SocConsoleTools.mount()` twice with the same module scope risks duplicate IDs and shared console state.
- At initial inspection the console changes were clean. Module 4 has since shipped its independent Guided console mount; Module 5 now follows that pattern with its own endpoint fixture and state.

## Module 4 starting point

Inspect these locations first:

- `portal/soc-analyst-module-04.js:644` — `moduleFourLoad()`.
- `portal/soc-analyst-module-04.js:749` — `moduleFourSave()`.
- `portal/soc-analyst-module-04.js:1102` — `moduleFourGuidedLabPanel()` and existing custom guided stations.
- `portal/soc-analyst-module-04.js:1114` — `MODULE_FOUR_CONSOLE_DATA`, currently derived from `SocM04AssessmentData`.
- `portal/soc-analyst-module-04.js:1145` — `MODULE_FOUR_CONSOLE`, currently mounted with `m04` scope and `moduleFourState`.
- `portal/soc-analyst-module-04.js:1157` — assessment panel and console host.
- `portal/soc-analyst-module-04.js:1213` — Guided Lab section markup.
- `portal/soc-analyst-module-04.js:1350` onward — render/wire paths for guided and assessment panels.
- `portal/soc-m04-assessment-data.js` — assessment scenario and expected truth. Treat as read-only source material; create a distinct Guided scenario rather than editing this fixture.

Before coding, trace `SocConsoleTools.mount()` and `m03eMountConsole()` to determine how to mount an independent guided instance without duplicate element IDs, event listeners, or persistence. Reuse the console engine/tool pack behavior, but give guided work its own scope, saved console state, pack state, fixtures, and case record. If the shared console cannot safely support two mounted instances without a small shared-layer change, make that change as part of Module 4 and record it clearly for later modules.

## Module 4 acceptance checklist

- Guided Lab visibly uses the same functional console/KQL workflow, evidence interactions, tool actions, and ITSM experience as the assessment counterpart.
- Guided and assessment console UI can coexist in the module page without duplicate IDs or cross-wired events.
- Guided progress and actions survive reload and never mutate assessment state; assessment progress remains unchanged by Guided work.
- Guided scenario values and expected outcomes are distinct from Assessment data, including the case/incident and routing details.
- Console Guide is collapsible; instructions are concise, optional hints are available, and checks respond to actual guided state/actions rather than a manual completion button alone.
- Existing module navigation, assessment grading/submission, and review flows still point at the assessment state.
- Update script cache-busting in `portal/index.html` if needed.
- Report exactly what was implemented and what remains before proceeding to Module 5.

## Scope guard

Modules 4–11 were completed serially, with each module closed out before work began on the next. The implementation adapts to each module’s tool packs and case workflow. Module 12 is out of scope and was not modified.

## Sprint closeouts

### Module 4 — complete


- Added a separate guided console, saved state, scenario, and case DET-4478 / INC-4478, with ID-prefixed console support to let guided and assessment instances coexist. The guide is collapsible and its checks observe guided progress.
- Files changed: `portal/soc-analyst-module-04.js`, `portal/soc-analyst-module-03-environment.js`, `portal/soc-console-tools.js`, `portal/soc-m04-rules-ui.js`, `portal/soc-analyst-module-04.css`, and `portal/index.html`.
- Validation: static syntax and diff checks passed. Browser interaction and reload persistence were not verified.
- Limitation: runtime/browser behavior remains unverified.

### Module 5 — complete


- Replaced the imported Guided Lab launcher with a separately mounted SIEM/endpoint console using the same KQL engine, M04 search/rules pack, and M05 endpoint tool pack as the assessment flow.
- Added Practice case EDR-5204: Outlook script attachment → `wscript.exe` → dropped `cachehost.exe`, Run-key persistence, a distinct sensor outcome, and a signed Contoso CloudSync comparison. Its users, devices, event IDs, hashes, case ID, incident routing, and timestamps differ from the assessment fixture.
- Persisted the practice console, M04 rule/search state, M05 actions/evidence, guide disclosure, and case record under `m05-guided-endpoint-chain-v1`. Assessment state, scoring, faculty submission, and review remain on their existing state and fixture.
- Added a collapsible, lower-support guide with state-based checks for alert/device pivot, investigation query, preserved evidence, and response/handoff; completion feeds Guided Lab navigation.
- Added independent console ID prefix and Module 5 asset cache versions.
- Files changed for this sprint: `portal/soc-analyst-module-05.js`, `portal/soc-analyst-module-05.css`, and `portal/index.html` (the HTML file also contains earlier Module 4 cache updates from that sprint).
- Validation: `node --check portal/soc-analyst-module-05.js` and `git diff --check` passed. Browser interaction, duplicate-ID inspection, and reload persistence were not exercised.
- Limitation: the guide completion checks are a compact set of observable milestones; they do not grade the quality of the student's final judgment. The standard Prove It grading/review path remains assessment-only.

### Module 6 — complete


- Replaced the custom Guided hunt workbench with an independent cumulative console mount carrying the shared SIEM, endpoint, and M06 hunting/ATT&CK packs.
- Added Practice hunt HNT-6411 with a repeated unsigned script hash and destination on two user devices under different document viewers, plus a separate signed NimbusSync baseline. The Assessment Lab remains the dormant scheduled-task/backdoor case.
- Kept Practice console state/case root under `m06-guided-cross-device-hunt-v1`; M06 hunt actions persist under the distinct `m06-guided-hunt-actions-v1` key, and M04/M05 pack state is embedded under the Guided root. This avoids collisions between the parent case and M06's state adapter.
- Added an ID-prefixed console instance, independent non-grading case ticket/routing, and a collapsible guide with progressively lighter checkpoints for hypothesis, two-device evidence, ATT&CK, conclusion, and ticket notes. Changed the seed-lead UI to use the fixture's lead ID and artifact label so the reusable M06 pack supports the new fixture.
- Files changed for this sprint: `portal/soc-analyst-module-06.js`, `portal/soc-analyst-module-06.css`, `portal/soc-m06-assessment-seed-ui.js`, and `portal/index.html` (also contains earlier M04/M05 cache updates).
- Validation: `node --check portal/soc-analyst-module-06.js`, `node --check portal/soc-m06-assessment-seed-ui.js`, and `git diff --check` passed. No browser interaction or reload persistence was exercised.
- Limitation: the checkpoints observe completed actions and saved records; they do not grade the strength of the student's hypothesis, ATT&CK rationale, or conclusion. The instructor-reviewed Assessment Lab stays unchanged.

### Module 7 — complete


- Replaced the imported SMTP and trojan Guided launchers with an independent console mount carrying SIEM, endpoint, hunt, email, and network packs.
- Added Practice case NEC-0748: a shared-file expiry notice with SPF/DMARC failures, a delivered recipient and a gateway-blocked recipient, a click followed by a matching DNS/TLS trail, an unverified endpoint outcome, and a separate trusted HR portal lookalike. Recipient/device IDs, message and event IDs, URLs, hashes, domains, IPs, dates, expected truth, and case routing differ from Prove It.
- Persisted guided case/console/tool state separately; M07 action history uses `m07-guided-mail-network-actions-v1`, distinct from both the parent case root and the assessment fixture key. The M07 pack retains its immutable action model and its own review state.
- Added a collapsible three-check guide for message/exposure, click-to-network correlation with lookalike review, and an incident-linked case note that excludes benign traffic and states unknowns. Guided completion derives from observed actions.
- Files changed for this sprint: `portal/soc-analyst-module-07.js`, `portal/soc-analyst-module-07.css`, and `portal/index.html` (also contains prior module cache updates).
- Validation: `node --check portal/soc-analyst-module-07.js` and `git diff --check` passed. Browser interaction and reload persistence were not exercised.
- Limitation: guide checks confirm observable workflow milestones, not the quality of the evidence interpretation or response recommendation. Prove It grading and instructor review remain assessment-only.

### Module 8 — complete


- Replaced the imported vulnerability-management launchers with a separately mounted cumulative console using the M04–M08 packs and the same KQL/evidence workflow as the assessment.
- Added practice scenario M08-GUIDED-2026-09-27 with API-EDGE-31 and PAY-API-09, distinct product/finding identifiers, dates, owners, records, and case/ticket VLN-PRACTICE-0849 / INC-0849. It preserves the learning contrast between a current confirmed public exposure, a stale unverified finding with a documented temporary exception, and a not-applicable scanner match.
- Persisted guided console/tool state, M08 finding decisions, and the separate ITSM case under guided-specific root and action keys. Assessment state and instructor-reviewed submission remain unchanged.
- Added a collapsible three-milestone guide; its observed status derives from the saved M08 finding review, remediation decision, and required ITSM case handoff. Replaced assessment-state Guided completion references in navigation with this guided state.
- Files changed for this sprint: `portal/soc-analyst-module-08.js`, `portal/soc-analyst-module-08.css`, and `portal/index.html` (which also includes prior module cache changes).
- Validation: `node --check portal/soc-analyst-module-08.js` and `git diff --check` passed. Browser interaction, duplicate-ID inspection, and reload persistence were not exercised.
- Limitation: guide checks confirm the presence of saved actions and ticket fields, not the quality of risk reasoning or the correctness of chosen priority. Assessment scoring/review remains independent.

### Module 9 — complete


- Replaced the imported ransomware sample launcher with a separately mounted cumulative console using the M04–M09 packs and the same evidence search, approval gates, response actions, workflow, and recovery interactions as the assessment.
- Added an independent transformed response scenario: Operation Amber Vault on ws-294 with acct-294 and fs-05, changed addresses, record IDs, dates, incident graph, task/action identities, and IR-5942 case/ticket routing. The assessment's Cedar Lock / INC-4937 scenario remains on its existing fixture and scoring path.
- Persisted guided console/tool state under `m09-guided-incident-response-v1` and incident actions under fixture state key `m09-guided-incident-actions-v1`; maintained a separate guided ITSM case record. The M09 state adapter requires graph link IDs with its `M09-LINK-` prefix, so guided graph links use unique `M09-LINK-GUIDED-*` IDs while event/evidence IDs use the M09G namespace.
- Added a collapsible, minimal three-line guide and completion checks derived from selected incident, reviewed evidence, recorded action/workflow, and required ITSM handoff fields. Guided status now drives navigation and hero progress.
- Files changed for this sprint: `portal/soc-analyst-module-09.js`, `portal/soc-analyst-module-09.css`, and `portal/index.html` (which also includes earlier module cache updates).
- Validation: `node --check portal/soc-analyst-module-09.js` and `git diff --check` passed. Browser interaction, duplicate-ID inspection, and reload persistence were not exercised.
- Limitation: milestone checks observe workflow records and ticket fields, not judgment quality. No full runtime validation was performed against the transformed fixture; the state adapter's graph-link prefix constraint was preserved explicitly.

### Module 10 — complete


- Replaced the imported Windows-forensics Guided launchers with an independent cumulative console using M04–M10 packs, preserving evidence acquisition, hash verification/reacquisition, custody transfer, legal hold, timeline, reconstruction, and ATT&CK mechanics.
- Added Practice case EVD-6620 / INC-6620 for m.chen on WKSTN-42 with changed mail/proxy hosts, message/file names, evidence IDs, dates, request, custody roles, and synthetic hashes. The source mismatch/reacquisition exercise remains, but with a separate hash set and artifact namespace.
- Kept the Guided parent/case/pack state on the pre-existing `m10-guided-lab-v2` root and M10 evidence actions under the separate `m10-guided-evidence-actions-v1` fixture key; Assessment remains on `m10-assessment-lab-v2` and its original fixture/scorer.
- Added a collapsible, low-support guide and checks derived from verified locker items, timeline entries, held originals, and required ITSM fields. Updated Guided navigation/progress to read the actual action/case state.
- Files changed for this sprint: `portal/soc-analyst-module-10.js`, `portal/soc-analyst-module-10.css`, and `portal/index.html` (which also includes earlier module cache updates).
- Validation: `node --check portal/soc-analyst-module-10.js` and `git diff --check` passed. Browser interaction, duplicate-ID inspection, and reload persistence were not exercised.
- Limitation: observed state checks do not grade custody quality or the analytical claims in the ticket. Runtime integration of the cloned fixture remains unverified.

### Module 11 — complete


- Replaced the imported Active Directory monitoring launcher with a separate operations/reporting console using the same cumulative M04–M11 tools and M11 append-only action engine as the Assessment Lab.
- Added a synthetic shift and incident OPS-6640 / INC-6240 with a distinct date, queue/rule IDs, analyst roster, routes, entity IDs (ws-264 / acct-264 / fs-07), and recovery records. Metrics are computed from the guided queue fixture, while reports, handoff, follow-ups, and closure actions use an independent M11 state key.
- Added a separate practice case ticket under `m11-guided-operations-v1`, separate M11 action history under `m11-guided-operations-actions-v1`, and a separate guided console/tool root. Assessment metrics/console state, Assessment action fixture, report state, and scoring remain untouched.
- Added a collapsible, low-support guide; completion derives from saved priority, metric interpretation, handoff, audience reports, and required case fields. Completion updates module navigation and the Guided Lab catalog record.
- Files changed for this sprint: `portal/soc-analyst-module-11.js`, `portal/soc-analyst-module-11.css`, and `portal/index.html` (which also includes earlier module cache updates).
- Validation: `node --check portal/soc-analyst-module-11.js` and `git diff --check` passed. Browser interaction, duplicate-ID inspection, and reload persistence were not exercised.
- Limitation: checks measure workflow records and ticket completeness, not report quality or metric interpretation. Runtime integration of the cloned shift and cumulative pack fixtures remains unverified.

### Modules 5–11 — complete


Module 12 was not modified. Browser-level behavior and reload persistence remain the key outstanding validation across these sprints.
