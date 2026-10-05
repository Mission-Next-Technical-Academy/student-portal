# Module 07 enhancement progress — Sprint 8

Date: 2026-09-10  
Scope: `CURRICULUM_SCENARIO_ARCHITECTURE.md` Sprint 8 only  
Status: implemented locally; curriculum/compliance/faculty review remains pending

## Delivered

- Preserved the existing four-part lesson loop, randomized reasoning quiz,
  feedback/retry behavior, evidence tray, and locked instructional allocation.
- Reframed the flagship EM-071 case as a fictional QR-phishing/vendor invoice
  impersonation attempt: the visible supplier identity fails DMARC alignment,
  the QR/HTML artifact points to first-seen `invoice-qr.example`, and the
  delivered copy is correlated to DNS/TLS activity from `acct-63` on `WS-517`.
- Added an independent transfer lab card with a separate fictional invoice
  case, distinct evidence gap, and bounded handoff prompts. It is catalogued as
  `lab-network-email-independent` with `minutes: 0`, so Module 07's existing
  allocation and program total do not change.
- Updated the catalog title/objective/description and expanded the analyst
  handoff reasoning to accept the QR/invoice artifacts. The crosswalk remains a
  supplementary developer draft pending review.
- No real victims, live IOCs, operator identities, external actions,
  certification endorsements, affiliations, approvals, or pass guarantees were
  added.

## Verification

- `node --check portal/soc-analyst-module-07.js` — passed
- `node --check portal/data.js` — passed
- `node bin/portal-check.js 7` — passed (`module 7 OK`; SOC and IT entries)
- `node bin/render_all.js` — passed (`views: 129/129 render clean; dead NAV routes: 0`)
- `git diff --check` — passed

Sprint 9 and later remain out of scope.
