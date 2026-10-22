---
title: "Template photos come from the canvas assets, and their credits live beside the templates, not in background.credit"
type: decision
project: captivator
ticket: [T-002, T-018]
decided_by: ticket-planner
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, schema, templates]
---
# Template photos come from the canvas assets, and their credits live beside the templates, not in background.credit

## Context
The spec says template photos are downloaded Unsplash photos "with credits in the template data". But the schema's `Credit` requires a `downloadLocation` on `https://api.unsplash.com/`, which bundled photos don't have, and the photo IDs aren't recorded anywhere in the repo. The editor canvas holds the three photos as assets, with photographer credits on the `Templates` artboard.

## Decision
- **Photos:** T-002 and T-018 save the canvas assets as `public/templates/{sponsor,photo-hero,minimal}.jpg`.
- **Credits:** `TEMPLATE_CREDITS` (`{ name, profileUrl }` per template id) in `templates.ts`, shown on the picker cards and in the README. Template backgrounds have no `credit`, so the guest page shows no credit line for bundled photos.
- **Placeholder images:** logo and sponsor placeholders are small PNG data URLs. The schema doesn't allow PNG under `/templates/`.

## Alternatives
- **Invent `downloadLocation` URLs:** false data that a future download ping would hit.
- **Look up the real photo IDs on unsplash.com:** not reproducible from the repo.
- **A new schema field for a page credit:** a schema change and version bump.

## Consequences
The Unsplash License doesn't require attribution for bundled photos, and the README credits them anyway. A guest-page credit for template photos would need the real photo IDs first.
