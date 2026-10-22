---
title: "T-023: Export HTML builder"
type: ticket
project: captivator
status: done
priority: P0
milestone: 7
estimate: 25
depends_on: [T-006, T-007, T-011, T-021]
touches:
  - src/lib/export.ts
  - src/lib/export.test.ts
cut_rank:
updated: 2026-10-23
tags: [project, captivator, ticket, export, security]
---
# T-023: Export HTML builder

## Context
Build step 7 ([spec → Export HTML](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md), *Images and Unsplash → Export re-encode*, *Unit tests* → export). Export is P0 and never cut. It turns the current `Design` into one standalone HTML file with no JavaScript and no network requests, which guests could load on open Wi-Fi, so it's a trust boundary. Decisions: [`general-export-form-action.md`](../decisions/general-export-form-action.md), [`general-export-inlines-all-images.md`](../decisions/general-export-inlines-all-images.md), [`general-export-background-reencode.md`](../decisions/general-export-background-reencode.md), [`general-splash-root-grows-in-frame.md`](../decisions/general-splash-root-grows-in-frame.md), [`general-splashpage-render-mode.md`](../decisions/general-splashpage-render-mode.md), [`general-minimum-ios-version.md`](../decisions/general-minimum-ios-version.md).

## Scope
`src/lib/export.ts` (API in Notes):
1. **Inline images:** replace every image `src` that isn't a data URL (blocks with `kind: "image"`, the background with `"background"`) with `deps.inline(src, kind)`. That covers `/templates/*` photos and Unsplash.
2. **Render:** `const { renderToStaticMarkup } = await import("react-dom/server")` (dynamic, so the editor bundle doesn't carry it; review finding 22), then `<SplashPage design={d} screen="landing" mode="export" />`.
3. **Re-encode the background:** if it's a photo, render once with its `src` swapped for a 1×1 PNG data URL and measure the page; `allowance = PAGE_BUDGET − that size`; `deps.reencode(src, allowance)`; render again with the result.
4. **Comment:** insert a fixed HTML comment immediately before the first `<form`. With fields, explain the two hops (guest details go to our portal service first, which records them and then posts a second form, with no personal data, to the router's `form_action`). Without fields, point to the Peplink `form_action` integration. The comment never includes design data.
5. **Wrap:** `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{escapeHtml(name || "WiFi login")}</title><style>{EXPORT_CSS}</style></head><body>{markup}</body></html>`.
6. Return `{ html, bytes, overBudget: bytes > PAGE_BUDGET, reencoded }`.

Also `downloadHtml(html, name)`: a `Blob` (`text/html`), `URL.createObjectURL`, a temporary `<a download={exportFileName(name)}>`, click, then revoke.

`src/lib/export.test.ts` (node environment; inject fake `inline`/`reencode`, so no canvas or network).

**Out of scope:** the button and toast (T-024); the image encoders themselves (T-011); form placeholders and `required` (emitted by `Form.tsx` in export mode, T-007); the terms section markup (T-021).

## Acceptance criteria
- [x] Output starts with `<!doctype html>` and has the viewport meta (test).
- [x] **Security:** output contains no `http://` or `https://` URLs at all (the photo credit is plain text in export, [`T-006-export-credit-plain-text.md`](../decisions/T-006-export-credit-plain-text.md)), and every `<img src` is a `data:image/` URL (test).
- [x] **Security:** when `inline` rejects (CORS refused, not an image, over 10 MB), the export never falls back to the original `src`. It drops that image or fails with a clear message, and the output still has no `http(s)://` image URL (test with a rejecting `inline` dep; T-011 security audit). Consider bounding each fetch with `AbortSignal.timeout`, so one slow host can't hang the export (`.project/review/2026-10-22-security-T-011-review.md`).
- [x] **Security:** the output contains no `<link` element. React 19's static renderer emits `<link rel="preload" as="image">` for any `<img>` whose `src` isn't a data URL, so inline every image into the design **before** rendering, never after (test; T-006 review and audits).
- [x] Required fields and the terms checkbox carry `required` (test).
- [x] The terms sheet has `id="terms"`, and the style block has a `:target` rule (test).
- [x] **Security:** with fields, the form posts to `[PORTAL_SUBMIT_URL]` with no `command` input; with no fields, it posts to `[ROUTER_FORM_ACTION]` with `command=login` (tests).
- [x] **Security:** the design name is HTML-escaped in `<title>` (a name of `</title><script>x</script>` appears escaped), and the output has no `<script>` and no inline `on…=` handler attributes (tests).
- [x] A design using a `/templates/...` photo exports it as a data URL (`inline` was called with it; test).
- [x] The `<style>` block contains `.cv-root{min-height:100vh;min-height:100dvh}`, and there's exactly one `<style>` (test).
- [x] With a photo background, `reencode` receives `PAGE_BUDGET` minus the page size without the background; when the fake can't fit, `overBudget` is true (test).
- [x] `exportFileName` gives a safe name: `"Café / WiFi!"` → `"cafe-wifi.html"`; an empty name → `"wifi-login.html"` (test).
- [x] `npm test` and `npx tsc --noEmit` pass.

## Dependencies
- T-006: the background markup (photo `<img>`, overlay, credit) to inline and re-encode.
- T-007: export-mode form markup (`method`, `action` placeholders, `required`, `<a href="#terms">`).
- T-011: `inlineFromUrl`, `encodeAt`, `reencodeToFit` (the default deps).
- T-021: the export-mode `<section id="terms" class="cv-terms">`.

## Notes
- **From the wave 3 audit:** the design `name` (any string up to 60 characters) is HTML-escaped in `<title>`, and if the download filename uses it, it is reduced to safe filename characters with a fallback such as `splash.html`.
```ts
export const PAGE_BUDGET = 100 * 1024;
export type ExportDeps = {
  inline(src: string, kind: ImageKind): Promise<string>;
  reencode(src: string, allowance: number): Promise<{ dataUrl: string; fits: boolean }>;
};
export async function buildExportHtml(design: Design, name: string, deps?: Partial<ExportDeps>):
  Promise<{ html: string; bytes: number; overBudget: boolean; reencoded: boolean }>;
export function escapeHtml(s: string): string;   // & < > " '
export function exportFileName(name: string): string;
export function downloadHtml(html: string, name: string): void;
```

- Default deps: `inline = inlineFromUrl`; `reencode = (src, allowance) => reencodeToFit((edge, q) => encodeAt(src, edge, q), allowance)`.
- `bytes` = `new TextEncoder().encode(html).length`.
- `EXPORT_CSS` (the file's only `<style>`):
  ```css
  body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  .cv-root{min-height:100vh;min-height:100dvh}
  .cv-terms{display:none}.cv-terms:target{display:block}
  .cv-root :focus-visible{outline:3px solid #FFFFFF;box-shadow:0 0 0 5px #111111}
  .cv-root ::placeholder{color:inherit;opacity:.65}
  ```
  The placeholder rule makes the visible field labels readable on iOS ([`general-export-placeholder-colour.md`](../decisions/general-export-placeholder-colour.md)). The focus rule is review finding 21; the outline-plus-shadow ring shows on any background.
- **`exportFileName`:**
  1. NFKD-normalise and strip diacritics.
  2. Lowercase.
  3. Replace runs of characters outside `a-z0-9` with `-`, then trim the `-`s.
  4. Cap at 60 characters.
  5. Fall back to `wifi-login`, then add `.html`.
- `renderToStaticMarkup` works in the browser bundle and in Vitest's node environment.

## Outcome
- **Built:** `buildExportHtml` inlines every image before rendering and fails closed, re-encodes the background only when the page would go over budget (keeping the smaller copy), and wraps the markup in a doctype shell with one `<style>`, a viewport meta and `format-detection: telephone=no`. A final guard checks the body markup before it's wrapped, against an allowlist of the elements, attributes and values SplashPage emits ([`T-023-export-guard-allowlist.md`](../decisions/T-023-export-guard-allowlist.md)). Also `exportFileName` and `downloadHtml`, which revokes the blob URL after 30 seconds. 52 export tests; 417 tests pass, and `tsc` and lint are clean.
- **Review:** approved with should-fixes: the guard gaps, an immediate blob revoke that Safari can fail on, and a missing never-settles re-encode test. All are fixed in `be9482f`, along with the nits: byte counting, no cache, one source for the form action, and re-encoding only when needed ([`T-023-reencode-only-when-needed.md`](../decisions/T-023-reencode-only-when-needed.md)).
- **Splash audit:** passed. Real exports measured with a sharp-based stand-in for the browser encoder: Sponsor 22.4 KB (WebP) or 48.5 KB (Safari JPEG), Blank 1.8 KB, and Sponsor with two uploads and a credit 49.7 KB or 98.1 KB. No external requests, and the no-JS terms, validation and submit flows work in headless Chrome at 320px and 375px. Contrast passes on Sponsor.
- **Security:** one medium (guard gaps for CSS `url()`, `xlink:href`, meta refresh, `<style>` and `ping`) and one low (placeholder not tied to the fields). Both were fixed in `8481ab9` and `9c72b23`. The re-audit then found two more bypasses of the blocklist: SVG paint `url()` and animation (medium), and non-double-quoted attributes (low). So the guard became an allowlist with a strict tokenizer, in `48d73ae` and `648b307`. A final re-audit confirmed it and found one low (a form with no action passed), fixed in the following commit ([review](../review/2026-10-23-security-T-023-review.md)).

## Notes
- **Until T-022 lands:** the export's terms link has no `id="cv-terms-link"`, so closing the sheet keeps the scroll position but drops keyboard and screen-reader focus to `<body>` ([`T-021-close-to-terms-link.md`](../decisions/T-021-close-to-terms-link.md)).
- **Budget risk:** uploads are never re-encoded at export. On Safari (JPEG), two 600px uploads take about two-thirds of the 100 KB budget, and Sponsor with two uploads measured 98.1 KB. Over budget warns and doesn't block.
- **Accepted:** a timed-out image fetch isn't aborted, because `images.ts` takes no `AbortSignal` ([`T-023-image-timeout-by-race.md`](../decisions/T-023-image-timeout-by-race.md)). An identical remote URL used twice is fetched twice.
- **Cosmetic, not fixed:** `<html>` and `<body>` have no background, so iOS overscroll flashes white around dark designs. Setting one would put design colours into the wrapper, outside the body guard.
- **Not tested:** real iOS 15.4 WebKit, the login sheet itself and Android's CaptivePortalLogin. T-029's phone checklist covers them.

## Decisions
- [`general-export-placeholder-colour.md`](../decisions/general-export-placeholder-colour.md): The export's style block sets the placeholder colour, since placeholders are the visible field labels
- [`general-export-background-reencode.md`](../decisions/general-export-background-reencode.md): The export re-encodes the background to fit the 100 KB budget
- [`general-export-form-action.md`](../decisions/general-export-form-action.md): An export with guest fields posts to a portal-service placeholder, not the router
- [`general-export-inlines-all-images.md`](../decisions/general-export-inlines-all-images.md): Export inlines every image that isn't already a data URL
- [`general-minimum-ios-version.md`](../decisions/general-minimum-ios-version.md): The guest page targets iOS 15.4 and newer
- [`general-splash-root-grows-in-frame.md`](../decisions/general-splash-root-grows-in-frame.md): In the editor frames the splash root grows with its content, and the frame scrolls (supersedes `general-root-min-height-in-export-style.md`)
- [`general-splashpage-render-mode.md`](../decisions/general-splashpage-render-mode.md): SplashPage takes a render mode of edit, preview or export
- [`T-023-export-fails-closed-on-image.md`](../decisions/T-023-export-fails-closed-on-image.md): an image that can't be inlined fails the export
- [`T-023-image-timeout-by-race.md`](../decisions/T-023-image-timeout-by-race.md): each image step has a 20-second limit, raced in `export.ts`
- [`T-023-final-attribute-guard.md`](../decisions/T-023-final-attribute-guard.md): the final guard on tags and URL attributes (superseded)
- [`T-023-guard-covers-css-and-form-action.md`](../decisions/T-023-guard-covers-css-and-form-action.md): the blocklist guard widened to CSS loads, SVG links and the fields-matched form action (superseded)
- [`T-023-export-guard-allowlist.md`](../decisions/T-023-export-guard-allowlist.md): the guard is an allowlist of the elements, attributes and values SplashPage emits
- [`T-023-reencode-input-and-allowance.md`](../decisions/T-023-reencode-input-and-allowance.md): the re-encode takes the inlined copy, and how the allowance is worked out
- [`T-023-reencode-only-when-needed.md`](../decisions/T-023-reencode-only-when-needed.md): re-encode only when over the allowance, and ship the smaller copy
