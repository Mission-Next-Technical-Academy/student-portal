"""Check the Gate 6 isolation policy against NUL-delimited changed paths."""
import re
import sys

APPROVED_MIGRATIONS = frozenset({
    'supabase/migrations/20260904143000_m360_start_here_and_spotlight_verification.sql',
    'supabase/migrations/20260904151000_m360_start_here_spotlight_revoke_anon.sql',
    'supabase/migrations/20260908224500_m360_live_session_schedule.sql',
    'supabase/migrations/20260914132050_m360_live_sessions_by_cohort.sql',
    'supabase/migrations/20260914221720_m360_version_enrollment_binding.sql',
    'supabase/migrations/20260914221910_m360_attendance_completion_records.sql',
    'supabase/migrations/20260914222000_m360_controlled_rpcs_and_progress.sql',
    'supabase/migrations/20260914222034_m360_attendance_finalization_and_least_privilege.sql',
})
M360_PRODUCT = re.compile(
    r"^(portal/m360/|portal/m360-entry\.js$|portal/m360-preview\.[^/]+$|"
    r"supabase/migrations/[^/]*m360[^/]*\.sql$)"
)
TECHNICAL_RUNTIME = re.compile(
    r"^(portal/app\.js$|portal/data\.js$|portal/module-labs\.js$|"
    r"portal/soc-analyst-module-|portal/it-support-module-|"
    r"portal/ai-ml-module-|portal/electrical-module-)"
)


def violations(paths):
    # Shared HTML and workflow edits alone do not make a PR an M360 product change.
    if not any(M360_PRODUCT.match(path) for path in paths):
        return []
    errors = []
    technical = [path for path in paths if TECHNICAL_RUNTIME.match(path)]
    if technical:
        errors.append('M360 changes must not modify technical LMS runtime: ' + ', '.join(technical))
    migrations = [path for path in paths
                  if path.startswith('supabase/migrations/') and path not in APPROVED_MIGRATIONS]
    if migrations:
        errors.append('Unexpected migration in M360 Gate 6 scope: ' + ', '.join(migrations))
    return errors


def main():
    paths = sys.stdin.read().split('\0')
    errors = violations([path for path in paths if path])
    for error in errors:
        print('::error::' + error)
    if not errors:
        print('M360 boundary policy passed')
    return bool(errors)


if __name__ == '__main__':
    sys.exit(main())
