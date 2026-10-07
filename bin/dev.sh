#!/usr/bin/env bash
# One command to bring the whole app up locally, connected to STAGING.
#
# The app is two static halves that reference each other:
#   portal (8768) — login, catalogue, curriculum, module pages   -> portal/
#   simulator (8767) — the SOC lab environment itself             -> ui/
#
# They are separate origins locally so either half can be reloaded without
# restarting the other. The deployed build collapses them to one origin
# (portal at /, simulator at /sim/); portal/app.js detects which it is in.
#
# Both halves are served live from the repo, so edits show on reload. The one
# exception is the portal's /supabase-config.js: the repo copy names the
# production project, so the portal server is given a generated copy (in a
# temp folder outside the repo) that names staging and adds a corner badge.
#
#   bin/dev.sh [start] [--production]   start both in the background, print the URLs
#   bin/dev.sh serve [--production]     same, but in the foreground until Ctrl-C
#   bin/dev.sh stop                     stop both
#   bin/dev.sh status                   one line per server, with the target;
#                                       exit 0 when both are up, 3 otherwise
#
# --production connects the local portal to the LIVE production project (real
# student data). It is never the default.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib/targets.sh
. "$ROOT/bin/lib/targets.sh"

TARGET_FILE="$ROOT/.dev-target"   # STAGING or PRODUCTION while servers run
TMPDIR_FILE="$ROOT/.dev-tmpdir"   # temp folder holding the generated config
LOG_LINES=20
STARTED=""                        # servers this invocation started

fail() { echo "STOPPED: $*" >&2; exit 1; }

is_up() {
  (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null && { exec 3>&-; return 0; } || return 1
}

http_code() {
  curl -s -o /dev/null -w '%{http_code}' --max-time 3 "$1" 2>/dev/null || true
}

# What the running portal is actually connected to, read from the config it
# serves (not from the state file): STAGING, PRODUCTION, UNKNOWN or DOWN.
live_target() {
  is_up "$PORTAL_PORT" || { echo DOWN; return; }
  local body
  body="$(curl -s --max-time 3 "http://127.0.0.1:$PORTAL_PORT/supabase-config.js" 2>/dev/null || true)"
  case "$body" in
    *"$PRODUCTION_REF"*) echo PRODUCTION ;;
    *"$STAGING_REF"*)    echo STAGING ;;
    *)                   echo UNKNOWN ;;
  esac
}

# python3 if it runs, else python if it is Python 3 (Git Bash on Windows).
# Running it, not just finding it, skips the Windows Store "python3" stub.
find_python() {
  local cand
  for cand in python3 python; do
    if "$cand" -c 'import sys; sys.exit(sys.version_info[0] != 3)' >/dev/null 2>&1; then
      PYTHON="$cand"
      return
    fi
  done
  fail "Python 3 is needed to serve the portal, and neither 'python3' nor 'python' runs Python 3. Install Python 3 and try again."
}

# A file other than portal/supabase-config.js that names production would
# bypass the config swap, so refuse to serve at all.
check_no_hardcoded_production() {
  local hits
  hits="$(grep -rIl "$PRODUCTION_REF" "$ROOT/portal" "$ROOT/ui" 2>/dev/null \
    | grep -vx "$ROOT/portal/supabase-config.js" || true)"
  if [ -n "$hits" ]; then
    echo "$hits" >&2
    fail "the files above hard-code the production project ($PRODUCTION_REF). Only portal/supabase-config.js may; it is swapped for staging locally. Not serving."
  fi
}

# Remove a temp folder this script made, and nothing else.
remove_tmpdir() {
  local dir="$1"
  case "$(basename "$dir")" in
    mnta-local.*) [ -d "$dir" ] && rm -rf "$dir" ;;
  esac
  return 0
}

clear_state() {
  if [ -f "$TMPDIR_FILE" ]; then
    remove_tmpdir "$(cat "$TMPDIR_FILE")"
  fi
  rm -f "$TARGET_FILE" "$TMPDIR_FILE"
}

show_log_tail() {
  local name="$1"
  echo "--- last $LOG_LINES lines of .$name.log ---" >&2
  tail -n "$LOG_LINES" "$ROOT/.$name.log" >&2 2>/dev/null || echo "(no log)" >&2
  echo "---" >&2
}

# $1 port, $2 directory, $3 human name, $4 background|foreground, rest: serve.py args
start_server() {
  local port="$1" dir="$2" name="$3" mode="$4" detach=""
  shift 4
  if [ "$mode" = background ]; then
    # Outlive this script and the terminal that ran it: setsid where it exists
    # (Linux), nohup alone where it does not (macOS has no setsid).
    detach="nohup"
    command -v setsid >/dev/null 2>&1 && detach="setsid nohup"
  fi
  # bin/serve.py rather than `python3 -m http.server`: same server, but with
  # caching disabled, so an edited views.js is never served stale alongside a
  # freshly added file.
  $detach "$PYTHON" "$ROOT/bin/serve.py" "$port" --bind 127.0.0.1 --directory "$dir" "$@" \
    >"$ROOT/.$name.log" 2>&1 </dev/null &
  echo $! >"$ROOT/.$name.pid"
  STARTED="$STARTED $name"
}

