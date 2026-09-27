/* Local-only, idempotent low-risk automation for the Module 04 assessment. */
const SocM04Automation = (() => {
  'use strict';

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const DISRUPTIVE_TYPES = Object.freeze(['account_disable', 'session_revoke', 'network_block']);

  function requestApproval(assessment, fixture, input, timestamp) {
    if (!assessment || typeof assessment !== 'object') throw new TypeError('M04 assessment is required.');
    if (!fixture?.scenario) throw new TypeError('M04 assessment fixture is required.');
    if (typeof timestamp !== 'string' || Number.isNaN(Date.parse(timestamp))) throw new TypeError('Pass an explicit valid timestamp.');
    const type = input?.type;
    const targetId = typeof input?.targetId === 'string' ? input.targetId.trim() : '';
    const actor = typeof input?.actor === 'string' ? input.actor.trim() : '';
    const reason = typeof input?.reason === 'string' ? input.reason.trim() : '';
    const alertId = typeof input?.alertId === 'string' ? input.alertId : '';
    if (!DISRUPTIVE_TYPES.includes(type)) throw new TypeError('Unsupported disruptive action request.');
    if (!/^[A-Za-z0-9._:@-]{1,100}$/.test(targetId)) throw new TypeError('Disruptive action target is invalid.');
    if (!actor || actor.length > 100 || !reason || reason.length > 500) throw new TypeError('Actor and reason are required (up to 100 and 500 characters).');
    const alert = (assessment.alerts || []).find((item) => item.id === alertId);
    if (!alert) throw new RangeError('Approval request must link to a valid alert.');
    assessment.approvalRequests ||= [];
    const sequence = Math.max(assessment.nextApprovalRequestSequence || 1, ...assessment.approvalRequests.map((item) => Number(String(item.id).match(/(\d+)$/)?.[1]) + 1 || 1));
    const request = { id: `M04-APPROVAL-${String(sequence).padStart(6, '0')}`, schemaVersion: SocM04AssessmentActions.AUTOMATION_SCHEMA_VERSION, sequence, actionType: type, targetId, alertId, status: 'pending', requestedBy: actor, createdAt: timestamp, audit: [{ status: 'pending', actor, timestamp, reason }] };
    assessment.approvalRequests = [...assessment.approvalRequests, request].slice(-200);
    assessment.nextApprovalRequestSequence = sequence + 1;
    const audit = SocM04AssessmentActions.record({ assessment }, 'automation', timestamp, { approvalRequestId: request.id, actionType: type, status: 'pending', actor, reason });
    Object.assign(assessment, audit.assessment);
    return clone(request);
  }

  function reviewApproval(assessment, requestId, decision, actor, reason, timestamp) {
    if (typeof timestamp !== 'string' || Number.isNaN(Date.parse(timestamp))) throw new TypeError('Pass an explicit valid timestamp.');
    if (!['approved', 'rejected'].includes(decision)) throw new TypeError('Approval decision must be approved or rejected.');
    if (typeof actor !== 'string' || !actor.trim() || actor.trim().length > 100 || typeof reason !== 'string' || !reason.trim() || reason.trim().length > 500) throw new TypeError('Reviewer and reason are required.');
    const request = (assessment?.approvalRequests || []).find((item) => item.id === requestId);
    if (!request) throw new RangeError('Approval request not found.');
    if (request.status !== 'pending') throw new Error('Only pending requests can be reviewed.');
    request.status = decision;
    request.audit.push({ status: decision, actor: actor.trim(), timestamp, reason: reason.trim() });
    const audit = SocM04AssessmentActions.record({ assessment }, 'automation', timestamp, { approvalRequestId: request.id, actionType: request.actionType, status: decision, actor: actor.trim(), reason: reason.trim(), execution: 'never' });
    Object.assign(assessment, audit.assessment);
    return clone(request);
  }

  function run(assessment, fixture, type, targetId, timestamp, options = {}) {
    if (!assessment || typeof assessment !== 'object') throw new TypeError('M04 assessment is required.');
    if (!fixture?.scenario) throw new TypeError('M04 assessment fixture is required.');
    if (typeof timestamp !== 'string' || Number.isNaN(Date.parse(timestamp))) throw new TypeError('Pass an explicit valid timestamp.');
    if (!['indicator_enrichment', 'evidence_preservation', 'ticket', 'notification'].includes(type)) throw new TypeError('Unsupported simulated automation action.');
    const iocs = Array.isArray(assessment.iocs) ? assessment.iocs : fixture.scenario.iocs;
    const alerts = Array.isArray(assessment.alerts) ? assessment.alerts : [];
    const ioc = type === 'indicator_enrichment' || options.iocId
      ? iocs.find((item) => item.id === (type === 'indicator_enrichment' ? targetId : options.iocId)) : null;
    const alertTarget = type === 'evidence_preservation' ? targetId : options.alertId;
    const alert = ['evidence_preservation', 'ticket', 'notification'].includes(type) && alertTarget ? alerts.find((item) => item.id === alertTarget) : null;
    if (type === 'indicator_enrichment' && !ioc) throw new RangeError('IOC target not found.');
    if (type === 'evidence_preservation' && !alert) throw new RangeError('Alert target not found.');
    if (options.iocId && !ioc) throw new RangeError('IOC target not found.');
    if (['ticket', 'notification'].includes(type) && (!alert || typeof options.content !== 'string' || !options.content.trim() || options.content.trim().length > 1000)) throw new TypeError('Ticket and notification require a valid alert and content (1-1000 characters).');
    if (type === 'ticket' && (typeof targetId !== 'string' || !/^[A-Za-z0-9_-]{1,40}$/.test(targetId))) throw new TypeError('Ticket target must be a 1-40 character identifier.');
    if (type === 'notification' && (typeof targetId !== 'string' || !/^[A-Za-z0-9._-]{1,80}$/.test(targetId))) throw new TypeError('SOC notification recipient is invalid.');
    const idempotencyKey = `${type}:${targetId}:${type === 'evidence_preservation' ? (ioc?.id || 'alert-only') : ''}`;
    assessment.automationActions ||= [];
    assessment.automationExecutions ||= [];
    const prior = !['ticket', 'notification'].includes(type) && assessment.automationActions.find((item) => item.details?.idempotencyKey === idempotencyKey);
    if (prior) {
      const execution = assessment.automationExecutions.find((item) => item.actionId === prior.id);
      if (execution) return { action: clone(prior), execution: clone(execution), duplicate: true };
    }

    let matchedEventIds = [];
    let result;
    if (type === 'indicator_enrichment') {
      const fields = ['sourceIp', 'destinationIp', 'domain', 'url', 'email', 'fileHash'];
      matchedEventIds = fixture.scenario.telemetry.filter((event) => fields.some((field) => String(event[field] || '').toLowerCase() === String(ioc.value).toLowerCase())).map((event) => event.id);
      result = { iocId: ioc.id, indicator: clone(ioc), matchedEventIds, sourceReportId: ioc.sourceReportId || '', simulated: true };
    } else if (type === 'evidence_preservation') {
      const eventIds = [...new Set(alert.eventIds || [])].filter((id) => fixture.scenario.telemetry.some((event) => event.id === id));
      matchedEventIds = ioc ? eventIds.filter((id) => {
        const event = fixture.scenario.telemetry.find((item) => item.id === id);
        return ['sourceIp', 'destinationIp', 'domain', 'url', 'email', 'fileHash'].some((field) => String(event[field] || '').toLowerCase() === String(ioc.value).toLowerCase());
      }) : eventIds;
      result = { alertId: alert.id, executionId: alert.executionId, iocId: ioc?.id || '', eventIds: matchedEventIds, evidenceCount: matchedEventIds.length, simulated: true };
    } else if (type === 'ticket') {
      assessment.automationTickets ||= [];
      const existing = assessment.automationTickets.find((ticket) => ticket.targetId === targetId);
      const highestTicketId = assessment.automationTickets.reduce((max, item) => Math.max(max, Number(String(item.id || '').match(/(\d+)$/)?.[1]) || 0), 0);
      const ticketSequence = Math.max(Number.isSafeInteger(assessment.nextTicketSequence) ? assessment.nextTicketSequence : 1, highestTicketId + 1);
      const ticket = { id: existing?.id || `M04-TICKET-${String(ticketSequence).padStart(6, '0')}`, targetId, alertId: alert.id, content: options.content.trim(), status: 'open', createdAt: existing?.createdAt || timestamp, updatedAt: timestamp, actionId: '', executionId: '' };
      if (!existing) assessment.nextTicketSequence = ticketSequence + 1;
      result = { ticketId: ticket.id, targetId, alertId: alert.id, operation: existing ? 'updated' : 'created', content: ticket.content, simulated: true };
      assessment.automationTickets = assessment.automationTickets.filter((item) => item.targetId !== targetId).concat(ticket).slice(-200);
    } else {
      result = { recipient: targetId, alertId: alert.id, content: options.content.trim(), delivery: 'simulated', repeatNumber: assessment.automationResults.filter((item) => item.type === 'notification' && item.targetId === targetId && item.alertId === alert.id).length + 1, simulated: true };
    }

    let state = { assessment };
    const actionRecord = SocM04AssessmentActions.appendAutomationAction(state, type, timestamp, {
      targetId, alertId: alert?.id || '', iocId: ioc?.id || '', idempotencyKey,
    });
    state = actionRecord.state;
    const status = type === 'evidence_preservation' && !matchedEventIds.length ? 'failed' : 'succeeded';
    const executionRecord = SocM04AssessmentActions.appendAutomationExecution(state, actionRecord.action.id, status, timestamp, {
      result, matchedEventIds, readOnly: true, sideEffects: [],
    });
    state = executionRecord.state;
    Object.assign(assessment, state.assessment);
    assessment.automationResults ||= [];
    const persisted = { actionId: actionRecord.action.id, executionId: executionRecord.execution.id, type, targetId, alertId: alert?.id || '', iocId: ioc?.id || '', matchedEventIds: [...matchedEventIds], result: clone(result), status };
    assessment.automationResults = [...assessment.automationResults, persisted].slice(-200);
    if (type === 'ticket') {
      const ticket = assessment.automationTickets.find((item) => item.targetId === targetId);
      ticket.actionId = actionRecord.action.id;
      ticket.executionId = executionRecord.execution.id;
    }
    return { action: clone(actionRecord.action), execution: clone(executionRecord.execution), result: clone(persisted), duplicate: false };
  }

  return Object.freeze({ run, requestApproval, reviewApproval, DISRUPTIVE_TYPES });
})();
