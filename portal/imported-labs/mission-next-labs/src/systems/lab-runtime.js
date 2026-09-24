// Keep the student-facing lab runtime focused on the analyst workflow.
// Legacy lab records may still contain authored knowledge-check metadata;
// remove it before any page component can consume the records.
(function () {
  const labs = window.MISSION_NEXT_LABS || {};
  Object.values(labs).forEach(lab => {
    if (!lab || typeof lab !== 'object') return;
    delete lab.checkOnLearning;
    if (lab.completion) delete lab.completion.minQuizScore;
    (lab.exercises || []).forEach(exercise => {
      (exercise.steps || []).forEach(step => delete step.checkOnLearning);
    });
  });
})();
