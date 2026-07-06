# INTEGRATION — local-tasks → ui/data.js merge state

Last run: 2026-07-06T11:26:58+02:00 (rewritten every `integrate.py` run — do not hand-edit).

Merged consts live between the two `local-tasks fixtures` markers at the
end of `ui/data.js`. The section is rebuilt from scratch each run, so
re-running after new tasks pass is always safe. Views/codex agents use
the consts directly: `COPILOT_SESSIONS`, `COPILOT_TRANSCRIPTS`, `COPILOT_PROMPTBOOKS`, `COPILOT_PLUGINS`, `COPILOT_USAGE`, `COPILOT_CAPACITY`, `TVM_SOFTWARE`, `TVM_CVES`, `TVM_RECOMMENDATIONS`, `MC_CONNECTORS`, `MC_RESOURCES`, `MC_ALERTS`, `AUDIT_RETENTION_POLICIES`, `AUDIT_COPILOT_EVENTS`, `TX_EMAILS`, `MSSP_TENANTS`, `MTO_INCIDENTS`, `COPILOT_KNOWLEDGE`.

| Task | Exports | Status |
|---|---|---|
| T01 | `COPILOT_SESSIONS` | MERGED into ui/data.js |
| T02 | `COPILOT_TRANSCRIPTS` | MERGED into ui/data.js |
| T03 | `COPILOT_PROMPTBOOKS` | MERGED into ui/data.js |
| T04 | `COPILOT_PLUGINS` | MERGED into ui/data.js |
| T05 | `COPILOT_USAGE, COPILOT_CAPACITY` | MERGED into ui/data.js |
| T06 | `TVM_SOFTWARE, TVM_CVES, TVM_RECOMMENDATIONS` | MERGED into ui/data.js |
| T07 | `MC_CONNECTORS, MC_RESOURCES, MC_ALERTS` | MERGED into ui/data.js |
| T08 | `AUDIT_RETENTION_POLICIES, AUDIT_COPILOT_EVENTS` | MERGED into ui/data.js |
| T09 | `TX_EMAILS` | MERGED into ui/data.js |
| T10 | `MSSP_TENANTS, MTO_INCIDENTS` | MERGED into ui/data.js |
| T12 | `COPILOT_KNOWLEDGE` | MERGED into ui/data.js |

Gate: only drafts that pass `verify.js` at merge time are spliced;
result must pass `node --check` or the merge is rolled back atomically.
