---
title: "When the editor's three columns sit side by side, the editor fills the viewport and each column scrolls on its own"
type: decision
project: captivator
ticket: T-036
decided_by: ticket-planner
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, layout]
---
# When the editor's three columns sit side by side, the editor fills the viewport and each column scrolls on its own

## Context
The T-029 checklist found the preview sliding down the page when the Unsplash results load. The spec's *Editor UI* says only "three columns … under a top bar, stacking on narrow screens with `flex-wrap`, exactly as on the canvas", and the canvas's `Main` artboard is a fixed 1440 × 1040 frame (`min-height: 1040px`, columns `align-items: stretch`, no overflow rules), so neither says how the editor behaves when a column outgrows the window. The current page-flow layout stretches every column to the tallest one, and `PreviewStage` centres the phone in that taller column. The main session's diagnosis also proposed the breakpoint as "min-width 1053px, matching `max-[1052px]`".

## Decision
- At the width where the columns sit side by side, the editor is viewport-tall (`h-dvh`), the row is `min-h-0`, and all three column wrappers (block list, stage `<main>`, inspector) get `overflow-y-auto`. The stage scrolls too, because the 760px phone frame plus the switcher and notes is taller than many laptop windows.
- Below that width the stacked page-flow layout is unchanged; inner scroll areas in a stacked single column would nest scrollers on a phone.
- The breakpoint is written as `min-[1052px]:`, the exact complement of Tailwind v4's `max-[1052px]:` (`width < 1052px` vs `width >= 1052px`), rather than 1053px, which is the complement under Tailwind v3's `max-width` semantics and would leave the inspector's wrap styles and the scroll styles both off at exactly 1052px.
- All changes stay in `page.tsx`'s `Layout`, which already owns column sizing (`T-008-landmarks-are-siblings.md`), so the skeleton matches. `PreviewStage.tsx` is in `touches` only as a fallback if its centring needs a safe-centre fix.

## Alternatives
- **Sticky stage (`sticky top-0 self-start`) in a page-flow layout:** the phone frame is often taller than the window, so a sticky stage would hide its own bottom, and the inspector and block list would still scroll the whole page together.
- **Only the inspector scrolls:** a long block list (many blocks) would reproduce the same push-down.
- **Top-align the stage (drop `justify-center`):** stops the slide but leaves the preview scrolled away while the customer works far down a long inspector, and departs from the canvas's centred stage.
- **Use 1053px as suggested:** a 1px gap at 1052px under Tailwind v4.

## Consequences
- The page itself no longer scrolls at ≥1052px; anything later added below the three columns must live inside one of them. Absolutely placed popovers inside the inspector (`ColourField`) are reached by scrolling the inspector, and dnd-kit auto-scrolls the block list's scroller.
- jsdom can't lay out, so the unit test asserts the class contract and the visual check is a re-run of the failed T-029 item.
- If a column's flex basis changes, the 1052px number changes in both the wrap and scroll variants.
