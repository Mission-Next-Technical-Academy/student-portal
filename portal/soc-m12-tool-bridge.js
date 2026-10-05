/* Project audited cumulative-console work into the capstone log. No pack state
 * is mutated. sourceRef names the original audit record; sourcePart identifies
 * the distinct outcomes of a record that cites more than one source domain. */
const SocM12ToolBridge = (() => {
  'use strict';
  const list = (value) => Array.isArray(value) ? value : [];
  const copy = (value) => JSON.parse(JSON.stringify(value));
  const ACTIONS = { isolate_endpoint:'isolate', isolate_device:'isolate', revoke_session:'revoke-session', block_ioc:'block-indicator', remove_persistence:'remove-persistence', restore_backup:'restore', scan_recovery:'scan', monitor_recovery:'monitor' };
  function domain(source) {
    if (/^Email/.test(source)) return 'email';
    if (/^Identity/.test(source)) return 'identity';
    if (/Network|Dns|Proxy|Firewall/.test(source)) return 'network';
    if (/Vulnerability|Exposure/.test(source)) return 'exposure';
    if (/^Device/.test(source)) return 'endpoint';
    return '';
  }
  function project(tools, consoleState, assessmentState, fixture) {
    const api = SocM12AssessmentState, s = fixture.scenario;
    let next = api.normalize(assessmentState, fixture);
    const seen = new Set(next.actionHistory.map(a => `${a.details.sourceRef || ''}|${a.details.sourcePart || ''}`));
    const evidence = new Map(s.evidence.map(e => [e.id, e]));
    const packs = tools || {}, events = [];
    const validIds = ids => [...new Set(list(ids).filter(id => evidence.has(id)))];
    const target = id => fixture.toolTargets?.[id] || id;
    function emit(pack, event, type, details, part = '') {
      const sourceRef = `${pack}:${event.id}`, key = `${sourceRef}|${part}`;
      if (seen.has(key)) return;
      const at = Date.parse(event.timestamp);
      const timestamp = Number.isFinite(at) && at >= Date.parse(s.start) && at <= Date.parse(s.end) ? event.timestamp : s.fixedAt;
      next = api.record(next, fixture, type, { ...details, sourceRef, ...(part ? { sourcePart:part } : {}), sourceTimestamp:event.timestamp }, timestamp);
      seen.add(key);
    }
    function findings(pack, event, text, ids) {
      if (typeof text !== 'string' || !text.trim()) return;
      const groups = {};
      validIds(ids).forEach(id => { const kind = domain(evidence.get(id).source); if (kind) (groups[kind] ||= []).push(id); });
      Object.entries(groups).forEach(([kind, evidenceIds]) => emit(pack, event, 'investigation', { domain:kind, finding:text.slice(0,1000), evidenceIds }, `finding:${kind}`));
    }
    for (const pack of ['m04','m05','m06','m07','m08','m09','m10']) {
      const state = packs[pack]?.assessment || packs[pack] || {};
      list(state.actionHistory).forEach((event,index) => { if (event?.id && event.details) events.push({pack,state,event,index,order:1}); });
      if (pack === 'm09') {
        // A workflow update emits several field events with the same timestamp.
        // Read the complete update before projecting its approvalStatus event.
        const workflow = {};
        const history = list(state.workflowHistory);
        for (let i=0; i<history.length;) {
          let end=i+1;
          while (end<history.length && history[end].timestamp===history[i].timestamp && history[end].incidentId===history[i].incidentId) end++;
          const fields = workflow[history[i].incidentId] ||= {};
          history.slice(i,end).forEach(e => { fields[e.field]=copy(e.value); });
          history.slice(i,end).filter(e => e.field==='approvalStatus').forEach(e => events.push({pack,state,event:{...e,details:copy(fields),type:'bridge-approval'},index:i,order:0}));
          i=end;
        }
      }
    }
    // Pack sequence wins within each pack. Across packs preserve event time;
    // live saves append only new events and cannot retroactively grant approval.
    events.sort((a,b) => a.pack===b.pack ? (Date.parse(a.event.timestamp)-Date.parse(b.event.timestamp) || a.order-b.order || a.index-b.index) : (Date.parse(a.event.timestamp)-Date.parse(b.event.timestamp) || a.pack.localeCompare(b.pack)));
    for (const {pack,state,event:a} of events) {
      const d=a.details, type=a.type;
      if (pack==='m04') {
        if (type==='query_test' && d.query) emit(pack,a,'query-run',{query:d.query});
        if (type==='rule_change' && d.ruleId) {
          const rule=list(state.rules).find(r=>r.id===d.ruleId);
          const query=list(state.savedQueries).find(q=>q.id===rule?.queryId)?.query || rule?.query;
          if (query) emit(pack,a,'rule-save',{ruleId:d.ruleId,query,outcome:'other'});
        }
        if (type==='scheduling' && d.enabled && d.scheduledAt && Number(d.frequencyMinutes)>0) emit(pack,a,'rule-schedule',{ruleId:d.ruleId,frequency:Number(d.frequencyMinutes)<=60?'hourly':Number(d.frequencyMinutes)<=1440?'daily':'weekly',frequencyMinutes:Number(d.frequencyMinutes),scheduledAt:d.scheduledAt});
        if (type==='alert_review') {
          const alert=list(state.alerts).find(row=>row.id===d.alertId);
          if (alert) emit(pack,a,'review-alert',{alertId:d.alertId,disposition:d.disposition || 'needs-investigation',reason:d.note || '',sourceAlert:{id:alert.id,ruleId:alert.ruleId,query:alert.sourceQuery,evidenceIds:validIds(alert.eventIds)}});
        }
        if (type==='ioc_edit' && d.entityType==='report') {
          const report=list(state.reports).find(r=>r.id===d.recordId);
          if (report && ['technical','executive','lessons','handoff'].includes(report.kind)) emit(pack,a,'report',{kind:report.kind,text:report.summary,evidenceIds:validIds((report.summary.match(/\b[A-Z]+-\d+\b/g)||[]))});
        }
        // IOC lifecycle/enrichment is exploration, not an explicit verdict.
        if (type==='ioc_edit' && ['malicious','benign','unknown'].includes(d.decision)) {
          const ioc=list(state.iocs).find(r=>r.id===d.recordId);
          const indicator=s.intelligence.find(r=>r.id===d.indicatorId || r.indicator===ioc?.value);
          if (indicator) emit(pack,a,'intel-decision',{indicatorId:indicator.id,decision:d.decision,rationale:d.rationale});
        }
        if (type==='automation_execution_recorded') {
          const execution=list(state.automationExecutions).find(e=>e.id===d.executionId);
          const source=list(state.automationActions).find(e=>e.id===execution?.actionId);
          if (execution?.status==='succeeded' && source?.type==='evidence_preservation') {
            const ids=validIds(execution.details?.matchedEventIds);
            const devices=[...new Set(ids.flatMap(id=>evidence.get(id).entityIds).filter(id=>id.startsWith('ws-')))];
            devices.forEach(id=>emit(pack,a,'execute',{action:'preserve',target:id},`preserve:${id}`));
          }
        }
      }
      if (pack==='m05') {
        if (type==='analysis_note') findings(pack,a,d.text,[...list(d.relatedEventIds),...(String(d.text||'').match(/\b[A-Z]+-\d+\b/g)||[])]);
        if (type==='evidence_package_preserved') emit(pack,a,'execute',{action:'preserve',target:d.deviceId});
        if (type==='edr_handoff') emit(pack,a,'handoff',{text:d.summary,openRisks:[],evidenceIds:validIds(d.eventIds)});
      }
      if (pack==='m06') {
        if (type==='conclusion') findings(pack,a,d.text,d.eventIds);
        if (type==='query_run' && d.query) emit(pack,a,'query-run',{query:d.query});
        if (type==='attack_mapping_change') emit(pack,a,'attack-map',{technique:d.techniqueId,evidenceIds:validIds(d.eventIds),rationale:d.rationale,status:d.status});
        if (type==='handoff' || type==='handoff_proposal') emit(pack,a,'handoff',{text:d.summary || d.rationale,openRisks:[],evidenceIds:validIds(d.eventIds)});
      }
      if (pack==='m07') {
        if (type==='incident_link' && d.operation!=='remove') {
          findings(pack,a,d.summary,d.eventIds);
          const ids=validIds(d.eventIds);
          if (ids.length) emit(pack,a,'investigation',{domain:'scope',finding:`${list(d.deviceIds).concat(list(d.recipientIds)).join(', ')}: ${d.summary}`.slice(0,1000),evidenceIds:ids},'scope');
        }
        if (['message_review','network_review','artifact_review'].includes(type) && d.note) findings(pack,a,d.note,[d.eventId||d.messageId||d.artifactId]);
      }
      if (pack==='m08' && ['finding_review','incident_link'].includes(type)) findings(pack,a,d.notes||d.rationale,d.evidenceIds);
      if (pack==='m09') {
        if (type==='bridge-approval') {
          const action=ACTIONS[d.approvalActionType];
          if (action && d.approvalTargetId) emit(pack,a,'approval',{action,target:target(d.approvalTargetId),approved:d.approvalStatus==='approved',status:d.approvalStatus,reason:d.approvalReason||''});
        }
        if (ACTIONS[type]) {
          const action=ACTIONS[type], recovery=['remove-persistence','restore','scan','monitor'].includes(action);
          const actionTarget=action==='restore'?d.backupId:target(d.entityId);
          // Restore approval is for the selected backup, not just its device.
          if (action==='restore' && d.approval?.actionType==='restore_backup') {
            const approved=next.approvals.some(p=>p.action==='restore'&&p.target===actionTarget&&p.approved);
            const sourceApproved=[...next.approvals].reverse().find(p=>p.action==='restore'&&p.target===target(d.entityId))?.approved===true;
            if (!approved && sourceApproved) emit(pack,a,'approval',{action:'restore',target:actionTarget,approved:true},'restore-approval');
          }
          if (actionTarget) emit(pack,a,recovery?'recovery':'execute',{action,target:actionTarget,sourceOutcome:a.outcome});
        }
      }
      if (pack==='m10') {
        if (type==='timeline') emit(pack,a,'investigation',{domain:'timeline',finding:`Reconstructed evidence sequence: ${list(d.artifactIds).join(' → ') || '(empty)'}`,evidenceIds:validIds(d.artifactIds)});
        if (type==='statement') findings(pack,a,d.text,d.artifactIds);
      }
    }
    // Pins have no pack audit IDs. Their deterministic revision is local to the
    // evidence selection; ordinary saves with unchanged pins create no events.
    if (Array.isArray(consoleState?.pins)) {
      const pins=validIds(consoleState.pins);
      const priorPins=next.selectedEvidence.filter(id=>next.actionHistory.some(a=>a.type==='evidence-select'&&a.details.evidenceId===id&&a.details.sourceRef?.startsWith('m03:pin:')));
      for (const id of new Set([...pins,...priorPins])) {
        const selected=pins.includes(id);
        if (selected===next.selectedEvidence.includes(id)) continue;
        const revision=next.actionHistory.filter(a=>a.details.sourceRef?.startsWith(`m03:pin:${id}:`)).length+1;
        emit('m03',{id:`pin:${id}:${revision}`,timestamp:s.fixedAt},'evidence-select',{evidenceId:id,selected});
      }
    }
    return next;
  }
  return Object.freeze({project});
})();
