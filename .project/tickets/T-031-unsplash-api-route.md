---
title: "T-031: Unsplash search and download-ping API route"
type: ticket
project: captivator
status: done
priority: P2
milestone: 8
estimate: 25
depends_on: [T-001]
touches:
  - src/app/api/unsplash/route.ts
  - src/app/api/unsplash/route.test.ts
  - vite.config.ts
  - cloudflare.config.ts
cut_rank: 1
updated: 2026-10-23
tags: [project, captivator, ticket, infra, security]
---
# T-031: Unsplash search and download-ping API route

## Context
Stretch, scheduled at P2 ([`general-stretch-tickets-scheduled.md`](../decisions/general-stretch-tickets-scheduled.md)), and cut order item 1 if cuts are requested ([spec → Images and Unsplash → Unsplash](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md), *Unit tests* → Unsplash route). This is the app's only server code and a trust boundary: it holds the API key and makes outbound requests from caller input. Decisions: [`general-url-allowlist.md`](../decisions/general-url-allowlist.md), [`general-deploy-cloudflare-vinext.md`](../decisions/general-deploy-cloudflare-vinext.md), [`T-031-unsplash-cache-in-data-cache.md`](../decisions/T-031-unsplash-cache-in-data-cache.md). Use `.claude/agents/security-auditor.md`'s API-route checklist. The route runs on Cloudflare Workers through vinext. Read vinext's [caching guide](https://vinext.dev/docs/guides/caching) and [Cloudflare page](https://vinext.dev/docs/deploying/cloudflare) for the installed version first.

## Scope
- **`GET /api/unsplash?q=`:**
  - Trim `q` and cap it at 100 characters; empty → 400.
  - Missing `UNSPLASH_ACCESS_KEY` → 503 `{ error: "Photo search is not set up" }`, with no outbound fetch.
  - Otherwise fetch `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&orientation=portrait&per_page=12` with `Authorization: Client-ID ${key}` and `Accept-Version: v1`.
  - Map each result to exactly `{ id, urls: { small, regular }, user: { name, links: { html } }, links: { download_location } }`. Drop items whose URLs aren't `https://images.unsplash.com/…` (urls), `https://unsplash.com/…` (user link) or `https://api.unsplash.com/…` (download).
  - **Caching** protects the 50 requests/hour limit (review finding 26):
    - Cache the upstream search fetch for an hour in vinext's data cache, e.g. `fetch(url, { …, next: { revalidate: 3600 } })`.
    - Back the cache with `kvDataAdapter()` in `vite.config.ts` and a `VINEXT_KV_CACHE: bindings.kv()` binding in `cloudflare.config.ts`. Cloudflare provisions the namespace on deploy.
    - Make sure the entry vinext stores never contains the raw access key. If its cache key keeps request headers unhashed, cache the trimmed result keyed by `q` alone instead.
    - No in-memory `Map`: on Workers, memory is per isolate.
  - **Declare the secret:** add `UNSPLASH_ACCESS_KEY: bindings.secret()` to `cloudflare.config.ts`'s `env`. With Cloudflare Vite plugin v2, an undeclared `.dev.vars` or `.env` value never reaches the Worker, so the route would read `undefined` in dev ([`T-001-unsplash-secret-binding-in-t031.md`](../decisions/T-001-unsplash-secret-binding-in-t031.md)).
  - After adding `kvDataAdapter()`, re-run `npx vinext-cloudflare deploy --dry-run --skip-build` after `npm run build`, to confirm the deploy workflow's `--skip-build` still fits.
  - Respond with `Cache-Control: public, max-age=3600` for the browser. An `s-maxage` header isn't cached at the edge in front of a Worker.
  - Upstream errors → 502 `{ error: "Photo search failed" }` with no details.
- **`POST /api/unsplash`** with `{ downloadLocation }`:
  - Parse with `new URL()`. Require `protocol === "https:"`, `hostname === "api.unsplash.com"`, empty `username`/`password`, and the default port.
  - Then fetch it with the `Authorization` header and `redirect: "manual"`, and return 204.
  - Anything else → 400.
- `route.test.ts` (node environment; mock global `fetch`; set and unset `process.env.UNSPLASH_ACCESS_KEY`).
- **Out of scope:** the search UI (T-032).

## Acceptance criteria
- [x] Trims the API response to the allowed fields: extra upstream fields are absent (test).
- [x] **Security:** refuses a download ping to any host but `api.unsplash.com`, with no outbound fetch. Test each: `https://api.unsplash.com.evil.example/`, `https://evil.example/?u=https://api.unsplash.com/`, `https://api.unsplash.com@evil.example/`, `http://api.unsplash.com/photos/x/download`, `https://api.unsplash.com:8443/`.
- [x] **Security:** the key is read only from `process.env.UNSPLASH_ACCESS_KEY` (never `NEXT_PUBLIC_`), never appears in any response body or log, and a missing key returns 503 without fetching (tests).
- [x] `q` over 100 characters is capped and URL-encoded in the upstream request (test).
- [x] The upstream search is cached for an hour through vinext's data cache (test the cache option passed, or that a repeat query makes no second upstream call), and `cloudflare.config.ts` adds only the `VINEXT_KV_CACHE` binding and the `UNSPLASH_ACCESS_KEY` secret declaration. *It also adds the `UNSPLASH_RATE_LIMIT` binding, from the security audit ([`T-031-rate-limit-third-binding.md`](../decisions/T-031-rate-limit-third-binding.md)).*
- [x] `npm test` and `npx tsc --noEmit` pass.

## Dependencies
- T-001: the App Router, Vitest, `.dev.vars.example`, and the vinext and Cloudflare config this ticket extends.

