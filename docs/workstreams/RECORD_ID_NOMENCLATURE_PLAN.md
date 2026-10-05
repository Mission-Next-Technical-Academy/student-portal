# Record ID nomenclature — ALR / INC / CASE

Standard: `docs/specs/MODULE_STANDARD.md` §7.2.1 (locked 2026-10-03, owner).

## Why

An audit on 2026-10-03 found that every module made up its own ID scheme: 13 case prefixes
(`NST`, `IAM`, `CASE-MN`, `DET`, `EDR`, `HNT`, `BKD`, `NEC`, `VLN`, `EVD`, `OPS`, `IR`, `INC`),
three alert formats (`ALT-1001`, `ALERT-001`, `AL-1201`) and a case/incident relationship
that flipped between modules. Examples: in M09 Practice, `INC` was the case and `IR` the
ticket; M11 had mismatched case and ticket numbers; M03 used `INC-MN-428-PRACTICE`. On top
of that, every Prove It ticket header showed the case ID under the label "ITSM Incident
Ticket".

Real SOC tools have no shared standard either (ServiceNow `INC0012345`/`SIR…`, Jira
`SOC-123`, Sentinel/Defender plain numbers + GUIDs). Students should learn the model
(alerts → incidents → case), not any one vendor's format.

## Model

`ALR-NNxxxx` alert → `INC-NNxxxx` incident (correlated alerts) → `CASE-NNxxxx`
(investigation + the ITSM ticket the student submits). `NN` is the module number. A case
links one or more incidents. A hunt case links none until it finds something. Practice
It and Prove It always use different numbers.

## Phase A — label-only IDs (done 2026-10-03, uncommitted)

These IDs were display labels only. No saved-state validation depends on them.

| Module | Lab | Old | New case | Linked incident | Alert |
|---|---|---|---|---|---|
| M01 | Practice | `ALT-1001` | `CASE-011420` | `INC-011318` | `ALR-011001` |
| M01 | Prove | `NST-2407` | `CASE-012407` | `INC-012716` | `ALR-012401` |
| M02 | Prove (graded ticket) | `IAM-5502` | `CASE-025502` | `INC-025811` | — |
| M04 | Practice | `DET-4478` / `INC-4478` | `CASE-044478` | `INC-044790` | — |
| M04 | Prove | `DET-4424` | `CASE-044424` | `INC-044733` | — |
| M05 | Practice | `EDR-5204` / `INC-5204` | `CASE-055204` | `INC-055512` | — |
| M05 | Prove | `EDR-5127` | `CASE-055127` | `INC-055436` | — |
| M06 | Practice | `HNT-6411` / `INC-6411` | `CASE-066411` | none (hunt) | — |
| M06 | Prove ×2 | `HNT-6214`, `BKD-6318` | `CASE-066214`, `CASE-066318` | none (hunt) | — |
| M07 | Practice | `NEC-0748` / `INC-0748` | `CASE-070748` | `INC-071056` | — |
| M07 | Prove | `NEC-0731` | `CASE-070731` | `INC-071042` | — |
| M08 | Practice | `VLN-PRACTICE-0849` / `INC-0849` | `CASE-080849` | none (exposure review) | — |
| M08 | Prove | `VLN-0842` | `CASE-080842` | none | — |
| M10 | Practice | `EVD-6620` / `IR-6620` | `CASE-106620` | Phase B | — |
| M10 | Prove | `EVD-5510` | `CASE-105510` | Phase B | — |

Changes:
- `portal/case-record.js`:
  - The header shows `caseId` plus `Linked incident(s)`, taken from `spec.incidentIds`.
  - The `ticketId` fallback is removed.
  - New helpers: `caseRecordIncidentIds()` and `caseRecordBriefLabel()`.
  - `caseRecordDisplay` and `caseRecordSummary` include the linked incidents.
- M01: `portal/data.js` scenarios gained `alertId`, `incidentId` and `caseId`. `scenario.id` is
  unchanged because it is still the internal key.
- M04/M05: the guided-fixture alias maps now map the new case and incident IDs. M05 adds
  `MODULE_FIVE_PRIOR_CASE_IDS = ['EDR-5127']`, so saved Prove It tickets are relabelled
  instead of being marked legacy. M04 already reassigns `caseId` on load. The legacy
  `DET-4415` and `EDR-5119` handling is unchanged.
- Submitted `lab_attempts` keep the IDs they were submitted under. Those are immutable
  history, so instructors may see old IDs on past attempts.
- Verification:
  - `bin/ci-check.sh` passes.
  - `bin/console-tab-sweep.js` passes: 304/304 tabs.
  - A headless render showed the new brief and ticket headers for M01, M04–M08 and M10.
- Practice brief tags (`PRACTICE IT · …`) stay after the IDs. M06 briefs read
  `CASE-… · HUNT · …`.

## Phase B — IDs used as data keys (not started)

These IDs are node or link keys inside console state. Saved student state validates
against them, so renaming them without migrating that state would silently drop
in-progress work.

| Where | Current | Target | Risk |
|---|---|---|---|
| M09 Prove incident graph | `INC-4937` (99 refs in `tests/soc-m09-assessment-state.test.js`) | `INC-094937`, case `CASE-095245` | `SocM09AssessmentState` rejects workflow, audit and action entries whose `incidentId` ≠ `scenario.incidentGraph.incidentId` |
| M09 Practice | case `INC-5942`, ticket `IR-5942` | `CASE-096250`, `INC-095942` | same mechanism as the Prove row (guided fixture) |
| M09 secondary incident | `INC-5020` | `INC-095020` | shared M09 evidence contract |
| M10 incident graph | `INC-5510` / guided `INC-6620` | `INC-105818` / `INC-106928` | reuses `SocM09AssessmentState.normalize` |
| M11 | Prove case `OPS-5511` (links M09 `INC-4937`); Practice case `OPS-6640`, ticket `INC-6240`/`INC-6242` | `CASE-115511` → `INC-094937`; `CASE-116640` → `INC-116240` | alias map rewrites M09 fixture strings |
| M12 | case `INC-4821`; alerts `AL-1201…1208` | `CASE-125129` → `INC-124821`; `ALR-121201…` | `soc-m12-assessment-rubric.js` checks `incidentLinks[].incidentId === s.caseId`; incident-link state checks `alertId` |
| M03 | `CASE-MN-428` / `INC-MN-428-PRACTICE`; `CASE-MN-517` / `INC-MN-517` | `CASE-030428`/`INC-030736`; `CASE-030517`/`INC-030829` | brief + ticket labels; check M03 SIEM state for keys |
| M08 internal | `M08-INCIDENT-001`, `ALERT-001…` | `INC-081150`, `ALR-08xxxx` | rubric hard-codes `M08-INCIDENT-001` |
| M09 alerts | `ALERT-001…006` | `ALR-0901xx` | check state keys |

Approach for each row: rename in the data, then add a load-time `normalize` alias
(old ID → new ID) in the module's assessment state, so saved workflows, actions and
links are rewritten instead of rejected. Add a test that loads a pre-rename saved state
and checks that nothing was dropped.

**Ordering:** M03 and M12 files had uncommitted work from another session on
2026-10-03. Do those last, and only after that work is committed. Before staging, check
for overlap (see `mnt_repo_layout_and_concurrency` memory). Leftover legacy files:
`soc-analyst-module-02.js` still has `CASE-MN-317` (not rendered, because M02 is
re-registered by `-environment.js`) and `soc-analyst-module-03.js`.
