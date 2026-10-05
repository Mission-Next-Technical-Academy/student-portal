/* Mission Next SOC assessment evolution contract.
 *
 * Modules 04-12 keep their authored learning surfaces, but this registry is
 * the shared contract they evolve against: Module 03 baseline capabilities,
 * additive module feature flags, and assessment domains. It gives tests and
 * future module work one source of truth without cloning Module 03 files.
 */
const SocAssessmentEvolution = (() => {
  'use strict';

  const BASELINE_CAPABILITIES = [
    'alerts',
    'log-search',
    'kql-engine',
    'normalized-tables',
    'query-results',
    'query-history',
    'cross-source-pivots',
    'timeline',
    'entities',
    'watchlists',
    'source-health',
    'record-details',
    'evidence-pinning',
    'case-record',
    'state-persistence',
    'partial-credit-scoring',
    'instructor-review',
  ];

  const MODULES = [
    {
      moduleKey: 'soc-04',
      labId: 'm04-detection-enrichment-v1',
      catalogLabKey: 'lab-detection-rule',
      title: 'Detection Rules, Threat Intelligence & Automated Monitoring',
      adds: ['threat-intel', 'ioc-lifecycle', 'analytics-rules', 'dynamic-alert-generation', 'intro-automation'],
      domains: ['intelligence', 'ioc-lifecycle', 'query-coverage', 'rule-tuning', 'schedule', 'alert-fidelity', 'safe-automation', 'case-documentation'],
    },
    {
      moduleKey: 'soc-05',
      labId: 'm05-endpoint-chain-v1',
      catalogLabKey: 'lab-endpoint-investigation',
      title: 'Endpoint & Malware Investigation',
      adds: ['endpoint-workspace', 'device-profile', 'process-tree', 'file-reputation', 'persistence', 'endpoint-actions'],
      domains: ['affected-device', 'process-ancestry', 'command-file-interpretation', 'hash-reasoning', 'persistence', 'prevention-cleanup', 'scope', 'evidence', 'endpoint-recommendation', 'handoff'],
    },
    {
      moduleKey: 'soc-06',
      labId: 'm06-hypothesis-hunt-v1',
      catalogLabKey: 'lab-threat-hunt',
      title: 'Threat Hunting & Investigation',
      adds: ['hunting-hypothesis', 'saved-hunt-queries', 'bookmarks', 'hunt-collections', 'related-event-search', 'attack-mapping'],
      domains: ['hypothesis', 'hunt-scope', 'pivots', 'query-relevance', 'bookmarks', 'conclusion', 'attack-accuracy', 'unknowns', 'detection-gap', 'handoff'],
    },
    {
      moduleKey: 'soc-07',
      labId: 'm07-email-network-chain-v1',
      catalogLabKey: 'lab-email-network',
      title: 'Network & Email Analysis',
      adds: ['email-workspace', 'message-trace', 'headers-authentication', 'url-attachment-analysis', 'network-workspace', 'process-network-correlation'],
      domains: ['email-header-interpretation', 'url-attachment-analysis', 'delivery-scope', 'dns-tls-session', 'process-network-correlation', 'timeline', 'noise-rejection', 'scope', 'evidence', 'incident-documentation'],
    },
    {
      moduleKey: 'soc-08',
      labId: 'm08-vulnerability-priority-v1',
      catalogLabKey: 'lab-vulnerability-prioritization',
      title: 'Vulnerability Findings & SOC Prioritization',
      adds: ['exposure-workspace', 'vulnerability-findings', 'asset-criticality', 'reachability', 'compensating-controls', 'remediation-routing'],
      domains: ['finding-validation', 'exposure-reachability', 'asset-criticality', 'exploitability-context', 'control-gap', 'prioritization', 'cvss-balance', 'compensating-controls', 'ownership-due-date', 'documentation'],
    },
    {
      moduleKey: 'soc-09',
      labId: 'm09-incident-response-v1',
      catalogLabKey: 'lab-incident-response',
      title: 'Incident Response',
      adds: ['incident-workspace', 'response-playbooks', 'approval-gates', 'containment-actions', 'state-changing-actions', 'recovery-workspace'],
      domains: ['priority-ownership', 'evidence-preservation', 'containment-targets', 'approval-use', 'execution-verification', 'persistence-removal', 'credential-session-recovery', 'backup-recovery-choice', 'monitoring-escalation', 'incident-record'],
    },
    {
      moduleKey: 'soc-10',
      labId: 'm10-evidence-custody-v1',
      catalogLabKey: 'lab-evidence-custody',
      title: 'Evidence Handling, Legal Hold & Case Documentation',
      adds: ['evidence-locker', 'custody-log', 'legal-hold', 'artifact-integrity', 'reporting-workspace'],
      domains: ['evidence-selection', 'custody-integrity', 'legal-hold-scope', 'artifact-notes', 'timeline-narrative', 'report-audience', 'unsupported-claims', 'handoff', 'closure-readiness', 'documentation'],
    },
    {
      moduleKey: 'soc-11',
      labId: 'm11-soc-metrics-communication-v1',
      catalogLabKey: 'lab-soc-metrics',
      title: 'SOC Metrics, Communication & Continuous Improvement',
      adds: ['metrics-workspace', 'sla-health', 'trend-analysis', 'executive-summary', 'improvement-actions'],
      domains: ['metric-interpretation', 'root-cause', 'incident-vs-operations', 'executive-summary', 'technical-summary', 'escalation-request', 'closure-criteria', 'monitoring-owner', 'improvement-action', 'documentation'],
    },
    {
      moduleKey: 'soc-12',
      labId: 'm12-integrated-capstone-v1',
      catalogLabKey: 'lab-capstone',
      title: 'Integrated SOC Capstone',
      adds: ['complete-soc-environment', 'integrated-investigation', 'response-through-recovery', 'portfolio-report'],
      domains: ['triage', 'query', 'timeline', 'scope', 'enrichment', 'attack', 'detection', 'response', 'reporting', 'closure'],
      capstone: true,
    },
  ];

  function moduleFor(moduleKey) {
    return MODULES.find((module) => module.moduleKey === moduleKey) || null;
  }

  function capabilitiesThrough(moduleKey) {
    const out = new Set(BASELINE_CAPABILITIES);
    for (const module of MODULES) {
      module.adds.forEach((capability) => out.add(capability));
      if (module.moduleKey === moduleKey) break;
    }
    return Array.from(out);
  }

  function validateProgression() {
    const errors = [];
    MODULES.forEach((module, index) => {
      if (!module.labId || !module.catalogLabKey) errors.push(`${module.moduleKey} is missing a lab id or catalog key.`);
      if (!module.domains || module.domains.length < 8) errors.push(`${module.moduleKey} must expose at least eight scoring domains.`);
      const current = capabilitiesThrough(module.moduleKey);
      const previous = index === 0 ? BASELINE_CAPABILITIES : capabilitiesThrough(MODULES[index - 1].moduleKey);
      previous.forEach((capability) => {
        if (!current.includes(capability)) errors.push(`${module.moduleKey} dropped capability ${capability}.`);
      });
    });
    return { ok: errors.length === 0, errors };
  }

  function scoreDomains(domains, answers = {}, options = {}) {
    return SocAssessmentScorer.scoreDomains(domains, answers, options);
  }

  return {
    baselineCapabilities: BASELINE_CAPABILITIES,
    modules: MODULES,
    moduleFor,
    capabilitiesThrough,
    validateProgression,
    scoreDomains,
  };
})();