# Wait up to ~10s for HTTP 200 from $2; on failure show the log and return 1.
wait_for_200() {
  local name="$1" url="$2" code=""
  for _ in $(seq 1 50); do
    code="$(http_code "$url")"
    [ "$code" = 200 ] && { echo "  $name up ($url)"; return 0; }
    # A server we started that has already exited will not come up.
    case " $STARTED " in
      *" $name "*) kill -0 "$(cat "$ROOT/.$name.pid" 2>/dev/null || echo none)" 2>/dev/null || break ;;
    esac
    sleep 0.2
  done
  echo "  $name FAILED to start (last HTTP status: ${code:-none})" >&2
  case " $STARTED " in *" $name "*) show_log_tail "$name" ;; esac
  return 1
}

stop_one() {
  local name="$1" pidfile="$ROOT/.$1.pid"
  [ -f "$pidfile" ] || return 0
  local pid
  pid="$(cat "$pidfile")"
  # Only kill it if it is still the server we started — a recycled PID
  # belonging to something else must not be touched. Match both bin/serve.py and
  # the http.server it replaced, so a shell still holding an older process can
  # stop it.
  if ps -o args= -p "$pid" 2>/dev/null | grep -qE 'bin/serve\.py|http\.server'; then
    kill "$pid" && echo "  stopped $name (pid $pid)"
  fi
  rm -f "$pidfile"
}

print_banner() {
  local target="$1"
  cat <<EOF

  Portal      http://127.0.0.1:$PORTAL_PORT/#/login
  Simulator   http://127.0.0.1:$SIM_PORT/
  Target      $target  (check any time with: bin/dev.sh status)

EOF
  if [ "$target" = STAGING ]; then
    cat <<EOF
  Connected to the STAGING Supabase project ($STAGING_REF): synthetic data
  only. Sign in with a synthetic staging account from your password manager.
  The orange badge in the corner of every portal page confirms this.
EOF
  else
    cat <<EOF
  !!! Connected to PRODUCTION ($PRODUCTION_REF): REAL student data. !!!
  The red badge in the corner of every portal page confirms this.
EOF
  fi
  cat <<EOF

  The SOC Analyst track is the built one. Start at:
  http://127.0.0.1:$PORTAL_PORT/#/program/soc-analyst/module/1
EOF
}

production_warning() {
  cat >&2 <<EOF

  !!! WARNING: --production was passed. !!!
  The local portal will use the LIVE production Supabase project ($PRODUCTION_REF).
  Everything you do while signed in reads and writes REAL student data.
  Leave out --production to use staging.

EOF
}

staging_health_check() {
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 \
    -H "apikey: $STAGING_KEY" "$STAGING_URL/auth/v1/health" 2>/dev/null || true)"
  if [ "$code" = 200 ]; then
    echo "  staging project $STAGING_REF is answering"
  else
    echo "  WARNING: staging project answered HTTP ${code:-nothing} to its health check." >&2
    echo "  It may be paused; restore it in the Supabase dashboard. Serving anyway." >&2
  fi
}

