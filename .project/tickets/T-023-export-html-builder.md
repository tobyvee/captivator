---
title: "T-023: Export HTML builder"
type: ticket
project: captivator
status: todo
priority: P0
milestone: 7
estimate: 25
depends_on: [T-006, T-007, T-011, T-021]
touches:
  - src/lib/export.ts
  - src/lib/export.test.ts
cut_rank:
updated: 2026-10-22
tags: [project, captivator, ticket, export, security]
---
# T-023: Export HTML builder

## Context
Build step 7 ([spec → Export HTML](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md), *Images and Unsplash → Export re-encode*, *Unit tests* → export). Export is P0 and never cut. It turns the current `Design` into one standalone HTML file with no JavaScript and no network requests, which guests could load on open Wi-Fi, so it's a trust boundary. Decisions: [`general-export-form-action.md`](../decisions/general-export-form-action.md), [`general-export-inlines-all-images.md`](../decisions/general-export-inlines-all-images.md), [`general-export-background-reencode.md`](../decisions/general-export-background-reencode.md), [`general-root-min-height-in-export-style.md`](../decisions/general-root-min-height-in-export-style.md), [`general-splashpage-render-mode.md`](../decisions/general-splashpage-render-mode.md), [`general-minimum-ios-version.md`](../decisions/general-minimum-ios-version.md).

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
- [ ] Output starts with `<!doctype html>` and has the viewport meta (test).
- [ ] **Security:** output contains no `http://` or `https://` URLs except Unsplash credit links (every match starts with `https://unsplash.com/`), and every `<img src` is a `data:image/` URL (test).
- [ ] Required fields and the terms checkbox carry `required` (test).
- [ ] The terms sheet has `id="terms"`, and the style block has a `:target` rule (test).
- [ ] **Security:** with fields, the form posts to `[PORTAL_SUBMIT_URL]` with no `command` input; with no fields, it posts to `[ROUTER_FORM_ACTION]` with `command=login` (tests).
- [ ] **Security:** the design name is HTML-escaped in `<title>` (a name of `</title><script>x</script>` appears escaped), and the output has no `<script>` and no inline `on…=` handler attributes (tests).
- [ ] A design using a `/templates/...` photo exports it as a data URL (`inline` was called with it; test).
- [ ] The `<style>` block contains `.cv-root{min-height:100vh;min-height:100dvh}`, and there's exactly one `<style>` (test).
- [ ] With a photo background, `reencode` receives `PAGE_BUDGET` minus the page size without the background; when the fake can't fit, `overBudget` is true (test).
- [ ] `exportFileName` gives a safe name: `"Café / WiFi!"` → `"cafe-wifi.html"`; an empty name → `"wifi-login.html"` (test).
- [ ] `npm test` and `npx tsc --noEmit` pass.

## Dependencies
- T-006: the background markup (photo `<img>`, overlay, credit) to inline and re-encode.
- T-007: export-mode form markup (`method`, `action` placeholders, `required`, `<a href="#terms">`).
- T-011: `inlineFromUrl`, `encodeAt`, `reencodeToFit` (the default deps).
- T-021: the export-mode `<section id="terms" class="cv-terms">`.

## Notes
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
  ```
  The focus rule is review finding 21; the outline-plus-shadow ring shows on any background.
- **`exportFileName`:**
  1. NFKD-normalise and strip diacritics.
  2. Lowercase.
  3. Replace runs of characters outside `a-z0-9` with `-`, then trim the `-`s.
  4. Cap at 60 characters.
  5. Fall back to `wifi-login`, then add `.html`.
- `renderToStaticMarkup` works in the browser bundle and in Vitest's node environment.

## Decisions
- [`general-export-background-reencode.md`](../decisions/general-export-background-reencode.md): The export re-encodes the background to fit the 100 KB budget
- [`general-export-form-action.md`](../decisions/general-export-form-action.md): An export with guest fields posts to a portal-service placeholder, not the router
- [`general-export-inlines-all-images.md`](../decisions/general-export-inlines-all-images.md): Export inlines every image that isn't already a data URL
- [`general-minimum-ios-version.md`](../decisions/general-minimum-ios-version.md): The guest page targets iOS 15.4 and newer
- [`general-root-min-height-in-export-style.md`](../decisions/general-root-min-height-in-export-style.md): The root min-height pair lives in the export style block
- [`general-splashpage-render-mode.md`](../decisions/general-splashpage-render-mode.md): SplashPage takes a render mode of edit, preview or export
