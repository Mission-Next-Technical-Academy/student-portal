# SC-200 lab

Local-only static-files simulator of the Microsoft security operations
toolset (Defender XDR, Sentinel, Defender for Cloud, and Purview) for
SC-200 exam study.

Start here: [`SC200_LAB.md`](SC200_LAB.md) is the master project doc.
Scope source of truth: [`ExamObjectives.md`](ExamObjectives.md).
Sprint state: [`HANDOFF.md`](HANDOFF.md).

## Run

```bash
cd ~/defender-lab/ui
python3 -m http.server 8765 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8765/`.

The launcher also handles this:

```bash
~/defender-lab/bin/launch.sh
```

## What is in the browser lab

- Defender XDR home, incidents, alerts, advanced hunting, threat analytics,
  secure score, and suppression rules.
- Sentinel overview, incidents, hunting, workbooks, analytics rules, and
  automation.
- Defender for Cloud overview, recommendations, regulatory compliance, and
  security alerts.
- Purview home, DLP, insider risk, information protection, and audit search.
- Guided scenario picker on Defender home for SC-200 archetype walkthroughs.
- Static Security Copilot side panel with canned investigation prompts.

## Original CLI scenario

The terminal-only suppression-rule scenario is still available:

```bash
cd ~/defender-lab
./run_scenario.sh
```

It demonstrates that Defender-style suppression conditions are joined with
AND: if `FileName == "scanner.exe"` still matches but the SHA256 changes after
a vendor update, the rule no longer suppresses the alert.
