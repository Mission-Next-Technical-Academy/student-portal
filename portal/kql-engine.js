/* Mission Next KQL engine — a bounded, in-browser KQL subset for lab consoles.
 *
 * Ported from the defender-lab mock executor (~/defender-lab/ui/views.js,
 * mockKql*), made table-agnostic: every call passes its own tables, so each
 * module console owns its fixtures and nothing leaks between labs.
 *
 * Supported: let bindings, union, join (inner/leftouter), where (==, !=, <, >,
 * in, !in, has, has_any, contains, startswith, endswith, between, matches
 * regex, isempty, isnull, and/or/not), project, project-away, project-rename,
 * extend, parse, summarize (count/sum/dcount/countif/arg_max/min/max/
 * make_set by, bin()), sort/order by, top, take/limit, distinct, count,
 * render. Unknown tables and operators return an explicit error instead of
 * silently producing an empty grid.
 *
 * Rows may carry a hidden `__rid` (record id). It survives where/extend/
 * project/sort/join so a console can map any result row back to its source
 * record (for pinning evidence), and it is never listed as a column.
 *
 *   MnKql.evaluate(query, tables, { now })  -> { rows, cols, render, source, error }
 *
 * `now` pins ago()/now() to the fixture's lab clock so saved queries never
 * expire against the learner's wall clock.
 */
const MnKql = (function () {
  'use strict';
  let TABLES = {};
  let LAB_NOW = null;
  function mockKqlTables() { return TABLES; }
  const labNow = () => (LAB_NOW ? LAB_NOW.getTime() : Date.now());
function mockKqlCloneRows(rows) {
  return rows.map(r => ({ ...r }));
}
function mockKqlStripComments(text) {
  return String(text || '').replace(/^\s*\/\/.*$/gm, '').trim();
}
function mockKqlTrimParens(text) {
  let out = String(text || '').trim();
  while (out.startsWith('(') && out.endsWith(')')) {
    let depth = 0, ok = true, quote = '';
    for (let i = 0; i < out.length; i++) {
      const ch = out[i];
      if (quote) {
        if (ch === quote && out[i - 1] !== '\\') quote = '';
        continue;
      }
      if (ch === '"' || ch === "'") { quote = ch; continue; }
      if (ch === '(' || ch === '[' || ch === '{') depth++;
      else if (ch === ')' || ch === ']' || ch === '}') {
        depth--;
        if (depth === 0 && i < out.length - 1) { ok = false; break; }
      }
    }
    if (!ok || depth !== 0) break;
    out = out.slice(1, -1).trim();
  }
  return out;
}
function mockKqlSplitTopLevel(text, needle) {
  const out = [];
  const src = String(text || '');
  const token = String(needle);
  let depth = 0, quote = '', cur = '';
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      cur += ch;
      if (ch === quote && src[i - 1] !== '\\') quote = '';
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue; }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth = Math.max(0, depth - 1);
    if (depth === 0 && src.slice(i, i + token.length) === token) {
      out.push(cur);
      cur = '';
      i += token.length - 1;
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}
function mockKqlCsvToRows(csvText) {
  const lines = String(csvText || '').trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const parseLine = line => {
    const out = [];
    let cur = '', quote = '';
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quote) {
        if (ch === quote && line[i - 1] !== '\\') quote = '';
        else cur += ch;
        continue;
      }
      if (ch === '"' || ch === "'") { quote = ch; continue; }
      if (ch === ',') { out.push(cur); cur = ''; continue; }
      cur += ch;
    }
    out.push(cur);
    return out.map(v => v.trim());
  };
  const headers = parseLine(lines[0]);
  return lines.slice(1).map(line => {
    const cells = parseLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? '']));
  });
}
function mockKqlMaybeDate(value) {
  if (value instanceof Date) return value;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}
