/* Outcome-based capstone competencies; evidence is derived from action results, not clicks. */
const SocM12AssessmentRubric = (() => {
  'use strict';
  const CRITERIA = Object.freeze([
    { id:'intelligence-preparation', label:'Intelligence and preparation', weight:10 },
    { id:'queries-detection-scheduling', label:'Queries, detection rules and scheduling', weight:18 },
    { id:'alert-incident-management', label:'Alert validation and incident management', weight:12 },
    { id:'cross-domain-investigation', label:'Cross-domain investigation', weight:18 },
    { id:'timeline-scope-evidence-attack', label:'Timeline, scope, evidence and ATT&CK', weight:12 },
    { id:'tuning-automation-containment', label:'Detection tuning, automation and containment', weight:14 },
    { id:'eradication-recovery', label:'Eradication and recovery', weight:8 },
    { id:'reporting-operations-lessons', label:'Reporting, operations and lessons learned', weight:8 },
  ].map(Object.freeze));
  const list=(x)=>Array.isArray(x)?x:[], includes=(a,b)=>list(a).includes(b);
  const outcome=(id,level,evidence,why)=>({id,finding:level,evidenceIds:[...new Set(list(evidence).filter(Boolean))],explanation:why});
  function extract(state,fixture) {
    const s=fixture?.scenario, truth=fixture?.expectedTruth, x=state||{};
    if(!s||!truth) return {rubricVersion:1,criteria:CRITERIA.map(c=>outcome(c.id,'unknown',[],'Scenario unavailable.'))};
    const actions=list(x.actionHistory), find=(type)=>actions.filter(a=>a.type===type), evidenceIds=list(x.selectedEvidence);
    const allTruthEvidence=truth.selectedEvidence, chosenTruth=allTruthEvidence.filter(id=>evidenceIds.includes(id));
    const intel=Object.values(x.intelligence||{}), malicious=intel.some(i=>i.decision==='malicious'&&i.rationale.length>=25);
    const queryRuns=list(x.queryRuns), correlated=queryRuns.some(q=>q.outcome==='correlated'&&q.matchedEvidence.length>=3);
    const savedRule=list(x.rules).some(r=>r.outcome==='correlated'&&r.query.length>=20);
    const scheduled=list(x.schedules).some(q=>q.ruleId===truth.validRuleId);
    const alertReviews=Object.values(x.alertReviews||{}), dispositions=Object.values(x.dispositions||{});
    const incidents=list(x.incidentLinks), goodIncident=incidents.some(i=>i.incidentId===s.caseId);
    const investigation=list(x.investigations), domains=new Set(investigation.map(i=>i.domain));
    const validFindings=investigation.filter(i=>i.evidenceIds.length&&i.finding.length>=30);
    const attack=list(x.attackMappings), correctAttack=truth.demonstratedAttack.filter(id=>attack.some(m=>m.technique===id&&truth.attackEvidence[id].some(e=>m.evidenceIds.includes(e))));
    const coverage=truth.affectedEntities.filter(id=>investigation.some(i=>i.domain==='scope'&&i.finding.toLowerCase().includes(id)&&i.evidenceIds.some(e=>fixture.scenario.evidence.find(row=>row.id===e)?.entityIds.includes(id))));
    const timeline=investigation.some(i=>i.domain==='timeline'&&i.evidenceIds.length>=3);
    const workflow=list(x.workflows), execs=list(x.executions), approvals=list(x.approvals);
    const safeExec=truth.safeActions.filter(action=>execs.some(e=>`${e.action}:${e.target}`===action&&e.outcome==='success'));
    const unsafe=execs.some(e=>e.outcome==='success'&&((e.target==='acct-091'||e.action==='delete-evidence'||e.action==='shutdown-all')||(['isolate','revoke-session','restore'].includes(e.action)&&!approvals.some(a=>a.action===e.action&&a.target===e.target&&a.approved))));
    const recovery=list(x.recovery), restored=recovery.some(r=>r.action==='restore'&&r.target==='BK-204-0900'&&r.outcome==='success'), validated=recovery.some(r=>r.action==='scan'&&r.outcome==='success')&&recovery.some(r=>r.action==='monitor'&&r.outcome==='success');
    const reports=x.reports||{}, reportKinds=Object.keys(reports), hasEvidenceReport=Object.values(reports).some(r=>r.text&&r.evidenceIds.length), reportHasUnknown=Object.values(reports).some(r=>/unknown|uncertain|not.*confirm/i.test(r.text));
    const closure=x.closure, correctClosure=closure?.decision==='retain'||(closure?.decision==='close'&&restored&&validated);
    const criteria=[];
    const add=(id,score,evidence,explanation)=>criteria.push(outcome(id,score,evidence,explanation));
    add('intelligence-preparation',malicious?'observed':intel.length?'partial':'unknown',find('intel-decision').map(a=>a.id),'Contextual intelligence decision with rationale.');
    let qScore=(correlated?2:0)+(savedRule?1:0)+(scheduled?1:0); add('queries-detection-scheduling',qScore>=4?'observed':qScore?'partial':queryRuns.length?'incomplete':'unknown',[...find('query-run'),...find('rule-save'),...find('rule-schedule')].map(a=>a.id),'Reproducible cross-source outcomes, saved rule and recurring execution.');
    let alertScore=(alertReviews.length>=2?1:0)+(dispositions.length>=2?1:0)+(goodIncident?1:0); add('alert-incident-management',alertScore===3?'observed':alertScore?'partial':actions.some(a=>a.type==='review-alert')?'incomplete':'unknown',[...find('review-alert'),...find('alert-disposition'),...find('incident-link')].map(a=>a.id),'Alert conclusions and incident relationship.');
    let domainCount=['identity','email','endpoint','network','exposure'].filter(d=>domains.has(d)).length; add('cross-domain-investigation',domainCount>=4&&validFindings.length>=4?'observed':domainCount>=2?'partial':domainCount?'incomplete':'unknown',find('investigation').map(a=>a.id),'Evidence-linked findings across distinct SOC data domains.');
    let timelineScope=(timeline?1:0)+(coverage.length===2?1:coverage.length?0.5:0)+(chosenTruth.length>=4?1:chosenTruth.length?0.5:0)+(correctAttack.length>=3?1:correctAttack.length?0.5:0);
    add('timeline-scope-evidence-attack',timelineScope>=3.5?'observed':timelineScope>=1?'partial':evidenceIds.length?'incomplete':'unknown',[...find('evidence-select'),...find('investigation'),...find('attack-map')].map(a=>a.id),'Timeline, bounded scope, selected support and demonstrated ATT&CK behavior.');
    let tuned=workflow.some(w=>w.nodes.includes('approval')&&w.edges.some(e=>e.from==='preserve'&&e.to==='approval')&&w.edges.some(e=>e.from==='approval'&&e.to==='isolate')), containment=safeExec.length>=3;
    let ops=(tuned?1:0)+(containment?1:0)+(approvals.some(a=>a.approved)?1:0); add('tuning-automation-containment',ops>=3?'observed':ops?'partial':workflow.length||execs.length?'incomplete':'unknown',[...find('workflow-design'),...find('approval'),...find('execute')].map(a=>a.id),'Tuned automation, explicit approval and supported containment outcomes.');
    let recoveryScore=(recovery.some(r=>r.action==='remove-persistence'&&r.target==='ws-204'&&r.outcome==='success')?1:0)+(restored?1:0)+(validated?1:0); add('eradication-recovery',recoveryScore===3?'observed':recoveryScore?'partial':recovery.length||execs.length?'incomplete':'unknown',[...find('execute'),...find('recovery')].map(a=>a.id),'Persistence removal, known-good restore, clean scan and monitoring.');
    const technical=reports.technical, executive=reports.executive, lessons=reports.lessons;
    const technicalOk=technical&&technical.evidenceIds.length>=2&&/scope|sequence|timeline|confirmed/i.test(technical.text);
    const executiveOk=executive&&/impact|business|service|user|decision|contain/i.test(executive.text)&&!(/\b(?:T\d{4}|\d{1,3}(?:\.\d{1,3}){3}|[a-f0-9]{40,})\b/i.test(executive.text));
    const lessonsOk=lessons&&lessons.text.length>=40&&/improv|control|detect|follow.?up|owner/i.test(lessons.text);
    let reportScore=(technicalOk?1:0)+(executiveOk?1:0)+(reportKinds.includes('handoff')||list(x.handoffs).length?1:0)+(reportHasUnknown?1:0)+(lessonsOk?1:0)+(correctClosure?1:0);
    add('reporting-operations-lessons',reportScore>=4?'observed':reportScore?'partial':reportKinds.length?'incomplete':'unknown',[...find('report'),...find('handoff'),...find('closure')].map(a=>a.id),'Evidence-backed reports, uncertainty, handoff and a recovery-aware closure decision.');
    return {rubricVersion:1,criteria,unsafeExecution:unsafe,selectedEvidence:evidenceIds,actionCount:actions.length};
  }
  return Object.freeze({CRITERIA,extract});
})();
