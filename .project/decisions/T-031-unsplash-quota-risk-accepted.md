---
title: "One client can still drain the Unsplash demo quota, and that risk is accepted until production approval"
type: decision
project: captivator
ticket: T-031
decided_by: user
supersedes: T-031-unsplash-rate-limit-binding.md
updated: 2026-10-23
tags: [project, captivator, decision, unsplash, security, rate-limit, api]
---
# One client can still drain the Unsplash demo quota, and that risk is accepted until production approval

## Context
The re-audit after the rate-limit fix found SEC-1 only partly resolved. At 10 requests per 60 s per client, one IP can make up to 600 searches an hour against the demo quota of 50, so a single caller can exhaust it in about 5 minutes, and photo search then fails for every customer for the rest of the hour. `T-031-unsplash-rate-limit-binding.md` said "many callers together" could reach the limit, which understated it: one is enough. A rate-limit binding's period can't exceed 60 s, so only a global counter (for example a Durable Object) could cap the hourly total. Asked to choose, the user accepted the risk.

## Decision
Keep the per-client throttle as built and accept that one caller can drain the demo quota. The path forward is Unsplash production approval (5,000 an hour), where 10 a minute per client is proportionate. The rules from `T-031-unsplash-rate-limit-binding.md` stay in force:
- `cloudflare.config.ts` declares `UNSPLASH_RATE_LIMIT: bindings.rateLimit({ namespace: "1031", simple: { limit: 10, period: 60 } })`, and `route.ts` reads it with `import { env } from "cloudflare:workers"`.
- GET and POST call the limiter first, before any parsing or fetch; a refused call is 429 with `no-store`.
- The key comes from `cf-connecting-ip` only, in separate `search:` and `ping:` buckets, keyed by the full address (`T-031-ipv6-rotation-accepted.md`).
- Cache hits and invalid requests count against the limit; local `vite dev` provides the binding.
- `npx tsc --noEmit` on a fresh clone needs `.cloudflare/types` generated first.
- T-032 shows the 429 body's message.

## Alternatives
- **A global hourly cap (a Durable Object counting upstream calls on cache misses):** closes the gap, but adds a binding, a class and tests to a stretch feature.
- **A tighter per-client limit (about 3 a minute):** slows draining to about 17 minutes without stopping it, and a fast-typing customer hits 429s sooner.

## Consequences
While on the demo tier, photo search can be made to fail for an hour at a time by anyone who calls it in a loop. It fails cleanly ("Photo search failed") and leaks nothing. Download-count inflation is bounded by the same per-client limit. Before applying for production approval, or if abuse is seen, revisit with a global counter.
