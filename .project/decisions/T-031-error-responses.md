---
title: "The Unsplash route's error statuses, no-store on errors, status-only logs and an exported result type"
type: decision
project: captivator
ticket: T-031
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, unsplash, api, security]
---
# The Unsplash route's error statuses, no-store on errors, status-only logs and an exported result type

## Context
The ticket sets the search's 400, 503 and 502 responses and the ping's 204 and 400. It leaves open:
- what the ping returns without a key or when Unsplash fails;
- how error responses are cached;
- what gets logged;
- how T-032 gets the result type.

## Decision
- **Ping:**
  - The route checks the body first (400), then the key: without one it returns a 503 "Photo search is not set up", as search does, and makes no fetch.
  - A thrown request or a non-2xx reply, including a redirect, is a 502 "Photo search failed".
  - The reply body is cancelled unread.
- **Search:**
  - These are each a 502 with no details: a non-2xx reply, a body that isn't JSON or has no `results` array, and a thrown request.
  - Results that fail the field checks are dropped individually rather than failing the whole search.
- **Caching:** every error response is `Cache-Control: no-store`, so a browser never keeps a 503 or 502 after the key is set or Unsplash recovers. Only a 200 search carries `public, max-age=3600`.
- **Logs:** `console.error` gets a fixed message and at most the upstream status code: never the URL, headers, error object or reply body.
- **Type:** `route.ts` exports `type UnsplashPhoto = z.infer<typeof Photo>` for T-032 to import with `import type`.

## Alternatives
- **400 for a ping without a key:** "anything else → 400" covers bad input, and a missing key isn't the caller's fault.
- **Log the caught error:** a fetch error message can echo request details.
- **A shared type in `src/lib/`:** a new module outside this ticket's `touches`.

## Consequences
T-032 shows its fallback message for 503 and 502 alike, and can ignore the ping's result.
