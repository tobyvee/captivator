---
title: "T-031: Unsplash search and download-ping API route"
type: ticket
project: captivator
status: todo
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
updated: 2026-10-22
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
  - Respond with `Cache-Control: public, max-age=3600` for the browser. An `s-maxage` header isn't cached at the edge in front of a Worker.
  - Upstream errors → 502 `{ error: "Photo search failed" }` with no details.
- **`POST /api/unsplash`** with `{ downloadLocation }`:
  - Parse with `new URL()`. Require `protocol === "https:"`, `hostname === "api.unsplash.com"`, empty `username`/`password`, and the default port.
  - Then fetch it with the `Authorization` header and `redirect: "manual"`, and return 204.
  - Anything else → 400.
- `route.test.ts` (node environment; mock global `fetch`; set and unset `process.env.UNSPLASH_ACCESS_KEY`).
- **Out of scope:** the search UI (T-032).

## Acceptance criteria
- [ ] Trims the API response to the allowed fields: extra upstream fields are absent (test).
- [ ] **Security:** refuses a download ping to any host but `api.unsplash.com`, with no outbound fetch. Test each: `https://api.unsplash.com.evil.example/`, `https://evil.example/?u=https://api.unsplash.com/`, `https://api.unsplash.com@evil.example/`, `http://api.unsplash.com/photos/x/download`, `https://api.unsplash.com:8443/`.
- [ ] **Security:** the key is read only from `process.env.UNSPLASH_ACCESS_KEY` (never `NEXT_PUBLIC_`), never appears in any response body or log, and a missing key returns 503 without fetching (tests).
- [ ] `q` over 100 characters is capped and URL-encoded in the upstream request (test).
- [ ] The upstream search is cached for an hour through vinext's data cache (test the cache option passed, or that a repeat query makes no second upstream call), and `cloudflare.config.ts` declares only the `VINEXT_KV_CACHE` binding.
- [ ] `npm test` and `npx tsc --noEmit` pass.

## Dependencies
- T-001: the App Router, Vitest, `.dev.vars.example`, and the vinext and Cloudflare config this ticket extends.

## Notes
Only if this ships, the user sets `UNSPLASH_ACCESS_KEY` as a secret on the `captivator` Worker (Cloudflare dashboard → the Worker → Settings → Variables and Secrets). Locally it goes in `.dev.vars`. `process.env` gets it through the Node.js compatibility setting from T-001. Hotlinked `urls.regular` passes the schema's `https:` image allowlist.

## Decisions
- [`T-031-unsplash-cache-in-data-cache.md`](../decisions/T-031-unsplash-cache-in-data-cache.md): The Unsplash route caches searches in vinext's KV-backed data cache
- [`general-deploy-cloudflare-vinext.md`](../decisions/general-deploy-cloudflare-vinext.md): The MVP deploys to Cloudflare Workers with vinext, not Vercel
- [`general-stretch-tickets-scheduled.md`](../decisions/general-stretch-tickets-scheduled.md): Stretch tickets are scheduled, not held until the build is ahead
- [`general-url-allowlist.md`](../decisions/general-url-allowlist.md): Image and credit URLs are allowlisted by scheme and host
