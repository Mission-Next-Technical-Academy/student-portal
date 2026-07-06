#!/bin/bash
# Run goose-local VIEW tasks sequentially behind the add_view.py render gate.
# Usage: local-tasks/bin-run-goose-views.sh V12 V13 ...
# Pass -> views.js/data.js updated + committed. Fail -> draft deleted, one
# retry, then the task stays open (QA_LOG has the reason).
set -u
LAB="$(cd "$(dirname "$0")/.." && pwd)"
LT="$LAB/local-tasks"

for T in "$@"; do
  V="${T,,}"                     # V12 -> v12 (draft prefix)
  OK=0
  for ATTEMPT in 1 2; do
    rm -f "$LT/out/views/$V"-*.js
    echo "=== $T attempt $ATTEMPT: $(date -Is) ===" >> "$LT/goose-run.log"
    ( cd "$LAB" && timeout 900 goose run -i "$LT/tasks/$T.md" --no-session ) \
      >> "$LT/goose-run.log" 2>&1
    RES=$(python3 "$LT/add_view.py" "$V" 2>&1)
    echo "$RES" >> "$LT/goose-run.log"
    if echo "$RES" | grep -q "^PASS $V"; then OK=1; break; fi
    # a hard rollback aborts the whole run to protect ui/ state
    if echo "$RES" | grep -q "rolled back"; then
      echo "ABORT $T: rollback occurred" >> "$LT/goose-run.log"; exit 1
    fi
  done
  if [ "$OK" -eq 1 ]; then
    git -C "$LAB" add ui/views.js ui/data.js "$LT"
    git -C "$LAB" commit -qm "local-tasks $T: goose view $(echo "$RES" | grep -o '#[a-z/-]*' | head -1) (render-gated)"
  else
    rm -f "$LT/out/views/$V"-*.js
    git -C "$LAB" add "$LT" && git -C "$LAB" commit -qm "local-tasks $T: view FAILED gate (draft discarded)"
  fi
done
echo "VIEW RUN COMPLETE $(date -Is)" >> "$LT/goose-run.log"
