# local-tasks — goose-local (qwen2.5:7b) fixture pipeline

Added 2026-07-06 to keep the GAP_BRIDGE wave moving while codex is
rate-limited. Division of labor:

| Who | Does | Never does |
|---|---|---|
| goose + qwen2.5:7b (local) | Bulk fictional fixture data, one NEW file per task in `out/` | Touch `ui/*.js`, read large files, run git |
| verify.js (mechanical) | Gates every output: schema, counts, banned patterns | Trust the model's own claims |
| codex agents 12–18 | Merge verified drafts into `ui/data.js`, build views | Re-generate fixtures from scratch |
| Claude (manager) | Task specs, gates, orchestration, final QA | Bulk code |

## Anti-hallucination design

A 7B model will fabricate and misreport completion, so nothing it says is
trusted — only artifacts that pass mechanical checks survive:

1. **Task briefs** (`tasks/T01–T10.md`) are fully self-contained: exact
   output filename, exact const names, exact object keys, exact counts,
   an example object, and a required `module.exports` footer. The model
   never needs to read another file, so it cannot mis-summarize one.
2. **verify.js** loads the output with node and asserts: export names,
   array counts, per-row keys, plus banned-pattern scans — no `http`
   anywhere (no URLs), no Microsoft domains, no Microsoft-owned fictional
   brands (Contoso/Fabrikam/Woodgrove), no ≥40-char hex (secret-like),
   no key material, no real-year CVEs (only the fake `CVE-2026-90xx`
   range is allowed).
3. **Runner** (`bin-run-goose-tasks.sh`): fail → delete output, retry
   once, else give up and log. Pass → commit. A failed task leaves NO
   file behind, so hallucinated partial output cannot leak into the lab.
4. **QA_LOG.md** records pass/fail + the checks run, per task, appended
   at run time by the runner (not by the model).
5. Content-level accuracy (does the fixture *describe* the product
   correctly) is still reviewed by codex when it merges a draft, per the
   accuracy-review workstream in `LAB_MANAGEMENT.md`. The drafts are
   deliberately data-shaped, not prose-shaped, to keep that surface small.

## Task map (feeds AGENTS.md agents)

| Task | Fixtures | Consumed by |
|---|---|---|
| T01 | `COPILOT_SESSIONS` | Agent 12 (12.2) |
| T02 | `COPILOT_TRANSCRIPTS` | Agent 12 (12.2) |
| T03 | `COPILOT_PROMPTBOOKS` | Agent 12 (12.3) |
| T04 | `COPILOT_PLUGINS` | Agent 12 (12.4) |
| T05 | `COPILOT_USAGE`, `COPILOT_CAPACITY` | Agent 12 (12.6) |
| T06 | `TVM_SOFTWARE`, `TVM_CVES`, `TVM_RECOMMENDATIONS` | Agent 15 |
| T07 | `MC_CONNECTORS`, `MC_RESOURCES`, `MC_ALERTS` | Agent 16 |
| T08 | `AUDIT_RETENTION_POLICIES`, `AUDIT_COPILOT_EVENTS` | Agent 17 |
| T09 | `TX_EMAILS` | Agent 17 |
| T10 | `MSSP_TENANTS`, `MTO_INCIDENTS` | Agent 18 |

Merging rule for codex: treat `out/*.js` as **draft input** — review each
row for product-accuracy, adapt naming to existing `data.js` fixture
style, then inline into `ui/data.js`. Do not `<script>`-include these
files. Delete nothing here; the drafts stay as the audit trail.
