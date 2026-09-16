# Helpdesk Curriculum Sweep — Day-1 Ticket Topics

Sweep requested 2026-09-10: confirm 9 requested topics exist, and exist in the
right module, across the **IT Help Desk & Career Accelerator** program
(`it-support`, `portal/it-support-module-01.js` … `-12.js`, catalogue in
`portal/data.js` lines 154–388, practice tickets in `ui/helpdesk-data.js`,
guided walkthroughs in `ui/helpdesk-coaches.js`).

Verdict: all 9 are present and correctly placed. One soft gap noted (#7).

- [x] **1. AD/Entra ID basics** — password resets, unlocking, locked vs.
      disabled, group membership → **Module 6** (`its-06`), lessons 1–3.
      Lesson 1 explicitly distinguishes locked/disabled/expired; lesson 2 is
      group-membership access troubleshooting; lesson 3 covers Entra ID, MFA
      reset, shared mailbox, distribution list, and license assignment
      (`portal/it-support-module-06.js:53-66`). Ticket HD-2101 (repeating
      lockout, `ui/helpdesk-data.js:131`) is the paired practice case.

- [x] **2. Practical networking troubleshooting** — ipconfig /all, APIPA,
      ping/tracert, DNS in plain language → **Module 4** (`its-04`), all 4
      lessons. `ipconfig /all` and APIPA (169.254.x.x) called out by name in
      `portal/it-support-module-04.js:30-61`; a dedicated exercise has
      students write the same diagnosis twice — technical vs. plain-language
      — at line 76-79. Tickets HD-2104 (DHCP) and HD-2105 (DNS) are the
      paired practice cases.

- [x] **3. Ticketing discipline** — notes the next tier can use → **Module
      11** (`its-11`) lesson 1, `portal/it-support-module-11.js:9-24`.
      Contrasts a weak note ("fixed it") against a complete one and drills
      writing for a stranger who wasn't on the ticket.

- [x] **4. O365/Entra admin center navigation** — MFA resets, distribution
      lists, shared mailboxes, license assignment → **Module 6** lesson 3,
      `portal/it-support-module-06.js:53-66`. All four sub-topics named
      explicitly, including "My Teams won't open" as a license-assignment
      symptom.

- [x] **5. Remote support tool comfort** — ConnectWise/ScreenConnect/Quick
      Assist, narrating actions → **Module 8** (`its-08`) lesson 1,
      `portal/it-support-module-08.js:12-26`. Names Quick Assist and
      ConnectWise ScreenConnect specifically; practice is scripting the
      first 30 seconds of a session (consent → narration). Paired simulator
      view: `ui/helpdesk.js:343` (`#/helpdesk/remote-support`) with a
      consent/narration checklist.

- [x] **6. Printer/peripheral triage** — print queues, driver reinstall,
      offline printer → **Module 2** (`its-02`) lesson 4,
      `portal/data.js:250` (`its-02-lesson-04`). Covers Print Spooler,
      "Use Printer Offline," and correct order of operations. Ticket
      HD-2106 is the paired practice case.

- [x] **7. Communication under pressure** — frustrated, non-technical user,
      no jargon, setting expectations → **Module 11** lesson 2
      (`portal/it-support-module-11.js:27-42`, expectation-setting to
      prevent frustrated follow-ups) plus **Module 1** lesson 1
      (`portal/it-support-module-01.js:25`, professional conduct / calm
      plain tone) and the plain-language drill in **Module 4**
      (`portal/it-support-module-04.js:76-79`).
      **Soft gap:** no single ticket/roleplay is framed as an already-angry
      user — the skill is taught distributed across three modules rather
      than as one named "difficult customer" scenario. Not a missing topic,
      but worth a follow-up decision: leave distributed, or add one explicit
      de-escalation ticket (candidate slot: Module 11, alongside HD-2113).

- [x] **8. Basic security hygiene** — phishing recognition, escalation path,
      "hard to tell if it's legit" → **Module 9** (`its-09`) lesson 1,
      `portal/it-support-module-09.js:12-24`. Explicitly addresses
      well-crafted/polished phishing and "the moment something feels off,
      escalate rather than deciding it's probably fine." Ticket SEC-2114
      (phishing) and SEC-2115 (malware alert) are the paired practice cases.

- [x] **9. Triage judgment** — urgent vs. routine, when to escalate →
      spread correctly across three modules by design: resolve-or-escalate
      mindset introduced in **Module 1** lesson 2
      (`portal/data.js:239-241`), impact/urgency/priority/SLA mechanics in
      **Module 10** (`portal/it-support-module-10.js:29-44`), and concrete
      escalate-vs-handle judgment practiced again in **Module 8** lesson 2
      and **Module 11** lesson 2.

## Method
Read the program catalogue (`portal/data.js`), all 12
`portal/it-support-module-*.js` content files, the practice-ticket fixtures
(`ui/helpdesk-data.js`), and the guided-coach walkthroughs
(`ui/helpdesk-coaches.js`) directly — no assumptions from module titles alone.

## Open follow-up — resolved 2026-09-10
Added the de-escalation ticket per the approved candidate fix. **HD-2124**
(requester Tara Singh, Sales — a repeat contact, second call today, worried
about a time-critical client proposal) now runs alongside HD-2113 in Module
11's coach, giving the module both halves of "communication under
pressure": recognizing an escalation trigger and writing a stranger-actionable
note (HD-2113), and diagnosing while calmly managing an already-frustrated
user without overpromising (HD-2124). Root cause: Windows Credential Manager
held a stale cached Outlook password after a same-day required domain
password change.

Note: the original candidate ID "HD-2119" turned out to already be in use —
`ui/helpdesk-data.js:149-152` generates HD-2119 through HD-2123
programmatically (the five correlated purchasing-app-certificate tickets used
by `hd-m07`) via a template literal (`` `HD-${2119 + index}` ``), which a
plain string grep for `HD-2119` misses. HD-2124 was used instead — confirmed
free by checking the actual generated ID range, not just literal ID strings
in the file.

Touch points:
- Ticket fixture: `ui/helpdesk-data.js:153` (`hdTicket({ id:'HD-2124', ... })`).
- Coach block: `ui/helpdesk-coaches.js:570-591` — header comment updated,
  `hdRegisterSimpleCoach('hd-m11', ...)` now takes `['HD-2113', 'HD-2124']`
  and an updated summary; HD-2113's flow is no longer `isLast`, and
  `.concat(hdTicketFlowSteps('HD-2124', {...isLast: true...}))` adds the new
  ticket's six-step walkthrough with `noteBody`/`resolveBody` written to
  model calm, plain-language expectation-setting.
- Module content: `portal/it-support-module-11.js:50` (`labDescription`
  updated to name both tickets).
- Lab/catalogue entries: `portal/data.js:375` (`its-11` catalogue —
  `durationMinutes`/`creditMinutes` 210 → 270, `hours` '3.5 Hours' → '4.5
  Hours', keeping lessons(135) + lab(135) internally consistent) and
  `portal/data.js:2169-2172` (`lab-its-11-handoff-documentation` — `minutes`
  75 → 135, `objective`/`description` updated). `parentAllocations:
  [allocation('ITHD-101.2', 75)]` on that lab was deliberately left
  unchanged — no script in the repo (`bin/portal-check.js`,
  `bin/curriculum-check.js`) validates ITHD-101.x parent-course totals, and
  the master `ITHD-101.2` compliance entry at `portal/data.js:188` (part of
  a reconciled 60-hour external mapping doc) was out of scope for this
  change. This does mean lab-its-11 is now the one lab in the file where
  `minutes` no longer equals the sum of its `parentAllocations` — worth a
  follow-up if the ITHD-101.x compliance mapping is ever revisited.

Verified: `node bin/portal-check.js` still prints `module 11  OK  (its-11,
8452 chars)` with no new failures anywhere in its output.
