---
title: "Security audit: T-006 background renderer"
type: review
project: captivator
updated: 2026-10-23
tags: [project, captivator, review, security, splash]
---
# Security audit: T-006 background renderer

**Scope:** `a4381da..f27947b` (`src/splash/Background.tsx`, `src/splash/Background.test.tsx`), then the fix commit `1d6d1a1`.
**Totals:** 0 critical, 0 high, 0 medium, 1 low (fixed).

## Checked and holding
- **CSS injection:** every design value that reaches a `style` is a schema-validated hex colour or a bounded number. This covers colour, gradient stops, backdrop, overlay stops, opacity, zoom and focus. React's static renderer HTML-escapes style values but doesn't CSS-escape them, so hex validation is the protection. It holds because every store action runs `Design.safeParse` first (`T-004-store-rejects-invalid-designs.md`).
- **Image src:** `background.src` reaches only `<img src>` as a React attribute, never CSS. The schema's `ImageSrc` limits it to raster `data:` URLs, `/templates/*` and `https:`.
- **Credit links:** the profile link must parse to origin `https://unsplash.com` (`T-006-credit-profile-origin-recheck.md`). The home link is a constant. Both carry `rel="noopener noreferrer"`. In export the credit is now plain text with no links (`T-006-export-credit-plain-text.md`).
- **Text escaping:** `credit.name` renders as a React text child, and a test covers it.

## Findings

### SEC-1: low. A long credit name could cover Connect and the terms row (fixed)
- **Where:** the `CREDIT` style and `Credit` in `src/splash/Background.tsx`.
- **Problem:** `credit.name` is an unbounded string, and the credit sat above the content column (z-index 2) with no width cap. In a tampered or shared design, a long name wrapped upward over the form. Taps meant for Connect would land on the credit, and customer text could sit over the consent row. No script runs, and the links stay on unsplash.com.
- **Outcome:** fixed in `1d6d1a1`. The credit stays on one line: `maxWidth: calc(100% - 20px)`, `nowrap`, `overflow: hidden`, `ellipsis`. A regression test renders a 500-character name and asserts those styles and that the name is escaped. The schema is unchanged, because it is user-committed (`general-design-schema-committed.md`).

## Note for T-023 (not a finding)
React's `renderToStaticMarkup` emits `<link rel="preload" as="image">` before any `<img>` whose src isn't a data URL. The export must inline every image before rendering and fail closed if inlining fails. Its tests must assert there's no `<link` and no `https?://` in the output. This is recorded on T-023.
