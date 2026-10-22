---
title: "The export failure toast reads \"Export failed: \" plus the ExportError's message, and the export uses the design and name at the click"
type: decision
project: captivator
ticket: T-024
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, export]
---
# The export failure toast reads "Export failed: " plus the ExportError's message, and the export uses the design and name at the click

## Context
T-024's scope gives one failure message ("Export failed: we couldn't load one of the images. Try again, or replace it."). Its notes say to show an `ExportError`'s message as text, and T-023 has two (`MSG_IMAGE_FAILED`, `MSG_UNSAFE_OUTPUT`). Any other error (a renderer bug, or `downloadHtml` throwing) has no customer-facing message. Separately, the export is async, and `T-016-with-photo-helper.md` showed that an async handler can act on stale state.

## Decision
- **Failure text:** `Export failed: ` followed by the `ExportError`'s message with its first letter lower-cased, rendered as a React text node. `MSG_IMAGE_FAILED` gives exactly the ticket's sentence. Any other error shows "Export failed: something went wrong. Try again." and its own message is never shown. A failed download counts as a failure, so no "Downloaded" toast appears for a file that didn't arrive.
- **Snapshot:** the click reads `useStore.getState()` once and passes that `design` and `name` to both `buildExportHtml` and `downloadHtml`. The file and its name then match what was on screen at the click, even if the customer keeps editing while it builds. Nothing is written back to the store, so there's no stale state to overwrite.

## Alternatives
- **Always show the ticket's image message:** wrong for `MSG_UNSAFE_OUTPUT`.
- **Show any error's message:** a raw browser or renderer message isn't written for the customer.
- **Read the name again after the build:** the file name could disagree with the page inside it.

## Consequences
A new `ExportError` message in `export.ts` should start with a capital that reads well lower-cased after "Export failed: ".
