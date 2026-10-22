---
title: "The Unsplash route caches searches in vinext's KV-backed data cache"
type: decision
project: captivator
ticket: T-031
decided_by: main session
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, unsplash, caching, infra]
---
# The Unsplash route caches searches in vinext's KV-backed data cache

## Context
To stay under Unsplash's demo limit of 50 requests an hour, T-031 relied on Vercel's CDN honouring `Cache-Control: s-maxage`, plus a best-effort in-memory `Map` (review finding 26). On Cloudflare Workers (`general-deploy-cloudflare-vinext.md`), neither holds. vinext keeps a route handler's `Cache-Control` header but doesn't make the response cacheable at the edge, and module memory is per isolate. vinext's [caching guide](https://vinext.dev/docs/guides/caching) points to its data cache instead.

## Decision
Cache the upstream search fetch for an hour in vinext's data cache. Back it with `kvDataAdapter()` and a `VINEXT_KV_CACHE` KV binding, which Cloudflare provisions on deploy. That means T-031 also touches `vite.config.ts` and `cloudflare.config.ts`. The response keeps `Cache-Control: public, max-age=3600` for the browser.

## Alternatives
- Keep `s-maxage` and the `Map`: neither caches on Workers.
- The Workers Cache API (`caches.default`) keyed by query: it's per data centre, needs a stub in tests, and vinext's data cache is the documented route.

## Consequences
- The deploy creates a KV namespace. The user has nothing to set up.
- What vinext stores in KV must never include the raw access key. If its cache key holds request headers unhashed, cache the trimmed result keyed by the query alone.
- The Map is dropped.
