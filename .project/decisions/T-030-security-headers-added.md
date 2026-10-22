---
title: "Every response carries nosniff, a strict referrer policy and a CSP that forbids framing"
type: decision
project: captivator
ticket: T-030
decided_by: security-fixer
supersedes: T-001-security-headers-deferred.md
updated: 2026-10-23
tags: [project, captivator, decision, security, headers]
---
# Every response carries nosniff, a strict referrer policy and a CSP that forbids framing

## Context
The final full audit before deploy (T-030) raised the T-001 finding again: HTML responses had no `X-Content-Type-Options`, `Referrer-Policy` or CSP, so the editor could be framed by another site, and nothing backstopped any future markup sink. `T-001-security-headers-deferred.md` had deferred the headers and left the door open for a later ticket.

## Decision
`next.config.ts` gains `async headers()` with one `/:path*` rule: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` and `Content-Security-Policy: frame-ancestors 'none'; object-src 'none'; base-uri 'self'`. vinext 1.3.0 applies these to pages, the API route and `public/` files; content-hashed `/_next/static/*` assets come straight from the Workers assets binding without them, which is harmless.

## Alternatives
- A full CSP with `script-src` and `img-src`: vinext hydrates with inline scripts, designs need `https:` and `data:` images, and react-colorful injects a `<style>`, so it would need nonces or `'unsafe-inline'` for little gain in this MVP.
- `X-Frame-Options: DENY` as well: redundant with `frame-ancestors` in every current browser.
- Keep deferring: the editor is about to be deployed publicly, and the fix is three static headers.

## Consequences
The editor can't be embedded in an iframe anywhere, including by us; a future embed would need an explicit `frame-ancestors` allowlist. A later ticket that tightens the CSP (script or image sources) adds to this rule rather than a second one. Exported splash HTML is unaffected; it's a downloaded file, not a served response.
