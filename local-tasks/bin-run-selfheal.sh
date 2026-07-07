#!/bin/bash
# Self-healing view closer: boolean gates drive strategy escalation.
#   S1: goose writes ONLY the study-note prose (tiny task, 2 tries, gated)
#   S2: compile_view.py assembles the full view from spec (+prose or the
#       flagged fallback) and pushes it through the add_view.py gate
# A task can only end PASS (committed) or ABORT (rollback = protect ui/).
# Usage: local-tasks/bin-run-selfheal.sh v12 v13 ...
set -u
LAB="$(cd "$(dirname "$0")/.." && pwd)"
LT="$LAB/local-tasks"
mkdir -p "$LT/out/prose"

for V in "$@"; do
  ROUTE_TOPIC=$(python3 -c "
import importlib.util as u; spec=u.spec_from_file_location('c','$LT/compile_view.py')
m=u.module_from_spec(spec)
import sys; sys.argv=['x','none']
try: spec.loader.exec_module(m)
except SystemExit: pass
" 2>/dev/null)
  P="$LT/out/prose/$V.txt"
  rm -f "$P"
  # S1: prose micro-task, boolean gate = file exists with sane length
  PROSE_OK=false
  for A in 1 2; do
    cat > "$LT/tasks/prose-$V.md" <<EOF
Write a study note for an SC-200 training lab page. 3 to 4 sentences,
own words, plain text only, fictional, no URLs (the characters "http"
must not appear), no company names. Topic: the lab page '$V' described
in /home/alex/defender-lab/local-tasks/tasks/${V^^}.md (read ONLY that
file's PAGE STRUCTURE closing-note bullet for the intended points).
Save the sentences to this ABSOLUTE path and STOP:
/home/alex/defender-lab/local-tasks/out/prose/$V.txt
EOF
    echo "=== selfheal $V prose attempt $A: $(date -Is) ===" >> "$LT/goose-run.log"
    ( cd "$LAB" && timeout 300 goose run -i "$LT/tasks/prose-$V.md" --no-session ) >> "$LT/goose-run.log" 2>&1
    if [ -s "$P" ] && [ "$(wc -c < "$P")" -ge 120 ] && [ "$(wc -c < "$P")" -le 900 ] && ! grep -qi "http" "$P"; then
      PROSE_OK=true; break
    fi
    rm -f "$P"
  done
  # S2: deterministic compile + render gate (works with or without prose)
  if python3 "$LT/compile_view.py" "$V" >> "$LT/goose-run.log" 2>&1; then
    echo "## selfheal $V — $(date -Is)" >> "$LT/QA_LOG.md"
    echo "- **PASS** (prose_by_goose=$PROSE_OK, compiled=S2, gate=add_view render)" >> "$LT/QA_LOG.md"
    echo >> "$LT/QA_LOG.md"
    git -C "$LAB" add ui/views.js ui/data.js "$LT"
    git -C "$LAB" commit -qm "selfheal $V: compiled view (goose prose: $PROSE_OK, render-gated)"
  else
    echo "## selfheal $V — $(date -Is)" >> "$LT/QA_LOG.md"
    echo "- **FAIL at compile/gate** — see goose-run.log; ui/ untouched (gate rolled back or rejected draft)" >> "$LT/QA_LOG.md"
    echo >> "$LT/QA_LOG.md"
    git -C "$LAB" add "$LT" && git -C "$LAB" commit -qm "selfheal $V: FAILED gate"
  fi
done
bash "$LAB/bin/qa-sweep.sh" >> "$LT/goose-run.log" 2>&1
git -C "$LAB" add "$LT" && git -C "$LAB" commit -qm "selfheal batch: qa-sweep"
echo "SELFHEAL COMPLETE $(date -Is)" >> "$LT/goose-run.log"
