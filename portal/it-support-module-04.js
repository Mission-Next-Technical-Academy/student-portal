/* Module 9 (key its-04) — IT Help Desk & Career Accelerator ('it-support').
 * Fictional org, tickets, and policy text; no real systems are involved.
 *
 * Its own course page, on Module 8's page pattern. This file holds the Learn
 * It content and the code that draws it:
 *   - Four filed lessons (9.1 to 9.4) shown as five reading cards. Lesson 9.1
 *     is Reading 1 and Reading 2 (one filed entry, its-04-lesson-01, so the two
 *     cards share its minutes); Lessons 9.2, 9.3 and 9.4 are Readings 3, 4 and
 *     5. Each reading has its tables and a diagram.
 *   - The "Name it" card sort, inside Reading 1: twelve cards, each put in one
 *     of three boxes. A wrong box says why and the student tries again. No
 *     score.
 *   - Two knowledge checks: the Learn It check (six program questions, after
 *     Reading 3) and the A+ check (ten questions, after Reading 5). Each has a
 *     "why" line for a right answer and an "if wrong" line for each wrong one.
 *     The choices are shuffled per student and per attempt.
 *   - Three lab cards: Lab 9.1 (the guided lab, coach hd-m04), Lab 9.2 (the
 *     practice tickets) and the Prove It.
 *
 * Block types (its04Blocks): h (sub-heading), h5 (a smaller heading under
 * it), p, ul, ol, note ({ title, text }), table ({ caption, head, rows }),
 * diagram (a key of ITS04_DIAGRAMS) and cardsort (the card sort). In p, ul,
 * ol, table and check text, **...** is emphasized and `...` is inline code.
 * bin/its-curriculum-check.js reads each filed lesson's title and minutes from
 * this file: the title must match portal/data.js, and the minutes are the
 * filed lesson minutes plus that lesson's share of the lab (the checker's
 * mapping). A lesson entry keeps its title and its minutes on one line, and
 * nothing else here may put a minutes value right after a title.
 */

