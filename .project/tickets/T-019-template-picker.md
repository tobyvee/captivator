---
title: "T-019: Template picker with live thumbnails and Continue your design"
type: ticket
project: captivator
status: done
priority: P1
milestone: 5
estimate: 15
depends_on: [T-004, T-006, T-007, T-018]
touches:
  - src/app/page.tsx
  - src/editor/TemplateCard.tsx
  - src/editor/TemplateCard.test.tsx
cut_rank:
updated: 2026-10-23
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
- [x] Four cards (Sponsor, Photo hero, Minimal, Blank) render live thumbnails that match the editor preview.
- [x] "Use" loads the template and opens `/editor`; each template loads (spec checklist).
- [x] With a saved design, "Continue your design" shows first, and "Use" asks before switching. Switching keeps an uploaded logo (spec checklist). *Met after a reload, and since T-025 (`593d0fb`) for a design edited in this session too; both tested ([`T-025-saved-means-written-this-session.md`](../decisions/T-025-saved-means-written-this-session.md)).*
- [x] With no saved design, there's no Continue card and no confirm.
- [x] No hydration warning; the page renders a neutral placeholder until `useHydrated()` is true.
- [x] Buttons are real `<button>`s with at least 44px tap targets; credit links have `rel="noopener noreferrer"`.
- [x] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-004: `useStore`, `useHydrated`, `restored` and `loadTemplate`.
- T-006, T-007: the background and form must render for the thumbnails to match the artboard (T-005 comes through them).
- T-018: all four templates and their credits.

## Outcome
- **Built:** the picker at `/`: header, h1 and intro on the server, then a grid of `TemplateCard`s once the store has hydrated (a neutral placeholder before, with no mismatch). Each card shows the real `SplashPage` scaled into a 170×320 mini-frame (`aria-hidden`, `inert`), the name, description, the Unsplash credit through `profileHref`, and a 44px Use button. A restored design comes first as "Continue your design", and Use asks before switching. Blank gets the canvas's dashed card and outline "Start blank" button. 594 tests pass; `tsc` and lint are clean.
- **Review:** approved with two should-fixes. The local `use` handler is now `switchTo`, so it no longer reads as React's `use`. Blank's styling matches the `Templates` artboard, and the page now chooses it through a `variant` prop rather than the card checking the id ([`T-019-card-variant-set-by-page.md`](../decisions/T-019-card-variant-set-by-page.md)). The thumbnail's unneeded flex wrapper is gone (`59803c8`).
- **Milestone 5:** closed by the milestone review, with the in-session Continue gap moved to T-025 ([`T-025-store-marks-in-session-saves.md`](../decisions/T-025-store-marks-in-session-saves.md)).
- **Security:** not a trust-boundary ticket. The wave 7 audit found nothing, and noted that a failed restore could be replaced from the picker unseen; the picker now shows the notice (`16dfb3d`, [`T-019-picker-warns-of-failed-restore.md`](../decisions/T-019-picker-warns-of-failed-restore.md)).

## Notes
- **Review nit left as it is:** `TemplateCard`'s `credit` type repeats the inline type on `TEMPLATE_CREDITS` in `src/lib/templates.ts`; export a `TemplateCredit` type when that file is next touched.

## Decisions
- [`T-002-template-photos-and-credits.md`](../decisions/T-002-template-photos-and-credits.md): Template photos come from the canvas assets, and their credits live beside the templates, not in background.credit
- [`T-004-template-switch-carry-rule.md`](../decisions/T-004-template-switch-carry-rule.md): Switching template carries text and uploaded images by position, never template defaults
- [`T-008-hydration-guard-in-step-2.md`](../decisions/T-008-hydration-guard-in-step-2.md): The hydration guard ships with the editor shell in build step 2
- [`T-019-confirm-on-use-not-templates.md`](../decisions/T-019-confirm-on-use-not-templates.md): The confirm moves from the Templates button to Use on the picker
- [`general-new-modules-beyond-project-structure.md`](../decisions/general-new-modules-beyond-project-structure.md): Planning adds small modules to the spec's project structure so each ticket owns its own files
- [`T-019-placeholder-covers-grid-only.md`](../decisions/T-019-placeholder-covers-grid-only.md): only the grid waits for hydration
- [`T-019-continue-card-is-a-template-card.md`](../decisions/T-019-continue-card-is-a-template-card.md): the Continue card is a TemplateCard (superseded)
- [`T-019-card-variant-set-by-page.md`](../decisions/T-019-card-variant-set-by-page.md): the same, with the page choosing Blank's outline variant
- [`T-019-thumbnail-inert-and-credit-via-profilehref.md`](../decisions/T-019-thumbnail-inert-and-credit-via-profilehref.md): inert thumbnails; credits through `profileHref`
- [`T-019-template-card-test-file-added.md`](../decisions/T-019-template-card-test-file-added.md): adds `TemplateCard.test.tsx`
- [`T-019-saved-design-means-restored.md`](../decisions/T-019-saved-design-means-restored.md): a saved design means `restored`
- [`T-025-store-marks-in-session-saves.md`](../decisions/T-025-store-marks-in-session-saves.md): the in-session saved case moves to T-025
- [`T-025-saved-means-written-this-session.md`](../decisions/T-025-saved-means-written-this-session.md): `hasSaved` replaces `restored`; the picker reads it
- [`T-019-picker-warns-of-failed-restore.md`](../decisions/T-019-picker-warns-of-failed-restore.md): the picker shows the restore-failed notice
