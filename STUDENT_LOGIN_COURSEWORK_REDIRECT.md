# Student login → coursework redirect

## Decision

After a successful **student** login, send the student straight to the overview
for their active programme rather than the `#/portal` programme catalogue.

For the current SOC Analyst cohort, the destination is:

```text
#/program/soc-analyst
```

This gives learners their module sequence, progress, and available labs as the
first thing they see after signing in.

## Routing rules

1. Keep the existing admin rule: an admin always lands on `#/admin`.
2. For a student with one active enrolment, redirect to
   `#/program/<active-program-slug>` after login.
3. If a student has multiple active enrolments, direct them to the first active
   enrolment in their stored enrolment order. A later enhancement may add a
   course switcher or remember the most recently opened programme.
4. If a student has no active enrolment, retain the existing `#/portal`
   catalogue destination.
5. Preserve an explicit, valid return route used by a completed lab or console
   walkthrough; it must not be replaced by the normal coursework redirect.

## Implementation boundary

Make this change in `portal/app.js`, in `wireLogin()` after `signIn()` succeeds.
Derive the target from the authenticated user's `enrollments` collection—do not
hard-code `soc-analyst` in the routing logic. The existing router and
`viewProgram()` access checks remain the authority for route access.

The programme overview should continue to provide the learner's normal next
step. This request does not change module locking, progress rules, catalogue
visibility for an unenrolled student, or navigation links once the student is
inside the portal.

## Acceptance checks

- A SOC Analyst student logging in normally reaches `#/program/soc-analyst`,
  not `#/portal`.
- An admin login still reaches `#/admin`.
- A student with no active programme still reaches `#/portal`.
- A completed walkthrough that already returns to a specific module still
  returns to that module.
- Signing out and signing in again does not alter stored progress.

