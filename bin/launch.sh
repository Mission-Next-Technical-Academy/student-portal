#!/usr/bin/env bash
# Launch the SC-200 lab: ensure the local http server is running, then open Firefox.
set -u

PORT=8767
URL="http://127.0.0.1:${PORT}/"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
UI_DIR="$ROOT/ui"
LOG="$ROOT/.server.log"
PID_FILE="$ROOT/.server.pid"

is_up() {
  # /dev/tcp test — bash builtin, no curl dependency
  (exec 3<>/dev/tcp/127.0.0.1/${PORT}) 2>/dev/null && { exec 3>&-; return 0; } || return 1
}

if ! is_up; then
  cd "$UI_DIR"
  # Detach so it survives this launcher exiting and the user closing the window
  setsid nohup python3 -m http.server "$PORT" --bind 127.0.0.1 \
      >"$LOG" 2>&1 < /dev/null &
  echo $! > "$PID_FILE"
  # Wait briefly for the port to come up
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    is_up && break
    sleep 0.2
  done
fi

xdg-open "$URL" >/dev/null 2>&1 || firefox "$URL" >/dev/null 2>&1 &
