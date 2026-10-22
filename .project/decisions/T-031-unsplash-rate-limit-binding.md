---
title: "The Unsplash route throttles each client with a Workers Rate Limiting binding read from cloudflare:workers"
type: decision
project: captivator
ticket: T-031
decided_by: security-fixer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, unsplash, security, rate-limit, api]
---
# The Unsplash route throttles each client with a Workers Rate Limiting binding read from cloudflare:workers

## Context
A security audit of T-031 found the hourly Unsplash quota unprotected. `T-031-unsplash-cache-in-data-cache.md` relies on the data cache for quota, but each distinct query misses the cache, and the download ping is never cached. The ticket asks for "ideally a simple rate limit". The installed `cf/config` (`@cloudflare/config` 0.27.0) offers `bindings.rateLimit({ namespace, simple: { limit, period } })`, where `period` is 10 or 60 seconds. The route then needs a way to reach a binding object, not just a string from `process.env`.

## Decision
- **Binding:** `cloudflare.config.ts` declares `UNSPLASH_RATE_LIMIT: bindings.rateLimit({ namespace: "1031", simple: { limit: 10, period: 60 } })`.
- **Access:** `route.ts` does `import { env } from "cloudflare:workers"`, which vinext 1.3.0's README names as the way to reach bindings from a route handler. The production build keeps the import external and workerd resolves it. Vitest mocks the module (`vi.mock("cloudflare:workers")`) and swaps the binding per test.
- **Check:** both GET and POST call the limiter first, before any parsing or fetch. A refused call returns 429 with `Cache-Control: no-store`: "Too many searches, try again shortly" for search and "Too many requests, try again shortly" for the ping.
- **Key:** `search:<ip>` and `ping:<ip>`. The IP comes from Cloudflare's `cf-connecting-ip` header only, never a header the caller can set. Search and ping use separate buckets, so a customer who has searched a lot can still record the download of the photo they pick.

## Alternatives
- **A limiter in module memory:** memory is per isolate on Workers, so it limits nothing.
- **A KV or Durable Object counter:** KV is eventually consistent and spends writes on every request; a Durable Object is more code and config than this throttle needs.
- **Two bindings with a tighter ping limit:** a fourth binding and namespace for little gain at these volumes.
- **Reading the binding from vinext's request context:** `vinext/shims/request-context` exposes only the `ExecutionContext`, not `env`.

## Consequences
- Cloudflare's rate-limit counters are kept per Cloudflare location and only roughly synchronised, and the period can't exceed 60 s. This is a per-client throttle that caps how fast one caller can spend quota, not a hard cap on the hourly total: many callers together can still reach Unsplash's limit. Unsplash's production tier, or a global counter, is the fix for that.
- Cache hits and invalid requests count against the limit too, because the check runs first.
- Local `vite dev` provides the binding through Miniflare, so the throttle applies in dev as well.
- `npx tsc --noEmit` on a fresh clone now needs `.cloudflare/types` generated first (by a dev run, a build or `npx cf workers types`). `T-001-typecheck-without-generated-globals.md` anticipated this. The deploy workflow doesn't run `tsc`.
- T-032 should show the 429 body's message rather than its generic failure text.
