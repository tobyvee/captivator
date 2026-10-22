---
title: "Native text undo in the name input and textareas is checked in a real browser in T-029"
type: decision
project: captivator
ticket: [T-025, T-029]
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, undo, testing]
---
# Native text undo in the name input and textareas is checked in a real browser in T-029

## Context
T-025's criterion says Cmd+Z in the design-name input or a textarea undoes the text, not the design. The tests prove the shortcut handler ignores those targets and leaves the event alone, but jsdom has no native text undo, so they can't show the browser then undoes the text.

## Decision
Record T-025 done with that criterion ticked on the jsdom evidence, and add the real-browser check (Safari and Chrome: type in the name input and a panel textarea, press Cmd+Z, and Ctrl+Z on Windows or Linux if available; the text undoes and the design doesn't) to T-029's checklist.

## Alternatives
- **Leave the criterion open until T-029:** blocks recording a ticket whose code and tests are done, for a check the checklist already runs.
- **A Playwright test:** no browser test harness exists in the MVP.

## Consequences
T-029 gains one browser check.
