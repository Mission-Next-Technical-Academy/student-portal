const MSSP_TENANTS = [
  {
    id: 'tn-1',
    name: 'Northwind Trading Co.',
    workspaces: ['Workspace A'],
    delegatedRoles: ['Microsoft Sentinel Reader'],
    status: 'Active'
  },
  {
    id: 'tn-2',
    name: 'BlueHarbor Logistics Ltd.',
    workspaces: ['Workspace B', 'Workspace C'],
    delegatedRoles: ['Microsoft Sentinel Contributor', 'Microsoft Sentinel Responder'],
    status: 'Pending'
  },
  {
    id: 'tn-3',
    name: 'SeaShell Enterprises Inc.',
    workspaces: ['Workspace D'],
    delegatedRoles: ['Microsoft Sentinel Reader'],
    status: 'Active'
  },
  {
    id: 'tn-4',
    name: 'Albatross Shipping Corp.',
    workspaces: ['Workspace E'],
    delegatedRoles: ['Microsoft Sentinel Contributor'],
    status: 'Pending'
  }
];

const MTO_INCIDENTS = [
  {
    id: 'mti-01',
    tenant: 'Northwind Trading Co.',
    title: 'Alleged Data Exfiltration from Finance Group',
    severity: 'High',
    status: 'Resolved',
    assignedTo: 'Alex Taylor'
  },
  {
    id: 'mti-02',
    tenant: 'Northwind Trading Co.',
    title: 'Suspicious Login from Uncommon IP',
    severity: 'Medium',
    status: 'In progress',
    assignedTo: 'M. Okafor'
  },
  {
    id: 'mti-03',
    tenant: 'BlueHarbor Logistics Ltd.',
    title: 'Potential Security Breach in Operations Warehouse',
    severity: 'High',
    status: 'Active',
    assignedTo: 'R. Vance'
  },
  {
    id: 'mti-04',
    tenant: 'BlueHarbor Logistics Ltd.',
    title: 'Failed Login Attempt from Internal Machine',
    severity: 'Low',
    status: 'Active',
    assignedTo: 'Unassigned'
  },
  {
    id: 'mti-05',
    tenant: 'SeaShell Enterprises Inc.',
    title: 'Repeated Attempts to Access Restricted Files',
    severity: 'Medium',
    status: 'Active',
    assignedTo: 'L. Higginbotham'
  },
  {
    id: 'mti-06',
    tenant: 'SeaShell Enterprises Inc.',
    title: 'Data Scrubbing Operation in Progress',
    severity: 'Informational',
    status: 'In progress',
    assignedTo: 'Unassigned'
  },
  {
    id: 'mti-07',
    tenant: 'Albatross Shipping Corp.',
    title: 'Multiple Suspicious Activities in Sales Department',
    severity: 'High',
    status: 'In progress',
    assignedTo: 'Z. Wang'
  },
  {
    id: 'mti-08',
    tenant: 'Albatross Shipping Corp.',
    title: 'Unrecognized User Access to Restricted Network Zone',
    severity: 'Medium',
    status: 'Active',
    assignedTo: 'V. Patel'
  }
];

if (typeof module !== 'undefined') { module.exports = { MSSP_TENANTS, MTO_INCIDENTS }; }