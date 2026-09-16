# Controlled synthetic completion runbook

`synthesize-soc-m360-completion.js` creates a clearly labelled QA/demo record for exactly one existing, enrolled `SOCAN` student. It is idempotent for technical evidence: it creates only missing passing canonical lab attempts and missing Module 1 evidence. M360 uses the real student-submit and authorized faculty-review/finalization RPC callbacks.

It does not alter any other student and does not write a browser-progress flag. Every synthetic technical attempt and M360 payload/reference carries a `synthetic` marker and a run tag.

## Preconditions

- **Environment rule:** Go live is November 2. Until that date, use staging URL, staging student credentials, and staging admin credentials only. Never run this synthetic fixture against production identities or records.
- The verified-progress migrations through `20260916110000_module_one_evidence_integrity.sql` and the M360 binding/finalization migrations are deployed.
- The target already exists and is enrolled in `SOCAN`. If it has no active M360 enrollment, the explicitly named staging-only `--create-staging-m360-enrollment` switch creates one controlled synthetic cohort and enrollment for this one fixture.
- The supplied admin is an active M360 faculty reviewer and finalizer. The script intentionally does not grant either authorization.
- Use only a controlled QA/demo student. Never represent the output as learner-authored work, actual attendance, or a credential decision.

## Run

Keep credentials out of shell history and source them from an approved secret manager/environment. Review the exact student ID, then run:

```bash
MNT_SYNTHETIC_COMPLETION_ACK=I_UNDERSTAND_SYNTHETIC_RECORDS \
SUPABASE_SERVICE_ROLE_KEY='...' MNT_STUDENT_PASSWORD='...' \
MNT_ADMIN_EMAIL='...' MNT_ADMIN_PASSWORD='...' \
node bin/synthesize-soc-m360-completion.js 4437023872-SOCAN --execute --create-staging-m360-enrollment
```

The student login email is assumed to be the existing provisioning convention: `<student-id lowercase>@missionnext.example`. The script fails closed if its requirements, M360 cohort, reviewer/finalizer authority, or final verification are missing.

## Verification

Confirm the portal module cards and Review Module screen agree with `student_verified_module_progress`; confirm the administration roster shows 12 technical modules, six accepted M360 weeks, and a finalized M360 completion. The script performs these durable read-model checks itself before reporting success.
