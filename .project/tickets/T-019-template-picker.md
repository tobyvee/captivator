---
title: "T-019: Template picker with live thumbnails and Continue your design"
type: ticket
project: captivator
status: todo
priority: P1
milestone: 5
estimate: 15
depends_on: [T-004, T-006, T-007, T-018]
touches:
  - src/app/page.tsx
  - src/editor/TemplateCard.tsx
cut_rank:
updated: 2026-10-22
tags: [project, captivator, ticket, editor]
---
# T-019: Template picker with live thumbnails and Continue your design

## Context
Build step 5 ([spec → Editor UI → Template picker](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md)). This replaces T-001's placeholder `/` page. Thumbnails render the real `SplashPage` (preview mode), so they never drift from the output. The hydration guard itself shipped with the editor shell (T-008); this page reuses `useHydrated()`. Canvas artboard: `Templates`. Decisions: [`T-019-confirm-on-use-not-templates.md`](../decisions/T-019-confirm-on-use-not-templates.md), [`T-004-template-switch-carry-rule.md`](../decisions/T-004-template-switch-carry-rule.md), [`T-002-template-photos-and-credits.md`](../decisions/T-002-template-photos-and-credits.md).

## Scope
- **`src/app/page.tsx`** (`"use client"`):
  - Header with the Wi-Fi icon and "Captivator".
  - h1 "Start your WiFi login page" and the intro "Pick a starting point. You can change every colour, image and word afterwards, and switch templates without losing your content."
  - After hydration, if `restored`: a "Continue your design" card first (thumbnail of the saved design, its name, a "Continue" button → `router.push("/editor")`).
  - A grid (`repeat(auto-fill, minmax(230px, 1fr))`, gap 20) of `TemplateCard`s for `TEMPLATES`.
- **`src/editor/TemplateCard.tsx`:** `TemplateCard({ template, credit?, primaryLabel, onUse })`.
  - A 170×320 phone mini-frame (7px `#18181B` border, radius 28) holding `SplashPage mode="preview" screen="landing" inFrame`, laid out at 375×740 and scaled by `156 / 375`, with `aria-hidden` and `pointer-events: none`.
  - Name (h2), description, credit "Photo: {name} / Unsplash" with links, and the "Use {name}" button ("Start blank" outline style for Blank).
- **Use:**
  - If `restored`, first `window.confirm("Switch to {name}? Your text and uploaded images are kept; colours and layout change.")`.
  - Then `loadTemplate(template)` and `router.push("/editor")`.
- **Out of scope:** the template objects (T-002, T-018); the editor's Templates link (T-008).

## Acceptance criteria
- [ ] Four cards (Sponsor, Photo hero, Minimal, Blank) render live thumbnails that match the editor preview.
- [ ] "Use" loads the template and opens `/editor`; each template loads (spec checklist).
- [ ] With a saved design, "Continue your design" shows first, and "Use" asks before switching. Switching keeps an uploaded logo (spec checklist).
- [ ] With no saved design, there's no Continue card and no confirm.
- [ ] No hydration warning; the page renders a neutral placeholder until `useHydrated()` is true.
- [ ] Buttons are real `<button>`s with at least 44px tap targets; credit links have `rel="noopener noreferrer"`.
- [ ] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-004: `useStore`, `useHydrated`, `restored` and `loadTemplate`.
- T-006, T-007: the background and form must render for the thumbnails to match the artboard (T-005 comes through them).
- T-018: all four templates and their credits.

## Decisions
- [`T-002-template-photos-and-credits.md`](../decisions/T-002-template-photos-and-credits.md): Template photos come from the canvas assets, and their credits live beside the templates, not in background.credit
- [`T-004-template-switch-carry-rule.md`](../decisions/T-004-template-switch-carry-rule.md): Switching template carries text and uploaded images by position, never template defaults
- [`T-008-hydration-guard-in-step-2.md`](../decisions/T-008-hydration-guard-in-step-2.md): The hydration guard ships with the editor shell in build step 2
- [`T-019-confirm-on-use-not-templates.md`](../decisions/T-019-confirm-on-use-not-templates.md): The confirm moves from the Templates button to Use on the picker
- [`general-new-modules-beyond-project-structure.md`](../decisions/general-new-modules-beyond-project-structure.md): Planning adds small modules to the spec's project structure so each ticket owns its own files
