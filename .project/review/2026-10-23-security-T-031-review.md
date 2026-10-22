---
title: "Security audit: T-031 Unsplash search and download-ping route"
type: review
project: captivator
updated: 2026-10-23
tags: [project, captivator, review, security, unsplash, api]
---
# Security audit: T-031 Unsplash search and download-ping route

**Scope:** `8820cc2..dc06737` (`src/app/api/unsplash/route.ts`, its tests, `vite.config.ts`, `cloudflare.config.ts`), then the fix commits `b71c3c0` and `92d9ab8`.
**Totals:** 0 critical, 0 high, 2 medium (one partly fixed with the remainder accepted, one accepted), 0 low.

## Findings

### SEC-1 (medium): anyone could exhaust the Unsplash hourly quota
- **Problem:** the route is public. Each distinct query missed the data cache and spent quota, and the download ping was never cached, so a caller could drain the 50-an-hour demo quota and inflate download counts under the app's key.
- **Fix (`b71c3c0`):** a Workers Rate Limiting binding (`UNSPLASH_RATE_LIMIT`, 10 per 60 s), checked first in GET and POST, keyed by `cf-connecting-ip` in separate search and ping buckets. Refusals are 429 with `no-store`, and the route fails closed when unbound. Queries are normalised so equivalent searches share a cache entry. Six regression tests, each failing before the fix.
- **Re-audit:** partly resolved. A per-client limit can't cap the hourly total, so one caller can still drain the demo quota in about 5 minutes.
- **Outcome:** the remainder is accepted by the user until Unsplash production approval ([`T-031-unsplash-quota-risk-accepted.md`](../decisions/T-031-unsplash-quota-risk-accepted.md)).

### SEC-2 (medium): IPv6 clients could rotate addresses past the limit
- **Problem:** the limiter keys on the full IPv6 address, and a client holding a /64 can rotate within it.
- **Outcome:** a /64-keyed fix was written and dropped as overkill. The user accepted the gap ([`T-031-ipv6-rotation-accepted.md`](../decisions/T-031-ipv6-rotation-accepted.md)); the fix stays on the local branch `dropped/T-031-ipv6-limit`.

## Checks that passed
- The access key never reaches a response, a log or KV: vinext 1.3.0 keys its fetch cache by a SHA-256 over the URL, method and headers, and stores only status, URL, headers and body.
- The download ping reaches only `https://api.unsplash.com/photos/<id>/download`: parsed, exact host, no userinfo, default port, pinned path, `redirect: "manual"`.
- Responses are trimmed to six fields, each URL allowlisted by scheme and exact host.
- `q` is trimmed, normalised and capped at 100 code points; caller paging is ignored; errors are fixed strings with `no-store`.
- No secret is committed; the key is declared only as `bindings.secret()`.
