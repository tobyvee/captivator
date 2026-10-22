---
title: "kmeans drops empty clusters and returns centres largest cluster first, rounded to whole channels"
type: decision
project: captivator
ticket: T-026
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, palette]
---
# kmeans drops empty clusters and returns centres largest cluster first, rounded to whole channels

## Context
The ticket fixes `kmeans(pixels, k, iterations?)` with deterministic seeds from evenly spaced pixels, but not what an empty cluster returns or what order centres come in. A one- or two-colour logo seeds several clusters on the same colour, and only the first of them collects pixels. `dedupePalette` keeps order and caps at 4, so the order decides which swatches survive.

## Decision
Seeds are pixels at `floor(i * n / k)`. A cluster that empties keeps its centre during iteration, and stops early once nothing moves. The result leaves out empty clusters, is sorted by cluster size (largest first, ties in seed order), and rounds each channel. `k` is capped at the pixel count.

## Alternatives
- Return all `k` centres in seed order: empty seeds would surface as stale swatches, and a small accent could push out a large brand colour at the cap of 4.
- Re-seed empty clusters from the farthest pixel: more code for a 32x32 sample whose duplicates `dedupePalette` already removes.

## Consequences
`kmeans` can return fewer than `k` centres. The palette lists the dominant colour, then the clusters by how much of the logo they cover.
