// Vulnerability Scanner — filter, sort, and task-validation engine.
//
// New for Module 8: unlike m03-log-explorer's query-engine.js (a verbatim
// port of a standalone Mission Next module), the source OpenVASLabShell has
// no equivalent pure-logic file — its target/task/report workflow lives
// inline in component state (`src/shells/vuln-management-shells.jsx`). This
// file is authored fresh to give the ported shell the same
// filter/sort/validate split the other range tools use, and to implement
// the "prioritization rationale" REQUIRED ADAPTATION from
// docs/LAB_MIGRATION_MATRIX.md (the `rationale-count` validation type).

function sevRank(severity) {
  return { Critical: 5, High: 4, Medium: 3, Low: 2, Info: 1 }[severity] || 0;
}

function filterFindings(findings, filters) {
  return findings.filter((finding) => {
    if (filters.severity && finding.severity !== filters.severity) return false;
    if (filters.severityIn && !filters.severityIn.includes(finding.severity)) return false;
    if (filters.host && finding.host !== filters.host) return false;
    return true;
  });
}

function sortFindings(findings) {
  return findings.slice().sort((a, b) => sevRank(b.severity) - sevRank(a.severity) || b.cvss - a.cvss);
}

// Validate one task against the current filter state (for filter-count
// tasks) or the free-text prioritization rationale the student wrote (for
// rationale-count tasks — the field added per the matrix's REQUIRED
// ADAPTATION note, so a pass here requires real written reasoning, not just
// clicking through findings).
function validateVulnTask(task, context) {
  const { filters, filteredRows, rationales, findings } = context;
  const v = task.validation;

  if (v.type === 'filter-count') {
    if (v.severity && filters.severity !== v.severity) return false;
    if (v.severityIn) {
      const want = v.severityIn.slice().sort().join(',');
      const have = (filters.severityIn || []).slice().sort().join(',');
      if (want !== have) return false;
    }
    if (v.host && filters.host !== v.host) return false;
    if (!v.severity && !v.severityIn && !v.host) return false;
    return filteredRows.length === v.expected;
  }

  if (v.type === 'rationale-count') {
    const byId = new Map(findings.map((finding) => [finding.id, finding]));
    const qualifying = Object.entries(rationales || {}).filter(([id, text]) => {
      if ((text || '').trim().length < (v.minLength || 40)) return false;
      const finding = byId.get(id);
      if (v.severity && (!finding || finding.severity !== v.severity)) return false;
      return true;
    });
    return qualifying.length >= (v.minCount || 1);
  }

  return false;
}

Object.assign(window, { sevRank, filterFindings, sortFindings, validateVulnTask });
