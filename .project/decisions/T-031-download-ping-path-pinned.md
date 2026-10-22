---
title: "The download ping accepts only /photos/:id/download on api.unsplash.com, and results whose download URL fails that are dropped"
type: decision
project: captivator
ticket: T-031
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, unsplash, security, api]
---
# The download ping accepts only /photos/:id/download on api.unsplash.com, and results whose download URL fails that are dropped

## Context
The ticket requires the ping's URL to parse as `https:` on exactly `api.unsplash.com`, with no userinfo and the default port. That still lets a caller make the route send the key to any path on Unsplash's API. The ticket also doesn't say whether the route passes URLs through as received or normalises them.

## Decision
- **Path:** on top of the ticket's host checks, the ping's path must be `/photos/<id>/download`, the documented `download_location` shape. Search drops any result whose `download_location` fails the same check, so every result it returns can be pinged.
- **Normalised URLs:** the route returns each allowed URL as its parsed `URL.href`. Every URL then starts with `https://<host>/`, which the design schema's prefix regexes also require.

## Alternatives
- **Host check only, as the ticket states:** meets the criteria, but lets the route reach any API path with the key.
- **Pass URLs through unchanged:** a URL with an upper-case scheme or host would pass here and fail the schema later.

## Consequences
If Unsplash changes the `download_location` shape, those results disappear from search rather than the route pinging an unknown endpoint. The tests pin the path and host checks.
