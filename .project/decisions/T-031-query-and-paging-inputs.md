---
title: "The search route caps q by code points and takes no page parameter"
type: decision
project: captivator
ticket: T-031
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, unsplash, api]
---
# The search route caps q by code points and takes no page parameter

## Context
The ticket caps `q` at 100 characters and fixes `per_page=12`, but doesn't say how to count characters. The caller asked for page-bounds tests, but neither the ticket nor T-032 has paging.

## Decision
- **Query cap:** `q` is trimmed, then cut to its first 100 code points with `Array.from`. Cutting by UTF-16 units could leave a lone surrogate, and `encodeURIComponent` throws on one.
- **No paging:** the route reads only `q` and ignores a caller's `page` or `per_page`. The upstream request always has `per_page=12` and no `page`, and a test pins this.

## Alternatives
- **`q.slice(0, 100)`:** a cut through an emoji throws, which surfaces as a 500.
- **A bounded `page` parameter:** nothing uses it, and every page is another upstream request against the limit of 50 per hour.

## Consequences
A later "more results" feature would add a bounded `page` parameter here; the fetch cache already keys by the full upstream URL.
