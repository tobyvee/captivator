---
title: "T-024's open-the-file criterion is checked by hand in T-029, and T-024 is recorded done without it"
type: decision
project: captivator
ticket: [T-024, T-029]
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, export, testing]
---
# T-024's open-the-file criterion is checked by hand in T-029, and T-024 is recorded done without it

## Context
T-024's first acceptance criterion is that one click downloads `<name>.html`, and that opening it in a browser shows the landing page with nothing in DevTools' Network panel. jsdom can't download a blob or open the file. The tests prove the click passes the store's design and name to `buildExportHtml` and `downloadHtml`, and T-023's tests prove the file has no `http(s)` URLs, `<link>` or scripts. The milestone 7 review listed the real-browser checks for T-029.

## Decision
Leave that criterion unticked, record T-024 as done, and add the check to T-029's list: download in Safari, Chrome and iOS, check the file name, open the file, and confirm the Network panel is empty.

## Alternatives
- **Hold T-024 open until a manual run:** blocks the wave on a check T-029 already owns.
- **Tick it on the strength of the unit tests:** they don't open a file in a browser.

## Consequences
T-029's checklist carries the download and open checks for both T-023 and T-024.
