/* Pure criterion extraction for the Module 10 evidence-locker assessment.
 * Findings: 'observed' | 'partial' | 'incomplete' | 'unknown'. ATT&CK
 * linkage reads the carried ATT&CK workspace's mappings (context.mappings). */
const SocM10AssessmentRubric = (() => {
  'use strict';

  const RUBRIC = Object.freeze([
    { id: 'evidence-selection', label: 'Select the evidence the reconstruction needs' },
    { id: 'acquisition-metadata', label: 'Record source and acquisition context' },
    { id: 'hash-integrity', label: 'Verify hashes and handle a failed acquisition' },
    { id: 'custody', label: 'Transfer custody correctly' },
    { id: 'preservation', label: 'Preserve originals under legal hold and package them' },
    { id: 'timeline', label: 'Reconstruct the attachment-to-persistence timeline' },
    { id: 'fact-analysis', label: 'Separate observed fact from analysis' },
    { id: 'root-cause', label: 'Support the root cause with evidence' },
    { id: 'attack-linkage', label: 'Map only evidenced behavior to ATT&CK' },
    { id: 'unknowns-escalation', label: 'Record unknowns and the specialist escalation' },
  ].map(Object.freeze));

  const SPECULATIVE = /\b(likely|probably|possibly|appears?|seems?|suggests?|indicates?|because|caused|so that|in order to)\b/i;
  const OVERCLAIM = /exfiltrat\w*\s+(?:was\s+|is\s+)?(?:confirmed|proven|established)|data (?:was|were) (?:stolen|exfiltrated)|encrypt\w* (?:was )?confirmed/i;

  function extract(state, fixture, context = {}) {
    const s = fixture?.scenario;
    const truth = fixture?.expectedTruth;
    const criteria = [];
    const add = (id, finding, evidence = []) => criteria.push({ id, finding, evidenceIds: [...new Set(evidence.filter(Boolean))] });
    if (!s || !truth) {
      RUBRIC.forEach(({ id }) => add(id, 'unknown'));
      return { rubricVersion: 1, criteria, overclaim: false };
    }
    const locker = state?.locker && typeof state.locker === 'object' ? state.locker : {};
    const history = Array.isArray(state?.actionHistory) ? state.actionHistory : [];
    const byId = new Map(s.artifacts.map((artifact) => [artifact.id, artifact]));
    const required = truth.requiredArtifactIds;
    const held = required.filter((id) => locker[id]);

    const noise = truth.noiseArtifactIds.filter((id) => locker[id]);
    add('evidence-selection', held.length === required.length && !noise.length ? 'observed' : held.length >= 4 ? 'partial' : held.length ? 'incomplete' : 'unknown', held);

    // Source labels embed hostnames, which moved to lower case (entity identity contract); compare ignoring case so a
    // locker item recorded with the earlier upper-case label (WKSTN-19 disk image) still matches.
    const sameSource = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase();
    const metadataOk = held.filter((id) => sameSource(locker[id].source, byId.get(id).source) &&byId.get(id).methods.includes(locker[id].method) && String(locker[id].acquiredBy || '').trim());
    add('acquisition-metadata', held.length && metadataOk.length === required.length ? 'observed' : metadataOk.length >= required.length / 2 ? 'partial' : held.length ? 'incomplete' : 'unknown', metadataOk);

    const verified = held.filter((id) => locker[id].integrity === 'verified' && locker[id].verifiedHash === byId.get(id).sourceHash);
    const mismatchId = truth.mismatchArtifactId;
    const mismatchSeen = history.some((action) => action.type === 'verify' && action.details?.artifactId === mismatchId && action.details?.integrity === 'mismatch');
    const mismatchResolved = mismatchSeen && locker[mismatchId]?.integrity === 'verified';
    add('hash-integrity', verified.length === required.length && mismatchResolved ? 'observed' : verified.length || mismatchSeen ? 'partial' : 'unknown', verified);

    const specialist = locker[truth.specialistArtifactId];
    const transfer = (state?.transfers || []).find((item) => item.artifactId === truth.specialistArtifactId && item.to === truth.specialistCustodian
      && item.hashAtTransfer === byId.get(truth.specialistArtifactId).sourceHash);
    const wrongTransfer = (state?.transfers || []).some((item) => item.artifactId === truth.specialistArtifactId && item.to !== truth.specialistCustodian);
    add('custody', transfer && specialist?.custodian === truth.specialistCustodian ? 'observed' : wrongTransfer ? 'incomplete' : (state?.transfers || []).length ? 'partial' : 'unknown', transfer ? [transfer.artifactId] : []);

    const holdIds = state?.legalHold?.artifactIds || [];
    const heldOriginals = truth.originalsForHold.filter((id) => holdIds.includes(id));
    const packaged = (state?.exports || []).some((pkg) => truth.originalsForHold.every((id) => pkg.artifactIds.includes(id))
      && pkg.manifest.every((entry) => entry.hash === byId.get(entry.artifactId)?.sourceHash));
    add('preservation', heldOriginals.length === truth.originalsForHold.length && packaged ? 'observed' : heldOriginals.length >= 2 ? 'partial' : 'unknown', heldOriginals);

    const timeline = Array.isArray(state?.timeline) ? state.timeline : [];
    const chainInTimeline = truth.chain.filter((id) => timeline.includes(id));
    const ordered = chainInTimeline.every((id, index) => index === 0 || timeline.indexOf(chainInTimeline[index - 1]) < timeline.indexOf(id));
    const chronological = timeline.every((id, index) => index === 0 || byId.get(timeline[index - 1]).time <= byId.get(id).time);
    add('timeline', chainInTimeline.length === truth.chain.length && ordered && chronological ? 'observed' : chainInTimeline.length >= 4 && ordered ? 'partial' : timeline.length ? 'incomplete' : 'unknown', chainInTimeline);

    const statements = Array.isArray(state?.statements) ? state.statements : [];
    const facts = statements.filter((item) => item.kind === 'fact');
    const analyses = statements.filter((item) => item.kind === 'analysis');
    const cleanFacts = facts.filter((item) => !SPECULATIVE.test(item.text) && item.artifactIds.length);
    add('fact-analysis', cleanFacts.length >= 3 && cleanFacts.length === facts.length && analyses.length >= 1 ? 'observed' : facts.length || analyses.length ? 'partial' : 'unknown',
      [...facts, ...analyses].flatMap((item) => item.artifactIds));

    const rootCause = statements.filter((item) => item.kind === 'root_cause').at(-1);
    const rootCited = rootCause ? truth.rootCauseArtifactIds.filter((id) => rootCause.artifactIds.includes(id)) : [];
    add('root-cause', rootCited.length >= 2 && /attachment|macro|document|docm|remittance|opened/i.test(rootCause.text) ? 'observed' : rootCause ? 'partial' : 'unknown', rootCited);

    const mappings = Array.isArray(context.mappings) ? context.mappings : [];
    const supported = truth.supportedTechniques.filter((technique) => mappings.some((mapping) => mapping.techniqueId === technique.id && mapping.status === 'supported'
      && technique.evidence.some((id) => (mapping.eventIds || []).includes(id))));
    const overmapped = mappings.some((mapping) => mapping.status === 'supported' && truth.unsupportedTechniques.includes(mapping.techniqueId));
    add('attack-linkage', supported.length >= 2 && !overmapped ? 'observed' : overmapped ? 'incomplete' : supported.length ? 'partial' : 'unknown', supported.flatMap((technique) => technique.evidence));

    const topics = new Set((state?.unknowns || []).map((item) => item.topic));
    const unknownsOk = truth.unknowns.every((topic) => topics.has(topic));
    const escalated = state?.escalation?.route === truth.escalationRoute && (state.escalation.artifactIds || []).includes(truth.specialistArtifactId);
    add('unknowns-escalation', unknownsOk && escalated ? 'observed' : topics.size || state?.escalation ? 'partial' : 'unknown', state?.escalation?.artifactIds || []);

    const overclaim = statements.some((item) => OVERCLAIM.test(item.text));
    return { rubricVersion: 1, criteria, overclaim };
  }

  return Object.freeze({ RUBRIC, extract });
})();
