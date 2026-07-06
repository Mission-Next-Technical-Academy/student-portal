#!/bin/bash
# Run goose-local (qwen2.5:7b) fixture tasks sequentially with a mechanical
# pass/fail gate. Usage: local-tasks/bin-run-goose-tasks.sh T01 T02 ...
# Pass -> commit. Fail -> delete output, retry once, then give up on the task.
set -u
LAB="$(cd "$(dirname "$0")/.." && pwd)"
LT="$LAB/local-tasks"
QA="$LT/QA_LOG.md"

for T in "$@"; do
  OUT_REL=$(node -e "console.log(require('$LT/manifest.json')['$T'].file)")
  OUT="$LT/$OUT_REL"
  PASS=0
  for ATTEMPT in 1 2; do
    rm -f "$OUT"
    echo "=== $T attempt $ATTEMPT: $(date -Is) ===" >> "$LT/goose-run.log"
    ( cd "$LAB" && timeout 900 goose run -i "$LT/tasks/$T.md" --no-session ) \
      >> "$LT/goose-run.log" 2>&1
    if node "$LT/verify.js" "$T" >> "$LT/goose-run.log" 2>&1; then
      PASS=$ATTEMPT
      break
    fi
  done
  {
    echo "## $T — $(date -Is)"
    if [ "$PASS" -gt 0 ]; then
      echo "- **PASS** (attempt $PASS). Checks: file created, node-loadable,"
      echo "  export names/counts/keys per manifest.json, banned-pattern scan"
      echo "  (no http/URLs, no Microsoft domains or MS fictional brands, no"
      echo "  long hex/secret-like strings, no real-year CVEs)."
      echo "- Output: \`$OUT_REL\`"
    else
      echo "- **FAIL** after 2 attempts. Last verifier output:"
      node "$LT/verify.js" "$T" 2>&1 | sed 's/^/  > /'
      echo "- Output deleted; task remains open."
      rm -f "$OUT"
    fi
    echo
  } >> "$QA"
  if [ "$PASS" -gt 0 ]; then
    git -C "$LAB" add "$OUT" "$QA"
    git -C "$LAB" commit -qm "local-tasks $T: goose/qwen2.5:7b fixtures (verified)"
  else
    git -C "$LAB" add "$QA"
    git -C "$LAB" commit -qm "local-tasks $T: FAILED verification (no output kept)"
  fi
done
echo "GOOSE RUN COMPLETE $(date -Is)" >> "$LT/goose-run.log"
