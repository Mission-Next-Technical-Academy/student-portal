# Student login → My Programs entry

## Decision

After a successful **student** login, send the student to the `#/portal` **My
Programs** page. This is the decision point for the student's technical
coursework and the separate M360 Professional Readiness work.

The destination is:

```text
#/portal
```

From My Programs, learners can open their technical course or M360 as needed.

## Routing rules

1. Keep the existing admin rule: an admin always lands on `#/admin`.
2. Send every ordinary student sign-in to `#/portal`, whether or not the
   student currently has an active technical enrollment.
3. Preserve an explicit, valid return route used by a completed lab or console
   walkthrough; it must not be replaced by the normal coursework redirect.

## Implementation boundary

Make this change in `portal/app.js`, in `wireLogin()` after `signIn()` succeeds.
The existing router and `viewProgram()` access checks remain the authority for
technical-course access.

The programme overview should continue to provide the learner's normal next
step. This request does not change module locking, progress rules, catalogue
visibility for an unenrolled student, or navigation links once the student is
inside the portal.

## Acceptance checks

- A SOC Analyst student logging in normally reaches `#/portal`, where both
  their technical program and M360 entry are available.
- An admin login still reaches `#/admin`.
- A student with no active programme still reaches `#/portal`.
- A completed walkthrough that already returns to a specific module still
  returns to that module.
- Signing out and signing in again does not alter stored progress.
