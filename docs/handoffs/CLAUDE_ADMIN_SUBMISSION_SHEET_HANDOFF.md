# Start here — Admin Submission Sheets (SOC Analyst + IT Help Desk)

Updated 2026-10-17 after deployment verification. This is the single entry
point for instructor Submission Sheet work. Detailed specs:

- SOC spec + parity tables: `docs/workstreams/ADMIN_SUBMISSION_SHEET.md`
- Help Desk spec + parity tables: `docs/workstreams/HDESK_SUBMISSION_SHEET_HANDOFF.md`
- CI/CD and shared worktree cleanup audit: `docs/handoffs/CI_CD_WORKTREE_CLEANUP_HANDOFF.md`

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
| Help Desk sheets, all 16 lab keys (H0–H4) | ✅ owner-approved; squash commit on `master` | PR #68, commit `81d23c8` |
| Help Desk completion capture + rubric metadata | ⏳ PR checks / promotion | PR #69 (`codex/hdesk-submission-closeout`) |
| Staging and production source deploys | ✅ successful | staging sync + staging site deploy; GitHub Pages deploy at `81d23c8` |
| Student/instructor click-through UAT | ⏳ not done | needs owner-provided synthetic staging accounts |

PR #68 is **closed by the owner after landing squash commit `81d23c8` on
`master`** (closing comment: “Landed directly on master as 81d23c8 (squash,
owner-approved). Closing.”). GitHub reports the PR state as closed, with no
`mergedAt` or merge commit; the squash commit is nevertheless on `master`.
The staging and production source deployments for that SHA both completed
successfully on 2026-10-17. Verification:

- `tests/admin-submission-sheet.test.js`: 114 checks passed (104 cases, 13 files);
- spelling: 18 tests passed;
- `bin/ci-check.sh`: exit 0.
- staging sync applied no feature migrations and successfully dispatched the
  staging-site build/deploy for `81d23c8`;
- GitHub Pages deployed `81d23c8`, and the live index loads the Help Desk
  sheet scripts.

This verifies the deployed code and assets, not a signed-in student/instructor
workflow. No account click-through has been performed. PR #69 remains pending
promotion, so its code is not yet in the staging or production deploys.

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
4. **Help Desk open content and workflow decisions.** Relaunching an
   unsubmitted coach with `restart=1` resets unsaved simulator state; the
   diagnosis options often place the correct answer last; HD-2110's guided
   outcome conflicts with its capstone key; HD-2106 priority differs between
   simulator and capstone. Guided-lab Practice It vs Prove It classification
   also remains unresolved because the completion and grading queues are
   coupled. See the HDESK handoff for evidence.

## Known test noise (pre-existing, not from this work)

`guided-lab-console-guide`, `soc-m04-assessment-rubric`,
`soc-m04-assessment-scorer` and `soc-m05-assessment-console` were recorded as
failing on the clean checkpoint before this work (`c0e195a`). The current
`bin/ci-check.sh` passes; these standalone suites are outside that gate.

## Next steps

1. Finish review and promotion of PR #69; then update deployment SHAs and
   workflow evidence in this handoff and the CI/CD worktree audit.
2. Run signed-in staging click-through, with owner-provided synthetic accounts:
   - `bin/dev.sh` then `bin/dev.sh status`, which must show `target=STAGING`;
   - submit one SOC Prove It and one Help Desk lab as the student;
   - review, approve or return them as the instructor;
   - confirm the student sees the sent notes.
3. Resolve the listed owner decisions before changing scoring or lab
   classification.

## Rules

- Read `CLAUDE.md`, `ROADMAP.md`, `docs/operations/AI_AGENT_RULES.md` and
  `docs/LAB_ASSESSMENT_STANDARD.md` first.
- Feature branch plus a PR to `master`. Never push to `master`. Merge only
  with owner approval.
- Other sessions (Claude and Codex) share this working tree and
  `.git/index`. Run `git status` before staging and never stage another
  session's WIP. Use a `git worktree` for parallel work.
- Do not make database, Supabase function, staging-branch, merge, or production
  changes based only on this historical handoff; follow current owner
  authorization and `docs/operations/AI_AGENT_RULES.md`.
