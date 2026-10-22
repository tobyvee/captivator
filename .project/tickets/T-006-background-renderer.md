---
title: "T-006: Background renderer: colour, gradient and photo"
type: ticket
project: captivator
status: todo
priority: P0
milestone: 2
estimate: 10
depends_on: [T-005]
touches:
  - src/splash/Background.tsx
  - src/splash/Background.test.tsx
cut_rank:
updated: 2026-10-22
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
- [ ] Colour renders a solid fill.
- [ ] Gradient renders `linear-gradient(180deg | 135deg | 90deg, from, to)` for `down | diagonal | right` (test each).
- [ ] Photo, `fill`: `<img>` with `object-fit: cover`, `object-position: x% y%`, `transform: scale(zoom)`, `transform-origin: x% y%`, over the `backdrop` colour (test).
- [ ] Photo, `fit`: `object-fit: contain` and no scale; the backdrop shows around the photo (test).
- [ ] Overlay renders as a layer with `linear-gradient(180deg, from, to)` at `opacity` (decision), and is omitted when `overlay` is null (test).
- [ ] The photo `<img>` has `alt=""` and `aria-hidden="true"`.
- [ ] **Security:** the credit renders "Photo: {name} / Unsplash" with links only to the schema-validated `profileUrl` (with `utm_source=captivator&utm_medium=referral` appended if missing) and `https://unsplash.com/?utm_source=captivator&utm_medium=referral`, with `rel="noopener noreferrer"` and `target="_blank"`; the name is rendered as text (test).
- [ ] Inline styles only; no imports from `next/*`, `src/editor/` or the store.
- [ ] `npm test` and `npx tsc --noEmit` pass.

## Dependencies
- T-005: the `Background` stub and its props, and the SplashPage root it renders into.

## Notes
- **Layers:** a container with `position: absolute; inset: 0; overflow: hidden; z-index: 0; pointer-events: none` (clicks fall through to the root, which selects the background in edit mode). Photo: container background = `backdrop`; the `<img>` has `position: absolute; inset: 0; width: 100%; height: 100%`. Zoom applies only when `fit === "fill"`.
- **Overlay:** `position: absolute; inset: 0; background: linear-gradient(180deg, {from}, {to}); opacity: {opacity}`. The schema has no overlay direction, so the fade is always top to bottom (decision).
- **Credit:** a small line (11px, `#FFFFFF` with a subtle `text-shadow`) at the bottom-right corner (`position: absolute; right: 10px; bottom: 8px; z-index: 2; pointer-events: auto`). It must sit above the content column and stay clickable, so render it as a sibling of the layer container, not inside it (return a fragment). Bundled template photos have no `credit`, so no line shows for them.

## Decisions
- [`T-002-template-photos-and-credits.md`](../decisions/T-002-template-photos-and-credits.md): Template photos come from the canvas assets, and their credits live beside the templates, not in background.credit
- [`T-005-splashpage-skeleton-creates-stubs.md`](../decisions/T-005-splashpage-skeleton-creates-stubs.md): The SplashPage skeleton owns composition and creates every child component as a stub
- [`T-006-overlay-two-stop-wash.md`](../decisions/T-006-overlay-two-stop-wash.md): The photo overlay renders as a top-to-bottom gradient of its two colours; fade direction is deferred
- [`T-006-photo-background-rendered-in-step-2.md`](../decisions/T-006-photo-background-rendered-in-step-2.md): Photo backgrounds render from build step 2, not step 4
