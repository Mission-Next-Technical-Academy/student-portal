#!/usr/bin/env python3
r"""Wire goose-drafted views into ui/views.js + NAV, behind a render gate.

Usage:
  python3 local-tasks/add_view.py                # merge all out/views/*.js
  python3 local-tasks/add_view.py v11            # merge one draft

Draft contract (one file per view in local-tasks/out/views/):
  - filename: v<NN>-<workload>-<page>.js
  - content: exactly one statement `VIEWS['<workload>/<page>'] = () => \`...\`;`
  - first line: `// nav: <section label> | <nav label> | <icon emoji>`

Gate per draft (all mechanical, model claims ignored):
  1. node --check on the draft
  2. banned-pattern scan (same list as verify.js)
  3. RUNTIME RENDER in node vm: data.js consts + helper stubs loaded, the
     view function is called; must return >400 chars of HTML, containing
     no 'undefined', no unknown-helper crashes, only #/ internal hrefs
  4. splice into the marker section of views.js + NAV entry into the
     copilot marker (or matching workload marker); node --check both;
     rollback both files if anything fails
Results appended to QA_LOG.md; INTEGRATION.md untouched (fixtures only).
"""
import re, subprocess, sys, datetime, pathlib

LT = pathlib.Path(__file__).resolve().parent
LAB = LT.parent
VIEWS = LAB / "ui" / "views.js"
DATA = LAB / "ui" / "data.js"
VDIR = LT / "out" / "views"
VMARK_A = "// === local-tasks views (auto-merged by add_view.py — do not hand-edit between markers) ==="
VMARK_B = "// === end local-tasks views ==="
def navmark(workload):
    return f"// === local-tasks nav:{workload} ==="

BANNED = [
    (re.compile(r"http", re.I), "contains 'http' (no URLs)"),
    (re.compile(r"learn\.microsoft|microsoft\.com", re.I), "real Microsoft domain"),
    (re.compile(r"contoso|fabrikam|woodgrove", re.I), "Microsoft-owned fictional brand"),
    (re.compile(r"[0-9a-f]{40,}", re.I), "secret-like hex"),
    (re.compile(r"onMount"), "onMount is not allowed in local drafts"),
    (re.compile(r"document\.|window\.|fetch\(|XMLHttpRequest|localStorage"), "DOM/network/storage access not allowed in local drafts"),
]

RENDER_HARNESS = """
const fs = require('fs');
const vm = require('vm');
const ctx = {{ console, VIEWS: {{}} }};
vm.createContext(ctx);
// helper stubs identical in behavior to ui/views.js helpers
vm.runInContext(`
function esc(s) {{ return String(s ?? '').replace(/[&<>"']/g, c => ({{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}})[c]); }}
function cap(s) {{ return s.charAt(0).toUpperCase() + s.slice(1); }}
function fmtTime(iso) {{ return iso ? new Date(iso).toISOString().slice(0,16).replace('T',' ') : '—'; }}
function toast(m) {{}}
function labList(k) {{ return []; }}
function labGet(k, d) {{ return d; }}
function labSet(k, v, m) {{}}
function labPush(k, o, m) {{}}
function labRemoveAt(k, i, m) {{}}
function labToggleFlag(k, i, m) {{}}
function labTag(t, tone) {{ return '<span class="tag ' + (tone || '') + '">' + esc(t) + '</span>'; }}
function labSev(l) {{ const c = /critical|high|over/i.test(l) ? 'high' : (/medium/i.test(l) ? 'medium' : 'low'); return '<span class="sev ' + c + '">' + esc(l) + '</span>'; }}
`, ctx);
vm.runInContext(fs.readFileSync('{data}', 'utf8'), ctx);
vm.runInContext(fs.readFileSync('{draft}', 'utf8'), ctx);
const fn = ctx.VIEWS['{route}'];
if (typeof fn !== 'function') {{ console.error('draft did not register VIEWS[{route}]'); process.exit(1); }}
const html = fn();
if (typeof html !== 'string' || html.length < 400) {{ console.error('render too small: ' + (html && html.length)); process.exit(1); }}
if (/undefined/.test(html)) {{ console.error('rendered HTML contains "undefined" — bad fixture reference'); process.exit(1); }}
const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
const bad = hrefs.filter(h => !h.startsWith('#/'));
if (bad.length) {{ console.error('non-internal hrefs: ' + bad.join(', ')); process.exit(1); }}
console.log('RENDER-OK ' + html.length + ' chars, ' + hrefs.length + ' links');
"""

