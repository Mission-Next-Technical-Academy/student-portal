# shellcheck shell=bash
# shellcheck disable=SC2034  # used by the scripts that source this file
# The one place the staging-automation scripts in bin/ci/ name the Supabase
# projects. Source it; never copy these values into another script or a
# workflow. They match bin/lib/supabase-target.js.
#
# Project refs are public identifiers, not secrets.

# Production: the live academy. CI must never touch it.
readonly SUPABASE_PRODUCTION_REF=eokvngifirjgfozzbieu
# Staging: the only project the staging automation may change.
readonly SUPABASE_STAGING_REF=xbblgtrfwgeiyttdlbue