function mockKqlComparable(value) {
  const dt = mockKqlMaybeDate(value);
  if (dt) return dt.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  const num = Number(value);
  return Number.isNaN(num) ? String(value ?? '') : num;
}
function mockKqlValueList(value) {
  if (Array.isArray(value)) {
    return value.flatMap(item => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const keys = Object.keys(item);
        if (keys.length === 1) return [item[keys[0]]];
        if ('Value' in item) return [item.Value];
        return [keys.length ? item[keys[0]] : item];
      }
      return [item];
    });
  }
  if (value && typeof value === 'object') return Object.values(value);
  if (value == null) return [];
  return [value];
}
function mockKqlDateUnit(unit) {
  const u = String(unit || '').toLowerCase();
  const m = u.match(/^(\d+)\s*(ms|s|m|h|d|w)$/);
  const amount = m ? parseInt(m[1], 10) : 1;
  const kind = m ? m[2] : u;
  if (kind.startsWith('ms')) return amount;
  if (kind.startsWith('s')) return amount * 1000;
  if (kind.startsWith('m')) return amount * 60e3;
  if (kind.startsWith('h')) return amount * 3600e3;
  if (kind.startsWith('d')) return amount * 86400e3;
  if (kind.startsWith('w')) return amount * 604800e3;
  return 1;
}
function mockKqlContext(row, bindings, cache) {
  const helper = {
    tostring: v => (v == null ? '' : String(v)),
    toint: v => parseInt(v, 10),
    tolong: v => parseInt(v, 10),
    todouble: v => parseFloat(v),
    tolower: v => String(v ?? '').toLowerCase(),
    toupper: v => String(v ?? '').toUpperCase(),
    trim: v => String(v ?? '').trim(),
    parse_json: v => {
      if (v && typeof v === 'object') return v;
      try { return JSON.parse(String(v || '{}')); } catch { return {}; }
    },
    split: (v, sep) => String(v ?? '').split(String(sep ?? ',')),
    extract: (pattern, idx, value) => {
      let re;
      try {
        const pat = String(pattern ?? '').replace(/^@/, '');
        re = new RegExp(pat);
      } catch { return null; }
      const match = String(value ?? '').match(re);
      const group = parseInt(idx, 10);
      return match ? (match[group] ?? null) : null;
    },
    bin: (value, period) => {
      const dt = mockKqlMaybeDate(value);
      if (!dt) return value;
      const size = mockKqlDateUnit(period);
      const rounded = Math.floor(dt.getTime() / size) * size;
      return new Date(rounded).toISOString();
    },
    ago: span => {
      const m = String(span || '').trim().match(/^(\d+)\s*([smhdw])$/i);
      const size = m ? mockKqlDateUnit(m[2]) : 0;
      const amount = m ? parseInt(m[1], 10) : 0;
      return new Date(labNow() - amount * size);
    },
    now: () => new Date(labNow()),
    datetime: value => new Date(String(value ?? '')),
    datetime_diff: (unit, left, right) => {
      const a = mockKqlMaybeDate(left);
      const b = mockKqlMaybeDate(right);
      if (!a || !b) return 0;
      const divisor = mockKqlDateUnit(unit);
      return Math.round((a.getTime() - b.getTime()) / divisor);
    },
    coalesce: (...vals) => vals.find(v => v != null && v !== ''),
    isempty: v => v == null || v === '',
    isnull: v => v == null,
    hasText: (left, right) => String(left ?? '').toLowerCase().includes(String(right ?? '').toLowerCase()),
    startsWithText: (left, right) => String(left ?? '').toLowerCase().startsWith(String(right ?? '').toLowerCase()),
    endsWithText: (left, right) => String(left ?? '').toLowerCase().endsWith(String(right ?? '').toLowerCase()),
    containsText: (left, right) => String(left ?? '').toLowerCase().includes(String(right ?? '').toLowerCase()),
    inList: (left, list) => mockKqlValueList(list).some(v => String(v ?? '').toLowerCase() === String(left ?? '').toLowerCase()),
    notInList: (left, list) => !helper.inList(left, list),
    hasAny: (left, list) => mockKqlValueList(list).some(v => String(left ?? '').toLowerCase().includes(String(v ?? '').toLowerCase())),
    matchesRegex: (left, pattern) => {
      try { return new RegExp(String(pattern)).test(String(left ?? '')); } catch { return false; }
    },
    abs: value => Math.abs(Number(value) || 0),
  };
  return { ...helper, ...row };
}
function mockKqlRewriteScalarExpr(expr) {
  return String(expr || '')
    .replace(/@\s*"/g, '"')
    .replace(/\bago\(\s*(\d+\s*[smhdw])\s*\)/gi, (_, span) => `ago("${span.replace(/\s+/g, '')}")`)
    .replace(/\bdatetime\(\s*([0-9]{4}-[0-9T:\-\.Z]+)\s*\)/gi, (_, value) => `datetime("${value}")`)
    .replace(/\bbin\(\s*([^,]+),\s*(\d+\s*[smhdw])\s*\)/gi, (_, value, unit) => `bin(${value}, "${unit.replace(/\s+/g, '')}")`);
}
function mockKqlEvalScalar(expr, row, bindings, cache) {
  const js = mockKqlRewriteScalarExpr(expr);
  try {
    return Function('ctx', `with(ctx){ return (${js}); }`)(mockKqlContext(row, bindings, cache));
  } catch {
    return null;
  }
}
function mockKqlEvalList(expr, row, bindings, cache) {
  const trimmed = mockKqlTrimParens(String(expr || '').trim());
  if (!trimmed) return [];
  if (bindings[trimmed] != null) {
    const resolved = mockKqlResolveBinding(trimmed, bindings, cache);
    return mockKqlValueList(resolved);
  }
  return mockKqlSplitTopLevel(trimmed, ',').map(item => mockKqlEvalScalar(item.trim(), row, bindings, cache)).filter(v => v !== undefined);
}
function mockKqlCompare(left, right, op) {
  const lDate = mockKqlMaybeDate(left);
  const rDate = mockKqlMaybeDate(right);
  const l = lDate ? lDate.getTime() : mockKqlComparable(left);
  const r = rDate ? rDate.getTime() : mockKqlComparable(right);
  switch (op) {
    case '==': return l === r;
    case '!=': return l !== r;
    case '>': return l > r;
    case '>=': return l >= r;
    case '<': return l < r;
    case '<=': return l <= r;
    default: return false;
  }
}
// Process the escape sequences inside an already-unquoted KQL string literal.
function mockKqlUnescapeLiteral(s) {
  return String(s ?? '').replace(/\\(["'\\ntr])/g, (_, c) =>
    ({ n: '\n', t: '\t', r: '\r' }[c] || c));
}

function mockKqlEvalPredicate(expr, row, bindings, cache) {
  let text = mockKqlTrimParens(String(expr || '').trim());
  const orParts = mockKqlSplitTopLevel(text, ' or ');
  if (orParts.length > 1) return orParts.some(part => mockKqlEvalPredicate(part, row, bindings, cache));
  const andParts = mockKqlSplitTopLevel(text, ' and ');
  if (andParts.length > 1) return andParts.every(part => mockKqlEvalPredicate(part, row, bindings, cache));
  if (/^not\s+/i.test(text)) return !mockKqlEvalPredicate(text.replace(/^not\s+/i, ''), row, bindings, cache);

  let m;
  if ((m = text.match(/^isempty\((.+)\)$/i))) return !!mockKqlContext(row, bindings, cache).isempty(mockKqlEvalScalar(m[1], row, bindings, cache));
  if ((m = text.match(/^isnull\((.+)\)$/i))) return !!mockKqlContext(row, bindings, cache).isnull(mockKqlEvalScalar(m[1], row, bindings, cache));
  if ((m = text.match(/^(.+?)\s+between\s+\(\s*(.+?)\s*\.\.\s*(.+?)\s*\)$/i))) {
    const left = mockKqlEvalScalar(m[1], row, bindings, cache);
    return mockKqlCompare(left, mockKqlEvalScalar(m[2], row, bindings, cache), '>=') &&
      mockKqlCompare(left, mockKqlEvalScalar(m[3], row, bindings, cache), '<=');
  }
  if ((m = text.match(/^(.+?)\s+matches\s+regex\s+"([^"]*)"$/i))) return mockKqlContext(row, bindings, cache).matchesRegex(mockKqlEvalScalar(m[1], row, bindings, cache), m[2]);
  if ((m = text.match(/^(.+?)\s+(!?has_any)\s+\((.+)\)$/i))) {
    const left = mockKqlEvalScalar(m[1], row, bindings, cache);
    const values = mockKqlEvalList(m[3], row, bindings, cache);
    const matched = values.some(v => String(left ?? '').toLowerCase().includes(String(v ?? '').toLowerCase()));
    return m[2].startsWith('!') ? !matched : matched;
  }
  if ((m = text.match(/^(.+?)\s+(has|contains|startswith|endswith)\s+"([^"]*)"$/i))) {
    const left = mockKqlEvalScalar(m[1], row, bindings, cache);
    // This branch captures the literal raw, so escapes still need processing —
    // the == path gets it for free by evaluating the literal as JS. Without
    // this, `startswith "C:\\Users"` never matches a path containing `C:\Users`.
    const right = mockKqlUnescapeLiteral(m[3]);
    const ctx = mockKqlContext(row, bindings, cache);
    if (m[2].toLowerCase() === 'has') return ctx.hasText(left, right);
    if (m[2].toLowerCase() === 'contains') return ctx.containsText(left, right);
    if (m[2].toLowerCase() === 'startswith') return ctx.startsWithText(left, right);
    return ctx.endsWithText(left, right);
  }
  if ((m = text.match(/^(.+?)\s+(!?in)\s+\((.+)\)$/i))) {
    const left = mockKqlEvalScalar(m[1], row, bindings, cache);
    const values = mockKqlEvalList(m[3], row, bindings, cache);
    const matched = values.some(v => String(v ?? '').toLowerCase() === String(left ?? '').toLowerCase());
    return m[2].startsWith('!') ? !matched : matched;
  }
  if ((m = text.match(/^(.+?)\s*(==|!=|>=|<=|>|<)\s*(.+)$/))) {
    const left = mockKqlEvalScalar(m[1], row, bindings, cache);
    const right = mockKqlEvalScalar(m[3], row, bindings, cache);
    return mockKqlCompare(left, right, m[2]);
  }

  const js = mockKqlRewriteScalarExpr(text)
    .replace(/\btrue\b/gi, 'true')
    .replace(/\bfalse\b/gi, 'false')
    .replace(/\bnull\b/gi, 'null')
    .replace(/\bnot\s+/gi, '!')
    .replace(/\band\b/gi, '&&')
    .replace(/\bor\b/gi, '||')
    .replace(/([A-Za-z_][A-Za-z0-9_.]*)\s+has_any\s+\(([^)]+)\)/gi, 'hasAny($1, [$2])')
    .replace(/([A-Za-z_][A-Za-z0-9_.]*)\s+(!?in)\s+\(([^)]+)\)/gi, (_, left, op, list) => `${op.startsWith('!') ? 'notInList' : 'inList'}(${left}, [${list}])`)
    .replace(/([A-Za-z_][A-Za-z0-9_.]*)\s+has\s+"([^"]*)"/gi, 'hasText($1, "$2")')
    .replace(/([A-Za-z_][A-Za-z0-9_.]*)\s+contains\s+"([^"]*)"/gi, 'containsText($1, "$2")')
    .replace(/([A-Za-z_][A-Za-z0-9_.]*)\s+startswith\s+"([^"]*)"/gi, 'startsWithText($1, "$2")')
    .replace(/([A-Za-z_][A-Za-z0-9_.]*)\s+endswith\s+"([^"]*)"/gi, 'endsWithText($1, "$2")')
    .replace(/([A-Za-z_][A-Za-z0-9_.]*)\s+matches\s+regex\s+"([^"]*)"/gi, 'matchesRegex($1, "$2")')
    .replace(/([A-Za-z_][A-Za-z0-9_.]*)\s+between\s+\(\s*(.+?)\s*\.\.\s*(.+?)\s*\)/gi, 'betweenValues($1, $2, $3)');
  try {
    return Function('ctx', `with(ctx){ return (${js}); }`)({
      ...mockKqlContext(row, bindings, cache),
      betweenValues: (left, start, end) => mockKqlCompare(left, start, '>=') && mockKqlCompare(left, end, '<='),
    });
  } catch {
    return false;
  }
}
function mockKqlParseCsvSource(sourceName) {
  return []; // externaldata is not bundled in portal labs
}
function mockKqlResolveBinding(name, bindings, cache) {
  if (cache.bindingResults[name] != null) return cache.bindingResults[name];
  const expr = bindings[name];
  if (expr == null) return null;
  const resolved = mockKqlEvaluate(expr, bindings, cache);
  cache.bindingResults[name] = resolved;
  return resolved;
}
// ASIM fixtures are a frozen telemetry snapshot. Relative parser parameters
// therefore use the newest row in that parser as the lab clock; evaluating
// ago(1d) against the learner's wall clock would make every saved query expire.
function mockKqlParserTime(value, rows, bindings, cache) {
  const expression = String(value || '').trim();
  const latest = rows.reduce((max, row) => {
    const time = new Date(row.TimeGenerated || row.Timestamp || '').getTime();
    return Number.isFinite(time) ? Math.max(max, time) : max;
  }, Number.NEGATIVE_INFINITY);
  if (/^now\(\)$/i.test(expression) && Number.isFinite(latest)) return new Date(latest);
  const ago = expression.match(/^ago\(\s*(\d+\s*(?:ms|s|m|h|d|w))\s*\)$/i);
  if (ago) {
    if (Number.isFinite(latest)) return new Date(latest - mockKqlDateUnit(ago[1]));
  }
  return mockKqlMaybeDate(mockKqlEvalScalar(value, {}, bindings, cache));
}

