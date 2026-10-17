# Start here — Admin Submission Sheets (SOC Analyst + IT Help Desk)

Updated 2026-10-17 (end of day). This is the single entry point for a new
session on the instructor Submission Sheet work. It summarises a Claude Code
session (sprints S1–S6 via subagents), a Codex session (Help Desk H1–H4),
and the merges so far. Detailed specs:

- SOC spec + parity tables: `docs/workstreams/ADMIN_SUBMISSION_SHEET.md`
- Help Desk spec + parity tables: `docs/workstreams/HDESK_SUBMISSION_SHEET_HANDOFF.md`

## What it is

The admin Lab Attempts tab renders a Prove It attempt as one sheet laid out
like a printed assignment marked up in red pen. The sheet shows:

- header and score vs. pass mark;
- a verdict banner: **Recommend PASS**, **Recommend PASS — with
  corrections (N sections to fix)**, or **Recommend RETURN**;
- the student's answers, section by section, in the order the student filled
  them in;
- ✓/◐/✗ checks against the module's own answer key;
- key-evidence checks on written answers, plus advisory writing-mechanics
  and spelling checks;
- red-pen notes;
- teacher notes prefilled per ✗/◐ section;
- raw JSON folded last.

Decided attempts show the same sheet read-only, with the feedback that was
actually sent.

Verdict rule: the score and scorer-flagged critical failures (unsafe action,
safety cap) decide PASS or RETURN. Red sections on a passing score become
corrections and never flip the verdict. Scores themselves were never changed.

## Status

| Piece | State | Where |
| --- | --- | --- |
| Framework, M01–M12 sheets, spelling (S1–S6) | ✅ merged | PR #65 (`74fce5a`), #66 (docs) |
| "PASS — with corrections" banner, M06–M09 notes | ✅ merged | PR #67 (`3cdefcc`) |
| Help Desk sheets, all 16 lab keys (H0–H4) | ✅ merged (owner-approved 2026-10-17) | PR #68 |
| Staging click-through with a real synthetic instructor account | ❌ not done | needs owner-provided staging accounts |

PR #68 was re-verified on 2026-10-17 merged locally with current `master`:

- `tests/admin-submission-sheet.test.js`: 114 checks passed (104 cases, 13 files);
- spelling: 18 tests passed;
- `bin/ci-check.sh`: exit 0.

Merging to `master` deploys to GitHub Pages (live).

## Open owner decisions (nothing below is started)

1. **Unscored ticket fields (SOC M03–M09).** Several modules' scorers ignore
   some or all ticket fields: severity, user/device, route, and in M04/M05
   the work notes. The sheet still flags those fields red, but a junk ticket
   cannot lower the score. Should they count? Counting them changes scoring.
2. **M07 answer key mismatch.** `MODULE_SEVEN_ANSWER_KEY` and the module's
   comments describe a GRE-tunnel / web-shell / FTP scenario. The fixture
   students work is a QR-invoice phish. The sheet marks severity,
   disposition and route advisory until the key is fixed.
3. **M06 key vs. fixture.** The key says "Confirmed malicious"; the
   scenario text says "suspicious, not proven".
4. **Help Desk issues found in H0.** Except the path checkboxes, which H3
   now saves, none of these were confirmed fixed. Details are in the HDESK
   handoff, section "H0 corrections":
   - coach completion fires before the final resolve click;
   - `finish()` probably posts twice, giving duplicate `lab_attempts` rows
     (verify on staging);
   - every launch link uses `restart=1`, which wipes earlier work;
   - the correct diagnosis is the last option for most tickets, and retries
     are unlimited;
   - M08 resolves HD-2110 while the M12 key requires escalating it;
   - HD-2106 priority is P3 in the simulator but P4 in M12;
   - the `?coachComplete=` fallback marks a lab complete with no
     `lab_attempts` row;
   - Help Desk rows are stamped with the SOC rubric version.
5. **Help Desk guided labs** (M01.2, M02.3/2.4, M03–M11) are guided
   walk-throughs. Under `docs/LAB_ASSESSMENT_STANDARD.md` they read as
   Practice It; only the M12 capstone is a true Prove It. Decide whether to
   relabel them or promote M11.

## Known test noise (pre-existing, not from this work)

`guided-lab-console-guide`, `soc-m04-assessment-rubric`,
`soc-m04-assessment-scorer` and `soc-m05-assessment-console` fail the same way
on a clean checkpoint from before this work (`c0e195a`).

## Next steps for a new session

1. Confirm #68 is merged (`gh pr view 68`) and `master` is green:
   - `bash bin/ci-check.sh`
   - `node tests/admin-submission-sheet.test.js`
   - `node tests/admin-sheet-spelling.test.js`
2. Staging click-through, with owner-provided synthetic accounts:
   - `bin/dev.sh` then `bin/dev.sh status`, which must show `target=STAGING`;
   - submit one SOC Prove It and one Help Desk lab as the student;
   - review, approve or return them as the instructor;
   - confirm the student sees the sent notes.
3. Work on any owner decision above only after the owner answers it.

## Rules

- Read `CLAUDE.md`, `ROADMAP.md`, `docs/operations/AI_AGENT_RULES.md` and
  `docs/LAB_ASSESSMENT_STANDARD.md` first.
- Feature branch plus a PR to `master`. Never push to `master`. Merge only
  with owner approval.
- Other sessions (Claude and Codex) share this working tree and
  `.git/index`. Run `git status` before staging and never stage another
  session's WIP. Use a `git worktree` for parallel work.
- No database, Supabase function, staging-branch or production action is
  authorised by this handoff.