const ITS04_LESSONS = [
  {
    id: 'its-04-lesson-01', number: '9.1',
    title: 'IP Addressing, Subnets & How Networks Talk', minutes: 120,
    readings: [
      {
        number: 1, icon: 'ri-router-line', heading: 'How a network fits together', time: 'about 12 minutes',
        learn: [
          'Follow the path from a PC to the internet, and say which part is yours and which is Network Operations’',
          'Name the cable, connector and internet connection types you will meet (Tables 2 and 4)',
          'Say what each network tool is for (Table 3)',
          'Tell a LAN, a WLAN, a WAN and the other network sizes apart (Table 4)',
        ],
        blocks: [
          { h: 'Reading 1 · How a network fits together' },
          { p: 'A network is a chain, and a “can’t connect” ticket means one link in the chain is broken. Your job is to find which one, and whose it is.' },
          { p: 'It starts at the PC’s **network interface card (NIC)**, the port the cable plugs into. Every NIC has a **MAC address**, a hardware ID you’ll see as “Physical Address” in `ipconfig /all`. The cable runs to a **wall jack**. Behind the wall, every jack is wired to a numbered port on a **patch panel** in the floor’s network closet, and a short cable patches that port into a **switch**. A switch connects the devices in one network. An **unmanaged** switch just works when you plug it in; a **managed** switch can be configured port by port, including which VLAN a port is on (Module 07). Many switches also send power down the cable, called **Power over Ethernet (PoE)**, to run access points, desk phones and cameras; where a switch can’t, a small **PoE injector** does. An **access point (AP)** adds Wi-Fi to the wired network.' },
          { p: 'The **router** connects different networks and sends traffic out to the internet; its address on your network is the **default gateway**. Next to it, a **firewall** allows or blocks traffic by rules. The internet arrives through the provider’s box: a **cable modem** (coax), a **DSL** modem (the phone line), or an **optical network terminal (ONT)** for fiber. Northstar’s main circuit is fiber, with a **cellular** (5G) backup that has a monthly data cap. Other connection types you’ll see on the exam are **satellite** (a dish; high latency) and a **WISP** (a fixed antenna aimed at a provider’s tower). Network sizes have names too: a **PAN** around one person, a **LAN** in one building, a **WLAN** over Wi-Fi, a **MAN** across a city, a **WAN** between distant sites, and a **SAN**, a separate network just for server storage (Table 4).' },
          { p: 'Cables matter at both ends of a ticket. Office network cable is twisted pair with **RJ45** plugs: **Cat 5e** and **Cat 6** carry 1 Gbps to 100 m, and **Cat 6a** carries 10 Gbps to 100 m. **Shielded (STP)** cable resists electrical noise, **direct-burial** cable goes underground, and **plenum-rated** cable is required in the air space above ceilings. **Fiber** uses light (single-mode for long runs, multimode inside buildings) with **LC**, **SC** or **ST** connectors; **coax** uses the screw-on **F-type**; a phone line uses the smaller **RJ11**. At the desk you’ll meet USB (2.0, 3.0, USB-C), Thunderbolt, HDMI, DisplayPort, DVI and VGA, which you first saw on the docks and monitors earlier in the course (Table 2).' },
          { p: 'Physical work belongs to **Network Operations**. They use a **cable stripper**, a **crimper** and a **punchdown tool** to build cables and jacks, a **cable tester** to check every wire, a **toner probe** to find which cable goes where, a **loopback plug** to test a port, a **Wi-Fi analyzer** to see the airwaves, and a **network tap** to copy traffic. You’ll read their results as evidence and know what each tool is for (Table 3). Your side of the chain is the PC, its cable, the jack it plugs into, and its settings.' },
          { table: {
            caption: 'Table 1 · The boxes on the way out',
            head: ['Device', 'What it does', 'What a Tier 1 technician notices'],
            rows: [
              ['Network interface card (NIC)','The port in the PC; its **MAC address** is its hardware ID (`ipconfig /all` › Physical Address)', 'The link light next to the port is on, or it isn’t'],
              ['Wall jack and patch panel','Each jack is wired to a numbered port on a **patch panel** in the floor’s network closet, then patched to a switch', 'A jack that was never patched has no link at all'],
              ['Switch','Connects devices in one network. **Unmanaged**: plug and play. **Managed**: configurable ports, VLANs and port settings', 'A port that keeps going up and down is “port flapping”: Network Operations’'],
              ['PoE (Power over Ethernet)','A **PoE switch** or a **PoE injector** sends power down the network cable (standards 802.3af, at and bt) to access points, desk phones and cameras', 'If a desk phone and its AP both go dark, think power on the switch, not the phone'],
              ['Access point (AP)','Adds Wi-Fi to the wired network', 'One room’s Wi-Fi down for everyone is the AP: Network Operations’'],
              ['Router','Connects different networks and sends traffic out to the internet', 'The **default gateway** in `ipconfig` is the router’s address on your network'],
              ['Firewall','Allows or blocks traffic by rules', '“Works inside, blocked from outside” is usually a firewall rule, never something Tier 1 changes'],
              ['Cable modem · DSL modem · ONT','Where the internet provider’s line comes in: coax (cable), the phone line (DSL), or fiber (an **optical network terminal**)', 'Lights on the provider’s box are the provider’s or Network Operations’'],
            ],
          } },
          { table: {
            caption: 'Table 2 · Cables and connectors',
            head: ['Kind', 'Cables', 'Connectors', 'Know this'],
            rows: [
              ['Network, copper','Twisted pair: **Cat 5e**, **Cat 6**, **Cat 6a**; **UTP** (unshielded) and **STP** (shielded, for noisy places); **direct burial** (outdoor, underground); **plenum-rated** jackets for the air space above ceilings', '**RJ45** (8 pins), wired to **T568A** or **T568B**; same standard at both ends', 'Cat 5e and Cat 6 carry 1 Gbps to 100 m; Cat 6a carries 10 Gbps to 100 m'],
              ['Network, coax','**Coaxial** (RG6)', '**F-type** (screw-on)', 'Cable internet and TV'],
              ['Network, fiber','**Single-mode** (long distance) and **multimode** (inside buildings)', '**LC** (small, square, push-in), **SC** (square, push-pull), **ST** (round, twist-lock)', 'Light, not electricity: immune to electrical interference'],
              ['Phone','Phone line', '**RJ11** (smaller than RJ45, 2–4 wires)', 'DSL uses it'],
              ['In the closet','Cable ends terminated on a **punchdown block**', '', 'Network Operations’ work'],
              ['Peripheral','**USB 2.0** (480 Mbps), **USB 3.0** (5 Gbps), **Thunderbolt** (fast, carries video and power), **serial** (old equipment)', '**USB-C**, **MicroUSB**, **MiniUSB**, **Lightning** (Apple phones), **DB9** (serial)', 'Not every USB-C port carries video'],
              ['Video','**HDMI**, **DisplayPort**, **USB-C**, **DVI**, **VGA** (old, analog)', 'Same names as the cables', 'The docks and monitors you met earlier use these'],
              ['Drives and power','**SATA** (inside the PC), **eSATA** (external)', '**Molex** (an older 4-pin power plug)', 'Inside-the-case work is Desktop Support’s'],
              ['Adapters','USB-C to HDMI, USB to Ethernet, DisplayPort to HDMI', '', 'Ask which ports a laptop really has before ordering one'],
            ],
          } },
          { table: {
            caption: 'Table 3 · Tools you’ll hear about',
            head: ['Tool', 'What it’s for', 'Who uses it at Northstar'],
            rows: [
              ['**Cable stripper**', 'Removes a cable’s outer jacket', 'Network Operations'],
              ['**Crimper**', 'Fixes an RJ45 connector onto a cable’s end', 'Network Operations'],
              ['**Punchdown tool**', 'Presses wires into a patch panel or a wall jack’s back', 'Network Operations'],
              ['**Cable tester**', 'Checks every wire is connected, in the right order', 'Network Operations; the result comes to you as evidence'],
              ['**Toner probe**', 'Finds which cable in the closet goes to which wall jack', 'Network Operations'],
              ['**Loopback plug**', 'Tests that a port or NIC can send and receive', 'Desktop Support'],
              ['**Wi-Fi analyzer**', 'Shows nearby networks, their channels and their signal', 'Network Operations; the Wi-Fi details screen shows you the same facts for one laptop'],
              ['**Network tap**', 'Copies traffic off a cable for analysis', 'Network Operations and Security'],
            ],
          } },
          { table: {
            caption: 'Table 4 · Internet connections',
            head: ['Internet connection', 'What it is', 'Watch for'],
            rows: [
              ['**Fiber**', 'Light through glass to the building', 'Fastest; Northstar’s primary circuit'],
              ['**Cable**', 'Coax from the cable company', 'Fast; shared with the neighbourhood'],
              ['**DSL**', 'Over the phone line', 'Slower; speed falls with distance'],
              ['**Cellular** (4G, 5G)', 'The mobile network', 'A backup or a hotspot; often has a **data cap**'],
              ['**Satellite**', 'A dish to a satellite', 'High **latency**: calls lag'],
              ['**WISP** (wireless internet service provider)', 'A fixed outdoor antenna aimed at the provider’s tower', 'Rural sites'],
            ],
          } },
          { table: {
            caption: 'Table 4 · Network types',
            head: ['Network type', 'Size', 'Example at Northstar'],
            rows: [
              ['**PAN** (personal area network)', 'Around one person', 'A Bluetooth headset (Module 08)'],
              ['**LAN** (local area network)', 'One building or site', 'The office’s wired network'],
              ['**WLAN** (wireless LAN)', 'A LAN over Wi-Fi', 'Northstar-Corp and Northstar-Guest'],
              ['**MAN** (metropolitan area network)', 'Across a city', 'Linking two offices in Orlando'],
              ['**WAN** (wide area network)', 'Between sites far apart; the internet is the biggest', 'The office to a remote warehouse'],
              ['**SAN** (storage area network)', 'A separate network just for server storage', 'Behind the file servers; you never touch it'],
            ],
          } },
          { diagram: 'path' },
          { cardsort: true },
        ],
        comingUp: 'You’ll work out why a new starter’s desk has no internet, one checklist question at a time, in the guided lab (Lab 9.1, Part A).',
      },
      {
        number: 2, icon: 'ri-hashtag', heading: 'Addresses', time: 'about 10 minutes',
        learn: [
          'Name the four numbers every device needs: address, mask, gateway and DNS servers',
          'Tell a private address, a public address and an APIPA address apart on sight',
          'Say how DHCP gives a PC its address, and what each part of the `ipconfig /all` output tells you',
        ],
        blocks: [
          { h: 'Reading 2 · Addresses' },
          { p: 'Every device on a network needs four numbers. Its **IP address** is who it is. Its **subnet mask** (Northstar’s is 255.255.255.0, written /24) says which part of the address is the network, so the PC knows what’s “local”. Its **default gateway** is the router it sends everything else to. Its **DNS servers** turn names into addresses (Northstar’s are 10.20.0.10 and 10.20.0.11).' },
          { p: 'Most addresses you’ll read are **IPv4**, four numbers from 0 to 255. Companies and homes use **private** addresses, which never appear on the internet: 10.x.x.x (Northstar uses 10.20.x.x), 172.16 to 172.31.x.x, and 192.168.x.x (most home routers). The router swaps them for one **public** address on the way out. You’ll also see an **IPv6** address on every adapter, long and written in hex with colons (fe80::…); that’s normal, and you don’t need to do anything with it.' },
          { p: 'Addresses arrive in one of two ways. **Dynamic**: DHCP hands one out and renews it automatically; `ipconfig /all` says **DHCP Enabled: Yes**. Every Northstar PC is dynamic. **Static**: someone typed the address in; it says **DHCP Enabled: No**. Only servers, printers and network equipment have static addresses here. If DHCP doesn’t answer at all, Windows gives itself an **APIPA** address, 169.254.x.x, which can reach nothing.' },
          { p: '**One cause to know by sight: a static address left from another network.** A laptop that was given a fixed address for a home setup or another office keeps it when it comes back. For example, an adapter with 192.168.0.20, gateway 192.168.0.1 and DHCP Enabled: No can’t talk to anything at Northstar, because nothing here uses those addresses. Windows then sends traffic through any other adapter that does work, such as guest Wi-Fi. The user sees “the internet works, but nothing at work does”: guest Wi-Fi reaches websites, but not company names or file shares. In `ipconfig /all`, look at **every** adapter: one will show the stranger’s address and DHCP Enabled: No. The fix is the user’s own adapter, and it’s yours to do: **write down every value that’s there** (the user may need it at home), **tell the user what you’re changing**, open Settings › Network & internet › the adapter › **Edit IP settings** and set it to **Automatic (DHCP)**, forget the guest network if it was only a fallback, then `ipconfig /renew` and test what was broken. Changing someone’s settings without writing down the old values is a serious mistake, because they may need them back.' },
          { table: {
            caption: 'Table 5 · Read an address',
            head: ['You see', 'It is', 'What it means'],
            rows: [
              ['`10.20.10.141`', 'A **private** IPv4 address (Northstar uses 10.20.x.x)', 'Inside the company. Private ranges: 10.x.x.x, 172.16–31.x.x, 192.168.x.x'],
              ['`203.0.113.40`', 'A **public** IPv4 address', 'On the internet; Northstar’s router shares one with everyone inside'],
              ['`192.168.0.20` at the office', 'A private address from **another** network, usually a home router', 'It doesn’t belong here; nothing at Northstar will answer it'],
              ['`169.254.33.10`', '**APIPA** (automatic private IP addressing)', 'The PC asked DHCP for an address, got no answer, and gave itself one. It can reach nothing'],
              ['`fe80::4a1c:…`', 'An **IPv6** link-local address (128 bits, written in hex)', 'Every adapter has one; it’s normal to see it next to IPv4'],
              ['Subnet mask `255.255.255.0` (also written /24)', 'Which part of the address is the network', 'Devices with the same first three numbers here are “local”'],
              ['Default gateway `10.20.10.1`', 'The router’s address on this network', 'No gateway means the PC can’t leave its own network'],
              ['DHCP Enabled: **Yes**', '**Dynamic**: the address came from DHCP and is renewed automatically', 'What every Northstar PC should show'],
              ['DHCP Enabled: **No**', '**Static**: someone typed the address in', 'Only servers, printers and network gear have static addresses at Northstar'],
            ],
          } },
          { diagram: 'address' },
        ],
        comingUp: 'You’ll read a PC’s address, mask, gateway and DNS servers on screen, and see what each number is for, in the guided lab (Lab 9.1, Part A).',
      },
    ],
  },
  {
    id: 'its-04-lesson-02', number: '9.2',
    title: 'Diagnostic Commands: ipconfig, ping, tracert & nslookup', minutes: 120,
    readings: [
      {
        number: 3, icon: 'ri-list-check', heading: 'The connectivity checklist', time: 'about 12 minutes',
        learn: [
          'Work any “can’t connect” ticket through the six checklist questions, in order',
          'Say whether a problem is one person’s or many, and what to do in each case',
          'Read the output of `ping`, `tracert`, `nslookup` and `Test-NetConnection` (Table 7)',
          'Match the common ports to their services, and say how TCP and UDP differ (Table 8)',
        ],
        blocks: [
          { h: 'Reading 3 · The connectivity checklist' },
          { p: 'Every “can’t connect” ticket gets the same six questions, in the same order (Table 6, KB-0108). Asking them in order stops you guessing, and the answers become your work note.' },
          { p: '**First: one person, or many?** One person points at their device or its connection. Many people in one place, or on one service, point at something shared, so link the tickets to one parent and escalate the parent quickly with the area, the start time and the evidence (Module 2). **Then the link**, **then the address** (`ipconfig /all`, every adapter), **then the path** (`ping` the gateway, a company server, then `tracert` a public site), **then names** (`nslookup`), and **last the service** (`Test-NetConnection <host> -Port <n>`). Table 7 shows how to read what comes back. One reply on its own proves little; a pattern of replies tells you where the break is.' },
          { p: 'Some network problems aren’t “down” at all. **Slow speeds** and **high latency** (replies that take long) make pages crawl. **Jitter** (replies that arrive unevenly) breaks up voice and video calls, which is why **poor VoIP quality** is often the first complaint. **Intermittent** Wi-Fi or internet comes and goes; **external interference** (a microwave, a crowded band) is a common Wi-Fi cause. **Limited connectivity** means a link but no working address. **Port flapping** is a switch port going up and down. **Authentication failures** mean the network refused the device or the person. Each points the checklist at a different place.' },
          { p: '**Ports** say which service you’re talking to (Table 8). A server listens on a port for each service: 443 for secure web, 445 for file shares, 53 for DNS, 3389 for Remote Desktop, and so on. That’s why `Test-NetConnection NS-FILE01 -Port 445` is such a good question: if it says True, the network and the file service are both fine, and the problem is somewhere else. **TCP** checks that everything arrived (web, mail, files); **UDP** just sends, which is faster (DNS lookups, DHCP, calls).' },
          { p: 'Two rules sit on top of the checklist. **Before you change a setting on a user’s PC, write down what it is now and tell them what you’re about to do.** And **never** restart a switch, router, access point or server, or change DHCP or DNS on a server: shared equipment drops everyone on it, and it’s Network Operations’ and Server & Identity’s call. Your fixes are on the user’s side: a cable, a jack, a fresh address, a cleared cache, one setting, the VPN.' },
          { table: {
            caption: 'Table 6 · The connectivity checklist (KB-0108; in this order, every time)',
            head: ['#', 'Question', 'How to check', 'If it fails, it’s…'],
            rows: [
              ['1', 'One person, or many?', 'Ask; search the queue for the same area or service', 'Many: link them to one parent and escalate (KB-0063, KB-0108)'],
              ['2', 'Is there a link?', 'The NIC’s light; Settings › Network & internet; Wi-Fi details', 'The cable, jack, adapter, Wi-Fi band or the AP'],
              ['3', 'A valid address?', '`ipconfig /all`: every adapter’s IPv4, mask, gateway, DNS servers, DHCP Enabled', '169.254.x.x: DHCP didn’t answer. An address from another network: a static setting left behind'],
              ['4', 'Reach the gateway, then beyond?', '`ping` the gateway; `ping` a company server; `tracert` a public site', 'Local network, then the router, firewall or internet circuit'],
              ['5', 'Do names work?', '`nslookup <name>`; compare with `ping <name>`', 'Works by address, fails by name: DNS (the server, the cache, or the wrong DNS server)'],
              ['6', 'Is the service up?', '`Test-NetConnection <host> -Port <n>`', 'The server or the app, not the network'],
            ],
          } },
          { diagram: 'ladder' },
          { table: {
            caption: 'Table 7 · Read the output',
            head: ['You see', 'It means'],
            rows: [
              ['`Reply from 10.20.10.1: bytes=32 time=2ms`', 'Reachable; “time” is the **latency**'],
              ['`Request timed out.`', 'No reply. The device is down, unreachable, or a firewall drops ping. Not proof on its own'],
              ['`ping <address> -n 20`', 'Sends 20 pings instead of the usual 4. Use it when a problem comes and goes: 4 replies can look fine while 20 show the pattern'],
              ['Times that jump around (2 ms, 95 ms, 4 ms, 180 ms...)', '**Jitter**: the delay keeps changing. On a healthy wired or 5 GHz link, times to the gateway stay steady (about 1-5 ms)'],
              ['Some `Request timed out.` lines mixed with replies', '**Packet loss**: some data never arrived. Even 1-2 lost out of 20 is enough to break up a call'],
              ['`Destination host unreachable.`', 'Your PC has no route there: usually your own network settings'],
              ['`Ping request could not find host intranet.northstar.example.`', 'The name didn’t resolve: DNS. Try the address'],
              ['`nslookup` → `*** dc01.northstar.example can’t find intranet.northstar.example: Non-existent domain`', 'The DNS server you asked doesn’t know that name; you may be asking the wrong server'],
              ['`ping` and `nslookup` give **different addresses** for one name', 'The PC has an old answer cached; `ipconfig /flushdns` clears it'],
              ['`tracert`: a hop shows `* * *`', 'That router doesn’t answer probes; if every hop after it is `* * *` too, traffic dies there'],
              ['`TcpTestSucceeded : True`', 'The service is listening on that port: the network and the server are fine'],
              ['`ipconfig /renew` → `unable to contact your DHCP server`', 'No link, or no DHCP on this network: go back to question 2'],
            ],
          } },
          { note: {
            title: 'Why calls break up but email works',
            text: 'A Teams call sends audio in a steady stream of small packets and can\'t wait for late ones. If packets arrive at uneven times (jitter) or never arrive (packet loss), the voice stutters, freezes or cuts out. Email and web pages just retry, so the user notices nothing there. That\'s why "my calls break up, everything else is fine" points you to the Wi-Fi link: run `ping` to the gateway with `-n 20` and look at how the times change and whether any replies are lost, not just whether it replies.',
          } },
          { table: {
            caption: 'Table 8 · Ports you’ll meet (TCP unless marked)',
            head: ['Port', 'Service', 'Port', 'Service'],
            rows: [
              ['20–21', 'FTP (file transfer)', '137–139', 'NetBIOS / NetBT (old Windows naming)'],
              ['22', 'SSH (secure remote shell)', '143', 'IMAP (reading mail)'],
              ['23', 'Telnet (not encrypted: never use)', '389', 'LDAP (directory lookups)'],
              ['25', 'SMTP (sending mail)', '443', 'HTTPS (secure web)'],
              ['53', 'DNS (UDP for lookups)', '445', 'SMB / CIFS (file shares)'],
              ['67/68', 'DHCP (UDP)', '3389', 'RDP (Remote Desktop)'],
              ['80', 'HTTP (web)', '110', 'POP3 (reading mail)'],
            ],
          } },
          { p: '**TCP** sets up a conversation and checks everything arrived (web, mail, file shares). **UDP** just sends, which is faster but unchecked (DNS lookups, DHCP, voice and video calls).' },
          { table: {
            caption: 'Table 11 · The commands in this module',
            head: ['Typed', 'What it tells you or does'],
            rows: [
              ['`ipconfig`', 'Each adapter’s address, mask and gateway'],
              ['`ipconfig /all`', 'Everything: MAC address, DHCP Enabled, DHCP server, DNS servers, lease times'],
              ['`ipconfig /release` then `ipconfig /renew`', 'Give the address back, then ask DHCP for a fresh one'],
              ['`ipconfig /flushdns`', 'Empty the PC’s DNS cache, so the next lookup asks the server'],
              ['`ping <name or address>`', 'Is it reachable, and how long does the reply take. Add `-n <count>` to send that many pings instead of 4'],
              ['`tracert <name or address>`', 'Every router on the way, one hop per line'],
              ['`nslookup <name>`', 'Ask the DNS server directly what address a name has'],
              ['`Test-NetConnection <host> -Port <n>`', 'Is that service listening (you met it in Module 07)'],
              ['`gpupdate /force`', 'Apply Group Policy now (Module 07), here right after a join'],
            ],
          } },
          { p: 'Optional, earning the same credit as the screen: `Get-NetAdapter` (Settings › Network & internet) · `Get-NetIPConfiguration` (Hardware properties) · `netsh wlan show interfaces` (Wi-Fi properties) · `Resolve-DnsName` (instead of `nslookup`) · `Clear-DnsClientCache` (instead of `ipconfig /flushdns`) · `Get-DnsClientServerAddress` (the DNS servers) · `Set-NetIPInterface -InterfaceAlias <name> -Dhcp Enabled` (Edit IP settings › Automatic) · `Add-Computer` (the join dialog) · `nltest /dsgetdc:northstar.example` (finds a domain controller).' },
        ],
        comingUp: 'You’ll test the path and the services from a PC in the guided lab (Lab 9.1, Part A). Then you’ll work a ticket where many people have the same slow internet, in the practice tickets (Lab 9.2).',
      },
    ],
  },
  {
    id: 'its-04-lesson-03', number: '9.3',
    title: 'DHCP, DNS & Recognizing APIPA', minutes: 120,
    readings: [
      {
        number: 4, icon: 'ri-wifi-line', heading: 'Wi-Fi, DHCP and DNS from the desk', time: 'about 10 minutes',
        learn: [
          'Compare the three Wi-Fi bands, and say which one reaches furthest and which is fastest (Table 9)',
          'Tell Northstar-Corp from Northstar-Guest, and say who joins each',
          'Release and renew an address, and say when that will not help',
          'Tell when a PC is holding an old DNS answer, and clear it with `ipconfig /flushdns`',
        ],
        blocks: [
          { h: 'Reading 4 · Wi-Fi, DHCP and DNS from the desk' },
          { p: '**Wi-Fi** uses three bands (Table 9). **2.4 GHz** reaches furthest but is slowest, and it has only three channels that don’t overlap (1, 6 and 11), shared with microwaves and Bluetooth. **5 GHz** is faster with more channels; **6 GHz** (Wi-Fi 6E and 7) is the fastest and shortest. Access points choose their channels and channel widths within each country’s rules, so you never set a channel on a laptop; what you can check is which band and channel a laptop is on, its signal, and its link speed, in the network’s **Properties** (Settings › Network & internet › Wi-Fi). The Wi-Fi adapter has settings of its own too, such as **Preferred band**, in Device Manager › Network adapters › the adapter › Properties › **Advanced**; as with any setting, write down what it is before you change it. The standards have two names each: 802.11n is Wi-Fi 4, 802.11ac Wi-Fi 5, 802.11ax Wi-Fi 6, 802.11be Wi-Fi 7. Two shorter-range radios appear on the exam too: **NFC** (a few centimetres: tap to pay, badge readers) and **RFID** (tags read by a scanner: asset tags, warehouse stock).' },
          { p: 'Northstar runs two Wi-Fi networks. **Northstar-Corp** uses **WPA3-Enterprise**: each company laptop and phone proves itself with a certificate Intune installed, so there is no password to share, ever. **Northstar-Guest** uses WPA2-Personal with a daily passphrase, and reaches the internet only. Personal phones use Northstar-Guest and the work apps with app protection (Module 08; KB-0093).' },
          { p: '**DHCP from the desk.** Module 07 showed you scopes and leases on the server. From the PC, `ipconfig /all` shows the lease and the DHCP server that gave it. `ipconfig /release` gives the address back and `ipconfig /renew` asks for a new one; if renew says it’s “unable to contact your DHCP server”, go back to the link. A whole area with no addresses is a scope problem and an escalation, never a client fix.' },
          { p: '**DNS from the desk.** Windows remembers every name it looks up, for as long as the record allows (often an hour). That memory is the **DNS cache**. `ping` uses it; `nslookup` skips it and asks the DNS server directly. So if `ping intranet` and `nslookup intranet` give **different addresses**, the PC is holding an old answer, usually because something moved, and `ipconfig /flushdns` empties the cache. If `nslookup` says **Non-existent domain**, look at which server it asked: a home router or guest Wi-Fi can’t answer for company names.' },
          { table: {
            caption: 'Table 9 · Wi-Fi at Northstar: the three bands',
            head: ['', '2.4 GHz', '5 GHz', '6 GHz (Wi-Fi 6E and 7)'],
            rows: [
              ['Range', 'Longest, through walls', 'Shorter', 'Shortest'],
              ['Speed', 'Slowest', 'Fast', 'Fastest'],
              ['Crowding', 'Only three channels that don’t overlap (1, 6, 11); microwaves and Bluetooth share it', 'Many channels', 'Many channels, few devices yet'],
              ['Channel width', '20 MHz', '20 to 160 MHz: wider is faster, but overlaps neighbours more', 'Up to 320 MHz'],
            ],
          } },
          { table: {
            caption: 'Table 9 · Wi-Fi at Northstar: the standards',
            head: ['Standard', 'Also called', 'Bands'],
            rows: [
              ['802.11n', 'Wi-Fi 4', '2.4 and 5 GHz'],
              ['802.11ac', 'Wi-Fi 5', '5 GHz'],
              ['802.11ax', 'Wi-Fi 6 / 6E', '2.4 and 5 GHz; 6E adds 6 GHz'],
              ['802.11be', 'Wi-Fi 7', '2.4, 5 and 6 GHz'],
            ],
          } },
          { table: {
            caption: 'Table 9 · Wi-Fi at Northstar: the two networks',
            head: ['Network', 'Security', 'Who joins', 'How'],
            rows: [
              ['**Northstar-Corp**', 'WPA3-Enterprise (802.1X)', 'Company laptops and company phones only', 'A certificate installed by Intune; there is no password to give'],
              ['**Northstar-Guest**', 'WPA2-Personal', 'Visitors and personal phones', 'The day’s passphrase on the reception screen; internet only, no company names or shares'],
            ],
          } },
          { p: 'Short-range radios: **Bluetooth** (about 10 m: headsets), **NFC** (a few centimetres: tap to pay, badge readers), **RFID** (tags read by a scanner: asset tags, warehouse stock). Channels and power are set by regulation in each country, which is why the access points, not the laptops, choose them.' },
          { diagram: 'names' },
        ],
        comingUp: 'You’ll find out why one laptop can’t open the intranet when the person beside it can, in the guided lab (Lab 9.1, Part B).',
      },
    ],
  },
  {
    id: 'its-04-lesson-04', number: '9.4',
    title: 'Domain Joining & Explaining Network Issues in Plain Language', minutes: 120,
    readings: [
      {
        number: 5, icon: 'ri-lock-line', heading: 'VPN, joining the domain, and saying it plainly', time: 'about 10 minutes',
        learn: [
          'Say what a VPN does, and when to check it first',
          'Name the three things a domain join needs, and read the three join errors (Table 10)',
          'Write a work note for the next technician and a comment the user can understand',
        ],
        blocks: [
          { h: 'Reading 5 · VPN, joining the domain, and saying it plainly' },
          { p: '**VPN.** Company names, file shares and the intranet only work inside Northstar’s network. From home, the laptop uses the home router for its address and its DNS, which is fine for websites and useless for company names. A **virtual private network (VPN)** builds an encrypted tunnel from the laptop to Northstar’s VPN gateway (`vpn.northstar.example`) and gives the laptop a company address and company DNS. Northstar’s **Northstar VPN Client** sends only company traffic through the tunnel, so the home internet works as it always did. If someone at home says “email and websites work, but the drive can’t be found”, check the VPN before anything else (KB-0109).' },
          { p: '**Joining the domain.** A new company computer has to be **joined** to `northstar.example` before anyone can sign in with a work account and get Northstar’s policies. A join needs three things (diagram 5): the computer on the **corporate network**, so it uses company DNS and can find a domain controller; the **provisioning account**, which the Service Desk vault uses for you so no one types a password (KB-0097); and the **right OU**, the user’s department under Workstations, so the right policies arrive (Module 07). After the restart, `gpupdate /force` applies policy straight away, and the computer object shows in Active Directory › Computers. Table 10 shows the three errors you’ll meet. “Could not be contacted” is almost always DNS.' },
          { p: '**Saying it plainly.** Your work note is for the next technician: exact evidence, commands and results. Your comment is for the person: what happened, in words they’d use, what they need to do, and what happens next. The technician writes “DHCP failed; the NIC self-assigned an APIPA address; renewed the lease.” The user reads “Your computer hadn’t picked up its network address, so it couldn’t reach anything. It has one now.” Leave out addresses, acronyms and team jargon, and never promise a time you can’t keep.' },
          { table: {
            caption: 'Table 10 · When a domain join fails',
            head: ['The error says', 'It’s almost always', 'Do this'],
            rows: [
              ['“An Active Directory Domain Controller (AD DC) for the domain "northstar.example" could not be contacted.”', '**DNS**: the PC isn’t using company DNS (guest Wi-Fi, a home network, a typed DNS server)', 'Put it on the corporate network; check `ipconfig /all` shows 10.20.0.10; `nslookup northstar.example` returns the domain controllers'],
              ['“Access is denied.” or “You have exceeded the maximum number of computer accounts…”', '**The account**: a normal user account can’t join computers', 'Use the provisioning account through the vault (KB-0097), never your own or the user’s'],
              ['“The account already exists.”', 'A computer object with that name is already in Active Directory', 'Stop and send it to Desktop Support with the name'],
            ],
          } },
          { diagram: 'inside' },
        ],
        comingUp: 'You’ll join a new starter’s laptop to the domain in the guided lab (Lab 9.1, Part C), and explain a fix in words the user can follow in Part B.',
      },
    ],
  },
];

