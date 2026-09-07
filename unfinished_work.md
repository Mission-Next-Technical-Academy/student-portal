# Unfinished Work

## Student portal entry contract

The student portal intentionally shows the full technical-program catalogue.
A student's enrolled program remains actionable; programs they are not enrolled
in remain visible as locked discovery cards. Direct program routes remain
entitlement-gated as a separate security control, so catalogue visibility must
never be treated as access.

M360 101 is intentionally separate from the technical program cards. It is
injected above the technical catalogue for eligible active technical-track
students and must remain visible alongside their enrolled technical program.
The current M360 eligibility set is SOCAN, HDESK, and AIENG; ELECT does not
receive M360 under the November MVP architecture.

Do not filter the student dashboard down to enrolled technical programs only.
Do not fold M360 into a technical program. If enrollment later supports multiple
technical tracks or a different M360 eligibility policy, update the source-of-
truth enrollment rules and the M360 eligibility list together while preserving
both the locked-catalogue discovery model and the separate M360 entry point.
