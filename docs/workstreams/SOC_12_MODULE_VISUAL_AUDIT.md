# SOC Analyst Modules 01–12: visual teaching aid audit

**Date:** 2026-10-03  
**Scope:** Instructional diagrams, process models, and visual sequences in the twelve SOC Analyst modules.

## Summary

The course currently has **8 purpose-built instructional visual structures**:

- **Module 01:** CIA triad, activity-to-analyst flow, and five-step triage wheel (3)
- **Module 02:** Interactive network topology map (1)
- **Module 03:** Three-stage normalize-and-correlate workflow ribbon (1)
- **Module 07:** Five-stage email-to-network analysis chain (1)
- **Module 08:** Contextual vulnerability-risk model (1)
- **Module 09:** Six-phase incident-response wheel (1)

The other six modules have useful lesson cards, data tables, console workspaces,
forms, and practice grids, but no comparable explanatory diagram. Several of the
existing diagrams are inside expandable lesson or Deep Dive sections, so the
course has fewer visuals in its first-view teaching path than the raw count
suggests.

This count treats a diagram or model as a visual that explains relationships,
sequence, or a decision model. It does not count the shared academy logo, generic
icons, concept-card grids, ordinary evidence tables, score cards, navigation,
forms, or simulated lab interfaces. The count is based on the module source and
rendered structure, not a count of image files.

## Module inventory

| Module | Existing instructional visuals | Count | Visibility and assessment |
|---|---|---:|---|
| 01 · SOC foundations | CIA triad on the Learn It slide; activity-to-analyst flow; interactive five-step triage wheel | 3 | The CIA diagram appears on its matching card. The flow and triage wheel sit with their related expandable lessons. This is a strong visual foundation. |
| 02 · Network and identity | Interactive network topology with zones, identity, resources, policy, and animated event path | 1 | Integrated into the console guide and practice. Strong fit for the module; avoid adding a second generic network map. |
| 03 · SIEM and log analysis | Source-to-normalize-to-correlate workflow ribbon; four source-category tiles | 1 | The ribbon is a compact process cue. The source tiles are an index, not a relationship diagram. No OSI model is active in this module. |
| 04 · Detection engineering | Rule workbench, grouped result rows, concept grids | 0 | These show evidence and outcomes, but not a visual explanation of how detection grouping changes the result. |
| 05 · Endpoint investigation | Lesson-loop cards and endpoint telemetry tables | 0 | Process ancestry and event order are taught in prose and records; there is no process-tree or aligned-timeline teaching visual. |
| 06 · Threat hunting | Hypothesis choices, query workbench, endpoint and identity records | 0 | The learner performs the hunt, but has no visual summary of how the two evidence sources join to test scope. |
| 07 · Email and network analysis | Five-stage sender → artifact → delivery → DNS/TLS → scope chain | 1 | The sequence is clear, but it is inside the collapsed Deep Dive. Consider surfacing the existing chain when this workflow is introduced. |
| 08 · Vulnerability prioritization | Validate → exploitability + exposure + impact − effective controls model | 1 | Useful compact decision model, currently in the collapsed Deep Dive. |
| 09 · Incident response | Interactive six-phase lifecycle wheel; contain/eradicate/recover response cards | 1 | The lifecycle visual is in the collapsed Deep Dive. The response cards support the lab decisions. |
| 10 · Evidence handling | Four-part learning-loop cards; evidence and chronology tables | 0 | Custody checks, timeline reconstruction, and interpretation have no visual process model connecting them. |
| 11 · SOC operations and reporting | Four-part learning-loop cards; metric and queue tables | 0 | The data is present in tables, but there is no visual distinction between operational signals and incident proof, or a trend chart. |
| 12 · Capstone | Prerequisite list, 12-stage progress aid, evidence forms, timeline inputs, workflow form | 0 | The capstone combines many domains, but does not show how evidence sources relate through shared entities and time. Avoid a pre-filled attack path that gives away the investigation. |

## Where another visual could help

These are targeted candidates, not a recommendation to add a diagram to every
module. Keep the Learn It copy short and place added detail in the matching
collapsed Deep Dive or lab reference when it would otherwise crowd the card.

### Priority 1: Module 05 — process ancestry and event order

This is the clearest instructional gap. A compact, evidence-bounded visual could
show a document viewer spawning an unsigned script host, followed by persistence
and a network event, with a small aligned timeline beneath it. Distinguish direct
parent-child links from corroborating events; use broken or uncertain links where
the records do not prove causation. This would support the module's central task
without expanding its prose.

### Priority 2: Module 04 — why rule grouping changes the alert

Use a side-by-side comparison of the current per-account grouping and a proposed
source-level time-window grouping. Show how the same records produce repeated
single-account retries in one case and a distributed pattern in the other. Keep
the example tied to the existing exercise data, including its noise and true
positive, rather than introducing a new detection scenario.

