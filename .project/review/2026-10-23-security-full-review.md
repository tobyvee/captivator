---
title: "Security audit: full repo before the final deploy"
type: review
project: captivator
updated: 2026-10-23
tags: [project, captivator, review, security]
---
# Security audit: full repo before the final deploy

**Scope:** the full repo at `8035bda` (main), run by `security-auditor` for T-030's final full audit. Changes after that commit were audited separately: wave 10 (`8035bda..498fbf2`, T-029 and T-036) found nothing, and the SEC-1 re-audit covered `498fbf2..HEAD` (T-030). Together these cover the deployed code ([`T-030-full-audit-reused.md`](../decisions/T-030-full-audit-reused.md)). The fixes added to wave 11 after T-030 (T-037 to T-043, `9650ed1..375bfef`) were audited as a range at the wave's close and found nothing. The only open items are the build-time `npm audit` advisories already recorded below.

**Totals:** 0 critical, 0 high, 0 medium, 1 low.

## SEC-1 (low): no security headers on HTML responses — fixed
- **Gap:** responses carried no `X-Content-Type-Options`, `Referrer-Policy` or CSP, so any site could frame the editor, and future markup changes had no CSP backstop. The impact was small: the editor has no auth and no server-side state, and designs live in the customer's own browser. It had been deferred, not accepted ([`T-001-security-headers-deferred.md`](../decisions/T-001-security-headers-deferred.md)), with this audit named as the point to raise it again.
- **Fix:** `7f5bb96`. `next.config.ts` sends `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` and `Content-Security-Policy: frame-ancestors 'none'; object-src 'none'; base-uri 'self'` on every page, API and public-file response. `script-src`, `style-src` and `img-src` are left unset on purpose. A regression test (`src/app/security-headers.test.ts`) checks the rule. The fix is recorded in [`T-030-security-headers-added.md`](../decisions/T-030-security-headers-added.md), which supersedes the deferral.
- **Re-audit:** resolved. vinext 1.3.0 applies the headers to App Router pages and the API route (checked in the code and in a local `vite preview`). Hashed `/_next/static/*` assets are served straight from the assets binding without them, which isn't a risk.

## Checked and holding
- **Schema:** image `src` and credit URLs are allowlisted, colours are 6-digit hex, and strings are bounded.
- **Store and persistence:** every action and restore is `safeParse`d, and only `{ design, name }` is persisted.
- **Splash output:** there is no `dangerouslySetInnerHTML`, design text is rendered only as text, and only validated values reach styles.
- **Export:** images are inlined to raster data URLs and fail closed, an allowlist guard checks the output, the title and file name are escaped, the form action is a literal placeholder, and the page has no scripts or external requests.
- **Uploads:** size is checked before reading, the type is sniffed from the bytes, SVGs are rasterised only through `<img>`, and remote fetches are capped while streaming.
- **Unsplash route:**
  - The key stays server-side, the ping host and path are pinned, and redirects are handled manually.
  - Results are trimmed to allowlisted fields, errors are fixed strings, and requests are throttled per client and fail closed.
  - Cross-site requests and non-JSON POSTs are refused.
  - The user's accepted risks (the quota, IPv6 rotation) were not re-raised.
- **Repo and deploy:**
  - `.gitignore` covers the env and build outputs, and the git history has no secrets.
  - The workflow runs only on main with read-only permissions, and its actions are pinned to SHAs.
  - `npm audit` findings are build-time tooling only and can't be reached at runtime.
