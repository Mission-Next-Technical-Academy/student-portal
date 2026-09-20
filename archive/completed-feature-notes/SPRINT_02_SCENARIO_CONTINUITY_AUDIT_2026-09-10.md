# Sprint 2 — Scenario continuity audit

Date: 2026-09-10  
Scope: `CURRICULUM_SCENARIO_ARCHITECTURE.md` Sprint 2 only  
Status: audit complete; curriculum/compliance/faculty sign-off pending

## Inputs reviewed

- `LATEST_PROGRESS.md`
- `PROJECT_GUIDE_FOR_AI.md`
- `HANDOFF.md`
- `CURRICULUM_SCENARIO_ARCHITECTURE.md`
- `archive/README.md`
- `portal/soc-analyst-module-04.js`
- `portal/soc-analyst-module-06.js`
- `portal/soc-analyst-module-07.js`
- `portal/soc-analyst-module-10.js`
- `portal/soc-analyst-module-11.js`
- `portal/soc-analyst-module-02.js` and `portal/data.js` for the next-sprint
  handoff and locked minute ledger

## Findings by module

| Module | Existing material found | Reuse decision | Continuity issue to resolve in its sprint |
|---|---|---|---|
| 04 | Credential-spray detection tuning, threat-intelligence enrichment, and bounded automation. Fixture accounts `acct-06` through `acct-25`; synthetic IPs; no incident number; one stale phishing-cluster enrichment row. | Reuse the grouping/threshold, enrichment-freshness, and approval-gate reasoning. Do not present the current authentication dataset as the shared ransomware case. | Add the Mission Next Labs context and a unique `INC-####` case reference only when the module is upgraded; preserve the current distractor logic and synthetic indicators. |
| 06 | Hypothesis-led hunt over `WS-214`, `WS-332`, `acct-27`, `acct-41`, `203.0.113.77`, and a repeated unsigned script. The lecture explicitly says phishing/delivery is not evidenced. | Reuse as a hunt-pattern module, not as a phishing incident. Keep the evidence-boundary lesson that prevents inferring delivery from endpoint telemetry alone. | Normalize `WS-*`/account references to the shared convention in the module sprint, or explicitly label them as module-local aliases. Give the hunt a unique incident/case reference if it becomes part of the scenario library. |
| 07 | Benefits-themed credential-phishing message (`EM-071`), HTML attachment, lookalike domains, DNS/TLS correlation, and vendor-invoice distractors. Uses `acct-63`, `WS-517`, `northstar-people.example`, `mnt-internal.test`, and `auth-renewal.example`. | Reuse the email-authentication, delivery-scope, quishing/BEC-adjacent, and DNS/TLS correlation patterns. This is the strongest existing phishing foundation. | The organization/domain names and asset labels conflict with Mission Next continuity. Replace or alias them during the Module 07 sprint; do not silently mix this case with Module 10/11 or the capstone. |
| 10 | Evidence/custody and ATT&CK reconstruction of a benefits attachment → PowerShell → scheduled task → token-refresh chain. Uses `acct-61`, `WKS-61`, `Benefits_Update.html`, and `203.0.113.210`; local mapping correctly says there is no ransomware-impact evidence. | Reuse the custody records, supported/unsupported relationship graph, and explicit “do not infer ransomware” guardrail. | This can become a post-containment slice only after Sprint 9 establishes the shared ransomware case; until then it remains an independent phishing/persistence case. Normalize identifiers and add the shared incident reference only in its own sprint. |
| 11 | Metrics and executive-report labs use `CASE-11-27`, `NB-44`, `acct-44`, `Benefits_Adjustment.zip`, and `203.0.113.211`; case is recovered, bounded to one host/account, and explicitly not ransomware. | Reuse the metrics-vs-proof distinction, bounded-impact wording, accountable escalation, monitoring window, and executive translation patterns. | Replace the independent case reference with the Sprint 9 shared ransomware evidence slice only after that evidence set exists. Do not turn current metrics into ransomware metrics without a data-backed change and reviewer review. |

## Continuity convention outcome

The following conventions are established by the architecture and are safe to
use as authoring constraints; this audit did not alter existing module data:

- Organization: **Mission Next Labs**.
- Human/account identifiers: `acct-###`; endpoint identifiers: `ws-###`;
  use lowercase in new student-facing content. Existing `WS-*`, `WKS-*`,
  `NB-*`, `LT-*`, `IDN-*`, and `SVC-*` values are module-local legacy data and
  need deliberate migration or aliasing during their module sprint.
- Incident references: unique `INC-####` values, ascending as the shared
  scenario library is authored. `INC-4821` remains the existing capstone
  reference; no new number was assigned in Sprint 2.
- Domains, IPs, hashes, and identities remain fictional/documentation-range
  fixtures. No real victim, operator identity, customer data, or live IOC is
  introduced.
- Modules 09–11 must consume one evidence set after Sprint 9 creates it;
  existing module-local phishing cases are reusable patterns, not that shared
  case.

## Locked minutes and crosswalk gate

No instructional minutes, catalog records, lesson allocations, lab durations,
Security+ tags, or student-facing crosswalk claims were changed. Module 02 is
currently 660 minutes / 11 hours in `portal/data.js`; its existing identity lab
is 180 minutes. Any four-part loop and second-lab design must fit the approved
ledger or stop for compliance review.

The §2 SY0-701 crosswalk remains a developer draft. No reviewer sign-off was
available in this session, so it is not cleared for student-facing copy,
marketing, or a certification-affiliation claim.

## Verification

- `node --check portal/soc-analyst-module-02.js` — passed.
- `node --check portal/soc-analyst-module-04.js` — passed.
- `node --check portal/soc-analyst-module-06.js` — passed.
- `node --check portal/soc-analyst-module-07.js` — passed.
- `node --check portal/soc-analyst-module-10.js` — passed.
- `node --check portal/soc-analyst-module-11.js` — passed.
- `git diff --check` — passed after documentation changes.

No application code was changed. Sprint 3 may use
`MODULE_02_ENHANCEMENT_BRIEF.md`; Sprints 4+ remain out of scope for this
record.
