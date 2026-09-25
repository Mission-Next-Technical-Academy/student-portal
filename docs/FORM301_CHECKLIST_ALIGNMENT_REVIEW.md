# Form 301 Checklist Alignment Review

Reviewed against: `Mission Next SOC Analyst LMS Build Review, CIE Alignment &
Developer Execution Checklist.docx` (repo root). Review date: 2026-09-01.

## Verdict

The checklist assumes significant remaining misalignment between the LMS and
the CIE-approved Form 301. **That is no longer true.** A full audit against
every checklist item found Phases 0–7 already implemented and machine-verified
(`node bin/curriculum-check.js` passes clean). No SOC Analyst module content is
empty or a stub — all 12 modules carry substantial authored instructional
content (380–958 lines each). The only genuinely open items are one compliance
policy decision (evaluator/supervision on labs) and the human sign-offs
Phase 9 requires by definition (no agent can self-certify those).

This document is the record of that verification, phase by phase, so future
sessions don't re-litigate ground already covered. Per the archive rule in
`CLAUDE.md`, this file stays at root until the two open items below are
resolved.

## Phase-by-phase status

| Phase | Checklist requirement | Status | Evidence |
|---|---|---|---|
| 0 | Lock source of truth: 70/12/82 hours, 42/40 theory/lab, Diploma credential | **DONE** | `CURRICULUM_MAP.md`; `portal/data.js` `program.parents` (all 8 SOC-101.x codes/hours); `bin/curriculum-check.js` asserts totals — passes |
| 1 | Landing page: replace "80–100 Hours" etc. | **DONE** | `portal/data.js:239-246` stats match checklist wording verbatim ("Approved Program / 82 Clock Hours", "Lab Instruction / 40 Hours", "Learning Experience / 12 Modules"); Security+ disclaimer at `portal/app.js:3880-3884`; zero hits for banned phrases repo-wide |
| 2 | Form 301 parent mapping on every lesson/lab/assessment | **DONE** | Every item in `portal/data.js` carries `parentAllocations` in minutes; checker enforces allocations sum to item duration; `CURRICULUM_MAP.md` is the exportable mapping report |
| 3 | Reframe Modules 04/08/10, guardrail 05/06 | **DONE** | Exact checklist titles live in `portal/data.js:303,345,360`; `CURRICULUM_ALIGNMENT_ARCHITECTURE.md:82-95` records the mapping; `soc-analyst-module-05.js`/`06.js` content stays at investigation/triage scope — no reverse-engineering or "Threat Hunter" specialization content found |
| 4 | Capstone = exactly 4 hours, no new content | **DONE** | `soc-12` = 240 min in `portal/data.js:375`; checker asserts `kind: 'capstone'` + 240 min; 12-stage sequence intact |
| 5 | Lab inventory reconciled to 40 hours | **DONE** | Checker asserts `LABS.length === 17` (16 + capstone), resolving the checklist's "16 vs 15" discrepancy; aggregate lab minutes = 40 hours exactly |
| 6 | Security+ crosswalk secondary, never authorizes a lesson | **DONE (correctly deferred)** | Checker asserts every `securityPlusTags` array is empty — crosswalk intentionally not yet populated because no curriculum reviewer has supplied it. This is the correct pending state, not a gap. |
| 7 | M360-101 separate 12-hour companion | **DONE** | `portal/data.js:219-225` `program.careerReadiness` is a distinct section with its own progress namespace (`portal/app.js:278-320`), excluded from the 70-hour technical roll-up |
| 8 | Academic/LMS recordkeeping | **PARTIAL — see below** | |
| 9 | Final CIE/launch QA | **Cannot be self-certified** | Requires curriculum-lead, compliance-reviewer, and faculty-reviewer sign-off by design — see `CURRICULUM_ALIGNMENT_ARCHITECTURE.md` §9 "Release boundary" |

## Phase 8 detail — what's actually built vs. open

**Already built and live (correcting a stale-doc finding):**

