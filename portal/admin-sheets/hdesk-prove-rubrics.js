/* Help Desk Prove It rubrics, by lab key, for the instructor sheet.
 * General terms only: competency names, points and the critical-error rule.
 * This repository is public, so nothing here says which ticket fields,
 * diagnosis, steps or decision earn credit; that answer key is kept outside
 * the repository. Faculty have final grading authority. The pass mark is the
 * database's (public.lab_pass_mark()); the sheet reads it from the attempt's
 * pass_threshold. */
(() => {
  'use strict';
  const HDESK_PROVE_RUBRICS = {
    'lab-its-01-prove-it': {
      version: 'hdesk-its-01-prove-v2',
      moduleKey: 'its-01',
      // Ticket fields set for the student in Module 1 (read-only in the
      // simulator, never scored). The course page saves these, whatever a
      // submit message says (itsCleanProveWork).
      presetFields: { category: 'Service Request', type: 'Access request', priority: 'P3' },
      technicalPoints: 100,
      competencies: [
        { id: 'triage', label: 'Triage', points: 22 },
        { id: 'investigation', label: 'Investigation', points: 11 },
        { id: 'diagnosis', label: 'Diagnosis', points: 11 },
        { id: 'action', label: 'Action and decision', points: 28 },
        { id: 'documentation', label: 'Documentation and communication', points: 28 },
      ],
      // Feedback only; never adds or removes points.
      formative: [{ id: 'efficiency', label: 'Efficiency' }],
      criticalErrorRule: 'A critical error is an automatic zero: the attempt and every competency score 0, and it is returned, never approved.',
      partialCredit: 'Each competency can earn partial credit, justified in the feedback for that competency. Different valid ways of working the ticket earn the same credit.',
      facultyFinal: true,
    },
    // Module 2: a queue of tickets worked on one screen (the simulator's queue
    // Prove mode). shape 'queue' picks the queue package in the course page
    // (itsCleanProveQueueWork) and the queue review panel.
    'lab-its-10-prove-it': {
      version: 'hdesk-its-10-prove-v1',
      moduleKey: 'its-10',
      shape: 'queue',
      ticketCount: 6,
      technicalPoints: 100,
      competencies: [
        { id: 'triage', label: 'Triage', points: 61 },
        { id: 'documentation', label: 'Documentation and communication', points: 39 },
      ],
      // Feedback only; never adds or removes points.
      formative: [{ id: 'efficiency', label: 'Efficiency' }],
      criticalErrorRule: 'A critical error is an automatic zero: the attempt and every competency score 0, and it is returned, never approved.',
      partialCredit: 'Each competency can earn partial credit, justified in the feedback for that competency. Different valid work orders within the same priority bands earn the same credit.',
      writingAck: 'I have read the student\'s rewritten ticket and every reason they wrote.',
      facultyFinal: true,
    },
    // Module 3: one ticket on Module 1's form with the student setting Class,
    // Category, Impact, Urgency and the assignment group (matrixFields; the
    // course page works out Priority), and four pieces of writing. writing:
    // the extra boxes and their limits, besides the work note and the reply.
    'lab-its-11-prove-it': {
      version: 'hdesk-its-11-prove-v1',
      moduleKey: 'its-11',
      matrixFields: true,
      writing: { keyFinding: 600, kbDraft: 4000 },
      technicalPoints: 100,
      competencies: [
        { id: 'triage', label: 'Triage', points: 11 },
        { id: 'investigation', label: 'Investigation', points: 11 },
        { id: 'diagnosis', label: 'Diagnosis', points: 11 },
        { id: 'action', label: 'Action and decision', points: 17 },
        { id: 'documentation', label: 'Documentation and communication', points: 50 },
      ],
      // Feedback only; never adds or removes points. A warm handoff is shown
      // as "exceeds" and never changes the score.
      formative: [{ id: 'efficiency', label: 'Efficiency' }],
      criticalErrorRule: 'A critical error is an automatic zero: the attempt and every competency score 0, and it is returned, never approved. Where the recommendation says "check this", read the student\'s writing and confirm or clear it.',
      partialCredit: 'Each competency can earn partial credit, justified in the feedback for that competency. Different valid ways of working the ticket earn the same credit. Criteria marked "check this" read the student\'s writing: confirm or change their points.',
      writingAck: 'I have read the student\'s key finding, handoff note, customer update and KB draft in full.',
      facultyFinal: true,
    },
    // Module 4: one ticket on Module 3's form (matrixFields), worked on the
    // requester's computer with typed commands and printer screens. The panel
    // shows the work note and the reply (panelWriting), then the searches,
    // actions, commands and print queues at submit (simulatorWork).
    'lab-its-02-prove-it': {
      version: 'hdesk-its-02-prove-v1',
      moduleKey: 'its-02',
      matrixFields: true,
      panelWriting: [['resolutionNote', 'Work note'], ['userReply', 'Reply to the user']],
      simulatorWork: true,
      technicalPoints: 100,
      competencies: [
        { id: 'triage', label: 'Triage', points: 11 },
        { id: 'investigation', label: 'Investigation', points: 23 },
        { id: 'diagnosis', label: 'Diagnosis', points: 22 },
        { id: 'action', label: 'Action and decision', points: 22 },
        { id: 'documentation', label: 'Documentation and communication', points: 22 },
      ],
      // Feedback only; never adds or removes points.
      formative: [{ id: 'efficiency', label: 'Efficiency' }],
      criticalErrorRule: 'A critical error is an automatic zero: the attempt and every competency score 0, and it is returned, never approved. Where the recommendation says "check this", read the student\'s writing and confirm or clear it.',
      partialCredit: 'Each competency can earn partial credit, justified in the feedback for that competency. Different valid ways of working the ticket earn the same credit. Criteria marked "check this" read the student\'s writing: confirm or change their points.',
      writingAck: 'I have read the student\'s work note and reply to the user in full.',
      facultyFinal: true,
    },
    // Module 5: one ticket on Module 3's form (matrixFields), worked on the
    // requester's laptop with Module 5's Windows tool screens. The panel shows
    // the work note and the reply, then the searches, actions, commands and
    // the laptop's Windows state at submit (simulatorWork).
    'lab-its-03-prove-it': {
      version: 'hdesk-its-03-prove-v1',
      moduleKey: 'its-03',
      matrixFields: true,
      panelWriting: [['resolutionNote', 'Work note'], ['userReply', 'Reply to the user']],
      simulatorWork: true,
      technicalPoints: 100,
      competencies: [
        { id: 'triage', label: 'Triage', points: 11 },
        { id: 'investigation', label: 'Investigation', points: 28 },
        { id: 'diagnosis', label: 'Diagnosis', points: 28 },
        { id: 'action', label: 'Action and decision', points: 22 },
        { id: 'documentation', label: 'Documentation and communication', points: 11 },
      ],
      // Feedback only; never adds or removes points.
      formative: [{ id: 'efficiency', label: 'Efficiency' }],
      criticalErrorRule: 'A critical error is an automatic zero: the attempt and every competency score 0, and it is returned, never approved. Where the recommendation says "check this", read the student\'s writing and confirm or clear it.',
      partialCredit: 'Each competency can earn partial credit, justified in the feedback for that competency. Different valid ways of working the ticket earn the same credit: a tool screen and the same check typed in PowerShell count alike. Criteria marked "check this" read the student\'s writing: confirm or change their points.',
      writingAck: 'I have read the student\'s work note and reply to the user in full.',
      facultyFinal: true,
    },
    // Module 6: one ticket on Module 3's form (matrixFields) with a key-finding
    // note, worked on the requester's laptop with the Module 5 and Module 6
    // tool screens and a chat with the user. The panel shows the key finding,
    // the work note and the reply, then the questions asked, the searches,
    // actions, commands and the laptop's state at submit (simulatorWork).
    'lab-its-07-prove-it': {
      version: 'hdesk-its-07-prove-v1',
      moduleKey: 'its-07',
      matrixFields: true,
      writing: { keyFinding: 600 },
      panelWriting: [['keyFinding', 'Key finding'], ['resolutionNote', 'Work note'], ['userReply', 'Reply to the user']],
      simulatorWork: true,
      technicalPoints: 100,
      competencies: [
        { id: 'triage', label: 'Triage', points: 11 },
        { id: 'investigation', label: 'Investigation', points: 28 },
        { id: 'diagnosis', label: 'Diagnosis', points: 17 },
        { id: 'action', label: 'Action and decision', points: 28 },
        { id: 'documentation', label: 'Documentation and communication', points: 16 },
      ],
      // Feedback only; never adds or removes points.
      formative: [{ id: 'efficiency', label: 'Efficiency' }],
      criticalErrorRule: 'A critical error is an automatic zero: the attempt and every competency score 0, and it is returned, never approved. Where the recommendation says "check this", read the student\'s writing and confirm or clear it.',
      partialCredit: 'Each competency can earn partial credit, justified in the feedback for that competency. Different valid ways of working the ticket earn the same credit: a tool screen and the same check typed in PowerShell count alike. Criteria marked "check this" read the student\'s writing: confirm or change their points.',
      writingAck: 'I have read the student\'s key finding, work note and reply to the user in full.',
      facultyFinal: true,
    },
    // Module 7: one ticket on Module 3's form (matrixFields) with a key-finding
    // note, worked on the read-only server screens and a one-question call with
    // the user. The panel shows the key finding, the work note and the reply,
    // then the question asked, the screens opened, the searches and every
    // command (simulatorWork). Nothing on a computer changes, so the panel has
    // no computer-at-submit section (machineSummary false).
    'lab-its-05-prove-it': {
      version: 'hdesk-its-05-prove-v1',
      moduleKey: 'its-05',
      matrixFields: true,
      writing: { keyFinding: 600 },
      panelWriting: [['keyFinding', 'Key finding'], ['resolutionNote', 'Work note'], ['userReply', 'Reply to the user']],
      simulatorWork: true,
      machineSummary: false,
      technicalPoints: 100,
      competencies: [
        { id: 'triage', label: 'Triage', points: 17 },
        { id: 'investigation', label: 'Investigation', points: 28 },
        { id: 'diagnosis', label: 'Diagnosis', points: 16 },
        { id: 'action', label: 'Action and decision', points: 28 },
        { id: 'documentation', label: 'Documentation and communication', points: 11 },
      ],
      // Feedback only; never adds or removes points.
      formative: [{ id: 'efficiency', label: 'Efficiency' }],
      criticalErrorRule: 'A critical error is an automatic zero: the attempt and every competency score 0, and it is returned, never approved. Where the recommendation says "check this", read the student\'s writing and confirm or clear it.',
      partialCredit: 'Each competency can earn partial credit, justified in the feedback for that competency. Different valid ways of working the ticket earn the same credit: a server screen and the same check typed in PowerShell count alike, and no typed command is required. Criteria marked "check this" read the student\'s writing: confirm or change their points.',
      writingAck: 'I have read the student\'s key finding, work note and reply to the user in full.',
      facultyFinal: true,
    },
    // Module 8: one ticket on Module 3's form (matrixFields) with a key-finding
    // note, worked on the Active Directory and Entra screens, the evidence
    // cards and a one-question call. A request and a message to another team
    // are actions on the ticket, listed with the other actions. Nothing on a
    // computer changes, so the panel has no computer-at-submit section.
    'lab-its-06-prove-it': {
      version: 'hdesk-its-06-prove-v1',
      moduleKey: 'its-06',
      matrixFields: true,
      writing: { keyFinding: 600 },
      panelWriting: [['keyFinding', 'Key finding'], ['resolutionNote', 'Work note'], ['userReply', 'Reply']],
      simulatorWork: true,
      machineSummary: false,
      technicalPoints: 100,
      competencies: [
        { id: 'triage', label: 'Triage', points: 22 },
        { id: 'investigation', label: 'Investigation', points: 17 },
        { id: 'diagnosis', label: 'Diagnosis', points: 17 },
        { id: 'action', label: 'Action and decision', points: 33 },
        { id: 'documentation', label: 'Documentation and communication', points: 11 },
      ],
      // Feedback only; never adds or removes points.
      formative: [{ id: 'efficiency', label: 'Efficiency' }],
      criticalErrorRule: 'A critical error is an automatic zero: the attempt and every competency score 0, and it is returned, never approved. Where the recommendation says "check this", read the student\'s writing and confirm or clear it.',
      partialCredit: 'Each competency can earn partial credit, justified in the feedback for that competency. Different valid ways of working the ticket earn the same credit: a screen and the same check typed in PowerShell count alike, and no typed command is required. Criteria marked "check this" read the student\'s writing: confirm or change their points.',
      writingAck: 'I have read the student\'s key finding, work note and reply in full.',
      facultyFinal: true,
    },
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = { HDESK_PROVE_RUBRICS };
  if (typeof window !== 'undefined') window.HDESK_PROVE_RUBRICS = HDESK_PROVE_RUBRICS;
})();
