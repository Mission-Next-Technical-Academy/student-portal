// ============================================================
//  LinuxTerminalShell  +  bashEngine
// ============================================================
//  Realistic-feeling Linux terminal that runs against a virtual
//  filesystem (window.createVirtualFs). Implements the subset of
//  bash needed by the lap-1 / lap-2 / sa-2..5 / vm install labs.
//
//  Built-ins implemented:
//    cd, pwd, ls (with -l, -a, -la, -R), cat, less (pager),
//    grep (with -i, -v, -c, -n, -E, no -P), awk '{print $N}'
//      (very small awk — print only), sort (-n, -r, -k), uniq
//      (-c, -d, -u), wc (-l, -w, -c), head (-n N), tail (-n N,
//      -F as alias for -f), cut (-d X -f N), find (very small),
//      echo, clear, history, whoami, hostname, date, uname -a,
//      nano (read-only pager), wget, dpkg -i, curl,
//      apt/apt-get (simulated package manager), sudo (transparent passthrough), systemctl (status/start/
//      enable — stubbed responses), journalctl (basic), id.
//
//  Composition:
//    pipes  '|'        chained
//    redir  '>' '>>'   write to vfs
//    chains '&&' '||'  conditional
//
//  Anything unknown returns a realistic
//  `bash: <cmd>: command not found` message.
//
//  Props:
//    vfs           virtual filesystem (window.createVirtualFs(...))
//    initialCwd    starting directory (default '/home/student')
//    user          login user (default 'student')
//    host          host name   (default 'b2b')
//    onCommand     (cmdLine, result) => void   — called after every line
//    autoFocus     boolean
// ============================================================

