---
title: "T-031 adds a third Worker binding, the Unsplash rate limiter, beyond the ticket's KV cache and secret"
type: decision
project: captivator
ticket: T-031
decided_by: security-fixer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, unsplash, security, scope, infra]
---
# T-031 adds a third Worker binding, the Unsplash rate limiter, beyond the ticket's KV cache and secret

## Context
T-031's acceptance criteria say `cloudflare.config.ts` "adds only the `VINEXT_KV_CACHE` binding and the `UNSPLASH_ACCESS_KEY` secret declaration". That line is in the ticket, not in a decision file, so no decision is superseded. A security audit then found that the cache alone doesn't protect the Unsplash quota, and the ticket also asks for "ideally a simple rate limit".

## Decision
`cloudflare.config.ts` also declares `UNSPLASH_RATE_LIMIT` (see `T-031-unsplash-rate-limit-binding.md`). The rest of the ticket's binding rules stay in force:
- `VINEXT_KV_CACHE: bindings.kv()` backs vinext's data cache, and `T-031-unsplash-cache-in-data-cache.md` still holds: the cache remains the first line of quota protection.
- `UNSPLASH_ACCESS_KEY` stays a declared secret (`T-001-unsplash-secret-binding-in-t031.md`), never a plain variable.
- No other binding is added.

## Alternatives
- **Keep to two bindings:** leaves the quota open to a single caller, which the audit rated medium.

## Consequences
The binding uses rate-limit namespace ID 1031, which must stay unique among the Worker rate limiters in the Cloudflare account. The user has nothing to set up.
