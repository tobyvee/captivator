---
title: "The search route lower-cases q and collapses its whitespace before calling Unsplash"
type: decision
project: captivator
ticket: T-031
decided_by: security-fixer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, unsplash, caching, api]
---
# The search route lower-cases q and collapses its whitespace before calling Unsplash

## Context
vinext's data cache keys each search on the upstream URL (`T-031-search-cached-by-fetch-revalidate.md`), so `Cat  Dog` and `cat dog` were two cache entries and two calls against the hourly quota. A security audit suggested normalising `q` as part of the quota fix.

## Decision
After trimming, `q` has each run of whitespace replaced by one space and is lower-cased, then capped at 100 code points as before (`T-031-query-and-paging-inputs.md`).

## Alternatives
- **Leave `q` as typed:** equivalent searches keep spending separate quota.
- **Also sort or dedupe words:** would change what the customer searched for, since word order can matter.

## Consequences
Unsplash's keyword search isn't case-sensitive, so customers should see the same results; this wasn't checked against the live API, to avoid spending quota. The query sent upstream is always lower case.
