---
title: "Security review: T-001 scaffold"
type: review
project: captivator
updated: 2026-10-22
tags: [project, captivator, review, security, deploy]
---
# Security review: T-001 scaffold

`security-auditor` reviewed T-001's changes before they were committed: dependencies, `.gitignore`, the deploy workflow, the vinext, Cloudflare and Next.js config, `.dev.vars.example` and the schema tests. It found 2 issues, both low: 0 critical, 0 high, 0 medium.

## Findings

| # | Severity | Finding | Outcome |
|---|---|---|---|
| 1 | low | A manual run of `deploy.yml` could deploy a branch other than `main` to production, using the production Worker secrets. | **Fixed in T-001's commit:** the `deploy` job now has `if: github.ref == 'refs/heads/main'`. No automated regression test, because the Vitest include is rooted at `src/`. Verify by dispatching the workflow on another branch: the job should show as skipped. A stronger option, if the user sets it up: a `production` GitHub Environment limited to `main` that holds the Cloudflare secrets. |
| 2 | low | HTML responses carry no `X-Content-Type-Options`, `Referrer-Policy` or CSP `frame-ancestors`, so any site can frame the editor. The impact is small today: there's no auth and no server state. | **Deferred** ([`T-001-security-headers-deferred.md`](../decisions/T-001-security-headers-deferred.md)). The ticket's scope says "no custom headers". The fix is an `async headers()` in `next.config.ts` for `/:path*` with `nosniff`, `strict-origin-when-cross-origin` and `frame-ancestors 'none'; object-src 'none'; base-uri 'self'`, leaving `script-src` alone. |

## Checked and passed
- **Secrets:** the local `.env` values aren't in the build output, in tracked or staged files, or in git history.
- **`.gitignore`** covers `.env*`, `.dev.vars*` (except the example), `.wrangler/`, `dist/`, `.vinext/` and `.cloudflare/`.
- **Dev server:** it doesn't serve `.env` or `.dev.vars*`.
- **Workflow:**
  - Triggers are `push` to `main` and manual dispatch only.
  - It has `contents: read` and `persist-credentials: false`.
  - Secrets are set only on the deploy step, and actions are pinned to SHAs that match their tags.
  - The tests run before the deploy.
- **`cloudflare.config.ts`:** only the `ASSETS` binding, with no plain vars.
- **Lockfile:** every package resolves from registry.npmjs.org with integrity hashes. The remaining `npm audit` entries (`braces`, `fflate`) are build-time only and not in the Worker bundle ([`T-001-vite-patched-release.md`](../decisions/T-001-vite-patched-release.md)).
- **Schema:** the tests cover every security case in the ticket. Extra probes were also rejected: an uppercase `DATA:` scheme, a trailing newline, `//` host tricks, `@` userinfo and leading whitespace.

## For later audits
`ImageSrc` checks only the prefix of a data URL, and `https:` sources may be on any host (`general-url-allowlist.md`). React escapes attributes, so this is safe in `<img src>`. A `src` must still never reach a CSS `url()` or string-built HTML. The export must inline or drop every `https:` source, as T-023's security criterion already requires. T-006 renders the photo as an `<img>`, not a CSS background.