function mockKqlParserList(value, bindings, cache) {
  const name = String(value || '').trim();
  const expression = bindings[name] != null ? String(bindings[name]).trim() : name;
  const dynamic = expression.match(/^dynamic\s*\(\s*([\s\S]+)\s*\)$/i);
  if (dynamic) {
    try { return mockKqlValueList(JSON.parse(dynamic[1].replace(/'/g, '"'))); }
    catch { return []; }
  }
  return mockKqlValueList(mockKqlEvalScalar(expression, {}, bindings, cache));
}
function mockKqlEvaluateSource(expr, bindings, cache) {
  const source = mockKqlTrimParens(String(expr || '').trim());
  if (!source) return [];
  if (bindings[source] != null) return mockKqlResolveBinding(source, bindings, cache);
  if (/^union\b/i.test(source)) {
    const parts = mockKqlSplitTopLevel(source.replace(/^union\b\s*/i, ''), ',');
    return parts.flatMap(part => mockKqlNormalizeRows(mockKqlEvaluateSource(part.trim(), bindings, cache)));
  }
  if (/^externaldata\b/i.test(source)) return mockKqlParseCsvSource(source);
  const workspaceMatch = source.match(/^workspace\s*\(\s*["'][^"']+["']\s*\)\s*\.\s*([A-Za-z_][A-Za-z0-9_]*)$/i);
  if (workspaceMatch) return mockKqlCloneRows(mockKqlTables()[workspaceMatch[1]] || []);
  const fnMatch = source.match(/^(_Im_[A-Za-z0-9_]+)\s*\(([\s\S]*)\)$/);
  if (fnMatch) {
    const rows = mockKqlCloneRows(mockKqlTables()[fnMatch[1]] || []);
    const params = {};
    mockKqlSplitTopLevel(fnMatch[2], ',').forEach(part => {
      const eq = part.indexOf('=');
      if (eq < 0) return;
      params[part.slice(0, eq).trim().toLowerCase()] = part.slice(eq + 1).trim();
    });
    let out = rows;
    if (params.starttime) {
      const dt = mockKqlParserTime(params.starttime, rows, bindings, cache);
      if (dt) out = out.filter(row => mockKqlCompare(row.TimeGenerated || row.Timestamp, dt, '>='));
    }
    if (params.endtime) {
      const dt = mockKqlParserTime(params.endtime, rows, bindings, cache);
      if (dt) out = out.filter(row => mockKqlCompare(row.TimeGenerated || row.Timestamp, dt, '<='));
    }
    if (params.eventtype) {
      const ev = String(mockKqlEvalScalar(params.eventtype, {}, bindings, cache) ?? '').toLowerCase();
      out = out.filter(row => String(row.EventType ?? '').toLowerCase() === ev);
    }
    if (params.srcipaddr) {
      const ip = String(mockKqlEvalScalar(params.srcipaddr, {}, bindings, cache) ?? '');
      out = out.filter(row => String(row.SrcIpAddr ?? '') === ip);
    }
    if (params.dstipaddr) {
      const ip = String(mockKqlEvalScalar(params.dstipaddr, {}, bindings, cache) ?? '');
      out = out.filter(row => String(row.DstIpAddr ?? '') === ip);
    }
    if (params.responsecodename) {
      const code = String(mockKqlEvalScalar(params.responsecodename, {}, bindings, cache) ?? '').toLowerCase();
      out = out.filter(row => String(row.EventResultDetails ?? '').toLowerCase() === code);
    }
    if (params.domain_has_any) {
      const domains = mockKqlParserList(params.domain_has_any, bindings, cache).map(value => String(value).toLowerCase());
      out = out.filter(row => domains.some(domain => String(row.DnsQuery ?? '').toLowerCase().includes(domain)));
    }
    if (params.response_has_ipv4) {
      const ip = String(mockKqlEvalScalar(params.response_has_ipv4, {}, bindings, cache) ?? '');
      out = out.filter(row => String(row.DnsResponseName ?? '').includes(ip));
    }
    if (params.response_has_any_prefix) {
      const prefixes = mockKqlParserList(params.response_has_any_prefix, bindings, cache).map(String);
      out = out.filter(row => prefixes.some(prefix => String(row.DnsResponseName ?? '').startsWith(prefix)));
    }
    return out;
  }
  if (mockKqlTables()[source]) return mockKqlCloneRows(mockKqlTables()[source]);
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(source)) {
    const table = mockKqlTables()[source];
    return table ? mockKqlCloneRows(table) : [];
  }
  return mockKqlEvaluate(source, bindings, cache).rows;
}
function mockKqlNormalizeRows(value) {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.rows)) return value.rows;
  return [];
}
function mockKqlFindTopLevelEquals(text) {
  let depth = 0, quote = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === quote && text[i - 1] !== '\\') quote = '';
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth = Math.max(0, depth - 1);
    else if (depth === 0 && ch === '=') return i;
  }
  return -1;
}
function mockKqlParseAssignments(text) {
  return mockKqlSplitTopLevel(text, ',').map(item => item.trim()).filter(Boolean).map(item => {
    const eq = mockKqlFindTopLevelEquals(item);
    if (eq >= 0) return { name: item.slice(0, eq).trim(), expr: item.slice(eq + 1).trim() };
    return { name: item, expr: item };
  });
}
function mockKqlApplyProject(rows, clause, bindings, cache, keepExisting) {
  const assignments = mockKqlParseAssignments(clause);
  return rows.map(row => {
    const base = keepExisting ? { ...row } : (row.__rid != null ? { __rid: row.__rid } : {});
    assignments.forEach(({ name, expr }) => {
      base[name] = mockKqlEvalScalar(expr, row, bindings, cache);
    });
    return base;
  });
}
function mockKqlApplyParse(rows, clause, bindings, cache) {
  const m = clause.match(/^([A-Za-z_][A-Za-z0-9_.]*)\s+with\s+(.+)$/i);
  if (!m) return rows;
  const sourceField = m[1];
  const pattern = m[2];
  const tokens = [];
  let i = 0;
  while (i < pattern.length) {
    while (i < pattern.length && /\s/.test(pattern[i])) i++;
    if (i >= pattern.length) break;
    if (pattern[i] === '"' || pattern[i] === "'") {
      const quote = pattern[i++];
      let literal = '';
      while (i < pattern.length && pattern[i] !== quote) literal += pattern[i++];
      if (pattern[i] === quote) i++;
      tokens.push({ type:'literal', value:literal });
      continue;
    }
    let word = '';
    while (i < pattern.length && !/\s/.test(pattern[i])) word += pattern[i++];
    if (word) {
      if (word === '*') tokens.push({ type:'wildcard' });
      else if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(word)) tokens.push({ type:'capture', value:word });
      else tokens.push({ type:'literal', value:word });
    }
  }
  return rows.map(row => {
    const text = String(row[sourceField] ?? '');
    const out = { ...row };
    let cursor = 0;
    for (let idx = 0; idx < tokens.length; idx++) {
      const token = tokens[idx];
      if (token.type === 'wildcard') continue;
      if (token.type === 'literal') {
        const pos = text.indexOf(token.value, cursor);
        if (pos < 0) return row;
        cursor = pos + token.value.length;
        continue;
      }
      const nextLiteral = tokens.slice(idx + 1).find(t => t.type === 'literal');
      if (!nextLiteral) {
        out[token.value] = text.slice(cursor).trim();
        cursor = text.length;
        continue;
      }
      const pos = text.indexOf(nextLiteral.value, cursor);
      if (pos < 0) return row;
      out[token.value] = text.slice(cursor, pos).trim();
      cursor = pos;
    }
    return out;
  });
}
function mockKqlApplyExtend(rows, clause, bindings, cache) {
  const assignments = mockKqlParseAssignments(clause);
  return rows.map(row => {
    const next = { ...row };
    assignments.forEach(({ name, expr }) => {
      next[name] = mockKqlEvalScalar(expr, row, bindings, cache);
    });
    return next;
  });
}
function mockKqlApplyWhere(rows, clause, bindings, cache) {
  return rows.filter(row => mockKqlEvalPredicate(clause, row, bindings, cache));
}
function mockKqlApplyJoin(leftRows, clause, bindings, cache) {
  const kindMatch = clause.match(/^kind\s*=\s*(inner|leftouter)\s+/i);
  const kind = kindMatch ? kindMatch[1].toLowerCase() : 'inner';
  const rest = kindMatch ? clause.slice(kindMatch[0].length).trim() : clause.trim();
  let rightExpr = '';
  let onExpr = '';
  if (rest.startsWith('(')) {
    let depth = 0, end = -1, quote = '';
    for (let i = 0; i < rest.length; i++) {
      const ch = rest[i];
      if (quote) {
        if (ch === quote && rest[i - 1] !== '\\') quote = '';
        continue;
      }
      if (ch === '"' || ch === "'") { quote = ch; continue; }
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0) { end = i; break; }
      }
    }
    rightExpr = rest.slice(1, end).trim();
    onExpr = rest.slice(end + 1).trim().replace(/^on\s+/i, '');
  } else {
    const onIdx = rest.toLowerCase().lastIndexOf(' on ');
    if (onIdx >= 0) {
      rightExpr = rest.slice(0, onIdx).trim();
      onExpr = rest.slice(onIdx + 4).trim();
    } else {
      rightExpr = rest.trim();
    }
  }
  const rightRows = mockKqlNormalizeRows(mockKqlEvaluateSource(rightExpr, bindings, cache));
  const cond = onExpr || '';
  const explicit = cond.match(/^\$left\.([A-Za-z_][A-Za-z0-9_]*)\s*==\s*\$right\.([A-Za-z_][A-Za-z0-9_]*)$/i);
  const simple = !explicit && cond.match(/^([A-Za-z_][A-Za-z0-9_]*)$/);
  const out = [];
  leftRows.forEach(left => {
    const matches = rightRows.filter(right => {
      if (explicit) return String(left[explicit[1]] ?? '') === String(right[explicit[2]] ?? '');
      if (simple) return String(left[simple[1]] ?? '') === String(right[simple[1]] ?? '');
      return mockKqlEvalPredicate(cond, { ...left, $right: right }, bindings, cache);
    });
    if (matches.length) {
      matches.forEach(right => out.push({ ...left, ...right }));
    } else if (kind === 'leftouter') {
      out.push({ ...left });
    }
  });
  return out;
}
function mockKqlApplySummarize(rows, clause, bindings, cache) {
  const byIdx = clause.toLowerCase().lastIndexOf(' by ');
  const aggText = byIdx >= 0 ? clause.slice(0, byIdx).trim() : clause.trim();
  const byText = byIdx >= 0 ? clause.slice(byIdx + 4).trim() : '';
  const groupExprs = byText ? mockKqlSplitTopLevel(byText, ',').map(s => s.trim()).filter(Boolean) : [];
  const aggItems = mockKqlSplitTopLevel(aggText, ',').map(s => s.trim()).filter(Boolean);
  const groups = new Map();
  rows.forEach(row => {
    const keyParts = groupExprs.map(expr => {
      const bin = expr.match(/^bin\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*,\s*([^)]+)\)$/i);
      if (bin) return { col: bin[1], value: mockKqlEvalScalar(expr, row, bindings, cache) };
      const alias = expr.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/);
      if (alias) return { col: alias[1], value: mockKqlEvalScalar(alias[2], row, bindings, cache) };
      return { col: expr, value: mockKqlEvalScalar(expr, row, bindings, cache) };
    });
    const key = JSON.stringify(keyParts.map(p => p.value));
    const bucket = groups.get(key) || { rows: [], keys: keyParts };
    bucket.rows.push(row);
    groups.set(key, bucket);
  });

  const result = [];
  groups.forEach(bucket => {
    const groupRow = {};
    bucket.keys.forEach(k => { groupRow[k.col] = k.value; });
    aggItems.forEach(item => {
      const alias = item.match(/^([A-Za-z_][A-Za-z0-9_]*|\([^)]+\))\s*=\s*(.+)$/);
      const name = alias ? alias[1] : null;
      const expr = alias ? alias[2] : item;
      let m;
      if ((m = expr.match(/^count\(\)$/i))) {
        groupRow[name || 'count_'] = bucket.rows.length;
      } else if ((m = expr.match(/^sum\(\s*([^)]+)\s*\)$/i))) {
        const field = m[1];
        const outName = name || field.replace(/[^\w]+/g, '_') + '_sum';
        groupRow[outName] = bucket.rows.reduce((n, row) => n + (Number(mockKqlEvalScalar(field, row, bindings, cache)) || 0), 0);
      } else if ((m = expr.match(/^dcount\(\s*([^)]+)\s*\)$/i))) {
        const field = m[1];
        const outName = name || field.replace(/[^\w]+/g, '_') + '_dcount';
        groupRow[outName] = new Set(bucket.rows.map(row => mockKqlEvalScalar(field, row, bindings, cache))).size;
      } else if ((m = expr.match(/^countif\(\s*(.+)\s*\)$/i))) {
        const outName = name || 'countif';
        groupRow[outName] = bucket.rows.filter(row => mockKqlEvalPredicate(m[1], row, bindings, cache)).length;
      } else if ((m = expr.match(/^(min|max|avg)\(\s*([^)]+)\s*\)$/i))) {
        const fn = m[1].toLowerCase(), field = m[2];
        const outName = name || `${fn}_${field.replace(/[^\w]+/g, '_')}`;
        const values = bucket.rows.map(row => mockKqlEvalScalar(field, row, bindings, cache)).filter(v => v != null && v !== '');
        if (fn === 'avg') groupRow[outName] = values.length ? values.reduce((n, v) => n + (Number(v) || 0), 0) / values.length : null;
        else groupRow[outName] = values.reduce((best, v) => best == null ? v : (mockKqlCompare(v, best, fn === 'min' ? '<' : '>') ? v : best), null);
      } else if ((m = expr.match(/^make_set\(\s*([^)]+)\s*\)$/i))) {
        const field = m[1];
        const outName = name || `set_${field.replace(/[^\w]+/g, '_')}`;
        groupRow[outName] = [...new Set(bucket.rows.map(row => mockKqlEvalScalar(field, row, bindings, cache)))].filter(v => v != null && v !== '').join(', ');
      } else if ((m = expr.match(/^arg_max\(\s*([^,]+)\s*,\s*(.+)\)$/i))) {
        const maxField = m[1].trim();
        const selectFields = m[2].trim();
        const best = bucket.rows.reduce((winner, row) => {
          if (!winner) return row;
          return mockKqlCompare(mockKqlEvalScalar(maxField, row, bindings, cache), mockKqlEvalScalar(maxField, winner, bindings, cache), '>') ? row : winner;
        }, null);
        const selected = selectFields === '*' ? best : null;
        if (name && name.startsWith('(') && name.endsWith(')')) {
          const cols = name.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
          const picks = selectFields === '*' ? cols : mockKqlSplitTopLevel(selectFields, ',').map(s => s.trim());
          cols.forEach((col, index) => {
            const pick = picks[index] || picks[0] || col;
            groupRow[col] = selectFields === '*' ? best?.[col] : mockKqlEvalScalar(pick, best || {}, bindings, cache);
          });
        } else {
          const outName = name || maxField.trim();
          groupRow[outName] = best ? mockKqlEvalScalar(selectFields === '*' ? maxField : selectFields.split(',')[0], best, bindings, cache) : null;
        }
      }
    });
    result.push(groupRow);
  });
  return result;
}
function mockKqlSortRows(rows, clause, bindings, cache) {
  const specs = mockKqlSplitTopLevel(clause, ',').map(spec => {
    const m = spec.trim().match(/^(.+?)\s+(asc|desc)$/i);
    return { field: (m ? m[1] : spec).trim(), dir: m ? m[2].toLowerCase() : 'asc' };
  });
  return rows.slice().sort((a, b) => {
    for (const spec of specs) {
      const av = mockKqlComparable(mockKqlEvalScalar(spec.field, a, bindings, cache) ?? a[spec.field]);
      const bv = mockKqlComparable(mockKqlEvalScalar(spec.field, b, bindings, cache) ?? b[spec.field]);
      if (av === bv) continue;
      return (av > bv ? 1 : -1) * (spec.dir === 'desc' ? -1 : 1);
    }
    return 0;
  });
}
function mockKqlTopRows(rows, clause, bindings, cache) {
  const m = clause.match(/^(\d+)\s+by\s+(.+?)(?:\s+(asc|desc))?$/i);
  if (!m) return rows.slice(0, parseInt(clause, 10) || rows.length);
  const limit = parseInt(m[1], 10);
  const sortClause = `${m[2].trim()} ${m[3] || 'desc'}`;
  return mockKqlSortRows(rows, sortClause, bindings, cache).slice(0, limit);
}
function mockKqlApplyPipeline(rows, pipeline, bindings, cache, result) {
  let current = rows;
  let render = result.render || null;
  for (const clause of pipeline) {
    const lower = clause.toLowerCase();
    if (lower.startsWith('where ')) current = mockKqlApplyWhere(current, clause.slice(6).trim(), bindings, cache);
    else if (lower.startsWith('extend ')) current = mockKqlApplyExtend(current, clause.slice(7).trim(), bindings, cache);
    else if (lower.startsWith('parse ')) current = mockKqlApplyParse(current, clause.slice(6).trim(), bindings, cache);
    else if (lower.startsWith('project ')) current = mockKqlApplyProject(current, clause.slice(8).trim(), bindings, cache, false);
    else if (lower.startsWith('project-away ')) {
      const drop = new Set(mockKqlSplitTopLevel(clause.slice(13).trim(), ',').map(s => s.trim()));
      current = current.map(row => {
        const next = { ...row };
        drop.forEach(field => { delete next[field]; });
        return next;
      });
    } else if (lower.startsWith('summarize ')) current = mockKqlApplySummarize(current, clause.slice(10).trim(), bindings, cache);
    else if (lower.startsWith('join ')) current = mockKqlApplyJoin(current, clause.slice(5).trim(), bindings, cache);
    else if (lower.startsWith('order by ')) current = mockKqlSortRows(current, clause.slice(9).trim(), bindings, cache);
    else if (lower.startsWith('sort by ')) current = mockKqlSortRows(current, clause.slice(8).trim(), bindings, cache);
    else if (lower.startsWith('top ')) current = mockKqlTopRows(current, clause.slice(4).trim(), bindings, cache);
    else if (lower.startsWith('take ')) current = current.slice(0, parseInt(clause.slice(5).trim(), 10) || 0);
    else if (lower.startsWith('limit ')) current = current.slice(0, parseInt(clause.slice(6).trim(), 10) || 0);
    else if (lower === 'count') current = [{ Count: current.length }];
    else if (lower.startsWith('distinct ')) {
      const cols = mockKqlSplitTopLevel(clause.slice(9).trim(), ',').map(s => s.trim()).filter(Boolean);
      const seen = new Set();
      current = current.reduce((out, row) => {
        const picked = cols[0] === '*' ? { ...row } : Object.fromEntries(cols.map(c => [c, row[c]]));
        delete picked.__rid;
        const key = JSON.stringify(picked);
        if (!seen.has(key)) { seen.add(key); out.push(picked); }
        return out;
      }, []);
    } else if (lower.startsWith('project-rename ')) {
      const pairs = mockKqlParseAssignments(clause.slice(15).trim());
      current = current.map(row => {
        const next = { ...row };
        pairs.forEach(({ name, expr }) => { if (expr in next) { next[name] = next[expr]; delete next[expr]; } });
        return next;
      });
    }
    else if (lower.startsWith('render ')) render = { kind: clause.slice(7).trim().split(/\s+/)[0].toLowerCase() };
  }
  result.render = render;
  return current;
}
function mockKqlIsQueryLike(expr) {
  const text = mockKqlTrimParens(String(expr || '').trim());
  return /[|]/.test(text) || /^union\b/i.test(text) || /^externaldata\b/i.test(text) || /^[A-Za-z_][A-Za-z0-9_]*\s*\|/i.test(text);
}
function mockKqlEvaluate(expr, bindings = {}, cache = { bindingResults: {}, tables: mockKqlTables() }) {
  const text = mockKqlStripComments(expr);
  const localBindings = {};
  let body = text;
  while (true) {
    const m = body.match(/^\s*let\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([\s\S]*?);\s*/i);
    if (!m) break;
    localBindings[m[1]] = m[2].trim();
    body = body.slice(m[0].length);
  }
  const mergedBindings = { ...bindings, ...localBindings };
  const segments = mockKqlSplitTopLevel(body.trim(), '|').map(s => s.trim()).filter(Boolean);
  if (!segments.length) return { rows: [], cols: ['(no rows)'], render: null, source: '' };
  const sourceExpr = segments.shift();
  const initialRows = mockKqlNormalizeRows(mockKqlEvaluateSource(sourceExpr, mergedBindings, cache));
  const result = { rows: [], cols: [], render: null, source: sourceExpr };
  result.rows = mockKqlApplyPipeline(initialRows, segments, mergedBindings, cache, result);
  result.cols = result.rows.length ? Object.keys(result.rows[0]) : (initialRows.length ? Object.keys(initialRows[0]) : ['(no rows)']);
  if (!result.rows.length && initialRows.length && !segments.length) result.rows = initialRows;
  if (!result.cols.length) result.cols = ['(no rows)'];
  return result;
}

  const KNOWN_OPERATORS = ['where', 'extend', 'parse', 'project', 'project-away', 'project-rename', 'summarize', 'join', 'order by', 'sort by', 'top', 'take', 'limit', 'distinct', 'count', 'render'];

  function evaluate(query, tables, opts = {}) {
    TABLES = tables || {};
    LAB_NOW = opts.now ? new Date(opts.now) : null;
    const text = mockKqlStripComments(query);
    if (!text) return { rows: [], cols: [], render: null, source: '', error: 'Write a query first — start with a table name, for example: AuthLog | take 10' };
    // Validate the source table and each operator before running, so a typo
    // reads as a teaching message rather than an empty result.
    let body = text;
    while (true) {
      const m = body.match(/^\s*let\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([\s\S]*?);\s*/i);
      if (!m) break;
      body = body.slice(m[0].length);
    }
    const letNames = [...text.matchAll(/(?:^|;)\s*let\s+([A-Za-z_][A-Za-z0-9_]*)\s*=/gi)].map((m) => m[1]);
    const segments = mockKqlSplitTopLevel(body.trim(), '|').map((s) => s.trim()).filter(Boolean);
    const source = mockKqlTrimParens(segments[0] || '');
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(source) && !TABLES[source] && !letNames.includes(source)) {
      return { rows: [], cols: [], render: null, source, error: `Unknown table "${source}". Available tables: ${Object.keys(TABLES).sort().join(', ')}.` };
    }
    for (const clause of segments.slice(1)) {
      const lower = clause.toLowerCase();
      if (!KNOWN_OPERATORS.some((op) => lower === op || lower.startsWith(`${op} `))) {
        return { rows: [], cols: [], render: null, source, error: `Unsupported operator near "| ${clause.split(/\s+/)[0]}". This lab supports: ${KNOWN_OPERATORS.join(', ')}.` };
      }
    }
    try {
      const result = mockKqlEvaluate(text, {}, { bindingResults: {}, tables: TABLES });
      result.cols = (result.cols || []).filter((c) => !String(c).startsWith('__'));
      if (!result.rows.length && result.cols[0] === '(no rows)') result.cols = [];
      result.error = null;
      return result;
    } catch (err) {
      return { rows: [], cols: [], render: null, source, error: `Query could not run: ${err && err.message ? err.message : err}` };
    } finally {
      LAB_NOW = null;
    }
  }

  function tableColumns(tables) {
    const out = {};
    Object.keys(tables || {}).forEach((name) => {
      const seen = new Set();
      (tables[name] || []).slice(0, 200).forEach((row) => Object.keys(row || {}).forEach((c) => { if (!c.startsWith('__')) seen.add(c); }));
      out[name] = [...seen];
    });
    return out;
  }

  return { evaluate, tableColumns, splitTopLevel: mockKqlSplitTopLevel };
}());
