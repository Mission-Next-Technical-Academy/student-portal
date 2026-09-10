/* Module 02 — isolated identity and network foundations lab.
 * All people, addresses, telemetry, and actions are fictional simulations.
 */

const MODULE_TWO_LAB_ID = 'm02-trust-path-review-v1';
const MODULE_TWO_FLAG = 'M02-TRUST-PATH-VALIDATED';
const MODULE_TWO_CATALOG_LAB_KEY = 'lab-identity-investigation';

const MODULE_TWO_DEFAULT_STATE = {
  activeStation: 'signins',
  reviewedStations: [],
  selectedEvidence: [],
  observation: '',
  analysis: '',
  decision: '',
  notes: '',
  breakdown: null,
  feedback: [],
  validationError: '',
  lastSubmittedAt: '',
  resetArmed: false,
  lessonWork: {},
  independentLab: { answers: {}, notes: '', attempts: 0, score: 0, completed: false, feedback: [] },
};

/* Each foundation concept now follows the Module 01 rhythm. The questions are
 * deliberately local to the MFA-fatigue/conditional-access case so the lesson
 * work is practice, not an additional time allocation. */
const MODULE_TWO_LESSON_LOOPS = [
  { id: 'network-paths', title: 'Network paths', scenario: 'Mission Next Labs sees a sign-in for acct-317 from a documentation-range address with no managed-device or approved VPN context.', theory: 'Read a path as source, destination, route, protocol, trust zone, and outcome. An unfamiliar address is a lead, not a verdict.', questions: [{ prompt: 'What should anchor the first comparison?', options: ['Route, device state, timing, and destination together', 'The address alone', 'The color of the alert'], correct: 0 }, { prompt: 'What does a successful connection prove?', options: ['Only that the control accepted the request', 'That the owner authorized it', 'That the device is safe'], correct: 0 }, { prompt: 'Which evidence is strongest?', options: ['Repeated path plus identity and resource context', 'A geographic guess', 'A single unfamiliar hostname'], correct: 0 }], task: 'Write one sentence naming the path facts you would verify before escalating acct-317.' },
  { id: 'identity-accounts', title: 'Identity and accounts', scenario: 'The same Mission Next account label appears in interactive sign-ins while a scheduled backup identity runs normally.', theory: 'Classify the identity before judging behavior. Human, service, device, and workload identities have different owners, schedules, and expected access patterns.', questions: [{ prompt: 'What comes first?', options: ['Confirm the identity type and owner', 'Disable every account', 'Assume the account is shared'], correct: 0 }, { prompt: 'Why baseline a service identity?', options: ['Predictable behavior makes deviations visible', 'Services never need review', 'It replaces authorization'], correct: 0 }, { prompt: 'What is an account label by itself?', options: ['A clue that needs context', 'Proof of compromise', 'Proof of approval'], correct: 0 }], task: 'Describe one context check that separates acct-317 from a normal scheduled workload identity.' },
  { id: 'authentication', title: 'Authentication', scenario: 'acct-317 receives two denied MFA prompts, then succeeds through a legacy exception from an unmanaged browser.', theory: 'Authentication tells you which proof was accepted or denied; it does not by itself establish authorization or user intent.', questions: [{ prompt: 'Which sequence merits review?', options: ['Denied stronger factor followed by weaker success', 'One approved security-key sign-in', 'A scheduled certificate renewal'], correct: 0 }, { prompt: 'What does MFA denial show?', options: ['A control blocked that attempt', 'The account is safe', 'The user is malicious'], correct: 0 }, { prompt: 'What should follow the pattern?', options: ['Verify with the user and correlate session context', 'Close the case', 'Block all addresses'], correct: 0 }], task: 'Write the authentication sequence in order and state what remains unproven.' },
  { id: 'authorization', title: 'Authorization', scenario: 'Minutes after the suspicious sign-in, acct-317 changes from Reports Reader to Network Configuration Operator without an approval record.', theory: 'Authorization asks what the authenticated identity may do. A valid sign-in and an approved role change are separate evidence questions.', questions: [{ prompt: 'What makes this role change concerning?', options: ['Sensitive scope with no matching approval', 'The role name is long', 'The sign-in succeeded'], correct: 0 }, { prompt: 'What should an analyst correlate?', options: ['Identity, time, requested scope, owner, and approval', 'Only the role label', 'Only the source address'], correct: 0 }, { prompt: 'What is a proportionate record?', options: ['Document the change and escalate for authorized review', 'Delete the role history', 'Disable unrelated accounts'], correct: 0 }], task: 'Name the authorization evidence that would make the role change explainable.' },
  { id: 'mfa', title: 'MFA', scenario: 'A Mission Next administrator reports an unexpected burst of push prompts and denies every prompt.', theory: 'MFA adds an independent proof, but push fatigue can exploit user approval habits. Treat repeated unsolicited prompts as a signal to verify and protect the account.', questions: [{ prompt: 'What does repeated denial suggest?', options: ['Someone may be attempting sign-in with a valid password', 'The account is definitely safe', 'The phone is compromised'], correct: 0 }, { prompt: 'What should the analyst avoid?', options: ['Calling every denied prompt proof of compromise', 'Verifying with the user', 'Reviewing conditional access'], correct: 0 }, { prompt: 'What control review fits this case?', options: ['MFA method, number matching/strong factor, and policy coverage', 'Perimeter IP blocking only', 'Removing all MFA'], correct: 0 }], task: 'Draft a two-sentence user-verification and protection recommendation for the administrator.' },
  { id: 'rbac-least-privilege', title: 'RBAC and least privilege', scenario: 'The suspicious account now has a role that can change network policy, although its normal work only requires report reading.', theory: 'Role-based access should match job need, approval, and scope. Least privilege reduces blast radius; it does not mean every user has identical access.', questions: [{ prompt: 'What is the key comparison?', options: ['Granted permission versus documented job need', 'Role color versus department', 'Account age versus username'], correct: 0 }, { prompt: 'What evidence supports a legitimate grant?', options: ['A request, approver, purpose, and bounded scope', 'A successful password', 'A familiar display name'], correct: 0 }, { prompt: 'What should be preserved?', options: ['The role-change record and approval history', 'Only the latest sign-in', 'No records'], correct: 0 }], task: 'State the least-privilege concern in the acct-317 case without claiming more impact than the evidence shows.' },
  { id: 'pki', title: 'PKI', scenario: 'A service certificate renewal appears beside the human account investigation, but it follows a scheduled backup path and change record.', theory: 'Certificates bind cryptographic proof to an identity or system. Validate subject, issuer, intended use, expiry, and workload context before classifying activity.', questions: [{ prompt: 'What makes the renewal plausibly normal?', options: ['Expected service, schedule, path, and change reference align', 'Certificates are always trusted', 'It happened at night'], correct: 0 }, { prompt: 'What should be checked?', options: ['Subject, issuer, use, expiry, and owner', 'Only the certificate color', 'Only the IP address'], correct: 0 }, { prompt: 'How should it affect acct-317 review?', options: ['Keep the cases separate unless evidence links them', 'Treat it as proof of compromise', 'Ignore all certificates'], correct: 0 }], task: 'List two PKI fields and one workload-context check you would record.' },
  { id: 'zero-trust', title: 'Zero Trust reasoning', scenario: 'The response team must decide whether a conditional-access change should affect one risky identity or all remote users.', theory: 'Evaluate every request using identity, device, location, resource, and current risk. Apply the smallest control supported by evidence and verify its result.', questions: [{ prompt: 'What is the Zero Trust starting point?', options: ['No request is trusted solely because of network location', 'Inside the network means trusted', 'Outside means malicious'], correct: 0 }, { prompt: 'What makes a control proportionate?', options: ['It matches evidence, scope, impact, and authority', 'It is the broadest available action', 'It is the fastest button'], correct: 0 }, { prompt: 'What closes the loop?', options: ['Verify the control outcome and document remaining uncertainty', 'Delete the alert', 'Assume the change worked'], correct: 0 }], task: 'Recommend one scoped conditional-access review for acct-317 and name the verification signal.' },
];

const MODULE_TWO_INDEPENDENT_LAB = {
  title: 'Independent lab: MFA push-bombing and conditional-access review',
  caseId: 'CASE-MN-317',
  scenario: 'Mission Next Labs administrator acct-317 reports unsolicited MFA push prompts. One prompt was denied, a legacy exception later succeeded, and a conditional-access policy currently excludes a small legacy group. Decide what to verify and how to recommend a scoped policy review.',
  questions: [
    { id: 'signal', label: 'What is the strongest initial signal?', options: [{ id: 'push', text: 'Unsolicited repeated prompts plus a later weaker-method success' }, { id: 'geo', text: 'The documentation-range address alone' }, { id: 'none', text: 'No signal because the first prompt was denied' }], correct: 'push' },
    { id: 'scope', label: 'What should the policy review target first?', options: [{ id: 'acct', text: 'acct-317 and the legacy-exception path, with affected resources identified' }, { id: 'all', text: 'Every remote user immediately' }, { id: 'ip', text: 'Only the synthetic source address' }], correct: 'acct' },
    { id: 'verify', label: 'What is the best verification step?', options: [{ id: 'verify', text: 'Confirm user activity, inspect sign-in/session records, and test the intended policy outcome through an authorized change path' }, { id: 'close', text: 'Close after the password reset request is sent' }, { id: 'delete', text: 'Delete the conditional-access exclusion' }], correct: 'verify' },
  ],
};

const MODULE_TWO_FOUNDATIONS = [
  { icon: 'ri-route-line', title: 'Network paths', summary: 'A connection has a source, destination, route, protocol, and outcome.', detail: 'Analysts compare the observed path with expected business routes. An unfamiliar address alone is weak evidence; the device, route, authentication result, and role of the destination add meaning.' },
  { icon: 'ri-user-key-line', title: 'Identity and accounts', summary: 'An identity represents a person, service, device, or workload.', detail: 'Human and service identities behave differently. A scheduled certificate-based service sign-in may be normal while an interactive human sign-in at that hour may deserve review.' },
  { icon: 'ri-login-box-line', title: 'Authentication', summary: 'Authentication answers: who or what proved its identity?', detail: 'Passwords, certificates, security keys, and one-time factors are authentication methods. A success means a control accepted the proof; it does not prove the activity was authorized by the owner.' },
  { icon: 'ri-key-2-line', title: 'Authorization', summary: 'Authorization answers: what is the authenticated identity allowed to do?', detail: 'Roles and permissions govern access after sign-in. Analysts distinguish a sign-in event from a later access change and then assess whether the combination increases risk.' },
  { icon: 'ri-shield-keyhole-line', title: 'MFA', summary: 'Multiple independent factors reduce reliance on a password alone.', detail: 'A denied prompt can be a user mistake, but repeated denials followed by a password-only success from an unmanaged device form a stronger suspicious pattern.' },
  { icon: 'ri-team-line', title: 'RBAC and least privilege', summary: 'Roles group permissions around job needs; least privilege limits excess access.', detail: 'A role assignment should have an approved purpose, appropriate scope, and accountable requester. High-impact access without a matching request deserves escalation.' },
  { icon: 'ri-fingerprint-line', title: 'PKI', summary: 'Certificates bind cryptographic proof to an identity or system.', detail: 'Certificate use is context, not an automatic verdict. Validate the subject, issuer, intended use, expiry, and whether the activity matches the workload schedule.' },
  { icon: 'ri-focus-3-line', title: 'Zero Trust reasoning', summary: 'Evaluate each request using identity, device, location, resource, and current risk.', detail: 'Network location is only one signal. A sound decision combines several independent facts and applies a proportionate control to the affected scope.' },
];

