/* Admin Submission Sheet — a shared instructor view of one submitted lab,
 * laid out like a printed assignment marked up in red pen
 * (SOC and Help Desk workstream specs). Each module registers a
 * definition (portal/admin-sheets/soc-mNN.js) that says, section by section,
 * what the student answered, what the answer key expects, and what to tell
 * the student when it does not match. This file turns that into:
 *
 *   header → verdict banner → legend → sections (student answer, sweep of
 *   checks, red-pen notes, a teacher note beside each section) → system
 *   rubric → decision (overall note + Approve / Return) → debug JSON.
 *
 * Teacher notes are per section (owner, 2026-10-17): each one is saved as a
 * lab_attempt_feedback row whose item_label is the section title, so the
 * student's marked lab (renderStudent) puts the note back beside the same
 * section. Notes whose label matches no section read as overall notes.
 *
 * Verdict (owner, 2026-10-17): PASS = system score ≥ pass mark and no
 * required section ✗. ◐ amber never blocks a pass. Every narrative section
 * (one with `response`) also gets an advisory "Writing mechanics" line from
 * writingMechanics() below, amber at worst.
 *
 * Presentation only: nothing here changes a score or writes to Supabase.
 * app.js keeps the Approve / Send back controls and passes them in as
 * `notesHtml`; submitGradingDecision() reads every .feedback-item on the
 * card, the per-section notes included.
 *
 * Definition shape (see the spec for a worked example):
 *   {
 *     title: 'Module 01 · PROVE IT — …',            // string or (result, ctx) => string
 *     caseId: (result, ctx) => 'CASE-… · INC-…',
 *     fixture: () => MODULE_…,                       // answer-key source, read at render time
 *     scorer: (result, ctx) => …,                    // optional re-score, exposed as ctx.scorerResult
 *     freeText: (result, ctx) => ['notes', …],       // strings searched by ctx.mentions()
 *     rubric: { labels, max, criticalLabels } | (result, ctx) => rows,
 *     displayOptions: { 'Affected user': (result, ctx) => [{ id, text }] }, // optional: maps ids in older case_display rows to labels
 *     sections: [{
 *       id, title,
 *       instructorPrompt: 'Instructor-only guidance beside the section',
 *       required: true,                              // false = advisory, never blocks PASS
 *       answer: (result, ctx) => [[label, value]],   // value: string | string[] | null (null = not recorded)
 *       response: (result, ctx) => [{ label, text }],// long student writing, shown in full
 *       evidence: { label, text, pieces: [{ name, terms }], fix },  // key-evidence group, one ✓/✗ line per piece
 *       mechanics: true,                             // false = no proofreading line under `response`
 *       collapsed: false,                            // fold the answer rows (long timelines)
 *       recordedSince: '2026-10-17',                 // optional: older attempts get the date note
 *       checks: [{
 *         label: 'Plain sentence (expected value)',
 *         expected: 'value' | (result, ctx) => 'value',
 *         when: (result, ctx) => boolean,            // optional: skip the check when false
 *         test: (result, ctx) => true | false | 'partial' | null | 0..1,
 *         given: (result, ctx) => 'what the student put',
 *         fix: 'Red-pen note…' | (result, ctx) => '…',
 *         fixPartial: …,                             // optional note for 'partial'
 *         found: true,                               // word the result as Found / Not found
 *       }],
 *     }],
 *   }
 */
