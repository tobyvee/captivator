---
title: "T-021: Terms sheet for the preview and the no-JS export"
type: ticket
project: captivator
status: todo
priority: P1
milestone: 6
estimate: 15
depends_on: [T-003, T-005]
touches:
  - src/splash/TermsSheet.tsx
  - src/splash/TermsSheet.test.tsx
cut_rank:
updated: 2026-10-22
tags: [project, captivator, ticket, splash, security]
---
# T-021: Terms sheet for the preview and the no-JS export

## Context
Build step 6, "Terms sheet" ([spec → Splash renderer → Guest screens → Terms](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md), *Export HTML* step 4). This replaces the `TermsSheet` stub from T-005. It renders the same sheet two ways: open (preview and edit, `screen="terms"`) and as a `:target` section in the export. The terms body is customer text shown to guests, so it must render as text only. Canvas artboard: `StateTerms` (`project/StateTerms.dc.html`). Decisions: [`general-guest-screen-fallbacks.md`](../decisions/general-guest-screen-fallbacks.md), [`general-splash-root-grows-in-frame.md`](../decisions/general-splash-root-grows-in-frame.md), [`T-007-outline-button-colours.md`](../decisions/T-007-outline-button-colours.md).

## Scope
- `TermsSheet({ design, mode, onClose })`:
  - **Sheet colour:** the background's `colour`, the gradient's `from`, or the photo's `backdrop`.
  - **Text colour:** the first heading block's colour if `contrastRatio(heading, sheet) >= 4.5`, otherwise `bestTextColour(sheet)`.
  - **Content:** a grab handle; title "Terms of use" (h2, 22px, 800); a close × button (44×44, `aria-label="Close terms"`); the body split on blank lines (`/\n\s*\n/`) into `<p>`s (`white-space: pre-line` keeps single line breaks), in a scrollable area; "Version {n}" (12px, muted); and a CLOSE button styled like Connect (66% wide, 50px, `bg`/`fg`/variant as in T-007).
- **Edit and preview modes:** a dim layer (`position: absolute; inset: 0; background: rgba(0,0,0,0.55)`) and the sheet (`position: absolute; left: 0; right: 0; bottom: 0; height: 82%; border-radius: 22px 22px 0 0; padding: 10px 24px 28px; display: flex; flex-direction: column; gap: 14px`). `role="dialog"`, `aria-modal="true"`, `aria-labelledby`. × and CLOSE are `<button type="button">` → `onClose`. The dim layer also calls `onClose` when clicked ([`T-021-dim-layer-closes-sheet.md`](../decisions/T-021-dim-layer-closes-sheet.md)); test it.
- **Export mode:** `<section id="terms" class="cv-terms" role="dialog" aria-labelledby="cv-terms-title">` with `position: fixed; inset: 0; z-index: 10` and **no inline `display`**. The export's `<style>` (T-023) hides it until `:target`. Inside, the same dim layer and sheet; × and CLOSE are `<a href="#">`.
- `TermsSheet.test.tsx` (node environment, `renderToStaticMarkup`).
- **Out of scope:** the `.cv-terms` CSS rules (T-023); opening the sheet (Form's terms link, T-007; switcher, T-009; selection, T-004).

## Acceptance criteria
- [ ] A body of `"A\n\nB"` renders two `<p>` elements (test).
- [ ] **Security:** a body containing `<script>alert(1)</script>` renders as escaped text, with no `<script>` element in the output (test).
- [ ] Export mode renders `id="terms"`, `class="cv-terms"`, close links with `href="#"`, and no inline `display` on the section (test).
- [ ] Edit and preview modes render buttons for × and CLOSE, not links (test).
- [ ] When the first heading fails 4.5:1 on the sheet colour, the title and body use `bestTextColour` (test); with no heading at all, likewise.
- [ ] Inline styles only; the only class name is `cv-terms` (export).
- [ ] `npm test` and `npx tsc --noEmit` pass.

## Dependencies
- T-003: `contrastRatio`, `bestTextColour`.
- T-005: the stub's props, and the root it's positioned in (`position: relative`).

## Decisions
- [`T-021-dim-layer-closes-sheet.md`](../decisions/T-021-dim-layer-closes-sheet.md): Clicking the terms sheet's dim layer closes the sheet in edit and preview
- [`T-005-splashpage-skeleton-creates-stubs.md`](../decisions/T-005-splashpage-skeleton-creates-stubs.md): The SplashPage skeleton owns composition and creates every child component as a stub
- [`T-007-outline-button-colours.md`](../decisions/T-007-outline-button-colours.md): An outline Connect button uses bg as its border and fg as its text
- [`general-guest-screen-fallbacks.md`](../decisions/general-guest-screen-fallbacks.md): Sponsor, Terms sheet and Error screen behaviour is defined from existing schema fields
- [`general-splash-root-grows-in-frame.md`](../decisions/general-splash-root-grows-in-frame.md): In the editor frames the splash root grows with its content, and the frame scrolls (supersedes `general-root-min-height-in-export-style.md`)
- [`general-splashpage-callback-props.md`](../decisions/general-splashpage-callback-props.md): SplashPage takes selection, onSelect and onScreenChange props
