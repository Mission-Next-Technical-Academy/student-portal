#!/usr/bin/env bash
# Launch the academy from the dash icon: bring both halves up, then open the
# portal login page.
#
# The app is two static halves (see bin/dev.sh): portal on 8768 is the front
# door — login, catalogue, curriculum — and the simulator on 8767 is what a
# module launches into. Opening 8767 directly skips the sign-in, so this
# launcher starts both and lands on the portal login route.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
URL="http://127.0.0.1:8768/#/login"

"$ROOT/bin/dev.sh" start >>"$ROOT/.launch.log" 2>&1

xdg-open "$URL" >/dev/null 2>&1 || firefox "$URL" >/dev/null 2>&1 &
