---
title: "The Image panel's alt hint stays put, and \"Describe the image\" is announced from its own always-mounted alert"
type: decision
project: captivator
ticket: T-014
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, accessibility]
---
# The Image panel's alt hint stays put, and "Describe the image" is announced from its own always-mounted alert

## Context
T-014 swapped the alt field's hint text for "Describe the image" inside the `aria-describedby` target. A description is only read when the field gains focus, so a screen-reader user who cleared the field while in it wasn't told the alt wasn't saved (T-014 review).

## Decision
The hint ("Read aloud to guests who use a screen reader.") is always shown. A separate `role="alert"` paragraph is always mounted and holds "Describe the image" while the draft is empty; the field's `aria-describedby` adds it only then. When empty, `empty:-mt-1.5` cancels the column gap. This is the pattern `ImageUpload` already uses for its errors.

## Alternatives
- **Keep swapping the hint:** not announced while typing.
- **`aria-live` on the hint:** would also announce the hint coming back, which is noise.

## Consequences
Two `role="alert"` regions sit in the panel (ImageUpload's and this one), so tests find the alt error by its text.
