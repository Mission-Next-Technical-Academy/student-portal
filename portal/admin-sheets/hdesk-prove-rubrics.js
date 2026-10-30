/* Help Desk Prove It rubrics, by lab key, for the instructor sheet.
 * General terms only: competency names, points, the pass mark and the
 * critical-error rule. This repository is public, so nothing here says which
 * ticket fields, diagnosis, steps or decision earn credit; that answer key is
 * kept outside the repository. Faculty have final grading authority. */
(() => {
  'use strict';
  const HDESK_PROVE_RUBRICS = {
    'lab-its-01-prove-it': {
      version: 'hdesk-its-01-prove-v1',
      moduleKey: 'its-01',
      technicalPoints: 100,
      passPercent: 70,
      competencies: [
        { id: 'triage', label: 'Triage', points: 22 },
        { id: 'investigation', label: 'Investigation', points: 11 },
        { id: 'diagnosis', label: 'Diagnosis', points: 11 },
        { id: 'action', label: 'Action and decision', points: 28 },
        { id: 'documentation', label: 'Documentation and communication', points: 28 },
      ],
      // Feedback only; never adds or removes points.
      formative: [{ id: 'efficiency', label: 'Efficiency' }],
      criticalErrorCapPercent: 69,
      criticalErrorRule: 'An attempt with a critical error is capped at 69%, so it cannot pass, whatever its points.',
      partialCredit: 'Each competency can earn partial credit, justified in the feedback for that competency. Different valid ways of working the ticket earn the same credit.',
      facultyFinal: true,
    },
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = { HDESK_PROVE_RUBRICS };
  if (typeof window !== 'undefined') window.HDESK_PROVE_RUBRICS = HDESK_PROVE_RUBRICS;
})();
