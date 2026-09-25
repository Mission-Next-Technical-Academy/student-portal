# Admin Reset Flow

Use this when a student was disenrolled by mistake and you need a connected AI agent to restore their progress.

## When to use this

- The student should have stayed enrolled.
- The disenrollment was accidental.
- You want the student restored to their previous progress state, not started over.

## What the AI agent should do

1. Confirm the student identity.
2. Capture a recoverable snapshot of the student record before changing anything.
3. Restore the student's enrollment and progress state.
4. Show a concise summary of what was restored.
5. Provide a copyable report in case the change needs to be reviewed later.

## Copy and paste this into a connected AI agent

```text
You are helping an academy admin recover a student whose disenrollment was done by mistake.

Task:
- Find the student record for: [STUDENT NAME / STUDENT ID]
- Confirm they were disenrolled by mistake.
- Before making any change, capture a recoverable snapshot of the student's current state.
- Restore the student's progress to the state they had before the mistaken disenrollment.
- Restore the student's enrollment status so they are active again.
- Do not delete history, reports, scores, notes, attempts, or audit records.
- If there is any uncertainty about which student or which snapshot to restore, stop and ask for clarification.

What to return:
- The student name or ID you matched
- The snapshot you captured
- The exact changes you made
- A short plain-English summary the admin can copy into notes
- A copyable report block that can be pasted into another AI if this needs to be reviewed later

Output format:
1. First, say whether the student was found.
2. Then say whether the snapshot was captured.
3. Then say whether the progress and enrollment were restored.
4. Then provide the copyable report.
5. If anything could not be done, say exactly what blocked it.
```

## Admin checklist

- Make sure the student identity is correct before approving the reset.
- Make sure the wording says this was a mistaken disenrollment.
- Make sure the AI agent captured a snapshot before restoring anything.
- Make sure the agent did not delete historical records.
- Copy the report into the student record or case notes if needed.

## What not to do

- Do not use this for a legitimate disenrollment.
- Do not let the agent guess the student.
- Do not accept a reset that deletes history.
- Do not skip the snapshot step.
