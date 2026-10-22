---
title: "Image and credit URLs are allowlisted by scheme and host"
type: decision
project: captivator
ticket: none
decided_by: user
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, schema, security]
---
# Image and credit URLs are allowlisted by scheme and host

## Context
Review finding 8: `z.string().url()` accepted `javascript:`, `data:text/html` and any other scheme. A stored design can be hand-edited in localStorage, so the schema is the trust boundary.

## Decision
`src/lib/design-schema.ts` amends the design-phase schema. Image `src` must be a raster data URL (`png`, `jpeg`, `webp`), a bundled `/templates/<name>.(jpg|jpeg|webp)` path or `https:`. Credit `profileUrl` must be on `https://unsplash.com/` and `downloadLocation` on `https://api.unsplash.com/`.

## Alternatives
- Keep `z.string().url()`: accepts dangerous schemes.
- `https:` and data URLs only: would reject the bundled template photos.

## Consequences
Unblocks template photos without a network fetch in the editor. SVG data URLs are rejected, which matches the upload pipeline (SVGs are rasterised). The schema tests cover these cases.
