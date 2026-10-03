/* Module 10 — independent incident-evidence handling and case-reconstruction labs.
 * All cases, identifiers, people, systems, and artifacts are synthetic and local.
 */

const MODULE_TEN_GUIDED_LAB_ID = 'm10-guided-lab-v2';
const MODULE_TEN_ASSESSMENT_LAB_ID = 'm10-assessment-lab-v2';
const MODULE_TEN_GUIDED_KEY = 'lab-evidence-collection';
const MODULE_TEN_ASSESSMENT_KEY = 'lab-attack-mapping';
const MODULE_TEN_PASSING_SCORE = 70;

const MODULE_TEN_QUIZ_BANKS = [
  {
    conceptId: 'chain-of-custody-framework',
    conceptTitle: 'Chain-of-custody documentation and defensible acquisition',
    questions: [
      {
        id: 'm10-q-coc-1',
        prompt: `Which of these elements is MOST critical to establish a defensible chain of custody?`,
        options: [
          { id: 'a', text: 'Matching SHA-256 hashes between source and image.' },
          { id: 'b', text: 'A complete transfer ledger naming release/receipt custodians, times, seal condition, and signature from each party.' },
          { id: 'c', text: 'A photograph of the evidence on a personal device.' },
          { id: 'd', text: 'An abbreviated hash value noted on a sticky note.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Chain of custody requires documented handoffs with both parties' signatures, timestamps, seal status, and clear purpose—not just a final hash.`,
        feedbackIncorrect: `A matching hash verifies integrity at that moment, but it cannot replace missing custody records. Each transfer must be signed and dated by both custodians.`,
      },
      {
        id: 'm10-q-coc-2',
        prompt: `A read-only blocker (write-protect) device is used during acquisition. What does it establish?`,
        options: [
          { id: 'a', text: 'That the source media cannot be modified during imaging.' },
          { id: 'b', text: 'That the image is guaranteed to be identical to the source at all future times.' },
          { id: 'c', text: 'That custody gaps do not exist elsewhere in the evidence chain.' },
          { id: 'd', text: 'That the image requires no hash verification.' },
        ],
        correctId: 'a',
        feedbackCorrect: `Correct. A blocker prevents write access during acquisition, protecting the source from accidental modification. Hash verification still required; custody chain still required.`,
        feedbackIncorrect: `A blocker controls acquisition risk, but it does not guarantee all later custody events or eliminate the need for documented transfer records.`,
      },
      {
        id: 'm10-q-coc-3',
        prompt: `UTC timestamps are recorded for all evidence handling. Why is a consistent time basis critical?`,
        options: [
          { id: 'a', text: 'So all parties use the same clock reference and timezone conversions do not create ambiguity in the chronology.' },
          { id: 'b', text: 'Because local time is always inaccurate.' },
          { id: 'c', text: 'So evidence can be destroyed after 24 hours.' },
          { id: 'd', text: 'Time basis is optional if hashes match.' },
        ],
        correctId: 'a',
        feedbackCorrect: `Correct. UTC eliminates timezone ambiguity and ensures the documented sequence is reviewable and defensible across geographic locations.`,
        feedbackIncorrect: `Local time can be used, but it must be clearly labeled and converted to a consistent basis for the custody ledger.`,
      },
      {
        id: 'm10-q-coc-4',
        prompt: `An evidence copy is found on unlabelled removable media with no custodian, receipt time, or media identifier. What should an intake officer do?`,
        options: [
          { id: 'a', text: 'Accept it because a matching hash proves it is identical to the original.' },
          { id: 'b', text: 'Destroy it immediately to prevent contamination.' },
          { id: 'c', text: 'Quarantine it pending provenance review; accept only the logged originals with complete custody.' },
          { id: 'd', text: 'Merge it with the original evidence package.' },
        ],
        correctId: 'c',
        feedbackCorrect: `Correct. Hash integrity does not repair missing custody records. Quarantine uncontrolled copies to prevent analysis contamination.`,
        feedbackIncorrect: `A matching hash proves sameness at one point, not provenance or that the copy was never mishandled. Intake authority does not permit destroying potentially reviewable material.`,
      },
    ],
  },
  {
    conceptId: 'hash-integrity-vs-provenance',
    conceptTitle: 'Distinguishing hash-integrity verification from proof of custody',
    questions: [
      {
        id: 'm10-q-hash-1',
        prompt: `A source disk hash and image hash match. What does this prove?`,
        options: [
          { id: 'a', text: 'That the image is byte-identical to the source at the recorded moment.' },
          { id: 'b', text: 'That the image was never mishandled and its custody chain is complete.' },
          { id: 'c', text: 'That the image can be stored indefinitely without further verification.' },
          { id: 'd', text: 'That no other copy of the data exists.' },
        ],
        correctId: 'a',
        feedbackCorrect: `Correct. Hash matching confirms integrity at acquisition time. It does not prove later custody, integrity of copies, or absence of other versions.`,
        feedbackIncorrect: `Hashes are point-in-time integrity checks. They are necessary but not sufficient for chain of custody.`,
      },
      {
        id: 'm10-q-hash-2',
        prompt: `Two images of the same source have different hashes. What is the FIRST action?`,
        options: [
          { id: 'a', text: 'Discard both images and start over.' },
          { id: 'b', text: 'Investigate which image is corrupted and re-verify acquisition controls and custody records.' },
          { id: 'c', text: 'Accept both as equally valid.' },
          { id: 'd', text: 'Use the older timestamp as the authoritative version.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Hash mismatch signals integrity loss or acquisition error. Investigation determines which acquisition was sound and how to proceed.`,
        feedbackIncorrect: `Different hashes mean at least one image is not byte-identical to the source. The acquisition records and controls reveal why.`,
      },
      {
        id: 'm10-q-hash-3',
        prompt: `A copy of forensic evidence has a matching hash but no receipt signature in the ledger. Is it admissible in a review?`,
        options: [
          { id: 'a', text: 'Yes, because the hash matches.' },
          { id: 'b', text: 'No, because the matching hash provides absolute proof of custody.' },
          { id: 'c', text: 'Only if the missing receipt is later supplied.' },
          { id: 'd', text: 'Only after investigating the missing receipt and determining whether the copy is controlled evidence.' },
        ],
        correctId: 'd',
        feedbackCorrect: `Correct. Hash alone does not establish chain of custody. A missing receipt requires investigation before accepting the copy as controlled evidence.`,
        feedbackIncorrect: `Integrity and provenance are separate concerns. Hash matching is necessary but does not substitute for documented custody records.`,
      },
      {
        id: 'm10-q-hash-4',
        prompt: `Why should cryptographic hashing be performed on BOTH the original source and the acquired image?`,
        options: [
          { id: 'a', text: 'To double the assurance of integrity.' },
          { id: 'b', text: 'To prove that no data was lost or corrupted during acquisition if the hashes match.' },
          { id: 'c', text: 'To prevent unauthorized duplication of the evidence.' },
          { id: 'd', text: 'Because hashing the source alone is insufficient.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Hashing both establishes a baseline of what the source contained and verifies the image captured all of it without modification.`,
        feedbackIncorrect: `Hashing both provides comparison. A match proves the image is a complete, unmodified copy at that moment.`,
      },
    ],
  },
  {
    conceptId: 'correlation-vs-causation-timeline',
    conceptTitle: 'Correlation vs. causation when reconstructing an incident timeline',
    questions: [
      {
        id: 'm10-q-corr-1',
        prompt: `An email attachment arrives at 10:14Z. PowerShell execution occurs at 10:18Z on the same workstation. What is accurate to conclude?`,
        options: [
          { id: 'a', text: 'The attachment caused the execution because they are only 4 minutes apart.' },
          { id: 'b', text: 'The events are correlated in time and entity, but causation requires evidence connecting the attachment to the process.' },
          { id: 'c', text: 'The execution is unrelated because timestamps alone prove nothing.' },
          { id: 'd', text: 'The user intentionally opened the attachment at 10:18Z.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Time + entity proximity = correlation material. Causation requires a direct evidentiary link (e.g., file open event, process ancestry).`,
        feedbackIncorrect: `Proximity in time and entity are necessary but not sufficient for causation. You must connect them through observed behavior.`,
      },
      {
        id: 'm10-q-corr-2',
        prompt: `Three events have matching identifiers but occur at widely separated times. Can you assume they are part of one causal sequence?`,
        options: [
          { id: 'a', text: 'Yes, because the identifier proves continuity.' },
          { id: 'b', text: 'No. Matching identifiers are correlation material; you must validate time continuity and behavior sequence before assuming causation.' },
          { id: 'c', text: 'Only if a human operator says they are related.' },
          { id: 'd', text: 'Causation requires only one matching identifier.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. A shared identifier (account, endpoint, process ID) is a correlation signal. Causation requires unbroken behavioral continuity.`,
        feedbackIncorrect: `Shared identity is useful correlation material, but time gaps or behavioral discontinuity may mean separate incidents or coincidence.`,
      },
      {
        id: 'm10-q-corr-3',
        prompt: `A timeline shows Event A at 10:00Z and Event B at 10:15Z on the same host. An analyst assumes A caused B. What is missing?`,
        options: [
          { id: 'a', text: 'The analyst has sufficient evidence; timing and location are enough.' },
          { id: 'b', text: 'Evidence of direct causal connection: does A have a child process that leads to B, or do files/network activity link them?' },
          { id: 'c', text: 'A mathematical proof of causality.' },
          { id: 'd', text: 'Nothing. Causation is obvious from temporal proximity.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Temporal + spatial proximity = correlation. Causation requires demonstration that A's activity directly led to B—not just that A came first.`,
        feedbackIncorrect: `Correlation is time + entity. Causation requires evidence of direct behavioral connection.`,
      },
      {
        id: 'm10-q-corr-4',
        prompt: `Two events belong to separate approved maintenance tasks but occur during an incident window. Should you separate them from the causal timeline?`,
        options: [
          { id: 'a', text: 'No. Any activity during the incident window is automatically suspicious.' },
          { id: 'b', text: 'Yes. Approved change control and timing within expected windows support excluding them from incident causality unless they intersect with hostile behavior.' },
          { id: 'c', text: 'Only if management approves removal.' },
          { id: 'd', text: 'No. All events must be included regardless of change control status.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Approved baseline activity with matching change tickets can be excluded from the causal sequence. Correlation requires distinguishing signal from noise.`,
        feedbackIncorrect: `Timeline reconstruction separates incident activity from approved baseline. Chronology is more useful and defensible when distractors are clearly marked.`,
      },
    ],
  },
  {
    conceptId: 'attack-as-behavior-framework',
    conceptTitle: 'Using ATT&CK as a behavior-mapping framework subordinate to evidence',
    questions: [
      {
        id: 'm10-q-attack-1',
        prompt: `The M09 slice shows encryption activity followed by a recovery-service stop. Should those demonstrated behaviors be mapped to ATT&CK?`,
        options: [
          { id: 'a', text: 'No. ATT&CK is only for pre-incident planning.' },
          { id: 'b', text: 'Yes. Map T1486 (Data Encrypted for Impact) and T1489 (Service Stop) because the assigned records show both behaviors.' },
          { id: 'c', text: 'Yes, and also map initial access and operator identity because ransomware usually has those elements.' },
          { id: 'd', text: 'Only if management requests ATT&CK mapping.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Map only demonstrated techniques. ATT&CK is a framework for organizing observed behavior, not a list of probable next steps.`,
        feedbackIncorrect: `Do not map techniques you cannot prove. ATT&CK should not fill gaps in the evidence timeline.`,
      },
      {
        id: 'm10-q-attack-2',
        prompt: `The timeline does not show whether a tool was transferred to the target. How should you handle this in ATT&CK mapping?`,
        options: [
          { id: 'a', text: 'Map T1105 (Ingress Tool Transfer) because a connection was observed.' },
          { id: 'b', text: 'Do not map T1105 because evidence of file transfer is absent. Note the unknown as a limitation.' },
          { id: 'c', text: 'Assume tool transfer occurred and map it provisionally.' },
          { id: 'd', text: 'Decline to use ATT&CK framework because the timeline is incomplete.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Connection ≠ transfer. Map only demonstrated techniques; note unknowns explicitly.`,
        feedbackIncorrect: `ATT&CK should organize evidence, not manufacture conclusions. Unproven behavior remains unknown.`,
      },
      {
        id: 'm10-q-attack-3',
        prompt: `An ATT&CK tactic page shows several techniques relevant to the incident. Should you map all of them?`,
        options: [
          { id: 'a', text: 'Yes. Using the full tactic ensures complete coverage.' },
          { id: 'b', text: 'No. Map only the techniques with direct evidence in the incident timeline. Other techniques remain unmapped and noted as unknowns.' },
          { id: 'c', text: 'Map the tactic name but skip individual techniques to save time.' },
          { id: 'd', text: 'Yes, but label unmapped techniques as "possible."' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Selective mapping to evidence is more valuable than comprehensive mapping. Unknowns must be explicit.`,
        feedbackIncorrect: `Mapping every technique in a tactic adds noise. Focus mapping on what the evidence supports.`,
      },
      {
        id: 'm10-q-attack-4',
        prompt: `The incident response timeline is complete and covers all observables. The ATT&CK mapping is now the full incident record. Is this accurate?`,
        options: [
          { id: 'a', text: 'Yes. ATT&CK mapping summarizes the entire incident.' },
          { id: 'b', text: 'No. ATT&CK is a framework for categorizing behavior. The incident record must include the original timeline, entities, impact, custody, and uncertainty separately.' },
          { id: 'c', text: 'Yes, if the ATT&CK mapping uses technical language.' },
          { id: 'd', text: 'No. ATT&CK is not relevant to incident response.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. ATT&CK organizes behavior; it does not replace chronology, scope, impact, or custody documentation.`,
        feedbackIncorrect: `ATT&CK is a tactical reference, not a replacement for incident-response documentation.`,
      },
    ],
  },
  {
    conceptId: 'bounded-conclusions-confidence',
    conceptTitle: 'Bounding conclusions and confidence appropriately',
    questions: [
      {
        id: 'm10-q-bound-1',
        prompt: `You investigated one endpoint and found it compromised. A search across the network found no matches. What should you communicate?`,
        options: [
          { id: 'a', text: 'The endpoint is compromised and the entire organization is definitely clean.' },
          { id: 'b', text: 'The endpoint is confirmed compromised. The scoped search found no matches; continue monitoring unobserved segments for indicators.' },
          { id: 'c', text: 'The endpoint may be compromised and perhaps others are too.' },
          { id: 'd', text: 'The search was inconclusive and no findings should be reported.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. State confirmed scope, search results, and explicitly note what remains unknown or unmonitored.`,
        feedbackIncorrect: `Avoid both overclaiming certainty and refusing to conclude. State what the evidence shows and what it does not show.`,
      },
      {
        id: 'm10-q-bound-2',
        prompt: `The incident timeline explains the initial compromise but does not show exfiltration or wider lateral movement. How should you frame your confidence?`,
        options: [
          { id: 'a', text: 'High confidence in the initial sequence; lateral movement and impact remain unproven by this dataset.' },
          { id: 'b', text: 'Low confidence because exfiltration was not observed.' },
          { id: 'c', text: 'Absolute certainty that no exfiltration occurred.' },
          { id: 'd', text: 'No conclusion is possible without complete data.' },
        ],
        correctId: 'a',
        feedbackCorrect: `Correct. Segment confidence: high for proven facts, high-bounded for scoped inference, explicit for unknowns.`,
        feedbackIncorrect: `You can draw bounded conclusions from partial data. Transparency about evidence gaps enables informed decisions.`,
      },
      {
        id: 'm10-q-bound-3',
        prompt: `What is the difference between "This host was compromised" and "This host may have been compromised"?`,
        options: [
          { id: 'a', text: 'No difference. Both express uncertainty.' },
          { id: 'b', text: 'The first is supported by evidence; the second is speculation. Use the first only when the evidence base is solid.' },
          { id: 'c', text: 'The second is more professional.' },
          { id: 'd', text: 'They are identical in meaning and impact.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Precision in language reflects precision in evidence. "Was compromised" = proven. "May have been" = suspicious but unproven.`,
        feedbackIncorrect: `Language precision matters. Unjustified hedging hides evidence; unjustified certainty overstates it.`,
      },
      {
        id: 'm10-q-bound-4',
        prompt: `You find evidence of initial compromise and containment. The attacker's original objective remains unknown. Should you report this unknown?`,
        options: [
          { id: 'a', text: 'No. Reporting unknowns makes the response look incomplete.' },
          { id: 'b', text: 'Yes. Unknown attacker objective is an honest limitation. It bounds your confidence in impact assessment.' },
          { id: 'c', text: 'Only if management asks.' },
          { id: 'd', text: 'Assume a likely objective and report it as probable.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Explicit unknowns build trust and shape appropriate response. Do not omit limitations to appear complete.`,
        feedbackIncorrect: `Acknowledging unknowns is a strength, not a weakness. It shows analytical rigor and bounds the scope of claims.`,
      },
    ],
  },
];

const MODULE_TEN_SOURCES_LIST = [
  {
    title: `Guide to Integrating Forensic Techniques into Incident Response (SP 800-86)`,
    org: `NIST`,
    url: `https://csrc.nist.gov/pubs/sp/800/86/final`,
    note: `Authoritative guidance on forensic acquisition, chain of custody, and evidence preservation techniques—directly applicable to both labs in this module.`,
  },
  {
    title: `Guidelines for Evidence Collection and Archiving (RFC 3227)`,
    org: `IETF`,
    url: `https://www.rfc-editor.org/rfc/rfc3227`,
    note: `Foundational, widely-cited guidance on evidence collection order, documentation, and chain-of-custody tracking during a security incident.`,
  },
  {
    title: `ATT&CK Matrix — Initial Access`,
    org: `MITRE`,
    url: `https://attack.mitre.org/tactics/TA0001/`,
    note: `Framework reference used for disciplined behavior mapping; this module's shared M09 slice does not establish initial access.`,
  },
  {
    title: `ATT&CK Matrix — Execution`,
    org: `MITRE`,
    url: `https://attack.mitre.org/tactics/TA0002/`,
    note: `Framework reference for behavior mapping; no command-interpreter behavior is claimed unless the assigned evidence supports it.`,
  },
  {
    title: `Electronic Crime Scene Investigation: A Guide for First Responders, Second Edition`,
    org: `National Institute of Justice`,
    url: `https://nij.ojp.gov/library/publications/electronic-crime-scene-investigation-guide-first-responders-second-edition`,
    note: `Practical guidance on recognizing, collecting, packaging, and transporting digital evidence — the physical-handling half of this module's custody lab.`,
  },
  {
    title: `Security+ (SY0-701) Certification Overview & Objectives Summary`,
    org: `CompTIA`,
    url: `https://www.comptia.org/certifications/security`,
    note: `Supplementary public reference only. The §2 crosswalk is a developer draft pending curriculum, compliance, and faculty review; this study aid is not an approval, affiliation, endorsement, or pass guarantee.`,
  },
];

// Standard ITSM Incident Ticket (docs/specs/MODULE_STANDARD.md §7.2) for the
// Assessment Lab's Prove It submission. Authored from the imported
// windows-forensics scenarios this module assigns: wf-1's event-log
// intrusion sequence (j.sanders / wkstn-19, failed logons -> success ->
// PowerShell execution) and wf-5's deleted-file staging on jdoe's desktop
// (portal/imported-labs/mission-next-labs/src/data/labs/windows-forensics.labs.js).
// Answer key stays here, never shown live in Prove It.
const MODULE_TEN_CASE = {
  caseId: 'EVD-5510',
  userOptions: [
    { id: 'j.sanders', text: 'j.sanders', tier: 'principal' },
    { id: 'jdoe', text: 'jdoe', tier: 'pivot' },
    { id: 'm.alvarez', text: 'm.alvarez', tier: 'noise' },
    { id: 't.nguyen', text: 't.nguyen', tier: 'noise' },
    { id: 'svc-backup', text: 'svc-backup', tier: 'noise' },
    { id: 'r.patel', text: 'r.patel', tier: 'noise' },
  ],
  deviceOptions: [
    { id: 'wkstn-19', text: 'wkstn-19', tier: 'principal' },
    { id: 'wks-desk-07', text: 'wks-desk-07 (jdoe desktop)', tier: 'pivot' },
    { id: 'wkstn-42', text: 'wkstn-42', tier: 'noise' },
    { id: 'srv-file-02', text: 'srv-file-02', tier: 'noise' },
    { id: 'lap-233', text: 'lap-233', tier: 'noise' },
    { id: 'wkstn-08', text: 'wkstn-08', tier: 'noise' },
  ],
  departmentOptions: [
    { id: 'tier2-soc', text: 'Tier 2 SOC — Incident Response', fit: 100 },
    { id: 'digital-forensics', text: 'Digital Forensics Team', fit: 70,
      note: 'Forensics can image and preserve wkstn-19 and the recovered files, but this case also needs the account-compromise leg contained — Tier 2 SOC owns both together.' },
    { id: 'identity-response', text: 'Identity Response', fit: 55,
      note: 'Identity Response can reset j.sanders, but has no authority over the endpoint evidence and deleted-file staging — Tier 2 SOC coordinates both.' },
    { id: 'help-desk', text: 'Help Desk', fit: 10,
      bounce: 'Help Desk can’t act on a confirmed intrusion with evidence-preservation needs — route to Tier 2 SOC.' },
  ],
  correctStatus: 'in-progress',
  correctSeverity: 'high',
  correctAffectedUser: 'j.sanders',
  correctAffectedDevice: 'wkstn-19',
  correctDisposition: 'true-positive',
  correctEscalation: 'required',
  correctEscalateTo: 'tier2-soc',
  departmentBounceThreshold: 40,
};

// Prove It scoring: same weighting model as Module 01 (entity tiers 20,
// severity 15, disposition 20, escalation/routing up to 35, notes 10).
// `missing` gates the submit button; score/breakdown are always computed
// for the instructor.
function moduleTenCasePerformance() {
  const state = moduleTenAssessmentState;
  const lab = MODULE_TEN_CASE;
  const spec = moduleTenCaseSpec();
  const department = lab.departmentOptions.find((option) => option.id === state.escalateTo) || null;
  const escalationRequiredOk = state.escalation === 'required';
  const bounced = escalationRequiredOk && department && department.fit < lab.departmentBounceThreshold;

  const missing = caseRecordMissing(state, spec);

  const userTier = lab.userOptions.find((entry) => entry.id === state.affectedUser)?.tier;
  // Hostnames are case-insensitive: a ticket saved before the lower-case host migration (WKSTN-19) scores as wkstn-19.
  const deviceTier = lab.deviceOptions.find((entry) => entry.id === String(state.affectedDevice || '').toLowerCase())?.tier;
  const tierFit = (tier) => (tier === 'principal' ? 1 : tier === 'pivot' ? 0.5 : 0);
  const entityPoints = Math.round((tierFit(userTier) + tierFit(deviceTier)) * 10); // 0-20

  const severity = caseRecordSeverity(state) === lab.correctSeverity ? 15 : 0;
  const disposition = caseRecordDisposition(state) === lab.correctDisposition ? 20 : 0;
  const escalation = escalationRequiredOk && department && !bounced ? Math.round((department.fit / 100) * 35) : 0;
  const notesLen = (state.notes || '').trim().length;
  const notes = Math.round(Math.min(1, notesLen / 80) * 10);
  const score = entityPoints + severity + disposition + escalation + notes;
  const criticalErrors = state.escalation === 'not-required' ? ['escalation-not-required'] : [];

  const entityFeedback = entityPoints >= 20
    ? 'Affected entity/scope: correct — the confirmed user and device.'
    : entityPoints > 0
      ? 'Affected entity/scope: partial credit — a related entity is supported by the evidence, but j.sanders/wkstn-19 is the confirmed affected user/device.'
      : 'Affected entity/scope: review — j.sanders/wkstn-19 is the confirmed affected user/device, supported by the event-log evidence.';
  const routingFeedback = !escalationRequiredOk
    ? 'Routing: not applicable — escalation was set to not required.'
    : !department
      ? 'Routing: review — this case needs a department routed with the recorded evidence.'
      : department.fit >= 100
        ? `Routing: correct — ${department.text} is the best-fit department for this case.`
        : department.fit >= lab.departmentBounceThreshold
          ? `Routing: accepted, but not the best fit — ${department.note}`
          : `Routing: returned — ${department.bounce || department.note}`;

  return {
    missing,
    score,
    breakdown: { affected_entity: entityPoints, severity, disposition, escalation, analyst_notes: notes },
    department, bounced,
    feedback: [
      entityFeedback,
      severity ? 'Severity: correct.' : 'Severity: review — this intrusion sequence supports High severity.',
      disposition ? 'Disposition: correct.' : 'Disposition: review — the evidence supports confirmed malicious activity.',
      routingFeedback,
    ],
    criticalErrors,
  };
}

// spec shared by rendering, missing-item, and scoring code. `extraMissing`
// keeps the "mark both imported labs complete first" gate this module
// already had.
function moduleTenCaseSpec() {
  const bucket = moduleTenAssessmentState.labProgress;
  const labsReady = missionNextAllLabsComplete(bucket, MODULE_TEN_ASSESSMENT_LAB_IDS);
  return {
    caseId: MODULE_TEN_CASE.caseId,
    userOptions: MODULE_TEN_CASE.userOptions,
    deviceOptions: MODULE_TEN_CASE.deviceOptions,
    departmentOptions: MODULE_TEN_CASE.departmentOptions,
    notesPlaceholder: 'Summarize the evidence package and custody, the reconstructed chain, what is not established, and the specialist handoff…',
    // Optional Labs never gate the ticket; the locker and reconstruction are scored on submit.
    extraMissing: [],
    disabled: moduleTenAssessmentState.submitted === true,
  };
}

// '' until submitted; then 'review' while the latest attempt awaits faculty,
// 'graded' once an instructor has reviewed it without sending it back.
function moduleTenCaseReviewStatus() {
  if (!moduleTenAssessmentState?.submitted) return '';
  const attempt = moduleTenUser?.latestLabAttemptByKey?.[MODULE_TEN_ASSESSMENT_KEY];
  return attempt?.reviewedAt && !attempt.redoRequested ? 'graded' : 'review';
}

function moduleTenCaseRedoRequested() {
  return moduleTenUser?.openLabRedosByModuleKey?.['soc-10']?.labKey === MODULE_TEN_ASSESSMENT_KEY;
}

function moduleTenCaseRedoFeedback() {
  if (!moduleTenCaseRedoRequested()) return '';
  const items = moduleTenUser.openLabRedosByModuleKey['soc-10'].feedback || [];
  return `<div class="m01-redo-feedback" role="note">
    <strong><i class="ri-feedback-line" aria-hidden="true"></i> Instructor feedback</strong>
    ${items.length
      ? `<ul>${items.map((item) => `<li>${item.item_label ? `<strong>${esc(item.item_label)}:</strong> ` : ''}${esc(item.comment || '')}</li>`).join('')}</ul>`
      : '<p>Your instructor returned this case without written notes. Use Message Instructor if you are not sure what to change.</p>'}
  </div>`;
}

let moduleTenQuizState = null;
// Set when the learner explicitly asks to retake a knowledge check that the
// account already records as passed (see moduleTenQuizVerifiedElsewhere()).
let moduleTenQuizForceRetake = false;
let moduleTenReviewMode = false;
let moduleTenUser = null;

const MODULE_TEN_GUIDED_DEFAULT_STATE = { practiceComplete: false, practiceNotes: '', lastQuizQuestionIds: [], labProgress: {}, learnItStep: 0, caseRecord: { status: '', affectedUser: '', affectedDevice: '', severity: '', disposition: '', escalation: '', escalateTo: '', notes: '', findings: {}, submitted: false, submittedAt: '', actionHistory: [] } };
const MODULE_TEN_ASSESSMENT_DEFAULT_STATE = {
  completed: false, attempts: 0, feedback: [], validationError: '', lastSubmittedAt: '', notes: '', flags: [], labProgress: {},
  // Standard case-record ticket fields (docs/specs/MODULE_STANDARD.md §7.2).
  submitted: false, status: '', severity: '', affectedUser: '', affectedDevice: '',
  disposition: '', escalation: '', escalateTo: '', findings: {}, actionHistory: [],
  score: null, breakdown: null, showMissing: false,
};

const MODULE_TEN_GUIDED_LAB_IDS = ['guided-1', 'guided-2'];
const MODULE_TEN_ASSESSMENT_LAB_IDS = ['assessment-1', 'assessment-2', 'additional-1', 'additional-2'];

let moduleTenGuidedState = null;
let moduleTenAssessmentState = null;
let moduleTenGuidedEvidenceState = null;

function moduleTenLoad(user) {
  if (moduleTenUser?.email !== user?.email) { moduleTenQuizForceRetake = false; moduleTenLearnViewed = null; }
  moduleTenUser = user;
  moduleTenGuidedState = LabRuntime.loadCaseState(MODULE_TEN_GUIDED_LAB_ID, 'soc-10', user, MODULE_TEN_GUIDED_DEFAULT_STATE);
  if (moduleTenGuidedState.practiceComplete === true && !moduleTenGuidedState.caseRecord?.submitted) { moduleTenGuidedState.caseRecord.submitted = true; moduleTenGuidedState.caseRecord.submittedAt ||= new Date().toISOString(); }
  moduleTenGuidedEvidenceState = SocM10AssessmentState.load(user, MODULE_TEN_GUIDED_FIXTURE);
  moduleTenAssessmentState = LabRuntime.loadCaseState(MODULE_TEN_ASSESSMENT_LAB_ID, 'soc-10', user, MODULE_TEN_ASSESSMENT_DEFAULT_STATE);
  if (typeof moduleTenGuidedState.practiceNotes !== 'string') moduleTenGuidedState.practiceNotes = '';
  if (!Array.isArray(moduleTenGuidedState.lastQuizQuestionIds)) moduleTenGuidedState.lastQuizQuestionIds = [];
  if (typeof moduleTenAssessmentState.notes !== 'string') moduleTenAssessmentState.notes = '';
  if (!Array.isArray(moduleTenAssessmentState.feedback)) moduleTenAssessmentState.feedback = [];
  if (!Array.isArray(moduleTenAssessmentState.flags)) moduleTenAssessmentState.flags = [];
  if (!moduleTenGuidedState.labProgress || typeof moduleTenGuidedState.labProgress !== 'object') moduleTenGuidedState.labProgress = {};
  if (!moduleTenAssessmentState.labProgress || typeof moduleTenAssessmentState.labProgress !== 'object') moduleTenAssessmentState.labProgress = {};
  // Case-record migration: default any field an older saved attempt never
  // had, and treat any already-completed old-form attempt as submitted so
  // it keeps rendering "Lab Under Review" / "Lab Graded" rather than
  // re-opening a blank ticket.
  if (!moduleTenAssessmentState.findings || typeof moduleTenAssessmentState.findings !== 'object') moduleTenAssessmentState.findings = {};
  if (!Array.isArray(moduleTenAssessmentState.actionHistory)) moduleTenAssessmentState.actionHistory = [];
  ['status', 'severity', 'affectedUser', 'affectedDevice', 'disposition', 'escalation', 'escalateTo'].forEach((key) => {
    if (typeof moduleTenAssessmentState[key] !== 'string') moduleTenAssessmentState[key] = '';
  });
  if (typeof moduleTenAssessmentState.submitted !== 'boolean') moduleTenAssessmentState.submitted = false;
  if (typeof moduleTenAssessmentState.showMissing !== 'boolean') moduleTenAssessmentState.showMissing = false;
  if (moduleTenAssessmentState.completed && !moduleTenAssessmentState.submitted) moduleTenAssessmentState.submitted = true;
  // Hostnames moved to lower case (entity identity contract); keep tickets saved with the old upper-case
  // device id selected in the dropdown. Only values that match a current option ignoring case are rewritten.
  moduleTenAssessmentState.affectedDevice = moduleTenCanonicalDevice(moduleTenAssessmentState.affectedDevice, MODULE_TEN_CASE.deviceOptions);
  if (moduleTenGuidedState.caseRecord && typeof moduleTenGuidedState.caseRecord.affectedDevice === 'string') {
    moduleTenGuidedState.caseRecord.affectedDevice = moduleTenCanonicalDevice(moduleTenGuidedState.caseRecord.affectedDevice, MODULE_TEN_GUIDED_DEVICE_OPTIONS);
  }
  // Carried tool workspaces (endpoint device selection, hunt query scope) may hold the old upper-case host ids.
  if (moduleTenAssessmentState.tools) moduleTenAssessmentState.tools = moduleTenLowerHostRefs(moduleTenAssessmentState.tools, MODULE_TEN_CONSOLE_DATA);
  if (moduleTenGuidedState.tools) moduleTenGuidedState.tools = moduleTenLowerHostRefs(moduleTenGuidedState.tools, MODULE_TEN_GUIDED_CONSOLE_DATA);

  // Initialize quiz state
  if (!moduleTenQuizState) {
    const previousQuestionIds = moduleTenGuidedState.lastQuizQuestionIds || [];
    const selection = selectQuizQuestions(MODULE_TEN_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    moduleTenQuizState = {
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

  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'soc-analyst', 'soc-10');
}

function moduleTenCanonicalDevice(value, options) {
  const match = (options || []).find((option) => option.id.toLowerCase() === String(value || '').toLowerCase());
  return match ? match.id : value;
}
// Rewrites any saved string that is exactly a dataset host written in another case (WKSTN-19 -> wkstn-19); nothing else changes.
function moduleTenLowerHostRefs(value, data) {
  const hosts = new Set(Object.values(data.tables || {}).flat().map((row) => String(row.Host || '').toLowerCase()).filter(Boolean));
  const walk = (node) => {
    if (typeof node === 'string') return node !== node.toLowerCase() && hosts.has(node.toLowerCase()) ? node.toLowerCase() : node;
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === 'object') return Object.fromEntries(Object.entries(node).map(([key, item]) => [key, walk(item)]));
    return node;
  };
  return walk(value);
}

function moduleTenSaveGuided() { if (moduleTenUser && moduleTenGuidedState) LabRuntime.saveCaseState(MODULE_TEN_GUIDED_LAB_ID, 'soc-10', moduleTenUser, moduleTenGuidedState); }
let moduleTenLearnViewed = null;
function moduleTenLearnItHtml() { const deck = LearnItDecks['soc-10']; return LearnItCards.render({ deck, step: moduleTenGuidedState.learnItStep || 0, viewed: moduleTenLearnViewed, done: (moduleTenGuidedState.learnItStep || 0) >= deck.length, prefix: 'm10', id: 'm10-learn-it', headingId: 'm10-learn-title', heading: 'Preserve and explain evidence', intro: 'Seven ideas for careful evidence handling.', readyHeading: 'Evidence handling, in seven ideas', readyText: 'Start with the evidence principles, then open the Guided Lab.', readyActionLabel: 'LEARN IT', finalActionLabel: 'Finish', doneHeading: 'Evidence principles ready', doneIntro: 'Open the Guided Lab to practice a bounded case.' }); }
function moduleTenWireLearnIt() { const shell = document.querySelector('.m10-shell'); if (!shell || shell.dataset.learnItWired) return; shell.dataset.learnItWired = 'true'; LearnItCards.wire(shell, { prefix: 'm10', onStep: (step) => { moduleTenGuidedState.learnItStep = step; moduleTenLearnViewed = null; moduleTenSaveGuided(); document.getElementById('m10-learn-it').outerHTML = moduleTenLearnItHtml(); }, onView: (index) => { moduleTenLearnViewed = index; document.getElementById('m10-learn-it').outerHTML = moduleTenLearnItHtml(); shell.querySelector(`[data-m10-learn-view="${index}"]`)?.focus(); } }); }
function moduleTenSaveGuidedEvidence(next = moduleTenGuidedEvidenceState) { if (moduleTenUser && next) moduleTenGuidedEvidenceState = SocM10AssessmentState.save(moduleTenUser, next, MODULE_TEN_GUIDED_FIXTURE); }
function moduleTenSaveAssessment() { if (moduleTenUser && moduleTenAssessmentState) LabRuntime.saveCaseState(MODULE_TEN_ASSESSMENT_LAB_ID, 'soc-10', moduleTenUser, moduleTenAssessmentState); }


function moduleTenGuidedSteps() {
  return [
    { title: 'Read the ticket', body: 'Review the collection request, incident context, and authorized work boundaries.', lookFor: 'The request asks for defensible evidence handling and a bounded conclusion.', lab: 'Confirm the assigned case and handoff objective.', tab: 'case', target: '.m01-ticket-id' },
    { title: 'Start from the lead', body: 'Open the collection request and the system or user it names.', lookFor: 'A lead identifies what to examine; it does not prove every proposed impact.', lab: 'Orient to the evidence request.', tab: 'alerts', target: 'tr[data-m03e-select$=":alert:REQ-6620"]' },
    { title: 'Acquire and verify artifacts', body: 'Collect relevant artifacts and preserve their source identifiers, hashes, and custody records.', lookFor: 'Acquisition details and custody events tied to each artifact.', lab: 'Build a traceable evidence set.', tab: 'evidence', target: '.m03e-table-wrap' },
    { title: 'Reconstruct the chronology', body: 'Compare timestamps and provenance, resolving conflicts before drawing conclusions.', lookFor: 'Corroborating artifacts and documented source limitations.', lab: 'Establish the supported sequence of events.', tab: 'timeline', target: '.m03e-timeline-head' },
    { title: 'Separate primary and contributing evidence', body: 'Identify which artifact directly supports a finding and which only corroborates or adds context.', lookFor: 'A direct event record versus related artifacts that support chronology.', lab: 'State the evidentiary role of each finding.', tab: 'evidence', target: '.m03e-table-wrap' },
    { title: 'Set scope and decide', body: 'State supported impact and uncertainty; assign specialist work and the next verification.', lookFor: 'Integrity is not provenance, and neither alone proves exfiltration.', lab: 'Complete the bounded case decision.', tab: 'case', target: '.m01-ticket-grid' },
    { title: 'Submit the ticket', body: 'Document custody, chronology, limits, and next owner in the ITSM ticket, then submit.', lookFor: 'A traceable handoff with a specific verification step.', lab: 'Submit the ticket when the handoff is ready.', tab: 'case', target: '.m01-ticket-actions' },
  ];
}

function moduleTenGuidedLabPanel() {
  const evidence = moduleTenGuidedEvidenceState || {};
  const complete = moduleTenGuidedState.caseRecord.submitted === true;
  const cr = moduleTenGuidedState.caseRecord;
  const steps = moduleTenGuidedSteps();
  if (!complete) { m03eState('m10-guided').tab = steps[Math.min(moduleTenGuidedState.guideStep || 0, steps.length - 1)].tab; moduleTenSaveGuided(); }
  const quality = (value, expected, contributing = []) => !value ? 'missed' : value === expected ? 'captured' : contributing.includes(value) ? 'contributing' : 'missed';
  const locker = Object.values(evidence.locker || {}); const timeline = evidence.timeline || []; const held = evidence.legalHold?.artifactIds || [];
  const note = (cr.notes || '').toLowerCase(); const entities = note.includes('wkstn-42') && note.includes('m.chen'); const custody = /custod|hash|integrity|provenance/.test(note); const chronology = /chronolog|timeline|event|timestamp/.test(note); const bounded = /exfiltration|unknown|unproven|limit|verify|owner/.test(note);
  const artifactQuality = locker.filter((item) => item.integrity === 'verified').length >= 4 && timeline.length >= 3 && held.length >= 2 ? 'captured' : locker.length || timeline.length || held.length ? 'contributing' : 'missed';
  const debrief = complete ? guidedLabDebrief({ story: 'The case supports a bounded chronology from acquired artifacts whose integrity and custody can be verified. Hash integrity supports that an artifact has not changed since hashing; it does not establish provenance or prove exfiltration.', fields: [
    { name: 'Ticket status', status: quality(cr.status, 'in-progress', ['pending']), note: 'Keep evidence work open until specialist verification is complete.' },
    { name: 'Affected user', status: quality(cr.affectedUser, 'm.chen', ['a.rivera']), note: 'Identify the affected user; the unopened recipient is related context.' },
    { name: 'Affected device', status: quality(cr.affectedDevice, 'wkstn-42', ['wks-fin-12']), note: 'Name the acquired workstation; the comparison device is contributing context.' },
    { name: 'Severity', status: quality(cr.severity, 'high', ['medium']), note: 'Reflect verified impact without overstating scope.' },
    { name: 'Disposition', status: quality(cr.disposition, 'true-positive', ['false-negative']), note: 'Classify the supported incident finding.' },
    { name: 'Evidence custody and chronology', status: artifactQuality, note: 'Use verified artifacts, a corroborated timeline, and documented legal hold.' },
    { name: 'Escalation and department', status: cr.escalation === 'required' && cr.escalateTo === 'guided-digital-forensics' ? 'captured' : cr.escalation === 'required' && cr.escalateTo === 'legal-hold' ? 'contributing' : 'missed', note: 'Route specialist analysis with legal hold support.' },
    { name: 'Evidence and handoff notes', status: entities && custody && chronology && bounded ? 'captured' : entities || custody || chronology || bounded ? 'contributing' : 'missed', note: 'Describe the system, custody, supported chronology, owner, and limits.' },
  ], handoff: 'A strong handoff preserves artifact identifiers and custody, distinguishes integrity from provenance, states only supported events, assigns specialist follow-up, and names the next verification.' }) : '';
  const guide = guidedLabGuide('m10', steps, { step: moduleTenGuidedState.guideStep, docked: complete ? moduleTenGuidedState.guideDocked !== false : moduleTenGuidedState.guideDocked, prefix: 'm10-guided', submitted: complete, debriefHtml: debrief });
  const consoleHtml = moduleThreeConsoleHtml('m10-guided');
  return `<section class="m10-guided-case"><p class="m10-panel-instruction">Preserve a defensible evidence set and write what its chronology supports.</p>
    ${complete ? '' : guide}
    <div class="m03e-console-host" id="m03e-console-m10-guided">${complete ? consoleHtml.replace('</header>', `${guide}</header>`) : consoleHtml}</div>
    <p class="m10-guided-status" role="status">${complete ? 'Practice submitted.' : `${moduleTenGuidedEvidenceReady() ? 'Evidence custody and chronology captured. ' : 'Continue preserving and correlating the evidence. '}Submit the ITSM ticket to complete this Guided Lab.`}</p>
  </section>`;
}

/* The Module 3 console carrying Modules 4–9 on EVD-5510, plus the Evidence
 * Locker and Reconstruction. Every artifact is a Log Search row; pinning it
 * queues it for locker intake. */
const MODULE_TEN_ARTIFACT_TABLES = {
  email_message: 'EmailEvents', mail_trace: 'EmailEvents', file: 'DeviceFileEvents', process_log: 'DeviceProcessEvents',
  registry: 'DeviceRegistryEvents', network_log: 'ProxyEvents', memory_image: 'ForensicAcquisitions', system_log: 'SystemLog',
};
// Well-known OS principals (normalized Account form) are not people: no IdentityInfo row, never the primary user.
const MODULE_TEN_BUILTIN_ACCOUNTS = new Set(['system', 'local-service', 'network-service']);
function moduleTenBuildConsoleData(fixture, caseId) {
  const s = fixture.scenario;
  const identities = [...new Set(s.artifacts.map((artifact) => artifact.account).filter((account) => account && !MODULE_TEN_BUILTIN_ACCOUNTS.has(account)))]
    .map((account) => ({ Account: account, DisplayName: account, Type: 'User', Department: 'Service owner', Owner: '—', Privileged: 'No', UsualSourceIp: '—', Notes: `Identity represented in case ${s.caseId}` }));
  const workstation = s.artifacts.find((artifact) => artifact.type === 'process_log')?.host || s.artifacts[0]?.host || '';
  const primaryUser = s.artifacts.find((artifact) => artifact.host === workstation && !MODULE_TEN_BUILTIN_ACCOUNTS.has(artifact.account))?.account || '';
  const events = s.artifacts.map((a) => m03eRow(MODULE_TEN_ARTIFACT_TABLES[a.type] || 'CaseArtifacts', a.id, a.time.slice(0, 10), a.time.slice(11, 19), {
    EventType: a.type, Account: a.account, ...(a.accountNative ? { AccountNative: a.accountNative } : {}), Host: a.host, DeviceId: a.host, Result: a.title, SourceSystem: a.source, SourceSha256: a.sourceHash, Detail: `${a.title}. ${a.detail}`,
    ...(a.acquisitionTime ? { AcquisitionTime: a.acquisitionTime } : {}), ...(a.ingestionTime ? { IngestionTime: a.ingestionTime } : {}),
  })).concat(moduleTenSourceEventRows(s), moduleTenProvenanceRows(s));
  return {
    ...m03eBuildDataset({
      caseId,
      day: s.start.slice(0, 10),
      events,
      identities,
      ips: [],
      watchlists: { Custodians: { title: 'Evidence custodians', rows: s.custodians.map((item) => ({ Custodian: item.id, Role: item.label })) } },
      alerts: [{ id: s.request.id, time: s.request.receivedAt, severity: 'High', title: `Evidence collection request for contained ${workstation}`, entities: [workstation, primaryUser], rule: s.request.text, query: `UnifiedEvents\n| where Host == "${workstation}"\n| sort by TimeGenerated asc` }],
    }),
    now: s.end,
  };
}

/* Background source/system events (fixture.scenario.sourceEvents) become rows in their native tables. */
function moduleTenSourceEventRows(s) {
  const hashes = new Map(s.artifacts.map((a) => [a.id, a.sourceHash]));
  return (s.sourceEvents || []).map((e) => m03eRow(e.table, e.id, e.time.slice(0, 10), e.time.slice(11, 19), {
    EventType: e.type, Account: e.account, ...(e.accountNative ? { AccountNative: e.accountNative } : {}), Host: e.host, DeviceId: e.host, Result: e.result, Detail: e.detail,
    ...(e.ingestionTime ? { IngestionTime: e.ingestionTime } : {}), ...(e.hashOf ? { SourceSha256: hashes.get(e.hashOf) } : {}),
  }));
}
/* Source-side provenance ledger derived from the artifacts so hashes and times can never drift apart: one export
 * record and one hash-verification record per artifact, a repeat verification for the artifacts the reconstruction
 * relies on, and the staging-to-analyst release. Event time, ingestion time and acquisition time stay distinct
 * fields. These are not the learner's actions; those live in the locker history. */
function moduleTenProvenanceRows(s) {
  const at = (iso, plusSeconds) => new Date(Date.parse(iso) + plusSeconds * 1000).toISOString().replace('.000Z', 'Z');
  const row = (id, iso, fields) => m03eRow('EvidenceCustodyLog', id, iso.slice(0, 10), iso.slice(11, 19), fields);
  const repeat = new Set(s.repeatVerificationIds || []);
  const rows = [];
  const prefix = s.id.split('-')[0];
  let n = 0;
  const custodian = s.stagingCustodian || 'ir-collection-team';
  const stagingHost = s.stagingHost || 'evidence-staging';
  s.artifacts.forEach((a, index) => {
    const coc = `COC-${s.caseId}-${a.id}`;
    const base = { Host: a.host, DeviceId: a.host, CustodyId: coc, ArtifactId: a.id, AcquisitionTime: a.acquisitionTime, EventTime: a.time, ...(a.ingestionTime ? { IngestionTime: a.ingestionTime } : {}) };
    rows.push(row(`${prefix}-CUS-${String(++n).padStart(3, '0')}`, a.acquisitionTime, { ...base, EventType: 'ArtifactExported', Account: custodian, Result: 'Exported', SourceSha256: a.sourceHash,
      CustodyFrom: 'source-system', CustodyTo: custodian, Detail: `${a.id} exported from ${a.source} by ${custodian}; source-reported SHA-256 recorded. ${coc}.` }));
    const ok = a.verificationHash === a.sourceHash;
    rows.push(row(`${prefix}-CUS-${String(++n).padStart(3, '0')}`, at(a.acquisitionTime, 120), { ...base, EventType: 'HashVerification', Account: custodian, Result: ok ? 'Match' : 'Mismatch', SourceSha256: a.verificationHash,
      Detail: ok ? `${a.id}: re-hash of the staged copy matches the source-reported hash (pass 1). ${coc}.` : `${a.id}: re-hash of the staged copy does NOT match the source-reported ${a.sourceHash.slice(0, 8)}... (pass 1); the staged copy is not reliable. ${coc}.` }));
    if (repeat.has(a.id)) {
      rows.push(row(`${prefix}-CUS-${String(++n).padStart(3, '0')}`, at(a.acquisitionTime, 480), { ...base, EventType: 'HashVerification', Account: custodian, Result: ok ? 'Match' : 'Mismatch', SourceSha256: a.verificationHash,
        Detail: ok ? `${a.id}: repeat hash check before release matches the source-reported hash (pass 2). ${coc}.` : `${a.id}: repeat hash check before release still differs from the source-reported hash (pass 2); the staged copy was not replaced. ${coc}.` }));
    }
  });
  rows.push(row(`${prefix}-CUS-${String(++n).padStart(3, '0')}`, s.stagingReleasedAt || s.request.receivedAt, { Host: stagingHost, DeviceId: stagingHost, EventType: 'CustodyRelease', Account: custodian, Result: 'Released',
    CustodyFrom: custodian, CustodyTo: 'soc-analyst', Detail: `${s.artifacts.length} staged artifacts released from ${custodian} to the SOC analyst for case ${s.caseId}; the analyst's own intake, verification, transfers and legal hold are recorded in the evidence locker.` }));
  return rows;
}
const MODULE_TEN_CONSOLE_DATA = moduleTenBuildConsoleData(SocM10AssessmentData, SocM10AssessmentData.scenario.caseId);
const MODULE_TEN_GUIDED_CASE_ID = 'EVD-6620';
const MODULE_TEN_GUIDED_REPLACEMENTS = {
  'M10-': 'M10G-', 'ART-': 'PRACT-', 'EVD-5510': 'EVD-6620', 'INC-5510': 'INC-6620', 'REQ-5510': 'REQ-6620', 'wkstn-19': 'wkstn-42',
  'DEV-WKSTN-19': 'DEV-WKSTN-42', 'mail-gw-01': 'mail-gw-02', 'proxy-01': 'proxy-02', 'j.sanders': 'm.chen',
  'wks-desk-07': 'wks-fin-12', 'jdoe': 'a.rivera', '2026-09-27': '2026-10-02', 'Q3 remittance': 'Vendor contract renewal',
  'Q3_Remittance.docm': 'Vendor_Renewal.docm', 'Q3_Payables_Summary': 'Vendor_Statement_Aug', 'Q3 payables summary': 'Vendor statement',
  'backup-srv-02': 'backup-srv-05', 'svc-backup': 'svc-vaultsync', 'm.okoye': 't.lindqvist', 'p.nair': 'd.osei', 'northwind-supply.example': 'cobaltparts.example',
  'backup.cloudvault.example': 'vault.stor-sync.example', 'erp.finance.example': 'erp.ops.example', 'edr-mgmt-01': 'edr-mgmt-02', 'news.example': 'press.example',
  'KB-2026-09': 'KB-2026-10', 'PO 4471': 'PO 3308', 'svc-memcapture': 'svc-memtool', 'svc-evidence-export': 'svc-export-agent', 'ir-collection-team': 'ir-staging-team', 'evidence-staging': 'evidence-stage-2', 'svchelp.exe': 'syncagent.exe', 'svchelp': 'syncagent', 'q3.zip': 'vendor_records.zip',
};
function moduleTenGuidedClone(value) {
  if (typeof value === 'string') return Object.entries(MODULE_TEN_GUIDED_REPLACEMENTS).reduce((text, [from, to]) => text.split(from).join(to), value);
  if (Array.isArray(value)) return value.map(moduleTenGuidedClone);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, moduleTenGuidedClone(item)]));
  return value;
}
const MODULE_TEN_GUIDED_FIXTURE = (() => {
  const fixture = moduleTenGuidedClone(SocM10AssessmentData);
  fixture.scenario.stateKey = 'm10-guided-evidence-actions-v1';
  // Independence: the practice case must not share principals with the assessment (which uses `system`), so its
  // OS-initiated background rows run under the LOCAL SERVICE built-in instead. Account-only change; no ids or hashes.
  [...fixture.scenario.artifacts, ...fixture.scenario.sourceEvents].forEach((item) => {
    if (item.account === 'system') Object.assign(item, { account: 'local-service', accountNative: 'NT AUTHORITY\\LOCAL SERVICE' });
  });
  fixture.scenario.artifacts.forEach((artifact, index) => {
    artifact.sourceHash = String(index + 1).padStart(2, '0').repeat(32);
    artifact.verificationHash = index === 2 ? 'ee'.repeat(32) : artifact.sourceHash;
    if (artifact.reacquiredVerificationHash) artifact.reacquiredVerificationHash = artifact.sourceHash;
  });
  fixture.expectedTruth.requiredArtifactIds = ['PRACT-01', 'PRACT-02', 'PRACT-03', 'PRACT-04', 'PRACT-05', 'PRACT-07'];
  fixture.expectedTruth.mismatchArtifactId = 'PRACT-03';
  fixture.expectedTruth.specialistArtifactId = 'PRACT-09';
  fixture.expectedTruth.originalsForHold = ['PRACT-01', 'PRACT-02', 'PRACT-04', 'PRACT-07'];
  fixture.expectedTruth.chain = [...fixture.expectedTruth.requiredArtifactIds];
  fixture.expectedTruth.rootCauseArtifactIds = ['PRACT-01', 'PRACT-02', 'PRACT-03'];
  return fixture;
})();
const MODULE_TEN_DEVICES = [
  { id: 'wkstn-19', hostname: 'wkstn-19', platform: 'Windows 11', role: 'User workstation (isolated)', owner: 'j.sanders', zone: 'CORP-USER', status: 'Isolated' },
];
const MODULE_TEN_TOOL_FIXTURES = (() => {
  const s = SocM10AssessmentData.scenario;
  return {
    m04: SocConsoleTools.m04Fixture({ id: s.id, caseId: s.caseId, end: s.end, data: MODULE_TEN_CONSOLE_DATA }),
    m05: SocConsoleTools.m05Fixture({ id: s.id, stateKey: 'm10-endpoint-tools-v1', devices: MODULE_TEN_DEVICES, data: MODULE_TEN_CONSOLE_DATA }),
    m06: SocConsoleTools.m06Fixture({ id: s.id, lead: { id: 'M10-LEAD-001', type: 'evidence_request', device: 'wkstn-19', account: 'j.sanders', taskName: '—', observation: s.request.text }, devices: ['wkstn-19', 'mail-gw-01', 'proxy-01'], data: MODULE_TEN_CONSOLE_DATA, timeStart: s.start, timeEnd: s.end }),
    m07: SocConsoleTools.m07Fixture({ id: s.id, stateKey: 'm10-mail-tools-v1', start: s.start, end: s.end }),
    m08: SocConsoleTools.m08Fixture({ id: s.id, stateKey: 'm10-exposure-tools-v1', start: s.start, end: s.end }),
    m09: SocConsoleTools.m09Fixture({
      id: s.id, stateKey: 'm10-response-tools-v1', start: s.start, end: s.end,
      incident: { id: s.incidentId, title: 'wkstn-19 macro intrusion (contained)', reportedAt: '2026-09-27T09:10:00Z', sourceEntityId: 'wkstn-19', sourceEvidenceId: 'ART-03', summary: 'Macro-enabled attachment led to PowerShell execution and persistence on wkstn-19; the host is isolated.' },
      entities: [
        { id: 'wkstn-19', type: 'endpoint', hostname: 'wkstn-19', ownerAccountId: 'j.sanders', deviceId: 'DEV-WKSTN-19', status: 'isolated' },
        { id: 'j.sanders', type: 'identity', displayName: 'J. Sanders', registeredDeviceId: 'DEV-WKSTN-19', status: 'active' },
        { id: 'DEV-WKSTN-19', type: 'device', hostname: 'wkstn-19', linkedEntityId: 'wkstn-19' },
        { id: 'file-svchelp-19', type: 'file', linkedEntityId: 'wkstn-19', path: 'C:\\Users\\j.sanders\\AppData\\Roaming\\svchelp.exe' },
        { id: 'persist-svchelp-19', type: 'persistence', linkedEntityId: 'wkstn-19', name: 'svchelp' },
      ],
      edges: [
        { id: 'M10-LINK-001', from: s.incidentId, to: 'wkstn-19', relation: 'confirmed_execution', evidenceId: 'ART-03' },
        { id: 'M10-LINK-002', from: s.incidentId, to: 'j.sanders', relation: 'opened_attachment', evidenceId: 'ART-02' },
      ],
      evidence: s.artifacts.map((a) => ({ id: a.id, type: a.type, time: a.time, entityId: a.host === 'wkstn-19' ? 'wkstn-19' : 'j.sanders', summary: a.title })),
    }),
  };
})();
const MODULE_TEN_GUIDED_CONSOLE_DATA = moduleTenBuildConsoleData(MODULE_TEN_GUIDED_FIXTURE, MODULE_TEN_GUIDED_CASE_ID);
const MODULE_TEN_GUIDED_DEVICE_OPTIONS = [{ id: 'wkstn-42', text: 'wkstn-42 · isolated endpoint' }, { id: 'wks-fin-12', text: 'wks-fin-12 · unaffected comparison' }];
const MODULE_TEN_GUIDED_DEVICES = [{ id: 'wkstn-42', hostname: 'wkstn-42', platform: 'Windows 11', role: 'User workstation (isolated)', owner: 'm.chen', zone: 'CORP-FINANCE', status: 'Isolated' }];
const MODULE_TEN_GUIDED_TOOL_FIXTURES = (() => {
  const s = MODULE_TEN_GUIDED_FIXTURE.scenario;
  return {
    m04: SocConsoleTools.m04Fixture({ id: s.id, caseId: s.caseId, end: s.end, data: MODULE_TEN_GUIDED_CONSOLE_DATA }),
    m05: SocConsoleTools.m05Fixture({ id: s.id, stateKey: 'm10-guided-endpoint-tools-v1', devices: MODULE_TEN_GUIDED_DEVICES, data: MODULE_TEN_GUIDED_CONSOLE_DATA }),
    m06: SocConsoleTools.m06Fixture({ id: s.id, lead: { id: 'M10G-LEAD-001', type: 'evidence_request', device: 'wkstn-42', account: 'm.chen', taskName: '—', observation: s.request.text }, devices: ['wkstn-42', 'mail-gw-02', 'proxy-02'], data: MODULE_TEN_GUIDED_CONSOLE_DATA, timeStart: s.start, timeEnd: s.end }),
    m07: SocConsoleTools.m07Fixture({ id: s.id, stateKey: 'm10-guided-mail-tools-v1', start: s.start, end: s.end }),
    m08: SocConsoleTools.m08Fixture({ id: s.id, stateKey: 'm10-guided-exposure-tools-v1', start: s.start, end: s.end }),
    m09: SocConsoleTools.m09Fixture({
      id: s.id, stateKey: 'm10-guided-response-tools-v1', start: s.start, end: s.end,
      incident: { id: s.incidentId, title: 'wkstn-42 document intrusion (contained)', reportedAt: s.containedAt, sourceEntityId: 'wkstn-42', sourceEvidenceId: 'PRACT-03', summary: 'A document attachment led to script execution and persistence on wkstn-42; the host is isolated.' },
      entities: [
        { id: 'wkstn-42', type: 'endpoint', hostname: 'wkstn-42', ownerAccountId: 'm.chen', deviceId: 'DEV-WKSTN-42', status: 'isolated' },
        { id: 'm.chen', type: 'identity', displayName: 'M. Chen', registeredDeviceId: 'DEV-WKSTN-42', status: 'active' },
        { id: 'DEV-WKSTN-42', type: 'device', hostname: 'wkstn-42', linkedEntityId: 'wkstn-42' },
        { id: 'file-syncagent-42', type: 'file', linkedEntityId: 'wkstn-42', path: 'C:\\Users\\m.chen\\AppData\\Roaming\\syncagent.exe' },
        { id: 'persist-syncagent-42', type: 'persistence', linkedEntityId: 'wkstn-42', name: 'syncagent' },
      ],
      edges: [{ id: 'M10-LINK-GUIDED-01', from: s.incidentId, to: 'wkstn-42', relation: 'confirmed_execution', evidenceId: 'PRACT-03' }],
      evidence: s.artifacts.map((a) => ({ id: a.id, type: a.type, time: a.time, entityId: a.host === 'wkstn-42' ? 'wkstn-42' : 'm.chen', summary: a.title })),
    }),
  };
})();

function moduleTenM04Tools() {
  moduleTenAssessmentState.tools ||= {};
  if (!moduleTenAssessmentState.tools.m04?.schemaVersion) moduleTenAssessmentState.tools.m04 = SocM04AssessmentState.normalize({ assessment: moduleTenAssessmentState.tools.m04 }, MODULE_TEN_TOOL_FIXTURES.m04).assessment;
  return moduleTenAssessmentState.tools.m04;
}

// The carried ATT&CK workspace's mappings are graded against this case.
function moduleTenAttackMappings() {
  return SocM06AssessmentState.normalize(JSON.parse(JSON.stringify(moduleTenAssessmentState.tools?.m06 || {})), MODULE_TEN_TOOL_FIXTURES.m06).mappings;
}

const MODULE_TEN_CONSOLE = (() => {
  const save = () => moduleTenSaveAssessment();
  const base = { save, rerender: () => moduleTenRenderAssessment(), console: () => m03eState('m10') };
  const fx = MODULE_TEN_TOOL_FIXTURES;
  const root = () => moduleTenAssessmentState;
  return SocConsoleTools.mount('m10', {
    data: MODULE_TEN_CONSOLE_DATA,
    stateRoot: root,
    save,
    title: 'SIEM & EVIDENCE HANDLING',
    ariaLabel: 'Module 10 evidence handling assessment console',
    sourceMappings: {
      EmailEvents: { native: 'Mail gateway export (JSON)', fields: [['received', 'TimeGenerated'], ['recipient', 'Account'], ['gateway', 'Host'], ['summary', 'Detail']] },
      DeviceFileEvents: { native: 'Disk image file listing (JSON)', fields: [['time', 'TimeGenerated'], ['host', 'Host'], ['user', 'Account'], ['sha256', 'SourceSha256']] },
      DeviceProcessEvents: { native: 'Endpoint sensor process log (JSON)', fields: [['time', 'TimeGenerated'], ['host', 'Host'], ['user', 'Account'], ['summary', 'Detail']] },
      DeviceRegistryEvents: { native: 'Registry hive extract (JSON)', fields: [['time', 'TimeGenerated'], ['host', 'Host'], ['summary', 'Detail']] },
      ProxyEvents: { native: 'Web proxy log (text)', fields: [['time', 'TimeGenerated'], ['client', 'Host'], ['summary', 'Detail']] },
      ForensicAcquisitions: { native: 'Forensic acquisition record (JSON)', fields: [['time', 'TimeGenerated'], ['host', 'Host'], ['sha256', 'SourceSha256']] },
      EvidenceCustodyLog: { native: 'Evidence custody ledger (JSON)', fields: [['recorded', 'TimeGenerated'], ['custodian', 'Account'], ['system', 'Host'], ['record', 'EventType'], ['outcome', 'Result'], ['sha256', 'SourceSha256'], ['note', 'Detail']] },
    },
    packs: [
      { id: 'm04', ctx: { ...base, assessment: moduleTenM04Tools, fixture: fx.m04 } },
      { id: 'm05', ctx: { ...base, fixture: fx.m05, ...SocConsoleTools.embedded(root, 'm05', SocM05AssessmentState.normalize, fx.m05, save) } },
      { id: 'm06', ctx: { ...base, fixture: fx.m06, ...SocConsoleTools.embedded(root, 'm06', SocM06AssessmentState.normalize, fx.m06, save) } },
      { id: 'm07', ctx: { ...base, fixture: fx.m07, ui: {}, ...SocConsoleTools.embeddedBox(root, 'm07', SocM07AssessmentState.normalize, fx.m07, save) } },
      { id: 'm08', ctx: { ...base, fixture: fx.m08, ui: {}, ...SocConsoleTools.embeddedBox(root, 'm08', SocM08AssessmentState.normalize, fx.m08, save) } },
      { id: 'm09', ctx: {
        ...base, fixture: fx.m09, evidence: SocM10AssessmentData.scenario.artifacts.map((a) => ({ id: a.id, time: a.time, title: a.title, summary: a.detail })),
        routes: MODULE_TEN_CASE.departmentOptions, ...SocConsoleTools.embedded(root, 'm09', SocM09AssessmentState.normalize, fx.m09, save),
      } },
      { id: 'm10', ctx: { ...base, fixture: SocM10AssessmentData, load: () => SocM10AssessmentState.load(moduleTenUser, SocM10AssessmentData), store: (next) => SocM10AssessmentState.save(moduleTenUser, next, SocM10AssessmentData) } },
    ],
    caseView: () => moduleTenCaseTicket(),
    caseBadge: () => (moduleTenAssessmentState.submitted ? ' <i class="ri-checkbox-circle-fill" aria-hidden="true"></i>' : ''),
  });
})();

function moduleTenGuidedM04Tools() {
  moduleTenGuidedState.tools ||= {};
  if (!moduleTenGuidedState.tools.m04?.schemaVersion) moduleTenGuidedState.tools.m04 = SocM04AssessmentState.normalize({ assessment: moduleTenGuidedState.tools.m04 }, MODULE_TEN_GUIDED_TOOL_FIXTURES.m04).assessment;
  return moduleTenGuidedState.tools.m04;
}
const MODULE_TEN_GUIDED_CONSOLE = (() => {
  const save = () => moduleTenSaveGuided();
  const base = { save, rerender: () => moduleTenRenderGuided(), console: () => m03eState('m10-guided') };
  const fx = MODULE_TEN_GUIDED_TOOL_FIXTURES;
  const root = () => moduleTenGuidedState;
  return SocConsoleTools.mount('m10-guided', {
    data: MODULE_TEN_GUIDED_CONSOLE_DATA, stateRoot: root, save, idPrefix: 'guided-m10',
    title: 'SIEM & EVIDENCE HANDLING · PRACTICE', ariaLabel: 'Module 10 guided evidence handling console',
    sourceMappings: {
      EmailEvents: { native: 'Mail gateway export (JSON)', fields: [['received', 'TimeGenerated'], ['recipient', 'Account'], ['summary', 'Detail']] },
      DeviceFileEvents: { native: 'Disk image file listing (JSON)', fields: [['time', 'TimeGenerated'], ['host', 'Host'], ['user', 'Account'], ['sha256', 'SourceSha256']] },
      DeviceProcessEvents: { native: 'Endpoint sensor process log (JSON)', fields: [['time', 'TimeGenerated'], ['host', 'Host'], ['user', 'Account'], ['summary', 'Detail']] },
      DeviceRegistryEvents: { native: 'Registry hive extract (JSON)', fields: [['time', 'TimeGenerated'], ['host', 'Host'], ['summary', 'Detail']] },
      ProxyEvents: { native: 'Web proxy log (text)', fields: [['time', 'TimeGenerated'], ['client', 'Host'], ['summary', 'Detail']] },
      ForensicAcquisitions: { native: 'Forensic acquisition record (JSON)', fields: [['time', 'TimeGenerated'], ['host', 'Host'], ['sha256', 'SourceSha256']] },
      EvidenceCustodyLog: { native: 'Evidence custody ledger (JSON)', fields: [['recorded', 'TimeGenerated'], ['custodian', 'Account'], ['system', 'Host'], ['record', 'EventType'], ['outcome', 'Result'], ['sha256', 'SourceSha256'], ['note', 'Detail']] },
    },
    packs: [
      { id: 'm04', ctx: { ...base, assessment: moduleTenGuidedM04Tools, fixture: fx.m04 } },
      { id: 'm05', ctx: { ...base, fixture: fx.m05, ...SocConsoleTools.embedded(root, 'm05', SocM05AssessmentState.normalize, fx.m05, save) } },
      { id: 'm06', ctx: { ...base, fixture: fx.m06, ...SocConsoleTools.embedded(root, 'm06', SocM06AssessmentState.normalize, fx.m06, save) } },
      { id: 'm07', ctx: { ...base, fixture: fx.m07, ui: {}, ...SocConsoleTools.embeddedBox(root, 'm07', SocM07AssessmentState.normalize, fx.m07, save) } },
      { id: 'm08', ctx: { ...base, fixture: fx.m08, ui: {}, ...SocConsoleTools.embeddedBox(root, 'm08', SocM08AssessmentState.normalize, fx.m08, save) } },
      { id: 'm09', ctx: { ...base, fixture: fx.m09, evidence: MODULE_TEN_GUIDED_FIXTURE.scenario.artifacts.map((a) => ({ id: a.id, type: a.type, time: a.time, entityId: a.host === 'wkstn-42' ? 'wkstn-42' : 'm.chen', title: a.title, summary: a.detail })), routes: [{ id: 'guided-digital-forensics', text: 'Digital Forensics + Incident Lead', fit: 100 }], ...SocConsoleTools.embedded(root, 'm09', SocM09AssessmentState.normalize, fx.m09, save) } },
      { id: 'm10', ctx: { ...base, fixture: MODULE_TEN_GUIDED_FIXTURE, load: () => moduleTenGuidedEvidenceState, store: moduleTenSaveGuidedEvidence } },
    ],
    caseView: () => { const html = caseRecordPane(moduleTenGuidedState.caseRecord, {
      caseId: MODULE_TEN_GUIDED_CASE_ID, ticketId: 'IR-6620', ticketType: 'Forensic evidence preservation · Incident Response',
      userOptions: [{ id: 'm.chen', text: 'm.chen · affected user' }, { id: 'a.rivera', text: 'a.rivera · delivered, unopened recipient' }],
      deviceOptions: MODULE_TEN_GUIDED_DEVICE_OPTIONS,
      departmentOptions: [{ id: 'guided-digital-forensics', text: 'Digital Forensics + Incident Lead' }, { id: 'legal-hold', text: 'Legal Hold Repository' }],
      formId: 'm10-guided-case-form', saveAttr: 'data-m10-guided-save-case', submitAttr: 'data-m10-guided-submit-case', panelId: 'm10-guided-case-panel',
      notesPlaceholder: 'Document the acquired evidence and custody, supported chronology, specialist work, and limits such as unproven exfiltration.', practiceSubmitted: true,
    }); return moduleTenGuidedState.caseRecord.submitted ? `${html}<button type="button" class="m01-reset" data-m10-guided-restart>Restart Guided Lab</button>` : html; },
  });
})();

function moduleTenGuidedComplete() {
  return moduleTenGuidedState?.caseRecord?.submitted === true;
}

function moduleTenGuidedRestart() {
  const cr = moduleTenGuidedState.caseRecord;
  moduleTenGuidedState.caseRecord = { ...cr, status: 'New', affectedUser: '', affectedDevice: '', severity: '', disposition: '', escalation: '', escalateTo: '', findings: {}, notes: '', submitted: false, submittedAt: '', actionHistory: [] };
  moduleTenGuidedState.practiceComplete = false; moduleTenGuidedState.guideStep = 0; moduleTenGuidedState.guideDocked = false;
  moduleTenSaveGuided(); moduleTenRenderGuided();
}

function moduleTenGuidedEvidenceReady() {
  const state = moduleTenGuidedEvidenceState || {};
  const locker = Object.values(state.locker || {});
  const held = state.legalHold?.artifactIds || [];
  const cr = moduleTenGuidedState?.caseRecord || {};
  return locker.length >= 4 && locker.every((item) => item.integrity === 'verified') && (state.timeline || []).length >= 3
    && held.length >= 2 && Boolean(cr.status && cr.affectedUser && cr.affectedDevice && cr.severity && cr.disposition && cr.escalateTo && cr.notes?.trim().length >= 40);
}

function moduleTenRenderGuided() {
  const root = document.getElementById('m10-guided-lab-dynamic');
  if (!root) return;
  root.innerHTML = moduleTenGuidedLabPanel();
  MODULE_TEN_GUIDED_CONSOLE.wire(root);
  m03eAttachEditor('m10-guided');
  moduleTenPositionGuidedGuide(root);
}

function moduleTenPositionGuidedGuide(root = document.getElementById('m10-guided-lab-dynamic')) {
  const host = root?.querySelector('#m03e-console-m10-guided');
  const tip = root?.querySelector('#m10-guided-learn-tip');
  const workspace = host?.querySelector('.m03e-workspace');
  if (!host || !tip || !workspace) return;
  tip.classList.add('is-visible');
  if (moduleTenGuidedState.caseRecord.submitted || moduleTenGuidedState.guideDocked === true) {
    host.querySelector('header')?.append(tip);
    consoleGuidePosition(tip, workspace, null);
  } else {
    workspace.prepend(tip);
    consoleGuidePosition(tip, workspace, null);
  }
}
M03E_AFTER_RENDER['m10-guided'] = function () {
  const root = document.getElementById('m10-guided-lab-dynamic');
  const host = document.getElementById('m03e-console-m10-guided');
  if (!root || !host) return;
  if (!root.querySelector('#m10-guided-learn-tip')) {
    const evidence = moduleTenGuidedEvidenceState || {};
    const complete = moduleTenGuidedState.caseRecord.submitted === true;
    const cr = moduleTenGuidedState.caseRecord;
    const steps = moduleTenGuidedSteps();
    const quality = (value, expected, contributing = []) => !value ? 'missed' : value === expected ? 'captured' : contributing.includes(value) ? 'contributing' : 'missed';
    const locker = Object.values(evidence.locker || {}); const timeline = evidence.timeline || []; const held = evidence.legalHold?.artifactIds || [];
    const note = (cr.notes || '').toLowerCase(); const entities = note.includes('wkstn-42') && note.includes('m.chen'); const custody = /custod|hash|integrity|provenance/.test(note); const chronology = /chronolog|timeline|event|timestamp/.test(note); const bounded = /exfiltration|unknown|unproven|limit|verify|owner/.test(note);
    const artifactQuality = locker.filter((item) => item.integrity === 'verified').length >= 4 && timeline.length >= 3 && held.length >= 2 ? 'captured' : locker.length || timeline.length || held.length ? 'contributing' : 'missed';
    const debrief = complete ? guidedLabDebrief({ story: 'The case supports a bounded chronology from acquired artifacts whose integrity and custody can be verified. Hash integrity supports that an artifact has not changed since hashing; it does not establish provenance or prove exfiltration.', fields: [
      { name: 'Ticket status', status: quality(cr.status, 'in-progress', ['pending']), note: 'Keep evidence work open until specialist verification is complete.' },
      { name: 'Affected user', status: quality(cr.affectedUser, 'm.chen', ['a.rivera']), note: 'Identify the affected user; the unopened recipient is related context.' },
      { name: 'Affected device', status: quality(cr.affectedDevice, 'wkstn-42', ['wks-fin-12']), note: 'Name the acquired workstation; the comparison device is contributing context.' },
      { name: 'Severity', status: quality(cr.severity, 'high', ['medium']), note: 'Reflect verified impact without overstating scope.' },
      { name: 'Disposition', status: quality(cr.disposition, 'true-positive', ['false-negative']), note: 'Classify the supported incident finding.' },
      { name: 'Evidence custody and chronology', status: artifactQuality, note: 'Use verified artifacts, a corroborated timeline, and documented legal hold.' },
      { name: 'Escalation and department', status: cr.escalation === 'required' && cr.escalateTo === 'guided-digital-forensics' ? 'captured' : cr.escalation === 'required' && cr.escalateTo === 'legal-hold' ? 'contributing' : 'missed', note: 'Route specialist analysis with legal hold support.' },
      { name: 'Evidence and handoff notes', status: entities && custody && chronology && bounded ? 'captured' : entities || custody || chronology || bounded ? 'contributing' : 'missed', note: 'Describe the system, custody, supported chronology, owner, and limits.' },
    ], handoff: 'A strong handoff preserves artifact identifiers and custody, distinguishes integrity from provenance, states only supported events, assigns specialist follow-up, and names the next verification.' }) : '';
    const guide = guidedLabGuide('m10', steps, { step: moduleTenGuidedState.guideStep, docked: complete ? moduleTenGuidedState.guideDocked !== false : moduleTenGuidedState.guideDocked, prefix: 'm10-guided', submitted: complete, debriefHtml: debrief });
    const tpl = document.createElement('template');
    tpl.innerHTML = guide;
    const fresh = tpl.content.querySelector('#m10-guided-learn-tip');
    if (fresh) root.prepend(fresh);
  }
  moduleTenPositionGuidedGuide(root);
};

function moduleTenCaseTicket() {
  const spec = moduleTenCaseSpec();
  return `${caseRecordPane(moduleTenAssessmentState, {
    ...spec,
    missing: caseRecordMissing(moduleTenAssessmentState, spec),
    formId: 'm10-assessment-form',
    saveAttr: 'data-m10-save-case',
    submitAttr: 'data-m10-submit-case',
    panelId: 'm10-case-panel',
    reviewStatus: moduleTenCaseReviewStatus(),
    redoRequested: moduleTenCaseRedoRequested(),
    redoHtml: moduleTenCaseRedoFeedback(),
    showMissing: moduleTenAssessmentState.showMissing === true,
    lockedMessage: 'Module 10 completion stays pending until your instructor approves the submission.',
  })}`;
}

function moduleTenAssessmentLabPanel() {
  return `<div class="m03e-panel" id="m10-prove-panel">
    <div class="m03e-brief"><p class="m03e-label">CASE ${esc(SocM10AssessmentData.scenario.caseId)} · POST-CONTAINMENT EVIDENCE REQUEST · ASSIGNED TO YOU</p><p>Build a defensible package for wkstn-19: preserve originals under legal hold and record source, acquisition, hashes, and custody. Reconstruct the timeline, separate fact from analysis, support root cause, map evidenced behavior to ATT&amp;CK, record unknowns, and complete the ticket.</p></div>
    <div class="m03e-console-host" id="m03e-console-m10">${moduleThreeConsoleHtml('m10')}</div>
  </div>`;
}

function moduleTenRenderAssessment() {
  const root = document.getElementById('m10-assessment-lab-dynamic');
  if (!root) return;
  root.innerHTML = moduleTenAssessmentLabPanel();
  m03eAttachEditor('m10');
}

const MODULE_TEN_OPTIONAL_LABS = [
  { title: 'Recovering and Analyzing Deleted Files on Windows Systems', detail: 'Deleted-file recovery practice', href: 'imported-labs/mission-next-labs/index.html#/track/windows-forensics/project/wf-5/lab', labId: 'assessment-1' },
  { title: 'Investigating Windows Event Logs for Security Incidents', detail: 'Windows event evidence and account activity', href: 'imported-labs/mission-next-labs/index.html#/track/windows-forensics/project/wf-1/lab', labId: 'assessment-2' },
  { title: 'Extracting and Interpreting Browser Artifacts on Windows', detail: 'Browser history and user-activity evidence', href: 'imported-labs/mission-next-labs/index.html#/track/windows-forensics/project/wf-4/lab', labId: 'additional-1' },
  { title: 'File System Security Assessment', detail: 'Permissions and file-integrity evidence', href: 'imported-labs/mission-next-labs/index.html#/track/security-assessments/project/sa-2/lab', labId: 'additional-2' },
];

function moduleTenAdditionalLabs() {
  return `<div id="m10-additional-labs">${missionNextOptionalLabsSection(10, MODULE_TEN_OPTIONAL_LABS, moduleTenAssessmentState.labProgress)}</div>`;
}

function moduleTenGetSections() {
  // Server-verified modules (finished on another device, before the 09-27
  // lab rebuild, or by admin override) read complete instead of empty.
  const verified = moduleTenUser?.remoteVerifiedModuleProgress?.['soc-10'] === true;
  return [
    { id: 'lecture', title: 'Learn It', type: 'lecture', isComplete: true, scrollId: 'm10-lecture' },
    { id: 'guided-lab', title: 'Guided Lab', type: 'lab', isComplete: verified || moduleTenGuidedComplete(), scrollId: 'm10-guided-lab' },
    { id: 'assessment-lab', title: 'Assessment Lab', type: 'review', isComplete: verified || moduleTenAssessmentState.completed, scrollId: 'm10-assessment-lab' },
    { id: 'review', title: 'Module Review', type: 'review', isComplete: true, scrollId: 'm10-review' },
    { id: 'sources', title: 'Sources & Further Reading', type: 'read', isComplete: null, scrollId: 'm10-sources', gated: false, supplemental: true },
  ];
}

function moduleTenGetQuickNavItems() {
  const sections = moduleTenGetSections();
  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    kind: section.type,
    isComplete: section.isComplete,
    scrollId: section.scrollId,
  }));
}

function moduleTenQuizQuestion(selected, index) {
  const question = selected.question;
  const userAnswerId = moduleTenQuizState?.answers?.[question.id];
  const answered = userAnswerId !== undefined;
  return `<fieldset class="m10-quiz-question" data-question-id="${esc(question.id)}">
    <legend><span>${index + 1}</span> ${esc(selected.conceptTitle)}: ${esc(question.prompt)}</legend>
    <div class="m10-quiz-options">
      ${selected.shuffledOptions.map((option) => `<label>
        <input type="radio" name="q-${esc(question.id)}" value="${esc(option.id)}" ${userAnswerId === option.id ? 'checked' : ''} data-m10-quiz-answer />
        <span>${esc(option.text)}</span>
      </label>`).join('')}
    </div>
  </fieldset>`;
}

// A knowledge check can read complete on the account (server-verified module,
// synced quiz detail, or knowledge-check evidence) while this browser holds no
// answers — another device did the work, or an admin override set it. Show a
// verified summary instead of a blank 0/N form; never fabricate answers.
function moduleTenQuizVerifiedElsewhere() {
  if (moduleTenQuizForceRetake || !moduleTenQuizState || moduleTenQuizState.scored) return false;
  if (Object.keys(moduleTenQuizState.answers || {}).length > 0) return false;
  return moduleTenUser?.remoteVerifiedModuleProgress?.['soc-10'] === true
    || moduleTenUser?.remoteModuleDetail?.['soc-10']?.quizPassed === true
    || moduleTenUser?.remoteModuleEvidence?.['soc-10']?.['knowledge-check'] === true;
}

function moduleTenQuizPanel() {
  if (!moduleTenQuizState?.selectedQuestions || moduleTenQuizState.selectedQuestions.length === 0) {
    return `<div class="m10-quiz-empty" id="m10-quiz-feedback" role="status">Loading quiz…</div>`;
  }
  if (moduleTenQuizVerifiedElsewhere()) {
    return `<form class="m10-quiz-form mf-quiz-form" id="m10-quiz-form" novalidate><section class="mf-score is-pass" id="m10-quiz-feedback" tabindex="-1" aria-live="polite"><p class="mf-kicker">Module knowledge check</p><h3>Already verified complete</h3><p>This knowledge check is recorded as passed on your account. It is never re-answered automatically on a new device or browser, so nothing is shown here that wasn't actually submitted.</p><button type="button" class="mf-score-retake" data-m10-quiz-retake>Retake this knowledge check</button></section></form>`;
  }

  const selected = moduleTenQuizState.selectedQuestions;
  const answered = Object.keys(moduleTenQuizState.answers || {}).length;
  const total = selected.length;

  let feedbackHtml = '';
  if (moduleTenQuizState.scored) {
    const passed = moduleTenQuizState.score >= 70;
    feedbackHtml = `<section class="m10-quiz-score mf-score ${passed ? 'm10-quiz-pass is-pass' : 'm10-quiz-remediate is-remediate'}" id="m10-quiz-feedback" tabindex="-1" aria-live="polite">
      <div class="m10-quiz-score-heading">
        <div>
          <p class="m10-kicker">Attempt ${moduleTenQuizState.attempts} · best ${moduleTenQuizState.bestScore}/100</p>
          <h3>${moduleTenQuizState.score}/100 — ${passed ? 'Knowledge verified' : 'Use feedback and retry'}</h3>
        </div>
        <span>${moduleTenQuizState.score}</span>
      </div>
      <ul class="m10-quiz-feedback-list">
        ${(moduleTenQuizState.feedback || []).map((fb) => `<li class="${fb.correct ? 'm10-quiz-feedback-correct' : 'm10-quiz-feedback-incorrect'}">
          <i class="ri-${fb.correct ? 'checkbox-circle-fill' : 'information-line'}" aria-hidden="true"></i>
          <div>
            <strong>${fb.questionId}</strong>
            <p>${esc(fb.message)}</p>
          </div>
        </li>`).join('')}
      </ul>
      ${!passed ? `<div class="m10-quiz-actions"><button type="button" class="m10-quiz-retry" data-m10-quiz-retry><i class="ri-refresh-line" aria-hidden="true"></i> Try different questions</button></div>` : ''}
    </section>`;
  } else if (answered === total) {
    feedbackHtml = `<div class="m10-quiz-ready" id="m10-quiz-feedback" role="status">All questions answered. Submit to check your responses.</div>`;
  } else {
    feedbackHtml = `<div class="m10-quiz-empty" id="m10-quiz-feedback" role="status">Answer all ${total} questions to submit.</div>`;
  }

  return `<form class="m10-quiz-form mf-quiz-form" id="m10-quiz-form" novalidate>
    <div class="m10-panel-heading mf-panel-heading"><div><p class="m10-kicker mf-kicker">Knowledge check</p><h3 id="m10-quiz-title" tabindex="-1">Test your understanding of evidence handling and timeline reconstruction</h3></div><span>${answered}/${total} answered</span></div>
    ${selected.map((sel, idx) => moduleTenQuizQuestion(sel, idx)).join('')}
    <div class="m10-quiz-actions">
      <button class="m10-quiz-submit" type="submit" ${answered < total ? 'disabled' : ''}>
        <i class="ri-checkbox-circle-line" aria-hidden="true"></i> Check my answers
      </button>
    </div>
    ${feedbackHtml}
  </form>`;
}

const MODULE_TEN_HANDLING_STEPS = [
  { title: 'Select', q: 'Which artifacts are assigned evidence?', detail: 'Collect only what the case assigns; unassigned material stays baseline context.', gate: '' },
  { title: 'Acquire', q: 'How was it copied, and by whom?', detail: 'Record source, method, write protection, and the handler at the moment of copy.', gate: 'provenance' },
  { title: 'Verify hash', q: 'Does the image hash match the source?', detail: 'Hash source and image; a match shows the bytes are unchanged at that moment only.', gate: 'integrity' },
  { title: 'Record custody', q: 'Who held it, when, and why?', detail: 'Log each handoff with both custodians, a UTC timestamp, and seal status.', gate: 'provenance' },
  { title: 'Reconstruct timeline', q: 'What order do verified records show?', detail: 'Order events from controlled artifacts on one labelled time basis.', gate: '' },
  { title: 'State conclusion', q: 'What is supported, and what is not?', detail: 'Claim only what the controlled evidence shows; list gaps and the specialist handoff.', gate: '' }
];

function moduleTenHandlingChain() {
  const gateLabel = { provenance: 'Provenance check', integrity: 'Integrity check' };
  const gateIcon = { provenance: 'ri-user-search-line', integrity: 'ri-hashtag' };
  return `<figure class="m10-handling" id="m10-handling" aria-labelledby="m10-handling-title">
    <p class="m10-kicker">Evidence handling sequence</p>
    <h3 class="m10-handling-title" id="m10-handling-title">From selected artifact to supported conclusion</h3>
    <p class="m10-handling-note">Select a step for detail. Two different questions are checked along the way, and passing one never answers the other.</p>
    <ol class="m10-handling-chain" aria-label="Six-step evidence handling chain">
      ${MODULE_TEN_HANDLING_STEPS.map((step, index) => `<li class="m10-handling-step${step.gate ? ` m10-handling-step-${step.gate}` : ''}">
        <details>
          <summary><span class="m10-handling-num" aria-hidden="true">${index + 1}</span><span class="m10-handling-text"><strong>${esc(step.title)}</strong><span>${esc(step.q)}</span></span><i class="ri-arrow-down-s-line m10-handling-chevron" aria-hidden="true"></i></summary>
          <p>${esc(step.detail)}</p>
        </details>
        ${step.gate ? `<span class="m10-handling-chip m10-handling-chip-${step.gate}"><i class="${gateIcon[step.gate]}" aria-hidden="true"></i>${gateLabel[step.gate]}</span>` : ''}
      </li>`).join('')}
    </ol>
    <div class="m10-handling-gates">
      <div class="m10-handling-gate m10-handling-chip-provenance"><i class="ri-user-search-line" aria-hidden="true"></i><div><strong>Provenance: where did it come from, who handled it?</strong><span>Answered by acquisition notes and the custody ledger (steps 2 and 4).</span></div></div>
      <div class="m10-handling-gate m10-handling-chip-integrity"><i class="ri-hashtag" aria-hidden="true"></i><div><strong>Integrity: does the hash still match?</strong><span>Answered only by comparing hashes (step 3).</span></div></div>
    </div>
    <figcaption class="m10-sr-only">Six steps in order: select, acquire, verify hash, record custody, reconstruct timeline, state a supported conclusion. Provenance is checked at acquire and record custody. Integrity is checked at verify hash. They are separate checks: a matching hash does not prove custody, and a complete ledger does not prove the bytes are unchanged.</figcaption>
  </figure>`;
}

function moduleTenScenarioLoops() {
  return `<div class="m10-loop-grid" aria-label="Module 10 four-part learning loops">
    <article><p class="m10-kicker">Lesson 1 · Scenario</p><h4>Receive a post-containment evidence intake</h4><p>A synthetic Windows endpoint has been isolated. Registry, file-system, and deleted-file artifacts are available for intake.</p></article>
    <article><p class="m10-kicker">Lesson 1 · Theory</p><h4>Integrity, provenance, custody</h4><p>Hash meaning, UTC basis, acquisition controls, and documented handoffs answer different review questions.</p></article>
    <article><p class="m10-kicker">Lesson 1 · Knowledge check</p><h4>Choose what can be preserved</h4><p>Explain which artifacts are assigned evidence and which remain baseline context.</p></article>
    <article><p class="m10-kicker">Lesson 1 · Applied task</p><h4>Complete the Guided Lab</h4><p>Build a preserved evidence set, resolve its integrity checks, and hand off a bounded reconstruction.</p></article>
    <article><p class="m10-kicker">Lesson 2 · Scenario</p><h4>Reconstruct the impact sequence</h4><p>Compare endpoint, service-control, isolation, and baseline records from the same synthetic incident.</p></article>
    <article><p class="m10-kicker">Lesson 2 · Theory</p><h4>Map behavior only when demonstrated</h4><p>ATT&amp;CK organizes observed behavior; it does not supply missing access, operator, or lateral-movement facts.</p></article>
    <article><p class="m10-kicker">Lesson 2 · Knowledge check</p><h4>Separate fact from inference</h4><p>Use source review to test whether a relationship or technique is supported, not merely plausible.</p></article>
    <article><p class="m10-kicker">Lesson 2 · Applied task</p><h4>Complete the Assessment Lab</h4><p>Work the imported deleted-file recovery project, then write up your findings and recommended action for instructor review.</p></article>
  </div>`;
}

function moduleTenVideoScript() {
  return '';
}

function moduleTenReview() {
  return `<section class="m10-review-section">
    <h3>Module concepts at a glance</h3>
    <ul>
      <li><strong>Chain-of-custody documentation:</strong> Preserved evidence requires validated acquisition controls, UTC timestamps, matching cryptographic hashes on source and image, and a complete transfer ledger with release/receipt signatures and seal condition from each custodian.</li>
      <li><strong>Hash integrity vs. provenance:</strong> Matching source and image hashes prove byte-identical sameness at acquisition. They do not establish later custody events or repair missing transfer records. Integrity and provenance are related but distinct concerns.</li>
      <li><strong>Correlation and causation:</strong> Events sharing entity and timing are correlated. Causation requires direct behavioral connection: does the source event's activity lead to the target event? Connect only evidenced relationships; separate approved baseline activity.</li>
      <li><strong>ATT&CK as a framework:</strong> Map only demonstrated techniques from your timeline. ATT&CK organizes observed behavior; it does not complete incident documentation or fill evidentiary gaps. It remains subordinate to evidence, not authoritative.</li>
      <li><strong>Bounded conclusions:</strong> State confirmed scope, observations, and unknowns explicitly. High confidence in proven facts within your dataset; high-bounded confidence for inferences; clear notes on unobserved or unmeasured segments.</li>
      <li><strong>Evidence intake authority:</strong> Accept logged originals with complete custody. Quarantine uncontrolled copies pending provenance review. Do not merge evidence without documented handoffs or destroy material beyond your authority.</li>
    </ul>
    <h3>Before you continue</h3>
    <p>Acquire evidence with validated controls, document custody, and distinguish hash integrity from provenance. Build a supported timeline, map only observed behavior to ATT&CK, and state confirmed facts, bounded conclusions, and unknowns in later investigations.</p>
  </section>`;
}

function viewModuleTen(user, program) {
  moduleTenLoad(user);
  const complete = moduleTenAssessmentState.completed === true;
  const module = program.modules['soc-10'];
  const sections = moduleTenGetSections();
  const lectureOpen = moduleTenReviewMode || !sections[0].isComplete || moduleTenGuidedState.learnItStep < LearnItDecks['soc-10'].length;
  const guidedLabOpen = moduleTenReviewMode || !sections[1].isComplete;
  const assessmentLabOpen = moduleTenReviewMode || !sections[2].isComplete;
  const reviewOpen = moduleTenReviewMode;
  const quickNavItems = moduleTenGetQuickNavItems();

  return `<div class="m10-shell">
    ${moduleTopbar(user, program)}
    <div class="mquick-nav-layout">
      ${moduleProgressShell(sections, { reviewMode: moduleTenReviewMode })}
      <main class="m10-main mf-frame">
      <section class="m10-hero mf-hero" aria-labelledby="m10-title"><div><p class="m10-kicker mf-kicker">Module 10 · ${formatHandsOnDuration(module.durationMinutes)} · independent</p><h1 id="m10-title">${esc(module.title)}</h1><p class="mf-lede">Preserve incident evidence, document custody, and reconstruct a separate case from chronology and demonstrated behavior. ATT&CK remains subordinate to the evidence as a behavior framework; it does not replace the ITSM ticket.</p></div><dl class="mf-stats" aria-label="Module lab progress"><div><dt>Guided Lab</dt><dd>${moduleTenGuidedComplete() ? 'Complete' : 'Not started'}</dd></div><div><dt>Assessment Lab</dt><dd id="m10-status">${complete ? 'Complete' : moduleTenAssessmentState.attempts ? 'In progress' : 'Not started'}</dd></div></dl></section>

      <details class="m10-section-collapsible mf-section" ${lectureOpen ? 'open' : ''}>
        <summary class="m10-section"><div class="m10-section-heading mf-section-heading"><span class="m10-section-badge mf-section-badge">1</span><div><p class="m10-kicker mf-kicker">Learn It</p><h2 id="m10-lecture">Evidence acquisition, custody, timeline reconstruction, and bounded conclusions</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m10-section-body mf-section-body">
          ${moduleTenLearnItHtml()}
          <details class="m10-deep-dive mf-deep-dive"><summary>Deep Dive · evidence guide and reference notes</summary>
          <section class="m10-boundary"><i class="ri-lock-2-line" aria-hidden="true"></i><p><strong>Bounded practice:</strong> this is incident evidence handling and case documentation, not a full digital-forensics program. Acquisition and specialist examination remain with authorized specialists; each exercise contains only its assigned synthetic case dataset.</p></section>
          ${moduleTenScenarioLoops()}
          ${moduleTenHandlingChain()}
          ${moduleTenVideoScript()}
          </details>
        </div>
      </details>

      <details class="m10-section-collapsible mf-section mf-lab-section" ${guidedLabOpen ? 'open' : ''}>
        <summary class="m10-section"><div class="m10-section-heading mf-section-heading"><span class="m10-section-badge mf-section-badge">2</span><div><p class="m10-kicker mf-kicker">Practice It · Guided Lab</p><h2 id="m10-guided-lab">Forensic evidence handling practice</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m10-section-body mf-section-body">
          <div class="m10-boundary"><i class="ri-shield-check-line" aria-hidden="true"></i><p><strong>Practice case:</strong> Guided evidence actions and the forensic ticket save independently from the assessment.</p></div>
          <div id="m10-guided-lab-dynamic">${moduleTenGuidedLabPanel()}</div>
        </div>
      </details>

      <details class="m10-section-collapsible mf-section" ${assessmentLabOpen ? 'open' : ''}>
        <summary class="m10-section"><div class="m10-section-heading mf-section-heading"><span class="m10-section-badge mf-section-badge">3</span><div><p class="m10-kicker mf-kicker">Prove It · Assessment Lab</p><h2 id="m10-assessment-lab">Independent Windows forensics review</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m10-section-body mf-section-body">
          <div id="m10-assessment-lab-dynamic">${moduleTenAssessmentLabPanel()}</div>
        </div>
      </details>
      ${moduleTenAdditionalLabs()}

      <details class="m10-section-collapsible mf-section" ${reviewOpen ? 'open' : ''}>
        <summary class="m10-section"><div class="m10-section-heading mf-section-heading"><span class="m10-section-badge mf-section-badge">5</span><div><p class="m10-kicker mf-kicker">Review</p><h2 id="m10-review">Module Review</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m10-section-body mf-section-body">
          ${moduleTenReview()}
        </div>
      </details>

      <details class="m10-section-collapsible mf-section mf-section-supplemental" ${reviewOpen ? 'open' : ''}>
        <summary class="m10-section"><div class="m10-section-heading mf-section-heading"><span class="m10-section-badge mf-section-badge"><i class="ri-book-open-line" aria-hidden="true"></i></span><div><p class="m10-kicker mf-kicker">Sources</p><h2 id="m10-sources">Further Reading & Citation</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m10-section-body mf-section-body">
          ${moduleSourcesBlock(MODULE_TEN_SOURCES_LIST)}
        </div>
      </details>
    </main>
    </div>
  </div>`;
}

function moduleTenRenderQuiz() {
  const root = document.getElementById('m10-quiz-form');
  if (!root) return;
  root.innerHTML = moduleTenQuizPanel();
}

function moduleTenScoreQuiz() {
  if (!moduleTenQuizState?.selectedQuestions) return;
  const answers = moduleTenQuizState.answers || {};
  const result = scoreQuizAttempt(moduleTenQuizState.selectedQuestions, moduleTenQuizState.questionsByAnswer, answers);
  moduleTenQuizState.attempts = (moduleTenQuizState.attempts || 0) + 1;
  moduleTenQuizState.score = result.score;
  moduleTenQuizState.bestScore = Math.max(moduleTenQuizState.bestScore || 0, result.score);
  moduleTenQuizState.feedback = result.feedback;
  moduleTenQuizState.scored = true;
  moduleTenQuizState.passed = result.score >= MODULE_TEN_PASSING_SCORE;
  moduleTenGuidedState.lastQuizQuestionIds = moduleTenQuizState.selectedQuestions.map((q) => q.question.id);
  moduleTenSaveGuided();
}

function wireModuleTen() {
  moduleTenWireLearnIt();
  // Review mode toggle wiring
  const reviewToggle = document.querySelector('[data-mnav-review-toggle]');
  if (reviewToggle) {
    reviewToggle.addEventListener('click', () => {
      moduleTenReviewMode = !moduleTenReviewMode;
      const sections = moduleTenGetSections();
      const lectureOpen = moduleTenReviewMode || !sections[0].isComplete || moduleTenGuidedState.learnItStep < LearnItDecks['soc-10'].length;
      const guidedLabOpen = moduleTenReviewMode || !sections[1].isComplete;
      const assessmentLabOpen = moduleTenReviewMode || !sections[2].isComplete;
      const reviewOpen = moduleTenReviewMode;
      document.querySelectorAll('.m10-section-collapsible').forEach((details, idx) => {
        const shouldOpen = idx === 0 ? lectureOpen : idx === 1 ? guidedLabOpen : idx === 2 ? assessmentLabOpen : reviewOpen;
        details.open = shouldOpen;
      });
      reviewToggle.setAttribute('aria-pressed', moduleTenReviewMode ? 'true' : 'false');
      reviewToggle.querySelector('i').className = moduleTenReviewMode ? 'ri-eye-off-line' : 'ri-eye-line';
    });
  }

  wireModuleTenQuiz();
  wireModuleTenGuidedLab();
  wireModuleTenAssessmentLab();
}

function wireModuleTenQuiz() {
  const form = document.getElementById('m10-quiz-form');
  if (!form) return;

  form.addEventListener('change', (event) => {
    if (event.target.dataset.m10QuizAnswer) {
      const questionId = event.target.name.replace('q-', '');
      moduleTenQuizState.answers[questionId] = event.target.value;
      moduleTenRenderQuiz();
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    moduleTenScoreQuiz();
    moduleTenRenderQuiz();
  });

  form.addEventListener('click', (event) => {
    if (event.target.closest('[data-m10-quiz-retake]')) {
      event.preventDefault();
      moduleTenQuizForceRetake = true;
      form.innerHTML = moduleTenQuizPanel();
      return;
    }
    if (!event.target.closest('[data-m10-quiz-retry]')) return;
    moduleTenQuizState = {
      selectedQuestions: moduleTenQuizState.selectedQuestions.map((sq) => ({ ...sq })),
      questionsByAnswer: { ...moduleTenQuizState.questionsByAnswer },
      answers: {},
      scored: false,
      attempts: moduleTenQuizState.attempts,
      score: 0,
      bestScore: moduleTenQuizState.bestScore,
      feedback: [],
      passed: false,
    };
    moduleTenRenderQuiz();
  });
}

function moduleTenRewireGuidedLabGating() {
  const root = document.getElementById('m10-guided-lab-dynamic');
  if (!root || !moduleTenGuidedState) return;
  wireMissionNextLabGating(root, moduleTenGuidedState.labProgress, () => {
    moduleTenSaveGuided();
    root.innerHTML = moduleTenGuidedLabPanel();
    moduleTenRewireGuidedLabGating();
  });
}

function moduleTenRewireAssessmentLabGating() {
  m03eAttachEditor('m10');
}

function wireModuleTenGuidedLab() {
  const root = document.getElementById('m10-guided-lab-dynamic');
  if (!root || !moduleTenGuidedState) return;
  MODULE_TEN_GUIDED_CONSOLE.wire(root);
  moduleTenPositionGuidedGuide(root);
  root.addEventListener('change', (event) => {
    const field = event.target.closest('#m10-guided-case-form [name]');
    if (!field) return;
    if (field.name.startsWith('finding:')) moduleTenGuidedState.caseRecord.findings[field.name.slice(8)] = field.value;
    else moduleTenGuidedState.caseRecord[field.name] = field.value;
    moduleTenGuidedState.practiceComplete = moduleTenGuidedComplete();
    moduleTenSaveGuided();
  });
  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-m10-guided-restart]')) { event.preventDefault(); moduleTenGuidedRestart(); return; }
    if (event.target.closest('[data-m10-guided-submit-case]')) { event.preventDefault(); moduleTenGuidedState.caseRecord.submitted = true; moduleTenGuidedState.caseRecord.submittedAt = new Date().toISOString(); moduleTenGuidedState.practiceComplete = true; moduleTenGuidedState.guideStep = 3; moduleTenGuidedState.guideDocked = true; moduleTenSaveGuided(); moduleTenRenderGuided(); return; }
    if (event.target.closest('[data-m10-guided-guide-next]')) { moduleTenGuidedState.guideStep = ((moduleTenGuidedState.guideStep || 0) + 1) % moduleTenGuidedSteps().length; moduleTenSaveGuided(); const tab = moduleTenGuidedSteps()[moduleTenGuidedState.guideStep].tab; document.querySelector(`[data-m03e-tab="m10-guided:${tab}"]`)?.click(); moduleTenRenderGuided(); return; }
    if (event.target.closest('[data-m10-guided-guide-collapse]')) { moduleTenGuidedState.guideDocked = !moduleTenGuidedState.guideDocked; moduleTenSaveGuided(); moduleTenRenderGuided(); return; }
    if (event.target.closest('[data-m10-guided-save-case]')) {
      event.preventDefault();
      moduleTenGuidedState.caseRecord.actionHistory.push({ action: 'Ticket updated', at: new Date().toISOString() });
      moduleTenGuidedState.practiceComplete = moduleTenGuidedComplete();
      moduleTenSaveGuided();
      moduleTenRenderGuided();
    }
  });
}

function moduleTenFinalizeCase(root) {
  if (moduleTenAssessmentState.submitted) return;
  const scored = SocM10AssessmentScorer.score(SocM10AssessmentState.load(moduleTenUser, SocM10AssessmentData), SocM10AssessmentData, { mappings: moduleTenAttackMappings() });
  const performance = { missing: caseRecordMissing(moduleTenAssessmentState, moduleTenCaseSpec()), score: scored.score, breakdown: scored.criteria, feedback: scored.review.feedback, criticalErrors: scored.criticalMisses };
  if (performance.missing.length) {
    moduleTenAssessmentState.showMissing = true;
    moduleTenSaveAssessment();
    moduleTenRenderAssessment();
    return;
  }
  moduleTenAssessmentState.showMissing = false;
  moduleTenAssessmentState.submitted = true;
  moduleTenAssessmentState.completed = true;
  moduleTenAssessmentState.attempts = (moduleTenAssessmentState.attempts || 0) + 1;
  moduleTenAssessmentState.lastSubmittedAt = new Date().toISOString();
  moduleTenAssessmentState.score = performance.score;
  moduleTenAssessmentState.breakdown = performance.breakdown;
  moduleTenAssessmentState.caseId = SocM10AssessmentData.scenario.caseId;
  moduleTenAssessmentState.scenarioId = SocM10AssessmentData.scenario.id;
  moduleTenAssessmentState.reviewPayload = { ...JSON.parse(JSON.stringify(scored)), caseId: SocM10AssessmentData.scenario.caseId, scenarioId: SocM10AssessmentData.scenario.id };
  moduleTenAssessmentState.actionHistory.push({ action: 'Submitted case for faculty review', at: moduleTenAssessmentState.lastSubmittedAt });
  if (!moduleTenAssessmentState.flags.includes('M10-ASSESSMENT-LAB-COMPLETE')) moduleTenAssessmentState.flags.push('M10-ASSESSMENT-LAB-COMPLETE');
  moduleTenSaveAssessment();
  if (moduleTenUser) {
    moduleTenUser.latestLabAttemptByKey = { ...(moduleTenUser.latestLabAttemptByKey || {}), [MODULE_TEN_ASSESSMENT_KEY]: { completedAt: moduleTenAssessmentState.lastSubmittedAt, reviewedAt: null, redoRequested: false } };
  }
  const spec = moduleTenCaseSpec();
  if (typeof recordLabAttempt === 'function') {
    recordLabAttempt(moduleTenUser, MODULE_TEN_ASSESSMENT_KEY, {
      state: 'complete',
      score: performance.score,
      result: {
        rubric_version: scored.rubricVersion,
        breakdown: performance.breakdown,
        feedback: performance.feedback,
        review_payload: moduleTenAssessmentState.reviewPayload,
        critical_errors: performance.criticalErrors,
        case_record: moduleTenAssessmentState,
        case_display: caseRecordDisplay(moduleTenAssessmentState, spec),
        case_summary: caseRecordSummary(moduleTenAssessmentState, spec),
        notes: moduleTenAssessmentState.notes,
      },
    }).then((saved) => {
      if (saved && moduleTenCaseRedoRequested()) delete moduleTenUser.openLabRedosByModuleKey['soc-10'];
    });
  }
  if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleTenUser, 'soc-analyst', 'soc-10', MODULE_TEN_ASSESSMENT_KEY);
  const status = document.getElementById('m10-status');
  if (status) status.textContent = 'Complete';
  moduleTenRenderAssessment();
}

function wireModuleTenAssessmentLab() {
  const root = document.getElementById('m10-assessment-lab-dynamic');
  if (!root || !moduleTenAssessmentState) return;
  MODULE_TEN_CONSOLE.wire(root);
  moduleTenRewireAssessmentLabGating();
  const wireOptional = () => {
    const optional = document.getElementById('m10-additional-labs');
    if (optional) wireMissionNextLabGating(optional, moduleTenAssessmentState.labProgress, () => {
      moduleTenSaveAssessment();
      optional.outerHTML = moduleTenAdditionalLabs();
      wireOptional();
    });
  };
  wireOptional();
  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-m10-submit-case]')) { moduleTenFinalizeCase(root); return; }
    if (event.target.closest('[data-m10-save-case]')) {
      moduleTenAssessmentState.actionHistory.push({ action: 'Saved case', at: new Date().toISOString() });
      moduleTenSaveAssessment();
      moduleTenRenderAssessment();
    }
  });
  root.addEventListener('change', (event) => {
    if (event.target.id !== 'm10-assessment-form' && !event.target.closest('#m10-assessment-form')) return;
    const { name, value } = event.target;
    if (!name || !caseRecordApply(moduleTenAssessmentState, name, value)) return;
    moduleTenAssessmentState.actionHistory.push({ action: `Updated ${name}`, at: new Date().toISOString() });
    moduleTenSaveAssessment();
    moduleTenRenderAssessment();
  });
  root.addEventListener('input', (event) => {
    if (event.target.tagName === 'TEXTAREA' && event.target.name === 'notes' && event.target.closest('#m10-assessment-form')) {
      caseRecordApply(moduleTenAssessmentState, 'notes', event.target.value);
      moduleTenSaveAssessment();
    }
  });
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 10, moduleKey: 'soc-10', view: viewModuleTen, wire: wireModuleTen });
