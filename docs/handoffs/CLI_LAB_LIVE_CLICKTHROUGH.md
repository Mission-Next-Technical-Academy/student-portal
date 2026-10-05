# Optional CLI Lab rewrite — live click-through (post-deploy check)

**Status:** run 2026-10-01; P1–P4 pass, one manual check left (log out and
back in, see Results) · **Owner:** Alex
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

## Results — 2026-10-01

Run on `localhost:8768` (portal served from the working tree; lab code identical
to v1.501) as test student `…-SOCAN` against the live Supabase project, Chrome,
console watched throughout. That account was already at 12/12 modules.

| # | Result | Notes |
|---|---|---|
| 1 | PASS | `sa-5` 15/15; wrong IP (roster's 10.10.24.88) rejected, correct accepted; reload at step 7 resumed 7/15 still SSH-connected; Back → Module 02; card "Completed — all lab steps verified" |
| 2 | PASS | `sa-2` 13/13; `other::r-x` rejected; reload at step 6 resumed; card verified complete; Module 02 → 100% |
| 3–4 | CHANGED | Owner moved the `sa-5`/`sa-2` Assessment copies to Optional Labs (see below). Before that change: the cards opened the shared lab state, and the ITSM ticket blocked Submit with a short note and empty fields (only "Updated notes" was logged, nothing was submitted). The 80-char minimum belongs to the ticket's Analyst Work Notes, not to the per-lab notes. Test edits were reverted. |
| 5 | PASS* | GRE lab 60/60, Back → Module 07. *The first answer submit in a browser with no `mission_next_progress` entry threw `TypeError … 'mod-5'` in `markTaskComplete` (`src/data.js`); predates the rewrite (`25cf6bd`). Fixed. |
| 6 | PASS | HTTP lab loads; same shell and code path as #5 |
| 7 | PASS | `sa-3` title matches the M08 card; steps 1–2 terminal, then the neutral Traffic Inspector; 4/4; Back → Module 08 |
| P3 | PASS | All 21 linked imported labs render with no console errors |
| P4 | PASS* | `sa-4`, `sa-6`/`sa-7` ("NEW TO POWERSHELL?"), `sa-9` boot. *`sa-8` rejected bare KQL (`bash: unsupported command: SigninLogs`) even though its placeholder and step hint show bare KQL. Fixed, with a regression assertion in `scripts/cloud-incident-check.mjs`. |

Still to do by hand: log out and back in as the test student and confirm the
Module 02 Guided cards still show complete. Signing in is a manual step.

### Changes made from this run

- **Module 02 Assessment Lab (owner request):** the `sa-5`/`sa-2` copies moved
  out of Prove It into the shared Optional Labs section (`OPTIONAL_LAB_LINKS`,
  same `assessment-copy-*` labIds). They no longer gate the IAM-5502 ticket.
  The ticket itself is unchanged.
- `src/data.js` `markTaskComplete`: use the object `initUserProgress` returns.
- `src/systems/labPlayer.jsx`: the default completion banner said "Return to
  Module 3…" in every module. It now says "Use Back to return to your module."
- `src/systems/cloud-incident.js`: bare `SigninLogs`/`AzureActivity`/`Heartbeat`
  KQL runs through the same query path as `az monitor log-analytics query`.
- Cache-bust strings bumped for every changed script.

### Found, not fixed (outside the rewrite scope, needs a decision)

- **Per-lab note boxes lose focus after every keystroke.** The
  `wireMissionNextLabGating` (`portal/app.js`) `input` handler calls the
  module's `onChange`, which saves and re-renders the panel. A student can
  only type one character per click (paste works). This affects every
  `requireNote: true` card: M04 and M06 Optional Labs, and M11's
  `additional` lab group. Module 02 no longer uses note cards. Fix: update the
  bucket on `input` and persist without re-rendering, or re-render on
  `change`. `app.js` is shared code, so this needs owner sign-off.
- Wrong answers in the CLI labs clear the box with no visible "incorrect"
  message. This is the existing behavior.