# start/serve. $1 background|foreground, rest: options.
run() {
  local mode="$1" target=STAGING arg
  shift
  for arg in "$@"; do
    case "$arg" in
      --production) target=PRODUCTION ;;
      *) echo "usage: bin/dev.sh [start|serve] [--production]" >&2; exit 64 ;;
    esac
  done

  find_python
  command -v curl >/dev/null 2>&1 || fail "curl is needed to check the servers. Install curl and try again."
  check_no_hardcoded_production

  # Never silently reuse a server connected to the wrong project.
  local running
  running="$(live_target)"
  if [ "$running" = UNKNOWN ]; then
    fail "port $PORTAL_PORT is in use by something that is not a bin/dev.sh portal (target=UNKNOWN). Run bin/dev.sh stop; if it is still in use, stop that program yourself."
  elif [ "$running" != DOWN ] && [ "$running" != "$target" ]; then
    fail "a portal is already running on port $PORTAL_PORT with target=$running, but you asked for $target. Run bin/dev.sh stop first."
  fi

  # serve (also .claude/launch.json) with the same target already running:
  # nothing to start, so say so and point at the running portal.
  if [ "$mode" = foreground ] && [ "$running" = "$target" ]; then
    is_up "$SIM_PORT" || fail "the portal is already running on $target at $PORTAL_PORT, but the simulator on $SIM_PORT is down. Run bin/dev.sh stop, then try again."
    echo "The portal is already running on $target at $PORTAL_PORT: use it at http://127.0.0.1:$PORTAL_PORT/#/login"
    echo "Nothing was started. Stop it with bin/dev.sh stop."
    exit 0
  fi

  [ "$target" = PRODUCTION ] && production_warning
  echo "Starting Mission Next Technical Academy locally (target=$target):"
  [ "$target" = STAGING ] && staging_health_check

  local portal_needed=1 dir=""
  if [ "$running" = "$target" ]; then
    portal_needed=0
  else
    # Generate the swapped config before starting anything, so a failure here
    # leaves nothing running.
    # Use this run's own folder below, never a re-read of the shared state
    # file, which a concurrent run could have rewritten.
    clear_state
    local base="${TMPDIR:-/tmp}"
    dir="$(mktemp -d "${base%/}/mnta-local.XXXXXX")"
    case "$dir/" in "$ROOT"/*) rm -rf "$dir"; fail "the temp folder ($dir) is inside the repo; set TMPDIR elsewhere." ;; esac
    echo "$dir" >"$TMPDIR_FILE"
    echo "$target" >"$TARGET_FILE"
    "$PYTHON" "$ROOT/bin/lib/local_config.py" --target "$target" \
      --source "$ROOT/portal/supabase-config.js" --out "$dir/supabase-config.js" \
      --production-ref "$PRODUCTION_REF" --staging-url "$STAGING_URL" --staging-key "$STAGING_KEY" \
      || { clear_state; exit 1; }
  fi

  if is_up "$SIM_PORT"; then
    echo "  simulator already up on $SIM_PORT"
  else
    start_server "$SIM_PORT" "$ROOT/ui" simulator "$mode"
  fi
  if [ "$portal_needed" = 1 ]; then
    # serve.py refuses a production config unless told otherwise; only
    # --production ever tells it.
    local allow=""
    [ "$target" = PRODUCTION ] && allow="--allow-production"
    start_server "$PORTAL_PORT" "$ROOT/portal" portal "$mode" \
      --override "/supabase-config.js=$dir/supabase-config.js" $allow
  else
    echo "  portal already up on $PORTAL_PORT (target=$target)"
  fi

  local ok=1
  wait_for_200 simulator "http://127.0.0.1:$SIM_PORT/" || ok=0
  [ "$ok" = 1 ] && { wait_for_200 portal "http://127.0.0.1:$PORTAL_PORT/" || ok=0; }
  if [ "$ok" = 1 ]; then
    running="$(live_target)"
    if [ "$running" != "$target" ]; then
      echo "  the portal is serving target=$running, not $target" >&2
      ok=0
    fi
  fi
  if [ "$ok" = 0 ]; then
    stop_started
    fail "could not start the local servers (see above)."
  fi
  print_banner "$target"
}

# Stop only what this invocation started (a server that was already up stays).
stop_started() {
  local name
  for name in $STARTED; do stop_one "$name"; done
  case "$STARTED" in *portal*) clear_state ;; esac
  STARTED=""
}

case "${1:-start}" in
  start)
    [ "$#" -gt 0 ] && shift
    run background "$@"
    ;;
  --production)
    run background "$@"
    ;;
  serve)
    shift
    STARTED=""
    trap 'echo; echo "Stopping:"; stop_started; exit 0' INT TERM
    trap 'stop_started' EXIT
    run foreground "$@"
    echo "  Serving in this window. Press Ctrl-C to stop."
    # Stay in the foreground while our servers run; cleanup runs from the traps.
    while :; do
      for name in $STARTED; do
        is_up "$( [ "$name" = portal ] && echo "$PORTAL_PORT" || echo "$SIM_PORT")" \
          || { echo "  $name stopped unexpectedly" >&2; show_log_tail "$name"; exit 1; }
      done
      sleep 1
    done
    ;;
  stop)
    echo "Stopping:"
    stop_one portal
    stop_one simulator
    clear_state
    ;;
  status)
    rc=0
    if is_up "$PORTAL_PORT"; then
      t="$(live_target)"
      echo "  portal     UP    ($PORTAL_PORT)  target=$t"
      recorded="$(cat "$TARGET_FILE" 2>/dev/null || echo none)"
      if [ "$recorded" != "$t" ]; then
        echo "  WARNING: bin/dev.sh recorded target=$recorded, but the portal on $PORTAL_PORT is serving target=$t. Run bin/dev.sh stop, then start again." >&2
      fi
    else
      echo "  portal     down  ($PORTAL_PORT)"
      rc=3
    fi
    if is_up "$SIM_PORT"; then
      echo "  simulator  UP    ($SIM_PORT)  target=none (no Supabase)"
    else
      echo "  simulator  down  ($SIM_PORT)"
      rc=3
    fi
    exit "$rc"
    ;;
  *)
    echo "usage: bin/dev.sh [start|serve|stop|status] [--production]" >&2
    exit 64
    ;;
esac