// The page shows one card per reading: five cards for the four filed lessons.
// Readings 1 and 2 belong to one filed lesson (its-04-lesson-01), so both
// cards carry its id and say they share its minutes.
function its04Cards() {
  return ITS04_LESSONS.flatMap((lesson) => lesson.readings.map((reading) => ({
    id: lesson.id, number: lesson.number, reading: reading.number, icon: reading.icon, heading: reading.heading,
    minutesText: `Reading time: ${reading.time} · ${lesson.readings.length > 1
      ? `Readings ${lesson.readings.map((r) => r.number).join(' and ')} share Lesson ${lesson.number}’s ${formatInstructionalMinutes(lesson.minutes)}`
      : formatInstructionalMinutes(lesson.minutes)}`,
    learn: reading.learn, blocks: reading.blocks, comingUp: reading.comingUp,
  })));
}

/* ------------------------------------------------------------ Diagrams */

/* Each diagram is drawn as inline SVG from the data below: a wide layout and
 * a narrow (phone) one, switched by a container query in the stylesheet. The
 * look comes from the its01-dg-* classes and follows the page's theme
 * variables. */
const ITS04_DIAGRAMS = {
  path: {
    title: 'From the desk to the internet',
    yours: 'Your side: the cable, the jack you plug into, the PC’s settings',
    theirs: 'Network Operations’ side',
    chain: [
      { title: 'PC', lines: ['NIC', 'MAC 3C-52-82-…'] },
      { title: 'Wall jack', lines: ['2F-15'] },
      { title: 'Patch panel', lines: ['port 2-15'] },
      { title: 'Switch', lines: ['NS-SW-2F'] },
      { title: 'Router and firewall' },
    ],
    poe: 'PoE',
    poeDevices: [{ title: 'Access point' }, { title: 'Desk phone' }],
    ont: { title: 'ONT', sub: 'Fiber (primary)' },
    cellular: { title: 'Cellular backup (data cap)' },
  },
  address: {
    title: 'Read an address',
    good: {
      heading: 'ipconfig /all · Ethernet',
      rows: [
        { name: 'IPv4 Address', value: '10.20.10.141', call: 'private, Northstar’s' },
        { name: 'Subnet Mask', value: '255.255.255.0', call: 'the network part' },
        { name: 'Default Gateway', value: '10.20.10.1', call: 'the router' },
        { name: 'DNS Servers', value: '10.20.0.10', call: 'company DNS' },
        { name: 'DHCP Enabled', value: 'Yes', call: 'dynamic' },
      ],
    },
    other: {
      heading: 'An address from another network',
      rows: [
        { name: 'IPv4 Address', value: '192.168.0.20' },
        { name: 'Default Gateway', value: '192.168.0.1' },
        { name: 'DHCP Enabled', value: 'No' },
      ],
    },
    toggleLabel: 'Edit IP settings',
    toggle: ['Automatic (DHCP)', 'Manual'],
    caption: 'A static address from another network: write it down, tell the user, set it back to Automatic (DHCP).',
  },
  ladder: {
    title: 'The checklist',
    top: 'Fixed? Verify with the user, then write it down.',
    // Question 1 is the bottom rung: the ladder is climbed upward.
    rungs: [
      { n: 1, q: 'One person, or many?', how: 'Ask; search the queue for the same area or service', bad: 'many: link them to one parent and escalate (KB-0063, KB-0108).' },
      { n: 2, q: 'Is there a link?', how: 'The NIC’s light; Settings › Network & internet; Wi-Fi details', bad: 'the cable, jack, adapter, Wi-Fi band or the AP.' },
      { n: 3, q: 'A valid address?', how: 'ipconfig /all: every adapter’s IPv4, mask, gateway, DNS servers, DHCP Enabled', bad: '169.254.x.x: DHCP didn’t answer.' },
      { n: 4, q: 'Reach the gateway, then beyond?', how: 'ping the gateway; ping a company server; tracert a public site', bad: 'local network, then the router, firewall or internet circuit.' },
      { n: 5, q: 'Do names work?', how: 'nslookup <name>; compare with ping <name>', bad: 'works by address, fails by name: DNS (the server, the cache, or the wrong DNS server).' },
      { n: 6, q: 'Is the service up?', how: 'Test-NetConnection <host> -Port <n>', bad: 'the server or the app, not the network.' },
    ],
  },
  names: {
    title: 'Two ways a name gets an address',
    pc: 'Your PC',
    cache: 'DNS cache: intranet → 10.20.0.45 (from 08:10)',
    ping: 'ping intranet',
    old: { title: '10.20.0.45', sub: 'old server', gone: true },
    nslookup: 'nslookup intranet',
    dns: 'dc01 · 10.20.0.10',
    answer: 'returns 10.20.0.50',
    flush: 'ipconfig /flushdns',
    reachTitle: 'Reach of each Wi-Fi band',
    bands: ['2.4 GHz', '5 GHz', '6 GHz'],
  },
  inside: {
    title: 'Inside or outside',
    laptop: { title: 'Home laptop', lines: ['on the home router', '192.168.0.x'] },
    cloud: 'internet',
    tunnel: 'Northstar VPN: only company traffic goes through',
    gateway: { title: 'VPN gateway', lines: ['vpn.northstar.example'] },
    office: { title: 'The office', lines: ['company DNS · file shares · intranet'] },
    joinHeading: 'Joining the domain needs all three',
    ticks: ['On the corporate network (company DNS)', 'The provisioning account (KB-0097)', 'The right OU'],
  },
};

// Every word a diagram shows, in reading order: the screen-reader description.
function its04DiagramWords(key) {
  const d = ITS04_DIAGRAMS[key];
  if (key === 'path') {
    const chain = d.chain.map((b) => [b.title].concat(b.lines || []).join(', ')).join(', then an arrow to ');
    return `From left to right. A chain of boxes, each with an arrow to the next: ${chain}. From the switch, a lightning icon labelled ${d.poe} feeds two boxes: ${d.poeDevices.map((b) => b.title).join(' and ')}. Two lines leave the router and firewall: a thick line to a box, ${d.ont.title}, ${d.ont.sub}, and a thin dashed line to a box, ${d.cellular.title}. Under the PC and the wall jack: ${d.yours}. Under the closet equipment: ${d.theirs}.`;
  }
  if (key === 'address') {
    const good = d.good.rows.map((r) => `${r.name} ${r.value}, ${r.call}`).join('; ');
    const other = d.other.rows.map((r) => `${r.name} ${r.value}`).join('; ');
    return `Two blocks of ipconfig output. The first, ${d.good.heading}: ${good}. The second, greyed out, ${d.other.heading}: ${other}. Under it, the ${d.toggleLabel} toggle with two choices: ${d.toggle.join(' or ')}. ${d.caption}`;
  }
  if (key === 'ladder') {
    const rungs = d.rungs.map((r) => `Rung ${r.n} · ${r.q} Check: ${r.how}. If it fails: It’s… ${r.bad}`).join(' ');
    return `A ladder of six rungs, climbed from the bottom, with a tick on each step up. At the right of each rung is a red branch for when the check fails. ${rungs} At the top: ${d.top}`;
  }
  if (key === 'names') {
    return `On the left, ${d.pc}, with a small box inside it: ${d.cache}. An arrow labelled ${d.ping} goes only to that cache and on to ${d.old.title}, ${d.old.sub}, with a red cross on it. A second arrow labelled ${d.nslookup} goes past the cache to ${d.dns} and brings back an answer: ${d.answer}. A broom labelled ${d.flush} sweeps the cache box. Beside it, a smaller figure, ${d.reachTitle}: three arcs from one access point, ${d.bands[0]} the widest, then ${d.bands[1]}, then ${d.bands[2]} the shortest.`;
  }
  return `On the left, a box: ${d.laptop.title}, ${d.laptop.lines.join(', ')}. A tunnel runs from it across a cloud labelled ${d.cloud}, to a box: ${d.gateway.title}, ${d.gateway.lines.join(', ')}, then into a box: ${d.office.title}, ${d.office.lines.join(', ')}. The tunnel is labelled ${d.tunnel}. Below, ${d.joinHeading}, as three tick boxes: ${d.ticks.join('; ')}.`;
}

// Splits text into lines of at most max characters, at word breaks.
function its04Wrap(text, max) {
  const lines = [];
  let line = '';
  String(text).split(/\s+/).forEach((word) => {
    if (line && (line.length + 1 + word.length) > max) { lines.push(line); line = word; } else line = line ? `${line} ${word}` : word;
  });
  if (line) lines.push(line);
  return lines;
}

const ITS04_DG = { pad: 12, title: 15, text: 13, lh: 18, charW: 0.56, gap: 5, indent: 9 };

// How many characters of a font size fit in a width.
function its04Max(width, size) {
  return Math.max(6, Math.floor(width / (size * ITS04_DG.charW)));
}

// One box's wrapped lines: [{ text, cls, dx, dy }], laid out for width w.
function its04BoxLines(box, w) {
  const inner = w - ITS04_DG.pad * 2;
  const titleMax = Math.max(8, Math.floor(inner / (ITS04_DG.title * ITS04_DG.charW)));
  const textMax = Math.max(8, Math.floor(inner / (ITS04_DG.text * ITS04_DG.charW)));
  const out = [];
  let dy = 0;
  const push = (text, cls) => { out.push({ text, cls, dx: 0, dy }); dy += ITS04_DG.lh; };
  its04Wrap(box.title || '', titleMax).forEach((text) => push(text, 'its01-dg-title'));
  if (box.sub) its04Wrap(box.sub, textMax).forEach((text) => push(text, 'its01-dg-sub'));
  (box.lines || []).forEach((item) => its04Wrap(item, textMax).forEach((text) => push(text, 'its01-dg-text')));
  if (box.text) its04Wrap(box.text, textMax).forEach((text) => push(text, 'its01-dg-text'));
  return out;
}
function its04BoxHeight(box, w) {
  const lines = its04BoxLines(box, w);
  const used = lines.length ? lines[lines.length - 1].dy + ITS04_DG.lh : 0;
  return ITS04_DG.pad * 2 + used + 4;
}
function its04Box(box, x, y, w, h) {
  // gone = a red dashed outline (a failure branch); hl = the highlighted box.
  const cls = box.gone ? ' its04-dg-gone' : (box.hl ? ' its01-dg-hl' : '');
  const text = its04BoxLines(box, w).map((line) => `<text class="${line.cls}" x="${x + ITS04_DG.pad + line.dx}" y="${y + ITS04_DG.pad + 14 + line.dy}">${esc(line.text)}</text>`).join('');
  return `<rect class="its01-dg-box${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>${text}`;
}
function its04Arrow(x1, y1, x2, y2, id) {
  return `<line class="its01-dg-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#${id})"/>`;
}
// An arrow for a failure branch: the same line, drawn in red.
function its04RedArrow(x1, y1, x2, y2, id) {
  return `<line class="its01-dg-line its04-dg-redline" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#${id})"/>`;
}
// A plain line, no arrow head: it only joins two boxes.
function its04Line(x1, y1, x2, y2, cls) {
  return `<line class="its01-dg-line${cls ? ` ${cls}` : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
}
function its04Markers(id) {
  return `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="its01-dg-head" d="M0,0 L10,5 L0,10 z"/></marker></defs>`;
}
function its04Svg(key, layout, width, height, body) {
  const d = ITS04_DIAGRAMS[key];
  return `<svg class="its01-dg-${layout}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(d.title)}" aria-describedby="its04-dg-${key}-desc" focusable="false">${body}</svg>`;
}
// A small label: anchor 'middle' centres it on x.
function its04Label(text, x, y, anchor) {
  return `<text class="its04-dg-label" x="${x}" y="${y}"${anchor ? ` text-anchor="${anchor}"` : ''}>${esc(text)}</text>`;
}
// Plain text lines, one per wrapped line, starting at y.
function its04TextLines(text, max, x, y, anchor, cls) {
  return its04Wrap(text, max).map((line, i) => `<text class="${cls || 'its01-dg-text'}" x="${x}" y="${y + i * ITS04_DG.lh}"${anchor ? ` text-anchor="${anchor}"` : ''}>${esc(line)}</text>`).join('');
}
// A heading in the title style.
function its04Heading(text, x, y) {
  return `<text class="its01-dg-title" x="${x}" y="${y}">${esc(text)}</text>`;
}
// A bracket under a stretch of the drawing: a line with two short ends.
function its04Bracket(x1, x2, y) {
  return `<path class="its01-dg-line" d="M${x1} ${y - 8} V${y} H${x2} V${y - 8}"/>`;
}
// A tick mark (the check passed) and a cross (the check failed).
function its04Tick(x, y) {
  return `<path class="its04-dg-tick" d="M${x} ${y} l5 6 l10 -12"/>`;
}
function its04Cross(cx, cy) {
  return `<path class="its04-dg-cross" d="M${cx - 7} ${cy - 7} L${cx + 7} ${cy + 7} M${cx + 7} ${cy - 7} L${cx - 7} ${cy + 7}"/>`;
}
// A lightning bolt for power, drawn from one path.
function its04Bolt(x, y) {
  return `<path class="its04-dg-bolt" d="M${x + 7} ${y} L${x} ${y + 11} h5 L${x + 3} ${y + 20} L${x + 11} ${y + 8} h-5 Z"/>`;
}
// A broom: a handle and a block of bristles. (x, y) is its top left; it is 26 wide and 28 tall.
function its04Broom(x, y) {
  return `<path class="its04-dg-broom-handle" d="M${x + 20} ${y} L${x + 12} ${y + 14}"/><path class="its04-dg-broom" d="M${x + 4} ${y + 14} L${x + 20} ${y + 14} L${x + 25} ${y + 28} L${x - 1} ${y + 28} Z"/>`;
}

/* Diagram 1: from the desk to the internet. */
function its04PathSvg(layout) {
  const d = ITS04_DIAGRAMS.path;
  const id = `its04-dg-path-${layout}-arrow`;
  let body = its04Markers(id);

  if (layout === 'wide') {
    const width = 768, top = 4, w = 108, step = 132;
    const boxes = d.chain.concat([d.ont]);
    const h = Math.max(...boxes.map((b) => its04BoxHeight(b, w)));
    const mid = top + h / 2;
    for (let i = 0; i < 4; i += 1) body += its04Arrow(i * step + w + 2, mid, (i + 1) * step - 2, mid, id);
    // The thick line to the fiber box; the thin dashed line to the backup.
    body += its04Line(4 * step + w, mid, 5 * step, mid, 'its04-dg-fiber');
    const trunkX = 3 * step + w / 2, apX = trunkX - 150, phX = trunkX - 40, devW = 96;
    const cellX = 4 * step, cellW = w;
    const devY = top + h + 66, busY = top + h + 30;
    const devH = Math.max(...d.poeDevices.map((b) => its04BoxHeight(b, devW)), its04BoxHeight(d.cellular, cellW));
    body += its04Line(trunkX, top + h, trunkX, busY) + its04Line(apX + devW / 2, busY, phX + devW / 2, busY);
    body += its04Arrow(apX + devW / 2, busY, apX + devW / 2, devY - 2, id) + its04Arrow(phX + devW / 2, busY, phX + devW / 2, devY - 2, id);
    body += its04Line(cellX + cellW / 2, top + h, cellX + cellW / 2, devY, 'its04-dg-cell');
    body += its04Bolt(trunkX + 6, top + h + 6) + its04Label(d.poe, trunkX + 24, top + h + 22);
    boxes.forEach((b, i) => { body += its04Box(b, i * step, top, w, h); });
    body += its04Box(d.poeDevices[0], apX, devY, devW, devH) + its04Box(d.poeDevices[1], phX, devY, devW, devH) + its04Box(d.cellular, cellX, devY, cellW, devH);
    const bY = devY + devH + 22;
    body += its04Bracket(0, 240, bY) + its04TextLines(d.yours, 30, 120, bY + 16, 'middle', 'its04-dg-label');
    body += its04Bracket(264, width, bY) + its04Label(d.theirs, (264 + width) / 2, bY + 16, 'middle');
    return its04Svg('path', layout, width, bY + 16 + its04Wrap(d.yours, 30).length * ITS04_DG.lh + 4, body);
  }

  const width = 320, x = 10, w = 300, cx = 160;
  let y = 4;
  const yoursLines = its04Wrap(d.yours, 36);
  body += its04TextLines(d.yours, 36, x, y + 12, null, 'its04-dg-label');
  y += yoursLines.length * ITS04_DG.lh + 4;
  const stack = (box, bw, bx) => {
    const h = its04BoxHeight(box, bw);
    body += its04Box(box, bx, y, bw, h);
    y += h;
  };
  stack(d.chain[0], w, x);
  body += its04Arrow(cx, y + 2, cx, y + 22, id);
  y += 24;
  stack(d.chain[1], w, x);
  // The next stretch belongs to Network Operations: its tag sits on the left
  // and the arrow runs down the right.
  body += its04Arrow(290, y + 2, 290, y + 44, id);
  body += its04Label(d.theirs, x, y + 28);
  y += 46;
  stack(d.chain[2], w, x);
  body += its04Arrow(cx, y + 2, cx, y + 22, id);
  y += 24;
  stack(d.chain[3], w, x);
  // The power branch (left) and the main chain (right) leave the switch.
  const switchBottom = y;
  const devW = 88, apX = x, phX = x + devW + 8;
  const devH = Math.max(...d.poeDevices.map((b) => its04BoxHeight(b, devW)));
  const busY = switchBottom + 30, devY = switchBottom + 56;
  const trunkX = apX + devW + 4;
  body += its04Line(trunkX, switchBottom, trunkX, busY) + its04Line(apX + devW / 2, busY, phX + devW / 2, busY);
  body += its04Arrow(apX + devW / 2, busY, apX + devW / 2, devY - 2, id) + its04Arrow(phX + devW / 2, busY, phX + devW / 2, devY - 2, id);
  body += its04Bolt(trunkX + 6, switchBottom + 6) + its04Label(d.poe, trunkX + 24, switchBottom + 22);
  body += its04Box(d.poeDevices[0], apX, devY, devW, devH) + its04Box(d.poeDevices[1], phX, devY, devW, devH);
  y = devY + devH + 28;
  body += its04Arrow(250, switchBottom + 2, 250, y - 2, id);
  stack(d.chain[4], w, x);
  const routerBottom = y;
  y += 44;
  const outW = 140, ontH = its04BoxHeight(d.ont, outW), cellH = its04BoxHeight(d.cellular, outW), outH = Math.max(ontH, cellH);
  body += its04Line(80, routerBottom, 80, y, 'its04-dg-fiber') + its04Line(240, routerBottom, 240, y, 'its04-dg-cell');
  body += its04Box(d.ont, x, y, outW, outH) + its04Box(d.cellular, x + outW + 20, y, outW, outH);
  return its04Svg('path', layout, width, y + outH + 4, body);
}

/* Diagram 2: read an address. */
function its04MockBlock(block, x, y, w, pitch, grey, withCalls, wide, id) {
  const rows = block.rows;
  const h = 36 + rows.length * pitch + 8;
  let svg = `<rect class="its04-dg-mock${grey ? ' its04-dg-mock-grey' : ''}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>`;
  svg += `<text class="${grey ? 'its04-dg-grey-title' : 'its01-dg-title'}" x="${x + 12}" y="${y + 24}">${esc(block.heading)}</text>`;
  rows.forEach((row, i) => {
    const top = y + 36 + i * pitch;
    svg += `<text class="${grey ? 'its04-dg-mono its04-dg-mono-grey' : 'its04-dg-mono'}" x="${x + 12}" y="${top + 14}">${esc(row.name)}</text>`;
    svg += `<text class="${grey ? 'its04-dg-mono its04-dg-mono-grey' : 'its04-dg-mono'}" x="${x + 140}" y="${top + 14}">${esc(row.value)}</text>`;
    if (withCalls && row.call) {
      if (wide) {
        svg += its04Arrow(x + w + 32, top + 10, x + w + 4, top + 10, id);
        svg += `<text class="its04-dg-callout" x="${x + w + 40}" y="${top + 14}">${esc(row.call)}</text>`;
      } else {
        svg += `<text class="its04-dg-callout" x="${x + 24}" y="${top + 30}">${esc(row.call)}</text>`;
      }
    }
  });
  return { svg, h };
}

