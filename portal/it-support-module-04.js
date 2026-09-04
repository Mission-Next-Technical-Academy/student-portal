/* Module 04 — IT Help Desk & Career Accelerator ('it-support').
 * Lesson content only; uses the shared simple-module template in
 * it-support-shared.js (itsSimpleModuleView) since this module's lab has
 * not been spec'd or built yet — see data.js's compliance.sourceNotes on
 * the it-support program entry. Content sourced from
 * Module_4_Student_Content.docx.
 */

const ITS04_LESSONS = [
  {
    id: 'its-04-lesson-01', number: '4.1', icon: 'ri-router-line',
    title: 'IP Addressing, Subnets & How Networks Talk', minutes: 120,
    learn: [
      'What an IP address, subnet, gateway, and DNS server actually do, at the level a technician needs',
      'How to read a device\'s wired vs. Wi-Fi adapter status',
      'Why a "connected" Wi-Fi icon doesn\'t always mean a working connection',
    ],
    topics: [
      { heading: 'The Four Numbers That Matter', body: 'Every device needs its own IP address (identity), a subnet (which devices count as "nearby"), a default gateway (the router out to everything else), and a DNS server (translates names into addresses). If any one is missing or wrong, something breaks — and which one usually points straight at the fix.' },
      { heading: 'Wired vs. Wi-Fi Adapter State', body: 'Windows can expose Ethernet, Wi-Fi, VPN, and virtual adapters at once, each with its own independent connection state. A user can be "connected" on one adapter while another is disconnected or misconfigured — identify which interface is actually carrying the affected connection first.' },
      { heading: 'Why "Connected" Doesn\'t Always Mean "Working"', body: 'Windows can show a connection as active even when it can\'t actually reach the internet — connected to the local network isn\'t the same as connected to everything beyond it. That gap is exactly what the next lesson\'s diagnostic commands are built to isolate.' },
    ],
    practice: [
      'On your lab VM, open Settings > Network & Internet and note your current adapter\'s connection status, and whether you\'re connected via Wi-Fi or Ethernet (or both).',
    ],
    comingUp: 'You\'ll be handed a machine that shows "connected" but can\'t reach anything, and work out why.',
  },
  {
    id: 'its-04-lesson-02', number: '4.2', icon: 'ri-terminal-line',
    title: 'Diagnostic Commands: ipconfig, ping, tracert & nslookup', minutes: 120,
    learn: [
      'How to read the output of ipconfig /all',
      'How to use ping to confirm whether a device can reach another one',
      'How to use tracert to identify where along a network path a problem may be occurring',
      'How to use nslookup to test whether DNS itself is the problem',
    ],
    topics: [
      { heading: 'ipconfig /all — Your Starting Point', body: 'Shows a device\'s IP address, subnet mask, default gateway, and DNS servers all at once — always the first move on a connectivity ticket.' },
      { heading: 'ping — Can You Reach It At All?', body: 'Pinging the default gateway tests reach to the local network; pinging a known external address (like 8.8.8.8) tests reach to the wider internet. No reply points to a connection problem; a reply from the gateway but not beyond it points further out.' },
      { heading: 'tracert — Where Does It Actually Break?', body: 'Shows the stops a connection makes on the way to a destination, helping distinguish "something on our network" from "something out on the internet." It\'s evidence to reason from, not a guarantee — some hops don\'t respond to probes at all.' },
      { heading: 'nslookup — Is This a DNS Problem?', body: 'Asks a DNS server to translate a name into an address. If ping works by raw IP but a website won\'t load by name, that\'s a strong DNS signal, and nslookup confirms it.' },
    ],
    practice: [
      'On your lab VM, run ipconfig /all, ping your default gateway, ping 8.8.8.8, and run nslookup google.com. Record all four results.',
    ],
    comingUp: 'You\'ll use these four commands together to diagnose a connectivity problem you haven\'t been told the cause of.',
  },
  {
    id: 'its-04-lesson-03', number: '4.3', icon: 'ri-wifi-off-line',
    title: 'DHCP, DNS & Recognizing APIPA', minutes: 120,
    learn: [
      'What DHCP does and why almost every device relies on it',
      'What DNS does, and how a DNS failure looks different from a connection failure',
      'How to instantly recognize an APIPA address and what it means',
    ],
    topics: [
      { heading: 'DHCP — How a Device Gets Its Address', body: 'Most devices ask a DHCP server for an address automatically. The safe first move is reconnecting or renewing the client-side configuration — restarting shared network equipment is a different, higher-impact action reserved for when evidence and authorization both point there.' },
      { heading: 'DNS — Names to Addresses', body: 'A DNS problem looks specific: the internet connection works, but named addresses won\'t resolve while a raw IP address still works fine.' },
      { heading: 'APIPA — The Address That Tells You DHCP Failed', body: 'When a device can\'t reach a DHCP server, Windows self-assigns a fallback 169.254.x.x address. It doesn\'t say why on its own — cable, switch port, Wi-Fi, or DHCP server could all produce it — but recognizing it on sight tells you exactly which troubleshooting path to start down.' },
      { heading: 'Local vs. Internet vs. DNS Failure', body: 'A local failure can\'t reach its own gateway. An internet failure reaches the gateway but nothing beyond. A DNS failure works by IP address but nothing works by name.' },
    ],
    practice: [
      'Write one sentence each explaining, in plain language a non-technical user would understand, what an APIPA address means and what a DNS failure looks like from the user\'s side.',
    ],
    comingUp: 'You\'ll be handed a device showing a 169.254 address and asked to diagnose and explain the fix.',
  },
  {
    id: 'its-04-lesson-04', number: '4.4', icon: 'ri-chat-smile-2-line',
    title: 'Domain Joining & Explaining Network Issues in Plain Language', minutes: 120,
    learn: [
      'What it means for a computer to "join a domain," and why organizations do it',
      'The basic steps and common failure points of a domain join',
      'How to explain a network problem to a non-technical user clearly and without jargon',
    ],
    topics: [
      { heading: 'What Joining a Domain Actually Does', body: 'Joining a domain connects a computer to a central domain controller that manages logins, security settings, and access across every machine — the difference between an island and a managed network.' },
      { heading: 'Common Domain-Join Failures', body: 'Usually one of: the machine can\'t reach the domain controller (a connectivity problem), DNS isn\'t pointing at the domain\'s own DNS server, or the joining account lacks permission. Recognizing which one just means retracing this module\'s earlier diagnostic steps.' },
      { heading: 'Saying It in Plain Language', body: 'A user doesn\'t need "your DHCP lease expired and you fell back to an APIPA address." They need "your computer temporarily lost its network connection and grabbed a placeholder address — I\'m fixing that now." Translating a correct diagnosis into a calm, plain explanation is its own skill.' },
    ],
    practice: [
      'Take the APIPA scenario from the last lesson and write two versions of the same explanation: one for another technician (technical, precise) and one for the user experiencing it (plain, reassuring, no jargon).',
    ],
    comingUp: 'You\'ll walk through a simulated domain-join failure and explain the resolution to a non-technical user.',
  },
];

function viewItsModuleFour(user, program) {
  return itsSimpleModuleView({
    user, program, moduleKey: 'its-04', moduleNumber: 4, lessons: ITS04_LESSONS,
    lede: 'You\'ve built your lab environment and fixed your first hardware and printer tickets. Now it\'s time for one of the most valuable skills on any help desk: figuring out why something won\'t connect, and explaining it in plain language.',
    labPreview: 'This module\'s guided lab isn\'t built yet — it will hand you a device showing a 169.254 APIPA address and a simulated domain-join failure to diagnose with ipconfig, ping, tracert, and nslookup, then explain in plain language to a non-technical user.',
  });
}

registerModuleLab({ program: 'it-support', moduleNumber: 4, moduleKey: 'its-04', view: viewItsModuleFour });
