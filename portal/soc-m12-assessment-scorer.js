/* Pure, deterministic 100-point Module 12 capstone scorer. */
const SocM12AssessmentScorer = (() => {
  'use strict';
  const PASSING_SCORE=70, SAFETY_CAP=69;
  function score(state,fixture,options={}) {
    const extracted=SocM12AssessmentRubric.extract(state,fixture,options), byId=new Map(extracted.criteria.map(x=>[x.id,x]));
    const outcomes={};
    SocM12AssessmentRubric.CRITERIA.forEach(c=>{
      const result=byId.get(c.id); if(!result) throw new TypeError(`M12 rubric criterion missing: ${c.id}`);
      if(extracted.rubricVersion===2) {
        outcomes[c.id]={awards:result.awards||[],deductions:result.deductions||[],evidence:result.evidenceIds,misses:result.misses||[],feedback:`${c.label}: ${result.points} of ${c.weight} points. ${result.explanation}`};
        return;
      }
      const ratio=result.finding==='observed'?1:result.finding==='partial'?0.5:0;
      const points=Math.round(c.weight*ratio);
      outcomes[c.id]={awards:points?[{points,reason:result.explanation}]:[],evidence:result.evidenceIds,
        misses:points===c.weight?[]:[`${c.label}: ${result.finding==='partial'?'some outcomes are present but incomplete.':'the required outcome is not evidenced.'}`],
        feedback:`${c.label}: ${points} of ${c.weight} points. ${result.explanation}`};
    });
    const scored=SocAssessmentScorer.scoreCriteria(SocM12AssessmentRubric.CRITERIA,outcomes,{passingScore:PASSING_SCORE,
      ...(extracted.unsafeExecution?{cap:{points:SAFETY_CAP,reason:'an unsafe state-changing action was attempted without valid scope or approval'}}:{})});
    return {assessmentId:fixture?.scenario?.id||null,rubricVersion:extracted.rubricVersion,score:scored.review.total,
      rawScore:scored.criteria.reduce((n,c)=>n+c.points,0),maxScore:scored.review.max,passed:scored.review.pass,
      safetyCap:scored.review.cap,unsafeExecution:extracted.unsafeExecution,criteria:scored.criteria,review:scored.review,
      selectedEvidence:extracted.selectedEvidence,actionCount:extracted.actionCount,
      ...(extracted.reviewArtifact?{reviewArtifact:{...extracted.reviewArtifact,competencyResults:scored.criteria,scoreExplanation:scored.review.feedback,automatedScore:scored.review.total}}:{})};
  }
  return Object.freeze({PASSING_SCORE,SAFETY_CAP,score});
})();
