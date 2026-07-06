const COPILOT_KNOWLEDGE = [
  { id:'kb-1', name:'HR policies', type:'File upload', items:14, status:'Ready', scope:'IRM analysts', addedBy:'M. Okafor' },
  { id:'kb-2', name:'IR runbooks', type:'File upload', items:22, status:'Ready', scope:'SOC all', addedBy:'R. Vance' },
  { id:'kb-3', name:'Asset register extract', type:'Search index', items:1830, status:'Ready', scope:'SOC all', addedBy:'R. Vance' },
  { id:'kb-4', name:'Network diagrams', type:'File upload', items:9, status:'Indexing', scope:'Tier 2 only', addedBy:'L. Harper' },
  { id:'kb-5', name:'Vendor risk notes', type:'Search index', items:412, status:'Ready', scope:'GRC team', addedBy:'M. Okafor' },
];
if (typeof module !== 'undefined') { module.exports = { COPILOT_KNOWLEDGE }; }
