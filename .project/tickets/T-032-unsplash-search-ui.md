---
title: "T-032: Unsplash search in the Photo tab"
type: ticket
project: captivator
status: done
priority: P2
milestone: 8
estimate: 15
depends_on: [T-016, T-031]
touches:
  - src/editor/panels/UnsplashSearch.tsx
  - src/app/api/unsplash/route.ts
  - src/app/api/unsplash/route.test.ts
  - src/editor/panels/UnsplashSearch.test.tsx
cut_rank: 1
updated: 2026-10-23
tags: [project, captivator, ticket, editor, security]
---
# T-032: Unsplash search in the Photo tab

## Context
Stretch, cut order item 1 ([spec → Images and Unsplash → Unsplash → Client](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md)). This replaces the `UnsplashSearch` stub from T-016. Photographer names and links come from a third-party API, so they're rendered as text and the store's schema guard checks every URL. Canvas artboard: `DesktopPreview` ("Find a photo", results grid, "Photo by … on Unsplash"). Decisions: [`general-url-allowlist.md`](../decisions/general-url-allowlist.md), [`T-004-store-rejects-invalid-designs.md`](../decisions/T-004-store-rejects-invalid-designs.md).

## Scope
- `UnsplashSearch()`:
  - A labelled search input ("Find a photo"), debounced 400ms.
  - A module-level `Map` cache per query; fetch `/api/unsplash?q=`.
  - Results in a 2-column grid of `<button>`s showing `urls.small`, with `alt` "Photo by {name}".
- **Pick:**
  - Set the background to a photo with `src = urls.regular + "&w=1600&q=70"` and `credit = { name, profileUrl: user.links.html + "?utm_source=captivator&utm_medium=referral", downloadLocation: links.download_location }`.
  - Keep fit, zoom, focus, backdrop and overlay if the background is already a photo; otherwise use T-016's defaults.
  - Then `POST /api/unsplash { downloadLocation }` (fire and forget).
- **States:** loading; empty ("No photos found"); error or 503 ("Photo search isn't available right now. Upload your own instead.").
- **Out of scope:** the API route (T-031); rendering the credit on the page (T-006 already does).

## Acceptance criteria
- [x] Typing searches after a 400ms pause; repeat queries use the cache.
- [x] Picking a result updates the preview and shows the credit line in the panel and on the page.
- [x] **Security:** a result whose URLs fail the schema allowlist doesn't change the design (the store returns `false`); photographer names render as text.
- [x] Without the env var the panel shows the fallback message and upload still works.
- [x] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-016: the stub, and the photo branch it sits in.
- T-031: the route and its response shape.

## Outcome
- **Built:** `UnsplashSearch` in the Photo tab, as the `DesktopPreview` artboard draws it: a "Find a photo" search and a two-column grid of results. It searches after a 400ms pause, keyed on the query normalised as the route does, and caches successful results per query. Picking a photo sets the background through `withPhoto` and the store, then pings the download location; a photo the schema refuses changes nothing and sends no ping. The chosen tile is `aria-current`, the result count is announced, and a missing key, a failure or an unreadable reply shows "Photo search isn't available right now. Upload your own instead."; a 429 shows the route's own message. 867 tests pass; `tsc`, lint and `vite build` are clean.
- **Route:** the wave 8 audit's low is fixed here. Both handlers return 403 on `Sec-Fetch-Site: cross-site`, and the ping returns 415 unless its body is `application/json`, after the rate limiter and before any parsing ([`T-032-cross-site-checks-after-limiter.md`](../decisions/T-032-cross-site-checks-after-limiter.md)).
- **Review:** changes required. Two tests didn't test what they claimed: the "no content type" ping really sent `text/plain`, and the stale-reply test passed without its guard. It also found results arrived silently for screen readers, `aria-pressed` on single-choice tiles, and three nits. nextjs-specialist fixed all seven in `331323e`–`841425a` with mutation-checked tests ([`T-032-search-results-current-and-announced.md`](../decisions/T-032-search-results-current-and-announced.md)). The re-review approved.
- **Security:** audited clean: the wave 8 low is fixed, the content-type check held against every bypass tried, and the panel can't put a disallowed URL or markup into the design or the export.

## Notes
- **Re-review nit left as it is:** "No photos found" doesn't name the query, so replacing one cached empty query with another directly isn't announced. Naming the query would change the visible copy.
- **Not exercised live:** search and the download ping were tested against mocks only, to save the demo quota; T-029 checks them for real.
- **Canvas difference kept:** the canvas shows the credit line above "Upload your own"; `BackgroundPanel.tsx` puts it below, as before.
- **From the wave 8 audit:** the route must refuse cross-site requests: POST returns 415 unless `Content-Type` is `application/json` (this client sends it), and both handlers return 403 on `Sec-Fetch-Site: cross-site`, before parsing, with regression tests ([`general-wave-8-cross-site-check-in-t032.md`](../decisions/general-wave-8-cross-site-check-in-t032.md)). Also from T-031: show the 429 body's message, and treat 503 and 502 alike.
- **From T-016:** build the background with `withPhoto(useStore.getState().design.background, src, credit)` from `BackgroundPanel.tsx`; it holds the new-photo defaults ([`T-016-with-photo-helper.md`](../decisions/T-016-with-photo-helper.md)). `UnsplashSearch` takes no props and reads the store itself.
- **From the T-016 security audit:** `updateBackground` returns `false` when the schema rejects the background (for example a credit URL off `unsplash.com`). Check it and show an error; don't loosen the credit schema.

## Decisions
- [`T-004-store-rejects-invalid-designs.md`](../decisions/T-004-store-rejects-invalid-designs.md): Store actions drop any update that would make the design fail the schema
- [`T-016-photo-upload-split-from-adjustments.md`](../decisions/T-016-photo-upload-split-from-adjustments.md): Photo upload is P0 in the Background panel; fit, zoom, focus and darken are a separate P1 ticket
- [`general-stretch-tickets-scheduled.md`](../decisions/general-stretch-tickets-scheduled.md): Stretch tickets are scheduled, not held until the build is ahead
- [`general-url-allowlist.md`](../decisions/general-url-allowlist.md): Image and credit URLs are allowlisted by scheme and host
- [`T-016-with-photo-helper.md`](../decisions/T-016-with-photo-helper.md): new photos go through `withPhoto`
- [`T-032-cross-site-checks-after-limiter.md`](../decisions/T-032-cross-site-checks-after-limiter.md): 403 cross-site and 415 non-JSON, after the limiter
- [`T-032-photo-params-set-not-appended.md`](../decisions/T-032-photo-params-set-not-appended.md): photo URL parameters are set on the parsed URL, not appended
- [`T-032-search-debounce-and-cache.md`](../decisions/T-032-search-debounce-and-cache.md): debounce, cache key and messages (superseded)
- [`T-032-search-results-current-and-announced.md`](../decisions/T-032-search-results-current-and-announced.md): `aria-current`, the announced count, retry on return and the reply check
- [`T-032-panel-test-file-added.md`](../decisions/T-032-panel-test-file-added.md): adds `UnsplashSearch.test.tsx`
- [`general-wave-8-cross-site-check-in-t032.md`](../decisions/general-wave-8-cross-site-check-in-t032.md): the wave 8 low lands with this ticket
