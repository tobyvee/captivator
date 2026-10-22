---
title: "The Unsplash route checks Sec-Fetch-Site and the JSON content type after the rate limiter and before parsing"
type: decision
project: captivator
ticket: T-032
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, unsplash, security, api]
---
# The Unsplash route checks Sec-Fetch-Site and the JSON content type after the rate limiter and before parsing

## Context
The wave 8 audit's SEC-1 (`general-wave-8-cross-site-check-in-t032.md`) asks for a 403 on `Sec-Fetch-Site: cross-site` in both handlers and a 415 on a POST that isn't `application/json`, both before parsing. It doesn't say where they sit relative to the limiter. `T-031-unsplash-quota-risk-accepted.md` (`decided_by: user`) restates that "GET and POST call the limiter first, before any parsing or fetch". The audit also doesn't say how to treat a missing `Sec-Fetch-Site` or a content type with parameters.

## Decision
- **Order:** the limiter runs first, as the user decision says, then the cross-site check, then (POST only) the content-type check, then parsing.
- **Sec-Fetch-Site:** only the value `cross-site` is refused. `same-origin`, `same-site`, `none` and a missing header pass. A missing header means a client that isn't a modern browser, which another site can't drive, and the limiter still applies to it.
- **Content type:** the media type before any `;` is trimmed and lower-cased and must equal `application/json`. Parameters such as `charset=utf-8` are allowed; a missing header, `text/plain`, a form type and suffixed types like `application/json-patch+json` are 415.
- Both refusals are `no-store` JSON errors, like the route's other errors.

## Alternatives
- **Header checks before the limiter:** a refused cross-site request then wouldn't use up the visitor's own bucket, but it reorders a rule the user's decision states. Worth raising if forged requests ever deny real customers their searches.
- **Require `Sec-Fetch-Site` to be present:** would refuse non-browser clients and older browsers for no gain against cross-site abuse.
- **Accept any `+json` type:** these are non-simple types that also force a preflight, but nothing sends them.

## Consequences
The only client, `UnsplashSearch`, sends `Content-Type: application/json` on the ping and plain same-origin GETs for search. A cross-site page can still spend one unit of a visitor's search or ping bucket per forged request before the 403.
