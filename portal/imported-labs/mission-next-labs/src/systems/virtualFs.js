// ============================================================
//  Virtual Filesystem
// ============================================================
//  In-memory tree used by simulated shells (LinuxTerminal,
//  WindowsCmd, PowerShell). Each lab provides an initial tree
//  and the shell mutates it as the user runs commands.
//
//  Tree node shape:
//   { type:'dir',  name, children:{name:Node}, mtime, mode, owner, group }
//   { type:'file', name, content:string,       mtime, mode, owner, group, size? }
//
//  Paths are POSIX-style strings ('/var/log/apache2/access.log').
//  For Windows-style paths, use the Windows wrapper helpers.
// ============================================================

(function () {
  function normalize(path) {
    if (!path) return '/';
    let p = String(path).replace(/\\/g, '/');
    if (!p.startsWith('/')) p = '/' + p;
    // collapse ../ and ./
    const out = [];
    for (const seg of p.split('/')) {
      if (!seg || seg === '.') continue;
      if (seg === '..') out.pop();
      else out.push(seg);
    }
    return '/' + out.join('/');
  }

  function split(path) {
    const norm = normalize(path);
    if (norm === '/') return [];
    return norm.slice(1).split('/');
  }

  function dirNode(name) {
    return { type: 'dir', name, children: {}, mtime: Date.now(), mode: '0755', owner: 'root', group: 'root' };
  }
  function fileNode(name, content, opts) {
    return {
      type: 'file',
      name,
      content: String(content || ''),
      mtime: (opts && opts.mtime) || Date.now(),
      mode: (opts && opts.mode) || '0644',
      owner: (opts && opts.owner) || 'root',
      group: (opts && opts.group) || 'root',
    };
  }

  function createVirtualFs(initial) {
    const root = dirNode('');
    if (initial && typeof initial === 'object') {
      seed(root, initial);
    }

    function seed(parent, spec) {
      // spec is a plain object: keys are filenames; values are either string (file) or nested object (dir).
      // Special key '__file' marks the value as a file with explicit metadata: { __file: true, content, mode, owner, mtime }.
      // Dir specs may carry '__mode' / '__owner' / '__group' metadata keys.
      if (spec.__mode) parent.mode = spec.__mode;
      if (spec.__owner) parent.owner = spec.__owner;
      if (spec.__group) parent.group = spec.__group;
      for (const key of Object.keys(spec)) {
        if (key === '__mode' || key === '__owner' || key === '__group') continue;
        const v = spec[key];
        if (v && typeof v === 'object' && !v.__file && !Array.isArray(v)) {
          const d = dirNode(key);
          parent.children[key] = d;
          seed(d, v);
        } else if (v && typeof v === 'object' && v.__file) {
          parent.children[key] = fileNode(key, v.content, {
            mode: v.mode, owner: v.owner, group: v.group, mtime: v.mtime,
          });
        } else if (Array.isArray(v)) {
          // array shorthand: list of lines joined with \n
          parent.children[key] = fileNode(key, v.join('\n'));
        } else {
          parent.children[key] = fileNode(key, String(v == null ? '' : v));
        }
      }
    }

    function resolve(path) {
      const segs = split(path);
      let node = root;
      for (const seg of segs) {
        if (node.type !== 'dir') return null;
        node = node.children[seg];
        if (!node) return null;
      }
      return node;
    }

    function parentOf(path) {
      const segs = split(path);
      const last = segs.pop();
      let node = root;
      for (const seg of segs) {
        if (node.type !== 'dir') return { parent: null, name: last };
        node = node.children[seg];
        if (!node) return { parent: null, name: last };
      }
      return { parent: node, name: last };
    }

    return {
      _root: root,

      exists(path) { return !!resolve(path); },

      isDir(path) { const n = resolve(path); return !!(n && n.type === 'dir'); },
      isFile(path) { const n = resolve(path); return !!(n && n.type === 'file'); },

      stat(path) {
        const n = resolve(path);
        if (!n) return null;
        return {
          type: n.type, name: n.name, mode: n.mode, owner: n.owner, group: n.group, mtime: n.mtime,
          size: n.type === 'file' ? (n.content ? n.content.length : 0) : 0,
        };
      },

      list(path) {
        const n = resolve(path);
        if (!n || n.type !== 'dir') return null;
        return Object.values(n.children).map(child => ({
          name: child.name,
          type: child.type,
          mode: child.mode, owner: child.owner, group: child.group, mtime: child.mtime,
          size: child.type === 'file' ? (child.content ? child.content.length : 0) : 0,
        })).sort((a, b) => a.name.localeCompare(b.name));
      },

      read(path) {
        const n = resolve(path);
        if (!n || n.type !== 'file') return null;
        return n.content;
      },

      write(path, content, opts) {
        const { parent, name } = parentOf(path);
        if (!parent || parent.type !== 'dir' || !name) return false;
        parent.children[name] = fileNode(name, content, opts);
        parent.mtime = Date.now();
        return true;
      },

      mkdir(path, recursive) {
        const segs = split(path);
        let node = root;
        for (const seg of segs) {
          if (!node.children[seg]) {
            if (!recursive && segs.indexOf(seg) < segs.length - 1) return false;
            node.children[seg] = dirNode(seg);
          } else if (node.children[seg].type !== 'dir') {
            return false;
          }
          node = node.children[seg];
        }
        return true;
      },

      chmod(path, mode) {
        const n = resolve(path);
        if (!n) return false;
        n.mode = mode;
        return true;
      },

      rm(path) {
        const { parent, name } = parentOf(path);
        if (!parent || !name || !parent.children[name]) return false;
        delete parent.children[name];
        parent.mtime = Date.now();
        return true;
      },

      // Snapshot / restore for undo or test harnesses.
      snapshot() {
        return JSON.parse(JSON.stringify(root));
      },
      restore(snap) {
        root.children = JSON.parse(JSON.stringify(snap.children || {}));
      },
    };
  }

  Object.assign(window, {
    createVirtualFs,
    MISSION_NEXT_VFS: { createVirtualFs, normalize, split },
  });
})();
