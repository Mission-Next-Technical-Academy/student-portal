#!/usr/bin/env node
/**
 * Controlled M360 synthetic completion runner.
 *
 * This is intentionally a dry run unless BOTH --execute and
 * --confirm-synthetic are supplied. It uses the same authenticated RPCs as
 * the portal and never uses service-role credentials or direct table writes.
 * It is scoped to exactly one explicitly named student_id (or user UUID).
 *
 * Required for --execute:
 *   M360_STUDENT_EMAIL, M360_STUDENT_PASSWORD
 *   M360_ADMIN_EMAIL, M360_ADMIN_PASSWORD
 *   SUPABASE_URL (optional; defaults to the production project)
 */

const BASE_URL = (process.env.SUPABASE_URL || 'https://eokvngifirjgfozzbieu.supabase.co').replace(/\/$/, '');
const ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_wTS7tUFTA6Jo9Du4OVHbqA_mg4jODzz';
const args = process.argv.slice(2);
const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const studentTarget = value('--student-id');
const execute = args.includes('--execute');
const confirmed = args.includes('--confirm-synthetic');

if (args.includes('--help') || !studentTarget) {
  console.log('Usage: node bin/m360-synthetic-complete.js --student-id <student_id|user_uuid> [--execute --confirm-synthetic]');
  console.log('Default mode validates configuration and prints the planned RPC sequence; it performs no writes.');
  process.exit(studentTarget ? 0 : 1);
}
if (execute && !confirmed) throw new Error('--execute requires --confirm-synthetic.');
if (execute && (!process.env.M360_STUDENT_EMAIL || !process.env.M360_STUDENT_PASSWORD || !process.env.M360_ADMIN_EMAIL || !process.env.M360_ADMIN_PASSWORD)) {
  throw new Error('Execution requires M360_STUDENT_EMAIL, M360_STUDENT_PASSWORD, M360_ADMIN_EMAIL, and M360_ADMIN_PASSWORD.');
}

