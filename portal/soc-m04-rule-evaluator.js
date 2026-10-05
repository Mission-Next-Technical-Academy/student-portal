/* Pure candidate evaluation for saved M04 analytics rules. */
const SocM04RuleEvaluator = (() => {
  'use strict';

  const DEFAULT_FIELDS = ['TimeGenerated', 'EventId', 'EventType', 'Account', 'SourceIp', 'Result', 'DeviceClass'];
  // Saved rules from before the entity-identity contract name the column "Device"; it is now DeviceClass.
  const LEGACY_FIELDS = { Device: 'DeviceClass' };
  const upgradeField = (field) => (Object.hasOwn(LEGACY_FIELDS, field) ? LEGACY_FIELDS[field] : field);
  const upgradeSafeguard = (value, key) => (value && Object.hasOwn(LEGACY_FIELDS, value[key]) ? { ...value, [key]: upgradeField(value[key]) } : value);
  const fieldsFor = (fixture) => (Array.isArray(fixture?.ruleFields) ? fixture.ruleFields : DEFAULT_FIELDS);

  function telemetryTables(fixture, windowMinutes) {
    const scenario = fixture?.scenario;
    if (fixture?.consoleTables) {
      const end = Date.parse(scenario?.end || '');
      const minutes = Number(windowMinutes);
      if (!Number.isFinite(end) || !Number.isSafeInteger(minutes) || minutes < 1 || minutes > 1440) throw new TypeError('Fixture end and a valid lookback window are required.');
      const start = end - minutes * 60 * 1000;
      return Object.fromEntries(Object.entries(fixture.consoleTables).map(([name, rows]) => [name, rows.filter((row) => {
        const time = Date.parse(row.TimeGenerated);
        return Number.isFinite(time) && time >= start && time <= end;
      }).map(({ __rid, ...row }) => row)]));
    }
    const end = Date.parse(scenario?.end || '');
    const minutes = Number(windowMinutes);
    if (!Number.isFinite(end) || !Number.isSafeInteger(minutes) || minutes < 1 || minutes > 1440) {
      throw new TypeError('Fixture end and a valid lookback window are required.');
    }
    const start = end - minutes * 60 * 1000;
    const rows = (scenario.telemetry || []).filter((row) => {
      const time = Date.parse(row.time);
      return Number.isFinite(time) && time >= start && time <= end;
    }).map((row) => ({
      TimeGenerated: row.time, EventId: row.id, EventType: row.type,
      Account: row.account, SourceIp: row.sourceIp, Result: row.result, DeviceClass: row.deviceClass,
    }));
    return { AuthLog: rows };
  }

  function queryWithEvidence(query) {
    return query.replace(/(\|\s*summarize\s+)([\s\S]*?)(\s+by\s+)/i,
      (_match, prefix, aggregations, by) => `${prefix}${aggregations.trim()}, SupportingEventIds=make_set(EventId)${by}`);
  }

  function safeguardValue(row, field) {
    return field === 'TimeGenerated' ? row.time : field === 'EventId' ? row.id
      : field === 'EventType' ? row.type : field === 'Account' ? row.account
        : field === 'SourceIp' ? row.sourceIp : field === 'Result' ? row.result
          : field === 'DeviceClass' ? row.deviceClass : row[field];
  }

  function exclusionMatches(actual, operator, expected) {
    if (actual === undefined || actual === null) return false;
    const value = String(actual);
    if (operator === '==') return value === expected;
    if (operator === '!=') return value !== expected;
    if (operator === 'contains') return value.toLowerCase().includes(expected.toLowerCase());
    if (operator === 'startswith') return value.toLowerCase().startsWith(expected.toLowerCase());
    return false;
  }

  function applySafeguards(candidates, rule, fixture, windowStart, evaluatedAt) {
    const telemetry = fixture.scenario.telemetry || [];
    const rowsById = new Map(telemetry.map((row) => [String(row.id), row]));
    const exclusion = rule.exclusion?.enabled === true ? upgradeSafeguard(rule.exclusion, 'field') : null;
    const exclusionValid = exclusion && fieldsFor(fixture).includes(exclusion.field)
      && ['==', '!=', 'contains', 'startswith'].includes(exclusion.operator)
      && typeof exclusion.value === 'string' && exclusion.value.length > 0;
    const prepared = candidates.map((candidate) => {
      const evidenceRows = candidate.supportingEventIds.map((id) => rowsById.get(id)).filter(Boolean);
      const matches = exclusionValid ? evidenceRows.filter((row) => exclusionMatches(safeguardValue(row, exclusion.field), exclusion.operator, exclusion.value)) : [];
      return {
        ...candidate,
        disposition: matches.length ? 'excluded' : 'retained',
        exclusion: matches.length ? {
          reason: typeof exclusion.reason === 'string' && exclusion.reason ? exclusion.reason : 'Configured exclusion matched.',
          field: exclusion.field, operator: exclusion.operator, value: exclusion.value,
          evidence: matches.map((row) => ({ eventId: String(row.id), value: safeguardValue(row, exclusion.field) })),
        } : null,
        suppression: null,
        _evidenceRows: evidenceRows,
      };
    });
    const suppression = rule.suppression?.enabled === true ? upgradeSafeguard(rule.suppression, 'groupField') : null;
    const suppressionValid = suppression && fieldsFor(fixture).includes(suppression.groupField)
      && Number.isSafeInteger(suppression.windowMinutes) && suppression.windowMinutes >= 1 && suppression.windowMinutes <= 1440;
    const windowMs = suppressionValid ? suppression.windowMinutes * 60000 : 0;
    const retainedByKey = new Map();
    const ordered = [...prepared].sort((a, b) => {
      const ta = Math.min(...a._evidenceRows.map((row) => Date.parse(row.time)).filter(Number.isFinite), Infinity);
      const tb = Math.min(...b._evidenceRows.map((row) => Date.parse(row.time)).filter(Number.isFinite), Infinity);
      return ta - tb || String(a.group).localeCompare(String(b.group));
    });
    if (suppressionValid) ordered.forEach((candidate, candidateIndex) => {
      if (candidate.disposition === 'excluded') return;
      const keys = [...new Set(candidate._evidenceRows.map((row) => safeguardValue(row, suppression.groupField))
        .filter((value) => value !== undefined && value !== null && value !== '').map(String))].sort();
      const candidateTime = Math.min(...candidate._evidenceRows.map((row) => Date.parse(row.time)).filter(Number.isFinite), Date.parse(evaluatedAt));
      let prior = null;
      for (const key of keys) {
        const entries = retainedByKey.get(key) || [];
        const match = entries.find((entry) => candidateTime - entry.time <= windowMs);
        if (match) { prior = { key, entry: match }; break; }
      }
      if (prior) {
        candidate.disposition = 'suppressed';
        candidate.suppression = {
          groupField: suppression.groupField, groupValue: prior.key, windowMinutes: suppression.windowMinutes,
          suppressedByGroup: prior.entry.group, suppressedByEventIds: prior.entry.eventIds,
          evidenceEventIds: candidate.supportingEventIds,
          reason: `Suppressed within ${suppression.windowMinutes} minutes by an earlier candidate sharing ${suppression.groupField}.`,
        };
      } else {
        candidate.suppression = null;
        for (const key of keys) {
          const entries = retainedByKey.get(key) || [];
          entries.push({ time: candidateTime, group: candidate.group, eventIds: candidate.supportingEventIds });
          retainedByKey.set(key, entries);
        }
      }
    });
    return ordered.map(({ _evidenceRows, ...candidate }) => candidate)
      .sort((a, b) => String(a.group).localeCompare(String(b.group)));
  }

  function evaluate(rule, fixture) {
    if (!rule || typeof rule !== 'object') return { succeeded: false, error: 'Analytics rule is required.', candidates: [], evaluatedAt: fixture?.scenario?.end || null };
    const evaluatedAt = fixture?.scenario?.end || null;
    if (rule.enabled !== true) return { succeeded: false, error: 'Rule is disabled.', candidates: [], evaluatedAt };
    if (typeof rule.query !== 'string' || !rule.query.trim()) return { succeeded: false, error: 'Rule query is empty.', candidates: [], evaluatedAt };
    if (typeof rule.groupingField !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(rule.groupingField)) return { succeeded: false, error: 'Rule grouping field is invalid.', candidates: [], evaluatedAt };
    if (!Number.isSafeInteger(rule.threshold) || rule.threshold < 1 || !Number.isSafeInteger(rule.windowMinutes) || rule.windowMinutes < 1 || rule.windowMinutes > 1440) return { succeeded: false, error: 'Rule threshold or lookback window is invalid.', candidates: [], evaluatedAt };
    if (!evaluatedAt || typeof MnKql === 'undefined') return { succeeded: false, error: 'M04 fixture or KQL evaluator is unavailable.', candidates: [], evaluatedAt };

    const tables = telemetryTables(fixture, rule.windowMinutes);
    let result;
    try {
      result = MnKql.evaluate(queryWithEvidence(rule.query), tables, { now: evaluatedAt });
    } catch (error) {
      return { succeeded: false, error: String(error?.message || error), candidates: [], evaluatedAt };
    }
    if (result.error) return { succeeded: false, error: result.error, candidates: [], evaluatedAt };
    const exclusion = rule.exclusion?.enabled === true ? upgradeSafeguard(rule.exclusion, 'field') : null;
    const excludedByGroup = new Map();
    if (exclusion) {
      const fields = fieldsFor(fixture);
      const operators = ['==', '!=', 'contains', 'startswith'];
      if (!fields.includes(exclusion.field) || !operators.includes(exclusion.operator) || typeof exclusion.value !== 'string' || !exclusion.value) {
        return { succeeded: false, error: 'Enabled rule exclusion is invalid.', candidates: [], evaluatedAt };
      }
      const idFor = (row) => [row.EventId, ...(Array.isArray(row.SupportingEventIds) ? row.SupportingEventIds : typeof row.SupportingEventIds === 'string' ? row.SupportingEventIds.split(/\s*,\s*/) : [])].filter((id) => id !== undefined && id !== null).map(String);
      const allInputRows = Object.values(tables).flat();
      const matches = allInputRows.filter((row) => exclusionMatches(row[exclusion.field], exclusion.operator, exclusion.value));
      const excludedIds = new Set(matches.map((row) => String(row.EventId)));
      const inputById = new Map(allInputRows.map((row) => [String(row.EventId), row]));
      for (const row of result.rows || []) {
        const matchedIds = idFor(row).filter((id) => excludedIds.has(id));
        if (!matchedIds.length || !Object.hasOwn(row, rule.groupingField)) continue;
        const key = String(row[rule.groupingField]);
        if (!excludedByGroup.has(key)) excludedByGroup.set(key, { group: row[rule.groupingField], eventIds: new Set() });
        matchedIds.forEach((id) => excludedByGroup.get(key).eventIds.add(id));
      }
      const relevantIds = new Set([...excludedByGroup.values()].flatMap((item) => [...item.eventIds]));
      if (relevantIds.size) {
        try {
          const kept = Object.fromEntries(Object.entries(tables).map(([name, rows]) => [name, rows.filter((row) => !relevantIds.has(String(row.EventId)))]));
          result = MnKql.evaluate(queryWithEvidence(rule.query), kept, { now: evaluatedAt });
        } catch (error) {
          return { succeeded: false, error: String(error?.message || error), candidates: [], evaluatedAt };
        }
        if (result.error) return { succeeded: false, error: result.error, candidates: [], evaluatedAt };
      }
      excludedByGroup.forEach((item) => {
        item.eventIds = [...item.eventIds].sort();
        item.evidence = item.eventIds.map((id) => ({ eventId: id, value: inputById.get(id)?.[exclusion.field] }));
      });
    }
    const rows = Array.isArray(result.rows) ? result.rows : [];
    if (rows.some((row) => !Object.hasOwn(row, rule.groupingField))) {
      return { succeeded: false, error: `Query results do not include grouping field "${rule.groupingField}".`, candidates: [], evaluatedAt };
    }

    const numericColumns = (result.cols || []).filter((column) => column !== rule.groupingField && column !== 'SupportingEventIds' && rows.some((row) => Number.isFinite(row[column]) && typeof row[column] === 'number'));
    const metricColumn = numericColumns[0] || null;
    const grouped = new Map();
    rows.forEach((row) => {
      const group = row[rule.groupingField];
      if (group === null || group === undefined || group === '') return;
      const key = String(group);
      if (!grouped.has(key)) grouped.set(key, { group, count: 0, eventIds: [], metricValues: [] });
      const candidate = grouped.get(key);
      candidate.count += 1;
      if (row.EventId !== undefined && row.EventId !== null) candidate.eventIds.push(String(row.EventId));
      if (Array.isArray(row.SupportingEventIds)) candidate.eventIds.push(...row.SupportingEventIds.map(String));
      else if (typeof row.SupportingEventIds === 'string') candidate.eventIds.push(...row.SupportingEventIds.split(/\s*,\s*/).filter(Boolean));
      if (metricColumn) candidate.metricValues.push(row[metricColumn]);
    });

    const candidates = [...grouped.values()].map((candidate) => {
      const metric = metricColumn
        ? candidate.metricValues.reduce((sum, value) => sum + value, 0)
        : candidate.count;
      return {
        group: candidate.group,
        groupingField: rule.groupingField,
        matchCount: metric,
        rawRowCount: candidate.count,
        metricColumn,
        threshold: rule.threshold,
        thresholdMet: metric >= rule.threshold,
        supportingEventIds: [...new Set(candidate.eventIds)].sort(),
      };
    }).sort((a, b) => String(a.group).localeCompare(String(b.group)));
    const windowStart = new Date(Date.parse(evaluatedAt) - rule.windowMinutes * 60000).toISOString();
    const safeguarded = applySafeguards(candidates, { ...rule, exclusion: null }, fixture, windowStart, evaluatedAt);
    safeguarded.forEach((candidate) => {
      const excluded = excludedByGroup.get(String(candidate.group));
      if (excluded) candidate.exclusion = { reason: exclusion.reason || 'Configured exclusion matched.', field: exclusion.field, operator: exclusion.operator, value: exclusion.value, evidence: excluded.evidence };
    });
    const existingGroups = new Set(safeguarded.map((candidate) => String(candidate.group)));
    const excludedCandidates = [...excludedByGroup.values()].filter((item) => !existingGroups.has(String(item.group))).map((item) => ({
      group: item.group, groupingField: rule.groupingField, matchCount: 0, rawRowCount: 0,
      metricColumn: null, threshold: rule.threshold, thresholdMet: false, supportingEventIds: [],
      disposition: 'excluded', exclusion: { reason: exclusion.reason || 'Configured exclusion matched.', field: exclusion.field, operator: exclusion.operator, value: exclusion.value, evidence: item.evidence }, suppression: null,
    }));
    const allCandidates = [...safeguarded, ...excludedCandidates].sort((a, b) => String(a.group).localeCompare(String(b.group)));
    return { succeeded: true, error: '', evaluatedAt, windowStart, candidates: allCandidates,
      retainedCandidates: allCandidates.filter((candidate) => candidate.disposition === 'retained'),
      excludedCandidates: allCandidates.filter((candidate) => candidate.disposition === 'excluded'),
      suppressedCandidates: allCandidates.filter((candidate) => candidate.disposition === 'suppressed') };
  }

  return Object.freeze({ evaluate });
})();
