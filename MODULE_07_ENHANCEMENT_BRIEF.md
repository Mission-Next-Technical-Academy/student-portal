# Module 07 enhancement brief — Sprint 8

Date: 2026-09-10  
Scope: `CURRICULUM_SCENARIO_ARCHITECTURE.md` Sprint 8 only  
Status: implemented locally; curriculum/compliance/faculty review remains pending

## Target

Upgrade the existing Network & Email Analysis lesson without changing the
locked minute ledger. The flagship case is a fictional QR-phishing and
vendor-invoice impersonation lure traced through DNS beaconing to a first-seen
domain. Existing email-authentication, message-trace, benign-baseline, and
DNS/TLS correlation mechanics are retained and upgraded rather than discarded.

## Acceptance criteria

- Four-part lesson loop remains: lecture, feedback knowledge check, investigation
  lab, and review/sources.
- Primary evidence chain uses a QR invoice lure, vendor identity misalignment,
  message trace, DNS lookup, and matching TLS session.
- A distinct independent second lab is visible and catalogued at `minutes: 0`
  inside the existing Module 07 allocation.
- No real victim, live indicator, operator identity, external action, or
  certification/approval claim is introduced.
- Security+ and other mappings remain supplementary developer-draft content.
