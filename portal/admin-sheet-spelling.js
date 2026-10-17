/* Admin Submission Sheet — spelling for every narrative field (S6,
 * docs/workstreams/ADMIN_SUBMISSION_SHEET.md). Registers one text analyzer
 * with AdminSubmissionSheet.addTextAnalyzer():
 *
 *   - Typo.js + an en_US Hunspell dictionary (portal/vendor/typo/) are
 *     fetched lazily, same-origin, the first time a narrative field is
 *     analyzed. Student text never leaves the page.
 *   - Adds an advisory "Spelling" line (count + up to 5 words, each with its
 *     first suggestion) and underlines the flagged words in the student's text.
 *     Amber at worst: never a fail, never changes the verdict.
 *   - On editable (pending) cards only, when >= 3 distinct words are flagged
 *     across the card, appends ONE teacher-note item to [data-feedback-items].
 *
 * Skipped on purpose: tokens with digits, dots, dashes, colons, underscores,
 * @ or slashes (IPs, hosts, hashes, KQL, e-mails, paths); ALL-CAPS acronyms
 * of up to 6 letters; capitalised words that are not at the start of a
 * sentence (names, products); a SOC allowlist; and words harvested from the
 * module fixtures (scenario text, host/user/product names).
 */
(() => {
  'use strict';

  const MAX_WORDS_PER_FIELD = 4000; // cap the checking work per field
  const MAX_SUGGEST_PER_FIELD = 8;  // suggest() is the slow call
  const LINE_WORDS = 5;             // words shown in the sweep line
  const NOTE_WORDS = 8;             // words listed in the teacher note
  const NOTE_MIN_FLAGGED = 3;       // flagged words per card before a note is added
  const NOTE_LABEL = 'Spelling';

  // SOC / security vocabulary the general dictionary does not know. Lower-case.
  const SOC_TERMS = `
    phishing spearphishing vishing smishing exfiltration exfil exfiltrate exfiltrated exfiltrating lateral enumeration enumerate enumerated
    triage triaged triaging sinkhole sinkholed sinkholing ioc iocs ttp ttps mfa sso siem soar edr xdr mdr ndr dlp idp ids ips waf
    kql kusto sentinel defender microsoft azure entra intune okta splunk crowdstrike sysmon wireshark nmap metasploit mimikatz bloodhound
    cobalt strike beacon beaconing beaconed c2 c&c callback callbacks malware ransomware spyware adware botnet rootkit keylogger infostealer
    trojan backdoor dropper payload payloads shellcode webshell exploit exploited exploitation vulnerability vulnerabilities cve cves
    powershell cmd wmi wmic psexec rundll regsvr mshta certutil bitsadmin schtasks lolbin lolbins lolbas macro macros vba obfuscated obfuscation
    deobfuscate base64 hex hash hashes md5 sha1 sha256 hostname hostnames subdomain subdomains domain domains dns dhcp ldap kerberos kerberoasting
    ntlm rdp smb ssh sftp ftp tls ssl https http smtp imap pop3 vpn proxy proxies nat firewall firewalls ip ips ipv4 ipv6 cidr vlan subnet subnets
    endpoint endpoints workstation workstations server servers admin admins sysadmin sysadmins username usernames login logins logon logons
    logoff logoffs lockout lockouts bruteforce brute-force credential credentials password passwords passphrase passphrases privesc escalate
    escalated escalating escalation escalations deescalate containment contain contained quarantine quarantined isolate isolated isolation
    remediate remediation remediated eradicate eradication mitigate mitigation mitigated forensic forensics artifact artifacts timeline timelines
    pivot pivoted pivoting persistence persist persisted autorun autoruns registry runkey runkeys prefetch amcache shimcache sigma yara snort suricata
    zeek pcap pcaps netflow syslog eventlog evtx telemetry detections detection detect detected alert alerts alerting anomaly anomalies baseline baselines
    falsepositive truepositive benign malicious suspicious unauthorized unauthorised reconnaissance recon attacker attackers adversary adversaries threat
    threats actor actors apt attribution killchain mitre attack att&ck tactic tactics technique techniques procedure procedures subtechnique
    spoof spoofed spoofing impersonation impersonate typosquat typosquatting homoglyph whois rdap virustotal urlscan abuseipdb shodan censys
    sandbox sandboxed detonate detonation unpack unpacked packer packed dll dlls exe exes msi iso lnk vbs vbe js jse hta ps1 bat cmdlet cmdlets
    parent child ppid pid pids tcp udp icmp port ports inbound outbound egress ingress downstream upstream uplink
    mailbox mailboxes inbox outlook exchange o365 m365 sharepoint onedrive teams saas iaas paas cloud tenant tenants oauth saml jwt token tokens
    cookie cookies session sessions hijack hijacked hijacking mfa-fatigue ueba uba soc csirt cirt ciso nist cissp itsm ticketing runbook runbooks
    playbook playbooks sla slas p1 p2 p3 p4 tier1 tier2 tier3 l1 l2 l3 handoff handoffs escalations whitelist blacklist allowlist denylist blocklist
    allowlisted blocklisted blocklisting geolocation geoip asn tor onion darkweb pastebin dropbox telegram discord ngrok
    antivirus antimalware av appcontrol applocker bitlocker gpo gpos ou ous sid sids sam ntds lsass dcsync golden-ticket tgt tgs
    unmanaged unpatched patching patched misconfiguration misconfigured misconfig wannacry emotet trickbot qakbot lockbit
    sysadmin appdata programdata temp svchost explorer winword excel outlook chrome firefox edge
    wk ws dc fw lap srv desk user_ jdoe
    hotfix cve-ing readme whoami ipconfig netstat nslookup tasklist taskkill netsh
    dev ops devops secops netops infosec cybersecurity cyber
  `.split(/\s+/).filter(Boolean);

  // ---- pure helpers (exported for tests) ---------------------------------

  const SKIP_INNER = /[0-9._\-–—:@/\\#=<>$%&*+|~^`{}()[\]]/; // inside a token => identifier-like, skip
  const EDGE_PUNCT = /^[\s"'“”‘’(\[{<*_.,;:!?\-–—]+|[\s"'“”‘’)\]}>*_.,;:!?\-–—]+$/g;

  /* Splits text into checkable words: [{ word, index, sentenceStart }]. */
  function tokenize(text) {
    const out = [];
    const source = String(text == null ? '' : text);
    const chunk = /\S+/g;
    let match;
    let sentenceStart = true;
    while ((match = chunk.exec(source))) {
      const raw = match[0];
      const atStart = sentenceStart;
      sentenceStart = /[.!?]["'”’)\]]*$/.test(raw);
      const word = raw.replace(EDGE_PUNCT, '');
      if (!word) continue;
      if (SKIP_INNER.test(word)) continue;
      if (!/^\p{L}+(?:['’]\p{L}+)*$/u.test(word)) continue; // letters (+ apostrophes) only
      out.push({ word, index: match.index + raw.indexOf(word), sentenceStart: atStart });
    }
    return out;
  }

  function isAcronym(word) {
    return word.length <= 6 && word === word.toUpperCase() && /^\p{Lu}+$/u.test(word);
  }

  /* Why a token is not checked: 'short' | 'acronym' | 'proper' | 'allow' | ''. */
  function skipReason(token, allow) {
    const word = token.word;
    const bare = word.replace(/’/g, "'");
    if (bare.replace(/'/g, '').length < 3) return 'short';
    if (isAcronym(word)) return 'acronym';
    const lower = bare.toLowerCase();
    const root = lower.replace(/'s$/, '').replace(/s'$/, 's');
    if (allow.has(lower) || allow.has(root)) return 'allow';
    // Capitalised mid-sentence = a name / product, not a spelling slip.
    if (!token.sentenceStart && /^\p{Lu}\p{Ll}/u.test(word) && word !== word.toUpperCase()) return 'proper';
    return '';
  }

  function buildAllowlist(extraWords) {
    const set = new Set();
    SOC_TERMS.forEach((term) => set.add(term));
    (extraWords || []).forEach((term) => { if (term) set.add(String(term).toLowerCase()); });
    return set;
  }

  /* Pulls every word out of the strings of a fixture object (bounded walk). */
  function harvestWords(value, into, budget = { nodes: 20000 }, depth = 0) {
    if (budget.nodes <= 0 || depth > 8 || value == null) return into;
    budget.nodes -= 1;
    if (typeof value === 'string') {
      (value.match(/[\p{L}][\p{L}'’]{2,}/gu) || []).forEach((word) => into.add(word.replace(/’/g, "'").toLowerCase()));
    } else if (Array.isArray(value)) {
      for (const entry of value) { if (budget.nodes <= 0) break; harvestWords(entry, into, budget, depth + 1); }
    } else if (typeof value === 'object') {
      for (const key of Object.keys(value)) {
        if (budget.nodes <= 0) break;
        harvestWords(key, into, budget, depth + 1); // hostnames/accounts are often keys
        harvestWords(value[key], into, budget, depth + 1);
      }
    }
    return into;
  }

  /* Checks one field. `speller` = { check(word), suggest(word, limit) }.
   * Returns { flagged: [{ word, suggestion }], checked } — flagged words are
   * distinct (case-insensitive), in order of first appearance. */
  function analyzeText(text, speller, allow, options = {}) {
    const maxWords = options.maxWords || MAX_WORDS_PER_FIELD;
    const maxSuggest = options.maxSuggest || MAX_SUGGEST_PER_FIELD;
    const seen = new Set();
    const flagged = [];
    const started = Date.now();
    const budgetMs = options.suggestBudgetMs || 700;
    let checked = 0;
    let suggested = 0;
    for (const token of tokenize(text)) {
      if (checked >= maxWords) break;
      if (skipReason(token, allow)) continue;
      checked += 1;
      const key = token.word.replace(/’/g, "'").toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      if (isCorrect(token.word, speller)) continue;
      let suggestion = '';
      if (suggested < maxSuggest && Date.now() - started < budgetMs) { // suggest() can take ~1s on long words
        suggested += 1;
        suggestion = suggestFor(key, speller);
      }
      flagged.push({ word: token.word, suggestion });
    }
    return { flagged, checked };
  }

  /* Typo.js ranks swapped letters poorly (recieved -> relieved), so a valid
   * adjacent-letter swap wins; otherwise Typo's first suggestion. */
  function suggestFor(key, speller) {
    for (let i = 0; i < key.length - 1; i += 1) {
      if (key[i] === key[i + 1]) continue;
      const swapped = key.slice(0, i) + key[i + 1] + key[i] + key.slice(i + 2);
      try { if (speller.check(swapped)) return swapped; } catch (error) { break; }
    }
    try { return String((speller.suggest(key, 1) || [])[0] || ''); } catch (error) { return ''; }
  }

  function isCorrect(word, speller) {
    const bare = word.replace(/’/g, "'");
    if (speller.check(bare)) return true;
    const lower = bare.toLowerCase();
    if (lower !== bare && speller.check(lower)) return true;
    const root = lower.replace(/'s$/, '').replace(/s'$/, 's');
    return root !== lower && root.length >= 3 && speller.check(root);
  }

  function formatFlagged(flagged, limit) {
    return flagged.slice(0, limit).map((entry) => (entry.suggestion ? `${entry.word} → ${entry.suggestion}` : entry.word)).join('; ');
  }

  function summaryLine(flagged) {
    const total = flagged.length;
    const more = total > LINE_WORDS ? `; +${total - LINE_WORDS} more` : '';
    return `${total} possible misspelling${total === 1 ? '' : 's'}: ${formatFlagged(flagged, LINE_WORDS)}${more}`;
  }

  function noteComment(flagged) {
    return `To strengthen next time: proofread before submitting — check: ${formatFlagged(flagged, NOTE_WORDS)}${flagged.length > NOTE_WORDS ? ', …' : ''}.`.replace(/; /g, ', ');
  }

  // ---- teacher-note item (DOM APIs only; markup mirrors app.js adminFeedbackItemHtml) ----

  const INPUT_CLASS = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20';

  function buildFeedbackItem(doc, label, comment) {
    const item = doc.createElement('div');
    item.className = 'feedback-item grid sm:grid-cols-2 gap-2';
    item.setAttribute('data-spelling-note', 'true');
    const input = doc.createElement('input');
    input.setAttribute('type', 'text');
    input.setAttribute('data-feedback-label', '');
    input.setAttribute('placeholder', "What was wrong (instructor's own words)");
    input.className = INPUT_CLASS;
    input.value = label;
    input.setAttribute('value', label);
    const area = doc.createElement('textarea');
    area.setAttribute('data-feedback-comment', '');
    area.setAttribute('rows', '2');
    area.setAttribute('placeholder', 'Why it was wrong, and what to do to make it better');
    area.className = INPUT_CLASS;
    area.value = comment;
    area.textContent = comment;
    item.append(input, area);
    return item;
  }

  /* Per-card state: distinct flagged words across the card's fields and the
   * single note item. Editable cards only (they own [data-feedback-items]). */
  const cards = new WeakMap();

  function cardOf(node) {
    return node.closest('[data-grading-row]') || node.closest('article') || null;
  }

  function updateTeacherNote(node, flagged) {
    const card = cardOf(node);
    if (!card) return null;
    const list = card.querySelector('[data-feedback-items]');
    if (!list) return null; // read-only sheet: never add a note
    let state = cards.get(card);
    if (!state) { state = { words: new Map(), item: null, last: '' }; cards.set(card, state); }
    for (const entry of flagged) {
      const key = entry.word.toLowerCase();
      const known = state.words.get(key);
      if (!known || (!known.suggestion && entry.suggestion)) state.words.set(key, entry);
    }
    const all = Array.from(state.words.values());
    if (all.length < NOTE_MIN_FLAGGED) return null;
    const comment = noteComment(all);
    if (!state.item) {
      state.item = buildFeedbackItem(node.ownerDocument, NOTE_LABEL, comment);
      list.appendChild(state.item);
      state.last = comment;
    } else {
      // Later fields extend the list, unless the instructor already edited it.
      const area = state.item.querySelector('[data-feedback-comment]');
      if (area && area.value === state.last) { area.value = comment; area.textContent = comment; state.last = comment; }
    }
    return state.item;
  }

  // ---- lazy dictionary ---------------------------------------------------

  const BASE = 'vendor/typo/';
  let spellerPromise = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`could not load ${src}`));
      document.head.appendChild(script);
    });
  }

  async function fetchText(url) {
    const response = await fetch(url, { credentials: 'same-origin' });
    if (!response.ok) throw new Error(`${url}: ${response.status}`);
    return response.text();
  }

  /* Builds the speller once. `provider` is injectable for tests. */
  function getSpeller(provider) {
    if (!spellerPromise) {
      spellerPromise = (async () => {
        if (provider) return provider();
        if (typeof Typo === 'undefined') await loadScript(BASE + 'typo.js');
        const [aff, dic] = await Promise.all([fetchText(BASE + 'en_US.aff'), fetchText(BASE + 'en_US.dic')]);
        const typo = new Typo('en_US', aff, dic, { platform: 'any' });
        return { check: (word) => typo.check(word), suggest: (word, limit) => typo.suggest(word, limit) };
      })().catch((error) => {
        if (typeof console !== 'undefined' && console.warn) console.warn('Spelling: dictionary unavailable', error);
        return null; // analyzer then does nothing (advisory feature)
      });
    }
    return spellerPromise;
  }

  // ---- allowlist from the module fixtures ---------------------------------

  let allowCache = null;
  function allowlist() {
    if (allowCache) return allowCache;
    const words = new Set();
    try {
      const registry = typeof AdminSubmissionSheet !== 'undefined' && AdminSubmissionSheet._registry;
      if (registry && typeof registry.forEach === 'function') {
        const seen = new Set();
        registry.forEach((definition) => {
          if (!definition || seen.has(definition)) return;
          seen.add(definition);
          try { if (typeof definition.fixture === 'function') harvestWords(definition.fixture(), words); } catch (error) { /* fixture not loaded */ }
        });
      }
      if (typeof window !== 'undefined') {
        Object.keys(window).filter((key) => /^Soc.*(AssessmentData|Data)$/.test(key)).forEach((key) => {
          try { harvestWords(window[key], words); } catch (error) { /* ignore */ }
        });
      }
    } catch (error) { /* harvest is best-effort */ }
    allowCache = buildAllowlist(Array.from(words));
    return allowCache;
  }

  // ---- the analyzer -------------------------------------------------------

  const yieldToBrowser = () => new Promise((resolve) => setTimeout(resolve, 0));

  async function analyzeField(field, options = {}) {
    if (!field || !field.text || !String(field.text).trim()) return null;
    await yieldToBrowser(); // never freeze the admin page between fields
    const speller = await getSpeller(options.provider);
    if (!speller) return null;
    const result = analyzeText(field.text, speller, options.allow || allowlist());
    const flagged = result.flagged;
    if (!flagged.length) {
      if (result.checked) field.appendLine({ label: 'Spelling', outcome: 'pass', given: '' });
      return result;
    }
    field.appendLine({ label: 'Spelling', outcome: 'partial', given: summaryLine(flagged) });
    field.underline(flagged.map((entry) => entry.word), 'Possible misspelling');
    updateTeacherNote(field.node, flagged);
    return result;
  }

  if (typeof AdminSubmissionSheet !== 'undefined' && typeof AdminSubmissionSheet.addTextAnalyzer === 'function') {
    AdminSubmissionSheet.addTextAnalyzer((field) => analyzeField(field));
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { tokenize, skipReason, isAcronym, buildAllowlist, harvestWords, analyzeText, summaryLine, noteComment, buildFeedbackItem, updateTeacherNote, analyzeField, getSpeller, SOC_TERMS };
  }
})();
