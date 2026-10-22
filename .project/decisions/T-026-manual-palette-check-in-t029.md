---
title: "The manual logo-palette check runs in a real browser in T-029"
type: decision
project: captivator
ticket: [T-026, T-029]
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, palette, testing]
---
# The manual logo-palette check runs in a real browser in T-029

## Context
T-026's last criterion is manual: uploading a logo fills "From your logo" with 3–4 distinct swatches in every colour picker. It needs a real browser's image decoding and canvas; jsdom has neither. The wiring (`ImageUpload` calls `extractPalette` for image uploads, `ColourField` shows the row) predates T-026 and is tested with the palette mocked.

## Decision
Record T-026 done with that criterion ticked on the unit tests and the existing wiring tests, and add the browser check to T-029's checklist: upload a multi-colour logo and check 3–4 distinct swatches appear in the colour pickers; a one- or two-colour logo honestly gives 1–2.

## Alternatives
- **Leave the criterion open until T-029:** blocks recording a finished pure module for a check the checklist already runs.

## Consequences
T-029 gains one browser check.
