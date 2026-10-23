---
title: "Each editor column is positioned when side by side, so hidden text below its fold stays inside it"
type: decision
project: captivator
ticket: T-041
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, layout]
---
# Each editor column is positioned when side by side, so hidden text below its fold stays inside it

## Context
After T-036, the user reported that on desktop "after the unsplash previews have loaded the whole page scrolls past the viewport". Visually hidden status lines (Tailwind `sr-only`, which is `position: absolute`) had no positioned ancestor. Their containing block was the page, not the scrolling column, so one sitting below a column's fold made the document taller than the window. Two did this:
- **Inspector:** the Unsplash results status, which becomes `sr-only` once results load.
- **Stage:** the readability status under the phone, in a window shorter than the phone frame.

## Decision
From 1052px, each of the three column wrappers is `relative` as well as `overflow-y-auto`. Hidden text then belongs to its own column's scroll area.
- Measured in Chrome at 1440 × 900: the document went from 933px to 900px.
- The fit probe (zero height, at `left: -10000px`) adds no horizontal scroll to the stage. It still sits outside every scroll area, as [`T-028-probe-clips-to-zero-height.md`](T-028-probe-clips-to-zero-height.md) requires.

## Alternatives
- **`relative` on each hidden element's own parent:** fixes today's two cases but not the next one.
- **`relative overflow-hidden` on the editor's outer box:** a focused visually hidden control, such as the upload input, could scroll that box programmatically and shift the whole editor.

## Consequences
An absolute element inside a column now positions against that column. None of today's do: the popovers and the focus grid have their own `relative` parents. Below 1052px nothing changes.
