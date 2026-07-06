// nav: Email & collaboration | Threat explorer | 📧
VIEWS['defender/threat-explorer'] = () => `
  <div class="page-header">
    <div>
      <div class="breadcrumb">Email & collaboration › <strong>Explorer</strong></div>
      <h1>Threat explorer</h1>
      <div class="page-subtitle">Explore and manage threats across malicious emails.</div>
    </div>
    <div class="page-actions">
      <a class="btn btn-secondary" href="#/defender/email-collab">Email & collaboration</a>
      <button class="btn btn-primary" onclick="toast('Selected messages queued for remediation (soft delete) — fictional.')">Remediate</button>
    </div>
  </div>

  <div class="grid">
    <div class="kpi"><div class="kpi-value">5</div><div class="kpi-label">Phish count</div></div> 
    <div class="kpi"><div class="kpi-value">3</div><div class="kpi-label">Malware count</div></div>
    <div class="kpi"><div class="kpi-value">7</div><div class="kpi-label">ZAP removed count</div></div> 
    <div class="kpi">
      <span class="chip-link" href="#/defender/email-collab/threat-explorer/campaigns"></span>
      <span class="badge badge-pill badge-secondary">Campaigns = 2</span> 
    </div> 
  </div>

  <table class="grid">
    <thead><tr><th>Time</th><th>Subject</th><th>Sender</th><th>Recipient</th><th>Verdict</th><th>Threat</th><th>Delivery action</th><th>Campaign</th></tr></thead>
    <tbody>
      ${TX_EMAILS.map((e) => `
        <tr>
          <td>${esc(fmtTime(e.time))}</td>
          <td>${esc(e.subject)}</td>
          <td>${esc(e.sender)}</td>
          <td>${esc(e.recipient)}</td>
          <td class="${e.verdict !== 'Clean' ? (e.verdict === 'Phish' || e.verdict === 'Malware' ? 'text-danger' : '') : ''}">${esc(cap(e.verdict))}</td>
          <td>${esc(e.threat)}</td>
          <td class="${e.deliveryAction === 'Delivered' ? 'text-warning' : ''}">${esc(e.deliveryAction)}</td>
          <td><span class="badge badge-${['Invoice lure June', 'Payroll update lure'].includes(esc(e.campaign)) ? (cap(cap(e.campaign))) : 'secondary'}">${esc(e.campaign === 'None' ? '—' : e.campaign)}</span></td>
        </tr>`).join('')}
      </tbody>
  </table>

  <div class="card card-body">
    Using the explorer, learners can pivot by verdict and campaign to understand patterns. Phish and malware are flagged with high severity. Remediation queues soft delete for phished emails that have been delivered or were already zapped.
    Campaign views reveal how lures are used in waves to target organizations.
  </div>`