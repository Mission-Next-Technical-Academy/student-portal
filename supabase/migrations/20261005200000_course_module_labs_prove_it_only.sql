-- Verified module completion must require only the lab each module's Prove It
-- actually submits (live UAT, 2026-10-05).
--
-- student_verified_module_progress requires an instructor-approved attempt
-- for EVERY course_module_labs row of a module. The SOCAN map still lists
-- catalog labs the current portal never submits, so a learner whose Prove It
-- was approved stayed "In Progress" and the next module stayed locked
-- (reproduced: soc-05 approved at 95%, verified complete = false).
--
-- Kept per module (the key(s) its Prove It writes via recordLabAttempt):
--   soc-05 lab-endpoint-investigation      soc-06 lab-threat-hunt-independent
--   soc-07 all three (one submit writes 3)  soc-08 both (one submit writes 2)
--   soc-09 lab-active-incident             soc-10 lab-attack-mapping
--   soc-11 lab-exec-report
-- Removed: catalog labs with no submit path in portal/soc-analyst-module-*.js.
-- Every module keeps at least one row, so admin_set_module_override() still
-- resolves each module key.

delete from public.course_module_labs
where track_code = 'SOCAN'
  and (module_key, lab_key) in (
    ('soc-05', 'lab-endpoint-independent'),
    ('soc-06', 'lab-threat-hunt'),
    ('soc-09', 'lab-independent-response'),
    ('soc-10', 'lab-evidence-collection'),
    ('soc-11', 'lab-soc-metrics')
  );
