---
title: "processUpload measures an upload's size as its data URL length, not its binary size"
type: decision
project: captivator
ticket: T-011
decided_by: ticket-implementer
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, images, upload]
---
# processUpload measures an upload's size as its data URL length, not its binary size

## Context
The ticket's pipeline step 6 says to return "the data URL, its byte size, and `tooLarge` when it's over 150 KB". The spec says "warn if the result is over 150 KB". Neither says whether that's the encoded blob's size or the base64 data URL's size, which is about a third larger.

## Decision
`bytes` is `dataUrl.length`, and `tooLarge` is `dataUrl.length > STORED_WARN_BYTES`. The "{n} KB after shrinking" warning reports the same number.

## Alternatives
- The blob's binary size: about 25% smaller, but it isn't what localStorage or the exported page carries.

## Consequences
- The number matches what `reencodeToFit` measures against the page budget and what fills localStorage.
- The warning shows a little earlier than a binary measure would: a 1600px background at WebP 0.8 often trips it, which is the point of the warning. The manual "4 MB photo lands under 150 KB" check (T-029) should read the same measure.
