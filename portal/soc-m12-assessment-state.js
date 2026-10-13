/* Auditable, replayable Module 12 assessment actions and outcome projections. */
const SocM12AssessmentState = (() => {
  'use strict';
  const VERSION = 1, MAX_ACTIONS = 1000;
  const TYPES = Object.freeze(['review-alert','intel-decision','hypothesis','query-run','rule-save','rule-schedule','incident-link','investigation','evidence-select','attack-map','workflow-design','approval','execute','recovery','report','handoff','closure']);
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const scenarioOf = (f) => { if (!f?.scenario?.id) throw new Error('M12 assessment fixture required.'); return f.scenario; };
  const text = (x, max=4000) => { if (typeof x !== 'string' || !x.trim() || x.length > max) throw new Error('M12 action text is invalid.'); return x.trim(); };
  function validTime(at, s) { return typeof at === 'string' && Number.isFinite(Date.parse(at)) && Date.parse(at) >= Date.parse(s.start) && Date.parse(at) <= Date.parse(s.end); }
  function fresh(fixture) { const s=scenarioOf(fixture); return { schemaVersion:VERSION, scenarioId:s.id, rubricVersion:1, actionHistory:[], nextActionSequence:1,
    alertReviews:{}, intelligence:{}, hypotheses:[], queryRuns:[], generatedAlerts:[], rules:[], schedules:[], dispositions:{}, incidentLinks:[], investigations:[], selectedEvidence:[], attackMappings:[], workflows:[], approvals:[], executions:[], recovery:[], reports:{}, handoffs:[], closure:null }; }
  function reduce(state, action, fixture) {
    const d=action.details;
    switch(action.type) {
      case 'review-alert': state.alertReviews[d.alertId]={disposition:d.disposition,reason:d.reason}; state.dispositions[d.alertId]=d.disposition; break;
      case 'intel-decision': state.intelligence[d.indicatorId]={decision:d.decision,rationale:d.rationale}; break;
      case 'hypothesis': state.hypotheses.push(d); break;
      case 'query-run': state.queryRuns.push(d); if(['correlated','broad'].includes(d.outcome)) { const related=[...new Set(d.matchedEvidence.flatMap(id=>fixture.scenario.evidence.find(e=>e.id===id)?.entityIds||[]))]; state.generatedAlerts.push({id:`M12-QALERT-${String(action.sequence).padStart(3,'0')}`,severity:d.outcome==='correlated'?'High':'Low',title:d.outcome==='correlated'?'Correlated behavior observed in query results':'Broad query returned excess activity',entities:related,ruleId:'Learner-tested query',outcome:d.outcome}); } break;
      case 'rule-save': state.rules.push(d); break;
      case 'rule-schedule': state.schedules.push(d); break;
      case 'incident-link': state.incidentLinks.push(d); break;
      case 'investigation': state.investigations.push(d); break;
      case 'evidence-select': if(d.selected) { if(!state.selectedEvidence.includes(d.evidenceId)) state.selectedEvidence.push(d.evidenceId); } else state.selectedEvidence=state.selectedEvidence.filter(x=>x!==d.evidenceId); break;
      case 'attack-map': state.attackMappings.push(d); break;
      case 'workflow-design': state.workflows.push(d); break;
      case 'approval': state.approvals.push(d); break;
      case 'execute': state.executions.push(d); break;
      case 'recovery': state.recovery.push(d); break;
      case 'report': state.reports[d.kind]=d; break;
      case 'handoff': state.handoffs.push(d); break;
      case 'closure': state.closure=d; break;
      default: throw new Error(`Unsupported M12 action type: ${action.type}`);
    }
  }
  function validate(type,d,s,state={}) {
    if(!TYPES.includes(type)||!d||typeof d!=='object'||Array.isArray(d)) throw new Error('M12 action type/details invalid.');
    const exists=(list,id,key='id')=>list.some(x=>x[key]===id);
    const packAlert=(id)=>d.sourceRef?.startsWith('m04:') && /^M04-ALERT-\d+$/.test(id) && d.sourceAlert?.id===id && typeof d.sourceAlert.query==='string';
    const alertExists=(id)=>exists(s.queue,id)||exists(state.generatedAlerts||[],id)||packAlert(id);
    const packRule=(id)=>d.sourceRef?.startsWith('m04:') && /^M04-RULE-\d+$/.test(id);
    switch(type) {
      case 'review-alert': if(!alertExists(d.alertId)||!['true-positive','benign-positive','false-positive','needs-investigation'].includes(d.disposition)) throw new Error('Unknown alert or disposition.'); if(d.reason) d.reason=text(d.reason,1000); break;
      case 'intel-decision': if(!exists(s.intelligence,d.indicatorId)||!['malicious','benign','unknown'].includes(d.decision)) throw new Error('Unknown intelligence record or decision.'); d.rationale=text(d.rationale,1000); break;
      case 'hypothesis': d.statement=text(d.statement,1000); d.entityIds=Array.isArray(d.entityIds)?d.entityIds:[]; break;
      case 'query-run': d.query=text(d.query,4000); d.outcome=['correlated','broad','narrow','no-match','other'].includes(d.outcome)?d.outcome:'other'; d.matchedEvidence=(d.matchedEvidence||[]).filter(id=>exists(s.evidence,id)); break;
      case 'rule-save': if(!exists(s.rules,d.ruleId)&&!packRule(d.ruleId)) throw new Error('Unknown detection rule.'); d.query=text(d.query,4000); d.outcome=['correlated','broad','narrow','other'].includes(d.outcome)?d.outcome:'other'; break;
      case 'rule-schedule': if((!exists(s.rules,d.ruleId)&&!(packRule(d.ruleId)&&exists(state.rules||[],d.ruleId,'ruleId')))||!['hourly','daily','weekly'].includes(d.frequency)) throw new Error('Unknown rule or schedule.'); break;
      case 'incident-link': if(!alertExists(d.alertId)||typeof d.incidentId!=='string') throw new Error('Invalid alert link.'); break;
      case 'investigation': if(!['identity','email','endpoint','network','exposure','timeline','scope'].includes(d.domain)) throw new Error('Unknown investigation domain.'); d.finding=text(d.finding,1000); d.evidenceIds=(d.evidenceIds||[]).filter(id=>exists(s.evidence,id)); break;
      case 'evidence-select': if(!exists(s.evidence,d.evidenceId)||typeof d.selected!=='boolean') throw new Error('Unknown evidence selection.'); break;
      case 'attack-map': d.technique=text(d.technique,40); d.evidenceIds=(d.evidenceIds||[]).filter(id=>exists(s.evidence,id)); break;
      case 'workflow-design':
        d.name=text(d.name,120);
        if(!Array.isArray(d.nodes)||d.nodes.length<2||d.nodes.length>s.workflowNodes.length||d.nodes.some(n=>!s.workflowNodes.includes(n))||new Set(d.nodes).size!==d.nodes.length) throw new Error('Workflow needs at least 2 unique supported action nodes.');
        d.edges=Array.isArray(d.edges)?d.edges:[];
        if(d.edges.length>12||d.edges.some(e=>!e||!d.nodes.includes(e.from)||!d.nodes.includes(e.to)||e.from===e.to)) throw new Error('Workflow edges must connect selected nodes.');
        break;
      case 'approval': d.action=text(d.action,80); d.target=text(d.target,120); if(typeof d.approved!=='boolean') throw new Error('Approval must be explicit.'); break;
      case 'execute': d.action=text(d.action,80); d.target=text(d.target,120); d.outcome='pending'; d.approvalId=d.approvalId||''; break;
      case 'recovery': d.action=text(d.action,80); d.target=text(d.target,120); d.outcome='pending'; break;
      case 'report': if(!['technical','executive','handoff','lessons'].includes(d.kind)) throw new Error('Unknown report kind.'); d.text=text(d.text,5000); d.evidenceIds=(d.evidenceIds||[]).filter(id=>exists(s.evidence,id)); break;
      case 'handoff': d.text=text(d.text,3000); d.openRisks=Array.isArray(d.openRisks)?d.openRisks:[]; break;
      case 'closure': if(!['close','retain','reopen'].includes(d.decision)) throw new Error('Unknown closure decision.'); d.rationale=text(d.rationale,2000); break;
    }
    return d;
  }
  // Outcomes a simulated M09 result can carry. partial and failure are recorded
  // as such: they earn no credit (only success does) but are not unsafe.
  const SOURCE_BLOCK_REASON='The source tool did not complete this action successfully.';
  function sourceResult(d) {
    if(d.sourceOutcome===undefined||d.sourceOutcome===null||d.sourceOutcome==='success') return 'success';
    return ['partial','failure'].includes(d.sourceOutcome)?d.sourceOutcome:'blocked';
  }
  function deriveEffect(state,type,d) {
    if(type==='query-run' && typeof SocM12AssessmentConsole!=='undefined') {
      const evaluated=SocM12AssessmentConsole.evaluateQuery(d.query);
      d.outcome=evaluated.outcome; d.matchedEvidence=evaluated.matchedEvidence;
      d.resultCount=evaluated.rows.length;
    }
    if(type==='rule-save' && d.sourceRef?.startsWith('m04:') && typeof SocM12AssessmentConsole!=='undefined') {
      d.outcome=SocM12AssessmentConsole.evaluateQuery(d.query).outcome;
    }
    if(type==='execute') {
      const safeTargets={'isolate':'ws-204','revoke-session':'acct-204','block-indicator':'203.0.113.72','preserve':'ws-204'};
      const protectedActions=['isolate','revoke-session'];
      const approval=[...state.approvals].reverse().find(a=>a.action===d.action&&a.target===d.target)?.approved===true;
      const inScope=safeTargets[d.action]===d.target;
      const permitted=inScope&&(!protectedActions.includes(d.action)||approval);
      // Only an unapproved or out-of-scope attempt is refused. A permitted action
      // keeps the result the simulated M09 effect reported (partial or failure).
      d.outcome=permitted?sourceResult(d):'blocked';
      d.blockReason=d.outcome!=='blocked'?'':!permitted?(!inScope?'Action target is outside the authorized scenario scope.':'A current approval for this exact action and target is required.'):SOURCE_BLOCK_REASON;
    }
    if(type==='recovery') {
      const history=state.executions, done=(action,target)=>history.some(x=>x.action===action&&x.target===target&&x.outcome==='success');
      if(d.action==='remove-persistence') d.outcome=d.target==='ws-204'&&done('preserve','ws-204')?'success':'blocked';
      else if(d.action==='restore') {
        const approved=state.approvals.some(a=>a.action==='restore'&&a.target===d.target&&a.approved);
        d.outcome=d.target==='BK-204-0900'&&approved?'success':'blocked';
      } else if(d.action==='scan') d.outcome=d.target==='ws-204'&&state.recovery.some(x=>x.action==='restore'&&x.outcome==='success')?'success':'blocked';
      else if(d.action==='monitor') d.outcome=d.target==='ws-204'&&state.recovery.some(x=>x.action==='scan'&&x.outcome==='success')?'success':'blocked';
      else d.outcome='blocked';
      const prerequisitesMet=d.outcome==='success';
      if(prerequisitesMet) d.outcome=sourceResult(d);
      d.blockReason=d.outcome!=='blocked'?'':prerequisitesMet?SOURCE_BLOCK_REASON:'Required target or prior recovery step is missing.';
    }
    return d;
  }
  function normalize(source,fixture) {
    const s=scenarioOf(fixture), state=fresh(fixture), prior=source&&typeof source==='object'?source:{}; let seq=0;
    for(const a of (Array.isArray(prior.actionHistory)?prior.actionHistory:[]).slice(0,MAX_ACTIONS)) {
      try { if(!a||!TYPES.includes(a.type)||!Number.isSafeInteger(a.sequence)||a.sequence<=seq||a.id!==`${s.id}:ACTION-${String(a.sequence).padStart(6,'0')}`||!validTime(a.timestamp,s)) continue;
        const details=deriveEffect(state,a.type,validate(a.type,clone(a.details),s,state)), clean={id:a.id,sequence:a.sequence,type:a.type,timestamp:a.timestamp,details}; reduce(state,clean,fixture); state.actionHistory.push(clean); seq=a.sequence;
      } catch (_) { /* reject malformed persisted actions */ }
    }
    state.nextActionSequence=seq+1;
    // Preserve explicit historical/versioned state. ModuleTwelveLoad upgrades
    // active work to v2 after replay; direct v1 fixtures stay reproducible.
    state.rubricVersion=prior.rubricVersion===2?2:1;
    for(const k of ['labId','anonymousStudentId']) if(typeof prior[k]==='string') state[k]=prior[k];
    return state;
  }
  function record(state,fixture,type,details,timestamp) {
    const s=scenarioOf(fixture), next=normalize(state,fixture), at=timestamp||s.fixedAt;
    if(next.actionHistory.length>=MAX_ACTIONS) throw new Error('M12 action limit reached.');
    if(!validTime(at,s)) throw new Error('M12 timestamp must fall within the capstone shift.');
    const safe=deriveEffect(next,type,validate(type,clone(details),s,next));
    // The training range never applies a protected or out-of-scope action
    // unless the learner has recorded an approval for this exact action and
    // target. Keep the attempt in the audit trail as BLOCKED for review.
    const sequence=next.nextActionSequence;
    const action={id:`${s.id}:ACTION-${String(sequence).padStart(6,'0')}`,sequence,type,timestamp:at,details:safe};
    reduce(next,action,fixture); next.actionHistory.push(action); next.nextActionSequence=sequence+1; return normalize(next,fixture);
  }
  // Saved state round-trips through Postgres jsonb, which reorders object keys,
  // so compare structurally (same approach as the M11 state), never by text.
  function sameValue(a, b) {
    if (a === b) return true;
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
    const keys = Object.keys(a).filter((k) => a[k] !== undefined), other = Object.keys(b).filter((k) => b[k] !== undefined);
    return keys.length === other.length && keys.every((k) => Object.prototype.hasOwnProperty.call(b, k) && sameValue(a[k], b[k]));
  }
  function load(user,fixture) { if(typeof LabRuntime==='undefined') throw new Error('LabRuntime required.'); const s=scenarioOf(fixture), loaded=LabRuntime.loadCaseState(s.stateKey,'soc-12',user,{}), normalized=normalize(loaded,fixture); if(!sameValue(loaded,normalized)) LabRuntime.saveCaseState(s.stateKey,'soc-12',user,normalized); return normalized; }
  function save(user,state,fixture) { return LabRuntime.saveCaseState(scenarioOf(fixture).stateKey,'soc-12',user,normalize(state,fixture)); }
  function reset(user,fixture) { const s=scenarioOf(fixture), fresh=LabRuntime.resetCaseState(s.stateKey,'soc-12',user,{}); return save(user,normalize(fresh,fixture),fixture); }
  return Object.freeze({VERSION,TYPES,fresh,normalize,record,load,save,reset});
})();
