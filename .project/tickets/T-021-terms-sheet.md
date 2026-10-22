---
title: "T-021: Terms sheet for the preview and the no-JS export"
type: ticket
project: captivator
status: done
priority: P1
milestone: 6
estimate: 15
depends_on: [T-003, T-005]
touches:
  - src/splash/TermsSheet.tsx
  - src/splash/TermsSheet.test.tsx
  - src/splash/SplashPage.tsx
  - src/splash/SplashPage.test.tsx
cut_rank:
updated: 2026-10-23
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
- [x] A body of `"A\n\nB"` renders two `<p>` elements (test).
- [x] **Security:** a body containing `<script>alert(1)</script>` renders as escaped text, with no `<script>` element in the output (test).
- [x] Export mode renders `id="terms"`, `class="cv-terms"`, close links with `href="#"`, and no inline `display` on the section (test). *Close links target `#cv-terms-link` instead ([`T-021-close-to-terms-link.md`](../decisions/T-021-close-to-terms-link.md)).*
- [x] Edit and preview modes render buttons for × and CLOSE, not links (test).
- [x] When the first heading fails 4.5:1 on the sheet colour, the title and body use `bestTextColour` (test); with no heading at all, likewise. *Falls back to `#000000` when that still fails ([`T-021-sheet-text-black-fallback.md`](../decisions/T-021-sheet-text-black-fallback.md)).*
- [x] Inline styles only; the only class name is `cv-terms` (export).
- [x] `npm test` and `npx tsc --noEmit` pass.

## Dependencies
- T-003: `contrastRatio`, `bestTextColour`.
- T-005: the stub's props, and the root it's positioned in (`position: relative`).

## Outcome
- **Built:** `TermsSheet` in every mode: a fixed overlay with a dim layer and an 82% sheet; plain-text paragraphs; × and CLOSE (Connect's own style) as buttons in the editor and as `#cv-terms-link` fragment links in the export; a focusable `#terms` dialog for `:target`. Fixes in `7f3e187` and the record commit. 307 tests pass; `tsc` and lint are clean.
- **Review:** approved with should-fixes on both passes, all fixed. CLOSE uses `connectButtonStyle`. SplashPage's class guard now covers a terms-on export ([`T-021-widens-splashpage-guard.md`](../decisions/T-021-widens-splashpage-guard.md)). The sheet uses one viewport geometry in every mode ([`T-021-fixed-sheet-in-every-mode.md`](../decisions/T-021-fixed-sheet-in-every-mode.md)). `aria-modal` is set in the export only ([`T-021-aria-modal-export-only.md`](../decisions/T-021-aria-modal-export-only.md)). Two stale comments in `SplashPage.tsx` were corrected.
- **Splash audit:** the first pass failed on two contrast edge cases (sheet body on mid-greys; outline CLOSE on a photo backdrop). It also had should-fixes for closing to the top, the export dim layer, export modality and keyboard access to the body. All were fixed, and the re-audit passed, including a contrast sweep over 162,072 sheets and a no-JS headless-Chrome run.
- **Security:** no findings.

## Notes
- **Follow-ups on other tickets:** T-022 adds `id={TERMS_LINK_ID}` to the export terms link, so closing returns focus there; until then, closing clears `:target` without scrolling. T-009's frames must be the containing block for the fixed sheet (criterion added). T-023 ships the `.cv-terms` `:target` rule.
- **Low, accepted:** the no-JS export can't make the landing inert behind the open sheet, so Shift+Tab reaches the form; `aria-modal` covers VoiceOver. The version line at 70% opacity can fall below 4.5:1 on some sheets; it's metadata (7.1–7.5:1 on both templates).
- **Preview-only, for T-009 to judge:** opening the Terms screen re-mounts the landing inside the inert wrapper (`SplashPage.tsx`), so values typed into the preview's fields are cleared. Guests aren't affected.

## Decisions
- [`T-021-dim-layer-closes-sheet.md`](../decisions/T-021-dim-layer-closes-sheet.md): Clicking the terms sheet's dim layer closes the sheet in edit and preview
- [`T-005-splashpage-skeleton-creates-stubs.md`](../decisions/T-005-splashpage-skeleton-creates-stubs.md): The SplashPage skeleton owns composition and creates every child component as a stub
- [`T-007-outline-button-colours.md`](../decisions/T-007-outline-button-colours.md): An outline Connect button uses bg as its border and fg as its text
- [`general-guest-screen-fallbacks.md`](../decisions/general-guest-screen-fallbacks.md): Sponsor, Terms sheet and Error screen behaviour is defined from existing schema fields
- [`general-splash-root-grows-in-frame.md`](../decisions/general-splash-root-grows-in-frame.md): In the editor frames the splash root grows with its content, and the frame scrolls (supersedes `general-root-min-height-in-export-style.md`)
- [`general-splashpage-callback-props.md`](../decisions/general-splashpage-callback-props.md): SplashPage takes selection, onSelect and onScreenChange props
- [`T-021-cv-terms-second-export-class.md`](../decisions/T-021-cv-terms-second-export-class.md): the export sheet carries a second class, `cv-terms`
- [`T-021-fixed-title-id-no-hooks.md`](../decisions/T-021-fixed-title-id-no-hooks.md): the sheet uses a fixed title id and no hooks
- [`T-021-one-text-colour-for-sheet.md`](../decisions/T-021-one-text-colour-for-sheet.md): one text colour for the sheet (superseded by the black fallback)
- [`T-021-sheet-text-black-fallback.md`](../decisions/T-021-sheet-text-black-fallback.md): sheet text falls back to black when neither near-black nor white reaches 4.5:1
- [`T-021-outline-close-uses-sheet-text.md`](../decisions/T-021-outline-close-uses-sheet-text.md): an outline CLOSE uses the sheet text colour when its fg fails on the sheet
- [`T-021-close-to-terms-link.md`](../decisions/T-021-close-to-terms-link.md): close links target `#cv-terms-link`, and T-022 adds the id
- [`T-021-fixed-sheet-in-every-mode.md`](../decisions/T-021-fixed-sheet-in-every-mode.md): the sheet is `position: fixed` in every mode; the editor frames contain it
- [`T-021-widens-splashpage-guard.md`](../decisions/T-021-widens-splashpage-guard.md): T-021 widens the SplashPage class guard as a one-off touches exception
- [`T-021-aria-modal-export-only.md`](../decisions/T-021-aria-modal-export-only.md): the sheet is aria-modal only in the export
