# Staging instructor accounts

These are fictional staging accounts for checking course-scoped instructor
workspaces and message routing. They are not learner accounts, and must never
be copied to production or reused for a real person.

| Course | Login ID | Password | Required landing route |
| --- | --- | --- | --- |
| IT Help Desk | `3184759261-HDINST` | `Staging!HdInst2026` | `#/admin/track/HDESK` |
| SOC Analyst | `6291847350-SOCANINST` | `Staging!SocInst2026` | `#/admin/track/SOCAN` |

The login form derives the synthetic Auth email by lowercasing the login ID
and adding `@missionnext.example`. Therefore the corresponding Auth emails are
`3184759261-hdinst@missionnext.example` and
`6291847350-socaninst@missionnext.example`.

## Implementation status

Implemented in this repository:

- `20260920110000_course_scoped_faculty_messages.sql` creates course-scoped
  faculty messaging and unread-message notifications.
- `20260920120000_instructor_account_provisioning.sql` adds dedicated
  instructor identities, assignment-scoped roster/grading access, and a
  database guard that permits only the matching course assignment.
- The admin account generator includes a **Course instructor** account type.
- The local Supabase seed creates both accounts, their Auth bcrypt hashes,
  active roster records, credential lookup rows, and course assignments.

Apply these migrations and deploy the updated `admin-provision` Edge Function
to the staging project before signing in with these accounts. The local seed
is for a local Supabase reset only; it does not create hosted users by itself.

## Required account state

For each account, the provisioning path must create a confirmed Supabase Auth
user, its email identity, and the application roster/role records. The
password must be passed to the Supabase Auth admin API, which writes the
password hash; do not hand-author a reusable hash or store one in this file.

Both accounts must be active and must have exactly one active teaching
assignment:

| Login ID | Course assignment | May open | Must not open |
| --- | --- | --- | --- |
| `3184759261-HDINST` | `HDESK` | IT Help Desk workspace and its messages | SOC, AI/ML, Electrical, general admin workspace, student portal |
| `6291847350-SOCANINST` | `SOCAN` | SOC Analyst workspace and its messages | Help Desk, AI/ML, Electrical, general admin workspace, student portal |

The authoritative recipient mapping is
`faculty_course_assignments(user_id, track_code, active)`. It must contain one
active row for the instructor's own Auth `user_id` and course track. Do not
use a display name, login ID suffix, or a client-side route as the authorization
boundary.

## Provisioning checklist

1. Create or reset the staging Auth user with `email_confirm: true`; Supabase
   Auth generates and stores the bcrypt password hash.
2. Create the associated application account as an active instructor, rather
   than as a student enrollment. Preserve the login ID and selected course
   track as immutable identity data.
3. Insert the single active `faculty_course_assignments` row shown above.
4. Apply the course-scoped messaging migration before testing. It makes both
   message reads and replies depend on the active assignment, rather than on
   the browser's selected dashboard route.
5. Sign in using each login ID and confirm the application replaces every
   initial, stale, or manually typed route with that account's exact
   course-dashboard route.
6. Send a message from a student in each course. Verify only the matching
   instructor can see, reply to, and receive the unread bell count. Attempting
   the other course's route or querying its messages must return no data or an
   authorization failure.

## Creating another instructor

The admin-only account-creation flow needs an **Instructor** account type and
a required course selection. It should:

1. Generate a unique non-zero ten-digit prefix and an instructor suffix.
2. Generate a one-time strong password and create the confirmed Auth user.
3. Create an active instructor record and exactly one active course
   assignment in the same privileged transaction/workflow.
4. Reveal the credential only to the authorized administrator, then send the
   instructor to `#/admin/track/<assigned-track>` on every login.

An instructor creation request must reject `ADMIN`, multiple course tracks,
or an unassigned instructor. A general administrator is not implicitly an
instructor for every course.

## Offboarding an instructor

Only the academy-wide `ADMIN` panel may permanently remove a dedicated
instructor account. Open that instructor's credential panel and use **Delete
instructor account**. The action requires confirmation and accepts only
`SOCANINST` or `HDINST` identities; it cannot delete learner or `ADMIN`
accounts.

