# VIEW_QUEUE — goose-local replaces the codex wave (pivot 2026-07-06)

Alex's call: close the GAP_BRIDGE wave with goose-local + python tooling
instead of codex (usage-limited). The codex 14:20 rerun was cancelled.
Division: goose writes fixtures + whole views from self-contained briefs;
`add_view.py` render-gates and wires them; Claude (manager) owns the parts
that edit existing code.

## Goose view queue (briefs in tasks/V*.md, regenerate via gen_view_task.py)

| Task | Route | Fixtures | Closes gap |
|---|---|---|---|
| V12 | `#/copilot/plugins` | COPILOT_PLUGINS | Copilot plugin management |
| V13 | `#/copilot/sessions` | COPILOT_SESSIONS, COPILOT_TRANSCRIPTS | Sessions & transcripts |
| V14 | `#/copilot/promptbooks` | COPILOT_PROMPTBOOKS | Promptbook library |
| V15 | `#/copilot/settings` | COPILOT_USAGE, COPILOT_CAPACITY | SCU capacity/owner settings |
| V16 | `#/copilot/knowledge` | COPILOT_KNOWLEDGE | Knowledge bases |
| V17 | `#/defender/vulnerabilities` | TVM_* (3 consts) | TVM depth + exceptions toggle |
| V18 | `#/defender/threat-explorer` | TX_EMAILS | MDO Threat Explorer |
| V19 | `#/defender-cloud/multicloud` | MC_* (3 consts) | AWS/GCP onboarding |
| V20 | `#/sentinel/mssp` | MSSP_TENANTS | MSSP / Lighthouse |
| V21 | `#/defender/mto` | MTO_INCIDENTS | Multi-tenant management |
| V22 | `#/purview/audit-premium` | AUDIT_* (2 consts) | Audit Premium depth |

`#/copilot/home` was hand-built with the workload skeleton (already live).

## Manager-owned remainder (edits to EXISTING code — never goose)

1. KQL evaluator depth in `app.js`: union, join, summarize+bin/dcount/
   arg_max, parse/extract, externaldata (local CSV), render → simple SVG
   charts; guided exercise set. (Agent 13 scope.)
2. ASIM imAuthentication/imNetworkSession hunting pages mirroring
   `#/sentinel/hunting/dns`. (Could become V-tasks once fixtures exist.)
3. Bookmarks/livestream controls ON the existing `#/sentinel/hunting`
   view + restore-job flow on `#/sentinel/search` (lab-widgets state).
4. Entity-trigger playbook action in the incident side panel.
5. Copilot embedded panel ↔ standalone deep links (12.7).
6. Cross-links from existing views to the new routes (audit → audit-premium,
   email-collab → threat-explorer, exposure → vulnerabilities,
   environment → multicloud, workspace-manager → mssp).
7. Accuracy review of goose study-note prose (spot-check vs own knowledge;
   flag anything that misdescribes portal behavior).

## Interaction primitives

`ui/lab-widgets.js` (`labList/labGet/labSet/labPush/labRemoveAt/
labToggleFlag`) is the only door from generated views to persistent
state; drafts are banned from touching localStorage/DOM directly and the
render gate enforces it.

## QA

- Per-view: `add_view.py` gate (syntax, banned patterns, runtime render,
  no `undefined`, internal links only, splice + node --check + rollback).
- Whole-lab: `bin/qa-sweep.sh` — nav-vs-views sweep + node --check + vm
  render of EVERY route. Run after every batch; results in QA_LOG.md.
