Implement the SOC Analyst Module 12 capstone and its 100-point rubric.

Read the current SOC curriculum in data.js and inspect Modules 3–11 before
changing Module 12. Reuse the existing Module 3 SIEM console, MnKql engine,
normalized tables, evidence pinning, query history, case-record component,
LabRuntime persistence, and recordLabAttempt integration.

The capstone must be the evolved version of the same Mission Next SIEM used
throughout the course. Do not build a separate unrelated simulator.

Create:

- docs/SOC_CAPSTONE_SPEC.md
- soc-capstone-rubric.js
- soc-capstone-state.js
- soc-capstone-scorer.js
- the revised Module 12 implementation
- scripts/test-soc-capstone-scorer.mjs

The scorer must be a pure function:

scoreSocCapstone({ state, actionHistory, scenarioTruth })

It must return:

- total score
- pass/fail
- safety-cap status
- points earned per section
- evidence supporting each award
- deductions and missed requirements
- instructor-readable feedback

Implement the attached 100-point rubric:

1. Intelligence and preparation — 10
2. Queries, detection rules, and scheduling — 18
3. Alert validation and incident management — 12
4. Cross-domain investigation — 18
5. Timeline, scope, evidence, and ATT&CK — 12
6. Detection tuning, automation, and containment — 14
7. Eradication and recovery — 8
8. Reporting, operations, and lessons learned — 8

Pass at 70 points.

Grade observable results, not prescribed clicks or exact query strings.
Execute learner queries through MnKql and score their result coverage,
precision, entity correlation, time scope, and source usage.

Grade automation by inspecting workflow nodes, edges, targets, approval gates,
execution results, and scheduled validation.

Use final state for correctness and action history for executed unsafe actions.
Harmless exploration must never reduce the score. Correcting an earlier mistake
must allow recovery of downstream points.

Only these executed actions may cap the final score at 69:

- deleting or intentionally altering evidence
- bypassing approval for destructive containment
- taking enterprise-wide destructive action against unsupported scope
- falsifying containment, recovery, or closure evidence

Do not use text length as evidence of report quality. Use structured report
fields, referenced evidence IDs, correct entities, current status, uncertainty,
ownership, and due dates.

Add automated tests covering:

- perfect score
- minimum passing performance
- partial credit
- corrected query
- broad noisy query
- narrow missed-scope query
- corrected incident association
- incomplete containment
- unsafe action cap
- alternate valid query
- clicks without evidence

Do not mark the task complete until all existing project checks and the new
capstone scorer tests pass.
