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
  function extractV1(state,fixture) {
    const s=fixture?.scenario, truth=fixture?.expectedTruth, x=state||{};
    if(!s||!truth) return {rubricVersion:1,criteria:CRITERIA.map(c=>outcome(c.id,'unknown',[],'Scenario unavailable.'))};
    const actions=list(x.actionHistory), find=(type)=>actions.filter(a=>a.type===type), evidenceIds=list(x.selectedEvidence);
    const allTruthEvidence=truth.selectedEvidence, chosenTruth=allTruthEvidence.filter(id=>evidenceIds.includes(id));
    const intel=Object.values(x.intelligence||{}), malicious=intel.some(i=>i.decision==='malicious'&&i.rationale.length>=25);
    const queryRuns=list(x.queryRuns), correlated=queryRuns.some(q=>q.outcome==='correlated'&&q.matchedEvidence.length>=3);
    const savedRule=list(x.rules).some(r=>r.outcome==='correlated'&&r.query.length>=20);
    const scheduled=list(x.schedules).some(q=>q.ruleId===truth.validRuleId || (q.sourceRef?.startsWith('m04:') && list(x.rules).some(r=>r.ruleId===q.ruleId&&r.outcome==='correlated')));
    const alertReviews=Object.values(x.alertReviews||{}), dispositions=Object.values(x.dispositions||{});
    const incidents=list(x.incidentLinks), goodIncident=incidents.some(i=>i.incidentId===s.caseId);
    const investigation=list(x.investigations), domains=new Set(investigation.map(i=>i.domain));
    const validFindings=investigation.filter(i=>i.evidenceIds.length&&i.finding.length>=30);
    const attack=list(x.attackMappings), correctAttack=truth.demonstratedAttack.filter(id=>attack.some(m=>m.technique===id&&truth.attackEvidence[id].some(e=>m.evidenceIds.includes(e))));
    const coverage=truth.affectedEntities.filter(id=>investigation.some(i=>i.domain==='scope'&&i.finding.toLowerCase().includes(id)&&i.evidenceIds.some(e=>fixture.scenario.evidence.find(row=>row.id===e)?.entityIds.includes(id))));
    const timeline=investigation.some(i=>i.domain==='timeline'&&i.evidenceIds.length>=3);
    const workflow=list(x.workflows), execs=list(x.executions), approvals=list(x.approvals);
    const safeExec=truth.safeActions.filter(action=>execs.some(e=>`${e.action}:${e.target}`===action&&e.outcome==='success'));
    const unsafe=execs.some(e=>e.outcome==='blocked'&&e.sourceRef?.startsWith('m09:')) || execs.some(e=>e.outcome==='success'&&((e.target==='acct-091'||e.action==='delete-evidence'||e.action==='shutdown-all')||(['isolate','revoke-session','restore'].includes(e.action)&&!approvals.some(a=>a.action===e.action&&a.target===e.target&&a.approved))));
    const recovery=list(x.recovery), restored=recovery.some(r=>r.action==='restore'&&r.target==='BK-204-0900'&&r.outcome==='success'), validated=recovery.some(r=>r.action==='scan'&&r.outcome==='success')&&recovery.some(r=>r.action==='monitor'&&r.outcome==='success');
    const reports=x.reports||{}, reportKinds=Object.keys(reports), hasEvidenceReport=Object.values(reports).some(r=>r.text&&r.evidenceIds.length), reportHasUnknown=Object.values(reports).some(r=>/unknown|uncertain|not.*confirm/i.test(r.text));
    const closure=x.closure, correctClosure=closure?.decision==='retain'||(closure?.decision==='close'&&restored&&validated);
    const criteria=[];
    const add=(id,score,evidence,explanation)=>criteria.push(outcome(id,score,evidence,explanation));
    add('intelligence-preparation',malicious?'observed':intel.length?'partial':'unknown',find('intel-decision').map(a=>a.id),'Contextual intelligence decision with rationale.');
    let qScore=(correlated?2:0)+(savedRule?1:0)+(scheduled?1:0); add('queries-detection-scheduling',qScore>=4?'observed':qScore?'partial':queryRuns.length?'incomplete':'unknown',[...find('query-run'),...find('rule-save'),...find('rule-schedule')].map(a=>a.id),'Reproducible cross-source outcomes, saved rule and recurring execution.');
    let alertScore=(alertReviews.length>=2?1:0)+(dispositions.length>=2?1:0)+(goodIncident?1:0); add('alert-incident-management',alertScore===3?'observed':alertScore?'partial':actions.some(a=>a.type==='review-alert')?'incomplete':'unknown',[...find('review-alert'),...find('incident-link')].map(a=>a.id),'Alert conclusions and incident relationship.');
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
  function extractV2(state, fixture) {
    const x=state||{}, s=fixture?.scenario, truth=fixture?.expectedTruth;
    if(!s||!truth) return {rubricVersion:2,criteria:CRITERIA.map(c=>({...outcome(c.id,'unknown',[],'Scenario unavailable.'),points:0,misses:['Scenario unavailable.']}))};
    const actions=list(x.actionHistory), investigations=list(x.investigations), selected=list(x.selectedEvidence);
    const support=truth.evidenceSupport||{}, rows=new Map(s.evidence.map(e=>[e.id,e]));
    const idsFor=(types)=>actions.filter(a=>types.includes(a.type)).map(a=>a.id);
    const unique=(items)=>[...new Set(items)], textOf=(r)=>String(r?.finding||r?.text||r?.rationale||'');
    const mentions=(text,id)=>String(text).toLowerCase().includes(String(id).toLowerCase());
    const citations=(r)=>unique([...list(r?.evidenceIds),...s.evidence.filter(e=>mentions(textOf(r),e.id)).map(e=>e.id)]);
    const grounded=(r,id)=>mentions(textOf(r),id)||list(rows.get(id)?.entityIds).some(e=>mentions(textOf(r),e));
    // Negative/uncertain scope statements are useful findings, not assertions of compromise.
    const isNegative=(text)=>/\b(no|not|benign|unrelated|unaffected|excluded|unknown|uncertain|unconfirmed|only|without|never)\b|no.second|did not|does not|not.*confirm/i.test(text);
    const claimsAffected=(text,id)=>String(text).split(/[.;\n]/).some(clause=>mentions(clause,id)&&!isNegative(clause)&&/affect|compromis|malicious|infect|confirmed scope|in.scope/i.test(clause));
    const maliciousClaim=(text)=>String(text).split(/[.;\n]/).some(clause=>!isNegative(clause)&&/malicious|compromis|infect|attack|persistence/i.test(clause));
    const findingCredit=(r,domain)=>{
      const evidence=citations(r); if(textOf(r).length<30||!evidence.length) return 0;
      const applicable=evidence.filter(id=>support[id]?.domain===domain&&grounded(r,id));
      const values=applicable.map(id=>{
        const a=support[id];
        // Explaining why a benign competing alert is excluded is valid supporting analysis.
        if(a.level==='CONTRADICTORY') return isNegative(textOf(r))?0.4:0;
        if(a.boundedNegative&&!isNegative(textOf(r))) return 0;
        return truth.supportCredit[a.level]||0;
      });
      // A conclusion citing every row cannot substitute for evidence correlation.
      const relevant=evidence.filter(id=>support[id]?.domain===domain||support[id]?.level==='PRIMARY');
      return Math.max(0,...values)*(relevant.length/evidence.length);
    };
    const criteria=[];
    function add(id,awards,misses,evidence,deductions=[]) {
      const c=CRITERIA.find(c=>c.id===id), earned=Math.min(c.weight,awards.reduce((n,a)=>n+a.points,0));
      const points=Math.max(0,earned-deductions.reduce((n,a)=>n+a.points,0));
      const explanation=[...awards.filter(a=>a.points).map(a=>a.reason),...misses,...deductions.map(a=>a.reason)].join(' ');
      criteria.push({...outcome(id,points===c.weight?'observed':points?'partial':'unknown',evidence,explanation),points,awards,misses,deductions});
    }
    const award=(points,reason)=>({points,reason});
    const intel=Object.entries(x.intelligence||{}), intelValid=intel.filter(([id,i])=>{
      const expected=truth.indicatorDecisions[id], refs=truth.indicatorEvidence[id]||[];
      return i.decision===expected&&i.rationale?.length>=25&&refs.some(e=>mentions(i.rationale,e)||list(rows.get(e)?.entityIds).some(entity=>mentions(i.rationale,entity)));
    });
    const badIntel=intel.filter(([id,i])=>i.decision!=='unknown'&&i.decision!==truth.indicatorDecisions[id]);
    add('intelligence-preparation',[award(intelValid.length?10:0,'An intelligence determination cites corroborating incident evidence or entities.')],intelValid.length?[]:['No corroborated intelligence determination.'],idsFor(['intel-decision']),badIntel.map(([id])=>award(5,`${id}: explicit intelligence verdict contradicts the available evidence.`)));
    const queries=list(x.queryRuns), rules=list(x.rules), schedules=list(x.schedules);
    const correlated=queries.some(q=>q.outcome==='correlated'&&list(q.matchedEvidence).filter(id=>support[id]?.level==='PRIMARY').length>=3);
    const saved=rules.some(r=>r.outcome==='correlated'&&r.query?.length>=20);
    const scheduled=schedules.some(q=>q.ruleId===truth.validRuleId||rules.some(r=>r.ruleId===q.ruleId&&r.outcome==='correlated'));
    add('queries-detection-scheduling',[award(correlated?9:0,'Historical query results correlate incident evidence.'),award(saved?5:0,'A correlated detection rule is saved.'),award(scheduled?4:0,'The correlated rule has a recurring schedule.')],[...(!correlated?['No cross-source correlated query outcome.']:[]),...(!saved?['No correlated saved rule.']:[]),...(!scheduled?['No recurring correlated rule schedule.']:[])],idsFor(['query-run','rule-save','rule-schedule']));
    const dispositions=Object.entries(x.dispositions||{}), generated=list(x.generatedAlerts);
    const expectedAlert=(id)=>truth.alertDispositions[id]||((generated.find(a=>a.id===id)?.outcome==='correlated')?'true-positive':null);
    const correctDispositions=dispositions.filter(([id,d])=>d===expectedAlert(id));
    const badDispositions=dispositions.filter(([id,d])=>expectedAlert(id)&&d!=='needs-investigation'&&d!==expectedAlert(id));
    const links=list(x.incidentLinks), validLinks=links.filter(l=>l.incidentId===s.caseId&&expectedAlert(l.alertId)==='true-positive');
    const badLinks=links.filter(l=>l.incidentId===s.caseId&&expectedAlert(l.alertId)&&expectedAlert(l.alertId)!=='true-positive');
    const core=[...actions].reverse().find(a=>a.details?.ticketCore)?.details.ticketCore;
    const priorityEvidence=core&&s.evidence.filter(e=>mentions(core.priorityRationale,e.id)&&support[e.id]?.level==='PRIMARY');
    const coreValid=core&&truth.affectedEntities.includes(core.affectedUser)&&truth.affectedEntities.includes(core.affectedDevice)&&['high','critical'].includes(core.severity)&&priorityEvidence.length>0;
    add('alert-incident-management',[award(Math.min(4,correctDispositions.length*2),'Supported alert dispositions.'),award(validLinks.length?4:0,'A supported alert is linked to the incident.'),award(coreValid?4:0,'Ticket priority and affected entities are justified by cited evidence.')],[...(!validLinks.length?['No supported incident association.']:[]),...(!coreValid?['Ticket priority/scope is incomplete or unsupported.']:[])],idsFor(['review-alert','incident-link','investigation','report']),[...badDispositions.map(([id])=>award(2,`${id}: unsupported alert disposition.`)),...badLinks.map(l=>award(2,`${l.alertId}: unrelated alert linked to the incident.`))]);
    const domainWeights={identity:4,email:3,endpoint:4,network:3,exposure:4};
    const domainAwards=Object.entries(domainWeights).map(([domain,weight])=>award(Math.round(weight*Math.max(0,...investigations.filter(i=>i.domain===domain).map(i=>findingCredit(i,domain)))),`${domain}: evidence-linked domain analysis.`));
    const contradictedFindings=investigations.filter(i=>i.domain!=='timeline'&&i.domain!=='scope'&&maliciousClaim(textOf(i))&&citations(i).some(id=>support[id]?.level==='CONTRADICTORY'));
    add('cross-domain-investigation',domainAwards,domainAwards.filter(a=>!a.points).map(a=>`Missing ${a.reason}`),idsFor(['investigation']),unique(contradictedFindings.map(i=>i.domain)).map(domain=>award(domainWeights[domain]||0,`${domain}: explicit malicious conclusion cites contradictory evidence.`)));
    const scopeFindings=investigations.filter(i=>i.domain==='scope');
    const affected=truth.affectedEntities.filter(entity=>scopeFindings.some(i=>mentions(textOf(i),entity)&&citations(i).some(id=>list(rows.get(id)?.entityIds).includes(entity)&&support[id]?.level==='PRIMARY')));
    const secondaryScope=scopeFindings.some(i=>citations(i).some(id=>support[id]?.boundedNegative)&&grounded(i,'NW-504')&&isNegative(textOf(i)));
    const unsupportedEntities=unique([...truth.benignEntities,...truth.unrelatedEntities].filter(entity=>scopeFindings.some(i=>list(i.entityIds).includes(entity)||claimsAffected(textOf(i),entity))||[core?.affectedUser,core?.affectedDevice].includes(entity)));
    const timelines=investigations.filter(i=>i.domain==='timeline'), ordered=timelines.some(i=>{
      const ids=unique(list(i.evidenceIds));
      return ids.length>=3&&ids.every(id=>selected.includes(id)&&rows.has(id))&&ids.filter(id=>support[id]?.level==='PRIMARY').length>=3&&ids.every((id,j)=>!j||Date.parse(rows.get(ids[j-1]).at)<=Date.parse(rows.get(id).at));
    });
    const mappings=list(x.attackMappings), goodMappings=truth.demonstratedAttack.filter(t=>mappings.some(m=>m.technique===t&&truth.attackEvidence[t].some(id=>list(m.evidenceIds).includes(id))));
    const badMappings=unique(mappings.filter(m=>!truth.attackEvidence[m.technique]?.some(id=>list(m.evidenceIds).includes(id))).map(m=>m.technique));
    const supportedPins=selected.filter(id=>['PRIMARY','SECONDARY','SUPPORTING'].includes(support[id]?.level));
    add('timeline-scope-evidence-attack',[award(ordered?3:0,'Pinned evidence is reconstructed in chronological order.'),award(Math.min(3,affected.length+(secondaryScope?1:0)),'Confirmed entities and bounded secondary scope evidence.'),award(Math.min(3,supportedPins.length),'Relevant evidence is retained.'),award(Math.min(3,goodMappings.length),'ATT&CK mappings cite demonstrated behavior.')],[...(!ordered?['No chronological reconstruction of at least three pinned incident records.']:[]),...(!secondaryScope?['Scope lacks bounded secondary evidence.']:[])],idsFor(['investigation','evidence-select','attack-map']),[...unsupportedEntities.map(e=>award(3,`${e}: unsupported affected-scope determination.`)),...badMappings.map(t=>award(1,`${t}: ATT&CK conclusion lacks supporting behavior.`))]);
    const executions=list(x.executions), approvals=list(x.approvals), workflows=list(x.workflows), recovery=list(x.recovery);
    // Action-time approval is enforced during replay. Later approval cannot erase a blocked attempt.
    // Preserving evidence changes nothing on a system, so packaging records
    // from an out-of-scope host (e.g. documenting why ws-118 is excluded) is
    // not an unsafe execution and must not trigger the safety cap.
    const unsafeExecution=executions.filter(e=>e.action!=='preserve').some(e=>e.outcome==='blocked'||!truth.safeActions.includes(`${e.action}:${e.target}`)||(truth.requiredApprovals.includes(e.action)&&!approvals.some(a=>a.action===e.action&&a.target===e.target&&a.approved)));
    const safeActions=truth.safeActions.filter(key=>executions.some(e=>`${e.action}:${e.target}`===key&&e.outcome==='success'));
    const workflow=workflows.some(w=>list(w.nodes).includes('approval')&&list(w.edges).some(e=>e.from==='preserve'&&e.to==='approval')&&list(w.edges).some(e=>e.from==='approval'&&e.to==='isolate'));
    const approved=approvals.some(a=>a.approved&&truth.safeActions.includes(`${a.action}:${a.target}`));
    add('tuning-automation-containment',[award(workflow?5:0,'Workflow preserves evidence before approval and isolation.'),award(approved?3:0,'Supported containment has an explicit approval.'),award(Math.round(6*safeActions.length/truth.safeActions.length),'Containment executes on supported targets.')],safeActions.length===truth.safeActions.length?[]:['Containment outcomes remain incomplete.'],idsFor(['workflow-design','approval','execute']),unsafeExecution?[award(6,'An execution attempt lacks valid scope or approval.')]:[]);
    const recovered=(action,target)=>recovery.some(r=>r.action===action&&r.target===target&&r.outcome==='success');
    const restored=recovered('restore','BK-204-0900'), scanned=recovered('scan','ws-204'), monitored=recovered('monitor','ws-204');
    add('eradication-recovery',[award(recovered('remove-persistence','ws-204')?2:0,'Persistence removed after preservation.'),award(safeActions.includes('revoke-session:acct-204')?2:0,'Affected identity sessions revoked.'),award(restored?2:0,'Trusted pre-incident recovery point restored.'),award(scanned&&monitored?2:0,'Recovery validated by scan and continued monitoring.')],restored&&scanned&&monitored?[]:['Recovery validation incomplete.'],idsFor(['recovery','execute']));
    const reports=x.reports||{}, technical=reports.technical, executive=reports.executive, lessons=reports.lessons;
    const reportSupport=(r,min)=>r&&textOf(r).length>=min&&citations(r).filter(id=>['PRIMARY','SECONDARY','SUPPORTING'].includes(support[id]?.level)&&grounded(r,id)).length>=1&&citations(r).filter(id=>support[id]?.level==='IRRELEVANT'||support[id]?.level==='CONTRADICTORY').length===0;
    const handoff=list(x.handoffs).some(h=>h.text?.length>=40&&(truth.affectedEntities.some(e=>mentions(h.text,e))||list(h.openRisks).some(r=>truth.residualRisk.includes(r))));
    const closure=x.closure, closureSupported=closure&&closure.rationale?.length>=40&&(truth.affectedEntities.some(e=>mentions(closure.rationale,e))||s.evidence.some(e=>mentions(closure.rationale,e.id)))&&(closure.decision==='retain'||(closure.decision==='close'&&restored&&scanned&&monitored));
    const written=Object.values(reports).some(r=>textOf(r).length>=80);
    add('reporting-operations-lessons',[award(reportSupport(technical,80)?3:0,'Technical narrative identifies cited evidence or its entities.'),award(reportSupport(executive,80)?1:0,'Executive summary is grounded in incident evidence.'),award(reportSupport(lessons,40)?1:0,'Lessons reference an evidenced control gap.'),award(handoff?1:0,'Handoff identifies entities or outstanding scenario risks.'),award(closureSupported?1:0,'Closure reasoning cites the case and recovery status.'),award(written?1:0,'Readable written communication is present.')],[...(!reportSupport(technical,80)?['Technical narrative lacks supported citations/entities.']:[]),...(!reportSupport(executive,80)?['Executive narrative lacks supported citations/entities.']:[])],idsFor(['report','handoff','closure']));
    const studentResponses=[...Object.entries(reports).map(([kind,r])=>({kind,text:r.text,evidenceIds:list(r.evidenceIds)})),...list(x.handoffs).map(h=>({kind:'handoff',text:h.text})),...(closure?[{kind:'closure',text:closure.rationale}]:[]),...scopeFindings.map(i=>({kind:'scope',text:i.finding,evidenceIds:list(i.evidenceIds)})),...(core?.priorityRationale?[{kind:'priority',text:core.priorityRationale}]:[])];
    return {rubricVersion:2,criteria,unsafeExecution,selectedEvidence:selected,actionCount:actions.length,reviewArtifact:{studentResponses,studentDeterminations:{intelligence:x.intelligence||{},dispositions:x.dispositions||{},findings:investigations,attackMappings:mappings,ticketCore:core||null},studentActions:actions.filter(a=>!['query-run','evidence-select'].includes(a.type)),selectedEvidence:selected,instructorReviewStatus:'needs_review'}};
  }

  // Unversioned historical actions retain their original interpretation.
  function extract(state, fixture, options={}) {
    return (options.rubricVersion ?? state?.rubricVersion ?? 1) === 2
      ? extractV2(state, fixture) : extractV1(state, fixture);
  }
  return Object.freeze({CURRENT_VERSION:2,CRITERIA,extract,extractV1,extractV2});
})();
