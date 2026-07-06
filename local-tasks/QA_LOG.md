## T01 — 2026-07-06T10:59:36+02:00
- **PASS** (attempt 1, manual smoke test). Checks: file created, node-loadable,
  export names/counts/keys per manifest.json, banned-pattern scan.
- Output: `out/t01-copilot-sessions.js`

## T02 — 2026-07-06T11:00:10+02:00
- **PASS** (attempt 1). Checks: file created, node-loadable,
  export names/counts/keys per manifest.json, banned-pattern scan
  (no http/URLs, no Microsoft domains or MS fictional brands, no
  long hex/secret-like strings, no real-year CVEs).
- Output: `out/t02-copilot-transcripts.js`

## T03 — 2026-07-06T11:01:10+02:00
- **FAIL** after 2 attempts. Last verifier output:
  > FAIL T03: out/t03-copilot-promptbooks.js not created
- Output deleted; task remains open.

## T04 — 2026-07-06T11:03:11+02:00
- **PASS** (attempt 2). Checks: file created, node-loadable,
  export names/counts/keys per manifest.json, banned-pattern scan
  (no http/URLs, no Microsoft domains or MS fictional brands, no
  long hex/secret-like strings, no real-year CVEs).
- Output: `out/t04-copilot-plugins.js`

## T05 — 2026-07-06T11:03:49+02:00
- **PASS** (attempt 1). Checks: file created, node-loadable,
  export names/counts/keys per manifest.json, banned-pattern scan
  (no http/URLs, no Microsoft domains or MS fictional brands, no
  long hex/secret-like strings, no real-year CVEs).
- Output: `out/t05-copilot-capacity.js`

