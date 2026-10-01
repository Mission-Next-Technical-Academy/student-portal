# L7: Validate a Web Finding

## Authorized scope

The AppSec team has completed testing of `app.example.local` within its approved scope. This lab provides their scanner report and captured request evidence. Do not launch scans or send new attack traffic.

## Analyst tasks

1. Review the supplied scanner report and locate its SQL error finding.
2. Search the application access log for the single-quote request and HTTP 500 response.
3. Compare the request sources with the approved scanner address to identify activity that needs incident validation.
4. Check the asset inventory for business role and exposure.
5. Record a priority rationale that cites evidence, impact context, uncertainty, and a safe owner handoff.

A scanner result is a lead, not proof of successful exploitation or data access. Correlate it with application telemetry and preserve that distinction in the case notes.