## Outcome
- **Built:** `src/app/api/unsplash/route.ts`, the app's only server code. GET searches Unsplash (portrait, 12 results) and returns six allowlisted fields per photo; the upstream call is cached for an hour in vinext's data cache, backed by the new `VINEXT_KV_CACHE` KV binding. POST pings a photo's download location, pinned to `api.unsplash.com/photos/<id>/download`. The key is the declared `UNSPLASH_ACCESS_KEY` secret; without it both return 503. 812 tests pass; `tsc`, lint and `vite build` are clean.
- **Review:** approved with one should-fix and three nits. The should-fix found that a declared secret is required at deploy, so the deploy fails until the secret is set on the Worker; the user sets it before this push ([`T-031-secret-set-before-push.md`](../decisions/T-031-secret-set-before-push.md)). The nits are fixed in `92d9ab8`.
- **Security:** two mediums ([review](../review/2026-10-23-security-T-031-review.md)). SEC-1, quota exhaustion: fixed with a per-client rate limit in `b71c3c0`, with the remainder (one client can still drain the demo quota) accepted by the user. SEC-2, IPv6 address rotation: a fix was written and dropped as overkill, and the gap is accepted.

## Notes
- **Wave 8 audit (low):** cross-site browser requests reach the route; the fix lands with T-032 ([`general-wave-8-cross-site-check-in-t032.md`](../decisions/general-wave-8-cross-site-check-in-t032.md)).
- **For T-032:** import `type UnsplashPhoto` from the route; treat 503 (not set up) and 502 (failed) alike, and show the 429 body's message rather than a generic failure. The 400ms debounce can reach 10 searches a minute for a fast typist, and cache hits count too.
- **Fresh-clone type-check:** `npx tsc --noEmit` needs `.cloudflare/types` generated first (a dev run, a build or `npx cf workers types`), for `cloudflare:workers` and `RateLimit`.
- **After a vinext upgrade:** recheck that `buildFetchCacheKey` still hashes the headers, so the key never sits in KV in the clear.
- **Unverified:** that Unsplash search ignores case, so lower-casing queries doesn't change results; not checked live, to save quota.
- **The README's path to production** must say the Unsplash secret is required to deploy, and that a global quota counter and Unsplash production approval come before wider use.
Only if this ships, the user sets `UNSPLASH_ACCESS_KEY` as a secret on the `captivator` Worker (Cloudflare dashboard → the Worker → Settings → Variables and Secrets). Locally it goes in `.dev.vars`. `process.env` gets it through the declared secret and the Node.js compatibility setting from T-001. Hotlinked `urls.regular` passes the schema's `https:` image allowlist.

## Decisions
- [`T-001-unsplash-secret-binding-in-t031.md`](../decisions/T-001-unsplash-secret-binding-in-t031.md): T-031, not the scaffold, declares UNSPLASH_ACCESS_KEY as a secret binding
- [`T-031-unsplash-cache-in-data-cache.md`](../decisions/T-031-unsplash-cache-in-data-cache.md): The Unsplash route caches searches in vinext's KV-backed data cache
- [`general-deploy-cloudflare-vinext.md`](../decisions/general-deploy-cloudflare-vinext.md): The MVP deploys to Cloudflare Workers with vinext, not Vercel
- [`general-stretch-tickets-scheduled.md`](../decisions/general-stretch-tickets-scheduled.md): Stretch tickets are scheduled, not held until the build is ahead
- [`general-url-allowlist.md`](../decisions/general-url-allowlist.md): Image and credit URLs are allowlisted by scheme and host
- [`T-031-unsplash-cache-in-data-cache.md`](../decisions/T-031-unsplash-cache-in-data-cache.md): the search is cached in vinext's data cache, never with the key in the clear
- [`T-001-unsplash-secret-binding-in-t031.md`](../decisions/T-001-unsplash-secret-binding-in-t031.md): T-031 declares the secret
- [`T-031-search-cached-by-fetch-revalidate.md`](../decisions/T-031-search-cached-by-fetch-revalidate.md): the cache is fetch `next.revalidate`, keyed by a hash over the headers
- [`T-031-download-ping-path-pinned.md`](../decisions/T-031-download-ping-path-pinned.md): the ping is pinned to `/photos/<id>/download`
- [`T-031-error-responses.md`](../decisions/T-031-error-responses.md): fixed, no-store error bodies
- [`T-031-query-and-paging-inputs.md`](../decisions/T-031-query-and-paging-inputs.md): `q` capped at 100 code points; caller paging ignored
- [`T-031-unsplash-rate-limit-binding.md`](../decisions/T-031-unsplash-rate-limit-binding.md): per-client Workers Rate Limiting binding (superseded)
- [`T-031-rate-limit-fails-closed.md`](../decisions/T-031-rate-limit-fails-closed.md): fails closed when unbound; no client IP shares one bucket
- [`T-031-rate-limit-third-binding.md`](../decisions/T-031-rate-limit-third-binding.md): a third binding beyond the ticket's scope
- [`T-031-search-query-normalised.md`](../decisions/T-031-search-query-normalised.md): queries lower-cased with whitespace collapsed
- [`T-031-secret-set-before-push.md`](../decisions/T-031-secret-set-before-push.md): the user sets the Worker secret before the push
- [`T-031-unsplash-quota-risk-accepted.md`](../decisions/T-031-unsplash-quota-risk-accepted.md): one client draining the demo quota is accepted
- [`T-031-ipv6-rotation-accepted.md`](../decisions/T-031-ipv6-rotation-accepted.md): IPv6 keyed by full address; the /64 fix dropped
