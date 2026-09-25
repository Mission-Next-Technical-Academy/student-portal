# Module 09 enhancement brief — Sprint 10

## Scope

Upgrade Module 09, **Incident Response**, around one active fictional Mission
Next Labs ransomware case. Preserve the locked 150-minute module ledger:
30-minute lesson, 75-minute guided response lab, and 45-minute independent
response lab. No minutes are added and no later module is implemented here.

## Learning contract

The lesson exposes a scenario → theory → knowledge check with answer feedback
→ applied task loop. The guided lab uses shared incident `INC-4937` and its
stable evidence IDs. The independent lab uses a separate `INC-4942` slice and
different decisions. NIST incident-response lifecycle language is used for
phase discipline; ATT&CK and Security+ references remain supplementary
developer material pending curriculum/compliance/faculty review.

## Evidence-set contract

`window.MISSION_NEXT_M09_EVIDENCE_CONTRACT` is the browser-local interface for
later modules. Contract version: `m09-ransomware-evidence-v1`; incident:
`INC-4937`; entities: `ws-173`, `acct-173`, `fs-02`; evidence IDs:
`M09-E01` through `M09-E08`. Modules 10, 11, and 12 consume their listed
slices. Records are synthetic observations and boundaries only—no real victim,
operator, attribution, live IOC, or exfiltration claim is present.

## Acceptance criteria

- [x] Active ransomware response scenario and bounded evidence set.
- [x] NIST lifecycle phase decisions and scoped containment/recovery.
- [x] Four-part lesson loop, randomized quiz feedback, and applied handoff.
- [x] Distinct independent lab with separate state and completion record.
- [x] Locked 150 instructional minutes preserved.
- [x] Evidence contract documented for Modules 10–12; no downstream code changed.
