"""Regression cases for false alarms and genuine M360 boundary violations."""
import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'bin/m360-gate-boundary.py'
spec = importlib.util.spec_from_file_location('boundary', SCRIPT)
boundary = importlib.util.module_from_spec(spec)
spec.loader.exec_module(boundary)


class BoundaryTests(unittest.TestCase):
    def test_unrelated_changes_pass(self):
        for paths in [[], ['portal/index.html', 'portal/app.js'],
                      ['.github/workflows/m360-gate6-regression-check.yml', 'portal/app.js'],
                      ['portal/index.html', 'supabase/migrations/20260924120000_soc_progress.sql']]:
            with self.subTest(paths=paths):
                self.assertEqual(boundary.violations(paths), [])

    def test_m360_with_shared_shell_passes(self):
        self.assertEqual(boundary.violations(['portal/m360/home.js', 'portal/index.html']), [])

    def test_all_technical_tracks_are_protected(self):
        for path in ['portal/app.js', 'portal/data.js', 'portal/module-labs.js',
                     'portal/soc-analyst-module-02.js', 'portal/it-support-module-01.js',
                     'portal/ai-ml-module-01.js', 'portal/electrical-module-01.js']:
            with self.subTest(path=path):
                self.assertTrue(boundary.violations(['portal/m360/home.js', path]))

    def test_all_m360_entry_points_activate_boundary(self):
        for path in ['portal/m360/home.js', 'portal/m360-entry.js', 'portal/m360-preview.js',
                     'supabase/migrations/20260924120000_m360_change.sql']:
            with self.subTest(path=path):
                self.assertTrue(boundary.violations([path, 'portal/app.js']))

    def test_approved_migrations_pass(self):
        self.assertEqual(len(boundary.APPROVED_MIGRATIONS), 8)
        self.assertEqual(boundary.violations(['portal/m360/home.js', *boundary.APPROVED_MIGRATIONS]), [])

    def test_unapproved_migrations_remain_blocked_for_m360(self):
        for path in ['supabase/migrations/20260924120000_m360_new.sql',
                     'supabase/migrations/20260924120000_soc_progress.sql']:
            with self.subTest(path=path):
                self.assertTrue(boundary.violations(['portal/m360/home.js', path]))

    def test_command_exit_status(self):
        for paths, status in [([], 0), (['portal/index.html', 'portal/app.js'], 0),
                              (['portal/m360/home.js', 'portal/app.js'], 1)]:
            with self.subTest(paths=paths):
                result = subprocess.run([sys.executable, str(SCRIPT)],
                                        input='\0'.join(paths) + '\0', text=True, capture_output=True)
                self.assertEqual(result.returncode, status, result.stdout + result.stderr)


if __name__ == '__main__':
    unittest.main()
