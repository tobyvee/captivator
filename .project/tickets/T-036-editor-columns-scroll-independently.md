---
title: "T-036: Editor columns scroll independently, so the preview stays put"
type: ticket
project: captivator
status: done
priority: P1
milestone: 9
estimate: 15
depends_on: []
touches:
  - src/app/editor/page.tsx
  - src/editor/editor.test.tsx
  - src/editor/PreviewStage.tsx
  - src/editor/controls/ColourField.tsx
  - src/editor/controls/ColourField.test.tsx
cut_rank:
updated: 2026-10-23
tags: [project, captivator, ticket, editor]
---
# T-036: Editor columns scroll independently, so the preview stays put

## Context
A failure from the real-phone checklist ([T-029](T-029-real-phone-checklist.md)): "When the Unsplash photo results are loaded, the main window with the captive portal design preview gets pushed down the page." The editor's `Layout` in `src/app/editor/page.tsx` is `flex min-h-screen flex-col`, with a wrapping row of three columns (`items-stretch`). `PreviewStage` centres its content (`justify-center`) in a column that stretches to the tallest column. When the inspector grows past the viewport (the Unsplash results grid, or any long panel), the row gets taller than the window and the phone is centred in that taller column, so it slides down out of view. The fix: when the three columns sit side by side, the editor fills the viewport and each column scrolls on its own. [Spec → Editor UI](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md) ("three columns … under a top bar, stacking on narrow screens with `flex-wrap`"); canvas artboard `Main` (`project/Main.dc.html`), which is a fixed 1440 × 1040 artboard and doesn't show scrolling. Decisions: [`T-036-columns-scroll-when-side-by-side.md`](../decisions/T-036-columns-scroll-when-side-by-side.md), [`T-036-checklist-fix-at-milestone-9.md`](../decisions/T-036-checklist-fix-at-milestone-9.md), [`T-008-landmarks-are-siblings.md`](../decisions/T-008-landmarks-are-siblings.md) (the page owns every column's sizing, and only the stage is `<main>`), [`T-028-probe-clips-to-zero-height.md`](../decisions/T-028-probe-clips-to-zero-height.md) (the fit probe must stay out of every scroll area).

## Scope
- **`src/app/editor/page.tsx`, `Layout` only**, at the width where the three columns sit side by side (the exact complement of the existing `max-[1052px]` wrap; see Notes):
  - The outer column fills the viewport exactly (`h-dvh`) instead of growing past it, so the page itself doesn't scroll. The top bar keeps its natural height.
  - The row takes the remaining height and can shrink below its content (`min-h-0` alongside `grow`).
  - Each of the three column wrappers (block list `<div>`, stage `<main>`, inspector `<div>`) scrolls vertically on its own (`overflow-y-auto`), so a long inspector or block list scrolls inside its column and the stage doesn't move.
  - The stage column still centres the preview vertically when it fits, and scrolls from the top (switcher first, never clipped above) when it doesn't, e.g. the 760px phone frame on a laptop screen.
- **Below that width,** nothing changes: the current page-flow stacking (`min-h-screen`, wrapping row, the inspector's `max-[1052px]` row and top border, the `max-md` full-width side columns) stays exactly as it is, and the page scrolls as one.
- The skeleton shares `Layout`, so it gets the same behaviour without its own change.
- **`src/editor/PreviewStage.tsx`:** edit only if the stage's centring needs it (see Notes). Leave it untouched if the page's classes are enough.
- **Tests** in `src/editor/editor.test.tsx` (see acceptance criteria).
- **Out of scope:** the template picker (`src/app/page.tsx`) keeps its page-flow layout; `ColourField`'s popover placement (T-010's file); any panel's content; the column widths and flex bases.

## Acceptance criteria
- [ ] At ≥1052px wide (side by side), the preview stage doesn't move when the inspector grows past the viewport: with Background → Photo selected and Unsplash results loaded (or any panel taller than the window), the phone frame stays where it was and the page itself doesn't scroll. *Checked by eye in a real browser; jsdom can't lay out.*
- [x] At ≥1052px, the block list, the stage and the inspector each scroll independently with the mouse wheel, trackpad and keyboard focus (tabbing to a control below a column's fold scrolls that column, not the page).
- [x] At ≥1052px on a short window (e.g. 1280 × 720), the stage scrolls to show the whole phone frame, and its top (the screen switcher) is reachable, not clipped above the column.
- [x] Below 1052px, the stacked layout is unchanged: the inspector wraps onto its own row with a top border, below `md` every column is full width, and the page scrolls as one with no inner scroll areas.
- [x] There's no 1px band at the breakpoint where both or neither of the wrap styles and the scroll styles apply (the two variants are exact complements).
- [ ] Opening a `ColourField` popover near the bottom of the inspector leaves it reachable by scrolling the inspector; dragging a block by its handle still works and auto-scrolls the block list when it scrolls; the export toast (fixed) still shows at the window's bottom right; the fit probe adds no scroll to any column.
- [x] `src/editor/editor.test.tsx` gains a test that, for both the editor and the skeleton, the outer column carries the viewport-height class at the side-by-side breakpoint, the row carries `min-h-0`, and each of the three column wrappers carries the scroll class, while the narrow classes (`min-h-screen`, `flex-wrap`, the inspector's `max-[1052px]:` classes) are still present. The existing landmarks test still passes.
- [x] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.
- [ ] *(Main session, not the implementer, which can't write `.project/review/`.)* Once deployed, re-run the failed T-029 item (Unsplash search in the Photo tab) and record the pass in `.project/review/phone-checklist.md` next to this ticket's ID.

## Dependencies
None open. T-008 (done) created `Layout` and `editor.test.tsx`; T-009 (done) built `PreviewStage`; T-032 (done) added the Unsplash results grid that exposed the bug.

## Outcome
When the three columns sit side by side (from 1052px), the editor fills the window and the block list, stage and inspector each scroll on their own, so a long inspector (such as Unsplash results) no longer pushes the preview down. The row stops wrapping at that width, each column reserves its scrollbar gutter (`both-edges` on the stage, so the phone stays centred), and the narrow stacked layout is unchanged. `ColourField`'s outside-press handler now ignores a press on a scroll container's scrollbar, so dragging the inspector's scrollbar doesn't close an open popover. Commits 750fc0a, 4324957, 9a4106c and fa0b1cf. 879 tests pass, and `tsc` and lint are clean. The layout was checked in headless Chrome with the compiled CSS and placeholder content (1280 × 720 with a 3000px inspector, a phone taller than the column, 1052px and 1051px), not in the real app.

## Notes
- **Unticked until checked in a real browser after deploy:** the real-app check that the stage stays put with Unsplash results loaded (criterion 1), the popover, block drag auto-scroll and toast checks (criterion 6, reasoned through in review but not run), and the T-029 Unsplash re-run (criterion 9).
- **From review:** overlay scrollbars (the macOS default) take no space, so pressing one still closes an open popover, as before. A press in the stage's empty `both-edges` gutter keeps it open, which is harmless.
- **Breakpoint.** Tailwind v4's `max-[1052px]:` compiles to `@media (width < 1052px)` and `min-[1052px]:` to `@media (width >= 1052px)`, so `min-[1052px]:` is the exact complement of the existing wrap styles: side by side means ≥1052px (272 + 480 + 300 = 1052, the flex bases' sum). Check the compiled CSS once; if the build's semantics differ, pick whichever variant leaves no gap or overlap with `max-[1052px]:`. If a column's flex basis ever changes, both numbers change together ([`T-008-landmarks-are-siblings.md`](../decisions/T-008-landmarks-are-siblings.md)).
- **Current classes** (in `page.tsx`): outer `flex min-h-screen flex-col`; row `flex grow flex-wrap items-stretch`; `SIDE = "flex flex-col bg-white border-zinc-200 max-md:max-w-none max-md:border-b"`; blocks `${SIDE} flex-[1_1_272px] max-w-[300px] md:border-r`; stage `flex flex-col flex-[1_1_480px] min-w-0`; inspector `${SIDE} flex-[1_1_300px] max-w-[340px] border-l max-[1052px]:max-w-none max-[1052px]:border-l-0 max-[1052px]:border-t`.
- **Centring without top-clipping.** `PreviewStage`'s root is `<section className="flex min-w-0 flex-1 flex-col items-center justify-center …">`. Inside a `flex flex-col overflow-y-auto` `<main>`, `flex-1` lets the section fill the column when its content is shorter, and its `min-height: auto` makes it grow to its content when taller, so the `<main>` scrolls from the top and `justify-center` never pushes the switcher above the scroll origin. If that holds, `PreviewStage.tsx` needs no change. If it doesn't (e.g. the section ends up height-capped), give the section `my-auto`/`min-h-full` or use `justify-center-safe` there rather than anything in the column wrapper.
- **`overflow-y: auto` makes `overflow-x` compute to `auto`.** Check at 1052px in Desktop preview that the stage shows no horizontal scrollbar (the browser frame is fluid and the phone frame is 395px wide inside a ≥480px column). Add `overflow-x-hidden` only if one appears.
- **Fit probe.** `useFitCheck`'s probe is `position: absolute; left: -10000px; top: 0; height: 0; overflow: hidden` and nothing above it is positioned. Don't add `relative` to the stage wrapper; the probe must stay out of the column's scroll area ([`T-028-probe-clips-to-zero-height.md`](../decisions/T-028-probe-clips-to-zero-height.md)).
- **`h-dvh` vs `min-h-screen`.** On desktop browsers `100dvh` equals `100vh`. Either swap `min-h-screen` for `h-dvh` at the breakpoint (`min-[1052px]:h-dvh` with `min-[1052px]:min-h-0`), or keep `min-h-screen` and add `h-dvh`; both give a viewport-tall editor. The narrow layout keeps `min-h-screen` unprefixed.
- **Landmarks stay as they are:** `<div row><div blocks/><main stage/><div inspector/></div>`; the scroll classes go on those wrappers, not on the components' own `<aside>`/`<section>` landmarks.
- Scrollable columns hold focusable controls, so they meet the keyboard-scrollable-region rule without a `tabindex`.
- Canvas look is unchanged: page `#F4F4F5`, white side columns with `#E4E4E7` borders. The side columns' white surface must still reach the bottom of the window when their content is short (the wrapper fills the row's height; the scroll is inside it).

## Decisions
- [`T-036-columns-scroll-when-side-by-side.md`](../decisions/T-036-columns-scroll-when-side-by-side.md): Columns scroll on their own when side by side; narrow widths keep the stacked layout
- [`T-036-checklist-fix-at-milestone-9.md`](../decisions/T-036-checklist-fix-at-milestone-9.md): Fixes found by the phone checklist are milestone 9 tickets
- [`T-036-row-stops-wrapping-when-side-by-side.md`](../decisions/T-036-row-stops-wrapping-when-side-by-side.md): The row stops wrapping from 1052px, and `min-h-screen` gives way to `h-dvh` there
- [`T-036-reserve-scrollbar-gutter.md`](../decisions/T-036-reserve-scrollbar-gutter.md): Each column reserves its scrollbar gutter, `both-edges` on the stage
- [`T-036-colour-field-added-to-touches.md`](../decisions/T-036-colour-field-added-to-touches.md): T-036 takes ColourField into its touches
- [`T-036-popover-ignores-scrollbar-press.md`](../decisions/T-036-popover-ignores-scrollbar-press.md): The popover ignores a press on a scrollbar (superseded)
- [`T-036-scrollbar-press-needs-scroll-container.md`](../decisions/T-036-scrollbar-press-needs-scroll-container.md): Only a scroll container or the root can take a scrollbar press
