const TX_EMAILS = [
    {
        id: 'tx-01',
        time: '2026-06-15T14:30:00Z',
        subject: 'Payment reminder - invoice 8912 overdue - action required',
        sender: 'northwind-payments.example.com',
        recipient: 'support@northwindops.example',
        verdict: 'Phish',
        threat: 'Credential phishing',
        deliveryAction: 'Blocked',
        campaign: 'Invoice lure June'
    },
    {
        id: 'tx-02',
        time: '2026-06-15T14:35:00Z',
        subject: 'URGENT: Invoice 9017 overdue - payment required by end of day',
        sender: 'northwind-payments.example.com',
        recipient: 'account@northwindops.example',
        verdict: 'Phish',
        threat: 'Credential phishing',
        deliveryAction: 'Blocked',
        campaign: 'Invoice lure June'
    },
    {
        id: 'tx-03',
        time: '2026-06-15T14:40:00Z',
        subject: 'Annual report 2025 - review the figures NOW',
        sender: 'northwind-payrolls.example.com',
        recipient: 'hr@northwindops.example',
        verdict: 'Spam',
        threat: 'None',
        deliveryAction: 'Junked',
        campaign: 'Payroll update lure'
    },
    {
        id: 'tx-04',
        time: '2026-06-15T14:45:00Z',
        subject: 'Invoice 9123 overdue - payment essential today',
        sender: 'northwind-payments.example.com',
        recipient: 'finance@northwindops.example',
        verdict: 'Phish',
        threat: 'Credential phishing',
        deliveryAction: 'Blocked',
        campaign: 'Invoice lure June'
    },
    {
        id: 'tx-05',
        time: '2026-06-15T14:50:00Z',
        subject: 'Annual report 2025 - view online NOW for accuracy',
        sender: 'northwind-payrolls.example.com',
        recipient: 'hr@northwindops.example',
        verdict: 'Spam',
        threat: 'None',
        deliveryAction: 'Junked',
        campaign: 'Payroll update lure'
    },
    {
        id: 'tx-06',
        time: '2026-06-16T14:30:00Z',
        subject: 'Upcoming payroll adjustments - update your details now',
        sender: 'northwind-payrolls.example.com',
        recipient: 'hr@northwindops.example',
        verdict: 'Phish',
        threat: 'Financial fraud',
        deliveryAction: 'Blocked',
        campaign: 'Payroll update lure'
    },
    {
        id: 'tx-07',
        time: '2026-06-17T14:35:00Z',
        subject: 'Invoice 9184 overdue - payment required by end of day',
        sender: 'northwind-payments.example.com',
        recipient: 'account@northwindops.example',
        verdict: 'Phish',
        threat: 'Credential phishing',
        deliveryAction: 'Blocked',
        campaign: 'Invoice lure June'
    },
    {
        id: 'tx-08',
        time: '2026-06-17T14:40:00Z',
        subject: 'URGENT: Payment required - today only for invoice 9234',
        sender: 'northwind-payments.example.com',
        recipient: 'account@northwindops.example',
        verdict: 'Phish',
        threat: 'Credential phishing',
        deliveryAction: 'Blocked',
        campaign: 'Invoice lure June'
    },
    {
        id: 'tx-09',
        time: '2026-06-18T14:35:00Z',
        subject: 'URGENT: Payment due - invoice 9378 overdue by tomorrow',
        sender: 'northwind-payments.example.com',
        recipient: 'account@northwindops.example',
        verdict: 'Phish',
        threat: 'Credential phishing',
        deliveryAction: 'Blocked',
        campaign: 'Invoice lure June'
    },
    {
        id: 'tx-10',
        time: '2026-06-18T15:45:00Z',
        subject: 'Annual report 2025 - review now to avoid confusion',
        sender: 'northwind-payrolls.example.com',
        recipient: 'hr@northwindops.example',
        verdict: 'Clean',
        threat: 'None',
        deliveryAction: 'Delivered',
        campaign: 'Payroll update lure'
    },
    {
        id: 'tx-11',
        time: '2026-06-19T15:35:00Z',
        subject: 'Weekly payroll summary - check your earnings',
        sender: 'northwind-payrolls.example.com',
        recipient: 'hr@northwindops.example',
        verdict: 'Clean',
        threat: 'None',
        deliveryAction: 'Delivered',
        campaign: 'Payroll update lure'
    },
    {
        id: 'tx-12',
        time: '2026-06-19T15:40:00Z',
        subject: 'URGENT: Payment required - invoice 9765 overdue by EOD tomorrow',
        sender: 'northwind-payments.example.com',
        recipient: 'account@northwindops.example',
        verdict: 'Phish',
        threat: 'Credential phishing',
        deliveryAction: 'Blocked',
        campaign: 'Invoice lure June'
    },
    {
        id: 'tx-13',
        time: '2026-06-20T15:35:00Z',
        subject: 'Weekly payroll summary - check your earnings and benefits',
        sender: 'northwind-payrolls.example.com',
        recipient: 'hr@northwindops.example',
        verdict: 'Clean',
        threat: 'None',
        deliveryAction: 'Delivered',
        campaign: 'Payroll update lure'
    },
    {
        id: 'tx-14',
        time: '2026-06-22T15:35:00Z',
        subject: 'URGENT: Tax returns - file now online for credit on your 9765 invoice',
        sender: 'northwind-payments.example.com',
        recipient: 'account@northwindops.example',
        verdict: 'Phish',
        threat: 'Financial fraud',
        deliveryAction: 'Blocked',
        campaign: 'Invoice lure June'
    },
    {
        id: 'tx-15',
        time: '2026-06-23T15:40:00Z',
        subject: 'URGENT: Tax returns - file now online for credit on invoice 9765',
        sender: 'northwind-payments.example.com',
        recipient: 'account@northwindops.example',
        verdict: 'Phish',
        threat: 'Financial fraud',
        deliveryAction: 'Blocked',
        campaign: 'Invoice lure June'
    }
];
if (typeof module !== 'undefined') { module.exports = { TX_EMAILS }; }