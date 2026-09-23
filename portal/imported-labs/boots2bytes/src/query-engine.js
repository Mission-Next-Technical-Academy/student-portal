// ============================================================
//  Boots2Bytes — SIEM Query Engine
// ============================================================

function executeQuery(queryStr, logs) {
  if (!queryStr || !queryStr.trim()) return { rows: logs, type: 'raw', error: null };

  const pipes = queryStr.trim().split('|').map(s => s.trim()).filter(Boolean);
  let rows = [...logs];
  let resultType = 'raw';
  let groupResult = null;
  let error = null;

  try {
    for (const pipe of pipes) {
      const lower = pipe.toLowerCase();

      // ── search / filter ─────────────────────────────────
      if (lower.startsWith('search ') || lower.startsWith('filter ')) {
        const expr = pipe.slice(pipe.indexOf(' ') + 1).trim();
        // Support: field=value, field>number, field<number, field>=number, field<=number
        const match = expr.match(/^(\w+)\s*(=|>=|<=|>|<)\s*(.+)$/);
        if (match) {
          const [, field, operator, val] = match;
          const numVal = parseFloat(val);
          rows = rows.filter(row => {
            const rv = row[field];
            if (rv === undefined) return false;
            if (operator === '=') {
              if (!isNaN(numVal) && typeof rv === 'number') return rv === numVal;
              return String(rv).toLowerCase() === val.toLowerCase();
            }
            if (typeof rv !== 'number' || Number.isNaN(numVal)) return false;
            if (operator === '>') return rv > numVal;
            if (operator === '<') return rv < numVal;
            if (operator === '>=') return rv >= numVal;
            if (operator === '<=') return rv <= numVal;
            return false;
          });
        } else {
          // keyword search across all fields, with simple OR support
          const terms = expr.split(/\s+OR\s+/i).map(part => part.trim().toLowerCase()).filter(Boolean);
          rows = rows.filter(row =>
            terms.some(term =>
              Object.values(row).some(v => String(v).toLowerCase().includes(term))
            )
          );
        }
        resultType = 'raw';
      }

      // ── count by field ───────────────────────────────────
      else if (lower.startsWith('count by ')) {
        const field = pipe.slice('count by '.length).trim();
        const counts = {};
        rows.forEach(row => {
          const key = row[field] !== undefined ? String(row[field]) : '(empty)';
          counts[key] = (counts[key] || 0) + 1;
        });
        groupResult = Object.entries(counts)
          .map(([key, count]) => ({ [field]: key, count }))
          .sort((a, b) => b.count - a.count);
        resultType = 'grouped';
        rows = groupResult;
      }

      // ── count (plain) ────────────────────────────────────
      else if (lower === 'count') {
        groupResult = [{ result: 'total', count: rows.length }];
        resultType = 'grouped';
        rows = groupResult;
      }

      // ── sort by field ────────────────────────────────────
      else if (lower.startsWith('sort by ') || lower.startsWith('sort ')) {
        const parts = pipe.split(/\s+/);
        const field = parts[parts.length - 1];
        const desc = lower.includes(' desc');
        rows = [...rows].sort((a, b) => {
          const va = a[field], vb = b[field];
          if (typeof va === 'number' && typeof vb === 'number') return desc ? vb - va : va - vb;
          return desc
            ? String(vb).localeCompare(String(va))
            : String(va).localeCompare(String(vb));
        });
      }

      // ── head / limit ─────────────────────────────────────
      else if (lower.startsWith('head ') || lower.startsWith('limit ')) {
        const n = parseInt(pipe.split(/\s+/)[1]) || 10;
        rows = rows.slice(0, n);
      }

      // ── stats count ──────────────────────────────────────
      else if (lower.startsWith('stats count')) {
        const byMatch = lower.match(/by\s+(\w+)/);
        if (byMatch) {
          const field = byMatch[1];
          const counts = {};
          rows.forEach(row => {
            const key = row[field] !== undefined ? String(row[field]) : '(empty)';
            counts[key] = (counts[key] || 0) + 1;
          });
          rows = Object.entries(counts)
            .map(([k, c]) => ({ [field]: k, count: c }))
            .sort((a, b) => b.count - a.count);
          resultType = 'grouped';
        }
      }

      // ── dedup / unique ───────────────────────────────────
      else if (lower.startsWith('dedup ')) {
        const field = pipe.slice(6).trim();
        const seen = new Set();
        rows = rows.filter(row => {
          const k = String(row[field]);
          if (seen.has(k)) return false;
          seen.add(k); return true;
        });
      }

      // ── unknown command ──────────────────────────────────
      else {
        error = `Unknown command: "${pipe.split(' ')[0]}"`;
      }
    }
  } catch (e) {
    error = 'Query error: ' + e.message;
    rows = [];
  }

  return { rows, type: resultType, error, count: rows.length };
}

// Validate a task against query results
function validateTask(task, queryResult, queryStr) {
  const { rows, type } = queryResult;
  const v = task.validation;

  if (v.type === 'count') {
    return rows.length === v.expected;
  }
  if (v.type === 'count_gt') {
    if (type === 'raw') return rows.length > v.threshold;
    const top = rows.find(r => String(r[v.field] || r['count']) === String(v.value));
    return top ? (top.count || rows.length) > v.threshold : rows.length > v.threshold;
  }
  if (v.type === 'groupby') {
    if (type !== 'grouped') return false;
    const top = rows[0];
    if (!top) return false;
    const topKey = String(top[v.field] || top[Object.keys(top)[0]]);
    return topKey === v.expected_top;
  }
  if (v.type === 'equals') {
    return Array.isArray(rows) && rows.length > 0;
  }
  return false;
}

// Get human-readable suggestion for a task
function getTaskHint(task) {
  return task.hint || 'Read the task description carefully and use the filter/count commands.';
}

Object.assign(window, { executeQuery, validateTask, getTaskHint });
