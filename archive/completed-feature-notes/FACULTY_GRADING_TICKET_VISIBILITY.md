# Faculty grading: submitted ticket visibility

Updated 2026-09-21.

The instructor grading queue now renders the saved student case-ticket
artifact before the automated rubric result. For Module 1's independent case,
the view displays the student's ticket selections (status, severity, affected
user/device, disposition, escalation, and destination) in readable labels,
followed by the exact Analyst Work Notes text. Any saved handoff fields are
also displayed when present.

This lets faculty assess communication from the student's actual written
response while retaining the existing system score breakdown as raw points.
The submission data remains the immutable `lab_attempts.result.case_record`
snapshot; the faculty view does not read a student's working browser draft.
