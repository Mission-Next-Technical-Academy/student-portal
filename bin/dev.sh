#!/usr/bin/env bash
# One command to bring the whole app up locally.
#
# The app is two static halves that reference each other:
#   portal (8768) — login, catalogue, curriculum, module pages   -> portal/
#   simulator (8767) — the SOC lab environment itself             -> ui/
#
# They are separate origins locally so either half can be reloaded without
# restarting the other. The deployed build collapses them to one origin
# (portal at /, simulator at /sim/); portal/app.js detects which it is in.
#
#   bin/dev.sh          start both, print the URLs
#   bin/dev.sh stop     stop both
#   bin/dev.sh status   report what is listening
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORTAL_PORT=8768
SIM_PORT=8767

is_up() {
  (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null && { exec 3>&-; return 0; } || return 1
}

# $1 port, $2 directory, $3 human name
serve() {
  local port="$1" dir="$2" name="$3"
  if is_up "$port"; then
    echo "  $name already up on $port"
    return
  fi
  # setsid+nohup so the servers outlive this script and the terminal that ran it.
  setsid nohup python3 -m http.server "$port" --bind 127.0.0.1 --directory "$dir" \
    >"$ROOT/.$name.log" 2>&1 </dev/null &
  echo $! >"$ROOT/.$name.pid"
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    is_up "$port" && break
    sleep 0.2
  done
  is_up "$port" && echo "  $name up on $port" || { echo "  $name FAILED to start" >&2; return 1; }
}

stop_one() {
  local name="$1" pidfile="$ROOT/.$1.pid"
  [ -f "$pidfile" ] || return 0
  local pid
  pid="$(cat "$pidfile")"
  # Only kill it if it is still the http.server we started — a recycled PID
  # belonging to something else must not be touched.
  if ps -o args= -p "$pid" 2>/dev/null | grep -q 'http\.server'; then
    kill "$pid" && echo "  stopped $name (pid $pid)"
  fi
  rm -f "$pidfile"
}

case "${1:-start}" in
  start)
    echo "Starting Mission Next Technical Academy locally:"
    serve "$SIM_PORT"    "$ROOT/ui"     simulator
    serve "$PORTAL_PORT" "$ROOT/portal" portal
    cat <<EOF

  Portal      http://127.0.0.1:$PORTAL_PORT/#/login
  Simulator   http://127.0.0.1:$SIM_PORT/

  Demo sign-ins (password == username):
    user1  IT Help Desk        user2  SOC Analyst
    user3  AI & ML             user4  Electrical Engineering

  The SOC Analyst track is the built one. Start at:
  http://127.0.0.1:$PORTAL_PORT/#/program/soc-analyst/module/1  (sign in as user2)
EOF
    ;;
  stop)
    echo "Stopping:"
    stop_one portal
    stop_one simulator
    ;;
  status)
    for pair in "portal:$PORTAL_PORT" "simulator:$SIM_PORT"; do
      name="${pair%%:*}" port="${pair##*:}"
      is_up "$port" && echo "  $name  UP    ($port)" || echo "  $name  down  ($port)"
    done
    ;;
  *)
    echo "usage: bin/dev.sh [start|stop|status]" >&2
    exit 64
    ;;
esac
