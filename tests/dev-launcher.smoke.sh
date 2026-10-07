#!/usr/bin/env bash
# Smoke test for bin/dev.sh (ISSUE-021, ISSUE-022): starts the real servers on
# 8768/8767, checks they are connected to staging by default and to
# production only with --production, and that a target mismatch is refused.
# Serves files only; it never signs in or writes to any Supabase project.
#
# Refuses to run if anything already listens on those ports. Always leaves no
# servers or temp folders behind, even when a check fails.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
. bin/lib/targets.sh

PORTAL="http://127.0.0.1:$PORTAL_PORT"
SIM="http://127.0.0.1:$SIM_PORT"
FAILURES=0
TMPDIRS=""

is_up() { (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; }

for port in "$PORTAL_PORT" "$SIM_PORT"; do
  if is_up "$port"; then
    echo "SKIP: port $port is in use. Run bin/dev.sh stop and try again." >&2
    exit 1
  fi
done

cleanup() {
  bin/dev.sh stop >/dev/null 2>&1 || true
  local dir
  for dir in $TMPDIRS; do
    case "$(basename "$dir")" in mnta-local.*) rm -rf "$dir" ;; esac
  done
}
trap cleanup EXIT

pass() { echo "  ok    $*"; }
bad()  { echo "  FAIL  $*" >&2; FAILURES=$((FAILURES + 1)); }
check() { local what="$1"; shift; if "$@"; then pass "$what"; else bad "$what"; fi; }

code() { curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$1"; }
config() { curl -s --max-time 5 "$PORTAL/supabase-config.js?v=smoke"; }
contains() { case "$1" in *"$2"*) return 0 ;; *) return 1 ;; esac; }
not() { ! "$@"; }
lacks() { not contains "$1" "$2"; }
# Run "$@" for at most $1 seconds; return its status, or 124 if it had to be
# killed (macOS has no `timeout`). Catches a serve that hangs instead of exiting.
run_limited() {
  local limit=$(($1 * 10)) i=0 pid
  shift
  "$@" &
  pid=$!
  while kill -0 "$pid" 2>/dev/null; do
    i=$((i + 1))
    if [ "$i" -gt "$limit" ]; then kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null; return 124; fi
    sleep 0.1
  done
  wait "$pid"
}
refused() { [ "$1" != 0 ] && [ "$1" != 124 ]; }
remember_tmpdir() { [ -f .dev-tmpdir ] && TMPDIRS="$TMPDIRS $(cat .dev-tmpdir)"; return 0; }

echo "== start (default: staging)"
check "bin/dev.sh start exits 0" bin/dev.sh start
remember_tmpdir
status="$(bin/dev.sh status 2>&1)"; rc=$?
echo "$status"
check "status exits 0 with both up" [ "$rc" = 0 ]
check "status shows target=STAGING" contains "$status" "portal     UP    ($PORTAL_PORT)  target=STAGING"
cfg="$(config)"
check "served config names staging" contains "$cfg" "$STAGING_REF"
check "served config has the staging badge" contains "$cfg" "STAGING (LOCAL)"
check "served config does not name production" lacks "$cfg" "$PRODUCTION_REF"
check "temp folder is outside the repo" lacks "$TMPDIRS/" "$ROOT/"
check "portal page returns 200" [ "$(code "$PORTAL/")" = 200 ]
check "portal index.html returns 200" [ "$(code "$PORTAL/index.html")" = 200 ]
check "simulator returns 200" [ "$(code "$SIM/")" = 200 ]

echo "== start --production while staging runs"
check "is refused (non-zero)" not bin/dev.sh start --production
check "staging is still served" contains "$(config)" "$STAGING_REF"

echo "== serve while servers are already running (the .claude/launch.json path)"
out="$(run_limited 20 bin/dev.sh serve 2>&1)"; rc=$?
echo "$out"
check "serve, same target: exits 0 promptly" [ "$rc" = 0 ]
check "serve, same target: says the portal is already running on STAGING at $PORTAL_PORT" \
  contains "$out" "already running on STAGING at $PORTAL_PORT"
check "serve, same target: says to use it" contains "$out" "use it at $PORTAL/#/login"
check "serve, same target: leaves the running servers up" [ "$(code "$PORTAL/")" = 200 ]
check "serve, same target: still serving staging" contains "$(config)" "$STAGING_REF"
out="$(run_limited 20 bin/dev.sh serve --production 2>&1)"; rc=$?
echo "$out"
check "serve --production, different target: refused (non-zero, did not hang)" refused "$rc"
check "serve --production, different target: says to run bin/dev.sh stop" contains "$out" "bin/dev.sh stop"
check "serve --production, different target: staging still served" contains "$(config)" "$STAGING_REF"

echo "== stop"
staging_tmp="$(cat .dev-tmpdir 2>/dev/null || echo none)"
check "bin/dev.sh stop exits 0" bin/dev.sh stop
bin/dev.sh status >/dev/null 2>&1; rc=$?
check "status exits 3 when down" [ "$rc" = 3 ]
check "temp folder removed" [ ! -e "$staging_tmp" ]
check "recorded target cleared" [ ! -e .dev-target ]

echo "== start --production"
check "bin/dev.sh start --production exits 0" bin/dev.sh start --production
remember_tmpdir
cfg="$(config)"
check "served config names production" contains "$cfg" "$PRODUCTION_REF"
check "served config has the red production badge" contains "$cfg" "PRODUCTION (LOCAL)"
check "status shows target=PRODUCTION" contains "$(bin/dev.sh status 2>&1)" "target=PRODUCTION"
check "start (staging) while production runs is refused" not bin/dev.sh start
out="$(run_limited 20 bin/dev.sh serve 2>&1)"; rc=$?
check "serve (staging) while production runs: refused (non-zero, did not hang)" refused "$rc"
check "serve (staging) while production runs: says to run bin/dev.sh stop" contains "$out" "bin/dev.sh stop"
out="$(run_limited 20 bin/dev.sh serve --production 2>&1)"; rc=$?
check "serve --production, same target: exits 0, already running on PRODUCTION" \
  contains "$rc:$out" "0:The portal is already running on PRODUCTION at $PORTAL_PORT"

echo "== stop"
prod_tmp="$(cat .dev-tmpdir 2>/dev/null || echo none)"
check "bin/dev.sh stop exits 0" bin/dev.sh stop
check "temp folder removed" [ ! -e "$prod_tmp" ]
check "portal is down" not is_up "$PORTAL_PORT"
check "simulator is down" not is_up "$SIM_PORT"

if [ "$FAILURES" -gt 0 ]; then
  echo "dev-launcher smoke: $FAILURES check(s) FAILED" >&2
  exit 1
fi
echo "dev-launcher smoke: all checks passed"
