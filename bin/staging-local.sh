#!/usr/bin/env bash
# Run the portal on the STAGING Supabase project, kept in this window:
# Ctrl-C stops both servers and removes the temporary config. Edits to portal/
# and ui/ show on reload; no restart needed.
#
# Same as `bin/dev.sh serve`; any options (e.g. --production) are passed on.
# For servers that keep running in the background, use bin/dev.sh instead.
exec "$(cd "$(dirname "$0")" && pwd)/dev.sh" serve "$@"