function its04AddressSvg(layout) {
  const d = ITS04_DIAGRAMS.address;
  const id = `its04-dg-address-${layout}-arrow`;
  const wide = layout === 'wide';
  const width = wide ? 768 : 320;
  const x = wide ? 0 : 10, bw = wide ? 330 : 300;
  let body = its04Markers(id);
  let y = 4;
  const good = its04MockBlock(d.good, x, y, bw, wide ? 22 : 38, false, true, wide, id);
  body += good.svg;
  y += good.h + 20;
  const other = its04MockBlock(d.other, x, y, bw, 22, true, false, wide, id);
  body += other.svg;
  y += other.h + 18;
  body += its04Label(d.toggleLabel, x, y + 10);
  body += `<rect class="its04-dg-toggle-on" x="${x}" y="${y + 18}" width="150" height="30" rx="6"/><text class="its04-dg-toggle-text" x="${x + 75}" y="${y + 38}" text-anchor="middle">${esc(d.toggle[0])}</text>`;
  body += `<rect class="its04-dg-toggle-off" x="${x + 150}" y="${y + 18}" width="100" height="30" rx="6"/><text class="its04-dg-toggle-text its04-dg-toggle-text-off" x="${x + 200}" y="${y + 38}" text-anchor="middle">${esc(d.toggle[1])}</text>`;
  return its04Svg('address', layout, width, y + 18 + 30 + 6, body);
}

/* Diagram 3: the checklist as a ladder. Rung 6 is drawn at the top. */
function its04LadderSvg(layout) {
  const d = ITS04_DIAGRAMS.ladder;
  const id = `its04-dg-ladder-${layout}-arrow`;
  const wide = layout === 'wide';
  const width = wide ? 768 : 320;
  const fullX = wide ? 0 : 10, fullW = wide ? 768 : 300;
  const rungX = wide ? 0 : 10, rungW = wide ? 340 : 300;
  const branchX = wide ? 420 : 40, branchW = wide ? 348 : 206;
  const tickX = wide ? 170 : 286;
  const gap = wide ? 32 : 30;
  let body = its04Markers(id);
  let y = 4;
  const strip = { text: d.top, hl: true };
  const stripH = its04BoxHeight(strip, fullW);
  body += its04Box(strip, fullX, y, fullW, stripH);
  let above = y + stripH;
  y += stripH + gap;
  d.rungs.slice().reverse().forEach((r) => {
    const rung = { title: `${r.n} · ${r.q}`, text: r.how };
    const branch = { title: 'It’s…', text: r.bad, gone: true };
    const rH = its04BoxHeight(rung, rungW), bH = its04BoxHeight(branch, branchW);
    // The tick arrow climbs from this rung to the one above it.
    body += its04Arrow(tickX, y - 2, tickX, above + 2, id) + its04Tick(tickX + (wide ? 12 : -24), (y + above) / 2 - 4);
    if (wide) {
      const h = Math.max(rH, bH);
      body += its04Box(rung, rungX, y, rungW, h) + its04Box(branch, branchX, y, branchW, h);
      body += its04RedArrow(rungX + rungW + 2, y + h / 2, branchX - 2, y + h / 2, id);
      above = y + h;
      y += h + gap;
    } else {
      body += its04Box(rung, rungX, y, rungW, rH);
      const by = y + rH + 14;
      body += its04Line(24, y + rH, 24, by + bH / 2, 'its04-dg-redline') + its04RedArrow(24, by + bH / 2, branchX - 2, by + bH / 2, id);
      body += its04Box(branch, branchX, by, branchW, bH);
      above = y + rH;
      y = by + bH + gap;
    }
  });
  return its04Svg('ladder', layout, width, y - gap + 4, body);
}

/* Diagram 4: two ways a name gets an address, with the Wi-Fi reach figure. */
// Three half-discs from one access point: the widest is 2.4 GHz.
function its04Bands(cx, cy, scale) {
  const radii = [96, 64, 34].map((r) => r * scale);
  const names = ITS04_DIAGRAMS.names.bands;
  let svg = '';
  radii.forEach((r, i) => { svg += `<path class="its04-dg-band its04-dg-band-${i + 1}" d="M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy} Z"/>`; });
  const ys = [cy - 76 * scale, cy - 46 * scale, cy - 12 * scale];
  names.forEach((name, i) => { svg += its04Label(name, cx, ys[i] + 4, 'middle'); });
  svg += `<circle class="its04-dg-ap" cx="${cx}" cy="${cy}" r="5"/>`;
  return svg;
}

function its04NamesSvg(layout) {
  const d = ITS04_DIAGRAMS.names;
  const id = `its04-dg-names-${layout}-arrow`;
  const wide = layout === 'wide';
  const width = wide ? 768 : 320;
  const top = 4;
  const pcX = wide ? 0 : 10, pcW = wide ? 212 : 300;
  const cacheW = pcW - 28, cacheX = pcX + 14;
  const cache = { text: d.cache };
  const cacheH = its04BoxHeight(cache, cacheW);
  const cacheY = top + 30, cacheBottom = cacheY + cacheH;
  let body = its04Markers(id);

  if (wide) {
    const askY = cacheBottom + 18, retY = askY + 34, pcH = retY + 14 - top;
    const cMid = cacheY + cacheH / 2;
    body += its04Box({ title: d.pc }, pcX, top, pcW, pcH) + its04Box(cache, cacheX, cacheY, cacheW, cacheH);
    // The broom sweeps the cache box.
    body += its04Broom(pcX + 14, cacheBottom + 26) + its04Arrow(pcX + 26, cacheBottom + 24, pcX + 26, cacheBottom + 2, id);
    body += `<text class="its04-dg-mono" x="${pcX + 50}" y="${cacheBottom + 46}">${esc(d.flush)}</text>`;
    // ping stops at the cache: it only gets the old answer.
    const farX = 360, farW = 170;
    body += its04Arrow(cacheX + cacheW + 2, cMid, farX - 6, cMid, id) + its04Cross(farX - 28, cMid);
    body += its04Label(d.ping, (pcW + farX) / 2, cMid - 8, 'middle');
    body += its04Box(d.old, farX, cMid - 32, farW, 64);
    // nslookup skips the cache and asks the DNS server itself.
    body += its04Arrow(pcW + 2, askY, farX - 4, askY, id) + its04Arrow(farX - 4, retY, pcW + 4, retY, id);
    body += its04Label(d.nslookup, (pcW + farX) / 2, askY - 6, 'middle');
    body += its04Box({ title: d.dns }, farX, (askY + retY) / 2 - 23, farW, 46);
    body += its04Label(d.answer, (pcW + farX) / 2, retY + 18, 'middle');
    // The Wi-Fi reach figure.
    body += its04Heading(d.reachTitle, 560, top + 14) + its04Bands(664, top + 30 + 96 + 8, 1);
    const bottom = Math.max(top + pcH, retY + 24, top + 30 + 96 + 8 + 10);
    return its04Svg('names', layout, width, bottom + 4, body);
  }

  const bx = 40, bw = 270, trunkX = 16, cx = 160;
  const pcBottom = cacheBottom + 62;
  body += its04Box({ title: d.pc }, pcX, top, pcW, pcBottom - top) + its04Box(cache, cacheX, cacheY, cacheW, cacheH);
  body += its04Broom(pcX + 14, cacheBottom + 26) + its04Arrow(pcX + 26, cacheBottom + 24, pcX + 26, cacheBottom + 2, id);
  body += `<text class="its04-dg-mono" x="${pcX + 50}" y="${cacheBottom + 46}">${esc(d.flush)}</text>`;
  let y = pcBottom + 34;
  const oldH = its04BoxHeight(d.old, bw);
  const dnsBox = { title: d.dns, lines: [d.answer] };
  const dnsH = its04BoxHeight(dnsBox, bw);
  const oldMid = y + oldH / 2, dnsTop = y + oldH + 38, dnsMid = dnsTop + dnsH / 2;
  body += its04Line(trunkX, pcBottom, trunkX, dnsMid);
  body += its04Arrow(trunkX, oldMid, bx - 2, oldMid, id) + its04Cross(trunkX + 14, oldMid);
  body += its04Arrow(trunkX, dnsMid, bx - 2, dnsMid, id);
  body += its04Label(d.ping, bx, y - 8) + its04Box(d.old, bx, y, bw, oldH);
  body += its04Label(d.nslookup, bx, dnsTop - 8) + its04Box(dnsBox, bx, dnsTop, bw, dnsH);
  y = dnsTop + dnsH + 28;
  body += its04Heading(d.reachTitle, pcX, y + 14);
  body += its04Bands(cx, y + 30 + 96 + 8, 1);
  return its04Svg('names', layout, width, y + 30 + 96 + 8 + 14, body);
}

/* Diagram 5: inside or outside. */
function its04InsideSvg(layout) {
  const d = ITS04_DIAGRAMS.inside;
  const wide = layout === 'wide';
  const width = wide ? 768 : 320;
  let body = '';
  // The three tick boxes for a domain join, drawn at (x, y).
  const ticks = (x, y, colW, maxChars) => d.ticks.map((text, i) => {
    const tx = wide ? x + i * (colW + 12) : x;
    const ty = wide ? y : y + i * 44;
    return `<rect class="its04-dg-check" x="${tx}" y="${ty}" width="18" height="18" rx="3"/>${its04Tick(tx + 3, ty + 10)}${its04TextLines(text, maxChars, tx + 28, ty + 14, null, 'its04-dg-label')}`;
  }).join('');

  if (wide) {
    const laptopW = 140, gwX = 390, gwW = 200, offX = 630, offW = 138;
    const laptop = d.laptop, gw = d.gateway, office = d.office;
    const lH = its04BoxHeight(laptop, laptopW), gH = its04BoxHeight(gw, gwW), oH = its04BoxHeight(office, offW);
    const blockH = Math.max(lH, gH, oH);
    const mid = 4 + 60 + blockH / 2;
    body += `<ellipse class="its04-dg-cloud" cx="265" cy="${mid}" rx="85" ry="40"/>`;
    body += `<rect class="its04-dg-tunnel" x="${laptopW}" y="${mid - 11}" width="${offX - laptopW}" height="22" rx="11"/>`;
    body += `<text class="its04-dg-label" x="265" y="${mid - 18}" text-anchor="middle">${esc(d.cloud)}</text>`;
    body += its04Label(d.tunnel, (laptopW + offX) / 2, mid - 52, 'middle');
    body += its04Box(laptop, 0, mid - lH / 2, laptopW, lH) + its04Box(gw, gwX, mid - gH / 2, gwW, gH) + its04Box(office, offX, mid - oH / 2, offW, oH);
    const y2 = mid + blockH / 2 + 26;
    body += its04Heading(d.joinHeading, 0, y2 + 14);
    body += ticks(0, y2 + 30, 248, 27);
    return its04Svg('inside', layout, width, y2 + 30 + 36 + 8, body);
  }

  const x = 10, w = 300, cx = 160;
  let y = 4;
  const lH = its04BoxHeight(d.laptop, w);
  const bandTop = y + lH;
  const cloudCy = bandTop + 56;
  const labelTop = cloudCy + 56;
  const gwTop = labelTop + 84;
  const gH = its04BoxHeight(d.gateway, w);
  const offTop = gwTop + gH + 30;
  const oH = its04BoxHeight(d.office, w);
  body += `<ellipse class="its04-dg-cloud" cx="${cx}" cy="${cloudCy}" rx="80" ry="36"/>`;
  body += `<rect class="its04-dg-tunnel" x="${cx - 9}" y="${bandTop}" width="18" height="${offTop - bandTop}" rx="9"/>`;
  body += `<text class="its04-dg-label" x="${cx - 18}" y="${cloudCy + 5}" text-anchor="end">${esc(d.cloud)}</text>`;
  body += its04TextLines(d.tunnel, 16, cx + 20, labelTop + 4, null, 'its04-dg-label');
  body += its04Box(d.laptop, x, y, w, lH) + its04Box(d.gateway, x, gwTop, w, gH) + its04Box(d.office, x, offTop, w, oH);
  y = offTop + oH + 26;
  body += its04Heading(d.joinHeading, x, y + 14);
  body += ticks(x, y + 30, w, 30);
  return its04Svg('inside', layout, width, y + 30 + 3 * 44 + 4, body);
}

const ITS04_DIAGRAM_DRAW = { path: its04PathSvg, address: its04AddressSvg, ladder: its04LadderSvg, names: its04NamesSvg, inside: its04InsideSvg };

// The readings point at their diagrams by number ("diagram 5"), so each
// figure's visible heading carries its number.
const ITS04_DIAGRAM_NUMBER = { path: 1, address: 2, ladder: 3, names: 4, inside: 5 };

