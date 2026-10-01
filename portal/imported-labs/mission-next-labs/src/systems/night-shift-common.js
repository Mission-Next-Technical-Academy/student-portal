// Shared helpers for the Operation Night Shift Linux lab engines (sa-9, sa-4).
// Everything here is browser-only simulation: no host commands are executed.
(function () {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }
  function utf8Bytes(text) {
    const raw = unescape(encodeURIComponent(String(text == null ? '' : text)));
    const out = [];
    for (let i = 0; i < raw.length; i++) out.push(raw.charCodeAt(i));
    return out;
  }
  function sha256Bytes(input) {
    const bytes = input.slice();
    const bitLength = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    const hi = Math.floor(bitLength / 0x100000000);
    const lo = bitLength >>> 0;
    bytes.push((hi >>> 24) & 255, (hi >>> 16) & 255, (hi >>> 8) & 255, hi & 255, (lo >>> 24) & 255, (lo >>> 16) & 255, (lo >>> 8) & 255, lo & 255);
    const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const w = new Array(64);
    for (let i = 0; i < bytes.length; i += 64) {
      for (let t = 0; t < 16; t++) w[t] = (bytes[i + 4 * t] << 24) | (bytes[i + 4 * t + 1] << 16) | (bytes[i + 4 * t + 2] << 8) | bytes[i + 4 * t + 3];
      for (let t = 16; t < 64; t++) {
        const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
        const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
      }
      let [a, b, c, d, e, f, g, hh] = h;
      for (let t = 0; t < 64; t++) {
        const t1 = (hh + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[t] + w[t]) | 0;
        const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      [a, b, c, d, e, f, g, hh].forEach((value, index) => { h[index] = (h[index] + value) | 0; });
    }
    const out = [];
    h.forEach(value => out.push((value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255));
    return out;
  }
  function sha256Hex(text) {
    return sha256Bytes(utf8Bytes(text)).map(byte => byte.toString(16).padStart(2, '0')).join('');
  }
  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  function bytesToBase64(bytes) {
    let out = '';
    for (let i = 0; i < bytes.length; i += 3) {
      const n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0);
      out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (i + 1 < bytes.length ? B64[(n >> 6) & 63] : '=') + (i + 2 < bytes.length ? B64[n & 63] : '=');
    }
    return out;
  }
  function sha256Base64(text) { return bytesToBase64(sha256Bytes(utf8Bytes(text))); }
  function base64ToHex(value) {
    const bytes = [];
    const clean = String(value || '').replace(/=+$/, '');
    let bits = 0, acc = 0;
    for (const ch of clean) {
      const index = B64.indexOf(ch);
      if (index < 0) return '';
      acc = (acc << 6) | index; bits += 6;
      if (bits >= 8) { bits -= 8; bytes.push((acc >> bits) & 255); acc &= (1 << bits) - 1; }
    }
    return bytes.map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Deterministic per learner and lab: the same learner always gets the same variant.
  function pickSeed(context = {}) {
    if (context.seed) {
      const explicit = String(context.seed).toUpperCase();
      const seeds = (window.MISSION_NEXT_OPERATION_NIGHT_SHIFT && window.MISSION_NEXT_OPERATION_NIGHT_SHIFT.seeds) || ['A', 'B'];
      if (seeds.includes(explicit)) return explicit;
    }
    const text = `${context.user || 'learner'}|${context.labId || 'lab'}`;
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619) >>> 0; }
    return hash % 2 === 0 ? 'A' : 'B';
  }
  function fixtureFor(context) {
    const source = window.MISSION_NEXT_OPERATION_NIGHT_SHIFT;
    if (!source) throw new Error('Operation Night Shift fixtures are not loaded');
    return source.generate(pickSeed(context));
  }

  function hms(timestamp) { const match = /(\d{2}:\d{2}:\d{2})/.exec(String(timestamp || '')); return match ? match[1] : ''; }
  function addSeconds(timestamp, seconds) { return new Date(Date.parse(timestamp) + seconds * 1000).toISOString().replace('.000Z', 'Z'); }
  function escapeRegex(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function numberWord(value) {
    return ({ 0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten', 11: 'eleven', 12: 'twelve' })[value] || String(value);
  }
  function times(text) {
    const out = [];
    const pattern = /(^|[^\d:])(\d{2}:\d{2}:\d{2})(?![\d:])/g;
    let match;
    while ((match = pattern.exec(String(text || '')))) out.push(match[2]);
    return out;
  }
  function ipv4s(text) { return String(text || '').match(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g) || []; }
  function countMentioned(text, count) {
    return new RegExp(`(?:^|[^\\d.:])${count}(?![\\d.:])|\\b${numberWord(count)}\\b`, 'i').test(String(text || ''));
  }

  function normalizePath(env, target) {
    const vfsApi = window.MISSION_NEXT_VFS;
    const text = String(target || '');
    return vfsApi.normalize(text.startsWith('/') ? text : `${env.cwd}/${text}`);
  }

  // ---- awk subset: [pattern] [{print ...; n++}] [END {print n}] with -F ----
  function awkCommand(env, args) {
    let separator = null;
    let i = 0;
    while (i < args.length && args[i].startsWith('-')) {
      if (args[i] === '-F') separator = args[++i];
      else if (args[i].startsWith('-F')) separator = args[i].slice(2);
      i++;
    }
    const program = args[i++];
    const file = args[i];
    if (program == null) return { stdout: '', stderr: 'awk: missing program\n', exitCode: 2 };
    let data;
    if (file) {
      data = env.vfs.read(normalizePath(env, file));
      if (data == null) return { stdout: '', stderr: `awk: cannot open ${file} (No such file or directory)\n`, exitCode: 2 };
    } else if (env._stdin != null) data = env._stdin;
    else return { stdout: '', stderr: 'awk: missing input\n', exitCode: 2 };
    const REGEX = '\\/(?:[^\\/\\\\]|\\\\.)*\\/';
    const parsed = new RegExp(`^\\s*(?:(${REGEX}|\\$\\d+\\s*(?:~|==|!=)\\s*(?:${REGEX}|"[^"]*"))\\s*)?(?:\\{([^}]*)\\})?\\s*(?:END\\s*\\{([^}]*)\\})?\\s*$`).exec(program);
    if (!parsed || (!parsed[1] && parsed[2] == null && parsed[3] == null)) return { stdout: '', stderr: `awk: syntax error in program: ${program}\n`, exitCode: 2 };
    const [, patternText, actionText, endText] = parsed;
    const compileRegex = text => { try { return new RegExp(text.slice(1, -1)); } catch (_) { return null; } };
    let matches = () => true;
    if (patternText) {
      const field = /^\$(\d+)\s*(~|==|!=)\s*(.+)$/.exec(patternText);
      if (field) {
        const [, index, op, operand] = field;
        const regex = operand.startsWith('/') ? compileRegex(operand) : null;
        if (operand.startsWith('/') && !regex) return { stdout: '', stderr: 'awk: bad regular expression\n', exitCode: 2 };
        const literal = operand.startsWith('"') ? operand.slice(1, -1) : null;
        matches = fields => {
          const value = Number(index) === 0 ? fields.line : (fields[Number(index) - 1] || '');
          if (op === '~') return regex.test(value);
          return op === '==' ? value === literal : value !== literal;
        };
      } else {
        const regex = compileRegex(patternText);
        if (!regex) return { stdout: '', stderr: 'awk: bad regular expression\n', exitCode: 2 };
        matches = fields => regex.test(fields.line);
      }
    }
    const vars = {};
    let nr = 0;
    const out = [];
    const value = (token, fields) => {
      const t = token.trim();
      if (t === '$0') return fields.line;
      if (/^\$\d+$/.test(t)) return fields[Number(t.slice(1)) - 1] || '';
      if (t === 'NR') return String(nr);
      if (t === 'NF') return String(fields.length);
      if (/^".*"$/.test(t)) return t.slice(1, -1);
      return String(vars[t] || 0);
    };
    const run = (text, fields) => {
      for (const statement of text.split(';').map(part => part.trim()).filter(Boolean)) {
        const counter = /^([A-Za-z_]\w*)\+\+$/.exec(statement);
        if (counter) { vars[counter[1]] = (vars[counter[1]] || 0) + 1; continue; }
        const print = /^print(?:\s+(.*))?$/.exec(statement);
        if (!print) return false;
        out.push(print[1] ? print[1].split(',').map(part => value(part, fields)).join(' ') : fields.line);
      }
      return true;
    };
    const lines = data.split('\n');
    if (lines.length && lines[lines.length - 1] === '') lines.pop();
    for (const line of lines) {
      nr++;
      const parts = separator == null ? line.trim().split(/\s+/).filter(Boolean) : line.split(separator);
      parts.line = line;
      if (!matches(parts)) continue;
      if (actionText == null) { if (endText == null) out.push(line); continue; }
      if (!run(actionText, parts)) return { stdout: '', stderr: `awk: unsupported statement in: ${actionText}\n`, exitCode: 2 };
    }
    if (endText != null && !run(endText, Object.assign([], { line: '' }))) return { stdout: '', stderr: 'awk: unsupported END statement\n', exitCode: 2 };
    return { stdout: out.join('\n') + (out.length ? '\n' : ''), stderr: '', exitCode: 0 };
  }

  // ---- shared commands ----
  function allowedWrite(path, prefixes) {
    return prefixes.some(prefix => path === prefix.replace(/\/$/, '') || path.startsWith(prefix));
  }
  function mkdirCommand(prefixes) {
    return (env, args) => {
      const recursive = args.includes('-p');
      const targets = args.filter(arg => !arg.startsWith('-'));
      if (!targets.length) return { stdout: '', stderr: 'mkdir: missing operand\n', exitCode: 1 };
      for (const target of targets) {
        const path = normalizePath(env, target);
        if (!allowedWrite(path, prefixes)) return { stdout: '', stderr: `mkdir: cannot create directory '${target}': Permission denied\n`, exitCode: 1 };
        if (env.vfs.exists(path)) {
          if (recursive && env.vfs.isDir(path)) continue;
          return { stdout: '', stderr: `mkdir: cannot create directory '${target}': File exists\n`, exitCode: 1 };
        }
        if (!env.vfs.mkdir(path, recursive)) return { stdout: '', stderr: `mkdir: cannot create directory '${target}': No such file or directory\n`, exitCode: 1 };
      }
      return { stdout: '', stderr: '', exitCode: 0 };
    };
  }
  function sha256sumCommand(env, args) {
    const files = args.filter(arg => !arg.startsWith('-'));
    if (!files.length && env._stdin == null) return { stdout: '', stderr: 'sha256sum: missing file operand\n', exitCode: 1 };
    if (!files.length) return { stdout: `${sha256Hex(env._stdin)}  -\n`, stderr: '', exitCode: 0 };
    let stdout = '', stderr = '';
    for (const file of files) {
      const data = env.vfs.read(normalizePath(env, file));
      if (data == null) stderr += `sha256sum: ${file}: No such file or directory\n`;
      else stdout += `${sha256Hex(data)}  ${file}\n`;
    }
    return { stdout, stderr, exitCode: stderr ? 1 : 0 };
  }

  // Refuse redirects outside the analyst's own workspace so evidence cannot be rewritten.
  function redirectGuard(env, line, prefixes) {
    const bare = String(line).replace(/"[^"]*"|'[^']*'/g, '""');
    const redirect = /(>>?)\s*(\S+)\s*$/.exec(bare);
    if (!redirect) return null;
    const original = /(>>?)\s*(\S+)\s*$/.exec(String(line));
    const target = original ? original[2] : redirect[2];
    const path = normalizePath(env, target);
    if (allowedWrite(path, prefixes)) return null;
    return { stdout: '', stderr: `bash: ${target}: Permission denied\n`, exitCode: 1 };
  }

  // Run a line through the shared bash engine with lab-specific commands layered on top.
  function runWithCommands(env, line, overrides, writePrefixes) {
    const engine = window.MISSION_NEXT_BASH_ENGINE;
    const blocked = redirectGuard(env, line, writePrefixes);
    if (blocked) return blocked;
    const builtins = engine.BUILTINS;
    const saved = {};
    const names = Object.keys(overrides);
    names.forEach(name => { saved[name] = builtins[name]; builtins[name] = overrides[name]; });
    try { return engine.runLine(env, line); }
    finally { names.forEach(name => { if (saved[name] === undefined) delete builtins[name]; else builtins[name] = saved[name]; }); }
  }

  function readTail(vfs, path, count) {
    const lines = (vfs.read(path) || '').split('\n').filter(Boolean);
    return lines.slice(-count).join('\n');
  }

  window.MISSION_NEXT_NIGHT_SHIFT_COMMON = {
    sha256Hex, sha256Base64, base64ToHex, utf8Bytes, pickSeed, fixtureFor, hms, addSeconds, escapeRegex, numberWord, times, ipv4s, countMentioned,
    normalizePath, awkCommand, mkdirCommand, sha256sumCommand, runWithCommands, readTail, allowedWrite,
  };
})();