const MODULE_TWO_LAB = {
  title: 'Trust-path review: unexpected privileged access',
  minutes: 180,
  passingScore: 70,
  scenario: 'A routine access review found several unusual-looking records. Determine which pattern requires escalation without treating every unfamiliar event as malicious.',
  stations: [
    { id: 'signins', label: 'Sign-ins', icon: 'ri-login-circle-line', instruction: 'Compare identity type, method, device state, and outcome. Select records that materially support your conclusion.' },
    { id: 'network', label: 'Network context', icon: 'ri-router-line', instruction: 'Interpret the route and zone together. A documentation-range address is used so this simulation cannot point at a real system.' },
    { id: 'access', label: 'Access changes', icon: 'ri-admin-line', instruction: 'Look for role changes, approval references, scope, and whether the change fits the identity.' },
    { id: 'guardrail', label: 'Decision guardrail', icon: 'ri-shield-check-line', instruction: 'Use the policy card to choose a proportionate next step. This lab records a recommendation; it performs no real response action.' },
  ],
  signins: [
    { id: 'evt-317-mfa', identity: 'IDN-317', time: '09:12', method: 'Password + MFA prompts', context: 'Two prompts denied · unmanaged browser', outcome: 'Denied', risk: true },
    { id: 'evt-317-success', identity: 'IDN-317', time: '09:15', method: 'Password only · legacy exception', context: 'Unmanaged browser · no registered session', outcome: 'Success', risk: true },
    { id: 'evt-204-vpn', identity: 'IDN-204', time: '09:18', method: 'Password + security key', context: 'Managed laptop · approved VPN egress', outcome: 'Success', risk: false },
    { id: 'evt-svc-cert', identity: 'SVC-082', time: '09:20', method: 'Workload certificate', context: 'Internal backup segment · scheduled task', outcome: 'Success', risk: false },
    { id: 'evt-451-fail', identity: 'IDN-451', time: '09:24', method: 'Password', context: 'Managed laptop · usual office route', outcome: 'One failure, then success with MFA', risk: false },
  ],
  network: [
    { id: 'net-317-external', identity: 'IDN-317', source: '198.51.100.44', route: 'External → identity gateway', zone: 'No corporate VPN or managed-device association', risk: true },
    { id: 'net-204-vpn', identity: 'IDN-204', source: '203.0.113.18', route: 'Approved VPN → collaboration service', zone: 'Known egress · compliant device', risk: false },
    { id: 'net-svc-internal', identity: 'SVC-082', source: '10.24.8.12', route: 'Backup segment → archive service', zone: 'Expected internal service path', risk: false },
  ],
  access: [
    { id: 'role-317-admin', identity: 'IDN-317', time: '09:22', change: 'Reports Reader → Network Configuration Operator', approval: 'No matching request or owner approval', scope: 'Production network policy', risk: true },
    { id: 'role-204-reader', identity: 'IDN-204', time: '09:28', change: 'Added Collaboration Reports Reader', approval: 'REQ-4408 · manager approved', scope: 'Reporting only', risk: false },
    { id: 'role-svc-renew', identity: 'SVC-082', time: '02:00', change: 'Workload certificate renewed', approval: 'CHG-7311 · scheduled maintenance', scope: 'Backup service', risk: false },
  ],
  correctEvidence: ['evt-317-mfa', 'evt-317-success', 'net-317-external', 'role-317-admin'],
  observationOptions: [
    { id: 'idn-317', text: 'IDN-317 — correlate the sign-in sequence with the later privileged role change' },
    { id: 'idn-204', text: 'IDN-204 — the public VPN egress address is unfamiliar' },
    { id: 'svc-082', text: 'SVC-082 — certificate authentication is always suspicious' },
    { id: 'idn-451', text: 'IDN-451 — any failed password means compromise' },
  ],
  analysisOptions: [
    { id: 'likely-compromise', text: 'Likely compromised identity with unauthorized privilege expansion', help: 'Several independent identity, device, route, and authorization facts agree.' },
    { id: 'benign-travel', text: 'Benign travel through an approved corporate route', help: 'This would require known VPN and device context that the target identity lacks.' },
    { id: 'network-outage', text: 'Network availability problem', help: 'The records show successful access and a role change, not a service interruption.' },
    { id: 'certificate-failure', text: 'Expired service certificate', help: 'The service identity succeeded on its expected scheduled path.' },
  ],
  decisionOptions: [
    { id: 'escalate-protect', text: 'Escalate IDN-317, preserve the selected records, and request the approved identity-protection and role-review procedure', help: 'This limits the recommendation to the affected identity and privileged change.' },
    { id: 'disable-all', text: 'Disable every identity shown in the review', help: 'The evidence does not support broad disruption.' },
    { id: 'block-documentation-range', text: 'Block all documentation-range addresses at the perimeter', help: 'The addresses are synthetic labels here, and IP-only blocking does not resolve the identity risk.' },
    { id: 'close-as-noise', text: 'Close the review because the sign-in eventually succeeded', help: 'A successful sign-in can increase concern when surrounding context is unauthorized.' },
  ],
};