- The fixed-credit-hour award mechanism — the exact thing described at the
  start of this session ("credit the module's approved hours the moment a
  student completes it, no session or login tracking") — already exists and
  is **deployed**, not merely written. `supabase/migrations/20260829130000_fixed_credit_hours.sql`
  creates `program_course_hours` (the approved per-module minute allocations,
  matching `CURRICULUM_MAP.md` exactly) and a trigger,
  `award_fixed_module_credit()`, that fires on `module_progress` completion
  and inserts an immutable, title/hours-snapshotted row into
  `student_course_hour_awards`. `supabase migration list --linked` confirms
  it is applied on the linked remote project. The migration's own header
  comment ("deliberately LOCAL-ONLY until an authorized operator reviews and
  applies it") is **stale** — same failure mode flagged before in
  `supabase_migration_sync_check` memory. `COMPLIANCE_DECISIONS_NEEDED.md`'s
  "Current State" section for Decision 2 should be updated to reflect this;
  that edit wasn't made as part of this review since it's a docs correction,
  not new work.
- `20260829133000_report_generation_audit.sql` (report metadata/integrity
  hashing) is likewise confirmed applied on remote, not local-only as its
  header claims.

**Still open — Decision 1 (evaluator/supervision on labs):**

All 12 modules are self-graded with no human-in-the-loop review field
(`lab_attempts` has no `reviewed_by`/`evaluator_id`/`supervisor_name`
column). This is ambiguous against CIE Rule 6E-2.0041(9), F.A.C.'s
"supervision or evaluator information where applicable" requirement.
`COMPLIANCE_DECISIONS_NEEDED.md` lays out four options and recommends
**Option 2** (optional instructor review workflow, starting with the
capstone). This requires a compliance decision from Alex before any code is
written — not an engineering judgment call.

- [ ] Decide evaluator/supervision approach for labs (`COMPLIANCE_DECISIONS_NEEDED.md` Decision 1)
- [ ] If Option 2 is chosen: build optional instructor review UI + `reviewed_by`/`reviewer_notes` on `lab_attempts`, starting with the capstone module

## Phase 9 — Final QA (human sign-off only)

These cannot be closed by code changes; they are listed here so the checklist
is traceable to something in-repo rather than only living in the .docx.

- [ ] Curriculum lead approves developer-authored lesson labels and minute allocations
- [ ] Compliance reviewer approves parent/theory/lab allocations and M360 separation
- [ ] Qualified faculty approve assessment validity and evaluation methods
- [ ] Real authenticated persistence, attendance/time evidence, artifacts, feedback, history, and export are tested end-to-end
- [ ] Curriculum lead, compliance reviewer, faculty reviewer, and developer formally sign off

## Module-by-module title/scope audit (for reference)

| # | Checklist disposition | Current title in `portal/data.js` | Match |
|---|---|---|---|
| 01 | KEEP WITH REFRAMING → "SOC Operations Foundations" | SOC Operations Foundations | ✅ |
| 02 | KEEP | Network, Identity & Security Foundations | ✅ |
| 03 | KEEP — CORE | SIEM & Log Analysis | ✅ |
| 04 | RENAME → Detection Rules, Threat Intelligence & Automated Monitoring | Detection Rules, Threat Intelligence & Automated Monitoring | ✅ |
| 05 | KEEP WITH GUARDRAILS | Endpoint & Malware Investigation | ✅ (scope stays at triage, no RE/malware-dev) |
| 06 | KEEP WITH GUARDRAILS | Threat Hunting & Investigation | ✅ (scope stays analyst-workflow, not a separate program) |
| 07 | KEEP | Network & Email Analysis | ✅ |
| 08 | RENAME → Vulnerability Findings & SOC Prioritization | Vulnerability Findings & SOC Prioritization | ✅ |
| 09 | KEEP — CORE | Incident Response | ✅ |
| 10 | RENAME → Incident Evidence Handling, Chain of Custody & Case Documentation | Incident Evidence Handling, Chain of Custody & Case Documentation | ✅ |
| 11 | KEEP | SOC Operations, Metrics, Reporting & Communication | ✅ |
| 12 | KEEP CONCEPT / CORRECT HOURS → 4 hrs | SOC Analyst Capstone, 240 min | ✅ |

## Not in scope for this review

The IT Help Desk track (`portal/data.js` `it-support` program) has 12 skeleton
modules with zero lesson content — but it is unpublished, unrelated to this
checklist, and already tracked as a known "not built yet" state (see
`helpdesk_course_status` memory and `CURRICULUM_ALIGNMENT_ARCHITECTURE.md`
§1). Not a gap against this checklist.
