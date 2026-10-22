---
title: "IPv6 clients are rate-limited by their full address; grouping by /64 is not worth it"
type: decision
project: captivator
ticket: T-031
decided_by: user
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, unsplash, security, rate-limit, api]
---
# IPv6 clients are rate-limited by their full address; grouping by /64 is not worth it

## Context
The re-audit of T-031's rate limit raised SEC-2 (medium): the limiter keys on the full `cf-connecting-ip`, so an IPv6 client can rotate addresses within its /64 and get a fresh bucket each time. A fix keyed IPv6 by /64 with a hand-written parser (about 100 lines of code and tests). The user judged it overkill.

## Decision
Keep keying by the full address and accept the IPv6 rotation gap. The fix is kept unpushed on the local branch `dropped/T-031-ipv6-limit`.

## Alternatives
- **Key IPv6 by /64:** closes per-/64 rotation, but a client with a larger block can still rotate between /64s, and it adds an IP parser to a stretch feature whose quota is already drainable by one client (`T-031-unsplash-quota-risk-accepted.md`).
- **An IP-parsing package:** a new dependency for the same gain.

## Consequences
The per-client throttle slows casual abuse but doesn't stop a determined IPv6 caller. It only protects the demo quota and download counts, and photo search fails cleanly when the quota runs out. Revisit together with the global counter before Unsplash production approval.