const MODULE_TWO_QUIZ_BANKS = [
  {
    conceptId: 'network-paths',
    conceptTitle: 'Network paths',
    questions: [
      {
        id: 'm02-q-net-1',
        prompt: 'An analyst reviews a sign-in event from a user account with an IP address registered in a different country from the user\'s usual location. The account successfully authenticated with the user\'s known password and security key. What is the BEST immediate assessment?',
        options: [
          { id: 'a', text: 'Immediately disable the account because international IP access is always suspicious.' },
          { id: 'b', text: 'The unusual geographic location is one signal among several; authentication method, device state, and resource access should be evaluated together with the network context.' },
          { id: 'c', text: 'The strong authentication (password + security key) proves the access is authorized, so the IP location is irrelevant.' },
          { id: 'd', text: 'Flag this as a routine travel event and take no further action.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'A network path is one signal. Correlate it with identity, authentication method, device, resource, and authorization to form a complete picture.',
        feedbackIncorrect: 'Geographic IP location alone does not determine risk. Combine it with other evidence: authentication success, device state, role accessed, and timing patterns.',
      },
      {
        id: 'm02-q-net-2',
        prompt: 'A service account connects to a database server from a source IP in a documented internal subnet, during scheduled maintenance hours. The authentication uses a trusted certificate. Why should this access be considered normal?',
        options: [
          { id: 'a', text: 'Service accounts never need review because they are non-human.' },
          { id: 'b', text: 'The route (internal subnet), timing (scheduled), method (certificate), and context (maintenance) all align with expected behavior for that service.' },
          { id: 'c', text: 'Only password-based authentication requires review; certificate access is always safe.' },
          { id: 'd', text: 'IP addresses are the only factor that matters for network trust decisions.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Expected behavior includes route, timing, method, and resource context. When all align, the access fits the known pattern.',
        feedbackIncorrect: 'Service accounts still require monitoring. Correlate the network path with the expected schedule, authentication method, and resource being accessed.',
      },
      {
        id: 'm02-q-net-3',
        prompt: 'Two sign-in attempts from the same user occur 15 minutes apart from IP addresses in different geographic regions, both using the device-based MFA. What is the MOST relevant technical question for the analyst?',
        options: [
          { id: 'a', text: 'Can the user physically travel between two regions in 15 minutes using an aircraft?' },
          { id: 'b', text: 'Does the organization have documented business reasons for users to access from both regions?' },
          { id: 'c', text: 'Is it technically possible for a single device or VPN connection to appear from two different geographic locations in that timeframe?' },
          { id: 'd', text: 'What is the user\'s salary level?' },
        ],
        correctId: 'c',
        feedbackCorrect: 'Impossible travel is a pattern worth investigating. Understanding whether the network path is feasible (VPN, cloud services, mobile networks) helps distinguish attack from legitimate travel.',
        feedbackIncorrect: 'Analyze the network feasibility: VPN, roaming mobile networks, and cloud edge services can make geographic shifts appear instantly. Distinguish technical possibility from user behavior.',
      },
      {
        id: 'm02-q-net-4',
        prompt: 'A user successfully authenticates from the organization\'s main office network but accesses a sensitive financial system. The same user then makes an identical access request from a home IP address using a personal VPN service. Which factor MOST increases the risk profile?',
        options: [
          { id: 'a', text: 'The use of a VPN means the user is trying to hide and is therefore malicious.' },
          { id: 'b', text: 'The organization cannot verify the user\'s device status, network security, and authentication posture from an unmanaged remote access point, making it harder to trust the request.' },
          { id: 'c', text: 'Home networks are always less secure than office networks.' },
          { id: 'd', text: 'The financial system is accessed from two different locations.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Unknown device state and network posture increase risk. The organization cannot verify security controls on an unmanaged device or network.',
        feedbackIncorrect: 'VPN use alone does not indicate malice. The issue is visibility: from an unmanaged network, the analyst has less assurance of device and network security.',
      },
    ],
  },
  {
    conceptId: 'identity-accounts',
    conceptTitle: 'Identity and accounts',
    questions: [
      {
        id: 'm02-q-id-1',
        prompt: 'An analyst sees sign-in events for an account during a time when the employee is known to be on vacation with no network access. What should the analyst consider first?',
        options: [
          { id: 'a', text: 'The account is definitely compromised and must be disabled immediately.' },
          { id: 'b', text: 'Verify the business context: Is this a service account, a shared account, or an account that might be accessed by a delegate or admin on the employee\'s behalf?' },
          { id: 'c', text: 'Time zone differences might explain the activity, so no investigation is needed.' },
          { id: 'd', text: 'Vacation status is irrelevant to security analysis.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correlate the identity type and business context with the activity. Service accounts, shared resources, and administrative actions have different risk profiles than human accounts acting alone.',
        feedbackIncorrect: 'Unexpected timing is a signal. Determine what identity type this is and whether delegation or service behavior could explain the activity.',
      },
      {
        id: 'm02-q-id-2',
        prompt: 'An organization uses both human user accounts and service accounts to access a shared database. A security review finds that both types use the same authentication method (simple username/password stored in a configuration file). Which statement BEST describes the risk difference?',
        options: [
          { id: 'a', text: 'Human accounts and service accounts are equivalent; there is no difference in risk.' },
          { id: 'b', text: 'Service accounts are used by automated systems and follow predictable patterns; human accounts are used by people and show variable patterns. Applying different trust levels to each is appropriate.' },
          { id: 'c', text: 'Service accounts are less risky because they are non-human.' },
          { id: 'd', text: 'Human accounts should never be used for database access.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Service and human identities behave differently. Scheduled tasks have predictable access patterns; human users show variable times, devices, and locations. Analyze each type according to its expected behavior.',
        feedbackIncorrect: 'Human and service identities have different behavior profiles. A human account logging in at 3 AM from a new location is more surprising than a nightly service backup.',
      },
      {
        id: 'm02-q-id-3',
        prompt: 'An account used for administrative tasks shows sign-in events every 24 hours at exactly the same time, using the same device, from the same location, and always accessing the same systems. This pattern has been consistent for six months. Why is this pattern valuable for anomaly detection?',
        options: [
          { id: 'a', text: 'Scheduled administrative activity is suspicious and should be investigated.' },
          { id: 'b', text: 'The predictable pattern provides a baseline; any deviation (different time, device, system, or location) is a stronger signal of compromise than random variation would be.' },
          { id: 'c', text: 'Patterns are irrelevant; only the individual event matters.' },
          { id: 'd', text: 'Six months of history is too old to be useful.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Baseline behavior provides context for anomalies. A deviation from a known pattern is a stronger signal than comparison to an average of inconsistent behavior.',
        feedbackIncorrect: 'Behavioral patterns are one of the strongest signals for anomaly detection. Deviations from established baselines deserve investigation.',
      },
      {
        id: 'm02-q-id-4',
        prompt: 'A contractor account and a full-time employee account both attempt to access the same sensitive resource at the same time with valid credentials and the same IP address. What FIRST factor should the analyst verify?',
        options: [
          { id: 'a', text: 'Both accounts should be disabled immediately because multiple accounts are accessing the same resource.' },
          { id: 'b', text: 'The identity type and business justification: Is there a legitimate business reason for the contractor to have access to this resource alongside the employee?' },
          { id: 'c', text: 'The IP address must be fraudulent because it is used by two different people.' },
          { id: 'd', text: 'The employee\'s account must be compromised if a contractor can access the same systems.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correlate identity type with authorization scope. A contractor may have legitimate access to the same systems as an employee under specific conditions.',
        feedbackIncorrect: 'Different identity types have different approval and authorization requirements. Evaluate whether the contractor access is approved and scoped correctly.',
      },
    ],
  },
  {
    conceptId: 'authentication',
    conceptTitle: 'Authentication',
    questions: [
      {
        id: 'm02-q-auth-1',
        prompt: 'A user\'s account shows two sign-in attempts 30 seconds apart: the first fails with "invalid password," and the second succeeds with "legacy exception." Which pattern MOST suggests a compromise attempt?',
        options: [
          { id: 'a', text: 'The failed attempt alone proves an attack.' },
          { id: 'b', text: 'The sequence of a failed stronger method followed by a weaker method succeeding is a common attack pattern: attempting forced authentication bypass when stronger authentication is denied.' },
          { id: 'c', text: 'A successful sign-in with a legacy exception is always safe.' },
          { id: 'd', text: 'Two sign-in attempts 30 seconds apart is normal behavior.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'A sequence matters: denied MFA followed by weak-method success suggests an attacker bypassing strong authentication after it failed.',
        feedbackIncorrect: 'Correlate authentication method sequences. A shift from strong to weak authentication after a denial is a warning sign.',
      },
      {
        id: 'm02-q-auth-2',
        prompt: 'An organization uses hardware security keys for high-risk accounts but passwords for general accounts. A compromise investigation finds that 50 accounts with hardware keys were breached, but no password-only accounts were touched. What inference is REASONABLE?',
        options: [
          { id: 'a', text: 'Hardware keys are less secure than passwords.' },
          { id: 'b', text: 'An insider who has physical access to stolen keys, or a targeted attack on the key enrollment system, is a more likely explanation than password compromise, because the hardware key requirement should have prevented a simpler attack.' },
          { id: 'c', text: 'Password-only accounts are more secure than key-protected accounts.' },
          { id: 'd', text: 'The hardware keys are useless and should be replaced with passwords.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'When a strong authentication method is bypassed, the attack vector must be sophisticated enough to match the method. Physical key theft or internal compromise are more likely than password guessing.',
        feedbackIncorrect: 'When the strongest authentication method is compromised but weaker alternatives are not, consider supply-chain, insider, or system-level attacks, not user-level password guessing.',
      },
      {
        id: 'm02-q-auth-3',
        prompt: 'A user denies an MFA prompt on their registered device, then 10 minutes later successfully signs in using a password from a different device without any MFA. Which FIRST step should the analyst take?',
        options: [
          { id: 'a', text: 'Assume the MFA denial was a mistake and take no action.' },
          { id: 'b', text: 'Contact the user to confirm whether they initiated the denied MFA attempt and whether they are aware of the subsequent sign-in from a new device.' },
          { id: 'c', text: 'Immediately disable the user\'s account.' },
          { id: 'd', text: 'MFA denials and legacy sign-ins are unrelated events.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Verify with the user first. A denied MFA followed by a legacy sign-in could be user error, but it could also indicate an attacker trying methods in sequence.',
        feedbackIncorrect: 'Denied MFA and subsequent weak-auth success can indicate an attacker testing methods. Verify with the user before assuming it is innocent.',
      },
      {
        id: 'm02-q-auth-4',
        prompt: 'Your organization\'s authentication logs show that 200 sign-in attempts occurred with valid credentials in the past hour, but the organization has only 150 employees. Which investigation step is FIRST?',
        options: [
          { id: 'a', text: 'Disable all accounts because there is clearly a mass compromise.' },
          { id: 'b', text: 'Check whether service accounts, automation, or legitimate retries after brief failures could account for the extra sign-in count before assuming a breach.' },
          { id: 'c', text: 'All 200 attempts are definitely fraudulent.' },
          { id: 'd', text: 'Sign-in counts are irrelevant to security analysis.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correlate authentication volume with business context. Scheduled tasks, automated retries, and service accounts can explain high sign-in counts.',
        feedbackIncorrect: 'A high authentication volume is a signal to investigate context, not automatically proof of breach. Consider legitimate system activity first.',
      },
    ],
  },
  {
    conceptId: 'authorization',
    conceptTitle: 'Authorization',
    questions: [
      {
        id: 'm02-q-authz-1',
        prompt: 'A role change grants a user access to production databases. No matching change request or manager approval record exists in the system. Why is the absence of approval documentation a critical signal?',
        options: [
          { id: 'a', text: 'Approval documentation is optional.' },
          { id: 'b', text: 'A role change affecting sensitive resources should follow an approval workflow. The absence of documentation means the change happened outside normal authorization controls, which is a governance and compliance violation.' },
          { id: 'c', text: 'IT administrators never need approval to grant access.' },
          { id: 'd', text: 'Documentation is only needed for denials, not approvals.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Authorization accountability requires documented approval. A role change without a matching request or approval is a red flag that it bypassed the control process.',
        feedbackIncorrect: 'Privilege escalation should follow an approval process. No documentation means the change is not properly authorized or auditable.',
      },
      {
        id: 'm02-q-authz-2',
        prompt: 'A user who works in the Finance department is suddenly granted Network Administrator role. The change request references cost optimization, and the user has never had IT training. What should the analyst assess?',
        options: [
          { id: 'a', text: 'Role changes always make sense and should never be questioned.' },
          { id: 'b', text: 'Whether the role scope and user background align with legitimate business need. A Finance employee with no IT training suddenly granted administrator privileges suggests the change may have been unauthorized or mistargeted.' },
          { id: 'c', text: 'Cost optimization always justifies any role change.' },
          { id: 'd', text: 'The user\'s job function is irrelevant to authorization.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Evaluate whether a role assignment fits the person\'s job function and whether they have the skills and oversight needed for that responsibility.',
        feedbackIncorrect: 'A role change should align with job function and business justification. A mismatch between the user\'s role and the new privileges deserves escalation.',
      },
      {
        id: 'm02-q-authz-3',
        prompt: 'Two users in the same department have the same job title but different access levels to company resources. User A can read customer data but not export it. User B can read and export customer data. Why is this variance worth investigating?',
        options: [
          { id: 'a', text: 'Access levels should be identical for all employees with the same job title.' },
          { id: 'b', text: 'Access level differences should correspond to documented authorization justifications. If there is no business reason for the difference, it may indicate over-provisioning, unauthorized escalation, or a control gap.' },
          { id: 'c', text: 'Different access levels are always random and do not warrant investigation.' },
          { id: 'd', text: 'Data export is never relevant to security analysis.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Access variance should have documented business justification. Unexplained differences indicate either over-provisioning or unauthorized escalation.',
        feedbackIncorrect: 'Role-based access control should be consistent. Unexplained access differences warrant an audit of the authorization basis.',
      },
      {
        id: 'm02-q-authz-4',
        prompt: 'An analyst reviews a 30-day history and finds that a contractor account\'s permissions have been changed eight times, each time granting access to new systems without the contractor requesting access. What is the MOST concerning aspect?',
        options: [
          { id: 'a', text: 'Contractor accounts should be deleted.' },
          { id: 'b', text: 'The contractor did not request the access changes, suggesting either a mistake, an authorization process failure, or unauthorized modification of the account. Contractors should request access, and IT should approve and track each change.' },
          { id: 'c', text: 'Permissions changes never matter for contractors.' },
          { id: 'd', text: 'Eight permission changes over 30 days is a normal rate.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Each authorization change should have a documented request and approval. Unsolicited access grants suggest the control process is failing or being bypassed.',
        feedbackIncorrect: 'Untracked authorization changes indicate a control failure. Every access grant should be authorized and recorded by the requester and approver.',
      },
    ],
  },
  {
    conceptId: 'mfa',
    conceptTitle: 'MFA',
    questions: [
      {
        id: 'm02-q-mfa-1',
        prompt: 'A user\'s account shows three failed MFA prompt attempts over 2 minutes, followed immediately by a successful sign-in without MFA using a legacy exception. What does this pattern suggest?',
        options: [
          { id: 'a', text: 'The user forgot their MFA device at home, so the legacy exception is appropriate.' },
          { id: 'b', text: 'The user might be having a legitimate device issue, but the pattern of denied MFA followed by weak-auth success is also consistent with an attacker attempting to bypass stronger authentication.' },
          { id: 'c', text: 'MFA failures are always innocent and require no further review.' },
          { id: 'd', text: 'The legacy exception means the account is compromised.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Repeated MFA denials followed by weaker authentication success can indicate either user error or an attacker testing methods. Verify with the user.',
        feedbackIncorrect: 'Denied MFA attempts followed by legacy-method success is a warning pattern. It could be user error, but it requires user confirmation.',
      },
      {
        id: 'm02-q-mfa-2',
        prompt: 'Your organization sends MFA prompts to users\' registered devices. An investigation finds that a user was sent 50 MFA prompts in one hour, and the user denies initiating any sign-in attempts. What is the MOST likely explanation?',
        options: [
          { id: 'a', text: 'The MFA system is malfunctioning and all prompts are false positives.' },
          { id: 'b', text: 'An attacker obtained or guessed the user\'s password and is attempting repeated sign-ins while the legitimate user is denying each MFA prompt. The high volume of denials is a strong signal of active attack.' },
          { id: 'c', text: 'The user is lying and actually initiated the attempts.' },
          { id: 'd', text: 'High MFA prompt volumes are normal behavior.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Repeated MFA prompts that a user did not initiate indicate an attacker is attempting to authenticate with the correct password but lacks the second factor. The denied prompts are the MFA system working as designed.',
        feedbackIncorrect: 'A high volume of unauthorized MFA prompts signals an active attack. The user denying each prompt means the account is not being compromised, but the password is known to an attacker.',
      },
      {
        id: 'm02-q-mfa-3',
        prompt: 'An organization requires MFA for administrative accounts but not for general user accounts. An incident investigation finds that an attacker gained access to a general user account and used it to access sensitive non-administrative systems. Why was MFA not a defense in this scenario?',
        options: [
          { id: 'a', text: 'MFA would not have helped because the attacker had the password.' },
          { id: 'b', text: 'The organization\'s MFA policy only protected administrative accounts. General user accounts lacked MFA protection, so a password compromise was sufficient for the attacker to gain access.' },
          { id: 'c', text: 'MFA is ineffective and should not be used.' },
          { id: 'd', text: 'The user should not have had access to sensitive systems.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'MFA\'s protection depends on which accounts require it. Limiting MFA to administrative accounts leaves general user accounts vulnerable to password compromise.',
        feedbackIncorrect: 'MFA coverage should align with risk. An account with access to sensitive data benefits from MFA protection, whether or not it is an administrative account.',
      },
      {
        id: 'm02-q-mfa-4',
        prompt: 'A user reports that they received MFA prompts on their device at night, but they did not attempt to sign in. The user approved two of the prompts by mistake before realizing the activity was not legitimate. What should the analyst recommend?',
        options: [
          { id: 'a', text: 'No action is needed because the user approved the prompts, so the access is legitimate.' },
          { id: 'b', text: 'The attacker has both the password and the second factor (because the user approved the prompts), so the account is likely fully compromised. Immediate password reset, session termination, and access review are needed.' },
          { id: 'c', text: 'Only administrative accounts can be compromised this way.' },
          { id: 'd', text: 'User approval of MFA prompts always means the access is legitimate.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'If an attacker triggered MFA prompts and the user mistakenly approved them, the attacker now has an authenticated session. This is a serious compromise indicator.',
        feedbackIncorrect: 'An attacker who can trigger MFA prompts and trick the user into approving them has gained an authenticated session. This requires immediate password reset and session termination.',
      },
    ],
  },
  {
    conceptId: 'rbac-privilege',
    conceptTitle: 'RBAC and least privilege',
    questions: [
      {
        id: 'm02-q-rbac-1',
        prompt: 'A user\'s role includes permissions for reading reports, writing reports, approving reports, and deleting reports. The user\'s job function is to write daily status reports. Why might this role assignment violate least privilege?',
        options: [
          { id: 'a', text: 'The user has more permissions than necessary to perform their job, including deletion and approval authority they do not need.' },
          { id: 'b', text: 'Least privilege is not a real security principle.' },
          { id: 'c', text: 'A user\'s job function is irrelevant to permission assignment.' },
          { id: 'd', text: 'The user should have even more permissions for greater efficiency.' },
        ],
        correctId: 'a',
        feedbackCorrect: 'Least privilege means a user has only the permissions needed for their role. Excess permissions (deletion, approval) should be removed if not necessary.',
        feedbackIncorrect: 'Least privilege limits access to what is needed. Over-provisioned accounts increase the blast radius if the account is compromised.',
      },
      {
        id: 'm02-q-rbac-2',
        prompt: 'An analyst reviews role assignments and finds that 30% of users in an organization have administrative privileges, but only 5% of them use those privileges in their daily work. What is the FIRST recommended action?',
        options: [
          { id: 'a', text: 'Remove administrative privileges from users who do not regularly use them and require them to request elevation for specific tasks when needed.' },
          { id: 'b', text: 'Administrators are special and should never have their privileges questioned.' },
          { id: 'c', text: 'If users have administrative access, they should use it every day.' },
          { id: 'd', text: 'Over-provisioning is a security best practice.' },
        ],
        correctId: 'a',
        feedbackCorrect: 'Privileges should match need. Users with infrequently used high-level access should use just-in-time elevation instead of standing privileges.',
        feedbackIncorrect: 'High privilege standing access that is infrequently used increases risk without benefit. Just-in-time elevation is a better practice.',
      },
      {
        id: 'm02-q-rbac-3',
        prompt: 'An organization uses two role models: (1) a single "Super Admin" role with access to all systems, and (2) granular role-based permissions with specific scope. Why would granular RBAC be preferred for incident response?',
        options: [
          { id: 'a', text: 'Super Admin roles are more secure because they give users full access.' },
          { id: 'b', text: 'Granular roles limit the blast radius of a compromise. If a Super Admin account is compromised, an attacker has access to everything. If granular roles are used, a compromised account has access only to its assigned systems.' },
          { id: 'c', text: 'Scope does not matter to security analysis.' },
          { id: 'd', text: 'Granular roles make incident investigation harder.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Granular RBAC limits blast radius. A compromised narrow-scope role affects only that scope; a compromised super-admin role affects the entire organization.',
        feedbackIncorrect: 'Broad roles increase blast radius in case of compromise. Granular, scoped roles limit the damage a single compromised account can cause.',
      },
      {
        id: 'm02-q-rbac-4',
        prompt: 'A user requests permanent elevation to a sensitive role, stating they will need it "eventually" for future projects. The current project has no requirement for that access. What should the access manager decide?',
        options: [
          { id: 'a', text: 'Grant the access now because the user might need it later.' },
          { id: 'b', text: 'Approve access only for the current confirmed need. When the user has a specific project that requires the sensitive role, they should request it again with business justification.' },
          { id: 'c', text: 'Speculatively granting access violates no principles.' },
          { id: 'd', text: 'Users should always have maximum access.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Principle of least privilege: grant access only for current, documented needs. Future needs warrant future requests with current justification.',
        feedbackIncorrect: 'Anticipatory access grants violate least privilege. Access should match current role and responsibility, not possible future needs.',
      },
    ],
  },
  {
    conceptId: 'pki',
    conceptTitle: 'PKI',
    questions: [
      {
        id: 'm02-q-pki-1',
        prompt: 'A service account authenticates using a certificate issued by the organization\'s internal PKI. The certificate was issued two years ago and will expire in two months. Why is the expiration date relevant to a security review?',
        options: [
          { id: 'a', text: 'Certificate expiration is always a sign of a security breach.' },
          { id: 'b', text: 'An expired certificate will break service continuity. The organization should renew the certificate on schedule to avoid service interruption, and a stale or unrenewed certificate might indicate a control or monitoring gap.' },
          { id: 'c', text: 'Certificate expiration has no security implications.' },
          { id: 'd', text: 'Only passwords need renewal; certificates do not.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Certificate expiration is a known event. Failure to renew on schedule indicates a process gap and risks unplanned service loss.',
        feedbackIncorrect: 'Certificate renewal is a basic operational requirement. Stale or expired certificates indicate the organization is not tracking or renewing them on schedule.',
      },
      {
        id: 'm02-q-pki-2',
        prompt: 'An analyst reviews certificate usage and finds that a certificate issued to "database-server-prod" is being used by a different system called "database-server-staging." What is the security concern?',
        options: [
          { id: 'a', text: 'Certificate subject names are irrelevant to security.' },
          { id: 'b', text: 'The certificate\'s intended subject does not match the system using it. This could indicate the certificate was misconfigured, stolen, or being misused. The correct certificate for staging should be used instead.' },
          { id: 'c', text: 'As long as the certificate is valid, any system can use it.' },
          { id: 'd', text: 'Production and staging systems are always interchangeable.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'A certificate\'s subject should match the system using it. Subject mismatch indicates the wrong certificate is in use, which could mask a compromise or configuration error.',
        feedbackIncorrect: 'Certificate subject binding ensures the correct system is using the intended certificate. Subject mismatches should be investigated.',
      },
      {
        id: 'm02-q-pki-3',
        prompt: 'During an incident investigation, an analyst discovers that a root certificate private key was stored in plaintext in a configuration file. The root certificate is used to issue all internal certificates for the organization. Why is this discovery critical?',
        options: [
          { id: 'a', text: 'Private key storage location does not affect security.' },
          { id: 'b', text: 'An attacker with access to the root private key can forge any certificate in the organization, breaking trust for all systems that rely on that root. This is a complete compromise of the PKI system.' },
          { id: 'c', text: 'Plaintext storage is a convenience best practice.' },
          { id: 'd', text: 'Only public keys need to be protected.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'A compromised root private key means an attacker can forge any certificate. This breaks the entire PKI trust model for that organization.',
        feedbackIncorrect: 'Root private keys must be protected. Plaintext storage of a root key is a critical compromise of the PKI system.',
      },
      {
        id: 'm02-q-pki-4',
        prompt: 'A certificate issued to "mail.example.com" is used to authenticate email servers. The certificate was issued by an external, public Certificate Authority, and the certificate chain is valid. Why should an analyst still verify the Certificate Authority\'s reputation and policies?',
        options: [
          { id: 'a', text: 'All Certificate Authorities are equally trustworthy.' },
          { id: 'b', text: 'A CA\'s reputation and vetting procedures affect trust in its issued certificates. A compromise, lax vetting, or historical security issues with a CA could mean its certificates are less trustworthy than those from a well-managed CA.' },
          { id: 'c', text: 'Certificate verification only requires checking expiration date.' },
          { id: 'd', text: 'External CAs are always more secure than internal CAs.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'CA reputation and policies matter. A compromised or low-integrity CA can issue fraudulent certificates that appear valid.',
        feedbackIncorrect: 'Not all Certificate Authorities are equally trustworthy. Verify the CA\'s operational security, vetting procedures, and reputation.',
      },
    ],
  },
  {
    conceptId: 'zero-trust',
    conceptTitle: 'Zero Trust reasoning',
    questions: [
      {
        id: 'm02-q-zt-1',
        prompt: 'Traditional network security assumes that "inside the firewall is trusted" and "outside is untrusted." Zero Trust assumes every request, regardless of source, requires verification. Why is this shift important?',
        options: [
          { id: 'a', text: 'Firewalls are obsolete and should be removed.' },
          { id: 'b', text: 'Internal networks can be compromised just as external ones can be. Verifying identity, device posture, and request context regardless of network location provides stronger protection than assuming internal = safe.' },
          { id: 'c', text: 'All networks are equally risky at all times.' },
          { id: 'd', text: 'Network location is the only security factor that matters.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Zero Trust reflects the reality that internal threats exist. Every request deserves authentication and authorization verification.',
        feedbackIncorrect: 'Modern security recognizes that "inside the network" is not a guarantee of safety. Zero Trust verifies every access request independently.',
      },
      {
        id: 'm02-q-zt-2',
        prompt: 'A device that was compromised six months ago is now clean and repaired. The user connects it to the network and attempts to access company resources. From a Zero Trust perspective, why should the device be treated carefully on first reconnection?',
        options: [
          { id: 'a', text: 'The device was already compromised once, so it can be trusted now.' },
          { id: 'b', text: 'The organization cannot be certain of the device\'s current state just because it was repaired offline. The device should be re-verified: patching status, malware scans, compliance checks, and behavioral monitoring should all occur before granting access to sensitive resources.' },
          { id: 'c', text: 'Once a device has been repaired, no further verification is needed.' },
          { id: 'd', text: 'Device state never changes, so historical compromise is irrelevant.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Zero Trust requires continuous verification. A previously compromised device should be re-verified before accessing resources.',
        feedbackIncorrect: 'Previous compromise is relevant context. Verification should include current patching, compliance, and behavioral posture.',
      },
      {
        id: 'm02-q-zt-3',
        prompt: 'In a Zero Trust model, what is the advantage of requiring continuous authentication and authorization checks throughout a session, not just at sign-in?',
        options: [
          { id: 'a', text: 'Continuous verification adds no security value.' },
          { id: 'b', text: 'A device or user could become compromised or non-compliant after initial sign-in. Continuous verification allows the system to detect and respond to changes in risk posture during the session.' },
          { id: 'c', text: 'Sign-in verification is sufficient for a full day of access.' },
          { id: 'd', text: 'Only passwords need verification; other factors do not.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Risk posture changes during a session. Continuous verification allows detection of new compromises, policy violations, or behavioral anomalies.',
        feedbackIncorrect: 'Zero Trust includes continuous verification because user and device state can change during a session.',
      },
      {
        id: 'm02-q-zt-4',
        prompt: 'A Zero Trust policy requires multifactor authentication for all users, not just administrators. Why extend MFA beyond administrative access?',
        options: [
          { id: 'a', text: 'Only administrators should use MFA; general users do not need it.' },
          { id: 'b', text: 'General user accounts often have access to customer data, financial information, or operational systems. Compromising a general user account is a viable attack path, and MFA on all accounts protects the entire user base, not just privileged roles.' },
          { id: 'c', text: 'All accounts are equally risky regardless of access level.' },
          { id: 'd', text: 'MFA is too inconvenient for general users.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'General user accounts often access valuable data. MFA on all accounts raises the bar for account compromise attacks.',
        feedbackIncorrect: 'Non-administrative accounts can provide valuable access to attackers. Applying MFA broadly increases overall security.',
      },
    ],
  },
];

const MODULE_TWO_SOURCES = [
  {
    title: 'Zero Trust Architecture (SP 800-207)',
    org: 'NIST',
    url: 'https://csrc.nist.gov/pubs/sp/800/207/final',
    note: 'Comprehensive guide to assuming no inherent trust, evaluating each request on identity, device, location, and risk.'
  },
  {
    title: 'Zero Trust Maturity Model',
    org: 'CISA',
    url: 'https://www.cisa.gov/zero-trust-maturity-model',
    note: 'Government framework for implementing zero trust principles across governance, architecture, and implementation.'
  },
  {
    title: 'Digital Identity Guidelines: Authentication and Authenticator Management (SP 800-63B-4)',
    org: 'NIST',
    url: 'https://csrc.nist.gov/pubs/sp/800/63/b/4/final',
    note: 'Digital identity guidelines covering authentication methods, MFA, and credential management.'
  },
  {
    title: 'Authentication Cheat Sheet',
    org: 'OWASP',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html',
    note: 'Practical security controls and defense strategies for authentication systems.'
  },
  {
    title: 'Authorization Cheat Sheet',
    org: 'OWASP',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html',
    note: 'Design and implementation patterns for access control and privilege management.'
  },
  {
    title: 'MITRE ATT&CK — Credential Access',
    org: 'MITRE',
    url: 'https://attack.mitre.org/tactics/TA0006/',
    note: 'Adversary tactics and techniques related to credential compromise—understand what defenses protect against.'
  },
  {
    title: 'Security+ public domain overview (supplementary draft reference)',
    org: 'CompTIA',
    url: 'https://www.comptia.org/certifications/security',
    note: 'Supplementary public reference only. The §2 crosswalk is a developer draft pending curriculum, compliance, and faculty review; this study aid is not an approval, affiliation, endorsement, or pass guarantee.'
  },
];

let moduleTwoState = null;
let moduleTwoUser = null;
let moduleTwoReviewMode = false;
let moduleTwoQuizState = null;

function moduleTwoLoad(user) {
  moduleTwoUser = user;
  moduleTwoState = LabRuntime.load(MODULE_TWO_LAB_ID, user, MODULE_TWO_DEFAULT_STATE);
  if (!Array.isArray(moduleTwoState.reviewedStations)) moduleTwoState.reviewedStations = [];
  if (!Array.isArray(moduleTwoState.selectedEvidence)) moduleTwoState.selectedEvidence = [];
  if (!Array.isArray(moduleTwoState.feedback)) moduleTwoState.feedback = [];
  if (!Array.isArray(moduleTwoState.flags)) moduleTwoState.flags = [];
  if (!moduleTwoState.lessonWork || typeof moduleTwoState.lessonWork !== 'object') moduleTwoState.lessonWork = {};
  if (!moduleTwoState.independentLab || typeof moduleTwoState.independentLab !== 'object') moduleTwoState.independentLab = JSON.parse(JSON.stringify(MODULE_TWO_DEFAULT_STATE.independentLab));
  if (!moduleTwoState.independentLab.answers || typeof moduleTwoState.independentLab.answers !== 'object') moduleTwoState.independentLab.answers = {};
  if (!Array.isArray(moduleTwoState.independentLab.feedback)) moduleTwoState.independentLab.feedback = [];
  if (typeof moduleTwoState.notes !== 'string') moduleTwoState.notes = '';
  if (!MODULE_TWO_LAB.stations.some((station) => station.id === moduleTwoState.activeStation)) moduleTwoState.activeStation = 'signins';

  // Initialize quiz state
  if (!moduleTwoQuizState) {
    const previousQuestionIds = moduleTwoState.lastQuizQuestionIds || [];
    const selection = selectQuizQuestions(MODULE_TWO_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    moduleTwoQuizState = {
      selectedQuestions: selection.selectedQuestions,
      questionsByAnswer: selection.questionsByAnswer,
      answers: {},
      scored: false,
      attempts: 0,
      score: 0,
      bestScore: 0,
      feedback: [],
      passed: false,
    };
  }

  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'soc-analyst', 'soc-02');
  return moduleTwoState;
}

function moduleTwoSave() {
  if (moduleTwoUser && moduleTwoState) LabRuntime.save(MODULE_TWO_LAB_ID, moduleTwoUser, moduleTwoState);
}

function moduleTwoGetSections() {
  return [
    { id: 'foundations', title: 'Foundations', type: 'lecture', isComplete: true, scrollId: 'm02-foundations' },
    { id: 'trust-model', title: 'Trust Model', type: 'lecture', isComplete: true, scrollId: 'm02-model' },
    { id: 'knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: moduleTwoQuizState?.passed, scrollId: 'm02-knowledge-check' },
    { id: 'guided-lab', title: 'Guided Lab', type: 'lab', isComplete: moduleTwoState.completed, scrollId: 'm02-guided-lab' },
  ];
}

function moduleTwoFoundations() {
  return `<div class="m02-foundation-grid">
    ${MODULE_TWO_FOUNDATIONS.map((item, index) => `<details class="m02-foundation" ${index === 0 ? 'open' : ''}>
      <summary><span class="m02-foundation-icon"><i class="${esc(item.icon)}" aria-hidden="true"></i></span><span><strong>${esc(item.title)}</strong><small>${esc(item.summary)}</small></span><i class="ri-arrow-down-s-line m02-chevron" aria-hidden="true"></i></summary>
      <p>${esc(item.detail)}</p>
    </details>`).join('')}
  </div>
  <div class="m02-lesson-loops" id="m02-lessons" aria-label="Eight lesson practice loops">
    ${MODULE_TWO_LESSON_LOOPS.map((lesson, index) => moduleTwoLessonLoop(lesson, index)).join('')}
  </div>`;
}

function moduleTwoLessonLoop(lesson, index) {
  const work = moduleTwoState.lessonWork[lesson.id] || { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
  const complete = work.checked && work.taskComplete;
  return `<details class="m02-lesson-loop" ${index === 0 || !complete ? 'open' : ''} data-m02-lesson="${esc(lesson.id)}">
    <summary><span class="m02-lesson-number">${String(index + 1).padStart(2, '0')}</span><span><strong>${esc(lesson.title)}</strong><small>${complete ? 'Complete — reopen to review' : 'Scenario → theory → check → applied task'}</small></span>${complete ? '<i class="ri-checkbox-circle-fill m02-lesson-done" aria-label="Lesson complete"></i>' : '<i class="ri-arrow-down-s-line m02-chevron" aria-hidden="true"></i>'}</summary>
    <div class="m02-lesson-loop-body">
      <section><p class="m02-kicker">Scenario</p><p>${esc(lesson.scenario)}</p></section>
      <section><p class="m02-kicker">Theory</p><p>${esc(lesson.theory)}</p></section>
      <section class="m02-lesson-check"><p class="m02-kicker">Knowledge check</p>${lesson.questions.map((question, qIndex) => `<fieldset><legend>${qIndex + 1}. ${esc(question.prompt)}</legend>${question.options.map((option, optionIndex) => `<label><input type="radio" name="m02-lesson-${esc(lesson.id)}-${qIndex}" value="${optionIndex}" data-m02-lesson-answer data-lesson-id="${esc(lesson.id)}" data-question-index="${qIndex}" ${String(work.answers?.[qIndex]) === String(optionIndex) ? 'checked' : ''}><span>${esc(option)}</span></label>`).join('')}</fieldset>`).join('')}<button type="button" class="m02-lesson-check-button" data-m02-lesson-check="${esc(lesson.id)}">Check lesson answers</button>${work.feedback?.length ? `<ul class="m02-lesson-feedback">${work.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>` : ''}</section>
      <section class="m02-lesson-task"><p class="m02-kicker">Applied task</p><p>${esc(lesson.task)}</p><textarea rows="3" maxlength="500" data-m02-lesson-task="${esc(lesson.id)}" placeholder="Write a short analyst response…">${esc(work.task || '')}</textarea><button type="button" class="m02-lesson-task-button" data-m02-lesson-task-submit="${esc(lesson.id)}">${work.taskComplete ? 'Task saved' : 'Save applied task'}</button></section>
    </div>
  </details>`;
}

function moduleTwoIndependentLab() {
  const state = moduleTwoState.independentLab;
  const answered = Object.keys(state.answers || {}).length;
  const feedback = state.feedback?.length ? `<div class="m02-independent-feedback" role="status"><strong>${state.score}/100 — ${state.completed ? 'Independent lab complete' : 'Review and retry'}</strong><ul>${state.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div>` : '';
  return `<section class="m02-independent-lab" id="m02-independent-lab" aria-labelledby="m02-independent-title"><div class="m02-panel-heading"><div><p class="m02-kicker">Independent · fresh decision path · included in the existing 180-minute lab allocation</p><h3 id="m02-independent-title">${esc(MODULE_TWO_INDEPENDENT_LAB.title)}</h3></div><span>${answered}/${MODULE_TWO_INDEPENDENT_LAB.questions.length} answered</span></div><p class="m02-independent-scenario">${esc(MODULE_TWO_INDEPENDENT_LAB.scenario)}</p><form id="m02-independent-form">${MODULE_TWO_INDEPENDENT_LAB.questions.map((question) => `<fieldset class="m02-independent-question"><legend>${esc(question.label)}</legend>${question.options.map((option) => `<label><input type="radio" name="m02-independent-${esc(question.id)}" value="${esc(option.id)}" data-m02-independent-answer data-question-id="${esc(question.id)}" ${state.answers?.[question.id] === option.id ? 'checked' : ''}><span>${esc(option.text)}</span></label>`).join('')}</fieldset>`).join('')}<label class="m02-independent-notes">Analyst note (optional)<textarea rows="3" maxlength="500" data-m02-independent-notes placeholder="Record what remains uncertain and who should own the next step…">${esc(state.notes || '')}</textarea></label><button type="submit" class="m02-independent-submit">Score independent lab</button></form>${feedback}</section>`;
}

function moduleTwoTrustModel() {
  const items = [
    { number: '01', title: 'Identify', text: 'Is this a human, service, device, or workload identity?' },
    { number: '02', title: 'Authenticate', text: 'Which proof was accepted, denied, or bypassed?' },
    { number: '03', title: 'Contextualize', text: 'Do the device, network path, time, and resource match expectations?' },
    { number: '04', title: 'Authorize', text: 'Was the access or role appropriate, approved, and least-privileged?' },
    { number: '05', title: 'Decide', text: 'What conclusion and proportionate next step does the combined evidence support?' },
  ];
  return `<ol class="m02-trust-model" aria-label="Five-step trust decision model">
    ${items.map((item) => `<li><span>${item.number}</span><div><strong>${esc(item.title)}</strong><p>${esc(item.text)}</p></div></li>`).join('')}
  </ol>`;
}

function moduleTwoQuizQuestion(selected, index) {
  const question = selected.question;
  const userAnswerId = moduleTwoQuizState?.answers?.[question.id];
  const answered = userAnswerId !== undefined;
  return `<fieldset class="m02-quiz-question" data-question-id="${esc(question.id)}">
    <legend><span>${index + 1}</span> ${esc(selected.conceptTitle)}: ${esc(question.prompt)}</legend>
    <div class="m02-quiz-options">
      ${selected.shuffledOptions.map((option, optIndex) => `<label>
        <input type="radio" name="q-${esc(question.id)}" value="${esc(option.id)}" ${userAnswerId === option.id ? 'checked' : ''} data-m02-quiz-answer />
        <span>${esc(option.text)}</span>
      </label>`).join('')}
    </div>
  </fieldset>`;
}

function moduleTwoQuizPanel() {
  if (!moduleTwoQuizState?.selectedQuestions || moduleTwoQuizState.selectedQuestions.length === 0) {
    return `<div class="m02-quiz-empty" id="m02-quiz-feedback" role="status">Loading quiz...</div>`;
  }

  const selected = moduleTwoQuizState.selectedQuestions;
  const answered = Object.keys(moduleTwoQuizState.answers || {}).length;
  const total = selected.length;

  let feedbackHtml = '';
  if (moduleTwoQuizState.scored) {
    const passed = moduleTwoQuizState.score >= 70;
    feedbackHtml = `<section class="m02-quiz-score ${passed ? 'm02-quiz-pass' : 'm02-quiz-remediate'}" id="m02-quiz-feedback" tabindex="-1" aria-live="polite">
      <div class="m02-quiz-score-heading">
        <div>
          <p class="m02-kicker">Attempt ${moduleTwoQuizState.attempts} · best ${moduleTwoQuizState.bestScore}/100</p>
          <h3>${moduleTwoQuizState.score}/100 — ${passed ? 'Knowledge verified' : 'Use feedback and retry'}</h3>
        </div>
        <span>${moduleTwoQuizState.score}</span>
      </div>
      <ul class="m02-quiz-feedback-list">
        ${(moduleTwoQuizState.feedback || []).map((fb) => `<li class="${fb.correct ? 'm02-quiz-feedback-correct' : 'm02-quiz-feedback-incorrect'}">
          <i class="ri-${fb.correct ? 'checkbox-circle-fill' : 'information-line'}" aria-hidden="true"></i>
          <div>
            <strong>${fb.questionId}</strong>
            <p>${esc(fb.message)}</p>
          </div>
        </li>`).join('')}
      </ul>
      ${!passed ? `<div class="m02-quiz-actions"><button type="button" class="m02-quiz-retry" data-m02-quiz-retry><i class="ri-refresh-line" aria-hidden="true"></i> Try different questions</button></div>` : ''}
    </section>`;
  } else if (answered === total) {
    feedbackHtml = `<div class="m02-quiz-ready" id="m02-quiz-feedback" role="status">All questions answered. Submit to check your responses.</div>`;
  } else {
    feedbackHtml = `<div class="m02-quiz-empty" id="m02-quiz-feedback" role="status">Answer all ${total} questions to submit.</div>`;
  }

  return `<form class="m02-quiz-form" id="m02-quiz-form" novalidate>
    <div class="m02-panel-heading"><div><p class="m02-kicker">Knowledge check</p><h3 id="m02-quiz-title" tabindex="-1">Verify your understanding of identity, authentication, and trust</h3></div><span>${answered}/${total} answered</span></div>
    ${selected.map((sel, idx) => moduleTwoQuizQuestion(sel, idx)).join('')}
    <div class="m02-quiz-actions">
      <button class="m02-quiz-submit" type="submit" ${answered < total ? 'disabled' : ''}>
        <i class="ri-checkbox-circle-line" aria-hidden="true"></i> Check my answers
      </button>
    </div>
    ${feedbackHtml}
  </form>`;
}

function moduleTwoEvidenceRecord(record, fields) {
  const selected = moduleTwoState.selectedEvidence.includes(record.id);
  return `<label class="m02-record ${record.risk ? 'm02-record-review' : ''}">
    <input type="checkbox" value="${esc(record.id)}" data-m02-evidence ${selected ? 'checked' : ''} />
    <span class="m02-record-check" aria-hidden="true"><i class="ri-check-line"></i></span>
    <span class="m02-record-body">
      <span class="m02-record-heading"><strong>${esc(record.identity)}</strong><code>${esc(record.id)}</code></span>
      <span class="m02-record-fields">
        ${fields.map(([label, key]) => `<span><small>${esc(label)}</small><b>${esc(record[key])}</b></span>`).join('')}
      </span>
    </span>
  </label>`;
}

function moduleTwoStationBody(stationId) {
  if (stationId === 'signins') {
    return `<div class="m02-record-list" aria-label="Synthetic sign-in records">
      ${MODULE_TWO_LAB.signins.map((record) => moduleTwoEvidenceRecord(record, [['Time', 'time'], ['Method', 'method'], ['Context', 'context'], ['Outcome', 'outcome']])).join('')}
    </div>
    <details class="m02-hint"><summary>Need a sign-in hint?</summary><p>Look for a sequence, not a single unusual field. Ask whether the same identity moved from failed stronger authentication to a weaker successful path.</p></details>`;
  }
  if (stationId === 'network') {
    return `<div class="m02-record-list" aria-label="Synthetic network context records">
      ${MODULE_TWO_LAB.network.map((record) => moduleTwoEvidenceRecord(record, [['Source', 'source'], ['Observed path', 'route'], ['Trust context', 'zone']])).join('')}
    </div>
    <div class="m02-address-note"><i class="ri-information-line" aria-hidden="true"></i><p><strong>Safe synthetic addresses:</strong> 198.51.100.0/24 and 203.0.113.0/24 are documentation ranges. They identify fictional external paths in this exercise, not real infrastructure.</p></div>`;
  }
  if (stationId === 'access') {
    return `<div class="m02-record-list" aria-label="Synthetic access-change records">
      ${MODULE_TWO_LAB.access.map((record) => moduleTwoEvidenceRecord(record, [['Time', 'time'], ['Change', 'change'], ['Approval', 'approval'], ['Scope', 'scope']])).join('')}
    </div>
    <details class="m02-hint"><summary>Need an authorization hint?</summary><p>A role change is not suspicious merely because it is powerful. Compare its approval trail, scope, and timing with the sign-in evidence for the same identity.</p></details>`;
  }
  return `<div class="m02-guardrail-grid">
    <article><i class="ri-file-shield-2-line" aria-hidden="true"></i><div><strong>Preserve before changing</strong><p>Record the relevant event identifiers, identity, time, route, authentication method, and access change before a responder alters state.</p></div></article>
    <article><i class="ri-focus-2-line" aria-hidden="true"></i><div><strong>Match action to scope</strong><p>Recommend protection for the affected identity and review the unapproved role. Do not disable unrelated accounts or block broad networks.</p></div></article>
    <article><i class="ri-user-follow-line" aria-hidden="true"></i><div><strong>Use approved authority</strong><p>A foundation analyst documents and escalates. The authorized responder validates ownership and performs the identity-protection procedure.</p></div></article>
  </div>
  <div class="m02-boundary"><i class="ri-lock-2-line" aria-hidden="true"></i><p>This isolated lab has no live connection and no response controls. Your decision is a written recommendation only.</p></div>`;
}

function moduleTwoSelectionSummary() {
  const allRecords = [...MODULE_TWO_LAB.signins, ...MODULE_TWO_LAB.network, ...MODULE_TWO_LAB.access];
  const chosen = allRecords.filter((record) => moduleTwoState.selectedEvidence.includes(record.id));
  return `<div class="m02-selection" aria-live="polite">
    <span><strong id="m02-selection-count">${chosen.length}</strong> record${chosen.length === 1 ? '' : 's'} selected as evidence</span>
    <span id="m02-selection-summary">${chosen.length ? chosen.map((item) => esc(item.id)).join(' · ') : 'Select only records that materially support your conclusion.'}</span>
  </div>`;
}

function moduleTwoOptions(name, options) {
  return `<div class="m02-options">
    ${options.map((option) => `<label><input type="radio" name="${esc(name)}" value="${esc(option.id)}" ${moduleTwoState[name] === option.id ? 'checked' : ''} /><span><strong>${esc(option.text)}</strong>${option.help ? `<small>${esc(option.help)}</small>` : ''}</span></label>`).join('')}
  </div>`;
}

function moduleTwoScorePanel() {
  if (moduleTwoState.validationError) {
    return `<div class="m02-validation" id="m02-feedback" role="alert" tabindex="-1"><i class="ri-information-line" aria-hidden="true"></i><div><strong>Complete the artifact</strong><p>${esc(moduleTwoState.validationError)}</p></div></div>`;
  }
  if (!moduleTwoState.attempts || !moduleTwoState.breakdown) {
    return `<div class="m02-score-empty" id="m02-feedback" role="status">Your evidence and draft save automatically. Submit when the three decisions are selected and the handoff note is at least 70 characters.</div>`;
  }
  const passed = moduleTwoState.score >= MODULE_TWO_LAB.passingScore;
  const b = moduleTwoState.breakdown;
  return `<section class="m02-score ${passed ? 'm02-score-pass' : 'm02-score-remediate'}" id="m02-feedback" tabindex="-1" aria-labelledby="m02-score-title" aria-live="polite">
    <div class="m02-score-heading"><div><p class="m02-kicker">Attempt ${moduleTwoState.attempts} · best ${moduleTwoState.bestScore}/100</p><h3 id="m02-score-title">${moduleTwoState.score}/100 — ${passed ? 'Trust path validated' : 'Use the remediation and retry'}</h3></div><span>${moduleTwoState.score}</span></div>
    <div class="m02-score-grid" aria-label="Explainable score breakdown">
      <div><strong>${b.observation}/20</strong><span>Observation</span></div>
      <div><strong>${b.evidence}/15</strong><span>Evidence</span></div>
      <div><strong>${b.analysis}/25</strong><span>Analysis</span></div>
      <div><strong>${b.decision}/25</strong><span>Decision</span></div>
      <div><strong>${b.communication}/15</strong><span>Communication</span></div>
    </div>
    <ul class="m02-feedback-list">${moduleTwoState.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
    <div class="m02-expert"><strong>Expert reasoning</strong><p>IDN-317 presents a connected chain: stronger authentication was denied, a weaker password-only exception then succeeded from an unmanaged external path, and a production-impacting role appeared without an approval record. The other records have expected device, route, certificate, MFA, or change-reference context. Preserve the four linked records and escalate only IDN-317 for authorized protection and role review.</p></div>
  </section>`;
}

function moduleTwoWorksheet() {
  return `<form class="m02-worksheet" id="m02-form" novalidate>
    <div class="m02-panel-heading"><div><p class="m02-kicker">Scored artifact</p><h3 id="m02-worksheet-title" tabindex="-1">Document the trust-path decision</h3></div><span>Passing score: ${MODULE_TWO_LAB.passingScore}/100</span></div>
    <fieldset class="m02-fieldset"><legend><span>1</span> Observation — which identity requires escalation?</legend><p class="m02-help">Correlate the identity across all three telemetry sets.</p>${moduleTwoOptions('observation', MODULE_TWO_LAB.observationOptions)}</fieldset>
    <fieldset class="m02-fieldset"><legend><span>2</span> Analysis — what best explains the linked pattern?</legend><p class="m02-help">Use the combined evidence; do not classify from location or a failed password alone.</p>${moduleTwoOptions('analysis', MODULE_TWO_LAB.analysisOptions)}</fieldset>
    <fieldset class="m02-fieldset"><legend><span>3</span> Decision — what is the proportionate next step?</legend><p class="m02-help">Your role is to preserve, document, and escalate—not perform an unapproved disruptive action.</p>${moduleTwoOptions('decision', MODULE_TWO_LAB.decisionOptions)}</fieldset>
    <div class="m02-fieldset">
      <label class="m02-note-label" for="m02-notes"><span>4</span><strong>Communication — write the handoff note</strong></label>
      <p class="m02-help" id="m02-note-help">State the identity, at least two linked observations, why the role change matters, and the recommended next step.</p>
      <button type="button" class="m02-note-starter" data-m02-note-starter><i class="ri-quill-pen-line" aria-hidden="true"></i> Insert a structure-only starter</button>
      <textarea class="m02-notes" id="m02-notes" name="notes" rows="5" maxlength="800" aria-describedby="m02-note-help m02-note-count" placeholder="Identity… Observed… Access impact… Recommend…">${esc(moduleTwoState.notes)}</textarea>
      <p class="m02-note-count" id="m02-note-count"><span>${moduleTwoState.notes.length}</span>/800 characters</p>
    </div>
    <div class="m02-actions"><button class="m02-submit" type="submit"><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Score my analysis</button><button class="m02-reset" type="button" data-m02-reset><i class="ri-restart-line" aria-hidden="true"></i> Reset this lab only</button></div>
    ${moduleTwoState.resetArmed ? `<div class="m02-reset-confirm" id="m02-reset-confirm" tabindex="-1" role="alert"><p><strong>Reset Module 02?</strong> Attempts, selections, notes, score, and this lab's flag will be cleared. Course progress and other labs are untouched.</p><div><button type="button" data-m02-reset-confirm>Yes, reset this lab</button><button type="button" data-m02-reset-cancel>Cancel</button></div></div>` : ''}
    ${moduleTwoScorePanel()}
  </form>`;
}

function moduleTwoLabDynamic() {
  const station = MODULE_TWO_LAB.stations.find((item) => item.id === moduleTwoState.activeStation) || MODULE_TWO_LAB.stations[0];
  const reviewed = new Set(moduleTwoState.reviewedStations);
  const allReviewed = MODULE_TWO_LAB.stations.every((item) => reviewed.has(item.id));
  const stationIndex = MODULE_TWO_LAB.stations.findIndex((item) => item.id === station.id);
  const nextStation = MODULE_TWO_LAB.stations[stationIndex + 1];
  return `<div class="m02-lab-console">
    <div class="m02-console-bar"><span><i class="ri-shield-user-line" aria-hidden="true"></i> Identity trust review</span><span>CASE-FND-204 · synthetic</span></div>
    <div class="m02-case-brief"><div><p class="m02-kicker">Your role · foundation analyst</p><h3>${esc(MODULE_TWO_LAB.title)}</h3><p>${esc(MODULE_TWO_LAB.scenario)}</p></div><dl><div><dt>Scope</dt><dd>4 identities</dd></div><div><dt>Task</dt><dd>Interpret, then escalate</dd></div></dl></div>
  </div>
  <section class="m02-investigation" aria-labelledby="m02-investigation-title">
    <div class="m02-panel-heading"><div><p class="m02-kicker">Guided investigation</p><h3 id="m02-investigation-title">Review four evidence stations</h3></div><span>${reviewed.size}/${MODULE_TWO_LAB.stations.length} reviewed</span></div>
    <div class="m02-stations" role="tablist" aria-label="Evidence stations">
      ${MODULE_TWO_LAB.stations.map((item, index) => `<button type="button" id="m02-tab-${esc(item.id)}" role="tab" tabindex="${item.id === station.id ? '0' : '-1'}" aria-selected="${item.id === station.id}" aria-controls="m02-station-panel" class="${item.id === station.id ? 'm02-station-active' : ''}" data-m02-station="${esc(item.id)}"><span>${index + 1}</span><i class="${esc(item.icon)}" aria-hidden="true"></i><b>${esc(item.label)}</b>${reviewed.has(item.id) ? '<i class="ri-checkbox-circle-fill m02-station-done" aria-label="Reviewed"></i>' : ''}</button>`).join('')}
    </div>
    ${moduleTwoSelectionSummary()}
    <div class="m02-station-panel" id="m02-station-panel" role="tabpanel" aria-labelledby="m02-tab-${esc(station.id)}" tabindex="-1">
      <div class="m02-station-heading"><div><p class="m02-kicker">Station ${stationIndex + 1}</p><h4>${esc(station.label)}</h4></div><p>${esc(station.instruction)}</p></div>
      ${moduleTwoStationBody(station.id)}
      <button type="button" class="m02-review-station" data-m02-review-station="${esc(station.id)}"><i class="${reviewed.has(station.id) ? 'ri-checkbox-circle-fill' : 'ri-arrow-right-circle-line'}" aria-hidden="true"></i>${reviewed.has(station.id) ? 'Station reviewed' : nextStation ? `Mark reviewed and continue to ${esc(nextStation.label)}` : 'Mark decision guardrail reviewed'}</button>
    </div>
  </section>
  ${allReviewed ? moduleTwoWorksheet() : `<section class="m02-locked" aria-label="Scored artifact locked"><i class="ri-lock-line" aria-hidden="true"></i><div><strong>Scored artifact locked</strong><p>Mark all four evidence stations reviewed. Your selected records remain saved as you move between stations.</p></div></section>`}`;
}

function viewModuleTwo(user, program) {
  moduleTwoLoad(user);
  const module = program.modules['soc-02'];
  const sections = moduleTwoGetSections();
  const foundationsOpen = moduleTwoReviewMode || !sections[0].isComplete;
  const trustModelOpen = moduleTwoReviewMode || !sections[1].isComplete;
  const labOpen = moduleTwoReviewMode || !sections[2].isComplete;

  const foundationsSection = `
    <details class="m02-section-collapsible" ${foundationsOpen ? 'open' : ''}>
      <summary class="m02-section-summary">
        <section class="m02-section" id="m02-foundations" aria-labelledby="m02-foundations-title">
          <div class="m02-section-heading"><span>1</span><div><p class="m02-kicker">Eight connected concepts</p><h2 id="m02-foundations-title">Read a trust decision from end to end</h2></div></div>
        </section>
      </summary>
      <section class="m02-section m02-section-body" aria-labelledby="m02-foundations-title"><p class="m02-instruction">Open each concept for the analyst interpretation. The lab tests how the ideas connect; it does not test product menus or memorized definitions.</p>${moduleTwoFoundations()}</section>
    </details>`;

  const trustModelSection = `
    <details class="m02-section-collapsible" ${trustModelOpen ? 'open' : ''}>
      <summary class="m02-section-summary">
        <section class="m02-section" id="m02-model" aria-labelledby="m02-model-title">
          <div class="m02-section-heading"><span>2</span><div><p class="m02-kicker">Reusable reasoning pattern</p><h2 id="m02-model-title">The five-step trust model</h2></div></div>
        </section>
      </summary>
      <section class="m02-section m02-section-body" aria-labelledby="m02-model-title">${moduleTwoTrustModel()}<div class="m02-principle"><i class="ri-scales-3-line" aria-hidden="true"></i><p><strong>Analyst principle:</strong> "Outside the network" is not a verdict, and "inside the network" is not proof of trust. Combine identity, authentication, device, route, resource, and authorization evidence.</p></div></section>
    </details>`;

  const sourcesSection = `
    <details class="m02-section-collapsible" ${moduleTwoReviewMode ? 'open' : ''}>
      <summary class="m02-section-summary">
        <section class="m02-section" id="m02-sources" aria-labelledby="m02-sources-title">
          <div class="m02-section-heading"><span>3</span><div><p class="m02-kicker">Supporting resources</p><h2 id="m02-sources-title">Further reading on identity and trust</h2></div></div>
        </section>
      </summary>
      <section class="m02-section m02-section-body" aria-labelledby="m02-sources-title">${moduleSourcesBlock(MODULE_TWO_SOURCES)}</section>
    </details>`;

  const quizOpen = moduleTwoReviewMode || (moduleTwoQuizState && !moduleTwoQuizState.passed);
  const quizSection = `
    <details class="m02-section-collapsible" ${quizOpen ? 'open' : ''}>
      <summary class="m02-section-summary">
        <section class="m02-section" id="m02-knowledge-check" aria-labelledby="m02-quiz-title">
          <div class="m02-section-heading"><span>4</span><div><p class="m02-kicker">Interactive knowledge check</p><h2 id="m02-quiz-title">Test your understanding of identity and trust concepts</h2></div></div>
        </section>
      </summary>
      <section class="m02-section m02-section-body" aria-labelledby="m02-quiz-title"><div id="m02-quiz-dynamic">${moduleTwoQuizPanel()}</div></section>
    </details>`;

  const labSection = `
    <details class="m02-section-collapsible" ${labOpen ? 'open' : ''}>
      <summary class="m02-section-summary">
        <section class="m02-section m02-lab-section" id="m02-guided-lab" aria-labelledby="m02-lab-title">
          <div class="m02-section-heading"><span>5</span><div><p class="m02-kicker">Guided · assisted investigation · ${formatInstructionalMinutes(MODULE_TWO_LAB.minutes)} instructional time</p><h2 id="m02-lab-title">Suspicious authentication investigation</h2></div></div>
        </section>
      </summary>
      <section class="m02-section m02-lab-section m02-section-body" aria-labelledby="m02-lab-title"><div id="m02-lab-dynamic">${moduleTwoLabDynamic()}</div></section>
      <section class="m02-section m02-section-body" aria-labelledby="m02-independent-title">${moduleTwoIndependentLab()}</section>
    </details>`;

  return `<div class="m02-shell">
    ${moduleTopbar(user, program)}
    ${moduleProgressShell(sections, { reviewMode: moduleTwoReviewMode })}
    <main class="m02-main">
      <section class="m02-hero" aria-labelledby="m02-title"><div><p class="m02-kicker">Module 02 · ${formatInstructionalMinutes(module.durationMinutes)} · Week 1 foundations</p><h1 id="m02-title">${esc(module.title)}</h1><p class="m02-lede">Build a practical trust model, then correlate identity, authentication, network, and role-change facts without confusing unusual activity with malicious activity.</p><a class="m02-hero-action" href="#m02-foundations"><i class="ri-compass-3-line" aria-hidden="true"></i> Start the foundations</a></div><dl class="m02-progress" aria-label="Saved module progress"><div><dt>Foundation topics</dt><dd>${module.lessons}</dd></div><div><dt>Guided lab</dt><dd>${formatInstructionalMinutes(MODULE_TWO_LAB.minutes)}</dd></div><div><dt>Lab status</dt><dd id="m02-status">${moduleTwoState.completed ? 'Complete' : moduleTwoState.attempts ? 'In progress' : 'Not started'}</dd></div></dl></section>

      <section class="m02-objective" aria-labelledby="m02-objective-title"><span><i class="ri-focus-2-line" aria-hidden="true"></i></span><div><p class="m02-kicker">One measurable objective</p><h2 id="m02-objective-title">Correlate authentication, network context, and authorization changes to identify one risky identity and document a proportionate escalation.</h2></div></section>

      ${foundationsSection}
      ${trustModelSection}
      ${sourcesSection}
      ${quizSection}
      ${labSection}
    </main>
  </div>`;
}

function moduleTwoScore() {
  const observation = moduleTwoState.observation === 'idn-317' ? 20 : 0;
  const analysis = moduleTwoState.analysis === 'likely-compromise' ? 25 : 0;
  const decision = moduleTwoState.decision === 'escalate-protect' ? 25 : 0;
  const selected = new Set(moduleTwoState.selectedEvidence);
  const correctSelected = MODULE_TWO_LAB.correctEvidence.filter((id) => selected.has(id)).length;
  const distractors = moduleTwoState.selectedEvidence.filter((id) => !MODULE_TWO_LAB.correctEvidence.includes(id)).length;
  const evidence = (correctSelected * 3) + (correctSelected === MODULE_TWO_LAB.correctEvidence.length && distractors === 0 ? 3 : 0);
  const note = moduleTwoState.notes.trim().toLowerCase();
  const communicationLength = note.length >= 70 ? 5 : 0;
  const communicationFacts = /(idn-317)/.test(note)
    && /(mfa|password|unmanaged|external)/.test(note)
    && /(role|privilege|network configuration|operator|approval)/.test(note)
    && /(escalat|protect|preserv|review)/.test(note)
    && !/[\[\]]/.test(note) ? 10 : 0;
  const communication = communicationLength + communicationFacts;
  return {
    score: observation + evidence + analysis + decision + communication,
    breakdown: { observation, evidence, analysis, decision, communication },
    feedback: [
      observation ? 'Observation: Correct. IDN-317 is the only identity linked to both the suspicious sign-in sequence and an unapproved privileged change.' : 'Observation: Correlate records by identity. IDN-317 appears in the MFA, weak-success, external-route, and role-change records.',
      evidence === 15 ? 'Evidence: Precise. You selected all four material records and left the plausible benign distractors unselected.' : `Evidence: You selected ${correctSelected}/4 material records and ${distractors} distractor${distractors === 1 ? '' : 's'}. Select the two IDN-317 sign-ins, its external route, and its unapproved role change.`,
      analysis ? 'Analysis: Correct. Independent authentication, device, route, and authorization facts support likely compromise and privilege expansion.' : 'Analysis: The combined pattern best supports likely identity compromise with unauthorized privilege expansion.',
      decision ? 'Decision: Correct. Preserve and escalate the affected identity for an authorized, scoped response.' : 'Decision: Limit the recommendation to IDN-317 and its role. Preserve evidence and use the approved identity-protection path.',
      communication === 15 ? 'Communication: Clear. The note identifies the entity, linked observations, access impact, and next step.' : 'Communication: Use at least 70 characters and name IDN-317, authentication or network context, the privileged role or missing approval, and the escalation or protection recommendation.',
    ],
  };
}

function moduleTwoRenderDynamic(focusId) {
  const root = document.getElementById('m02-lab-dynamic');
  if (!root) return;
  root.innerHTML = moduleTwoLabDynamic();
  const status = document.getElementById('m02-status');
  if (status) status.textContent = moduleTwoState.completed ? 'Complete' : moduleTwoState.attempts || moduleTwoState.reviewedStations.length ? 'In progress' : 'Not started';
  if (document.querySelector('.m02-independent-lab')) moduleTwoRenderIndependent();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function moduleTwoUpdateSelectionSummary() {
  const allRecords = [...MODULE_TWO_LAB.signins, ...MODULE_TWO_LAB.network, ...MODULE_TWO_LAB.access];
  const chosen = allRecords.filter((record) => moduleTwoState.selectedEvidence.includes(record.id));
  const count = document.getElementById('m02-selection-count');
  const summary = document.getElementById('m02-selection-summary');
  if (count) count.textContent = String(chosen.length);
  if (summary) summary.textContent = chosen.length ? chosen.map((item) => item.id).join(' · ') : 'Select only records that materially support your conclusion.';
}

function moduleTwoRenderQuiz(focusId) {
  const root = document.getElementById('m02-quiz-dynamic');
  if (!root) return;
  root.innerHTML = moduleTwoQuizPanel();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function moduleTwoRenderIndependent(focusId) {
  const root = document.querySelector('.m02-independent-lab');
  if (!root) return;
  root.outerHTML = moduleTwoIndependentLab();
  wireModuleTwoIndependentLab();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function wireModuleTwoLessons() {
  const root = document.getElementById('m02-lessons');
  if (!root) return;
  root.addEventListener('change', (event) => {
    const input = event.target.closest('[data-m02-lesson-answer]');
    if (!input) return;
    const lesson = moduleTwoState.lessonWork[input.dataset.lessonId] ||= { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
    lesson.answers[input.dataset.questionIndex] = input.value;
    moduleTwoSave();
  });
  root.addEventListener('input', (event) => {
    const field = event.target.closest('[data-m02-lesson-task]');
    if (!field) return;
    const lesson = moduleTwoState.lessonWork[field.dataset.m02LessonTask] ||= { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
    lesson.task = field.value;
    moduleTwoSave();
  });
  root.addEventListener('click', (event) => {
    const check = event.target.closest('[data-m02-lesson-check]');
    if (check) {
      const lesson = MODULE_TWO_LESSON_LOOPS.find((item) => item.id === check.dataset.m02LessonCheck);
      const work = moduleTwoState.lessonWork[lesson.id] ||= { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
      const missing = lesson.questions.filter((question, index) => work.answers?.[index] === undefined).length;
      if (missing) { work.feedback = [`Answer all ${lesson.questions.length} questions before checking this lesson.`]; work.checked = false; }
      else {
        // `correct` is computed from the compact question shape below; all
        // three questions must be correct to unlock the applied task.
        const score = lesson.questions.reduce((sum, question, index) => sum + (Number(work.answers[index]) === question.questions?.[0] ? 0 : Number(work.answers[index]) === question.correct ? 1 : 0), 0);
        work.checked = score === lesson.questions.length;
        work.feedback = work.checked ? ['Correct. Apply the same reasoning to the Mission Next Labs scenario.'] : [`${score}/${lesson.questions.length} correct. Re-read the theory and use the evidence context before retrying.`];
      }
      moduleTwoSave();
      const details = check.closest('details');
      if (details) details.outerHTML = moduleTwoLessonLoop(lesson, MODULE_TWO_LESSON_LOOPS.indexOf(lesson));
      return;
    }
    const taskButton = event.target.closest('[data-m02-lesson-task-submit]');
    if (taskButton) {
      const lesson = moduleTwoState.lessonWork[taskButton.dataset.m02LessonTask] ||= { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
      lesson.taskComplete = lesson.checked && (lesson.task || '').trim().length >= 20;
      lesson.feedback = lesson.taskComplete ? ['Applied task saved.'] : ['Complete the knowledge check and write at least 20 characters before saving the task.'];
      moduleTwoSave();
      const details = taskButton.closest('details');
      const lessonDef = MODULE_TWO_LESSON_LOOPS.find((item) => item.id === taskButton.dataset.m02LessonTask);
      if (details) details.outerHTML = moduleTwoLessonLoop(lessonDef, MODULE_TWO_LESSON_LOOPS.indexOf(lessonDef));
    }
  });
}

function wireModuleTwoIndependentLab() {
  const root = document.getElementById('m02-independent-form');
  if (!root) return;
  root.addEventListener('change', (event) => {
    const input = event.target.closest('[data-m02-independent-answer]');
    if (!input) return;
    moduleTwoState.independentLab.answers[input.dataset.questionId] = input.value;
    moduleTwoSave();
  });
  root.addEventListener('input', (event) => {
    if (event.target.matches('[data-m02-independent-notes]')) { moduleTwoState.independentLab.notes = event.target.value; moduleTwoSave(); }
  });
  root.addEventListener('submit', (event) => {
    event.preventDefault();
    const state = moduleTwoState.independentLab;
    const missing = MODULE_TWO_INDEPENDENT_LAB.questions.filter((question) => !state.answers[question.id]);
    if (missing.length) { state.feedback = [`Answer all ${MODULE_TWO_INDEPENDENT_LAB.questions.length} independent-lab decisions before scoring.`]; state.score = 0; }
    else {
      const correct = MODULE_TWO_INDEPENDENT_LAB.questions.filter((question) => state.answers[question.id] === question.correct).length;
      state.score = Math.round(correct / MODULE_TWO_INDEPENDENT_LAB.questions.length * 100);
      state.attempts = (state.attempts || 0) + 1;
      state.completed = state.score >= 70;
      state.feedback = state.completed ? ['Correctly scoped the push-bombing signal, policy review, and verification step.'] : ['Use the evidence chain: unsolicited prompts plus weaker-method success, then a scoped policy review with verification.'];
    }
    moduleTwoSave();
    moduleTwoRenderIndependent('m02-independent-title');
  });
}

function wireModuleTwoQuiz() {
  const quizForm = document.getElementById('m02-quiz-form');
  if (!quizForm) return;

  quizForm.addEventListener('change', (event) => {
    const input = event.target;
    if (input.matches('[data-m02-quiz-answer]')) {
      const radioGroup = input.getAttribute('name');
      const questionId = radioGroup.replace('q-', '');
      moduleTwoQuizState.answers[questionId] = input.value;
    }
  });

  quizForm.addEventListener('submit', (event) => {
    event.preventDefault();

    // Score the quiz
    const result = scoreQuizAttempt(
      moduleTwoQuizState.selectedQuestions,
      moduleTwoQuizState.questionsByAnswer,
      moduleTwoQuizState.answers
    );

    moduleTwoQuizState.attempts += 1;
    moduleTwoQuizState.score = result.score;
    moduleTwoQuizState.bestScore = Math.max(moduleTwoQuizState.bestScore || 0, result.score);
    moduleTwoQuizState.feedback = result.feedback;
    moduleTwoQuizState.scored = true;
    moduleTwoQuizState.passed = result.score >= 70;

    // On failure, remember this attempt's question ids so "Try different
    // questions" can steer clear of them — but keep this attempt's scored
    // results on screen until the student chooses to retry.
    if (!moduleTwoQuizState.passed) {
      moduleTwoState.lastQuizQuestionIds = moduleTwoQuizState.selectedQuestions.map((s) => s.question.id);
    }

    moduleTwoSave();
    moduleTwoRenderQuiz('m02-quiz-feedback');
  });

  quizForm.addEventListener('click', (event) => {
    if (!event.target.closest('[data-m02-quiz-retry]')) return;
    const previousQuestionIds = moduleTwoState.lastQuizQuestionIds || [];
    const selection = selectQuizQuestions(MODULE_TWO_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    moduleTwoQuizState.selectedQuestions = selection.selectedQuestions;
    moduleTwoQuizState.questionsByAnswer = selection.questionsByAnswer;
    moduleTwoQuizState.answers = {};
    moduleTwoQuizState.scored = false;
    moduleTwoRenderQuiz('m02-quiz-title');
  });
}

function wireModuleTwo() {
  /* Wire the progress shell review toggle */
  const reviewToggle = document.querySelector('[data-mnav-review-toggle]');
  if (reviewToggle) {
    reviewToggle.addEventListener('click', () => {
      moduleTwoReviewMode = !moduleTwoReviewMode;

      /* Update all collapsible sections */
      document.querySelectorAll('.m02-section-collapsible').forEach((details) => {
        details.open = moduleTwoReviewMode;
      });

      /* Update the button state */
      reviewToggle.setAttribute('aria-pressed', moduleTwoReviewMode.toString());
      const icon = reviewToggle.querySelector('i');
      const text = reviewToggle.querySelector('span') || reviewToggle;
      if (icon) {
        icon.className = moduleTwoReviewMode ? 'ri-eye-off-line' : 'ri-eye-line';
      }
      if (text && text !== reviewToggle) {
        text.textContent = moduleTwoReviewMode ? 'Exit Review' : 'Review Module';
      }
    });
  }

  wireModuleTwoQuiz();
  wireModuleTwoLab();
  wireModuleTwoLessons();
  wireModuleTwoIndependentLab();
}

function wireModuleTwoLab() {
  const root = document.getElementById('m02-lab-dynamic');
  if (!root || !moduleTwoState) return;

  root.addEventListener('keydown', (event) => {
    const stationButton = event.target.closest('[data-m02-station]');
    if (!stationButton || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const stations = MODULE_TWO_LAB.stations;
    const currentIndex = stations.findIndex((item) => item.id === stationButton.dataset.m02Station);
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % stations.length;
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + stations.length) % stations.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = stations.length - 1;
    event.preventDefault();
    moduleTwoState.activeStation = stations[nextIndex].id;
    moduleTwoState.resetArmed = false;
    moduleTwoSave();
    moduleTwoRenderDynamic();
    requestAnimationFrame(() => document.getElementById(`m02-tab-${stations[nextIndex].id}`)?.focus());
  });

  root.addEventListener('click', (event) => {
    const stationButton = event.target.closest('[data-m02-station]');
    if (stationButton) {
      moduleTwoState.activeStation = stationButton.dataset.m02Station;
      moduleTwoState.resetArmed = false;
      moduleTwoSave();
      moduleTwoRenderDynamic('m02-station-panel');
      return;
    }

    const reviewButton = event.target.closest('[data-m02-review-station]');
    if (reviewButton) {
      const stationId = reviewButton.dataset.m02ReviewStation;
      if (!moduleTwoState.reviewedStations.includes(stationId)) moduleTwoState.reviewedStations.push(stationId);
      const stationIndex = MODULE_TWO_LAB.stations.findIndex((item) => item.id === stationId);
      const nextStation = MODULE_TWO_LAB.stations[stationIndex + 1];
      if (nextStation) moduleTwoState.activeStation = nextStation.id;
      moduleTwoState.validationError = '';
      moduleTwoState.resetArmed = false;
      moduleTwoSave();
      moduleTwoRenderDynamic(nextStation ? 'm02-station-panel' : 'm02-worksheet-title');
      return;
    }

    if (event.target.closest('[data-m02-note-starter]')) {
      moduleTwoState.notes = 'Identity: IDN-317. Observed: [authentication fact] and [network context]. Access impact: [role change and approval status]. Recommend: preserve [record IDs] and escalate for [scoped next step].';
      moduleTwoState.resetArmed = false;
      moduleTwoSave();
      moduleTwoRenderDynamic('m02-notes');
      return;
    }

    if (event.target.closest('[data-m02-reset]')) {
      moduleTwoState.resetArmed = true;
      moduleTwoSave();
      moduleTwoRenderDynamic('m02-reset-confirm');
      return;
    }

    if (event.target.closest('[data-m02-reset-cancel]')) {
      moduleTwoState.resetArmed = false;
      moduleTwoSave();
      moduleTwoRenderDynamic('m02-feedback');
      return;
    }

    if (event.target.closest('[data-m02-reset-confirm]')) {
      moduleTwoState = LabRuntime.reset(MODULE_TWO_LAB_ID, moduleTwoUser, MODULE_TWO_DEFAULT_STATE);
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleTwoUser, 'soc-analyst', 'soc-02', MODULE_TWO_CATALOG_LAB_KEY, false);
      moduleTwoRenderDynamic('m02-investigation-title');
    }
  });

  root.addEventListener('change', (event) => {
    const input = event.target;
    if (input.matches('[data-m02-evidence]')) {
      moduleTwoState.selectedEvidence = input.checked
        ? [...new Set([...moduleTwoState.selectedEvidence, input.value])]
        : moduleTwoState.selectedEvidence.filter((id) => id !== input.value);
      moduleTwoState.validationError = '';
      moduleTwoState.resetArmed = false;
      moduleTwoSave();
      moduleTwoUpdateSelectionSummary();
      return;
    }
    if (['observation', 'analysis', 'decision'].includes(input.name)) {
      moduleTwoState[input.name] = input.value;
      moduleTwoState.validationError = '';
      moduleTwoState.resetArmed = false;
      moduleTwoSave();
    }
  });

  root.addEventListener('input', (event) => {
    if (event.target.name !== 'notes') return;
    moduleTwoState.notes = event.target.value;
    moduleTwoState.resetArmed = false;
    const count = document.querySelector('#m02-note-count span');
    if (count) count.textContent = String(moduleTwoState.notes.length);
    moduleTwoSave();
  });

  root.addEventListener('submit', (event) => {
    if (event.target.id !== 'm02-form') return;
    event.preventDefault();
    moduleTwoState.notes = event.target.elements.notes.value;
    const missing = ['observation', 'analysis', 'decision'].filter((name) => !moduleTwoState[name]);
    if (missing.length || moduleTwoState.notes.trim().length < 70) {
      moduleTwoState.validationError = missing.length
        ? 'Choose one answer for observation, analysis, and decision, then write a handoff note of at least 70 characters.'
        : 'Your decisions are saved. Expand the handoff note to at least 70 characters so another analyst can act on it.';
      moduleTwoState.resetArmed = false;
      moduleTwoSave();
      moduleTwoRenderDynamic('m02-feedback');
      return;
    }

    const result = moduleTwoScore();
    moduleTwoState.attempts += 1;
    moduleTwoState.score = result.score;
    moduleTwoState.bestScore = Math.max(moduleTwoState.bestScore || 0, result.score);
    moduleTwoState.breakdown = result.breakdown;
    moduleTwoState.feedback = result.feedback;
    moduleTwoState.validationError = '';
    moduleTwoState.lastSubmittedAt = new Date().toISOString();
    moduleTwoState.resetArmed = false;
    const passed = result.score >= MODULE_TWO_LAB.passingScore;
    if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(moduleTwoUser, MODULE_TWO_CATALOG_LAB_KEY, {
        state: passed ? 'complete' : 'in_progress',
        score: result.score,
        result: { breakdown: result.breakdown, feedback: result.feedback, attempts: moduleTwoState.attempts },
      });
    }
    if (passed) {
      moduleTwoState.completed = true;
      if (!moduleTwoState.flags.includes(MODULE_TWO_FLAG)) moduleTwoState.flags.push(MODULE_TWO_FLAG);
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleTwoUser, 'soc-analyst', 'soc-02', MODULE_TWO_CATALOG_LAB_KEY);
    }
    moduleTwoSave();
    moduleTwoRenderDynamic('m02-feedback');
  });
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 2, moduleKey: 'soc-02',
  view: viewModuleTwo, wire: wireModuleTwo });
