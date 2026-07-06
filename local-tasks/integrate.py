#!/usr/bin/env python3
"""Merge VERIFIED local-tasks fixture drafts into ui/data.js, then write md.

Deterministic glue between the goose layer and the codex layer:
  1. re-verify every present out/*.js with verify.js (never trust old state)
  2. splice passing files (minus their module.exports footer) into a
     marker-delimited section at the end of ui/data.js — idempotent, the
     section is fully rebuilt every run
  3. node --check ui/data.js; on failure restore data.js and abort
  4. rewrite INTEGRATION.md (status table) and append a QA_LOG.md entry

Run from repo root or anywhere:  python3 local-tasks/integrate.py
"""
import json, re, subprocess, sys, datetime, pathlib

LT = pathlib.Path(__file__).resolve().parent
LAB = LT.parent
DATA = LAB / "ui" / "data.js"
MARK_A = "// === local-tasks fixtures (auto-merged by integrate.py — do not hand-edit between markers) ==="
MARK_B = "// === end local-tasks fixtures ==="

manifest = json.loads((LT / "manifest.json").read_text())
now = datetime.datetime.now().astimezone().isoformat(timespec="seconds")

rows, merged_blocks, merged_consts = [], [], []
for tid in sorted(manifest):
    spec = manifest[tid]
    out = LT / spec["file"]
    exports = ", ".join(spec["exports"].keys())
    if not out.exists():
        rows.append((tid, exports, "OPEN — no verified draft"))
        continue
    v = subprocess.run(["node", str(LT / "verify.js"), tid], capture_output=True, text=True)
    if v.returncode != 0:
        rows.append((tid, exports, "FAILED re-verify — not merged"))
        continue
    body = out.read_text()
    # footer is required (by task spec) to be the last statement — cut to EOF
    idx = body.find("if (typeof module")
    if idx != -1:
        body = body[:idx]
    body = body.rstrip() + "\n"
    merged_blocks.append(f"// --- {tid}: {spec['file']} ---\n{body}")
    merged_consts.extend(spec["exports"].keys())
    rows.append((tid, exports, "MERGED into ui/data.js"))

orig = DATA.read_text()
stripped = orig.split(MARK_A)[0].rstrip() + "\n"
new = stripped + "\n" + MARK_A + "\n" + "\n".join(merged_blocks) + MARK_B + "\n"
DATA.write_text(new)

chk = subprocess.run(["node", "--check", str(DATA)], capture_output=True, text=True)
if chk.returncode != 0:
    DATA.write_text(orig)
    print(f"ABORT: merged data.js failed node --check; restored original.\n{chk.stderr}")
    sys.exit(1)

table = "\n".join(f"| {t} | `{e}` | {s} |" for t, e, s in rows)
(LT / "INTEGRATION.md").write_text(f"""# INTEGRATION — local-tasks → ui/data.js merge state

Last run: {now} (rewritten every `integrate.py` run — do not hand-edit).

Merged consts live between the two `local-tasks fixtures` markers at the
end of `ui/data.js`. The section is rebuilt from scratch each run, so
re-running after new tasks pass is always safe. Views/codex agents use
the consts directly: {", ".join(f"`{c}`" for c in merged_consts) or "(none yet)"}.

| Task | Exports | Status |
|---|---|---|
{table}

Gate: only drafts that pass `verify.js` at merge time are spliced;
result must pass `node --check` or the merge is rolled back atomically.
""")
with (LT / "QA_LOG.md").open("a") as f:
    ok = sum(1 for _, _, s in rows if s.startswith("MERGED"))
    f.write(f"## integrate.py — {now}\n- Merged {ok}/{len(rows)} task drafts into `ui/data.js` "
            f"(marker section rebuilt), `node --check` clean. Detail: `INTEGRATION.md`.\n\n")
print(f"OK: merged {len(merged_blocks)} drafts ({len(merged_consts)} consts); node --check clean.")