(function () {

  // ─── tiny argv parser respecting single quotes and double quotes ─────
  function tokenize(line) {
    const tokens = [];
    let cur = '';
    let inS = false, inD = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inS) {
        if (c === "'") { inS = false; continue; }
        cur += c;
      } else if (inD) {
        if (c === '"') { inD = false; continue; }
        cur += c;
      } else if (c === "'") inS = true;
      else if (c === '"') inD = true;
      else if (/\s/.test(c)) {
        if (cur !== '') { tokens.push(cur); cur = ''; }
      } else cur += c;
    }
    if (cur !== '') tokens.push(cur);
    return tokens;
  }

  function joinPath(cwd, p) {
    if (!p) return cwd;
    if (p.startsWith('/')) return p;
    if (p === '~') return '/home/student';
    if (p.startsWith('~/')) return '/home/student/' + p.slice(2);
    return (cwd === '/' ? '' : cwd) + '/' + p;
  }

  function normalizePath(p) {
    return window.MISSION_NEXT_VFS && window.MISSION_NEXT_VFS.normalize ? window.MISSION_NEXT_VFS.normalize(p) : p;
  }

  // ─── built-ins ────────────────────────────────────────────────────────
  function cmd_cd(env, args) {
    const target = args[0] || '/home/student';
    const next = normalizePath(joinPath(env.cwd, target));
    if (!env.vfs.exists(next)) return { stdout: '', stderr: `bash: cd: ${target}: No such file or directory\n`, exitCode: 1 };
    if (!env.vfs.isDir(next)) return { stdout: '', stderr: `bash: cd: ${target}: Not a directory\n`, exitCode: 1 };
    env.cwd = next || '/';
    return { stdout: '', stderr: '', exitCode: 0 };
  }

  function cmd_pwd(env) { return { stdout: env.cwd + '\n', stderr: '', exitCode: 0 }; }

  function modeStr(mode, type) {
    // very rough: mode like "0644" or "0755", type "dir"|"file"
    const m = mode || (type === 'dir' ? '0755' : '0644');
    const oct = String(m).slice(-3);
    const map = { '0':'---','1':'--x','2':'-w-','3':'-wx','4':'r--','5':'r-x','6':'rw-','7':'rwx' };
    return (type === 'dir' ? 'd' : '-') + (map[oct[0]] || 'r--') + (map[oct[1]] || 'r--') + (map[oct[2]] || 'r--');
  }

  function fmtMtime(mtime) {
    const d = new Date(mtime || Date.now());
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const m = months[d.getMonth()];
    const day = String(d.getDate()).padStart(2, ' ');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${m} ${day} ${hh}:${mm}`;
  }

  function cmd_ls(env, args) {
    let longFmt = false, all = false, recurse = false, dirOnly = false, target = null;
    for (const a of args) {
      if (a.startsWith('-')) {
        if (a.includes('l')) longFmt = true;
        if (a.includes('a')) all = true;
        if (a.includes('R')) recurse = true;
        if (a.includes('d')) dirOnly = true;
      } else target = a;
    }
    const path = normalizePath(joinPath(env.cwd, target || ''));
    if (!env.vfs.exists(path)) return { stdout: '', stderr: `ls: cannot access '${target || path}': No such file or directory\n`, exitCode: 2 };

    function listDir(p) {
      const entries = env.vfs.list(p);
      if (!entries) return '';
      const visible = all ? entries : entries.filter(e => !e.name.startsWith('.'));
      if (!longFmt) return visible.map(e => e.name).join('  ') + (visible.length ? '\n' : '');
      const total = visible.reduce((acc, e) => acc + Math.ceil((e.size || 0) / 1024), 0);
      const lines = visible.map(e => {
        const md = modeStr(e.mode, e.type);
        const size = String(e.size || (e.type === 'dir' ? 4096 : 0)).padStart(7, ' ');
        const date = fmtMtime(e.mtime);
        return `${md}  1 ${e.owner || 'root'} ${e.group || 'root'} ${size} ${date} ${e.name}`;
      });
      return `total ${total}\n` + lines.join('\n') + (lines.length ? '\n' : '');
    }

    if (env.vfs.isFile(path) || dirOnly) {
      const stat = env.vfs.stat(path);
      const name = dirOnly ? (target || path) : stat.name;
      if (longFmt) return { stdout: `${modeStr(stat.mode, stat.type)}  1 ${stat.owner} ${stat.group} ${stat.size || (stat.type === 'dir' ? 4096 : 0)} ${fmtMtime(stat.mtime)} ${name}\n`, stderr: '', exitCode: 0 };
      return { stdout: name + '\n', stderr: '', exitCode: 0 };
    }

    if (!recurse) return { stdout: listDir(path), stderr: '', exitCode: 0 };
    let out = `${path}:\n` + listDir(path);
    const subs = env.vfs.list(path).filter(e => e.type === 'dir');
    for (const sub of subs) {
      const subPath = (path === '/' ? '' : path) + '/' + sub.name;
      out += `\n${subPath}:\n` + listDir(subPath);
    }
    return { stdout: out, stderr: '', exitCode: 0 };
  }

  function cmd_cat(env, args) {
    if (args.length === 0) return { stdout: '', stderr: 'cat: missing operand\n', exitCode: 1 };
    let out = '';
    for (const a of args) {
      const p = normalizePath(joinPath(env.cwd, a));
      const data = env.vfs.read(p);
      if (data == null) return { stdout: out, stderr: `cat: ${a}: No such file or directory\n`, exitCode: 1 };
      out += data + (data.endsWith('\n') ? '' : '\n');
    }
    return { stdout: out, stderr: '', exitCode: 0 };
  }

  function cmd_less(env, args) {
    if (args.length === 0) return { stdout: '', stderr: 'less: missing filename\n', exitCode: 1 };
    const p = normalizePath(joinPath(env.cwd, args[0]));
    const data = env.vfs.read(p);
    if (data == null) return { stdout: '', stderr: `less: ${args[0]}: No such file or directory\n`, exitCode: 1 };
    // Signal pager mode to the UI; UI renders an overlay.
    return { stdout: '', stderr: '', exitCode: 0, pager: { name: args[0], path: p, content: data } };
  }

  function cmd_nano(env, args) {
    if (args.length === 0) return { stdout: '', stderr: 'nano: missing filename\n', exitCode: 1 };
    const p = normalizePath(joinPath(env.cwd, args[0]));
    const data = env.vfs.read(p);
    if (data == null) return { stdout: '', stderr: `nano: ${args[0]}: No such file or directory\n`, exitCode: 1 };
    return {
      stdout: '',
      stderr: '',
      exitCode: 0,
      pager: {
        name: `nano ${args[0]}`,
        path: p,
        content: data,
      },
    };
  }

  function cmd_grep(env, args) {
    let i = 0;
    const flags = { i: false, v: false, c: false, n: false, E: false };
    while (i < args.length && args[i].startsWith('-') && args[i] !== '-') {
      const f = args[i].slice(1);
      for (const ch of f) if (flags.hasOwnProperty(ch)) flags[ch] = true;
      i++;
    }
    const pattern = args[i++]; const file = args[i];
    if (!pattern) return { stdout: '', stderr: 'grep: missing pattern\n', exitCode: 2 };

    let lines, srcName;
    if (file) {
      const p = normalizePath(joinPath(env.cwd, file));
      const data = env.vfs.read(p);
      if (data == null) return { stdout: '', stderr: `grep: ${file}: No such file or directory\n`, exitCode: 2 };
      lines = data.split('\n'); srcName = file;
    } else if (env._stdin != null) {
      lines = env._stdin.split('\n');
    } else return { stdout: '', stderr: 'grep: missing file\n', exitCode: 2 };

    let re;
    try { re = new RegExp(pattern, flags.i ? 'i' : ''); }
    catch (e) {
      // fallback: treat as literal
      const lit = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      re = new RegExp(lit, flags.i ? 'i' : '');
    }
    const matched = [];
    lines.forEach((ln, idx) => {
      const hit = re.test(ln);
      if (flags.v ? !hit : hit) matched.push({ idx: idx + 1, ln });
    });
    if (flags.c) return { stdout: matched.length + '\n', stderr: '', exitCode: matched.length ? 0 : 1 };
    const out = matched.map(m => flags.n ? `${m.idx}:${m.ln}` : m.ln).filter((v, i, arr) => i < arr.length - 1 || v !== '').join('\n');
    return { stdout: out + (out ? '\n' : ''), stderr: '', exitCode: matched.length ? 0 : 1 };
  }

  function cmd_awk(env, args) {
    // very limited: awk '{print $N [, $M ...]}' [file]
    if (args.length === 0) return { stdout: '', stderr: 'awk: missing program\n', exitCode: 2 };
    const program = args[0];
    const file = args[1];
    let lines;
    if (file) {
      const p = normalizePath(joinPath(env.cwd, file));
      const data = env.vfs.read(p);
      if (data == null) return { stdout: '', stderr: `awk: cannot open ${file}\n`, exitCode: 2 };
      lines = data.split('\n');
    } else if (env._stdin != null) lines = env._stdin.split('\n');
    else return { stdout: '', stderr: 'awk: missing input\n', exitCode: 2 };

    const m = program.match(/^\{\s*print\s+(.+?)\s*\}$/);
    if (!m) {
      // Allow simple custom -F separator? Not yet. Return all fields by default print $0.
      return { stdout: lines.join('\n') + (lines.length ? '\n' : ''), stderr: '', exitCode: 0 };
    }
    const fields = m[1].split(',').map(s => s.trim());
    const out = lines.filter(Boolean).map(line => {
      const parts = line.split(/\s+/).filter(Boolean);
      return fields.map(f => {
        if (f === '$0') return line;
        const num = parseInt(f.replace('$', ''), 10);
        if (!num) return f.replace(/^"|"$/g, '');
        return parts[num - 1] || '';
      }).join(' ');
    }).join('\n');
    return { stdout: out + (out ? '\n' : ''), stderr: '', exitCode: 0 };
  }

  function cmd_sort(env, args) {
    const flags = { n: false, r: false };
    let key = null;
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a.startsWith('-k')) { key = parseInt(a.length === 2 ? args[++i] : a.slice(2), 10) - 1; continue; }
      if (a === '-n') flags.n = true;
      else if (a === '-r') flags.r = true;
      else if (a.startsWith('-')) {
        if (a.includes('n')) flags.n = true;
        if (a.includes('r')) flags.r = true;
      }
    }
    let lines;
    if (env._stdin != null) lines = env._stdin.split('\n');
    else return { stdout: '', stderr: 'sort: missing input\n', exitCode: 2 };
    const had = lines.length > 0 && lines[lines.length - 1] === '';
    if (had) lines = lines.slice(0, -1);
    function valueOf(line) {
      if (key != null) return line.trim().split(/\s+/)[key] || '';
      return line;
    }
    lines.sort((a, b) => {
      const va = valueOf(a), vb = valueOf(b);
      if (flags.n) return (parseFloat(va) || 0) - (parseFloat(vb) || 0);
      return va.localeCompare(vb);
    });
    if (flags.r) lines.reverse();
    return { stdout: lines.join('\n') + '\n', stderr: '', exitCode: 0 };
  }

  function cmd_uniq(env, args) {
    const flags = { c: false, d: false, u: false };
    for (const a of args) if (a.startsWith('-')) for (const ch of a.slice(1)) if (flags.hasOwnProperty(ch)) flags[ch] = true;
    let lines;
    if (env._stdin != null) lines = env._stdin.split('\n');
    else return { stdout: '', stderr: 'uniq: missing input\n', exitCode: 2 };
    if (lines.length && lines[lines.length - 1] === '') lines.pop();
    const groups = [];
    let last = null, count = 0;
    for (const ln of lines) {
      if (last === null || ln !== last) {
        if (last !== null) groups.push({ line: last, count });
        last = ln; count = 1;
      } else count++;
    }
    if (last !== null) groups.push({ line: last, count });
    let result = groups;
    if (flags.d) result = result.filter(g => g.count > 1);
    else if (flags.u) result = result.filter(g => g.count === 1);
    const out = result.map(g => flags.c ? `${String(g.count).padStart(7, ' ')} ${g.line}` : g.line).join('\n');
    return { stdout: out + (out ? '\n' : ''), stderr: '', exitCode: 0 };
  }

  function cmd_wc(env, args) {
    const flags = { l: false, w: false, c: false };
    let target = null;
    for (const a of args) {
      if (a.startsWith('-')) for (const ch of a.slice(1)) if (flags.hasOwnProperty(ch)) flags[ch] = true;
      else target = a;
    }
    let data;
    if (target) {
      const p = normalizePath(joinPath(env.cwd, target));
      data = env.vfs.read(p);
      if (data == null) return { stdout: '', stderr: `wc: ${target}: No such file or directory\n`, exitCode: 1 };
    } else if (env._stdin != null) data = env._stdin;
    else return { stdout: '', stderr: 'wc: missing input\n', exitCode: 2 };
    const lines = data.split('\n').length - (data.endsWith('\n') ? 1 : 0);
    const words = data.trim().split(/\s+/).filter(Boolean).length;
    const chars = data.length;
    const showAll = !flags.l && !flags.w && !flags.c;
    const parts = [];
    if (showAll || flags.l) parts.push(String(lines).padStart(7, ' '));
    if (showAll || flags.w) parts.push(String(words).padStart(7, ' '));
    if (showAll || flags.c) parts.push(String(chars).padStart(7, ' '));
    return { stdout: parts.join('') + (target ? ' ' + target : '') + '\n', stderr: '', exitCode: 0 };
  }

  function cmd_head(env, args) {
    let n = 10, target = null;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-n') { n = parseInt(args[++i], 10) || n; continue; }
      if (args[i].startsWith('-')) { const k = parseInt(args[i].slice(1), 10); if (k) n = k; continue; }
      target = args[i];
    }
    let data;
    if (target) {
      const p = normalizePath(joinPath(env.cwd, target));
      data = env.vfs.read(p);
      if (data == null) return { stdout: '', stderr: `head: ${target}: No such file or directory\n`, exitCode: 1 };
    } else if (env._stdin != null) data = env._stdin;
    else return { stdout: '', stderr: 'head: missing input\n', exitCode: 2 };
    const lines = data.split('\n');
    return { stdout: lines.slice(0, n).join('\n') + '\n', stderr: '', exitCode: 0 };
  }

  function cmd_tail(env, args) {
    let n = 10, target = null;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-n') { n = parseInt(args[++i], 10) || n; continue; }
      if (args[i] === '-F' || args[i] === '-f') continue;  // no-op in sim
      if (args[i].startsWith('-')) { const k = parseInt(args[i].slice(1), 10); if (k) n = k; continue; }
      target = args[i];
    }
    let data;
    if (target) {
      const p = normalizePath(joinPath(env.cwd, target));
      data = env.vfs.read(p);
      if (data == null) return { stdout: '', stderr: `tail: ${target}: No such file or directory\n`, exitCode: 1 };
    } else if (env._stdin != null) data = env._stdin;
    else return { stdout: '', stderr: 'tail: missing input\n', exitCode: 2 };
    const lines = data.split('\n');
    if (lines[lines.length - 1] === '') lines.pop();
    return { stdout: lines.slice(-n).join('\n') + '\n', stderr: '', exitCode: 0 };
  }

  function cmd_cut(env, args) {
    let delim = '\t', fields = null;
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '-d') { delim = args[++i]; continue; }
      if (a.startsWith('-d')) { delim = a.slice(2); continue; }
      if (a === '-f') { fields = args[++i]; continue; }
      if (a.startsWith('-f')) { fields = a.slice(2); continue; }
    }
    let data;
    if (env._stdin != null) data = env._stdin;
    else return { stdout: '', stderr: 'cut: missing input\n', exitCode: 2 };
    const fnums = (fields || '1').split(',').map(s => parseInt(s, 10) - 1).filter(n => !isNaN(n));
    const lines = data.split('\n');
    const out = lines.map(line => {
      const parts = line.split(delim);
      return fnums.map(i => parts[i] != null ? parts[i] : '').join(delim);
    });
    if (out.length && out[out.length - 1] === '') out.pop();
    return { stdout: out.join('\n') + (out.length ? '\n' : ''), stderr: '', exitCode: 0 };
  }

  function cmd_echo(env, args) { return { stdout: args.join(' ') + '\n', stderr: '', exitCode: 0 }; }
  function cmd_clear() { return { stdout: '', stderr: '', exitCode: 0, clear: true }; }
  function cmd_whoami(env) { return { stdout: env.user + '\n', stderr: '', exitCode: 0 }; }
  function cmd_hostname(env) { return { stdout: env.host + '\n', stderr: '', exitCode: 0 }; }
  function cmd_id(env) { return { stdout: `uid=1000(${env.user}) gid=1000(${env.user}) groups=1000(${env.user}),27(sudo)\n`, stderr: '', exitCode: 0 }; }
  function cmd_uname(env, args) {
    if (args.includes('-a')) return { stdout: `Linux ${env.host} 6.6.0-generic #1 SMP x86_64 GNU/Linux\n`, stderr: '', exitCode: 0 };
    return { stdout: 'Linux\n', stderr: '', exitCode: 0 };
  }
  function cmd_date() { return { stdout: new Date().toString() + '\n', stderr: '', exitCode: 0 }; }
  function cmd_history(env) {
    const h = env.history || [];
    return { stdout: h.map((l, i) => `${String(i + 1).padStart(5, ' ')}  ${l}`).join('\n') + (h.length ? '\n' : ''), stderr: '', exitCode: 0 };
  }
  function ensureDir(env, path) {
    if (!path || path === '/') return true;
    return env.vfs.mkdir(path, true);
  }
  function dirname(path) {
    const norm = normalizePath(path);
    if (norm === '/') return '/';
    const idx = norm.lastIndexOf('/');
    return idx <= 0 ? '/' : norm.slice(0, idx);
  }
  function readMarker(env, path, fallback) {
    const val = env.vfs.read(path);
    return val == null ? fallback : String(val).trim();
  }
  function writeMarker(env, path, value) {
    ensureDir(env, dirname(path));
    env.vfs.write(path, String(value) + '\n');
  }
  function cmd_wget(env, args) {
    const url = args[args.length - 1];
    if (!url) return { stdout: '', stderr: 'wget: missing URL\n', exitCode: 1 };
    const cleanUrl = String(url).replace(/^['"]|['"]$/g, '');
    const filename = cleanUrl.split('/').pop() || 'download.bin';
    const target = normalizePath(joinPath(env.cwd, filename));
    env.vfs.write(target, `downloaded from ${cleanUrl}\n`);
    return {
      stdout: [
        `--2026-04-23 09:00:00--  ${cleanUrl}`,
        'Resolving artifacts.elastic.co (artifacts.elastic.co)... 34.120.127.130',
        'Connecting to artifacts.elastic.co (artifacts.elastic.co)|34.120.127.130|:443... connected.',
        `Saving to: '${filename}'`,
        '',
        `${filename}                                100%[=================================================>]  312.0M  58.4MB/s    in 5.3s`,
        '',
        '2026-04-23 09:00:05 (58.4 MB/s) - download complete',
      ].join('\n') + '\n',
      stderr: '',
      exitCode: 0,
      downloadedFile: filename,
    };
  }
  function cmd_dpkg(env, args) {
    if (args[0] !== '-i' || !args[1]) return { stdout: '', stderr: 'dpkg: expected -i <package>\n', exitCode: 1 };
    const pkgArg = args[1];
    const pkgPath = normalizePath(joinPath(env.cwd, pkgArg));
    if (!env.vfs.exists(pkgPath)) return { stdout: '', stderr: `dpkg: error: cannot access archive '${pkgArg}': No such file or directory\n`, exitCode: 2 };
    const pkgName = String(pkgArg).split('/').pop();
    ensureDir(env, '/var/lib/dpkg');
    const statusPath = '/var/lib/dpkg/mission-next-labs-installed.txt';
    const old = env.vfs.read(statusPath) || '';
    env.vfs.write(statusPath, old + pkgName + '\n');
    return {
      stdout: [
        `Selecting previously unselected package ${pkgName.replace(/\.deb$/, '')}.`,
        '(Reading database ... 128734 files and directories currently installed.)',
        `Preparing to unpack ${pkgName} ...`,
        `Unpacking ${pkgName.replace(/\.deb$/, '')} (7.12.1) ...`,
        `Setting up ${pkgName.replace(/\.deb$/, '')} (7.12.1) ...`,
      ].join('\n') + '\n',
      stderr: '',
      exitCode: 0,
      installedPackage: pkgName,
    };
  }

  function cmd_apt(env, args) {
    const command = args.find(arg => !arg.startsWith('-')) || '';
    const packages = args.filter(arg => !arg.startsWith('-') && !['install', 'update', 'upgrade', 'list', 'search', 'remove', 'purge'].includes(arg));

    if (command === 'update') {
      return {
        stdout: [
          'Hit:1 http://deb.debian.org/debian bookworm InRelease',
          'Hit:2 http://security.debian.org/debian-security bookworm-security InRelease',
          'Reading package lists... Done',
        ].join('\n') + '\n',
        stderr: '',
        exitCode: 0,
      };
    }

    if (command === 'upgrade') {
      return {
        stdout: 'Reading package lists... Done\nBuilding dependency tree... Done\n0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.\n',
        stderr: '',
        exitCode: 0,
      };
    }

    if (command === 'install') {
      const names = packages.length ? packages : ['requested-package'];
      const lines = [
        'Reading package lists... Done',
        'Building dependency tree... Done',
        'The following NEW packages will be installed:',
        `  ${names.join(' ')}`,
        '0 upgraded, ' + names.length + ' newly installed, 0 to remove and 0 not upgraded.',
        'Setting up ' + names.join(', ') + ' (simulated) ...',
        'Processing triggers for man-db (simulated) ...',
      ];
      return { stdout: lines.join('\n') + '\n', stderr: '', exitCode: 0 };
    }

    return {
      stdout: 'apt 2.6.1 (simulated)\nUsage: apt [options] command\n',
      stderr: '',
      exitCode: 0,
    };
  }
  function cmd_curl(env, args) {
    const target = args.filter(a => !a.startsWith('-')).pop();
    if (!target) return { stdout: '', stderr: 'curl: try \'curl --help\' or \'curl --manual\' for more information\n', exitCode: 2 };
    const url = String(target).replace(/^['"]|['"]$/g, '');
    const esState = readMarker(env, '/run/services/elasticsearch.state', 'inactive');
    const kibanaState = readMarker(env, '/run/services/kibana.state', 'inactive');
    if (url.includes('localhost:9200')) {
      if (esState !== 'active') return { stdout: '', stderr: 'curl: (7) Failed to connect to localhost port 9200: Connection refused\n', exitCode: 7 };
      if (url.includes('/_cat/indices')) {
        const data = env.vfs.read('/var/lib/elasticsearch/_cat_indices.txt');
        return { stdout: (data || 'health status index uuid pri rep docs.count docs.deleted store.size pri.store.size\n'), stderr: '', exitCode: 0 };
      }
      const clusterJson = env.vfs.read('/var/lib/elasticsearch/cluster_health.json')
        || '{\n  "name": "elk-01",\n  "cluster_name": "mission-next-labs-elk",\n  "cluster_uuid": "simulated-cluster",\n  "version": { "number": "7.12.1" },\n  "tagline": "You Know, for Search"\n}\n';
      return { stdout: clusterJson, stderr: '', exitCode: 0 };
    }
    if (url.includes('localhost:5601')) {
      if (kibanaState !== 'active') return { stdout: '', stderr: 'curl: (7) Failed to connect to localhost port 5601: Connection refused\n', exitCode: 7 };
      return { stdout: '{"name":"kibana","status":"green"}\n', stderr: '', exitCode: 0 };
    }
    return { stdout: '', stderr: `curl: (6) Could not resolve host: ${url}\n`, exitCode: 6 };
  }
  function cmd_systemctl(env, args) {
    const action = args[0];
    const unit = args[1];
    if (!unit) return { stdout: '', stderr: 'Too few arguments.\n', exitCode: 1 };
    const statePath = `/run/services/${unit}.state`;
    const enabledPath = `/run/services/${unit}.enabled`;
    const state = readMarker(env, statePath, 'inactive');
    const enabled = readMarker(env, enabledPath, 'false') === 'true';
    if (action === 'status') return { stdout: `● ${unit}\n   Active: ${state}\n   Enabled: ${enabled}\n`, stderr: '', exitCode: 0, services: { [unit]: { state, enabled } } };
    if (action === 'start') {
      writeMarker(env, statePath, 'active');
      return { stdout: '', stderr: '', exitCode: 0, services: { [unit]: { state: 'active', enabled } } };
    }
    if (action === 'stop') {
      writeMarker(env, statePath, 'inactive');
      return { stdout: '', stderr: '', exitCode: 0, services: { [unit]: { state: 'inactive', enabled } } };
    }
    if (action === 'enable') {
      writeMarker(env, enabledPath, 'true');
      return { stdout: `Created symlink for ${unit}.\n`, stderr: '', exitCode: 0, services: { [unit]: { state, enabled: true } } };
    }
    if (action === 'disable') {
      writeMarker(env, enabledPath, 'false');
      return { stdout: '', stderr: '', exitCode: 0, services: { [unit]: { state, enabled: false } } };
    }
    return { stdout: '', stderr: `Unknown action: ${action}\n`, exitCode: 1 };
  }
  function cmd_journalctl(env, args) {
    // Minimal: -u <unit>
    let unit = null;
    for (let i = 0; i < args.length; i++) if (args[i] === '-u') unit = args[++i];
    const path = unit ? `/var/log/${unit}.journal` : '/var/log/syslog';
    const data = env.vfs.read(path);
    if (data == null) return { stdout: `-- No entries --\n`, stderr: '', exitCode: 0 };
    return { stdout: data + (data.endsWith('\n') ? '' : '\n'), stderr: '', exitCode: 0 };
  }
  function cmd_find(env, args) {
    // very small: find <path> -name PATTERN
    let start = '.';
    let name = null;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-name') name = args[++i];
      else if (!args[i].startsWith('-')) start = args[i];
    }
    const root = normalizePath(joinPath(env.cwd, start));
    const out = [];
    function walk(p) {
      if (!env.vfs.exists(p)) return;
      const stat = env.vfs.stat(p);
      const base = p.split('/').pop() || '';
      if (!name || matchGlob(base, name)) out.push(p);
      if (stat.type === 'dir') {
        const entries = env.vfs.list(p) || [];
        for (const e of entries) walk((p === '/' ? '' : p) + '/' + e.name);
      }
    }
    walk(root);
    return { stdout: out.join('\n') + (out.length ? '\n' : ''), stderr: '', exitCode: 0 };
  }
  function matchGlob(name, pattern) {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
    return new RegExp(`^${escaped}$`).test(name);
  }

  const BUILTINS = {
    cd: cmd_cd, pwd: cmd_pwd, ls: cmd_ls, cat: cmd_cat, less: cmd_less, nano: cmd_nano,
    grep: cmd_grep, awk: cmd_awk, sort: cmd_sort, uniq: cmd_uniq, wc: cmd_wc,
    head: cmd_head, tail: cmd_tail, cut: cmd_cut, echo: cmd_echo, clear: cmd_clear,
    whoami: cmd_whoami, hostname: cmd_hostname, id: cmd_id, uname: cmd_uname,
    date: cmd_date, history: cmd_history, wget: cmd_wget, dpkg: cmd_dpkg, apt: cmd_apt, 'apt-get': cmd_apt, curl: cmd_curl, systemctl: cmd_systemctl,
    journalctl: cmd_journalctl, find: cmd_find,
  };

  function dispatch(env, tokens) {
    if (!tokens || tokens.length === 0) return { stdout: '', stderr: '', exitCode: 0 };
    let argv = tokens.slice();
    if (argv[0] === 'sudo') argv = argv.slice(1);
    if (argv.length === 0) return { stdout: '', stderr: '', exitCode: 0 };
    const fn = BUILTINS[argv[0]];
    if (!fn) return { stdout: '', stderr: `bash: ${argv[0]}: command not found\n`, exitCode: 127 };
    try { return fn(env, argv.slice(1)); }
    catch (e) { return { stdout: '', stderr: `bash: ${argv[0]}: ${e.message}\n`, exitCode: 1 }; }
  }

  // Split a command line by '|' top-level (respect quotes).
  function splitPipes(line) {
    const segs = [];
    let cur = '';
    let inS = false, inD = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inS) { if (c === "'") inS = false; cur += c; continue; }
      if (inD) { if (c === '"') inD = false; cur += c; continue; }
      if (c === "'") { inS = true; cur += c; continue; }
      if (c === '"') { inD = true; cur += c; continue; }
      if (c === '|') { segs.push(cur.trim()); cur = ''; continue; }
      cur += c;
    }
    if (cur.trim() !== '') segs.push(cur.trim());
    return segs;
  }

  // Strip trailing redirect, return { line, redirect: { op, file } | null }
  function extractRedirect(line) {
    const m = line.match(/^(.*?)\s*(>>|>)\s*(\S+)\s*$/);
    if (!m) return { line, redirect: null };
    return { line: m[1].trim(), redirect: { op: m[2], file: m[3] } };
  }

  function runLine(env, rawLine) {
    if (!rawLine.trim()) return { stdout: '', stderr: '', exitCode: 0 };
    // No support for && / || chains right now; trivially split — easy to add later.
    const { line, redirect } = extractRedirect(rawLine);
    const segs = splitPipes(line);
    let stdin = null;
    let last = { stdout: '', stderr: '', exitCode: 0 };
    for (let i = 0; i < segs.length; i++) {
      const tokens = tokenize(segs[i]);
      env._stdin = stdin;
      const res = dispatch(env, tokens);
      env._stdin = null;
      if (res.pager) return res;            // less takes over
      if (res.clear) return res;            // clear screen
      stdin = res.stdout;
      last = res;
      if (res.exitCode !== 0 && res.stderr) break;
    }
    if (redirect) {
      const target = normalizePath(joinPath(env.cwd, redirect.file));
      const old = redirect.op === '>>' ? (env.vfs.read(target) || '') : '';
      env.vfs.write(target, old + (last.stdout || ''));
      // suppress the captured stdout when redirected
      return { ...last, stdout: '' };
    }
    return last;
  }

  Object.assign(window, { MISSION_NEXT_BASH_ENGINE: { runLine, tokenize, splitPipes, BUILTINS } });

  // ─── React component ──────────────────────────────────────────────────
  function LinuxTerminalShell(props) {
    const { vfs, initialCwd = '/home/student', user = 'student', host = 'b2b', onCommand, autoFocus = true } = props;
    const [cwd, setCwd] = React.useState(initialCwd);
    const [lines, setLines] = React.useState(() => [
      { kind: 'system', text: `Mission Next Linux terminal — ${user}@${host}` },
      { kind: 'system', text: 'Type a command and press Enter. Try: pwd or ls' },
      { kind: 'system', text: '' },
    ]);  // [{ kind, text }]
    const [input, setInput] = React.useState('');
    const [history, setHistory] = React.useState([]);
    const [histIdx, setHistIdx] = React.useState(-1);
    const [pager, setPager] = React.useState(null);
    const [running, setRunning] = React.useState(false);
    const timersRef = React.useRef([]);

    const env = React.useMemo(() => {
      const e = { vfs, cwd, user, host, history, services: {}, _stdin: null };
      Object.defineProperty(e, 'cwd', {
        get: () => cwd,
        set: (v) => { setCwd(v); },
      });
      return e;
    }, [vfs, user, host, history, cwd]);

    const inputRef = React.useRef(null);
    const scrollRef = React.useRef(null);

    React.useEffect(() => { if (autoFocus && inputRef.current) inputRef.current.focus(); }, [autoFocus]);
    React.useEffect(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [lines, pager]);

    React.useEffect(() => () => {
      timersRef.current.forEach(window.clearTimeout);
      timersRef.current = [];
    }, []);

    function append(kind, text) {
      setLines(prev => prev.concat([{ kind, text }]));
    }

    // A real shell does not paste a complete transcript into the viewport.
    // Lightweight commands return in a short burst; scanners and package/
    // audit tools have a longer first result and then emit progress lines.
    function outputTiming(command, kind, index) {
      const name = (command.trim().match(/^(?:sudo\s+)?(\S+)/i) || [,''])[1].toLowerCase();
      const profiles = {
        nmap: { first: 280, line: 105 },
        wget: { first: 420, line: 85 },
        curl: { first: 180, line: 60 },
        apt: { first: 360, line: 120 },
        'apt-get': { first: 360, line: 120 },
        dpkg: { first: 260, line: 95 },
        nikto: { first: 330, line: 115 },
        sqlmap: { first: 360, line: 125 },
        wapiti: { first: 320, line: 115 },
        openvas: { first: 500, line: 140 },
        aide: { first: 280, line: 95 },
        auditctl: { first: 170, line: 65 },
        ausearch: { first: 220, line: 75 },
        journalctl: { first: 170, line: 55 },
        logwatch: { first: 260, line: 95 },
      };
      const profile = profiles[name] || { first: 55, line: 28 };
      if (kind === 'stderr') return Math.max(35, profile.line);
      return index === 0 ? profile.first : profile.line;
    }

    function streamResult(command, result, done) {
      const output = [];
      if (result.stdout) output.push({ kind: 'stdout', text: result.stdout });
      if (result.stderr) output.push({ kind: 'stderr', text: result.stderr });
      const records = output.flatMap(({ kind, text }) => {
        // Keep blank lines, but emit one terminal line at a time. This also
        // preserves the final newline without creating an extra visible row.
        const lines = String(text).split('\n');
        if (lines.length && lines[lines.length - 1] === '') lines.pop();
        return lines.map(line => ({ kind, text: line }));
      });
      if (!records.length) { done(); return; }
      let elapsed = 0;
      records.forEach((record, index) => {
        elapsed += outputTiming(command, record.kind, index);
        const timer = window.setTimeout(() => {
          append(record.kind, record.text);
          if (index === records.length - 1) done();
        }, elapsed);
        timersRef.current.push(timer);
      });
    }

    function runUserLine(line) {
      if (running) return;
      const prompt = `${user}@${host}:${cwd === '/home/student' ? '~' : cwd}$ `;
      append('prompt', prompt + line);
      if (!line.trim()) return;
      const next = history.concat([line]).slice(-200);
      setHistory(next);
      setHistIdx(-1);

      // bash engine mutates env.cwd via setter; we run and observe
      const result = window.MISSION_NEXT_BASH_ENGINE.runLine(env, line);
      setRunning(true);
      const finish = () => {
        setRunning(false);
        if (typeof onCommand === 'function') onCommand(line, result, { cwd: env.cwd });
      };
      if (result.clear) { setLines([]); finish(); }
      else if (result.pager) { setPager(result.pager); finish(); }
      else streamResult(line, result, finish);
    }

    function onKeyDown(e) {
      if (pager || running) return;
      if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setLines([]);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        runUserLine(input);
        setInput('');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (history.length === 0) return;
        const next = histIdx < 0 ? history.length - 1 : Math.max(0, histIdx - 1);
        setHistIdx(next); setInput(history[next] || '');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (histIdx < 0) return;
        const next = histIdx + 1;
        if (next >= history.length) { setHistIdx(-1); setInput(''); }
        else { setHistIdx(next); setInput(history[next]); }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const completed = completePath(env, input);
        if (completed) setInput(completed);
      }
    }

    function exitPager() {
      setPager(null);
      // refocus input
      window.setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 0);
    }

    return (
      <div style={termStyles.root} onClick={() => inputRef.current && inputRef.current.focus()}>
        <div ref={scrollRef} style={termStyles.scroll}>
          {lines.map((ln, i) => (
              <div key={i} style={ln.kind === 'stderr' ? termStyles.lineErr : ln.kind === 'system' ? termStyles.system : termStyles.line}>
              {ln.text}
            </div>
          ))}
          {!pager && !running && (
            <div style={termStyles.inputRow}>
              <span style={termStyles.prompt}>{`${user}@${host}:${cwd === '/home/student' ? '~' : cwd}$ `}</span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                style={termStyles.input}
                disabled={running}
                spellCheck={false}
                autoComplete="off"
                aria-label="Bash command line"
              />
            </div>
          )}
        </div>
        {pager && (
          <div style={termStyles.pager}>
            <div style={termStyles.pagerBody}>
              <pre style={termStyles.pagerPre}>{pager.content}</pre>
            </div>
            <div style={termStyles.pagerFoot}>
              <span>{pager.name}</span>
              <button onClick={exitPager} style={termStyles.pagerBtn}>q (quit)</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  function completePath(env, line) {
    const m = line.match(/(\S+)$/);
    if (!m) return null;
    const tail = m[1];
    const dirPart = tail.includes('/') ? tail.slice(0, tail.lastIndexOf('/') + 1) : '';
    const namePart = tail.includes('/') ? tail.slice(tail.lastIndexOf('/') + 1) : tail;
    const dirAbs = dirPart ? (dirPart.startsWith('/') ? dirPart : (env.cwd === '/' ? '' : env.cwd) + '/' + dirPart) : env.cwd;
    const list = env.vfs.list(dirAbs);
    if (!list) return null;
    const matches = list.filter(e => e.name.startsWith(namePart));
    if (matches.length === 0) return null;
    if (matches.length === 1) {
      const insert = dirPart + matches[0].name + (matches[0].type === 'dir' ? '/' : '');
      return line.slice(0, line.length - tail.length) + insert;
    }
    return null;  // ambiguous — leave alone
  }

  const termStyles = {
    root: {
      width: '100%', height: '100%', minHeight: 360, background: '#0b0d10',
      color: '#d6d6d6', fontFamily: "'Space Mono', monospace", fontSize: 13,
      padding: '12px 14px', borderRadius: 4, overflow: 'hidden', position: 'relative',
      cursor: 'text', boxShadow: 'inset 0 0 0 1px rgba(56,189,248,0.06)',
    },
    scroll: { width: '100%', height: '100%', overflow: 'auto', whiteSpace: 'pre-wrap' },
    line: { whiteSpace: 'pre-wrap' },
    system: { whiteSpace: 'pre-wrap', color: '#7dd3fc' },
    lineErr: { whiteSpace: 'pre-wrap', color: '#fca5a5' },
    inputRow: { display: 'flex', alignItems: 'center' },
    prompt: { color: '#22c55e', whiteSpace: 'pre' },
    input: {
      flex: 1, background: 'transparent', border: 'none', outline: 'none',
      color: '#d6d6d6', fontFamily: "'Space Mono', monospace", fontSize: 13, padding: 0,
    },
    pager: {
      position: 'absolute', inset: 0, background: '#0b0d10',
      display: 'flex', flexDirection: 'column', zIndex: 5,
    },
    pagerBody: { flex: 1, overflow: 'auto', padding: '12px 14px' },
    pagerPre: { whiteSpace: 'pre-wrap', color: '#d6d6d6', fontFamily: "'Space Mono', monospace", fontSize: 13, margin: 0 },
    pagerFoot: {
      borderTop: '1px solid rgba(56,189,248,0.12)', padding: '6px 14px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      background: 'rgba(7,11,16,0.7)', color: '#94a3b8', fontSize: 12,
    },
    pagerBtn: {
      background: 'transparent', border: '1px solid #1e3a2e', color: '#22c55e',
      fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: 1, padding: '4px 10px', cursor: 'pointer',
    },
  };

  Object.assign(window, { LinuxTerminalShell });
})();
