---
title: "The photo average is sampled once per src, failures included, in a small module-level cache behind a usePhotoAverage hook"
type: decision
project: captivator
ticket: T-027
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, contrast]
---
# The photo average is sampled once per src, failures included, in a small module-level cache behind a usePhotoAverage hook

## Context
The ticket asks for fast-average-color's `getColorAsync(src, { algorithm: "simple" })`, cached by `src` in a module-level `Map`, and undefined until it resolves or if it fails. It doesn't say whether failures are cached, how in-flight requests are shared, or how large the cache may grow. Uploaded photos are data URLs of up to about 1 MB, and they're the keys.

## Decision
- One `Map<src, hex | null>` holds the results. `null` records a failure, so a broken photo isn't sampled again on every render. A second map lets mounts share a request that's still in flight.
- The cache keeps the 8 most recent photos, so replaced data URLs can be garbage-collected.
- Sampling passes `silent: true` and accepts only a 6-digit hex result. Anything else counts as a failure.
- `usePhotoAverage(src)` is exported from `ReadabilityCheck.tsx` so the Text panel can reuse it later (`T-013-photo-line-never-rates.md`).

## Alternatives
- **Cache only successes:** a photo that can't be sampled (CORS, decode error) would be retried on every design change.
- **An unbounded cache:** keeps every replaced upload's data URL alive for the session.
- **Store the average in Zustand:** it's derived data, and the store tracks `design` for undo and persistence.

## Consequences
A photo that failed once is rated against its backdrop until the page reloads. A panel that later wants the average should import the hook instead of sampling again.
