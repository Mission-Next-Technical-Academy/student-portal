#!/usr/bin/env bash
# Sync VERSION and portal/release.js to what the next commit will deploy as:
# 1.<59000 + commit count after that commit - 590>, so commit #590 = 1.59000.
# Deploys stamp this automatically in pages.yml; run this only to keep the
# source files in step for local runs.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
V="1.$(( 59000 + $(git rev-list --count HEAD) + 1 - 590 ))"
echo "$V" > VERSION
sed -i "s/version: '[^']*'/version: '$V'/" portal/release.js
echo "Stamped $V"
