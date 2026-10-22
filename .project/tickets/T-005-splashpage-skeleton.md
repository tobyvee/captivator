---
title: "T-005: SplashPage skeleton with text and image blocks"
type: ticket
project: captivator
status: done
priority: P0
milestone: 2
estimate: 15
depends_on: [T-001]
touches:
  - src/splash/SplashPage.tsx
  - src/splash/blocks/TextBlock.tsx
  - src/splash/blocks/ImageBlock.tsx
  - src/splash/Background.tsx
  - src/splash/Form.tsx
  - src/splash/TermsSheet.tsx
  - src/splash/Connected.tsx
  - src/splash/SplashPage.test.tsx
cut_rank:
updated: 2026-10-22
tags: [project, captivator, ticket, splash, security]
---
# T-005: SplashPage skeleton with text and image blocks

## Context
Build step 2 ([spec → Splash renderer](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md): *Render mode*, *Layout*, *Blocks*). `SplashPage` is the one renderer behind the editor preview, the picker thumbnails, the fit check and Export HTML. This ticket owns `SplashPage.tsx` outright: it writes the full composition and creates every child component as a stub with its final props, so T-006 (Background), T-007 (Form), T-021 (TermsSheet) and T-022 (Connected) each replace only their own file. Canvas artboard: `StateLanding` (`project/StateLanding.dc.html`). Decisions: [`T-005-splashpage-skeleton-creates-stubs.md`](../decisions/T-005-splashpage-skeleton-creates-stubs.md), [`general-splashpage-callback-props.md`](../decisions/general-splashpage-callback-props.md), [`general-splashpage-render-mode.md`](../decisions/general-splashpage-render-mode.md), [`general-splash-root-grows-in-frame.md`](../decisions/general-splash-root-grows-in-frame.md), [`general-minimum-ios-version.md`](../decisions/general-minimum-ios-version.md).

## Scope
- `SplashPage.tsx`: full layout, screen composition, render modes and edit-mode selection chrome (Notes).
- `blocks/TextBlock.tsx` and `blocks/ImageBlock.tsx`: complete.
- Stubs with final signatures, each rendering `null`: `Background.tsx`, `Form.tsx`, `TermsSheet.tsx`, `Connected.tsx`. Write a one-line comment in each naming the ticket that replaces it.
- `SplashPage.test.tsx` (`// @vitest-environment jsdom`, Testing Library). This is one of the two allowed jsdom files; T-007's `Form.test.tsx` is the other.
- **Out of scope:** background layers (T-006), form markup and mode attributes (T-007), the terms sheet (T-021), error state and Connected (T-022), the export wrapper and its `<style>` block (T-023).

## Acceptance criteria
- [x] Text blocks render in array order. The first heading is an `h1`, later headings are `h2`, and subheadings and body are `p` (test).
- [x] `edit` and `preview` modes render no `cv-root` class; `export` renders `class="cv-root"` on the root (test).
- [x] In `edit` mode, clicking a block calls `onSelect({ kind: "block", id })`, and the selected block shows an outline and a name chip. Clicking the page background calls `onSelect({ kind: "background" })` (test for the block click).
- [x] **Security:** a text block containing `<img src=x onerror=alert(1)>` renders as text, with no `img` element created (test). There's no `dangerouslySetInnerHTML` anywhere in `src/splash/`.
- [x] `src/splash/` imports nothing from `next/*`, `src/editor/` or `src/lib/store.ts`, and uses inline styles only (no Tailwind classes; the only class name is `cv-root` in export mode).
- [x] Content uses no absolute positioning or fixed heights. The only exception is the edit-only name chip.
- [x] `npm test` and `npx tsc --noEmit` pass.

## Dependencies
- T-001: `Screen`, `RenderMode`, `Selection` and block types from `src/lib/types.ts`; Testing Library and jsdom.

## Notes
**Props** (exported types; the stubs must match exactly):

