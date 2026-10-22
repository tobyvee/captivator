---
title: "T-011's manual 4 MB upload check is left to T-029's real-phone checklist"
type: decision
project: captivator
ticket: [T-011, T-029]
decided_by: main session
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, images, testing]
---
# T-011's manual 4 MB upload check is left to T-029's real-phone checklist

## Context
T-011's acceptance criterion "a 4 MB phone photo uploads and lands under 150 KB" needs a real browser's decoder and encoder. Vitest's jsdom has neither, and no page uses `ImageUpload` until the editor panels land (T-016, T-014).

## Decision
Leave the criterion unticked on T-011 and record T-011 as done. T-029's checklist already includes the check. It now measures the result as the stored data URL's length (`T-011-upload-size-measures-data-url.md`).

## Alternatives
- Block T-011 until a panel exists: this would stall wave 2 on a later wave's UI.
- Check it now in a throwaway page: that adds a page outside any ticket's `touches`, for one check T-029 repeats anyway.

## Consequences
The browser encode path (WebP quality 0.8, with JPEG and PNG fallbacks) is only covered by fake-browser unit tests until T-029 runs on a real phone.