function its04Diagram(key) {
  const d = ITS04_DIAGRAMS[key];
  const draw = ITS04_DIAGRAM_DRAW[key];
  if (!d || !draw) return '';
  return `<figure class="its01-dg" data-its04-diagram="${esc(key)}">
    <p class="its01-dg-heading">Diagram ${ITS04_DIAGRAM_NUMBER[key]} · ${esc(d.title)}</p>
    ${draw('wide')}
    ${draw('narrow')}
    <p class="its01-sr-only" id="its04-dg-${esc(key)}-desc">${esc(its04DiagramWords(key))}</p>
    ${d.caption ? `<figcaption>${esc(d.caption)}</figcaption>` : ''}
  </figure>`;
}

/* ------------------------------------------------------------- Lessons */

// Escaped text; **...** becomes emphasized text and `...` inline code. Both
// run on the escaped text, so no markup gets in.
function its04Text(text) {
  return esc(text)
    .replace(/`([^`]+)`/g, '<code class="its04-code">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

// An empty header cell (the row-label column) gets a hidden label, so a
// screen reader doesn't meet an empty header.
function its04Table(table) {
  const caption = esc(table.caption);
  const head = table.head.map((cell) => `<th scope="col">${cell ? esc(cell) : '<span class="its01-sr-only">Item</span>'}</th>`).join('');
  const rows = table.rows.map((row) => `<tr>${row.map((cell) => `<td>${its04Text(cell)}</td>`).join('')}</tr>`).join('');
  return `<div class="its10-table-wrap" tabindex="0" role="region" aria-label="${caption}"><table class="its10-table"><caption>${caption}</caption><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function its04Blocks(blocks) {
  return blocks.map((block) => {
    if (block.h) return `<h4>${esc(block.h)}</h4>`;
    if (block.h5) return `<h5>${esc(block.h5)}</h5>`;
    if (block.p) return `<p>${its04Text(block.p)}</p>`;
    if (block.ul) return `<ul>${block.ul.map((item) => `<li>${its04Text(item)}</li>`).join('')}</ul>`;
    if (block.ol) return `<ol>${block.ol.map((item) => `<li>${its04Text(item)}</li>`).join('')}</ol>`;
    if (block.table) return its04Table(block.table);
    if (block.diagram) return its04Diagram(block.diagram);
    if (block.cardsort) return its04CardSort();
    if (block.note) return `<div class="its01-note"><strong>${esc(block.note.title)}</strong><p>${its04Text(block.note.text)}</p></div>`;
    return '';
  }).join('');
}

function its04LessonCard(card) {
  return `<details class="its01-lesson" data-its04-lesson="${esc(card.id)}" data-its04-reading="${esc(String(card.reading))}">
    <summary><span class="its01-lesson-icon"><i class="${esc(card.icon)}" aria-hidden="true"></i></span><span><strong>Lesson ${esc(card.number)} · Reading ${esc(String(card.reading))} · ${esc(card.heading)}</strong><small>${esc(card.minutesText)}</small></span><i class="ri-arrow-down-s-line its01-chevron" aria-hidden="true"></i></summary>
    <div class="its01-lesson-body">
      <h4>What You'll Learn</h4>
      <ul>${card.learn.map((item) => `<li>${its04Text(item)}</li>`).join('')}</ul>
      ${its04Blocks(card.blocks)}
      ${card.comingUp ? `<div class="its01-preview"><i class="ri-arrow-right-circle-line" aria-hidden="true"></i><span><strong>Coming up in your lab:</strong> ${esc(card.comingUp)}</span></div>` : ''}
    </div>
  </details>`;
}

/* ------------------------------------------------------ "Name it" card sort */

/* Twelve cards, each put in a box by a button under the card. A wrong box
 * says why (its line is keyed by the box, and never names the right one) and
 * the student picks again; the right box shows that card's line. No score. It
 * is complete once every card is in its right box. */
const ITS04_CARD_SORT = {
  title: 'Name it card sort',
  intro: 'Read each card, then put it in the box that matches what it is: pick a box under each card. Not graded: a wrong box tells you why, and you try again.',
  buckets: ['Network cable or connector', 'Desk cable or connector', 'Tool'],
  whyNot: {
    'Network cable or connector': 'This box is for what carries the network between a PC, the closet and the internet. This card isn’t one of those.',
    'Desk cable or connector': 'This box is for what a PC, phone, dock or monitor plugs into at the desk. This card isn’t one of those.',
    Tool: 'This box is for what a technician uses to build, test or find cables and networks. This card isn’t one of those.',
  },
  cards: [
    { id: 'rj45', name: 'RJ45 on Cat 6', answer: 'Network cable or connector',
      desc: 'An eight-pin plug on twisted-pair cable.',
      why: 'The office network cable: it carries 1 Gbps to 100 m (Table 2).' },
    { id: 'usbc', name: 'USB-C', answer: 'Desk cable or connector',
      desc: 'A small oval plug on a laptop, phone or dock.',
      why: 'A connector for a device at the desk. Not every USB-C port carries video (Table 2).' },
    { id: 'toner', name: 'Toner probe', answer: 'Tool',
      desc: 'A wand that finds which cable goes to which wall jack.',
      why: 'Network Operations use it to find which cable in the closet goes to which wall jack (Table 3).' },
    { id: 'lc', name: 'LC fiber', answer: 'Network cable or connector',
      desc: 'A small, square, push-in connector on a glass cable.',
      why: 'Fiber carries light, not electricity, and is not troubled by electrical interference (Table 2).' },
    { id: 'hdmi', name: 'HDMI', answer: 'Desk cable or connector',
      desc: 'A wide, flat plug that carries picture and sound to a screen.',
      why: 'A video cable for monitors and docks at the desk (Table 2).' },
    { id: 'tester', name: 'Cable tester', answer: 'Tool',
      desc: 'Checks that every wire is connected, in the right order.',
      why: 'Network Operations use it, and the result comes to you as evidence (Table 3).' },
    { id: 'ftype', name: 'F-type on coax', answer: 'Network cable or connector',
      desc: 'A screw-on connector on a round cable.',
      why: 'Coax with an F-type connector brings cable internet and TV into the building (Table 2).' },
    { id: 'displayport', name: 'DisplayPort', answer: 'Desk cable or connector',
      desc: 'A video plug with one cut corner.',
      why: 'A video cable from a PC to a monitor (Table 2).' },
    { id: 'punchdown', name: 'Punchdown tool', answer: 'Tool',
      desc: 'Presses wires into a patch panel or the back of a wall jack.',
      why: 'Network Operations use it when they finish a cable at the closet or the jack (Table 3).' },
    { id: 'rj11', name: 'RJ11', answer: 'Network cable or connector',
      desc: 'A smaller plug than RJ45, with 2 to 4 wires.',
      why: 'The phone-line plug, and DSL internet uses it (Table 2).' },
    { id: 'lightning', name: 'Lightning', answer: 'Desk cable or connector',
      desc: 'A small charging and data plug on Apple phones.',
      why: 'A connector for a device at the desk (Table 2).' },
    { id: 'analyzer', name: 'Wi-Fi analyzer', answer: 'Tool',
      desc: 'Shows nearby networks, their channels and their signal.',
      why: 'Network Operations use it. The Wi-Fi details screen shows you the same facts for one laptop (Table 3).' },
  ],
  // What each card really is, shown under a wrong box (spec 8.5: a wrong
  // drop explains, in one line, what the card really is).
  really: {
    rj45: 'It’s the plug on office network cable, from the PC to the wall jack.',
    usbc: 'It’s a plug for laptops, phones and docks at the desk.',
    toner: 'It’s what Network Operations use to trace a cable from a wall jack to the closet.',
    lc: 'It’s a fiber connector: network cable that carries light.',
    hdmi: 'It’s a video cable from a PC or dock to a screen.',
    tester: 'It’s what Network Operations use to check a network cable’s wires.',
    ftype: 'It’s the connector on coax, the cable that brings cable internet in.',
    displayport: 'It’s a video cable from a PC or dock to a monitor.',
    punchdown: 'It’s what Network Operations use to press wires into a patch panel or jack.',
    rj11: 'It’s the phone-line plug, which DSL internet uses.',
    lightning: 'It’s the charging and data plug on Apple phones.',
    analyzer: 'It’s what Network Operations use to see the Wi-Fi networks around them.',
  },
};

// A small line drawing on each card, in the text colour (currentColor), so it
// follows the page's theme. Decorative: the card's name and line say it all.
const ITS04_SORT_ART = {
  rj45: '<rect x="14" y="8" width="30" height="24" rx="2"/><path d="M44 14h8v12h-8M18 8v-4h22v4"/><path d="M19 8v8M23 8v8M27 8v8M31 8v8M35 8v8M39 8v8"/>',
  usbc: '<rect x="12" y="13" width="40" height="14" rx="7"/><path d="M20 20h24"/>',
  toner: '<path d="M10 30l34-20"/><rect x="40" y="4" width="14" height="10" rx="3" transform="rotate(-30 47 9)"/><path d="M8 34l4-6"/>',
  lc: '<rect x="10" y="12" width="16" height="16" rx="2"/><rect x="38" y="12" width="16" height="16" rx="2"/><path d="M26 20h12M18 28v6M46 28v6"/>',
  hdmi: '<path d="M10 12h44l-5 16H15z"/><path d="M18 19h28"/>',
  tester: '<rect x="12" y="6" width="40" height="28" rx="3"/><circle cx="22" cy="16" r="2"/><circle cx="32" cy="16" r="2"/><circle cx="42" cy="16" r="2"/><path d="M18 28h10M36 28h10"/>',
  ftype: '<path d="M22 10h20l6 10-6 10H22l-6-10z"/><circle cx="32" cy="20" r="4"/><path d="M48 20h10"/>',
  displayport: '<path d="M12 12h40v16H18l-6-6z"/><path d="M20 20h24"/>',
  punchdown: '<rect x="8" y="14" width="30" height="12" rx="5"/><path d="M38 20h14l4 -3M52 20l4 3"/>',
  rj11: '<rect x="20" y="10" width="22" height="20" rx="2"/><path d="M42 15h6v10h-6"/><path d="M26 10v6M30 10v6M34 10v6M38 10v6"/>',
  lightning: '<rect x="8" y="14" width="22" height="12" rx="3"/><rect x="30" y="16" width="24" height="8" rx="4"/>',
  analyzer: '<rect x="16" y="6" width="32" height="28" rx="3"/><path d="M24 22a10 10 0 0 1 16 0M27 25a6 6 0 0 1 10 0"/><circle cx="32" cy="28" r="1.5"/>',
};

/* ------------------------------------------------------- Knowledge checks */

/* Two checks, each answered one question at a time. A right pick shows its why
 * line, a wrong pick shows its ifWrong line (never the right answer). ifWrong
 * is keyed by the choice's place in the data and has null on the right answer.
 * The choices are shuffled per student, per question and per attempt
 * (its04ChoiceOrder), so no line refers to a choice by its letter.
 *   - learn: six program questions, after Reading 3. Complete at 5 of 6.
 *   - aplus: ten questions on A+ Core 1 objectives 2.1, 2.2, 2.4, 2.5, 2.6,
 *     2.7, 2.8 and 3.2 (one each) and 5.5 (two), after Reading 5. Complete at
 *     7 of 10. */
const ITS04_CHECKS = {
  learn: {
    title: 'Learn It knowledge check',
    intro: 'Six questions on this module’s readings so far and on plain-language replies (Module 3): the connectivity checklist, reading command output, and what goes in a customer comment. They are program checks, not A+ questions. It’s complete when 5 of your first answers are right. Retake it as often as you like.',
    questions: [
      { q: 'A new starter says, “My computer says there’s no internet. The person next to me is fine.” What do you check first?',
        choices: ['The DNS servers in `ipconfig /all`', 'Whether there’s a link: the cable, the wall jack and the light next to the network port', 'The DHCP scope on the server', 'The proxy settings'], answer: 1,
        why: 'The checklist starts with one-or-many (here, one) and then the link. With no link there is no address problem to look at yet (Reading 3, Table 6).',
        ifWrong: ['This comes later, once there’s a link and an address.', null, 'A scope is a many-users question, and it’s Server & Identity’s.', 'This comes later, once there’s a link and an address.'] },
      { q: 'Four people on the same floor report “the internet is really slow” within ten minutes. What should you do?',
        choices: ['Work each ticket separately, oldest first', 'Link them to one parent ticket and escalate the parent with the area, the start time and the evidence', 'Restart the floor’s switch', 'Tell them to restart their laptops'], answer: 1,
        why: 'Many people in one place point at something shared. One parent carries the escalation and every update (Module 2’s linking, KB-0063 and KB-0108).',
        ifWrong: ['This hides the pattern and wastes time.', null, 'Restarting shared equipment drops everyone on it and is Network Operations’ decision.', 'Four laptops didn’t break at once.'] },
      { q: 'You’re about to change a setting on a user’s PC. What do you do first?',
        choices: ['Change it and check whether it helps', 'Write down what the setting is now and tell the user what you’re about to change', 'Ask Tier 2 for permission', 'Restart the PC'], answer: 1,
        why: 'Recording the old value means you can put it back, and the next technician can see what changed. Telling the user is respect, and it stops surprises (Reading 3).',
        ifWrong: ['This loses the original value.', null, 'A Tier 1 change on the user’s own PC doesn’t need Tier 2.', 'A restart changes nothing about the setting.'] },
      { q: 'A user’s Teams calls break up and freeze, but web pages and email feel fine. Which network symptoms fit best?',
        choices: ['APIPA', 'Jitter and high latency', 'A DNS failure', 'A duplicate MAC address'], answer: 1,
        why: 'Voice and video need steady, fast replies. Replies that arrive late (latency) or unevenly (jitter) break up calls while a web page just loads a little slower (Reading 3).',
        ifWrong: ['With APIPA nothing works at all.', null, 'A DNS failure stops names from working, not calls from flowing.', 'A duplicate MAC is rare and drops the connection entirely.'] },
      { q: '`ping intranet.northstar.example` shows `[10.20.0.45]` and times out. `nslookup intranet.northstar.example` returns `10.20.0.50`. What’s most likely?',
        choices: ['The intranet server is down', 'The PC has an old answer cached, so `ipconfig /flushdns` should fix it', 'The DNS server is wrong', 'The network cable is faulty'], answer: 1,
        why: '`ping` uses the PC’s cache; `nslookup` asks the DNS server. Two addresses for one name means the PC remembered an old one (Reading 4, Table 7).',
        ifWrong: ['This wouldn’t give two different addresses.', null, 'The DNS server gave the right, new address.', 'This wouldn’t give two different addresses.'] },
      { q: 'Which line belongs in the **customer comment**, not the work note?',
        choices: ['“DHCP lease renewed; APIPA cleared; gateway 10.20.10.1 replies.”', '“Your computer hadn’t picked up its network address, so it couldn’t reach anything. It has one now, and everything’s working.”', '“Jack 2F-14 not patched at port 2-14.”', '“Escalated to Network Operations.”'], answer: 1,
        why: 'A customer comment says what happened in plain words and what happens next; the technical evidence goes in the work note (Module 3, Reading 5).',
        ifWrong: ['This is evidence for the next technician.', null, 'This is evidence for the next technician.', 'This is part of the note’s Next action; the user hears “our network team will connect your desk’s socket”.'] },
    ],
  },
  aplus: {
    title: 'A+ check (Core 1: 2.1, 2.2, 2.4, 2.5, 2.6, 2.7, 2.8, 3.2, 5.5)',
    intro: 'Ten questions in the style of the A+ Core 1 exam, on networking: ports and protocols (2.1), wireless (2.2), VPN (2.4), hardware (2.5), IP addressing (2.6), internet connection types (2.7), network tools (2.8), cables and connectors (3.2) and troubleshooting network issues (5.5, two questions). It’s complete when 7 of your first answers are right. Retake it as often as you like.',
    questions: [
      { q: 'A workstation shows the address 169.254.12.40. What does it mean?',
        choices: ['Someone set a static address', 'The PC couldn’t get an address from DHCP', 'The PC is using IPv6', 'The DNS server is wrong'], answer: 1,
        why: '169.254.x.x is APIPA, the address Windows gives itself when no DHCP server answers (Reading 2, Table 5).',
        ifWrong: ['A static address is whatever someone typed, and it’s rarely 169.254.', null, 'IPv6 addresses are written in hex with colons.', 'DNS problems don’t change the address.'] },
      { q: 'A user can reach a server by its IP address but not by its name. What’s the most likely cause?',
        choices: ['DHCP', 'DNS', 'A bad cable', 'The wrong subnet mask'], answer: 1,
        why: 'DNS turns names into addresses; if the address works and the name doesn’t, the name lookup is the problem (Reading 3).',
        ifWrong: ['This would stop the address from working too.', null, 'This would stop the address from working too.', 'This would stop the address from working too.'] },
      { q: 'Which port does a Windows file share (SMB) use?',
        choices: ['443', '3389', '445', '53'], answer: 2,
        why: 'SMB uses TCP 445, which is why `Test-NetConnection NS-FILE01 -Port 445` tells you whether the file service answers (Table 8; Module 07).',
        ifWrong: ['443 is HTTPS.', '3389 is Remote Desktop.', null, '53 is DNS.'] },
      { q: 'In a crowded office, a user’s Wi-Fi is slow on 2.4 GHz. The laptop and the access point both support 5 GHz. What should you recommend?',
        choices: ['Stay on 2.4 GHz for its range', 'Connect on the 5 GHz band', 'Switch to WEP', 'Turn off the firewall'], answer: 1,
        why: '5 GHz has more channels and less interference; 2.4 GHz has only three that don’t overlap and shares the air with microwaves and Bluetooth (Table 9).',
        ifWrong: ['Range doesn’t help a crowded band.', null, 'WEP is broken security and changes nothing about speed.', 'The firewall isn’t the cause, and Tier 1 never turns it off.'] },
      { q: 'A new access point must go on a ceiling with no power outlet nearby. What lets it run from its network cable alone?',
        choices: ['A patch panel', 'Power over Ethernet (a PoE switch or injector)', 'A cable modem', 'A loopback plug'], answer: 1,
        why: 'PoE sends power down the same cable as the data (Table 1).',
        ifWrong: ['A patch panel only connects cables.', null, 'A modem brings in the internet.', 'A loopback plug tests a port.'] },
      { q: 'Which is a **private** IPv4 address?',
        choices: ['8.8.8.8', '172.20.4.10', '169.254.10.5', '64.233.160.1'], answer: 1,
        why: 'The private ranges are 10.x.x.x, 172.16–31.x.x and 192.168.x.x (Table 5).',
        ifWrong: ['This is a public internet address.', null, 'This is APIPA, not a range a network hands out.', 'This is a public internet address.'] },
      { q: 'A rural site has no cable or fiber. It gets internet through a fixed outdoor antenna pointed at the provider’s tower. Which connection type is this?',
        choices: ['DSL', 'Satellite', 'WISP', 'A cellular hotspot'], answer: 2,
        why: 'A wireless internet service provider uses a fixed antenna aimed at its tower (Table 4).',
        ifWrong: ['DSL uses the phone line.', 'Satellite uses a dish aimed at the sky.', null, 'A hotspot shares a phone’s cellular data.'] },
      { q: 'A technician needs to find which patch-panel port an unlabelled wall jack is wired to. Which tool is it?',
        choices: ['A loopback plug', 'A toner probe', 'A crimper', 'A Wi-Fi analyzer'], answer: 1,
        why: 'A toner probe puts a tone on the cable at the jack and finds it in the closet (Table 3).',
        ifWrong: ['This tests a port.', null, 'This puts connectors on cables.', 'This shows wireless networks.'] },
      { q: 'A new cable run must carry 10 Gbps over 90 metres. Which cable meets it?',
        choices: ['Cat 5e', 'Cat 6', 'Cat 6a', 'RG6 coax'], answer: 2,
        why: 'Cat 6a carries 10 Gbps to 100 m (Table 2).',
        ifWrong: ['Cat 5e tops out at 1 Gbps.', 'Cat 6 carries 10 Gbps only to about 55 m.', null, 'RG6 is for cable internet and TV.'] },
      { q: 'A user works from home. Websites and email work, but the company intranet and file shares “can’t be found”. `ipconfig /all` shows the DNS server is 192.168.0.1. What should they do first?',
        choices: ['Flush the DNS cache', 'Connect the company VPN', 'Release and renew the address', 'Rejoin the domain'], answer: 1,
        why: 'At home the laptop uses the home router’s DNS, which doesn’t know company names. The VPN connects to the company network and brings company DNS with it (Reading 5).',
        ifWrong: ['The cache isn’t the problem: the home DNS never knew the names.', null, 'The home address is fine for the internet.', 'The laptop is still joined; it just can’t reach the company.'] },
    ],
  },
};

