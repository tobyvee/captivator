---
title: "The Unsplash search is cached with fetch's next.revalidate, because vinext hashes the request headers into the cache key"
type: decision
project: captivator
ticket: T-031
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, unsplash, caching, security]
---
# The Unsplash search is cached with fetch's next.revalidate, because vinext hashes the request headers into the cache key

## Context
`T-031-unsplash-cache-in-data-cache.md` caches the upstream search in vinext's KV-backed data cache, with one condition: the stored entry must never hold the raw access key. If the cache key keeps request headers unhashed, the route must instead cache the trimmed result keyed by `q` alone. vinext's [caching guide](https://vinext.dev/docs/guides/caching) doesn't say whether headers are keyed, so the installed source decided it.

## Decision
Use `fetch(url, { headers, next: { revalidate: 3600 } })`.
- **Key:** in vinext 1.3.0 (`dist/shims/fetch-cache.js`, `buildFetchCacheKey`), the key is a SHA-256 hex digest of the URL, the method, every header (`Authorization` included) and the other init fields. `@vinext/cloudflare` 1.2.0 stores it in `VINEXT_KV_CACHE` under `cache:<digest>`.
- **Value:** only the response's status, URL, headers (without `set-cookie`) and body.
- **What gets cached:** only 200 responses, so upstream errors never are. An explicit `revalidate` also skips vinext's rule that a request with an auth header isn't cached.
- **The route's own response:** the route exports no `revalidate` or `dynamic`, so vinext doesn't cache it (`getAppRouteHandlerRevalidateSeconds` returns null). Its `Cache-Control: public, max-age=3600` reaches the browser unchanged.

## Alternatives
- **`unstable_cache` or `"use cache"` keyed by `q`, storing the trimmed result:** keeps the KV value smaller, but adds a second caching pattern for a condition the installed version already meets.
- **Workers Cache API:** rejected in `T-031-unsplash-cache-in-data-cache.md`.

## Consequences
- KV holds Unsplash's full response for each query. vinext treats an entry as stale after 3600 s, though KV keeps it for the adapter's default TTL of 30 days. No entry holds the key in the clear.
- Rotating the key changes every cache key, so the cache starts empty after a rotation.
- If a vinext upgrade stops hashing the key, the route must switch to the `q`-keyed alternative. A security audit after any vinext upgrade should recheck `buildFetchCacheKey`.
- After a build, `npx vinext-cloudflare deploy --dry-run --skip-build` still passes. With no prerender config, the deploy has no local prerender step for `kvDataAdapter()` to need, so the workflow's `--skip-build` still fits (`T-001-deploy-workflow-reuses-build.md`).
