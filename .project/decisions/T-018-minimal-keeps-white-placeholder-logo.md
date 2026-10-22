---
title: "Minimal uses the white PLACEHOLDER_LOGO rather than a dark variant"
type: decision
project: captivator
ticket: T-018
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, templates, images]
---
# Minimal uses the white PLACEHOLDER_LOGO rather than a dark variant

## Context
`T-002-placeholder-logo-is-white-on-transparent.md` notes that the white dashed ring is faint on light backgrounds and that T-018 may add a dark variant for Minimal. T-018's acceptance criteria say both new templates use `PLACEHOLDER_LOGO`, with no new placeholder images. Minimal's background is a pastel abstract photo under a 35% white wash, and the canvas card draws a dark logo bar there.

## Decision
Minimal's logo block uses `PLACEHOLDER_LOGO` at size `md`, as the ticket specifies. No dark placeholder is added.

## Alternatives
- **A dark ring (`PLACEHOLDER_LOGO_DARK`) for Minimal:** matches the canvas better, but contradicts the acceptance criterion and adds another ~2 KB data URL that the carry rule must also treat as a template default.
- **A mid-grey ring for every template:** changes Sponsor and Photo hero, and departs from the T-002 decision.

## Consequences
On Minimal, the placeholder ring shows faintly against the purple top of the photo and barely at all on the paler parts. The logo is meant to be replaced, and the image block still shows in the block list and the inspector. If the picker thumbnail (T-019) or user testing shows the empty-looking page confuses customers, add a dark variant in `templates.ts` and include it in the carry rule's defaults (they come from `TEMPLATES`, so that happens automatically).
