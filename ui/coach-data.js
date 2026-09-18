// Module coach scripts — the hand-holding layer for students who have never
// opened a SIEM before.
//
// A coach is a slice of the existing simulator, not a separate app: `allow`
// lists the only routes reachable while it runs, and every step points at a
// real element in a real view. Nothing here duplicates a view; if a step needs
// a page that does not exist yet, build the page, not a coach copy of it.
//
// Step shape:
//   route       hash the step lives on; the coach navigates there if needed
//   title/body  what the student reads
//   target      CSS selector to spotlight (ALL matches are highlighted)
//   actionLabel button text shown before `do` has been run
//   do()        performs the step for the student (a demonstration, not a gate)
//   check()     true when the student has done it themselves; while false the
//               Next button offers `actionLabel` instead of advancing
//   continueLabel explicit label for a reading step's continue button
//   finish      { label, href } shown on the last step

const MODULE_COACHES = [
  {
    id: 'm01-setup',
    module: 1,
    name: 'Set up your SOC workspace',
    role: 'Tier 1 SOC analyst',
    summary: 'Confirm your tenant, check that Azure Activity is connected, then locate the alert queue.',
    completionToken: 'm01-setup',
    home: '#/defender/alerts',
    allow: ['#/defender/alerts', '#/sentinel/data-connectors'],
    steps: [
      {
        route: '#/defender/alerts',
        target: '.topbar .tenant',
        title: 'Confirm your workspace',
        instruction: 'Next Step: confirm you are in the <strong>Mission Next Labs</strong> tenant.',
        body: 'Before working an alert, confirm which workspace you reached. The tenant name in the top bar identifies the environment where you will review security data.',
        continueLabel: 'Confirmed',
      },
      {
        route: '#/sentinel/data-connectors',
        target: 'tr[data-connector="Azure Activity"]',
        require: true,
        title: 'Confirm data is connected',
        instruction: 'Next Step: confirm the <strong>Azure Activity</strong> connector reads <strong>Connected</strong>.',
        body: 'Data is already flowing into this workspace. On a real first day, check what is already ingesting before investigating the alerts it can produce.',
        waitLabel: 'Next Step: Azure Activity is connected',
        nudge: 'Use the navigation to open Data connectors and find Azure Activity.',
        check: () => location.hash === '#/sentinel/data-connectors',
      },
      {
        route: '#/defender/alerts',
        target: 'table.grid',
        require: true,
        title: 'Locate the alert queue',
        instruction: 'Next Step: return to the <strong>Alerts</strong> queue.',
        body: 'This is where cases live — the alert queue, the analyst\'s inbox. You now know where to confirm the workspace, verify incoming data, and begin a case.',
        waitLabel: 'Next Step: Alert queue located',
        nudge: 'Use the navigation to return to Alerts.',
        check: () => location.hash === '#/defender/alerts',
        finish: { label: 'Start your first case' },
      },
    ],
  },
  {
    id: 'm01',
    module: 1,
    name: 'Your first SOC alert',
    role: 'Tier 1 SOC analyst',
    summary: 'Open the alert, find the evidence behind it in the sign-in log, then take your verdict back to the module.',
    completionToken: 'm01',
    home: '#/defender/alerts',
    resetState: () => {
      sessionStorage.removeItem('defender-lab.signin.user');
      sessionStorage.removeItem('defender-lab.signin.result');
      sessionStorage.removeItem('defender-lab.signin.logtype');
    },
    // The mini-environment. Two pages, nothing else reachable. Module 1 is the
    // student's first hour: pivoting across three consoles to collect four
    // facts is the capstone's shape, not a first lesson's. Every fact the
    // verdict depends on is readable in the sign-in log; the account owner's
    // denial is handed to the student in the module's own evidence panel, the
    // way a service-desk callback would reach a Tier 1 analyst.
    allow: ['#/defender/alerts', '#/entra/sign-in-logs'],
    steps: [
      {
        route: '#/defender/alerts',
        target: 'tr[data-alert-id="A1701"]',
        require: true,
        title: 'Start at the alert',
        instruction: 'Next Step: open <strong>Successful sign-in after repeated failures</strong> on j.santos.',
        body: 'This is the alert queue — the analyst\'s inbox. Your case is <strong>Successful sign-in after repeated failures</strong> on <strong>j.santos@missionnextlabs.example</strong>. Open it. Everything else is dimmed because this lab is one case; in a real queue you would pick by severity, age, and asset.',
        waitLabel: 'Next Step: Opened the alert',
        nudge: 'Click the alert row to open it.',
        check: () => {
          const panel = document.getElementById('panel-alert');
          return Boolean(panel && !panel.classList.contains('hidden'));
        },
      },
      {
        route: '#/defender/alerts',
        // The pivot lives in the alert pane, not the left rail: the rail on this
        // page belongs to Defender, and the sign-in log is an identity surface.
        // Following evidence from an alert into the log that recorded it is the
        // move itself, so the student makes it.
        target: '#panel-alert [data-pivot="signin-logs"]',
        require: true,
        title: 'Read the claim, then go to the log',
        instruction: 'Next Step: choose <strong>Investigate sign-ins for this account</strong>.',
        body: 'The pane claims eight failures then a success, one source address, and an unmanaged browser. That is a lead, not proof the session was unauthorized. Note the Medium severity, then follow the pivot to the <strong>sign-in log</strong> that recorded the activity. In a SIEM the first question is always "which log would record this?"',
        waitLabel: 'Next Step: In the sign-in log',
        nudge: 'Use the button in the alert pane to open the sign-in log.',
        check: () => location.hash === '#/entra/sign-in-logs',
      },
      {
        route: '#/entra/sign-in-logs',
        target: '#signin-user-filter',
        require: true,
        title: 'Narrow the log to one account',
        instruction: 'Next Step: set the <strong>User</strong> filter to j.santos@missionnextlabs.example.',
        // No `do` here on purpose: filtering a log is the one motion every SOC
        // analyst repeats all day, so the student performs it. The coach
        // spotlights the control and waits instead of doing it for them.
        body: 'The tenant log mixes every user together. Use the <strong>User</strong> filter and choose <strong>j.santos@missionnextlabs.example</strong>. A burst of failures is invisible in mixed traffic and obvious once you filter — so make the log show you one account.',
        waitLabel: 'Next Step: Filter set',
        nudge: 'Open the User dropdown and pick j.santos@missionnextlabs.example.',
        check: () => sessionStorage.getItem('defender-lab.signin.user') === 'j.santos@missionnextlabs.example',
      },
      {
        route: '#/entra/sign-in-logs',
        target: '.signin-row[data-signin-id="SL-019"]',
        require: true,
        waitLabel: 'Next Step: Find the success',
        nudge: 'Read the failure rows, then click the 09:09:41 Success row.',
        check: () => {
          const title = document.getElementById('technique-title');
          const panel = document.getElementById('panel-technique');
          return Boolean(panel && !panel.classList.contains('hidden')
            && title && title.textContent.includes('SL-019'));
        },
        title: 'Read the pattern, then open the success',
        instruction: 'Next Step: read the eight Failure rows, then open the 09:09:41 <strong>Success</strong>.',
        body: 'The eight failures from 09:02–09:08 all came from 185.220.101.24. At 09:09:41 the same IP succeeded. That change—from blocked attempts to obtained access—is the critical fact. Open the success to inspect whether its context fits the account owner.',
      },
      {
        route: '#/entra/sign-in-logs',
        target: null,
        title: 'You have the facts',
        instruction: 'Next Step: return to Module 1 and record your verdict, priority, and handoff note.',
        body: 'Three facts, one log: access succeeded; Location is <strong>Bucharest, RO</strong>; Device info shows <strong>Managed: No</strong> and <strong>Join type: Not registered</strong>; and Basic info shows <strong>Sign-in risk: High</strong>. The fourth fact — the account owner reached by phone, denying the activity — is waiting for you in the module, the way a service-desk callback would reach you. Together that is a confirmed unauthorized access incident, not a suspicious-but-unproven alert. Go back to Module 1 and record your verdict, priority, and case note.',
        finish: { label: 'Back to Module 1' },
      },
    ],
  },
  {
    id: 'm01-orientation',
    module: 1,
    tour: true,
    name: 'SOC workspace orientation',
    role: 'Tier 1 SOC analyst',
    summary: 'Your first day: rules of engagement and scope, then a quick look at the tools you will use in both Module 1 labs.',
    completionToken: 'm01-orientation',
    home: '#/defender/alerts',
    allow: ['#/defender/alerts', '#/entra/sign-in-logs', '#/sentinel/incidents', '#/defender/incident'],
    steps: [
      // Three framing-only steps, no target: they set expectations before any
      // tool is on screen, the way a supervisor briefs a new hire before
      // walking them to a desk. They apply to the whole module — both the
      // guided walkthrough and the NST-2407 case below draw on them.
      {
        route: '#/defender/alerts',
        title: 'Your first day',
        body: 'Welcome to Mission Next Labs. You are a Tier 1 SOC analyst starting your first shift. Before you touch a queue, every new analyst gets the same three things from their supervisor: what you are allowed to do, what you are not, and exactly what you have been assigned to look at today.',
        continueLabel: 'Ready',
      },
      {
        route: '#/defender/alerts',
        title: 'Rules of engagement',
        body: 'As a Tier 1 analyst you investigate and recommend — you do not perform containment, isolation, or account actions yourself. Every response action needs an authorized responder. If a screen offers a button that isolates a device or revokes a session, that is not yours to click; document the evidence and escalate instead.',
        continueLabel: 'Understood',
      },
      {
        route: '#/defender/alerts',
        title: 'Your assigned scope',
        body: 'Every case comes with a stated scope: which identities, devices, and systems the evidence actually supports as affected — and just as important, what it does not. Stay inside that boundary in your notes and your verdict. Claiming a wider compromise than the evidence supports is as much of a mistake as missing a real one.',
        continueLabel: 'Got it',
      },
      {
        route: '#/defender/alerts',
        target: 'table.grid',
        title: 'The alert queue',
        body: 'This is the alert queue — the analyst\'s inbox. Each row is one alert waiting for review.',
        continueLabel: 'Got it',
      },
      {
        route: '#/defender/alerts',
        target: '.sev',
        title: 'Severity',
        body: 'The Severity column shows how urgent Microsoft\'s detection thinks each alert is. It helps an analyst decide which alerts need attention first.',
        continueLabel: 'Got it',
      },
      {
        route: '#/defender/alerts',
        target: '.filterbar',
        title: 'Queue filters',
        body: 'These chips narrow the queue by severity, status, detection source, and time. A real SOC queue can hold hundreds of alerts, so filters help an analyst focus the work in front of them.',
        continueLabel: 'Got it',
      },
      {
        route: '#/entra/sign-in-logs',
        target: '#signin-user-filter',
        title: 'User filter',
        body: 'The User filter narrows a shared tenant log to one identity. That makes one person\'s authentication activity easier to examine among everyone else\'s.',
        continueLabel: 'Got it',
      },
      {
        route: '#/entra/sign-in-logs',
        target: '.signin-grid',
        title: 'The sign-in log',
        body: 'This is the tenant-wide sign-in log: one row per authentication attempt. The useful columns include result, IP address, location, device, and sign-in risk. That covers the guided walkthrough\'s tools — next is the second case, the multi-day investigation.',
        continueLabel: 'Continue',
      },
      // The second Module 1 lab: NST-2407, worked in the SIEM & SOAR /
      // XDR Security surface instead of Defender alerts + the sign-in log.
      {
        route: '#/sentinel/incidents',
        target: 'table.grid',
        title: 'Your second case: a multi-day investigation',
        body: 'This is the incidents queue for your second Module 1 case — a correlated, multi-day investigation instead of one alert. Real incidents are rarely one clean signal; you will need to connect identity, endpoint, and proxy evidence yourself.',
        continueLabel: 'Got it',
      },
      {
        route: '#/defender/incident',
        target: '#m01-assigned-case-callout',
        title: 'This one is yours',
        body: 'This banner marks your assigned case. Its scope is stated for you here too — hold to exactly what the evidence supports before you decide anything.',
        continueLabel: 'Got it',
      },
      {
        route: '#/defender/incident',
        target: '#m01-escalate-btn',
        title: 'The response handoff',
        body: 'This is the handoff point to response after the evidence has been correlated and a decision reached. It records a request for an authorized responder; containment, isolation, and account actions remain outside the Tier 1 analyst role.',
        continueLabel: 'Got it',
      },
      {
        route: '#/defender/incident',
        target: '#mnt-submit-btn',
        title: 'The module submission point',
        body: 'This floating button follows the case across the console — the queue, assets, hunting, wherever the evidence leads. It opens the module-level submission point, where the recorded performance goes to your supervisor for approval or feedback. The tour remains available from the corner icon beside it.',
        finish: { label: 'Start your shift' },
      },
    ],
  },
];
