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