Before deletion, the portal automatically downloads a JSON offboarding archive
with the login ID, track, non-secret Auth timestamps, credential-record
timestamp, and course-assignment history. Passwords are never included. The
server then deletes the Auth user, revoking its sessions and cascading its
roster, faculty-assignment, and stored-credential records.

Deploy the updated `admin-provision` Edge Function before using this control:

```bash
supabase functions deploy admin-provision
```

## 2026-09-20 — production checklist completed for SOCAN/HDESK, AIENG/ELECT gap found

While testing the student "Message Instructor" feature live (post-`fb41d91`
deploy), found the course-scoped RLS policy
(`20260920110000_course_scoped_faculty_messages.sql`) had gone live with
**zero** `faculty_course_assignments` rows — every student, on every track,
got `new row violates row-level security policy for table
"student_messages"` on send. Root cause: this file's own checklist item 4
("Apply these migrations and deploy the updated admin-provision Edge
Function") had only had the migrations applied, not the Edge Function
redeploy — `admin-provision` was still at version 3, which doesn't know the
`create_instructor` action, so the new "Generate Account → Course
instructor" admin UI failed with `Unknown action "create_instructor"`.

Fixed, in order:
1. Redeployed `admin-provision` (owner ran `supabase functions deploy
   admin-provision` — blocked for the agent by the harness's own
   auto-mode classifier as a Production Deploy action). Now at version 4.
2. Provisioned real production instructors via the admin panel's Generate
   Account flow: `1989457660-SOCANINST` (SOCAN, active) and
   `6603016388-HDINST` (HDESK, active).
3. **Bug found while provisioning:** the admin "Generate Account" Track
   dropdown offers all four tracks (SOCAN/HDESK/AIENG/ELECT) for a Course
   instructor account type, but the backend's `INSTRUCTOR_TRACK_CODES`
   (`supabase/functions/admin-provision/provisioning.ts`) only ever
   supported `SOCANINST`/`HDINST` — this file's own checklist only ever
   scoped IT Help Desk and SOC Analyst. Selecting AIENG silently created a
   **second HDESK instructor** (`5106545914-HDINST`) mislabeled in the
   success panel as "Dashboard: AIENG — AI/ML" instead of erroring. No
   frontend validation catches this. Cleaned up: deactivated that row
   (`active = false`, not deleted — owner ran the `supabase db query`
   update directly, blocked for the agent by the same auto-mode classifier
   as a Modify Shared Resources action). AIENG and ELECT instructor
   provisioning is a real, unbuilt gap — not urgent since both tracks are
   still "Coming soon" to students (per `CLAUDE.md`'s program-parity
   notes), but the Track dropdown should be restricted to
   `INSTRUCTOR_TRACK_CODES`' actual courses (or the backend extended) before
   anyone relies on it for those two tracks.
4. **Verified live, full round trip, on GitHub Pages (not localhost):**
   signed in as `8987495051-SOCAN`, sent a real message via the Module 1
   "Message Instructor" pane; signed in as `1989457660-SOCANINST`, landed
   on `#/admin/track/SOCAN` (the instructor's forced home route), saw the
   real "Messages" tab with an unread badge, and read the message.
   Confirms the general `7355312413-ADMIN` account intentionally does NOT
   see the Messages tab (it queries `faculty_course_assignments` for the
   *viewer's own* `user_id`, and admins aren't instructors) — this had
   looked like a missing feature when compared against an earlier localhost
   session, but is deliberate scoping already commented in the code.

## Security notes

These plaintext values are intentionally limited to fictional staging access.
They are credentials despite being fake: keep this document out of any public
deployment artifact and rotate/reset the accounts after demonstration use.
Never put student, staff, or production passwords in Git, browser storage, or
the course-message fields. The message form must retain the Academy PII notice:

> Do not post personally identifiable information(PII) into these input fields
> for reasons of security, and privacy. Doing so would be a violation of
> Academy Policy.
