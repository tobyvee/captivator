---
title: "A transparent image falls back to PNG, not JPEG, when the browser can't encode WebP"
type: decision
project: captivator
ticket: T-011
decided_by: ticket-implementer
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, images, upload]
---
# A transparent image falls back to PNG, not JPEG, when the browser can't encode WebP

## Context
The pipeline encodes WebP 0.8, falls back to JPEG 0.82 when WebP comes back empty or not WebP, and for an `image` from a PNG, WebP or SVG source also encodes PNG and keeps the smaller. Safari's canvas doesn't encode WebP (it returns PNG). There, a transparent logo would be compared as JPEG against PNG, and the smaller JPEG would win with its transparent pixels turned black.

## Decision
For an `image` whose source may be transparent, when WebP isn't available, the pipeline checks the canvas for any pixel with alpha below 255. If it finds one, it skips JPEG and uses PNG. Opaque images, and every `background`, keep the spec's JPEG fallback. The canvas is only scanned when WebP fails.

## Alternatives
- Follow the steps literally: transparent logos get a black box in Safari.
- Always use PNG for possibly transparent sources without WebP: opaque photos saved as PNG would be several times larger.
- Fill the canvas white before a JPEG encode: a white box on a coloured or photo background.

## Consequences
In Safari, a transparent logo is stored as PNG and can be larger than 150 KB, which shows the size warning. Backgrounds with transparency still flatten to black under the JPEG fallback; they're full-bleed photos, so this is accepted.
