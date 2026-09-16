#!/usr/bin/env node
/**
 * Create clearly-labelled synthetic evidence for ONE existing SOC student.
 *
 * This is a controlled demo/QA utility, not an academic-record shortcut.
 * It never changes other students and it uses the normal authenticated M360
 * student/admin RPCs so reviewer and finalizer audit fields remain accurate.
 *
 * Usage (credentials belong in the environment, never the command line):
 *   MNT_SYNTHETIC_COMPLETION_ACK=I_UNDERSTAND_SYNTHETIC_RECORDS \
 *   SUPABASE_SERVICE_ROLE_KEY=... MNT_STUDENT_PASSWORD=... \
 *   MNT_ADMIN_EMAIL=... MNT_ADMIN_PASSWORD=... \
 *   node bin/synthesize-soc-m360-completion.js 4437023872-SOCAN --execute
 *
 * Required target conditions: the student exists, is enrolled in SOCAN, and
 * has an active M360 enrollment assigned to a controlled cohort. The supplied
 * admin must already be an active authorized M360 reviewer AND finalizer.
 */

'use strict';

const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://eokvngifirjgfozzbieu.supabase.co').replace(/\/$/, '');
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ACK = 'I_UNDERSTAND_SYNTHETIC_RECORDS';
const args = process.argv.slice(2);
const [studentId] = args;
const execute = args.includes('--execute');
const createM360Enrollment = args.includes('--create-staging-m360-enrollment');
const now = () => new Date().toISOString();

const socLabs = [
  ['soc-01', 'lab-soc-environment'], ['soc-01', 'lab-soc-escalation'],
  ['soc-02', 'lab-identity-investigation'], ['soc-03', 'lab-siem-triage'],
  ['soc-04', 'lab-detection-rule'], ['soc-05', 'lab-endpoint-investigation'], ['soc-05', 'lab-endpoint-independent'],
  ['soc-06', 'lab-threat-hunt'], ['soc-06', 'lab-threat-hunt-independent'],
  ['soc-07', 'lab-email-triage'], ['soc-07', 'lab-network-investigation'], ['soc-07', 'lab-network-email-independent'],
  ['soc-08', 'lab-vuln-prioritization'], ['soc-08', 'lab-vuln-queue'],
  ['soc-09', 'lab-active-incident'], ['soc-09', 'lab-independent-response'],
  ['soc-10', 'lab-evidence-collection'], ['soc-10', 'lab-attack-mapping'],
  ['soc-11', 'lab-exec-report'], ['soc-11', 'lab-soc-metrics'], ['soc-12', 'lab-capstone'],
];
const moduleOneEvidence = [...Array(9)].map((_, i) => `lesson-${i + 1}`).concat('knowledge-check');

