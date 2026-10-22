---
title: "Export inlines every image that isn't already a data URL"
type: decision
project: captivator
ticket: none
decided_by: user
supersedes:
updated: 2026-10-21
tags: [project, captivator, decision, export]
---
# Export inlines every image that isn't already a data URL

## Context
Review finding 2: template photos are `/templates/*.jpg` paths from `public/`. They break in a downloaded file and fail the export's "no http(s) URLs" test.

## Decision
Export step 3 fetches every non-data-URL image `src` (same-origin template photos and Unsplash), runs it through the upload pipeline and inlines it.

## Alternatives
- Convert template photos to data URLs when a template is applied: costs about 300 KB of localStorage per switch.
- Ship template photos as data URLs in `templates.ts`: bloats the editor bundle.

## Consequences
The export is async and depends on the image pipeline, so the export ticket depends on `images.ts`. The export test needs a template-photo case.
