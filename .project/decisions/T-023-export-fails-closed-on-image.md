---
title: "The export fails with a clear message when an image can't be inlined, rather than dropping it"
type: decision
project: captivator
ticket: T-023
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, export, security]
---
# The export fails with a clear message when an image can't be inlined, rather than dropping it

## Context
T-023's security criterion allows either outcome when `inline` rejects (CORS refused, not an image, over 10 MB): drop that image, or fail with a clear message. Either way the original `src` must never reach the output (`.project/review/2026-10-22-security-T-011-review.md`).

## Decision
`buildExportHtml` rejects with an `ExportError` carrying `MSG_IMAGE_FAILED` ("We couldn't load one of the images. Try again, or replace it.") when `inline` rejects, times out, or returns anything other than a `data:image/(png|jpeg|webp);base64,` URL. If the background's re-encode fails or returns a non-raster result, the export keeps the already-inlined background and reports `reencoded: false`, because that source is already a safe data URL.

## Alternatives
- Drop the failing image (remove the block, or swap a photo background for its backdrop colour): the customer would download a page missing their logo or photo without being told.
- Fail on a re-encode error too: blocks an export whose page is already safe, only because it may be over budget, which the spec says warns but never blocks.

## Consequences
T-024's failure toast ("Export failed: we couldn't load one of the images. Try again, or replace it.") matches this message. A broken image URL blocks the export until the customer replaces the image.
