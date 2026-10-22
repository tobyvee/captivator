---
title: "T-006: Background renderer: colour, gradient and photo"
type: ticket
project: captivator
status: done
priority: P0
milestone: 2
estimate: 10
depends_on: [T-005]
touches:
  - src/splash/Background.tsx
  - src/splash/Background.test.tsx
  - src/splash/SplashPage.tsx
  - src/splash/SplashPage.test.tsx
cut_rank:
updated: 2026-10-23
tags: [project, captivator, ticket, splash, security]
---
# T-006: Background renderer: colour, gradient and photo

## Context
Build step 2 ([spec → Splash renderer → Background](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md)). This replaces the stub from T-005. It renders all three background types now, including photos, because the Sponsor template already uses one; step 4 only adds the editor panel. Canvas artboards: `StateLanding` (gradient) and `DesktopPreview` (photo with credit line). Decisions: [`T-006-photo-background-rendered-in-step-2.md`](../decisions/T-006-photo-background-rendered-in-step-2.md), [`T-006-overlay-two-stop-wash.md`](../decisions/T-006-overlay-two-stop-wash.md), [`T-002-template-photos-and-credits.md`](../decisions/T-002-template-photos-and-credits.md).

## Scope
- `Background({ background, mode })` returns the absolutely positioned background layers that sit inside the SplashPage root (Notes), plus the Unsplash credit line when `credit` is set.
- `Background.test.tsx` (node environment, using `renderToStaticMarkup` from `react-dom/server`; no jsdom).
- **Out of scope:** the Background panel (T-016, T-017); re-encoding for export (T-023).

## Acceptance criteria
- [x] Colour renders a solid fill.
- [x] Gradient renders `linear-gradient(180deg | 135deg | 90deg, from, to)` for `down | diagonal | right` (test each).
- [x] Photo, `fill`: `<img>` with `object-fit: cover`, `object-position: x% y%`, `transform: scale(zoom)`, `transform-origin: x% y%`, over the `backdrop` colour (test).
- [x] Photo, `fit`: `object-fit: contain` and no scale; the backdrop shows around the photo (test).
- [x] Overlay renders as a layer with `linear-gradient(180deg, from, to)` at `opacity` (decision), and is omitted when `overlay` is null (test).
- [x] The photo `<img>` has `alt=""` and `aria-hidden="true"`.
- [x] **Security:** the credit renders "Photo: {name} / Unsplash" with links only to the schema-validated `profileUrl` (with `utm_source=captivator&utm_medium=referral` appended if missing) and `https://unsplash.com/?utm_source=captivator&utm_medium=referral`, with `rel="noopener noreferrer"` and `target="_blank"`; the name is rendered as text (test). *Links in `edit` and `preview` only; the export credit is plain text ([`T-006-export-credit-plain-text.md`](../decisions/T-006-export-credit-plain-text.md)).*
- [x] Inline styles only; no imports from `next/*`, `src/editor/` or the store.
- [x] `npm test` and `npx tsc --noEmit` pass.

## Dependencies
- T-005: the `Background` stub and its props, and the SplashPage root it renders into.

## Notes
- **Layers:** a container with `position: absolute; inset: 0; overflow: hidden; z-index: 0; pointer-events: none` (clicks fall through to the root, which selects the background in edit mode). Photo: container background = `backdrop`; the `<img>` has `position: absolute; inset: 0; width: 100%; height: 100%`. Zoom applies only when `fit === "fill"`.
- **Overlay:** `position: absolute; inset: 0; background: linear-gradient(180deg, {from}, {to}); opacity: {opacity}`. The schema has no overlay direction, so the fade is always top to bottom (decision).
- **Credit (as built):** `Background` exports `Credit`, and SplashPage renders it after the column, not Background beside the layers ([`T-006-credit-rendered-by-splashpage.md`](../decisions/T-006-credit-rendered-by-splashpage.md)). It sits on a dark backing on one line instead of using a text-shadow ([`T-006-credit-dark-backing-one-line.md`](../decisions/T-006-credit-dark-backing-one-line.md)). The original note follows.
- **Credit:** a small line (11px, `#FFFFFF` with a subtle `text-shadow`) at the bottom-right corner (`position: absolute; right: 10px; bottom: 8px; z-index: 2; pointer-events: auto`). It must sit above the content column and stay clickable, so render it as a sibling of the layer container, not inside it (return a fragment). Bundled template photos have no `credit`, so no line shows for them.

## Outcome
- **Built:** `Background` (colour, gradient, photo fill/fit with zoom and focus, overlay) and `Credit`, plus SplashPage composition of the credit and a root `isolation: isolate`. 272 tests pass; `tsc` and lint are clean.
- **Review:** the first pass was "changes required" (a vacuous click-through test). It was fixed in `1d6d1a1`, and the re-review approved. Its should-fixes (root stacking context, a SplashPage test that `mode` reaches the credit, the spec and T-023 export URL rule) were fixed in the record commit.
- **Splash audit:** the first pass failed (credit links with `target=_blank` on the guest page; credit before the content in reading order), with should-fixes for contrast and long names. All were fixed in `1d6d1a1`. The re-audit passed, and its nit (a long name hiding "/ Unsplash") was fixed in the record commit.
- **Security:** one low finding (a long name covering Connect), fixed in `1d6d1a1` ([review](../review/2026-10-23-security-T-006-review.md)).

## Decisions
- [`T-002-template-photos-and-credits.md`](../decisions/T-002-template-photos-and-credits.md): Template photos come from the canvas assets, and their credits live beside the templates, not in background.credit
- [`T-005-splashpage-skeleton-creates-stubs.md`](../decisions/T-005-splashpage-skeleton-creates-stubs.md): The SplashPage skeleton owns composition and creates every child component as a stub
- [`T-006-overlay-two-stop-wash.md`](../decisions/T-006-overlay-two-stop-wash.md): The photo overlay renders as a top-to-bottom gradient of its two colours; fade direction is deferred
- [`T-006-photo-background-rendered-in-step-2.md`](../decisions/T-006-photo-background-rendered-in-step-2.md): Photo backgrounds render from build step 2, not step 4
- [`T-006-credit-links-inline-size.md`](../decisions/T-006-credit-links-inline-size.md): the credit links keep the 11px inline size
- [`T-006-credit-profile-origin-recheck.md`](../decisions/T-006-credit-profile-origin-recheck.md): the renderer re-checks the profile URL's origin before linking
- [`T-006-export-credit-plain-text.md`](../decisions/T-006-export-credit-plain-text.md): the exported guest page shows the photo credit as plain text, without links
- [`T-006-credit-rendered-by-splashpage.md`](../decisions/T-006-credit-rendered-by-splashpage.md): SplashPage, not Background, renders the photo credit, after the content column
- [`T-006-credit-dark-backing-one-line.md`](../decisions/T-006-credit-dark-backing-one-line.md): the credit sits on a dark backing, on one line, with the name ellipsized on its own