/* ------------------------------------------------------- Objective, sources */

// The weekly objective, shown in the hero.
const ITS04_OBJECTIVE = 'By the end of this module you can trace a user’s connection from the desk to the internet and check the physical link first: the link light, the wall jack, the Wi-Fi band. You can work any “can’t connect” ticket with the same six-question checklist, and read `ipconfig`, `ping`, `tracert`, `nslookup` and `Test-NetConnection` output. You can spot an APIPA address and a stale DNS answer on sight, tell one person’s problem from a whole site’s, help with personal phones on Wi-Fi and with the VPN, join a computer to the domain in the right place, and explain all of it in plain language. A+ Core 1: **2.1** TCP and UDP ports and protocols · **2.2** wireless networking technologies · **2.4** network configuration concepts (VPN) · **2.5** networking hardware · **2.6** SOHO network configuration and IP addressing · **2.7** internet connection types and network types · **2.8** networking tools · **3.2** cable types and connectors · **5.5** troubleshoot network issues. Competencies: **2** Practical networking · **3** Ticketing discipline · **7** Communication under pressure; practised: **9** Triage and escalation judgment.';

const ITS04_SOURCES = [
  { title: 'ipconfig', org: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ipconfig', note: 'Every switch of the command you use most in this module, including /all, /release, /renew and /flushdns.' },
  { title: 'nslookup', org: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup', note: 'How nslookup asks a DNS server directly, and how to read its answer.' },
  { title: 'Test-NetConnection', org: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/powershell/module/nettcpip/test-netconnection', note: 'Testing whether a service is listening on a port, from a Windows PC.' },
  { title: 'TCP/IP addressing and subnetting', org: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/troubleshoot/windows-client/networking/tcpip-addressing-and-subnetting', note: 'Addresses, masks and default gateways, explained for Windows support.' },
];

/* ----------------------------------------------------------- Page state */

// Saved to the student's account (module_progress.case_state): each check's
// and the card sort's "complete" and its time, and whether the walkthrough was
// started. Never answers or a score.
const ITS04_STATE_ID = 'its04-page-v1';
// Since 2026-11-27 Module 9's Prove It gates completion (the its04 Prove It
// migration) and Lab 9.1 is Practice It. It keeps its course_module_labs
// row, so its walkthrough record still saves. The practice tickets lab has
// its own lab key, and so has the Prove It.
const ITS04_LAB1_KEY = 'lab-its-04-connectivity';
const ITS04_PRACTICE_KEY = 'lab-its-04-practice-tickets';
const ITS04_PROVE_KEY = 'lab-its-04-prove-it';
const ITS04_LAB_KEYS = [ITS04_LAB1_KEY, ITS04_PRACTICE_KEY, ITS04_PROVE_KEY];
const ITS04_COACH_ID = 'hd-m04';
const ITS04_LAB1_START = 'Start Lab 9.1 walkthrough';

const ITS04_DEFAULT_STATE = {
  consoleStarted: false, consoleCompleted: false,
  cardSortCompleted: false, cardSortCompletedAt: null,
  learnCheckCompleted: false, learnCheckCompletedAt: null,
  aplusCheckCompleted: false, aplusCheckCompletedAt: null,
};

let its04State = null;
let its04User = null;

function its04Load(user) {
  // Check answers and card sort picks live in page memory: a different
  // student signing in without a reload starts every one fresh.
  const userId = user && user.userId;
  if (userId !== its04CheckAnswersUser) {
    its04CheckAnswersUser = userId;
    Object.keys(its04CheckAnswers).forEach((key) => {
      its04CheckAnswers[key] = {};
      its04CheckPicks[key] = {};
      its04CheckAttempt[key] = 0;
    });
    Object.keys(its04CheckSaveFailed).forEach((key) => { its04CheckSaveFailed[key] = false; });
    its04SortPicks = {};
  }
  its04User = user;
  its04State = LabRuntime.loadCaseState(ITS04_STATE_ID, 'its-04', user, ITS04_DEFAULT_STATE);
  // The simulator's popup message is the only way a walkthrough is recorded;
  // a return by link only shows that it wasn't (see itsNoteCoachReturn).
  itsNoteCoachReturn(user, ITS04_COACH_ID, [ITS04_LAB1_KEY]);
  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'it-support', 'its-04');
  return its04State;
}

function its04Save(onResult) {
  if (its04User && its04State) LabRuntime.saveCaseState(ITS04_STATE_ID, 'its-04', its04User, its04State, onResult ? { onResult } : {});
}

function its04Day(iso) {
  const date = iso ? new Date(iso) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
}

// A lab's minutes, from the course data (LABS in portal/data.js).
function its04LabMinutes(labKey) {
  const lab = typeof LABS !== 'undefined' ? LABS.find((item) => item.key === labKey) : null;
  return lab && lab.instructionalMinutes ? lab.instructionalMinutes : 0;
}

/* ------------------------------------------------------- Knowledge checks */

/* One question at a time, as on Module 1. A wrong pick shows why that choice is
 * wrong, never the right answer, and the student picks again. A right pick
 * shows the Why. Only the first pick on each question counts. A check is
 * complete the first time a full pass of first picks is 70% or more (whole
 * numbers only: correct x 10 >= total x 7), so 5 of 6 on the Learn It check
 * and 7 of 10 on the A+ check. Once complete it stays complete; Start again is
 * a retake. No lab attempt, no lab key, gates nothing. */
const ITS04_LETTERS = ['A', 'B', 'C', 'D'];
const ITS04_CHECK_PASS_TENTHS = 7;
// The saved completion fields for each check, and for the card sort.
const ITS04_CHECK_SAVED = {
  learn: ['learnCheckCompleted', 'learnCheckCompletedAt'],
  aplus: ['aplusCheckCompleted', 'aplusCheckCompletedAt'],
  sort: ['cardSortCompleted', 'cardSortCompletedAt'],
};

// This page's picks, by check, kept in page memory only (a reload starts
// every check again), by the choice's place in the data (not the place shown):
//   its04CheckAnswers: { questionIndex: the first pick }, the one that counts.
//   its04CheckPicks: { questionIndex: [every pick, in order] }.
//   its04CheckAttempt: how many times the check was started again; it is part
//   of the shuffle, so a retake shows the choices in a new order.
//   its04SortPicks: { cardId: [every box picked, in order] } for the card sort.
const its04CheckAnswers = { learn: {}, aplus: {} };
const its04CheckPicks = { learn: {}, aplus: {} };
// Activities whose completion the account reported it didn't save (page memory).
const its04CheckSaveFailed = { learn: false, aplus: false, sort: false };
const its04CheckAttempt = { learn: 0, aplus: 0 };
let its04SortPicks = {};
let its04CheckAnswersUser = null;

// The order a student sees a question's choices in: shuffled from their
// anonymous id, the check, the question and the attempt, so it differs between
// students and between retakes, and stays the same for one student on every
// redraw and reload of the same attempt.
function its04ChoiceOrder(checkId, index) {
  const question = ITS04_CHECKS[checkId].questions[index];
  const seed = `${its04User ? LabRuntime.anonymousStudentId(its04User) : ''}|its-04|${checkId}|${index}|${its04CheckAttempt[checkId]}`;
  let n = 2166136261;
  for (const ch of seed) n = Math.imul(n ^ ch.charCodeAt(0), 16777619) >>> 0;
  const order = question.choices.map((_, c) => c);
  for (let i = order.length - 1; i > 0; i -= 1) {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    const j = Math.floor((n / 4294967296) * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

// Every question has a first pick: a full pass, ready to count.
function its04CheckDone(checkId) {
  return ITS04_CHECKS[checkId].questions.every((_, i) => Object.prototype.hasOwnProperty.call(its04CheckAnswers[checkId], i));
}
function its04CheckRightCount(checkId) {
  return ITS04_CHECKS[checkId].questions.filter((question, i) => its04CheckAnswers[checkId][i] === question.answer).length;
}
// Whole numbers only, so 6 of 10 (60%) or 4 of 6 (66.7%) can never round
// up to a pass.
function its04CheckPassed(checkId) {
  const total = ITS04_CHECKS[checkId].questions.length;
  return its04CheckRightCount(checkId) * 10 >= total * ITS04_CHECK_PASS_TENTHS;
}
// How many first picks a full pass needs.
function its04CheckNeeded(checkId) {
  return Math.ceil((ITS04_CHECKS[checkId].questions.length * ITS04_CHECK_PASS_TENTHS) / 10);
}
// A check or the card sort is saved as complete.
function its04CheckCompleted(checkId) {
  return Boolean(its04State && its04State[ITS04_CHECK_SAVED[checkId][0]] === true);
}
// The card sort is done once every card is in its right box.
function its04SortDone() {
  return ITS04_CARD_SORT.cards.every((card) => (its04SortPicks[card.id] || []).includes(card.answer));
}
// An activity ready to save: a full passing check, or a finished card sort.
function its04Ready(checkId) {
  return checkId === 'sort' ? its04SortDone() : its04CheckDone(checkId) && its04CheckPassed(checkId);
}

function its04CheckQuestion(checkId, question, index) {
  const picks = its04CheckPicks[checkId][index] || [];
  const last = picks.length ? picks[picks.length - 1] : undefined;
  const settled = picks.includes(question.answer);
  // Only the student's own picks are marked: a wrong pick never marks or
  // names the right answer. data-choice stays the data index; the letter
  // comes from the place the choice is shown in.
  const choices = its04ChoiceOrder(checkId, index).map((c, place) => {
    const picked = picks.includes(c);
    const cls = picked ? (c === question.answer ? ' is-answer' : ' is-wrong') : '';
    return `<button type="button" class="its01-choice${cls}" data-its04-answer data-check="${checkId}" data-q="${index}" data-choice="${c}" aria-pressed="${picked}" ${settled || picked ? 'disabled' : ''}><span>${ITS04_LETTERS[place]}</span> ${its04Text(question.choices[c])}</button>`;
  }).join('');
  const why = settled && question.why ? `<p class="its01-check-why">${its04Text(question.why)}</p>` : '';
  const wrongLine = !settled && last !== undefined && question.ifWrong && question.ifWrong[last] ? `<p class="its01-check-why">${its04Text(question.ifWrong[last])}</p>` : '';
  const feedback = last === undefined ? ''
    : settled
      ? `<p class="its01-check-result is-right"><i class="ri-check-line" aria-hidden="true"></i> <strong>Correct.</strong></p>${why}`
      : `<p class="its01-check-result is-wrong"><i class="ri-close-line" aria-hidden="true"></i> <strong>Not quite.</strong> Try another answer.</p>${wrongLine}`;
  return `<li class="its01-check-q">
    <p class="its01-check-prompt" id="its04-${checkId}-q${index}">${its04Text(question.q)}</p>
    <div class="its01-choices" role="group" aria-labelledby="its04-${checkId}-q${index}">${choices}</div>
    <div class="its01-check-feedback" id="its04-${checkId}-q${index}-feedback" tabindex="-1" aria-live="polite">${feedback}</div>
  </li>`;
}

// The status line: a completion the account didn't save asks to try the save
// again; a failed full pass asks for a retake (no score shown); otherwise a
// saved completion shows with its date.
function its04CheckFooter(checkId) {
  const anyAnswered = Object.keys(its04CheckAnswers[checkId]).length > 0;
  const reset = anyAnswered ? `<button type="button" class="its01-check-reset" data-its04-check-reset="${checkId}"><i class="ri-restart-line" aria-hidden="true"></i> Start again</button>` : '';
  const saveFailed = its04CheckSaveFailed[checkId] && its04CheckDone(checkId) && its04CheckPassed(checkId);
  const retry = saveFailed ? `<button type="button" class="its01-check-reset" data-its04-check-retry="${checkId}"><i class="ri-refresh-line" aria-hidden="true"></i> Try again</button>` : '';
  let status = '';
  if (saveFailed) {
    status = '<i class="ri-error-warning-line" aria-hidden="true"></i> Your result didn’t save. Try again.';
  } else if (its04CheckDone(checkId) && !its04CheckPassed(checkId)) {
    status = `Retake: you need ${its04CheckNeeded(checkId)} of ${ITS04_CHECKS[checkId].questions.length}. Press Start again to retake the check.`;
  } else if (its04CheckCompleted(checkId)) {
    const day = its04Day(its04State[ITS04_CHECK_SAVED[checkId][1]]);
    status = `<i class="ri-check-line" aria-hidden="true"></i> ${esc(ITS04_CHECKS[checkId].title)} complete${day ? ` (${esc(day)})` : ''}. You can retake it any time.`;
  }
  return `<div class="its01-check-footer" data-its04-check-footer="${checkId}"><p class="its01-check-status" role="status" tabindex="-1">${status}</p><span class="its01-check-actions">${retry}${reset}</span></div>`;
}

function its04Check(checkId) {
  const check = ITS04_CHECKS[checkId];
  return `<div class="its01-check" data-its04-check="${checkId}" id="its04-check-${checkId}">
    <h3>${esc(check.title)}</h3>
    <p class="its01-instruction">${esc(check.intro)}</p>
    <p class="its01-instruction">Choose an answer. A wrong answer tells you why it’s wrong, and you try again; a right one tells you why it’s right. Your first answer to each question is the one that counts. Not graded: your answers aren’t sent to your instructor, and only that you completed the check is saved to your account.</p>
    <ol class="its01-check-list">${check.questions.map((question, i) => its04CheckQuestion(checkId, question, i)).join('')}</ol>
    ${its04CheckFooter(checkId)}
  </div>`;
}

// One card of the card sort: its name and one line about it, then one row of
// box buttons. A wrong box says why and the student picks again; the right
// box shows the card's line and settles it. Feedback only, no score.
function its04SortCard(card) {
  const picks = its04SortPicks[card.id] || [];
  const last = picks.length ? picks[picks.length - 1] : undefined;
  const settled = picks.includes(card.answer);
  const lid = `its04-sort-${card.id}`;
  const buttons = ITS04_CARD_SORT.buckets.map((bucket) => {
    const picked = picks.includes(bucket);
    const cls = picked ? (bucket === card.answer ? ' is-answer' : ' is-wrong') : '';
    return `<button type="button" class="its01-choice its02-sort-box${cls}" data-its04-sort="${esc(card.id)}" data-bucket="${esc(bucket)}" aria-pressed="${picked}" ${settled || picked ? 'disabled' : ''}>${esc(bucket)}</button>`;
  }).join('');
  const feedback = last === undefined ? ''
    : settled
      ? `<p class="its01-check-result is-right"><i class="ri-check-line" aria-hidden="true"></i> <strong>Right box: ${esc(card.answer)}.</strong></p><p class="its01-check-why">${esc(card.why)}</p>`
      : `<p class="its01-check-result is-wrong"><i class="ri-close-line" aria-hidden="true"></i> <strong>Not this box.</strong> Try another.</p><p class="its01-check-why">${esc(ITS04_CARD_SORT.whyNot[last] || '')} ${esc(ITS04_CARD_SORT.really[card.id] || '')}</p>`;
  const art = ITS04_SORT_ART[card.id];
  return `<li class="its02-sort-card">
    ${art ? `<svg class="its04-sort-art" viewBox="0 0 64 40" aria-hidden="true" focusable="false">${art}</svg>` : ''}
    <p class="its01-check-prompt" id="${lid}">${esc(card.name)}</p>
    <p class="its04-sort-desc">${esc(card.desc)}</p>
    <div class="its02-sort-boxes" role="group" aria-labelledby="${lid}">${buttons}</div>
    <div class="its01-check-feedback" id="${lid}-feedback" tabindex="-1" aria-live="polite">${feedback}</div>
  </li>`;
}

// The card sort's status line: the same kinds as a check's, with no score.
function its04SortFooter() {
  const anyAnswered = Object.keys(its04SortPicks).length > 0;
  const reset = anyAnswered ? '<button type="button" class="its01-check-reset" data-its04-sort-reset><i class="ri-restart-line" aria-hidden="true"></i> Start again</button>' : '';
  const saveFailed = its04CheckSaveFailed.sort && its04SortDone();
  const retry = saveFailed ? '<button type="button" class="its01-check-reset" data-its04-check-retry="sort"><i class="ri-refresh-line" aria-hidden="true"></i> Try again</button>' : '';
  let status = '';
  if (saveFailed) {
    status = '<i class="ri-error-warning-line" aria-hidden="true"></i> Your result didn’t save. Try again.';
  } else if (its04CheckCompleted('sort')) {
    const day = its04Day(its04State[ITS04_CHECK_SAVED.sort[1]]);
    status = `<i class="ri-check-line" aria-hidden="true"></i> ${esc(ITS04_CARD_SORT.title)} complete${day ? ` (${esc(day)})` : ''}. You can do it again any time.`;
  }
  return `<div class="its01-check-footer" data-its04-check-footer="sort"><p class="its01-check-status" role="status" tabindex="-1">${status}</p><span class="its01-check-actions">${retry}${reset}</span></div>`;
}

function its04CardSort() {
  return `<div class="its01-check its02-sort" data-its04-cardsort id="its04-cardsort">
    <h3>${esc(ITS04_CARD_SORT.title)}</h3>
    <p class="its01-instruction">${esc(ITS04_CARD_SORT.intro)}</p>
    <ul class="its02-sort-list">${ITS04_CARD_SORT.cards.map(its04SortCard).join('')}</ul>
    ${its04SortFooter()}
  </div>`;
}

/* ------------------------------------------------------------- Sections */

// Each check sits right after the reading card it follows (as on Module 1's
// page), outside the card, so a rail link to it never lands inside a closed
// card. The Learn It check comes after Reading 3 and the A+ check after
// Reading 5.
const ITS04_CHECK_AFTER_READING = { 3: ['learn'], 5: ['aplus'] };

function its04Learn() {
  return `<section class="its01-section" id="its04-lessons" aria-labelledby="its04-lessons-title">
    <div class="its01-section-heading"><span>L</span><div><p class="its01-kicker">Learn It</p><h2 id="its04-lessons-title">Lessons 9.1 to 9.4</h2></div></div>
    <p class="its01-instruction">Four lessons and five readings. Lesson 9.1 has two readings that share its time. Open each reading for its text, tables and diagram. The Name it card sort is in Reading 1. The Learn It check comes after Reading 3, and the A+ check after Reading 5.</p>
    ${its04Cards().map((card) => `<div class="its01-lesson-grid">${its04LessonCard(card)}</div>${(ITS04_CHECK_AFTER_READING[card.reading] || []).map(its04Check).join('')}`).join('')}
  </section>`;
}

// Lab 9.1: the hd-m04 coach on two tickets (HD-2212 and HD-2213) and a
// request (SR-2222, RITM0010164) in the IT Service Desk simulator
// (ui/helpdesk-coaches.js). Feedback only: no score.
function its04Lab1() {
  const button = itsWalkthroughButton(its04User, [ITS04_LAB1_KEY]);
  return `<section class="its01-section its01-lab-section" id="its04-lab-9-1" aria-labelledby="its04-lab-9-1-title">
    <div class="its01-section-heading"><span>1</span><div><p class="its01-kicker">Practice It · coached</p><h2 id="its04-lab-9-1-title">${esc(itsLabTitle(ITS04_LAB1_KEY))}</h2></div></div>
    <p class="its01-instruction">${its04Text('It is Thursday morning at the Service Desk. In the IT Service Desk simulator you work two calls and a request with the connectivity checklist. Part A is HD-2212: Jonah Pryce started today in Purchasing, and his desk PC says there’s no internet. You find out whether it is one person or many, check the link, read the floor 2 network closet, move him to a working jack, renew his address, test the path and the services, and hand the dead jack to Network Operations. Part B is HD-2213: Farah Qureshi’s docked laptop can’t open the intranet, though the person beside her can. You read both adapters and the Wi-Fi, compare `ping` with `nslookup`, find this morning’s change, clear the old answer and prove the fix. Part C is SR-2222 (RITM0010164): you join Kenji Watanabe’s new laptop to the domain with the provisioning account, in the Logistics OU, and check it in Active Directory. A coach guides you through each step.')}</p>
    <p class="its01-instruction">The coach names the goal of each typed step; open Show me the command if you need it. Practice: not graded. Feedback only, no score.</p>
    <p class="its01-instruction" data-its04-lab-minutes>Time: ${formatInstructionalMinutes(its04LabMinutes(ITS04_LAB1_KEY))}</p>
    <a class="itsw-evidence-button" data-its04-console-launch href="${esc(itsCoachLaunchHref(ITS04_COACH_ID, its04User))}" target="_blank" rel="opener">
      <i class="${button.icon}" aria-hidden="true"></i> ${{ redo: 'Redo the walkthrough', review: 'Review the walkthrough', start: ITS04_LAB1_START }[button.mode]}
    </a>
    ${itsWalkthroughNoticeHtml(its04User, ITS04_COACH_ID, [ITS04_LAB1_KEY], ITS04_LAB1_START)}
    ${itsLabStatusHtml(its04User, ITS04_LAB1_KEY, { label: 'Lab 9.1', prefix: 'its01', pendingText: 'Complete the guided walkthrough in the simulator to finish this lab.' })}
    ${itsRedoNoticeHtml(its04User, [{ key: ITS04_LAB1_KEY, action: 'Run the walkthrough again to resubmit this lab.' }])}
  </section>`;
}

// Lab 9.2, the module's five unguided tickets, not graded: the simulator opens
// just these tickets in their own saved shift (?practice=its-04,
// ui/helpdesk.js), with feedback but no score. Opened with an opener, so once
// all five are done the simulator can report it (its04ReceivePracticeCompletion).
function its04PracticeTicketsHref(user) {
  const student = typeof LabRuntime !== 'undefined' ? LabRuntime.anonymousStudentId(user) : '';
  return `${SIM_ORIGIN}?practice=its-04&student=${encodeURIComponent(student)}#/helpdesk/tickets`;
}
function its04PracticeTickets() {
  return `<section class="its01-section its01-lab-section" id="its04-lab-9-2" aria-labelledby="its04-lab-9-2-title">
    <div class="its01-section-heading"><span>2</span><div><p class="its01-kicker">Practice It · on your own</p><h2 id="its04-lab-9-2-title">${esc(itsLabTitle(ITS04_PRACTICE_KEY))}</h2></div></div>
    <p class="its01-instruction">Five tickets on your own in the IT Service Desk simulator, in the same queue: 9-A, Teams calls that keep breaking up; 9-B, the internet crawling for a whole site (it arrives with three more tickets about it); 9-C, a new starter’s laptop that won’t join the domain; 9-D, a phone that won’t connect to the work Wi-Fi; 9-E, a remote worker who can’t open the Sales drive from home. Work each to Resolved (or handed to the right team), with “Check my work” feedback and no score.</p>
    <p class="its01-instruction">Practice: not graded. Your answers aren’t sent. Finish all five tickets: work each one to Resolved, or hand it to the right team, and give it your work note. Check my work shows what is still missing. The simulator then tells this page, and your account records that you completed Lab 9.2.</p>
    <p class="its01-instruction" data-its04-lab-minutes>Time: ${formatInstructionalMinutes(its04LabMinutes(ITS04_PRACTICE_KEY))}</p>
    <a class="itsw-evidence-button" data-its04-practice-launch href="${esc(its04PracticeTicketsHref(its04User))}" target="_blank" rel="opener">
      <i class="ri-play-list-line" aria-hidden="true"></i> Open the practice tickets
    </a>
    ${itsLabStatusHtml(its04User, ITS04_PRACTICE_KEY, { label: 'Lab 9.2', prefix: 'its01', pendingText: 'Finish all five tickets: work each to Resolved, or hand it to the right team, and give it your work note.' })}
  </section>`;
}

// Module 9's Prove It, on Module 8's pattern: a new ticket in the simulator
// (the its-04 Prove shift, itsProveLaunchHref), reviewed by the instructor.
// Practice It is recommended first, never required. A submitted attempt has
// nothing left to open. What it shows comes from the server's attempt
// (itsLabStatus); the simulator reports back by message (itsProveReceiveMessage).
function its04Prove() {
  const user = its04User;
  const returned = itsLabReturned(user, ITS04_PROVE_KEY);
  return `<section class="its01-section its01-lab-section" id="its04-prove-it" aria-labelledby="its04-prove-it-title">
    <div class="its01-section-heading"><span>3</span><div><p class="its01-kicker">Prove It · Assessment Lab · instructor reviewed</p><h2 id="its04-prove-it-title">${esc(itsLabTitle(ITS04_PROVE_KEY))}</h2></div></div>
    <p class="its01-instruction">Work a new ticket on your own in the IT Service Desk simulator: no coach, no hints and no feedback before you submit. Set the ticket fields, chat with the user, check the laptop with the connectivity checklist, fix what is yours to fix, and write a key finding, a work note and a reply. Type the checklist’s commands in PowerShell: the commands you type are part of your evidence. Plan on about 35 minutes. Your instructor reviews your work.</p>
    <p class="its01-instruction" data-its04-lab-minutes>Time: ${formatInstructionalMinutes(its04LabMinutes(ITS04_PROVE_KEY))}</p>
    ${itsLabRail(user, [ITS04_LAB1_KEY]).isComplete ? '' : '<p class="its01-instruction">Work Lab 9.1, the guided lab, first: it prepares you for this.</p>'}
    ${itsLabSubmitted(user, ITS04_PROVE_KEY) ? '' : `<a class="itsw-evidence-button" data-its04-prove-launch href="${esc(itsProveLaunchHref('its-04', user))}" target="_blank" rel="opener">
      <i class="${returned ? 'ri-restart-line' : 'ri-terminal-box-line'}" aria-hidden="true"></i> ${returned ? 'Reopen the Prove It' : 'Start the Prove It'}
    </a>`}
    ${itsLabStatusHtml(user, ITS04_PROVE_KEY, { label: 'Prove It', prefix: 'its01', pendingText: 'Press Submit in the simulator when you finish the ticket.' })}
    ${itsLabStatus(user, ITS04_PROVE_KEY) === 'passed' && typeof markedLabLinkHtml === 'function' ? `<p>${markedLabLinkHtml(ITS04_PROVE_KEY, 'See your score and feedback')}</p>` : ''}
    ${itsRedoNoticeHtml(user, [{ key: ITS04_PROVE_KEY, action: 'Reopen the Prove It, make your changes, then press Resubmit in the simulator. You can resubmit once for each return.' }])}
  </section>`;
}
// A Prove It message changed the attempt: show it if this page is open.
function its04ProveChanged() {
  if (document.querySelector('.its04-shell')) render();
}

function its04Sources() {
  return `<div class="msources-block">
    <h3 class="msources-title">Further Reading</h3>
    <ul class="msources-list">
      ${ITS04_SOURCES.map((source) => `<li class="msources-item">
        <a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer" class="msources-link"><span class="msources-title-text">${esc(source.title)}</span><span class="msources-org">${esc(source.org)}</span></a>
        ${source.note ? `<p class="msources-note">${esc(source.note)}</p>` : ''}
      </li>`).join('')}
    </ul>
  </div>`;
}

/* The rail. The readings, the three labs and both checks count toward the
 * module's percent (shown only; it saves nothing); Sources doesn't. The checks
 * come last in the list, so they never lock a lab (moduleNavStatuses locks
 * only rows after an unfinished one), and neverLocked keeps them open while
 * Lab 9.1 isn't done. The card sort sits inside Reading 1's card and shows its
 * own saved status there: a rail link would land inside a closed card. */
function its04NavSections(user) {
  return [
    { id: 'lessons', title: 'Readings', type: 'lecture', phase: 'learn', isComplete: true, scrollId: 'its04-lessons' },
    { id: 'guided-lab', title: 'Guided connectivity checklist walkthrough', navTitle: 'Lab 9.1 · Guided Lab', type: 'lab', ...itsLabRail(user, [ITS04_LAB1_KEY]), scrollId: 'its04-lab-9-1' },
    // Counts toward the percent, but never locked: the practice tickets can
    // be opened at any time.
    { id: 'unguided', title: 'Lab 9.2 · Practice tickets', navTitle: 'Lab 9.2 · Practice tickets', type: 'lab', phase: 'practice', neverLocked: true, ...itsLabRail(user, [ITS04_PRACTICE_KEY]), scrollId: 'its04-lab-9-2' },
    // Named so the platform's generic Assessment Lab box isn't added
    // (normalizeModuleStages).
    { id: 'assessment', title: 'Assessment Lab', type: 'review', neverLocked: true, ...itsLabRail(user, [ITS04_PROVE_KEY]), scrollId: 'its04-prove-it' },
    { id: 'learn-check', title: ITS04_CHECKS.learn.title, type: 'quiz', phase: 'learn', neverLocked: true, isComplete: its04CheckCompleted('learn'), doneLabel: 'Complete', scrollId: 'its04-check-learn' },
    { id: 'aplus-check', title: ITS04_CHECKS.aplus.title, type: 'quiz', phase: 'learn', neverLocked: true, isComplete: its04CheckCompleted('aplus'), doneLabel: 'Complete', scrollId: 'its04-check-aplus' },
    { id: 'sources', title: 'Sources & Further Reading', type: 'read', isComplete: null, scrollId: 'its04-sources', gated: false, supplemental: true },
  ];
}
function its04Rail(user) {
  return moduleProgressShell(its04NavSections(user), { moduleKey: 'its04', stageKey: 'its-04' });
}

function viewItsModuleNinePage(user, program) {
  its04Load(user);
  const module = program.modules['its-04'];
  return `<div class="its04-shell">
    ${moduleTopbar(user, program)}
    ${its04Rail(user)}
    <main class="its01-main">
      <section class="its01-hero" aria-labelledby="its04-title"><div><p class="its01-kicker">Module ${String(module.number).padStart(2, '0')} · ${formatInstructionalMinutes(module.durationMinutes)} · Week ${esc(String(module.week))}</p><h1 id="its04-title">${esc(module.title)}</h1><p class="its01-lede">${its04Text(ITS04_OBJECTIVE)}</p></div><dl class="its01-progress" aria-label="Saved module progress"><div><dt>Lessons</dt><dd>${ITS04_LESSONS.length}</dd></div><div><dt>Guided labs</dt><dd>1</dd></div><div><dt>Labs</dt><dd id="its04-status">${itsLabCounterText(user, ITS04_LAB_KEYS)}</dd></div></dl></section>

      ${its04Learn()}
      ${its04Lab1()}
      ${its04PracticeTickets()}
      ${its04Prove()}

      <section class="its01-section" id="its04-sources" aria-labelledby="its04-sources-title"><div class="its01-section-heading"><span><i class="ri-book-open-line" aria-hidden="true"></i></span><div><p class="its01-kicker">Reference — not a graded step</p><h2 id="its04-sources-title">Sources &amp; Further Reading</h2></div></div>${its04Sources()}</section>
    </main>
  </div>`;
}

/* ----------------------------------------------------------- Re-renders */

// Updates the rail's rows and percent in place, so its open groups, drawer
// and listeners stay as they are.
function its04RefreshRail() {
  const rail = document.querySelector('.its04-shell [data-mquick-nav-rail]');
  if (!rail || !its04User) return;
  const holder = document.createElement('div');
  holder.innerHTML = its04Rail(its04User);
  const fresh = holder.querySelector('[data-mquick-nav-rail]');
  if (!fresh) return;
  const percent = rail.querySelector('.munified-percent');
  const freshPercent = fresh.querySelector('.munified-percent');
  if (percent && freshPercent) percent.textContent = freshPercent.textContent;
  fresh.querySelectorAll('a.munified-row').forEach((row) => {
    const old = rail.querySelector(`a.munified-row[href="${row.getAttribute('href')}"]`);
    if (!old) return;
    old.className = row.className;
    ['aria-disabled', 'data-mnav-locked-reason', 'data-mnav-locked-target'].forEach((name) => {
      if (row.hasAttribute(name)) old.setAttribute(name, row.getAttribute(name)); else old.removeAttribute(name);
    });
    old.innerHTML = row.innerHTML;
  });
}

// Redraws one activity ('learn', 'aplus' or 'sort') in place. focusId: the
// feedback element to move focus to.
function its04RenderCheck(checkId, focusId) {
  const selector = checkId === 'sort' ? '[data-its04-cardsort]' : `[data-its04-check="${checkId}"]`;
  const el = document.querySelector(`.its04-shell ${selector}`);
  if (el) el.outerHTML = checkId === 'sort' ? its04CardSort() : its04Check(checkId);
  if (focusId) {
    const target = document.getElementById(focusId);
    if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
  }
  its04RefreshRail();
}

/* -------------------------------------------------------------- Actions */

// One pick on one question, as on Module 1. A check is complete, and saved as
// such (complete and its time only), the first time a full pass of first picks
// passes.
function its04Answer(checkId, index, choice) {
  const check = ITS04_CHECKS[checkId];
  const question = check && check.questions[index];
  if (!question || !(choice >= 0 && choice < question.choices.length)) return;
  const picks = its04CheckPicks[checkId][index] || [];
  if (picks.includes(question.answer) || picks.includes(choice)) return;
  its04CheckPicks[checkId][index] = picks.concat(choice);
  if (its04CheckAnswers[checkId][index] === undefined) its04CheckAnswers[checkId][index] = choice;
  const [done] = ITS04_CHECK_SAVED[checkId];
  if (its04State && its04Ready(checkId) && its04State[done] !== true) its04SaveCheckDone(checkId);
  its04RenderCheck(checkId, `its04-${checkId}-q${index}-feedback`);
}

// One box picked for one card in the card sort. It is complete, and saved as
// such (complete and its time only), once every card is in its right box.
function its04Sort(cardId, bucket) {
  const card = ITS04_CARD_SORT.cards.find((c) => c.id === cardId);
  if (!card || !ITS04_CARD_SORT.buckets.includes(bucket)) return;
  const picks = its04SortPicks[cardId] || [];
  if (picks.includes(card.answer) || picks.includes(bucket)) return;
  its04SortPicks[cardId] = picks.concat(bucket);
  if (its04State && its04SortDone() && !its04CheckCompleted('sort')) its04SaveCheckDone('sort');
  its04RenderCheck('sort', `its04-sort-${cardId}-feedback`);
}

// Ticks an activity and saves it, as Module 1's checks do. Only an explicit
// false from the save takes the tick off again (an unknown result leaves it),
// and only if the same student still has the same completion (a render reloads
// its04State, so it's matched by its time, not by object). The untick is saved
// the same way, so this page, this browser's copy and the session's copy of
// the row agree.
function its04SaveCheckDone(checkId) {
  const [done, doneAt] = ITS04_CHECK_SAVED[checkId];
  const userId = its04User && its04User.userId;
  const at = new Date().toISOString();
  its04State[done] = true;
  its04State[doneAt] = at;
  its04CheckSaveFailed[checkId] = false;
  its04Save((ok) => {
    const state = its04State;
    if (ok !== false || !state || !its04User || its04User.userId !== userId || state[doneAt] !== at) return;
    state[done] = false;
    state[doneAt] = null;
    its04CheckSaveFailed[checkId] = true;
    its04Save();
    // Keep focus where it was, unless it was on a button this render removes.
    const active = document.activeElement;
    const footer = document.querySelector(`.its04-shell [data-its04-check-footer="${checkId}"]`);
    const focusInFooter = Boolean(footer && active && footer.contains && footer.contains(active));
    its04RenderCheck(checkId);
    if (focusInFooter) its04FocusCheckStatus(checkId);
  });
}

function its04FocusCheckStatus(checkId) {
  const status = document.querySelector(`.its04-shell [data-its04-check-footer="${checkId}"] .its01-check-status`);
  if (status && typeof status.focus === 'function') status.focus({ preventScroll: true });
}

// Try again: the answers are still in page memory, so save the pass again.
function its04RetryCheckSave(checkId) {
  if (!ITS04_CHECK_SAVED[checkId] || !its04CheckSaveFailed[checkId] || !its04State || !its04Ready(checkId)) return;
  its04SaveCheckDone(checkId);
  its04RenderCheck(checkId);
  its04FocusCheckStatus(checkId);
}

// Start again: a new attempt, so the choices come back in a new order.
function its04ResetCheck(checkId) {
  if (!ITS04_CHECKS[checkId]) return;
  its04CheckAnswers[checkId] = {};
  its04CheckPicks[checkId] = {};
  its04CheckSaveFailed[checkId] = false;
  its04CheckAttempt[checkId] += 1;
  its04RenderCheck(checkId);
  const first = document.querySelector(`.its04-shell [data-its04-check="${checkId}"] [data-its04-answer]`);
  if (first && typeof first.focus === 'function') first.focus({ preventScroll: true });
}

// Start again on the card sort: every card goes back to no box.
function its04ResetSort() {
  its04SortPicks = {};
  its04CheckSaveFailed.sort = false;
  its04RenderCheck('sort');
  const first = document.querySelector('.its04-shell [data-its04-cardsort] [data-its04-sort]');
  if (first && typeof first.focus === 'function') first.focus({ preventScroll: true });
}

function wireItsModuleNinePage() {
  const shell = document.querySelector('.its04-shell');
  if (!shell || !its04State) return;
  shell.addEventListener('click', (event) => {
    const answer = event.target.closest('[data-its04-answer]');
    if (answer) {
      if (!answer.disabled) its04Answer(answer.dataset.check, Number(answer.dataset.q), Number(answer.dataset.choice));
      return;
    }
    const sort = event.target.closest('[data-its04-sort]');
    if (sort) {
      if (!sort.disabled) its04Sort(sort.dataset.its04Sort, sort.dataset.bucket);
      return;
    }
    if (event.target.closest('[data-its04-sort-reset]')) {
      its04ResetSort();
      return;
    }
    const reset = event.target.closest('[data-its04-check-reset]');
    if (reset) {
      its04ResetCheck(reset.dataset.its04CheckReset);
      return;
    }
    const retry = event.target.closest('[data-its04-check-retry]');
    if (retry) {
      its04RetryCheckSave(retry.dataset.its04CheckRetry);
      return;
    }
    const launch = event.target.closest('[data-its04-console-launch]');
    if (launch) {
      if (itsLaunchWalkthrough(event, launch, its04User, ITS04_COACH_ID)) {
        its04State.consoleStarted = true;
        its04Save();
      }
      itsRefreshWalkthroughNotice(its04User, ITS04_COACH_ID, [ITS04_LAB1_KEY], ITS04_LAB1_START);
    }
  });
}

/* ------------------------------------------- Lab 9.1 and Lab 9.2 saves */

// Lab 9.1's finished work, read from the cleaned snapshot (itsCleanCoachWork):
// HD-2212 and HD-2213 resolved, and an entry for SR-2222. SR-2222 is the
// request record whose number is RITM0010164. The cleaned work doesn't keep
// the request's own state; the coach checks that the request is Closed
// Complete before it shows Finish, so the entry being there is the page's
// check on the request. The coach checks every step in order before it shows
// Finish; the saved work keeps no step list, so the page checks the end. An
// old tab could still send an early message.
const ITS04_LAB1_TICKETS = ['HD-2212', 'HD-2213'];
const ITS04_LAB1_REQUEST = 'SR-2222';
function its04Lab1Complete(work) {
  const tickets = work && Array.isArray(work.tickets) ? work.tickets : [];
  const resolved = (id) => tickets.some((entry) => entry.id === id && entry.status === 'Resolved');
  return ITS04_LAB1_TICKETS.every(resolved) && tickets.some((entry) => entry.id === ITS04_LAB1_REQUEST);
}

async function its04ReceiveCoachCompletion(event) {
  if (!event.data || event.data.type !== 'mnt-coach-complete' || event.data.id !== ITS04_COACH_ID) return;
  if (event.origin !== new URL(SIM_ORIGIN).origin) return;
  const user = await currentUser();
  if (!user) { itsConfirmCoachReceipt(event, false); return; }
  const wrongStudent = itsCoachStudentMismatch(event, user);
  if (wrongStudent) { itsConfirmCoachReceipt(event, false, wrongStudent); return; }

  const work = itsCleanCoachWork(event.data.work);
  const coachKey = `${user.userId}|${ITS04_COACH_ID}`;
  if (!its04Lab1Complete(work)) {
    itsIncompleteWalkthroughs.add(coachKey);
    itsRefreshWalkthroughNotice(user, ITS04_COACH_ID, [ITS04_LAB1_KEY], ITS04_LAB1_START);
    itsConfirmCoachReceipt(event, false, 'incomplete');
    return;
  }
  itsIncompleteWalkthroughs.delete(coachKey);

  // Submit first: Lab 9.1 counts as complete only once the portal has its
  // attempt (saved now, or already waiting or approved).
  const received = await itsSubmitWalkthroughLabs(user, 'its-04', [ITS04_LAB1_KEY], work);
  its04User = user;
  if (received) {
    const saved = LabRuntime.load(ITS04_STATE_ID, user, ITS04_DEFAULT_STATE);
    saved.consoleStarted = true;
    saved.consoleCompleted = true;
    LabRuntime.save(ITS04_STATE_ID, user, saved);
    its04State = saved;
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(user, 'it-support', 'its-04', ITS04_LAB1_KEY);
  }
  itsConfirmCoachReceipt(event, received);

  if (!document.querySelector('.its04-shell')) return;
  render();
  const section = document.getElementById('its04-lab-9-1');
  if (section) section.scrollIntoView({ block: 'start' });
}

// Lab 9.2's completion: the simulator's practice set says its five tickets
// are done (ui/helpdesk.js hdPracticeReport; the set's `complete` and `done`
// rules in ui/helpdesk-data.js). Saved once, as a lab attempt with no score
// and no answers: completion, its time and the ticket ids. Every message gets
// an answer, so the simulator can say whether it was saved.
const ITS04_PRACTICE_TICKETS = ['HD-2214', 'HD-2215', 'HD-2219', 'HD-2220', 'HD-2221'];
const ITS04_PRACTICE_LOCK_MS = 15000;
function its04StorageGet(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
function its04StorageSet(key, value) { try { localStorage.setItem(key, value); } catch (_) { /* storage blocked: no lock */ } }
function its04StorageRemove(key) { try { localStorage.removeItem(key); } catch (_) { /* storage blocked */ } }

async function its04ReceivePracticeCompletion(event) {
  const data = event.data;
  if (!data || data.type !== 'mnt-practice-complete' || data.id !== 'its-04') return;
  if (event.origin !== new URL(SIM_ORIGIN).origin) return;
  const reply = (saved, reason) => {
    if (!event.source || typeof event.source.postMessage !== 'function') return;
    event.source.postMessage({ type: 'mnt-practice-received', id: 'its-04', nonce: data.nonce, saved: saved === true, ...(reason ? { reason } : {}) }, event.origin);
  };
  const user = await currentUser();
  if (!user) { reply(false, 'signed-out'); return; }
  const wrongStudent = itsCoachStudentMismatch(event, user);
  if (wrongStudent) { reply(false, wrongStudent); return; }
  const tickets = Array.isArray(data.tickets) ? data.tickets : [];
  if (tickets.length !== ITS04_PRACTICE_TICKETS.length || !ITS04_PRACTICE_TICKETS.every((id) => tickets.includes(id))) { reply(false, 'incomplete'); return; }
  // Already recorded (as loaded at sign-in, or saved on this page).
  if (itsLabSubmitted(user, ITS04_PRACTICE_KEY)) { reply(true); return; }
  if (itsLabSubmitting(user, ITS04_PRACTICE_KEY)) { reply(false, 'busy'); return; }
  // lab_attempts allows many rows per lab and this lab has no
  // course_module_labs row, so the database won't refuse a second record.
  // Another course page tab in this browser may be saving right now (the
  // lock), or may already have saved (the database read): either way, no
  // second record.
  const lock = `mnt.practice-save.${user.userId}.${ITS04_PRACTICE_KEY}`;
  const held = Number(its04StorageGet(lock)) || 0;
  if (Date.now() - held < ITS04_PRACTICE_LOCK_MS) { reply(false, 'busy'); return; }
  its04StorageSet(lock, String(Date.now()));
  let saved = false;
  try {
    const existing = await its04SavedPracticeAttempt(user);
    if (existing === null) { reply(false, 'save-failed'); return; }
    if (existing) {
      user.latestLabAttemptByKey = { ...(user.latestLabAttemptByKey || {}), [ITS04_PRACTICE_KEY]: existing };
      saved = true;
    } else {
      saved = await itsSubmitLabAttempt(user, 'its-04', ITS04_PRACTICE_KEY, {
        state: 'complete', result: { source: 'mnt-practice-complete', practiceSet: 'its-04', tickets: ITS04_PRACTICE_TICKETS.slice() },
      });
    }
  } finally {
    its04StorageRemove(lock);
  }
  if (saved && typeof markModuleLabComplete === 'function') markModuleLabComplete(user, 'it-support', 'its-04', ITS04_PRACTICE_KEY);
  reply(saved, saved ? '' : 'save-failed');
  its04User = user;
  if (document.querySelector('.its04-shell')) render();
}

// The student's saved Lab 9.2 record, read from the database: the attempt
// (in the shape latestLabAttemptByKey holds), false when there is none, or
// null when the read failed. A superseded or returned record doesn't count.
async function its04SavedPracticeAttempt(user) {
  if (typeof mntSupabase === 'undefined') return null;
  try {
    const { data, error } = await mntSupabase.from('lab_attempts')
      .select('completed_at, reviewed_at, redo_requested, superseded_at')
      .eq('user_id', user.userId).eq('lab_key', ITS04_PRACTICE_KEY)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });
    if (error) { console.error('Lab 9.2 completion read failed', error); return null; }
    const row = Array.isArray(data) ? data.find((entry) => entry && !entry.superseded_at && entry.redo_requested !== true) : null;
    return row ? { completedAt: row.completed_at, reviewedAt: row.reviewed_at || null, redoRequested: row.redo_requested === true, supersededAt: row.superseded_at || null } : false;
  } catch (error) {
    console.error('Lab 9.2 completion read threw', error);
    return null;
  }
}

function its04OnMessage(event) {
  itsProveReceiveMessage(event, { moduleKey: 'its-04', labKey: ITS04_PROVE_KEY, onChange: its04ProveChanged });
  return Promise.all([its04ReceivePracticeCompletion(event), its04ReceiveCoachCompletion(event)]);
}

registerModuleLab({
  program: 'it-support', moduleNumber: 9, moduleKey: 'its-04',
  view: viewItsModuleNinePage, wire: wireItsModuleNinePage, onMessage: its04OnMessage,
});
