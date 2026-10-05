# Mission Next lab-wiring debrief — 2026-09-23

## Completed

- Wired all imported lab projects into the SOC Analyst curriculum.
- Preserved one primary Guided Lab and one primary Assessment Lab per migrated module.
- Added every previously unused imported lab as a separate, optional, ungraded “Additional Mission Next Labs” section in its best-fit module.
- Included `sa-3` under Module 8’s vulnerability-prioritization practice.
- Removed student-facing dependence on the imported catalog homepage; direct homepage access now explains that labs must be launched from Mission Next.
- Changed lab launches to same-window navigation.
- Added absolute `returnTo` URLs so local imported-lab hosting on port 5173 returns to the Mission Next portal on port 8768.
- Made the imported lab Back button validate and honor the originating Mission Next module route.

## Bug fixes

- Fixed the `ad-2` launch crash caused by sending a new-shape lab into the legacy Splunk shell contract.
- Hardened enterprise lab ID normalization for both `lab-<id>` and bare project IDs.
- Added safe field handling to the legacy Splunk shell.
- Fixed session/login fallback so a failed portal session restore does not lose the originating module route.
- Removed `_blank` behavior from migrated lab launch links.

## Lab placement

- Module 3: Windows event logs, HTTP log analysis, system-log assessment.
- Module 4: DHCP rogue-server detection.
- Module 5: Keylogger behavioral analysis.
- Module 6: Trojan network-traffic analysis.
- Module 8: OpenVAS, OWASP ZAP, and web-application security assessment.
- Module 10: Windows event logs, browser artifacts, and file-system security assessment.
- Module 11: Datadog and Checkmk Active Directory monitoring.

All imported project IDs and all Splunk module IDs are now referenced by at least one Mission Next module.

## De-branding

- Renamed the imported directory to `portal/imported-labs/mission-next-labs`.
- Removed active Boots2Bytes/B2B naming from imported app code, launch paths, operational portal references, storage keys, scripts, and package metadata.
- Updated the imported app’s visible branding and developer-facing identifiers to Mission Next naming.

## Verification

- Imported app project check: passed.
- Mission Next portal check: 129/129 views passed.
- Render check: 0 dead navigation routes.
- JavaScript syntax checks: passed.
- `git diff --check`: passed.

Historical migration documents may still mention the former source project for provenance; active student-facing paths and runtime code no longer depend on that name.
