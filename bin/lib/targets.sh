# Supabase targets and local ports for the local launcher (bin/dev.sh).
# Sourced, not executed. The one place these values live for the shell
# scripts; bin/lib/supabase-target.js holds the same refs for the Node admin
# scripts.
#
# Publishable keys are public by design (Row Level Security is the security
# boundary). Service-role keys and passwords must never appear here.

PRODUCTION_REF='eokvngifirjgfozzbieu'
STAGING_REF='xbblgtrfwgeiyttdlbue'
STAGING_URL="https://${STAGING_REF}.supabase.co"
STAGING_KEY='sb_publishable_agURZ60XyPuIHiH1bLaOBg_tGy76IaY'

# Hard-coded in portal/app.js, ui/coach.js and ui/helpdesk-coaches.js.
PORTAL_PORT=8768
SIM_PORT=8767