const headers = (token) => ({ apikey: ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, options);
  const body = await response.text();
  let parsed; try { parsed = body ? JSON.parse(body) : null; } catch (_) { parsed = body; }
  if (!response.ok) throw new Error(`${path} (${response.status}): ${typeof parsed === 'string' ? parsed : JSON.stringify(parsed)}`);
  return parsed;
}
async function signIn(email, password) {
  const result = await request('/auth/v1/token?grant_type=password', {
    method: 'POST', headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!result.access_token) throw new Error('Authentication returned no access token.');
  return result.access_token;
}
async function rest(token, path) { return request(path, { headers: headers(token) }); }
async function rpc(token, name, params) {
  return request(`/rest/v1/rpc/${name}`, { method: 'POST', headers: headers(token), body: JSON.stringify(params) });
}

// These are deliberately authored, non-empty artifacts. The RPC validates the
// envelope and preserves the exact submitted snapshot for reviewer evidence.
const artifacts = [
  { direction: 'SOC analyst with an incident-response focus', nextStep: 'Complete a SIEM investigation lab and apply to two entry-level SOC roles.', strengths: ['calm triage', 'evidence-led analysis', 'clear handoffs'], evidence: 'A documented alert-triage exercise with a timeline and escalation rationale.', brandStatement: 'I turn noisy alerts into defensible next steps.' },
  { profileSignalBefore: 'General IT learner', changePlan: 'Align headline, About section, and skills to SOC analyst roles.', profileUrl: 'https://example.invalid/synthetic-m360-profile', targetDirection: 'SOC analyst', headline: 'Entry-Level SOC Analyst | Evidence-Led Triage', about: 'I investigate security signals, document evidence, and communicate clear next steps.', experienceRole: 'Security lab analyst', experienceBefore: 'Completed exercises.', experienceAfter: 'Investigated alerts and documented timelines.', experienceCapability: 'Evidence-led triage', reflectionStrongest: 'Specific target language', reflectionNeedsWork: 'Add measured outcomes', reflectionSupport: 'Peer review' },
  { targetRole: 'SOC analyst', outreachPlan: 'Send two specific, respectful informational interview requests each week.', messageDraft: 'Hello—your path into SOC work stood out to me. May I ask one question about your first 90 days?', followUpPlan: 'Send one concise follow-up after seven days.', reflection: 'Specific context makes outreach useful rather than transactional.' },
  { roleTarget: 'Junior SOC analyst', resumeSummary: 'Entry-level SOC analyst focused on evidence-led triage, documentation, and calm escalation.', experienceBullets: ['Investigated simulated alerts and preserved a clear evidence timeline.', 'Translated technical findings into concise handoff notes.'], skills: ['alert triage', 'incident documentation', 'log analysis'], revisionPlan: 'Ask a reviewer to check specificity and truthfulness.' },
  { interviewTarget: 'SOC analyst', story: 'I noticed a signal, checked the evidence, documented what I knew, and escalated the uncertainty clearly.', preparationPlan: 'Practice two STAR stories and one technical explanation.', answerExample: 'I would preserve evidence, scope impact, follow procedure, and communicate uncertainty.', reflection: 'I need to slow down enough to explain my reasoning.' },
  { careerNarrative: 'I am building toward SOC analyst work by pairing careful investigation with clear communication.', spotlightOutline: ['Target role', 'Evidence of preparation', 'Next 30-day action'], nextThirtyDays: 'Complete one investigation lab, request two informational interviews, and submit two tailored applications.', professionalCommunication: 'Concise, specific, and honest about current experience.' }
];
const rubric = (week) => week === 6
  ? { clarity: 18, relevance: 18, evidence: 18, application: 17, professional_communication: 18 }
  : { clarity: 23, relevance: 22, evidence: 22, application: 22 };

async function main() {
  console.log(`Target: ${studentTarget}`);
  console.log(execute ? 'MODE: EXECUTE (authenticated RPCs only)' : 'MODE: PLAN / DRY RUN (no network writes)');
  if (!execute) {
    console.log('Planned sequence: resolve enrolled non-admin SOCAN student; submit weeks 1-6; complete Start Here; admin-review weeks 1-6; record structured attendance; verify Career Spotlight; finalize; verify progress.');
    return;
  }

  const studentToken = await signIn(process.env.M360_STUDENT_EMAIL, process.env.M360_STUDENT_PASSWORD);
  const studentRows = await rest(studentToken, `/rest/v1/students?select=student_id,user_id,track_code,is_admin,is_enrolled,cohort_id&or=(student_id.eq.${encodeURIComponent(studentTarget)},user_id.eq.${encodeURIComponent(studentTarget)})`);
  if (studentRows.length !== 1) throw new Error(`Expected exactly one student match for ${studentTarget}; found ${studentRows.length}.`);
  const student = studentRows[0];
  if (student.is_admin || student.is_enrolled === false || student.track_code !== 'SOCAN' || !student.cohort_id) throw new Error('Refusing target: must be one enrolled, non-admin SOCAN student with a controlled cohort.');
  if (!student.user_id) throw new Error('Target student has no user_id.');
  if (studentTarget !== student.student_id && studentTarget !== student.user_id) throw new Error('Target resolution mismatch.');
  console.log(`Resolved exactly one target: ${student.student_id} (${student.user_id})`);

  for (let week = 1; week <= 6; week += 1) {
    await rpc(studentToken, 'm360_save_draft', { p_week_number: week, p_draft_payload: artifacts[week - 1], p_schema_version: 1 });
    await rpc(studentToken, 'm360_submit_week', { p_week_number: week, p_submitted_payload: artifacts[week - 1], p_schema_version: 1 });
    console.log(`Submitted M360 week ${week}.`);
  }
  await rpc(studentToken, 'm360_save_start_here', { p_payload: { networkingComfort: 5, interviewReadiness: 5, syntheticFixture: true }, p_complete: true, p_acknowledgments_complete: true, p_support_flag: false });

  const adminToken = await signIn(process.env.M360_ADMIN_EMAIL, process.env.M360_ADMIN_PASSWORD);
  const adminAuthUser = await request('/auth/v1/user', { headers: headers(adminToken) });
  const admins = await rest(adminToken, `/rest/v1/students?select=user_id,is_admin&user_id=eq.${encodeURIComponent(adminAuthUser.id)}`);
  if (admins.length !== 1 || !admins[0].is_admin) throw new Error('Refusing review: authenticated admin account is not marked is_admin.');
  for (let week = 1; week <= 6; week += 1) {
    await rpc(adminToken, 'm360_admin_review_week', { p_user_id: student.user_id, p_week_number: week, p_decision: 'accepted', p_rubric_scores: rubric(week), p_feedback: 'Synthetic fixture review: Meets Standard; retained for controlled QA.' });
    console.log(`Accepted M360 week ${week}.`);
  }
  await rpc(adminToken, 'm360_admin_set_attendance_evidence', { p_user_id: student.user_id, p_scheduled_minutes: 720, p_attended_minutes: 720, p_approved_equivalency_minutes: 0, p_last_date_of_attendance: new Date().toISOString().slice(0, 10), p_external_reference: `SYNTHETIC-M360-${student.student_id}`, p_notes: 'Controlled synthetic QA fixture; use only with institutional authorization.' });
  await rpc(adminToken, 'm360_admin_set_spotlight_presentation', { p_user_id: student.user_id, p_status: 'presented_live', p_reference: `SYNTHETIC-SPOTLIGHT-${student.student_id}` });
  const completion = await rpc(adminToken, 'm360_admin_finalize_course', { p_user_id: student.user_id });
  console.log(`Finalized M360 for exactly ${student.student_id}. Completion id: ${completion.id || '(returned)'}`);
}

main().catch((error) => { console.error(`ERROR: ${error.message}`); process.exitCode = 1; });