def fail(name, msgs):
    log(name, False, msgs)
    print(f"FAIL {name}: " + "; ".join(msgs))

def log(name, ok, msgs):
    now = datetime.datetime.now().astimezone().isoformat(timespec="seconds")
    with (LT / "QA_LOG.md").open("a") as f:
        f.write(f"## add_view {name} — {now}\n")
        f.write(f"- **{'PASS' if ok else 'FAIL'}**: " + "; ".join(msgs) + "\n\n")

def main():
    only = sys.argv[1] if len(sys.argv) > 1 else None
    drafts = sorted(VDIR.glob("v*.js")) if VDIR.exists() else []
    if only:
        drafts = [d for d in drafts if d.name.startswith(only)]
    if not drafts:
        print("no drafts found in local-tasks/out/views/"); return 1
    views_orig, data_orig = VIEWS.read_text(), DATA.read_text()
    merged = 0
    for d in drafts:
        name = d.stem
        raw = d.read_text()
        m = re.search(r"VIEWS\['([a-z0-9-]+/[a-z0-9-]+)'\]\s*=", raw)
        nav = re.match(r"//\s*nav:\s*([^|]+)\|([^|]+)\|(.+)", raw.splitlines()[0] if raw else "")
        if not m or not nav:
            fail(name, ["missing VIEWS['w/p'] assignment or '// nav: section | label | icon' first line"]); continue
        route = m.group(1)
        if subprocess.run(["node", "--check", str(d)], capture_output=True).returncode != 0:
            fail(name, ["node --check failed on draft"]); continue
        hits = [msg for rx, msg in BANNED if rx.search(raw)]
        if hits:
            fail(name, hits); continue
        harness = RENDER_HARNESS.format(data=DATA, draft=d, route=route)
        r = subprocess.run(["node", "-e", harness], capture_output=True, text=True)
        if r.returncode != 0:
            fail(name, ["render gate: " + (r.stderr.strip() or r.stdout.strip())]); continue

        already = f"VIEWS['{route}']" in VIEWS.read_text().split(VMARK_A)[0]
        vtxt = VIEWS.read_text()
        head, rest = vtxt.split(VMARK_A); body, tail = rest.split(VMARK_B)
        body = re.sub(rf"\n// --- {name}.*?(?=\n// ---|\Z)", "", body, flags=re.S)  # idempotent per-draft
        if f"VIEWS['{route}']" in head + body:
            fail(name, [f"route {route} already registered outside this draft"]); continue
        body += f"\n// --- {name} ---\n{raw.strip()}\n"
        VIEWS.write_text(head + VMARK_A + body + VMARK_B + tail)

        dtxt = DATA.read_text()
        section, label, icon = (s.strip() for s in nav.groups())
        workload = route.split("/")[0]
        MARK = navmark(workload)
        if MARK not in dtxt:
            VIEWS.write_text(views_orig)
            fail(name, [f"no NAV marker for workload '{workload}' in data.js"]); continue
        entry = f"    {{ route:'#/{route}', label:'{label}', icon:'{icon}' }},"
        if f"route:'#/{route}'" not in dtxt:
            # this workload's nav slab: from the previous marker (or NAV start) to just past ours
            idx = dtxt.index(MARK)
            prev = dtxt.rfind("// === local-tasks nav:", 0, idx)
            start = prev if prev != -1 else dtxt.index("const NAV = {")
            slab = dtxt[start: idx + len(MARK) + 1500]
            ins = ""
            if section and f"section:'{section}'" not in slab:
                ins += f"    {{ section:'{section}' }},\n"
            ins += entry + "\n"
            dtxt = dtxt[: idx + len(MARK)] + "\n" + ins.rstrip("\n") + dtxt[idx + len(MARK):]
            DATA.write_text(dtxt)

        ok = all(subprocess.run(["node", "--check", str(f)], capture_output=True).returncode == 0 for f in (VIEWS, DATA))
        if not ok:
            VIEWS.write_text(views_orig); DATA.write_text(data_orig)
            fail(name, ["post-splice node --check failed — BOTH files rolled back, run aborted"]); return 1
        log(name, True, [f"route #{route} wired: draft render gate ({r.stdout.strip()}), spliced into views.js + NAV, node --check clean"])
        print(f"PASS {name}: #{route}")
        merged += 1
        views_orig, data_orig = VIEWS.read_text(), DATA.read_text()
    print(f"merged {merged}/{len(drafts)} view drafts")
    return 0

sys.exit(main())
