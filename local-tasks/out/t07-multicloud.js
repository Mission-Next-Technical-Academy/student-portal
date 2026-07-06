const MC_CONNECTORS = [
  {
    id: 'connector-a-aaaa1111',
    cloud: 'AWS',
    accountId: '111122223333',
    plans: ['CSPM','Servers'],
    health: 'Healthy',
    lastSync: '2026-06-15T12:00:00.000Z'
  },
  {
    id: 'connector-b-bbbb2222',
    cloud: 'GCP',
    accountId: 'proj-aaaa1111',
    plans: ['Databases','Containers'],
    health: 'Warning',
    lastSync: '2026-06-14T18:30:00.000Z'
  }
];

const MC_RESOURCES = [
  {
    id: 'res-a-bbbb2222-7',
    cloud: 'GCP',
    type: 'Container cluster',
    name: 'nw-ops-cluster-8',
    region: 'europe-west3',
    riskLevel: 'High'
  },
  {
    id: 'res-b-aaaa1111-9',
    cloud: 'AWS',
    type: 'VM instance',
    name: 'nw-ops-vm-7',
    region: 'eu-west-1',
    riskLevel: 'Medium'
  },
  {
    id: 'res-c-bbbb2222-3',
    cloud: 'GCP',
    type: 'VM instance',
    name: 'nw-ops-web-server-6',
    region: 'us-central1',
    riskLevel: 'Low'
  },
  {
    id: 'res-d-bbbb2222-4',
    cloud: 'GCP',
    type: 'VM instance',
    name: 'nw-ops-backend-server-5',
    region: 'us-central1',
    riskLevel: 'None'
  },
  {
    id: 'res-e-bbbb2222-6',
    cloud: 'GCP',
    type: 'SQL database',
    name: 'nw-ops-user-database-10',
    region: 'europe-west3',
    riskLevel: 'High'
  },
  {
    id: 'res-f-bbbb2222-8',
    cloud: 'GCP',
    type: 'VM instance',
    name: 'nw-ops-api-server-9',
    region: 'us-central1',
    riskLevel: 'Low'
  },
  {
    id: 'res-g-bbbb2222-0',
    cloud: 'GCP',
    type: 'Storage bucket',
    name: 'nw-ops-data-store-3',
    region: 'us-central1',
    riskLevel: 'None'
  },
  {
    id: 'res-h-bbbb2222-1',
    cloud: 'GCP',
    type: 'VM instance',
    name: 'nw-ops-frontend-server-4',
    region: 'us-central1',
    riskLevel: 'Low'
  },
  {
    id: 'res-i-bbbb2222-5',
    cloud: 'GCP',
    type: 'VM instance',
    name: 'nw-ops-auth-server-2',
    region: 'us-central1',
    riskLevel: 'Low'
  },
  {
    id: 'res-j-bbbb2222-2',
    cloud: 'GCP',
    type: 'Container cluster',
    name: 'nw-ops-k8s-cluster-0',
    region: 'europe-west3',
    riskLevel: 'Medium'
  },
  {
    id: 'res-k-bbbb2222-10',
    cloud: 'GCP',
    type: 'Storage bucket',
    name: 'nw-ops-backup-store-7',
    region: 'us-central1',
    riskLevel: 'Low'
  },
  {
    id: 'res-l-bbbb2222-9',
    cloud: 'GCP',
    type: 'Storage bucket',
    name: 'nw-ops-media-store-8',
    region: 'us-central1',
    riskLevel: 'Low'
  }
];

const MC_ALERTS = [
  {
    id: 'alert-a-bbbb2222-5',
    cloud: 'GCP',
    title: 'Unusual access event on container cluster',
    severity: 'High',
    resource: 'nw-ops-k8s-cluster-0',
    description: 'An unexpected role was assumed by an identity in the container cluster, indicating potential misuse or unauthorized access.'
  },
  {
    id: 'alert-b-bbbb2222-3',
    cloud: 'AWS',
    title: 'Unsuccessful login attempts on keypair management service',
    severity: 'Medium',
    resource: 'nw-ops-vm-7',
    description: 'A series of failed sign-on attempts were detected, which could indicate a compromised key pair or brute-force attack.'
  }
];

if (typeof module !== 'undefined') { module.exports = { MC_CONNECTORS, MC_RESOURCES, MC_ALERTS }; }