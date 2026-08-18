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
//   finish      { label, href } shown on the last step

const MODULE_COACHES = [
  {
    id: 'm01',
    module: 1,
    name: 'Your first SOC alert',
    role: 'Tier 1 SOC analyst',
    summary: 'Open the alert, find the evidence behind it in the sign-in log, then take your verdict back to the module.',
    completionToken: 'm01',
    home: '#/defender/alerts',
    // The mini-environment. ONE page, nothing else reachable. Module 1 is the
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
        instruction: 'Open the alert <strong>Successful sign-in after repeated failures</strong> on j.santos.',
        body: 'This is the alert queue — the analyst\'s inbox. Your case is <strong>Successful sign-in after repeated failures</strong> on <strong>j.santos@missionnextlabs.example</strong>. Open it. Everything else is dimmed because this lab is one case; in a real queue you would pick by severity, age, and asset.',
        waitLabel: 'I have opened the alert',
        nudge: 'Click the highlighted alert row to open it.',
        check: () => {
          const panel = document.getElementById('panel-alert');
          return Boolean(panel && !panel.classList.contains('hidden'));
        },
      },
      {
        route: '#/defender/alerts',
        target: '#panel-alert',
        title: 'Read what the alert claims — and what it does not',
        instruction: 'Read the alert pane: it claims eight failures then a success — a lead, not proof.',
        body: 'The detail pane gives you the rule\'s claim: eight failures then a success, one source address, an unmanaged browser. Notice what it is <em>not</em>: proof that the session was unauthorized. A detection is a lead. Note the severity the product assigned — Medium — and treat it as a starting label, not your verdict.',
      },
      {
        route: '#/defender/alerts',
        // The pivot lives in the alert pane, not the left rail: the rail on this
        // page belongs to Defender, and the sign-in log is an identity surface.
        // Following evidence from an alert into the log that recorded it is the
        // move itself, so the student makes it.
        target: '#panel-alert [data-pivot="signin-logs"]',
        require: true,
        title: 'Go to the log that recorded it',
        instruction: 'In the alert pane, choose <strong>Investigate sign-ins for this account</strong>.',
        body: 'The alert is a summary; the log is the record. Authentication data lives in the <strong>sign-in log</strong>, and the alert pane offers the pivot straight to it — highlighted for you. Take it. In a SIEM the first question is always "which log would record this?"',
        waitLabel: 'I am in the sign-in log',
        nudge: 'Use the highlighted "Investigate sign-ins for this account" button in the alert pane.',
        check: () => location.hash === '#/entra/sign-in-logs',
      },
      {
        route: '#/entra/sign-in-logs',
        target: '#signin-user-filter',
        require: true,
        title: 'Narrow the log to one account',
        instruction: 'Set the <strong>User</strong> filter to j.santos@missionnextlabs.example.',
        // No `do` here on purpose: filtering a log is the one motion every SOC
        // analyst repeats all day, so the student performs it. The coach
        // spotlights the control and waits instead of doing it for them.
        body: 'The tenant log mixes every user together. Use the highlighted <strong>User</strong> filter and choose <strong>j.santos@missionnextlabs.example</strong>. A burst of failures is invisible in mixed traffic and obvious once you filter — so make the log show you one account.',
        waitLabel: 'I have set the filter',
        nudge: 'Not filtered yet — open the highlighted User dropdown and pick j.santos@missionnextlabs.example.',
        check: () => sessionStorage.getItem('defender-lab.signin.user') === 'j.santos@missionnextlabs.example',
      },
      {
        route: '#/entra/sign-in-logs',
        target: '.signin-row.is-fail',
        title: 'Fact 1 — eight failures, one source',
        instruction: 'Read the eight red Failure rows: 09:02–09:08, all from 185.220.101.24.',
        body: 'Eight Failure rows between 09:02 and 09:08, all error 50126 (invalid username or password), all from 185.220.101.24. Repetition from one IP against one account is the password-guessing pattern the rule detected.',
      },
      {
        route: '#/entra/sign-in-logs',
        target: '.signin-row[data-signin-id="SL-019"]',
        title: 'Fact 2 — the ninth attempt succeeded',
        instruction: 'Find the 09:09:41 row — the attempt that returned <strong>Success</strong>.',
        body: 'At 09:09:41 the same IP got a Success. This is the fact that changes everything: a blocked attempt is a prevented attack, a successful one is an intrusion. Always check whether access was actually obtained.',
      },
      {
        route: '#/entra/sign-in-logs',
        target: '.signin-row[data-signin-id="SL-019"], #panel-technique',
        require: true,
        waitLabel: 'I have opened it',
        nudge: 'Click the highlighted 09:09:41 Success row to open its detail pane.',
        check: () => {
          const title = document.getElementById('technique-title');
          const panel = document.getElementById('panel-technique');
          return Boolean(panel && !panel.classList.contains('hidden')
            && title && title.textContent.includes('SL-019'));
        },
        title: 'Fact 3 — the context is wrong',
        instruction: 'Open that successful sign-in and read its Location, Device info, and risk.',
        body: 'Open the successful sign-in yourself — the 09:09:41 Success row. The details pane splits the evidence the way a real console does, and each tab answers a different question: Basic info shows the risk and the previous sign-in from Berlin on a managed laptop 28 minutes earlier, Location shows Bucharest, Device info shows an unregistered device, and Authentication details shows a password with no second factor. Same account, incompatible context. Basic info also carries the platform\'s own call: it scored this sign-in High risk on exactly that combination — unfamiliar location plus unfamiliar device.',
      },
      {
        route: '#/entra/sign-in-logs',
        target: null,
        title: 'You have the facts',
        instruction: 'You have the evidence. Take it back to Module 1 and record your verdict.',
        body: 'Three facts, one log: access succeeded, the context is unfamiliar, and the platform scored the sign-in High risk. The fourth fact — the account owner reached by phone, denying the activity — is waiting for you in the module, the way a service-desk callback would reach you. Together that is a confirmed unauthorized access incident, not a suspicious-but-unproven alert. Go back to Module 1 and record your verdict, priority, and case note.',
        finish: { label: 'Back to Module 1' },
      },
    ],
  },
];
