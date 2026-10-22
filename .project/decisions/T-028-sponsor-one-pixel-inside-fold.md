---
title: "Sponsor sitting 1px inside the small-phone fold is accepted"
type: decision
project: captivator
ticket: [T-028, T-029]
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, fit, templates]
---
# Sponsor sitting 1px inside the small-phone fold is accepted

## Context
T-028's agent measured Sponsor's compact landing page at 599px in headless Chrome, against the 600px fold. The review found the figure stable: every height on that page is a fixed px value and none of its text wraps at 319px, so system fonts don't change it. Sponsor is the default design (`T-004-default-design-is-sponsor.md`), so almost any addition (a second subheading line, a medium logo, one more text block) shows "Too tall for small phones", which is true by the spec's own definition.

## Decision
Keep Sponsor as the canvas draws it and let the check warn when it does. T-029's real-phone checklist confirms Sponsor shows no fold warning out of the box and that one extra text block shows it.

## Alternatives
- **Trim Sponsor in T-028:** `templates.ts` belongs to T-002/T-018 and the layout comes from the canvas; a template with room to grow would be its own ticket if the user wants it.
- **Raise the fold:** the 600px figure is the spec's, from the iPhone SE login sheet.

## Consequences
Customers starting from Sponsor see the fit warning early. No test depends on the 1px margin.