```ts
export type SplashPageProps = {
  design: Design; screen: Screen; mode: RenderMode;
  compact?: boolean; inFrame?: boolean;
  selection?: Selection;                 // edit: outline + name chip
  onSelect?: (s: Selection) => void;     // edit only
  onScreenChange?: (s: Screen) => void;  // edit/preview: sheet open/close, Connect
};
// Background.tsx
export function Background(p: { background: BackgroundSpec; mode: RenderMode }): JSX.Element | null;
// Form.tsx
export function Form(p: { design: Design; mode: RenderMode; screen: Screen;
  onSelect?: (s: Selection) => void; onScreenChange?: (s: Screen) => void }): JSX.Element | null;
// TermsSheet.tsx
export function TermsSheet(p: { design: Design; mode: RenderMode; onClose?: () => void }): JSX.Element | null;
// Connected.tsx
export function Connected(p: { design: Design; mode: RenderMode; onContinue?: () => void }): JSX.Element | null;
// blocks
export function TextBlock(p: { block: TextBlockSpec; as: "h1" | "h2" | "p" }): JSX.Element;
export function ImageBlock(p: { block: ImageBlockSpec }): JSX.Element;
```

**Layout:**
- **Root:** `position: relative; display: flex; flex-direction: column; box-sizing: border-box`, with font family `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
  - `inFrame` → `min-height: 100%`, with no overflow of its own; the editor frame scrolls ([`general-splash-root-grows-in-frame.md`](../decisions/general-splash-root-grows-in-frame.md), which superseded `height: 100%; overflow-y: auto`).
  - `export` → `className="cv-root"` (the min-height pair is in the export `<style>`, T-023).
  - No min-height otherwise, so in `preview` without `inFrame` the root's height is the natural content height. The fit check (T-028) relies on this.
- **Column:** `position: relative; z-index: 1; flex: 1 0 auto; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 18px; max-width: 420px; margin: 0 auto; padding: 56px 28px 40px; box-sizing: border-box; text-align: center`.
- **Order:** blocks in array order, then a spacer `<div aria-hidden style={{ flex: 1 }} />` (omitted when `compact`), then `<Form>`.

**Screens:**
- `landing`: `<Background>` + column.
- `terms`: if `design.form.terms.mode === "checkbox"` and mode isn't `export`, the landing composition wrapped with `aria-hidden` and `inert` + `<TermsSheet onClose={() => onScreenChange?.("landing")}>`. If terms are off, plain landing.
- `error`: landing, with `<Form screen="error">`.
- `connected`: `<Background>` + `<Connected onContinue={() => onScreenChange?.("landing")}>` in place of the column.
- `export` mode with terms on: the landing composition plus `<TermsSheet mode="export">` after the column (hidden by CSS until `:target`).

**Modes:**
- `edit`: each block is wrapped in a `div` (`position: relative`, `max-width: 100%`) with an `onClick` that calls `onSelect`. When `selection` matches, add `outline: 2px solid #2563EB; outline-offset: 4px` and a chip (`position: absolute; top: -24px; left: 0`, blue `#2563EB` background, white 11px/600 text: "Heading", "Subheading", "Text" or "Image"). The root, column and spacer call `onSelect({ kind: "background" })` only for clicks on themselves (`e.target === e.currentTarget`), so children never need to stop propagation ([`T-005-background-select-on-own-target.md`](../decisions/T-005-background-select-on-own-target.md)).
- `preview`: block wrappers get `pointer-events: none`; no selection chrome.
- `export`: no wrappers, no handlers.

**Blocks** (spec *Blocks*):
- **TextBlock:** `margin: 0; font-size: {size}px; color: {colour}; font-weight: heading 800, subheading 500, body 400; line-height: heading 1.15, others 1.4; white-space: pre-line; overflow-wrap: anywhere; max-width: 100%`.
- **ImageBlock:** `<img src alt>` with `display: block; height: S 72px / M 120px / L 168px; width: auto; max-width: 100%; object-fit: contain` (`max-width` from review finding 20).

