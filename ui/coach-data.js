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
    summary: 'Find the evidence behind ALT-1001 in the SIEM, then take your verdict back to the module.',
    completionToken: 'm01',
    home: '#/entra/sign-in-logs',
    // The mini-environment. Three pages, nothing else reachable.
    allow: [
      '#/entra/sign-in-logs',
      '#/entra/identity-protection',
      '#/defender/incidents',
    ],
    steps: [
      {
        route: '#/entra/sign-in-logs',
        target: '#sidenav .navitem[data-route="#/entra/sign-in-logs"]',
        title: 'Start where the evidence lives',
        body: 'Your alert claims failed password attempts followed by a success. That is authentication data, so it lives in the sign-in log — under Monitoring & health in the left rail, highlighted for you. Logs sit under monitoring, not under the user list; in a SIEM the first question is always "which log would record this?"',
      },
      {
        route: '#/entra/sign-in-logs',
        target: '#signin-user-filter',
        title: 'Narrow the log to one account',
        body: 'The tenant log mixes every user together. Set the User filter to j.santos@missionnextlabs.example — a burst of failures is invisible in mixed traffic and obvious once you filter.',
        actionLabel: 'Apply the filter for me',
        check: () => sessionStorage.getItem('defender-lab.signin.user') === 'j.santos@missionnextlabs.example',
        do: () => setSigninFilter('user', 'j.santos@missionnextlabs.example'),
      },
      {
        route: '#/entra/sign-in-logs',
        target: '.signin-row.is-fail',
        title: 'Fact 1 — eight failures, one source',
        body: 'Eight Failure rows between 09:02 and 09:08, all error 50126 (invalid username or password), all from 185.220.101.24. Repetition from one IP against one account is the password-guessing pattern the rule detected.',
      },
      {
        route: '#/entra/sign-in-logs',
        target: '.signin-row[data-signin-id="SL-019"]',
        title: 'Fact 2 — the ninth attempt succeeded',
        body: 'At 09:09:41 the same IP got a Success. This is the fact that changes everything: a blocked attempt is a prevented attack, a successful one is an intrusion. Always check whether access was actually obtained.',
      },
      {
        route: '#/entra/sign-in-logs',
        target: '#panel-technique .entra-kv',
        title: 'Fact 3 — the context is wrong',
        body: 'Open the successful sign-in. The details pane splits the evidence the way a real console does, and each tab answers a different question: Basic info shows the risk and the previous sign-in from Berlin on a managed laptop 28 minutes earlier, Location shows Bucharest, Device info shows an unregistered device, and Authentication details shows a password with no second factor. Same account, incompatible context.',
        actionLabel: 'Open the successful sign-in',
        do: () => setSigninDetailTab('SL-019', 'basic'),
      },
      {
        route: '#/entra/identity-protection',
        target: '.card.card-body .grid',
        title: 'Why the platform flagged it',
        body: 'Identity Protection scored that sign-in as High risk — unfamiliar location plus unfamiliar device. Note the distinction here: sign-in risk is about one authentication request, user risk is about the account itself. A confirmed unauthorized sign-in raises both.',
      },
      {
        route: '#/defender/incidents',
        target: '.grid tbody tr[data-incident-id="INC-1070"]',
        title: 'Fact 4 — the account owner denies it',
        body: 'Open INC-1070. The incident record carries the service desk callback: the user was reached on their registered phone number and confirms they did not attempt these sign-ins. That is independent confirmation, not an assumption.',
        actionLabel: 'Open INC-1070',
        do: () => openIncident('INC-1070'),
      },
      {
        route: '#/defender/incidents',
        target: null,
        title: 'You have all four facts',
        body: 'Access succeeded, the context is unfamiliar, the platform scored it High risk, and the owner denies the activity. That is a confirmed unauthorized access incident, not a suspicious-but-unproven alert. Go back to Module 1 and record your verdict, priority, and case note.',
        finish: { label: 'Back to Module 1' },
      },
    ],
  },
];
