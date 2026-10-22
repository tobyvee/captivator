---
title: "Photo backgrounds render from build step 2, not step 4"
type: decision
project: captivator
ticket: [T-006, T-016, T-017]
decided_by: ticket-planner
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, splash, planning]
---
# Photo backgrounds render from build step 2, not step 4

## Context
The build plan puts photo work in step 4. But the Sponsor template, built in step 1, already has a photo background. Rendering photos later would also make two tickets edit `Background.tsx`.

## Decision
T-006 renders colour, gradient and photo (fit, zoom, focus, backdrop, overlay and credit) in step 2. Step 4 is the editor panel only (T-016, T-017).

## Alternatives
- **Render photos in step 4:** Sponsor previews wrongly until then, and `Background.tsx` gets a second owner.

## Consequences
About 5 minutes moves from step 4 to step 2.