`compact` and `inFrame` change layout only; `mode` is the only thing that changes markup.

**Outcome (2026-10-22):**
- The security audit had no findings. The splash audit had no failures.
- The code review required changes, fixed in `5d92597`:
  - The background is selected only when the root, column or spacer is clicked itself.
  - The hidden-landing test now proves the content renders but is hidden.
  - The import guard also catches side-effect, dynamic, `require` and CSS imports, and bans `srcDoc`.
  - The landing behind the open terms sheet is `inert`.
  - With `inFrame`, the root grows with its content and the editor frame scrolls. The user decided this ([`general-splash-root-grows-in-frame.md`](../decisions/general-splash-root-grows-in-frame.md)); T-009's scope is updated.
- The re-review approved it. Its record-keeping should-fixes produced [`T-021-dim-layer-closes-sheet.md`](../decisions/T-021-dim-layer-closes-sheet.md) and [`T-022-connected-clicks-fall-through.md`](../decisions/T-022-connected-clicks-fall-through.md), both noted on those tickets.
- **Low findings, not fixed:**
  - *Empty heading* (splash audit): a heading whose text is cleared renders an empty `<h1>` in preview and export. Skipping empty text blocks there would add a mode difference to the spec's Render mode table, so it's left for a later decision. T-013's Text panel could stop the customer clearing a heading instead.
  - *Unique block ids* (splash audit): `Design` doesn't require block ids to be unique. A hand-edited design with two blocks sharing an id renders duplicate React keys, and both blocks could become `h1`. `design-schema.ts` belongs to the finished T-001, so this belongs in a schema follow-up. T-004's store should still generate unique ids.
  - *Review nits:* the column lookup in one test uses `parentElement` chains, and the sink scan's `dangerouslySetInnerHTML` alternative is redundant with `innerHTML`.

## Decisions
- [`T-005-background-select-on-own-target.md`](../decisions/T-005-background-select-on-own-target.md): Edit mode selects the background only for clicks on the root, column or spacer themselves
- [`T-005-landing-under-sheet-inert.md`](../decisions/T-005-landing-under-sheet-inert.md): The landing page under the open terms sheet is an unpositioned flex wrapper with aria-hidden and inert
- [`T-005-splash-portability-guard-tests.md`](../decisions/T-005-splash-portability-guard-tests.md): SplashPage tests guard the portability and no-HTML-injection rules for every file in src/splash
- [`T-005-terms-screen-unpositioned-wrapper.md`](../decisions/T-005-terms-screen-unpositioned-wrapper.md): The landing page under the open terms sheet sits in an unpositioned flex wrapper with aria-hidden (superseded)
- [`T-021-dim-layer-closes-sheet.md`](../decisions/T-021-dim-layer-closes-sheet.md): Clicking the terms sheet's dim layer closes the sheet in edit and preview
- [`T-022-connected-clicks-fall-through.md`](../decisions/T-022-connected-clicks-fall-through.md): The Connected screen's column lets clicks on empty space fall through to the root
- [`T-005-splashpage-skeleton-creates-stubs.md`](../decisions/T-005-splashpage-skeleton-creates-stubs.md): The SplashPage skeleton owns composition and creates every child component as a stub
- [`general-minimum-ios-version.md`](../decisions/general-minimum-ios-version.md): The guest page targets iOS 15.4 and newer
- [`general-splash-root-grows-in-frame.md`](../decisions/general-splash-root-grows-in-frame.md): In the editor frames the splash root grows with its content, and the frame scrolls (supersedes `general-root-min-height-in-export-style.md`)
- [`general-splashpage-callback-props.md`](../decisions/general-splashpage-callback-props.md): SplashPage takes selection, onSelect and onScreenChange props
- [`general-splashpage-render-mode.md`](../decisions/general-splashpage-render-mode.md): SplashPage takes a render mode of edit, preview or export
