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

## Security notes

These plaintext values are intentionally limited to fictional staging access.
They are credentials despite being fake: keep this document out of any public
deployment artifact and rotate/reset the accounts after demonstration use.
Never put student, staff, or production passwords in Git, browser storage, or
the course-message fields. The message form must retain the Academy PII notice:

> Do not post personally identifiable information(PII) into these input fields
> for reasons of security, and privacy. Doing so would be a violation of
> Academy Policy.
