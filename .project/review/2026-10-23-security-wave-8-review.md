---
title: "Security audit: wave 8"
type: review
project: captivator
updated: 2026-10-23
tags: [project, captivator, review, security, wave-8]
---
# Security audit: wave 8

**Scope:** `2645a78..56f073a`: T-022 (Error and Connected guest screens, screen switcher), T-026 (logo palette), T-028 (small-phone fit check), T-031 (Unsplash route and rate limit).
**Totals:** 0 critical, 0 high, 0 medium, 1 low (deferred to T-032). The two risks the user accepted on T-031 ([`T-031-unsplash-quota-risk-accepted.md`](../decisions/T-031-unsplash-quota-risk-accepted.md), [`T-031-ipv6-rotation-accepted.md`](../decisions/T-031-ipv6-rotation-accepted.md)) weren't re-raised.

## Findings

### SEC-1 (low): `/api/unsplash` accepts cross-site browser requests
- **Problem:** neither handler checks where a request comes from, and POST parses its body whatever its `Content-Type`. Any website can make its visitors' browsers search or ping through the route without a CORS preflight. Each visitor brings their own IP, so the per-client limit doesn't bound the total, and inflated download counts under the app's key are what Unsplash's terms forbid.
- **Fix:** POST returns 415 unless `Content-Type` is `application/json` (forcing a preflight, which fails with no `Access-Control-Allow-Origin`); both handlers return 403 when `Sec-Fetch-Site` is `cross-site`; both checks run before parsing. Regression tests: a `text/plain` POST is 415 with no upstream fetch; a cross-site GET is 403 with no fetch; a same-origin GET is still 200.
- **Outcome:** deferred to T-032, whose client must send the JSON content type anyway ([`general-wave-8-cross-site-check-in-t032.md`](../decisions/general-wave-8-cross-site-check-in-t032.md)).

## How the tickets combine (clean)
- **Unsplash results:** the route returns only canonical URLs that pass the design schema's allowlist; nothing writes them into a design until T-032. Export still inlines every non-data image, and its guard allows only raster data URLs.
- **Guest screens in export:** export renders only `landing`, and the Error and Connected markup never reaches the export guard, which fails closed if it ever does.
- **Logo palette:** fed only upload data URLs; output re-validated as 6-digit hex and never persisted.
- **Fit check:** an inert, hidden render of the same `SplashPage`; no new sink.
- **Persistence:** still `{ design, name }` through `Design.safeParse`.
- **Config:** `ASSETS`, `VINEXT_KV_CACHE`, the `UNSPLASH_ACCESS_KEY` secret and `UNSPLASH_RATE_LIMIT`; `.gitignore` covers every local secret file; no key-like strings in the range.
- **Dependencies:** unchanged in the range; `npm audit --omit=dev` reports build-time glob tooling under vinext that no runtime input reaches.
