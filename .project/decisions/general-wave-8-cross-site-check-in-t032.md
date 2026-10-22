---
title: "The Unsplash route's cross-site and content-type checks land with T-032"
type: decision
project: captivator
ticket: [T-031, T-032]
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, unsplash, security, api]
---
# The Unsplash route's cross-site and content-type checks land with T-032

## Context
The wave 8 security audit found one low: `/api/unsplash` accepts cross-site browser requests, so another site's visitors could be made to search or ping through it, each under their own IP and the app's key ([wave 8 review](../review/2026-10-23-security-wave-8-review.md)). `/implement-parallel` puts lows under the ticket's notes. Nothing calls the route yet: T-032 builds its only client, and the fix requires that client to send `Content-Type: application/json`.

## Decision
Defer the fix to T-032, adding `src/app/api/unsplash/route.ts` and its test to T-032's work: POST returns 415 unless the body is `application/json`, both handlers return 403 on `Sec-Fetch-Site: cross-site`, both before parsing, with the audit's three regression tests.

## Alternatives
- **Fix it now in T-031:** a low on a route nothing calls yet; landing it with its client keeps the client and the check in step.
- **Leave it in notes only:** easy to lose, and the cost of the fix is a few lines.

## Consequences
T-032 touches `route.ts` and `route.test.ts` as well as `UnsplashSearch.tsx`. No other wave 9 ticket touches them, so the wave stays parallel-safe.
