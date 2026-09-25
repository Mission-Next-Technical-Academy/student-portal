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

let moduleTenQuizState = null;
// Set when the learner explicitly asks to retake a knowledge check that the
// account already records as passed (see moduleTenQuizVerifiedElsewhere()).
let moduleTenQuizForceRetake = false;
let moduleTenReviewMode = false;
let moduleTenUser = null;

const MODULE_TEN_GUIDED_DEFAULT_STATE = { practiceComplete: false, practiceNotes: '', lastQuizQuestionIds: [], labProgress: {} };
const MODULE_TEN_ASSESSMENT_DEFAULT_STATE = {
  completed: false, attempts: 0, feedback: [], validationError: '', lastSubmittedAt: '', notes: '', flags: [], labProgress: {},
};

const MODULE_TEN_GUIDED_LAB_IDS = ['guided-1', 'guided-2'];
const MODULE_TEN_ASSESSMENT_LAB_IDS = ['assessment-1', 'assessment-2', 'additional-1', 'additional-2'];

let moduleTenGuidedState = null;
let moduleTenAssessmentState = null;

function moduleTenLoad(user) {
  if (moduleTenUser?.email !== user?.email) moduleTenQuizForceRetake = false;
  moduleTenUser = user;
  moduleTenGuidedState = LabRuntime.loadCaseState(MODULE_TEN_GUIDED_LAB_ID, 'soc-10', user, MODULE_TEN_GUIDED_DEFAULT_STATE);
  moduleTenAssessmentState = LabRuntime.loadCaseState(MODULE_TEN_ASSESSMENT_LAB_ID, 'soc-10', user, MODULE_TEN_ASSESSMENT_DEFAULT_STATE);
  if (typeof moduleTenGuidedState.practiceNotes !== 'string') moduleTenGuidedState.practiceNotes = '';
  if (!Array.isArray(moduleTenGuidedState.lastQuizQuestionIds)) moduleTenGuidedState.lastQuizQuestionIds = [];
  if (typeof moduleTenAssessmentState.notes !== 'string') moduleTenAssessmentState.notes = '';
  if (!Array.isArray(moduleTenAssessmentState.feedback)) moduleTenAssessmentState.feedback = [];
  if (!Array.isArray(moduleTenAssessmentState.flags)) moduleTenAssessmentState.flags = [];
  if (!moduleTenGuidedState.labProgress || typeof moduleTenGuidedState.labProgress !== 'object') moduleTenGuidedState.labProgress = {};
  if (!moduleTenAssessmentState.labProgress || typeof moduleTenAssessmentState.labProgress !== 'object') moduleTenAssessmentState.labProgress = {};

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

function moduleTenSaveGuided() { if (moduleTenUser && moduleTenGuidedState) LabRuntime.saveCaseState(MODULE_TEN_GUIDED_LAB_ID, 'soc-10', moduleTenUser, moduleTenGuidedState); }
function moduleTenSaveAssessment() { if (moduleTenUser && moduleTenAssessmentState) LabRuntime.saveCaseState(MODULE_TEN_ASSESSMENT_LAB_ID, 'soc-10', moduleTenUser, moduleTenAssessmentState); }


function moduleTenGuidedLabPanel() {
  const bucket = moduleTenGuidedState.labProgress;
  const launchGroup = missionNextLabLaunchGroup(10, 'guided', [
    { title: 'Analyzing Windows Registry for Evidence of Malicious Activity', href: 'imported-labs/mission-next-labs/index.html#/track/windows-forensics/project/wf-2/lab', labId: 'guided-1' },
    { title: 'Forensic Analysis of Windows File Systems and Artifacts', href: 'imported-labs/mission-next-labs/index.html#/track/windows-forensics/project/wf-3/lab', labId: 'guided-2' },
  ], bucket);
  const readyToMark = missionNextAllLabsComplete(bucket, MODULE_TEN_GUIDED_LAB_IDS);
  const canMark = moduleTenGuidedState.practiceComplete || readyToMark;
  return `<section class="m10-external-lab" id="m10-guided-lab-panel">
    <p class="m10-panel-instruction">Work through both imported Windows-forensics projects below; each opens on this page with its own guided tasks. Mark each lab complete after you finish it, note what you found, then mark the Guided Lab complete.</p>
    ${launchGroup}
    <label class="m10-note-label">Working notes (optional)<textarea rows="4" maxlength="900" data-m10-practice-notes placeholder="What did you find? Any blockers?">${esc(moduleTenGuidedState.practiceNotes)}</textarea></label>
    <div class="m10-actions"><button type="button" class="m10-submit" data-m10-practice-complete ${canMark ? '' : 'disabled'}>${moduleTenGuidedState.practiceComplete ? 'Guided Lab marked complete' : 'Mark Guided Lab complete'}</button></div>
    ${!canMark ? '<p class="m10-help">Mark both labs above complete before marking the Guided Lab complete.</p>' : ''}
  </section>`;
}

function moduleTenAssessmentLabPanel() {
  const bucket = moduleTenAssessmentState.labProgress;
  const feedbackHtml = moduleTenAssessmentState.feedback?.length ? `<div class="m10-independent-feedback is-pass" role="status"><strong>Submitted</strong><ul>${moduleTenAssessmentState.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div>` : '';
  const launchGroup = missionNextLabLaunchGroup(10, 'assessment', [
    { title: 'Recovering and Analyzing Deleted Files on Windows Systems', href: 'imported-labs/mission-next-labs/index.html#/track/windows-forensics/project/wf-5/lab', labId: 'assessment-1' },
    { title: 'Investigating Windows Event Logs for Security Incidents', detail: 'Windows event evidence and account activity', href: 'imported-labs/mission-next-labs/index.html#/track/windows-forensics/project/wf-1/lab', labId: 'assessment-2' },
  ], bucket);
  const readyToSubmit = missionNextAllLabsComplete(bucket, MODULE_TEN_ASSESSMENT_LAB_IDS);
  const canSubmit = moduleTenAssessmentState.completed || readyToSubmit;
  return `<section class="m10-external-lab" id="m10-assessment-lab-panel">
    <p class="m10-panel-instruction">Complete the imported Windows-forensics deleted-files and event-log projects below, mark each one complete, then write up your findings for instructor review.</p>
    ${launchGroup}
    <form id="m10-assessment-form">
      <label class="m10-note-label">Assessment write-up<textarea id="m10-assessment-notes" rows="6" maxlength="900" data-m10-assessment-notes placeholder="Summarize what the deleted-files lab surfaced, your analysis, and your recommended action…">${esc(moduleTenAssessmentState.notes)}</textarea></label>
      <p class="m10-help">In at least 80 characters, describe what you found and your recommended action.</p>
      ${!canSubmit ? '<p class="m10-help">Mark both labs above complete before submitting for review.</p>' : ''}
      <div class="m10-actions"><button type="submit" class="m10-submit" ${canSubmit ? '' : 'disabled'}>${moduleTenAssessmentState.completed ? 'Resubmit for review' : 'Submit for review'}</button></div>
    </form>
    ${feedbackHtml}
  </section>`;
}

function moduleTenAdditionalLabs() {
  const bucket = moduleTenAssessmentState.labProgress;
  const launchGroup = missionNextLabLaunchGroup(10, 'additional', [
    { title: 'Extracting and Interpreting Browser Artifacts on Windows', detail: 'Browser history and user-activity evidence', href: 'imported-labs/mission-next-labs/index.html#/track/windows-forensics/project/wf-4/lab', labId: 'additional-1' },
    { title: 'File System Security Assessment', detail: 'Permissions and file-integrity evidence', href: 'imported-labs/mission-next-labs/index.html#/track/security-assessments/project/sa-2/lab', labId: 'additional-2' },
  ], bucket);
  if (!launchGroup) return '';
  return `<section class="mn-additional-labs" id="m10-additional-labs" aria-labelledby="mn-additional-labs-10">
    <div class="mn-additional-labs-heading"><div><p class="mn-additional-labs-kicker">REQUIRED LABS</p><h2 id="mn-additional-labs-10">Additional Mission Next Labs</h2></div><span>Graded and required for module completion</span></div>
    <p class="mn-additional-labs-copy">These related projects extend the module topic and are required. Mark each one complete after you finish it, alongside the Guided Lab and Assessment Lab.</p>
    ${launchGroup}
  </section>`;
}

function moduleTenGetSections() {
  return [
    { id: 'lecture', title: 'Lecture', type: 'lecture', isComplete: true, scrollId: 'm10-lecture' },
    { id: 'knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: moduleTenQuizState?.passed, scrollId: 'm10-knowledge-check' },
    { id: 'guided-lab', title: 'Guided Lab', type: 'lab', isComplete: moduleTenGuidedState.practiceComplete, scrollId: 'm10-guided-lab' },
    { id: 'assessment-lab', title: 'Assessment Lab', type: 'review', isComplete: moduleTenAssessmentState.completed, scrollId: 'm10-assessment-lab' },
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

function moduleTenScenarioLoops() {
  return `<div class="m10-loop-grid" aria-label="Module 10 four-part learning loops">
    <article><p class="m10-kicker">Lesson 1 · Scenario</p><h4>Receive a post-containment evidence intake</h4><p>A synthetic Windows endpoint has been isolated. Registry, file-system, and deleted-file artifacts are available for intake.</p></article>
    <article><p class="m10-kicker">Lesson 1 · Theory</p><h4>Integrity, provenance, custody</h4><p>Hash meaning, UTC basis, acquisition controls, and documented handoffs answer different review questions.</p></article>
    <article><p class="m10-kicker">Lesson 1 · Knowledge check</p><h4>Choose what can be preserved</h4><p>Explain which artifacts are assigned evidence and which remain baseline context.</p></article>
    <article><p class="m10-kicker">Lesson 1 · Applied task</p><h4>Complete the Guided Lab</h4><p>Work the imported Windows-registry and file-system forensics projects and record what you found.</p></article>
    <article><p class="m10-kicker">Lesson 2 · Scenario</p><h4>Reconstruct the impact sequence</h4><p>Compare endpoint, service-control, isolation, and baseline records from the same synthetic incident.</p></article>
    <article><p class="m10-kicker">Lesson 2 · Theory</p><h4>Map behavior only when demonstrated</h4><p>ATT&amp;CK organizes observed behavior; it does not supply missing access, operator, or lateral-movement facts.</p></article>
    <article><p class="m10-kicker">Lesson 2 · Knowledge check</p><h4>Separate fact from inference</h4><p>Use source review to test whether a relationship or technique is supported, not merely plausible.</p></article>
    <article><p class="m10-kicker">Lesson 2 · Applied task</p><h4>Complete the Assessment Lab</h4><p>Work the imported deleted-file recovery project, then write up your findings and recommended action for instructor review.</p></article>
  </div>`;
}

function moduleTenVideoScript() {
  return `<details class="m10-video-script">
    <summary><strong>Video script (recording pending)</strong></summary>
    <div class="m10-script-body">
      <p><strong>Introduction:</strong> Welcome to evidence handling and incident reconstruction. This module teaches you how to acquire and preserve forensic evidence defensibly, distinguish between integrity verification and provenance documentation, build a causal incident timeline from mixed sources, map observed behavior to ATT&CK appropriately, and write bounded conclusions that match your evidence.</p>

      <p><strong>Segment 1 — Chain of custody and defensible acquisition.</strong> Evidence must be collected using validated controls: read-only blockers, UTC timestamps, cryptographic hashing of both source and image, and a complete transfer ledger. Each handoff requires both parties' signatures, seal condition, and clear purpose. A matching hash proves the image is byte-identical to the source at that moment—it does not prove every later custody event was sound or that an unlogged copy was never mishandled. When you find evidence without custody records, quarantine it pending provenance review instead of accepting it into a controlled analysis. Your intake authority is to accept logged originals and segregate uncontrolled copies.</p>

      <p><strong>Segment 2 — Hash integrity versus proof of custody.</strong> Hashing both the source and image establishes a baseline: if they match, the image captured all source content without modification. But integrity at acquisition time is distinct from provenance across later transfer, storage, and review. A matching hash does not repair missing custodian signatures, receipt times, or seal records. If two images of the same source have different hashes, investigate which acquisition was sound. If an unlogged copy has a matching hash, that integrity proves sameness—not custody—and the copy must be quarantined, not merged.</p>

      <p><strong>Segment 3 — Correlation, causation, and timeline construction.</strong> A timeline is not a list of events in order; it is a sequence of correlated observations supporting one incident. Events are correlated when they share entity (endpoint, account, IP) and timing. Causation adds a direct behavioral connection: does the parent event's activity directly lead to the child event? A connection 4 minutes after a file arrives at the same endpoint is correlation material; causation requires evidence that the file was opened and started the process. Three events with matching identifiers across wide time gaps require continuous behavioral chain to prove they belong together. Use approved change-control records to separate baseline maintenance from incident activity.</p>

      <p><strong>Segment 4 — ATT&CK as a framework, not a timeline or completion checklist.</strong> Once your timeline of supported events is complete, you can map the behaviors you observe to ATT&CK techniques for easier communication and analysis. But ATT&CK is subordinate to evidence, not the other way around. Map only techniques you can point to in your timeline. Do not map probable next steps, assumed attacker objectives, or techniques the framework covers that your data does not. If a connection is observed but file transfer is not, map the connection behavior and note that tool transfer remains unknown. A complete ATT&CK mapping does not replace incident documentation; the original timeline, scope, entities, and custody records remain the primary record.</p>

      <p><strong>Segment 5 — Bounded conclusions and honest uncertainty.</strong> You can draw high-confidence conclusions from evidence within a scoped dataset. You can make high-bounded conclusions about events you observed in detail while explicitly noting unknowns. Do not claim certainty beyond what the evidence supports, and do not refuse to conclude because the dataset is incomplete. Instead, say: "This host was confirmed compromised. Lateral movement is not observed in the assigned slice. Wider environment status unknown—continue monitoring." This precision builds trust and shapes appropriate response.</p>

      <p><strong>Closing:</strong> Evidence handling is a discipline of acquisition controls, integrity checks, and custody documentation. Timeline construction separates correlation from causation through behavioral connection. ATT&CK organizes your observed behaviors without filling gaps. Your conclusion should state what you know, what you do not know, and what scope your findings cover. Your team depends on that honesty.</p>
    </div>
  </details>`;
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
    <p>You should now be able to collect evidence using validated controls and document complete custody; distinguish hash integrity from provenance; construct a supported incident timeline separating correlation from causation; map observed behavior to ATT&CK as a framework rather than a completion checklist; and write conclusions that state what is confirmed, what remains bounded, and what is unknown. In later modules and on-the-job, you will apply these skills in triage, escalation, and forensic investigation scenarios.</p>
  </section>`;
}

function viewModuleTen(user, program) {
  moduleTenLoad(user);
  const complete = moduleTenAssessmentState.completed === true;
  const module = program.modules['soc-10'];
  const sections = moduleTenGetSections();
  const lectureOpen = moduleTenReviewMode || !sections[0].isComplete;
  const quizOpen = moduleTenReviewMode || (moduleTenQuizState && !moduleTenQuizState.passed);
  const guidedLabOpen = moduleTenReviewMode || !sections[2].isComplete;
  const assessmentLabOpen = moduleTenReviewMode || !sections[3].isComplete;
  const reviewOpen = moduleTenReviewMode;
  const quickNavItems = moduleTenGetQuickNavItems();

  return `<div class="m10-shell">
    ${moduleTopbar(user, program)}
    <div class="mquick-nav-layout">
      ${moduleProgressShell(sections, { reviewMode: moduleTenReviewMode })}
      <main class="m10-main mf-frame">
      <section class="m10-hero mf-hero" aria-labelledby="m10-title"><div><p class="m10-kicker mf-kicker">Module 10 · ${formatHandsOnDuration(module.durationMinutes)} · independent</p><h1 id="m10-title">${esc(module.title)}</h1><p class="mf-lede">Preserve incident evidence, document custody, and reconstruct a separate case from chronology and demonstrated behavior. ATT&CK remains subordinate to the evidence as a behavior framework; it does not replace the case record.</p></div><dl class="mf-stats" aria-label="Module lab progress"><div><dt>Guided Lab</dt><dd>${moduleTenGuidedState.practiceComplete ? 'Complete' : 'Not started'}</dd></div><div><dt>Assessment Lab</dt><dd id="m10-status">${complete ? 'Complete' : moduleTenAssessmentState.attempts ? 'In progress' : 'Not started'}</dd></div></dl></section>

      <details class="m10-section-collapsible mf-section" ${lectureOpen ? 'open' : ''}>
        <summary class="m10-section"><div class="m10-section-heading mf-section-heading"><span class="m10-section-badge mf-section-badge">1</span><div><p class="m10-kicker mf-kicker">Lecture</p><h2 id="m10-lecture">Evidence acquisition, custody, timeline reconstruction, and bounded conclusions</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m10-section-body mf-section-body">
          <section class="m10-boundary"><i class="ri-lock-2-line" aria-hidden="true"></i><p><strong>Bounded practice:</strong> this is incident evidence handling and case documentation, not a full digital-forensics program. Acquisition and specialist examination remain with authorized specialists; each exercise contains only its assigned synthetic case dataset.</p></section>
          ${moduleTenScenarioLoops()}
          ${moduleTenVideoScript()}
        </div>
      </details>

      <details class="m10-section-collapsible mf-section" ${quizOpen ? 'open' : ''}>
        <summary class="m10-section"><div class="m10-section-heading mf-section-heading"><span class="m10-section-badge mf-section-badge">2</span><div><p class="m10-kicker mf-kicker">Knowledge Check</p><h2 id="m10-knowledge-check">Test your understanding of evidence handling and timeline reconstruction</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m10-section-body mf-section-body">
          <div id="m10-quiz-panel">${moduleTenQuizPanel()}</div>
        </div>
      </details>

      <details class="m10-section-collapsible mf-section mf-lab-section" ${guidedLabOpen ? 'open' : ''}>
        <summary class="m10-section"><div class="m10-section-heading mf-section-heading"><span class="m10-section-badge mf-section-badge">3</span><div><p class="m10-kicker mf-kicker">Practice It · Guided Lab</p><h2 id="m10-guided-lab">Windows forensics practice</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m10-section-body mf-section-body">
          <div class="m10-boundary"><i class="ri-shield-check-line" aria-hidden="true"></i><p><strong>Lab boundary:</strong> These labs open in the imported training application on this page.</p></div>
          <div id="m10-guided-lab-dynamic">${moduleTenGuidedLabPanel()}</div>
        </div>
      </details>

      <details class="m10-section-collapsible mf-section" ${assessmentLabOpen ? 'open' : ''}>
        <summary class="m10-section"><div class="m10-section-heading mf-section-heading"><span class="m10-section-badge mf-section-badge">4</span><div><p class="m10-kicker mf-kicker">Prove It · Assessment Lab</p><h2 id="m10-assessment-lab">Independent Windows forensics review</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
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
  // Review mode toggle wiring
  const reviewToggle = document.querySelector('[data-mnav-review-toggle]');
  if (reviewToggle) {
    reviewToggle.addEventListener('click', () => {
      moduleTenReviewMode = !moduleTenReviewMode;
      const sections = moduleTenGetSections();
      const lectureOpen = moduleTenReviewMode || !sections[0].isComplete;
      const quizOpen = moduleTenReviewMode || (moduleTenQuizState && !moduleTenQuizState.passed);
      const guidedLabOpen = moduleTenReviewMode || !sections[2].isComplete;
      const assessmentLabOpen = moduleTenReviewMode || !sections[3].isComplete;
      const reviewOpen = moduleTenReviewMode;
      document.querySelectorAll('.m10-section-collapsible').forEach((details, idx) => {
        const shouldOpen = idx === 0 ? lectureOpen : idx === 1 ? quizOpen : idx === 2 ? guidedLabOpen : idx === 3 ? assessmentLabOpen : reviewOpen;
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
  const root = document.getElementById('m10-assessment-lab-dynamic');
  if (!root || !moduleTenAssessmentState) return;
  wireMissionNextLabGating(root, moduleTenAssessmentState.labProgress, () => {
    moduleTenSaveAssessment();
    root.innerHTML = moduleTenAssessmentLabPanel();
    moduleTenRewireAssessmentLabGating();
  });
}

function wireModuleTenGuidedLab() {
  const root = document.getElementById('m10-guided-lab-dynamic');
  if (!root || !moduleTenGuidedState) return;
  moduleTenRewireGuidedLabGating();
  root.addEventListener('input', (event) => {
    if (event.target.matches('[data-m10-practice-notes]')) {
      moduleTenGuidedState.practiceNotes = event.target.value;
      moduleTenSaveGuided();
    }
  });
  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-m10-practice-complete]')) {
      if (!moduleTenGuidedState.practiceComplete && !missionNextAllLabsComplete(moduleTenGuidedState.labProgress, MODULE_TEN_GUIDED_LAB_IDS)) return;
      moduleTenGuidedState.practiceComplete = true;
      moduleTenSaveGuided();
      root.innerHTML = moduleTenGuidedLabPanel();
      moduleTenRewireGuidedLabGating();
    }
  });
}

function wireModuleTenAssessmentLab() {
  const root = document.getElementById('m10-assessment-lab-dynamic');
  if (!root || !moduleTenAssessmentState) return;
  moduleTenRewireAssessmentLabGating();
  const additionalRoot = document.getElementById('m10-additional-labs');
  if (additionalRoot) {
    wireMissionNextLabGating(additionalRoot, moduleTenAssessmentState.labProgress, () => {
      moduleTenSaveAssessment();
      moduleTenRewireAssessmentLabGating();
    });
  }
  root.addEventListener('submit', (event) => {
    if (event.target.id !== 'm10-assessment-form') return;
    event.preventDefault();
    if (!moduleTenAssessmentState.completed && !missionNextAllLabsComplete(moduleTenAssessmentState.labProgress, MODULE_TEN_ASSESSMENT_LAB_IDS)) {
      moduleTenAssessmentState.feedback = ['Mark all required labs above complete before submitting your write-up.'];
      moduleTenSaveAssessment();
      root.innerHTML = moduleTenAssessmentLabPanel();
      moduleTenRewireAssessmentLabGating();
      return;
    }
    const notes = event.target.querySelector('#m10-assessment-notes')?.value || '';
    moduleTenAssessmentState.notes = notes;
    if (notes.trim().length < 80) {
      moduleTenAssessmentState.feedback = ['Write at least 80 characters describing your findings and recommended action before submitting.'];
      moduleTenSaveAssessment();
      root.innerHTML = moduleTenAssessmentLabPanel();
      moduleTenRewireAssessmentLabGating();
      return;
    }
    moduleTenAssessmentState.attempts = (moduleTenAssessmentState.attempts || 0) + 1;
    moduleTenAssessmentState.lastSubmittedAt = new Date().toISOString();
    moduleTenAssessmentState.completed = true;
    moduleTenAssessmentState.feedback = ['Submitted. This write-up has been recorded as your Assessment Lab submission for instructor review.'];
    if (!moduleTenAssessmentState.flags.includes('M10-ASSESSMENT-LAB-COMPLETE')) moduleTenAssessmentState.flags.push('M10-ASSESSMENT-LAB-COMPLETE');
    if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(moduleTenUser, MODULE_TEN_ASSESSMENT_KEY, { state: 'complete', result: { notes } });
    }
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleTenUser, 'soc-analyst', 'soc-10', MODULE_TEN_ASSESSMENT_KEY);
    moduleTenSaveAssessment();
    const status = document.getElementById('m10-status');
    if (status) status.textContent = 'Complete';
    root.innerHTML = moduleTenAssessmentLabPanel();
    moduleTenRewireAssessmentLabGating();
  });
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 10, moduleKey: 'soc-10', view: viewModuleTen, wire: wireModuleTen });
