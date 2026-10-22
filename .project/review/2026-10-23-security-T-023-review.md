---
title: "Security audit: T-023 Export HTML builder"
type: review
project: captivator
updated: 2026-10-23
tags: [project, captivator, review, security, export]
---
# Security audit: T-023 Export HTML builder

**Scope:** `480f974..9d8c5b8` (`src/lib/export.ts`, `src/lib/export.test.ts`), then the fix commits `8481ab9` and `9c72b23`.
**Totals:** 0 critical, 0 high, 1 medium (fixed), 1 low (fixed).

## Checked and holding
- **Design name:** `<title>` uses `escapeHtml`, and the name never reaches the form comments. The store restores `name` only as a string of 60 characters or fewer.
- **Download file name:** `exportFileName` keeps only `[a-z0-9-]`, so no path characters get through.
- **Blob:** `text/html`, with `<meta charset="utf-8">` first.
- **Text and attributes:** React escapes `"` and `&` in text and attribute values, so entity or quoting tricks can't forge a match, and terms text can't become markup.
- **Inlining:** fails closed on a rejection, a timeout, a non-string result and SVG or other non-raster data URLs. Images already stored as raster data URLs pass through and are used only as `<img src>`.
- **Form action:** both actions are constants. `command=login` appears only for click-through forms. The photo credit is plain text in the export.
- **Accepted risk, not re-raised:** at export time the customer's own browser fetches any `https:` image host in the design (`general-url-allowlist.md`). The editor preview already loads the same URL.

## Findings

### SEC-1: medium. The final check missed CSS loads, SVG links, meta refresh, extra styles and ping (fixed)
- **Where:** `assertSelfContained` in `src/lib/export.ts`.
- **Problem:** `T-023-final-attribute-guard.md` relies on the check to stop a future renderer change from making the exported page load something. It let through a CSS `url()` or `image-set()` in an inline style, an SVG `xlink:href`, a meta refresh, a `<style>` with `@import`, and a `ping` attribute. None is reachable today, because every inline style value is a validated hex colour or a number. A renderer change such as drawing the photo with a CSS background image would have passed, though.
- **Outcome:** fixed in `8481ab9`. The check now runs on the body markup before it's wrapped. It blocks `meta`, `style`, `image`, `use` and `feimage` along with the earlier tags, reads `xlink:href` as `href`, refuses `ping`, `background` and `data`, and refuses `url(`, `image-set(`, `@import` or a backslash inside any inline style. The wrapper must have exactly one `<style>`. Regression tests cover each pattern, and the real photo-background exports still pass.

### SEC-2: low. The final check accepted either form placeholder whatever the fields (fixed)
- **Where:** the `action` rule in `assertSelfContained`.
- **Problem:** a renderer change that sent a form with guest fields to the router placeholder would have passed the check, and guests' details would go straight to the router, which `general-export-form-action.md` forbids.
- **Outcome:** fixed in `9c72b23`. The check requires the action that the design's fields imply, and refuses a `command` input when there are fields. Decision: `T-023-guard-covers-css-and-form-action.md`.

## Re-audit after fixes (`9d8c5b8..be9482f`)
SEC-1 and SEC-2 were confirmed fixed, and the review fixes in `be9482f` add nothing new. The re-audit found two more ways past the blocklist guard. Neither is reachable from today's renderer, whose only SVG is the close icon (`fill="none"`, `stroke="currentColor"`, one `<path>`).

### RE-SEC-1: medium. SVG paint references and SVG animation passed the guard
- **Problem:** CSS `url()` in SVG paint and reference attributes (`fill`, `mask`, `clip-path`, `cursor` and similar), and SVG animation elements that change a link target, weren't refused. In a test page they caused requests and navigation with JavaScript off.
- **Outcome:** the guard moves from a blocklist to an allowlist of the tags and attributes SplashPage actually emits ([`T-023-export-guard-allowlist.md`](../decisions/T-023-export-guard-allowlist.md)). Anything else fails the export until it is deliberately allowed.

### RE-SEC-2: low. Non-double-quoted attributes skipped the attribute checks
- **Problem:** raw markup with single-quoted or unquoted attribute values (possible only if the renderer ever injects raw HTML) wasn't checked.
- **Outcome:** every attribute must be double-quoted or a bare boolean, as React emits them.

## Final re-audit (`be9482f..648b307`)
RE-SEC-1 and RE-SEC-2 were confirmed closed. 97 probe cases tried to get past the tokenizer: whitespace variants, uppercase, duplicate attributes, `<` and `>` inside values, comments, CDATA, character references, NUL bytes and CSS function tricks. None got through with anything that loads, and the CSS tricks that passed the `style` rule fetched nothing in headless Chrome. A fuzz of 72 hostile designs exported with no false positives. `renderToStaticMarkup` emits no `<!-- -->` separators.

### FINAL-SEC-1: low. A form with no action passed the guard (fixed)
- **Problem:** the guard checked a form's `action` value but didn't require one. A regression that rendered the form without its export attributes would ship a form that sends guest details by GET to the page's own host.
- **Outcome:** fixed in the commit after `648b307`. An opening `<form>` must carry an `action` and `method="post"`, and a regression test covers a missing action, a missing method and `method="get"`.
