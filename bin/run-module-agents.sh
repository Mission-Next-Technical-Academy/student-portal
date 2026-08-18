#!/usr/bin/env bash
# Run SOC Analyst module-lab agents in parallel, one Codex process per module.
#
#   bin/run-module-agents.sh 2 3          background, logs in .agent-logs/
#   bin/run-module-agents.sh -t 4 5 6     each agent in its own terminal window
#
# Parallel is safe because of the registry refactor: an agent writes only
# portal/module-NN.js, portal/module-NN.css and .agent-logs/module-NN-report.md.
# Nothing shared is edited, so there is nothing to serialize. The orchestrator
# reviews and commits; agents never run git.
#
# -s danger-full-access because the bwrap sandbox is broken on this machine
# (AppArmor userns): workspace-write exits 0 having silently written nothing.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG="$ROOT/.agent-logs"
mkdir -p "$LOG"

TERMINALS=0
case "${1:-}" in
  -t|--terminals) TERMINALS=1; shift ;;
esac
[ $# -gt 0 ] || { echo "usage: bin/run-module-agents.sh [-t] <module numbers>" >&2; exit 64; }

brief() {
  local n="$1" nn
  nn="$(printf '%02d' "$n")"
  cat <<EOF
You are Module Agent ${nn} for the Mission Next Technical Academy SOC Analyst course.

Read first, in this order:
  MODULAR_LAB_PROGRAM_PROGRESS.md  — find your row in the Module Ownership table; that
                                     row's live module title and orchestration brief is
                                     your assignment, and the "Shared Contract for Every
                                     Module Agent" section lists your ten deliverables.
  MODULE_STANDARD.md               — the canonical module shape, non-negotiable.
  MNT_DESIGN_TOKENS.md             — colors, type, spacing.
  PROJECT_GUIDE_FOR_AI.md          — house rules and code patterns.
  portal/module-01.js + module-labs.css — the reference implementation. Match its depth,
                                     structure and quality. Do not copy it verbatim and do
                                     not produce a reskin of it.
  portal/lab-runtime.js            — the only sanctioned state store (LabRuntime.load /
                                     save / reset with a lab-specific id).
  portal/module-registry.js        — how your module attaches to the router.
  portal/data.js                   — your module's catalogue entry (key soc-${nn}) and its
                                     lab rows. Read only; do not edit.

YOU MAY WRITE EXACTLY THREE FILES. Editing anything else breaks the other agents
running right now:
  portal/module-${nn}.js
  portal/module-${nn}.css      (prefix every selector .m${nn}- so it cannot leak)
  .agent-logs/module-${nn}-report.md

portal/module-${nn}.js must end with:
  registerModuleLab({ program: 'soc-analyst', moduleNumber: ${n}, moduleKey: 'soc-${nn}',
    view: <your view fn>, wire: <your wire fn> });
view(user, program) returns the module's full HTML as a string; wire() runs after every
render and attaches listeners. index.html already loads both of your files.

Difficulty gradient — the course must ramp, and yours is one rung of it:
  Modules 1-3   guided. One data source, one question at a time, the coach names the
                next step. A student in week 1 has never opened a console before.
  Modules 4-6   assisted. Two sources at most, hints available, the student chooses the
                order but the path is signposted.
  Modules 7-9   semi-independent. The student decides what to look at; hints cost nothing
                but are not offered unasked.
  Modules 10-11 independent. Objective and dataset only; no step list.
  Module 12     the capstone, and the only module that may expose the full range.
Build to YOUR rung. Reaching for the next one up is the most common way these labs go
wrong: it makes an early module feel like the capstone and leaves the student stuck.

Hard rules:
- No git. No npm, no build step, no bundler. Vanilla HTML/CSS/JS only.
- No network calls, no real auth. State in memory or via LabRuntime only.
- No secrets anywhere. No Microsoft (or any vendor) HTML/CSS/JS or Learn text copied —
  original look-alike code and own-words explanations only. Original branding.
- Synthetic data only, with plausible benign distractors. Learner identities anonymous.
- Isolation is the point: a regular module exposes ONLY its own miniature lab surface.
  Do not link to, embed, or reveal the full simulator at 127.0.0.1:8767, its navigation,
  its shared incident storyline, evidence belonging to later modules, or the Module 12
  capstone workflow. (Module 12 is the sole exception and is a different agent.)
- Individual-lab reset clears your lab only, never course progress.
- Accessible: labels, keyboard operation, managed focus after scoring, visible focus
  rings, contrast, and a layout that does not scroll horizontally at 390px wide.
- Scoring must be explainable — show the student why they got what they got.

Before you finish:
1. node --check portal/module-${nn}.js
2. node bin/portal-check.js ${n}          (must print "module ${n}  OK")
3. Write .agent-logs/module-${nn}-report.md: what you built, the scoring model, the
   storage key, and the verification you ran. Match HANDOFF.md's style; the orchestrator
   merges it into HANDOFF.md and MODULAR_LAB_PROGRAM_PROGRESS.md.

Build the complete lab for Module ${nn} now.
EOF
}

for N in "$@"; do
  NN="$(printf '%02d' "$N")"
  echo "=== Module Agent $NN start: $(date -Is) ===" >> "$LOG/progress.log"
  brief "$N" > "$LOG/module-$NN-brief.md"

  # --skip-git-repo-check is not needed (we are in a repo); -o captures the
  # agent's own summary next to its transcript.
  CMD=(codex exec -C "$ROOT" -s danger-full-access
       -o "$LOG/module-$NN-summary.md"
       "$(brief "$N")")

  if [ "$TERMINALS" = 1 ]; then
    # Each agent gets a visible window. A clean run closes its own window; a
    # failed one parks at a shell so the error is still on screen to read.
    # Without this the finished windows have to be hunted down and closed by
    # hand, and they lose their title once the shell replaces codex.
    gnome-terminal --title="Module Agent $NN" -- bash -lc \
      "$(printf '%q ' "${CMD[@]}") 2>&1 | tee '$LOG/module-$NN.log'; \
       rc=\${PIPESTATUS[0]}; \
       echo \"=== Module Agent $NN done: exit \$rc, \$(date -Is) ===\" >> '$LOG/progress.log'; \
       if [ \$rc -eq 0 ]; then exit 0; fi; \
       echo; echo \"=== Module Agent $NN FAILED (exit \$rc) — window kept open ===\"; exec bash" &
  else
    ( "${CMD[@]}" > "$LOG/module-$NN.log" 2>&1
      echo "=== Module Agent $NN done: exit $?, $(date -Is) ===" >> "$LOG/progress.log" ) &
  fi
done

if [ "$TERMINALS" = 1 ]; then
  echo "Launched $# agent terminal(s). Logs also in $LOG/"
else
  echo "Launched $# agent(s) in the background. Watch:  tail -f $LOG/module-*.log"
  wait
  echo "All agents finished. Review, then commit."
fi