const AdminSubmissionSheet = (() => {
  'use strict';

  const registry = new Map();
  const NOT_RECORDED = 'Not recorded in this attempt';
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const isBlank = (value) => value === null || value === undefined || (typeof value === 'string' && !value.trim());

  // A definition function that throws must never take the admin page down:
  // the value just reads as "not recorded" and the raw JSON is still there.
  function safe(fn, args, fallback = null) {
    if (typeof fn !== 'function') return fn === undefined ? fallback : fn;
    try {
      const value = fn(...args);
      return value === undefined ? fallback : value;
    } catch (error) {
      if (typeof console !== 'undefined' && console.warn) console.warn('AdminSubmissionSheet: definition error', error);
      return fallback;
    }
  }

  function register(labKeys, definition) {
    (Array.isArray(labKeys) ? labKeys : [labKeys]).filter(Boolean).forEach((key) => registry.set(key, definition));
    return definition;
  }

  // A definition is opt-in by lab key. Keep track checks at the definition
  // boundary so the shared renderer can serve SOC and Help Desk consistently.
  function definitionFor(row) {
    if (!row || typeof row !== 'object') return null;
    return registry.get(row.lab_key) || null;
  }

  function has(row) {
    return Boolean(definitionFor(row));
  }

  // ------------------------------------------------------- text matching

  /* Tolerant "does the student's text mention X" (owner, 2026-10-17):
   * case-insensitive, defanged indicators read as live ones
   * (203.0.113[.]45, hxxp://, [at]), and identifiers match with or without
   * separators (ws-204 = WS204 = ws_204). */
  const refang = (text) => String(text ?? '').toLowerCase()
    .replace(/\[\s*(\.|dot)\s*\]|\(\s*(\.|dot)\s*\)|\{\s*(\.|dot)\s*\}/g, '.')
    .replace(/\[\s*(@|at)\s*\]|\(\s*(@|at)\s*\)/g, '@')
    .replace(/\[\s*:\s*\]/g, ':')
    .replace(/\bhxxp/g, 'http');
  const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function matchesText(haystack, term) {
    if (isBlank(term) || isBlank(haystack)) return false;
    const text = refang(haystack);
    const needle = refang(term).trim();
    // Words and phrases: plain substring ('deni' finds denied/denies).
    if (!/[\d._:\/-]/.test(needle)) return text.includes(needle);
    // Identifiers (digits or separators): whole-token match where each
    // separator or letter/digit change may be written with or without a
    // separator, so ws-204 = WS204 = ws_204 = "ws 204" but not "news 204"
    // or LAP-4421.
    const chunks = needle.match(/[a-z]+|\d+/g);
    if (!chunks) return text.includes(needle);
    const pattern = new RegExp(`(?<![a-z0-9])${chunks.map(escapeRegExp).join('[\\s._:\\/-]{0,3}')}(?![a-z0-9])`);
    return pattern.test(text);
  }
  // At most NOTE_LIST_MAX names in a red-pen note, then "and N more".
  const NOTE_LIST_MAX = 3;
  const shortList = (names) => (names.length > NOTE_LIST_MAX + 1 ? [...names.slice(0, NOTE_LIST_MAX), `and ${names.length - NOTE_LIST_MAX} more`] : names);
  const matchesAny = (haystack, terms) => (Array.isArray(terms) ? terms : [terms]).some((term) => matchesText(haystack, term));

  // ---------------------------------------------------- writing mechanics

  /* Low-compute proofreading for written answers, run in the instructor's
   * browser (no dependency, no network; the student's text never leaves the
   * page). Advisory only: the sheet shows it as amber at worst and it never
   * blocks a pass. Tokens with digits, dots, dashes, colons, or underscores
   * (IPs, hosts, IDs, hashes, KQL) are skipped by every heuristic.
   * Returns { words, issues: [{ id, count, example, text }] }. */
  const TEXT_SPEAK = new Set(['u', 'ur', 'idk', 'lol', 'pls', 'bc', 'w/']);
  // All-caps words that are acronyms, not shouting.
  const ACRONYMS = new Set(['AD', 'AM', 'API', 'ATT', 'AV', 'AWS', 'CEO', 'CFO', 'CISA', 'CK', 'CPU', 'CSV', 'CVE', 'CVSS', 'DLL', 'DMZ', 'DNS', 'EDR', 'EOD', 'EXE', 'FN', 'FP', 'FYI', 'HR', 'HTA', 'HTML', 'HTTP', 'HTTPS', 'IAM', 'ICMP', 'ID', 'IDS', 'IOC', 'IOCS', 'IP', 'IPS', 'IR', 'IT', 'ITSM', 'JSON', 'KEV', 'KQL', 'LAN', 'LDAP', 'MDE', 'MFA', 'MITRE', 'NIST', 'NTLM', 'OK', 'OS', 'PDF', 'PII', 'PM', 'QR', 'RDP', 'SIEM', 'SLA', 'SMB', 'SMTP', 'SOAR', 'SOC', 'SQL', 'SSH', 'SSL', 'SSO', 'TCP', 'TLS', 'TN', 'TP', 'TTP', 'TTPS', 'UDP', 'UK', 'URL', 'US', 'USB', 'UTC', 'VPN', 'WAN', 'XDR', 'XSS']);
  const SKIP_TOKEN = /[\d.\-:_]/;
  const coreOf = (token) => token.replace(/^[("'“‘[\]*•]+/, '').replace(/[)"'”’,;!?.\]…]+$/, '');
  const quote = (text, max = 40) => {
    const clean = String(text).replace(/\s+/g, ' ').trim();
    return clean.length > max ? `${clean.slice(0, max).trim()}…` : clean;
  };

  function writingMechanics(input) {
    const text = String(input ?? '');
    const found = new Map();
    const note = (id, example) => {
      const entry = found.get(id) || { id, count: 0, example };
      entry.count += 1;
      found.set(id, entry);
    };
    const tokens = text.split(/\s+/).filter(Boolean);
    // Sentences end at . ! ? followed by whitespace, or at a line break; list
    // markers ("- ", "1. ", "•") are not part of the sentence.
    const sentences = text.split(/(?<=[.!?])\s+|\n+/)
      .map((sentence) => sentence.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').trim())
      .filter((sentence) => /[a-z]/i.test(sentence));

    sentences.forEach((sentence) => {
      const first = sentence.split(/\s+/)[0] || '';
      const core = coreOf(first);
      if (core && !SKIP_TOKEN.test(core) && /^[a-z]/.test(core)) note('lowercase-start', sentence);
      const words = sentence.split(/\s+/).filter((token) => /[a-z]/i.test(token));
      if (words.length > 40) note('run-on', sentence);
    });

    const last = text.trim();
    if (last) {
      const lastToken = last.split(/\s+/).pop();
      const lastCore = lastToken.replace(/[)"'”’\]]+$/, '');
      if (!/[.!?…:]$/.test(lastCore) && !SKIP_TOKEN.test(lastCore.replace(/[.!?]+$/, ''))) note('end-punctuation', last.slice(-40));
    }

    let previous = '';
    let shout = [];
    const flushShout = () => {
      if (shout.length >= 3) note('shouting', shout.join(' '));
      shout = [];
    };
    tokens.forEach((token) => {
      const core = coreOf(token);
      const skipped = !core || (SKIP_TOKEN.test(core) && core !== 'w/');
      if (skipped) { previous = ''; flushShout(); return; }
      const lower = core.toLowerCase();
      if (/^i(['’](m|ve|ll|d))?$/.test(core)) note('lowercase-i', core);
      if (TEXT_SPEAK.has(lower)) note('text-speak', core);
      if (previous && lower === previous && /^[a-z]+$/.test(lower)) note('repeated-word', `${core} ${core}`);
      previous = /^[a-z'’]+$/i.test(core) ? lower : '';
      if (/^[A-Z]{2,}$/.test(core) && !ACRONYMS.has(core)) shout.push(core);
      else flushShout();
    });
    flushShout();

    const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
    const wording = {
      'lowercase-start': (n) => `${plural(n, 'sentence starts', 'sentences start')} lowercase`,
      'end-punctuation': () => 'the last sentence has no end punctuation',
      'lowercase-i': (n) => `${plural(n, 'lowercase “i”', 'lowercase “i”s')}`,
      'repeated-word': (n) => `${plural(n, 'repeated word', 'repeated words')}`,
      'run-on': (n) => `${plural(n, 'run-on sentence', 'run-on sentences')} over 40 words`,
      'text-speak': (n) => `${plural(n, 'text-speak word', 'text-speak words')}`,
      shouting: (n) => `${plural(n, 'run', 'runs')} of all-caps words`,
    };
    const order = Object.keys(wording);
    const issues = Array.from(found.values())
      .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
      .map((issue) => ({ ...issue, example: quote(issue.example), short: wording[issue.id](issue.count), text: `${wording[issue.id](issue.count)} (e.g. '${quote(issue.example)}')` }));
    return { words: tokens.length, issues };
  }

  // ------------------------------------------------------------ evaluation

  function context(row, definition, options = {}) {
    const result = row.result && typeof row.result === 'object' ? row.result : {};
    const ctx = {
      row,
      item: options.item || null,
      rows: (options.item && Array.isArray(options.item.rows) && options.item.rows.length) ? options.item.rows : [row],
      result,
      fixture: safe(definition.fixture, []),
      scorerResult: null,
    };
    // `result.case_display` holds the ticket rows exactly as the student saw
    // them (portal/case-record.js caseRecordDisplay()). Attempts saved before
    // 2026-10-17 stored the raw option id for Affected user / device; a
    // definition's `displayOptions` ({ 'Affected user': (result, ctx) => [{ id, text }] })
    // turns such an id back into the label the student picked.
    ctx.display = (label) => {
      const rows = Array.isArray(result.case_display) ? result.case_display : [];
      const match = rows.find((entry) => Array.isArray(entry) && String(entry[0]).toLowerCase() === String(label).toLowerCase());
      if (!match) return null;
      const value = String(match[1]);
      const lookup = definition.displayOptions && Object.entries(definition.displayOptions).find(([key]) => key.toLowerCase() === String(label).toLowerCase());
      const options = lookup ? safe(lookup[1], [result, ctx], []) : null;
      if (!Array.isArray(options) || options.some((option) => option && option.text === value)) return value;
      const option = options.find((entry) => entry && entry.id === value);
      return option && option.text ? String(option.text) : value;
    };
    let textCache = null;
    ctx.text = () => {
      if (textCache === null) {
        const record = result.case_record && typeof result.case_record === 'object' ? result.case_record : {};
        const defaults = [record.notes, ...Object.values(record.handoff && typeof record.handoff === 'object' ? record.handoff : {})];
        const sources = definition.freeText ? safe(definition.freeText, [result, ctx], []) : defaults;
        textCache = (Array.isArray(sources) ? sources : [sources]).filter((value) => typeof value === 'string').join('\n').toLowerCase();
      }
      return textCache;
    };
    ctx.mentions = (term) => matchesText(ctx.text(), term);
    ctx.mentionsAny = (terms) => matchesAny(ctx.text(), terms);
    ctx.scorerResult = definition.scorer ? safe(definition.scorer, [result, ctx]) : null;
    return ctx;
  }

  function outcomeOf(value) {
    if (value === true) return 'pass';
    if (value === false) return 'fail';
    if (value === 'partial') return 'partial';
    if (typeof value === 'number' && Number.isFinite(value)) return value >= 1 ? 'pass' : value <= 0 ? 'fail' : 'partial';
    return 'missing';
  }

  function recordedNote(section, row) {
    const since = section.recordedSince;
    return since && row.completed_at && String(row.completed_at) < since ? `${NOT_RECORDED} (submitted before ${since})` : NOT_RECORDED;
  }

  function evaluateCheck(check, section, args) {
    const outcome = outcomeOf(safe(check.test, args));
    const given = safe(check.given, args);
    const fix = outcome === 'partial' ? safe(check.fixPartial, args) || safe(check.fix, args) : outcome === 'fail' ? safe(check.fix, args) : null;
    const label = String(safe(check.label, args, ''));
    return {
      kind: 'check',
      label,
      expected: safe(check.expected, args),
      outcome,
      given: isBlank(given) ? null : String(given),
      fix: isBlank(fix) ? (outcome === 'fail' || outcome === 'partial' ? `Revisit this: ${label || section.title}.` : null) : String(fix),
      found: check.found === true,
    };
  }

  /* Key-evidence group (section.evidence): one ✓/✗ line per expected piece,
   * scored together — all found = pass, some = partly there, none = fail.
   *   { label, text: (result, ctx) => string | null (default ctx.text()),
   *     pieces: [{ name, short, terms: [...] }] | (result, ctx) => [...],   // short = name in the red-pen note
   *     fix: (missingNames, result, ctx) => 'red-pen note' | false (another line already says it) } */
  function evaluateEvidence(group, section, args) {
    const ctx = args[1];
    const source = group.text ? safe(group.text, args) : ctx.text();
    const pieces = (safe(group.pieces, args, []) || []).filter((piece) => piece && piece.name);
    const label = String(safe(group.label, args, 'Key evidence named in the written answer'));
    if (source === null || source === undefined) {
      return [{ kind: 'group', label, outcome: 'missing', given: null, fix: null }];
    }
    const lines = pieces.map((piece) => ({
      kind: 'piece',
      label: piece.label || `Names ${piece.name}`,
      outcome: matchesAny(source, piece.terms && piece.terms.length ? piece.terms : [piece.name]) ? 'pass' : 'fail',
      given: null,
      fix: null,
      found: true,
    }));
    const hits = lines.filter((line) => line.outcome === 'pass').length;
    const outcome = !lines.length ? 'missing' : hits === lines.length ? 'pass' : hits ? 'partial' : 'fail';
    // Red-pen notes use each piece's short name when given and list at most
    // NOTE_LIST_MAX of them, so a note stays readable; the ✓/✗ lines above
    // still show the instructor every piece.
    const missing = shortList(pieces.filter((piece, index) => lines[index].outcome !== 'pass').map((piece) => piece.short || piece.name));
    // group.fix may return false when another line in the section already
    // carries the note (no duplicate, no generic fallback).
    const custom = outcome === 'partial' || outcome === 'fail' ? (group.fix ? safe(group.fix, [missing, ...args]) : null) : null;
    const fix = outcome === 'partial' || outcome === 'fail'
      ? (custom === false ? null : custom || `Back your decision with the evidence: your answer does not mention ${missing.join(', ')}.`)
      : null;
    return [{ kind: 'group', label, outcome, given: `${hits} of ${lines.length} found`, fix: fix ? String(fix) : null, found: true }, ...lines];
  }

  // The automatic proofreading line under every narrative section.
  function mechanicsCheck(texts) {
    const writing = texts.filter((text) => !isBlank(text)).join('\n\n');
    if (isBlank(writing)) return null;
    const { issues } = writingMechanics(writing);
    return {
      kind: 'mechanics',
      label: 'Writing mechanics: capitals, end punctuation, repeated words, run-ons, text-speak (proofreading, advisory)',
      outcome: issues.length ? 'partial' : 'pass',
      given: issues.length ? issues.map((issue) => issue.text).join('; ') : 'No proofreading issues found',
      // The sweep line above keeps the examples; the note to the student is short.
      fix: issues.length ? `Proofread: ${issues.map((issue) => issue.short).join(', ')}.` : null,
      found: false,
      advisory: true,
    };
  }

  /* Minimum-length line for a written answer, kept separate from the
   * key-evidence group. Partly there below the minimum, ✗ when empty, not
   * recorded when `text` returns null.
   *   minLengthCheck({ min, text: (result, ctx) => string | null, label, fix, fixPartial }) */
  function minLengthCheck({ min, text, label, fix, fixPartial } = {}) {
    const read = (result, ctx) => safe(text, [result, ctx]);
    return {
      label: label || `Long enough for the next analyst to pick up (at least ${min} characters)`,
      test: (result, ctx) => {
        const value = read(result, ctx);
        if (value === null) return null;
        const length = String(value).trim().length;
        return length >= min ? true : length ? 'partial' : false;
      },
      given: (result, ctx) => `${String(read(result, ctx) ?? '').trim().length} characters`,
      fix: fix || 'Write a fuller answer: what you saw, what it means, what is affected, and what should happen next.',
      fixPartial,
    };
  }

  function evaluateSection(section, ctx) {
    const args = [ctx.result, ctx];
    const required = section.required !== false;
    const response = safe(section.response, args, []) || [];
    const rows = [
      ...(section.checks || []).filter((check) => check.when === undefined || safe(check.when, args, true)).map((check) => evaluateCheck(check, section, args)),
      ...(section.evidence ? (Array.isArray(section.evidence) ? section.evidence : [section.evidence]).flatMap((group) => evaluateEvidence(group, section, args)) : []),
    ];
    if (section.mechanics !== false && Array.isArray(response) && response.length) {
      const mechanics = mechanicsCheck(response.map((entry) => entry && entry.text));
      if (mechanics) rows.push(mechanics);
    }
    // Piece lines are reported but scored through their group.
    const outcomes = rows.filter((entry) => entry.kind !== 'piece').map((entry) => entry.outcome);
    const graded = rows.filter((entry) => entry.kind !== 'piece' && entry.kind !== 'mechanics');
    const status = !graded.length && !outcomes.includes('partial') ? 'judgment'
      : outcomes.includes('fail') ? 'fail'
        : outcomes.includes('partial') ? 'partial'
          : outcomes.includes('missing') ? 'missing'
            : 'pass';
    return {
      id: section.id,
      title: section.title,
      required,
      collapsed: section.collapsed === true,
      answer: safe(section.answer, args, []),
      response,
      // Narrative = student writing (S6 spelling and any text analyzer run on these).
      narrative: section.narrative === true || (Array.isArray(response) && response.length > 0),
      checks: rows,
      status,
      notes: rows.filter((entry) => entry.outcome === 'fail' || entry.outcome === 'partial').map((entry) => entry.fix).filter(Boolean),
      notRecorded: recordedNote(section, ctx.row),
    };
  }

  function criticalFailures(result, scorerResult) {
    const candidates = [
      result && result.critical_errors,
      result && result.criticalErrors,
      result && result.criticalMisses,
      result && result.review_payload && (result.review_payload.critical_errors || result.review_payload.criticalErrors || result.review_payload.criticalMisses),
      result && result.reviewPayload && (result.reviewPayload.critical_errors || result.reviewPayload.criticalErrors || result.reviewPayload.criticalMisses),
      scorerResult && scorerResult.critical_errors,
      scorerResult && scorerResult.criticalErrors,
      scorerResult && scorerResult.criticalMisses,
      scorerResult && scorerResult.review && scorerResult.review.criticalMisses,
    ];
    return candidates.flatMap((value) => Array.isArray(value) ? value : []).filter(Boolean).map(String);
  }

  /* The system score and module-defined safety caps decide pass/return.
   * A red section remains actionable feedback but does not override a passing
   * competency score. Amber is advisory; critical failures always return. */
  function evaluate(row, options = {}) {
    const definition = definitionFor(row);
    if (!definition) return null;
    const ctx = context(row, definition, options);
    const sectionDefinitions = typeof definition.sections === 'function'
      ? safe(definition.sections, [ctx.result, ctx], []) || []
      : definition.sections || [];
    const sections = sectionDefinitions.map((section) => evaluateSection(section, ctx));
    const threshold = Number(row.pass_threshold ?? 70);
    const hasScore = row.score !== null && row.score !== undefined && row.score !== '';
    const score = hasScore ? Number(row.score) : null;
    const belowMark = hasScore && score < threshold;
    const critical = criticalFailures(ctx.result, ctx.scorerResult);
    const needsWork = sections.filter((section) => section.required && section.status === 'fail');
    const partly = sections.filter((section) => section.status === 'partial');
    const advisory = sections.filter((section) => !section.required && section.status === 'fail');
    const judgment = sections.filter((section) => section.required && (section.status === 'judgment' || section.status === 'missing'));
    const kind = critical.length || belowMark ? 'return' : hasScore ? 'pass' : 'judgment';
    return {
      definition,
      ctx,
      title: String(safe(definition.title, [ctx.result, ctx], row.lab_key)),
      caseId: safe(definition.caseId, [ctx.result, ctx]),
      sections,
      score,
      threshold,
      verdict: { kind, needsWork, partly, advisory, judgment, belowMark, critical },
    };
  }

  /* One prefilled feedback item per section that needs work (✗) or is only
   * partly there (◐, worded "To strengthen next time: …" so the instructor
   * can approve with feedback). Passing sections add nothing. */
  /* The prefilled teacher note for one section: one point reads as a
   * sentence, several as a short list, one point per line. */
  function sectionSuggestion(section) {
    if (section.status !== 'fail' && section.status !== 'partial') return '';
    const notes = section.notes.map((note) => String(note).trim()).filter(Boolean);
    const lead = section.status === 'partial' ? 'To strengthen next time:' : '';
    // A note after the "To strengthen next time:" lead reads on in lower case; standing alone it starts with a capital.
    const cap = (note) => note.charAt(0).toUpperCase() + note.slice(1);
    if (notes.length <= 1) return [lead, lead ? notes[0] || '' : cap(notes[0] || '')].filter(Boolean).join(' ');
    return [lead, ...notes.map((note) => `• ${cap(note)}`)].filter(Boolean).join('\n');
  }

  function suggestedFeedback(row, options = {}) {
    const sheet = evaluate(row, options);
    if (!sheet) return [];
    return sheet.sections
      .filter((section) => section.status === 'fail' || section.status === 'partial')
      .map((section) => ({ item_label: section.title, comment: sectionSuggestion(section) }));
  }

  /* Sent notes back onto their sections: an item belongs to the section
   * whose title equals its item_label (case and spacing ignored). Anything
   * else, including notes from before per-section notes, is an overall note.
   * → { bySection: Map(sectionId → [{ item_label, comment }]), overall: [...] } */
  function notesBySection(sections, feedback) {
    const key = (text) => String(text ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
    const ids = new Map(sections.map((section) => [key(section.title), section.id]));
    const bySection = new Map();
    const overall = [];
    (Array.isArray(feedback) ? feedback : []).filter((item) => item && !isBlank(item.comment)).forEach((item) => {
      const id = ids.get(key(item.item_label));
      if (id === undefined) overall.push(item);
      else bySection.set(id, [...(bySection.get(id) || []), item]);
    });
    return { bySection, overall };
  }

  // ---------------------------------------------------------------- rubric

  const humanize = (key) => String(key).replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^\w/, (letter) => letter.toUpperCase());

  /* The module scorer's own criteria, readable. Covers the three shapes in
   * use: a criterion list (M06–M12 `breakdown`/`criteria`), a points object
   * (M01–M05 `breakdown`, labelled/maxed by the definition), and Module 01's
   * older `simulator_performance.competencies`. */
  function rubricRows(result, rubric, ctx) {
    if (typeof rubric === 'function') return safe(rubric, [result, ctx], []) || [];
    const spec = rubric || {};
    const source = Array.isArray(result.breakdown) ? result.breakdown : result.criteria;
    if (Array.isArray(source)) {
      return source.filter((c) => c && typeof c === 'object' && c.label).map((c) => ({
        label: String(c.label),
        // M06–M11 use points/supportingEvidence; the M12 capstone uses score/evidence.
        earned: c.points ?? c.score ?? 0,
        max: c.max ?? null,
        misses: (Array.isArray(c.misses) ? c.misses : []).filter(Boolean).map(String),
        deductions: (Array.isArray(c.deductions) ? c.deductions : []).filter((d) => d && d.points).map((d) => `-${d.points} ${d.reason || ''}`.trim()),
        evidence: (Array.isArray(c.supportingEvidence) ? c.supportingEvidence : Array.isArray(c.evidence) ? c.evidence : []).filter(Boolean).map(String),
      }));
    }
    if (result.breakdown && typeof result.breakdown === 'object') {
      return Object.entries(result.breakdown).map(([key, value]) => ({
        label: (spec.labels && spec.labels[key]) || humanize(key),
        earned: value,
        max: spec.max && spec.max[key] !== undefined ? spec.max[key] : null,
        misses: [], deductions: [], evidence: [],
      }));
    }
    const competencies = result.simulator_performance && Array.isArray(result.simulator_performance.competencies) ? result.simulator_performance.competencies : [];
    return competencies.map((c) => ({
      label: String(c.label || c.id || 'Competency'),
      earned: `${c.percentage ?? 0}%`,
      max: null,
      misses: [], deductions: [],
      evidence: [`${c.completed ?? 0}/${c.required ?? 0} required actions observed`],
    }));
  }

  function rubricHtml(sheet) {
    const { result } = sheet.ctx;
    const spec = sheet.definition.rubric;
    const rows = rubricRows(result, spec, sheet.ctx);
    const feedback = (Array.isArray(result.feedback) ? result.feedback : []).filter((line) => typeof line === 'string' && line.trim());
    const criticalLabels = (spec && typeof spec === 'object' && spec.criticalLabels) || {};
    const critical = (Array.isArray(result.critical_errors) ? result.critical_errors : []).filter(Boolean).map((id) => criticalLabels[id] || humanize(id));
    if (!rows.length && !feedback.length && !critical.length) return '';
    const full = (c) => c.max !== null && Number(c.earned) >= Number(c.max);
    const details = rows.some((c) => c.misses.length || c.deductions.length || c.evidence.length) || feedback.length;
    return `<section class="ass-rubric" data-sheet-rubric aria-label="System rubric">
      <div class="flex flex-wrap items-baseline justify-between gap-2"><h4 class="text-sm font-semibold text-[#1e3a5f]">System rubric</h4><span class="text-xs text-gray-500">The automatic score is a recommendation. Your review decides.</span></div>
      ${rows.length ? `<dl class="mt-2 divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white text-sm">${rows.map((c) => `<div class="flex justify-between gap-3 px-3 py-1.5"><dt class="text-gray-700">${esc(c.label)}</dt><dd class="font-semibold tabular-nums ${c.max === null ? 'text-[#1e3a5f]' : full(c) ? 'text-green-700' : 'text-amber-700'}">${esc(c.earned)}${c.max !== null ? ` / ${esc(c.max)}` : ''}</dd></div>`).join('')}
        <div class="flex justify-between gap-3 px-3 py-1.5 bg-gray-50"><dt class="font-semibold text-gray-700">System score</dt><dd class="font-semibold tabular-nums ${sheet.score === null ? 'text-gray-500' : sheet.score >= sheet.threshold ? 'text-green-700' : 'text-red-700'}">${sheet.score === null ? 'No score' : `${esc(sheet.score)}%`} <span class="font-normal text-gray-500">/ ${esc(sheet.threshold)}% to pass</span></dd></div></dl>` : ''}
      ${critical.length ? `<p class="mt-2 text-xs text-red-800"><strong>Critical errors flagged by the scorer:</strong> ${esc(critical.join('; '))}</p>` : ''}
      ${details ? `<details class="mt-2 text-xs"><summary class="cursor-pointer font-semibold text-gray-600">Scorer's explanation</summary>
        ${rows.filter((c) => c.misses.length || c.deductions.length || c.evidence.length).map((c) => `<div class="mt-2"><p class="font-semibold text-gray-700">${esc(c.label)}</p>${c.misses.length ? `<p class="text-amber-800">Missed: ${esc(c.misses.join('; '))}</p>` : ''}${c.deductions.length ? `<p class="text-red-800">Deductions: ${esc(c.deductions.join('; '))}</p>` : ''}${c.evidence.length ? `<p class="text-gray-500">Evidence: ${esc(c.evidence.join(', '))}</p>` : ''}</div>`).join('')}
        ${feedback.length ? `<ul class="mt-2 list-disc space-y-1 pl-5 text-gray-600">${feedback.map((line) => `<li>${esc(line)}</li>`).join('')}</ul>` : ''}
      </details>` : ''}
    </section>`;
  }

  // -------------------------------------------------------------- readable

  /* Nested objects/arrays as definition lists and bullet lists, every value
   * escaped — the readable stand-in for JSON.stringify on review screens. */
  function readableHtml(value, depth = 0) {
    if (isBlank(value)) return '<span class="text-gray-400">None</span>';
    if (Array.isArray(value)) {
      if (!value.length) return '<span class="text-gray-400">None</span>';
      return `<ul class="list-disc space-y-0.5 pl-5">${value.map((entry) => `<li>${readableHtml(entry, depth + 1)}</li>`).join('')}</ul>`;
    }
    if (typeof value === 'object') {
      const entries = Object.entries(value).filter(([, entry]) => !isBlank(entry) && !(Array.isArray(entry) && !entry.length));
      if (!entries.length) return '<span class="text-gray-400">None</span>';
      if (depth > 5) return esc(entries.map(([key]) => humanize(key)).join(', '));
      return `<dl class="space-y-0.5">${entries.map(([key, entry]) => `<div><dt class="inline font-semibold text-gray-700">${esc(humanize(key))}:</dt> <dd class="inline">${typeof entry === 'object' ? `<div class="pl-3">${readableHtml(entry, depth + 1)}</div>` : esc(entry === true ? 'Yes' : entry === false ? 'No' : entry)}</dd></div>`).join('')}</dl>`;
    }
    return esc(value === true ? 'Yes' : value === false ? 'No' : value);
  }

  // ---------------------------------------------------------------- render

  const STATUS = {
    pass: { chip: 'Pass', tone: 'ass-chip--pass' },
    partial: { chip: 'Partly there', tone: 'ass-chip--partial' },
    fail: { chip: 'Needs work', tone: 'ass-chip--fail' },
    judgment: { chip: 'Judgment', tone: 'ass-chip--judgment' },
    missing: { chip: 'Not recorded', tone: 'ass-chip--judgment' },
  };
  const MARK = {
    pass: { symbol: '✓', tone: 'ass-mark--pass', word: 'Matches', foundWord: 'Found' },
    partial: { symbol: '◐', tone: 'ass-mark--partial', word: 'Partly there', foundWord: 'Partly there' },
    fail: { symbol: '✗', tone: 'ass-mark--fail', word: 'Does not match', foundWord: 'Not found' },
    missing: { symbol: '●', tone: 'ass-mark--judgment', word: NOT_RECORDED, foundWord: NOT_RECORDED },
  };

  function chipHtml(section) {
    const status = STATUS[section.status];
    const reference = !section.required && section.status === 'judgment';
    return `<span class="ass-chip ${status.tone}" data-sheet-chip="${esc(section.status)}">${reference ? 'For reference' : esc(status.chip)}${!section.required && section.status === 'fail' ? ' · advisory' : ''}</span>`;
  }

  function valueHtml(value, notRecorded) {
    if (value === null || value === undefined) return `<em class="ass-not-recorded">${esc(notRecorded)}</em>`;
    if (Array.isArray(value)) return value.length ? `<ul class="list-disc space-y-0.5 pl-5">${value.map((entry) => `<li>${esc(entry)}</li>`).join('')}</ul>` : '<span class="text-gray-500">None</span>';
    if (typeof value === 'object') return readableHtml(value);
    return isBlank(value) ? '<span class="text-gray-500">Left blank</span>' : esc(value);
  }

  function answerHtml(section) {
    const rows = (Array.isArray(section.answer) ? section.answer : []).filter((entry) => Array.isArray(entry) && entry.length >= 2);
    const responses = (Array.isArray(section.response) ? section.response : []).filter((entry) => entry && typeof entry === 'object');
    const list = rows.length ? `<dl class="ass-answer">${rows.map(([label, value]) => `<div${Array.isArray(value) ? ' class="ass-answer-wide"' : ''}><dt>${esc(label)}</dt><dd>${valueHtml(value, section.notRecorded)}</dd></div>`).join('')}</dl>` : '';
    // Student writing is first-class (LAB_ASSESSMENT_STANDARD.md): full text,
    // paragraphs kept, never folded or truncated.
    // Each narrative field is marked for post-render text analyzers
    // (addTextAnalyzer / runTextAnalyzers below): data-sheet-narrative on the
    // block, data-sheet-narrative-text on the exact student text.
    const writing = responses.map((entry, index) => `<div class="ass-response" data-sheet-response data-sheet-narrative="${esc(section.id)}:${index}" data-sheet-narrative-label="${esc(entry.label || 'Student response')}"><p class="ass-response-label">${esc(entry.label || 'Student response')}</p>${isBlank(entry.text) ? `<p class="ass-response-text text-gray-500">${entry.text === null || entry.text === undefined ? esc(section.notRecorded) : 'Not provided'}</p>` : `<p class="ass-response-text" data-sheet-narrative-text>${esc(String(entry.text).trim())}</p>`}</div>`).join('');
    if (section.collapsed && list) {
      const count = rows.reduce((n, [, value]) => n + (Array.isArray(value) ? value.length : 1), 0);
      return `<details class="ass-fold"><summary>Show ${esc(count)} recorded ${count === 1 ? 'entry' : 'entries'}</summary>${list}</details>${writing}`;
    }
    return `${list}${writing}`;
  }

  function sweepHtml(section) {
    if (!section.checks.length) {
      return `<p class="ass-sweep-empty">${section.required ? 'No automatic check for this part. Read the student’s answer above and use your judgment.' : 'Shown for reference. Nothing here is checked automatically.'}</p>`;
    }
    const judgmentLine = section.status === 'judgment' && section.required ? '<p class="ass-sweep-empty">No automatic check for the content. Read the student’s answer above and use your judgment.</p>' : '';
    return `${judgmentLine}<table class="ass-sweep"><thead><tr><th scope="col">What we looked for</th><th scope="col">Result</th></tr></thead><tbody>${section.checks.map((check) => {
      const mark = MARK[check.outcome];
      const expected = isBlank(check.expected) || check.label.includes(String(check.expected)) ? '' : `<span class="ass-expected">Answer key: ${esc(check.expected)}</span>`;
      const word = check.kind === 'mechanics' ? (check.outcome === 'pass' ? 'Reads cleanly' : 'Worth a proofread')
        : check.found ? mark.foundWord : mark.word;
      const given = check.outcome === 'missing' || (check.kind === 'mechanics' && check.outcome === 'pass') ? ''
        : check.given ? ` <span class="ass-given">${check.outcome === 'pass' || check.found || check.kind === 'mechanics' ? '' : 'Student gave: '}${esc(check.given)}</span>` : '';
      return `<tr class="ass-row--${esc(check.kind || 'check')}" data-sheet-check="${esc(check.outcome)}" data-sheet-check-kind="${esc(check.kind || 'check')}"><td>${esc(check.label)}${expected}</td><td><span class="ass-mark ${mark.tone}" aria-hidden="true">${mark.symbol}</span> <strong>${esc(word)}</strong>${given}</td></tr>`;
    }).join('')}</tbody></table>`;
  }

  /* The teacher note beside one section. Editable: a red-pen textarea,
   * prefilled from the section's red-pen notes, that submitGradingDecision()
   * saves with the section title as its label. Sent: the note(s) the
   * student received for this section. */
  function editableNoteHtml(section) {
    const id = `ass-note-${String(section.id).replace(/[^\w-]/g, '-')}`;
    return `<div class="feedback-item ass-teacher-note" data-section-note="${esc(section.id)}">
      <label class="ass-teacher-note-label" for="${esc(id)}">Teacher note on this section</label>
      <input type="hidden" data-feedback-label value="${esc(section.title)}" />
      <textarea id="${esc(id)}" data-feedback-comment rows="${section.notes.length ? 4 : 2}" class="ass-teacher-note-input" placeholder="Optional. What to fix here, and why.">${esc(sectionSuggestion(section))}</textarea>
    </div>`;
  }

  function sentNoteHtml(items, heading = 'Teacher note') {
    return `<div class="ass-teacher-note ass-teacher-note--sent" data-section-note-sent><p class="ass-teacher-note-label">${esc(heading)}</p><div class="ass-redpen">${items.map((item) => `<p>${esc(item.comment)}</p>`).join('')}</div></div>`;
  }

  /* notes: { editable } on an open review, { sent: [items] } on a decided
   * one, {} when neither (the sheet then shows only the red-pen notes). */
  function sectionHtml(section, index, notes = {}) {
    const sent = Array.isArray(notes.sent) ? notes.sent : null;
    const guidance = section.instructorPrompt ? `<div aria-label="Instructor guidance" class="ass-instructor-prompt"><strong>Instructor guidance</strong><p>${esc(section.instructorPrompt)}</p></div>` : '';
    // On an open review the red-pen notes are the textarea's prefill, so
    // they are not repeated above it.
    const redpen = !notes.editable && !sent && section.notes.length ? `<div class="ass-redpen" aria-label="Red-pen note to the student">${section.notes.map((note) => `<p>${esc(note)}</p>`).join('')}</div>` : '';
    const note = notes.editable ? editableNoteHtml(section) : sent && sent.length ? sentNoteHtml(sent, 'Teacher note sent') : '';
    const side = `${guidance}${redpen}${note}`;
    return `<li class="ass-section ass-section--${esc(section.status)}" data-sheet-section="${esc(section.id)}" data-sheet-status="${esc(section.status)}">
      <div class="ass-section-head"><h4><span class="ass-section-number">${index + 1}.</span> ${esc(section.title)}${section.required ? '' : ' <span class="ass-optional">(advisory)</span>'}</h4>${chipHtml(section)}</div>
      <div class="ass-section-body">
        <div class="ass-section-main">${answerHtml(section)}${sweepHtml(section)}</div>
        ${side ? `<aside class="ass-section-side">${side}</aside>` : ''}
      </div>
    </li>`;
  }

  function verdictHtml(sheet) {
    const { kind, needsWork, partly, advisory, judgment, belowMark, critical } = sheet.verdict;
    const n = needsWork.length;
    const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;
    const names = (list) => list.map((section) => section.title).join(', ');
    const scoreLine = sheet.score === null ? 'The system did not record a score.' : `System score ${sheet.score}% against a ${sheet.threshold}% pass mark.`;
    const heading = kind === 'pass' ? (n ? `Recommend PASS — with corrections (${plural(n, 'section')} to fix)` : 'Recommend PASS')
      : kind === 'judgment' ? 'Instructor judgment needed'
        : critical.length ? 'Recommend RETURN — a critical safety issue was flagged'
          : n ? `Recommend RETURN — ${plural(n, 'section')} need${n === 1 ? 's' : ''} work` : 'Recommend RETURN — score is below the pass mark';
    const detail = [
      kind === 'pass' ? `${scoreLine} ${needsWork.length ? 'Corrections are prefilled in the teacher note beside each section.' : 'No critical failure was flagged.'}` : '',
      kind === 'judgment' ? `${scoreLine} No required section is marked ✗; decide from the sheet.` : '',
      kind === 'return' ? `${n ? `Needs work: ${names(needsWork)}. ` : ''}${scoreLine}` : '',
      critical.length ? `Critical failure flagged: ${critical.join('; ')}.` : '',
      partly.length ? `Partly there (does not block a pass; notes are prefilled beside each section): ${names(partly)}.` : '',
      advisory.length ? `Advisory notes: ${names(advisory)}.` : '',
      judgment.length ? `Read and judge: ${names(judgment)}.` : '',
    ].filter(Boolean).join(' ');
    return `<div class="ass-verdict ass-verdict--${kind}" data-sheet-verdict="${kind}" role="status">
      <p class="ass-verdict-title">${esc(heading)}</p>
      <p class="ass-verdict-detail">${esc(detail)}</p>
      <p class="ass-verdict-final">This is a recommendation. Your decision below is final.</p>
    </div>`;
  }

  function headerHtml(sheet, options) {
    const { row } = sheet.ctx;
    const attempt = row.attempt && row.attempt.number ? `Attempt ${row.attempt.number} of ${row.attempt.of}` : '';
    const when = (value) => (value ? new Date(value).toLocaleString() : '—');
    const facts = [
      ['Student', row.student_id || '—'],
      ['Case', sheet.caseId || '—'],
      ['Attempt', attempt || '—'],
      ['Submitted', when(row.completed_at)],
      ...(options.readOnly && row.reviewed_at ? [['Reviewed', when(row.reviewed_at)]] : []),
      ['System score', sheet.score === null ? 'No score' : `${sheet.score}% (pass mark ${sheet.threshold}%)`],
    ];
    return `<header class="ass-header">
      <p class="ass-eyebrow">Submission sheet</p>
      <h3 class="ass-title">${esc(sheet.title)}</h3>
      <dl class="ass-facts">${facts.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>
    </header>`;
  }

  const LEGEND = `<details class="ass-legend" data-sheet-legend open><summary>How to read this sheet</summary>
    <p><span class="ass-mark ass-mark--pass">✓</span> green = matches the answer key · <span class="ass-mark ass-mark--partial">◐</span> amber = partly there, never blocks a pass, the note says how to strengthen it · <span class="ass-mark ass-mark--fail">✗</span> red = does not match, the red-pen note says what to fix · <span class="ass-mark ass-mark--judgment">●</span> grey = read it and use your judgment. Answer-key values are shown to you only, never to the student.</p>
  </details>`;

  // Decided attempt: section notes sit beside their sections; this lists the
  // rest (overall notes, and every note from before per-section notes).
  function sentFeedbackHtml(sentFeedback, overall) {
    if (!Array.isArray(sentFeedback)) return '';
    const body = !sentFeedback.length ? '<p class="mt-1 text-sm text-gray-500">No written feedback was sent with this decision.</p>'
      : overall.length ? `<ul class="mt-2 space-y-1.5 text-sm">${overall.map((item) => `<li class="ass-sent-item">${item.item_label ? `<strong>${esc(item.item_label)}:</strong> ` : ''}${esc(item.comment || '')}</li>`).join('')}</ul>`
        : '<p class="mt-1 text-sm text-gray-500">Every note was sent on a section; see the teacher note beside each one.</p>';
    return `<section class="ass-notes" data-sheet-sent-feedback aria-label="Feedback sent to the student">
      <h4 class="text-sm font-semibold text-[#1e3a5f]">Teacher notes sent to the student</h4>
      ${body}
    </section>`;
  }

  function debugHtml(row) {
    const json = (() => { try { return JSON.stringify(row.result || {}, null, 2); } catch { return '{}'; } })();
    return `<details class="ass-debug" data-sheet-debug><summary>Technical record (for debugging)</summary><pre>${esc(json)}</pre></details>`;
  }

  /* render(row, { item, readOnly, sentFeedback, notesHtml })
   *   item         — the grouped grading item (item.lead === row, item.rows = siblings)
   *   readOnly     — decided attempt: show sentFeedback instead of notesHtml
   *   sentFeedback — [{ item_label, comment }] actually written to lab_attempt_feedback
   *   notesHtml    — app.js's overall note + decision buttons (trusted markup);
   *                  when given, every section also gets an editable teacher note
   * Returns '' when no definition is registered for the row. */
  function render(row, options = {}) {
    const sheet = evaluate(row, options);
    if (!sheet) return '';
    const editable = !options.readOnly && Boolean(options.notesHtml);
    const sent = options.readOnly && Array.isArray(options.sentFeedback) ? notesBySection(sheet.sections, options.sentFeedback) : null;
    const notesFor = (section) => (editable ? { editable: true } : sent ? { sent: sent.bySection.get(section.id) || [] } : {});
    return `<section class="ass-sheet ass-sheet--${sheet.verdict.kind}" data-submission-sheet="${esc(row.lab_key)}" aria-label="Submission sheet">
      ${headerHtml(sheet, options)}
      ${verdictHtml(sheet)}
      ${LEGEND}
      <ol class="ass-sections">${sheet.sections.map((section, index) => sectionHtml(section, index, notesFor(section))).join('')}</ol>
      ${rubricHtml(sheet)}
      ${options.readOnly ? sentFeedbackHtml(options.sentFeedback, sent ? sent.overall : []) : (editable ? `<section class="ass-notes" data-sheet-notes aria-label="Decision"><h4 class="text-sm font-semibold text-[#1e3a5f]">Your decision</h4><p class="mt-0.5 mb-2 text-xs text-gray-500">The teacher note beside each section goes to the student with that section. Sections that need work are prefilled; edit or clear them before you decide. Add an overall note here if you want one.</p>${options.notesHtml}</section>` : '')}
      ${debugHtml(row)}
    </section>`;
  }

  // ------------------------------------------------------- student view

  /* The student's own marked lab: their answers section by section, how each
   * section came out, and the teacher note on that section. Never shows the
   * answer key, the automatic checks, instructor guidance, or raw JSON:
   * answer rows labelled as the key or the expected value are dropped. */
  const STUDENT_STATUS = {
    pass: 'Pass',
    partial: 'Partly there',
    fail: 'Needs work',
    judgment: 'Read by your instructor',
    missing: 'Read by your instructor',
  };
  const KEY_ROW = /\bkey\b|expect|scenario reference|answer key/i;

  function studentSectionHtml(section, index, notes) {
    const studentSection = {
      ...section,
      answer: (Array.isArray(section.answer) ? section.answer : []).filter((entry) => Array.isArray(entry) && !KEY_ROW.test(String(entry[0]))),
      collapsed: section.collapsed,
    };
    const advisory = !section.required && section.status === 'fail';
    const chip = `<span class="ass-chip ${STATUS[section.status].tone}" data-sheet-chip="${esc(section.status)}">${esc(advisory ? 'Worth another look' : STUDENT_STATUS[section.status])}</span>`;
    const body = answerHtml(studentSection) || '<p class="ass-student-empty">Nothing was recorded for this part.</p>';
    return `<li class="ass-section ass-section--${esc(section.status)}" data-sheet-section="${esc(section.id)}" data-sheet-status="${esc(section.status)}">
      <div class="ass-section-head"><h4><span class="ass-section-number">${index + 1}.</span> ${esc(section.title)}</h4>${chip}</div>
      <div class="ass-section-body">
        <div class="ass-section-main">${body}</div>
        ${notes.length ? `<aside class="ass-section-side">${sentNoteHtml(notes, 'Your instructor’s note')}</aside>` : ''}
      </div>
    </li>`;
  }

  /* renderStudent(row, { feedback })
   *   row      — the student's own lab_attempts row (score, pass_threshold,
   *              result, completed_at, reviewed_at, redo_requested)
   *   feedback — [{ item_label, comment }] sent with the instructor's decision
   * Returns '' when no definition is registered for the row. */
  function renderStudent(row, options = {}) {
    const sheet = evaluate(row, options);
    if (!sheet) return '';
    const { bySection, overall } = notesBySection(sheet.sections, options.feedback);
    const when = (value) => (value ? new Date(value).toLocaleString() : '—');
    const decision = !row.reviewed_at ? 'Waiting for your instructor' : row.redo_requested ? 'Returned for revision' : 'Approved';
    const facts = [
      ['Result', decision],
      ['Score', sheet.score === null ? 'No score' : `${sheet.score}% (pass mark ${sheet.threshold}%)`],
      ['Submitted', when(row.completed_at)],
      ['Reviewed', when(row.reviewed_at)],
    ];
    const rubric = rubricRows(sheet.ctx.result, sheet.definition.rubric, sheet.ctx);
    const full = (c) => c.max !== null && Number(c.earned) >= Number(c.max);
    return `<section class="ass-sheet ass-sheet--student ass-sheet--${row.redo_requested ? 'return' : 'pass'}" data-student-sheet="${esc(row.lab_key)}" aria-label="Your marked lab">
      <header class="ass-header">
        <p class="ass-eyebrow">Your marked lab</p>
        <h3 class="ass-title">${esc(sheet.title)}</h3>
        <dl class="ass-facts">${facts.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>
      </header>
      ${overall.length ? `<section class="ass-notes ass-notes--top" data-student-overall-notes><h4 class="text-sm font-semibold text-[#1e3a5f]">Notes from your instructor</h4><ul class="mt-2 space-y-1.5 text-sm">${overall.map((item) => `<li class="ass-sent-item">${item.item_label ? `<strong>${esc(item.item_label)}:</strong> ` : ''}${esc(item.comment || '')}</li>`).join('')}</ul></section>` : ''}
      <p class="ass-student-legend">Each part of your lab is below with how it went. Where your instructor left a note on a part, it is beside that part.</p>
      <ol class="ass-sections">${sheet.sections.map((section, index) => studentSectionHtml(section, index, bySection.get(section.id) || [])).join('')}</ol>
      ${rubric.length ? `<section class="ass-rubric" data-student-rubric aria-label="How your score was made up"><h4 class="text-sm font-semibold text-[#1e3a5f]">How your score was made up</h4><dl class="mt-2 divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white text-sm">${rubric.map((c) => `<div class="flex justify-between gap-3 px-3 py-1.5"><dt class="text-gray-700">${esc(c.label)}</dt><dd class="font-semibold tabular-nums ${c.max === null ? 'text-[#1e3a5f]' : full(c) ? 'text-green-700' : 'text-amber-700'}">${esc(c.earned)}${c.max !== null ? ` / ${esc(c.max)}` : ''}</dd></div>`).join('')}</dl></section>` : ''}
    </section>`;
  }

  // ------------------------------------------------- narrative analyzers

  /* Every narrative field on a sheet, without the DOM: one entry per
   * `response` item of every section (work notes, handoff, reports,
   * rationale, resolution notes, verdict reasoning…).
   * → [{ key: 'notes:0', sectionId, sectionTitle, label, text }] */
  function narrativeFields(row, options = {}) {
    const sheet = evaluate(row, options);
    if (!sheet) return [];
    return sheet.sections.filter((section) => section.narrative).flatMap((section) => (section.response || [])
      .filter((entry) => entry && typeof entry === 'object')
      .map((entry, index) => ({ key: `${section.id}:${index}`, sectionId: section.id, sectionTitle: section.title, label: entry.label || 'Student response', text: typeof entry.text === 'string' ? entry.text.trim() : null })));
  }

  /* Post-render hook for text analyzers (S6 spelling registers one). After
   * the admin view is in the DOM, app.js calls runTextAnalyzers(root); each
   * analyzer is awaited once per narrative field that has text:
   *
   *   AdminSubmissionSheet.addTextAnalyzer(async ({ text, key, label, sectionId, node, textNode, appendLine, underline }) => {
   *     appendLine({ label: 'Spelling (advisory)', outcome: 'partial', given: '2 words: teh → the; …' });
   *     underline(['teh', 'recieved'], 'Possible misspelling');
   *   });
   *
   * appendLine adds one row to that section's sweep table, advisory only
   * (outcome 'pass' or 'partial'; anything else reads as 'partial').
   * underline wraps whole-word matches in the student's text in
   * <mark class="ass-underline">. Both build DOM nodes, never innerHTML, so
   * student text stays escaped. A failing analyzer is logged and skipped. */
  const analyzers = [];
  function addTextAnalyzer(fn) {
    if (typeof fn === 'function' && !analyzers.includes(fn)) analyzers.push(fn);
    return fn;
  }

  function appendSweepLine(node, { label, outcome, given } = {}) {
    const doc = node.ownerDocument;
    const section = node.closest('[data-sheet-section]');
    if (!section || !doc) return null;
    let body = section.querySelector('.ass-sweep tbody');
    if (!body) {
      const table = doc.createElement('table');
      table.className = 'ass-sweep';
      body = doc.createElement('tbody');
      table.appendChild(body);
      (section.querySelector('.ass-section-main') || section).appendChild(table);
    }
    const kind = outcome === 'pass' ? 'pass' : 'partial';
    const mark = MARK[kind];
    const tr = doc.createElement('tr');
    tr.className = 'ass-row--analyzer';
    tr.setAttribute('data-sheet-check', kind);
    tr.setAttribute('data-sheet-check-kind', 'analyzer');
    const what = doc.createElement('td');
    what.textContent = String(label || 'Text check (advisory)');
    const res = doc.createElement('td');
    const symbol = doc.createElement('span');
    symbol.className = `ass-mark ${mark.tone}`;
    symbol.setAttribute('aria-hidden', 'true');
    symbol.textContent = mark.symbol;
    const word = doc.createElement('strong');
    word.textContent = kind === 'pass' ? 'Reads cleanly' : 'Worth a proofread';
    res.append(symbol, ' ', word);
    if (!isBlank(given)) {
      const detail = doc.createElement('span');
      detail.className = 'ass-given';
      detail.textContent = String(given);
      res.appendChild(detail);
    }
    tr.append(what, res);
    body.appendChild(tr);
    return tr;
  }

  function underlineWords(textNode, words, title) {
    const list = (words || []).map((word) => String(word || '').trim()).filter(Boolean);
    if (!textNode || !list.length) return 0;
    const doc = textNode.ownerDocument;
    const pattern = new RegExp(`(^|[^\\p{L}\\p{N}_'’])(${list.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?=$|[^\\p{L}\\p{N}_'’])`, 'giu');
    let count = 0;
    Array.from(textNode.childNodes).forEach((child) => {
      if (child.nodeType !== 3) return; // text nodes only; earlier marks stay as they are
      const text = child.nodeValue;
      const parts = [];
      let last = 0;
      text.replace(pattern, (match, lead, word, offset) => {
        const start = offset + lead.length;
        parts.push(doc.createTextNode(text.slice(last, start)));
        const mark = doc.createElement('mark');
        mark.className = 'ass-underline';
        if (title) mark.title = String(title);
        mark.textContent = word;
        parts.push(mark);
        last = start + word.length;
        count += 1;
        return match;
      });
      if (!parts.length) return;
      parts.push(doc.createTextNode(text.slice(last)));
      child.replaceWith(...parts);
    });
    return count;
  }

  async function runTextAnalyzers(root) {
    if (!analyzers.length || !root || typeof root.querySelectorAll !== 'function') return 0;
    let ran = 0;
    for (const node of Array.from(root.querySelectorAll('[data-sheet-narrative]'))) {
      if (node.getAttribute('data-sheet-analyzed') === 'true') continue;
      node.setAttribute('data-sheet-analyzed', 'true');
      const textNode = node.querySelector('[data-sheet-narrative-text]');
      if (!textNode) continue;
      const [sectionId] = String(node.getAttribute('data-sheet-narrative')).split(':');
      const field = {
        key: node.getAttribute('data-sheet-narrative'),
        sectionId,
        label: node.getAttribute('data-sheet-narrative-label') || '',
        text: textNode.textContent,
        node,
        textNode,
        appendLine: (line) => appendSweepLine(node, line),
        underline: (words, title) => underlineWords(textNode, words, title),
      };
      for (const analyzer of analyzers) {
        try { await analyzer(field); ran += 1; } catch (error) {
          if (typeof console !== 'undefined' && console.warn) console.warn('AdminSubmissionSheet: text analyzer failed', error);
        }
      }
    }
    return ran;
  }

  return Object.freeze({ register, has, render, renderStudent, evaluate, suggestedFeedback, notesBySection, readableHtml, rubricRows, matchesText, matchesAny, writingMechanics, minLengthCheck, narrativeFields, addTextAnalyzer, runTextAnalyzers, NOT_RECORDED, _registry: registry, _analyzers: analyzers });
})();
