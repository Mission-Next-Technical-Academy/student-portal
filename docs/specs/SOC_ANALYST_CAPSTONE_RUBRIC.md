# SOC Analyst Capstone Rubric

**Total:** 100 points  
**Passing score:** 70 points

Students receive partial credit. An early mistake does not prevent passing if
they recognize it, correct it, and make enough strong decisions afterward.

## 1. Intelligence and Preparation - 10 Points

| Graded action | Points |
|---|---:|
| Reviews the existing queue and identifies which alerts/incidents require attention | 2 |
| Evaluates threat-intelligence reliability, confidence, recency, and relevance | 3 |
| Creates accurate IOC records with type, source, status, and expiration | 3 |
| Creates a testable threat-hunting hypothesis | 2 |

Partial credit examples:

- Correct IOC but missing expiration: partial credit.
- Uses an outdated IOC without validating it: reduced credit.
- Treats every indicator as confirmed malicious: little credit.
- Ignores existing incidents that match the intelligence: loses queue-review points.

## 2. Queries, Detection Rules, and Scheduling - 18 Points

| Graded action | Points |
|---|---:|
| Selects the correct log tables and normalized fields | 3 |
| Builds appropriate IOC and entity filters | 4 |
| Uses a defensible time window | 3 |
| Correlates activity using account, device, IP, session, hash, or destination | 4 |
| Tests the query against historical telemetry | 2 |
| Runs the rule immediately and configures an appropriate schedule | 2 |

Partial credit examples:

- Correct query with an overly broad time window: most query points, reduced time-window points.
- Correct IOC but no entity correlation: filter points only.
- Query produces excessive noise but still identifies the threat: partial credit.
- Query misses part of the campaign because of a narrow time window: reduced points, not automatic failure.

## 3. Alert Validation and Incident Management - 12 Points

| Graded action | Points |
|---|---:|
| Correctly validates generated alerts | 4 |
| Distinguishes true positive, benign positive, and false positive | 3 |
| Correctly merges, links, separates, or creates incidents | 3 |
| Assigns appropriate priority, SLA, owner, and escalation path | 2 |

Students should lose points for:

- Merging alerts based only on a shared timestamp.
- Combining unrelated users or devices into one incident.
- Creating multiple duplicate incidents.
- Assigning a routine false positive as a critical incident.
- Closing a true-positive alert without sufficient investigation.

A poor query may create false alerts, but students can recover points by
recognizing the noise and tuning the rule.

## 4. Cross-Domain Investigation - 18 Points

| Investigation area | Points |
|---|---:|
| Identity: authentication, MFA, session, role, and permissions | 4 |
| Endpoint: process ancestry, command line, hash, file, and persistence | 4 |
| Email: sender alignment, headers, URL, attachment, and delivery scope | 3 |
| Network: DNS, TLS, destination, protocol, session, and device | 3 |
| Exposure: vulnerability, control gap, asset value, and reachability | 4 |

Full credit requires connecting evidence across these areas, not simply opening
every console.

Examples:

- Finding the malicious process but not its parent: partial endpoint credit.
- Identifying the phishing email but not determining delivery scope: partial email credit.
- Selecting the highest CVSS finding without considering exposure or incident relevance: limited exposure credit.
- Correctly determining that a vulnerability did not contribute: eligible for full credit if supported.

## 5. Timeline, Scope, Evidence, and ATT&CK - 12 Points

| Graded action | Points |
|---|---:|
| Reconstructs the incident in chronological order | 3 |
| Identifies confirmed scope and states remaining unknowns | 3 |
| Preserves evidence with source, time, hash, and custody information | 3 |
| Maps only demonstrated behavior to MITRE ATT&CK | 3 |

Partial credit examples:

- Mostly correct timeline with two events reversed: partial credit.
- Finds the main host but misses a secondary affected identity: partial scope credit.
- Preserves evidence but omits acquisition time or custodian: partial evidence credit.
- Correct ATT&CK tactic but incorrect technique: partial mapping credit.
- Mapping an entire attack chain without evidence: reduced credit.

## 6. Detection Tuning, Automation, and Containment - 14 Points

| Graded action | Points |
|---|---:|
| Tunes the detection while preserving malicious coverage | 4 |
| Builds a logically ordered automation workflow | 3 |
| Places disruptive actions behind approval gates | 2 |
| Runs containment against the correct entities | 3 |
| Schedules an appropriate follow-up hunt or validation task | 2 |

A strong workflow should generally:

1. Enrich the indicator.
2. Search for related activity.
3. Preserve evidence.
4. Update or create the incident.
5. Request approval where required.
6. Isolate confirmed devices.
7. Revoke affected sessions.
8. Block confirmed indicators.
9. Schedule follow-up validation.

Partial credit remains available if containment is incomplete. For example,
containing four of five confirmed entities earns most containment points, while
the remaining entity affects later recovery scoring.

## 7. Eradication and Recovery - 8 Points

| Graded action | Points |
|---|---:|
| Removes confirmed persistence or malicious artifacts | 2 |
| Rotates the correct credentials, tokens, keys, and sessions | 2 |
| Repairs, rebuilds, or restores from an appropriate known-good backup | 2 |
| Validates recovery and establishes continued monitoring | 2 |

Students should receive less credit when they:

- Reset a password but leave active tokens or app passwords.
- Block an IOC but leave persistence installed.
- Restore a backup created after the compromise.
- Return a device to service without validation.
- Claim recovery when some affected entities remain uncontained.

## 8. Reporting, Operations, and Lessons Learned - 8 Points

| Graded action | Points |
|---|---:|
| Produces an evidence-based technical case narrative | 3 |
| Produces an accurate executive summary | 1 |
| Completes an actionable shift handoff | 1 |
| Documents lessons learned and detection improvements | 1 |
| Assigns remediation owners and due dates | 1 |
| Explains effects on alert volume, backlog, SLA, or queue health | 1 |

Writing length alone earns no points. Reports are graded on accuracy, evidence,
scope, uncertainty, ownership, and usefulness.

## Performance Levels

| Score | Result |
|---:|---|
| 90-100 | Exceptional performance |
| 80-89 | Strong performance |
| 70-79 | Competent - passes |
| 60-69 | Remediation required |
| Below 60 | Major remediation required |

## Safety Cap

Ordinary mistakes only reduce points. They do not automatically fail the
student.

The score may be capped at 69 only when the student actually executes a
deliberately unsafe action such as:

- Deleting or intentionally altering evidence.
- Bypassing an approval gate for destructive containment.
- Shutting down or disabling unrelated enterprise systems without supporting scope.
- Falsifying containment, recovery, or closure evidence.

## Recovery from Mistakes

The rubric should score each decision independently.

For example:

- The student writes an overly broad query and loses query points.
- It generates false alerts.
- The student correctly recognizes the false positives.
- They tune the rule and separate the incorrect incident.
- They can still earn alert-validation, tuning, incident-management, and reporting points.

That makes the capstone reflect real SOC work: the student does not need to be
perfect, but they must make enough sound decisions, recognize mistakes, and
ultimately bring the incident under control.