function fail(message) { console.error(`Error: ${message}`); process.exit(1); }
function headers(token = SERVICE_ROLE_KEY) { return { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }; }
async function api(path, options = {}, token) {
  const response = await fetch(`${SUPABASE_URL}${path}`, { ...options, headers: { ...headers(token), ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${path}: ${response.status} ${await response.text()}`);
  // PostgREST may return either 204 or an empty 201 when Prefer:
  // return=minimal is used. Both are successful writes with no JSON body.
  const body = await response.text();
  return body ? JSON.parse(body) : null;
}
async function rest(table, query, options = {}) { return api(`/rest/v1/${table}?${query}`, options); }
async function rpc(name, body, token) { return api(`/rest/v1/rpc/${name}`, { method: 'POST', body: JSON.stringify(body) }, token); }
async function signIn(email, password) {
  const data = await api('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) }, SERVICE_ROLE_KEY);
  if (!data.access_token) throw new Error(`Sign-in did not return an access token for ${email}`);
  return data.access_token;
}
function syntheticResult(moduleKey, labKey) {
  return { synthetic: true, synthetic_source: 'bin/synthesize-soc-m360-completion.js', synthetic_at: now(), module_key: moduleKey, lab_key: labKey, note: 'Controlled QA/demo evidence; not learner-authored work.' };
}

async function main() {
  if (!studentId || !/^\d{10}-SOCAN$/.test(studentId)) fail('Usage: node bin/synthesize-soc-m360-completion.js <10-digit-SOCAN> --execute [--create-staging-m360-enrollment]');
  if (!execute) fail('Dry protection: add --execute after reviewing the target.');
  if (process.env.MNT_SYNTHETIC_COMPLETION_ACK !== ACK) fail(`Set MNT_SYNTHETIC_COMPLETION_ACK=${ACK}.`);
  for (const key of ['SUPABASE_SERVICE_ROLE_KEY', 'MNT_STUDENT_PASSWORD', 'MNT_ADMIN_EMAIL', 'MNT_ADMIN_PASSWORD']) if (!process.env[key]) fail(`Missing ${key}.`);

  const students = await rest('students', `student_id=eq.${encodeURIComponent(studentId)}&select=user_id,student_id,track_code,is_enrolled`);
  if (students.length !== 1 || students[0].track_code !== 'SOCAN' || !students[0].is_enrolled) fail('Target must be exactly one enrolled SOCAN student.');
  const student = students[0];
  let enrollment = await rest('m360_enrollments', `user_id=eq.${student.user_id}&status=eq.active&select=id,cohort_id,course_version`);
  if (enrollment.length > 1) fail('Target has multiple active M360 enrollments. Resolve that record conflict before running.');
  if ((!enrollment.length || !enrollment[0].cohort_id) && !createM360Enrollment) fail('Target needs one active M360 enrollment assigned to a controlled cohort. Re-run only with --create-staging-m360-enrollment for this controlled QA fixture.');
  if (!enrollment.length || !enrollment[0].cohort_id) {
    const cohortTag = `SYNTHETIC-QA-${studentId}-${new Date().toISOString().slice(0, 10)}`;
    const cohorts = await api('/rest/v1/cohorts', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ name: cohortTag, start_date: '2026-11-02', end_date: '2026-12-14' }) });
    if (!Array.isArray(cohorts) || cohorts.length !== 1) fail('Could not create exactly one controlled synthetic cohort.');
    const cohort = cohorts[0];
    await api(`/rest/v1/students?user_id=eq.${student.user_id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ cohort_id: cohort.id }) });
    const created = await api('/rest/v1/m360_enrollments', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ user_id: student.user_id, cohort_id: cohort.id, track_code: 'SOCAN', course_version: '2026-11-mvp', status: 'active' }) });
    if (!Array.isArray(created) || created.length !== 1) fail('Could not create the controlled synthetic M360 enrollment.');
    enrollment = created;
    console.log(`Created controlled staging cohort and M360 enrollment for ${studentId}.`);
  }

  const syntheticTag = `SYNTHETIC-QA:${studentId}:${new Date().toISOString().slice(0, 10)}`;
  const existingAttempts = await rest('lab_attempts', `user_id=eq.${student.user_id}&track_code=eq.SOCAN&state=eq.complete&select=lab_key,score,pass_threshold`);
  const passing = new Set(existingAttempts.filter(a => a.score == null || Number(a.score) >= Number(a.pass_threshold ?? 70)).map(a => a.lab_key));
  const missingLabs = socLabs.filter(([, lab]) => !passing.has(lab));
  for (const [moduleKey, labKey] of missingLabs) {
    await api('/rest/v1/lab_attempts', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ user_id: student.user_id, track_code: 'SOCAN', lab_key: labKey, state: 'complete', score: 100, pass_threshold: 70, started_at: now(), completed_at: now(), result: syntheticResult(moduleKey, labKey) }) });
  }
  const evidence = await rest('module_completion_evidence', `user_id=eq.${student.user_id}&track_code=eq.SOCAN&module_key=eq.soc-01&select=evidence_key`);
  const evidenceKeys = new Set(evidence.map(e => e.evidence_key));
  for (const evidenceKey of moduleOneEvidence.filter(k => !evidenceKeys.has(k))) {
    await api('/rest/v1/module_completion_evidence', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ user_id: student.user_id, track_code: 'SOCAN', module_key: 'soc-01', evidence_key: evidenceKey }) });
  }

  // M360 mutations deliberately travel through student and faculty RPCs.
  const studentToken = await signIn(`${studentId.toLowerCase()}@missionnext.example`, process.env.MNT_STUDENT_PASSWORD);
  const adminToken = await signIn(process.env.MNT_ADMIN_EMAIL, process.env.MNT_ADMIN_PASSWORD);
  await rpc('m360_save_start_here', { p_payload: { synthetic: true, source: syntheticTag, networkingComfort: 3, interviewReadiness: 3 }, p_complete: true, p_acknowledgments_complete: true, p_support_flag: false }, studentToken);
  for (let week = 1; week <= 6; week++) {
    const payload = { synthetic: true, source: syntheticTag, week, submitted_at: now(), note: 'Controlled QA/demo submission; not learner-authored work.' };
    await rpc('m360_submit_week', { p_week_number: week, p_submitted_payload: payload, p_schema_version: 1 }, studentToken);
    const scores = week === 6 ? { clarity: 18, relevance: 18, evidence: 18, application: 18, professional_communication: 18 } : { clarity: 22, relevance: 22, evidence: 22, application: 22 };
    await rpc('m360_admin_review_week', { p_user_id: student.user_id, p_week_number: week, p_decision: 'accepted', p_rubric_scores: scores, p_feedback: `${syntheticTag}; controlled QA acceptance.` }, adminToken);
  }
  await rpc('m360_admin_set_spotlight_presentation', { p_user_id: student.user_id, p_status: 'approved_exception_completed', p_reference: syntheticTag }, adminToken);
  await rpc('m360_admin_set_attendance_evidence', { p_user_id: student.user_id, p_scheduled_minutes: 720, p_attended_minutes: 720, p_approved_equivalency_minutes: 0, p_last_date_of_attendance: new Date().toISOString().slice(0, 10), p_external_reference: syntheticTag, p_notes: 'Controlled QA-only attendance fixture.' }, adminToken);
  await rpc('m360_admin_finalize_course', { p_user_id: student.user_id }, adminToken);

  const verified = await rest('student_verified_module_progress', `user_id=eq.${student.user_id}&track_code=eq.SOCAN&select=module_key,complete`);
  const m360 = await rest('m360_course_progress', `user_id=eq.${student.user_id}&select=accepted_artifact_count,course_complete,ready_to_finalize`);
  if (verified.length !== 12 || verified.some(row => !row.complete) || m360.length !== 1 || !m360[0].course_complete) fail('Writes completed but verification failed; inspect the returned durable records before retrying.');
  console.log(`Synthetic completion verified for ${studentId}: 12/12 technical modules and finalized M360. Tag: ${syntheticTag}`);
}
main().catch(err => fail(err.message));
