---
title: "T-032: Unsplash search in the Photo tab"
type: ticket
project: captivator
status: todo
priority: P2
milestone: 8
estimate: 15
depends_on: [T-016, T-031]
touches:
  - src/editor/panels/UnsplashSearch.tsx
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
- [ ] Typing searches after a 400ms pause; repeat queries use the cache.
- [ ] Picking a result updates the preview and shows the credit line in the panel and on the page.
- [ ] **Security:** a result whose URLs fail the schema allowlist doesn't change the design (the store returns `false`); photographer names render as text.
- [ ] Without the env var the panel shows the fallback message and upload still works.
- [ ] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-016: the stub, and the photo branch it sits in.
- T-031: the route and its response shape.

## Notes
- **From T-016:** build the background with `withPhoto(useStore.getState().design.background, src, credit)` from `BackgroundPanel.tsx`; it holds the new-photo defaults ([`T-016-with-photo-helper.md`](../decisions/T-016-with-photo-helper.md)). `UnsplashSearch` takes no props and reads the store itself.
- **From the T-016 security audit:** `updateBackground` returns `false` when the schema rejects the background (for example a credit URL off `unsplash.com`). Check it and show an error; don't loosen the credit schema.

## Decisions
- [`T-004-store-rejects-invalid-designs.md`](../decisions/T-004-store-rejects-invalid-designs.md): Store actions drop any update that would make the design fail the schema
- [`T-016-photo-upload-split-from-adjustments.md`](../decisions/T-016-photo-upload-split-from-adjustments.md): Photo upload is P0 in the Background panel; fit, zoom, focus and darken are a separate P1 ticket
- [`general-stretch-tickets-scheduled.md`](../decisions/general-stretch-tickets-scheduled.md): Stretch tickets are scheduled, not held until the build is ahead
- [`general-url-allowlist.md`](../decisions/general-url-allowlist.md): Image and credit URLs are allowlisted by scheme and host
- [`T-016-with-photo-helper.md`](../decisions/T-016-with-photo-helper.md): new photos go through `withPhoto`
