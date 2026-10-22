---
title: "The Unsplash route refuses all calls when the rate limiter isn't bound, and requests with no client IP share one bucket"
type: decision
project: captivator
ticket: T-031
decided_by: security-fixer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, unsplash, security, rate-limit]
---
# The Unsplash route refuses all calls when the rate limiter isn't bound, and requests with no client IP share one bucket

## Context
`T-031-unsplash-rate-limit-binding.md` keys the Unsplash route's throttle by `cf-connecting-ip` and reads the limiter from the Worker env. Two cases needed a rule: the binding missing from the env, and a request without that header.

## Decision
- **No binding:** fail closed. Both endpoints return 503 "Photo search is not set up" with `Cache-Control: no-store`, log a fixed message and make no upstream call. This matches the route's behaviour with no access key.
- **No `cf-connecting-ip`:** the request is limited under the shared key `unknown` (`search:unknown`, `ping:unknown`). The route never falls back to `X-Forwarded-For` or any other header a caller can set.

## Alternatives
- **Fail open without the binding:** a misconfigured deploy would silently lose the only protection for the quota and the app's API key. Photo search is an optional feature with a fallback in the UI, so turning it off is the cheaper failure.
- **Refuse requests with no client IP:** Cloudflare sets the header on every request from the internet, so the case only arises locally or from a subrequest. Sharing one limited bucket keeps those working while still bounding them.
- **Trust `X-Forwarded-For`:** the caller sets it, so each request could claim a fresh bucket.

## Consequences
- The binding is declared in `cloudflare.config.ts` and Miniflare provides it in dev, so fail closed only triggers on a broken config. Tests run against a mocked binding.
- Requests with no client IP limit one another as a group.
