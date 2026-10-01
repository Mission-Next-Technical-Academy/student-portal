# Optional CLI Lab rewrite — live click-through (post-deploy check)

**Status:** open · **Owner:** next session + Alex (needs a real student login)
**Release under test:** `d799b65` on `master`, live as **v1.501** (2026-10-01)
**Live portal:** https://mission-next-technical-academy.github.io/student-portal/

## Why this exists

The Optional CLI Lab rewrite (S1–S8) changed shared code inside
`portal/imported-labs/mission-next-labs/` that **every** imported lab boots
through: `index.html` (new boot scripts, optional KQL engine), `labPlayer.jsx`,
`validator.js`, `module-page.jsx`, `PowerShellShell.jsx`.

Automated coverage before deploy: `npm run check` (9 suites) and
`smoke:routes` (16 routes) passed, and the frozen lab definitions (`sa-2`, `sa-5`)
were confirmed byte-identical to the previous commit. All boot assets returned
200 on the live site after deploy.

**Not covered:** the authenticated portal round-trip: a logged-in student opening
a lab from a module card, finishing it, hitting Back, and seeing progress/notes
saved. The tests ran outside the portal frame with Supabase blocked. That is
what this click-through verifies.

## Setup

1. Log in on the live portal as a **test student** account (not admin; admin
   views mask the student progress bugs). Don't put credentials in this file.
2. Open DevTools → Console, and keep it open the whole run.
3. Hard-refresh once (Ctrl+Shift+R) so the new `?v=20260930-*` scripts load.
4. Confirm the footer shows **v1.501** or later.

Expected and harmless in the console: the Tailwind CDN warning. A
`[boot] optional script unavailable: ../../kql-engine.js` warning is acceptable
everywhere **except** `sa-8`.

**Fail immediately** on: "Failed to start app", a blank frame, a stuck loading
screen, any red console error naming a `src/` file, or Back landing on `#/login`.

## Priority 1: frozen core labs (must behave exactly as before)

These are graded course slots. The student experience must be unchanged.

| # | Where | Card | Imported lab | What to verify |
|---|---|---|---|---|
| 1 | Module 02 → Guided Labs | User Account Security Assessment | `sa-5` | Boots in the Linux terminal; all **15** steps complete; grading accepts correct answers and rejects a wrong one; Back returns to Module 02; card shows complete |
| 2 | Module 02 → Guided Labs | File System Security Assessment | `sa-2` | Boots; all **13** steps complete; same grading/Back/complete checks |
| 3 | Module 02 → Assessment Labs | User Account Security Assessment | `sa-5` | Same as #1, plus the required note (min **80** chars) is enforced and saves |
| 4 | Module 02 → Assessment Labs | File System Security Assessment | `sa-2` | Same as #2, plus the required note |
| 5 | Module 07 → Assessment Labs | GRE tunnel log analysis | Splunk `gre-tunnel-log-analysis` | Splunk shell chrome looks unchanged; lab completes; Back works |
| 6 | Module 07 → Assessment Labs | HTTP log analysis | Splunk `http-log-analysis` | Same as #5 |

For #1–#4, also **reload mid-lab** (around step 5) and confirm progress resumes.
Then log out and back in, and confirm completion persisted. This catches the
earlier "resets for student" class of bug.

## Priority 2: the one intentional change to a linked lab

| # | Where | Card | Imported lab | What to verify |
|---|---|---|---|---|
| 7 | Module 08 → Additional Labs | Web Application Security Assessment | `sa-3` | Title still matches the card. Lab now opens the **traffic inspector** (not the old Burp-style proxy) with the new finding-validation steps. Neutral UI (no vendor names); completes; Back works |

Alex approved this content change on 2026-10-01.

## Priority 3: boot smoke for every other linked imported lab

Open each one, confirm it renders its first step with no console errors, then
hit Back. You don't need to complete them. This checks the shared boot path.

| Module | Section | Imported lab |
|---|---|---|
| 04 | Additional | Splunk `dhcp-log-analysis`, `ad-4`, `ad-6` |
| 05 | Assessment | `lap-5`, `ma-4` |
| 06 | Additional | Splunk `dns-log-analysis`, `ssh-log-analysis`, `ma-5` |
| 07 | Additional | Splunk `ftp-log-analysis` |
| 08 | Assessment / Additional | `vm-5`, `vm-1` / `vm-4` |
| 10 | Assessment / Additional | `wf-5`, `wf-1` / `wf-4`, `sa-2` |
| 11 | Assessment / Additional | `ad-7` / `ad-3`, `ad-5` |

Source of truth for these links: `grep -n "imported-labs/mission-next-labs" portal/soc-analyst-module-*.js`.

## Priority 4 (optional): new unlinked Optional Labs

These aren't reachable from module cards, so no student hits them yet. Open
them directly at
`…/imported-labs/mission-next-labs/index.html#/track/security-assessments/project/<id>/lab`:

- `sa-4` Linux Log Triage: The Audit Gap
- `sa-6` Windows Jump Host Triage and `sa-7` Contain, Collect, Rebuild (PowerShell): the beginner guide reads "NEW TO POWERSHELL?"
- `sa-8` Cloud Identity & Workload Incident (Cloud Shell): KQL queries return results. This is the only lab that needs `../../kql-engine.js`.
- `sa-9` File Server Integrity Triage (Night Shift shell)

## Recording results

Add a dated entry under the "Optional CLI Lab deep rewrite" section of
`docs/handoffs/HANDOFF.md`: build version tested, pass/fail per row number, and
the console text and screenshot for any failure.

**If a Priority 1 row fails:** treat it as a release regression. Compare against
`4dd7677` (last pre-rewrite commit). The likeliest culprits are the shared files
listed at the top. Fix forward or revert `d799b65`, and get Alex's go-ahead
before pushing. Every push to `master` deploys and bumps the version.

Once all P1–P3 rows pass, mark this file **closed** and update the
`mnt-optional-cli-lab-rewrite` memory ("Still open: logged-in click-through").