### Priority 3: Module 10 — evidence handling sequence

A simple chain could connect **select → acquire → verify hash → record custody →
reconstruct timeline → state supported conclusion**. Label provenance and hash
integrity as separate checks. This clarifies the relationship between the module's
evidence-handling objectives without duplicating the incident timeline itself.

### Priority 4: Module 06 — two-source hunt reasoning

If learners need more support, show **seed observation → testable hypothesis →
query each source → compare shared host/account/time → bound scope → disposition**.
The visual should emphasize that a shared time alone is insufficient evidence.
This could stay small because the Guided Lab already supplies the query practice.

### Priority 5: Module 12 — cross-domain evidence map

An optional overview could group identity, email, endpoint, network, SIEM, and
exposure records around their join keys (account, host, address, and time). Keep
relationships unasserted until the learner establishes them. Do not draw the
expected attack sequence or pre-connect evidence that the capstone asks students
to discover. Because this module is already information-rich, prototype only if
students report difficulty navigating between consoles.

## Visuals to hold for now

- **Module 03 OSI diagram:** Not a current gap. The module focuses on source
  normalization, event time, entity correlation, and bounded conclusions. An OSI
  diagram would need a specific objective about protocol layers to earn its space.
- **Module 11 metrics chart:** The current assessment presents operational
  snapshots and caveats in tables. A trend chart needs valid time-series data;
  do not invent a trend or imply that correlation proves cause.
- **Module 02 network illustration:** The interactive topology already gives
  learners zones, identity, resources, policy, and event-path context.
- **More generic icons or decorative figures:** They would add visual weight
  without explaining a course decision or relationship.

## Asset and maintenance notes

- `portal/assets/course-media/submarine-cable-map.png` is a 326 KB image with no
  active reference found in the repository. It is excluded from the diagram
  count; verify its history before deciding whether to remove or reuse it.
- The M02 topology and M01 CIA triad are rendered as inline SVG. Other counted
  flows and wheels are built from HTML/CSS, so no external image asset is needed.
- Keep new diagrams readable at the portal's narrow viewport, give each a concise
  text equivalent, and avoid making color the only way to tell evidence states
  apart.

## Recommended order

1. Add a scoped process-chain/timeline visual for M05.
2. Add the M04 rule-grouping comparison using existing records.
3. Add the M10 evidence-handling chain.
4. Observe whether M06 or M12 needs a visual after learners use the current labs.
5. Leave M02, M03, M08, M09, and M11 as they are unless course evidence points to
   a specific comprehension problem. Surface M07–M09 visuals more clearly before
   commissioning replacements.

## Implementation status (2026-10-03)

Recommended items 1–3 are built and committed. All three use HTML/CSS with no new
assets. Each has a hidden text equivalent and shows its states with line style or icon as well as colour, and each
stacks into one column at phone width. They were render-checked inside the real module views in headless Chrome at 1300px and 375px,
and `bin/console-tab-sweep.js 4,5,10` passes.

| Module | Visual | Placement | Data |
|---|---|---|---|
| 05 | Process ancestry + aligned timestamps (`moduleFiveAncestryReference`, `.m05-anc-*`). Solid arrow = parent PID proves link; dashed = corroborates; dotted "no record" network node (no network event exists for this chain, so none is drawn). | Practice It → Guided Lab, collapsed "Reference: reading process ancestry" above the console | Read at render time from the Guided Lab fixture (M05-PR-201/202/203/205/206); Prove It records are not used |
| 04 | Group-by-account vs group-by-source + 5-min window comparison (`moduleFourGroupingCompare`, `.m04-gc-*`). Outcomes are computed, not hardcoded. The per-account "3 failures" baseline is labelled illustrative. | Practice It → Guided Lab, collapsed "Reference: why grouping changes the alert" above the console | Guided Lab fixture (192.0.2.144 spray, acct-67 managed retry). The Prove It scenario uses different values and is not shown. |
| 10 | Six-step handling chain with separate provenance (solid) and integrity (dashed) checks; expandable steps (`moduleTenHandlingChain`, `.m10-handling*`) | Lecture Deep Dive, after the scenario loops | Static step copy, with no scenario values |

These test failures already existed and were confirmed against a pre-change copy, so they are not caused by this
work: `soc-m04-assessment-console` (`guidedLabGuide` not loaded), `soc-m04-assessment-submit`,
`soc-m05-assessment-console` (`inConsole`), and `soc-m05-assessment-submit` (`LearnItDecks`). These come from the
Learn It / console-guide WIP.

Still open: items 4–5. Watch M06/M12 learner feedback first, and consider surfacing the M07–M09 Deep Dive visuals.
