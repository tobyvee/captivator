---
title: "Security headers on HTML responses are deferred, not added in the scaffold"
type: decision
project: captivator
ticket: T-001
decided_by: main session
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, security, headers]
---
# Security headers on HTML responses are deferred, not added in the scaffold

## Context
The security review of T-001 (finding 2, low) noted that HTML responses carry no `X-Content-Type-Options`, `Referrer-Policy` or CSP `frame-ancestors`, so any site can frame the editor. T-001's scope says `next.config.ts` has "no custom headers", and `/implement-ticket` lists low findings under the ticket's Notes.

## Decision
Ship the scaffold without the headers, and record the finding and its fix in the review doc and in T-001's Notes.

## Alternatives
- Add `async headers()` to `next.config.ts` now: a departure from the ticket's scope, made for a low finding, while the editor has no auth or server state for clickjacking to reach.

## Consequences
The editor can still be framed. Any ticket can still add the headers: it would supersede this decision and the ticket's "no custom headers" line. The final full audit (T-030) will see this decision and can raise the finding again if later work makes it worse.
