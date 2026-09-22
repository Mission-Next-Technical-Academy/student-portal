#!/usr/bin/env bash
# Launch the academy from the dash icon: bring both halves up, then open the
# portal login page alongside the deployed student portal for comparison.
#
# The app is two static halves (see bin/dev.sh): portal on 8768 is the front
# door — login, catalogue, curriculum — and the simulator on 8767 is what a
# module launches into. Opening 8767 directly skips the sign-in, so this
# launcher starts both and lands on the portal login route.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOCAL_URL="http://localhost:8768/#/login"
LIVE_URL="https://mission-next-technical-academy.github.io/student-portal/"

"$ROOT/bin/dev.sh" start >>"$ROOT/.launch.log" 2>&1

# Firefox accepts multiple URLs in one invocation, which opens them together as
# tabs in the same browser window.  Fall back to the desktop URL handler when
# Firefox is not installed; most handlers reuse the current browser window.
if command -v firefox >/dev/null 2>&1; then
  firefox "$LOCAL_URL" "$LIVE_URL" >/dev/null 2>&1 &
else
  xdg-open "$LOCAL_URL" >/dev/null 2>&1 &
  xdg-open "$LIVE_URL" >/dev/null 2>&1 &
fi
