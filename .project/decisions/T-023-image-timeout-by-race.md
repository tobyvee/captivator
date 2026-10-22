---
title: "Each export image step is bounded by a 20-second timeout raced in export.ts"
type: decision
project: captivator
ticket: T-023
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, export, security, images]
---
# Each export image step is bounded by a 20-second timeout raced in export.ts

## Context
The T-011 security review suggested `AbortSignal.timeout` on the export's fetches, so one slow host in a tampered design can't hang the export. `inlineFromUrl` and `encodeAt` in `src/lib/images.ts` take no `signal`, and `images.ts` isn't in T-023's `touches`.

## Decision
`export.ts` races each `inline` call and the background `reencode` call against a 20-second timer (`IMAGE_TIMEOUT_MS`). A timed-out inline fails the export closed; a timed-out re-encode keeps the inlined background.

## Alternatives
- Add a `signal` parameter to `inlineFromUrl`/`encodeAt`: the right long-term fix, but it changes a dependency's public API outside this ticket's `touches`.
- No timeout: the export button could stay busy forever.

## Consequences
A timed-out fetch isn't aborted; it keeps running until the browser gives up, but the export itself settles. A later ticket that owns `images.ts` can thread an `AbortSignal` through and pass it from here.
