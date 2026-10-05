/* Deterministic SOC operations dashboard view-model for the Module 11 shift.
 * Dispositions come only from items already dispositioned in the fixture's
 * shift history; open items never reveal their assessment truth. */
const SocM11AssessmentMetrics = (() => {
  'use strict';

  const minutes = (from, to) => (Date.parse(to) - Date.parse(from)) / 60000;
  const round1 = (value) => Math.round(value * 10) / 10;
  const mean = (values) => (values.length ? round1(values.reduce((sum, value) => sum + value, 0) / values.length) : null);

  function slaStatus(item, at) {
    if (item.acknowledgedAt) return minutes(item.createdAt, item.acknowledgedAt) <= item.slaMinutes ? 'met' : 'breached';
    const elapsed = minutes(item.createdAt, at);
    if (elapsed > item.slaMinutes) return 'breached';
    return elapsed >= item.slaMinutes * 0.75 ? 'at_risk' : 'within';
  }

  function compute(fixture, state = {}) {
    const scenario = fixture.scenario;
    const at = scenario.fixedAt;
    const assignments = state && state.assignments && typeof state.assignments === 'object' ? state.assignments : {};
    const queue = scenario.queue.map((item) => {
      const assigneeId = item.assigneeId || assignments[item.id] || null;
      return {
        id: item.id, kind: item.kind, title: item.title, ruleId: item.ruleId, severity: item.severity,
        businessImpact: item.businessImpact, status: item.status, assigneeId,
        ageMinutes: round1(minutes(item.createdAt, at)), slaMinutes: item.slaMinutes, sla: slaStatus(item, at),
      };
    });
    const open = queue.filter((item) => item.status !== 'closed');
    const dispositioned = scenario.queue.filter((item) => item.recordedDisposition);
    const distribution = { true_positive: 0, benign_positive: 0, false_positive: 0 };
    dispositioned.forEach((item) => { distribution[item.recordedDisposition] += 1; });
    const ruleNoise = scenario.rules.map((rule) => {
      const items = scenario.queue.filter((item) => item.ruleId === rule.id);
      const recorded = items.filter((item) => item.recordedDisposition);
      const nonTrue = recorded.filter((item) => item.recordedDisposition !== 'true_positive').length;
      return { ruleId: rule.id, name: rule.name, alerts: items.length, dispositioned: recorded.length, nonTruePositive: nonTrue,
        nonTruePositiveRate: recorded.length ? round1(nonTrue / recorded.length) : null };
    });
    const workload = scenario.analysts.map((analyst) => {
      const added = open.filter((item) => assignments[item.id] === analyst.id && !scenario.queue.find((q) => q.id === item.id).assigneeId).length;
      return { analystId: analyst.id, name: analyst.name, role: analyst.role, openItems: analyst.openItems + added, capacity: analyst.capacity,
        overCapacity: analyst.openItems + added > analyst.capacity };
    });
    const hours = ['08', '09', '10', '11'];
    const trend = hours.map((hour) => ({ hour: `${hour}:00`, created: scenario.queue.filter((item) => item.createdAt.slice(11, 13) === hour).length }));
    return {
      at,
      alertVolume: queue.length,
      distribution,
      backlog: open.length,
      assigned: open.filter((item) => item.assigneeId).length,
      unassigned: open.filter((item) => !item.assigneeId).length,
      sla: queue.map((item) => ({ id: item.id, status: item.sla })),
      mttaMinutes: mean(scenario.queue.filter((item) => item.acknowledgedAt).map((item) => minutes(item.createdAt, item.acknowledgedAt))),
      mttrMinutes: mean(scenario.queue.filter((item) => item.containedAt).map((item) => minutes(item.createdAt, item.containedAt))),
      ruleNoise,
      workload,
      trend,
      queue,
      caveats: [
        'The hourly trend shows when items were created; it does not establish why volume changed or what caused it.',
        'Disposition distribution covers only items already dispositioned this shift; open items are not yet classified.',
        'Small counts from a single shift are not a statistically reliable baseline.',
      ],
    };
  }

  return Object.freeze({ compute, slaStatus });
})();
