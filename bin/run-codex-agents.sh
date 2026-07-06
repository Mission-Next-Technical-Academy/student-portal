#!/bin/bash
# Run numbered AGENTS.md agents via Codex CLI, sequentially, one git commit each.
# Usage: bin/run-codex-agents.sh 12 13 14
# Sequential on purpose: agents share ui/data.js / ui/views.js / ui/app.js.
# -s danger-full-access because the bwrap sandbox is broken on this machine
# (AppArmor userns): workspace-write silently writes nothing.
set -u
LAB="$(cd "$(dirname "$0")/.." && pwd)"
LOG="$LAB/.agent-logs"
mkdir -p "$LOG"

PREAMBLE='You are one of the numbered agents defined in AGENTS.md at the repo root.
First read, in order: SC200_LAB.md, ExamObjectives.md, HANDOFF.md, OBJECTIVES_DELTA.md, AGENTS.md, and GAP_BRIDGE.md if your tasks reference it.
Hard rules (from AGENTS.md "Rules for every agent") — non-negotiable:
- NEVER copy Microsoft proprietary HTML/CSS/JS or Microsoft Learn text. Original look-alike code and own-words summaries only.
- No build step: vanilla HTML/CSS/JS served by python3 -m http.server. No npm installs.
- No real auth or network calls; state in memory or localStorage only.
- No secrets in any file. Fake hashes stay aaa.../bbb... style.
- Follow the existing code patterns: views registered in VIEWS[...] in ui/views.js,
  fixtures in ui/data.js, routing/controllers in ui/app.js, styles in ui/styles.css,
  nav entries in the NAV structure in ui/data.js.
When done:
- Run node --check on ui/data.js ui/views.js ui/app.js and fix any syntax errors.
- Mark your checklist items [x] in the AGENTS.md section for your agent.
- Append a dated entry to HANDOFF.md describing what you built (match its existing style).
Do NOT run git commands; the orchestrator commits for you.
Your assignment: complete ALL checklist tasks for '

for N in "$@"; do
  echo "=== Agent $N start: $(date -Is) ===" >> "$LOG/progress.log"
  codex exec -C "$LAB" -s danger-full-access \
    -o "$LOG/agent$N-summary.md" \
    "${PREAMBLE}Agent $N in AGENTS.md." \
    > "$LOG/agent$N.log" 2>&1
  RC=$?
  git -C "$LAB" add -A
  git -C "$LAB" commit -qm "Agent $N (codex, exit $RC)" --allow-empty
  echo "=== Agent $N done: exit $RC, $(date -Is) ===" >> "$LOG/progress.log"
done
echo "RUN COMPLETE $(date -Is)" >> "$LOG/progress.log"
